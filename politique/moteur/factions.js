/* Politique : factions (M2). e.factions[f] = { colere, puissance, statut } ; e.moral = moral du pays (0 à 1).
   statut : "calme" | "grondement" | "greve" | "revolte" | "revolution" (calculé en fin de tour, utilisé au tour suivant).
   Révolution : dès que la colère touche 100 dans le tour (e.issue), la partie est perdue en fin de tour.
   Chocs à l'adoption d'une loi (Lois.adopter → choc), apaisement (action), effets par tour et dissipation (fin de tour). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const { FACTIONS, REGLES_FACTIONS: R } = NODE ? require("../donnees/factions.js") : racine.Politique.FACTIONS;
const { LOIS, GROUPES } = NODE ? require("../donnees/lois.js") : racine.Politique.LOIS;
const ECO = NODE ? require("../donnees/economie.js") : racine.Politique.ECONOMIE;

const borne = x => Math.max(R.bornes.min, Math.min(R.bornes.max, Math.round(x * 100) / 100));

// factions favorisées par le suffrage en vigueur (apaisement à moitié prix, hausses ralenties)
function favorisees(e){
  const l = e.lois.libertes, f = l && LOIS[l.id].factions.faveur;
  return f ? GROUPES[f] : [];
}

// ajoute d à la colère ou à la puissance (hausse de colère ralentie pour une faction favorisée)
function modifier(e, f, jauge, d){
  if (jauge === "colere" && d > 0 && favorisees(e).includes(f)) d *= R.ralentissement;
  e.factions[f][jauge] = borne(e.factions[f][jauge] + d);
  // la révolution éclate dès que la colère touche 100, même si la dissipation la fait redescendre avant la fin du tour
  if (jauge === "colere" && e.factions[f].colere >= R.seuils.revolution && R.revolutionFin && !e.issue) e.issue = { type: "revolution", faction: f };
}

// chocs ponctuels d'une loi adoptée
function choc(e, id){
  const c = LOIS[id].factions.chocs || {};
  for (const f in c) for (const j in c[f]) modifier(e, f, j, c[f][j]);
}

const coutApaisement = (e, f) => R.apaisement.cout * (favorisees(e).includes(f) ? R.apaisement.demiPrix : 1);

// une fois par faction et par tour, si la colère n'est pas déjà nulle et que le trésor suffit
const apaisables = e => Object.keys(FACTIONS).filter(f =>
  !(e.apaises || []).includes(f) && e.factions[f].colere > 0 && e.tresor >= coutApaisement(e, f));

function apaiser(e, f){
  const cout = coutApaisement(e, f);
  e.tresor = Math.round((e.tresor - cout) * 100) / 100;
  modifier(e, f, "colere", R.apaisement.colere);
  (e.apaises = e.apaises || []).push(f);
  e.journal.push(`${FACTIONS[f].nom} apaisés (${cout} or).`);
}

function statutDe(x){
  if (x.colere >= R.seuils.revolution) return "revolution";
  if (x.puissance >= R.revolte.puissance && x.colere >= R.revolte.colere) return "revolte";
  if (x.colere >= R.seuils.greve) return "greve";
  if (x.colere >= R.seuils.grondement) return "grondement";
  return "calme";
}

function moralFaction(x){
  if (x.statut === "revolte" || x.statut === "revolution") return 0;
  let m = x.colere <= R.moral.calme ? 1 : Math.max(0, (100 - x.colere) / (100 - R.moral.calme));
  if (x.statut === "greve") m = Math.min(m, R.moral.plafondGreve);
  return m;
}

function moral(e){
  let s = 0, p = 0;
  for (const f in e.factions){ const x = e.factions[f]; s += x.puissance * moralFaction(x); p += x.puissance; }
  return p > 0 ? Math.round(s / p * 10000) / 10000 : 1;
}

// statuts et moral (début de partie et fin de chaque tour) ; une révolution termine la partie
function evaluer(e){
  for (const f in e.factions){
    const x = e.factions[f], avant = x.statut;
    x.statut = statutDe(x);
    if (avant && x.statut !== avant && x.statut !== "calme") e.journal.push(`${FACTIONS[f].nom} : ${x.statut === "greve" ? "grève" : x.statut === "revolte" ? "révolte" : x.statut} !`);
    if (x.statut === "revolution" && R.revolutionFin && !e.issue) e.issue = { type: "revolution", faction: f };
  }
  if (e.issue && e.issue.type === "revolution" && !e.fin){
    e.fin = true;
    e.journal.push(`Révolution ! Les ${FACTIONS[e.issue.faction].nom.toLowerCase()} renversent le gouvernement.`);
  }
  e.moral = moral(e);
}

// couverture du panier d'une faction : moyenne, sur ses biens, de production / consommation du pays (au plus 1 ; rien à
// consommer = couvert), d'après l'économie du tour
function couverture(e, f){
  const b = e.bilan, panier = R.niveauDeVie.paniers[f];
  if (!b || !panier || !panier.length) return 1;
  const c = panier.map(x => b.consommation[x] > 0 ? Math.min(1, b.production[x] / b.consommation[x]) : 1);
  return Math.round(c.reduce((s, x) => s + x, 0) / c.length * 1000) / 1000;
}

// fin de tour : effets par tour des lois, niveau de vie (V1 : dissipation), statuts, moral
function finDeTour(e){
  for (const cat in e.lois){
    const l = e.lois[cat], fx = LOIS[l.id].factions, duree = fx.dureeParTour || {};
    for (const f in fx.parTour || {}) for (const j in fx.parTour[f])
      if (duree[j] == null || e.tour - l.depuis < duree[j]) modifier(e, f, j, fx.parTour[f][j]);
  }
  for (const f in e.factions){
    let k = 1;
    for (const cat in e.lois){ const x = (LOIS[e.lois[cat].id].factions.dissipation || {})[f]; if (x) k *= x; }
    if (!R.niveauDeVie.actif){ modifier(e, f, "colere", -R.dissipation * k); continue; }   // V1
    // niveau de vie (V2) : l'aise apaise (2× plus vite avec le code du travail pour les ouvriers), la gêne fâche
    const c = couverture(e, f), N = R.niveauDeVie;
    (e.niveauDeVie = e.niveauDeVie || {})[f] = c;
    if (c >= N.seuilAise) modifier(e, f, "colere", N.aise * k);
    else if (c < N.seuilGene) modifier(e, f, "colere", N.gene);
  }
  // V2 budget : le niveau d'imposition et la faillite pèsent sur toutes les factions
  const niv = ECO.niveauxImpot[e.impots || "normal"].colere;
  for (const f in e.factions){
    if (niv) modifier(e, f, "colere", niv);
    if (e.tresor < ECO.dette.faillite) modifier(e, f, "colere", ECO.dette.colereFaillite);
  }
  e.apaises = [];
  evaluer(e);
}

// multiplicateurs de l'économie : production d'un bâtiment, impôts (grève, révolte)
function effetsEco(e){
  const r = { batiments: {}, impots: 1 };
  for (const f in FACTIONS){
    const st = e.factions[f].statut, k = st === "greve" ? R.greve : st === "revolte" ? R.revolteEffets : null;
    if (!k) continue;
    for (const b of FACTIONS[f].batiments) r.batiments[b] = k.production;
    if (FACTIONS[f].impots) r.impots *= k.impots;
  }
  return r;
}

const Factions = { couverture, favorisees, modifier, choc, coutApaisement, apaisables, apaiser, statutDe, moralFaction, moral, evaluer, finDeTour, effetsEco };
if (NODE) module.exports = Factions; else (racine.Politique = racine.Politique || {}).Factions = Factions;
})(typeof window !== "undefined" ? window : globalThis);

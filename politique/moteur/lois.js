/* Politique : lois (RULES_V1 § Lois ; V2 étape 4 : une loi à la fois, sans capital politique).
   e.lois : catégorie → { id, depuis } (la loi en vigueur, une seule par catégorie) ;
   e.debat : { id, depuis } ou null — la seule loi en débat. Chaque tour de débat, ses opposants prennent de la colère ;
   à partir du R.premierTirage-ième tour de débat, elle est adoptée avec la chance affichée (Lois.chance), selon la
   puissance des factions pour et contre. On peut abandonner un débat.
   Ces fonctions modifient l'état qu'on leur donne : tour.js leur passe sa copie de travail. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const ECO = NODE ? require("../donnees/economie.js") : racine.Politique.ECONOMIE;
const { LOIS, REGLES_LOIS: R } = NODE ? require("../donnees/lois.js") : racine.Politique.LOIS;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;
const Alea = NODE ? require("./alea.js") : racine.Politique.Alea;

const enVigueur = (e, id) => { const l = e.lois[LOIS[id].categorie]; return !!l && l.id === id; };

// une loi se lance si aucun débat n'est ouvert et qu'elle n'est pas déjà en vigueur
function lancables(e){
  if (e.debat) return [];
  // clause de non-réarmement : pas de nouvelle loi militaire (moteur/guerre.js)
  const desarme = e.nonRearmement && (e.nonRearmement.joueur || 0) >= e.tour;
  return Object.keys(LOIS).filter(id => !enVigueur(e, id) && !(desarme && LOIS[id].categorie === "armee"));
}

// chance d'adoption par tour : base + (puissance des pour − puissance des contre) × parPuissance, bornée
function chance(e, id){
  const p = f => (e.factions[f] ? e.factions[f].puissance : 0);
  const s = (LOIS[id].pour || []).reduce((a, f) => a + p(f), 0) - (LOIS[id].contre || []).reduce((a, f) => a + p(f), 0);
  return Math.max(R.chance.min, Math.min(R.chance.max, Math.round((R.chance.base + s * R.chance.parPuissance) * 1000) / 1000));
}

function lancer(e, id){
  e.debat = { id, depuis: e.tour };
  e.journal.push(`Débat ouvert : ${LOIS[id].nom} (${Math.round(100 * chance(e, id))} % de chances par tour).`);
}
function abandonner(e){
  e.journal.push(`Débat abandonné : ${LOIS[e.debat.id].nom}.`);
  e.debat = null;
}

function adopter(e, id){
  const loi = LOIS[id], avant = e.lois[loi.categorie];
  e.lois[loi.categorie] = { id, depuis: e.tour };
  if (loi.eco.reputation) e.reputation += loi.eco.reputation;
  Factions.choc(e, id);
  e.journal.push(`Loi adoptée : ${loi.nom}` + (avant ? ` (remplace ${LOIS[avant.id].nom}).` : "."));
}

// un tour de débat : les opposants s'agitent ; à partir du tour R.premierTirage, tirage de l'adoption
function debattre(e, r){
  if (!e.debat) return;
  const id = e.debat.id, tours = e.tour - e.debat.depuis + 1;
  for (const f of LOIS[id].contre || []) if (e.factions[f]) Factions.modifier(e, f, "colere", R.colereDebat);
  if (tours < R.premierTirage) return;
  if (Alea.suivant(r) < chance(e, id)){ e.debat = null; adopter(e, id); }
}

// part d'un effet « à terme » déjà atteinte : 0 à l'adoption, 1 après ECO.montee tours
const montee = (e, l) => Math.min(1, (e.tour - l.depuis) / ECO.montee);

// effets économiques cumulés des lois en vigueur
function effets(e){
  const r = { impots: 1, entretien: 0, production: 1, croissance: 0, artisans: 0, force: 1 };
  for (const cat in e.lois){
    const l = e.lois[cat], x = LOIS[l.id].eco;
    if (x.impots) r.impots *= x.impots;
    if (x.entretien) r.entretien += x.entretien;
    if (x.production) r.production *= x.production;
    if (x.force) r.force *= x.force;
    if (x.croissance) r.croissance += x.croissance * montee(e, l);
    if (x.artisans) r.artisans += x.artisans * montee(e, l);
  }
  return r;
}

const Lois = { lancables, chance, lancer, abandonner, adopter, debattre, effets, enVigueur, montee };
if (NODE) module.exports = Lois; else (racine.Politique = racine.Politique || {}).Lois = Lois;
})(typeof window !== "undefined" ? window : globalThis);

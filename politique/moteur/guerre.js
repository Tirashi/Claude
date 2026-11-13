/* Politique : guerre et paix (M3b ; V2 étape 2 : régiments, forts, occupation, cession).
   Une guerre à la fois, entre le camp du joueur et un camp ennemi.
   e.guerre = { ennemis: [nations], allies: [nations], agresseur, depuis, derniereBataille, bataille (tour), capitulation }
   (capitulation : null, ou "ennemi" quand l'ennemi a capitulé et que le joueur doit choisir les clauses).
   Armée : e.regiments (joueur), e.nations[n].regiments ; e.recrues = régions où le joueur a recruté ce tour.
   Régions : celles du joueur dans e.regions, celles des nations dans e.profils[n].regions (identifiants tous différents) ;
   e.occupations[région] = occupant ("joueur" ou une nation) pendant la guerre.
   Actions : recruter { region }, declarer_guerre { id }, bataille { cible }, imposer_paix { reparations, lever_embargo,
   non_rearmement, cession }, paix_blanche {}. Après une paix : trêve de G.treve tours avec chaque ancien ennemi.
   Fin de tour (tour) : recrutement des nations, capitulations, bataille de l'ennemi s'il est plus fort, déclarations. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const G = NODE ? require("../donnees/guerre.js") : racine.Politique.GUERRE;
const Alea = NODE ? require("./alea.js") : racine.Politique.Alea;
const Lois = NODE ? require("./lois.js") : racine.Politique.Lois;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;

const arrondi = x => Math.round(x * 100) / 100;
const enTreve = (e, n) => ((e.treves || {})[n] || 0) >= e.tour;
const desarme = (e, qui) => ((e.nonRearmement || {})[qui] || 0) >= e.tour;
const partenaires = (e, type) => e.traites.filter(t => t.type === type).map(t => t.avec);
const campJoueur = g => ["joueur"].concat(g.allies);

// --- armée et régions ---
const regiments = (e, qui) => qui === "joueur" ? e.regiments : e.nations[qui].regiments;
function ajouterRegiments(e, qui, d){
  if (qui === "joueur") e.regiments = Math.max(0, e.regiments + d); else e.nations[qui].regiments = Math.max(0, e.nations[qui].regiments + d);
}
const familles = (e, qui) => qui === "joueur" ? e.familles : e.nations[qui].familles;
const plafond = (e, qui) => Math.floor(familles(e, qui) / G.parFamilles);
const regionsDe = (e, qui) => Object.keys(qui === "joueur" ? e.regions : e.profils[qui].regions);
function proprietaire(e, id){
  if (e.regions[id]) return "joueur";
  for (const n in e.profils) if (e.profils[n].regions[id]) return n;
  return null;
}
const nomRegion = (e, id) => (e.regions[id] || e.profils[proprietaire(e, id)].regions[id]).nom;
const occupees = (e, qui) => regionsDe(e, qui).filter(id => e.occupations[id]);

// force d'un membre ; region : la région défendue (son fort compte si elle appartient au joueur et n'est pas occupée)
function force(e, qui, region){
  const mult = qui === "joueur" ? Lois.effets(e).force : e.profils[qui].force;
  const moral = qui === "joueur" ? e.moral : e.nations[qui].moral;
  let f = regiments(e, qui) * mult * moral;
  if (region && qui === "joueur" && e.regions[region] && !e.occupations[region] && e.regions[region].batiments.fort) f *= G.fort;
  return arrondi(f);
}
const forceCamp = (e, membres, region) => arrondi(membres.reduce((s, m) => s + force(e, m, region), 0));

// --- recrutement ---
function recrutables(e){
  if (e.tresor < G.regiment.cout || e.regiments >= plafond(e, "joueur") || desarme(e, "joueur")) return [];
  return Object.keys(e.regions).filter(r => (e.regions[r].batiments.caserne || 0) > 0 && !e.occupations[r] && !(e.recrues || []).includes(r));
}
function recruter(e, region){
  e.tresor = arrondi(e.tresor - G.regiment.cout);
  e.regiments++;
  (e.recrues = e.recrues || []).push(region);
  e.journal.push(`Régiment recruté (${e.regions[region].nom}).`);
}
// les nations recrutent selon leur politique, avec leur or (en guerre : jusqu'au plafond)
function recrutementNations(e){
  for (const n in e.nations){
    const x = e.nations[n], pol = G.politiques[e.profils[n].caractere].recrute;
    if (!pol || desarme(e, n)) continue;
    const enGuerre = !!e.guerre && (e.guerre.ennemis.includes(n) || e.guerre.allies.includes(n));
    const cap = plafond(e, n), cible = enGuerre ? cap : Math.ceil(cap * pol.cible);
    for (let k = 0; k < pol.parTour && x.regiments < cible && x.tresor - G.regiment.cout >= pol.reserve; k++){
      x.regiments++; x.tresor = arrondi(x.tresor - G.regiment.cout);
    }
  }
}

// --- déclaration ---
function declarer(e, cible, agresseur, r){
  const g = { ennemis: [cible], allies: [], agresseur, depuis: e.tour, derniereBataille: null, bataille: null, capitulation: null };
  const entente = partenaires(e, "entente");
  if (agresseur === "joueur"){
    const membre = entente.includes(cible);
    e.reputation += membre ? G.reputation.attaqueEntente : G.reputation.agression;
    for (const t of e.traites.filter(t => t.avec === cible)) if (e.traites.includes(t)) Diplomatie.rompre(e, t.type, cible);
    // attaquer un membre de l'Entente : sanctions de bloc des autres membres contre le joueur
    if (membre) for (const p of entente.filter(p => p !== cible)) Diplomatie.couper(e, p);
  } else {
    g.allies = partenaires(e, "defense_mutuelle").filter(n => n !== cible);   // défense mutuelle
    // attaquer un membre de l'Entente (le joueur) : les autres membres mettent l'agresseur sous embargo
    for (const p of entente.filter(p => p !== cible)) e.sanctions.push({ par: p, contre: cible });
  }
  e.nations[cible].relation = G.relationGuerre;
  e.guerre = g;
  e.journal.push(agresseur === "joueur" ? `Guerre déclarée à ${e.profils[cible].nom}.` : `${e.profils[cible].nom} nous déclare la guerre !`);
  // les opportunistes rejoignent le camp le plus fort (avec le joueur : relation ≥ 0)
  for (const n in e.nations){
    const pol = G.politiques[e.profils[n].caractere];
    if (!pol.rejoint || g.ennemis.includes(n) || g.allies.includes(n)) continue;
    if (Alea.suivant(r) >= pol.rejoint) continue;
    const fj = forceCamp(e, campJoueur(g)), fe = forceCamp(e, g.ennemis);
    if (fj >= fe && e.nations[n].relation >= 0){ g.allies.push(n); e.journal.push(`${e.profils[n].nom} entre en guerre à nos côtés.`); }
    else if (fe > fj && !enTreve(e, n)){ g.ennemis.push(n); e.nations[n].relation = G.relationGuerre; e.journal.push(`${e.profils[n].nom} entre en guerre contre nous.`); }
  }
}

// --- batailles ---
// cibles possibles d'un camp attaquant : régions du camp adverse qu'il n'occupe pas, ou ses propres régions occupées (libération)
function cibles(e, attaquants, defenseurs){
  const r = [];
  for (const q of defenseurs) for (const id of regionsDe(e, q)) if (!attaquants.includes(e.occupations[id])) r.push(id);
  for (const q of attaquants) for (const id of regionsDe(e, q)) if (defenseurs.includes(e.occupations[id])) r.push(id);
  return r;
}
// une bataille pour une région : l'attaquant gagne avec la probabilité Fa / (Fa + Fd) ; il occupe (ou libère) la région
function bataille(e, joueurAttaque, cible, r){
  const g = e.guerre, att = joueurAttaque ? campJoueur(g) : g.ennemis, def = joueurAttaque ? g.ennemis : campJoueur(g);
  const fa = forceCamp(e, att), fd = forceCamp(e, def, cible);
  const p = fa + fd > 0 ? fa / (fa + fd) : 0.5;
  const gagne = Alea.suivant(r) < p, perdants = gagne ? def : att, vainqueurs = gagne ? att : def;
  for (const m of perdants){
    ajouterRegiments(e, m, -Math.ceil(regiments(e, m) * G.pertes.perdant));
    if (m === "joueur") for (const f in e.factions) Factions.modifier(e, f, "colere", G.defaite.colere);
    else { const n = e.nations[m]; n.colere = Math.min(100, n.colere + G.defaite.colere); n.moral = Diplomatie.moralNation(n.colere); }
  }
  for (const m of vainqueurs) ajouterRegiments(e, m, -Math.floor(regiments(e, m) * G.pertes.gagnant));
  if (gagne){
    if (att.includes(proprietaire(e, cible))) delete e.occupations[cible];      // libération
    else e.occupations[cible] = att[0];
  }
  g.bataille = g.derniereBataille = e.tour;
  const nous = joueurAttaque === gagne;
  e.journal.push(`Bataille pour ${nomRegion(e, cible)} (${Math.round(fa)} contre ${Math.round(fd)}) : ${nous ? "victoire" : "défaite"} !`);
  return nous;
}

// --- paix ---
// vainqueur : "joueur", "ennemi" ou null (paix blanche) ; cession : le vainqueur garde la région occupée la plus riche du perdant
function paix(e, vainqueur, clauses){
  const g = e.guerre, chef = g.ennemis[0];
  clauses = clauses || {};
  if (vainqueur){
    const perdant = vainqueur === "joueur" ? chef : "joueur", gagnant = vainqueur === "joueur" ? "joueur" : chef;
    const caisse = q => q === "joueur" ? e : e.nations[q];
    if (clauses.reparations){
      const m = arrondi(Math.min(G.reparations.max, G.reparations.part * Math.max(0, caisse(perdant).tresor)));
      caisse(perdant).tresor = arrondi(caisse(perdant).tresor - m);
      caisse(gagnant).tresor = arrondi(caisse(gagnant).tresor + m);
      e.journal.push(`Réparations : ${m} or.`);
    }
    if (clauses.lever_embargo) e.embargos = e.embargos.filter(n => n !== chef);
    if (clauses.non_rearmement) e.nonRearmement[perdant] = e.tour + G.nonRearmement;
    if (clauses.cession) ceder(e, perdant, gagnant);
  }
  const camp = g.ennemis.concat(g.allies, ["joueur"]);
  // les régions encore occupées sont rendues ; les sanctions liées à la guerre sont levées
  for (const id in e.occupations) if (camp.includes(e.occupations[id])) delete e.occupations[id];
  e.sanctions = e.sanctions.filter(s => !camp.includes(s.contre));
  // trêve : ni le joueur ni ses anciens ennemis ne peuvent se déclarer la guerre pendant G.treve tours
  for (const n of g.ennemis) e.treves[n] = e.tour + G.treve;
  e.guerre = null;
  e.journal.push(vainqueur ? (vainqueur === "joueur" ? "Paix : l'ennemi capitule." : "Paix : nous capitulons.") : "Paix blanche.");
}
// régions du perdant occupées par le camp du vainqueur ; la plus riche d'abord (bâtiments ; nations : ordre de la carte)
function cessibles(e, perdant, gagnant){
  const camp = gagnant === "joueur" ? campJoueur(e.guerre) : e.guerre.ennemis;
  const ids = regionsDe(e, perdant).filter(id => camp.includes(e.occupations[id]));
  const valeur = id => perdant === "joueur" ? Object.values(e.regions[id].batiments).reduce((s, n) => s + n, 0) : 0;
  return ids.sort((a, b) => valeur(b) - valeur(a));
}
function ceder(e, perdant, gagnant){
  const id = cessibles(e, perdant, gagnant)[0];
  if (!id) return;
  if (perdant === "joueur"){
    const reg = e.regions[id];
    for (const b in reg.batiments) e.batiments[b] -= reg.batiments[b];
    e.chantiers = e.chantiers.filter(c => c.region !== id);
    e.profils[gagnant].regions[id] = { nom: reg.nom, terrain: reg.terrain };
    delete e.regions[id];
  } else {
    const reg = e.profils[perdant].regions[id];
    e.regions[id] = { nom: reg.nom, terrain: reg.terrain, emplacements: 3, batiments: {} };   // 3 emplacements : ASSUMPTION (V2 étape 2)
    delete e.profils[perdant].regions[id];
  }
  delete e.occupations[id];
  e.journal.push(`Cession : ${e.regions[id] ? e.regions[id].nom : e.profils[gagnant].regions[id].nom} passe à ${gagnant === "joueur" ? "nous" : e.profils[gagnant].nom}.`);
}

const accepteBlanche = e => forceCamp(e, e.guerre.ennemis) <= forceCamp(e, campJoueur(e.guerre));
const capitule = (e, qui) => (qui === "joueur" ? e.moral : e.nations[qui].moral) < G.capitulation || (G.capitulationSansRegiment && regiments(e, qui) === 0 && occupees(e, qui).length > 0);

function actions(e){
  const g = e.guerre, r = recrutables(e).map(region => ({ type: "recruter", region }));
  if (!g){ for (const n in e.nations) if (!enTreve(e, n)) r.push({ type: "declarer_guerre", id: n }); return r; }
  if (g.capitulation === "ennemi"){
    const cession = cessibles(e, g.ennemis[0], "joueur").length > 0;
    for (let k = 0; k < (cession ? 16 : 8); k++) r.push({ type: "imposer_paix", reparations: !!(k & 1), lever_embargo: !!(k & 2), non_rearmement: !!(k & 4), cession: !!(k & 8) });
    return r;
  }
  if (g.bataille !== e.tour) for (const id of cibles(e, campJoueur(g), g.ennemis)) r.push({ type: "bataille", cible: id });
  if (e.tour - (g.derniereBataille == null ? g.depuis : g.derniereBataille) >= G.paixBlanche && accepteBlanche(e)) r.push({ type: "paix_blanche" });
  return r;
}

function appliquer(e, a, r){
  if (a.type === "recruter") recruter(e, a.region);
  else if (a.type === "declarer_guerre") declarer(e, a.id, "joueur", r);
  else if (a.type === "bataille") bataille(e, true, a.cible, r);
  else if (a.type === "imposer_paix") paix(e, "joueur", a);
  else if (a.type === "paix_blanche") paix(e, null);
}

// fin de tour : recrutement des nations, usure et capitulations, bataille de l'ennemi, déclarations des nations
function tour(e, r){
  recrutementNations(e);
  const g = e.guerre;
  // (en essai) une région occupée met son pays en colère
  if (g && G.occupationColere){
    for (const id in e.occupations){
      const q = proprietaire(e, id);
      if (q === "joueur") for (const f in e.factions) Factions.modifier(e, f, "colere", G.occupationColere);
      else if (q){ const n = e.nations[q]; n.colere = Math.min(100, n.colere + G.occupationColere); n.moral = Diplomatie.moralNation(n.colere); }
    }
    e.moral = Factions.moral(e);
  }
  if (g){
    if (g.capitulation) return;
    const chef = g.ennemis[0];
    if (capitule(e, chef)){ g.capitulation = "ennemi"; e.journal.push(`${e.profils[chef].nom} capitule : à nous de fixer la paix.`); return; }
    if (capitule(e, "joueur")){ paix(e, "ennemi", { reparations: true, lever_embargo: true, non_rearmement: true, cession: true }); return; }
    const pol = G.politiques[e.profils[chef].caractere];
    if (!pol.bataille || g.bataille === e.tour) return;
    // l'ennemi libère d'abord ses régions, sinon vise notre région la moins bien défendue
    const nous = campJoueur(g), possibles = cibles(e, g.ennemis, nous);
    const liberer = possibles.filter(id => g.ennemis.includes(proprietaire(e, id)));
    const liste = liberer.length ? liberer : possibles.sort((a, b) => forceCamp(e, nous, a) - forceCamp(e, nous, b));
    if (liste.length && forceCamp(e, g.ennemis) > forceCamp(e, nous, liste[0])) bataille(e, false, liste[0], r);
    return;
  }
  for (const n in e.nations){
    const d = G.politiques[e.profils[n].caractere].declare;
    if (!d || enTreve(e, n) || e.tour < (d.tourMin || 1) || e.nations[n].relation >= d.relationMax) continue;
    const nous = forceCamp(e, ["joueur"].concat(partenaires(e, "defense_mutuelle")));
    if (force(e, n) > d.ratio * nous && Alea.suivant(r) < d.proba){ declarer(e, n, n, r); return; }
  }
}

const Guerre = { enTreve, desarme, force, forceCamp, plafond, regiments, proprietaire, cibles, cessibles, recrutables,
  declarer, bataille, paix, actions, appliquer, tour };
if (NODE) module.exports = Guerre; else (racine.Politique = racine.Politique || {}).Guerre = Guerre;
})(typeof window !== "undefined" ? window : globalThis);

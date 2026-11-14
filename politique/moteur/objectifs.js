/* Politique : objectifs de victoire (V2, specs/politique/regles-v2.md § 6).
   suivre(e) : à la fin de chaque tour (après les factions), cumule ce qui se mesure sur toute la partie (e.suivi).
   mesures(e) : les cinq valeurs ; medailles(e) : { objectif: 0 à 3 } (0 si révolution ou seuil pas encore fixé).
   Ambition : choisie au tour 1 (action { type: "ambition", id }) ; resultat(e) = { ambition, medaille }. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const O = NODE ? require("../donnees/objectifs.js") : racine.Politique.OBJECTIFS;
const BAT = NODE ? require("../donnees/batiments.js") : racine.Politique.BATIMENTS;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;
const Guerre = NODE ? require("./guerre.js") : racine.Politique.Guerre;
const { LOIS } = NODE ? require("../donnees/lois.js") : racine.Politique.LOIS;

const arrondi = x => Math.round(x * 100) / 100, dixieme = x => Math.round(x * 10) / 10;

function suivre(e){
  const s = e.suivi = e.suivi || { tours: 0, colere: 0, legitimite: 0 };
  const f = Object.values(e.factions);
  s.tours++;
  s.colere = arrondi(s.colere + f.reduce((t, x) => t + x.colere, 0) / f.length);
  s.legitimite = arrondi(s.legitimite + legitimite(e));
}

// soutien aux lois en vigueur : pour chaque loi, puissance des factions pour − puissance des factions contre ;
// moyenne par loi (décision du 14/11 : un programme court mais bien soutenu compte autant qu'un long) ; sans loi : 0
function legitimite(e){
  const P = id => e.factions[id] ? e.factions[id].puissance : 0;
  let t = 0, n = 0;
  for (const c in e.lois){
    const L = LOIS[e.lois[c].id];
    if (L){ t += (L.pour || []).reduce((s, f) => s + P(f), 0) - (L.contre || []).reduce((s, f) => s + P(f), 0); n++; }
  }
  return n ? arrondi(t / n) : 0;
}

function mesures(e){
  const s = e.suivi || { tours: 0, colere: 0, legitimite: 0 };
  let valeur = 0;
  for (const id in e.batiments) valeur += (e.batiments[id] || 0) * (BAT[id] ? BAT[id].cout : 0);
  const tenues = Object.keys(e.regions).filter(r => !(e.occupations || {})[r]).length;
  return {
    prosperite: Math.round(e.tresor + valeur),
    contentement: s.tours ? dixieme(100 - s.colere / s.tours) : 100,
    puissance: dixieme(tenues * O.pointsRegion + Guerre.force(e, "joueur")),   // force : régiments × loi militaire × moral
    concorde: Math.round(Diplomatie.reputation(e) + (e.traites || []).length * O.pointsTraite),
    autorite: s.tours ? Math.round(s.legitimite / s.tours) : 0
  };
}

function medailles(e){
  const m = mesures(e), r = {};
  for (const id in O.OBJECTIFS){
    const seuils = O.OBJECTIFS[id].seuils;
    r[id] = (e.issue && e.issue.type === "revolution") ? 0 : seuils.filter(x => x != null && m[id] >= x).length;
  }
  return r;
}
const points = e => Object.values(medailles(e)).reduce((t, x) => t + x, 0);

// ambition : se choisit au tour 1 seulement, une fois
const actions = e => e.tour === 1 && !e.ambition && !e.fin ? Object.keys(O.OBJECTIFS).map(id => ({ type: "ambition", id })) : [];
function choisir(e, id){
  e.ambition = id;
  e.journal.push(`Ambition : ${O.OBJECTIFS[id].nom}.`);
}
// victoire : la médaille de l'ambition (0 = aucune ; sans ambition : null)
const resultat = e => ({ ambition: e.ambition || null, medaille: e.ambition ? medailles(e)[e.ambition] : null });

const Objectifs = { suivre, mesures, medailles, points, legitimite, actions, choisir, resultat };
if (NODE) module.exports = Objectifs; else (racine.Politique = racine.Politique || {}).Objectifs = Objectifs;
})(typeof window !== "undefined" ? window : globalThis);

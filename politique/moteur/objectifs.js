/* Politique : objectifs de victoire (V2, specs/politique/regles-v2.md § 6).
   suivre(e) : à la fin de chaque tour (après les factions), cumule ce qui se mesure sur toute la partie (e.suivi).
   mesures(e) : les cinq valeurs ; medailles(e) : { objectif: 0 à 3 } (0 si révolution ou seuil pas encore fixé). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const O = NODE ? require("../donnees/objectifs.js") : racine.Politique.OBJECTIFS;
const BAT = NODE ? require("../donnees/batiments.js") : racine.Politique.BATIMENTS;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;

const arrondi = x => Math.round(x * 100) / 100;

function suivre(e){
  const s = e.suivi = e.suivi || { tours: 0, colere: 0, calmes: 0 };
  const f = Object.values(e.factions);
  s.tours++;
  s.colere = arrondi(s.colere + f.reduce((t, x) => t + x.colere, 0) / f.length);
  if (f.every(x => x.statut === "calme")) s.calmes++;                  // pas même de grondement
}

function mesures(e){
  const s = e.suivi || { tours: 0, colere: 0, calmes: 0 };
  let valeur = 0;
  for (const id in e.batiments) valeur += (e.batiments[id] || 0) * (BAT[id] ? BAT[id].cout : 0);
  const tenues = Object.keys(e.regions).filter(r => !(e.occupations || {})[r]).length;
  return {
    prosperite: Math.round(e.tresor + valeur),
    contentement: s.tours ? Math.round(100 - s.colere / s.tours) : 100,
    puissance: tenues * O.pointsRegion + (e.regiments || 0),
    concorde: Math.round(Diplomatie.reputation(e) + (e.traites || []).length * O.pointsTraite),
    ordre: s.tours ? Math.round(100 * s.calmes / s.tours) : 100
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

const Objectifs = { suivre, mesures, medailles, points };
if (NODE) module.exports = Objectifs; else (racine.Politique = racine.Politique || {}).Objectifs = Objectifs;
})(typeof window !== "undefined" ? window : globalThis);

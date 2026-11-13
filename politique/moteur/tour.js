/* Politique : le tour. tourSuivant(etat, actions, rng) → nouvel état ; ne mute jamais etat.
   actionsDisponibles(etat) : la seule liste que voient l'écran et les bots ; toute autre action est refusée.
   M0 : aucune action encore (M1 : lois, bâtiments ; M2 : apaisement…), le tour ne fait qu'avancer. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const Alea = NODE ? require("./alea.js") : racine.Politique.Alea;
const Etat = NODE ? require("./etat.js") : racine.Politique.Etat;

function actionsDisponibles(etat){
  if (etat.fin) return [];
  return [];
}

const memeAction = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// rng : facultatif (tests) ; sinon repris de etat.alea. Son état final est rangé dans le nouvel état.
function tourSuivant(etat, actions, rng){
  actions = actions || [];
  const dispo = actionsDisponibles(etat);
  for (const a of actions)
    if (!dispo.some(d => memeAction(d, a))) throw new Error("action refusée : " + JSON.stringify(a));
  const e = Etat.copie(etat);
  const r = rng || { s: e.alea };
  e.journal = [];
  // (M1 et suivants : actions, lois, chantiers, économie, factions, démographie, capital politique)
  e.alea = r.s >>> 0;
  e.tour++;
  if (e.tour > e.tourMax) e.fin = true;
  return e;
}

const Tour = { actionsDisponibles, tourSuivant };
if (NODE) module.exports = Tour; else (racine.Politique = racine.Politique || {}).Tour = Tour;
})(typeof window !== "undefined" ? window : globalThis);

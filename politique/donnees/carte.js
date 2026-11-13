/* Politique : terrains des régions (V2, specs/politique/regles-v2.md § 1, validé le 13/11).
   bonus : multiplicateur de rendement d'un bâtiment construit dans une région de ce terrain.
   Les régions elles-mêmes (nom, terrain, emplacements, bâtiments de départ) sont dans le scénario (champs.js). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const TERRAINS = {
  fertile: { nom: "fertile", bonus: { farm: 1.5 } },                       // ASSUMPTION validée (V2)
  mixte:   { nom: "mixte",   bonus: {} },
  filons:  { nom: "filons",  bonus: { mine: 1.5 } },                       // ASSUMPTION validée (V2)
  ville:   { nom: "ville",   bonus: { workshop: 1.25, weaving: 1.25 } }    // ASSUMPTION validée (V2)
};

if (NODE) module.exports = TERRAINS; else (racine.Politique = racine.Politique || {}).TERRAINS = TERRAINS;
})(typeof window !== "undefined" ? window : globalThis);

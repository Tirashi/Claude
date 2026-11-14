/* Politique : objectifs de victoire (V2, décision de l'utilisateur du 14/11, specs/politique/regles-v2.md § 6).
   Cinq objectifs mesurés à la fin de la partie (tour 40), chacun avec trois paliers : bronze, argent, or.
   Une révolution = défaite : aucune médaille. Seuils : fixés par simulation (outils/politique-simulateur.js --objectifs),
   l'or atteint par environ 10 à 15 % des parties d'un bot qui vise cet objectif, le bronze par environ la moitié. */
(function(racine){
"use strict";
const OBJECTIFS = {
  prosperite: { nom: "Prospérité", texte: "Trésor et valeur des bâtiments à la fin de la partie.",
    seuils: [null, null, null] },
  contentement: { nom: "Contentement", texte: "100 moins la colère moyenne des factions, en moyenne sur toute la partie.",
    seuils: [null, null, null] },
  puissance: { nom: "Puissance", texte: "10 points par région tenue (non occupée) et 1 par régiment, à la fin de la partie.",
    seuils: [null, null, null] },
  concorde: { nom: "Concorde", texte: "Moyenne des relations avec les nations, plus 10 par traité en cours, à la fin de la partie.",
    seuils: [null, null, null] },
  ordre: { nom: "Ordre", texte: "Part des tours (en %) où toutes les factions sont calmes (ni grondement, ni grève, ni révolte).",
    seuils: [null, null, null] }
};
const MEDAILLES = ["bronze", "argent", "or"];   // 1, 2 et 3 points
const R = { OBJECTIFS, MEDAILLES, pointsTraite: 10, pointsRegion: 10 };
if (typeof module !== "undefined" && module.exports) module.exports = R; else (racine.Politique = racine.Politique || {}).OBJECTIFS = R;
})(typeof window !== "undefined" ? window : globalThis);

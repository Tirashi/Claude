/* Politique : objectifs de victoire (V2, décision de l'utilisateur du 14/11, specs/politique/regles-v2.md § 6).
   Cinq objectifs mesurés à la fin de la partie (tour 40), chacun avec trois paliers : bronze, argent, or.
   Le joueur choisit au tour 1 son **ambition** (un objectif) : sa victoire est la médaille de cet objectif ; les autres
   ne sont qu'un bilan. Une révolution = défaite : aucune médaille. Seuils : fixés par simulation (outils/politique-simulateur.js --objectifs),
   l'or atteint par environ 10 à 15 % des parties d'un bot qui vise cet objectif, le bronze par environ la moitié. */
(function(racine){
"use strict";
// ASSUMPTION (objectifs, 14/11) : seuils tirés de 200 parties par bot (--objectifs), à valider
const OBJECTIFS = {
  prosperite: { nom: "Prospérité", texte: "Trésor et valeur des bâtiments à la fin de la partie.",
    seuils: [5374, 5951, 6410] },
  contentement: { nom: "Contentement", texte: "100 moins la colère moyenne des factions, en moyenne sur toute la partie.",
    seuils: [78.8, 80.5, 81.9] },
  puissance: { nom: "Puissance", texte: "10 points par région tenue (non occupée), plus la force de l'armée (régiments × loi militaire × moral), à la fin de la partie.",
    seuils: [84.4, 86.6, 87.3] },
  concorde: { nom: "Concorde", texte: "Moyenne des relations avec les nations, plus 10 par traité en cours, à la fin de la partie.",
    seuils: [28, 54, 80] },
  autorite: { nom: "Autorité", texte: "Soutien des factions puissantes aux lois en vigueur : pour chaque loi en vigueur, puissance des factions pour moins puissance des factions contre ; moyenne par loi, puis moyenne sur la partie.",
    seuils: [34, 53, 54] }
};
const MEDAILLES = ["bronze", "argent", "or"];   // 1, 2 et 3 points
const R = { OBJECTIFS, MEDAILLES, pointsTraite: 10, pointsRegion: 10 };
if (typeof module !== "undefined" && module.exports) module.exports = R; else (racine.Politique = racine.Politique || {}).OBJECTIFS = R;
})(typeof window !== "undefined" ? window : globalThis);

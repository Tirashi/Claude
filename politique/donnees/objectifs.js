/* Politique : objectifs de victoire (V2, décision de l'utilisateur du 14/11, specs/politique/regles-v2.md § 6).
   Cinq objectifs mesurés à la fin de la partie (tour 40), chacun avec trois paliers : bronze, argent, or.
   Le joueur choisit au tour 1 son **ambition** (un objectif) : sa victoire est la médaille de cet objectif ; les autres
   ne sont qu'un bilan. Une révolution = défaite : aucune médaille. Seuils : fixés par simulation (outils/politique-simulateur.js --objectifs),
   l'or atteint par environ 10 à 15 % des parties d'un bot qui vise cet objectif, le bronze par environ la moitié.
   **Seuils par pays de départ** (décision du 14/11) : une médaille veut dire « bien joué pour ce pays ». */
(function(racine){
"use strict";
// seuils : { pays: [bronze, argent, or] }, tirés de 200 parties par bot et par pays (--objectifs --pays tous --seuils-proposes), validés le 14/11
const OBJECTIFS = {
  prosperite: { nom: "Prospérité", texte: "Trésor et valeur des bâtiments à la fin de la partie.",
    seuils: { equilibre: [5374, 5951, 6410], agricole: [5939, 6683, 6964], industriel: [5678, 6285, 6799], marchand: [6202, 6784, 7298], militaire: [5798, 6531, 6749] } },
  contentement: { nom: "Contentement", texte: "100 moins la colère moyenne des factions, en moyenne sur toute la partie.",
    seuils: { equilibre: [78.6, 81, 82.2], agricole: [80.1, 83.5, 84.1], industriel: [78.2, 80.8, 81.9], marchand: [80, 81.3, 81.8], militaire: [78.4, 80.8, 82.3] } },
  puissance: { nom: "Puissance", texte: "10 points par région tenue (non occupée), plus la force de l'armée (régiments × loi militaire × moral), à la fin de la partie.",
    seuils: { equilibre: [84.4, 86.6, 87.3], agricole: [85.4, 87.1, 87.5], industriel: [84.4, 86.6, 87.4], marchand: [84.9, 86.5, 87.2], militaire: [67.6, 77.6, 86.4] } },
  concorde: { nom: "Concorde", texte: "Moyenne des relations avec les nations, plus 10 par traité en cours, à la fin de la partie.",
    seuils: { equilibre: [28, 54, 80], agricole: [28, 50, 79], industriel: [30, 54, 80], marchand: [28, 38, 79], militaire: [28, 38, 80] } },
  autorite: { nom: "Autorité", texte: "Soutien des factions puissantes aux lois en vigueur : pour chaque loi en vigueur, puissance des factions pour moins puissance des factions contre ; moyenne par loi, puis moyenne sur la partie.",
    seuils: { equilibre: [34, 53, 54], agricole: [47, 50, 51], industriel: [30, 35, 39], marchand: [29, 55, 56], militaire: [36, 50, 52] } }
};
// étapes (option 3, validées le 14/11 ; durcies après simulation : plusieurs étaient atteintes dès le départ) : trois repères par ambition, affichés et cochés pendant la partie (une fois
// atteints, ils restent cochés) ; ils guident sans rapporter de points. Le moteur les vérifie par leur id (moteur/objectifs.js).
const ETAPES = {
  prosperite: [
    { id: "batiments", texte: "Avoir 12 bâtiments en service.", valeur: 12 },
    { id: "regions_pleines", texte: "Remplir tous les emplacements de toutes les régions." },
    { id: "tresor", texte: "Avoir 3 000 or au trésor.", valeur: 3000 }],
  contentement: [
    { id: "colere_moyenne", texte: "Faire descendre la colère moyenne des factions sous 20.", valeur: 20 },
    { id: "sans_grondement", texte: "Tenir 15 tours de suite sans qu'aucune faction dépasse 45 de colère.", valeur: 15, seuil: 45 },
    { id: "toutes_calmes", texte: "Avoir toutes les factions sous 30 de colère en même temps.", valeur: 30 }],
  puissance: [
    { id: "regiments", texte: "Avoir 10 régiments.", valeur: 10 },
    { id: "fort", texte: "Construire un fort." },
    { id: "victoire", texte: "Gagner une guerre ou prendre une région." }],
  concorde: [
    { id: "traite", texte: "Signer un traité." },
    { id: "ami", texte: "Atteindre 50 de relation avec une nation.", valeur: 50 },
    { id: "relations", texte: "Avoir des relations à +30 en moyenne.", valeur: 30 }],
  autorite: [
    { id: "lois", texte: "Avoir 3 lois en vigueur.", valeur: 3 },
    { id: "soutien", texte: "Avoir au moins 5 lois en vigueur, chacune avec plus de soutien que d'opposition.", valeur: 5 },
    { id: "legitimite", texte: "Avoir au moins 5 lois en vigueur avec, en moyenne, 40 de soutien net (puissance des factions pour moins contre).", valeur: 40, lois: 5 }]
};
const MEDAILLES = ["bronze", "argent", "or"];   // 1, 2 et 3 points
const R = { OBJECTIFS, ETAPES, MEDAILLES, pointsTraite: 10, pointsRegion: 10 };
if (typeof module !== "undefined" && module.exports) module.exports = R; else (racine.Politique = racine.Politique || {}).OBJECTIFS = R;
})(typeof window !== "undefined" ? window : globalThis);

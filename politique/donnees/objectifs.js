/* Politique : objectifs de victoire (V2, décision de l'utilisateur du 14/11, specs/politique/regles-v2.md § 6).
   Cinq objectifs mesurés à la fin de la partie (tour 40), chacun avec trois paliers : bronze, argent, or.
   Puissance remplacée par **Influence** le 14/11 (la guerre n'est la spécialité de personne).
   Le joueur choisit au tour 1 son **ambition** (un objectif) : sa victoire est la médaille de cet objectif ; les autres
   ne sont qu'un bilan. Une révolution = défaite : aucune médaille. Seuils : fixés par simulation (outils/politique-simulateur.js --objectifs),
   l'or atteint par environ 10 à 15 % des parties d'un bot qui vise cet objectif, le bronze par environ la moitié.
   **Seuils par pays de départ** (décision du 14/11) : une médaille veut dire « bien joué pour ce pays ». */
(function(racine){
"use strict";
// seuils : { pays: [bronze, argent, or] }, tirés de 200 parties par bot et par pays (--objectifs --pays tous --seuils-proposes), validés le 14/11
const OBJECTIFS = {
  prosperite: { nom: "Prospérité", texte: "Trésor et valeur des bâtiments à la fin de la partie.",
    seuils: { equilibre: [5494, 6006, 6353], agricole: [6143, 6770, 6978], industriel: [5793, 6313, 6701], marchand: [6294, 6770, 7115], minier: [5840, 6310, 6778] } },
  contentement: { nom: "Contentement", texte: "100 moins la colère moyenne des factions, en moyenne sur toute la partie.",
    seuils: { equilibre: [79.5, 81.8, 82.7], agricole: [80.5, 83.9, 84.4], industriel: [79.2, 81.5, 82.1], marchand: [80.5, 81.6, 82], minier: [82.3, 83.5, 83.8] } },
  influence: { nom: "Influence", texte: "Poids économique chez les voisins, en moyenne sur la partie : 10 par contrat en cours et 10 par nation qui dépend de nos ventes (nos contrats de vente lui livrent au moins la moitié de ce qu'elle importe) ; plus 10 par exigence cédée.",
    seuils: { equilibre: [71, 73, 81], agricole: [59, 66, 72], industriel: [70, 73, 79], marchand: [64, 71, 78], minier: [72, 76, 81] } },
  concorde: { nom: "Concorde", texte: "Moyenne des relations avec les nations, plus 10 par traité en cours, à la fin de la partie.",
    seuils: { equilibre: [86, 107, 109], agricole: [86, 107, 109], industriel: [84, 107, 110], marchand: [86, 107, 110], minier: [86, 107, 109] } },
  autorite: { nom: "Autorité", texte: "Soutien des factions puissantes aux lois en vigueur : pour chaque loi en vigueur, puissance des factions pour moins puissance des factions contre ; moyenne par loi, puis moyenne sur la partie.",
    seuils: { equilibre: [35, 53, 54], agricole: [47, 50, 51], industriel: [30, 36, 40], marchand: [30, 54, 56], minier: [35, 38, 42] } }
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
  influence: [
    { id: "contrats", texte: "Avoir 2 contrats en cours.", valeur: 2 },
    { id: "dependantes", texte: "Garder 2 nations dépendantes de nos ventes pendant 20 tours (pas forcément de suite).", valeur: 2, tours: 20 },
    { id: "cedee", texte: "Obtenir qu'une nation cède à une exigence." }],
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
const R = { OBJECTIFS, ETAPES, MEDAILLES, pointsTraite: 10, pointsInfluence: 10, dependance: 0.5 };
if (typeof module !== "undefined" && module.exports) module.exports = R; else (racine.Politique = racine.Politique || {}).OBJECTIFS = R;
})(typeof window !== "undefined" ? window : globalThis);

/* Politique : objectifs de victoire (V2, décision de l'utilisateur du 14/11, specs/politique/regles-v2.md § 6).
   Cinq objectifs mesurés à la fin de la partie (tour 40), chacun avec trois paliers : bronze, argent, or.
   Puissance remplacée par **Influence** le 14/11 (la guerre n'est la spécialité de personne).
   Le joueur choisit au tour 1 son **ambition** (un objectif) : sa victoire est la médaille de cet objectif ; les autres
   ne sont qu'un bilan. Une révolution = défaite : aucune médaille. Seuils : fixés par simulation (outils/politique-simulateur.js --objectifs),
   l'or atteint par environ 10 à 15 % des parties d'un bot qui vise cet objectif, le bronze par environ la moitié.
   **Seuils par pays de départ** (décision du 14/11) : une médaille veut dire « bien joué pour ce pays ».
   Prospérité : mesurée aussi contre le bot commerce (14/11 : les contrats enrichissent sans viser la Prospérité). */
(function(racine){
"use strict";
// seuils : { pays: [bronze, argent, or] }, tirés de 200 parties par bot et par pays (--objectifs --pays tous --seuils-proposes), validés le 14/11
const OBJECTIFS = {
  prosperite: { nom: "Prospérité", texte: "Valeur de ce qui est bâti à la fin de la partie (bâtiments, agrandissements, défrichements et investissements à l'étranger, à leur prix), moins les dettes ; l'or en caisse ne compte pas.",
    seuils: { equilibre: [5185, 5375, 5485], agricole: [4945, 5380, 5585], industriel: [5120, 5320, 5495], marchand: [5435, 5575, 5825], minier: [5165, 5355, 5600] } },
  contentement: { nom: "Contentement", texte: "100 moins la colère moyenne des factions, en moyenne sur toute la partie.",
    seuils: { equilibre: [85.5, 86.1, 86.6], agricole: [85.9, 86.4, 86.7], industriel: [84.8, 85.6, 85.9], marchand: [86.3, 86.8, 87.1], minier: [86.4, 86.9, 87.3] } },
  influence: { nom: "Influence", texte: "Poids économique chez les voisins, en moyenne sur la partie : 10 par contrat en cours et 10 par nation qui dépend de nos ventes (nos contrats de vente lui livrent au moins la moitié de ce qu'elle importe) ; plus 10 par exigence cédée.",
    seuils: { equilibre: [112, 119, 125], agricole: [117, 124, 129], industriel: [113, 120, 128], marchand: [118, 127, 131], minier: [119, 127, 131] } },
  concorde: { nom: "Concorde", texte: "Moyenne des relations avec les nations, plus 10 par traité en cours, à la fin de la partie.",
    seuils: { equilibre: [55, 74, 80], agricole: [55, 74, 80], industriel: [54, 75, 81], marchand: [57, 73, 80], minier: [54, 75, 80] } },   // 16/11 : tous les seuils recalculés (lot « voies du joueur » : cinq factions…)
  autorite: { nom: "Autorité", texte: "Soutien des factions puissantes aux lois en vigueur : pour chaque loi en vigueur, puissance des factions pour moins puissance des factions contre ; moyenne par loi, puis moyenne sur la partie.",
    seuils: { equilibre: [49, 51, 52], agricole: [50, 52, 53], industriel: [43, 49, 56], marchand: [47, 56, 60], minier: [39, 49, 55] } }
};
// étapes (option 3, validées le 14/11 ; durcies après simulation : plusieurs étaient atteintes dès le départ) : trois repères par ambition, affichés et cochés pendant la partie (une fois
// atteints, ils restent cochés) ; ils guident sans rapporter de points. Le moteur les vérifie par leur id (moteur/objectifs.js).
const ETAPES = {
  prosperite: [
    { id: "batiments", texte: "Avoir 12 bâtiments en service.", valeur: 12 },
    { id: "regions_pleines", texte: "Remplir tous les emplacements de toutes les régions." },
    { id: "amenagements", texte: "Agrandir, défricher ou investir à l'étranger 12 fois au total.", valeur: 12 }],   // 16/11 : remplace « 3 000 or »
  contentement: [
    { id: "colere_moyenne", texte: "Faire descendre la colère moyenne des factions sous 20.", valeur: 20 },
    { id: "sans_grondement", texte: "Tenir 15 tours de suite sans qu'aucune faction dépasse 45 de colère.", valeur: 15, seuil: 45 },
    { id: "toutes_calmes", texte: "Avoir toutes les factions sous 30 de colère en même temps.", valeur: 30 }],
  influence: [
    { id: "contrats", texte: "Avoir 4 contrats en cours.", valeur: 4 },   // 16/11 : 2 → 4, ordre revu
    { id: "cedee", texte: "Obtenir qu'une nation cède à une exigence." },
    { id: "dependantes", texte: "Garder 2 nations dépendantes de nos ventes pendant 20 tours (pas forcément de suite).", valeur: 2, tours: 20 }],
  concorde: [
    { id: "traite", texte: "Signer un traité." },
    { id: "ami", texte: "Atteindre 50 de relation avec une nation.", valeur: 50 },
    { id: "relations", texte: "Avoir des relations à +30 en moyenne.", valeur: 30 }],
  autorite: [
    { id: "lois", texte: "Avoir 3 lois en vigueur.", valeur: 3 },
    { id: "legitimite", texte: "Avoir au moins 3 lois en vigueur avec, en moyenne, 20 de soutien net.", valeur: 20, lois: 3 },   // 16/11 : remplace « 5 lois plus soutenues que contestées »
    { id: "legitimite", texte: "Avoir au moins 5 lois en vigueur avec, en moyenne, 40 de soutien net (puissance des factions pour moins contre).", valeur: 40, lois: 5 }]
};
const MEDAILLES = ["bronze", "argent", "or"];   // 1, 2 et 3 points
// poidsInvestissement (16/11) : part du prix d'un investissement à l'étranger comptée dans la Prospérité (1 = validé ; 0,5 à l'essai)
const R = { OBJECTIFS, ETAPES, MEDAILLES, pointsTraite: 10, pointsInfluence: 10, dependance: 0.5, poidsInvestissement: 1 };
if (typeof module !== "undefined" && module.exports) module.exports = R; else (racine.Politique = racine.Politique || {}).OBJECTIFS = R;
})(typeof window !== "undefined" ? window : globalThis);

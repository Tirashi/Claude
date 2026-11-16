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
    seuils: { equilibre: [5120, 5260, 5385], agricole: [5140, 5340, 5465], industriel: [5135, 5300, 5395], marchand: [5370, 5550, 5710], minier: [5225, 5370, 5475] } },
  contentement: { nom: "Contentement", texte: "100 moins la colère moyenne des factions, en moyenne sur toute la partie.",
    seuils: { equilibre: [84.6, 85.7, 86.1], agricole: [84.6, 85.4, 85.8], industriel: [83.8, 84.6, 85.4], marchand: [85.5, 86, 86.3], minier: [86.1, 86.5, 86.7] } },
  influence: { nom: "Influence", texte: "Poids économique chez les voisins, en moyenne sur la partie : 10 par contrat en cours et 10 par nation qui dépend de nos ventes (nos contrats de vente lui livrent au moins la moitié de ce qu'elle importe) ; plus 10 par exigence cédée.",
    seuils: { equilibre: [87, 95, 99], agricole: [87, 95, 99], industriel: [95, 104, 109], marchand: [100, 108, 112], minier: [100, 108, 112] } },
  concorde: { nom: "Concorde", texte: "Moyenne des relations avec les nations, plus 10 par traité en cours, à la fin de la partie.",
    seuils: { equilibre: [55, 75, 81], agricole: [55, 76, 80], industriel: [57, 74, 81], marchand: [60, 74, 81], minier: [55, 74, 80] } },   // 16/11 : tous les seuils recalculés (lot « voies du joueur » : cinq factions…)
  autorite: { nom: "Autorité", texte: "Soutien des factions puissantes aux lois en vigueur : pour chaque loi en vigueur, puissance des factions pour moins puissance des factions contre ; moyenne par loi, puis moyenne sur la partie.",
    seuils: { equilibre: [35, 41, 43], agricole: [49, 52, 53], industriel: [34, 46, 49], marchand: [34, 38, 39], minier: [47, 50, 52] } }
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
// poidsInvestissement (16/11) : part du prix d'un investissement à l'étranger comptée dans la Prospérité (1 = validé ; 0,5 à l'essai)
const R = { OBJECTIFS, ETAPES, MEDAILLES, pointsTraite: 10, pointsInfluence: 10, dependance: 0.5, poidsInvestissement: 1 };
if (typeof module !== "undefined" && module.exports) module.exports = R; else (racine.Politique = racine.Politique || {}).OBJECTIFS = R;
})(typeof window !== "undefined" ? window : globalThis);

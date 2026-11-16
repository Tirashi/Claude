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
  prosperite: { nom: "Prospérité", texte: "Valeur de ce qui est bâti (bâtiments et agrandissements, à leur prix) à la fin de la partie, moins les dettes ; l'or en caisse ne compte pas.",
    seuils: { equilibre: [3480, 3765, 3930], agricole: [2895, 3465, 3705], industriel: [3240, 3885, 4160], marchand: [4230, 4400, 4470], minier: [3120, 4025, 4180] } },
  contentement: { nom: "Contentement", texte: "100 moins la colère moyenne des factions, en moyenne sur toute la partie.",
    seuils: { equilibre: [82.8, 83.8, 84.2], agricole: [81.2, 82.7, 83.3], industriel: [81, 82.6, 83.5], marchand: [83.8, 84.3, 84.4], minier: [84.5, 85, 85.4] } },
  influence: { nom: "Influence", texte: "Poids économique chez les voisins, en moyenne sur la partie : 10 par contrat en cours et 10 par nation qui dépend de nos ventes (nos contrats de vente lui livrent au moins la moitié de ce qu'elle importe) ; plus 10 par exigence cédée.",
    seuils: { equilibre: [110, 118, 122], agricole: [112, 119, 124], industriel: [109, 117, 125], marchand: [117, 127, 134], minier: [117, 125, 131] } },
  concorde: { nom: "Concorde", texte: "Moyenne des relations avec les nations, plus 10 par traité en cours, à la fin de la partie.",
    seuils: { equilibre: [55, 74, 79], agricole: [55, 74, 79], industriel: [55, 75, 79], marchand: [59, 74, 79], minier: [54, 72, 79] } },   // 16/11 : recalculés sans le traité de filature (projet commun)
  autorite: { nom: "Autorité", texte: "Soutien des factions puissantes aux lois en vigueur : pour chaque loi en vigueur, puissance des factions pour moins puissance des factions contre ; moyenne par loi, puis moyenne sur la partie.",
    seuils: { equilibre: [35, 53, 54], agricole: [47, 50, 51], industriel: [30, 36, 40], marchand: [30, 55, 56], minier: [35, 38, 42] } }
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

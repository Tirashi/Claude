/* Politique : budget de fin de partie (décisions de l'utilisateur du 14/11 : backlog H, pistes 1 et 2).
   NIVEAUX : agrandir un bâtiment de production sur place (niveau 2, puis 3), sans emplacement, avec le chantier de sa région.
   INSTITUTIONS : dépense chaque tour, niveau 0 à 3 par institution, un changement de niveau (±1) par institution et par tour.
   ASSUMPTION (budget de fin de partie, 14/11) : valeurs validées le 14/11 ; coûts des institutions doublés le 14/11 (10 / 22 / 36 → 20 / 44 / 72). */
(function(racine){
"use strict";
const NIVEAUX = {
  batiments: ["farm", "mine", "workshop", "weaving", "scierie", "mine_charbon", "vignoble"],   // bâtiments agrandissables
  cout: { 2: 1.5, 3: 2 },                                // × prix de base du bâtiment
  gain: 0.5                                              // chaque niveau : +50 % de production, de consommation et d'entretien
};
const INSTITUTIONS = {
  sante:        { nom: "Santé", cout: [0, 20, 44, 72], colere: -1,
                  texte: "Chaque niveau calme toutes les factions (−1 de colère par tour)." },
  enseignement: { nom: "Enseignement", cout: [0, 20, 44, 72], croissance: 0.0025, artisans: 0.1,
                  texte: "Chaque niveau : population +0,25 % par tour, ateliers et tissages +10 %." },
  police:       { nom: "Police", cout: [0, 20, 44, 72], debat: 0.05, greve: 3,
                  texte: "Chaque niveau : +5 % de chance d'adoption aux débats ; les grèves commencent 3 points de colère plus tard." }
};
// thésaurisation (15/11, ASSUMPTION) : trésor au-dessus de « tours » tours d'impôts → chaque faction dont la demande
// n'est pas satisfaite prend « colere » par tour. actif: false = règles d'avant (tests écrits avant).
const THESAURISATION = { actif: true, tours: 10, colere: 2,
  demandes: {
    ouvriers: { institution: "sante", niveau: 2, texte: "la Santé au niveau 2" },
    artisans: { institution: "enseignement", niveau: 2, texte: "l'Enseignement au niveau 2" },
    paysans:  { agrandis: "farm", nombre: 2, texte: "2 fermes agrandies" },
    patrons:  { agrandis: null, nombre: 4, texte: "4 agrandissements" } } };
const R = { NIVEAUX, INSTITUTIONS, THESAURISATION, max: 3 };
if (typeof module !== "undefined" && module.exports) module.exports = R; else (racine.Politique = racine.Politique || {}).INSTITUTIONS = R;
})(typeof window !== "undefined" ? window : globalThis);

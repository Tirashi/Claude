/* Politique : catalogue des bâtiments (RULES_V1 § Bâtiments).
   produit / consomme : par bâtiment et par tour. artisans : profite du bonus des lois d'éducation.
   jalon : à partir de quel jalon le bâtiment est constructible (les spéciaux attendent la diplomatie et la guerre). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

// entretien : or par tour et par bâtiment (salaires ; V2 budget, ASSUMPTION (budget) : environ 5 % du coût)
const BATIMENTS = {
  // délais raccourcis pour 40 tours (V2, validé le 13/11 ; V1 : 3, 4, 5, 5)
  farm:     { nom: "Ferme",            cout: 60,  delai: 2, produit: { grain: 20 }, entretien: 3 },
  mine:     { nom: "Mine",             cout: 80,  delai: 3, produit: { fer: 15 }, entretien: 4 },
  workshop: { nom: "Atelier d'outils", cout: 90,  delai: 3, produit: { outils: 10 }, entretien: 4, consomme: { fer: 5 }, artisans: true },  // ASSUMPTION validée : 5 fer
  weaving:  { nom: "Tissage national", cout: 110, delai: 3, produit: { tissu: 10 }, entretien: 5, artisans: true },
  // cofinancée 50/50 avec Brume (traité de filature conjointe) ; 6 tissu livrés à Brume : donnees/diplomatie.js
  entente_mill:   { nom: "Filature de l'Entente", cout: 100, partJoueur: 0.5, delai: 6, produit: { tissu: 18 }, entretien: 2, traite: "filature" },
  // armée (V2 étape 2, remplacent forge et fortifications) : la caserne permet de recruter dans sa région ;
  // le fort multiplie la défense de sa région (un par région, sans emplacement)
  caserne:        { nom: "Caserne",               cout: 60,  delai: 2, entretien: 3 },                                           // ASSUMPTION validée (V2)
  fort:           { nom: "Fort",                  cout: 80,  delai: 3, emplacement: false, unique: true, entretien: 4 }          // ASSUMPTION validée (V2)
};

if (NODE) module.exports = BATIMENTS; else (racine.Politique = racine.Politique || {}).BATIMENTS = BATIMENTS;
})(typeof window !== "undefined" ? window : globalThis);

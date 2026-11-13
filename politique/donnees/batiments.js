/* Politique : catalogue des bâtiments (RULES_V1 § Bâtiments).
   produit / consomme : par bâtiment et par tour. artisans : profite du bonus des lois d'éducation.
   jalon : à partir de quel jalon le bâtiment est constructible (les spéciaux attendent la diplomatie et la guerre). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const BATIMENTS = {
  // délais raccourcis pour 40 tours (V2, validé le 13/11 ; V1 : 3, 4, 5, 5)
  farm:     { nom: "Ferme",            cout: 60,  delai: 2, produit: { grain: 20 } },
  mine:     { nom: "Mine",             cout: 80,  delai: 3, produit: { fer: 15 } },
  workshop: { nom: "Atelier d'outils", cout: 90,  delai: 3, produit: { outils: 10 }, consomme: { fer: 5 }, artisans: true },  // ASSUMPTION validée : 5 fer
  weaving:  { nom: "Tissage national", cout: 110, delai: 3, produit: { tissu: 10 }, artisans: true },
  // cofinancée 50/50 avec Brume (traité de filature conjointe) ; 6 tissu livrés à Brume : donnees/diplomatie.js
  entente_mill:   { nom: "Filature de l'Entente", cout: 100, partJoueur: 0.5, delai: 6, produit: { tissu: 18 }, traite: "filature" },
  // force militaire (donnees/guerre.js) ; la forge convertit 10 fer + 8 or par tour en +15 % de force
  forge:          { nom: "Forge d'armes",         cout: 120, delai: 5, consomme: { fer: 10 }, entretien: 8 },
  fortifications: { nom: "Fortifications",        cout: 150, delai: 6, emplacement: false }   // n'occupe pas d'emplacement (V2)
};

if (NODE) module.exports = BATIMENTS; else (racine.Politique = racine.Politique || {}).BATIMENTS = BATIMENTS;
})(typeof window !== "undefined" ? window : globalThis);

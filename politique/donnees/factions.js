/* Politique : factions (RULES_V1 § Factions). Colère 0-100 (court terme), puissance 0-100 (long terme).
   « ASSUMPTION validée » : validée le 13/11 (« (M2) » : proposée avec M2). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const FACTIONS = {
  // batiments : ceux qui s'arrêtent quand la faction fait grève ou se révolte ; ASSUMPTION validée (M2)
  paysans:  { nom: "Paysans",  batiments: ["farm"] },
  ouvriers: { nom: "Ouvriers", batiments: ["mine"] },
  artisans: { nom: "Artisans", batiments: ["workshop", "weaving"] },
  patrons:  { nom: "Patrons",  batiments: [], impots: true }      // leur grève touche les impôts ; ASSUMPTION validée (M2)
};

const REGLES_FACTIONS = {
  bornes: { min: 0, max: 100 },                     // colère 0-100 (RULES_V1) ; puissance 0-100 : ASSUMPTION validée
  seuils: { grondement: 55, greve: 75, revolution: 100 },     // RULES_V1
  revolte: { puissance: 85, colere: 70 },                     // RULES_V1 : risque de révolte
  apaisement: { cout: 12, colere: -18, demiPrix: 0.5 },       // RULES_V1 ; une fois par faction et par tour : ASSUMPTION validée
  dissipation: 1,                                   // V1 : −1 colère par tour (×2 par le code du travail) ; remplacée par le niveau de vie
  // V2 étape 3, niveau de vie (validé le 13/11) : « chaque faction veut que le pays produise ses biens ».
  // couverture d'un bien = production / consommation du pays (au plus 100 %) ; moyenne sur le panier ;
  // ≥ 100 % : aise (−2 colère/tour, ×2 pour les ouvriers avec le code du travail) ; < 50 % : gêne (+2/tour) ; entre les deux : 0.
  // actif: false : dissipation fixe de la V1 (utilisé par les tests de règles écrits avant le niveau de vie)
  niveauDeVie: { actif: true, aise: -2, gene: 2, seuilAise: 1, seuilGene: 0.5,
                 paniers: { paysans: ["grain"], ouvriers: ["grain", "outils"], artisans: ["tissu", "outils"], patrons: ["tissu", "fer"] } },
  ralentissement: 0.5,                              // RULES_V1 (suffrages) : « colère montante 2× plus lente » ; s'applique à toute hausse de colère
                                                    // (chocs et effets par tour) des factions favorisées : ASSUMPTION validée (M2)
  // moral (À TRANCHER n° 3, validé) : 1 jusqu'à colère 40, puis linéaire jusqu'à 0 à 100 ; grève plafonnée à 0,5 ; révolte 0 ;
  // moyenne pondérée par la puissance
  moral: { calme: 40, plafondGreve: 0.5 },
  // conséquences des statuts : ASSUMPTION validée (M2)
  greve: { production: 0.5, impots: 0.8 },          // bâtiments de la faction à moitié ; grève des patrons : impôts ×0,8
  revolteEffets: { production: 0, impots: 0.5 },    // révolte : bâtiments arrêtés ; patrons : impôts ×0,5
  revolutionFin: true                               // colère 100 : révolution, la partie est perdue
};

const Factions = { FACTIONS, REGLES_FACTIONS };
if (NODE) module.exports = Factions; else (racine.Politique = racine.Politique || {}).FACTIONS = Factions;
})(typeof window !== "undefined" ? window : globalThis);

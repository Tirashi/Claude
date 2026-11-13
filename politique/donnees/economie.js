/* Politique : constantes de l'économie, du capital politique et de la démographie (RULES_V1).
   « ASSUMPTION validée » = valeur proposée par Claude, validée par l'utilisateur le 13/11. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const ECONOMIE = {
  biens: ["grain", "fer", "tissu", "outils"],
  prix: { grain: 1.0, fer: 1.5, tissu: 2.0, outils: 2.0 },        // RULES_V1
  // surplus vendu, déficit acheté, aucun stock         // ASSUMPTION validée
  // V2 étape 3, marché (validé le 13/11) : « plus tu vends d'un bien dans le tour, moins il rapporte ; plus tu en achètes,
  // plus il coûte » : vente = prix × (1 − pente × vendu), au moins ×min ; achat = prix × (1 + pente × acheté), au plus ×max.
  // pente 0 : prix fixes de la V1 (utilisé par les tests de règles écrits avant le marché)
  marche: { pente: 0.01, min: 0.5, max: 1.5 },
  besoinsParFamille: { grain: 1, fer: 0, tissu: 0.2, outils: 0.1 }, // ASSUMPTION validée (grain ≈ 1 : RULES_V1)
  besoinsArmee: { fer: 4, tissu: 2 },                               // ASSUMPTION validée (toujours, même la milice)
  impotParFamille: 1,                                               // ASSUMPTION validée : revenu de base = familles × 1 or

  // V2 étape 4 : plus de capital politique (V1 : +15 par tour) ni de délai fixe des lois (débat : donnees/lois.js)
  // V2 : un chantier par région (moteur/batiments.js) ; V1 : 2 chantiers pour tout le pays

  croissance: 0.01,              // ASSUMPTION validée : +1 % de familles par tour
  plafondFamilles: 200,          // ASSUMPTION validée
  montee: 10                     // ASSUMPTION validée : les effets « à terme » montent en ligne droite sur 10 tours après l'adoption
};

if (NODE) module.exports = ECONOMIE; else (racine.Politique = racine.Politique || {}).ECONOMIE = ECONOMIE;
})(typeof window !== "undefined" ? window : globalThis);

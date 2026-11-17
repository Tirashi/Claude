/* Politique : petits calculs communs du moteur (arrondis). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const arrondi = x => Math.round(x * 100) / 100;     // au centième (or, prix, relations)
const dixieme = x => Math.round(x * 10) / 10;
const Calcul = { arrondi, dixieme };
if (NODE) module.exports = Calcul; else (racine.Politique = racine.Politique || {}).Calcul = Calcul;
})(typeof window !== "undefined" ? window : globalThis);

/* Politique : guerre et paix (RULES_V1 § Guerre ; propositions de M3b validées le 13/11, specs/politique.md § 6).
   « ASSUMPTION validée (M3) » = proposée avant M3, validée ; « ASSUMPTION (M3b) » = détail ajouté en écrivant M3b, à confirmer. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const GUERRE = {
  // force = trésor (≥ 0) × loi militaire × moral × bonus (multipliés : À TRANCHER, validé) ; forces d'un camp additionnées
  forge: 1.15,                      // RULES_V1 ; un seul bonus quel que soit le nombre de forges : ASSUMPTION (M3b)
  fortifications: 1.2,              // RULES_V1, en défense seulement ; un seul bonus : ASSUMPTION (M3b)
  // la forge consomme 10 fer + 8 or par tour (RULES_V1) : donnees/batiments.js

  defaite: { tresor: 0.25, colere: 10 },          // RULES_V1 (−25 %) ; +10 colère : ASSUMPTION validée (M3)
  capitulation: 0.3,                // moral sous lequel un camp capitule (usure) : ASSUMPTION validée (M3)
  paixBlanche: 5,                   // tours sans bataille avant une paix blanche : ASSUMPTION validée (M3)
  // l'ennemi accepte la paix blanche s'il n'est pas plus fort que le camp du joueur : ASSUMPTION (M3b)
  reparations: { part: 0.25, max: 300 },          // ASSUMPTION validée (M3) (Paix de Brume : 300)
  nonRearmement: 15,                // RULES_V1 ; le perdant ne peut ni changer de loi militaire ni bâtir de forge
  reputation: { agression: -20, attaqueEntente: -30 },   // barème validé (l'attaque d'un membre de l'Entente remplace l'agression)
  relationGuerre: -100,             // ASSUMPTION validée (M3)
  uneSeuleGuerre: true,             // une seule guerre à la fois : ASSUMPTION (M3b)

  // politiques des nations (par caractère) : ASSUMPTION validée (M3)
  politiques: {
    militariste:  { declare: { ratio: 1.2, relationMax: 0, proba: 0.3 }, bataille: true },
    commercante:  { declare: null, bataille: true },
    opportuniste: { declare: null, bataille: true, rejoint: 0.5 }
  }
};

if (NODE) module.exports = GUERRE; else (racine.Politique = racine.Politique || {}).GUERRE = GUERRE;
})(typeof window !== "undefined" ? window : globalThis);

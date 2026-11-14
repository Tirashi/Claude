/* Politique : guerre et paix (RULES_V1 § Guerre ; V2 étape 2 : armée en régiments, specs/politique/regles-v2.md § 5).
   « ASSUMPTION validée (V2) » = premier jet V2 validé le 13/11 ; « ASSUMPTION (V2 étape 2) » = détail ajouté en écrivant
   l'étape 2, à confirmer. Les nombres de la V1 encore utilisés gardent leur marque. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const GUERRE = {
  // force = régiments × loi militaire × moral (× fort dans la région défendue) ; forces d'un camp additionnées ; le trésor ne compte plus
  regiment: { cout: 30, entretien: 3, depart: 3 },          // ASSUMPTION validée (V2)
  parFamilles: 10,                  // au plus 1 régiment pour 10 familles : ASSUMPTION (V2 étape 2)
  recrueParCaserne: 1,              // 1 régiment par caserne et par tour : ASSUMPTION (V2 étape 2)
  fort: 1.5,                        // défense de la région ×1,5 : ASSUMPTION validée (V2) ; un fort par région : ASSUMPTION (V2 étape 2)
  pertes: { perdant: 0.25, gagnant: 0.10 },   // part des régiments de chaque membre du camp (perdant arrondi au-dessus, gagnant en dessous) : ASSUMPTION validée (V2)
  defaite: { colere: 5 },           // colère d'une défaite (13/11 : 10 → 5) ; le trésor ne paie plus les défaites (V2)

  capitulation: 0.3,                // moral sous lequel un camp capitule (usure) : ASSUMPTION validée (M3)
  // candidats en essai (désactivés, à valider) : colère par tour et par région occupée (nos factions / la nation) ;
  // tour avant lequel une nation ne déclare pas la guerre (declare.tourMin)
  occupationColere: 0,
  capitulationSansRegiment: true,   // capitule aussi : plus aucun régiment et au moins une de ses régions occupée : ASSUMPTION (V2 étape 2)
  capitulationMoitie: false,        // (en essai, 14/11) capitule quand la moitié de ses régions (arrondie au-dessus) est occupée
  // clauses imposées au joueur quand l'ordinateur gagne (en essai, 14/11 : sans non-réarmement ?)
  clausesIA: { reparations: true, lever_embargo: true, non_rearmement: true, cession: true },
  paixBlanche: 5,                   // tours sans bataille avant une paix blanche : ASSUMPTION validée (M3)
  // l'ennemi accepte la paix blanche s'il n'est pas plus fort que le camp du joueur : ASSUMPTION validée (M3b)
  reparations: { part: 0.25, max: 300 },          // ASSUMPTION validée (M3) (Paix de Brume : 300)
  nonRearmement: 15,                // RULES_V1 ; V2 : le perdant ne peut plus recruter
  // cession (V2, validée le 13/11) : le vainqueur garde la région occupée la plus riche ; les autres sont rendues
  reputation: { agression: -20, attaqueEntente: -30 },   // barème validé (l'attaque d'un membre de l'Entente remplace l'agression)
  relationGuerre: -100,             // ASSUMPTION validée (M3)
  treve: 10,                        // tours sans déclaration de guerre entre anciens ennemis après une paix (backlog E1, accepté le 13/11)
  uneSeuleGuerre: true,             // une seule guerre à la fois : ASSUMPTION validée (M3b)

  // le comportement des nations (déclaration, recrutement, ralliement, force) vient du persona de leur dirigeant : donnees/personas.js
};

if (NODE) module.exports = GUERRE; else (racine.Politique = racine.Politique || {}).GUERRE = GUERRE;
})(typeof window !== "undefined" ? window : globalThis);

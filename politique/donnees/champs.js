/* Politique : scénario « champs » (partie 1 : la République des Champs, Tessia la Rouge).
   Toutes les valeurs de départ vivent ici. Celles que la partie 1 n'a jamais chiffrées sont
   marquées ASSUMPTION (propositions de Claude validées le 13/11 : specs/politique.md § 4). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const SCENARIO_CHAMPS = {
  id: "champs",
  nom: "La République des Champs",
  dirigeant: "Tessia la Rouge",
  tours: 40,                          // V2 : 40 tours (décision du 13/11 ; 60 en V1)

  joueur: {
    tresor: 200,                      // ASSUMPTION validée : 2 à 3 bâtiments d'avance, rien de plus
    cp: 0,                            // ASSUMPTION validée : capital politique de départ (la 1re loi vers le tour 3)
    familles: 80,                     // ASSUMPTION validée : 80 familles = 80 grain/tour = 4 fermes
    // V2 : 4 régions fixes (terrain, emplacements, bâtiments de départ) ; ni atelier ni tissage (crise du tissu du tour 1)
    regions: {                                                                                          // ASSUMPTION validée (V2)
      plaine:   { nom: "Plaine du Nord", terrain: "fertile", emplacements: 4, batiments: { farm: 2 } },
      vallee:   { nom: "Vallée",         terrain: "mixte",   emplacements: 3, batiments: { farm: 2 } },
      collines: { nom: "Collines",       terrain: "filons",  emplacements: 3, batiments: { mine: 1 } },
      bourg:    { nom: "Bourg",          terrain: "ville",   emplacements: 4, batiments: {} }
    },
    factions: {                       // ASSUMPTION validée : colère et puissance de départ (patrons 45 = valeur connue en fin de partie)
      paysans:  { colere: 30, puissance: 40 },
      ouvriers: { colere: 35, puissance: 25 },
      artisans: { colere: 25, puissance: 30 },
      patrons:  { colere: 20, puissance: 45 }
    },
    reputation: 0                     // ASSUMPTION validée
  },

  // événements écrits du scénario (pas de tirage en V1)
  evenements: [
    { tour: 1, id: "crise_tissu", texte: "Crise du tissu : le prix du tissu s'envole.", prix: { tissu: 1.5 }, duree: 6 }   // ASSUMPTION validée
  ],

  // nations de l'ordinateur (modèle simplifié, M3a : specs/politique.md § 6, validé le 13/11)
  // taux : impôts par famille ; force : loi militaire fixe (M3b) ; colere : départ ;
  // exporte / importe : volumes fixes par tour (servent aux embargos)
  nations: {
    val_roc:     { nom: "Val-Roc",        dirigeant: "Vermeil", caractere: "militariste", relation: -20, tresor: 400, familles: 90,   // ASSUMPTION validée
                   taux: 1.0, force: 1.6, colere: 30, exporte: { fer: 10 }, importe: { grain: 15, tissu: 5 } },                     // ASSUMPTION validée (M3)
    brume:       { nom: "Brume-la-Brume", dirigeant: "Ferreol", caractere: "commercante", relation:  20, tresor: 600, familles: 100,  // ASSUMPTION validée
                   taux: 1.3, force: 1.0, colere: 20, exporte: { tissu: 20 }, importe: { fer: 10, grain: 5 } },                     // ASSUMPTION validée (M3)
    contreforts: { nom: "Contreforts",    dirigeant: "Harl",    caractere: "opportuniste", relation:  0, tresor: 150, familles: 50,   // ASSUMPTION validée
                   taux: 1.0, force: 1.3, colere: 25, exporte: { outils: 10 }, importe: { grain: 5 } }                              // ASSUMPTION validée (M3)
  }
};

if (NODE) module.exports = SCENARIO_CHAMPS; else (racine.Politique = racine.Politique || {}).SCENARIO_CHAMPS = SCENARIO_CHAMPS;
})(typeof window !== "undefined" ? window : globalThis);

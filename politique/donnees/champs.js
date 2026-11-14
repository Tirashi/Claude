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
    familles: 80,                     // ASSUMPTION validée : 80 familles = 80 grain/tour = 4 fermes
    // V2 : 4 régions fixes (terrain, emplacements, bâtiments de départ) ; ni atelier ni tissage (crise du tissu du tour 1)
    regions: {                                                                                          // ASSUMPTION validée (V2)
      plaine:   { nom: "Plaine du Nord", terrain: "fertile", emplacements: 4, batiments: { farm: 2 } },
      vallee:   { nom: "Vallée",         terrain: "mixte",   emplacements: 3, batiments: { farm: 2 } },
      collines: { nom: "Collines",       terrain: "filons",  emplacements: 3, batiments: { mine: 1 } },
      bourg:    { nom: "Bourg",          terrain: "ville",   emplacements: 4, batiments: { caserne: 1 } }   // caserne de départ (validée le 14/11)
    },
    factions: {                       // ASSUMPTION validée : colère et puissance de départ (patrons 45 = valeur connue en fin de partie)
      paysans:  { colere: 30, puissance: 40 },
      ouvriers: { colere: 35, puissance: 25 },
      artisans: { colere: 25, puissance: 30 },
      patrons:  { colere: 20, puissance: 45 }
    },
    reputation: 0,                    // ASSUMPTION validée
    regiments: 3                      // V2 : régiments de départ (ASSUMPTION validée (V2)) ; pas de caserne au départ : ASSUMPTION (V2 étape 2)
  },

  // événements écrits : aucun (13/11 : personne n'est en crise au début de la partie ; la crise du tissu de la V1 est retirée)
  evenements: [],

  // nations de l'ordinateur : la mise en place est fixe (régions, économie, échanges) ; le caractère vient du persona de leur
  // dirigeant, tiré au hasard (donnees/personas.js). Relation de départ : +10 pour toutes (décision du 13/11).
  // taux : impôts par famille ; exporte / importe : volumes fixes par tour (contrats, embargos) ; 3 régions chacune
  // (noms et terrains : ASSUMPTION (V2 étape 2) ; le revenu d'une nation suit la part de ses régions qu'elle contrôle)
  nations: {
    val_roc:     { nom: "Val-Roc",        dirigeant: "Vermeil", relation: 10, tresor: 400, familles: 90,     // ASSUMPTION validée
                   taux: 1.0, colere: 30, exporte: { fer: 10 }, importe: { grain: 15, tissu: 5 },                       // ASSUMPTION validée (M3)
                   regions: { hauts: { nom: "Hauts-Rocs", terrain: "filons" }, forges: { nom: "Forges de Vermeil", terrain: "ville" }, marches: { nom: "Marches de l'Ouest", terrain: "mixte" } } },
    brume:       { nom: "Brume-la-Brume", dirigeant: "Ferreol", relation: 10, tresor: 600, familles: 100,    // ASSUMPTION validée
                   taux: 1.3, colere: 20, exporte: { tissu: 20 }, importe: { fer: 10, grain: 5 },                       // ASSUMPTION validée (M3)
                   regions: { port: { nom: "Port de Brume", terrain: "ville" }, marais: { nom: "Marais", terrain: "mixte" }, coteaux: { nom: "Coteaux", terrain: "fertile" } } },
    contreforts: { nom: "Contreforts",    dirigeant: "Harl",    relation: 10, tresor: 150, familles: 50,     // ASSUMPTION validée
                   taux: 1.0, colere: 25, exporte: { outils: 10 }, importe: { grain: 5 },                               // ASSUMPTION validée (M3)
                   regions: { cols: { nom: "Cols", terrain: "filons" }, paturages: { nom: "Pâturages", terrain: "fertile" }, bastide: { nom: "Bastide", terrain: "ville" } } }
  }
};

if (NODE) module.exports = SCENARIO_CHAMPS; else (racine.Politique = racine.Politique || {}).SCENARIO_CHAMPS = SCENARIO_CHAMPS;
})(typeof window !== "undefined" ? window : globalThis);

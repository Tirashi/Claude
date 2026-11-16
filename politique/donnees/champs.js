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
      plaine:   { nom: "Plaine du Nord", terrain: "fertile", emplacements: 4, batiments: { farm: 2, vignoble: 1 } },   // vignoble de départ (15/11 : sans vin, les patrons partaient en gêne)
      vallee:   { nom: "Vallée",         terrain: "mixte",   emplacements: 4, batiments: { farm: 2 } },
      collines: { nom: "Collines",       terrain: "filons",  emplacements: 3, batiments: { mine: 1 } },
      bourg:    { nom: "Bourg",          terrain: "ville",   emplacements: 4, batiments: { caserne: 1 } }   // caserne de départ (validée le 14/11)
    },
    factions: {                       // colère et puissance de départ (ASSUMPTION validée) ; cinq factions le 16/11 (paysans 40 → 35, patrons 45 → 40)
      ouvriers:      { colere: 35, puissance: 25 },
      paysans:       { colere: 30, puissance: 35 },
      artisans:      { colere: 25, puissance: 30 },
      patrons:       { colere: 20, puissance: 40 },
      conservateurs: { colere: 20, puissance: 30 }
    },
    reputation: 0,                    // ASSUMPTION validée
    regiments: 3                      // V2 : régiments de départ (ASSUMPTION validée (V2)) ; pas de caserne au départ : ASSUMPTION validée (V2 étape 2)
  },

  // événements écrits : aucun (13/11 : personne n'est en crise au début de la partie ; la crise du tissu de la V1 est retirée)
  evenements: [],

  // nations de l'ordinateur : la mise en place est fixe (régions, économie, échanges) ; le caractère vient du persona de leur
  // dirigeant, tiré au hasard (donnees/personas.js). Relation de départ : +10 pour toutes (décision du 13/11).
  // taux : impôts par famille ; exporte / importe : volumes fixes par tour (contrats, embargos) ; 3 régions chacune
  // (noms et terrains : ASSUMPTION validée (V2 étape 2) ; le revenu d'une nation suit la part de ses régions qu'elle contrôle)
  nations: {
    val_roc:     { nom: "Val-Roc",        dirigeant: "Vermeil", distance: 1, relation: 10, tresor: 400, familles: 90,     // ASSUMPTION validée
                   taux: 1.0, colere: 30, exporte: { fer: 10, charbon: 10 }, importe: { grain: 15, tissu: 5, vin: 5 },                       // ASSUMPTION validée (M3)
                   regions: { hauts: { nom: "Hauts-Rocs", terrain: "filons" }, forges: { nom: "Forges de Vermeil", terrain: "ville" }, marches: { nom: "Marches de l'Ouest", terrain: "mixte" } } },
    brume:       { nom: "Brume-la-Brume", dirigeant: "Ferreol", distance: 2, relation: 10, tresor: 600, familles: 100,    // ASSUMPTION validée
                   taux: 1.3, colere: 20, exporte: { tissu: 20, vin: 10 }, importe: { fer: 10, grain: 5, bois: 10 },                       // ASSUMPTION validée (M3)
                   regions: { port: { nom: "Port de Brume", terrain: "ville" }, marais: { nom: "Marais", terrain: "mixte" }, coteaux: { nom: "Coteaux", terrain: "fertile" } } },
    contreforts: { nom: "Contreforts",    dirigeant: "Harl",    distance: 1, relation: 10, tresor: 150, familles: 50,     // ASSUMPTION validée
                   taux: 1.0, colere: 25, exporte: { outils: 10, bois: 10 }, importe: { grain: 5, charbon: 5 },                               // ASSUMPTION validée (M3)
                   regions: { cols: { nom: "Cols", terrain: "filons" }, paturages: { nom: "Pâturages", terrain: "fertile" }, bastide: { nom: "Bastide", terrain: "ville" } } },
    // trois nations de plus (15/11, ASSUMPTION (nations)) : plusieurs sources et plusieurs débouchés pour chaque ressource
    aurele:      { nom: "Aurèle",         dirigeant: "Clémence", distance: 3, relation: 10, tresor: 300, familles: 110,
                   taux: 1.0, colere: 25, exporte: { grain: 20, vin: 5 }, importe: { outils: 10, fer: 5, tissu: 5 },
                   regions: { epis: { nom: "Plaine des Épis", terrain: "fertile" }, vignes: { nom: "Coteaux d'Aurèle", terrain: "fertile" }, halle: { nom: "Halle d'Aurèle", terrain: "ville" } } },
    port_salin:  { nom: "Port-Salin",     dirigeant: "Odon",     distance: 3, relation: 10, tresor: 700, familles: 70,
                   taux: 1.4, colere: 20, exporte: { tissu: 10, outils: 5 }, importe: { bois: 10, vin: 10, charbon: 5 },
                   regions: { quais: { nom: "Quais de Salin", terrain: "ville" }, salines: { nom: "Salines", terrain: "mixte" }, comptoir: { nom: "Comptoir", terrain: "ville" } } },
    hautefage:   { nom: "Hautefage",      dirigeant: "Bertille", distance: 2, relation: 10, tresor: 250, familles: 80,
                   taux: 1.0, colere: 25, exporte: { bois: 15, fer: 10 }, importe: { charbon: 10, grain: 10 },
                   regions: { futaie: { nom: "Grande Futaie", terrain: "mixte" }, fonderies: { nom: "Fonderies de Hautefage", terrain: "filons" }, essarts: { nom: "Essarts", terrain: "mixte" } } }
  },
  // tirage au début de la partie (15/11) : au plus 2 dirigeants avec le même persona ; volumes d'échanges × (1 ± 0,5)
  tirage: { personasIdentiques: 2, variation: 0.5 }
};

if (NODE) module.exports = SCENARIO_CHAMPS; else (racine.Politique = racine.Politique || {}).SCENARIO_CHAMPS = SCENARIO_CHAMPS;
})(typeof window !== "undefined" ? window : globalThis);

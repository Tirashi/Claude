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
  tours: 60,                          // RULES_V1 § Cadre

  joueur: {
    tresor: 200,                      // ASSUMPTION validée : 2 à 3 bâtiments d'avance, rien de plus
    cp: 0,                            // ASSUMPTION validée : capital politique de départ (la 1re loi vers le tour 3)
    familles: 80,                     // ASSUMPTION validée : 80 familles = 80 grain/tour = 4 fermes
    batiments: { farm: 4, mine: 1 },  // ASSUMPTION validée : ni atelier ni tissage (d'où la crise du tissu du tour 1)
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

  // nations de l'ordinateur : seulement l'identité et les relations en M0 ; statistiques détaillées en M3
  nations: {
    val_roc:     { nom: "Val-Roc",        dirigeant: "Vermeil", caractere: "militariste", relation: -20, tresor: 400, familles: 90 },  // ASSUMPTION validée : relation, trésor, familles
    brume:       { nom: "Brume-la-Brume", dirigeant: "Ferreol", caractere: "commercante", relation:  20, tresor: 600, familles: 100 }, // ASSUMPTION validée
    contreforts: { nom: "Contreforts",    dirigeant: "Harl",    caractere: "opportuniste", relation:  0, tresor: 150, familles: 50 }   // ASSUMPTION validée
  }
};

if (NODE) module.exports = SCENARIO_CHAMPS; else (racine.Politique = racine.Politique || {}).SCENARIO_CHAMPS = SCENARIO_CHAMPS;
})(typeof window !== "undefined" ? window : globalThis);

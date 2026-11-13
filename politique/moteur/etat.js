/* Politique : l'état d'une partie. Un objet JSON simple (sauvé tel quel), jamais muté par le moteur :
   tourSuivant (tour.js) en renvoie une copie. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const Alea = NODE ? require("./alea.js") : racine.Politique.Alea;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;
const VERSION = 1;

const copie = o => JSON.parse(JSON.stringify(o));

function creerEtat(scenario, graine){
  const j = scenario.joueur, profils = {};
  for (const id in scenario.nations){
    const n = scenario.nations[id];
    profils[id] = { nom: n.nom, caractere: n.caractere, taux: n.taux, force: n.force, exporte: copie(n.exporte), importe: copie(n.importe) };
  }
  const e = {
    version: VERSION,
    scenario: scenario.id,
    tour: 1,
    tourMax: scenario.tours,
    alea: Alea.creer(graine).s,       // état du hasard, rangé avec la partie
    tresor: j.tresor,
    cp: j.cp,
    familles: j.familles,
    reputation: j.reputation,
    factions: copie(j.factions),      // f → { colere, puissance, statut }
    moral: 1,                         // moral du pays (0 à 1), recalculé chaque tour
    apaises: [],                      // factions déjà apaisées ce tour
    batiments: copie(j.batiments),
    chantiers: [],                    // bâtiments en construction : [{ id, restant }]
    lois: {},                         // catégorie → { id, depuis } (loi en vigueur)
    loisEnCours: [],                  // lois lancées, pas encore adoptées : [{ id, adoption }]
    evenements: copie(scenario.evenements || []),   // événements écrits du scénario
    modifPrix: [],                    // [{ prix: { bien: facteur }, jusqua }] (événements ; traités en M3)
    bilan: null,                      // économie du dernier tour (Economie.bilan)
    nations: Diplomatie.nationsInitiales(scenario),   // id → { relation, tresor, familles, colere, moral }
    profils,                          // id → profil fixe de la nation (taux, force, exporte, importe)
    contrats: [],                     // [{ id, jusqua }]
    embargos: [],                     // nations sous embargo du joueur
    traites: [],                      // [{ type, avec, depuis }]
    dons: [],                         // nations ayant reçu un don ce tour
    sanctions: [],                    // embargos entre nations ou contre le joueur : [{ par, contre }] (sanctions de bloc)
    guerre: null,                     // la guerre en cours (moteur/guerre.js)
    nonRearmement: {},                // camp ("joueur" ou nation) → dernier tour de la clause
    fin: false,
    issue: null,                      // fin de partie : { type: "fin" } ou { type: "revolution", faction }
    journal: []                       // messages du tour, pour l'écran et les rapports
  };
  Factions.evaluer(e);
  return e;
}

const Etat = { VERSION, creerEtat, copie };
if (NODE) module.exports = Etat; else (racine.Politique = racine.Politique || {}).Etat = Etat;
})(typeof window !== "undefined" ? window : globalThis);

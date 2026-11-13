/* Politique : l'état d'une partie. Un objet JSON simple (sauvé tel quel), jamais muté par le moteur :
   tourSuivant (tour.js) en renvoie une copie. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const Alea = NODE ? require("./alea.js") : racine.Politique.Alea;
const VERSION = 1;

const copie = o => JSON.parse(JSON.stringify(o));

function creerEtat(scenario, graine){
  const j = scenario.joueur, nations = {};
  for (const id in scenario.nations){
    const n = scenario.nations[id];
    nations[id] = { relation: n.relation, tresor: n.tresor, familles: n.familles };
  }
  return {
    version: VERSION,
    scenario: scenario.id,
    tour: 1,
    tourMax: scenario.tours,
    alea: Alea.creer(graine).s,       // état du hasard, rangé avec la partie
    tresor: j.tresor,
    cp: j.cp,
    familles: j.familles,
    reputation: j.reputation,
    factions: copie(j.factions),
    batiments: copie(j.batiments),
    chantiers: [],                    // bâtiments en construction : [{ id, restant }]
    lois: {},                         // catégorie → { id, depuis } (loi en vigueur)
    loisEnCours: [],                  // lois lancées, pas encore adoptées : [{ id, adoption }]
    evenements: copie(scenario.evenements || []),   // événements écrits du scénario
    modifPrix: [],                    // [{ prix: { bien: facteur }, jusqua }] (événements ; traités en M3)
    bilan: null,                      // économie du dernier tour (Economie.bilan)
    nations,
    fin: false,
    journal: []                       // messages du tour, pour l'écran et les rapports
  };
}

const Etat = { VERSION, creerEtat, copie };
if (NODE) module.exports = Etat; else (racine.Politique = racine.Politique || {}).Etat = Etat;
})(typeof window !== "undefined" ? window : globalThis);

/* Politique : l'état d'une partie. Un objet JSON simple (sauvé tel quel), jamais muté par le moteur :
   tourSuivant (tour.js) en renvoie une copie. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const Alea = NODE ? require("./alea.js") : racine.Politique.Alea;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;
const PERSONAS = NODE ? require("../donnees/personas.js") : racine.Politique.PERSONAS;
const PAYS = NODE ? require("../donnees/pays.js") : racine.Politique.PAYS;
const DIPLO = NODE ? require("../donnees/diplomatie.js") : racine.Politique.DIPLOMATIE;
const { LOIS } = NODE ? require("../donnees/lois.js") : racine.Politique.LOIS;
const VERSION = 4;   // V2 : régions ; personas ; pays de départ
// totaux des bâtiments du pays (même calcul que Batiments.totaux, sans dépendance circulaire)
function totaux(regions){
  const t = {};
  for (const r in regions) for (const id in regions[r].batiments) t[id] = (t[id] || 0) + regions[r].batiments[id];
  return t;
}

const copie = o => JSON.parse(JSON.stringify(o));

// pays : pays de départ choisi par le joueur (donnees/pays.js) ; par défaut le pays équilibré
function creerEtat(scenario, graine, pays){
  pays = pays || "equilibre";
  const P = PAYS[pays];
  if (!P) throw new Error("pays inconnu : " + pays);
  const j = scenario.joueur, profils = {}, regions = copie(j.regions), r = Alea.creer(graine);
  const factions = copie(j.factions), lois = {};
  for (const f in P.factions) factions[f].puissance = P.factions[f];
  for (const reg in P.batiments) for (const id in P.batiments[reg]){
    const b = regions[reg].batiments, n = (b[id] || 0) + P.batiments[reg][id];
    if (n > 0) b[id] = n; else delete b[id];
  }
  for (const reg in P.emplacements || {}) regions[reg].emplacements += P.emplacements[reg];   // pays marchand : bourg plus grand
  // lois en vigueur depuis longtemps : effets à terme complets, effets de durée finis
  for (const id of P.lois) lois[LOIS[id].categorie] = { id, depuis: -100 };
  // personas des dirigeants : tirés au hasard (caché au joueur : l'écran ne doit pas l'afficher) ; tous différents si
  // tirage.personasIdentiques vaut 1 (avant le 15/11), sinon au plus ce nombre de dirigeants avec le même persona
  const T = scenario.tirage || { personasIdentiques: 1, variation: 0 };
  const liste = Object.keys(PERSONAS), nations = Object.keys(scenario.nations), tires = [];
  if (T.personasIdentiques <= 1){
    for (let i = liste.length - 1; i > 0; i--){ const k = Alea.entier(r, i + 1); [liste[i], liste[k]] = [liste[k], liste[i]]; }
    tires.push(...liste.slice(0, nations.length));
  } else for (const id of nations){
    const libres = liste.filter(p => tires.filter(x => x === p).length < T.personasIdentiques);
    tires.push(Alea.choisir(r, libres));
  }
  // profils d'échanges qui varient d'une partie à l'autre (15/11) : chaque volume × (1 ± variation), au moins 1
  const varie = o => { const v = copie(o); if (T.variation) for (const b in v) v[b] = Math.max(1, Math.round(v[b] * (1 - T.variation + 2 * T.variation * Alea.suivant(r)))); return v; };
  nations.forEach((id, i) => {
    const n = scenario.nations[id];
    profils[id] = { nom: n.nom, distance: n.distance || 1, persona: tires[i], regions: copie(n.regions || {}), taux: n.taux, exporte: varie(n.exporte), importe: varie(n.importe) };
  });
  const e = {
    version: VERSION,
    scenario: scenario.id,
    pays,                             // pays de départ (donnees/pays.js)
    tour: 1,
    tourMax: scenario.tours,
    alea: r.s,                        // état du hasard (après le tirage des personas), rangé avec la partie
    tresor: j.tresor,
    familles: j.familles,
    reputation: j.reputation,
    factions,                         // f → { colere, puissance, statut }
    moral: 1,                         // moral du pays (0 à 1), recalculé chaque tour
    apaises: [],                      // factions déjà apaisées ce tour
    regions,                          // région → { nom, terrain, emplacements, batiments } (V2)
    batiments: totaux(regions),       // totaux du pays (somme des régions)
    chantiers: [],                    // bâtiments en construction : [{ id, region, restant }], un par région
    lois,                             // catégorie → { id, depuis } (loi en vigueur ; lois du pays au départ)
    institutions: { sante: 0, enseignement: 0, police: 0 },   // budget de fin de partie : niveau de chaque institution (0 à 3)
    institutionsChangees: [],         // institutions changées ce tour (une fois par tour)
    impots: "normal",                 // V2 budget : niveau d'imposition (bas, normal, haut)
    debat: null,
    paquet: [],                       // événements : cartes restantes (mélangées au premier tirage)
    evenement: null,                  // carte tirée qui attend la réponse du joueur { id, cibles, depuis }
    modifProd: [],                    // effets d'événements sur la production [{ bien, mult, jusqua }]
    bonusRendement: {},               // bâtiment → multiplicateur (Inventeur)                      // V2 : la loi en débat { id, depuis } (une seule)
    evenements: copie(scenario.evenements || []),   // événements écrits du scénario
    modifPrix: [],                    // [{ prix: { bien: facteur }, jusqua }] (événements ; traités en M3)
    bilan: null,                      // économie du dernier tour (Economie.bilan)
    nations: Diplomatie.nationsInitiales(scenario, profils),   // id → { relation, tresor, familles, colere, moral, regiments }
    profils,                          // id → profil de la nation (persona, régions, taux, exporte, importe)
    offres: Diplomatie.offres(profils),   // contrats proposés par les nations (ce qu'elles importent et exportent)
    revanches: {},                    // nations revanchardes battues par le joueur
    contrats: [],                     // [{ id, jusqua }]
    caravanes: (DIPLO.transport || {}).caravanes || 0,   // transport (16/11) : caravanes du joueur (une par contrat en cours)
    routes: [],                       // nations vers lesquelles la route est améliorée
    diplomate: null,                  // diplomate envoyé : { nation, depuis } (un seul ; moteur/diplomatie.js)
    exigences: [],                    // exigences en cours : [{ nation, exigence, depuis }] (une par nation, sous embargo)
    calmes: {},                       // nation → dernier tour sans provocation (exigence accordée)
    embargos: [],                     // nations sous embargo du joueur
    traites: [],                      // [{ type, avec, depuis }]
    dons: [],                         // nations ayant reçu un don ce tour
    sanctions: [],                    // embargos entre nations ou contre le joueur : [{ par, contre }] (sanctions de bloc)
    guerre: null,                     // la guerre en cours (moteur/guerre.js)
    regiments: P.regiments != null ? P.regiments : (j.regiments || 0),   // V2 : armée du joueur (pays militaire : plus)
    recrues: [],                      // régions où le joueur a recruté ce tour
    occupations: {},                  // région → occupant (pendant une guerre)
    nonRearmement: {},                // camp ("joueur" ou nation) → dernier tour de la clause
    treves: {},                       // nation → dernier tour de la trêve avec le joueur
    ambition: null,                   // objectif de victoire choisi au tour 1 (moteur/objectifs.js)
    suivi: { tours: 0, colere: 0, legitimite: 0, greves: 0, serieSansGreve: 0, serieSansGrondement: 0, victoires: 0, influence: 0, cedees: 0, toursDependance: 0, etapes: {} },   // cumuls des objectifs et des étapes
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

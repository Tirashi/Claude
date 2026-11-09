/* Terres franches : les données de l'ère 1 (ressources, métiers, bâtiments, statuts, besoins).
   Ajouter un bâtiment ou un métier = ajouter une entrée ici ; les règles (regles.js) ne connaissent aucun nom en dur
   sauf les ressources de départ du pionnier. Tous les nombres se règlent avec le simulateur :
   node outils/terres-simulateur.js            → contrôles + parties du robot (profils actif et sessions)
   Temps en secondes, débits par seconde et par villageois. */
(function(){
"use strict";

// ressources ; vivres = valeur nourrissante (un villageois mange `conso` vivres par seconde)
const RES = {
  bois:     {nom: "BOIS"},
  pierre:   {nom: "PIERRE"},
  baies:    {nom: "BAIES", vivres: 1},
  poisson:  {nom: "POISSON", vivres: 1},
  ble:      {nom: "BLE"},
  farine:   {nom: "FARINE"},
  pain:     {nom: "PAIN", vivres: 2},
  laine:    {nom: "LAINE"},
  vetements:{nom: "VETEMENTS"}
};

// métiers : produit (débit), ou transforme (entree → sortie, débit de sortie) ; places = où ils travaillent
//   places.base : places sans bâtiment (la forêt, les buissons, la rive) ; places[bat] : places par bâtiment
//   seuil : au-delà de ce nombre de travailleurs, chacun rapporte `use` fois moins que le précédent (surexploitation)
const METIERS = {
  bucheron:  {nom: "BUCHERON",  produit: "bois",    debit: .22, places: {base: 5},           seuil: 4, use: .85},
  cueilleur: {nom: "CUEILLEUR", produit: "baies",   debit: .20, places: {base: 3},           seuil: 3, use: .8},
  pecheur:   {nom: "PECHEUR",   produit: "poisson", debit: .22, places: {base: 2, ponton: 2}, seuil: 4, use: .85},
  carrier:   {nom: "CARRIER",   produit: "pierre",  debit: .13, places: {carriere: 3},       seuil: 4, use: .85},
  fermier:   {nom: "FERMIER",   produit: "ble",     debit: .25, places: {champ: 2},          seuil: 6, use: .9},
  meunier:   {nom: "MEUNIER",   entree: {ble: 2},   sortie: "farine", debit: .4, places: {moulin: 1}},
  boulanger: {nom: "BOULANGER", entree: {farine: .5, bois: .1}, sortie: "pain", debit: .6, places: {four: 1}},
  berger:    {nom: "BERGER",    produit: "laine",   debit: .12, places: {bergerie: 2},       seuil: 4, use: .85},
  tisserand: {nom: "TISSERAND", entree: {laine: 2}, sortie: "vetements", debit: .1, places: {atelier: 1}}
};

// bâtiments : coût de base × croissance^nombre déjà construits ; travail = durée du chantier ;
//   terrain = où il se pose (« terre » pour la plupart) ; logement = places d'habitants ; statut = statut requis ;
//   pres = affinités pour l'emplacement proposé (carte.js) : près du feu, de l'eau, de la forêt, des logis ou d'un bâtiment (poids > 0),
//   ou loin (poids < 0) ; « fertile » et « pre » sont des étiquettes de terrain ; desc = la phrase du volet CONSTRUIRE
const BATIMENTS = {
  cabane:   {desc: "Un toit pour 2 habitants de plus, dans la limite du statut de la colonie.", nom: "CABANE",    cout: {bois: 14},              croit: 1.18, travail: 20,  terrain: "terre", logement: 2, statut: 0, pres: {feu: 4, logis: 2, fertile: -3, pre: -2}},
  champ:    {desc: "2 places de fermier : du blé, sur la bonne terre.", nom: "CHAMP",     cout: {bois: 30, baies: 10},   croit: 1.3,  travail: 30,  terrain: "terre", statut: 1, pres: {fertile: 6, champ: 2, moulin: 2, feu: -1}},
  carriere: {desc: "3 places de carrier : de la pierre.", nom: "CARRIERE",  cout: {bois: 45},              croit: 1.5,  travail: 40,  terrain: "roche", statut: 1, pres: {feu: 1}},
  ponton:   {desc: "2 places de pêcheur de plus, au bord de l'eau.", nom: "PONTON",    cout: {bois: 40},              croit: 1.5,  travail: 30,  terrain: "rive",  statut: 1, pres: {feu: 1}},
  moulin:   {desc: "1 meunier : le blé devient farine.", nom: "MOULIN",    cout: {bois: 70, pierre: 30},  croit: 1.6,  travail: 60,  terrain: "terre", statut: 1, pres: {champ: 4, eau: 2, fertile: -4, logis: -1}},
  four:     {desc: "1 boulanger : farine et bois deviennent du pain.", nom: "FOUR",      cout: {bois: 30, pierre: 40},  croit: 1.6,  travail: 45,  terrain: "terre", statut: 1, pres: {moulin: 3, logis: 2, feu: 1, fertile: -4}},
  maison:   {desc: "Un toit pour 4 habitants de plus, dans la limite du statut.", nom: "MAISON",    cout: {bois: 60, pierre: 50},  croit: 1.2,  travail: 60,  terrain: "terre", logement: 4, statut: 2, pres: {feu: 4, logis: 2, fertile: -3, pre: -2}},
  bergerie: {desc: "2 places de berger : de la laine.", nom: "BERGERIE",  cout: {bois: 90, pierre: 20},  croit: 1.5,  travail: 50,  terrain: "terre", statut: 2, pres: {pre: 6, logis: -1, fertile: -2}},
  grenier:  {desc: "Garde la nourriture : chaque niveau double la place des baies, du poisson, du blé, de la farine et du pain.", nom: "GRENIER", cout: {bois: 50, baies: 10}, croit: 2, travail: 30, terrain: "reserve", place: "S", statut: 0, niveaux: 4, stock: "nourriture", pres: {champ: 3, fertile: 2, feu: 1}},
  aire:     {desc: "Garde le bois, la pierre, la laine et les vêtements : chaque niveau double la place.", nom: "AIRE DE STOCKAGE", cout: {bois: 40}, croit: 2, travail: 25, terrain: "reserve", place: "R", statut: 0, niveaux: 5, stock: "materiaux", pres: {feu: 1, eau: 1}},
  atelier:  {desc: "1 tisserand : la laine devient des vêtements.", nom: "ATELIER",   cout: {bois: 80, pierre: 60},  croit: 1.6,  travail: 60,  terrain: "terre", statut: 2, pres: {logis: 3, bergerie: 2, feu: 1, fertile: -4, pre: -2}}
};

// stockage : ce que la colonie peut garder de chaque ressource ; un bâtiment de stockage (grenier, aire) double la place à chaque niveau
//   (décision du 09/11 : on essaie une vraie limite ; on l'enlèvera si c'est trop contraignant)
const STOCK = {
  base: {bois: 300, pierre: 200, baies: 100, poisson: 100, ble: 100, farine: 60, pain: 60, laine: 60, vetements: 40},
  groupes: {nourriture: ["baies", "poisson", "ble", "farine", "pain"], materiaux: ["bois", "pierre", "laine", "vetements"]}
};

// l'hiver (une saison sur quatre, 20 min chacune ; la partie commence au printemps) : on se chauffe et on mange plus ;
//   sans bois, le moral baisse, mais personne ne meurt (décision du 09/11)
const HIVER = {saison: 20 * 60, decalage: .7, chauffage: .006, faim: 1.25, froid: -.15};

// statuts de la colonie (ère 1) : population maximale ; passer au suivant demande une population et des ressources
const STATUTS = [
  {nom: "CAMPEMENT", popMax: 5},
  {nom: "HAMEAU",    popMax: 10, pop: 5,  cout: {bois: 800, baies: 150, poisson: 150}},
  {nom: "VILLAGE",   popMax: 20, pop: 10, cout: {bois: 3000, pierre: 1200, pain: 400}}
];

// la Charte du Village : la Loi de l'ère 1 (prestige) ; plafond atteint → on la promulgue
const LOI = {nom: "CHARTE DU VILLAGE", pop: 20, cout: {bois: 2000, pierre: 1200, pain: 500, vetements: 60}};

// carte de l'ère 1 (24 × 24) : parcelles par terrain ; le feu de camp (logement 2) est déjà là
const CARTE = {terre: 14, roche: 2, rive: 2, reserve: 2, feu: 2};

// villageois : un nouveau coûte des vivres (pris dans n'importe quelle nourriture) et du bois, × croit^recrutés
const RECRUTER = {vivres: 40, bois: 20, croit: 1.15};

// besoins (le moral multiplie toute la production) ; pop = à partir de combien d'habitants le besoin compte
const BESOINS = {
  conso: .04,        // vivres par villageois et par seconde (2,4 par minute)
  famine: .5,        // production × famine quand il n'y a plus rien à manger
  variete: {pop: 6, bonus: .1, malus: -.1, types: 2},           // au moins 2 nourritures en réserve
  vetements: {pop: 12, bonus: .1, conso: .002, bloque: true},   // sans vêtements : plus de recrutement
  pain: {pop: 15, bonus: .1}                                    // du pain en réserve : +10 %
};

// le pionnier (le joueur) : chaque toucher rapporte `toucher` de la ressource touchée
const PIONNIER = {toucher: 1, ressources: ["bois", "baies", "poisson"]};

// hors ligne : la production continue, bien plus lentement, et plafonnée
const HORS_LIGNE = {plafond: 4 * 3600, rendement: .25};   // décision du 08/11 : peu au début ; des Lois l'augmenteront

const api = {RES, METIERS, BATIMENTS, STOCK, HIVER, STATUTS, LOI, CARTE, RECRUTER, BESOINS, PIONNIER, HORS_LIGNE};
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.TerresDonnees = api;
})();

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
  vetements:{nom: "VETEMENTS"},
  armes:    {nom: "ARMES"}          // épées et boucliers de la forge, pour la garde (pillards, 11/11)
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
  tisserand: {nom: "TISSERAND", entree: {laine: 2}, sortie: "vetements", debit: .1, places: {atelier: 1}},
  // la garde ne produit rien : elle défend le village contre les pillards (RAIDS) ; le forgeron fait les armes de la garde
  garde:     {nom: "GARDE",     places: {caserne: 3}, defend: true},
  forgeron:  {nom: "FORGERON",  entree: {bois: .5, pierre: 1}, sortie: "armes", debit: .02, places: {forge: 1}}
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
  tour:     {desc: "Un guetteur voit venir les pillards de loin : l'alerte sonne plus tôt et la garde, prévenue, se bat mieux.", nom: "TOUR DE GUET", cout: {bois: 120, pierre: 40}, croit: 2, travail: 40, terrain: "guet", statut: 1, niveaux: 1, pres: {feu: 1}},
  caserne:  {desc: "3 places de garde par niveau : ils défendent les réserves contre les pillards.", nom: "CASERNE", cout: {bois: 150, pierre: 80}, croit: 2.2, travail: 60, terrain: "garnison", statut: 1, niveaux: 2, pres: {feu: 1}},
  forge:    {desc: "1 forgeron : bois et pierre deviennent des armes ; une garde armée frappe plus fort et se blesse moins.", nom: "FORGE", cout: {bois: 160, pierre: 120}, croit: 1.6, travail: 60, terrain: "garnison", statut: 2, niveaux: 1, pres: {caserne: 4}},
  atelier:  {desc: "1 tisserand : la laine devient des vêtements.", nom: "ATELIER",   cout: {bois: 80, pierre: 60},  croit: 1.6,  travail: 60,  terrain: "terre", statut: 2, pres: {logis: 3, bergerie: 2, feu: 1, fertile: -4, pre: -2}}
};

// stockage : ce que la colonie peut garder de chaque ressource ; un bâtiment de stockage (grenier, aire) double la place à chaque niveau
//   (décision du 09/11 : on essaie une vraie limite ; on l'enlèvera si c'est trop contraignant)
const STOCK = {
  base: {bois: 300, pierre: 200, baies: 100, poisson: 100, ble: 100, farine: 60, pain: 60, laine: 60, vetements: 40, armes: 10},
  groupes: {nourriture: ["baies", "poisson", "ble", "farine", "pain"], materiaux: ["bois", "pierre", "laine", "vetements", "armes"]}
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
const CARTE = {terre: 14, roche: 2, rive: 2, reserve: 2, garnison: 2, guet: 1, feu: 2};

// les pillards (décisions du 09/11) : aucun au campement ; une bande de temps en temps, plus forte quand la colonie grandit ;
//   intervalle[statut] = [min, max] secondes entre deux bandes ; premier = délai après être devenu hameau ;
//   approche = secondes de marche vers les réserves (les villageois s'abritent : les récolteurs ne récoltent plus) ;
//   annonce = secondes d'alerte en plus avec une tour de guet (la garde prévenue se bat mieux : × prevenu) ;
//   force de la bande = (base + parHab × habitants) × statut[statut] × (1 ± alea) ;
//   vol = part du stock pas à l'abri qu'ils emportent ; abri = part à l'abri par niveau du grenier ou de l'aire (au plus abriMax) ;
//   garde : force de chacun, × arme s'il a une arme, part au plus blessée après un combat (÷ 2 avec une arme), guérison en secondes
const RAIDS = {
  premier: 12 * 60, intervalle: [null, [30 * 60, 45 * 60], [20 * 60, 30 * 60]], approche: 40, annonce: 60,
  force: {base: 4, parHab: .6, statut: [0, 1, 1.6], alea: .25},
  vol: .2, abri: .1, abriMax: .8,
  garde: {force: 3, arme: 1.5, prevenu: 1.5, blesse: .5, guerison: 5 * 60}
};

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

// ordonnances et équipements : améliorations achetées pendant la partie (décision du 09/11) ; chaque niveau ajoute `effet`
//   (cumulé), coûte cout × croit^niveau ; statut = statut requis ; les Lois (prestige) relèveront les valeurs de base.
//   effets : recolte (+ débit des récolteurs), porte (+ débit des récolteurs : moins d'allers-retours), route (+ vitesse sur les rues,
//   et + débit de tous les métiers), pop (+ habitants au-delà du statut), moral, chauffage (− bois l'hiver), faim (− nourriture en plus l'hiver),
//   places (+ places par lieu de récolte : bûcherons, cueilleurs, pêcheurs), toucherPierre, toucher (+ par toucher), chantier (− durée), recrue (− coût)
const ORDONNANCES = {
  outils:     {nom: "OUTILS AFFUTES",     type: "equipement", desc: "Haches, pioches et houes bien tranchantes : on récolte plus vite.", effet: {recolte: .1}, niveaux: 5, cout: {bois: 60}, croit: 1.9, statut: 0},
  panier:     {nom: "PANIER DU PIONNIER", type: "equipement", desc: "Chaque toucher rapporte une ressource de plus.", effet: {toucher: 1}, niveaux: 4, cout: {bois: 30, baies: 20}, croit: 2.2, statut: 0},
  hottes:     {nom: "HOTTES ET BROUETTES", type: "equipement", desc: "On porte plus à chaque voyage : moins d'allers-retours.", effet: {porte: .08}, niveaux: 4, cout: {bois: 120}, croit: 2, statut: 0},
  coupes:     {nom: "NOUVELLES COUPES",   type: "ordonnance", desc: "On ouvre d'autres arbres, buissons et coins de pêche : une place de plus pour chacun.", effet: {places: 1}, niveaux: 3, cout: {bois: 80, baies: 40}, croit: 2.2, statut: 0},
  tentes:     {nom: "TENTES D'APPOINT",   type: "equipement", desc: "Un habitant de plus que ne le permet le statut (campement, hameau ou village), s'il y a un toit.", effet: {pop: 1}, niveaux: 3, cout: {bois: 90, baies: 40}, croit: 2.3, statut: 0},
  etageres:   {nom: "ETAGERES ET TONNEAUX", type: "equipement", desc: "Mieux ranger : 20 % de place en plus dans toutes les réserves.", effet: {stock: .2}, niveaux: 3, cout: {bois: 100}, croit: 2.2, statut: 0},
  ateres:     {nom: "ATRES FERMES",       type: "equipement", desc: "Des foyers qui gardent la chaleur : moins de bois brûlé l'hiver.", effet: {chauffage: .15}, niveaux: 4, cout: {bois: 100}, croit: 1.8, statut: 0},
  pioche:     {nom: "PIOCHE DU PIONNIER", type: "equipement", desc: "Toucher un rocher rapporte de la pierre.", effet: {toucherPierre: 1}, niveaux: 1, cout: {bois: 150, pierre: 20}, croit: 1, statut: 1},
  faucille:   {nom: "FAUCILLE DU PIONNIER", type: "equipement", desc: "Toucher un champ rapporte du blé.", effet: {toucherBle: 1}, niveaux: 1, cout: {bois: 120, pierre: 30}, croit: 1, statut: 1},
  engrais:    {nom: "FUMURE DES CHAMPS",  type: "ordonnance", desc: "On fume les champs : les fermiers récoltent plus de blé.", effet: {m_fermier: .15}, niveaux: 3, cout: {bois: 100, baies: 60}, croit: 2, statut: 1},
  meules:     {nom: "MEULES DE PIERRE",   type: "equipement", desc: "De bonnes meules : le meunier fait plus de farine.", effet: {m_meunier: .2}, niveaux: 3, cout: {pierre: 80, bois: 60}, croit: 2, statut: 1},
  pelles:     {nom: "PELLES A ENFOURNER", type: "equipement", desc: "Le boulanger cuit plus de pain.", effet: {m_boulanger: .2}, niveaux: 3, cout: {bois: 120, pierre: 40}, croit: 2, statut: 1},
  chemins:    {nom: "CHEMINS DAMES",      type: "ordonnance", desc: "Rues tassées et entretenues : on y marche plus vite, tout le monde travaille un peu plus.", effet: {route: .2, route_prod: .03}, niveaux: 3, cout: {bois: 150, pierre: 60}, croit: 2, statut: 1},
  conserves:  {nom: "FUMAGE ET SALAISON", type: "ordonnance", desc: "Des vivres qui se gardent : on mange moins en plus l'hiver.", effet: {faim: .25}, niveaux: 3, cout: {poisson: 80, bois: 80}, croit: 2, statut: 1},
  fetes:      {nom: "JOURS DE FETE",      type: "ordonnance", desc: "Des fêtes au village : tout le monde est plus content et travaille mieux.", effet: {moral: .05}, niveaux: 4, cout: {baies: 120, poisson: 80}, croit: 2.1, statut: 1},
  charpente:  {nom: "CHARPENTIERS",       type: "ordonnance", desc: "Des bâtisseurs entraînés : les chantiers vont plus vite.", effet: {chantier: .15}, niveaux: 3, cout: {bois: 200, pierre: 80}, croit: 2, statut: 1},
  accueil:    {nom: "DROIT D'ACCUEIL",    type: "ordonnance", desc: "Deux habitants de plus que ne le permet le statut (s'il y a des toits).", effet: {pop: 2}, niveaux: 3, cout: {bois: 300, pierre: 150, pain: 40}, croit: 2.2, statut: 2},
  forces:     {nom: "FORCES DU PIONNIER", type: "equipement", desc: "Toucher la bergerie rapporte de la laine.", effet: {toucherLaine: 1}, niveaux: 1, cout: {bois: 200, pierre: 80}, croit: 1, statut: 2},
  metiers:    {nom: "METIERS A TISSER",   type: "equipement", desc: "Le tisserand fait plus de vêtements ; les bergers tondent mieux.", effet: {m_tisserand: .2, m_berger: .1}, niveaux: 3, cout: {bois: 200, pierre: 100}, croit: 2, statut: 2},
  serrures:   {nom: "SERRURES ET CADENAS", type: "equipement", desc: "Les réserves ferment à clé : 10 % de plus du stock à l'abri des pillards.", effet: {abri: .1}, niveaux: 3, cout: {bois: 120, pierre: 60}, croit: 2, statut: 1},
  palissade:  {nom: "PALISSADE",          type: "ordonnance", desc: "Une palissade autour du village : les bandes arrivent essoufflées (10 % moins fortes).", effet: {palissade: .1}, niveaux: 3, cout: {bois: 250, pierre: 40}, croit: 2, statut: 1},
  guetteurs:  {nom: "GUETTEURS",          type: "ordonnance", desc: "Des guetteurs à la tour : l'alerte sonne 30 secondes plus tôt.", effet: {guet: 30}, niveaux: 2, cout: {bois: 100, poisson: 60}, croit: 2, statut: 1},
  exercice:   {nom: "ENTRAINEMENT",       type: "ordonnance", desc: "La garde s'entraîne chaque jour : 20 % plus forte.", effet: {garde: .2}, niveaux: 3, cout: {bois: 150, pain: 30}, croit: 2.1, statut: 1},
  soins:      {nom: "SOINS ET ONGUENTS",  type: "ordonnance", desc: "Les gardes blessés guérissent plus vite.", effet: {soins: .25}, niveaux: 2, cout: {baies: 120, bois: 80}, croit: 2, statut: 1},
  hospitalite:{nom: "HOSPITALITE",        type: "ordonnance", desc: "Les nouveaux venus coûtent moins cher à accueillir.", effet: {recrue: .1}, niveaux: 3, cout: {pain: 60, bois: 200}, croit: 2, statut: 2}
};

// la marche des villageois (cases par seconde ; × route sur les rues et la place)
const MARCHE = {vitesse: 1.7, route: 1.5};

// hors ligne : la production continue, bien plus lentement, et plafonnée
const HORS_LIGNE = {plafond: 4 * 3600, rendement: .25};   // décision du 08/11 : peu au début ; des Lois l'augmenteront

const api = {RAIDS, ORDONNANCES, MARCHE, RES, METIERS, BATIMENTS, STOCK, HIVER, STATUTS, LOI, CARTE, RECRUTER, BESOINS, PIONNIER, HORS_LIGNE};
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.TerresDonnees = api;
})();

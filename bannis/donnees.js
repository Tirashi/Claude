/* Les Bannis : données (classes, traits, monstres, vagues, objets, sorts). Pas d'affichage ici.
   Tout est rangé dans window.Bannis.D. Cahier des charges : specs/bannis.md. */
(function(){
"use strict";
const B = window.Bannis = window.Bannis || {};

// Héros : index de la feuille dans img/heros.png (ordre de outils/bannis-atlas.py), regard naturel vers la gauche.
const HEROS = ["glenys-3", "glenys", "oratio-2", "oratio", "ley-2", "prime", "hex", "hex-3", "linail-2", "wyvera", "ouzo", "ouzo-3"];

// Classes de base et leur classe légendaire (même sexe). portee : cac (corps à corps), magie, soin, chant.
const CLASSES = {
  guerriere:    {n: "GUERRIERE", sexe: "F", spr: "glenys-3", role: "cac", pv: 115, atq: 12, def: 4, vit: 1.0, crit: 8,
                 d: "Combattante au corps à corps, la plus solide : elle tient la ligne devant les autres.", leg: {n: "EPEISTE DEMONIAQUE", spr: "glenys", d: "Ses coups font reculer et volent de la vie."}},
  mercenaire:   {n: "MERCENAIRE", sexe: "H", spr: "oratio-2", role: "cac", pv: 100, atq: 14, def: 3, vit: 1.1, crit: 12,
                 d: "Combattant au corps à corps, moins solide mais il frappe fort et vite.", leg: {n: "CHAMPION", spr: "oratio", d: "Ses critiques frappent aussi les monstres voisins."}},
  illusionniste:{n: "ILLUSIONNISTE", sexe: "H", spr: "ley-2", role: "magie", pv: 72, atq: 11, def: 1, vit: 0.95, crit: 10,
                 d: "Mage qui lance des éclairs de loin ; fragile, il recule si un monstre approche.", leg: {n: "GRAND SAGE", spr: "prime", d: "Ses sorts touchent aussi les monstres autour de la cible."}},
  magicienne:   {n: "MAGICIENNE", sexe: "F", spr: "hex", role: "magie", pv: 66, atq: 13, def: 1, vit: 0.9, crit: 8,
                 d: "Mage qui lance des boules de feu de loin ; la plus forte, mais très fragile.", leg: {n: "SORCIERE DU TEMPS", spr: "hex-3", d: "Ses sorts ralentissent les monstres touchés."}},
  pretresse:    {n: "PRETRESSE", sexe: "F", spr: "linail-2", role: "soin", pv: 78, atq: 9, def: 2, vit: 1.0, crit: 6,
                 d: "Soigneuse : elle suit le héros le plus blessé et le soigne ; sinon elle attaque de loin.", leg: {n: "GRANDE PRETRESSE", spr: "wyvera", d: "Ses soins touchent toute l'escouade."}},
  barde:        {n: "BARDE", sexe: "?", spr: "ouzo", role: "chant", pv: 84, atq: 8, def: 2, vit: 1.0, crit: 6,
                 d: "Soutien : son chant accélère toute l'escouade ; il tire aussi des notes de loin.", leg: {n: "BARDE LEGENDAIRE", spr: "ouzo-3", d: "Son chant soigne aussi un peu."}}
};
const PORTEE = {cac: 30, magie: 135, soin: 130, chant: 120, dist: 125};
// ce que fait chaque rôle, en une ligne (écran de recrutement, fiche)
const ROLES = {cac: "CORPS A CORPS", magie: "MAGIE A DISTANCE", soin: "SOINS", chant: "SOUTIEN"};
// gains automatiques à chaque niveau, selon le rôle (pv en %, vit en %)
const CROISSANCE = {cac: {pv: 12, atq: 2, def: 1}, magie: {pv: 8, atq: 3, crit: 1}, soin: {pv: 10, atq: 2, def: 1}, chant: {pv: 10, atq: 1, def: 1, vit: 3}};

// Traits des recrues : un effet réel chacun (appliqué par regles.js).
const TRAITS = {
  ivrogne:    {n: "IVROGNE", d: "+15 % d'attaque, mais rate 15 % de ses coups."},
  pieux:      {n: "PIEUX", d: "Reçoit 30 % de soins en plus."},
  deserteur:  {n: "DESERTEUR", d: "Court plus vite, mais fuit quelques secondes quand il tombe sous 20 % de vie."},
  cleptomane: {n: "CLEPTOMANE", d: "+2 pièces d'or par monstre qu'il achève."},
  tetebrulee: {n: "TETE BRULEE", d: "+10 % de critiques, -1 de défense."},
  balafre:    {n: "BALAFRE", d: "+15 % de vie."},
  vantard:    {n: "VANTARD", d: "+25 % d'expérience."},
  parjure:    {n: "PARJURE", d: "-10 % de vie, critiques à x2,2 au lieu de x1,8."}
};

// Monstres : numéro dans img/monstres.png (Free Mythic Monsters de Willibab), regard vers la gauche.
// role : cac ou dist (tire de loin) ; t : taille d'affichage ; or : pièces gagnées.
const MONSTRES = {
  gobelin:   {n: "GOBELIN", i: 19, pv: 32, atq: 6, def: 0, vit: 1.1, role: "cac", t: 1.0},
  gelee:     {n: "GELEE", i: 16, pv: 32, atq: 5, def: 1, vit: 0.75, role: "cac", t: 1.0},
  guepe:     {n: "GUEPE", i: 8, pv: 20, atq: 5, def: 0, vit: 1.6, role: "cac", t: 0.9},
  serpent:   {n: "SERPENT", i: 9, pv: 26, atq: 6, def: 0, vit: 1.2, role: "cac", t: 0.9},
  diablotin: {n: "DIABLOTIN", i: 24, pv: 28, atq: 6, def: 0, vit: 1.3, role: "cac", t: 0.95},
  ver:       {n: "VER DE SANG", i: 3, pv: 38, atq: 6, def: 1, vit: 0.8, role: "cac", t: 1.0},
  araignee:  {n: "ARAIGNEE", i: 7, pv: 34, atq: 7, def: 1, vit: 1.25, role: "cac", t: 1.05},
  spectre:   {n: "SPECTRE", i: 6, pv: 32, atq: 7, def: 0, vit: 1.0, role: "cac", t: 1.0},
  bete:      {n: "BETE ROUGE", i: 17, pv: 44, atq: 8, def: 2, vit: 0.95, role: "cac", t: 1.05},
  crabe:     {n: "CRABE DE PIERRE", i: 1, pv: 50, atq: 6, def: 4, vit: 0.7, role: "cac", t: 1.05},
  mante:     {n: "MANTE", i: 4, pv: 38, atq: 9, def: 1, vit: 1.15, role: "cac", t: 1.05},
  gueule:    {n: "GUEULE BLEUE", i: 13, pv: 46, atq: 8, def: 2, vit: 0.9, role: "cac", t: 1.05},
  maudit:    {n: "PRETRE MAUDIT", i: 5, pv: 30, atq: 8, def: 0, vit: 0.85, role: "dist", t: 1.0},
  grimoire:  {n: "GRIMOIRE DE FEU", i: 29, pv: 24, atq: 9, def: 0, vit: 0.9, role: "dist", t: 0.8},
  loup:      {n: "LOUP DES GLACES", i: 22, pv: 52, atq: 10, def: 2, vit: 1.35, role: "cac", t: 1.05},
  squelette: {n: "CHEVALIER SQUELETTE", i: 20, pv: 64, atq: 11, def: 4, vit: 0.9, role: "cac", t: 1.15},
  lezard:    {n: "CHEVALIER LEZARD", i: 15, pv: 60, atq: 12, def: 3, vit: 1.0, role: "cac", t: 1.1},
  ogre:      {n: "OGRE BLEU", i: 23, pv: 90, atq: 13, def: 3, vit: 0.75, role: "cac", t: 1.2},
  chimere:   {n: "CHIMERE", i: 26, pv: 70, atq: 12, def: 2, vit: 1.2, role: "cac", t: 1.1},
  tigre:     {n: "DEMON TIGRE", i: 11, pv: 68, atq: 13, def: 2, vit: 1.1, role: "cac", t: 1.1},
  braise:    {n: "CRANE DE BRAISE", i: 21, pv: 58, atq: 11, def: 2, vit: 1.0, role: "cac", t: 1.1},
  oeil:      {n: "OEIL AILE", i: 30, pv: 44, atq: 11, def: 1, vit: 0.95, role: "dist", t: 1.05},
  // boss
  hydre:     {n: "HYDRE", i: 18, pv: 260, atq: 12, def: 3, vit: 0.6, role: "cac", t: 1.5, boss: true},
  naga:      {n: "REINE NAGA", i: 31, pv: 420, atq: 15, def: 4, vit: 0.65, role: "cac", t: 1.55, boss: true},
  dragon:    {n: "DRAGON ROUGE", i: 14, pv: 380, atq: 16, def: 4, vit: 0.6, role: "cac", t: 1.5, boss: true},
  seigneur:  {n: "SEIGNEUR DES FLAMMES", i: 25, pv: 700, atq: 18, def: 5, vit: 0.55, role: "dist", t: 1.65, boss: true}
};
// Monstres possibles selon la vague (paliers).
const PALIERS = [
  {jusqua: 3, l: ["gobelin", "gelee", "guepe", "serpent", "diablotin", "ver"]},
  {jusqua: 7, l: ["araignee", "spectre", "bete", "crabe", "mante", "gueule", "maudit", "grimoire", "diablotin", "gobelin"]},
  {jusqua: 12, l: ["loup", "squelette", "lezard", "ogre", "chimere", "tigre", "braise", "oeil", "maudit", "mante"]}
];
const BOSS = {4: ["hydre"], 8: ["naga"], 12: ["seigneur", "dragon"]};
const NB_VAGUES = 12;

// Objets : emplacement, icône (ligne, colonne dans img/icones.png), noms possibles.
const SLOTS = {
  // la 3e valeur d'une arme : qui peut la porter (cac = corps à corps, mage = magie, soin et chant)
  arme:   {n: "ARME", noms: [["EPEE DU DESERTEUR", [5,1], "cac"], ["HACHE DU BOURREAU", [5,11], "cac"], ["DAGUE DU VOLEUR", [5,6], "cac"], ["MASSE DU GEOLIER", [5,13], "cac"], ["BATON FELE", [6,7], "mage"], ["SCEPTRE DE BRAISE", [6,9], "mage"], ["GRIMOIRE DU BANNI", [13,7], "mage"]]},
  armure: {n: "ARMURE", noms: [["COTTE RAPIECEE", [7,5]], ["PLASTRON DE LA MURAILLE", [7,4]], ["CASQUE CABOSSE", [7,1]], ["CAPE DU BANNI", [7,14]], ["BOUCLIER DE CHENE", [6,1]]]},
  bijou:  {n: "BIJOU", noms: [["ANNEAU DU PARJURE", [8,5]], ["AMULETTE DE CENDRE", [8,6]], ["CHAPELET DU PENITENT", [8,7]], ["BAGUE D'OR VOLE", [8,4]]]}
};
const RARETES = [
  {n: "COMMUN", c: "#d8d0bc", p: 55, aff: 1, k: 1},
  {n: "RARE", c: "#4aa8ff", p: 28, aff: 2, k: 1.25},
  {n: "EPIQUE", c: "#c45cff", p: 13, aff: 2, k: 1.6},
  {n: "LEGENDAIRE", c: "#ffb31f", p: 4, aff: 3, k: 2.1}
];
// Bonus d'objet : valeur de base (multipliée par la rareté), emplacements où il peut sortir.
const AFFIXES = {
  atq:  {n: "ATQ", v: 3, s: ["arme", "bijou"]},
  def:  {n: "DEF", v: 2, s: ["armure", "bijou"]},
  pv:   {n: "VIE", v: 14, s: ["armure", "bijou"]},
  crit: {n: "% CRIT", v: 4, s: ["arme", "bijou"]},
  vit:  {n: "% VITESSE", v: 6, s: ["arme", "armure", "bijou"]},
  vol:  {n: "% VOL DE VIE", v: 4, s: ["arme"]}
};

// Bonus proposés à chaque niveau (on en choisit un parmi deux).
const BONUS_NIVEAU = [
  {k: "pv", n: "+15 % DE VIE", f: h => { h.base.pv = Math.round(h.base.pv * 1.15); }},
  {k: "atq", n: "+3 D'ATTAQUE", f: h => { h.base.atq += 3; }},
  {k: "def", n: "+2 DE DEFENSE", f: h => { h.base.def += 2; }},
  {k: "vit", n: "+10 % DE VITESSE", f: h => { h.base.vit = Math.round(h.base.vit * 110) / 100; }},
  {k: "crit", n: "+6 % DE CRITIQUES", f: h => { h.base.crit += 6; }}
];
const XP_NIVEAUX = [0, 20, 48, 85, 130, 190, 260, 340]; // xp totale pour atteindre le niveau index+1
const NIV_LEGENDAIRE = 5;

// Sorts instables du Mage (dés).
// Sorts du Mage instable : effet normal (d) et effet quand le sort déraille (der). La puissance vient des dés.
const SORTS = {
  feu:      {n: "BOULE DE FEU", c: "#ff6a1f", ic: [3,9], d: "Frappe tous les monstres.", der: "La boule retombe aussi sur un héros."},
  soin:     {n: "PLUIE DE SOINS", c: "#6dff8a", ic: [3,5], d: "Soigne toute l'escouade.", der: "Les monstres sont soignés aussi !"},
  foudre:   {n: "FOUDRE EN CHAINE", c: "#8fd8ff", ic: [0,8], d: "Frappe fort les monstres, un par un.", der: "La foudre frappe aussi la Muraille."},
  givre:    {n: "BOUCLIER DE GIVRE", c: "#bfe8ff", ic: [21,11], d: "Les héros reçoivent moitié moins de dégâts pendant quelques secondes.", der: "Les héros gèlent sur place 2 secondes."},
  gel:      {n: "VENT GLACE", c: "#9ad0ff", ic: [3,12], d: "Ralentit tous les monstres pendant quelques secondes.", der: "Les monstres accélèrent !"},
  rempart:  {n: "REMPART", c: "#e8dcc0", ic: [3,8], d: "Répare la Muraille.", der: "Des pierres tombent sur tout le monde."},
  meteores: {n: "PLUIE DE METEORES", c: "#ffb040", ic: [3,13], d: "Trois météores écrasent des monstres au hasard.", der: "Les météores tombent n'importe où, héros compris."}
};
const SORTS_DEPART = ["feu", "soin", "foudre"];
// Dés du Mage : type -> nombre de faces. Faces spéciales : x2 (double la puissance), div2 (la divise par 2),
// crane (vaut 0 ; deux crânes et le sort déraille), etoile (le dé est relancé tout seul).
const TYPES_DES = {d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20};
const FACES_SPECIALES = {
  x2:     {n: "x2", d: "double la puissance"},
  div2:   {n: "/2", d: "divise la puissance par 2"},
  crane:  {n: "CRANE", d: "vaut 0 ; deux crânes et le sort déraille"},
  etoile: {n: "ETOILE", d: "le dé est relancé tout seul"}
};
// Dés à trouver (butin, marchand) ; sp : faces remplacées par une face spéciale
const DES_TROUVES = [
  {k: "d8", n: "D8 DU PASSEUR", p: 30},
  {k: "d4", n: "D4 DU GEOLIER", sp: {4: "x2"}, p: 18},
  {k: "d10", n: "D10 D'OS", p: 18},
  {k: "d12", n: "D12 DE BRAISE", sp: {12: "etoile"}, p: 14},
  {k: "d20", n: "D20 DU BOURREAU", p: 10},
  {k: "d6", n: "DE MAUDIT", sp: {1: "crane", 2: "crane", 5: "x2", 6: "x2"}, p: 6},
  {k: "d6", n: "DE PIPE", sp: {1: "etoile", 2: "etoile"}, p: 8},
  {k: "d6", n: "DE DE LA LUNE", sp: {3: "div2", 6: "x2"}, p: 8}
];
const MAX_DES = 5;

// Marchand entre les vagues.
const MARCHAND = [
  {k: "potion", n: "POTION", prix: 12, ic: [9,0], d: "Soigne le héros le plus blessé (45 %)."},
  {k: "parchemin", n: "PARCHEMIN D'ECLAIR", prix: 16, ic: [21,1], d: "Foudroie un monstre pendant le combat."},
  {k: "vue", n: "LONGUE-VUE", prix: 8, ic: [10,7], d: "Montre toute la vague suivante."},
  {k: "mur", n: "REPARER LA MURAILLE", prix: 15, ic: [10,4], d: "+30 de vie pour la Muraille."},
  {k: "de", n: "D8 DE SORTS", prix: 22, ic: [13,13], d: "Un dé de plus pour les sorts du Mage."},
  {k: "graver", n: "FACE DE SORT x2", prix: 18, ic: [10,4], d: "La plus petite face d'un dé de sorts devient x2."}
];

const NOMS = ["BRAM", "ODA", "KESS", "MARL", "TOVE", "RHYS", "ILSE", "GARN", "SEFA", "OREK", "VALE", "NELL", "JORN", "AUDE", "THEO", "MAUD", "YSOLDE", "CORBIN", "ELNA", "HUGUES", "ISEUT", "BALDO", "RENAUD", "OLWEN"];
const NOMS_F = ["ODA", "KESS", "TOVE", "ILSE", "SEFA", "VALE", "NELL", "AUDE", "MAUD", "YSOLDE", "ELNA", "ISEUT", "OLWEN"];


// Dés à symboles (27/11) : une face = une classe (dés des cases de recrues), un emplacement d'objet (QUOI), une rareté (QUALITE, indice de RARETES) ou un événement.
// Départ : trois faces de chaque classe d'une paire par case ; les améliorations de l'atelier remplacent une face.
const FACES_DEPART = {
  slots: [["guerriere", "guerriere", "guerriere", "mercenaire", "mercenaire", "mercenaire"],
          ["illusionniste", "illusionniste", "illusionniste", "magicienne", "magicienne", "magicienne"],
          ["pretresse", "pretresse", "pretresse", "barde", "barde", "barde"]],
  quoi: ["arme", "arme", "armure", "armure", "bijou", "bijou"],
  qual: [0, 0, 0, 0, 1, 1],
  event: ["recrue", "atelier", "benediction", "danger", "coffre", "calme"],
  action: ["recrue", "objet", "progres", "soin", "sort", "relique"]
};
// Dé d'action (28/11) : une face = ce que rapporte un lancer payé en or. ic : icône de img/icones.png (recrue : sprite d'une classe)
const ACTIONS = {
  recrue:  {n: "RECRUE", ic: null, d: "Le dé d'une case donne une classe : elle rejoint l'escouade, ou absorbe sa jumelle (niveau +1)."},
  objet:   {n: "OBJET", ic: [5, 1], d: "Les dés QUOI et QUALITE donnent un objet, équipé tout de suite."},
  progres: {n: "PROGRES", ic: [10, 4], d: "Un héros gagne un bonus de statistique."},
  soin:    {n: "SOIN", ic: [9, 0], d: "Tous les héros sont soignés, la Muraille se répare de 10."},
  sort:    {n: "SORT", ic: [21, 1], d: "Un sort du grimoire part tout seul (en préparation : au premier gros groupe de monstres)."},
  relique: {n: "RELIQUE", ic: [13, 13], d: "Une relique au choix : elle change les prix ou les dés pour toute la nuit."}
};
const RELIQUES = [
  {k: "remise", n: "MARCHANDAGE", d: "Les lancers coûtent 2 or de moins, pour toute la nuit."},
  {k: "lancer", n: "TOUR DE PASSE-PASSE", d: "Un lancer de plus avant chaque vague."},
  {k: "urgence", n: "SANG-FROID", d: "Un lancer d'urgence de plus pendant chaque combat."},
  {k: "de", n: "DE TRUQUE", d: "Une face SOIN du dé d'action devient RECRUE."}
];

// Événements (dé lancé après les vagues 3, 6 et 9) ; ic = icône dans img/icones.png (ligne, colonne), sauf recrue (sprite d'une classe)
const EVENEMENTS = {
  recrue:      {n: "UN CONDAMNE SE PRESENTE", ic: null, d: "Un nouveau combattant rejoint la Muraille (quatre au plus)."},
  atelier:     {n: "UNE FORGE ABANDONNEE", ic: [10, 4], d: "Une amélioration de dé de plus à l'atelier."},
  benediction: {n: "UNE BENEDICTION", ic: [9, 0], d: "Tous les héros retrouvent toute leur vie."},
  danger:      {n: "UN RAID DE LA GUEULE", ic: [0, 0], d: "La Muraille perd 15 points, mais tu pilles 30 pièces d'or."},
  coffre:      {n: "UN COFFRE", ic: [12, 7], d: "Un objet rare ou mieux, à prendre tout de suite."},
  calme:       {n: "UNE NUIT CALME", ic: [13, 13], d: "+10 pièces d'or et la Muraille se répare de 10."}
};
B.D = {FACES_DEPART, EVENEMENTS, ACTIONS, RELIQUES, HEROS, CLASSES, PORTEE, ROLES, CROISSANCE, TRAITS, MONSTRES, PALIERS, BOSS, NB_VAGUES, SLOTS, RARETES, AFFIXES, BONUS_NIVEAU, XP_NIVEAUX, NIV_LEGENDAIRE, SORTS, SORTS_DEPART, TYPES_DES, FACES_SPECIALES, DES_TROUVES, MAX_DES, MARCHAND, NOMS, NOMS_F};
})();

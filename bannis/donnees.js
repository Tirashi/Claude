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
                 d: "Tient la ligne au corps à corps, solide.", leg: {n: "EPEISTE DEMONIAQUE", spr: "glenys", d: "Ses coups font reculer et volent de la vie."}},
  mercenaire:   {n: "MERCENAIRE", sexe: "H", spr: "oratio-2", role: "cac", pv: 100, atq: 14, def: 3, vit: 1.1, crit: 12,
                 d: "Frappe fort et vite au corps à corps.", leg: {n: "CHAMPION", spr: "oratio", d: "Ses critiques frappent aussi les monstres voisins."}},
  illusionniste:{n: "ILLUSIONNISTE", sexe: "H", spr: "ley-2", role: "magie", pv: 72, atq: 11, def: 1, vit: 0.95, crit: 10,
                 d: "Tire des éclairs de loin et recule si on l'approche.", leg: {n: "GRAND SAGE", spr: "prime", d: "Ses sorts touchent aussi les monstres autour de la cible."}},
  magicienne:   {n: "MAGICIENNE", sexe: "F", spr: "hex", role: "magie", pv: 66, atq: 13, def: 1, vit: 0.9, crit: 8,
                 d: "Boules de feu à distance, fragile.", leg: {n: "SORCIERE DU TEMPS", spr: "hex-3", d: "Ses sorts ralentissent les monstres touchés."}},
  pretresse:    {n: "PRETRESSE", sexe: "F", spr: "linail-2", role: "soin", pv: 78, atq: 9, def: 2, vit: 1.0, crit: 6,
                 d: "Soigne le héros le plus blessé, attaque sinon.", leg: {n: "GRANDE PRETRESSE", spr: "wyvera", d: "Ses soins touchent toute l'escouade."}},
  barde:        {n: "BARDE", sexe: "?", spr: "ouzo", role: "chant", pv: 84, atq: 8, def: 2, vit: 1.0, crit: 6,
                 d: "Son chant accélère l'escouade ; tire des notes de loin.", leg: {n: "BARDE LEGENDAIRE", spr: "ouzo-3", d: "Son chant soigne aussi un peu."}}
};
const PORTEE = {cac: 30, magie: 135, soin: 130, chant: 120, dist: 125};

// Traits des recrues : un effet réel chacun (appliqué par regles.js).
const TRAITS = {
  ivrogne:    {n: "IVROGNE", d: "+15 % d'attaque, mais rate 15 % de ses coups."},
  pieux:      {n: "PIEUX", d: "Reçoit 30 % de soins en plus."},
  deserteur:  {n: "DESERTEUR", d: "Court plus vite, mais fuit vers la Muraille sous 20 % de vie."},
  cleptomane: {n: "CLEPTOMANE", d: "+2 pièces d'or par monstre qu'il achève."},
  tetebrulee: {n: "TETE BRULEE", d: "+10 % de critiques, -1 de défense."},
  balafre:    {n: "BALAFRE", d: "+15 % de vie."},
  vantard:    {n: "VANTARD", d: "+25 % d'expérience."},
  parjure:    {n: "PARJURE", d: "-10 % de vie, critiques à x2,2 au lieu de x1,8."}
};

// Monstres : numéro dans img/monstres.png (Free Mythic Monsters de Willibab), regard vers la gauche.
// role : cac ou dist (tire de loin) ; t : taille d'affichage ; or : pièces gagnées.
const MONSTRES = {
  gobelin:   {n: "GOBELIN", i: 19, pv: 26, atq: 5, def: 0, vit: 1.1, role: "cac", t: 1.0},
  gelee:     {n: "GELEE", i: 16, pv: 24, atq: 4, def: 1, vit: 0.75, role: "cac", t: 1.0},
  guepe:     {n: "GUEPE", i: 8, pv: 15, atq: 4, def: 0, vit: 1.6, role: "cac", t: 0.9},
  serpent:   {n: "SERPENT", i: 9, pv: 20, atq: 5, def: 0, vit: 1.2, role: "cac", t: 0.9},
  diablotin: {n: "DIABLOTIN", i: 24, pv: 22, atq: 5, def: 0, vit: 1.3, role: "cac", t: 0.95},
  ver:       {n: "VER DE SANG", i: 3, pv: 30, atq: 5, def: 1, vit: 0.8, role: "cac", t: 1.0},
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
  arme:   {n: "ARME", noms: [["EPEE DU DESERTEUR", [5,1]], ["HACHE DU BOURREAU", [5,11]], ["DAGUE DU VOLEUR", [5,6]], ["BATON FELE", [6,7]], ["SCEPTRE DE BRAISE", [6,9]], ["MASSE DU GEOLIER", [5,13]]]},
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
const SORTS = [
  {k: "feu", n: "BOULE DE FEU", c: "#ff6a1f", p: 40, d: "Frappe tous les monstres."},
  {k: "soin", n: "PLUIE DE SOINS", c: "#6dff8a", p: 25, d: "Soigne toute l'escouade."},
  {k: "foudre", n: "FOUDRE EN CHAINE", c: "#8fd8ff", p: 25, d: "Frappe fort les monstres un par un."},
  {k: "poulets", n: "PLUIE DE POULETS", c: "#fff3c2", p: 10, d: "Des poulets. Beaucoup de poulets."}
];

// Marchand entre les vagues.
const MARCHAND = [
  {k: "potion", n: "POTION", prix: 12, ic: [9,0], d: "Soigne le héros le plus blessé (45 %)."},
  {k: "parchemin", n: "PARCHEMIN D'ECLAIR", prix: 16, ic: [21,1], d: "Foudroie un monstre pendant le combat."},
  {k: "vue", n: "LONGUE-VUE", prix: 8, ic: [10,7], d: "Montre toute la vague suivante."},
  {k: "mur", n: "REPARER LA MURAILLE", prix: 15, ic: [10,4], d: "+30 de vie pour la Muraille."}
];

const NOMS = ["BRAM", "ODA", "KESS", "MARL", "TOVE", "RHYS", "ILSE", "GARN", "SEFA", "OREK", "VALE", "NELL", "JORN", "AUDE", "THEO", "MAUD", "YSOLDE", "CORBIN", "ELNA", "HUGUES", "ISEUT", "BALDO", "RENAUD", "OLWEN"];
const NOMS_F = ["ODA", "KESS", "TOVE", "ILSE", "SEFA", "VALE", "NELL", "AUDE", "MAUD", "YSOLDE", "ELNA", "ISEUT", "OLWEN"];

B.D = {HEROS, CLASSES, PORTEE, TRAITS, MONSTRES, PALIERS, BOSS, NB_VAGUES, SLOTS, RARETES, AFFIXES, BONUS_NIVEAU, XP_NIVEAUX, NIV_LEGENDAIRE, SORTS, MARCHAND, NOMS, NOMS_F};
})();

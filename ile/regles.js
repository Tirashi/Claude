/* =====================================================================
   LA COLONIE · les RÈGLES (logique pure, sans affichage ni stockage).
   Génération de l'île, bâtiments, postes, production, saisons, colons,
   recherche, résolution d'une semaine, score, sauvegarde (migrate).
   Tout le hasard passe par la graine : même graine = même île, mêmes
   événements (H(graine, tour, …) ne dépend pas des choix du joueur).
   - Dans la page : script classique chargé avant le script du jeu ; ses
     constantes et fonctions sont partagées avec lui (portée globale).
   - Dans Node : require('ile/regles.js') (pilote automatique, tests).
   Cahier des charges : specs/colonie.md.
   ===================================================================== */
'use strict';

/* =================== l'île =================== */
const MW = 24, MH = 14;
const T = { SEA: 0, SAND: 1, MEAD: 2, FOR: 3, DFOR: 4, HILL: 5, ROCK: 6, MOUNT: 7, MARSH: 8, RIV: 9 };
const TNAME = ['La mer', 'Plage', 'Prairie', 'Forêt claire', 'Forêt dense', 'Collines', 'Rochers', 'Montagne', 'Marais', 'Rivière'];
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// hasard reproductible : H(graine, tour, n°…) dans [0, 1)
function H(...a) { let h = 0x9e3779b9; for (const v of a) { h = Math.imul(h ^ (v | 0), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; } return (h >>> 0) / 4294967296; }
function noise(rnd, step, w = MW, h = MH) {
  const gw = Math.ceil(w / step) + 2, gh = Math.ceil(h / step) + 2, gr = new Float32Array(gw * gh); for (let i = 0; i < gw * gh; i++) gr[i] = rnd();
  return (x, y) => { const fx = x / step, fy = y / step, ix = Math.floor(fx), iy = Math.floor(fy), ax = fx - ix, ay = fy - iy, tx = ax * ax * (3 - 2 * ax), ty = ay * ay * (3 - 2 * ay), o = iy * gw + ix;
    return (gr[o] * (1 - tx) + gr[o + 1] * tx) * (1 - ty) + (gr[o + gw] * (1 - tx) + gr[o + gw + 1] * tx) * ty; };
}
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]], N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];
const inside = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH;
function tryIsle(rnd) {
  const a1 = noise(rnd, 6), a2 = noise(rnd, 3), a3 = noise(rnd, 1.5), m1 = noise(rnd, 5), m2 = noise(rnd, 2.5), r1 = noise(rnd, 2);
  const h = [], t = [], berge = new Array(MW * MH).fill(0);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const dx = (x + .5 - MW / 2) / (MW / 2), dy = (y + .5 - MH / 2) / (MH / 2), d = Math.sqrt(dx * dx + dy * dy);
    let v = (a1(x, y) * .55 + a2(x, y) * .3 + a3(x, y) * .15) * .9 + .62 - d * .95;
    if (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) v = -1;
    h.push(v);
    const moist = m1(x, y) * .7 + m2(x, y) * .3;
    t.push(v < .4 ? T.SEA : v < .47 ? T.SAND : v < .8 ? (moist > .6 ? T.DFOR : moist > .48 ? T.FOR : T.MEAD) : v < .95 ? (r1(x, y) > .58 ? T.ROCK : T.HILL) : T.MOUNT);
  }
  const at = (x, y) => t[y * MW + x];
  // la rivière : des collines vers la mer, toujours vers la case voisine la plus basse ; on garde la plus longue
  const src = []; for (let i = 0; i < MW * MH; i++) if (t[i] === T.HILL || t[i] === T.ROCK) src.push(i);
  src.sort((a, b) => h[b] - h[a]);
  let river = null, mouthSea = null;
  for (const s of src.slice(0, 14)) {
    const path = [s], seen = new Set(path); let ok = null;
    for (let k = 0; k < 60; k++) {
      const c = path[path.length - 1], cx = c % MW, cy = c / MW | 0, sea = N4.find(([dx, dy]) => at(cx + dx, cy + dy) === T.SEA);
      if (sea) { ok = (cy + sea[1]) * MW + cx + sea[0]; break; }
      const nb = N4.map(([dx, dy]) => (cy + dy) * MW + cx + dx).filter(i => !seen.has(i) && t[i] !== T.MOUNT && t[i] !== T.SEA);
      if (!nb.length) break;
      nb.sort((a, b) => h[a] - h[b]); path.push(nb[0]); seen.add(nb[0]);
    }
    if (ok !== null && path.length >= 7 && (!river || path.length > river.length)) { river = path; mouthSea = ok; }
  }
  if (!river) return null;
  river.forEach(i => { t[i] = T.RIV; });
  // les berges : très fertiles, mais inondables
  river.forEach(i => { const x = i % MW, y = i / MW | 0; N4.forEach(([dx, dy]) => { const j = (y + dy) * MW + x + dx; if (t[j] !== T.RIV && t[j] !== T.SEA && t[j] !== T.MOUNT) { berge[j] = 1; if (t[j] !== T.SAND && t[j] !== T.ROCK) t[j] = T.MEAD; } }); });
  const mouth = river[river.length - 1], mx = mouth % MW, my = mouth / MW | 0; let mk = 0;
  N8.forEach(([dx, dy]) => { const j = (my + dy) * MW + mx + dx; if (mk < 3 && (t[j] === T.SAND || t[j] === T.MEAD)) { t[j] = T.MARSH; berge[j] = 0; mk++; } });
  const land = t.filter(v => v !== T.SEA && v !== T.RIV).length, mount = t.filter(v => v === T.MOUNT).length;
  if (land < 120 || land > 220 || mount < 2) return null;
  return { t, h, berge, river: [...river, mouthSea] };
}
const isFlat = t => t === T.MEAD || t === T.SAND || t === T.HILL;
const isForest = t => t === T.FOR || t === T.DFOR;
const WOOD_MAX = t => t === T.DFOR ? 32 : t === T.FOR ? 20 : 0;
// l'île complète : terrain, épave (meilleure plage), lieux à découvrir. Recalculée depuis la graine, jamais sauvegardée.
const ISLES = new Map();
function makeIsle(seed) {
  if (ISLES.has(seed)) return ISLES.get(seed);
  let I = null; for (let k = 0; k < 60 && !I; k++) I = tryIsle(mulberry32(seed + k * 7919));
  if (!I) I = tryIsle(mulberry32(1));
  I.seed = seed;
  let best = null, bs = -1;
  for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) {
    if (I.t[y * MW + x] !== T.SAND || !N4.some(([dx, dy]) => I.t[(y + dy) * MW + x + dx] === T.SEA)) continue;
    let sc = 0, fo = 0, ro = 0; for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { if (!inside(x + i, y + j)) continue; const v = I.t[(y + j) * MW + x + i];
      sc += v === T.MEAD ? 2 : isForest(v) ? 1.5 : v === T.RIV ? 3 : (v === T.HILL || v === T.ROCK) ? 1 : 0; if (Math.hypot(i, j) <= 4) { fo += isForest(v); ro += v === T.HILL || v === T.ROCK; } }
    if (fo < 3) sc -= 100; if (!ro) sc -= 30;   // de la forêt et de la pierre en vue dès le départ
    if (sc > bs) { bs = sc; best = [x, y]; }
  }
  I.wreck = best;
  // les lieux, loin de l'épave
  const r = mulberry32(seed ^ 0x2c1b3c6d), used = new Set([best[1] * MW + best[0]]), far = i => Math.hypot(i % MW - best[0], (i / MW | 0) - best[1]) > 5;
  const pickOn = ok => { const c = []; for (let i = 0; i < MW * MH; i++) if (!used.has(i) && far(i) && ok(I.t[i], i)) c.push(i); if (!c.length) return null; const i = c[r() * c.length | 0]; used.add(i); return i; };
  const coast = i => N4.some(([dx, dy]) => { const x = i % MW + dx, y = (i / MW | 0) + dy; return inside(x, y) && I.t[y * MW + x] === T.SEA; });
  I.lieux = [];
  [['filon', t => t === T.ROCK || t === T.HILL], ['ruines', t => t === T.MEAD || isForest(t) || t === T.HILL], ['grotte', t => t === T.HILL || t === T.ROCK],
    ['source', t => t === T.MEAD || isForest(t)], ['epave', (t, i) => t === T.SAND && coast(i)], ['ruines', t => t === T.MEAD || isForest(t) || t === T.HILL]]
    .forEach(([k, ok], n) => { const i = pickOn(ok); if (i !== null) I.lieux.push({ id: n, k, x: i % MW, y: i / MW | 0 }); });
  ISLES.set(seed, I); return I;
}
const LIEUX = {
  filon: { n: 'Filon de fer', d: 'Une carrière posée sur cette case donne du fer, pour la forge.' },
  ruines: { n: 'Ruines', d: 'Les restes d\'un ancien village.' },
  grotte: { n: 'Grotte', d: 'Sèche et fraîche : la nourriture s\'y garde (+100 places au grenier).' },
  source: { n: 'Source', d: 'De l\'eau claire : bonheur +3, comme un puits.' },
  epave: { n: 'Autre épave', d: 'Un second bateau échoué.' },
};

/* =================== bâtiments, ressources, recherche =================== */
const BUILD = {
  habitation: { n: 'Habitation', terr: 'plat', cost: { bois: 6, pierre: 2 }, postes: 0, d: 'Loge 4 colons. Chauffée l\'hiver avec 2 bois par semaine.' },
  ecole: { n: 'École', terr: 'sol', cost: { bois: 8, pierre: 2 }, postes: 2, d: 'Les colons y étudient : points de savoir pour la recherche.' },
  cueilleur: { n: 'Cueilleur', terr: 'lisiere', cost: { bois: 4 }, postes: 2, d: 'Baies et champignons, pas l\'hiver.' },
  pecherie: { n: 'Pêcherie', terr: 'eau', cost: { bois: 6 }, postes: 2, d: 'Poisson toute l\'année, moins l\'hiver.' },
  bucheron: { n: 'Bûcheron', terr: 'foret', cost: { bois: 4 }, postes: 2, d: 'Bois, pris aux arbres autour. Ils repoussent lentement.' },
  carriere: { n: 'Carrière', terr: 'roc', cost: { bois: 4 }, postes: 2, d: 'Pierre (et du fer sur un filon).' },
  champ: { n: 'Champ', terr: 'prairie', cost: { bois: 2 }, postes: 2, d: 'Semé au printemps, récolté à l\'automne. Céréales ou légumes.' },
  chasseur: { n: 'Chasseur', terr: 'foret', cost: { bois: 4 }, postes: 2, d: 'Viande et peaux. Le gibier s\'épuise si on chasse trop.' },
  elevage: { n: 'Élevage', terr: 'prairie', cost: { bois: 8, pierre: 2 }, postes: 1, d: 'Œufs et laine.' },
  port: { n: 'Port', terr: 'cote', cost: { planches: 10, pierre: 6 }, postes: 3, d: 'Beaucoup de poisson ; attire des bateaux de colons quand la colonie va bien.' },
  entrepot: { n: 'Entrepôt', terr: 'sol', cost: { bois: 6 }, postes: 0, d: '+200 places pour le bois, la pierre et les planches.' },
  scierie: { n: 'Scierie', terr: 'riviere', cost: { bois: 6, pierre: 4 }, postes: 2, d: '3 bois → 2 planches par colon.' },
  forge: { n: 'Forge', terr: 'sol', cost: { planches: 6, pierre: 6 }, postes: 1, d: '1 fer → 2 outils. Sans outils, le travail va moitié moins vite.' },
  digue: { n: 'Digue', terr: 'berge', cost: { pierre: 8 }, postes: 0, d: 'Protège les cases voisines de la crue.' },
  puits: { n: 'Puits', terr: 'sol', cost: { pierre: 4 }, postes: 0, d: 'Eau propre : bonheur +3, moins de maladies.' },
  grenier: { n: 'Grenier', terr: 'sol', cost: { bois: 6, pierre: 4 }, postes: 0, d: '200 places : la nourriture ne s\'y gâte plus.' },
  tailleur: { n: 'Tailleur', terr: 'sol', cost: { planches: 4 }, postes: 1, d: '2 peaux ou laine → 1 vêtement. Indispensables l\'hiver.' },
  guerisseur: { n: 'Guérisseur', terr: 'sol', cost: { planches: 6 }, postes: 1, d: 'Soigne : la faim et le froid font partir les colons moins vite.' },
  tour: { n: 'Tour de guet', terr: 'sol', cost: { bois: 6 }, postes: 1, d: 'Annonce les tempêtes et les incendies une semaine plus tôt.' },
  taverne: { n: 'Taverne', terr: 'sol', cost: { planches: 8 }, postes: 1, d: 'Bonheur +10 quand quelqu\'un la tient.' },
  bibliotheque: { n: 'Bibliothèque', terr: 'sol', cost: { planches: 8, pierre: 6 }, postes: 3, d: 'Plus de place pour étudier, et 50 % de savoir en plus.' },
  tente: { n: 'Tente', postes: 0, d: 'Loge 8 colons, mais froide l\'hiver (3 bois par semaine).' },
  epave: { n: 'L\'épave', postes: 0, d: 'Le bateau des naufragés. Tout a commencé ici ; on y range 150 de chaque matériau.' },
};
const ORDER = ['habitation', 'ecole', 'cueilleur', 'pecherie', 'bucheron', 'carriere', 'champ', 'chasseur', 'elevage', 'port', 'entrepot', 'scierie', 'forge', 'digue',
  'puits', 'grenier', 'tailleur', 'guerisseur', 'tour', 'taverne', 'bibliotheque'];
const START = ['habitation', 'ecole', 'cueilleur', 'pecherie', 'bucheron', 'carriere'];
// l'arbre de recherche (choix du 16/10) : 3 branches + le savoir ; chaque plan demande le précédent de sa branche
const BRANCHES = [['nour', 'Nourriture'], ['batir', 'Bâtir'], ['village', 'Village'], ['savoir', 'Savoir']];
const TREE = {
  champ: { br: 'nour', cost: 8, req: null }, chasseur: { br: 'nour', cost: 20, req: 'champ' }, elevage: { br: 'nour', cost: 40, req: 'chasseur' }, port: { br: 'nour', cost: 80, req: 'elevage' },
  entrepot: { br: 'batir', cost: 8, req: null }, scierie: { br: 'batir', cost: 20, req: 'entrepot' }, forge: { br: 'batir', cost: 40, req: 'scierie' }, digue: { br: 'batir', cost: 40, req: 'forge' },
  puits: { br: 'village', cost: 8, req: null }, grenier: { br: 'village', cost: 20, req: 'puits' }, tailleur: { br: 'village', cost: 40, req: 'grenier' },
  guerisseur: { br: 'village', cost: 40, req: 'tailleur' }, tour: { br: 'village', cost: 40, req: 'guerisseur' }, taverne: { br: 'village', cost: 80, req: 'tour' },
  bibliotheque: { br: 'savoir', cost: 40, req: null, needB: 'ecole' },
};
const FOODS = [['poisson', 'Poisson'], ['viande', 'Viande'], ['baies', 'Baies'], ['cereales', 'Céréales'], ['legumes', 'Légumes'], ['oeufs', 'Œufs']];
const RESNAME = { poisson: 'poisson', viande: 'viande', baies: 'baies', cereales: 'céréales', legumes: 'légumes', oeufs: 'œufs', bois: 'bois', pierre: 'pierre', planches: 'planches',
  fer: 'fer', outils: 'outils', peaux: 'peaux', laine: 'laine', vetements: 'vêtements', savoir: 'savoir' };
const MATS = ['bois', 'pierre', 'planches'];
const SEASONS = ['Printemps', 'Été', 'Automne', 'Hiver'];
// production d'un colon par semaine (out), ce qu'il consomme (in), facteur de chaque saison (s)
const PROD = {
  pecherie: { out: { poisson: 6 }, s: [1, 1.1, 1, .5] }, port: { out: { poisson: 7 }, s: [1, 1.1, 1, .6] },
  cueilleur: { out: { baies: 5 }, s: [.7, 1.2, 1, 0] }, chasseur: { out: { viande: 4, peaux: 1 }, s: [1, 1, 1.2, .8] },
  bucheron: { out: { bois: 5 }, s: [1, 1, 1, .8] }, carriere: { out: { pierre: 3 }, s: [1, 1, 1, .7] },
  elevage: { out: { oeufs: 5, laine: 1 }, s: [1, 1, 1, .5] }, champ: { out: {}, s: [1, 1, 1, 0] },
  scierie: { out: { planches: 2 }, in: { bois: 3 }, s: [1, 1, 1, 1] }, forge: { out: { outils: 2 }, in: { fer: 1 }, s: [1, 1, 1, 1] },
  tailleur: { out: { vetements: 1 }, in: { fibre: 2 }, s: [1, 1, 1, 1] },
  ecole: { out: { savoir: 1 }, s: [1, 1, 1, 1] }, bibliotheque: { out: { savoir: 1.5 }, s: [1, 1, 1, 1] },
};
const TALENT_FOR = { pecherie: 'pecheur', port: 'pecheur', bucheron: 'charpentier', chantier: 'charpentier', scierie: 'charpentier', cueilleur: 'cuisinier', champ: 'cuisinier',
  elevage: 'cuisinier', taverne: 'cuisinier', chasseur: 'marin', tour: 'marin', carriere: 'mecano', forge: 'mecano', guerisseur: 'infirmiere', tailleur: 'infirmiere',
  ecl: 'exploratrice', ecole: 'erudit', bibliotheque: 'erudit' };
const TAL = { pecheur: 'Pêcheur', charpentier: 'Charpentier', infirmiere: 'Infirmière', cuisinier: 'Cuisinier', exploratrice: 'Exploratrice', mecano: 'Mécano', marin: 'Marin', erudit: 'Érudit' };
const CAR = { courageux: 'courageux', raleur: 'râleur', peureux: 'peureux', reveur: 'rêveur', travailleur: 'travailleur', gourmand: 'gourmand' };
const NAMES = [['Hugo', 0], ['Jade', 1], ['Malo', 0], ['Rose', 1], ['Noé', 0], ['Inès', 1], ['Léa', 1], ['Tom', 0], ['Lina', 1], ['Sacha', 0], ['Ambre', 1], ['Paul', 0],
  ['Mila', 1], ['Zoé', 1], ['Yanis', 0], ['Émile', 0], ['Louise', 1], ['Arthur', 0], ['Chloé', 1], ['Nina', 1], ['Gabin', 0], ['Lou', 1], ['Jules', 0], ['Alma', 1],
  ['Basile', 0], ['Iris', 1], ['Marius', 0], ['Lise', 1], ['Victor', 0], ['Anna', 1], ['Léon', 0], ['Elsa', 1], ['Simon', 0], ['Margot', 1], ['Oscar', 0], ['Camille', 1],
  ['Nathan', 0], ['Agathe', 1], ['Robin', 0], ['Clara', 1], ['Mathis', 0], ['Suzanne', 1], ['Félix', 0], ['Héloïse', 1], ['Timothée', 0], ['Maëlle', 1], ['Aubin', 0], ['Capucine', 1]];
const ADULT_AT = 32;   // un enfant devient adulte au bout de 2 ans (32 semaines)
const RETIRE_AT = 60;  // âge de la retraite
const FREEZE = 6, STARVE = 4;   // froid et faim accumulés avant de partir

/* =================== la partie =================== */
const RUN_V = 1;
const dateOf = run => ({ week: run.turn % 4 + 1, season: (run.turn >> 2) % 4, year: (run.turn >> 4) + 1 });
const isleOf = run => makeIsle(run.seed);
const bAt = (run, x, y) => run.B.find(b => b.x === x && b.y === y);
const bById = (run, id) => run.B.find(b => b.id === id);
const has = (run, type) => run.B.some(b => b.done && b.type === type);
const count = (run, type) => run.B.filter(b => b.done && b.type === type).length;
function newColon(run, n, tal, car, age, years, extra = {}) {
  const nm = NAMES.find(([a]) => a === n) || [n, 0], id = run.nextId++;
  return { id, n, tal, car, age, years, grow: 0, skin: (H(run.seed, id, 11) * 4) | 0, hair: (H(run.seed, id, 12) * 6) | 0, long: nm[1], post: null, faim: 0, froid: 0, vet: false, ...extra };
}
function freshName(run, k) {
  const used = new Set(run.C.map(c => c.n)), free = NAMES.filter(([n]) => !used.has(n));
  return free.length ? free[(H(run.seed, run.turn, k, 7) * free.length) | 0][0] : NAMES[(H(run.seed, run.turn, k) * NAMES.length) | 0][0] + ' ' + (run.nextId % 9 + 2);
}
function newRun(seed, opts = {}) {
  const I = makeIsle(seed), [wx, wy] = I.wreck;
  const run = { v: RUN_V, kind: 'colonie', seed, daily: opts.daily || null, turn: 0, nextId: 1, B: [], C: [], target: null, found: [], unlocked: [], happy: 60, low: 0, blues: 0, wear: 0,
    seen: new Array(MW * MH).fill(0), wood: I.t.map(WOOD_MAX), over: false,
    res: { poisson: 30, viande: 10, baies: 16, cereales: 40, legumes: 0, oeufs: 0, bois: 30, pierre: 6, planches: 0, fer: 0, outils: 24, peaux: 2, laine: 0, vetements: 16, savoir: 0 },
    stats: { maxPop: 8, built: 0, happySum: 0, weeks: 0, left: 0, born: 0, arrived: 0 }, milestones: [] };
  run.B.push({ id: run.nextId++, type: 'epave', x: wx, y: wy, done: true });
  // la tente, sur la case plate libre la plus proche de l'épave
  let pick = null, pd = 1e9;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { if (bAt(run, x, y) || !terrOk(run, 'plat', x, y)) continue; const d = Math.hypot(x - wx, y - wy); if (d < pd) { pd = d; pick = [x, y]; } }
  if (pick) run.B.push({ id: run.nextId++, type: 'tente', x: pick[0], y: pick[1], done: true });
  [['Hugo', 'charpentier', 'travailleur', 34], ['Malo', 'pecheur', 'reveur', 27], ['Rose', 'cuisinier', 'gourmand', 41], ['Inès', 'exploratrice', 'courageux', 24],
    ['Léa', 'infirmiere', 'peureux', 30], ['Noé', 'mecano', 'courageux', 45], ['Tom', 'marin', 'raleur', 52], ['Jade', 'erudit', 'reveur', 22]]
    .forEach(([n, tal, car, y]) => run.C.push(newColon(run, n, tal, car, 'adulte', y)));
  reveal(run, wx, wy, 4.5);
  pickTarget(run);
  return run;
}
function reveal(run, cx, cy, r) { for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (Math.hypot(x - cx, y - cy) <= r) run.seen[y * MW + x] = 1; }
// prochaine case à explorer : la case inconnue la plus proche de l'épave, au bord du connu
function pickTarget(run) {
  const I = isleOf(run); let best = null, bd = 1e9;
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { const i = y * MW + x; if (run.seen[i] || I.t[i] === T.SEA) continue;
    if (!N4.some(([dx, dy]) => inside(x + dx, y + dy) && run.seen[(y + dy) * MW + x + dx])) continue;
    const d = Math.hypot(x - I.wreck[0], y - I.wreck[1]); if (d < bd) { bd = d; best = [x, y]; } }
  run.target = best;
}
function terrOk(run, kind, x, y) {
  const I = isleOf(run), t = I.t[y * MW + x], nb = N4.map(([dx, dy]) => inside(x + dx, y + dy) ? I.t[(y + dy) * MW + x + dx] : T.SEA);
  switch (kind) {
    case 'plat': return t === T.MEAD || t === T.SAND;
    case 'sol': return isFlat(t);
    case 'prairie': return t === T.MEAD;
    case 'foret': return isForest(t);
    case 'lisiere': return isFlat(t) && N8.some(([dx, dy]) => inside(x + dx, y + dy) && isForest(I.t[(y + dy) * MW + x + dx]));
    case 'eau': return isFlat(t) && nb.some(v => v === T.SEA || v === T.RIV);
    case 'cote': return isFlat(t) && nb.includes(T.SEA);
    case 'riviere': return isFlat(t) && nb.includes(T.RIV);
    case 'roc': return t === T.HILL || t === T.ROCK;
    case 'berge': return I.berge[y * MW + x] === 1 && isFlat(t);
  }
  return false;
}
const unlocked = (run, type) => START.includes(type) || run.unlocked.includes(type);
const costOf = type => BUILD[type].cost;
const canPay = (run, cost) => Object.entries(cost).every(([k, v]) => run.res[k] >= v);
// ce qu'on peut bâtir sur une case : [type, raison du refus ou '']
function buildOptions(run, x, y) {
  if (!run.seen[y * MW + x] || bAt(run, x, y)) return [];
  return ORDER.filter(k => terrOk(run, BUILD[k].terr, x, y)).map(k => [k, !unlocked(run, k) ? 'plan' : !canPay(run, costOf(k)) ? 'cout' : '']);
}
function placeBuilding(run, type, x, y) {
  const opt = buildOptions(run, x, y).find(([k]) => k === type); if (!opt || opt[1]) return null;
  for (const [k, v] of Object.entries(costOf(type))) run.res[k] -= v;
  const b = { id: run.nextId++, type: 'chantier', x, y, done: false, target: type, p: 0, max: Math.ceil(Object.values(costOf(type)).reduce((a, v) => a + v, 0) * 1.5) };
  run.B.push(b); return b;
}
function cancelBuilding(run, b) {
  if (!b || b.done) return; workers(run, b.id).forEach(c => { c.post = null; });
  for (const [k, v] of Object.entries(costOf(b.target))) run.res[k] += v;
  run.B.splice(run.B.indexOf(b), 1);
}
// démolir un bâtiment fini (on récupère la moitié des matériaux)
function demolish(run, b) {
  if (!b || !b.done || b.type === 'epave' || b.type === 'tente') return; workers(run, b.id).forEach(c => { c.post = null; });
  for (const [k, v] of Object.entries(costOf(b.type))) run.res[k] += Math.floor(v / 2);
  run.B.splice(run.B.indexOf(b), 1);
}

/* =================== postes =================== */
const workers = (run, id) => run.C.filter(c => c.post === id);
const maxOf = b => b === 'ecl' ? 2 : b.done ? BUILD[b.type].postes : 4;
const keyOf = b => b === 'ecl' ? 'ecl' : b.done ? b.type : 'chantier';
const postId = b => b === 'ecl' ? 'ecl' : b.id;
const nameOf = b => b === 'ecl' ? 'Éclaireur' : b.done ? BUILD[b.type].n : 'Chantier · ' + BUILD[b.target].n;
function eff(c, key) {
  let e = c.tal && TALENT_FOR[key] === c.tal ? 1.5 : 1;
  if (c.car === 'travailleur') e *= 1.2; else if (c.car === 'reveur') e *= key === 'ecole' || key === 'bibliotheque' ? 1.2 : .9;
  else if (c.car === 'courageux' && (key === 'ecl' || key === 'chantier')) e *= 1.1; else if (c.car === 'peureux' && key === 'ecl') e *= .8;
  return e;
}
const freeWorkers = run => run.C.filter(c => c.age === 'adulte' && c.post === null);
function addWorker(run, b) {
  const f = freeWorkers(run); if (!f.length || workers(run, postId(b)).length >= maxOf(b)) return null;
  const c = f.sort((p, q) => eff(q, keyOf(b)) - eff(p, keyOf(b)))[0]; c.post = postId(b); return c;
}
function removeWorker(run, b) {
  const w = workers(run, postId(b)); if (!w.length) return null;
  const c = w.sort((p, q) => eff(p, keyOf(b)) - eff(q, keyOf(b)))[0]; c.post = null; return c;
}
// envoyer un colon précis à un poste (s'il est plein, le moins doué prend son ancienne place)
function moveColon(run, c, b) {
  if (!c || c.age !== 'adulte') return;
  if (b === null) { c.post = null; return; }
  const id = postId(b); if (c.post === id) return;
  const w = workers(run, id);
  if (w.length >= maxOf(b)) { const out = w.sort((p, q) => eff(p, keyOf(b)) - eff(q, keyOf(b)))[0]; out.post = c.post; }
  c.post = id;
}
const posts = run => [...run.B.filter(b => maxOf(b) > 0), 'ecl'];

/* =================== production =================== */
const woodAround = (run, b) => { let s = 0; for (const [dx, dy] of [[0, 0], ...N8]) { const x = b.x + dx, y = b.y + dy; if (inside(x, y)) s += run.wood[y * MW + x]; } return s; };
const gameCap = (run, b) => { const I = isleOf(run); let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const x = b.x + dx, y = b.y + dy; if (inside(x, y) && isForest(I.t[y * MW + x])) n++; } return Math.min(120, n * 8); };
const onFilon = (run, b) => isleOf(run).lieux.some(l => l.k === 'filon' && l.x === b.x && l.y === b.y && run.found.includes(l.id));
const fert = (run, b) => isleOf(run).berge[b.y * MW + b.x] ? 1.5 : 1;
const toolF = run => run.res.outils > 0 ? 1 : .5;
const moodF = run => run.happy >= 70 ? 1.1 : run.happy < 30 ? .85 : 1;
const SOW_MAX = 24, HARVEST = 10;
// ce que chaque bâtiment produira cette semaine (sans rien modifier) : { by: {id: {res: n}}, tot: {res: n}, fields: {id: {sow, harvest}} }
function production(run) {
  const { season } = dateOf(run), st = { ...run.res }, tot = {}, by = {}, fields = {}, tf = toolF(run) * moodF(run);
  const add = (b, k, v) => { if (!v) return; (by[b.id] = by[b.id] || {})[k] = (by[b.id][k] || 0) + v; tot[k] = (tot[k] || 0) + v; st[k] = (st[k] || 0) + v; };
  const list = run.B.filter(b => b.done && PROD[b.type]).sort((a, b) => (PROD[a.type].in ? 1 : 0) - (PROD[b.type].in ? 1 : 0));
  for (const b of list) {
    const w = workers(run, b.id); if (!w.length) continue;
    const P = PROD[b.type], power = w.reduce((a, c) => a + eff(c, b.type), 0) * tf;
    if (b.type === 'champ') {
      const f = { sow: 0, harvest: 0 };
      if (season === 0) f.sow = Math.min(SOW_MAX - (b.sown || 0), Math.round(power * 3));
      if (season === 2) { f.harvest = Math.min(b.ripe || 0, Math.round(power * HARVEST)); add(b, b.crop || 'cereales', f.harvest); }
      fields[b.id] = f; continue;
    }
    let k = power * P.s[season];
    if (b.type === 'bucheron') k = Math.min(k, woodAround(run, b) / P.out.bois);
    if (b.type === 'chasseur') k = Math.min(k, (b.game ?? gameCap(run, b)) / P.out.viande);
    if (P.in) for (const [r, v] of Object.entries(P.in)) k = Math.min(k, (r === 'fibre' ? st.peaux + st.laine : st[r] || 0) / v);
    k = Math.max(0, k);
    for (const [r, v] of Object.entries(P.out)) add(b, r, r === 'savoir' ? Math.round(v * k * 10) / 10 : Math.round(v * k));
    if (b.type === 'carriere' && onFilon(run, b)) add(b, 'fer', Math.max(1, Math.round(k * .7)));
    if (P.in) for (const [r, v] of Object.entries(P.in)) {
      let need = Math.round(v * k);
      if (r === 'fibre') { const p = Math.min(need, st.peaux); add(b, 'peaux', -p); add(b, 'laine', -(need - p)); } else add(b, r, -need);
    }
  }
  return { by, tot, fields };
}
const foodTotal = run => FOODS.reduce((a, [k]) => a + run.res[k], 0);
const eatOf = c => c.age === 'enfant' ? 1 : c.car === 'gourmand' ? 3 : 2;
const eaters = run => run.C.reduce((a, c) => a + eatOf(c), 0);
const foodCap = run => 50 + count(run, 'grenier') * 200 + (isleOf(run).lieux.some(l => l.k === 'grotte' && run.found.includes(l.id)) ? 100 : 0);
const matCap = run => 150 + count(run, 'entrepot') * 200;
const spoilOf = (run, food) => Math.floor(Math.max(0, food - foodCap(run)) * .04);
// logement : les habitations d'abord (4 lits), puis la tente (8 lits)
function housing(run) {
  const homes = [...run.B.filter(b => b.done && b.type === 'habitation').map(b => ({ b, n: 4 })), ...run.B.filter(b => b.done && b.type === 'tente').map(b => ({ b, n: 8 }))];
  const where = new Map(); let k = 0;
  for (const h of homes) for (let j = 0; j < h.n && k < run.C.length; j++) where.set(run.C[k++].id, h.b);
  return { where, beds: homes.reduce((a, h) => a + h.n, 0), out: run.C.length - k };
}
const HEAT = { habitation: 2, tente: 3 };
function heatNeed(run) {
  if (dateOf(run).season !== 3) return 0;
  const used = new Set(housing(run).where.values()); let n = 0; used.forEach(b => { n += HEAT[b.type]; }); return n;
}
// prévision de la semaine : variation de chaque ressource
function forecast(run) {
  const p = production(run), d = { ...p.tot }, eat = eaters(run), foodIn = FOODS.reduce((a, [k]) => a + (d[k] || 0), 0);
  const heat = heatNeed(run), spoil = spoilOf(run, foodTotal(run) + foodIn - eat);
  const food = foodIn - eat - spoil;
  const wearW = run.C.filter(c => c.post !== null && c.post !== 'ecl').length;
  const winterStart = dateOf(run).season === 3 && dateOf(run).week === 1;
  return { p, d, foodIn, eat, spoil, food, heat, bois: (d.bois || 0) - heat, pierre: d.pierre || 0, planches: d.planches || 0,
    outils: (d.outils || 0) - Math.floor(run.wear + wearW * .05), vetements: (d.vetements || 0) - (winterStart ? Math.min(run.res.vetements, run.C.length) : 0), savoir: d.savoir || 0 };
}
// bonheur visé cette semaine, avec le détail des raisons
function moodParts(run, ctx = {}) {
  const parts = [], add = (v, t) => { if (v) parts.push([Math.round(v), t]); };
  const kinds = ctx.kinds ?? FOODS.filter(([k]) => run.res[k] > 0).length;
  add([-12, -8, 0, 5, 8, 10, 12][kinds], kinds <= 1 ? 'nourriture monotone' : kinds === 2 ? '' : 'nourriture variée');
  const h = housing(run), inHouse = [...h.where.values()].filter(b => b.type === 'habitation').length, n = Math.max(1, run.C.length);
  add(10 * inHouse / n, 'maisons'); add(-18 * h.out / n, 'colons dehors');
  if (ctx.hungry) add(-20, 'la faim');
  if (ctx.cold) add(-14 * ctx.cold / n, 'le froid');
  const tav = run.B.filter(b => b.done && b.type === 'taverne' && workers(run, b.id).length).length; add(tav ? 5 + 5 * Math.min(2, tav) : 0, 'taverne');
  const water = has(run, 'puits') || isleOf(run).lieux.some(l => l.k === 'source' && run.found.includes(l.id)); add(water ? 3 : 0, 'eau propre');
  add(Math.min(4, run.C.filter(c => c.age === 'ancien').length), 'les anciens');
  add(Math.min(6, run.C.filter(c => c.age === 'enfant').length * 2), 'les enfants');
  add(-run.blues, 'des colons sont partis');
  return { target: Math.max(0, Math.min(100, 50 + parts.reduce((a, [v]) => a + v, 0))), parts: parts.filter(([, t]) => t) };
}
function alerts(run) {
  const f = forecast(run), out = [], { season, week } = dateOf(run), food = foodTotal(run);
  if (f.food < 0) { const w = Math.floor(food / -f.food); out.push([w <= 3 ? 'danger' : 'warn', `Nourriture : ${w} semaine${w > 1 ? 's' : ''}`, `Il en rentre ${f.foodIn} par semaine et les colons en mangent ${f.eat}. Ajoute des pêcheurs ou des cueilleurs.`]); }
  if (season === 2 || (season === 1 && week >= 3)) {
    const need = (heatNeedAt(run)) * 4, weeks = season === 2 ? 5 - week : 9 - week, have = Math.round(run.res.bois + Math.max(0, f.d.bois || 0) * weeks);
    out.push([have >= need ? 'info' : 'warn', `Hiver : bois ${have} / ${need}`, `Bois de chauffage prévu au début de l'hiver : ${have}, il en faut ${need} pour les 4 semaines.`]);
    const vneed = run.C.length; if (run.res.vetements < vneed) out.push(['warn', `Vêtements : ${run.res.vetements} / ${vneed}`, 'Chaque colon use un vêtement par hiver. Sans vêtement, il a froid. Le tailleur en fait avec des peaux ou de la laine.']);
  }
  if (season === 3) {
    if (f.bois < 0 && run.res.bois < -f.bois * (5 - week)) out.push(['danger', `Bois de chauffage : ${Math.floor(run.res.bois / -f.bois)} semaine(s)`, `Les maisons brûlent ${f.heat} bois par semaine.`]);
    const cold = run.C.filter(c => c.froid >= FREEZE - 2); if (cold.length) out.push(['danger', `${cold.length} colon${cold.length > 1 ? 's ont' : ' a'} très froid`, `${cold.map(c => c.n).join(', ')} ${cold.length > 1 ? 'vont' : 'va'} partir si ça continue. Habitations chauffées et vêtements !`]);
  }
  const hungry = run.C.filter(c => c.faim >= STARVE - 2); if (hungry.length) out.push(['danger', `${hungry.length} colon${hungry.length > 1 ? 's ont' : ' a'} faim`, `${hungry.map(c => c.n).join(', ')} ${hungry.length > 1 ? 'vont' : 'va'} quitter l'île si la nourriture manque encore.`]);
  const h = housing(run); if (h.out > 0) out.push(['warn', `${h.out} colon${h.out > 1 ? 's' : ''} sans lit`, 'Construis une habitation (4 lits).']);
  if (run.happy < 35) out.push(['danger', `Bonheur bas : ${run.happy}`, 'Sous 30, des colons finissent par partir. Nourriture variée, maisons, taverne…']);
  if (run.res.outils <= 0) out.push(['warn', 'Plus d\'outils', 'Le travail va moitié moins vite. La forge en fabrique avec du fer.']);
  else if (f.outils < 0 && run.res.outils <= 5) out.push(['warn', `Outils : ${run.res.outils}`, 'Les outils s\'usent. Bientôt plus rien : prévois une forge et du fer.']);
  const full = MATS.filter(k => run.res[k] + (f.d[k] || 0) > matCap(run)); if (full.length) out.push(['info', `Stock plein : ${full.map(k => RESNAME[k]).join(', ')}`, `On ne garde que ${matCap(run)} de chaque matériau. Un entrepôt ajoute 200 places.`]);
  if (f.spoil > 0) out.push(['info', `${f.spoil} nourriture se gâte`, has(run, 'grenier') ? 'Le grenier est plein : construis-en un autre.' : 'L\'épave n\'abrite que 50 de nourriture : au-delà, elle se gâte un peu chaque semaine. Un grenier en garde 200.']);
  const fr = freeWorkers(run).length; if (fr) out.push(['info', `${fr} colon${fr > 1 ? 's' : ''} sans poste`, 'Touche Postes pour leur donner du travail.']);
  if (!run.B.some(b => b.done === false) && fr === 0 && run.C.length && !out.length) out.push(['info', 'Aucun chantier', 'Touche une case libre pour construire.']);
  return out;
}
// chauffage prévu pour l'hiver (même logement qu'aujourd'hui)
function heatNeedAt(run) { const used = new Set(housing(run).where.values()); let n = 0; used.forEach(b => { n += HEAT[b.type]; }); return n; }

/* =================== recherche =================== */
function researchState(run, k) {
  const R = TREE[k]; if (!R) return 'non';
  if (run.unlocked.includes(k)) return 'fait';
  if (R.req && !run.unlocked.includes(R.req)) return 'bloque';
  if (R.needB && !has(run, R.needB)) return 'bloque';
  return run.res.savoir >= R.cost ? 'pret' : 'cher';
}
function research(run, k) { if (researchState(run, k) !== 'pret') return false; run.res.savoir = Math.round((run.res.savoir - TREE[k].cost) * 10) / 10; run.unlocked.push(k); return true; }

/* =================== la semaine passe =================== */
// rep : cartes du compte rendu [classe, icône, titre, texte] ; floats : nombres qui s'envolent des bâtiments
function endWeek(run) {
  if (run.over) return { rep: [], floats: [] };
  const rep = [], floats = [], date = dateOf(run), I = isleOf(run), cap = matCap(run);
  const card = (cls, ic, t, d) => rep.push([cls, ic, t, d]);
  // 1. production
  const p = production(run), harvested = {};
  for (const [id, d] of Object.entries(p.by)) {
    const b = bById(run, +id); for (const [k, v] of Object.entries(d)) run.res[k] = Math.max(0, Math.round((run.res[k] + v) * 10) / 10);
    const plus = Object.entries(d).filter(([k, v]) => v > 0 && k !== 'savoir'), sv = d.savoir;
    if (plus.length) floats.push({ x: b.x, y: b.y, s: '+' + Math.round(plus.reduce((a, [, v]) => a + v, 0)), k: plus[0][0], c: 'ok' });
    else if (sv) floats.push({ x: b.x, y: b.y, s: '+' + Math.round(sv * 10) / 10, k: 'savoir', c: 'sci' });
    for (const [k, v] of plus) harvested[k] = (harvested[k] || 0) + v;
    if (b.type === 'bucheron') { let cut = d.bois || 0; const tiles = [[0, 0], ...N8].map(([dx, dy]) => [b.x + dx, b.y + dy]).filter(([x, y]) => inside(x, y)).map(([x, y]) => y * MW + x).sort((a, c) => run.wood[c] - run.wood[a]);
      for (const i of tiles) { const t = Math.min(cut, run.wood[i]); run.wood[i] -= t; cut -= t; if (!cut) break; } }
    if (b.type === 'chasseur') b.game = Math.max(0, (b.game ?? gameCap(run, b)) - (d.viande || 0));
  }
  for (const [id, f] of Object.entries(p.fields)) { const b = bById(run, +id); b.sown = (b.sown || 0) + f.sow; b.ripe = Math.max(0, (b.ripe || 0) - f.harvest); if (f.sow) floats.push({ x: b.x, y: b.y, s: 'semis', k: null, c: 'dim' }); }
  for (const k of MATS) if (run.res[k] > cap) run.res[k] = cap;
  const foodIn = FOODS.reduce((a, [k]) => a + (harvested[k] || 0), 0);
  // 2. chantiers
  run.B.filter(b => !b.done).forEach(b => {
    const gn = chGain(run, b); b.p = Math.min(b.max, b.p + gn);
    if (b.p >= b.max) { b.done = true; b.type = b.target; delete b.target; delete b.p; delete b.max; run.stats.built++;
      // les bâtisseurs restent y travailler (dans la limite des postes), les autres sont libres
      const w = workers(run, b.id).sort((p, q) => eff(q, b.type) - eff(p, b.type)), stay = w.slice(0, BUILD[b.type].postes); w.slice(stay.length).forEach(c => { c.post = null; });
      if (b.type === 'chasseur') b.game = gameCap(run, b);
      card('good', { b: b.type }, `${BUILD[b.type].n} : terminé`, `${BUILD[b.type].d} ${stay.length ? `${stay.map(c => c.n).join(' et ')} ${stay.length > 1 ? 'y travaillent' : 'y travaille'} maintenant.` : 'Les bâtisseurs sont libres.'}`); }
    else if (gn) floats.push({ x: b.x, y: b.y, s: '+' + gn, k: null, c: 'gold' });
  });
  // 3. exploration
  const ew = workers(run, 'ecl').reduce((a, c) => a + eff(c, 'ecl'), 0) * toolF(run);
  if (ew && run.target) {
    const n = Math.max(1, Math.round(ew * 2.5)), [tx, ty] = run.target, cand = [];
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (!run.seen[y * MW + x]) cand.push([Math.hypot(x - tx, y - ty) + (I.t[y * MW + x] === T.SEA ? 3 : 0), y * MW + x]);
    cand.sort((a, b) => a[0] - b[0]).slice(0, n).forEach(([, i]) => { run.seen[i] = 1; });
    if (run.seen[ty * MW + tx]) pickTarget(run);
    floats.push({ x: tx, y: ty, s: `+${n} cases`, k: null, c: 'gold' });
  }
  I.lieux.forEach(l => { if (run.found.includes(l.id) || !run.seen[l.y * MW + l.x]) return; run.found.push(l.id); found(run, l, card); });
  // 4. consommation : nourriture variée, chauffage, vêtements, outils, nourriture qui se gâte
  const need = eaters(run), kinds = FOODS.filter(([k]) => run.res[k] > 0).length;
  let ate = 0; { let left = need; while (left > 0 && foodTotal(run) > 0) { const ks = FOODS.map(([k]) => k).filter(k => run.res[k] > 0).sort((a, b) => run.res[b] - run.res[a]);
    for (const k of ks) { if (!left) break; const t = Math.min(run.res[k], Math.max(1, Math.ceil(left / ks.length))); run.res[k] -= t; left -= t; ate += t; } } }
  const ratio = need ? ate / need : 1, hungry = ratio < 1;
  const healer = run.B.some(b => b.done && b.type === 'guerisseur' && workers(run, b.id).length);
  run.C.forEach(c => { if (hungry) c.faim += ratio < .5 ? 2 : 1; else c.faim = Math.max(0, c.faim - 1); });
  const spoil = spoilOf(run, foodTotal(run)); if (spoil) { let s = spoil; for (const [k] of FOODS) { const t = Math.min(run.res[k], Math.ceil(spoil * run.res[k] / Math.max(1, foodTotal(run) + s))); run.res[k] -= t; s -= t; if (s <= 0) break; } }
  let coldN = 0;
  if (date.season === 3) {
    if (date.week === 1) { let v = run.res.vetements; run.C.forEach(c => { c.vet = v > 0; if (v > 0) v--; }); const used = run.res.vetements - v; run.res.vetements = v;
      const without = run.C.filter(c => !c.vet).length; card(without ? 'bad' : '', { i: 'vetements' }, 'L\'hiver arrive', `${used} vêtement${used > 1 ? 's' : ''} distribué${used > 1 ? 's' : ''}.${without ? ` ${without} colon${without > 1 ? 's' : ''} sans vêtement : ${without > 1 ? 'ils auront' : 'il aura'} froid.` : ''}`); }
    const h = housing(run), homes = [...new Set(h.where.values())].sort((a, b) => HEAT[a.type] - HEAT[b.type]), heated = new Set(); let burnt = 0;
    homes.forEach(b => { if (run.res.bois >= HEAT[b.type]) { run.res.bois -= HEAT[b.type]; burnt += HEAT[b.type]; heated.add(b); } });
    run.C.forEach(c => { const home = h.where.get(c.id); let cold = !home || !heated.has(home) ? 2 : home.type === 'tente' ? 1 : 0; if (!c.vet) cold++;
      if (cold) { c.froid += cold >= 2 ? cold - (healer ? 1 : 0) : 1; coldN++; } else c.froid = Math.max(0, c.froid - 1); });
    card(heated.size < homes.length ? 'bad' : '', { i: 'bois' }, 'Chauffage', `Les maisons ont brûlé ${burnt} bois.${heated.size < homes.length ? ' Il n\'y en avait pas assez pour tout le monde !' : ''} Il en reste ${Math.floor(run.res.bois)}.`);
  } else run.C.forEach(c => { c.froid = Math.max(0, c.froid - 2); });
  const wearW = run.C.filter(c => c.post !== null && c.post !== 'ecl').length; run.wear += wearW * .05;
  const worn = Math.floor(run.wear); if (worn) { run.wear -= worn; run.res.outils = Math.max(0, run.res.outils - worn); }
  // 5. bonheur, âges
  const mood = moodParts(run, { kinds, hungry, cold: coldN });
  run.happy = Math.round(run.happy + (mood.target - run.happy) * .35);
  run.blues = Math.max(0, run.blues - 2);
  run.C.filter(c => c.age === 'enfant').forEach(c => { c.grow++; if (c.grow >= ADULT_AT) { c.age = 'adulte'; c.years = 16; card('good', { c: c.id }, `${c.n} a grandi`, `${c.n} est maintenant adulte et peut travailler.`); } });
  // 6. la nature (étape 3 : crue, incendie, hiver rude, épidémie…)
  // 7. départs et arrivées (pas de morts : on quitte l'île)
  const leave = (c, why) => { run.C.splice(run.C.indexOf(c), 1); run.stats.left++; run.blues += 6; card('bad', { c: c.id, face: { ...c } }, `${c.n} est parti${c.long ? 'e' : ''}`, why); };
  // au plus un départ par la faim et un par le froid chaque semaine (le plus éprouvé d'abord) ; les enfants ne partent jamais seuls
  const grown = () => run.C.filter(c => c.age !== 'enfant'), worst = k => grown().sort((a, b) => b[k] - a[k] || (b.car === 'raleur') - (a.car === 'raleur'))[0];
  const fc = worst('faim'); if (fc && fc.faim >= STARVE + (healer ? 1 : 0)) leave(fc, `${fc.n} avait trop faim : ${fc.long ? 'elle' : 'il'} a quitté l'île sur un radeau de fortune.`);
  const cc = worst('froid'); if (cc && cc.froid >= FREEZE + (healer ? 1 : 0)) leave(cc, `${cc.n} avait trop froid : ${cc.long ? 'elle' : 'il'} est parti${cc.long ? 'e' : ''} sur un radeau vers des terres plus chaudes.`);
  run.low = run.happy < 30 ? run.low + 1 : 0;
  if (run.low >= 3 && grown().length) { const c = grown().sort((a, b) => (b.car === 'raleur') - (a.car === 'raleur') || (b.car === 'peureux') - (a.car === 'peureux'))[0];
    leave(c, `${c.n} en avait assez de la vie sur l'île : ${c.long ? 'elle' : 'il'} est parti${c.long ? 'e' : ''} sur un radeau de fortune.`); run.low = 1; }
  const h2 = housing(run), houseBeds = count(run, 'habitation') * 4, adults = run.C.filter(c => c.age === 'adulte').length;
  const kids = run.C.filter(c => c.age === 'enfant').length;
  if (run.happy >= 55 && adults >= 2 && kids < adults / 2 && date.season !== 3 && h2.beds > run.C.length && houseBeds > 0 && foodTotal(run) >= eaters(run) * 4
    && H(run.seed, run.turn, 101) < Math.min(.15, .03 * Math.min(count(run, 'habitation'), adults / 2))) {
    const k = H(run.seed, run.turn, 102) < .5, n = freshName(run, 1), nm = NAMES.find(([a]) => a === n);
    const c = newColon(run, n, null, Object.keys(CAR)[(H(run.seed, run.turn, 103) * 6) | 0], 'enfant', 0); c.long = nm ? nm[1] : k ? 1 : 0; run.C.push(c); run.stats.born++;
    card('good', { c: c.id }, 'Une naissance !', `Bienvenue à ${c.n}. ${c.long ? 'Elle' : 'Il'} jouera au village, puis travaillera dans 2 ans.`);
  }
  if (date.week === 1 && date.season < 3 && run.happy >= 60 && h2.beds - run.C.length >= 2 && run.B.some(b => b.done && b.type === 'port') && H(run.seed, run.turn, 111) < .6) {
    const n = 2 + (H(run.seed, run.turn, 112) < .4 ? 1 : 0), names = [];
    for (let k = 0; k < n; k++) { const c = newColon(run, freshName(run, 20 + k), Object.keys(TAL)[(H(run.seed, run.turn, 113 + k) * 8) | 0], Object.keys(CAR)[(H(run.seed, run.turn, 120 + k) * 6) | 0], 'adulte', 20 + ((H(run.seed, run.turn, 130 + k) * 25) | 0)); run.C.push(c); names.push(c.n); }
    run.stats.arrived += n; card('good', { i: 'colons' }, 'Un bateau au port', `${names.join(', ')} ont entendu parler de la colonie et s'installent.`);
  }
  // fin de la semaine : récolte des champs (fin de l'été), fin d'année, grandes étapes
  run.turn++;
  const nd = dateOf(run);
  if (nd.season !== date.season) {
    run.B.filter(b => b.done && b.type === 'champ').forEach(b => {
      if (nd.season === 2) b.ripe = Math.round((b.sown || 0) * 2.5 * fert(run, b));
      if (nd.season === 3) { if (b.ripe) card('bad', { b: 'champ' }, 'Récolte perdue', `${b.ripe} ${RESNAME[b.crop || 'cereales']} pourrissent sous la neige : il fallait récolter à l'automne.`); b.ripe = 0; b.sown = 0; }
    });
    run.B.filter(b => b.done && b.type === 'chasseur').forEach(b => { b.game = Math.min(gameCap(run, b), (b.game ?? 0) + 12); });
    card('', { s: nd.season }, `${['Le printemps', 'L\'été', 'L\'automne', 'L\'hiver'][nd.season]} arrive`, ['On sème les champs. La rivière va bientôt monter.', 'Les récoltes poussent. Les baies sont au plus haut.', 'On récolte les champs et on prépare le bois de l\'hiver.', 'Rien ne pousse. Il faut chauffer les maisons.'][nd.season]);
  }
  if (nd.season !== 3) { for (let i = 0; i < MW * MH; i++) { const m = WOOD_MAX(I.t[i]); if (m && run.wood[i] < m && H(run.seed, run.turn, i, 7) < .35) run.wood[i]++; } }
  if (nd.year !== date.year) {
    const ret = [], gone = [];
    run.C.forEach(c => { if (c.age === 'enfant') return; c.years++; if (c.age === 'adulte' && c.years >= RETIRE_AT) { c.age = 'ancien'; c.post = null; ret.push(c.n); } });
    run.C.filter(c => c.age === 'ancien' && c.years >= RETIRE_AT + 6).forEach(c => { if (H(run.seed, run.turn, c.id, 5) < .4) { run.C.splice(run.C.indexOf(c), 1); gone.push(c.n); } });
    if (ret.length) card('', { i: 'colons' }, 'À la retraite', `${ret.join(', ')} ${ret.length > 1 ? 'prennent' : 'prend'} sa retraite : plus de travail, mais de bons conseils au village.`);
    if (gone.length) card('', { i: 'colons' }, 'Un dernier voyage', `${gone.join(', ')} ${gone.length > 1 ? 'sont partis' : 'est parti'} finir ses vieux jours chez les siens, sur le continent.`);
    card('good', { i: 'joie' }, `An ${date.year} terminé`, `${run.C.length} colons, ${run.stats.built} bâtiments construits, bonheur ${run.happy}.`);
    if (date.year === 1) bonus(run, 10, 'Premier hiver traversé', card);
  }
  [[12, 10], [20, 15], [30, 20], [45, 25]].forEach(([n, pts]) => { if (run.C.length >= n && !run.milestones.includes('pop' + n)) { run.milestones.push('pop' + n); bonus(run, pts, `${n} colons !`, card); } });
  run.stats.maxPop = Math.max(run.stats.maxPop, run.C.length); run.stats.happySum += run.happy; run.stats.weeks++;
  if (run.C.length && !grown().length) { const n = run.C.length; run.C.length = 0; run.stats.left += n; card('bad', { i: 'colons' }, 'Les enfants s\'en vont', `Sans adulte pour s'occuper d'eux, ${n > 1 ? 'les enfants ont été recueillis' : 'le dernier enfant a été recueilli'} par un bateau de passage.`); }
  if (!run.C.length) { run.over = true; card('bad', { i: 'colons' }, 'L\'île est déserte', 'Le dernier colon est parti. La colonie a tenu ' + yearsHeld(run) + ' an' + (yearsHeld(run) > 1 ? 's' : '') + '.'); }
  return { rep, floats };
}
const chGain = (run, b) => Math.round(workers(run, b.id).reduce((a, c) => a + 3 * eff(c, 'chantier'), 0) * toolF(run) * (dateOf(run).season === 3 ? .75 : 1));
function bonus(run, pts, why, card) { run.res.savoir = Math.round((run.res.savoir + pts) * 10) / 10; card('sci', { i: 'savoir' }, why, `+${pts} points de savoir pour la recherche.`); }
function found(run, l, card) {
  const L = LIEUX[l.k];
  if (l.k === 'ruines') { const o = 6 + ((H(run.seed, l.id, 3) * 5) | 0), pl = l.id > 3 ? 8 : 0; run.res.outils += o; run.res.planches += pl; run.res.savoir += 10;
    card('good', { l: l.k }, 'Des ruines !', `Un ancien village : ${o} outils rouillés${pl ? `, ${pl} planches` : ''} et des carnets (+10 savoir).`); return; }
  if (l.k === 'epave') { const names = []; for (let k = 0; k < 2; k++) { const c = newColon(run, freshName(run, 40 + k), Object.keys(TAL)[(H(run.seed, l.id, 50 + k) * 8) | 0], Object.keys(CAR)[(H(run.seed, l.id, 60 + k) * 6) | 0], 'adulte', 22 + ((H(run.seed, l.id, 70 + k) * 20) | 0)); run.C.push(c); names.push(c.n); }
    run.res.vetements += 6; run.res.bois += 10; run.stats.arrived += 2; run.res.savoir += 5;
    card('good', { l: l.k }, 'Une autre épave !', `${names.join(' et ')} y survivaient depuis des mois : ils rejoignent la colonie (avec 6 vêtements et 10 bois).`); return; }
  run.res.savoir += 5; card('good', { l: l.k }, `${L.n} découvert${l.k === 'source' || l.k === 'grotte' ? 'e' : ''}`, `${L.d} (+5 savoir)`);
}
const yearsHeld = run => Math.floor(run.turn / 16);
const scoreOf = run => yearsHeld(run) * 100 + run.stats.maxPop * 10 + run.stats.built + Math.round(run.stats.weeks ? run.stats.happySum / run.stats.weeks : run.happy);
function migrate(r) {
  if (!r || typeof r !== 'object' || r.kind !== 'colonie' || typeof r.v !== 'number' || r.v > RUN_V) return null;
  const ok = Array.isArray(r.B) && Array.isArray(r.C) && Array.isArray(r.seen) && r.seen.length === MW * MH && Array.isArray(r.wood) && r.res && typeof r.turn === 'number';
  return ok ? r : null;
}

const ILE_API = { MW, MH, T, TNAME, BUILD, ORDER, START, TREE, BRANCHES, FOODS, PROD, LIEUX, TAL, CAR, SEASONS, RESNAME, RUN_V, H, makeIsle, newRun, dateOf, isleOf, terrOk, buildOptions,
  placeBuilding, cancelBuilding, demolish, workers, maxOf, keyOf, nameOf, eff, freeWorkers, addWorker, removeWorker, moveColon, posts, production, forecast, alerts, moodParts,
  housing, heatNeed, researchState, research, endWeek, chGain, scoreOf, yearsHeld, migrate, foodTotal, eaters, matCap, foodCap, unlocked, woodAround, gameCap, onFilon, bAt, pickTarget };
if (typeof module !== 'undefined') module.exports = ILE_API;

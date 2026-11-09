/* Terres franches : la carte de l'ère 1 (la vallée), les terrains à bâtir, l'emplacement proposé et les routes. Sans dessin, aussi sous Node.
   Une case = 32 px (T) ; les images du pack gardent leur taille (une maison de 96 px tient sur un terrain de 3 × 3 cases).
   GRILLE : T forêt, . herbe, * buisson, ~ eau, F feu de camp, ^ tente du pionnier,
            lettres minuscules = terrains à bâtir (« terre », 3 × 3), X Y = rochers (carrières), P Q = rives (pontons).
   proposer(S, b) : le terrain le plus logique pour b (affinités `pres` de donnees.js) ; routes(S) : les rues, tracées dans l'ordre
   de construction, de la porte de chaque bâtiment vers la rue ou la place la plus proche (elles se rejoignent toutes seules). */
(function(){
"use strict";
const DON = (typeof module !== "undefined" && module.exports) ? require("./donnees.js") : window.TerresDonnees;
const T = 32;
const GRILLE = [
  "TTTTTTTTTTTTTTTTTTT~~TTT",
  "TTTTTTTT.nnn.TXXTTT~~TTT",
  "TTTTTTTT.nnn.TXXTTT~~TTT",
  "TTTTTTTT*nnnTT..YY.~~.TT",
  "TTTTT*..........YY.~~.TT",
  "TTTT*.....bbb......~~.TT",
  "TTTT..aaa.bbb.ccc...~~TT",
  "TTTT..aaa.bbb.ccc...~~TT",
  "TTTT..aaa.....ccc...~~TT",
  "TT.T.....^.........P~~TT",
  "TT.*.ddd...F...eee..~~TT",
  "TT...ddd.......eee..~~TT",
  "TT..*ddd.......eee.~~.TT",
  "TT..*..............~~.TT",
  "TT....fff..ggg.hhh.~~.TT",
  "TTiii.fff..ggg.hhh.~~.TT",
  "TTiii.fff..ggg.hhh.~~.TT",
  "TTiii..............~~.TT",
  "TT........lll..Q.~~~~~~~",
  "TT.jjjkkk.lll..~~~~~~~~~",
  "TT.jjjkkk.lll..~~~~~~~~~",
  "TT.jjjkkk..mmm.~~~~~~~~~",
  "TT.........mmm.~~~~~~~~~",
  "TT.........mmm.~~~~~~~~~"];
const W = GRILLE[0].length, H = GRILLE.length;
// étiquettes des terrains (servent aux affinités) : fertile = bonne terre à blé ; pre = clairière pour les moutons
const ETIQUETTES = {i: ["fertile"], j: ["fertile"], k: ["fertile"], l: ["fertile"], n: ["pre"]};
const case_ = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? "T" : GRILLE[y][x];

function cout(c){ return c === "." || c === "F" || c === "^" ? 1 : c === "*" ? 4 : c === "T" ? 14 : null; }
/* ---------- les terrains ---------- */
const LOTS = {};
let FEU = null, TENTE = null;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
  const c = GRILLE[y][x];
  if (c === "F") FEU = [x, y];
  if (c === "^") TENTE = [x, y];
  if (!/[a-zXYPQ]/.test(c)) continue;
  const L = LOTS[c] || (LOTS[c] = {id: c, x, y, l: 0, h: 0, terrain: /[a-z]/.test(c) ? "terre" : /[XY]/.test(c) ? "roche" : "rive", tags: ETIQUETTES[c] || []});
  L.l = Math.max(L.l, x - L.x + 1); L.h = Math.max(L.h, y - L.y + 1);
}
for (const L of Object.values(LOTS)){
  L.cx = L.x + L.l / 2; L.cy = L.y + L.h / 2;
  if (L.terrain === "rive"){   // la porte : la case de terre à côté ; le ponton part vers l'eau
    const v = [[-1, 0], [1, 0], [0, -1], [0, 1]], eau = v.find(([dx, dy]) => case_(L.x + dx, L.y + dy) === "~"), terre = v.find(([dx, dy]) => case_(L.x + dx, L.y + dy) === ".");
    L.vers = eau; L.porte = [L.x + terre[0], L.y + terre[1]];
  } else L.porte = [L.x + Math.floor(L.l / 2), L.y + L.h];
  // portes possibles : le milieu de chaque côté (sud d'abord : c'est là que les images ont leur porte)
  const mx = L.x + Math.floor(L.l / 2), my = L.y + Math.floor(L.h / 2);
  L.cotes = [[mx, L.y + L.h], [L.x - 1, my], [L.x + L.l, my], [mx, L.y - 1]].filter(([x, y]) => cout(case_(x, y)) !== null && cout(case_(x, y)) < 5);
  if (L.terrain !== "rive" && L.cotes.length) L.porte = L.cotes[0];
}
// la porte d'un terrain selon ce qu'on y bâtit : un champ s'ouvre du côté du feu, le reste au sud quand c'est possible
function porte(S, id){
  const L = LOTS[id], b = (S.lots || {})[id];
  if (L.terrain === "rive" || !L.cotes.length) return L.porte;
  if (b === "champ") return L.cotes.slice().sort((p, q) => Math.hypot(p[0] - FEU[0], p[1] - FEU[1]) - Math.hypot(q[0] - FEU[0], q[1] - FEU[1]))[0];
  return L.cotes[0];
}
const PLACE = (st) => 1.3 + st * 1.05;   // rayon de la place autour du feu (campement, hameau, village)
const surPlace = (x, y, st) => Math.hypot(x + .5 - FEU[0] - .5, y + .5 - FEU[1] - .5) <= PLACE(st);

/* ---------- l'emplacement proposé ---------- */
const occupant = (S, id) => (S.lots || {})[id];
function libres(S, terrain){ return Object.values(LOTS).filter(L => L.terrain === terrain && !occupant(S, L.id)).map(L => L.id); }
// distance (en cases) du terrain L à la chose k la plus proche : feu, eau, foret, logis (cabane ou maison), ou un bâtiment
function distance(S, L, k){
  if (k === "feu") return Math.hypot(L.cx - FEU[0] - .5, L.cy - FEU[1] - .5);
  if (k === "eau" || k === "foret"){
    const c = k === "eau" ? "~" : "T"; let d = 99;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (GRILLE[y][x] === c) d = Math.min(d, Math.hypot(x + .5 - L.cx, y + .5 - L.cy));
    return d;
  }
  const BAT = DON.BATIMENTS, veut = b => k === "logis" ? !!(BAT[b] && BAT[b].logement) : b === k;
  let d = null;
  for (const id in S.lots || {}) if (id !== L.id && veut(S.lots[id])){ const M = LOTS[id]; const e = Math.hypot(M.cx - L.cx, M.cy - L.cy); d = d === null ? e : Math.min(d, e); }
  return d;   // null : il n'y en a pas encore
}
function score(S, b, id){
  const L = LOTS[id], pres = (DON.BATIMENTS[b] && DON.BATIMENTS[b].pres) || {feu: 1}; let s = 0;
  for (const k in pres){
    if (L.tags.includes(k)){ s += pres[k]; continue; }
    if (["fertile", "pre"].includes(k)) continue;
    const d = distance(S, L, k); if (d === null) continue;
    s += pres[k] / (1 + d / 3);
  }
  return s;
}
// le terrain proposé pour b (null s'il n'y en a plus)
function proposer(S, b){
  const B = DON.BATIMENTS[b]; if (!B) return null;
  let best = null, bs = -1e9;
  for (const id of libres(S, B.terrain)){ const s = score(S, b, id); if (s > bs + 1e-9){ bs = s; best = id; } }
  return best;
}

/* ---------- les chemins ---------- */
// coût d'une case pour une route (ou un villageois) ; les terrains bâtis ne se traversent pas, sauf leur porte
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// A* sur la grille ; deja = cases de route (moins chères) ; but(x, y) = fin ; tourner coûte un peu (rues droites)
function chercher(dep, but, deja, eviter){
  const cle = (x, y, d) => (y * W + x) * 5 + d, ouv = [[0, dep[0], dep[1], 4, 0]], g = new Map(), de = new Map();
  g.set(cle(dep[0], dep[1], 4), 0);
  const h = (x, y) => 0;   // pas d'heuristique : les buts sont nombreux (toute la route)
  while (ouv.length){
    let bi = 0; for (let i = 1; i < ouv.length; i++) if (ouv[i][0] < ouv[bi][0]) bi = i;
    const [f, x, y, d, gc] = ouv.splice(bi, 1)[0];
    if (gc > g.get(cle(x, y, d))) continue;
    if (but(x, y) && !(x === dep[0] && y === dep[1])){
      const ch = [[x, y]]; let k = cle(x, y, d); while (de.has(k)){ k = de.get(k); const n = Math.floor(k / 5); ch.push([n % W, Math.floor(n / W)]); }
      return ch.reverse();
    }
    for (let nd = 0; nd < 4; nd++){
      const nx = x + DIRS[nd][0], ny = y + DIRS[nd][1]; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const c = GRILLE[ny][nx], estBut = but(nx, ny);
      let k = deja.has(ny * W + nx) ? .35 : cout(c);
      if (/[a-zXYPQ]/.test(c) && !estBut) k = null;
      if (eviter && eviter.has(ny * W + nx) && !estBut) k = null;
      if (k === null) continue;
      const ng = gc + k + (d !== 4 && d !== nd ? .6 : 0), kk = cle(nx, ny, nd);
      if (!g.has(kk) || ng < g.get(kk)){ g.set(kk, ng); de.set(kk, cle(x, y, d)); ouv.push([ng + h(nx, ny), nx, ny, nd, ng]); }
    }
  }
  return null;
}
// les rues : liste de tracés (cases), dans l'ordre de construction ; st = statut (taille de la place)
function routes(S){
  const ordre = S.ordreLots || Object.keys(S.lots || {}), deja = new Set(), traces = [], bati = new Set();
  for (const id of ordre){ const L = LOTS[id]; for (let y = L.y; y < L.y + L.h; y++) for (let x = L.x; x < L.x + L.l; x++) bati.add(y * W + x); }
  for (const id of ordre){
    const L = LOTS[id]; if (!L) continue;
    const p = porte(S, id), fin = (x, y) => surPlace(x, y, S.statut || 0) || deja.has(y * W + x);
    if (fin(p[0], p[1])){ traces.push({id, cases: [p]}); deja.add(p[1] * W + p[0]); continue; }
    const ch = chercher(p, fin, deja, bati);
    if (!ch) continue;
    for (const [x, y] of ch) deja.add(y * W + x);
    traces.push({id, cases: ch});
  }
  return {traces, cases: deja};
}

/* ---------- où travaillent les villageois ---------- */
// cases de travail d'un métier (les plus proches du feu d'abord) : lisière pour les bûcherons, buissons, rive, ou le bâtiment
function postes(S, m){
  const M = DON.METIERS[m], res = [];
  const pres = (x, y) => Math.hypot(x - FEU[0], y - FEU[1]);
  const voisin = (x, y, c) => DIRS.some(([dx, dy]) => case_(x + dx, y + dy) === c);
  if (m === "bucheron"){ for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (GRILLE[y][x] === "." && voisin(x, y, "T")) res.push([x, y]); }
  else if (m === "cueilleur"){   // devant le buisson (au sud de préférence, sinon à côté) : jamais dedans
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (GRILLE[y][x] === "*"){ const c = [[0, 1], [-1, 0], [1, 0], [0, -1]].map(([dx, dy]) => [x + dx, y + dy]).find(([u, v]) => case_(u, v) === "."); if (c) res.push(c); }
  }
  else if (m === "pecheur"){
    for (const id in S.lots || {}) if (S.lots[id] === "ponton" && (S.bat || {}).ponton) res.push([LOTS[id].x, LOTS[id].y], [LOTS[id].x, LOTS[id].y]);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (GRILLE[y][x] === "." && voisin(x, y, "~")) res.push([x, y]);
  } else {
    const bats = Object.keys(M.places).filter(b => b !== "base");
    for (const id in S.lots || {}) if (bats.includes(S.lots[id])){ const L = LOTS[id]; const p = porte(S, id); res.push([p[0], p[1], id]); }
  }
  return res.sort((a, b) => pres(a[0], a[1]) - pres(b[0], b[1]));
}

const api = {T, W, H, GRILLE, LOTS, FEU, TENTE, ETIQUETTES, case_, PLACE, surPlace, libres, proposer, score, porte, routes, chercher, postes, cout};
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.TerresCarte = api;
})();

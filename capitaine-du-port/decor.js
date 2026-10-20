/* Capitaine du port : le dessin (pixel art 32 bits, repris de la maquette validée maquettes/capitaine-du-port.html,
   elle-même reprise de la scène « port » de la planche des coups de cœur).
   La scène se dessine dans une toile de 216 px de large (hauteur selon l'écran, 384 au moins), agrandie ensuite
   sans lissage par jeu.js ; les textes sont écrits par jeu.js sur la toile fine.
   CapDecor.geo(w, sortie, VH) : la géométrie d'un bassin ; CapDecor.fond(G, port) : le décor fixe (une fois par bassin) ;
   CapDecor.sprites(N, port) : les sprites des bateaux ; CapDecor.scene(g, G, bat, tug, lt) : une image. */
(function () {
"use strict";
const OUT = "#120c16", TAU = Math.PI * 2, VW = 216;

function mk(w, h){ const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.imageSmoothingEnabled = false; return [c, g]; }
function rnd(seed){ return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function hex2(c){ const v = parseInt(c.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; }
function mix(a, b, f){ const A = hex2(a), B = hex2(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * f).toString(16).padStart(2, "0")).join(""); }
function plate(g, x, y, w, h){
  R(g, x + 2, y - 2, w - 4, h + 4, OUT); R(g, x - 2, y + 2, w + 4, h - 4, OUT); R(g, x, y, w, h, OUT);
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "rgba(48,70,104,.94)"); gr.addColorStop(1, "rgba(14,22,38,.94)");
  g.fillStyle = gr; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  R(g, x + 2, y + 1, w - 4, 1, "rgba(160,200,240,.55)"); R(g, x + 1, y + 2, 1, h - 4, "rgba(160,200,240,.55)");
  R(g, x + 2, y + h - 2, w - 4, 1, "rgba(0,0,0,.45)"); R(g, x + w - 2, y + 2, 1, h - 4, "rgba(0,0,0,.45)");
}
function silhouette(img, col, grow = 0){
  const [c, g] = mk(img.width + grow * 2, img.height + grow * 2);
  for (let dy = -grow; dy <= grow; dy++) for (let dx = -grow; dx <= grow; dx++) if (Math.abs(dx) + Math.abs(dy) <= grow) g.drawImage(img, grow + dx, grow + dy);
  g.globalCompositeOperation = "source-in"; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height); return c;
}
// des boules ombrées (rochers), avec un contour
function blob(g, shapes, ramp){
  for (const [cx, cy, r] of shapes) for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++){
    const d = Math.hypot(x, y); if (d > r + 1) continue;
    if (d > r){ R(g, cx + x, cy + y, 1, 1, OUT); continue; }
    const l = (-x - y) / (r * 1.4) - (d / r) * .2;
    R(g, cx + x, cy + y, 1, 1, ramp[l > .45 ? 0 : l > -.05 ? 1 : l > -.5 ? 2 : 3]);
  }
}
function ring(g, cx, cy, r, c1, c2){
  const n = Math.max(10, Math.round(r * 6));
  for (let k = 0; k < n; k++){ const a = k / n * TAU, x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r); R(g, x, y, 1, 1, Math.cos(a) + Math.sin(a) < 0 ? c1 : c2); }
}

/* ---------- palettes (4 nuances, lumière en haut à gauche) ---------- */
const P = {
  gold:   ["#fff6c2", "#ffd23f", "#e0a020", "#9a6410"],
  cream:  ["#ffffff", "#f4ecda", "#d6c8aa", "#a8977a"],
  teak:   ["#f0c088", "#c48a52", "#9a6236", "#6a4020"],
  navy:   ["#7a9ee0", "#3458a0", "#243f78", "#16274e"],
  steel:  ["#dfe4ea", "#a3acb9", "#6f7888", "#454c5c"],
  red:    ["#ff8a76", "#e04a3c", "#a8302a", "#6e1d1d"],
  rust:   ["#eea474", "#c06a3a", "#8e4624", "#5a2a14"],
  sand:   ["#fff0b8", "#ecc878", "#c49a4c", "#8a6430"],
  teal:   ["#8ae0d0", "#3fa898", "#2c7870", "#1c4a48"],
  blue:   ["#9ad4ff", "#3f8fe0", "#2a64b0", "#1a3f7a"],
  orange: ["#ffc274", "#f08a28", "#c05e14", "#7a3a0c"],
  green:  ["#b8e27c", "#6fae45", "#457f2e", "#2a5220"],
  black:  ["#5e5870", "#3a3548", "#262233", "#17131e"],
  glass:  ["#e0f8ff", "#7ccaf0", "#3a86c0", "#22507a"],
  white:  ["#ffffff", "#eef2f6", "#c8d0dc", "#8e98aa"],
  yellow: ["#fff2a8", "#ffd23f", "#d09a1c", "#8f6410"],
  pink:   ["#ffc0d8", "#f07aa8", "#c04e7e", "#80304e"],
};

/* ---------- petit moteur de sprites vus du dessus ---------- */
function Buf(w, h){
  const col = new Array(w * h).fill(null);
  const B = {w, h, col,
    shape(ins, ramp, o = {}){
      const m = new Uint8Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (ins(x + .5, y + .5)) m[y * w + x] = 1;
      const M = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x] === 1;
      if (o.shadow){
        const sh = new Uint8Array(w * h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) for (let k = 1; k <= o.shadow; k++){ const xx = x + k, yy = y + k; if (xx < w && yy < h && !M(xx, yy)) sh[yy * w + xx] = 1; }
        for (let i = 0; i < w * h; i++) if (sh[i] && col[i] && col[i] !== OUT) col[i] = mix(col[i], "#10102a", .38);
      }
      if (o.outline) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
        if (M(x, y)) continue;
        if (M(x - 1, y) || M(x + 1, y) || M(x, y - 1) || M(x, y + 1)) col[y * w + x] = OUT;
      }
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
        if (!m[y * w + x]) continue;
        const tl = !M(x - 1, y) || !M(x, y - 1), br = !M(x + 1, y) || !M(x, y + 1);
        let k = o.flat ? 1 : o.inset ? (tl ? 2 : br ? 0 : 1) : (br ? 2 : tl ? 0 : 1);
        if (o.tex) k = o.tex(x + .5, y + .5, k);
        if (k < 0) continue;
        col[y * w + x] = typeof k === "string" ? k : ramp[Math.max(0, Math.min(3, k))];
      }
      return B;
    },
    toCanvas(){
      const [c, g] = mk(w, h), img = g.createImageData(w, h);
      for (let i = 0; i < w * h; i++) if (col[i]){ const [r, gg, b] = hex2(col[i]); img.data.set([r, gg, b, 255], i * 4); }
      g.putImageData(img, 0, 0); return c;
    }};
  return B;
}

/* ---------- les bateaux (a le long du bateau : 0 = poupe, L = proue ; dir = direction de la proue) ---------- */
const PAD = 2;
function hullHW(L, W, bow, stern = 3, pow = 1.6){
  return a => {
    if (a < 0 || a > L) return -1;
    let h = W / 2;
    if (a > L - bow){ const t = (a - (L - bow)) / bow; h *= Math.pow(Math.max(0, 1 - Math.pow(t, pow)), .55); }
    if (a < stern){ const t = (stern - a) / stern; h -= stern * (1 - Math.sqrt(Math.max(0, 1 - t * t))); }
    return h;
  };
}
// ECH : rapport entre la case de 30 px pour laquelle les bateaux sont dessinés et la case du bassin (26 px en 7 × 7)
let ECH = 1;
function makeBoat(dir, L, W, build){
  const k = ECH, horiz = dir === "E" || dir === "W", bw = Math.round((horiz ? L : W) / k) + PAD * 2, bh = Math.round((horiz ? W : L) / k) + PAD * 2;
  const B = Buf(bw, bh);
  const loc = (x, y) => {
    x = (x - PAD) * k; y = (y - PAD) * k;
    if (dir === "E") return [x, y - W / 2];
    if (dir === "W") return [L - x, y - W / 2];
    if (dir === "N") return [L - y, x - W / 2];
    return [y, W / 2 - x];
  };
  const api = {
    S(f, ramp, o = {}){ const o2 = Object.assign({}, o); if (o.ltex) o2.tex = (x, y, k) => o.ltex(...loc(x, y), k); B.shape((x, y) => f(...loc(x, y)), ramp, o2); },
    box: (a0, a1, b0, b1) => (a, b) => a >= a0 && a <= a1 && b >= b0 && b <= b1,
    circ: (ac, bc, r) => (a, b) => (a - ac) ** 2 + (b - bc) ** 2 <= r * r,
  };
  build(api);
  return B.toCanvas();
}
function hullDeck(A, hw, hull, deck, deckTex){
  A.S((a, b) => Math.abs(b) <= hw(a), hull, {outline: true});
  A.S((a, b) => a >= 2 && Math.abs(b) <= hw(a) - 2, deck, {inset: true, ltex: deckTex});
}
const planks = (a, b, k) => (Math.floor(b + 40) % 3 === 0 ? Math.max(k, 2) : (Math.floor(a + Math.floor(b + 40) * 7) % 13 === 0 ? 2 : k));

const boatGold = dir => makeBoat(dir, 54, 20, A => {
  const hw = hullHW(54, 20, 18, 4, 1.5);
  hullDeck(A, hw, P.gold, P.teak, planks);
  A.S((a, b) => Math.abs(b) <= hw(a) - 1 && Math.abs(b) > hw(a) - 2 && a > 3, P.red, {flat: true});
  A.S(A.box(12, 34, -6, 6), P.white, {outline: true, shadow: 2});
  A.S(A.box(14, 32, -4, 4), P.cream, {});
  A.S((a, b) => A.box(12, 34, -6, 6)(a, b) && (a > 32 || (Math.abs(b) > 5 && Math.floor(a) % 3 !== 0)), P.glass, {flat: true});
  A.S(A.circ(20, 0, 3.2), P.red, {outline: true, shadow: 1});
  A.S(A.circ(20, 0, 1.4), P.black, {flat: true});
  A.S(A.circ(28, 0, 1.5), P.steel, {outline: true});
  A.S((a, b) => { const da = a - 43, r = Math.hypot(da, b), th = Math.atan2(b, da); return r < 2.2 + 1.6 * Math.cos(5 * th) ** 2 && r < 3.6; }, P.yellow, {outline: true});
  A.S(A.circ(6, 0, 2), P.steel, {outline: true});
});
const boatCargo = dir => makeBoat(dir, 84, 24, A => {
  const hw = hullHW(84, 24, 20, 4, 1.4);
  hullDeck(A, hw, P.navy, P.steel, (a, b, k) => (Math.floor(a) % 6 === 0 ? 2 : k));
  const cols = [P.red, P.blue, P.green, P.orange, P.teal, P.yellow, P.red, P.green, P.blue, P.orange];
  let n = 0;
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]){
    const a0 = 15 + i * 10, b0 = s < 0 ? -9 : 1;
    A.S(A.box(a0, a0 + 8, b0, b0 + 7), cols[n++ % cols.length], {outline: true, shadow: 1, ltex: (a, b, k) => (k === 1 && Math.floor(a) % 2 === 0 ? 2 : k)});
  }
  A.S(A.box(2, 11, -10, 10), P.white, {outline: true, shadow: 2});
  A.S((a, b) => A.box(2, 11, -10, 10)(a, b) && a > 10 && Math.floor(b + 20) % 3 !== 0, P.glass, {flat: true});
  A.S(A.circ(5, 0, 3), P.orange, {outline: true, shadow: 1});
  A.S(A.circ(5, 0, 1.5), P.black, {flat: true});
  for (const s of [-4, 4]) A.S(A.circ(72, s, 1.8), P.steel, {outline: true});
});
const boatBarge = dir => makeBoat(dir, 54, 22, A => {
  const hw = hullHW(54, 22, 6, 4, 2.5);
  hullDeck(A, hw, P.rust, P.rust, null);
  A.S(A.box(6, 48, -7, 7), P.black, {inset: true});
  A.S((a, b) => ((a - 27) / 20) ** 2 + (b / 6.4) ** 2 <= 1, P.sand, {ltex: (a, b, k) => {
    if (Math.abs(b + .5) < .8 && Math.abs(a - 27) < 16) return 0;
    return hash(Math.floor(a * 3), Math.floor(b * 5)) < .12 ? Math.min(3, k + 1) : (b > 2 ? Math.max(k, 2) : k); }});
  for (const s of [-8.5, 8.5]) for (const a of [3, 51]) A.S(A.circ(a, s, 1.2), P.steel, {outline: true});
});
const boatFerry = dir => makeBoat(dir, 84, 24, A => {
  const hw = hullHW(84, 24, 16, 4, 1.6);
  hullDeck(A, hw, P.blue, P.white, null);
  A.S((a, b) => a > 2 && a < 11 && Math.abs(b) < 8 && Math.floor(b + 20) % 4 === 0, P.yellow, {flat: true});
  A.S(A.box(12, 68, -9, 9), P.white, {outline: true, shadow: 2});
  A.S((a, b) => A.box(12, 68, -9, 9)(a, b) && (Math.abs(b) > 8 || a > 67) && Math.floor(a) % 3 !== 0, P.glass, {flat: true});
  A.S(A.box(15, 64, -6, 6), P.cream, {});
  for (const a0 of [18, 50]) for (const s of [-1, 1]) A.S(A.box(a0, a0 + 9, s < 0 ? -7 : 4, s < 0 ? -4 : 7), P.orange, {outline: true, shadow: 1});
  A.S(A.box(36, 44, -3, 3), P.blue, {outline: true, shadow: 2});
  A.S(A.box(36, 44, -1, 1), P.white, {flat: true});
  A.S(A.circ(72, 0, 2), P.red, {outline: true});
});
const boatFisher = (dir, hull, roof) => makeBoat(dir, 54, 18, A => {
  const hw = hullHW(54, 18, 18, 4, 1.4);
  hullDeck(A, hw, hull, P.teak, planks);
  A.S(A.box(4, 11, -6, 6), P.green, {outline: true, shadow: 1, ltex: (a, b, k) => (Math.floor(a) % 2 ? Math.max(1, k) : 2)});
  A.S(A.box(26, 36, -5, 5), roof, {outline: true, shadow: 2});
  A.S((a, b) => A.box(26, 36, -5, 5)(a, b) && a > 35, P.glass, {flat: true});
  A.S(A.box(15, 20, -6, -2), P.blue, {outline: true, shadow: 1});
  A.S(A.box(15, 20, 2, 6), P.white, {outline: true, shadow: 1});
  A.S((a, b) => A.box(16, 19, 3, 5)(a, b) && (Math.floor(a) + Math.floor(b)) % 2 === 0, P.steel, {flat: true});
  for (const s of [-5, 5]) A.S(A.circ(41, s, 1.6), P.orange, {outline: true});
  A.S(A.circ(31, 0, 1.4), P.steel, {outline: true});
});
const boatSail = dir => makeBoat(dir, 54, 16, A => {
  const hw = hullHW(54, 16, 24, 4, 1.3);
  hullDeck(A, hw, P.white, P.teak, planks);
  A.S(A.box(4, 15, -4, 4), P.teak, {inset: true});
  A.S(A.box(17, 31, -4.5, 4.5), P.cream, {outline: true, shadow: 1});
  A.S(A.box(12, 34, -1.2, 1.2), P.blue, {outline: true, shadow: 2});
  A.S(A.circ(34, 0, 1.6), P.steel, {outline: true});
  A.S(A.circ(47, 0, 1), P.steel, {outline: true});
});
const boatPilot = dir => makeBoat(dir, 54, 18, A => {
  const hw = hullHW(54, 18, 16, 5, 1.6);
  A.S((a, b) => Math.abs(b) <= hw(a), P.black, {outline: true});
  A.S((a, b) => a >= 2 && Math.abs(b) <= hw(a) - 2, P.orange, {});
  A.S((a, b) => a >= 4 && Math.abs(b) <= hw(a) - 4, P.steel, {inset: true});
  A.S(A.box(18, 36, -6, 6), P.white, {outline: true, shadow: 2});
  A.S((a, b) => A.box(18, 36, -6, 6)(a, b) && a > 35, P.glass, {flat: true});
  A.S(A.box(21, 31, -3, 3), P.orange, {});
  A.S(A.circ(26, 0, 1.2), P.blue, {flat: true});
});
const boatPeniche = dir => makeBoat(dir, 84, 20, A => {
  const hw = hullHW(84, 20, 9, 5, 2.2);
  hullDeck(A, hw, P.black, P.teak, planks);
  A.S(A.box(18, 66, -6, 6), P.green, {outline: true, shadow: 2, ltex: (a, b, k) => (Math.floor(a) % 4 === 0 ? 3 : Math.abs(b) < 1 ? 0 : k)});
  A.S(A.box(4, 14, -7, 7), P.white, {outline: true, shadow: 2});
  A.S(A.box(5, 13, -5, 5), P.red, {});
  A.S((a, b) => A.box(4, 14, -7, 7)(a, b) && a > 13, P.glass, {flat: true});
  for (let i = 0; i < 4; i++) for (const s of [-7.5, 7.5]) A.S(A.circ(69 + i * 3, s, 1.3), i % 2 ? P.pink : P.yellow, {outline: true});
  A.S(A.circ(75, 0, 2.3), P.green, {outline: true});
});
const boatTug = dir => makeBoat(dir, 24, 16, A => {
  const hw = hullHW(24, 16, 9, 4, 2);
  A.S((a, b) => Math.abs(b) <= hw(a) + .8, P.black, {outline: true});
  A.S((a, b) => Math.abs(b) <= hw(a) - 1.2 && a > 1.5 && a < 22.5, P.red, {});
  A.S((a, b) => a >= 3 && Math.abs(b) <= hw(a) - 3, P.steel, {inset: true});
  A.S(A.box(9, 17, -5, 5), P.white, {outline: true, shadow: 1});
  A.S((a, b) => A.box(9, 17, -5, 5)(a, b) && a > 16, P.glass, {flat: true});
  A.S(A.circ(6, 0, 2.6), P.yellow, {outline: true, shadow: 1});
  A.S(A.circ(6, 0, 1.2), P.black, {flat: true});
});


// bateaux de 4 cases : le pétrolier et le paquebot
const boatTanker = dir => makeBoat(dir, 114, 26, A => {
  const hw = hullHW(114, 26, 20, 4, 1.5);
  hullDeck(A, hw, P.rust, P.green, (a, b, k) => (Math.floor(a) % 8 === 0 ? 2 : k));
  // la conduite le long du pont et les vannes
  A.S(A.box(18, 92, -1.5, 1.5), P.steel, {outline: true, shadow: 1});
  for (const a0 of [30, 50, 70]) for (const s of [-1, 1]) A.S(A.circ(a0, s * 5, 2.2), P.red, {outline: true, shadow: 1});
  A.S(A.box(56, 62, -9, 9), P.steel, {outline: true, shadow: 1});
  // le château à la poupe
  A.S(A.box(2, 15, -11, 11), P.white, {outline: true, shadow: 2});
  A.S((a, b) => A.box(2, 15, -11, 11)(a, b) && a > 14 && Math.floor(b + 20) % 3 !== 0, P.glass, {flat: true});
  A.S(A.box(5, 10, -4, 4), P.black, {outline: true, shadow: 1});
  for (const s of [-5, 5]) A.S(A.circ(102, s, 1.8), P.steel, {outline: true});
});
const boatLiner = dir => makeBoat(dir, 114, 26, A => {
  const hw = hullHW(114, 26, 24, 5, 1.5);
  hullDeck(A, hw, P.navy, P.white, null);
  A.S(A.box(10, 90, -10, 10), P.white, {outline: true, shadow: 2});
  A.S((a, b) => A.box(10, 90, -10, 10)(a, b) && Math.abs(b) > 9 && Math.floor(a) % 3 !== 0, P.glass, {flat: true});
  A.S(A.box(13, 87, -7, 7), P.cream, {});
  A.S(A.box(56, 70, -4, 4), P.blue, {inset: true});
  for (const a0 of [24, 40]) { A.S(A.circ(a0, 0, 4.2), P.red, {outline: true, shadow: 2}); A.S(A.circ(a0, 0, 2), P.black, {flat: true}); }
  for (const a0 of [16, 32, 48, 78]) for (const s of [-1, 1]) A.S(A.box(a0, a0 + 6, s < 0 ? -12 : 10, s < 0 ? -10 : 12), P.orange, {outline: true});
  A.S(A.circ(100, 0, 2), P.gold, {outline: true});
});

/* ---------- les sprites d'un bassin : un modèle par longueur, selon le port ---------- */
const MODELES = [
  // port de pêche
  { 2: [d => boatFisher(d, P.teal, P.red), d => boatFisher(d, P.red, P.blue), boatSail, d => boatFisher(d, P.orange, P.teal), boatPilot, d => boatFisher(d, P.blue, P.yellow)],
    3: [boatPeniche, boatFerry, boatCargo] },
  // port de commerce
  { 2: [boatBarge, boatPilot, d => boatFisher(d, P.teal, P.red), boatSail, d => boatFisher(d, P.red, P.blue)],
    3: [boatCargo, boatFerry, boatPeniche] },
  // la marina : surtout des voiliers
  { 2: [boatSail, d => boatFisher(d, P.white, P.blue), boatSail, boatPilot, d => boatFisher(d, P.pink, P.teal)],
    3: [boatPeniche, boatFerry] },
  // le chantier naval
  { 2: [boatBarge, d => boatFisher(d, P.orange, P.steel), boatPilot, boatBarge],
    3: [boatCargo, boatPeniche, boatFerry], 4: [boatTanker, boatLiner] },
  // le grand port : un peu de tout
  { 2: [boatBarge, boatPilot, d => boatFisher(d, P.teal, P.red), boatSail, d => boatFisher(d, P.red, P.blue), d => boatFisher(d, P.orange, P.teal)],
    3: [boatCargo, boatFerry, boatPeniche], 4: [boatLiner, boatTanker] },
];
const CACHE = {};
function sprite(cle, fab){
  if (!CACHE[cle]){ const img = fab(); CACHE[cle] = {img, sil: silhouette(img, "rgba(6,30,48,.42)"), foam: silhouette(img, "#c8f0f4", 1)}; }
  return CACHE[cle];
}
function sprites(N, port, CS){
  const M = MODELES[Math.min(port, MODELES.length - 1)], compte = {2: 0, 3: 0, 4: 0}, e = 30 / CS;
  ECH = e;
  const res = N.bateaux.map((b, i) => {
    if (i === 0){ const s = sprite("or" + CS, () => boatGold("N")); if (!s.glow) s.glow = [silhouette(s.img, "#fff2a8", 2), silhouette(s.img, "#ffd23f", 3)]; return s; }
    const liste = M[b.n] || MODELES[4][b.n], k = compte[b.n]++ % liste.length;
    // le sens de la proue : tiré de la position, pour varier sans changer d'une partie à l'autre
    const d = b.h ? (hash(b.x, b.y) < .5 ? "E" : "W") : (hash(b.y, b.x) < .5 ? "N" : "S");
    return sprite(`${port}-${b.n}-${k}-${d}-${CS}`, () => liste[k](d));
  });
  ECH = 1;
  return res;
}
const TUG = {}, TUGSIL = {};
function remorqueur(d, CS){
  const k = d + CS;
  if (!TUG[k]){ ECH = 30 / CS; TUG[k] = boatTug(d); ECH = 1; TUGSIL[k] = silhouette(TUG[k], "rgba(6,30,48,.42)"); }
  return {img: TUG[k], sil: TUGSIL[k]};
}
// les obstacles fixes d'une case : bouée d'amarrage (marina), pieux (chantier), épave (grand port)
function obstacle(g, port, x, y, CS, k){
  const cx = x + CS / 2, cy = y + CS / 2, rr = CS * .3;
  R(g, cx - rr + 3, cy - rr + 4, rr * 2, rr * 2, "rgba(6,30,48,.35)");
  if (port === 2 || (port === 4 && k % 3 === 0)){
    // bouée d'amarrage rouge et blanche, avec son anneau
    for (let yy = -rr - 1; yy <= rr + 1; yy++) for (let xx = -rr - 1; xx <= rr + 1; xx++){
      const d = Math.hypot(xx, yy); if (d > rr + 1) continue;
      if (d > rr){ R(g, cx + xx, cy + yy, 1, 1, OUT); continue; }
      const ramp = (Math.atan2(yy, xx) + Math.PI) % (Math.PI / 2) < Math.PI / 4 ? P.red : P.white, l = (-xx - yy) / (rr * 1.4);
      R(g, cx + xx, cy + yy, 1, 1, ramp[l > .4 ? 0 : l > -.2 ? 1 : 2]);
    }
    ring(g, cx, cy, 2.5, "#dfe4ea", "#6f7888");
  } else if (port === 3 || (port === 4 && k % 3 === 1)){
    // trois pieux de bois cerclés
    for (const [dx, dy] of [[-4, -4], [4, -3], [0, 4]]){
      const px = cx + dx, py = cy + dy;
      for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++){
        const d = Math.hypot(xx, yy); if (d > 4) continue;
        R(g, px + xx, py + yy, 1, 1, d > 3.2 ? OUT : P.teak[(xx + yy < -2) ? 0 : d > 2 ? 2 : 1]);
      }
      ring(g, px, py, 2, P.teak[3], P.teak[3]);
    }
  } else {
    // épave rouillée, à moitié coulée
    for (let yy = -rr; yy <= rr; yy++) for (let xx = -rr - 2; xx <= rr + 2; xx++){
      const u = (xx + yy) / (rr * 1.4), v = (xx - yy) / (rr * .9);
      if (u * u + v * v > 1) continue;
      R(g, cx + xx, cy + yy, 1, 1, u * u + v * v > .7 ? OUT : P.rust[hash(xx + 9, yy + 9) < .3 ? 2 : (xx < 0 ? 0 : 1)]);
    }
    for (let k2 = -4; k2 <= 4; k2 += 2) R(g, cx + k2, cy - k2, 2, 1, "#2a1a10");
  }
}

/* ---------- la géométrie : le bassin au milieu, la mer en haut, le quai en bas ---------- */
function geo(w, sortie, VH){
  const CS = w === 7 ? 26 : 30, DY = Math.max(0, Math.floor((VH - 384) / 2));
  const GX = (VW - w * CS) / 2, GY = 96 + DY, BX0 = GX - 6, BX1 = GX + w * CS + 6, BY0 = GY - 6, BY1 = GY + w * CS + 6;
  const CH = {x0: GX + sortie * CS, x1: GX + sortie * CS + CS, y0: 40 + DY, y1: BY0};
  const BAT = CH.x0 >= 80 ? 14 : CH.x1 + 14;                            // la capitainerie, à l'écart de la passe
  const LH = {x: CH.x1 > 166 ? 196 : Math.max(184, BAT + 76), y: 64 + DY};   // le phare, au bout de la jetée
  const libre = x => (x < CH.x0 - 8 || x > CH.x1 + 8) && (x < BAT - 6 || x > BAT + 66) && Math.abs(x - LH.x) > 20;
  const haut = [30, 90, 160, 120].find(libre);
  const LAMPS = [[5, GY + 34], [5, GY + 144], [VW - 5, GY + 54], [VW - 5, GY + 154], [150, BY1 + 18], [206, BY1 + 18]];
  if (haut) LAMPS.push([haut, 62 + DY]);
  return {w, sortie, VH, CS, DY, GX, GY, BX0, BX1, BY0, BY1, CH, SEAY: 44 + DY, BAT, LH, LAMPS};
}

/* ---------- le décor fixe ---------- */
const WATER = ["#1c5c78", "#226c88", "#2a7c97", "#3790aa"];
const SEA = ["#163f66", "#1a4d78", "#205d8a", "#2a6f9c"];
function paving(g, VH){
  const STONE = ["#c4b8a0", "#bcb098", "#b4a890"];
  for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x++){
    const row = Math.floor(y / 12), off = Math.floor(hash(row, 5) * 24), cx = Math.floor((x + off) / 24);
    const jx = (x + off) % 24, jy = y % 12;
    let c = STONE[Math.floor(hash(cx, row) * 3)];
    if (jx === 0 || jy === 0) c = "#9a8e78";
    else if (jx === 1 || jy === 1) c = mix(c, "#fff8e8", .22);
    else if (jx === 23 || jy === 11) c = mix(c, "#5a5040", .18);
    else if (hash(x, y) < .05) c = mix(c, "#6a6050", .25);
    R(g, x, y, 1, 1, c);
  }
}
function waterPix(g, x, y, pal, shade){
  const v = Math.sin(x * .07 + Math.sin(y * .05) * 2) * .5 + Math.sin(y * .11 + x * .02) * .4 + Math.sin((x + y) * .19) * .2;
  const bay = [[0, 2], [3, 1]][y % 2][x % 2];
  const f = (v + 1.1) / 2.2 * 3 + (bay - 1.5) * .3 - shade;
  R(g, x, y, 1, 1, pal[Math.max(0, Math.min(3, Math.floor(f)))]);
}
function wallFace(g, x0, x1, y0, h){
  for (let y = 0; y < h; y++) for (let x = x0; x < x1; x++){
    const brick = Math.floor((x + (y % 4 < 2 ? 0 : 5)) / 10), j = (x + (y % 4 < 2 ? 0 : 5)) % 10 === 0 || y === 2;
    let c = y >= h - 2 ? (y === h - 1 ? "#2c3a34" : "#3f5a48") : hash(brick, y > 2 ? 1 : 0) < .5 ? "#857a68" : "#77705f";
    if (j && y < h - 2) c = "#544c40";
    if (y === 0) c = "#e8dec8";
    R(g, x, y0 + y, 1, 1, c);
  }
  R(g, x0, y0 - 1, x1 - x0, 1, OUT);
}
function coping(g, x, y, w, h){
  R(g, x, y, w, h, "#e2d8c2");
  if (w > h){ R(g, x, y + h - 1, w, 1, "#a69a84"); R(g, x, y + h, w, 1, OUT); }
  else R(g, x + w - 1, y, 1, h, "#a69a84");
}
function bollard(g, x, y){
  R(g, x - 1, y + 3, 6, 2, "rgba(30,24,16,.3)");
  R(g, x - 2, y - 1, 5, 5, OUT); R(g, x - 3, y - 3, 7, 3, OUT); R(g, x - 2, y - 4, 5, 1, OUT);
  R(g, x - 1, y, 3, 3, "#3a3548"); R(g, x - 1, y, 1, 3, "#5e5870");
  R(g, x - 2, y - 3, 5, 2, "#4a4459"); R(g, x - 1, y - 3, 2, 1, "#9a94b0");
}
function container(g, x, y, w, d, h, ramp, doors){
  R(g, x - 1, y - 1, w + 2, d + h + 2, OUT);
  for (let yy = 0; yy < d; yy++) R(g, x, y + yy, w, 1, yy === 0 ? ramp[0] : yy % 2 ? ramp[1] : mix(ramp[1], ramp[0], .4));
  R(g, x, y, 1, d, ramp[0]);
  for (let xx = 0; xx < w; xx++) R(g, x + xx, y + d, 1, h, xx % 2 ? ramp[2] : ramp[3]);
  R(g, x, y + d, w, 1, mix(ramp[2], ramp[3], .5));
  if (doors){ R(g, x + w - 7, y + d + 1, 1, h - 1, OUT); R(g, x + w - 4, y + d + 2, 1, h - 3, ramp[0]); R(g, x + w - 2, y + d + 2, 1, h - 3, ramp[0]); }
}
function crate(g, x, y){
  R(g, x - 1, y - 1, 12, 12, OUT); R(g, x, y, 10, 4, P.teak[0]); R(g, x, y + 4, 10, 6, P.teak[2]); R(g, x, y + 6, 10, 1, P.teak[3]); R(g, x + 4, y + 4, 1, 6, P.teak[3]);
}
// caisse de poissons : bois clair, poissons argentés
function fishBox(g, x, y){
  R(g, x - 1, y - 1, 18, 11, OUT); R(g, x, y, 16, 9, P.teak[1]); R(g, x + 1, y + 1, 14, 6, "#5a7088");
  for (let k = 0; k < 3; k++){ R(g, x + 2 + k * 4, y + 2 + (k % 2) * 2, 4, 2, "#dfe8f0"); R(g, x + 2 + k * 4, y + 2 + (k % 2) * 2, 1, 1, "#ffffff"); }
  R(g, x, y + 7, 16, 2, P.teak[3]);
}
// casier à homards : armature de bois et filet
function casier(g, x, y){
  R(g, x - 1, y - 1, 16, 12, OUT); R(g, x, y, 14, 10, "#2a4a58");
  for (let k = 0; k < 14; k += 3) R(g, x + k, y, 1, 10, "#c9a46a");
  R(g, x, y, 14, 1, "#e0c088"); R(g, x, y + 9, 14, 1, "#8a6a3a");
  for (let yy = 2; yy < 9; yy += 2) for (let xx = 1; xx < 14; xx += 2) R(g, x + xx, y + yy, 1, 1, "#7aa0a8");
}
function windows(G){ const b = G.BAT; return [[b + 6, 70 + G.DY], [b + 22, 70 + G.DY], [b + 48, 70 + G.DY]]; }
function buildBuilding(g, G){
  // la capitainerie, sur le quai du haut : murs crépis, volets bleus, toit d'ardoise
  const x0 = G.BAT, x1 = x0 + 60, roofY = 50 + G.DY, wallY = 66 + G.DY, groundY = 86 + G.DY;
  R(g, x0 + 4, groundY, x1 - x0, 3, "rgba(40,30,20,.3)"); R(g, x1, roofY + 8, 5, groundY - roofY - 6, "rgba(40,30,20,.3)");
  R(g, x0 - 1, roofY - 1, x1 - x0 + 2, groundY - roofY + 2, OUT);
  for (let y = wallY; y < groundY; y++) for (let x = x0; x < x1; x++) R(g, x, y, 1, 1, y === groundY - 1 ? "#b8ab90" : (hash(x, y) < .08 ? "#e8dcc4" : "#f4ead6"));
  for (const [wx, wy] of windows(G)){ R(g, wx - 1, wy - 1, 8, 9, OUT); R(g, wx, wy, 6, 7, "#3a86c0"); R(g, wx, wy, 6, 2, "#7ccaf0"); R(g, wx + 2, wy, 1, 7, "#e0f8ff"); R(g, wx - 3, wy, 2, 7, "#3458a0"); R(g, wx + 7, wy, 2, 7, "#3458a0"); }
  R(g, x0 + 33, wallY + 4, 9, 16, OUT); R(g, x0 + 34, wallY + 5, 7, 15, "#8e4624"); R(g, x0 + 34, wallY + 5, 7, 1, "#c06a3a"); R(g, x0 + 39, wallY + 12, 1, 2, "#ffd23f");
  for (let y = roofY; y < wallY; y++) for (let x = x0 - 2; x < x1 + 2; x++){
    const ry = y - roofY, row = Math.floor(ry / 3), sl = (x + (row % 2) * 3) % 6 === 0;
    let c = ry < 2 ? "#a8b4c8" : ry < 8 ? "#6f7c94" : "#56627a";
    if (ry % 3 === 2 || sl) c = mix(c, "#202838", .35);
    if (ry === 8) c = "#8a98b0";
    R(g, x, y, 1, 1, c);
  }
  R(g, x0 - 3, wallY, x1 - x0 + 6, 1, OUT); R(g, x0 - 3, roofY - 1, x1 - x0 + 6, 1, OUT); R(g, x0 - 3, roofY, 1, wallY - roofY, OUT); R(g, x1 + 2, roofY, 1, wallY - roofY, OUT);
  R(g, x0 + 48, roofY - 7, 8, 12, OUT); R(g, x0 + 49, roofY - 6, 6, 10, "#c06a3a"); R(g, x0 + 49, roofY - 6, 6, 2, "#eea474"); R(g, x0 + 53, roofY - 4, 2, 8, "#8e4624");
}
function buildLighthouse(){
  const [c, g] = mk(30, 66), cx = 15, base = 62, top = 16;
  for (let y = top; y < base; y++){
    const f = (y - top) / (base - top), hw = Math.round(5 + f * 3), band = Math.floor((y - top) / 8) % 2;
    R(g, cx - hw - 1, y, hw * 2 + 3, 1, OUT);
    for (let x = -hw; x <= hw; x++){ const s = x / hw, k = s < -.55 ? 0 : s < .25 ? 1 : s < .7 ? 2 : 3; R(g, cx + x, y, 1, 1, (band ? P.red : P.white)[k]); }
  }
  R(g, cx - 9, base - 1, 19, 4, OUT); R(g, cx - 8, base - 1, 17, 2, "#a49c8e"); R(g, cx - 8, base - 1, 6, 1, "#d6d0c4");
  R(g, cx - 2, base - 9, 5, 8, OUT); R(g, cx - 1, base - 8, 3, 7, "#3458a0"); R(g, cx - 1, 34, 3, 3, OUT); R(g, cx, 35, 1, 1, "#fff2a8");
  R(g, cx - 9, top - 2, 19, 5, OUT); R(g, cx - 8, top - 1, 17, 2, "#454c5c"); R(g, cx - 8, top - 1, 17, 1, "#a3acb9");
  for (let x = -8; x <= 8; x += 2) R(g, cx + x, top - 4, 1, 3, "#262233");
  R(g, cx - 5, top - 11, 11, 9, OUT); R(g, cx - 4, top - 10, 9, 7, "#fff2a8"); R(g, cx - 4, top - 10, 2, 7, "#ffffff"); R(g, cx + 2, top - 10, 2, 7, "#ffd23f"); R(g, cx - 1, top - 10, 1, 7, "#3a3548");
  R(g, cx - 5, top - 15, 11, 5, OUT); R(g, cx - 4, top - 14, 9, 3, P.red[1]); R(g, cx - 3, top - 14, 3, 1, P.red[0]); R(g, cx + 2, top - 13, 2, 2, P.red[2]); R(g, cx, top - 17, 1, 2, OUT);
  return c;
}
function lamp(g, x, y){
  R(g, x - 1, y - 14, 3, 15, OUT); R(g, x, y - 13, 1, 13, "#5e5870");
  R(g, x - 3, y - 18, 7, 5, OUT); R(g, x - 2, y - 17, 5, 3, "#d8d0b8");
  R(g, x - 2, y + 1, 5, 2, "rgba(30,24,16,.3)");
}
const inSea = (G, x, y) => y < G.SEAY && !(Math.hypot(x - G.LH.x, (y - G.LH.y) * 1.25) < 17);
const inChan = (G, x, y) => x >= G.CH.x0 && x < G.CH.x1 && y >= G.CH.y0 && y < G.CH.y1;
const inBasin = (G, x, y) => x >= G.BX0 && x < G.BX1 && y >= G.BY0 && y < G.BY1;

function fond(G, port, N){
  const [c, g] = mk(VW, G.VH), {GX, GY, CS, BX0, BX1, BY0, BY1, CH, SEAY, w} = G;
  paving(g, G.VH);
  for (let y = 0; y < G.VH; y++) for (let x = 0; x < VW; x++){
    if (inBasin(G, x, y) || inChan(G, x, y)){
      const sh = (y < BY0 + 5 && !inChan(G, x, y)) || (inChan(G, x, y) && y < CH.y0 + 5) ? 1.2 : (x < BX0 + 4 || (inChan(G, x, y) && x < CH.x0 + 4) ? .9 : 0);
      waterPix(g, x, y, WATER, sh);
    } else if (inSea(G, x, y)) waterPix(g, x, y, SEA, 0);
  }
  for (let y = CH.y0; y < CH.y0 + 10; y++) for (let x = CH.x0; x < CH.x1; x++) if (hash(x, y) < 1 - (y - CH.y0) / 10) waterPix(g, x, y, SEA, 0);
  // faces des quais (vues de face) et margelles
  wallFace(g, 0, CH.x0, SEAY, 6); wallFace(g, CH.x1, VW, SEAY, 6);
  wallFace(g, BX0 - 3, CH.x0, BY0 - 6, 6); wallFace(g, CH.x1, BX1 + 3, BY0 - 6, 6);
  coping(g, CH.x0 - 3, SEAY + 6, 3, BY0 - SEAY - 12); coping(g, CH.x1, SEAY + 6, 3, BY0 - SEAY - 12);
  R(g, CH.x0 - 4, SEAY + 6, 1, BY0 - SEAY - 12, OUT); R(g, CH.x1 + 3, SEAY + 6, 1, BY0 - SEAY - 12, OUT);
  coping(g, BX0 - 4, BY0 - 6, 4, BY1 - BY0 + 10); coping(g, BX1, BY0, 3, BY1 - BY0);
  coping(g, BX0 - 4, BY1, BX1 - BX0 + 7, 3);
  R(g, BX0 - 1, BY0, 1, BY1 - BY0, OUT); R(g, BX1 + 3, BY0, 1, BY1 - BY0, OUT);
  for (let x = BX0; x < BX1; x += 3) if (!inChan(G, x, BY0 - 1)) R(g, x, BY0 + (x % 2), 2, 1, "#4ea2b8");
  // la grille : pointillés discrets
  const L = w * CS;
  for (let k = 0; k <= w; k++) for (let i = 0; i < L; i += 3){
    const cc = k === 0 || k === w ? "rgba(170,230,240,.45)" : "rgba(150,215,230,.28)";
    R(g, GX + k * CS - (k === w ? 1 : 0), GY + i, 1, 1, cc); R(g, GX + i, GY + k * CS - (k === w ? 1 : 0), 1, 1, cc);
  }
  for (let i = 0; i <= w; i++) for (let j = 0; j <= w; j++){ const x = GX + i * CS - (i === w), y = GY + j * CS - (j === w); R(g, x - 1, y, 3, 1, "rgba(200,245,250,.5)"); R(g, x, y - 1, 1, 3, "rgba(200,245,250,.5)"); }
  // les obstacles fixes
  N.fixes.forEach((p, k) => obstacle(g, port, GX + (p % w) * CS, GY + Math.floor(p / w) * CS, CS, k));
  // rochers et plateforme du phare
  const lx = G.LH.x, ly = G.LH.y;
  blob(g, [[lx - 34, ly - 18, 5], [lx - 24, ly - 14, 6], [lx - 14, ly - 20, 5], [lx + 14, ly - 18, 6], [lx + 22, ly - 24, 4], [lx - 16, ly, 5], [lx + 12, ly + 2, 5]], ["#d6d0c4", "#a49c8e", "#7a7466", "#4e4a42"]);
  for (let y = ly - 20; y < ly + 16; y++) for (let x = lx - 22; x < lx + 22; x++){ const d = Math.hypot(x - lx, (y - ly) * 1.25); if (d < 15) R(g, x, y, 1, 1, d > 13 ? ((x - lx) + (y - ly) < 0 ? "#efe6d2" : "#7a7060") : (Math.floor(Math.atan2(y - ly, x - lx) * 4) % 2 ? "#c9bea8" : "#bdb19a")); else if (d < 16) R(g, x, y, 1, 1, OUT); }
  buildBuilding(g, G);
  // le quai du bas : casiers et poissons à la pêche, voiliers à la marina, coque en chantier, conteneurs et grue au commerce et au grand port
  const qy = BY1 + 40;
  if (port === 0){
    for (const [x, y] of [[8, qy - 26], [24, qy - 24], [8, qy - 14], [26, qy - 12], [42, qy - 20]]) casier(g, x, y);
    for (const [x, y] of [[66, qy - 22], [86, qy - 24], [70, qy - 10], [90, qy - 12], [110, qy - 20]]) fishBox(g, x, y);
    // filet de pêche étendu et rouleau d'amarre
    for (let y = 0; y < 14; y++) for (let x = 0; x < 26; x++) if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) R(g, 128 + x, qy - 26 + y, 1, 1, (x + y) % 8 ? "#4a7a6a" : "#ffb030");
    ring(g, 140, qy - 4, 5, "#e8d8a8", "#b8a070"); ring(g, 140, qy - 4, 3, "#e8d8a8", "#b8a070");
  } else if (port === 2){
    // la marina : deux voiliers sur leur remorque, des fanions
    for (const [x, y] of [[8, qy - 30], [62, qy - 18]]){
      const v = boatSail("E");
      R(g, x + 4, y + v.height - 1, v.width - 8, 3, "rgba(40,30,20,.3)");
      R(g, x + 6, y + v.height - 3, v.width - 12, 2, "#454c5c"); for (const dx of [10, v.width - 16]) { R(g, x + dx - 1, y + v.height - 3, 5, 5, OUT); R(g, x + dx, y + v.height - 2, 3, 3, "#262233"); }
      g.drawImage(v, x, y);
    }
    for (let x = 4; x < 130; x++){ const yy = qy - 36 + Math.round(Math.sin(x / 14) * 2); R(g, x, yy, 1, 1, "#5e5870"); if (x % 8 === 0){ const c = [P.red, P.yellow, P.blue, P.green][(x / 8) % 4]; R(g, x - 2, yy + 1, 5, 2, c[1]); R(g, x - 1, yy + 3, 3, 2, c[1]); R(g, x, yy + 5, 1, 1, c[2]); } }
  } else if (port === 3){
    // le chantier naval : une coque sur ses tins, entourée d'échafaudages
    const c = boatTanker("E");
    R(g, 6, qy - 32, c.width + 6, c.height + 10, "rgba(40,30,20,.25)");
    for (const dx of [14, 44, 74, 100]) { R(g, 4 + dx, qy - 32 + c.height - 2, 8, 6, OUT); R(g, 5 + dx, qy - 31 + c.height - 2, 6, 4, P.teak[1]); }
    g.drawImage(c, 4, qy - 36);
    for (let x = 2; x < c.width + 8; x += 12) { R(g, x, qy - 40, 1, c.height + 8, "#8e98aa"); }
    for (const y of [qy - 40, qy - 36 + c.height + 4]) R(g, 2, y, c.width + 7, 1, "#c8d0dc");
    for (let k = 0; k < 6; k++) R(g, 10 + k * 18 + (k % 2) * 4, qy - 40 + (k % 3) * 9, 2, 2, "#ffd23f");
  } else {
    const cols = [P.red, P.blue, P.green, P.orange, P.teal, P.yellow, P.pink, P.navy], r = rnd(42 + port);
    const stacks = [0, 1, 2].map(k => ({x: 6 + k * 34, base: qy, tiers: 1 + Math.floor(r() * 3), k: Math.floor(r() * 99)}));
    for (const s of stacks){ const top = s.base - 9 - 7 * s.tiers; g.fillStyle = "rgba(40,30,20,.3)"; g.fillRect(s.x + 31, top + 3, 3, s.base - top - 1); g.fillRect(s.x + 3, s.base + 1, 31, 2); }
    for (const s of stacks) for (let t = 0; t < s.tiers; t++) container(g, s.x, s.base - 9 - 7 * (t + 1), 30, 9, 7, cols[(s.k + t * 3) % cols.length], t === 0);
    for (let x = 4; x < 108; x++) if (x % 6 < 3) R(g, x, qy + 6, 1, 1, "#e8c040");
    // rails et pieds de la grue
    R(g, 108, BY1 + 18, 30, 1, "#6f7888"); R(g, 108, BY1 + 30, 30, 1, "#6f7888");
    for (const [dx, dy] of [[-8, -2], [6, -2], [-8, 8], [6, 8]]){ const x = 122, y = BY1 + 22; R(g, x + dx - 1, y + dy - 8, 5, 11, OUT); R(g, x + dx, y + dy - 7, 3, 9, "#f0b030"); R(g, x + dx, y + dy - 7, 1, 9, "#ffe080"); }
  }
  // bittes d'amarrage
  for (let k = 0; k < w; k++) if (k !== G.sortie) bollard(g, GX + CS / 2 + k * CS, BY0 - 11);
  for (const y of [GY + 64, GY + 114]) bollard(g, 5, y);
  for (const y of [GY + 24, GY + 124]) bollard(g, VW - 7, y);
  // bouée de sauvetage et caisses
  R(g, 182, qy - 8, 12, 12, OUT); for (let a = 0; a < 40; a++){ const an = a / 40 * TAU, x = Math.round(188 + Math.cos(an) * 4.5), y = Math.round(qy - 2 + Math.sin(an) * 4.5); R(g, x - 1, y - 1, 2, 2, Math.floor(a / 5) % 2 ? "#ffffff" : "#f04a3c"); }
  R(g, 186, qy - 4, 4, 4, "#bdb19a");
  crate(g, 156, qy - 8); crate(g, 168, qy - 6);
  for (const [x, y] of G.LAMPS) lamp(g, x, y);
  // rides et vagues de la mer, tirées une fois
  const r = rnd(321 + G.sortie);
  G.WAVES = []; G.SEAW = [];
  while (G.WAVES.length < 70) G.WAVES.push({x: BX0 + r() * (BX1 - BX0), y: BY0 + 6 + r() * (BY1 - BY0 - 8), len: 2 + Math.floor(r() * 4), ph: r(), m: 1 + Math.floor(r() * 2)});
  for (let k = 0; k < 400 && G.SEAW.length < 22 + G.DY / 3; k++){ const x = r() * VW, y = 2 + r() * (SEAY - 6); if (inSea(G, Math.round(x), Math.round(y)) && !inChan(G, Math.round(x), Math.round(y))) G.SEAW.push({x, y, len: 3 + Math.floor(r() * 5), ph: r()}); }
  return c;
}

/* ---------- la grue et les mouettes ---------- */
function drawCrane(g, bx, by, ang, len, lt, h){
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
  const tipX = bx + dx * len, tipY = by + dy * len * .8;
  g.fillStyle = "rgba(40,30,20,.2)";
  for (let s = 8; s < len; s++){ const x = bx + dx * s + 7, y = by + dy * s * .8 - h + 12; g.fillRect(Math.round(x - 1), Math.round(y - 1), 3, 3); }
  const sway = Math.round(Math.sin(TAU * lt / 5) * 1.5), lh = 12 + Math.round(4 * Math.sin(TAU * lt / 10));
  const lx = Math.round(tipX) + sway, ly = Math.round(tipY - lh);
  R(g, lx - 2, Math.round(tipY) + 2, 24, 4, "rgba(40,30,20,.28)");
  const pts = [];
  for (let s = 0; s <= len; s++){ const w = 2.6 - s / len * 1.2; pts.push([bx + dx * s, by + dy * s * .8 - h, w, s]); }
  for (const [x, y, w] of pts) for (const sd of [-1, 1]) R(g, Math.round(x + nx * w * sd) - 1, Math.round(y + ny * w * sd * .8) - 1, 3, 3, OUT);
  for (const [x, y, w, s] of pts){
    for (const sd of [-1, 1]) R(g, Math.round(x + nx * w * sd), Math.round(y + ny * w * sd * .8), 1, 1, sd < 0 ? "#ffe080" : "#e0a020");
    if (s % 5 === 0) for (let q = -w; q <= w; q += .5) R(g, Math.round(x + nx * q), Math.round(y + ny * q * .8), 1, 1, "#f0b030");
  }
  for (let y = Math.round(tipY - h) + 1; y < ly - 1; y++) R(g, lx, y, 1, 1, y % 2 ? "#262233" : "#5e5870");
  R(g, lx - 3, ly - 2, 7, 2, OUT);
  container(g, lx - 12, ly, 24, 8, 6, P.orange, false);
  const cx = Math.round(bx), cy = Math.round(by - h);
  R(g, cx - 6, cy - 6, 13, 12, OUT); R(g, cx - 5, cy - 5, 11, 10, "#f0b030"); R(g, cx - 5, cy - 5, 11, 2, "#ffe080"); R(g, cx + 4, cy - 3, 1, 8, "#c08010");
  R(g, cx - 3, cy - 2, 6, 4, "#3a86c0"); R(g, cx - 3, cy - 2, 2, 1, "#e0f8ff");
  R(g, cx - 3, cy + 6, 7, h - 4, OUT); for (let y = cy + 6; y < cy + h + 1; y++) R(g, cx - 2, y, 5, 1, y % 4 === 0 ? "#c08010" : "#f0b030");
}
const GULL_A = [".....kk........", ".....ggk.......", "......ggk......", "......gggg.....", "......wwwgg....", ".ttwwwwwwwwwhhb", "......wwwgg....", "......gggg.....", "......ggk......", ".....ggk.......", ".....kk........"];
const GULL_B = ["...............", "...............", "...............", "......kgg......", "......wwwg.....", ".ttwwwwwwwwwhhb", "......wwwg.....", "......kgg......", "...............", "...............", "..............."];
function gullSprite(map, flip){
  const w = map[0].length + 2, h = map.length + 2, [c, g] = mk(w, h);
  const C = {k: "#2a2638", g: "#a8b0c0", w: "#ffffff", t: "#d8dee8", h: "#ffffff", b: "#ffb020"};
  const at = (i, j) => { const row = map[j]; if (!row) return "."; return row[flip ? row.length - 1 - i : i] || "."; };
  for (let j = 0; j < map.length; j++) for (let i = 0; i < map[0].length; i++) if (at(i, j) !== ".") R(g, i, j, 3, 3, OUT);
  for (let j = 0; j < map.length; j++) for (let i = 0; i < map[0].length; i++){ const ch = at(i, j); if (ch !== ".") R(g, i + 1, j + 1, 1, 1, C[ch]); }
  return c;
}
let LIGHT = null, GULL = null;
function prepare(){
  if (LIGHT) return;
  LIGHT = buildLighthouse();
  GULL = {a: [gullSprite(GULL_A, 0), gullSprite(GULL_A, 1)], b: [gullSprite(GULL_B, 0), gullSprite(GULL_B, 1)]};
  GULL.sh = [silhouette(GULL.a[0], "rgba(10,20,40,.3)"), silhouette(GULL.b[0], "rgba(10,20,40,.3)")];
}

/* ---------- une image : bat = [[sprite, x, y], …] (le navire doré en premier), tug = {d, x, y} ou null ---------- */
function scene(g, G, port, fondImg, bat, tug, lt){
  const ph = (lt % 10) / 10, {CH, BY0, CS} = G;
  g.drawImage(fondImg, 0, 0);
  for (const w of G.WAVES){
    const q = (ph * w.m + w.ph) % 1; if (q > .7) continue;
    const x = Math.round(w.x + Math.sin(TAU * (ph + w.ph)) * 2), y = Math.round(w.y);
    R(g, x, y, w.len, 1, q < .35 ? "#6cc0d4" : "#4ea2b8"); R(g, x + 1, y + 1, Math.max(1, w.len - 2), 1, "#1a5470");
  }
  for (const w of G.SEAW){
    const q = (ph * 2 + w.ph) % 1; if (q > .75) continue;
    const x = Math.round(w.x - q * 6), y = Math.round(w.y);
    R(g, x, y, w.len, 1, q < .4 ? "#8ac8ec" : "#5aa0d0"); R(g, x + 1, y + 1, w.len - 1, 1, "#103a5c");
  }
  // la passe dorée et ses chevrons qui montent
  const glow = .5 + .5 * Math.sin(TAU * lt / 2);
  g.globalAlpha = .16 + .14 * glow; R(g, CH.x0 + 2, CH.y0 + 6, CS - 4, BY0 - CH.y0 - 4, "#ffd23f"); g.globalAlpha = 1;
  for (let y = CH.y0 + 6; y < BY0 + 2; y++) if ((y + Math.floor(lt * 8)) % 6 < 3){ R(g, CH.x0 + 1, y, 1, 1, "#ffe680"); R(g, CH.x1 - 2, y, 1, 1, "#ffe680"); }
  for (let k = 0; k < 2; k++){ const y = BY0 - 8 - ((Math.floor(ph * 140) + k * 18) % 36), x = CH.x0 + CS / 2 - 5;
    for (let j = 0; j < 5; j++){ R(g, x + j, y + 4 - j, 1, 2, k ? "#ffffff" : "#ffe680"); R(g, x + 9 - j, y + 4 - j, 1, 2, k ? "#ffffff" : "#ffe680"); } }
  // ombres, écume, remous du remorqueur
  const T = tug ? remorqueur(tug.d, CS) : null;
  for (const [s, x, y] of bat) g.drawImage(s.sil, x + 3, y + 3);
  if (T) g.drawImage(T.sil, tug.x + 3, tug.y + 3);
  bat.forEach(([s, x, y], i) => { const q = .5 + .5 * Math.sin(TAU * ph * 2 + i * 1.7); g.globalAlpha = .18 + .3 * q; g.drawImage(s.foam, x - 1 + (q > .7 ? 1 : 0), y - 1); });
  g.globalAlpha = 1;
  if (T){
    const fr = Math.floor(lt * 10), cx = tug.x + T.img.width / 2, cy = tug.y + T.img.height / 2;
    const bk = {N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0]}[tug.d];
    for (let k = 0; k < 18; k++){ const dd = 8 + hash(k, fr) * 14, w = (hash(k, fr + 7) - .5) * (4 + dd * .4);
      R(g, Math.round(cx + bk[0] * dd + bk[1] * w), Math.round(cy + bk[1] * dd + bk[0] * w), hash(k, fr + 2) < .5 ? 2 : 1, 1, dd < 14 ? "#ffffff" : "#bfe6f6"); }
  }
  // le halo du navire doré, puis les bateaux
  const [gs, gx, gy] = bat[0];
  g.globalAlpha = .25 + .35 * glow; g.drawImage(gs.glow[1], gx - 3, gy - 3); g.globalAlpha = .4 + .4 * glow; g.drawImage(gs.glow[0], gx - 2, gy - 2); g.globalAlpha = 1;
  for (const [s, x, y, pris] of bat){
    if (pris){ g.globalAlpha = .7; g.drawImage(s.foam, x - 1, y - 1); g.globalAlpha = 1; }
    g.drawImage(s.img, x, y);
  }
  if (T) g.drawImage(T.img, tug.x, tug.y);
  { const k = Math.floor(lt * 1.6) % 4, sp = [[5, 14], [4, 40], [12, 50], [17, 26]][k], q = (lt * 1.6) % 1;
    if (q < .5){ const x = gx + sp[0], y = gy + sp[1], r = q < .25 ? 1 : 2; R(g, x - r, y, r * 2 + 1, 1, "#ffffff"); R(g, x, y - r, 1, r * 2 + 1, "#ffffff"); } }
  // la grue (sauf au port de pêche), le phare, les mouettes
  if (port === 1 || port === 4) drawCrane(g, 122, G.BY1 + 22, Math.PI - .2 + .2 * Math.sin(TAU * lt / 10), 54, lt, 26);
  g.drawImage(LIGHT, G.LH.x - 15, G.LH.y - 58);
  const gullAt = (x, y, k, flip, sh) => { const f = Math.floor(lt * 6 + k) % 3 === 0 ? "b" : "a";
    g.drawImage(GULL.sh[f === "a" ? 0 : 1], Math.round(x - 8 + sh * .6), Math.round(y - 6 + sh)); g.drawImage(GULL[f][flip ? 1 : 0], Math.round(x - 8), Math.round(y - 6)); };
  { const a = TAU * ph, x = 108 + Math.cos(a) * 70, y = G.GY + 94 + Math.sin(a) * 60; gullAt(x, y, 1, Math.sin(a) > 0, 26); }
  { const a = TAU * ph * 2 + 2.4, x = 40 + Math.cos(-a) * 30, y = G.SEAY - 14 + Math.sin(-a) * 10; gullAt(x, y, 2, Math.sin(-a) < 0, 20); }
}

// le remorqueur derrière le bateau qu'on glisse : s = sens du glissement (+1 vers la droite ou le bas)
function placeRemorqueur(s, horiz, bx, by, img, CS){
  const d = horiz ? (s > 0 ? "E" : "W") : (s > 0 ? "S" : "N"), t = remorqueur(d, CS).img;
  const x = horiz ? (s > 0 ? bx - t.width + 3 : bx + img.width - 3) : Math.round(bx + img.width / 2 - t.width / 2);
  const y = horiz ? Math.round(by + img.height / 2 - t.height / 2) : (s > 0 ? by - t.height + 3 : by + img.height - 3);
  return {d, x, y};
}

window.CapDecor = {OUT, VW, mk, R, plate, geo, fond, sprites, scene, placeRemorqueur, prepare, P};
})();

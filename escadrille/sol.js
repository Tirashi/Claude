/* =====================================================================
   ESCADRILLE ! : le sol vu de très haut, qui défile sous les avions.
   Script classique : window.EscSol.build(style) rend une tuile de 272×256 pixels logiques
   qui se répète sans couture (en largeur et en hauteur) ; on la fait défiler vers le bas.
     a : CAMPAGNE (champs en damier, haies, bois, route, rivière, hameaux)
     b : FORETS ET MONTAGNES (relief ombré, sapins, lacs, rochers, neige)
     c : DESERT ET CANYON (dunes, plateaux rouges, canyon et son filet d'eau, oasis)
   ===================================================================== */
(function () {
'use strict';
const W = 272, H = 256, TAU = Math.PI * 2;
function rnd(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const sm = u => u * u * (3 - 2 * u), lerp = (a, b, u) => a + (b - a) * u;
// bruit de valeur périodique : nx × ny points sur la tuile, raccord parfait aux bords
function vnoise(r, nx, ny) {
  const L = Array.from({ length: nx * ny }, r), v = (i, j) => L[((j % ny + ny) % ny) * nx + ((i % nx + nx) % nx)];
  return (x, y) => {
    const fx = x / W * nx, fy = y / H * ny, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = sm(fx - x0), ty = sm(fy - y0);
    return lerp(lerp(v(x0, y0), v(x0 + 1, y0), tx), lerp(v(x0, y0 + 1), v(x0 + 1, y0 + 1), tx), ty);
  };
}
function fbm(seed, oct) {
  const r = rnd(seed), ns = oct.map(([nx, ny]) => vnoise(r, nx, ny));
  return (x, y) => { let s = 0, a = 1, t = 0; for (const n of ns) { s += n(x, y) * a; t += a; a *= .5; } return s / t; };
}
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const wrapX = x => ((x % W) + W) % W, wrapY = y => ((y % H) + H) % H;
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const dith = (x, y) => BAYER[y & 3][x & 3] / 16 - .5;

function canvas() { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
// on peint dans un tableau de couleurs, puis on le pose sur la tuile
function Pix() {
  const a = new Array(W * H).fill('#000');
  return {
    set(x, y, c) { a[wrapY(Math.round(y)) * W + wrapX(Math.round(x))] = c; },
    get(x, y) { return a[wrapY(y) * W + wrapX(x)]; },
    toCanvas() {
      const [c, g] = canvas(), img = g.createImageData(W, H);
      for (let i = 0; i < W * H; i++) { const v = parseInt(a[i].slice(1), 16); img.data[i * 4] = v >> 16; img.data[i * 4 + 1] = v >> 8 & 255; img.data[i * 4 + 2] = v & 255; img.data[i * 4 + 3] = 255; }
      g.putImageData(img, 0, 0); return c;
    },
  };
}
// un arbre vu de dessus (3×3) : ombre au sud-est, reflet au nord-ouest
function tree(P, x, y, ramp) { for (const [a, b] of [[2, 1], [1, 2], [2, 2]]) P.set(x + a, y + b, ramp[3]); P.set(x, y, ramp[0]); P.set(x + 1, y, ramp[1]); P.set(x, y + 1, ramp[1]); P.set(x + 1, y + 1, ramp[2]); }

/* ---------- A. CAMPAGNE ---------- */
function campagne() {
  const P = Pix(), r = rnd(7), n = fbm(3, [[4, 4], [8, 8], [17, 16]]);
  const CROPS = [
    ['#c9b25a', '#b49a46', 'rang'], ['#7fa34a', '#6c8f3e', 'rang'], ['#5e8a3a', '#527a33', 'pre'], ['#8a6a44', '#765836', 'rang'],
    ['#9cb85a', '#8aa64e', 'pre'], ['#d8c050', '#c4aa3e', 'rang'], ['#6f9a48', '#5f8a3e', 'rang'], ['#a8875a', '#957650', 'rang'],
  ];
  const WOOD = ['#5f8f4a', '#3f6e36', '#2e5a2c', '#1f4022'], HEDGE = '#36592c';
  // colonnes de largeurs variées, puis parcelles de hauteurs variées dont la somme fait toute la tuile
  const cols = []; let x = 0;
  while (x < W) { let w = 20 + Math.floor(r() * 30); if (W - x - w < 20) w = W - x; cols.push([x, w]); x += w; }
  for (const [x0, w] of cols) {
    let y = Math.floor(r() * 20), left = H;
    while (left > 0) {
      let h = 18 + Math.floor(r() * 34); if (left - h < 18) h = left;
      const wood = r() < .14, crop = CROPS[Math.floor(r() * CROPS.length)], vert = r() < .5;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        const px = x0 + xx, py = y + yy, edge = xx === 0 || yy === 0;
        let c;
        if (wood) c = hash(px, py, 1) < .55 ? WOOD[2] : WOOD[3];
        else if (edge) c = hash(px, py, 2) < .3 ? '#4a7a3a' : HEDGE;
        else if (crop[2] === 'rang') c = ((vert ? xx : yy) % 3 === 0) ? crop[1] : crop[0];
        else c = hash(px, py, 3) < .2 ? crop[1] : crop[0];
        if (!wood && !edge && n(px, py) + dith(px, py) * .08 > .62) c = crop[1];
        P.set(px, py, c);
      }
      if (wood) for (let k = 0; k < w * h / 9; k++) tree(P, x0 + 1 + Math.floor(r() * (w - 3)), y + 1 + Math.floor(r() * (h - 3)), WOOD);
      else for (let k = 0; k < (w + h) / 8; k++) { const e = r() < .5; tree(P, x0 + (e ? Math.floor(r() * w) : -1), y + (e ? -1 : Math.floor(r() * h)), WOOD); }
      y += h; left -= h;
    }
  }
  // la rivière : un méandre qui revient au même endroit en haut et en bas de la tuile
  const riv = y => 70 + 22 * Math.sin(TAU * y / H) + 9 * Math.sin(TAU * 2 * y / H + 1.2);
  for (let y = 0; y < H; y++) {
    const c = riv(y);
    for (let k = -5; k <= 5; k++) { const ax = Math.round(c + k), d = Math.abs(k);
      P.set(ax, y, d <= 2 ? (hash(ax, y, 4) < .12 ? '#7ab4d8' : '#3f7fb4') : d === 3 ? '#2f6a9a' : d === 4 ? '#8a9a5a' : WOOD[2]); }
  }
  // la route : grise, bordée de clair, avec ses arbres d'alignement
  const road = y => 190 + 16 * Math.sin(TAU * y / H + 2.1);
  for (let y = 0; y < H; y++) {
    const c = Math.round(road(y));
    for (let k = -2; k <= 2; k++) P.set(c + k, y, Math.abs(k) === 2 ? '#b8ae94' : '#8d8a84');
    if (y % 12 === 0) P.set(c, y, '#e0dccc');
    if (y % 9 === 0) { tree(P, c - 5, y, WOOD); tree(P, c + 4, y + 4, WOOD); }
  }
  // un pont là où la route croise la rivière, et des hameaux le long de la route
  for (const y0 of [30, 118, 200]) {
    const c = Math.round(road(y0));
    for (let k = 0; k < 6; k++) {
      const hx = c + (k % 2 ? 5 : -10) + Math.floor(r() * 3), hy = y0 + k * 5;
      const roof = r() < .6 ? ['#c4583e', '#8e3a2a'] : ['#8a8a96', '#5a5a66'];
      for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 5; xx++) P.set(hx + xx, hy + yy, yy < 2 ? roof[0] : roof[1]);
      P.set(hx + 5, hy + 1, '#3a3428'); P.set(hx + 5, hy + 2, '#3a3428'); P.set(hx + 1, hy + 4, '#3a3428'); P.set(hx + 2, hy + 4, '#3a3428');
    }
  }
  return P.toCanvas();
}

/* ---------- B. FORETS ET MONTAGNES ---------- */
function montagnes() {
  const P = Pix(), hgt = fbm(11, [[3, 3], [6, 6], [12, 12], [24, 24], [68, 64]]);
  const Hm = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => hgt(x, y)));
  const h = (x, y) => Hm[wrapY(y)][wrapX(x)];
  const LAKE = ['#5a9ac8', '#3f7fb4', '#2f6a9a'], FOREST = ['#5f9a52', '#3f7a3e', '#2c5e30', '#1c4224'], MEAD = ['#9cbc68', '#86a858', '#6f9048'],
        ROCK = ['#c8bca8', '#a09482', '#7a6e60', '#554a40'], SNOW = ['#ffffff', '#e8eef6', '#c8d4e4'];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = h(x, y), sh = (h(x - 1, y - 1) - h(x + 1, y + 1)) * 26 + dith(x, y) * .5;   // relief éclairé du nord-ouest
    const k = sh > .45 ? 0 : sh > -.1 ? 1 : sh > -.6 ? 2 : 3;
    let c;
    if (v < .3) c = v < .28 ? LAKE[1 + (hash(x, y, 5) < .06 ? -1 : 0)] : LAKE[2];
    else if (v < .35) c = MEAD[Math.min(2, k)];
    else if (v < .54) c = FOREST[Math.min(3, k + (hash(x, y, 6) < .35 ? 1 : 0))];
    else if (v < .62) c = ROCK[Math.min(3, k)];
    else c = SNOW[Math.min(2, k)];
    P.set(x, y, c);
  }
  // les sapins : de petites couronnes serrées sur les pentes boisées
  const r = rnd(5);
  for (let i = 0; i < 2600; i++) { const x = Math.floor(r() * W), y = Math.floor(r() * H), v = h(x, y); if (v > .36 && v < .53) tree(P, x, y, FOREST); }
  return P.toCanvas();
}

/* ---------- C. DESERT ET CANYON ---------- */
function desert() {
  const P = Pix(), n = fbm(21, [[4, 4], [8, 8], [17, 16], [34, 32]]), mesa = fbm(29, [[4, 4], [8, 8], [17, 16]]);
  const SAND = ['#f0d8a0', '#e2c486', '#d0ac6c', '#b89056'], RED = ['#e0905a', '#c46a3c', '#9a4c2a', '#6e3420'];
  const can = y => 150 + 30 * Math.sin(TAU * y / H + .4) + 12 * Math.sin(TAU * 3 * y / H);
  const half = y => 9 + 3 * Math.sin(TAU * 2 * y / H + 1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = n(x, y), dune = Math.sin((x * .5 + y * .9 + v * 60) / 3.2);
    let k = dune > .55 ? 0 : dune > -.2 ? 1 : dune > -.75 ? 2 : 3;
    if (v > .6) k = Math.min(3, k + 1);
    let c = SAND[k];
    const m = mesa(x, y);
    if (m > .64) { const e = mesa(x + 2, y + 2) <= .64; c = e ? RED[2] : RED[mesa(x - 1, y - 1) <= .64 ? 0 : 1]; }
    else if (m > .6 && mesa(x - 3, y - 3) > .64) c = SAND[3];                                   // ombre portée des plateaux
    // le canyon : parois éclairées à l'est, dans l'ombre à l'ouest, fond rouge et filet d'eau
    const cx = can(y), dx = x - cx, ww = half(y), dd = Math.min(Math.abs(dx), Math.abs(dx + W), Math.abs(dx - W)), sg = Math.abs(dx) === dd ? Math.sign(dx) : -Math.sign(dx);
    if (dd < ww) {
      c = dd < 2 ? (hash(x, y, 7) < .15 ? '#8ad0e0' : '#4a9ab4') : dd < 3 ? '#6a8a4a' : dd < ww - 3 ? RED[2] : sg > 0 ? RED[0] : RED[3];
      if (dd >= 3 && dd < ww - 3 && hash(x, y, 8) < .1) c = RED[1];
    } else if (dd < ww + 2) c = sg > 0 ? RED[1] : RED[3];
    P.set(x, y, c);
  }
  // une oasis : palmiers et petite mare
  const r = rnd(9);
  for (const [ox, oy] of [[60, 60], [230, 200]]) {
    for (let yy = -4; yy <= 4; yy++) for (let xx = -6; xx <= 6; xx++) if (xx * xx / 36 + yy * yy / 16 < 1) P.set(ox + xx, oy + yy, xx * xx / 36 + yy * yy / 16 > .6 ? '#6a9a4a' : '#4a9ab4');
    for (let k = 0; k < 9; k++) tree(P, ox - 10 + Math.floor(r() * 20), oy - 9 + Math.floor(r() * 18), ['#8ac060', '#5a9a40', '#3a7a30', '#2a5424']);
  }
  return P.toCanvas();
}

const BUILD = { a: campagne, b: montagnes, c: desert }, CACHE = {};
window.EscSol = { W, H, build(st) { return CACHE[st] || (CACHE[st] = BUILD[st]()); } };
})();

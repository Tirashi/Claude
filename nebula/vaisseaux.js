/* =====================================================================
   NEBULA · moteur de vaisseaux en relief (partagé avec « Nebula : l'Empire
   des étoiles »). Extrait du catalogue maquettes/nebula-chantier-naval.html.
   - builder(w, h) + render(B, opt) : carte de hauteurs éclairée (ombres,
     rainures, reflets), sans contour noir.
   - SHIPS : un constructeur par type (1 case = 60×66, 2 cases = 66×140,
     3 cases = 70×214, pour des cases de 72 px). Les pirates sont retournés.
   - get(id) : le sprite, fabriqué à la demande puis gardé en cache.
   - drawShip(g, s, x, y, sc, t) : dessine un sprite centré, réacteurs compris.
   - rock(), space(), drawPlanet() : le décor (astéroïdes, nébuleuse, planètes).
   Tout est exposé dans window.NebulaVaisseaux.
   ===================================================================== */
(function () {
'use strict';
const W = 544, H = 960, TAU = Math.PI * 2;
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function rnd(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function vnoise(x, y, s) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s, o = 4) { let t = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { t += a * vnoise(x * f, y * f, s + i); a *= .5; f *= 2.03; } return t; }
const mix = (a, b, t) => a + (b - a) * t, clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
function grad(stops, t) { t = clamp(t); const n = stops.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i, a = stops[i], b = stops[i + 1]; return [mix(a[0], b[0], f), mix(a[1], b[1], f), mix(a[2], b[2], f)]; }

/* =====================================================================
   CHANTIER NAVAL : chaque vaisseau est une carte de hauteurs (coque,
   superstructures, blindages, tourelles, détails), éclairée comme un
   relief : lumière en haut à gauche, ombres portées des parties hautes,
   occlusion dans les creux, rainures entre les plaques, reflets sur les
   arêtes, lumière froide de la nébuleuse côté ombre.
   1 case = 72 px : chasseur 1 case, frégate 2 cases, porte-vaisseaux 3.
   Les pirates sont construits nez en haut puis retournés avant l'éclairage.
   ===================================================================== */
const LIGHT = (() => { const v = [-.5, -.62, .6], n = Math.hypot(...v); return v.map(x => x / n); })();
const HALF = (() => { const v = [LIGHT[0], LIGHT[1], LIGHT[2] + 1], n = Math.hypot(...v); return v.map(x => x / n); })();
// albédo (couleur de la matière), brillance, plaques
const MAT = {
  hull:   { c: [92, 98, 108], spec: .35, plates: 1 },     // acier canon de fusil
  hull2:  { c: [62, 66, 74], spec: .3, plates: 1 },       // acier sombre
  deck:   { c: [118, 120, 122], spec: .25, plates: 1 },   // pont plus clair
  amber:  { c: [176, 118, 42], spec: .4, plates: 0 },     // marquages de la flotte (ambre)
  black:  { c: [30, 32, 36], spec: .15, plates: 0 },      // tuyères, baies
  glass:  { c: [26, 44, 62], spec: 1.2, plates: 0, glass: 1 },
  rust:   { c: [112, 66, 44], spec: .15, plates: 1, grime: 1 },
  scrap:  { c: [78, 76, 72], spec: .2, plates: 1, grime: .8 },
  hazard: { c: [190, 150, 50], spec: .2, plates: 0, stripes: 1 },
  red:    { c: [150, 40, 36], spec: .3, plates: 0 },
};
function inPoly(x, y, p) { let c = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function edgeDist(x, y, p) { let d = 1e9; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [ax, ay] = p[j], [bx, by] = p[i], dx = bx - ax, dy = by - ay; if (!dx && !dy) continue; const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)); d = Math.min(d, Math.hypot(x - ax - t * dx, y - ay - t * dy)); } return d; }
// une coque décrite par sa moitié gauche (x mesuré depuis l'axe, vers la gauche) : renvoie le polygone complet
const half = (cx, pts) => pts.map(([dx, y]) => [cx - dx, y]).concat(pts.slice().reverse().filter(([dx]) => dx !== 0).map(([dx, y]) => [cx + dx, y]));
const smooth = t => t * t * (3 - 2 * t);
/* Construction : B.poly(pts, haut, biseau, matière), B.box(x, y, w, h, ...), B.dome(cx, cy, rx, ry, base, haut, matière),
   B.mirror(fn) : dessine aussi la pièce en miroir, B.lights(pts, couleur), B.engines(pts). */
function builder(w, h) {
  const N = w * h, H = new Float32Array(N).fill(-99), M = new Array(N).fill(null), P = new Int16Array(N).fill(-1);
  let pid = 0; const glow = [], eng = [];
  const B = {
    w, h, H, M, P, glow, eng,
    poly(pts, top, bev, mat, base = 0) {
      const id = pid++, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      for (let y = Math.max(0, Math.floor(Math.min(...ys))); y < Math.min(h, Math.ceil(Math.max(...ys)) + 1); y++)
        for (let x = Math.max(0, Math.floor(Math.min(...xs))); x < Math.min(w, Math.ceil(Math.max(...xs)) + 1); x++) {
          if (!inPoly(x + .5, y + .5, pts)) continue;
          const d = edgeDist(x + .5, y + .5, pts), z = base + (top - base) * smooth(Math.min(1, d / bev)), i = y * w + x;
          if (z >= H[i]) { H[i] = z; M[i] = mat; P[i] = id; }
        }
      return B;
    },
    box(x, y, bw, bh, top, bev, mat, base = 0) { return B.poly([[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]], top, bev, mat, base); },
    dome(cx, cy, rx, ry, base, top, mat) {
      const id = pid++;
      for (let y = Math.max(0, Math.floor(cy - ry)); y < Math.min(h, Math.ceil(cy + ry) + 1); y++) for (let x = Math.max(0, Math.floor(cx - rx)); x < Math.min(w, Math.ceil(cx + rx) + 1); x++) {
        const d = ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2; if (d > 1) continue;
        const z = base + (top - base) * Math.sqrt(1 - d), i = y * w + x; if (z >= H[i]) { H[i] = z; M[i] = mat; P[i] = id; }
      }
      return B;
    },
    hole(x, y, bw, bh, depth, mat) { for (let yy = Math.floor(y); yy < y + bh; yy++) for (let xx = Math.floor(x); xx < x + bw; xx++) { const i = yy * w + xx; if (H[i] > 0) { H[i] -= depth; M[i] = mat; P[i] = pid; } } pid++; return B; },
    paint(x, y, bw, bh, mat) { for (let yy = Math.floor(y); yy < y + bh; yy++) for (let xx = Math.floor(x); xx < x + bw; xx++) { const i = yy * w + xx; if (H[i] > 0) M[i] = mat; } return B; },
    holeE(cx, cy, rx, ry, depth, mat) { for (let yy = Math.floor(cy - ry); yy < cy + ry; yy++) for (let xx = Math.floor(cx - rx); xx < cx + rx; xx++) { const i = yy * w + xx; if (((xx + .5 - cx) / rx) ** 2 + ((yy + .5 - cy) / ry) ** 2 <= 1 && H[i] > 0) { H[i] -= depth; M[i] = mat; P[i] = pid; } } pid++; return B; },
    lights(pts, col) { for (const p of pts) glow.push([p[0], p[1], col]); return B; },
    engines(pts) { for (const p of pts) eng.push(p); return B; },
    // petits détails en relief posés sur les surfaces (boîtiers, conduites, antennes)
    greebles(n, seed, area) {
      const R = rnd(seed), [ax, ay, aw, ah] = area || [0, 0, w, h];
      for (let k = 0; k < n; k++) {
        const x = ax + R() * aw | 0, y = ay + R() * ah | 0, i = y * w + x; if (H[i] < 3) continue;
        const gw = 2 + (R() * 5 | 0), gh = 2 + (R() * 4 | 0), lvl = H[i];
        let ok = true; for (let yy = y; yy < y + gh && ok; yy++) for (let xx = x; xx < x + gw; xx++) if (xx >= w || yy >= h || Math.abs(H[yy * w + xx] - lvl) > .6) { ok = false; break; }
        if (ok) B.box(x, y, gw, gh, lvl + 1 + R() * 1.6, .8, R() < .7 ? M[i] : 'hull2', lvl);
      }
      return B;
    },
  };
  return B;
}
function render(B, opt = {}) {
  let { w, h, H, M, P, glow, eng } = B;
  if (opt.flip) {   // retourne le vaisseau (nez vers le bas) AVANT l'éclairage
    const N = w * h, H2 = new Float32Array(N), M2 = new Array(N), P2 = new Int16Array(N);
    for (let i = 0; i < N; i++) { H2[N - 1 - i] = H[i]; M2[N - 1 - i] = M[i]; P2[N - 1 - i] = P[i]; }
    H = H2; M = M2; P = P2; glow = glow.map(([x, y, c]) => [w - 1 - x, h - 1 - y, c]); eng = eng.map(([x, y, r]) => [w - x, h - y, r]);
  }
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? -99 : H[y * w + x];
  // rainures entre les plaques : on creuse un peu la carte de hauteurs
  const seed = opt.seed || 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (H[i] < 0 || !MAT[M[i]].plates) continue;
    const pw = 12, ph = 18, row = Math.floor((y + hash(Math.floor(x / pw), 0, seed) * 6) / ph), col = Math.floor((x + (row % 2) * 4) / pw);
    if ((y + Math.floor(hash(Math.floor(x / pw), 0, seed) * 6)) % ph === 0 || (x + (row % 2) * 4) % pw === 0) H[i] -= .28;
  }
  const [c, g] = mk(w, h), img = g.createImageData(w, h), D = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, z = H[i]; if (z < -50) continue;
    const m = MAT[M[i]];
    // normale (relief accentué)
    const hl = Math.max(at(x - 1, y), z - 3), hr = Math.max(at(x + 1, y), z - 3), hu = Math.max(at(x, y - 1), z - 3), hd = Math.max(at(x, y + 1), z - 3);
    let nx = (hl - hr) * .55, ny = (hu - hd) * .55, nz = 1, n = Math.hypot(nx, ny, nz); nx /= n; ny /= n; nz /= n;
    let dif = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    // ombre portée : on remonte vers la lumière
    let sh = 1;
    for (let s = 1; s <= 18; s++) { const xx = Math.round(x + LIGHT[0] * -1 * -s), yy = Math.round(y - LIGHT[1] * -1 * s); const hz = at(Math.round(x - (-LIGHT[0]) * s), Math.round(y - (-LIGHT[1]) * s)); if (hz > z + s * .42 + .3) { sh = .38; break; } }
    // occlusion ambiante : creux entourés de parties plus hautes
    let occ = 0; for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-2, -2], [2, 2], [-2, 2], [2, -2]]) occ += Math.max(0, Math.min(3, at(x + dx, y + dy) - z));
    const ao = 1 - Math.min(.5, occ / 14);
    // matière : variation par plaque, salissures, bandes de danger
    let [r, gg, b] = m.c;
    if (m.plates) { const v = (hash(Math.floor(x / 12), Math.floor(y / 18), seed + 3) - .5) * .12; r *= 1 + v; gg *= 1 + v; b *= 1 + v; }
    if (m.grime) { const v = (fbm(x * .12, y * .12, seed + 11, 3) - .5) * .5 * m.grime; r *= 1 + v; gg *= 1 + v * .9; b *= 1 + v * .8; }
    if (m.stripes && (Math.floor((x + y) / 5) & 1)) { r = 34; gg = 30; b = 26; }
    const amb = .22, light = (amb + dif * .95 * sh) * ao;
    r *= light; gg *= light; b *= light;
    // reflet (arêtes tournées vers la lumière)
    const sp = Math.pow(Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]), m.glass ? 40 : 18) * m.spec * sh * 255;
    r += sp; gg += sp; b += sp * 1.05;
    if (m.glass) { const t = clamp(.3 - ny * .8); r += 30 * t; gg += 70 * t; b += 100 * t; }
    // lumière froide de la nébuleuse sur les flancs à l'ombre
    const rim = Math.max(0, -(nx * LIGHT[0] + ny * LIGHT[1])) * (1 - nz) * 1.6;
    r += rim * 18; gg += rim * 40; b += rim * 70;
    const k = i * 4; D[k] = clamp(r, 0, 255); D[k + 1] = clamp(gg, 0, 255); D[k + 2] = clamp(b, 0, 255); D[k + 3] = 255;
  }
  for (const [x, y, col] of glow) { const k = (Math.round(y) * w + Math.round(x)) * 4; if (D[k + 3]) { D[k] = col[0]; D[k + 1] = col[1]; D[k + 2] = col[2]; } }
  g.putImageData(img, 0, 0);
  return { img: c, w, h, engines: eng, flip: !!opt.flip, glows: glow, gcol: opt.flip ? 'rgba(255,90,60,' : 'rgba(255,190,110,' };
}
const WARM = [255, 206, 140], REDL = [255, 90, 70];
const SHIPS = {
  // CHASSEUR (1 case) : fuselage étroit, ailes en flèche, deux réacteurs
  chasseur: () => { const B = builder(60, 66), cx = 30;
    B.poly(half(cx, [[0, 4], [4, 14], [6, 30], [24, 46], [26, 54], [8, 52], [6, 60], [0, 60]]), 4, 3, 'hull');
    B.poly(half(cx, [[0, 18], [3, 22], [4, 44], [0, 46]]), 7, 2, 'hull2', 3);
    B.poly([[cx - 24, 46], [cx - 12, 40], [cx - 10, 44], [cx - 22, 50]], 5, 1.5, 'amber', 3); B.poly([[cx + 24, 46], [cx + 12, 40], [cx + 10, 44], [cx + 22, 50]], 5, 1.5, 'amber', 3);
    B.dome(cx, 22, 3, 6, 6, 10, 'glass');
    B.box(cx - 8, 50, 5, 12, 6, 1.5, 'hull2', 2); B.box(cx + 3, 50, 5, 12, 6, 1.5, 'hull2', 2);
    B.greebles(10, 2, [10, 30, 40, 24]);
    return render(B.engines([[cx - 5.5, 62, 3.5], [cx + 5.5, 62, 3.5]]), { seed: 2 }); },
  // FRÉGATE (2 cases) : coque longue, nacelles latérales, tour de commandement, tourelles
  fregate: () => { const B = builder(66, 140), cx = 33;
    B.poly(half(cx, [[0, 3], [6, 12], [11, 40], [13, 96], [12, 126], [8, 136], [0, 136]]), 6, 4, 'hull');
    B.poly(half(cx, [[0, 30], [6, 34], [7, 92], [0, 96]]), 9, 2.5, 'deck', 6);
    for (const s of [-1, 1]) { B.poly([[cx + s * 12, 64], [cx + s * 26, 70], [cx + s * 28, 116], [cx + s * 22, 126], [cx + s * 12, 120]].map(([x, y]) => [x, y]), 7, 2.5, 'hull2');
      B.box(Math.min(cx + s * 20, cx + s * 27), 74, 6, 4, 8, 1, 'amber', 6); }
    B.box(cx - 5, 44, 10, 18, 14, 2, 'hull', 9); B.box(cx - 4, 46, 8, 3, 15.5, 1, 'glass', 13);
    B.dome(cx, 20, 4, 4, 6, 10, 'hull2'); B.box(cx - 1, 9, 2, 10, 10, .6, 'hull2', 8);   // tourelle avant et son canon
    B.dome(cx, 104, 4.5, 4.5, 6, 11, 'hull2'); B.box(cx - 1, 92, 2, 10, 11, .6, 'hull2', 9);
    B.box(cx - 10, 98, 3, 22, 7.5, 1, 'amber', 6); B.box(cx + 7, 98, 3, 22, 7.5, 1, 'amber', 6);
    B.greebles(40, 5, [12, 30, 42, 96]);
    B.lights([[cx - 8, 40], [cx - 8, 52], [cx - 8, 64], [cx + 8, 40], [cx + 8, 52], [cx + 8, 64], [cx - 3, 82], [cx + 3, 82]], WARM);
    return render(B.engines([[cx - 7, 137, 4.5], [cx + 7, 137, 4.5], [cx - 24, 127, 3], [cx + 24, 127, 3]]), { seed: 5 }); },
  // PORTE-VAISSEAUX (3 cases) : grande coque, pont d'envol, îlot de commandement décalé, baies de lancement
  mere: () => { const B = builder(70, 214), cx = 35;
    B.poly(half(cx, [[0, 2], [10, 10], [17, 40], [20, 120], [22, 176], [18, 204], [0, 208]]), 7, 5, 'hull');
    B.poly(half(cx, [[0, 18], [10, 24], [13, 60], [13, 168], [0, 172]]), 10, 2.5, 'deck', 7);
    B.box(cx - 2, 26, 4, 140, 10.4, .6, 'amber', 10);                                   // ligne d'envol
    B.box(cx - 13, 60, 4, 24, 9, 1, 'black', 6); B.box(cx + 9, 60, 4, 24, 9, 1, 'black', 6);   // baies de lancement
    B.box(cx - 13, 120, 4, 24, 9, 1, 'black', 6); B.box(cx + 9, 120, 4, 24, 9, 1, 'black', 6);
    B.box(cx + 14, 88, 8, 30, 18, 2, 'hull', 9); B.box(cx + 15, 92, 6, 4, 19.5, 1, 'glass', 17); B.box(cx + 17, 100, 2, 12, 22, .6, 'hull2', 18);  // îlot
    for (const s of [-1, 1]) B.poly([[cx + s * 18, 172], [cx + s * 25, 178], [cx + s * 24, 200], [cx + s * 16, 204]], 9, 2, 'hull2', 4);
    B.greebles(60, 9, [8, 14, 54, 190]);
    B.lights([[cx - 15, 40], [cx - 15, 50], [cx - 15, 96], [cx - 15, 106], [cx - 15, 150], [cx + 15, 40], [cx + 15, 50], [cx + 15, 150], [cx + 18, 94]], WARM);
    return render(B.engines([[cx - 12, 207, 5], [cx, 208, 6], [cx + 12, 207, 5], [cx - 21, 202, 3.5], [cx + 21, 202, 3.5]]), { seed: 9 }); },
  // PIRATES : tôle rouillée, pièces rapportées, asymétrie, bandes de danger
  intercepteur: () => { const B = builder(60, 66), cx = 30;
    B.poly([[cx, 3], [cx + 6, 20], [cx + 27, 44], [cx + 22, 50], [cx + 7, 44], [cx + 6, 60], [cx - 6, 60], [cx - 8, 40], [cx - 26, 54], [cx - 24, 46], [cx - 6, 20]], 5, 3, 'rust');
    B.poly([[cx + 14, 34], [cx + 24, 44], [cx + 20, 47], [cx + 12, 40]], 6.5, 1, 'hazard', 4);
    B.box(cx - 5, 26, 10, 16, 8, 2, 'scrap', 4); B.dome(cx, 18, 2.5, 5, 6, 9, 'glass');
    B.box(cx - 22, 44, 3, 12, 6.5, 1, 'scrap', 4);   // canon rapporté
    B.greebles(10, 13, [10, 20, 40, 34]); B.lights([[cx - 4, 30], [cx + 4, 30]], REDL);
    return render(B.engines([[cx, 61, 4.5]]), { seed: 13, flip: true }); },
  croiseur: () => { const B = builder(66, 140), cx = 33;
    B.poly([[cx, 4], [cx + 9, 14], [cx + 14, 50], [cx + 30, 62], [cx + 28, 104], [cx + 16, 110], [cx + 12, 134], [cx - 12, 134], [cx - 15, 112], [cx - 29, 100], [cx - 27, 58], [cx - 13, 46], [cx - 8, 14]], 6, 4, 'scrap');
    B.poly([[cx - 26, 62], [cx - 14, 58], [cx - 13, 96], [cx - 26, 98]], 8, 2, 'rust', 6); B.poly([[cx + 15, 60], [cx + 28, 66], [cx + 26, 100], [cx + 15, 104]], 8.5, 2, 'rust', 6);
    B.box(cx - 8, 30, 16, 50, 11, 2.5, 'rust', 6); B.box(cx - 10, 84, 20, 4, 9, 1, 'hazard', 6);
    B.box(cx - 5, 36, 10, 8, 15, 1.5, 'scrap', 11); B.box(cx - 4, 37, 8, 2, 16.5, .8, 'red', 14);
    B.dome(cx - 20, 80, 4, 4, 8, 12, 'scrap'); B.box(cx - 21, 68, 2, 11, 12, .6, 'scrap', 10); B.dome(cx + 21, 84, 4, 4, 8.5, 12, 'scrap');
    B.greebles(40, 17, [6, 20, 54, 110]); B.lights([[cx - 6, 50], [cx + 6, 50], [cx - 6, 62], [cx + 6, 70]], REDL);
    return render(B.engines([[cx - 6, 135, 5], [cx + 6, 135, 5]]), { seed: 17, flip: true }); },
  amiral: () => { const B = builder(70, 214), cx = 35;
    B.poly([[cx, 2], [cx + 12, 16], [cx + 16, 60], [cx + 33, 74], [cx + 32, 150], [cx + 20, 160], [cx + 18, 206], [cx - 18, 206], [cx - 21, 158], [cx - 34, 146], [cx - 32, 78], [cx - 16, 64], [cx - 11, 16]], 7, 5, 'scrap');
    B.poly([[cx - 31, 82], [cx - 18, 76], [cx - 17, 140], [cx - 31, 142]], 10, 2, 'rust', 7); B.poly([[cx + 17, 74], [cx + 31, 80], [cx + 31, 146], [cx + 18, 150]], 10.5, 2, 'rust', 7);
    B.box(cx - 11, 40, 22, 120, 13, 3, 'rust', 7); B.box(cx - 12, 166, 24, 5, 10, 1, 'hazard', 7);
    B.box(cx - 7, 52, 14, 14, 19, 2, 'scrap', 13); B.box(cx - 6, 54, 12, 3, 20.5, 1, 'red', 18);
    for (const y of [88, 118, 146]) { B.dome(cx - 24, y, 5, 5, 10, 15, 'scrap'); B.box(cx - 25, y - 14, 2, 13, 15, .6, 'scrap', 12); B.dome(cx + 24, y + 4, 5, 5, 10.5, 15, 'scrap'); }
    B.dome(cx, 20, 6, 6, 7, 13, 'scrap'); B.box(cx - 3, 4, 2, 15, 13, .6, 'scrap', 11); B.box(cx + 1, 4, 2, 15, 13, .6, 'scrap', 11);
    B.greebles(70, 21, [4, 30, 62, 170]); B.lights([[cx - 8, 76], [cx + 8, 76], [cx - 8, 100], [cx + 8, 100], [cx - 8, 124], [cx + 8, 124], [cx - 8, 148]], REDL);
    return render(B.engines([[cx - 11, 207, 6], [cx, 208, 6], [cx + 11, 207, 6]]), { seed: 21, flip: true }); },
};
const CYAN = [150, 225, 255];
Object.assign(SHIPS, {
  /* ---------- 1 case ---------- */
  eclaireur: () => { const B = builder(60, 66), cx = 30;
    B.poly(half(cx, [[0, 3], [3, 12], [5, 38], [9, 50], [11, 58], [5, 60], [0, 60]]), 4, 2.5, 'hull');
    for (const s of [-1, 1]) B.poly([[cx + s * 5, 34], [cx + s * 19, 50], [cx + s * 17, 55], [cx + s * 5, 49]], 4.5, 1.5, 'hull2', 2);
    B.box(cx - 1, 0, 2, 8, 5, .4, 'hull2', 3); B.box(cx - 1, 30, 2, 12, 5.2, .5, 'amber', 4);
    B.dome(cx, 21, 2.5, 5, 4, 7.5, 'glass'); B.dome(cx, 47, 5.5, 5.5, 4, 8.5, 'hull2'); B.dome(cx, 47, 2.6, 2.6, 8.5, 10, 'glass');
    return render(B.engines([[cx, 61, 3.5]]), { seed: 31 }); },
  bombardier: () => { const B = builder(60, 66), cx = 30;
    B.poly(half(cx, [[0, 26], [27, 33], [28, 44], [0, 49]]), 4, 2, 'hull2');
    B.poly(half(cx, [[0, 5], [6, 10], [9, 28], [9, 56], [6, 62], [0, 62]]), 7, 3, 'hull');
    for (const s of [-1, 1]) { B.dome(cx + s * 18, 42, 4.2, 10, 4, 8.5, 'hull2'); B.dome(cx + s * 18, 34, 2.6, 2.6, 7, 9, 'amber'); B.box(cx + (s < 0 ? -27 : 21), 45, 6, 2, 4.6, .5, 'amber', 3.5); }
    B.dome(cx, 17, 3.5, 6, 6, 10, 'glass'); B.box(cx - 7, 52, 5, 10, 8, 1.5, 'hull2', 5); B.box(cx + 2, 52, 5, 10, 8, 1.5, 'hull2', 5);
    B.greebles(10, 33, [20, 24, 20, 30]);
    return render(B.engines([[cx - 4.5, 63, 4], [cx + 4.5, 63, 4]]), { seed: 33 }); },
  drones: () => { const B = builder(60, 66), eng = [];
    for (const [x, y] of [[30, 13], [14, 30], [46, 30], [21, 50], [39, 50]]) {
      B.poly([[x, y - 7], [x + 6, y + 5], [x + 2, y + 3], [x, y + 6], [x - 2, y + 3], [x - 6, y + 5]], 3.2, 1.4, 'hull2');
      B.dome(x, y, 1.7, 1.7, 3, 4.4, 'amber'); eng.push([x, y + 6, 1.8]);
    }
    return render(B.engines(eng), { seed: 35 }); },
  /* ---------- 2 cases ---------- */
  egide: () => { const B = builder(66, 140), cx = 33;
    B.poly(half(cx, [[0, 18], [8, 22], [14, 44], [14, 110], [10, 132], [0, 134]]), 6, 4, 'hull');
    for (const s of [-1, 1]) { B.poly([[cx + s * 14, 88], [cx + s * 27, 110], [cx + s * 25, 124], [cx + s * 12, 120]], 6.5, 2, 'hull2', 3); B.dome(cx + s * 19, 108, 4, 4, 6.5, 9.5, 'glass'); }
    B.dome(cx, 38, 25, 25, 4, 9, 'hull2'); B.dome(cx, 38, 15, 15, 9, 12.5, 'hull'); B.dome(cx, 38, 6.5, 6.5, 12.5, 16, 'glass');
    B.box(cx - 4, 64, 8, 48, 9, 2, 'deck', 6); B.box(cx - 7, 116, 14, 3, 7.5, 1, 'amber', 6);
    for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; B.lights([[cx + Math.cos(a) * 20, 38 + Math.sin(a) * 20]], CYAN); }
    B.greebles(24, 37, [18, 64, 30, 60]);
    const r = render(B.engines([[cx - 6, 135, 4.5], [cx + 6, 135, 4.5]]), { seed: 37 }); r.shield = [cx, 38]; return r; },
  convoyeur: () => { const B = builder(66, 140), cx = 33;
    B.box(cx - 4, 12, 8, 120, 6, 2, 'hull2');
    B.poly(half(cx, [[0, 2], [8, 7], [11, 22], [0, 25]]), 8, 3, 'hull'); B.dome(cx, 11, 3, 3.5, 8, 10.5, 'glass');
    const mats = ['amber', 'hull', 'deck', 'amber', 'hull', 'amber', 'deck', 'hull'];
    [30, 54, 78, 102].forEach((y, k) => { B.box(cx - 27, y, 21, 21, 9 + (k % 2) * .6, 1.6, mats[k * 2], 4); B.box(cx + 6, y, 21, 21, 9.4 - (k % 2) * .6, 1.6, mats[k * 2 + 1], 4);
      for (const x of [cx - 25, cx - 17, cx + 8, cx + 16]) B.box(x, y + 2, 2, 17, 9.9, .4, 'hull2', 9); });
    B.box(cx - 13, 124, 26, 12, 8, 2, 'hull', 3);
    B.lights([[cx, 30], [cx, 54], [cx, 78], [cx, 102]], WARM);
    return render(B.engines([[cx - 7, 137, 4.2], [cx + 7, 137, 4.2]]), { seed: 39 }); },
  artilleur: () => { const B = builder(66, 140), cx = 33;
    B.poly(half(cx, [[0, 14], [6, 20], [11, 36], [17, 62], [17, 118], [10, 132], [0, 134]]), 6, 4, 'hull');
    for (const s of [-1, 1]) { const x0 = s < 0 ? cx - 16 : cx + 4; B.box(x0, 62, 12, 42, 9.5, 2, 'hull2', 5);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 2; c++) B.hole(x0 + 1.5 + c * 5.5, 64.5 + r * 7.8, 4, 5.5, 2.4, 'black'); }
    B.box(cx - 2, 0, 4, 56, 8, 1, 'hull2', 6); B.dome(cx, 56, 6.5, 6.5, 7, 12, 'hull');
    B.box(cx - 15, 108, 30, 3, 7.4, 1, 'amber', 6); B.box(cx - 5, 112, 10, 12, 10, 2, 'hull', 6); B.box(cx - 4, 113, 8, 2, 11, .6, 'glass', 9.5);
    B.greebles(18, 41, [18, 20, 30, 40]);
    return render(B.engines([[cx - 6, 135, 4.5], [cx + 6, 135, 4.5]]), { seed: 41 }); },
  /* ---------- 3 cases ---------- */
  cuirasse: () => { const B = builder(70, 214), cx = 35;
    B.poly(half(cx, [[0, 2], [9, 12], [16, 40], [23, 90], [23, 172], [18, 202], [0, 208]]), 8, 5, 'hull');
    B.poly(half(cx, [[0, 28], [11, 38], [16, 88], [16, 170], [0, 174]]), 11, 3, 'deck', 8);
    for (const y of [56, 92, 160]) { B.dome(cx, y, 10.5, 10.5, 11, 16.5, 'hull2'); B.box(cx - 4.5, y - 27, 2.4, 21, 16.4, .6, 'hull2', 13); B.box(cx + 2.1, y - 27, 2.4, 21, 16.4, .6, 'hull2', 13); }
    B.box(cx - 8, 112, 16, 22, 21, 2.5, 'hull', 11); B.box(cx - 6, 114, 12, 3, 22.5, 1, 'glass', 20); B.box(cx - 1, 120, 2, 12, 25, .5, 'hull2', 21);
    for (const s of [-1, 1]) { B.box(cx + (s < 0 ? -22 : 15), 182, 7, 3, 9, 1, 'amber', 7); B.box(cx + (s < 0 ? -22 : 17), 100, 5, 60, 9.5, 1.5, 'hull2', 7); }
    B.greebles(50, 43, [8, 30, 54, 170]);
    B.lights([[cx - 18, 70], [cx - 18, 80], [cx + 18, 70], [cx + 18, 80], [cx - 18, 176], [cx + 18, 176]], WARM);
    return render(B.engines([[cx - 13, 205, 5.5], [cx, 207, 6.5], [cx + 13, 205, 5.5]]), { seed: 43 }); },
  atelier: () => { const B = builder(70, 214), cx = 35;
    B.box(cx - 6, 10, 12, 196, 8, 2, 'hull2');
    B.poly(half(cx, [[0, 3], [12, 9], [16, 38], [0, 44]]), 10, 4, 'hull'); B.dome(cx, 16, 4, 4, 10, 13, 'glass');
    B.dome(cx, 82, 31, 23, 4, 9.5, 'hull'); B.holeE(cx, 82, 16, 11, 5, 'black'); B.box(cx - 3, 70, 6, 24, 9, 1, 'hull2', 4);
    for (const s of [-1, 1]) { const x = s < 0 ? cx - 31 : cx + 27; B.box(x, 112, 4, 40, 10, 1, 'amber', 6); B.box(s < 0 ? cx - 31 : cx + 17, 110, 14, 3, 11.5, .6, 'amber', 9);
      for (const y of [160, 184]) B.dome(cx + s * 15, y, 9, 11, 4, 12.5, 'deck'); }
    B.box(cx - 14, 196, 28, 12, 8, 2, 'hull', 4);
    B.greebles(40, 47, [8, 40, 54, 160]);
    B.lights([[cx - 22, 82], [cx + 22, 82], [cx, 64], [cx, 100], [cx - 8, 30], [cx + 8, 30]], WARM);
    return render(B.engines([[cx - 8, 209, 5], [cx + 8, 209, 5]]), { seed: 47 }); },
  /* ---------- pirates ---------- */
  brulot: () => { const B = builder(60, 66), cx = 30;
    B.poly(half(cx, [[0, 6], [9, 12], [12, 48], [7, 60], [0, 60]]), 5, 3, 'rust');
    B.dome(cx, 18, 9, 11, 5, 10.5, 'hazard'); B.box(cx - 15, 34, 6, 18, 6.5, 1.5, 'scrap', 3); B.box(cx + 9, 30, 6, 14, 6, 1.5, 'scrap', 3);
    B.greebles(8, 51, [18, 30, 24, 24]); B.lights([[cx - 5, 40], [cx + 5, 46]], REDL);
    return render(B.engines([[cx, 61, 5.5]]), { seed: 51, flip: true }); },
  harponneur: () => { const B = builder(66, 140), cx = 33;
    B.poly([[cx - 20, 2], [cx - 11, 2], [cx - 8, 30], [cx - 16, 36]], 7, 2, 'rust', 3); B.poly([[cx + 11, 6], [cx + 19, 6], [cx + 17, 36], [cx + 9, 30]], 7, 2, 'rust', 3);
    B.poly([[cx, 22], [cx + 15, 30], [cx + 19, 72], [cx + 16, 122], [cx + 8, 134], [cx - 9, 134], [cx - 17, 118], [cx - 19, 70], [cx - 14, 30]], 6, 4, 'scrap');
    B.dome(cx, 46, 8.5, 8.5, 6, 12.5, 'rust'); B.box(cx - 1, 8, 2, 34, 9, .5, 'black', 6);
    B.box(cx - 12, 76, 24, 30, 9.5, 2, 'rust', 6); B.box(cx - 13, 110, 26, 4, 8, 1, 'hazard', 6);
    B.greebles(30, 53, [10, 50, 46, 80]); B.lights([[cx - 6, 64], [cx + 6, 64], [cx, 90]], REDL);
    return render(B.engines([[cx - 6, 135, 5], [cx + 6, 135, 5]]), { seed: 53, flip: true }); },
});

/* ---------- refontes (retours du 13/10) ---------- */
Object.assign(MAT, { cont: { c: [70, 92, 112], spec: .25, plates: 0 }, cont2: { c: [120, 128, 120], spec: .25, plates: 0 } });
Object.assign(SHIPS, {
  // CONVOYEUR : une charpente ouverte (deux longerons + traverses) qui tient les conteneurs, cabine à l'avant, module réacteur à l'arrière
  convoyeur: () => { const B = builder(66, 140), cx = 33;
    B.poly(half(cx, [[0, 1], [7, 4], [11, 12], [11, 22], [0, 24]]), 9, 3.5, 'hull'); B.box(cx - 8, 9, 16, 4, 10, 1, 'glass', 8);
    B.box(cx - 7, 23, 14, 6, 7, 1.5, 'hull2', 3);                                  // collier d'amarrage
    const mats = ['amber', 'cont', 'cont2', 'amber', 'cont', 'amber', 'cont2', 'cont'];
    [30, 52, 74, 96].forEach((y, k) => { for (const [x, m] of [[cx - 24, mats[k * 2]], [cx + 2, mats[k * 2 + 1]]]) { B.box(x, y + 1, 22, 20, 8, 1.2, m, 3);
      for (let r = 2; r < 21; r += 3) B.hole(x + r, y + 2, 1, 18, .35, m); } });   // tôle ondulée des conteneurs
    for (const x of [cx - 26, cx + 23]) B.box(x, 26, 3, 94, 11, 1, 'hull2', 8);   // longerons
    for (const y of [28, 50, 72, 94, 116]) B.box(cx - 26, y, 52, 3, 10.6, .8, 'hull', 8);   // traverses
    B.box(cx - 3, 26, 6, 92, 10.2, 1, 'hull2', 8);                                 // poutre centrale
    B.box(cx - 15, 118, 30, 18, 9, 2.5, 'hull', 3); B.dome(cx, 126, 7, 7, 9, 13.5, 'hull2'); B.dome(cx, 126, 3.5, 3.5, 13.5, 15, 'glass');
    for (const s of [-1, 1]) for (const y of [120, 125, 130]) B.box(s < 0 ? cx - 28 : cx + 15, y, 13, 2, 7, .5, 'hull2', 5);   // radiateurs
    B.lights([[cx - 25, 30], [cx + 24, 30], [cx - 25, 116], [cx + 24, 116], [cx - 4, 10], [cx + 4, 10]], WARM);
    return render(B.engines([[cx - 8, 137, 4.4], [cx + 8, 137, 4.4]]), { seed: 39 }); },
  // ARTILLEUR : frégate lance-missiles à cellules verticales, pas de canon géant
  artilleur: () => { const B = builder(66, 140), cx = 33;
    B.poly(half(cx, [[0, 4], [9, 14], [16, 36], [19, 70], [18, 120], [12, 134], [0, 136]]), 6, 4, 'hull');
    B.poly(half(cx, [[0, 30], [11, 36], [13, 102], [0, 106]]), 8.5, 2, 'deck', 6);
    for (const y0 of [40, 72]) for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const x = cx - 11 + c * 8, y = y0 + r * 7.5;
      B.hole(x, y, 6, 5.5, 1.6, 'black'); if ((r + c + y0) % 3 === 0) B.dome(x + 3, y + 2.8, 1.8, 1.8, 7, 8.4, 'amber'); }
    B.dome(cx, 22, 6, 6, 6, 11, 'hull2'); B.dome(cx, 22, 3, 3, 11, 12.5, 'glass');                // radar de tir
    for (const s of [-1, 1]) { B.box(s < 0 ? cx - 19 : cx + 14, 60, 5, 40, 8, 1.2, 'hull2', 5); B.box(s < 0 ? cx - 18 : cx + 15, 104, 3, 14, 7.5, .8, 'amber', 5); }
    B.box(cx - 7, 108, 14, 14, 12, 2, 'hull', 8); B.box(cx - 6, 109, 12, 3, 13.2, 1, 'glass', 11);
    B.greebles(16, 41, [14, 104, 38, 26]);
    B.lights([[cx - 17, 64], [cx - 17, 76], [cx + 16, 64], [cx + 16, 76]], WARM);
    return render(B.engines([[cx - 7, 137, 4.5], [cx + 7, 137, 4.5]]), { seed: 41 }); },
  // CUIRASSÉ : deux tourelles à l'avant, poste de commandement à l'arrière
  cuirasse: () => { const B = builder(70, 214), cx = 35;
    B.poly(half(cx, [[0, 2], [9, 12], [16, 40], [23, 92], [23, 176], [18, 202], [0, 208]]), 8, 5, 'hull');
    B.poly(half(cx, [[0, 24], [11, 34], [16, 88], [16, 172], [0, 176]]), 11, 3, 'deck', 8);
    for (const y of [56, 96]) { B.dome(cx, y, 11, 11, 11, 17, 'hull2'); B.box(cx - 6, y - 4, 12, 9, 17.5, 1.5, 'hull2', 15);
      B.box(cx - 5, y - 20, 2.6, 16, 16.6, .6, 'hull2', 14); B.box(cx + 2.4, y - 20, 2.6, 16, 16.6, .6, 'hull2', 14); }
    B.box(cx - 10, 136, 20, 30, 18, 2.5, 'hull', 11); B.box(cx - 7, 130, 14, 14, 23, 2, 'hull', 17);   // château arrière
    B.box(cx - 6, 132, 12, 3, 24.4, 1, 'glass', 22); B.box(cx - 1, 140, 2, 18, 27, .5, 'hull2', 23); B.dome(cx, 158, 4, 4, 18, 21, 'hull2');
    for (const s of [-1, 1]) { B.dome(cx + s * 17, 124, 4, 4, 9, 12.5, 'hull2'); B.dome(cx + s * 17, 150, 4, 4, 9, 12.5, 'hull2');   // défense rapprochée
      B.box(s < 0 ? cx - 22 : cx + 15, 182, 7, 3, 9, 1, 'amber', 7); B.box(s < 0 ? cx - 21 : cx + 17, 70, 4, 44, 9.6, 1.2, 'amber', 8); }
    B.greebles(40, 43, [10, 110, 50, 70]);
    B.lights([[cx - 8, 172], [cx + 8, 172], [cx - 18, 100], [cx + 18, 100], [cx - 18, 168], [cx + 18, 168]], WARM);
    return render(B.engines([[cx - 13, 205, 5.5], [cx, 207, 6.5], [cx + 13, 205, 5.5]]), { seed: 43 }); },
  // ATELIER MOBILE : un bassin de radoub ouvert, deux portiques comme dans un port à conteneurs
  atelier: () => { const B = builder(70, 214), cx = 35;
    B.poly(half(cx, [[0, 4], [14, 10], [22, 30], [24, 180], [18, 200], [0, 204]]), 8, 4, 'hull');
    B.hole(cx - 16, 44, 32, 126, 4.5, 'black');                                         // le bassin
    B.greebles(26, 49, [cx - 15, 46, 30, 120]);
    B.poly(half(cx, [[0, 64], [5, 70], [6, 100], [3, 106], [0, 106]]), 7, 2, 'hull', 3.5);   // un chasseur en réparation dans le bassin
    for (const s of [-1, 1]) { B.box(s < 0 ? cx - 23 : cx + 18, 40, 5, 134, 10.5, 1, 'hull2', 8); for (let y = 44; y < 170; y += 8) B.box(s < 0 ? cx - 22 : cx + 19, y, 3, 1, 10.8, .3, 'hull', 10.4); }
    for (const y of [74, 124]) {                                                         // portiques : pieds sur les rails, poutre au-dessus du bassin
      for (const s of [-1, 1]) B.box(s < 0 ? cx - 26 : cx + 18, y - 3, 8, 12, 16, 1.5, 'amber', 10.5);
      B.box(cx - 30, y, 60, 6, 19, 1.4, 'amber', 15); B.box(cx - 30, y + 1, 60, 1, 19.6, .3, 'hull2', 19);
      B.box(cx - 4, y - 2, 8, 10, 21, 1.4, 'hull2', 19); B.box(cx - 1, y + 8, 2, 5, 14, .4, 'hull2', 8); }
    B.box(cx - 13, 10, 26, 26, 12, 3, 'hull', 8); B.box(cx - 10, 12, 20, 4, 13.4, 1, 'glass', 11);
    B.box(cx - 16, 176, 32, 22, 11, 3, 'hull', 8); B.dome(cx, 186, 7, 7, 11, 15, 'hull2');
    B.lights([[cx - 21, 44], [cx + 20, 44], [cx - 21, 168], [cx + 20, 168], [cx - 2, 86], [cx - 2, 136]], WARM);
    return render(B.engines([[cx - 9, 205, 5], [cx + 9, 205, 5]]), { seed: 47 }); },
  // INTERCEPTEUR pirate, symétrique
  intercepteur: () => { const B = builder(60, 66), cx = 30;
    B.poly(half(cx, [[0, 3], [5, 16], [8, 30], [26, 48], [25, 55], [9, 48], [7, 60], [0, 60]]), 5, 3, 'rust');
    for (const s of [-1, 1]) { B.poly([[cx + s * 15, 38], [cx + s * 24, 47], [cx + s * 22, 50], [cx + s * 13, 42]], 6.4, 1, 'hazard', 4); B.box(cx + (s < 0 ? -12 : 10), 26, 2, 14, 6.4, .5, 'scrap', 4); }
    B.box(cx - 5, 30, 10, 18, 8, 2, 'scrap', 4); B.dome(cx, 20, 2.6, 5, 6, 9, 'glass');
    B.greebles(8, 13, [16, 28, 28, 20]); B.lights([[cx - 4, 34], [cx + 4, 34]], REDL);
    return render(B.engines([[cx - 4, 61, 3.8], [cx + 4, 61, 3.8]]), { seed: 13, flip: true }); },
  // BRÛLOT : un remorqueur qui pousse une grosse charge cylindrique cerclée de bandes de danger
  brulot: () => { const B = builder(60, 66), cx = 30;
    B.box(cx - 12, 4, 24, 34, 9, 7, 'rust');                                            // la charge (biseau large = cylindre)
    for (const y of [11, 25]) B.paint(cx - 12, y, 24, 5, 'hazard');
    for (const x of [cx - 7, cx - 1, cx + 5]) B.box(x, 1, 2, 5, 6, .5, 'scrap', 3);       // détonateurs
    B.box(cx - 3, 36, 6, 6, 6, 1, 'hull2', 3);                                         // attelage
    B.poly(half(cx, [[0, 40], [9, 42], [11, 56], [7, 61], [0, 61]]), 6.5, 2.5, 'scrap'); B.dome(cx, 47, 2.5, 2.5, 6.5, 8.5, 'glass');
    B.lights([[cx - 8, 20], [cx + 8, 20]], REDL);
    return render(B.engines([[cx - 5, 62, 3.6], [cx + 5, 62, 3.6]]), { seed: 51, flip: true }); },
  // HARPONNEUR : bras fins articulés sur les côtés, harpon au centre
  harponneur: () => { const B = builder(66, 140), cx = 33;
    B.poly(half(cx, [[0, 20], [10, 26], [15, 60], [15, 118], [9, 134], [0, 134]]), 6, 4, 'scrap');
    B.box(cx - 3, 6, 6, 18, 8, 1.2, 'hull2', 5); B.dome(cx, 8, 2.5, 2.5, 8, 9.5, 'hazard');    // harpon
    for (const s of [-1, 1]) {                                                         // bras fins repliés le long de la coque
      B.poly([[cx + s * 14, 64], [cx + s * 20, 60], [cx + s * 20, 36], [cx + s * 15, 40]], 8.6, 1, 'rust', 5);
      B.poly([[cx + s * 17, 38], [cx + s * 21, 35], [cx + s * 15, 12], [cx + s * 11, 14]], 9, 1, 'rust', 5);
      B.dome(cx + s * 17.5, 37, 3, 3, 8.6, 11, 'scrap'); B.dome(cx + s * 12.5, 12, 2.6, 2.6, 8, 10.5, 'hazard'); }
    B.dome(cx, 46, 7, 7, 6, 11, 'rust'); B.box(cx - 10, 78, 20, 26, 9.5, 2, 'rust', 6); B.box(cx - 11, 108, 22, 4, 8, 1, 'hazard', 6);
    B.greebles(26, 53, [12, 50, 42, 80]); B.lights([[cx - 6, 64], [cx + 6, 64], [cx, 92]], REDL);
    return render(B.engines([[cx - 6, 135, 5], [cx + 6, 135, 5]]), { seed: 53, flip: true }); },
});

// astéroïdes : rochers irréguliers au bruit fractal, cratères
function rock(size, seed) {
  const [c, g] = mk(size, size), img = g.createImageData(size, size), r0 = size * .42;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = x - size / 2, dy = y - size / 2, a = Math.atan2(dy, dx), rr = r0 * (.82 + fbm(Math.cos(a) * 1.4 + 3, Math.sin(a) * 1.4, seed, 3) * .36), d = Math.hypot(dx, dy) / rr;
    if (d > 1) continue;
    const nz = Math.sqrt(1 - d * d), nx = dx / rr, ny = dy / rr, tex = fbm(x * .2, y * .2, seed + 9);
    let l = clamp(nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) * .85 + (tex - .5) * .35;
    if (d > .92) l *= .7;
    const [R, G, B] = grad(['#0e0d0e', '#2e2a28', '#5a524c', '#8a8076', '#b0a698'].map(hex), l), k = (y * size + x) * 4;
    img.data[k] = R; img.data[k + 1] = G; img.data[k + 2] = B; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0); return c;
}

/* =====================================================================
   DÉCOR : nébuleuse en bruit fractal, étoiles, planète avec atmosphère
   ===================================================================== */
function space(seed, tint, planet) {
  const [c, g] = mk(W, H), img = g.createImageData(W, H), R = rnd(seed);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x / 210, y / 210, seed, 5), m = fbm(x / 90 + 7, y / 90, seed + 3, 3), d = clamp((n - .42) * 2.2) * (.6 + m * .6);
    const k = (y * W + x) * 4;
    img.data[k] = 3 + tint[0] * d * .55 + tint[3] * d * d * .4; img.data[k + 1] = 5 + tint[1] * d * .55 + tint[4] * d * d * .4; img.data[k + 2] = 10 + tint[2] * d * .55 + tint[5] * d * d * .4; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 900; i++) { const x = R() * W, y = R() * H, s = R(), a = .25 + s * .75; g.fillStyle = `rgba(${s > .9 ? '255,236,210' : s > .7 ? '210,224,255' : '200,210,235'},${a})`; g.fillRect(x, y, s > .97 ? 2 : 1, s > .97 ? 2 : 1); }
  for (let i = 0; i < 6; i++) { const x = R() * W, y = R() * H, gr = g.createRadialGradient(x, y, 0, x, y, 9); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.15, 'rgba(200,220,255,.35)'); gr.addColorStop(1, 'rgba(200,220,255,0)'); g.fillStyle = gr; g.fillRect(x - 9, y - 9, 18, 18); }
  if (planet) drawPlanet(g, ...planet);
  return c;
}
function drawPlanet(g, cx, cy, r, seed, cols, atm, cityLights) {
  const x0 = Math.max(0, cx - r - 30 | 0), x1 = Math.min(W, cx + r + 30 | 0), y0 = Math.max(0, cy - r - 30 | 0), y1 = Math.min(H, cy + r + 30 | 0);
  const img = g.getImageData(x0, y0, x1 - x0, y1 - y0), L2 = [-.7, -.35, .62];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const dx = (x - cx) / r, dy = (y - cy) / r, d2 = dx * dx + dy * dy, k = ((y - y0) * (x1 - x0) + (x - x0)) * 4;
    const d = Math.sqrt(d2);
    if (d > 1) { // halo de l'atmosphère
      const a = clamp(1 - (d - 1) * r / 26) ** 2 * clamp(.2 - (dx * L2[0] + dy * L2[1]) * .9);
      img.data[k] = mix(img.data[k], atm[0], a); img.data[k + 1] = mix(img.data[k + 1], atm[1], a); img.data[k + 2] = mix(img.data[k + 2], atm[2], a); continue;
    }
    const nz = Math.sqrt(Math.max(0, 1 - d2)), lit = clamp(dx * L2[0] + dy * L2[1] + nz * L2[2]);
    const u = Math.atan2(dx, nz) * 1.4, v = dy * 2.2, n = fbm(u * 2.2 + 5, v * 2.2, seed, 5), cl = fbm(u * 4, v * 6, seed + 7, 4);
    let col = grad(cols, n); const cloud = clamp((cl - .55) * 3);
    col = col.map((c0, i) => mix(c0, 235, cloud * .8));
    const sh = Math.pow(lit, .8), limb = Math.pow(1 - nz, 3);
    let [R, G, B] = col.map(c0 => c0 * sh);
    R = mix(R, atm[0], limb * .7 * clamp(lit + .2)); G = mix(G, atm[1], limb * .7 * clamp(lit + .2)); B = mix(B, atm[2], limb * .7 * clamp(lit + .2));
    if (cityLights && lit < .08 && n > .5 && hash(x >> 1, y >> 1, 4) > .93) { R = 255; G = 190; B = 110; }
    img.data[k] = R; img.data[k + 1] = G; img.data[k + 2] = B;
  }
  g.putImageData(img, x0, y0);
}

/* ---------- cache et dessin ---------- */
const CACHE = {}, TIMES = {};
function get(id) {
  if (!CACHE[id]) { const t0 = performance.now(); CACHE[id] = SHIPS[id](); TIMES[id] = performance.now() - t0; }
  return CACHE[id];
}
// cases occupées par un sprite (d'après sa hauteur)
const cellsOf = s => s.h > 180 ? 3 : s.h > 100 ? 2 : 1;
function drawShip(g, s, x, y, sc = 1, t = 0, alpha = 1) {
  g.save(); g.translate(x, y); g.scale(sc, sc); g.globalAlpha = alpha;
  g.globalCompositeOperation = 'lighter';
  for (const [ex, ey, er] of s.engines) {
    const fx = ex - s.w / 2, fy = ey - s.h / 2, dir = s.flip ? -1 : 1, len = er * 5 * (1 + Math.sin(t * 23 + ex) * .12);
    const gr = g.createRadialGradient(fx, fy, 0, fx, fy + dir * len * .4, len);
    gr.addColorStop(0, s.flip ? 'rgba(255,170,110,.95)' : 'rgba(170,220,255,.95)'); gr.addColorStop(.3, s.flip ? 'rgba(255,90,40,.45)' : 'rgba(80,150,255,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(fx - len, fy - len, len * 2, len * 2);
  }
  g.globalCompositeOperation = 'source-over';
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(s.img, -s.w / 2, -s.h / 2);
  g.restore();
}
window.NebulaVaisseaux = { W, H, TAU, mk, rnd, hash, vnoise, fbm, mix, clamp, hex, grad, MAT, builder, render, half, SHIPS, get, TIMES, cellsOf, drawShip, rock, space, drawPlanet, WARM, REDL, CYAN };
})();

/* =====================================================================
   TRANCHES · sprite stacking des vaisseaux de Nebula (direction B de
   maquettes/nebula-sprite-stacking.html : lumière fixe).
   Chaque sprite de commun/vaisseaux.js est une carte de hauteurs : on la
   découpe en tranches d'un pixel, empilées sous une caméra inclinée, et
   le vaisseau est rééclairé selon son cap (le soleil reste en haut à gauche).
   - Tranches.prep(id, f) : prépare le vaisseau réduit d'un facteur f
     (f = taille affichée / taille du sprite : une tranche = un pixel à l'écran).
   - Tranches.draw(g, P, x, y, ang, opt) : dessine la pile centrée en (x, y),
     ang = rotation du sprite (comme ctx.rotate), opt = { tilt, ex, sc, t, glow, shadow, flash, tint }.
     Chaque cap (48 par tour) est assemblé une seule fois en une image : un drawImage par vaisseau.
   À charger après commun/vaisseaux.js, AVANT de fabriquer les sprites :
   il appelle NebulaVaisseaux.keepHeights(true).
   ===================================================================== */
(function () {
'use strict';
const V = window.NebulaVaisseaux;
V.keepHeights(true);
const TAU = Math.PI * 2, BUCKETS = 48;
const LIGHT = (() => { const v = [-.5, -.62, .6], n = Math.hypot(...v); return v.map(x => x / n); })();
const LH = (() => { const n = Math.hypot(LIGHT[0], LIGHT[1]); return [LIGHT[0] / n, LIGHT[1] / n]; })();
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/* réduction de la carte de hauteurs : couleur moyenne, hauteur moyenne des pixels pleins (×f) */
function shrink(s, f) {
  const { w, h, H, glow } = s.hm, D = s.img.getContext('2d').getImageData(0, 0, w, h).data;
  if (f >= .999) return { w, h, H: Float32Array.from(H), D, glow: glow.map(([x, y]) => [x, y]) };
  const w2 = Math.max(1, Math.ceil(w * f)), h2 = Math.max(1, Math.ceil(h * f)), N2 = w2 * h2;
  const H2 = new Float32Array(N2).fill(-99), D2 = new Uint8ClampedArray(N2 * 4), acc = new Float32Array(N2 * 6);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, j = Math.min(h2 - 1, y * f | 0) * w2 + Math.min(w2 - 1, x * f | 0), a = j * 6;
    acc[a + 5]++; if (H[i] < -50) continue;
    acc[a] += D[i * 4]; acc[a + 1] += D[i * 4 + 1]; acc[a + 2] += D[i * 4 + 2]; acc[a + 3] += H[i]; acc[a + 4]++;
  }
  for (let j = 0; j < N2; j++) { const a = j * 6, n = acc[a + 4]; if (!n || n < acc[a + 5] * .4) continue;
    D2[j * 4] = acc[a] / n; D2[j * 4 + 1] = acc[a + 1] / n; D2[j * 4 + 2] = acc[a + 2] / n; D2[j * 4 + 3] = 255; H2[j] = acc[a + 3] / n * f; }
  return { w: w2, h: h2, H: H2, D: D2, glow: glow.map(([x, y]) => [x * f, y * f]) };
}

const PREP = {};
function prep(id, f = 1) {
  const key = id + '@' + f.toFixed(3);
  if (PREP[key]) return PREP[key];
  const s = V.get(id);
  if (!s.hm) throw new Error('Tranches : sprite « ' + id + ' » fabriqué avant keepHeights(true)');
  const { w, h, H, D, glow } = shrink(s, f), N = w * h;
  const top = new Int16Array(N).fill(-1); let zmax = 1;
  for (let i = 0; i < N; i++) if (H[i] > -50) { top[i] = Math.max(0, Math.floor(H[i])); zmax = Math.max(zmax, top[i]); }
  const at = (x, y, z) => (x < 0 || y < 0 || x >= w || y >= h || H[y * w + x] < -50) ? z - 3 * f : Math.max(H[y * w + x], z - 3 * f);
  const nx = new Float32Array(N), ny = new Float32Array(N), nz = new Float32Array(N), Lb = new Float32Array(N), lit = new Uint8Array(N);
  const k = .55 / Math.max(.25, f);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; if (top[i] < 0) continue; const z = H[i];
    const a = (at(x - 1, y, z) - at(x + 1, y, z)) * k, b = (at(x, y - 1, z) - at(x, y + 1, z)) * k, n = Math.hypot(a, b, 1);
    nx[i] = a / n; ny[i] = b / n; nz[i] = 1 / n;
    Lb[i] = .22 + .95 * Math.max(0, nx[i] * LIGHT[0] + ny[i] * LIGHT[1] + nz[i] * LIGHT[2]);
  }
  for (const [x, y] of glow) { const i = Math.round(y) * w + Math.round(x); if (i >= 0 && i < N) lit[i] = 1; }
  // ombre portée : la silhouette en noir
  const sh = mk(w, h), sg = sh.getContext('2d'), si = sg.createImageData(w, h);
  for (let i = 0; i < N; i++) if (top[i] >= 0) si.data[i * 4 + 3] = 255;
  sg.putImageData(si, 0, 0);
  return PREP[key] = { id, f, s, w, h, H, D, top, zmax, nl: zmax + 1, nx, ny, nz, Lb, lit, shadow: sh, cache: new Map(),
    engines: s.engines.map(([x, y, r]) => [x * f, y * f, r * f]), foe: !!s.flip };
}

/* atlas des tranches (côte à côte) éclairées pour un cap donné (48 caps) */
function atlas(P, bk) {
  const { w, h, nl, top, D, zmax } = P, a = bk / BUCKETS * TAU, ca = Math.cos(a), sa = Math.sin(a);
  const lx = LIGHT[0] * ca + LIGHT[1] * sa, ly = -LIGHT[0] * sa + LIGHT[1] * ca, hx = LH[0] * ca + LH[1] * sa, hy = -LH[0] * sa + LH[1] * ca;
  const c = mk(w * nl, h), g = c.getContext('2d'), img = g.createImageData(w * nl, h), O = img.data, W2 = w * nl;
  const low = (x, y, k) => (x < 0 || y < 0 || x >= w || y >= h || top[y * w + x] < k) ? 1 : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, t = top[i]; if (t < 0) continue;
    const r0 = D[i * 4], g0 = D[i * 4 + 1], b0 = D[i * 4 + 2], al = 1 / Math.max(.35, P.Lb[i]);
    for (let k = 0; k <= t; k++) {
      let r, gg, b;
      if (k === t) {   // dessus de la colonne : rééclairé
        if (P.lit[i]) { r = r0; gg = g0; b = b0; }
        else { const dif = Math.max(0, P.nx[i] * lx + P.ny[i] * ly + P.nz[i] * LIGHT[2]), f = Math.min(3, Math.max(.3, (.22 + .95 * dif) / P.Lb[i])); r = r0 * f; gg = g0 * f; b = b0 * f; }
      } else {         // flanc : normale vers les voisins plus bas que la tranche
        const k1 = k + 1, hv = k / zmax;
        let ex = low(x + 1, y, k1) - low(x - 1, y, k1), ey = low(x, y + 1, k1) - low(x, y - 1, k1);
        const d1 = low(x + 1, y + 1, k1) - low(x - 1, y - 1, k1), d2 = low(x + 1, y - 1, k1) - low(x - 1, y + 1, k1);
        ex += (d1 + d2) * .5; ey += (d1 - d2) * .5;
        const n = Math.hypot(ex, ey) || 1, d = (ex * hx + ey * hy) / n, f = (.18 + .62 * Math.max(0, d)) * (.6 + .4 * hv) * al, rim = Math.max(0, -d);
        r = r0 * f + rim * 10; gg = g0 * f + rim * 26; b = b0 * f + rim * 48;
      }
      const o = (y * W2 + k * w + x) * 4; O[o] = r; O[o + 1] = gg; O[o + 2] = b; O[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}

const GL = {};
function glowImg(foe) {
  if (GL[foe]) return GL[foe];
  const c = mk(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, foe ? 'rgba(255,170,110,.95)' : 'rgba(170,220,255,.95)'); gr.addColorStop(.3, foe ? 'rgba(255,90,40,.45)' : 'rgba(80,150,255,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return GL[foe] = c;
}

/* pile assemblée une fois par cap (48 caps) : tranches empilées + ombre portée, dans une seule image */
function compose(P, bk, tilt, ex, shadow, tint) {
  const key = bk + '|' + tilt + '|' + ex + '|' + shadow + '|' + (tint || ''), hit = P.cache.get(key); if (hit) return hit;
  const A = atlas(P, bk), { w, h, nl } = P, a = bk / BUCKETS * TAU, ct = Math.cos(tilt), lift = Math.sin(tilt) * ex;
  const D = Math.ceil(Math.hypot(w, h)) + 2, so = shadow ? nl * lift * .9 : 0, m = Math.max(1, Math.ceil(lift * 1.2));
  const ox = 2 + D / 2, oyb = 2 + nl * lift + D * ct / 2, c = mk(Math.ceil(D + so + 4), Math.ceil(oyb + D * ct / 2 + so + 2)), g = c.getContext('2d');
  const ca = Math.cos(a), sa = Math.sin(a), put = (e, f) => g.setTransform(ca, ct * sa, -sa, ct * ca, e, f);
  for (let k = 0; k < nl; k++) for (let j = 0; j < (k === nl - 1 ? 1 : m); j++) { put(ox, oyb - (k + j / m) * lift); g.drawImage(A, k * w, 0, w, h, -w / 2, -h / 2, w, h); }
  // teinte de camp (couleur CSS avec transparence) : posée sur le vaisseau seulement
  if (tint) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = tint; g.fillRect(0, 0, c.width, c.height); }
  if (shadow) { g.globalCompositeOperation = 'destination-over'; g.globalAlpha = shadow; put(ox + so, oyb + so); g.drawImage(P.shadow, -w / 2, -h / 2); }
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  const r = { c, ox, oy: oyb - nl * lift / 2 };
  P.cache.set(key, r); return r;
}

/* dessin : (x, y) = centre du vaisseau à mi-hauteur, ang = rotation du sprite (comme ctx.rotate).
   L'image du cap le plus proche est tournée du petit reste (moins de 4 degrés). */
function draw(g, P, x, y, ang, opt = {}) {
  const tilt = opt.tilt ?? .55, ex = opt.ex ?? 1.3, sc = opt.sc ?? 1, t = opt.t || 0;
  const u = ang / TAU * BUCKETS, bk = ((Math.round(u) % BUCKETS) + BUCKETS) % BUCKETS, rest = (u - Math.round(u)) / BUCKETS * TAU;
  const C = compose(P, bk, tilt, ex, opt.shadow || 0, opt.tint);
  g.save(); g.translate(x, y); g.rotate(rest); g.scale(sc, sc);
  g.drawImage(C.c, -C.ox, -C.oy);
  if (opt.flash) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = opt.flash; g.drawImage(C.c, -C.ox, -C.oy); }
  g.restore();
  if (opt.glow !== false && P.engines.length) {   // réacteurs, à mi-hauteur, vers l'arrière
    const rear = P.foe ? -1 : 1, G = glowImg(P.foe ? 1 : 0), lift = Math.sin(tilt) * ex * sc;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.translate(x, y + P.nl * lift / 2 - P.zmax * .45 * lift); g.scale(1, Math.cos(tilt)); g.rotate(ang); g.scale(sc, sc);
    for (const [exx, eyy, er] of P.engines) { const L = er * 5 * (1 + Math.sin(t * 23 + exx) * .12); g.drawImage(G, exx - P.w / 2 - L, eyy - P.h / 2 + rear * er * .6 - L, L * 2, L * 2); }
    g.restore();
  }
}
window.Tranches = { prep, draw, compose, LIGHT };
})();

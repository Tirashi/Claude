/* =====================================================================
   Injagility : les chiens en 32 bits, partagés par le mode Infini et le
   mode Parcours. Chaque chien est monté comme un squelette (corps, cou,
   tête, oreilles, queue, quatre pattes articulées), peint en pixels
   ombrés, puis mis en cache image par image.
   ===================================================================== */
(function () {
"use strict";
/* =====================================================================
   Petit moteur de pixel art : des formes (ellipses, capsules) ombrées
   comme des volumes, avec un contour sélectif entre les parties.
   ===================================================================== */
const RAMP = {
  black: ["#4a4459", "#302a3b", "#231e2d", "#17131e"],
  white: ["#ffffff", "#f1ece2", "#d3cbbd", "#ab9f8e"],
  rust:  ["#f0a060", "#cf6a2e", "#a24c1f", "#733416"],
  pink:  ["#ffb0c0", "#ef7f98", "#c85a72", "#93384f"],
};
const OUT = "#120c16";
const L3 = (() => { const v = [-0.5, -0.78, 0.55], n = Math.hypot(...v); return v.map(x => x / n); })();
// petites mèches : la limite entre deux nuances suit des traits obliques, comme des touffes de poils
const furNoise = (x, y) => ((y * 3 + Math.floor((x + (y % 2) * 3) / 6)) % 5 === 0 ? .07 : 0);
function shadeIdx(n, x, y, fur){
  let l = n[0] * L3[0] + n[1] * L3[1] + n[2] * L3[2];
  if (fur) l += furNoise(x, y);
  return l > .86 ? 0 : l > .3 ? 1 : l > -.12 ? 2 : 3;
}
// une ellipse (rx, ry, rotation) : renvoie la normale « bombée » du point, ou null
const ell = (cx, cy, rx, ry, rot = 0) => ({
  box: [cx - Math.max(rx, ry) - 1, cy - Math.max(rx, ry) - 1, cx + Math.max(rx, ry) + 1, cy + Math.max(rx, ry) + 1],
  hit(x, y){
    const dx = x - cx, dy = y - cy, c = Math.cos(rot), s = Math.sin(rot);
    const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry, d2 = u * u + v * v;
    if (d2 > 1) return null;
    const nx = u * c - v * s, ny = u * s + v * c;
    return {n: [nx, ny, Math.sqrt(Math.max(0, 1 - d2))], s: 0};
  }
});
// une capsule de (x1,y1) à (x2,y2), rayon r1 puis r2 : renvoie aussi la position le long (0 → 1)
const cap = (x1, y1, x2, y2, r1, r2 = r1) => ({
  box: [Math.min(x1, x2) - Math.max(r1, r2) - 1, Math.min(y1, y2) - Math.max(r1, r2) - 1, Math.max(x1, x2) + Math.max(r1, r2) + 1, Math.max(y1, y2) + Math.max(r1, r2) + 1],
  hit(x, y){
    const vx = x2 - x1, vy = y2 - y1, len2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / len2));
    const px = x1 + vx * t, py = y1 + vy * t, r = r1 + (r2 - r1) * t;
    const dx = (x - px) / r, dy = (y - py) / r, d2 = dx * dx + dy * dy;
    if (d2 > 1) return null;
    return {n: [dx, dy, Math.sqrt(Math.max(0, 1 - d2))], s: t};
  }
});

function Canvas(w, h){
  const col = new Array(w * h).fill(null), part = new Int16Array(w * h).fill(-1), grp = new Int16Array(w * h).fill(-1);
  // dessine une forme ; o = {mat, id, far, on: [ids] (marque posée sur ces parties), flat}
  function draw(shape, o){
    const [x0, y0, x1, y1] = shape.box.map(Math.floor), hits = new Map();
    for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1 + 1); y++)
      for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1 + 1); x++){
        const r = shape.hit(x + .5, y + .5); if (r) hits.set(y * w + x, r);
      }
    const inside = i => hits.has(i);
    for (const [i, r] of hits){
      if (o.on && !o.on.includes(part[i])) continue;
      const x = i % w, y = (i / w) | 0;
      let k = shadeIdx(r.n, x, y, FUR_ON && o.fur !== false) + (o.far ? 1 : 0);
      if (!o.on && !o.flat){
        // contour sélectif : le bord d'une partie posée devant une autre prend la nuance la plus sombre
        const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
        const g0 = o.group ?? o.id;
        if (nb.some(j => j >= 0 && j < w * h && !inside(j) && col[j] !== null && grp[j] !== g0)) k = 3;
      }
      const m = typeof o.mat === "function" ? o.mat(r.s, x, y) : o.mat;
      col[i] = RAMP[m][Math.min(3, k)];
      if (!o.on){ part[i] = o.id; grp[i] = o.group ?? o.id; }
    }
  }
  function fringe(groups, every, maxLen, seed = 0){
    const hash = x => ((x + seed) * 2654435761 >>> 0) % 997;
    for (let x = 0; x < w; x++){
      if (hash(x) % every) continue;
      let y0 = -1;
      for (let y = h - 2; y >= 0; y--){ const i = y * w + x; if (col[i] !== null && groups.includes(grp[i])){ y0 = y; break; } }
      if (y0 < 0 || col[(y0 + 1) * w + x] !== null) continue;
      const c = col[y0 * w + x], len = 2 + hash(x * 7) % (maxLen - 1);
      for (let k = 1; k <= len; k++){
        const xx = x - Math.floor(k / 2), j = (y0 + k) * w + xx;
        if (xx < 0 || y0 + k >= h || col[j] !== null) break;
        col[j] = c; grp[j] = -2;
      }
    }
  }
  function px(x, y, c){ x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) col[y * w + x] = c; }
  function toCanvas(outline = true){
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const g = cv.getContext("2d"), img = g.createImageData(w, h);
    const put = (i, hex) => { const v = parseInt(hex.slice(1), 16); img.data.set([v >> 16, v >> 8 & 255, v & 255, 255], i * 4); };
    for (let i = 0; i < w * h; i++){
      if (col[i] !== null){ put(i, col[i]); continue; }
      if (!outline) continue;
      const x = i % w;
      if ((x > 0 && col[i - 1] !== null) || (x < w - 1 && col[i + 1] !== null) || (i >= w && col[i - w] !== null) || (i + w < w * h && col[i + w] !== null)) put(i, OUT);
    }
    g.putImageData(img, 0, 0); return cv;
  }
  return {draw, px, fringe, toCanvas};
}

/* =====================================================================
   Les chiens, montés comme un squelette : corps, cou, tête, oreilles,
   queue, et quatre pattes articulées. Chaque race change les proportions,
   les couleurs, les marques, les oreilles, la queue et le poil.
   ===================================================================== */
const SW = 86, SH = 64, GROUND = 58;    // taille d'une image, et ligne du sol dans l'image
const BID = {body: 1, neck: 2, head: 3, muzzle: 4, ear: 5, tail: 6, legF: 7, legH: 8, farF: 9, farH: 10, thigh: 11};
const R = {
  noir:   RAMP.black,
  blanc:  RAMP.white,
  feu:    RAMP.rust,
  fauve:  ["#f6cf8e", "#dca15a", "#ad7334", "#7a4c1f"],
  or:     ["#ffe2a6", "#e9b866", "#c38b40", "#8c5e26"],
  merle:  ["#e3e8ee", "#b4bdc9", "#8892a1", "#5e6776"],
  cuivre: ["#f2a868", "#d27838", "#a5531f", "#743817"],
  sable:  ["#ffd08a", "#e2953e", "#b16a24", "#7a4517"],
};
const BREEDS = [
  {id: "bernois", name: "BOUVIER BERNOIS", s: 1, coat: R.noir, pts: R.feu, wh: R.blanc,
   head: "coat", muzzle: "wh", blaze: 1, cheeks: 1, brows: 1, chest: 1, chestPts: 1,
   leg: {lower: "pts", from: .45, paw: "wh", meta: "pts"}, ear: "drop", tail: {n: 7, r: 4.3, a: -.85, curl: .17, tip: "wh"},
   fringe: [4, 3], tailFringe: [2, 4], fur: true, body: 1, legLen: 1, slim: 1.05, muzzleLen: 1, muzzleH: 1},
  {id: "jack", name: "JACK RUSSELL", s: .64, coat: R.blanc, pts: R.fauve, wh: R.blanc,
   head: "pts", muzzle: "wh", blaze: 1, patch: 1,
   leg: {lower: "coat", from: 1, paw: "coat", meta: "coat"}, ear: "prick", tail: {n: 4, r: 3.4, a: 1.15, curl: -.08},
   fur: false, body: .98, legLen: 1.08, slim: .85, muzzleLen: 1.05, muzzleH: .9},
  {id: "golden", name: "GOLDEN RETRIEVER", s: .95, coat: R.or, pts: R.or, wh: R.or,
   head: "coat", muzzle: "coat",
   leg: {lower: "coat", from: 1, paw: "coat", meta: "coat"}, ear: "dropBig", tail: {n: 8, r: 3.6, a: -.45, curl: .05},
   fringe: [2, 5], tailFringe: [1, 6], fur: true, body: 1.02, legLen: 1.02, slim: .95, muzzleLen: 1.18, muzzleH: .95},
  {id: "border", name: "BORDER COLLIE", s: .86, coat: R.noir, pts: R.noir, wh: R.blanc,
   head: "coat", muzzle: "wh", blaze: 1, chest: 1, collar: 1,
   leg: {lower: "wh", from: .2, paw: "wh", meta: "wh"}, ear: "dropBig", tail: {n: 8, r: 3.4, a: -1.05, curl: .2, tip: "wh"},
   fringe: [5, 3], tailFringe: [3, 3], fur: true, body: 1.04, legLen: 1.05, slim: .85, muzzleLen: 1.08, muzzleH: .88},
  {id: "aussie", name: "BERGER AUSTRALIEN", s: .88, coat: R.merle, pts: R.cuivre, wh: R.blanc, merle: R.noir,
   head: "coat", muzzle: "wh", blaze: 1, cheeks: 1, brows: 1, chest: 1, collar: 1, spots: 1,
   leg: {lower: "pts", from: .5, paw: "wh", meta: "pts"}, ear: "dropBig", tail: {n: 2, r: 3.8, a: -.5, curl: 0},
   fringe: [4, 3], fur: true, body: .98, legLen: 1, slim: .95, muzzleLen: 1.05, muzzleH: .95},
  {id: "sheltie", name: "BERGER DES SHETLAND", s: .72, coat: R.sable, pts: R.sable, wh: R.blanc,
   head: "coat", muzzle: "coat", blaze: .6, chest: 1, collar: 1, mane: 1,
   leg: {lower: "wh", from: .3, paw: "wh", meta: "wh"}, ear: "semi", tail: {n: 8, r: 4, a: -1.1, curl: .18, tip: "wh"},
   fringe: [2, 4], tailFringe: [1, 5], fur: true, body: .96, legLen: 1, slim: .8, muzzleLen: 1.22, muzzleH: .78},
];
let FUR_ON = true;

function dogFrame(P, B){
  RAMP.coat = B.coat; RAMP.pts = B.pts; RAMP.wh = B.wh; RAMP.merle = B.merle || B.coat; RAMP.nose = R.noir; FUR_ON = B.fur;
  const C = Canvas(SW, SH), s = B.s;
  const bx = 36 + (1 - s) * 12, by = GROUND - s * (5 + 23 * B.legLen) + P.bob * s, rot = P.pitch;
  const T = (lx, ly) => { lx *= s; ly *= s; return [bx + lx * Math.cos(rot) - ly * Math.sin(rot), by + lx * Math.sin(rot) + ly * Math.cos(rot)]; };
  const E = (p, rx, ry, a) => ell(p[0], p[1], rx * s, ry * s, a);
  const dir = a => [Math.sin(a), Math.cos(a)];   // 0 = vers le bas, positif = vers l'avant
  const L = B.legLen * s, W = B.slim * s, lg = B.leg;

  // patte avant : épaule → coude → paturon
  function front(anchor, a1, a2, far){
    const [ax, ay] = T(...anchor), d1 = dir(a1 + rot), K = [ax + d1[0] * 9 * L, ay + d1[1] * 9 * L], d2 = dir(a2 + rot), F = [K[0] + d2[0] * 10 * L, K[1] + d2[1] * 10 * L];
    const id = far ? BID.farF : BID.legF;
    C.draw(cap(ax, ay, K[0], K[1], 3.6 * W, 2.8 * W), {mat: lg.from < .3 ? (t => t > .6 ? lg.lower : "coat") : "coat", id, far});
    C.draw(cap(K[0], K[1], F[0], F[1], 2.6 * W, 2.2 * W), {mat: t => t > lg.from ? lg.lower : "coat", id, far});
    C.draw(ell(F[0] + d2[0] * .5 + 1.2 * s, F[1] + .6 * s, 2.8 * W, 1.8 * W, 0), {mat: lg.paw, id, far});
  }
  // patte arrière : cuisse musclée, jarret, métatarse
  function hind(anchor, a1, bend, a3, far){
    const [ax, ay] = T(...anchor), id = far ? BID.farH : BID.legH;
    const dk = dir(a1 + .55 + rot), K = [ax + dk[0] * 9 * L, ay + dk[1] * 9 * L];
    const dh = dir(a1 - bend + rot), H = [K[0] + dh[0] * 8 * L, K[1] + dh[1] * 8 * L];
    const dm = dir(a3 + rot), F = [H[0] + dm[0] * 7 * L, H[1] + dm[1] * 7 * L];
    C.draw(ell(ax + dk[0] * 3.2 * s, ay + dk[1] * 3.2 * s, 6.4 * W, 8.6 * W, -(a1 + .3 + rot)), {mat: "coat", id: far ? id : BID.thigh, group: far ? undefined : 60, far});
    C.draw(cap(K[0], K[1], H[0], H[1], 3.0 * W, 2.3 * W), {mat: t => t > .5 && lg.from < 1 ? lg.meta : "coat", id, far});
    C.draw(cap(H[0], H[1], F[0], F[1], 2.2 * W, 2.0 * W), {mat: lg.meta, id, far});
    C.draw(ell(F[0] + 1.2 * s, F[1] + .6 * s, 2.8 * W, 1.8 * W, 0), {mat: lg.paw, id, far});
  }

  // 1. pattes du côté éloigné (plus sombres)
  hind([-13 * B.body, 2], P.farH[0], P.farH[1], P.farH[2], true);
  front([12 * B.body, 4], P.farF[0], P.farF[1], true);
  // 2. queue
  {
    const tl = B.tail; let [x, y] = T(-17 * B.body, -3), a = tl.a + P.tailSway;
    for (let i = 0; i < tl.n; i++){
      const r = (tl.r - i * .3) * s;
      C.draw(ell(x, y, r + 1.2 * s, r, a), {mat: tl.tip && i === tl.n - 1 ? tl.tip : "coat", id: BID.tail, group: 50});
      x += Math.cos(a) * -2.4 * s; y += Math.sin(a) * -2.4 * s + .25 * s; a += tl.curl;
    }
  }
  // 3. corps et cou
  C.draw(E(T(0, 0), 17.5 * B.body, 9.4, rot), {mat: "coat", id: BID.body, group: 60});
  C.draw(E(T(-12 * B.body, -1), 8, 8.4, rot), {mat: "coat", id: BID.body, group: 60});
  C.draw(E(T(9 * B.body, 2.5), 10.5, 10.4, rot), {mat: "coat", id: BID.body, group: 60});
  C.draw(E(T(15 * B.body, -4), 7, 8, rot + .55), {mat: "coat", id: BID.neck, group: 60});
  if (B.mane) C.draw(E(T(14.5 * B.body, -3), 9, 10.5, rot + .5), {mat: "coat", id: BID.neck, group: 60});
  // robe merle : des taches sombres sur le gris
  if (B.spots) for (const [lx, ly, rx, ry] of [[-8, -5, 4, 2.6], [3, -6, 3.4, 2.2], [-14, 2, 2.6, 2], [6, 2, 2.6, 1.8], [-2, 1, 2, 1.6], [14, -9, 2.6, 2]])
    C.draw(E(T(lx, ly), rx, ry, rot + .3), {mat: "merle", on: [BID.body, BID.neck, BID.thigh]});
  if (B.patch) C.draw(E(T(-13, -3), 7.5, 5, rot), {mat: "pts", on: [BID.body, BID.thigh]});
  // collerette, poitrail, liseré
  if (B.collar) C.draw(E(T(18 * B.body, -5), B.mane ? 7.5 : 5.6, B.mane ? 10.5 : 8.6, rot + .45), {mat: "wh", on: [BID.neck, BID.body]});
  if (B.chest) C.draw(E(T(19 * B.body, 0), 4.4, 8.4, rot + .35), {mat: "wh", on: [BID.neck, BID.body]});
  if (B.chestPts) C.draw(E(T(13.5 * B.body, 6.5), 4.2, 2.6, rot), {mat: "pts", on: [BID.body]});
  // 4. pattes du côté proche
  hind([-13 * B.body, 2], P.nearH[0], P.nearH[1], P.nearH[2], false);
  front([12 * B.body, 4], P.nearF[0], P.nearF[1], false);
  // 5. tête
  const [hx, hy] = T(22 * B.body + P.headX, -13.5 + P.headY), hr = rot + P.headRot, ml = B.muzzleLen, mh = B.muzzleH;
  const H = (lx, ly) => [hx + s * (lx * Math.cos(hr) - ly * Math.sin(hr)), hy + s * (lx * Math.sin(hr) + ly * Math.cos(hr))];
  // oreilles dressées : derrière le crâne
  if (B.ear === "semi"){ C.draw(cap(...H(-1.6, -4.5), ...H(-.6, -10), 2.5 * s, 1.5 * s), {mat: "coat", id: BID.ear}); C.draw(E(H(1, -10.2), 1.8, 1.2, hr + .6), {mat: "coat", id: BID.ear}); }
  // oreilles dressées en pointe, qui frémissent un peu pendant la course
  if (B.ear === "prick"){ const tip = H(1.4 + P.ear * .8, -13.5); C.draw(cap(...H(-1.6, -4.4), ...tip, 3.6 * s, 1 * s), {mat: B.head, id: BID.ear});
    C.draw(cap(...H(-.4, -6.4), ...H(.9 + P.ear * .6, -11.2), 1.4 * s, .5 * s), {mat: "pink", on: [BID.ear]}); }
  if (B.ear === "rose"){ C.draw(cap(...H(-1.4, -4.4), ...H(1.4, -8), 2.8 * s, 1.4 * s), {mat: "coat", id: BID.ear}); C.draw(E(H(2.6, -6.9), 1.7, 1.3, hr + .9), {mat: "coat", id: BID.ear}); }
  C.draw(E(H(0, 0), 8.4, 7.6, hr - .1), {mat: B.head, id: BID.head, group: 70});
  C.draw(E(H(7.8 + (ml - 1) * 4, 3), 5.2 * ml, 3.7 * mh, hr + .05), {mat: B.muzzle, id: BID.muzzle, group: 70});
  if (P.mouth) C.draw(E(H(6.6 + (ml - 1) * 4, 5.6), 3.2 * ml, 1.4, hr + .3), {mat: B.muzzle, id: BID.muzzle, group: 70});
  // marques : liste blanche, joues et sourcils
  if (B.blaze) C.draw(E(H(4.4, -3), 1.6 * B.blaze, 5, hr + .6), {mat: "wh", on: [BID.head]});
  if (B.cheeks) C.draw(E(H(2.4, 4.2), 3, 2.2, hr), {mat: "pts", on: [BID.head]});
  if (B.brows) C.draw(E(H(2.6, -4.2), 1.6, 1.1, hr), {mat: "pts", on: [BID.head]});
  // truffe
  C.draw(E(H(12.6 + (ml - 1) * 8, 1.6), 2.1, 1.7, hr), {mat: "nose", id: BID.muzzle});
  if (P.tongue) C.draw(E(H(6.8 + (ml - 1) * 4, 7.4), 1.4, 2, hr + .2), {mat: "pink", id: BID.muzzle});
  // oreilles tombantes ou repliées : devant
  if (B.ear === "drop") C.draw(E(H(-1.8, 1.8), 3.6, 4.8, hr + P.ear), {mat: "coat", id: BID.ear});
  if (B.ear === "dropBig") C.draw(E(H(-1.6, 2.6), 4.2, 5.8, hr + P.ear * .8), {mat: "coat", id: BID.ear});
  if (B.ear === "button") C.draw(E(H(.6, -6), 3, 2, hr + .55 + P.ear * .3), {mat: B.head, id: BID.ear});
  // œil : pupille et reflet
  { const [x, y] = H(3.8, -.8); C.px(x, y, "#4a2a18"); C.px(x + 1, y, OUT); C.px(x, y + 1, OUT); C.px(x + 1, y + 1, OUT); C.px(x, y, "#fff8e8"); }
  { const [x, y] = H(9.6 + (ml - 1) * 6, 4.6); C.px(x, y, RAMP[B.muzzle][3]); C.px(x - 1, y, RAMP[B.muzzle][3]); }
  if (B.fringe) C.fringe([60], B.fringe[0], B.fringe[1], 1);       // franges sous le ventre et le poitrail
  if (B.tailFringe) C.fringe([50], B.tailFringe[0], B.tailFringe[1], 3);   // panache de la queue
  FUR_ON = true;
  return C.toCanvas();
}

// galop rassemblé : 8 images par foulée
function gallopPose(t){
  const p = k => 2 * Math.PI * (t + k);
  const F = k => { const a = .12 + .62 * Math.sin(p(k)), swing = Math.max(0, Math.cos(p(k))); return [a, a - 1.7 * Math.pow(swing, .8)]; };
  const Hd = k => { const a = -.15 + .5 * Math.sin(p(k)), swing = Math.max(0, Math.cos(p(k))); return [a, .85 + .5 * swing, a * .35 + .45 * swing]; };
  return {
    bob: -1.6 * Math.sin(2 * Math.PI * t + .9), pitch: .07 * Math.sin(2 * Math.PI * t),
    farH: Hd(0), nearH: Hd(.09), farF: F(.46), nearF: F(.56),
    tailSway: .18 * Math.sin(2 * Math.PI * t + 2),
    ear: .25 + .3 * Math.sin(2 * Math.PI * t - 1.2), headX: 0, headY: 1.2 * Math.sin(2 * Math.PI * t + 2.2), headRot: .05 * Math.sin(2 * Math.PI * t + 2),
    mouth: true, tongue: true,
  };
}
// saut : élan, montée, sommet, descente, réception
function jumpPose(p){
  const e = Math.sin(Math.PI * p);
  return {
    bob: -2 * e + 3 * Math.max(0, Math.cos(Math.PI * p)), pitch: -.27 * Math.cos(Math.PI * p),
    nearF: [1.25 - .55 * p * p, 1.25 - .55 * p * p - 2.5 * (1 - p * p) + .4 * p], farF: [1.15 - .5 * p * p, 1.15 - .5 * p * p - 2.4 * (1 - p * p) + .3 * p],
    nearH: [-.85 + 1.0 * e, .7 + .6 * e, -.9 + 1.2 * e], farH: [-.95 + 1.0 * e, .7 + .6 * e, -1.0 + 1.2 * e],
    tailSway: .5 + .2 * e,
    ear: -.55 - .3 * e, headX: 1, headY: -1, headRot: .12 * Math.cos(Math.PI * p),
    mouth: false, tongue: false,
  };
}
// reptation dans le tunnel : corps bas, pattes repliées, tête en avant
function crawlPose(t){
  const p = 2 * Math.PI * t;
  return {
    bob: 13, pitch: .04 * Math.sin(p),
    nearF: [1.35 + .25 * Math.sin(p), 2.0 + .2 * Math.sin(p)], farF: [1.35 + .25 * Math.sin(p + Math.PI), 2.0 + .2 * Math.sin(p + Math.PI)],
    nearH: [.55 + .25 * Math.sin(p + Math.PI), 2.1, 1.4], farH: [.55 + .25 * Math.sin(p), 2.1, 1.4],
    tailSway: -.1 + .1 * Math.sin(p),
    ear: .5, headX: 3, headY: 8, headRot: .15,
    mouth: false, tongue: false,
  };
}
// l'arrêt : debout, pour le chenil et l'écran titre
function standPose(){
  return {bob: 0, pitch: 0, nearF: [.08, .08], farF: [.18, .18], nearH: [-.1, .85, .05], farH: [0, .85, .1], tailSway: .05,
    ear: .2, headX: 0, headY: -1, headRot: -.05, mouth: true, tongue: true};
}
const CACHE = {};
function frames(id){
  if (CACHE[id]) return CACHE[id];
  const B = BREEDS.find(b => b.id === id) || BREEDS[0];
  return CACHE[id] = {
    breed: B,
    run: [...Array(8).keys()].map(k => dogFrame(gallopPose(k / 8), B)),
    jump: [0, .25, .5, .75, 1].map(p => dogFrame(jumpPose(p), B)),
    crawl: [0, .25, .5, .75].map(t => dogFrame(crawlPose(t), B)),
    stand: dogFrame(standPose(), B),
  };
}


function blob(g, shapes, ramp, outline){
  // des boules ombrées (nuages, arbres) peintes avec le même moteur
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of shapes){ x0 = Math.min(x0, s[0] - s[2]); y0 = Math.min(y0, s[1] - s[2]); x1 = Math.max(x1, s[0] + s[2]); y1 = Math.max(y1, s[1] + s[2]); }
  const ox = Math.floor(x0) - 2, oy = Math.floor(y0) - 2, w = Math.ceil(x1 - x0) + 5, h = Math.ceil(y1 - y0) + 5;
  RAMP._tmp = ramp; const C = Canvas(w, h);
  shapes.forEach((s, k) => C.draw(ell(s[0] - ox, s[1] - oy, s[2], s[3] || s[2]), {mat: "_tmp", id: 1, flat: true, fur: false}));
  const cv = C.toCanvas(false), gg = cv.getContext("2d");
  if (outline){ gg.globalCompositeOperation = "destination-over"; gg.fillStyle = outline;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) gg.drawImage(C.toCanvas(false), dx, dy); }
  g.drawImage(cv, ox, oy);
}


window.Chiens32 = {SW, SH, GROUND, BREEDS, frames, blob, Canvas, ell, cap, RAMP, OUT};
})();

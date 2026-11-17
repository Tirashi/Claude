/* Politique : la carte sur papier (continent et pays). Géographie continue (les mêmes fonctions de forme à toutes
   les échelles) et rendu à l'encre, repris de la maquette 4 validée le 17/11 (outils/politique-maquette/source4.html).
   Images : pack gratuit « Fantasy Map Assets Lite » de Deface Games (politique/images, outils/politique-images.py).
   Rien ici ne lit l'état de la partie : l'écran (ecran.js) dessine par-dessus. window.PolCarte. */
(function(racine){
"use strict";
// emplacement et couleur de chaque nation sur le continent (notre pays sur la côte ouest : les distances se voient)
const GEO = {
  joueur:      { graine: [8, 19],  coul: [61, 110, 190], grande: true },
  val_roc:     { graine: [17, 16], coul: [196, 72, 56], grande: true },
  contreforts: { graine: [9, 29],  coul: [140, 88, 180] },
  brume:       { graine: [16, 6],  coul: [214, 168, 52], grande: true },
  hautefage:   { graine: [20, 27], coul: [96, 100, 112] },
  aurele:      { graine: [29, 9],  coul: [214, 118, 48] },
  port_salin:  { graine: [29, 30], coul: [52, 150, 136], grande: true }
};
const IDS = Object.keys(GEO), RIDS = ["plaine", "collines", "vallee", "bourg"];
const RCOUL = { plaine: [205, 172, 64], collines: [138, 112, 92], vallee: [92, 150, 86], bourg: [184, 92, 108] };
const ENCRE = [58, 42, 28], ROUGE = "#9b2a1f";
// ======================= géographie continue (mêmes formes à toutes les échelles) =======================
function hache(x, y, s){ let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function bruit(x, y, s){ const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, l = t => t * t * (3 - 2 * t);
  const a = hache(xi, yi, s), b = hache(xi + 1, yi, s), c = hache(xi, yi + 1, s), d = hache(xi + 1, yi + 1, s);
  return a + (b - a) * l(fx) + (c - a) * l(fy) + (a - b - c + d) * l(fx) * l(fy); }
const W = 37, H = 38;
const BLOBS = [[19, 19, 11, 13], [8, 19, 6, 7], [10, 29, 6, 5], [16, 6, 7, 4], [29, 9, 6, 5.5], [29, 30, 6, 5.5], [24, 19, 9, 6]]; // 17/11 : notre pays à l'ouest, les distances se voient
function champ(x, y){ let f = -9;
  for (const [cx, cy, rx, ry] of BLOBS) f = Math.max(f, 1 - ((x - cx) / rx) ** 2 - ((y - cy) / ry) ** 2);
  f += 0.5 * (bruit(x / 3.5, y / 3.5, 3) - 0.5) + 0.12 * (bruit(x / 1.1, y / 1.1, 4) - 0.5);
  if (((x - 6) / 4.5) ** 2 + ((y - 10.5) / 2.6) ** 2 < 1 || ((x - 35) / 3) ** 2 + ((y - 19) / 3) ** 2 < 1) f -= 1.2;   // la baie au nord de notre pays
  const bord = Math.min(x - 1.5, y - 1.5, W - 2.5 - x, H - 2.5 - y); if (bord < 1) f -= (1 - bord) * 0.6;
  return f - 0.1; }
const terre = (x, y) => champ(x, y) > 0;
const RAYON_JOUEUR = 6;   // 17/11 : un peu plus de place pour aérer la carte du pays
function nationEn(x, y){ let best = -1, bd = 1e9;
  IDS.forEach((id, k) => { const [gx, gy] = GEO[id].graine;
    const d0 = Math.hypot(x - gx, y - gy) + 2.4 * (bruit(x / 3, y / 3, 7) - 0.5) + 0.7 * (bruit(x / 1.2, y / 1.2, 8) - 0.5);
    const d = id === "joueur" && d0 > RAYON_JOUEUR ? 1e8 : d0; if (d < bd){ bd = d; best = k; } });
  return best; }
const CAP = GEO.joueur.graine;
function regionEn(x, y){ const dx = x - CAP[0] + 1.6 * (bruit(x / 1.8, y / 1.8, 21) - 0.5), dy = y - CAP[1] + 1.6 * (bruit(x / 1.8, y / 1.8, 22) - 0.5);
  return dx < 0 ? (dy < 0 ? 0 : 2) : (dy < 0 ? 1 : 3); } // plaine, collines, vallée, bourg

// routes : chemins sur les cases, puis adoucis
function chemin(a, b){ const k = (x, y) => y * W + x, dist = new Map([[k(a[0], a[1]), 0]]), prec = new Map([[k(a[0], a[1]), null]]), file = [[0, a[0], a[1]]];
  while (file.length){ file.sort((p, q) => p[0] - q[0]); const [d0, x, y] = file.shift(); if (x === b[0] && y === b[1]) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]){ const nx = x + dx, ny = y + dy; if (!terre(nx, ny)) continue;
      const nd = d0 + Math.hypot(dx, dy) + (montagneEn(nx, ny) ? 3 : 0); if (nd < (dist.get(k(nx, ny)) ?? 1e9)){ dist.set(k(nx, ny), nd); prec.set(k(nx, ny), [x, y]); file.push([nd, nx, ny]); } } }
  const r = []; let p = b; while (p){ r.unshift(p); p = prec.get(k(p[0], p[1])); } return r; }
function adoucir(pts, n){ for (let it = 0; it < n; it++){ const q = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++){ const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; q.push([ax * .75 + bx * .25, ay * .75 + by * .25], [ax * .25 + bx * .75, ay * .25 + by * .75]); }
    q.push(pts[pts.length - 1]); pts = q; } return pts; }
const ROCHEUX = new Set(["val_roc", "hautefage", "contreforts"]);
function montagneEn(x, y){ const id = IDS[nationEn(x, y)]; return (ROCHEUX.has(id) || (id === "joueur" && regionEn(x, y) === 1)) && bruit(x / 2.6, y / 2.6, 23) > 0.62 && champ(x, y) > 0.25; }
const foretEn = (x, y) => bruit(x / 3.2, y / 3.2, 11) > 0.56;
const ROUTES = {};
for (const id of IDS) if (id !== "joueur"){ const p = adoucir(chemin(CAP, GEO[id].graine), 3);
  // jitter léger pour un tracé à la main
  ROUTES[id] = p.map(([x, y], i) => i && i < p.length - 1 ? [x + 0.25 * (bruit(x, y, 31) - .5), y + 0.25 * (bruit(x, y, 32) - .5)] : [x, y]); }
const presRoute = (x, y, r) => Object.values(ROUTES).some(p => p.some(([a, b]) => Math.abs(a - x) < r && Math.abs(b - y) < r));

// ---------- le pays : régions, emplacements ----------
const PAYS_B = (() => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let y = 0; y < H; y += 0.5) for (let x = 0; x < W; x += 0.5) if (terre(x, y) && nationEn(x, y) === 0){ x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0: x0 - 3, y0: y0 - 3, x1: x1 + 3, y1: y1 + 3 }; })();
const MONDE_B = { x0: 0, y0: 0, x1: W, y1: H };
const CENTRES = {}, LOTS = {};
(() => { const s = {}; RIDS.forEach(r => s[r] = [0, 0, 0]);
  for (let y = PAYS_B.y0; y < PAYS_B.y1; y += 0.25) for (let x = PAYS_B.x0; x < PAYS_B.x1; x += 0.25) if (terre(x, y) && nationEn(x, y) === 0){ const r = RIDS[regionEn(x, y)]; s[r][0] += x; s[r][1] += y; s[r][2]++; }
  for (const r of RIDS){ CENTRES[r] = [s[r][0] / s[r][2], s[r][1] / s[r][2]];
    const [cx, cy] = CENTRES[r], cand = [];
    for (let y = PAYS_B.y0; y < PAYS_B.y1; y += 0.35) for (let x = PAYS_B.x0; x < PAYS_B.x1; x += 0.35){
      if (!terre(x, y) || nationEn(x, y) !== 0 || RIDS[regionEn(x, y)] !== r) continue;
      // assez loin des bords de la région, de la capitale et des routes
      if ([[.6, 0], [-.6, 0], [0, .6], [0, -.6]].some(([a, b]) => !terre(x + a, y + b) || nationEn(x + a, y + b) !== 0 || RIDS[regionEn(x + a, y + b)] !== r)) continue;
      if (Math.hypot(x - CAP[0], y - CAP[1]) < 2 || presRoute(x, y, 0.5) || montagneEn(x, y) || Math.hypot(x - cx, y - (cy - 1)) < 0.9) continue;   // ni sur la ville, ni sur une route, ni sous le nom de la région
      cand.push([x, y, Math.hypot(x - cx, y - cy)]); }
    cand.sort((a, b) => a[2] - b[2]); LOTS[r] = [];
    for (const [x, y] of cand){ if (LOTS[r].length >= 8) break; if (LOTS[r].some(([a, b]) => Math.hypot(a - x, b - y) < 1.4)) continue; LOTS[r].push([x, y]); }
    // si la région est trop petite pour 8 places espacées, on serre un peu les dernières
    for (const ec of [1, .75]) for (const [x, y] of cand){ if (LOTS[r].length >= 8) break; if (LOTS[r].some(([a, b]) => Math.hypot(a - x, b - y) < ec)) continue; LOTS[r].push([x, y]); } } })();
const estLot = (x, y, r) => RIDS.some(k => LOTS[k].some(([a, b]) => Math.hypot(a - x, b - y) < r));

// ======================= images =======================
const IMG = {};
const charge = (n, s) => new Promise(ok => { const i = new Image(); i.onload = () => ok(IMG[n] = i); i.src = s; });
const toile = (w, h) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h || w)); return c; };
// un tampon à l'encre (teinté), à une taille donnée ; en pixel : alpha tranché net
function tampon(nom, taille, coul, net){ const im = IMG[nom], r = im.width / im.height, w = r >= 1 ? taille : taille * r, h = r >= 1 ? taille / r : taille;
  const c = toile(w, h), k = c.getContext("2d"); k.imageSmoothingEnabled = !net || taille > 24; k.drawImage(im, 0, 0, c.width, c.height);
  k.globalCompositeOperation = "source-in"; k.fillStyle = coul || "rgb(58,42,28)"; k.fillRect(0, 0, c.width, c.height);
  if (net) tranche(c); return c; }
function tranche(c){ const k = c.getContext("2d"), d = k.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 3; i < p.length; i += 4) p[i] = p[i] > 110 ? 255 : 0; k.putImageData(d, 0, 0); }

// ---------- pictogrammes des bâtiments (dessinés à la plume, sur une toile de taille s) ----------
function picto(type, s, net){
  const c = toile(s, s), k = c.getContext("2d"), u = s / 32, enc = "rgb(58,42,28)";
  k.strokeStyle = enc; k.fillStyle = enc; k.lineWidth = Math.max(1, 1.4 * u); k.lineCap = "round";
  const pose = (nom, x, y, t) => { const tp = tampon(nom, t * u, enc, net); k.drawImage(tp, x * u - tp.width / 2, y * u - tp.height); };
  const champ = (x, y, w, h, rang) => { k.save(); k.translate(x * u, y * u); k.beginPath(); k.rect(0, 0, w * u, h * u); k.stroke();
    for (let i = 1; i < rang; i++){ k.beginPath(); k.moveTo(0, i * h * u / rang); k.lineTo(w * u, i * h * u / rang); k.stroke(); } k.restore(); };
  if (type === "farm"){ champ(3, 17, 18, 11, 4); pose("home", 24, 22, 13); }
  else if (type === "vignoble"){ k.strokeRect(3 * u, 12 * u, 26 * u, 16 * u); for (let i = 0; i < 4; i++) for (let j = 0; j < 6; j++){ k.beginPath(); k.arc((6 + j * 4) * u, (15 + i * 3.6) * u, 1.1 * u, 0, 6.3); k.fill(); } }
  else if (type === "mine") pose("cave", 16, 27, 22);
  else if (type === "mine_charbon"){ pose("cave", 13, 27, 19); k.beginPath(); k.moveTo(20 * u, 28 * u); k.lineTo(25 * u, 20 * u); k.lineTo(30 * u, 28 * u); k.fill(); }
  else if (type === "scierie"){ pose("pine1", 9, 27, 18); for (const [x, y] of [[18, 25], [24, 25], [21, 20]]){ k.beginPath(); k.arc(x * u, y * u, 2.8 * u, 0, 6.3); k.stroke(); } }
  else if (type === "workshop"){ pose("home", 11, 26, 16); k.beginPath(); k.moveTo(20 * u, 21 * u); k.lineTo(30 * u, 21 * u); k.lineTo(27 * u, 24 * u); k.lineTo(26 * u, 28 * u); k.lineTo(23 * u, 28 * u); k.lineTo(23 * u, 24 * u); k.closePath(); k.fill(); }
  else if (type === "weaving"){ pose("home", 11, 26, 16); k.beginPath(); k.ellipse(25 * u, 18 * u, 4 * u, 1.6 * u, 0, 0, 6.3); k.stroke(); k.beginPath(); k.ellipse(25 * u, 27 * u, 4 * u, 1.6 * u, 0, 0, 6.3); k.stroke();
    for (let i = -2; i <= 2; i++){ k.beginPath(); k.moveTo((25 + i * 1.5) * u, 18 * u); k.lineTo((25 + i * 1.5) * u, 27 * u); k.stroke(); } }
  else if (type === "caserne"){ pose("watchtower", 14, 29, 24); k.beginPath(); k.moveTo(22 * u, 8 * u); k.lineTo(22 * u, 18 * u); k.stroke(); k.fillStyle = ROUGE; k.beginPath(); k.moveTo(22 * u, 8 * u); k.lineTo(29 * u, 10.5 * u); k.lineTo(22 * u, 13 * u); k.fill(); }
  if (net) tranche(c); return c; }
// la charrette, vue de côté (tournée vers la droite)
function charrette(s, net){ const c = toile(s, s * 0.6), k = c.getContext("2d"), u = s / 40;
  k.strokeStyle = "rgb(58,42,28)"; k.fillStyle = "rgb(58,42,28)"; k.lineWidth = Math.max(1, 1.5 * u);
  k.fillStyle = "#efe3c8"; k.beginPath(); k.moveTo(3 * u, 15 * u); k.quadraticCurveTo(12 * u, 1 * u, 21 * u, 15 * u); k.closePath(); k.fill(); k.stroke();
  k.fillStyle = "rgb(58,42,28)"; k.fillRect(2 * u, 15 * u, 21 * u, 3 * u);
  for (const x of [6, 18]){ k.beginPath(); k.arc(x * u, 20 * u, 3 * u, 0, 6.3); k.stroke(); }
  k.beginPath(); k.moveTo(23 * u, 17 * u); k.lineTo(28 * u, 15 * u); k.stroke();
  k.beginPath(); k.ellipse(32 * u, 14 * u, 4.5 * u, 2.6 * u, 0, 0, 6.3); k.fill();                 // cheval
  k.beginPath(); k.moveTo(35 * u, 13 * u); k.lineTo(38 * u, 7 * u); k.lineTo(39.5 * u, 9 * u); k.lineTo(37 * u, 14 * u); k.fill();
  for (const x of [29, 31, 34, 35.5]){ k.beginPath(); k.moveTo(x * u, 15 * u); k.lineTo(x * u, 22 * u); k.stroke(); }
  if (net) tranche(c); return c; }

// ======================= rendu des cartes (une fois, puis à chaque changement) =======================
function chamfer(src, w, h){ // distance (en pixels) à la source la plus proche
  const d = new Float32Array(w * h); for (let i = 0; i < d.length; i++) d[i] = src[i] ? 0 : 1e6;
  const D = Math.SQRT2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){ const i = y * w + x; let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 1); if (y > 0){ v = Math.min(v, d[i - w] + 1); if (x > 0) v = Math.min(v, d[i - w - 1] + D); if (x < w - 1) v = Math.min(v, d[i - w + 1] + D); } d[i] = v; }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--){ const i = y * w + x; let v = d[i];
    if (x < w - 1) v = Math.min(v, d[i + 1] + 1); if (y < h - 1){ v = Math.min(v, d[i + w] + 1); if (x < w - 1) v = Math.min(v, d[i + w + 1] + D); if (x > 0) v = Math.min(v, d[i + w - 1] + D); } d[i] = v; }
  return d; }
function rendu(B, px, net, pays){
  const w = Math.round((B.x1 - B.x0) * px), h = Math.round((B.y1 - B.y0) * px), n = w * h;
  const ter = new Uint8Array(n), nat = new Int8Array(n), reg = new Int8Array(n);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){ const x = B.x0 + (i + .5) / px, y = B.y0 + (j + .5) / px, k = j * w + i;
    ter[k] = terre(x, y) ? 1 : 0; nat[k] = ter[k] ? nationEn(x, y) : -1; reg[k] = pays && nat[k] === 0 ? regionEn(x, y) : -1; }
  const eau = new Uint8Array(n), front = new Uint8Array(n), fr = new Uint8Array(n);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){ const k = j * w + i; eau[k] = !ter[k];
    if (ter[k] && ((i < w - 1 && ter[k + 1] && nat[k + 1] !== nat[k]) || (j < h - 1 && ter[k + w] && nat[k + w] !== nat[k]))) front[k] = 1;
    if (reg[k] >= 0 && ((i < w - 1 && reg[k + 1] >= 0 && reg[k + 1] !== reg[k]) || (j < h - 1 && reg[k + w] >= 0 && reg[k + w] !== reg[k]))) fr[k] = 1; }
  const dCote = chamfer(eau, w, h), dTerre = chamfer(ter, w, h), dFront = chamfer(front, w, h), dReg = chamfer(fr, w, h);
  // le papier
  const c = toile(w, h), k = c.getContext("2d");
  if (!net) k.drawImage(IMG.papier, 0, 0, w, h);
  const im = k.getImageData(0, 0, w, h), p = im.data, s = px / 28;   // s : échelle des traits
  const anneau = net ? 3 : 7 * s, epCote = net ? 1 : 1.6 * s, epFront = net ? 1 : 1.3 * s;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){ const kk = j * w + i, q = kk * 4;
    let r, g, b;
    if (net){ const v = (hache(i, j, 5) - .5) * 10 - 22 * Math.max(0, Math.hypot(i / w - .5, j / h - .5) - .35); r = 226 + v; g = 208 + v; b = 166 + v; }   // parchemin au pixel
    else { r = p[q]; g = p[q + 1]; b = p[q + 2]; }
    const mix = (col, a) => { r += (col[0] - r) * a; g += (col[1] - g) * a; b += (col[2] - b) * a; };
    if (!ter[kk]){ mix([150, 170, 175], 0.22);
      const d = dTerre[kk]; if (d < anneau * 3.2){ const f = (d % anneau) / anneau; if (f < (net ? 0.34 : 0.17)) mix(ENCRE, net ? 0.55 : 0.5 * (1 - d / (anneau * 3.2))); } }
    else { const id = nat[kk], col = GEO[IDS[id]].coul, df = dFront[kk];
      let a = 0.13 + 0.28 * Math.max(0, 1 - df / (net ? 3 : 9 * s));          // lavis plus soutenu le long des frontières
      if (pays && id !== 0){ a *= 0.5; mix([120, 110, 95], 0.18); if ((i + j) % (net ? 6 : Math.round(7 * s)) === 0) mix(ENCRE, net ? 0.1 : 0.18); }   // l'étranger hachuré
      if (pays && id === 0){ a = 0; mix(RCOUL[RIDS[reg[kk]]], 0.24 + 0.22 * Math.max(0, 1 - dReg[kk] / (net ? 3 : 10 * s))); }
      mix(col, a);
      if (df <= epFront && (Math.floor((i + j) / (net ? 2 : 5 * s)) % 2 === 0)) mix(ENCRE, 0.85);      // frontière en pointillés
      if (pays && reg[kk] >= 0 && dReg[kk] <= epFront * 1.5 && (Math.floor((i + j) / (net ? 2 : 6 * s)) % 2 === 0)) mix(ENCRE, 0.85); // limites de régions
      if (dCote[kk] <= epCote) mix(ENCRE, 0.95); }                                                    // le trait de côte
    if (net){ r = Math.round(r / 12) * 12; g = Math.round(g / 12) * 12; b = Math.round(b / 12) * 12; }
    p[q] = r; p[q + 1] = g; p[q + 2] = b; p[q + 3] = 255; }
  k.putImageData(im, 0, 0);
  // calque à l'encre : routes, forêts, montagnes, ville, rose des vents
  const L = toile(w, h), e = L.getContext("2d"), X = x => (x - B.x0) * px, Y = y => (y - B.y0) * px;
  e.strokeStyle = "rgb(58,42,28)"; e.lineCap = "round";
  for (const id in ROUTES){ const r = ROUTES[id]; e.lineWidth = net ? 1 : Math.max(1.2, 2 * s); e.setLineDash(net ? [2, 2] : [7 * s, 5 * s]);
    e.beginPath(); r.forEach(([x, y], i) => i ? e.lineTo(X(x), Y(y)) : e.moveTo(X(x), Y(y))); e.stroke(); }
  e.setLineDash([]);
  if (pays) for (const r of RIDS){ const [cx, cy] = CENTRES[r]; e.lineWidth = net ? 1 : 1.6 * s; e.setLineDash(net ? [1, 2] : [3 * s, 4 * s]);
    e.beginPath(); e.moveTo(X(CAP[0]), Y(CAP[1])); e.quadraticCurveTo(X((CAP[0] + cx) / 2 + .6), Y((CAP[1] + cy) / 2 - .4), X(cx), Y(cy)); e.stroke(); e.setLineDash([]); }
  const dec = [], pas = pays ? (net ? 0.75 : 0.6) : (net ? 1 : 0.85);
  for (let y = B.y0; y < B.y1; y += pas) for (let x = B.x0; x < B.x1; x += pas){
    const jx = x + (hache(Math.round(x * 9), Math.round(y * 9), 41) - .5) * pas * .8, jy = y + (hache(Math.round(x * 9), Math.round(y * 9), 42) - .5) * pas * .8;
    if (champ(jx, jy) < 0.08 || Object.values(GEO).some(N => Math.hypot(N.graine[0] - jx, N.graine[1] - jy) < (pays ? 1.4 : 1.1))) continue;
    if (presRoute(jx, jy, pays ? 0.35 : 0.45) || (pays && estLot(jx, jy, 0.95))) continue;
    if (pays && nationEn(jx, jy) === 0 && hache(Math.round(jx * 5), Math.round(jy * 5), 46) > (montagneEn(jx, jy) ? .55 : .2)) continue;   // pays épuré
    if (montagneEn(jx, jy)) dec.push([jx, jy, "mount" + (1 + Math.floor(hache(Math.round(jx * 7), Math.round(jy * 7), 43) * 10)), pays ? 1.1 : 1.45]);
    else if (foretEn(jx, jy) && (!pays || bruit(jx / 3.2, jy / 3.2, 11) > 0.6)){ const pin = ROCHEUX.has(IDS[nationEn(jx, jy)]) || bruit(jx / 4, jy / 4, 44) > .5;
      const v = pin ? ["pine1", "pine3"] : ["tree1", "tree4", "tree6", "tree7", "tree8"];
      dec.push([jx, jy, v[Math.floor(hache(Math.round(jx * 7), Math.round(jy * 7), 45) * v.length)], pays ? 0.55 : 0.62]); } }
  dec.sort((a, b) => a[1] - b[1]);
  const cache = {};
  for (const [x, y, nom, t] of dec){ const cle = nom + t; const tp = cache[cle] || (cache[cle] = tampon(nom, t * px, null, net));
    e.drawImage(tp, Math.round(X(x) - tp.width / 2), Math.round(Y(y) - tp.height)); }
  if (!pays){ const tp = tampon("compass", 3.4 * px, null, net); e.globalAlpha = .8; e.drawImage(tp, X(4) - tp.width / 2, Y(33.5) - tp.height / 2); e.globalAlpha = 1;
    const v = tampon("waves_2", 1.6 * px, null, net); for (const [x, y] of [[3, 4], [4, 10], [3.5, 34], [34, 19]]) if (!terre(x, y)) e.drawImage(v, X(x), Y(y)); }
  if (net) tranche(L);
  k.drawImage(L, 0, 0);
  return { c, B, px };
}

const longueur = r => { let L = 0; for (let i = 1; i < r.length; i++) L += Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); return L; };
racine.PolCarte = { W, H, GEO, IDS, RIDS, RCOUL, ROUGE, CAP, ROUTES, PAYS_B, MONDE_B, CENTRES, LOTS, IMG,
  terre, nationEn, regionEn, rendu, tampon, picto, charrette, charge, toile, longueur };
})(window);

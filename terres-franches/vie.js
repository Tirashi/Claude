/* Terres franches : la vie de la vallée (repris de la maquette 7) : saisons, jour et nuit, pluie et neige, animaux, enfants.
   Tout suit le temps de la partie (S.t, absence comprise) : une saison = 20 min, une journée = 12 min (dont 3 de nuit).
   Seulement du décor : les règles (regles.js) ne changent pas avec la saison ni la météo.
   jeu.js appelle : saison(S), etatChamp(t, i, s), recolorer(img, s) (planche du décor retouchée), sol(canvas, s),
   objets(L, t, dt, S, agents) (ajoute animaux et enfants à la liste rangée par profondeur), ciel(x, t, S, X0, Y0, vw, vh, lumieres). */
(function(){
"use strict";
const C = window.TerresCarte, AT = window.TerresAtlas, AA = window.TerresAnimauxAtlas, VL = window.TerresVillageois, T = C.T;
const SAISON = 20 * 60, JOUR = 12 * 60;
const NOMS = ["PRINTEMPS", "ETE", "AUTOMNE", "HIVER"];
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function alea(g){ let s = g >>> 0 || 1; return () => (s = Math.imul(s ^ (s >>> 15), 1 | s) + 0x6d2b79f5 >>> 0, ((s ^ (s >>> 7)) >>> 0) / 4294967296); }
// la partie commence au printemps, un peu avant l'été
const saison = S => Math.floor((S.t + SAISON * .7) / SAISON) % 4;
const annee = S => 1 + Math.floor((S.t + SAISON * .7) / (SAISON * 4));
// nuit : 0 en plein jour, 1 au cœur de la nuit (la partie commence le matin)
function nuit(S){ const u = ((S.t + JOUR * .1) % JOUR) / JOUR; return u < .7 ? 0 : u < .76 ? (u - .7) / .06 : u < .94 ? 1 : (1 - u) / .06; }
function pluie(S){ const k = Math.floor(S.t / 150); return hash(k, 41) < (saison(S) === 3 ? .3 : saison(S) === 1 ? .08 : .2); }

/* ---------- les saisons ---------- */
const ETATS = [["nu", "pousse", "pousse"], ["pousse", "mur", "mur", "blond"], ["blond", "nu", "blond", "nu"], ["nu"]];
const etatChamp = (t, i, s) => { const E = ETATS[s]; return E[Math.floor(t / 40 + i * 1.7) % E.length]; };
const retouche = n => n.startsWith("s-arbre") || n === "s-jeune" ? "arbre" : /^(chaume|colomb|pierre)\d/.test(n) || ["grange", "hangar", "four", "moulin1", "puits", "puits-couvert", "fontaine"].includes(n) ? "toit" : null;
const cacheS = {};
// la planche du décor retouchée pour la saison s (feuilles rousses, fleurs, neige sur les toits et les arbres)
function recolorer(img, s){
  if (s === 1) return img; if (cacheS[s]) return cacheS[s];
  const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight; const b = c.getContext("2d"); b.drawImage(img, 0, 0);
  for (const n in AT){
    const genre = retouche(n); if (!genre) continue;
    const [x0, y0, W, H] = AT[n], d = b.getImageData(x0, y0, W, H), p = d.data, r = alea(n.length * 13 + s), arbre = genre === "arbre", roux = n.charCodeAt(n.length - 1) % 2;
    const feuille = i => p[i + 3] > 0 && p[i + 1] > p[i] && p[i + 1] > p[i + 2] - 10;
    const vide = (x, y) => y <= 0 || p[((y - 1) * W + x) * 4 + 3] === 0;
    const neige = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){ const i = (y * W + x) * 4; if (!p[i + 3]) continue; const l = (p[i] + p[i + 1] + p[i + 2]) / 3;
      if (s === 2 && arbre && feuille(i)){ p[i] = Math.min(255, 90 + l * 1.1); p[i + 1] = Math.min(255, (roux ? 35 : 75) + l * .55); p[i + 2] = 25 + l * .1; }
      if (s === 0 && arbre && feuille(i)){ p[i + 1] = Math.min(255, p[i + 1] + 14); if (r() < .025){ p[i] = 250; p[i + 1] = 190; p[i + 2] = 215; } }
      if (s === 3){ if (arbre && feuille(i)){ p[i] = p[i + 1] = p[i + 2] = 70 + l * .55; p[i + 2] += 20; }
        if (vide(x, y) || (y > 1 && vide(x, y - 1)) || (arbre && r() < .05 && feuille(i))) neige.push(i); } }
    for (const i of neige){ p[i] = 240; p[i + 1] = 246; p[i + 2] = 255; }
    b.putImageData(d, x0, y0);
  }
  return cacheS[s] = c;
}
// l'herbe change avec la saison (les rues, la place et la rive gardent leur couleur)
function sol(c, s){
  if (s === 1) return; const b = c.getContext("2d"), d = b.getImageData(0, 0, c.width, c.height), p = d.data, r = alea(77 + s);
  for (let i = 0; i < p.length; i += 4){ if (!(p[i + 1] > p[i] && p[i + 1] > p[i + 2] && p[i + 1] > 70)) continue;
    if (s === 3){ const n = r() * 10; p[i] = 222 + n; p[i + 1] = 230 + n; p[i + 2] = 240 + n * .8; }
    else if (s === 2){ p[i] = Math.min(255, p[i] + 45); p[i + 1] = Math.min(255, p[i + 1] + 12); p[i + 2] = Math.max(0, p[i + 2] - 15); }
    else { p[i + 1] = Math.min(255, p[i + 1] + 10); const f = r(); if (f < .0016){ p[i] = 255; p[i + 1] = 245; p[i + 2] = 250; } else if (f < .0026){ p[i] = 250; p[i + 1] = 210; p[i + 2] = 60; } else if (f < .0034){ p[i] = 235; p[i + 1] = 120; p[i + 2] = 170; } } }
  b.putImageData(d, 0, 0);
}

/* ---------- les animaux (LPC, OpenGameArt) ---------- */
const animaux = new Image(); animaux.src = "img/animaux.png";
// planches : case l × h, pieds à py ; lignes de marche h/g/b/d (null = miroir de g) ; repos : planche, lignes, images, image fixe
const ESPECES = {
  biche: {im: "biche", l: 64, h: 96, py: 90, k: .6, v: .6, n: 4, rang: {h: 0, g: 1, b: 3, d: null}, repos: ["biche", {h: 2, g: 2, b: 2, d: null}, 4]},
  cerf: {im: "cerf", l: 64, h: 96, py: 90, k: .65, v: .6, n: 4, rang: {h: 0, g: 1, b: 3, d: null}, repos: ["cerf", {h: 2, g: 2, b: 2, d: null}, 4]},
  renard: {im: "renard", l: 64, h: 64, py: 54, k: .5, v: 1.6, n: 4, rang: {h: 3, g: 1, b: 0, d: 2}, repos: ["renard", {h: 0, g: 0, b: 0, d: 0}, 1]},
  chien: {im: "chien", l: 32, h: 32, py: 30, k: .9, v: 1.2, n: 3, bloc: 128, rang: {h: 1, g: 3, b: 2, d: 0}, repos: ["chien", {h: 4, g: 4, b: 4, d: 4}, 3]},
  chat: {im: "chat", l: 32, h: 32, py: 30, k: .75, v: .7, n: 3, bloc: 128, rang: {h: 1, g: 3, b: 2, d: 0}, repos: ["chat", {h: 0, g: 0, b: 0, d: 0}, 1, 3]},
  poule: {im: "poule", l: 32, h: 32, py: 28, k: .7, v: .5, n: 4, rang: {h: 0, g: 1, b: 2, d: 3}, repos: ["poule-mange", {h: 0, g: 1, b: 2, d: 3}, 4]},
  oiseau: {im: "oiseau1", l: 32, h: 32, py: 26, k: .45, v: .8, n: 3, rang: {h: 5, g: 4, b: 6, d: 7}, repos: ["oiseau1", {h: 5, g: 4, b: 6, d: 7}, 3]},
  poisson: {im: "poisson", l: 32, h: 32, py: 16, k: .8, v: .6, n: 4, rang: {h: 0, g: 1, b: 3, d: 2}}
};
// zones en cases [x0, x1, y0, y1] ; quand : à partir de quand la bête est là
const BETES = [
  {sp: "biche", z: [5, 9, 3.5, 5], quand: () => true}, {sp: "biche", z: [2.2, 4, 9, 14], quand: () => true}, {sp: "cerf", z: [5, 10, 3.5, 5], quand: () => true},
  {sp: "renard", z: [21.2, 21.8, 3, 17], quand: () => true},
  {sp: "oiseau", z: [2, 13, 17, 23], quand: S => S.bat.champ > 0, n: 4}, {sp: "oiseau", z: null, place: true, quand: S => S.statut >= 1, n: 3},
  {sp: "poule", z: null, logis: true, quand: S => S.bat.cabane > 0, n: 3},
  {sp: "chat", z: null, place: true, calme: true, quand: S => S.statut >= 1}, {sp: "chat", z: null, logis: true, calme: true, quand: S => S.statut >= 2},
  {sp: "chien", suit: true, quand: S => S.pop >= 3}
];
const LISTE = [], POISSONS = [];
function preparer(){
  const r = alea(21);
  BETES.forEach((B, k) => { for (let i = 0; i < (B.n || 1); i++) LISTE.push({...B, k, x: 0, y: 0, e: "pause", jusqua: r() * 4, dir: "b", ph: r() * 9, bloc: Math.floor(r() * 4), pose: false}); });
  const eaux = []; for (let y = 0; y < C.H; y++) for (let x = 0; x < C.W; x++) if (C.GRILLE[y][x] === "~" && C.case_(x - 1, y) === "~" && C.case_(x + 1, y) === "~") eaux.push([x, y]);
  for (let i = 0; i < 8; i++){ const [x, y] = eaux[Math.floor(r() * eaux.length)]; POISSONS.push({x: x + .5, y: y + .5, dir: r() < .5 ? "g" : "d", ph: r() * 9, saut: 3 + r() * 20}); }
}
function zoneDe(a, S){
  if (a.z) return a.z;
  if (a.place){ const [fx, fy] = C.FEU, R = C.PLACE(S.statut) * .8; return [fx - R + .5, fx + R + .5, fy - R * .6 + .5, fy + R * .6 + .5]; }
  if (a.logis){ const id = Object.keys(S.lots).find(i => S.lots[i] === "cabane" || S.lots[i] === "maison"); if (!id) return null; const L = C.LOTS[id]; return [L.x - .3, L.x + L.l + .3, L.y + L.h, L.y + L.h + .8]; }
  return null;
}
const libre = (x, y) => /[.^]/.test(C.case_(Math.floor(x), Math.floor(y))) && Math.hypot(x - C.FEU[0] - .5, y - C.FEU[1] - .5) > 1.3;
function trajetLibre(x0, y0, x1, y1){ const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3); for (let i = 1; i <= n; i++) if (!libre(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return false; return true; }
function bouger(a, dt, t, S, agents){
  const E = ESPECES[a.sp];
  if (a.suit){ const m = agents[0]; if (!m) return; const tx = m.x / T - .7, ty = m.y / T + .25, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy);
    if (!a.pose){ a.x = tx; a.y = ty; a.pose = true; }
    if (d < .3){ a.e = "pause"; return; } if (d > 8){ a.x = tx; a.y = ty; return; }
    a.e = "marche"; const v = Math.min(d, (d > 2 ? 2.4 : 1.4) * dt); a.x += dx / d * v; a.y += dy / d * v; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "d" : "g") : (dy > 0 ? "b" : "h"); return; }
  const Z = zoneDe(a, S); if (!Z) return;
  if (!a.pose){
    for (let k = 0; k < 40; k++){ a.x = Z[0] + hash(a.k + k, 3) * (Z[1] - Z[0]); a.y = Z[2] + hash(a.k, 5 + k) * (Z[3] - Z[2]); if (libre(a.x, a.y)) break; }
    a.pose = true;
  }
  if (a.e === "pause"){ if (t > a.jusqua){
    for (let k = 0; k < 8; k++){ const tx = Z[0] + Math.random() * (Z[1] - Z[0]), ty = Z[2] + Math.random() * (Z[3] - Z[2]); if (trajetLibre(a.x, a.y, tx, ty)){ a.tx = tx; a.ty = ty; a.e = "marche"; break; } }
    if (a.e === "pause") a.jusqua = t + 1;   // rien de libre en ligne droite : il attend
  } return; }
  const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy), v = E.v * dt;
  if (d < v){ a.x = a.tx; a.y = a.ty; a.e = "pause"; a.jusqua = t + (a.calme ? 8 + Math.random() * 14 : 1.5 + Math.random() * 5); return; }
  a.x += dx / d * v; a.y += dy / d * v; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "d" : "g") : (dy > 0 ? "b" : "h");
}
function cadre(x, E, nom, ligne, col, X, Y, miroir, bloc){
  const a = AA[nom]; if (!a || !animaux.naturalWidth) return; const k = E.k, sx = a[0] + (bloc || 0) + col * E.l, sy = a[1] + ligne * E.h;
  if (miroir){ x.save(); x.translate(Math.round(X), 0); x.scale(-1, 1); x.drawImage(animaux, sx, sy, E.l, E.h, Math.round(-E.l * k / 2), Math.round(Y - E.py * k), E.l * k, E.h * k); x.restore(); }
  else x.drawImage(animaux, sx, sy, E.l, E.h, Math.round(X - E.l * k / 2), Math.round(Y - E.py * k), E.l * k, E.h * k);
}
function bete(x, a, t){
  const E = ESPECES[a.sp], X = a.x * T, Y = a.y * T, bloc = E.bloc ? a.bloc * E.bloc : 0;
  x.fillStyle = "rgba(30,40,10,.22)"; x.beginPath(); x.ellipse(X, Y, E.l * E.k * .28, E.l * E.k * .1, 0, 0, 6.3); x.fill();
  if (a.e === "marche"){ const r = E.rang[a.dir], mi = r === null; cadre(x, E, E.im, mi ? E.rang.g : r, Math.floor(t * 8 + a.ph) % E.n, X, Y, mi, bloc); return; }
  const [nom, rangs, n, col0] = E.repos, r = rangs[a.dir], mi = r === null;
  cadre(x, E, nom, mi ? rangs.g : r, col0 != null ? col0 : Math.floor(t * 3 + a.ph) % n, X, Y, mi, bloc);
}
function poisson(x, a, t, dt){
  const E = ESPECES.poisson, nx = a.x + (a.dir === "d" ? 1 : -1) * E.v * dt;
  if (C.case_(Math.floor(nx + (a.dir === "d" ? .6 : -.6)), Math.floor(a.y)) !== "~") a.dir = a.dir === "d" ? "g" : "d"; else a.x = nx;
  const X = a.x * T, Y = a.y * T, c = (t + a.saut) % 14;
  if (c < .9){ const u = c / .9; cadre(x, E, E.im, E.rang[a.dir], 1, X, Y - Math.sin(u * Math.PI) * 22, false, 0); return; }
  if (c < 2.4){ const u = (c - .9) / 1.5; x.strokeStyle = `rgba(240,250,255,${.8 * (1 - u)})`; x.lineWidth = 2; x.beginPath(); x.ellipse(X, Y, 5 + u * 15, 2 + u * 6, 0, 0, 6.3); x.stroke(); }
  x.save(); x.globalAlpha = .45; x.filter = "brightness(.35)"; cadre(x, E, E.im, E.rang[a.dir], Math.floor(t * 6 + a.ph) % E.n, X, Y, false, 0); x.restore();
}
function coeur(x, X, Y, a){ x.globalAlpha = Math.max(0, a); x.fillStyle = "#e0405a"; for (const [dx, dy, w] of [[-3, 0, 2], [1, 0, 2], [-4, 1, 8], [-4, 2, 8], [-3, 3, 6], [-2, 4, 4], [-1, 5, 2]]) x.fillRect(Math.round(X + dx), Math.round(Y + dy), w, 1); x.globalAlpha = 1; }

/* ---------- les enfants : ils jouent en rond sur la place (à partir du hameau) ---------- */
const vill = new Image(); vill.src = "img/villageois.png";
function enfants(L, x, t, S){
  const n = S.statut < 1 ? 0 : Math.min(VL.enfants, Math.floor(S.pop / 3)); if (!n || nuit(S) > .5) return;
  const [fx, fy] = C.FEU, R = C.PLACE(S.statut) * T * .62;
  for (let i = 0; i < n; i++){
    const v = (i % 3 === 2 ? -1 : 1) * (.5 + (i % 2) * .1), an = t * v / (R / T) + i * 1.05, r = R * (1 + (i % 2) * .18);
    const X = (fx + .5) * T + Math.cos(an) * r, Y = (fy + .5) * T + Math.sin(an) * r * .7, vx = -Math.sin(an) * v, vy = Math.cos(an) * v;
    const dir = Math.abs(vx) > Math.abs(vy) * .7 ? (vx > 0 ? "d" : "g") : (vy > 0 ? "b" : "h");
    L.push([Y, () => { const row = {h: 0, g: 1, b: 2, d: 3}[dir], k = .55, sx = (i % 2) * 576 + (1 + Math.floor(t * 10 + i) % 8) * 64, sy = (VL.adultes.length + Math.floor(i / 2)) * 256 + row * 64;
      x.drawImage(vill, sx, sy, 64, 64, Math.round(X - 32 * k), Math.round(Y - 60 * k), 64 * k, 64 * k); }]);
  }
}

/* ---------- ce qui a des pieds : à ranger avec le reste ---------- */
let pret = false;
function objets(L, x, t, dt, S, agents, vis){
  if (!pret){ preparer(); pret = true; }
  const N = nuit(S);
  for (const a of LISTE){
    if (!a.quand(S)) continue;
    if (N > .6 && ["oiseau", "poule"].includes(a.sp)) continue;   // la nuit, oiseaux et poules dorment
    bouger(a, dt, t, S, agents);
    if (!a.pose || !vis(a.x * T, a.y * T, 60)) continue;
    L.push([a.y * T, () => bete(x, a, t)]);
    // un villageois qui flâne près du chat le caresse
    if (a.sp === "chat" && a.e === "pause"){ const m = agents.find(g => g.etat === "flane" && Math.hypot(g.x / T - a.x, g.y / T - a.y) < 1.4);
      if (m && (t % 5) < 2.2){ const u = (t % 5) / 2.2; L.push([a.y * T + 1, () => coeur(x, a.x * T + 4, a.y * T - 26 - u * 14, 1 - u)]); } }
  }
  if (saison(S) !== 3) for (const p of POISSONS) L.push([0, () => poisson(x, p, t, dt)]);
  enfants(L, x, t, S);
}

/* ---------- le ciel : vols d'oiseaux, pluie ou neige, nuit et lumières ---------- */
const GOUTTES = Array.from({length: 150}, (_, i) => ({x: (i * 977) % 1000 / 1000, y: (i * 613) % 1000 / 1000, v: .8 + (i % 7) / 10}));
const VOL = [0, 1, 2, 3, 4].map(i => ({dx: (i % 3) * 22 - i * 4, dy: i * 12 - (i % 2) * 16}));
function ciel(x, t, S, X0, Y0, vw, vh, lumieres){
  const N = nuit(S), s = saison(S), P = pluie(S), neige = s === 3;
  // vols d'oiseaux qui traversent (le jour)
  if (N < .5 && !P) for (let n = 0; n < 2; n++){ const per = 14 + n * 7, u = ((t + n * 5) % per) / per, versD = (Math.floor((t + n * 5) / per) + n) % 2 === 0;
    const ox = X0 - 80 + (versD ? u : 1 - u) * (vw + 160), oy = Y0 + vh * (.18 + .3 * n) + Math.sin(t * .8 + n) * 30;
    for (const b of VOL) cadre(x, {l: 32, h: 32, py: 16, k: .5}, n ? "oiseau1" : "oiseau2", versD ? 0 : 3, Math.floor(t * 10 + b.dx) % 3, ox + b.dx * (versD ? -1.3 : 1.3), oy + b.dy * 1.3, false, 0); }
  // pluie ou neige
  if (P){
    x.fillStyle = neige ? "rgba(200,210,230,.12)" : "rgba(30,40,60,.2)"; x.fillRect(X0, Y0, vw, vh);
    for (const g of GOUTTES){ const px = X0 + ((g.x * vw + (neige ? Math.sin(t + g.v * 9) * 20 : -t * 60 * g.v)) % vw + vw) % vw, py = Y0 + ((g.y * vh + t * (neige ? 30 : 420) * g.v) % vh);
      if (neige){ x.fillStyle = "rgba(255,255,255,.9)"; x.fillRect(Math.round(px), Math.round(py), 3, 3); }
      else { x.strokeStyle = "rgba(200,220,255,.55)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(px, py); x.lineTo(px - 4, py + 14); x.stroke(); } }
    if (!neige){ x.strokeStyle = "rgba(230,245,255,.6)"; x.lineWidth = 1.5;
      for (let k = 0; k < 40; k++){ const u = (t * 1.3 + k * .37) % 1, gx = X0 + ((k * 211) % 997) / 997 * vw, gy = Y0 + ((k * 431) % 991) / 991 * vh; if (C.case_(Math.floor(gx / T), Math.floor(gy / T)) !== "~") continue;
        x.globalAlpha = 1 - u; x.beginPath(); x.ellipse(gx, gy, 2 + u * 8, 1 + u * 3, 0, 0, 6.3); x.stroke(); } x.globalAlpha = 1; }
  }
  // la nuit : tout s'assombrit, le feu et les fenêtres éclairent
  if (N > 0){
    x.fillStyle = `rgba(12,18,48,${.55 * N})`; x.fillRect(X0, Y0, vw, vh);
    x.globalCompositeOperation = "lighter";
    for (const [X, Y, r, f] of lumieres){ const a = N * f * (.85 + .15 * Math.sin(t * 7 + X)); const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, `rgba(255,170,70,${.5 * a})`); g.addColorStop(1, "rgba(255,120,40,0)"); x.fillStyle = g; x.fillRect(X - r, Y - r, 2 * r, 2 * r); }
    x.globalCompositeOperation = "source-over";
  }
}

window.TerresVie = {saison, annee, nuit, pluie, NOMS, etatChamp, recolorer, sol, objets, ciel};
})();

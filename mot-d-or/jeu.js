/* Le Mot d'or : un mot de 6 lettres par jour en 6 essais, sur un bureau du soir (cahier des charges : specs/mot-d-or.md,
   maquette validée : maquettes/mot-d-or-2.html). Les mots sont dans mots.js (outils/mot-d-or-mots.js).
   La scène (pixel art) se dessine dans une toile de 216 px de large (hauteur 384 à 468 selon l'écran), agrandie sans
   lissage ; les textes d'interface sont écrits ensuite sur la toile affichée, en Fredoka, pour rester nets.
   Sauvegardes : motdor.jour { j: AAAAMMJJ, rows: [mots], fini: "win" | "lose" | null } (partie du jour, reprise telle
   quelle), motdor.daily { AAAAMMJJ : essais } (mots du jour trouvés), motdor.stats { parties, gagnees, serie, record,
   dernier: AAAAMMJJ du dernier mot du jour trouvé, dist: [6] }, motdor.opts { son, aide }.
   Entraînement : un mot au hasard, non classé, non sauvegardé. */
(function () {
"use strict";
const MOTS = window.MOTDOR_MOTS, SOL = MOTS.solutions.split(" "), ACC = new Set(MOTS.acceptes.split(" "));
const LW = 216, OUT = "#120c16", PIX = '"Press Start 2P", monospace', UIF = '"Fredoka", system-ui, sans-serif';
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
const pixReady = () => document.fonts && document.fonts.check('8px "Press Start 2P"');
const lire = (k, d) => { try { const v = JSON.parse(localStorage.getItem("motdor." + k)); return v == null ? d : v; } catch (e) { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem("motdor." + k, JSON.stringify(v)); } catch (e) { /* stockage plein ou interdit */ } };
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const z2 = n => String(n).padStart(2, "0");

// ---------- dates : AAAAMMJJ du jour local, mot du jour
const numDe = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const auj = () => numDe(new Date());
const hier = j => numDe(new Date(Math.floor(j / 10000), Math.floor(j / 100) % 100 - 1, j % 100 - 1));
const dateDe = j => new Date(Math.floor(j / 10000), Math.floor(j / 100) % 100 - 1, j % 100);
function motDuJour(j){
  const [a, m, d] = MOTS.debut.split("-").map(Number);
  const n = Math.round((Date.UTC(Math.floor(j / 10000), Math.floor(j / 100) % 100 - 1, j % 100) - Date.UTC(a, m - 1, d)) / 864e5);
  return SOL[((n % SOL.length) + SOL.length) % SOL.length];
}
function evaluate(guess, secret){
  const res = Array(6).fill("grey"), left = {};
  for (let i = 0; i < 6; i++){ if (guess[i] === secret[i]) res[i] = "gold"; else left[secret[i]] = (left[secret[i]] || 0) + 1; }
  for (let i = 0; i < 6; i++) if (res[i] !== "gold" && left[guess[i]] > 0){ res[i] = "silver"; left[guess[i]]--; }
  return res;
}

// ---------- géométrie : la hauteur dépend de l'écran
const TW = 26, TF = 23, TD = 3, STEP = 29, GX = 22;
const KEYS = ["AZERTYUIOP", "QSDFGHJKLM", ">WXCVBN<"], KSTEP = 44, KF = 34, KD = 3;
let VH = 384, TY = 238, KY = 246, FY = 50, GY = 58;
function geometrie(){
  TY = VH - 146; KY = TY + 8;
  FY = 50 + Math.max(0, Math.floor((TY - 4 - 50 - 184) / 2)); GY = FY + 8;
}

// matières : [reflet, base, ombre, profond]
const M = {
  wood:   ["#fffdf2", "#efe4c8", "#cdbb96", "#7e6c4c"],   // ivoire
  gold:   ["#fff8c8", "#ffd23f", "#e09a1c", "#9a5a0c"],
  silver: ["#ffffff", "#d9e0ea", "#a6b2c4", "#646f84"],
  grey:   ["#7a7068", "#5c534c", "#463e38", "#2c2622"],
  off:    ["#b8ab90", "#9a8e76", "#7c705a", "#4e4436"],   // VALIDER éteint
};
const INK = {wood: "#3e2616", gold: "#6a3606", silver: "#2e3648", grey: "#e2d8cc", off: "#4a3e30"};
const TINK = {wood: ["#4a2c1a", "#ffffff"], gold: ["#7a4208", "#fff6c8"], silver: ["#3a4256", "#ffffff"], grey: ["#1e1814", "#9a9084"]};
const RANK = {grey: 1, silver: 2, gold: 3};

/* =====================================================================
   Décor : bureau d'acajou, sous-main en cuir, écritoire, cercle de lumière
   ===================================================================== */
function noiseRect(g, x0, y0, w, h, pal, pick){
  const img = g.getImageData(x0, y0, w, h), d = img.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
    const [r, gg, b] = pal[pick(x, y, hash(x + x0, y * 7 + y0))], i = (y * w + x) * 4;
    d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
  }
  g.putImageData(img, x0, y0);
}
function buildBG(){
  const c = mk(LW, VH), g = c.getContext("2d"), img = g.createImageData(LW, VH), d = img.data;
  const PAL = [[0x9a, 0x4a, 0x2e], [0x7c, 0x36, 0x22], [0x62, 0x28, 0x1a], [0x48, 0x1c, 0x12], [0x2a, 0x0e, 0x0a]], PL = 30;
  for (let y = 0; y < VH; y++) for (let x = 0; x < LW; x++){
    const p = Math.floor(y / PL), yy = y % PL;
    const gr = Math.sin(y * .9 + 3.2 * Math.sin(x * .021 + p * 2.3 + 4) + 1.6 * Math.sin(x * .057 + p));
    let k = gr > .82 ? 2 : gr < -.9 ? 0 : 1;
    if (hash(x >> 2, y * 31 + p) < .05) k = Math.min(3, k + 1);
    if (yy === 0) k = 4; else if (yy === 1) k = 0; else if (yy === PL - 1) k = 3;
    const j = 30 + Math.floor(hash(p, 5) * 150); if (x === j) k = 4; else if (x === j + 1) k = 0;
    const [r, gg, b] = PAL[k], tint = (hash(p, 3) - .5) * 16, i = (y * LW + x) * 4;
    d[i] = r + tint; d[i + 1] = gg + tint * .7; d[i + 2] = b + tint * .4; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // sous-main en cuir bordeaux, coins plus sombres, filets dorés au fer
  const fx = 12, fy = FY, fw = 192, fh = 184;
  R(g, fx + 3, fy + 3, fw, fh, "rgba(10,2,2,.6)");
  const LE = [[0x9c, 0x2e, 0x36], [0x84, 0x22, 0x2c], [0x6c, 0x1a, 0x24], [0x52, 0x12, 0x1a]];
  noiseRect(g, fx, fy, fw, fh, LE, (x, y, n) => n < .08 ? 0 : n > .9 ? 2 : 1);
  const LC = ["#5a2418", "#461a10", "#34120a"];
  for (const [ox, oy, sx, sy] of [[0, 0, 1, 1], [fw, 0, -1, 1], [0, fh, 1, -1], [fw, fh, -1, -1]])
    for (let i = 0; i < 22; i++) for (let j = 0; j < 22 - i; j++){
      const x = fx + ox + sx * i - (sx < 0 ? 1 : 0), y = fy + oy + sy * j - (sy < 0 ? 1 : 0);
      R(g, x, y, 1, 1, LC[i + j === 21 ? 2 : hash(x, y) < .1 ? 0 : 1]);
    }
  R(g, fx, fy, fw, 1, "#3a0c10"); R(g, fx, fy + fh - 1, fw, 1, "#2a080c"); R(g, fx, fy, 1, fh, "#3a0c10"); R(g, fx + fw - 1, fy, 1, fh, "#2a080c");
  for (const k of [3, 5]){ R(g, fx + k, fy + k, fw - 2 * k, 1, "#d8a84a"); R(g, fx + k, fy + fh - k - 1, fw - 2 * k, 1, "#a87a2a"); R(g, fx + k, fy + k, 1, fh - 2 * k, "#d8a84a"); R(g, fx + fw - k - 1, fy + k, 1, fh - 2 * k, "#a87a2a"); }
  for (let r = 0; r < 6; r++) for (let c2 = 0; c2 < 6; c2++){
    const x = GX + c2 * STEP, y = GY + r * STEP;
    R(g, x, y, TW, TF + TD, "#561420"); R(g, x, y, TW, 2, "#3a0c14"); R(g, x, y, 2, TF + TD, "#3a0c14");
    R(g, x + 1, y + TF + TD - 1, TW - 1, 1, "#a8404a"); R(g, x + TW - 1, y + 1, 1, TF + TD - 1, "#a8404a");
  }
  // écritoire du clavier
  const tx = 2, ty = TY, tw = 212, th = 142;
  R(g, tx + 2, ty + 3, tw, th, "rgba(10,2,2,.6)"); R(g, tx - 1, ty - 1, tw + 2, th + 2, OUT);
  R(g, tx, ty, tw, th, "#5a2416"); R(g, tx, ty, tw, 1, "#a8603a"); R(g, tx, ty, 1, th, "#a8603a"); R(g, tx, ty + th - 1, tw, 1, "#2a0e08"); R(g, tx + tw - 1, ty, 1, th, "#2a0e08");
  noiseRect(g, tx + 2, ty + 2, tw - 4, th - 4, LE, (x, y, n) => n < .06 ? 1 : n > .9 ? 3 : 2);
  R(g, tx + 3, ty + 3, tw - 6, 1, "#c8983a"); R(g, tx + 3, ty + th - 4, tw - 6, 1, "#a87a2a");
  // pénombre tramée autour du cercle de lumière de la lampe
  const im = g.getImageData(0, 0, LW, VH), dd = im.data, cy = FY + 92;
  for (let y = 0; y < VH; y++) for (let x = 0; x < LW; x++){
    const v = Math.max(0, Math.hypot((x - 108) / 150, (y - cy) / 210) - .42);
    const f = 1 - Math.min(5, Math.floor(v * 7 + BAYER[(y & 3) * 4 + (x & 3)] / 16)) * .12, i = (y * LW + x) * 4;
    dd[i] *= f; dd[i + 1] *= f; dd[i + 2] *= f;
  }
  g.putImageData(im, 0, 0);
  return c;
}

/* =====================================================================
   Pixel art : plaques, tuiles, touches, boutons
   ===================================================================== */
function plate(g, x, y, w, h){
  R(g, x + 2, y - 2, w - 4, h + 4, OUT); R(g, x - 2, y + 2, w + 4, h - 4, OUT); R(g, x, y, w, h, OUT);
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "rgba(92,58,30,.96)"); gr.addColorStop(1, "rgba(36,20,10,.97)");
  g.fillStyle = gr; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  R(g, x + 2, y + 1, w - 4, 1, "rgba(255,214,150,.5)"); R(g, x + 1, y + 2, 1, h - 4, "rgba(255,214,150,.5)");
  R(g, x + 2, y + h - 2, w - 4, 1, "rgba(0,0,0,.45)"); R(g, x + w - 2, y + 2, 1, h - 4, "rgba(0,0,0,.45)");
}
function block(g, x, y, w, f, d, P){
  R(g, x, y - 1, w, f + d + 2, OUT); R(g, x - 1, y, w + 2, f + d, OUT);
  R(g, x, y + f, w, d, P[3]); R(g, x + 1, y + f, w - 2, 1, P[2]);
  R(g, x, y, w, f, P[1]); R(g, x + 1, y + f - 5, w - 2, 4, P[2]);
  R(g, x + 1, y, w - 2, 1, P[0]); R(g, x, y + 1, 1, f - 2, P[0]); R(g, x + 1, y + 1, w - 3, 1, P[0]);
  R(g, x + w - 1, y + 1, 1, f - 1, P[2]); R(g, x + 1, y + f - 1, w - 1, 1, P[2]);
  R(g, x, y, 1, 1, OUT); R(g, x + w - 1, y, 1, 1, OUT);
}
const CACHE = {};
function tileImg(mat, ch){
  const key = "t" + mat + ch; if (CACHE[key]) return CACHE[key];
  const c = mk(TW + 2, TF + TD + 2), g = c.getContext("2d");
  block(g, 1, 1, TW, TF, TD, M[mat]);
  if (mat === "silver") for (let yy = 4; yy < TF - 5; yy += 3) R(g, 4, yy, TW - 6, 1, "#e9eef4");
  if (mat === "gold"){ R(g, 4, 4, 3, 1, "#ffffff"); R(g, 4, 5, 1, 2, "#ffffff"); }
  if (ch){
    g.font = "16px " + PIX; g.textAlign = "left"; g.textBaseline = "top";
    const [ink, lip] = TINK[mat];
    g.fillStyle = lip; g.fillText(ch, 7, 6); g.fillStyle = ink; g.fillText(ch, 6, 5);
  }
  if (pixReady()) CACHE[key] = c;
  return c;
}
function keyImg(mat, w){
  const key = "k" + mat + w; if (CACHE[key]) return CACHE[key];
  const c = mk(w + 2, KF + KD + 2);
  block(c.getContext("2d"), 1, 1, w, KF, KD, M[mat]);
  return CACHE[key] = c;
}
// petit bouton de cuir à icône dorée (retour, aide, statistiques, fermer)
function iconButton(g, x, y, s, icon, down){
  y += down;
  R(g, x, y - 1, s, s + 3, OUT); R(g, x - 1, y, s + 2, s + 1, OUT);
  R(g, x, y + s - 1, s, 2, "#3a1208"); R(g, x, y, s, s - 1, "#7a3420"); R(g, x + 1, y, s - 2, 1, "#c06a44"); R(g, x, y + 1, 1, s - 3, "#c06a44"); R(g, x + 1, y + s - 3, s - 2, 1, "#5a2414");
  const c = "#ffd23f", cx = x + (s >> 1), cy = y + (s >> 1) - 1;
  if (icon === "retour"){ for (let k = 0; k < 5; k++) R(g, cx - 4 + k, cy - k, 1, k * 2 + 1, c); R(g, cx + 1, cy - 1, 5, 3, c); }
  if (icon === "aide"){ R(g, cx - 3, cy - 6, 6, 2, c); R(g, cx + 2, cy - 5, 2, 4, c); R(g, cx - 4, cy - 5, 2, 2, c); R(g, cx, cy - 2, 2, 3, c); R(g, cx, cy + 3, 2, 2, c); }
  if (icon === "stats"){ R(g, cx - 5, cy + 1, 3, 5, c); R(g, cx - 1, cy - 6, 3, 12, c); R(g, cx + 3, cy - 2, 3, 8, c); }
  if (icon === "fermer") for (let k = 0; k < 8; k++){ R(g, cx - 4 + k, cy - 3 + k, 2, 1, c); R(g, cx + 3 - k, cy - 3 + k, 2, 1, c); }
}
function spark(g, x, y, s, c1 = "#ffffff", c2 = "#ffe066"){
  x = Math.round(x); y = Math.round(y);
  if (s <= 0) return; if (s === 1){ R(g, x, y, 1, 1, c1); return; }
  R(g, x - s, y, s * 2 + 1, 1, c2); R(g, x, y - s, 1, s * 2 + 1, c2); R(g, x - 1, y, 3, 1, c1); R(g, x, y - 1, 1, 3, c1);
}
function flame(g, x, y, t){
  const f = Math.floor(t * 8) % 3, j = f === 1 ? 1 : f === 2 ? -1 : 0;
  const rows = [[3, 1], [2, 3], [2, 4], [1, 5], [1, 6], [0, 7], [0, 8], [1, 7], [2, 5]];
  rows.forEach(([o, w], i) => R(g, x + o + (i < 3 ? j : 0) - 1, y + i, w + 2, 1, OUT));
  rows.forEach(([o, w], i) => { const jj = i < 3 ? j : 0; R(g, x + o + jj, y + i, w, 1, i < 4 ? "#ffd23f" : "#ff7a2a"); if (i > 3) R(g, x + o + jj + w - 2, y + i, 2, 1, "#d8401c"); });
  R(g, x + 3, y + 5, 2, 2, "#fff6c2");
}
function logo(g, s, x, y, size){
  g.font = size + "px " + PIX; g.textAlign = "center"; g.textBaseline = "top"; g.lineJoin = "round";
  g.fillStyle = OUT; g.fillText(s, x + 1, y + 2); g.lineWidth = 3; g.strokeStyle = OUT; g.strokeText(s, x, y);
  const gr = g.createLinearGradient(0, y, 0, y + size); gr.addColorStop(0, "#fff6c2"); gr.addColorStop(.5, "#ffd23f"); gr.addColorStop(1, "#e0782a");
  g.fillStyle = gr; g.fillText(s, x, y);
}

/* =====================================================================
   Sons (Web Audio, discrets)
   ===================================================================== */
const Son = (() => {
  let ctx = null, on = true;
  const ouvrir = () => { if (ctx || !on) return; try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ctx = null; } };
  function note(f, t0, dur, type = "sine", vol = .12, f2){
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + dur + .02);
  }
  function toc(){
    if (!ctx) return;
    const n = ctx.sampleRate * .04, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = "bandpass"; f.frequency.value = 1700; f.Q.value = 2; g.gain.value = .35;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(ctx.destination); s.start();
  }
  return {
    ouvrir, actif: () => on,
    regler(v){ on = v; if (!on && ctx){ try { ctx.close(); } catch (e) {} ctx = null; } },
    jouer(nom){
      if (!on) return; ouvrir(); if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      if (nom === "touche") toc();
      if (nom === "grey") note(196, 0, .09, "triangle", .1);
      if (nom === "silver") note(523, 0, .14, "sine", .08);
      if (nom === "gold"){ note(1047, 0, .45, "sine", .07); note(1568, .01, .35, "sine", .035); }
      if (nom === "erreur"){ note(150, 0, .08, "square", .035); note(140, .1, .1, "square", .035); }
      if (nom === "victoire") [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, i * .11, .5, "triangle", .08));
      if (nom === "defaite"){ note(330, 0, .4, "sine", .09); note(247, .32, .6, "sine", .09); }
    },
  };
})();

/* =====================================================================
   État, sauvegardes
   ===================================================================== */
const FLIPGAP = .24, FLIPLEN = .38, REVEAL = 5 * FLIPGAP + FLIPLEN;
const opts = Object.assign({son: true, aide: false}, lire("opts", {}));
Son.regler(opts.son);
const S = {mode: "jour", j: 0, secret: "", rows: [], cur: Array(6).fill(""), pos: 0, reveal: null, over: null, overT: -9,
  shakeT: -9, popT: -9, popC: -1, toast: "", toastT: -9, toastLong: false, panel: null, panelT: 0, panelAuto: false, down: {}, sonne: {}};
let stats = Object.assign({parties: 0, gagnees: 0, serie: 0, record: 0, dernier: 0, dist: [0, 0, 0, 0, 0, 0]}, lire("stats", {}));
const serieActuelle = () => (stats.dernier === S.j || stats.dernier === hier(S.j) ? stats.serie : 0);
const now = () => performance.now() / 1000;
const filled = () => S.cur.filter(Boolean).length;

function chargerJour(){
  const j = auj(), sv = lire("jour", null);
  S.mode = "jour"; S.j = j; S.secret = motDuJour(j); S.cur = Array(6).fill(""); S.pos = 0; S.reveal = null; S.over = null; S.sonne = {};
  S.rows = (sv && sv.j === j && Array.isArray(sv.rows) ? sv.rows.filter(w => /^[A-Z]{6}$/.test(w)).slice(0, 6) : []).map(w => ({w, res: evaluate(w, S.secret)}));
  if (sv && sv.j === j && sv.fini) S.over = sv.fini;
  else if (S.rows.length && (S.rows[S.rows.length - 1].w === S.secret || S.rows.length === 6)) finir(true);   // quitté pendant le retournement
  S.overT = -9;
}
function sauverJour(){ if (S.mode === "jour") ecrire("jour", {j: S.j, rows: S.rows.map(r => r.w), fini: S.over}); }
function entrainement(){
  S.mode = "entrainement"; S.secret = SOL[Math.floor(Math.random() * SOL.length)];
  S.rows = []; S.cur = Array(6).fill(""); S.pos = 0; S.reveal = null; S.over = null; S.panel = null; S.toast = ""; S.sonne = {};
}
function finir(silencieux){
  const win = S.rows[S.rows.length - 1].w === S.secret;
  S.over = win ? "win" : "lose"; S.overT = silencieux ? -9 : now();
  if (!silencieux){
    if (win){ toast(["Incroyable !", "Magnifique !", "Superbe !", "Bravo !", "Bien joué !", "Ouf, de justesse !"][S.rows.length - 1]); vibrer([20, 60, 20, 60, 40]); Son.jouer("victoire"); }
    else { toast(S.secret, true); Son.jouer("defaite"); }
  }
  if (S.mode !== "jour") return;
  stats.parties++;
  if (win){
    stats.gagnees++; stats.serie = stats.dernier === hier(S.j) ? stats.serie + 1 : 1; stats.dernier = S.j;
    const nouveauRecord = stats.serie > stats.record; stats.record = Math.max(stats.record, stats.serie);
    stats.dist[S.rows.length - 1]++;
    const daily = lire("daily", {}); daily[S.j] = S.rows.length; ecrire("daily", daily);
    if (window.LudoScores){
      LudoScores.submit("motdor", "daily:" + S.j, S.rows.length, true);
      if (nouveauRecord) LudoScores.submit("motdor", "serie", stats.record, false);
    }
  } else stats.serie = 0;
  ecrire("stats", stats); sauverJour();
}

// ---------- actions
function toast(m, long){ S.toast = m; S.toastT = now(); S.toastLong = !!long; }
function vibrer(ms){ try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} }
function erreur(m){ S.shakeT = now(); vibrer([30, 40, 30]); Son.jouer("erreur"); toast(m); }
function valider(){
  const n = filled();
  if (n < 6) return erreur(n === 5 ? "Il manque 1 lettre" : "Il manque " + (6 - n) + " lettres");
  const w = S.cur.join("");
  if (!ACC.has(w)) return erreur("Ce mot n'est pas dans le dictionnaire");
  S.rows.push({w, res: evaluate(w, S.secret)}); S.reveal = {row: S.rows.length - 1, t0: now()}; S.sonne = {};
  S.cur = Array(6).fill(""); S.pos = 0;
  sauverJour();
}
function taper(ch){
  if (S.over || S.reveal || S.panel) return;
  if (ch === ">") return valider();
  Son.jouer("touche");
  if (ch === "<"){
    if (S.cur[S.pos]) S.cur[S.pos] = "";
    else if (S.pos > 0){ S.pos--; S.cur[S.pos] = ""; }
    return;
  }
  S.cur[S.pos] = ch; S.popT = now(); S.popC = S.pos;
  let p = S.pos + 1; while (p < 6 && S.cur[p]) p++;     // le curseur saute à la prochaine case vide
  if (p >= 6){ p = S.cur.indexOf(""); if (p < 0) p = 5; }
  S.pos = p;
}
function ouvrir(p){ S.panel = p; S.panelT = now(); }
function fermer(){
  if (S.panel === "aide" && !opts.aide){ opts.aide = true; ecrire("opts", opts); }
  S.panel = null;
}
function partager(){
  const d = dateDe(S.j), ico = {gold: "🟨", silver: "⬜", grey: "⬛"};
  const txt = "Le Mot d'or · " + d.getDate() + " " + MOIS[d.getMonth()] + " · " + (S.over === "win" ? S.rows.length : "X") + "/6\n" + S.rows.map(r => r.res.map(m => ico[m]).join("")).join("\n");
  const ko = () => toast("Copie impossible sur cet appareil");
  try { navigator.clipboard.writeText(txt).then(() => toast("Résultat copié !"), ko); } catch (e) { ko(); }
}

/* =====================================================================
   Toile, toucher, clavier
   ===================================================================== */
const cv = document.getElementById("cv"), g = cv.getContext("2d");
let K = 3, BG = null, low = null, lg = null, top = null, tg = null, hits = [];
function taille(){
  const w = window.innerWidth, h = window.innerHeight;
  VH = Math.max(384, Math.min(468, Math.round(LW * h / w)));
  geometrie();
  const cw = Math.min(w, h * LW / VH), ch = cw * VH / LW, dpr = Math.min(3, window.devicePixelRatio || 1);
  cv.style.width = cw + "px"; cv.style.height = ch + "px";
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); K = cv.width / LW;
  low = mk(LW, VH); lg = low.getContext("2d"); top = mk(LW, VH); tg = top.getContext("2d"); BG = null;
}
window.addEventListener("resize", taille);
taille();

cv.addEventListener("pointerdown", e => {
  Son.ouvrir();
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * LW, y = (e.clientY - r.top) / r.height * VH;
  for (let i = hits.length - 1; i >= 0; i--){ const h = hits[i];
    if (x >= h.x - h.pad && x < h.x + h.w + h.pad && y >= h.y - h.pad && y < h.y + h.h + h.pad){ S.down[h.id] = now(); vibrer(8); h.fn(); return; } }
  if (S.panel) fermer();
});
document.addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (S.panel){ if (k === "Escape" || k === "Enter"){ e.preventDefault(); fermer(); } return; }
  let ch = null;
  if (k === "Enter") ch = ">"; else if (k === "Backspace") ch = "<"; else if (/^[a-zA-Z]$/.test(k)) ch = k.toUpperCase();
  else if (k === "ArrowLeft" && !S.reveal){ S.pos = Math.max(0, S.pos - 1); return; }
  else if (k === "ArrowRight" && !S.reveal){ S.pos = Math.min(5, S.pos + 1); return; }
  if (!ch) return;
  e.preventDefault(); Son.ouvrir(); S.down["k" + ch] = now(); taper(ch);
});

// ---------- texte net (haute définition)
function ui(s, x, y, size, col, o = {}){
  g.font = (o.light ? 500 : 600) + " " + size * K + "px " + UIF; g.textAlign = o.align || "left"; g.textBaseline = "middle";
  if (o.shadow !== false){ g.fillStyle = o.shadow || "rgba(18,12,22,.85)"; g.fillText(s, x * K + K * .6, y * K + K * .6); }
  g.fillStyle = col; g.fillText(s, x * K, y * K);
}
function wrap(s, size, maxW, light){
  g.font = (light ? 500 : 600) + " " + size * K + "px " + UIF;
  const out = []; let line = "";
  for (const w of s.split(" ")){ const t = line ? line + " " + w : w; if (g.measureText(t).width > maxW * K && line){ out.push(line); line = w; } else line = t; }
  if (line) out.push(line); return out;
}
const textW = (s, size) => { g.font = "600 " + size * K + "px " + UIF; return g.measureText(s).width / K; };
function backIcon(cx, cy, col){
  const s = K, w = 15, h = 11, x0 = cx - w / 2 + 1, y0 = cy - h / 2;
  g.save(); g.strokeStyle = col; g.lineWidth = 1.6 * s; g.lineJoin = "round"; g.lineCap = "round";
  g.beginPath(); g.moveTo(x0 * s, cy * s); g.lineTo((x0 + 4) * s, y0 * s); g.lineTo((x0 + w) * s, y0 * s); g.lineTo((x0 + w) * s, (y0 + h) * s); g.lineTo((x0 + 4) * s, (y0 + h) * s); g.closePath(); g.stroke();
  g.beginPath(); g.moveTo((x0 + 7) * s, (cy - 2.5) * s); g.lineTo((x0 + 12) * s, (cy + 2.5) * s); g.moveTo((x0 + 12) * s, (cy - 2.5) * s); g.lineTo((x0 + 7) * s, (cy + 2.5) * s); g.stroke(); g.restore();
}

/* =====================================================================
   Dessin
   ===================================================================== */
function draw(t){
  if (!BG) BG = buildBG();
  if (S.mode === "jour" && S.j !== auj() && !S.reveal){ chargerJour(); S.panel = null; }   // minuit : nouveau mot
  if (!opts.aide && !S.panel && t > .4) ouvrir("aide");
  // fin du retournement d'une ligne
  if (S.reveal && t - S.reveal.t0 > REVEAL){
    const row = S.rows[S.reveal.row]; S.reveal = null;
    if (row.w === S.secret || S.rows.length === 6) finir(false);
  }
  if (S.over && S.overT > 0 && !S.panelAuto && t - S.overT > (S.over === "win" ? 1.9 : 2.4)){ S.panelAuto = true; ouvrir("stats"); }
  if (!S.over) S.panelAuto = false;
  hits = [];
  const hit = (id, x, y, w, h, fn, pad = 0) => hits.push({id, x, y, w, h, fn, pad});
  const isDown = id => t - (S.down[id] || -9) < .11 ? 1 : 0;
  const L = lg; L.drawImage(BG, 0, 0);
  const late = [];   // textes nets à poser après l'agrandissement

  // ---------- en-tête
  plate(L, 4, 4, 208, 42);
  if (!window.ludoArtefact){ iconButton(L, 8, 8, 24, "retour", isDown("retour")); hit("retour", 8, 8, 24, 24, () => { location.href = "../index.html"; }, 3); }
  iconButton(L, 158, 8, 24, "aide", isDown("aide")); hit("aide", 158, 8, 24, 24, () => ouvrir("aide"), 2);
  iconButton(L, 184, 8, 24, "stats", isDown("stats")); hit("stats", 184, 8, 24, 24, () => ouvrir("stats"), 2);
  logo(L, "LE MOT D'OR", 95, 15, 10);
  const done = S.rows.length - (S.reveal ? 1 : 0), d = dateDe(S.j);
  const titre = S.mode === "jour" ? "Mot du " + d.getDate() + " " + MOIS[d.getMonth()] : "Entraînement";
  const etat = S.over && !S.reveal ? (S.over === "win" ? "trouvé en " + S.rows.length : "pas trouvé") : "essai " + Math.min(6, done + 1) + " sur 6";
  late.push(() => ui(titre, 10, 38, 7.5, S.mode === "jour" ? "#ffe7b8" : "#9fd8b0"));
  late.push(() => ui(etat, 206, 38, 7.5, "#ffd23f", {align: "right"}));

  // ---------- grille
  const golds = [], known = Array(6).fill(""), keyState = {};
  S.rows.forEach((row, r) => { if (S.reveal && S.reveal.row === r) return; row.res.forEach((m, c) => { if (m === "gold") known[c] = row.w[c]; }); });
  for (let r = 0; r < 6; r++){
    const row = S.rows[r];
    if (row){
      for (let c = 0; c < 6; c++){
        const x = GX + c * STEP, y = GY + r * STEP;
        let mat = row.res[c], sc = 1, lift = 0, seen = true;
        if (S.reveal && S.reveal.row === r){
          const p = (t - S.reveal.t0 - c * FLIPGAP) / FLIPLEN;
          if (p < .5){ mat = "wood"; seen = false; }
          else if (!S.sonne[c]){ S.sonne[c] = true; Son.jouer(row.res[c]); }
          if (p > 0 && p < 1){ sc = Math.abs(Math.cos(p * Math.PI)); lift = 2; }
        }
        if (seen){ const ch = row.w[c]; if (!keyState[ch] || RANK[row.res[c]] > RANK[keyState[ch]]) keyState[ch] = row.res[c]; }
        let hop = 0;
        if (S.over === "win" && r === S.rows.length - 1){ const hp = t - S.overT - c * .09; if (hp > 0 && hp < .36) hop = Math.round(Math.sin(hp / .36 * Math.PI) * 6); }
        const img = tileImg(mat, row.w[c]), h = Math.max(2, Math.round(img.height * sc));
        R(L, x + 2, y + TF + TD + 1, TW, 2, "rgba(24,4,6,.6)"); R(L, x + TW + 1, y + 2, 2, TF + TD, "rgba(24,4,6,.6)");
        L.drawImage(img, 0, 0, img.width, img.height, x - 1, y - 1 + Math.round((img.height - h) / 2) - lift - hop, img.width, h);
        if (mat === "gold" && sc === 1) golds.push([x, y]);
      }
    } else if (r === S.rows.length && !S.over){
      const st = t - S.shakeT, sh = st < .4 ? Math.round(Math.sin(st * 50) * 3 * (1 - st / .4)) : 0;
      for (let c = 0; c < 6; c++){
        const x = GX + c * STEP + sh, y = GY + r * STEP, ch = S.cur[c];
        if (ch){
          const pop = c === S.popC && t - S.popT < .1 ? 2 : 0;
          R(L, x + 2, y + TF + TD + 1, TW, 2, "rgba(24,4,6,.6)");
          L.drawImage(tileImg("wood", ch), x - 1, y - 1 - pop);
        } else if (known[c]) late.push(() => ui(known[c], x + TW / 2, y + TF / 2 + 1, 11, "rgba(255,210,63,.32)", {align: "center", shadow: false}));
        if (!S.reveal && !S.panel) hit("case" + c, x, y, TW, TF + TD, () => { S.pos = c; }, 1);
      }
      if (!S.reveal){   // curseur : cadre doré qui respire autour de la case active
        const x = GX + S.pos * STEP + sh - 2, y = GY + r * STEP - 2;
        L.globalAlpha = .55 + .45 * Math.sin(t * 5);
        R(L, x, y, TW + 4, 1, "#ffd23f"); R(L, x, y + TF + TD + 3, TW + 4, 1, "#ffd23f"); R(L, x, y, 1, TF + TD + 4, "#ffd23f"); R(L, x + TW + 3, y, 1, TF + TD + 4, "#ffd23f");
        L.globalAlpha = 1;
      }
    }
  }
  // reflet et étincelles sur l'or, gerbe de la victoire
  const sweep = (t * 70) % 340 - 60;
  for (const [x, y] of golds){ const lx = sweep - (x - GX) - (y - GY) * .3;
    for (let yy = 1; yy < TF - 1; yy++){ const xx = Math.round(lx - yy); if (xx >= 1 && xx < TW - 2) R(L, x + xx, y + yy, 2, 1, "rgba(255,255,240,.7)"); } }
  for (let i = 0; i < 5 && golds.length; i++){
    const ph = (t * .9 + i * .37) % 1, cyc = Math.floor(t * .9 + i * .37), k = golds[Math.floor(hash(i, cyc) * golds.length)];
    spark(L, k[0] + 3 + hash(i, cyc + 5) * 20, k[1] + 2 + hash(i, cyc + 9) * 12, Math.min(3, ph < .5 ? Math.round(ph * 6) : Math.round((1 - ph) * 6)));
  }
  const burst = S.over === "win" && S.overT > 0 ? t - S.overT : -1;
  if (burst > 0 && burst < 2) for (let i = 0; i < 26; i++){
    const a = hash(i, 2) * Math.PI * 2, sp = 26 + hash(i, 3) * 44, bx = GX + (hash(i, 4) * 6 | 0) * STEP + 13, by = GY + (S.rows.length - 1) * STEP + 12;
    const x = bx + Math.cos(a) * sp * burst, y = by + Math.sin(a) * sp * burst * .8 + 22 * burst * burst;
    if (burst < 1) spark(L, x, y, i % 3 === 0 ? 2 : 1, "#ffffff", "#ffd23f"); else R(L, Math.round(x), Math.round(y), 1, 1, i % 2 ? "#ffd23f" : "#e09a1c");
  }
  // poussière dans la lumière de la lampe
  for (let i = 0; i < 16; i++){
    const sp = 3 + hash(i, 1) * 4, py = FY + 6 + ((t * sp + hash(i, 2) * 180) % 180), px = 30 + hash(i, 3) * 156 + Math.sin(t * .6 + i) * 5;
    if ((Math.sin(t * 2 + i * 1.3) + 1) / 2 > .45) R(L, Math.round(px), Math.round(py), 1, 1, "rgba(255,231,184,.75)");
  }

  // ---------- clavier
  const ready = filled() === 6 && !S.reveal && !S.over;
  KEYS.forEach((row, r) => {
    let x = 4;
    [...row].forEach(ch => {
      const w = ch === ">" || ch === "<" ? 40 : 19, y = KY + r * KSTEP, id = "k" + ch, dn = isDown(id) ? 2 : 0;
      let mat = keyState[ch] || "wood";
      if (ch === ">") mat = ready ? "gold" : "off";
      if (ch === "<") mat = "wood";
      R(L, x + 1, y + KF + KD + 1, w, 1, "rgba(10,2,2,.6)");
      L.drawImage(keyImg(mat, w), x - 1, y - 1 + dn);
      if (ch === ">" && ready){ L.globalAlpha = .35 + .35 * Math.sin(t * 6); R(L, x - 2, y - 3, w + 4, 1, "#fff6c2"); R(L, x - 2, y + KF + KD + 2, w + 4, 1, "#fff6c2"); R(L, x - 3, y - 2, 1, KF + KD + 4, "#fff6c2"); R(L, x + w + 2, y - 2, 1, KF + KD + 4, "#fff6c2"); L.globalAlpha = 1; }
      const cx = x + w / 2, cy = y + KF / 2 + dn, m = mat;
      if (ch === ">") late.push(() => ui("VALIDER", cx, cy, 8, INK[m], {align: "center", shadow: false}));
      else if (ch === "<") late.push(() => backIcon(cx, cy, INK.wood));
      else late.push(() => ui(ch, cx, cy, 12.5, INK[m], {align: "center", shadow: false}));
      hit(id, x, y, w, KF + KD, () => taper(ch), 1);
      x += w + 2;
    });
  });

  // ---------- message en haut de la grille
  const tt = t - S.toastT, life = S.toastLong ? 1e9 : 1.6;
  if (S.toast && tt < life && !S.panel && !(S.toastLong && !S.over)){
    const big = S.toastLong, w = Math.min(200, Math.ceil(textW(S.toast, big ? 11 : 9)) + 22), h = big ? 24 : 18, y = GY - 4 + (tt < .12 ? Math.round((1 - tt / .12) * -6) : 0);
    plate(L, Math.round(108 - w / 2), y, w, h);
    late.push(() => ui(S.toast, 108, y + h / 2 + .5, big ? 11 : 9, big ? "#ffd23f" : "#fff6dc", {align: "center"}));
  }

  // ---------- on agrandit, puis les textes nets
  g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, cv.width, cv.height);
  late.forEach(f => f());
  if (S.panel) drawPanel(t, hit, isDown);
}

// ---------- fenêtres : aide, statistiques
function drawPanel(t, hit, isDown){
  hits.length = 0;
  const a = Math.min(1, (t - S.panelT) / .15);
  g.fillStyle = "rgba(10,4,8," + (.6 * a) + ")"; g.fillRect(0, 0, cv.width, cv.height);
  tg.clearRect(0, 0, LW, VH);
  const lateP = [], px = 12, pw = 192, dy = Math.round((1 - a) * 12), Y = y => y + dy;
  const entr = S.mode === "entrainement" && S.over;
  const ph = S.panel === "aide" ? 304 : entr ? 112 : S.over ? 298 : 286;
  const py = Math.max(50, Math.round((VH - ph) / 2) - 10);
  plate(tg, px, Y(py), pw, ph);
  iconButton(tg, px + pw - 22, Y(py + 6), 16, "fermer", isDown("fermer")); hit("fermer", px + pw - 22, py + 6, 16, 16, fermer, 5);
  function bouton(id, x, y, w, label, mat, fn){
    const dn = isDown(id) ? 2 : 0;
    block(tg, x, Y(y) + dn, w, 23, 3, M[mat]);
    lateP.push(() => ui(label, x + w / 2, Y(y) + dn + 11.5, 9, INK[mat], {align: "center", shadow: false}));
    hit(id, x, y, w, 26, fn, 2);
  }
  const texte = (s, y, col, light = true) => { const ls = wrap(s, 9, pw - 24, light); ls.forEach((l, i) => { const yy = Y(y + i * 13); lateP.push(() => ui(l, px + 12, yy, 9, col, {light})); }); return y + ls.length * 13; };

  if (S.panel === "aide"){
    logo(tg, "COMMENT JOUER", 108, Y(py + 10), 8);
    let y = texte("Trouvez le mot de 6 lettres en 6 essais. Après chaque essai, les tuiles se retournent :", py + 34, "#f4ead8") + 4;
    for (const [mat, ch, s] of [["gold", "B", "La lettre est à la bonne place."], ["silver", "O", "Elle est dans le mot, mais ailleurs."], ["grey", "X", "Elle n'est pas dans le mot."]]){
      tg.drawImage(tileImg(mat, ch), px + 11, Y(y) - 1);
      const ls = wrap(s, 9, pw - 60, true), yy = y;
      ls.forEach((l, i) => { const y2 = Y(yy + 13 + (i - (ls.length - 1) / 2) * 12); lateP.push(() => ui(l, px + 44, y2, 9, "#f4ead8", {light: true})); });
      y += 32;
    }
    y = texte("Un nouveau mot chaque jour à minuit, le même pour toute la famille. Les accents ne comptent pas : ÉTÉ s'écrit ETE.", y + 2, "#d8c8b0");
    bouton("son", px + 12, py + ph - 36, 80, "SON : " + (Son.actif() ? "OUI" : "NON"), "wood", () => { opts.son = !opts.son; Son.regler(opts.son); ecrire("opts", opts); if (opts.son){ Son.ouvrir(); Son.jouer("silver"); } });
    bouton("jouer", px + 100, py + ph - 36, 80, "JOUER", "gold", fermer);
  } else if (entr){
    logo(tg, S.over === "win" ? "BRAVO !" : "DOMMAGE", 108, Y(py + 10), 12);
    const s = S.over === "win" ? "Trouvé en " + S.rows.length + " essai" + (S.rows.length > 1 ? "s" : "") : "Le mot était " + S.secret, ys = Y(py + 38);
    lateP.push(() => ui(s, 108, ys, 9.5, "#fff6dc", {align: "center"}));
    bouton("autre", px + 12, py + ph - 40, 82, "AUTRE MOT", "gold", entrainement);
    bouton("dujour", px + 98, py + ph - 40, 82, "MOT DU JOUR", "wood", () => { chargerJour(); S.panel = null; });
  } else {
    const fini = S.mode === "jour" && S.over;
    logo(tg, fini ? (S.over === "win" ? "BRAVO !" : "DOMMAGE") : "STATISTIQUES", 108, Y(py + 10), fini ? 12 : 8);
    let y = py + 34;
    if (fini){ const s = S.over === "win" ? "Trouvé en " + S.rows.length + " essai" + (S.rows.length > 1 ? "s" : "") : "Le mot était " + S.secret, ys = Y(y); lateP.push(() => ui(s, 108, ys, 9.5, "#fff6dc", {align: "center"})); y += 18; }
    const serie = serieActuelle();
    const nums = [[stats.parties, "parties"], [(stats.parties ? Math.round(stats.gagnees / stats.parties * 100) : 0) + " %", "gagnées"], [serie, "série"], [stats.record, "record"]];
    nums.forEach(([v, l], i) => { const cx = px + 24 + i * 48, y1 = Y(y + 8), y2 = Y(y + 22);
      lateP.push(() => ui(String(v), cx, y1, 15, "#ffd23f", {align: "center"}));
      lateP.push(() => ui(l, cx, y2, 7.5, "#d8c8b0", {align: "center", light: true})); });
    if (serie > 0) flame(tg, px + 24 + 2 * 48 + 11, Y(y + 2), t);
    y += 36;
    { const yy = Y(y); lateP.push(() => ui("Répartition des essais", px + 12, yy, 8.5, "#f4ead8")); }
    y += 10;
    const mx = Math.max(...stats.dist, 1);
    stats.dist.forEach((n, i) => {
      const yy = y + i * 15, bw = Math.max(14, Math.round(n / mx * 140)), cur = fini && S.over === "win" && S.rows.length === i + 1, P = cur ? M.gold : M.wood;
      const y1 = Y(yy + 6), y2 = Y(yy + 6.5);
      lateP.push(() => ui(String(i + 1), px + 16, y1, 8.5, "#d8c8b0", {align: "center"}));
      R(tg, px + 25, Y(yy), bw + 2, 13, OUT); R(tg, px + 26, Y(yy + 1), bw, 11, P[1]); R(tg, px + 26, Y(yy + 1), bw, 1, P[0]); R(tg, px + 26, Y(yy + 10), bw, 2, P[2]);
      lateP.push(() => ui(String(n), px + 26 + bw - 4, y2, 8, cur ? INK.gold : INK.wood, {align: "right", shadow: false}));
    });
    y += 96;
    const mid = new Date(); mid.setHours(24, 0, 0, 0);
    const left = Math.max(0, Math.floor((mid - Date.now()) / 1000)), y1 = Y(y), y2 = Y(y + 14);
    lateP.push(() => ui("Prochain mot dans", 108, y1, 8.5, "#d8c8b0", {align: "center", light: true}));
    lateP.push(() => ui(z2(Math.floor(left / 3600)) + ":" + z2(Math.floor(left / 60) % 60) + ":" + z2(left % 60), 108, y2, 13, "#ffd23f", {align: "center"}));
    if (fini){
      bouton("partager", px + 12, py + ph - 66, 82, "PARTAGER", "gold", partager);
      if (!window.ludoArtefact) bouton("classement", px + 98, py + ph - 66, 82, "CLASSEMENT", "wood", () => { location.href = "../index.html#motdor"; });
      bouton("autre", px + 12, py + ph - 36, 168, "S'ENTRAÎNER : AUTRE MOT", "wood", entrainement);
    } else bouton("sFermer", px + 46, py + ph - 36, pw - 92, "FERMER", "wood", fermer);
  }
  g.drawImage(top, 0, 0, cv.width, cv.height);
  lateP.forEach(f => f());
  // message par-dessus la fenêtre (copie du résultat)
  if (S.toast && !S.toastLong && t - S.toastT < 2.4){
    const w = Math.min(200, textW(S.toast, 9) + 22), y = py + ph + 6;
    tg.clearRect(0, 0, LW, VH); plate(tg, Math.round(108 - w / 2), y, Math.round(w), 18); g.drawImage(top, 0, 0, cv.width, cv.height);
    ui(S.toast, 108, y + 9.5, 9, "#fff6dc", {align: "center"});
  }
}

/* =====================================================================
   Démarrage, boucle, accès pour les tests
   ===================================================================== */
chargerJour();
if (S.over && opts.aide) ouvrir("stats");
window.MotDor = {
  etat: () => S, stats: () => stats, evaluate, motDuJour, auj, solutions: SOL, accepte: w => ACC.has(w),
  saisir(mot){ for (const ch of mot.toUpperCase()) taper(ch); }, valider: () => taper(">"), effacer: () => taper("<"),
  finirRetournement(){ if (S.reveal) S.reveal.t0 = -99; }, entrainement, chargerJour, fermer, ouvrir,
};
const reduit = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function frame(){ const t = performance.now() / 1000; draw(reduit ? Math.floor(t * 4) / 4 : t); requestAnimationFrame(frame); }
Promise.all(['8px "Press Start 2P"', '600 12px "Fredoka"', '500 12px "Fredoka"'].map(f => document.fonts ? document.fonts.load(f).catch(() => {}) : 0))
  .then(() => requestAnimationFrame(frame));
})();

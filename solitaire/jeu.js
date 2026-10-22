(() => {
"use strict";
const cv = document.getElementById("table"), ctx = cv.getContext("2d");
const $ = id => document.getElementById(id);
const W = 360, H = 540, CW = 47, CH = 65, TOPY = 6, TABY = TOPY + CH + 12, FAN = 16, DD = 6;
const X = i => 3 + i * (CW + 4);
const store = {
  get(k, d){ try{ const v = localStorage.getItem("solitaire16." + k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("solitaire16." + k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem("solitaire16." + k); }catch(e){} }
};

/* ---------- son ---------- */
let actx = null, soundOn = store.get("sound", true);
function blip(notes, type = "square", dur = .05, vol = .04){
  if (!soundOn) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); let t = actx.currentTime;
    for (const f of notes){ const o = actx.createOscillator(), g = actx.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur); t += dur * .9; }
  } catch (e) {}
}
const SFX = {
  place: () => blip([520], "triangle", .04, .07), draw: () => blip([300, 360], "triangle", .03, .05),
  found: () => blip([660, 990], "square", .05, .035), flip: () => blip([440], "triangle", .03, .05),
  bad: () => blip([150, 120], "square", .07, .04), recycle: () => blip([400, 300, 200], "triangle", .05, .05),
  win: () => blip([523, 659, 784, 1047, 784, 1047, 1319], "square", .1, .05),
};

/* ---------- dessin : table de 360 × 540 points, tracée à la résolution de l'écran ---------- */
/* Les cartes se personnalisent dans le MENU : quatre styles de faces (NET par défaut, CHIFFRE GEANT,
   QUATRE COULEURS, et l'ancien PIXEL), six dos en pixel art et quatre tapis. */
const RANKS = [null, "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const isRed = c => c.s === 1 || c.s === 3;             // 0 pique, 1 cœur, 2 trèfle, 3 carreau
const DPR = Math.min(3, Math.max(1, Math.round((window.devicePixelRatio || 1) * 2) / 2));
cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
function rr(g, x, y, w, h, r){
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function sprite(draw){   // une carte à la résolution de l'écran, dessinée en points de la table
  const c = document.createElement("canvas"); c.width = Math.round(CW * DPR); c.height = Math.round(CH * DPR);
  const g = c.getContext("2d"); g.scale(c.width / CW, c.height / CH); draw(g); return c;
}

/* enseignes en vecteurs (pas de caractères ♠♥ : Android les dessine en émojis) */
function enseigne(g, s, cx, cy, r){
  g.beginPath();
  const rond = (x, y, k) => { g.moveTo(x + k, y); g.arc(x, y, k, 0, Math.PI * 2); };
  if (s === 3){ g.moveTo(cx, cy - r); g.lineTo(cx + r * .78, cy); g.lineTo(cx, cy + r); g.lineTo(cx - r * .78, cy); g.closePath(); }
  else if (s === 1){ rond(cx - r * .5, cy - r * .3, r * .52); rond(cx + r * .5, cy - r * .3, r * .52);
    g.moveTo(cx - r, cy - r * .18); g.lineTo(cx + r, cy - r * .18); g.lineTo(cx, cy + r); g.closePath(); }
  else if (s === 0){ rond(cx - r * .5, cy + r * .2, r * .5); rond(cx + r * .5, cy + r * .2, r * .5);
    g.moveTo(cx - r * .98, cy + r * .1); g.lineTo(cx + r * .98, cy + r * .1); g.lineTo(cx, cy - r); g.closePath();
    g.moveTo(cx, cy + r * .2); g.lineTo(cx + r * .38, cy + r); g.lineTo(cx - r * .38, cy + r); g.closePath(); }
  else { rond(cx, cy - r * .48, r * .42); rond(cx - r * .5, cy + r * .12, r * .42); rond(cx + r * .5, cy + r * .12, r * .42);
    g.moveTo(cx, cy); g.lineTo(cx + r * .38, cy + r); g.lineTo(cx - r * .38, cy + r); g.closePath(); }
  g.fill();
}

const RN = ["#14141c", "#d3162c", "#14141c", "#d3162c"];
const SKINS = {   // du = ce qui dépasse de chaque carte visible dans une colonne
  net:    {nom: "NET", du: 28, taille: 24, cols: RN},
  geant:  {nom: "CHIFFRE GEANT", du: 33, taille: 32, cols: RN},
  quatre: {nom: "QUATRE COULEURS", du: 28, taille: 24, cols: ["#14141c", "#d3162c", "#0f7d36", "#1857cc"]},
  pixel:  {nom: "PIXEL", du: 16, pixel: true},
};
let skin = SKINS[store.get("skin", "net")] ? store.get("skin", "net") : "net";
const SK = () => SKINS[skin];
function vectorFace(g, S, c){
  const col = S.cols[c.s], big = S.taille > 28;
  rr(g, .5, .5, CW - 1, CH - 1, 4); g.fillStyle = "#ffffff"; g.fill(); g.strokeStyle = "#6f7686"; g.lineWidth = 1; g.stroke();
  g.fillStyle = col; g.textBaseline = "alphabetic"; g.font = `700 ${S.taille}px Rajdhani, "Arial Narrow", sans-serif`;
  const t = RANKS[c.r], ty = S.taille * .78 + (big ? 0 : 1);
  if (t === "10"){ g.save(); g.translate(2, 0); g.scale(.82, 1); g.fillText(t, 0, ty); g.restore(); } else g.fillText(t, 3, ty);
  const er = big ? 6 : 7.5;
  enseigne(g, c.s, CW - er - 3.5, big ? er + 4 : S.taille * .45 + 1, er);
  const top = S.du - 2, bas = CH - 4, cy = (top + bas) / 2;
  if (c.r > 10){
    g.strokeStyle = col; g.lineWidth = 1.5; rr(g, 6, top + 2, CW - 12, bas - top - 3, 3); g.stroke();
    g.font = `700 20px Rajdhani, "Arial Narrow", sans-serif`; g.textAlign = "center"; g.fillText(t, CW / 2, cy + 8); g.textAlign = "left";
    const cx = CW / 2, k = cy - 10;   // petite couronne
    g.beginPath(); g.moveTo(cx - 7, k + 3); g.lineTo(cx - 7, k - 3); g.lineTo(cx - 3.5, k); g.lineTo(cx, k - 5);
    g.lineTo(cx + 3.5, k); g.lineTo(cx + 7, k - 3); g.lineTo(cx + 7, k + 3); g.closePath(); g.fillStyle = "#e0a020"; g.fill();
  } else enseigne(g, c.s, CW / 2, cy, Math.min(13, (bas - top) / 2 - 2));
}

/* le style PIXEL : les cartes 32 × 44 d'origine, agrandies sans lissage */
const PW = 32, PH = 44;
const RED = "#d22b3c", BLACK = "#20202c", OUT = "#16161e", PAPER = "#fbfaf2";
const SUIT5 = [
  ["..x..", ".xxx.", "xxxxx", "xxxxx", ".xxx."],          // pique
  [".x.x.", "xxxxx", "xxxxx", ".xxx.", "..x.."],          // cœur
  [".xxx.", ".xxx.", "xxxxx", "xx.xx", ".xxx."],          // trèfle
  ["..x..", ".xxx.", "xxxxx", ".xxx.", "..x.."],          // carreau
];
const SUIT9 = [
  ["....x....", "...xxx...", "..xxxxx..", ".xxxxxxx.", "xxxxxxxxx", "xxxxxxxxx", ".xx.x.xx.", "....x....", "..xxxxx.."],
  [".xx...xx.", "xxxx.xxxx", "xxxxxxxxx", "xxxxxxxxx", ".xxxxxxx.", "..xxxxx..", "...xxx...", "....x....", "........."],
  ["...xxx...", "..xxxxx..", "...xxx...", ".xx.x.xx.", "xxxxxxxxx", "xxxxxxxxx", ".xx.x.xx.", "....x....", "..xxxxx.."],
  ["....x....", "...xxx...", "..xxxxx..", ".xxxxxxx.", "xxxxxxxxx", ".xxxxxxx.", "..xxxxx..", "...xxx...", "....x...."],
];
const GLYPH = {
  A: [".x.", "x.x", "xxx", "x.x", "x.x"], 2: ["xx.", "..x", ".x.", "x..", "xxx"], 3: ["xx.", "..x", ".x.", "..x", "xx."],
  4: ["x.x", "x.x", "xxx", "..x", "..x"], 5: ["xxx", "x..", "xx.", "..x", "xx."], 6: [".xx", "x..", "xx.", "x.x", ".x."],
  7: ["xxx", "..x", ".x.", ".x.", ".x."], 8: [".x.", "x.x", ".x.", "x.x", ".x."], 9: [".x.", "x.x", ".xx", "..x", "xx."],
  1: [".x.", "xx.", ".x.", ".x.", "xxx"], 0: [".x.", "x.x", "x.x", "x.x", ".x."],
  J: ["..x", "..x", "..x", "x.x", ".x."], Q: [".x.", "x.x", "x.x", "xx.", ".xx"], K: ["x.x", "x.x", "xx.", "x.x", "x.x"],
};
const BIG = { // lettres 5×7 des figures
  J: ["..xxx", "...x.", "...x.", "...x.", "x..x.", "x..x.", ".xx.."],
  Q: [".xxx.", "x...x", "x...x", "x...x", "x.x.x", "x..x.", ".xx.x"],
  K: ["x...x", "x..x.", "x.x..", "xx...", "x.x..", "x..x.", "x...x"],
};
const CROWN = { // coiffes des figures, 9×5 ; c = couleur de la carte
  K: ["y...y...y", "yy.yyy.yy", "yyyyyyyyy", "ycyycyycy", "yyyyyyyyy"],
  Q: ["....y....", "...ycy...", ".yyyyyyy.", "yywyywyyy", ".yyyyyyy."],
  J: [".......cw", "......cw.", "..ccccc..", ".ccccccc.", "yyyyyyyyy"],
};
function px(g, map, x, y, col, scale = 1, flip = false){
  const h = map.length;
  map.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === ".") return;
    g.fillStyle = typeof col === "string" ? col : col[ch] || "#000";
    g.fillRect(x + c * scale, y + (flip ? h - 1 - r : r) * scale, scale, scale);
  }));
}
function rankText(g, r, x, y, col){
  const s = RANKS[r];
  if (s === "10"){ px(g, GLYPH[1], x - 1, y, col); px(g, GLYPH[0], x + 3, y, col); }
  else px(g, GLYPH[s], x, y, col);
}
const L = 9, M = 13, R = 18;
const PIPS = {
  2: [[M, 9], [M, 30]], 3: [[M, 9], [M, 19], [M, 30]],
  4: [[L, 9], [R, 9], [L, 30], [R, 30]], 5: [[L, 9], [R, 9], [M, 19], [L, 30], [R, 30]],
  6: [[L, 9], [R, 9], [L, 19], [R, 19], [L, 30], [R, 30]],
  7: [[L, 9], [R, 9], [M, 14], [L, 19], [R, 19], [L, 30], [R, 30]],
  8: [[L, 9], [R, 9], [M, 14], [L, 19], [R, 19], [M, 25], [L, 30], [R, 30]],
  9: [[L, 9], [R, 9], [L, 16], [R, 16], [M, 19], [L, 23], [R, 23], [L, 30], [R, 30]],
  10: [[L, 9], [R, 9], [M, 12], [L, 16], [R, 16], [L, 23], [R, 23], [M, 27], [L, 30], [R, 30]],
};
function pixelFace(card){
  const c = document.createElement("canvas"); c.width = PW; c.height = PH; const g = c.getContext("2d"), col = isRed(card) ? RED : BLACK;
  g.fillStyle = OUT; g.fillRect(1, 0, PW - 2, PH); g.fillRect(0, 1, PW, PH - 2);
  g.fillStyle = PAPER; g.fillRect(1, 1, PW - 2, PH - 2);
  rankText(g, card.r, 3, 3, col); px(g, SUIT5[card.s], 2, 10, col);
  rankText(g, card.r, PW - 6, PH - 8, col); px(g, SUIT5[card.s], PW - 7, PH - 16, col, 1, true);
  if (card.r === 1) px(g, SUIT9[card.s], 7, 13, col, 2);
  else if (card.r <= 10) for (const [x, y] of PIPS[card.r]) px(g, SUIT5[card.s], x, y, col, 1, y > 20);
  else {
    const k = RANKS[card.r];
    g.fillStyle = col; g.fillRect(7, 6, 18, 32);
    g.fillStyle = "#f6e7b0"; g.fillRect(8, 7, 16, 30);
    px(g, CROWN[k], 11, 9, {y: "#e0a020", c: col, w: "#ffffff"});
    px(g, BIG[k], 11, 16, col, 2);
    px(g, SUIT5[card.s], 14, 31, col);
  }
  return sprite(h => { h.imageSmoothingEnabled = false; h.drawImage(c, 0, 0, CW, CH); });
}

/* les dos : pixel art 48 × 66 (ce n'est pas eux qu'on lit) */
let graine = 7; const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
const ETOILES = Array.from({length: 26}, () => [Math.floor(hasard() * 42), Math.floor(hasard() * 60), hasard() < .25]);
const DOS = [
  {nom: "LOSANGES", f: (x, y) => { const X = x >> 1, Y = y >> 1, l = (X + Y) % 6 === 0 || (X - Y + 60) % 6 === 0; return l ? "#6fa0ff" : ((X + Y) % 2 ? "#1f3fa8" : "#2449b8"); }},
  {nom: "TARTAN", f: (x, y) => { const a = x % 12 < 3, b = y % 12 < 3; if (x % 12 === 7 || y % 12 === 7) return "#e8c060";
    return a && b ? "#3c0610" : a || b ? "#6a0e1c" : (x + y) % 2 ? "#a01828" : "#ac1e2e"; }},
  {nom: "VAGUES", f: (x, y) => { let col = "#1b2f6b";
    for (let row = 0; row <= 12; row++) for (let i = -1; i <= 4; i++){ const cx = i * 12 + (row % 2) * 6, cy = row * 5, d = Math.hypot(x - cx, y - cy);
      if (d < 6.5 && y <= cy) col = d < 1.5 ? "#1b2f6b" : Math.floor(d) % 2 ? "#f4f4ff" : "#2f5fb0"; }
    return col; }},
  {nom: "ART DECO", f: (x, y, w, h) => { const cx = w / 2 - .5, cy = h / 2 - .5, dx = Math.abs(x - cx), dy = Math.abs(y - cy);
    if (x === 2 || y === 2 || x === w - 3 || y === h - 3) return "#d8a838";
    if (dx + dy < 7) return dx + dy < 4 ? "#141018" : "#d8a838";
    const a = Math.atan2(y - cy, x - cx); if (Math.floor((a + Math.PI) * 16 / Math.PI) % 2 && dx + dy < 26) return "#6a4c14";
    return "#141018"; }},
  {nom: "COUCHANT", f: (x, y, w) => { const sol = 38;
    if (y >= sol){ const t = y - sol, gx = (x - w / 2) * (6 / (t + 6)); return t % Math.max(2, Math.floor(t / 3) + 2) === 0 || Math.round(gx) % 5 === 0 ? "#ff4fa8" : "#2a0f3e"; }
    const d = Math.hypot(x - w / 2 + .5, y - 28); if (d < 13 && !(y > 22 && (y % 4) < 1 + (y - 22) / 6)) return y < 20 ? "#ffd23f" : "#ff8a3c";
    return y < 12 ? "#3b1a6b" : y < 22 ? "#6a2386" : y < 32 ? "#a4307f" : "#d8486e"; }},
  {nom: "ETOILES", f: (x, y) => {
    for (const [sx, sy, gros] of ETOILES){ if (x === sx && y === sy) return gros ? "#ffe680" : "#ffffff"; if (gros && Math.abs(x - sx) + Math.abs(y - sy) === 1) return "#8a90d8"; }
    const d = Math.hypot(x - 30, y - 12), d2 = Math.hypot(x - 33, y - 10); if (d < 7 && d2 >= 6) return "#f6e7b0";
    return y < 20 ? "#0e1440" : y < 40 ? "#121a52" : "#182266"; }},
];
let back = Math.min(DOS.length - 1, Math.max(0, store.get("back", 0) | 0));
function backFor(i){
  const k = "dos" + i; let im = cache.get(k); if (im) return im;
  const c = document.createElement("canvas"); c.width = 48; c.height = 66; const g = c.getContext("2d");
  g.fillStyle = "#f4f4ff"; g.fillRect(0, 0, 48, 66);
  for (let y = 3; y < 63; y++) for (let x = 3; x < 45; x++){ g.fillStyle = DOS[i].f(x - 3, y - 3, 42, 60); g.fillRect(x, y, 1, 1); }
  im = sprite(h => { rr(h, 0, 0, CW, CH, 4); h.save(); h.clip(); h.imageSmoothingEnabled = false; h.drawImage(c, 0, 0, CW, CH); h.restore();
    rr(h, .5, .5, CW - 1, CH - 1, 4); h.strokeStyle = "rgba(0,0,0,.65)"; h.lineWidth = 1; h.stroke(); });
  cache.set(k, im); return im;
}
const cache = new Map();
function faceFor(sk, c){
  const k = sk + c.id; let im = cache.get(k);
  if (!im){ im = SKINS[sk].pixel ? pixelFace(c) : sprite(g => vectorFace(g, SKINS[sk], c)); cache.set(k, im); }
  return im;
}
const faceImg = c => faceFor(skin, c), backImg = () => backFor(back);
// la police des cartes arrive parfois après le premier dessin : on refait alors les faces
if (document.fonts && document.fonts.load) document.fonts.load('700 24px Rajdhani').then(() => { for (const k of [...cache.keys()]) if (!k.startsWith("dos")) cache.delete(k); buildMenu(); }, () => {});

/* le tapis */
const TAPIS = [{nom: "VERT", c: ["#1f7a3c", "#17602e"]}, {nom: "BLEU NUIT", c: ["#1d4a7c", "#13355e"]},
  {nom: "BORDEAUX", c: ["#6e1f2e", "#521622"]}, {nom: "ANTHRACITE", c: ["#3a3e48", "#22252c"]}];
let felt = Math.min(TAPIS.length - 1, Math.max(0, store.get("felt", 0) | 0)), FELT = null;
function makeFelt(){
  const c = document.createElement("canvas"); c.width = W * DPR; c.height = H * DPR; const g = c.getContext("2d"); g.scale(DPR, DPR);
  const [a, b] = TAPIS[felt].c, gr = g.createRadialGradient(W / 2, H * .4, 40, W / 2, H * .4, W);
  gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  FELT = c;
}
makeFelt();
const drawFelt = () => ctx.drawImage(FELT, 0, 0, W, H);
function slot(x, y, label){
  rr(ctx, x + 1, y + 1, CW - 2, CH - 2, 4); ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
  if (!label) return;
  const cx = x + CW / 2, cy = y + CH / 2;
  ctx.fillStyle = ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 3;
  if (label === "recycle"){
    ctx.beginPath(); ctx.arc(cx, cy, 10, -Math.PI * .35, Math.PI * 1.4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 4, cy - 15); ctx.lineTo(cx + 12, cy - 9); ctx.lineTo(cx + 3, cy - 4); ctx.closePath(); ctx.fill();
  } else if (label === "nope"){
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 8); ctx.lineTo(cx + 8, cy + 8); ctx.moveTo(cx + 8, cy - 8); ctx.lineTo(cx - 8, cy + 8); ctx.stroke();
  } else {
    ctx.font = `700 26px Rajdhani, "Arial Narrow", sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, cx, cy + 1); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  }
}

/* ---------- état de la partie ---------- */
let st = null, undoStack = [], drawMode = store.get("draw", 3), best = store.get("best", 0);
function deal(){
  clearTimeout(bounceTimer); bounce = null; celebrating = false;   // une nouvelle donne pendant la fête de victoire
  const deck = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({s, r, up: false, id: s * 13 + r - 1});
  for (let i = deck.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  const tab = [[], [], [], [], [], [], []];
  for (let i = 0; i < 7; i++) for (let j = i; j < 7; j++) tab[j].push(deck.pop());
  tab.forEach(p => p[p.length - 1].up = true);
  st = {stock: deck, waste: [], found: [[], [], [], []], tab, draw: drawMode, fan: 0, score: 0, elapsed: 0, penal: 0, started: false, won: false, passes: 0};
  undoStack = []; anims = []; drag = null; celebrating = false;
  $("overlay").hidden = true; save(); hud(); setMsg("");
}
const pileOf = k => k === "S" ? st.stock : k === "W" ? st.waste : k[0] === "F" ? st.found[+k[1]] : st.tab[+k[1]];
const canFound = (c, f) => f.length ? (f[f.length - 1].s === c.s && c.r === f[f.length - 1].r + 1) : c.r === 1;
const canTab = (c, p) => p.length ? (p[p.length - 1].up && isRed(p[p.length - 1]) !== isRed(c) && c.r === p[p.length - 1].r - 1) : c.r === 13;

function snapshot(){ undoStack.push(JSON.stringify(st)); if (undoStack.length > 300) undoStack.shift(); }
function save(){ if (st.won) store.del("game"); else store.set("game", st); }
function addScore(n){ st.score = Math.max(0, st.score + n); }
function begin(){ if (!st.started){ st.started = true; const s = store.get("stats", {played: 0, won: 0}); s.played++; store.set("stats", s); } }

/* ---------- positions ---------- */
function tabOffsets(p){
  const down = p.filter(c => !c.up).length, up = p.length - down;
  const max = SK().du; let du = max;
  if (up > 1){ const room = H - 4 - CH - TABY - down * DD; du = Math.max(8, Math.min(max, Math.floor(room / (up - 1)))); }
  return {dd: DD, du};
}
function posOf(k, i){
  if (k === "S") return {x: X(0), y: TOPY};
  if (k === "W"){
    const n = st.waste.length, fan = st.draw === 3 ? Math.max(1, Math.min(st.fan, n)) : 1, first = n - fan;
    return {x: X(1) + Math.max(0, i - first) * FAN, y: TOPY};
  }
  if (k[0] === "F") return {x: X(3 + +k[1]), y: TOPY};
  const p = st.tab[+k[1]], {dd, du} = tabOffsets(p);
  let y = TABY; for (let j = 0; j < i; j++) y += p[j].up ? du : dd;
  return {x: X(+k[1]), y};
}

/* ---------- déplacements ---------- */
let anims = [];
function animate(cards, from, to, dur = 130){
  const t0 = performance.now();
  cards.forEach((c, n) => anims.push({c, fx: from[n].x, fy: from[n].y, tx: to[n].x, ty: to[n].y, t0, dur}));
}
function move(fromK, idx, toK, opts = {}){
  const from = pileOf(fromK), to = pileOf(toK), card = from[idx];
  if (!card || !card.up || fromK === toK) return false;
  if (toK[0] === "F"){ if (idx !== from.length - 1 || !canFound(card, to)) return false; }
  else if (toK[0] === "T"){ if (!canTab(card, to)) return false; if (fromK !== "W" && fromK[0] !== "T" && idx !== from.length - 1) return false; }
  else return false;
  if (fromK === "W" && idx !== from.length - 1) return false;
  snapshot(); begin();
  const before = from.slice(idx).map((c, n) => opts.fromPos ? {x: opts.fromPos.x, y: opts.fromPos.y + n * SK().du} : posOf(fromK, idx + n));
  const moved = from.splice(idx);
  const base = to.length; to.push(...moved);
  if (fromK === "W" && st.draw === 3) st.fan = Math.max(1, st.fan - 1);
  // barème « standard » de Windows
  if (toK[0] === "F") addScore(10);
  else if (fromK === "W") addScore(5);
  else if (fromK[0] === "F") addScore(-15);
  if (fromK[0] === "T" && from.length && !from[from.length - 1].up){ from[from.length - 1].up = true; addScore(5); setTimeout(SFX.flip, 90); }
  if (opts.anim !== false) animate(moved, before, moved.map((c, n) => posOf(toK, base + n)));
  (toK[0] === "F" ? SFX.found : SFX.place)();
  afterAction();
  return true;
}
function drawStock(){
  if (st.stock.length){
    snapshot(); begin();
    const n = Math.min(st.draw, st.stock.length), moved = [];
    for (let i = 0; i < n; i++){ const c = st.stock.pop(); c.up = true; st.waste.push(c); moved.push(c); }
    st.fan = n;
    animate(moved, moved.map(() => posOf("S", 0)), moved.map((c, i) => posOf("W", st.waste.length - n + i)), 110);
    SFX.draw(); afterAction();
  } else if (st.waste.length){
    snapshot();
    st.stock = st.waste.reverse().map(c => (c.up = false, c)); st.waste = []; st.fan = 0; st.passes++;
    addScore(st.draw === 1 ? -100 : -20);
    SFX.recycle(); afterAction();
  }
}
// toucher une carte : la fondation d'abord, sinon la meilleure colonne
function smart(k, idx){
  const p = pileOf(k), c = p[idx];
  if (!c || !c.up) return false;
  if (idx === p.length - 1 && k[0] !== "F") for (let f = 0; f < 4; f++) if (canFound(c, st.found[f]) && move(k, idx, "F" + f)) return true;
  const order = [0, 1, 2, 3, 4, 5, 6].filter(j => "T" + j !== k);
  const full = order.filter(j => st.tab[j].length), empty = order.filter(j => !st.tab[j].length);
  const kingAtBase = k[0] === "T" && idx === 0;
  for (const j of kingAtBase ? full : full.concat(empty)) if (canTab(c, st.tab[j]) && move(k, idx, "T" + j)) return true;
  return false;
}
const canAutoFinish = () => !st.won && !st.stock.length && !st.waste.length && st.tab.every(p => p.every(c => c.up)) && st.tab.some(p => p.length);
let autoRunning = false;
function autoFinish(){
  if (autoRunning) return; autoRunning = true;
  const step = () => {
    if (st.won || !canAutoFinish()){ autoRunning = false; return; }
    let best = null;
    st.tab.forEach((p, j) => { if (!p.length) return; const c = p[p.length - 1];
      for (let f = 0; f < 4; f++) if (canFound(c, st.found[f]) && (!best || c.r < best.c.r)) best = {j, f, c}; });
    if (!best){ autoRunning = false; return; }
    move("T" + best.j, st.tab[best.j].length - 1, "F" + best.f);
    setTimeout(step, 90);
  };
  step();
}
function afterAction(){
  if (st.found.every(f => f.length === 13)) return win();
  save(); hud();
  $("autoBtn").hidden = !canAutoFinish();
}
function undo(){
  if (!undoStack.length || st.won || celebrating) return;
  // annuler un coup ne rembobine ni le chrono ni les pénalités
  const {elapsed, penal, started} = st;
  const prev = JSON.parse(undoStack.pop());
  prev.score = Math.max(0, prev.score - 2 * (penal - (prev.penal || 0)));   // les pénalités de temps déjà payées restent payées
  st = Object.assign(prev, {elapsed, penal, started}); anims = []; save(); hud(); SFX.flip();
  $("autoBtn").hidden = !canAutoFinish();
}

/* ---------- victoire : les cartes rebondissent comme sous Windows ---------- */
let celebrating = false, bounce = null, bounceTimer = null;
function win(){
  st.won = true;
  const secs = Math.max(1, Math.round(st.elapsed / 1000));
  const bonus = secs >= 30 ? Math.floor(700000 / secs) : 0;
  addScore(bonus);
  const stats = store.get("stats", {played: 1, won: 0}); stats.won++; store.set("stats", stats);
  const record = st.score > best; if (record){ best = st.score; store.set("best", best); }
  store.del("game"); hud(); $("autoBtn").hidden = true;
  SFX.win();
  $("winStats").innerHTML = `SCORE ${st.score}<br>TEMPS ${fmt(st.elapsed)} · BONUS ${bonus}<br>${record ? '<span class="new">NOUVEAU RECORD !</span>' : "RECORD " + best}<br>PARTIES GAGNÉES ${stats.won}/${stats.played}`;
  // classement familial : le record part tout seul
  if (record && window.LudoScores) LudoScores.submit("solitaire", "best", st.score, false).then(r => { if (r) $("winStats").innerHTML += `<br>${LudoScores.rankText(r).toUpperCase()} AU CLASSEMENT`; });
  bounceTimer = setTimeout(startBounce, 350);
}
function startBounce(){
  celebrating = true; anims = [];
  const queue = [];
  for (let r = 13; r >= 1; r--) for (let f = 0; f < 4; f++){ const c = st.found[f].find(x => x.r === r); if (c) queue.push({c, f}); }
  drawFelt(); drawTable(true);
  bounce = {queue, cur: null};
}
function stepBounce(){
  const b = bounce; if (!b) return;
  for (let k = 0; k < 2; k++){   // deux pas de physique par image : plus fluide
    if (!b.cur){
      const nx = b.queue.shift();
      if (!nx){ endBounce(); return; }
      st.found[nx.f] = st.found[nx.f].filter(c => c !== nx.c);
      b.cur = {c: nx.c, x: X(3 + nx.f), y: TOPY, vx: (Math.random() < .5 ? -1 : 1) * (1.4 + Math.random() * 3), vy: -Math.random() * 4.2};
    }
    const p = b.cur;
    p.vy += 0.31; p.x += p.vx; p.y += p.vy;
    if (p.y > H - CH){ p.y = H - CH; p.vy = -p.vy * 0.78; }
    ctx.drawImage(faceImg(p.c), p.x, p.y, CW, CH);   // pas d'effacement : la traînée reste
    if (p.x < -CW || p.x > W) b.cur = null;
  }
}
function endBounce(){ bounce = null; celebrating = false; $("overlay").hidden = false; $("againBtn").focus({preventScroll: true}); }

/* ---------- interface ---------- */
const fmt = ms => { const s = Math.floor(ms / 1000); return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0"); };
function hud(){
  $("score").textContent = st.score; $("time").textContent = fmt(st.elapsed); $("best").textContent = best;
  $("drawBtn").textContent = "PIOCHE : " + st.draw;
  $("undoBtn").disabled = !undoStack.length || st.won;
}
function setMsg(h){ $("msg").innerHTML = h; $("menuMsg").innerHTML = h; }
let confirmAt = 0, confirmWhat = "";
function confirmOr(what, text, fn){
  const busy = st.started && !st.won;
  if (!busy || (confirmWhat === what && performance.now() - confirmAt < 4000)){ confirmWhat = ""; setMsg(""); fn(); return; }
  confirmWhat = what; confirmAt = performance.now(); setMsg(text); SFX.bad();
}
$("newBtn").onclick = () => confirmOr("new", "Partie en cours : appuie encore sur <b>NOUVELLE DONNE</b> pour l'abandonner.", () => { deal(); SFX.draw(); closeMenu(); });
$("againBtn").onclick = () => { deal(); SFX.draw(); };
$("drawBtn").onclick = () => {
  const next = st.draw === 3 ? 1 : 3;
  confirmOr("draw" + next, `Changer de pioche redistribue les cartes : appuie encore sur <b>PIOCHE</b>.`, () => {
    drawMode = next; store.set("draw", next); deal(); setMsg(`Nouvelle donne, pioche ${next === 1 ? "d'une carte" : "de trois cartes"}.`); SFX.draw(); closeMenu(); });
};
$("undoBtn").onclick = undo;
$("autoBtn").onclick = autoFinish;
const soundBtn = $("soundBtn");
soundBtn.textContent = "SON : " + (soundOn ? "OUI" : "NON");
soundBtn.onclick = () => { soundOn = !soundOn; store.set("sound", soundOn); soundBtn.textContent = "SON : " + (soundOn ? "OUI" : "NON"); SFX.place(); };

/* le menu : partie, son, retour, et la personnalisation (cartes, dos, tapis) */
const menu = $("menu");
function openMenu(){ menu.hidden = false; buildMenu(); $("closeMenu").focus({preventScroll: true}); SFX.flip(); }
function closeMenu(){ if (menu.hidden) return; menu.hidden = true; setMsg(""); }
$("menuBtn").onclick = openMenu;
$("closeMenu").onclick = closeMenu;
menu.addEventListener("click", e => { if (e.target === menu) closeMenu(); });
function tile(box, id, on, draw, label, pick){
  const b = document.createElement("button"); b.type = "button"; b.className = "tuile"; b.id = id; b.setAttribute("aria-pressed", String(on));
  const c = document.createElement("canvas"); draw(c); b.appendChild(c);
  if (label){ const s = document.createElement("span"); s.textContent = label; b.appendChild(s); }
  b.onclick = () => { pick(); SFX.place(); buildMenu(); }; box.appendChild(b);
}
function buildMenu(){
  if (menu.hidden) return;
  const sk = $("skins"), bk = $("backs"), fl = $("felts"); sk.textContent = bk.textContent = fl.textContent = "";
  for (const k of Object.keys(SKINS)) tile(sk, "skin-" + k, k === skin, c => {   // deux cartes en colonne, comme sur la table
    const du = SKINS[k].du; c.width = CW * DPR; c.height = (CH + du) * DPR; const g = c.getContext("2d"); g.scale(DPR, DPR);
    g.drawImage(faceFor(k, {s: 0, r: 13, id: 12}), 0, 0, CW, CH); g.drawImage(faceFor(k, {s: 1, r: 10, id: 22}), 0, du, CW, CH);
  }, SKINS[k].nom, () => { skin = k; store.set("skin", k); });
  DOS.forEach((d, i) => tile(bk, "back-" + i, i === back, c => {
    c.width = CW * DPR; c.height = CH * DPR; c.getContext("2d").drawImage(backFor(i), 0, 0);
  }, null, () => { back = i; store.set("back", i); }));
  TAPIS.forEach((t, i) => tile(fl, "felt-" + i, i === felt, c => {
    c.width = 56; c.height = 30; const g = c.getContext("2d"), gr = g.createRadialGradient(28, 15, 4, 28, 15, 40);
    gr.addColorStop(0, t.c[0]); gr.addColorStop(1, t.c[1]); g.fillStyle = gr; g.fillRect(0, 0, 56, 30);
  }, t.nom, () => { felt = i; store.set("felt", i); makeFelt(); }));
}
document.addEventListener("keydown", e => {
  if (!menu.hidden){ if (e.key === "Escape" || e.key === "m" || e.key === "M") closeMenu(); return; }
  if (e.key === "m" || e.key === "M" || e.key === "Escape"){ openMenu(); return; }
  if (e.target.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
  if (e.key === " "){ e.preventDefault(); if (!st.won) drawStock(); }
  else if ((e.key === "z" || e.key === "Z") && !e.metaKey) { e.preventDefault(); undo(); }
  else if (e.key === "n" || e.key === "N") $("newBtn").click();
});

/* ---------- souris et doigt : toucher = meilleur coup, glisser = déposer où on veut ---------- */
let drag = null;
function toLogical(e){ const r = cv.getBoundingClientRect(); return {x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height}; }
const inside = (p, x, y, h = CH) => p.x >= x && p.x < x + CW && p.y >= y && p.y < y + h;
function hit(p){
  for (let j = 0; j < 7; j++){
    const pile = st.tab[j];
    for (let i = pile.length - 1; i >= 0; i--){ const q = posOf("T" + j, i); if (inside(p, q.x, q.y)) return {k: "T" + j, i}; }
  }
  if (st.waste.length){ const i = st.waste.length - 1, q = posOf("W", i); if (inside(p, q.x, q.y)) return {k: "W", i}; }
  for (let f = 0; f < 4; f++){ const q = posOf("F" + f, 0); if (inside(p, q.x, q.y)) return {k: "F" + f, i: st.found[f].length - 1}; }
  if (inside(p, X(0), TOPY)) return {k: "S", i: 0};
  return null;
}
cv.addEventListener("contextmenu", e => e.preventDefault());
cv.addEventListener("pointerdown", e => {
  if (celebrating){ endBounce(); return; }
  if (st.won || autoRunning) return;
  const p = toLogical(e), h = hit(p);
  if (!h) return;
  e.preventDefault(); cv.focus({preventScroll: true});
  try { cv.setPointerCapture(e.pointerId); } catch (_) {}
  if (h.k === "S"){ drag = {stock: true}; return; }
  const pile = pileOf(h.k), c = pile[h.i];
  if (!c || !c.up) return;
  const q = posOf(h.k, h.i);
  drag = {k: h.k, i: h.i, cards: pile.slice(h.i), ox: p.x - q.x, oy: p.y - q.y, sx: p.x, sy: p.y, x: q.x, y: q.y, started: false};
});
cv.addEventListener("pointermove", e => {
  if (!drag || drag.stock) return;
  const p = toLogical(e);
  if (!drag.started && Math.hypot(p.x - drag.sx, p.y - drag.sy) > 3) drag.started = true;
  if (drag.started){ drag.x = p.x - drag.ox; drag.y = p.y - drag.oy; }
});
function endDrag(e){
  const d = drag; drag = null;
  if (!d) return;
  if (d.stock){ drawStock(); return; }
  if (!d.started){ if (!smart(d.k, d.i)) SFX.bad(); return; }
  // déposer : la pile que la carte recouvre le plus
  let bestK = null, bestA = 0;
  const targets = ["F0", "F1", "F2", "F3", "T0", "T1", "T2", "T3", "T4", "T5", "T6"].filter(k => k !== d.k);
  for (const k of targets){
    const pile = pileOf(k), q = posOf(k, Math.max(0, pile.length - 1));
    const ax = Math.max(0, Math.min(d.x + CW, q.x + CW) - Math.max(d.x, q.x)), ay = Math.max(0, Math.min(d.y + CH, q.y + CH) - Math.max(d.y, q.y));
    if (ax * ay > bestA){ bestA = ax * ay; bestK = k; }
  }
  if (bestK && move(d.k, d.i, bestK, {anim: false})) return;
  // sinon, la carte revient à sa place
  animate(d.cards, d.cards.map((c, n) => ({x: d.x, y: d.y + n * SK().du})), d.cards.map((c, n) => posOf(d.k, d.i + n)), 120);
  SFX.bad();
}
cv.addEventListener("pointerup", endDrag);
cv.addEventListener("pointercancel", () => { if (drag && drag.cards) animate(drag.cards, drag.cards.map((c, n) => ({x: drag.x, y: drag.y + n * SK().du})), drag.cards.map((c, n) => posOf(drag.k, drag.i + n)), 120); drag = null; });

/* ---------- rendu ---------- */
function drawTable(skipFound){
  const now = performance.now();
  anims = anims.filter(a => now - a.t0 < a.dur);
  const hidden = new Set(anims.map(a => a.c.id));
  if (drag && drag.started) drag.cards.forEach(c => hidden.add(c.id));
  const card = (c, x, y) => { if (!hidden.has(c.id)) ctx.drawImage(c.up ? faceImg(c) : backImg(), x, y, CW, CH); };
  // pioche
  if (st.stock.length){ if (st.stock.length > 10) ctx.drawImage(backImg(), X(0) + 1, TOPY + 1, CW, CH); ctx.drawImage(backImg(), X(0), TOPY, CW, CH); }
  else slot(X(0), TOPY, st.waste.length ? "recycle" : "nope");
  // défausse
  const n = st.waste.length;
  if (n){ const fan = st.draw === 3 ? Math.max(1, Math.min(st.fan, n)) : 1;
    for (let i = Math.max(0, n - fan - 1); i < n; i++){ const q = posOf("W", i); card(st.waste[i], q.x, q.y); } }
  // fondations
  for (let f = 0; f < 4; f++){
    const p = st.found[f]; slot(X(3 + f), TOPY, p.length ? null : "A");
    if (!skipFound) for (let i = Math.max(0, p.length - 2); i < p.length; i++) card(p[i], X(3 + f), TOPY);
  }
  // colonnes
  for (let j = 0; j < 7; j++){
    const p = st.tab[j];
    if (!p.length) slot(X(j), TABY, "K");
    p.forEach((c, i) => { const q = posOf("T" + j, i); card(c, q.x, q.y); });
  }
  // cartes en vol, puis la pile qu'on tient
  for (const a of anims){
    const t = Math.min(1, (now - a.t0) / a.dur), e = 1 - (1 - t) * (1 - t);
    ctx.drawImage(a.c.up ? faceImg(a.c) : backImg(), a.fx + (a.tx - a.fx) * e, a.fy + (a.ty - a.fy) * e, CW, CH);
  }
  if (drag && drag.started) drag.cards.forEach((c, i) => ctx.drawImage(faceImg(c), drag.x, drag.y + i * SK().du, CW, CH));
}
let last = performance.now();
function frame(now){
  const dt = now - last; last = now;
  if (st.started && !st.won && !document.hidden){
    st.elapsed += Math.min(dt, 1000);
    const steps = Math.floor(st.elapsed / 10000);
    if (steps > st.penal){ addScore(-2 * (steps - st.penal)); st.penal = steps; }
    if (Math.floor((st.elapsed - dt) / 1000) !== Math.floor(st.elapsed / 1000)){ hud(); if (Math.floor(st.elapsed / 1000) % 5 === 0) save(); }
  }
  if (celebrating) stepBounce();
  else { drawFelt(); drawTable(false); }
  requestAnimationFrame(frame);
}

/* ---------- démarrage : on reprend la partie en cours s'il y en a une ---------- */
const saved = store.get("game", null);
if (saved && saved.tab && saved.found && !saved.won){ st = saved; drawMode = st.draw; setMsg("Partie reprise là où tu l'avais laissée."); }
else deal();
hud(); $("autoBtn").hidden = !canAutoFinish();
addEventListener("pagehide", () => save());
requestAnimationFrame(frame);
})();

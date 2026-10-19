'use strict';
/* =====================================================================
   AMIRAL ! : la bataille navale où chaque navire a un pouvoir.
   Grille de 8×8. Au CHANTIER NAVAL, on compose sa flotte de 4 navires
   (un de 4 cases, deux de 3, un de 2) dans le catalogue ; chaque navire
   apporte son pouvoir (AVION, SALVE, MISSILES, SONAR...).
   À chaque tour : un tir OU un pouvoir prêt. Un navire coulé perd son pouvoir.
   Record : la victoire en le moins de tours, par niveau de l'ordinateur.
   L'écran est dessiné en 272 pixels logiques de large ; la hauteur suit la
   forme de l'écran (480 à 620), puis tout est agrandi sans lissage.
   Cahier des charges : specs/amiral.md.
   ===================================================================== */
const C32 = window.Chiens32, OUT = C32.OUT, RAMP = C32.RAMP;
const LW = 272, MAXH = 620, N = 8, CS = 26, BS = CS * N, BX = 38, BY = 58, TAU = Math.PI * 2;
let LH = 480, OY = 0;                     // hauteur logique (suit l'écran) ; décalage des écrans de menus centrés
const FONT_TEXT = z => `700 ${Math.round(z * 1.6)}px Rajdhani, sans-serif`, FONT_LOGO = z => `${z}px "Press Start 2P", monospace`;
const FONT_TINY = '700 10px Rajdhani, sans-serif';
const COLS = 'ABCDEFGH';
// le catalogue du chantier naval ; `cond` : condition de déblocage (lue dans amiral.palmares par `unlocked`)
const SHIPS = {
  carrier:   { name: 'Porte-avions',   le: 'Le porte-avions',    len: 4, power: 'avion',      ok: true, base: true },
  cruiser:   { name: 'Croiseur',       le: 'Le croiseur',        len: 4, power: 'missiles',   ok: true },
  tender:    { name: 'Navire-atelier', le: 'Le navire-atelier',  len: 4, power: 'reparation', ok: true },
  battle:    { name: 'Cuirassé',       le: 'Le cuirassé',        len: 3, power: 'salve',      ok: true, base: true },
  sub:       { name: 'Sous-marin',     le: 'Le sous-marin',      len: 3, power: 'plongee',    ok: true, base: true },
  destroyer: { name: 'Destroyer',      le: 'Le destroyer',       len: 3, power: 'sonar',      ok: true },
  layer:     { name: 'Mouilleur',      le: 'Le mouilleur',       len: 3, power: 'mines',      ok: true, cond: 'GAGNER EN CAPITAINE', need: pm => pm.normal > 0 },
  jammer:    { name: 'Brouilleur',     le: 'Le brouilleur',      len: 3, power: 'fumee',      ok: true, cond: 'GAGNER EN AMIRAL', need: pm => pm.hard > 0 },
  torp:      { name: 'Torpilleur',     le: 'Le torpilleur',      len: 2, power: 'torpille',   ok: true, base: true },
  launch:    { name: 'Vedette',        le: 'La vedette',         len: 2, power: 'leurre',     ok: true, cond: '10 VICTOIRES', need: pm => pm.victoires >= 10 },
  coast:     { name: 'Garde-côte',     le: 'Le garde-côte',      len: 2, power: 'projecteur', ok: true },
};
for (const id in SHIPS) SHIPS[id].id = id;
const SLOTS = [4, 3, 3, 2];                                   // tailles des 4 places de la flotte
const CLASSIC = ['carrier', 'battle', 'sub', 'torp'];          // la flotte de départ (et celle de l'ennemi en MOUSSE)
const POWERS = {
  tir:        { name: 'TIR',        cd: 0, desc: 'UN TIR SUR UNE CASE' },
  avion:      { name: 'AVION',      cd: 3, desc: 'REVELE UNE ZONE 3X3' },
  salve:      { name: 'SALVE',      cd: 4, desc: 'CINQ TIRS EN CROIX' },
  torpille:   { name: 'TORPILLE',   cd: 3, desc: "FILE JUSQU'AU 1ER NAVIRE", dir: true },
  plongee:    { name: 'PLONGEE',    cd: 4, desc: 'LE SOUS-MARIN SE DEPLACE', own: true },
  missiles:   { name: 'MISSILES',   cd: 4, desc: '3 TIRS SUR 3 CASES AU CHOIX' },
  reparation: { name: 'REPARATION', cd: 4, desc: 'REPARE UNE CASE TOUCHEE', own: true },
  sonar:      { name: 'SONAR',      cd: 3, desc: 'NAVIRES CACHES SUR UNE LIGNE', dir: true },
  projecteur: { name: 'PROJECTEUR', cd: 2, desc: 'REVELE UNE LIGNE DE 4 CASES', dir: true },
  mines:      { name: 'MINES',      cd: 5, desc: '2 MINES : TIR EN RETOUR', own: true },
  fumee:      { name: 'FUMEE',      cd: 5, desc: 'ZONE 3X3 MUETTE 2 TOURS', own: true },
  leurre:     { name: 'LEURRE',     cd: 5, desc: 'UN FAUX NAVIRE DE 2 CASES', own: true },
};
const DIFFS = [['easy', 'MOUSSE'], ['normal', 'CAPITAINE'], ['hard', 'AMIRAL']];
const $ = s => document.querySelector(s);
// le hasard du jeu (placement ennemi, IA) : tiré de la date pour la bataille du jour ; les effets visuels gardent Math.random
let rng = Math.random;
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rand = n => Math.floor(rng() * n);
const vr = n => Math.floor(Math.random() * n);
const pick = a => a[rand(a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const cellName = (c, r) => COLS[c] + (r + 1);
const wait = ms => S.fast ? Promise.resolve() : new Promise(r => setTimeout(r, ms));   // S.fast : parties simulées (tests)
const ease = u => u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u);
const store = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('amiral.' + k)); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('amiral.' + k, JSON.stringify(v)); } catch (e) {} },
};

/* =========================================================
   AUDIO (WebAudio chiptune, comme Touché coulé)
   ========================================================= */
const AC = { ctx: null, master: null, sfx: null, mus: null, noiseBuf: null, sfxOn: true, musicOn: true };
function audioInit() {
  if (AC.ctx) { if (AC.ctx.state === 'suspended') AC.ctx.resume(); return; }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  AC.ctx = new Ctx();
  AC.master = AC.ctx.createGain(); AC.master.gain.value = 0.8; AC.master.connect(AC.ctx.destination);
  AC.sfx = AC.ctx.createGain(); AC.sfx.gain.value = AC.sfxOn ? 0.9 : 0; AC.sfx.connect(AC.master);
  AC.mus = AC.ctx.createGain(); AC.mus.gain.value = 0.4; AC.mus.connect(AC.master);
  const len = AC.ctx.sampleRate;
  AC.noiseBuf = AC.ctx.createBuffer(1, len, AC.ctx.sampleRate);
  const d = AC.noiseBuf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
}
function tone({ f, f2, d = 0.1, type = 'square', v = 0.12, t = 0, at, dest }) {
  if (!AC.ctx) return;
  const t0 = at !== undefined ? at : AC.ctx.currentTime + t;
  const o = AC.ctx.createOscillator(), g = AC.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  o.connect(g); g.connect(dest || AC.sfx); o.start(t0); o.stop(t0 + d + 0.02);
}
function noise({ d = 0.3, v = 0.3, freq = 1000, f2, q = 1, type = 'lowpass', t = 0, at, dest }) {
  if (!AC.ctx) return;
  const t0 = at !== undefined ? at : AC.ctx.currentTime + t;
  const s = AC.ctx.createBufferSource(); s.buffer = AC.noiseBuf;
  const fl = AC.ctx.createBiquadFilter(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(freq, t0);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t0 + d);
  const g = AC.ctx.createGain(); g.gain.setValueAtTime(v, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
  s.connect(fl); fl.connect(g); g.connect(dest || AC.sfx); s.start(t0, Math.random() * 0.5); s.stop(t0 + d + 0.02);
}
const seq = (notes, step, opts = {}) => notes.forEach((f, i) => f && tone({ f, d: step * 1.1, t: i * step, ...opts }));
const SFX = {
  tick()   { tone({ f: 1400, d: 0.02, v: 0.02 }); },
  click()  { tone({ f: 880, d: 0.05, v: 0.08 }); },
  select() { tone({ f: 660, d: 0.05, v: 0.08 }); tone({ f: 990, d: 0.07, v: 0.08, t: 0.05 }); },
  place()  { tone({ f: 523, d: 0.06, v: 0.1 }); tone({ f: 784, d: 0.1, v: 0.1, t: 0.06 }); },
  rotate() { tone({ f: 440, f2: 700, d: 0.08, v: 0.08 }); },
  error()  { tone({ f: 140, d: 0.12, v: 0.12 }); tone({ f: 110, d: 0.15, v: 0.12, t: 0.1 }); },
  fire()   { noise({ d: 0.18, v: 0.25, freq: 2500, f2: 400 }); tone({ f: 1200, f2: 180, d: 0.45, v: 0.05 }); },
  splash() { noise({ d: 0.55, v: 0.35, freq: 1800, f2: 300, type: 'bandpass', q: 0.8 }); },
  boom()   { noise({ d: 0.8, v: 0.7, freq: 1200, f2: 80 }); tone({ f: 120, f2: 30, d: 0.6, v: 0.25 }); },
  sunk()   { seq([784, 659, 523, 392, 330, 262], 0.08, { v: 0.09, t: 0.25 }); },
  start()  { seq([262, 330, 392, 523, 0, 392, 523], 0.08, { v: 0.09 }); },
  plane()  { tone({ f: 90, f2: 140, d: 0.9, v: 0.1, type: 'sawtooth' }); tone({ f: 140, f2: 80, d: 0.9, v: 0.08, type: 'sawtooth', t: 0.9 });
             [0, .4, .8].forEach(t => tone({ f: 1250, f2: 1150, d: 0.25, v: 0.06, type: 'sine', t: 0.6 + t })); },
  torpedo(){ noise({ d: 1.1, v: 0.25, freq: 500, f2: 200, type: 'bandpass', q: 1.5 }); tone({ f: 220, f2: 110, d: 0.9, v: 0.08, type: 'triangle' }); },
  dive()   { for (let i = 0; i < 8; i++) tone({ f: 300 + vr(500), f2: 900 + vr(600), d: 0.06, v: 0.06, type: 'sine', t: i * 0.08 }); },
  ready()  { seq([880, 1175], 0.06, { v: 0.06 }); },
  missile(){ for (let i = 0; i < 3; i++) { noise({ d: 0.5, v: 0.2, freq: 900, f2: 4000, type: 'bandpass', q: 1.2, t: i * 0.26 }); tone({ f: 300, f2: 900, d: 0.35, v: 0.05, type: 'sawtooth', t: i * 0.26 }); } },
  sonar()  { [0, .5, 1].forEach((t, i) => { tone({ f: 1480, d: 0.35, v: 0.09 / (i + 1), type: 'sine', t }); tone({ f: 1480, d: 0.25, v: 0.03 / (i + 1), type: 'sine', t: t + 0.18 }); }); },
  beam()   { tone({ f: 60, d: 1.2, v: 0.06, type: 'sawtooth' }); tone({ f: 520, f2: 1040, d: 0.9, v: 0.05, type: 'triangle', t: 0.1 }); seq([0, 0, 1568, 0, 2093], 0.12, { v: 0.04, type: 'sine' }); },
  repair() { [0, .22, .44, .66].forEach(t => { tone({ f: 1900, d: 0.05, v: 0.07, t }); noise({ d: 0.06, v: 0.12, freq: 5000, type: 'highpass', t }); }); seq([0, 0, 0, 0, 0, 0, 523, 659, 784, 1047], 0.08, { v: 0.07 }); },
  mine()   { [0, .25].forEach(t => { noise({ d: 0.3, v: 0.25, freq: 700, f2: 200, type: 'bandpass', q: 1.2, t }); tone({ f: 330, f2: 160, d: 0.25, v: 0.06, type: 'triangle', t }); }); tone({ f: 2200, d: 0.04, v: 0.05, t: 0.6 }); },
  smoke()  { noise({ d: 1.2, v: 0.22, freq: 600, f2: 2400, type: 'bandpass', q: 0.6 }); noise({ d: 0.9, v: 0.12, freq: 3000, type: 'highpass', t: 0.2 }); },
  decoy()  { noise({ d: 0.8, v: 0.18, freq: 2500, f2: 900, type: 'bandpass', q: 2 }); tone({ f: 200, f2: 420, d: 0.7, v: 0.05, type: 'sine' }); },
  win()    { seq([523, 523, 523, 659, 0, 587, 659, 784, 0, 1047], 0.11, { v: 0.1 }); seq([131, 0, 196, 0, 165, 0, 196, 0, 262], 0.12, { type: 'triangle', v: 0.2 }); },
  lose()   { seq([392, 370, 349, 330, 0, 311, 294, 277, 262], 0.16, { v: 0.09 }); seq([98, 0, 92, 0, 87, 0, 82, 0, 65], 0.16, { type: 'triangle', v: 0.2 }); },
};
const MUSIC = {
  timer: null, step: 0, next: 0, dur: 0.16,
  lead: [67,0,72,74, 76,0,74,72, 74,76,79,0, 76,0,0,0, 67,0,72,74, 76,0,79,81, 79,76,74,72, 74,0,0,0,
         72,0,76,79, 81,0,79,76, 77,0,74,77, 76,0,72,0, 74,72,71,72, 74,76,74,71, 72,0,67,0, 72,0,0,0],
  roots: [48,48,43,43, 48,48,43,43, 45,45,41,41, 43,43,48,48],
  start() { if (!AC.ctx || this.timer || !AC.musicOn) return; this.step = 0; this.next = AC.ctx.currentTime + 0.1; this.timer = setInterval(() => this.schedule(), 40); },
  stop() { clearInterval(this.timer); this.timer = null; },
  schedule() {
    const mf = m => 440 * Math.pow(2, (m - 69) / 12);
    if (this.next < AC.ctx.currentTime) this.next = AC.ctx.currentTime + 0.05;
    while (this.next < AC.ctx.currentTime + 0.15) {
      const s = this.step % this.lead.length, at = this.next, dest = AC.mus, n = this.lead[s];
      if (n) { tone({ f: mf(n), d: this.dur * 0.9, v: 0.045, at, dest }); tone({ f: mf(n) * 1.005, d: this.dur * 0.5, v: 0.018, type: 'sawtooth', at, dest }); }
      const root = this.roots[Math.floor(s / 4) % this.roots.length];
      tone({ f: mf(root + (s % 2 ? 12 : 0) - 12), d: this.dur * 0.95, v: 0.15, type: 'triangle', at, dest });
      if (s % 4 === 0) tone({ f: 150, f2: 40, d: 0.12, v: 0.2, at, dest });
      if (s % 4 === 2) noise({ d: 0.09, v: 0.1, freq: 2500, type: 'bandpass', at, dest });
      this.next += this.dur; this.step++;
    }
  },
};

/* =========================================================
   GRAPHISMES 32 BITS (volumes ombrés de chiens32.js)
   ========================================================= */
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
function rnd(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }
const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
function spr(w, h, list, outline = true) {
  const C = C32.Canvas(w, h);
  list.forEach(([shape, ramp, opt], k) => { RAMP['_ami' + k] = ramp; C.draw(shape, Object.assign({ mat: '_ami' + k, id: k + 1, fur: false }, opt || {})); });
  return C.toCanvas(outline);
}
function tint(img, col) { const [c, g] = mk(img.width, img.height); g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; R(g, 0, 0, c.width, c.height, col); return c; }
function rot(img) { const [c, g] = mk(img.height, img.width); g.translate(img.height, 0); g.rotate(Math.PI / 2); g.drawImage(img, 0, 0); return c; }
function text(g, s, x, y, col, align = 'left', size = 8, shadow = '#060a18') {
  g.font = FONT_TEXT(size); g.textAlign = align; g.textBaseline = 'top'; y -= 2;
  if (shadow) { g.fillStyle = shadow; g.fillText(s, x + 1, y + 1); }
  g.fillStyle = col; g.fillText(s, x, y);
}
const GOLD = ['#fff6c2', '#ffd23f', '#e0782a'];
function logo(g, s, x, y, size) {
  g.font = FONT_LOGO(size); g.textAlign = 'center'; g.textBaseline = 'top'; g.lineJoin = 'round';
  g.fillStyle = OUT; g.fillText(s, x + 2, y + 3);
  g.lineWidth = Math.max(3, size / 4); g.strokeStyle = OUT; g.strokeText(s, x, y);
  const gr = g.createLinearGradient(0, y, 0, y + size); gr.addColorStop(0, GOLD[0]); gr.addColorStop(.5, GOLD[1]); gr.addColorStop(1, GOLD[2]);
  g.fillStyle = gr; g.fillText(s, x, y);
}
function plate(g, x, y, w, h, tone_) {
  const top = tone_ === 'gold' ? ['rgba(120,86,20,.97)', 'rgba(60,36,8,.97)'] : tone_ === 'red' ? ['rgba(112,40,44,.96)', 'rgba(44,14,20,.96)']
            : tone_ === 'dim' ? ['rgba(36,44,60,.92)', 'rgba(16,20,30,.92)'] : ['rgba(48,70,104,.96)', 'rgba(16,26,44,.96)'];
  R(g, x + 2, y - 2, w - 4, h + 4, OUT); R(g, x - 2, y + 2, w + 4, h - 4, OUT); R(g, x, y, w, h, OUT);
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, top[0]); gr.addColorStop(1, top[1]);
  g.fillStyle = gr; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  const hl = tone_ === 'gold' ? 'rgba(255,230,140,.7)' : tone_ === 'red' ? 'rgba(255,170,160,.55)' : 'rgba(160,200,240,.55)';
  R(g, x + 2, y + 1, w - 4, 1, hl); R(g, x + 1, y + 2, 1, h - 4, hl);
  R(g, x + 2, y + h - 2, w - 4, 1, 'rgba(0,0,0,.45)'); R(g, x + w - 2, y + 2, 1, h - 4, 'rgba(0,0,0,.45)');
}
// petites étiquettes (Rajdhani 700 10 px) ; une lettre seule est centrée sur sa case
function tiny(g, s, x, y, col, align, maxW) {
  s = String(s);
  if (!align && s.length === 1) { align = 'center'; x += 1; }
  g.font = FONT_TINY;
  if (maxW && g.measureText(s).width > maxW) g.font = '700 9px Rajdhani, sans-serif';   // les noms longs (REPARATION) tiennent sur leur plaque
  g.textAlign = align || 'left'; g.textBaseline = 'top';
  g.fillStyle = '#060a18'; g.fillText(s, x + 1, y - 2); g.fillStyle = col; g.fillText(s, x, y - 3);
}

const P = {
  steel: ['#e4e8ee', '#a9b1bc', '#727b8a', '#474e5c'], gun: ['#c8d0dc', '#8a94a4', '#5e6878', '#3a4150'],
  dark: ['#7a8798', '#4e5a6a', '#36404e', '#232a35'], red: ['#ff8a76', '#e04a3c', '#a8302a', '#6e1d1d'],
  cream: ['#fffbea', '#f1e4c4', '#cdb98e', '#9a845e'], navy: ['#6a7ab8', '#3f4f8a', '#2c3866', '#1c2444'],
  skin: ['#ffdcbc', '#f0b48c', '#c8805e', '#8a5040'], white: ['#ffffff', '#f1ece2', '#d3cbbd', '#ab9f8e'],
  gold: ['#fff2a8', '#ffd23f', '#d09a1c', '#8f6410'], smoke: ['#7c7684', '#57525f', '#3e3a48', '#2a2733'],
  smokeL: ['#a8a2ae', '#87818f', '#6a6574', '#4e4a58'], blue: ['#a8d0f4', '#4a8fd4', '#2f6fb0', '#1a3f6a'],
};
const PORANGE = ['#ffd8a8', '#ff9a3c', '#d0602a', '#8a3a1a'];
const SEA_T = ['#174a8a', '#1c579c', '#2266ae', '#2a76bf'];
const G = {}; // tous les graphismes préparés

function buildSea() {
  const TS = 96, [t, g] = mk(TS, TS), r = rnd(31), bayer = [[0, 2], [3, 1]];
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const a = TAU / TS;
    const v = .55 * Math.sin(a * (2 * x + y) + 1.3) + .45 * Math.sin(a * (x - 3 * y) + .4) + .25 * Math.sin(a * (5 * x + 2 * y) + 2.2) + .15 * Math.sin(a * (7 * y - 4 * x));
    const f = (v + 1.3) / 2.6 * 3 + (bayer[y % 2][x % 2] - 1.5) * .3;
    R(g, x, y, 1, 1, SEA_T[clamp(Math.floor(f), 0, 3)]);
  }
  for (let i = 0; i < 46; i++) {
    const x = Math.floor(r() * TS), y = Math.floor(r() * TS), len = 3 + Math.floor(r() * 4);
    for (let k = 0; k < len; k++) { const yy = (y + (k === 0 || k === len - 1 ? 1 : 0)) % TS;
      R(g, (x + k) % TS, yy, 1, 1, '#5fa2dc'); R(g, (x + k + 1) % TS, (yy + 1) % TS, 1, 1, '#133e74'); }
  }
  const [c, gg] = mk(LW + TS, MAXH + TS);
  for (let y = 0; y < MAXH + TS; y += TS) for (let x = 0; x < LW + TS; x += TS) gg.drawImage(t, x, y);
  G.sea = c;
  const [l, lg] = mk(TS, TS), r2 = rnd(77);
  for (let i = 0; i < 22; i++) {
    const x = Math.floor(r2() * TS), y = Math.floor(r2() * TS), len = 4 + Math.floor(r2() * 6);
    for (let k = 0; k < len; k++) { const yy = (y + Math.round(Math.sin(k / len * Math.PI) * -1.4) + TS) % TS;
      R(lg, (x + k) % TS, yy, 1, 1, k % 3 === 1 ? '#d8f0ff' : '#8cc6f0'); }
  }
  const [cl, cg] = mk(LW + TS, MAXH + TS);
  for (let y = 0; y < MAXH + TS; y += TS) for (let x = 0; x < LW + TS; x += TS) cg.drawImage(l, x, y);
  G.glint = cl;
  G.spark = [...Array(40)].map(() => ({ x: Math.floor(r() * BS), y: Math.floor(r() * BS), ph: r(), sp: (6 + Math.floor(r() * 8)) / 12 }));
}

function rivet(g, x, y) { R(g, x, y, 3, 3, '#14161d'); R(g, x, y, 2, 2, '#8a94a8'); R(g, x, y, 1, 1, '#e0e6f0'); }
// cadre d'acier riveté autour d'une grille (bleu : ma flotte, rouge : l'ennemi)
function buildFrame(mine) {
  const S = BS, [c, g] = mk(S + 24, S + 24), o = 12;
  const acc = mine ? ['#7ec4ff', '#3f86c8'] : ['#ff9a86', '#c8443a'];
  R(g, o - 5, o - 5, S + 10, S + 10, OUT);
  R(g, o - 4, o - 4, S + 8, S + 8, '#6a7383'); R(g, o - 4, o - 4, S + 8, 1, '#d6dbe3'); R(g, o - 4, o - 4, 1, S + 8, '#d6dbe3');
  R(g, o - 3, o - 3, S + 6, S + 6, '#9aa3b1'); R(g, o - 3, o + S + 2, S + 6, 1, '#4a5160'); R(g, o + S + 2, o - 3, 1, S + 6, '#4a5160');
  R(g, o - 2, o - 2, S + 4, S + 4, acc[1]); R(g, o - 2, o - 2, S + 4, 1, acc[0]);
  R(g, o - 1, o - 1, S + 2, S + 2, OUT); g.clearRect(o, o, S, S);
  for (let k = 1; k < N; k++) {
    R(g, o + k * CS, o, 1, S, 'rgba(210,236,255,.38)'); R(g, o, o + k * CS, S, 1, 'rgba(210,236,255,.38)');
    R(g, o + k * CS + 1, o, 1, S, 'rgba(4,20,52,.22)'); R(g, o, o + k * CS + 1, S, 1, 'rgba(4,20,52,.22)');
  }
  for (const [x, y] of [[-4, -4], [S + 1, -4], [-4, S + 1], [S + 1, S + 1], [S / 2 - 1, -4], [S / 2 - 1, S + 1], [-4, S / 2 - 1], [S + 1, S / 2 - 1]]) rivet(g, o + x, o + y);
  return c;
}

// coque vue de dessus : masque, liseré éclairé en haut à gauche, pont, contour sombre
function hull(len, hh, prof, deck, rail) {
  const w = len * CS, h = CS, [c, g] = mk(w, h), M = new Uint8Array(w * h), mid = h / 2, x0 = 2, x1 = w - 3;
  for (let x = 0; x < w; x++) {
    const u = (x + .5 - x0) / (x1 - x0); if (u < 0 || u > 1) continue;
    const hw = prof(u) * hh;
    for (let y = 0; y < h; y++) if (Math.abs(y + .5 - mid) <= hw) M[y * w + x] = 1;
  }
  const at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && M[y * w + x];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!at(x, y)) { if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) R(g, x, y, 1, 1, OUT); continue; }
    const edge = !at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1);
    const edge2 = !edge && (!at(x - 2, y) || !at(x + 2, y) || !at(x, y - 2) || !at(x, y + 2));
    const top = y + .5 < mid;
    if (edge) R(g, x, y, 1, 1, top ? rail[0] : rail[3]);
    else if (edge2) R(g, x, y, 1, 1, top ? rail[1] : rail[2]);
    else R(g, x, y, 1, 1, deck(x, y, (x - x0) / (x1 - x0), (y + .5 - mid) / hh));
    if (edge2 && x % 4 === 0) R(g, x, y, 1, 1, top ? '#ffffff' : rail[3]);
  }
  return { c, g, M, w, h, mid };
}
const pointy = u => u < .06 ? Math.sqrt(1 - ((.06 - u) / .06) ** 2) : u > .62 ? Math.pow(Math.max(0, 1 - Math.pow((u - .62) / .38, 1.8)), .62) : 1;
const cigar = u => Math.pow(Math.max(0, 1 - ((u - .5) / .5) ** 2), .55);
function turret(g, x, y, dir) {
  for (const dy of [-1, 1]) R(g, Math.min(x, x + dir * 8), y + dy - 1, 9, 3, OUT);
  for (const dy of [-1, 1]) R(g, dir > 0 ? x : x - 7, y + dy, 8, 1, '#c8d0dc');
  g.drawImage(spr(10, 10, [[C32.ell(5, 5, 3.4, 3.4), P.gun]]), x - 5, y - 5);
  R(g, x - 2, y - 2, 1, 1, '#ffffff');
}
function buildCarrier() {
  const deckCol = (x, y, u, v) => {
    if (Math.abs(v) < .12 && x % 7 < 4 && u > .06 && u < .86) return '#f4f4f0';
    if (Math.abs(Math.abs(v) - .62) < .1 && u > .05 && u < .8) return x % 6 < 3 ? '#ffd23f' : '#5a6272';
    if (x % 12 === 0) return '#4c5363';
    return (x + y * 3) % 17 === 0 ? '#6c7484' : '#5a6272';
  };
  const H = hull(4, 10, u => u < .03 ? Math.sqrt(1 - ((.03 - u) / .03) ** 2) : u > .8 ? Math.pow(Math.max(0, 1 - ((u - .8) / .2) ** 2.4), .5) : 1, deckCol, P.steel);
  const g = H.g, m = H.mid;
  for (const ex of [20, 40]) { R(g, ex, m - 6, 8, 1, '#3a4150'); R(g, ex, m - 6, 1, 5, '#3a4150'); R(g, ex, m - 1, 8, 1, '#7c8494'); R(g, ex + 8, m - 6, 1, 6, '#7c8494'); }
  R(g, 52, m + 3, 18, 8, OUT); R(g, 53, m + 4, 16, 6, '#9aa3b1'); R(g, 53, m + 4, 16, 1, '#e4e8ee'); R(g, 53, m + 9, 16, 1, '#5e6878');
  R(g, 56, m + 5, 4, 3, OUT); R(g, 57, m + 5, 2, 2, '#2a2a32');
  R(g, 63, m + 5, 5, 2, '#3f86c8'); R(g, 63, m + 5, 5, 1, '#a8d0f4');
  for (const [px, py] of [[9, m - 5], [9, m + 3]]) { R(g, px - 1, py - 2, 7, 5, OUT); R(g, px + 1, py - 3, 3, 7, OUT);
    R(g, px, py, 5, 1, '#e04a3c'); R(g, px + 2, py - 2, 1, 5, '#e04a3c'); R(g, px + 2, py - 2, 1, 1, '#ff8a76'); R(g, px + 4, py, 1, 1, '#fffbea'); }
  H.radar = [60, m + 2];
  return H;
}
function buildBattle() {
  const deckCol = (x, y) => (x + (y >> 1) * 5) % 11 === 0 ? '#8c5a30' : y % 2 === 0 ? '#d7a066' : '#c38a52';
  const H = hull(3, 8, pointy, deckCol, P.steel), g = H.g, m = H.mid;
  g.drawImage(spr(28, 14, [[C32.cap(4, 7, 23, 7, 4.4, 3.4), P.steel], [C32.ell(11, 7, 2.6, 2.4), P.dark], [C32.ell(17, 7, 2.4, 2.2), P.dark], [C32.cap(20, 7, 24, 7, 2.4), P.gun]]), 20, m - 7);
  R(g, 30, m - 2, 2, 2, '#1a1a22'); R(g, 36, m - 2, 2, 2, '#1a1a22');
  turret(g, 56, m, 1); turret(g, 13, m, -1);
  R(g, 66, m, 1, 1, '#ffd23f');
  return H;
}
function buildSub() {
  const H = hull(3, 5.2, cigar, (x, y, u, v) => v < -.3 ? '#5a6676' : (x % 9 === 0 ? '#2c3440' : '#3e4856'), P.dark), g = H.g, m = H.mid;
  g.drawImage(spr(16, 10, [[C32.cap(4, 5, 11, 5, 2.4, 2), P.dark]]), 28, m - 5);
  R(g, 36, m - 1, 1, 1, '#ffd23f'); R(g, 33, m - 1, 1, 1, '#ffffff');
  const { M, w, h } = H;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!M[y * w + x]) continue;
    const u = (x - 2) / (w - 5), v = Math.abs(y + .5 - m) / 5.2, s = Math.max(v - .35, Math.abs(u - .5) * 2 - .7);
    if (s > .35 || (s > .12 && (x + y) % 2 === 0)) R(g, x, y, 1, 1, (x + y) % 3 ? '#2e6aa6' : '#3a7cbc');
  }
  return H;
}
function buildTorp() {
  const H = hull(2, 5.4, pointy, (x, y, u) => u > .66 && u < .74 ? '#e04a3c' : u > .74 && u < .8 ? '#fffbea' : (x % 5 === 0 ? '#8a94a4' : '#b3bac6'), P.steel), g = H.g, m = H.mid;
  R(g, 17, m - 3, 9, 7, OUT); R(g, 18, m - 2, 7, 5, '#e4e8ee'); R(g, 22, m - 2, 3, 5, '#3f86c8'); R(g, 18, m - 2, 7, 1, '#ffffff');
  for (const dy of [-3, 3]) { R(g, 6, m + dy - 1, 8, 2, OUT); R(g, 7, m + dy - 1, 6, 1, '#5e6878'); }
  return H;
}
/* ---------- les navires du chantier (planche maquettes/amiral-navires.html, dessins validés) ---------- */
const boxy = (a, b) => u => u < a ? Math.sqrt(1 - ((a - u) / a) ** 2) : u > 1 - b ? Math.sqrt(Math.max(0, 1 - ((u - 1 + b) / b) ** 2)) : 1;
const plain = (a, b) => (x, y) => x % 10 === 0 ? b : (x + y * 3) % 19 === 0 ? '#7a8292' : a;
function box(g, x, y, w, h, col, hi = '#ffffff') { R(g, x - 1, y - 1, w + 2, h + 2, OUT); R(g, x, y, w, h, col); R(g, x, y, w, 1, hi); }
function ball(g, x, y, r, ramp) { g.drawImage(spr(Math.ceil(r * 2 + 4), Math.ceil(r * 2 + 4), [[C32.ell(r + 2, r + 2, r, r), ramp]]), Math.round(x - r - 2), Math.round(y - r - 2)); }
function capsule(g, x0, x1, y, rw, ramp) { g.drawImage(spr(x1 - x0 + 10, Math.ceil(rw * 2 + 6), [[C32.cap(5, rw + 3, x1 - x0 + 5, rw + 3, rw, rw * .85), ramp]]), x0 - 5, y - rw - 3); }
// tourelle triple vue de dessus (dir 1 : canons vers l'étrave, à droite)
function turret3(g, x, y, dir, big) {
  const L = big ? 10 : 8;
  for (const dy of [-2, 0, 2]) R(g, dir > 0 ? x + 1 : x - L - 1, y + dy - 1, L + 1, 3, OUT);
  for (const dy of [-2, 0, 2]) R(g, dir > 0 ? x + 2 : x - L, y + dy, L - 2, 1, '#c8d0dc');
  g.drawImage(spr(14, 12, [[C32.cap(dir > 0 ? 5 : 9, 6, dir > 0 ? 9 : 5, 6, 3.8, 3.2), P.gun]]), x - 7, y - 6);
  R(g, x - 2 * dir - 1, y - 2, 2, 1, '#e4e8ee'); R(g, x - 3 * dir, y + 2, 1, 1, '#3a4150');
}
// petite tourelle double de 127 mm, canons vers le large
function sec5(g, x, y, out) { R(g, x - 1, y + out * 2, 1, 4 * out > 0 ? 4 : 1, OUT); R(g, x + 1, y + out * 2, 1, 1, OUT); for (const dx of [-1, 1]) { R(g, x + dx, y + (out > 0 ? 2 : -5), 1, 4, OUT); R(g, x + dx, y + (out > 0 ? 3 : -4), 1, 2, '#c8d0dc'); } ball(g, x, y, 2.2, P.gun); }
// cheminée ovale avec chapeau sombre
function stack(g, x, y, w = 5) { g.drawImage(spr(w + 6, 10, [[C32.cap(3, 5, w + 2, 5, 3.4, 3.4), P.steel]]), x - 3, y - 5); R(g, x - 1, y - 2, w, 4, '#1a1a22'); R(g, x - 1, y - 2, w, 1, '#3a3036'); }
// mât : un trait, une vergue, un radar
function mast(g, x, y, h, radar = '#ffffff') { R(g, x, y - h, 1, h * 2, '#c8d0dc'); R(g, x - 1, y - h, 3, 1, OUT); R(g, x - 3, y, 7, 1, '#c8d0dc'); R(g, x + 1, y - 2, 3, 4, OUT); R(g, x + 2, y - 1, 1, 2, radar); }
// cabine détaillée : rouf, passerelle vitrée côté étrave, ailerons, toit
function cabin(g, x, y, w, h, o = {}) {
  R(g, x + 2, y - h + 2, w, h * 2, 'rgba(4,18,48,.35)');
  box(g, x, y - h, w, h * 2, '#c4cad4', '#eef2f6'); R(g, x, y + h - 1, w, 1, '#8a94a4'); R(g, x + w - 1, y - h, 1, h * 2, '#8a94a4');
  const bx = x + w - 6;
  box(g, bx, y - h + 1, 6, h * 2 - 2, '#e4e8ee', '#ffffff');
  for (let yy = y - h + 2; yy < y + h - 2; yy += 2) { R(g, bx + 5, yy, 1, 1, '#1a2a44'); R(g, bx + 5, yy + 1, 1, 1, '#a8d0f4'); }
  if (o.wings) { for (const s of [-1, 1]) { R(g, bx + 1, s < 0 ? y - h - 3 : y + h, 4, 3, OUT); R(g, bx + 2, s < 0 ? y - h - 2 : y + h, 2, 2, '#e4e8ee'); } }
  for (let xx = x + 2; xx < bx - 1; xx += 3) R(g, xx, y - h + 1, 1, 1, '#1a2a44');
  if (o.mast) mast(g, x + Math.round(w * .45), y, h + 1, o.radar);
  if (o.light) { R(g, x + 2, y - 1, 2, 2, OUT); R(g, x + 2, y - 1, 1, 1, '#ff5a46'); }
}
const navyDeck = (x, y) => (x + (y >> 1) * 7) % 13 === 0 ? '#2c3650' : y % 2 ? '#3e4a66' : '#46536f';
const iowaHull = u => u < .04 ? Math.sqrt(1 - ((.04 - u) / .04) ** 2) * .8 + .2 : u > .6 ? Math.pow(Math.max(0, 1 - Math.pow((u - .6) / .4, 1.6)), .7) : 1;
// croiseur C « pont bleu 1944 » : cuirassé façon USS Iowa, trois tourelles triples
function buildCruiser() {
  const H = hull(4, 7.6, iowaHull, navyDeck, P.steel), g = H.g, m = H.mid;
  turret3(g, 22, m, -1, true); turret3(g, 64, m, 1, true); turret3(g, 75, m, 1, false);
  R(g, 34, m - 6, 22, 12, 'rgba(4,18,48,.35)');
  box(g, 32, m - 5, 22, 10, '#a9b1bc', '#e4e8ee'); R(g, 32, m + 4, 22, 1, '#727b8a');
  box(g, 49, m - 4, 6, 8, '#e4e8ee', '#ffffff'); for (let y = m - 3; y < m + 4; y += 2) { R(g, 54, y, 1, 1, '#1a2a44'); R(g, 54, y + 1, 1, 1, '#a8d0f4'); }
  box(g, 38, m - 3, 14, 6, '#c4cad4', '#eef2f6');
  stack(g, 44, m, 4); stack(g, 36, m, 4); mast(g, 47, m, 6); R(g, 40, m - 1, 1, 2, '#c8d0dc');
  for (const x of [35, 42, 49]) for (const s of [-1, 1]) sec5(g, x, m + s * 6, s);
  for (const x of [28, 58]) for (const s of [-1, 1]) { R(g, x, m + s * 6, 2, 2, OUT); R(g, x, m + s * 6, 1, 1, '#c8d0dc'); }
  R(g, 96, m, 1, 1, '#ffd23f'); R(g, 6, m, 3, 1, '#ffffff');
  return H;
}
// navire-atelier A « portiques »
function buildTender() {
  const H = hull(4, 10, boxy(.05, .1), (x, y, u, v) => Math.abs(v) < .25 && x % 6 < 3 ? '#4c5363' : (x + y) % 13 === 0 ? '#6c7484' : '#5a6272', P.steel), g = H.g, m = H.mid;
  for (const gx of [28, 62]) { R(g, gx - 1, m - 11, 6, 22, OUT); for (let y = m - 10; y < m + 10; y++) R(g, gx, y, 4, 1, (y >> 1) % 2 ? '#ffd23f' : '#3a3036'); }
  box(g, 38, m - 6, 6, 4, '#e0782a'); box(g, 46, m - 6, 6, 4, '#3f86c8'); box(g, 54, m - 6, 5, 4, '#8ee05a');
  box(g, 39, m + 2, 18, 6, '#ffffff', '#ffffff'); R(g, 46, m + 2, 4, 6, '#e04a3c'); R(g, 39, m + 4, 18, 2, '#e04a3c');
  capsule(g, 6, 14, m, 5, P.white); ball(g, 12, m, 2, P.blue);
  return H;
}
// destroyer A « moderne »
function buildDestroyer() {
  const H = hull(3, 6.6, pointy, plain('#8a94a4', '#7a8292'), P.steel), g = H.g, m = H.mid;
  capsule(g, 20, 38, m, 3.4, P.steel); ball(g, 25, m, 2.2, P.dark); ball(g, 33, m, 2.4, P.white);
  turret(g, 56, m, 1); for (const dy of [-3, 2]) { R(g, 6, m + dy, 7, 2, OUT); R(g, 7, m + dy, 5, 1, '#5e6878'); }
  return H;
}
// mouilleur de mines C2 « cabine et cheminée »
function buildLayer() {
  const H = hull(3, 7, pointy, (x, y, u, v) => Math.abs(v) > .55 && ((x >> 2) % 2) ? '#e0782a' : (x % 8 === 0 ? '#5e6878' : '#727b8a'), P.steel), g = H.g, m = H.mid;
  for (let x = 7; x < 40; x += 7) { ball(g, x, m, 3, P.dark); R(g, x - 1, m - 4, 2, 1, '#ffd23f'); R(g, x - 4, m, 1, 1, '#ffd23f'); R(g, x + 3, m, 1, 1, '#ffd23f'); }
  R(g, 4, m - 1, 38, 1, 'rgba(0,0,0,.25)');
  cabin(g, 44, m, 13, 4, { mast: true, light: true }); stack(g, 47, m + 0, 3); ball(g, 62, m, 2.4, P.gold); R(g, 64, m - 3, 2, 6, OUT);
  return H;
}
// brouilleur A1 « parabole, passerelle et mât »
function buildJammer() {
  const H = hull(3, 7, pointy, (x, y) => x % 7 === 0 ? '#36404e' : (x + y) % 11 === 0 ? '#5a6676' : '#4e5a6a', P.dark), g = H.g, m = H.mid;
  for (const [x, dy] of [[9, -3], [15, 2], [9, 2], [15, -3]]) ball(g, x, m + dy, 2.4, P.smokeL);
  ball(g, 30, m, 5.4, P.white); ball(g, 30, m, 2.2, P.gun); R(g, 30, m - 6, 1, 1, '#ff5a46');
  cabin(g, 40, m, 16, 4, { wings: true, mast: true, radar: '#ff5a46' });
  R(g, 62, m - 1, 4, 2, OUT); R(g, 62, m - 1, 3, 1, '#c8d0dc');
  return H;
}
// vedette B « porte-leurre »
function buildLaunch() {
  const H = hull(2, 5, pointy, (x) => x % 6 === 0 ? '#5e6878' : '#727b8a', P.steel), g = H.g, m = H.mid;
  capsule(g, 6, 22, m, 3.4, P.red); for (let x = 9; x < 22; x += 4) R(g, x, m - 3, 1, 6, '#a8302a');
  box(g, 30, m - 2, 6, 5, '#e4e8ee'); R(g, 33, m - 2, 3, 5, '#3f86c8');
  return H;
}
// garde-côte A « bande rouge »
function buildCoast() {
  const H = hull(2, 5.4, pointy, (x, y, u, v) => Math.abs(u - .62 + v * .1) < .05 ? '#e04a3c' : Math.abs(u - .7 + v * .1) < .025 ? '#3f86c8' : (x % 5 === 0 ? '#d3cbbd' : '#f1ece2'), P.white), g = H.g, m = H.mid;
  box(g, 14, m - 3, 8, 7, '#e4e8ee'); R(g, 19, m - 3, 3, 7, '#3f86c8'); ball(g, 28, m, 2.4, P.gold);
  return H;
}
function wreckOf(len) {
  return hull(len, len > 3 ? 9 : 5.4, pointy, (x, y) => (x * 3 + y * 5) % 7 === 0 ? '#6a4a3a' : (x + y) % 4 === 0 ? '#1e1a1e' : '#3a3236',
    ['#6a6470', '#4a4552', '#36323e', '#25222c']).c;
}
// écume autour d'une coque (4 images), calculée à partir du contour du sprite
function foamOf(img) {
  const W = img.width + 6, H = img.height + 6, [s, sg] = mk(W, H); sg.drawImage(img, 3, 3);
  const d = sg.getImageData(0, 0, W, H).data, on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
  const out = [];
  for (let f = 0; f < 4; f++) {
    const [fc, fg] = mk(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (on(x, y)) continue;
      const d1 = on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1);
      const d2 = !d1 && (on(x - 2, y) || on(x + 2, y) || on(x, y - 2) || on(x, y + 2) || on(x - 1, y - 1) || on(x + 1, y + 1) || on(x - 1, y + 1) || on(x + 1, y - 1));
      const h = (x * 7 + y * 13 + f * 5) % 11;
      if (d1 && h < 7) R(fg, x, y, 1, 1, h < 3 ? '#ffffff' : '#bfe6ff');
      else if (d2 && h < 3) R(fg, x, y, 1, 1, '#9fd4f8');
    }
    out.push(fc);
  }
  return out;
}
function buildShips() {
  G.ship = {}; G.radar = null;
  const mk2 = (id, img) => {
    const v = rot(img), wr = wreckOf(SHIPS[id].len), wv = rot(wr);
    G.ship[id] = {
      h: { img, sh: tint(img, 'rgba(4,18,48,.45)'), foam: foamOf(img), dead: tint(img, 'rgba(30,24,30,.55)'), wreck: wr, spot: tint(img, 'rgba(255,70,50,1)') },
      v: { img: v, sh: tint(v, 'rgba(4,18,48,.45)'), foam: foamOf(v), dead: tint(v, 'rgba(30,24,30,.55)'), wreck: wv, spot: tint(v, 'rgba(255,70,50,1)') },
    };
  };
  const car = buildCarrier(); G.radar = car.radar;
  mk2('carrier', car.c); mk2('battle', buildBattle().c); mk2('sub', buildSub().c); mk2('torp', buildTorp().c);
  mk2('cruiser', buildCruiser().c); mk2('tender', buildTender().c); mk2('destroyer', buildDestroyer().c);
  mk2('layer', buildLayer().c); mk2('jammer', buildJammer().c); mk2('launch', buildLaunch().c); mk2('coast', buildCoast().c);
  for (const id in G.ship) G.ship[id].dark = tint(G.ship[id].h.img, '#0d1428');   // silhouette du chantier (navire verrouillé)
  // le leurre : un faux torpilleur gonflable, orange à bandes
  { const im = G.ship.torp.h.img, [c, g2] = mk(im.width, im.height); g2.drawImage(im, 0, 0); g2.globalCompositeOperation = 'source-atop';
    g2.fillStyle = 'rgba(255,140,50,.62)'; g2.fillRect(0, 0, c.width, c.height);
    for (let x = 6; x < c.width; x += 9) { g2.fillStyle = 'rgba(255,240,200,.55)'; g2.fillRect(x, 0, 3, c.height); }
    G.decoy = { h: c, v: rot(c) }; }
}
// brouillard de guerre (texture qui ondule) et biseau des cases cachées
function buildFog() {
  const S = BS, [t, g] = mk(S, S), bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const FOG = ['#c9d2ea', '#9eaad0', '#7d8bb8', '#6573a2', '#56628e'];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const a = TAU / S;
    const v = .55 * Math.sin(a * (x + y)) + .45 * Math.sin(a * (2 * y - x) + 1) + .35 * Math.sin(a * (3 * x - y) + 2) + .25 * Math.sin(a * (4 * x + 3 * y) + .5) + .12 * Math.sin(a * (9 * x - 7 * y));
    const f = (1.6 - v) / 3.2 * 4.4 + (bayer[y % 4][x % 4] / 16 - .5) * .55;
    R(g, x, y, 1, 1, FOG[clamp(Math.floor(f), 0, 4)]);
  }
  const [c, cg] = mk(S * 2, S * 2); for (const [x, y] of [[0, 0], [S, 0], [0, S], [S, S]]) cg.drawImage(t, x, y);
  G.fogTex = c; [G.fogBuf, G.fogG] = mk(S, S); [G.fogMask, G.fogMaskG] = mk(S, S);
  const [w, wg] = mk(S * 2, S), r = rnd(21);
  for (let i = 0; i < 9; i++) {
    const x = r() * S, y = 10 + r() * (S - 20), n = 3 + Math.floor(r() * 3), list = [];
    for (let k = 0; k < n; k++) list.push([x + k * 9 + r() * 4, y + (r() - .5) * 6, 5 + r() * 5, 3 + r() * 2]);
    for (const dx of [-S, 0, S]) { const [bc, bg2] = mk(S * 2, S); C32.blob(bg2, list.map(q => [q[0] + dx, q[1], q[2], q[3]]), ['#ffffff', '#eef2fb', '#d6ddef', '#b9c3de']); wg.drawImage(bc, 0, 0); }
  }
  G.fogCloud = w;
  const [cb, cbg] = mk(CS, CS);
  R(cbg, 1, 1, CS - 1, 1, 'rgba(240,246,255,.75)'); R(cbg, 1, 2, 1, CS - 2, 'rgba(240,246,255,.5)');
  R(cbg, 2, CS - 1, CS - 2, 1, 'rgba(20,26,60,.6)'); R(cbg, CS - 1, 2, 1, CS - 2, 'rgba(20,26,60,.6)');
  R(cbg, 11, 9, 3, 1, 'rgba(255,255,255,.18)'); R(cbg, 7, 15, 2, 1, 'rgba(255,255,255,.14)');
  G.bevel = cb;
}
function buildPlane(a) {
  const W = 32, c0 = 16, co = Math.cos(a), si = Math.sin(a), T = (x, y) => [c0 + x * co - y * si, c0 + x * si + y * co];
  return spr(W, W, [
    [C32.cap(...T(-9, -5), ...T(-9, 5), 1.5), P.red], [C32.cap(...T(-1, -12), ...T(-1, 12), 3), P.red],
    [C32.cap(...T(-10, 0), ...T(9, 0), 1.6, 2.8), P.cream],
    [C32.ell(...T(-6, -8), 1.8, 1.8), P.cream, { on: [2] }], [C32.ell(...T(-6, 8), 1.8, 1.8), P.cream, { on: [2] }],
    [C32.ell(...T(2, 0), 2, 1.6, a), P.blue], [C32.ell(...T(8.5, 0), 2.2, 2.2), P.steel],
  ]);
}
function buildBoom() {
  const rampsBy = [
    ['#ffffff', '#ffffff', '#fff6c2', '#ffd23f'], ['#ffffff', '#fff6c2', '#ffd23f', '#ff9a3c'],
    ['#fff6c2', '#ffd23f', '#ff9a3c', '#e0502a'], ['#ffd23f', '#ff9a3c', '#e0502a', '#a8302a'],
    ['#ff9a3c', '#e0502a', '#a8302a', '#5a2a2a'], ['#a89090', '#7e6a6e', '#5a4a52', '#3a3040'],
    ['#9a9098', '#76707e', '#57525f', '#3a3644'], ['#8a8592', '#6d6878', '#55505f', '#3e3a48'],
  ];
  const r = rnd(9), puffs = [...Array(7)].map((_, i) => ({ a: i / 7 * TAU + r() * .5, d: .6 + r() * .5, s: .7 + r() * .5 }));
  G.boom = [];
  for (let f = 0; f < 8; f++) {
    const C = C32.Canvas(40, 40), spread = [0, 2, 4, 6, 8, 9, 10, 11][f], rad = [4, 6, 7, 7, 6, 5.5, 4.5, 3.5][f];
    RAMP._abm = rampsBy[f];
    C.draw(C32.ell(20, 20, Math.max(2, rad * 1.1 - f * .3), Math.max(2, rad * 1.1 - f * .3)), { mat: '_abm', id: 1, fur: false, flat: true });
    for (const p of puffs) C.draw(C32.ell(20 + Math.cos(p.a) * spread * p.d, 20 + Math.sin(p.a) * spread * p.d - f * .6, rad * p.s, rad * p.s), { mat: '_abm', id: 1, fur: false, flat: true });
    if (f >= 1 && f <= 5) { RAMP._abc = rampsBy[f - 1]; const cr = [0, 4, 5, 5, 4, 3][f]; C.draw(C32.ell(19, 19 - f * .6, cr, cr), { mat: '_abc', id: 1, fur: false, flat: true }); }
    G.boom.push(C.toCanvas(f >= 4));
  }
}
function buildPuffs() {
  G.puff = [];
  for (let k = 0; k < 6; k++) { const s = 2 + k * .9, [c, g] = mk(20, 20);
    C32.blob(g, [[10, 10, s], [10 + s * .6, 10 - s * .3, s * .7], [10 - s * .5, 10 + s * .2, s * .6]], k < 3 ? P.smoke : P.smokeL, '#17131e'); G.puff.push(c); }
}
function buildIcons() {
  const I = G.icon = {};
  I.avion = spr(20, 20, [[C32.cap(5, 15, 5, 5, 1.2), P.red], [C32.cap(10, 2, 10, 18, 3.2, 3.2), P.red], [C32.cap(4, 10, 17, 10, 1.6, 2.6), P.cream], [C32.ell(12, 10, 1.6, 1.3), P.blue], [C32.ell(16, 10, 1.8, 1.8), P.steel]]);
  I.torpille = spr(20, 20, [[C32.cap(3, 10, 4, 6, .6, 1.4), P.dark], [C32.cap(3, 10, 4, 14, .6, 1.4), P.dark], [C32.cap(4, 10, 16, 10, 2.8, 2.8), P.gun], [C32.ell(16, 10, 2.6, 2.6), P.red]]);
  I.plongee = spr(20, 20, [[C32.cap(2, 9, 17, 9, 2.8, 3), P.dark], [C32.cap(8, 5, 11, 5, 1.6), P.dark], [C32.ell(16, 9, 1.4, 1.4), P.gold, { on: [1] }]]);
  { const g = I.plongee.getContext('2d'); R(g, 8, 13, 3, 3, OUT); R(g, 9, 12, 1, 5, '#8ee05a'); R(g, 7, 15, 5, 1, '#8ee05a'); R(g, 8, 16, 3, 1, '#8ee05a'); R(g, 9, 17, 1, 1, '#8ee05a'); }
  I.salve = spr(20, 20, [[C32.cap(4, 15, 4, 8, 2), P.gold], [C32.ell(4, 6, 2, 2.4), P.gun], [C32.cap(10, 16, 10, 7, 2), P.gold], [C32.ell(10, 5, 2, 2.4), P.gun], [C32.cap(16, 15, 16, 8, 2), P.gold], [C32.ell(16, 6, 2, 2.4), P.gun]]);
  // tir : un obus avec sa cible
  I.missiles = spr(20, 20, [[C32.cap(4, 17, 4, 7, 1.6), P.steel], [C32.ell(4, 5, 1.6, 2.2), P.red], [C32.cap(10, 15, 10, 5, 1.6), P.steel], [C32.ell(10, 3, 1.6, 2.2), P.red], [C32.cap(16, 17, 16, 7, 1.6), P.steel], [C32.ell(16, 5, 1.6, 2.2), P.red]]);
  { const g = I.missiles.getContext('2d'); for (const x of [4, 10, 16]) { const y = x === 10 ? 16 : 18; R(g, x - 1, y, 3, 1, '#ffd23f'); R(g, x, y + 1, 1, 1, '#ff9a3c'); } }
  I.sonar = spr(20, 20, [[C32.ell(4, 10, 2.8, 2.8), P.blue]]);
  { const g = I.sonar.getContext('2d');
    for (const [r, col] of [[6, '#9ff0ff'], [10, '#5fd0f0'], [14, '#3a9ac8']]) for (let k = -6; k <= 6; k++) { const a = k / 6 * .9, x = Math.round(4 + Math.cos(a) * r), y = Math.round(10 + Math.sin(a) * r);
      R(g, x, y - 1, 2, 3, OUT); }
    for (const [r, col] of [[6, '#9ff0ff'], [10, '#5fd0f0'], [14, '#3a9ac8']]) for (let k = -6; k <= 6; k++) { const a = k / 6 * .9; R(g, Math.round(4 + Math.cos(a) * r), Math.round(10 + Math.sin(a) * r), 1, 1, col); } }
  I.projecteur = spr(20, 20, [[C32.ell(5, 10, 4, 4.4), P.steel], [C32.ell(6, 10, 2.6, 3), P.gold, { on: [1] }]]);
  { const g = I.projecteur.getContext('2d');
    for (let x = 10; x < 20; x++) { const h = Math.round((x - 8) * .6); R(g, x, 10 - h - 1, 1, 1, OUT); R(g, x, 10 + h + 1, 1, 1, OUT); R(g, x, 10 - h, 1, h * 2 + 1, x % 3 ? '#fff6c2' : '#ffd23f'); } }
  I.reparation = spr(20, 20, [[C32.cap(4, 16, 12, 8, 1.8), P.gun], [C32.ell(13.5, 6.5, 3.6, 3.6), P.gun]]);
  { const g = I.reparation.getContext('2d'); g.clearRect(14, 2, 3, 4); R(g, 13, 5, 1, 2, OUT); R(g, 17, 5, 1, 2, OUT);
    R(g, 12, 13, 7, 3, OUT); R(g, 14, 11, 3, 7, OUT); R(g, 13, 14, 5, 1, '#8ee05a'); R(g, 15, 12, 1, 5, '#8ee05a'); }
  // mines : une boule à pointes et son voyant ; fumée : trois bouffées ; leurre : un canot gonflable orange
  I.mines = spr(20, 20, [[C32.ell(10, 11, 5.4, 5.4), P.dark], [C32.ell(8.5, 9.5, 1.6, 1.6), P.red, { on: [1] }]]);
  { const g = I.mines.getContext('2d'); for (const [x, y, w, h] of [[9, 2, 2, 3], [9, 17, 2, 3], [1, 10, 3, 2], [16, 10, 3, 2], [4, 4, 2, 2], [14, 4, 2, 2], [4, 16, 2, 2], [14, 16, 2, 2]]) { R(g, x - 1, y - 1, w + 2, h + 2, OUT); R(g, x, y, w, h, '#a9b1bc'); } }
  I.fumee = spr(20, 20, [[C32.ell(6, 13, 4.6, 4), P.smokeL], [C32.ell(13, 12, 5, 4.6), P.smokeL], [C32.ell(10, 6.5, 4.2, 3.8), P.white]]);
  I.leurre = spr(20, 20, [[C32.cap(3, 11, 17, 11, 3.4, 3.4), PORANGE], [C32.cap(6, 10, 14, 10, 1.4, 1.4), P.gun, { on: [1] }]]);
  { const g = I.leurre.getContext('2d'); for (const x of [6, 10, 14]) R(g, x, 13, 2, 1, '#fff2c8'); }
  I.tir = spr(20, 20, [[C32.ell(10, 10, 7, 7), P.red], [C32.ell(10, 10, 4.4, 4.4), P.white, { on: [1] }], [C32.ell(10, 10, 2.2, 2.2), P.red, { on: [2] }]]);
  const A = spr(36, 40, [
    [C32.ell(18, 38, 15, 8), P.navy], [C32.ell(5, 33, 4.4, 2.6), P.gold], [C32.ell(31, 33, 4.4, 2.6), P.gold],
    [C32.cap(18, 30, 18, 39, 3, 4), P.white], [C32.ell(18, 21, 8, 8.6), P.skin],
    [C32.ell(10, 22, 1.8, 2.4), P.skin], [C32.ell(26, 22, 1.8, 2.4), P.skin],
    [C32.cap(17, 26, 10, 25, 1.8, 1.2), P.white], [C32.cap(19, 26, 26, 25, 1.8, 1.2), P.white],
    [C32.ell(18, 23.5, 2.2, 2), P.skin], [C32.ell(18, 10, 16, 5.2), P.navy], [C32.cap(4, 12, 32, 12, 1.2), P.gold],
    [C32.ell(18, 8, 2.8, 2.8), P.red], [C32.ell(18, 8, 1.4, 1.4), P.white],
  ]);
  const ag = A.getContext('2d');
  R(ag, 14, 19, 2, 2, OUT); R(ag, 21, 19, 2, 2, OUT); R(ag, 14, 19, 1, 1, '#ffffff'); R(ag, 21, 19, 1, 1, '#ffffff');
  R(ag, 13, 17, 4, 1, '#e8e4dc'); R(ag, 20, 17, 4, 1, '#e8e4dc'); R(ag, 12, 22, 2, 1, '#ff9a86'); R(ag, 23, 22, 2, 1, '#ff9a86');
  for (const y of [32, 35]) R(ag, 17, y, 2, 2, '#ffd23f');
  G.admiral = A;
  { const [c, g] = mk(36, 40); g.drawImage(A, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(200,40,40,.35)'; g.fillRect(0, 0, 36, 40); G.enemyAdm = c; }
}
function buildAll() {
  buildSea(); G.frameMine = buildFrame(true); G.frameFoe = buildFrame(false);
  buildShips(); buildFog(); buildBoom(); buildPuffs(); buildIcons();
  G.plane = []; G.planeSh = [];
  for (let k = 0; k < 16; k++) { const p = buildPlane(k / 16 * TAU); G.plane.push(p); G.planeSh.push(tint(p, 'rgba(4,16,44,.42)')); }
  [G.mini, G.miniG] = mk(BS + 24, BS + 24);
}

/* =========================================================
   ÉTAT DU JEU
   ========================================================= */
// une flotte : 4 navires du catalogue, dans l'ordre des places (4, 3, 3, 2 cases)
function makeBoard(fleet = CLASSIC) {
  const ships = fleet.map(id => ({ def: SHIPS[id], placed: false, c: 0, r: 0, h: true, hits: 0, sunk: false }));
  return {
    ships,
    grid: Array.from({ length: N }, () => Array(N).fill(-1)),
    shots: Array.from({ length: N }, () => Array(N).fill(0)),  // 0 inconnu, 1 à l'eau, 2 touché, 3 leurre touché (l'adversaire croit à un touché)
    intel: Array.from({ length: N }, () => Array(N).fill(0)),  // ce que l'adversaire a repéré : 1 eau, 2 navire
    cd: Object.fromEntries(ships.map(s => [s.def.power, 0])),  // tours d'attente des pouvoirs de ce camp
    sonar: [],                                                 // lignes sondées par l'adversaire : { h, i, n } (n : cases de navire pas encore touchées)
    mines: [],                                                 // mines posées dans ses eaux : [c, r]
    decoys: [],                                                // leurres : { cells, h }
    smoke: null,                                               // fumée : { c0, r0, left } (zone 3 × 3, coups ennemis restants)
    veil: Array.from({ length: N }, () => Array(N).fill(false)), // cases visées dans la fumée : l'adversaire n'en connaît pas le résultat
  };
}
const S = {
  phase: 'title', diff: 'normal', view: 'enemy', prevView: null, viewT0: 0,
  weapon: 'tir', dir: true, aim: null, armed: null, marks: [], peek: false, fast: false,
  player: makeBoard(), enemy: makeBoard(), sel: 0, busy: false, turn: 'player',
  stats: { turns: 0, shots: 0, hits: 0, aiShots: 0, aiHits: 0 },
  fx: [], parts: [], msg: '', msgT0: 0, quitArm: 0, endInfo: null, rankText: '', titleSel: 1, daily: null,
};
const boardOf = side => side === 'player' ? S.player : S.enemy;   // la flotte de ce camp
const foeOf = side => side === 'player' ? S.enemy : S.player;     // la flotte visée par ce camp
const other = side => side === 'player' ? 'ai' : 'player';
const keyOf = b => b === S.player ? 'player' : 'enemy';
const shipIdx = (b, p) => b.ships.findIndex(s => s.def.power === p);   // le navire qui porte ce pouvoir (-1 : aucun)
const shipOf = (b, p) => b.ships[shipIdx(b, p)] || null;
const powersOf = b => b.ships.map(s => s.def.power);

function shipCells(s, c = s.c, r = s.r, h = s.h) { const o = []; for (let i = 0; i < s.def.len; i++) o.push(h ? [c + i, r] : [c, r + i]); return o; }
function fits(b, i, c, r, h, avoidShots) {
  const len = b.ships[i].def.len;
  for (let k = 0; k < len; k++) {
    const cc = h ? c + k : c, rr = h ? r : r + k;
    if (cc < 0 || rr < 0 || cc >= N || rr >= N) return false;
    const o = b.grid[rr][cc]; if (o !== -1 && o !== i) return false;
    if (avoidShots && b.shots[rr][cc]) return false;
  }
  return true;
}
function placeShip(b, i, c, r, h) {
  const s = b.ships[i];
  if (s.placed) for (const [cc, rr] of shipCells(s)) b.grid[rr][cc] = -1;
  Object.assign(s, { c, r, h, placed: true });
  for (const [cc, rr] of shipCells(s)) b.grid[rr][cc] = i;
}
function randomFleet(b, rnd = rng) {
  const rd = n => Math.floor(rnd() * n);
  for (;;) {
    b.grid.forEach(row => row.fill(-1)); b.ships.forEach(s => { s.placed = false; });
    let ok = true;
    for (let i = 0; i < b.ships.length && ok; i++) {
      const len = b.ships[i].def.len;
      let n = 0, c, r, h;
      do { h = rnd() < .5; c = rd(h ? N - len + 1 : N); r = rd(h ? N : N - len + 1); n++; } while (!fits(b, i, c, r, h) && n < 200);
      if (n >= 200) ok = false; else placeShip(b, i, c, r, h);
    }
    if (ok) return;
  }
}
const allSunk = b => b.ships.every(s => s.sunk);
// pourquoi ce pouvoir ne peut pas servir maintenant (null : il est prêt)
function blocked(side, p) {
  if (p === 'tir') return null;
  const b = boardOf(side), s = shipOf(b, p);
  if (!s) return 'absent';
  if (s.sunk) return 'sunk';
  if (b.cd[p] > 0) return 'cd';
  if (p === 'plongee' && s.hits > 0) return 'hit';
  if (p === 'plongee' && !diveTargets(b).length) return 'stuck';
  if (p === 'reparation' && !repairTargets(b).length) return 'intact';
  if (p === 'mines' && b.mines.length >= MAX_MINES) return 'full';
  if (p === 'mines' && !mineTargets(b).length) return 'stuck';
  if (p === 'leurre' && b.decoys.length >= MAX_DECOYS) return 'full';
  if (p === 'leurre' && !decoySpots(b).length) return 'stuck';
  return null;
}
const ready = (side, p) => !blocked(side, p);
// les cases où le sous-marin peut plonger : 2 cases au plus, même sens, jamais sur une case déjà visée
function diveTargets(b) {
  const i = shipIdx(b, 'plongee'), s = b.ships[i], out = [];
  if (!s || s.sunk || s.hits) return out;
  for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
    if (!dc && !dr) continue;
    const c = s.c + dc, r = s.r + dr;
    if (fits(b, i, c, r, s.h, true) && shipCells(s, c, r).every(([x, y]) => !trapAt(b, x, y))) out.push([c, r]);
  }
  return out;
}
// les cases que le navire-atelier peut réparer : touchées, sur un navire pas coulé
function repairTargets(b) {
  const out = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b.shots[r][c] === 2 && !b.ships[b.grid[r][c]].sunk) out.push([c, r]);
  return out;
}

// mines, fumée, leurre : dans ses propres eaux, sur de l'eau libre que l'adversaire ne connaît pas
const MAX_MINES = 4, MAX_DECOYS = 2;
const mineAt = (b, c, r) => b.mines.some(m => m[0] === c && m[1] === r);
const decoyAt = (b, c, r) => b.decoys.find(d => d.cells.some(([x, y]) => x === c && y === r)) || null;
const trapAt = (b, c, r) => mineAt(b, c, r) || !!decoyAt(b, c, r);
const freeWater = (b, c, r) => inb([c, r]) && b.grid[r][c] < 0 && !b.shots[r][c] && !b.intel[r][c] && !trapAt(b, c, r);
function mineTargets(b) { const out = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (freeWater(b, c, r)) out.push([c, r]); return out; }
const decoyCells = (c, r, h) => h ? [[c, r], [c + 1, r]] : [[c, r], [c, r + 1]];
const decoyFits = (b, c, r, h) => decoyCells(c, r, h).every(([x, y]) => freeWater(b, x, y));
function decoySpots(b) { const out = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const h of [true, false]) if (decoyFits(b, c, r, h)) out.push([c, r, h]); return out; }
const inSmoke = (b, c, r) => !!b.smoke && c >= b.smoke.c0 && c < b.smoke.c0 + 3 && r >= b.smoke.r0 && r < b.smoke.r0 + 3;
// les cases que chaque pouvoir « chez soi » peut viser (plongée, réparation, mines, fumée, leurre)
function ownTargets(b, w) {
  if (w === 'plongee') return diveTargets(b);
  if (w === 'reparation') return repairTargets(b);
  if (w === 'mines') return mineTargets(b);
  if (w === 'leurre') { const k = new Set(), out = []; for (const [c, r] of decoySpots(b)) if (!k.has(r * N + c)) { k.add(r * N + c); out.push([c, r]); } return out; }
  const out = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) out.push([c, r]); return out;
}

/* ---------- cases touchées par chaque arme ---------- */
const inb = ([x, y]) => x >= 0 && y >= 0 && x < N && y < N;
function zoneOf(c, r) { return [clamp(c - 1, 0, N - 3), clamp(r - 1, 0, N - 3)]; }
// le projecteur éclaire 4 cases autour de la case visée, dans le sens choisi
function beamCells(c, r, h) { const s = clamp((h ? c : r) - 1, 0, N - 4); return Array.from({ length: 4 }, (_, i) => h ? [s + i, r] : [c, s + i]); }
const lineCells = (c, r, h) => Array.from({ length: N }, (_, i) => h ? [i, r] : [c, i]);
function weaponCells(w, c, r, h) {
  if (w === 'avion') { const [c0, r0] = zoneOf(c, r), o = []; for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) o.push([c0 + x, r0 + y]); return o; }
  if (w === 'salve') return [[c, r], [c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]].filter(inb);
  if (w === 'torpille' || w === 'sonar') return lineCells(c, r, h);
  if (w === 'projecteur') return beamCells(c, r, h);
  return [[c, r]];
}
function canUse(b, w, c, r, h, cells) {
  if (w === 'missiles') return cells && cells.length > 0 && cells.every(([x, y]) => !b.shots[y][x]) && new Set(cells.map(([x, y]) => y * N + x)).size === cells.length;
  if (w === 'avion' || w === 'projecteur') return weaponCells(w, c, r, h).some(([x, y]) => !b.shots[y][x] && !b.intel[y][x]);
  return weaponCells(w, c, r, h).some(([x, y]) => !b.shots[y][x]);
}
// sonar : ce qu'on déduit d'une ligne sondée (0 navire : tout est de l'eau ; autant de navires que de cases inconnues : tout est navire)
function sonarDeduce(b) {
  for (const q of b.sonar) {
    const free = lineCells(q.h ? 0 : q.i, q.h ? q.i : 0, q.h).filter(([x, y]) => !b.shots[y][x]);
    if (q.n === 0) for (const [x, y] of free) { if (!b.intel[y][x]) b.intel[y][x] = 1; }
    else if (q.n === free.length) for (const [x, y] of free) b.intel[y][x] = 2;
  }
  b.sonar = b.sonar.filter(q => lineCells(q.h ? 0 : q.i, q.h ? q.i : 0, q.h).some(([x, y]) => !b.shots[y][x]));
}
const onLine = (q, c, r) => q.h ? r === q.i : c === q.i;

/* =========================================================
   IA (side : le camp qui joue ; elle sait jouer les deux camps, pour les parties simulées)
   ========================================================= */
function aiKnow(side) {
  const b = foeOf(side), sh = b.shots, unknown = [], openHits = [], detected = [];
  const blocked = Array.from({ length: N }, () => Array(N).fill(false));
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (sh[r][c] === 0) {
      if (b.intel[r][c] === 1) blocked[r][c] = true;
      else { unknown.push([c, r]); if (b.intel[r][c] === 2) detected.push([c, r]); }
    } else if (b.veil[r][c]) continue;                 // visée dans la fumée : résultat inconnu
    else if (sh[r][c] === 1) blocked[r][c] = true;
    else if (sh[r][c] === 2 && b.ships[b.grid[r][c]].sunk) blocked[r][c] = true;
    else openHits.push([c, r]);                         // touché (ou leurre : l'IA s'y laisse prendre)
  }
  return { side, b, unknown, openHits, detected, blocked };
}
function density(K) {
  const b = K.b, known = new Set([...K.openHits, ...K.detected].map(([c, r]) => r * N + c));
  const score = Array.from({ length: N }, () => Array(N).fill(0));
  for (const L of b.ships.filter(s => !s.sunk).map(s => s.def.len)) for (const h of [true, false])
    for (let r = 0; r < (h ? N : N - L + 1); r++) for (let c = 0; c < (h ? N - L + 1 : N); c++) {
      let ok = true, cover = 0;
      for (let i = 0; i < L; i++) { const cc = h ? c + i : c, rr = h ? r : r + i; if (K.blocked[rr][cc]) { ok = false; break; } if (known.has(rr * N + cc)) cover++; }
      if (!ok || (known.size && !cover)) continue;
      const w = known.size ? cover * cover * 10 : 1;
      for (let i = 0; i < L; i++) { const cc = h ? c + i : c, rr = h ? r : r + i; if (b.shots[rr][cc] === 0) score[rr][cc] += w; }
    }
  // les lignes sondées : plus il reste de cases de navire pour peu de cases inconnues, plus elles sont chaudes
  if (S.diff !== 'easy') for (const q of b.sonar) {
    if (!q.n) continue;
    const free = lineCells(q.h ? 0 : q.i, q.h ? q.i : 0, q.h).filter(([x, y]) => !b.shots[y][x] && b.intel[y][x] !== 1);
    const f = 1 + 2 * q.n / Math.max(1, free.length);
    for (const [x, y] of free) score[y][x] *= f;
  }
  return score;
}
function aiPick(K) {
  const sh = K.b.shots;
  if (K.detected.length && (S.diff !== 'easy' || rng() < .6)) return pick(K.detected);
  if (S.diff === 'easy') {
    if (K.openHits.length && rng() < .5) {
      const near = [];
      for (const [c, r] of K.openHits) for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const cc = c + dc, rr = r + dr;
        if (cc >= 0 && rr >= 0 && cc < N && rr < N && sh[rr][cc] === 0 && !K.blocked[rr][cc]) near.push([cc, rr]);
      }
      if (near.length) return pick(near);
    }
    return pick(K.unknown);
  }
  if (S.diff === 'normal' && !K.openHits.length && !K.b.sonar.some(q => q.n)) { const par = K.unknown.filter(([c, r]) => (c + r) % 2 === 0); return pick(par.length ? par : K.unknown); }
  const score = density(K);
  let best = -1, cands = [];
  for (const [c, r] of K.unknown) { const v = score[r][c]; if (v > best) { best = v; cands = [[c, r]]; } else if (v === best) cands.push([c, r]); }
  return cands.length ? pick(cands) : pick(K.unknown);
}
function aiAim(w, K) {
  const b = K.b;
  if (w === 'missiles') {
    // les cases repérées d'abord, puis les plus probables
    const D = S.diff === 'easy' ? null : density(K), list = K.unknown.map(([c, r]) => ({ c, r, v: (b.intel[r][c] === 2 ? 1e6 : 0) + (D ? D[r][c] : 0) + rng() }));
    list.sort((p, q) => q.v - p.v);
    const top = S.diff === 'hard' ? list.slice(0, 3) : S.diff === 'normal' ? list.slice(0, 6).sort(() => rng() - .5).slice(0, 3) : list.sort(() => rng() - .5).slice(0, 3);
    return top.length ? { w, c: top[0].c, r: top[0].r, h: true, cells: top.map(q => [q.c, q.r]) } : null;
  }
  if (S.diff === 'easy') { const [c, r] = pick(K.unknown); return { w, c, r, h: rng() < .5 }; }
  const D = density(K);
  const val = (c, r) => (c >= 0 && r >= 0 && c < N && r < N && b.shots[r][c] === 0 && b.intel[r][c] !== 1) ? D[r][c] + .01 : 0;
  const fresh = (x, y) => !b.shots[y][x] && !b.intel[y][x];
  let best = { s: -1 };
  const consider = (s, plan) => { s += rng() * .001; if (s > best.s) best = { s, plan }; };
  if (w === 'torpille') {
    // la torpille s'arrête au premier navire : on vise la ligne la plus chargée près du bord
    for (let i = 0; i < N; i++) {
      let sr = 0, sc = 0;
      for (let j = 0; j < N; j++) { sr += val(j, i) * (1 - j / (N * 2)); sc += val(i, j) * (1 - j / (N * 2)); }
      consider(sr, { w, c: 0, r: i, h: true }); consider(sc, { w, c: i, r: 0, h: false });
    }
  } else if (w === 'sonar') {
    // la ligne la plus prometteuse qui n'a pas encore été sondée et garde au moins 3 cases inconnues
    for (let i = 0; i < N; i++) for (const h of [true, false]) {
      if (b.sonar.some(q => q.h === h && q.i === i)) continue;
      const cells = lineCells(h ? 0 : i, h ? i : 0, h).filter(([x, y]) => fresh(x, y));
      if (cells.length < 3) continue;
      consider(cells.reduce((a, [x, y]) => a + D[y][x] + .2, 0), { w, c: h ? 0 : i, r: h ? i : 0, h });
    }
  } else if (w === 'avion' || w === 'projecteur') {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) for (const h of w === 'avion' ? [true] : [true, false]) {
      if (w === 'avion' && (r < 1 || c < 1 || r > N - 2 || c > N - 2)) continue;
      const cells = weaponCells(w, c, r, h);
      consider(cells.reduce((a, [x, y]) => a + (fresh(x, y) ? D[y][x] + .3 : 0), 0), { w, c, r, h });
    }
  } else {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++)
      consider(weaponCells(w, c, r, true).reduce((a, [x, y]) => a + val(x, y), 0), { w, c, r, h: true });
  }
  return best.plan || null;
}
// le sous-marin d'un camp est-il menacé ? (repéré, ou des tirs tombent tout près)
function subThreat(side) {
  const b = boardOf(side), s = shipOf(b, 'plongee');
  if (!s || s.sunk || s.hits) return 0;
  let th = 0;
  for (const [c, r] of shipCells(s)) {
    if (b.intel[r][c] === 2) th += 3;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = c + dx, y = r + dy; if (inb([x, y]) && b.shots[y][x]) th += .5; }
  }
  if (b.sonar.some(q => q.n && shipCells(s).some(([c, r]) => onLine(q, c, r)))) th += 1;
  return th;
}
function aiDive(side) {
  const b = boardOf(side), T = diveTargets(b), s = shipOf(b, 'plongee');
  if (!T.length) return null;
  if (S.diff === 'easy') { const [c, r] = pick(T); return { w: 'plongee', c, r, h: s.h }; }
  // l'endroit le plus calme : loin des tirs et des cases repérées par l'adversaire
  let best = null, bs = -1e9;
  for (const [c, r] of T) {
    let v = rng() * .1;
    for (const [x, y] of shipCells(s, c, r)) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy; if (!inb([xx, yy])) continue;
      if (b.shots[yy][xx]) v -= 1 / (1 + Math.abs(dx) + Math.abs(dy));
      if (b.intel[yy][xx]) v -= .5 / (1 + Math.abs(dx) + Math.abs(dy));
    }
    if (v > bs) { bs = v; best = [c, r]; }
  }
  return { w: 'plongee', c: best[0], r: best[1], h: s.h };
}
// réparer dès qu'un navire est touché ; d'abord celui qui va couler, ou le sous-marin (il pourra replonger)
function aiRepair(side) {
  const b = boardOf(side);
  let best = null, bs = 0;
  for (const [c, r] of repairTargets(b)) {
    const s = b.ships[b.grid[r][c]];
    let v = s.hits >= s.def.len - 1 ? 2 : s.hits / s.def.len;
    if (s.def.power === 'plongee' && s.hits === 1 && S.diff === 'hard') v += 1;
    if (S.diff !== 'easy') v += rng() * .1;
    if (v > bs) { bs = v; best = [c, r]; }
  }
  return best && bs >= .3 ? { w: 'reparation', c: best[0], r: best[1], h: true } : null;
}
// mines : là où l'adversaire va tirer, à côté de nos navires touchés (il cherche la suite), puis de nos navires
function aiMines(side) {
  const b = boardOf(side), T = mineTargets(b), need = Math.min(2, MAX_MINES - b.mines.length, T.length);
  if (need <= 0) return null;
  const live = (x, y) => b.grid[y][x] >= 0 && !b.ships[b.grid[y][x]].sunk;
  const near = (c, r, f) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => inb([c + dx, r + dy]) && f(c + dx, r + dy));
  const list = T.map(([c, r]) => ({ c, r, v: rng() + (S.diff === 'easy' ? 0 : near(c, r, (x, y) => live(x, y) && b.shots[y][x] === 2) ? 4 : near(c, r, live) ? 1.5 : 0) }));
  list.sort((p, q) => q.v - p.v);
  if (S.diff !== 'easy' && list[0].v < 4 && rng() < .6) return null;   // mieux vaut attendre un navire touché
  const cells = list.slice(0, need).map(q => [q.c, q.r]);
  return { w: 'mines', c: cells[0][0], r: cells[0][1], h: true, cells };
}
// fumée : sur nos navires touchés ou repérés, que l'adversaire est en train de chasser
function aiSmoke(side) {
  const b = boardOf(side); let best = null, bs = 0;
  for (let r = 1; r < N - 1; r++) for (let c = 1; c < N - 1; c++) {
    let v = rng() * .1;
    for (const [x, y] of weaponCells('avion', c, r)) {
      const i = b.grid[y][x]; if (i < 0 || b.ships[i].sunk || b.shots[y][x]) continue;
      v += b.ships[i].hits || b.intel[y][x] === 2 ? 1 : .25;
    }
    if (v > bs) { bs = v; best = [c, r]; }
  }
  return best && bs >= (S.diff === 'easy' ? .5 : 2) ? { w: 'fumee', c: best[0], r: best[1], h: true } : null;
}
// leurre : là où l'adversaire a le plus de chances de tirer (ses probabilités sur nos eaux), loin de nos navires
function aiDecoy(side) {
  const b = boardOf(side), T = decoySpots(b); if (!T.length) return null;
  if (S.diff === 'easy') { const [c, r, h] = pick(T); return { w: 'leurre', c, r, h }; }
  const D = density(aiKnow(other(side)));
  let best = T[0], bs = -1e9;
  for (const [c, r, h] of T) {
    let v = rng() * .5;
    for (const [x, y] of decoyCells(c, r, h)) {
      v += D[y][x];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (inb([xx, yy]) && b.grid[yy][xx] >= 0 && !b.ships[b.grid[yy][xx]].sunk) v -= 3; }
    }
    if (v > bs) { bs = v; best = [c, r, h]; }
  }
  return { w: 'leurre', c: best[0], r: best[1], h: best[2] };
}
function aiPlan(side) {
  const K = aiKnow(side), p = { easy: .3, normal: .6, hard: .95 }[S.diff], has = w => ready(side, w) && rng() < p;
  if (ready(side, 'plongee') && subThreat(side) >= (S.diff === 'hard' ? 2 : 3) && rng() < p) { const d = aiDive(side); if (d) return d; }
  if (has('reparation')) { const d = aiRepair(side); if (d) return d; }
  if (has('fumee')) { const d = aiSmoke(side); if (d) return d; }
  if (has('mines')) { const d = aiMines(side); if (d) return d; }
  if (has('leurre') && !boardOf(side).decoys.length && !repairTargets(boardOf(side)).length) { const d = aiDecoy(side); if (d) return d; }
  const hunting = !K.openHits.length && !K.detected.length, aim = w => aiAim(w, K);
  let plan = null;
  if (!hunting) {
    if (S.diff !== 'easy' && K.openHits.length && has('salve')) plan = aim('salve');
    if (!plan && S.diff !== 'easy' && has('missiles')) plan = aim('missiles');
  } else {
    // d'abord repérer, puis n'importe quelle arme prête vaut mieux qu'un tir simple
    for (const [w, k] of [['avion', 1], ['projecteur', 1], ['sonar', .8], ['torpille', 1], ['missiles', 1], ['salve', .8]])
      if (!plan && ready(side, w) && rng() < p * k) plan = aim(w);
  }
  if (plan) return plan;
  const [c, r] = aiPick(K);
  return { w: 'tir', c, r, h: true };
}
// le coup de l'IA, avec un tir simple si le pouvoir choisi ne sert à rien
function aiChoose(side) {
  let plan = aiPlan(side);
  if (!POWERS[plan.w].own && plan.w !== 'tir' && !canUse(foeOf(side), plan.w, plan.c, plan.r, plan.h, plan.cells)) {
    const [c, r] = aiPick(aiKnow(side)); plan = { w: 'tir', c, r, h: true };
  }
  return plan;
}

/* =========================================================
   EFFETS
   ========================================================= */
const now = () => performance.now();
const cx = c => c * CS + CS / 2, cy = r => r * CS + CS / 2;
function burst(key, x, y, kind, count) {
  if (S.fast) return;
  const cols = kind === 'boom' ? ['#fff4a0', '#ffd84a', '#ff8a2a', '#ff3b1f', '#c21a0a', '#4a4a55'] : kind === 'bubble' ? ['#d8f0ff', '#9fd3ff', '#ffffff'] : kind === 'fix' ? ['#8ee05a', '#d8ffb0', '#ffffff', '#ffd23f'] : ['#ffffff', '#d8f0ff', '#9fd3ff', '#5aa8f0'];
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU, sp = kind === 'boom' ? 20 + Math.random() * 70 : kind === 'bubble' || kind === 'fix' ? 5 + Math.random() * 15 : 15 + Math.random() * 45;
    S.parts.push({ key, x, y, vx: Math.cos(a) * sp, vy: kind === 'bubble' || kind === 'fix' ? -10 - Math.random() * 20 : kind === 'boom' ? Math.sin(a) * sp : -Math.abs(Math.sin(a)) * sp * 1.6,
      g: kind === 'boom' ? 40 : kind === 'bubble' || kind === 'fix' ? -10 : 160, life: .4 + Math.random() * .5, t: 0, col: cols[vr(cols.length)], sz: Math.random() < .3 ? 2 : 1 });
  }
}
function fx(o) { if (S.fast) return Promise.resolve(); return new Promise(res => { o.t0 = now(); o.done = res; S.fx.push(o); }); }
const shell = (key, c, r) => { SFX.fire(); return fx({ type: 'shell', key, c, r, dur: 520 }); };
const sfx = k => { if (!S.fast) SFX[k](); };

// opts.noMine : tir en retour d'une mine (pas de mines en chaîne) ; opts.clear : le résultat se voit même dans la fumée (torpille)
function resolveShot(key, c, r, opts = {}) {
  const b = S[key], idx = b.grid[r][c], x = cx(c), y = cy(r);
  if (b.shots[r][c]) return { hit: false, again: true };
  const veil = !opts.clear && inSmoke(b, c, r);
  if (veil) b.veil[r][c] = true;
  const boom = n => { burst(key, x, y, 'boom', n); if (!S.fast) { S.fx.push({ type: 'boom', key, x, y, t0: now(), dur: 480 }); S.shake = now(); } sfx('boom'); };
  if (idx < 0) {
    const d = decoyAt(b, c, r);
    if (d) {
      // le leurre : un faux touché ; ses deux cases touchées, il se dégonfle et redevient de l'eau
      b.shots[r][c] = 3; b.intel[r][c] = 2;
      for (const q of b.sonar) if (onLine(q, c, r)) q.n--;
      boom(18);
      const gone = d.cells.every(([xx, yy]) => b.shots[yy][xx] === 3);
      if (gone) { b.decoys.splice(b.decoys.indexOf(d), 1); for (const [xx, yy] of d.cells) { b.shots[yy][xx] = 1; b.intel[yy][xx] = 1; b.veil[yy][xx] = false; } }
      sonarDeduce(b);
      return { hit: false, fake: true, gone, veil: veil && !gone };
    }
    b.shots[r][c] = 1; b.intel[r][c] = 1;
    if (mineAt(b, c, r)) {
      // une mine : elle saute (et riposte, sauf sous un tir en retour)
      b.mines = b.mines.filter(m => m[0] !== c || m[1] !== r); b.veil[r][c] = false;
      boom(22);
      sonarDeduce(b);
      return { hit: false, mine: !opts.noMine };
    }
    burst(key, x, y, 'splash', 18); sfx('splash'); sonarDeduce(b);
    return { hit: false, veil };
  }
  b.shots[r][c] = 2; b.intel[r][c] = 2;
  for (const q of b.sonar) if (onLine(q, c, r)) q.n--;
  sonarDeduce(b);
  const s = b.ships[idx]; s.hits++;
  boom(26);
  if (s.hits >= s.def.len) {
    s.sunk = true; sfx('sunk');
    for (const [cc, rr] of shipCells(s)) b.veil[rr][cc] = false;     // un navire coulé se voit, même dans la fumée
    if (!S.fast) shipCells(s).forEach(([cc, rr], i) => setTimeout(() => { burst(key, cx(cc), cy(rr), 'boom', 14); S.fx.push({ type: 'boom', key, x: cx(cc), y: cy(rr), t0: now(), dur: 480 }); }, 140 * i));
    return { hit: true, sunk: s };
  }
  return { hit: true, veil };
}
// la fumée d'une flotte s'use à chaque coup adverse ; quand elle se dissipe, les tirs qu'elle cachait se voient
function smokeTick(b) {
  if (!b.smoke || --b.smoke.left > 0) return null;
  b.smoke = null; let n = 0;
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b.veil[r][c]) { b.veil[r][c] = false; if (b.shots[r][c] >= 2) n++; }
  return { n };
}

// exécute une action du camp `side` ; renvoie le bilan
async function act(side, plan) {
  const { w, c, r, h } = plan, foe = foeOf(side), key = keyOf(foe);
  const out = { fired: 0, hits: [], fakes: [], veiled: [], mines: [], gone: 0, sunk: [], found: 0, stop: null, count: 0, ship: null };
  const apply = (cc, rr) => {
    const res = resolveShot(key, cc, rr, { noMine: plan.riposte, clear: w === 'torpille' }); if (res.again) return;
    out.fired++; if (res.hit) out.hits.push([cc, rr]); if (res.fake) out.fakes.push([cc, rr]); if (res.veil) out.veiled.push([cc, rr]);
    if (res.gone) out.gone++; if (res.mine) out.mines.push([cc, rr]); if (res.sunk) out.sunk.push(res.sunk);
  };
  const isShip = (x, y) => (foe.grid[y][x] >= 0 && foe.shots[y][x] !== 2) || (!!decoyAt(foe, x, y) && foe.shots[y][x] !== 3);   // un leurre passe pour un navire
  const me = boardOf(side);
  // ce qu'un pouvoir de repérage découvre (les cases déjà visées ne changent pas)
  const spot = cells => { for (const [x, y] of cells) { if (foe.shots[y][x] || inSmoke(foe, x, y)) continue; const ship = foe.grid[y][x] >= 0 || !!decoyAt(foe, x, y); foe.intel[y][x] = ship ? 2 : 1; if (ship) out.found++; } };
  if (w !== 'tir') me.cd[w] = POWERS[w].cd + 1;
  if (w === 'tir') { await shell(key, c, r); apply(c, r); }
  else if (w === 'salve' || w === 'missiles') {
    const cells = (w === 'missiles' ? plan.cells : weaponCells(w, c, r, h)).filter(([x, y]) => !foe.shots[y][x]);
    if (w === 'missiles') sfx('missile');
    await Promise.all(cells.map(([x, y], i) => wait(i * (w === 'missiles' ? 260 : 120)).then(() => w === 'missiles' ? fx({ type: 'missile', key, c: x, r: y, dur: 700 }) : shell(key, x, y)).then(() => apply(x, y))));
  } else if (w === 'avion') {
    const [c0, r0] = zoneOf(c, r);
    sfx('plane');
    await fx({ type: 'plane', key, zx: c0, zy: r0, dur: 2200 });
    spot(weaponCells(w, c, r, h));
    if (!S.fast) S.fx.push({ type: 'scan', key, zx: c0, zy: r0, t0: now(), dur: 1200 });
  } else if (w === 'projecteur') {
    sfx('beam');
    const cells = beamCells(c, r, h);
    await fx({ type: 'beam', key, cells, h, dur: 1300 });
    spot(cells);
    if (!S.fast) S.fx.push({ type: 'lit', key, cells, t0: now(), dur: 1000 });
  } else if (w === 'sonar') {
    sfx('sonar');
    await fx({ type: 'ping', key, h, line: h ? r : c, dur: 1500 });
    const i = h ? r : c, n = lineCells(c, r, h).filter(([x, y]) => isShip(x, y)).length;
    foe.sonar = foe.sonar.filter(q => !(q.h === h && q.i === i));
    foe.sonar.push({ h, i, n });
    out.count = n;
    sonarDeduce(foe);
  } else if (w === 'torpille') {
    let stop = N;
    for (let i = 0; i < N; i++) { const x = h ? i : c, y = h ? r : i; if (isShip(x, y)) { stop = i; break; } }
    sfx('torpedo');
    await fx({ type: 'torp', key, h, line: h ? r : c, stop, dur: 300 + (stop + 1) * 110 });
    for (let i = 0; i < stop; i++) { const x = h ? i : c, y = h ? r : i; if (!foe.shots[y][x]) foe.intel[y][x] = 1; }
    if (stop < N) { const x = h ? stop : c, y = h ? r : stop; out.stop = [x, y]; apply(x, y); } else sfx('splash');
    sonarDeduce(foe);
  } else if (w === 'plongee') {
    const si = shipIdx(me, 'plongee'), s = me.ships[si], k = keyOf(me), old = shipCells(s);
    sfx('dive');
    for (const [x, y] of old) burst(k, cx(x), cy(y), 'bubble', 10);
    await fx({ type: 'dive', key: k, si, from: old.map(a => a.slice()), h: s.h, to: [c, r], dur: 1100 });
    placeShip(me, si, c, r, s.h);
    // ce que l'adversaire savait de ces cases ne vaut plus rien (repérages, lignes sondées)
    const moved = [...old, ...shipCells(s)];
    for (const [x, y] of moved) if (!me.shots[y][x]) me.intel[y][x] = 0;
    me.sonar = me.sonar.filter(q => !moved.some(([x, y]) => onLine(q, x, y)));
    if (side === 'player') for (const [x, y] of shipCells(s)) burst(k, cx(x), cy(y), 'bubble', 8);
  } else if (w === 'reparation') {
    const k = keyOf(me), s = me.ships[me.grid[r][c]];
    sfx('repair');
    await fx({ type: 'repair', key: k, c, r, dur: 1100 });
    me.shots[r][c] = 0; me.intel[r][c] = 0; s.hits--;         // la case retourne dans le brouillard
    for (const q of me.sonar) if (onLine(q, c, r)) q.n++;
    burst(k, cx(c), cy(r), 'fix', 16);
    out.ship = s;
  } else if (w === 'mines') {
    const k = keyOf(me), cells = plan.cells.filter(([x, y]) => freeWater(me, x, y));
    sfx('mine');
    await fx({ type: 'drop', key: k, cells, dur: 900 });
    me.mines.push(...cells.map(a => a.slice()));
    out.count = cells.length;
  } else if (w === 'fumee') {
    const k = keyOf(me), [c0, r0] = zoneOf(c, r);
    sfx('smoke');
    me.smoke = { c0, r0, left: 2 };
    await fx({ type: 'smokeup', key: k, zx: c0, zy: r0, dur: 1000 });
  } else if (w === 'leurre') {
    const k = keyOf(me), cells = decoyCells(c, r, h);
    sfx('decoy');
    await fx({ type: 'inflate', key: k, cells, h, dur: 900 });
    me.decoys.push({ cells, h });
    me.sonar = me.sonar.filter(q => !cells.some(([x, y]) => onLine(q, x, y)));   // les lignes déjà sondées ne comptaient pas le leurre
  }
  return out;
}
// les mines touchées par le camp `side` : un tir en retour du camp d'en face, qui remonte jusqu'à un navire du tireur (touché assuré)
async function ripostes(side, res) {
  const owner = other(side), txt = [], b = boardOf(side);
  for (const m of res.mines) {
    const T = []; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b.grid[r][c] >= 0 && !b.shots[r][c]) T.push([c, r]);
    if (!T.length) break;
    const [c, r] = pick(T);
    if (!S.fast) {
      setMsg(side === 'player' ? `BOUM ! Une mine ennemie en ${cellName(...m)} ! Elle riposte sur notre flotte...` : `L'ennemi saute sur notre mine en ${cellName(...m)} ! Tir en retour...`);
      await wait(1100); setView(side === 'player' ? 'player' : 'enemy');
    }
    const rr = await act(owner, { w: 'tir', c, r, h: true, riposte: true });
    if (owner === 'player') { S.stats.shots += rr.fired; S.stats.hits += rr.hits.length; } else { S.stats.aiShots += rr.fired; S.stats.aiHits += rr.hits.length; }
    txt.push(`${side === 'player' ? 'Mine ennemie' : 'Notre mine'} en ${cellName(...m)} : tir en retour en ${cellName(c, r)}, ${shotWord(owner, rr)}`);
    if (!S.fast) { setMsg(txt[txt.length - 1]); await wait(1200); }
  }
  return txt.join(' ');
}
// le résultat d'un tir simple, vu par le joueur (la fumée ennemie lui cache le sien ; il connaît son leurre)
function shotWord(side, res) {
  const sunk = res.sunk.length ? ' ' + res.sunk.map(s => side === 'ai' ? `Notre ${s.def.name.toLowerCase()} est coulé !` : `${s.def.name} ennemi coulé !`).join(' ') : '';
  if (side === 'player') return res.veiled.length ? 'perdu dans la fumée.' : res.hits.length || res.fakes.length ? 'touché !' + sunk + (res.gone ? " C'était un leurre !" : '') : "à l'eau.";
  return res.hits.length ? 'touché !' + sunk : res.fakes.length ? 'dans notre leurre !' : "à l'eau.";
}
function describe(side, w, c, r, h, res) {
  const ai = side === 'ai', nm = cellName(c, r);
  // le joueur ne voit pas les résultats cachés par la fumée ennemie, et prend un leurre pour un navire ; il connaît les siens
  const hidden = ([x, y]) => res.veiled.some(v => v[0] === x && v[1] === y);
  const n = ai ? res.hits.length : [...res.hits, ...res.fakes].filter(q => !hidden(q)).length, nv = ai ? 0 : res.veiled.length;
  const sunk = res.sunk.map(s => ai ? `Notre ${s.def.name.toLowerCase()} est coulé !` : `${s.def.name} ennemi coulé !`).join(' ');
  const tail = (sunk ? ' ' + sunk : '') + (nv && w !== 'tir' ? ` ${nv} dans la fumée.` : '') + (res.gone ? (ai ? ' Notre leurre est crevé.' : " C'était un leurre !") : '')
    + (ai && res.fakes.length && !res.gone ? ' Le leurre a pris un coup !' : '');
  const lbl = h ? `ligne ${r + 1}` : `colonne ${COLS[c]}`;
  switch (w) {
    case 'tir':
      if (ai) return res.sunk.length ? `Tir ennemi en ${nm}. ${sunk}` : n ? `Tir ennemi en ${nm} : touchés !` : res.fakes.length ? `Tir ennemi en ${nm} : en plein dans notre leurre !${res.gone ? ' Il est crevé.' : ''}` : `Tir ennemi en ${nm} : raté !`;
      if (res.mines.length) return `${nm} : une mine !`;
      if (nv) return `${nm} : dans la fumée... impossible de voir !`;
      return res.sunk.length ? `${nm} : touché... coulé ! ${sunk}` : res.gone ? `${nm} : touché... c'était un leurre !` : n ? `${nm} : touché !` : `${nm} : plouf, à l'eau.`;
    case 'salve': return `${ai ? 'Salve ennemie' : 'Salve'} sur ${nm} : ${n ? n + ' impact' + (n > 1 ? 's' : '') + ' !' : 'rien.'}${tail}`;
    case 'missiles': return `${ai ? 'Missiles ennemis' : 'Missiles'} : ${n ? n + ' touché' + (n > 1 ? 's' : '') + ' sur ' + res.fired + ' !' : 'tous à l\'eau.'}${tail}`;
    case 'avion':
      if (ai) return res.found ? `L'avion ennemi a repéré ${res.found} case${res.found > 1 ? 's' : ''} de notre flotte !` : "L'avion ennemi n'a rien vu.";
      return res.found ? `L'avion a repéré ${res.found} case${res.found > 1 ? 's' : ''} ennemie${res.found > 1 ? 's' : ''} !` : "L'avion n'a vu que de l'eau.";
    case 'projecteur':
      if (ai) return res.found ? `Le projecteur ennemi a repéré ${res.found} case${res.found > 1 ? 's' : ''} de notre flotte !` : "Le projecteur ennemi n'a éclairé que de l'eau.";
      return res.found ? `Le projecteur éclaire ${res.found} case${res.found > 1 ? 's' : ''} ennemie${res.found > 1 ? 's' : ''} !` : "Le projecteur n'éclaire que de l'eau.";
    case 'sonar': {
      const k = res.count;
      if (ai) return `Le sonar ennemi sonde notre ${lbl} : ${k ? k + ' case' + (k > 1 ? 's' : '') + ' de navire' : 'rien'}.`;
      return k ? `Sonar ${lbl} : ${k} case${k > 1 ? 's' : ''} de navire cachée${k > 1 ? 's' : ''} !` : `Sonar ${lbl} : aucun navire, que de l'eau.`;
    }
    case 'torpille':
      return res.stop ? `${ai ? 'Torpille ennemie' : 'Torpille'} ${lbl} : impact en ${cellName(...res.stop)} !${tail}` : `${ai ? 'Torpille ennemie' : 'Torpille'} ${lbl} : perdue au large.`;
    case 'plongee': return ai ? "Le sous-marin ennemi a plongé ! Il n'est plus là où on l'avait vu." : 'Le sous-marin a plongé et refait surface plus loin !';
    case 'reparation': return ai ? `L'ennemi répare son ${res.ship.def.name.toLowerCase()} en ${nm} !` : `${res.ship.def.le} est réparé en ${nm} !`;
    case 'mines': return ai ? "L'ennemi a mouillé des mines dans ses eaux : gare aux tirs en retour !" : `${res.count} mine${res.count > 1 ? 's' : ''} dans nos eaux : l'ennemi qui tire dessus prendra un tir en retour.`;
    case 'fumee': return ai ? "L'ennemi s'abrite derrière un écran de fumée !" : "Écran de fumée : pendant 2 tours, l'ennemi ne saura pas ce qu'il touche dedans.";
    case 'leurre': return ai ? "L'ennemi met quelque chose à l'eau... un leurre ? Méfiance !" : 'Le leurre est à l\'eau : pour l\'ennemi, c\'est un navire !';
  }
  return '';
}

/* =========================================================
   DÉROULEMENT
   ========================================================= */
function setMsg(t) { S.msg = t; S.msgT0 = now(); }
function setView(v) { if (S.view === v) return; S.prevView = S.view; S.view = v; S.viewT0 = now(); }
function tickCd(side) {
  const b = boardOf(side);
  for (const p of Object.keys(b.cd)) if (b.cd[p] > 0) { b.cd[p]--; if (!b.cd[p] && side === 'player' && ready('player', p)) S.newReady = p; }
}
// la flotte ennemie : la classique en MOUSSE, tirée dans le catalogue (navires programmés) en CAPITAINE et AMIRAL
function enemyFleet() {
  if (S.diff === 'easy') return CLASSIC.slice();
  const out = [];
  for (const len of SLOTS) out.push(pick(Object.values(SHIPS).filter(d => d.ok && d.len === len && !out.includes(d.id))).id);
  return out;
}
// bataille du jour : flottes des deux camps, placement ennemi et hasard de l'IA tirés de la date ; niveau CAPITAINE
// amiral.daily {AAAAMMJJ: tours}, amiral.dailyTry = jour de la tentative classée (comptée dès le COMBAT !)
const todayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
function dailyOf(d) {
  const r = seeded(Math.imul(d, 2654435761) ^ 0x5eed);
  const fleet = () => { const out = []; for (const len of SLOTS) { const c = CATALOG.filter(x => x.len === len && !out.includes(x.id)); out.push(c[Math.floor(r() * c.length)].id); } return out; };
  return { d, fleet: fleet(), foe: fleet(), seed: Math.floor(r() * 4294967296) };
}
// on quitte la bataille du jour : le niveau choisi et le hasard ordinaire reviennent
function endDaily() {
  if (!S.daily) return;
  S.daily = null; rng = Math.random;
  const d = store.get('diff', 'normal'); S.diff = DIFFS.some(x => x[0] === d) ? d : 'normal';
}
function goTitle() { endDaily(); S.phase = 'title'; MUSIC.stop(); S.fx = []; S.parts = []; }
function newGame(daily = null) {
  endDaily();
  if (daily) { S.daily = Object.assign(dailyOf(daily), { ranked: store.get('dailyTry', 0) !== daily }); S.diff = 'normal'; rng = seeded(S.daily.seed); }
  const D = S.daily;
  S.player = makeBoard(D ? D.fleet : YARD.fleet); S.enemy = makeBoard(D ? D.foe : enemyFleet());
  if (D) randomFleet(S.enemy);                 // la flotte ennemie du jour est placée tout de suite, avec le hasard du jour
  randomFleet(S.player, Math.random);
  S.phase = 'place'; S.sel = null; S.busy = false; S.turn = 'player'; S.view = 'player'; S.prevView = null;
  S.stats = { turns: 0, shots: 0, hits: 0, aiShots: 0, aiHits: 0 };
  S.fx = []; S.parts = []; S.endInfo = null; S.rankText = ''; resetAim(); S.peek = false; S.quitArm = 0;
  setMsg('Placez votre flotte : touchez un navire, puis une case. Touchez-le encore pour le pivoter.');
  MUSIC.start();
}
function startBattle() {
  if (!S.daily) randomFleet(S.enemy);
  else if (S.daily.ranked) store.set('dailyTry', S.daily.d);   // la tentative du jour compte dès le départ
  S.phase = 'play'; S.turn = 'player'; S.busy = false; S.sel = null; S.peek = false;
  setView('enemy'); SFX.start();
  setMsg('Ennemi en vue ! Choisissez un tir ou un pouvoir, puis visez les eaux ennemies.');
}
function resetAim() { S.weapon = 'tir'; S.aim = null; S.armed = null; S.marks = []; S.dir = true; }
const LAUNCH = {
  tir: p => `Feu en ${cellName(p.c, p.r)} !`, salve: p => `Salve en croix sur ${cellName(p.c, p.r)} !`, avion: () => "L'avion de reconnaissance décolle...",
  torpille: p => `Torpille lancée ${p.h ? 'ligne ' + (p.r + 1) : 'colonne ' + COLS[p.c]} !`, plongee: () => 'Plongée !',
  missiles: () => 'Trois missiles à la mer !', sonar: p => `Le sonar écoute la ${p.h ? 'ligne ' + (p.r + 1) : 'colonne ' + COLS[p.c]}...`,
  projecteur: () => 'Le projecteur balaie les eaux ennemies...', reparation: p => `Les mécaniciens réparent la case ${cellName(p.c, p.r)}...`,
  mines: () => 'Le mouilleur largue ses mines...', fumee: () => 'Le brouilleur crache sa fumée...', leurre: () => 'La vedette gonfle son leurre...',
};
const AI_LAUNCH = {
  tir: p => `L'ennemi fait feu en ${cellName(p.c, p.r)}...`, salve: () => "L'ennemi déclenche une salve en croix !", avion: () => 'Un avion ennemi survole notre flotte !',
  torpille: () => "Alerte ! L'ennemi lance une torpille !", plongee: () => "L'ennemi manoeuvre...", missiles: () => "Alerte ! Trois missiles ennemis en approche !",
  sonar: () => "Un sonar ennemi nous écoute...", projecteur: () => 'Un projecteur ennemi balaie notre flotte !', reparation: () => "L'ennemi s'affaire sur un navire touché...",
  mines: () => "L'ennemi manoeuvre...", fumee: () => "De la fumée monte des eaux ennemies !", leurre: () => "L'ennemi manoeuvre...",
};
async function playerAct(plan) {
  if (S.phase !== 'play' || S.busy || S.turn !== 'player') return;
  const { w, c, r, h } = plan;
  if (!ready('player', w)) { SFX.error(); return; }
  if (!POWERS[w].own && !canUse(S.enemy, w, c, r, h, plan.cells)) { SFX.error(); setMsg(w === 'tir' ? 'Cette case a déjà été visée.' : 'Rien à découvrir ici : visez ailleurs.'); return; }
  if ((w === 'leurre' && !decoyFits(S.player, c, r, h)) || (w === 'mines' && !(plan.cells || []).length)) { SFX.error(); return; }
  S.busy = true; S.stats.turns++; S.aim = null; S.armed = null; S.marks = [];
  setMsg(LAUNCH[w](plan));
  const res = await act('player', plan);
  S.stats.shots += res.fired; S.stats.hits += res.hits.length;
  S.weapon = 'tir';
  let txt = describe('player', w, c, r, h, res);
  setMsg(txt);
  if (allSunk(S.enemy)) return gameOver(true);
  if (res.mines.length) {
    await wait(1100);
    txt = await ripostes('player', res);
    if (allSunk(S.player)) { setMsg(txt + ' Notre flotte est anéantie !'); return gameOver(false); }
  }
  const sm = smokeTick(S.enemy);
  if (sm) setMsg(txt + (sm.n ? ` La fumée ennemie se dissipe : ${sm.n} touché${sm.n > 1 ? 's' : ''} !` : ' La fumée ennemie se dissipe.'));
  S.turn = 'ai';
  await wait(res.sunk.length ? 1700 : w === 'tir' && !sm ? 1000 : 1300);
  aiTurn();
}
async function aiTurn() {
  if (S.phase !== 'play') return;
  tickCd('ai');
  const plan = aiChoose('ai'), { w, c, r, h } = plan;
  if (!POWERS[w].own) setView('player');
  setMsg(AI_LAUNCH[w](plan));
  await wait(w === 'tir' ? 700 : 1000);
  const res = await act('ai', plan);
  S.stats.aiShots += res.fired; S.stats.aiHits += res.hits.length;
  let txt = describe('ai', w, c, r, h, res);
  if (allSunk(S.player)) { setMsg(txt + ' Notre flotte est anéantie !'); return gameOver(false); }
  setMsg(txt);
  if (res.mines.length) {
    await wait(1100);
    txt = await ripostes('ai', res);
    if (allSunk(S.enemy)) return gameOver(true);
  }
  const sm = smokeTick(S.player);
  if (sm) { txt += ' Notre fumée se dissipe.'; setMsg(txt); }
  await wait(res.sunk.length ? 1600 : 1100);
  if (S.phase !== 'play') return;
  tickCd('player');
  S.turn = 'player'; S.busy = false; resetAim(); setView('enemy');
  if (S.newReady) { setMsg(`${txt} ${POWERS[S.newReady].name} est de nouveau prêt !`); SFX.ready(); S.newReady = null; }
  else setMsg(txt + ' A vous !');
}
function gameOver(win) {
  S.phase = 'over'; S.busy = true; MUSIC.stop();
  let fresh = [];
  if (win) {
    // palmarès : les déblocages du chantier naval ; un nouveau navire est annoncé à la fin
    const pm = store.get('palmares', {}) || {}, before = CATALOG.filter(d => unlocked(d.id, pm)).map(d => d.id);
    pm.victoires = (pm.victoires || 0) + 1; pm[S.diff] = (pm[S.diff] || 0) + 1;
    if (S.stats.turns < 20) pm.rapide = true;
    if (S.player.ships.every(s => !s.sunk)) pm.intacte = true;
    store.set('palmares', pm);
    fresh = CATALOG.filter(d => unlocked(d.id, pm) && !before.includes(d.id));
  }
  setTimeout(() => {
    win ? SFX.win() : SFX.lose();
    const st = S.stats, best = store.get('best', {}) || {}, D = S.daily, dd = store.get('daily', {}) || {};
    let rec = false;
    if (D) { if (win && D.ranked) { rec = !dd[D.d] || st.turns < dd[D.d]; if (rec) { dd[D.d] = st.turns; store.set('daily', dd); } } }
    else if (win) { rec = !best[S.diff] || st.turns < best[S.diff]; if (rec) { best[S.diff] = st.turns; store.set('best', best); } }
    S.endInfo = { win, rec, best: (D ? dd[D.d] : best[S.diff]) || 0, fresh };
    if (!win) setView('enemy');
    S.rankText = rec ? (D ? 'BATAILLE DU JOUR CLASSEE !' : 'NOUVEAU RECORD !') : D && !D.ranked ? 'HORS CLASSEMENT (DEJA TENTEE)' : '';
    if (win && rec && window.LudoScores) LudoScores.submit('amiral', D ? 'daily:' + D.d : 'best:' + S.diff, st.turns, true).then(r => {
      if (r && S.phase === 'over') S.rankText = `RECORD ! ${LudoScores.rankText(r).toUpperCase()}`; });
    S.endT0 = now();
  }, 1500);
}
// partie simulée IA contre IA, sans animation (tests et réglages : Amiral.simulate)
async function simulate(fleetA, fleetB, diff = 'hard') {
  const keep = { diff: S.diff, phase: S.phase, player: S.player, enemy: S.enemy };
  S.fast = true; S.diff = diff;
  S.player = makeBoard(fleetA); S.enemy = makeBoard(fleetB); randomFleet(S.player); randomFleet(S.enemy);
  const used = {}; let side = 'player', turns = 0, winner = null;
  try {
    while (turns < 400) {
      tickCd(side); S.newReady = null;
      const plan = aiChoose(side); used[plan.w] = (used[plan.w] || 0) + 1;
      const res = await act(side, plan);
      if (side === 'player') turns++;
      if (allSunk(foeOf(side))) { winner = side; break; }
      if (res.mines.length) { used.riposte = (used.riposte || 0) + res.mines.length; await ripostes(side, res); if (allSunk(boardOf(side))) { winner = other(side); break; } }
      smokeTick(foeOf(side));
      side = other(side);
    }
  } finally { Object.assign(S, keep); S.fast = false; }
  return { winner, turns, used };
}

/* =========================================================
   DESSIN
   ========================================================= */
// on dessine directement à la résolution de l'écran (×K entier) : pixels nets et texte lisible
const cv = $('#cv'), g = cv.getContext('2d');
let T = 0, K = 2;

function ring(g, x, y, r, col) { const n = Math.max(10, Math.round(r * 6)); for (let k = 0; k < n; k++) { const a = k / n * TAU; R(g, Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1, col); } }
function missMark(g, x, y, t, ph) {
  const q = ((t / 2.4) + ph) % 1;
  g.globalAlpha = 1 - q; ring(g, x, y + 1, 4 + q * 6, '#d8f0ff'); g.globalAlpha = 1;
  R(g, x - 3, y - 2, 6, 6, OUT); R(g, x - 2, y - 3, 4, 8, OUT); R(g, x - 4, y - 1, 8, 4, OUT);
  R(g, x - 3, y - 1, 6, 4, '#d3dce8'); R(g, x - 2, y - 2, 4, 6, '#d3dce8');
  R(g, x - 2, y - 2, 3, 3, '#ffffff'); R(g, x + 1, y + 2, 2, 1, '#a8b4c4');
}
function flames(g, x, y, t, k, big) {
  const s = big ? 1.25 : 1, f = Math.floor(t * 10 + k * 3);
  const tongues = [[-3, 6 + (f % 3)], [0, 9 + ((f + 1) % 3) * 1.5], [3, 6 + ((f + 2) % 2) * 2]];
  for (const pass of [0, 1]) for (const [dx, h0] of tongues) {
    const h = Math.round(h0 * s), bx = x + Math.round(dx * s);
    for (let i = 0; i < h; i++) {
      const w = Math.max(1, Math.round((1 - i / h) * 3.4 * s)), sway = Math.round(Math.sin(t * TAU * 1.5 + i * .6 + dx) * (i / h) * 1.4);
      const yy = y - i, xx = bx - (w >> 1) + sway;
      if (pass === 0) R(g, xx - 1, yy - 1, w + 2, 3, OUT);
      else { const u = i / h; R(g, xx, yy, w, 1, u < .3 ? '#ff6a3c' : u < .6 ? '#ff9a3c' : u < .85 ? '#ffd23f' : '#fff6c2'); if (w > 2 && u < .5) R(g, xx + 1, yy, w - 2, 1, '#ffd23f'); }
    }
  }
}
function smoke(g, x, y, t, k, amt = 1) {
  for (let i = 0; i < 4; i++) {
    const p = (t / 3 + i / 4 + k * .13) % 1, sz = Math.min(5, Math.floor(p * 6));
    const px = x + p * 14 + Math.sin(p * 5 + k + i) * 3, py = y - 4 - p * 30;
    g.globalAlpha = amt * (p < .7 ? .9 : (1 - p) / .3 * .9);
    g.drawImage(G.puff[sz], Math.round(px - 10), Math.round(py - 10));
  }
  g.globalAlpha = 1;
}
function corners(g, x, y, w, h, col) {
  for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const ex = x + sx * (w - 4), ey = y + sy * (h - 4);
    R(g, ex + (sx ? 1 : 0), ey + (sy ? 3 : 0), 3, 1, col); R(g, ex + (sx ? 3 : 0), ey + (sy ? 1 : 0), 1, 3, col);
  }
}
function shipImg(s, kind) { return G.ship[s.def.id][s.h ? 'h' : 'v'][kind]; }

// dessine une grille entière ; `main` : grande vue (effets, visée), sinon miniature
function drawBoard(g, key, ox, oy, t, main) {
  const b = S[key], mine = key === 'player', reveal = S.phase === 'over' || S.phase === 'place';
  g.save(); g.translate(ox, oy);
  g.beginPath(); g.rect(0, 0, BS, BS); g.clip();
  // la mer
  const wx = Math.floor((t * 4) % 96), wy = Math.floor((t * 2.4) % 96);
  g.drawImage(G.sea, -96 + wx, -96 + wy);
  g.globalAlpha = .65; g.drawImage(G.glint, -Math.floor((t * 9) % 96), -Math.floor((t * 3) % 96)); g.globalAlpha = 1;
  for (const s of G.spark) { const ph = (t * s.sp + s.ph) % 1; if (ph > .3) continue;
    if (ph < .08 || ph > .22) R(g, s.x, s.y, 1, 1, '#cfe9ff'); else { R(g, s.x - 1, s.y, 3, 1, '#ffffff'); R(g, s.x, s.y - 1, 1, 3, '#ffffff'); } }
  // navires
  const bob = Math.round(Math.sin(t * 2) * .6);
  b.ships.forEach((s, i) => {
    if (!s.placed) return;
    const show = mine || s.sunk || reveal;
    if (!show) return;
    const x = s.c * CS, y = s.r * CS, diving = S.fx.find(f => f.type === 'dive' && f.key === key && f.si === i);
    if (diving) return;
    if (s.sunk && !mine) { g.drawImage(shipImg(s, 'wreck'), x, y); return; }
    g.drawImage(shipImg(s, 'sh'), x + 2, y + 3);
    if (!s.sunk) g.drawImage(shipImg(s, 'foam')[Math.floor(t * 5 + i) % 4], x - 3, y - 3);
    g.drawImage(shipImg(s, 'img'), x, y + (s.sunk ? 0 : (s.h ? bob : 0)));
    if (s.sunk) g.drawImage(shipImg(s, 'dead'), x, y);
    if (!mine && reveal && !s.sunk) { g.globalAlpha = .25 + .15 * Math.sin(t * 4); g.drawImage(shipImg(s, 'spot'), x, y); g.globalAlpha = 1; }
    if (mine && S.phase === 'place' && S.sel === i) {
      const w = s.h ? s.def.len * CS : CS, h = s.h ? CS : s.def.len * CS;
      corners(g, x + 1, y + 1, w - 1, h - 1, Math.floor(t * 4) % 2 ? '#ffd23f' : '#fff6c2');
    }
    // radar du porte-avions
    if (s.def.id === 'carrier' && !s.sunk) { const [rx0, ry0] = G.radar, rx = s.h ? x + rx0 : x + CS - 1 - ry0, ry = s.h ? y + ry0 : y + rx0, f = Math.floor(t * 6) % 4, d = [[-2, 0], [-1, -1], [0, -2], [1, -1]][f];
      R(g, rx - 1, ry - 1, 3, 3, OUT); R(g, rx + d[0] - 1, ry + d[1] - 1, 1, 1, '#e4e8ee'); R(g, rx - d[0], ry - d[1], 1, 1, '#e4e8ee'); R(g, rx, ry, 1, 1, '#ffd23f'); }
  });
  // leurres et mines : visibles par leur propriétaire (et par tous à la fin)
  if (mine || reveal) {
    for (const d of b.decoys) { const [x0, y0] = d.cells[0]; g.globalAlpha = .85; g.drawImage(G.decoy[d.h ? 'h' : 'v'], x0 * CS, y0 * CS + (d.h ? bob : 0)); g.globalAlpha = 1; }
    for (const [c, r] of b.mines) { const k = Math.floor(t * 2 + c + r) % 2; g.drawImage(G.icon.mines, c * CS + 3, r * CS + 3 + k); }
  }
  // brouillard de guerre sur les cases ennemies inconnues
  if (!mine && !reveal) {
    const mg = G.fogMaskG; mg.clearRect(0, 0, BS, BS);
    const fog = (c, r) => !b.shots[r][c] && !b.intel[r][c];
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fog(c, r)) R(mg, c * CS + 1, r * CS + 1, CS - 1, CS - 1, '#000');
    const fg = G.fogG, fox = 100 + Math.round(12 * Math.sin(t * .4)), foy = 100 + Math.round(9 * Math.cos(t * .33));
    fg.globalCompositeOperation = 'source-over'; fg.clearRect(0, 0, BS, BS); fg.drawImage(G.fogTex, -fox, -foy);
    fg.globalAlpha = .55; fg.drawImage(G.fogCloud, -Math.floor((t * 6) % BS), 0); fg.globalAlpha = 1;
    fg.globalCompositeOperation = 'destination-in'; fg.drawImage(G.fogMask, 0, 0); fg.globalCompositeOperation = 'source-over';
    g.drawImage(G.fogBuf, 0, 0);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fog(c, r)) g.drawImage(G.bevel, c * CS, r * CS);
  }
  // renseignements : cases repérées (navire) par l'avion
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    if (b.shots[r][c] || b.intel[r][c] !== 2) continue;
    const x = c * CS, y = r * CS;
    if (mine) { if (Math.floor(t * 2.5) % 2) corners(g, x + 2, y + 2, CS - 3, CS - 3, '#ff5a46'); continue; }
    g.fillStyle = `rgba(255,70,40,${.22 + .12 * Math.sin(t * 5 + c + r)})`; g.fillRect(x + 1, y + 1, CS - 1, CS - 1);
    corners(g, x + 2, y + 2, CS - 3, CS - 3, '#ff5a46');
    text(g, '!', x + CS / 2, y + 7 + (Math.floor(t * 3) % 2), '#ffd23f', 'center');
  }
  // tirs : à l'eau, touchés
  const veiled = (c, r) => !mine && !reveal && b.veil[r][c];      // dans la fumée ennemie : on ne sait pas
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const v = b.shots[r][c]; if (!v || veiled(c, r)) continue;
    if (v === 1) missMark(g, cx(c), cy(r), t, c * .21 + r * .33);
  }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const v = b.shots[r][c]; if ((v !== 2 && v !== 3) || veiled(c, r)) continue;
    const s = v === 2 ? b.ships[b.grid[r][c]] : null, x = c * CS, y = r * CS;
    if (!s || !s.sunk) {
      g.fillStyle = `rgba(255,70,40,${.16 + .08 * Math.sin(t * TAU + c)})`; g.fillRect(x + 1, y + 1, CS - 1, CS - 1);
      flames(g, cx(c), cy(r) + 4, t, c + r * 3, !mine);
      if (main) smoke(g, cx(c), cy(r) - 2, t, c * 3 + r, .8);
    } else if (main && (c + r) % 2 === 0) smoke(g, cx(c), cy(r), t, c * 3 + r, .45);
  }
  // écran de fumée : un nuage qui roule sur la zone ; les tirs qu'il cache sont des points d'interrogation
  if (b.smoke) {
    const { c0, r0 } = b.smoke, x0 = c0 * CS, y0 = r0 * CS, S3 = 3 * CS;
    g.fillStyle = mine ? 'rgba(150,146,160,.22)' : 'rgba(150,146,160,.5)'; g.fillRect(x0 + 1, y0 + 1, S3 - 1, S3 - 1);
    for (let k = 0; k < 9; k++) {
      const ph = (t * .25 + k * .37) % 1, px = x0 + (k % 3) * CS + 13 + Math.sin(t * .8 + k) * 5, py = y0 + Math.floor(k / 3) * CS + 13 + Math.cos(t * .6 + k * 2) * 4;
      g.globalAlpha = (mine ? .35 : .75) * (ph < .8 ? 1 : (1 - ph) * 5); g.drawImage(G.puff[5], Math.round(px - 10), Math.round(py - 10));
    }
    g.globalAlpha = 1;
  }
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (b.shots[r][c] && veiled(c, r)) {
    R(g, c * CS + 8, r * CS + 6, 10, 14, 'rgba(20,18,30,.55)');
    text(g, '?', cx(c), r * CS + 7 + (Math.floor(t * 2 + c) % 2), '#fff6c2', 'center', 8);
  }
  // lignes sondées : cases de navire encore cachées (badge au bout de la ligne)
  for (const q of b.sonar) {
    const bx = q.h ? 1 : q.i * CS + 14, by = q.h ? q.i * CS + 14 : 1;
    if (main) { g.fillStyle = 'rgba(120,240,255,.10)'; if (q.h) g.fillRect(0, q.i * CS + 1, BS, CS - 1); else g.fillRect(q.i * CS + 1, 0, CS - 1, BS); }
    R(g, bx, by, 12, 12, OUT); R(g, bx + 1, by + 1, 10, 10, q.n ? '#1a6a8a' : '#36404e'); R(g, bx + 1, by + 1, 10, 1, '#9ff0ff');
    g.font = FONT_TINY; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillStyle = q.n ? '#ffffff' : '#9aa3b1'; g.fillText(String(q.n), bx + 6, by);
  }
  if (main) drawAim(g, key, t);
  // effets en cours
  if (main) for (const f of S.fx) if (f.key === key) drawFx(g, f, t);
  for (const p of S.parts) if (p.key === key && main) R(g, Math.round(p.x), Math.round(p.y), p.sz, p.sz, p.col);
  g.restore();
  g.drawImage(mine ? G.frameMine : G.frameFoe, ox - 12, oy - 12);
  if (main) for (let k = 0; k < N; k++) {
    tiny(g, COLS[k], ox + k * CS + 12, oy - 10, mine ? '#cfe6ff' : '#ffd6cc');
    tiny(g, String(k + 1), ox - 10, oy + k * CS + 11, mine ? '#cfe6ff' : '#ffd6cc');
  }
}
// visée : aperçu des cases que l'arme choisie va toucher
function drawAim(g, key, t) {
  if (S.phase !== 'play' || S.turn !== 'player' || S.busy) return;
  const w = S.weapon;
  if (POWERS[w].own) {                       // plongée, réparation, mines, fumée, leurre : on vise sa propre flotte
    if (key !== 'player') return;
    const blink = Math.floor(t * 6) % 2 ? '#ffffff' : '#8ee05a';
    if (w === 'mines') {
      S.marks.forEach(([c, r], k) => { g.fillStyle = `rgba(255,120,60,${.22 + .1 * Math.sin(t * 8 + k)})`; g.fillRect(c * CS + 1, r * CS + 1, CS - 1, CS - 1);
        g.drawImage(G.icon.mines, c * CS + 3, r * CS + 3); corners(g, c * CS + 1, r * CS + 1, CS - 1, CS - 1, blink); });
      if (S.aim && freeWater(S.player, S.aim.c, S.aim.r)) corners(g, S.aim.c * CS + 1, S.aim.r * CS + 1, CS - 1, CS - 1, '#ffd23f');
      return;
    }
    if (w === 'fumee') {
      if (!S.aim) return;
      for (const [x, y] of weaponCells('avion', S.aim.c, S.aim.r)) { g.fillStyle = `rgba(190,186,200,${(S.armed ? .4 : .25) + .1 * Math.sin(t * 6)})`; g.fillRect(x * CS + 1, y * CS + 1, CS - 1, CS - 1); }
      corners(g, S.aim.c * CS + 1, S.aim.r * CS + 1, CS - 1, CS - 1, blink);
      return;
    }
    if (w === 'leurre') {
      if (!S.armed) return;
      const { c, r } = S.armed, h = S.dir;
      g.globalAlpha = .55 + .2 * Math.sin(t * 6); g.drawImage(G.decoy[h ? 'h' : 'v'], c * CS, r * CS); g.globalAlpha = 1;
      corners(g, c * CS + 1, r * CS + 1, (h ? 2 * CS : CS) - 1, (h ? CS : 2 * CS) - 1, blink);
      return;
    }
    const T2 = ownTargets(S.player, w), col = '#8ee05a';
    for (const [c, r] of T2) { const x = c * CS, y = r * CS, on = Math.floor(t * 3 + c + r) % 2;
      if (w === 'plongee') { R(g, x + 11, y + 11, 4, 4, OUT); R(g, x + 12, y + 12, 2, 2, on ? col : '#d8ffb0'); }
      else { R(g, x + 8, y + 11, 10, 4, OUT); R(g, x + 11, y + 8, 4, 10, OUT); R(g, x + 9, y + 12, 8, 2, on ? col : '#d8ffb0'); R(g, x + 12, y + 9, 2, 8, on ? col : '#d8ffb0'); } }
    if (S.aim && T2.some(([c, r]) => c === S.aim.c && r === S.aim.r)) {
      if (w === 'plongee') {
        const s = shipOf(S.player, 'plongee');
        g.globalAlpha = .55 + .2 * Math.sin(t * 6); g.drawImage(shipImg(s, 'img'), S.aim.c * CS, S.aim.r * CS); g.globalAlpha = 1;
        const w2 = s.h ? 3 * CS : CS, h2 = s.h ? CS : 3 * CS; corners(g, S.aim.c * CS + 1, S.aim.r * CS + 1, w2 - 1, h2 - 1, col);
      } else corners(g, S.aim.c * CS + 1, S.aim.r * CS + 1, CS - 1, CS - 1, Math.floor(t * 6) % 2 ? '#ffffff' : col);
    }
    return;
  }
  if (key !== 'enemy') return;
  if (w === 'missiles') {                    // les cibles choisies, numérotées
    S.marks.forEach(([c, r], k) => {
      const x = c * CS, y = r * CS;
      g.fillStyle = `rgba(255,120,60,${.26 + .1 * Math.sin(t * 8 + k)})`; g.fillRect(x + 1, y + 1, CS - 1, CS - 1);
      corners(g, x + 1, y + 1, CS - 1, CS - 1, Math.floor(t * 6) % 2 ? '#ffffff' : '#ff8a5a');
      text(g, String(k + 1), x + CS / 2, y + 8, '#ffffff', 'center');
    });
    if (S.aim && !S.marks.some(([c, r]) => c === S.aim.c && r === S.aim.r)) corners(g, S.aim.c * CS + 1, S.aim.r * CS + 1, CS - 1, CS - 1, '#ffd23f');
    return;
  }
  if (!S.aim) return;
  const { c, r } = S.aim, both = POWERS[w].dir && S.dir == null;
  const cells = both ? [...weaponCells(w, c, r, true), ...weaponCells(w, c, r, false)] : weaponCells(w, c, r, S.dir), armed = S.armed && S.armed.c === c && S.armed.r === r;
  const col = w === 'avion' ? '90,230,255' : w === 'sonar' ? '120,240,255' : w === 'projecteur' ? '255,246,170' : '255,214,63';
  for (const [x, y] of cells) {
    g.fillStyle = `rgba(${col},${(armed ? .32 : .18) + .1 * Math.sin(t * 8)})`; g.fillRect(x * CS + 1, y * CS + 1, CS - 1, CS - 1);
  }
  const x = c * CS, y = r * CS;
  corners(g, x + 1, y + 1, CS - 1, CS - 1, Math.floor(t * 6) % 2 ? '#ffffff' : '#ffd23f');
  if (armed && !POWERS[w].dir) { R(g, x + 8, y + 12, 10, 2, '#ffffff'); R(g, x + 12, y + 8, 2, 10, '#ffffff'); }
}
function drawFx(g, f, t) {
  const u = clamp((now() - f.t0) / f.dur, 0, 1);
  if (f.type === 'shell') {
    const x = cx(f.c), y = cy(f.r), h = (1 - u) * 70, s = Math.max(1, Math.round(3 - u * 1.5));
    g.fillStyle = 'rgba(4,16,44,.4)'; g.fillRect(x - s, y - 1, s * 2, 2);
    R(g, x - s - 1, Math.round(y - h) - s - 1, s * 2 + 2, s * 2 + 2, OUT); R(g, x - s, Math.round(y - h) - s, s * 2, s * 2, '#5e6878'); R(g, x - s, Math.round(y - h) - s, 1, 1, '#e4e8ee');
  } else if (f.type === 'boom') {
    const k = Math.min(7, Math.floor(u * 8)); g.drawImage(G.boom[k], Math.round(f.x - 20), Math.round(f.y - 24));
  } else if (f.type === 'plane') {
    // entre par le bas à gauche, tourne au-dessus de la zone, repart en haut à droite
    const zx = (f.zx + 1.5) * CS, zy = (f.zy + 1.5) * CS;
    let px, py, a;
    if (u < .3) { const q = ease(u / .3); px = -30 + (zx - 34 + 30) * q; py = BS + 30 + (zy - BS - 30) * q; a = Math.atan2(zy - BS - 30, zx - 34 + 30); }
    else if (u < .75) { const q = (u - .3) / .45, ang = Math.PI + q * TAU; px = zx + Math.cos(ang) * 34; py = zy + Math.sin(ang) * 30; a = ang + Math.PI / 2; }
    else { const q = (u - .75) / .25; px = zx - 34 + (q * q) * (BS + 80); py = zy - q * q * (zy + 60); a = Math.atan2(-(zy + 60), BS + 80); }
    if (u > .3) { g.fillStyle = `rgba(90,230,255,${.12 + .08 * Math.sin(t * 10)})`; g.fillRect(f.zx * CS + 1, f.zy * CS + 1, 3 * CS - 1, 3 * CS - 1); }
    const k = ((Math.round(a / TAU * 16) % 16) + 16) % 16;
    g.drawImage(G.planeSh[k], Math.round(px - 16 + 8), Math.round(py - 16 + 12));
    g.drawImage(G.plane[k], Math.round(px - 16), Math.round(py - 16));
  } else if (f.type === 'scan') {
    const S3 = 3 * CS, x = f.zx * CS, y = f.zy * CS, line = Math.floor(u * S3);
    g.globalAlpha = 1 - u * .6; g.fillStyle = 'rgba(90,230,255,.16)'; g.fillRect(x + 1, y + 1, S3 - 1, S3 - 1);
    R(g, x + 1, y + line, S3 - 1, 1, '#bff6ff'); g.globalAlpha = 1;
    for (let k = 0; k < S3; k += 4) { const o = Math.floor(t * 20) % 4; R(g, x + ((k + o) % S3), y, 2, 1, '#bff6ff'); R(g, x + ((k + o) % S3), y + S3, 2, 1, '#bff6ff'); R(g, x, y + ((k + o) % S3), 1, 2, '#bff6ff'); R(g, x + S3, y + ((k + o) % S3), 1, 2, '#bff6ff'); }
  } else if (f.type === 'torp') {
    const len = (f.stop + 1) * CS, head = Math.min(len, Math.floor(ease(u) * len + 4)), lc = f.line * CS + CS / 2;
    for (let k = 0; k < head; k++) {
      const fade = 1 - (head - k) / (len + 40), wob = ((k + Math.floor(t * 20)) % 5 === 0) ? 1 : 0;
      g.globalAlpha = Math.max(.15, fade);
      if (f.h) { R(g, k, lc - 2 - wob, 1, 1, '#ffffff'); R(g, k, lc + 2 + wob, 1, 1, '#ffffff'); R(g, k, lc, 1, 1, '#bfe6ff'); }
      else { R(g, lc - 2 - wob, k, 1, 1, '#ffffff'); R(g, lc + 2 + wob, k, 1, 1, '#ffffff'); R(g, lc, k, 1, 1, '#bfe6ff'); }
    }
    g.globalAlpha = 1;
    if (f.h) { R(g, head - 7, lc - 2, 8, 4, OUT); R(g, head - 6, lc - 1, 6, 2, '#8a94a4'); R(g, head - 1, lc - 1, 1, 2, '#e04a3c'); }
    else { R(g, lc - 2, head - 7, 4, 8, OUT); R(g, lc - 1, head - 6, 2, 6, '#8a94a4'); R(g, lc - 1, head - 1, 2, 1, '#e04a3c'); }
  } else if (f.type === 'dive') {
    const s = S[f.key].ships[f.si], im = G.ship.sub[f.h ? 'h' : 'v'].img, hidden = f.key === 'enemy';
    const [fx0, fy0] = f.from[0];
    if (!hidden) {
      if (u < .5) { g.globalAlpha = 1 - u * 2; g.drawImage(im, fx0 * CS, fy0 * CS); }
      else { g.globalAlpha = (u - .5) * 2; g.drawImage(im, f.to[0] * CS, f.to[1] * CS); }
      g.globalAlpha = 1;
    }
    if (Math.random() < .3 && (u < .5 || !hidden)) { const [x, y] = u < .5 ? f.from[vr(3)] : shipCells(s, f.to[0], f.to[1], f.h)[vr(3)]; burst(f.key, cx(x) + vr(10) - 5, cy(y) + vr(10) - 5, 'bubble', 1); }
  } else if (f.type === 'missile') {
    // arrive en biais depuis le bas à gauche, avec sa traînée de fumée
    const x = cx(f.c), y = cy(f.r), q = ease(u), sx = x - 70 * (1 - q), sy = y + 40 * (1 - q) - Math.sin(q * Math.PI) * 50;
    for (let k = 1; k <= 6; k++) { const qq = Math.max(0, q - k * .05), px = x - 70 * (1 - qq), py = y + 40 * (1 - qq) - Math.sin(qq * Math.PI) * 50;
      g.globalAlpha = .7 - k * .1; g.drawImage(G.puff[Math.min(5, k >> 1)], Math.round(px - 10), Math.round(py - 10)); }
    g.globalAlpha = 1;
    R(g, Math.round(sx) - 3, Math.round(sy) - 2, 7, 4, OUT); R(g, Math.round(sx) - 2, Math.round(sy) - 1, 4, 2, '#c8d0dc'); R(g, Math.round(sx) + 2, Math.round(sy) - 1, 1, 2, '#e04a3c');
    R(g, Math.round(sx) - 4, Math.round(sy) - 1, 1, 2, Math.floor(t * 20) % 2 ? '#ffd23f' : '#ff9a3c');
  } else if (f.type === 'beam' || f.type === 'lit') {
    // le faisceau du projecteur balaie les 4 cases, puis elles restent éclairées un instant
    const n = f.cells.length, head = f.type === 'beam' ? u * (n + 1) : n + 1;
    f.cells.forEach(([x, y], k) => {
      const a = f.type === 'lit' ? .35 * (1 - u) : k < head ? Math.min(1, head - k) * (.25 + .12 * Math.sin(t * 12 + k)) : 0;
      if (a <= 0) return;
      g.fillStyle = `rgba(255,246,170,${a})`; g.fillRect(x * CS + 1, y * CS + 1, CS - 1, CS - 1);
      if (f.type === 'beam' && k === Math.floor(head) && k < n) { R(g, x * CS + 9, y * CS + 9, 8, 8, 'rgba(255,255,255,.7)'); R(g, x * CS + 11, y * CS + 11, 4, 4, '#ffffff'); }
    });
  } else if (f.type === 'ping') {
    // des ondes partent du bord et parcourent la ligne
    const lc = f.line * CS + CS / 2;
    g.fillStyle = `rgba(120,240,255,${.12 + .08 * Math.sin(t * 10)})`;
    if (f.h) g.fillRect(0, f.line * CS + 1, BS, CS - 1); else g.fillRect(f.line * CS + 1, 0, CS - 1, BS);
    for (let k = 0; k < 3; k++) {
      const q = (u * 2 + k / 3) % 1, d = q * BS, rr = 4 + q * 8;
      g.globalAlpha = 1 - q;
      if (f.h) ring(g, d, lc, rr, '#bff6ff'); else ring(g, lc, d, rr, '#bff6ff');
    }
    g.globalAlpha = 1;
  } else if (f.type === 'repair') {
    // une clé qui tourne et des étincelles vertes ; les flammes s'éteignent à la fin
    const x = cx(f.c), y = cy(f.r), a = Math.sin(u * TAU * 3) * .6;
    g.save(); g.translate(x, y - 2); g.rotate(a); g.drawImage(G.icon.reparation, -10, -10); g.restore();
    if (Math.random() < .4) burst(f.key, x + vr(14) - 7, y + vr(10) - 5, 'fix', 1);
  } else if (f.type === 'drop' && f.key === 'player') {
    // les mines tombent du mouilleur et s'enfoncent avec des ronds dans l'eau (cachées chez l'ennemi)
    f.cells.forEach(([c, r], k) => {
      const q = clamp(u * 1.6 - k * .4, 0, 1), x = cx(c), y = cy(r);
      if (q <= 0) return;
      if (q < .5) g.drawImage(G.icon.mines, x - 10, Math.round(y - 10 - (1 - q * 2) * 30));
      else { g.globalAlpha = 1 - (q - .5) * 2; ring(g, x, y + 2, 4 + (q - .5) * 18, '#d8f0ff'); g.globalAlpha = 1; g.drawImage(G.icon.mines, x - 10, y - 7); }
    });
  } else if (f.type === 'smokeup') {
    // la fumée monte et s'étale sur la zone
    const x0 = f.zx * CS, y0 = f.zy * CS;
    for (let k = 0; k < 12; k++) {
      const q = clamp(u * 1.5 - k * .04, 0, 1), sz = Math.min(5, Math.floor(q * 6));
      g.globalAlpha = .85 * q; g.drawImage(G.puff[sz], Math.round(x0 + 6 + (k * 23) % 66 - 10 + q * 4), Math.round(y0 + 8 + (k * 37) % 62 - 10 - q * 3));
    }
    g.globalAlpha = 1;
  } else if (f.type === 'inflate' && f.key === 'player') {
    // le leurre se gonfle (caché chez l'ennemi)
    const im = G.decoy[f.h ? 'h' : 'v'], [c, r] = f.cells[0], q = ease(u), w = Math.max(1, Math.round(im.width * q)), hh = Math.max(1, Math.round(im.height * q));
    g.drawImage(im, 0, 0, im.width, im.height, c * CS + Math.round((im.width - w) / 2), r * CS + Math.round((im.height - hh) / 2), w, hh);
    if (Math.random() < .3) burst(f.key, cx(c) + vr(20) - 4, cy(r) + vr(12) - 6, 'bubble', 1);
  }
  if (u >= 1 && !f.ended) { f.ended = true; if (f.done) f.done(); }
}

/* ---------- interface ---------- */
let BTN = []; // zones cliquables de l'image en cours
function button(x, y, w, h, label, opts = {}) {
  const tone_ = opts.disabled ? 'dim' : opts.gold ? 'gold' : opts.red ? 'red' : null;
  plate(g, x, y, w, h, tone_);
  if (opts.sel) { const c = Math.floor(T * 4) % 2 ? '#ffd23f' : '#fff6c2'; R(g, x - 1, y - 1, w + 2, 1, c); R(g, x - 1, y + h, w + 2, 1, c); R(g, x - 1, y - 1, 1, h + 2, c); R(g, x + w, y - 1, 1, h + 2, c); }
  if (label) {
    if (opts.tiny) tiny(g, label, x + w / 2, y + Math.floor(h / 2) - 2, opts.disabled ? '#7d8698' : '#ffffff', 'center');
    else text(g, label, x + w / 2, y + Math.floor((h - 8) / 2) + 1, opts.disabled ? '#7d8698' : opts.gold ? '#fff6c2' : '#ffffff', 'center');
  }
  if (opts.act) BTN.push({ x, y: y + OY, w, h, act: opts.act });
}
// coupe un texte en lignes d'après la largeur mesurée (police déjà choisie)
function wrapW(s, W) {
  const words = s.split(' '), lines = []; let cur = '';
  for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (g.measureText(nx).width > W && cur) { lines.push(cur); cur = w; } else cur = nx; }
  if (cur) lines.push(cur);
  return lines;
}
function drawMsg(y) {
  const h = Math.max(44, LH - y - 6);
  plate(g, 4, y, LW - 8, h);
  const shown = Math.min(S.msg.length, Math.floor((now() - S.msgT0) / 16));
  if (shown !== S.msgShown) { if (shown < S.msg.length && shown % 5 === 0 && AC.sfxOn) SFX.tick(); S.msgShown = shown; }
  g.font = FONT_TEXT(8); const lines = wrapW(S.msg, LW - 22); let left = shown;
  lines.slice(0, Math.max(3, Math.floor((h - 8) / 13))).forEach((l, i) => { const part = l.slice(0, Math.max(0, left)); left -= l.length + 1; text(g, part, 9, y + 7 + i * 13, '#f2f0ff'); });
}
function bg(t) {
  g.drawImage(G.sea, -96 + Math.floor((t * 3) % 96), -96 + Math.floor((t * 2) % 96));
  g.fillStyle = 'rgba(6,14,36,.55)'; g.fillRect(0, 0, LW, LH);
}
function drawTitle(t) {
  logo(g, 'AMIRAL !', LW / 2, 26, 24);
  tiny(g, 'LA BATAILLE NAVALE DES POUVOIRS', LW / 2, 60, '#cfe6ff', 'center');
  // la flotte choisie au chantier naval et ses pouvoirs
  plate(g, 8, 76, LW - 16, 122);
  YARD.fleet.forEach((id, i) => {
    const d = SHIPS[id], P2 = POWERS[d.power], y = 80 + i * 29;
    g.drawImage(G.icon[d.power], 16, y + 4);
    text(g, P2.name, 44, y + 2, '#ffd23f'); tiny(g, d.name.toUpperCase(), LW - 18, y + 3, '#8fb3e0', 'right');
    tiny(g, P2.desc, 44, y + 17, '#f2f0ff');
  });
  tiny(g, 'UN SEUL COUP PAR TOUR : UN TIR OU UN POUVOIR', LW / 2, 204, '#cfe6ff', 'center');
  text(g, 'NIVEAU', LW / 2, 218, '#ffd23f', 'center');
  const best = store.get('best', {}) || {};
  DIFFS.forEach(([k, lbl], i) => {
    const x = 8 + i * 87;
    button(x, 232, 82, 26, lbl, { sel: S.diff === k, gold: S.diff === k, act: () => { S.diff = k; store.set('diff', k); SFX.select(); } });
    tiny(g, best[k] ? `RECORD ${best[k]} TOURS` : 'PAS DE RECORD', x + 41, 263, best[k] ? '#ffd23f' : '#7d8698', 'center');
  });
  button(40, 276, LW - 80, 34, 'JOUER', { gold: true, act: () => { audioInit(); SFX.click(); openYard(); } });
  const done = store.get('dailyTry', 0) === todayKey();
  button(40, 316, LW - 80, 26, done ? 'BATAILLE DU JOUR  (TENTEE)' : 'BATAILLE DU JOUR', { tiny: true, act: () => { audioInit(); SFX.click(); S.phase = 'daily'; } });
  if (!done) { plate(g, LW - 58, 311, 30, 12, 'red'); tiny(g, 'JOUR', LW - 43, 314, '#ffffff', 'center'); }
  if (!window.ludoArtefact) button(140, 350, 76, 26, '< LUDOTHEQUE', { tiny: true, act: () => { location.href = '../index.html'; } });
  button(56, 350, window.ludoArtefact ? 160 : 76, 26, 'CLASSEMENT', { tiny: !window.ludoArtefact, act: () => { location.href = `../classements/index.html#amiral-0-${S.diff}`; } });
  button(56, 384, 76, 24, AC.sfxOn ? 'SON' : 'SON OFF', { tiny: true, disabled: !AC.sfxOn, act: () => { AC.sfxOn = !AC.sfxOn; if (AC.sfx) AC.sfx.gain.value = AC.sfxOn ? .9 : 0; saveOpts(); } });
  button(140, 384, 76, 24, AC.musicOn ? 'MUSIQUE' : 'MUSIQUE OFF', { tiny: true, disabled: !AC.musicOn, act: () => { AC.musicOn = !AC.musicOn; saveOpts(); } });
  g.drawImage(G.admiral, 8, 428);
  plate(g, 50, 434, LW - 58, 34);
  text(g, 'Choisissez vos 4 navires', 58, 440, '#f2f0ff'); text(g, 'et coulez la flotte !', 58, 453, '#f2f0ff');
}
function saveOpts() { store.set('opts', { sfx: AC.sfxOn, music: AC.musicOn }); }
// l'écran de la bataille du jour : les deux flottes imposées, la tentative classée
const dateFr = () => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function drawDaily(t) {
  const d = todayKey(), D = dailyOf(d), ranked = store.get('dailyTry', 0) !== d, rec = (store.get('daily', {}) || {})[d];
  logo(g, 'BATAILLE DU JOUR', LW / 2, 8, 11);
  tiny(g, dateFr() + '  -  NIVEAU CAPITAINE', LW / 2, 27, '#cfe6ff', 'center');
  const fleetBox = (list, y, foe) => {
    plate(g, 8, y, LW - 16, 124, foe ? 'red' : null);
    text(g, foe ? 'FLOTTE ENNEMIE' : 'VOTRE FLOTTE', 16, y + 6, foe ? '#ffd6cc' : '#ffd23f');
    list.forEach((id, i) => {
      const sd = SHIPS[id], yy = y + 22 + i * 25;
      shipPic(id, 16, yy + 2, sd.len === 4 ? .55 : .62, false);
      text(g, sd.name.toUpperCase(), 92, yy + 1, '#f2f0ff'); tiny(g, POWERS[sd.power].name + '  -  ' + POWERS[sd.power].desc, 92, yy + 14, foe ? '#ffb4a8' : '#ffd23f', 'left', LW - 104);
      if (!foe && !usable(id)) { plate(g, LW - 74, yy, 58, 13, 'gold'); tiny(g, 'A ESSAYER', LW - 45, yy + 3, '#fff6c2', 'center'); }
    });
  };
  fleetBox(D.fleet, 40, false); fleetBox(D.foe, 172, true);
  tiny(g, ranked ? 'UNE SEULE TENTATIVE CLASSEE : ELLE COMPTE DES LE COMBAT' : 'DEJA TENTEE AUJOURD\'HUI : PARTIE HORS CLASSEMENT', LW / 2, 306, ranked ? '#ffd23f' : '#ff9a86', 'center');
  tiny(g, rec ? `VICTOIRE DU JOUR EN ${rec} TOURS` : 'LA VICTOIRE EN LE MOINS DE TOURS', LW / 2, 320, rec ? '#8ee05a' : '#cfe6ff', 'center');
  button(40, 340, LW - 80, 26, 'CLASSEMENT DU JOUR', { tiny: true, act: () => { location.href = '../classements/index.html#amiral-1'; } });
  button(8, 440, 78, 32, '< MENU', { tiny: true, act: () => { S.phase = 'title'; SFX.click(); } });
  button(94, 440, LW - 102, 32, 'PLACER LA FLOTTE', { gold: true, act: () => { audioInit(); SFX.start(); newGame(d); } });
}

// la place gagnée en hauteur va aux boutons des pouvoirs, à la minicarte et aux messages
let BY_BAR = 284, BAR_H = 46, MSG_Y = 434; const MINI = { x: 8, y: 340, s: 88 };
function layout() {
  const ex = LH - 480;
  BY_BAR = 284 + Math.round(ex * .1); BAR_H = 46 + Math.min(18, Math.round(ex * .16));
  MINI.y = BY_BAR + BAR_H + 8; MINI.s = 88 + Math.min(22, Math.round(ex * .3));
  MSG_Y = MINI.y + MINI.s + 12;
}
function drawHud(t) {
  // barre du haut
  logo(g, 'AMIRAL!', 46, 8, 10);
  const place = S.phase === 'place';
  button(LW - 62, 6, 56, 18, S.quitArm && now() - S.quitArm < 2500 ? 'QUITTER ?' : 'MENU', { tiny: true, red: !!(S.quitArm && now() - S.quitArm < 2500), act: () => {
    if (S.phase !== 'play' && S.phase !== 'place') return;
    if (S.quitArm && now() - S.quitArm < 2500) { goTitle(); return; }
    S.quitArm = now(); SFX.click(); setMsg('Touchez encore QUITTER pour abandonner la partie.');
  } });
  if (!place) {
    plate(g, 96, 6, 74, 18);
    text(g, `TOUR ${S.stats.turns + (S.turn === 'player' && !S.busy ? 1 : 0)}`, 133, 11, '#ffd23f', 'center');
  }
  // titre de la grille (caché quand les flèches de direction sont affichées)
  const v = S.view, mine = v === 'player', w = S.weapon;
  const ttl = place ? 'PLACEZ VOTRE FLOTTE' : mine ? (S.turn === 'ai' ? "L'ENNEMI ATTAQUE !" : { plongee: 'CHOISISSEZ OU PLONGER', reparation: 'CHOISISSEZ LA CASE A REPARER',
              mines: `MINES : ${S.marks.length} / ${mineNeed()} POSEES`, fumee: 'CHOISISSEZ LA ZONE DE FUMEE', leurre: 'CHOISISSEZ OU POSER LE LEURRE' }[w] || 'VOTRE FLOTTE')
            : w === 'missiles' && S.turn === 'player' && !S.busy ? `MISSILES : ${S.marks.length} / ${missileNeed()} CIBLES` : (S.turn === 'player' ? 'EAUX ENNEMIES : A VOUS' : 'EAUX ENNEMIES');
  if (!arrowsOn()) tiny(g, ttl, LW / 2, 32, mine ? '#9fd3ff' : '#ffb4a8', 'center');
}
const missileNeed = () => Math.min(3, S.enemy.shots.flat().filter(v => !v).length);
const mineNeed = () => Math.min(2, MAX_MINES - S.player.mines.length, mineTargets(S.player).length);
const HELP = {
  tir: 'Touchez une case des eaux ennemies pour tirer.',
  avion: 'Avion : touchez le centre de la zone à survoler, puis FEU !',
  salve: 'Salve : touchez le centre de la croix, puis FEU !',
  torpille: 'Torpille : touchez une case, puis la flèche du sens voulu (à gauche : la ligne, en haut : la colonne).',
  plongee: 'Plongée : choisissez un point vert pour le sous-marin, puis FEU !',
  missiles: 'Missiles : touchez 3 cases ennemies (touchez-en une encore pour la retirer), puis FEU !',
  sonar: 'Sonar : touchez une case, puis la flèche du sens voulu. Il dit combien de cases de navire sont cachées sur la ligne.',
  projecteur: 'Projecteur : touchez une case, puis la flèche du sens voulu. Il éclaire 4 cases.',
  reparation: 'Réparation : choisissez une case touchée (croix verte) sur votre flotte, puis FEU ! Elle retourne dans le brouillard pour l\'ennemi.',
  mines: 'Mines : touchez 2 cases d\'eau de votre flotte, puis FEU ! L\'ennemi qui tire dessus prend un tir en retour.',
  fumee: 'Fumée : touchez le centre de la zone à cacher, puis FEU ! Pendant 2 tours, l\'ennemi ne saura pas ce qu\'il touche dedans.',
  leurre: 'Leurre : touchez une case d\'eau de votre flotte (encore une fois pour le pivoter), puis FEU ! Pour l\'ennemi, c\'est un navire.',
};
function blockedMsg(p, why) {
  const b = S.player, s = shipOf(b, p);
  return why === 'sunk' ? `${s.def.name} coulé : plus de ${POWERS[p].name.toLowerCase()} !` : why === 'hit' ? 'Le sous-marin est touché : il ne peut plus plonger.'
    : why === 'stuck' ? (p === 'plongee' ? "Le sous-marin n'a nulle part où plonger." : "Plus assez d'eau libre dans nos eaux.") : why === 'intact' ? 'Rien à réparer : aucun navire à flot n\'est touché.'
    : why === 'full' ? (p === 'mines' ? `Déjà ${MAX_MINES} mines dans nos eaux.` : `Déjà ${MAX_DECOYS} leurres à l'eau.`)
    : `${POWERS[p].name} sera prêt dans ${b.cd[p]} tour${b.cd[p] > 1 ? 's' : ''}.`;
}
function drawBar(t) {
  if (S.phase === 'place') {
    button(6, BY_BAR, 82, 42, 'PIVOTER', { tiny: true, disabled: S.sel == null, act: () => rotateSel() });
    button(95, BY_BAR, 82, 42, 'HASARD', { tiny: true, act: () => { randomFleet(S.player); S.sel = null; SFX.rotate(); } });
    button(184, BY_BAR, 82, 42, 'COMBAT !', { gold: true, tiny: true, act: () => { audioInit(); startBattle(); } });
    return;
  }
  const myTurn = S.phase === 'play' && S.turn === 'player' && !S.busy;
  ['tir', ...powersOf(S.player)].forEach((p, i) => {
    const x = 6 + i * 52, y = BY_BAR, w = 48, h = BAR_H, b = S.player, ship = p === 'tir' ? null : shipOf(b, p);
    const why = blocked('player', p), ok = !why, sel = S.weapon === p;
    plate(g, x, y, w, h, sel ? 'gold' : ok ? null : 'dim');
    if (sel) { const c = Math.floor(T * 4) % 2 ? '#ffd23f' : '#fff6c2'; R(g, x - 1, y - 1, w + 2, 1, c); R(g, x - 1, y + h, w + 2, 1, c); R(g, x - 1, y - 1, 1, h + 2, c); R(g, x + w, y - 1, 1, h + 2, c); }
    // la cible est choisie : la plaque devient FEU ! (ou demande le sens pour les pouvoirs en ligne)
    const fire = sel && myTurn && p !== 'tir' && (p === 'missiles' ? S.marks.length >= missileNeed() && S.marks.length > 0 : p === 'mines' ? S.marks.length >= mineNeed() && S.marks.length > 0 : !!S.armed);
    if (fire) {
      const bl = Math.floor(T * 5) % 2;
      if (POWERS[p].dir) { text(g, 'SENS', x + w / 2, y + h / 2 - 12, '#fff6c2', 'center'); tiny(g, 'TOUCHEZ', x + w / 2, y + h / 2 + 2, '#ffd23f', 'center'); tiny(g, 'UNE FLECHE', x + w / 2, y + h / 2 + 11, '#ffd23f', 'center'); }
      else { text(g, 'FEU !', x + w / 2, y + h / 2 - 8, bl ? '#ffffff' : '#ffd23f', 'center', 8); tiny(g, POWERS[p].name, x + w / 2, y + h / 2 + 8, '#fff6c2', 'center', w - 4); }
    } else {
      if (!ok) g.globalAlpha = .4;
      g.drawImage(G.icon[p], x + 14, y + 5 + Math.round((h - 46) / 3));
      g.globalAlpha = 1;
      tiny(g, POWERS[p].name, x + w / 2, y + h - 17, ok ? '#ffffff' : '#7d8698', 'center', w - 4);
      if (why === 'sunk') { for (let k = 0; k < 14; k++) { R(g, x + 14 + k + 3, y + 6 + k, 2, 2, '#ff4040'); R(g, x + 33 - k - 3, y + 6 + k, 2, 2, '#ff4040'); } }
      else if (why === 'cd') { plate(g, x + 30, y + 3, 15, 13, 'red'); text(g, String(b.cd[p]), x + 38, y + 6, '#ffffff', 'center'); }
      else if (why) tiny(g, { hit: 'TOUCHE', stuck: 'BLOQUE', intact: 'INTACT', full: 'PLEIN' }[why], x + w / 2, y + h - 8, why === 'intact' ? '#9aa3b1' : '#ff8a76', 'center');
      else if (p !== 'tir') tiny(g, 'PRET', x + w / 2, y + h - 8, '#8ee05a', 'center');
    }
    BTN.push({ x, y, w, h, act: () => {
      if (!myTurn) return;
      if (why) { SFX.error(); setMsg(blockedMsg(p, why)); return; }
      if (fire) {
        if (POWERS[p].dir) { SFX.error(); return; }
        if (p === 'missiles' || p === 'mines') { const m = S.marks; playerAct({ w: p, c: m[0][0], r: m[0][1], h: true, cells: m.slice() }); return; }
        const a = S.armed; playerAct({ w: p, c: a.c, r: a.r, h: p === 'plongee' ? ship.h : p === 'leurre' ? S.dir : true }); return;
      }
      resetAim(); S.weapon = p; S.dir = POWERS[p].dir ? null : true; SFX.select();
      setView(POWERS[p].own ? 'player' : 'enemy'); S.peek = false;
      setMsg(HELP[p]);
    } });
  });
}
// flèches des pouvoirs en ligne (torpille, sonar, projecteur) : à gauche de la ligne, au-dessus de la colonne
function arrowsOn() { return S.phase === 'play' && S.view === 'enemy' && POWERS[S.weapon].dir && S.armed && S.turn === 'player' && !S.busy; }
function arrowGlyph(x, y, dir, col) {
  for (let k = 0; k < 6; k++) {
    if (dir === 'r') { R(g, x + k, y - 6 + k, 2, (6 - k) * 2 + 1, OUT); R(g, x + k, y - 5 + k, 1, (6 - k) * 2 - 1, col); }
    else { R(g, x - 6 + k, y + k, (6 - k) * 2 + 1, 2, OUT); R(g, x - 5 + k, y + k, (6 - k) * 2 - 1, 1, col); }
  }
}
function drawArrows(t) {
  if (!arrowsOn()) return;
  const { c, r } = S.armed, w = S.weapon, bl = Math.floor(t * 4) % 2 ? '#ffd23f' : '#fff6c2';
  const fireH = h => { S.dir = h; playerAct({ w, c, r, h }); };
  button(2, BY + r * CS + 2, 22, CS - 4, '', { gold: true, act: () => fireH(true) });
  arrowGlyph(9, BY + r * CS + CS / 2, 'r', bl);
  button(BX + c * CS + 2, 22, CS - 4, 22, '', { gold: true, act: () => fireH(false) });
  arrowGlyph(BX + c * CS + CS / 2, 29, 'd', bl);
}
function drawBottom(t) {
  // miniature de l'autre grille (touchez-la pour basculer la vue)
  const other_ = S.view === 'player' ? 'enemy' : 'player', m = MINI;
  const mg = G.miniG; mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, BS + 24, BS + 24);
  drawBoard(mg, other_, 12, 12, t, false);
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(G.mini, 0, 0, BS + 24, BS + 24, m.x - 2, m.y - 2, m.s + 4, m.s + 4);
  g.imageSmoothingEnabled = false;
  tiny(g, other_ === 'player' ? 'MA FLOTTE' : 'ENNEMI', m.x + m.s / 2, m.y + m.s + 6, other_ === 'player' ? '#9fd3ff' : '#ffb4a8', 'center');
  if (S.phase === 'play' && S.turn === 'player' && !S.busy) BTN.push({ x: m.x, y: m.y, w: m.s, h: m.s, act: () => {
    SFX.click();
    if (POWERS[S.weapon].own) S.weapon = 'tir';
    setView(S.view === 'player' ? 'enemy' : 'player'); S.aim = null; S.armed = null;
  } });
  // flotte ennemie : ce qu'il reste à couler et ses pouvoirs
  const x0 = MINI.x + MINI.s + 16, y0 = MINI.y - 4, W2 = LW - x0 - 6, H2 = MINI.s + 4, st = Math.floor((H2 - 20) / 4);
  plate(g, x0, y0, W2, H2, 'red');
  text(g, 'FLOTTE ENNEMIE', x0 + 6, y0 + 5, '#ffd6cc');
  S.enemy.ships.forEach((s, i) => {
    const y = y0 + 16 + i * st, p = s.def.power;
    for (let k = 0; k < s.def.len; k++) { R(g, x0 + 6 + k * 7, y + 3, 6, 6, OUT); R(g, x0 + 7 + k * 7, y + 4, 4, 4, s.sunk ? '#5a4a52' : '#a9b1bc'); if (s.sunk) R(g, x0 + 7 + k * 7, y + 4, 4, 1, '#ff5a46'); }
    // un nom long (REPARATION, PROJECTEUR) se resserre pour ne pas toucher PRET
    const nm = s.sunk ? 'COULE' : POWERS[p].name, room = W2 - 44 - 30;
    g.font = FONT_TEXT(8); const sz = g.measureText(nm).width > room ? 8 * room / g.measureText(nm).width : 8;
    text(g, nm, x0 + 38, y + 3 + Math.round((8 - sz) / 2), s.sunk ? '#ff8a76' : '#f2f0ff', 'left', sz);
    if (!s.sunk) {
      // le compteur ennemi baisse au début de son tour : à 1, le pouvoir sera prêt dès son prochain coup
      const cd = S.enemy.cd[p], okp = cd <= 1 && !(p === 'plongee' && s.hits);
      text(g, okp ? 'PRET' : p === 'plongee' && s.hits ? '-' : (cd - 1) + 'T', x0 + W2 - 6, y + 3, okp ? '#ffd23f' : '#8fa0b8', 'right');
    }
  });
}
function drawPlay(t) {
  bg(t);
  // tremblement après un impact
  const sh = S.shake && now() - S.shake < 300 ? Math.round(Math.sin(now() / 20) * 2 * (1 - (now() - S.shake) / 300)) : 0;
  const v = S.view, tr = S.prevView && now() - S.viewT0 < 320 ? (now() - S.viewT0) / 320 : 1;
  if (tr < 1) {
    drawBoard(g, S.prevView, BX + sh, BY, t, true);
    g.save(); g.beginPath(); g.rect(BX - 12, BY - 12, Math.floor((BS + 24) * ease(tr)), BS + 24); g.clip();
    drawBoard(g, v, BX + sh, BY, t, true); g.restore();
    R(g, BX - 12 + Math.floor((BS + 24) * ease(tr)), BY - 12, 2, BS + 24, '#ffffff');
  } else drawBoard(g, v, BX + sh, BY, t, true);
  BTN.push({ x: BX, y: BY, w: BS, h: BS, board: true });
  drawHud(t); drawBar(t); drawBottom(t); drawMsg(MSG_Y); drawArrows(t);
}
function drawOver(t) {
  drawPlay(t); BTN = [];
  if (!S.endInfo) return;
  const e = S.endInfo, st = S.stats, a = Math.min(1, (now() - S.endT0) / 400);
  g.fillStyle = `rgba(4,8,20,${.6 * a})`; g.fillRect(0, 0, LW, LH);
  const y = 96 + Math.floor((LH - 480) / 2);
  plate(g, 16, y, LW - 32, 250, e.win ? 'gold' : 'red');
  logo(g, e.win ? 'VICTOIRE !' : 'DEFAITE...', LW / 2, y + 14, 16);
  g.drawImage(e.win ? G.admiral : G.enemyAdm, LW / 2 - 18, y + 40);
  const acc = st.shots ? Math.round(st.hits / st.shots * 100) : 0, left = S.player.ships.filter(s => !s.sunk).length;
  const rows = [['TOURS', st.turns], ['TIRS', st.shots], ['PRECISION', acc + ' %'], ['NAVIRES RESTANTS', left + '/4']];
  if (e.win && S.daily) rows.push(['BATAILLE DU JOUR', e.best ? e.best + ' tours' : '-']);
  else if (e.win) rows.push([`RECORD ${DIFFS.find(d => d[0] === S.diff)[1]}`, e.best + ' tours']);
  rows.forEach(([k, v], i) => { tiny(g, k, 34, y + 92 + i * 14, '#f2f0ff'); text(g, String(v), LW - 34, y + 90 + i * 14, '#ffd23f', 'right'); });
  if (S.rankText) tiny(g, S.rankText, LW / 2, y + 168, Math.floor(t * 3) % 2 ? '#ffd23f' : '#fff6c2', 'center');
  button(32, y + 184, 100, 26, 'REJOUER', { gold: true, tiny: true, act: () => { newGame(S.daily ? S.daily.d : null); } });
  button(140, y + 184, 100, 26, 'CLASSEMENT', { tiny: true, act: () => { location.href = S.daily ? '../classements/index.html#amiral-1' : `../classements/index.html#amiral-0-${S.diff}`; } });
  button(32, y + 216, 100, 22, 'CHANTIER', { tiny: true, act: () => { S.fx = []; S.parts = []; MUSIC.stop(); openYard(); } });
  button(140, y + 216, 100, 22, 'MENU', { tiny: true, act: () => goTitle() });
  // un navire débloqué par cette victoire : annonce sous le bilan
  if (e.fresh && e.fresh.length) {
    const d = e.fresh[0], yy = y + 262, bl = Math.floor(t * 3) % 2;
    plate(g, 16, yy, LW - 32, 50, 'gold');
    tiny(g, 'NOUVEAU NAVIRE DEBLOQUE !', LW / 2, yy + 6, bl ? '#ffffff' : '#ffd23f', 'center');
    shipPic(d.id, 26, yy + 22, .7, false);
    text(g, d.name.toUpperCase(), 116, yy + 20, '#fff6c2'); tiny(g, POWERS[d.power].name + (e.fresh.length > 1 ? `  (+${e.fresh.length - 1} AU CHANTIER)` : '  -  AU CHANTIER'), 116, yy + 34, '#ffd23f');
  }
}

/* =========================================================
   CHANTIER NAVAL : composer sa flotte de 4 navires
   ========================================================= */
const CATALOG = Object.values(SHIPS);
const YARD = { fleet: CLASSIC.slice(), slot: 0, tab: 4, toast: '', toastT: 0, seen: new Set(), tabs: new Set() };
// débloqué : sans condition, ou condition remplie dans le palmarès (amiral.palmares)
const unlocked = (id, pm = store.get('palmares', {}) || {}) => !!SHIPS[id].ok && (!SHIPS[id].need || !!SHIPS[id].need(pm));
const usable = id => unlocked(id);
const fleetOk = f => Array.isArray(f) && f.length === 4 && f.every((id, i) => SHIPS[id] && SHIPS[id].len === SLOTS[i] && usable(id)) && new Set(f).size === 4;
function openYard() { endDaily(); S.phase = 'yard'; YARD.slot = 0; YARD.tab = 4; YARD.tabs = new Set([4]); YARD.toast = ''; }
function leaveYard() {
  for (const d of CATALOG) if (YARD.tabs.has(d.len) && usable(d.id)) YARD.seen.add(d.id);
  store.set('vus', [...YARD.seen]); store.set('flotte', YARD.fleet);
}
function shipPic(id, x, y, sc, locked) {
  const im = locked ? G.ship[id].dark : G.ship[id].h.img, w = Math.round(im.width * sc), mx = x + Math.round(w / 2);
  g.drawImage(im, 0, 0, im.width, im.height, x, y, w, Math.round(im.height * sc));
  if (locked) { R(g, mx - 3, y + 5, 7, 6, OUT); R(g, mx - 2, y + 7, 5, 4, '#ffd23f'); R(g, mx - 1, y + 3, 3, 1, OUT); R(g, mx - 2, y + 4, 1, 3, OUT); R(g, mx + 2, y + 4, 1, 3, OUT); }
}
function setTab(n) { YARD.tab = n; YARD.tabs.add(n); }
function chooseShip(d) {
  if (!usable(d.id)) { SFX.error(); YARD.toast = 'VERROUILLE : ' + d.cond; YARD.toastT = now(); return; }
  const i = SLOTS[YARD.slot] === d.len ? YARD.slot : SLOTS.indexOf(d.len), j = YARD.fleet.indexOf(d.id);
  YARD.seen.add(d.id);
  if (j === i) return;
  if (j >= 0) YARD.fleet[j] = YARD.fleet[i];       // déjà en service : on échange les deux places de 3 cases
  YARD.fleet[i] = d.id; YARD.slot = i; SFX.place();
}
function drawYard(t) {
  logo(g, 'CHANTIER NAVAL', LW / 2, 8, 13);
  tiny(g, 'COMPOSEZ VOTRE FLOTTE DE 4 NAVIRES', LW / 2, 29, '#cfe6ff', 'center');
  // les 4 places
  plate(g, 8, 42, LW - 16, 122);
  YARD.fleet.forEach((id, i) => {
    const d = SHIPS[id], y = 47 + i * 29, sel = YARD.slot === i;
    if (sel) { R(g, 11, y - 1, LW - 22, 28, 'rgba(255,210,63,.16)'); corners(g, 11, y - 1, LW - 23, 27, Math.floor(t * 4) % 2 ? '#ffd23f' : '#fff6c2'); }
    plate(g, 15, y + 6, 16, 14, sel ? 'gold' : null); text(g, String(d.len), 23, y + 10, '#ffd23f', 'center');
    shipPic(id, 38, y + 3, .8, false);
    text(g, d.name.toUpperCase(), 128, y + 4, '#f2f0ff'); tiny(g, POWERS[d.power].name, 128, y + 17, '#ffd23f');
    BTN.push({ x: 11, y: y - 1 + OY, w: LW - 22, h: 28, act: () => { YARD.slot = i; setTab(d.len); SFX.select(); } });
  });
  // onglets par taille
  [4, 3, 2].forEach((n, k) => button(8 + k * 87, 172, 82, 22, `${n} CASES`, { tiny: true, gold: YARD.tab === n, act: () => { setTab(n); SFX.select(); } }));
  // le catalogue de la taille choisie
  CATALOG.filter(d => d.len === YARD.tab).forEach((d, k) => {
    const y = 202 + k * 44, lock = !usable(d.id), inUse = YARD.fleet.includes(d.id), P2 = POWERS[d.power];
    plate(g, 8, y, LW - 16, 40, lock ? 'dim' : inUse ? 'gold' : null);
    shipPic(d.id, 14, y + 10, d.len === 4 ? .6 : .75, lock);
    const tx = 92;
    text(g, d.name.toUpperCase(), tx, y + 5, lock ? '#8a93a6' : '#ffffff');
    if (lock) { tiny(g, `${P2.name}  -  ${P2.desc}`, tx, y + 18, '#8a93a6', 'left', LW - tx - 12); tiny(g, 'A DEBLOQUER : ' + d.cond, tx, y + 28, '#ff6a5a'); }
    else { tiny(g, `${P2.name}  -  RECHARGE ${P2.cd}`, tx, y + 18, '#ffd23f'); tiny(g, P2.desc, tx, y + 28, '#e6ecf8'); }
    if (inUse) tiny(g, 'EN SERVICE', LW - 14, y + 6, '#8ee05a', 'right');
    else if (!lock && !d.base && !YARD.seen.has(d.id)) { plate(g, LW - 62, y - 5, 50, 13, 'red'); tiny(g, 'NOUVEAU !', LW - 37, y - 1, '#ffffff', 'center'); }
    BTN.push({ x: 8, y: y + OY, w: LW - 16, h: 40, act: () => chooseShip(d) });
  });
  if (YARD.toast && now() - YARD.toastT < 2200) { plate(g, 16, 419, LW - 32, 17, 'red'); tiny(g, YARD.toast, LW / 2, 424, '#ffffff', 'center'); }
  button(8, 440, 78, 32, '< MENU', { tiny: true, act: () => { leaveYard(); S.phase = 'title'; SFX.click(); } });
  button(94, 440, LW - 102, 32, 'PLACER LA FLOTTE', { gold: true, act: () => { leaveYard(); audioInit(); SFX.start(); newGame(); } });
}

function frame(ts) {
  const t = ts / 1000, dt = Math.min(.05, t - (T || t)); T = t;
  for (const p of S.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
  S.parts = S.parts.filter(p => p.t < p.life);
  BTN = [];
  g.setTransform(K, 0, 0, K, 0, 0); g.imageSmoothingEnabled = false;
  // écrans de menus : dessinés pour 480 de haut, centrés dans la hauteur de l'écran
  const centred = S.phase === 'title' || S.phase === 'yard' || S.phase === 'daily';
  OY = centred ? Math.floor((LH - 480) / 2) : 0;
  if (centred) { bg(t); g.setTransform(K, 0, 0, K, 0, K * OY); }
  if (S.phase === 'title') drawTitle(t);
  else if (S.phase === 'yard') drawYard(t);
  else if (S.phase === 'daily') drawDaily(t);
  else if (S.phase === 'over') drawOver(t);
  else drawPlay(t);
  OY = 0;
  // un effet se termine même s'il n'est pas à l'écran (vue basculée)
  for (const f of S.fx) if (!f.ended && now() - f.t0 >= f.dur) { f.ended = true; f.done && f.done(); }
  S.fx = S.fx.filter(f => !f.ended);
  requestAnimationFrame(frame);
}

/* =========================================================
   COMMANDES
   ========================================================= */
function rotateSel() {
  if (S.sel == null) return;
  const s = S.player.ships[S.sel];
  if (fits(S.player, S.sel, s.c, s.r, !s.h)) { placeShip(S.player, S.sel, s.c, s.r, !s.h); SFX.rotate(); }
  else {
    // on décale le navire pour qu'il tienne une fois tourné
    for (let d = 1; d < N; d++) for (const [dc, dr] of [[-d, 0], [0, -d], [d, 0], [0, d]]) if (fits(S.player, S.sel, s.c + dc, s.r + dr, !s.h)) { placeShip(S.player, S.sel, s.c + dc, s.r + dr, !s.h); SFX.rotate(); return; }
    SFX.error();
  }
}
function boardCell(x, y) { const c = Math.floor((x - BX) / CS), r = Math.floor((y - BY) / CS); return c >= 0 && r >= 0 && c < N && r < N ? { c, r } : null; }
function onBoard(cell, mouse) {
  if (S.phase === 'place') {
    const i = S.player.grid[cell.r][cell.c];
    if (i >= 0) { if (S.sel === i) rotateSel(); else { S.sel = i; SFX.select(); } return; }
    if (S.sel == null) return;
    const s = S.player.ships[S.sel];
    let c = s.h ? Math.min(cell.c, N - s.def.len) : cell.c, r = s.h ? cell.r : Math.min(cell.r, N - s.def.len);
    if (fits(S.player, S.sel, c, r, s.h)) { placeShip(S.player, S.sel, c, r, s.h); SFX.place(); } else SFX.error();
    return;
  }
  if (S.phase !== 'play' || S.turn !== 'player' || S.busy) return;
  const w = S.weapon, same = S.armed && S.armed.c === cell.c && S.armed.r === cell.r;
  if (S.view === 'player') {
    // plongée et réparation : on choisit une case de sa propre flotte, puis FEU ! (ou la même case encore)
    if (!POWERS[w].own) return;
    const me = S.player, { c, r } = cell;
    if (w === 'mines') {
      // jusqu'à 2 mines ; toucher une mine choisie la retire
      const k = S.marks.findIndex(([x, y]) => x === c && y === r);
      if (k >= 0) { S.marks.splice(k, 1); SFX.rotate(); }
      else if (!freeWater(me, c, r)) { SFX.error(); setMsg("Une mine se pose sur de l'eau libre : pas sur un navire, ni sur une case déjà visée ou repérée par l'ennemi."); return; }
      else { if (S.marks.length >= mineNeed()) S.marks.shift(); S.marks.push([c, r]); SFX.click(); }
      const left = mineNeed() - S.marks.length;
      setMsg(left > 0 ? `Mines : encore ${left} case${left > 1 ? 's' : ''} à choisir.` : 'Mines prêtes à larguer : touchez FEU !');
      return;
    }
    if (w === 'leurre') {
      // toucher une case : le leurre s'y pose (couché si possible) ; toucher encore : il pivote
      if (same) { if (decoyFits(me, c, r, !S.dir)) { S.dir = !S.dir; SFX.rotate(); } else SFX.error(); return; }
      const h = decoyFits(me, c, r, true) ? true : decoyFits(me, c, r, false) ? false : null;
      if (h == null) { SFX.error(); setMsg("Le leurre a besoin de 2 cases d'eau libre, que l'ennemi n'a ni visées ni repérées."); return; }
      S.aim = S.armed = cell; S.dir = h; SFX.click(); setMsg(`Leurre en ${cellName(c, r)} : touchez FEU ! (touchez encore la case pour le pivoter).`); return;
    }
    const T2 = ownTargets(me, w);
    if (!T2.some(([x, y]) => x === c && y === r)) { SFX.error(); return; }
    if (mouse || same) { playerAct({ w, c, r, h: w === 'plongee' ? shipOf(me, 'plongee').h : true }); return; }
    S.aim = S.armed = cell; SFX.click();
    setMsg(w === 'plongee' ? 'Touchez FEU ! (ou encore le point vert) pour plonger.' : w === 'fumee' ? `Fumée autour de ${cellName(c, r)} : touchez FEU ! (ou encore la case).` : `Réparer ${cellName(c, r)} : touchez FEU ! (ou encore la case).`); return;
  }
  if (w === 'missiles') {
    // jusqu'à 3 cibles ; toucher une cible la retire
    const k = S.marks.findIndex(([c, r]) => c === cell.c && r === cell.r);
    if (k >= 0) { S.marks.splice(k, 1); SFX.rotate(); }
    else if (S.enemy.shots[cell.r][cell.c]) { SFX.error(); setMsg('Cette case a déjà été visée.'); return; }
    else { if (S.marks.length >= 3) S.marks.shift(); S.marks.push([cell.c, cell.r]); SFX.click(); }
    const left = missileNeed() - S.marks.length;
    setMsg(left > 0 ? `Missiles : encore ${left} cible${left > 1 ? 's' : ''} à choisir.` : 'Trois cibles verrouillées : touchez FEU !');
    return;
  }
  if (POWERS[w].dir) {
    S.aim = S.armed = cell; S.dir = null; SFX.click();
    setMsg(`${POWERS[w].name} sur ${cellName(cell.c, cell.r)} : touchez la flèche à gauche (ligne ${cell.r + 1}) ou en haut (colonne ${COLS[cell.c]}).`); return;
  }
  if (w === 'tir' || mouse || same) { S.aim = cell; playerAct({ w, c: cell.c, r: cell.r, h: true }); return; }
  S.aim = S.armed = cell; SFX.click();
  setMsg(`${POWERS[w].name} vise ${cellName(cell.c, cell.r)}. Touchez FEU ! (ou encore la case) pour confirmer.`);
}
function logical(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * LW, (e.clientY - r.top) / r.height * LH]; }
cv.addEventListener('pointerdown', e => {
  e.preventDefault(); audioInit();
  if (AC.musicOn && S.phase !== 'title' && S.phase !== 'over') MUSIC.start(); else if (!AC.musicOn) MUSIC.stop();
  const [x, y] = logical(e);
  for (let i = BTN.length - 1; i >= 0; i--) {
    const b = BTN[i];
    if (x >= b.x && y >= b.y && x < b.x + b.w && y < b.y + b.h) {
      if (b.board) { const cell = boardCell(x, y); if (cell) onBoard(cell, e.pointerType === 'mouse'); }
      else b.act();
      return;
    }
  }
});
cv.addEventListener('pointermove', e => {
  if (e.pointerType !== 'mouse' || S.phase !== 'play') return;
  const [x, y] = logical(e), cell = boardCell(x, y);
  if (S.turn === 'player' && !S.busy && !(S.armed && POWERS[S.weapon].dir)) S.aim = cell;
});
document.addEventListener('keydown', e => {
  if (S.phase === 'place' && (e.key === 'r' || e.key === 'R')) rotateSel();
});
function resize() {
  const top = cv.getBoundingClientRect().top + window.scrollY - (parseFloat(cv.style.marginTop) || 0);
  const aw = window.innerWidth, ah = Math.max(200, window.innerHeight - top);
  LH = clamp(Math.round(LW * ah / aw), 480, MAXH); layout();
  const sc = Math.min(aw / LW, ah / LH), dpr = window.devicePixelRatio || 1;
  cv.style.width = Math.floor(LW * sc) + 'px'; cv.style.height = Math.floor(LH * sc) + 'px';
  cv.style.marginTop = Math.max(0, Math.floor((ah - LH * sc) / 2)) + 'px';
  K = Math.max(1, Math.ceil(sc * dpr - .05));
  cv.width = LW * K; cv.height = LH * K;
}
window.addEventListener('resize', resize);
document.addEventListener('visibilitychange', () => { if (document.hidden) MUSIC.stop(); else if (AC.musicOn && S.phase !== 'title' && S.phase !== 'over' && AC.ctx) MUSIC.start(); });

/* ---------- démarrage ---------- */
{
  const o = store.get('opts', {}) || {};
  if (o.sfx === false) AC.sfxOn = false; if (o.music === false) AC.musicOn = false;
  const d = store.get('diff', 'normal'); if (DIFFS.some(x => x[0] === d)) S.diff = d;
  const f = store.get('flotte', null); if (fleetOk(f)) YARD.fleet = f.slice();
  YARD.seen = new Set(store.get('vus', []) || []);
}
// pour les tests (outils/fumee.js) et les réglages
window.Amiral = { S, YARD, SHIPS, POWERS, newGame, startBattle, playerAct, aiChoose, act, simulate, openYard, blocked, dailyOf, todayKey, unlocked, gameOver };
buildAll();
setTimeout(resize, 0); resize();
Promise.all(['8px "Press Start 2P"', '700 10px Rajdhani'].map(f => document.fonts ? document.fonts.load(f).catch(() => {}) : null)).then(() => requestAnimationFrame(frame));

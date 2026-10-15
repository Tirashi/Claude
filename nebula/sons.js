/* =====================================================================
   NEBULA · les SONS (session 4, validés par l'utilisateur au banc d'écoute
   maquettes/nebula-sons.html). Tout est synthétisé, sans fichier son.
   - Bruitages calculés échantillon par échantillon une fois (3 variantes
     par son, gardées en cache), puis rejoués : armes et impacts graves et
     étouffés (on les « entend » à travers la coque), bips discrets,
     saut en hyperespace façon Helldivers 2.
   - Ambiances génératives (nœuds Web Audio) : TENSION (combats) et
     GARDE (carte, retenue ; MARCHE gardée en réserve).
   NebulaSons.init(ctx, sortie) puis play(nom, quand, pan), ambience(id).
   ===================================================================== */
(function () {
'use strict';
let A = null, OUT = null, REV = null, NOISE = null;
const TAU = Math.PI * 2;

/* ---------- boîte à outils (échantillon par échantillon) ---------- */
function rng(seed) { let a = seed | 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const SR = () => A.sampleRate;
const arr = d => new Float32Array(Math.ceil(d * SR()));
// filtre biquad à fréquence variable (fc : nombre ou fonction du temps)
function biquad(x, type, fc, Q = .707) {
  const sr = SR(); let b0, b1, b2, a1, a2, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  const set = f => { f = Math.max(20, Math.min(f, sr * .45)); const w = TAU * f / sr, cs = Math.cos(w), sn = Math.sin(w), al = sn / (2 * Q); let n0, n1, n2;
    if (type === 'lp') { n0 = (1 - cs) / 2; n1 = 1 - cs; n2 = n0; } else if (type === 'hp') { n0 = (1 + cs) / 2; n1 = -(1 + cs); n2 = n0; } else { n0 = al; n1 = 0; n2 = -al; }
    const d0 = 1 + al; b0 = n0 / d0; b1 = n1 / d0; b2 = n2 / d0; a1 = -2 * cs / d0; a2 = (1 - al) / d0; };
  const fn = typeof fc === 'function'; if (!fn) set(fc);
  for (let i = 0; i < x.length; i++) { if (fn && (i & 31) === 0) set(fc(i / sr)); const y = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = y; x[i] = y; }
  return x;
}
// passe-bas raide : le son « à travers la coque »
const dull = (x, f = 1200) => biquad(biquad(x, 'lp', f, .6), 'lp', typeof f === 'function' ? t => f(t) * 1.3 : f * 1.3, .6);
const white = (n, r) => { const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = r() * 2 - 1; return x; };
const brown = (n, r) => { const x = new Float32Array(n); let b = 0; for (let i = 0; i < n; i++) { b = (b + .02 * (r() * 2 - 1)) * .998; x[i] = b * 3.5; } return x; };
function addTo(dst, src, g = 1, at = 0) { const o = Math.floor(at * SR()); for (let i = 0; i < src.length && o + i < dst.length; i++) dst[o + i] += src[i] * g; return dst; }
function modal(d, modes, r) { const x = arr(d), sr = SR(); for (const [f, a, tau] of modes) { const ph = r() * TAU; for (let i = 0; i < x.length; i++) { const t = i / sr; x[i] += a * Math.exp(-t / tau) * Math.sin(TAU * f * t + ph); } } return x; }
const env = (t, att, tau) => Math.min(1, t / att) * Math.exp(-t / tau);
function sweepSine(d, f, amp, r, drive = 0) { const x = arr(d), sr = SR(); let ph = r() * TAU; for (let i = 0; i < x.length; i++) { const t = i / sr; ph += TAU * f(t) / sr; let s = Math.sin(ph); if (drive) s = Math.tanh(drive * s); x[i] = s * amp(t); } return x; }
function noiseEnv(d, r, amp, kind) { const n = Math.ceil(d * SR()), x = kind === 'brown' ? brown(n, r) : white(n, r), sr = SR(); for (let i = 0; i < n; i++) x[i] *= amp(i / sr); return x; }
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function sawPad(f, d, att, rel, cut, r) { const x = arr(d), sr = SR(), ps = [r(), r(), r()]; for (let i = 0; i < x.length; i++) { const t = i / sr; let s = 0; [-8, 0, 8].forEach((c, k) => { ps[k] = (ps[k] + f * Math.pow(2, c / 1200) / sr) % 1; s += 2 * ps[k] - 1; }); x[i] = s / 3 * Math.min(1, t / att) * Math.min(1, Math.max(0, (d - t) / rel)); } return biquad(x, 'lp', cut, .8); }
function fmBell(f, d, r, ratio = 3.5, idx = 3, decay = 1.6) { const x = arr(d), sr = SR(); for (let i = 0; i < x.length; i++) { const t = i / sr; x[i] = Math.sin(TAU * f * t + idx * Math.exp(-t / .35) * Math.sin(TAU * f * ratio * t)) * env(t, .003, decay); } return x; }
function toBuffer(L, R, level = .9) {
  R = R || L; let pk = 0; for (const x of [L, R]) for (let i = 0; i < x.length; i++) pk = Math.max(pk, Math.abs(x[i]));
  const g = pk ? level / pk : 1, n = Math.max(L.length, R.length), b = A.createBuffer(2, n, SR()), f = Math.floor(SR() * .005);
  [L, R].forEach((x, ch) => { const d = b.getChannelData(ch); for (let i = 0; i < x.length; i++) d[i] = x[i] * g * Math.min(1, (x.length - i) / f); });
  return b;
}

/* ---------- les bruitages retenus ---------- */
const GEN = {
  // saut en hyperespace (choix : V1) : le moteur monte en puissance 2 s, l'air est aspiré, un instant de vide, puis un « vwOOM » lourd
  saut: r => { const d = 4, x = arr(d), sr = SR(), T = 2; let p1 = 0, p2 = 0, p3 = 0;
    for (let i = 0; i < x.length && i / sr < T; i++) { const t = i / sr, u = t / T, f = 38 + 30 * u * u;
      p1 = (p1 + f / sr) % 1; p2 = (p2 + f * 1.012 / sr) % 1; p3 += TAU * f * 2 / sr;
      x[i] = ((2 * p1 - 1) + (2 * p2 - 1)) * .5 * (.15 + .85 * u * u) + Math.sin(p3) * .3 * u * u * u; }
    biquad(x, 'lp', t => 150 + 900 * Math.pow(Math.min(1, t / T), 2), 1.4);
    addTo(x, biquad(noiseEnv(T, r, t => Math.pow(t / T, 4) * .9), 'bp', t => 200 + 1600 * Math.pow(t / T, 2), 1.8));
    const boom = arr(d - T - .07);
    addTo(boom, sweepSine(d - T - .07, t => 22 + 60 * Math.exp(-t / .12), t => env(t, .003, .8), r, 3), 1.2);
    addTo(boom, dull(noiseEnv(d - T - .07, r, t => env(t, .004, .7) * 1.2, 'brown'), 600));
    addTo(boom, dull(noiseEnv(.12, r, t => env(t, .0005, .03)), 1500), .5);
    addTo(x, boom, 1, T + .07);
    return toBuffer(biquad(x, 'hp', 18), null, .9); },
  // canon (choix : la « torpille V1 ») : une lourde poussée grave
  canon: r => { const d = .9, x = arr(d);
    addTo(x, sweepSine(d, t => 30 + 30 * Math.exp(-t / .12), t => env(t, .01, .3), r, 2.5));
    addTo(x, dull(noiseEnv(d, r, t => env(t, .02, .25) * .7, 'brown'), 320));
    return toBuffer(biquad(x, 'hp', 25), null, .55); },
  // laser (V1) : une décharge étouffée qui glisse vers le grave
  laser: r => { const x = arr(.32), sr = SR(); let p = r();
    for (let i = 0; i < x.length; i++) { const t = i / sr; p = (p + (90 + 220 * Math.exp(-t / .05)) / sr) % 1; x[i] = (2 * p - 1) * env(t, .004, .07); }
    addTo(x, sweepSine(.2, t => 70, t => env(t, .003, .05) * .6, r));
    return toBuffer(biquad(dull(x, 900), 'hp', 40), null, .5); },
  // missile (V1) : départ sourd, puis le moteur qui gronde et s'éloigne
  missile: r => { const d = .8, x = arr(d), sr = SR();
    addTo(x, sweepSine(.25, t => 42 + 50 * Math.exp(-t / .03), t => env(t, .001, .07), r, 2.5));
    const m = brown(x.length, r); let am = 1, tgt = 1;
    for (let i = 0; i < m.length; i++) { const t = i / sr; if (i % 1500 === 0) tgt = .5 + .5 * r(); am += (tgt - am) * .003; m[i] *= am * env(t, .05, .28); }
    addTo(x, dull(m, 450), .9);
    return toBuffer(biquad(x, 'hp', 30), null, .5); },
  // torpille (V2) : une charge qui gronde, puis le départ
  torpille: r => { const d = 1, x = arr(d), sr = SR(); let p = 0;
    for (let i = 0; i < x.length; i++) { const t = i / sr; p = (p + (45 + 25 * Math.min(1, t / .3)) / sr) % 1; x[i] = (2 * p - 1) * (t < .3 ? t / .3 * .4 : .4 * Math.exp(-(t - .3) / .15)); }
    dull(x, 260);
    addTo(x, sweepSine(.7, t => 28 + 40 * Math.exp(-t / .08), t => env(t, .003, .25), r, 2.5), 1, .3);
    return toBuffer(biquad(x, 'hp', 22), null, .6); },
  // impact sur le bouclier (V2) : une vibration courte
  bouclier: r => { const d = .4, x = arr(d); addTo(x, sweepSine(d, t => 140, t => (.6 + .4 * Math.sin(TAU * 40 * t)) * env(t, .006, .1), r)); addTo(x, dull(noiseEnv(.2, r, t => env(t, .002, .03)), 500), .6); return toBuffer(biquad(x, 'hp', 50), null, .45); },
  // impact sur la coque (V1) : un « donk » de structure, grave et court
  coque: r => { const d = .5, x = arr(d), b = 85 + 15 * r();
    addTo(x, modal(d, [[b, 1, .16], [b * 1.62, .7, .11], [b * 2.4, .45, .07], [b * 3.3, .3, .05]], r), .5);
    addTo(x, dull(noiseEnv(.06, r, t => env(t, .0005, .015)), 800), .6);
    addTo(x, sweepSine(.2, t => 40 + 30 * Math.exp(-t / .03), t => env(t, .001, .07), r, 2));
    return toBuffer(biquad(dull(x, 1400), 'hp', 30), null, .6); },
  // explosion (V1 et V2 en alternance) : un boum profond et étouffé
  explosion: r => { const long = r() < .5, d = long ? 1.6 : .9, x = arr(d);
    addTo(x, sweepSine(d, t => (long ? 24 : 30) + (long ? 34 : 30) * Math.exp(-t / (long ? .2 : .1)), t => env(t, .004, long ? .55 : .3), r, long ? 2.5 : 3));
    addTo(x, dull(noiseEnv(d, r, t => env(t, .006, long ? .5 : .25) * 1.1, 'brown'), long ? 420 : 600));
    if (long) for (let k = 0; k < 8; k++) { const at = .08 + r() * .7; addTo(x, dull(noiseEnv(.05, r, t => 1 - t / .05), 900), .2 * Math.exp(-at / .5), at); }
    return toBuffer(biquad(x, 'hp', 22), null, .75); },
  // bips : sélection (V1) et validation (V2)
  bip: r => { const x = arr(.06); addTo(x, sweepSine(.06, () => 1500, t => env(t, .004, .018), r)); return toBuffer(biquad(x, 'lp', 3000), null, .12); },
  valide: r => { const x = arr(.08); addTo(x, sweepSine(.03, () => 1250, t => env(t, .003, .012), r)); addTo(x, sweepSine(.03, () => 1870, t => env(t, .003, .012), r), .8, .04); return toBuffer(biquad(x, 'lp', 3000), null, .1); },
  // victoire : un accord doux qui s'ouvre
  victoire: r => { const x = arr(1.6); addTo(x, sawPad(mtof(62), 1.5, .35, .8, 900, r), .5); addTo(x, sawPad(mtof(69), 1.5, .35, .8, 900, r), .4); addTo(x, sawPad(mtof(74), 1.5, .35, .8, 1100, r), .3); return toBuffer(x, null, .3); },
  // défaite (V2 creusée) : un boum lointain, un accord sombre qui retombe et se ferme, une note de cor qui descend
  defaite: r => defeat(r, 1),
  defaiteB: r => defeat(r, 2),
  // sons secondaires, dans le même esprit étouffé
  grappin: r => { const d = .35, x = arr(d); addTo(x, modal(d, [[310, 1, .08], [505, .6, .06], [770, .4, .04]], r), .5); addTo(x, dull(noiseEnv(.05, r, t => env(t, .0005, .01)), 1500), .6); return toBuffer(biquad(dull(x, 1800), 'hp', 80), null, .4); },
  treuil: r => { const d = .5, x = arr(d), sr = SR(); let p = 0; for (let i = 0; i < x.length; i++) { const t = i / sr; p = (p + (55 + 30 * t) / sr) % 1; x[i] = (2 * p - 1) * (.6 + .4 * Math.sin(TAU * 22 * t)) * env(t, .03, .3); } return toBuffer(biquad(dull(x, 380), 'hp', 35), null, .35); },
  ion: r => { const d = .25, x = arr(d), sr = SR(); for (let i = 0; i < x.length; i++) { const t = i / sr; if (r() < 700 * Math.exp(-t / .08) / sr) x[i] = (r() * 2 - 1); } return toBuffer(dull(x, 2200), null, .3); },
  renforts: r => { const d = 1.1, x = arr(d); addTo(x, sweepSine(d, t => 26 + 50 * Math.exp(-t / .1), t => env(t, .002, .4), r, 3)); addTo(x, dull(noiseEnv(d, r, t => env(t, .003, .3), 'brown'), 500)); return toBuffer(biquad(x, 'hp', 22), null, .45); },
  soin: r => { const x = arr(.3); addTo(x, sweepSine(.12, () => 990, t => env(t, .005, .03), r)); addTo(x, sweepSine(.12, () => 1320, t => env(t, .005, .04), r), .8, .08); return toBuffer(biquad(x, 'lp', 3000), null, .12); },
  marque: r => { const x = arr(.1); addTo(x, sweepSine(.08, () => 2000, t => env(t, .003, .02), r)); return toBuffer(biquad(x, 'lp', 3500), null, .1); },
  mine: r => { const d = .4, x = arr(d); addTo(x, modal(d, [[190, 1, .1], [300, .6, .07]], r), .5); addTo(x, dull(noiseEnv(.08, r, t => env(t, .001, .02)), 700), .5); return toBuffer(biquad(x, 'hp', 60), null, .35); },
};
function defeat(r, v) {
  const d = 4.2, L = arr(d), R = arr(d);
  // le boum lointain de la flotte perdue
  const boom = sweepSine(1.4, t => 24 + 24 * Math.exp(-t / .2), t => env(t, .01, .5), r, 2), rum = dull(noiseEnv(1.6, r, t => env(t, .02, .5), 'brown'), 300);
  for (const x of [L, R]) { addTo(x, boom, .55); addTo(x, rum, .4); }
  // l'accord sombre qui retombe d'un demi-ton et se ferme
  const ch = v === 1 ? [[50, 57, 62, 65], [49, 56, 61, 64]] : [[50, 53, 57, 60], [46, 50, 53, 58]];
  ch.forEach((notes, j) => notes.forEach((m, k) => { const p = sawPad(mtof(m), 2.4, .5, 1.1, t => 900 - 280 * t, r); addTo(k % 2 ? R : L, p, .16, .3 + j * 1.5); addTo(k % 2 ? L : R, p, .08, .3 + j * 1.5); }));
  // une note de cor qui descend (scie filtrée, vibrato lent)
  const horn = arr(2.6), sr = SR(); let p = 0; const seq = v === 1 ? [[69, 0, .9], [65, .9, .7], [62, 1.6, 1]] : [[62, 0, .8], [60, .8, .7], [57, 1.5, 1.1]];
  for (const [m, at, len] of seq) for (let i = Math.floor(at * sr); i < Math.min(horn.length, (at + len) * sr); i++) { const t = i / sr - at; p = (p + mtof(m) * (1 + .004 * Math.sin(TAU * 5 * t)) / sr) % 1; horn[i] += (2 * p - 1) * Math.min(1, t / .12) * Math.min(1, (len - t) / .15); }
  dull(horn, 1300); addTo(L, horn, .22, .9); addTo(R, horn, .22, .92);
  return toBuffer(L, R, .45);
}
const REVAMT = { saut: .3, canon: .1, laser: .06, missile: .1, torpille: .12, bouclier: .08, coque: .06, explosion: .18, victoire: .2, defaite: .25, defaiteB: .25, renforts: .15, grappin: .08, treuil: .06 };
const CACHE = {};
function variant(k) { if (!CACHE[k]) CACHE[k] = [0, 1, 2].map(s => GEN[k](rng(1000 + s * 7919 + k.length * 31))); const l = CACHE[k]; return l[Math.floor(Math.random() * l.length)]; }
// fabrique d'avance un son (appelée au repos, un par image, pour ne pas faire d'à-coup)
function warm(k) { if (A && GEN[k] && !CACHE[k]) variant(k); }
const FIXED = new Set(['bip', 'valide', 'victoire', 'defaite', 'defaiteB', 'soin', 'marque', 'saut']);
function play(k, when = 0, pan = 0, vol = 1) {
  if (!A || !GEN[k]) return;
  const s = A.createBufferSource(), g = A.createGain(), p = A.createStereoPanner(), t = Math.max(A.currentTime, when);
  s.buffer = variant(k); s.playbackRate.value = FIXED.has(k) ? 1 : 1 + (Math.random() - .5) * .06; g.gain.value = vol; p.pan.value = Math.max(-1, Math.min(1, pan));
  s.connect(g); g.connect(p); p.connect(OUT);
  const rv = REVAMT[k]; if (rv && REV) { const sd = A.createGain(); sd.gain.value = rv; p.connect(sd); sd.connect(REV); }
  s.start(t);
}
// réverbération : premières réflexions puis queue qui s'assombrit
function impulse(sec, decay) {
  const sr = SR(), n = Math.floor(sr * sec), b = A.createBuffer(2, n, sr);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); let lp = 0;
    for (let i = 0; i < n; i++) { const t = i / sr, k = .15 + .8 * Math.exp(-t * 5); lp += k * ((Math.random() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - i / n, decay); }
    for (const [ms, g] of [[11, .5], [19, .35], [27, .3], [41, .22]]) { const i = Math.floor((ms + ch * 3) * sr / 1000); if (i < n) d[i] += g; } }
  return b;
}
function init(ctx, dest) {
  if (A === ctx) return; A = ctx;
  const comp = A.createDynamicsCompressor(); comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 5; comp.attack.value = .002; comp.release.value = .2; comp.connect(dest);
  OUT = A.createGain(); OUT.gain.value = .8; OUT.connect(comp);
  REV = A.createConvolver(); REV.buffer = impulse(1.2, 3.2); const wet = A.createGain(); wet.gain.value = .7; REV.connect(wet); wet.connect(comp);
  const n = A.sampleRate * 2; NOISE = A.createBuffer(1, n, A.sampleRate); const dd = NOISE.getChannelData(0); for (let i = 0; i < n; i++) dd[i] = Math.random() * 2 - 1;
  init.dest = dest;
}

/* ---------- ambiances génératives ---------- */
let AMB = null;
function stopAmb(fade = 1.5) {
  if (!AMB) return; const a = AMB, t = A.currentTime; AMB = null;
  a.timers.forEach(clearInterval); a.out.gain.cancelScheduledValues(t); a.out.gain.setValueAtTime(a.out.gain.value, t); a.out.gain.linearRampToValueAtTime(0, t + fade);
  setTimeout(() => { a.stops.forEach(o => { try { o.stop(); } catch (e) {} }); a.out.disconnect(); }, fade * 1000 + 200);
}
// mixage : les ambiances restent environ 15 dB sous les bruitages (mesure : -32 dB efficaces contre -17 à -25 dB pour les tirs)
const AMB_GAIN = .12;
// id : 'tension' (combats), 'marche' ou 'garde' (carte), null = silence ; on ne fait rien si l'ambiance demandée joue déjà
function ambience(id, vol = 1) {
  if (!A) return;
  if ((AMB && AMB.id) === id) return;
  stopAmb(); if (!id) return;
  const out = A.createGain(), t0 = A.currentTime, a = { id, out, timers: [], stops: [] }; AMB = a;
  out.gain.setValueAtTime(0, t0); out.gain.linearRampToValueAtTime(vol * AMB_GAIN, t0 + 3);
  const comp = A.createDynamicsCompressor(); comp.threshold.value = -24; comp.ratio.value = 3; comp.connect(init.dest); out.connect(comp);
  const rev = A.createConvolver(); rev.buffer = impulse(id === 'tension' ? 2.8 : 3.5, 2); const wet = A.createGain(); wet.gain.value = .7; rev.connect(wet); wet.connect(out);
  const dry = A.createGain(); dry.connect(out);
  const send = (node, amt) => { const g = A.createGain(); g.gain.value = amt; node.connect(g); g.connect(rev); node.connect(dry); };
  const live = () => AMB === a;
  // écho ping-pong filtré
  const bt = 60 / (id === 'tension' ? 84 : id === 'garde' ? 66 : 76);
  const echoIn = A.createGain(), dl = A.createDelay(2), dr = A.createDelay(2), fb = A.createGain(), lf = A.createBiquadFilter(), pl = A.createStereoPanner(), pr = A.createStereoPanner();
  dl.delayTime.value = bt * .75; dr.delayTime.value = bt * .75; fb.gain.value = .35; lf.type = 'lowpass'; lf.frequency.value = 2400; pl.pan.value = -.8; pr.pan.value = .8;
  echoIn.connect(dl); dl.connect(pl); dl.connect(dr); dr.connect(pr); dr.connect(lf); lf.connect(fb); fb.connect(dl);
  const eo = A.createGain(); eo.gain.value = .5; pl.connect(eo); pr.connect(eo); send(eo, .6);
  // chorus stéréo des nappes
  const chorusIn = A.createGain(), cout = A.createGain(); chorusIn.connect(cout);
  [[-.9, .012, .21], [.9, .017, .27]].forEach(([pan, base, rate]) => { const d = A.createDelay(.1), l = A.createOscillator(), lg = A.createGain(), p = A.createStereoPanner(); d.delayTime.value = base; l.frequency.value = rate; lg.gain.value = .003; l.connect(lg); lg.connect(d.delayTime); l.start(); a.stops.push(l); p.pan.value = pan; chorusIn.connect(d); d.connect(p); p.connect(cout); });
  send(cout, .6);
  const padVoice = (m, t, len, v, cut, type = 'sawtooth') => { const f = A.createBiquadFilter(), g = A.createGain(); f.type = 'lowpass'; f.Q.value = .6;
    f.frequency.setValueAtTime(cut * .6, t); f.frequency.linearRampToValueAtTime(cut, t + len * .45); f.frequency.linearRampToValueAtTime(cut * .55, t + len);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + len * .3); g.gain.setValueAtTime(v, t + len * .62); g.gain.linearRampToValueAtTime(.0001, t + len);
    for (const c of [-14, -6, 0, 6, 14]) { const o = A.createOscillator(); o.type = type; o.frequency.value = mtof(m); o.detune.value = c + (Math.random() - .5) * 4; o.connect(f); o.start(t); o.stop(t + len + .1); }
    f.connect(g); g.connect(chorusIn); };
  const sub = (m, t, len, v) => { const o = A.createOscillator(), g = A.createGain(); o.frequency.value = mtof(m); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + len * .4); g.gain.linearRampToValueAtTime(.0001, t + len); o.connect(g); g.connect(dry); o.start(t); o.stop(t + len + .1); };
  const bufPlay = (buf, t, v, pan = 0, toEcho = false, rv = .25) => { const s = A.createBufferSource(), g = A.createGain(), p = A.createStereoPanner(); s.buffer = buf; g.gain.value = v; p.pan.value = pan; s.connect(g); g.connect(p); p.connect(dry); if (toEcho) p.connect(echoIn); const sd = A.createGain(); sd.gain.value = rv; p.connect(sd); sd.connect(rev); s.start(t); };
  const BUF = {}, once = (k, f) => BUF[k] || (BUF[k] = f());
  const pluck = m => once('p' + m, () => { const sr = SR(), N = Math.round(sr / mtof(m)), x = new Float32Array(Math.ceil(1.4 * sr)), r = rng(m); for (let i = 0; i < N; i++) x[i] = r() * 2 - 1; for (let i = N + 1; i < x.length; i++) x[i] = .5 * (x[i - N] + x[i - N - 1]) * .994; return toBuffer(biquad(x, 'lp', 2400), null, .9); });
  const drum = () => once('drum', () => { const r = rng(7), x = arr(.7); addTo(x, sweepSine(.7, t => 45 + 40 * Math.exp(-t / .05), t => env(t, .002, .22), r, 2)); addTo(x, biquad(noiseEnv(.2, r, t => env(t, .001, .04)), 'lp', 500), .5); return toBuffer(x, null, .9); });
  const timbale = () => once('timb', () => { const r = rng(9), x = arr(1.2); addTo(x, sweepSine(1.2, t => 62 + 18 * Math.exp(-t / .03), t => env(t, .002, .45), r, 1.5)); addTo(x, dull(noiseEnv(.3, r, t => env(t, .001, .05)), 900), .4); return toBuffer(x, null, .9); });
  const caisse = k => once('cc' + k, () => { const r = rng(20 + k), x = arr(.25); addTo(x, biquad(noiseEnv(.25, r, t => env(t, .001, .05)), 'bp', 1700, .9), 1); addTo(x, sweepSine(.1, () => 190, t => env(t, .001, .03), r), .4); return toBuffer(dull(x, 3200), null, .9); });
  const bell = m => once('b' + m, () => toBuffer(fmBell(mtof(m), 3, rng(m), 3.5, 2.2, 1.6), null, .9));
  const cor = (m, len) => once('cor' + m + '_' + len, () => { const sr = SR(), x = arr(len + .4); let p = 0, q = 0; for (let i = 0; i < x.length; i++) { const t = i / sr, vib = 1 + .005 * Math.sin(TAU * 5 * t) * Math.min(1, t / .5); p = (p + mtof(m) * vib / sr) % 1; q = (q + mtof(m) * 1.003 * vib / sr) % 1; x[i] = ((2 * p - 1) + (2 * q - 1)) * .5 * Math.min(1, t / .09) * Math.min(1, Math.max(0, (len - t) / .3)); }
    biquad(x, 'lp', t => 500 + 1400 * Math.min(1, t / .12) * (.7 + .3 * Math.exp(-t / .6)), 1.1); return toBuffer(x, null, .9); });
  const wind = (v, cut) => { const s = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain(), l = A.createOscillator(), lg = A.createGain(); s.buffer = NOISE; s.loop = true; f.type = 'bandpass'; f.Q.value = 1.5; f.frequency.value = cut; l.frequency.value = .05; lg.gain.value = cut * .6; l.connect(lg); lg.connect(f.frequency); g.gain.value = v; s.connect(f); f.connect(g); send(g, .6); s.start(); l.start(); a.stops.push(s, l); };

  if (id === 'tension') {
    const step8 = bt / 2;
    const pad = () => { if (!live()) return; const t = A.currentTime + .1; sub(26, t, 18, .3); padVoice(50, t, 18, .02, 500); padVoice(51, t, 18, .012, 420); padVoice(57, t, 18, .014, 600); };
    pad(); a.timers.push(setInterval(pad, 16000));
    const ARP = [[62, 62, 65, 62, 69, 62, 67, 65], [62, 62, 65, 62, 70, 62, 69, 67]];
    let step = 0, next = A.currentTime + .15;
    const sched = () => { if (!live()) return; while (next < A.currentTime + .3) {
      const bar = Math.floor(step / 8), s8 = step % 8, ph = ARP[Math.floor(bar / 2) % 2];
      if (bar % 8 >= 1) bufPlay(pluck(ph[s8] - (bar % 4 === 3 && s8 > 3 ? 12 : 0)), next, s8 % 2 ? .1 : .16, s8 % 2 ? .35 : -.35, true, .1);
      if (s8 === 0) bufPlay(drum(), next, .8); if (s8 === 3) bufPlay(drum(), next, .45); if (s8 === 4 && bar % 2) bufPlay(drum(), next, .6); if (s8 === 6) bufPlay(drum(), next, .35);
      if (step % 64 === 32) bufPlay(bell(81), next, .05, -.4, true, .8);
      step++; next += step8; } };
    a.timers.push(setInterval(sched, 60)); sched();
    wind(.015, 300);
  } else if (id === 'marche' || id === 'garde') {
    // carte : une marche militaire, retenue (marche) ou plus héroïque (garde)
    const hero = id === 'garde', bar = bt * 4;
    // accords sur 2 mesures : ré mineur, si bémol, sol mineur, la (marche) ; ré, si bémol, do, ré (garde)
    const CH = hero ? [[38, 50, 57, 62, 66], [34, 50, 53, 58, 62], [36, 52, 55, 60, 64], [38, 50, 57, 62, 66]]
                    : [[38, 50, 53, 57, 62], [34, 50, 53, 58, 62], [31, 50, 55, 58, 62], [33, 49, 52, 57, 61]];
    let k = 0;
    const chord = () => { if (!live()) return; const t = A.currentTime + .1, ch = CH[k++ % CH.length], len = bar * 2 + 1.5;
      sub(ch[0], t, len, .2); ch.slice(1).forEach((m, i) => padVoice(m, t, len, hero ? .02 : .016, (hero ? 1100 : 800) + i * 100)); };
    chord(); a.timers.push(setInterval(chord, bar * 2 * 1000));
    // rythme : caisse claire feutrée (ra-ta-plan), timbale sur le 1 (et le 3 pour la garde), cordes graves en croches
    const S16 = bt / 4; let step = 0, next = A.currentTime + .15, crow = 0;
    const SN = hero ? [1, 0, .4, .5, 1, 0, .4, 0, 1, 0, .4, .5, .8, .5, .7, .9] : [1, 0, 0, .45, .7, 0, .35, 0, 1, 0, 0, .45, .7, .35, .5, .6];
    const motif = hero ? [[62, 0, 1], [69, 1, .5], [69, 1.5, .5], [74, 2, 2]] : [[62, 0, 1.5], [65, 1.5, .5], [69, 2, 1], [67, 3, 1], [65, 4, 2]];
    const sched = () => { if (!live()) return; while (next < A.currentTime + .3) {
      const b = Math.floor(step / 16), s = step % 16, ch = CH[Math.floor(b / 2) % CH.length];
      if (SN[s] && b % 8 !== 7) bufPlay(caisse(s % 3), next, SN[s] * (hero ? .22 : .16), .15, false, .2);
      if (s === 0 || (hero && s === 8)) bufPlay(timbale(), next, s ? .45 : .6, 0, false, .3);
      if (s % 2 === 0 && b % 8 >= 2) bufPlay(pluck(ch[0] + 12 + (s % 8 === 4 ? 7 : 0)), next, .14, s % 4 ? .3 : -.3, false, .1);
      // un appel de cor toutes les 8 mesures
      if (s === 0 && b % 8 === 4) for (const [m, at, len] of motif) bufPlay(cor(m, len * bt), next + at * bt, hero ? .16 : .12, -.2, true, .4);
      step++; next += S16; } };
    a.timers.push(setInterval(sched, 50)); sched();
    wind(.012, 400);
  }
}
window.NebulaSons = { init, play, warm, ambience, stop: stopAmb, GEN, LIST: Object.keys(GEN), current: () => AMB && AMB.id, cached: () => Object.keys(CACHE) };
})();

/* =====================================================================
   ROMET · les SONS (Web Audio, tout est synthétisé, rien à télécharger).
   Bruitages : pièce lâchée, tintement des gains, bonus, trésor, mur, courant,
   clous, couloirs, fin de partie, machine terminée.
   Ambiance de chaque monde, jouée ~12 dB sous les bruitages et programmée
   un quart de seconde à l'avance (tic() à chaque image) :
   foire = valse d'orgue de foire, ruche = bourdonnement, épave = houle et
   bulles, casino = arpège électronique, foire de nuit = valse en mineur,
   plus lente, horloger = tic-tac et carillon, machine secrète = musique 8 bits.
   Le contexte audio naît au premier toucher (règle des navigateurs).
   ===================================================================== */
(function () {
'use strict';
let ac = null, sortie, gBruit, gAmb, monde = null, prochain = 0, n = 0, fixes = [], regl = { sons: true, ambiance: true };
const note = m => 440 * Math.pow(2, (m - 69) / 12);   // numéro MIDI → fréquence

function init() {
  if (ac) return true;
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return false; }
  sortie = ac.createDynamicsCompressor(); sortie.connect(ac.destination);
  gBruit = ac.createGain(); gBruit.connect(sortie); gAmb = ac.createGain(); gAmb.gain.value = .25; gAmb.connect(sortie);
  regler(regl); if (monde) demarrer(); return true;
}
// une note simple : oscillateur et enveloppe ; t = instant (sinon maintenant), dest = bruitages ou ambiance
function bip(f, dur, type, vol, t, dest, glisse) {
  if (!ac) return; t = t || ac.currentTime; const o = ac.createOscillator(), g = ac.createGain();
  o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t); if (glisse) o.frequency.exponentialRampToValueAtTime(glisse, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .12, t + .005); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(g).connect(dest || gBruit); o.start(t); o.stop(t + dur + .02);
}
let bruitBuf = null;
function bruitBlanc() { if (bruitBuf) return bruitBuf; const b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return bruitBuf = b; }
function souffle(dur, f, vol, t, dest) {   // bruit filtré (vague, souffle)
  if (!ac) return; t = t || ac.currentTime; const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = bruitBlanc(); fl.type = 'bandpass'; fl.frequency.value = f; fl.Q.value = .8;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + dur * .3); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  s.connect(fl).connect(g).connect(dest || gBruit); s.start(t); s.stop(t + dur + .05);
}

// --- ambiances : pas (durée d'un temps) et jouer(i, t) ; fixe() installe un son continu ---
const valse = (gamme, accords, bpm, mineur) => ({ pas: 60 / bpm, jouer(i, t) {
  const mesure = Math.floor(i / 3) % accords.length, a = accords[mesure], tps = i % 3;
  if (tps === 0) bip(note(a[0] - 12), .4, 'square', .05, t, gAmb); else bip(note(a[1]), .22, 'triangle', .035, t, gAmb), bip(note(a[2]), .22, 'triangle', .03, t, gAmb);
  if (Math.random() < (mineur ? .55 : .7)) { const m = gamme[Math.floor(Math.random() * gamme.length)]; bip(note(m + 12), .3, 'triangle', .045, t, gAmb); bip(note(m + 12) * 1.004, .3, 'sine', .02, t, gAmb); } } });
const AMB = {
  foire: valse([60, 62, 64, 65, 67, 69, 71, 72], [[48, 64, 67], [43, 62, 65], [43, 62, 67], [48, 64, 67]], 168),
  nuit: valse([57, 59, 60, 62, 64, 65, 68, 69], [[45, 60, 64], [40, 59, 62], [40, 59, 64], [45, 60, 64]], 120, true),
  ruche: { pas: .5, fixe() { // deux scies proches, filtrées, dont le volume ondule : l'essaim
      const fl = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(); fl.type = 'lowpass'; fl.frequency.value = 520; g.gain.value = .05;
      lfo.frequency.value = .25; lg.gain.value = .03; lfo.connect(lg).connect(g.gain); fl.connect(g).connect(gAmb); lfo.start();
      const os = [208, 211.5, 104.5].map(f => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.connect(fl); o.start(); return o; });
      return os.concat([lfo]); },
    jouer(i, t) { if (Math.random() < .15) bip(380 + Math.random() * 120, .35, 'sawtooth', .012, t, gAmb, 300); } },
  epave: { pas: .5, jouer(i, t) { if (i % 14 === 0) souffle(6, 380, .16, t, gAmb);   // une vague toutes les 7 s
      if (Math.random() < .2) bip(500 + Math.random() * 500, .12, 'sine', .03, t, gAmb, 1400 + Math.random() * 600); } },   // bulles
  casino: { pas: 60 / 118 / 4, jouer(i, t) { const acc = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 56, 59, 64]][Math.floor(i / 32) % 4];
      bip(note(acc[i % 4] + 12), .12, 'square', .018, t, gAmb); if (i % 8 === 0) bip(note(acc[0] - 12), .35, 'sawtooth', .035, t, gAmb); } },
  horloger: { pas: .5, jouer(i, t) { bip(i % 2 ? 1700 : 2300, .025, 'square', .03, t, gAmb);
      if (i % 120 === 0) [64, 68, 66, 59].forEach((m, k) => bip(note(m + 12), 1.6, 'sine', .05, t + k * .55, gAmb)); } },   // carillon toutes les minutes
  secrete: { pas: 60 / 140 / 2, jouer(i, t) { const basse = [45, 45, 52, 52, 50, 50, 52, 47][Math.floor(i / 8) % 8], mel = [69, 72, 76, 72, 74, 72, 69, 67];
      if (i % 2 === 0) bip(note(basse - 12 + (i % 4 ? 12 : 0)), .14, 'square', .03, t, gAmb); if (Math.random() < .5) bip(note(mel[(i * 3 + Math.floor(i / 16)) % 8]), .1, 'square', .02, t, gAmb); } },
};
function arreter() { for (const o of fixes) try { o.stop(); } catch (e) {} fixes = []; }
function demarrer() { arreter(); if (!ac || !monde) return; const a = AMB[monde]; if (a && a.fixe && regl.ambiance) fixes = a.fixe(); prochain = ac.currentTime + .1; n = 0; }
function regler(r) { Object.assign(regl, r); if (!ac) return; gBruit.gain.value = regl.sons ? 1 : 0; gAmb.gain.value = regl.ambiance ? .25 : 0;
  const a = AMB[monde]; if (a && a.fixe) { if (regl.ambiance && !fixes.length) fixes = a.fixe(); if (!regl.ambiance) arreter(); } }

window.RometSons = {
  init, regler,
  monde(id) { if (id === monde) return; monde = id; demarrer(); },
  // à chaque image : programme les notes du quart de seconde qui vient
  tic() { if (!ac || !regl.ambiance || ac.state !== 'running') return; const a = AMB[monde]; if (!a) return;
    if (prochain < ac.currentTime) prochain = ac.currentTime + .05;
    while (prochain < ac.currentTime + .25) { a.jouer(n++, prochain); prochain += a.pas; } },
  pause(oui) { if (!ac) return; if (oui) ac.suspend(); else ac.resume(); },
  lache: () => bip(500, .05, 'square', .04),
  tinte: () => { bip(2100 + Math.random() * 500, .12); setTimeout(() => bip(2900, .08, 'sine', .06), 40); },
  carillon: () => { bip(1600, .3, 'sine', .1); setTimeout(() => bip(2400, .4, 'sine', .08), 120); setTimeout(() => bip(3200, .5, 'sine', .06), 260); },
  bonus: () => { bip(880, .12, 'triangle', .07); setTimeout(() => bip(1320, .15, 'triangle', .06), 90); },
  mur: () => bip(700, .3, 'sawtooth', .05), finMur: () => bip(400, .2, 'sawtooth', .04),
  courant: () => souffle(2, 300, .25),
  clous: k => { for (let i = 1; i <= k; i++) setTimeout(() => bip(1800 + Math.random() * 600, .03, 'square', .025), i * 70); },
  couloirs: () => bip(1200, .06, 'square', .03),
  fin: () => [72, 67, 64, 60].forEach((m, k) => setTimeout(() => bip(note(m), .3, 'triangle', .08), k * 160)),
  finie: () => [60, 64, 67, 72, 76, 79, 84].forEach((m, k) => setTimeout(() => bip(note(m), .35, 'triangle', .08), k * 90)),
};
})();

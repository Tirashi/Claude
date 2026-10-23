/* =====================================================================
   BANNIÈRES · les SONS, synthétisés (WebAudio, aucun fichier) : choc
   d'épées, boule de feu, pièces, petit « toc » des boutons, fanfare.
   Discrets ; coupés par le bouton SONS (sauvegardé dans bannieres.opts).
   ===================================================================== */
'use strict';
const Sons = (function () {
  let ctx = null, actif = true;
  const audio = () => { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; } catch (e) { return null; } };
  // un bruit filtré qui s'éteint vite
  function bruit(duree, freq, vol, type = 'bandpass') {
    const a = actif && audio(); if (!a) return;
    const n = Math.floor(a.sampleRate * duree), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    let x = 7; for (let i = 0; i < n; i++) { x = (x * 16807) % 2147483647; d[i] = ((x / 2147483647) * 2 - 1) * Math.exp(-i / (n / 6)) * (0.6 + 0.4 * Math.sin(i * 0.9)); }
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = type; f.frequency.value = freq; g.gain.value = vol;
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  }
  // une petite note (onde carrée douce)
  function note(freq, debut, duree, vol = 0.06, forme = 'square') {
    const a = actif && audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + debut;
    o.type = forme; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + duree + 0.02);
  }
  return {
    get actif() { return actif; }, set actif(v) { actif = !!v; },
    choc: () => bruit(0.12, 3200, 0.25),
    feu: () => bruit(0.35, 600, 0.18, 'lowpass'),
    piece: () => { note(988, 0, 0.08); note(1319, 0.07, 0.16); },
    toc: () => note(440, 0, 0.05, 0.04, 'triangle'),
    batir: () => { bruit(0.08, 900, 0.15); setTimeout(() => bruit(0.08, 900, 0.15), 140); },
    victoire: () => { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, k) => note(f, k * 0.14, k === 6 ? 0.7 : 0.25, 0.07)); [262, 330, 392].forEach((f, k) => note(f, 0.98, 0.7, 0.04, 'triangle')); },
    pas: () => bruit(0.05, 500, 0.06, 'lowpass'),
    fanfare: () => [523, 659, 784, 1047].forEach((f, k) => note(f, k * 0.13, 0.3, 0.07)),
    triste: () => [392, 349, 311].forEach((f, k) => note(f, k * 0.2, 0.35, 0.05, 'triangle')),
  };
})();

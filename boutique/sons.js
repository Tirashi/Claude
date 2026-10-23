/* =====================================================================
   LA BOUTIQUE DE CARTES · les SONS, synthétisés (WebAudio, aucun
   fichier) : « toc » des boutons, tiroir-caisse, carte retournée, booster
   déchiré, éclat d'une rare, petit jingle, fin d'année, et une musique de
   boutique douce (accords lents de piano électrique, très bas).
   Coupés par le menu (SONS, MUSIQUE), sauvegardés dans boutique.opts.
   ===================================================================== */
'use strict';
const BouSons = (function () {
  let ctx = null, sons = true, musique = true, piste = null;
  const audio = () => { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; } catch (e) { return null; } };
  // un bruit filtré qui s'éteint vite
  function bruit(duree, freq, vol, type = 'bandpass', q = 1) {
    const a = sons && audio(); if (!a) return;
    const n = Math.floor(a.sampleRate * duree), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    let x = 7; for (let i = 0; i < n; i++) { x = (x * 16807) % 2147483647; d[i] = ((x / 2147483647) * 2 - 1) * Math.exp(-i / (n / 5)); }
    const s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
  }
  // une note qui s'éteint (vers une sortie donnée : les sons ou la musique)
  function note(freq, debut, duree, vol = 0.06, forme = 'triangle', sortie) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + debut;
    o.type = forme; o.frequency.value = freq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
    o.connect(g); g.connect(sortie || a.destination); o.start(t); o.stop(t + duree + 0.02);
  }
  const jouer = (liste, vol, forme) => { if (sons && audio()) liste.forEach(([f, t, d]) => note(f, t, d, vol, forme)); };
  const N = m => 440 * Math.pow(2, (m - 69) / 12);   // numéro MIDI → fréquence

  /* ---------- la musique de boutique : quatre accords qui tournent, une note de mélodie de temps en temps ---------- */
  const ACCORDS = [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]];   // do maj7, la m7, ré m7, sol 7
  const GAMME = [72, 74, 76, 79, 81, 84];
  function lancerMusique() {
    const a = musique && audio(); if (!a || piste) return;
    const sortie = a.createGain(); sortie.gain.value = 0.5; sortie.connect(a.destination);
    let k = 0, x = 11;
    const tour = () => {
      const A = ACCORDS[k++ % 4];
      A.forEach((m, i) => note(N(m), i * 0.04, 3.6, 0.018, 'sine', sortie));
      note(N(A[0] - 12), 0, 3.4, 0.03, 'sine', sortie);
      for (let b = 0; b < 2; b++) { x = (x * 16807) % 2147483647; if (x % 3) note(N(GAMME[x % GAMME.length]), 0.9 + b * 1.4, 1.2, 0.014, 'triangle', sortie); }
    };
    tour(); piste = { sortie, id: setInterval(tour, 3600) };
  }
  function arreterMusique() {
    if (!piste) return;
    clearInterval(piste.id); const p = piste; piste = null;
    try { p.sortie.gain.setTargetAtTime(0, ctx.currentTime, 0.3); setTimeout(() => p.sortie.disconnect(), 1500); } catch (e) { /* rien à couper */ }
  }
  // l'audio ne démarre qu'après un geste : la musique attend le premier toucher
  addEventListener('pointerdown', () => { if (musique) lancerMusique(); }, { once: true, capture: true });

  return {
    get sons() { return sons; }, set sons(v) { sons = !!v; },
    get musique() { return musique; }, set musique(v) { musique = !!v; if (musique) lancerMusique(); else arreterMusique(); },
    toc: () => bruit(0.04, 1800, 0.18, 'bandpass', 3),
    caisse: () => { bruit(0.08, 4200, 0.12, 'highpass'); jouer([[N(88), 0.05, 0.5], [N(93), 0.12, 0.7]], 0.05, 'sine'); },
    carte: () => bruit(0.09, 2600, 0.22, 'bandpass', 0.8),
    dechire: () => { bruit(0.35, 3000, 0.3, 'highpass'); bruit(0.25, 900, 0.15); },
    eclat: rar => jouer((rar >= 4 ? [76, 79, 83, 86, 88, 91] : rar >= 3 ? [76, 79, 83, 88] : [79, 84]).map((m, i) => [N(m), i * 0.07, 0.6]), 0.05, 'sine'),
    jingle: () => jouer([[N(72), 0, 0.2], [N(76), 0.12, 0.2], [N(79), 0.24, 0.2], [N(84), 0.36, 0.5]], 0.05, 'triangle'),
    poser: () => bruit(0.12, 300, 0.35, 'lowpass'),
    fanfare: () => jouer([[N(67), 0, 0.25], [N(72), 0.2, 0.25], [N(76), 0.4, 0.25], [N(79), 0.6, 0.5], [N(76), 0.95, 0.2], [N(79), 1.1, 0.9], [N(84), 1.1, 0.9]], 0.06, 'square'),
    triste: () => jouer([[N(67), 0, 0.4], [N(63), 0.35, 0.4], [N(60), 0.7, 0.9]], 0.05, 'triangle'),
  };
})();

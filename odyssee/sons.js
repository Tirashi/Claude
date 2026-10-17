/* =====================================================================
   ODYSSÉE : sons et musique, synthétisés en direct (Web Audio, aucun fichier).
   Direction A du banc d'écoute (maquettes/odyssee-sons.html), choisie le 17/10 :
   lyre et flûte, discrète comme Nebula (musique ~15 dB sous les bruitages).
   Ambiances : calme (ré mixolydien), danger (ré phrygien), nuit (ré éolien, lent).
   Usage : OdysseeSons.init() au premier toucher, .actif(oui), .musique(humeur | null),
   .mer(oui), .jouer(nom, volume), .chant(volume).
   ===================================================================== */
const OdysseeSons = (function () {
  'use strict';
  const MUS_GAIN = 0.16, MER_GAIN = 0.55;
  let A = null, M = null, REV = null, MUS = null, BRUIT = null, NB = null, on = true;

  function init() {
    if (A) { if (A.state === 'suspended' && on) A.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    A = new AC();
    const comp = A.createDynamicsCompressor(); comp.connect(A.destination);
    M = A.createGain(); M.gain.value = on ? 0.8 : 0; M.connect(comp);
    REV = A.createConvolver(); const n = A.sampleRate * 2.4, ir = A.createBuffer(2, n, A.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
    REV.buffer = ir; const rg = A.createGain(); rg.gain.value = 0.3; REV.connect(rg).connect(M);
    MUS = A.createGain(); MUS.gain.value = MUS_GAIN; MUS.connect(M);
    BRUIT = A.createGain(); BRUIT.gain.value = 1; BRUIT.connect(M);
  }
  function actif(oui) {
    on = !!oui;
    if (!A) return;
    M.gain.setTargetAtTime(on ? 0.8 : 0, A.currentTime, 0.05);
    if (on && A.state === 'suspended') A.resume();
  }
  const pret = () => A && on && A.state === 'running';
  const bruitBuf = () => { if (!NB) { NB = A.createBuffer(1, A.sampleRate * 2, A.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return NB; };
  function sortie(node, bus, wet) { node.connect(bus); if (wet) { const s = A.createGain(); s.gain.value = wet; node.connect(s).connect(REV); } }
  function enveloppe(g, t, att, pic, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(pic, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + att + dur); }
  function ton(t, type, f, dur, pic, o = {}) {
    const os = A.createOscillator(), g = A.createGain(); os.type = type; os.frequency.setValueAtTime(f, t);
    if (o.f2) os.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glisse || dur));
    if (o.vib) { const l = A.createOscillator(), lg = A.createGain(); l.frequency.value = o.vib; lg.gain.value = f * 0.006; l.connect(lg).connect(os.frequency); l.start(t); l.stop(t + dur + 0.5); }
    let n = os;
    if (o.lp) { const fi = A.createBiquadFilter(); fi.type = 'lowpass'; fi.frequency.setValueAtTime(o.lp, t); if (o.lp2) fi.frequency.linearRampToValueAtTime(o.lp2, t + dur); n.connect(fi); n = fi; }
    enveloppe(g, t, o.att || 0.005, pic, dur); n.connect(g); sortie(g, o.bus || BRUIT, o.wet);
    os.start(t); os.stop(t + (o.att || 0.005) + dur + 0.1);
  }
  function souffle(t, dur, type, f, q, pic, o = {}) {
    const s = A.createBufferSource(); s.buffer = bruitBuf(); s.loop = true;
    const fi = A.createBiquadFilter(); fi.type = type; fi.frequency.setValueAtTime(f, t); fi.Q.value = q;
    if (o.f2) fi.frequency.exponentialRampToValueAtTime(o.f2, t + (o.glisse || dur));
    const g = A.createGain(); enveloppe(g, t, o.att || 0.005, pic, dur);
    s.connect(fi).connect(g); sortie(g, o.bus || BRUIT, o.wet); s.start(t, Math.random()); s.stop(t + (o.att || 0.005) + dur + 0.1);
  }
  // la lyre : corde pincée (Karplus-Strong), mise en cache par hauteur
  const CORDES = {};
  function corde(f) {
    const k = Math.round(f); if (CORDES[k]) return CORDES[k];
    const sr = A.sampleRate, N = Math.round(sr / f), L = Math.round(sr * 2.4), b = A.createBuffer(1, L, sr), d = b.getChannelData(0), anneau = new Float32Array(N);
    for (let i = 0; i < N; i++) anneau[i] = Math.random() * 2 - 1;
    for (let i = 0, p = 0; i < L; i++) { const a = anneau[p], b2 = anneau[(p + 1) % N]; d[i] = a; anneau[p] = (a + b2) * 0.4985; p = (p + 1) % N; }
    return (CORDES[k] = b);
  }
  function lyre(t, f, pic, bus, wet) {
    const s = A.createBufferSource(); s.buffer = corde(f); const fi = A.createBiquadFilter(); fi.type = 'lowpass'; fi.frequency.value = 3200;
    const g = A.createGain(); g.gain.value = pic; s.connect(fi).connect(g); sortie(g, bus || MUS, wet == null ? 0.5 : wet); s.start(t);
  }
  function flute(t, f, dur, pic) {
    ton(t, 'sine', f, dur, pic, { att: 0.12, vib: 5, bus: MUS, wet: 0.5 });
    ton(t, 'triangle', f * 2, dur, pic * 0.12, { att: 0.15, bus: MUS, wet: 0.5 });
    souffle(t, dur * 0.6, 'bandpass', f * 2, 3, pic * 0.25, { att: 0.08, bus: MUS, wet: 0.3 });
  }
  function voix(t, f, dur, pic) {        // une Sirène chante « aaa » (formants), avec vibrato
    const os = A.createOscillator(); os.type = 'sawtooth'; os.frequency.setValueAtTime(f, t);
    const l = A.createOscillator(), lg = A.createGain(); l.frequency.value = 5.5; lg.gain.value = f * 0.012; l.connect(lg).connect(os.frequency);
    const g = A.createGain(); enveloppe(g, t, 0.25, pic, dur);
    for (const [ff, gg] of [[800, 1], [1150, 0.6], [2900, 0.25]]) { const b = A.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = ff; b.Q.value = 8; const bg = A.createGain(); bg.gain.value = gg; os.connect(b).connect(bg).connect(g); }
    sortie(g, BRUIT, 0.7); os.start(t); l.start(t); os.stop(t + dur + 0.6); l.stop(t + dur + 0.6);
  }

  // ---------- la musique : lyre en arpèges, flûte qui improvise ----------
  const NOTE = m => 440 * Math.pow(2, (m - 69) / 12);
  const MODES = {
    calme:  { gamme: [0, 2, 4, 5, 7, 9, 10], accords: [0, 6, 3, 0], tempo: 88 },
    danger: { gamme: [0, 1, 3, 5, 7, 8, 10], accords: [0, 1, 6, 0], tempo: 100 },
    nuit:   { gamme: [0, 2, 3, 5, 7, 8, 10], accords: [0, 5, 6, 4], tempo: 64 },
  };
  let jeu = null;        // { humeur, timer }
  function musique(humeur) {
    if (!A) return;
    if (jeu && jeu.humeur === humeur) return;
    if (jeu) { clearInterval(jeu.timer); jeu = null; }
    if (!humeur) return;
    const H = MODES[humeur], pas = 60 / H.tempo / 2, base = 50;
    let n = 0, suivant = A.currentTime + 0.3, melo = 4;
    const deg = (d, oct) => NOTE(base + 12 * oct + H.gamme[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7));
    const motif = [0, 1, 2, 1, 0, 2, 1, 2];
    jeu = { humeur, timer: setInterval(() => {
      if (!pret()) { suivant = A ? A.currentTime + 0.2 : 0; return; }
      while (suivant < A.currentTime + 0.3) {
        const k = n++, t = suivant, mes = Math.floor(k / 8), p = k % 8, r = H.accords[mes % 4], ac = [r, r + 2, r + 4];
        lyre(t, deg(ac[motif[p]], 1), humeur === 'nuit' ? 0.32 : 0.42);
        if (p === 0 && mes % 2 === 0) lyre(t, deg(ac[0], 0), 0.35);
        if ((p === 0 || p === 4 && Math.random() < 0.5) && Math.random() < 0.8) {
          melo = Math.max(0, Math.min(11, melo + [-2, -1, 1, 2, 0][Math.floor(Math.random() * 5)]));
          flute(t, deg(melo, 2), pas * (p === 0 ? 3.5 : 1.8), humeur === 'nuit' ? 0.1 : 0.14);
        }
        suivant += pas;
      }
    }, 60) };
  }

  // ---------- la mer en fond ----------
  let vague = null;
  function mer(oui) {
    if (!A) return;
    if (oui && !vague) {
      const s = A.createBufferSource(); s.buffer = bruitBuf(); s.loop = true;
      const fi = A.createBiquadFilter(); fi.type = 'lowpass'; fi.frequency.value = 520;
      const g = A.createGain(); g.gain.value = 0.12 * MER_GAIN;
      const l = A.createOscillator(), lg = A.createGain(); l.frequency.value = 0.14; lg.gain.value = 0.1 * MER_GAIN; l.connect(lg).connect(g.gain);
      const l2 = A.createOscillator(), l2g = A.createGain(); l2.frequency.value = 0.09; l2g.gain.value = 260; l2.connect(l2g).connect(fi.frequency);
      s.connect(fi).connect(g); sortie(g, BRUIT, 0.2); s.start(); l.start(); l2.start();
      vague = { g, stop: () => { s.stop(); l.stop(); l2.stop(); } };
    } else if (!oui && vague) {
      const v = vague, t = A.currentTime; vague = null;
      v.g.gain.cancelScheduledValues(t); v.g.gain.setValueAtTime(v.g.gain.value, t); v.g.gain.linearRampToValueAtTime(0.0001, t + 0.8);
      setTimeout(v.stop, 1000);
    }
  }

  // ---------- les bruitages ----------
  const SONS = {
    rame: (t, v) => { souffle(t, 0.22, 'bandpass', 1300, 1.5, 0.12 * v, { att: 0.03, f2: 700, wet: 0.2 }); ton(t, 'triangle', 170, 0.08, 0.04 * v, { f2: 150 }); },
    choc: (t, v) => { ton(t, 'triangle', 140, 0.18, 0.4 * v, { f2: 80, lp: 900 }); souffle(t, 0.06, 'lowpass', 900, 0.7, 0.25 * v); },
    naufrage: t => { souffle(t, 0.25, 'bandpass', 600, 1, 0.4, { f2: 200, wet: 0.3 }); ton(t, 'triangle', 120, 0.3, 0.3, { f2: 50 }); for (let k = 0; k < 6; k++) ton(t + 0.25 + k * 0.09, 'sine', 300 + Math.random() * 400, 0.06, 0.12, { f2: 900 + Math.random() * 400, wet: 0.3 }); },
    reprise: t => { [0, 4, 7].forEach((d, k) => lyre(t + k * 0.09, NOTE(62 + d), 0.4, BRUIT, 0.5)); },
    fleche: t => { souffle(t, 0.7, 'bandpass', 3000, 6, 0.14, { att: 0.5, f2: 1200 }); },
    feu: t => { souffle(t, 0.4, 'highpass', 2500, 0.7, 0.22, { wet: 0.2 }); for (let k = 0; k < 8; k++) souffle(t + k * 0.05, 0.03, 'bandpass', 2000 + Math.random() * 3000, 2, 0.12); },
    lancer: t => { souffle(t, 1.2, 'bandpass', 500, 2, 0.13, { att: 0.9, f2: 180 }); },
    plouf: (t, v) => { ton(t, 'sine', 90, 0.6, 0.6 * v, { f2: 35 }); souffle(t, 0.9, 'lowpass', 1200, 0.7, 0.45 * v, { f2: 300, wet: 0.5 }); },
    vent: t => { souffle(t, 2.2, 'bandpass', 700, 1.4, 0.18, { att: 0.8, f2: 1300, glisse: 1.5, wet: 0.4 }); },
    outre: t => { ton(t, 'square', 220, 0.05, 0.06, { lp: 900 }); souffle(t + 0.05, 1.6, 'bandpass', 400, 2, 0.35, { att: 0.2, f2: 2400, wet: 0.5 }); souffle(t + 0.4, 1.4, 'bandpass', 2000, 2, 0.22, { att: 0.3, f2: 500, wet: 0.5 }); },
    moly: t => { [0, 4, 7, 12, 16].forEach((d, k) => ton(t + k * 0.08, 'sine', NOTE(79 + d), 0.6, 0.12, { wet: 0.6 })); },
    coupe: t => { ton(t, 'sine', 900, 0.6, 0.1, { f2: 300, vib: 9, wet: 0.6 }); for (let k = 0; k < 2; k++) { const u = t + 0.7 + k * 0.28; ton(u, 'sawtooth', 160, 0.18, 0.22, { f2: 110, lp: 700, vib: 30 }); souffle(u, 0.15, 'bandpass', 500, 3, 0.16); } },
    cire: t => { ton(t, 'sine', 300, 0.25, 0.25, { f2: 120, lp: 400 }); souffle(t, 0.3, 'lowpass', 300, 0.7, 0.2); },
    tourbillon: (t, v) => { souffle(t, 2.5, 'bandpass', 220, 3, 0.45 * v, { att: 0.5, wet: 0.4 }); ton(t, 'sawtooth', 55, 2.5, 0.1 * v, { att: 0.5, lp: 200, vib: 2 }); },
    rides: (t, v) => { for (let k = 0; k < 4; k++) souffle(t + k * 0.22, 0.12, 'bandpass', 800, 4, 0.08 * v); },
    scylla: (t, v) => { ton(t, 'sawtooth', 90, 0.5, 0.3 * v, { f2: 60, lp: 600, vib: 12 }); souffle(t, 0.3, 'lowpass', 800, 0.7, 0.35 * v, { wet: 0.4 }); souffle(t + 0.5, 0.04, 'highpass', 1500, 1, 0.5 * v); },
    phare: t => { ton(t, 'sine', NOTE(76), 1.6, 0.22, { wet: 0.7 }); ton(t, 'sine', NOTE(76) * 2.76, 0.8, 0.05, { wet: 0.7 }); },
    arrivee: t => { [0, 4, 7, 12, 7, 12, 16].forEach((d, k) => lyre(t + k * 0.13, NOTE(62 + d), 0.45, BRUIT, 0.5)); },
    etoile: (t, v) => { const d = [0, 4, 7][Math.max(0, Math.min(2, Math.round(v) - 1))]; ton(t, 'triangle', NOTE(84 + d), 0.4, 0.15, { wet: 0.5 }); ton(t, 'sine', NOTE(96 + d), 0.3, 0.05, { wet: 0.5 }); },
    gong: t => { ton(t, 'sine', 110, 3, 0.3, { wet: 0.6 }); ton(t, 'sine', 110 * 2.4, 2, 0.1, { wet: 0.6 }); ton(t, 'sine', 110 * 3.9, 1.2, 0.05, { wet: 0.6 }); },
  };
  function jouer(nom, v, dans) {
    if (!pret() || !SONS[nom]) return;
    SONS[nom](A.currentTime + 0.02 + (dans || 0), v == null ? 1 : v);
  }
  // le chant des Sirènes : une courte vocalise, plus forte quand on s'approche
  function chant(v) {
    if (!pret()) return;
    const t = A.currentTime + 0.02, f0 = 69 + [0, 2, -2][Math.floor(Math.random() * 3)];
    [0, 3, 7, 5].forEach((d, k) => voix(t + k * 0.55, NOTE(f0 + d), 0.7, 0.16 * v));
  }
  // téléphone en veille : on coupe tout ; au retour, on reprend
  document.addEventListener('visibilitychange', () => { if (!A) return; if (document.hidden) A.suspend(); else if (on) A.resume(); });

  return { init, actif, musique, mer, jouer, chant, get on() { return on; }, get etat() { return A ? A.state : 'aucun'; } };
})();

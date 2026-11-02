/* Mineur de l'espace : bruitages synthétisés (Web Audio, aucun fichier). MineurSons.jouer(nom) ; coupés ou non
   depuis la pause (réglage gardé dans localStorage). Chaque son a un intervalle minimal (les tourelles tirent vite). */
const MineurSons = (() => {
  const CLE = 'mineur-de-l-espace.sons';
  let actif = true; try { actif = localStorage.getItem(CLE) !== 'non'; } catch (e) { /* stockage indisponible */ }
  let ac = null, maitre = null, bruit = null;
  const dernier = {};
  // le contexte audio ne démarre qu'après un geste du joueur
  function ouvrir() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    ac = new C(); maitre = ac.createGain(); maitre.gain.value = 0.35; maitre.connect(ac.destination);
    bruit = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = bruit.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, ouvrir, { capture: true });
  // une note : fréquence de départ et d'arrivée, durée, forme d'onde, volume
  function note(f0, f1, dur, type, vol, retard) {
    const t = ac.currentTime + (retard || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(maitre); o.start(t); o.stop(t + dur + 0.02);
  }
  // un souffle (explosions, roches) : bruit filtré qui s'éteint
  function souffle(dur, freq, vol, retard) {
    const t = ac.currentTime + (retard || 0), s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = bruit; f.type = 'lowpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(Math.max(60, freq / 6), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(maitre); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  const SONS = {
    tir:       [0.07, () => note(900, 320, 0.06, 'square', 0.05)],
    chasseur:  [0.09, () => note(1400, 700, 0.04, 'square', 0.03)],
    zap:       [0.08, () => note(2200, 900, 0.07, 'sawtooth', 0.04)],
    touche:    [0.05, () => souffle(0.06, 2500, 0.06)],
    roche:     [0.06, () => souffle(0.25, 1600, 0.18)],
    grosse:    [0.1,  () => { souffle(0.45, 900, 0.3); note(120, 50, 0.3, 'triangle', 0.15); }],
    ramasse:   [0.04, () => note(880, 1320, 0.07, 'triangle', 0.08)],
    rare:      [0.2,  () => { note(988, 988, 0.08, 'triangle', 0.1); note(1319, 1319, 0.14, 'triangle', 0.1, 0.08); }],
    plein:     [0.6,  () => note(300, 220, 0.15, 'square', 0.06)],
    choc:      [0.15, () => { souffle(0.3, 1200, 0.35); note(160, 60, 0.25, 'square', 0.12); }],
    carbu:     [0.9,  () => { note(660, 660, 0.09, 'square', 0.06); note(660, 660, 0.09, 'square', 0.06, 0.16); }],
    vente:     [0.3,  () => [523, 659, 784, 1047].forEach((f, i) => note(f, f, 0.12, 'triangle', 0.1, i * 0.07))],
    achat:     [0.15, () => { note(784, 784, 0.08, 'square', 0.07); note(1175, 1175, 0.16, 'square', 0.07, 0.07); }],
    refus:     [0.2,  () => note(200, 160, 0.14, 'square', 0.06)],
    decollage: [0.5,  () => { souffle(0.7, 500, 0.12); note(90, 220, 0.6, 'sawtooth', 0.04); }],
    quai:      [0.5,  () => { note(440, 440, 0.06, 'triangle', 0.08); note(660, 660, 0.1, 'triangle', 0.08, 0.08); }],
    alien:     [0.12, () => note(500, 180, 0.12, 'sawtooth', 0.04)],
    boum:      [0.12, () => { souffle(0.6, 1400, 0.35); note(200, 40, 0.5, 'square', 0.1); }],
    mere:      [0.5,  () => { souffle(1.6, 1000, 0.5); note(90, 25, 1.4, 'sawtooth', 0.2); }],
    alerte:    [1.5,  () => { for (let i = 0; i < 3; i++) { note(520, 780, 0.22, 'sawtooth', 0.06, i * 0.32); } }],
    flotte:    [1,    () => [392, 523, 659].forEach((f, i) => note(f, f, 0.15, 'square', 0.06, i * 0.1))],
    victoire:  [2,    () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => note(f, f, i === 5 ? 0.6 : 0.16, 'square', 0.08, i * 0.15))],
    defaite:   [2,    () => [392, 330, 262].forEach((f, i) => note(f, f, 0.3, 'triangle', 0.09, i * 0.25))],
    voyage:    [2,    () => { note(110, 440, 1.6, 'sawtooth', 0.04); souffle(1.6, 700, 0.1); }],
  };
  function jouer(nom) {
    if (!actif || !ac || ac.state !== 'running') return;
    const S = SONS[nom]; if (!S) return;
    const t = ac.currentTime; if (t - (dernier[nom] || -9) < S[0]) return; dernier[nom] = t;
    try { S[1](); } catch (e) { /* rien */ }
  }
  return {
    jouer,
    get actif() { return actif; },
    basculer() { actif = !actif; try { localStorage.setItem(CLE, actif ? 'oui' : 'non'); } catch (e) { /* stockage indisponible */ } if (actif) { ouvrir(); jouer('achat'); } return actif; },
  };
})();

/* Doggy Saga : les sons (session 3). Vrais aboiements CC0 (sons-chiens.js) et petits sons fabriqués
   (Web Audio, comme la maquette) : pop qui monte pendant les cascades, couinement de la balle, fanfare.
   DogSons.jouer(k, n) ; DogSons.actif (lu et gardé dans doggysaga.son) ;
   DogSons.regler({ ouaf, joie, petit }) pour le banc d'écoute (maquettes/doggy-saga-sons.html). */
(function () {
  'use strict';
  let AC = null, SORTIE = null;
  const TAMPONS = {}, ENCOURS = {}, DERNIER = {};
  // Choix par défaut (à confirmer au banc d'écoute) : quel vrai son pour quel rôle.
  const CHOIX = { ouaf: 'ouaf-c', joie: 'ouaf-a', petit: 'mignon-04', triste: 'triste', hurle: 'hurle' };
  let actif = true;
  try { actif = localStorage.getItem('doggysaga.son') !== '0'; } catch (e) { /* stockage bloqué */ }
  try { Object.assign(CHOIX, JSON.parse(localStorage.getItem('doggysaga.sons') || '{}')); } catch (e) { /* idem */ }

  function contexte() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
        const comp = AC.createDynamicsCompressor();
        comp.threshold.value = -14; comp.ratio.value = 4;
        SORTIE = AC.createGain(); SORTIE.gain.value = 0.8;
        SORTIE.connect(comp).connect(AC.destination);
      } catch (e) { AC = null; }
    }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
  }
  // Le navigateur n'ouvre le son qu'après un geste : on le prépare au premier toucher.
  ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, () => { if (actif) { contexte(); charger(); } }, { passive: true }));

  function charger() {
    const D = window.DOG_SONS_DATA; if (!AC || !D) return;
    for (const k in D) {
      if (TAMPONS[k] || ENCOURS[k]) continue;
      const bin = atob(D[k]), u = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
      ENCOURS[k] = true;
      try {
        const p = AC.decodeAudioData(u.buffer, b => { TAMPONS[k] = b; }, () => {});
        if (p && p.catch) p.catch(() => {});
      } catch (e) { /* format non lu : on garde les sons fabriqués */ }
    }
  }

  // ---------- les briques ----------
  function ton(f, d, type, v, glisse, retard) {
    const t = AC.currentTime + (retard || 0), o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (glisse) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * glisse), t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0005, t + d);
    o.connect(g).connect(SORTIE); o.start(t); o.stop(t + d + 0.03);
  }
  function bruit(d, v, fq, type, retard, q) {
    const n = AC.sampleRate * d | 0, b = AC.createBuffer(1, n, AC.sampleRate), x = b.getChannelData(0);
    for (let i = 0; i < n; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    s.buffer = b; f.type = type || 'lowpass'; f.frequency.value = fq || 1800; if (q) f.Q.value = q; g.gain.value = v;
    s.connect(f).connect(g).connect(SORTIE); s.start(AC.currentTime + (retard || 0));
  }
  // Un vrai son ; vitesse > 1 = plus aigu (petit chien), < 1 = plus grave.
  function vrai(nom, v, vitesse, retard) {
    const b = TAMPONS[nom]; if (!b) return false;
    const s = AC.createBufferSource(), g = AC.createGain();
    s.buffer = b; s.playbackRate.value = vitesse || 1; g.gain.value = v;
    s.connect(g).connect(SORTIE); s.start(AC.currentTime + (retard || 0));
    return true;
  }
  // « Ouaf » fabriqué (maquette), si les vrais sons ne sont pas encore prêts.
  function ouafFabrique(aigu, retard) {
    const t = AC.currentTime + (retard || 0), o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(), b = (aigu ? 430 : 340) + Math.random() * 60;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(b, t); o.frequency.exponentialRampToValueAtTime(b * 0.55, t + 0.09);
    f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 1.6;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.012); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(f).connect(g).connect(SORTIE); o.start(t); o.stop(t + 0.14);
  }
  function ouaf(role, v, vitesse, retard) {
    const nom = CHOIX[role] || role;
    if (nom === 'fabrique' || !vrai(nom, v, vitesse * (0.94 + Math.random() * 0.12), retard)) ouafFabrique(vitesse > 1.1, retard);
  }

  const GAMME = [523, 587, 659, 784, 880, 988, 1175, 1319, 1568];
  let dernierPop = 0, dernierOuaf = 0;
  const SONS = {
    debut() { ouaf('ouaf', 0.7, 1); ton(660, 0.12, 'triangle', 0.06, 1.5, 0.1); },
    glisse() { ton(520, 0.07, 'triangle', 0.07, 1.4); bruit(0.06, 0.05, 2500, 'bandpass'); },
    non() { ton(240, 0.09, 'triangle', 0.09, 0.8); ton(190, 0.12, 'triangle', 0.09, 0.8, 0.08); },
    pop(n) {
      const t = AC.currentTime; if (t - dernierPop < 0.05) return; dernierPop = t;
      const f = GAMME[Math.min(n || 0, 8)];
      ton(f, 0.12, 'sine', 0.13, 1.7); ton(f * 2, 0.05, 'sine', 0.04, 1.2, 0.02);
      if ((n >= 1 || Math.random() < 0.35) && t - dernierOuaf > 0.18) { dernierOuaf = t; ouaf(n >= 2 ? 'petit' : 'ouaf', 0.42, 1 + Math.min(n || 0, 4) * 0.06); }
    },
    cascade(n) { ton(GAMME[Math.min(n + 2, 8)] * 2, 0.22, 'sine', 0.05, 1); ton(GAMME[Math.min(n + 4, 8)] * 2, 0.18, 'sine', 0.035, 1, 0.07); },
    rayon() { ouaf('ouaf', 0.6, 1.05); ouaf('ouaf', 0.45, 1.15, 0.12); bruit(0.35, 0.14, 1500, 'bandpass', 0, 0.8); },
    noeud() { ton(140, 0.4, 'sine', 0.28, 0.4); bruit(0.4, 0.2, 900); for (let i = 0; i < 4; i++) ton(700 + i * 180, 0.12, 'triangle', 0.05, 1.6, 0.05 + i * 0.04); },
    balle() {
      // couinement du jouet, puis la meute
      ton(1300, 0.08, 'sine', 0.13, 1.5); ton(1900, 0.13, 'sine', 0.11, 0.65, 0.08);
      for (let i = 0; i < 6; i++) ton(400 + i * 160, 0.16, 'triangle', 0.05, 2, 0.15 + i * 0.04);
      bruit(0.5, 0.13, 2000, 'lowpass', 0.1); ouaf('joie', 0.5, 1, 0.3);
    },
    bonus() { [0, 4, 7].forEach((s, i) => ton(660 * Math.pow(2, s / 12), 0.12, 'triangle', 0.08, 1, i * 0.06)); },
    boue() { bruit(0.22, 0.2, 500, 'lowpass', 0, 2); ton(110, 0.12, 'sine', 0.12, 0.6); },
    niche(n) { bruit(0.08, 0.22, 900, 'bandpass', 0, 3); ton(n ? 180 : 140, 0.1, 'triangle', 0.12, 0.7); if (!n) bruit(0.3, 0.18, 1200, 'lowpass', 0.05); },
    sauve() { ouaf('petit', 0.6, 1.25); [0, 7, 12].forEach((s, i) => ton(880 * Math.pow(2, s / 12), 0.1, 'sine', 0.06, 1, 0.1 + i * 0.05)); },
    adopte() { ouaf('joie', 0.75, 1); ouaf('joie', 0.6, 1.08, 0.2); [0, 4, 7, 12].forEach((s, i) => ton(784 * Math.pow(2, s / 12), 0.12, 'sine', 0.06, 1, i * 0.06)); },
    fete() { for (let i = 0; i < 8; i++) ton(GAMME[i], 0.12, 'triangle', 0.06, 1.2, i * 0.07); ouaf('joie', 0.6, 1.1, 0.3); ouaf('petit', 0.5, 1.2, 0.55); },
    gagne() {
      [[0, 0], [4, 0.14], [7, 0.28], [12, 0.42]].forEach(([s, r]) => { ton(523 * Math.pow(2, s / 12), 0.3, 'triangle', 0.08, 1, r); ton(1046 * Math.pow(2, s / 12), 0.2, 'sine', 0.03, 1, r); });
      ouaf('joie', 0.7, 1, 0.6); ouaf('joie', 0.55, 1.12, 0.8);
    },
    perdu() { if (!vrai(CHOIX.triste, 0.55, 1)) { ton(392, 0.3, 'triangle', 0.08, 0.9); ton(330, 0.4, 'triangle', 0.08, 0.85, 0.28); } },
    melange() { for (let i = 0; i < 5; i++) bruit(0.06, 0.08, 2500 + i * 300, 'bandpass', i * 0.05, 2); },
    clic() { ton(700, 0.05, 'triangle', 0.06, 1.3); }
  };

  window.DogSons = {
    jouer(k, n) {
      if (!actif || !SONS[k] || !contexte() || !SORTIE) return;
      const t = AC.currentTime; if (k !== 'pop' && t - (DERNIER[k] || -1) < 0.04) return; DERNIER[k] = t;
      charger();
      try { SONS[k](n || 0); } catch (e) { /* son raté */ }
    },
    get actif() { return actif; },
    set actif(v) { actif = !!v; try { localStorage.setItem('doggysaga.son', actif ? '1' : '0'); } catch (e) { /* stockage bloqué */ } if (actif) { contexte(); charger(); } },
    regler(c) { Object.assign(CHOIX, c); },
    choix: CHOIX,
    vrai(nom) { if (contexte()) { charger(); vrai(nom, 0.8, 1); } },
    pret: () => Object.keys(TAMPONS).length,
    cles: Object.keys(SONS)
  };
})();

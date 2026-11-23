/* Écurie miniature : les sons, synthétisés (pas de fichier) : moteur de la voiture filmée, bips des feux, foule, passage d'une voiture.
   Le contexte audio n'est créé qu'au premier son voulu (sinon certains Android font un clic). Réglage dans localStorage « ecurie.son ». */
(function (W) {
  let ctx = null, maitre = null, moteur = null, bruit = null;
  let actif = true; try { actif = localStorage.getItem('ecurie.son') !== '0'; } catch (e) {}
  function demarrer() {
    if (!actif) return false;
    if (!ctx) { const AC = W.AudioContext || W.webkitAudioContext; if (!AC) return false; ctx = new AC(); maitre = ctx.createGain(); maitre.gain.value = .0001; maitre.connect(ctx.destination);
      maitre.gain.setTargetAtTime(.9, ctx.currentTime, .3);
      const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; bruit = b; }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  }
  // moteur : deux oscillateurs désaccordés dans un filtre, la hauteur suit la vitesse
  function moteurOn() { if (!demarrer() || moteur) return;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 2;
    const g = ctx.createGain(); g.gain.value = 0; const a = ctx.createOscillator(), b = ctx.createOscillator(); a.type = 'sawtooth'; b.type = 'square'; b.detune.value = 14;
    const gb = ctx.createGain(); gb.gain.value = .35; a.connect(f); b.connect(gb); gb.connect(f); f.connect(g); g.connect(maitre); a.start(); b.start();
    moteur = {a, b, f, g}; }
  function moteurMaj(v, fort) { if (!moteur) return; const t = ctx.currentTime, hz = 38 + v * 2.4;
    moteur.a.frequency.setTargetAtTime(hz, t, .08); moteur.b.frequency.setTargetAtTime(hz * 1.5, t, .08); moteur.f.frequency.setTargetAtTime(500 + v * 26, t, .1);
    moteur.g.gain.setTargetAtTime(fort ? .045 + v * .0008 : .015, t, .15); }
  function moteurOff() { if (!moteur) return; const m = moteur; moteur = null; const t = ctx.currentTime; m.g.gain.setTargetAtTime(0, t, .1); setTimeout(() => { try { m.a.stop(); m.b.stop(); } catch (e) {} }, 600); }
  function bip(vert) { if (!demarrer()) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'square'; o.frequency.value = vert ? 880 : 440;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + (vert ? .7 : .22)); o.connect(g); g.connect(maitre); o.start(t); o.stop(t + .8); }
  function souffle(duree, de, a, fort) { if (!demarrer()) return; const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = bruit; f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(de, t); f.frequency.exponentialRampToValueAtTime(a, t + duree);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(fort, t + duree * .3); g.gain.exponentialRampToValueAtTime(.0001, t + duree);
    s.connect(f); f.connect(g); g.connect(maitre); s.start(t, Math.random()); s.stop(t + duree + .05); }
  const passage = () => souffle(.5, 2400, 500, .08);         // une voiture qui passe (dépassement)
  const foule = () => { souffle(2.6, 900, 1400, .16); souffle(2.2, 2200, 1800, .07); };   // la tribune à l'arrivée
  function regler(on) { actif = on; try { localStorage.setItem('ecurie.son', on ? '1' : '0'); } catch (e) {} if (!on) moteurOff(); if (maitre) maitre.gain.setTargetAtTime(on ? .9 : 0, ctx.currentTime, .05); }
  W.EcurieSons = {moteurOn, moteurMaj, moteurOff, bip, passage, foule, regler, actif: () => actif};
})(window);

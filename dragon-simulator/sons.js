/* =====================================================================
   DRAGON SIMULATOR · les SONS (Web Audio, tout synthétisé) et la petite
   musique discrète en boucle (§ 11). Coupables (DsSons.actif).
   DsSons.evenements(p) joue ce que les règles viennent de raconter ;
   DsSons.feu(oui) tient le souffle des flammes ; DsSons.musique(oui).
   ===================================================================== */
'use strict';
(function () {
  let ctx = null, sortie = null, bruitBuf = null, feuSrc = null, feuGain = null, musGain = null, musProchaine = 0, musPas = 0, musMinuteur = 0, musVeut = false;
  const S = { actif: true };
  function demarrer() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); sortie = ctx.createGain(); sortie.gain.value = S.actif ? 0.8 : 0; sortie.connect(ctx.destination);
    bruitBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = bruitBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }
  function bruit(duree, frequence, volume, type = 'lowpass', glisse) {
    if (!ctx || !S.actif) return; const t = ctx.currentTime, s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = bruitBuf; s.loop = true; f.type = type; f.frequency.setValueAtTime(frequence, t); if (glisse) f.frequency.exponentialRampToValueAtTime(glisse, t + duree);
    g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(0.001, t + duree);
    s.connect(f); f.connect(g); g.connect(sortie); s.start(t); s.stop(t + duree + 0.05);
  }
  function note(freq, debut, duree, volume, forme = 'square', vers) {
    if (!ctx || !S.actif) return; const t = ctx.currentTime + debut, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = forme; o.frequency.setValueAtTime(freq, t); if (vers) o.frequency.exponentialRampToValueAtTime(vers, t + duree);
    g.gain.setValueAtTime(volume, t); g.gain.exponentialRampToValueAtTime(0.001, t + duree); o.connect(g); g.connect(sortie); o.start(t); o.stop(t + duree + 0.02);
  }
  const SONS = {
    ailes: () => bruit(0.22, 900, 0.18, 'bandpass', 250),
    envol: () => { bruit(0.35, 1200, 0.22, 'bandpass', 300); note(330, 0, 0.12, 0.05); note(495, 0.08, 0.16, 0.05); },
    explosion: () => { bruit(0.6, 900, 0.5, 'lowpass', 60); note(90, 0, 0.35, 0.18, 'sine', 40); },
    effondrement: () => { bruit(1.1, 400, 0.35, 'lowpass', 50); note(60, 0.05, 0.8, 0.15, 'triangle', 30); },
    piece: () => { note(988, 0, 0.06, 0.06); note(1319, 0.06, 0.12, 0.06); },
    bonus: () => { [523, 659, 784, 1047].forEach((f, i) => note(f, i * 0.06, 0.12, 0.06)); },
    choc: () => { bruit(0.25, 300, 0.4); note(140, 0, 0.2, 0.2, 'sawtooth', 70); },
    bouclier: () => { note(880, 0, 0.25, 0.08, 'sine', 1760); bruit(0.2, 3000, 0.15, 'highpass'); },
    eclair: () => { bruit(0.08, 6000, 0.5, 'highpass'); bruit(0.9, 300, 0.4, 'lowpass', 40); },
    atterrissage: () => { bruit(0.3, 500, 0.3, 'lowpass', 80); },
    chute: () => { note(440, 0, 0.6, 0.1, 'triangle', 110); bruit(0.5, 400, 0.3, 'lowpass', 60); },
    achat: () => { [659, 784, 988, 1319].forEach((f, i) => note(f, i * 0.07, 0.14, 0.07)); },
    bouton: () => note(660, 0, 0.06, 0.05),
    record: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => note(f, i * 0.1, 0.18, 0.07, 'triangle')); },
  };
  S.jouer = n => { if (SONS[n]) SONS[n](); };
  S.demarrer = demarrer;
  S.evenements = function (p) {
    if (!ctx || !S.actif) return; let piece = false, explo = false, effondre = false;
    for (const e of p.ev) {
      if (e.t === 'pieces') piece = true;
      else if (e.t === 'detruit') { effondre = true; if (e.cause !== 'feu') explo = true; }
      else if (e.t === 'voiture' || e.t === 'grenade' || e.t === 'chauve') explo = true;
      else if (e.t === 'fin') S.jouer(e.raison === 'chute' ? 'chute' : 'atterrissage');
      else if (SONS[e.t]) S.jouer(e.t);
      else if (e.t === 'bonus') S.jouer('bonus');
    }
    if (explo) S.jouer('explosion'); if (effondre) S.jouer('effondrement'); else if (piece) S.jouer('piece');
  };
  // le souffle des flammes : un bruit continu qu'on monte et qu'on baisse
  S.feu = function (oui, fort) {
    if (!ctx) return;
    if (!feuSrc) {
      feuSrc = ctx.createBufferSource(); feuSrc.buffer = bruitBuf; feuSrc.loop = true; const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 700;
      feuGain = ctx.createGain(); feuGain.gain.value = 0; feuSrc.connect(f); f.connect(feuGain); feuGain.connect(sortie); feuSrc.start();
    }
    feuGain.gain.setTargetAtTime(oui && S.actif ? (fort ? 0.32 : 0.2) : 0, ctx.currentTime, 0.05);
  };
  // petite musique discrète : une ronde en la mineur pentatonique, au triangle, très bas
  const MEL = [57, 60, 64, 62, 60, 57, 55, 57, 60, 62, 64, 67, 64, 62, 60, 62, 57, 60, 64, 67, 69, 67, 64, 62, 60, 57, 55, 52, 55, 57, 0, 0];
  const BASSE = [45, 45, 41, 41, 43, 43, 45, 45];
  const hz = m => 440 * Math.pow(2, (m - 69) / 12), NOIRE = 0.3;
  function musTic() {
    if (!ctx) return;
    while (musProchaine < ctx.currentTime + 0.5) {
      const t = musProchaine, m = MEL[musPas % MEL.length];
      if (m) noteMus(hz(m), t, NOIRE * 0.9, 0.05);
      if (musPas % 4 === 0) noteMus(hz(BASSE[(musPas / 4) % BASSE.length]), t, NOIRE * 3.6, 0.06);
      musPas++; musProchaine += NOIRE;
    }
  }
  function noteMus(f, t, d, v) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(musGain); o.start(t); o.stop(t + d + 0.05); }
  S.musique = function (oui) {
    musVeut = oui; if (!ctx) return;
    if (!musGain) { musGain = ctx.createGain(); musGain.gain.value = 0; musGain.connect(sortie); }
    musGain.gain.setTargetAtTime(oui && S.actif ? 0.5 : 0, ctx.currentTime, 0.4);
    if (oui && !musMinuteur) { musProchaine = ctx.currentTime + 0.1; musMinuteur = setInterval(musTic, 200); }
    if (!oui && musMinuteur) { setTimeout(() => { if (!musVeut) { clearInterval(musMinuteur); musMinuteur = 0; } }, 1500); }
  };
  S.regler = function (oui) { S.actif = oui; if (sortie) sortie.gain.setTargetAtTime(oui ? 0.8 : 0, ctx.currentTime, 0.05); if (!oui) S.feu(false); S.musique(musVeut); };
  window.DsSons = S;
})();

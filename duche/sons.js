/* Duché : bruitages et musique d'ambiance, synthétisés en Web Audio (aucun fichier son).
   DucSons.jouer(nom) : clic, batir (coups de marteau), recruter (tambour), epee (choc d'épées), victoire (fanfare),
   defaite (cor grave), cloche (un événement), tambour (fin du tour), pieces (marché), couronne (grande fanfare).
   DucSons.musique(oui) : ambiance médiévale calme (luth pincé en ré dorien, bourdon de vielle, flûte espacée), sous les bruitages.
   DucSons.bruitages(oui) coupe ou rend les bruitages. Le son ne démarre qu'après un premier geste (règle des navigateurs). */
const DucSons = (function () {
  let ctx = null, sortie = null, busBruit = null, busMusique = null, bruit = true, musiqueVoulue = false, minuteur = null;
  function demarrer() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); sortie = ctx.createDynamicsCompressor(); sortie.connect(ctx.destination);
    busBruit = ctx.createGain(); busBruit.gain.value = 0.5; busBruit.connect(sortie);
    busMusique = ctx.createGain(); busMusique.gain.value = 0; busMusique.connect(sortie);
    if (musiqueVoulue) lancerMusique();
    return true;
  }
  ['pointerdown', 'keydown'].forEach(e => addEventListener(e, demarrer, { passive: true }));

  // ---------- briques ----------
  let tamponBruit = null;
  function souffle() {
    if (!tamponBruit) { tamponBruit = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = tamponBruit.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(); s.buffer = tamponBruit; return s;
  }
  function enveloppe(g, t, a, d, v) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function bruitFiltre(t, type, f, q, a, d, v, f2) {
    const s = souffle(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d); fl.Q.value = q;
    enveloppe(g, t, a, d, v); s.connect(fl); fl.connect(g); g.connect(busBruit); s.start(t, Math.random() * 0.5); s.stop(t + a + d + 0.05);
  }
  function note(t, f, type, a, d, v, bus, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    enveloppe(g, t, a, d, v); o.connect(g); g.connect(bus || busBruit); o.start(t); o.stop(t + a + d + 0.05);
  }
  // cuivre : dent de scie filtrée (trompette de héraut)
  function cuivre(t, f, d, v) {
    const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 2, t); fl.frequency.linearRampToValueAtTime(f * 5, t + 0.06);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.04); g.gain.setValueAtTime(v, t + d * 0.7); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(fl); fl.connect(g); g.connect(busBruit); o.start(t); o.stop(t + d + 0.05);
  }
  const tambourCoup = (t, v) => { note(t, 120, 'sine', 0.002, 0.18, v, null, 55); bruitFiltre(t, 'lowpass', 900, 1, 0.002, 0.08, v * 0.6); };

  // ---------- bruitages ----------
  const SONS = {
    clic: t => note(t, 660, 'square', 0.002, 0.04, 0.03),
    batir: t => { for (let i = 0; i < 3; i++) { bruitFiltre(t + i * 0.16, 'bandpass', 1800, 3, 0.001, 0.07, 0.2); note(t + i * 0.16, 220, 'triangle', 0.001, 0.08, 0.12, null, 140); } },
    recruter: t => { [0, 0.14, 0.28, 0.5].forEach((d, i) => tambourCoup(t + d, i === 3 ? 0.3 : 0.2)); },
    epee: t => { [2400, 3150, 4100].forEach((f, i) => note(t, f, 'square', 0.001, 0.25 - i * 0.05, 0.035)); bruitFiltre(t, 'highpass', 3000, 1, 0.001, 0.12, 0.2); },
    victoire: t => { [392, 392, 523.3, 659.3].forEach((f, i) => cuivre(t + [0, 0.15, 0.3, 0.5][i], f, i === 3 ? 0.8 : 0.13, 0.09)); tambourCoup(t, 0.25); tambourCoup(t + 0.5, 0.3); },
    defaite: t => { cuivre(t, 196, 0.6, 0.08); cuivre(t + 0.55, 174.6, 1.1, 0.08); tambourCoup(t + 0.55, 0.25); },
    cloche: t => { [1, 2.76, 5.4].forEach((k, i) => note(t, 440 * k, 'sine', 0.002, 1.8 - i * 0.5, 0.12 / (i + 1))); },
    tambour: t => { for (let i = 0; i < 6; i++) tambourCoup(t + i * 0.07, 0.08 + i * 0.03); tambourCoup(t + 0.5, 0.3); },
    pieces: t => { for (let i = 0; i < 3; i++) note(t + i * 0.06, 2600 + i * 300, 'triangle', 0.001, 0.12, 0.05); },
    couronne: t => { [523.3, 523.3, 659.3, 784, 1047].forEach((f, i) => { cuivre(t + i * 0.18, f, i === 4 ? 1.2 : 0.16, 0.08); cuivre(t + i * 0.18, f / 2, i === 4 ? 1.2 : 0.16, 0.05); }); SONS.cloche(t + 0.9); },
  };
  function jouer(nom, delai = 0) {
    if (!bruit || !SONS[nom] || !demarrer() || ctx.state !== 'running') return;
    SONS[nom](ctx.currentTime + 0.01 + (delai || 0));
  }

  // ---------- musique : 72 battements par minute, ré dorien, luth en arpèges, bourdon de vielle, flûte espacée ----------
  const ACCORDS = [[146.8, 220, 293.7], [130.8, 196, 261.6], [146.8, 220, 293.7], [174.6, 261.6, 349.2]];   // ré, do, ré, fa
  const FLUTE = [587.3, 659.3, 698.5, 784, 880, 987.8, 1046.5];
  let mesure = 0, prochaine = 0;
  function pince(t, f, v) { note(t, f, 'triangle', 0.004, 1.1, v, busMusique); note(t, f * 2, 'sine', 0.002, 0.35, v * 0.3, busMusique); }
  function planifier() {
    const beat = 60 / 72;
    while (prochaine < ctx.currentTime + 1.5) {
      const t = prochaine, acc = ACCORDS[mesure % 4];
      note(t, 73.4, 'sawtooth', 0.6, beat * 4, 0.012, busMusique);   // bourdon
      [0, 1, 2, 1, 0, 2, 1, 2].forEach((k, i) => pince(t + i * beat / 2, acc[k], i % 2 ? 0.03 : 0.045));
      for (let b = 0; b < 4; b += 2) if (Math.random() < 0.35) note(t + b * beat, FLUTE[Math.floor(Math.random() * FLUTE.length)], 'sine', 0.08, beat * 1.6, 0.035, busMusique);
      prochaine += beat * 4; mesure++;
    }
  }
  function lancerMusique() {
    if (!ctx || minuteur) return;
    prochaine = ctx.currentTime + 0.1; busMusique.gain.cancelScheduledValues(ctx.currentTime); busMusique.gain.setTargetAtTime(0.4, ctx.currentTime, 1.2);
    planifier(); minuteur = setInterval(planifier, 400);
  }
  function arreterMusique() {
    if (!ctx || !minuteur) return;
    clearInterval(minuteur); minuteur = null; busMusique.gain.cancelScheduledValues(ctx.currentTime); busMusique.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
  }
  function musique(oui) { musiqueVoulue = !!oui; if (musiqueVoulue) { if (demarrer()) lancerMusique(); } else arreterMusique(); }
  document.addEventListener('visibilitychange', () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  return { jouer, musique, bruitages: oui => { bruit = !!oui; } };
})();

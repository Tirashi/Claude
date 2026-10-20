/* Le Magasinier : bruitages et musique d'ambiance, synthétisés en Web Audio (aucun fichier son).
   MagSons.jouer(nom) : pas, pousse, glisse, tapis, mur, marque, victoire, bip.
   MagSons.musique(oui) : ambiance calme façon atelier (accords doux, petite mélodie espacée), mixée sous les bruitages.
   MagSons.bruitages(oui) coupe ou rend les bruitages. Le son ne démarre qu'après un premier geste (règle des navigateurs). */
const MagSons = (function () {
  let ctx = null, sortie = null, busBruit = null, busMusique = null, bruit = true, musiqueVoulue = false, minuteur = null, pasAlterne = 0;
  function demarrer() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); sortie = ctx.createDynamicsCompressor(); sortie.connect(ctx.destination);
    busBruit = ctx.createGain(); busBruit.gain.value = .55; busBruit.connect(sortie);
    busMusique = ctx.createGain(); busMusique.gain.value = 0; busMusique.connect(sortie);
    if (musiqueVoulue) lancerMusique();
    return true;
  }
  ["pointerdown", "keydown"].forEach(e => addEventListener(e, demarrer, { passive: true }));

  // ---------- briques ----------
  let tamponBruit = null;
  function souffle() {
    if (!tamponBruit) { tamponBruit = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = tamponBruit.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(); s.buffer = tamponBruit; return s;
  }
  function enveloppe(g, t, a, d, v) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function bruitFiltre(t, type, f, q, a, d, v, f2) {
    const s = souffle(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d); fl.Q.value = q;
    enveloppe(g, t, a, d, v); s.connect(fl); fl.connect(g); g.connect(busBruit); s.start(t, Math.random() * .5); s.stop(t + a + d + .05);
  }
  function note(t, f, type, a, d, v, bus, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    enveloppe(g, t, a, d, v); o.connect(g); g.connect(bus || busBruit); o.start(t); o.stop(t + a + d + .05);
  }

  // ---------- bruitages ----------
  const SONS = {
    pas: t => { pasAlterne ^= 1; bruitFiltre(t, "lowpass", pasAlterne ? 520 : 440, 1, .004, .07, .22); note(t, pasAlterne ? 95 : 85, "sine", .003, .08, .12); },
    pousse: t => { bruitFiltre(t, "bandpass", 380, 2.5, .03, .26, .3, 260); note(t, 70, "sine", .005, .12, .2); bruitFiltre(t + .02, "lowpass", 900, 1, .01, .08, .12); },
    glisse: t => bruitFiltre(t, "highpass", 2400, .8, .03, .35, .12, 5200),
    tapis: t => { for (let i = 0; i < 4; i++) note(t + i * .07, 58, "square", .005, .05, .03); bruitFiltre(t, "bandpass", 180, 4, .05, .3, .1); },
    mur: t => { note(t, 120, "sine", .002, .12, .3, null, 55); bruitFiltre(t, "lowpass", 300, 1, .002, .06, .25); },
    marque: t => { bruitFiltre(t, "bandpass", 1800, 3, .002, .05, .25); note(t + .03, 659, "triangle", .005, .25, .16); note(t + .13, 988, "triangle", .005, .45, .14); },
    victoire: t => { [523, 659, 784, 1047].forEach((f, i) => { note(t + i * .12, f, "square", .01, .22, .06); note(t + i * .12, f / 2, "triangle", .01, .3, .1); }); note(t + .5, 1047, "triangle", .01, .9, .12); note(t + .5, 784, "triangle", .01, .9, .08); },
    bip: t => note(t, 880, "square", .003, .06, .04),
  };
  function jouer(nom, delai = 0) {
    if (!bruit || !SONS[nom] || !demarrer() || ctx.state !== "running") return;
    SONS[nom](ctx.currentTime + .01 + delai);
  }

  // ---------- musique d'ambiance : 70 battements par minute, 4 accords, mélodie pentatonique espacée ----------
  const ACCORDS = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];   // la m, fa, do, sol
  const GAMME = [440, 493.9, 523.3, 587.3, 659.3, 784, 880];
  let mesure = 0, prochaine = 0;
  function planifier() {
    const beat = 60 / 70;
    while (prochaine < ctx.currentTime + 1.5) {
      const t = prochaine, acc = ACCORDS[mesure % 4];
      // nappe : les trois notes de l'accord, douces, filtrées
      acc.forEach(f => { const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = "triangle"; o.frequency.value = f;
        fl.type = "lowpass"; fl.frequency.value = 900; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + 1.2); g.gain.linearRampToValueAtTime(.04, t + beat * 3);
        g.gain.linearRampToValueAtTime(0, t + beat * 4 + .3); o.connect(fl); fl.connect(g); g.connect(busMusique); o.start(t); o.stop(t + beat * 4 + .4); });
      // basse pincée sur le premier temps et le troisième
      [0, 2].forEach(b => note(t + b * beat, acc[0] / 2, "sine", .01, beat * 1.6, .12, busMusique));
      // quelques notes de mélodie, pas à chaque mesure
      for (let b = 0; b < 4; b++) if (Math.random() < .32) { const f = GAMME[Math.floor(Math.random() * GAMME.length)]; note(t + b * beat + (Math.random() < .3 ? beat / 2 : 0), f, "sine", .01, beat * 1.4, .05, busMusique); note(t + b * beat, f * 2, "sine", .01, beat * .6, .012, busMusique); }
      prochaine += beat * 4; mesure++;
    }
  }
  function lancerMusique() {
    if (!ctx || minuteur) return;
    prochaine = ctx.currentTime + .1; busMusique.gain.cancelScheduledValues(ctx.currentTime); busMusique.gain.setTargetAtTime(.5, ctx.currentTime, 1.2);
    planifier(); minuteur = setInterval(planifier, 400);
  }
  function arreterMusique() {
    if (!ctx || !minuteur) return;
    clearInterval(minuteur); minuteur = null; busMusique.gain.cancelScheduledValues(ctx.currentTime); busMusique.gain.setTargetAtTime(0, ctx.currentTime, .3);
  }
  function musique(oui) { musiqueVoulue = !!oui; if (musiqueVoulue) { if (demarrer()) lancerMusique(); } else arreterMusique(); }
  document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  return { jouer, musique, bruitages: oui => { bruit = !!oui; } };
})();

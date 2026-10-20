/* Capitaine du port : bruitages et musique d'ambiance, synthétisés en Web Audio (aucun fichier son).
   CapSons.jouer(nom) : cale (clapotis quand un bateau se pose), toc (butée), corne (le navire doré sort), victoire, bip.
   CapSons.moteur(oui) : le moteur du remorqueur, tant qu'on glisse un bateau. Les mouettes crient de temps en temps.
   CapSons.musique(oui) : ambiance calme et ensoleillée (arpèges de guitare pincée, petite mélodie espacée), sous les bruitages.
   CapSons.bruitages(oui) coupe ou rend les bruitages. Le son ne démarre qu'après un premier geste (règle des navigateurs). */
const CapSons = (function () {
  let ctx = null, sortie = null, busBruit = null, busMusique = null, bruit = true, musiqueVoulue = false, minuteur = null, mot = null, mouettes = null;
  function demarrer() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); sortie = ctx.createDynamicsCompressor(); sortie.connect(ctx.destination);
    busBruit = ctx.createGain(); busBruit.gain.value = .55; busBruit.connect(sortie);
    busMusique = ctx.createGain(); busMusique.gain.value = 0; busMusique.connect(sortie);
    if (musiqueVoulue) lancerMusique();
    mouettes = setInterval(() => { if (bruit && ctx.state === "running" && Math.random() < .25) SONS.mouette(ctx.currentTime + .05); }, 6000);
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
    cale: t => { bruitFiltre(t, "bandpass", 700, 1.5, .01, .22, .22, 300); bruitFiltre(t + .08, "bandpass", 1100, 2, .01, .14, .1, 500); },
    toc: t => { note(t, 160, "sine", .002, .1, .25, null, 70); bruitFiltre(t, "lowpass", 500, 1, .002, .05, .18); },
    corne: t => { [110, 116.5].forEach(f => { const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = "sawtooth"; o.frequency.value = f;
      fl.type = "lowpass"; fl.frequency.value = 600; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .15); g.gain.setValueAtTime(.12, t + 1.1); g.gain.linearRampToValueAtTime(0, t + 1.5);
      o.connect(fl); fl.connect(g); g.connect(busBruit); o.start(t); o.stop(t + 1.6); }); },
    victoire: t => {
      // la cloche du port, puis une petite fanfare
      [1, 2.76, 5.4].forEach((k, i) => note(t, 523 * k, "sine", .002, 1.6 - i * .4, .14 / (i + 1)));
      [523, 659, 784, 1047].forEach((f, i) => { note(t + .5 + i * .12, f, "square", .01, .22, .05); note(t + .5 + i * .12, f / 2, "triangle", .01, .3, .1); });
      note(t + 1, 1047, "triangle", .01, .9, .12); note(t + 1, 784, "triangle", .01, .9, .08);
    },
    mouette: t => { for (let k = 0; k < 2 + Math.floor(Math.random() * 2); k++) { const t0 = t + k * .22; note(t0, 1500, "triangle", .02, .16, .035, null, 900); bruitFiltre(t0, "bandpass", 2600, 6, .01, .12, .02); } },
    bip: t => note(t, 880, "square", .003, .06, .04),
  };
  function jouer(nom, delai = 0) {
    if (!bruit || !SONS[nom] || !demarrer() || ctx.state !== "running") return;
    SONS[nom](ctx.currentTime + .01 + delai);
  }
  // le moteur diesel du remorqueur : un ronron grave et un clapotis, qui montent et descendent doucement
  function moteur(oui) {
    if (oui && (!bruit || !demarrer() || ctx.state !== "running")) return;
    if (!ctx) return;
    const t = ctx.currentTime;
    if (oui && !mot) {
      const o = ctx.createOscillator(), o2 = ctx.createOscillator(), lfo = ctx.createOscillator(), lg = ctx.createGain(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = 46; o2.type = "square"; o2.frequency.value = 23;
      lfo.frequency.value = 11; lg.gain.value = 6; lfo.connect(lg); lg.connect(o.frequency);
      fl.type = "lowpass"; fl.frequency.value = 260; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .15);
      o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(busBruit); o.start(t); o2.start(t); lfo.start(t);
      mot = { g, arret: [o, o2, lfo] };
    } else if (!oui && mot) {
      mot.g.gain.cancelScheduledValues(t); mot.g.gain.setTargetAtTime(0, t, .08);
      for (const o of mot.arret) o.stop(t + .5);
      mot = null;
    }
  }

  // ---------- musique d'ambiance : 84 battements par minute, do majeur, arpèges pincés et mélodie pentatonique espacée ----------
  const ACCORDS = [[261.6, 329.6, 392], [349.2, 440, 523.3], [220, 261.6, 329.6], [392, 493.9, 587.3]];   // do, fa, la m, sol
  const GAMME = [523.3, 587.3, 659.3, 784, 880, 1047];
  let mesure = 0, prochaine = 0;
  function pince(t, f, v) {
    // corde pincée : triangle très court, un peu de brillance
    note(t, f, "triangle", .004, .9, v, busMusique); note(t, f * 2, "sine", .002, .3, v * .25, busMusique);
  }
  function planifier() {
    const beat = 60 / 84;
    while (prochaine < ctx.currentTime + 1.5) {
      const t = prochaine, acc = ACCORDS[mesure % 4];
      note(t, acc[0] / 2, "sine", .01, beat * 1.8, .1, busMusique); note(t + beat * 2, acc[0] / 2, "sine", .01, beat * 1.5, .08, busMusique);
      // arpège : fondamentale, quinte, tierce, quinte… sur les croches
      const motif = [0, 2, 1, 2, 0, 2, 1, 2];
      motif.forEach((k, i) => pince(t + i * beat / 2, acc[k], i % 2 ? .035 : .05));
      for (let b = 0; b < 4; b++) if (Math.random() < .28) note(t + b * beat, GAMME[Math.floor(Math.random() * GAMME.length)], "sine", .01, beat * 1.3, .045, busMusique);
      prochaine += beat * 4; mesure++;
    }
  }
  function lancerMusique() {
    if (!ctx || minuteur) return;
    prochaine = ctx.currentTime + .1; busMusique.gain.cancelScheduledValues(ctx.currentTime); busMusique.gain.setTargetAtTime(.42, ctx.currentTime, 1.2);
    planifier(); minuteur = setInterval(planifier, 400);
  }
  function arreterMusique() {
    if (!ctx || !minuteur) return;
    clearInterval(minuteur); minuteur = null; busMusique.gain.cancelScheduledValues(ctx.currentTime); busMusique.gain.setTargetAtTime(0, ctx.currentTime, .3);
  }
  function musique(oui) { musiqueVoulue = !!oui; if (musiqueVoulue) { if (demarrer()) lancerMusique(); } else arreterMusique(); }
  document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else ctx.resume(); });
  return { jouer, moteur, musique, bruitages: oui => { bruit = !!oui; if (!bruit) moteur(false); } };
})();

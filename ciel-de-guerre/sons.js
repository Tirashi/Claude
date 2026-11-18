/* Ciel de guerre : bruitages et musique, synthétisés en Web Audio (aucun fichier son).
   CDGSons.jouer(nom, volume) : tir, missile, boom, boomGros, touche, verrou, annonce, victoire, defaite.
   CDGSons.moteur(vitesse 0..2, boost, actif) : le souffle du réacteur, qui monte avec la vitesse et le boost (appelé à chaque image).
   CDGSons.reglages({bruitages, musique}) ; réglages gardés dans cieldeguerre.son. Le son ne démarre qu'après un premier geste,
   et l'AudioContext n'est jamais réveillé si tout est coupé (sur certains Android, le réveil seul fait un clic). */
const CDGSons = (function () {
  let ctx = null, sortie = null, busB = null, busM = null, R = { bruitages: true, musique: true };
  try { Object.assign(R, JSON.parse(localStorage.getItem("cieldeguerre.son")) || {}); } catch (e) {}
  const voulu = () => R.bruitages || R.musique;
  function demarrer() {
    if (!voulu()) return false;
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); sortie = ctx.createDynamicsCompressor(); sortie.connect(ctx.destination);
    busB = ctx.createGain(); busB.gain.value = R.bruitages ? .5 : 0; busB.connect(sortie);
    busM = ctx.createGain(); busM.gain.value = R.musique ? .16 : 0; busM.connect(sortie);
    lancerMusique(); return true;
  }
  ["pointerdown", "keydown"].forEach(e => addEventListener(e, demarrer, { passive: true }));

  // ---------- briques ----------
  let tampon = null;
  function souffle() {
    if (!tampon) { tampon = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = tampon.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(); s.buffer = tampon; return s;
  }
  function env(g, t, a, d, v) { g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + d); }
  function bruit(t, type, f, q, a, d, v, f2, bus) {
    const s = souffle(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d); fl.Q.value = q;
    env(g, t, a, d, v); s.connect(fl); fl.connect(g); g.connect(bus || busB); s.start(t, Math.random()); s.stop(t + a + d + .05);
  }
  function note(t, f, type, a, d, v, bus, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g, t, a, d, v); o.connect(g); g.connect(bus || busB); o.start(t); o.stop(t + a + d + .05);
  }

  // ---------- bruitages ----------
  let dernierTir = 0;
  const SONS = {
    tir(t, v) { if (t - dernierTir < .05) return; dernierTir = t; bruit(t, "bandpass", 2400, 1.2, .002, .05, .22 * v, 900); note(t, 180, "square", .002, .04, .05 * v, null, 90); },
    missile(t, v) { bruit(t, "bandpass", 500, 2, .02, .7, .3 * v, 2600); note(t, 220, "sawtooth", .01, .35, .04 * v, null, 660); },
    boom(t, v) { bruit(t, "lowpass", 1400, .7, .005, .5, .55 * v, 120); note(t, 90, "sine", .005, .35, .35 * v, null, 35); },
    boomGros(t, v) { bruit(t, "lowpass", 1100, .8, .01, 1.3, .8 * v, 70); note(t, 70, "sine", .01, .9, .5 * v, null, 25); bruit(t + .12, "lowpass", 600, .7, .02, .9, .35 * v, 60); },
    touche(t, v) { bruit(t, "highpass", 1800, .8, .002, .09, .3 * v); note(t, 140, "square", .002, .08, .1 * v, null, 70); },
    verrou(t, v) { note(t, 1320, "square", .002, .06, .07 * v); note(t + .08, 1760, "square", .002, .1, .07 * v); },
    annonce(t, v) { note(t, 660, "triangle", .01, .25, .08 * v); note(t + .12, 990, "triangle", .01, .35, .07 * v); },
    victoire(t, v) { [523, 659, 784, 1047].forEach((f, i) => note(t + i * .13, f, "triangle", .01, .45, .12 * v)); },
    defaite(t, v) { [392, 330, 262, 196].forEach((f, i) => note(t + i * .18, f, "triangle", .01, .5, .11 * v)); }
  };
  function jouer(nom, v = 1) { if (!R.bruitages || !ctx || ctx.state !== "running" || !SONS[nom] || v <= .01) return; SONS[nom](ctx.currentTime, Math.min(1, v)); }

  // ---------- réacteur : un souffle filtré et un grondement, qui montent avec la vitesse ----------
  let mot = null;
  function moteur(vit, boost, actif) {
    if (!ctx || ctx.state !== "running") return;
    if (!mot) { const s = souffle(); s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = "bandpass"; fl.Q.value = .9;
      const o = ctx.createOscillator(); o.type = "sawtooth"; const fo = ctx.createBiquadFilter(); fo.type = "lowpass"; fo.frequency.value = 260;
      const g = ctx.createGain(); g.gain.value = 0; s.connect(fl); fl.connect(g); o.connect(fo); fo.connect(g); g.connect(busB); s.start(); o.start(); mot = { fl, o, g }; }
    const t = ctx.currentTime, cible = actif && R.bruitages ? .07 + (boost ? .07 : 0) : 0;
    mot.g.gain.setTargetAtTime(cible, t, .15); mot.fl.frequency.setTargetAtTime(380 + vit * 520 + (boost ? 700 : 0), t, .2); mot.o.frequency.setTargetAtTime(48 + vit * 30 + (boost ? 22 : 0), t, .2);
  }

  // ---------- musique : boucle de combat en la mineur (basse, arpège, nappe, batterie), mixée sous les bruitages ----------
  let minuteur = null, pas = 0, prochain = 0;
  const TEMPO = 118, D = 60 / TEMPO / 2; /* une croche */
  const GRILLE = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]; /* la mineur, fa, sol, mi mineur (notes MIDI) */
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function lancerMusique() {
    if (minuteur || !ctx) return; prochain = ctx.currentTime + .1;
    minuteur = setInterval(() => {
      if (!ctx || ctx.state !== "running") return;
      while (prochain < ctx.currentTime + .25) { jouerPas(prochain, pas); prochain += D; pas++; }
    }, 60);
  }
  function jouerPas(t, p) {
    if (!R.musique) return;
    const mes = Math.floor(p / 16) % 4, c = GRILLE[mes], i = p % 16;
    if (i % 2 === 0) note(t, hz(c[0] - 24), "square", .005, D * 1.6, i % 8 === 0 ? .2 : .13, busM);                           // basse
    note(t, hz(c[[0, 1, 2, 1][i % 4]] + (i >= 8 ? 12 : 0)), "triangle", .005, D * .9, .07, busM);                               // arpège
    if (i === 0) for (const n of c) note(t, hz(n), "sawtooth", .3, D * 14, .025, busM);                                          // nappe
    if (i % 4 === 0) { note(t, 120, "sine", .002, .18, .35, busM, 40); }                                                         // grosse caisse
    if (i % 4 === 2) bruit(t, "highpass", 7000, .7, .002, .05, .05, 0, busM);                                                    // charleston
    if (i % 8 === 4) bruit(t, "bandpass", 1800, .8, .002, .14, .12, 0, busM);                                                    // caisse claire
  }
  function reglages(r) {
    if (r) { Object.assign(R, r); try { localStorage.setItem("cieldeguerre.son", JSON.stringify(R)); } catch (e) {} }
    if (ctx) { busB.gain.setTargetAtTime(R.bruitages ? .5 : 0, ctx.currentTime, .05); busM.gain.setTargetAtTime(R.musique ? .16 : 0, ctx.currentTime, .1); }
    else if (voulu()) demarrer();
    return Object.assign({}, R);
  }
  return { jouer, moteur, reglages };
})();
window.CDGSons = CDGSons;

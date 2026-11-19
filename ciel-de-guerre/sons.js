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
    chargerEchantillons(); lancerMusique(); return true;
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
  const VAR = { boom: "A" };   /* variantes choisies (banc d'essai : maquettes/ciel-de-guerre-sons.html) */
  const SONS = {
    tir(t, v) { if (t - dernierTir < .05) return; dernierTir = t; bruit(t, "bandpass", 2400, 1.2, .002, .05, .22 * v, 900); note(t, 180, "square", .002, .04, .05 * v, null, 90); },
    missile(t, v) { bruit(t, "bandpass", 500, 2, .02, .7, .3 * v, 2600); note(t, 220, "sawtooth", .01, .35, .04 * v, null, 660); },
    boom(t, v, d) { if (!boomEnr(t, v, d, false)) explosion(t, v, d, false); },
    boomGros(t, v, d) { if (!boomEnr(t, v, d, true)) explosion(t, v, d, true); },
    touche(t, v) { bruit(t, "highpass", 1800, .8, .002, .09, .3 * v); note(t, 140, "square", .002, .08, .1 * v, null, 70); },
    verrou(t, v) { note(t, 1320, "square", .002, .06, .07 * v); note(t + .08, 1760, "square", .002, .1, .07 * v); },
    annonce(t, v) { note(t, 660, "triangle", .01, .25, .08 * v); note(t + .12, 990, "triangle", .01, .35, .07 * v); },
    victoire(t, v) { [523, 659, 784, 1047].forEach((f, i) => note(t + i * .13, f, "triangle", .01, .45, .12 * v)); },
    defaite(t, v) { [392, 330, 262, 196].forEach((f, i) => note(t + i * .18, f, "triangle", .01, .5, .11 * v)); }
  };
  function jouer(nom, v = 1, d = 0) { if (!R.bruitages || !ctx || ctx.state !== "running" || !SONS[nom] || v <= .01) return; SONS[nom](ctx.currentTime, Math.min(1, v), d); }

  // ---------- explosions enregistrées (choisies au banc d'essai du 18/11) : sons/*.mp3, ou window.CDG_SONS (base64) dans l'artefact ----------
  // expl-1, expl-4, expl-7 : NIIIEMAND (CC0), explosions proches ; expl-3 : NIIIEMAND, grave comme un gros canon, pour les explosions lointaines ;
  // (le gros son d'écrasement, Matthew Flat, a été retiré le 19/11 : trop fort, il détonnait)
  const ECH = {}, NOMS_ECH = ["expl-1", "expl-3", "expl-4", "expl-7", "reacteur-d", "reacteur-i"];
  function chargerEchantillons() {
    for (const k of NOMS_ECH) {
      const b64 = window.CDG_SONS && window.CDG_SONS[k];
      const donnees = b64 ? Promise.resolve(Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer) : fetch("sons/" + k + ".mp3").then(r => r.ok ? r.arrayBuffer() : Promise.reject(r.status));
      donnees.then(a => new Promise((ok, ko) => ctx.decodeAudioData(a, ok, ko))).then(buf => { ECH[k] = buf; }).catch(() => {});
    }
  }
  // joue un échantillon : coupe-haut fc (étouffé au loin), vitesse un peu variée ; renvoie false s'il n'est pas (encore) chargé
  function echantillon(t, k, v, fc) {
    const buf = ECH[k]; if (!buf) return false;
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = buf; s.playbackRate.value = .93 + Math.random() * .14; f.type = "lowpass"; f.frequency.value = fc; g.gain.value = v;
    s.connect(f); f.connect(g); g.connect(busB); s.start(t); return true;
  }
  const PROCHES = ["expl-1", "expl-4", "expl-7"];
  function boomEnr(t, v, d, gros) {
    const loin = Math.max(0, Math.min(1, d || 0));
    if (loin > .45) return echantillon(t, "expl-3", (gros ? 1.1 : .8) * v, 1100 - 500 * loin);                       // au loin : le gros canon, étouffé
    const k = gros ? (Math.random() < .5 ? "expl-4" : "expl-7") : PROCHES[Math.random() * 3 | 0];
    return echantillon(t, k, (gros ? 1.5 : 1.2) * v, 18000 - 24000 * loin);
  }

  // ---------- explosions synthétisées (en attendant le chargement des enregistrements) : trois variantes (VAR.boom) ; d = distance relative (0 tout près, 1 très loin : étouffé) ----------
  // A « tonnerre » : claquement sec, corps grondant un peu saturé, boum grave. B « sourde » : grave et roulante, sans claquement. C « crépitante » : corps et éclats qui crépitent.
  let sature = null;
  function saturation() { if (!sature) { sature = ctx.createWaveShaper(); const n = 1024, k = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; k[i] = Math.tanh(x * 2.4); } sature.curve = k; sature.connect(busB); } return sature; }
  function couche(t, f1, f2, q, a, dur, v, sortieN) { const s = souffle(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); fl.type = "lowpass"; fl.Q.value = q;
    fl.frequency.setValueAtTime(f1, t); fl.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + a + dur); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + a + dur);
    s.connect(fl); fl.connect(g); g.connect(sortieN || busB); s.start(t, Math.random()); s.stop(t + a + dur + .05); }
  function explosion(t, v, d, gros) {
    v *= .8;
    const loin = Math.max(0, Math.min(1, d || 0)), etouffe = 1 - loin * .75, k = gros ? 1.35 : 1, va = VAR.boom, r = .85 + Math.random() * .3;
    if (va === "A") {
      if (loin < .6) bruit(t, "highpass", 1500, .7, .001, .035, .35 * v * (1 - loin), 0);                                              // claquement
      couche(t, 1600 * etouffe * r, 90, .8, .006, .9 * k, .7 * v, saturation());                                                      // corps saturé
      note(t, 75 * r, "sine", .004, .45 * k, .55 * v, null, 32);                                                                        // boum grave
      if (gros) couche(t + .15, 700 * etouffe, 60, .6, .05, 1.2, .35 * v);                                                             // queue qui roule
    } else if (va === "B") {
      couche(t, 520 * etouffe * r, 55, .9, .02, 1.5 * k, .85 * v);
      note(t, 55 * r, "sine", .01, .8 * k, .6 * v, null, 24); note(t + .05, 42 * r, "triangle", .02, .9 * k, .25 * v, null, 22);
    } else {
      couche(t, 1300 * etouffe * r, 110, .7, .005, .7 * k, .6 * v, saturation()); note(t, 80 * r, "sine", .004, .35 * k, .45 * v, null, 35);
      const n = gros ? 12 : 7; for (let i = 0; i < n; i++) { const ti = t + .08 + Math.random() * .7 * k; bruit(ti, "bandpass", 1800 + Math.random() * 2600, 1.5, .001, .03 + Math.random() * .04, .12 * v * etouffe, 0); }   // éclats
    }
  }

  // ---------- réacteur, appelé à chaque image : deux boucles enregistrées choisies au banc du 18/11 (D et I, CC0, OpenGameArt) ----------
  // reacteur-d : « Rocket Engine » (theminesareshakin), grondement de fusée ; reacteur-i : « Underwater or space engine rumble » (gmason), ronflement sourd.
  // Bouclées sans couture (fondu de la fin sur le début). La vitesse fait monter la hauteur et ouvre le filtre ; le boost met I en avant.
  let mot = null;
  function arreterMoteur() { if (!mot) return; for (const n of mot.sources) { try { n.stop(); } catch (e) {} } mot.g.disconnect(); mot = null; }
  function boucle(k, g) { const buf = ECH[k], s = ctx.createBufferSource(), gg = ctx.createGain(); s.buffer = buf; s.loop = true; s.loopStart = .05; s.loopEnd = buf.duration - .05; gg.gain.value = 0; s.connect(gg); gg.connect(g); s.start(0, .05 + Math.random() * (buf.duration - .2)); return { s, gg }; }
  function creerMoteur() {
    if (!ECH["reacteur-d"] || !ECH["reacteur-i"]) return;
    const g = ctx.createGain(); g.gain.value = 0; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2500; lp.connect(g); g.connect(busB);
    const d = boucle("reacteur-d", lp), i = boucle("reacteur-i", lp);
    mot = { g, lp, d, i, sources: [d.s, i.s] };
  }
  function moteur(vit, boost, actif) {
    if (!ctx || ctx.state !== "running") return;
    if (!mot) creerMoteur(); if (!mot) return;
    const t = ctx.currentTime, on = actif && R.bruitages, r = .75 + vit * .35 + (boost ? .2 : 0);
    mot.g.gain.setTargetAtTime(on ? (boost ? .35 : .21) : 0, t, .2);   /* discret : sous les rafales du canon */
    mot.lp.frequency.setTargetAtTime(1500 + vit * 1500 + (boost ? 2000 : 0), t, .2);
    mot.d.s.playbackRate.setTargetAtTime(r, t, .15); mot.i.s.playbackRate.setTargetAtTime(r * .95, t, .15);
    mot.d.gg.gain.setTargetAtTime(boost ? .45 : .6, t, .2); mot.i.gg.gain.setTargetAtTime(boost ? .75 : .45, t, .2);
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
  // banc d'essai : choisir une variante, ou la faire entendre
  function variantes(v) { if (v) Object.assign(VAR, v); return Object.assign({}, VAR); }
  return { jouer, moteur, reglages, variantes, demarrer };
})();
window.CDGSons = CDGSons;

/* Armateur des étoiles : sons et musique, entièrement synthétisés (Web Audio, aucun fichier).
   Une chaîne unique : bus des sons + bus de la musique → volume → compresseur doux ; une réverbération partagée donne le côté « salle ».
   Les sons sont des notes de sinus et de triangle à l'enveloppe lente, sur une gamme pentatonique ; la musique est un tapis d'accords (A mineur, 4 accords de 20 s)
   avec de rares cloches. Le navigateur n'autorise le son qu'après un geste du joueur : `debloquer()` est appelé au premier toucher. */
(function () {
const F = window.Flotte = window.Flotte || {};
const PENTA = [659.25, 783.99, 880, 987.77, 1174.66];                     // mi5 sol5 la5 si5 ré6 : les livraisons
const CLOCHES = [440, 523.25, 587.33, 659.25, 783.99, 880];               // la mineur pentatonique : la musique
const ACCORDS = [[110, 164.81, 246.94, 261.63], [87.31, 130.81, 220, 329.63], [130.81, 196, 293.66, 329.63], [98, 146.83, 246.94, 329.63]];
const DUREE_ACCORD = 20, AVANCE = 26;

let ac = null, master = null, bSons = null, bMus = null, rev = null;
let prefs = { sons: true, musique: true, volume: .7 };
let accord = 0, prochain = 0, minuteur = 0, prochaineCloche = 0, derniereLivraison = 0, nbLivraisons = 0;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dispo = () => !!(window.AudioContext || window.webkitAudioContext);

function impulsion(sec, chute) {
  const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let prec = 0; for (let i = 0; i < n; i++) { const v = (Math.random() * 2 - 1) * Math.pow(1 - i / n, chute); prec = prec * .55 + v * .45; d[i] = prec; } }
  return b;
}

function creer() {
  if (ac || !dispo()) return !!ac;
  try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return false; }
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.knee.value = 26; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .3;
  master = ac.createGain(); master.gain.value = prefs.volume * .9; master.connect(comp); comp.connect(ac.destination);
  rev = ac.createConvolver(); rev.buffer = impulsion(2.8, 2.4);
  const retour = ac.createGain(); retour.gain.value = .9; rev.connect(retour); retour.connect(master);
  bSons = ac.createGain(); bSons.gain.value = prefs.sons ? 1 : 0; bSons.connect(master);
  const envoiS = ac.createGain(); envoiS.gain.value = .28; bSons.connect(envoiS); envoiS.connect(rev);
  bMus = ac.createGain(); bMus.gain.value = prefs.musique ? .45 : 0; bMus.connect(master);
  const envoiM = ac.createGain(); envoiM.gain.value = .5; bMus.connect(envoiM); envoiM.connect(rev);
  return true;
}

// Une note : enveloppe douce (attaque a, décroissance exponentielle jusqu'à d), filtre passe-bas et placement stéréo facultatifs
function note(dest, t, f, d, o) {
  o = o || {};
  const osc = ac.createOscillator(), g = ac.createGain(), v = o.v || .1, a = o.a || .006;
  osc.type = o.type || "sine"; osc.frequency.setValueAtTime(f, t);
  if (o.glisse) osc.frequency.exponentialRampToValueAtTime(Math.max(20, f * o.glisse), t + d);
  if (o.detune) osc.detune.value = o.detune;
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a);
  if (o.tenue) g.gain.setValueAtTime(v, t + o.tenue);
  g.gain.exponentialRampToValueAtTime(.0001, t + d);
  let sortie = osc;
  if (o.filtre) { const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = o.filtre; sortie.connect(fl); sortie = fl; }
  sortie.connect(g); sortie = g;
  if (o.pan != null && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = clamp(o.pan, -.8, .8); sortie.connect(p); sortie = p; }
  sortie.connect(dest); osc.start(t); osc.stop(t + d + .1);
}

function bruit(dest, t, d, o) {
  o = o || {};
  const n = Math.floor(ac.sampleRate * d), b = ac.createBuffer(1, n, ac.sampleRate), x = b.getChannelData(0);
  for (let i = 0; i < n; i++) x[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(); s.buffer = b;
  const fl = ac.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.setValueAtTime(o.debut || 1400, t); fl.frequency.exponentialRampToValueAtTime(o.fin || 160, t + d);
  const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(o.v || .12, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  s.connect(fl); fl.connect(g); g.connect(dest); s.start(t); s.stop(t + d + .05);
}

// ---- les sons ----
const SONS = {
  clic: t => note(bSons, t, 1350, .06, { v: .025, filtre: 3000 }),
  achat: t => { note(bSons, t, 523.25, .26, { v: .1, type: "triangle", filtre: 2600, glisse: 1.04 }); note(bSons, t + .07, 783.99, .34, { v: .085, filtre: 3200 }); },
  amelio: t => [392, 523.25, 659.25, 783.99].forEach((f, i) => note(bSons, t + i * .06, f, .6, { v: .075, filtre: 3400 })),
  eclat: t => { note(bSons, t, 880, .7, { v: .08 }); note(bSons, t + .09, 1318.5, .9, { v: .07 }); note(bSons, t + .18, 1760, 1.1, { v: .04 }); },
  zone: t => {
    [220, 329.63, 440, 554.37].forEach((f, i) => note(bSons, t + i * .12, f, 3.4, { v: .06, a: .7, type: "triangle", filtre: 1600 }));
    note(bSons, t + .9, 1760, 2.2, { v: .03, a: .1 }); note(bSons, t + 1.15, 2349.3, 2.2, { v: .022, a: .1 });
  },
  horizon: t => {
    [220, 329.63, 440, 554.37, 659.25, 880].forEach((f, i) => note(bSons, t + i * .24, f, 4, { v: .075, a: .12, type: i % 2 ? "sine" : "triangle", filtre: 2400 }));
    note(bSons, t + 1.6, 1318.5, 3, { v: .04, a: .2 });
  },
  retour: t => { note(bSons, t, 659.25, 1.3, { v: .08 }); note(bSons, t + .22, 987.77, 1.5, { v: .07 }); },
  alerte: t => { note(bSons, t, 440, .4, { v: .07, type: "triangle", filtre: 1300, glisse: .8 }); note(bSons, t + .3, 330, .55, { v: .07, type: "triangle", filtre: 1100, glisse: .8 }); },
  pillage: t => note(bSons, t, 300, .5, { v: .1, type: "triangle", filtre: 900, glisse: .5 }),
  tir: (t, o) => note(bSons, t, 1500, .12, { v: .03, glisse: .55, pan: o && o.pan }),
  explosion: (t, o) => { bruit(bSons, t, .6, { v: .1 }); note(bSons, t, 120, .6, { v: .1, glisse: .5, type: "triangle", filtre: 500, pan: o && o.pan }); },
  livraison: (t, o) => {
    const f = PENTA[Math.floor(Math.random() * PENTA.length)], v = (o && o.v) || .03;
    note(bSons, t, f, .5, { v, pan: o && o.pan, filtre: 5000 }); note(bSons, t, f * 2, .3, { v: v * .3, pan: o && o.pan });
  }
};

// Joue un son par son nom ; `o.pan` (-1 à 1) place le son à gauche ou à droite
function jouer(nom, o) {
  if (!ac || !prefs.sons || ac.state !== "running" || !SONS[nom]) return;
  const t = ac.currentTime + .005 + ((o && o.delai) || 0);
  if (nom === "livraison") {                                          // beaucoup de navires : on espace et on adoucit
    const maintenant = ac.currentTime;
    if (maintenant - derniereLivraison > 1) nbLivraisons = 0;
    if (nbLivraisons >= 4 || maintenant - derniereLivraison < .12) return;
    nbLivraisons++; derniereLivraison = maintenant; if (!o) o = {};
  }
  try { SONS[nom](t, o); } catch (e) {}
}

// ---- la musique ----
function pad(t, f, d) {
  const filtre = ac.createBiquadFilter(); filtre.type = "lowpass"; filtre.frequency.value = 760; filtre.Q.value = .4;
  const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.02, t + 6); g.gain.setValueAtTime(.02, t + d - 5); g.gain.exponentialRampToValueAtTime(.0001, t + d + 4);
  filtre.connect(g); g.connect(bMus);
  [["sine", -5], ["triangle", 5]].forEach(([type, c]) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = c; o.connect(filtre); o.start(t); o.stop(t + d + 4.2); });
}
function planifier() {
  if (!ac || ac.state !== "running" || !prefs.musique) return;
  if (prochain < ac.currentTime) { prochain = ac.currentTime + .3; prochaineCloche = prochain + 3; }
  while (prochain < ac.currentTime + AVANCE) {
    ACCORDS[accord % ACCORDS.length].forEach(f => pad(prochain, f, DUREE_ACCORD));
    // quelques cloches très douces, loin dans la réverbération
    for (; prochaineCloche < prochain + DUREE_ACCORD; prochaineCloche += 3.5 + Math.random() * 4.5)
      note(bMus, prochaineCloche, CLOCHES[Math.floor(Math.random() * CLOCHES.length)], 4.5, { v: .02, a: .02, pan: Math.random() * 1.2 - .6 });
    prochain += DUREE_ACCORD; accord++;
  }
}
function demarrerMusique() { if (!minuteur) minuteur = setInterval(planifier, 1000); planifier(); }

// ---- réglages ----
function appliquer() {
  if (!ac) return;
  const t = ac.currentTime;
  bSons.gain.setTargetAtTime(prefs.sons ? 1 : 0, t, .08);
  bMus.gain.setTargetAtTime(prefs.musique ? .45 : 0, t, .6);
  master.gain.setTargetAtTime(prefs.volume * .9, t, .05);
  if (prefs.musique) demarrerMusique();
}
function regler(p) { Object.assign(prefs, p); appliquer(); }

// Au premier geste du joueur : crée le contexte audio et lance la musique
function debloquer() {
  if (!prefs.sons && !prefs.musique) return;
  if (!creer()) return;
  if (ac.state !== "running") ac.resume().then(() => { appliquer(); }).catch(() => {}); else appliquer();
}
function init(p) {
  Object.assign(prefs, p || {});
  const geste = () => { debloquer(); if (ac && ac.state === "running") ["pointerdown", "keydown", "touchend"].forEach(e => window.removeEventListener(e, geste, true)); };
  ["pointerdown", "keydown", "touchend"].forEach(e => window.addEventListener(e, geste, true));
}

F.Son = { init, debloquer, jouer, regler, prefs: () => prefs, dispo, contexte: () => ac };
})();

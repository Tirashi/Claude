/* Le Thé des Jarls : bruitages synthétisés en Web Audio (aucun fichier son), sur le modèle de duche/sons.js.
   JarSons.jouer(nom) : des (dés qui roulent), garder (clic du bois), fleches (volée), haches (charge et choc),
   vol (pas furtifs et pièce), dieu (cor et souffle), foudre (craquement et grondement), soin (carillon),
   jeton (pièce), hiver (vent), victoire (fanfare), defaite (cor grave), page (page qui tourne).
   JarSons.actif(oui) coupe ou rend le son. Le son ne démarre qu'après un premier geste (règle des navigateurs). */
const JarSons = (function () {
  let ctx = null, bus = null, actif = true;
  function demarrer() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC(); const comp = ctx.createDynamicsCompressor(); comp.connect(ctx.destination);
    bus = ctx.createGain(); bus.gain.value = 0.45; bus.connect(comp);
    return true;
  }
  ['pointerdown', 'keydown'].forEach(e => addEventListener(e, demarrer, { passive: true }));
  let tampon = null;
  function souffle() {
    if (!tampon) { tampon = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = tampon.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const s = ctx.createBufferSource(); s.buffer = tampon; return s;
  }
  function env(g, t, a, d, v) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function bruit(t, type, f, q, a, d, v, f2) {
    const s = souffle(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + a + d); fl.Q.value = q;
    env(g, t, a, d, v); s.connect(fl); fl.connect(g); g.connect(bus); s.start(t, Math.random() * 0.5); s.stop(t + a + d + 0.05);
  }
  function note(t, f, type, a, d, v, f2) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(g, t, a, d, v); o.connect(g); g.connect(bus); o.start(t); o.stop(t + a + d + 0.05);
  }
  function cor(t, f, d, v) {
    const o = ctx.createOscillator(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.setValueAtTime(f * 1.5, t); fl.frequency.linearRampToValueAtTime(f * 4, t + 0.1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.06); g.gain.setValueAtTime(v, t + d * 0.7); g.gain.linearRampToValueAtTime(0, t + d);
    o.connect(fl); fl.connect(g); g.connect(bus); o.start(t); o.stop(t + d + 0.05);
  }
  const SONS = {
    des(t) { for (let k = 0; k < 7; k++) { const u = t + k * 0.045 + Math.random() * 0.02; bruit(u, 'bandpass', 1800 + Math.random() * 1500, 6, 0.002, 0.04, 0.5); note(u, 300 + Math.random() * 200, 'triangle', 0.001, 0.03, 0.12); } },
    garder(t) { bruit(t, 'bandpass', 1200, 8, 0.001, 0.05, 0.5); note(t, 520, 'triangle', 0.001, 0.06, 0.15); },
    fleches(t) { for (let k = 0; k < 5; k++) bruit(t + k * 0.07, 'highpass', 2500, 1, 0.05, 0.25, 0.18, 6000); },
    haches(t) { bruit(t, 'lowpass', 300, 1, 0.1, 0.5, 0.5); for (let k = 0; k < 4; k++) { bruit(t + 0.45 + k * 0.08, 'bandpass', 2600, 12, 0.001, 0.12, 0.35); note(t + 0.45 + k * 0.08, 1300 + k * 90, 'square', 0.001, 0.08, 0.05); } note(t + 0.4, 70, 'sine', 0.01, 0.4, 0.5, 40); },
    vol(t) { for (let k = 0; k < 4; k++) bruit(t + k * 0.09, 'bandpass', 800, 4, 0.005, 0.05, 0.2); note(t + 0.45, 1568, 'sine', 0.002, 0.25, 0.2); note(t + 0.5, 2093, 'sine', 0.002, 0.3, 0.15); },
    dieu(t) { cor(t, 147, 0.9, 0.22); cor(t + 0.15, 220, 0.8, 0.14); bruit(t, 'lowpass', 600, 1, 0.3, 0.8, 0.12); },
    foudre(t) { bruit(t, 'highpass', 1500, 1, 0.001, 0.25, 0.7); bruit(t + 0.05, 'lowpass', 200, 1, 0.05, 1.4, 0.6, 60); note(t, 55, 'sawtooth', 0.01, 1.0, 0.25, 30); },
    soin(t) { [784, 988, 1175, 1568].forEach((f, k) => note(t + k * 0.09, f, 'sine', 0.005, 0.5, 0.16)); },
    jeton(t) { note(t, 1975, 'sine', 0.001, 0.18, 0.18); note(t + 0.06, 2637, 'sine', 0.001, 0.25, 0.14); },
    hiver(t) { bruit(t, 'bandpass', 500, 3, 0.4, 1.2, 0.3, 900); bruit(t + 0.3, 'bandpass', 700, 4, 0.4, 1.0, 0.2, 400); },
    victoire(t) { [[262, 0], [330, 0.18], [392, 0.36], [523, 0.54]].forEach(([f, d]) => cor(t + d, f, d === 0.54 ? 1.0 : 0.22, 0.2)); },
    defaite(t) { cor(t, 196, 0.6, 0.2); cor(t + 0.5, 147, 1.2, 0.2); },
    page(t) { bruit(t, 'highpass', 3000, 0.7, 0.02, 0.18, 0.15, 1500); },
  };
  return {
    jouer(nom) { if (!actif || !SONS[nom] || !demarrer()) return; try { SONS[nom](ctx.currentTime + 0.01); } catch (e) { /* son indisponible */ } },
    actif(oui) { if (oui !== undefined) actif = !!oui; return actif; },
  };
})();

/* Tank Arena : arène en 3D (Three.js r128), toi contre 3 tanks de l'ordinateur, chacun pour soi, manches de 90 s.
   Modèles : pack Low Poly Tank Assets de dani567 (modeles.js, découpé par outils/tanks-maquette/extrait.py).
   Sauvegarde : tankarena.best (meilleure manche), tankarena.stats {parties, victoires, total}, tankarena.options {sons}.
   Classement : LudoScores "tankarena" / "best" (destructions en une manche, le plus haut gagne). Tests : window.TankArena. */
"use strict";
(function () {
const $ = id => document.getElementById(id);
const lire = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const DPR = Math.min(2, window.devicePixelRatio || 1);
const DUREE = 90;

// ---------- couleurs (le .mtl du pack est tout gris : reprises des images du pack) ----------
const COUL = {
  "Material.002": "#a7949f", "Material.003": "#c98f86", "Material.008": "#3a4fb4", "Material.015": "#e6d85a",
  "Material.011": "#8a6a48", "Material.019": "#6f6a96", "Material.024": "#bdb5ff", "Material.012": "#5e8c3a",
  "sol": "#9fc257", "Material.021": "#2c2c38", "Material.022": "#4b4b5a", "Material.023": "#9a9aac",
  "Material.006": "#f2b632", "Material.014": "#e2e2ec", "Material.016": "#e04040", "Material.009": "#7c40e6", "Material.005": "#f6cf48",
};
const EQUIPES = [
  { nom: "TOI", c: "#e2433a" }, { nom: "VERT", c: "#6cd046" }, { nom: "VIOLET", c: "#7a48ec" }, { nom: "JAUNE", c: "#f2c02c" },
];
const BONUS = [
  { k: "rep", nom: "REPARATION", c: "#7dff8a" }, { k: "tri", nom: "TIR TRIPLE", c: "#ffcf4a" },
  { k: "bou", nom: "BOUCLIER", c: "#7ad8ff" }, { k: "vit", nom: "VITESSE", c: "#ff9a4a" },
];
const DUREE_BONUS = { tri: 8, bou: 6, vit: 8 };
const lin = h => new THREE.Color(h).convertSRGBToLinear();

// ---------- sons synthétisés ----------
const Sons = {
  on: lire("tankarena.options", { sons: true }).sons !== false, ac: null, bruit: null,
  init() {
    if (this.ac) { if (this.ac.state === "suspended") this.ac.resume(); return; }
    try {
      this.ac = new (window.AudioContext || window.webkitAudioContext)();
      const n = this.ac.sampleRate, b = this.ac.createBuffer(1, n, n), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      this.bruit = b;
    } catch (e) { this.ac = null; }
  },
  env(g, t, a, v, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + d); },
  souffle(f, v, d, type = "lowpass") {
    if (!this.on || !this.ac) return;
    const t = this.ac.currentTime, s = this.ac.createBufferSource(), fi = this.ac.createBiquadFilter(), g = this.ac.createGain();
    s.buffer = this.bruit; fi.type = type; fi.frequency.setValueAtTime(f, t); fi.frequency.exponentialRampToValueAtTime(Math.max(40, f / 6), t + d);
    this.env(g, t, .005, v, d); s.connect(fi).connect(g).connect(this.ac.destination); s.start(t); s.stop(t + d + .05);
  },
  note(f, t0, d, v = .08, type = "square") {
    if (!this.on || !this.ac) return;
    const t = this.ac.currentTime + t0, o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); this.env(g, t, .01, v, d); o.connect(g).connect(this.ac.destination); o.start(t); o.stop(t + d + .05);
  },
  tir(loin) { this.souffle(2400, loin ? .04 : .13, .12, "bandpass"); },
  boum(gros) { this.souffle(gros ? 900 : 1600, gros ? .5 : .16, gros ? .7 : .25); },
  bonus() { [523, 659, 784, 1047].forEach((f, i) => this.note(f, i * .07, .12, .06)); },
  bip(f = 660) { this.note(f, 0, .15, .07); },
  fin(gagne) { (gagne ? [523, 659, 784, 1047, 1319] : [392, 330, 262]).forEach((f, i) => this.note(f, i * .13, .25, .07, "triangle")); },
};

// ---------- modèles ----------
let M = null;
const MATS = {}, GEOS = {};
function mat(h) { return MATS[h] || (MATS[h] = new THREE.MeshStandardMaterial({ color: lin(h), flatShading: true, roughness: .85, metalness: 0 })); }
function geos(nom) {
  if (GEOS[nom]) return GEOS[nom];
  return GEOS[nom] = Object.entries(M[nom]).map(([m, d]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(Float32Array.from(d.p, v => v / 1000), 3));
    g.setIndex(d.i); g.computeBoundingSphere(); return [m, g];
  });
}
function modele(nom, remap = {}, ombre = true) {
  const g = new THREE.Group();
  for (const [m, geo] of geos(nom)) {
    const me = new THREE.Mesh(geo, mat(remap[m] || COUL[m] || "#ff00ff"));
    me.castShadow = ombre; me.receiveShadow = true; g.add(me);
  }
  return g;
}

// ---------- terrain ----------
let OBS = [];
function hauteurSol(x, z) { const d = Math.hypot(x + .08, z - .17); return d < 1.5 ? .24 : d < 1.78 ? .24 * (1.78 - d) / .28 : 0; }
function collision(o, r) {
  for (const b of OBS) {
    const dx = o.x - b.x, dz = o.z - b.z, d = Math.hypot(dx, dz), m = b.r + r;
    if (d < m && d > 1e-4) { o.x = b.x + dx / d * m; o.z = b.z + dz / d * m; }
  }
  o.x = Math.max(-5.75, Math.min(5.75, o.x)); o.z = Math.max(-5.75, Math.min(5.75, o.z));
}
function libre(x, z, r) { return OBS.every(b => Math.hypot(x - b.x, z - b.z) > b.r + r) && Math.abs(x) < 5.7 && Math.abs(z) < 5.7; }
function place([x, z]) { for (let k = 0; k < 60 && !libre(x, z, .4); k++) { x *= .96; z *= .96; } return [x, z]; }
let DEPARTS = [[-4.2, 4.6], [4.4, -4.9], [-4.9, -1.2], [4.6, 3.6]];

// ---------- scène ----------
let rendu, scene, cam, cv, hud, ctx, W = 1, H = 1;
const fx = [], textes = [];
const GEO_BOULE = new THREE.IcosahedronGeometry(.16, 0);
const vise = new THREE.Vector3(), V3 = new THREE.Vector3();
let secousse = 0;

function construire() {
  cv = $("cv"); hud = $("hud"); ctx = hud.getContext("2d");
  rendu = new THREE.WebGLRenderer({ canvas: cv, antialias: true });
  rendu.outputEncoding = THREE.sRGBEncoding; rendu.shadowMap.enabled = true; rendu.shadowMap.type = THREE.PCFSoftShadowMap; rendu.setPixelRatio(DPR);
  scene = new THREE.Scene();
  scene.background = lin("#3c55c8"); scene.fog = new THREE.Fog(lin("#3c55c8"), 24, 48);
  scene.add(new THREE.HemisphereLight(lin("#e6e6ff"), lin("#5a4a70"), .75));
  const so = new THREE.DirectionalLight(lin("#fff1d8"), 1.25);
  so.position.set(-5, 11, 6); so.castShadow = true; so.shadow.mapSize.set(2048, 2048);
  const c = so.shadow.camera; c.left = c.bottom = -8; c.right = c.top = 8; c.near = 1; c.far = 30;
  so.shadow.bias = -.002; so.shadow.normalBias = .02; scene.add(so);
  scene.add(modele("arene"));
  scene.add(modele("sol", { "Material.002": COUL.sol }, false));
  cam = new THREE.PerspectiveCamera(50, 1, .5, 80); cam.position.set(-4, 10.5, 9);
  addEventListener("resize", taille); taille();
}
function taille() {
  W = Math.round(innerWidth * DPR); H = Math.round(innerHeight * DPR);
  rendu.setSize(innerWidth, innerHeight, false); hud.width = W; hud.height = H;
  cam.aspect = W / H; cam.fov = W > H ? 40 : 50; cam.updateProjectionMatrix();
}

function explosion(x, y, z, taille = 1) {
  for (let k = 0; k < 7; k++) {
    const m = new THREE.Mesh(GEO_BOULE, new THREE.MeshBasicMaterial({ color: k < 3 ? 0xfff0a0 : k < 5 ? 0xff9a30 : 0x6a5a6a, transparent: true }));
    const a = Math.random() * 6.3, r = Math.random() * .25 * taille;
    m.position.set(x + Math.cos(a) * r, y + Math.random() * .2, z + Math.sin(a) * r); scene.add(m);
    fx.push({ m, t: 0, d: .45 + Math.random() * .3, s: taille * (1 + Math.random()), vy: .6 + Math.random() });
  }
  if (S && S.tanks[0] && Math.hypot(x - S.tanks[0].x, z - S.tanks[0].z) < 5) secousse = Math.max(secousse, .1 * taille);
}
function majFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.t += dt; const k = f.t / f.d;
    if (k >= 1) { scene.remove(f.m); f.m.material.dispose(); fx.splice(i, 1); continue; }
    f.m.scale.setScalar(.4 + f.s * k * 1.6); f.m.position.y += f.vy * dt; f.m.material.opacity = 1 - k * k;
  }
  for (let i = textes.length - 1; i >= 0; i--) if ((textes[i].t += dt) > 1.3) textes.splice(i, 1);
}

// ---------- tanks ----------
function creerTank(eq) {
  const g = new THREE.Group(), m = modele("tank", { "Material.018": eq.c });
  m.rotation.y = Math.PI / 2; g.add(m);
  const bulle = new THREE.Mesh(new THREE.SphereGeometry(.48, 16, 10), new THREE.MeshBasicMaterial({ color: lin("#7ad8ff"), transparent: true, opacity: .28, depthWrite: false }));
  bulle.position.y = .25; bulle.visible = false; g.add(bulle);
  scene.add(g);
  return { g, m, bulle, eq, x: 0, z: 0, h: 0, pv: 100, mort: false, cad: 0, t: Math.random() * 9, kills: 0, effets: {} };
}
function placer(t) { t.g.position.set(t.x, hauteurSol(t.x, t.z), t.z); t.g.rotation.y = t.h; }
function tourner(t, cible, v, dt) {
  let d = cible - t.h; d = Math.atan2(Math.sin(d), Math.cos(d));
  t.h += Math.max(-v * dt, Math.min(v * dt, d)); return Math.abs(d);
}
const angle = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
const ecartAngle = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

// ---------- partie ----------
let S = null, tanks = null, caisseM = null, halo = null, anneau = null;
const joy = { actif: false, ox: 0, oy: 0, x: 0, y: 0, id: null };
const touches = new Set();
let ecranCourant = "titre";

function nouvellePartie() {
  if (!tanks) {
    tanks = EQUIPES.map(creerTank);
    anneau = new THREE.Mesh(new THREE.RingGeometry(.36, .44, 28), new THREE.MeshBasicMaterial({ color: lin("#ff3a2a"), transparent: true, opacity: .85 }));
    anneau.rotation.x = -Math.PI / 2; anneau.position.y = .02; tanks[0].g.add(anneau);
    caisseM = modele("caisse"); scene.add(caisseM);
    halo = new THREE.Mesh(new THREE.RingGeometry(.22, .3, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .9 }));
    halo.rotation.x = -Math.PI / 2; scene.add(halo);
  }
  for (const o of (S ? S.obus : [])) scene.remove(o.g);
  S = { tanks, obus: [], temps: DUREE, depart: 3.4, fin: false, caisse: null, tc: 5, pause: false };
  DEPARTS.forEach(([x, z], i) => { const t = tanks[i]; Object.assign(t, { x, z, h: Math.atan2(-x, -z), pv: 100, mort: false, cad: .5, kills: 0, effets: {}, inv: 0, recul: 0, coince: 0 }); t.g.visible = true; placer(t); });
  caisseM.visible = halo.visible = false;
  const j = tanks[0]; cam.position.set(j.x * .85, 10.5, j.z * .85 + 5); vise.set(j.x, 0, j.z - .3);
  joy.actif = false; touches.clear();
}

function tirer(t, cible) {
  const a = angle(t, cible), n = t.effets.tri > 0 ? 3 : 1;
  for (let k = 0; k < n; k++) {
    const b = a + (k - (n - 1) / 2) * .22, g = new THREE.Group(), m = modele("obus", {}, false);
    m.rotation.y = Math.PI / 2; g.add(m); g.rotation.y = b; scene.add(g);
    S.obus.push({ g, x: t.x + Math.sin(b) * .36, z: t.z + Math.cos(b) * .36, vx: Math.sin(b) * 7, vz: Math.cos(b) * 7, de: t, vie: 1.1 });
  }
  t.recul = .12;
  Sons.tir(t !== tanks[0] && Math.hypot(t.x - tanks[0].x, t.z - tanks[0].z) > 4);
}
function plusProche(t, portee) {
  let b = null, bd = portee;
  for (const u of tanks) if (u !== t && !u.mort) { const d = Math.hypot(u.x - t.x, u.z - t.z); if (d < bd) { bd = d; b = u; } }
  return b;
}
function renaitre(t) {
  let best = DEPARTS[0], bd = -1;
  for (const p of DEPARTS) { const d = Math.min(...tanks.filter(u => u !== t && !u.mort).map(u => Math.hypot(u.x - p[0], u.z - p[1])), 99); if (d > bd) { bd = d; best = p; } }
  Object.assign(t, { x: best[0], z: best[1], pv: 100, mort: false, inv: 1.5, effets: {} }); t.g.visible = true;
  t.h = Math.atan2(-t.x, -t.z);
}
function prendreBonus(t) {
  const b = S.caisse.b;
  if (b.k === "rep") t.pv = Math.min(100, t.pv + 50); else t.effets[b.k] = DUREE_BONUS[b.k];
  textes.push({ s: b.nom, x: t.x, z: t.z, t: 0, c: b.c });
  if (t === tanks[0]) Sons.bonus(); else Sons.bip(440);
  S.caisse = null; caisseM.visible = halo.visible = false; S.tc = 7 + Math.random() * 3;
}
function toucher(t, o) {
  if (t.inv || t.effets.bou > 0) { explosion(o.x, .3, o.z, .5); return; }
  t.pv -= 20;
  if (t === tanks[0]) secousse = Math.max(secousse, .12);
  if (t.pv <= 0) {
    t.mort = true; t.rt = 3; t.g.visible = false; o.de.kills++;
    explosion(t.x, .3, t.z, 2.2); Sons.boum(true);
    if (o.de === tanks[0]) textes.push({ s: "+1", x: t.x, z: t.z, t: 0, c: "#ffcf4a" });
  }
}

function majTank(t, dt) {
  t.t += dt; t.cad -= dt; if (t.inv) t.inv = Math.max(0, t.inv - dt);
  for (const k in t.effets) t.effets[k] -= dt;
  if (t.mort) { t.rt -= dt; if (t.rt <= 0) renaitre(t); return; }
  const joueur = t === tanks[0], cible = plusProche(t, 5.2), ox = t.x, oz = t.z;
  let mx = 0, mz = 0;
  if (joueur) {
    if (joy.actif) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy); if (l > 6 * DPR) { const k = Math.min(1, l / (38 * DPR)); mx = dx / l * k; mz = dy / l * k; } }
    const kx = (touches.has("d") ? 1 : 0) - (touches.has("g") ? 1 : 0), kz = (touches.has("b") ? 1 : 0) - (touches.has("h") ? 1 : 0);
    if (kx || kz) { const l = Math.hypot(kx, kz); mx = kx / l; mz = kz / l; }
  } else {
    const ennemi = plusProche(t, 99);
    const versCaisse = S.caisse && Math.hypot(S.caisse.x - t.x, S.caisse.z - t.z) < (S.caisse.b.k === "rep" && t.pv > 70 ? 0 : 4.5);
    const v = versCaisse ? S.caisse : ennemi;
    if (v) {
      const dx = v.x - t.x, dz = v.z - t.z, d = Math.hypot(dx, dz) || 1;
      if (versCaisse || d > 3.4) { mx = dx / d; mz = dz / d; }
      else if (d < 2) { mx = -dx / d; mz = -dz / d; }
      else { const s = Math.sin(t.t * .7 + EQUIPES.indexOf(t.eq) * 2) > 0 ? 1 : -1; mx = -dz / d * s * .7; mz = dx / d * s * .7; }
      if (t.coince > 0) { t.coince -= dt; mx = t.ex; mz = t.ez; }
    }
  }
  const vit = (joueur ? 2.7 : 2.1) * (t.effets.vit > 0 ? 1.6 : 1), l = Math.hypot(mx, mz);
  if (l > .05) { t.x += mx * vit * dt; t.z += mz * vit * dt; tourner(t, Math.atan2(mx, mz), 9, dt); }
  else if (cible) tourner(t, angle(t, cible), 7, dt);
  collision(t, .3);
  for (const u of tanks) if (u !== t && !u.mort) { const dx = t.x - u.x, dz = t.z - u.z, d = Math.hypot(dx, dz); if (d < .58 && d > 1e-3) { t.x = u.x + dx / d * .58; t.z = u.z + dz / d * .58; } }
  if (!joueur && l > .05 && Math.hypot(t.x - ox, t.z - oz) < vit * dt * .25 && !(t.coince > 0)) { const a = Math.random() * 6.3; t.coince = .8; t.ex = Math.cos(a); t.ez = Math.sin(a); }
  if (cible && t.cad <= 0 && (joueur || ecartAngle(angle(t, cible), t.h) < .3)) { tirer(t, cible); t.cad = joueur ? .55 : 1 + Math.random() * .6; }
  if (S.caisse && Math.hypot(S.caisse.x - t.x, S.caisse.z - t.z) < .5) prendreBonus(t);
  t.recul = Math.max(0, t.recul - dt);
  placer(t); t.m.position.set(0, l > .05 ? Math.abs(Math.sin(t.t * 22)) * .015 : 0, -t.recul * .6);
  t.bulle.visible = t.effets.bou > 0;
  t.g.visible = !t.inv || Math.sin(t.inv * 30) > 0;
}

function maj(dt) {
  majFx(dt);
  if (!S || S.pause) return;
  if (S.fin) return;
  if (S.depart > 0) {
    const avant = Math.ceil(S.depart - .4); S.depart -= dt; const apres = Math.ceil(S.depart - .4);
    if (apres !== avant) Sons.bip(apres > 0 ? 660 : 990);
    tanks.forEach(placer); suivre(dt); return;
  }
  S.temps -= dt;
  if (S.temps <= 0) { S.temps = 0; finir(); return; }
  for (const t of tanks) majTank(t, dt);
  for (let i = S.obus.length - 1; i >= 0; i--) {
    const o = S.obus[i];
    o.x += o.vx * dt; o.z += o.vz * dt; o.vie -= dt; o.g.position.set(o.x, .3 + hauteurSol(o.x, o.z), o.z);
    let touche = o.vie <= 0 || Math.abs(o.x) > 6 || Math.abs(o.z) > 6 || OBS.some(b => b.h > .3 && Math.hypot(o.x - b.x, o.z - b.z) < b.r);
    for (const t of tanks) if (t !== o.de && !t.mort && Math.hypot(o.x - t.x, o.z - t.z) < .32) { touche = true; toucher(t, o); break; }
    if (touche) {
      scene.remove(o.g); S.obus.splice(i, 1); explosion(o.x, .3, o.z, .7);
      if (Math.hypot(o.x - tanks[0].x, o.z - tanks[0].z) < 4) Sons.boum(false);
    }
  }
  if (!S.caisse && (S.tc -= dt) <= 0) {
    S.caisse = { x: -.08, z: .17, b: BONUS[Math.floor(Math.random() * BONUS.length)] };
    caisseM.visible = halo.visible = true; halo.material.color.set(S.caisse.b.c);
  }
  if (S.caisse) {
    caisseM.position.set(S.caisse.x, .26 + Math.sin(performance.now() / 300) * .05, S.caisse.z); caisseM.rotation.y += dt * 1.5;
    halo.position.set(S.caisse.x, .26, S.caisse.z); halo.scale.setScalar(1 + Math.sin(performance.now() / 200) * .15);
  }
  suivre(dt);
}
function suivre(dt) {
  const j = tanks[0], large = W > H;
  vise.lerp(V3.set(j.x, 0, j.z - .3), Math.min(1, dt * 4));
  cam.position.lerp(V3.set(j.x * .85, large ? 9 : 10.5, j.z * .85 + (large ? 6 : 5)), Math.min(1, dt * 3));
}

// ---------- fin de manche ----------
function finir() {
  S.fin = true; joy.actif = false; $("bPause").hidden = true;
  const moi = tanks[0].kills, cl = [...tanks].sort((a, b) => b.kills - a.kills || (a === tanks[0] ? -1 : b === tanks[0] ? 1 : 0));
  const max = cl[0].kills, gagne = moi === max && tanks.filter(t => t.kills === max).length === 1, egal = moi === max && !gagne;
  const best = lire("tankarena.best", 0), st = lire("tankarena.stats", { parties: 0, victoires: 0, total: 0 });
  st.parties++; st.total += moi; if (gagne) st.victoires++; ecrire("tankarena.stats", st);
  const record = moi > best; if (record) ecrire("tankarena.best", moi);
  $("fTitre").textContent = gagne ? "VICTOIRE !" : egal ? "EGALITE !" : "FIN DE MANCHE";
  $("fPodium").innerHTML = cl.map((t, i) => `<li class="${t === tanks[0] ? "moi" : ""}"><span>${i + 1}.</span><i style="background:${t.eq.c}"></i>${t.eq.nom}<b>${t.kills}</b></li>`).join("");
  $("fScore").textContent = moi + (moi > 1 ? " TANKS DETRUITS" : " TANK DETRUIT");
  $("fRecord").textContent = record ? "NOUVEAU RECORD !" : "RECORD : " + Math.max(best, moi);
  $("fRang").textContent = "";
  if (moi > 0 && window.LudoScores) LudoScores.submit("tankarena", "best", moi, false).then(r => { if (r) $("fRang").textContent = "CLASSEMENT : " + LudoScores.rankText(r); }).catch(() => {});
  Sons.fin(gagne);
  setTimeout(() => montrer("fin"), 900);
}

// ---------- écrans ----------
function montrer(e) {
  ecranCourant = e;
  $("eTitre").hidden = e !== "titre"; $("ePause").hidden = e !== "pause"; $("eFin").hidden = e !== "fin";
  $("bPause").hidden = e !== "jeu";
  if (e === "titre") { const b = lire("tankarena.best", 0), st = lire("tankarena.stats", { parties: 0, victoires: 0 }); $("tRecord").textContent = st.parties ? `RECORD : ${b} · VICTOIRES : ${st.victoires}` : ""; }
}
function jouer() { Sons.init(); nouvellePartie(); montrer("jeu"); }
function pause(oui) { if (!S || S.fin) return; S.pause = oui; joy.actif = false; montrer(oui ? "pause" : "jeu"); }
function majBoutonSons() { $("bSons").textContent = "BRUITAGES : " + (Sons.on ? "OUI" : "NON"); }

// ---------- interface 2D ----------
function ecran(x, y, z) { V3.set(x, y, z).project(cam); return [(V3.x + 1) / 2 * W, (1 - V3.y) / 2 * H, V3.z]; }
function txt(s, x, y, taille, coul = "#fff", al = "center") {
  ctx.font = `${taille * DPR}px "Press Start 2P", monospace`; ctx.textAlign = al; ctx.textBaseline = "middle";
  ctx.fillStyle = "#000a"; ctx.fillText(s, x + DPR * 1.5, y + DPR * 1.5); ctx.fillStyle = coul; ctx.fillText(s, x, y);
}
function barre(t) {
  if (t.mort) return;
  const [x, y, z] = ecran(t.x, hauteurSol(t.x, t.z) + .78, t.z); if (z > 1) return;
  const w = 44 * DPR, h = 6 * DPR;
  txt(t === tanks[0] ? "TOI" : t.eq.nom, x, y - 9 * DPR, 5.5);
  ctx.fillStyle = "#111"; ctx.fillRect(x - w / 2 - DPR, y - DPR, w + 2 * DPR, h + 2 * DPR);
  ctx.fillStyle = "#333"; ctx.fillRect(x - w / 2, y, w, h);
  const k = Math.max(0, t.pv) / 100;
  ctx.fillStyle = t.eq.c; ctx.fillRect(x - w / 2, y, w * k, h);
  ctx.fillStyle = "#ffffff55"; ctx.fillRect(x - w / 2, y, w * k, h / 3);
  ctx.fillStyle = "#e8c050"; ctx.fillRect(x - w / 2, y + h + 2 * DPR, w, 2 * DPR);
  let bx = x - w / 2;
  for (const b of BONUS) if (t.effets[b.k] > 0) { ctx.fillStyle = b.c; ctx.fillRect(bx, y + h + 6 * DPR, 8 * DPR, 4 * DPR); bx += 10 * DPR; }
}
function dessinerHud() {
  ctx.clearRect(0, 0, W, H);
  if (!S || ecranCourant === "titre") return;
  tanks.forEach(barre);
  for (const x of textes) { const [px, py] = ecran(x.x, 1 + x.t * .8, x.z); txt(x.s, px, py, 7, x.c); }
  if (S.caisse) { const [px, py] = ecran(S.caisse.x, .9, S.caisse.z); txt(S.caisse.b.nom, px, py, 5.5, S.caisse.b.c); }
  const haut = 28 * DPR;
  txt(String(Math.ceil(S.temps)), W / 2, haut, 13, S.temps < 10 ? "#ff6050" : "#fff");
  tanks.forEach((t, i) => {
    ctx.fillStyle = "#000a"; ctx.fillRect(10 * DPR, haut - 8 * DPR + i * 17 * DPR, 30 * DPR, 14 * DPR);
    ctx.fillStyle = t.eq.c; ctx.fillRect(12 * DPR, haut - 6 * DPR + i * 17 * DPR, 10 * DPR, 10 * DPR);
    txt(String(t.kills), 26 * DPR, haut - 1 * DPR + i * 17 * DPR, 7, "#fff", "left");
  });
  if (S.depart > 0) { const n = Math.ceil(S.depart - .4); txt(n > 0 ? String(n) : "GO !", W / 2, H * .38, 26, n > 0 ? "#fff" : "#ffcf4a"); }
  if (joy.actif) {
    ctx.strokeStyle = "#ffffff70"; ctx.lineWidth = 3 * DPR; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 38 * DPR, 0, 7); ctx.stroke();
    const dx = joy.x - joy.ox, dy = joy.y - joy.oy, l = Math.hypot(dx, dy), k = l > 38 * DPR ? 38 * DPR / l : 1;
    ctx.fillStyle = "#ffffffa0"; ctx.beginPath(); ctx.arc(joy.ox + dx * k, joy.oy + dy * k, 16 * DPR, 0, 7); ctx.fill();
  } else if (S.temps > DUREE - 6 && !S.fin) txt("GLISSE POUR ROULER", W / 2, H - 40 * DPR, 7);
  if (tanks[0].mort && !S.fin) txt("RETOUR DANS " + Math.ceil(tanks[0].rt), W / 2, H * .38, 10, "#fff");
}

// ---------- entrées ----------
function pos(e) { return [e.clientX * DPR, e.clientY * DPR]; }
function brancher() {
  const z = $("jeu");
  z.addEventListener("pointerdown", e => {
    if (ecranCourant !== "jeu" || e.target !== cv || joy.actif) return;
    const [x, y] = pos(e); Object.assign(joy, { actif: true, ox: x, oy: y, x, y, id: e.pointerId });
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  });
  z.addEventListener("pointermove", e => { if (joy.actif && e.pointerId === joy.id) [joy.x, joy.y] = pos(e); });
  const lacher = e => { if (e.pointerId === joy.id) joy.actif = false; };
  z.addEventListener("pointerup", lacher); z.addEventListener("pointercancel", lacher);
  const CLES = { ArrowUp: "h", ArrowDown: "b", ArrowLeft: "g", ArrowRight: "d", z: "h", w: "h", s: "b", q: "g", a: "g", d: "d" };
  addEventListener("keydown", e => {
    if (e.key === "Escape" || e.key === "p") { if (ecranCourant === "jeu") pause(true); else if (ecranCourant === "pause") pause(false); return; }
    const k = CLES[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (k && ecranCourant === "jeu") { touches.add(k); e.preventDefault(); }
  });
  addEventListener("keyup", e => { const k = CLES[e.key.length === 1 ? e.key.toLowerCase() : e.key]; if (k) touches.delete(k); });
  addEventListener("blur", () => touches.clear());
  document.addEventListener("visibilitychange", () => { if (document.hidden && ecranCourant === "jeu") pause(true); });
  $("bJouer").onclick = jouer; $("bRejouer").onclick = jouer; $("bRecommencer").onclick = jouer;
  $("bPause").onclick = () => pause(true); $("bReprendre").onclick = () => pause(false);
  $("bTitre").onclick = $("bTitreP").onclick = () => { if (S) S.fin = true; montrer("titre"); };
  $("bSons").onclick = () => { Sons.on = !Sons.on; ecrire("tankarena.options", { sons: Sons.on }); majBoutonSons(); };
  majBoutonSons();
}

// ---------- boucle ----------
let avant = performance.now();
function boucle(now) {
  const dt = Math.min(.05, (now - avant) / 1000); avant = now;
  maj(dt);
  secousse = Math.max(0, secousse - dt * .5);
  cam.lookAt(vise.x + (Math.random() - .5) * secousse, vise.y, vise.z + (Math.random() - .5) * secousse);
  if (ecranCourant === "titre") { const a = now / 6000; cam.position.set(Math.sin(a) * 14, 11, Math.cos(a) * 14); vise.set(0, 0, 0); cam.lookAt(vise); }
  rendu.render(scene, cam);
  dessinerHud();
  requestAnimationFrame(boucle);
}

async function demarrer() {
  try {
    const bin = Uint8Array.from(atob(window.TA_MODELES), c => c.charCodeAt(0));
    M = JSON.parse(await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text());
  } catch (e) { $("tRecord").textContent = "IMPOSSIBLE DE CHARGER LES MODELES"; return; }
  OBS = M.obstacles.filter(o => o[4] !== "Cylinder" && o[3] > .3).map(([x, z, r, h]) => ({ x, z, r, h }));
  DEPARTS = DEPARTS.map(place);
  construire(); brancher(); montrer("titre"); window.TankArena.pret = true;
  requestAnimationFrame(boucle);
}

window.TankArena = {
  pret: false, jouer, finir: () => { if (S && !S.fin) { S.temps = 0; S.depart = 0; finir(); } }, pause,
  etat: () => S && { temps: S.temps, depart: S.depart, fin: S.fin, caisse: S.caisse && S.caisse.b.k,
    tanks: tanks.map(t => ({ x: t.x, z: t.z, pv: t.pv, kills: t.kills, mort: t.mort, effets: { ...t.effets } })) },
  S: () => S, tanks: () => tanks, bonus: (k) => { S.caisse = { x: tanks[0].x, z: tanks[0].z, b: BONUS.find(b => b.k === k) }; },
};
demarrer();
})();

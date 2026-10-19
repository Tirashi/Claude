'use strict';
/* =====================================================================
   ODYSSÉE : rendu Three.js (style C de maquettes/ulysse.html, « la mer Égée
   en 3D »), contrôles (inclinaison, doigt, clavier), écrans et sauvegarde.
   Les règles et les plateaux sont dans regles.js (ODY).
   ===================================================================== */
const $ = id => document.getElementById(id);

// ---------- sauvegarde (odyssee.stars, .best, .episode) ----------
const lireJ = (k, d) => { try { const v = JSON.parse(localStorage.getItem('odyssee.' + k)); return v == null ? d : v; } catch (e) { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem('odyssee.' + k, JSON.stringify(v)); } catch (e) {} };
let STARS = lireJ('stars', {}), BEST = lireJ('best', {});
// plateau du jour : odyssee.daily {AAAAMMJJ: ms (temps + 5 s par naufrage)}, odyssee.dailyTry = jour de la tentative classée
const todayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
let JOUR = null;      // { d, classe } pendant un plateau du jour

// ---------- sons (odyssee/sons.js) : musique lyre et flûte selon l'épisode, vagues, bruitages ; odyssee.son ----------
let SON = lireJ('son', true);
const son = (nom, v, dans) => { if (SON) OdysseeSons.jouer(nom, v, dans); };
const HUMEUR = { 3: 'danger', 5: 'danger', 8: 'danger', 6: 'nuit' };
function ambiance(humeur) { OdysseeSons.musique(SON ? humeur : null); OdysseeSons.mer(SON); }
function majSon() { for (const b of [$('bSon'), $('bSonP')]) b.textContent = SON ? 'SON : OUI' : 'SON : NON'; OdysseeSons.actif(SON); }
function basculerSon() { SON = !SON; ecrire('son', SON); OdysseeSons.init(); majSon(); ambiance(mode === 'titre' || mode === 'carte' ? 'calme' : HUMEUR[P && P.ep.n] || 'calme'); }
// le son ne peut démarrer qu'après un geste : au premier toucher
document.addEventListener('pointerdown', () => { OdysseeSons.init(); OdysseeSons.actif(SON); ambiance(mode === 'titre' || mode === 'carte' || !P ? 'calme' : HUMEUR[P.ep.n] || 'calme'); }, { once: true });
const ouvert = i => i === 0 || (STARS[ODY.PLATEAUX[i - 1].id] || 0) > 0;
const episodeAtteint = () => { let e = 1; ODY.PLATEAUX.forEach((P, i) => { if (ouvert(i)) e = Math.max(e, P.ep.n); }); return e; };
const totalEtoiles = () => ODY.PLATEAUX.reduce((s, P) => s + (STARS[P.id] || 0), 0);
const fmt = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const fmtD = t => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const chantDe = E => `CHANT ${E.chant} · ${E.nom.toUpperCase()}`;

// ---------- Three.js ----------
const cv = $('cv'), jeu = $('jeu');
let rendu = null;
try { rendu = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); rendu.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); }
catch (e) { rendu = null; }
const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(50, 1, 0.1, 120);
const hemi = new THREE.HemisphereLight(0xffffff, 0x2a7090, 0.7), soleil = new THREE.DirectionalLight(0xfff2d8, 0.75);
scene.add(hemi, soleil);
const pl = new THREE.Group(); scene.add(pl);       // le plateau, qui penche
const LUMIERES = {
  aube:  { ciel: 0xf6c7a6, haut: 0xffe8d6, bas: 0x4a5f80, h: 0.75, sol: 0xffb47a, s: 0.85, pos: [-7, 7, 3], mer: 0x2aa7c4, fond: 0x0f5f80 },
  jour:  { ciel: 0x9fdcff, haut: 0xffffff, bas: 0x2a7090, h: 0.62, sol: 0xfff2d8, s: 0.7, pos: [-5, 12, 6], mer: 0x179fbd, fond: 0x0d6b8a },
  vent:  { ciel: 0xbdd5e6, haut: 0xf2f8ff, bas: 0x3a6a88, h: 0.78, sol: 0xffffff, s: 0.55, pos: [4, 12, 6], mer: 0x2a9fbc, fond: 0x0f5f7e },
  orage: { ciel: 0x72839a, haut: 0xc8d4e8, bas: 0x203848, h: 0.7, sol: 0xdfe8ff, s: 0.42, pos: [3, 12, 5], mer: 0x2b8199, fond: 0x0c4a60 },
  crepuscule: { ciel: 0xc890b4, haut: 0xffd6ea, bas: 0x40306a, h: 0.7, sol: 0xff9a6a, s: 0.75, pos: [7, 6, 3], mer: 0x3a8fb8, fond: 0x1a3f6a },
  nuit:  { ciel: 0x0a0d1c, haut: 0x4a5a8a, bas: 0x05060c, h: 0.06, sol: 0x8090c0, s: 0.03, pos: [-3, 10, 4], mer: 0x1f5a7a, fond: 0x05141f, nuit: true },
  soir:  { ciel: 0xf2b77a, haut: 0xfff0d0, bas: 0x4a6080, h: 0.72, sol: 0xffc070, s: 0.8, pos: [6, 8, 4], mer: 0x2a9ab8, fond: 0x0f5a7a },
};

// petites aides de construction
const toile = (w, h, dessin) => { const c = document.createElement('canvas'); c.width = w; c.height = h; dessin(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
const plat = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); return m; };
const lambert = (color, o) => new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, o));
const basic = (color, o) => new THREE.MeshBasicMaterial(Object.assign({ color }, o));
// traits de vent qui défilent (une seule texture, chaque case est tournée dans le sens de son vent)
const TEX_VENT = toile(128, 128, (g, w, h) => {
  g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 9; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(52, 34); g.lineTo(82, 64); g.lineTo(52, 94); g.stroke();          // chevron dans le sens du vent
  g.lineWidth = 6;
  for (const [x, y] of [[6, 22], [70, 108]]) { g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + 14, y - 7, x + 30, y + 7, x + 46, y); g.stroke(); }
});

// courants de Calypso (même dessin, en bleu) et spirale des tourbillons de Charybde
const TEX_COURANT = toile(128, 128, (g, w, h) => {
  g.fillStyle = 'rgba(20,70,140,.22)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(190,240,255,.95)'; g.lineWidth = 8; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(52, 36); g.lineTo(80, 64); g.lineTo(52, 92); g.stroke();
  g.lineWidth = 5;
  for (const [x, y] of [[4, 20], [64, 110], [20, 64]]) { g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 12, y - 8, x + 24, y); g.quadraticCurveTo(x + 36, y + 8, x + 48, y); g.stroke(); }
});
const TEX_SPIRALE = toile(128, 128, g => {
  g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 6; g.lineCap = 'round';
  for (const d of [0, Math.PI]) { g.beginPath(); for (let a = 0; a < Math.PI * 3.2; a += 0.1) { const r = 6 + a * 5.6; g.lineTo(64 + Math.cos(a + d) * r, 64 + Math.sin(a + d) * r); } g.stroke(); }
});

// la galère : coque, mât, voile, huit rames, œil peint sur la proue (maquette, style C)
function galere() {
  const bat = new THREE.Group(), g = new THREE.Group(), mc = lambert(0x8a4a22);
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.24), mc));
  const proue = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.3, 4), mc); proue.rotation.z = -Math.PI / 2 - 0.4; proue.position.set(0.38, 0.06, 0); g.add(proue);
  const poupe = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 4), mc); poupe.rotation.z = Math.PI / 2 + 0.6; poupe.position.set(-0.35, 0.08, 0); g.add(poupe);
  const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 5), mc); mat.position.y = 0.3; g.add(mat);
  const v = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.3, 0.42), lambert(0xffffff, { flatShading: false })); v.position.set(0.02, 0.34, 0); g.add(v);
  const mr = lambert(0x6a3a18);
  for (let k = 0; k < 4; k++) for (const sg of [-1, 1]) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.22), mr); r.position.set(-0.18 + k * 0.12, -0.02, sg * 0.2); r.rotation.x = sg * 0.5; g.add(r); }
  for (const sg of [-1, 1]) { const o = new THREE.Mesh(new THREE.CircleGeometry(0.035, 8), basic(0x1a1410)); o.position.set(0.24, 0.03, sg * 0.122); o.rotation.y = sg > 0 ? 0 : Math.PI; g.add(o); }
  // l'équipage changé en cochons par Circé
  const cochons = new THREE.Group(), rosee = lambert(0xf4a6b8, { flatShading: false }), groin = lambert(0xe07a92, { flatShading: false });
  for (const [dx, dz] of [[-0.2, -0.05], [0.12, 0.05], [-0.05, 0.07]]) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), rosee); c.scale.set(1.3, 1, 1); c.position.set(dx, 0.12, dz); cochons.add(c);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.03, 8), groin); n.rotation.z = Math.PI / 2; n.position.set(dx + 0.1, 0.13, dz); cochons.add(n);
  }
  cochons.visible = false; g.add(cochons);
  bat.add(g); bat.userData.coque = g; bat.userData.cochons = cochons; return bat;
}
function palmier(alea, tronc, palme) {
  const p = new THREE.Group(), h = alea(1.2, 1.8);
  for (let s = 0; s < 4; s++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, h / 4 + 0.02, 6), tronc); seg.position.set(s * 0.06, h / 8 + s * h / 4, 0); p.add(seg); }
  const cime = new THREE.Group(); cime.position.set(0.24, h, 0); p.add(cime);
  for (let f = 0; f < 6; f++) { const fe = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 3), palme); fe.rotation.order = 'YXZ'; fe.rotation.set(0, f * Math.PI / 3, 1.25); fe.position.set(Math.cos(f * Math.PI / 3) * 0.35, -0.08, -Math.sin(f * Math.PI / 3) * 0.35); cime.add(fe); }
  p.userData.cime = cime; return p;
}

// ---------- construction d'un plateau ----------
let V = null;        // ce qui s'anime sur le plateau en cours
function vider() {
  for (const o of pl.children.slice()) { pl.remove(o); o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) [].concat(m.material).forEach(x => x.dispose()); }); }
}
function construire(P) {
  vider();
  const M = P.map, W = M.W, H = M.H, L = LUMIERES[P.lumiere || P.ep.lumiere], r = ODY.rng(P.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const alea = (a, b) => a + r() * (b - a), Q = (x, y) => [x - W / 2, y - H / 2];
  hemi.color.setHex(L.haut); hemi.groundColor.setHex(L.bas); hemi.intensity = L.h;
  soleil.color.setHex(L.sol); soleil.intensity = L.s; soleil.position.set(...L.pos);
  if (rendu) rendu.setClearColor(L.ciel);
  document.body.style.background = '#' + new THREE.Color(L.ciel).getHexString();
  const v = { P, L };
  const lum = (c, o) => L.nuit ? lambert(c, Object.assign({ flatShading: false }, o)) : basic(c, o);     // la nuit, éclairé seulement par la lanterne
  // mer qui ondule (plan découpé en facettes) et fond plus sombre
  const geo = new THREE.PlaneGeometry(W + 0.2, H + 0.2, W * 3, H * 3); geo.rotateX(-Math.PI / 2);
  v.mer = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: L.mer, shininess: 70, specular: 0x7fdcee, flatShading: true }));
  v.mer.position.y = -0.05; pl.add(v.mer); v.base = geo.attributes.position.array.slice();
  const fondMer = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, H), lambert(L.fond, { flatShading: false })); fondMer.position.y = -0.4; pl.add(fondMer);
  // falaises du cadre, rochers et maisons blanches le long des murets
  const roc = lambert(0xd9bf8c), blanc = lambert(0xffffff, { flatShading: false }), bleu = lambert(0x2a6fd6, { flatShading: false });
  for (const [w, d, x, z] of [[W + 1, 0.5, 0, -H / 2 - 0.25], [W + 1, 0.5, 0, H / 2 + 0.25], [0.5, H, -W / 2 - 0.25, 0], [0.5, H, W / 2 + 0.25, 0]]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.8, d), roc); m.position.set(x, 0.1, z); pl.add(m);
  }
  const caillou = new THREE.DodecahedronGeometry(0.2, 0), cube = new THREE.BoxGeometry(0.18, 0.18, 0.18), coupole = new THREE.SphereGeometry(0.08, 8, 4, 0, 7, 0, Math.PI / 2);
  M.murs.forEach(([x1, y1, x2, y2], i) => {
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / 0.3));
    for (let k = 0; k <= n; k++) {
      const [x, z] = Q(x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n);
      const b = new THREE.Mesh(caillou, roc); b.position.set(x, 0.12, z); b.scale.set(alea(0.85, 1.1), alea(0.9, 1.4), alea(0.85, 1.1)); b.rotation.set(r() * 3, r() * 3, 0); pl.add(b);
      if (k % 5 === 2 && n > 4) { const m = new THREE.Mesh(cube, blanc); m.position.set(x, 0.38, z); pl.add(m);
        if (k % 10 === 2) { const c = new THREE.Mesh(coupole, bleu); c.position.set(x, 0.47, z); pl.add(c); } }
    }
  });
  // récifs pointus et leur écume
  const gris = lambert(0x6d6a66), ecume = lum(0xffffff, { transparent: true, opacity: 0.8 }), pic = new THREE.ConeGeometry(0.14, 0.45, 4), anneau = new THREE.RingGeometry(0.3, 0.47, 16);
  v.ecumes = M.recifs.map(([tx, ty]) => {
    const [x, z] = Q(tx, ty);
    for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(pic, gris); p.position.set(x + alea(-.2, .2), 0.15, z + alea(-.2, .2)); p.scale.set(alea(0.7, 1.2), alea(0.7, 1.25), alea(0.7, 1.2)); p.rotation.set(alea(-.3, .3), r() * 3, alea(-.3, .3)); pl.add(p); }
    const e = plat(anneau, ecume, x, 0.06, z); pl.add(e); return e;
  });
  // lotus : eau verte, feuilles rondes et fleurs roses
  const eauVerte = lum(0x7fd88a, { transparent: true, opacity: 0.32, depthWrite: false }), feuille = lambert(0x3f9a4a), rose = lambert(0xf49ac8, { flatShading: false }), coeur = basic(0xffe27a);
  const caseG = new THREE.PlaneGeometry(1, 1), feuilleG = new THREE.CircleGeometry(0.16, 7), fleurG = new THREE.ConeGeometry(0.07, 0.1, 6), coeurG = new THREE.SphereGeometry(0.03, 5, 4);
  // vent : traits qui défilent ; phares
  v.vents = []; v.phares = [];
  M.cases.forEach((row, y) => row.forEach((k, x) => {
    const [cx, cz] = Q(x + 0.5, y + 0.5);
    if (k === 'L') {
      pl.add(plat(caseG, eauVerte, cx, 0.03, cz));
      for (let j = 0; j < 3; j++) { const f = plat(feuilleG, feuille, cx + alea(-.32, .32), 0.05, cz + alea(-.32, .32)); f.rotation.z = r() * 6; pl.add(f); }
      if (r() < 0.8) { const fl = new THREE.Mesh(fleurG, rose); fl.rotation.x = Math.PI; fl.position.set(cx + alea(-.25, .25), 0.11, cz + alea(-.25, .25)); pl.add(fl);
        const c = new THREE.Mesh(coeurG, coeur); c.position.set(fl.position.x, 0.14, fl.position.z); pl.add(c); }
    } else if (ODY.DIRS[k]) {
      const m = plat(caseG, lum(0xffffff, { map: P.courant ? TEX_COURANT : TEX_VENT, transparent: true, opacity: 0.75, depthWrite: false }), cx, 0.04, cz);
      m.userData.k = k; pl.add(m); v.vents.push(m);
    } else if (k === 'P') {
      const g = new THREE.Group(); g.position.set(cx, 0, cz);
      const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.18, 7), roc); socle.position.y = 0.06; g.add(socle);
      const tour = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.5, 8), blanc); tour.position.y = 0.4; g.add(tour);
      const bande = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.09, 0.08, 8), lambert(0xc8452e, { flatShading: false })); bande.position.y = 0.36; g.add(bande);
      const feu = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), basic(0x8a8a8a)); feu.position.y = 0.7; g.add(feu);
      const toit = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.12, 8), lambert(0xc8452e)); toit.position.y = 0.8; g.add(toit);
      const halo = plat(new THREE.RingGeometry(0.42, 0.52, 20), basic(0xffffff, { transparent: true, opacity: 0.5 }), 0, 0.05, 0); g.add(halo);
      pl.add(g); v.phares.push({ g, feu, halo });
    }
  }));
  orienterVents(v, 0);
  // Circé : herbe moly (fleur blanche) et coupes enchantées
  v.molys = M.molys.map(([mx, my]) => {
    const [x, z] = Q(mx, my), g = new THREE.Group(); g.position.set(x, 0, z);
    const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.4, 5), lambert(0x3f9a4a)); tige.position.y = 0.2; g.add(tige);
    for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5, pe = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), lambert(0xffffff, { flatShading: false })); pe.scale.set(1, 0.4, 0.6); pe.position.set(Math.cos(a) * 0.08, 0.42, Math.sin(a) * 0.08); pe.rotation.y = -a; g.add(pe); }
    const cm = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 4), basic(0xffe25a)); cm.position.y = 0.44; g.add(cm);
    const halo = plat(new THREE.RingGeometry(0.36, 0.46, 20), basic(0xfff3a0, { transparent: true, opacity: 0.7, depthWrite: false }), 0, 0.05, 0); g.add(halo);
    pl.add(g); return { g, halo };
  });
  const or = new THREE.MeshPhongMaterial({ color: 0xe0b040, shininess: 80, specular: 0xfff0b0 });
  v.coupes = M.coupes.map(([qx, qy]) => {
    const [x, z] = Q(qx, qy), g = new THREE.Group(); g.position.set(x, 0, z);
    const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.16, 7), roc); socle.position.y = 0.05; g.add(socle);
    const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.16, 8), or); pied.position.y = 0.21; g.add(pied);
    const vasque = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.06, 0.14, 10), or); vasque.position.y = 0.35; g.add(vasque);
    const philtre = plat(new THREE.CircleGeometry(0.14, 12), basic(0xb04ae0), 0, 0.425, 0); g.add(philtre);
    const eclat = new THREE.Mesh(new THREE.OctahedronGeometry(0.05, 0), basic(0xf0c0ff)); eclat.position.y = 0.6; g.add(eclat);
    pl.add(g); return { g, eclat };
  });
  // les Sirènes sur leurs rochers, et les ondes de leur chant
  const ondeG = new THREE.RingGeometry(0.9, 1, 32), ecaille = lambert(0x2fb8a0), chair = lambert(0xf2c09a, { flatShading: false });
  v.sirenes = M.sirenes.map(([sx, sy], i) => {
    const [x, z] = Q(sx, sy), g = new THREE.Group(); g.position.set(x, 0, z);
    const rocher = new THREE.Mesh(new THREE.DodecahedronGeometry(0.36, 0), gris); rocher.scale.y = 0.55; rocher.position.y = 0.08; g.add(rocher);
    const corps = new THREE.Group(); corps.position.y = 0.22; g.add(corps);
    const queue = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 6), ecaille); queue.rotation.z = 1.2; queue.position.set(-0.15, 0.02, 0); corps.add(queue);
    const nag = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 3), ecaille); nag.rotation.z = -0.6; nag.position.set(-0.34, 0.1, 0); corps.add(nag);
    const buste = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.26, 6), chair); buste.position.set(0.04, 0.16, 0); corps.add(buste);
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), chair); tete.position.set(0.04, 0.36, 0); corps.add(tete);
    const cheveux = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.32, 6), lambert(0xf2c84a)); cheveux.position.set(-0.01, 0.27, 0); corps.add(cheveux);
    corps.rotation.y = r() * 6;
    const ondes = [0, 1].map(() => { const o = plat(ondeG, basic(0xff8ac8, { transparent: true, opacity: 0.6, depthWrite: false }), 0, 0.06, 0); g.add(o); return o; });
    pl.add(g); return { g, corps, ondes, ph: i * 0.7 };
  });
  // Charybde : tourbillons qui tournent
  v.tourbillons = M.tourbillons.map(([hx, hy]) => {
    const [x, z] = Q(hx, hy);
    pl.add(plat(new THREE.CircleGeometry(1, 28), basic(0x0a3a50, { transparent: true, opacity: 0.5, depthWrite: false }), x, 0.03, z));
    const sp = plat(new THREE.CircleGeometry(1, 28), basic(0xffffff, { map: TEX_SPIRALE, transparent: true, opacity: 0.85, depthWrite: false }), x, 0.05, z); pl.add(sp);
    pl.add(plat(new THREE.CircleGeometry(0.22, 16), basic(0x031820), x, 0.06, z));
    return sp;
  });
  // Scylla : rides d'alerte, puis le cou qui jaillit (maquette, style A refait en C)
  const peauS = lambert(0x4f7a64);
  v.scyllas = M.scyllas.map(([sx, sy]) => {
    const [x, z] = Q(sx, sy), g = new THREE.Group(); g.position.set(x, 0, z); pl.add(g);
    const zone = plat(new THREE.CircleGeometry(ODY.PHYS.SCYLLA_R, 24), basic(0xff4a3a, { transparent: true, opacity: 0.2, depthWrite: false }), 0, 0.04, 0); g.add(zone);
    const rides = [0.35, 0.55].map(rr => { const m = plat(new THREE.TorusGeometry(rr, 0.03, 4, 24), basic(0xffffff, { transparent: true, opacity: 0.85 }), 0, 0.05, 0); g.add(m); return m; });
    const cou = new THREE.Group(); g.add(cou);
    const tronc = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 1.1, 6), peauS); tronc.position.y = 0.55; tronc.rotation.z = 0.25; cou.add(tronc);
    const tete = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 5), peauS); tete.rotation.z = -Math.PI / 2 - 0.3; tete.position.set(0.3, 1.1, 0); cou.add(tete);
    const oeil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 4), basic(0xffd23a)); oeil.position.set(0.25, 1.17, 0.1); cou.add(oeil);
    const crocs = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 3), basic(0xffffff)); crocs.position.set(0.48, 1.02, 0); crocs.rotation.z = Math.PI; cou.add(crocs);
    cou.visible = false;
    return { g, zone, rides, cou };
  });
  // les cases qu'on ne peut pas atteindre (dans une île entourée de murets) deviennent de la terre
  const atteint = cases(M), sable = lambert(0xe6cf98), gazon = lambert(0x6aae4a), terreG = new THREE.BoxGeometry(1.02, 0.35, 1.02), herbeG = new THREE.BoxGeometry(0.8, 0.08, 0.8);
  let palme = 0;
  M.cases.forEach((row, y) => row.forEach((k, x) => {
    if (atteint.has(x + ',' + y)) return;
    const [cx, cz] = Q(x + 0.5, y + 0.5), t = new THREE.Mesh(terreG, sable); t.position.set(cx, 0.08, cz); pl.add(t);
    const h = new THREE.Mesh(herbeG, gazon); h.position.set(cx, 0.28, cz); pl.add(h);
    if (palme++ % 3 === 0) { const p = palmier(alea, lambert(0x9a6a3a), lambert(0x3f9a4a)); p.scale.setScalar(0.45); p.position.set(cx, 0.3, cz); pl.add(p); }
  }));
  // le port d'arrivée : îlot et temple blanc
  const [ax, az] = Q(...M.arrivee), ile = new THREE.Group();
  ile.add(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.58, 0.3, 8), roc));
  const herbe = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.45, 0.06, 8), lambert(0x8cc65a)); herbe.position.y = 0.17; ile.add(herbe);
  for (let k = 0; k < 4; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.35, 6), blanc); c.position.set(-0.22 + k * 0.15, 0.37, 0); ile.add(c); }
  const toitT = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.25), blanc); toitT.position.y = 0.57; ile.add(toitT);
  const fronton = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.16, 0.6, 3), blanc); fronton.rotation.set(0, 0, Math.PI / 2); fronton.scale.set(1, 1, 0.5); fronton.position.y = 0.65; ile.add(fronton);
  ile.position.set(ax, 0.05, az); pl.add(ile); v.ile = ile;
  decor(P, v, Q, alea, roc, blanc, bleu, gris);
  // flèches enflammées (ombre, flèche, éclaboussure) et rocher du Cyclope
  v.ombreG = new THREE.CircleGeometry(0.5, 16);
  v.fleches = [];
  if (P.fleches) for (let k = 0; k < 8; k++) {
    const ombre = plat(v.ombreG, basic(0x3a1a08, { transparent: true, opacity: 0.45, depthWrite: false }), 0, 0.07, 0);
    const fl = new THREE.Group(), tige = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), lambert(0x5a3418)); fl.add(tige);
    const flamme = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 6), basic(0xff8a1e)); flamme.position.y = -0.5; flamme.rotation.x = Math.PI; fl.add(flamme);
    const coeurF = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 6), basic(0xffe25a)); coeurF.position.y = -0.48; coeurF.rotation.x = Math.PI; fl.add(coeurF);
    fl.rotation.z = 0.6; fl.rotation.x = -0.4;
    pl.add(ombre, fl); ombre.visible = fl.visible = false; v.fleches.push({ ombre, fl });
  }
  v.plouf = plat(new THREE.RingGeometry(0.3, 0.45, 16), basic(0xffffff, { transparent: true, opacity: 0.9, depthWrite: false }), 0, 0.08, 0); v.plouf.visible = false; pl.add(v.plouf); v.ploufT = 9;
  v.brasier = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 6), basic(0xff8a1e, { transparent: true, opacity: 0.9 })); v.brasier.visible = false; pl.add(v.brasier);
  if (P.rochers) {
    v.ombre = plat(new THREE.CircleGeometry(0.55, 16), basic(0x053a4a, { transparent: true, opacity: 0.5, depthWrite: false }), 0, 0.07, 0); pl.add(v.ombre);
    v.rocher = new THREE.Mesh(new THREE.DodecahedronGeometry(0.42, 0), gris); pl.add(v.rocher);
    v.ombre.visible = v.rocher.visible = false;
  }
  // la galère (la nuit, avec sa lanterne ; le port a sa torche)
  v.bat = galere(); v.bat.scale.setScalar(1.25); pl.add(v.bat);
  if (L.nuit) {
    const lanterne = new THREE.PointLight(0xffd08a, 2.4, 3.4, 1.4); lanterne.position.set(0, 0.7, 0); v.bat.add(lanterne);
    const flamme = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), basic(0xffd08a)); flamme.position.set(-0.2, 0.32, 0); v.bat.userData.coque.add(flamme);
    const torche = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), basic(0xffb84a)); torche.position.y = 0.85; v.ile.add(torche);
    const halo = plat(new THREE.RingGeometry(0.6, 0.7, 24), basic(0xffb84a, { transparent: true, opacity: 0.6, depthWrite: false }), 0, 0.02, 0); v.ile.add(halo);
    v.phares.forEach(ph => ph.g.add(new THREE.PointLight(0xffe25a, 0, 3, 1.6)));
  }
  V = v; cadrer();
}
// cases que le bateau peut atteindre depuis le départ (sans traverser de muret)
function cases(M) {
  const mur = new Set();
  for (const [x1, y1, x2, y2] of M.murs) {
    if (y1 === y2) for (let x = x1; x < x2; x++) mur.add(`h${x},${y1}`);      // entre (x, y1 - 1) et (x, y1)
    else for (let y = y1; y < y2; y++) mur.add(`v${x1},${y}`);                // entre (x1 - 1, y) et (x1, y)
  }
  const vu = new Set(), pile = [[Math.floor(M.depart[0]), Math.floor(M.depart[1])]];
  while (pile.length) {
    const [x, y] = pile.pop(), k = x + ',' + y;
    if (x < 0 || y < 0 || x >= M.W || y >= M.H || vu.has(k)) continue;
    vu.add(k);
    if (!mur.has(`v${x + 1},${y}`)) pile.push([x + 1, y]);
    if (!mur.has(`v${x},${y}`)) pile.push([x - 1, y]);
    if (!mur.has(`h${x},${y + 1}`)) pile.push([x, y + 1]);
    if (!mur.has(`h${x},${y}`)) pile.push([x, y - 1]);
  }
  return vu;
}
function bat_cochons(v) { v.bat.userData.cochons.visible = st.lourd; }
function orienterVents(v, rot) {
  for (const m of v.vents) { let [dx, dy] = ODY.DIRS[m.userData.k]; for (let i = 0; i < rot; i++) [dx, dy] = [-dy, dx]; m.rotation.z = Math.atan2(-dy, dx); }
}

// décor de chaque épisode, derrière le bord du haut
function decor(P, v, Q, alea, roc, blanc, bleu, gris) {
  const W = P.map.W, H = P.map.H, D = new THREE.Group(); D.position.set(0, 0, -H / 2 - 1.2); pl.add(D); v.decor = D;
  const quoi = P.ep.decor;
  if (quoi === 'troie') {
    // les remparts de Troie, ses tours, l'incendie et le cheval de bois
    const pierre = lambert(0xcdb084), bois = lambert(0x8a5a2a);
    const mur = new THREE.Mesh(new THREE.BoxGeometry(W + 1.5, 1.1, 0.7), pierre); mur.position.set(0, 0.45, -0.2); D.add(mur);
    v.feux = [];
    for (let k = 0; k < 5; k++) {
      const x = -W / 2 + 0.2 + k * (W - 0.4) / 4, t = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.8), pierre); t.position.set(x, 0.8, -0.3); D.add(t);
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 6), basic(0xff7a1e, { transparent: true, opacity: 0.9 })); f.position.set(x + alea(-.2, .2), 1.95, -0.3); D.add(f);
      const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 6), basic(0xffd84a)); f2.position.set(f.position.x, 1.85, -0.1); D.add(f2);
      v.feux.push(f, f2);
    }
    v.fumees = [];
    for (let k = 0; k < 6; k++) { const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.35, 0), lambert(0xb4aca6, { transparent: true, opacity: 0.45, depthWrite: false })); s.userData.x = -W / 2 + alea(0.5, W - 0.5); s.userData.p = k / 6; D.add(s); v.fumees.push(s); }
    const cheval = new THREE.Group();
    const corps = new THREE.Mesh(new THREE.BoxGeometry(1, 0.42, 0.42), bois); corps.position.y = 0.75; cheval.add(corps);
    const cou = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.6, 0.26), bois); cou.position.set(0.48, 1.1, 0); cou.rotation.z = -0.4; cheval.add(cou);
    const tete = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.24), bois); tete.position.set(0.68, 1.38, 0); cheval.add(tete);
    for (const [dx, dz] of [[-0.38, -0.14], [-0.38, 0.14], [0.38, -0.14], [0.38, 0.14]]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.5, 0.1), bois); p.position.set(dx, 0.35, dz); cheval.add(p); }
    const socle = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.6), bois); socle.position.y = 0.08; cheval.add(socle);
    cheval.position.set(-W / 2 - 0.2, 0.4, 0.9); cheval.rotation.y = -0.5; D.add(cheval);
  } else if (quoi === 'lotophages') {
    // plage et palmiers des mangeurs de lotus
    const sable = new THREE.Mesh(new THREE.BoxGeometry(W + 2, 0.5, 1.4), lambert(0xf0d8a0)); sable.position.set(0, 0.2, -0.1); D.add(sable);
    const tronc = lambert(0x9a6a3a), palme = lambert(0x3f9a4a);
    v.palmiers = [];
    for (let k = 0; k < 5; k++) {
      const p = palmier(alea, tronc, palme);
      p.position.set(-W / 2 + 0.4 + k * (W - 0.8) / 4 + alea(-.3, .3), 0.4, alea(-0.5, 0.2)); p.rotation.y = alea(0, 6); D.add(p); v.palmiers.push(p.userData.cime);
    }
  } else if (quoi === 'cyclope') {
    // Polyphème derrière sa falaise (maquette)
    const cy = new THREE.Group(), peau = lambert(0xc98a5a);
    const falaise = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 0), roc); falaise.scale.set(2.2, 0.8, 0.8); cy.add(falaise);
    const corps = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 0), peau); corps.position.set(0, 1.7, -0.6); corps.scale.set(1.4, 1, 0.9); cy.add(corps);
    const tete = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), peau); tete.position.set(0, 3.1, -0.2); cy.add(tete);
    const oeil = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), lambert(0xffffff, { flatShading: false })); oeil.position.set(0, 3.25, 0.55); cy.add(oeil);
    const pupille = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), basic(0x1a1410)); pupille.position.set(0, 3.25, 0.84); cy.add(pupille);
    const barbe = new THREE.Mesh(new THREE.ConeGeometry(0.6, 0.9, 6), lambert(0x4a2c16)); barbe.rotation.x = Math.PI; barbe.position.set(0, 2.45, 0.2); cy.add(barbe);
    const bras = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 1.6, 6), peau); bras.position.set(1.5, 2.3, -0.3); bras.rotation.z = -0.5; cy.add(bras);
    cy.scale.setScalar(0.8); cy.position.set(0, -0.3, -1.2); D.add(cy);
    v.cyclope = { bras, pupille };
  } else if (quoi === 'eole') {
    // l'île flottante d'Éole, son rempart de bronze, l'outre des vents et les nuages
    const ile = new THREE.Group();
    const dessous = new THREE.Mesh(new THREE.ConeGeometry(1.6, 1.8, 7), roc); dessous.rotation.x = Math.PI; dessous.position.y = -0.9; ile.add(dessous);
    const dessus = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.25, 7), lambert(0x8cc65a)); ile.add(dessus);
    const bronze = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.08, 4, 14), new THREE.MeshPhongMaterial({ color: 0xc9902a, shininess: 60, specular: 0xffe0a0 })); bronze.rotation.x = Math.PI / 2; bronze.position.y = 0.2; ile.add(bronze);
    const palais = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.5, 0.6), blanc); palais.position.set(-0.4, 0.38, -0.2); ile.add(palais);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 4, 0, 7, 0, Math.PI / 2), bleu); dome.position.set(-0.4, 0.63, -0.2); ile.add(dome);
    const outre = new THREE.Group(), cuir = lambert(0x8a5a2a);
    const sac = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), cuir); sac.scale.set(1, 0.85, 1); outre.add(sac);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 0.25, 6), cuir); col.position.y = 0.36; outre.add(col);
    const lien = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.025, 4, 8), basic(0xe8c25a)); lien.rotation.x = Math.PI / 2; lien.position.y = 0.4; outre.add(lien);
    outre.position.set(0.55, 0.45, 0.2); ile.add(outre);
    ile.position.set(W / 2 - 2.6, 0.9, -0.4); ile.scale.setScalar(0.8); D.add(ile); v.ile_eole = ile; v.outre = outre;
    v.nuages = [];
    for (let k = 0; k < 4; k++) {
      const n = new THREE.Group(), nb = lambert(0xffffff, { transparent: true, opacity: 0.9 });
      for (let j = 0; j < 4; j++) { const b = new THREE.Mesh(new THREE.DodecahedronGeometry(alea(0.3, 0.5), 0), nb); b.position.set(j * 0.42 - 0.6, alea(-.1, .15), alea(-.15, .15)); n.add(b); }
      n.position.set(alea(-W / 2, W / 2), 1.5 + alea(0, 0.6), alea(-1, 0.3)); n.userData.v = alea(0.25, 0.5); D.add(n); v.nuages.push(n);
    }
  } else if (quoi === 'circe') {
    // le palais de marbre de Circé sur sa colline, son chaudron fumant et ses cochons
    const colline = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0), lambert(0x6a9a4a)); colline.scale.set(2.4, 0.55, 0.8); colline.position.set(0, 0.1, -0.4); D.add(colline);
    const marbre = lambert(0xf4eef8, { flatShading: false });
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.16, 0.9), marbre); base.position.set(0.8, 0.85, -0.5); D.add(base);
    for (let k = 0; k < 6; k++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), marbre); c.position.set(-0.1 + k * 0.36, 1.28, -0.2); D.add(c); }
    const toit = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.6, 2.4, 3), lambert(0xb07ad0)); toit.rotation.set(0, 0, Math.PI / 2); toit.scale.set(1, 1, 0.5); toit.position.set(0.8, 1.8, -0.4); D.add(toit);
    const chaudron = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 6, 0, 7, Math.PI / 2, Math.PI / 2), lambert(0x2a2430)); chaudron.position.set(-1.8, 0.95, 0); D.add(chaudron);
    v.fumees = [];
    for (let k = 0; k < 5; k++) { const f = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), basic(0xc890ff, { transparent: true, opacity: 0.5, depthWrite: false })); f.userData.x = -1.8; f.userData.p = k / 5; f.userData.y0 = 1; D.add(f); v.fumees.push(f); }
    const rosee = lambert(0xf4a6b8, { flatShading: false });
    for (const [x, z] of [[-W / 2 + 0.6, 0.6], [-W / 2 + 1.3, 0.8], [W / 2 - 0.8, 0.7]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), rosee); c.scale.set(1.4, 1, 1); c.position.set(x, 0.55, z); D.add(c); }
  } else if (quoi === 'enfers') {
    // falaises noires, l'entrée rougeoyante des Enfers et les ombres des morts
    const noir = lambert(0x3a3640);
    for (let k = 0; k < 7; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(alea(0.5, 0.9), alea(1.4, 2.6), 5), noir); c.position.set(-W / 2 + k * W / 6, 0.6, alea(-0.6, 0)); D.add(c); }
    const antre = plat(new THREE.CircleGeometry(0.7, 16), basic(0xff4a1a), 0, 0.7, 0.3); antre.rotation.x = 0; D.add(antre);
    v.ombres = [];
    for (let k = 0; k < 6; k++) { const o = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.6, 6), basic(0xbfd4ff, { transparent: true, opacity: 0.35, depthWrite: false })); o.rotation.x = Math.PI; o.userData.x = alea(-W / 2, W / 2); o.userData.p = alea(0, 6); D.add(o); v.ombres.push(o); }
  } else if (quoi === 'sirenes') {
    // l'île fleurie des Sirènes
    const ile = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), lambert(0x7ab85a)); ile.scale.set(2.6, 0.45, 0.8); ile.position.set(0, 0.1, -0.3); D.add(ile);
    const fleurs = [0xf49ac8, 0xffe25a, 0xffffff];
    for (let k = 0; k < 18; k++) { const f = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), basic(fleurs[k % 3])); f.position.set(alea(-W / 2, W / 2), 0.62, alea(-0.6, 0.2)); D.add(f); }
    for (let k = 0; k < 4; k++) { const rch = new THREE.Mesh(new THREE.DodecahedronGeometry(alea(0.3, 0.5), 0), gris); rch.position.set(alea(-W / 2, W / 2), 0.5, alea(0.2, 0.7)); D.add(rch); }
  } else if (quoi === 'charybde') {
    // les deux falaises du détroit : le figuier de Charybde, l'antre de Scylla
    const sombre = lambert(0x6a6460);
    for (const sx of [-1, 1]) { const f = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), sombre); f.scale.set(1.2, 1.4, 0.8); f.position.set(sx * (W / 2 - 0.6), 1, -0.3); D.add(f); }
    const figuier = new THREE.Group(), bois = lambert(0x6a4a2a);
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.8, 5), bois); tr.rotation.z = 0.4; figuier.add(tr);
    const feu = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), lambert(0x4a8a3a)); feu.position.set(-0.2, 0.5, 0); figuier.add(feu);
    figuier.position.set(-W / 2 + 0.6, 2.6, -0.2); D.add(figuier);
    const antre = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), basic(0x101010)); antre.position.set(W / 2 - 0.6, 1.2, 0.85); D.add(antre);
  } else if (quoi === 'calypso') {
    // Ogygie : la grotte de Calypso, ses palmiers et sa vigne
    const ile = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 0), lambert(0x5aa84a)); ile.scale.set(2.6, 0.5, 0.8); ile.position.set(0, 0.1, -0.3); D.add(ile);
    const grotte = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 0), roc); grotte.scale.set(1.2, 0.9, 0.7); grotte.position.set(0.6, 0.9, -0.5); D.add(grotte);
    const bouche = new THREE.Mesh(new THREE.CircleGeometry(0.32, 12), basic(0x2a1a10)); bouche.position.set(0.6, 0.85, 0.02); D.add(bouche);
    v.palmiers = [];
    for (const x of [-W / 2 + 0.6, -1.2, W / 2 - 0.7]) { const p = palmier(alea, lambert(0x9a6a3a), lambert(0x3f9a4a)); p.position.set(x, 0.5, alea(-0.4, 0.2)); p.rotation.y = alea(0, 6); D.add(p); v.palmiers.push(p.userData.cime); }
  } else if (quoi === 'ithaque') {
    // Ithaque : collines vertes, le palais d'Ulysse et les oliviers
    const coll = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 0), lambert(0x8aaa5a)); coll.scale.set(2.6, 0.6, 0.8); coll.position.set(0, 0.1, -0.4); D.add(coll);
    const palais = new THREE.Group();
    const corps = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.7), blanc); corps.position.y = 0.3; palais.add(corps);
    const toitP = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.08, 0.8), lambert(0xc8452e)); toitP.position.y = 0.64; palais.add(toitP);
    const tour = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), blanc); tour.position.set(-0.6, 0.45, 0); palais.add(tour);
    palais.position.set(0.4, 0.75, -0.4); D.add(palais);
    for (const x of [-W / 2 + 0.5, -1.6, W / 2 - 0.6, W / 2 - 1.3]) { const o = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 0.4, 5), lambert(0x7a5a3a)); t.position.y = 0.2; o.add(t);
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3, 0), lambert(0x7a9a5a)); f.position.y = 0.5; o.add(f); o.position.set(x, 0.6, alea(-0.3, 0.4)); D.add(o); }
  }
}

// cadrage : la caméra recule pour les grands plateaux (et sur les écrans étroits)
function cadrer() {
  // le jeu prend la hauteur qui reste sous ce qui le précède dans la page
  jeu.style.height = Math.max(240, innerHeight - (jeu.getBoundingClientRect().top + scrollY)) + 'px';
  const w = jeu.clientWidth || 390, h = jeu.clientHeight || 780;
  if (rendu) rendu.setSize(w, h, false);
  cam.aspect = w / h; cam.updateProjectionMatrix();
  const M = V ? V.P.map : { W: 8, H: 12 }, k = Math.max(M.H / 12, M.W / 8 * 0.47 / cam.aspect, 0.9);
  cam.position.set(0, 18.5 * k, 10.5 * k); cam.lookAt(0, 0, 0.6 * k);
}
addEventListener('resize', cadrer);

// ---------- contrôles : inclinaison du téléphone, doigt, clavier ----------
const MAXP = ODY.PHYS.PENTE_MAX, SENS = 1.2;
let capteur = null, zero = null, doigt = null, penteDoigt = [0, 0], touches = {};
addEventListener('deviceorientation', e => { if (e.beta != null && e.gamma != null) capteur = { b: e.beta, g: e.gamma }; });
let permissionDemandee = false;
function demanderCapteur() {
  if (permissionDemandee) return; permissionDemandee = true;
  const DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === 'function') DOE.requestPermission().catch(() => {});
}
const borne = x => Math.max(-MAXP, Math.min(MAXP, x));
function commande() {
  if (touches.ArrowLeft || touches.ArrowRight || touches.ArrowUp || touches.ArrowDown)
    return [((touches.ArrowRight ? 1 : 0) - (touches.ArrowLeft ? 1 : 0)) * MAXP, ((touches.ArrowDown ? 1 : 0) - (touches.ArrowUp ? 1 : 0)) * MAXP];
  if (capteur) {
    if (!zero) zero = { ...capteur };          // la position au départ du plateau sert de « plat »
    const d = (a, b) => { let x = a - b; if (x > 180) x -= 360; if (x < -180) x += 360; return x; };
    return [borne(d(capteur.g, zero.g) * Math.PI / 180 * SENS), borne(d(capteur.b, zero.b) * Math.PI / 180 * SENS)];
  }
  return penteDoigt;
}
jeu.addEventListener('pointerdown', e => {
  demanderCapteur();
  if (mode !== 'jeu' || e.target.closest('button')) return;
  doigt = { x: e.clientX, y: e.clientY, id: e.pointerId };
});
jeu.addEventListener('pointermove', e => {
  if (!doigt || e.pointerId !== doigt.id) return;
  penteDoigt = [Math.max(-1, Math.min(1, (e.clientX - doigt.x) / 70)) * MAXP, Math.max(-1, Math.min(1, (e.clientY - doigt.y) / 70)) * MAXP];
});
const lacher = e => { if (doigt && e.pointerId === doigt.id) { doigt = null; penteDoigt = [0, 0]; } };
jeu.addEventListener('pointerup', lacher); jeu.addEventListener('pointercancel', lacher);
addEventListener('keydown', e => { if (e.key.startsWith('Arrow')) { touches[e.key] = true; e.preventDefault(); } if (e.key === 'Escape' && mode === 'jeu') pause(); });
addEventListener('keyup', e => { touches[e.key] = false; });

// ---------- écrans ----------
let mode = 'titre', P = null, st = null, demoI = 0, demoAttente = 0, msgT = 0;
const ECRANS = ['eTitre', 'eRecit', 'ePause', 'eFin', 'egee'];
function montrer(id) {
  for (const e of ECRANS) $(e).hidden = e !== id;
  $('hud').hidden = !['jeu', 'pause', 'recit'].includes(mode); $('aplat').hidden = !(mode === 'jeu' && capteur);
  $('bCire').hidden = !(mode === 'jeu' && st && st.M.sirenes.length);
}
function message(t, d) { $('msg').textContent = t; $('msg').classList.add('vu'); msgT = d || 1.4; }

function titre() {
  debloquer(); mode = 'titre'; ambiance('calme'); montrer('eTitre');
  const dj = lireJ('daily', {})[todayKey()];
  $('totalTitre').textContent = [totalEtoiles() ? `★ ${totalEtoiles()} / ${ODY.PLATEAUX.length * 3} · ${chantDe(ODY.EPISODES[episodeAtteint() - 1])}` : '', dj != null ? `Plateau du jour : ${fmtD(dj / 1000)}` : ''].filter(Boolean).join('\n');
  demo();
}
function demo() {       // le pilote automatique joue derrière l'écran titre, d'un plateau à l'autre
  P = ODY.PLATEAUX[demoI % ODY.PLATEAUX.length]; demoI++;
  st = ODY.nouvelle(P, (Math.random() * 1e9) | 0); construire(P); demoAttente = 0;
}
function lancer(id, Q, graine) {
  if (!Q) JOUR = null;
  P = Q || ODY.plateau(id); st = ODY.nouvelle(P, graine != null ? graine : (Math.random() * 1e9) | 0); construire(P);
  mode = 'recit'; montrer('eRecit'); majHud();
  const E = P.ep;
  ambiance(HUMEUR[E.n] || 'calme'); V.sons = { rame: 0, chant: 1.5, tourb: 0, vent: 1, scylla: [] };
  if (JOUR) {
    const d = String(JOUR.d);
    $('rChant').textContent = `PLATEAU DU JOUR · ${d.slice(6)}/${d.slice(4, 6)}`;
    $('rNom').textContent = `${P.nom}${P.fx ? ' (en miroir)' : ''}`;
    $('rRecit').textContent = JOUR.classe ? `Une seule tentative classée, comptée dès le départ : le temps, plus ${ODY.PHYS.PENALITE} s par naufrage.` : "Tu as déjà tenté le plateau du jour : celle-ci n'est pas classée.";
    $('rCible').textContent = chantDe(E);
  } else {
    $('rChant').textContent = chantDe(E);
    $('rNom').textContent = `${E.n}-${P.i + 1} · ${P.nom}`;
    $('rRecit').textContent = P.i === 0 ? E.recit : '';
    $('rCible').textContent = `★★★ sans naufrage, en moins de ${fmt(P.cible)}`;
  }
  $('rAide').textContent = E.aide;
}
// le même plateau pour toute la famille, et les mêmes dangers (graine = la date)
function lancerJour() { const d = todayKey(); JOUR = { d, classe: lireJ('dailyTry', 0) !== d }; lancer(null, ODY.jour(d), d); }
const rejouer = () => JOUR ? lancerJour() : lancer(P.id);
// pendant la partie, l'écran reste en portrait quand on penche le téléphone (Chrome n'autorise
// le blocage qu'en plein écran : la partie passe en plein écran, la carte et le titre en sortent)
const TACTILE = matchMedia('(pointer: coarse)').matches;
function bloquerPortrait() {
  if (!TACTILE) return;
  const el = document.documentElement, verrou = () => { try { screen.orientation.lock('portrait-primary').catch(() => {}); } catch (e) {} };
  try { if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(verrou, verrou); else verrou(); } catch (e) {}
}
function debloquer() {
  try { screen.orientation.unlock(); } catch (e) {}
  try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (e) {}
}
const paysage = () => TACTILE && innerWidth > innerHeight;
addEventListener('resize', () => { if (mode === 'jeu' && paysage()) pause(); $('pTourne').hidden = !paysage(); });
function partir() {
  demanderCapteur(); bloquerPortrait();
  if (JOUR && JOUR.classe) ecrire('dailyTry', JOUR.d);
  if (JOUR) son('gong'); zero = null; doigt = null; penteDoigt = [0, 0];
  mode = 'jeu'; montrer(null); $('msg').classList.remove('vu');
}
function pause() { if (mode !== 'jeu') return; mode = 'pause'; montrer('ePause'); $('pTourne').hidden = !paysage(); }
function reprendre() { bloquerPortrait(); mode = 'jeu'; montrer(null); }
function fin() {
  mode = 'fin'; $('fRang').textContent = '';
  if (JOUR) return finJour();
  const t = st.t, n = st.naufrages, e = ODY.etoiles(P, t, n), avant = STARS[P.id] || 0, record = BEST[P.id] == null || t * 1000 < BEST[P.id];
  if (e > avant) STARS[P.id] = e;
  if (record) BEST[P.id] = Math.round(t * 1000);
  ecrire('stars', STARS); ecrire('best', BEST); ecrire('episode', episodeAtteint());
  son('arrivee'); for (let k = 1; k <= e; k++) son('etoile', k, 0.9 + k * 0.35);
  if (e > avant && window.LudoScores) LudoScores.submit('odyssee', 'etoiles', totalEtoiles(), false).then(r => { if (r) $('fRang').textContent = 'Étoiles : ' + LudoScores.rankText(r); });
  $('fEtoiles').hidden = false;
  const dernier = P.i === P.ep.plateaux.length - 1, i = ODY.PLATEAUX.indexOf(P), suivant = ODY.PLATEAUX[i + 1];
  $('fChant').textContent = chantDe(P.ep);
  $('fTitre').textContent = dernier ? 'CHANT TERMINÉ !' : 'TERRE EN VUE !';
  $('fEtoiles').innerHTML = [1, 2, 3].map(k => `<span class="${k <= e ? '' : 'non'}">★</span>`).join('');
  $('fTemps').textContent = fmtD(t);
  $('fDetail').textContent = n ? `${n} naufrage${n > 1 ? 's' : ''} · ★★ sans naufrage` : e < 3 ? `★★★ en moins de ${fmt(P.cible)}` : 'Sans naufrage et dans les temps !';
  $('fRecord').textContent = record && avant ? 'NOUVEAU RECORD !' : BEST[P.id] != null ? `Record : ${fmtD(BEST[P.id] / 1000)}` : '';
  $('bSuivant').hidden = false;
  $('bSuivant').textContent = suivant ? (dernier ? `CHANT SUIVANT : ${suivant.ep.nom.toUpperCase()}` : 'PLATEAU SUIVANT') : 'LA SUITE DU VOYAGE ARRIVE BIENTÔT';
  $('bSuivant').disabled = !suivant;
  montrer('eFin');
}
function finJour() {
  son('arrivee');
  const t = st.t, n = st.naufrages, sc = ODY.scoreJour(t, n), ms = Math.round(sc * 1000), d = JOUR.d;
  if (JOUR.classe) {
    const D = lireJ('daily', {}); D[d] = ms; ecrire('daily', D);
    if (window.LudoScores) LudoScores.submit('odyssee', 'daily:' + d, ms, true).then(r => { if (r) $('fRang').textContent = 'Plateau du jour : ' + LudoScores.rankText(r); });
  }
  $('fChant').textContent = 'PLATEAU DU JOUR';
  $('fTitre').textContent = 'TERRE EN VUE !';
  $('fEtoiles').hidden = true;
  $('fTemps').textContent = fmtD(sc);
  $('fDetail').textContent = n ? `${fmtD(t)} + ${n} naufrage${n > 1 ? 's' : ''} × ${ODY.PHYS.PENALITE} s` : 'Sans naufrage !';
  $('fRecord').textContent = JOUR.classe ? 'Tentative classée' : "Hors classement : tu as déjà tenté le plateau du jour";
  $('bSuivant').hidden = true;
  montrer('eFin');
}
function majHud() {
  $('temps').textContent = fmt(st.t); $('ep').textContent = JOUR ? 'PLATEAU DU JOUR' : chantDe(P.ep) + ` · ${P.ep.n}-${P.i + 1}`;
  if (st.M.sirenes.length) { const c = $('bCire'); c.style.setProperty('--j', ((st.cire > 0 ? st.cire / ODY.PHYS.CIRE : st.jauge) * 100).toFixed(0) + '%'); c.classList.toggle('actif', st.cire > 0); }
  $('chutes').textContent = `NAUFRAGES ${st.naufrages}`;
}
const cause = c => ({ recif: 'RÉCIF ! NAUFRAGE', fleche: P.ep.n === 10 ? 'UNE FLÈCHE DES PRÉTENDANTS !' : 'UNE FLÈCHE ENFLAMMÉE !',
  rocher: P.ep.n === 10 ? 'LA COLÈRE DE POSÉIDON !' : "POLYPHÈME T'A EU !", sirene: "LES SIRÈNES T'ONT ENSORCELÉ !",
  tourbillon: "CHARYBDE T'A AVALÉ !", scylla: 'SCYLLA !' })[c] || 'NAUFRAGE !';

$('bJouer').onclick = () => carte();
$('bJour').onclick = lancerJour;
$('bSon').onclick = $('bSonP').onclick = basculerSon;
$('bCire').onclick = () => { if (ODY.cire(st)) { message('CIRE DANS LES OREILLES !', 1); son('cire'); } else if (st.cire <= 0) message("LA CIRE N'EST PAS PRÊTE", 0.8); };
$('bPartir').onclick = partir;
$('eRecit').addEventListener('pointerup', e => { if (mode === 'recit' && !e.target.closest('button')) partir(); });
$('bPause').onclick = pause;
$('bReprendre').onclick = reprendre;
$('bRecommencer').onclick = rejouer;
$('bCarteP').onclick = $('bCarteF').onclick = () => carte(JOUR ? undefined : P.ep.n);
$('bRejouer').onclick = rejouer;
$('bSuivant').onclick = () => { const s = ODY.PLATEAUX[ODY.PLATEAUX.indexOf(P) + 1]; if (s) lancer(s.id); };
$('aplat').onclick = () => { zero = null; message('À PLAT !', 0.8); };
$('bRetour').onclick = titre;
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });

// ---------- la carte de l'Égée : le trajet de Troie à Ithaque ----------
const ESCALES = [[300, 118], [205, 178], [88, 150], [66, 262], [178, 292], [296, 334], [272, 446], [150, 430], [64, 520], [196, 572]];
const NOMS_A_VENIR = ['Troie', 'Les Lotophages', 'Polyphème', 'Éole', 'Circé', 'Les Enfers', 'Les Sirènes', 'Charybde et Scylla', 'Calypso', 'Ithaque'];
function courbe(pts) {       // passe par chaque point (Catmull-Rom → Bézier)
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
}
function ilot(x, y, rr, seed) {
  const g = ODY.rng(seed), n = 9; let d = '';
  for (let k = 0; k < n; k++) { const a = k / n * Math.PI * 2, q = rr * (0.75 + g() * 0.45); d += (k ? 'L' : 'M') + (x + Math.cos(a) * q * 1.25).toFixed(1) + ',' + (y + Math.sin(a) * q * 0.8).toFixed(1); }
  return d + 'Z';
}
let escaleChoisie = 1;
function carte(ep) {
  debloquer(); mode = 'carte'; ambiance('calme'); montrer('egee');
  const atteint = episodeAtteint(), dispo = ODY.EPISODES.length;
  escaleChoisie = ep || atteint;
  let s = `<defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5fd0e6"/><stop offset="1" stop-color="#1b98bf"/></linearGradient></defs>
    <rect width="360" height="640" fill="url(#gm)"/>`;
  const vg = ODY.rng(99);
  for (let k = 0; k < 46; k++) { const x = vg() * 360, y = vg() * 640; s += `<path d="M${x.toFixed(0)},${y.toFixed(0)} q6,-5 12,0 q6,-5 12,0" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`; }
  // côtes du continent (en haut à droite : Troie) et îles
  s += `<path d="M250,0 L360,0 L360,190 C332,172 318,140 330,110 C340,86 300,70 276,52 C258,38 262,16 250,0Z" fill="#e6cf98" stroke="#fff6dc" stroke-width="3"/>`;
  s += `<path d="M0,0 L120,0 C110,30 70,40 48,70 C30,92 10,96 0,98Z" fill="#e6cf98" stroke="#fff6dc" stroke-width="3"/>`;
  ESCALES.forEach(([x, y], i) => { if (i === 0) return; s += `<path d="${ilot(x + (i % 2 ? 26 : -26), y + 6, 18 + (i % 3) * 4, i + 3)}" fill="#e6cf98" stroke="#fff6dc" stroke-width="3"/><path d="${ilot(x + (i % 2 ? 26 : -26), y + 4, 10 + (i % 3) * 2, i + 30)}" fill="#8cc65a"/>`; });
  // le trajet : en pointillés jusqu'au bout, plein jusqu'à l'épisode atteint
  s += `<path d="${courbe(ESCALES)}" fill="none" stroke="#ffffff" stroke-opacity=".6" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>`;
  if (atteint > 1) s += `<path d="${courbe(ESCALES.slice(0, atteint))}" fill="none" stroke="#e0802a" stroke-width="5" stroke-linecap="round"/>`;
  ESCALES.forEach(([x, y], i) => {
    const E = ODY.EPISODES[i], n = i + 1, ok = E && n <= atteint, et = E ? E.plateaux.reduce((a, Q) => a + (STARS[Q.id] || 0), 0) : 0;
    const nom = E ? E.nom : NOMS_A_VENIR[i], choisi = n === escaleChoisie;
    s += `<g class="escale" data-n="${n}">
      <circle cx="${x}" cy="${y}" r="26" fill="transparent"/>
      ${choisi ? `<circle cx="${x}" cy="${y}" r="21" fill="none" stroke="#fff" stroke-width="3" stroke-opacity=".8"><animate attributeName="r" values="18;24;18" dur="1.6s" repeatCount="indefinite"/></circle>` : ''}
      <circle cx="${x}" cy="${y}" r="15" fill="${ok ? '#e0802a' : E ? '#ffffff' : '#9fcfdd'}" stroke="#fff" stroke-width="3"/>
      <text x="${x}" y="${y + 6}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="16" fill="${ok ? '#fff' : '#1b98bf'}">${n}</text>
      <text x="${x}" y="${y + 34}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="13" fill="#fff" stroke="#11607a" stroke-width="3" paint-order="stroke">${nom}</text>
      ${E && et ? `<text x="${x}" y="${y + 49}" text-anchor="middle" font-family="Fredoka, sans-serif" font-weight="700" font-size="12" fill="#ffd45a" stroke="#11607a" stroke-width="3" paint-order="stroke">★ ${et}/${E.plateaux.length * 3}</text>` : ''}
    </g>`;
  });
  // la galère sur la dernière escale atteinte
  const [gx, gy] = ESCALES[atteint - 1];
  s += `<g transform="translate(${gx + 18},${gy - 22})"><path d="M-14,4 L14,4 L9,11 L-10,11Z" fill="#8a4a22"/><path d="M0,-16 L0,4" stroke="#6a3a18" stroke-width="2"/><path d="M1,-14 C9,-10 9,-2 1,1Z" fill="#fff"/></g>`;
  $('svg').innerHTML = s;
  $('total').textContent = `★ ${totalEtoiles()} / ${ODY.PLATEAUX.length * 3}`;
  for (const g of $('svg').querySelectorAll('.escale')) g.addEventListener('click', () => { escaleChoisie = +g.dataset.n; carte(escaleChoisie); });
  volet(escaleChoisie, dispo);
}
function volet(n, dispo) {
  const E = ODY.EPISODES[n - 1], c = $('cVolet');
  $('volet').hidden = false;
  if (!E) { c.innerHTML = `<p class="chant">ÉPISODE ${n}</p><p class="titre2">${NOMS_A_VENIR[n - 1]}</p><p class="petit">Cette étape du voyage arrive bientôt.</p>`; return; }
  let h = `<p class="chant">${chantDe(E)}</p><p class="recit">${E.recit}</p>`;
  E.plateaux.forEach((Q, i) => {
    const k = ODY.PLATEAUX.indexOf(Q), ok = ouvert(k), e = STARS[Q.id] || 0;
    h += `<button class="plat" data-id="${Q.id}" ${ok ? '' : 'disabled'}><span>${E.n}-${i + 1} · ${Q.nom}</span><span class="et">${ok ? '★'.repeat(e) + '☆'.repeat(3 - e) : '🔒'}</span>
      <small>${BEST[Q.id] != null ? 'Record ' + fmtD(BEST[Q.id] / 1000) + ' · ' : ''}★★★ en moins de ${fmt(Q.cible)}</small></button>`;
  });
  c.innerHTML = h;
  for (const b of c.querySelectorAll('.plat')) b.onclick = () => lancer(b.dataset.id);
}

// ---------- la boucle ----------
let avant = performance.now(), temps = 0;
function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - avant) / 1000)); avant = now; temps += dt;
  if (mode !== 'carte' && V && st) {
    let tilt = [0, 0];
    if (mode === 'titre' || window.Odyssee.pilote) tilt = ODY.pilote(st);
    else if (mode === 'jeu') tilt = commande();
    if (mode === 'titre' || mode === 'jeu') {
      const ev = ODY.pas(st, tilt, dt);
      for (const e of ev) evenement(e);
      if (mode === 'titre' && st.fini && (demoAttente += dt) > 1.2) demo();
    } else if (mode === 'recit') ODY.pas(st, [0, 0], 0);     // le plateau reste à plat, le temps ne compte pas
    animer(dt);
    if (mode === 'jeu' && SON) sonsDuPlateau(dt);
    if (mode === 'jeu' || mode === 'pause' || mode === 'recit') majHud();
    if (rendu) rendu.render(scene, cam);
  }
  if (msgT > 0 && (msgT -= dt) <= 0) $('msg').classList.remove('vu');
  requestAnimationFrame(frame);
}
// les sons qui reviennent : rames quand on avance, chant des Sirènes, grondement des tourbillons,
// souffle du vent, rides puis claquement de Scylla
function sonsDuPlateau(dt) {
  const S = V.sons, M = st.M, v = Math.hypot(st.vx, st.vy), proche = L => L.reduce((m, [x, y]) => Math.min(m, Math.hypot(st.x - x, st.y - y)), 99);
  if (st.sombre > 0) return;
  if ((S.rame -= dt) <= 0 && v > 0.9) { son('rame', Math.min(1, v / 3)); S.rame = Math.max(0.55, 1.1 - v * 0.12); }
  const ds = proche(M.sirenes);
  if ((S.chant -= dt) <= 0 && ds < ODY.PHYS.SIRENE_R + 1 && st.cire <= 0) { OdysseeSons.chant(Math.max(0.25, 1 - ds / (ODY.PHYS.SIRENE_R + 1))); S.chant = 3.2; }
  const dt2 = proche(M.tourbillons);
  if ((S.tourb -= dt) <= 0 && dt2 < 1.8) { son('tourbillon', 1 - dt2 / 1.8); S.tourb = 2.4; }
  if ((S.vent -= dt) <= 0 && ODY.DIRS[ODY.caseEn(M, st.x, st.y)] && !st.P.courant) { son('vent'); S.vent = 3.5; }
  M.scyllas.forEach(([x, y], i) => {
    const e = ODY.scylla(st, i), etat = e.frappe ? 2 : e.alerte ? 1 : 0, d = Math.hypot(st.x - x, st.y - y);
    if (etat !== S.scylla[i] && d < 3.5) son(etat === 2 ? 'scylla' : etat === 1 ? 'rides' : '', 1 - d / 4);
    S.scylla[i] = etat;
  });
}
function evenement(e) {
  const W = st.M.W, H = st.M.H;
  if (e.k === 'impact') {
    V.ploufT = 0; V.plouf.position.set(e.x - W / 2, 0.08, e.y - H / 2);
    if (e.quoi === 'fleche') { V.brasierT = 0; V.brasier.position.set(e.x - W / 2, 0.15, e.y - H / 2); }
  }
  if (mode !== 'jeu') return;
  const SONS_EV = { naufrage: 'naufrage', reprise: 'reprise', fleche: 'fleche', lancer: 'lancer', outre: 'outre', moly: 'moly', coupe: 'coupe', phare: 'phare' };
  if (SONS_EV[e.k]) son(SONS_EV[e.k]);
  if (e.k === 'choc') son('choc', Math.min(1, e.f / 3));
  if (e.k === 'impact') { son('plouf', e.quoi === 'rocher' ? 1 : 0.4); if (e.quoi === 'fleche') son('feu'); }
  if (e.k === 'naufrage') message(cause(e.cause));
  else if (e.k === 'moly') message("L'HERBE MOLY !\nL'ÉQUIPAGE REDEVIENT HUMAIN", 1.6);
  else if (e.k === 'coupe') message('UNE COUPE DE CIRCÉ…\nGROIN !', 1.4);
  else if (e.k === 'cireFin') message('LA CIRE A FONDU', 0.9);
  else if (e.k === 'phare') message('PHARE ALLUMÉ !\nTU REPARTIRAS D\'ICI', 1.6);
  else if (e.k === 'outre') message('LES VENTS TOURNENT !', 1.2);
  else if (e.k === 'arrivee') fin();
}
function animer(dt) {
  const v = V, W = st.M.W, H = st.M.H, t = temps;
  // le plateau suit la pente
  pl.rotation.z = -st.tx; pl.rotation.x = st.ty;
  // la mer ondule
  const a = v.mer.geometry.attributes.position, b = v.base;
  for (let i = 0; i < a.count; i++) { const x = b[i * 3], z = b[i * 3 + 2]; a.array[i * 3 + 1] = Math.sin(x * 1.3 + t * 1.6) * 0.05 + Math.cos(z * 1.1 + t * 1.2) * 0.05; }
  a.needsUpdate = true; v.mer.geometry.computeVertexNormals();
  v.ecumes.forEach((e, i) => e.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08));
  // vents (et l'outre d'Éole qui s'agite avant que les vents tournent)
  if (v.vents.length) {
    TEX_VENT.offset.x -= dt * 0.7; TEX_COURANT.offset.x -= dt * 0.5;
    if (v.rot !== st.ventRot) { v.rot = st.ventRot; orienterVents(v, st.ventRot); }
    const alerte = st.P.outre && st.P.outre - st.outreT < 1.2;
    for (const m of v.vents) m.material.opacity = alerte ? 0.35 + 0.4 * Math.abs(Math.sin(t * 9)) : 0.75;
    if (v.outre) { v.outre.rotation.z = alerte ? Math.sin(t * 25) * 0.25 : Math.sin(t * 2) * 0.05; v.outre.scale.setScalar(alerte ? 1.12 : 1); }
  }
  if (v.ile_eole) v.ile_eole.position.y = 0.9 + Math.sin(t * 0.8) * 0.12;
  if (v.nuages) for (const n of v.nuages) { n.position.x += n.userData.v * dt; if (n.position.x > W / 2 + 3) n.position.x = -W / 2 - 3; }
  if (v.feux) v.feux.forEach((f, i) => { f.scale.y = 0.8 + Math.abs(Math.sin(t * 7 + i * 1.7)) * 0.45; });
  if (v.fumees) for (const s of v.fumees) { const p = (t * 0.15 + s.userData.p) % 1; s.position.set(s.userData.x + p * 0.8, (s.userData.y0 || 2) + p * 3, -0.3 - p); s.scale.setScalar(0.6 + p * 1.4); s.material.opacity = 0.45 * (1 - p); }
  if (v.ombres) for (const o of v.ombres) { o.position.set(o.userData.x + Math.sin(t * 0.5 + o.userData.p) * 0.6, 1.6 + Math.sin(t * 1.3 + o.userData.p) * 0.3, 0.4); o.material.opacity = 0.25 + 0.15 * Math.sin(t * 2 + o.userData.p); }
  // Circé
  v.molys.forEach((m, i) => { m.g.visible = !st.molys[i]; m.g.rotation.y = t * 0.8; m.halo.scale.setScalar(1 + Math.sin(t * 3 + i) * 0.1); });
  v.coupes.forEach((c, i) => { c.eclat.rotation.y = t * 2; c.eclat.position.y = 0.6 + Math.sin(t * 2.5 + i) * 0.05; });
  bat_cochons(v);
  // Sirènes : elles se balancent ; leur chant (ondes roses) se tait avec la cire
  v.sirenes.forEach(S => {
    S.corps.rotation.z = Math.sin(t * 1.5 + S.ph) * 0.12;
    S.ondes.forEach((o, k) => { const p = (t * 0.45 + k * 0.5 + S.ph) % 1, sc = 0.4 + p * (ODY.PHYS.SIRENE_R - 0.4); o.visible = st.cire <= 0; o.scale.setScalar(sc); o.material.opacity = 0.55 * (1 - p); });
  });
  // Charybde et Scylla
  v.tourbillons.forEach(sp => { sp.rotation.z += dt * 2.6; });
  v.scyllas.forEach((S, i) => {
    const e = ODY.scylla(st, i);
    S.rides.forEach((rd, k) => { rd.visible = e.alerte; rd.scale.setScalar(1 + ((e.c * 2 + k * 0.5) % 1) * 0.6); });
    S.zone.visible = e.alerte || e.frappe; S.zone.material.opacity = e.frappe ? 0.32 : 0.12 + 0.1 * Math.sin(t * 12);
    const haut = e.frappe ? Math.min(1, (e.c - ODY.PHYS.SCYLLA_ALERTE) / 0.15) : 0;
    S.cou.visible = haut > 0; S.cou.position.y = -1.3 + haut * 1.3; S.cou.rotation.y = Math.sin(t * 3 + i) * 0.4;
  });
  // la nuit : les phares allumés éclairent
  if (v.L.nuit) v.phares.forEach((p, i) => { const l = p.g.children.find(c => c.isPointLight); if (l) l.intensity = st.phares[i] ? 1.6 : 0; });
  if (v.palmiers) v.palmiers.forEach((c, i) => { c.rotation.z = Math.sin(t * 1.3 + i) * 0.08; });
  // phares
  v.phares.forEach((p, i) => { const on = st.phares[i]; p.feu.material.color.setHex(on ? 0xffe25a : 0x8a8a8a); p.halo.material.color.setHex(on ? 0xffe25a : 0xffffff); p.halo.scale.setScalar(on ? 1 + Math.sin(t * 3) * 0.08 : 1); });
  // flèches enflammées
  v.fleches.forEach(f => { f.ombre.visible = f.fl.visible = false; });
  st.fleches.forEach((f, i) => {
    const o = v.fleches[i]; if (!o || f.fait) return;
    const k = Math.min(1, f.t / f.dur), [x, z] = [f.x - W / 2, f.y - H / 2];
    o.ombre.visible = o.fl.visible = true; o.ombre.position.set(x, 0.07, z); o.ombre.scale.setScalar(0.3 + 0.7 * k); o.ombre.material.opacity = 0.2 + 0.4 * k;
    o.fl.position.set(x - 4 * (1 - k) * 0.6, 0.5 + 7 * (1 - k), z - 4 * (1 - k) * 0.4);
  });
  v.brasierT = (v.brasierT == null ? 9 : v.brasierT) + dt; v.brasier.visible = v.brasierT < 0.6; v.brasier.scale.set(1, 1 - v.brasierT, 1);
  // Polyphème
  if (v.cyclope) {
    const C = v.cyclope;
    C.bras.rotation.z = st.tir ? -1.4 : -0.5 + Math.max(0, 0.6 - st.rocAtt) * 2;
    C.pupille.position.x = (st.x - W / 2) * 0.03;
    if (st.tir) {
      const T = st.tir, [x, z] = [T.x - W / 2, T.y - H / 2], k = Math.min(1, T.t / T.dur);
      v.ombre.visible = v.rocher.visible = true; v.ombre.position.set(x, 0.07, z); v.ombre.scale.setScalar(0.3 + k * 0.7);
      v.rocher.position.set(x, 9 * (1 - k * k), z - 4 * (1 - k)); v.rocher.rotation.x += dt * 5;
    } else v.ombre.visible = v.rocher.visible = false;
  }
  v.ploufT += dt; v.plouf.visible = v.ploufT < 0.6; v.plouf.scale.setScalar(1 + v.ploufT * 3); v.plouf.material.opacity = 0.9 * (1 - v.ploufT / 0.6);
  // la galère : cap dans le sens de la course, tangage, tournoie quand elle sombre
  const prof = st.sombre > 0 ? Math.min(1, st.sombre / 0.4) : 0, bat = v.bat, vit = Math.hypot(st.vx, st.vy);
  bat.position.set(st.x - W / 2, 0.06 - prof * 0.6 + Math.sin(t * 2.4) * 0.03, st.y - H / 2);
  if (vit > 0.15) { let d = Math.atan2(-st.vy, st.vx) - bat.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); bat.rotation.y += d * Math.min(1, dt * 6); }
  if (prof > 0) bat.rotation.y += dt * 12;
  bat.userData.coque.rotation.x = Math.sin(t * 2.4) * 0.12; bat.userData.coque.rotation.z = Math.sin(t * 1.7) * 0.06;
  bat.scale.setScalar(1.25 * (1 - prof * 0.6));
  if (st.lourd) bat.position.y -= 0.05;
  bat.visible = !(st.grace > 0 && Math.floor(st.grace * 10) % 2);
  // orage : un éclair de temps en temps
  if (v.L === LUMIERES.orage) {
    v.eclair = (v.eclair == null ? 3 : v.eclair) - dt;
    if (v.eclair < -0.18) v.eclair = 3 + Math.random() * 5;
    const flash = v.eclair < 0 && v.eclair > -0.06 || v.eclair < -0.12;
    hemi.intensity = v.L.h + (flash ? 1.1 : 0);
    if (rendu) rendu.setClearColor(flash ? 0xc8d4e8 : v.L.ciel);
  }
}

majSon();
titre();
cadrer();
requestAnimationFrame(frame);
window.Odyssee = { ODY, pilote: false, lancer, lancerJour, partir, carte, titre, fin, get st() { return st; }, get mode() { return mode; } };

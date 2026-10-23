/* =====================================================================
   BANNIÈRES · la CARTE en 3D (Three.js r128) : cases hexagonales KayKit,
   rivière, village (bâtiments, décorations, château qui grandit),
   frontières aux couleurs des seigneurs, mer, nuages, saisons, armées
   (un personnage animé, un étendard, le nombre de guerriers).
   Ne lit que l'état des règles (regles.js) ; les objets 3D des armées
   sont gardés ici (OBJ, par numéro d'armée), pas dans l'état.
   Repris de la maquette (outils/bannieres-maquette/modele.html).
   ===================================================================== */
'use strict';
/* global KAYKIT, KAYKIT_TEX, DONJON, DONJON_TEX, FORET, FORET_TEX */

// ---------- géométries KayKit converties ----------
// [sommets, indices, base64(pos Int16 ×4096, normales Int8, uv Uint16, indices)] ou, pour une variante de couleur, [modèle de même forme, base64(uv)]
const geos = {};
const octets = b64 => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return new DataView(u.buffer); };
function geo(nom) {
  if (geos[nom]) return geos[nom];
  const e = KAYKIT[nom] || DONJON[nom] || FORET[nom];
  if (!e) throw new Error('modèle inconnu : ' + nom);
  if (typeof e[0] === 'string') {
    const base = geo(e[0]), n = base.attributes.position.count, dv = octets(e[1]), uv = new Float32Array(n * 2);
    for (let i = 0; i < n * 2; i++) uv[i] = dv.getUint16(i * 2, true) / 65535;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', base.attributes.position); g.setAttribute('normal', base.attributes.normal);
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(base.index);
    g.computeBoundingBox();
    return geos[nom] = g;
  }
  const [n, ni, b64] = e, dv = octets(b64);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
  let o = 0;
  for (let i = 0; i < n * 3; i++, o += 2) pos[i] = dv.getInt16(o, true) / 4096;
  for (let i = 0; i < n * 3; i++, o += 1) nor[i] = dv.getInt8(o) / 127;
  for (let i = 0; i < n * 2; i++, o += 2) uv[i] = dv.getUint16(o, true) / 65535;
  const grand = n >= 65536, idx = grand ? new Uint32Array(ni) : new Uint16Array(ni);
  for (let i = 0; i < ni; i++, o += grand ? 4 : 2) idx[i] = grand ? dv.getUint32(o, true) : dv.getUint16(o, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeBoundingBox();
  return geos[nom] = g;
}

// ---------- rendu ----------
const rendu = new THREE.WebGLRenderer({ antialias: true });
rendu.setPixelRatio(Math.min(devicePixelRatio, 2));
rendu.outputEncoding = THREE.sRGBEncoding;
rendu.shadowMap.enabled = true;
rendu.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc6e8);
scene.fog = new THREE.Fog(0x8fc6e8, 30, 60);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
const ciel = new THREE.HemisphereLight(0xdff1ff, 0x5a7040, 0.75);
scene.add(ciel);
const soleil = new THREE.DirectionalLight(0xfff1d6, 1.0);
soleil.position.set(-8, 16, 6);
soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048);
Object.assign(soleil.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 50 });
soleil.shadow.bias = -0.0008;
scene.add(soleil);

// L'atlas KayKit, et deux copies retouchées : le violet (le bleu de l'atlas tourné vers le violet, KayKit n'a pas de violet)
// et le gris (bâtiments d'une case sans seigneur)
function matiere(retouche, source = KAYKIT_TEX) {
  const tex = new THREE.Texture();
  tex.flipY = false; tex.encoding = THREE.sRGBEncoding;
  const img = new Image();
  img.onload = () => {
    if (!retouche) tex.image = img;
    else {
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height);
      for (let i = 0; i < d.data.length; i += 4) retouche(d.data, i);
      g.putImageData(d, 0, 0); tex.image = c;
    }
    tex.needsUpdate = true;
  };
  img.src = source;
  return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0 });
}
function teinte(r, g, b) { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return [0, 0, mx / 255]; let h = mx === r ? (g - b) / d % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, d / mx, mx / 255]; }
function rgb(h, s, v) { const f = n => { const k = (n + h / 60) % 6; return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1)))); }; return [f(5), f(3), f(1)]; }
const versViolet = (p, i) => { const [h, s, v] = teinte(p[i], p[i + 1], p[i + 2]); if (h > 195 && h < 250 && s > 0.3) [p[i], p[i + 1], p[i + 2]] = rgb(h + 65, s * 0.9, v * 0.95); };
const matBase = matiere(), matViolet = matiere(versViolet);
const matDonjon = matiere(null, DONJON_TEX), matForet = matiere(null, FORET_TEX), matDonjonViolet = matiere(versViolet, DONJON_TEX);
const matGris = matiere((p, i) => { const m = (p[i] + p[i + 1] + p[i + 2]) / 3; for (let k = 0; k < 3; k++) p[i + k] = Math.round(p[i + k] * 0.35 + m * 0.65); });

function objet(nom, mat, ombre = true) {
  mat = mat || (DONJON[nom] ? matDonjon : FORET[nom] ? matForet : matBase);
  const m = new THREE.Mesh(geo(nom), mat);
  m.castShadow = ombre; m.receiveShadow = true;
  return m;
}

// ---------- coordonnées ----------
const px = (q, r) => 2 * (q + r / 2), pz = (q, r) => Math.sqrt(3) * r;
// tuiles de rivière KayKit : côtés reliés quand la tuile n'est pas tournée ; tourner de n × 60° fait passer le côté k au côté k − n
const RIVIERES = { hex_river_A: [0, 3], hex_river_A_curvy: [0, 3], hex_river_B: [3, 5], hex_river_C: [3, 4], hex_river_D: [1, 3, 5], hex_river_E: [0, 3, 5], hex_river_F: [0, 1, 3], hex_river_G: [2, 3, 4] };
function tuileRiviere(cotes) {
  const voulu = [...cotes].sort().join();
  for (const [nom, c] of Object.entries(RIVIERES))
    for (let n = 0; n < 6; n++) if (c.map(k => (k - n + 6) % 6).sort().join() === voulu) return { nom, rot: n * Math.PI / 3 };
  return { nom: 'hex_river_A', rot: 0 };
}
function cotesRiviere(i) {
  const G = banG(etat), [q, r] = G.cases[i], c = [];
  BAN_VOIS.forEach(([dq, dr], k) => { const j = G.ici(q + dq, r + dr); if (j >= 0 && etat.terres[j].t === 'riviere') c.push(k); });
  if (c.length === 1) c.push((c[0] + 3) % 6);   // bout de rivière : elle file tout droit vers la mer (ou sous le château)
  if (!c.length) c.push(0, 3);
  return c.slice(0, 3);
}

// ---------- couleurs des seigneurs, modèles du village ----------
const COUL = {
  or: { k: 'yellow', hex: 0xf2c230, mat: matBase },
  rouge: { k: 'red', hex: 0xd8322a, mat: matBase },
  bleu: { k: 'blue', hex: 0x2f6fe0, mat: matBase },
  violet: { k: 'blue', hex: 0x9b4fd6, mat: matViolet },
};
const BAT_MODELE = { chateau: 'castle', maison: 'home_A', moulin: 'windmill', marche: 'market', forge: 'blacksmith', caserne: 'barracks', tour: 'tower_A' };
const modeleBat = t => 'building_' + (t.bat === 'maison' && t.grand ? 'home_B' : BAT_MODELE[t.bat]) + '_';
// une décoration (regles.js) → son modèle ; le puits est à la couleur du seigneur (finit par « _ »)
const DECO_MODELE = { puits: 'building_well_', brouette: 'wheelbarrow', tonneau: 'barrel', caisses: 'crate_A_big', cible: 'target', seau: 'bucket_water', palette: 'pallet', sac: 'sack' };
const PLACES_DECO = [[-0.62, 0.28], [0.66, -0.3], [-0.42, -0.62]];

// ---------- décor d'une case ----------
function hasardTerre(i, k) { let x = (i + 1) * 9301 + k * 49297; x = (x * 233280 + 12345) % 2147483647; return (x % 1000) / 1000; }
function decor(i) {
  const t = etat.terres[i], S = t.prop >= 0 ? etat.seigneurs[t.prop] : null, C = S && COUL[S.coul];
  const d = [], rot = k => Math.floor(hasardTerre(i, k) * 6) * Math.PI / 3, k3 = C ? C.k : 'blue', mat3 = C ? C.mat : matGris;
  const decos = () => t.decos.forEach((n, k) => { const m = DECO_MODELE[n]; if (m) d.push([m.endsWith('_') ? m + k3 : m, PLACES_DECO[k][0], PLACES_DECO[k][1], m.endsWith('_') ? mat3 : matBase, rot(4 + k)]); });
  if (t.bat === 'chateau') {
    d.push(['building_castle_' + k3, 0, 0, mat3, 0, true]);
    const n = S ? banEtapeChateau(etat, t.prop) : 0;   // le château grandit avec le village
    if (n >= 1 && C) d.push(['flag_' + C.k, -0.72, 0.42, C.mat, 0], ['flag_' + C.k, 0.72, 0.42, C.mat, 0]);
    // les remparts : le modèle de palissade est un bord d'hexagone (côté ouest) ; posé au centre et tourné, il longe un bord de la case
    if (n >= 2) [0, 1, 2, 3].forEach(k => d.push(['fence_wood_straight', 0, 0, matBase, k * Math.PI / 3, false, 0.93]));
    decos();
    return d;
  }
  if (t.bat && BAN_BATIMENTS[t.bat]) {
    d.push([modeleBat(t) + k3, 0, -0.12, mat3, rot(1), true, t.grand && t.bat !== 'maison' ? 1.18 : 1]);
    if (t.grand && C) d.push(['flag_' + C.k, 0.55, 0.35, C.mat, 0]);   // un bâtiment amélioré a son drapeau
    decos();
    return d;
  }
  if (t.camp) { d.push(['tent', -0.35, -0.35, matBase, rot(1)], ['weaponrack', 0.5, -0.45, matBase, rot(2)], ['barrel_small_stack', -0.7, 0.3, null, rot(3)]); return d; }
  if (t.ruine) { d.push(['wall_broken', -0.1, -0.55, null, 0], ['pillar', 0.6, -0.2, null, 0], ['rubble_half', -0.55, 0.25, null, rot(2)], ['torch_lit', 0.25, -0.5, null, 0]); return d; }
  const q = 1 + Math.floor(hasardTerre(i, 9) * 3);
  // le décor reste au fond de la case : l'armée se tient devant
  if (t.t === 'foret') d.push([['trees_A_medium', 'trees_B_large', 'trees_A_large'][q - 1], 0, -0.2, matBase, rot(1)]);
  else if (t.t === 'colline') d.push([['hill_single_A', 'hills_B', 'hills_C_trees'][q - 1], 0, -0.15, matBase, rot(1)]);
  else if (t.t === 'montagne') d.push([['mountain_C_grass', 'mountain_B_grass', 'mountain_A_grass_trees'][q - 1], 0, -0.1, matBase, rot(1)]);
  else if (t.t === 'marais') d.push(['waterplant_A', -0.45, 0.3, matBase, rot(1)], ['waterplant_B', 0.4, -0.35, matBase, rot(2)], ['waterlily_A', 0.3, 0.45, matBase, rot(3)], ['waterplant_C', 0.05, -0.1, matBase, rot(5)]);
  else if (t.t === 'plaine') d.push([q >= 2 ? 'building_grain' : 'tree_single_A', q >= 2 ? 0 : -0.5, q >= 2 ? 0 : -0.4, matBase, rot(1)]);
  decos();
  return d;
}
// la bannière d'une armée : le nombre de guerriers sur un fond de la couleur du seigneur
function etiquette(n, couleur, brig) {
  const c = document.createElement('canvas'); c.width = 96; c.height = 48;
  const g = c.getContext('2d');
  g.fillStyle = '#2b1d0e'; g.fillRect(8, 4, 80, 34); g.fillRect(40, 38, 16, 8);
  g.fillStyle = brig ? '#5b2a1e' : '#' + couleur.toString(16).padStart(6, '0'); g.fillRect(12, 8, 72, 26);
  g.fillStyle = '#fff6e0'; g.font = "18px 'Press Start 2P', monospace"; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(String(n), 48, 22);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  s.scale.set(1.1, 0.55, 1); s.renderOrder = 10;
  return s;
}

// ---------- la scène de la partie ----------
let etat = null;   // l'état des règles (regles.js), tenu par jeu.js
const groupes = [], mer = [], nuages = [];
const geoLisere = new THREE.BoxGeometry(1.06, 0.12, 0.2), liseres = {};
let debutScene = 0;
// plaques posées sur les cases atteignables (jaunes) ou attaquables (rouges)
const geoPlaque = new THREE.CircleGeometry(1.08, 6);
const matPlaque = new THREE.MeshBasicMaterial({ color: 0xfff27a, transparent: true, opacity: 0.55, depthWrite: false });
const matCible = new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0.5, depthWrite: false });
function batirTerre(i) {
  const g = groupes[i], t = etat.terres[i], u = g.userData, S = t.prop >= 0 ? etat.seigneurs[t.prop] : null;
  const sig = JSON.stringify([t.prop, t.camp, t.ruine, t.bat, t.grand, t.decos, t.bat === 'chateau' && t.prop >= 0 ? banEtapeChateau(etat, t.prop) : 0, (t.garnison || []).length, banVoisins(etat, i).map(v => etat.terres[v].prop)]);
  if (sig === u.sig) return;
  if (u.sig && u.prop !== t.prop) u.flash = performance.now();
  if (u.sig && t.bat && (u.bat !== t.bat || u.grand !== t.grand)) u.pop = performance.now();   // un bâtiment sort de terre
  u.bat = t.bat; u.grand = t.grand; u.sig = sig; u.prop = t.prop;
  while (g.children.length) g.remove(g.children[0]);
  let sol;
  if (t.t === 'riviere' && t.bat !== 'chateau') { const r = tuileRiviere(cotesRiviere(i)); sol = objet(r.nom, matBase, false); sol.rotation.y = r.rot; }
  else sol = objet(t.t === 'marais' ? 'hex_water' : 'hex_grass', matBase, false);
  g.add(sol);
  u.batiments = [];
  decor(i).forEach(([nom, dx, dz, mat, r, bat, ech]) => {
    const o = objet(nom, mat); o.position.set(dx, 0, dz); o.rotation.y = r || 0;
    if (DONJON[nom]) o.scale.setScalar(0.75); if (ech) o.scale.setScalar(ech);
    if (bat) { u.batiments.push(o); o.userData.ech = ech || 1; }
    g.add(o);
  });
  // la garnison d'une tour : sa bannière, avec le nombre de guerriers, au-dessus de la tour
  if (t.garnison && t.garnison.length && S) { const e = etiquette(t.garnison.length, COUL[S.coul].hex, false); e.position.set(0, 2.3, -0.12); e.scale.multiplyScalar(0.8); g.add(e); }
  if (u.pop) { const e = objet('building_scaffolding'); e.position.set(0, 0, -0.12); g.add(e); u.echaf = e; }
  if (S) {
    const C = COUL[S.coul];
    liseres[S.coul] = liseres[S.coul] || new THREE.MeshBasicMaterial({ color: new THREE.Color(C.hex).convertSRGBToLinear() });
    BAN_VOIS.forEach(([dq, dr], k) => {
      const j = banG(etat).ici(t.q + dq, t.r + dr);
      if (j >= 0 && etat.terres[j].prop === t.prop) return;
      const a = k * Math.PI / 3, b = new THREE.Mesh(geoLisere, liseres[S.coul]);
      b.position.set(Math.cos(a) * 0.89, 0.06, Math.sin(a) * 0.89); b.rotation.y = Math.PI / 2 - a; g.add(b);
    });
  }
  const pl = new THREE.Mesh(geoPlaque, matPlaque); pl.rotation.x = -Math.PI / 2; pl.position.y = 0.04; pl.visible = false; pl.renderOrder = 5; g.add(pl); u.plaque = pl;
}
function nouvelleScene() {
  [...groupes, ...mer, ...nuages].forEach(o => scene.remove(o));
  groupes.length = mer.length = nuages.length = 0;
  OBJ.forEach(o => scene.remove(o)); OBJ.clear();
  const G = banG(etat), centre = G.ici(0, 0);
  etat.terres.forEach((t, i) => {
    const g = new THREE.Group();
    g.userData = { i, x: px(t.q, t.r), z: pz(t.q, t.r), lev: 0, delai: banDist(etat, i, centre) * 160 + hasardTerre(i, 7) * 220 };
    g.position.set(g.userData.x, 0, g.userData.z);
    scene.add(g); groupes.push(g); batirTerre(i);
  });
  const R = etat.rayon;
  for (let q = -R - 4; q <= R + 4; q++) for (let r = -R - 4; r <= R + 4; r++) {
    const d = Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
    if (d <= R || d > R + 4) continue;
    const m = objet('hex_water', matBase, false); m.position.set(px(q, r), -0.05, pz(q, r)); m.userData.ph = q * 0.7 + r * 1.3; scene.add(m); mer.push(m);
  }
  [['cloud_big', -6, 7, -4], ['cloud_small', 5, 6.5, 2], ['cloud_big', 2, 7.5, -9], ['cloud_small', -9, 6, 6]].forEach(([n, x, y, z]) => { const c = objet(n); c.position.set(x, y, z); c.receiveShadow = false; scene.add(c); nuages.push(c); });
  debutScene = performance.now();
  majArmees(); appliquerSaison();
}
const majScene = () => etat.terres.forEach((t, i) => batirTerre(i));
const secouer = i => { if (groupes[i]) groupes[i].userData.choc = performance.now(); };

// ---------- les armées sur la carte ----------
// son chef (le guerrier le plus haut gradé), un étendard, une bannière avec le nombre de guerriers
const OBJ = new Map();   // numéro d'armée → objet 3D
let armeeChoisie = null;   // numéro de l'armée choisie par le joueur
const RANG = ['seigneur', 'champion', 'fantassin', 'lancier', 'mage', 'archer', 'squelette', 'necromancien', 'sbire', 'barbare', 'voleur'];
const chef = a => a.unites.slice().sort((x, y) => RANG.indexOf(x.type) - RANG.indexOf(y.type))[0];
const coulArmee = a => (a.s >= 0 ? etat.seigneurs[a.s].coul : 'neutre');
const geoChoix = new THREE.RingGeometry(0.42, 0.56, 32), matChoix = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
function majArmee(a) {
  const vieux = OBJ.get(a.id), sig = a.unites.map(u => u.type + u.pv).join() + '|' + a.pts + '|' + (a.id === armeeChoisie);
  if (vieux && vieux.userData.sig === sig) return;
  const g = new THREE.Group(), c = coulArmee(a), C = COUL[c];
  const fig = aventurier(VUE[chef(a).type], c, 0.85);
  fig.rotation.y = a.s === 0 ? -0.5 : 0.3;
  jouer(fig, TYPES[VUE[chef(a).type]].repos).time = hasardTerre(a.id, 3) * 2;
  g.add(fig);
  if (a.s >= 0) g.add(etendard(c));
  else { const d = objet(a.s === -2 ? 'torch_lit' : 'weaponrack'); d.scale.setScalar(a.s === -2 ? 0.9 : 0.6); d.position.set(-0.35, 0, -0.2); g.add(d); }
  // la bannière : le nombre de guerriers ; grisée quand l'armée du joueur a fini de bouger
  const e = etiquette(a.unites.length, C ? (a.s === 0 && !a.pts ? 0x8a8170 : C.hex) : 0x5b2a1e, a.s < 0); e.position.set(0.05, 1.35, 0); g.add(e);
  if (a.id === armeeChoisie) { const r = new THREE.Mesh(geoChoix, matChoix); r.rotation.x = -Math.PI / 2; r.position.y = 0.03; g.add(r); }
  g.userData = { sig, fig, armee: a.id };
  if (vieux) { g.position.copy(vieux.position); g.visible = vieux.visible; scene.remove(vieux); } else poserArmee(g, a.terre);
  scene.add(g); OBJ.set(a.id, g);
}
// toutes les armées : les nouvelles apparaissent, les disparues s'en vont, chacune à sa place
function majArmees() {
  const vivantes = new Set(etat.armees.map(a => a.id));
  OBJ.forEach((o, id) => { if (!vivantes.has(id)) { scene.remove(o); OBJ.delete(id); } });
  etat.armees.forEach(a => { majArmee(a); if (!OBJ.get(a.id).userData.marche) poserArmee(OBJ.get(a.id), a.terre); });
}
// l'étendard d'une armée : une hampe de bois, un fleuron doré, la bannière (pack Dungeon) aux couleurs du seigneur
const BANNIERE = { or: 'banner_patternA_yellow', rouge: 'banner_patternA_red', bleu: 'banner_patternA_blue', violet: 'banner_patternA_blue' };
const geoHampe = new THREE.CylinderGeometry(0.025, 0.03, 1.5, 6), geoFleuron = new THREE.SphereGeometry(0.06, 8, 6);
const matHampe = new THREE.MeshLambertMaterial({ color: new THREE.Color(0x6b4423).convertSRGBToLinear() }), matFleuron = new THREE.MeshLambertMaterial({ color: new THREE.Color(0xe8b23a).convertSRGBToLinear() });
function etendard(coul) {
  const g = new THREE.Group(), h = new THREE.Mesh(geoHampe, matHampe); h.position.y = 0.75; h.castShadow = true; g.add(h);
  const f = new THREE.Mesh(geoFleuron, matFleuron); f.position.y = 1.52; g.add(f);
  const b = objet(BANNIERE[coul] || 'banner_patternA_white', coul === 'violet' ? matDonjonViolet : matDonjon);
  b.scale.setScalar(0.42); b.position.set(0, 1.48 - 1.68 * 0.42, -0.17); g.add(b);   // la bannière pend sous la traverse, devant la hampe
  g.position.set(-0.32, 0, -0.22); g.rotation.y = 0.35;
  return g;
}
const placeArmee = i => { const t = etat.terres[i]; return [px(t.q, t.r) + 0.32, pz(t.q, t.r) + 0.42]; };
function poserArmee(g, i) { const [x, z] = placeArmee(i); g.position.set(x, 0, z); }
// une armée marche le long de son chemin, case après case (la règle a déjà bougé l'armée : ce n'est que l'image)
async function marcher(id, depart, ch) {
  const g = OBJ.get(id); if (!g || !ch.length) return;
  const fig = g.userData.fig, a = banArmee(etat, id);
  g.userData.marche = true; poserArmee(g, depart);
  jouer(fig, 'Running_A', false, 1.1);
  for (const j of ch) {
    const [x1, z1] = placeArmee(j), x0 = g.position.x, z0 = g.position.z;
    fig.rotation.y = Math.atan2(x1 - x0, z1 - z0); Sons.pas();
    const t0 = performance.now(), duree = vite ? 160 : 420;
    await new Promise(ok => { const pas = () => { const k = Math.min(1, (performance.now() - t0) / duree); g.position.x = x0 + (x1 - x0) * k; g.position.z = z0 + (z1 - z0) * k; if (k < 1) requestAnimationFrame(pas); else ok(); }; pas(); });
  }
  g.userData.marche = false;
  if (a) jouer(fig, TYPES[VUE[chef(a).type]].repos);
  fig.rotation.y = a && a.s === 0 ? -0.5 : 0.3;
}
let vite = false;   // les rivaux marchent plus vite (bouton VITE)

// ---------- les cases éclairées ----------
function eclairer(m) {
  groupes.forEach(g => { g.userData.plaque.visible = false; });
  if (!m) return;
  m.forEach((v, j) => { const pl = groupes[j].userData.plaque; pl.material = v.combat ? matCible : matPlaque; pl.visible = true; });
}

// ---------- saisons : lumière, ciel ----------
const SAISONS = {
  printemps: { ciel: 0x8fc6e8, soleil: 0xfff1d6, sol: 0x5a7040, teinte: 0xffffff },
  'été': { ciel: 0x7cc0ee, soleil: 0xfff0c0, sol: 0x6a7a3a, teinte: 0xfffbea },
  automne: { ciel: 0xb9c7cf, soleil: 0xffc890, sol: 0x7a5a30, teinte: 0xffe6c8 },
  hiver: { ciel: 0xc9d8e6, soleil: 0xe4ecff, sol: 0x8090a8, teinte: 0xe2ebf8 },
};
function appliquerSaison() {
  const S = SAISONS[banSaison(etat.tour)] || SAISONS.printemps;
  scene.background.setHex(S.ciel); scene.fog.color.setHex(S.ciel); document.body.style.background = '#' + S.ciel.toString(16).padStart(6, '0');
  soleil.color.setHex(S.soleil); ciel.groundColor.setHex(S.sol);
  [matBase, matViolet, matGris].forEach(m => m.color.setHex(S.teinte));
}

// ---------- caméra, toucher ----------
let angle = -0.5, tourneSeule = false;   // face au château du joueur (coin en bas à gauche) ; au titre, la carte tourne seule
function cadrer() {
  const w = innerWidth, h = innerHeight;
  rendu.setSize(w, h); camera.aspect = w / h;
  camera.userData.d = Math.max(19.5, 24 / Math.min(1, camera.aspect * 1.25)) * (etat && etat.rayon === 4 ? 1.3 : 1);
  camera.updateProjectionMatrix();
  if (typeof cadrerBataille === 'function') cadrerBataille();
}
const rayon = new THREE.Raycaster();
// ce qu'on a touché : une armée (son numéro et sa case) ou une case
function piocher(x, y) {
  rayon.setFromCamera({ x: x / innerWidth * 2 - 1, y: -y / innerHeight * 2 + 1 }, camera);
  const armees = [...OBJ.values()].filter(o => o.visible), objs = [...armees, ...groupes];
  const hit = rayon.intersectObjects(objs, true)[0];
  let o = hit && hit.object; while (o && !objs.includes(o)) o = o.parent;
  if (!o) return null;
  if (o.userData.armee != null) { const a = banArmee(etat, o.userData.armee); return a ? { terre: a.terre, armee: a.id } : null; }
  return { terre: o.userData.i, armee: null };
}

// ---------- animation de la carte ----------
const rebond = x => { const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; };
function animerCarte(now, dt) {
  if (tourneSeule) angle += dt * 0.12;
  const d = camera.userData.d;
  camera.position.set(Math.sin(angle) * d * 0.72, d * 0.72, Math.cos(angle) * d * 0.72);
  camera.lookAt(Math.sin(angle) * 2.2, -0.6, Math.cos(angle) * 2.2);   // la carte remonte au-dessus du panneau du bas
  groupes.forEach(g => {
    const u = g.userData;
    const k = Math.min(1, Math.max(0, (now - debutScene - u.delai) / 700));
    let y = (1 - rebond(k)) * 14;
    // case qui change de seigneur : un bond ; case attaquée : un tremblement
    if (u.flash && now > u.flash) { const f = (now - u.flash) / 600; if (f < 1) y += Math.sin(f * Math.PI) * 0.8; else u.flash = 0; }
    g.position.x = u.x;
    if (u.choc && now > u.choc) { const f = (now - u.choc) / 450; if (f < 1) g.position.x = u.x + Math.sin(f * 40) * 0.08 * (1 - f); else u.choc = 0; }
    g.position.y = y;
    g.visible = k > 0;
    // construction : l'échafaudage, puis le bâtiment qui sort de terre
    if (u.pop) {
      const f = (now - u.pop) / 1100;
      const s = f < 0.45 ? 0.001 : Math.min(1, rebond(Math.min(1, (f - 0.45) / 0.55)));
      u.batiments.forEach(o => o.scale.set(o.userData.ech, o.userData.ech * s, o.userData.ech));
      if (f >= 1) { u.pop = 0; if (u.echaf) { g.remove(u.echaf); u.echaf = null; } }
    }
  });
  matPlaque.opacity = 0.4 + Math.sin(now / 250) * 0.18; matCible.opacity = 0.45 + Math.sin(now / 250) * 0.2;
  // les armées : visibles une fois les cases posées ; leur chef respire
  OBJ.forEach(o => { o.visible = now - debutScene > 2300; o.userData.fig.userData.mixer.update(dt); });
  const s = now / 1000;
  mer.forEach(m => { m.position.y = -0.05 + Math.sin(s * 1.4 + m.userData.ph) * 0.04; });
  nuages.forEach((c, i) => { c.position.x += dt * (0.25 + i * 0.05); if (c.position.x > 16) c.position.x = -16; });
  rendu.render(scene, camera);
}

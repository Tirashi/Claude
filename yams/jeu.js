'use strict';
/* =====================================================================
   YAMS : le Yams classique (13 cases, 3 lancers par tour, bonus de 35 à
   63 points en haut) avec de vrais dés en 3D. Rendu Three.js r128 et
   physique cannon.js 0.6.2 (lib/). Les dés roulent pour de vrai : leur
   valeur est lue sur la face tournée vers le haut quand ils s'arrêtent.
   Six styles de dés (maquette maquettes/yams.html) : B de départ, les
   cinq autres se débloquent (SKINS). Deux gestes : glisser le doigt vers
   le haut (B, C, D, E ; la vitesse donne la force) ou garder le doigt
   appuyé pour secouer le gobelet, puis lâcher (A, F). LANCER fait pareil.
   Sauvegarde : yams.best, .parties, .nbYams, .bonus, .skin, .son,
   .partie {tour, lancers, feuille, vals, garde}.
   ===================================================================== */
const store = {
  get(k, d){ try { const v = localStorage.getItem('yams.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v){ try { localStorage.setItem('yams.' + k, JSON.stringify(v)); } catch (e) {} },
  del(k){ try { localStorage.removeItem('yams.' + k); } catch (e) {} }
};
const $ = id => document.getElementById(id);

// ---------- règles ----------
const CATS = [
  {k: 'u1', n: 'As', h: 1}, {k: 'u2', n: 'Deux', h: 1}, {k: 'u3', n: 'Trois', h: 1}, {k: 'u4', n: 'Quatre', h: 1}, {k: 'u5', n: 'Cinq', h: 1}, {k: 'u6', n: 'Six', h: 1},
  {k: 'brelan', n: 'Brelan'}, {k: 'carre', n: 'Carré'}, {k: 'full', n: 'Full'}, {k: 'petite', n: 'Petite suite'}, {k: 'grande', n: 'Grande suite'},
  {k: 'yams', n: 'Yams'}, {k: 'chance', n: 'Chance'}];
function comptes(v){ const n = [0, 0, 0, 0, 0, 0, 0]; v.forEach(x => n[x]++); return n; }
function suite(v, k){ const s = new Set(v); return [[1,2,3,4,5],[2,3,4,5,6],[1,2,3,4],[2,3,4,5],[3,4,5,6]].filter(q => q.length === k).some(q => q.every(x => s.has(x))); }
function calc(cat, v){
  const n = comptes(v), som = v.reduce((a, b) => a + b, 0), max = Math.max(...n);
  if (cat[0] === 'u') { const f = +cat[1]; return n[f] * f; }
  switch (cat){
    case 'brelan': return max >= 3 ? som : 0;
    case 'carre': return max >= 4 ? som : 0;
    case 'full': return (n.includes(3) && n.includes(2)) || max === 5 ? 25 : 0;
    case 'petite': return suite(v, 4) ? 30 : 0;
    case 'grande': return suite(v, 5) ? 40 : 0;
    case 'yams': return max === 5 ? 50 : 0;
    case 'chance': return som;
  }
  return 0;
}
function combinaison(v){
  const c = comptes(v).slice(1).sort((a, b) => b - a);
  if (c[0] === 5) return 'Yams !'; if (c[0] === 4) return 'Carré'; if (c[0] === 3 && c[1] === 2) return 'Full';
  if (suite(v, 5)) return 'Grande suite'; if (suite(v, 4)) return 'Petite suite'; if (c[0] === 3) return 'Brelan';
  if (c[0] === 2 && c[1] === 2) return 'Deux paires'; if (c[0] === 2) return 'Paire'; return 'Chance';
}
function totaux(f){
  const haut = CATS.filter(c => c.h).reduce((a, c) => a + (f[c.k] || 0), 0), bonus = haut >= 63 ? 35 : 0;
  const bas = CATS.filter(c => !c.h).reduce((a, c) => a + (f[c.k] || 0), 0);
  return {haut, bonus, bas, total: haut + bonus + bas};
}

// ---------- styles de dés ----------
const SKINS = [
  {k: 'B', n: 'Bonbons pastel', cond: 'Dès le départ', ok: () => true},
  {k: 'A', n: 'La taverne', cond: 'Finir une partie', ok: s => s.parties >= 1},
  {k: 'D', n: 'Gros pixels', cond: 'Obtenir le bonus de 35', ok: s => s.bonus >= 1},
  {k: 'C', n: 'Casino de nuit', cond: 'Inscrire un Yams', ok: s => s.nbYams >= 1},
  {k: 'F', n: 'Pique-nique', cond: 'Faire 200 points', ok: s => s.best >= 200},
  {k: 'E', n: 'Sur la Lune', cond: 'Faire 260 points', ok: s => s.best >= 260}];
const stats = () => ({parties: store.get('parties', 0), bonus: store.get('bonus', 0), nbYams: store.get('nbYams', 0), best: store.get('best', 0)});
const debloques = () => { const s = stats(); return SKINS.filter(k => k.ok(s)).map(k => k.k); };

const VALEURS = [1, 6, 2, 5, 3, 4], AXES = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]; // faces +x -x +y -y +z -z
const PTS = {1:[[.5,.5]],2:[[.27,.27],[.73,.73]],3:[[.27,.27],[.5,.5],[.73,.73]],4:[[.27,.27],[.73,.27],[.27,.73],[.73,.73]],5:[[.27,.27],[.73,.27],[.5,.5],[.27,.73],[.73,.73]],6:[[.27,.25],[.73,.25],[.27,.5],[.73,.5],[.27,.75],[.73,.75]]};
const X0 = -3, X1 = 3, Z0 = -4.6, Z1 = 2.3, ZG = 3.35; // piste de lancer, rangée des dés gardés

function face(n, fond, pt, bord, pix){
  if (pix){ // gros pixels : texture de 20 px, points de 4 px cernés de sombre pour rester lisibles
    const c = document.createElement('canvas'); c.width = c.height = 20; const g = c.getContext('2d');
    g.fillStyle = bord; g.fillRect(0, 0, 20, 20); g.fillStyle = fond; g.fillRect(1, 1, 18, 18);
    PTS[n].forEach(([x, y]) => { const px = Math.round(x * 20) - 2, py = Math.round(y * 20) - 2; g.fillStyle = '#5a0010'; g.fillRect(px - 1, py - 1, 6, 6); g.fillStyle = pt; g.fillRect(px, py, 4, 4); });
    const t = new THREE.CanvasTexture(c); t.magFilter = t.minFilter = THREE.NearestFilter; return t;
  }
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = bord; g.fillRect(0, 0, 128, 128); g.fillStyle = fond; g.beginPath(); g.roundRect ? g.roundRect(4, 4, 120, 120, 26) : g.rect(4, 4, 120, 120); g.fill();
  g.fillStyle = pt; PTS[n].forEach(([x, y]) => { g.beginPath(); g.arc(x * 128, y * 128, n === 1 ? 15 : 12, 0, 7); g.fill(); });
  const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
}
function bois(a, b){ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = a; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8; i++){ g.fillStyle = b; g.fillRect(0, i * 32, 256, 2); for (let j = 0; j < 40; j++){ g.globalAlpha = .25; g.fillRect(Math.random() * 256, i * 32 + Math.random() * 30, 30 + Math.random() * 60, 1); } g.globalAlpha = 1; }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); return t; }
function damier(a, b, n){ const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = a; g.fillRect(0, 0, 64, 64); g.fillStyle = b;
  g.globalAlpha = .85; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32); g.globalAlpha = .4; g.fillRect(0, 32, 32, 32); g.fillRect(32, 0, 32, 32);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(n, n); t.magFilter = THREE.NearestFilter; return t; }
function lune(){ const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); g.fillStyle = '#4a4c54'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++){ g.fillStyle = Math.random() < .5 ? '#3e4048' : '#575a63'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
  for (let i = 0; i < 14; i++){ const x = Math.random() * 256, y = Math.random() * 256, r = 4 + Math.random() * 16; g.fillStyle = '#383a41'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    g.strokeStyle = '#666a74'; g.lineWidth = 2; g.beginPath(); g.arc(x - 1, y - 1, r, Math.PI * .9, Math.PI * 1.7); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); return t; }
const ombre = (d, n) => { d.castShadow = true; Object.assign(d.shadow.camera, {left: -7, right: 7, top: 7, bottom: -7}); d.shadow.mapSize.set(n, n); return d; };

const STYLES = {
  A: {geste: 'gobelet', son: 'bois', ui: ['#1a100a', 'rgba(40,22,10,.94)', '#ffd08a', '#c9a070', '#8a4a1c', '#ffe3b8', '#4a2408', '#ffb347', 'rgba(255,208,138,.2)', '6px'],
      table: () => new THREE.MeshStandardMaterial({map: bois('#6b3f1e', '#4a2a12'), roughness: .8}), piste: 0x7a2f1c, bord: 0x3d230f, garde: 0x5a3418,
      des: () => Array(5).fill(['#efe4c8', '#3a2414', '#cbbd9c']), mat: {roughness: .55},
      lumieres(s){ s.add(new THREE.AmbientLight(0x553322, .7)); const l = new THREE.PointLight(0xffb060, 1.6, 40, 1.5); l.position.set(-2.6, 5, -1); l.castShadow = true; l.shadow.mapSize.set(512, 512); s.add(l);
        const b = new THREE.Mesh(new THREE.CylinderGeometry(.22, .25, 1, 12), new THREE.MeshStandardMaterial({color: 0xf2e6c9, emissive: 0x332211})); b.position.set(-3.6, .5, -4.4); s.add(b);
        const f = new THREE.Mesh(new THREE.SphereGeometry(.12, 8, 8), new THREE.MeshBasicMaterial({color: 0xffd27a})); f.scale.y = 1.8; f.position.set(-3.6, 1.15, -4.4); s.add(f);
        return t => { l.intensity = 1.5 + Math.sin(t * 9) * .12 + Math.sin(t * 23) * .08; f.scale.y = 1.8 + Math.sin(t * 17) * .2; }; }},
  B: {geste: 'glisser', son: 'plastique', ui: ['#f6e1f3', 'rgba(255,255,255,.92)', '#6b4a7a', '#9a7fa8', '#b48ad4', '#fff', '#8a62ad', '#e0559a', 'rgba(107,74,122,.18)', '14px'],
      table: () => new THREE.MeshStandardMaterial({color: 0xf3e6f7, roughness: 1}), piste: 0x9ed9b8, bord: 0xf7dcc0, garde: 0xffe9c4,
      des: () => [['#ff9ec1', '#fff', '#f07aa5'], ['#9fd8ff', '#fff', '#72bdf0'], ['#ffd36b', '#fff', '#f0b440'], ['#b9f0a6', '#fff', '#8fd67a'], ['#d2b4ff', '#fff', '#b08ef0']], mat: {roughness: .35},
      lumieres(s){ s.add(new THREE.HemisphereLight(0xffffff, 0xb8a8d8, .5)); const d = new THREE.DirectionalLight(0xffffff, .55); d.position.set(3, 10, 4); s.add(ombre(d, 1024)); return null; }},
  C: {geste: 'glisser', son: 'verre', ui: ['#070a1c', 'rgba(10,14,40,.94)', '#cfe6ff', '#7f93b8', '#ff2d87', '#fff', '#a01a58', '#7af0ff', 'rgba(122,240,255,.2)', '10px'],
      table: () => new THREE.MeshStandardMaterial({color: 0x0b1030, roughness: .9}), piste: 0x123a6b, bord: 0xc99a2e, garde: 0x0d1a3a,
      des: () => Array(5).fill(['#d8142b', '#ffffff', '#a00c1e']), mat: {roughness: .12, metalness: .1, transparent: true, opacity: .88},
      lumieres(s){ s.add(new THREE.AmbientLight(0x334466, .6)); const d = new THREE.DirectionalLight(0xffffff, .7); d.position.set(2, 10, 3); s.add(ombre(d, 1024));
        const r = new THREE.PointLight(0xff2d87, 1.4, 18); r.position.set(-4, 3, -3); s.add(r); const c = new THREE.PointLight(0x22d3ee, 1.4, 18); c.position.set(4, 3, 1); s.add(c);
        return t => { r.intensity = 1.2 + Math.sin(t * 2) * .3; c.intensity = 1.2 + Math.cos(t * 2) * .3; }; }},
  D: {geste: 'glisser', son: 'bip', pixel: true, ui: ['#1b1030', '#2a1850', '#ffffff', '#c9b8ff', '#ffe14a', '#000', '#000', '#ffe14a', 'rgba(255,255,255,.2)', '0px'],
      table: () => new THREE.MeshLambertMaterial({map: damier('#2a1850', '#33205f', 8)}), piste: 0x1f7a4a, bord: 0xe0503a, garde: 0x3b2470,
      des: () => Array(5).fill(['#ffffff', '#e8102a', '#7a8098']), mat: {flatShading: true, roughness: 1},
      lumieres(s){ s.add(new THREE.AmbientLight(0x8877bb, .75)); const d = new THREE.DirectionalLight(0xffffff, .7); d.position.set(4, 10, 5); s.add(ombre(d, 256)); return null; }},
  E: {geste: 'glisser', son: 'doux', g: -9, ui: ['#05060c', 'rgba(20,24,38,.94)', '#dfe9ff', '#8a96b0', '#2a7fd6', '#fff', '#164a80', '#7fe3ff', 'rgba(127,227,255,.2)', '8px'],
      table: () => new THREE.MeshStandardMaterial({map: lune(), roughness: 1}), piste: 0x5d606b, bord: 0xaab2c4, garde: 0x2a2e3a,
      des: () => Array(5).fill(['#f4f6fb', '#19b6ff', '#c4cede']), mat: {roughness: .4, emissive: 0x0a1a2a},
      lumieres(s){ s.add(new THREE.AmbientLight(0x667799, .35)); const d = new THREE.DirectionalLight(0xffffff, 1.1); d.position.set(-6, 7, 2); s.add(ombre(d, 1024));
        const terre = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16), new THREE.MeshStandardMaterial({color: 0x3a7bd5, emissive: 0x0d2a55})); terre.position.set(3.9, .2, -7.2); s.add(terre);
        return t => { terre.rotation.y = t * .2; }; }},
  F: {geste: 'gobelet', son: 'bois', gobelet: 0xb98a4a, ui: ['#f4ead2', 'rgba(255,250,240,.94)', '#7a3b16', '#a0704a', '#c94a3a', '#fff', '#8a2a1f', '#2f8a3a', 'rgba(122,59,22,.18)', '999px'],
      table: () => new THREE.MeshStandardMaterial({map: damier('#f6f1e8', '#d23c32', 14), roughness: .9}), piste: 0xe2c486, bord: 0xa86e34, garde: 0xd8b06a,
      des: () => Array(5).fill(['#e9c58e', '#5a3214', '#c99a5a']), mat: {roughness: .75},
      lumieres(s){ s.add(new THREE.HemisphereLight(0xfff6e0, 0x9a7a50, .6)); const d = new THREE.DirectionalLight(0xfff0d0, .8); d.position.set(5, 10, 3); s.add(ombre(d, 1024)); return null; }}
};

// ---------- sons (synthétisés) ----------
let actx = null, sonOn = store.get('son', true);
function audio(){ if (!sonOn) return null; try { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { return null; } return actx; }
let dernierClic = 0;
function clic(vol){
  const a = audio(); if (!a || vol < .05) return; const t = a.currentTime; if (t - dernierClic < .025) return; dernierClic = t;
  const g = a.createGain(); g.connect(a.destination); g.gain.setValueAtTime(Math.min(.5, vol) * .6, t); g.gain.exponentialRampToValueAtTime(.001, t + .06);
  if (st.son === 'bip'){ const o = a.createOscillator(); o.type = 'square'; o.frequency.value = 500 + Math.random() * 500; g.gain.setValueAtTime(Math.min(.5, vol) * .15, t); o.connect(g); o.start(t); o.stop(t + .05); return; }
  const n = a.createBufferSource(), b = a.createBuffer(1, a.sampleRate * .05, a.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  n.buffer = b; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2.5;
  f.frequency.value = {bois: 1300, plastique: 2800, verre: 4200, doux: 1800}[st.son] * (.85 + Math.random() * .3);
  if (st.son === 'doux') g.gain.setValueAtTime(Math.min(.5, vol) * .3, t);
  n.connect(f); f.connect(g); n.start(t);
}
function notes(liste, type){ const a = audio(); if (!a) return; liste.forEach((f, i) => { const t = a.currentTime + i * .1, o = a.createOscillator(), g = a.createGain();
  o.type = type || 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.001, t + .35); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + .4); }); }

// ---------- scène ----------
const cv = $('cv'), jeu = $('jeu');
const rendu = new THREE.WebGLRenderer({canvas: cv, antialias: true}); rendu.shadowMap.enabled = true;
const cam = new THREE.PerspectiveCamera(42, .5, .1, 100);
let st, cleStyle, scene, monde, des = [], gob = null, anime = null;
let etat = 'menu', calme = 0, tLance = 0, secoue = 0, verse = -1, rattle = 0;
let S = {tour: 0, lancers: 0, feuille: {}, vals: [1, 2, 3, 4, 5], garde: [false, false, false, false, false]};

function vider(o){ o.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) [].concat(m.material).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); }); }); }
function construire(cle){
  bouge();
  if (scene) vider(scene);
  cleStyle = cle; st = STYLES[cle];
  const r = document.documentElement.style, noms = ['--fond', '--carte', '--texte', '--doux', '--bouton', '--bt', '--ombre', '--accent', '--ligne', '--rayon'];
  noms.forEach((n, i) => r.setProperty(n, st.ui[i]));
  cv.classList.toggle('pix', !!st.pixel);
  rendu.setPixelRatio(st.pixel ? .42 : Math.min(devicePixelRatio, 2)); rendu.setClearColor(new THREE.Color(st.ui[0]));
  scene = new THREE.Scene(); anime = st.lumieres(scene);
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), st.table()); sol.rotation.x = -Math.PI / 2; sol.position.y = -.02; sol.receiveShadow = true; scene.add(sol);
  const piste = new THREE.Mesh(new THREE.PlaneGeometry(X1 - X0, Z1 - Z0), new THREE.MeshStandardMaterial({color: st.piste, roughness: .95})); piste.rotation.x = -Math.PI / 2; piste.position.set(0, 0, (Z0 + Z1) / 2); piste.receiveShadow = true; scene.add(piste);
  const mb = new THREE.MeshStandardMaterial({color: st.bord, roughness: .5, metalness: cle === 'C' ? .7 : 0});
  [[X0 - .15, (Z0 + Z1) / 2, .3, Z1 - Z0 + .6], [X1 + .15, (Z0 + Z1) / 2, .3, Z1 - Z0 + .6], [0, Z0 - .15, X1 - X0, .3], [0, Z1 + .15, X1 - X0, .3]].forEach(([x, z, w, d]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, .7, d), mb); m.position.set(x, .35, z); m.castShadow = m.receiveShadow = true; scene.add(m); });
  const gm = new THREE.Mesh(new THREE.BoxGeometry(X1 - X0 + .6, .1, 1.35), new THREE.MeshStandardMaterial({color: st.garde, roughness: .8})); gm.position.set(0, .05, ZG); gm.receiveShadow = true; scene.add(gm);
  // physique : sol et quatre murs infinis autour de la piste
  monde = new CANNON.World(); monde.gravity.set(0, st.g || -32, 0); monde.broadphase = new CANNON.NaiveBroadphase(); monde.solver.iterations = 12;
  const mDe = new CANNON.Material(), mSol = new CANNON.Material();
  monde.addContactMaterial(new CANNON.ContactMaterial(mDe, mSol, {friction: .35, restitution: .35})); monde.addContactMaterial(new CANNON.ContactMaterial(mDe, mDe, {friction: .2, restitution: .4}));
  const plan = (x, z, ax, ang) => { const b = new CANNON.Body({mass: 0, material: mSol}); b.addShape(new CANNON.Plane()); b.position.set(x, 0, z); b.quaternion.setFromAxisAngle(new CANNON.Vec3(...ax), ang); monde.addBody(b); };
  plan(0, 0, [1, 0, 0], -Math.PI / 2); plan(X0, 0, [0, 1, 0], Math.PI / 2); plan(X1, 0, [0, 1, 0], -Math.PI / 2); plan(0, Z0, [0, 1, 0], 0); plan(0, Z1, [0, 1, 0], Math.PI);
  des = st.des().map(([f, p, b], i) => {
    const mats = VALEURS.map(n => new THREE.MeshStandardMaterial(Object.assign({map: face(n, f, p, b, st.pixel)}, st.mat)));
    const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mats); m.castShadow = true; scene.add(m);
    const corps = new CANNON.Body({mass: 1, material: mDe, shape: new CANNON.Box(new CANNON.Vec3(.5, .5, .5))});
    corps.addEventListener('collide', e => { let v = 0; try { v = Math.abs(e.contact.getImpactVelocityAlongNormal()); } catch (x) { v = corps.velocity.length(); } if (etat === 'roule') clic(v / 14); });
    return {m, corps, i, cible: null};
  });
  gob = null;
  if (st.geste === 'gobelet'){
    gob = new THREE.Group(); const cuir = new THREE.MeshStandardMaterial({color: st.gobelet || 0x5a2e14, roughness: .7, side: THREE.DoubleSide});
    const c = new THREE.Mesh(new THREE.CylinderGeometry(1.15, .95, 2.2, 20, 1, true), cuir); c.castShadow = true; gob.add(c);
    const f = new THREE.Mesh(new THREE.CircleGeometry(.95, 20), cuir); f.rotation.x = Math.PI / 2; f.position.y = -1.1; gob.add(f);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(1.15, .08, 6, 24), new THREE.MeshStandardMaterial({color: 0xc9a050, metalness: .6, roughness: .4})); r2.rotation.x = Math.PI / 2; r2.position.y = 1.1; gob.add(r2);
    gob.position.set(0, 1.6, 1.2); gob.visible = false; scene.add(gob);
  }
  placerDes(); taille();
}
const enleve = b => { if (b.world) (monde.removeBody || monde.remove).call(monde, b); };
function poser(d, x, z, val){
  d.m.position.set(x, .5, z); d.m.quaternion.setFromUnitVectors(new THREE.Vector3(...AXES[VALEURS.indexOf(val)]), new THREE.Vector3(0, 1, 0)); d.m.rotateY((d.i * 37 % 10 - 5) * .03);
  d.corps.position.copy(d.m.position); d.corps.quaternion.copy(d.m.quaternion); d.corps.velocity.set(0, 0, 0); d.corps.angularVelocity.set(0, 0, 0);
}
function placerDes(){ // remet les dés d'après S (valeurs, dés gardés)
  bouge();
  let g = 0, l = 0;
  des.forEach((d, i) => { enleve(d.corps); d.cible = null; d.m.visible = true;
    if (S.garde[i]){ poser(d, -2.4 + g * 1.2, ZG, S.vals[i]); d.m.position.y = .6; g++; }
    else { poser(d, -2.2 + l * 1.1, .6, S.vals[i]); monde.addBody(d.corps); l++; } });
}
const valeur = d => { let best = -2, v = 1; AXES.forEach((a, i) => { const y = new THREE.Vector3(...a).applyQuaternion(d.m.quaternion).y; if (y > best){ best = y; v = VALEURS[i]; } }); return v; };
const penche = d => Math.max(...AXES.map(a => new THREE.Vector3(...a).applyQuaternion(d.m.quaternion).y)) < .95;

function taille(){
  bouge();
  const r = jeu.getBoundingClientRect(); if (!r.width) return;
  rendu.setSize(r.width, r.height, false); cam.aspect = r.width / r.height; cam.fov = 40;
  // recule la caméra pour que la piste (7 de large) tienne dans la largeur, avec la place du haut et du bas
  const hf = Math.atan(Math.tan(cam.fov * Math.PI / 360) * cam.aspect), dist = Math.max(13.5, 3.7 / Math.tan(hf));
  const dir = new THREE.Vector3(0, 13.5, 6.2).normalize(); cam.position.copy(dir.multiplyScalar(dist)); cam.position.z -= .3; cam.lookAt(0, 0, -.5);
  cam.updateProjectionMatrix();
}
addEventListener('resize', taille);

// ---------- partie ----------
function sauver(){ store.set('partie', S); }
function nouvellePartie(){ S = {tour: 0, lancers: 0, feuille: {}, vals: [1, 2, 3, 4, 5].map(() => 1 + Math.floor(Math.random() * 6)), garde: [false, false, false, false, false]}; sauver(); entrer(); }
function reprendre(){ const p = store.get('partie', null); if (!p) return nouvellePartie(); S = p; entrer(); }
function entrer(){ etat = 'pret'; ['titre', 'fin', 'ecranStyles', 'ecranRegles'].forEach(id => $(id).hidden = true); ['hud', 'aide', 'barre'].forEach(id => $(id).hidden = false);
  $('combi').textContent = S.lancers ? combinaison(S.vals) : ''; placerDes(); maj(); if (S.lancers >= 3) ouvrirFeuille(); }
function accueil(){ etat = 'menu'; ['hud', 'aide', 'barre', 'feuille', 'fin', 'ecranStyles', 'ecranRegles'].forEach(id => $(id).hidden = true); $('titre').hidden = false; majTitre(); }
function maj(){
  const t = totaux(S.feuille);
  $('tour').textContent = 'Tour ' + Math.min(13, S.tour + 1) + '/13'; $('total').textContent = t.total + (t.total > 1 ? ' pts' : ' pt');
  const reste = 3 - S.lancers, libres = S.garde.filter(g => !g).length;
  $('bLancer').textContent = reste ? 'Lancer (' + reste + ')' : 'Plus de lancer'; $('bLancer').disabled = !reste || !libres || etat !== 'pret';
  $('bFeuille').disabled = etat !== 'pret'; $('bMenu').disabled = etat !== 'pret';
  $('aide').textContent = etat === 'roule' ? '' : S.lancers === 0 ? (st.geste === 'gobelet' ? 'Garde le doigt sur la piste pour secouer le gobelet, puis lâche' : 'Glisse le doigt vers le haut pour lancer les dés')
    : S.lancers < 3 ? 'Touche un dé pour le garder, puis relance ou ouvre la feuille' : 'Choisis une case de la feuille';
}
function lance(force, dx){
  const libres = des.filter(d => !S.garde[d.i]); if (!libres.length || S.lancers >= 3) return;
  S.lancers++; etat = 'roule'; calme = 0; tLance = performance.now(); $('combi').textContent = ''; $('feuille').hidden = true;
  libres.forEach((d, k) => { enleve(d.corps); d.m.visible = true; const x = (k - (libres.length - 1) / 2) * 1.15 + (gob ? 0 : dx * .3);
    d.corps.position.set(Math.max(X0 + .6, Math.min(X1 - .6, x)), gob ? 2.2 : 1.2, (gob ? 1.0 : 1.6) - (k % 2) * .5);
    d.corps.quaternion.setFromEuler(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    d.corps.velocity.set(dx * 1.5 + (Math.random() - .5) * 3, gob ? 1 : 2.5, -force * (.85 + Math.random() * .3));
    d.corps.angularVelocity.set((Math.random() - .5) * 30, (Math.random() - .5) * 30, (Math.random() - .5) * 30); monde.addBody(d.corps); });
  maj();
}
function arrete(){ // les dés sont immobiles : on lit les faces
  bouge();
  etat = 'pret'; S.vals = des.map(valeur); sauver();
  const c = combinaison(S.vals); $('combi').textContent = c; $('combi').classList.add('pop'); setTimeout(() => $('combi').classList.remove('pop'), 220);
  if (c === 'Yams !') notes([523, 659, 784, 1047]);
  maj(); if (S.lancers >= 3) ouvrirFeuille();
}
function bascule(d){
  if (S.lancers === 0 || S.lancers >= 3) return;
  S.garde[d.i] = !S.garde[d.i]; clic(.3);
  if (S.garde[d.i]) enleve(d.corps);
  else { const n = des.filter(x => !S.garde[x.i] && x !== d).length; d.cible = null; d.m.position.set(-2.2 + Math.min(4, n) * 1.1, .5, .9);
    d.corps.position.copy(d.m.position); d.corps.quaternion.copy(d.m.quaternion); d.corps.velocity.set(0, 0, 0); d.corps.angularVelocity.set(0, 0, 0); monde.addBody(d.corps); }
  des.filter(x => S.garde[x.i]).forEach((x, k) => x.cible = new THREE.Vector3(-2.4 + k * 1.2, .6, ZG));
  sauver(); maj();
}

// ---------- feuille de marque ----------
let choix = null;
function ouvrirFeuille(){ if (etat !== 'pret') return; choix = null; dessinFeuille(); $('feuille').hidden = false; $('barre').hidden = true; $('aide').hidden = true; }
function fermerFeuille(){ $('feuille').hidden = true; $('barre').hidden = false; $('aide').hidden = false; maj(); }
function dessinFeuille(){
  const f = S.feuille, t = totaux(f), peut = S.lancers > 0;
  const ligne = c => {
    if (f[c.k] != null) return `<div class="case pleine"><span>${c.n}</span><b>${f[c.k]}</b></div>`;
    if (!peut) return `<div class="case"><span>${c.n}</span><b>–</b></div>`;
    const v = calc(c.k, S.vals); return `<div class="case libre${v ? '' : ' zero'}${choix === c.k ? ' choisie' : ''}" data-k="${c.k}"><span>${c.n}</span><b>${v}</b></div>`;
  };
  $('colHaut').innerHTML = CATS.filter(c => c.h).map(ligne).join('') + `<div class="case somme"><span>Bonus (${t.haut}/63)</span><b>${t.bonus || '–'}</b></div>`;
  $('colBas').innerHTML = CATS.filter(c => !c.h).map(ligne).join('') + `<div class="case somme"><span>Total</span><b>${t.total}</b></div>`;
  document.querySelectorAll('#feuille .libre').forEach(e => e.onclick = () => { choix = e.dataset.k; clic(.2); dessinFeuille(); });
  const b = $('bInscrire'); b.disabled = !choix;
  b.textContent = choix ? 'Inscrire ' + calc(choix, S.vals) + ' en ' + CATS.find(c => c.k === choix).n : (peut ? 'Choisis une case' : 'Lance d\'abord les dés');
  $('bFermer').disabled = S.lancers >= 3;
}
function inscrire(k){
  if (S.feuille[k] != null || !S.lancers) return;
  const avant = debloques(), v = calc(k, S.vals); S.feuille[k] = v;
  if (k === 'yams' && v === 50) store.set('nbYams', store.get('nbYams', 0) + 1);
  notes(v ? [660, 880] : [330]); nouveauxStyles(avant);
  S.tour++; S.lancers = 0; S.garde = [false, false, false, false, false]; sauver();
  fermerFeuille(); $('combi').textContent = '';
  if (S.tour >= 13) return finPartie();
  placerDes(); maj();
}
function nouveauxStyles(avant){ const n = debloques().filter(k => !avant.includes(k)); n.forEach((k, i) => setTimeout(() => toast('Nouveau style : ' + SKINS.find(s => s.k === k).n), 600 + i * 2200)); return n; }
let tToast = 0;
function toast(m){ $('toast').textContent = m; $('toast').classList.add('vu'); notes([784, 988, 1175]); clearTimeout(tToast); tToast = setTimeout(() => $('toast').classList.remove('vu'), 2000); }

function finPartie(){
  etat = 'fin'; const t = totaux(S.feuille), avant = debloques(), best = store.get('best', 0);
  store.set('parties', store.get('parties', 0) + 1); if (t.bonus) store.set('bonus', store.get('bonus', 0) + 1);
  if (t.total > best) store.set('best', t.total);
  store.del('partie');
  const nv = debloques().filter(k => !avant.includes(k));
  ['hud', 'aide', 'barre', 'feuille'].forEach(id => $(id).hidden = true); $('fin').hidden = false;
  $('finScore').textContent = t.total + ' pts';
  $('finRecord').innerHTML = t.total > best ? '<b>Nouveau record !</b>' : 'Record : ' + best + ' pts';
  $('finDetail').textContent = 'Haut ' + t.haut + (t.bonus ? ' + bonus 35' : '') + ' · Bas ' + t.bas;
  $('finStyles').innerHTML = nv.length ? '<b>Nouveau style : ' + nv.map(k => SKINS.find(s => s.k === k).n).join(', ') + '</b>' : '';
  $('finRang').textContent = '';
  notes(t.total > best ? [523, 659, 784, 1047, 1319] : [523, 659, 784]);
  if (t.total > 0 && window.LudoScores) LudoScores.submit('yams', 'best', t.total, false).then(r => { if (r) $('finRang').textContent = 'Classement : ' + LudoScores.rankText(r); });
}

// ---------- menus ----------
function majTitre(){
  const p = store.get('partie', null), b = store.get('best', 0), n = store.get('parties', 0);
  $('bReprendre').hidden = !p; if (p) $('bReprendre').textContent = 'REPRENDRE (TOUR ' + Math.min(13, p.tour + 1) + '/13)';
  $('recordTitre').textContent = b ? 'Record : ' + b + ' pts · ' + n + (n > 1 ? ' parties' : ' partie') : 'Aucune partie pour l\'instant';
  $('bSon').textContent = 'SON : ' + (sonOn ? 'OUI' : 'NON');
}
function listeStyles(){
  const ok = debloques();
  $('listeStyles').innerHTML = SKINS.map(k => { const s = STYLES[k.k], d = s.des()[0], o = ok.includes(k.k);
    return `<div class="style${k.k === cleStyle ? ' actif' : ''}${o ? '' : ' ferme'}" data-k="${k.k}"><span class="pastille" style="background:${d[0]};border:3px solid ${d[1]}"></span>${o ? k.n : '???'}<small>${o ? (k.k === cleStyle ? 'Choisi' : 'Toucher pour choisir') : '🔒 ' + k.cond}</small></div>`; }).join('');
  document.querySelectorAll('#listeStyles .style').forEach(e => e.onclick = () => { if (!debloques().includes(e.dataset.k) || e.dataset.k === cleStyle) return; store.set('skin', e.dataset.k); construire(e.dataset.k); listeStyles(); });
}

$('bJouer').onclick = () => { audio(); nouvellePartie(); };
$('bReprendre').onclick = () => { audio(); reprendre(); };
$('bRejouer').onclick = () => { audio(); nouvellePartie(); };
$('bAccueil').onclick = accueil;
$('bMenu').onclick = () => { if (etat === 'pret'){ sauver(); accueil(); } }; // la partie reste sauvegardée : REPRENDRE sur l'écran titre
$('bStyles').onclick = () => { $('titre').hidden = true; listeStyles(); $('ecranStyles').hidden = false; };
$('bStylesOk').onclick = () => { $('ecranStyles').hidden = true; $('titre').hidden = false; };
$('bRegles').onclick = () => { $('titre').hidden = true; $('ecranRegles').hidden = false; };
$('bReglesOk').onclick = () => { $('ecranRegles').hidden = true; $('titre').hidden = false; };
$('bSon').onclick = () => { sonOn = !sonOn; store.set('son', sonOn); majTitre(); };
$('bFeuille').onclick = ouvrirFeuille;
$('bFermer').onclick = fermerFeuille;
$('bInscrire').onclick = () => { if (choix) inscrire(choix); };
$('bLancer').onclick = () => { audio(); if (etat !== 'pret') return;
  if (gob){ commenceSecouer(); setTimeout(() => { if (etat === 'secoue'){ etat = 'verse'; verse = performance.now(); } }, 700); } else lance(14, 0); };

// ---------- gestes sur la piste ----------
const ray = new THREE.Raycaster(); let dep = null;
function deSous(e){ const r = cv.getBoundingClientRect(); ray.setFromCamera({x: (e.clientX - r.left) / r.width * 2 - 1, y: -(e.clientY - r.top) / r.height * 2 + 1}, cam);
  const h = ray.intersectObjects(des.map(d => d.m)); return h.length ? des.find(d => d.m === h[0].object) : null; }
function commenceSecouer(){ etat = 'secoue'; secoue = performance.now(); gob.visible = true; gob.rotation.set(0, 0, 0); $('feuille').hidden = true; $('combi').textContent = '';
  des.filter(d => !S.garde[d.i]).forEach(d => { d.m.visible = false; enleve(d.corps); }); }
cv.addEventListener('pointerdown', e => {
  if (etat !== 'pret' || !$('feuille').hidden) return; audio();
  dep = {x: e.clientX, y: e.clientY, t: performance.now(), de: S.lancers > 0 ? deSous(e) : null};
  if (gob && !dep.de && S.lancers < 3 && S.garde.some(g => !g)) commenceSecouer();
});
cv.addEventListener('pointerup', e => {
  if (!dep) return; const dx = e.clientX - dep.x, dy = e.clientY - dep.y, dt = Math.max(30, performance.now() - dep.t);
  if (etat === 'secoue'){ etat = 'verse'; verse = performance.now(); dep = null; return; }
  if (dep.de && Math.hypot(dx, dy) < 14 && etat === 'pret') bascule(dep.de);
  else if (!gob && dy < -30 && etat === 'pret') lance(Math.min(22, 7 + (-dy / dt) * 9), dx / Math.max(40, -dy));
  dep = null;
});
cv.addEventListener('pointercancel', () => { dep = null; if (etat === 'secoue'){ etat = 'verse'; verse = performance.now(); } });

// ---------- boucle ----------
// au repos (dés posés, feuille ouverte…), on ne redessine pas : la batterie dure plus longtemps.
// Un toucher, un changement d'écran ou de taille réveille l'affichage un moment ; la lumière animée
// d'un style (bougie, néons) se contente alors de 20 images par seconde.
let prec = performance.now(), reveil = 0, dernier = 0;
const bouge = (ms = 800) => { reveil = Math.max(reveil, performance.now() + ms); };
['pointerdown', 'pointerup', 'click', 'keydown'].forEach(t => addEventListener(t, () => bouge(), true));
function frame(now){
  const dt = Math.min(.05, (now - prec) / 1000); prec = now;
  const actif = etat === 'secoue' || etat === 'verse' || etat === 'roule' || now < reveil
    || des.some(d => d.cible && d.m.position.distanceToSquared(d.cible) > 1e-6);
  if (!actif && !(anime && now - dernier > 50)){ requestAnimationFrame(frame); return; }
  dernier = now; if (anime) anime(now / 1000);
  if (etat === 'secoue'){ const k = (now - secoue) / 1000; gob.position.set(Math.sin(k * 38) * .25, 1.6 + Math.abs(Math.sin(k * 30)) * .2, 1.2 + Math.cos(k * 31) * .15); gob.rotation.z = Math.sin(k * 40) * .12;
    if (now - rattle > 90){ rattle = now; clic(.2 + Math.random() * .2); } }
  if (etat === 'verse'){ const k = Math.min(1, (now - verse) / 220); gob.rotation.x = -k * 1.9; gob.position.set(0, 1.6 + k * .5, 1.2 - k * .4);
    if (k >= 1){ gob.visible = false; etat = 'pret'; lance(13 + Math.min(6, (now - secoue) / 400), 0); } }
  if (etat === 'roule'){
    monde.step(1 / 60, dt, 4);
    const lent = des.every(d => S.garde[d.i] || (d.corps.velocity.length() < .08 && d.corps.angularVelocity.length() < .1)); calme = lent ? calme + 1 : 0;
    if (calme > 18 || now - tLance > 7000){
      const travers = des.find(d => !S.garde[d.i] && penche(d)); // dé resté de travers contre un bord : petite pichenette
      if (travers && now - tLance < 7000){ travers.corps.velocity.set(0, 4, 0); travers.corps.angularVelocity.set(6, 0, 4); calme = 0; }
      else { des.forEach(d => { if (!S.garde[d.i] && penche(d)){ d.m.position.copy(d.corps.position); d.m.quaternion.copy(d.corps.quaternion); } }); arrete(); }
    }
  }
  des.forEach(d => { if (d.cible) d.m.position.lerp(d.cible, Math.min(1, dt * 10)); else if (d.corps.world && etat !== 'secoue'){ d.m.position.copy(d.corps.position); d.m.quaternion.copy(d.corps.quaternion); } });
  rendu.render(scene, cam); requestAnimationFrame(frame);
}

// pour les tests : forcer les valeurs des dés comme si un lancer venait de s'arrêter
function forcer(vals){ S.vals = vals.slice(); S.lancers = Math.max(1, S.lancers); etat = 'pret'; placerDes(); arrete(); }

const choisi = store.get('skin', 'B');
construire(debloques().includes(choisi) ? choisi : 'B');
majTitre(); new ResizeObserver(taille).observe(jeu); taille();
requestAnimationFrame(frame);
window.Yams = {get S(){ return S; }, CATS, calc, totaux, combinaison, construire, nouvellePartie, inscrire, forcer, lance, finPartie, accueil, debloques, etat: () => etat};

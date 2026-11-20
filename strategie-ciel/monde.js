/* =====================================================================
   STRATEGIE SPATIALE (nom provisoire) · le MONDE : rendu Three.js r128, système SOL-7
   (étoile au centre, planètes Deep-Fold en orbite, ceinture d'astéroïdes et gisements de cristal,
   portes des routes spatiales), modèles des vaisseaux (repris de Ciel de guerre), traçantes, explosions.
   Repris de la maquette 5 (maquettes/strategie-ciel-source.html). Cahier des charges : specs/strategie-ciel.md
   ===================================================================== */
'use strict';
// ---------- hasard réglable et bruit (repris de Ciel de guerre) ----------
let graine = 7; const rnd = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
function bruit(seed){ const P = new Uint8Array(512); let s = seed; for (let i = 0; i < 256; i++) P[i] = i; for (let i = 255; i > 0; i--){ s = (s * 16807) % 2147483647; const j = s % (i + 1); [P[i], P[j]] = [P[j], P[i]]; } for (let i = 0; i < 256; i++) P[i + 256] = P[i];
  const g = (x, y) => P[P[x & 255] + (y & 255)] / 255, f = t => t * t * (3 - 2 * t);
  return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = f(x - xi), yf = f(y - yi), a = g(xi, yi), b = g(xi + 1, yi), c = g(xi, yi + 1), d = g(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; }; }
const N2 = bruit(37); const fbm = (n, x, y, o = 5) => { let v = 0, a = .5, f = 1; for (let i = 0; i < o; i++){ v += a * n(x * f, y * f); a *= .5; f *= 2; } return v; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ---------- rendu ----------
const ECRAN = document.getElementById('t');
const R = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const TACTILE = !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
R.setPixelRatio(Math.min(window.devicePixelRatio || 1, TACTILE ? 1.5 : 2));
ECRAN.insertBefore(R.domElement, ECRAN.firstChild);
const sc = new THREE.Scene(); sc.fog = new THREE.Fog('#0b0a1e', 2000, 9000);
const cam = new THREE.PerspectiveCamera(32, 1, 5, 16000);
sc.add(new THREE.HemisphereLight('#b8c0ff', '#1a1428', .7), new THREE.AmbientLight('#ffffff', .22));
const soleil = new THREE.DirectionalLight('#fff0e0', 1.1); sc.add(soleil);
{ const l = new THREE.PointLight('#ffe6c0', 1.1, 0); sc.add(l); }
function redim(){ const w = ECRAN.clientWidth, h = ECRAN.clientHeight; R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }

// ---------- fond étoilé (sphère qui suit la caméra) ----------
const fondCv = document.createElement('canvas'); fondCv.width = 2048; fondCv.height = 1024;
{ const x = fondCv.getContext('2d'); x.fillStyle = '#07061a'; x.fillRect(0, 0, 2048, 1024);
  for (const [cx, cy, r, c] of [[600, 420, 520, 'rgba(120,60,170,.38)'], [1300, 560, 600, 'rgba(40,90,170,.32)'], [1700, 300, 380, 'rgba(190,70,110,.24)'], [300, 700, 400, 'rgba(60,120,160,.22)']]){
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 2048, 1024); }
  graine = 99; for (let i = 0; i < 3000; i++){ const b = rnd(); x.fillStyle = `rgba(255,${230 + b * 25 | 0},${220 + b * 35 | 0},${.3 + b * .7})`; const t = b > .97 ? 2 : 1; x.fillRect(rnd() * 2048 | 0, rnd() * 1024 | 0, t, t); } }
const fondEsp = new THREE.Mesh(new THREE.SphereGeometry(12000, 32, 16), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fondCv), side: THREE.BackSide, fog: false, depthWrite: false }));
fondEsp.renderOrder = -1; sc.add(fondEsp);
const tex2d = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return new THREE.CanvasTexture(c); };
const lueurTex = tex2d(64, 64, x => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,240,200,1)'); g.addColorStop(.3, 'rgba(255,200,120,.5)'); g.addColorStop(1, 'rgba(255,150,60,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
const eclTex = tex2d(32, 32, x => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(.35, 'rgba(255,190,90,.9)'); g.addColorStop(1, 'rgba(255,90,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); });

// ---------- le système SOL-7 : l'étoile au centre ----------
const SYS = { nom: 'SOL-7', ceinture: [1750, 2550] };
const DFOK = !!window.PlanetesDF, DF_PX = TACTILE ? 64 : 100;
const teinteDF = h => k => ({ colors: (k.p.colors || []).map(c => { const t = new THREE.Color(c[0], c[1], c[2]), o = {}; t.getHSL(o); t.setHSL(h, Math.min(1, o.s * 1.1 + .15), o.l); return [t.r, t.g, t.b, c[3]]; }) });
const texNet = t => { t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t; };
const ETOILE = { r: 380, g: new THREE.Group() }; ETOILE.g.position.set(0, -150, 0); sc.add(ETOILE.g);
{ const l = new THREE.Sprite(new THREE.SpriteMaterial({ map: lueurTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); l.scale.setScalar(ETOILE.r * 5); ETOILE.g.add(l); }
if (DFOK){ ETOILE.df = new PlanetesDF.Planete('Star', DF_PX, { couleurs: teinteDF(.1) }); ETOILE.ct = texNet(new THREE.CanvasTexture(ETOILE.df.canvas));
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ETOILE.ct, transparent: true, fog: false })); s.scale.setScalar(2 * ETOILE.r * ETOILE.df.taille / DF_PX); ETOILE.g.add(s); }
else ETOILE.g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(ETOILE.r, 3), new THREE.MeshBasicMaterial({ color: '#ffd27a' })));
soleil.position.set(0, 700, 0); // la lumière vient de l'étoile (la cible du soleil reste au centre : on la déplace avec la caméra)

// ---------- planètes en orbite (décor de la session 1 ; GAIA est la colonie du joueur) ----------
const PLANETES = [{ t: 'terre', nom: 'GAIA', r: 210, orb: 1300, ang: .62, camp: 0 }, { t: 'lave', nom: 'BRASIER', r: 130, orb: 780, ang: 2.1 }, { t: 'desert', nom: 'DUNE', r: 170, orb: 3000, ang: .2, riche: 1 },
  { t: 'gaz', nom: 'TITAN', r: 360, orb: 3700, ang: 1.25 }, { t: 'glace', nom: 'BOREA', r: 160, orb: 4400, ang: .9, riche: 1 }, { t: 'roche', nom: 'ECHO', r: 80, orb: 640, ang: 0, autour: 'TITAN' }];
const PLN = {}, DF_T = { terre: 'LandMasses', lave: 'LavaWorld', glace: 'IceWorld', gaz: 'GasPlanetLayers', desert: 'DryTerran', roche: 'NoAtmosphere' };
const COUL_PLA = { terre: '#3a7ab8', lave: '#c84a2a', glace: '#d8e8f0', gaz: '#c89a60', desert: '#c8a060', roche: '#8a8a90' }, COUL_CAMP = ['#5ab0ff', '#ff5a4a', '#f0e4d0'];
const orbite = r => { const p = []; for (let i = 0; i <= 160; i++){ const a = i / 160 * 6.283; p.push(V3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({ color: '#9aa0d8', transparent: true, opacity: .2, depthWrite: false, fog: false })); };
function station(camp){ const g = new THREE.Group(), gris = new THREE.MeshPhongMaterial({ color: '#a8a4b8', flatShading: true }), coul = new THREE.MeshPhongMaterial({ color: COUL_CAMP[camp], emissive: COUL_CAMP[camp], emissiveIntensity: .6, flatShading: true });
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(10, 14, 60, 8), gris)); const a = new THREE.Mesh(new THREE.TorusGeometry(48, 5, 6, 20), gris); a.rotation.x = Math.PI / 2; g.add(a);
  for (let i = 0; i < 4; i++){ const b = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 48), gris); b.rotation.y = i * Math.PI / 2; b.position.set(Math.sin(i * Math.PI / 2) * 24, 0, Math.cos(i * Math.PI / 2) * 24); g.add(b); }
  for (let i = 0; i < 2; i++){ const q = new THREE.Mesh(new THREE.BoxGeometry(64, 2, 24), new THREE.MeshPhongMaterial({ color: '#2a3a6a', emissive: '#14204a', flatShading: true })); q.position.set(i ? 82 : -82, 22, 0); g.add(q); }
  const t = new THREE.Mesh(new THREE.ConeGeometry(10, 16, 8), coul); t.position.y = 38; g.add(t); g.scale.setScalar(1.4); return g; }
PLANETES.forEach((P, i) => { PLN[P.nom] = P; P.w = .004 * Math.pow(1300 / P.orb, 1.5) * (P.autour ? 6 : 1); P.g = new THREE.Group(); sc.add(P.g);
  if (DFOK){ P.df = new PlanetesDF.Planete(DF_T[P.t], DF_PX, { decalage: i * 37 }); P.dfT = 0; P.ct = texNet(new THREE.CanvasTexture(P.df.canvas));
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: P.ct, transparent: true })); s.scale.setScalar(2 * P.r * P.df.taille / DF_PX); P.g.add(s); }
  else P.g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(P.r, 2), new THREE.MeshPhongMaterial({ color: COUL_PLA[P.t], flatShading: true })));
  P.orbL = orbite(P.orb); sc.add(P.orbL);
  if (P.camp >= 0 || P.riche){ const rr = P.r + 90; P.an = new THREE.Mesh(new THREE.RingGeometry(rr - 8, rr, 96).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: P.camp >= 0 ? COUL_CAMP[P.camp] : '#9ff0ff', transparent: true, opacity: .5, depthTest: false, fog: false })); P.an.renderOrder = 2; sc.add(P.an); }
  if (P.camp >= 0){ P.st = station(P.camp); sc.add(P.st); } });
function placerPlanetes(){ for (const P of PLANETES){ const c = P.autour ? PLN[P.autour] : { x: 0, z: 0 }; P.x = c.x + Math.cos(P.ang) * P.orb; P.z = c.z + Math.sin(P.ang) * P.orb; P.y = -P.r * .6; P.g.position.set(P.x, P.y, P.z);
  P.orbL.position.set(c.x, 0, c.z); if (P.an) P.an.position.set(P.x, 2, P.z); } }
placerPlanetes();

// ---------- ceinture d'astéroïdes et gisements de cristal ----------
function caillou(det, amp, seed){ const g = new THREE.IcosahedronGeometry(1, det), p = g.attributes.position, v = V3();
  for (let i = 0; i < p.count; i++){ v.fromBufferAttribute(p, i); const k = Math.round(v.x * 97) * 7 + Math.round(v.y * 97) * 131 + Math.round(v.z * 97) * 1009 + seed; v.multiplyScalar(1 + amp * ((Math.sin(k * 12.9898) * 43758.5453) % 1)); p.setXYZ(i, v.x, v.y * .8, v.z); }
  g.computeVertexNormals(); return g; }
// les gisements : gros astéroïdes avec des cristaux, dans la ceinture, autour de l'endroit où commence le porte-vaisseaux
const GIS = [[.62, 2000], [.70, 2350], [.78, 1900], [.86, 2300], [.55, 2380], [.95, 2050], [1.06, 2250], [.42, 2100]].map(([a, d], i) => ({ i, p: V3(Math.cos(a) * d, 0, Math.sin(a) * d), r: 70 + (i * 37) % 40, reste: 1500, max: 1500 }));
const BASE = V3(Math.cos(.85) * 1500, 105, Math.sin(.85) * 1500); // départ du porte-vaisseaux : à l'intérieur de la ceinture, près de GAIA (gisements à 400 m et plus)
{ const N = TACTILE ? 900 : 1400, champ = new THREE.InstancedMesh(caillou(1, .35, 1), new THREE.MeshPhongMaterial({ flatShading: true, shininess: 0 }), N), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), c = new THREE.Color(); graine = 41; let n = 0;
  for (let k = 0; k < 6000 && n < N; k++){ const s = 3 + Math.pow(rnd(), 3) * 34; let P;
    if (n < N * .85){ const a = rnd() * 6.283, d = SYS.ceinture[0] + (rnd() + rnd() + rnd()) / 3 * (SYS.ceinture[1] - SYS.ceinture[0]); P = V3(Math.cos(a) * d, -160 + rnd() * 320, Math.sin(a) * d); }
    else P = V3((rnd() - .5) * 10000, -200 + rnd() * 400, (rnd() - .5) * 10000);
    if (GIS.some(G => G.p.distanceTo(P) < G.r * 2.2) || P.distanceTo(BASE) < 380) continue;
    const i = n++; e.set(rnd() * 6, rnd() * 6, rnd() * 6); q.setFromEuler(e); m.compose(P, q, V3(s, s * (.7 + rnd() * .5), s)); champ.setMatrixAt(i, m); c.set(['#5e5258', '#4e4552', '#6a5c58', '#45404e'][rnd() * 4 | 0]); champ.setColorAt(i, c); }
  champ.count = n; sc.add(champ); }
const matCristal = new THREE.MeshPhongMaterial({ color: '#aef4ff', emissive: '#3ac8ff', emissiveIntensity: .8, flatShading: true });
for (const G of GIS){ G.g = new THREE.Group(); G.g.position.copy(G.p).setY(-25); sc.add(G.g);
  const a = new THREE.Mesh(caillou(2, .22, G.r | 0), new THREE.MeshPhongMaterial({ color: '#4e4450', flatShading: true, shininess: 0 })); a.scale.set(G.r * .9, G.r * .65, G.r * .8); a.rotation.y = G.i; G.g.add(a);
  G.cr = new THREE.Group(); for (let j = 0; j < 6; j++){ const m = new THREE.Mesh(new THREE.OctahedronGeometry(6 + j % 3 * 4, 0), matCristal); m.position.set((j % 3 - 1) * 10, 4 + j * 2, (j > 2 ? 1 : -1) * 8); m.scale.y = 1.8; m.rotation.z = (j - 2) * .2; G.cr.add(m); }
  G.cr.position.y = G.r * .55; G.cr.scale.setScalar(1.3); G.g.add(G.cr);
  G.an = new THREE.Mesh(new THREE.RingGeometry(G.r * 1.6 - 5, G.r * 1.6, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#9ff0ff', transparent: true, opacity: .35, depthTest: false, fog: false })); G.an.position.copy(G.p).setY(2); G.an.renderOrder = 2; sc.add(G.an);
  G.haut = () => V3(G.p.x, -25 + G.r * .55 + 30, G.p.z); }
function majGisement(G){ const f = G.reste / G.max; G.cr.scale.setScalar(.3 + f); G.cr.visible = G.reste > 0; G.an.material.opacity = G.reste > 0 ? .15 + .3 * f : .06; }

// ---------- portes des routes spatiales ----------
const PORTES = [{ nom: 'ALTAIR', ang: .3, alerte: 1 }, { nom: 'CASTOR', ang: 3.6 }];
for (const G of PORTES){ G.p = V3(Math.cos(G.ang) * 5000, 60, Math.sin(G.ang) * 5000); G.g = new THREE.Group(); G.g.position.copy(G.p); sc.add(G.g);
  const t = new THREE.Mesh(new THREE.TorusGeometry(120, 12, 8, 32), new THREE.MeshPhongMaterial({ color: '#8a84a8', emissive: G.alerte ? '#802030' : '#302870', flatShading: true })); t.rotation.x = Math.PI / 2; G.g.add(t);
  G.s = new THREE.Sprite(new THREE.SpriteMaterial({ map: lueurTex, color: G.alerte ? '#ff6a6a' : '#a890ff', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); G.s.scale.setScalar(260); G.g.add(G.s); }

// ---------- animation du décor ; planètes Deep-Fold redessinées selon leur taille à l'écran (perf) ----------
const PERF = { df: 0 };
function majDecor(dt, dtr, enPause){
  for (const P of PLANETES) P.ang += dt * P.w; placerPlanetes();
  for (const P of PLANETES) if (P.st){ const a = TEMPS.t * .05; P.st.position.set(P.x + Math.cos(a) * (P.r + 90), 60, P.z + Math.sin(a) * (P.r + 90)); P.st.rotation.y = TEMPS.t * .2; }
  for (const G of PORTES){ G.g.rotation.y += dtr * .4; G.s.material.opacity = .6 + .4 * Math.sin(TEMPS.r * 3); }
  for (const G of GIS) G.cr.rotation.y += dt * .3;
  fondEsp.position.copy(cam.position);
  if (!DFOK) return;
  const b = ETOILE.g.position.clone().project(cam), hpx = ECRAN.clientHeight, pr = cam.projectionMatrix.elements[5];
  for (const P of PLANETES){ P.dfT -= dtr; if (P.dfT > 0) continue;
    const a = P.g.position.clone().project(cam), d = P.g.position.distanceTo(cam.position), rpx = P.r * pr / d * hpx / 2, m = rpx / hpx * 2;
    if (a.z > 1 || Math.abs(a.x) > 1 + m || Math.abs(a.y) > 1 + m){ P.dfT = .3; continue; }
    const per = rpx > 160 ? .08 : rpx > 50 ? .2 : .5; P.dfT = per;
    let dx = b.x - a.x, dy = -(b.y - a.y); const n = Math.hypot(dx, dy) || 1, lo = [.5 + dx / n * .28, .5 + dy / n * .28];
    const bouge = !P.lo || Math.abs(P.lo[0] - lo[0]) + Math.abs(P.lo[1] - lo[1]) > .02; if (enPause && !bouge) continue;
    P.lo = lo; P.df.couches.forEach(k => { k.p.light_origin = lo; }); P.df.maj(enPause ? 0 : per); P.ct.needsUpdate = true; PERF.df++; }
  ETOILE.dfT = (ETOILE.dfT || 0) - dtr; if (ETOILE.dfT <= 0){ ETOILE.dfT = .1; ETOILE.df.maj(.1); ETOILE.ct.needsUpdate = true; } }

// ---------- modèles des vaisseaux (ceux de Ciel de guerre : quantifiés, repeints pour les chasseurs polyyai) ----------
const b64 = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer; };
function dequantifie(sc0){ sc0.updateMatrixWorld(true); sc0.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position; if (!a || a.array instanceof Float32Array) return;
  const n = a.count, f = new Float32Array(n * 3), k = a.array instanceof Int16Array ? 32767 : a.array instanceof Uint16Array ? 65535 : a.array instanceof Int8Array ? 127 : 255;
  for (let i = 0; i < n; i++){ f[i * 3] = a.getX(i) / k * o.scale.x + o.position.x; f[i * 3 + 1] = a.getY(i) / k * o.scale.y + o.position.y; f[i * 3 + 2] = a.getZ(i) / k * o.scale.z + o.position.z; }
  o.geometry.setAttribute('position', new THREE.BufferAttribute(f, 3)); const u = o.geometry.attributes.uv;
  if (u && !(u.array instanceof Float32Array)){ const g = new Float32Array(u.count * 2), q = u.array instanceof Uint16Array ? 65535 : 255; for (let i = 0; i < u.count; i++){ g[i * 2] = u.getX(i) / q; g[i * 2 + 1] = u.getY(i) / q; } o.geometry.setAttribute('uv', new THREE.BufferAttribute(g, 2)); }
  o.position.set(0, 0, 0); o.scale.set(1, 1, 1); o.geometry.boundingBox = null; o.geometry.boundingSphere = null; }); }
function texRepeinte(t, h){ const im = t.image; if (!im || !im.width) return t; const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, cv.width, cv.height), A = d.data, c = new THREE.Color(), hist = new Float32Array(24), HSL = new Map();
  for (let i = 0; i < A.length; i += 4){ const k = A[i] << 16 | A[i + 1] << 8 | A[i + 2]; let o = HSL.get(k); if (!o){ o = { n: 0 }; c.setRGB(A[i] / 255, A[i + 1] / 255, A[i + 2] / 255); c.getHSL(o); HSL.set(k, o); } o.n++; }
  for (const o of HSL.values()) if (o.s > .3 && o.l > .12 && o.l < .9) hist[Math.floor(o.h * 24) % 24] += o.n;
  let hm = 0; for (let k = 1; k < 24; k++) if (hist[k] > hist[hm]) hm = k;
  for (const o of HSL.values()){ const bin = Math.floor(o.h * 24) % 24, dd = Math.min(Math.abs(bin - hm), 24 - Math.abs(bin - hm));
    if (o.s > .3 && o.l > .12 && o.l < .9 && dd > 2) c.setHSL(h, .68, Math.min(.6, Math.max(.42, o.l))); else if (o.s > .3 && dd <= 2) c.setHSL(h, .22, Math.min(.62, .2 + o.l * .7)); else c.setHSL(0, 0, Math.min(.8, .18 + o.l * .75)); o.r = c.r * 255; o.g = c.g * 255; o.b = c.b * 255; }
  for (let i = 0; i < A.length; i += 4){ const o = HSL.get(A[i] << 16 | A[i + 1] << 8 | A[i + 2]); A[i] = o.r; A[i + 1] = o.g; A[i + 2] = o.b; }
  x.putImageData(d, 0, 0); const n = texNet(new THREE.CanvasTexture(cv)); n.flipY = t.flipY; n.wrapS = t.wrapS; n.wrapT = t.wrapT; return n; }
function teinte(c, h){ const o = {}; c.getHSL(o); if (o.s > .3 && o.l > .12 && o.l < .9) c.setHSL(h, .62, Math.min(.62, Math.max(.4, o.l))); else c.setHSL(0, 0, Math.min(.82, o.l * .95 + .04)); }
function repeint(sc0, h){ const s = sc0.clone(); s.traverse(o => { if (!o.isMesh) return; const mm = Array.isArray(o.material) ? o.material : [o.material];
  const n = mm.map(m => { const r = m.clone(); if (m.map) r.map = texRepeinte(m.map, h); else { r.color = m.color.clone(); teinte(r.color, h); } return r; }); o.material = Array.isArray(o.material) ? n : n[0]; }); return s; }
const MOD = {};
function prepare(k, s){ dequantifie(s); s.traverse(o => { if (!o.isMesh) return; const mm = Array.isArray(o.material) ? o.material : [o.material];
  const n = mm.map(m => { if (m.map){ m.map.encoding = THREE.LinearEncoding; if (m.map.image && m.map.image.height <= 4) texNet(m.map); } return new THREE.MeshPhongMaterial({ color: m.color, map: m.map || null, vertexColors: !!m.vertexColors, flatShading: true, shininess: 0, specular: 0, side: THREE.DoubleSide }); });
  o.material = Array.isArray(o.material) ? n : n[0]; });
  MOD[k] = s; if (k.startsWith('py')){ MOD[k + '_b'] = repeint(s, .6); MOD[k + '_r'] = repeint(s, 0); } }
function charger(k){ return new Promise(ok => { const L = new THREE.GLTFLoader(), fin = g => { try { prepare(k, g.scene); } catch (e){ console.warn(k, e); } ok(); }, err = e => { console.warn(k, e); ok(); };
  if (window.SC_B64 && window.SC_B64[k]) L.parse(b64(window.SC_B64[k]), '', fin, err); else L.load('../ciel-de-guerre/modeles/' + k + '.glb', fin, undefined, err); }); }
const MODELES = ['fga_croiseur1', 'fga_destroyer2', 'fga_destroyer1', 'fga_fregate1_r', 'fga_corvette1_r', 'py2', 'py13', 'py16', 'py35']; // chasseur, chasseur rouge, collecteur, bombardier : silhouettes et tailles bien différentes (planche du 20/11)
// un vaisseau : groupe dont l'avant regarde vers -z, de longueur L
function importe(k, rot, L){ const g = new THREE.Group(), piv = new THREE.Group(); g.add(piv);
  const m = MOD[k] ? MOD[k].clone() : new THREE.Mesh(new THREE.ConeGeometry(.3, 1, 5).rotateX(-Math.PI / 2), new THREE.MeshPhongMaterial({ color: k.endsWith('_r') ? '#c84a3a' : '#5a8ac8' })); piv.add(m); piv.rotation.y = rot;
  const s = new THREE.Box3().setFromObject(piv).getSize(V3()); piv.scale.setScalar(L / Math.max(s.x, s.z)); const c = new THREE.Box3().setFromObject(piv).getCenter(V3()); piv.position.sub(c); g.rotation.order = 'YXZ'; return g; }

// ---------- traçantes (un seul tracé pour toutes) et éclairs d'impact ----------
const NT = 400, tp = new Float32Array(NT * 6), tc = new Float32Array(NT * 6), TR = []; const tg = new THREE.BufferGeometry();
tg.setAttribute('position', new THREE.BufferAttribute(tp, 3)); tg.setAttribute('color', new THREE.BufferAttribute(tc, 3));
{ const l = new THREE.LineSegments(tg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: .95, fog: false })); l.frustumCulled = false; sc.add(l); }
for (let i = 0; i < NT; i++) TR.push({ t: -1 });
const CB = new THREE.Color('#9fe0ff'), CR = new THREE.Color('#ff8a5a');
function tir(a, b, camp, lg, v){ const t = TR.find(x => x.t < 0); if (!t) return; t.a = a.clone(); t.d = b.clone().sub(a); t.len = t.d.length(); t.d.normalize(); t.t = 0; t.lg = lg; t.v = v; t.c = camp ? CR : CB; t.cible = b.clone(); }
const ECL = []; for (let i = 0; i < 50; i++){ const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: eclTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false })); s.visible = false; sc.add(s); ECL.push({ s, t: 9 }); }
function eclat(p, taille){ const e = ECL.find(x => x.t >= 1) || ECL[0]; e.t = 0; e.taille = taille; e.s.position.copy(p); e.s.visible = true; }
function explosion(p, L){ eclat(p, L * 1.4); for (let i = 0; i < Math.min(8, 2 + L / 30); i++) setTimeout(() => eclat(p.clone().add(V3((Math.random() - .5) * L * .6, (Math.random() - .5) * L * .2, (Math.random() - .5) * L * .6)), L * .6), i * 90); }
function majTirs(dt){ let n = 0;
  for (const x of TR){ if (x.t < 0){ tp.fill(0, n * 6, n * 6 + 6); n++; continue; } x.t += dt; const s = x.t * x.v;
    if (s > x.len){ x.t = -1; eclat(x.cible, x.lg > 20 ? 24 : 10); tp.fill(0, n * 6, n * 6 + 6); n++; continue; }
    const a = x.a.clone().addScaledVector(x.d, s), b = x.a.clone().addScaledVector(x.d, Math.max(0, s - x.lg * 2)); tp.set([a.x, a.y, a.z, b.x, b.y, b.z], n * 6); tc.set([x.c.r, x.c.g, x.c.b, x.c.r, x.c.g, x.c.b], n * 6); n++; }
  tg.attributes.position.needsUpdate = tg.attributes.color.needsUpdate = true;
  for (const e of ECL){ if (e.t >= 1){ e.s.visible = false; continue; } e.t += dt * 3.5; e.s.scale.setScalar(e.taille * (.4 + e.t)); e.s.material.opacity = 1 - e.t; } }

// ---------- marques au sol : anneaux de sélection et points d'ordre ----------
const matSel = [new THREE.MeshBasicMaterial({ color: '#7fe08a', transparent: true, opacity: .9, depthTest: false, fog: false }), new THREE.MeshBasicMaterial({ color: '#ffd060', transparent: true, opacity: .9, depthTest: false, fog: false }), new THREE.MeshBasicMaterial({ color: '#ff6a50', transparent: true, opacity: .9, depthTest: false, fog: false })];
const geoAnneau = new THREE.RingGeometry(.86, 1, 32).rotateX(-Math.PI / 2);
const PINGS = []; for (let i = 0; i < 6; i++){ const m = new THREE.Mesh(geoAnneau, new THREE.MeshBasicMaterial({ color: '#9fe0ff', transparent: true, depthTest: false, fog: false })); m.renderOrder = 4; m.visible = false; sc.add(m); PINGS.push({ m, t: 9 }); }
function ping(p, rouge){ const q = PINGS.find(x => x.t >= 1) || PINGS[0]; q.t = 0; q.m.position.copy(p); q.m.material.color.set(rouge ? '#ff7a5a' : rouge === 0 ? '#9ff0ff' : '#7fe08a'); q.m.visible = true; }
function majPings(dt){ for (const q of PINGS){ if (q.t >= 1){ q.m.visible = false; continue; } q.t += dt * 1.6; q.m.scale.setScalar(20 + q.t * 50); q.m.material.opacity = 1 - q.t; } }

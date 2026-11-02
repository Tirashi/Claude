/* =====================================================================
   DRAGON SIMULATOR · le MONDE en 3D (Three.js r128) : scène, modèles,
   dragon, décor, particules, caméra de profil, textes flottants.
   Il ne décide de rien : il montre la partie des règles (regles.js).
   Chaque objet des règles a un id ; le monde lui associe un modèle,
   le crée quand il apparaît et le retire quand les règles l'oublient.
   La décoration (immeubles du fond, trottoir, arbres) est tirée ici,
   avec Math.random : elle ne compte pas dans les règles.
   Expose window.DsMonde (classe) et DsMonde.charger().
   Repris de la maquette maquettes/dragon-simulator.html.
   ===================================================================== */
'use strict';
(function () {
  const U = DS_U, GY = DS_SOL;
  const x3 = px => px / U, y3 = py => (GY - py) / U;
  const rnd = (a, b) => a + Math.random() * (b - a), ri = (a, b) => Math.floor(rnd(a, b + 1)), cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const FEU = [0xfff3a0, 0xffd23a, 0xff8a2a, 0xff4a1a];
  const COUL_DRAGON = { Main: '#c23a3a', Wings: '#4a2436', Belly: '#f2c040', Eyes: '#141414', Claws: '#2a2a2a' };
  const COUL_BEBE = { Main: '#ee8a2a', Wings: '#a8402a', Belly: '#ffe08a', Eyes: '#141414', Claws: '#2a2a2a' };
  const COUL_CHAUVE = { Main: '#5a3a8a', Wings: '#2a1838', Belly: '#e8c050', Eyes: '#141414', Claws: '#2a2a2a', Ears: '#5a3a8a', Nose: '#e07090' };

  /* ---------- géométries et matériaux partagés ---------- */
  const GEO = {}, MAT = {};
  const geo = (k, f) => GEO[k] || (GEO[k] = f());
  const lin = c => new THREE.Color(c).convertSRGBToLinear();
  const mat = (c, o) => { const k = c + '|' + (o ? JSON.stringify(o) : ''); if (MAT[k]) return MAT[k]; const oo = Object.assign({}, o || {}); if (oo.emissive !== undefined) oo.emissive = lin(oo.emissive); return MAT[k] = new THREE.MeshLambertMaterial(Object.assign({ color: lin(c) }, oo)); };
  const basique = (c, o) => { const k = 'b' + c + '|' + (o ? JSON.stringify(o) : ''); return MAT[k] || (MAT[k] = new THREE.MeshBasicMaterial(Object.assign({ color: c }, o || {}))); };
  function boite(w, h, d, c, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo(`b${w}_${h}_${d}`, () => new THREE.BoxGeometry(w, h, d)), mat(c)); m.position.set(x, y, z); return m; }
  function cyl(r1, r2, h, n, c, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo(`c${r1}_${r2}_${h}_${n}`, () => new THREE.CylinderGeometry(r1, r2, h, n)), mat(c)); m.position.set(x, y, z); return m; }
  function boule(r, c, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo('s' + r, () => new THREE.SphereGeometry(r, 10, 8)), mat(c)); m.position.set(x, y, z); return m; }
  function cone(r, h, c, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo(`k${r}_${h}`, () => new THREE.ConeGeometry(r, h, 7)), basique(c)); m.position.set(x, y, z); return m; }
  let _matcap = null;
  function MATCAP() {
    if (_matcap) return _matcap; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.fillStyle = '#4a4a52'; x.fillRect(0, 0, 64, 64); const g = x.createRadialGradient(24, 20, 2, 30, 30, 34);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#d9d4cc'); g.addColorStop(0.85, '#7a7682'); g.addColorStop(1, '#4a4a52'); x.fillStyle = g; x.beginPath(); x.arc(32, 32, 32, 0, 7); x.fill();
    _matcap = new THREE.CanvasTexture(c); _matcap.encoding = THREE.sRGBEncoding; return _matcap;
  }
  const peindre = (obj, coul, defaut) => obj.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.material = new THREE.MeshMatcapMaterial({ color: lin(coul[o.material.name] || defaut), matcap: MATCAP(), skinning: true }); } });
  function lumiere() { const m = new THREE.Mesh(geo('lum', () => new THREE.SphereGeometry(0.13, 6, 4)), basique(0xff3030)); m.userData.clignote = 1; return m; }
  function ciel(haut, bas) { const c = document.createElement('canvas'); c.width = 2; c.height = 128; const x = c.getContext('2d'); const g = x.createLinearGradient(0, 0, 0, 128); g.addColorStop(0, haut); g.addColorStop(1, bas); x.fillStyle = g; x.fillRect(0, 0, 2, 128); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t; }

  /* ---------- objets construits à la main ---------- */
  function grue(h) {
    const g = new THREE.Group(), J = 0xf2b632, J2 = 0xa8741a;
    g.add(boite(0.34, h, 0.34, J, 0, h / 2, 0));
    for (let y = 0.6; y < h - 0.3; y += 0.7) g.add(boite(0.4, 0.06, 0.4, J2, 0, y, 0));
    g.add(boite(4.4, 0.26, 0.3, J, -0.85, h, 0)); g.add(boite(0.7, 0.5, 0.42, 0x777777, 1.05, h - 0.35, 0)); g.add(boite(0.5, 0.45, 0.48, 0x3a5a8a, 0.05, h - 0.42, 0.3));
    g.add(boite(0.04, 2.4, 0.04, 0x222222, -2.6, h - 1.25, 0)); g.add(boite(0.3, 0.16, 0.16, 0x222222, -2.6, h - 2.5, 0));
    const l = lumiere(); l.position.set(0, h + 0.2, 0); g.add(l); return g;
  }
  function ballon(c) {
    const g = new THREE.Group(), cc = lin(c);
    const s = new THREE.SphereGeometry(0.78, 12, 10).toNonIndexed(), p = s.attributes.position, col = [];
    for (let i = 0; i < p.count; i += 3) {
      const x = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, z = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3; const k = Math.floor((Math.atan2(z, x) + Math.PI) / (Math.PI / 3)) % 2;
      for (let j = 0; j < 3; j++) k ? col.push(1, 1, 1) : col.push(cc.r, cc.g, cc.b);
    }
    s.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.Mesh(s, new THREE.MeshLambertMaterial({ vertexColors: true })); m.scale.y = 1.12; g.add(m);
    g.add(boite(0.36, 0.3, 0.36, 0x8a5a2a, 0, -1.25, 0)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(boite(0.03, 0.5, 0.03, 0x5a3a22, a * 0.16, -0.92, b * 0.16)); return g;
  }
  function avion(cq) {
    const g = new THREE.Group(), B = 0xf3f5f8;
    const f = cyl(0.32, 0.26, 3.2, 8, B); f.rotation.z = Math.PI / 2; g.add(f);
    const n = cyl(0.01, 0.32, 0.6, 8, B); n.rotation.z = Math.PI / 2; n.position.x = -1.9; g.add(n);
    g.add(boite(0.9, 0.07, 3.6, 0xd8dde5, 0.1, -0.08, 0)); g.add(boite(0.5, 0.05, 1.3, 0xd8dde5, 1.4, 0.05, 0));
    g.add(boite(0.55, 0.75, 0.07, cq, 1.45, 0.45, 0)); g.add(boite(2.2, 0.1, 0.02, 0x3b6ea8, -0.3, 0.1, 0.33)); g.add(boite(2.2, 0.1, 0.02, 0x3b6ea8, -0.3, 0.1, -0.33));
    const r1 = cyl(0.12, 0.12, 0.5, 6, 0x9aa0a8, 0.1, -0.3, 0.9), r2 = cyl(0.12, 0.12, 0.5, 6, 0x9aa0a8, 0.1, -0.3, -0.9); r1.rotation.z = r2.rotation.z = Math.PI / 2; g.add(r1, r2); return g;
  }
  function tourCtrl(h) {
    const g = new THREE.Group();
    g.add(cyl(0.38, 0.5, h, 8, 0xe4e2dc, 0, h / 2, 0)); g.add(cyl(0.95, 0.7, 0.5, 8, 0xd0ccc4, 0, h + 0.05, 0));
    const v = cyl(0.9, 0.9, 0.6, 8, 0x5aa8d8, 0, h + 0.6, 0); v.material = mat(0x5aa8d8, { emissive: 0x1a4a6a }); g.add(v);
    g.add(cyl(1, 1, 0.12, 8, 0x6a6e78, 0, h + 0.96, 0)); g.add(boite(0.06, 0.7, 0.06, 0x999999, 0, h + 1.35, 0));
    const l = lumiere(); l.position.set(0, h + 1.75, 0); g.add(l); return g;
  }
  function hangar(w) {
    const g = new THREE.Group(), r = w / 2;
    g.add(boite(w, 1, 2, 0x8a9bb0, 0, 0.5, 0));
    const t = new THREE.Mesh(geo('toit' + w, () => { const c = new THREE.CylinderGeometry(r, r, 2, 12, 1, false, Math.PI / 2, Math.PI); c.rotateX(Math.PI / 2); c.scale(1, 0.55, 1); return c; }), mat(0x6f8299, { side: THREE.DoubleSide })); t.position.y = 1; g.add(t);
    g.add(boite(w * 0.6, 1.3, 0.05, 0x3d4652, 0, 0.65, 1.01)); g.add(boite(w * 0.6, 0.08, 0.06, 0xf2b632, 0, 1.32, 1.02)); return g;
  }
  function terminal(w) {
    const g = new THREE.Group();
    g.add(boite(w, 1.7, 2.2, 0xd9d6cf, 0, 0.85, 0)); const v = boite(w * 0.92, 0.55, 0.05, 0x5aa8d8, 0, 1.05, 1.11); v.material = mat(0x5aa8d8, { emissive: 0x153a55 }); g.add(v);
    g.add(boite(w + 0.2, 0.15, 2.4, 0x9a9da3, 0, 1.75, 0)); g.add(boite(0.9, 0.35, 0.06, 0x2a3a6a, -w / 2 + 0.8, 1.95, 1)); return g;
  }
  function nid() {
    const g = new THREE.Group();
    const t = new THREE.Mesh(geo('nid', () => new THREE.TorusGeometry(0.75, 0.26, 6, 14)), mat(0x7a4f28)); t.rotation.x = Math.PI / 2; g.add(t);
    g.add(cyl(0.62, 0.5, 0.14, 10, 0x4a2f18, 0, -0.08, 0));
    for (let i = 0; i < 10; i++) { const b = boite(0.05, 0.05, 0.9, 0xa0703a); const a = i / 10 * Math.PI * 2; b.position.set(Math.cos(a) * 0.8, 0.12, Math.sin(a) * 0.8); b.rotation.y = a + 0.6; g.add(b); }
    for (let i = 0; i < 6; i++) { const p = cyl(0.12, 0.12, 0.04, 10, 0xffd25a); p.material = mat(0xffd25a, { emissive: 0x553300 }); p.position.set(1.05 + (i % 3) * 0.16, 0.04 + Math.floor(i / 3) * 0.05, 0.5 - (i % 2) * 0.15); g.add(p); }
    return g;
  }
  function gravats(w) { const g = new THREE.Group(); for (let i = 0; i < 6; i++) { const b = boite(0.45, 0.3, 0.45, i % 2 ? 0x4a4048 : 0x6a5a52); b.position.set(rnd(-w / 2 + 0.2, w / 2 - 0.2), 0.12, rnd(-0.4, 0.4)); b.rotation.y = rnd(0, 3); g.add(b); } return g; }
  function nuage(gris) { const g = new THREE.Group(); for (const [x, y, r] of [[-0.6, 0, 0.5], [0, 0.18, 0.62], [0.6, 0, 0.5], [0.25, -0.15, 0.45], [-0.3, -0.15, 0.42]]) g.add(boule(r, gris, x, y, 0)); return g; }
  function eclairForme() {
    const g = new THREE.Group(), J = 0xffe23a;
    for (const [x, y, r] of [[0.08, 0.1, 0.5], [-0.05, -0.18, -0.5], [0.06, -0.42, 0.5]]) { const b = new THREE.Mesh(geo('ecl', () => new THREE.BoxGeometry(0.1, 0.32, 0.06)), basique(J)); b.position.set(x, y, 0.2); b.rotation.z = r; g.add(b); }
    return g;
  }
  function bonus3D(t) {
    const g = new THREE.Group(); let halo = true;
    if (t === 'jetpack') {
      g.add(cyl(0.16, 0.16, 0.6, 8, 0x8a94a6, -0.19, 0, 0)); g.add(cyl(0.16, 0.16, 0.6, 8, 0x8a94a6, 0.19, 0, 0)); g.add(boite(0.5, 0.2, 0.15, 0x5a3a22, 0, 0.05, -0.1));
      const fl = cone(0.12, 0.35, 0xffa23a, -0.19, -0.45, 0); fl.rotation.x = Math.PI; g.add(fl); const f2 = fl.clone(); f2.position.x = 0.19; g.add(f2);
    } else if (t === 'lance') {
      g.add(cyl(0.2, 0.2, 0.65, 8, 0xd63a2a)); g.add(boite(0.5, 0.08, 0.08, 0x333333, 0.3, 0.15, 0)); const fl = cone(0.1, 0.3, 0xffd23a, 0.65, 0.15, 0); fl.rotation.z = -Math.PI / 2; g.add(fl);
    } else if (t === 'grenade') { g.add(boule(0.3, 0x4a8a3a)); g.add(boite(0.14, 0.14, 0.14, 0xaaaabb, 0, 0.32, 0)); g.add(boite(0.25, 0.05, 0.05, 0xaaaabb, 0.12, 0.38, 0)); }
    else if (t === 'bebe') {                                // une petite tête de dragon orange
      g.add(boule(0.3, 0xee8a2a)); g.add(boule(0.16, 0xffe08a, 0.2, -0.08, 0.12));
      for (const z of [-0.12, 0.12]) { const c = cone(0.06, 0.24, 0xfff3d0, -0.1, 0.32, z); c.rotation.z = 0.4; g.add(c); g.add(boule(0.05, 0x141414, 0.18, 0.1, z * 1.3)); }
    } else if (t === 'souffle') { const a = cone(0.32, 0.9, 0xff4a1a, 0, 0, 0), b = cone(0.22, 0.65, 0xffa23a, 0, -0.08, 0.02), c = cone(0.12, 0.4, 0xfff3a0, 0, -0.15, 0.05); for (const k of [a, b, c]) { k.rotation.z = Math.PI; g.add(k); } }
    else if (t === 'orage') { g.add(nuage(0x8a8fa0)); const e = eclairForme(); e.position.y = -0.5; g.add(e); g.scale.setScalar(1.6); halo = false; }
    else if (t === 'bouclier') {
      const b = new THREE.Mesh(geo('bou', () => new THREE.SphereGeometry(0.42, 14, 10)), basique(0x6ac8ff, { transparent: true, opacity: 0.45 })); g.add(b);
      const d = cyl(0.22, 0.22, 0.06, 6, 0x2a6ad8); d.rotation.x = Math.PI / 2; g.add(d); g.add(boite(0.05, 0.28, 0.07, 0xffffff), boite(0.2, 0.05, 0.07, 0xffffff, 0, 0.04));
    } else if (t === 'aimant') {
      const u = new THREE.Mesh(geo('aim', () => new THREE.TorusGeometry(0.24, 0.09, 6, 12, Math.PI)), mat(0xd8303a)); u.rotation.z = Math.PI; g.add(u);
      g.add(boite(0.18, 0.16, 0.18, 0xd8d8e0, -0.24, 0.08, 0), boite(0.18, 0.16, 0.18, 0xd8d8e0, 0.24, 0.08, 0));
    } else if (t === 'oeuf') { const o = new THREE.Mesh(geo('oeuf', () => new THREE.SphereGeometry(0.3, 12, 10)), mat(0xffd25a, { emissive: 0x8a5a00 })); o.scale.y = 1.3; g.add(o); }
    else { const p = cyl(0.3, 0.3, 0.08, 14, 0xffd25a); p.material = mat(0xffd25a, { emissive: 0x664400 }); p.rotation.x = Math.PI / 2; g.add(p); }
    if (halo) { const h = new THREE.Mesh(geo('halo', () => new THREE.RingGeometry(0.48, 0.6, 16)), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, side: THREE.DoubleSide })); g.add(h); g.userData.halo = h; }
    g.scale.multiplyScalar(1.3); return g;
  }

  /* ---------- particules (points carrés, façon pixels) ---------- */
  class Parts {
    constructor(sc, n) {
      this.n = n; this.a = []; const g = this.g = new THREE.BufferGeometry(); this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3);
      g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
      this.p = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.34, vertexColors: true })); this.p.frustumCulled = false; sc.add(this.p);
    }
    add(x, y, z, vx, vy, vz, life, hex, gr = 0) { if (this.a.length >= this.n) this.a.shift(); this.a.push({ x, y, z, vx, vy, vz, life, c: new THREE.Color(hex), gr }); }
    maj() {
      this.a = this.a.filter(p => --p.life > 0); let i = 0;
      for (const p of this.a) { p.x += p.vx; p.y += p.vy; p.z += p.vz; p.vy += p.gr; this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.y; this.pos[i * 3 + 2] = p.z; this.col[i * 3] = p.c.r; this.col[i * 3 + 1] = p.c.g; this.col[i * 3 + 2] = p.c.b; i++; }
      for (; i < this.n; i++) this.pos[i * 3 + 1] = -999;
      this.g.attributes.position.needsUpdate = true; this.g.attributes.color.needsUpdate = true;
    }
    vider() { this.a = []; }
  }

  /* ================= le monde ================= */
  class DsMonde {
    // canvas : où dessiner ; couche : élément HTML au-dessus, pour les textes flottants ; gltf : modeles.glb chargé
    constructor(canvas, couche, gltf) {
      this.couche = couche; this.textes = [];
      const ren = this.ren = new THREE.WebGLRenderer({ canvas, antialias: true });
      ren.outputEncoding = THREE.sRGBEncoding; ren.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
      const sc = this.sc = new THREE.Scene(); sc.background = ciel('#5ea7e6', '#ffe1b0'); sc.fog = new THREE.Fog(0xf3d9b8, 28, 70);
      this.cam = new THREE.PerspectiveCamera(50, 0.5, 0.1, 200); this.camPos = new THREE.Vector3(); this.camVise = new THREE.Vector3(); this.camOk = false;
      this.hemi = new THREE.HemisphereLight(0xe6f2ff, 0x8a7a6a, 0.95); sc.add(this.hemi);
      const sol = new THREE.DirectionalLight(0xfff0d8, 0.85); sol.position.set(6, 12, 9); sc.add(sol);
      this.feuLum = new THREE.PointLight(0xff8a2a, 0, 6); sc.add(this.feuLum);
      this.monde = new THREE.Group(); sc.add(this.monde);
      this.parts = new Parts(sc, 1000);
      // modèles fixes (rendus en facettes : outils/fbx-vers-glb.js a retiré leurs normales)
      this.kay = {};
      for (const o of gltf.scene.children.slice()) {
        if (o.name === 'dragon' || o.name === 'chauvesouris') continue;
        this.kay[o.name] = o; o.traverse(m => { if (m.isMesh && !m.geometry.attributes.normal) for (const x of [].concat(m.material)) x.flatShading = true; });
      }
      // chauve-souris : matcap, clonée avec SkeletonUtils
      this.chs = gltf.scene.getObjectByName('chauvesouris'); this.clipChs = gltf.animations.find(a => a.name === 'chauvesouris|Bat_Flying');
      peindre(this.chs, COUL_CHAUVE, '#5a3a8a');
      // le dragon
      const dr = gltf.scene.getObjectByName('dragon'); dr.parent.remove(dr);
      dr.scale.setScalar(0.0058); dr.rotation.y = Math.PI / 2; dr.position.y = -1.9;
      const clip = n => gltf.animations.find(a => a.name.endsWith(n));
      this.clipVol = clip('Dragon_Flying');
      // le bébé dragon : un clone plus petit, orange (cloné avant de peindre le grand)
      const bb = THREE.SkeletonUtils.clone(dr); peindre(bb, COUL_BEBE, '#ee8a2a'); bb.scale.setScalar(0.0058 * 0.45); bb.position.y = -1.9 * 0.45;
      this.bebe = new THREE.Group(); this.bebe.add(bb); this.bebe.visible = false; sc.add(this.bebe);
      this.bebeMix = new THREE.AnimationMixer(bb); this.bebeMix.clipAction(this.clipVol).play(); this.bebeNez = bb.getObjectByName('dragon_Nose');
      peindre(dr, COUL_DRAGON, '#b8323c');
      this.dg = new THREE.Group(); this.pivot = new THREE.Group(); this.pivot.add(dr); this.dg.add(this.pivot); sc.add(this.dg);
      this.nez = dr.getObjectByName('dragon_Nose') || dr.getObjectByName('dragon_Head'); this._v = new THREE.Vector3();
      this.mixer = new THREE.AnimationMixer(dr);
      this.aVol = this.mixer.clipAction(this.clipVol); this.aMort = this.mixer.clipAction(clip('Dragon_Death')); this.aMort.setLoop(THREE.LoopOnce); this.aMort.clampWhenFinished = true;
      this.aCoup = this.mixer.clipAction(clip('Dragon_Hit')); this.aCoup.setLoop(THREE.LoopOnce);
      // bulle du bouclier, ombre
      this.bulle = new THREE.Mesh(new THREE.SphereGeometry(1.5, 18, 12), new THREE.MeshBasicMaterial({ color: 0x6ac8ff, transparent: true, opacity: 0.22, depthWrite: false })); this.bulle.visible = false; sc.add(this.bulle);
      this.ombre = new THREE.Mesh(new THREE.CircleGeometry(0.8, 16), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.25, depthWrite: false })); this.ombre.rotation.x = -Math.PI / 2; sc.add(this.ombre);
      this.eclairs = []; this.secousse = 0; this.flash = 0;
    }

    /* ---------- une nouvelle partie (aussi pour le nid et la démo) ---------- */
    preparer(p) {
      this.p = p;
      for (const c of this.monde.children.slice()) this.monde.remove(c);
      this.parts.vider(); this.objs = new Map(); this.deco = []; this.debris = []; this.ruines = [];
      for (const e of this.eclairs) this.sc.remove(e.l); this.eclairs = [];
      for (const t of this.textes) t.e.remove(); this.textes = [];
      this.nbb = -260; this.nr = -264; this.camOk = false; this.secousse = 0; this.flash = 0;
      // la tour du nid
      const tour = new THREE.Group(), c = this.kay.building_C_withoutBase, hc = DS_TAILLES.building_C_withoutBase[1];
      for (let k = 0; k < 3; k++) { const b = c.clone(); b.position.y = k * hc; tour.add(b); }
      const n = nid(); n.position.y = 3 * hc + 0.12; tour.add(n); this.monde.add(tour); this.deco.push({ x: 0, m: tour });
      this.mixer.stopAllAction(); this.aVol.reset().play(); this.pivot.rotation.z = 0;
      this.genDeco(p); this.synchro(p);
    }
    ajouter(m, x, y = 0, z = 0) { m.position.set(x, y, z); this.monde.add(m); return m; }

    /* ---------- décor sans règles : immeubles du fond, route, trottoir ---------- */
    genDeco(p) {
      const loin = p.d.x + 240, Kc = n => this.kay[n].clone();
      while (this.nbb < loin) {
        const bi = dsBiome(p, this.nbb);
        if (bi === 'ville') {
          for (const [z, s] of [[-3, 1], [-6.2, 1.35]]) {
            const n = DS_IMMEUBLES[ri(0, 7)], m = Kc(n); m.scale.setScalar(s);
            if (z < -5 && Math.random() < 0.5) { const m2 = Kc(n); m2.position.y = DS_TAILLES[n][1]; m.add(m2); }
            this.deco.push({ x: this.nbb, m: this.ajouter(m, x3(this.nbb) + rnd(-0.3, 0.3), 0, z) });
          }
          if (Math.random() < 0.3) this.deco.push({ x: this.nbb, m: this.ajouter(Kc('watertower'), x3(this.nbb), 0, -1.6) });
          this.nbb += ri(24, 30);
        } else {
          if (Math.random() < 0.35) { const m = Kc('air_windsock'); m.scale.setScalar(0.3); this.deco.push({ x: this.nbb, m: this.ajouter(m, x3(this.nbb), 0, 1.3) }); }
          if (Math.random() < 0.5) this.deco.push({ x: this.nbb, m: this.ajouter(hangar(4), x3(this.nbb), 0, -5.5) });
          else for (let k = 0; k < 3; k++) { const b = Kc('bush'); b.scale.setScalar(rnd(3, 5)); this.deco.push({ x: this.nbb, m: this.ajouter(b, x3(this.nbb) + k * 0.9, 0, -3.5 - k * 0.7) }); }
          this.nbb += ri(48, 70);
        }
      }
      while (this.nr < loin) {
        const bi = dsBiome(p, this.nr), X = x3(this.nr) + 1, D = m => this.deco.push({ x: this.nr, m });
        if (bi === 'ville') {
          const r = Kc('road_straight'); r.rotation.y = Math.PI / 2; D(this.ajouter(r, X, 0, 2.3));
          D(this.ajouter(boite(2, 0.05, 14, 0xb3aea2), X, -0.03, -6)); D(this.ajouter(boite(2, 0.05, 8, 0x86ad62), X, -0.03, 7.3));
          if (Math.floor(this.nr / 24) % 3 === 0) { const n = ['streetlight', 'ru_Streetlight_Single', 'ru_Streetlight_Double', 'trafficlight_A', 'ru_TrafficLight'][ri(0, 4)], m = Kc(n); if (n.startsWith('ru_')) m.scale.setScalar(1.1); D(this.ajouter(m, X, 0, 1.15)); }
          if (Math.random() < 0.35) { const [n, k] = [['firehydrant', 1.6], ['bench', 1.8], ['dumpster', 1.6], ['ru_Sign_Stop', 1.3], ['ru_Sign_NoParking', 1.3], ['ru_Sign_Triangle', 1.3]][ri(0, 5)], m = Kc(n); m.scale.setScalar(k); D(this.ajouter(m, X + rnd(-0.6, 0.6), 0, 1.0)); }
        } else {
          D(this.ajouter(boite(2, 0.05, 2.8, 0x3a3d44), X, -0.02, 2.5)); D(this.ajouter(boite(2, 0.05, 1.4, 0x9a9da3), X, -0.03, 0.5));
          if (Math.floor(this.nr / 24) % 2 === 0) D(this.ajouter(boite(1, 0.06, 0.14, 0xffffff), X, 0, 2.5));
          D(this.ajouter(boite(2, 0.05, 14, 0x7bb05a), X, -0.03, -6.8)); D(this.ajouter(boite(2, 0.05, 8, 0x7bb05a), X, -0.03, 7.8));
          if (Math.random() < 0.2) { const m = Kc('air_traffic_cone'); m.scale.setScalar(0.5); D(this.ajouter(m, X + rnd(-0.5, 0.5), 0, 1)); }
        }
        this.nr += 24;
      }
      const lim = p.d.x - 200;
      this.deco = this.deco.filter(o => { if (o.x >= lim) return true; this.monde.remove(o.m); return false; });
      this.ruines = this.ruines.filter(o => { if (o.x >= lim) return true; this.monde.remove(o.m); return false; });
    }

    /* ---------- objets des règles <-> modèles ---------- */
    creer(o, sorte) {
      const Kc = n => this.kay[n].clone(); let m, e = { sorte };
      if (sorte === 'bat') {
        if (o.modele.startsWith('building_')) m = Kc(o.modele);
        else if (o.modele === 'hangar') m = hangar(o.l3);
        else if (o.modele === 'terminal') m = terminal(o.l3);
        else if (o.modele === 'avion') { m = new THREE.Group(); const a = avion([0xd6303a, 0x3b6ea8, 0xf2b632][o.couleur]); a.scale.setScalar(0.9); a.rotation.y = Math.PI; a.position.set(0, 0.6, 0.2); m.add(a); }
        else { m = Kc(o.modele); m.scale.setScalar(o.k); }
        this.ajouter(m, x3(o.x + o.w / 2), 0, 0);
        if (o.arbre) { const a = Kc(o.arbre); a.scale.setScalar(1.8); this.deco.push({ x: o.x, m: this.ajouter(a, x3(o.x + o.w) + 0.4, 0, -0.6) }); }
        e.hp = o.mx;
      } else if (sorte === 'obs') {
        if (o.t === 'chauve') { m = THREE.SkeletonUtils.clone(this.chs); m.scale.setScalar(0.0026); m.rotation.y = -Math.PI / 2; e.mix = new THREE.AnimationMixer(m); e.mix.clipAction(this.clipChs).play(); e.mix.update(Math.random()); }
        else if (o.t === 'helico') { m = Kc('air_helicopter'); m.scale.setScalar(0.32); m.rotation.y = Math.PI / 2; }
        else if (o.t === 'avion') { m = Kc('air_trainer'); m.scale.setScalar(0.32); m.rotation.y = -Math.PI / 2; }
        else if (o.t === 'grue') m = grue((GY - o.haut) / U);
        else if (o.t === 'tour') m = tourCtrl((GY - o.haut) / U - 1.8);
        else m = ballon([0xff5a6e, 0x5ab4ff, 0xffd25a][o.couleur]);
        if (o.t === 'helico' || o.t === 'avion') m.traverse(c => { if (/rotor|blade|prop/i.test(c.name)) c.userData.tourne = 1; });
        e.bouge = o.y !== undefined; e.anime = []; m.traverse(c => { if (c.userData.tourne || c.userData.clignote) e.anime.push(c); });
        this.ajouter(m, x3(o.x) + (o.t === 'grue' ? 0.17 : 0), e.bouge ? y3(o.y) : 0, 0);
      } else if (sorte === 'bonus') { m = this.ajouter(bonus3D(o.t), x3(o.x), y3(o.y), 0); }
      else {
        m = Kc(o.modele); m.rotation.y = o.sens * Math.PI / 2;
        m.scale.setScalar(o.t === 'animal' ? (o.modele === 'an_Pug' ? 0.12 : 0.14) : o.modele.startsWith('kc_') ? 0.36 : o.modele.startsWith('qv_') ? 0.3 : 1);
        this.ajouter(m, x3(o.x), 0, o.z);
      }
      e.m = m; e.o = o; return e;
    }
    synchro(p) {
      const vus = new Set();
      for (const [l, s] of [[p.bat, 'bat'], [p.obs, 'obs'], [p.bonus, 'bonus'], [p.route, 'route']])
        for (const o of l) { vus.add(o.id); const e = this.objs.get(o.id); if (!e) this.objs.set(o.id, this.creer(o, s)); else e.o = o; }
      for (const [id, e] of this.objs) if (!vus.has(id)) { this.monde.remove(e.m); if (e.gr) this.monde.remove(e.gr); this.objs.delete(id); }
    }
    teinter(e) {
      if (!e.mats) { e.mats = []; e.m.traverse(m => { if (m.isMesh) { m.material = [].concat(m.material).map(x => x.clone()); if (m.material.length === 1) m.material = m.material[0]; for (const x of [].concat(m.material)) e.mats.push([x, x.color.clone()]); } }); }
      const k = 0.3 + 0.7 * Math.max(0, e.o.hp / e.o.mx); for (const [m, c] of e.mats) m.color.copy(c).multiplyScalar(k);
    }

    /* ---------- effets ---------- */
    explo(x, y, k) {
      for (let i = 0; i < 30 * k; i++) { const a = rnd(0, 6.3), b = rnd(-1, 1), v = rnd(0.04, 0.16) * Math.min(k, 1.8); this.parts.add(x, y, rnd(-0.3, 0.3), Math.cos(a) * v, Math.sin(a) * v + 0.04, b * v, ri(16, 32), FEU[ri(0, 3)], -0.004); }
      for (let i = 0; i < 12 * k; i++) this.parts.add(x + rnd(-0.5, 0.5), y + rnd(-0.3, 0.3), rnd(-0.5, 0.5), rnd(-0.01, 0.01), rnd(0.02, 0.05), rnd(-0.01, 0.01), ri(40, 70), [0x555555, 0x777777, 0x3d3540][ri(0, 2)]);
    }
    etincelles(x, y, c, n = 16) { for (let i = 0; i < n; i++) { const a = rnd(0, 6.3), v = rnd(0.04, 0.1); this.parts.add(x, y, 0, Math.cos(a) * v, Math.sin(a) * v, rnd(-0.03, 0.03), ri(16, 28), c); } }
    texte(s, px, py, col = '#ffd25a', grand) {
      const e = document.createElement('div'); e.className = 'flot' + (grand ? ' grand' : ''); e.textContent = s; e.style.color = col; this.couche.appendChild(e);
      this.textes.push({ e, x: x3(px), y: y3(py), v: 60 });
    }
    eclair(px) {
      const pts = [], x = x3(px); let y = 17;
      while (y > 0) { pts.push(new THREE.Vector3(x + rnd(-0.5, 0.5), y, 0.4)); y -= rnd(0.8, 1.6); } pts.push(new THREE.Vector3(x, 0, 0.4));
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xfff6a0 }));
      this.sc.add(l); this.eclairs.push({ l, v: 14 }); this.flash = 10;
    }
    debrisVoiture(p3) {
      for (const n of ['kc_debris-tire', 'kc_debris-door', 'kc_debris-bumper', 'kc_debris-tire']) {
        const m = this.kay[n].clone(); m.scale.setScalar(0.36); this.ajouter(m, p3.x, 0.4, p3.z);
        this.debris.push({ m, vx: rnd(-0.08, 0.08), vy: rnd(0.1, 0.18), vz: rnd(-0.05, 0.08), r: rnd(-0.3, 0.3), v: 150 });
      }
    }
    // ce que les règles viennent de raconter (p.ev) ; renvoie rien : les sons sont joués par jeu.js
    evenements(p) {
      for (const ev of p.ev) {
        const e = ev.id ? this.objs.get(ev.id) : null;
        switch (ev.t) {
          case 'detruit': if (e) {
            const o = e.o; e.chute = 1; e.gr = this.ajouter(gravats(o.w / U), x3(o.x + o.w / 2), -0.4, 0);
            this.explo(x3(o.x + o.w / 2), o.h / U / 2, ev.cause === 'grenade' ? 1.4 : 1.2); this.secousse = Math.max(this.secousse, 8);
          } break;
          case 'grenade': this.explo(x3(ev.x), 1.5, 3); this.texte('BOUM !', ev.x, GY - 50, '#ff5a3a', true); this.secousse = 16; break;
          case 'voiture': if (e) { e.m.visible = false; this.explo(e.m.position.x, 0.4, 1.3); this.debrisVoiture(e.m.position); this.secousse = Math.max(this.secousse, 8); } break;
          case 'chauve': this.explo(x3(ev.x), y3(ev.y), 0.5); break;
          case 'pieces': if (ev.q !== 'distance') this.texte('+' + ev.n, ev.x, ev.y - 10); break;
          case 'bonus': {
            const b = DS_BONUS[ev.b]; this.etincelles(x3(ev.x), y3(ev.y), ev.b === 'oeuf' || ev.b === 'pieces' ? 0xffd25a : 0xffffff, 22);
            if (ev.b !== 'pieces') this.texte(b.nom, ev.x, ev.y - 14, { jetpack: '#8fe0ff', lance: '#ff8a3d', grenade: '#9fe08a', bebe: '#ffb06a', souffle: '#ff6a3a', orage: '#fff6a0', bouclier: '#8fd8ff', aimant: '#ff8a9a', oeuf: '#ffd25a' }[ev.b], true);
            break;
          }
          case 'eclair': this.eclair(ev.x); break;
          case 'choc': this.explo(x3(ev.x), y3(ev.y), 0.4); this.secousse = 12; this.aCoup.reset().play(); break;
          case 'bouclier': this.etincelles(x3(ev.x), y3(ev.y), 0x8fd8ff, 30); this.secousse = 6; break;
          case 'ko': this.aVol.fadeOut(0.3); this.aMort.reset().fadeIn(0.2).play(); break;
          case 'fin': for (let i = 0; i < 20; i++) this.parts.add(x3(p.d.x) + rnd(-1, 1), 0.1, rnd(-0.5, 0.5), rnd(-0.05, 0.05), rnd(0.01, 0.04), rnd(-0.03, 0.03), ri(30, 50), 0xb8ada0); break;
        }
      }
    }

    /* ---------- une image des règles (60 par seconde) ---------- */
    pas(p) {
      this.genDeco(p); this.synchro(p); this.evenements(p);
      const t = p.t;
      // le feu
      this.feuLum.intensity = 0;
      if (p.flamme) {
        const f = p.flamme, w = this.nez.getWorldPosition(this._v), n = f.fort ? 9 : 5, v0 = f.fort ? 0.5 : 0.34;
        for (let k = 0; k < n; k++) { const aa = f.a + rnd(-0.16, 0.16), v = rnd(v0 * 0.88, v0 * 1.1); this.parts.add(w.x, w.y, w.z + rnd(-0.1, 0.1), Math.cos(aa) * v + p.d.vx / U * 0.5, -Math.sin(aa) * v, rnd(-0.02, 0.02), ri(20, 28), FEU[ri(0, 3)]); }
        this.feuLum.position.set(w.x + 1, w.y - 0.5, 1); this.feuLum.intensity = 2.2 + Math.random();
      }
      if (p.flammeBebe && this.bebe.visible) {
        const f = p.flammeBebe, w = this.bebeNez.getWorldPosition(this._v);
        for (let k = 0; k < 3; k++) { const aa = f.a + rnd(-0.16, 0.16), v = rnd(0.24, 0.3); this.parts.add(w.x, w.y, w.z, Math.cos(aa) * v + p.d.vx / U * 0.5, -Math.sin(aa) * v, 0, ri(16, 22), FEU[ri(0, 3)]); }
      }
      if (p.jet > 0 && t % 2 === 0) this.parts.add(x3(p.d.x) - 1, y3(p.d.y), 0, -0.08, rnd(-0.01, 0.02), rnd(-0.02, 0.02), 14, Math.random() < 0.5 ? 0xffd23a : 0x8fe0ff);
      if (p.aimant > 0 && t % 4 === 0) { const a = rnd(0, 6.3); this.parts.add(x3(p.d.x) + Math.cos(a) * 2.5, y3(p.d.y) + Math.sin(a) * 2.5, 0, -Math.cos(a) * 0.08, -Math.sin(a) * 0.08, 0, 26, 0xff8a9a); }
      if (p.oeuf > 0 && t % 5 === 0) this.parts.add(x3(p.d.x) + rnd(-1, 1), y3(p.d.y) + rnd(-0.5, 1), rnd(-0.5, 0.5), 0, 0.03, 0, 30, 0xffd25a);
      // véhicules et animaux
      for (const [, e] of this.objs) {
        const o = e.o;
        if (e.sorte === 'route') { if (!o.mort) { e.m.position.x = x3(o.x); if (o.t === 'animal') e.m.position.y = o.peur > 0 ? Math.abs(Math.sin(t * 0.4)) * 0.15 : 0; if (o.peur > 0) e.m.rotation.y = Math.sign(o.v || 1) * Math.PI / 2; } }
        else if (e.sorte === 'bat') {
          if (!o.mort && o.hp < o.mx && e.hp !== o.hp) { e.hp = o.hp; this.teinter(e); }
          if (o.brule > 0 && !o.mort && t % 2 === 0) this.parts.add(x3(o.x + rnd(0, o.w)), y3(GY - o.h) + rnd(0, 0.2), rnd(-0.6, 0.8), rnd(-0.01, 0.01), rnd(0.03, 0.07), 0, 18, FEU[ri(1, 3)]);
          if (e.chute > 0 && e.chute <= 45) {                   // il s'effondre dans la poussière
            e.chute++; const H = o.h / U; e.m.position.y = -H * Math.pow(e.chute / 45, 1.6); e.m.rotation.z = Math.sin(e.chute * 0.9) * 0.03;
            if (e.chute % 2 === 0) for (let k = 0; k < 3; k++) this.parts.add(x3(o.x + rnd(0, o.w)), rnd(0, 0.6), rnd(-1, 1), rnd(-0.04, 0.04), rnd(0.02, 0.06), rnd(-0.03, 0.03), ri(40, 60), [0x9a8f84, 0xb8ada0, 0x6a625c][ri(0, 2)]);
            if (e.gr) e.gr.position.y = -0.4 + 0.4 * e.chute / 45;
            if (e.chute > 45) { e.m.visible = false; e.braise = 240; }
          }
          if (e.braise > 0) {
            e.braise--; if (t % 3 === 0) this.parts.add(x3(o.x + rnd(0, o.w)), 0.3, rnd(-0.5, 0.5), rnd(-0.01, 0.01), rnd(0.03, 0.06), 0, 16, FEU[ri(1, 3)]);
            if (t % 7 === 0) this.parts.add(x3(o.x + rnd(0, o.w)), 0.6, rnd(-0.5, 0.5), rnd(-0.01, 0.01), rnd(0.02, 0.04), 0, 60, 0x4a4048);
          }
        } else if (e.sorte === 'obs' && o.t === 'chauve' && o.mort && t % 2 === 0 && o.y < GY - 6) this.parts.add(x3(o.x), y3(o.y), rnd(-0.2, 0.2), rnd(-0.02, 0.02), rnd(0.02, 0.05), 0, 16, FEU[ri(0, 3)]);
      }
      this.debris = this.debris.filter(b => {
        b.v--; const m = b.m; m.position.x += b.vx; m.position.y += b.vy; m.position.z += b.vz; b.vy -= 0.008; m.rotation.x += b.r; m.rotation.z += b.r * 0.7;
        if (m.position.y < 0.05) { m.position.y = 0.05; b.vy *= -0.3; b.vx *= 0.6; b.vz *= 0.6; b.r *= 0.5; }
        if (b.v <= 0) { this.monde.remove(m); return false; } return true;
      });
      this.eclairs = this.eclairs.filter(e => { if (--e.v > 0) { e.l.visible = e.v % 4 < 3; return true; } this.sc.remove(e.l); e.l.geometry.dispose(); return false; });
      if (this.secousse > 0) this.secousse--; if (this.flash > 0) this.flash--;
      for (const x of this.textes) { x.v--; x.y += 0.02; }
      this.parts.maj();
    }

    /* ---------- dessin (à chaque image de l'écran) ; mode : 'nid', 'jeu', 'demo', 'fin' ---------- */
    dessiner(p, dt, mode) {
      const d = p.d, X = x3(d.x), Y = y3(d.y), tt = p.t;
      this.dg.position.set(X, Y, 0); this.dg.rotation.z = d.pose ? 0 : -d.ang;
      const pen = d.pose ? 0 : p.fin ? -0.2 : -0.5 + (d.f > 0 ? 0.25 : 0); this.pivot.rotation.z += (pen - this.pivot.rotation.z) * 0.12;
      this.dg.visible = p.inv % 6 < 3 || mode !== 'jeu';
      this.mixer.update(dt * (d.pose ? 0.35 : d.f > 0 ? 2.4 : p.fin ? 0.6 : 0.9));
      this.ombre.position.set(X, 0.03, 0); const hs = cl(1 - Y / 14, 0.2, 1); this.ombre.scale.setScalar(hs); this.ombre.material.opacity = 0.3 * hs;
      this.bulle.visible = !!p.bouclier; if (p.bouclier) { this.bulle.position.set(X + 0.3, Y - 0.2, 0); this.bulle.material.opacity = 0.18 + 0.08 * Math.sin(tt * 0.15); }
      this.bebe.visible = p.bebe > 0 && !(p.bebe < 120 && p.bebe % 10 < 5);
      if (p.bebe > 0) { const b = dsPosBebe(d); this.bebe.position.set(x3(b.x), y3(b.y) + Math.sin(tt * 0.1) * 0.15, 0.6); this.bebe.rotation.z = -d.ang * 0.6; this.bebeMix.update(dt * 1.6); }
      for (const [, e] of this.objs) {
        const o = e.o;
        if (e.sorte === 'bonus') { e.m.position.set(x3(o.x), y3(o.y) + Math.sin(tt * 0.08 + o.x) * 0.15, 0); e.m.rotation.y = o.t === 'orage' ? Math.sin(tt * 0.03) * 0.3 : tt * 0.04; if (e.m.userData.halo) e.m.userData.halo.material.opacity = 0.35 + 0.25 * Math.sin(tt * 0.15); }
        else if (e.sorte === 'obs') {
          if (e.bouge) e.m.position.set(x3(o.x), y3(o.y), 0);
          if (e.mix) e.mix.update(o.mort ? 0 : dt); if (o.mort) e.m.rotation.z += 0.15;
          for (const c of e.anime) { if (c.userData.clignote) c.visible = tt % 40 < 20; if (c.userData.tourne) c.rotation.y += 0.6; }
        }
      }
      this.hemi.intensity = 0.95 + (this.flash > 0 ? this.flash * 0.12 : 0);
      // caméra
      const cp = this.camPos, cv = this.camVise; let tp, tv;
      if (mode === 'nid') { tp = new THREE.Vector3(X + 3.4, Y + 0.4, 10); tv = new THREE.Vector3(X + 0.9, Y - 4, 0); }
      else { const cx = X + 1.3, cy = cl(Y * 0.6 + 2.4, 5.5, 15.5); tp = new THREE.Vector3(cx, cy + 2, 15); tv = new THREE.Vector3(cx, cy, 0); }
      if (!this.camOk) { cp.copy(tp); cv.copy(tv); this.camOk = true; } else { const k = mode === 'nid' ? 0.1 : 0.07; cp.lerp(tp, k); cv.lerp(tv, k); if (mode !== 'nid') { cp.x = tp.x; cv.x = tv.x; } }
      this.cam.position.copy(cp); if (this.secousse) this.cam.position.add(new THREE.Vector3(rnd(-0.12, 0.12), rnd(-0.12, 0.12), 0)); this.cam.lookAt(cv);
      // taille et rendu
      const cvs = this.ren.domElement, w = cvs.clientWidth, h = cvs.clientHeight;
      if (w && (w !== this.lw || h !== this.lh)) { this.lw = w; this.lh = h; this.ren.setSize(w, h, false); this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); }
      this.ren.render(this.sc, this.cam);
      // textes flottants
      const v = this._v;
      this.textes = this.textes.filter(t => {
        if (t.v <= 0) { t.e.remove(); return false; }
        v.set(t.x, t.y, 0).project(this.cam); t.e.style.left = ((v.x + 1) / 2 * 100) + '%'; t.e.style.top = ((1 - v.y) / 2 * 100) + '%'; t.e.style.opacity = Math.min(1, t.v / 20); return true;
      });
    }
  }

  // charge modeles.glb (ou, dans l'artefact, la copie en base64 window.DS_MODELES_B64)
  DsMonde.charger = function (url) {
    const lire = buf => new Promise((ok, ko) => new THREE.GLTFLoader().parse(buf, '', ok, ko));
    if (window.DS_MODELES_B64) { const s = atob(window.DS_MODELES_B64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return lire(u.buffer); }
    return fetch(url).then(r => { if (!r.ok) throw new Error('modeles.glb : ' + r.status); return r.arrayBuffer(); }).then(lire);
  };
  window.DsMonde = DsMonde;
})();

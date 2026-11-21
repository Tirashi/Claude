/* Écurie miniature : la course en 3D (circuit en tuiles, décor, voitures) et ses trois caméras : suivie, diorama, télé.
   Scene3D.creer(canvas, circuit, course) ; .image(dt) dessine l'état de la course ; .mode : 0 suivie, 1 diorama, 2 télé ; .suivi : index de la voiture suivie. */
(function (W) {
  const LV = 4.4, Y = .2;
  function rnd(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
  function creer(cv, K, C) {
    const sc = new THREE.Scene(); sc.background = new THREE.Color(0x9cc8e8); sc.fog = new THREE.Fog(0x9cc8e8, 320, 760);
    const [cx, cz] = K.centre, T = K.taille;
    sc.add(new THREE.HemisphereLight(0xe4ecff, 0x4a5a40, .65));
    const sol = new THREE.DirectionalLight(0xfff0d8, .85); sol.position.set(cx + 56, 140, cz - 2); sol.target.position.set(cx, 0, cz);
    sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); const ext = T / 2 + 45; Object.assign(sol.shadow.camera, {left: -ext, right: ext, top: ext, bottom: -ext, near: 10, far: 400}); sol.shadow.bias = -.0005; sc.add(sol, sol.target);
    const herbe = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshLambertMaterial({color: 0x5ea84a})); herbe.rotation.x = -Math.PI / 2; herbe.position.set(cx, -.02, cz); herbe.receiveShadow = true; sc.add(herbe);
    // le circuit, tuile par tuile
    const RT = Modeles.routes();
    for (const t of K.tuiles) { const o = (t.type === 'S' ? RT.S : RT[t.R]).clone(); o.position.set(t.x, 0, t.z); o.rotation.y = t.ry; sc.add(o); }
    // le décor
    const R = rnd(K.TOT | 0), at = K.at, TOT = K.TOT;
    const pose = (nom, x, z, a, s = 1) => { const o = Modeles.maillage('deco-' + nom); o.position.set(x, 0, z); o.rotation.y = a; o.scale.setScalar(s); sc.add(o); return o; };
    for (let s = 6; s < TOT; s += 24) { const [x, z, h] = at(s, 8.2); pose('lamp_1', x, z, -h + Math.PI / 2); const [x2, z2, h2] = at(s + 12, -8.2); pose('lamp_1', x2, z2, -h2 + 3 * Math.PI / 2); }
    for (const t of K.tuiles) if (t.type === 'C') { const n = Math.round(t.R * Math.PI / 2 / 3.3);
      // barrières à l'extérieur du virage, fûts juste avant l'entrée
      for (let i = 0; i <= n; i++) { const a = t.a0 + (t.a1 - t.a0) * i / n, r = t.R + 8.6; pose('road_barier_2a', t.cx + r * Math.cos(a), t.cz + r * Math.sin(a), -(a + Math.PI / 2)); }
      const a0 = t.a0 - .05 * t.sens; for (let k = 0; k < 3; k++) pose('traffic_barell_1', t.cx + (t.R + 11 + k * 2.2) * Math.cos(a0), t.cz + (t.R + 11 + k * 2.2) * Math.sin(a0), 0); }
    { const [x, z, h] = at(K.DEPART - 2, -8); pose('traffic_light_1', x, z, -h + 3 * Math.PI / 2); }
    for (let s = 0; s < TOT; s += 31) { const [x, z] = at(s, R() < .5 ? -10.5 : 10.5); pose('hazzard_cone_1', x, z, R() * 6); }
    const loin = (x, z, d) => K.pts.every(p => Math.hypot(p[0] - x, p[1] - z) > d);
    for (let i = 0; i < 260; i++) { const x = cx - 145 + R() * 290, z = cz - 130 + R() * 260; if (!loin(x, z, 14)) continue; pose(R() < .5 ? 'Tree3' : 'Tree4', x, z, R() * 6, .8 + R() * .6); }
    // ligne de départ (damier)
    { const [x, z, h] = at(K.DEPART), g = new THREE.Group(), blanc = new THREE.MeshLambertMaterial({color: 0xffffff}), noir = new THREE.MeshLambertMaterial({color: 0x111111}), q0 = new THREE.PlaneGeometry(1, 1.04);
      for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) { const q = new THREE.Mesh(q0, (i + j) % 2 ? noir : blanc); q.rotation.x = -Math.PI / 2; q.position.set(j, .215, -5.2 + i * 1.04 + .52); g.add(q); }
      g.position.set(x, 0, z); g.rotation.y = -h; sc.add(g); }
    // tribune (faite par le code)
    { const [x, z, h] = at(K.DEPART - 22, -18), g = new THREE.Group(), gris = new THREE.MeshLambertMaterial({color: 0x8a90a0, flatShading: true});
      for (let m = 0; m < 4; m++) { const b = new THREE.Mesh(new THREE.BoxGeometry(34, 1, 2.2), gris); b.position.set(0, .5 + m, -m * 2.2); b.castShadow = b.receiveShadow = true; g.add(b);
        for (let p = 0; p < 22; p++) { const q = new THREE.Mesh(new THREE.BoxGeometry(.7, .9, .7), new THREE.MeshLambertMaterial({color: new THREE.Color().setHSL(R(), .6, .55)})); q.position.set(-15.5 + p * 1.47, 1.45 + m, -m * 2.2); g.add(q); } }
      const toit = new THREE.Mesh(new THREE.BoxGeometry(36, .5, 11), new THREE.MeshLambertMaterial({color: 0xc03a3a, flatShading: true})); toit.position.set(0, 7.5, -3.6); toit.castShadow = true; g.add(toit);
      for (const sx of [-17, 17]) { const pi = new THREE.Mesh(new THREE.BoxGeometry(.4, 7.5, .4), gris); pi.position.set(sx, 3.75, -8.5); g.add(pi); }
      g.position.set(x, 0, z); g.rotation.y = -h + Math.PI; sc.add(g); }
    // les voitures
    const FEU_OFF = new THREE.MeshBasicMaterial({color: 0x5a1010}), FEU_ON = new THREE.MeshBasicMaterial({color: 0xff3a2a}), boiteFeu = new THREE.BoxGeometry(.012, .035, .07);
    const objets = C.V.map(v => { const m = Modeles.voiture(v.m, v.c); m.scale.setScalar(LV); sc.add(m);
      const [fx, fy, fz] = m.feu, feux = [-fz, fz].map(zz => { const fe = new THREE.Mesh(boiteFeu, FEU_OFF); fe.position.set(fx, fy, zz); m.add(fe); return fe; }); return {m, feux, d: 0}; });
    // rendu et caméras
    const r = new THREE.WebGLRenderer({canvas: cv, antialias: true}); r.setPixelRatio(Math.min(2, W.devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const cam = new THREE.PerspectiveCamera(40, 1, .5, 900);
    const POSTES = []; for (let s = 10; s < TOT; s += TOT / 7) { const [x, z] = at(s, 14); POSTES.push({s, x, z}); }
    const S = {mode: 0, suivi: Math.max(0, C.V.findIndex(v => v.joueur)), tele: {poste: 0, plan: 0, cible: null, num: 1, duel: '', coupe: 0}, r, sc, cam};
    const vise = new THREE.Vector3(), pos = new THREE.Vector3(), cv3 = new THREE.Vector3(); let init = false, ang = 0;
    function couper() { const O = C.ordre.filter(v => !v.abandon); if (O.length < 2) return; let best = 1, e = 1e9;
      for (let i = 1; i < O.length; i++) { const d = O[i - 1].s - O[i].s - (O[i].joueur || O[i - 1].joueur ? 3 : 0); if (d < e) { e = d; best = i; } }
      const tl = S.tele; tl.cible = [O[best - 1], O[best]]; const sm = ((tl.cible[0].s % TOT) + TOT) % TOT; let bp = 0, bd = 1e9;
      POSTES.forEach((p, i) => { const d = (p.s - sm + TOT) % TOT; if (d < bd && d > 8) { bd = d; bp = i; } }); tl.poste = bp; tl.num = bp + 1;
      tl.duel = `DUEL POUR P${C.ordre.indexOf(tl.cible[1])} · ${tl.cible[0].pil} / ${tl.cible[1].pil}`; tl.coupe++; }
    S.image = function (dt) {
      for (let i = 0; i < C.V.length; i++) { const v = C.V[i], o = objets[i];
        o.m.position.set(v.x, Y - (Math.abs(v.dec) > 5.2 ? .15 : 0), v.z); o.m.rotation.y = -v.h - v.lacet; o.m.rotation.z = -v.tang;
        // roues : elles tournent selon la distance parcourue (plafonnée dans Modeles.voiture)
        o.m.tourner(Math.max(0, v.s - o.d) / LV); o.d = v.s;
        const f = v.freine ? FEU_ON : FEU_OFF; if (o.feux[0].material !== f) for (const fe of o.feux) fe.material = f; }
      if (S.mode === 0) { const J = C.V[S.suivi], [jx, jz, jh] = at(J.s + 5, J.dec * .5), c = new THREE.Vector3(jx, 0, jz), p = new THREE.Vector3(jx - Math.cos(jh) * 30, 46, jz - Math.sin(jh) * 30);
        if (!init) { vise.copy(c); pos.copy(p); init = true; } vise.lerp(c, Math.min(1, dt * 3)); pos.lerp(p, Math.min(1, dt * 1.5)); cam.position.copy(pos); cam.lookAt(vise); cam.fov = 40; }
      else if (S.mode === 1) { ang += dt * .06; cam.position.set(cx + Math.cos(ang) * T * 1.33, T * 2, cz + Math.sin(ang) * T * 1.33); cam.lookAt(cx, 0, cz); cam.fov = 40; init = false; }
      else { const tl = S.tele; tl.plan -= dt; if (tl.plan <= 0 || !tl.cible || tl.cible.some(v => v.abandon)) { tl.plan = 5; couper(); }
        if (tl.cible) { const P = POSTES[tl.poste]; cam.position.set(P.x, 4.5, P.z); const m = new THREE.Vector3((tl.cible[0].x + tl.cible[1].x) / 2, Y, (tl.cible[0].z + tl.cible[1].z) / 2);
          cv3.lerp(m, Math.min(1, dt * 5)); if (cv3.lengthSq() === 0) cv3.copy(m); const d = Math.hypot(P.x - m.x, P.z - m.z); cam.fov = Math.max(14, Math.min(45, 900 / Math.max(1, d))); cam.lookAt(cv3); }
        init = false; }
      const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
      if (cv.width !== Math.floor(w * r.getPixelRatio()) || cv.height !== Math.floor(h * r.getPixelRatio())) r.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix(); r.render(sc, cam);
    };
    S.liberer = function () { r.dispose(); r.forceContextLoss(); };
    return S;
  }
  // la vitrine : une voiture qui tourne sur un plateau, ou plusieurs côte à côte
  function vitrine(cv) {
    const r = new THREE.WebGLRenderer({canvas: cv, antialias: true, alpha: true}); r.setPixelRatio(Math.min(2, W.devicePixelRatio || 1)); r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    const sc = new THREE.Scene(); sc.background = null; // fond transparent : le dégradé de la page se voit derrière
    sc.add(new THREE.HemisphereLight(0xdfe8ff, 0x4a5a40, .62)); const d = new THREE.DirectionalLight(0xfff2dc, .85); d.position.set(60, 120, 40); d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
    Object.assign(d.shadow.camera, {left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 500}); sc.add(d, d.target);
    const cam = new THREE.PerspectiveCamera(30, 1, .1, 100);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(.82, .82, .05, 40), new THREE.MeshStandardMaterial({color: 0x18223a, roughness: .8})); plat.position.y = -.025; plat.receiveShadow = true; sc.add(plat);
    const fond = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.ShadowMaterial({opacity: .45})); fond.rotation.x = -Math.PI / 2; fond.position.y = -.03; fond.receiveShadow = true; sc.add(fond);
    const spot = new THREE.SpotLight(0xff8a3a, 1.1, 8, .5, .6); spot.position.set(2, 2.5, -1); sc.add(spot);
    const pivot = new THREE.Group(); sc.add(pivot); let cle = '', cote = false;
    return {
      montrer(objets) { const k = JSON.stringify(objets); if (k === cle) return; cle = k; while (pivot.children.length) pivot.remove(pivot.children[0]);
        cote = objets.length > 1; const n = objets.length;
        objets.forEach(([m, c], i) => { if (!Modeles.existe(m)) return; const o = Modeles.maillage(m, c); if (cote) { o.position.x = (i - (n - 1) / 2) * (n > 3 ? .95 : 1.15); o.rotation.y = -.5; } pivot.add(o); });
        plat.visible = !cote; },
      image(dt) { const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return;
        if (cv.width !== Math.floor(w * r.getPixelRatio()) || cv.height !== Math.floor(h * r.getPixelRatio())) r.setSize(w, h, false);
        cam.aspect = w / h; cam.updateProjectionMatrix();
        const n = pivot.children.length;
        if (cote) { pivot.rotation.y = 0; const rec = n > 3 ? 1.35 : 1; cam.position.set(0, 1.25 * rec, 2.9 * rec); cam.lookAt(0, .1, 0); } else { pivot.rotation.y += dt * .5; cam.position.set(0, 1.05, 2.7); cam.lookAt(0, .12, 0); }
        r.render(sc, cam); }};
  }
  window.Scene3D = W.Scene3D = {creer, vitrine};
})(window);

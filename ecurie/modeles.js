/* Écurie miniature : lecture des modèles de donnees.js (voitures, décor) et des tuiles de route (GLB), carrosserie repeinte. */
(function (W) {
  W.createImageBitmap = undefined; // GLTFLoader passe alors par une balise <img> (obligatoire dans un artefact)
  let M = null, routes = null, MAT = null;
  /* les roues : pièces séparées qui touchent le sol, aussi hautes que longues (un pneu), avec ce qu'elles contiennent (jante) ;
     les feux stop : à l'arrière de la carrosserie, à 60 % de la hauteur du hayon */
  function analyser(P, idx, nv) {
    const par = new Int32Array(nv).map((_, i) => i), fd = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; }, un = (a, b) => { a = fd(a); b = fd(b); if (a !== b) par[a] = b; };
    const vu = new Map(); for (let i = 0; i < nv; i++) { const k = P[i * 3] + ',' + P[i * 3 + 1] + ',' + P[i * 3 + 2]; if (vu.has(k)) un(i, vu.get(k)); else vu.set(k, i); }
    for (let t = 0; t < idx.length; t += 3) { un(idx[t], idx[t + 1]); un(idx[t], idx[t + 2]); }
    const C = new Map(); let ymin = 9;
    for (let i = 0; i < nv; i++) { const r = fd(i); let c = C.get(r); if (!c) C.set(r, c = {mn: [9, 9, 9], mx: [-9, -9, -9]}); for (let k = 0; k < 3; k++) { const v = P[i * 3 + k]; if (v < c.mn[k]) c.mn[k] = v; if (v > c.mx[k]) c.mx[k] = v; } ymin = Math.min(ymin, P[i * 3 + 1]); }
    const roues = [];
    for (const [r, c] of C) { const dx = c.mx[0] - c.mn[0], dy = c.mx[1] - c.mn[1], dz = c.mx[2] - c.mn[2];
      if (c.mn[1] < ymin + .02 && Math.abs(dx - dy) < .03 && dz < dy && dy > .08) { const cx = (c.mn[0] + c.mx[0]) / 2, cz = (c.mn[2] + c.mx[2]) / 2;
        let w = roues.find(w => Math.abs(w.c[0] - cx) < .06 && Math.abs(w.c[2] - cz) < .06);
        if (!w) roues.push(w = {c: [cx, (c.mn[1] + c.mx[1]) / 2, cz], r: dy / 2, mn: c.mn.slice(), mx: c.mx.slice(), comps: new Set()});
        for (let k = 0; k < 3; k++) { w.mn[k] = Math.min(w.mn[k], c.mn[k]); w.mx[k] = Math.max(w.mx[k], c.mx[k]); } w.comps.add(r); } }
    if (roues.length < 4 || roues.length > 6) return {roues: null};
    for (const w of roues) { w.c[2] = (w.mn[2] + w.mx[2]) / 2; for (const [r, c] of C) if (!w.comps.has(r) && c.mn[0] >= w.mn[0] - .01 && c.mx[0] <= w.mx[0] + .01 && c.mn[1] >= w.mn[1] - .01 && c.mx[1] <= w.mx[1] + .01 && c.mn[2] >= w.mn[2] - .03 && c.mx[2] <= w.mx[2] + .03) w.comps.add(r); }
    const roue = new Int8Array(nv).fill(-1); for (let i = 0; i < nv; i++) { const r = fd(i); roues.forEach((w, k) => { if (w.comps.has(r)) roue[i] = k; }); }
    // feux stop, d'après les sommets de la carrosserie
    let x0 = 9, zmax = 0; for (let i = 0; i < nv; i++) if (roue[i] < 0) { x0 = Math.min(x0, P[i * 3]); zmax = Math.max(zmax, Math.abs(P[i * 3 + 2])); }
    let ya = 9, yb = -9; for (let i = 0; i < nv; i++) if (roue[i] < 0 && P[i * 3] < x0 + .05) { ya = Math.min(ya, P[i * 3 + 1]); yb = Math.max(yb, P[i * 3 + 1]); }
    const fy = ya + .6 * (yb - ya), fz = zmax * .62; let fx = 9;
    for (let i = 0; i < nv; i++) if (roue[i] < 0 && Math.abs(P[i * 3 + 1] - fy) < .03 && Math.abs(Math.abs(P[i * 3 + 2]) - fz) < .06) fx = Math.min(fx, P[i * 3]);
    if (fx > 8) fx = x0;
    return {roue, roues: roues.map(w => ({c: w.c, r: w.r})), feu: [fx - .004, fy, fz]};
  }
  async function decoder() {
    const bin = Uint8Array.from(atob(BLOB), c => c.charCodeAt(0));
    const buf = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer(); let o = 0; const R = {};
    const teinte = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0; const hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (hh * 60 + 360) % 360; };
    const vive = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx > 60 && (mx - mn) / mx > .3; };
    for (const h of ENTETE) {
      const pos = new Int16Array(buf, o, h.nv * 3); o += h.nv * 6; const col = new Uint8Array(buf, o, h.nv); o += h.nv + (h.nv % 2); const idx = new Uint16Array(buf, o, h.ni); o += h.ni * 2;
      const P = new Float32Array(h.nv * 3), f = (h.L || 1) / 32000 / (h.q || 1); for (let i = 0; i < P.length; i++) P[i] = pos[i] * f;
      // carrosserie : la famille de teintes vives qui couvre le plus de triangles
      const n = new Array(h.pal.length).fill(0); for (let t = 0; t < h.ni; t += 3) n[col[idx[t]]]++;
      const seaux = new Array(24).fill(0); h.pal.forEach((c, i) => { if (vive(c)) seaux[Math.floor(teinte(c) / 15) % 24] += n[i]; });
      let bs = -1, best = 0; seaux.forEach((v, i) => { if (v > best) { best = v; bs = i; } });
      const peint = new Set(); if (bs >= 0) h.pal.forEach((c, i) => { if (!vive(c)) return; let dh = Math.abs(teinte(c) - (bs * 15 + 7.5)); dh = Math.min(dh, 360 - dh); if (dh <= 20) peint.add(i); });
      R[h.nom] = Object.assign({P, col: Array.from(col), idx: new Uint16Array(idx), pal: h.pal, peint}, h.nom.startsWith('deco-') ? {} : analyser(P, idx, h.nv));
    }
    return R;
  }
  const GEO = {};
  // partie : undefined = tout le modèle, -1 = sans les roues, k = la roue k (recentrée sur son axe)
  function geometrie(nom, teinte, partie) {
    const cle = nom + '|' + (teinte || '') + '|' + (partie === undefined ? '' : partie); if (GEO[cle]) return GEO[cle];
    const m = M[nom], g = new THREE.BufferGeometry(); let P = m.P;
    if (partie !== undefined) { const c = partie >= 0 ? m.roues[partie].c : [0, 0, 0]; P = new Float32Array(m.P.length); for (let i = 0; i < P.length; i++) P[i] = m.P[i] - c[i % 3]; }
    g.setAttribute('position', new THREE.BufferAttribute(P, 3));
    let I = m.idx; if (partie !== undefined) { const L = []; for (let t = 0; t < m.idx.length; t += 3) if (m.roue[m.idx[t]] === partie) L.push(m.idx[t], m.idx[t + 1], m.idx[t + 2]); I = new Uint16Array(L); }
    g.setIndex(new THREE.BufferAttribute(I, 1));
    const C = new Float32Array(m.P.length), T = teinte ? [1, 3, 5].map(k => parseInt(teinte.slice(k, k + 2), 16)) : null;
    for (let i = 0; i < m.col.length; i++) { let c = m.pal[m.col[i]]; if (T && m.peint.has(m.col[i])) { const L = (c[0] + c[1] + c[2]) / 3 / 255, f = .55 + .9 * L; c = T.map(v => Math.min(255, v * f)); }
      C[i * 3] = c[0] / 255; C[i * 3 + 1] = c[1] / 255; C[i * 3 + 2] = c[2] / 255; }
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); return GEO[cle] = g;
  }
  function matiere() { return MAT || (MAT = new THREE.MeshStandardMaterial({vertexColors: true, flatShading: true, roughness: .62, metalness: .05})); }
  function maillage(nom, teinte) { const me = new THREE.Mesh(geometrie(nom, teinte), matiere()); me.castShadow = true; me.receiveShadow = true; return me; }
  // une voiture de course : carrosserie + roues qui tournent ; .tourner(distance) fait rouler les roues ; .feu = position des feux stop
  function voiture(nom, teinte) {
    const m = M[nom], g = new THREE.Group();
    if (!m.roues) { g.add(maillage(nom, teinte)); g.roues = []; g.tourner = () => {}; g.feu = [-.5, .19, .17]; return g; }
    const corps = new THREE.Mesh(geometrie(nom, teinte, -1), matiere()); corps.castShadow = corps.receiveShadow = true; g.add(corps);
    g.roues = m.roues.map((w, k) => { const r = new THREE.Mesh(geometrie(nom, teinte, k), matiere()); r.position.set(w.c[0], w.c[1], w.c[2]); r.castShadow = true; g.add(r); return r; });
    const rayon = m.roues[0].r; g.angle = 0;
    g.tourner = d => { g.angle -= Math.min(d / rayon, .38); // au-delà de ~0,4 rad par image, l'œil voit les jantes tourner à l'envers
      for (const r of g.roues) r.rotation.z = g.angle; };
    g.feu = m.feu; return g;
  }
  function glb(nom) { return new Promise((ok, ko) => { const b = Uint8Array.from(atob(GLB[nom]), c => c.charCodeAt(0)).buffer;
    new THREE.GLTFLoader().parse(b, '', g => { g.scene.traverse(m => { if (m.isMesh) { m.receiveShadow = true; if (m.material) { m.material.metalness = 0; m.material.roughness = .9; } } }); ok(g.scene); }, ko); }); }
  let promesse = null;
  // tout charger une fois (renvoie une promesse)
  function charger() { return promesse || (promesse = Promise.all([decoder(), glb('Road1'), glb('Road1_Curve3'), glb('Road1_Curve4')]).then(([m, a, b, c]) => { M = m; routes = {S: a, 18: b, 42: c}; return true; })); }
  window.Modeles = W.Modeles = {charger, maillage, voiture, routes: () => routes, existe: nom => !!(M && M[nom])};
})(window);

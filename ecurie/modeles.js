/* Écurie miniature : lecture des modèles de donnees.js (voitures, décor) et des tuiles de route (GLB), carrosserie repeinte. */
(function (W) {
  W.createImageBitmap = undefined; // GLTFLoader passe alors par une balise <img> (obligatoire dans un artefact)
  let M = null, routes = null, MAT = null;
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
      R[h.nom] = {P, col: Array.from(col), idx: new Uint16Array(idx), pal: h.pal, peint};
    }
    return R;
  }
  const GEO = {};
  function geometrie(nom, teinte) {
    const cle = nom + '|' + (teinte || ''); if (GEO[cle]) return GEO[cle];
    const m = M[nom], g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(m.P, 3)); g.setIndex(new THREE.BufferAttribute(m.idx, 1));
    const C = new Float32Array(m.P.length), T = teinte ? [1, 3, 5].map(k => parseInt(teinte.slice(k, k + 2), 16)) : null;
    for (let i = 0; i < m.col.length; i++) { let c = m.pal[m.col[i]]; if (T && m.peint.has(m.col[i])) { const L = (c[0] + c[1] + c[2]) / 3 / 255, f = .55 + .9 * L; c = T.map(v => Math.min(255, v * f)); }
      C[i * 3] = c[0] / 255; C[i * 3 + 1] = c[1] / 255; C[i * 3 + 2] = c[2] / 255; }
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); return GEO[cle] = g;
  }
  function maillage(nom, teinte) { if (!MAT) MAT = new THREE.MeshStandardMaterial({vertexColors: true, flatShading: true, roughness: .62, metalness: .05});
    const me = new THREE.Mesh(geometrie(nom, teinte), MAT); me.castShadow = true; me.receiveShadow = true; return me; }
  function glb(nom) { return new Promise((ok, ko) => { const b = Uint8Array.from(atob(GLB[nom]), c => c.charCodeAt(0)).buffer;
    new THREE.GLTFLoader().parse(b, '', g => { g.scene.traverse(m => { if (m.isMesh) { m.receiveShadow = true; if (m.material) { m.material.metalness = 0; m.material.roughness = .9; } } }); ok(g.scene); }, ko); }); }
  let promesse = null;
  // tout charger une fois (renvoie une promesse)
  function charger() { return promesse || (promesse = Promise.all([decoder(), glb('Road1'), glb('Road1_Curve3'), glb('Road1_Curve4')]).then(([m, a, b, c]) => { M = m; routes = {S: a, 18: b, 42: c}; return true; })); }
  W.Modeles = {charger, maillage, routes: () => routes, existe: nom => !!(M && M[nom])};
})(window);

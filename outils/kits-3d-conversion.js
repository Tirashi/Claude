// Convertit des modèles FBX ou OBJ (chargeurs Three.js r128 lancés dans Chromium) au format compact des maquettes 3D :
// window.<VARIABLE> = {nom: [[sommets, indices, base64, n° de texture ou -1, couleur], …]} et <VARIABLE>_TEXS = [images].
// Il faut une page « vide.html » qui charge three.min.js, fflate.min.js, FBXLoader.js et OBJLoader.js (npm pack three@0.128.0).
// Configuration JSON : { variable, dossier (file:///…/), texture_obj?, rotation, echelle, epaisseur, modeles: [[nom, fichier, "tuile"|"objet"], …] }
// (Xeeh : rotation 1.5708, echelle 1, epaisseur 0.1 ; Wildenza : echelle 0.00432, epaisseur 72). Lecture : maquettes/duche-kits.html.
// node conv.js <config.json> <sortie.js> : convertit des FBX/OBJ (chargeurs Three.js r128) au format compact des maquettes
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  p.on('console', m => { if (/^INFO/.test(m.text())) console.log(m.text()); });
  await p.goto('file://' + (process.env.VIDE || __dirname + '/vide.html'));
  const res = await p.evaluate(async (cfg) => {
    const texs = [], texIdx = new Map(), out = {};
    const imgData = img => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); return c.toDataURL('image/png'); };
    const charger = f => new Promise((ok, ko) => (f.endsWith('.fbx') ? new THREE.FBXLoader() : new THREE.OBJLoader()).load(cfg.dossier + f, ok, null, ko));
    const attendreImages = () => new Promise(ok => setTimeout(ok, 300));
    for (const [nom, fichier, genre] of cfg.modeles) {
      const o = await charger(fichier);
      if (fichier.endsWith('.obj') && cfg.texture_obj) {
        const t = await new Promise(ok => new THREE.TextureLoader().load(cfg.dossier + cfg.texture_obj, ok));
        o.traverse(m => { if (m.isMesh) m.material = new THREE.MeshBasicMaterial({ map: t }); });
      }
      await attendreImages();
      o.rotation.y = cfg.rotation || 0; o.updateMatrixWorld(true);
      // regroupe les triangles par texture
      const parts = new Map(); let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      o.traverse(m => {
        if (!m.isMesh) return;
        const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
        g.applyMatrix4(m.matrixWorld);
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        const groupes = g.groups.length ? g.groups : [{ start: 0, count: g.attributes.position.count, materialIndex: 0 }];
        for (const gr of groupes) {
          const mt = mats[gr.materialIndex] || mats[0];
          let ti = -1;
          if (mt.map && mt.map.image) { const d = imgData(mt.map.image); if (!texIdx.has(d)) { texIdx.set(d, texs.length); texs.push(d); } ti = texIdx.get(d); }
          const cle = ti + ':' + (ti < 0 ? mt.color.getHex() : 0);
          const P = parts.get(cle) || { ti, col: mt.color.getHex(), pos: [], nor: [], uv: [] }; parts.set(cle, P);
          const a = g.attributes;
          for (let i = gr.start; i < gr.start + gr.count; i++) {
            const v = [a.position.getX(i), a.position.getY(i), a.position.getZ(i)];
            v.forEach((c, k) => { mn[k] = Math.min(mn[k], c); mx[k] = Math.max(mx[k], c); });
            P.pos.push(...v); P.nor.push(a.normal.getX(i), a.normal.getY(i), a.normal.getZ(i));
            P.uv.push(a.uv ? a.uv.getX(i) : 0.5, a.uv ? a.uv.getY(i) : 0.5);
          }
        }
      });
      // recentre : milieu en x/z ; une tuile a son dessus à 0 (épaisseur de référence), un objet est posé sur 0
      const s = cfg.echelle, cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2, dy = genre === 'tuile' ? mn[1] + cfg.epaisseur : mn[1];
      out[nom] = [...parts.values()].map(P => {
        const n = P.pos.length / 3, buf = new ArrayBuffer(n * 6 + n * 3 + n * 4 + n * 2 + 4), dv = new DataView(buf);
        let o2 = 0, umin = 1e9, umax = -1e9;
        for (let i = 0; i < n; i++) { dv.setInt16(o2, Math.round((P.pos[3 * i] - cx) * s * 4096), true); dv.setInt16(o2 + 2, Math.round((P.pos[3 * i + 1] - dy) * s * 4096), true); dv.setInt16(o2 + 4, Math.round((P.pos[3 * i + 2] - cz) * s * 4096), true); o2 += 6; }
        for (let i = 0; i < n * 3; i++) dv.setInt8(o2++, Math.round(Math.max(-1, Math.min(1, P.nor[i])) * 127));
        for (let i = 0; i < n * 2; i++) { const u = P.uv[i]; umin = Math.min(umin, u); umax = Math.max(umax, u); dv.setInt16(o2, Math.round(Math.max(-7.9, Math.min(7.9, u)) * 4096), true); o2 += 2; }
        for (let i = 0; i < n; i++) { dv.setUint16(o2, i, true); o2 += 2; }
        let bin = ''; const u8 = new Uint8Array(buf, 0, o2); for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
        return [n, n, btoa(bin), P.ti, P.col];
      });
      console.log('INFO', nom, fichier, 'parties', out[nom].length, 'taille', ((mx[0] - mn[0]) * s).toFixed(2), ((mx[1] - mn[1]) * s).toFixed(2), ((mx[2] - mn[2]) * s).toFixed(2));
    }
    return { out, texs };
  }, cfg);
  fs.writeFileSync(process.argv[3], `window.${cfg.variable}=${JSON.stringify(res.out)};\nwindow.${cfg.variable}_TEXS=${JSON.stringify(res.texs)};\n`);
  console.log('octets', fs.statSync(process.argv[3]).size, 'textures', res.texs.length);
  await b.close();
})();

/* =====================================================================
   LA BOUTIQUE DE CARTES · le MONDE 3D (Three.js r128) : la boutique
   (sol, murs, porte, enseigne, terrain « À VENDRE »), les meubles et ce
   qu'il y a dedans (boosters sur les rayons, cartes dans les vitrines),
   la caméra qui pivote autour, le fantôme de l'aménagement, et les
   clients qui REJOUENT la journée rendue par bouJour (la 3D ne décide
   rien : specs/boutique-de-cartes.md § 15).
   Modèles Kenney (modeles.js) ; cartes dessinées par dessin-cartes.js.
   ===================================================================== */
'use strict';
const BouMonde = (() => {
  const PERSOS = ['character-female-a', 'character-female-b', 'character-female-c', 'character-female-d', 'character-male-a', 'character-male-c', 'character-male-d', 'character-male-e'];
  const M = {}, CLIPS = {}, animes = [];
  let rendu, scene, cam, canvas, soleil, etat = null;
  const coque = new THREE.Group(), meublesG = new THREE.Group(), terrainG = new THREE.Group(), clientsG = new THREE.Group();
  const murs = [], objets = new Map();
  let portes = null;   // les deux battants de la porte : ils s'ouvrent quand un client approche
  let niveauConstruit = -1, grille = null, panneau = null;
  const SIEGE = 0.22, DOS = 0;   // joueurs de la table : hauteur de l'assise, recul vers le dossier
  const SENS_PORTE = 1;   // les battants s'ouvrent vers l'intérieur
  let azimut = Math.PI * 0.3, vise = azimut, zoom = 1;
  let fantome = null, selection = null, vitesse = 1, enPause = false;
  const ecoute = { meuble() {}, terrain() {}, vide() {}, fantome() {}, vente() {} };

  /* ---------- chargement ---------- */
  async function init(cv) {
    canvas = cv;
    rendu = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    rendu.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); rendu.outputEncoding = THREE.sRGBEncoding;
    rendu.shadowMap.enabled = true; rendu.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6b5f8a, 0.75));
    soleil = new THREE.DirectionalLight(0xffffff, 0.85); soleil.castShadow = true;
    soleil.shadow.mapSize.set(1024, 1024); Object.assign(soleil.shadow.camera, { left: -10, right: 10, top: 10, bottom: -10, near: 1, far: 40 }); soleil.shadow.bias = -0.0015;
    scene.add(soleil, soleil.target, coque, meublesG, terrainG, clientsG);
    cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    // l'atlas commun des packs Kenney, en blob: (un artefact interdit fetch sur une adresse data:)
    const atlas = URL.createObjectURL(new Blob([Uint8Array.from(atob(BOU_ATLAS.split(',')[1]), c => c.charCodeAt(0))], { type: 'image/png' }));
    const gestion = new THREE.LoadingManager(); gestion.setURLModifier(u => /colormap\.png$/.test(u) ? atlas : u);
    const chargeur = new THREE.GLTFLoader(gestion);
    for (const n in BOU_MODELES) {
      try {
        const g = await new Promise((ok, ko) => chargeur.parse(Uint8Array.from(atob(BOU_MODELES[n]), c => c.charCodeAt(0)).buffer, '', ok, ko));
        M[n] = g.scene; if (g.animations.length) CLIPS[n] = g.animations;
        g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      } catch (err) { console.error('modèle', n, err); }   // un modèle en moins n'empêche pas de jouer
    }
    brancherToucher(); cadrer(); addEventListener('resize', cadrer);
    let avant = performance.now();
    const boucle = t => { requestAnimationFrame(boucle); const dt = Math.min(0.05, (t - avant) / 1000); avant = t; animer(dt); };
    requestAnimationFrame(boucle);
  }
  const modele = (n, ech = 1) => { const o = M[n] ? M[n].clone() : new THREE.Group(); o.scale.setScalar(ech); return o; };
  const matiere = (coul, opt) => new THREE.MeshStandardMaterial(Object.assign({ color: coul, roughness: 0.7 }, opt));
  function texte2d(w, h, dessin) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; dessin(cv.getContext('2d'), cv); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; }

  /* ---------- personnages ---------- */
  function personnage(n) {
    if (!M[n]) return null;
    const o = THREE.SkeletonUtils.clone(M[n]); o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.frustumCulled = false; } });
    const p = { o, mixer: new THREE.AnimationMixer(o), clips: CLIPS[n] || [], act: null }; animes.push(p); return p;
  }
  function jouer(p, nom, une = false) {
    if (!p) return; const clip = p.clips.find(c => c.name === nom); if (!clip) return;
    const a = p.mixer.clipAction(clip); if (p.act === a && !une) return;
    a.reset(); a.setLoop(une ? THREE.LoopOnce : THREE.LoopRepeat, Infinity); a.clampWhenFinished = une;
    if (p.act && p.act !== a) p.act.fadeOut(0.2); a.fadeIn(0.2).play(); p.act = a;
  }
  function oublier(g) { g.traverse(o => { const i = animes.findIndex(p => p.o === o); if (i >= 0) animes.splice(i, 1); }); }

  /* ---------- cartes, boosters et produits ---------- */
  const texCartes = new Map(), geoCarte = new THREE.PlaneGeometry(0.14, 0.18);
  function texCarte(id) {
    if (!texCartes.has(id)) { const t = new THREE.CanvasTexture(BouCartes.dessiner(bouCarte(etat, id))); t.encoding = THREE.sRGBEncoding; t.magFilter = THREE.NearestFilter; t.anisotropy = 4; texCartes.set(id, t); }
    return texCartes.get(id);
  }
  function carte3D(id, ech = 1) { const m = new THREE.Mesh(geoCarte, new THREE.MeshStandardMaterial({ map: texCarte(id), roughness: 0.45 })); m.scale.setScalar(ech); m.castShadow = true; return m; }
  const matsProduits = {};
  // l'emballage d'un booster ou d'un coffret : couleurs de l'élément vedette de l'extension, son monstre légendaire
  function texPaquet(n) {
    const X = bouExtension(etat, n), S = BouCartes.STYLE[X.theme], leg = bouCarte(etat, X.cartes[39]);
    return texte2d(64, 96, ctx => {
      const g = ctx.createLinearGradient(0, 0, 64, 96); g.addColorStop(0, S.ciel[1]); g.addColorStop(1, S.f); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 96);
      ctx.fillStyle = '#e8e3f0'; ctx.fillRect(0, 0, 64, 9); ctx.imageSmoothingEnabled = false; ctx.drawImage(BouCartes.bete(leg.monstre, 1), 8, 30, 48, 48);
    });
  }
  function matPaquet(n) {
    return matsProduits['p' + n] || (matsProduits['p' + n] = [0, 0, 0, 0, 1, 1].map(k => k ? new THREE.MeshStandardMaterial({ map: texPaquet(n), roughness: 0.3, metalness: 0.25 }) : matiere(BouCartes.STYLE[bouExtension(etat, n).theme].f, { roughness: 0.4 })));
  }
  const geoBooster = new THREE.BoxGeometry(0.11, 0.16, 0.025), geoCoffret = new THREE.BoxGeometry(0.22, 0.15, 0.07);
  // ce qu'on voit d'un produit sur une étagère, à la place d'un carton du rayon
  function produit3D(cle) {
    const [a, n] = cle.split(':'), g = new THREE.Group();
    if (a === 'booster') for (let q = 0; q < 3; q++) { const b = new THREE.Mesh(geoBooster, matPaquet(+n)); b.position.set((q - 1) * 0.12, 0.08, 0); b.rotation.x = -0.12; b.castShadow = true; g.add(b); }
    else if (a === 'coffret') { const b = new THREE.Mesh(geoCoffret, matPaquet(+n)); b.position.y = 0.075; g.add(b); }
    else if (a === 'pochettes') for (let q = 0; q < 4; q++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.012), matiere(0x9fd4f0, { transparent: true, opacity: 0.85 })); b.position.set((q - 1.5) * 0.07, 0.05, q * 0.005); g.add(b); }
    else if (a === 'classeur') [0x7d2fb8, 0x2f6fb8].forEach((c, q) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.17, 0.14), matiere(c)); b.position.set((q - 0.5) * 0.08, 0.085, 0); g.add(b); });
    else if (a === 'figurine') for (let q = 0; q < 3; q++) g.add(figurine(q));
    return g;
  }
  function figurine(q) {
    const f = new THREE.Group(), coul = [0xe5534b, 0x4a8fe7, 0x2fae7a][q % 3];
    const socle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.02, 10), matiere(0x2d2a3e)); socle.position.y = 0.01; f.add(socle);
    const corps = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.08, 8), matiere(coul)); corps.position.y = 0.06; f.add(corps);
    const tete = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), matiere(0xffd9b0)); tete.position.y = 0.11; f.add(tete);
    f.position.x = (q - 1) * 0.1; return f;
  }

  /* ---------- les meubles ---------- */
  // ce qui change l'apparence d'un meuble : on ne le refait que si ça change
  function signature(m) {
    const s = [m.type, m.x, m.z, m.r];
    if (m.produits) s.push(m.produits.map(c => c && (etat.stock[c] > 0) ? c : '').join(','));
    if (etat.vitrines[m.id]) s.push(etat.vitrines[m.id].map(p => p ? p.id : '').join(','));
    if (m.type === 'affiche') s.push(bouDerniere(etat).n);
    if (BOU_MEUBLES[m.type].vend) s.push(BOU_MEUBLES[m.type].vend.map(c => etat.stock[c] > 0 ? 1 : 0).join(''));
    return s.join('|');
  }
  function fabMeuble(m) {
    const g = new THREE.Group(), t = m.type;
    if (t === 'caisse') {
      g.add(modele('cash-register'));
      const p = personnage('character-employee'); if (p) { p.o.position.set(0, 0, -0.45); g.add(p.o); jouer(p, 'idle'); }
    } else if (t === 'rayon') {
      const o = modele('shelf-boxes'); g.add(o); o.updateMatrixWorld(true);
      const places = []; o.traverse(c => { if (/carton/i.test(c.name)) places.push(c); });
      places.sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
      places.forEach((c, k) => {
        c.visible = false;
        const cle = m.produits[k % 3];
        if (!cle || !(etat.stock[cle] > 0)) return;
        const p = new THREE.Vector3(); c.getWorldPosition(p);
        const pr = produit3D(cle); pr.position.set(p.x, p.y - 0.06, p.z); g.add(pr);
      });
    } else if (t === 'vitrine') {
      g.add(modele('freezer'));
      (etat.vitrines[m.id] || []).forEach((p, i) => {
        if (!p) return;
        const c = carte3D(p.id); c.position.set(-0.27 + (i % 4) * 0.18, 0.37, -0.12 + Math.floor(i / 4) * 0.24); c.rotation.x = -Math.PI / 2 + 0.25; c.userData.place = i; g.add(c);
      });
      const v = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.1, 0.56), matiere(0xd8f2ff, { transparent: true, opacity: 0.22, roughness: 0.05 })); v.position.y = 0.41; g.add(v);
    } else if (t === 'grande') {
      g.add(modele('freezers-standing'));
      (etat.vitrines[m.id] || []).forEach((p, i) => {
        if (!p) return;
        const c = carte3D(p.id, 1.25); c.position.set(-0.3 + i * 0.2, 0.55 + (i % 2) * 0.24, 0.32); c.userData.place = i; g.add(c);
      });
    } else if (t === 'table') {
      const E = 1.5, tb = modele('table', E); tb.position.set(-0.42 * E, 0, 0.22 * E); g.add(tb);
      // une chaise sous chaque joueur (la chaise Kenney fait 0,2 × 0,2, son coin à l'origine), le joueur assis à la hauteur de l'assise
      [[-0.52, 0], [0.52, Math.PI]].forEach(([z, r], i) => {
        const c = modele('chair', E), s = r ? -1 : 1; c.position.set(-s * 0.15, 0, z + s * 0.15); c.rotation.y = r; g.add(c);
        const p = personnage(PERSOS[Math.abs(m.id * 3 + i) % PERSOS.length]); if (p) { p.o.position.set(0, SIEGE, z + s * DOS); p.o.rotation.y = r; g.add(p.o); jouer(p, 'sit'); }
      });
      const els = bouCatalogue(etat.graine).extensions[0].cartes;
      for (let k = 0; k < 3; k++) for (const z of [-0.13, 0.13]) { const c = carte3D(els[Math.abs(m.id * 7 + k * 3 + (z > 0 ? 1 : 0)) % 20]); c.position.set(-0.18 + k * 0.18, 0.505, z); c.rotation.set(-Math.PI / 2, 0, z > 0 ? Math.PI : 0); g.add(c); }
    } else if (t === 'classeurs') {
      const o = modele('bookcaseOpen', 1.5); o.position.set(-0.3, 0, -0.2); g.add(o);
    } else if (t === 'plante') {
      const o = modele('pottedPlant', 1.6); o.position.set(-0.2, 0, -0.2); g.add(o);
    } else if (t === 'lampe') {
      const o = modele('lampSquareFloor', 1.6); o.position.set(-0.2, 0, -0.2); g.add(o);
    } else if (t === 'tapis') {
      const tex = texte2d(128, 128, c => { c.fillStyle = '#f5b82e'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#3f8f6b'; c.fillRect(8, 8, 112, 112); c.strokeStyle = '#ffffff66'; c.lineWidth = 3; c.strokeRect(20, 20, 88, 88); c.beginPath(); c.arc(64, 64, 18, 0, 7); c.stroke(); });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.96), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })); p.rotation.x = -Math.PI / 2; p.position.y = 0.03; p.receiveShadow = true; g.add(p);
    } else if (t === 'affiche') {
      const pied = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), matiere(0x2d2a3e)); pied.position.set(0, 0.2, 0); g.add(pied);
      const c = carte3D(bouDerniere(etat).cartes[39], 3.6); c.position.set(0, 0.68, 0.03); g.add(c);
      const fond = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.7, 0.03), matiere(0x2d2a3e)); fond.position.set(0, 0.68, 0.005); fond.castShadow = true; g.add(fond);
    } else if (t === 'arcade') {
      const corps = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.95, 0.45), matiere(0x5b3fa0)); corps.position.y = 0.475; corps.castShadow = true; g.add(corps);
      const ecran = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.28), new THREE.MeshBasicMaterial({ map: texte2d(96, 72, c => {
        c.fillStyle = '#120f1e'; c.fillRect(0, 0, 96, 72); c.imageSmoothingEnabled = false;
        const els = bouCatalogue(etat.graine).extensions[0].cartes; c.drawImage(BouCartes.bete(bouCarte(etat, els[2]).monstre, 1), 8, 24, 32, 32); c.drawImage(BouCartes.bete(bouCarte(etat, els[9]).monstre, 1), 56, 24, 32, 32);
        c.fillStyle = '#ffd84d'; c.font = '10px monospace'; c.fillText('VS', 41, 44); c.fillStyle = '#e5534b'; c.fillRect(8, 8, 30, 4); c.fillStyle = '#2fae7a'; c.fillRect(58, 8, 30, 4);
      }) }));
      ecran.position.set(0, 0.72, 0.226); g.add(ecran);
      const pupitre = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.18), matiere(0x2d2a3e)); pupitre.position.set(0, 0.5, 0.3); g.add(pupitre);
      [0xe5534b, 0xf5b82e].forEach((c, i) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.02, 8), matiere(c)); b.position.set(0.05 + i * 0.07, 0.54, 0.32); g.add(b); });
    } else if (t === 'figurines') {
      const o = modele('bookcaseOpenLow', 1.5); o.position.set(-0.3, 0, -0.2); g.add(o);
      if (etat.stock.figurine > 0) for (const y of [0.18, 0.42]) { const f = new THREE.Group(); for (let q = 0; q < 3; q++) f.add(figurine(q + (y > 0.2 ? 1 : 0))); f.position.set(0, y, 0.02); g.add(f); }
    }
    g.traverse(o => { o.userData.meuble = m.id; if (o.isMesh) o.castShadow = true; });
    return g;
  }
  function placerGroupe(g, type, x, z, r) {
    const [w, d] = BOU_MEUBLES[type].taille, [a, b] = r % 2 ? [d, w] : [w, d];
    g.position.set(x + (a - 1) / 2, 0, z + (b - 1) / 2); g.rotation.y = r * Math.PI / 2;
  }
  function majMeubles() {
    const vus = new Set();
    for (const m of etat.meubles) {
      vus.add(m.id);
      if (fantome && fantome.deplace === m.id) continue;
      const s = signature(m), o = objets.get(m.id);
      if (o && o.sig === s) continue;
      if (o) { meublesG.remove(o.g); oublier(o.g); }
      const g = fabMeuble(m); placerGroupe(g, m.type, m.x, m.z, m.r); meublesG.add(g);
      objets.set(m.id, { g, sig: s });
    }
    for (const [id, o] of objets) if (!vus.has(id)) { meublesG.remove(o.g); oublier(o.g); objets.delete(id); }
    if (selection && objets.has(selection)) teinter(objets.get(selection).g, 0xf5b82e);
  }

  /* ---------- la coque : sol, murs, porte, enseigne, trottoir ---------- */
  function construireCoque() {
    coque.clear(); murs.length = 0;
    const { L, P } = bouTaille(etat);
    for (let x = 0; x < L; x++) for (let z = 0; z < P; z++) { const f = modele('floor'); f.position.set(x, 0, z); coque.add(f); }
    const mur = (n, x, z, r, nx, nz) => { const o = modele(n); o.position.set(x, 0, z); o.rotation.y = r * Math.PI / 2; coque.add(o); murs.push({ o, nx, nz }); };
    for (let x = 0; x < L; x++) mur(x % 3 === 2 ? 'wall-window' : 'wall', x, -0.5, 0, 0, -1);
    for (let x = 0; x < L; x++) mur(x === BOU_PORTE ? 'wall-door-rotate' : x % 3 === 0 ? 'wall-window' : 'wall', x, P - 0.5, 2, 0, 1);
    const pm = murs.find(m => m.o.getObjectByName('door-left'));
    portes = pm ? { g: pm.o.getObjectByName('door-left'), d: pm.o.getObjectByName('door-right'), x: BOU_PORTE, z: P - 0.5, a: 0 } : null;
    for (let z = 0; z < P; z++) mur(z % 3 === 1 ? 'wall-window' : 'wall', -0.5, z, 1, -1, 0);
    for (let z = 0; z < P; z++) mur(z % 3 === 1 ? 'wall-window' : 'wall', L - 0.5, z, 3, 1, 0);
    const ens = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.35), new THREE.MeshBasicMaterial({ map: texte2d(512, 128, c => {
      c.fillStyle = '#2d2a3e'; c.fillRect(0, 0, 512, 128); c.font = '76px "Luckiest Guy", sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffcf2e'; c.fillText('LE REPAIRE', 256, 96);
    }) }));
    ens.position.set(BOU_PORTE + 1.2, 0.8, P - 0.5 + 0.31); coque.add(ens); murs.push({ o: ens, nx: 0, nz: 1 });
    const tr = new THREE.Mesh(new THREE.PlaneGeometry(L + 1, 1.2), matiere(0x8d8aa0, { roughness: 1 })); tr.rotation.x = -Math.PI / 2; tr.position.set((L - 1) / 2, -0.01, P + 0.3); tr.receiveShadow = true; coque.add(tr);
    // le quadrillage de l'aménagement
    if (grille) scene.remove(grille);
    const pts = [];
    for (let x = 0; x <= L; x++) pts.push(x - 0.5, 0.035, -0.5, x - 0.5, 0.035, P - 0.5);
    for (let z = 0; z <= P; z++) pts.push(-0.5, 0.035, z - 0.5, L - 0.5, 0.035, z - 0.5);
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const visible = grille ? grille.visible : false;
    grille = new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0x8a63d2, transparent: true, opacity: 0.55 })); grille.visible = visible; scene.add(grille);
    niveauConstruit = etat.niveau; construireTerrain(); cadrer();
  }
  // le terrain du prochain agrandissement : herbe, pointillés, panneau « À VENDRE »
  function construireTerrain() {
    terrainG.clear(); panneau = null;
    const A = BOU_TAILLES[etat.niveau + 1], { L, P } = bouTaille(etat); if (!A) return;
    const zones = [];
    if (A.L > L) zones.push([L, 0, A.L - L, P]);
    if (A.P > P) zones.push([0, P, A.L, A.P - P]);
    for (const [x, z, w, h] of zones) {
      const tex = texte2d(64 * w, 64 * h, (c, cv) => {
        c.fillStyle = '#7fbf6a'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#74b360';
        const R = bouRng('herbe', w, h); for (let i = 0; i < w * h * 6; i++) c.fillRect(R() * cv.width, R() * cv.height, 6, 3);
        c.setLineDash([16, 12]); c.lineWidth = 6; c.strokeStyle = '#fffaf0'; c.strokeRect(6, 6, cv.width - 12, cv.height - 12);
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 1 }));
      m.rotation.x = -Math.PI / 2; m.position.set(x - 0.5 + w / 2, -0.03, z - 0.5 + h / 2); m.receiveShadow = true; m.userData.terrain = true; terrainG.add(m);
    }
    const [x, z, w, h] = zones[0];
    const tex = texte2d(256, 160, c => {
      c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 256, 160); c.lineWidth = 10; c.strokeStyle = '#e5534b'; c.strokeRect(5, 5, 246, 150);
      c.textAlign = 'center'; c.fillStyle = '#e5534b'; c.font = '44px "Luckiest Guy", sans-serif'; c.fillText('À VENDRE', 128, 68);
      c.fillStyle = '#2d2a3e'; c.font = '600 40px Fredoka, sans-serif'; c.fillText(A.prix.toLocaleString('fr-FR') + ' €', 128, 124);
    });
    panneau = new THREE.Group();
    const planche = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.04), [0, 0, 0, 0, 1, 1].map(k => k ? new THREE.MeshStandardMaterial({ map: tex }) : matiere(0xc98a4b)));
    planche.position.y = 0.75; planche.castShadow = true; panneau.add(planche);
    const poteau = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.06), matiere(0x8a5a2b)); poteau.position.y = 0.3; poteau.castShadow = true; panneau.add(poteau);
    panneau.position.set(x - 0.5 + w / 2, 0, z - 0.5 + h / 2); panneau.traverse(o => o.userData.terrain = true); terrainG.add(panneau);
  }
  // nouvelles dalles qui sortent du sol après un agrandissement
  function pousser(avant) {
    coque.children.forEach(o => { if (o.position.y === 0 && (o.position.x >= avant.L || o.position.z >= avant.P)) { o.scale.setScalar(0.01); o.userData.pousse = 0; } });
  }

  /* ---------- la caméra ---------- */
  function cadrer() {
    if (!rendu) return;
    const w = innerWidth, h = innerHeight; rendu.setSize(w, h, false);
    const T = etat ? bouTaille(etat) : { L: 6, P: 5 }, a = w / h, demi = Math.max(T.L, T.P) * 0.5 + 0.9;
    cam.left = -demi; cam.right = demi; cam.top = demi / a; cam.bottom = -demi / a; cam.updateProjectionMatrix();
  }
  function placerCamera() {
    const T = bouTaille(etat), cx = (T.L - 1) / 2, cz = (T.P - 1) / 2, d = 14;
    cam.position.set(cx + Math.sin(azimut) * d, d * 0.9, cz + Math.cos(azimut) * d); cam.lookAt(cx, 0, cz);
    // la boutique un peu au-dessus du milieu de l'écran (les boutons sont en bas)
    const haut = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion); cam.position.addScaledVector(haut, -0.7);
    cam.zoom = zoom; cam.updateProjectionMatrix();
    soleil.position.set(cx + 5, 12, cz + 7); soleil.target.position.set(cx, 0, cz);
    const vx = Math.sin(azimut), vz = Math.cos(azimut);
    for (const m of murs) m.o.visible = m.nx * vx + m.nz * vz < 0.25;   // les murs entre la caméra et la boutique sont cachés
    if (panneau) panneau.rotation.y = azimut;
  }
  function tourner(sens) { vise = Math.round((vise - Math.PI / 4) / (Math.PI / 2)) * (Math.PI / 2) + Math.PI / 4 + sens * Math.PI / 2; }

  /* ---------- toucher : tourner, poser, choisir ---------- */
  const rayon = new THREE.Raycaster(), sol = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const pointeur = e => new THREE.Vector2(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  function caseSous(e) { rayon.setFromCamera(pointeur(e), cam); const p = new THREE.Vector3(); return rayon.ray.intersectPlane(sol, p) ? [Math.round(p.x), Math.round(p.z)] : null; }
  let appui = null;
  function brancherToucher() {
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', e => {
      appui = { x: e.clientX, y: e.clientY, az: vise, bouge: false, dc: [0, 0] };
      if (fantome) { const c = caseSous(e); if (c && Math.hypot(c[0] - fantome.x, c[1] - fantome.z) <= 1.6) appui.dc = [fantome.x - c[0], fantome.z - c[1]]; appui.fantome = true; }
    });
    canvas.addEventListener('pointermove', e => {
      if (!appui) return;
      if (Math.hypot(e.clientX - appui.x, e.clientY - appui.y) > 8) appui.bouge = true;
      if (!appui.bouge) return;
      if (appui.fantome) { const c = caseSous(e); if (c) bougerFantome(c[0] + appui.dc[0], c[1] + appui.dc[1]); return; }
      vise = appui.az - (e.clientX - appui.x) * 0.008;
    });
    canvas.addEventListener('pointerup', e => {
      const a = appui; appui = null; if (!a || a.bouge) return;
      if (fantome) { const c = caseSous(e); if (c) bougerFantome(c[0], c[1]); return; }
      rayon.setFromCamera(pointeur(e), cam);
      if (rayon.intersectObjects(terrainG.children, true).length) return ecoute.terrain();
      const h = rayon.intersectObjects(meublesG.children, true).find(i => i.object.userData.meuble);
      if (h) return ecoute.meuble(etat.meubles.find(m => m.id === h.object.userData.meuble));
      ecoute.vide(caseSous(e));
    });
    canvas.addEventListener('wheel', e => { zoom = Math.min(2.2, Math.max(0.7, zoom * (e.deltaY > 0 ? 0.9 : 1.1))); }, { passive: true });
  }

  /* ---------- l'aménagement : quadrillage, fantôme, sélection ---------- */
  function teinter(g, coul) {
    g.traverse(o => {
      if (!o.isMesh) return;
      if (!o.userData.matOrig) o.userData.matOrig = o.material;
      const l = (Array.isArray(o.userData.matOrig) ? o.userData.matOrig : [o.userData.matOrig]).map(m => { const n = m.clone(); n.transparent = true; n.opacity = 0.8; if (n.emissive) { n.emissive.set(coul); n.emissiveIntensity = 0.45; } return n; });
      o.material = l.length === 1 ? l[0] : l;
    });
  }
  function deteindre(g) { g.traverse(o => { if (o.isMesh && o.userData.matOrig) { o.material = o.userData.matOrig; delete o.userData.matOrig; } }); }
  function amenager(oui) { if (grille) grille.visible = oui; if (!oui) { finFantome(); selectionner(null); } }
  // un meuble à poser (type) ou à déplacer (deplace = id) ; il suit le doigt, vert si on peut le poser, rouge sinon
  function commencerFantome(type, x, z, r, deplace) {
    finFantome();
    let g;
    if (deplace) { g = objets.get(deplace).g; } else { g = fabMeuble({ id: -1, type, x, z, r, produits: type === 'rayon' ? ['booster:' + bouDerniere(etat).n, null, null] : undefined }); meublesG.add(g); }
    fantome = { type, x, z, r, g, deplace };
    majFantome(); return fantome;
  }
  function majFantome() {
    const f = fantome; if (!f) return;
    placerGroupe(f.g, f.type, f.x, f.z, f.r); f.g.position.y = 0.02;
    const sauf = f.deplace ? etat.meubles.find(m => m.id === f.deplace) : null;
    f.raison = bouPeutPoser(etat, f.type, f.x, f.z, f.r, sauf);
    teinter(f.g, f.raison ? 0xe5534b : 0x2fae7a);
    ecoute.fantome(f);
  }
  function bougerFantome(x, z) { if (fantome && (x !== fantome.x || z !== fantome.z)) { fantome.x = x; fantome.z = z; majFantome(); } }
  function tournerFantome() { if (fantome) { fantome.r = (fantome.r + 1) % 4; majFantome(); } }
  function finFantome() {
    const f = fantome; if (!f) return null;
    fantome = null;
    if (f.deplace) { deteindre(f.g); const m = etat.meubles.find(q => q.id === f.deplace); if (m) placerGroupe(f.g, m.type, m.x, m.z, m.r); objets.get(f.deplace).sig = ''; }
    else { meublesG.remove(f.g); oublier(f.g); }
    majMeubles();
    return f;
  }
  // une case libre près du centre, pour faire apparaître un nouveau meuble
  function caseLibre(type, r) {
    const T = bouTaille(etat), cx = Math.floor(T.L / 2), cz = Math.floor(T.P / 2); let best = null, bd = 1e9;
    for (let x = 0; x < T.L; x++) for (let z = 0; z < T.P; z++) if (!bouPeutPoser(etat, type, x, z, r)) { const d = Math.abs(x - cx) + Math.abs(z - cz); if (d < bd) { bd = d; best = [x, z]; } }
    return best || [cx, cz];
  }
  function selectionner(id) {
    if (selection && objets.has(selection)) deteindre(objets.get(selection).g);
    selection = id;
    if (id && objets.has(id)) teinter(objets.get(id).g, 0xf5b82e);
  }

  /* ---------- les clients qui rejouent la journée ---------- */
  const enJeu = [];
  let finJournee = null;
  // le meuble où l'on prend un achat : celui de la carte, ou un rayon / une étagère qui vend ce produit
  function meublePour(a) {
    if (a.meuble) return etat.meubles.find(m => m.id === a.meuble);
    const base = a.cle.split(':')[0];
    return etat.meubles.find(m => m.produits && m.produits.includes(a.cle)) || etat.meubles.find(m => (BOU_MEUBLES[m.type].vend || []).includes(base));
  }
  function chemin(de, vers) {
    const T = bouTaille(etat), g = bouOccupation(etat), cle = (x, z) => x + ',' + z, vu = new Map([[cle(...de), null]]), file = [de];
    while (file.length) {
      const [x, z] = file.shift();
      if (x === vers[0] && z === vers[1]) { const l = []; let k = cle(x, z); while (k) { l.unshift(k.split(',').map(Number)); k = vu.get(k); } return l; }
      for (const [dx, dz] of BOU_DIR) { const a = x + dx, b = z + dz, k = cle(a, b); if (!vu.has(k) && a >= 0 && b >= 0 && a < T.L && b < T.P && !g[a][b]) { vu.set(k, cle(x, z)); file.push([a, b]); } }
    }
    return [de, vers];
  }
  function bulle(txt, coul) {
    const tex = texte2d(64, 64, c => { c.fillStyle = coul; c.beginPath(); c.arc(32, 28, 24, 0, 7); c.fill(); c.beginPath(); c.moveTo(24, 48); c.lineTo(32, 62); c.lineTo(40, 48); c.fill(); c.fillStyle = '#fff'; c.font = '30px "Luckiest Guy", sans-serif'; c.textAlign = 'center'; c.fillText(txt, 32, 40); });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false })); s.scale.setScalar(0.32); s.position.y = 0.95; return s;
  }
  // prépare le trajet d'un client : entrer, passer aux meubles de ses achats, payer, sortir
  function client(v, depart) {
    const T = bouTaille(etat), p = personnage(PERSOS[Math.floor(bouRng(etat.graine, 'tete', depart * 1000)() * PERSOS.length)]);
    if (!p) return null;
    const porte = [BOU_PORTE, T.P - 1], etapes = [{ x: BOU_PORTE, z: T.P + 0.4 }];
    let ici = porte;
    const aller = m => { if (!m) return; const d = BOU_MEUBLES[m.type].taille[0] > 1 ? null : bouDevant(m); if (!d) return; for (const c of chemin(ici, d)) etapes.push({ x: c[0], z: c[1] }); etapes.push({ pause: 0.9, meuble: m }); ici = d; };
    const vus = [];
    for (const a of v.achats) { const m = meublePour(a); if (m && !vus.includes(m)) { vus.push(m); aller(m); } }
    if (!vus.length) { const l = etat.meubles.filter(m => BOU_MEUBLES[m.type].client && m.type !== 'caisse'); aller(l[Math.floor(depart * 7) % Math.max(1, l.length)]); }
    if (v.achats.length) { const c = etat.meubles.find(m => m.type === 'caisse'); aller(c); etapes[etapes.length - 1].payer = true; }
    for (const c of chemin(ici, porte)) etapes.push({ x: c[0], z: c[1] });
    etapes.push({ x: BOU_PORTE, z: T.P + 0.6 }, { fin: true });
    p.o.position.set(BOU_PORTE, 0, T.P + 0.4); p.o.rotation.y = Math.PI; p.o.visible = false;
    clientsG.add(p.o);
    return { p, v, etapes, k: 1, attente: 0, depart, pris: new Set() };
  }
  // rejoue une journée (résultat de bouJour) ; la promesse est tenue quand le dernier client est sorti
  function rejouer(jour, duree = 9) {
    const n = jour.visites.length;
    jour.visites.forEach((v, i) => { const c = client(v, n > 1 ? (i / (n - 1)) * duree * 0.7 : 0); if (c) enJeu.push(c); });
    return new Promise(ok => { finJournee = ok; if (!enJeu.length) { finJournee = null; ok(); } });
  }
  let horloge = 0;
  function avancerClients(dt) {
    if (!enJeu.length) return;
    horloge += dt;
    for (const c of enJeu.slice()) {
      if (horloge < c.depart) continue;
      c.p.o.visible = true;
      const e = c.etapes[c.k];
      if (e.fin) { clientsG.remove(c.p.o); oublier(c.p.o); enJeu.splice(enJeu.indexOf(c), 1); continue; }
      if (e.pause) {
        if (c.attente <= 0) {
          c.attente = e.pause;
          c.p.o.rotation.y = Math.atan2(objets.get(e.meuble.id).g.position.x - c.p.o.position.x, objets.get(e.meuble.id).g.position.z - c.p.o.position.z);
          jouer(c.p, e.payer ? 'interact-right' : 'pick-up');
          prendre(c, e.meuble);
          if (e.payer) payer(c);
          if (!c.v.achats.length && c.v.dit && !c.bulle) { c.bulle = bulle(c.v.dit === 'manque' ? '?' : '€', c.v.dit === 'manque' ? '#e5534b' : '#f5b82e'); c.p.o.add(c.bulle); }
        }
        c.attente -= dt; if (c.attente <= 0) c.k++;
        continue;
      }
      const dx = e.x - c.p.o.position.x, dz = e.z - c.p.o.position.z, d = Math.hypot(dx, dz);
      if (d < 0.03) { c.k++; continue; }
      jouer(c.p, 'walk'); const pas = Math.min(d, dt * 1.4);
      c.p.o.position.x += dx / d * pas; c.p.o.position.z += dz / d * pas;
      let a = Math.atan2(dx, dz) - c.p.o.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a)); c.p.o.rotation.y += a * Math.min(1, dt * 12);
    }
    if (!enJeu.length) { horloge = 0; const ok = finJournee; finJournee = null; if (ok) ok(); }
  }
  // la carte achetée disparaît de la vitrine quand le client la prend
  function prendre(c, m) {
    const o = objets.get(m.id); if (!o) return;
    for (const a of c.v.achats) if (a.meuble === m.id && a.place !== undefined) o.g.children.filter(x => x.userData.place === a.place).forEach(x => { x.visible = false; });
  }
  function payer(c) {
    const total = c.v.achats.reduce((s, a) => s + a.prix, 0), v = c.p.o.position.clone(); v.y += 0.9; v.project(cam);
    ecoute.vente(total, (v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight);
  }

  /* ---------- boucle ---------- */
  function animer(dt) {
    if (!etat) return;
    const t = enPause ? 0 : dt * (enJeu.length ? vitesse : 1);
    azimut += (vise - azimut) * Math.min(1, dt * 8);
    for (const p of animes) p.mixer.update(t);
    coque.children.forEach(o => { if (o.userData.pousse !== undefined) { o.userData.pousse += dt * 2.5; const s = Math.min(1, o.userData.pousse); o.scale.setScalar(s < 1 ? s * (1.25 - 0.25 * s) : 1); if (s >= 1) delete o.userData.pousse; } });
    avancerClients(t);
    if (portes) {
      // ouverte tant qu'un client est à moins d'une case et demie de la porte
      const cible = enJeu.some(c => Math.hypot(c.p.o.position.x - portes.x, c.p.o.position.z - portes.z) < 1.5) ? 1 : 0;
      portes.a += (cible - portes.a) * Math.min(1, dt * 7 * (enJeu.length ? vitesse : 1));
      if (portes.g) portes.g.rotation.y = portes.a * SENS_PORTE * 1.45;
      if (portes.d) portes.d.rotation.y = -portes.a * SENS_PORTE * 1.45;
    }
    placerCamera();
    rendu.render(scene, cam);
  }

  /* ---------- les vignettes du catalogue (dessinées une fois) ---------- */
  function vignettes() {
    const s = new THREE.Scene(); s.add(new THREE.HemisphereLight(0xffffff, 0x8a80a8, 1.0)); const d = new THREE.DirectionalLight(0xffffff, 0.6); d.position.set(3, 5, 4); s.add(d);
    const c = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50), taille = rendu.getSize(new THREE.Vector2()), res = {};
    rendu.setPixelRatio(1); rendu.setSize(128, 128, false); rendu.setClearColor(0x000000, 0);
    for (const type in BOU_MEUBLES) {
      const g = fabMeuble({ id: -2, type, x: 0, z: 0, r: 0, produits: type === 'rayon' ? ['booster:' + bouDerniere(etat).n, 'coffret:' + bouDerniere(etat).n, 'pochettes'] : undefined, vitrine: true });
      s.add(g);
      const b = new THREE.Box3().setFromObject(g), ctr = b.getCenter(new THREE.Vector3()), r = Math.max(0.35, b.getSize(new THREE.Vector3()).length() * 0.55);
      c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.position.set(ctr.x + 4, ctr.y + 3.2, ctr.z + 4); c.lookAt(ctr); c.updateProjectionMatrix();
      rendu.render(s, c); res[type] = canvas.toDataURL(); s.remove(g); oublier(g);
    }
    rendu.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); rendu.setSize(taille.x, taille.y, false);
    return res;
  }

  /* ---------- ce que le jeu appelle ---------- */
  // (re)lit l'état : la coque si la taille a changé, puis les meubles et leur contenu
  function maj(e) {
    etat = e;
    if (e.niveau !== niveauConstruit) { const avant = niveauConstruit >= 0 ? BOU_TAILLES[niveauConstruit] : null; construireCoque(); if (avant) pousser(avant); }
    majMeubles();
  }
  function ecran(id) { const o = objets.get(id); if (!o) return null; const v = o.g.position.clone(); v.y += 0.8; v.project(cam); return { x: (v.x + 1) / 2 * innerWidth, y: (1 - v.y) / 2 * innerHeight }; }
  return {
    init, maj, vignettes, tourner, amenager, commencerFantome, bougerFantome, tournerFantome, finFantome, caseLibre, selectionner, rejouer, ecran,
    ecouter: (n, f) => { ecoute[n] = f; },
    vitesse: v => { vitesse = v; }, pause: p => { enPause = p; },
    get fantome() { return fantome; }, get occupe() { return enJeu.length > 0; }, get porte() { return portes ? portes.a : null; },
    texCarte, M,
  };
})();

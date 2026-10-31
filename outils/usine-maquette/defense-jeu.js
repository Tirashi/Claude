// ---- La petite usine : défense (ajouté après le moteur de la maquette 1, voir fabriquer-defense.py)
function chargerPack(p) {
  const man = new THREE.LoadingManager();
  man.setURLModifier(u => /colormap/.test(u) ? TEX[p] : u);
  const L = new THREE.GLTFLoader(man), out = {};
  return Promise.all(Object.keys(MOD[p]).map(n => new Promise((ok, ko) => {
    L.parse(tampon(MOD[p][n]), '', g => {
      g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
      out[n] = g.scene; ok();
    }, ko);
  }))).then(() => out);
}
function normer(o, taille) {
  const s = new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
  o.scale.multiplyScalar(taille / Math.max(s.x, s.y, s.z)); return o;
}
const ENNEMIS = {
  a: { m: 'enemy-ufo-a', hp: 3, vit: 0.85, prime: 2, ech: 0.5 },
  b: { m: 'enemy-ufo-b', hp: 2, vit: 1.45, prime: 2, ech: 0.42 },
  c: { m: 'enemy-ufo-c', hp: 10, vit: 0.55, prime: 6, ech: 0.62 }
};
function vague(n) { const l = []; for (let i = 0; i < 4 + n * 2; i++) l.push(n >= 3 && i % 5 === 4 ? 'c' : n >= 2 && i % 3 === 2 ? 'b' : 'a'); return l; }
const PRIX_TOUR = 10;

// chemin des ennemis à partir de points de passage
function chemin(t, pts) {
  const L = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, z0] = pts[i], [x1, z1] = pts[i + 1], dx = Math.sign(x1 - x0), dz = Math.sign(z1 - z0);
    for (let x = x0, z = z0; x !== x1 || z !== z1; x += dx, z += dz) L.push([x, z]);
  }
  L.push(pts[pts.length - 1]);
  t.route = L; t.chemin = new Set(L.map(([x, z]) => K(x, z)));
}
function cote(a, b) { return DX.findIndex((v, i) => v === b[0] - a[0] && DZ[i] === b[1] - a[1]); }
function terrain(t, neige) {
  const p = neige ? 'snow-' : '', R = t.route || [], idx = new Map(R.map((c, i) => [K(c[0], c[1]), i]));
  let graine = 7; const hasard = () => (graine = (graine * 9301 + 49297) % 233280) / 233280;
  for (let x = -2; x <= t.W + 1; x++) for (let z = -2; z <= t.H + 1; z++) {
    const i = idx.get(K(x, z));
    if (i === undefined) {
      const bord = !t.dedans(x, z), r = hasard();
      const n = bord && r < 0.28 ? 'tile-tree' : bord && r < 0.4 ? 'tile-rock' : 'tile';
      t.modele(p + n, x, z, Math.floor(hasard() * 4) * Math.PI / 2, 1, -0.2);
      continue;
    }
    const av = R[i - 1], ap = R[i + 1], c = R[i];
    if (!av) { t.modele(p + 'tile-spawn', x, z, angle(cote(c, ap)), 1, -0.2); continue; }
    if (!ap) { t.modele(p + 'tile-end-round', x, z, angle((cote(c, av))), 1, -0.2); continue; }
    const s1 = cote(c, av), s2 = cote(c, ap);
    if (s1 === (s2 + 2) % 4) t.modele(p + 'tile-straight', x, z, angle(s1), 1, -0.2);
    else for (let k = 0; k < 4; k++) {
      const a = (2 - k + 4) % 4, b = (1 - k + 4) % 4;
      if ((a === s1 && b === s2) || (a === s2 && b === s1)) t.modele(p + 'tile-corner-round', x, z, k * Math.PI / 2, 1, -0.2);
    }
  }
  const g = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: new THREE.Color(t.cfg.sol).convertSRGBToLinear() }));
  g.rotation.x = -Math.PI / 2; g.position.set(t.W / 2, -0.25, t.H / 2); g.receiveShadow = true; t.sc.add(g);
}
// visuels propres à la défense
function visuel(t, c, g) {
  if (c.t === 'tour') {
    t.modele('tower-square-bottom-a', 0, 0, 0, 0.92, 0, g);
    c.tourelle = t.modele('weapon-turret', 0, 0, c.rot || 0, 1.15, 0.46, g);
    const fond = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: 0x24202f }));
    fond.position.y = 1.35; g.add(fond);
    c.jauge = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.1), new THREE.MeshBasicMaterial({ color: 0xffb14d }));
    c.jauge.position.y = 1.35; g.add(c.jauge);
  } else if (c.t === 'base') {
    t.modele('machine-fortified', 0, 0, Math.PI / 2, 0.95, 0, g);
    t.modele('structure-yellow-tall', -0.55, -0.55, 0, 0.6, 0, g); t.modele('structure-yellow-tall', 0.55, 0.55, 0, 0.6, 0, g);
  }
}
function libre(t, x, z) { return t.dedans(x, z) && !t.cell(x, z) && !(t.chemin && t.chemin.has(K(x, z))); }
function poserTapis(t, a, b, d) {
  const ca = t.cell(a.x, a.z), cb = t.cell(b.x, b.z);
  if (ca && ca.t === 'tapis' && !ca.fixe) ca.d = d; else if (!ca && libre(t, a.x, a.z)) t.poser(a.x, a.z, { t: 'tapis', d });
  if (!cb && libre(t, b.x, b.z)) t.poser(b.x, b.z, { t: 'tapis', d });
  else if (cb && cb.t === 'tapis' && !cb.fixe && cb.d === (d + 2) % 4) cb.d = d;
  t.dessiner();
}
function tour(x, z, stock = 0) { return { t: 'tour', stock, res: 0, max: 6, cd: 0, cadence: 0.55, portee: 2.6 }; }
function armurerie(d) { return { t: 'mach', d, entre: ['minerai'], sort: 'munition', temps: 2, buf: 0, res: 0, busy: 0, modele: 'machine' }; }

// ---- combat (commun aux trois directions)
function lancerVague(t) { const s = t.s; s.file = vague(s.vague); s.minuterie = 0.5; s.enVague = true; t.cfg.affiche(t); }
function nouvelEnnemi(t, type) {
  const E = ENNEMIS[type], m = t.m[E.m].clone(true); m.scale.setScalar(E.ech);
  const barre = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.07, 0.07), new THREE.MeshBasicMaterial({ color: 0xff5a5a }));
  barre.position.y = 1.15 / E.ech; m.add(barre);
  const hp = Math.round(E.hp * (1 + 0.18 * (t.s.vague - 1)));
  const e = { m, barre, hp, max: hp, vit: E.vit, prime: E.prime, s: 0, ph: Math.random() * 6 };
  if (t.cfg.centre) { // C : arrive d'un bord au hasard, en ligne droite
    const a = Math.random() * Math.PI * 2, [cx, cz] = t.cfg.centre;
    e.x = cx + Math.cos(a) * 6.5; e.z = cz + Math.sin(a) * 6.5;
  }
  t.sc.add(m); t.ennemis.push(e); return e;
}
function boum(t, p, couleur, taille) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.25, 12, 8), new THREE.MeshBasicMaterial({ color: couleur, transparent: true }));
  m.position.copy(p); t.sc.add(m); t.effets.push({ m, v: 0, taille });
}
function combat(t, dt, s) {
  const S = t.s; if (S.fini) return;
  // vagues
  if (S.enVague) {
    if (S.file.length) { S.minuterie -= dt; if (S.minuterie <= 0) { S.minuterie = 1.15; nouvelEnnemi(t, S.file.shift()); } }
    else if (!t.ennemis.length) { S.enVague = false; S.vague++; S.pause = t.cfg.pauseAuto; t.cfg.finVague && t.cfg.finVague(t); t.cfg.affiche(t); }
  } else if (S.pause != null) { S.pause -= dt; if (S.pause <= 0) { S.pause = null; lancerVague(t); } }
  // ennemis
  for (const e of [...t.ennemis]) {
    let arrive = false;
    if (t.cfg.centre) {
      const [cx, cz] = t.cfg.centre, dx = cx - e.x, dz = cz - e.z, l = Math.hypot(dx, dz);
      if (l < 0.9) arrive = true; else { e.x += dx / l * e.vit * dt; e.z += dz / l * e.vit * dt; }
    } else {
      e.s += e.vit * dt; const R = t.route, i = Math.floor(e.s);
      if (i >= R.length - 1) arrive = true;
      else { const f = e.s - i; e.x = R[i][0] + (R[i + 1][0] - R[i][0]) * f; e.z = R[i][1] + (R[i + 1][1] - R[i][1]) * f; }
    }
    if (arrive) { t.sc.remove(e.m); t.ennemis.splice(t.ennemis.indexOf(e), 1); S.vies--; t.rouge = 1; t.cfg.affiche(t); if (S.vies <= 0) perdu(t); continue; }
    e.m.position.set(e.x, 0.7 + Math.sin(s * 3 + e.ph) * 0.08, e.z); e.m.rotation.y += dt * 1.5;
    e.barre.scale.x = Math.max(0.01, e.hp / e.max); e.barre.rotation.y = -e.m.rotation.y;
  }
  // tours
  for (const c of t.cells.values()) {
    if (c.t !== 'tour') continue;
    c.jauge.scale.x = Math.max(0.001, c.stock / c.max); c.jauge.position.x = -0.35 * (1 - c.stock / c.max);
    c.cd -= dt;
    let cible = null, best = 1e9;
    for (const e of t.ennemis) { const d = Math.hypot(e.x - c.x, e.z - c.z); if (d <= c.portee && d < best) { best = d; cible = e; } }
    if (!cible) continue;
    const vise = Math.atan2(cible.x - c.x, cible.z - c.z); let da = vise - c.tourelle.rotation.y;
    da = Math.atan2(Math.sin(da), Math.cos(da)); c.tourelle.rotation.y += da * Math.min(1, dt * 10); c.rot = c.tourelle.rotation.y;
    if (c.cd <= 0 && c.stock > 0 && Math.abs(da) < 0.5) {
      c.stock--; c.cd = c.cadence;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe08a }));
      b.position.set(c.x + Math.sin(vise) * 0.4, 0.75, c.z + Math.cos(vise) * 0.4); t.sc.add(b); t.balles.push({ m: b, cible });
    }
  }
  // balles
  for (const b of [...t.balles]) {
    const e = b.cible, p = b.m.position, v = new THREE.Vector3(e.x - p.x, e.m.position.y - p.y, e.z - p.z), l = v.length();
    if (!t.ennemis.includes(e) || l < 0.18) {
      t.sc.remove(b.m); t.balles.splice(t.balles.indexOf(b), 1);
      if (t.ennemis.includes(e)) {
        e.hp--; boum(t, p.clone(), 0xffd27a, 0.6);
        if (e.hp <= 0) { t.sc.remove(e.m); t.ennemis.splice(t.ennemis.indexOf(e), 1); S.ferraille += e.prime; boum(t, e.m.position.clone(), 0xb98cff, 2.4); t.cfg.affiche(t); }
      }
      continue;
    }
    p.addScaledVector(v, Math.min(1, 9 * dt / l));
  }
  // effets
  for (const f of [...t.effets]) { f.v += dt * 3; f.m.scale.setScalar(1 + f.v * f.taille); f.m.material.opacity = 1 - f.v; if (f.v >= 1) { t.sc.remove(f.m); t.effets.splice(t.effets.indexOf(f), 1); } }
  t.rouge = Math.max(0, (t.rouge || 0) - dt * 2);
  t.voile.style.opacity = t.rouge * 0.5;
}
function perdu(t) {
  t.s.fini = true;
  finir(t, 'USINE ENVAHIE', `Tu as tenu ${t.s.vague - 1} vague${t.s.vague > 2 ? 's' : ''}.`, null, 'REJOUER', () => raz(t));
}
function raz(t) {
  for (const i of t.items) t.gItems.remove(i.mesh); t.items = [];
  for (const e of t.ennemis) t.sc.remove(e.m); for (const b of t.balles) t.sc.remove(b.m); for (const f of t.effets) t.sc.remove(f.m);
  t.ennemis = []; t.balles = []; t.effets = [];
  t.cells.clear(); t.cfg.niveau(t); t.dessiner(); t.cfg.affiche(t);
}

// ---- HUD commun
function hudDefense(t, astuce, lancer) {
  t.hud.innerHTML = `<div class="haut"><div class="ligne"><span class="val">VAGUE <b class="vg">1</b></span><span class="val vies">♥ <b class="vi">10</b></span><span class="val">FER <b class="fe">0</b></span></div>
    <div class="ligne"><span class="etiq etat"></span></div><div class="astuce">${astuce}</div></div>
    <div class="bas"><div class="outils"><button type="button" class="actif" data-o="tapis">TAPIS</button><button type="button" data-o="tour">TOUR<small>${PRIX_TOUR} FER</small></button><button type="button" data-o="gomme">GOMME</button></div>
    ${lancer ? '<div class="outils"><button type="button" class="go" data-o="lancer">LANCER LA VAGUE 1</button></div>' : ''}</div>`;
  t.hud.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
    if (b.dataset.o === 'lancer') { if (!t.s.enVague && !t.s.fini) { lancerVague(t); t.hud.querySelector('.astuce')?.remove(); } return; }
    t.s.outil = b.dataset.o; t.hud.querySelectorAll('.outils:first-child [data-o]').forEach(x => x.classList.toggle('actif', x === b));
  });
  t.voile = el('<div class="voile"></div>'); t.el.appendChild(t.voile);
}
function afficheDefense(t) {
  const S = t.s, q = s => t.hud.querySelector(s);
  q('.vg').textContent = S.vague; q('.vi').textContent = Math.max(0, S.vies); q('.fe').textContent = S.ferraille;
  q('.etat').textContent = S.enVague ? `${S.file.length + t.ennemis.length} OVNIS EN APPROCHE` : S.pause != null ? 'PROCHAINE VAGUE DANS ' + Math.ceil(S.pause) + ' S' : 'PREPARE TON USINE';
  const l = q('[data-o="lancer"]'); if (l) { l.disabled = S.enVague; l.textContent = S.enVague ? 'VAGUE EN COURS' : 'LANCER LA VAGUE ' + S.vague; }
  if (t.cfg.bloqueEnVague) t.hud.querySelectorAll('.outils:first-child button').forEach(b => b.disabled = S.enVague);
}
// toucher (commun)
const toucher = {
  appui(t, c) { if (t.s.outil === 'gomme') gommer(t, c); },
  trace(t, a, b, d) {
    if (t.s.fini || (t.cfg.bloqueEnVague && t.s.enVague)) return;
    if (t.s.outil === 'gomme') { gommer(t, b); return; }
    if (t.s.outil === 'tapis') { poserTapis(t, a, b, d); t.hud.querySelector('.astuce')?.remove(); }
  },
  tape(t, c) {
    if (t.s.fini || (t.cfg.bloqueEnVague && t.s.enVague)) return;
    const x = t.cell(c.x, c.z);
    if (t.s.outil === 'tapis' && x && x.t === 'tapis' && !x.fixe) { x.d = (x.d + 1) % 4; t.dessiner(); }
    if (t.s.outil === 'tour' && libre(t, c.x, c.z) && t.s.ferraille >= PRIX_TOUR) {
      t.s.ferraille -= PRIX_TOUR; t.poser(c.x, c.z, tour()); t.dessiner(); t.cfg.affiche(t); t.hud.querySelector('.astuce')?.remove();
    }
  }
};
function gommer(t, c) {
  if (t.s.fini || (t.cfg.bloqueEnVague && t.s.enVague)) return;
  const x = t.cell(c.x, c.z); if (!x || x.fixe) return;
  if (x.t === 'tapis') { t.poser(c.x, c.z, null); t.dessiner(); }
  else if (x.t === 'tour') { t.poser(c.x, c.z, null); t.s.ferraille += PRIX_TOUR / 2; t.dessiner(); t.cfg.affiche(t); }
}
function etatDepart(t, pause) { t.s = { vague: 1, vies: 10, ferraille: 25, file: [], minuterie: 0, pause, enVague: false, fini: false, outil: 'tapis' }; t.ennemis = t.ennemis || []; t.balles = t.balles || []; t.effets = t.effets || []; }
// petite usine de départ (A et B) : mine → armurerie → une tour
function usineDepart(t) {
  t.poser(0, 9, { t: 'mine', d: 0, k: 'minerai', per: 3, fixe: true });
  t.poser(1, 9, { t: 'tapis', d: 0 }); t.poser(2, 9, { t: 'tapis', d: 0 });
  t.poser(3, 9, Object.assign(armurerie(3), { fixe: true }));
  t.poser(3, 8, { t: 'tapis', d: 3 }); t.poser(3, 7, { t: 'tapis', d: 3 });
  t.poser(3, 6, tour(0, 0, 4));
  t.poser(6, 10, { t: 'mine', d: 3, k: 'minerai', per: 3, fixe: true });
}
const commun = { duree: () => 0.36, marche: t => !t.s.fini, visuel, ...toucher, affiche: afficheDefense, livre() {} };

// ================================================================ A : tout en direct
const A = {
  ...commun, W: 7, H: 11, ciel: 0xbfe3d0, sol: 0x5aa877, hemi: [0xffffff, 0x6f8a7a, 0.62], soleil: [0xfff3e0, 0.85],
  cam: { ortho: true, demi: 8.4, pos: [1.6, 11, 8.5], dz: -0.5 }, pauseAuto: 6,
  terrain(t) { chemin(t, [[7, 1], [1, 1], [1, 3], [5, 3], [5, 5], [-1, 5]]); terrain(t, false); },
  niveau(t) { etatDepart(t, 4); usineDepart(t); },
  init(t) {
    A.niveau(t);
    t.modele('machine-fortified', -1.05, 5, Math.PI, 0.9, 0); t.modele('warning-traffic', -0.6, 4.3, 0, 0.6);
    t.modele('robot-arm-a', 6.2, 7.6, 0, 0.4); t.oopi = t.modele('oopi', 5.2, 9.6, Math.PI, 0.9);
  },
  hud(t) { hudDefense(t, 'Une deuxième mine attend en bas à droite : relie-la à une tour avec des tapis.', false); afficheDefense(t); },
  anim(t, s, dt) { combat(t, dt, s); if (t.oopi) t.oopi.position.y = Math.abs(Math.sin(s * 2.2)) * 0.06; if (Math.floor(s * 4) !== t.dernier) { t.dernier = Math.floor(s * 4); afficheDefense(t); } }
};

// ================================================================ B : préparer puis défendre
const B = {
  ...commun, W: 7, H: 11, ciel: 0xdde8f2, sol: 0xe9f1f7, hemi: [0xdfe8ff, 0x7a8aa0, 0.5], soleil: [0xffffff, 0.7],
  cam: { fov: 38, pos: [0, 22.5, 4.2], dz: 0.2 }, pauseAuto: null, bloqueEnVague: true,
  terrain(t) { chemin(t, [[2, -1], [2, 2], [5, 2], [5, 5], [-1, 5]]); terrain(t, true); },
  niveau(t) { etatDepart(t, null); usineDepart(t); },
  init(t) { B.niveau(t); t.modele('machine-fortified', -1.05, 5, Math.PI, 0.9, 0); t.modele('robot-arm-a', 6.2, 7.6, 0, 0.4); },
  hud(t) { hudDefense(t, 'Construis tranquillement, puis lance la vague. Pendant la vague, on ne touche plus à rien.', true); afficheDefense(t); },
  anim(t, s, dt) { combat(t, dt, s); if (Math.floor(s * 4) !== t.dernier) { t.dernier = Math.floor(s * 4); afficheDefense(t); } }
};

// ================================================================ C : la base au centre
const C = {
  ...commun, W: 7, H: 9, ciel: 0x14182a, sol: 0x1f3a2e, hemi: [0x7c8ad0, 0x10141e, 0.32], soleil: [0xbfd0ff, 0.28],
  cam: { fov: 44, pos: [0, 12.5, 7.4], dz: -0.2 }, pauseAuto: 6, centre: [3, 4],
  terrain(t) { t.route = null; t.chemin = null; terrain(t, false); },
  niveau(t) {
    etatDepart(t, 4);
    t.poser(3, 4, { t: 'base', per: 2, fixe: true });
    t.poser(3, 3, { t: 'tapis', d: 3 }); t.poser(3, 2, tour(0, 0, 4));
    t.poser(4, 4, { t: 'tapis', d: 0 }); t.poser(5, 4, tour(0, 0, 4));
  },
  init(t) {
    C.niveau(t);
    const l = new THREE.PointLight(0xffc27a, 6, 8, 2); l.position.set(3, 2.2, 4); t.sc.add(l);
  },
  hud(t) { hudDefense(t, "La base fabrique les munitions et les envoie de tous les côtés. Les ovnis arrivent de partout.", false); afficheDefense(t); },
  anim(t, s, dt) { combat(t, dt, s); if (Math.floor(s * 4) !== t.dernier) { t.dernier = Math.floor(s * 4); afficheDefense(t); } }
};

// ---------------------------------------------------------------- démarrage
const TELS = [];
Promise.all([chargerPack('f'), chargerPack('t')]).then(([mf, mt]) => {
  const m = Object.assign({}, mf, mt);
  TELS.push(new Tel('telA', A, m), new Tel('telB', B, m), new Tel('telC', C, m));
  let av = performance.now();
  const boucle = now => { const dt = Math.min(0.05, (now - av) / 1000); av = now; TELS.forEach(t => t.maj(dt, now / 1000)); requestAnimationFrame(boucle); };
  requestAnimationFrame(boucle);
  window.PRET = true;
}).catch(e => { document.querySelectorAll('.charge').forEach(c => c.textContent = 'ERREUR : ' + e.message); });

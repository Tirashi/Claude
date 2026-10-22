/* =====================================================================
   ROMET · les DÉCORS 3D de chaque machine (repris des maquettes du 22/10).
   RometDecors[id](scene, machine) habille la scène (lumières, décor animé)
   et renvoie les matériaux de la machine : sol, poussoir, fond (6 faces,
   l'enseigne devant), murs, façade, bac, pièces, bonus, et animer(t, jeu).
   Textures dessinées dans des canvas : les polices des enseignes doivent
   être chargées avant (jeu.js attend document.fonts).
   Machines : foire (B de maquettes/romet.html), ruche (B de maquettes/romet-3.html).
   ===================================================================== */
(function () {
'use strict';
const T = THREE;
function toile(w, h, f) { const c = document.createElement('canvas'); c.width = w; c.height = h; f(c.getContext('2d'), w, h); return c; }
function tex(c, rx, ry) { const t = new T.CanvasTexture(c); if (rx) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); } return t; }
const phong = o => new T.MeshPhongMaterial(o), basic = o => new T.MeshBasicMaterial(o);
const face3 = (cote, c, spec, shin) => { const f = phong({ map: c, specular: spec, shininess: shin }); return [cote, f, f]; };
function grain(g, w, h, c, n, a) { g.globalAlpha = a; g.fillStyle = c; for (let j = 0; j < n; j++) g.fillRect(Math.random() * w, Math.random() * h, 1, 10 + Math.random() * 40); g.globalAlpha = 1; }
function planches(a, b, c, vert, rx, ry) { return tex(toile(256, 256, (g, w) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? a : b; if (vert) g.fillRect(i * 32, 0, 32, w); else g.fillRect(0, i * 32, w, 32); g.fillStyle = c; if (vert) g.fillRect(i * 32 + 30, 0, 2, w); else g.fillRect(0, i * 32 + 30, w, 2); }
  grain(g, w, w, c, 120, .2); }), rx, ry); }
function texte(g, t, police, x, y, remp, contour, ep) { g.font = police; g.textAlign = 'center'; g.textBaseline = 'middle'; if (contour) { g.lineWidth = ep || 8; g.strokeStyle = contour; g.lineJoin = 'round'; g.strokeText(t, x, y); } g.fillStyle = remp; g.fillText(t, x, y); }
// motif d'alvéoles (hexagones à pointe en haut), qui se répète sans couture
function alveoles(g, w, h, s, remp, trait, ep) { const dx = s * Math.sqrt(3), dy = s * 1.5; g.lineWidth = ep;
  for (let r = -1; r * dy < h + s; r++) for (let q = -1; q * dx < w + dx; q++) { const cx = q * dx + (r % 2 ? dx / 2 : 0), cy = r * dy; g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(cx + Math.cos(a) * s, cy + Math.sin(a) * s); } g.closePath();
    if (remp) { g.fillStyle = typeof remp === 'function' ? remp() : remp; g.fill(); } g.strokeStyle = trait; g.stroke(); } }

// --- La foire (fête foraine de jour) ---
// face de pièce frappée d'un R
function faceR(c1, c2, c3) { return tex(toile(128, 128, (g, w) => { g.fillStyle = c1; g.fillRect(0, 0, w, w);
  g.strokeStyle = c2; g.lineWidth = 5; g.beginPath(); g.arc(w / 2, w / 2, w * .41, 0, 7); g.stroke(); g.lineWidth = 2; g.setLineDash([3, 5]); g.beginPath(); g.arc(w / 2, w / 2, w * .35, 0, 7); g.stroke(); g.setLineDash([]);
  g.font = 'bold 64px Rye, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = c2; g.fillText('R', w / 2 + 2, w / 2 + 5); g.fillStyle = c3; g.fillText('R', w / 2, w / 2 + 3); })); }
function bulbes(g, w, h, pas, c) { g.fillStyle = c; for (let x = pas / 2 + 6; x < w - 6; x += pas) { g.beginPath(); g.arc(x, 9, 4.5, 0, 7); g.arc(x, h - 9, 4.5, 0, 7); g.fill(); }
  for (let y = pas / 2 + 6; y < h - 6; y += pas) { g.beginPath(); g.arc(9, y, 4.5, 0, 7); g.arc(w - 9, y, 4.5, 0, 7); g.fill(); } }
function enseigneFoire(txt, fondc, cadre, lettre, ombre) { return tex(toile(512, 256, (g, w, h) => { g.fillStyle = fondc; g.fillRect(0, 0, w, h); g.strokeStyle = cadre; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  bulbes(g, w, h, 30, '#fff2c0'); texte(g, txt, '120px Rye, Georgia, serif', w / 2, h / 2 + 8, lettre, ombre, 10); })); }
function plaque(txt, fondc, lettre, taille) { return tex(toile(512, 128, (g, w, h) => { g.fillStyle = fondc; g.fillRect(0, 0, w, h); texte(g, txt, taille + 'px Rye, Georgia, serif', w / 2, h / 2 + 4, lettre); })); }
function auvent(a, b) { const t = tex(toile(256, 64, (g, w, h) => { g.clearRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 32, 0, 32, 44); g.beginPath(); g.arc(i * 32 + 16, 44, 16, 0, Math.PI); g.fill(); } })); t.wrapS = T.RepeatWrapping; t.repeat.set(2, 1); return t; }
function cadreAmpoules(fc) { const p = []; for (let z = -6.6; z <= fc - .1; z += .5) p.push([-2.7, 1.66, z], [2.7, 1.66, z]); for (let x = -2.5; x <= 2.5; x += .42) p.push([x, 3.66, -5.32]); return p; }

// --- La ruche ---
function cireTex(rx, ry, clair) { return tex(toile(256, 256, (g, w, h) => { g.fillStyle = clair ? '#f7df8c' : '#4a2806'; g.fillRect(0, 0, w, h);
  alveoles(g, w, h, 256 / (Math.sqrt(3) * 6), clair ? () => ['#f9e49a', '#f3d478', '#f6dc8a'][Math.floor(Math.random() * 3)] : () => ['#8a4a0c', '#7a400a', '#94520e', '#6e3808'][Math.floor(Math.random() * 4)], clair ? '#d9b250' : '#3e2004', clair ? 4 : 6); }), rx, ry); }
function rayonTex() { return tex(toile(512, 256, (g, w, h) => { g.fillStyle = '#a8620e'; g.fillRect(0, 0, w, h); alveoles(g, w, h, 22, () => ['#f0a820', '#e89818', '#f6b42c', '#ffc94a'][Math.floor(Math.random() * 4)], '#7a4208', 5);
  g.fillStyle = '#ffcf4a'; g.fillRect(0, 0, w, 18); for (let x = 10; x < w; x += 34 + Math.random() * 20) { const l = 20 + Math.random() * 50; g.beginPath(); g.moveTo(x - 8, 0); g.lineTo(x - 6, l); g.arc(x, l, 7, Math.PI, 0, true); g.lineTo(x + 8, 0); g.fill(); }
  g.fillStyle = '#fff1c2'; g.beginPath(); g.ellipse(256, 140, 150, 64, 0, 0, 7); g.fill(); g.strokeStyle = '#7a4208'; g.lineWidth = 6; g.stroke();
  texte(g, 'Romet', "92px Chewy, 'Fredoka', sans-serif", 256, 146, '#5a3208', null); })); }
function abeilleFace() { return tex(toile(128, 128, (g, w) => { g.fillStyle = '#f2b02a'; g.fillRect(0, 0, w, w); g.strokeStyle = '#c07a10'; g.lineWidth = 5; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.lineTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); } g.closePath(); g.stroke();
  g.fillStyle = '#fff3d0'; g.globalAlpha = .85; g.beginPath(); g.ellipse(52, 46, 16, 10, -.6, 0, 7); g.ellipse(76, 46, 16, 10, .6, 0, 7); g.fill(); g.globalAlpha = 1;
  g.fillStyle = '#ffd84a'; g.beginPath(); g.ellipse(64, 70, 15, 22, 0, 0, 7); g.fill(); g.fillStyle = '#4a2a06'; for (const y of [62, 74]) g.fillRect(49, y, 30, 6); g.beginPath(); g.arc(64, 46, 8, 0, 7); g.fill(); })); }
function abeille() { const g = new T.Group(), c = tex(toile(64, 32, (x, w, h) => { x.fillStyle = '#ffd23a'; x.fillRect(0, 0, w, h); x.fillStyle = '#2a1a06'; for (let i = 0; i < 4; i++) x.fillRect(10 + i * 14, 0, 6, h); }));
  const corps = new T.Mesh(new T.SphereGeometry(.1, 10, 8), phong({ map: c, shininess: 30 })); corps.scale.set(1.5, 1, 1); corps.rotation.y = Math.PI / 2; g.add(corps);
  const ail = basic({ color: 0xffffff, transparent: true, opacity: .6, side: T.DoubleSide, depthWrite: false });
  g.ailes = [-1, 1].map(s => { const a = new T.Mesh(new T.PlaneGeometry(.16, .1), ail); a.position.set(s * .08, .08, 0); g.add(a); return a; }); return g; }
// coulée de miel : bande dorée translucide sur le plancher, avec des reflets qui glissent
function mielTex() { return tex(toile(256, 64, (g, w, h) => { const d = g.createLinearGradient(0, 0, 0, h); d.addColorStop(0, 'rgba(240,160,20,0)'); d.addColorStop(.2, 'rgba(240,160,20,.75)'); d.addColorStop(.8, 'rgba(230,140,10,.75)'); d.addColorStop(1, 'rgba(240,160,20,0)');
  g.fillStyle = d; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(255,240,180,.5)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(Math.random() * w, 14 + Math.random() * 36, 10 + Math.random() * 16, 3, 0, 0, 7); g.fill(); } }), 2, 1); }

window.RometDecors = {
  foire(s, m) {
    s.background = new T.Color(0x6a3a20); s.fog = new T.Fog(0x6a3a20, 20, 40);
    s.add(new T.HemisphereLight(0xfff0d0, 0x5a2c14, .95)); const d = new T.DirectionalLight(0xfff4e0, .8); d.position.set(-3, 9, 6); s.add(d);
    const laque = phong({ color: 0x9a2e1e, specular: 0x553322, shininess: 40 }), laiton = phong({ color: 0xd2a043, specular: 0xffe7a0, shininess: 80 }), creme = phong({ color: 0xf3e2c0, shininess: 20 });
    const or = phong({ color: 0xc99a3e, specular: 0x6a4a20, shininess: 40 });
    return { sol: phong({ map: planches('#a06a34', '#93602e', '#5d3818', 1, 2, 3), specular: 0x553311, shininess: 40 }), poussoir: laiton, bandePoussoir: laque,
      fond: [laque, laque, laque, laque, phong({ map: enseigneFoire('Romet', '#9a2418', '#e9b54c', '#ffe2a0', '#4a0e08'), shininess: 20 }), laque],
      murs: laque, bandeMurs: laiton, facade: [laque, laque, laque, laque, phong({ map: plaque('Gagné !', '#9a2418', '#ffe2a0', 76), shininess: 20 }), laque], bac: laiton, levre: creme,
      auvent: auvent('#c0281c', '#f3e2c0'), ampoules: cadreAmpoules(m.finCotes), allumee: 0xfff2c0, eteinte: 0x7a5a30, clignote: (i, k) => (i + k) % 3 !== 0, vitesseAmp: 6,
      piece: face3(or, faceR('#e2b04e', '#8a5a22', '#fff0c0'), 0x6a4a20, 40), geante: face3(laiton, faceR('#e8b44a', '#8a5a22', '#c0281c'), 0x6a4a20, 60), segPiece: 20,
      murBonus: phong({ color: 0xd2a043, emissive: 0x3a2208, transparent: true, opacity: .6 }), etincelle: 0xfff0a0, animer() {} };
  },
  ruche(s, m) {
    s.background = new T.Color(0x2a1806); s.fog = new T.Fog(0x3a2208, 18, 38);
    s.add(new T.HemisphereLight(0xffe6a0, 0x4a2a08, .65)); const d = new T.DirectionalLight(0xfff0c0, .8); d.position.set(-2, 9, 6); s.add(d);
    const cire = phong({ map: cireTex(2, 2, true), specular: 0x806020, shininess: 40 }), cadre = phong({ map: planches('#c89a5a', '#bb8e50', '#7a5a2a', 0, 1, 2), shininess: 15 });
    const miel = phong({ color: 0xf0a818, specular: 0xfff0b0, shininess: 90 });
    const abeilles = []; for (let i = 0; i < 6; i++) { const a = abeille(); a.userData = { ph: Math.random() * 6, r: 1 + Math.random() * 1.4, cz: -2.5 + Math.random() * 4, v: .6 + Math.random() * .6 }; s.add(a); abeilles.push(a); }
    const mt = mielTex(), z0 = m.miel[0], z1 = m.miel[1], coulee = new T.Mesh(new T.PlaneGeometry(5.2, z1 - z0 + .5), phong({ map: mt, transparent: true, depthWrite: false, specular: 0xfff0b0, shininess: 100 }));
    coulee.rotation.x = -Math.PI / 2; coulee.position.set(0, .015, (z0 + z1) / 2); s.add(coulee);
    return { sol: phong({ map: cireTex(5, 10), specular: 0x805020, shininess: 50 }), poussoir: cire, bandePoussoir: miel, fond: [cadre, cadre, cadre, cadre, phong({ map: rayonTex(), shininess: 30 }), cadre],
      murs: cadre, bandeMurs: miel, facade: [cadre, cadre, cadre, cadre, phong({ map: tex(toile(512, 128, (g, w, h) => { g.fillStyle = '#7a4a10'; g.fillRect(0, 0, w, h); alveoles(g, w, h, 14, '#8a5414', '#6a3a08', 3); texte(g, 'Récolte !', '64px Chewy, sans-serif', w / 2, h / 2 + 4, '#ffd970', '#4a2a06', 8); })), shininess: 20 }), cadre],
      bac: cadre, levre: miel, piece: face3(miel, abeilleFace(), 0xffe0a0, 80), geante: face3(miel, abeilleFace(), 0xffe0a0, 80), segPiece: 6,
      murBonus: phong({ color: 0xffcf4a, emissive: 0x4a2a00, transparent: true, opacity: .5 }), etincelle: 0xffe08a,
      animer(t) { mt.offset.x = t * .02;
        abeilles.forEach((a, i) => { const u = a.userData, ang = t * u.v + u.ph; a.position.set(Math.cos(ang) * u.r * 1.6, 2.1 + Math.sin(ang * 2.3) * .4 + i * .08, u.cz + Math.sin(ang) * u.r);
          a.rotation.y = -ang; a.ailes.forEach((w, k) => { w.rotation.z = (k ? 1 : -1) * (.3 + Math.sin(t * 60 + i) * .5); }); }); } };
  },
};
})();

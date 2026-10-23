/* =====================================================================
   ROMET · les DÉCORS 3D de chaque machine (repris des maquettes du 22/10).
   RometDecors[id](scene, machine) habille la scène (lumières, décor animé)
   et renvoie les matériaux de la machine : sol, poussoir, fond (6 faces,
   l'enseigne devant), murs, façade, bac, pièces, bonus, et animer(t, jeu).
   Textures dessinées dans des canvas : les polices des enseignes doivent
   être chargées avant (jeu.js attend document.fonts).
   Machines : foire, casino et foire de nuit (B, A et C de maquettes/romet.html), ruche, épave et horloger
   (B, A et C de maquettes/romet-3.html), machine secrète (C de maquettes/coin-pusher.html, pixel 3D).
   Matériaux en plus selon la règle : couloirAllume / couloirEteint, clou, etagere / poussoirHaut ; pixel : résolution fixe.
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


// --- Le casino et la foire de nuit (maquette 2) ---
function enseigneNeon(txt) { return tex(toile(512, 256, (g, w, h) => { g.fillStyle = '#0c0820'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#ff3fa4'; g.lineWidth = 6; g.shadowColor = '#ff3fa4'; g.shadowBlur = 18; g.beginPath(); if (g.roundRect) g.roundRect(18, 18, w - 36, h - 36, 30); else g.rect(18, 18, w - 36, h - 36); g.stroke();
  g.font = "110px Monoton, 'Press Start 2P', sans-serif"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = '#35e0ff'; g.shadowBlur = 26; g.fillStyle = '#e9fdff'; g.fillText(txt, w / 2, h / 2 + 6);
  g.shadowBlur = 8; g.fillText(txt, w / 2, h / 2 + 6); })); }
function neonPlaque(txt, c) { return tex(toile(512, 128, (g, w, h) => { g.fillStyle = '#0c0820'; g.fillRect(0, 0, w, h); g.font = '64px Monoton, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = c; g.shadowBlur = 20; g.fillStyle = '#fff'; g.fillText(txt, w / 2, h / 2 + 4); })); }
function grille() { return tex(toile(128, 128, (g, w) => { g.fillStyle = '#1a1238'; g.fillRect(0, 0, w, w); g.strokeStyle = '#4a36a8'; g.lineWidth = 2; g.strokeRect(0, 0, w, w); g.strokeStyle = '#2a2060'; g.lineWidth = 1; g.strokeRect(w / 4, w / 4, w / 2, w / 2); }), 5, 10); }
function enseigneLueur(txt, fondc, cadre, lettre, lueur) { return tex(toile(512, 256, (g, w, h) => { g.fillStyle = fondc; g.fillRect(0, 0, w, h); g.strokeStyle = cadre; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
  bulbes(g, w, h, 30, '#fff2c0'); g.font = '120px Rye, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = lueur; g.shadowBlur = 24; g.lineWidth = 10; g.strokeStyle = lueur; g.strokeText(txt, w / 2, h / 2 + 8); g.fillStyle = lettre; g.fillText(txt, w / 2, h / 2 + 8); })); }

// --- L'épave (maquette 3) ---
function causTex() { return tex(toile(256, 256, (g, w) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, w); g.strokeStyle = 'rgba(150,235,255,.6)'; g.lineWidth = 3; if ('filter' in g) g.filter = 'blur(1.4px)';
  for (let i = 0; i < 60; i++) { const x = Math.random() * w, y = Math.random() * w, r = 10 + Math.random() * 24, ry = r * (.45 + Math.random() * .5), a = Math.random() * 3;
    for (const ox of [-w, 0, w]) for (const oy of [-w, 0, w]) { g.beginPath(); g.ellipse(x + ox, y + oy, r, ry, a, 0, 7); g.stroke(); } } }), 3, 6); }
function coqueTex() { return tex(toile(512, 256, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#3a2a1a' : '#33241a'; g.fillRect(0, i * 32, w, 32); g.fillStyle = '#1a120a'; g.fillRect(0, i * 32 + 30, w, 2); } grain(g, w, h, '#140c06', 200, .25);
  for (const x of [70, 442]) { g.fillStyle = '#b08d3c'; g.beginPath(); g.arc(x, 128, 52, 0, 7); g.fill(); const v = g.createRadialGradient(x - 12, 116, 4, x, 128, 42); v.addColorStop(0, '#bff6ff'); v.addColorStop(1, '#0a5866'); g.fillStyle = v; g.beginPath(); g.arc(x, 128, 40, 0, 7); g.fill();
    g.fillStyle = '#6a5420'; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; g.beginPath(); g.arc(x + Math.cos(a) * 46, 128 + Math.sin(a) * 46, 3.5, 0, 7); g.fill(); } }
  g.fillStyle = '#17352f'; g.fillRect(140, 70, 232, 116); g.strokeStyle = '#c9a24a'; g.lineWidth = 6; g.strokeRect(140, 70, 232, 116);
  texte(g, 'Romet', "96px 'Pirata One', Georgia, serif", 256, 132, '#f2c95c', '#3a2508', 8); })); }
function doublon() { return tex(toile(128, 128, (g, w) => { g.fillStyle = '#e8a838'; g.fillRect(0, 0, w, w); g.fillStyle = '#f6be4a'; g.beginPath(); for (let k = 0; k < 14; k++) { const a = k * Math.PI / 7, r = w * (.4 + Math.random() * .04); g.lineTo(w / 2 + Math.cos(a) * r, w / 2 + Math.sin(a) * r); } g.fill();
  g.strokeStyle = '#9a6e1c'; g.lineWidth = 7; g.beginPath(); g.moveTo(w / 2, 26); g.lineTo(w / 2, 102); g.moveTo(26, w / 2); g.lineTo(102, w / 2); g.stroke(); g.lineWidth = 4;
  for (const [x, y] of [[w / 2, 26], [w / 2, 102], [26, w / 2], [102, w / 2]]) { g.beginPath(); if (x === w / 2) { g.moveTo(x - 9, y); g.lineTo(x + 9, y); } else { g.moveTo(x, y - 9); g.lineTo(x, y + 9); } g.stroke(); }
  g.fillStyle = '#9a6e1c'; for (const [x, y] of [[46, 46], [82, 46], [46, 82], [82, 82]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); } })); }
function algueTex() { return tex(toile(64, 256, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#2f8a5a'; g.beginPath(); g.moveTo(w / 2 - 5, h); for (let y = h; y > 0; y -= 8) g.lineTo(w / 2 + Math.sin(y * .06) * 14 - 6, y); for (let y = 0; y < h; y += 8) g.lineTo(w / 2 + Math.sin(y * .06) * 14 + 6, y); g.fill();
  g.fillStyle = '#3fae70'; for (let y = 20; y < h; y += 26) { g.beginPath(); g.ellipse(w / 2 + Math.sin(y * .06) * 14 + 12, y, 12, 5, -.5, 0, 7); g.ellipse(w / 2 + Math.sin(y * .06) * 14 - 12, y + 12, 12, 5, .5, 0, 7); g.fill(); } })); }
function poisson(c) { const s = new T.Shape(); s.absellipse(0, 0, .28, .13, 0, Math.PI * 2); const q = new T.Shape(); q.moveTo(-.22, 0); q.lineTo(-.45, .14); q.lineTo(-.45, -.14); q.lineTo(-.22, 0);
  const g = new T.Group(); g.add(new T.Mesh(new T.ShapeGeometry(s), basic({ color: c, side: T.DoubleSide, fog: false }))); g.add(new T.Mesh(new T.ShapeGeometry(q), basic({ color: c, side: T.DoubleSide, fog: false })));
  const o = new T.Mesh(new T.CircleGeometry(.03, 8), basic({ color: 0x000000 })); o.position.set(.16, .03, .001); g.add(o); return g; }

// --- L'horloger (maquette 3) ---
function engrenage(g, cx, cy, r, dents, coul, sombre, trou) { g.fillStyle = coul; g.beginPath(); for (let k = 0; k < dents * 2; k++) { const a0 = k * Math.PI / dents, rr = k % 2 ? r * .84 : r; g.lineTo(cx + Math.cos(a0 - .08) * rr, cy + Math.sin(a0 - .08) * rr); g.lineTo(cx + Math.cos(a0 + Math.PI / dents * .6) * rr, cy + Math.sin(a0 + Math.PI / dents * .6) * rr); } g.closePath(); g.fill();
  g.fillStyle = sombre; for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; g.beginPath(); g.arc(cx + Math.cos(a) * r * .5, cy + Math.sin(a) * r * .5, r * .17, 0, 7); g.fill(); }
  g.beginPath(); g.arc(cx, cy, r * .13, 0, 7); g.fillStyle = trou || sombre; g.fill(); g.strokeStyle = sombre; g.lineWidth = r * .04; g.beginPath(); g.arc(cx, cy, r * .7, 0, 7); g.stroke(); }
function cuirTex() { return tex(toile(256, 256, (g, w, h) => { g.fillStyle = '#1d3a2a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { g.fillStyle = Math.random() < .5 ? '#24452f' : '#183325'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
  g.strokeStyle = '#b8934a'; g.lineWidth = 2; g.setLineDash([6, 6]); g.strokeRect(8, 8, w - 16, h - 16); g.setLineDash([]); }), 2, 4); }
function cadranTex() { return tex(toile(512, 256, (g, w, h) => { g.fillStyle = '#3a2414'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#3a2414' : '#432a17'; g.fillRect(i * 32, 0, 32, h); } grain(g, w, h, '#1e120a', 160, .3);
  g.fillStyle = '#c9a35a'; g.beginPath(); g.arc(256, 100, 92, 0, 7); g.fill(); g.fillStyle = '#f3e9d2'; g.beginPath(); g.arc(256, 100, 82, 0, 7); g.fill();
  const ch = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']; g.fillStyle = '#2a1a10'; g.font = '700 16px Cinzel, Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  ch.forEach((t, i) => { const a = -Math.PI / 2 + i * Math.PI / 6; g.fillText(t, 256 + Math.cos(a) * 66, 100 + Math.sin(a) * 66); });
  for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, r1 = i % 5 ? 79 : 75; g.strokeStyle = '#2a1a10'; g.lineWidth = i % 5 ? 1 : 3; g.beginPath(); g.moveTo(256 + Math.cos(a) * r1, 100 + Math.sin(a) * r1); g.lineTo(256 + Math.cos(a) * 82, 100 + Math.sin(a) * 82); g.stroke(); }
  texte(g, 'ROMET', '700 18px Cinzel, Georgia, serif', 256, 130, '#7a1e1e', null);
  for (const x of [60, 452]) engrenage(g, x, 100, 46, 14, '#a8843c', '#3a2414'); })); }
function rouageFace() { return tex(toile(128, 128, (g, w) => { g.fillStyle = '#6a4a18'; g.fillRect(0, 0, w, w);
  g.fillStyle = '#d9b25a'; g.beginPath(); for (let k = 0; k < 32; k++) { const a = k * Math.PI / 16, rr = k % 2 ? 54 : 63; g.lineTo(64 + Math.cos(a - .1) * rr, 64 + Math.sin(a - .1) * rr); g.lineTo(64 + Math.cos(a + .1) * rr, 64 + Math.sin(a + .1) * rr); } g.fill();
  g.fillStyle = '#7a5418'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + .22; g.beginPath(); g.arc(64, 64, 42, a, a + Math.PI / 2 - .44); g.arc(64, 64, 17, a + Math.PI / 2 - .44, a, true); g.closePath(); g.fill(); }
  g.strokeStyle = '#f6dc94'; g.lineWidth = 3; g.beginPath(); g.arc(64, 64, 48, 0, 7); g.stroke(); g.fillStyle = '#f6dc94'; g.beginPath(); g.arc(64, 64, 11, 0, 7); g.fill(); g.fillStyle = '#3a2408'; g.beginPath(); g.arc(64, 64, 4, 0, 7); g.fill(); })); }
function grandRouage(c, sombre) { return tex(toile(256, 256, (g, w) => { g.clearRect(0, 0, w, w); engrenage(g, 128, 128, 124, 18, c, sombre); })); }

// --- La machine secrète (pixel 3D, maquette 1) : textures minuscules, filtrées au plus proche ---
function pix(c) { c.magFilter = T.NearestFilter; c.minFilter = T.NearestFilter; c.generateMipmaps = false; return c; }
function damier(a, b, rx, ry) { return pix(tex(toile(8, 8, (g, w) => { g.fillStyle = a; g.fillRect(0, 0, w, w); g.fillStyle = b; g.fillRect(0, 0, 4, 4); g.fillRect(4, 4, 4, 4); }), rx, ry)); }
function pixtexte(txt, fondc, c) { return pix(tex(toile(64, 32, (g, w, h) => { g.fillStyle = fondc; g.fillRect(0, 0, w, h); g.fillStyle = '#000'; g.fillRect(0, 0, w, 2); g.fillRect(0, h - 2, w, 2);
  g.font = "8px 'Press Start 2P', monospace"; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#000'; g.fillText(txt, w / 2 + 1, h / 2 + 1); g.fillStyle = c; g.fillText(txt, w / 2, h / 2); }))); }
function pixFace(a, b, c) { return pix(tex(toile(16, 16, (g) => { g.fillStyle = a; g.fillRect(0, 0, 16, 16); g.fillStyle = b; g.fillRect(2, 2, 12, 1); g.fillRect(2, 13, 12, 1); g.fillRect(2, 2, 1, 12); g.fillRect(13, 2, 1, 12);
  g.fillStyle = c; for (const [x, y] of [[6, 4], [7, 4], [8, 4], [6, 5], [9, 5], [6, 6], [7, 6], [8, 6], [6, 7], [8, 7], [6, 8], [9, 8], [6, 9], [9, 9]]) g.fillRect(x, y + 1, 1, 1); }))); }

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
  epave(s) {
    s.background = new T.Color(0x04202c); s.fog = new T.Fog(0x0a3a4c, 11, 28);
    s.add(new T.HemisphereLight(0x6fc8e0, 0x02161e, .6)); const d = new T.DirectionalLight(0xfff0d0, .95); d.position.set(1, 10, 3); s.add(d);
    const bois = phong({ map: planches('#3d2f20', '#36291c', '#1a120a', 1, 1, 1), shininess: 10 }), laiton = phong({ color: 0x9a8a4a, specular: 0x88ffee, shininess: 50 }), or = phong({ color: 0xd88a1c, specular: 0xb08040, shininess: 50 });
    const caus = causTex(), c1 = new T.Mesh(new T.PlaneGeometry(5.2, 7), basic({ map: caus, transparent: true, blending: T.AdditiveBlending, depthWrite: false, opacity: .85 })); c1.rotation.x = -Math.PI / 2; c1.position.set(0, .012, 0); s.add(c1);
    const coque = phong({ map: coqueTex(), shininess: 10 }), coffre = phong({ color: 0x5a3a1c, shininess: 20 });
    const nb = 40, bp = new Float32Array(nb * 3); for (let i = 0; i < nb; i++) { bp[i * 3] = (Math.random() - .5) * 7; bp[i * 3 + 1] = Math.random() * 6 - 1; bp[i * 3 + 2] = -6 + Math.random() * 9; }
    const bg = new T.BufferGeometry(); bg.setAttribute('position', new T.BufferAttribute(bp, 3)); s.add(new T.Points(bg, new T.PointsMaterial({ color: 0xc8f6ff, size: .11, transparent: true, opacity: .7, depthWrite: false })));
    const am = basic({ map: algueTex(), transparent: true, alphaTest: .4, side: T.DoubleSide }), algues = [];
    for (const [x, z, hh] of [[-3.2, 1.6, 2.6], [3.25, .4, 2.2], [-3.3, -1.2, 2.8], [3.3, 2.6, 2.4]]) { const a = new T.Mesh(new T.PlaneGeometry(.7, hh), am); a.position.set(x, hh / 2 - .6, z); s.add(a); algues.push(a); }
    const poissons = [[0xffa62a, 1], [0xffe14a, -1], [0xff6a8a, 1]].map(([c, sens], i) => { const p = poisson(c); p.userData = { sens, y: 3.95 + i * .18, v: .5 + i * .25, x: (Math.random() - .5) * 8 }; p.position.z = -5.7; s.add(p); return p; });
    let t0 = 0, houle = 0;
    return { sol: phong({ map: planches('#4a3a28', '#433424', '#1f170f', 1, 2, 3), shininess: 12 }), poussoir: bois, bandePoussoir: laiton, fond: [bois, bois, bois, bois, coque, bois],
      murs: bois, bandeMurs: laiton, facade: [coffre, coffre, coffre, coffre, phong({ map: tex(toile(512, 128, (g, w, h) => { g.fillStyle = '#3a2414'; g.fillRect(0, 0, w, h); g.fillStyle = '#b08d3c'; g.fillRect(0, 0, w, 10); g.fillRect(0, h - 10, w, 10); texte(g, 'Trésor', "72px 'Pirata One', Georgia, serif", w / 2, h / 2 + 4, '#f2c95c', '#1a0e04', 6); })), shininess: 10 }), coffre],
      bac: coffre, levre: laiton, piece: face3(or, doublon(), 0x9a7a3a, 50), geante: face3(or, doublon(), 0x9a7a3a, 50), segPiece: 20,
      murBonus: phong({ color: 0x5fe0d0, emissive: 0x0a4a50, transparent: true, opacity: .45 }), etincelle: 0xc8f6ff,
      // le courant : les reflets, les bulles, les algues et les poissons partent du même côté que le tas
      animer(t, p) { const dt = Math.min(.1, t - t0); t0 = t; const c = p.pl.courant ? Math.sign(p.pl.courant) : 0; houle += (c - houle) * Math.min(1, dt * 3);
        caus.offset.set(caus.offset.x + (Math.cos(t * .3) * .024 + houle * .4) * dt, t * .05);
        for (let i = 0; i < nb; i++) { bp[i * 3 + 1] += dt * (.6 + (i % 5) * .15); bp[i * 3] += (Math.sin(t * 2 + i) * .1 + houle * 2.5) * dt; if (bp[i * 3 + 1] > 5.5 || Math.abs(bp[i * 3]) > 4) { bp[i * 3 + 1] = -1; bp[i * 3] = (Math.random() - .5) * 7; } } bg.attributes.position.needsUpdate = true;
        algues.forEach((a, i) => { a.rotation.z = Math.sin(t * 1.2 + i) * .12 - houle * .35; });
        poissons.forEach(f => { const u = f.userData; u.x += (u.v * u.sens + houle * 2) * dt; if (Math.abs(u.x) > 5) { u.sens = -Math.sign(u.x); u.x = Math.sign(u.x) * 5; } f.position.x = u.x; f.position.y = u.y + Math.sin(t * 1.5 + u.v * 5) * .06; f.scale.x = u.sens; }); } };
  },
  casino(s) {
    s.background = new T.Color(0x07051a); s.fog = new T.Fog(0x07051a, 17, 36);
    s.add(new T.HemisphereLight(0x8a7bff, 0x120a24, .75)); const d = new T.DirectionalLight(0xffffff, .8); d.position.set(2, 8, 6); s.add(d);
    const p1 = new T.PointLight(0xff3fa4, 1.2, 14); p1.position.set(-2.4, 2, 1.5); s.add(p1); const p2 = new T.PointLight(0x35e0ff, 1.2, 14); p2.position.set(2.4, 2, 1.5); s.add(p2);
    const rose = basic({ color: 0xff3fa4 }), cyan = basic({ color: 0x35e0ff }), sombre = phong({ color: 0x150f2e, shininess: 40 }), chrome = phong({ color: 0xd5dbee, specular: 0xffffff, shininess: 120 });
    const or = phong({ color: 0xc8901f, specular: 0x8a6a2a, shininess: 40 });
    return { sol: phong({ map: grille(), specular: 0x7766ff, shininess: 90 }), poussoir: chrome, bandePoussoir: rose,
      fond: [sombre, sombre, sombre, sombre, basic({ map: enseigneNeon('ROMET') }), sombre],
      murs: phong({ color: 0x58e1ff, transparent: true, opacity: .16, depthWrite: false }), bandeMurs: cyan,
      facade: [sombre, sombre, sombre, sombre, basic({ map: neonPlaque('WIN', '#ff3fa4') }), sombre], bac: chrome, levre: rose,
      piece: face3(or, faceR('#f4c246', '#a87414', '#fff3b0'), 0x8a6a2a, 40), geante: face3(or, faceR('#f4c246', '#a87414', '#ff3fa4'), 0x8a6a2a, 40), segPiece: 20,
      couloirAllume: 0xff3fa4, couloirEteint: 0x2a1a50,
      murBonus: phong({ color: 0x35e0ff, emissive: 0x0a5a70, transparent: true, opacity: .45 }), etincelle: 0xff9ad0,
      animer(t) { p1.intensity = 1.1 + Math.sin(t * 2) * .3; p2.intensity = 1.1 + Math.cos(t * 2) * .3; } };
  },
  nuit(s, m) {
    s.background = new T.Color(0x120a1c); s.fog = new T.Fog(0x120a1c, 17, 36);
    s.add(new T.HemisphereLight(0x9a7ac8, 0x1a0a14, .6)); const d = new T.DirectionalLight(0xffe8c8, .55); d.position.set(-3, 9, 6); s.add(d);
    const pc = new T.PointLight(0xffb050, 1.1, 16); pc.position.set(0, 3.2, -2.5); s.add(pc); const pr = new T.PointLight(0xff3fa4, .9, 12); pr.position.set(0, 1.5, 3); s.add(pr);
    const laque = phong({ color: 0x7a1e2a, specular: 0x663344, shininess: 50 }), laiton = phong({ color: 0xc9973a, specular: 0xffe7a0, shininess: 90 }), rose = basic({ color: 0xff3fa4 });
    const or = phong({ color: 0xd09a2a, specular: 0x9a7a3a, shininess: 50 });
    return { sol: phong({ map: planches('#6a4024', '#5e381e', '#2e1a0c', 1, 2, 3), specular: 0x664422, shininess: 50 }), poussoir: laiton, bandePoussoir: rose,
      fond: [laque, laque, laque, laque, basic({ map: enseigneLueur('Romet', '#2a0c26', '#c9973a', '#fff0f8', '#ff3fa4') }), laque],
      murs: laque, bandeMurs: rose, facade: [laque, laque, laque, laque, basic({ map: enseigneLueur('Jackpot', '#2a0c26', '#c9973a', '#ffe2a0', '#ffb04a') }), laque], bac: laiton, levre: rose,
      auvent: auvent('#5a1440', '#c9973a'), ampoules: cadreAmpoules(m.finCotes), allumee: 0xffd890, eteinte: 0x4a2a18, clignote: (i, k) => ((i * 7 + k * 3) % 11) !== 0, vitesseAmp: 2.5,
      clou: basic({ color: 0xffd0ea }), piece: face3(or, faceR('#f0b83c', '#8a5a12', '#fff3b0'), 0x9a7a3a, 50), geante: face3(laiton, faceR('#f0b83c', '#8a5a12', '#ff3fa4'), 0x9a7a3a, 50), segPiece: 20,
      murBonus: phong({ color: 0xff3fa4, emissive: 0x5a0a30, transparent: true, opacity: .45 }), etincelle: 0xffd890,
      animer(t) { pr.intensity = .8 + Math.sin(t * 3) * .15; } };
  },
  horloger(s, m) {
    s.background = new T.Color(0x0e1712); s.fog = new T.Fog(0x0e1712, 18, 38);
    s.add(new T.HemisphereLight(0xfff0d0, 0x102018, .65)); const d = new T.DirectionalLight(0xffe8c0, .75); d.position.set(3, 9, 5); s.add(d);
    const lampe = new T.PointLight(0xffd090, .6, 16); lampe.position.set(2.5, 4, 0); s.add(lampe);
    const noyer = phong({ map: planches('#4a2e18', '#432a16', '#1e120a', 1, 1, 2), shininess: 30 }), laiton = phong({ color: 0xc9a35a, specular: 0xfff0c0, shininess: 100 }), sombre = phong({ color: 0x2a1a10, shininess: 20 }), laitonP = phong({ color: 0xb8913c, specular: 0x8a7040, shininess: 40 });
    // aiguilles du cadran (centre du cadran en haut du mur du fond, au-dessus de l'étage)
    const aig = (l, e, c) => { const g = new T.Group(), x = new T.Mesh(new T.BoxGeometry(e, l, .02), basic({ color: c })); x.position.y = l / 2 - .06; g.add(x); g.position.set(0, 2.45, -5.33); s.add(g); return g; };
    const heures = aig(.4, .06, 0x2a1a10), minutes = aig(.6, .04, 0x2a1a10), secondes = aig(.62, .02, 0xb0201a);
    const roua = (c, sz, x, y, z) => { const g = new T.Mesh(new T.PlaneGeometry(sz, sz), phong({ map: grandRouage(c, '#3a2414'), transparent: true, alphaTest: .5, side: T.DoubleSide, shininess: 60 })); g.position.set(x, y, z); s.add(g); return g; };
    const g1 = roua('#b08a3a', 2.4, -1.5, 3.7, -5.65), g2 = roua('#c9a35a', 1.7, .42, 3.95, -5.7), g3 = roua('#9a7a32', 1.2, 1.75, 3.6, -5.68);
    // le mécanisme : roue et manivelle à gauche, coulisse fixée au poussoir
    const ZC = -1.4, roue = new T.Group(); roue.position.set(-3.1, 1.3, ZC); s.add(roue);
    const disque = new T.Mesh(new T.CylinderGeometry(.72, .72, .1, 28), [laiton, phong({ map: grandRouage('#c9a35a', '#5a3a18'), transparent: true, alphaTest: .5, shininess: 80 }), laiton]); disque.rotation.z = Math.PI / 2; roue.add(disque);
    const maneton = new T.Mesh(new T.CylinderGeometry(.06, .06, .3, 10), laiton); maneton.rotation.z = Math.PI / 2; maneton.position.set(-.12, .6, 0); roue.add(maneton);
    const axe = new T.Mesh(new T.CylinderGeometry(.09, .09, .5, 12), sombre); axe.rotation.z = Math.PI / 2; roue.add(axe);
    const coulisse = new T.Mesh(new T.BoxGeometry(.08, 1.7, .16), laiton); s.add(coulisse); const bras = new T.Mesh(new T.BoxGeometry(.5, .1, .1), laiton); s.add(bras);
    const pied = new T.Mesh(new T.BoxGeometry(.18, 1.2, .3), sombre); pied.position.set(-3.1, .2, ZC); s.add(pied);
    return { sol: phong({ map: cuirTex(), shininess: 8 }), poussoir: laiton, bandePoussoir: sombre, fond: [noyer, noyer, noyer, noyer, phong({ map: cadranTex(), shininess: 20 }), noyer],
      murs: noyer, bandeMurs: laiton, etagere: noyer, poussoirHaut: laiton,
      facade: [noyer, noyer, noyer, noyer, phong({ map: tex(toile(512, 128, (g, w, h) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, w, h); g.strokeStyle = '#c9a35a'; g.lineWidth = 6; g.strokeRect(10, 10, w - 20, h - 20); texte(g, 'ÉCHAPPEMENT', '700 40px Cinzel, Georgia, serif', w / 2, h / 2 + 3, '#e6c47a', null); })), shininess: 30 }), noyer],
      bac: laiton, levre: sombre, piece: face3(laitonP, rouageFace(), 0x8a7040, 40), geante: face3(laitonP, rouageFace(), 0x8a7040, 40), segPiece: 20,
      murBonus: phong({ color: 0xc9a35a, emissive: 0x3a2a08, transparent: true, opacity: .5 }), etincelle: 0xffe8a0,
      animer(t, p) { const th = 2 * Math.PI * p.pl.t / 2.6; roue.rotation.x = th; const zt = ZC + .6 * Math.sin(th);
        coulisse.position.set(-3.24, 1.3, zt); bras.position.set(-2.95, .45, zt);
        secondes.rotation.z = -Math.floor(t) * Math.PI / 30; minutes.rotation.z = -t * Math.PI / 300; heures.rotation.z = -t * Math.PI / 3600 - 1;
        g1.rotation.z = th * .4; g2.rotation.z = -th * .4 * 18 / 14 - .1; g3.rotation.z = th * .4 * 18 / 10; } };
  },
  secrete(s) {
    s.background = new T.Color(0x2b1b5a); s.fog = null;
    s.add(new T.AmbientLight(0xffffff, .55)); const d = new T.DirectionalLight(0xffffff, .8); d.position.set(3, 8, 5); s.add(d);
    const lambert = o => new T.MeshLambertMaterial(o), bleu = lambert({ color: 0x3a5bd9 }), jaune = lambert({ color: 0xffd23a }), noir = lambert({ color: 0x1a1030 });
    const face = lambert({ map: pixFace('#ffd23a', '#c08a10', '#fff6b0') }), faceG = lambert({ map: pixFace('#ffd23a', '#c08a10', '#ff3a5a') });
    return { pixel: .4, sol: lambert({ map: damier('#1f9a5a', '#178048', 5, 10) }), poussoir: lambert({ color: 0xe8433a }), bandePoussoir: jaune,
      fond: [bleu, bleu, bleu, bleu, basic({ map: pixtexte('ROMET', '#3a5bd9', '#ffe14a') }), bleu],
      murs: bleu, bandeMurs: jaune, facade: [noir, noir, noir, noir, basic({ map: pixtexte('WIN!', '#1a1030', '#ff5fd2') }), noir], bac: jaune, levre: noir,
      piece: [jaune, face, face], geante: [jaune, faceG, faceG], segPiece: 8, couloirAllume: 0xff5fd2, couloirEteint: 0x1a1030, clou: jaune,
      murBonus: lambert({ color: 0x5ef0ff, transparent: true, opacity: .55 }), etincelle: 0xffe14a, animer() {} };
  },
};
})();

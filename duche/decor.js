/* =====================================================================
   DUCHÉ · le DESSIN (pixel art 32 bits, direction de la maquette 5).
   La scène se dessine dans une toile basse de 216 × 384 agrandie sans
   lissage ; les textes s'écrivent ensuite sur la toile affichée (Tx).
   - carte : carteFixe(etat) dessine une fois terrains, rivière, bâtiments,
     frontières et teinte des seigneurs (refaite quand l'état change) ;
     carteAnimee(L, t, etat, o) ajoute ce qui bouge (vagues, écume,
     reflets, moutons, oiseaux, drapeaux, fumée, moulins, wagonnet,
     nuages) et les écussons de garnison.
   - scènes HD-2D (comme Le Thé des Jarls) : spriteD (soldats 28 × 30
     détourés et éclairés), fondCombat (décor peint selon le terrain et
     la saison), avantCombat (herbe floue), banniereD, illustration des
     événements.
   - habillage : plaque, parchemin, bouton, icone, Tx.
   Tout passe par window.DucDecor ; rien ici ne touche aux règles.
   ===================================================================== */
(function () {
  'use strict';
  const W = 216, H = 384, S = 17, CX = 108, CY = 150, A3 = Math.sqrt(3) / 2;
  const BX = -2, BY = -2;   // les bâtiments un peu en haut à gauche de la terre : l'écusson de garnison (en bas à droite) ne les cache pas
  const COS = [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * Math.PI / 3), Math.sin(i * Math.PI / 3)]);
  const PS = "'Press Start 2P', monospace";
  const SEIG = [
    { c: '#f0bc28', f: '#8a6410', em: 'couronne', emc: '#7a1a10' },
    { c: '#d8443a', f: '#7a1a18', em: 'tour', emc: '#f4ecd8' },
    { c: '#4282e0', f: '#1c3c78', em: 'etoile', emc: '#f4ecd8' },
    { c: '#9a58cc', f: '#4a2468', em: 'epee', emc: '#f4ecd8' },
  ];
  const NEUTRE = '#8a8478';
  const hh = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; }
  const r = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };

  /* ---------- géométrie des hexagones ---------- */
  const centre = i => { const [q, rr] = DUC_CASES[i]; return [Math.round(CX + S * Math.sqrt(3) * (q + rr / 2)), Math.round(CY + S * 1.5 * rr)]; };
  function pixHex(cx, cy, s, fn) {
    const ap = s * A3 - 0.5;
    for (let dy = -s; dy <= s; dy++) for (let dx = -Math.ceil(ap); dx <= Math.ceil(ap); dx++) {
      let m = 1e9, mi = 0;
      for (let i = 0; i < 6; i++) { const d = ap - (dx * COS[i][0] + dy * COS[i][1]); if (d < m) { m = d; mi = i; } }
      if (m >= 0) fn(cx + dx, cy + dy, dx, dy, m, mi);
    }
  }
  function versCase(x, y) {
    const q = ((x - CX) * Math.sqrt(3) / 3 - (y - CY) / 3) / S, rr = (y - CY) * 2 / 3 / S;
    let X = q, Z = rr, Y = -X - Z, rx = Math.round(X), ry = Math.round(Y), rz = Math.round(Z);
    const dx = Math.abs(rx - X), dy = Math.abs(ry - Y), dz = Math.abs(rz - Z);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy <= dz) rz = -rx - ry;
    return ducCase(rx, rz);
  }
  // voisine de i par le côté k (ou -1)
  const cote = (i, k) => { const [q, rr] = DUC_CASES[i]; return ducCase(q + DUC_VOIS[k][0], rr + DUC_VOIS[k][1]); };
  function distSeg(px, py, ax, ay, bx, by) { const vx = bx - ax, vy = by - ay, l = vx * vx + vy * vy, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l)); return Math.hypot(px - ax - t * vx, py - ay - t * vy); }
  // côtés par où passe la rivière sur la terre i : vers les terres de rivière voisines (et vers le bord pour les bouts)
  function rivCotes(etat, i) {
    const k = [0, 1, 2, 3, 4, 5].filter(c => { const v = cote(i, c); return v >= 0 && etat.terres[v].t === 'riviere'; });
    if (k.length === 1) k.push((k[0] + 3) % 6);
    if (!k.length) k.push(1, 4);
    return k;
  }

  /* ---------- petits dessins de la carte ---------- */
  const TC = {
    plaine: ['#7ab24c', '#8cc45a', '#689a40'], foret: ['#4e8a3a', '#5e9c44', '#3c7030'], montagne: ['#8a9070', '#9aa07c', '#727a5c'],
    colline: ['#86aa52', '#9cbe62', '#6c8e42'], marais: ['#66844e', '#76905a', '#506c3e'], riviere: ['#74aa4a', '#86bc58', '#629640'],
  };
  // couleurs des feuillages selon la saison
  const FEUIL = { printemps: ['#6ac04e', '#3d8a32', '#2a6624'], 'été': ['#62b046', '#3d8a32', '#2a6624'], automne: ['#e0a040', '#c06a28', '#8a4418'], hiver: ['#e8f0f4', '#7a8a7a', '#4a5a4a'] };
  function chene(B, x, y, R, sa) {
    const F = FEUIL[sa] || FEUIL['été'];
    r(B, x - R + 2, y + R - 1, R * 2, 2, 'rgba(0,0,0,.25)'); r(B, x, y + R - 2, 1, 3, '#5a3a1a');
    for (let j = -R; j <= R; j++) { const w = Math.round(Math.sqrt(R * R - j * j)); r(B, x - w, y + j, w * 2, 1, j < -R / 3 ? F[0] : j < R / 3 ? F[1] : F[2]); }
    r(B, x - 1, y - R + 1, 2, 1, sa === 'hiver' ? '#ffffff' : sa === 'automne' ? '#f8d070' : '#9ad866');
  }
  function pin(B, x, y, sa) {
    r(B, x - 2, y + 1, 7, 2, 'rgba(0,0,0,.25)'); r(B, x, y, 1, 2, '#5a3a1a');
    for (let j = 0; j < 9; j++) { const w = Math.floor(j / 2) + 1 - (j === 4 || j === 6 ? 1 : 0); r(B, x - w, y - 9 + j, w, 1, '#3a7a3a'); r(B, x, y - 9 + j, w + 1, 1, '#245a2c'); if (sa === 'hiver' && j % 3 === 1) r(B, x - w, y - 9 + j, w, 1, '#eef4f8'); }
    r(B, x, y - 10, 1, 1, sa === 'hiver' ? '#ffffff' : '#5aa050');
  }
  function pic(B, cx, by, h) {
    for (let j = 0; j < h; j++) { const w = Math.round(j * 0.9); r(B, cx - w, by - h + j, w, 1, '#b0b0b8'); r(B, cx, by - h + j, w + 1, 1, '#6c6c7a'); if (j < h * 0.35) { r(B, cx - w, by - h + j, w, 1, '#f6f8fc'); r(B, cx, by - h + j, w + 1, 1, '#c8cedc'); } }
    r(B, cx, by, h, 1, 'rgba(0,0,0,.22)');   // ombre portée vers la droite
  }
  function rocher(B, x, y) { r(B, x, y, 3, 2, '#9a968a'); r(B, x, y, 2, 1, '#c8c4b8'); r(B, x + 1, y + 2, 3, 1, 'rgba(0,0,0,.25)'); }
  function batiment(B, b, cx, cy) {
    if (b === 'chateau') {
      r(B, cx - 9, cy + 5, 20, 2, 'rgba(0,0,0,.25)'); const m = '#bcb4a8', o = '#7c7468';
      // palissade devant
      for (let i = 0; i < 11; i++) r(B, cx - 11 + i * 2, cy + 3, 1, 3, i % 2 ? '#8a5a2a' : '#a8743a');
      r(B, cx - 8, cy - 5, 16, 9, m); r(B, cx - 8, cy + 3, 16, 1, o); r(B, cx + 7, cy - 5, 1, 9, o);
      for (let i = 0; i < 4; i++) r(B, cx - 8 + i * 4, cy - 7, 2, 2, m);
      for (let i = 0; i < 3; i++) r(B, cx - 6 + i * 5, cy - 2 + (i % 2), 2, 1, '#a49c90');
      [-10, 7].forEach(d => { r(B, cx + d, cy - 10, 4, 14, m); r(B, cx + d + 3, cy - 10, 1, 14, o); r(B, cx + d - 1, cy - 12, 6, 2, '#6a6460'); r(B, cx + d + 1, cy - 6, 1, 2, '#2a2018'); });
      r(B, cx - 2, cy, 4, 4, '#3a2a1a'); r(B, cx - 2, cy, 4, 1, '#5a4430');
      r(B, cx - 3, cy - 13, 6, 9, m); r(B, cx - 3, cy - 15, 2, 2, m); r(B, cx + 1, cy - 15, 2, 2, m); r(B, cx + 2, cy - 13, 1, 9, o); r(B, cx - 1, cy - 10, 1, 2, '#f0d070');
      r(B, cx - 1, cy - 22, 1, 8, '#4a3a2a');
    }
    if (b === 'ferme') {
      // grange rouge, champ de blé, moulin blanc (ailes animées)
      r(B, cx - 10, cy + 6, 21, 2, 'rgba(0,0,0,.22)');
      r(B, cx - 11, cy + 2, 10, 5, '#d8c060'); for (let i = 0; i < 4; i++) r(B, cx - 10 + i * 2, cy + 3, 1, 4, '#b09030');
      r(B, cx - 1, cy - 3, 10, 8, '#b8402e'); r(B, cx + 8, cy - 3, 1, 8, '#7a2418'); r(B, cx - 1, cy - 3, 10, 1, '#d8604a');
      for (let j = 0; j < 4; j++) r(B, cx - 2 + j, cy - 4 - j, 12 - j * 2, 1, j % 2 ? '#5a3424' : '#4a2a1a');
      r(B, cx + 2, cy + 1, 4, 4, '#f0e0c0'); r(B, cx + 2, cy + 1, 1, 1, '#7a2418'); r(B, cx + 5, cy + 1, 1, 1, '#7a2418'); r(B, cx + 3, cy + 2, 2, 2, '#7a2418'); r(B, cx + 2, cy + 4, 1, 1, '#7a2418'); r(B, cx + 5, cy + 4, 1, 1, '#7a2418');
      r(B, cx + 3, cy - 2, 2, 2, '#f0d070'); r(B, cx + 6, cy - 9, 2, 3, '#8a4a30');
      r(B, cx - 7, cy - 6, 3, 10, '#ece4d4'); r(B, cx - 5, cy - 6, 1, 10, '#b0a898'); r(B, cx - 8, cy - 8, 5, 2, '#8a4a30'); r(B, cx - 6, cy - 1, 1, 2, '#3a2412');
    }
    if (b === 'scierie') {
      // cabane de bois, grande scie ronde, pile de grumes
      r(B, cx - 10, cy + 6, 21, 2, 'rgba(0,0,0,.22)');
      r(B, cx - 9, cy - 2, 9, 7, '#9a6a3a'); r(B, cx - 9, cy - 2, 9, 1, '#c08a50'); r(B, cx - 1, cy - 2, 1, 7, '#5a3a1c');
      for (let i = 0; i < 4; i++) r(B, cx - 8 + i * 2, cy - 1, 1, 6, '#86582c');
      for (let j = 0; j < 3; j++) r(B, cx - 10 + j, cy - 3 - j, 11 - j * 2, 1, j % 2 ? '#5a3a22' : '#4a2e18');
      r(B, cx - 6, cy + 1, 3, 4, '#2a1a0c');
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d2 = dx * dx + dy * dy; if (d2 <= 16) r(B, cx + 5 + dx, cy - 3 + dy, 1, 1, d2 >= 12 ? ((dx + dy) % 2 ? '#8a9098' : '#e8ecf0') : d2 <= 1 ? '#3a3a42' : '#c8ccd4'); }
      r(B, cx + 4, cy + 1, 3, 2, '#6a4a2a');
      for (let i = 0; i < 3; i++) { const y = cy + 5 - i * 2, x0 = cx + 1 + (i === 2 ? 2 : 0); r(B, x0, y, 9 - (i === 2 ? 3 : 0), 2, '#a06a34'); r(B, x0 + 8 - (i === 2 ? 3 : 0), y, 1, 2, '#f0c890'); r(B, x0, y, 9 - (i === 2 ? 3 : 0), 1, '#c08a50'); }
    }
    if (b === 'caserne') {
      // tente à mât, râtelier de lances, palissade pointue devant
      r(B, cx - 10, cy + 6, 21, 2, 'rgba(0,0,0,.22)');
      for (let j = 0; j < 9; j++) { const w = Math.round(j * 0.9) + 1; r(B, cx - 3 - w, cy - 7 + j, w, 1, '#f0e8d8'); r(B, cx - 3, cy - 7 + j, w, 1, '#c8bca8'); }
      r(B, cx - 4, cy - 1, 2, 3, '#4a3020'); r(B, cx - 3, cy - 13, 1, 7, '#4a3a2a');
      for (const sx of [4, 6, 8]) { r(B, cx + sx, cy - 7, 1, 10, '#8a5a2e'); r(B, cx + sx, cy - 9, 1, 2, '#e2e6ea'); }
      r(B, cx + 3, cy - 2, 7, 1, '#6a4420');
      for (let i = 0; i < 10; i++) { r(B, cx - 10 + i * 2, cy + 1, 2, 5, i % 2 ? '#8a5a2a' : '#a8743a'); r(B, cx - 10 + i * 2, cy, 1, 1, '#c8945a'); }
      r(B, cx - 10, cy + 3, 20, 1, '#5a3a1c');
    }
    if (b === 'marche') {
      // deux étals à auvent rayé, tonneaux, sacs et pièces
      r(B, cx - 10, cy + 6, 21, 2, 'rgba(0,0,0,.22)');
      for (const [ox, c1] of [[-9, '#d84a3a'], [1, '#4282e0']]) {
        r(B, cx + ox, cy - 1, 9, 6, '#a87a48'); r(B, cx + ox, cy + 4, 9, 1, '#6a4a28');
        for (let i = 0; i < 5; i++) r(B, cx + ox - 1 + i * 2, cy - 6, 2, 4, i % 2 ? '#f0ece0' : c1);
        r(B, cx + ox - 1, cy - 2, 11, 1, '#5a3a20'); r(B, cx + ox, cy - 2, 1, 7, '#5a3a20'); r(B, cx + ox + 8, cy - 2, 1, 7, '#5a3a20');
      }
      r(B, cx - 7, cy, 3, 2, '#e0b030'); r(B, cx - 3, cy, 2, 2, '#80b040'); r(B, cx + 3, cy, 2, 2, '#c05030'); r(B, cx + 6, cy, 2, 2, '#f0e0a0');
      r(B, cx - 1, cy + 4, 3, 3, '#7a5a3a'); r(B, cx - 1, cy + 5, 3, 1, '#4a3420');
      r(B, cx + 7, cy + 5, 3, 2, '#f2d250'); r(B, cx + 8, cy + 4, 1, 1, '#fff0a0');
    }
    if (b === 'tour') {
      r(B, cx - 3, cy + 5, 10, 2, 'rgba(0,0,0,.25)'); r(B, cx - 4, cy - 11, 8, 17, '#a8a29a'); r(B, cx + 3, cy - 11, 1, 17, '#6a645c');
      for (let j = 0; j < 4; j++) r(B, cx - 3, cy - 8 + j * 4, 6, 1, '#948e86');
      r(B, cx - 5, cy - 13, 10, 3, '#c8c2b8'); for (let i = 0; i < 3; i++) r(B, cx - 5 + i * 4, cy - 15, 2, 2, '#c8c2b8');
      r(B, cx - 1, cy - 7, 2, 3, '#2a2018'); r(B, cx - 1, cy - 22, 1, 7, '#4a3a2a');
    }
    if (b === 'mine') {
      // rocher, entrée boisée, rails et wagonnet d'or
      r(B, cx - 10, cy + 6, 21, 2, 'rgba(0,0,0,.22)');
      for (let j = -9; j <= 0; j++) { const w = Math.round(Math.sqrt(81 - j * j) * 1.2); r(B, cx - 1 - w, cy + 5 + j, w * 2, 1, j < -6 ? '#c8c4b8' : j < -3 ? '#9a968a' : '#7a766a'); }
      r(B, cx - 5, cy - 1, 7, 7, '#120c08'); r(B, cx - 6, cy - 2, 9, 1, '#8a6a40'); r(B, cx - 6, cy - 2, 1, 8, '#8a6a40'); r(B, cx + 2, cy - 2, 1, 8, '#8a6a40');
      r(B, cx - 4, cy + 1, 1, 1, '#f0c030'); r(B, cx, cy + 3, 1, 1, '#f0c030');
      r(B, cx - 2, cy + 6, 13, 1, '#5a4a3a'); for (let i = 0; i < 6; i++) r(B, cx - 1 + i * 2, cy + 7, 1, 1, '#6a5030');
      r(B, cx + 7, cy + 3, 3, 2, '#f2d250'); r(B, cx + 8, cy + 2, 1, 1, '#fff0a0');
    }
  }
  // petits personnages (5 × 9) qui marchent sur la carte
  function perso(L, x, y, col, pas) {
    r(L, x + 1, y, 3, 1, '#c8ccd4'); r(L, x, y + 1, 5, 1, '#9aa0a8'); r(L, x + 1, y + 2, 3, 1, '#f0c8a0'); r(L, x + 1, y + 3, 3, 3, col);
    r(L, x, y + 3, 1, 2, '#7a5a30'); r(L, x + 4, y - 2, 1, 8, '#8a6a40'); r(L, x + 4, y - 3, 1, 1, '#e8eef4');
    r(L, x + 1, y + 6, 1, 2 + (pas ? 1 : 0), '#4a3020'); r(L, x + 3, y + 6, 1, 3 - (pas ? 1 : 0), '#4a3020');
  }

  /* ---------- habillage ---------- */
  function plaque(B, x, y, w, h, sombre) {
    r(B, x, y, w, h, '#120c08'); r(B, x + 1, y + 1, w - 2, h - 2, sombre ? '#24160c' : '#3a2412'); r(B, x + 1, y + 1, w - 2, Math.floor(h / 2), sombre ? '#3a2614' : '#5a3a20');
    r(B, x + 2, y + 2, w - 4, 1, sombre ? '#6a4a28' : '#a87a40'); r(B, x + 2, y + 2, 1, h - 4, sombre ? '#6a4a28' : '#a87a40');
    r(B, x + w - 3, y + 2, 1, h - 4, 'rgba(0,0,0,.4)'); r(B, x + 2, y + h - 3, w - 4, 1, 'rgba(0,0,0,.4)');
  }
  function parchemin(B, x, y, w, h) {
    r(B, x, y, w, h, '#120c08'); r(B, x + 1, y + 1, w - 2, h - 2, '#6a4424'); r(B, x + 3, y + 3, w - 6, h - 6, '#e8d4a4');
    for (let i = 0; i < w * h / 14; i++) { const a = x + 4 + hh(i, x) * (w - 8), b = y + 4 + hh(y, i) * (h - 8); r(B, a, b, 1, 1, hh(i, i) < 0.5 ? '#dcc690' : '#f0e0b8'); }
    r(B, x + 3, y + 3, w - 6, 1, '#f8ecc8'); r(B, x + 3, y + h - 4, w - 6, 1, '#c8ac78');
    [[x + 1, y + 1], [x + w - 4, y + 1], [x + 1, y + h - 4], [x + w - 4, y + h - 4]].forEach(([a, b]) => r(B, a, b, 3, 3, '#c89a40'));
  }
  const COUL_BOUTON = { normal: ['#7a5430', '#4a3018', '#c89a60'], fort: ['#7a9a3a', '#4a6a1e', '#c0e080'], rouge: ['#8a4a30', '#5a2a18', '#d89070'], eteint: ['#4a3a2e', '#33281e', '#6a5a48'] };
  function bouton(L, x, y, w, h, style) {
    const c = COUL_BOUTON[style] || COUL_BOUTON.normal;
    r(L, x, y, w, h, '#120c08'); r(L, x + 1, y + 1, w - 2, h - 2, c[1]); r(L, x + 1, y + 1, w - 2, Math.floor((h - 2) / 2), c[0]); r(L, x + 2, y + 2, w - 4, 1, c[2]);
  }
  const ICO = {
    ble: ['...y...', '.y.y.y.', '..yyy..', '.y.y.y.', '..yyy..', '...g...', '...g...'], bois: ['.......', 'bbbbbb.', 'BbbbbbO', 'bbbbbb.', 'BbbbbbO', 'bbbbbb.', '.......'],
    or: ['..ooo..', '.oOOOo.', 'oOoooOo', 'oOoooOo', 'oOoooOo', '.oOOOo.', '..ooo..'], epee: ['......w', '....ww.', '...ww..', 'h.ww...', '.hw....', 'hhh....', 'h.h....'],
    couronne: ['y..y..y', 'yy.y.yy', 'yyyyyyy', 'yrYbYry', 'yyyyyyy'], pause: ['hh.hh', 'hh.hh', 'hh.hh', 'hh.hh', 'hh.hh'],
  };
  const IC = { y: '#f2d250', g: '#6aa040', b: '#a06a34', B: '#6a4020', O: '#e0b070', o: '#f8d040', w: '#e8eef4', h: '#e8dcc0', r: '#d03030', Y: '#fff0a0' };
  function icone(B, n, x, y) { ICO[n].forEach((l, j) => [...l].forEach((c, i) => { if (c === '.') return; let k = IC[c]; if (n === 'or' && c === 'O') k = '#c88a10'; if (n === 'epee' && c === 'h') k = '#8a5a28'; r(B, x + i, y + j, 1, 1, k); })); }
  // texte net sur la toile affichée (k = agrandissement) ; o : s taille, f police, c couleur, a alignement, w graisse
  function Tx(g, k, txt, x, y, o) {
    o = o || {};
    g.font = (o.w || '700') + ' ' + (o.s || 8) * k + 'px ' + (o.f || 'Rajdhani, sans-serif'); g.textAlign = o.a || 'left'; g.textBaseline = 'middle';
    if (o.ombre !== false) { g.fillStyle = o.o || '#120c08'; g.fillText(txt, x * k + Math.max(1, k * 0.7), y * k + Math.max(1, k * 0.7)); }
    g.fillStyle = o.c || '#fff'; g.fillText(txt, x * k, y * k);
  }
  // texte coupé en lignes de largeur max (en unités basses)
  function lignes(g, k, txt, max, o) {
    o = o || {}; g.font = (o.w || '700') + ' ' + (o.s || 8) * k + 'px ' + (o.f || 'Rajdhani, sans-serif');
    const mots = String(txt).split(' '), out = []; let l = '';
    for (const m of mots) { const t = l ? l + ' ' + m : m; if (g.measureText(t).width / k > max && l) { out.push(l); l = m; } else l = t; }
    if (l) out.push(l);
    return out;
  }

  /* ---------- la carte fixe ---------- */
  function carteFixe(etat) {
    const cv = mk(W, H), B = cv.getContext('2d'), sa = ducSaison(etat.tour), hiver = sa === 'hiver';
    r(B, 0, 0, W, H, '#2a1c12'); for (let j = 0; j < H; j += 3) r(B, 0, j, W, 1, 'rgba(0,0,0,.12)');
    for (let j = 38; j < 248; j++) r(B, 0, j, W, 1, j % 4 ? '#1e5a8a' : '#22629a');
    for (let i = 0; i < 70; i++) r(B, hh(i, 9) * W, 40 + hh(9, i) * 206, 2, 1, '#2a6ea8');
    etat.terres.forEach((t, i) => { const [x, y] = centre(i); pixHex(x, y + 4, S, (X, Y) => r(B, X, Y, 1, 1, '#4a3018')); pixHex(x, y + 2, S, (X, Y) => r(B, X, Y, 1, 1, (X + Y) % 5 === 0 ? '#6a4628' : '#8a6038')); });
    const ecume = [];
    etat.terres.forEach((t, i) => {
      const [x, y] = centre(i), c = TC[t.t], o = t.prop, ap = S * A3, riv = t.t === 'riviere' ? rivCotes(etat, i) : null, champ = t.t === 'plaine' && !t.bat;
      pixHex(x, y, S, (X, Y, dx, dy, m, mi) => {
        const n = hh(X, Y);
        let col = n < 0.12 ? c[1] : n > 0.9 ? c[2] : c[0], eau = false;
        if (sa === 'automne' && n > 0.8) col = '#a8a048';
        if (champ && m > 3) { const bande = Math.floor((dy + dx * 0.5 + 40) / 3) % 2; col = sa === 'printemps' ? (bande ? '#9ccc5a' : '#86b84a') : hiver ? (bande ? '#d8c8a0' : '#b8a888') : bande ? (n < 0.2 ? '#f0d878' : '#d8b850') : (n < 0.3 ? '#c8a840' : '#b89838'); }
        if (riv) {
          let d = 99; for (const k of riv) d = Math.min(d, distSeg(dx, dy, 0, 0, COS[k][0] * ap, COS[k][1] * ap));
          if (d < 3.2) { col = hiver ? (d < 1.4 ? '#a8d0ec' : '#88b8e0') : d < 1.4 ? '#3f8ad4' : '#2f78c0'; eau = true; } else if (d < 4.4) col = '#c8b880';
        }
        // bord éclairé, transition douce vers la terre
        if (!eau && m < 1 && (mi === 4 || mi === 5 || mi === 3)) col = hiver ? '#ffffff' : '#a8d870';
        else if (!eau && m < 2 && hh(Y, X) < 0.35) col = c[2];
        if (hiver && !eau && hh(X + 3, Y) < 0.18) col = '#eef4f8';
        r(B, X, Y, 1, 1, col);
        if (o >= 0) { const v = cote(i, mi); if (m < 2.2 && !(v >= 0 && etat.terres[v].prop === o)) r(B, X, Y, 1, 1, m < 1.1 ? SEIG[o].f : SEIG[o].c); }
        if (m < 1 && cote(i, mi) < 0) ecume.push([X + Math.round(COS[mi][0] * 2), Y + Math.round(COS[mi][1] * 2) + (COS[mi][1] > 0.1 ? 4 : 0), hh(X, Y) * 6.28]);
      });
      if (o >= 0) { B.globalAlpha = 0.2; pixHex(x, y, S - 2, (X, Y) => r(B, X, Y, 1, 1, SEIG[o].c)); B.globalAlpha = 1; }
      const b = t.bat;
      // touffes d'herbe et cailloux
      if (!b && t.t !== 'riviere') for (let k = 0; k < 5; k++) { const a = x - 10 + hh(i, k) * 20, bb = y - 9 + hh(k, i) * 18; if (t.t === 'colline' || t.t === 'montagne') rocher(B, a, bb); else { r(B, a, bb, 1, 2, c[2]); r(B, a + 1, bb + 1, 1, 1, c[2]); } }
      if (t.t === 'foret' && !b) {
        const pts = [[-6, -6], [5, -7], [-1, 0], [7, 2], [-8, 4], [1, 8], [-4, -12]].slice(0, 4 + t.qual).sort((a, c2) => a[1] - c2[1]);
        pts.forEach(([a, bb], k) => (hh(k, i + 7) < 0.45 ? pin(B, x + a, y + bb + 3, sa) : chene(B, x + a, y + bb, 4, sa)));
      }
      if (t.t === 'montagne' && !b) { pic(B, x - 3, y + 6, 14); pic(B, x + 6, y + 10, 10); if (t.qual > 2) pic(B, x - 8, y + 11, 7); }
      if (t.t === 'colline' && !b) {
        const bosse = (cx, cy, R) => { for (let j = -R; j <= 0; j++) { const w = Math.round(Math.sqrt(R * R - j * j) * 1.4); r(B, cx - w, cy + j, w * 2, 1, hiver ? (j < -R * 0.4 ? '#ffffff' : '#dce6ea') : j < -R * 0.6 ? '#b4d074' : '#9cbe62'); } r(B, cx - R * 1.4, cy, R * 2.8, 1, '#5a7a38'); };
        bosse(x - 4, y - 2, 5); bosse(x + 5, y + 6, 6);
      }
      if (t.t === 'marais' && !b) {
        [[-8, -4, 8], [1, 1, 9], [-5, 7, 7]].forEach(([a, bb, w]) => { r(B, x + a, y + bb, w, 2, hiver ? '#b8d4dc' : '#4a7a7e'); r(B, x + a + 1, y + bb, w - 3, 1, hiver ? '#e8f4f8' : '#7ab0b0'); });
        for (let k = 0; k < 6; k++) { const a = x - 9 + hh(k, x) * 18, bb = y - 8 + hh(y, k) * 14; r(B, a, bb, 1, 4, '#3a5a28'); r(B, a, bb, 1, 1, '#8a6030'); }
      }
      if (t.t === 'riviere' && !b) { const k = (riv[0] + 2) % 6, vx = Math.round(COS[k][0] * 9), vy = Math.round(COS[k][1] * 9); chene(B, x + vx, y + vy, 3, sa); }
      // qualité : petits épis (ou pierres) en bas de la tuile
      for (let q = 0; q < t.qual; q++) { const qx = x - 3 + q * 3, qy = y + 13; r(B, qx, qy, 1, 2, '#120c08'); r(B, qx, qy - 1, 1, 2, t.t === 'montagne' || t.t === 'colline' ? '#e0d8c8' : '#f2d250'); }
      if (b) batiment(B, b, x + BX, y + BY + (b === 'chateau' ? 2 : 1));
    });
    cv.ecume = ecume;
    return cv;
  }

  /* ---------- ce qui bouge sur la carte ---------- */
  // o : { sel, cibles (terres en surbrillance), fleches [[de, vers, couleur]], marche { de, vers, s, t0 }, clignote { i, couleur } }
  function carteAnimee(L, t, etat, base, o) {
    o = o || {};
    const sa = ducSaison(etat.tour);
    for (let i = 0; i < 40; i++) { const x = ((hh(i, 1) * W + t * 4 * (i % 2 ? 1 : -1)) % W + W) % W, y = 42 + hh(i, 2) * 200; if (Math.sin(t * 2 + i) > 0.3) r(L, x, y, 3, 1, '#4a8ac0'); }
    base.ecume.forEach(([x, y, ph]) => { const v = Math.sin(t * 2.2 + ph + x * 0.2); if (v > 0.55) r(L, x, y, 1, 1, v > 0.85 ? '#ffffff' : '#bfe0f4'); });
    etat.terres.forEach((tt, i) => {
      const [x, y] = centre(i), b = tt.bat, ow = tt.prop;
      if (tt.t === 'riviere' && sa !== 'hiver') {
        const ks = rivCotes(etat, i), ap = S * A3;
        for (let k = 0; k < 3; k++) { const s = ks[k % ks.length], u = ((t * 0.5 + k / 3 + hh(i, k)) % 1), ent = k % 2 ? 1 - u : u; r(L, x + COS[s][0] * ap * ent + (k - 1), y + COS[s][1] * ap * ent, k % 2 ? 2 : 1, 1, '#a8e0f8'); }
      }
      if (tt.t === 'marais' && !b) { const ph = (t * 0.7 + hh(i, 3)) % 1; if (ph < 0.6) { const R = Math.round(ph * 5); r(L, x - 3 - R, y + 2, 1, 1, '#bfe6f0'); r(L, x - 3 + R, y + 2, 1, 1, '#bfe6f0'); } }
      if (tt.t === 'colline' && !b && sa !== 'hiver') for (let k = 0; k < 2; k++) { const sx = x - 6 + k * 7 + Math.round(Math.sin(t * 0.4 + k * 2 + i) * 3), sy = y + 1 + k * 4, dir = Math.cos(t * 0.4 + k * 2 + i) > 0; r(L, sx, sy, 3, 2, '#f4f4ee'); r(L, sx + (dir ? 3 : -1), sy, 1, 1, '#3a3a3a'); r(L, sx, sy + 2, 1, 1, '#3a3a3a'); r(L, sx + 2, sy + 2, 1, 1, '#3a3a3a'); }
      if (tt.t === 'plaine' && !b && sa === 'été') { const s = Math.sin(t * 1.6 + x * 0.15); if (s > 0.7) for (let k = 0; k < 5; k++) r(L, x - 9 + k * 4, y - 6 + ((k * 5) % 11), 1, 1, '#fff0a0'); }
      if (tt.t === 'foret' && !b && hh(i, 5) < 0.5) { const ph = (t * 0.3 + hh(i, 6) * 3) % 3; if (ph < 1) { const bx = x - 6 + ph * 14, by = y - 8 - Math.sin(ph * 3) * 4, a = Math.sin(t * 14) > 0; r(L, bx - 1, by - (a ? 1 : 0), 1, 1, '#2a2a2a'); r(L, bx + 1, by - (a ? 1 : 0), 1, 1, '#2a2a2a'); r(L, bx, by, 1, 1, '#2a2a2a'); } }
      const bx = x + BX, by = y + BY + (b === 'chateau' ? 2 : 1);
      if ((b === 'chateau' || b === 'tour') && ow >= 0) { const fy = by + (b === 'chateau' ? -22 : -20); for (let k = 0; k < 7; k++) { const dy = Math.round(Math.sin(t * 6 - k * 0.9)); r(L, bx + k, fy + dy, 1, 5 - (k > 4 ? 1 : 0), k === 0 ? SEIG[ow].f : SEIG[ow].c); } }
      if (b === 'ferme') {
        for (let k = 0; k < 3; k++) { const ph = (t * 0.5 + k / 3) % 1; L.globalAlpha = 1 - ph; r(L, bx + 6 + Math.round(Math.sin(ph * 6 + k) * 2), by - 11 - ph * 12, 2 + Math.round(ph * 2), 2, '#e8e8e8'); }
        L.globalAlpha = 1;
        const a = t * 2.5; for (let k = 0; k < 4; k++) { const an = a + k * Math.PI / 2; for (let k2 = 1; k2 <= 5; k2++) r(L, bx - 6 + Math.round(Math.cos(an) * k2), by - 8 + Math.round(Math.sin(an) * k2), 1, 1, k2 > 2 ? '#f0ece0' : '#8a6a40'); }
      }
      if (b === 'scierie') { for (let k = 0; k < 2; k++) { const an = t * 5 + k * Math.PI; r(L, bx + 5 + Math.round(Math.cos(an) * 3), by - 3 + Math.round(Math.sin(an) * 3), 1, 1, '#ffffff'); } if (Math.floor(t * 4) % 3 === 0) r(L, bx + 1, by - 5, 1, 1, '#f0d8a0'); }
      if (b === 'caserne' && ow >= 0) for (let k = 0; k < 5; k++) r(L, bx - 2 + k, by - 13 + Math.round(Math.sin(t * 6 - k)), 1, 3, k === 0 ? SEIG[ow].f : SEIG[ow].c);
      if (b === 'mine') { const ph = (t * 0.4) % 1; r(L, bx - 1 + Math.round(ph * 7), by + 4, 3, 2, '#5a5a62'); r(L, bx + Math.round(ph * 7), by + 3, 1, 1, '#f0c030'); }
    });
    // neige ou feuilles qui tombent selon la saison ; nuages et oiseaux
    L.save(); L.beginPath(); L.rect(0, 38, W, 210); L.clip();
    if (sa === 'hiver' || sa === 'automne') for (let k = 0; k < 30; k++) { const x = (hh(k, 7) * W + Math.sin(t + k) * 6) % W, y = 38 + ((hh(7, k) * 210 + t * (sa === 'hiver' ? 12 : 8)) % 210); r(L, x, y, 1, 1, sa === 'hiver' ? '#ffffff' : ['#e0a040', '#c06a28'][k % 2]); }
    [[(t * 6) % (W + 160) - 80, 40, 70, 30], [(t * 4.2 + W * 0.6) % (W + 200) - 100, 110, 90, 36]].forEach(([x, y, w, h2]) => { L.globalAlpha = 0.16; for (let j = 0; j < h2 / 2; j++) { const ww = Math.round(Math.sqrt(Math.max(0, 1 - ((j - h2 / 4) / (h2 / 4)) ** 2)) * w / 2); r(L, x - ww + (j % 3), y + j * 2, ww * 2, 2, '#06121a'); } });
    L.globalAlpha = 1;
    if (sa !== 'hiver') { const bx = (t * 14) % (W + 40) - 20, by = 70 + Math.sin(t * 0.5) * 8; for (let k = 0; k < 3; k++) { const ax = bx - k * 7, ay = by + k * 3, ail = Math.sin(t * 10 + k) > 0 ? 1 : 0; r(L, ax - 2, ay - ail, 2, 1, '#1a1a1a'); r(L, ax + 1, ay - ail, 2, 1, '#1a1a1a'); r(L, ax, ay, 1, 1, '#1a1a1a'); } }
    L.restore();
    // surbrillances : cibles possibles, terre qui clignote
    if (o.cibles) o.cibles.forEach(i => { const [x, y] = centre(i); pixHex(x, y, S, (X, Y, dx, dy, m) => { if (m < 1.2 && (X + Y + Math.floor(t * 6)) % 4 < 2) r(L, X, Y, 1, 1, o.cibleCol || '#ffffff'); }); });
    if (o.clignote) { const [x, y] = centre(o.clignote.i); L.globalAlpha = 0.55 * Math.abs(Math.sin(t * 6)); pixHex(x, y, S, (X, Y) => r(L, X, Y, 1, 1, o.clignote.c)); L.globalAlpha = 1; }
    // la troupe qui marche
    if (o.marche) {
      const m = o.marche, [ax, ay] = centre(m.de), [bx, by] = centre(m.vers), ph = Math.min(1, (t - m.t0) / 0.9);
      for (let k = 0; k < 3; k++) { const u = Math.max(0, Math.min(1, ph - k * 0.08)); perso(L, ax - 2 + (bx - ax) * u - k * 3, ay - 4 + (by - ay) * u + k * 2, SEIG[m.s].c, Math.floor(t * 6 + k) % 2); }
    }
    // écussons de garnison
    const ecus = [];
    etat.terres.forEach((tt, i) => {
      const g2 = o.garn && o.garn[i] != null ? o.garn[i] : tt.gar;
      if (!g2) return;
      const [x, y] = centre(i), c = tt.prop >= 0 ? SEIG[tt.prop].c : tt.brig ? '#5a5048' : NEUTRE, px = x + 5, py = y + 4;
      r(L, px - 1, py - 1, 13, 12, '#120c08'); r(L, px, py, 11, 8, c); r(L, px + 1, py + 8, 9, 1, c); r(L, px + 2, py + 9, 7, 1, c); r(L, px + 4, py + 10, 3, 1, c); r(L, px, py, 11, 1, 'rgba(255,255,255,.4)');
      ecus.push([px + 5.5, py + 4.5, g2, i]);
    });
    // sélection et flèches
    if (o.sel != null && o.sel >= 0) { const [sx, sy] = centre(o.sel), bl = Math.floor(t * 3) % 2; pixHex(sx, sy, S, (X, Y, dx, dy, m) => { if (m < 1.6) r(L, X, Y, 1, 1, bl ? '#ffffff' : m < 0.8 ? '#120c08' : '#fff6c0'); }); }
    if (o.fleches) o.fleches.forEach(([de, vers, col]) => {
      const [ax, ay] = centre(de), [sx, sy] = centre(vers);
      for (let k = 0; k < 3; k++) { const ph = (t * 1.2 + k / 3) % 1, px = ax + (sx - ax) * (0.25 + ph * 0.5), py = ay + (sy - ay) * (0.25 + ph * 0.5); r(L, px - 1, py - 1, 3, 3, '#120c08'); r(L, px, py, 1, 1, col || '#f0c24a'); }
    });
    return ecus;
  }

  /* ---------- HD-2D : soldats détourés ---------- */
  const CORPS_SOLDAT = ['....kHH.....', '...khhhH....', '...hhhhhH...', '..HHHHHhH...', '...bssseh...', '...bsssssS..', '...bbbbbbb..', '....bbbbB...', '...cTttTtt..', '..cctrrttt..', '..cCtrrttTt.', '..cCttttttT.', '..cCllyllll.', '..cCtttttTt.', '...CttTtTT..', '....pp.pP...', '....pp.pP...', '....PP.PP...', '...LLl.LLl..', '............'];
  const CORPS_CAPUCHE = ['....TTT.....', '...TtttT....', '..TttttTT...', '..TtTssss...', '..Ttssses...', '..TtsssssS..', '..TTsbbbb...', '...TTbbB....', '..wwTtttt...', '..wwtttttt..', '..wWttttttt.', '..wWtttttTt.', '..WWllyllll.', '...WtttttTt.', '...tttTtTT..', '....pp.pP...', '....pp.pP...', '....PP.PP...', '...LLl.LLl..', '............'];
  const CORPS_PELERIN = ['....TTT.....', '...TtttT....', '..TttttTT...', '..TtTssss...', '..Ttssses...', '..TtsssssS..', '..TTssbbb...', '...TTttt....', '..TTtttttt..', '..TtttttttT.', '..TttttttttT', '..TtlllllltT', '..TttttttttT', '..TttttttttT', '..TttttttttT', '..TttttttttT', '...TtttttTT.', '....LL.LL...', '...LLl.LLl..', '............'];
  // casques (acier, bronze, cuir), barbes (aucune, brune, rousse, grise)
  const CASQUES = [['#f2f6f8', '#b8c0c8', '#7d8590'], ['#f4dca0', '#c8a050', '#8a6a28'], ['#c8a07a', '#8a6440', '#5a3e24']];
  const BARBES = [null, '#5a3a1c', '#b0582a', '#a8a8a0'];
  function paletteD(type, col, colf, v) {
    if (type === 'soldat') { const C = CASQUES[v % 3], b = BARBES[(v >> 1) % 4]; return { k: C[0], h: C[1], H: C[2], s: '#f0c08e', S: '#c98f62', e: '#2a1a10', b: b || '#f0c08e', B: b || '#c98f62', t: col, T: colf, r: '#f4ecd8', c: '#9aa2aa', C: '#646c74', l: '#5a3a1c', L: '#3a2412', y: '#f2c94c', p: '#5a4a3a', P: '#3a2e22', w: '#8a5a2e', W: '#5a3a1c', m: '#e2e6ea', M: '#8a929a' }; }
    if (type === 'brigand') { const B = [['#d9822b', '#a85a18'], ['#5a3a20', '#3a2412'], ['#8a8478', '#5a564e']][v % 3]; return { s: '#e8b888', S: '#b88860', e: '#2a1a10', b: B[0], B: B[1], t: ['#6a5a42', '#5a6a48', '#6a4a3a'][v % 3], T: ['#4a3e2c', '#3e4a30', '#4a3226'][v % 3], l: '#3a2a1a', y: '#8a7a5a', p: '#4a4038', P: '#2e2820', L: '#2a1e14', w: '#6a4a28', W: '#4a3018', m: '#b4b8bc', M: '#6a6e74', c: '#5a5040', C: '#3a3428' }; }
    return { s: '#f0c08e', S: '#c98f62', e: '#2a1a10', b: '#cfc6b6', B: '#9a9284', t: ['#8a6a48', '#7a6a5a', '#6a5a48'][v % 3], T: ['#5a4430', '#4e4438', '#463a2c'][v % 3], l: '#c8b890', y: '#e8d8a0', L: '#3a2a1a', w: '#7a5a30', W: '#5a3a1c' };
  }
  function tracer(px, x0, y0, x1, y1, col) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col); }
  function ecu(px, ox, oy, Q, v) {
    for (let y = 0; y < 12; y++) for (let x = 0; x < 5; x++) {
      if (y === 0 && (x === 0 || x === 4)) continue; if (y >= 8 && (x < y - 7 || x > 11 - y)) continue;
      const bord = y === 0 || x === 0 || x === 4 || (y >= 8 && (x === y - 7 || x === 11 - y)); let c = Q.t;
      if (!bord) { if (v % 2 === 0) c = x === 2 || y === 3 ? Q.r : Q.t; else c = y < 4 ? Q.r : Q.t; }
      px(ox + x, oy + y, bord ? Q.l : c);
    }
  }
  const CACHE_D = new Map();
  // s : 0 regarde à droite, 1 à gauche ; type : soldat, brigand, pelerin ; pose : garde, charge, mort
  function spriteD(s, type, pose, v, col, colf) {
    const cle = [s, type, pose, v, col].join('|'); if (CACHE_D.has(cle)) return CACHE_D.get(cle);
    if (pose === 'mort') { const b = spriteD(s, type, 'garde', v, col, colf), c = mk(30, 28), g = c.getContext('2d'); g.translate(15, 22); g.rotate(s ? Math.PI / 2 : -Math.PI / 2); g.globalAlpha = 0.85; g.drawImage(b, -14, -26); CACHE_D.set(cle, c); return c; }
    const SW = 28, SH = 30, c = mk(SW, SH), g = c.getContext('2d'), Q = paletteD(type, col, colf, v);
    const px = (x, y, cc) => { if (x < 0 || y < 0 || x >= SW || y >= SH || !cc) return; g.fillStyle = cc; g.fillRect(x, y, 1, 1); };
    const corps = type === 'soldat' ? CORPS_SOLDAT : type === 'brigand' ? CORPS_CAPUCHE : CORPS_PELERIN;
    if (type === 'soldat' && pose !== 'charge') { tracer(px, 9, 25, 10, 3, Q.w); px(10, 0, Q.m); px(10, 1, Q.m); px(9, 2, Q.M); px(10, 2, Q.m); px(11, 2, Q.M); }
    if (type === 'brigand' && pose !== 'charge') { tracer(px, 12, 22, 7, 8, Q.w); for (const [x, y] of [[5, 7], [6, 7], [4, 8], [5, 8], [6, 8], [4, 9], [5, 9], [6, 9], [4, 10], [5, 10], [6, 10], [5, 11], [6, 11]]) px(x, y, Q.m); }
    if (type === 'pelerin') { tracer(px, 19, 26, 19, 4, Q.w); px(18, 4, Q.w); px(19, 3, Q.w); }
    corps.forEach((l, y) => { for (let x = 0; x < 12; x++) if (l[x] !== '.') px(8 + x, 6 + y, Q[l[x]]); });
    // nasal du casque (une variante sur deux)
    if (type === 'soldat' && v % 2) { px(15, 10, Q.h); px(15, 11, Q.H); }
    if (type !== 'pelerin') { px(12, 15, Q.T); px(12, 16, Q.T); px(11, 17, Q.T); px(11, 18, Q.s); }
    if (type === 'soldat') {
      if (pose === 'charge') { px(17, 14, Q.T); px(18, 13, Q.T); px(19, 13, Q.s); tracer(px, 4, 20, 24, 11, Q.w); for (const [x, y] of [[25, 10], [26, 10], [25, 11], [27, 9], [24, 10]]) px(x, y, Q.m); px(26, 9, Q.M); }
      ecu(px, pose === 'garde' ? 18 : 16, 12, Q, v);
    }
    if (type === 'brigand') {
      if (pose === 'charge') { px(17, 14, Q.T); px(18, 13, Q.T); px(19, 12, Q.s); tracer(px, 16, 18, 22, 7, Q.w); for (const [x, y] of [[22, 4], [23, 4], [22, 5], [23, 5], [24, 5], [23, 6], [24, 6], [24, 7], [23, 7], [24, 8]]) px(x, y, Q.m); }
      else { px(17, 15, Q.T); px(18, 16, Q.s); }
      if (v % 3 === 1) { for (let y = 0; y < 9; y++) for (let x = 0; x < 5; x++) { if ((y === 0 || y === 8) && (x === 0 || x === 4)) continue; px(17 + x, 13 + y, (x === 0 || x === 4 || y === 0 || y === 8) ? '#4a3018' : (x + y) % 3 ? '#8a6034' : '#7a5028'); } px(19, 17, '#b4b8bc'); }
    }
    if (type === 'pelerin') { px(18, 13, Q.T); px(18, 14, Q.s); }
    // détourage et lumière du soleil
    const id = g.getImageData(0, 0, SW, SH), d = id.data, plein = [];
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) plein.push(d[(y * SW + x) * 4 + 3] > 0);
    const P = (x, y) => x >= 0 && y >= 0 && x < SW && y < SH && plein[y * SW + x], sun = s ? -1 : 1;
    for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
      const i = (y * SW + x) * 4;
      if (!P(x, y)) { if (P(x + 1, y) || P(x - 1, y) || P(x, y + 1) || P(x, y - 1)) { d[i] = 27; d[i + 1] = 20; d[i + 2] = 18; d[i + 3] = 255; } }
      else if (!P(x + sun, y)) { d[i] = Math.min(255, d[i] * 0.55 + 255 * 0.45); d[i + 1] = Math.min(255, d[i + 1] * 0.55 + 236 * 0.45); d[i + 2] = Math.min(255, d[i + 2] * 0.55 + 190 * 0.45); }
      else if (!P(x, y - 1)) { d[i] = Math.min(255, d[i] * 1.15); d[i + 1] = Math.min(255, d[i + 1] * 1.12); d[i + 2] = Math.min(255, d[i + 2] * 1.08); }
    }
    g.putImageData(id, 0, 0);
    const out = s ? mk(SW, SH) : c; if (s) { const g2 = out.getContext('2d'); g2.translate(SW, 0); g2.scale(-1, 1); g2.drawImage(c, 0, 0); }
    CACHE_D.set(cle, out); return out;
  }
  function detourer(c, col) {
    col = col || [27, 20, 18]; const g = c.getContext('2d'), W2 = c.width, H2 = c.height, id = g.getImageData(0, 0, W2, H2), d = id.data, pl = [];
    for (let i = 0; i < W2 * H2; i++) pl.push(d[i * 4 + 3] > 0); const P = (x, y) => x >= 0 && y >= 0 && x < W2 && y < H2 && pl[y * W2 + x];
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) if (!P(x, y) && (P(x + 1, y) || P(x - 1, y) || P(x, y + 1) || P(x, y - 1))) { const i = (y * W2 + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; }
    g.putImageData(id, 0, 0); return c;
  }
  function crete(g, w, base, amp, seed, pas, u) {
    g.beginPath(); g.moveTo(0, base * u + 2);
    for (let x = 0; x <= w + pas; x += pas) { const y = base - amp * (0.55 + 0.28 * Math.sin(x / w * 7 + seed) + 0.17 * Math.sin(x / w * 19 + seed * 3)); g.lineTo(x * u, y * u); }
    g.lineTo(w * u, base * u + 2); g.closePath();
  }
  const EMB = {
    couronne: ['#.##.#', '######', '######', '.####.', '......', '......'], crane: ['.####.', '######', '#.##.#', '######', '.#..#.', '.####.'],
    tour: ['#.#.#.', '######', '.####.', '.#..#.', '.####.', '.####.'], etoile: ['..##..', '######', '.####.', '.####.', '##..##', '......'], epee: ['..#...', '..#...', '..#...', '#####.', '..#...', '..#...'],
  };
  function banniereD(g, x, y, dir, coul, bord, em, emc, t, dechiree) {
    g.fillStyle = '#3a2410'; g.fillRect(x, y - 36, 1, 36); g.fillStyle = '#f2c94c'; g.fillRect(x - 1, y - 37, 3, 1);
    for (let k = 0; k < 10; k++) {
      const o = Math.round(Math.sin(t * 4 - k * 0.7) * 1.2 * (k / 10)), cx = dir > 0 ? x + 1 + k : x - 1 - k, h = dechiree ? (k > 6 ? 8 - (k % 2) * 3 : 12) : (k > 8 ? 10 : 12);
      g.fillStyle = k === 9 ? bord : coul; g.fillRect(cx, y - 35 + o, 1, h);
      if (k >= 2 && k < 8) EMB[em].forEach((l, j) => { if (l[k - 2] === '#') { g.fillStyle = emc; g.fillRect(cx, y - 32 + j + o, 1, 1); } });
    }
  }
  function petitChateau() {
    const c = mk(30, 26), g = c.getContext('2d'), R = (x, y, w, h, cc) => { g.fillStyle = cc; g.fillRect(x, y, w, h); };
    R(4, 12, 22, 14, '#c8c0b4'); R(18, 12, 8, 14, '#a49c90'); for (let i = 0; i < 6; i++) R(4 + i * 4, 10, 2, 2, '#c8c0b4');
    R(1, 6, 6, 20, '#d4ccc0'); R(5, 6, 2, 20, '#a49c90'); R(23, 6, 6, 20, '#d4ccc0'); R(27, 6, 2, 20, '#a49c90');
    R(0, 4, 8, 2, '#7a7268'); R(22, 4, 8, 2, '#7a7268'); R(11, 2, 8, 10, '#d4ccc0'); R(16, 2, 3, 10, '#a49c90'); R(10, 0, 10, 2, '#7a7268');
    R(13, 18, 4, 8, '#4a3424'); R(3, 10, 2, 2, '#2a2018'); R(25, 10, 2, 2, '#2a2018'); R(14, 6, 2, 3, '#2a2018');
    return detourer(c, [60, 70, 90]);
  }
  function campement() {
    const c = mk(40, 20), g = c.getContext('2d'), R = (x, y, w, h, cc) => { g.fillStyle = cc; g.fillRect(x, y, w, h); };
    [[2, '#8a7a5a', '#6a5a40'], [22, '#7a6a4a', '#5a4a30']].forEach(([x, a, b]) => { for (let j = 0; j < 12; j++) { R(x + 8 - j * 0.7 | 0, 6 + j, Math.round(j * 0.7) + 1, 1, a); R(x + 8, 6 + j, Math.round(j * 0.7) + 1, 1, b); } R(x + 7, 13, 3, 5, '#2a1e14'); });
    R(16, 17, 6, 2, '#5a3a1c'); R(18, 15, 2, 2, '#f0a030');
    return detourer(c, [60, 70, 90]);
  }
  function chapelle() {
    const c = mk(48, 52), g = c.getContext('2d'), R = (x, y, w, h, cc) => { g.fillStyle = cc; g.fillRect(x, y, w, h); };
    R(4, 26, 32, 24, '#efe4cc'); R(26, 26, 10, 24, '#d4c8ae'); for (let i = 0; i < 4; i++) R(6 + i * 8, 30, 1, 18, '#ddd0b4');
    for (let j = 0; j < 9; j++) R(2 + j, 26 - j, 36 - j * 2, 1, j % 3 ? '#b04030' : '#c85040'); R(2, 25, 36, 1, '#7a2418');
    R(30, 8, 12, 42, '#efe4cc'); R(38, 8, 4, 42, '#d4c8ae'); for (let j = 0; j < 7; j++) R(29 + j, 8 - j, 14 - j * 2, 1, '#b04030'); R(35, -2, 1, 6, '#6a4a28'); R(33, 0, 5, 1, '#6a4a28');
    R(32, 13, 8, 7, '#3a2a1a'); R(16, 38, 7, 12, '#6a4228'); R(16, 38, 7, 2, '#8a5a34'); R(19, 38, 1, 12, '#4a2a18'); R(8, 32, 4, 7, '#5a7aa8'); R(27, 32, 3, 7, '#5a7aa8'); R(8, 32, 4, 1, '#8aaad0');
    for (let i = 0; i < 10; i++) R(0 + i * 4, 49, 3, 2, '#7a8a5a');
    return detourer(c);
  }
  function arbreD(pinus, sa) {
    const c = mk(16, 22), g = c.getContext('2d'), R = (x, y, w, h, cc) => { g.fillStyle = cc; g.fillRect(x, y, w, h); }, F = FEUIL[sa] || FEUIL['été'];
    if (pinus) { R(7, 17, 2, 5, '#5a3a1a'); for (let j = 0; j < 16; j++) { const w = Math.floor(j / 2.4) + 1; R(8 - w, 1 + j, w, 1, '#3a7a3a'); R(8, 1 + j, w, 1, '#245a2c'); if (sa === 'hiver' && j % 4 === 2) R(8 - w, 1 + j, w * 2, 1, '#eef4f8'); } }
    else if (sa === 'hiver') { R(7, 8, 2, 14, '#5a3a1a'); tracer((x, y, cc) => R(x, y, 1, 1, cc), 8, 12, 3, 5, '#5a3a1a'); tracer((x, y, cc) => R(x, y, 1, 1, cc), 8, 10, 13, 3, '#5a3a1a'); R(3, 4, 3, 1, '#ffffff'); R(11, 2, 3, 1, '#ffffff'); }
    else { R(7, 14, 2, 8, '#5a3a1a'); for (let j = -7; j <= 7; j++) { const w = Math.round(Math.sqrt(49 - j * j)); R(8 - w, 8 + j, w * 2, 1, j < -2 ? F[0] : j < 3 ? F[1] : F[2]); } R(5, 3, 3, 1, sa === 'automne' ? '#f8d070' : '#a0dc70'); }
    return detourer(c);
  }

  /* ---------- décor peint d'un combat : selon le terrain et la saison ---------- */
  const CIEL = { printemps: ['#4a8ad0', '#9ccaf0', '#eef2d8'], 'été': ['#3f7fc6', '#8cc0e8', '#f2e4c4'], automne: ['#5a78a8', '#d8a878', '#f4cc90'], hiver: ['#7a90b0', '#c4d0e0', '#eef0f4'] };
  const HERBE = { printemps: ['#8ac45a', '#6aa840', '#3e7a2a'], 'été': ['#8ab456', '#6a9a40', '#3e6a2a'], automne: ['#b0a050', '#8a7a38', '#5a4a24'], hiver: ['#e8eef2', '#c8d4dc', '#8a9aa8'] };
  const CACHE_F = new Map();
  function fondCombat(UW, UH, u, terrain, sa) {
    const cle = [UW, UH, u, terrain, sa].join('|'); if (CACHE_F.has(cle)) return CACHE_F.get(cle);
    const Wd = UW * u, Hd = UH * u, c = mk(Wd, Hd), g = c.getContext('2d'), hz = UH * 0.42, P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x * u), Math.round(y * u), Math.ceil(w * u), Math.ceil(h * u)); };
    const C = CIEL[sa] || CIEL['été'], He = HERBE[sa] || HERBE['été'], hiver = sa === 'hiver';
    let gr = g.createLinearGradient(0, 0, 0, hz * u); gr.addColorStop(0, C[0]); gr.addColorStop(0.55, C[1]); gr.addColorStop(1, C[2]); g.fillStyle = gr; g.fillRect(0, 0, Wd, hz * u + 2);
    const sx = UW * 0.8 * u, sy = hz * 0.28 * u; const rg = g.createRadialGradient(sx, sy, 0, sx, sy, Wd * 0.55); rg.addColorStop(0, 'rgba(255,252,230,1)'); rg.addColorStop(0.05, 'rgba(255,244,200,.9)'); rg.addColorStop(0.25, 'rgba(255,230,170,.3)'); rg.addColorStop(1, 'rgba(255,230,170,0)'); g.fillStyle = rg; g.fillRect(0, 0, Wd, Hd);
    g.filter = `blur(${u * 1.3}px)`;
    for (let k = 0; k < 7; k++) { const cx = hash(k + 20) * UW, cy = hz * (0.12 + hash(k + 30) * 0.4), rx = 14 + hash(k + 40) * 22, ry = 3 + hash(k + 50) * 3; g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.ellipse(cx * u, cy * u, rx * u, ry * u, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse((cx - rx * 0.3) * u, (cy - ry * 0.8) * u, rx * 0.5 * u, ry * u, 0, 0, 7); g.fill(); }
    const haut = terrain === 'montagne' ? 0.95 : terrain === 'colline' ? 0.75 : 0.66;
    crete(g, UW, hz, hz * haut, 1.3, 3, u); g.fillStyle = '#a6bcd8'; g.fill(); g.save(); g.clip(); g.fillStyle = 'rgba(250,252,255,.9)'; g.fillRect(0, 0, Wd, (hz - hz * haut * 0.62) * u); g.restore();
    crete(g, UW, hz, hz * haut * 0.64, 2.6, 3, u); g.fillStyle = hiver ? '#b4c4d8' : '#86a0c2'; g.fill(); g.filter = 'none';
    crete(g, UW, hz + 2, hz * (terrain === 'colline' ? 0.4 : 0.24), 4.2, 2, u); g.fillStyle = hiver ? '#d8e2ea' : terrain === 'foret' ? '#3e6a3a' : '#6c9658'; g.fill();
    crete(g, UW, hz + 3, hz * 0.12, 7.1, 2, u); g.fillStyle = hiver ? '#c8d4de' : '#5c8848'; g.fill();
    const loin = mk(UW, UH), gl = loin.getContext('2d'); gl.globalAlpha = 0.9;
    gl.drawImage(petitChateau(), 16, Math.round(hz - 20)); gl.drawImage(campement(), UW - 58, Math.round(hz - 14));
    g.imageSmoothingEnabled = false; g.drawImage(loin, 0, 0, Wd, Hd);
    g.fillStyle = 'rgba(200,220,240,.25)'; g.fillRect(0, (hz - 24) * u, Wd, 26 * u);
    const sol = hz + 16;
    // la bande du milieu : champs, forêt, marais, rivière…
    for (let j = 0; j < 14; j++) {
      const y = hz + 3 + j;
      for (let x = 0; x < UW; x++) {
        const band = Math.floor((x + j * (x / UW - 0.5) * 6) / 24) % 3; let col;
        if (terrain === 'plaine' || terrain === 'colline') col = hiver ? (band ? '#e4eaee' : '#d0d8de') : sa === 'printemps' ? (band === 0 ? '#9ccc5a' : '#7ab048') : band === 0 ? (j % 2 ? '#e2c45a' : '#d4b44c') : band === 1 ? (j % 2 ? '#8cb85a' : '#7aa84c') : (j % 3 ? '#c4b060' : '#b8a454');
        else if (terrain === 'marais') col = (x + j * 3) % 17 < 5 ? (hiver ? '#c8dce4' : '#5a8a8e') : He[1];
        else if (terrain === 'riviere') col = j > 5 && j < 10 ? (hiver ? '#b8d8ec' : (x + j) % 9 ? '#3f8ad4' : '#8ac4ec') : He[1];
        else col = He[j % 2 ? 1 : 2];
        P(x, y, 1, 1, col);
      }
    }
    const nb = terrain === 'foret' ? 18 : 7;
    for (let k = 0; k < nb; k++) { const x = terrain === 'foret' ? k * 12 + hash(k) * 6 : [6, 28, 52, 150, 176, 200, 96][k], p = terrain === 'foret' ? k % 3 === 0 : k % 2; g.drawImage(arbreD(p, sa), x * u, (hz - 6 + (k % 2) * 3) * u, 16 * u * 0.8, 22 * u * 0.8); }
    gr = g.createLinearGradient(0, sol * u, 0, Hd); gr.addColorStop(0, He[0]); gr.addColorStop(0.4, He[1]); gr.addColorStop(1, He[2]); g.fillStyle = gr; g.fillRect(0, sol * u, Wd, Hd - sol * u);
    P(0, sol, UW, 1, hiver ? '#a8b4c0' : '#5a7a3a');
    g.fillStyle = hiver ? '#c8c0b0' : '#a89064'; g.beginPath(); g.moveTo((UW / 2 - 3) * u, sol * u); g.lineTo((UW / 2 + 3) * u, sol * u); g.lineTo((UW / 2 + 30) * u, Hd); g.lineTo((UW / 2 - 30) * u, Hd); g.fill();
    for (let i = 0; i < 70; i++) { const t = hash(i + 70), y = sol + t * (UH - sol), w = 3 + t * 26; P(UW / 2 - w + hash(i + 71) * w * 2, y, 1, 1, hash(i + 72) < 0.5 ? '#c4ac80' : '#7a6a4a'); }
    for (let i = 0; i < 900; i++) { const x = hash(i + 100) * UW, y = sol + hash(i + 101) * (UH - sol); if (Math.abs(x - UW / 2) < 4 + (y - sol) * 0.5) continue; const t = hash(i + 102); P(x, y, 1, t < 0.2 ? 2 : 1, hiver ? (t < 0.5 ? '#ffffff' : '#b8c4d0') : t < 0.5 ? He[0] : t < 0.8 ? He[2] : He[1]); }
    if (terrain === 'montagne' || terrain === 'colline') for (let i = 0; i < 14; i++) { const x = hash(i + 400) * UW, y = sol + 4 + hash(i + 401) * (UH - sol - 8); if (Math.abs(x - UW / 2) < 10 + (y - sol) * 0.5) continue; P(x, y, 4, 3, '#8a867a'); P(x, y, 3, 1, '#c8c4b8'); P(x + 1, y + 3, 4, 1, 'rgba(0,0,0,.25)'); }
    if (!hiver) for (let i = 0; i < 60; i++) { const x = hash(i + 200) * UW, y = sol + 3 + hash(i + 201) * (UH - sol - 3); if (Math.abs(x - UW / 2) < 7 + (y - sol) * 0.5) continue; P(x, y, 1, 1, sa === 'automne' ? ['#e0a040', '#c06a28', '#f0d070'][i % 3] : ['#f4e06a', '#e86a6a', '#ffffff', '#9ab8ff', '#f0a0d0'][i % 5]); }
    CACHE_F.set(cle, c);
    return c;
  }
  function avantCombat(UW, UH, u, sa) {
    const Wd = UW * u, Hd = UH * u, c = mk(Wd, Hd), g = c.getContext('2d'), He = HERBE[sa] || HERBE['été'];
    g.filter = `blur(${u * 1.2}px)`;
    for (let i = 0; i < 50; i++) { const x = hash(i + 300) * UW, h = 7 + hash(i + 301) * 12; g.strokeStyle = sa === 'hiver' ? (i % 3 ? '#8a9aa8' : '#c8d4dc') : i % 3 ? '#2a4a1c' : He[2]; g.lineWidth = u * 1.4; g.beginPath(); g.moveTo(x * u, Hd + u); g.quadraticCurveTo((x + 2) * u, Hd - h * 0.6 * u, (x + (i % 2 ? 4 : -3)) * u, Hd - h * u); g.stroke(); }
    g.filter = 'none';
    const v = g.createRadialGradient(Wd / 2, Hd * 0.45, Hd * 0.35, Wd / 2, Hd * 0.45, Hd * 0.95); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(20,14,6,.45)'); g.fillStyle = v; g.fillRect(0, 0, Wd, Hd);
    return c;
  }

  /* ---------- illustration d'un événement (décor peint + accessoires) ---------- */
  const SCENES = {
    recolte: { soir: 0, champ: 'gris', props: ['paysans'] }, revolte: { soir: 1, props: ['foule'] }, brigands: { soir: 1, props: ['brigands', 'camp'] },
    alliance: { soir: 0, props: ['chateau', 'bannieres'] }, tournoi: { soir: 0, props: ['tribune', 'chevaliers'] }, relique: { soir: 1, props: ['chapelle', 'moines'] },
    impot: { soir: 0, props: ['chateau', 'collecteur'] }, belle: { soir: 1, champ: 'or', props: ['paysans'] }, marchand: { soir: 0, props: ['camp', 'marchand'] },
    mariage: { soir: 1, props: ['chapelle', 'bannieres'] }, hiver: { soir: 0, neige: 1, props: ['chateau'] }, pelerins: { soir: 1, props: ['chapelle', 'pelerins'] },
    mercenaires: { soir: 0, props: ['camp', 'mercenaires'] }, roi: { soir: 1, props: ['chateau', 'glas'] },
  };
  function illustration(id, sa, IW, IH, u) {
    const S2 = SCENES[id] || SCENES.relique, hiver = sa === 'hiver' || S2.neige, c = mk(IW * u, IH * u), gi = c.getContext('2d'), hz = IH * 0.5, Wd = IW * u, Hd = IH * u;
    let gr = gi.createLinearGradient(0, 0, 0, hz * u);
    if (S2.soir) { gr.addColorStop(0, '#5a86c8'); gr.addColorStop(0.6, '#e8b88a'); gr.addColorStop(1, '#f8d8a0'); } else if (hiver) { gr.addColorStop(0, '#7a90b0'); gr.addColorStop(1, '#e4eaf0'); } else { gr.addColorStop(0, '#3f7fc6'); gr.addColorStop(1, '#eef0d8'); }
    gi.fillStyle = gr; gi.fillRect(0, 0, Wd, Hd);
    const rg = gi.createRadialGradient(IW * 0.22 * u, hz * 0.75 * u, 0, IW * 0.22 * u, hz * 0.75 * u, Wd * 0.6); rg.addColorStop(0, 'rgba(255,240,200,1)'); rg.addColorStop(0.07, 'rgba(255,220,160,.8)'); rg.addColorStop(1, 'rgba(255,200,140,0)'); gi.fillStyle = rg; gi.fillRect(0, 0, Wd, Hd);
    gi.filter = `blur(${u * 1.2}px)`; crete(gi, IW, hz, hz * 0.6, 2, 3, u); gi.fillStyle = '#9a9ac0'; gi.fill(); crete(gi, IW, hz + 2, hz * 0.35, 5, 3, u); gi.fillStyle = '#7a8aa0'; gi.fill(); gi.filter = 'none';
    const He = hiver ? HERBE.hiver : HERBE[sa] || HERBE['été'];
    crete(gi, IW, hz + 4, hz * 0.2, 8, 2, u); gi.fillStyle = He[1]; gi.fill();
    gr = gi.createLinearGradient(0, (hz + 4) * u, 0, Hd); gr.addColorStop(0, He[0]); gr.addColorStop(1, He[2]); gi.fillStyle = gr; gi.fillRect(0, (hz + 4) * u, Wd, Hd);
    if (S2.champ) for (let j = 0; j < 16; j++) for (let x = 0; x < IW; x += 2) if ((x + j * 3) % 14 < 9) { gi.fillStyle = S2.champ === 'or' ? (j % 2 ? '#e8c858' : '#d4b048') : (j % 2 ? '#8a8460' : '#6e6a4c'); gi.fillRect(x * u, (hz + 8 + j) * u, 2 * u, u); }
    gi.fillStyle = hiver ? '#d8d0c0' : '#c8a870'; gi.beginPath(); gi.moveTo(0, IH * 0.78 * u); gi.quadraticCurveTo(IW * 0.5 * u, IH * 0.7 * u, IW * u, IH * 0.66 * u); gi.lineTo(IW * u, IH * 0.76 * u); gi.quadraticCurveTo(IW * 0.5 * u, IH * 0.82 * u, 0, IH * 0.92 * u); gi.fill();
    for (let i = 0; i < 500; i++) { const x = hash(i + 500) * IW, y = hz + 5 + hash(i + 501) * (IH - hz - 5), t = hash(i + 502); gi.fillStyle = hiver ? (t < 0.6 ? '#ffffff' : '#b8c4d0') : t < 0.5 ? He[0] : t < 0.8 ? He[2] : '#e0c890'; gi.fillRect(Math.round(x * u), Math.round(y * u), u, u); }
    gi.imageSmoothingEnabled = false;
    const P = S2.props;
    if (P.includes('chapelle')) gi.drawImage(chapelle(), (IW - 60) * u, (IH * 0.66 - 50) * u, 48 * u, 52 * u);
    if (P.includes('chateau')) gi.drawImage(petitChateau(), (IW - 70) * u, (IH * 0.66 - 44) * u, 60 * u, 52 * u);
    if (P.includes('camp')) gi.drawImage(campement(), (IW - 64) * u, (IH * 0.66 - 22) * u, 56 * u, 28 * u);
    if (P.includes('tribune')) { gi.fillStyle = '#7a5430'; gi.fillRect((IW - 70) * u, (IH * 0.5) * u, 56 * u, 18 * u); for (let i = 0; i < 7; i++) { gi.fillStyle = i % 2 ? '#d84a3a' : '#f0ece0'; gi.fillRect((IW - 70 + i * 8) * u, (IH * 0.5 - 6) * u, 8 * u, 6 * u); } }
    gi.drawImage(arbreD(false, hiver ? 'hiver' : sa), 8 * u, (hz - 6) * u, 16 * u, 22 * u); gi.drawImage(arbreD(true, hiver ? 'hiver' : sa), 30 * u, (hz - 2) * u, 16 * u, 22 * u);
    return c;
  }
  // personnages animés d'une illustration (dessinés par-dessus, en unités basses)
  function figurantsIllustration(g, id, t, IW, IH, seig) {
    const P = (SCENES[id] || SCENES.relique).props, col = SEIG[seig >= 0 ? seig : 0];
    const marche = (type, n, v0, dir, coul) => { for (let i = 0; i < n; i++) { const ph = ((t * 0.05 + i * 0.07) % 1), x = dir > 0 ? -10 + ph * (IW - 60) : IW - 20 - ph * (IW - 60), y = IH * (0.86 - ph * 0.14) - 26 + (Math.floor(t * 4 + i) % 2); g.drawImage(spriteD(dir > 0 ? 0 : 1, type, 'garde', v0 + i, coul ? coul.c : SEIG[0].c, coul ? coul.f : SEIG[0].f), Math.round(x), Math.round(y)); } };
    const debout = (type, xs, v0, s, coul, pose) => xs.forEach((x, i) => { const y = IH * 0.82 - 26 - (i % 2) * 4 + (Math.floor(t * 3 + i) % 2 ? 0 : -1); g.drawImage(spriteD(s, type, pose || 'garde', v0 + i, coul ? coul.c : SEIG[0].c, coul ? coul.f : SEIG[0].f), Math.round(x), Math.round(y)); });
    if (P.includes('pelerins') || P.includes('moines')) marche('pelerin', P.includes('moines') ? 2 : 4, 0, 1);
    if (P.includes('paysans')) debout('pelerin', [20, 46, 70], 1, 0);
    if (P.includes('foule')) debout('brigand', [30, 50, 70, 92, 112], 0, 0, null, Math.sin(t * 3) > 0 ? 'charge' : 'garde');
    if (P.includes('brigands')) debout('brigand', [36, 60, 84], 0, 1, null, 'garde');
    if (P.includes('mercenaires')) debout('soldat', [40, 62, 84], 1, 1, { c: '#6a6a72', f: '#3a3a42' });
    if (P.includes('chevaliers')) { debout('soldat', [30], 0, 0, col, 'charge'); debout('soldat', [92], 2, 1, { c: '#4282e0', f: '#1c3c78' }, 'charge'); }
    if (P.includes('collecteur') || P.includes('marchand')) debout('pelerin', [70], 2, 1);
    if (P.includes('bannieres')) { banniereD(g, 40, IH * 0.8, 1, col.c, col.f, col.em, col.emc, t, false); banniereD(g, 90, IH * 0.8, -1, '#9a58cc', '#4a2468', 'epee', '#f4ecd8', t + 1, false); }
    if (P.includes('glas')) { const bal = Math.round(Math.sin(t * 2) * 1.2); g.fillStyle = '#2a2a3a'; g.fillRect(IW - 41 + bal, IH * 0.66 - 40, 3, 3); }
    if (P.includes('chapelle')) { const bal = Math.round(Math.sin(t * 4) * 1.2); g.fillStyle = '#d8a830'; g.fillRect(IW - 60 + 33 + bal, IH * 0.66 - 50 + 14, 4, 4); }
    // rayons et oiseaux
    g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,214,150,${0.05 + 0.03 * Math.sin(t * 0.7 + k * 2)})`; g.beginPath(); g.moveTo(IW * 0.22, IH * 0.38); g.lineTo(IW * (0.3 + k * 0.25), IH); g.lineTo(IW * (0.42 + k * 0.25), IH); g.fill(); } g.restore();
    for (let k = 0; k < 3; k++) { const bx = ((t * 7 + k * 40) % (IW + 40)) - 20, by = 14 + k * 6 + Math.sin(t * 2 + k) * 2, a = Math.floor(t * 6 + k) % 2; g.fillStyle = '#2a2a3a'; g.fillRect(bx, by, 1, 1); g.fillRect(bx - 1, by - 1 + a, 1, 1); g.fillRect(bx + 1, by - 1 + a, 1, 1); }
  }

  window.DucDecor = {
    W, H, S, PS, SEIG, NEUTRE, mk, r, hash, centre, batiment, pixHex, versCase, carteFixe, carteAnimee, plaque, parchemin, bouton, icone, Tx, lignes, perso,
    spriteD, banniereD, fondCombat, avantCombat, illustration, figurantsIllustration,
  };
})();

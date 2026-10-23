/* Doggy Saga : dessins (vectoriels, au canvas) des chiens et des objets de la grille, d'après la maquette validée
   (maquettes/bonbons-2.html, le Refuge). Tout se dessine centré en (0, 0), pour un rayon R (≈ demi-case).
   DogDessin.piece(g, p, R, humeur, couleur) : une pièce de la grille (chien, bonus, chiot, gamelle) ;
   humeur 0 normal, 1 yeux fermés, 2 content ; couleur = celle du médaillon (une par race dans le niveau).
   DogDessin.niche(g, S, pv), .boue(g, S, n, graine), .laisse(g, R), .panier(g, S) : les cases spéciales (S = côté de la case). */
'use strict';
(function () {
  const sh = (h, a) => {
    const n = parseInt(h.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
    const f = a > 0 ? x => x + (255 - x) * a : x => x * (1 + a);
    return 'rgb(' + c.map(x => f(x) | 0).join(',') + ')';
  };
  // allure de chaque race (même ordre que DOG_RACES dans regles.js)
  const LOOKS = [
    { col: '#c98443', ear: '#6b3d1c', mus: '#fff7ee', ol: '#5a3416', or: 'tombe', marque: 'liste' }, // beagle
    { col: '#8a96a8', ear: '#8a96a8', in: '#f4b9c8', mus: '#ffffff', ol: '#475162', or: 'pointe', iris: '#3aa8ff', marque: 'husky' },
    { col: '#e98a3b', ear: '#e98a3b', in: '#fbe6c8', mus: '#fbe6c8', ol: '#9a4f17', or: 'pointe', marque: 'shiba' },
    { col: '#fbfaf6', ear: '#2a2a2e', mus: '#fbfaf6', ol: '#6a6a74', or: 'tombe', marque: 'taches' }, // dalmatien
    { col: '#eaa66c', ear: '#d98d52', mus: '#f7cfa6', ol: '#9b5a2a', or: 'frise', touffe: 1, houppe: 1 }, // caniche
    { col: '#2c2c36', ear: '#2c2c36', in: '#6b6b78', mus: '#ffffff', ol: '#101014', or: 'mi', marque: 'liste' }, // border collie
    { col: '#b5562a', ear: '#7d3415', mus: '#c96a3a', ol: '#5a250e', or: 'longue', museau: 1.2 }, // teckel
    { col: '#e7c9a0', ear: '#2d2420', mus: '#2d2420', ol: '#7a5a3a', or: 'rose', marque: 'rides', yeux: 1.2 }, // carlin
    { col: '#d8c1a6', ear: '#d8c1a6', in: '#f2b8c0', mus: '#efe2d2', ol: '#6e5a46', or: 'chauve', yeux: 1.1 }, // bouledogue
    { col: '#e8b97a', ear: '#e8b97a', in: '#f7c9c9', mus: '#f6dfb8', ol: '#94642c', or: 'grande', yeux: 1.35 }, // chihuahua
    { col: '#a9abb8', ear: '#8f91a0', mus: '#c4c6d1', ol: '#5c5e6c', or: 'rose', fin: 1, museau: 1.25 }, // lévrier
    { col: '#6b3f26', ear: '#55301c', mus: '#7d4c30', ol: '#2f1a0d', or: 'tombe' }, // labrador chocolat
    { col: '#1f1d24', ear: '#1f1d24', mus: '#ffffff', ol: '#0d0c10', or: 'tombe', marque: 'bernois' }, // bouvier bernois
    { col: '#e5893f', ear: '#e5893f', in: '#f6c9a6', mus: '#ffffff', ol: '#9a4f17', or: 'grande', marque: 'liste' }, // corgi
    { col: '#fbfbf7', ear: '#fbfbf7', in: '#f4c7cf', mus: '#ffffff', ol: '#9aa0ad', or: 'pointe', touffe: 1 }, // samoyède
    { col: '#d9a24f', ear: '#c48a3a', mus: '#e9bd73', ol: '#7a5420', or: 'boucle' }, // cocker
  ];
  const CHIOT = { col: '#f3d29b', ear: '#d9a75e', mus: '#fff3dc', ol: '#9a6a2a', or: 'tombe', yeux: 1.45 };
  // une couleur de médaillon par race du niveau (6 couleurs bien distinctes, celles de la maquette)
  const MEDAILLONS = ['#ffd59e', '#bfe3ff', '#ffb3a7', '#cfe8b4', '#e3c6ff', '#fff1a8'];

  function oreillesDerriere(g, d, r) {
    g.lineWidth = r * 0.08; g.strokeStyle = d.ol;
    if (d.or === 'pointe' || d.or === 'mi' || d.or === 'grande' || d.or === 'chauve') {
      const big = d.or === 'grande', bat = d.or === 'chauve';
      for (const s of [-1, 1]) {
        g.beginPath();
        if (bat) {
          g.moveTo(s * r * 0.15, -r * 0.7);
          g.quadraticCurveTo(s * r * 0.55, -r * 1.55, s * r * 1.0, -r * 0.95);
          g.quadraticCurveTo(s * r * 1.08, -r * 0.55, s * r * 0.9, -r * 0.3);
        } else {
          g.moveTo(s * r * 0.2, -r * 0.72);
          g.lineTo(s * r * (big ? 1.05 : 0.8), -r * (big ? 1.38 : 1.28));
          g.lineTo(s * r * (big ? 1.05 : 0.98), -r * 0.3);
        }
        g.closePath(); g.fillStyle = d.ear; g.fill(); g.stroke();
        g.beginPath();
        if (bat) { g.moveTo(s * r * 0.35, -r * 0.7); g.quadraticCurveTo(s * r * 0.6, -r * 1.3, s * r * 0.88, -r * 0.9); g.lineTo(s * r * 0.78, -r * 0.45); }
        else { g.moveTo(s * r * 0.38, -r * 0.66); g.lineTo(s * r * (big ? 0.95 : 0.76), -r * (big ? 1.18 : 1.05)); g.lineTo(s * r * (big ? 0.92 : 0.84), -r * 0.45); }
        g.closePath(); g.fillStyle = d.in || sh(d.ear, 0.3); g.fill();
      }
    }
  }
  function oreillesDevant(g, d, r, chien) {
    g.lineWidth = r * 0.08; g.strokeStyle = d.ol;
    if (d.or === 'tombe' || d.or === 'longue' || d.or === 'boucle') {
      const long = d.or === 'tombe' ? 1 : 1.3;
      for (const s of [-1, 1]) {
        g.save(); g.translate(s * r * 0.8, -r * 0.4); g.rotate(s * (d.or === 'tombe' ? 0.28 : 0.15));
        g.beginPath(); g.ellipse(0, r * 0.42 * long, r * 0.27, r * 0.58 * long, 0, 0, 7);
        g.fillStyle = chien === 3 && s > 0 ? '#fbfaf6' : d.ear; g.fill(); g.stroke();
        if (chien === 3 && s > 0) { g.fillStyle = '#26262b'; g.beginPath(); g.arc(0, r * 0.3, r * 0.08, 0, 7); g.arc(r * 0.05, r * 0.62, r * 0.06, 0, 7); g.fill(); }
        if (d.or === 'boucle') {
          g.strokeStyle = sh(d.ear, -0.25); g.lineWidth = r * 0.05;
          for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(0, r * (0.15 + k * 0.28), r * 0.16, 0.2, Math.PI - 0.2); g.stroke(); }
        }
        g.restore();
      }
    } else if (d.or === 'mi') {
      for (const s of [-1, 1]) {
        g.beginPath(); g.moveTo(s * r * 0.6, -r * 0.98); g.lineTo(s * r * 0.66, -r * 0.66); g.lineTo(s * r * 0.95, -r * 0.78); g.closePath();
        g.fillStyle = d.ear; g.fill(); g.lineWidth = r * 0.06; g.stroke();
      }
    } else if (d.or === 'rose') {
      for (const s of [-1, 1]) {
        g.save(); g.translate(s * r * 0.72, -r * 0.62); g.rotate(s * 0.6);
        g.beginPath(); g.moveTo(-r * 0.2, -r * 0.05); g.quadraticCurveTo(0, -r * 0.35, r * 0.24, -r * 0.02); g.quadraticCurveTo(r * 0.05, r * 0.12, -r * 0.2, -r * 0.05);
        g.fillStyle = d.ear; g.fill(); g.lineWidth = r * 0.06; g.stroke(); g.restore();
      }
    } else if (d.or === 'frise') {
      for (const s of [-1, 1]) for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(s * r * 0.98, -r * 0.12 + j * r * 0.3, r * 0.27, 0, 7); g.fillStyle = d.ear; g.fill(); }
    }
  }
  function tete(g, d, r) {
    const rx = d.fin ? r * 0.84 : r, ry = r * 0.9;
    if (d.touffe) {
      g.fillStyle = d.col;
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * r * 0.76, Math.sin(a) * r * 0.68, r * 0.3, 0, 7); g.fill(); }
      if (d.houppe) for (const [x, y, s] of [[-0.28, -0.92, 0.28], [0.28, -0.92, 0.28], [0, -1.1, 0.32]]) { g.beginPath(); g.arc(x * r, y * r, s * r, 0, 7); g.fill(); }
      g.strokeStyle = sh(d.col, -0.18); g.lineWidth = r * 0.05;
      for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(-r * 0.44 + i * r * 0.22, -r * (0.88 + (i % 2) * 0.12), r * 0.1, Math.PI, 0); g.stroke(); }
    } else {
      g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.fillStyle = d.col; g.fill(); g.lineWidth = r * 0.08; g.strokeStyle = d.ol; g.stroke();
    }
    g.save(); g.beginPath(); g.ellipse(0, 0, rx * 0.96, ry * 0.95, 0, 0, 7); g.clip();
    const m = d.marque;
    if (m === 'liste') { g.beginPath(); g.moveTo(-r * 0.08, -r * 0.95); g.lineTo(r * 0.08, -r * 0.95); g.lineTo(r * 0.3, r * 0.25); g.lineTo(-r * 0.3, r * 0.25); g.closePath(); g.fillStyle = '#fff7ee'; g.fill(); }
    if (m === 'husky') {
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(0, r * 0.42, r * 0.86, r * 0.6, 0, 0, 7); g.fill();
      g.beginPath(); g.moveTo(-r * 0.08, -r * 0.95); g.lineTo(r * 0.08, -r * 0.95); g.lineTo(r * 0.2, 0); g.lineTo(-r * 0.2, 0); g.fill();
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 0.34, -r * 0.32, r * 0.12, r * 0.07, 0, 0, 7); g.fill(); }
    }
    if (m === 'shiba') { g.fillStyle = d.mus; g.beginPath(); g.ellipse(0, r * 0.4, r * 0.8, r * 0.55, 0, 0, 7); g.fill(); for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 0.32, -r * 0.32, r * 0.1, r * 0.06, 0, 0, 7); g.fill(); } }
    if (m === 'taches') { g.fillStyle = '#26262b'; for (const [x, y, s] of [[-0.55, -0.42, 0.15], [0.45, -0.55, 0.1], [0.62, 0.08, 0.12], [-0.62, 0.22, 0.09], [0.12, -0.72, 0.08], [-0.2, -0.55, 0.06]]) { g.beginPath(); g.arc(x * r, y * r, s * r, 0, 7); g.fill(); } }
    if (m === 'bernois') {
      g.fillStyle = '#c0622b';
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 0.36, -r * 0.3, r * 0.11, r * 0.07, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(s * r * 0.5, r * 0.32, r * 0.24, r * 0.2, 0, 0, 7); g.fill(); }
      g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(-r * 0.06, -r * 0.95); g.lineTo(r * 0.06, -r * 0.95); g.lineTo(r * 0.24, r * 0.2); g.lineTo(-r * 0.24, r * 0.2); g.closePath(); g.fill();
    }
    if (m === 'rides') { g.strokeStyle = sh(d.col, -0.35); g.lineWidth = r * 0.05; for (let k = 0; k < 2; k++) { g.beginPath(); g.arc(0, -r * (0.2 + k * 0.16), r * 0.32, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); } }
    g.restore();
  }
  function visage(g, d, r, humeur) {
    const ml = d.museau || 1;
    g.beginPath(); g.ellipse(0, r * 0.42 * (ml > 1 ? 1.04 : 1), r * (d.fin ? 0.38 : 0.46), r * 0.34 * ml, 0, 0, 7); g.fillStyle = d.mus; g.fill();
    if (d.mus === '#ffffff' || d.mus === '#fbfaf6') { g.lineWidth = r * 0.04; g.strokeStyle = 'rgba(0,0,0,.12)'; g.stroke(); }
    const ny = r * 0.24 * (ml > 1 ? 1.15 : 1);
    g.beginPath(); g.ellipse(0, ny, r * 0.17, r * 0.12, 0, 0, 7); g.fillStyle = '#231815'; g.fill();
    g.beginPath(); g.ellipse(-r * 0.05, ny - r * 0.04, r * 0.05, r * 0.03, 0, 0, 7); g.fillStyle = 'rgba(255,255,255,.7)'; g.fill();
    const ink = d.mus === '#2d2420' ? '#000' : '#231815', bouche = ny + r * 0.12;
    if (humeur === 2) {
      g.beginPath(); g.ellipse(0, bouche + r * 0.28, r * 0.12, r * 0.17, 0, 0, 7); g.fillStyle = '#ff7a9a'; g.fill();
      g.strokeStyle = '#d94a6e'; g.lineWidth = r * 0.03; g.beginPath(); g.moveTo(0, bouche + r * 0.19); g.lineTo(0, bouche + r * 0.34); g.stroke();
    }
    g.strokeStyle = d.mus === '#2d2420' ? '#6b5a48' : ink; g.lineWidth = r * 0.06; g.lineCap = 'round';
    g.beginPath(); g.moveTo(0, bouche); g.lineTo(0, bouche + r * 0.1);
    g.moveTo(-r * 0.2, bouche + r * 0.12); g.quadraticCurveTo(-r * 0.1, bouche + r * 0.24, 0, bouche + r * 0.1); g.quadraticCurveTo(r * 0.1, bouche + r * 0.24, r * 0.2, bouche + r * 0.12); g.stroke();
    const ye = d.yeux || 1;
    for (const s of [-1, 1]) {
      const ex = s * r * 0.36, ey = -r * 0.08;
      g.strokeStyle = d.col === '#1f1d24' || d.col === '#2c2c36' ? '#000' : '#231815'; g.lineWidth = r * 0.07;
      if (humeur === 0) {
        g.beginPath(); g.arc(ex, ey, r * 0.13 * ye, 0, 7); g.fillStyle = d.iris || '#231815'; g.fill();
        if (d.iris) { g.beginPath(); g.arc(ex, ey, r * 0.06, 0, 7); g.fillStyle = '#10131a'; g.fill(); }
        if (d.col === '#1f1d24' || d.col === '#2c2c36') { g.lineWidth = r * 0.03; g.strokeStyle = 'rgba(255,255,255,.35)'; g.stroke(); }
        g.beginPath(); g.arc(ex - r * 0.04 * ye, ey - r * 0.05 * ye, r * 0.045 * ye, 0, 7); g.fillStyle = '#fff'; g.fill();
      } else if (humeur === 1) { if (d.col === '#1f1d24' || d.col === '#2c2c36') g.strokeStyle = '#8a8a96'; g.beginPath(); g.arc(ex, ey - r * 0.03, r * 0.11, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke(); }
      else { if (d.col === '#1f1d24' || d.col === '#2c2c36') g.strokeStyle = '#8a8a96'; g.beginPath(); g.arc(ex, ey + r * 0.07, r * 0.12, 1.15 * Math.PI, 1.85 * Math.PI); g.stroke(); }
    }
    g.fillStyle = 'rgba(255,110,140,.35)';
    for (const s of [-1, 1]) { g.beginPath(); g.arc(s * r * 0.58, r * 0.26, r * 0.1, 0, 7); g.fill(); }
  }
  function portrait(g, d, R, humeur, chien) {
    const r = R * 0.6;
    g.save(); g.translate(0, R * 0.12); g.lineJoin = 'round'; g.lineCap = 'round';
    oreillesDerriere(g, d, r);
    tete(g, d, r);
    oreillesDevant(g, d, r, chien);
    visage(g, d, r, humeur);
    g.restore();
  }
  function medaillon(g, R, col, or) {
    if (or) { g.beginPath(); g.arc(0, 0, R * 0.98, 0, 7); g.fillStyle = '#ffc531'; g.fill(); }
    g.beginPath(); g.arc(0, 0, or ? R * 0.86 : R * 0.97, 0, 7); g.fillStyle = col; g.fill(); g.lineWidth = R * 0.07; g.strokeStyle = '#ffffff'; g.stroke();
  }
  function bandana(g, R, sp) {
    g.beginPath(); g.moveTo(-R * 0.42, R * 0.62); g.lineTo(R * 0.42, R * 0.62); g.lineTo(0, R * 0.98); g.closePath();
    g.fillStyle = '#e8413a'; g.fill(); g.lineWidth = R * 0.04; g.strokeStyle = '#9a1f1a'; g.stroke();
    g.fillStyle = '#fff'; for (const [x, y] of [[-0.2, 0.7], [0.2, 0.7], [0, 0.82]]) { g.beginPath(); g.arc(x * R, y * R, R * 0.04, 0, 7); g.fill(); }
    g.save(); g.translate(R * 0.66, -R * 0.66);
    g.beginPath(); g.arc(0, 0, R * 0.3, 0, 7); g.fillStyle = '#3a8dde'; g.fill(); g.lineWidth = R * 0.06; g.strokeStyle = '#fff'; g.stroke();
    if (sp === 2) g.rotate(Math.PI / 2);
    g.lineWidth = R * 0.07; g.beginPath(); g.moveTo(-R * 0.17, 0); g.lineTo(R * 0.17, 0);
    for (const s of [-1, 1]) { g.moveTo(s * R * 0.17, 0); g.lineTo(s * R * 0.08, -R * 0.08); g.moveTo(s * R * 0.17, 0); g.lineTo(s * R * 0.08, R * 0.08); }
    g.stroke(); g.restore();
  }
  function noeud(g, R) {
    g.save(); g.translate(0, -R * 0.82); g.lineWidth = R * 0.04; g.strokeStyle = '#b8236a';
    for (const s of [-1, 1]) { g.save(); g.rotate(s * 0.5); g.beginPath(); g.ellipse(s * R * 0.22, 0, R * 0.24, R * 0.13, 0, 0, 7); g.fillStyle = '#ff5fa2'; g.fill(); g.stroke(); g.restore(); }
    g.beginPath(); g.arc(0, 0, R * 0.09, 0, 7); g.fillStyle = '#ff8cc0'; g.fill(); g.stroke(); g.restore();
  }
  function balle(g, R) {
    for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(0, 0, R * 0.92, i * Math.PI / 3, (i + 1) * Math.PI / 3); g.lineWidth = R * 0.12; g.strokeStyle = sh(MEDAILLONS[i], -0.15); g.stroke(); }
    g.beginPath(); g.arc(0, 0, R * 0.84, 0, 7); g.fillStyle = 'rgba(255,255,255,.92)'; g.fill();
    const gr = g.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.05, 0, 0, R * 0.62); gr.addColorStop(0, '#f2ff8a'); gr.addColorStop(1, '#a9c41d');
    g.beginPath(); g.arc(0, 0, R * 0.6, 0, 7); g.fillStyle = gr; g.fill(); g.lineWidth = R * 0.05; g.strokeStyle = '#7d9214'; g.stroke();
    g.save(); g.beginPath(); g.arc(0, 0, R * 0.6, 0, 7); g.clip(); g.strokeStyle = '#fff'; g.lineWidth = R * 0.08;
    g.beginPath(); g.arc(-R * 0.78, 0, R * 0.5, -1, 1); g.stroke(); g.beginPath(); g.arc(R * 0.78, 0, R * 0.5, Math.PI - 1, Math.PI + 1); g.stroke(); g.restore();
  }
  function chiot(g, R, humeur) {
    g.beginPath(); g.arc(0, 0, R * 0.97, 0, 7); g.fillStyle = '#ffe3ef'; g.fill();
    g.setLineDash([R * 0.16, R * 0.1]); g.lineWidth = R * 0.07; g.strokeStyle = '#ff9cc2'; g.stroke(); g.setLineDash([]);
    g.save(); g.scale(0.92, 0.92); portrait(g, CHIOT, R, humeur, -1); g.restore();
    // ruban bleu et petite flèche vers le bas : « il faut l'amener en bas »
    g.save(); g.translate(0, -R * 0.72); g.fillStyle = '#5aa9ff'; g.strokeStyle = '#2a6fc0'; g.lineWidth = R * 0.03;
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * R * 0.14, 0, R * 0.14, R * 0.08, s * 0.4, 0, 7); g.fill(); g.stroke(); }
    g.restore();
    g.save(); g.translate(R * 0.66, R * 0.62); g.beginPath(); g.arc(0, 0, R * 0.26, 0, 7); g.fillStyle = '#3ec46d'; g.fill(); g.lineWidth = R * 0.05; g.strokeStyle = '#fff'; g.stroke();
    g.beginPath(); g.moveTo(0, -R * 0.13); g.lineTo(0, R * 0.12); g.moveTo(-R * 0.1, R * 0.03); g.lineTo(0, R * 0.13); g.lineTo(R * 0.1, R * 0.03); g.lineWidth = R * 0.07; g.stroke(); g.restore();
  }
  function gamelle(g, R) {
    g.lineJoin = 'round';
    g.beginPath(); g.ellipse(0, R * 0.55, R * 0.8, R * 0.14, 0, 0, 7); g.fillStyle = 'rgba(80,40,20,.25)'; g.fill();
    g.beginPath(); g.moveTo(-R * 0.78, -R * 0.08); g.lineTo(R * 0.78, -R * 0.08); g.lineTo(R * 0.58, R * 0.52); g.quadraticCurveTo(0, R * 0.66, -R * 0.58, R * 0.52); g.closePath();
    const gr = g.createLinearGradient(-R, 0, R, 0); gr.addColorStop(0, '#ff6a5a'); gr.addColorStop(0.5, '#e8413a'); gr.addColorStop(1, '#b52a22');
    g.fillStyle = gr; g.fill(); g.lineWidth = R * 0.06; g.strokeStyle = '#7a1a14'; g.stroke();
    g.beginPath(); g.ellipse(0, -R * 0.08, R * 0.8, R * 0.22, 0, 0, 7); g.fillStyle = '#ff8f80'; g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, -R * 0.08, R * 0.62, R * 0.14, 0, 0, 7); g.fillStyle = '#8a4a22'; g.fill();
    g.fillStyle = '#b8743a'; for (const [x, y] of [[-0.35, -0.1], [-0.1, -0.14], [0.15, -0.08], [0.38, -0.12], [0.05, -0.02], [-0.25, -0.02]]) { g.beginPath(); g.arc(x * R, y * R, R * 0.07, 0, 7); g.fill(); }
    g.fillStyle = '#ffffff'; g.save(); g.translate(0, R * 0.25); g.scale(R / 26, R / 26);
    g.beginPath(); g.ellipse(0, 3, 5, 4, 0, 0, 7); g.fill(); for (const [a, b] of [[-6, -3], [-2, -7], [2, -7], [6, -3]]) { g.beginPath(); g.ellipse(a, b, 2, 2.6, 0, 0, 7); g.fill(); }
    g.restore();
  }
  // une pièce de la grille
  function piece(g, p, R, humeur, couleur) {
    if (p.gm) return gamelle(g, R);
    if (p.ch) return chiot(g, R, humeur);
    if (p.sp === 4) return balle(g, R);
    medaillon(g, R, couleur || MEDAILLONS[p.t % 6], p.sp === 3);
    portrait(g, LOOKS[p.t], R, humeur, p.t);
    if (p.sp === 1 || p.sp === 2) bandana(g, R, p.sp);
    if (p.sp === 3) noeud(g, R);
  }
  // niche (case bloquée) ; pv = coups qu'il reste pour la casser (petits os sur le toit)
  function niche(g, S, pv) {
    const w = S * 0.84, h = S * 0.5, x = -w / 2, y = -S * 0.12;
    g.lineJoin = 'round'; g.lineWidth = S * 0.035; g.strokeStyle = '#5a3416';
    g.fillStyle = '#c98a4a'; g.beginPath(); g.rect(x, y, w, h + S * 0.28); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(90,52,22,.35)'; g.lineWidth = S * 0.02;
    for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x, y + k * S * 0.18); g.lineTo(x + w, y + k * S * 0.18); g.stroke(); }
    g.fillStyle = '#3a2214'; g.beginPath(); g.moveTo(-S * 0.16, y + h + S * 0.28); g.lineTo(-S * 0.16, y + S * 0.2); g.arc(0, y + S * 0.2, S * 0.16, Math.PI, 0); g.lineTo(S * 0.16, y + h + S * 0.28); g.fill();
    g.fillStyle = '#d94b3a'; g.strokeStyle = '#7a1f14'; g.lineWidth = S * 0.035;
    g.beginPath(); g.moveTo(-S * 0.5, y + S * 0.02); g.lineTo(0, -S * 0.46); g.lineTo(S * 0.5, y + S * 0.02); g.closePath(); g.fill(); g.stroke();
    for (let k = 0; k < pv; k++) {
      g.save(); g.translate((k - (pv - 1) / 2) * S * 0.2, -S * 0.22); g.fillStyle = '#fff6ea'; g.strokeStyle = '#a0623a'; g.lineWidth = S * 0.015;
      g.fillRect(-S * 0.06, -S * 0.02, S * 0.12, S * 0.04);
      for (const s of [-1, 1]) for (const t of [-1, 1]) { g.beginPath(); g.arc(s * S * 0.06, t * S * 0.022, S * 0.028, 0, 7); g.fill(); }
      g.restore();
    }
    if (pv === 1) { g.strokeStyle = '#3a2214'; g.lineWidth = S * 0.025; g.beginPath(); g.moveTo(S * 0.2, y); g.lineTo(S * 0.28, y + S * 0.12); g.lineTo(S * 0.22, y + S * 0.22); g.lineTo(S * 0.32, y + S * 0.32); g.stroke(); }
  }
  // boue sous un chien (n couches) : une flaque qui remplit la case jusqu'aux coins, plus foncée à 2 couches
  function boue(g, S, n, graine) {
    const h = S * 0.5, pts = 20;
    for (let c = 0; c < n; c++) {
      const k0 = c ? 0.8 : 1;
      g.beginPath();
      for (let i = 0; i <= pts; i++) {
        const a = i / pts * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
        const carre = h / Math.max(Math.abs(cs), Math.abs(sn)) * 0.97; // le bord d'un carré
        const bosse = 1 - 0.1 * Math.abs(Math.sin(graine * 12.9 + i * 78.2 + c * 3.1));
        const r = Math.min(carre, h * 1.25) * bosse * k0;
        i ? g.lineTo(cs * r, sn * r) : g.moveTo(cs * r, sn * r);
      }
      g.closePath(); g.fillStyle = c ? '#5e3a1c' : '#9a6332'; g.fill();
    }
    g.fillStyle = 'rgba(70,40,15,.35)';
    for (let k = 0; k < 4; k++) { const a = graine * 1.7 + k * 1.6, d = h * 0.82; g.beginPath(); g.arc(Math.cos(a) * d, Math.sin(a) * d, S * 0.06, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(-S * 0.28, -S * 0.34, S * 0.1, S * 0.035, -0.3, 0, 7); g.fill();
  }
  // taches de boue posées sur le chien lui-même (un chien sale !)
  function salissures(g, R, n, graine) {
    g.fillStyle = n > 1 ? 'rgba(94,58,28,.85)' : 'rgba(139,90,43,.75)';
    for (let k = 0; k < 2 + n; k++) {
      const a = graine * 2.3 + k * 2.1, d = R * (0.35 + 0.3 * Math.abs(Math.sin(graine + k)));
      g.beginPath(); g.ellipse(Math.cos(a) * d, Math.sin(a) * d + R * 0.1, R * 0.12, R * 0.09, a, 0, 7); g.fill();
    }
  }
  // laisse : collier rouge et laisse attachée à un piquet dans le coin de la case
  function laisse(g, R) {
    g.lineCap = 'round';
    g.strokeStyle = '#7a4a22'; g.lineWidth = R * 0.14; g.beginPath(); g.moveTo(R * 0.85, -R * 0.95); g.lineTo(R * 0.85, -R * 0.55); g.stroke();
    g.fillStyle = '#a86d38'; g.beginPath(); g.arc(R * 0.85, -R * 0.95, R * 0.1, 0, 7); g.fill();
    g.strokeStyle = '#e8413a'; g.lineWidth = R * 0.09; g.beginPath(); g.moveTo(R * 0.85, -R * 0.7); g.quadraticCurveTo(R * 0.75, R * 0.1, R * 0.15, R * 0.6); g.stroke();
    g.strokeStyle = '#c42a22'; g.lineWidth = R * 0.12; g.beginPath(); g.arc(0, R * 0.12, R * 0.52, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
    g.fillStyle = '#ffc531'; g.beginPath(); g.arc(0, R * 0.66, R * 0.09, 0, 7); g.fill();
  }
  // panier où arrivent les chiots (sous la case de sortie)
  function panier(g, S) {
    g.lineJoin = 'round';
    g.beginPath(); g.moveTo(-S * 0.42, 0); g.lineTo(S * 0.42, 0); g.lineTo(S * 0.34, S * 0.3); g.lineTo(-S * 0.34, S * 0.3); g.closePath();
    g.fillStyle = '#d9a35f'; g.fill(); g.lineWidth = S * 0.04; g.strokeStyle = '#8a5a2a'; g.stroke();
    g.strokeStyle = 'rgba(138,90,42,.6)'; g.lineWidth = S * 0.025;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * S * 0.15, 0); g.lineTo(k * S * 0.12, S * 0.3); g.stroke(); }
    g.beginPath(); g.ellipse(0, 0, S * 0.42, S * 0.08, 0, 0, 7); g.fillStyle = '#ff9cc2'; g.fill();
  }
  // portrait seul (album, objectifs) : médaillon à la couleur de la race
  // couleur : celle du médaillon dans la grille du niveau (sinon la couleur propre au chien, pour l'album)
  function carte(g, t, R, humeur, gris, couleur) {
    medaillon(g, R, gris ? '#e9dfd6' : couleur || MEDAILLONS[t % 6], false);
    if (gris) {
      g.save(); g.globalAlpha = 0.28; portrait(g, LOOKS[t], R, 1, t); g.restore();
      g.fillStyle = '#b39a86'; g.font = '800 ' + Math.round(R * 0.9) + 'px "Baloo 2", system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, R * 0.08);
      return;
    }
    portrait(g, LOOKS[t], R, humeur, t);
  }
  window.DogDessin = { piece, niche, boue, salissures, laisse, panier, carte, chiot, gamelle, balle, MEDAILLONS, LOOKS };
})();

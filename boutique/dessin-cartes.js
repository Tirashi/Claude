/* =====================================================================
   LA BOUTIQUE DE CARTES · le DESSIN des cartes (mise en page 1 de la
   maquette 2, « cadre coloré ») : le fond dit l'élément, le cadre de
   l'image et le bandeau du nom disent la rareté. Carte de 100 × 128
   pixels agrandie × 3, sans lissage ; textes en Pixelify Sans.
   Images : BOU_IMAGES (images.js) : monstres de Dungeon Crawl, planche
   « Pixel Card Assets » (cafedraw, CC0).
   ===================================================================== */
'use strict';
const BouCartes = (() => {
  const K = 3, img = {};
  let pret = null;
  const STYLE = {
    FEU: { f: '#8a2a12', ciel: ['#ffcf7a', '#e8603a'], fond: [133, 4] },
    EAU: { f: '#123f7a', ciel: ['#bfe8ff', '#3f86d8'], fond: [14, 4] },
    PLANTE: { f: '#1d5a26', ciel: ['#e2f5b0', '#5daf55'], fond: [366, 4] },
    FOUDRE: { f: '#6b4f00', ciel: ['#fff6c0', '#e8b820'], fond: [481, 4] },
    OMBRE: { f: '#2a1a5a', ciel: ['#b9a6f0', '#3b2a78'], fond: [610, 4] },
  };
  // morceaux de la planche : [x, y, largeur, hauteur], par rareté (commune … légendaire)
  const P = {
    cadre: [[22, 136, 86, 72], [22, 136, 86, 72], [140, 136, 86, 72], [257, 136, 86, 72], [257, 136, 86, 72]],
    banniere: [[16, 223, 96, 29], [135, 224, 96, 29], [135, 224, 96, 29], [252, 223, 96, 29], [361, 262, 96, 29]],
    rondAtk: [399, 218, 20, 20], rondPv: [424, 218, 20, 20], etoile: [402, 240, 18, 17], dos: [776, 4, 100, 128],
  };
  function charger() {
    return pret || (pret = Promise.all(['monstres', 'cartes', 'dos'].map(n => new Promise(ok => {
      const i = new Image(); i.onload = () => { img[n] = i; ok(); }; i.onerror = () => ok(); i.src = BOU_IMAGES[n];
    }))));
  }
  const toile = () => { const cv = document.createElement('canvas'); cv.width = 100 * K; cv.height = 128 * K; return cv; };
  function morceau(ctx, src, r, x, y, k) { if (src) ctx.drawImage(src, r[0], r[1], r[2], r[3], x, y, r[2] * k, r[3] * k); }
  function monstre(ctx, i, x, y, k) { if (img.monstres) ctx.drawImage(img.monstres, (i % 16) * 32, Math.floor(i / 16) * 32, 32, 32, x, y, 32 * k, 32 * k); }
  // un petit paysage de l'élément derrière le monstre (en pixels de base)
  function habitat(ctx, c, x, y, w, h) {
    const S = STYLE[c.el], R = bouRng('habitat', c.id);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, S.ciel[0]); g.addColorStop(1, S.ciel[1]);
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    if (c.rar === 4) { ctx.save(); ctx.translate(x + w / 2, y + h * 0.55); ctx.fillStyle = '#fff6'; for (let a = 0; a < 12; a++) { ctx.rotate(Math.PI / 6); ctx.fillRect(0, -2, w, 4); } ctx.restore(); }
    ctx.fillStyle = '#ffffff55';
    const motif = {
      FEU: () => ctx.fillRect(x + R() * w, y + h * 0.4 + R() * h * 0.6, 2, 2),
      EAU: () => { const a = x + R() * w, b = y + R() * h; ctx.fillRect(a, b, 3, 1); ctx.fillRect(a, b + 2, 3, 1); ctx.fillRect(a - 1, b + 1, 1, 1); ctx.fillRect(a + 3, b + 1, 1, 1); },
      PLANTE: () => ctx.fillRect(x + R() * w, y + h * 0.7 + R() * h * 0.3, 1, 3),
      FOUDRE: () => { const a = x + R() * w, b = y + R() * h * 0.6; ctx.fillRect(a, b, 2, 1); ctx.fillRect(a + 1, b + 1, 2, 1); ctx.fillRect(a, b + 2, 2, 1); },
      OMBRE: () => ctx.fillRect(x + R() * w, y + R() * h * 0.7, 1, 1),
    }[c.el];
    for (let k = 0; k < 18; k++) motif();
    ctx.fillStyle = S.f + '88'; ctx.fillRect(x, y + h - Math.round(h * 0.18), w, Math.round(h * 0.18));
  }
  function texte(ctx, t, x, y, taille, coul = '#fff', contour = '#2d2a3e') {
    ctx.font = '700 ' + taille + 'px "Pixelify Sans", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, taille / 4); ctx.strokeStyle = contour; ctx.lineJoin = 'round'; ctx.strokeText(t, x, y); ctx.fillStyle = coul; ctx.fillText(t, x, y);
  }
  // la carte entière (300 × 384) ; c = bouCarte(e, id)
  function dessiner(c, cv) {
    cv = cv || toile(); cv.width = 100 * K; cv.height = 128 * K;
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const s = (r, x, y, k = 1) => morceau(ctx, img.cartes, r, x * K, y * K, K * k);
    s([...STYLE[c.el].fond, 100, 128], 0, 0);
    ctx.save(); ctx.scale(K, K); habitat(ctx, c, 12, 12, 76, 62); ctx.restore();
    monstre(ctx, c.monstre, 18 * K, 11 * K, 2 * K);
    s(P.cadre[c.rar], 7, 7);
    s(P.banniere[c.rar], 2, 80);
    let t = 13 * K; ctx.font = '700 ' + t + 'px "Pixelify Sans"';
    while (ctx.measureText(c.nom).width > 80 * K) { t -= 3; ctx.font = '700 ' + t + 'px "Pixelify Sans"'; }
    texte(ctx, c.nom, 50 * K, 94 * K, t);
    s(P.rondAtk, 5, 104); s(P.rondPv, 75, 104);
    texte(ctx, String(c.atk), 15 * K, 114 * K, 12 * K); texte(ctx, String(c.pv), 85 * K, 114 * K, 12 * K);
    const n = c.rar + 1, l = 9; for (let k = 0; k < n; k++) s(P.etoile, 50 - n * l / 2 + k * l, 110, 0.5);
    ctx.font = '700 ' + 6 * K + 'px "Pixelify Sans"'; ctx.fillStyle = '#ffffffcc'; ctx.textAlign = 'right'; ctx.fillText(c.num + '/40', 96 * K, 4.5 * K);
    return cv;
  }
  function dos(cv) {
    cv = cv || toile(); const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    morceau(ctx, img.dos, P.dos, 0, 0, K); return cv;
  }
  // une image de monstre seule (32 × 32 agrandie k fois), pour les boosters et les listes
  function bete(i, k = 2, cv) {
    cv = cv || document.createElement('canvas'); cv.width = cv.height = 32 * k;
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false; monstre(ctx, i, 0, 0, k); return cv;
  }
  return { charger, dessiner, dos, bete, STYLE };
})();

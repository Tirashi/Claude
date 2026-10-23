/* =====================================================================
   BANNIÈRES · l'INTERFACE en pixel art, dessinée par la page (aucune
   image) : parchemin, bandeau, boutons de bois (ou rouges), bannière,
   jauges, et les icônes (pièce, drapeau, château, cœur, étoile).
   Chaque motif est dessiné en petit sur un canvas, puis posé en
   « border-image » agrandi ×3 sans lissage. Petits outils du DOM aussi.
   Chargé dans le <head> (les styles sont prêts avant le premier écran).
   ===================================================================== */
'use strict';
(function () {
  const K = 3, css = [];
  function motif(w, h, peindre) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const col = peindre(x, y, Math.min(x, y, w - 1 - x, h - 1 - y)); if (col) px(x, y, col); }
    return c.toDataURL();
  }
  const coin = (x, y, w, h, n) => (x < n || x > w - 1 - n) && (y < n || y > h - 1 - n) && Math.min(x, w - 1 - x) + Math.min(y, h - 1 - y) < n;
  // le parchemin : contour sombre, cadre de bois à deux tons, filet sombre, papier (un peu plus clair en haut), coins coupés
  const parchemin = motif(24, 24, (x, y, d) => {
    if (coin(x, y, 24, 24, 2)) return null;
    if (d === 0) return '#2b1d0e';
    if (d === 1) return y < 12 ? '#c98f4a' : '#a86c32';
    if (d === 2) return '#7a4a22';
    if (d === 3) return '#2b1d0e';
    if (d === 4) return '#fff6dc';
    return y < 8 ? '#f6e7bf' : '#efdcab';
  });
  // le bandeau du haut : même chose, plus fin
  const bandeau = motif(16, 16, (x, y, d) => {
    if (coin(x, y, 16, 16, 1)) return null;
    if (d === 0) return '#2b1d0e';
    if (d === 1) return '#a86c32';
    if (d === 2) return '#2b1d0e';
    return y < 6 ? '#f6e7bf' : '#efdcab';
  });
  // boutons de bois (ou rouges) : reflet en haut, ombre en bas
  const bouton = (clair, fond, ombre, sombre) => motif(12, 12, (x, y, d) => {
    if (coin(x, y, 12, 12, 1)) return null;
    if (d === 0) return '#2b1d0e';
    if (y === 1) return clair;
    if (y >= 9) return y === 10 ? sombre : ombre;
    return fond;
  });
  const bois = bouton('#f3d08e', '#e0b064', '#b07c3a', '#7a4a22'), rouge = bouton('#f28a6c', '#d0482c', '#9c2c1a', '#6a1a10');
  const vert = bouton('#b8e88a', '#6cb84a', '#4a8a30', '#2a5a1a');
  const boisAppui = bouton('#b07c3a', '#c99450', '#c99450', '#7a4a22');
  // la bannière : un ruban rouge aux bouts fendus
  const banniere = motif(32, 14, (x, y) => {
    const bout = Math.min(x, 31 - x);
    if (bout < 4 && (y < 2 || y > 11 || Math.abs(y - 6.5) < 3 - bout)) return null;   // la fente des bouts
    if (y < 2 || y > 11) return null;
    if (y === 2 || y === 11 || (bout === 0)) return '#2b1d0e';
    if (bout < 4) return y < 7 ? '#9c2c1a' : '#7a1e12';   // les bouts, plus sombres (derrière)
    if (bout === 4) return '#2b1d0e';
    if (y === 3) return '#f28a6c';
    if (y >= 9) return '#a8301c';
    return '#d0482c';
  });
  css.push(`.cadre { border:${8 * K}px solid transparent; border-image:url(${parchemin}) 8 fill / ${8 * K}px; background:none; box-shadow:0 ${K}px 0 rgba(0,0,0,.25); image-rendering:pixelated; }`);
  css.push(`#res.cadre { border-width:${4 * K}px; border-image:url(${bandeau}) 5 fill / ${4 * K}px; }`);
  css.push(`button, .bouton { border:${4 * K}px solid transparent; border-image:url(${bois}) 4 fill / ${4 * K}px; background:none; box-shadow:none; image-rendering:pixelated; }`);
  css.push(`button:active, .bouton:active { border-image:url(${boisAppui}) 4 fill / ${4 * K}px; transform:translateY(${K}px); box-shadow:none; }`);
  css.push(`button:disabled { filter:grayscale(1) opacity(.55); }`);
  css.push(`button.rouge, #fin { border-image:url(${rouge}) 4 fill / ${4 * K}px; color:#fff6e0; }`);
  css.push(`button.vert { border-image:url(${vert}) 4 fill / ${4 * K}px; color:#10280a; }`);
  css.push(`.banniere { border:solid transparent; border-width:${2 * K}px ${6 * K}px; border-image:url(${banniere}) 2 6 fill / ${2 * K}px ${6 * K}px; background:none; image-rendering:pixelated; }`);
  css.push(`.jauge { border:${K}px solid #2b1d0e; background:#4a3420; box-shadow:inset 0 ${K}px 0 #2b1d0e; height:${4 * K}px; }`);
  css.push(`.jauge i { border:0; background:#d0482c; box-shadow:inset 0 ${K}px 0 #f28a6c, inset 0 -${K}px 0 #9c2c1a; }`);
  css.push(`.jauge.bleu i { background:#3a7ad8; box-shadow:inset 0 ${K}px 0 #8ab8f2, inset 0 -${K}px 0 #24508f; }`);
  // les icônes : pièce, drapeau, château, cœur, étoile (pleine ou vide), marteau, épée
  const icone = (lignes, couleurs) => { const c = document.createElement('canvas'); c.width = lignes[0].length; c.height = lignes.length; const g = c.getContext('2d');
    lignes.forEach((l, y) => [...l].forEach((ch, x) => { if (couleurs[ch]) { g.fillStyle = couleurs[ch]; g.fillRect(x, y, 1, 1); } })); return c.toDataURL(); };
  window.ICO = {
    piece: icone(['..kkkk..', '.kyyyyk.', 'kyYyyyyk', 'kyYyyoyk', 'kyyyyoyk', 'kyyyoyyk', '.kyoooyk', '..kkkk..'], { k: '#6a3c10', y: '#f2c230', Y: '#fff2a0', o: '#c98a10' }),
    drapeau: icone(['k.......', 'krrrr...', 'krRrrr..', 'krrrrrr.', 'krrrr...', 'k.......', 'k.......', 'kk......'], { k: '#4a3020', r: '#d8322a', R: '#ff8a70' }),
    chateau: icone(['g.g..g.g', 'gggggggg', '.gwggwg.', '.gggggg.', '.ggddgg.', '.ggddgg.', '.ggddgg.', 'kkkkkkkk'], { g: '#9aa4ae', w: '#4a5560', d: '#5a3a20', k: '#3a3a3a' }),
    coeur: icone(['.rr.rr.', 'rWrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#e0302a', W: '#ffb0a0' }),
    etoile: icone(['...y...', '...y...', '..yyy..', 'yyyYyyy', '.yyyyy.', '..yyy..', '.yy.yy.', 'y.....y'], { y: '#f2b020', Y: '#fff0a0' }),
    vide: icone(['...g...', '...g...', '..ggg..', 'ggggggg', '.ggggg.', '..ggg..', '.gg.gg.', 'g.....g'], { g: '#b8a888' }),
    epee: icone(['......ww', '.....wWw', '....wWw.', '.k.wWw..', '..kWw...', '..bk....', '.b..k...', 'b.......'], { w: '#c8d0d8', W: '#ffffff', k: '#6a4a20', b: '#8a5a2a' }),
  };
  css.push(`.ico { height:1.2em; width:auto; image-rendering:pixelated; vertical-align:-0.2em; }`);
  css.push(`.etoiles .ico { height:1.7em; margin:0 1px; }`);
  const s = document.createElement('style'); s.textContent = css.join('\n'); document.head.append(s);
})();

// ---------- petits outils ----------
const $ = id => document.getElementById(id);
// le texte en MAJUSCULES sans accent (Press Start 2P n'a pas de majuscules accentuées), sans toucher aux balises des icônes
const sansAccent = s => String(s).replace(/<[^>]*>|[^<]+/g, x => (x[0] === '<' ? x : x.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()));
const I = n => `<img class="ico" src="${ICO[n]}" alt="">`;
const etoilesHtml = c => { const n = banEtoiles(c); return I('etoile').repeat(n) + I('vide').repeat(3 - n); };
const motEtoiles = c => ['', 'DIFFICILE', 'CA PEUT MARCHER', 'FACILE'][banEtoiles(c)];
// une boîte qui vient de s'ouvrir ignore les touchers pendant un instant : le doigt qui a touché la carte
// ne doit pas appuyer, en se levant, sur le bouton apparu dessous (une attaque partait sans qu'on choisisse)
let boiteOuverte = 0;
function bouton(txt, action, ok = true, petit = '', classe = '') {
  const b = document.createElement('button');
  b.innerHTML = sansAccent(txt) + (petit ? `<small>${sansAccent(petit)}</small>` : '');
  b.disabled = !ok; b.onclick = e => { if (performance.now() - boiteOuverte < 400 && b.closest('#boite')) return; action(e); }; if (classe) b.className = classe;
  return b;
}
let toastT = 0;
function toast(txt) { const e = $('toast'); e.innerHTML = sansAccent(txt); e.classList.remove('cache'); clearTimeout(toastT); toastT = setTimeout(() => e.classList.add('cache'), 2600); }
// une boîte au milieu de l'écran (menus, surprises, fin) ; la promesse se résout quand on la ferme
function boite(titre, html, boutons) {
  const b = $('boite');
  b.innerHTML = (titre ? `<h2 class="banniere">${sansAccent(titre)}</h2>` : '') + (html || '');
  (boutons || []).forEach(x => b.append(x));
  if ($('voile').classList.contains('cache')) boiteOuverte = performance.now();
  $('voile').classList.remove('cache');
  b.scrollTop = 0;
}
const fermer = () => $('voile').classList.add('cache');
const ouverte = () => !$('voile').classList.contains('cache');
// une boîte qui attend un bouton : resout la promesse avec la valeur du bouton touché
function demander(titre, html, choix) {
  return new Promise(ok => boite(titre, html, choix.map(([txt, val, petit, classe]) => bouton(txt, () => { fermer(); ok(val); }, true, petit, classe))));
}

// un feu d'artifice par-dessus l'écran (victoire) : des gerbes de pixels qui retombent, 4 secondes
function feuArtifice() {
  const c = document.createElement('canvas'), k = 3;
  c.width = Math.ceil(innerWidth / k); c.height = Math.ceil(innerHeight / k);
  c.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:25;image-rendering:pixelated`;
  document.body.append(c);
  const g = c.getContext('2d'), parts = [], couleurs = ['#f2c230', '#d8322a', '#2f6fe0', '#9b4fd6', '#6cb84a', '#fff6e0'], t0 = performance.now();
  let graine = 12345; const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
  const gerbe = () => { const x = c.width * (0.15 + hasard() * 0.7), y = c.height * (0.12 + hasard() * 0.3), col = couleurs[Math.floor(hasard() * couleurs.length)];
    for (let n = 0; n < 36; n++) { const a = n / 36 * Math.PI * 2, v = 0.6 + hasard() * 0.9; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vie: 1, col }); } };
  let prochaine = 0;
  (function image(now) {
    const t = now - t0;
    if (t < 2800 && t >= prochaine) { gerbe(); prochaine += 450; }
    g.clearRect(0, 0, c.width, c.height);
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.025; p.vie -= 0.012; if (p.vie > 0) { g.globalAlpha = Math.min(1, p.vie * 1.5); g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); } });
    if (t < 4200) requestAnimationFrame(image); else c.remove();
  })(t0);
}

(() => {
  'use strict';
  const { loadAssets, TILE, Renderer, UI, Game, validateData, installPixelDigits, VIEW, viewSize, fromCell } = Resistance;

  // 240 × 160 px (la résolution de la Game Boy Advance) ; 160 × 240 en portrait, carte couchée
  let VIEW_W = 15 * TILE;
  let VIEW_H = 10 * TILE;

  const canvas = document.getElementById('game');
  const stage = document.getElementById('stage');
  const renderer = new Renderer(canvas);
  let scale = 4;

  const ui = new UI({
    onEndTurn: () => game.scene?.endPlayerPhase?.(),
    onRestart: () => game.showFortress(),
    onReplay: () => game.newRun(game.run.seed),
    onCancel: () => game.scene?.cancel(),
    onArmy: () => game.showArmy(),
    onDepart: () => game.scene?.onDepart?.(),
    onRetreat: () => game.confirmRetreat(),
    tileToScreen: (x, y) => ({ x: x * TILE * scale, y: y * TILE * scale, stageW: VIEW_W * scale }),
  });
  // L'écran actif (carte de run ou combat) est game.scene ; il reçoit les entrées.
  const game = new Game(ui);
  window.__game = game; // pratique pour déboguer dans la console

  // Mise à l'échelle en pixels physiques de l'écran (devicePixelRatio).
  // `scale` = pixels CSS par pixel de jeu.
  function fit() {
    const dpr = window.devicePixelRatio || 1;
    const portrait = window.innerWidth <= window.innerHeight;
    VIEW.portrait = portrait; // carte couchée sur un écran en hauteur (js/core/view.js)
    ({ w: VIEW_W, h: VIEW_H } = viewSize());
    const maxW = window.innerWidth - (portrait ? 8 : 16);
    const maxH = window.innerHeight - (portrait ? 280 : 64);
    const raw = Math.min((maxW * dpr) / VIEW_W, (maxH * dpr) / VIEW_H);
    // Écrans haute densité (téléphones) : un facteur non entier reste invisible à l'œil
    // et permet d'utiliser toute la largeur. Sinon, facteur entier pour des pixels parfaits.
    const deviceScale = Math.max(1, dpr >= 2 ? Math.floor(raw * 100) / 100 : Math.floor(raw));
    scale = deviceScale / dpr;
    renderer.resize(VIEW_W, VIEW_H, deviceScale);
    canvas.style.width = `${VIEW_W * scale}px`;
    canvas.style.height = `${VIEW_H * scale}px`;
    stage.style.width = `${VIEW_W * scale}px`;
    document.documentElement.style.setProperty('--s', scale);
  }

  function tileFromEvent(e) {
    const r = canvas.getBoundingClientRect();
    // case affichée -> case du jeu (la carte peut être couchée)
    return fromCell(
      Math.floor(((e.clientX - r.left) / r.width) * VIEW_W / TILE),
      Math.floor(((e.clientY - r.top) / r.height) * VIEW_H / TILE),
    );
  }

  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return; // au doigt, pas de survol
    const s = game.scene;
    const { x, y } = tileFromEvent(e);
    if (s && (x !== s.cursor.x || y !== s.cursor.y)) s.hover(x, y);
  });
  canvas.addEventListener('click', (e) => {
    const { x, y } = tileFromEvent(e);
    game.scene?.click(x, y);
  });
  canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); game.scene?.cancel(); });
  stage.addEventListener('contextmenu', (e) => { e.preventDefault(); game.scene?.cancel(); });

  window.addEventListener('keydown', (e) => {
    const s = game.scene;
    if (!s) return;
    const k = e.key;
    const isConfirm = k === 'Enter' || k === ' ' || k === 'z' || k === 'Z';
    const isCancel = k === 'Escape' || k === 'x' || k === 'X' || k === 'Backspace';
    const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (ui.modalOpen) {
      if (isConfirm) { e.preventDefault(); ui.modalConfirm(); }
      else if (isCancel) { e.preventDefault(); ui.modalCancel(); }
      else if (moves[k]) { e.preventDefault(); ui.modalMove(...moves[k]); }
      return;
    }
    if (moves[k]) { e.preventDefault(); s.moveCursor(...moves[k]); return; }
    if (isConfirm) { e.preventDefault(); s.confirm(); return; }
    if (isCancel) { e.preventDefault(); s.cancel(); return; }
    if (k === 'e' || k === 'E') s.endPlayerPhase?.();
    if (k === 'a' || k === 'A') game.showArmy();
  });

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', () => setTimeout(fit, 200));

  function loop(now) {
    const s = game.scene;
    if (s) {
      s.update(now);
      s.render(renderer);
    }
    requestAnimationFrame(loop);
  }

  (async function init() {
    fit();
    installPixelDigits(); // tous les chiffres de l'interface en chiffres pixel lisibles
    validateData();
    try {
      await loadAssets();
    } catch (err) {
      document.body.innerHTML = `<p style="padding:20px">Erreur de chargement : ${err.message}</p>`;
      return;
    }
    const urlSeed = Number.parseInt(new URLSearchParams(location.search).get('seed'), 10);
    // On arrive à la forteresse ; une graine passée dans l'URL sert à la première run.
    game.showFortress(Number.isFinite(urlSeed) ? urlSeed >>> 0 : null);
    game.resumeRun(); // une run interrompue (téléphone, onglet fermé) reprend où elle en était
    requestAnimationFrame(loop);
  })();
})();

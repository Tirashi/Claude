// Vue de la carte. Sur un écran en portrait (téléphone), la carte de 15×10 cases est couchée :
// affichée en 10×15, l'ouest (l'armée rebelle) en bas et l'est (l'ennemi) en haut. Les règles
// et les écrans gardent leurs coordonnées « paysage » ; seul le dessin et le toucher passent
// par ces fonctions. Les images ne sont pas tournées : chaque case, sprite ou marque est
// déplacé à sa nouvelle place, puis dessiné tel quel.
(() => {
  'use strict';
  const T = 16;

  const VIEW = { portrait: false, W: 15, H: 10 };

  // Taille de la carte affichée, en pixels de jeu
  const viewSize = () => (VIEW.portrait ? { w: VIEW.H * T, h: VIEW.W * T } : { w: VIEW.W * T, h: VIEW.H * T });

  // Case du jeu -> case affichée, et l'inverse (pour le toucher)
  const toCell = (x, y) => (VIEW.portrait ? { x: y, y: VIEW.W - 1 - x } : { x, y });
  const fromCell = (x, y) => (VIEW.portrait ? { x: VIEW.W - 1 - y, y: x } : { x, y });

  // Point en pixels de jeu -> point affiché (le centre d'une case reste le centre de sa case)
  const toPx = (px, py) => (VIEW.portrait ? { x: py, y: VIEW.W * T - px } : { x: px, y: py });

  // Dessine fn() (écrite en coordonnées paysage autour du point ax, ay) à la place de ce
  // point dans la vue : l'objet est déplacé, pas tourné.
  function place(ctx, ax, ay, fn) {
    if (!VIEW.portrait) { fn(); return; }
    const p = toPx(ax, ay);
    ctx.save();
    ctx.translate(p.x - ax, p.y - ay);
    fn();
    ctx.restore();
  }

  // Direction affichée d'un soldat sur la carte couchée. VIEW.profil (choix du 28/10) : les
  // soldats restent de profil (les rebelles regardent à droite, l'ennemi à gauche) ; sinon,
  // vus de dos (rebelles) et de face (ennemis). Un pas vers le haut ou le bas de la carte en
  // paysage devient un pas vers la gauche ou la droite.
  VIEW.profil = true;
  const FACE_DOS = { right: 'up', left: 'down', up: 'left', down: 'right' };
  const FACE_PROFIL = { right: 'right', left: 'left', up: 'left', down: 'right' };
  const faceOf = (f) => (VIEW.portrait ? (VIEW.profil ? FACE_PROFIL : FACE_DOS)[f] ?? f : f);

  // Fond de carte dessiné en paysage (cases de 16 px) -> fond affiché, case par case
  function viewCache(c) {
    if (!VIEW.portrait) return c;
    const r = document.createElement('canvas');
    const cols = c.width / T, rows = c.height / T;
    r.width = rows * T;
    r.height = cols * T;
    const g = r.getContext('2d');
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const d = toCell(x, y);
        g.drawImage(c, x * T, y * T, T, T, d.x * T, d.y * T, T, T);
      }
    }
    return r;
  }

  // Le fond en cache doit être refait si l'écran ou l'orientation change
  const cacheValid = (renderer, owner) => renderer.mapOwner === owner && renderer.mapPortrait === VIEW.portrait;
  function storeCache(renderer, owner, c) {
    renderer.mapCache = viewCache(c);
    renderer.mapOwner = owner;
    renderer.mapPortrait = VIEW.portrait;
  }

  Object.assign(Resistance, { VIEW, viewSize, toCell, fromCell, toPx, place, faceOf, cacheValid, storeCache });
})();

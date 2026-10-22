/* Moteur RPG — commandes (navigateur) : croix tactile, boutons A, B et MENU, et clavier
   (flèches ou ZQSD/WASD, Espace ou Entrée = A, X = B, Échap = MENU) pour jouer sur ordinateur et pour les tests.
   dir() : la direction tenue en ce moment (ou null) ; on(fn) : fn(touche) à chaque appui
   (touches : 'haut', 'bas', 'gauche', 'droite', 'A', 'B', 'MENU'). */
(function (M) {
  const CLAVIER = {
    ArrowUp: 'haut', ArrowDown: 'bas', ArrowLeft: 'gauche', ArrowRight: 'droite',
    z: 'haut', w: 'haut', s: 'bas', q: 'gauche', a: 'gauche', d: 'droite',
    ' ': 'A', Enter: 'A', x: 'B', Escape: 'MENU', m: 'MENU'
  };
  const DIRS = ['haut', 'bas', 'gauche', 'droite'];

  // zone : l'élément qui contient les boutons (attribut data-t = touche)
  function Entrees(zone) {
    const tenues = [];   // directions tenues, la dernière appuyée en premier
    const ecouteurs = [];
    const presse = t => { if (DIRS.includes(t)) { const i = tenues.indexOf(t); if (i >= 0) tenues.splice(i, 1); tenues.unshift(t); } ecouteurs.forEach(f => f(t)); };
    const lache = t => { const i = tenues.indexOf(t); if (i >= 0) tenues.splice(i, 1); };

    for (const b of zone.querySelectorAll('[data-t]')) {
      const t = b.dataset.t;
      b.addEventListener('pointerdown', e => { e.preventDefault(); b.classList.add('appui'); try { b.setPointerCapture(e.pointerId); } catch (err) { /* rien */ } presse(t); });
      const fin = () => { b.classList.remove('appui'); lache(t); };
      b.addEventListener('pointerup', fin); b.addEventListener('pointercancel', fin); b.addEventListener('lostpointercapture', fin);
      b.addEventListener('contextmenu', e => e.preventDefault());
    }
    addEventListener('keydown', e => {
      const t = CLAVIER[e.key] || CLAVIER[e.key.toLowerCase()];
      if (!t || e.target.tagName === 'INPUT') return;
      e.preventDefault(); if (!e.repeat) presse(t);
    });
    addEventListener('keyup', e => { const t = CLAVIER[e.key] || CLAVIER[e.key.toLowerCase()]; if (t) lache(t); });
    addEventListener('blur', () => { tenues.length = 0; });

    return {
      dir: () => tenues[0] || null,
      on: fn => ecouteurs.push(fn),
      // pour les tests : appuyer (et tenir pendant ms) sans toucher l'écran
      simuler(t, ms = 0) { presse(t); if (ms) setTimeout(() => lache(t), ms); else lache(t); },
      lacherTout() { tenues.length = 0; }
    };
  }

  M.Entrees = { Entrees };
})(window.MoteurRPG = window.MoteurRPG || {});

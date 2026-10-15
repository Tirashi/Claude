/* Test « fumée » dans Chromium : chaque jeu s'ouvre sans erreur JavaScript, et Nebula
   joue une partie (saut, combat au toucher, fin de tour, écran INCIDENT).
   Serveur local d'abord (racine du dépôt) : python3 -m http.server 8765
   node outils/fumee.js [dossier-captures]   (code de sortie 1 en cas d'erreur) */
const { BASE, phone } = require('./pw');
const PAGES = ['index.html', 'classements/index.html', 'queens/index.html', 'picross/index.html', 'lignee/index.html', 'injagility/index.html', 'injagility/parcours.html',
  'touche-coule/index.html', 'amiral/index.html', 'club/index.html', 'orbite/index.html', 'pont-stellaire/index.html', 'alunissage/index.html', 'nebula/index.html', 'ile/index.html',
  'tetris/index.html', 'snake/index.html', 'asteroids/index.html', 'solitaire/index.html', 'jeu-de-la-vie/index.html'];
const shots = process.argv[2];
(async () => {
  const { browser, ctx } = await phone(); let fail = 0;
  await ctx.route(/supabase\.co|fonts\.(googleapis|gstatic)\.com/, r => r.abort());   // ni réseau extérieur ni base
  for (const url of PAGES) {
    const p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + url); await p.waitForTimeout(800);
    if (url === 'nebula/index.html') {
      const r = await p.evaluate(async () => {
        const N = Nebula, wait = ms => new Promise(r => setTimeout(r, ms));
        N.run = N.newRun(77, 'escorte'); N.UI.screen = 'game'; N.jump(N.run, N.nextNodes(N.run)[0].id); await wait(3000);   // montée du saut (2 s) puis arrivée de la flotte
        const st = N.run.combat; if (!st) return 'pas de combat';
        // un vrai toucher sur le premier vaisseau du joueur, puis FIN DU TOUR
        const s = st.ships.find(x => x.side === 'P'), cv = document.getElementById('cv'), b = cv.getBoundingClientRect();
        const tapAt = (x, y) => cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: b.left + x / 544 * b.width, clientY: b.top + y / 960 * b.height, bubbles: true }));
        tapAt(20 + s.c * 72 + 36, 112 + s.r * 72 + 36); await wait(100);
        if (N.UI.sel !== s.id) return 'le toucher ne sélectionne pas le vaisseau';
        const t = st.turn; N.endTurn(st); if (st.turn === t && !st.result) return 'FIN DU TOUR sans effet';
        // entraînement guidé : joué à la place de la partie, qui est rendue intacte
        const saved = JSON.stringify(N.run); N.startTraining(() => {}); await wait(300);
        if (!N.run.training || !N.run.combat) return "l'entraînement ne démarre pas";
        N.endTraining(); if (JSON.stringify(N.run) !== saved) return "l'entraînement n'a pas rendu la partie";
        N.crash(new Error('essai')); await wait(200);
        return 'ok';
      });
      if (r !== 'ok') errs.push('Nebula : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-nebula-incident.png` });
    }
    if (errs.length) { fail++; console.log('ÉCHEC ' + url + '\n  ' + errs.join('\n  ')); } else console.log('ok    ' + url);
    await p.close();
  }
  await browser.close(); process.exit(fail ? 1 : 0);
})();

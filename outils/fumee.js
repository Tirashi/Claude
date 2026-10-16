/* Test « fumée » dans Chromium : chaque jeu s'ouvre sans erreur JavaScript, l'accueil ouvre le volet
   d'un jeu (et l'ancien lien des classements y mène), et Nebula joue une partie (saut, combat au toucher,
   fin de tour, écran INCIDENT).
   Serveur local d'abord (racine du dépôt) : python3 -m http.server 8765
   node outils/fumee.js [dossier-captures]   (code de sortie 1 en cas d'erreur) */
const { BASE, phone } = require('./pw');
const PAGES = ['index.html', 'classements/index.html#sudoku-1', 'queens/index.html', 'picross/index.html', 'lignee/index.html', 'injagility/index.html', 'injagility/parcours.html',
  'touche-coule/index.html', 'amiral/index.html', 'club/index.html', 'orbite/index.html', 'lune-rover/index.html', 'pont-stellaire/index.html', 'sudoku/index.html', 'calculator/index.html', 'alunissage/index.html', 'nebula/index.html', 'ile/index.html',
  'tetris/index.html', 'snake/index.html', 'asteroids/index.html', 'solitaire/index.html', 'jeu-de-la-vie/index.html'];
const shots = process.argv[2];
(async () => {
  const { browser, ctx } = await phone(); let fail = 0;
  await ctx.route(/supabase\.co|fonts\.(googleapis|gstatic)\.com/, r => r.abort());   // ni réseau extérieur ni base
  for (const url of PAGES) {
    const p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + url); await p.waitForTimeout(800);
    if (url === 'index.html') {
      // toucher une cartouche : elle tourne, puis le volet s'ouvre avec la boîte, les records et JOUER
      await p.click('.c3[data-k="orbite/index.html"]'); await p.waitForTimeout(900);
      const r = await p.evaluate(() => document.getElementById('ov').classList.contains('on') && document.getElementById('vTitle').textContent === 'ORBITE' && !!document.querySelector('#vBody .bwrap') && !!document.querySelector('#vBody a.play'));
      if (!r) errs.push("Accueil : le volet d'Orbite ne s'ouvre pas");
      if (shots) await p.screenshot({ path: `${shots}/fumee-accueil-volet.png` });
    }
    if (url.startsWith('classements/')) {
      const r = await p.evaluate(() => location.pathname.endsWith('/index.html') && !location.pathname.includes('classements') && document.getElementById('vTitle').textContent === 'SUDOKU');
      if (!r) errs.push("L'ancien lien des classements n'ouvre pas le volet du Sudoku");
    }
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
    if (url === 'ile/index.html') {
      // la colonie : un chantier posé au toucher du volet, puis trois semaines
      const r = await p.evaluate(async () => {
        const I = Ile, wait = ms => new Promise(r => setTimeout(r, ms));
        I.startRun(I.newRun(4242)); const run = I.run, [wx, wy] = I.makeIsle(4242).wreck; let spot = null;
        for (let d = 1; d < 6 && !spot; d++) for (let y = wy - d; y <= wy + d && !spot; y++) for (let x = wx - d; x <= wx + d && !spot; x++)
          if (I.MW > x && x >= 0 && I.MH > y && y >= 0 && I.buildOptions(run, x, y).some(([k, w]) => k === 'habitation' && !w)) spot = [x, y];
        if (!spot) return 'pas de case pour une habitation';
        I.selectTile(spot[0], spot[1]); await wait(50);
        const btn = [...document.querySelectorAll('#panel .build')].find(b => b.textContent.includes('Habitation')); if (!btn) return 'pas de bouton Habitation';
        btn.click(); if (!run.B.some(b => b.target === 'habitation')) return "le chantier n'est pas posé";
        for (let k = 0; k < 3; k++) { I.nextWeek(); await wait(1100); }
        if (run.turn !== 3 || document.getElementById('sheet').hidden) return 'la semaine ne passe pas';
        I.openSheet('recherche'); I.openSheet('colons'); I.openSheet('postes'); I.openSheet('menu');
        return 'ok';
      });
      if (r !== 'ok') errs.push('La colonie : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-colonie.png` });
    }
    if (errs.length) { fail++; console.log('ÉCHEC ' + url + '\n  ' + errs.join('\n  ')); } else console.log('ok    ' + url);
    await p.close();
  }
  await browser.close(); process.exit(fail ? 1 : 0);
})();

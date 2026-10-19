/* Test « fumée » dans Chromium : chaque jeu s'ouvre sans erreur JavaScript, l'accueil ouvre le volet
   d'un jeu (et l'ancien lien des classements y mène), et Nebula joue une partie (saut, combat au toucher,
   fin de tour, écran INCIDENT), Amiral ! les pouvoirs du chantier (missiles, sonar, projecteur, réparation, mines et leur riposte, fumée, leurre), la bataille du jour et des parties simulées, Escadrille ! un tour de combat (toucher, riposte), et Odyssée traverse un plateau avec son pilote automatique, lance le plateau du jour et montre la cire.
   Serveur local d'abord (racine du dépôt) : python3 -m http.server 8765
   node outils/fumee.js [dossier-captures]   (code de sortie 1 en cas d'erreur) */
const { BASE, phone } = require('./pw');
const PAGES = ['index.html', 'classements/index.html#sudoku-1', 'queens/index.html', 'picross/index.html', 'lignee/index.html', 'injagility/index.html', 'injagility/parcours.html',
  'touche-coule/index.html', 'amiral/index.html', 'club/index.html', 'orbite/index.html', 'lune-rover/index.html', 'pont-stellaire/index.html', 'sudoku/index.html', 'calculator/index.html', 'alunissage/index.html', 'nebula/index.html', 'ile/index.html', 'empilage/index.html', 'odyssee/index.html', 'yams/index.html', 'escadrille/index.html',
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
    if (url === 'odyssee/index.html') {
      // Odyssée : la carte, puis un plateau traversé quelques secondes par le pilote automatique
      const r = await p.evaluate(async () => {
        const O = Odyssee, wait = ms => new Promise(r => setTimeout(r, ms));
        O.carte(); await wait(100);
        if (!document.querySelector('#svg .escale') || !document.querySelector('#cVolet .plat')) return "la carte de l'Égée est vide";
        O.lancer('3-1'); O.pilote = true; O.partir(); const x0 = O.st.x, y0 = O.st.y; await wait(1500);
        if (O.mode !== 'jeu' || Math.hypot(O.st.x - x0, O.st.y - y0) < 0.5) return 'la galère ne bouge pas';
        O.lancerJour(); if (O.mode !== 'recit' || !O.st || !document.getElementById('rChant').textContent.includes('PLATEAU DU JOUR')) return 'le plateau du jour ne se lance pas';
        O.lancer('7-2'); O.partir(); await wait(300); if (document.getElementById('bCire').hidden) return 'pas de bouton CIRE chez les Sirènes';
        return 'ok';
      });
      if (r !== 'ok') errs.push('Odyssée : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-odyssee.png` });
    }
    if (url === 'amiral/index.html') {
      // Amiral ! : le chantier naval (flotte des nouveaux navires), un coup de chaque nouveau pouvoir, la riposte, puis des parties simulées
      const r = await p.evaluate(async () => {
        const A = Amiral, S = A.S, wait = ms => new Promise(r => setTimeout(r, ms));
        A.openYard(); A.YARD.fleet = ['cruiser', 'destroyer', 'sub', 'coast']; A.newGame(); A.startBattle();
        const turn = async plan => { S.busy = false; S.turn = 'player'; await A.playerAct(plan); for (let k = 0; k < 80 && (S.turn !== 'player' || S.busy) && S.phase === 'play'; k++) await wait(100); };
        await turn({ w: 'missiles', c: 0, r: 0, h: true, cells: [[0, 0], [7, 7], [3, 4]] });
        if (S.stats.shots !== 3) return 'les missiles ne tirent pas 3 fois';
        if (S.turn !== 'player') return "l'ennemi ne rend pas la main";
        await turn({ w: 'sonar', c: 0, r: 5, h: true });
        if (!S.enemy.sonar.some(q => q.h && q.i === 5)) return 'le sonar ne note pas la ligne';
        await turn({ w: 'projecteur', c: 4, r: 2, h: false });
        A.YARD.fleet = ['tender', 'battle', 'sub', 'torp']; A.newGame(); A.startBattle();
        const b = S.player, s = b.ships[0]; b.shots[s.r][s.c] = 2; s.hits = 1;
        // vérifiée dès la fin de l'action, avant la riposte (l'ennemi peut retoucher le navire réparé)
        S.busy = false; S.turn = 'player'; await A.playerAct({ w: 'reparation', c: s.c, r: s.r, h: true });
        if (s.hits !== 0 || b.shots[s.r][s.c]) return 'la réparation ne répare pas';
        for (let k = 0; k < 80 && (S.turn !== 'player' || S.busy) && S.phase === 'play'; k++) await wait(100);
        // mines, fumée, leurre ; une mine ennemie touchée riposte
        localStorage.setItem('amiral.palmares', JSON.stringify({ victoires: 10, normal: 1, hard: 1 }));
        A.YARD.fleet = ['carrier', 'layer', 'jammer', 'launch']; A.newGame(); A.startBattle();
        const me = S.player, water = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (me.grid[r][c] < 0) water.push([c, r]);
        await turn({ w: 'mines', c: water[0][0], r: water[0][1], h: true, cells: [water[0], water[9]] });
        if (me.mines.length !== 2) return 'les mines ne sont pas posées';
        await turn({ w: 'fumee', c: 3, r: 3, h: true });
        if (!me.smoke || me.smoke.left !== 1) return "la fumée ne s'use pas au coup ennemi";
        const spot = water.flatMap(([c, r]) => [[c, r, true], [c, r, false]]).find(([c, r, h]) => [[c, r], h ? [c + 1, r] : [c, r + 1]].every(([x, y]) => x < 8 && y < 8 && me.grid[y][x] < 0 && !me.shots[y][x] && !me.intel[y][x] && !me.mines.some(m => m[0] === x && m[1] === y)));
        await turn({ w: 'leurre', c: spot[0], r: spot[1], h: spot[2] });
        if (me.decoys.length !== 1 && !me.shots[spot[1]][spot[0]]) return "le leurre n'est pas à l'eau";
        const foe = S.enemy, wc = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (foe.grid[r][c] < 0 && !foe.shots[r][c]) wc.push([c, r]);
        foe.mines.push(wc[0].slice()); const hits0 = me.ships.reduce((a, s) => a + s.hits, 0), my0 = S.stats.aiShots;
        await turn({ w: 'tir', c: wc[0][0], r: wc[0][1], h: true });
        if (me.ships.reduce((a, s) => a + s.hits, 0) <= hits0 && S.phase === 'play') return "la mine ennemie ne riposte pas";
        foe.smoke = { c0: 0, r0: 0, left: 2 }; const sc = wc.find(([c, r]) => c < 3 && r < 3 && !foe.shots[r][c]) || [0, 0];
        if (!foe.shots[sc[1]][sc[0]]) { await turn({ w: 'tir', c: sc[0], r: sc[1], h: true }); if (!foe.veil[sc[1]][sc[0]] && S.phase === 'play') return 'le tir dans la fumée ennemie se voit'; }
        // bataille du jour
        const d = A.todayKey(); A.newGame(d); if (!S.daily || S.diff !== 'normal' || S.player.ships[0].def.id !== A.dailyOf(d).fleet[0]) return 'la bataille du jour ne prend pas les flottes du jour';
        A.openYard(); if (S.daily) return 'le chantier ne quitte pas la bataille du jour';
        const all = ['carrier', 'cruiser', 'tender'].flatMap(a => ['battle', 'destroyer', 'layer', 'jammer'].flatMap(m => [[a, m, 'sub', 'torp'], [a, 'sub', m, 'coast'], [a, m, 'sub', 'launch']]));
        for (const f of all) for (const d of ['easy', 'normal', 'hard']) { const g = await A.simulate(f, all[(all.indexOf(f) + 3) % all.length], d); if (!g.winner) return 'partie simulée sans vainqueur : ' + f; }
        return 'ok';
      });
      if (r !== 'ok') errs.push('Amiral ! : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-amiral.png` });
    }
    if (url === 'escadrille/index.html') {
      // Escadrille ! : placement au hasard, décollage, un vrai toucher sur le ciel ennemi, puis la riposte de l'ordinateur
      const r = await p.evaluate(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms)), cv = document.getElementById('cv'), b = cv.getBoundingClientRect();
        newGame(); startBattle(); await wait(100);
        cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: b.left + (BX + 4.5 * CS) / LW * b.width, clientY: b.top + (BY + 4.5 * CS) / LH * b.height, bubbles: true, pointerType: 'touch' }));
        await wait(1000); if (!S.enemy.shots[4][4]) return 'le toucher ne largue pas de bombe en E5';
        for (let k = 0; k < 40 && !(S.turn === 'player' && !S.busy); k++) await wait(200);
        if (S.turn !== 'player' || !S.player.shots.flat().some(v => v) && !S.player.intel.flat().some(v => v) && !Object.values(S.enemy.cd).some(v => v > 0)) return "l'ordinateur ne riposte pas";
        if (S.stats.turns !== 1) return 'compte des tours faux';
        S.phase = 'hangar'; S.tab = 'familles'; await wait(300); if (!BTN.some(b => b.w === 124)) return 'le hangar ne montre pas les escadrilles';
        S.tab = 'avions'; await wait(300); if (BTN.filter(b => b.w === 61).length !== 4) return "l'onglet AVIONS ne montre pas les 4 places";
        // lot 2 : les nouveaux pouvoirs (roquettes, réparation, détection, caméra, ballons et DCA, leurres)
        S.fast = true; S.player = makeBoard(['ravito', 'patrouille', 'ballons', 'drone']); S.enemy = makeBoard(['attaque', 'brouilleur', 'jet', 'heli']); randomFleet(S.player); randomFleet(S.enemy);
        const cells = cellsOf(S.player.planes[0]).slice(0, 4);
        let r = await act('ai', { w: 'roquettes', c: 0, r: 0, cells }); if (r.hits.length !== 4) return 'roquettes : 4 touchés attendus';
        await act('player', { w: 'reparation', c: cells[0][0], r: cells[0][1] }); if (S.player.planes[0].hits) return "réparation : l'avion n'est pas remis à neuf";
        r = await act('player', { w: 'detection', c: 3, r: 5 }); if (!r.counts || r.counts.length !== 2) return 'détection : ligne et colonne attendues';
        const free = flakTargets(S.player).slice(0, 2); await act('player', { w: 'flak', c: 0, r: 0, cells: free });
        const hits0 = S.enemy.planes.reduce((a, q) => a + q.hits, 0); r = await act('ai', { w: 'tir', c: free[0][0], r: free[0][1] }); await ripostes('ai', r);
        if (S.enemy.planes.reduce((a, q) => a + q.hits, 0) !== hits0 + 2) return 'ballon crevé : la DCA doit toucher 2 fois';
        S.player.planes[1].def = PLANES.brouilleur; S.player.cd.leurres = 0; await act('player', { w: 'leurres', c: 0, r: 0 });
        r = await act('ai', { w: 'tir', c: 0, r: 0 }); if (!r.deflected) return 'leurres : le coup ennemi doit être détourné';
        S.fast = false;
        for (const [a, b] of [[['attaque', 'patrouille', 'ballons', 'drone'], ['ravito', 'brouilleur', 'jet', 'heli']], [['ravito', 'brouilleur', 'ballons', 'drone'], ['bomb', 'radar', 'jet', 'heli']]])
          for (const d of ['easy', 'normal', 'hard']) { const g = await simulate(a, b, d); if (!g.winner) return `partie simulée sans vainqueur (${d})`; }
        return 'ok';
      });
      if (r !== 'ok') errs.push('Escadrille ! : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-escadrille.png` });
    }
    if (errs.length) { fail++; console.log('ÉCHEC ' + url + '\n  ' + errs.join('\n  ')); } else console.log('ok    ' + url);
    await p.close();
  }
  await browser.close(); process.exit(fail ? 1 : 0);
})();

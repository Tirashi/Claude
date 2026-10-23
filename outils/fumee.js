/* Test « fumée » dans Chromium : chaque jeu s'ouvre sans erreur JavaScript, l'accueil ouvre le volet
   d'un jeu (et l'ancien lien des classements y mène), et Nebula joue une partie (saut, combat au toucher,
   fin de tour, écran INCIDENT), Amiral ! les pouvoirs du chantier (missiles, sonar, projecteur, réparation, mines et leur riposte, fumée, leurre), la bataille du jour et des parties simulées, Escadrille ! un tour de combat (toucher, riposte), et Odyssée traverse un plateau avec son pilote automatique, lance le plateau du jour et montre la cire.
   Serveur local d'abord (racine du dépôt) : python3 -m http.server 8765
   node outils/fumee.js [dossier-captures]   (code de sortie 1 en cas d'erreur) */
const { BASE, phone } = require('./pw');
const PAGES = ['index.html', 'classements/index.html#sudoku-1', 'queens/index.html', 'picross/index.html', 'lignee/index.html', 'injagility/index.html', 'injagility/parcours.html',
  'touche-coule/index.html', 'amiral/index.html', 'club/index.html', 'orbite/index.html', 'lune-rover/index.html', 'pont-stellaire/index.html', 'sudoku/index.html', 'calculator/index.html', 'alunissage/index.html', 'nebula/index.html', 'ile/index.html', 'empilage/index.html', 'odyssee/index.html', 'yams/index.html', 'escadrille/index.html', 'capitaine-du-port/index.html', 'magasinier/index.html', 'romet/index.html', 'duche/index.html', 'bannieres/index.html', 'the-des-jarls/index.html', 'doggy-saga/index.html',
  'mot-d-or/index.html', 'lanterne/index.html', 'tetris/index.html', 'snake/index.html', 'asteroids/index.html', 'solitaire/index.html', 'jeu-de-la-vie/index.html'];
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
    if (url === 'lanterne/index.html') {
      // La Dernière Lanterne : nouvelle partie, dialogue d'Ysolde au clavier, un pas sur la carte, sauvegarde, un combat
      const r = await p.evaluate(async () => {
        const L = Lanterne, wait = ms => new Promise(r => setTimeout(r, ms));
        const espace = () => dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        L.sauvegardes.effacer(3); L.nouvelle(3, 'FUMEE'); await wait(1500);
        if (L.etat.carte !== 'maison_ysolde') return 'la partie ne commence pas chez Ysolde';
        if (!document.querySelector('.rpg-dialogue.on')) return "pas de dialogue d'Ysolde";
        for (let i = 0; i < 60 && (document.querySelector('.rpg-dialogue.on') || L.partie.occupe); i++) { espace(); await wait(120); }
        if (!L.etat.drapeaux.mission) return "le dialogue d'Ysolde ne donne pas la mission";
        const x = L.etat.x; L.entrees.simuler('droite', 5000);
        for (let i = 0; i < 50 && L.etat.x === x; i++) await wait(100);
        L.entrees.lacherTout(); await wait(600);
        if (L.etat.x !== x + 1) return "le héros n'avance pas";
        if (!L.sauvegardes.resume(3)) return 'pas de sauvegarde automatique';
        // un combat entier contre un feu follet, en appuyant sur A (Attaque, puis la cible)
        L.etat.heros.heros.pv = L.etat.heros.heros.pvMax; const xp = L.etat.heros.heros.xp + L.etat.heros.heros.niveau * 100;
        L.partie.jouer([{ combat: ['feu_follet'] }]); await wait(300);
        if (!L.combat) return 'le combat ne commence pas';
        for (let i = 0; i < 400 && L.combat; i++) { L.combat.touche('A'); await wait(80); }
        if (L.combat) return 'le combat ne finit pas';
        if (L.etat.heros.heros.xp + L.etat.heros.heros.niveau * 100 <= xp) return "pas d'expérience après la victoire";
        return 'ok';
      });
      if (r !== 'ok') errs.push('La Dernière Lanterne : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-lanterne.png` });
    }
    if (url === 'magasinier/index.html') {
      // Le Magasinier : un niveau avec de la glace gagné par sa solution, écran de fin ; annuler revient en arrière
      const r = await p.evaluate(async () => {
        const M = Magasinier, wait = ms => new Promise(r => setTimeout(r, ms));
        M.charger(14); M.jouer('H'); if (M.etat().chemin !== 'H') return 'le docker ne bouge pas';
        M.annuler(); if (M.etat().chemin !== '') return "ANNULER ne revient pas en arrière";
        M.jouer(MAG_NIVEAUX[14].sol); await wait(200);
        if (!M.etat().fini) return 'la solution ne gagne pas le niveau';
        if (document.getElementById('eFin').hidden) return "pas d'écran de fin";
        M.jour(); const g = M.etat().grille; if (!g || !g.plan || !(g.opt >= 25)) return 'pas de grille du jour';
        return 'ok';
      });
      if (r !== 'ok') errs.push('Le Magasinier : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-magasinier.png` });
    }
    if (url === 'romet/index.html') {
      // Romet : JOUER, un vrai toucher lâche une pièce ; la fin de partie montre le butin ; la ruche s'ouvre quand la foire est finie
      const r = await p.evaluate(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        for (let i = 0; i < 60 && !(window.Romet && Romet.partie); i++) await wait(100);
        if (!window.Romet || !Romet.partie) return 'pas de partie';
        document.getElementById('bJouer').click(); const n = Romet.partie.lachers, e = document.getElementById('ecran'), b = e.getBoundingClientRect();
        e.dispatchEvent(new PointerEvent('pointerdown', { clientX: b.left + b.width / 2, clientY: b.top + b.height / 2, bubbles: true }));
        e.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
        if (Romet.partie.lachers !== n + 1) return 'le toucher ne lâche pas de pièce';
        await wait(1500); const p = Romet.partie; p.bourse = 0; p.pluie = 0; p.calme = 5; await wait(300);
        if (Romet.menu !== 'eFin') return "pas d'écran de fin de partie";
        Romet.prog.foire.t = [true, true, true, true, true, true]; Romet.ouvrir(Romet.MACHINES[1]); await wait(300);
        if (Romet.machine.id !== 'ruche' || !Romet.partie) return 'la ruche ne s\'ouvre pas';
        return 'ok';
      });
      if (r !== 'ok') errs.push('Romet : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-romet.png` });
    }
    if (url === 'duche/index.html') {
      // Duché : une partie libre, une attaque jouée jusqu'au bout, un tour des rivaux, un événement répondu, abdiquer → écran de fin ; le Duché du jour se charge
      const r = await p.evaluate(async () => {
        const U = Duche, wait = ms => new Promise(r => setTimeout(r, ms));
        U.libre('normal'); const e = U.etat(); if (!e || e.tour !== 1) return 'pas de partie libre';
        const c = e.terres.findIndex((t, i) => t.prop !== 0 && !ducPeutAttaquer(e, 0, i));
        if (c < 0) return 'aucune terre à attaquer';
        U.choisir(c); U.attaquer(c, 1); if (U.ecran() !== 'combat') return 'pas de scène de combat';
        await wait(300); U.finCombat(); if (U.ecran() !== 'carte') return 'le combat ne rend pas la carte';
        for (let n = 0; n < 4; n++) { U.finTour(); U.passerRivaux(); if (U.etat().evt) { const ch = ducChoix(U.etat()).find(x => x.ok); U.repondre(ch.k); } }
        if (U.etat().tour !== 5) return 'les tours n\'avancent pas (' + U.etat().tour + ')';
        if (!localStorage.getItem('duche.run')) return 'partie pas sauvegardée';
        document.getElementById('bAbandon').click(); document.getElementById('bAbandon').click();
        await wait(100); if (document.getElementById('eFin').hidden) return "pas d'écran de fin";
        U.jour(); if (!U.etat() || U.etat().mode !== 'jour' || U.etat().niveau !== 'normal') return 'pas de Duché du jour';
        return 'ok';
      });
      if (r !== 'ok') errs.push('Duché : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-duche.png` });
    }
    if (url === 'bannieres/index.html') {
      // Bannières : le titre (après le chargement des personnages), une partie facile, une armée qui bouge, une maison, un tour des rivaux, la sauvegarde
      const r = await p.evaluate(async () => {
        const wait = ms => new Promise(r => setTimeout(r, ms));
        for (let n = 0; n < 60 && Bannieres.ecran !== 'titre'; n++) await wait(500);
        if (Bannieres.ecran !== 'titre') return "pas d'écran titre (" + Bannieres.ecran + ')';
        localStorage.setItem('bannieres.tuto', 'true'); Bannieres.nouvelle('facile', 3, 42);
        const e = Bannieres.etat; if (!e || e.tour !== 1 || Bannieres.ecran !== 'carte') return 'pas de partie';
        const a = banArmeesDe(e, 0)[1], j = [...banAtteignables(e, a).keys()].find(k => !banEnnemiSur(e, 0, k) && !banArmeeSur(e, k));
        await Bannieres.deplacer(a.id, j); if (a.terre !== j || a.pts) return "l'armée n'a pas bougé";
        const i = e.terres.findIndex(t => t.prop === 0 && !t.bat); Bannieres.construire(i, 'maison'); if (e.terres[i].bat !== 'maison') return 'pas de maison';
        await Bannieres.finTour(); if (Bannieres.etat.tour !== 2 || Bannieres.occupe) return "le tour n'avance pas";
        if (!JSON.parse(localStorage.getItem('bannieres.run') || 'null')) return 'partie pas sauvegardée';
        return 'ok';
      });
      if (r !== 'ok') errs.push('Bannières : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-bannieres.png` });
    }
    if (url === 'the-des-jarls/index.html') {
      // Le Thé des Jarls : un duel contre un dieu joué jusqu'au bout (batailles accélérées), partie sauvegardée puis effacée, écran de fin ; le duel à deux démarre
      const r = await p.evaluate(async () => {
        const J = Jarls, wait = ms => new Promise(r => setTimeout(r, ms)), E = () => J.etat();
        J.duel({ dieu: 'loki', niveau: 2, graine: 7 });
        if (!localStorage.getItem('jarls.run')) return 'partie pas sauvegardée';
        // chaque effet de la bataille se dessine (21/10 : le portrait de Thor manquait et cassait tout le dessin, HUD et dés compris)
        const t0 = performance.now() / 1000;
        for (const nom of ['dieu', 'foudre', 'soin', 'fleches', 'haches', 'mains', 'hiver']) for (const id of ['thor', 'idunn', 'loki']) {
          J.vue().anim = { t0: t0 - 1, fin: t0 + 5, ph: [{ nom, id, qui: 0, att: [2, 2], def: [1, 1], t: 0, d: 2, coup: 9, txt: 'ESSAI' }] };
          try { dessiner(t0); } catch (e) { J.vue().anim = null; return `dessin de « ${nom} » (${id}) : ${e.message}`; }
        }
        J.vue().anim = null;
        let batailles = 0;
        for (let n = 0; n < 600 && !E().fin; n++) {
          if (J.vue().anim) { batailles++; J.accelerer(); await wait(40); continue; }
          const e = E();
          if (e.tour === 0 && e.phase === 'lancer') J.lancer(0);
          else if (e.tour === 0 && e.phase === 'faveur') J.faveur(0, e.camps[0].jetons >= 4 ? 'thor' : null, 1);
          await wait(e.tour === 0 ? 20 : 150);
        }
        if (!E().fin) return 'le duel ne finit pas (manche ' + E().manche + ')';
        if (!batailles) return 'aucune bataille montrée';
        await wait(60); J.accelerer();   // la dernière bataille est encore montrée
        await wait(1000); if (document.getElementById('eFin').hidden) return "pas d'écran de fin";
        if (localStorage.getItem('jarls.run')) return 'partie finie encore sauvegardée';
        J.duel({ duo: true, graine: 3 }); const t = E().tour; J.lancer(t);
        if (E().camps[t].lancers !== 1 || E().tour === t) return 'à deux : le lancer ne passe pas la main';
        // le duel guidé de Sigrid, étape par étape, jusqu'à la fin de la première manche
        J.lancerGuide();
        for (let n = 0; n < 200 && J.guide(); n++) {
          const k = J.guide().k, e = GUIDE_ETAPES[k], s = E();
          if (J.vue().anim) J.accelerer();
          else if (e.a === 'ok') J.guideOk();
          else if (s.tour === 0 && e.a === 'lancer') J.lancer(0);
          else if (s.tour === 0 && e.a === 'garder') [0, 1, 3].forEach(j => J.garder(0, j));
          else if (s.tour === 0 && e.a === 'finir') J.finir(0);
          else if (s.tour === 0 && e.a === 'faveur') J.faveur(0, 'thor', 1);
          await wait(e.a === 'tour' ? 200 : 60);
        }
        if (J.guide()) return 'duel guidé bloqué à l\'étape ' + (J.guide().k + 1);
        if (E().manche !== 2 || E().camps[0].pv !== 12 || E().camps[1].pv !== 11) return `duel guidé : manche ${E().manche}, PV ${E().camps.map(c => c.pv)} au lieu de 12 contre 11`;
        // la route du fjord et le défi du jour s'ouvrent
        localStorage.setItem('jarls.guide', 'true'); J.ecranCampagne();
        if (document.getElementById('eCampagne').hidden || document.querySelectorAll('#route .tav').length !== 20) return 'route du fjord absente';
        J.defiDuJour(); document.getElementById('bIntroJour').click();
        if (!E() || E().mode !== 'jour' || !localStorage.getItem('jarls.dailyTry')) return 'défi du jour pas lancé';
        return 'ok';
      });
      if (r !== 'ok') errs.push('Le Thé des Jarls : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-jarls.png` });
    }
    if (url === 'doggy-saga/index.html') {
      // Doggy Saga : le niveau 1 joué jusqu'au bout (étoiles et album gardés), grille visible = vraie grille ; la journée du jour se lance et compte dès le départ
      const r = await p.evaluate(async () => {
        const D = DoggySaga, wait = ms => new Promise(r => setTimeout(r, ms));
        D.vite = true; D.lancer(1);
        for (let k = 0; k < 400 && !D.partie().fini; k++) {
          if (!D.occupe() && !D.etat().fin) { const m = dogCoupsPossibles(D.etat())[0]; if (m) D.jouer(m[0], m[1]); }
          await wait(40);
        }
        const P = D.partie();
        if (!P.fini) return 'le niveau 1 ne finit pas';
        if (P.desync) return `grille visible décalée ${P.desync} fois`;
        await wait(300);
        if (document.getElementById('eFin').hidden) return "pas d'écran de fin";
        if (P.e.fin === 'gagne' && !(D.progres.etoiles[1] >= 1 && D.progres.album.length)) return 'étoiles ou album pas gardés';
        D.titre(); document.getElementById('bJour').click(); document.getElementById('bPartir').click();
        if (!D.etat() || D.etat().mode !== 'jour' || Number(localStorage.getItem('doggysaga.dailyTry')) !== D.auj()) return 'journée du jour pas lancée';
        D.vite = false;
        return 'ok';
      });
      if (r !== 'ok') errs.push('Doggy Saga : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-doggy.png` });
    }
    if (url === 'capitaine-du-port/index.html') {
      // Capitaine du port : un bassin gagné par sa solution, écran de fin ; annuler revient en arrière ; le bassin du jour se charge
      const r = await p.evaluate(async () => {
        const C = Capitaine, wait = ms => new Promise(r => setTimeout(r, ms)), sol = capSolLire(CAP_NIVEAUX[5].sol);
        C.charger(5); C.jouer([sol[0]]); if (C.etat().coups !== 1) return 'le bateau ne bouge pas';
        C.annuler(); if (C.etat().coups !== 0) return "ANNULER ne revient pas en arrière";
        C.jouer(sol); if (!C.etat().gagne) return 'la solution ne gagne pas le bassin';
        await wait(2000); if (document.getElementById('eFin').hidden) return "pas d'écran de fin";
        if (CAP_PORTS[4].n) { C.charger(CAP_PORTS[4].debut); if (C.bassin().w !== 7) return 'le grand port n\'est pas en 7 × 7'; }
        C.jour(); const b = C.niveau(); if (!b || !b.plan || !(b.opt >= 12)) return 'pas de bassin du jour';
        return 'ok';
      });
      if (r !== 'ok') errs.push('Capitaine du port : ' + r);
      if (shots) await p.screenshot({ path: `${shots}/fumee-capitaine.png` });
    }
    if (url === 'amiral/index.html') {
      // Amiral ! : le chantier naval (flotte des nouveaux navires), un coup de chaque nouveau pouvoir, la riposte, puis des parties simulées
      const r = await p.evaluate(async () => {
        const A = Amiral, S = A.S, wait = ms => new Promise(r => setTimeout(r, ms));
        A.openYard(); A.YARD.fleet = ['cruiser', 'destroyer', 'sub', 'coast']; A.newGame(); A.startBattle();
        // un tour du joueur puis la riposte ; `check` est vérifiée dès la fin de l'action, avant que l'ordinateur (flotte et coups au hasard) ne joue
        const turn = async (plan, check) => { S.busy = false; S.turn = 'player'; await A.playerAct(plan); const e = check ? check() : null; for (let k = 0; k < 150 && (S.turn !== 'player' || S.busy) && S.phase === 'play'; k++) await wait(100); return e; };
        let e = await turn({ w: 'missiles', c: 0, r: 0, h: true, cells: [[0, 0], [7, 7], [3, 4]] }, () => S.stats.shots !== 3 ? 'les missiles ne tirent pas 3 fois' : null);
        if (e) return e;
        if (S.turn !== 'player') return "l'ennemi ne rend pas la main";
        e = await turn({ w: 'sonar', c: 0, r: 5, h: true }, () => !S.enemy.sonar.some(q => q.h && q.i === 5) ? 'le sonar ne note pas la ligne' : null);
        if (e) return e;
        await turn({ w: 'projecteur', c: 4, r: 2, h: false });
        A.YARD.fleet = ['tender', 'battle', 'sub', 'torp']; A.newGame(); A.startBattle();
        const b = S.player, s = b.ships[0]; b.shots[s.r][s.c] = 2; s.hits = 1;
        e = await turn({ w: 'reparation', c: s.c, r: s.r, h: true }, () => s.hits !== 0 || b.shots[s.r][s.c] ? 'la réparation ne répare pas' : null);
        if (e) return e;
        // mines, fumée, leurre : chacun dès le premier tour d'une nouvelle partie (l'ordinateur n'a pas encore pu couler le navire) ; une mine ennemie touchée riposte
        localStorage.setItem('amiral.palmares', JSON.stringify({ victoires: 10, normal: 1, hard: 1 }));
        A.YARD.fleet = ['carrier', 'layer', 'jammer', 'launch'];
        const waterOf = bd => { const w = []; for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (bd.grid[r][c] < 0) w.push([c, r]); return w; };
        A.newGame(); A.startBattle();
        let me = S.player, water = waterOf(me);
        e = await turn({ w: 'mines', c: water[0][0], r: water[0][1], h: true, cells: [water[0], water[9]] }, () => me.mines.length !== 2 ? 'les mines ne sont pas posées' : null);
        if (e) return e;
        A.newGame(); A.startBattle(); me = S.player;
        await turn({ w: 'fumee', c: 3, r: 3, h: true });
        if (!me.smoke || me.smoke.left !== 1) return "la fumée ne s'use pas au coup ennemi";
        A.newGame(); A.startBattle(); me = S.player; water = waterOf(me);
        const spot = water.flatMap(([c, r]) => [[c, r, true], [c, r, false]]).find(([c, r, h]) => [[c, r], h ? [c + 1, r] : [c, r + 1]].every(([x, y]) => x < 8 && y < 8 && me.grid[y][x] < 0));
        e = await turn({ w: 'leurre', c: spot[0], r: spot[1], h: spot[2] }, () => me.decoys.length !== 1 ? "le leurre n'est pas à l'eau" : null);
        if (e) return e;
        // cases d'eau ennemies libres : ni visées, ni mine, ni leurre de l'ordinateur
        const foe = S.enemy, trap = (c, r) => foe.mines.some(m => m[0] === c && m[1] === r) || foe.decoys.some(d => d.cells.some(([x, y]) => x === c && y === r));
        const free = () => waterOf(foe).filter(([c, r]) => !foe.shots[r][c] && !trap(c, r));
        const wc = free()[0]; foe.mines.push(wc.slice()); const hits0 = me.ships.reduce((a, s) => a + s.hits, 0);
        await turn({ w: 'tir', c: wc[0], r: wc[1], h: true });
        if (me.ships.reduce((a, s) => a + s.hits, 0) <= hits0 && S.phase === 'play') return "la mine ennemie ne riposte pas";
        foe.smoke = { c0: 0, r0: 0, left: 2 }; const sc = free().find(([c, r]) => c < 3 && r < 3);
        if (sc && S.phase === 'play') { e = await turn({ w: 'tir', c: sc[0], r: sc[1], h: true }, () => !foe.veil[sc[1]][sc[0]] && S.phase === 'play' ? 'le tir dans la fumée ennemie se voit' : null); if (e) return e; }
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

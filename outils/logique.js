/* Logique des jeux dans Chromium, sans rien toucher (lancé par la CI GitHub ; inutile en local sauf pour
   déboguer : la CI le fait à chaque push) :
   - grilles du jour des 60 prochains jours : Sudoku et Queens (une seule solution, générées vite),
     Pont stellaire (une seule solution), Calculator (20 calculs justes, les mêmes pour tous) ;
   - Lignée : arbres du jour (classique et royal) avec une seule solution ;
   - Alunissage : chaque site de la mission du jour a ses 3 aires et un vent plus faible que les réacteurs ;
   - Injagility Parcours : les 200 premiers parcours se génèrent et leur chemin prévu est praticable ;
   - Picross Dex : chaque dessin se résout ligne par ligne, sans deviner (donc une seule solution) ;
   - Yams : points de chaque case pour des mains connues, bonus de 35 ;
   - accueil : transfert de sauvegarde LUDO1- (exporter, vider, importer : tout revient).
   Serveur local d'abord (racine du dépôt) : python3 -m http.server 8765
   node outils/logique.js [jours]   (code de sortie 1 en cas d'erreur) */
const { BASE, phone } = require('./pw');
const DAYS = Number(process.argv[2]) || 60;
// clés de date AAAAMMJJ des prochains jours (et le jour de la semaine, qui fixe la taille ou le niveau)
const days = n => [...Array(n)].map((_, i) => { const d = new Date(Date.now() + i * 864e5); return { k: d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(), w: d.getDay() }; });

const TESTS = {
  'sudoku/index.html': async (p, D) => p.evaluate(D => {
    const { generate, countSolutions } = window.Sudoku, lvl = [3, 1, 1, 2, 2, 2, 3], out = [];
    for (const { k, w } of D) {
      const t0 = performance.now(), P = generate(9, lvl[w], k * 13 + 5), dt = performance.now() - t0;
      if (countSolutions(9, P.puz, 2) !== 1) out.push(`grille du ${k} : plusieurs solutions`);
      if (P.puz.some((v, i) => v && v !== P.sol[i])) out.push(`grille du ${k} : chiffre donné faux`);
      if (dt > 3000) out.push(`grille du ${k} : ${Math.round(dt)} ms pour la générer`);
    }
    return out;
  }, D),
  'queens/index.html': async (p, D) => p.evaluate(D => {
    const { generate } = window.Queens, SIZE = [9, 5, 6, 7, 7, 8, 9], out = [];
    for (const { k, w } of D) {
      const t0 = performance.now(); let s = k, P = generate(SIZE[w], s);
      while (!P && s < k + 5) P = generate(SIZE[w], ++s);
      const dt = performance.now() - t0;
      if (!P) out.push(`grille du ${k} : pas de grille après 5 graines`);
      else if (dt > 3000) out.push(`grille du ${k} (${SIZE[w]}×${SIZE[w]}) : ${Math.round(dt)} ms pour la générer`);
    }
    return out;
  }, D),
  'pont-stellaire/index.html': async (p, D) => p.evaluate(D => {
    const { generate, solve } = window.PontStellaire, out = [];
    for (const { k } of D.slice(0, 20)) {
      let s = k * 7 + 11, P = generate(9, s);
      while (!P && s < k * 7 + 31) P = generate(9, ++s);
      if (!P) out.push(`ciel du ${k} : pas de grille`);
      else if (solve(P.isl, P.G, 3).count !== 1) out.push(`ciel du ${k} : plusieurs solutions`);
    }
    return out;
  }, D),
  'calculator/index.html': async (p, D) => p.evaluate(D => {
    const { dailySeries } = window.Calculator, out = [];
    const calc = c => c.op === '+' ? c.a + c.b : c.op === '-' ? c.a - c.b : c.op === 'x' ? c.a * c.b : c.a / c.b;
    for (const { k } of D) {
      const s = dailySeries(k);
      if (s.length !== 20) out.push(`calcul du ${k} : ${s.length} calculs au lieu de 20`);
      if (JSON.stringify(s) !== JSON.stringify(dailySeries(k))) out.push(`calcul du ${k} : pas le même à chaque fois`);
      for (const c of s) if (!Number.isInteger(c.res) || c.res !== calc(c)) out.push(`calcul du ${k} : ${c.a} ${c.op} ${c.b} = ${c.res}`);
    }
    return out;
  }, D),
  'lignee/index.html': async (p, D) => p.evaluate(D => {
    const out = [];
    for (const { k } of D) for (const md of 'CR') {
      const code = `${md}2-J${k.toString(36).toUpperCase()}`, g = Engine.generate(Engine.hashStr(code), 2);
      if (!g) out.push(`arbre ${code} : pas d'arbre`);
      else if (Engine.countSolutions(g.P, g.rel, g.clues, g.sexKnown) !== 1) out.push(`arbre ${code} : plusieurs solutions`);
    }
    return out;
  }, D),
  'alunissage/index.html': async (p, D) => p.evaluate(D => {
    const out = [];
    for (const { k } of D) for (let n = 0; n < 20; n++) {
      const s = Alunissage.makeSite(k, n);
      if (s.pads.length !== 3) out.push(`mission du ${k}, site ${n + 1} : ${s.pads.length} aires`);
      if (s.pads.some(q => q.x1 - q.x0 < 16)) out.push(`mission du ${k}, site ${n + 1} : aire trop étroite`);
      if (Math.abs(s.wind) >= SIDE * .9 || s.g >= THRUST * 1.5) out.push(`mission du ${k}, site ${n + 1} : vent ${s.wind}, gravité ${s.g}`);
      if (JSON.stringify(s) !== JSON.stringify(Alunissage.makeSite(k, n))) out.push(`mission du ${k} : pas la même à chaque fois`);
    }
    return out;
  }, D),
  'injagility/parcours.html#test': async p => p.evaluate(() => {
    const out = [], W = 8;
    for (let n = 1; n <= 200; n++) {
      const g = window.__parcours.gen(n); if (!g) { out.push(`parcours ${n} : pas de parcours`); continue; }
      const sol = g.solution;
      if (g.objs.length < 3) out.push(`parcours ${n} : ${g.objs.length} obstacles`);
      sol.forEach((c, i) => { if (i && Math.abs(c % W - sol[i - 1] % W) + Math.abs(Math.floor(c / W) - Math.floor(sol[i - 1] / W)) !== 1) out.push(`parcours ${n} : chemin coupé en ${i}`); });
      if (sol.some(c => g.bushes.has(c) || g.bones.has(c))) out.push(`parcours ${n} : buisson ou os sur le chemin`);
      if (g.objs.some(o => o.cells.some(c => !sol.includes(c)))) out.push(`parcours ${n} : obstacle hors du chemin`);
    }
    return out;
  }),
  'picross/index.html': async p => p.evaluate(() => {
    const { PUZZLES, filled, clueOf } = window.Picross, out = [];
    // une ligne : -1 inconnu, 0 vide, 1 plein ; renvoie ce que les indices imposent (null si impossible)
    function line(l, clue) {
      const n = l.length, can0 = Array(n).fill(false), can1 = Array(n).fill(false), memo = new Map(), seen = new Set();
      const fits = (i, L) => { for (let j = i; j < i + L; j++) if (l[j] === 0) return false; return i + L === n || l[i + L] !== 1; };
      const ok = (i, k) => {   // peut-on placer les blocs k… à partir de la case i ?
        const key = i * 64 + k; if (memo.has(key)) return memo.get(key); let r = false;
        if (k === clue.length) r = l.slice(i).every(v => v !== 1);
        else r = (i < n && l[i] !== 1 && ok(i + 1, k)) || (i + clue[k] <= n && fits(i, clue[k]) && ok(Math.min(n, i + clue[k] + 1), k + 1));
        memo.set(key, r); return r;
      };
      const mark = (i, k) => {
        if (seen.has(i * 64 + k)) return; seen.add(i * 64 + k);
        if (k === clue.length) { for (let j = i; j < n; j++) can0[j] = true; return; }
        if (i < n && l[i] !== 1 && ok(i + 1, k)) { can0[i] = true; mark(i + 1, k); }
        const L = clue[k];
        if (i + L <= n && fits(i, L) && ok(Math.min(n, i + L + 1), k + 1)) { for (let j = i; j < i + L; j++) can1[j] = true; if (i + L < n) { can0[i + L] = true; mark(i + L + 1, k + 1); } }
      };
      if (!ok(0, 0)) return null; mark(0, 0);
      return l.map((v, j) => v !== -1 ? v : can1[j] && !can0[j] ? 1 : can0[j] && !can1[j] ? 0 : -1);
    }
    function solved(art) {
      const H = art.length, W = art[0].length, sol = art.flatMap(r => [...r].map(ch => filled(ch) ? 1 : 0)), g = Array(W * H).fill(-1);
      const rows = [...Array(H).keys()].map(r => [...Array(W).keys()].map(c => r * W + c)), cols = [...Array(W).keys()].map(c => [...Array(H).keys()].map(r => r * W + c));
      for (let change = true; change;) {
        change = false;
        for (const idx of rows.concat(cols)) {
          const s = line(idx.map(i => g[i]), clueOf(idx.map(i => sol[i]))); if (!s) return false;
          idx.forEach((i, j) => { if (s[j] !== g[i]) { g[i] = s[j]; change = true; } });
        }
      }
      return g.every((v, i) => v === sol[i]);
    }
    if (solved(['k.', '.k'])) out.push('le solveur du test ne voit pas un dessin ambigu');
    for (const P of PUZZLES) if (!solved(P.art)) out.push(`${P.id} : il faut deviner (plusieurs solutions possibles)`);
    return out;
  }),
  'yams/index.html': async p => p.evaluate(() => {
    const { calc, totaux } = window.Yams, out = [];
    const cas = [[[1, 1, 1, 2, 3], { u1: 3, u2: 2, brelan: 8, carre: 0, full: 0, petite: 0, chance: 8 }],
      [[6, 6, 6, 6, 2], { u6: 24, brelan: 26, carre: 26, full: 0, yams: 0 }],
      [[3, 3, 5, 5, 5], { full: 25, brelan: 21, carre: 0 }],
      [[4, 4, 4, 4, 4], { yams: 50, full: 25, carre: 20, u4: 20 }],
      [[1, 2, 3, 4, 6], { petite: 30, grande: 0 }], [[2, 3, 4, 5, 6], { petite: 30, grande: 40 }],
      [[3, 4, 1, 6, 5], { petite: 30, grande: 0 }], [[1, 2, 2, 4, 5], { petite: 0 }]];
    for (const [v, att] of cas) for (const [cat, n] of Object.entries(att)) if (calc(cat, v) !== n) out.push(`${cat} de ${v} : ${calc(cat, v)} au lieu de ${n}`);
    const t = totaux({ u1: 3, u2: 6, u3: 9, u4: 12, u5: 15, u6: 18, chance: 20 });
    if (t.haut !== 63 || t.bonus !== 35 || t.total !== 118) out.push(`totaux : ${JSON.stringify(t)}`);
    if (totaux({ u6: 30, u5: 25, u4: 4 }).bonus !== 0) out.push('bonus de 35 donné sous 63');
    return out;
  }),
  'index.html': async p => p.evaluate(() => {
    // des records dans plusieurs jeux, exportés en LUDO1-, effacés, puis réimportés
    const recs = { 'tetris16.best': 1234, 'queens16.best': { 6: 41000 }, 'sudoku.best': { '9-2': 300000 }, 'orbite.stars': { 3: 2 }, 'yams.best': 250, 'escadrille.best': { normal: 12 },
      'odyssee.stars': { '1-2': 3 }, 'nebula.best': 900, 'lunerover.stars': { 4: 3 }, 'amiral.best': { hard: 30 }, 'pontstellaire.best': { 9: 90000 } };
    const A = window.Accueil, keep = { ...localStorage }; localStorage.clear();
    for (const [k, v] of Object.entries(recs)) localStorage.setItem(k, JSON.stringify(v));
    const code = 'LUDO1-' + btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, g: A.collectSaves() }))));
    localStorage.clear(); const out = [];
    const done = A.mergeSaves(A.decodeSaves(' \n' + code + '\n'));
    if (!done.length) out.push('rien importé');
    for (const [k, v] of Object.entries(recs)) if (localStorage.getItem(k) !== JSON.stringify(v)) out.push(`${k} : ${localStorage.getItem(k)} au lieu de ${JSON.stringify(v)}`);
    if (A.mergeSaves(A.decodeSaves(code)).length) out.push('un second import change encore quelque chose');
    try { A.decodeSaves('LUDO1-abc'); out.push('un code abîmé est accepté'); } catch (e) {}
    localStorage.clear(); for (const [k, v] of Object.entries(keep)) localStorage.setItem(k, v);
    return out;
  }),
};

(async () => {
  const { browser, ctx } = await phone(); let fail = 0; const D = days(DAYS);
  await ctx.route(/supabase\.co|fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  for (const [url, test] of Object.entries(TESTS)) {
    const p = await ctx.newPage(), errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + url); await p.waitForTimeout(500);
    try { errs.push(...await test(p, D)); } catch (e) { errs.push(e.message); }
    if (errs.length) { fail++; console.log('ÉCHEC ' + url + '\n  ' + errs.slice(0, 10).join('\n  ')); } else console.log('ok    ' + url);
    await p.close();
  }
  await browser.close(); process.exit(fail ? 1 : 0);
})();

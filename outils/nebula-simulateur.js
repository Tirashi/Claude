/* Nebula : combats joués automatiquement par l'IA de test (window.Nebula.simulate).
   node outils/nebula-simulateur.js [nombre-de-combats] [prudence]
   prudence 4 = joueur attentif qui esquive, 0 = joueur qui ignore les annonces.
   Affiche, par type de combat : victoires, tours, coque perdue, vaisseaux perdus
   (flotte d'escorte neuve : porte-vaisseaux, frégate, chasseur = 32 de coque). */
const { BASE, phone, logErrors } = require('./pw');
const K = Number(process.argv[2]) || 150, risks = process.argv[3] != null ? [Number(process.argv[3])] : [4, 0];
(async () => {
  const { browser, ctx } = await phone(); const p = await ctx.newPage(); logErrors(p);
  await p.goto(BASE + 'nebula/index.html'); await p.waitForTimeout(300);
  console.log(await p.evaluate(([K, risks]) => {
    const N = Nebula, out = [], fleet = [{ uid: 1, t: 'mere', hull: 16, mods: [], name: 'A' }, { uid: 2, t: 'fregate', hull: 10, mods: [], name: 'B' }, { uid: 3, t: 'chasseur', hull: 6, mods: [], name: 'C' }];
    for (const rw of risks) for (const [kind, floor] of [['contact', 1], ['contact', 4], ['contact', 6], ['lourd', 4], ['amiral', 8]]) {
      const r = { won: 0, lost: 0, timeout: 0, fled: 0, turns: 0, dmg: 0, lost2: 0 };
      for (let i = 0; i < K; i++) { const s = N.simulate(i * 7919 + 1, kind, floor, fleet, rw); r[s.result]++; r.turns += s.turns; r.dmg += 32 - s.hull; r.lost2 += s.lost; }
      out.push(`prudence ${rw} · ${kind} étage ${floor} : ${r.won}/${K} victoires · ${(r.turns / K).toFixed(1)} tours · coque perdue ${(r.dmg / K).toFixed(1)} · vaisseaux perdus ${(r.lost2 / K).toFixed(2)}`);
    }
    const a = JSON.stringify(N.makeMap(42)) === JSON.stringify(N.makeMap(42)), b = JSON.stringify(N.makeCombat(7, 'lourd', 4, fleet)) === JSON.stringify(N.makeCombat(7, 'lourd', 4, fleet));
    out.push(`même graine = même carte : ${a ? 'oui' : 'NON'} · même combat : ${b ? 'oui' : 'NON'}`);
    return out.join('\n');
  }, [K, risks]));
  await browser.close();
})();

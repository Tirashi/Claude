/* Pont stellaire : génère des grilles de chaque taille, mesure le temps de génération
   et revérifie l'unicité de la solution avec le solveur du jeu.
   node outils/pont-stellaire-unicite.js [nombre-de-grilles-par-taille] */
const { BASE, phone, logErrors } = require('./pw');
(async () => {
  const n = Number(process.argv[2]) || 30;
  const { browser, ctx } = await phone(); const p = await ctx.newPage(); logErrors(p);
  await p.goto(BASE + 'pont-stellaire/index.html'); await p.waitForTimeout(300);
  const lines = await p.evaluate(n => {
    const { generate, solve } = window.PontStellaire, out = [];
    for (const N of [7, 9, 11]) {
      let tmax = 0, tsum = 0, fails = 0, stars = 0, bad = 0;
      for (let s = 1; s <= n; s++) {
        const t0 = performance.now(), P = generate(N, s * 1000 + N), dt = performance.now() - t0;
        tmax = Math.max(tmax, dt); tsum += dt; if (!P) { fails++; continue; } stars += P.isl.length;
        if (solve(P.isl, P.G, 3).count !== 1) bad++;
      }
      out.push(`${N}×${N} : ${(tsum / n).toFixed(0)} ms en moyenne (max ${tmax.toFixed(0)}), ${(stars / n).toFixed(1)} étoiles, ${fails} échecs, ${bad} non uniques`);
    }
    return out;
  }, n);
  console.log(lines.join('\n')); await browser.close();
})();

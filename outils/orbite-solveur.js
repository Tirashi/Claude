/* Orbite : pour chaque niveau, compte les tirs gagnants (360 angles × 45 puissances)
   et les tirs « robustes » (ceux dont les voisins à ±1° et ±2 % gagnent aussi).
   Un niveau jouable au doigt doit avoir au moins ~8 tirs robustes (début : 25 à 40).
   node outils/orbite-solveur.js            (tous les niveaux)
   node outils/orbite-solveur.js 3,12,30    (quelques niveaux) */
const { BASE, phone, logErrors } = require('./pw');
(async () => {
  const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  const { browser, ctx } = await phone(); const p = await ctx.newPage(); logErrors(p);
  await p.goto(BASE + 'orbite/index.html'); await p.waitForTimeout(300);
  const lines = await p.evaluate(only => {
    const { LEVELS, sim } = window.Orbite, out = [];
    LEVELS.forEach((L, i) => {
      if (only && !only.includes(i + 1)) return;
      const W = {}; let ok = 0, rob = 0; const ex = [];
      for (let a = 0; a < 360; a++) for (let k = 6; k <= 50; k++) if (sim(L, a * Math.PI / 180, k / 50, undefined, false).r === 'win') { W[a + ',' + k] = 1; ok++; }
      for (const key in W) { const [a, k] = key.split(',').map(Number);
        if (W[((a + 1) % 360) + ',' + k] && W[((a + 359) % 360) + ',' + k] && W[a + ',' + (k + 1)] && W[a + ',' + (k - 1)]) { rob++; if (ex.length < 3) ex.push(`${a}°/${k * 2}%`); } }
      out.push(`niveau ${i + 1} : ${ok} tirs gagnants, ${rob} robustes  ex. ${ex.join(' ')}`);
    });
    return out;
  }, only);
  console.log(lines.join('\n')); await browser.close();
})();

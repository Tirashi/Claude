/* Lune-Rover, sous Node : chaque niveau est gagné par sa solution de référence (qui respecte
   le palier du niveau) ; pour les paliers sans répétition, la solution est la plus courte
   (recherche en largeur sur les positions du rover).
   node outils/lune-rover-niveaux.js       Code de sortie 1 si un niveau ne va pas. */
const R = require('../lune-rover/regles.js');
let fail = 0;
function shortest(L) {           // nombre minimal d'instructions simples (A G D S R)
  const M = R.roverMap(L), all = (1 << M.crystals.length) - 1, idx = new Map(M.crystals.map(([x, y], i) => [x + ',' + y, i]));
  const key = (x, y, d, m) => [x, y, d, m].join(',');
  let cur = [[...M.start, 0]], seen = new Set([key(...M.start, 0)]);
  for (let n = 1; n < 60 && cur.length; n++) {
    const next = [];
    for (const [x, y, d, m] of cur) for (const op of R.ROVER_TIERS[L.t].ops.replace('F', '')) {
      let nx = x, ny = y, nd = d, nm = m;
      if (op === 'G') nd = (d + 3) % 4; else if (op === 'D') nd = (d + 1) % 4;
      else if (op === 'R') { const i = idx.get(x + ',' + y); if (i == null || m >> i & 1) continue; nm = m | 1 << i; if (nm === all) return n; }
      else { const k = op === 'S' ? 2 : 1, [dx, dy] = R.ROVER_DIRS[d];
        if (k === 2 && '#X'.includes(R.roverTile(M, x + dx, y + dy))) continue;
        nx = x + dx * k; ny = y + dy * k; if (R.roverTile(M, nx, ny) !== '.') continue; }
      const kk = key(nx, ny, nd, nm); if (!seen.has(kk)) { seen.add(kk); next.push([nx, ny, nd, nm]); }
    }
    cur = next;
  }
  return Infinity;
}
R.ROVER_LEVELS.forEach((L, i) => {
  const P = R.roverParse(L.sol), res = R.roverRun(L, P), size = R.roverSize(P), sh = shortest(L);
  const errs = [];
  if (!R.roverAllowed(L, P)) errs.push('solution hors palier');
  if (res.r !== 'win') errs.push(`solution : ${res.r} après ${res.steps.length} pas, ${res.left} cristaux restants`);
  if (L.t < 2 && sh !== size) errs.push(`plus court possible : ${sh} (solution ${size})`);
  if (sh === Infinity) errs.push('impossible avec des instructions simples');
  if (R.roverMap(L).crystals.length === 0) errs.push('aucun cristal');
  console.log(`${errs.length ? 'ÉCHEC' : 'ok   '} niveau ${String(i + 1).padStart(2)} palier ${L.t} : ${size} instructions (${sh} pas simples, ${res.steps.length} pas joués)${errs.length ? ' — ' + errs.join(' ; ') : ''}`);
  fail += errs.length;
});
process.exit(fail ? 1 : 0);

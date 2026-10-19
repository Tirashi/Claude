/* Le Magasinier, sous Node : chaque niveau de magasinier/niveaux.js se lit, et sa solution notée (sol) le gagne
   en autant de coups que l'optimum noté (opt, qui sert aux étoiles). Rapide : lancé par verifications.js.
   node outils/magasinier-solveur.js             Code de sortie 1 si un niveau ne va pas.
   node outils/magasinier-solveur.js --optimum   refait aussi la recherche en largeur pour vérifier que opt est le minimum (~10 s)
   node outils/magasinier-solveur.js -v          affiche les optimums trouvés. */
const R = require('../magasinier/regles.js'), { MAG_NIVEAUX, MAG_ENTREPOTS } = require('../magasinier/niveaux.js');
const verbeux = process.argv.includes('-v'), complet = process.argv.includes('--optimum') || verbeux;
let fail = 0;
const total = MAG_ENTREPOTS.reduce((s, e) => s + e.n, 0);
if (total !== MAG_NIVEAUX.length) { console.log(`entrepôts : ${total} niveaux annoncés pour ${MAG_NIVEAUX.length}`); fail++; }
MAG_NIVEAUX.forEach((L, i) => {
  let N; try { N = R.magLire(L.plan); } catch (e) { console.log(`niveau ${i + 1} : ${e.message}`); fail++; return; }
  if (N.w > 9 || N.h > 11) { console.log(`niveau ${i + 1} : ${N.w}×${N.h}, trop grand (9×11 au plus)`); fail++; }
  // la solution notée, rejouée coup par coup, gagne en opt coups
  let E = { d: N.depart.d, c: N.depart.c };
  for (const d of L.sol) { const r = R.magCoup(N, E, d); if (!r) { console.log(`niveau ${i + 1} : coup refusé dans la solution`); fail++; return; } E = r.E; }
  if (!R.magGagne(N, E)) { console.log(`niveau ${i + 1} : la solution ne gagne pas`); fail++; }
  if (L.sol.length !== L.opt) { console.log(`niveau ${i + 1} : solution en ${L.sol.length} coups, optimum noté ${L.opt}`); fail++; }
  if (!complet) return;
  const s = R.magResoudre(N);
  if (!s || s.coups !== L.opt) { console.log(`niveau ${i + 1} : optimum ${s ? s.coups : '?'} coups, noté ${L.opt}`); fail++; }
  if (verbeux && s) console.log(`niveau ${i + 1} : ${s.coups} coups (${s.etats} états)`);
});
if (!fail) console.log(`ok    Le Magasinier : les ${MAG_NIVEAUX.length} niveaux sont gagnés par leur solution${complet ? ', qui est la plus courte' : ''}`);
process.exit(fail ? 1 : 0);

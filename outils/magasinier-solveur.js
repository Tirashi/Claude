/* Le Magasinier, sous Node : chaque niveau de magasinier/niveaux.js se lit, et sa solution notée (sol) le gagne
   en autant de coups que l'optimum noté (opt, qui sert aux étoiles). Rapide : lancé par verifications.js.
   node outils/magasinier-solveur.js             Code de sortie 1 si un niveau ne va pas.
   node outils/magasinier-solveur.js --optimum   refait aussi la recherche en largeur pour vérifier que opt est le minimum,
                                                 et contrôle 60 grilles du jour au lieu de 3 (~40 s)
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
// grilles du jour : les prochains jours (3 en mode rapide, 60 avec --optimum) se lisent et ont l'optimum annoncé, entre 25 et 90 coups
const J = complet ? 60 : 3, d0 = new Date();
for (let i = 0; i < J; i++) {
  const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + i), j = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const g = R.magGrilleDuJour(j), N = R.magLire(g.plan), s = R.magResoudre(N, 3e6);
  if (N.w > 9 || N.h > 11) { console.log(`grille du ${j} : trop grande`); fail++; }
  if (!s || s.coups !== g.opt || g.opt < 25 || g.opt > 90) { console.log(`grille du ${j} : optimum ${s ? s.coups : '?'} pour ${g.opt} annoncé`); fail++; }
  if (JSON.stringify(R.magGrilleDuJour(j)) !== JSON.stringify(g)) { console.log(`grille du ${j} : deux tirages différents`); fail++; }
}
if (!fail) console.log(`ok    Le Magasinier : les ${MAG_NIVEAUX.length} niveaux sont gagnés par leur solution${complet ? ', qui est la plus courte' : ''} ; grilles du jour valides (${J} jours)`);
process.exit(fail ? 1 : 0);

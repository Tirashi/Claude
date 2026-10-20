/* Capitaine du port, sous Node : chaque bassin de capitaine-du-port/niveaux.js se lit, et sa solution notée (sol)
   le gagne en autant de coups que l'optimum noté (opt, qui sert aux étoiles). Rapide : lancé par verifications.js.
   node outils/capitaine-solveur.js             Code de sortie 1 si un bassin ne va pas.
   node outils/capitaine-solveur.js --optimum   refait aussi la recherche en largeur pour vérifier que opt est le minimum. */
const R = require('../capitaine-du-port/regles.js'), { CAP_PORTS, CAP_NIVEAUX } = require('../capitaine-du-port/niveaux.js');
const complet = process.argv.includes('--optimum');
let fail = 0;
const total = CAP_PORTS.reduce((s, p) => s + p.n, 0);
if (total !== CAP_NIVEAUX.length) { console.log(`ports : ${total} bassins annoncés pour ${CAP_NIVEAUX.length}`); fail++; }
CAP_NIVEAUX.forEach((L, i) => {
  let N; try { N = R.capLire(L); } catch (e) { console.log(`bassin ${i + 1} : ${e.message}`); fail++; return; }
  if (N.w !== 6 && N.w !== 7) { console.log(`bassin ${i + 1} : ${N.w} × ${N.w} (6 ou 7 attendu)`); fail++; }
  let v = R.capDepart(N);
  if (R.capGagne(N, v)) { console.log(`bassin ${i + 1} : déjà gagné au départ`); fail++; }
  const sol = R.capSolLire(L.sol);
  for (const [b, p] of sol) { const r = R.capCoup(N, v, b, p); if (!r) { console.log(`bassin ${i + 1} : coup ${b}:${p} refusé dans la solution`); fail++; return; } v = r; }
  if (!R.capGagne(N, v)) { console.log(`bassin ${i + 1} : la solution ne gagne pas`); fail++; }
  if (sol.length !== L.opt) { console.log(`bassin ${i + 1} : solution en ${sol.length} coups, optimum noté ${L.opt}`); fail++; }
  if (!complet) return;
  const s = R.capResoudre(N);
  if (!s || s.coups !== L.opt) { console.log(`bassin ${i + 1} : optimum ${s ? s.coups : '?'} coups, noté ${L.opt}`); fail++; }
});
if (!fail) console.log(`ok    Capitaine du port : les ${CAP_NIVEAUX.length} bassins sont gagnés par leur solution${complet ? ', qui est la plus courte' : ''}`);
process.exit(fail ? 1 : 0);

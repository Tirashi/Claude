/* Capitaine du port, sous Node : fabrique les bassins d'un port (regles.js : capGenerer), un par optimum visé,
   et les écrit au format de capitaine-du-port/niveaux.js, avec leur solution la plus courte.
   node outils/capitaine-generateur.js <port 1 à 5> [graine] [--cibles 28,30] [--essais 600]   (1 pêche, 2 commerce, 3 marina, 4 chantier, 5 grand port)
   Les bassins choisis sont ensuite collés dans niveaux.js (ils ne changent plus). */
const R = require('../capitaine-du-port/regles.js');
const PORTS = {
  1: { cibles: [3, 4, 5, 6, 7, 8, 8, 9, 10, 11, 12, 12], o: { w: 6, sorties: [1, 2, 3, 4], bateaux: [5, 8], p3: .2, p4: 0 } },
  2: { cibles: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20], o: { w: 6, sorties: [1, 2, 3, 4], bateaux: [9, 12], p3: .45, p4: 0 } },
  3: { cibles: [12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24], o: { w: 6, sorties: [1, 2, 3, 4], bateaux: [9, 12], fixes: [1, 3], p3: .4, p4: 0 } },
  4: { cibles: [15, 16, 17, 18, 19, 20, 21, 22, 24, 25, 26, 28], o: { w: 6, sorties: [1, 2, 3, 4], bateaux: [8, 11], p3: .35, p4: .15 }, quatre: true },
  5: { cibles: [20, 22, 24, 25, 27, 28, 30, 32, 34, 36, 38, 40], o: { w: 7, sorties: [1, 2, 3, 4, 5], bateaux: [11, 15], fixes: [0, 2], p3: .35, p4: .1, maxEtats: 250000 } },
};
// un bassin par optimum visé ; après ESSAIS essais sans l'optimum exact, on garde le plus proche
const port = PORTS[process.argv[2] || 1], vus = new Set();
// options : --cibles 28,30 (seulement ces optimums, pour lancer plusieurs processus en parallèle) ; --essais 600
const opt = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
if (opt('--cibles')) port.cibles = opt('--cibles').split(',').map(Number);
const ESSAIS = Number(opt('--essais')) || 1500;
let graine = Number(process.argv[3] || 1);
for (const c of port.cibles) {
  let meilleur = null;
  for (let essai = 0; essai < ESSAIS && !(meilleur && meilleur.opt === c); essai++) {
    const r = R.capHasard(graine++), o = Object.assign({}, port.o, { min: Math.max(1, c - 8), max: c });
    o.bateaux = o.bateaux[0] + Math.floor(r() * (o.bateaux[1] - o.bateaux[0] + 1));
    if (o.fixes) o.fixes = o.fixes[0] + Math.floor(r() * (o.fixes[1] - o.fixes[0] + 1));
    const g = R.capGenerer(r, o);
    if (!g || vus.has(g.plan.join('/'))) continue;
    const N = R.capLire(g);
    if (port.quatre && !N.bateaux.some(b => b.n === 4)) continue;
    if (port.o.fixes && port.o.fixes[0] && !N.fixes.length) continue;
    if (!meilleur || Math.abs(g.opt - c) < Math.abs(meilleur.opt - c)) meilleur = g;
  }
  if (!meilleur) { console.error(`aucun bassin trouvé pour ${c} coups`); continue; }
  const s = R.capResoudre(R.capLire(meilleur));
  console.error(`${c} visé : ${s.coups}`);
  vus.add(meilleur.plan.join('/'));
  console.log(`  { plan: [${meilleur.plan.map(l => `'${l}'`).join(', ')}], sortie: ${meilleur.sortie}, opt: ${s.coups}, sol: '${R.capSolTexte(s.sol)}' },`);
}

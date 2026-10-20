/* Capitaine du port, sous Node : fabrique les bassins d'un port (regles.js : capGenerer), un par optimum visé,
   et les écrit au format de capitaine-du-port/niveaux.js, avec leur solution la plus courte.
   node outils/capitaine-generateur.js 1     (port 1 : pêche)     node outils/capitaine-generateur.js 2   (port 2 : commerce)
   Les bassins choisis sont ensuite collés dans niveaux.js (ils ne changent plus). */
const R = require('../capitaine-du-port/regles.js');
const PORTS = {
  1: { cibles: [3, 4, 5, 6, 7, 8, 8, 9, 10, 11, 12, 12], o: { w: 6, sorties: [1, 2, 3, 4], bateaux: [5, 8], p3: .2, p4: 0 } },
  2: { cibles: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 20], o: { w: 6, sorties: [1, 2, 3, 4], bateaux: [9, 12], p3: .45, p4: 0 } },
};
const port = PORTS[process.argv[2] || 1], vus = new Set();
let graine = Number(process.argv[3] || 1);
for (const c of port.cibles) {
  for (;;) {
    const r = R.capHasard(graine++), o = Object.assign({}, port.o, { min: c, max: c });
    o.bateaux = o.bateaux[0] + Math.floor(r() * (o.bateaux[1] - o.bateaux[0] + 1));
    const g = R.capGenerer(r, o);
    if (!g || vus.has(g.plan.join('/'))) continue;
    const s = R.capResoudre(R.capLire(g));
    if (!s || s.coups !== c) continue;
    vus.add(g.plan.join('/'));
    console.log(`  { plan: [${g.plan.map(l => `'${l}'`).join(', ')}], sortie: ${g.sortie}, opt: ${s.coups}, sol: '${R.capSolTexte(s.sol)}' },`);
    break;
  }
}

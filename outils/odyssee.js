/* Odyssée, sous Node : chaque plateau se lit sans erreur et le pilote automatique le traverse
   sans naufrage (au moins 3 fois sur 5 avec des flèches ou des rochers), sous le temps cible
   (3 étoiles possibles) ; plusieurs graines pour les dangers ; plateaux du jour (miroir) faisables.
   node outils/odyssee.js [plateau] [dessin]   ex. : node outils/odyssee.js 3-2 dessin
   Code de sortie 1 si un plateau ne va pas. */
const O = require('../odyssee/regles.js');
const [seul, dessin] = process.argv.slice(2);
const GRAINES = [1, 2, 3, 4, 5];
let fail = 0;
for (const P of O.PLATEAUX) {
  if (seul && P.id !== seul) continue;
  const errs = P.map.erreurs.slice(), runs = GRAINES.map(g => O.simuler(P, g, 180));
  // sans danger, le pilote ne doit jamais sombrer ; avec des flèches ou des rochers, au moins 3 traversées sur 5 sans naufrage
  const dangers = !!(P.fleches || P.rochers), propres = runs.filter(r => r.fini && !r.naufrages);
  for (const [i, r] of runs.entries()) {
    if (!r.fini) errs.push(`graine ${GRAINES[i]} : pas arrivé (bloqué en ${r.st.x.toFixed(1)},${r.st.y.toFixed(1)}, point ${r.st.wp})`);
    else if (r.naufrages && !dangers) errs.push(`graine ${GRAINES[i]} : ${r.naufrages} naufrage(s) (${r.st.cause})`);
  }
  if (propres.length < (dangers ? 3 : runs.length)) errs.push(`seulement ${propres.length} traversées sur ${runs.length} sans naufrage`);
  const tMax = Math.max(...propres.map(r => r.t)), conseil = Math.ceil(tMax * 1.3 + 3);
  if (!(P.cible >= tMax + 1)) errs.push(`temps cible ${P.cible} s trop court (pilote ${tMax.toFixed(1)} s ; conseil ${conseil})`);
  else if (P.cible > tMax * 1.6 + 5) errs.push(`temps cible ${P.cible} s trop large (conseil ${conseil})`);
  console.log(`${errs.length ? 'ÉCHEC' : 'ok   '} ${P.id} ${P.map.W}×${P.map.H} ${P.nom} : pilote ${runs.map(r => r.t.toFixed(1) + (r.naufrages ? '(' + r.naufrages + ')' : '')).join(' / ')} s, cible ${P.cible} s${errs.length ? '\n        ' + errs.join('\n        ') : ''}`);
  fail += errs.length;
  if (dessin) {     // la carte avec la trace du pilote (graine 1)
    const st = O.nouvelle(P, 1), g = P.carte.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split(''));
    while (!st.fini && st.t < 180) { O.pas(st, O.pilote(st), 1 / 60); const r = g[2 * Math.floor(st.y) + 1], c = 2 * Math.floor(st.x) + 1; if (r && r[c] === '.') r[c] = '·'; }
    console.log(g.map(r => '   ' + r.join('').replace(/\./g, ' ').replace(/·/g, 'o')).join('\n'));
  }
}
// plateau du jour : chaque plateau du tirage, retourné gauche-droite, reste faisable
if (!seul) {
  const ko = O.POOL_JOUR().filter(P => { const Q = O.variante(P, true, false, 'v'); return Q.map.erreurs.length || [1, 2, 3].some(g => !O.simuler(Q, g, 180).fini); }).map(P => P.id);
  console.log(`${ko.length ? 'ÉCHEC' : 'ok   '} plateau du jour : les ${O.POOL_JOUR().length} plateaux du tirage, en miroir, sont faisables${ko.length ? ' — sauf ' + ko.join(', ') : ''}`);
  fail += ko.length;
}
// étoiles
const P = O.PLATEAUX[0];
if (O.etoiles(P, P.cible, 0) !== 3 || O.etoiles(P, P.cible + 1, 0) !== 2 || O.etoiles(P, 1, 1) !== 1) { console.log('ÉCHEC étoiles'); fail++; }
process.exit(fail ? 1 : 0);

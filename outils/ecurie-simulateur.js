/* Écurie miniature : contrôle des règles et de la simulation de course sous Node (lancé par verifications.js).
   node outils/ecurie-simulateur.js            → contrôles (circuits fermés, courses finies et reproductibles, une saison sans NaN)
   node outils/ecurie-simulateur.js equilibre  → place moyenne selon la division et l'équipement (12 saisons chacune) */
const path = require('path');
for (const f of ['circuit', 'course', 'regles']) require(path.join(__dirname, '..', 'ecurie', f + '.js'));
const {Circuits, Course, Regles} = globalThis;
const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
let pb = 0; const non = m => { console.error('ÉCHEC ' + m); pb++; };
function saison(E, rng) { const places = []; let fin = null;
  for (let g = 0; g < Regles.GP_SAISON; g++) { const p = Regles.preparer(E), C = Course.finir(Course.creer(Circuits.get(p.circuit), p.grille, {rng}));
    C.ordre.forEach((v, i) => { if (v.joueur) places.push(i + 1); }); const b = Regles.resultats(E, C, p); if (b.fin) fin = b.fin; }
  return {places, fin}; }
if (process.argv[2] === 'equilibre') {
  for (const [div, voit, pieces] of [[0, null, false], [0, 5, true], [1, null, false], [1, 7, false], [2, 9, false]]) {
    const rangs = [], pl = []; for (let s = 0; s < 12; s++) { const E = Regles.nouvellePartie(); E.division = div; E.signes = [0, 1];
      if (voit != null) E.parc.forEach(x => { x.v = voit; if (pieces) x.pieces = {freins: true, aileron: true, allegement: true}; });
      const r = saison(E, rnd(100 + s)); rangs.push(r.fin.rang); pl.push(...r.places); }
    const m = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
    console.log(`division ${div}, voiture ${voit == null ? 'de départ' : Regles.VOITURES[voit].nom}${pieces ? ' + pièces' : ''} : rang ${m(rangs)}, place moyenne ${m(pl)}`); }
  process.exit(0);
}
// 1. circuits fermés
for (const c of Circuits.LISTE) { const K = Circuits.get(c.k); if (!K.ferme) non('circuit ' + c.k + ' pas fermé'); if (!(K.TOT > 300)) non('circuit ' + c.k + ' trop court'); }
// 2. une course finit, tout le monde est classé, et elle est reproductible avec la même graine
const E0 = Regles.nouvellePartie(), p0 = Regles.preparer(E0);
const course = () => Course.finir(Course.creer(Circuits.get('ville'), p0.grille, {rng: rnd(42)}));
const A = course(), B = course();
if (!A.fin) non('course pas finie');
if (A.ordre.length !== 8 || new Set(A.ordre).size !== 8) non('classement incomplet');
if (A.ordre.map(v => v.nom).join() !== B.ordre.map(v => v.nom).join() || A.t !== B.t) non('course pas reproductible');
if (A.arrivee.some((v, i) => i && v.temps < A.arrivee[i - 1].temps)) non('ordre d\'arrivée faux');
// 3. une saison entière sans valeur absurde
const E = Regles.nouvellePartie(); E.signes = [0, 2]; const r = saison(E, rnd(7));
const nombres = [E.argent, E.fans, E.rep, ...E.parc.map(x => x.etat)]; if (nombres.some(n => !Number.isFinite(n))) non('valeur non finie dans la partie');
if (!r.fin || E.saison !== 2 || E.gp !== 0) non('fin de saison pas appliquée');
if (JSON.parse(JSON.stringify(E)).parc.length !== E.parc.length) non('partie pas sauvegardable');
if (pb) process.exit(1); console.log('ok : circuits, course reproductible, saison complète');

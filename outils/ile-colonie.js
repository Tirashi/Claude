/* La colonie, pilote automatique sous Node (pas besoin du serveur) : joue des parties complètes avec une
   stratégie simple (postes réglés chaque semaine selon les besoins, chantiers près de l'épave, recherche
   dans un ordre fixe) et donne les années tenues, la population, le score. Pour régler la difficulté.
   node outils/ile-colonie.js [parties] [années max] [graine de départ] [détail]   */
const R = require('../ile/regles.js');
const [N = 20, YMAX = 8, SEED0 = 1000, VERB = 0] = process.argv.slice(2).map(Number);
const RESEARCH = ['champ', 'puits', 'entrepot', 'grenier', 'scierie', 'chasseur', 'tailleur', 'forge', 'elevage', 'bibliotheque', 'guerisseur', 'tour', 'taverne', 'port', 'digue'];

function near(run, type) {
  const [wx, wy] = R.isleOf(run).wreck; let best = null, bd = 1e9;
  for (let y = 0; y < R.MH; y++) for (let x = 0; x < R.MW; x++) {
    const o = R.buildOptions(run, x, y).find(([k, why]) => k === type && !why); if (!o) continue;
    let d = Math.hypot(x - wx, y - wy);
    if (type === 'bucheron') d -= R.woodAround(run, { x, y }) / 20;
    if (type === 'carriere' && R.onFilon(run, { x, y })) d -= 10;
    if (d < bd) { bd = d; best = [x, y]; }
  }
  return best;
}
function build(run, type) { const p = near(run, type); return p ? R.placeBuilding(run, type, p[0], p[1]) : null; }
const n = (run, type) => run.B.filter(b => b.type === type || b.target === type).length;

function plan(run) {
  const d = R.dateOf(run), pop = run.C.length, h = R.housing(run);
  for (const k of RESEARCH) if (R.researchState(run, k) === 'pret') R.research(run, k);
  const sites = run.B.filter(b => !b.done).length;
  if (sites < 2) {
    const want = [];
    if (!n(run, 'ecole')) want.push('ecole');
    if (n(run, 'pecherie') < 1 + (pop > 12)) want.push('pecherie');
    if (n(run, 'cueilleur') < 1 + (pop > 14)) want.push('cueilleur');
    if (n(run, 'bucheron') < 1 + (pop > 10)) want.push('bucheron');
    if (h.beds < pop + 3) want.push('habitation');
    if (n(run, 'carriere') < 1) want.push('carriere');
    if (R.unlocked(run, 'champ') && n(run, 'champ') < Math.ceil(pop / 6)) want.push('champ');
    for (const k of ['puits', 'grenier', 'entrepot', 'scierie', 'chasseur', 'tailleur', 'forge', 'elevage', 'bibliotheque', 'guerisseur', 'taverne', 'port'])
      if (R.unlocked(run, k) && !n(run, k)) want.push(k);
    for (const k of want) { if (run.B.filter(b => !b.done).length >= 2) break; build(run, k); }
  }
  // postes : tout le monde libre, puis on remplit par ordre de besoin
  run.C.forEach(c => { c.post = null; });
  const fill = (b, k = 9) => { for (let i = 0; i < k; i++) if (!R.addWorker(run, b)) break; };
  const done = t => run.B.filter(b => b.done && b.type === t);
  const foodOk = () => { const f = R.forecast(run); return f.foodIn >= f.eat + 2 + (d.season === 2 ? 8 : 0) || R.foodTotal(run) > f.eat * 10; };
  run.B.filter(b => !b.done).forEach(b => fill(b, 2));
  for (const t of d.season === 0 || d.season === 2 ? ['champ', 'pecherie', 'port', 'cueilleur', 'chasseur', 'elevage'] : ['pecherie', 'port', 'cueilleur', 'chasseur', 'elevage'])
    for (const b of done(t)) { if (foodOk() && t !== 'champ') break; fill(b); }
  done('bucheron').forEach(b => fill(b, d.season >= 2 || run.res.bois < 40 ? 2 : 1));
  done('ecole').forEach(b => fill(b, 2)); done('bibliotheque').forEach(b => fill(b));
  if (run.target) fill('ecl', 1);
  for (const t of ['tailleur', 'forge', 'scierie', 'taverne', 'guerisseur', 'carriere', 'pecherie', 'cueilleur', 'bucheron']) done(t).forEach(b => fill(b));
}

const out = [];
for (let g = 0; g < N; g++) {
  const run = R.newRun(SEED0 + g); let why = '';
  while (!run.over && R.yearsHeld(run) < YMAX) {
    plan(run); const { rep } = R.endWeek(run);
    if (VERB) rep.forEach(([, , t, d]) => console.log(`  ${run.turn} ${t} — ${d}`));
    const bad = Object.entries(run.res).find(([, v]) => !Number.isFinite(v) || v < 0); if (bad) { why = 'ressource invalide ' + bad; break; }
  }
  if (!R.migrate(JSON.parse(JSON.stringify(run)))) why += ' migrate refuse la partie';
  if (VERB) console.log(JSON.stringify(run.res), run.unlocked.join(","), run.B.filter(b=>b.done).map(b=>b.type).join(","));
  out.push({ seed: SEED0 + g, years: R.yearsHeld(run), pop: run.C.length, max: run.stats.maxPop, score: R.scoreOf(run), happy: run.happy, left: run.stats.left, built: run.stats.built, sci: run.unlocked.length, why });
}
out.forEach(o => console.log(`graine ${o.seed} : ${o.years} ans, ${o.pop} colons (max ${o.max}), ${o.built} bâtiments, ${o.sci} plans, bonheur ${o.happy}, ${o.left} départs, score ${o.score}${o.why ? ' — ' + o.why : ''}`));
const avg = k => (out.reduce((a, o) => a + o[k], 0) / out.length).toFixed(1);
console.log(`moyenne : ${avg('years')} ans, ${avg('max')} colons au maximum, score ${avg('score')} ; colonies vides : ${out.filter(o => !o.pop).length}/${out.length}`);
if (out.some(o => o.why)) process.exit(1);

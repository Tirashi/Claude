/* Nebula : force de différentes flottes de départ (parties complètes de l'IA de test, joueur attentif).
   node outils/nebula-flottes.js [nombre-de-parties] [vaisseau,vaisseau,…]…   (specs/nebula.md § 21 et 22)
   Sans composition : les 3 modèles et quelques flottes de 9 à 10 points de flotte. */
const N = require('../nebula/regles.js');
const K = Number(process.argv[2]) || 40;
const COMPOS = {};
for (const f of N.FLEETS) COMPOS[f.id] = f.ships;
if (process.argv.length > 3) for (const c of process.argv.slice(3)) COMPOS[c] = c.split(',');
else Object.assign(COMPOS, {
  'frégate+2 chasseurs': ['fregate', 'chasseur', 'chasseur'], '3 chasseurs+éclaireur': ['chasseur', 'chasseur', 'chasseur', 'eclaireur'],
  '2 chasseurs+bombardier+drones': ['chasseur', 'chasseur', 'bombardier', 'drones'], 'frégate+chasseur+bombardier+éclaireur': ['fregate', 'chasseur', 'bombardier', 'eclaireur'],
  'artilleur+2 chasseurs': ['artilleur', 'chasseur', 'chasseur'], '2 chasseurs': ['chasseur', 'chasseur'],
});
function autoRun(seed, ships) {
  const run = N.newRun(seed, ships, ['eclaireur', 'convoyeur', 'artilleur', 'cuirasse', 'atelier', 'brouilleur', 'mouilleur']);
  for (let step = 0; step < 600 && run.phase !== 'end'; step++) {
    if (run.phase === 'map') { const next = N.nextNodes(run), hurt = run.fleet.reduce((a, f) => a + f.hull, 0) / run.fleet.reduce((a, f) => a + N.TYPES[f.t].hull, 0);
      const pref = n => (n.k === 'comptoir' || n.k === 'dock') ? (hurt < .8 ? 0 : 2) : n.k === 'lourd' ? (hurt > .85 ? 1 : 3) : 1; N.jump(run, next.sort((a, b) => pref(a) - pref(b))[0].id); }
    else if (run.phase === 'combat') { let n = 0; while (!run.combat.result && n++ < 40) N.autoTurn(run.combat, 4); if (!run.combat.result) run.combat.result = 'lost'; N.finishCombat(run); }
    else if (run.phase === 'reward') { while (run.stock.length && run.fleet.some(f => N.install(run, f.uid, run.stock[0]))); N.afterReward(run); }
    else if (run.phase === 'shop') { N.buy(run, 'ship'); N.buy(run, 'pilot'); N.buy(run, 'repair'); for (let i = 0; i < 3; i++) N.buy(run, 'mod', i); while (run.stock.length && run.fleet.some(f => N.install(run, f.uid, run.stock[0]))); run.phase = 'map'; }
    else if (run.phase === 'dock') N.dock(run, 'repair');
    else if (run.phase === 'event') { const ev = N.eventById(run.event.id); N.resolveEvent(run, ev.choices.findIndex(c => N.canChoose(run, c))); N.closeEvent(run); }
    while (run.crew && run.crew.length && run.fleet.some(f => !f.pilot)) N.assignPilot(run, run.fleet.find(f => !f.pilot).uid, 0);
  }
  return run;
}
for (const [name, ships] of Object.entries(COMPOS)) {
  let wins = 0, sec = 0, score = 0; const t0 = Date.now();
  for (let i = 0; i < K; i++) { const r = autoRun(1000 + i * 7919, ships); if (r.victory) wins++; sec += r.sectorsDone; score += N.scoreOf(r); }
  console.log(`${(name + ' (' + N.fleetCost(ships) + ' pts, +' + Math.round(N.primeOf(ships) * 100) + ' %)').padEnd(46)} victoires ${String(wins).padStart(2)}/${K} · secteurs ${(sec / K).toFixed(2)} · score moyen ${Math.round(score / K)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

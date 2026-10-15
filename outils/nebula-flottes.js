/* Nebula : force de différentes flottes de départ (parties complètes de l'IA de test, joueur attentif).
   node outils/nebula-flottes.js [nombre-de-parties]   (specs/nebula.md § 21) */
const N = require('../nebula/regles.js');
const K = Number(process.argv[2]) || 40;
const COMPOS = {
  escorte: ['mere', 'fregate', 'chasseur'], choc: ['cuirasse', 'bombardier', 'chasseur'], marchande: ['convoyeur', 'fregate', 'chasseur', 'eclaireur'],
  '2 chasseurs': ['chasseur', 'chasseur'], '4 chasseurs': ['chasseur', 'chasseur', 'chasseur', 'chasseur'], '3 bombardiers': ['bombardier', 'bombardier', 'bombardier'],
  '3 frégates': ['fregate', 'fregate', 'fregate'], 'cuirassé seul': ['cuirasse'], 'cuirassé+frégate+chasseur': ['cuirasse', 'fregate', 'chasseur'],
  'porte-v.+égide+chasseur': ['mere', 'egide', 'chasseur'], 'atelier+artilleur+chasseur': ['atelier', 'artilleur', 'chasseur'], 'frégate+chasseur': ['fregate', 'chasseur'],
};
for (const [name, ships] of Object.entries(COMPOS)) if (!N.FLEETS.find(f => f.id === name)) N.FLEETS.push({ id: name, name, ships, desc: '', cr: name === 'marchande' ? 100 : 0 });
function autoRun(seed, fid) {
  const run = N.newRun(seed, fid, ['eclaireur', 'convoyeur', 'artilleur', 'cuirasse', 'atelier']);
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
for (const [name] of Object.entries(COMPOS)) {
  let wins = 0, sec = 0, score = 0; const t0 = Date.now();
  for (let i = 0; i < K; i++) { const r = autoRun(1000 + i * 7919, name); if (r.victory) wins++; sec += r.sectorsDone; score += N.scoreOf(r); }
  console.log(`${name.padEnd(28)} victoires ${String(wins).padStart(2)}/${K} · secteurs ${(sec / K).toFixed(2)} · score moyen ${Math.round(score / K)} (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
}

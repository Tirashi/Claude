/* Nebula : parties complètes (3 secteurs) jouées par l'IA de test, sans navigateur. Où la flotte tombe-t-elle ?
   node outils/nebula-parties.js [nombre-de-parties] [prudence]   (prudence 4 = joueur attentif, 0 = ignore les annonces)
   Choix de route simple : comptoir ou dock si la flotte est abîmée, contact lourd si elle est en forme ;
   au comptoir : recrue, réparations, modules. Sert à régler la difficulté des secteurs (specs/nebula.md § 19). */
const N = require('../nebula/regles.js');
const Kr = Number(process.argv[2]) || 60, prud = process.argv[3] != null ? Number(process.argv[3]) : 4;
function autoRun(seed) {
  const run = N.newRun(seed, 'escorte'); const lost = { 1: [], 2: [], 3: [] };
  for (let step = 0; step < 600 && run.phase !== 'end'; step++) {
    if (run.phase === 'map') {
      // choisit la balise suivante : comptoir/dock si la flotte est abîmée, sinon un contact
      const next = N.nextNodes(run), hurt = run.fleet.reduce((a, f) => a + f.hull, 0) / run.fleet.reduce((a, f) => a + N.TYPES[f.t].hull, 0);
      const pref = n => (n.k === 'comptoir' || n.k === 'dock') ? (hurt < .8 ? 0 : 2) : n.k === 'lourd' ? (hurt > .85 ? 1 : 3) : 1;
      N.jump(run, next.sort((a, b) => pref(a) - pref(b))[0].id);
    } else if (run.phase === 'combat') {
      const sec = run.sector, k = run.combat.kind, before = run.fleet.reduce((a, f) => a + f.hull, 0);
      let n = 0; while (!run.combat.result && n++ < 40) N.autoTurn(run.combat, prud); if (!run.combat.result) run.combat.result = 'lost';
      N.finishCombat(run); lost[sec].push([k, before - run.fleet.reduce((a, f) => a + f.hull, 0)]);
    }
    else if (run.phase === 'reward') { while (run.stock.length && run.fleet.some(f => N.install(run, f.uid, run.stock[0]))); N.afterReward(run); }
    else if (run.phase === 'shop') { N.buy(run, 'ship'); N.buy(run, 'pilot'); N.buy(run, 'repair'); for (let i = 0; i < 3; i++) N.buy(run, 'mod', i); while (run.stock.length && run.fleet.some(f => N.install(run, f.uid, run.stock[0]))); run.phase = 'map'; }
    else if (run.phase === 'dock') N.dock(run, 'repair');
    else if (run.phase === 'event') { const ev = N.eventById(run.event.id); N.resolveEvent(run, ev.choices.findIndex(c => N.canChoose(run, c))); N.closeEvent(run); }
    while (run.crew && run.crew.length && run.fleet.some(f => !f.pilot)) N.assignPilot(run, run.fleet.find(f => !f.pilot).uid, 0);
  }
  return { run, lost };
}
const reach = { 1: 0, 2: 0, 3: 0 }, dmg = {}; let wins = 0, score = 0;
for (let i = 0; i < Kr; i++) {
  const { run, lost } = autoRun(i * 104729 + 7);
  reach[run.sector]++; if (run.victory) wins++; score += N.scoreOf(run);
  for (const s of [1, 2, 3]) for (const [k, d] of lost[s]) { const key = s + ' ' + k; (dmg[key] = dmg[key] || []).push(d); }
}
console.log(`${Kr} parties : fin au secteur 1 : ${reach[1]}, 2 : ${reach[2]}, 3 : ${reach[3]} · victoires ${wins} · score moyen ${Math.round(score / Kr)}`);
for (const [k, v] of Object.entries(dmg).sort()) console.log(`  secteur ${k.padEnd(10)} : ${v.length} combats, coque perdue moyenne ${(v.reduce((a, b) => a + b, 0) / v.length).toFixed(1)}`);

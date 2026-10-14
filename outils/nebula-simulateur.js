/* Nebula : combats et parties joués automatiquement par l'IA de test, sans navigateur.
   node outils/nebula-simulateur.js [nombre-de-combats] [prudence]
   prudence 4 = joueur attentif qui esquive, 0 = joueur qui ignore les annonces.
   Affiche, par type de combat : victoires, tours, coque perdue, vaisseaux perdus
   (flotte d'escorte neuve : porte-vaisseaux, frégate, chasseur = 32 de coque).
   Puis les mêmes combats contre l'IA par score (niveaux 1 et 2 des secteurs suivants).
   Vérifie aussi que tout est reproductible : même graine (+ mêmes actions) = même
   carte, même combat, même partie complète. Code de sortie 1 si une vérification
   échoue (utilisé par la CI : outils/verifications.js). */
const N = require('../nebula/regles.js');
const K = Number(process.argv[2]) || 150, risks = process.argv[3] != null ? [Number(process.argv[3])] : [4, 0];
const fleet = [{ uid: 1, t: 'mere', hull: 16, mods: [], name: 'A' }, { uid: 2, t: 'fregate', hull: 10, mods: [], name: 'B' }, { uid: 3, t: 'chasseur', hull: 6, mods: [], name: 'C' }];
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'ÉCHEC ') + msg); if (!ok) fail++; };

for (const rw of risks) for (const [kind, floor] of [['contact', 1], ['contact', 4], ['contact', 6], ['lourd', 4], ['amiral', 8]]) {
  const r = { won: 0, lost: 0, timeout: 0, fled: 0, turns: 0, dmg: 0, lost2: 0 };
  for (let i = 0; i < K; i++) { const s = N.simulate(i * 7919 + 1, kind, floor, fleet, rw); r[s.result]++; r.turns += s.turns; r.dmg += 32 - s.hull; r.lost2 += s.lost; }
  console.log(`prudence ${rw} · ${kind} étage ${floor} : ${r.won}/${K} victoires · ${(r.turns / K).toFixed(1)} tours · coque perdue ${(r.dmg / K).toFixed(1)} · vaisseaux perdus ${(r.lost2 / K).toFixed(2)}`);
  if (rw === 4) check(r.won > 0, `${kind} étage ${floor} : au moins une victoire (combat possible)`);
}

// IA des pirates par score (niveaux 1 et 2, voir AI_LEVELS) : plus dure, mais toujours gagnable
for (const ai of [1, 2]) for (const [kind, floor] of [['contact', 4], ['lourd', 4], ['amiral', 8]]) {
  const r = { won: 0, dmg: 0, lost2: 0 };
  for (let i = 0; i < K; i++) { const s = N.simulate(i * 7919 + 1, kind, floor, fleet, 4, 30, 1, ai); if (s.result === 'won') r.won++; r.dmg += 32 - s.hull; r.lost2 += s.lost; }
  console.log(`IA ${ai}, prudence 4 · ${kind} étage ${floor} : ${r.won}/${K} victoires · coque perdue ${(r.dmg / K).toFixed(1)} · vaisseaux perdus ${(r.lost2 / K).toFixed(2)}`);
  check(r.won > 0, `IA ${ai} · ${kind} étage ${floor} : au moins une victoire`);
}

// une partie complète jouée par l'IA : toujours le premier saut, réparations au comptoir et au dock
function autoRun(seed) {
  const run = N.newRun(seed, 'escorte'), trace = [];
  for (let step = 0; step < 400 && run.phase !== 'end'; step++) {
    if (run.phase === 'map') { const next = N.nextNodes(run); if (!next.length) break; N.jump(run, next[0].id); }
    else if (run.phase === 'combat') { let n = 0; while (!run.combat.result && n++ < 40) N.autoTurn(run.combat, 4); if (!run.combat.result) run.combat.result = 'lost'; N.finishCombat(run); }
    else if (run.phase === 'reward') { while (run.stock.length && run.fleet.some(f => N.install(run, f.uid, run.stock[0]))); N.afterReward(run); }
    else if (run.phase === 'shop') { N.buy(run, 'repair'); N.buy(run, 'ship'); run.phase = 'map'; }
    else if (run.phase === 'dock') N.dock(run, 'repair');
    trace.push(JSON.stringify(run));
  }
  return { run, trace: trace.join('\n') };
}
check(JSON.stringify(N.makeMap(42)) === JSON.stringify(N.makeMap(42)), 'même graine = même carte');
check(JSON.stringify(N.makeCombat(7, 'lourd', 4, fleet)) === JSON.stringify(N.makeCombat(7, 'lourd', 4, fleet)), 'même graine = même combat');
let same = true, ends = [];
for (const seed of [1, 2024, 99991]) { const a = autoRun(seed), b = autoRun(seed); same = same && a.trace === b.trace; ends.push(`${a.run.phase === 'end' ? (a.run.cleared ? 'secteur libéré' : 'flotte détruite') : a.run.phase} (score ${N.scoreOf(a.run)})`); }
check(same, `même graine + mêmes actions = même partie complète : ${ends.join(', ')}`);
// une partie relue après sauvegarde (JSON) est acceptée telle quelle, une partie abîmée est refusée
const saved = JSON.parse(autoRun(5).trace.split('\n')[3]);   // une partie en cours, relue comme après une sauvegarde
check(N.migrate(saved) !== null, 'migrate() accepte une partie sauvegardée');
check(N.migrate({ v: 1, fleet: 'abîmée' }) === null && N.migrate({ v: 99 }) === null && N.migrate(null) === null, 'migrate() refuse une partie illisible ou d\'une version future');
process.exit(fail ? 1 : 0);

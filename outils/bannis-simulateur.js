// Les Bannis : simulateur sans écran. Joue des nuits entières avec une escouade tirée au sort
// (3 recrues au hasard, placement par défaut, stats qui montent seules, objet équipé si le héros peut le porter), sans dés
// sauf option --des (sort lancé dès que la jauge serait pleine, approximé : un sort toutes les 12 s).
// Usage : node outils/bannis-simulateur.js [nuits=40] [--des]
"use strict";
const vm = require("vm"), fs = require("fs"), path = require("path");
const ctx = {console, Math, JSON, Date, Object, Array, Number, String}; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["donnees.js", "regles.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "bannis", f), "utf8"), ctx, {filename: f});
const {R, D} = ctx.Bannis;
const nuits = Number(process.argv[2]) || 40, avecDes = process.argv.includes("--des");
const atteint = [], causes = {mur: 0, heros: 0, gagne: 0}, morts = {};
let tempsTotal = 0; const murVague = {}, nbVague = {};
for (let n = 0; n < nuits; n++){
  const run = R.nouvelleRun(); run.heros = R.recruesDes(run); R.placerParDefaut(run);
  let fin = null;
  while (!fin){
    R.preparerVague(run);
    const C = R.debutCombat(run); let t = 0, ts = 0;
    while (!C.fin && t < 300){ R.etape(C, 1/30); t += 1/30; ts += 1/30;
      if (avecDes && ts > 12){ ts = 0; const res = R.resultatDes(R.lancerDes(run.des)); R.jeterSort(C, R.tirerSort(run.sorts), res.total, res.deraille); }
      C.ev.length = 0; }
    tempsTotal += t; murVague[run.vague] = (murVague[run.vague] || 0) + (100 - run.mur); nbVague[run.vague] = (nbVague[run.vague] || 0) + 1;
    if (C.fin !== "victoire"){ fin = run.mur <= 0 ? "mur" : "heros"; break; }
    for (const h of run.heros){ const k = R.gagnerXp(h, R.xpDeVague(run)*(h.mort ? 0.5 : 1)); for (let i = 0; i < k; i++) R.monterNiveau(h); if (R.peutEvoluer(h, [])) R.evoluer(h); }
    const o = R.genererObjet(run.vague, !!D.BOSS[run.vague]); const h = run.heros.find(x => R.peutPorter(x, o) && !x.equip[o.slot]) || run.heros.find(x => R.peutPorter(x, o)); if (h) R.equiper(h, o);
    if (run.or >= 15 && run.mur < 70){ run.or -= 15; run.mur = Math.min(run.murMax, run.mur + 30); }
    if (run.vague >= D.NB_VAGUES){ fin = "gagne"; break; }
    run.vague++;
  }
  atteint.push(run.vague); causes[fin]++;
}
const moy = atteint.reduce((a, b) => a + b, 0)/nuits, hist = {};
for (const v of atteint) hist[v] = (hist[v] || 0) + 1;
console.log(`${nuits} nuits${avecDes ? " (avec dés)" : ""} : vague moyenne ${moy.toFixed(1)}, fins`, causes, "répartition", hist, `durée moyenne d'une vague ${(tempsTotal/atteint.reduce((a, b) => a + b, 0)).toFixed(0)} s`);
console.log("Muraille perdue en moyenne à la fin de chaque vague :", Object.keys(nbVague).map(v => v + ":" + Math.round(murVague[v]/nbVague[v])).join(" "));

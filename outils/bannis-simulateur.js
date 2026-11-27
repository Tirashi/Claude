// Les Bannis : simulateur sans écran. Joue des nuits entières avec une escouade tirée au sort
// (3 recrues tirées par les dés de case, placement par défaut, stats qui montent seules, objet équipé si le héros peut le porter).
// Option --lancers : le joueur dépense son or en lancers du dé d'action (3 avant la vague, un d'urgence quand un héros tombe).
// Usage : node outils/bannis-simulateur.js [nuits=40] [--lancers]
"use strict";
const vm = require("vm"), fs = require("fs"), path = require("path");
const ctx = {console, Math, JSON, Date, Object, Array, Number, String}; ctx.window = ctx; vm.createContext(ctx);
for (const f of ["donnees.js", "regles.js"]) vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "bannis", f), "utf8"), ctx, {filename: f});
const {R, D} = ctx.Bannis;
const nuits = Number(process.argv[2]) || 40, avecDes = process.argv.includes("--lancers");
const lanc = {n: {}, or: 0, orGagne: 0}; let vaguesJouees = 0;
const atteint = [], causes = {mur: 0, heros: 0, gagne: 0}, morts = {};
let tempsTotal = 0; const murVague = {}, nbVague = {};
for (let n = 0; n < nuits; n++){
  const run = R.nouvelleRun(); run.heros = R.recruesDes(run); R.placerParDefaut(run);
  let fin = null;
  while (!fin){
    R.preparerVague(run); vaguesJouees++;
    const or0 = run.or;
    if (avecDes) while (R.peutLancer(run, "prep")){ const r = R.lancerAction(run, "prep", null); lanc.n[r.k] = (lanc.n[r.k] || 0) + 1; if (r.choix) R.appliquerRelique(run, r.choix[0].k); }
    const C = R.debutCombat(run); let t = 0, ts = 0;
    while (!C.fin && t < 300){ R.etape(C, 1/30); t += 1/30; ts += 1/30;
      if (avecDes && R.peutLancer(run, "combat") && C.unites.some(u => u.camp === "h" && u.pv <= 0)){ const r = R.lancerAction(run, "combat", C); lanc.n[r.k] = (lanc.n[r.k] || 0) + 1; if (r.choix) R.appliquerRelique(run, r.choix[0].k);
        if (r.k === "sort") R.jeterSort(C, r.sort, 14 + run.vague*2, false); }
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
if (avecDes) console.log("lancers par vague :", (Object.values(lanc.n).reduce((a, b) => a + b, 0)/vaguesJouees).toFixed(1), "répartition", lanc.n);
console.log("Muraille perdue en moyenne à la fin de chaque vague :", Object.keys(nbVague).map(v => v + ":" + Math.round(murVague[v]/nbVague[v])).join(" "));

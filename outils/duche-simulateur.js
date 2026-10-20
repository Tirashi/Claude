/* Duché : parties complètes jouées sans navigateur, joueur automatique contre l'IA.
   node outils/duche-simulateur.js [nombre-de-parties] [--detail]
   Charge regles.js, evenements.js et ia.js dans un même contexte, comme la page.
   Affiche : fins de partie (conquête, couronne, rival couronné, défaite, fin du règne),
   tour moyen de la fin, score moyen, terres et rivaux tombés aux tours 10, 20, 30.
   Vérifie : même graine = même partie (aussi après sauvegarde et rechargement JSON
   en cours de partie), trois graines = trois cartes différentes, le joueur
   automatique gagne parfois, les rivaux ne s'effondrent pas tout seuls, aucune
   erreur. Code de sortie 1 si une vérification échoue (outils/verifications.js). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
for (const f of ['regles.js', 'evenements.js', 'ia.js']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'duche', f), 'utf8'), { filename: 'duche/' + f });
/* global ducNouvelle, ducIaJouer, ducIaRepondre, ducFinTour, ducScore, ducTerresDe, ducMigrer, ducDeplacer, ducRecruter, ducConstruire, ducPlafond, ducChanger, ducApercu, ducDefense, ducAttaquer, DUC_VOISINS, DUC_EVENEMENTS */

const K = Number(process.argv[2]) || 200, detail = process.argv.includes('--detail');
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'ÉCHEC ') + msg); if (!ok) fail++; };

// le joueur automatique : il joue comme un rival Expansionniste (poids de jeu seulement)
const STYLE = ['expansionniste'];
const vus = {};
function jouerTour(e, style) {
  while (e.evt && !e.fin) { vus[e.evt.id] = (vus[e.evt.id] || 0) + 1; ducIaRepondre(e); }
  if (e.fin) return;
  ducIaJouer(e, 0, style);
  if (!e.fin) ducFinTour(e);
}
function partie(graine, style, coupe, niveau) {
  let e = ducNouvelle(graine, 'libre', niveau);
  const traces = {};
  for (let n = 0; n < 40 && !e.fin; n++) {
    if (coupe && e.tour === coupe) e = ducMigrer(JSON.parse(JSON.stringify(e)));   // sauvegarde et rechargement
    jouerTour(e, style || STYLE);
    if ([10, 20, 30].includes(e.tour)) traces[e.tour] = [0, 1, 2, 3].map(s => ducTerresDe(e, s).length).concat(e.seigneurs[0].nour);
  }
  return { e, traces };
}

// 1. déterminisme
{
  const a = JSON.stringify(partie(20261020).e), b = JSON.stringify(partie(20261020).e), c = JSON.stringify(partie(20261020, null, 12).e);
  check(a === b, 'même graine → même partie');
  check(a === c, 'même partie après sauvegarde et rechargement au tour 12');
  const cartes = [1, 2, 3].map(g => ducNouvelle(20261020 + g).terres.map(t => t.t[0] + t.qual).join(''));
  const traits = [1, 2, 3].map(g => JSON.stringify(ducNouvelle(20261020 + g).seigneurs.map(S => S.traits)));
  check(new Set(cartes).size === 3 && cartes.every((x, i) => cartes.slice(i + 1).every(y => [...x].filter((ch, j) => ch !== y[j]).length > 15)), 'trois graines → trois cartes nettement différentes');
  check(new Set(traits).size === 3, 'trois graines → des rivaux différents');
  const e = ducNouvelle(42);
  check(e.terres.length === 37 && e.seigneurs.every((S, s) => e.terres[S.chateau].bat === 'chateau' && ducTerresDe(e, s).length === 3), 'carte : 37 terres, 4 châteaux et 2 terres chacun');
  const brig = e.terres.filter(t => t.brig).length;
  check(brig >= 4 && brig <= 7, `carte : ${brig} bandes de brigands (4 à 7)`);
}

// 2. règles de base
{
  const e = ducNouvelle(7, 'libre', 'facile'), J = e.seigneurs[0], c = J.chateau;
  e.evt = null; J.nour = 100; J.or = 100; J.bois = 100;
  const v = ducTerresDe(e, 0).find(i => i !== c);
  check(ducDeplacer(e, 0, c, v, 2).ok && !ducDeplacer(e, 0, v, c, 2).ok, 'déplacer : une fois par soldat et par tour');
  check(!ducRecruter(e, 0, v, 1).ok && ducRecruter(e, 0, c, 2).ok && J.nour === 96 && J.or === 96, 'recruter : au château, 2 nourriture + 2 or par soldat');
  e.terres[v].bat = null;
  check(ducConstruire(e, 0, v, 'caserne').ok && ducRecruter(e, 0, c, 3).ok && J.nour === 91 && J.or === 81, 'caserne : recrues à 1,6 + 1,6 (arrondi au-dessus)');
  check(ducPlafond(e, 0) === 15, 'caserne : plafond 15');
  check(!ducChanger(e, 0, 'or').ok, 'change : il faut un marché');
  const cible = DUC_VOISINS[c].find(i => e.terres[i].prop < 0), ap = ducApercu(e, 0, cible, 3);
  check(Math.abs(ap.chance - 3 / (3 + ducDefense(e, cible))) < 1e-9, 'combat : chance = attaque / (attaque + défense)');
  const r = ducAttaquer(e, 0, cible, [{ i: c, n: 3 }]);
  check(r.ok && (r.gagne ? e.terres[cible].prop === 0 && e.terres[cible].gar === 3 - r.pertesA : e.terres[cible].prop < 0), 'combat : les survivants occupent la terre prise');
  const sc = ducScore(e);
  check(sc.total === ducTerresDe(e, 0).length * 100 + J.or + Math.floor(J.bois / 2) + 20 * e.terres.filter(t => t.prop === 0 && t.bat && t.bat !== 'chateau').length + J.leg * 5, 'score : terres, or, bois, bâtiments, légitimité');
}

// 3. équilibrage, pour chaque difficulté
const pc = x => Math.round(100 * (x || 0) / K) + ' %';
const bilan = {};
for (const niveau of ['facile', 'normal']) {
  const fins = {}, vus2 = { 10: 0, 20: 0, 30: 0 }, terres = { 10: [0, 0, 0], 20: [0, 0, 0], 30: [0, 0, 0] };
  let tours = 0, score = 0, tombesSeuls = 0, maxScore = 0, erreurs = 0, combats = 0, famines = 0;
  for (let k = 0; k < K; k++) {
    const g = 1000 + k * 7919;
    let r;
    try { r = partie(g, null, 0, niveau); } catch (err) { erreurs++; if (erreurs < 3) console.log(g, err.stack); continue; }
    const { e, traces } = r, f = e.fin ? e.fin.type : 'aucune';
    fins[f] = (fins[f] || 0) + 1;
    tours += e.fin ? e.fin.tour : 99;
    const sc = ducScore(e).total; score += sc; maxScore = Math.max(maxScore, sc);
    combats += e.stats.combats; famines += e.stats.famines;
    for (const t of [10, 20, 30]) if (traces[t]) { terres[t][0] += traces[t][0]; terres[t][1] += (traces[t][1] + traces[t][2] + traces[t][3]) / 3; terres[t][2] += traces[t][4]; vus2[t]++; }
    tombesSeuls += e.seigneurs.slice(1).filter(S => !S.vivant && S.tombe < 8).length;
    if (detail) console.log(niveau, g, f, e.fin && e.fin.tour, sc, e.seigneurs.map(S => `${S.vivant ? '' : '†'}${S.leg}/${S.votes}`).join(' '));
  }
  console.log(`— ${niveau} · ${K} parties · fins : ` + Object.entries(fins).map(([k, v]) => `${k} ${pc(v)}`).join(', '));
  console.log(`tour moyen de la fin ${(tours / K).toFixed(1)} · score moyen ${Math.round(score / K)} (max ${maxScore}) · combats du joueur ${(combats / K).toFixed(1)} · famines ${(famines / K).toFixed(2)}`);
  for (const t of [10, 20, 30]) if (vus2[t]) console.log(`tour ${t} (${vus2[t]} parties) : terres du joueur ${(terres[t][0] / vus2[t]).toFixed(1)}, d'un rival ${(terres[t][1] / vus2[t]).toFixed(1)}, nourriture du joueur ${Math.round(terres[t][2] / vus2[t])}`);
  check(erreurs === 0, `${niveau} : aucune erreur (${erreurs})`);
  const gagnees = (fins.conquete || 0) + (fins.couronne || 0);
  bilan[niveau] = { gagnees, defaites: fins.defaite || 0 };
  check(gagnees > 0 && gagnees < K * 0.8, `${niveau} : le joueur automatique gagne parfois, pas toujours (${pc(gagnees)})`);
  check((fins.defaite || 0) < K * 0.5, `${niveau} : le joueur automatique ne perd pas une partie sur deux (${pc(fins.defaite)})`);
  check(tours / K > 20, `${niveau} : une partie dure longtemps (tour moyen ${(tours / K).toFixed(1)})`);
  check(tombesSeuls < K * 0.3, `${niveau} : les rivaux ne s'effondrent pas tout de suite (${tombesSeuls} chutes avant le tour 8)`);
}
check(bilan.normal.gagnees < bilan.facile.gagnees, `le mode normal est plus dur que le facile (${pc(bilan.facile.gagnees)} → ${pc(bilan.normal.gagnees)} de victoires)`);
const manquent = Object.keys(DUC_EVENEMENTS).filter(k => !vus[k]);
check(!manquent.length, `chaque événement sort au moins une fois (${manquent.join(', ') || Object.keys(vus).length + ' sortes'})`);
process.exit(fail ? 1 : 0);

/* Bastion : vérification des règles et simulateur d'équilibrage (le robot de bastion/regles.js joue des parties entières).
   node outils/bastion-simulateur.js                              → contrôles + 30 parties avec les réglages d'origine
   node outils/bastion-simulateur.js 100 '{"vagues":{"plus":1.5}}'   → 100 parties avec des réglages du labo (bouton COPIER du jeu)
   Affiche les victoires du robot, où les parties sont perdues, et la moyenne du journal par vague.
   Lancé par verifications.js (avec 8 parties) : sort en erreur si une règle ne tient pas. */
"use strict";
const B = require("../bastion/regles.js");
const nb = Number(process.argv[2]) || 30;
const mods = process.argv[3] ? JSON.parse(process.argv[3]) : {};
let erreurs = 0;
const verif = (ok, txt) => { if (!ok){ erreurs++; console.log("ÉCHEC " + txt); } };

/* ---------- les règles ---------- */
{
  const S = B.creer({}, 1);
  verif(S.pawns.length === 3 && S.esc.length === 1 && S.res.bois === 40, "départ : 3 ouvriers, une escouade, 40 bois");
  verif(B.recruter(S, "arc") !== null, "les archers demandent une archerie");
  verif(B.construire(S, 4, "archerie") === null && S.res.bois === 0, "une archerie se paie (40 bois)");
  verif(S.pawns.some(p => p.job === "bati"), "un ouvrier prend son marteau");
  verif(B.construire(S, 4, "maison") !== null, "un emplacement pris refuse un 2e bâtiment");
  for (let i = 0; i < 400 && !S.sites[4].b.fini; i++) B.pas(S, .05);
  verif(S.sites[4].b.fini, "l'archerie se termine");
  verif(B.debloque(S, "arc"), "l'archerie débloque les archers");
  S.res.bois = S.res.or = S.res.viande = 500;
  verif(B.recruter(S, "arc") === null && B.recruter(S, "guer") === null, "recrutement");
  verif(B.nbEsc(S) === 3 && B.recruter(S, "guer") !== null, "population : 3 escouades au départ, pas une de plus");
  // une maison terminée : +1 escouade
  B.construire(S, 5, "maison"); S.sites[5].b.fini = true;
  verif(B.maxEsc(S) === 4 && B.maxOuv(S) === 6, "une maison : +1 escouade, +2 ouvriers");
  // garnison : seulement des archers, dans une tour finie
  B.construire(S, 1, "tour"); S.sites[1].b.fini = true; S.sites[1].b.pv = S.P.tour.pv;
  const g = S.esc.find(q => q.k === "guer"), a = S.esc.find(q => q.k === "arc");
  verif(B.envoyer(S, g, 0, 0, S.sites[1]) !== null, "les guerriers ne montent pas dans une tour");
  verif(B.envoyer(S, a, 0, 0, S.sites[1]) === null, "les archers montent dans une tour");
  for (let i = 0; i < 400 && !a.tour; i++) B.pas(S, .05);
  verif(a.tour === S.sites[1] && S.sites[1].b.garnison === a, "archers en garnison");
  // un monstre au pied de la tour attaque la tour, pas les archers
  S.mons.push({t: "gob", x: S.sites[1].x + .3, y: S.sites[1].y - .1, dir: "N", pv: 999, pvMax: 999, delai: 0, cd: 0, face: 1, mode: "walk", ph: 0, passe: true, dernier: null});
  const pvA = a.pv, pvT = S.sites[1].b.pv;
  for (let i = 0; i < 20; i++) B.pas(S, .05);
  verif(a.pv === pvA && S.sites[1].b.pv < pvT, "en garnison, les archers ne craignent pas le corps à corps");
  // grades
  const q = S.esc.find(o => o.k === "guer"), n0 = B.nMax(S, q);
  q.xp = S.P.xp.elite - 1; q.grade = 1; q.pv = B.pvMax(S, q);
  S.mons.push({t: "gob", x: q.x, y: q.y, dir: "N", pv: .01, pvMax: 30, delai: 0, cd: 0, face: 1, mode: "walk", ph: 0, passe: true, dernier: q});
  B.pas(S, .05);
  verif(q.grade === 2 && B.nMax(S, q) === n0 + 1 && B.vivants(S, q) === n0 + 1, "élite : un soldat de plus");
}
/* ---------- parties reproductibles ; sans rien faire, on perd vite ---------- */
{
  const a = JSON.stringify(B.simuler({}, 42)), b = JSON.stringify(B.simuler({}, 42));
  verif(a === b, "une partie du robot est reproductible (même graine)");
  const S = B.creer({}, 7); while (!S.fini && S.t < 900) B.pas(S, .05);
  verif(S.fini === "defaite" && S.vague <= 4, "sans rien faire, le château tombe avant la 5e vague (vague " + S.vague + ")");
}
/* ---------- le simulateur ---------- */
const P = B.reglages(mods), res = [];
for (let g = 1; g <= nb; g++) res.push(B.simuler(mods, g * 7919));
const moy = f => res.reduce((s, r) => s + f(r), 0) / nb, vict = res.filter(r => r.fini === "victoire").length;
console.log(`${vict}/${nb} victoires du robot · vague moyenne ${moy(r => r.vague).toFixed(1)} · PV du château ${Math.round(moy(r => r.pv))}/${P.chateau.pv} · ${Math.round(moy(r => r.tues))} monstres abattus · ${Math.round(moy(r => r.pertes))} soldats perdus`);
console.log("vague | parties | perdues | PV château | tués | pertes | ressources restantes (bois / or / viande)");
for (let w = 1; w <= P.vagues.nombre; w++){
  const js = res.map(r => r.journal[w - 1]).filter(j => j && j.fin);
  const m = f => js.length ? Math.round(js.reduce((s, j) => s + f(j), 0) / js.length) : "-";
  console.log(`${String(w).padStart(5)} | ${String(res.filter(r => r.vague >= w).length).padStart(7)} | ${String(res.filter(r => r.fini === "defaite" && r.vague === w).length).padStart(7)} | ${String(m(j => j.pvChateau)).padStart(10)} | ${String(m(j => j.tues)).padStart(4)} | ${String(m(j => j.pertes)).padStart(6)} | ${m(j => j.res.bois)} / ${m(j => j.res.or)} / ${m(j => j.res.viande)}`);
}
// avec les réglages d'origine, le robot doit tenir au moins 6 vagues en moyenne (sinon le jeu est cassé, pas seulement mal réglé)
if (!process.argv[3]) verif(moy(r => r.vague) >= 6, "le robot tient au moins 6 vagues en moyenne");
if (erreurs){ console.log(erreurs + " échec(s)"); process.exit(1); }

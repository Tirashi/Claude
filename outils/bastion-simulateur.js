/* Bastion : vérification des règles et simulateur d'équilibrage (le robot de bastion/regles.js joue des parties entières).
   node outils/bastion-simulateur.js                              → contrôles + 30 parties avec les réglages d'origine
   node outils/bastion-simulateur.js 100 '{"vagues":{"plus":1.5}}'   → 100 parties avec des réglages du labo (bouton COPIER du jeu)
   Affiche les victoires du robot, où les parties sont perdues, et la moyenne du journal par vague.
   Lancé par verifications.js (avec 8 parties) : sort en erreur si une règle ne tient pas. */
"use strict";
const B = require("../bastion/regles.js");
const CH = B => B.CHATEAU;
const nb = Number(process.argv[2]) || 30;
const mods = process.argv[3] ? JSON.parse(process.argv[3]) : {};
let erreurs = 0;
const verif = (ok, txt) => { if (!ok){ erreurs++; console.log("ÉCHEC " + txt); } };

/* ---------- les règles ---------- */
{
  const S = B.creer({}, 1);
  verif(S.pawns.length === 3 && S.esc.length === 1 && S.res.bois === 50, "départ : 3 ouvriers, une escouade, 50 bois");
  verif(B.recruter(S, "arc") !== null, "les archers demandent une archerie");
  verif(B.construire(S, 8, "archerie") === null && S.res.bois === 10, "une archerie se paie (40 bois)");
  verif(S.pawns.some(p => p.job === "bati"), "un ouvrier prend son marteau");
  verif(B.construire(S, 8, "maison") !== null, "un emplacement pris refuse un 2e bâtiment");
  for (let i = 0; i < 400 && !S.sites[8].b.fini; i++) B.pas(S, .05);
  verif(S.sites[8].b.fini, "l'archerie se termine");
  verif(B.debloque(S, "arc"), "l'archerie débloque les archers");
  S.res.bois = S.res.or = S.res.viande = 500;
  verif(B.recruter(S, "guer") !== null && B.recruter(S, "arc") === null && B.recruter(S, "lance") === null, "recrutement (les chevaliers demandent une caserne)");
  verif(B.nbEsc(S) === 3 && B.recruter(S, "lance") !== null, "population : 3 escouades au départ, pas une de plus");
  // une maison terminée : +1 escouade
  B.construire(S, 9, "maison"); S.sites[9].b.fini = true;
  verif(B.maxEsc(S) === 4 && B.maxOuv(S) === 6, "une maison : +1 escouade, +2 ouvriers");
  // garnison : archers, moines ou catapulte, dans une tour finie
  B.construire(S, 1, "tour"); S.sites[1].b.fini = true; S.sites[1].b.pv = S.P.tour.pv;
  const g = S.esc.find(q => q.k === "lance"), a = S.esc.find(q => q.k === "arc");
  verif(B.envoyer(S, g, 0, 0, S.sites[1]) !== null, "les lanciers ne montent pas dans une tour");
  verif(B.GARNISON.moine && B.GARNISON.cata && B.GARNISON.arc, "archers, moines et catapulte vont en garnison");
  verif(B.envoyer(S, a, 0, 0, S.sites[1]) === null, "les archers montent dans une tour");
  for (let i = 0; i < 400 && !a.tour; i++) B.pas(S, .05);
  verif(a.tour === S.sites[1] && S.sites[1].b.garnison === a, "archers en garnison");
  // un monstre au pied de la tour attaque la tour, pas les archers
  S.mons.push({t: "gob", x: S.sites[1].x + .3, y: S.sites[1].y - .1, dir: "N", pv: 999, pvMax: 999, delai: 0, cd: 0, face: 1, mode: "walk", ph: 0, passe: true, dernier: null});
  const pvA = a.pv, pvT = S.sites[1].b.pv;
  for (let i = 0; i < 20; i++) B.pas(S, .05);
  verif(a.pv === pvA && S.sites[1].b.pv < pvT, "en garnison, les archers ne craignent pas le corps à corps");
  // on contourne les bâtiments : jamais dans un obstacle
  verif(B.obstacles(S).length === 1 + S.sites.filter(s => s.b).length, "obstacles : le château et chaque bâtiment");
  { const S2 = B.creer({}, 3), q = S2.esc[0]; q.x = CH(B)[0]; q.y = CH(B)[1] - 1.8; B.envoyer(S2, q, CH(B)[0], CH(B)[1] + 1.5); S2.prochaine = 1e9;
    let dedans = false; for (let i = 0; i < 300; i++){ B.pas(S2, .05); const o = B.obstacles(S2)[0]; if (((q.x - o.x) / o.rx) ** 2 + ((q.y - o.y) / o.ry) ** 2 < .95) dedans = true; }
    verif(!dedans && q.y > CH(B)[1] + .7, "une escouade contourne le château au lieu de le traverser"); }
  // la zone de soin des moines grandit avec le grade et dans une tour
  { const m = {k: "moine", grade: 0, tour: null}, r0 = B.portee(S, m); m.grade = 2; const r2 = B.portee(S, m); m.tour = S.sites[1]; const r3 = B.portee(S, m);
    verif(r2 > r0 && r3 > r2, "zone de soin : plus grande avec le grade et dans une tour"); }
  // emplacements : tours le long des chemins, le reste au village ; un seul bâtiment de chaque sorte qui forme des unités
  verif(B.construire(S, 2, "maison") !== null && B.construire(S, 10, "tour") !== null, "tours sur les chemins, maisons au village");
  verif(B.construire(S, 11, "archerie") !== null, "une seule archerie");
  verif(B.construire(S, 3, "tourbois") === null && S.P.tourbois.pv < S.P.tour.pv && S.P.tourbois.bois < S.P.tour.bois, "la tour en bois : moins chère et plus fragile");
  // niveaux : une archerie niveau 2 forme des archers vétérans ; caserne niveau 2 : promotions
  { const S3 = B.creer({}, 4, 5); S3.res.bois = S3.res.or = S3.res.viande = 2000;
    B.construire(S3, 8, "archerie"); B.construire(S3, 9, "caserne"); for (const i of [8, 9]){ S3.sites[i].b.fini = true; S3.sites[i].b.pv = S3.P[S3.sites[i].b.k].pv; }
    verif(B.ameliorer(S3, 8) === null && S3.sites[8].b.travaux, "améliorer l'archerie lance des travaux");
    for (let i = 0; i < 1200 && S3.sites[8].b.travaux; i++) B.pas(S3, .05);
    verif(S3.sites[8].b.niveau === 2, "les ouvriers finissent les travaux : niveau 2");
    B.recruter(S3, "arc"); verif(S3.esc.at(-1).grade === 1, "archerie niveau 2 : archers vétérans");
    const l = S3.esc[0]; verif(B.promouvoir(S3, l) !== null, "pas de promotion sans caserne niveau 2");
    S3.sites[9].b.niveau = 2; verif(B.promouvoir(S3, l) === null && l.k === "cav", "caserne niveau 2 : les lanciers deviennent cavaliers");
    const pv0 = S3.pv; verif(B.ameliorerChateau(S3) === null && S3.niveauChateau === 2 && S3.pv > pv0, "château niveau 2 : plus de PV");
    B.recruter(S3, "lance"); verif(S3.esc.at(-1).grade === 1, "château niveau 2 : lanciers vétérans");
    B.construire(S3, 10, "maison"); S3.sites[10].b.fini = true; S3.sites[10].b.pv = S3.P.maison.pv; const e0 = B.maxEsc(S3), o0 = B.maxOuv(S3);
    B.ameliorer(S3, 10); for (let i = 0; i < 1200 && S3.sites[10].b.travaux; i++) B.pas(S3, .05);
    verif(B.maxEsc(S3) === e0 + 1 && B.maxOuv(S3) === o0 + 2, "maison niveau 2 : +1 escouade, +2 ouvriers");
    // tenir la position : l'escouade ne part pas au-devant d'un monstre proche
    const t = S3.esc.at(-1); t.x = t.tx = 5.5; t.y = t.ty = 7.0; t.ordre = false; B.tenir(S3, t);
    S3.mons.push({t: "gob", x: 5.5, y: 5.9, dir: "N", etape: 99, ox: 0, oy: 0, pv: 999, pvMax: 999, delai: 0, cd: 0, face: 1, mode: "walk", ph: 0, dernier: null});
    B.pas(S3, .05); B.pas(S3, .05);
    verif(t.tenir && Math.hypot(t.x - 5.5, t.y - 7.0) < .02, "une escouade qui tient sa position ne bouge pas"); }
  // grades
  const q = S.esc.find(o => o.k === "lance"), n0 = B.nMax(S, q);
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

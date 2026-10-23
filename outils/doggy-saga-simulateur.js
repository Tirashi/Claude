/* Doggy Saga : vérification des règles et des niveaux, sans navigateur.
   node outils/doggy-saga-simulateur.js [--complet [parties]]
   Vérifie sur des grilles préparées : alignement simple, bandana (4), nœud (L ou T), balle (5), effets des bonus,
   balle + balle, échange refusé, laisse, gamelle, niche, chiot sauvé, boue ; puis : pas de case vide ni d'alignement
   oublié après chaque coup (parties au hasard sur les 60 niveaux), même graine = même partie (aussi après passage
   par JSON en cours de partie), journée du jour, contenu des 60 niveaux, et un joueur habile qui gagne un échantillon de niveaux.
   --complet : joue chaque niveau avec le joueur moyen et affiche son taux de réussite (long).
   Code de sortie 1 si une vérification échoue (outils/verifications.js). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
for (const f of ['regles.js', 'niveaux.js']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'doggy-saga', f), 'utf8'), { filename: 'doggy-saga/' + f });
/* global DOG_N, DOG_W, DOG_RACES, DOG_NIVEAUX, DOG_CHAPITRES, dogNouvelle, dogCoup, dogCoupsPossibles, dogTrouver, dogResoudre, dogLibre, dogJour, dogNouvelleJour, dogCopie, dogEtoiles, dogAvancement */
const { jouer } = require('./doggy-saga-joueur.js');

let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'ÉCHEC ') + msg); if (!ok) fail++; };
const P8 = '........', PLEIN = [P8, P8, P8, P8, P8, P8, P8, P8];
const RACES6 = [0, 1, 2, 3, 4, 5];
const idx = (r, c) => r * DOG_W + c;

// une grille sans alignement : la race de (r, c) ; on y place ensuite les chiens du test
const base = (r, c) => (c + (r % 2) * 3 + Math.floor(r / 2)) % 6;
function preparer(plan, poser) {
  const e = dogNouvelle({ id: 'test', coups: 30, races: RACES6, plan: plan || PLEIN, obj: [{ k: 'calins', t: 0, n: 999 }] }, 'test');
  for (let i = 0; i < DOG_N; i++) if (e.g[i] && !e.g[i].gm && !e.g[i].ch) { const ls = e.g[i].ls; e.g[i] = { t: base(Math.floor(i / 8), i % 8), sp: 0 }; if (ls) e.g[i].ls = 1; }
  if (poser) poser(e);
  return e;
}
function sain(e) {
  for (let i = 0; i < DOG_N; i++) {
    if (dogLibre(e, i) && !e.g[i]) return 'case vide ' + i;
    if (!dogLibre(e, i) && e.g[i]) return 'pièce hors case ' + i;
  }
  if (dogTrouver(e).length) return 'alignement oublié';
  return '';
}
const evs = (r, k) => r.ev.filter(x => x.k === k);

/* ---------- règles sur grilles préparées ---------- */
{
  const e = preparer(null);
  check(!dogTrouver(e).length, 'la grille de test ne contient aucun alignement');
  // rangée 0 : 0 1 2 3 4 5 0 1 ; on met un 5 en (1,2) et des 5 en (0,0), (0,1) : échange (0,2)↔(1,2)
  e.g[idx(0, 0)].t = 5; e.g[idx(0, 1)].t = 5; e.g[idx(1, 2)].t = 5;
  const avant = e.calins[5];
  const r = dogCoup(e, idx(0, 2), idx(1, 2));
  check(r && r.ok && e.coups === 29 && e.calins[5] - avant >= 3, 'alignement de 3 : effacé, câlins comptés, un coup en moins');
  check(!sain(e), 'après le coup : grille pleine et sans alignement (' + (sain(e) || 'ok') + ')');
}
{
  const e = preparer(null, e => { for (const c of [0, 1, 3]) e.g[idx(3, c)].t = 5; e.g[idx(2, 2)].t = 5; e.g[idx(3, 2)].t = 1; });
  // rangée 3 de base : 4 5 0 1 2 3 4 5 → on vérifie seulement que les 4 cases deviennent des 5
  const r = dogCoup(e, idx(2, 2), idx(3, 2));
  const c = evs(r, 'cree')[0];
  check(r.ok && c && c.sp === 2 && c.i === idx(3, 2), 'aligner 4 en rangée : bandana (colonne) créé sur la case où le chien a été posé');
}
{
  const e = preparer(null, e => { for (const c of [0, 1, 3, 4]) e.g[idx(5, c)].t = 0; e.g[idx(4, 2)].t = 0; e.g[idx(5, 2)].t = 3; });
  const r = dogCoup(e, idx(4, 2), idx(5, 2));
  const c = evs(r, 'cree')[0];
  check(r.ok && c && c.sp === 4, 'aligner 5 : balle de tennis');
}
{
  // en L : (6,0) (6,1) + (4,2) (5,2) et on pose un chien en (6,2)
  const e = preparer(null, e => { e.g[idx(6, 0)].t = 2; e.g[idx(6, 1)].t = 2; e.g[idx(4, 2)].t = 2; e.g[idx(5, 2)].t = 2; e.g[idx(7, 2)].t = 2; e.g[idx(6, 2)].t = 4; });
  const r = dogCoup(e, idx(6, 2), idx(7, 2));
  const c = evs(r, 'cree')[0];
  check(r.ok && c && c.sp === 3 && c.i === idx(6, 2), 'alignement en L : nœud créé au coin');
}
{
  const e = preparer(null, e => { e.g[idx(3, 3)] = { t: 1, sp: 1 }; });
  const ev = [];
  dogResoudre(e, ev, { cles: [idx(3, 3)], crees: [] });
  const ef = ev.find(x => x.k === 'efface'), ids = new Set(ef.cases.map(x => x.i));
  check(ev.some(x => x.k === 'effet' && x.type === 'rayon' && x.h === 1) && [0, 1, 2, 3, 4, 5, 6, 7].every(c => ids.has(idx(3, c))), 'bandana (rangée) : vide toute la rangée');
}
{
  const e = preparer(null, e => { e.g[idx(4, 4)] = { t: 1, sp: 3 }; });
  const ev = [];
  dogResoudre(e, ev, { cles: [idx(4, 4)], crees: [] });
  const ids = new Set(ev.find(x => x.k === 'efface').cases.map(x => x.i));
  let ok = true;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) ok = ok && ids.has(idx(4 + dr, 4 + dc));
  check(ok && ids.size === 9, 'nœud : efface le carré de 3 × 3');
}
{
  const e = preparer(null, e => { e.g[idx(0, 0)] = { t: -1, sp: 4, cible: 2 }; });
  const n2 = e.g.filter(p => p && p.t === 2).length, ev = [];
  dogResoudre(e, ev, { cles: [idx(0, 0)], crees: [] });
  const ef = ev.find(x => x.k === 'efface');
  check(ef.cases.filter(x => x.t === 2).length === n2 && ef.cases.length === n2 + 1, 'balle : fait partir tous les chiens de la race visée');
}
{
  const e = preparer(null, e => { e.g[idx(2, 2)] = { t: -1, sp: 4 }; e.g[idx(2, 3)] = { t: -1, sp: 4 }; });
  const r = dogCoup(e, idx(2, 2), idx(2, 3));
  check(r.ok && r.ev.find(x => x.k === 'efface').cases.length === 64, 'balle + balle : toute la grille part');
}
{
  const e = preparer(null, e => { e.g[idx(2, 2)] = { t: -1, sp: 4 }; e.g[idx(2, 3)] = { t: 1, sp: 1 }; });
  const r = dogCoup(e, idx(2, 2), idx(2, 3));
  const b = r.ev.find(x => x.k === 'effet' && x.type === 'balle');
  check(r.ok && b && b.conv === 1 && r.ev.filter(x => x.k === 'effet' && x.type === 'rayon').length >= b.cibles.length - 1, 'balle + bandana : toute la race prend un bandana et part');
}
{
  const e = preparer(null), avant = JSON.stringify(e.g);
  const ok = new Set(dogCoupsPossibles(e).map(m => m.join()));
  let paire = null;
  for (let i = 0; i < 63 && !paire; i++) if (i % 8 < 7 && !ok.has(i + ',' + (i + 1))) paire = [i, i + 1];
  const r = dogCoup(e, paire[0], paire[1]);
  check(r && !r.ok && evs(r, 'retour').length === 1 && JSON.stringify(e.g) === avant && e.coups === 30, 'échange sans alignement : les chiens reviennent, le coup ne compte pas');
  check(dogCoup(e, 0, 9) === null, 'deux cases qui ne se touchent pas : refusé');
}
{
  const plan = PLEIN.slice(); plan[3] = '...l....';
  const e = preparer(plan);
  check(e.g[idx(3, 3)].ls === 1 && dogCoup(e, idx(3, 3), idx(3, 4)) === null, 'chien en laisse : on ne peut pas le déplacer');
}
{
  const plan = PLEIN.slice(); plan[0] = 'g.......';
  const e = preparer(plan), ev = [];
  check(dogCoup(e, 0, 1) === null, 'gamelle : on ne peut pas la déplacer');
  dogResoudre(e, ev, { cles: [idx(0, 1)], crees: [] });
  check(ev.find(x => x.k === 'efface').cases.some(x => x.gm), 'gamelle : renversée quand un chien part à côté');
}
{
  const plan = PLEIN.slice(); plan[4] = '...N....';
  const e = preparer(plan), ev = [];
  check(!e.g[idx(4, 3)] && e.niche[idx(4, 3)] === 2, 'niche : pas de chien dessus');
  dogResoudre(e, ev, { cles: [idx(4, 4)], crees: [] });
  check(e.niche[idx(4, 3)] === 1 && ev.some(x => x.k === 'niche' && x.n === 1), 'niche : abîmée quand un chien part à côté');
  dogResoudre(e, ev, { cles: [idx(5, 3)], crees: [] });
  check(!sain(e), 'sous la niche, la case se remplit en diagonale (' + (sain(e) || 'ok') + ')');
}
{
  const plan = PLEIN.slice(); plan[6] = 'c.......';
  const e = dogNouvelle({ id: 'test', coups: 30, races: RACES6, plan, obj: [{ k: 'chiots', n: 1 }] }, 'chiot'), ev = [];
  dogResoudre(e, ev, { cles: [idx(7, 0)], crees: [] });
  check(e.chiotsSauves === 1 && ev.some(x => x.k === 'sauve' && x.i === idx(7, 0)), 'chiot : sauvé en arrivant en bas de sa colonne');
}
{
  const plan = PLEIN.map(() => 'BBBBbbbb');
  const e = preparer(plan), ev = [];
  dogResoudre(e, ev, { cles: [idx(0, 0), idx(0, 7)], crees: [] });
  check(e.boue[idx(0, 0)] === 1 && e.boue[idx(0, 7)] === 0 && e.boueDepart === 96, 'boue : une couche part avec le chien posé dessus');
}

/* ---------- parties au hasard sur les 60 niveaux : grille toujours saine ---------- */
{
  let pb = '', coups = 0;
  for (const niv of DOG_NIVEAUX) {
    const e = dogNouvelle(niv, 'hasard');
    for (let s = 0; !e.fin && s < 80 && !pb; s++) {
      const l = dogCoupsPossibles(e);
      if (!l.length) { pb = 'niveau ' + niv.id + ' : aucun coup possible'; break; }
      const m = l[(s * 7 + niv.id) % l.length], r = dogCoup(e, m[0], m[1]);
      if (!r || !r.ok) { pb = 'niveau ' + niv.id + ' : coup proposé refusé'; break; }
      const s2 = sain(e);
      if (s2) pb = 'niveau ' + niv.id + ' : ' + s2;
      coups++;
    }
  }
  check(!pb, 'parties au hasard sur les 60 niveaux (' + coups + ' coups) : jamais de case vide ni d\'alignement oublié' + (pb ? ' — ' + pb : ''));
}

/* ---------- reproductibilité ---------- */
{
  const niv = DOG_NIVEAUX[47];
  const partie = (coupe) => {
    let e = dogNouvelle(niv, 'repro');
    for (let s = 0; s < 12 && !e.fin; s++) {
      if (s === coupe) e = JSON.parse(JSON.stringify(e));
      const l = dogCoupsPossibles(e), m = l[s % l.length];
      dogCoup(e, m[0], m[1]);
    }
    return JSON.stringify(e);
  };
  const a = partie(-1);
  check(a === partie(-1) && a === partie(5), 'même graine = même partie, aussi après sauvegarde JSON en cours de partie');
  check(JSON.stringify(dogNouvelle(niv, 'a').g) !== JSON.stringify(dogNouvelle(niv, 'b').g), 'deux graines = deux grilles différentes');
}

/* ---------- journée du jour ---------- */
{
  const a = dogJour('20261022'), b = dogJour('20261022'), c = dogJour('20261023');
  check(JSON.stringify(a) === JSON.stringify(b) && JSON.stringify(dogNouvelleJour('20261022').g) === JSON.stringify(dogNouvelleJour('20261022').g), 'journée du jour : même grille pour tout le monde');
  check(JSON.stringify(a) !== JSON.stringify(c) || JSON.stringify(dogNouvelleJour('20261022').g) !== JSON.stringify(dogNouvelleJour('20261023').g), 'journée du jour : une autre grille le lendemain');
  const r = jouer(a, '20261022', { mode: 'jour', habile: 1 });
  check(r.fin === 'fini' && r.coupsJoues === 20 && r.calins > 60, 'journée du jour : 20 coups, puis fin (' + r.calins + ' câlins)');
}

/* ---------- les 60 niveaux ---------- */
{
  check(DOG_NIVEAUX.length === 60 && DOG_CHAPITRES.length === 5, '60 niveaux en 5 chapitres');
  const pbs = [];
  const vedettes = new Set();
  DOG_NIVEAUX.forEach((n, k) => {
    if (n.id !== k + 1 || n.chap !== Math.floor(k / 12) + 1) pbs.push(n.id + ' : numéro ou chapitre');
    if (!n.obj.length) pbs.push(n.id + ' : pas d\'objectif');
    if (n.races.length < 5 || n.races.length > 6 || n.races.some(t => !DOG_RACES[t])) pbs.push(n.id + ' : races');
    if (n.coups < 10 || n.coups > 60) pbs.push(n.id + ' : ' + n.coups + ' coups');
    if (!(n.etoiles && n.etoiles[0] < n.etoiles[1])) pbs.push(n.id + ' : étoiles');
    for (const o of n.obj) if (o.k === 'calins') { vedettes.add(o.t); if (!n.races.includes(o.t)) pbs.push(n.id + ' : câlins pour une race absente'); }
    if (n.obj.some(o => o.k === 'boue') && !n.plan.join('').match(/[bBL]/)) pbs.push(n.id + ' : objectif boue sans boue');
  });
  check(!pbs.length, 'contenu des niveaux' + (pbs.length ? ' — ' + pbs.join(', ') : ''));
  check(DOG_RACES.every((_, t) => vedettes.has(t)), 'chacun des 16 chiens a au moins un niveau où on peut le faire adopter (album)');
  const e = dogNouvelle(DOG_NIVEAUX[0], 'x'); e.fin = 'gagne'; e.score = DOG_NIVEAUX[0].etoiles[1];
  check(dogEtoiles(DOG_NIVEAUX[0], e) === 3 && dogAvancement(dogNouvelle(DOG_NIVEAUX[12], 'x'))[0].total > 0, 'étoiles et avancement des objectifs');
}

/* ---------- le joueur habile gagne un échantillon de niveaux ---------- */
{
  const echant = [1, 2, 3, 8, 15, 22, 27, 33, 39, 44, 50, 56];
  const perdus = [];
  for (const id of echant) {
    const niv = DOG_NIVEAUX[id - 1];
    let g = 0;
    for (let k = 0; k < 3; k++) if (jouer(niv, 'ech' + k, { habile: 1 }).fin === 'gagne') g++;
    if (!g) perdus.push(id);
  }
  check(!perdus.length, 'un joueur habile gagne chaque niveau de l\'échantillon (au moins 1 partie sur 3)' + (perdus.length ? ' — perdus : ' + perdus.join(', ') : ''));
  const tuto = [1, 2, 3].every(id => { const n = DOG_NIVEAUX[id - 1]; let ok = true; for (let k = 0; k < 6; k++) ok = ok && jouer(n, 'tuto' + k, { habile: 0.5 }).fin === 'gagne'; return ok; });
  check(tuto, 'les 3 niveaux du tutoriel se gagnent même en jouant mal');
}

/* ---------- taux de réussite de chaque niveau (long) ---------- */
if (process.argv.includes('--complet')) {
  const K = Number(process.argv[process.argv.indexOf('--complet') + 1]) || 40;
  for (const niv of DOG_NIVEAUX) {
    let g = 0, sc = 0, et = [0, 0, 0, 0];
    for (let k = 0; k < K; k++) { const r = jouer(niv, 'cplt' + k); if (r.fin === 'gagne') { g++; sc += r.score; } const e = { fin: r.fin, score: r.score }; et[dogEtoiles(niv, e)]++; }
    console.log(`niveau ${String(niv.id).padStart(2)} (${niv.coups} coups) : ${(g / K * 100).toFixed(0)} % gagnés, étoiles 0/1/2/3 : ${et.join(' / ')}`);
  }
}

process.exit(fail ? 1 : 0);

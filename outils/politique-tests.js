/* Politique (moteur de règles, sans écran) : tests sous Node.
   node outils/politique-tests.js
   M0 : hasard à graine, état initial du scénario « champs », invariants du tour
   (déterminisme, état reçu jamais modifié, JSON rechargé à l'identique, action hors liste refusée).
   Code de sortie 1 si un test échoue (lancé par outils/verifications.js). */
'use strict';
const path = require('path');
const P = f => require(path.join(__dirname, '..', 'politique', f));
const Alea = P('moteur/alea.js'), Etat = P('moteur/etat.js'), Tour = P('moteur/tour.js');
const CHAMPS = P('donnees/champs.js');

let fail = 0, n = 0;
const check = (ok, msg) => { n++; console.log((ok ? 'ok    ' : 'ÉCHEC ') + msg); if (!ok) fail++; };
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const gele = o => { if (o && typeof o === 'object') { Object.freeze(o); Object.values(o).forEach(gele); } return o; };

// --- hasard ---
{
  const suite = g => { const r = Alea.creer(g); return Array.from({ length: 1000 }, () => Alea.suivant(r)); };
  const a = suite(1), b = suite(1), c = suite(2);
  check(egal(a, b), 'hasard : même graine, même suite (1000 tirages)');
  check(!egal(a, c), 'hasard : graines 1 et 2 donnent des suites différentes');
  check(a.every(x => x >= 0 && x < 1), 'hasard : tirages dans [0, 1[');
  // implémentation de référence de mulberry32 (Tommy Ettinger), écrite à part : si elles divergent, toutes les parties enregistrées changent
  const ref = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const m = ref(1);
  check(egal(a, Array.from({ length: 1000 }, m)), 'hasard : identique à mulberry32 de référence (graine 1, 1000 tirages)');
  const moy = a.reduce((s, x) => s + x, 0) / a.length;
  check(moy > 0.45 && moy < 0.55, `hasard : moyenne ${moy.toFixed(3)} proche de 0,5`);
  const comptes = [0, 0, 0, 0, 0, 0]; const r = Alea.creer(7);
  for (let i = 0; i < 6000; i++) comptes[Alea.entier(r, 6)]++;
  check(comptes.every(k => k > 850 && k < 1150), 'hasard : entier(6) uniforme (' + comptes.join(' ') + ')');
  check(egal(Alea.creer('2026-11-13'), Alea.creer('2026-11-13')) && !egal(Alea.creer('2026-11-13'), Alea.creer('2026-11-14')), 'hasard : graine en texte (graine du jour)');
}

// --- état initial ---
{
  const e = Etat.creerEtat(CHAMPS, 1);
  check(e.tour === 1 && e.tourMax === 60 && !e.fin, 'état initial : tour 1 sur 60');
  check(e.tresor === CHAMPS.joueur.tresor && e.familles === CHAMPS.joueur.familles && e.cp === CHAMPS.joueur.cp, 'état initial : trésor, familles, capital politique du scénario');
  check(egal(Object.keys(e.factions), ['paysans', 'ouvriers', 'artisans', 'patrons']), 'état initial : les 4 factions');
  check(Object.values(e.factions).every(f => f.colere >= 0 && f.colere <= 100 && f.puissance >= 0 && f.puissance <= 100), 'état initial : colère et puissance dans 0-100');
  check(egal(Object.keys(e.nations), ['val_roc', 'brume', 'contreforts']), 'état initial : les 3 nations de l\'ordinateur');
  check(Object.values(e.nations).every(x => x.relation >= -100 && x.relation <= 100), 'état initial : relations dans -100…+100');
  check(egal(JSON.parse(JSON.stringify(e)), e), 'état initial : sérialisable en JSON');
  e.factions.paysans.colere = 99;
  check(CHAMPS.joueur.factions.paysans.colere !== 99, 'état initial : copie des données (le scénario n\'est pas modifié)');
}

// --- tour : invariants ---
const partie = (graine, coupe) => {
  let e = Etat.creerEtat(CHAMPS, graine); const traces = [];
  while (!e.fin) {
    if (coupe && e.tour === coupe) e = JSON.parse(JSON.stringify(e));   // sauvegarde et rechargement
    e = Tour.tourSuivant(e, []);
    traces.push(JSON.stringify(e));
  }
  return traces;
};
{
  const a = partie(42), b = partie(42), c = partie(42, 30);
  check(a.length === 60, 'tour : une partie dure 60 tours');
  check(egal(a, b), 'déterminisme : même graine, même partie (60 tours, état complet à chaque tour)');
  check(egal(a, c), 'déterminisme : identique après sauvegarde JSON et rechargement au tour 30');
  const e0 = gele(Etat.creerEtat(CHAMPS, 3)), avant = JSON.stringify(e0);
  let e1; try { e1 = Tour.tourSuivant(e0, []); } catch (err) { e1 = null; }
  check(e1 && JSON.stringify(e0) === avant && e1 !== e0, 'tour : l\'état reçu n\'est jamais modifié (état gelé)');
  check(e1 && e1.tour === 2, 'tour : le compteur avance');
  let refuse = false; try { Tour.tourSuivant(e0, [{ type: 'inventee' }]); } catch (err) { refuse = true; }
  check(refuse, 'tour : une action absente de actionsDisponibles est refusée');
  const r = Alea.creer(9); Alea.suivant(r); Alea.suivant(r);
  check(Tour.tourSuivant(e0, [], r).alea === r.s, 'tour : le hasard injecté est rangé dans le nouvel état');
  const fin = JSON.parse(a[a.length - 1]);
  check(fin.fin && egal(Tour.actionsDisponibles(fin), []), 'tour : plus aucune action après la fin');
}

console.log(`\n${n - fail}/${n} tests réussis`);
process.exit(fail ? 1 : 0);

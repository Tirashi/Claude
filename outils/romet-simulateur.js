/* Romet : simulateur sans navigateur (physique et règles de romet/physique.js et romet/machines.js).
   node outils/romet-simulateur.js            vérifications rapides (lancées par verifications.js) :
                                              tas reproductible, sauvegarde et reprise, pièces endormies, pas de NaN
   node outils/romet-simulateur.js 8 [id]     + 8 parties par machine prête (ou la seule machine id) avec un joueur au hasard
                                              (une pièce toutes les 0,4 s, entre x = -1,6 et 1,6) : durée, lâchers, butin, rendement, trésors ;
                                              puis le nombre de parties pour finir la machine (trésors gardés d'une partie à l'autre)
   Cahier des charges : specs/romet.md (§ 5, la bourse). */
'use strict';
const path = require('path');
const P = require(path.join(__dirname, '..', 'romet', 'physique.js'));
const M = require(path.join(__dirname, '..', 'romet', 'machines.js'));
let fail = 0;
const verif = (c, msg) => { if (!c) { console.log('ÉCHEC ' + msg); fail++; } };

// joue une partie jusqu'au bout (ou max pas) ; lâche une pièce tous les `cadence` pas à un x au hasard
function jouer(m, acquis, graine, max, cadence) {
  const p = new M.Partie(m, acquis, null, graine), h = new P.Hasard(graine * 7 + 3);
  let pas = 0, tresors = 0, dormeurs = 0, mesures = 0, plusHaut = 0;
  while (!p.fini && pas < max) {
    if (pas % (cadence || 24) === 0) p.lacher((h.n() - .5) * 3.2);
    p.pas(); pas++;
    for (const e of p.evts) if (e.t === 'tresor' && e.nouveau) tresors++;
    p.evts.length = 0;
    if (pas % 60 === 0) { mesures++; for (const o of p.pl.objets) { if (o.dort) dormeurs++; if (o.y > plusHaut) plusHaut = o.y; } dormeurs /= 1; }
  }
  return { p, pas, tresors, dort: mesures ? dormeurs / mesures / Math.max(1, p.pl.objets.length) : 0, plusHaut };
}

// 1. vérifications rapides
const foire = M.machine('foire');
{
  const a = jouer(foire, [0, 0, 0, 0, 0, 0].map(Boolean), 42, 900), b = jouer(foire, [0, 0, 0, 0, 0, 0].map(Boolean), 42, 900);
  verif(JSON.stringify(a.p.sauver()) === JSON.stringify(b.p.sauver()), 'même graine, même tas (reproductible)');
  verif(a.p.pl.objets.every(o => isFinite(o.x) && isFinite(o.y) && isFinite(o.z)), 'positions finies (pas de NaN)');
  verif(a.p.pl.objets.length > 100 && a.p.pl.objets.length < P.MAXP, 'nombre de pièces raisonnable : ' + a.p.pl.objets.length);
  verif(a.p.pl.objets.some(o => o.dort), 'des pièces au repos s\'endorment');
  // sauvegarde et reprise : JSON aller-retour, la partie continue sans rien perdre d'un coup
  const s = JSON.parse(JSON.stringify(a.p.sauver())), q = new M.Partie(foire, [0, 0, 0, 0, 0, 0].map(Boolean), s);
  verif(q.pl.objets.length === s.pl.o.length && q.bourse === a.p.bourse && q.butin === a.p.butin, 'reprise : même tas, même bourse, même butin');
  // la partie reprise et l'originale continuent 3 s sans lâcher : à peu près autant de pièces tombent (le tas ne s'effondre pas)
  const tomber = x => { let k = 0; for (let i = 0; i < 180; i++) { x.pas(); for (const e of x.evts) if (e.t === 'gain' || e.t === 'perte') k++; x.evts.length = 0; } return k; };
  const tq = tomber(q), ta = tomber(a.p);
  verif(Math.abs(tq - ta) <= 6 + ta * .3, `reprise : le tas tient comme l'original (${tq} pièces tombées en 3 s, ${ta} sans sauvegarde)`);
  // fin de partie : bourse vide, rien qui tombe pendant 3 s
  const r = new M.Partie(foire, [0, 0, 0, 0, 0, 0].map(Boolean), null, 5); r.bourse = 0; let k = 0;
  while (!r.fini && k < 60 * 120) { r.bourse = 0; r.pas(); k++; }
  verif(r.fini && r.evts.some(e => e.t === 'fin'), 'fin de partie quand la bourse est vide');
  verif(!r.lacher(0), 'plus de lâcher après la fin');
  // ruche : le miel colle
  const ru = M.machine('ruche'), pr = jouer(ru, [0, 0, 0, 0, 0, 0].map(Boolean), 9, 600);
  verif(pr.p.pl.objets.every(o => isFinite(o.x) && isFinite(o.y)), 'ruche : positions finies');
  // les règles des autres machines : chaque machine prête tourne 15 s sans NaN et rend des pièces
  for (const m of M.MACHINES.filter(m => m.pret && m.id !== 'foire' && m.id !== 'ruche')) {
    const r = jouer(m, m.tresors.map(() => false), 3, 900);
    verif(r.p.pl.objets.every(o => isFinite(o.x) && isFinite(o.y) && isFinite(o.z)), m.id + ' : positions finies');
    verif(r.p.butin > 0, m.id + ' : des pièces tombent dans le bac');
    verif(m.tresors.length === 6 && m.textes && m.bourse > 0, m.id + ' : 6 trésors, textes, bourse');
  }
  // épave : le courant pousse le tas de côté
  { const p = new M.Partie(M.machine('epave'), Array(6).fill(false), null, 4); p.courantT = 0; const x0 = p.pl.objets.reduce((a, o) => a + o.x, 0) / p.pl.objets.length;
    for (let i = 0; i < 100; i++) p.pas(); const x1 = p.pl.objets.reduce((a, o) => a + o.x, 0) / p.pl.objets.length;
    verif(Math.sign(x1 - x0) === p.sens && Math.abs(x1 - x0) > .02, `épave : le courant pousse le tas (${(x1 - x0).toFixed(3)})`); }
  // casino : un couloir allumé, une pièce qui y tombe compte double
  { const p = new M.Partie(M.machine('casino'), Array(6).fill(false), null, 4); p.pas(); verif(p.couloirs.filter(Boolean).length === 1, 'casino : un couloir allumé');
    const i = p.couloirs.indexOf(true), x = -2.6 + 5.2 / 7 * (i + .5); p.pl.ajouter('piece', x, .05, 3.45).vz = 3; let v = 0;
    for (let k = 0; k < 120 && !v; k++) { p.pas(); for (const e of p.evts) if (e.t === 'gain' && e.double) v = e.v; p.evts.length = 0; }
    verif(v === 2, 'casino : une pièce dans le couloir allumé compte double'); }
  // foire de nuit : les clous dévient la pièce
  { const p = new M.Partie(M.machine('nuit'), Array(6).fill(false), null, 4); let d = 0;
    for (let k = 0; k < 20; k++) { p.lacher(0); const o = p.pl.objets[p.pl.objets.length - 1]; d += Math.abs(o.gx * o.gn); }
    verif(d > 2, 'foire de nuit : les clous dévient les pièces'); }
}

// 2. équilibrage (si on donne un nombre de parties)
const n = +process.argv[2] || 0, seule = process.argv[3];
if (n) {
  const ms = M.MACHINES.filter(m => m.pret && (!seule || m.id === seule));
  for (const m of ms) {
    let pas = 0, lachers = 0, butin = 0, tres = 0, dort = 0, haut = 0, max = 0;
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const r = jouer(m, m.tresors.map(() => false), 1000 + i, 60 * 60 * 20);
      pas += r.pas; lachers += r.p.lachers; butin += r.p.butin; tres += r.tresors; dort += r.dort; haut += r.plusHaut; max = Math.max(max, r.p.butin);
    }
    const ms1 = (Date.now() - t0) / (pas || 1);
    console.log(`${m.nom.padEnd(18)} bourse ${m.bourse} : ${(pas / n / 3600).toFixed(1)} min, ${(lachers / n).toFixed(0)} lâchers, butin ${(butin / n).toFixed(0)} (max ${max}), ` +
      `rendement ${(butin / lachers * 100).toFixed(0)} %, trésors ${(tres / n).toFixed(1)} par partie, au repos ${(dort / n * 100).toFixed(0)} %, tas ${(haut / n).toFixed(2)}, ${ms1.toFixed(2)} ms/pas`);
    // parties pour finir la machine (trésors gardés)
    const fins = [];
    for (let j = 0; j < Math.min(n, 4); j++) {
      const acq = m.tresors.map(() => false); let k = 0;
      while (!acq.every(Boolean) && k < 12) { jouer(m, acq, 5000 + j * 50 + k, 60 * 60 * 20); k++; }
      fins.push(acq.every(Boolean) ? k : '>12');
    }
    console.log(`${''.padEnd(18)} parties pour finir : ${fins.join(', ')}`);
  }
}
if (fail) { console.log(fail + ' échec(s)'); process.exit(1); }
console.log('Romet : tout va bien.');

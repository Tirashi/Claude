/* Doggy Saga : le joueur automatique (« joueur moyen ») utilisé par le générateur de niveaux et le simulateur.
   Il essaie chaque coup possible sur une copie de la partie (avec un autre tirage pour les chiens qui tombent,
   pour ne pas « voir l'avenir »), garde le meilleur selon les objectifs, et joue parfois un coup au hasard. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
if (typeof dogNouvelle === 'undefined') vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'doggy-saga', 'regles.js'), 'utf8'), { filename: 'doggy-saga/regles.js' });
/* global dogNouvelle, dogCoup, dogCoupsPossibles, dogCopie, dogObjectifsFaits, dogBoueRestante, dogGraine, dogAlea, dogCalinsTotal */

function hauteurChiots(e) { let s = 0; e.g.forEach((p, i) => { if (p && p.ch) s += Math.floor(i / 8); }); return s; }
function bonusSurPlateau(e) { let s = 0; for (const p of e.g) if (p && p.sp) s += p.sp === 4 ? 3 : p.sp === 3 ? 2 : 1.5; return s; }

function valeur(e0, e) {
  if (e.mode === 'jour') return dogCalinsTotal(e) - dogCalinsTotal(e0) + (bonusSurPlateau(e) - bonusSurPlateau(e0)) * 2;
  if (e.fin === 'gagne') return 1e6;
  let v = 0;
  for (const o of e.obj) {
    if (o.k === 'calins') v += (Math.min(o.n, e.calins[o.t]) - Math.min(o.n, e0.calins[o.t])) * 1.5;
    else if (o.k === 'boue') v += (dogBoueRestante(e0) - dogBoueRestante(e)) * 2.5;
    else if (o.k === 'chiots') v += (e.chiotsSauves - e0.chiotsSauves) * 20 + (hauteurChiots(e) - hauteurChiots(e0)) * 1.5;
  }
  return v + (e.score - e0.score) / 500 + (bonusSurPlateau(e) - bonusSurPlateau(e0)) * 1.5;
}

/* joue une partie ; habile = part des coups où il prend le meilleur coup (sinon un coup au hasard)
   rend { fin, gagneAu (coups joués quand l'objectif est rempli, ou null), score, coupsJoues } */
function jouer(niv, graine, opts) {
  opts = opts || {};
  const habile = opts.habile === undefined ? 0.7 : opts.habile;
  const n = Object.assign({}, niv, { coups: opts.coups || niv.coups });
  const e = dogNouvelle(n, graine, opts.mode || 'niveau');
  const R = { rng: dogGraine('joueur|' + graine) };
  let gagneAu = null;
  for (let garde = 0; !e.fin && garde < 400; garde++) {
    const l = dogCoupsPossibles(e);
    if (!l.length) throw new Error('aucun coup possible (niveau ' + niv.id + ')');
    let choix;
    if (dogAlea(R) < habile) {
      let best = -Infinity;
      for (const m of l) {
        const c = dogCopie(e);
        c.rng = (dogAlea(R) * 4294967296) >>> 0;
        const r = dogCoup(c, m[0], m[1]);
        if (!r || !r.ok) continue;
        const v = valeur(e, c) + dogAlea(R) * 0.01;
        if (v > best) { best = v; choix = m; }
      }
    }
    if (!choix) choix = l[Math.floor(dogAlea(R) * l.length)];
    const r = dogCoup(e, choix[0], choix[1]);
    if (!r || !r.ok) throw new Error('coup refusé ' + choix);
    if (e.fin === 'gagne') gagneAu = e.coupsJoues;
  }
  return { fin: e.fin, gagneAu, score: e.score, coupsJoues: e.coupsJoues, calins: dogCalinsTotal(e) };
}

module.exports = { jouer };

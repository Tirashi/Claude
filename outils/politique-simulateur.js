/* Politique : simulateur en lot (M4, specs/politique/plan-simulateur.md).
   node outils/politique-simulateur.js [--parties 200] [--bot nom|tous] [--tours 60] [--graine 1] [--json fichier] [--controle]
   Joue des parties complètes avec les bots de politique-bots.js (graine de la partie n = graine + n),
   relève des métriques par partie et affiche un résumé par bot (médianes) ; --json écrit tout le détail.
   --controle (lancé par verifications.js) : quelques parties par bot, vérifie qu'aucun bot ne joue d'action refusée,
   que la même graine redonne la même partie (aussi après sauvegarde JSON) ; code de sortie 1 sinon. */
'use strict';
const fs = require('fs'), path = require('path');
const P = f => require(path.join(__dirname, '..', 'politique', f));
const Etat = P('moteur/etat.js'), Tour = P('moteur/tour.js');
const CHAMPS = P('donnees/champs.js'), { LOIS } = P('donnees/lois.js');
const Bots = require('./politique-bots.js');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; };
const med = xs => { const t = xs.filter(x => x != null).sort((a, b) => a - b); return t.length ? t[Math.floor(t.length / 2)] : null; };
const pct = (k, n) => Math.round(100 * k / n) + ' %';
const r0 = x => x == null ? '-' : Math.round(x);

// une partie : métriques relevées tour par tour
function partie(nom, graine, tours, coupe){
  let e = Etat.creerEtat(CHAMPS, graine);
  if (tours) e.tourMax = tours;
  const bot = Bots.creer(nom, graine);
  const m = { graine, issue: null, duree: 0, tresor: {}, cp: {}, reputation: {}, toursGuerre: 0, guerres: 0, declareesParNous: 0,
              batailles: { gagnees: 0, perdues: 0 }, tours55: 0, tours75: 0, greves: 0, apaisements: 0,
              loisAdoptees: [], catalogueComplet: null, colereMax: 0 };
  const adoptees = new Set(), traces = [];
  while (!e.fin){
    if (coupe && e.tour === coupe) e = JSON.parse(JSON.stringify(e));
    const acts = bot(e);
    m.apaisements += acts.filter(a => a.type === 'apaiser').length;
    m.declareesParNous += acts.filter(a => a.type === 'declarer_guerre').length;
    const avant = !!e.guerre;
    e = Tour.tourSuivant(e, acts);
    const t = e.tour - 1;
    if (e.guerre) m.toursGuerre++;
    if (!avant && e.guerre) m.guerres++;
    for (const l of e.journal){
      if (/^Bataille/.test(l)) l.includes('victoire') ? m.batailles.gagnees++ : m.batailles.perdues++;
      const a = /^Loi adoptée : (.+?)(?: \(|\.)/.exec(l);
      if (a) { const id = Object.keys(LOIS).find(k => LOIS[k].nom === a[1]); if (id) adoptees.add(id); }
    }
    if (adoptees.size === Object.keys(LOIS).length && m.catalogueComplet == null) m.catalogueComplet = t;
    const c = Object.values(e.factions).map(x => x.colere);
    if (c.some(x => x >= 55)) m.tours55++;
    if (c.some(x => x >= 75)) m.tours75++;
    if (Object.values(e.factions).some(x => x.statut === 'greve')) m.greves++;
    m.colereMax = Math.max(m.colereMax, ...c);
    if ([20, 30, 40, 60].includes(t)) { m.tresor[t] = e.tresor; m.cp[t] = e.cp; m.reputation[t] = e.reputation; }
    if (coupe != null) traces.push(JSON.stringify(e));
  }
  m.issue = e.issue.type; m.duree = e.tour - 1; m.loisAdoptees = [...adoptees]; m.reputationFin = e.reputation;
  return coupe != null ? { m, traces } : m;
}

function resume(nom, ms){
  const n = ms.length, fins = {};
  for (const m of ms) fins[m.issue] = (fins[m.issue] || 0) + 1;
  const vivantes = t => ms.filter(m => m.tresor[t] != null);
  return {
    bot: nom, parties: n, fins, dureeMediane: med(ms.map(m => m.duree)),
    tresor: Object.fromEntries([20, 30, 40, 60].map(t => [t, med(vivantes(t).map(m => m.tresor[t]))])),
    cp: Object.fromEntries([20, 40, 60].map(t => [t, med(vivantes(t).map(m => m.cp[t]))])),
    reputation30: med(vivantes(30).map(m => m.reputation[30])), reputationFin: med(ms.map(m => m.reputationFin)),
    avecGuerre: ms.filter(m => m.guerres > 0).length, toursGuerre: med(ms.map(m => m.toursGuerre)),
    batailles: { gagnees: ms.reduce((s, m) => s + m.batailles.gagnees, 0) / n, perdues: ms.reduce((s, m) => s + m.batailles.perdues, 0) / n },
    tours55: med(ms.map(m => m.tours55)), tours75: med(ms.map(m => m.tours75)), avecGreve: ms.filter(m => m.greves > 0).length,
    apaisements: med(ms.map(m => m.apaisements)), lois: med(ms.map(m => m.loisAdoptees.length)),
    catalogueComplet: ms.filter(m => m.catalogueComplet != null).length, colereMax: med(ms.map(m => m.colereMax))
  };
}

function afficher(r){
  const n = r.parties;
  console.log(`\n== ${r.bot} (${n} parties)`);
  console.log(`  fins : ${Object.entries(r.fins).map(([k, v]) => `${k} ${pct(v, n)}`).join(', ')} ; durée médiane ${r.dureeMediane} tours`);
  console.log(`  trésor médian : t20 ${r0(r.tresor[20])}, t30 ${r0(r.tresor[30])}, t40 ${r0(r.tresor[40])}, t60 ${r0(r.tresor[60])} ; capital politique t20 ${r0(r.cp[20])}, t40 ${r0(r.cp[40])}, t60 ${r0(r.cp[60])}`);
  console.log(`  réputation médiane : t30 ${r0(r.reputation30)}, fin ${r0(r.reputationFin)}`);
  console.log(`  guerre : ${pct(r.avecGuerre, n)} des parties, ${r0(r.toursGuerre)} tours (médiane) ; batailles par partie : ${r.batailles.gagnees.toFixed(1)} gagnées, ${r.batailles.perdues.toFixed(1)} perdues`);
  console.log(`  factions : colère max ${r0(r.colereMax)}, tours ≥ 55 : ${r0(r.tours55)}, ≥ 75 : ${r0(r.tours75)} (médianes) ; grève dans ${pct(r.avecGreve, n)} des parties ; ${r0(r.apaisements)} apaisements`);
  console.log(`  lois adoptées : ${r0(r.lois)} sur ${Object.keys(LOIS).length} (médiane) ; catalogue complet dans ${pct(r.catalogueComplet, n)} des parties`);
}

function controle(){
  let fail = 0;
  const check = (ok, msg) => { console.log((ok ? 'ok    ' : 'ÉCHEC ') + msg); if (!ok) fail++; };
  for (const nom of Bots.noms){
    let erreur = null, a, b;
    try { a = partie(nom, 3, null, 0); b = partie(nom, 3, null, 17); } catch (err) { erreur = err.message; }
    check(!erreur, `${nom} : parties jouées sans action refusée${erreur ? ' — ' + erreur : ''}`);
    if (!erreur) check(JSON.stringify(a.traces) === JSON.stringify(b.traces), `${nom} : même graine, même partie (aussi après sauvegarde JSON au tour 17)`);
  }
  const rep = partie('replica', 1);
  check(rep.loisAdoptees.length >= 3, `replica : rejoue la trajectoire de la partie 1 (${rep.loisAdoptees.length} lois adoptées, fin ${rep.issue} au tour ${rep.duree})`);
  process.exit(fail ? 1 : 0);
}

if (require.main === module){
  if (process.argv.includes('--controle')) controle();
  const N = Number(arg('parties', 200)), G = Number(arg('graine', 1)), T = arg('tours') ? Number(arg('tours')) : null;
  const choix = arg('bot', 'tous'), noms = choix === 'tous' ? Bots.noms : choix.split(',');
  const sortie = { parametres: { parties: N, graine: G, tours: T || CHAMPS.tours, bots: noms }, bots: {} };
  for (const nom of noms){
    const ms = [];
    for (let i = 0; i < N; i++) ms.push(partie(nom, G + i, T));
    const r = resume(nom, ms);
    afficher(r);
    if (nom === 'replica') console.log(`  non-régression (partie 1 au tour 30 : 3214 or, réputation +42) : ${r0(r.tresor[30])} or, ${r0(r.reputation30)} (médianes des parties encore en cours au tour 30)`);
    sortie.bots[nom] = { resume: r, parties: ms };
  }
  const f = arg('json');
  if (f){ fs.writeFileSync(f, JSON.stringify(sortie)); console.log('\nDétail écrit dans ' + f); }
}

module.exports = { partie, resume };

/* Politique : simulateur en lot (M4, M5 ; specs/politique/plan-simulateur.md).
   node outils/politique-simulateur.js [--parties 200] [--bot nom,nom|tous] [--tours 60] [--graine 1] [--json fichier]
        [--regle chemin=valeur]... [--balayage chemin=v1,v2,v3] [--controle] [--objectifs [--seuils-proposes]]
        [--pays nom,nom|tous]
   Joue des parties complètes avec les bots de politique-bots.js (graine de la partie n = graine + n : tous les bots
   jouent les mêmes graines), relève des métriques par partie, affiche un résumé par bot et la stratégie dominante.
   --regle : change une valeur des données pour ce lancement (chemin = fichier de donnees/ puis clés, ex.
             guerre.defaite.colere=5, champs.nations.val_roc.tresor=200, factions.REGLES_FACTIONS.apaisement.cout=20).
   --balayage : rejoue tout pour chaque valeur d'un chemin et affiche un tableau comparatif (rien n'est écrit sur disque).
   --pays : pays de départ des parties (donnees/pays.js ; défaut : equilibre ; tous = un lot par pays).
   --json : tout le détail. --controle (lancé par verifications.js) : chaque bot joue sans action refusée, même graine =
   même partie (aussi après sauvegarde JSON), réglages remis en place après un balayage ; code de sortie 1 sinon. */
'use strict';
const fs = require('fs'), path = require('path');
const P = f => require(path.join(__dirname, '..', 'politique', f));
const Etat = P('moteur/etat.js'), Tour = P('moteur/tour.js'), Diplo = P('moteur/diplomatie.js'), Ob = P('moteur/objectifs.js'), OD = P('donnees/objectifs.js');
const CHAMPS = P('donnees/champs.js'), { LOIS } = P('donnees/lois.js'), PAYS = P('donnees/pays.js');
let PAYS_PARTIE = 'equilibre';   // --pays : pays de départ des parties (donnees/pays.js)
const Bots = require('./politique-bots.js');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; };
const args = k => process.argv.map((a, i) => a === '--' + k ? process.argv[i + 1] : null).filter(Boolean);
const med = xs => { const t = xs.filter(x => x != null).sort((a, b) => a - b); return t.length ? t[Math.floor(t.length / 2)] : null; };
const pct = (k, n) => Math.round(100 * k / n) + ' %';
const r0 = x => x == null ? '-' : Math.round(x);

// --- réglages : les modules de données sont partagés avec le moteur (même cache de require) ---
const RACINES = { economie: 'economie', lois: 'lois', batiments: 'batiments', factions: 'factions', diplomatie: 'diplomatie', guerre: 'guerre', champs: 'champs', objectifs: 'objectifs', pays: 'pays' };
function cible(chemin){
  const morceaux = chemin.split('.'), racine = RACINES[morceaux[0]];
  if (!racine) throw new Error(`réglage inconnu : ${chemin} (racines : ${Object.keys(RACINES).join(', ')})`);
  let o = P(`donnees/${racine}.js`);
  for (const k of morceaux.slice(1, -1)) { if (o[k] == null) throw new Error('réglage inconnu : ' + chemin); o = o[k]; }
  const cle = morceaux[morceaux.length - 1];
  if (!(cle in o)) throw new Error('réglage inconnu : ' + chemin);
  return { o, cle };
}
const lire = chemin => { const c = cible(chemin); return c.o[c.cle]; };
const valeur = v => v === 'true' ? true : v === 'false' ? false : /^[\[{]/.test(v) ? JSON.parse(v) : isNaN(Number(v)) ? v : Number(v);   // objets et listes en JSON
// applique des réglages { chemin: valeur } et renvoie de quoi les annuler
function regler(reglages){
  const avant = {};
  for (const ch in reglages) { const c = cible(ch); avant[ch] = c.o[c.cle]; c.o[c.cle] = reglages[ch]; }
  return () => { for (const ch in avant) { const c = cible(ch); c.o[c.cle] = avant[ch]; } };
}

// décisions politiques (lois, traités, contrats, guerre ; pas les bâtiments, toujours possibles dès qu'on a 60 or) :
// tour sans vraie décision s'il y en a au plus une (ASSUMPTION (M5))
const FOND = ['loi', 'contrat', 'traite', 'bataille', 'imposer_paix', 'paix_blanche', 'recruter'];
const decisions = e => new Set(Tour.actionsDisponibles(e).filter(a => FOND.includes(a.type)).map(a => a.type === 'imposer_paix' ? 'imposer_paix' : a.type + ':' + (a.id || '') + ':' + (a.avec || ''))).size;

// --- une partie : métriques relevées tour par tour ---
function partie(nom, graine, tours, coupe){
  let e = Etat.creerEtat(CHAMPS, graine, PAYS_PARTIE);
  if (tours != null) { if (!Number.isInteger(tours) || tours < 1) throw new Error('nombre de tours invalide : ' + tours); e.tourMax = tours; }
  const bot = Bots.creer(nom, graine);
  const m = { graine, issue: null, duree: 0, tresor: {}, reputation: {}, debats: 0, abandons: 0, toursGuerre: 0, guerres: 0, declareesParNous: 0,
              issuesGuerres: { gagnees: 0, perdues: 0, blanches: 0 }, batailles: { gagnees: 0, perdues: 0 },
              tours55: 0, tours75: 0, greves: 0, apaisements: 0, sansDecision: 0, regionsGagnees: 0, regionsPerdues: 0, regimentsMax: 0, toursOccupes: 0, toursDette: 0, toursFaillite: 0, impotsHaut: 0, evenements: 0, loisAdoptees: [], catalogueComplet: null, colereMax: 0 };
  const adoptees = new Set(), traces = [];
  while (!e.fin){
    if (coupe && e.tour === coupe) e = JSON.parse(JSON.stringify(e));
    if (decisions(e) <= 1) m.sansDecision++;
    const acts = bot(e);
    m.apaisements += acts.filter(a => a.type === 'apaiser').length;
    m.debats += acts.filter(a => a.type === 'loi').length; m.abandons += acts.filter(a => a.type === 'abandonner').length;
    m.declareesParNous += acts.filter(a => a.type === 'declarer_guerre').length;
    const avant = !!e.guerre;
    e = Tour.tourSuivant(e, acts);
    const t = e.tour - 1;
    if (e.guerre) m.toursGuerre++;
    m.regimentsMax = Math.max(m.regimentsMax, e.regiments || 0);
    if (e.tresor < 0) m.toursDette++;
    if (e.tresor < -300) m.toursFaillite++;
    if (e.impots === 'haut') m.impotsHaut++;
    if (Object.keys(e.regions).some(r => (e.occupations || {})[r])) m.toursOccupes++;
    if (!avant && e.guerre) m.guerres++;
    for (const l of e.journal){
      if (/^Bataille/.test(l)) l.includes('victoire') ? m.batailles.gagnees++ : m.batailles.perdues++;
      if (l === "Paix : l'ennemi capitule.") m.issuesGuerres.gagnees++;
      if (l === 'Paix : nous capitulons.') m.issuesGuerres.perdues++;
      if (l === 'Paix blanche.') m.issuesGuerres.blanches++;
      if (/^Événement/.test(l)) m.evenements++;
      if (/^Cession : .* passe à nous/.test(l)) m.regionsGagnees++;
      if (/^Cession : .* passe à (?!nous)/.test(l)) m.regionsPerdues++;
      const a = /^Loi adoptée : (.+?)(?: \(|\.)/.exec(l);
      if (a) { const id = Object.keys(LOIS).find(k => LOIS[k].nom === a[1]); if (id) adoptees.add(id); }
    }
    if (adoptees.size === Object.keys(LOIS).length && m.catalogueComplet == null) m.catalogueComplet = t;
    const c = Object.values(e.factions).map(x => x.colere);
    if (c.some(x => x >= 55)) m.tours55++;
    if (c.some(x => x >= 75)) m.tours75++;
    if (Object.values(e.factions).some(x => x.statut === 'greve')) m.greves++;
    m.colereMax = Math.max(m.colereMax, ...c);
    if ([10, 20, 30, 40].includes(t)) { m.tresor[t] = e.tresor; m.reputation[t] = Diplo.reputation(e); }
    if (coupe != null) traces.push(JSON.stringify(e));
  }
  m.issue = e.issue.type; m.duree = e.tour - 1; m.loisAdoptees = [...adoptees]; m.reputationFin = Diplo.reputation(e); m.tresorFin = e.tresor;
  m.objectifs = Ob.mesures(e); m.medailles = Ob.medailles(e); m.ambition = e.ambition; m.etapes = e.suivi.etapes;
  return coupe != null ? { m, traces } : m;
}

function resume(nom, ms){
  const n = ms.length, fins = {}, jamais = new Set(Object.keys(LOIS));
  for (const m of ms) { fins[m.issue] = (fins[m.issue] || 0) + 1; m.loisAdoptees.forEach(l => jamais.delete(l)); }
  const vivantes = t => ms.filter(m => m.tresor[t] != null);
  const somme = f => ms.reduce((s, m) => s + f(m), 0);
  return {
    bot: nom, parties: n, fins, revolution: (fins.revolution || 0) / n, dureeMediane: med(ms.map(m => m.duree)),
    tresor: Object.fromEntries([10, 20, 30, 40].map(t => [t, med(vivantes(t).map(m => m.tresor[t]))])),
    debats: med(ms.map(m => m.debats)), abandons: med(ms.map(m => m.abandons)),
    reputation30: med(vivantes(30).map(m => m.reputation[30])), reputationFin: med(ms.map(m => m.reputationFin)),
    avecGuerre: ms.filter(m => m.guerres > 0).length, toursGuerre: med(ms.map(m => m.toursGuerre)),
    guerres: { gagnees: somme(m => m.issuesGuerres.gagnees) / n, perdues: somme(m => m.issuesGuerres.perdues) / n, blanches: somme(m => m.issuesGuerres.blanches) / n },
    batailles: { gagnees: somme(m => m.batailles.gagnees) / n, perdues: somme(m => m.batailles.perdues) / n },
    tours55: med(ms.map(m => m.tours55)), tours75: med(ms.map(m => m.tours75)), avecGreve: ms.filter(m => m.greves > 0).length,
    apaisements: med(ms.map(m => m.apaisements)), lois: med(ms.map(m => m.loisAdoptees.length)), jamaisAdoptees: [...jamais],
    catalogueComplet: ms.filter(m => m.catalogueComplet != null).length, colereMax: med(ms.map(m => m.colereMax)),
    sansDecision: med(ms.map(m => m.sansDecision / m.duree)),
    regionsGagnees: somme(m => m.regionsGagnees) / n, regionsPerdues: somme(m => m.regionsPerdues) / n,
    regimentsMax: med(ms.map(m => m.regimentsMax)), avecDette: ms.filter(m => m.toursDette > 0).length, avecFaillite: ms.filter(m => m.toursFaillite > 0).length, impotsHaut: med(ms.map(m => m.impotsHaut)), evenements: med(ms.map(m => m.evenements)), toursOccupes: med(ms.map(m => m.toursOccupes))
  };
}

// stratégie dominante (ASSUMPTION (M5)) : sur une même graine, A bat B s'il finit la partie et pas B, ou si les deux
// finissent pareil et que A a plus d'or à la fin (révolution : celui qui tient le plus longtemps) ;
// dominante = bat chaque autre bot sur plus de SEUIL des graines
const SEUIL_DOMINANCE = 0.75;
const valeurPartie = m => m.issue === 'fin' ? [1, m.tresorFin] : [0, m.duree];
const bat = (a, b) => { const x = valeurPartie(a), y = valeurPartie(b); return x[0] !== y[0] ? x[0] > y[0] : x[1] > y[1]; };
function dominance(parBot){
  const noms = Object.keys(parBot), tableau = {};
  for (const a of noms) {
    tableau[a] = {};
    for (const b of noms) if (a !== b) {
      const n = Math.min(parBot[a].length, parBot[b].length);
      let k = 0; for (let i = 0; i < n; i++) if (bat(parBot[a][i], parBot[b][i])) k++;
      tableau[a][b] = k / n;
    }
  }
  const dominants = noms.filter(a => noms.length > 1 && Object.values(tableau[a]).every(x => x > SEUIL_DOMINANCE));
  return { tableau, dominants };
}

function afficher(r){
  const n = r.parties;
  console.log(`\n== ${r.bot} (${n} parties)`);
  console.log(`  fins : ${Object.entries(r.fins).map(([k, v]) => `${k} ${pct(v, n)}`).join(', ')} ; durée médiane ${r.dureeMediane} tours`);
  console.log(`  trésor médian : t10 ${r0(r.tresor[10])}, t20 ${r0(r.tresor[20])}, t30 ${r0(r.tresor[30])}, t40 ${r0(r.tresor[40])}`);
  console.log(`  réputation médiane (moyenne des relations) : t30 ${r0(r.reputation30)}, fin ${r0(r.reputationFin)}`);
  console.log(`  guerre : ${pct(r.avecGuerre, n)} des parties, ${r0(r.toursGuerre)} tours (médiane) ; par partie : guerres gagnées ${r.guerres.gagnees.toFixed(2)}, perdues ${r.guerres.perdues.toFixed(2)}, paix blanches ${r.guerres.blanches.toFixed(2)} ; batailles ${r.batailles.gagnees.toFixed(1)} gagnées, ${r.batailles.perdues.toFixed(1)} perdues`);
  console.log(`  budget : dette dans ${pct(r.avecDette, n)} des parties, faillite dans ${pct(r.avecFaillite, n)} ; impôts hauts ${r0(r.impotsHaut)} tours (médiane) ; ${r0(r.evenements)} événements par partie (médiane)`);
  console.log(`  armée : ${r0(r.regimentsMax)} régiments au plus (médiane) ; ${r0(r.toursOccupes)} tours avec une région occupée (médiane) ; régions par partie : ${r.regionsGagnees.toFixed(2)} gagnées, ${r.regionsPerdues.toFixed(2)} perdues`);
  console.log(`  factions : colère max ${r0(r.colereMax)}, tours ≥ 55 : ${r0(r.tours55)}, ≥ 75 : ${r0(r.tours75)} (médianes) ; grève dans ${pct(r.avecGreve, n)} des parties ; ${r0(r.apaisements)} apaisements`);
  console.log(`  débats ouverts : ${r0(r.debats)}, abandonnés : ${r0(r.abandons)} (médianes)`);
  console.log(`  lois adoptées : ${r0(r.lois)} sur ${Object.keys(LOIS).length} (médiane) ; jamais adoptées : ${r.jamaisAdoptees.length ? r.jamaisAdoptees.join(', ') : 'aucune'} ; catalogue complet dans ${pct(r.catalogueComplet, n)} des parties`);
  console.log(`  tours sans vraie décision politique (≤ 1 loi, traité, contrat ou action de guerre possible) : ${pct(Math.round(100 * r.sansDecision), 100)} (médiane)`);
}
function afficherDominance(d){
  const noms = Object.keys(d.tableau);
  console.log('\n== Confrontations (part des graines où la ligne bat la colonne)');
  console.log('  ' + ''.padEnd(15) + noms.map(b => b.slice(0, 8).padStart(9)).join(''));
  for (const a of noms) console.log('  ' + a.padEnd(15) + noms.map(b => (a === b ? '—' : Math.round(100 * d.tableau[a][b]) + '%').padStart(9)).join(''));
  console.log(`  stratégie dominante (bat chaque autre bot sur plus de ${100 * SEUIL_DOMINANCE} % des graines) : ${d.dominants.length ? d.dominants.join(', ') : 'aucune'}`);
}

// joue N parties par bot avec des réglages ; renvoie { resumes, parties }
function lot(noms, N, G, T, reglages){
  const annuler = regler(reglages || {});
  try {
    const parties = {}, resumes = {};
    for (const nom of noms) { parties[nom] = []; for (let i = 0; i < N; i++) parties[nom].push(partie(nom, G + i, T)); resumes[nom] = resume(nom, parties[nom]); }
    return { resumes, parties };
  } finally { annuler(); }
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
  const avant = lire('economie.croissance'), sans = lot(['economy'], 2, 5).resumes.economy;
  const change = lot(['economy'], 2, 5, null, { 'economie.croissance': 0.05 }).resumes.economy;
  check(lire('economie.croissance') === avant && JSON.stringify(lot(['economy'], 2, 5).resumes.economy) === JSON.stringify(sans), 'réglages : remis en place après un lot (même résultat avant et après)');
  check(JSON.stringify(change) !== JSON.stringify(sans), 'réglages : un réglage change bien les parties');
  let refuse = false; try { regler({ 'guerre.inexistant': 1 }); } catch (err) { refuse = true; }
  check(refuse, 'réglages : un chemin inconnu est refusé');
  const d = dominance({ a: [{ issue: 'fin', tresorFin: 10 }, { issue: 'fin', tresorFin: 10 }], b: [{ issue: 'revolution', duree: 50 }, { issue: 'fin', tresorFin: 5 }] });
  check(d.tableau.a.b === 1 && d.tableau.b.a === 0 && d.dominants.join() === 'a', 'stratégie dominante : finir la partie, puis l\'or, départagent deux bots sur la même graine');
  process.exit(fail ? 1 : 0);
}


// objectifs de victoire (--objectifs) : mesures de chaque bot, et seuils proposés : pour chaque objectif, les parties des
// bots qui l'ont pour ambition (sinon le bot qui le réussit le mieux) : bronze = leur médiane (la moitié l'atteint),
// argent = 75e centile, or = 87e centile (environ 13 %) ; puis la victoire de chaque bot (médaille de son ambition)
const centile = (xs, p) => { const t = xs.slice().sort((a, b) => a - b); return t.length ? t[Math.min(t.length - 1, Math.floor(p * t.length))] : null; };
function objectifs(parties){
  const ids = Object.keys(OD.OBJECTIFS), noms = Object.keys(parties), seuils = {};
  const vivantes = nom => parties[nom].filter(m => m.issue !== 'revolution');
  const vals = (nom, id) => vivantes(nom).map(m => m.objectifs[id]);
  console.log('\nObjectifs de victoire : médiane (75e et 87e centiles) par bot ; une révolution ne compte pas');
  console.log('bot'.padEnd(15) + 'ambition'.padEnd(14) + ids.map(id => id.padEnd(20)).join(''));
  for (const nom of noms) console.log(nom.padEnd(15) + String(Bots.AMBITIONS[nom] || '-').padEnd(14) + ids.map(id => `${centile(vals(nom, id), 0.5)} (${centile(vals(nom, id), 0.75)}, ${centile(vals(nom, id), 0.87)})`.padEnd(20)).join(''));
  for (const id of ids){
    let refs = noms.filter(n => Bots.AMBITIONS[n] === id);
    if (!refs.length) refs = [noms.reduce((a, b) => centile(vals(b, id), 0.5) > centile(vals(a, id), 0.5) ? b : a)];
    const xs = [].concat(...refs.map(n => vals(n, id)));
    seuils[id] = { refs, seuils: [0.5, 0.75, 0.87].map(p => centile(xs, p)), actuels: OD.OBJECTIFS[id].seuils[PAYS_PARTIE] || null };
  }
  console.log('\nSeuils proposés (bronze, argent, or ; bots de référence) :');
  for (const id of ids) console.log(`  ${OD.OBJECTIFS[id].nom.padEnd(13)} ${seuils[id].seuils.join(' / ').padEnd(18)} (${seuils[id].refs.join(', ')}) ; actuels ${JSON.stringify(seuils[id].actuels)}`);
  // seuils des données s'ils sont fixés (sauf --seuils-proposes), sinon ceux proposés
  const propres = !process.argv.includes('--seuils-proposes') && ids.every(id => (OD.OBJECTIFS[id].seuils[PAYS_PARTIE] || []).length === 3);
  const S = id => propres ? OD.OBJECTIFS[id].seuils[PAYS_PARTIE] : seuils[id].seuils;
  const medaille = (m, id) => m.issue === 'revolution' ? 0 : S(id).filter(x => m.objectifs[id] >= x).length;
  console.log(`\nAvec les seuils ${propres ? 'des données' : 'proposés'} : victoire de chaque bot (médaille de son ambition), en % des parties`);
  console.log('bot'.padEnd(15) + 'ambition'.padEnd(14) + 'aucune  bronze  argent  or');
  for (const nom of noms){
    const ms = parties[nom].filter(m => m.ambition), c = [0, 0, 0, 0];
    if (!ms.length){ console.log(nom.padEnd(15) + '-'); continue; }
    for (const m of ms) c[medaille(m, m.ambition)]++;
    const amb = Bots.AMBITIONS[nom] || 'au hasard';
    console.log(nom.padEnd(15) + amb.padEnd(14) + c.map(x => (Math.round(100 * x / ms.length) + ' %').padEnd(8)).join(''));
  }
  // la même partie avec une autre ambition : quel objectif ce bot aurait-il le mieux réussi ?
  console.log('\nSi chaque bot avait visé un autre objectif : médaille moyenne (0 à 3) par objectif');
  console.log('bot'.padEnd(15) + ids.map(id => id.slice(0, 11).padEnd(12)).join(''));
  for (const nom of noms) console.log(nom.padEnd(15) + ids.map(id => (parties[nom].reduce((t, m) => t + medaille(m, id), 0) / parties[nom].length).toFixed(2).padEnd(12)).join(''));
  // étapes de l'ambition : part des parties où chacune est atteinte, et tour médian (ni gratuites, ni hors d'atteinte)
  console.log("\nÉtapes de l'ambition : % des parties où elle est atteinte (tour médian)");
  for (const nom of noms){
    const ms = parties[nom].filter(m => m.ambition); if (!ms.length) continue;
    const amb = ms[0].ambition;
    console.log(nom.padEnd(15) + amb.padEnd(14) + OD.ETAPES[amb].map((et, i) => { const ts = ms.map(m => (m.etapes[m.ambition] || [])[i]).filter(t => t != null);
      return `${et.id} ${Math.round(100 * ts.length / ms.length)} % (t${ts.length ? centile(ts, 0.5) : '-'})`.padEnd(30); }).join(''));
  }
  return seuils;
}

if (require.main === module){
  if (process.argv.includes('--controle')) controle();
  const N = Number(arg('parties', 200)), G = Number(arg('graine', 1)), T = arg('tours') ? Number(arg('tours')) : null;
  const choix = arg('bot', 'tous'), noms = choix === 'tous' ? Bots.noms : choix.split(',');
  const reglages = {};
  for (const r of args('regle')) { const [ch, v] = r.split('='); reglages[ch] = valeur(v); }
  const listePays = arg('pays', 'equilibre') === 'tous' ? Object.keys(PAYS) : arg('pays', 'equilibre').split(',');
  for (const pays of listePays){
  if (!PAYS[pays]) throw new Error('pays inconnu : ' + pays);
  PAYS_PARTIE = pays;
  if (listePays.length > 1 || pays !== 'equilibre') console.log(`\n########## ${PAYS[pays].nom} (${pays})`);
  const balayage = arg('balayage');
  if (balayage){
    const [ch, vs] = balayage.split('='), valeurs = vs.split(',').map(valeur);
    console.log(`Balayage de ${ch} (valeur actuelle : ${JSON.stringify(lire(ch))}) ; ${N} parties par bot et par valeur, graines ${G} à ${G + N - 1}`);
    const lignes = [];
    for (const v of valeurs){
      const { resumes, parties } = lot(noms, N, G, T, Object.assign({}, reglages, { [ch]: v }));
      const dom = dominance(parties).dominants;
      for (const nom of noms){
        const r = resumes[nom];
        lignes.push([JSON.stringify(v), nom, pct(r.fins.revolution || 0, r.parties), r0(r.dureeMediane), r0(r.tresor[20]), r0(r.tresor[40]), r0(r.toursGuerre), r.batailles.perdues.toFixed(1), r.regionsPerdues.toFixed(2), r0(r.toursOccupes), r0(r.apaisements), r0(r.tours75), pct(r.avecGreve, r.parties), dom.includes(nom) ? 'oui' : '']);
      }
    }
    const tete = ['valeur', 'bot', 'révol.', 'durée', 'or t20', 'or t40', 'guerre', 'bat. P', 'rég. P', 'occup.', 'apais.', 't≥75', 'grève', 'domine'];
    const largeurs = tete.map((h, i) => Math.max(h.length, ...lignes.map(l => String(l[i]).length)));
    console.log('\n' + tete.map((h, i) => h.padEnd(largeurs[i])).join(' | '));
    console.log(largeurs.map(w => '-'.repeat(w)).join('-|-'));
    for (const l of lignes) console.log(l.map((x, i) => String(x).padEnd(largeurs[i])).join(' | '));
  } else {
    const { resumes, parties } = lot(noms, N, G, T, reglages);
    if (Object.keys(reglages).length) console.log('Réglages : ' + JSON.stringify(reglages));
    for (const nom of noms){
      afficher(resumes[nom]);
      if (nom === 'replica') console.log(`  non-régression (partie 1 au tour 30 : 3214 or, réputation +42) : ${r0(resumes[nom].tresor[30])} or, ${r0(resumes[nom].reputation30)}`);
    }
    if (noms.length > 1) afficherDominance(dominance(parties));
    if (process.argv.includes('--objectifs')) objectifs(parties);
    const f = arg('json');
    if (f){ fs.writeFileSync(f, JSON.stringify({ parametres: { parties: N, graine: G, tours: T || CHAMPS.tours, bots: noms, reglages }, resumes, parties })); console.log('\nDétail écrit dans ' + f); }
  }
  }
}

module.exports = { partie, resume, dominance, lot, regler };

/* Le Thé des Jarls : règles vérifiées une par une, puis duels complets sans navigateur.
   node outils/jarls-simulateur.js [nombre-de-duels] [--detail]
   Charge the-des-jarls/regles.js et ia.js dans un même contexte, comme la page.
   Vérifie : chaque faveur fait ce que dit son texte (dés posés à la main), même graine = même
   duel (aussi après sauvegarde et rechargement JSON), l'ordinateur bat un joueur au hasard,
   les duels finissent en un nombre raisonnable de manches, aucun dieu n'écrase les autres.
   Affiche (--detail) : victoires de chaque dieu contre tous les autres, manches moyennes,
   faveurs jouées. Code de sortie 1 si une vérification échoue (outils/verifications.js). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
for (const f of ['regles.js', 'ia.js', 'campagne.js', 'guide.js']) vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'the-des-jarls', f), 'utf8'), { filename: 'the-des-jarls/' + f });
/* global jarCampagne, jarVictoire, jarOuverte, jarProchaine, jarFaveursGagnees, jarApparences, jarUnites, jarDuJour, jarScoreJour, jarTotalEtoiles, JAR_TAVERNES, JAR_DEPART, GUIDE_IMPOSES, GUIDE_THORGRIM, GUIDE_FAVEURS, GUIDE_GRAINE, jarNouvelle, jarLancer, jarGarder, jarFinir, jarChoisir, jarBataille, jarSuivante, jarMigrer, jarIaJouer, jarAdversaire, jarPeutLancer, jarRng, JAR_DES, JAR_IDS, JAR_FAVEURS, JAR_DIEUX, JAR_PV */

const K = Number(process.argv[2]) || 200, detail = process.argv.includes('--detail');
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'ÉCHEC ') + msg); if (!ok) fail++; };

/* ---------- 1. les règles, dés posés à la main ---------- */
// une bataille toute prête : faces des 6 dés de chaque camp ('hache', 'fleche*' = dorée…), jetons, PV, faveurs choisies
function bataille(f0, f1, o = {}) {
  const e = jarNouvelle(1, [{ nom: 'A', faveurs: JAR_IDS.slice(0, 3) }, { nom: 'B', faveurs: JAR_IDS.slice(0, 3) }]);
  [f0, f1].forEach((fs, i) => {
    const c = e.camps[i];
    // chaque face demandée va sur un dé qui l'a (dorée avec « * », ordinaire sinon) ; « - » = dé vide
    const voulu = fs.filter(s => s !== '-'), pris = [], k = [];
    const placer = n => {
      if (n === voulu.length) return true;
      const f = voulu[n].replace('*', ''), or = voulu[n].endsWith('*');
      for (let j = 0; j < 6; j++) { if (pris[j]) continue; const x = JAR_DES[j].findIndex(y => y.f === f && y.or === or); if (x < 0) continue; pris[j] = true; k[j] = x; if (placer(n + 1)) return true; pris[j] = false; }
      return false;
    };
    if (!placer(0)) throw new Error('faces impossibles : ' + fs.join(' '));
    c.des.forEach((d, j) => { d.k = pris[j] ? k[j] : -1; });
    c.fini = true; c.lancers = 3;
    if (o.jetons) c.jetons = o.jetons[i];
    if (o.pv) c.pv = o.pv[i];
    c.choix = o.choix && o.choix[i] ? { id: o.choix[i][0], niv: o.choix[i][1] } : null;
  });
  e.premier = o.premier || 0; e.phase = 'bataille';
  const ev = jarBataille(e);
  return { e, ev, pv: e.camps.map(c => c.pv), jet: e.camps.map(c => c.jetons), a: t => ev.find(x => x.t === t) };
}
const nul = ['-', '-', '-', '-', '-', '-'];   // six dés vides : rien ne se passe
const H = 'hache', F = 'fleche', C = 'casque', B = 'bouclier', M = 'main';
let r;
// faces dorées réellement présentes sur les dés, pour savoir combien de jetons attendre
const orDe = (fs) => fs.reduce((n, s, j) => n + (s && s.endsWith('*') && JAR_DES[j].some(x => x.f === s.replace('*', '') && x.or) ? 1 : 0), 0);
check(orDe(['fleche*', 'hache*', 'casque*', 'main*', 'casque*', 'main*']) === 6, 'chaque dé a les faces dorées prévues');
r = bataille([H, H, H, M, M, M], [C, F, F, B, B, B]);
check(r.pv[1] === 13 && r.pv[0] === 13, `haches contre casques : 3 haches, 1 casque → 2 blessures ; 2 flèches sans bouclier → 2 (PV ${r.pv})`);
r = bataille([F, F, F, C, C, '-'], [B, B, H, H, H, M]);
check(r.pv[1] === 14 && r.pv[0] === 14, `flèches contre boucliers : 3 flèches, 2 boucliers → 1 ; 3 haches, 2 casques → 1 (PV ${r.pv})`);
r = bataille([M, M, M, C, C, C], nul, { jetons: [0, 2] });
check(r.jet[0] === 2 && r.jet[1] === 0, `les mains volent 1 jeton chacune, pas plus que ce qu'a l'adversaire (jetons ${r.jet})`);
r = bataille(['fleche*', 'hache*', 'casque*', C, C, '-'], nul);
check(r.jet[0] === 3 && r.a('or').n === 3, `faces dorées : 1 jeton chacune (jetons ${r.jet})`);
r = bataille(nul, nul, { jetons: [4, 0], choix: [['thor', 1]] });
check(r.pv[1] === 13 && r.jet[0] === 0, `Thor I : 2 blessures pour 4 jetons (PV ${r.pv}, jetons ${r.jet})`);
r = bataille(nul, [M, M, '-', '-', '-', '-'], { jetons: [4, 0], choix: [['thor', 1]] });
check(r.pv[1] === 15 && r.a('faveur').ok === false, 'Thor rate si les éclaireurs ont volé de quoi le payer');
r = bataille(nul, nul, { jetons: [9, 4], pv: [15, 15], choix: [['idunn', 1], ['thrymr', 1]], premier: 0 });
check(r.a('thrymr') && r.a('thrymr').a === 0 && r.jet[0] === 9 && r.pv[0] === 15, 'Thrymr I annule une faveur de niveau I (et elle n\'est pas payée)');
r = bataille(nul, nul, { jetons: [10, 3], pv: [10, 15], choix: [['idunn', 3], ['thrymr', 1]] });
check(r.pv[0] === 14 && r.jet[0] === 3, `Thrymr I : Idunn III devient Idunn II, payée 7 (PV ${r.pv}, jetons ${r.jet})`);
r = bataille([H, H, H, C, C, C], [C, B, B, B, B, '-'], { jetons: [10, 0], choix: [['brunhild', 1]] });
check(r.pv[1] === 11, `Brunhild I : 3 haches ×1,5 = 5 (arrondi au-dessus), 1 casque → 4 (PV ${r.pv})`);
r = bataille([F, F, F, C, '-', '-'], [B, B, B, B, C, C], { jetons: [2, 0], choix: [['ullr', 1]] });
check(r.pv[1] === 13, `Ullr I : 2 flèches sur 3 passent les boucliers (PV ${r.pv})`);
r = bataille([H, H, H, H, M, M], [C, C, C, C, B, B], { jetons: [4, 0], choix: [['vidar', 2]] });
check(r.pv[1] === 11, `Vidar II : 4 casques retirés, 4 haches passent (PV ${r.pv})`);
r = bataille([C, B, M, M, M, '-'], [H, H, H, F, F, F], { jetons: [3, 0], choix: [['baldr', 1]] });
check(r.pv[0] === 13, `Baldr I : 1 casque + 1 bouclier comptent double (PV ${r.pv})`);
r = bataille([H, H, H, C, B, M], nul, { jetons: [4, 0], choix: [['freyr', 1]] });
check(r.pv[1] === 10 && r.a('haches').att[0] === 5, `Freyr I : +2 haches (la face la plus nombreuse) (att ${r.a('haches').att})`);
r = bataille([F, F, C, C, '-', '-'], nul, { jetons: [6, 0], choix: [['skadi', 1]] });
check(r.a('fleches').att[0] === 4, `Skadi I : +1 flèche par dé flèche (att ${r.a('fleches').att})`);
r = bataille([C, C, C, C, B, B], [H, H, H, H, H, F], { jetons: [4, 0], pv: [10, 15], choix: [['heimdall', 1]] });
check(r.pv[0] === 14, `Heimdall I : 1 blessure, 5 attaques parées → +5 PV (PV ${r.pv})`);
r = bataille([H, H, H, H, M, M], [C, M, M, M, '-', '-'], { jetons: [6, 0], pv: [10, 15], choix: [['hel', 1]] });
check(r.pv[0] === 13 && r.pv[1] === 12, `Hel I : 3 blessures de hache → +3 PV (PV ${r.pv})`);
r = bataille(nul, nul, { jetons: [3, 0], choix: [['mimir', 1]] });
check(r.pv[0] === 15 && r.jet[0] === 0, 'Mimir I : sans blessure, rien');
r = bataille([M, M, M, '-', '-', '-'], [H, H, H, H, M, M], { jetons: [3, 0], choix: [['mimir', 1]] });
check(r.pv[0] === 11 && r.a('jetons').n === 4, `Mimir I : 4 PV perdus → +4 jetons (PV ${r.pv})`);
r = bataille([M, M, M, C, C, C], nul, { jetons: [4, 0], choix: [['bragi', 1]] });
check(r.a('jetons').n === 6, 'Bragi I : +2 jetons par dé main');
r = bataille([F, F, C, C, '-', '-'], nul, { jetons: [4, 9], choix: [['skuld', 1]] });
check(r.jet[1] === 5, `Skuld I : l'adversaire perd 2 jetons par dé flèche (jetons ${r.jet})`);
r = bataille(nul, nul, { jetons: [4, 6], choix: [['tyr', 1]] });
check(r.pv[0] === 14 && r.jet[1] === 4, `Tyr I : 1 PV sacrifié, l'adversaire perd 2 jetons (PV ${r.pv}, jetons ${r.jet})`);
r = bataille(nul, nul, { jetons: [2, 0], choix: [['odin', 1]] });
check(r.pv[0] === 12 && r.jet[0] === 9, `Odin I : 3 PV → 9 jetons (PV ${r.pv}, jetons ${r.jet})`);
r = bataille(nul, nul, { jetons: [2, 0], pv: [2, 15], choix: [['odin', 1]] });
check(r.pv[0] === 1, 'Odin ne prend jamais le dernier PV');
r = bataille(nul, [C, C, C, C, '-', '-'], { jetons: [10, 7], pv: [5, 15], choix: [['var', 1], ['idunn', 2]], premier: 0 });
check(r.pv[0] === 12 && r.pv[1] === 15, `Var I : +1 PV par jeton que l'adversaire dépense (Idunn II : 7) (PV ${r.pv})`);
r = bataille([H, H, H, H, H, H], [C, C, C, C, '-', '-'], { jetons: [0, 6], choix: [null, ['loki', 2]] });
check(r.a('loki').faces.length === 2 && r.a('haches').att[0] === 4, 'Loki II : écarte 2 haches adverses');
r = bataille([H, H, H, H, H, H], nul, { jetons: [0, 4], choix: [null, ['frigg', 3]] });
check(r.a('frigg').faces.length === 4, 'Frigg III : 4 dés adverses relancés');
r = bataille(nul, nul, { jetons: [6, 0], choix: [['freyja', 3]] });
check(r.a('freyja').faces.length === 3, 'Freyja III : 3 dés de plus');
r = bataille([H, H, H, H, H, H], [M, M, M, '-', '-', '-'], { pv: [15, 4] });
check(r.e.fin && r.e.fin.gagnant === 0 && !r.a('vol'), 'à 0 PV la partie s\'arrête aussitôt (pas de vol après)');
r = bataille([H, H, H, H, H, H], [H, H, H, H, H, H], { pv: [3, 3] });
check(r.e.fin && r.e.fin.gagnant === -1 && r.pv[0] === 0, 'les deux à 0 en même temps, aussi bas : égalité');
r = bataille([H, H, H, H, H, H], [H, H, H, H, C, '-'], { pv: [3, 3] });
check(r.e.fin && r.e.fin.gagnant === 0, 'les deux à 0 en même temps : celle qui tombe le moins bas gagne (−1 contre −2)');
check(JAR_IDS.length === 20 && JAR_IDS.every(id => JAR_DIEUX[id] && JAR_DIEUX[id].deck.length === 3 && JAR_DIEUX[id].deck[0] === id && JAR_DIEUX[id].deck.every(x => JAR_FAVEURS[x])), '20 faveurs, 20 dieux avec chacun trois faveurs dont la sienne');

/* ---------- 1 bis. campagne, défi du jour, manche guidée ---------- */
{
  check(JAR_TAVERNES.length === 20 && new Set(JAR_TAVERNES.map(t => t.dieu)).size === 20 && JAR_TAVERNES.every(t => JAR_FAVEURS[t.dieu]), '20 tavernes, une par dieu');
  check(JAR_TAVERNES.map(t => t.niveau).join('') === '11111112222222333333', 'facile aux tavernes 1 à 7, normal de 8 à 14, difficile de 15 à 20');
  const c = jarCampagne({ etoiles: { heimdall: 9, inconnu: 2, var: -1 }, couleur: 'pommier' });
  check(c.etoiles.heimdall === 3 && !('inconnu' in c.etoiles) && !('var' in c.etoiles) && c.couleur === 'bleu', 'une campagne abîmée est nettoyée (couleur pas gagnée → bleu)');
  const k = jarCampagne(null);
  check(jarFaveursGagnees(k).sort().join() === JAR_DEPART.slice().sort().join() && jarProchaine(k) === 0 && !jarOuverte(k, 1), 'au départ : Thor, Idunn, Vidar ; seule la première taverne est ouverte');
  let r = jarVictoire(k, 0, 12);
  check(r.etoiles === 3 && r.faveur === 'heimdall' && jarFaveursGagnees(k).includes('heimdall') && jarOuverte(k, 1), 'battre Heimdall avec 12 PV : 3 étoiles, sa faveur, la taverne suivante');
  r = jarVictoire(k, 0, 3);
  check(!r.mieux && k.etoiles.heimdall === 3 && !r.faveur, 'rejouer moins bien ne fait pas perdre d\'étoiles');
  r = jarVictoire(k, 1, 8);
  check(r.etoiles === 2 && r.apparence === 'pommier' && jarApparences(k).includes('pommier'), 'la taverne d\'Idunn donne des couleurs (faveur déjà connue)');
  for (let i = 2; i < 5; i++) r = jarVictoire(k, i, 1);
  check(r.unite === 'berserkers' && jarUnites(k).length === 1 && jarTotalEtoiles(k) === 3 + 2 + 3, 'cinquième dieu battu : les berserkers');
  const d1 = jarDuJour(20261021), d2 = jarDuJour(20261021), d3 = jarDuJour(20261022);
  check(JSON.stringify(d1) === JSON.stringify(d2) && new Set(d1.faveurs).size === 3 && JSON.stringify(d1) !== JSON.stringify(d3), 'défi du jour : même dieu et mêmes faveurs pour tous, un autre le lendemain');
  const e = jarNouvelle(20261021, [{ nom: 'Toi', faveurs: d1.faveurs }, jarAdversaire(d1.dieu, 2)]);
  e.camps[0].pv = 7; e.fin = { gagnant: 0, manche: 6 };
  check(jarScoreJour(e) === 1000 + 350 - 60, 'score du jour en cas de victoire');
  e.fin.gagnant = 1; e.camps[1].pv = 4;
  check(jarScoreJour(e) === 220, 'score du jour en cas de défaite : 20 par PV pris');
  // la manche guidée : les gestes que demande Sigrid donnent la bataille prévue
  const gd = jarNouvelle(GUIDE_GRAINE, [{ nom: 'Toi', faveurs: GUIDE_FAVEURS }, GUIDE_THORGRIM], 'guide', { premier: 0, imposes: GUIDE_IMPOSES });
  jarLancer(gd, 0); jarIaJouer(gd); [0, 1, 3].forEach(j => jarGarder(gd, 0, j)); jarLancer(gd, 0); jarIaJouer(gd); jarFinir(gd, 0);
  for (let n = 0; n < 5 && gd.phase !== 'faveur'; n++) jarIaJouer(gd);
  const ok1 = gd.phase === 'faveur' && gd.tour === 0;
  jarChoisir(gd, 0, 'thor', 1); jarIaJouer(gd);
  const evG = jarBataille(gd), thor = evG.find(x => x.t === 'faveur' && x.id === 'thor');
  check(ok1 && thor && thor.ok && gd.camps[0].pv === 12 && gd.camps[1].pv === 11 && !gd.camps[1].choix, `manche guidée : Thor payé, Thorgrim sans faveur, PV 12 contre 11 (${gd.camps.map(c => c.pv)})`);
}

/* ---------- 2. duels complets ---------- */
const vusF = {};
// joueur au hasard : garde chaque dé une fois sur deux, prend une faveur au hasard
function auHasard(e, i) {
  const R = jarRng(e.graine, 'hasard', e.manche * 7 + i, e.camps[i].lancers);
  if (e.phase === 'lancer') { e.camps[i].des.forEach(d => { if (e.camps[i].lancers) d.garde = R() < 0.5; }); jarLancer(e, i); return; }
  if (e.phase === 'faveur') { const c = e.camps[i], id = c.faveurs[Math.floor(R() * 3)]; R() < 0.5 ? jarChoisir(e, i, id, 1 + Math.floor(R() * 2)) : jarChoisir(e, i, null); }
}
function duel(graine, d0, d1, o = {}) {
  let e = jarNouvelle(graine, [o.hasard ? { nom: 'H', faveurs: ['thor', 'idunn', 'vidar'] } : jarAdversaire(d0, o.niveau || 3), jarAdversaire(d1, o.niveau1 || o.niveau || 3)]);
  for (let pas = 0; pas < 2000 && !e.fin; pas++) {
    if (o.coupe && e.manche === o.coupe && e.phase === 'lancer') { e = jarMigrer(JSON.parse(JSON.stringify(e))); o.coupe = 0; }
    if (e.phase === 'bataille') { const ev = jarBataille(e); ev.forEach(x => { if (x.t === 'faveur' && x.ok) vusF[x.id] = (vusF[x.id] || 0) + 1; }); continue; }
    if (e.phase === 'bilan') { jarSuivante(e); continue; }
    if (o.hasard && e.tour === 0) auHasard(e, 0); else if (!jarIaJouer(e)) throw new Error('personne ne joue : ' + e.phase);
  }
  if (!e.fin) throw new Error(`duel sans fin : ${d0} contre ${d1}, manche ${e.manche}, phase ${e.phase}, PV ${e.camps.map(c => c.pv)}`);
  return e;
}
{ // déterminisme
  const a = duel(42, 'thor', 'loki'), b = duel(42, 'thor', 'loki'), c = duel(42, 'thor', 'loki', { coupe: 3 }), d = duel(43, 'thor', 'loki');
  check(JSON.stringify(a) === JSON.stringify(b), 'même graine = même duel');
  check(JSON.stringify(a.journal) === JSON.stringify(c.journal), 'même duel après sauvegarde et rechargement JSON');
  check(JSON.stringify(a.journal) !== JSON.stringify(d.journal), 'deux graines = deux duels différents');
}
{ // l'ordinateur bat un joueur au hasard
  let g = 0; const n = Math.max(40, K / 2);
  for (let k = 0; k < n; k++) if (duel(1000 + k, 'thor', 'thor', { hasard: true, niveau: 3 }).fin.gagnant === 1) g++;
  check(g / n >= 0.7, `l'ordinateur (niveau 3) bat un joueur au hasard : ${Math.round(100 * g / n)} %`);
  let g1 = 0; for (let k = 0; k < n; k++) if (duel(3000 + k, 'thor', 'thor', { niveau: 1, niveau1: 3 }).fin.gagnant === 1) g1++;
  check(g1 / n >= 0.55, `le niveau 3 bat le niveau 1 : ${Math.round(100 * g1 / n)} %`);
}
{ // équilibre entre les dieux et durée
  const v = {}, m = []; let premier = 0, n = 0, nuls = 0;
  JAR_IDS.forEach(id => v[id] = { g: 0, n: 0 });
  const tours = Math.max(1, Math.round(K / 40));
  for (let t = 0; t < tours; t++) for (let a = 0; a < 20; a++) for (let b = 0; b < 20; b++) {
    if (a === b) continue;
    const A = JAR_IDS[a], B = JAR_IDS[b], e = duel(5000 + t * 400 + a * 20 + b, A, B, { niveau: 3 });
    m.push(e.manche); n++;
    if (e.fin.gagnant >= 0) { v[[A, B][e.fin.gagnant]].g++; if (e.journal[0] && jarNouvelle(e.graine, [{ faveurs: [] }, { faveurs: [] }]).premier === e.fin.gagnant) premier++; }
    if (e.fin.gagnant < 0) nuls++;
    v[A].n++; v[B].n++;
  }
  check(nuls / n < 0.06, `peu d'égalités (${Math.round(100 * nuls / n)} %)`);
  const moy = m.reduce((a, b) => a + b, 0) / m.length, taux = JAR_IDS.map(id => [id, v[id].g / v[id].n]).sort((a, b) => b[1] - a[1]);
  check(moy >= 4 && moy <= 12, `un duel dure ${moy.toFixed(1)} manches en moyenne (entre 4 et 12)`);
  check(Math.max(...m) <= 40, `le plus long : ${Math.max(...m)} manches`);
  check(taux[0][1] <= 0.8 && taux[taux.length - 1][1] >= 0.2, `aucun dieu n'écrase les autres (de ${Math.round(100 * taux[taux.length - 1][1])} % pour ${taux[taux.length - 1][0]} à ${Math.round(100 * taux[0][1])} % pour ${taux[0][0]})`);
  check(premier / n <= 0.62, `avantage du premier joueur raisonnable (${Math.round(100 * premier / n)} %)`);
  const jamais = JAR_IDS.filter(id => !vusF[id]);
  check(!jamais.length, 'chaque faveur est jouée par l\'ordinateur' + (jamais.length ? ' (jamais : ' + jamais.join(', ') + ')' : ''));
  if (detail) {
    console.log('\nvictoires de chaque dieu contre les 19 autres :');
    for (const [id, x] of taux) console.log('  ' + id.padEnd(9) + String(Math.round(100 * x)).padStart(3) + ' %');
    console.log('\nfaveurs payées :', JAR_IDS.map(id => id + ' ' + (vusF[id] || 0)).join(', '));
  }
}
if (fail) { console.log(`\n${fail} vérification(s) en échec`); process.exit(1); }
console.log('\ntout est bon');

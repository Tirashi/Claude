/* La Boutique de cartes : années complètes jouées sans navigateur, par un gérant automatique.
   node outils/boutique-simulateur.js [nombre-de-parties] [--detail]
   Charge monstres.js, regles.js, cartes.js et clients.js dans un même contexte, comme la page.
   Quatre façons de tenir la boutique :
     rien    : ne commande rien, ne touche à rien (doit finir en faillite) ;
     ferme   : vend les boosters fermés, ne les ouvre jamais ;
     ouvre   : ouvre presque tous ses boosters et vend les cartes en vitrine ;
     melange : vend fermé ce que les clients demandent, ouvre le reste, garde les belles cartes au classeur ;
     classeur : comme melange, mais garde une carte de chaque au classeur (pour vérifier qu'on peut les compléter).
   Affiche : valeur à la fin, faillites, prêt remboursé, clients, ventes, réputation, meubles, agrandissements.
   Vérifie : même graine = même année (aussi après sauvegarde et rechargement JSON en cours d'année), les
   règles de base (commande, livraison, booster, vitrine, meubles et chemin, prêt, faillite), l'équilibrage
   grossier (rien < ferme ≤ melange, faillite de « rien »), aucune erreur, aucun Math.random.
   Code de sortie 1 si une vérification échoue (outils/verifications.js). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const DOSSIER = path.join(__dirname, '..', 'boutique');
for (const f of ['monstres.js', 'regles.js', 'cartes.js', 'clients.js']) vm.runInThisContext(fs.readFileSync(path.join(DOSSIER, f), 'utf8'), { filename: 'boutique/' + f });
/* global BOU_MONSTRES, BOU_MEUBLES, BOU_TAILLES, BOU_ARTICLES, BOU_SEMAINES, BOU_ECHEANCE, BOU_EVENEMENTS, BOU_RARETES, BOU_ELEMENTS,
   bouNouvelle, bouCommander, bouAnnulerCommande, bouOuvrir, bouGarder, bouRemplirVitrines, bouMettreEnVitrine, bouRanger, bouPoser,
   bouDeplacer, bouVendreMeuble, bouAgrandir, bouRembourser, bouTournoi, bouOuvrirBoutique, bouJour, bouDimanche, bouRepondre,
   bouValeur, bouCote, bouCarte, bouCatalogue, bouDerniere, bouCommandable, bouSorties, bouCheminLibre, bouPlaceLibre, bouTaille,
   bouNb, bouAttrait, bouTirerBooster, bouExtension, bouCartesPossedees, bouMigrer, bouFixerPrix */

const N = Number(process.argv[2]) || 40, detail = process.argv.includes('--detail');
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'ÉCHEC ') + msg); if (!ok) fail++; };
const moy = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
Math.random = () => { throw new Error('Math.random interdit dans les règles'); };

/* ---------- le gérant automatique ---------- */
const ORDRE_MEUBLES = {
  ferme: ['table', 'rayon', 'classeurs', 'plante', 'lampe', 'tapis', 'affiche', 'rayon', 'table', 'arcade', 'figurines', 'plante', 'lampe'],
  ouvre: ['grande', 'table', 'vitrine', 'grande', 'plante', 'classeurs', 'vitrine', 'lampe', 'tapis', 'affiche', 'table', 'arcade', 'grande', 'figurines'],
  melange: ['table', 'grande', 'vitrine', 'classeurs', 'plante', 'rayon', 'lampe', 'tapis', 'affiche', 'table', 'grande', 'arcade', 'figurines', 'vitrine'],
};
function poserQuelquePart(e, type) {
  const T = bouTaille(e);
  for (let z = 0; z < T.P; z++) for (let x = 0; x < T.L; x++) for (let r = 0; r < 4; r++) {
    if (!bouPlaceLibre(e, type, x, z, r)) continue;
    const res = bouPoser(e, type, x, z, r);
    if (res.ok) return res.meuble;
    if (res.raison === 'argent' || res.raison === 'bloque') return null;
  }
  return null;
}
function gerer(e, strat, memo) {
  if (strat === 'rien') return;
  const X = bouDerniere(e), cle = 'booster:' + X.n, vendus = memo.vendus || 20;
  // le rayon principal : la dernière extension ; un deuxième rayon : l'ancienne, les classeurs
  const rayons = e.meubles.filter(m => m.type === 'rayon');
  if (rayons[0]) { bouRanger(e, rayons[0].id, 0, cle); bouRanger(e, rayons[0].id, 1, 'coffret:' + X.n); bouRanger(e, rayons[0].id, 2, 'pochettes'); }
  if (rayons[1]) { const vieux = Object.keys(e.stock).find(c => c.startsWith('booster:') && c !== cle && e.stock[c] > 0); bouRanger(e, rayons[1].id, 0, vieux || 'classeur'); bouRanger(e, rayons[1].id, 1, 'classeur'); bouRanger(e, rayons[1].id, 2, 'figurine'); }
  // commandes : de quoi tenir la semaine (+ ce qu'on ouvre)
  const ouvrir = strat === 'ouvre' ? Math.max(12, Math.round(vendus * 0.8)) : strat === 'melange' || strat === 'classeur' ? 12 : 0;
  const vendre = strat === 'ouvre' ? Math.round(vendus * 0.2) : Math.round(vendus * 1.25);
  // ce qui arrive lundi prochain doit couvrir la semaine prochaine : on compte ce qui restera après celle-ci
  const reste = Math.max(0, (e.stock[cle] || 0) - vendre - ouvrir);
  const besoin = vendre + ouvrir + 6 - reste;
  const reserveTresorerie = e.pret > 0 && e.semaine < BOU_ECHEANCE ? 150 : 50;
  if (bouCommandable(e, X.n) && besoin > 0) {
    const pres = Math.floor(besoin / 24), seuls = besoin - pres * 24;
    if (pres && e.caisse - 54 * pres > reserveTresorerie) bouCommander(e, 'presentoir:' + X.n, pres);
    if (seuls && e.caisse - 2.5 * seuls > reserveTresorerie) bouCommander(e, cle, seuls);
  }
  // précommande de l'extension suivante
  const suivante = bouExtension(e, X.n + 1);
  if (suivante && suivante.sortie === e.semaine + 1 && e.caisse > 300) bouCommander(e, 'presentoir:' + suivante.n, 2);
  if ((e.stock['coffret:' + X.n] || 0) < 3 && e.caisse > 200) bouCommander(e, 'coffret:' + X.n, 4);
  if ((e.stock.pochettes || 0) < 10 && e.caisse > 100) bouCommander(e, 'pochettes', 20);
  if (bouNb(e, 'classeurs') && (e.stock.classeur || 0) < 4 && e.caisse > 100) bouCommander(e, 'classeur', 6);
  if (bouNb(e, 'figurines') && (e.stock.figurine || 0) < 4 && e.caisse > 200) bouCommander(e, 'figurine', 8);
  // ouvrir des boosters, garder les belles cartes, remplir les vitrines
  for (let k = 0; k < ouvrir && e.stock[cle] > vendre * 0.5; k++) bouOuvrir(e, cle);
  if (strat === 'melange') for (const id in e.reserve) if (bouCarte(e, id).rar >= 3 && !e.classeur[id]) bouGarder(e, id);
  if (strat === 'classeur') for (const id in e.reserve) if (!e.classeur[id]) bouGarder(e, id);
  bouRemplirVitrines(e, strat === 'ouvre' ? 105 : 115);
  // le prêt : rembourser dès qu'on peut garder un peu d'avance
  if (e.pret > 0 && e.caisse > e.pret + 900) bouRembourser(e, e.pret);
  else if (e.pret > 0 && e.semaine >= BOU_ECHEANCE - 2 && e.caisse > 300) bouRembourser(e, e.caisse - 200);
  // meubles et agrandissements, une fois le prêt sous contrôle
  const libre = e.caisse - (e.pret > 0 ? e.pret * 1.2 - 40 * (BOU_ECHEANCE - e.semaine) : 0) - 250;
  const ordre = ORDRE_MEUBLES[strat === 'classeur' ? 'melange' : strat], deja = {};
  for (const m of e.meubles) deja[m.type] = (deja[m.type] || 0) + 1;
  const vus = {};
  for (const t of ordre) {
    vus[t] = (vus[t] || 0) + 1;
    if ((deja[t] || 0) >= vus[t] + (t === 'rayon' || t === 'vitrine' ? 1 : 0)) continue;
    if (BOU_MEUBLES[t].prix > libre || (BOU_MEUBLES[t].des && e.semaine < BOU_MEUBLES[t].des)) break;
    if (poserQuelquePart(e, t)) break;   // un meuble par semaine
    if (e.niveau < BOU_TAILLES.length - 1 && e.pret === 0 && e.caisse > BOU_TAILLES[e.niveau + 1].prix + 600) bouAgrandir(e);
    break;
  }
  if (e.pret === 0 && e.niveau < BOU_TAILLES.length - 1 && e.caisse > BOU_TAILLES[e.niveau + 1].prix + 900) bouAgrandir(e);
  bouTournoi(e, { inscrit: bouNb(e, 'table') > 0, frais: 2, lots: 4 });
}
function repondre(e, strat) {
  const r = e.rencontre;
  let oui = false;
  if (strat !== 'rien') {
    if (r.type === 'vendeur') oui = r.prix < r.valeur * 0.6 && e.caisse > r.prix + 200;
    if (r.type === 'collectionneur') oui = r.offre >= bouCote(e, r.carte) * 1.25;
    if (r.type === 'marchand') oui = r.etape >= 1 || r.offres[r.etape] >= r.valeur * 0.47;
  }
  const res = bouRepondre(e, oui ? 'oui' : 'non');
  if (res && res.ok === false) bouRepondre(e, 'non');
}
// une semaine complète ; renvoie le bilan du dimanche
function semaine(e, strat, memo, suivi) {
  gerer(e, strat, memo);
  bouOuvrirBoutique(e);
  let boosters = 0;
  while (e.phase === 'semaine') {
    const j = bouJour(e);
    for (const v of j.visites) for (const a of v.achats) if (a.cle && a.cle.startsWith('booster:')) boosters++;
    if (j.tournoi) suivi.tournois++;
    while (e.rencontre) { suivi.rencontres[e.rencontre.type] = (suivi.rencontres[e.rencontre.type] || 0) + 1; repondre(e, strat); }
  }
  memo.vendus = Math.max(8, Math.round(((memo.vendus || 20) + boosters) / 2));
  return bouDimanche(e);
}
function controler(e) {   // ce qui ne doit jamais arriver
  const pb = [];
  for (const c in e.stock) if (e.stock[c] < 0) pb.push('stock ' + c + ' ' + e.stock[c]);
  for (const id in e.reserve) if (!(e.reserve[id] > 0)) pb.push('réserve ' + id);
  if (!Number.isFinite(e.caisse)) pb.push('caisse');
  if (e.reputation < 0 || e.reputation > 100) pb.push('réputation ' + e.reputation);
  for (const m of e.meubles) { const v = e.vitrines[m.id]; if (v && v.length > (BOU_MEUBLES[m.type].cartes || 0)) pb.push('vitrine trop pleine'); }
  if (!bouCheminLibre(e)) pb.push('chemin bouché');
  return pb;
}
function annee(graine, strat, coupe) {
  let e = bouNouvelle(graine);
  const memo = {}, suivi = { tournois: 0, rencontres: {}, evenements: {}, pb: [], valeurs: {} };
  while (!e.fin) {
    if (coupe && e.semaine === coupe) e = bouMigrer(JSON.parse(JSON.stringify(e)));
    const b = semaine(e, strat, memo, suivi);
    if (e.evenement) suivi.evenements[e.evenement.id] = (suivi.evenements[e.evenement.id] || 0) + 1;
    suivi.pb.push(...controler(e));
    if (b && [10, 26, 40].includes(b.semaine)) suivi.valeurs[b.semaine] = b.valeur;
    if (detail && graine === 'g0' && b) console.log(strat, 'S' + b.semaine, 'caisse', e.caisse, 'prêt', e.pret, 'rép', Math.round(e.reputation), 'clients', b.compte.clients, 'ventes', b.compte.ventes, 'meubles', e.meubles.length, 'niveau', e.niveau, b.evenement ? b.evenement.id : '');
  }
  return { e, suivi };
}

/* ---------- 1. le catalogue et les boosters ---------- */
{
  const C = bouCatalogue('cat');
  check(C.extensions.length === 5 && C.extensions.every(x => x.cartes.length === 40), 'catalogue : 5 extensions de 40 cartes');
  const noms = new Set(Object.values(C.cartes).map(c => c.nom));
  check(noms.size === 200, 'catalogue : 200 noms différents');
  const legs = C.extensions.map(x => C.cartes[x.cartes[39]]);
  check(legs.every(c => BOU_MONSTRES[c.monstre].leg && c.rar === 4), 'chaque extension a sa légendaire, avec un monstre réservé');
  const autres = Object.values(C.cartes).filter(c => c.rar < 4);
  check(autres.every(c => !BOU_MONSTRES[c.monstre].leg && BOU_MONSTRES[c.monstre].el === c.el), 'les autres cartes : un monstre de leur élément, jamais un légendaire');
  const usage = {}; for (const c of autres) usage[c.monstre] = (usage[c.monstre] || 0) + 1;
  check(Math.max(...Object.values(usage)) <= 3, 'un monstre sert au plus 3 fois dans l\'année (' + Math.max(...Object.values(usage)) + ')');
  check(JSON.stringify(bouCatalogue('cat')) === JSON.stringify(C) && JSON.stringify(bouCatalogue('autre')) !== JSON.stringify(C), 'catalogue : même graine, mêmes cartes ; autre graine, autres cartes');
  const e = bouNouvelle('boosters'), rar = [0, 0, 0, 0, 0]; let cote = 0;
  for (let k = 0; k < 4000; k++) for (const id of bouTirerBooster(e, 1)) { rar[bouCarte(e, id).rar]++; cote += bouCote(e, id); }
  check(Math.abs(rar[4] / 4000 - 1 / 40) < 0.01 && Math.abs(rar[3] / 4000 - 0.2) < 0.03, 'boosters : légendaire 1 sur 40, épique 1 sur 5 (' + rar[4] + ', ' + rar[3] + ' sur 4000)');
  console.log('     cote moyenne d\'un booster ouvert : ' + (cote / 4000).toFixed(2) + ' € (vendu fermé 4 €)');
  check(cote / 4000 > 3 && cote / 4000 < 6, 'un booster ouvert vaut en moyenne entre 3 et 6 € de cote');
}

/* ---------- 2. règles de base ---------- */
{
  const e = bouNouvelle('base');
  check(e.caisse === 2400 && e.pret === 2000 && e.meubles.length === 3 && bouCheminLibre(e), 'départ : 2 400 € dont 2 000 de prêt, caisse + rayon + vitrine, chemin libre');
  const c0 = e.caisse, r = bouCommander(e, 'booster:1', 10);
  check(r.ok && e.caisse === c0 - 25 && e.commandes.length === 1, 'commande payée tout de suite');
  check(bouCommander(e, 'booster:2', 1).ok === false, 'l\'extension 2 ne se commande pas avant la semaine 10');
  check(bouCommander(e, 'figurine', 1).ok === false, 'les figurines sont bloquées avant la semaine 20');
  bouAnnulerCommande(e, 'booster:1');
  check(e.caisse === c0 && !e.commandes.length, 'annuler une commande rend l\'argent');
  bouCommander(e, 'presentoir:1', 1);
  const ids = bouOuvrir(e, 'booster:1');
  check(ids && ids.length === 5 && e.stock['booster:1'] === 35 && Object.values(e.reserve).reduce((s, x) => s + x, 0) === 5, 'ouvrir un booster : 5 cartes dans la réserve');
  bouRemplirVitrines(e);
  const v = e.vitrines[e.meubles.find(m => m.type === 'vitrine').id];
  check(v.filter(Boolean).length === 5 && !Object.keys(e.reserve).length, 'remplir les vitrines vide la réserve');
  check(bouPoser(e, 'table', 0, 0, 0).ok === false, 'une table qui bouche le chemin (ou la place) est refusée');
  const t = bouPoser(e, 'table', 2, 3, 0);
  check(t.ok && bouCheminLibre(e) && e.caisse === c0 - 54 - 150, 'poser une table payée, chemin libre');
  check(bouPoser(e, 'plante', 1, 4, 0).ok === false, 'rien devant la porte');
  check(bouDeplacer(e, t.meuble.id, 3, 3, 0) && bouVendreMeuble(e, t.meuble.id) && e.caisse === c0 - 54 - 75, 'déplacer, puis revendre à moitié prix');
  check(bouAgrandir(e) && bouTaille(e).L === 8, 'agrandir : 8 × 5');
  bouOuvrirBoutique(e);
  check(bouCommander(e, 'pochettes', 1).ok === false && bouPoser(e, 'plante', 5, 4, 0).ok === false, 'pendant la semaine, ni commande ni meuble');
  while (e.phase === 'semaine') { bouJour(e); while (e.rencontre) bouRepondre(e, 'non'); }
  const b = bouDimanche(e);
  check(b && e.semaine === 2 && e.phase === 'lundi' && e.stock['booster:1'] >= 24, 'dimanche : semaine 2, livraison du présentoir arrivée');
  // la faillite : rien en caisse à la semaine 26
  const f = bouNouvelle('faillite'); f.caisse = 100; f.semaine = BOU_ECHEANCE; f.phase = 'dimanche';
  const bf = bouDimanche(f);
  check(f.fin && f.fin.raison === 'faillite' && bf.fin, 'semaine 26 sans de quoi payer la banque : faillite');
  const g = bouNouvelle('remb'); bouRembourser(g, 2000); g.semaine = BOU_ECHEANCE; g.phase = 'dimanche';
  bouDimanche(g);
  check(!g.fin && g.pret === 0 && g.semaine === 27, 'prêt remboursé : la semaine 26 passe');
}

/* ---------- 3. des années complètes ---------- */
const STRATS = ['rien', 'ferme', 'ouvre', 'melange', 'classeur'], res = {};
const evenements = {}, rencontres = {};
let pbs = [];
for (const s of STRATS) {
  res[s] = { valeur: [], faillite: 0, rembourse: 0, clients: [], ventes: [], rep: [], meubles: [], niveau: [], tournois: [], ouverts: [], complets: 0, v26: [] };
  for (let i = 0; i < N; i++) {
    const { e, suivi } = annee('g' + i, s);
    const R = res[s];
    R.valeur.push(e.fin.score); if (e.fin.raison === 'faillite') R.faillite++; if (e.pret === 0) R.rembourse++;
    R.clients.push(e.stats.clients); R.ventes.push(e.stats.ventes); R.rep.push(e.reputation); R.meubles.push(e.meubles.length); R.niveau.push(e.niveau);
    R.tournois.push(suivi.tournois); R.ouverts.push(e.stats.boostersOuverts); R.complets += e.complets.length; if (suivi.valeurs[26] !== undefined) R.v26.push(suivi.valeurs[26]);
    for (const k in suivi.evenements) evenements[k] = (evenements[k] || 0) + suivi.evenements[k];
    for (const k in suivi.rencontres) rencontres[k] = (rencontres[k] || 0) + suivi.rencontres[k];
    pbs = pbs.concat(suivi.pb);
  }
}
console.log('\n     stratégie  valeur moy. (min–max)   faillites  prêt remb.  clients  ventes  rép.  meubles  niveau  tournois  ouverts  valeur S26');
for (const s of STRATS) {
  const R = res[s], f = x => String(x).padStart(7);
  console.log('     ' + s.padEnd(9) + f(Math.round(moy(R.valeur))) + ' (' + Math.min(...R.valeur) + '–' + Math.max(...R.valeur) + ')'.padEnd(6) + f(R.faillite + '/' + N) + f(R.rembourse + '/' + N) + f(Math.round(moy(R.clients))) + f(Math.round(moy(R.ventes))) + f(Math.round(moy(R.rep))) + f(moy(R.meubles).toFixed(1)) + f(moy(R.niveau).toFixed(1)) + f(Math.round(moy(R.tournois))) + f(Math.round(moy(R.ouverts))) + f(Math.round(moy(R.v26))));
}
console.log('     événements :', JSON.stringify(evenements), '\n     rencontres :', JSON.stringify(rencontres), '\n     classeurs complets (classeur) :', res.classeur.complets, 'en', N, 'années');
check(!pbs.length, 'aucune anomalie (stock, réserve, caisse, réputation, vitrines, chemin)' + (pbs.length ? ' : ' + pbs.slice(0, 5).join(' ; ') : ''));
check(res.rien.faillite === N, '« rien » finit toujours en faillite');
check(res.ferme.faillite <= N * 0.1 && res.melange.faillite <= N * 0.1, 'vendre fermé ou mélanger : presque jamais de faillite (' + res.ferme.faillite + ', ' + res.melange.faillite + ')');
check(moy(res.melange.valeur) >= moy(res.ferme.valeur) * 0.95, 'mélanger rapporte au moins autant que tout vendre fermé');
check(moy(res.ferme.valeur) > 3000 && moy(res.melange.valeur) < 40000, 'valeur à la fin raisonnable (' + Math.round(moy(res.ferme.valeur)) + ' et ' + Math.round(moy(res.melange.valeur)) + ' €)');
check(Object.keys(BOU_EVENEMENTS).every(k => evenements[k] > 0), 'chaque événement arrive au moins une fois');
check(res.classeur.complets >= N, 'en gardant une carte de chaque, on complète des classeurs (' + res.classeur.complets + ' en ' + N + ' années)');
check(['vendeur', 'collectionneur', 'marchand'].every(k => rencontres[k] > 0), 'chaque rencontre arrive au moins une fois');

/* ---------- 4. déterminisme et sauvegarde ---------- */
{
  const a = annee('rep', 'melange').e, b = annee('rep', 'melange').e, c = annee('rep', 'melange', 17).e, d = annee('rep', 'melange', 33).e;
  check(JSON.stringify(a) === JSON.stringify(b), 'même graine, même année');
  check(JSON.stringify(a) === JSON.stringify(c) && JSON.stringify(a) === JSON.stringify(d), 'sauvegarde et rechargement JSON en cours d\'année : même année');
}
console.log(fail ? '\n' + fail + ' échec(s)' : '\nTout est bon.');
process.exit(fail ? 1 : 0);

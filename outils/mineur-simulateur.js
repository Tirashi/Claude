/* Mineur de l'espace : parties complètes jouées sans navigateur, par un pilote automatique.
   node outils/mineur-simulateur.js [nombre-de-parties] [--detail]
   Charge mineur-de-l-espace/regles.js dans le même contexte, comme la page.
   Le vol n'est pas simulé pixel par pixel : une sortie est un modèle (tir des tourelles sur de vraies roches
   tirées par les règles, temps d'approche et de ramassage, carburant, chocs), avec une « adresse » du pilote.
   Trois pilotes :
     malin : adresse 0,35, achète au quai ce qui est le moins cher (les améliorations sont communes à toutes les classes) ;
     lent  : adresse 0,15, mêmes achats (un joueur plus maladroit doit quand même finir) ;
     rien  : n'achète jamais rien (doit rester à l'étage 1).
   Affiche : heure de chaque étage, de la fin, plus long temps sans achat, sorties, pannes, vagues gagnées.
   Vérifie : même graine = même partie (aussi après sauvegarde et rechargement JSON en cours de partie), les
   règles de base, les cibles de durée (§ 15 du cahier des charges), aucune erreur, aucun Math.random.
   Code de sortie 1 si une vérification échoue (outils/verifications.js). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
vm.runInThisContext(fs.readFileSync(path.join(__dirname, '..', 'mineur-de-l-espace', 'regles.js'), 'utf8'), { filename: 'mineur-de-l-espace/regles.js' });
/* global MDE_MINERAIS, MDE_ORDRE, MDE_PLANETES, MDE_ROCHES, MDE_DANGERS, MDE_CONSO, MDE_TIR, MDE_CLASSES, MDE_VAGUES, MDE_DUREE_VOYAGE,
   mdeRng, mdeNouvelle, mdeMigrer, mdeEtage, mdeRoche, mdeEclats, mdeButin, mdeCorvette, mdeAchats, mdeAcheter, mdeBesoins, mdeLivrer,
   mdeRetour, mdeAvancer, mdeVoyager, mdePeutVoyager, mdeProduction, mdeResoudreAttaque, mdeFinale, mdeCombat, mdeUniteCombat,
   mdeCorvetteCombat, mdeForceFlottes, mdePrix, mdeChangerClasse, mdeVague, mdeRetirerUnite, mdePlaces, MDE_UNITES */

const N = Number(process.argv[2]) || 12, detail = process.argv.includes('--detail');
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'ÉCHEC ') + msg); if (!ok) fail++; };
const moy = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0;
const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[b.length >> 1] : NaN; };
const mn = s => (s / 60).toFixed(0).padStart(4) + ' min';
Math.random = () => { throw new Error('Math.random interdit dans les règles'); };

/* ---------- une sortie de minage (modèle) ---------- */
const PILOTES = { malin: { adresse: 0.35, achete: true }, lent: { adresse: 0.15, achete: true }, rien: { adresse: 0.35, achete: false } };
function poisson(R, l) { let k = 0, p = Math.exp(-l), s = p; const u = R(); while (u > s && k < 20) { k++; p *= l / k; s += p; } return k; }
function sortie(e, P) {
  const R = mdeRng(e.graine, 'sortie', e.sorties), c = mdeCorvette(e), a = P.adresse;
  const aller = 4 / c.vitesse, retour = 9 / c.vitesse;
  const dispo = c.vol / (0.6 * MDE_CONSO.pousse + 0.4 * MDE_CONSO.glisse) - aller - retour - 3;   // on pousse 60 % du temps
  const tCoup = MDE_TIR.cadence / c.tourelles / (0.4 + a);                // les tourelles ne tirent pas toujours (visée, roche hors de portée)
  const soute = {}; let n = 0, t = 0, file = [];
  while (t < dispo && n < c.soute) {
    let r = file.pop();
    if (!r) { r = mdeRoche(e, e.planete, R); t += 2.5 / c.vitesse / (0.5 + a); }   // aller chercher une nouvelle grosse roche
    t += Math.ceil(r.pv / c.degats) * tCoup;
    if (r.taille > 1) file = file.concat(mdeEclats(r, R));
    else { const b = Math.min(mdeButin(e, r, R), c.soute - n); n += b; soute[r.minerai] = (soute[r.minerai] || 0) + b; t += 0.5 / c.aimant / (0.5 + a); }
  }
  // chocs : petites roches rapides ; le drone réparateur rend un point par sortie
  const duree = aller + Math.min(t, dispo) + retour;
  const chocs = Math.max(0, poisson(R, MDE_DANGERS[mdeEtage(e)] * duree / 60 * (1 - a) * 1.5) - e.reparateur);
  const panne = chocs >= c.coque || (t >= dispo && R() < 0.5 - a);   // à court de carburant : un bon pilote rentre à temps
  return { soute, duree, panne, n };
}

/* ---------- le pilote au quai ---------- */
const valeur = (a) => { let v = a.prix.cr || 0; for (const m in a.prix) if (m !== 'cr') v += a.prix[m] * MDE_MINERAIS[m].prix; return v; };
const valeurRoche = p => Object.entries(MDE_PLANETES[p].ceinture).reduce((s, [m, x]) => s + x * MDE_MINERAIS[m].prix, 0);
function planeteVoulue(e) {
  // le minerai qui manque le plus pour l'achat le moins cher ; sinon la ceinture qui rapporte le plus
  // (parmi les achats dont on a déjà les CR : c'est le minerai qui bloque)
  const l = mdeAchats(e).filter(a => a.type !== 'reparer' && a.type !== 'unite' && e.cr >= (a.prix.cr || 0)).sort((x, y) => valeur(x) - valeur(y));
  for (const a of l.slice(0, 3)) for (const m in a.prix) if (m !== 'cr' && (e.entrepot[m] || 0) < a.prix[m]) {
    const ou = Object.keys(MDE_PLANETES).filter(p => MDE_PLANETES[p].ceinture[m] && (p === e.planete || p === 'terre' || MDE_PLANETES[p].req(e)) && (p !== 'mars' || e.bases.lune));
    if (ou.length) return ou.sort((x, y) => MDE_PLANETES[y].ceinture[m] - MDE_PLANETES[x].ceinture[m])[0];
  }
  return Object.keys(MDE_PLANETES).filter(p => p === 'terre' || (MDE_PLANETES[p].req(e) && (p !== 'mars' || e.bases.lune))).sort((x, y) => valeurRoche(y) - valeurRoche(x))[0];
}
function auQuai(e, P, s) {
  if (!P.achete) return;
  for (let k = 0; k < 60; k++) {
    const l = mdeAchats(e).filter(a => a.possible && a.type !== 'unite').sort((x, y) => (x.type === 'reparer' ? -1 : 0) - (y.type === 'reparer' ? -1 : 0) || valeur(x) - valeur(y));
    if (!l.length) break;
    mdeAcheter(e, l[0].id); s.achats.push(e.temps); s.liste.push(Math.round(e.temps / 60) + ' ' + l[0].id + ' ' + e.planete);
  }
  flotte(e, s);
  // la classe qui mine le mieux (la dernière achetée n'est pas forcément la meilleure : l'Escorte est faite pour se battre)
  const mine = k => { const c = mdeCorvette(e, k); return c.soute * Math.sqrt(c.tourelles * c.degats) * c.vol; };
  mdeChangerClasse(e, Object.keys(e.classes).sort((x, y) => mine(y) - mine(x))[0]);
  // la bataille finale : on la relance seulement quand la flotte a grandi depuis le dernier essai
  if (e.aliens.finale && mdeForceFlottes(e) > (s.forceEssai || 0)) { s.forceEssai = mdeForceFlottes(e); const r = mdeFinale(e); if (r) s.finales++; }
  const p = e.aliens.alerte ? e.aliens.alerte.planete : planeteVoulue(e);   // une alerte : on reste défendre
  if (p !== e.planete && mdePeutVoyager(e, p)) { mdeVoyager(e, p); avancer(e, MDE_DUREE_VOYAGE, s); s.voyages++; }
}
// composer la flotte de la planète : la meilleure unité qu'on peut payer, un réparateur au plus ; place pleine = on remplace la plus faible
const FORCE = k => MDE_UNITES[k].pv * Math.max(MDE_UNITES[k].att, 2);
function flotte(e, s) {
  for (let k = 0; k < 12; k++) {
    const F = e.flottes[e.planete], l = mdeAchats(e).filter(a => a.type === 'unite' && a.possible).map(a => a.id.split(':')[1])
      .filter(t => t !== 'reparateur' || !F.some(u => u.type === 'reparateur')).sort((x, y) => FORCE(y) - FORCE(x));
    if (l.length) { mdeAcheter(e, 'unite:' + l[0]); s.achats.push(e.temps); s.liste.push(Math.round(e.temps / 60) + ' unite:' + l[0] + ' ' + e.planete); continue; }
    if (mdeEtage(e) < 4 || F.length < mdePlaces(e)) return;
    const i = F.reduce((m, u, j) => FORCE(u.type) < FORCE(F[m].type) ? j : m, 0), mieux = Object.keys(MDE_UNITES).filter(t => FORCE(t) > FORCE(F[i].type) && (!MDE_UNITES[t].req || MDE_UNITES[t].req(e)));
    const t = mieux.sort((x, y) => FORCE(y) - FORCE(x)).find(t => { const c = MDE_UNITES[t].prix; return e.cr + MDE_UNITES[F[i].type].prix.cr / 2 >= c.cr && Object.keys(c).every(m => m === 'cr' || (e.entrepot[m] || 0) >= c[m]); });
    if (!t) return;
    mdeRetirerUnite(e, e.planete, i);
  }
}
function avancer(e, d, s) {
  for (let t = 0; t < d; t += 2) {
    const ev = mdeAvancer(e, Math.min(2, d - t));
    // alerte : le pilote rentre et part défendre la planète visée (s'il peut payer le voyage)
    if (ev.alerte && ev.alerte.planete !== e.planete && mdeVoyager(e, ev.alerte.planete)) s.voyages++;
    if (ev.attaque) { const r = mdeResoudreAttaque(e, e.planete === ev.attaque.planete); s.vagues++; if (r.victoire) s.gagnees++; }
  }
}
// une partie : s'arrête à la fin (victoire finale) ou à `limite` secondes de jeu
function jouer(graine, pilote, limite, reprise) {
  const P = PILOTES[pilote];
  let e = mdeNouvelle(graine);
  const s = { etages: { 1: 0 }, achats: [], liste: [], pannes: 0, voyages: 0, vagues: 0, gagnees: 0, finales: 0 };
  while (!e.fin && e.temps < limite) {
    const o = sortie(e, P);
    avancer(e, o.duree, s);
    mdeRetour(e, o.soute, o.panne); if (o.panne) s.pannes++;
    avancer(e, 8, s);   // le temps passé au quai
    auQuai(e, P, s);
    const et = mdeEtage(e); if (!(et in s.etages)) s.etages[et] = e.temps;
    if (reprise && e.temps >= reprise) { e = mdeMigrer(JSON.parse(JSON.stringify(e))); reprise = 0; }
  }
  if (e.fin) s.fin = e.temps;
  const a = s.achats.filter(t => !s.fin || t <= s.fin); let ecart = a.length ? a[0] : limite, ou = 0;
  for (let i = 1; i < a.length; i++) if (a[i] - a[i - 1] > ecart) { ecart = a[i] - a[i - 1]; ou = a[i - 1]; }
  s.ecartOu = ou;
  s.ecart = ecart; s.premier = a[0]; s.sorties = e.sorties;
  return { e, s };
}

/* ---------- règles de base ---------- */
{
  const e = mdeNouvelle('base');
  check(mdeEtage(e) === 1 && e.cr === 0 && e.classe === 'eclaireur', 'nouvelle partie : étage 1, 0 CR, Éclaireur');
  check(!mdeAcheter(e, 'amel:soute'), 'sans argent, on ne peut rien acheter');
  const c0 = mdeCorvette(e); e.cr = 1e6;
  check(c0.tourelles === 1 && c0.soute === 4 && c0.vol === 34, 'Éclaireur : 1 tourelle, soute 4, 34 s de vol');
  mdeAcheter(e, 'amel:soute'); mdeAcheter(e, 'amel:reservoir'); mdeAcheter(e, 'amel:canon'); mdeAcheter(e, 'amel:canon');
  const c1 = mdeCorvette(e);
  check(c1.soute === 6 && c1.vol === 44 && c1.degats === 2 && c1.tourelles === 2, 'améliorations : soute +2, réservoir +10 s, canon +1 dégât puis +1 tourelle');
  const prix = l => (mdeAchats(e).find(a => a.id === l) || {}).prix;
  check(prix('amel:canon').cr === Math.round(50 * 1.5 * 2 * 2), 'les prix des améliorations doublent à chaque niveau');
  check(!prix('amel:canon') === false && (mdeAcheter(e, 'amel:canon'), !prix('amel:canon')), 'niveau 4 seulement avec le module central');
  e.station.central = true; e.bases.lune = true;
  for (let i = 0; i < 6; i++) mdeAcheter(e, 'amel:canon');
  check(!prix('amel:canon') && mdeCorvette(e).tourelles === 2 && mdeCorvette(e).degats === 4, 'cinq niveaux au plus (canon 5 : 3 dégâts de plus ; l\'Éclaireur porte 2 tourelles au plus)');
  e.classes.pionniere = true; mdeChangerClasse(e, 'pionniere');
  check(mdeCorvette(e).tourelles === 4 && mdeCorvette(e).soute === 10, 'les améliorations restent en changeant de classe');
  check(!mdeAchats(e).some(a => a.type === 'module'), 'pas de station avant le centre spatial');
  const R = mdeRng('x', 'roches'); let ok = true, ok2 = true;
  for (let i = 0; i < 300; i++) { const r = mdeRoche(e, 'terre', R), l = mdeEclats(r, R); if (l.length < 2 || l.length > 4 || l.some(x => x.taille !== 2 || x.minerai !== r.minerai)) ok = false; const b = mdeButin(e, { taille: 1 }, R); if (b < 1 || b > 2 || mdeButin(e, r, R)) ok2 = false; }
  check(ok, 'une grosse roche se brise en 2 à 4 moyennes du même minerai');
  check(ok2, 'seules les petites roches lâchent du minerai (1 ou 2)');
  const f = mdeNouvelle('panne'), g = mdeRetour(f, { fer: 5 }, true);
  check(g.gain === 2 * 5 && f.sorties === 1, 'panne sèche : on perd la moitié de la soute (arrondie en dessous)');
  const h = mdeNouvelle('garde'); h.cr = 800; h.recherche.centre = true;
  const besoin = mdeBesoins(h).fer, l2 = mdeLivrer(h, { fer: besoin + 3 });
  check(besoin > 0 && h.entrepot.fer === besoin && l2.gain === 15 && !mdeBesoins(mdeNouvelle('vide')).fer, 'le quai garde le fer d\'un module dont on a la moitié des CR et vend le reste (au début, tout est vendu)');
  check(mdePrix(h, 'fer') === 5 && (h.usines.fonderie = 1) && mdePrix(h, 'fer') === 6.25, 'la fonderie augmente le prix du fer');
  check(!mdePeutVoyager(h, 'lune') && (h.recherche.transfert = true) && mdePeutVoyager(h, 'lune') && !mdePeutVoyager(h, 'mars'), 'voyages : la Lune avec le moteur de transfert, Mars plus tard');
  h.station.hangar = true; h.drones.terre = { mineur: 3, cargo: 1 };
  check(mdeProduction(h, 'terre') === 4, 'drones : un cargo sert deux mineurs (3 mineurs + 1 cargo = 4 minerais par minute)');
  const val = () => h.cr + 5 * (h.entrepot.fer || 0), cr0 = val(); for (let i = 0; i < 30; i++) mdeAvancer(h, 2);
  check(val() > cr0, 'les drones rapportent pendant qu\'on joue');
  const fort = Array.from({ length: 4 }, () => mdeUniteCombat(h, { type: 'garde' }));
  const r1 = mdeCombat('c', 'a', fort, mdeVague(h, 1)), r2 = mdeCombat('c', 'b', [], mdeVague(h, 3));
  check(r1.victoire && !r2.victoire && r2.base === 0, 'combat : quatre drones de défense gagnent la vague 1, une base sans flotte tombe');
  const r3 = mdeCombat('c', 'r', fort, mdeVague(h, 6), { retard: 12 }), r4 = mdeCombat('c', 'r', fort, mdeVague(h, 6), { retard: 0 });
  check(r4.base >= r3.base, 'satellites : la flotte qui arrive plus tôt protège mieux la base');
  const k = mdeNouvelle('fin'); check(mdeFinale(k) === null, 'pas de bataille finale avant les vagues');
}

/* ---------- parties complètes ---------- */
const H = 3600, res = {};
for (const pil of ['malin', 'lent', 'rien']) {
  res[pil] = [];
  const n = pil === 'rien' ? 3 : N;
  for (let i = 0; i < n; i++) {
    try { res[pil].push(jouer('g' + i, pil, pil === 'rien' ? 2 * H : 10 * H)); }
    catch (err) { check(false, `${pil} partie ${i} : ${err.stack}`); }
  }
}
for (const pil in res) {
  const L = res[pil].map(x => x.s); if (!L.length) continue;
  const fins = L.filter(s => s.fin);
  console.log(`\n${pil} (${L.length} parties) : fin ${fins.length}/${L.length}, durée médiane ${fins.length ? mn(med(fins.map(s => s.fin))) : '—'}`);
  for (const et of [2, 3, 4]) { const t = L.map(s => s.etages[et]).filter(x => x !== undefined); console.log(`  étage ${et} : ${t.length ? mn(med(t)) : '—'}${t.length < L.length ? ` (${t.length}/${L.length})` : ''}`); }
  console.log(`  premier achat ${mn(med(L.map(s => s.premier || 0)))}, plus long temps sans achat ${mn(Math.max(...L.map(s => s.ecart)))} (médiane ${mn(med(L.map(s => s.ecart)))})`);
  console.log(`  sorties ${moy(L.map(s => s.sorties)).toFixed(0)}, pannes ${(100 * moy(L.map(s => s.pannes / s.sorties))).toFixed(1)} %, voyages ${moy(L.map(s => s.voyages)).toFixed(0)}, vagues gagnées ${moy(L.map(s => s.gagnees)).toFixed(1)}/${moy(L.map(s => s.vagues)).toFixed(1)}, essais de finale ${moy(fins.map(s => s.finales)).toFixed(1)}`);
  if (detail) for (const s of L) console.log('   ', Object.entries(s.etages).map(([k, t]) => k + ':' + Math.round(t / 60)).join(' '), 'fin', s.fin ? Math.round(s.fin / 60) : '—', 'écart', Math.round(s.ecart / 60), 'à', Math.round(s.ecartOu / 60));
}
if (process.argv.includes('--trace')) console.log(res.malin[0].s.liste.join('\n'));
console.log('');
const M = res.malin.map(x => x.s), Lt = res.lent.map(x => x.s), Ri = res.rien.map(x => x.s);
const finM = M.filter(s => s.fin).map(s => s.fin);
check(finM.length === M.length, 'malin : chaque partie va jusqu\'à la fin');
check(med(finM) >= 3 * H && med(finM) <= 5 * H, `malin : durée médiane entre 3 et 5 h (${(med(finM) / H).toFixed(2)} h)`);
check(med(M.map(s => s.etages[2])) >= 15 * 60 && med(M.map(s => s.etages[2])) <= 45 * 60, 'malin : étage 2 vers 30 min (entre 15 et 45)');
check(med(M.map(s => s.premier)) <= 120, 'malin : premier achat en moins de 2 min');
check(Math.max(...M.map(s => s.ecart)) <= 12 * 60, 'malin : jamais plus de ~10 min sans achat (12 au plus)');
check(Lt.every(s => s.fin) && med(Lt.map(s => s.fin)) <= 8 * H, 'lent : finit aussi, en moins de 8 h');
check(res.rien.every(x => mdeEtage(x.e) === 1 && !x.s.etages[2]), 'rien : sans acheter, on reste à l\'étage 1');
check(M.every(s => s.gagnees >= MDE_VAGUES.nombre / 2), 'malin : gagne au moins la moitié des vagues');
// reproductibilité et sauvegarde
const a = jouer('repro', 'malin', 2 * H), b = jouer('repro', 'malin', 2 * H), c = jouer('repro', 'malin', 2 * H, 50 * 60);
check(JSON.stringify(a.e) === JSON.stringify(b.e), 'même graine = même partie');
check(JSON.stringify(a.e) === JSON.stringify(c.e), 'sauvegarde JSON et reprise en cours de partie = même partie');
console.log(fail ? `\n${fail} vérification(s) en échec` : '\nTout est bon.');
process.exit(fail ? 1 : 0);

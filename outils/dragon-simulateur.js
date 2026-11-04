/* Dragon Simulator : règles testées et économie réglée sans navigateur.
   node outils/dragon-simulateur.js [carrieres-par-pilote] [--detail]
   Charge dragon-simulator/regles.js dans le même contexte, comme la page.
   1. Règles de base sur des parties préparées : vol, coup d'ailes, feu et destruction, grenade, voitures,
      animaux, chauves-souris, chocs, les dix bonus, pièces de distance, nid, sauvegarde, décors atteints.
   2. Reproductibilité : même graine = même partie, aussi après sauvegarde JSON en pleine partie.
   3. Carrières : trois pilotes automatiques (habile, moyen, maladroit) jouent des parties à la suite et
      achètent au nid l'amélioration la moins chère, jusqu'à tout avoir (5 niveaux partout).
      Affiche par pilote : durée, distance et pièces de la première et de la dernière partie, parties et
      minutes de jeu pour la première amélioration et pour tout acheter.
   Vérifie les cibles du cahier des charges (§ 4 et § 9, « Réglage de l'économie »).
   Code de sortie 1 si une vérification échoue (outils/verifications.js). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'dragon-simulator', 'regles.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'dragon-simulator/regles.js' });
/* global DS_COUT_AILES, DS_SOL, DS_IPS, DS_PX_M, DS_BIOMES, DS_LONG_BIOME, DS_AMELIORATIONS, DS_NIV_MAX, DS_COUT, DS_BONUS, DS_DUREE, DS_NID_Y,
   dsStats, dsPrix, dsAcheter, dsNouvelleSauvegarde, dsMigrer, dsNouvellePartie, dsPas, dsTerminer, dsPilote, dsGraine, dsBouche, dsBiome */

const N = Number(process.argv[2]) || 4, detail = process.argv.includes('--detail');
let echecs = 0;
const verif = (ok, msg) => { if (!ok) { echecs++; console.log('  ECHEC : ' + msg); } };
const proche = (a, b, e = 1e-9) => Math.abs(a - b) < e;

/* ---------- outils de test ---------- */
function partieVide(niv, graine = 'test') {
  const s = dsNouvelleSauvegarde(); if (niv) Object.assign(s.niv, niv);
  const p = dsNouvellePartie(s, graine);
  p.bat = []; p.obs = []; p.bonus = []; p.route = []; p.nb = p.nr = p.no = p.np = 1e9;   // plus rien ne se crée
  p.lancer = 0; p.d.pose = false; p.d.y = 120; p.d.vx = 1.7; p.d.vy = 0;
  return p;
}
const batiment = (p, x, h = 30, w = 20) => { const o = { id: p.nid++, modele: 'test', x, w, h, hp: h * 0.32, mx: h * 0.32, gain: Math.ceil(h / 10), brule: 0, mort: false }; p.bat.push(o); return o; };
const evs = (p, t) => p.ev.filter(e => e.t === t);

console.log('1. Règles de base');
{
  const st = dsStats({ ecailles: 1, flammes: 1, reserve: 1, ailes: 1 });
  verif(st.coeurs === 2 && st.feuMax === 45 && proche(st.drain, 0.05), 'stats du niveau 1 (2 coeurs, 45 de feu, 0,05 d\'énergie par image)');
  const st5 = dsStats({ ecailles: 5, flammes: 5, reserve: 5, ailes: 5 });
  verif(st5.coeurs === 6 && st5.feuMax === 105 && st5.drain < st.drain && st5.chute < 1, 'stats du niveau 5');
}
{ // lancement du nid
  const p = dsNouvellePartie(dsNouvelleSauvegarde(), 'nid');
  verif(p.d.y === DS_NID_Y && p.d.pose, 'le dragon part posé sur le nid');
  for (let i = 0; i < 30; i++) dsPas(p, {});
  verif(!p.d.pose && p.ev.some(e => e.t === 'envol'), 'envol après 30 images');
  verif(p.bat.length > 3 && p.bonus.length > 0 && p.route.length > 0, 'décor généré devant le dragon');
  for (let i = 0; i < 200; i++) dsPas(p, {}); verif(p.obs.length > 0, 'des obstacles arrivent');
}
{ // coup d'ailes
  const p = partieVide(); dsPas(p, { ailes: true });
  verif(proche(p.energie, 100 - DS_COUT_AILES - p.s.drain) && p.d.vy < -1, 'coup d\'ailes : -2,5 d\'énergie et le dragon remonte');
  p.energie = 2; const vy = p.d.vy; dsPas(p, { ailes: true }); verif(p.d.vy > vy, 'pas de coup d\'ailes sans énergie');
}
{ // plané sans rien toucher : atterrit, durée
  const p = partieVide(); let n = 0; while (!p.fin && n < 20000) { dsPas(p, {}); n++; }
  verif(p.fin === 'atterri', 'sans coup d\'ailes, le dragon finit par atterrir');
  console.log(`   plané seul depuis 120 px : ${(n / DS_IPS).toFixed(1)} s, ${Math.floor(p.dist)} m`);
}
{ // feu : détruit un bâtiment, pièces, réserve
  const p = partieVide(); p.d.y = 200; const b = dsBouche(p.d); const o = batiment(p, b.x + 20, 30, 40);
  let n = 0; p.d.vy = 0;
  while (!o.mort && n < 200) { p.d.y = 200; p.d.vy = 0; p.d.x = b.x - 2 - 8; dsPas(p, { feu: true }); n++; }
  verif(o.mort, 'le feu détruit le bâtiment');
  verif(p.pieces >= o.gain && p.detruits === 1, 'pièces du bâtiment (' + o.gain + ')');
  verif(p.feu < p.s.feuMax, 'le feu s\'use');
  const p2 = partieVide({ flammes: 5 }); p2.d.y = 200; const o2 = batiment(p2, b.x + 20, 30, 40); let n2 = 0;
  while (!o2.mort && n2 < 200) { p2.d.y = 200; p2.d.vy = 0; p2.d.x = b.x - 10; dsPas(p2, { feu: true }); n2++; }
  verif(n2 < n, `FLAMMES 5 brûle plus vite (${n2} images contre ${n})`);
  const p3 = partieVide(); p3.feu = 0; p3.d.y = 200; const o3 = batiment(p3, b.x + 20, 30, 40);
  for (let i = 0; i < 30; i++) { p3.d.y = 200; p3.d.vy = 0; p3.d.x = b.x - 10; dsPas(p3, { feu: true }); } verif(o3.hp === o3.mx && !p3.flamme, 'pas de flamme sans feu');
}
{ // grenade, voitures, animaux, chauves-souris
  const p = partieVide(); p.gren = 1; const a = batiment(p, 100), b = batiment(p, 130), c = batiment(p, 300);
  p.route.push({ id: 900, t: 'voiture', x: 125, v: 0, mort: false }, { id: 901, t: 'animal', x: 120, v: 0.1, peur: 0 });
  a.hp = 0.01; p.d.x = 60; p.d.y = 200;
  for (let i = 0; i < 20 && !a.mort; i++) { p.d.x = 75; p.d.y = 215; p.d.vy = 0; dsPas(p, { feu: true }); }
  verif(a.mort && b.mort && !c.mort && p.gren === 0, 'grenade : le voisin à moins de 50 px est soufflé, pas le lointain');
  verif(p.route[0].mort && !p.route[1].mort && p.route[1].peur > 0, 'grenade : la voiture explose, l\'animal s\'enfuit');
  const q = partieVide(); q.route.push({ id: 5, t: 'animal', x: 0, v: 0.1, peur: 0 }, { id: 6, t: 'voiture', x: 0, v: 0, mort: false });
  q.d.y = DS_SOL - 60; const bq = dsBouche(q.d); q.route[0].x = q.route[1].x = bq.x + Math.cos(1.25) * 56;
  for (let i = 0; i < 5; i++) { q.d.y = DS_SOL - 60; q.d.vy = 0.6; q.d.x = 0; dsPas(q, { feu: true }); }
  verif(q.route[1].mort && q.voitures === 1, 'la voiture explose (+3)');
  verif(!q.route[0].mort && q.route[0].peur > 0, 'l\'animal ne brûle pas, il s\'enfuit');
  const r = partieVide(); r.d.y = 100; const br = dsBouche(r.d); r.obs.push({ id: 7, t: 'chauve', x: br.x + 30, y: br.y + 25, vx: 0, mort: false });
  for (let i = 0; i < 4; i++) { r.d.y = 100; r.d.vy = 0; r.d.x = 0; dsPas(r, { feu: true }); }
  verif(r.obs[0].mort && r.pieces >= 4, 'la chauve-souris brûle (+4)');
}
{ // chocs, cœurs, bouclier
  const p = partieVide(); p.obs.push({ id: 1, t: 'ballon', x: 0, y: 120 });
  p.d.x = 0; dsPas(p, {}); verif(p.coeurs === 1 && p.inv > 0, 'un choc retire un cœur et rend invincible');
  dsPas(p, {}); verif(p.coeurs === 1, 'invincible juste après');
  p.inv = 0; p.d.x = p.obs[0].x; p.d.y = p.obs[0].y; dsPas(p, {}); verif(p.ko && p.coeurs === 0 && p.energie === 0, 'plus de cœurs : le dragon tombe');
  let n = 0; while (!p.fin && n < 2000) { dsPas(p, { ailes: true }); n++; } verif(p.fin === 'chute', 'fin « chute »');
  const q = partieVide(); q.bouclier = 1; q.obs.push({ id: 1, t: 'ballon', x: q.d.x + 1.7, y: 120 });
  dsPas(q, {}); verif(q.coeurs === 2 && q.bouclier === 0 && evs(q, 'bouclier').length === 1, 'le bouclier absorbe un choc');
  const r = partieVide(); batiment(r, r.d.x - 5, DS_SOL - r.d.y + 8, 30); dsPas(r, {}); verif(r.coeurs === 1, 'toucher un toit = un choc');
}
{ // bonus
  const prendre = (t, avant) => { const p = partieVide(); if (avant) avant(p); p.bonus.push({ id: 99, t, x: p.d.x + 1.7, y: p.d.y + 0.05, pris: false }); dsPas(p, {}); return p; };
  let p = prendre('pieces'); verif(p.pieces === 5, 'bonus pièces +5');
  p = prendre('jetpack', q => { q.energie = 50; }); verif(p.jet === DS_DUREE.jetpack && p.energie > 84, 'jetpack : énergie +35');
  const e0 = p.energie; for (let i = 0; i < 60; i++) dsPas(p, {}); verif(p.energie === e0 && p.d.vx > 1.7, 'jetpack : l\'énergie ne baisse plus et il pousse');
  p = prendre('lance', q => { q.feu = 3; }); verif(p.feu === p.s.feuMax, 'lance-flammes : feu au maximum');
  p = prendre('grenade'); verif(p.gren === 1, 'grenade +1');
  p = prendre('bebe', q => { batiment(q, q.d.x + 40, 30); q.d.y = DS_SOL - 30 - 40; });
  for (let i = 0; i < 300 && !p.bat[0].mort; i++) { p.d.y = DS_SOL - 70; p.d.vy = 0; p.d.x = p.bat[0].x - 10; dsPas(p, {}); }
  verif(p.bat[0].mort, 'bébé dragon : il brûle le bâtiment tout seul');
  p = prendre('souffle', q => { q.feu = 0; batiment(q, q.d.x + 120, 30); q.d.y = DS_SOL - 120; });
  for (let i = 0; i < 120 && !p.bat[0].mort; i++) { p.d.y = DS_SOL - 120; p.d.vy = 0; p.d.x = p.bat[0].x - 95; dsPas(p, { feu: true }); }
  verif(p.bat[0].mort && p.feu === 0, 'super-souffle : portée double, sans user le feu');
  { const q = partieVide(); const o = batiment(q, 0, 30); for (let i = 0; i < 120; i++) { q.d.y = DS_SOL - 120; q.d.vy = 0; q.d.x = o.x - 95; dsPas(q, { feu: true }); } verif(o.hp === o.mx, 'sans super-souffle, la même cible est hors de portée'); }
  p = prendre('orage', q => { batiment(q, q.d.x + 10, 30); });
  verif(p.d.vy < -2 && p.bat[0].mort && evs(p, 'eclair').length === 1, 'nuage d\'orage : rebond et éclair sur le bâtiment');
  p = prendre('bouclier'); verif(p.bouclier === 1, 'bouclier');
  p = prendre('aimant', q => { q.bonus.push({ id: 98, t: 'pieces', x: q.d.x + 80, y: q.d.y, pris: false }); });
  for (let i = 0; i < 40; i++) { p.d.vy = 0; dsPas(p, {}); } verif(p.pieces === 5, 'aimant : la pièce lointaine arrive');
  p = prendre('oeuf'); p.bonus.push({ id: 97, t: 'pieces', x: p.d.x + 1.7, y: p.d.y, pris: false }); p.d.vy = 0; dsPas(p, {}); verif(p.pieces === 10, 'œuf d\'or : pièces doublées');
  for (let i = 0; i < DS_DUREE.oeuf; i++) { p.d.vy = 0; p.d.y = 100; dsPas(p, {}); }
  const av = p.pieces; p.bonus.push({ id: 96, t: 'pieces', x: p.d.x + 1.7, y: p.d.y, pris: false }); p.d.vy = 0; dsPas(p, {}); verif(p.pieces - av === 5, 'œuf d\'or : fini après 10 s');
  verif(Object.keys(DS_BONUS).length === 10, 'dix bonus');
}
{ // pièces de distance
  const p = partieVide(); p.d.x = 0; p.mPayes = 0;
  for (let i = 0; i < 2000; i++) { p.d.y = 120; p.d.vy = 0; p.energie = 100; dsPas(p, {}); }
  verif(p.pieces === Math.floor(p.dist / 20), `1 pièce tous les 20 m (${p.pieces} pour ${Math.floor(p.dist)} m)`);
}
{ // décors
  const p = partieVide(); verif(DS_BIOMES.every((b, k) => dsBiome(p, k * DS_LONG_BIOME + 1) === b) && dsBiome(p, DS_BIOMES.length * DS_LONG_BIOME + 1) === 'ville', 'ville, maisons, centre, usines, aéroport, ville…');
  verif(DS_BIOMES.every(b => DS_NOM_BIOME[b]), 'chaque décor a un nom');
  { const q = dsNouvellePartie(dsNouvelleSauvegarde(), "zones"), vus = new Set(); let ok = true;
    for (let x = 0; x < DS_BIOMES.length * DS_LONG_BIOME; x += 150) { q.d.x = x; dsGenerer(q); for (const o of q.bat) { vus.add(o.biome); ok = ok && o.w > 0 && o.h > 0 && o.hp > 0; } }
    verif(DS_BIOMES.every(b => vus.has(b)) && ok, 'chaque décor a des bâtiments à brûler'); }
  const s = dsNouvelleSauvegarde(); s.depart = 'aeroport'; const q = dsNouvellePartie(s, 'a'); verif(q.biome === 'aeroport', 'départ depuis l\'aéroport');
}
{ // nid et sauvegarde
  const s = dsNouvelleSauvegarde(); verif(!dsAcheter(s, 'ailes'), 'pas d\'achat sans pièces');
  s.pieces = 10000; let tot = 0; for (const a of DS_AMELIORATIONS) while (dsPrix(s, a.id) !== null) { tot += dsPrix(s, a.id); dsAcheter(s, a.id); }
  verif(tot === 1920 && s.pieces === 10000 - 1920 && DS_AMELIORATIONS.every(a => s.niv[a.id] === DS_NIV_MAX), 'tout acheter coûte 1 920 pièces');
  verif(!dsAcheter(s, 'ailes'), 'pas au-delà du niveau 5');
  const m = dsMigrer({ pieces: '12', niv: { ailes: 9, flammes: 'x' }, decors: ['aeroport', 'lune'], depart: 'lune' });
  verif(m.pieces === 12 && m.niv.ailes === 5 && m.niv.flammes === 1 && m.decors.join() === 'ville,aeroport' && m.depart === 'ville', 'dsMigrer répare une sauvegarde abîmée');
  verif(JSON.stringify(dsMigrer(null)) === JSON.stringify(dsNouvelleSauvegarde()), 'dsMigrer(null) = sauvegarde neuve');
  const s2 = dsNouvelleSauvegarde(), p = partieVide(); p.pieces = 33; p.d.x = DS_LONG_BIOME + 10; p.dist = p.d.x / DS_PX_M; p.fin = 'atterri';
  const bi = dsTerminer(s2, p); dsTerminer(s2, p);
  verif(s2.pieces === 33 && s2.total.parties === 1, 'la fin de partie ne paie qu\'une fois');
  verif(bi.recordDistance && s2.records.distance === Math.floor(p.dist) && s2.decors.includes('maisons') && bi.nouveauxDecors[0] === 'maisons', 'records et décor atteint');
}
{ // pas de Math.random dans les règles
  verif(!/Math\.random/.test(SRC.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')), 'aucun Math.random dans regles.js');
}

/* ---------- 2. une partie complète, pilotée ---------- */
function alea(graine) { const o = { ra: dsGraine(graine) }; return () => { let a = o.ra = (o.ra + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function jouer(sauv, graine, adresse, coupe) {
  const p = dsNouvellePartie(sauv, graine), A = alea('pilote|' + graine); let n = 0;
  while (!p.fin && n < 60 * 60 * 10) { dsPas(p, dsPilote(p, adresse, A)); n++; if (coupe && n === coupe.a) return coupe.f(p, A, n); }
  return { p, images: n };
}
console.log('2. Reproductibilité');
{
  const s = dsNouvelleSauvegarde(); s.niv = { ecailles: 3, flammes: 3, reserve: 3, ailes: 3 };
  const a = jouer(s, 'repro', 0.7), b = jouer(s, 'repro', 0.7);
  verif(a.images === b.images && a.p.pieces === b.p.pieces && a.p.d.x === b.p.d.x, 'même graine = même partie');
  // sauvegarde JSON en pleine partie, puis reprise
  const c = jouer(s, 'repro', 0.7, { a: 900, f: (p, A, n) => {
    const q = JSON.parse(JSON.stringify(p)); let m = n;
    while (!q.fin && m < 60 * 60 * 10) { dsPas(q, dsPilote(q, 0.7, A)); m++; } return { p: q, images: m }; } });
  verif(c.images === a.images && c.p.pieces === a.p.pieces && c.p.d.x === a.p.d.x, 'reprise après JSON identique');
  const d = jouer(s, 'autre', 0.7); verif(d.p.d.x !== a.p.d.x, 'autre graine = autre partie');
}

/* ---------- 3. carrières : réglage de l'économie ---------- */
const PILOTES = { habile: 1, moyen: 0.6, maladroit: 0.3 };
const ORDRE = DS_AMELIORATIONS.map(a => a.id);
function carriere(nom, adresse, k) {
  const s = dsNouvelleSauvegarde(); const parties = []; let premier = null, tout = null, sec = 0;
  for (let i = 0; i < 400 && !tout; i++) {
    const { p, images } = jouer(s, nom + '|' + k + '|' + i, adresse); const bi = dsTerminer(s, p); sec += images / DS_IPS;
    parties.push({ s: images / DS_IPS, m: bi.distance, pc: bi.pieces, bat: bi.batiments, fin: bi.raison, bonus: p.bonusPris });
    let achat = true;
    while (achat) { achat = false; let best = null; for (const id of ORDRE) { const c = dsPrix(s, id); if (c !== null && c <= s.pieces && (best === null || c < dsPrix(s, best))) best = id; } if (best) { dsAcheter(s, best); achat = true; if (!premier) premier = { parties: i + 1, min: sec / 60 }; } }
    if (ORDRE.every(id => s.niv[id] === DS_NIV_MAX)) tout = { parties: i + 1, min: sec / 60 };
  }
  return { parties, premier, tout, s };
}
const moy = (l, f) => l.reduce((a, x) => a + f(x), 0) / l.length;
console.log(`3. Carrières (${N} par pilote) : 3 premières parties → 3 dernières ; parties (minutes) pour la 1re amélioration et pour tout`);
const res = {};
for (const [nom, adr] of Object.entries(PILOTES)) {
  const cs = []; for (let k = 0; k < N; k++) cs.push(carriere(nom, adr, k));
  const prem = cs.flatMap(c => c.parties.slice(0, 3)), der = cs.flatMap(c => c.parties.slice(-3));   // 3 premières et 3 dernières parties de chaque carrière (une seule = trop de hasard)
  const r = res[nom] = {
    s1: moy(prem, x => x.s), m1: moy(prem, x => x.m), p1: moy(prem, x => x.pc), sN: moy(der, x => x.s), mN: moy(der, x => x.m), pN: moy(der, x => x.pc),
    premier: moy(cs, c => c.premier ? c.premier.parties : 99), tout: moy(cs, c => c.tout ? c.tout.parties : 400), toutMin: moy(cs, c => c.tout ? c.tout.min : 999),
    chutes: moy(cs, c => c.parties.filter(x => x.fin === 'chute').length / c.parties.length),
  };
  console.log(`   ${nom.padEnd(9)} 1re : ${r.s1.toFixed(0)} s, ${r.m1.toFixed(0)} m, ${r.p1.toFixed(0)} pièces → fin : ${r.sN.toFixed(0)} s, ${r.mN.toFixed(0)} m, ${r.pN.toFixed(0)} pièces | 1re amélioration : ${r.premier.toFixed(1)} parties | tout : ${r.tout.toFixed(0)} parties (${r.toutMin.toFixed(0)} min) | chutes ${(r.chutes * 100).toFixed(0)} %`);
  if (detail) for (const c of cs.slice(0, 1)) c.parties.forEach((x, i) => console.log(`      partie ${i + 1} : ${x.s.toFixed(0)} s, ${x.m} m, ${x.pc} pièces, ${x.bat} bâtiments, ${x.bonus} bonus, ${x.fin}`));
}
// cibles (cahier des charges, « Réglage de l'économie »)
const m = res.moyen, x = res.maladroit;
verif(m.s1 >= 20 && m.s1 <= 45, `première partie du pilote moyen : 20 à 45 s (${m.s1.toFixed(0)} s)`);
verif(m.premier <= 2, `première amélioration en 2 parties au plus (moyen : ${m.premier.toFixed(1)})`);
verif(m.tout >= 12 && m.tout <= 45, `tout acheter en 12 à 45 parties (moyen : ${m.tout.toFixed(0)})`);
verif(x.tout < 120, `même le maladroit finit (${x.tout.toFixed(0)} parties)`);
verif(m.sN > m.s1 * 1.3 && m.mN > m.m1 * 1.3, 'le dragon amélioré vole nettement plus loin');

console.log(echecs ? `${echecs} vérification(s) en échec` : 'Tout est bon.');
process.exit(echecs ? 1 : 0);

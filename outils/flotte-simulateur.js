/* Flotte du bureau : contrôle des règles et de la simulation sous Node (lancé par verifications.js).
   node outils/flotte-simulateur.js            → contrôles (départ, revenu, achats, absence, sauvegarde, zones, parties reproductibles, pas de NaN)
   node outils/flotte-simulateur.js rythme     → revenu et flotte d'un joueur qui rachète au mieux, toutes les 5 minutes pendant une heure */
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = {console, Math, Date, JSON, Number}; ctx.window = ctx; vm.createContext(ctx);
// localStorage factice (la sauvegarde l'utilise pour lire et écrire)
const mem = {}; ctx.localStorage = {getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; }};
for (const f of ['regles', 'monde', 'flotte', 'sauvegarde']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'flotte', f + '.js'), 'utf8'), ctx, {filename: f});
const F = ctx.Flotte, R = F.R, S = F.Sim, Sv = F.Save;
const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
let pb = 0; const non = m => { console.error('ÉCHEC ' + m); pb++; };

function jouer(E, secondes) { S.rattraper(E, secondes); }
const sain = E => E.ships.every(s => Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.ang)) && Number.isFinite(E.credits);

// Un joueur simple : rachète ce qui rapporte le plus vite (gain par crédit), puis la zone suivante dès qu'il peut
function racheter(E) {
  for (;;) {
    const zone = E.lv < 3 ? R.ZONES[E.lv + 1].cout : Infinity;
    if (E.credits >= zone && E.ships.length >= 12 * (E.lv + 1)) { S.ouvrirZone(E); continue; }
    const cm = R.cout('m', E.buys.m), ct = R.cout('t', E.buys.t);
    const k = (S.nombre(E, 'm') <= S.nombre(E, 't') * 2 ? 'm' : 't'), c = k === 'm' ? cm : ct;
    if (E.credits < c) return;
    S.acheter(E, k, 1);
  }
}

if (process.argv[2] === 'rythme') {
  const E = S.creer({rng: rnd(11)});
  for (let m = 5; m <= 60; m += 5) {
    for (let i = 0; i < 300; i++) { jouer(E, 1); if (i % 5 === 0) racheter(E); }
    console.log(`${String(m).padStart(2)} min : zone ${E.lv + 1}, ${E.ships.length} navires, revenu ${S.revenu(E, 60).toFixed(1)} cr/s, gagné ${Math.round(E.total)}`);
  }
  process.exit(0);
}

// 1. départ conforme au cahier des charges
const E0 = S.creer({rng: rnd(1)});
if (E0.ships.length !== R.DEPART.m + R.DEPART.t || S.nombre(E0, 'm') !== 5 || S.nombre(E0, 't') !== 3) non('flotte de départ');
if (E0.credits !== 400) non('crédits de départ');
// 2. revenu de départ plausible (1,5 à 5 cr/s) et partie reproductible
const A = S.creer({rng: rnd(5)}), B = S.creer({rng: rnd(5)});
jouer(A, 300); jouer(B, 300);
if (A.total !== B.total || A.ships.some((s, i) => s.x !== B.ships[i].x)) non('deux parties avec la même graine diffèrent');
const rev = S.revenu(A, 60); if (!(rev > 1.5 && rev < 5)) non('revenu de départ hors fourchette : ' + rev.toFixed(2));
// 3. achats : coûts de la formule, lots, jamais plus que les crédits
const C = S.creer({rng: rnd(2)}); C.credits = 1000;
if (R.cout('m', 0) !== 20 || R.cout('t', 0) !== 60 || R.cout('m', 10) !== Math.round(20 * Math.pow(1.08, 10))) non('formule des coûts');
const avant = C.credits, n = S.acheter(C, 'm', 'max');
if (n < 1 || C.credits < 0 || avant - C.credits !== R.coutLot('m', 0, n)) non('achat au maximum');
if (S.acheter(C, 'm', 1) !== 0 && C.credits < 0) non('achat sans crédits');
if (S.acheter(C, 'p', 1) !== 0) non('les patrouilles ne s\'achètent pas encore');
// 4. absence : rattrapage ≤ 10 min, sinon part de veille plafonnée à 24 h
const a1 = R.absence(2, 120, 0), a2 = R.absence(2, 3600, 0), a3 = R.absence(2, 10 * 86400, 10);
if (a1.mode !== 'rattrapage' || a2.mode !== 'veille' || a2.gain !== Math.floor(2 * 3600 * .25)) non('absence courte ou moyenne');
if (a3.duree !== 86400 || a3.part !== .75 || a3.gain !== Math.floor(2 * 86400 * .75)) non('absence plafonnée');
if (R.partVeille(0) !== .25 || R.partVeille(4) !== .45 || R.partVeille(99) !== .75) non('part de veille');
// 5. sauvegarde : aller-retour, navires gardés, reprise après une longue absence
const D = S.creer({rng: rnd(3)}); D.credits = 5000; S.acheter(D, 'm', 10); S.acheter(D, 't', 5); jouer(D, 200);
Sv.enregistrer(D); const lu = Sv.charger();
if (!lu || lu.ships.length !== D.ships.length || Math.round(lu.credits) !== Math.round(D.credits) || lu.buys.m !== D.buys.m) non('aller-retour de la sauvegarde');
const brut = Sv.lire(Sv.CLE, null); brut.quand = Date.now() - 2 * 3600 * 1000; brut.revenu = 3;
const avantCr = lu.credits, rep = Sv.reprendre(lu, brut);
if (rep.mode !== 'veille' || Math.abs(lu.credits - avantCr - 3 * 7200 * .25) > 1) non('reprise après 2 h : ' + (lu.credits - avantCr));
if (Sv.importer({v: 2}) !== null || Sv.importer(null) !== null) non('sauvegarde illisible refusée');
// 6. zones : la portée ouvre les corps, aucun NaN, les gains montent
const Z = S.creer({rng: rnd(4)}); Z.credits = 1e6; S.acheter(Z, 'm', 30);
for (let i = 0; i < 3; i++) if (!S.ouvrirZone(Z)) non('ouverture de la zone ' + (i + 2));
if (Z.lv !== 3 || S.ouvrirZone(Z)) non('quatre zones au plus');
jouer(Z, 600); if (!sain(Z)) non('NaN après l\'ouverture des zones');
if (!Z.ships.some(s => s.ore === 'iridium' && s.trips > 0) && !Z.ships.some(s => s.ore !== 'fer')) non('les mineurs ne vont pas dans les zones lointaines');
// 7. une heure sans NaN, avec un joueur qui rachète
const H = S.creer({rng: rnd(9)}); for (let i = 0; i < 720; i++) { jouer(H, 5); racheter(H); }
if (!sain(H)) non('NaN après une heure'); if (!(S.revenu(H, 60) > rev * 3)) non('le revenu ne croît pas : ' + S.revenu(H, 60).toFixed(1));
if (!(H.lv >= 2)) non('en une heure, le joueur simple devrait avoir ouvert au moins trois zones (zone ' + (H.lv + 1) + ')');
if (pb) { console.error(pb + ' échec(s)'); process.exit(1); }
console.log('Flotte du bureau : tout est bon');

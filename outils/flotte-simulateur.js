/* Flotte du bureau : contrôle des règles et de la simulation sous Node (lancé par verifications.js).
   node outils/flotte-simulateur.js            → contrôles (départ, revenu, achats, absence, sauvegarde, zones, parties reproductibles, pas de NaN)
   node outils/flotte-simulateur.js rythme     → revenu et flotte d'un joueur qui rachète au mieux, toutes les 5 minutes pendant une heure */
const vm = require('vm'), fs = require('fs'), path = require('path');
const ctx = {console, Math, Date, JSON, Number}; ctx.window = ctx; vm.createContext(ctx);
// localStorage factice (la sauvegarde l'utilise pour lire et écrire)
const mem = {}; ctx.localStorage = {getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; }};
for (const f of ['regles', 'monde', 'flotte', 'pirates', 'sauvegarde']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'flotte', f + '.js'), 'utf8'), ctx, {filename: f});
const F = ctx.Flotte, R = F.R, S = F.Sim, Sv = F.Save;
const rnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
let pb = 0; const non = m => { console.error('ÉCHEC ' + m); pb++; };

function jouer(E, secondes) { S.rattraper(E, secondes); }
const sain = E => E.ships.every(s => Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.ang)) && Number.isFinite(E.credits);

// Un joueur raisonnable : ouvre la zone dès qu'il peut ; sinon rachète ce qui rapporte le plus par crédit (navire, soute, moteurs),
// en économisant pour la zone quand elle est à moins de trois minutes de revenu
function racheter(E) {
  for (let g = 0; g < 60; g++) {
    const rev = S.revenu(E, 60), par = rev / (E.ships.length || 1), zc = E.lv < 3 ? R.coutZone(E.lv + 1, E.h.n) : Infinity;
    if (E.credits >= zc) { S.ouvrirZone(E); continue; }
    const o = [['m', R.cout('m', E.buys.m), par], ['t', R.cout('t', E.buys.t), par]];
    if (E.up.soute < 10) o.push(['soute', R.coutAmelio('soute', E.up.soute), rev * .1 / (1 + .1 * E.up.soute)]);
    if (E.up.mot < 10) o.push(['mot', R.coutAmelio('mot', E.up.mot), rev * .55 * .08 / (1 + .08 * E.up.mot)]);
    // une patrouille par avant-poste ouvert : elle évite un pillage sur six environ (≈ 15 % du revenu au total)
    if (E.patrouilles.length < 2 * (E.lv + 1)) o.push(['p', R.cout('p', E.buys.p), rev * .15 / (2 * (E.lv + 1))]);
    o.sort((a, b) => b[2] / b[1] - a[2] / a[1]);
    const [k, c] = o[0];
    if (zc < Infinity && zc - E.credits < rev * 180 && E.credits < zc) return;
    if (E.credits < c) return;
    if (k === 'm' || k === 't' || k === 'p') S.acheter(E, k, 1); else S.ameliorer(E, k);
  }
}
// Dépense les éclats : rendement d'abord, puis moteurs, flotte, veille et portée de départ
function depenser(E, ordre) { let fait = true; while (fait) { fait = false; for (const k of ordre) if (S.acheterHorizon(E, k)) { fait = true; break; } } }
// Joue une partie ; avec horizon, relance dès que c'est possible. Note la minute d'ouverture de chaque zone (premier Horizon seulement) et la durée de chaque Horizon.
function partie(graine, minutes, affiche, horizon, ordre) {
  let E = S.creer({rng: rnd(graine)}); const ouv = {}, durees = []; let debut = 0;
  ordre = ordre || ['gains', 'moteurs', 'flotte', 'veille', 'portee'];
  for (let s = 0; s < minutes * 60; s += 2) {
    S.rattraper(E, 2); if (s % 10 === 0) racheter(E);
    if (E.h.n === 0) for (let z = 1; z <= 3; z++) if (E.lv >= z && !ouv[z]) ouv[z] = s / 60;
    if (horizon && s % 10 === 0 && R.peutHorizon(E.lv, E.total)) { durees.push((s - debut) / 60); debut = s; E = S.horizon(E); depenser(E, ordre); if (affiche) console.log(`Horizon ${E.h.n} après ${Math.round(durees[durees.length - 1])} min, éclats ${E.h.gagnes}, niveaux ${JSON.stringify(E.h.niv)}`); }
    if (affiche && s % 900 === 0 && s > 0) console.log(`${String(Math.round(s / 60)).padStart(3)} min : zone ${E.lv + 1}, ${E.ships.length} navires, revenu ${S.revenu(E, 60).toFixed(1)} cr/s, moteurs ${E.up.mot}, soute ${E.up.soute}`);
  }
  return {E, ouv, durees};
}

if (process.argv[2] === 'rythme') {
  const r = partie(11, +process.argv[3] || 240, true, process.argv[4] === 'horizons');
  console.log('ouvertures (min) : ' + [1, 2, 3].map(z => 'zone ' + (z + 1) + ' à ' + (r.ouv[z] == null ? '—' : Math.round(r.ouv[z]))).join(', ') + (r.durees.length ? ' ; Horizons après ' + r.durees.map(Math.round).join(', ') + ' min' : ''));
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

// 3 bis. améliorations : coûts, plafonds, effet sur la vitesse et sur les gains
const U = S.creer({rng: rnd(6)}); U.credits = 1e9;
if (R.coutAmelio('mot', 0) !== 80 || R.coutAmelio('soute', 2) !== Math.round(120 * 1.9 * 1.9)) non('coût des améliorations');
for (let i = 0; i < 12; i++) { S.ameliorer(U, 'mot'); S.ameliorer(U, 'soute'); }
if (U.up.mot !== 10 || U.up.soute !== 10) non('plafond des améliorations');
if (Math.abs(R.multVitesse(10) - 1.8) > 1e-9 || Math.abs(R.multGain(10) - 2) > 1e-9) non('effets des améliorations');
const rapide = S.creer({rng: rnd(8)}), lent = S.creer({rng: rnd(8)}); rapide.up.mot = 10; rapide.up.soute = 10; jouer(rapide, 600); jouer(lent, 600);
if (!(rapide.total > lent.total * 1.8)) non('les améliorations ne rapportent pas : ' + Math.round(rapide.total) + ' contre ' + Math.round(lent.total));
// 3 ter. pirates : ils arrivent, pillent (jamais plus que les crédits), et les patrouilles les détruisent en rendant le butin plus une prime
const PA = S.creer({rng: rnd(12)}), PB = S.creer({rng: rnd(12)});
PB.credits = 1e6; S.acheter(PB, 'p', 3); PB.credits = 400;
for (let i = 0; i < 1200; i++) { jouer(PA, 1); jouer(PB, 1); if (PA.credits < 0 || PB.credits < 0) { non('crédits négatifs'); break; } }
if (PA.stats.perdu <= 0) non('aucun pillage en 20 minutes sans patrouille');
if (PA.stats.detruits !== 0) non('un pirate détruit sans patrouille');
if (!(PB.stats.detruits >= 2) || !(PB.stats.primes > 0)) non('les patrouilles ne détruisent pas les pirates : ' + PB.stats.detruits);
if (!(PB.stats.perdu < PA.stats.perdu)) non('les patrouilles ne réduisent pas les pertes : ' + Math.round(PB.stats.perdu) + ' contre ' + Math.round(PA.stats.perdu));
if (PA.pirates.length > R.maxPirates(PA.lv)) non('trop de pirates à la fois');
if (R.butin(5, 1e9) !== 50 || R.butin(0.1, 1e9) !== 10 || R.butin(1e6, 30) !== 30) non('formule du butin');
// la veille ne fait pas venir de pirates, la sauvegarde rend les patrouilles
const SV = S.creer({rng: rnd(14)}); SV.credits = 1e5; S.acheter(SV, 'p', 4); jouer(SV, 30); Sv.enregistrer(SV);
const rv = Sv.charger(); if (!rv || rv.patrouilles.length !== 4) non('patrouilles perdues à la sauvegarde');
const avantStats = JSON.stringify(rv.stats), brutV = Sv.lire(Sv.CLE, null); brutV.quand = Date.now() - 5 * 3600 * 1000; Sv.reprendre(rv, brutV);
if (JSON.stringify(rv.stats) !== avantStats || rv.pirates.length) non('des pirates sont venus pendant la veille');
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
// 7. rythme : un joueur raisonnable ouvre la zone 2 en 5 à 15 min, la 3 en 25 à 60, la 4 en 70 à 140 ; pas de NaN
const H = partie(9, 215, false, true);
if (!sain(H.E)) non('NaN après 3 h 35');
const borne = [[1, 5, 15], [2, 25, 60], [3, 70, 140]];
for (const [z, mini, maxi] of borne) { const t = H.ouv[z]; if (t == null || t < mini || t > maxi) non('la zone ' + (z + 1) + ' s\'ouvre à ' + (t == null ? 'jamais' : Math.round(t)) + ' min (visé : ' + mini + ' à ' + maxi + ')'); }
// Horizon : le premier arrive vers 2 h, le deuxième est plus rapide (au moins 10 %) mais pas trivial
if (H.durees.length < 2) non('moins de deux Horizons en 3 h 35 : ' + H.durees.map(Math.round).join(', '));
else { const [d1, d2] = H.durees; if (d1 < 90 || d1 > 150) non('premier Horizon à ' + Math.round(d1) + ' min (visé : 90 à 150)'); if (!(d2 < d1 * .9) || !(d2 > d1 * .4)) non('deuxième Horizon à ' + Math.round(d2) + ' min contre ' + Math.round(d1) + ' pour le premier'); }
// 8. Horizon : seuil, éclats, remise à zéro, améliorations permanentes, friction, sauvegarde
const HZ = S.creer({rng: rnd(21)});
if (S.horizon(HZ) !== null) non('Horizon possible dès le départ');
HZ.lv = 3; HZ.total = R.HORIZON.seuil - 1; if (S.horizon(HZ) !== null) non('Horizon sous le seuil');
HZ.total = R.HORIZON.seuil; HZ.credits = 1234; HZ.up.mot = 5; HZ.buys.m = 40;
const H1 = S.horizon(HZ);
if (!H1 || H1.h.n !== 1 || H1.h.eclats !== 3 || H1.h.gagnes !== 3 || H1.credits !== 400 || H1.total !== 0 || H1.lv !== 0 || H1.ships.length !== 8 || H1.up.mot !== 0 || H1.buys.m !== 0) non('remise à zéro de l\'Horizon');
if (R.eclatsPour(R.HORIZON.seuil * 4) !== 6 || R.eclatsPour(0) !== 0) non('formule des éclats');
H1.h.eclats = 1000; let totalCout = 0, nb = 0;
for (const k of Object.keys(R.HORIZON.AMELIO)) { const a = R.HORIZON.AMELIO[k]; for (let i = 0; i < a.max + 2; i++) { const av = H1.h.eclats; if (S.acheterHorizon(H1, k)) { totalCout += av - H1.h.eclats; nb++; } } if (H1.h.niv[k] !== a.max) non('plafond de ' + k); }
if (nb !== 10 + 10 + 5 + 5 + 3) non('nombre de niveaux achetés : ' + nb); if (1000 - H1.h.eclats !== totalCout || H1.h.eclats < 0) non('coût des niveaux d\'Horizon');
H1.h.eclats = 0; if (S.acheterHorizon(H1, 'veille')) non('achat sans éclats');
const gain = (niv, n) => { const h = R.horizonDepart(); Object.assign(h.niv, niv); h.n = n || 0; const E = S.creer({rng: rnd(22), h}); jouer(E, 600); return E; };
const g0 = gain({}), g10 = gain({gains: 10});
if (!(g10.total > g0.total * 2) || !(g10.total < g0.total * 3.5)) non('le rendement ne multiplie pas les gains : ' + Math.round(g10.total) + ' contre ' + Math.round(g0.total));
const fl = gain({flotte: 2}); if (fl.ships.length !== 8 + 12 + 8) non('flotte de départ : ' + fl.ships.length);
const po = gain({portee: 2}); if (po.lv !== 2 || !sain(po) || !po.ships.some(s => s.ore !== 'fer')) non('portée de départ');
if (R.coutZone(1, 2) !== Math.round(3000 * 1.2) || R.coutZone(1, 0) !== 3000 || !(R.frequencePirates(3) > 1.1)) non('friction');
const fr = S.creer({rng: rnd(23)}); fr.h.n = 2; fr.credits = R.coutZone(1, 2) - 1; if (S.ouvrirZone(fr)) non('la portée ne coûte pas plus cher après un Horizon'); fr.credits++; if (!S.ouvrirZone(fr)) non('portée impossible au prix de la friction');
const vh = S.creer({rng: rnd(24)}); vh.h.niv.veille = 4; vh.h.eclats = 5; if (!S.acheterHorizon(vh, 'veille') || vh.veille !== 5 || R.partVeille(vh.veille) !== .5) non('la veille ne monte pas');
H1.h.eclats = 7; H1.h.n = 2; Sv.enregistrer(H1); const hr = Sv.charger();
if (!hr || hr.h.n !== 2 || hr.h.eclats !== 7 || JSON.stringify(hr.h.niv) !== JSON.stringify(H1.h.niv) || hr.veille !== H1.h.niv.veille || hr.ships.length !== H1.ships.length) non('sauvegarde de l\'Horizon');
if (pb) { console.error(pb + ' échec(s)'); process.exit(1); }
console.log('Flotte du bureau : tout est bon');

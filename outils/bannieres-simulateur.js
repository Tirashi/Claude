/* Bannières : parties complètes jouées sans navigateur, joueur automatique contre les rivaux.
   node outils/bannieres-simulateur.js [nombre-de-parties] [--detail]
   Charge regles.js, surprises.js et ia.js dans un même contexte, comme la page.
   Affiche : fins de partie (château pris, 3 châteaux, drapeaux gagnés ou perdus), drapeaux
   et pièces du joueur aux tours 10, 20, 25, batailles, bâtiments.
   Vérifie : même graine = même partie (aussi après sauvegarde et rechargement JSON en cours
   de partie), les règles de base (pas, achat, village, bataille, garde, seigneur blessé, chute
   d'un rival, fin), l'équilibrage grossier (facile plus doux que normal), aucune erreur, aucun
   Math.random. Code de sortie 1 si une vérification échoue (outils/verifications.js). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const DOSSIER = path.join(__dirname, '..', 'bannieres');
for (const f of ['regles.js', 'surprises.js', 'ia.js']) vm.runInThisContext(fs.readFileSync(path.join(DOSSIER, f), 'utf8'), { filename: 'bannieres/' + f });
/* global banGarnison, banEnnemiSur, banMaxUnites, banAmeliorer, banSoigner, banGagner, banPrix, BAN_COFFRE, banNouvelle, banMigrer, banIaJouer, banFinTour, banChances, banDeplacer, banAtteignables, banAcheter, banConstruire, banDecorer, banResoudre, banApercu, banArmeeSur, banArmeesDe, banArmee, banChateau, banVoisins, banDrapeaux, banChateaux, banNbBat, banEtapeChateau, banRevenu, banCoeursMax, banSimuler, banVerifierFin, banUnite, banGrille, BAN_DERNIER_TOUR, BAN_SURPRISES, BAN_UNITES, BAN_POINTS */

const K = Number(process.argv[2]) || 200, detail = process.argv.includes('--detail');
let fail = 0;
const check = (ok, msg) => { console.log((ok ? 'ok   ' : 'ÉCHEC ') + msg); if (!ok) fail++; };

// le joueur automatique : il joue comme un rival « malin », et se défend avec la tactique qui a le plus d'étoiles
const defense = (e, id, i) => { const ch = banChances(e, id, i, 1); return ch.tenir > ch.charger ? 'tenir' : 'charger'; };
const vus = {};
let anomalies = 0;
function controler(e) {   // ce qui ne doit jamais arriver
  if (e.terres.some(t => (t.garnison || []).length > 6)) anomalies++;
  for (let s = 0; s < 4; s++) if (banArmeesDe(e, s).length > 3 || e.seigneurs[s].pieces < 0) { anomalies++; if (anomalies < 4) console.log('armées', s, banArmeesDe(e, s).length, e.seigneurs[s].pieces); }
  if (e.seigneurs.some(S => S.pieces > 30)) { anomalies++; if (anomalies < 4) console.log('coffre', e.seigneurs.map(S => S.pieces)); }
  if (e.armees.some(a => a.unites.length > 8 || !a.unites.length || a.unites.some(u => u.pv <= 0))) anomalies++;
  if (new Set(e.armees.map(a => a.terre)).size !== e.armees.length) anomalies++;
}
function jouerTour(e, stats) {
  for (const b of banIaJouer(e, 0, { car: 'malin' })) if (b) { stats.batailles++; if (b.issue === 'victoire') stats.gagnees++; }
  for (let s = 1; s < 4 && !e.fin; s++) for (const b of banIaJouer(e, s, { defense })) if (b && b.sDef === 0) stats.subies++;
  controler(e);
  if (!e.fin) { const r = banFinTour(e); if (r && r.surprise) vus[r.surprise.id] = (vus[r.surprise.id] || 0) + 1; }
}
function partie(graine, niveau, coupe, rayon) {
  let e = banNouvelle(graine, niveau || 'facile', rayon);
  const stats = { batailles: 0, gagnees: 0, subies: 0 }, traces = {};
  for (let n = 0; n < 40 && !e.fin; n++) {
    if (coupe && e.tour === coupe) e = banMigrer(JSON.parse(JSON.stringify(e)));   // sauvegarde et rechargement
    jouerTour(e, stats);
    if ([10, 20, 25].includes(e.tour)) traces[e.tour] = [0, 1, 2, 3].map(s => banDrapeaux(e, s)).concat(e.seigneurs[0].pieces, banNbBat(e, 0));
  }
  return { e, traces, stats };
}

// 1. déterminisme et carte
{
  const a = JSON.stringify(partie(20261022).e), b = JSON.stringify(partie(20261022).e), c = JSON.stringify(partie(20261022, 'facile', 12).e);
  check(a === b, 'même graine → même partie');
  check(a === c, 'même partie après sauvegarde et rechargement au tour 12');
  const cartes = [1, 2, 3].map(g => banNouvelle(20261022 + g).terres.map(t => t.t[0]).join(''));
  check(new Set(cartes).size === 3 && cartes.every((x, i) => cartes.slice(i + 1).every(y => [...x].filter((ch, j) => ch !== y[j]).length > 12)), 'trois graines → trois cartes nettement différentes');
  const e = banNouvelle(42);
  check(e.terres.length === 37 && [0, 1, 2, 3].every(s => e.terres[banChateau(e, s)].bat === 'chateau' && banDrapeaux(e, s) === 3), 'carte : 37 cases, 4 châteaux et 2 cases chacun');
  check(e.terres.filter(t => t.camp).length === 2 && e.terres.filter(t => t.ruine).length === 2, 'carte : 2 camps de brigands, 2 ruines hantées');
  const g = banNouvelle(42, 'normal', 4);
  check(g.terres.length === 61 && banGrille(4).coins.every((c, s) => g.terres[c].prop === s) && g.terres.filter(t => t.camp).length === 3, 'grande carte : 61 cases, 3 camps');
  check(new Set(e.seigneurs.slice(1).map(S => S.car)).size === 3, 'les 3 rivaux ont 3 caractères différents');
  { const v = banNouvelle(42, 'facile', 3, 'violet'); check(v.seigneurs[0].coul === 'violet' && new Set(v.seigneurs.map(S => S.coul)).size === 4 && JSON.stringify(v.terres.map(t => t.t)) === JSON.stringify(e.terres.map(t => t.t)), 'couleur choisie : le joueur est violet, les rivaux ont les 3 autres, même carte'); }
  const src = ['regles.js', 'surprises.js', 'ia.js'].map(f => fs.readFileSync(path.join(DOSSIER, f), 'utf8')).join('\n').replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
  check(!/Math\.random/.test(src), 'aucun Math.random() dans les règles');
}

// 2. règles de base
{
  const e = banNouvelle(7, 'facile'), J = e.seigneurs[0], c = banChateau(e, 0);
  check(J.pieces === 12 && e.seigneurs[1].pieces >= 10 && banRevenu(e, 0) === 3 + 1, 'facile : 12 pièces au départ, +1 pièce par case et +1 de bonus');
  const a = banArmeeSur(e, c), m = banAtteignables(e, a);
  check([...m].every(([j, v]) => v.cout <= BAN_POINTS), 'bouger : 2 pas au plus');
  check([...m.keys()].every(j => e.terres[j].t !== 'montagne' || banVoisins(e, j).every(k => !m.has(k) || m.get(k).de !== j)), 'bouger : une montagne arrête');
  const j = [...m.keys()].find(k => !banArmeeSur(e, k));
  const r = banDeplacer(e, a.id, j);
  check(r.ok && a.terre === j && e.terres[j].prop === 0 && !banDeplacer(e, a.id, c).ok, 'bouger : une fois par tour, la case traversée est prise');
  check(banAcheter(e, 0, 'fantassin').ok && J.pieces === 9 && banArmeeSur(e, c).unites.length === 1, 'acheter : 3 pièces, le chevalier attend au château');
  check(!banAcheter(e, 0, 'champion').ok, 'acheter : un champion seulement avec une caserne');
  const libre = e.terres.map((t, i) => i).find(i => e.terres[i].prop === 0 && !e.terres[i].bat);
  check(banConstruire(e, 0, libre, 'maison').ok && J.pieces === 5 && !banConstruire(e, 0, libre, 'moulin').ok && banRevenu(e, 0) === banDrapeaux(e, 0) + 1 + 1, 'construire : une maison (4 pièces, +1 par tour), un bâtiment par case');
  const d1 = banDecorer(e, 0, libre), d2 = banDecorer(e, 0, libre), d3 = banDecorer(e, 0, libre);
  check(d1.ok && d2.ok && d3.ok && !banDecorer(e, 0, libre).ok && new Set(e.terres[libre].decos).size === 3 && J.pieces === 2, 'décorer : 1 pièce, 3 au plus par case, toutes différentes');
  const f = banNouvelle(8, 'facile'); f.seigneurs[0].pieces = 99;
  const l0 = banArmeesDe(f, 0)[1], pv0 = l0.unites.find(u => u.type === 'lancier').pv;
  const case2 = f.terres.map((t, i) => i).filter(i => f.terres[i].prop === 0 && !f.terres[i].bat);
  banConstruire(f, 0, case2[0], 'forge');
  check(l0.unites.find(u => u.type === 'lancier').pv === pv0 + 1 && banUnite(f, 'fantassin', 0).pv === 4, 'forge : chevaliers et lanciers ont 1 cœur de plus');
  banConstruire(f, 0, case2[1], 'caserne');
  const g = banConstruire(f, 0, f.terres.findIndex(t => t.prop < 0 && !t.bat), 'maison');
  check(!g.ok, 'construire : seulement sur une case à soi');
  f.terres.forEach((t, i) => { if (!t.bat && t.prop < 0 && !t.camp && !t.ruine && banNbBat(f, 0) < 6) { t.prop = 0; const x = banConstruire(f, 0, i, 'maison'); if (banNbBat(f, 0) === 3 || banNbBat(f, 0) === 6) check(x.grandit, `le château grandit à ${banNbBat(f, 0)} bâtiments`); } });
  check(banEtapeChateau(f, 0) === 2, 'château : drapeaux à 3 bâtiments, remparts à 6');
  check(banMaxUnites(f, 0) === 8 && banMaxUnites(e, 0) === 6, 'remparts : 8 guerriers par armée au lieu de 6');
  // améliorer un bâtiment, une fois
  const mais = f.terres.findIndex(t => t.prop === 0 && t.bat === 'maison'), rev = banRevenu(f, 0), p0 = f.seigneurs[0].pieces;
  check(banAmeliorer(f, 0, mais).ok && banRevenu(f, 0) === rev + 1 && f.seigneurs[0].pieces === p0 - 4 && !banAmeliorer(f, 0, mais).ok, 'améliorer : une grande maison (+1 pièce de plus), une seule fois, au prix du bâtiment');
  check(!banConstruire(f, 0, f.terres.findIndex(t => t.prop === 0 && !t.bat), 'forge').ok, 'une seule forge (elles ne s\'additionnent pas)');
  const cas = f.terres.findIndex(t => t.prop === 0 && t.bat === 'caserne'); f.seigneurs[0].pieces = 20;
  check(banAmeliorer(f, 0, cas).ok && banPrix(f, 0, 'champion') === 6, 'grande caserne : construite (le champion coûte toujours 6)');
  { const z3 = JSON.parse(JSON.stringify(f)); const x = { id: 950, s: 0, terre: cas, pts: 0, combat: true, unites: [banUnite(z3, 'champion', 0)] }; x.unites[0].pv = 1; z3.armees = z3.armees.filter(a => a.terre !== cas); z3.armees.push(x); banFinTour(z3);
    check(banArmee(z3, 950).unites[0].pv === 1 + Math.ceil((banCoeursMax(z3, 'champion', 0) - 1) / 2), 'grande caserne : elle soigne la moitié des cœurs perdus, même après une bataille'); }
  { const z4 = JSON.parse(JSON.stringify(f)); const r1 = { id: 960, s: 1, terre: banVoisins(z4, cas).find(i => !banArmeeSur(z4, i)), pts: 2, combat: false, unites: [banUnite(z4, 'fantassin', 1)] }; z4.armees = z4.armees.filter(a => a.terre !== cas); z4.armees.push(r1);
    const ap4 = banApercu(z4, 960, cas); check(banEnnemiSur(z4, 1, cas) && ap4 && ap4.garde === 2 && !banAtteignables(z4, r1).get(cas)?.passe, 'une caserne a une petite garde : on ne la prend plus en marchant dessus'); }
  const tg = f.terres.findIndex(t => t.prop < 0 && !t.bat && !t.camp && !t.ruine); f.terres[tg].prop = 0; banConstruire(f, 0, tg, 'tour');
  f.armees.push({ id: 901, s: 0, terre: tg, pts: 0, combat: false, unites: [banUnite(f, 'archer', 0)] });
  const tirs = gr => { f.terres[tg].grand = gr; const x = { id: 900, s: 1, terre: banVoisins(f, tg).find(i => !banArmeeSur(f, i)), pts: 2, combat: false, unites: [banUnite(f, 'fantassin', 1)] }; f.armees.push(x); const ap2 = banApercu(f, 900, tg); f.armees.splice(f.armees.indexOf(x), 1); return ap2 && ap2.tourDef; };
  check(tirs(false) === 1 && tirs(true) === 2, 'tour : 1 volée de plus, 2 avec une grande tour');
  // la garnison d'une grande tour : elle reste pour toujours et défend la tour avec la garde
  { f.terres[tg].grand = true; const gar0 = { id: 970, s: 0, terre: tg, pts: 2, combat: false, unites: ['seigneur', 'archer', 'archer', 'lancier'].map(t => banUnite(f, t, 0)) }; f.armees = f.armees.filter(a => a.id !== 901 && a.terre !== tg); f.armees.push(gar0);
    const r = banGarnison(f, 0, 970);
    check(r.ok && r.n === 3 && f.terres[tg].garnison.length === 3 && banArmee(f, 970).unites.length === 1, 'garnison : les guerriers restent dans la grande tour, le seigneur reste dehors');
    f.armees = f.armees.filter(a => a.id !== 970);
    const x = { id: 971, s: 1, terre: banVoisins(f, tg).find(i => !banArmeeSur(f, i)), pts: 2, combat: false, unites: [banUnite(f, 'champion', 1)] }; f.armees.push(x);
    const ap = banApercu(f, 971, tg); check(ap && ap.nGarnison === 3 && ap.D.length === 5 && ap.tourDef === 2, 'garnison : elle défend la tour avec la garde (et 2 volées de plus)');
    f.armees = f.armees.filter(a => a.id !== 971); }
  f.armees.splice(f.armees.findIndex(a => a.id === 901), 1);
  // le coffre plein à 30
  f.seigneurs[0].pieces = 28;
  check(banGagner(f, 0, 5) === 2 && f.seigneurs[0].pieces === BAN_COFFRE && banGagner(f, 0, 3) === 0, 'coffre : plein à 30 pièces');
  // soigner au château
  const gar = banArmeeSur(f, banChateau(f, 0)); gar.unites[0].pv = 1; f.seigneurs[0].pieces = 5;
  check(banSoigner(f, 0, gar.id).ok && gar.unites.every(u => u.pv === banCoeursMax(f, u.type, 0)) && f.seigneurs[0].pieces === 4 && !banSoigner(f, 0, gar.id).ok, 'soigner : 1 pièce au château, tous les cœurs reviennent');
  const dehors = banArmeesDe(f, 0).find(a => a.terre !== banChateau(f, 0)); dehors.unites[0].pv = 1;
  check(!banSoigner(f, 0, dehors.id).ok, 'soigner : seulement au château');
  // une bataille : la règle est la même pour les étoiles et pour le combat
  const A = ['fantassin', 'fantassin', 'archer'].map(t => banUnite(f, t, 0)), D = ['barbare', 'voleur'].map(t => banUnite(f, t, -1));
  check(JSON.stringify(banSimuler(A, D, 'charger', 'charger', 'plaine', false, 5)) === JSON.stringify(banSimuler(A, D, 'charger', 'charger', 'plaine', false, 5)), 'bataille : même graine, même bataille');
  // la garde d'un château vide ; le seigneur blessé ; la chute d'un rival
  const h = banNouvelle(9, 'normal'), c1 = banChateau(h, 1);
  h.armees = h.armees.filter(x => x.terre !== c1);
  const v = banVoisins(h, c1)[0]; h.armees.filter(x => x.terre === v).forEach(x => h.armees.splice(h.armees.indexOf(x), 1));
  const fort = { id: 500, s: 0, terre: v, pts: 2, combat: false, unites: ['seigneur', 'champion', 'champion', 'fantassin', 'fantassin', 'archer'].map(t => banUnite(h, t, 0)) };
  h.armees.push(fort);
  const ap = banApercu(h, 500, c1);
  check(ap && ap.garde === 4 && ap.D.length === 4, 'un château sans armée se défend avec sa garde (4 guerriers)');
  { const z2 = banNouvelle(9, 'facile'), c0 = banChateau(z2, 0), r1 = z2.armees.find(x => x.s === 1); r1.terre = banVoisins(z2, c0).find(i => !banArmeeSur(z2, i)); const ap0 = banApercu(z2, r1.id, c0);
    check(ap0 && ap0.nArmee === 4 && ap0.D.length === 9, 'au château, la garde (5 en facile) se bat avec l\'armée qui y est'); }
  const deplace = banDeplacer(h, 500, c1);
  check(deplace.ok && deplace.bataille && fort.terre === v, 'attaquer : l\'armée s\'arrête devant le château');
  let res = null;
  const troupe = JSON.stringify(fort.unites);
  for (let k = 0; k < 30 && !(res && res.issue === 'victoire'); k++) { fort.unites = JSON.parse(troupe); fort.terre = v; if (!h.armees.includes(fort)) h.armees.push(fort); h.nb = k; res = banResoudre(h, 500, c1, 'charger', 'tenir'); }
  check(res && res.issue === 'victoire' && res.chateau && h.seigneurs[1].tombe && !banArmeesDe(h, 1).length && banChateaux(h, 0) === 2, 'château pris : le rival tombe, ses cases et ses bâtiments sont à toi');
  const k2 = banNouvelle(10, 'facile'), roi = banArmeeSur(k2, banChateau(k2, 0)), seig = roi.unites.find(u => u.type === 'seigneur');
  const brig = k2.armees.find(x => x.s === -1); roi.terre = banVoisins(k2, brig.terre).find(i => !banArmeeSur(k2, i)); roi.unites = [seig]; seig.pv = 1;
  const rb = banResoudre(k2, roi.id, brig.terre, 'charger', 'charger');
  check(rb.blesses.includes(0) && !banArmee(k2, roi.id) && k2.seigneurs[0].blesse === k2.tour + 2, 'le seigneur ne meurt pas : blessé, il rentre dans 2 tours');
  banFinTour(k2); banFinTour(k2);
  check(!k2.seigneurs[0].blesse && banArmeeSur(k2, banChateau(k2, 0)).unites.some(u => u.type === 'seigneur'), 'le seigneur revient au château');
  // la fin : château perdu ; après le tour 25, les drapeaux
  const z = banNouvelle(11); z.terres[banChateau(z, 0)].prop = 1;
  check(banVerifierFin(z).issue === 'defaite' && !z.fin.gagne, 'fin : ton château pris, c\'est perdu');
  const y = banNouvelle(12); y.tour = BAN_DERNIER_TOUR; banFinTour(y);
  check(y.fin && y.fin.issue === 'drapeaux' && y.fin.classement.length === 4 && y.fin.gagne === (y.fin.classement[0].n === banDrapeaux(y, 0)), 'fin : après le tour 25, on compte les drapeaux');
}

// 3. équilibrage, pour chaque niveau
const pc = x => Math.round(100 * (x || 0) / K) + ' %';
const bilan = {};
for (const niveau of ['facile', 'normal']) {
  const fins = {}, vus2 = { 10: 0, 20: 0, 25: 0 }, tr = { 10: [0, 0, 0, 0], 20: [0, 0, 0, 0], 25: [0, 0, 0, 0] };
  let erreurs = 0, batailles = 0, gagnees = 0, subies = 0, chutes = 0, tours = 0;
  for (let k = 0; k < K; k++) {
    const g = 1000 + k * 7919;
    let r;
    try { r = partie(g, niveau); } catch (err) { erreurs++; if (erreurs < 3) console.log(g, err.stack); continue; }
    const { e, traces, stats } = r, f = !e.fin ? 'aucune' : e.fin.issue === 'drapeaux' ? (e.fin.gagne ? 'drapeaux gagnés' : 'drapeaux perdus') : e.fin.issue;
    fins[f] = (fins[f] || 0) + 1; tours += e.fin ? e.fin.tour : 99;
    batailles += stats.batailles; gagnees += stats.gagnees; subies += stats.subies;
    chutes += e.seigneurs.slice(1).filter(S => S.tombe).length;
    for (const t of [10, 20, 25]) if (traces[t]) { tr[t][0] += traces[t][0]; tr[t][1] += (traces[t][1] + traces[t][2] + traces[t][3]) / 3; tr[t][2] += traces[t][4]; tr[t][3] += traces[t][5]; vus2[t]++; }
    if (detail) console.log(niveau, g, f, e.fin && e.fin.tour, e.fin && e.fin.classement.map(x => x.s + ':' + x.n).join(' '), e.seigneurs.map(S => (S.tombe ? '†' : '') + (S.car || 'toi')).join(' '));
  }
  console.log(`— ${niveau} · ${K} parties · fins : ` + Object.entries(fins).map(([k, v]) => `${k} ${pc(v)}`).join(', '));
  console.log(`tour moyen de la fin ${(tours / K).toFixed(1)} · batailles du joueur ${(batailles / K).toFixed(1)} (gagnées ${Math.round(100 * gagnees / Math.max(1, batailles))} %) · attaques subies ${(subies / K).toFixed(1)} · rivaux tombés ${(chutes / K).toFixed(2)}`);
  for (const t of [10, 20, 25]) if (vus2[t]) console.log(`tour ${t} (${vus2[t]} parties) : drapeaux du joueur ${(tr[t][0] / vus2[t]).toFixed(1)}, d'un rival ${(tr[t][1] / vus2[t]).toFixed(1)}, pièces ${Math.round(tr[t][2] / vus2[t])}, bâtiments ${(tr[t][3] / vus2[t]).toFixed(1)}`);
  check(erreurs === 0, `${niveau} : aucune erreur (${erreurs})`);
  const ok = (fins.victoire || 0) + (fins['drapeaux gagnés'] || 0);
  bilan[niveau] = { ok, defaites: fins.defaite || 0 };
  check(!fins.aucune, `${niveau} : chaque partie se finit (au plus tard après le tour 25)`);
  check(ok > K * 0.1 && ok < K * 0.95, `${niveau} : le joueur automatique gagne souvent, pas toujours (${pc(ok)})`);
  check((fins.defaite || 0) < K * (niveau === 'facile' ? 0.1 : 0.35), `${niveau} : il perd rarement son château (${pc(fins.defaite)})`);
}
check(anomalies === 0, `jamais plus de 3 armées, de 6 guerriers, de pièces en négatif, ni deux armées sur une case (${anomalies})`);
// plus dur = moins de victoires, ou plus de châteaux perdus (victoires moins châteaux perdus)
check(bilan.normal.ok - bilan.normal.defaites < bilan.facile.ok - bilan.facile.defaites, `le niveau normal est plus dur que le facile (victoires ${pc(bilan.facile.ok)} → ${pc(bilan.normal.ok)}, châteaux perdus ${pc(bilan.facile.defaites)} → ${pc(bilan.normal.defaites)})`);
const manquent = Object.keys(BAN_SURPRISES).filter(k => !vus[k]);
check(!manquent.length, `chaque surprise sort au moins une fois (${manquent.join(', ') || Object.keys(vus).length + ' sortes'})`);
{ let err = 0; for (let k = 0; k < 10; k++) { try { partie(500 + k, 'normal', 0, 4); } catch (x) { err++; if (err < 2) console.log(x.stack); } } check(!err, `grande carte (61 cases) : 10 parties sans erreur (${err})`); }
process.exit(fail ? 1 : 0);

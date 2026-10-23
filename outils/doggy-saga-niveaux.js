/* Doggy Saga : fabrique doggy-saga/niveaux.js (les 60 niveaux en 5 chapitres).
   node outils/doggy-saga-niveaux.js [parties par niveau, 80 par défaut] [--seul 12]
   Les niveaux (forme, races, objectifs, obstacles) sont écrits ici à la main ; le nombre de coups et les seuils
   des étoiles sont réglés avec le joueur automatique (outils/doggy-saga-joueur.js) :
   - on joue chaque niveau sans limite de coups et on note au bout de combien de coups l'objectif est rempli ;
   - les coups du niveau = le quantile qui donne le taux de réussite visé (TAUX) ;
   - puis on rejoue avec ces coups : 2 étoiles = score médian des parties gagnées, 3 étoiles = le 85e centile. */
'use strict';
const fs = require('fs'), path = require('path');
const { jouer } = require('./doggy-saga-joueur.js');

const K = Number(process.argv[2]) || 80;
const seul = process.argv.includes('--seul') ? Number(process.argv[process.argv.indexOf('--seul') + 1]) : 0;

/* ---------- formes ---------- */
const P8 = '........';
const F = {
  plein: [P8, P8, P8, P8, P8, P8, P8, P8],
  coins: [' ...... ', P8, P8, P8, P8, P8, P8, ' ...... '],
  rond: ['  ....  ', ' ...... ', P8, P8, P8, P8, ' ...... ', '  ....  '],
  losange: ['   ..   ', '  ....  ', ' ...... ', P8, P8, ' ...... ', '  ....  ', '   ..   '],
  coeur: [' ..  .. ', P8, P8, P8, P8, ' ...... ', '  ....  ', '   ..   '],
  os: ['..    ..', '...  ...', ' ...... ', '  ....  ', '  ....  ', ' ...... ', '...  ...', '..    ..'],
  croix: ['  ....  ', '  ....  ', P8, P8, P8, P8, '  ....  ', '  ....  '],
  maison: ['   ..   ', '  ....  ', ' ...... ', P8, P8, P8, P8, P8],
  u: ['..    ..', '..    ..', '..    ..', P8, P8, P8, P8, P8],
  anneau: [P8, P8, '..    ..', '..    ..', '..    ..', '..    ..', P8, P8],
  sablier: [P8, ' ...... ', '  ....  ', '   ..   ', '   ..   ', '  ....  ', ' ...... ', P8],
};
/* une couche posée sur une forme : même dessin, '.' = on garde ; on ne pose rien sur un trou */
function pose(forme, ...couches) {
  return forme.map((l, r) => [...l].map((ch, c) => {
    if (ch === ' ') return ' ';
    let x = ch;
    for (const k of couches) { const y = k[r][c]; if (y !== '.') x = y; }
    return x;
  }).join(''));
}
const C = {
  boueBas: [P8, P8, P8, P8, P8, P8, 'bbbbbbbb', 'bbbbbbbb'],
  boueBas3: [P8, P8, P8, P8, P8, 'bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb'],
  boueCentre: [P8, P8, '..bbbb..', '..bbbb..', '..bbbb..', '..bbbb..', P8, P8],
  boueCentreB: [P8, P8, '..BBBB..', '..BBBB..', '..BBBB..', '..BBBB..', P8, P8],
  boueDamier: ['b.b.b.b.', '.b.b.b.b', 'b.b.b.b.', '.b.b.b.b', 'b.b.b.b.', '.b.b.b.b', 'b.b.b.b.', '.b.b.b.b'],
  boueTout: ['bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb'],
  boueToutB: ['BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB', 'BBBBBBBB'],
  boueBords: ['bbbbbbbb', 'b......b', 'b......b', 'b......b', 'b......b', 'b......b', 'b......b', 'bbbbbbbb'],
  boueBasMoitie: [P8, P8, P8, P8, 'bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb', 'bbbbbbbb'],
  chiot1: [P8, P8, '...c....', P8, P8, P8, P8, P8, P8],
  chiot2: [P8, P8, '..c..c..', P8, P8, P8, P8, P8, P8],
  chiot2u: [P8, P8, 'c......c', P8, P8, P8, P8, P8, P8],
  chiot3: [P8, P8, '.c..c..c', P8, P8, P8, P8, P8, P8],
  chiotMilieu: [P8, P8, '...cc...', P8, P8, P8, P8, P8, P8],
  niches2: [P8, P8, P8, P8, '..n..n..', P8, P8, P8],
  nichesLigne: [P8, P8, P8, 'n.n..n.n', P8, P8, P8, P8],
  nichesCentre: [P8, P8, P8, '...NN...', '...NN...', P8, P8, P8],
  nichesCentreM: [P8, P8, P8, '...MM...', '...MM...', P8, P8, P8],
  nichesCoins: ['N......N', P8, P8, P8, P8, P8, P8, 'N......N'],
  nichesAnneau: [P8, P8, P8, P8, P8, P8, '.n....n.', P8],
  gamelles4: [P8, '.g....g.', P8, P8, P8, P8, '.g....g.', P8],
  gamelles6: ['..g..g..', P8, 'g......g', P8, P8, 'g......g', P8, '..g..g..'],
  gamellesHaut: ['g.g..g.g', P8, P8, P8, P8, P8, P8, P8],
  laisses6: [P8, '.l....l.', P8, '...l....', '....l...', P8, '.l....l.', P8],
  laissesLigne: [P8, P8, P8, P8, 'l.l..l.l', P8, P8, P8],
  laissesCentreL: [P8, P8, '..L..L..', '...LL...', '...LL...', '..L..L..', P8, P8],
  laissesAnneauL: [P8, P8, 'L.L..L.L', P8, P8, 'L.L..L.L', P8, P8],
  laissesCroix: [P8, P8, P8, '..l..l..', '..l..l..', P8, P8, P8],
};
const cal = (t, n) => ({ k: 'calins', t, n });
const BOUE = { k: 'boue' }, chiots = n => ({ k: 'chiots', n });

/* ---------- les 60 niveaux ---------- */
// [forme ou plan, races, objectifs, options]
const L = [
  // Chapitre 1 : l'arrivée (câlins seulement ; 1 à 3 = tutoriel, impossible à perdre)
  [F.plein, [0, 1, 2, 3, 4], [cal(0, 10)], { tuto: 'glisser' }],
  [F.plein, [0, 1, 2, 3, 4], [cal(1, 15), cal(2, 15)], { tuto: 'bandana' }],
  [F.coins, [0, 1, 2, 3, 4], [cal(3, 20)], { tuto: 'balle' }],
  [F.plein, [0, 1, 2, 3, 4], [cal(4, 25), cal(0, 25)]],
  [F.coeur, [0, 1, 2, 3, 4], [cal(1, 30)]],
  [F.plein, [0, 1, 2, 3, 4, 5], [cal(5, 20)]],
  [F.losange, [0, 1, 2, 3, 4], [cal(2, 25), cal(3, 25)]],
  [F.maison, [0, 1, 2, 3, 4, 5], [cal(0, 20), cal(5, 20)]],
  [F.croix, [0, 1, 2, 3, 4, 5], [cal(4, 25)]],
  [F.rond, [0, 1, 2, 3, 4, 5], [cal(1, 25), cal(2, 25), cal(3, 25)]],
  [F.os, [0, 1, 2, 3, 4, 5], [cal(5, 20)]],
  [F.plein, [0, 1, 2, 3, 4, 5], [cal(0, 25), cal(1, 25), cal(4, 25)]],
  // Chapitre 2 : jour de pluie (la boue ; arrivent Chorizo le teckel et Pompon le carlin)
  [pose(F.plein, C.boueBas), [0, 1, 2, 3, 6], [BOUE], { tuto: 'boue' }],
  [pose(F.plein, C.boueCentre), [0, 1, 2, 4, 6], [BOUE, cal(6, 15)]],
  [pose(F.coeur, C.boueBasMoitie), [1, 2, 3, 6, 7], [BOUE]],
  [pose(F.plein, C.boueDamier), [0, 3, 4, 6, 7], [BOUE]],
  [pose(F.maison, C.boueTout), [2, 3, 5, 6, 7], [BOUE]],
  [pose(F.croix, C.boueBords), [0, 1, 4, 6, 7], [BOUE, cal(7, 25)]],
  [pose(F.plein, C.boueCentreB), [1, 2, 3, 6, 7], [BOUE]],
  [pose(F.losange, C.boueTout), [0, 4, 5, 6, 7], [BOUE]],
  [pose(F.coins, C.boueBas3), [0, 1, 2, 6, 7], [BOUE]],
  [pose(F.rond, C.boueTout), [2, 3, 4, 6, 7], [BOUE]],
  [pose(F.plein, C.boueBasMoitie, C.boueCentreB), [0, 1, 3, 6, 7], [BOUE]],
  [pose(F.plein, C.boueTout), [1, 2, 5, 6, 7], [BOUE]],
  // Chapitre 3 : la nurserie (les chiots perdus ; arrivent Gaston le bouledogue et Pépite la chihuahua)
  [pose(F.plein, C.chiot1), [0, 1, 2, 6, 8], [chiots(1)], { tuto: 'chiots' }],
  [pose(F.plein, C.chiot1), [3, 4, 7, 8, 9], [chiots(2)], { chiots: { max: 1 } }],
  [pose(F.u, C.chiot2u), [0, 2, 5, 8, 9], [chiots(2)], { chiots: { max: 2 } }],
  [pose(F.plein, C.chiot2), [1, 3, 6, 8, 9], [chiots(3), cal(8, 20)], { chiots: { max: 2 } }],
  [pose(F.coins, C.chiot1, C.boueBas), [0, 4, 7, 8, 9], [chiots(2), BOUE]],
  [pose(F.maison, C.chiotMilieu), [2, 3, 5, 8, 9], [chiots(3)], { chiots: { max: 2 } }],
  [pose(F.croix, C.chiot2, C.boueCentre), [0, 1, 8, 9, 7], [chiots(2), BOUE], { chiots: { max: 2 } }],
  [pose(F.plein, C.chiot3), [1, 4, 7, 8, 9], [chiots(3)], { chiots: { max: 3 } }],
  [pose(F.rond, C.chiot2), [0, 2, 3, 6, 9], [chiots(3), BOUE], { chiots: { max: 2 }, plus: [C.boueBasMoitie] }],
  [pose(F.losange, C.chiotMilieu), [1, 3, 4, 7, 9], [chiots(3), cal(9, 30)], { chiots: { max: 2 } }],
  [pose(F.coins, C.chiot2, C.boueBas), [0, 5, 7, 8, 9], [chiots(2), BOUE], { chiots: { max: 2 } }],
  [pose(F.plein, C.chiot3, C.boueBas), [2, 3, 6, 8, 9], [chiots(3), BOUE], { chiots: { max: 3 } }],
  // Chapitre 4 : le jardin (niches et gamelles ; arrivent Éclair le lévrier, Cacao le labrador, Nounours le saint-bernard)
  [pose(F.plein, C.niches2), [0, 1, 6, 9, 10], [cal(10, 25)], { tuto: 'niche' }],
  [pose(F.plein, C.boueBasMoitie, C.gamelles4), [2, 3, 7, 8, 10], [BOUE], { tuto: 'gamelle' }],
  [pose(F.anneau, C.gamelles4), [1, 4, 5, 10, 11], [cal(11, 20), cal(10, 20)]],
  [pose(F.plein, C.boueCentre, C.nichesCentre), [0, 3, 6, 9, 11], [BOUE]],
  [pose(F.maison, C.gamellesHaut, C.chiot1), [2, 5, 7, 10, 11], [chiots(2)], { chiots: { max: 1 } }],
  [pose(F.plein, C.nichesLigne), [1, 3, 8, 11, 12], [cal(11, 35), cal(12, 20)]],
  [pose(F.plein, C.boueTout, C.nichesCoins), [0, 4, 6, 10, 12], [BOUE]],
  [pose(F.coeur, C.gamelles6, C.chiot2), [2, 3, 9, 11, 12], [chiots(3)], { chiots: { max: 2 } }],
  [pose(F.plein, C.boueTout, C.nichesCentreM), [1, 5, 7, 10, 12], [BOUE]],
  [pose(F.plein, C.nichesAnneau, C.chiot2u), [0, 3, 10, 11, 12], [chiots(2)], { chiots: { max: 2 } }],
  [pose(F.maison, C.boueBasMoitie, C.gamelles6), [4, 6, 9, 11, 12], [BOUE, cal(12, 20)]],
  [pose(F.plein, C.boueBas, C.niches2, C.gamelles4, C.chiot2), [2, 5, 10, 11, 12], [chiots(2), BOUE], { chiots: { max: 2 } }],
  // Chapitre 5 : la grande journée portes ouvertes (laisses et tout mélangé ; arrivent Galette le corgi, Flocon le samoyède, Caramel le cocker)
  [pose(F.plein, C.laisses6), [0, 2, 9, 12, 13], [cal(13, 30)], { tuto: 'laisse' }],
  [pose(F.plein, C.boueCentre, C.laissesCentreL), [1, 4, 8, 11, 13], [BOUE]],
  [pose(F.coins, C.laissesLigne, C.chiot2), [3, 6, 10, 13, 14], [chiots(2)], { chiots: { max: 2 } }],
  [pose(F.maison, C.boueBasMoitie, C.niches2, C.laissesCroix), [0, 5, 7, 12, 14], [BOUE]],
  [pose(F.plein, C.laisses6, C.gamelles4), [2, 8, 11, 13, 14], [cal(14, 35), cal(13, 35)]],
  [pose(F.losange, C.boueTout, C.laissesCroix), [1, 3, 9, 14, 15], [BOUE]],
  [pose(F.croix, C.chiot2, C.laissesCroix, C.niches2), [0, 4, 12, 14, 15], [chiots(2)], { chiots: { max: 2 } }],
  [pose(F.plein, C.boueTout, C.laissesAnneauL), [2, 6, 11, 13, 15], [BOUE]],
  [pose(F.coeur, C.boueTout, C.chiot2), [1, 5, 8, 14, 15], [BOUE, chiots(2)], { chiots: { max: 2 } }],
  [pose(F.plein, C.nichesAnneau, C.laisses6), [0, 3, 13, 14, 15], [cal(15, 30), cal(14, 20)]],
  [pose(F.rond, C.boueTout, C.gamelles6, C.chiot2), [4, 9, 12, 13, 15], [BOUE, chiots(2)], { chiots: { max: 2 } }],
  [pose(F.plein, C.boueTout, C.boueCentreB, C.niches2, C.laissesLigne, C.chiot2), [0, 11, 13, 14, 15], [BOUE, chiots(2)], { chiots: { max: 2 } }],
];
const CHAPITRES = [
  { nom: "L'arrivée", texte: 'Les premiers chiens arrivent au refuge.' },
  { nom: 'Jour de pluie', texte: 'Tout le monde est plein de boue !' },
  { nom: 'La nurserie', texte: 'Des chiots se sont perdus.' },
  { nom: 'Le jardin', texte: 'Attention aux niches et aux gamelles.' },
  { nom: 'Portes ouvertes', texte: 'Le grand jour : tout le monde cherche une famille.' },
];
// taux de réussite visé pour le joueur moyen : doux au début de chaque chapitre, plus dur au dernier niveau
function taux(n) {
  const ch = Math.floor((n - 1) / 12), p = (n - 1) % 12;
  const base = [0.97, 0.9, 0.82, 0.74, 0.66][ch];
  return Math.min(0.99, base + 0.05 - p * 0.01 - (p === 11 ? 0.05 : 0));
}
const quantile = (a, q) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

const sortie = [];
const t0 = Date.now();
L.forEach(([plan, races, obj, opt], k) => {
  const id = k + 1;
  opt = opt || {};
  if (opt.plus) plan = pose(plan, ...opt.plus);
  const niv = { id, chap: Math.floor(k / 12) + 1, coups: 200, races, plan, obj };
  if (opt.chiots) niv.chiots = opt.chiots;
  if (opt.tuto) niv.tuto = opt.tuto;
  if (seul && id !== seul) return;
  const finis = [];
  for (let g = 0; g < K; g++) { const r = jouer(niv, 'cal' + g, { coups: 200 }); finis.push(r.gagneAu === null ? 999 : r.gagneAu); }
  let coups;
  if (opt.tuto && id <= 3) coups = Math.max(...finis.filter(x => x < 999)) + 8; // impossible à perdre (ou presque)
  else coups = quantile(finis, taux(id)) + 1;
  coups = Math.max(10, Math.min(60, coups));
  niv.coups = coups;
  const scores = [];
  let gagnes = 0;
  for (let g = 0; g < Math.ceil(K / 2); g++) { const r = jouer(niv, 'eto' + g); if (r.fin === 'gagne') { gagnes++; scores.push(r.score); } }
  const arrondi = x => Math.round(x / 500) * 500;
  niv.etoiles = scores.length ? [arrondi(quantile(scores, 0.5)), arrondi(quantile(scores, 0.85))] : [5000, 10000];
  if (niv.etoiles[1] <= niv.etoiles[0]) niv.etoiles[1] = niv.etoiles[0] + 1000;
  const reussite = finis.filter(x => x <= coups).length / K;
  console.log(`niveau ${String(id).padStart(2)} : ${String(coups).padStart(2)} coups, réussite ${(reussite * 100).toFixed(0)} % (visé ${(taux(id) * 100).toFixed(0)}), rejoué ${gagnes}/${Math.ceil(K / 2)}, étoiles ${niv.etoiles.join(' / ')}, médiane ${quantile(finis, 0.5)} coups`);
  sortie.push(niv);
});
console.log(`${((Date.now() - t0) / 1000).toFixed(0)} s`);
if (seul) process.exit(0);

const ligne = n => '  ' + JSON.stringify(n).replace(/"(\w+)":/g, '$1:');
const js = `/* Doggy Saga : les 60 niveaux en 5 chapitres. Fichier fabriqué par outils/doggy-saga-niveaux.js (ne pas modifier à la main :
   changer le niveau dans l'outil et relancer). Coups et étoiles réglés avec le joueur automatique.
   { id, chap, coups, races, plan (voir regles.js), obj, chiots?, tuto?, etoiles: [2 étoiles, 3 étoiles] } */
const DOG_CHAPITRES = ${JSON.stringify(CHAPITRES, null, 2).replace(/"(\w+)":/g, '$1:')};
const DOG_NIVEAUX = [
${sortie.map(ligne).join(',\n')},
];
if (typeof module !== 'undefined') module.exports = { DOG_CHAPITRES, DOG_NIVEAUX };
`;
fs.writeFileSync(path.join(__dirname, '..', 'doggy-saga', 'niveaux.js'), js);
console.log('doggy-saga/niveaux.js écrit (' + sortie.length + ' niveaux)');

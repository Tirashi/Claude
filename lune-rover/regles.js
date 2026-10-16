/* =====================================================================
   LUNE-ROVER : règles et niveaux (logique pure, sans affichage ; utilisable
   sous Node pour les tests : outils/lune-rover-niveaux.js).
   - Carte : lignes de caractères. '.' sol, '#' rocher, 'o' cratère,
     '*' cristal (sur le sol), 'N' 'E' 'S' 'W' départ du rover et sa direction.
   - Instructions : A avancer, G tourner à gauche, D tourner à droite,
     S sauter (par-dessus une case, pas par-dessus un rocher), R ramasser,
     F appeler la fonction F1.
   - Chaque instruction peut être répétée (n = 2 à 9, ou 0 = en boucle) et
     porter une condition, vérifiée avant chaque répétition :
     c = sur un cristal, l = voie libre devant, o = cratère devant,
     b = bloqué devant (rocher ou bord). Avec une condition, « en boucle »
     devient « tant que ».
   - Le niveau est gagné dès que le dernier cristal est ramassé.
   - Texte d'un programme (solutions, tests) : "A3 R | G A4 R" (principal | F1),
     préfixe de condition "l:A0" (0 = en boucle), "c:R".
   ===================================================================== */
'use strict';
const ROVER_DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];        // N, E, S, O
const ROVER_OPS = ['A', 'G', 'D', 'S', 'R', 'F'];
const ROVER_CONDS = ['', 'c', 'l', 'o', 'b'];
const ROVER_MAX = { main: 16, f: 8, steps: 400, ticks: 6000, depth: 60 };
// paliers : ce que le joueur peut utiliser (instructions, répétitions, F1, conditions)
const ROVER_TIERS = [
  { ops: 'AGDR', rep: false, f: false, cond: false },
  { ops: 'AGDRS', rep: false, f: false, cond: false },
  { ops: 'AGDRS', rep: true, f: false, cond: false },
  { ops: 'AGDRSF', rep: true, f: true, cond: false },
  { ops: 'AGDRSF', rep: true, f: true, cond: true },
];

const ROVER_LEVELS = [
  // --- palier 0 : avancer, tourner, ramasser
  { t: 0, m: ['ooooo', 'E...*', 'ooooo'], sol: 'A A A A R', txt: 'Pose des instructions, puis GO ! Le rover doit ramasser le cristal.' },
  { t: 0, m: ['..*', '...', 'N..'], sol: 'A A D A A R', txt: 'G et D font tourner le rover sur place.' },
  { t: 0, m: ['*..', '.#.', 'N.*'], sol: 'A A R D A A D A A R', txt: 'Les rochers bloquent le passage.' },
  { t: 0, m: ['*.ooo', 'o.ooo', 'o..oo', 'oo.oo', 'ooNoo'], sol: 'A A G A D A A G A R', txt: 'Gare aux cratères : on tombe dedans !' },
  { t: 0, m: ['#*..*', '#.##.', 'E.*..'], sol: 'A A R A A G A A R G A A A R' },
  // --- palier 1 : sauter
  { t: 1, m: ['ooooo', 'E.o.*', 'ooooo'], sol: 'A S A R', txt: 'S fait sauter le rover par-dessus une case : un cratère, pas un rocher.' },
  { t: 1, m: ['ooooooo', 'Eo.o.o*', 'ooooooo'], sol: 'S S S R' },
  { t: 1, m: ['ooo*o', 'ooooo', 'E.o.o'], sol: 'A S G S R' },
  // --- palier 2 : répéter
  { t: 2, m: ['oooooooo', 'E......*', 'oooooooo'], sol: 'A7 R', txt: "Touche une instruction posée : avec + et -, elle se répète (x2, x3...)." },
  { t: 2, m: ['*....*', '.oooo.', '.oooo.', 'N....*'], sol: 'A3 R D A5 R D A3 R', txt: '3 étoiles : le programme le plus court possible.' },
  { t: 2, m: ['oooooooo', 'Eo.o.o.*', 'oooooooo'], sol: 'S3 A R' },
  { t: 2, m: ['E......o', '######.o', '*......o'], sol: 'A6 D A2 D A6 R' },
  { t: 2, m: ['*...*', '.ooo.', '.ooo.', '.ooo.', '*.E.*'], sol: 'A2 R G A4 R G A4 R G A4 R', txt: 'Le programme principal a 16 cases au plus.' },
  { t: 2, m: ['Eo.o.o..', '#oooooo.', '*.o.o.o.'], sol: 'S3 A D A2 D S3 A R' },
  // --- palier 3 : la fonction F1
  { t: 3, m: ['oooooooo', 'E*******', 'oooooooo'], sol: 'F7 | A R', txt: 'F1 : une suite d\'instructions qu\'on appelle d\'un seul bloc. Ici : F1 = A R.' },
  { t: 3, m: ['ooooo*', 'oooo..', 'ooo..o', 'oo..oo', 'o..ooo', 'E.oooo'], sol: 'F5 R | A G A D', txt: 'Un escalier : la même marche, encore et encore.' },
  { t: 3, m: ['E.......', 'o.o.o.o.', 'o*o*o*o*'], sol: 'A F4 | D A2 R D2 A2 D A2' },
  { t: 3, m: ['*...*', '.ooo.', '.ooo.', '.ooo.', '*.E.*'], sol: 'A2 R F3 | G A4 R', txt: 'Ce terrain te dit quelque chose ? Fais plus court !' },
  { t: 3, m: ['ooo*', 'oooo', 'oo..', 'oooo', 'o..o', 'oooo', 'E.oo'], sol: 'F3 R | A G S D' },
  { t: 3, m: ['ooo*ooo', 'ooo.ooo', 'ooo.ooo', '*..N..*', 'ooo.ooo', 'ooo.ooo', 'ooo*ooo'], sol: 'F4 | A3 R G2 A3 D' },
  // --- palier 4 : conditions et boucles
  { t: 4, m: ['oooooooo', 'E.*..*.*', 'oooooooo'], sol: 'F7 | A c:R', txt: 'Touche SI : l\'instruction ne se fait que si la condition est vraie. c:R = ramasser s\'il y a un cristal.' },
  { t: 4, m: ['.......', '.ooooo.', '.ooooo.', '.#*....', '.ooooo#', 'Nooooo#'], sol: 'F4 R | l:A0 D', txt: 'BOUCLE + SI LIBRE : le rover avance tant que la voie est libre.' },
  { t: 4, m: ['E......', '######.', '.....#.', '.###.#.', '.#*..#.', '.#####.', '.......'], sol: 'F0 | l:A0 c:R D', txt: 'Une spirale : F1 en boucle, jusqu\'au cristal.' },
  { t: 4, m: ['E..*....', '#######.', '.....*#.', '*######*', '.######.', '..*.....'], sol: 'F0 | c:R b:D A', txt: 'SI BLOQUE : tourner seulement quand on ne peut plus avancer.' },
  { t: 4, m: ['oooooooo', 'E.o*o.*.', 'oooooooo'], sol: 'F0 | c:R o:S l:A', txt: 'SI CRATERE : sauter seulement devant un cratère.' },
  { t: 4, m: ['oooooo*', 'oooooo.', 'oooo...', 'oooo.oo', 'ooo..oo', 'ooo.ooo', 'E...ooo'], sol: 'F0 | l:A0 G l:A0 c:R D', txt: 'Un escalier aux marches inégales.' },
  { t: 4, m: ['E.......', 'o.o.o*o.', 'o*o.ooo.', 'ooo.ooo*', 'ooo*oooo'], sol: 'A F4 | D l:A0 R G2 l:A0 D A2', txt: 'Des dents de longueurs différentes.' },
  { t: 4, m: ['E..o.*.', '.#####.', '*#####o', '.#####.', '.*.o...'], sol: 'F0 | c:R b:D o:S l:A', txt: 'Un rover qui se débrouille tout seul : cristal, bord, cratère, voie libre.' },
  { t: 4, m: ['E.o..*..', '#######.', '..*...#.', '.####.#o', '.#*...#.', 'o######.', '....*...'], sol: 'F0 | c:R b:D o:S l:A' },
  { t: 4, m: ['E.o.o.*.', '######o.', '*.o...#.', '.####o#*', '.#*.o.#.', 'o######.', '..*.o...'], sol: 'F0 | c:R b:D o:S l:A', txt: 'Dernière mission : bonne route, pilote !' },
];

/* ----- carte ----- */
function roverMap(L) {
  const rows = L.m, h = rows.length, w = Math.max(...rows.map(r => r.length));
  const cells = [], crystals = [];
  let start = null;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let ch = rows[y][x] || 'o';
    const di = 'NESW'.indexOf(ch);
    if (di >= 0) { start = [x, y, di]; ch = '.'; }
    if (ch === '*') { crystals.push([x, y]); ch = '.'; }
    cells.push(ch);
  }
  return { w, h, cells, crystals, start };
}
const roverTile = (M, x, y) => x < 0 || y < 0 || x >= M.w || y >= M.h ? 'X' : M.cells[y * M.w + x];

/* ----- programmes ----- */
// une instruction : { o: 'A', n: 1 (0 = en boucle), c: '' }
function roverParse(s) {
  const one = t => { const m = /^(?:([clob]):)?([AGDSRF])(\d|\*)?$/.exec(t); if (!m) throw new Error('instruction illisible : ' + t);
    return { o: m[2], n: m[3] == null ? 1 : m[3] === '*' ? 0 : +m[3], c: m[1] || '' }; };
  const [a, b] = s.split('|');
  const line = x => (x || '').trim() ? x.trim().split(/\s+/).map(one) : [];
  return { main: line(a), f: line(b) };
}
const roverSize = P => P.main.length + P.f.length;
function roverText(P) {
  const one = i => (i.c ? i.c + ':' : '') + i.o + (i.n === 1 ? '' : i.n);
  return P.main.map(one).join(' ') + (P.f.length ? ' | ' + P.f.map(one).join(' ') : '');
}
// le programme respecte-t-il le palier du niveau ?
function roverAllowed(L, P) {
  const T = ROVER_TIERS[L.t];
  if (P.main.length > ROVER_MAX.main || P.f.length > ROVER_MAX.f) return false;
  if (!T.f && P.f.length) return false;
  return P.main.concat(P.f).every(i => T.ops.includes(i.o) && (T.rep || i.n === 1) && (T.cond || !i.c) && (T.cond || i.n !== 0));
}

/* ----- exécution : tout est calculé d'un coup, puis rejoué à l'écran -----
   Résultat : { r, steps, picked }, r = 'win' | 'choc' | 'chute' | 'fin' | 'long' | 'boucle'.
   Chaque pas : { x, y, d, op, line, idx, jump, pick, fail } (position APRÈS le pas). */
function roverRun(L, P) {
  const M = roverMap(L);
  let [x, y, d] = M.start;
  const left = new Set(M.crystals.map(([a, b]) => a + ',' + b));
  const steps = [];
  const front = (k = 1) => roverTile(M, x + ROVER_DIRS[d][0] * k, y + ROVER_DIRS[d][1] * k);
  const free = t => t === '.';
  const cond = c => c === 'c' ? left.has(x + ',' + y) : c === 'l' ? free(front()) : c === 'o' ? front() === 'o' : c === 'b' ? (front() === '#' || front() === 'X') : true;
  const stack = [{ L: P.main, line: 'main', i: 0, k: 0 }];
  let ticks = 0;
  while (stack.length) {
    if (++ticks > ROVER_MAX.ticks) return { r: 'boucle', steps, M };
    const fr = stack[stack.length - 1];
    if (fr.i >= fr.L.length) { stack.pop(); continue; }
    const ins = fr.L[fr.i], max = ins.n || Infinity;
    if (fr.k >= max || (ins.c && !cond(ins.c))) { fr.i++; fr.k = 0; continue; }
    fr.k++;
    if (ins.o === 'F') {
      if (fr.k >= max && fr.i === fr.L.length - 1) stack.pop();      // appel en dernier : la pile ne grossit pas
      if (stack.length >= ROVER_MAX.depth) return { r: 'boucle', steps, M };
      stack.push({ L: P.f, line: 'f', i: 0, k: 0 });
      continue;
    }
    const st = { op: ins.o, line: fr.line, idx: fr.i };
    let fail = '';
    if (ins.o === 'G') d = (d + 3) % 4;
    else if (ins.o === 'D') d = (d + 1) % 4;
    else if (ins.o === 'R') { const k = x + ',' + y; if (left.has(k)) { left.delete(k); st.pick = [x, y]; } }
    else {
      const k = ins.o === 'S' ? 2 : 1;
      if (k === 2) { const mid = front(1); if (mid === '#' || mid === 'X') fail = 'choc'; st.jump = true; }
      if (!fail) {
        const t = front(k);
        if (t === '#' || t === 'X') fail = 'choc';
        else { x += ROVER_DIRS[d][0] * k; y += ROVER_DIRS[d][1] * k; if (t === 'o') fail = 'chute'; }
      }
    }
    Object.assign(st, { x, y, d });
    if (fail) st.fail = fail;
    steps.push(st);
    if (fail) return { r: fail, steps, M, left: left.size };
    if (!left.size) return { r: 'win', steps, M, left: 0 };
    if (steps.length >= ROVER_MAX.steps) return { r: 'long', steps, M, left: left.size };
  }
  return { r: 'fin', steps, M, left: left.size };
}
// étoiles d'une réussite : 3 si le programme n'est pas plus long que la solution de référence
const roverPar = L => roverSize(roverParse(L.sol));
const roverStars = (L, size) => size <= roverPar(L) ? 3 : size <= roverPar(L) + 2 ? 2 : 1;

if (typeof module !== 'undefined') module.exports = { ROVER_LEVELS, ROVER_TIERS, ROVER_MAX, ROVER_DIRS, ROVER_OPS, ROVER_CONDS, roverMap, roverTile, roverParse, roverText, roverSize, roverAllowed, roverRun, roverPar, roverStars };

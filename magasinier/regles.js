/* Le Magasinier : règles (logique pure, sans DOM ni localStorage ni Math.random ; utilisable sous Node).
   Plan d'un niveau : une chaîne par rangée.
     #  mur            ' ' sol          .  marque
     $  caisse         *  caisse sur marque
     h  caisse lourde  H  caisse lourde sur marque
     @  docker         +  docker sur marque
     ~  glace          c  caisse sur glace     a  docker sur glace
     ^ v < >  tapis roulants (seules les caisses ordinaires sont emportées)
   Une case = un entier p = y * w + x. État : { d: case du docker, c: [{ p, l }] } (l : caisse lourde). */

const MAG_DIRS = { H: [0, -1], B: [0, 1], G: [-1, 0], D: [1, 0] };
const MAG_TAPIS = { '^': 'H', 'v': 'B', '<': 'G', '>': 'D' };

function magLire(plan) {
  const h = plan.length, w = Math.max(...plan.map(l => l.length)), n = w * h;
  const N = { w, h, mur: new Uint8Array(n), glace: new Uint8Array(n), marque: new Uint8Array(n), tapis: new Array(n).fill(null),
    dedans: new Uint8Array(n), mort: new Uint8Array(n), depart: null };
  const c = [];
  plan.forEach((l, y) => { for (let x = 0; x < w; x++) {
    const ch = l[x] || ' ', p = y * w + x;
    if (ch === '#') N.mur[p] = 1;
    if ('.*+H'.includes(ch)) N.marque[p] = 1;
    if ('~ca'.includes(ch)) N.glace[p] = 1;
    if (MAG_TAPIS[ch]) N.tapis[p] = MAG_TAPIS[ch];
    if ('$*c'.includes(ch)) c.push({ p, l: false });
    if ('hH'.includes(ch)) c.push({ p, l: true });
    if ('@+a'.includes(ch)) N.depart = { d: p, c };
  } });
  if (!N.depart) throw new Error('niveau sans docker');
  // l'intérieur : les cases atteintes depuis le docker sans traverser de mur
  const pile = [N.depart.d]; N.dedans[N.depart.d] = 1;
  while (pile.length) { const p = pile.pop(), x = p % w, y = (p - x) / w;
    for (const [dx, dy] of Object.values(MAG_DIRS)) { const X = x + dx, Y = y + dy, q = Y * w + X;
      if (X >= 0 && Y >= 0 && X < w && Y < h && !N.mur[q] && !N.dedans[q]) { N.dedans[q] = 1; pile.push(q); } } }
  // coins morts : une caisse coincée dans un coin hors marque ne bougera plus
  const bloque = q => q < 0 || q >= n || N.mur[q];
  for (let p = 0; p < n; p++) if (N.dedans[p] && !N.marque[p] && !N.tapis[p]) {
    const x = p % w, v = bloque(p - w) || bloque(p + w), hz = (x === 0 || bloque(p - 1)) || (x === w - 1 || bloque(p + 1));
    if (v && hz) N.mort[p] = 1;
  }
  N.marques = N.marque.reduce((s, v) => s + v, 0);
  if (N.marques !== c.length) throw new Error(`niveau : ${c.length} caisses pour ${N.marques} marques`);
  return N;
}

const magCopie = E => ({ d: E.d, c: E.c.map(k => ({ p: k.p, l: k.l })) });
const magPas = (N, p, dir) => { const [dx, dy] = MAG_DIRS[dir], x = p % N.w + dx, y = (p - p % N.w) / N.w + dy;
  return x < 0 || y < 0 || x >= N.w || y >= N.h ? -1 : y * N.w + x; };
const magCaisseEn = (E, p) => E.c.findIndex(k => k.p === p);

/* Joue un coup. Renvoie null si le docker bute (mur, caisse bloquée), sinon
   { E: nouvel état, mvt: [{ qui: -1 (docker) ou n° de caisse, de, a, glisse, tapis }], pousse: n° de caisse ou -1 }. */
function magCoup(N, E0, dir) {
  const E = magCopie(E0), mvt = [], libre = q => q >= 0 && !N.mur[q] && magCaisseEn(E, q) < 0 && q !== E.d;
  const n = magPas(N, E.d, dir);
  if (n < 0 || N.mur[n]) return null;
  const i = magCaisseEn(E, n);
  if (i >= 0) {
    const m = magPas(N, n, dir);
    if (m < 0 || N.mur[m] || magCaisseEn(E, m) >= 0) return null;
    const k = E.c[i], de = k.p; k.p = m; mvt.push({ qui: i, de, a: m });
    if (!k.l && N.glace[m]) { let q; while (N.glace[k.p] && (q = magPas(N, k.p, dir)) >= 0 && libre(q) && q !== n) k.p = q;
      if (k.p !== m) mvt.push({ qui: i, de: m, a: k.p, glisse: true }); }
  }
  const de = E.d; E.d = n; mvt.push({ qui: -1, de, a: n });
  if (N.glace[n]) { let q; while (N.glace[E.d] && (q = magPas(N, E.d, dir)) >= 0 && libre(q)) E.d = q;
    if (E.d !== n) mvt.push({ qui: -1, de: n, a: E.d, glisse: true }); }
  // tapis : chaque caisse ordinaire posée sur un tapis avance d'une case si elle peut (une fois par coup)
  const bouge = new Set();
  for (let encore = true; encore;) { encore = false;
    E.c.forEach((k, j) => { if (k.l || bouge.has(j) || !N.tapis[k.p]) return;
      const dt = N.tapis[k.p], q = magPas(N, k.p, dt); if (!libre(q)) return;
      const d0 = k.p; k.p = q; bouge.add(j); encore = true; mvt.push({ qui: j, de: d0, a: q, tapis: true });
      if (N.glace[q]) { let r; while (N.glace[k.p] && (r = magPas(N, k.p, dt)) >= 0 && libre(r)) k.p = r;
        if (k.p !== q) mvt.push({ qui: j, de: q, a: k.p, glisse: true }); } }); }
  return { E, mvt, pousse: i };
}

const magGagne = (N, E) => E.c.every(k => N.marque[k.p]);

// clé d'un état pour le solveur : docker puis caisses triées (les lourdes à part)
function magCle(E) {
  const o = E.c.filter(k => !k.l).map(k => k.p).sort((a, b) => a - b), l = E.c.filter(k => k.l).map(k => k.p).sort((a, b) => a - b);
  return String.fromCharCode(E.d, ...o, 65535, ...l);
}

/* Recherche en largeur du plus court chemin en coups. Renvoie { coups, chemin } ou null
   (pas de solution, ou plus de `limite` états visités). */
function magResoudre(N, limite = 3e6) {
  const E0 = { d: N.depart.d, c: N.depart.c.map(k => ({ p: k.p, l: k.l })) };
  if (magGagne(N, E0)) return { coups: 0, chemin: '' };
  const vus = new Map([[magCle(E0), null]]);
  let file = [E0];
  for (let coups = 1; file.length; coups++) {
    const suite = [];
    for (const E of file) for (const dir of 'HBGD') {
      const r = magCoup(N, E, dir); if (!r) continue;
      if (r.pousse >= 0 && r.E.c.some(k => N.mort[k.p])) continue;
      const cle = magCle(r.E); if (vus.has(cle)) continue;
      vus.set(cle, [magCle(E), dir]);
      if (magGagne(N, r.E)) { let s = '', c = cle; while (vus.get(c)) { s = vus.get(c)[1] + s; c = vus.get(c)[0]; } return { coups, chemin: s, etats: vus.size }; }
      if (vus.size > limite) return null;
      suite.push(r.E);
    }
    file = suite;
  }
  return null;
}

// étoiles : 3 si au plus l'optimum + 10 %, 2 si au plus + 50 %, sinon 1
const magEtoiles = (opt, coups) => coups <= Math.floor(opt * 1.1) ? 3 : coups <= Math.floor(opt * 1.5) ? 2 : 1;

if (typeof module !== 'undefined') module.exports = { MAG_DIRS, magLire, magCoup, magGagne, magResoudre, magEtoiles, magCopie };

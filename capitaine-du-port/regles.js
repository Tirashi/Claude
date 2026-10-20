/* Capitaine du port : règles (logique pure, sans DOM ni localStorage ni Math.random ; utilisable sous Node).
   Un bassin s'écrit en texte, une chaîne par rangée (6 × 6, ou 7 × 7 au grand port) :
     .  eau        D  le navire doré (2 cases, debout dans la colonne de la passe)
     o  obstacle fixe (bouée, pilier, épave)      autre lettre : un bateau (même lettre sur toutes ses cases)
   La passe est une ouverture dans le quai du haut, dans la colonne « sortie ».
   Bassin lu : { w, sortie, bateaux: [{ x, y, n, h }], fixes: [p] } ; bateaux[0] est le navire doré.
   État : un tableau v, v[i] = colonne (bateau couché, h) ou rangée (bateau debout) du bout gauche ou haut du bateau i.
   Un coup = un bateau déplacé d'autant de cases libres qu'on veut ; gagné quand le navire doré touche la passe (v[0] = 0). */

function capLire(niv) {
  const plan = niv.plan, w = plan.length;
  if (plan.some(l => l.length !== w)) throw new Error('le bassin doit être carré');
  const cases = {}, fixes = [];
  plan.forEach((l, y) => [...l].forEach((c, x) => {
    if (c === '.') return;
    if (c === 'o') { fixes.push(y * w + x); return; }
    (cases[c] = cases[c] || []).push([x, y]);
  }));
  if (!cases.D) throw new Error('pas de navire doré');
  const bateaux = [];
  for (const c of ['D', ...Object.keys(cases).filter(k => k !== 'D').sort()]) {
    const L = cases[c], xs = L.map(p => p[0]), ys = L.map(p => p[1]), n = L.length;
    const h = new Set(ys).size === 1, x = Math.min(...xs), y = Math.min(...ys);
    if (n < 2 || n > 4 || !(h || new Set(xs).size === 1) || (h ? Math.max(...xs) - x : Math.max(...ys) - y) !== n - 1)
      throw new Error(`bateau ${c} mal formé`);
    bateaux.push({ x, y, n, h, c });
  }
  const D = bateaux[0];
  if (D.h || D.n !== 2 || D.x !== niv.sortie) throw new Error('le navire doré doit être debout, sur 2 cases, dans la colonne de la sortie');
  return { w, sortie: niv.sortie, bateaux, fixes };
}
const capDepart = N => N.bateaux.map(b => (b.h ? b.x : b.y));

// la grille des cases prises : -1 libre, -2 obstacle fixe, sinon le numéro du bateau
function capOccupation(N, v, sauf) {
  const g = new Array(N.w * N.w).fill(-1);
  for (const p of N.fixes) g[p] = -2;
  N.bateaux.forEach((b, i) => {
    if (i === sauf) return;
    for (let k = 0; k < b.n; k++) g[b.h ? b.y * N.w + v[i] + k : (v[i] + k) * N.w + b.x] = i;
  });
  return g;
}
// les positions extrêmes que peut atteindre le bateau i : [plus petite, plus grande]
function capLimites(N, v, i, g) {
  const b = N.bateaux[i], w = N.w;
  g = g || capOccupation(N, v);
  const libre = k => g[b.h ? b.y * w + k : k * w + b.x] === -1;
  let a = v[i], z = v[i];
  while (a - 1 >= 0 && libre(a - 1)) a--;
  while (z + b.n < w && libre(z + b.n)) z++;
  return [a, z];
}
// déplace le bateau i en position p ; renvoie le nouvel état, ou null si le coup est impossible
function capCoup(N, v, i, p) {
  if (i < 0 || i >= N.bateaux.length || p === v[i]) return null;
  const [a, z] = capLimites(N, v, i);
  if (p < a || p > z) return null;
  const r = v.slice(); r[i] = p; return r;
}
const capGagne = (N, v) => v[0] === 0;

// recherche en largeur : le plus petit nombre de coups et une solution [[bateau, position], …]
function capResoudre(N, max) {
  const v0 = capDepart(N), cle = v => v.join(','), vu = new Map([[cle(v0), null]]);
  let file = [v0], coups = 0;
  if (capGagne(N, v0)) return { coups: 0, sol: [], etats: 1 };
  while (file.length) {
    const suite = [];
    coups++;
    for (const v of file) {
      const g = capOccupation(N, v);
      for (let i = 0; i < N.bateaux.length; i++) {
        const [a, z] = capLimites(N, v, i, g);
        for (let p = a; p <= z; p++) {
          if (p === v[i]) continue;
          const r = v.slice(); r[i] = p; const k = cle(r);
          if (vu.has(k)) continue;
          vu.set(k, [cle(v), i, p]);
          if (capGagne(N, r)) {
            const sol = []; let c = k;
            while (vu.get(c)) { const [pr, bi, bp] = vu.get(c); sol.unshift([bi, bp]); c = pr; }
            return { coups, sol, etats: vu.size };
          }
          suite.push(r);
          if (max && vu.size > max) return null;
        }
      }
    }
    file = suite;
  }
  return null;
}

// étoiles : 3 jusqu'à l'optimum + 10 % (au moins + 1, des enfants jouent), 2 jusqu'à + 50 % (au moins + 3), sinon 1
const capSeuil3 = opt => Math.max(opt + 1, Math.ceil(opt * 1.1));
const capSeuil2 = opt => Math.max(opt + 3, Math.ceil(opt * 1.5));
const capEtoiles = (coups, opt) => (coups <= capSeuil3(opt) ? 3 : coups <= capSeuil2(opt) ? 2 : 1);

// solution notée en texte : « 3:2 0:0 » (bateau:position)
const capSolTexte = sol => sol.map(([i, p]) => i + ':' + p).join(' ');
const capSolLire = s => (s ? s.split(' ').map(t => t.split(':').map(Number)) : []);

/* ---------- générateur (outil des bassins, et plus tard le bassin du jour) ----------
   Pose des bateaux au hasard, explore tous les états atteignables depuis cette pose, calcule pour chacun
   la distance (en coups) jusqu'à la victoire, et renvoie l'état le plus difficile dont la distance tombe
   dans [min, max]. Les coups sont réversibles : les distances se calculent depuis les états gagnés. */
function capHasard(graine) {
  let a = graine >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function capGenerer(r, o) {
  const w = o.w, LETTRES = 'ABCEFGHIJKLMNPQRSTUVWXYZ';
  const plan = Array.from({ length: w }, () => Array(w).fill('.'));
  const sortie = o.sorties[Math.floor(r() * o.sorties.length)];
  // le navire doré, en bas de sa colonne
  plan[w - 2][sortie] = plan[w - 1][sortie] = 'D';
  for (let k = 0; k < (o.fixes || 0); k++) {
    for (let essai = 0; essai < 30; essai++) {
      const x = Math.floor(r() * w), y = 1 + Math.floor(r() * (w - 2));
      if (plan[y][x] === '.' && x !== sortie) { plan[y][x] = 'o'; break; }
    }
  }
  let n = 0, essais = 0;
  while (n < o.bateaux && essais++ < 400) {
    const L = r() < o.p4 ? 4 : r() < o.p3 ? 3 : 2, h = r() < .5;
    const x = Math.floor(r() * (h ? w - L + 1 : w)), y = Math.floor(r() * (h ? w : w - L + 1));
    let ok = true;
    for (let k = 0; k < L; k++) if (plan[h ? y : y + k][h ? x + k : x] !== '.') ok = false;
    // pas de bateau debout dans la colonne de la passe : il ne pourrait jamais en sortir et la boucherait pour toujours
    if (!h && x === sortie) ok = false;
    if (!ok) continue;
    for (let k = 0; k < L; k++) plan[h ? y : y + k][h ? x + k : x] = LETTRES[n];
    n++;
  }
  const niv = { plan: plan.map(l => l.join('')), sortie }, N = capLire(niv);
  // tous les états atteignables
  const cle = v => v.join(','), etats = new Map(), v0 = capDepart(N);
  etats.set(cle(v0), v0);
  let file = [v0];
  while (file.length) {
    const suite = [];
    for (const v of file) {
      const g = capOccupation(N, v);
      for (let i = 0; i < N.bateaux.length; i++) {
        const [a, z] = capLimites(N, v, i, g);
        for (let p = a; p <= z; p++) { if (p === v[i]) continue; const s = v.slice(); s[i] = p; const k = cle(s); if (!etats.has(k)) { etats.set(k, s); suite.push(s); } }
      }
    }
    file = suite;
    if (etats.size > (o.maxEtats || 60000)) return null;
  }
  // distances jusqu'à la victoire, depuis tous les états gagnés
  const dist = new Map();
  file = [];
  for (const [k, v] of etats) if (capGagne(N, v)) { dist.set(k, 0); file.push(v); }
  if (!file.length) return null;
  let d = 0;
  while (file.length) {
    d++;
    const suite = [];
    for (const v of file) {
      const g = capOccupation(N, v);
      for (let i = 0; i < N.bateaux.length; i++) {
        const [a, z] = capLimites(N, v, i, g);
        for (let p = a; p <= z; p++) { if (p === v[i]) continue; const s = v.slice(); s[i] = p; const k = cle(s); if (!dist.has(k)) { dist.set(k, d); suite.push(s); } }
      }
    }
    file = suite;
  }
  // l'état le plus difficile dans la plage voulue (le navire doré jamais déjà à la passe)
  let best = null, bd = -1;
  for (const [k, dd] of dist) if (dd >= o.min && dd <= o.max && dd > bd) { bd = dd; best = etats.get(k); }
  if (!best) return null;
  // réécrit le plan avec cette position de départ
  const P = Array.from({ length: w }, () => Array(w).fill('.'));
  for (const p of N.fixes) P[Math.floor(p / w)][p % w] = 'o';
  N.bateaux.forEach((b, i) => { for (let k = 0; k < b.n; k++) P[b.h ? b.y : best[i] + k][b.h ? best[i] + k : b.x] = b.c; });
  return { plan: P.map(l => l.join('')), sortie, opt: bd };
}

if (typeof module !== 'undefined') module.exports = { capLire, capDepart, capOccupation, capLimites, capCoup, capGagne, capResoudre, capEtoiles, capSeuil3, capSeuil2, capSolTexte, capSolLire, capHasard, capGenerer };

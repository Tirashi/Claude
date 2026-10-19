/* Le Magasinier, outil de création (sous Node, pas utilisé par le jeu) : pour une salle dessinée à la main
   (murs et glace seulement), cherche où poser marques, caisses et docker pour que le niveau soit le plus long
   à résoudre. Sans glace : recherche à rebours exacte (on tire les caisses depuis les marques ; la distance
   trouvée est l'optimum en coups). Avec glace : essais au hasard vérifiés par le solveur.
   node outils/magasinier-generateur.js <n° de salle> [essais] [graine]      (salles : SALLES ci-dessous) */
const R = require('../magasinier/regles.js');

function alea(g) { let s = g >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// recherche à rebours : renvoie l'état de départ le plus éloigné (en coups) des marques
function rebours(N, marques, plafond = Infinity, limite = 2e6) {
  const w = N.w, libres = [];
  for (let p = 0; p < N.mur.length; p++) if (N.dedans[p] && !N.mur[p]) libres.push(p);
  const D = [-w, w, -1, 1], cle = (d, c) => String.fromCharCode(d, ...c);
  const dist = new Map(); let file = [];
  // départs : caisses sur les marques, docker sur n'importe quelle case libre atteignable
  const c0 = [...marques].sort((a, b) => a - b);
  for (const d of libres) if (!c0.includes(d)) { const k = cle(d, c0); dist.set(k, 0); file.push([d, c0]); }
  let meilleur = null, profondeur = 0;
  while (file.length && dist.size < limite && profondeur < plafond) {
    const suite = []; profondeur++;
    for (const [d, c] of file) for (const v of D) {
      const t = d + v; if (N.mur[t] || !N.dedans[t] || c.includes(t)) continue;
      // simple pas en arrière
      let k = cle(t, c);
      if (!dist.has(k)) { dist.set(k, profondeur); suite.push([t, c]); }
      // tirer la caisse qui est derrière le docker
      const b = d - v, i = c.indexOf(b);
      if (i >= 0) { const c2 = c.slice(); c2[i] = d; c2.sort((a, b) => a - b); k = cle(t, c2);
        if (!dist.has(k)) { dist.set(k, profondeur); suite.push([t, c2]); } }
    }
    if (suite.length) meilleur = { profondeur, etats: suite };
    file = suite;
  }
  return meilleur;
}

function plan(N, d, caisses, marques) {
  const out = [];
  for (let y = 0; y < N.h; y++) { let l = '';
    for (let x = 0; x < N.w; x++) { const p = y * N.w + x, c = caisses.includes(p), m = marques.includes(p), g = N.glace[p];
      l += N.mur[p] ? '#' : p === d ? (m ? '+' : g ? 'a' : '@') : c ? (m ? '*' : g ? 'c' : '$') : m ? '.' : g ? '~' : ' '; }
    out.push(l.replace(/\s+$/, '')); }
  return out;
}

const SALLES = require('./magasinier-salles.js');
const [n = '0', essais = '40', graine = '1'] = process.argv.slice(2);
const S = SALLES[+n], rnd = alea(+graine);
// un docker fictif dans la salle (première case après le premier mur de la 2e rangée) pour calculer l'intérieur
const x1 = S.salle[1].search(/#[^#]/) + 1;
const base = R.magLire(S.salle.map((l, y) => y === 1 ? l.slice(0, x1) + (l[x1] === '~' ? 'a' : '@') + l.slice(x1 + 1) : l));
// la salle est lue avec un docker fictif pour calculer l'intérieur ; les marques sont posées ensuite
const libres = [], sol = [];
for (let p = 0; p < base.mur.length; p++) if (base.dedans[p] && !base.mur[p]) { libres.push(p); if (!base.glace[p]) sol.push(p); }
const glacee = S.salle.some(l => l.includes('~'));
// évalue une disposition : marques m ; avec glace, caisses c et docker d (sans glace, la recherche à rebours les choisit)
function evalue(m, c, d) {
  if (!glacee) {
    const r = rebours(base, m, S.max || Infinity); if (!r) return null;
    const bons = r.etats.filter(([d2, c2]) => c2.every(p => !m.includes(p)) && !m.includes(d2)), choix = (bons.length ? bons : r.etats)[Math.floor(rnd() * (bons.length || r.etats.length))];
    d = choix[0]; c = choix[1];
  }
  const p = plan(base, d, c, m); let N; try { N = R.magLire(p); } catch (e) { return null; }
  const s = R.magResoudre(N, glacee ? 4e5 : 3e6); if (!s || (S.max && s.coups > S.max)) return null;
  // note : poussées et changements de direction comptent plus que la longueur (pas de longues marches à vide)
  let pou = 0, chg = 0, prec = null, E = { d: N.depart.d, c: N.depart.c };
  for (const dir of s.chemin) { const r = R.magCoup(N, E, dir); if (r.pousse >= 0) { pou++; if (prec !== null && prec !== dir) chg++; prec = dir; } E = r.E; }
  return { note: 2 * pou + 4 * chg + 0.3 * s.coups, coups: s.coups, pou, chg, plan: p, m, c, d };
}
const tire = (l, sauf) => { let p; do p = l[Math.floor(rnd() * l.length)]; while (sauf.includes(p)); return p; };
function hasard() {
  const m = []; while (m.length < S.caisses) m.push(tire(sol, m));
  const c = []; if (glacee) while (c.length < S.caisses) { const p = tire(libres, [...c, ...m]); if (!base.mort[p]) c.push(p); }
  return evalue(m, c, glacee ? tire(libres, c) : 0);
}
let top = null;
for (let e = 0; e < +essais; e++) { const r = hasard(); if (r && (!top || r.note > top.note)) top = r; }
// amélioration : on déplace une marque, une caisse ou le docker, et on garde si la note ne baisse pas
for (let e = 0; top && e < +essais; e++) {
  const m = top.m.slice(), c = top.c.slice(); let d = top.d; const quoi = glacee ? Math.floor(rnd() * 3) : 0;
  if (quoi === 0) { const i = Math.floor(rnd() * m.length); m[i] = tire(sol, [...m, ...c, d]); }
  else if (quoi === 1) { const i = Math.floor(rnd() * c.length); const p = tire(libres, [...m, ...c, d]); if (base.mort[p]) continue; c[i] = p; }
  else d = tire(libres, c);
  const r = evalue(m, c, d); if (r && r.note >= top.note) top = r;
}
if (!top) { console.log('aucun niveau trouvé'); process.exit(1); }
console.log(`// ${S.nom} : ${top.coups} coups, ${top.pou} poussées, ${top.chg} changements`);
console.log(JSON.stringify(top.plan, null, 0).replace(/","/g, '",\n "'));

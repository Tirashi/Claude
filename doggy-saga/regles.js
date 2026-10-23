/* Doggy Saga : règles du trois en ligne (logique pure, sans DOM ni localStorage ni Math.random ; utilisable sous Node).
   La page et le simulateur chargent ce fichier comme un script classique (constantes et fonctions dog… globales).

   Grille de 8 × 8, case i = rangée * 8 + colonne. Un niveau s'écrit en texte, une chaîne de 8 caractères par rangée :
     ' ' pas de case (trou)        '.' case normale
     'b' boue (1 couche)           'B' boue (2 couches)
     'n' 'N' 'M' niche (1, 2 ou 3 coups pour la casser ; pas de chien dessus, rien ne la traverse)
     'g' gamelle (tombe comme un chien, ne s'aligne pas, part quand on aligne à côté)
     'l' chien en laisse (ne bouge pas, ne tombe pas ; s'aligne normalement)   'L' chien en laisse sur une case boueuse
     'c' chiot perdu (ne s'aligne pas, tombe ; sauvé quand il arrive tout en bas de sa colonne)
   Pièces : { t: race (0 à 15, -1 pour la balle, la gamelle ou le chiot), sp: 0, 1 bandana (vide la rangée), 2 bandana (vide la colonne),
              3 nœud (3 × 3), 4 balle de tennis ; ch: chiot ; gm: gamelle ; ls: en laisse }.
   État (JSON) : voir dogNouvelle. Un coup (dogCoup) est réglé d'un bloc et rend la liste des événements que la page rejoue
   en animation : echange, retour, effet, efface, cree, chute, sauve, adopte, melange, bonus, fin. */

const DOG_W = 8, DOG_H = 8, DOG_N = 64;

// les 16 chiens du refuge ; les 6 premiers sont ceux de la maquette validée (22/10)
const DOG_RACES = [
  { id: 'beagle', nom: 'Biscotte', race: 'beagle' },
  { id: 'husky', nom: 'Neige', race: 'husky' },
  { id: 'shiba', nom: 'Kumo', race: 'shiba' },
  { id: 'dalmatien', nom: 'Domino', race: 'dalmatien' },
  { id: 'caniche', nom: 'Praline', race: 'caniche' },
  { id: 'collie', nom: 'Réglisse', race: 'border collie' },
  { id: 'teckel', nom: 'Chorizo', race: 'teckel' },
  { id: 'carlin', nom: 'Pompon', race: 'carlin' },
  { id: 'bouledogue', nom: 'Gaston', race: 'bouledogue français' },
  { id: 'chihuahua', nom: 'Pépite', race: 'chihuahua' },
  { id: 'levrier', nom: 'Éclair', race: 'lévrier' },
  { id: 'labrador', nom: 'Cacao', race: 'labrador chocolat' },
  { id: 'bernois', nom: 'Nounours', race: 'bouvier bernois' },
  { id: 'corgi', nom: 'Galette', race: 'corgi' },
  { id: 'samoyede', nom: 'Flocon', race: 'samoyède' },
  { id: 'cocker', nom: 'Caramel', race: 'cocker' },
];

// points
const DOG_PTS = { chien: 20, cree: [0, 60, 60, 100, 200], boue: 100, niche: 40, gamelle: 60, chiot: 1000 };

/* ---------- hasard ---------- */
function dogGraine(s) {
  let h = 2166136261;
  for (const ch of String(s)) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 13; }
  return h >>> 0;
}
function dogAlea(e) {
  let t = (e.rng = (e.rng + 0x6D2B79F5) >>> 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const dogEntier = (e, n) => Math.floor(dogAlea(e) * n);

/* ---------- outils de grille ---------- */
const dogRc = i => [Math.floor(i / DOG_W), i % DOG_W];
function dogVoisins(i) {
  const [r, c] = dogRc(i), v = [];
  if (r > 0) v.push(i - DOG_W);
  if (r < DOG_H - 1) v.push(i + DOG_W);
  if (c > 0) v.push(i - 1);
  if (c < DOG_W - 1) v.push(i + 1);
  return v;
}
const dogCote = (a, b) => dogVoisins(a).includes(b);
// une case où une pièce peut être posée
const dogLibre = (e, i) => e.ok[i] && !e.niche[i];
// la race qui compte pour les alignements (-1 : ne s'aligne pas)
function dogType(e, i) {
  const p = e.g[i];
  return p && !p.ch && !p.gm && p.sp !== 4 ? p.t : -1;
}
const dogEstChien = p => p && !p.ch && !p.gm;
const dogBouge = p => p && !p.ls;

/* ---------- nouvelle partie ---------- */
/* niv : { id, coups, races: [indices de DOG_RACES], plan: [8 chaînes], obj: [objectifs], chiots: { total, max, tous } , etoiles: [2 étoiles, 3 étoiles] }
   objectifs : { k: 'calins', t: race, n } · { k: 'boue' } · { k: 'chiots', n }
   mode : 'niveau' (on gagne en remplissant les objectifs) ou 'jour' (pas d'objectif : on fait le plus de câlins en `coups` coups) */
function dogNouvelle(niv, graine, mode) {
  const e = {
    niv: niv.id, mode: mode || 'niveau', graine: String(graine), rng: dogGraine('doggy|' + niv.id + '|' + graine),
    ok: new Array(DOG_N).fill(false), boue: new Array(DOG_N).fill(0), niche: new Array(DOG_N).fill(0), g: new Array(DOG_N).fill(null),
    races: niv.races.slice(), coups: niv.coups, coupsJoues: 0, score: 0,
    calins: new Array(DOG_RACES.length).fill(0), obj: (niv.obj || []).map(o => Object.assign({}, o)), adoptes: [],
    chiotsTotal: 0, chiotsMax: 0, chiotsVenus: 0, chiotsSauves: 0, chiotsTous: 2, prochainChiot: 0,
    sorties: [], fin: null, bonus: 0,
  };
  const o = e.obj.find(x => x.k === 'chiots');
  if (o) { e.chiotsTotal = o.n; e.chiotsMax = (niv.chiots && niv.chiots.max) || 1; e.chiotsTous = (niv.chiots && niv.chiots.tous) || 2; }
  const plan = niv.plan;
  if (plan.length !== DOG_H || plan.some(l => l.length !== DOG_W)) throw new Error('niveau ' + niv.id + ' : le plan doit faire 8 × 8');
  const poses = [];
  plan.forEach((l, r) => [...l].forEach((ch, c) => {
    const i = r * DOG_W + c;
    if (ch === ' ') return;
    e.ok[i] = true;
    if (ch === 'b') e.boue[i] = 1;
    else if (ch === 'B') e.boue[i] = 2;
    else if (ch === 'n' || ch === 'N' || ch === 'M') e.niche[i] = 'nNM'.indexOf(ch) + 1;
    else if (ch === 'g') poses.push([i, { t: -1, sp: 0, gm: 1 }]);
    else if (ch === 'c') { poses.push([i, { t: -1, sp: 0, ch: 1 }]); e.chiotsVenus++; }
    else if (ch === 'l' || ch === 'L') { poses.push([i, 'laisse']); if (ch === 'L') e.boue[i] = 1; }
    else if (ch !== '.') throw new Error('niveau ' + niv.id + ' : caractère inconnu « ' + ch + ' »');
  }));
  // la sortie des chiots : la case libre la plus basse de chaque colonne
  for (let c = 0; c < DOG_W; c++) for (let r = DOG_H - 1; r >= 0; r--) { const i = r * DOG_W + c; if (dogLibre(e, i)) { e.sorties.push(i); break; } }
  e.boueDepart = e.boue.reduce((x, y) => x + y, 0);
  dogRemplir(e, poses);
  e.prochainChiot = e.chiotsVenus ? e.chiotsTous : 0;
  return e;
}
// remplit la grille sans alignement tout fait, avec au moins un coup possible
function dogRemplir(e, poses) {
  for (let essai = 0; essai < 200; essai++) {
    for (let i = 0; i < DOG_N; i++) e.g[i] = null;
    for (const [i, p] of poses) if (p !== 'laisse') e.g[i] = Object.assign({}, p);
    for (let i = 0; i < DOG_N; i++) {
      if (!dogLibre(e, i) || e.g[i]) continue;
      const laisse = poses.some(([j, p]) => j === i && p === 'laisse');
      let t, n = 0;
      do { t = e.races[dogEntier(e, e.races.length)]; e.g[i] = { t, sp: 0 }; n++; } while (dogAligneEn(e, i) && n < 30);
      if (laisse) e.g[i].ls = 1;
    }
    if (!dogTrouver(e).length && dogCoupsPossibles(e).length) return;
  }
  throw new Error('niveau ' + e.niv + ' : impossible de remplir la grille');
}

/* ---------- alignements ---------- */
function dogAligneEn(e, i) {
  const t = dogType(e, i);
  if (t < 0) return false;
  const [r, c] = dogRc(i);
  let a = c, b = c;
  while (a > 0 && dogType(e, i - (c - a) - 1) === t) a--;
  while (b < DOG_W - 1 && dogType(e, i + (b - c) + 1) === t) b++;
  if (b - a >= 2) return true;
  a = r; b = r;
  while (a > 0 && dogType(e, (a - 1) * DOG_W + c) === t) a--;
  while (b < DOG_H - 1 && dogType(e, (b + 1) * DOG_W + c) === t) b++;
  return b - a >= 2;
}
// toutes les suites de 3 ou plus : [{ h, t, cases }]
function dogTrouver(e) {
  const runs = [];
  for (let r = 0; r < DOG_H; r++) {
    let c = 0;
    while (c < DOG_W) {
      const t = dogType(e, r * DOG_W + c);
      let f = c + 1;
      if (t >= 0) while (f < DOG_W && dogType(e, r * DOG_W + f) === t) f++;
      if (t >= 0 && f - c >= 3) { const cases = []; for (let k = c; k < f; k++) cases.push(r * DOG_W + k); runs.push({ h: 1, t, cases }); }
      c = f;
    }
  }
  for (let c = 0; c < DOG_W; c++) {
    let r = 0;
    while (r < DOG_H) {
      const t = dogType(e, r * DOG_W + c);
      let f = r + 1;
      if (t >= 0) while (f < DOG_H && dogType(e, f * DOG_W + c) === t) f++;
      if (t >= 0 && f - r >= 3) { const cases = []; for (let k = r; k < f; k++) cases.push(k * DOG_W + c); runs.push({ h: 0, t, cases }); }
      r = f;
    }
  }
  return runs;
}
function dogGrouper(runs) {
  const groupes = [];
  for (const run of runs) {
    let dans = null;
    for (const g of groupes.slice()) {
      if (!run.cases.some(k => g.set.has(k))) continue;
      if (!dans) dans = g;
      else { g.runs.forEach(x => dans.runs.push(x)); g.set.forEach(x => dans.set.add(x)); groupes.splice(groupes.indexOf(g), 1); }
    }
    if (!dans) { dans = { runs: [], set: new Set() }; groupes.push(dans); }
    dans.runs.push(run);
    run.cases.forEach(k => dans.set.add(k));
  }
  return groupes;
}
// d'une liste de suites : les cases à effacer et les pièces spéciales à créer (bougees : cases où le joueur a posé un chien)
function dogEtape(e, runs, bougees) {
  const cles = [], crees = [];
  for (const g of dogGrouper(runs)) {
    g.set.forEach(k => cles.push(k));
    const long = Math.max(...g.runs.map(x => x.cases.length)), h = g.runs.some(x => x.h), v = g.runs.some(x => !x.h);
    let sp = 0;
    if (long >= 5) sp = 4;
    else if (h && v) sp = 3;
    else if (long === 4) sp = g.runs[0].h ? 2 : 1;
    if (!sp) continue;
    let pos = bougees.find(k => g.set.has(k));
    if (pos === undefined && sp === 3) {
      const vs = new Set();
      g.runs.filter(x => !x.h).forEach(x => x.cases.forEach(k => vs.add(k)));
      pos = g.runs.filter(x => x.h).flatMap(x => x.cases).find(k => vs.has(k));
    }
    if (pos === undefined) { const L = g.runs.reduce((a, b) => (b.cases.length > a.cases.length ? b : a)); pos = L.cases[L.cases.length >> 1]; }
    crees.push({ i: pos, t: sp === 4 ? -1 : g.runs[0].t, sp });
  }
  return { cles, crees };
}

/* ---------- coups possibles ---------- */
function dogEchangeable(e, a, b) {
  const A = e.g[a], B = e.g[b];
  if (!A || !B || A.ls || B.ls || A.gm || B.gm) return false;
  if (A.sp === 4 || B.sp === 4) return dogEstChien(A) && dogEstChien(B);
  if (A.sp && B.sp) return true;
  e.g[a] = B; e.g[b] = A;
  const ok = dogAligneEn(e, a) || dogAligneEn(e, b);
  e.g[a] = A; e.g[b] = B;
  return ok;
}
function dogCoupsPossibles(e) {
  const l = [];
  for (let i = 0; i < DOG_N; i++) {
    if (!e.g[i]) continue;
    const [r, c] = dogRc(i);
    if (c < DOG_W - 1 && dogEchangeable(e, i, i + 1)) l.push([i, i + 1]);
    if (r < DOG_H - 1 && dogEchangeable(e, i, i + DOG_W)) l.push([i, i + DOG_W]);
  }
  return l;
}

/* ---------- un coup ---------- */
// rend null si la partie est finie ou le coup impossible ; { ok: false, ev } si l'échange ne fait rien (les chiens reviennent) ; { ok: true, ev } sinon
function dogCoup(e, a, b) {
  if (e.fin || !dogCote(a, b)) return null;
  const A = e.g[a], B = e.g[b];
  if (!A || !B || A.ls || B.ls || A.gm || B.gm) return null;
  const ev = [{ k: 'echange', a, b }];
  e.g[a] = B; e.g[b] = A;
  let premier = null;
  if (A.sp === 4 || B.sp === 4) {
    if (!dogEstChien(A) || !dogEstChien(B)) premier = false;
    else {
      const balle = A.sp === 4 ? A : B, autre = balle === A ? B : A, pos = balle === A ? b : a;
      if (autre.sp === 4) { balle.tout = 1; autre.parti = 1; premier = { cles: [a, b], crees: [] }; }
      else { balle.cible = autre.t; if (autre.sp) balle.conv = autre.sp; premier = { cles: [pos], crees: [] }; }
    }
  } else if (A.sp && B.sp) {
    if (A.sp === 3 && B.sp === 3) { A.parti = B.parti = 1; premier = { cles: [a, b], crees: [], grand: { k: 'noeuds', i: a } }; }
    else if (A.sp === 3 || B.sp === 3) { A.parti = B.parti = 1; premier = { cles: [a, b], crees: [], grand: { k: 'croix', i: a } }; }
    else premier = { cles: [a, b], crees: [] };
  } else {
    const runs = dogTrouver(e);
    premier = runs.length ? dogEtape(e, runs, [a, b]) : false;
  }
  if (premier === false) {
    e.g[a] = A; e.g[b] = B;
    ev.push({ k: 'retour', a, b });
    return { ok: false, ev };
  }
  e.coups--; e.coupsJoues++;
  dogResoudre(e, ev, premier);
  dogApres(e, ev);
  return { ok: true, ev };
}
// après un coup : victoire (et bouquet final), fin des coups, mélange s'il n'y a plus rien à jouer
function dogApres(e, ev) {
  if (e.mode === 'niveau' && dogObjectifsFaits(e)) {
    e.fin = 'gagne';
    dogBouquet(e, ev);
    ev.push({ k: 'fin', fin: 'gagne', score: e.score });
    return;
  }
  if (e.coups <= 0) {
    e.fin = e.mode === 'jour' ? 'fini' : 'perdu';
    ev.push({ k: 'fin', fin: e.fin, score: e.score });
    return;
  }
  if (!dogCoupsPossibles(e).length) { dogMelanger(e); ev.push({ k: 'melange', g: e.g.map(p => (p ? Object.assign({}, p) : null)) }); }
}
// cascades : on efface, on fait tomber, on recommence tant qu'il y a des alignements
function dogResoudre(e, ev, premier) {
  let combo = 0, etape = premier;
  for (let garde = 0; garde < 200; garde++) {
    if (!etape) {
      const runs = dogTrouver(e);
      if (!runs.length) return;
      etape = dogEtape(e, runs, []);
    }
    dogEffacer(e, etape, combo, ev);
    dogGravite(e, ev);
    etape = null;
    combo++;
  }
}
function dogDeclencher(e, p, i, q, effets) {
  const [r, c] = dogRc(i);
  if (p.sp === 1) { for (let k = 0; k < DOG_W; k++) q.push(r * DOG_W + k); effets.push({ k: 'effet', type: 'rayon', i, h: 1 }); }
  else if (p.sp === 2) { for (let k = 0; k < DOG_H; k++) q.push(k * DOG_W + c); effets.push({ k: 'effet', type: 'rayon', i, h: 0 }); }
  else if (p.sp === 3) {
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < DOG_H && cc >= 0 && cc < DOG_W) q.push(rr * DOG_W + cc); }
    effets.push({ k: 'effet', type: 'noeud', i });
  } else if (p.sp === 4) {
    if (p.tout) { for (let k = 0; k < DOG_N; k++) q.push(k); effets.push({ k: 'effet', type: 'toutes', i }); return; }
    let t = p.cible;
    if (t === undefined || t < 0) {
      const l = [];
      for (let k = 0; k < DOG_N; k++) { const x = dogType(e, k); if (x >= 0) l.push(x); }
      t = l.length ? l[dogEntier(e, l.length)] : -1;
    }
    const cibles = [];
    for (let k = 0; k < DOG_N; k++) {
      const x = e.g[k];
      if (!dogEstChien(x) || x.sp === 4 || x.t !== t) continue;
      if (p.conv && !x.parti) x.sp = p.conv === 3 ? 3 : (dogAlea(e) < 0.5 ? 1 : 2);
      cibles.push(k); q.push(k);
    }
    effets.push({ k: 'effet', type: 'balle', i, t, cibles, conv: p.conv || 0 });
  }
}
// grands effets des bonus échangés entre eux
function dogGrand(e, g, q, effets) {
  const [r, c] = dogRc(g.i);
  if (g.k === 'croix') {
    for (let d = -1; d <= 1; d++) {
      const rr = r + d, cc = c + d;
      if (rr >= 0 && rr < DOG_H) for (let k = 0; k < DOG_W; k++) q.push(rr * DOG_W + k);
      if (cc >= 0 && cc < DOG_W) for (let k = 0; k < DOG_H; k++) q.push(k * DOG_W + cc);
    }
    effets.push({ k: 'effet', type: 'croix', i: g.i });
  } else {
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < DOG_H && cc >= 0 && cc < DOG_W) q.push(rr * DOG_W + cc); }
    effets.push({ k: 'effet', type: 'noeuds', i: g.i });
  }
}
function dogEffacer(e, etape, combo, ev) {
  const q = etape.cles.slice(), faits = new Set(), effets = [], nichesTouchees = new Set(), gamelles = new Set();
  if (etape.grand) dogGrand(e, etape.grand, q, effets);
  while (q.length) {
    const i = q.pop();
    if (faits.has(i) || !e.ok[i]) continue;
    if (e.niche[i]) { nichesTouchees.add(i); continue; }
    const p = e.g[i];
    if (!p || p.ch) continue;
    if (p.gm) { gamelles.add(i); continue; }
    faits.add(i);
    if (p.sp && !p.parti) { p.parti = 1; dogDeclencher(e, p, i, q, effets); }
  }
  // ce qui est à côté d'un chien parti : niches abîmées, gamelles renversées
  for (const i of faits) for (const v of dogVoisins(i)) {
    if (e.niche[v]) nichesTouchees.add(v);
    else if (e.g[v] && e.g[v].gm) gamelles.add(v);
  }
  for (const x of effets) ev.push(x);
  const parts = [], mult = combo + 1;
  let pts = 0;
  for (const i of faits) {
    const p = e.g[i];
    parts.push({ i, t: p.t, sp: p.sp });
    e.g[i] = null;
    if (p.t >= 0 && p.sp !== 4) { e.calins[p.t]++; pts += DOG_PTS.chien * mult; }
    if (e.boue[i]) { e.boue[i]--; pts += DOG_PTS.boue; ev.push({ k: 'boue', i, n: e.boue[i] }); }
  }
  for (const i of gamelles) {
    e.g[i] = null; pts += DOG_PTS.gamelle;
    if (e.boue[i]) { e.boue[i]--; pts += DOG_PTS.boue; ev.push({ k: 'boue', i, n: e.boue[i] }); }
    parts.push({ i, t: -1, gm: 1 });
  }
  for (const i of nichesTouchees) { e.niche[i]--; pts += DOG_PTS.niche; ev.push({ k: 'niche', i, n: e.niche[i] }); }
  for (const c of etape.crees) { e.g[c.i] = { t: c.t, sp: c.sp }; pts += DOG_PTS.cree[c.sp]; }
  e.score += pts;
  ev.push({ k: 'efface', cases: parts, combo, points: pts });
  for (const c of etape.crees) ev.push({ k: 'cree', i: c.i, t: c.t, sp: c.sp });
  // adoptions (objectifs de câlins tout juste remplis)
  for (const o of e.obj) if (o.k === 'calins' && !e.adoptes.includes(o.t) && e.calins[o.t] >= o.n) { e.adoptes.push(o.t); ev.push({ k: 'adopte', t: o.t }); }
}
// la case pleine au-dessus de i (en sautant les trous) : son indice, -1 s'il n'y a rien au-dessus (on fait entrer une nouvelle pièce), -2 si c'est bouché
function dogDessus(e, i) {
  let [r, c] = dogRc(i);
  for (r--; r >= 0; r--) {
    const j = r * DOG_W + c;
    if (!e.ok[j]) continue;
    if (e.niche[j]) return -2;
    return j;
  }
  return -1;
}
function dogNouvellePiece(e) {
  if (e.chiotsTotal && e.chiotsVenus < e.chiotsTotal && e.coupsJoues >= e.prochainChiot) {
    let sur = 0;
    for (const p of e.g) if (p && p.ch) sur++;
    if (sur < e.chiotsMax) { e.chiotsVenus++; e.prochainChiot = e.coupsJoues + e.chiotsTous; return { t: -1, sp: 0, ch: 1 }; }
  }
  return { t: e.races[dogEntier(e, e.races.length)], sp: 0 };
}
function dogGravite(e, ev) {
  for (let tour = 0; tour < 10; tour++) {
    const depart = new Map(), neufs = [], parCol = new Array(DOG_W).fill(0);
    e.g.forEach((p, i) => { if (p) depart.set(p, i); });
    for (let garde = 0, change = true; change && garde < 100; garde++) {
      change = false;
      for (let i = DOG_N - 1; i >= 0; i--) {
        if (!dogLibre(e, i) || e.g[i]) continue;
        const j = dogDessus(e, i), [r, c] = dogRc(i);
        if (j === -1) {
          const p = dogNouvellePiece(e);
          e.g[i] = p; neufs.push({ p, c, k: parCol[c]++ }); change = true; continue;
        }
        if (j >= 0 && e.g[j] && dogBouge(e.g[j])) { e.g[i] = e.g[j]; e.g[j] = null; change = true; continue; }
        if (j >= 0 && !e.g[j]) continue;
        // bouché (niche ou chien en laisse) : on prend en diagonale une pièce qui ne peut pas tomber tout droit
        for (const dc of [-1, 1]) {
          const cc = c + dc;
          if (r === 0 || cc < 0 || cc >= DOG_W) continue;
          const k = (r - 1) * DOG_W + cc, dessous = r * DOG_W + cc;
          if (!dogLibre(e, k) || !e.g[k] || !dogBouge(e.g[k])) continue;
          if (dogLibre(e, dessous) && !e.g[dessous]) continue;
          e.g[i] = e.g[k]; e.g[k] = null; change = true; break;
        }
      }
    }
    const mv = [];
    e.g.forEach((p, i) => { if (p && depart.has(p) && depart.get(p) !== i) mv.push([depart.get(p), i]); });
    const nv = neufs.map(n => ({ i: e.g.indexOf(n.p), t: n.p.t, sp: n.p.sp, ch: n.p.ch || 0, k: n.k }));
    if (mv.length || nv.length) ev.push({ k: 'chute', mv, neufs: nv });
    // les chiots arrivés en bas sont sauvés
    let sauve = false;
    for (const s of e.sorties) if (e.g[s] && e.g[s].ch) { e.g[s] = null; e.chiotsSauves++; e.score += DOG_PTS.chiot; ev.push({ k: 'sauve', i: s }); sauve = true; }
    if (!sauve) return;
  }
}
function dogMelanger(e) {
  const cases = [];
  for (let i = 0; i < DOG_N; i++) { const p = e.g[i]; if (dogEstChien(p) && !p.ls) cases.push(i); }
  const pieces = cases.map(i => e.g[i]);
  for (let essai = 0; essai < 300; essai++) {
    for (let k = pieces.length - 1; k > 0; k--) { const j = dogEntier(e, k + 1); [pieces[k], pieces[j]] = [pieces[j], pieces[k]]; }
    cases.forEach((i, k) => (e.g[i] = pieces[k]));
    if (!dogTrouver(e).length && dogCoupsPossibles(e).length) return;
    if (essai > 100) for (const p of pieces) if (!p.sp) p.t = e.races[dogEntier(e, e.races.length)];
  }
}
// bouquet final (comme Candy Crush) : les bonus restants partent, puis chaque coup restant devient un bandana
function dogBouquet(e, ev) {
  for (let garde = 0; garde < 30; garde++) {
    const i = e.g.findIndex(p => dogEstChien(p) && p.sp);
    if (i < 0) break;
    ev.push({ k: 'bonus', i, sp: e.g[i].sp });
    dogResoudre(e, ev, { cles: [i], crees: [] });
  }
  while (e.coups > 0) {
    const l = [];
    for (let i = 0; i < DOG_N; i++) { const p = e.g[i]; if (dogEstChien(p) && !p.sp && !p.ls) l.push(i); }
    e.coups--; e.bonus++;
    if (!l.length) continue;
    const i = l[dogEntier(e, l.length)];
    e.g[i].sp = dogAlea(e) < 0.5 ? 1 : 2;
    ev.push({ k: 'bonus', i, sp: e.g[i].sp });
    dogResoudre(e, ev, { cles: [i], crees: [] });
  }
}

/* ---------- objectifs, étoiles ---------- */
function dogBoueRestante(e) { let n = 0; for (let i = 0; i < DOG_N; i++) n += e.boue[i]; return n; }
function dogObjectifsFaits(e) {
  if (!e.obj.length) return false;
  return e.obj.every(o =>
    o.k === 'calins' ? e.calins[o.t] >= o.n :
    o.k === 'boue' ? dogBoueRestante(e) === 0 :
    o.k === 'chiots' ? e.chiotsSauves >= o.n : false);
}
// avancement de chaque objectif, pour l'affichage : [{ k, t, fait, total }]
function dogAvancement(e) {
  return e.obj.map(o => {
    if (o.k === 'calins') return { k: o.k, t: o.t, fait: Math.min(o.n, e.calins[o.t]), total: o.n };
    if (o.k === 'chiots') return { k: o.k, fait: e.chiotsSauves, total: o.n };
    const reste = dogBoueRestante(e);
    return { k: o.k, fait: e.boueDepart - reste, total: e.boueDepart, reste };
  });
}
const dogCalinsTotal = e => e.calins.reduce((a, b) => a + b, 0);
function dogEtoiles(niv, e) {
  if (e.fin !== 'gagne') return 0;
  const [deux, trois] = niv.etoiles || [Infinity, Infinity];
  return e.score >= trois ? 3 : e.score >= deux ? 2 : 1;
}

/* ---------- la journée du jour ---------- */
// même grille pour tout le monde : on fait le plus de câlins possible en 20 coups
const DOG_FORMES_JOUR = [
  ['........', '........', '........', '........', '........', '........', '........', '........'],
  [' ...... ', '........', '........', '........', '........', '........', '........', ' ...... '],
  ['..    ..', '...  ...', '........', '........', '........', '........', '...  ...', '..    ..'],
  ['   ..   ', '  ....  ', ' ...... ', '........', '........', ' ...... ', '  ....  ', '   ..   '],
  [' ..  .. ', '........', '........', '........', '........', ' ...... ', '  ....  ', '   ..   '],
  ['........', '........', '..g..g..', '........', '........', '..g..g..', '........', '........'],
];
function dogJour(aaaammjj) {
  const e = { rng: dogGraine('jour|' + aaaammjj) };
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  for (let k = pool.length - 1; k > 0; k--) { const j = dogEntier(e, k + 1); [pool[k], pool[j]] = [pool[j], pool[k]]; }
  return { id: 'jour-' + aaaammjj, coups: 20, races: pool.slice(0, 6).sort((a, b) => a - b), plan: DOG_FORMES_JOUR[dogEntier(e, DOG_FORMES_JOUR.length)], obj: [] };
}
function dogNouvelleJour(aaaammjj) { return dogNouvelle(dogJour(aaaammjj), aaaammjj, 'jour'); }

/* ---------- copie (pour le simulateur et l'indice) ---------- */
function dogCopie(e) {
  const c = JSON.parse(JSON.stringify(e));
  return c;
}

if (typeof module !== 'undefined') module.exports = { DOG_RACES, dogNouvelle, dogCoup, dogCoupsPossibles, dogJour, dogNouvelleJour, dogEtoiles, dogCopie };

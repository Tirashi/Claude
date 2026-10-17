/* =====================================================================
   ODYSSÉE : règles, physique et plateaux (logique pure, sans affichage ;
   utilisable sous Node pour les tests : outils/odyssee.js).
   - Un plateau est une petite carte en texte encadrée par son bord :
       +-+-+-+      lignes impaires : les cases, séparées par ' ' ou '|' (muret vertical)
       |D . .|      lignes paires   : sous chaque case ' ' ou '-' (muret horizontal) ;
       |-+-  |                        (un '+' sur une case compte aussi : les coins ne servent qu'à la lecture)
       |. X I|
       +-+-+-+
     Cases : '.' mer, D départ, I arrivée (le port), X récif, L lotus (eau collante),
     P phare (point de reprise), > < ^ v vent qui pousse dans ce sens.
   - Coordonnées : x vers la droite, y vers le bas (vers le joueur), en cases ;
     la case (x, y) va de x à x + 1. Les murets sont sur les lignes de la grille.
   - Chaque plateau a aussi ses réglages : chemin du pilote automatique
     (points de passage), temps cible (3 étoiles), dangers propres à l'épisode.
   ===================================================================== */
const ODY = (function () {
  'use strict';
  const PHYS = {
    R: 0.28,          // rayon du bateau
    EP: 0.25,         // épaisseur des murets
    G: 22,            // accélération = pente × G
    FROT: 1.4,        // frottement de l'eau, par seconde
    FROT_LOTUS: 6,    // dans les lotus
    REBOND: 0.4,
    PENTE_MAX: 0.2,   // radians
    LISSAGE: 10,      // le plateau suit la pente demandée en ~0,1 s
    SOUS_PAS: 4, DT_MAX: 0.05,
    RECIF: 0.34,      // naufrage quand le centre du bateau passe si près d'un récif
    ARRIVEE: 0.45, PHARE: 0.55,
    SOMBRE: 0.8,      // durée du naufrage avant de repartir
    GRACE: 0.8,       // après une reprise, les projectiles ne touchent pas
    VENT: 3.5,
  };
  const DIRS = { '>': [1, 0], 'v': [0, 1], '<': [-1, 0], '^': [0, -1] };

  // ---------- les épisodes ----------
  // lumiere : aube, jour, vent, orage (index.html en fait la couleur du ciel, de la mer et des lampes) ;
  // un plateau peut avoir sa propre lumière
  const EPISODES = [
    { n: 1, nom: 'Troie', chant: 'IX', lumiere: 'aube', decor: 'troie',
      recit: 'Troie est tombée. Ulysse et ses compagnons reprennent la mer, cap sur Ithaque…',
      aide: "Penche le téléphone pour guider la galère jusqu'au port. Gare aux récifs !",
      plateaux: [
        { nom: 'Le port de Troie', cible: 23, carte: `
          +-+-+-+-+-+-+-+-+
          |. D . . . . . .|
          |               |
          |. . . . . . . .|
          |               |
          |. . . . . . . .|
          |-+-+-+-+-+-    |
          |. . . . . . . .|
          |               |
          |. . . . . . . .|
          |    -+-+-+-+-+-|
          |. . . . . . . .|
          |               |
          |. . . . . . . .|
          |-+-+-+-+-+-    |
          |. . . . . . . .|
          |               |
          |. . . . . . I .|
          +-+-+-+-+-+-+-+-+` },
        { nom: 'Les remparts', cible: 37, carte: `
          +-+-+-+-+-+-+-+-+
          |D . . . X . . .|
          |               |
          |. . . . . . . .|
          |-+-+-+-+-+-    |
          |. . . . . . . .|
          |               |
          |. . . X . . . .|
          |    -+-+-+-+-+-|
          |. . . . . . . .|
          |               |
          |. . . X . . . .|
          |-+-+-+-+-+-    |
          |. . . . I|. . .|
          |         +     |
          |. X . . .|. X .|
          |         +     |
          |. . . . .|. . .|
          |         +     |
          |. . . X .|. . .|
          |         +     |
          |. . . . .|. X .|
          |               |
          |. . . . . . . .|
          +-+-+-+-+-+-+-+-+` },
        { nom: 'Pluie de flèches', cible: 33,
          fleches: { cadence: 1.3, alerte: 1.1, rayon: 0.5, ecart: 1.2 }, carte: `
          +-+-+-+-+-+-+-+-+
          |. . . . . . . D|
          |               |
          |. . . . X . . .|
          |    -+-+-+-+-+-|
          |. . . . . . . .|
          |               |
          |. . X . . . . .|
          |               |
          |. . . . . . X .|
          |-+-+-+-+-+-    |
          |. . . . . . . .|
          |               |
          |. . . X . . . .|
          |               |
          |. . . . . . . .|
          |    -+-+-+-+-+-|
          |. . . . . . . .|
          |               |
          |. . . . . X . .|
          |               |
          |. . X . . . . .|
          |               |
          |. . . . . . I .|
          +-+-+-+-+-+-+-+-+` },
      ] },
    { n: 2, nom: 'Les Lotophages', chant: 'IX', lumiere: 'jour', decor: 'lotophages',
      recit: 'Neuf jours de tempête nous jetèrent chez les mangeurs de lotus…',
      aide: 'Les lotus collent à la coque : le bateau y avance au ralenti.',
      plateaux: [
        { nom: 'Les lotus', cible: 32, carte: `
          +-+-+-+-+-+-+-+-+
          |D . . . . . . .|
          |               |
          |. . . . . . . .|
          |-+-+-+-+-+-    |
          |. . . . . . L L|
          |               |
          |L L . . . . L L|
          |    -+-+-+-+-+-|
          |L L . . . . . .|
          |               |
          |L L L . . . . .|
          |               |
          |. . L L . . . .|
          |               |
          |. . . L L . . .|
          |-+-+-+-+-+-    |
          |. . . . . . L L|
          |               |
          |. . . . . . L L|
          |               |
          |. X . . . . . .|
          |               |
          |. I . . . . . .|
          +-+-+-+-+-+-+-+-+` },
        { nom: 'Le marais fleuri', cible: 26, carte: `
          +-+-+-+-+-+-+-+-+
          |. . . D . . . .|
          |               |
          |. . . . . . . .|
          |  -+-+-+-+-+   |
          |. . L L L L . .|
          |               |
          |. X L L L L X .|
          |               |
          |. . L L L L . .|
          |               |
          |. . L L L L . .|
          |  -+-+-+-+-+   |
          |. . . . . . . .|
          |               |
          |. . X . . X . .|
          |               |
          |. . . . . . . .|
          |-+-+-+   -+-+-+|
          |L L L . . L L L|
          |               |
          |L L . . . . L L|
          |               |
          |. . . . . . . .|
          |  -+-+-+-+-+   |
          |. . . I . . . .|
          +-+-+-+-+-+-+-+-+` },
        { nom: 'Le doux oubli', cible: 26, carte: `
          +-+-+-+-+-+-+-+-+-+
          |. . . . . . . . D|
          |                 |
          |. . X . . L L . .|
          |                 |
          |. . . . L L L . .|
          |-+-+-+-+-+-+     |
          |. . . . . . L . .|
          |      |          |
          |. X . . L . . X .|
          |      |          |
          |. . . . L . . . .|
          |    -+-+-+-+-+-+-|
          |. . . . . . . . .|
          |               | |
          |L L L . X . . .|.|
          |               | |
          |. . L L . . . .|.|
          |               | |
          |. . . L L . X .|.|
          |-+-+-+-+-+-    | |
          |. . . . . . . .|.|
          |               | |
          |. X . . . L L . .|
          |                 |
          |. . . . L L . . I|
          +-+-+-+-+-+-+-+-+-+` },
      ] },
    { n: 3, nom: 'Polyphème', chant: 'IX', lumiere: 'jour', decor: 'cyclope',
      recit: 'Le vent nous mena chez les Cyclopes. Polyphème, fou de rage, nous jette des rochers !',
      aide: "Une ombre grossit sur l'eau : c'est là que tombe le rocher. Change de cap !",
      plateaux: [
        { nom: 'La grotte', cible: 16,
          rochers: { attente: 2.4, vol: 1.4, rayon: 0.55, avance: 0.6 }, carte: `
          +-+-+-+-+-+-+-+-+
          |. . . . . . . .|
          |               |
          |. . . . . . . .|
          |               |
          |. . . D . . . .|
          |               |
          |. . . . . . . .|
          |    -+-+-+-+   |
          |. . . . . . . .|
          |               |
          |. X . . . . X .|
          |               |
          |. . . . . . . .|
          |               |
          |. . . . . . . .|
          |    -+-+-+-+   |
          |. . . . . . . .|
          |               |
          |. . . X X . . .|
          |               |
          |. . . . . . . .|
          |               |
          |. . . I . . . .|
          +-+-+-+-+-+-+-+-+` },
        { nom: 'Personne !', cible: 23,
          rochers: { attente: 1.8, vol: 1.3, rayon: 0.6, avance: 0.9 }, carte: `
          +-+-+-+-+-+-+-+-+
          |. . . . . . . .|
          |               |
          |. . X . . D . .|
          |               |
          |. . . . . . . .|
          |-+-+-+-+-+     |
          |. . . . . . . .|
          |               |
          |. . . . X . . .|
          |               |
          |. X . . . . . .|
          |     -+-+-+-+-+|
          |. . . . . . . .|
          |               |
          |. . . X . . X .|
          |               |
          |. . . . . . . .|
          |-+-+-+-+-+     |
          |. . . . . . . .|
          |               |
          |. . X . . . . .|
          |               |
          |. . . . . . I .|
          +-+-+-+-+-+-+-+-+` },
        { nom: 'La colère du Cyclope', cible: 50,
          rochers: { attente: 1.6, vol: 1.3, rayon: 0.6, avance: 1.1 }, carte: `
          +-+-+-+-+-+-+-+-+
          |D . . . X . . .|
          |               |
          |. . . . . . . .|
          |-+-+-+-+-+-    |
          |. . . . . . . .|
          |               |
          |. X . . . X . .|
          |    -+-+-+-+-+-|
          |. . . . . . . .|
          |               |
          |. . . X . . . .|
          |-+-+-+-+-+-    |
          |. . . . . . . .|
          |               |
          |. . . . X . . .|
          |    -+-+-+-+-+-|
          |. . . . . . . .|
          |               |
          |. . X . . . X .|
          |-+-+-+-+-+-    |
          |. . . . . . . .|
          |               |
          |. . . . . X . .|
          |               |
          |. . X . . . I .|
          +-+-+-+-+-+-+-+-+` },
      ] },
    { n: 4, nom: 'Éole', chant: 'X', lumiere: 'vent', decor: 'eole',
      recit: 'Éole, maître des vents, nous offrit une outre où dormaient les tempêtes…',
      aide: "Le vent pousse la galère. Les phares gardent ta place si tu fais naufrage.",
      plateaux: [
        { nom: 'Brise légère', cible: 31, vent: 3, carte: `
          +-+-+-+-+-+-+-+-+
          |D . . . . . . .|
          |               |
          |. > > > > > > .|
          |               |
          |. . . . . . . v|
          |-+-+-+-+-+-    |
          |. . . . . . . .|
          |               |
          |. < < < < < < .|
          |    -+-+-+-+-+-|
          |. . . . . . . .|
          |               |
          |v X . . X . . .|
          |               |
          |v . . X . . . .|
          |-+-+-+-+-+-    |
          |> > > > > > > .|
          |               |
          |. . . . . . . .|
          |               |
          |. X . . . X . .|
          |               |
          |I < < < < < < <|
          +-+-+-+-+-+-+-+-+` },
        { nom: 'Les couloirs du vent', cible: 24, vent: 3.5, carte: `
          +-+-+-+-+-+-+-+-+
          |. . . D . . . .|
          |               |
          |. . . . . . . .|
          |               |
          |^ ^ ^ ^ ^ ^ ^ ^|
          |               |
          |X . . X . . X .|
          |-+-+-+   -+-+-+|
          |. . . . P . . .|
          |               |
          |> > > . . . . .|
          |               |
          |. . . . . X . .|
          |    -+-+-+-+-+-|
          |. . . . . . . .|
          |               |
          |. . X < < < < <|
          |               |
          |. . . . . . . .|
          |-+-+-+-+-+-    |
          |. . v v . . . .|
          |               |
          |. . v v . X . .|
          |               |
          |X . . . . . I .|
          +-+-+-+-+-+-+-+-+` },
        { nom: "L'outre s'ouvre", cible: 42, vent: 3, outre: 5, lumiere: 'orage', carte: `
          +-+-+-+-+-+-+-+-+-+
          |D . . . . . . . .|
          |                 |
          |. . > > > > . . .|
          |                 |
          |. . . . . . X . .|
          |-+-+-+-+-+-+-    |
          |. . . . . . . . .|
          |                 |
          |. v . X . . v . .|
          |                 |
          |. v . . P . v . .|
          |    -+-+-+-+-+-+-|
          |. . . . . . . . .|
          |                 |
          |. . < < < < . . .|
          |                 |
          |. . . . X . . . .|
          |-+-+-+-+-+-+-    |
          |. . . . . . P . .|
          |                 |
          |. X . > > . . X .|
          |                 |
          |. . . . . . . . .|
          |    -+-+-+-+-+-+-|
          |. . . . . . . . .|
          |                 |
          |. . X . . . X . .|
          |                 |
          |. . . . I . . . .|
          +-+-+-+-+-+-+-+-+-+` },
      ] },
  ];
  // identifiant « épisode-plateau » ("3-2") et carte analysée de chaque plateau
  const PLATEAUX = [];
  for (const E of EPISODES) E.plateaux.forEach((P, i) => { P.id = E.n + '-' + (i + 1); P.ep = E; P.i = i; P.map = lire(P.carte); PLATEAUX.push(P); });
  const plateau = id => PLATEAUX.find(P => P.id === id) || null;

  // ---------- lecture d'une carte ----------
  function lire(txt) {
    const L = txt.split('\n').map(s => s.trim()).filter(Boolean);
    const W = (L[0].length - 1) / 2, H = (L.length - 1) / 2;
    const M = { W, H, depart: null, arrivee: null, recifs: [], phares: [], cases: [], murs: [], boites: [], erreurs: [] };
    if (L.some(l => l.length !== L[0].length)) M.erreurs.push('lignes de longueurs différentes');
    if (W !== Math.floor(W) || H !== Math.floor(H)) M.erreurs.push('dimensions impaires attendues');
    const ch = (r, c) => (L[r] || '')[c] || ' ';
    for (let y = 0; y < H; y++) {
      const row = [];
      for (let x = 0; x < W; x++) {
        const k = ch(2 * y + 1, 2 * x + 1), cx = x + 0.5, cy = y + 0.5;
        row.push(k);
        if (k === 'D') M.depart = [cx, cy];
        else if (k === 'I') M.arrivee = [cx, cy];
        else if (k === 'X') M.recifs.push([cx, cy]);
        else if (k === 'P') M.phares.push([cx, cy]);
        else if (!'.L><v^'.includes(k)) M.erreurs.push(`case inconnue « ${k} » en ${x},${y}`);
      }
      M.cases.push(row);
    }
    if (!M.depart) M.erreurs.push('pas de départ D');
    if (!M.arrivee) M.erreurs.push("pas d'arrivée I");
    // murets : segments d'une case, fusionnés en lignes droites
    const run = (n, wall, add) => { let s = -1; for (let i = 0; i <= n; i++) { if (i < n && wall(i)) { if (s < 0) s = i; } else if (s >= 0) { add(s, i); s = -1; } } };
    for (let y = 1; y < H; y++) run(W, x => '-+'.includes(ch(2 * y, 2 * x + 1)), (a, b) => M.murs.push([a, y, b, y]));
    for (let x = 1; x < W; x++) run(H, y => ch(2 * y + 1, 2 * x) === '|', (a, b) => M.murs.push([x, a, x, b]));
    const e = PHYS.EP / 2;
    M.boites = M.murs.map(([x1, y1, x2, y2]) => [x1 - e, y1 - e, x2 + e, y2 + e]);
    return M;
  }
  const caseEn = (M, x, y) => (M.cases[Math.floor(y)] || [])[Math.floor(x)] || '.';

  // ---------- hasard à graine ----------
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  // ---------- une traversée ----------
  function nouvelle(P, seed) {
    const M = P.map;
    return {
      P, M, rnd: rng(seed == null ? 1 : seed),
      x: M.depart[0], y: M.depart[1], vx: 0, vy: 0,
      tx: 0, ty: 0,                 // pente réelle du plateau (lissée)
      t: 0, naufrages: 0, fini: false,
      sombre: 0, grace: 0, cause: '',
      reprise: M.depart.slice(), wp: 0, wpReprise: 0, phares: M.phares.map(() => false),
      fleches: [], flT: 1.2,
      tir: null, rocAtt: P.rochers ? P.rochers.attente : 0,
      ventRot: 0, outreT: 0,
      etat: 'jeu',
    };
  }
  const borne = v => Math.max(-PHYS.PENTE_MAX, Math.min(PHYS.PENTE_MAX, v));
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  // vent sous le bateau (déjà tourné si l'outre est ouverte)
  function vent(st, x, y) {
    const d = DIRS[caseEn(st.M, x, y)];
    if (!d) return [0, 0];
    let [dx, dy] = d;
    for (let k = 0; k < st.ventRot; k++) [dx, dy] = [-dy, dx];
    const f = st.P.vent || PHYS.VENT;
    return [dx * f, dy * f];
  }
  const dirVent = (st, k) => { let [dx, dy] = DIRS[k]; for (let i = 0; i < st.ventRot; i++) [dx, dy] = [-dy, dx]; return [dx, dy]; };

  function naufrage(st, cause, ev) {
    if (st.sombre > 0 || st.fini) return;
    st.sombre = 0.001; st.vx = st.vy = 0; st.naufrages++; st.cause = cause;
    ev.push({ k: 'naufrage', cause, x: st.x, y: st.y });
  }

  // un sous-pas de mouvement de o = { x, y, vx, vy, tx, ty } (st donne le plateau et le vent) ;
  // renvoie la force du choc contre un muret (0 sinon)
  function bouger(st, o, h) {
    const M = st.M, R = PHYS.R, e = PHYS.REBOND; let choc = 0;
    const [fx, fy] = vent(st, o.x, o.y);
    o.vx += (o.tx * PHYS.G + fx) * h; o.vy += (o.ty * PHYS.G + fy) * h;
    const fr = Math.max(0, 1 - (caseEn(M, o.x, o.y) === 'L' ? PHYS.FROT_LOTUS : PHYS.FROT) * h);
    o.vx *= fr; o.vy *= fr;
    o.x += o.vx * h; o.y += o.vy * h;
    if (o.x < R) { o.x = R; if (o.vx < 0) o.vx *= -e; }
    if (o.x > M.W - R) { o.x = M.W - R; if (o.vx > 0) o.vx *= -e; }
    if (o.y < R) { o.y = R; if (o.vy < 0) o.vy *= -e; }
    if (o.y > M.H - R) { o.y = M.H - R; if (o.vy > 0) o.vy *= -e; }
    for (const [a, b, c, d] of M.boites) {
      const qx = cl(o.x, a, c), qy = cl(o.y, b, d);
      let nx = o.x - qx, ny = o.y - qy; const dd = Math.hypot(nx, ny);
      if (dd < R && dd > 1e-6) {
        nx /= dd; ny /= dd; o.x = qx + nx * R; o.y = qy + ny * R;
        const vn = o.vx * nx + o.vy * ny;
        if (vn < 0) { o.vx -= (1 + e) * vn * nx; o.vy -= (1 + e) * vn * ny; choc = Math.max(choc, -vn); }
      } else if (dd <= 1e-6) {       // centre entré dans la boîte : on le ressort par le côté le plus proche
        const q = [[o.x - a, -1, 0], [c - o.x, 1, 0], [o.y - b, 0, -1], [d - o.y, 0, 1]].sort((u, v) => u[0] - v[0])[0];
        o.x += q[1] * (q[0] + R); o.y += q[2] * (q[0] + R);
      }
    }
    return choc;
  }

  // un pas de simulation : tilt = pente demandée [x, y] (radians) ; renvoie les événements
  function pas(st, tilt, dt) {
    const ev = [], M = st.M, P = st.P;
    dt = Math.min(PHYS.DT_MAX, dt);
    const lis = Math.min(1, dt * PHYS.LISSAGE);
    st.tx += (borne(tilt[0]) - st.tx) * lis; st.ty += (borne(tilt[1]) - st.ty) * lis;
    if (st.fini) return ev;
    st.t += dt;
    if (st.grace > 0) st.grace -= dt;
    // l'outre d'Éole : tous les vents tournent d'un quart de tour à chaque période
    if (P.outre) {
      st.outreT += dt;
      if (st.outreT >= P.outre) { st.outreT -= P.outre; st.ventRot = (st.ventRot + 1) % 4; ev.push({ k: 'outre' }); }
    }
    if (st.sombre > 0) {
      st.sombre += dt;
      if (st.sombre > PHYS.SOMBRE) {
        st.sombre = 0; [st.x, st.y] = st.reprise; st.vx = st.vy = 0; st.wp = st.wpReprise; st.grace = PHYS.GRACE;
        // on repart au calme : plus de projectile en vol, le prochain attend
        st.fleches = []; st.flT = P.fleches ? P.fleches.cadence : 0; st.tir = null; st.rocAtt = P.rochers ? P.rochers.attente : 0;
        ev.push({ k: 'reprise' });
      }
    } else {
      const n = PHYS.SOUS_PAS, h = dt / n;
      for (let s = 0; s < n; s++) { const c = bouger(st, st, h); if (c > 1.2) ev.push({ k: 'choc', f: c }); }
      for (const [rx, ry] of M.recifs) if (Math.hypot(st.x - rx, st.y - ry) < PHYS.RECIF) { naufrage(st, 'recif', ev); break; }
      if (st.sombre === 0) {
        M.phares.forEach(([px, py], i) => {
          if (!st.phares[i] && Math.hypot(st.x - px, st.y - py) < PHYS.PHARE) {
            st.phares[i] = true; st.reprise = [px, py]; st.wpReprise = st.wp; ev.push({ k: 'phare', i });
          }
        });
        if (Math.hypot(st.x - M.arrivee[0], st.y - M.arrivee[1]) < PHYS.ARRIVEE) {
          st.fini = true; st.vx = st.vy = 0; st.etat = 'fini'; ev.push({ k: 'arrivee', t: st.t, naufrages: st.naufrages });
          return ev;
        }
      }
    }
    // flèches enflammées : une ombre au sol, puis l'impact
    if (P.fleches) {
      const F = P.fleches;
      if (st.sombre === 0) st.flT -= dt;
      if (st.flT <= 0) {
        st.flT = F.cadence * (0.7 + 0.6 * st.rnd());
        const x = cl(st.x + st.vx * F.alerte * 0.5 + (st.rnd() * 2 - 1) * F.ecart, 0.4, M.W - 0.4);
        const y = cl(st.y + st.vy * F.alerte * 0.5 + (st.rnd() * 2 - 1) * F.ecart, 0.4, M.H - 0.4);
        st.fleches.push({ x, y, t: 0, dur: F.alerte, r: F.rayon });
      }
      for (const f of st.fleches) {
        f.t += dt;
        if (f.t >= f.dur && !f.fait) {
          f.fait = true; ev.push({ k: 'impact', x: f.x, y: f.y, quoi: 'fleche' });
          if (st.grace <= 0 && Math.hypot(st.x - f.x, st.y - f.y) < f.r) naufrage(st, 'fleche', ev);
        }
      }
      st.fleches = st.fleches.filter(f => f.t < f.dur + 0.6);
    }
    // Polyphème lance un rocher là où va le bateau
    if (P.rochers) {
      const C = P.rochers;
      if (!st.tir) {
        st.rocAtt -= dt;
        if (st.rocAtt <= 0 && st.sombre === 0) {
          st.tir = { x: cl(st.x + st.vx * C.avance + (st.rnd() - 0.5) * 0.4, 0.5, M.W - 0.5), y: cl(st.y + st.vy * C.avance + (st.rnd() - 0.5) * 0.4, 0.5, M.H - 0.5), t: 0, dur: C.vol, r: C.rayon };
          ev.push({ k: 'lancer' });
        }
      } else {
        const T = st.tir; T.t += dt;
        if (T.t >= T.dur) {
          st.tir = null; st.rocAtt = C.attente; ev.push({ k: 'impact', x: T.x, y: T.y, quoi: 'rocher' });
          if (st.grace <= 0 && Math.hypot(st.x - T.x, st.y - T.y) < T.r) naufrage(st, 'rocher', ev);
        }
      }
    }
    return ev;
  }

  // ---------- pilote automatique (démo de l'écran titre et tests) ----------
  // itinéraire calculé : plus court chemin sur une grille fine (pas de 0,25), loin des murets et des
  // récifs, plus cher dans les lotus et contre le vent ; puis simplifié en lignes droites
  const MARGE = PHYS.R + PHYS.EP / 2 + 0.06;
  const libre = (M, x, y, m) => x > PHYS.R && y > PHYS.R && x < M.W - PHYS.R && y < M.H - PHYS.R &&
    M.boites.every(([a, b, c, d]) => Math.hypot(x - cl(x, a, c), y - cl(y, b, d)) > m - PHYS.EP / 2) &&
    M.recifs.every(([rx, ry]) => Math.hypot(x - rx, y - ry) > PHYS.RECIF + 0.42);
  // ligne droite de a à b sans obstacle (m : marge), et sur le même terrain si memeSol
  function enVue(M, a, b, m, memeSol) {
    const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 8), k0 = caseEn(M, ...a);
    for (let k = 1; k < n; k++) {
      const x = a[0] + (b[0] - a[0]) * k / n, y = a[1] + (b[1] - a[1]) * k / n;
      if (!libre(M, x, y, m)) return false;
      if (memeSol && caseEn(M, x, y) !== k0 && (caseEn(M, x, y) !== '.' || k0 !== '.')) return false;
    }
    return true;
  }
  function itineraire(P) {
    if (P._iti !== undefined) return P._iti;
    const M = P.map, S = 4, GW = M.W * S, GH = M.H * S, pt = (i, j) => [(i + 0.5) / S, (j + 0.5) / S];
    const ok = new Uint8Array(GW * GH);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) ok[j * GW + i] = libre(M, ...pt(i, j), MARGE) ? 1 : 0;
    const cout = (x, y, dx, dy) => {
      const k = caseEn(M, x, y); let c = k === 'L' ? 5 : 1;
      const d = DIRS[k]; if (d) c *= 1 - 0.6 * (d[0] * dx + d[1] * dy) / Math.hypot(dx, dy);
      return c;
    };
    const idx = ([x, y]) => Math.min(GH - 1, Math.floor(y * S)) * GW + Math.min(GW - 1, Math.floor(x * S));
    const dep = idx(M.depart), arr = idx(M.arrivee), dist = new Float64Array(GW * GH).fill(Infinity), prev = new Int32Array(GW * GH).fill(-1);
    ok[dep] = ok[arr] = 1; dist[dep] = 0;
    const tas = [[0, dep]];       // file de priorité simple (tas binaire)
    const push = e => { tas.push(e); let i = tas.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (tas[p][0] <= tas[i][0]) break; [tas[p], tas[i]] = [tas[i], tas[p]]; i = p; } };
    const pop = () => { const top = tas[0], last = tas.pop(); if (tas.length) { tas[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < tas.length && tas[l][0] < tas[m][0]) m = l; if (r < tas.length && tas[r][0] < tas[m][0]) m = r; if (m === i) break; [tas[m], tas[i]] = [tas[i], tas[m]]; i = m; } } return top; };
    while (tas.length) {
      const [d0, u] = pop(); if (d0 > dist[u]) continue; if (u === arr) break;
      const ui = u % GW, uj = (u - ui) / GW;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const vi = ui + di, vj = uj + dj; if (vi < 0 || vj < 0 || vi >= GW || vj >= GH) continue;
        const v = vj * GW + vi; if (!ok[v] || (di && dj && (!ok[uj * GW + vi] || !ok[vj * GW + ui]))) continue;
        const [x, y] = pt(ui, uj), nd = d0 + Math.hypot(di, dj) * cout(x, y, di, dj);
        if (nd < dist[v]) { dist[v] = nd; prev[v] = u; push([nd, v]); }
      }
    }
    if (prev[arr] < 0) return (P._iti = null);
    const pts = []; for (let u = arr; u >= 0; u = prev[u]) pts.unshift(pt(u % GW, (u - u % GW) / GW));
    // simplification : on saute aux points visibles en ligne droite (même terrain tout du long)
    const vue = (a, b) => enVue(M, a, b, MARGE + 0.04, true);
    const W = []; let a = 0;
    while (a < pts.length - 1) { let b = Math.min(pts.length - 1, a + 1); for (let c = pts.length - 1; c > b; c--) if (vue(pts[a], pts[c])) { b = c; break; } W.push(pts[b]); a = b; }
    W[W.length - 1] = M.arrivee.slice();
    return (P._iti = W);
  }
  function chemin(st) { return st.P.chemin || itineraire(st.P) || [st.M.arrivee]; }
  const M_recif = (M, o) => M.recifs.some(([rx, ry]) => Math.hypot(o.x - rx, o.y - ry) < PHYS.RECIF + 0.1);
  function pilote(st) {
    if (st.sombre > 0 || st.fini) return [0, 0];
    const C = chemin(st);
    let [cx, cy] = C[Math.min(st.wp, C.length - 1)];
    // point suivant : quand on est dessus, ou tout près et que le suivant est en vue
    const d = Math.hypot(cx - st.x, cy - st.y);
    if (st.wp < C.length - 1 && (d < 0.2 || d < 0.7 && enVue(st.M, [st.x, st.y], C[st.wp + 1], PHYS.R + PHYS.EP / 2 + 0.02))) { st.wp++; [cx, cy] = C[st.wp]; }
    let ax = (cx - st.x) * 6.6 - st.vx * 4.8, ay = (cy - st.y) * 6.6 - st.vy * 4.8;
    // esquive : si un projectile va tomber là où sera le bateau, on essaie quelques caps
    // (le prévu et 16 directions à pleine ou demi-pente) et on garde le plus proche du prévu qui met hors de portée
    const dangers = st.fleches.filter(f => !f.fait).concat(st.tir ? [st.tir] : []).filter(d => d.dur - d.t < 1.2);
    if (dangers.length) {
      const A = PHYS.PENTE_MAX * PHYS.G, n0 = Math.hypot(ax, ay) || 1;
      const caps = [[ax, ay], [ax / n0 * A, ay / n0 * A]];
      for (let k = 0; k < 16; k++) for (const f of [1, 0.5]) caps.push([Math.cos(k * Math.PI / 8) * A * f, Math.sin(k * Math.PI / 8) * A * f]);
      caps.push([0, 0]);
      const note = c => {
        const T = [borne(c[0] / PHYS.G), borne(c[1] / PHYS.G)], o = { x: st.x, y: st.y, vx: st.vx, vy: st.vy, tx: st.tx, ty: st.ty };
        let pire = Infinity, t = 0; const h = 1 / 30;
        for (const d of dangers.slice().sort((u, v) => (u.dur - u.t) - (v.dur - v.t))) {
          for (; t < d.dur - d.t; t += h) { o.tx += (T[0] - o.tx) * Math.min(1, h * PHYS.LISSAGE); o.ty += (T[1] - o.ty) * Math.min(1, h * PHYS.LISSAGE); bouger(st, o, h); if (M_recif(st.M, o)) return -1; }
          pire = Math.min(pire, Math.hypot(o.x - d.x, o.y - d.y) - d.r - 0.2);
        }
        return pire;
      };
      if (note(caps[0]) < 0) {
        let best = null, bs = -Infinity;
        for (const c of caps) { const v = note(c), sc = (v >= 0 ? 10 : v) + (c[0] * ax + c[1] * ay) / (A * n0) * 0.5; if (sc > bs) { bs = sc; best = c; } }
        [ax, ay] = best;
      }
    }
    const [fx, fy] = vent(st, st.x, st.y);
    return [borne((ax - fx) / PHYS.G), borne((ay - fy) / PHYS.G)];
  }
  // traversée complète par le pilote (tests) : { fini, t, naufrages }
  function simuler(P, seed, tMax) {
    const st = nouvelle(P, seed), dt = 1 / 60;
    while (!st.fini && st.t < (tMax || 120)) pas(st, pilote(st), dt);
    return { fini: st.fini, t: st.t, naufrages: st.naufrages, st };
  }

  // étoiles : ★ arriver, ★★ sans naufrage, ★★★ sans naufrage et sous le temps cible
  const etoiles = (P, t, naufrages) => naufrages > 0 ? 1 : t <= P.cible ? 3 : 2;

  return { PHYS, DIRS, EPISODES, PLATEAUX, plateau, lire, caseEn, rng, nouvelle, pas, pilote, chemin, itineraire, simuler, etoiles, vent, dirVent };
})();
if (typeof module !== 'undefined') module.exports = ODY;

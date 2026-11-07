/* Bastion : les règles, sans dessin. Partagées par le jeu (jeu.js) et le simulateur (node outils/bastion-simulateur.js).
   Laboratoire : tous les nombres sont dans DEFAUT et se règlent dans le panneau LABO (copie modifiée = « réglages »).
   Une partie : B.creer(reglages, graine) → S ; B.pas(S, dt) fait avancer le temps (dt ≤ 0,05 s) ;
   les ordres du joueur (ouvrier, metier, recruter, construire, envoyer) renvoient un texte d'erreur ou null ;
   S.evts reçoit les messages à afficher ({txt, bon}) ; B.robot(S, dt) joue tout seul (simulateur, bouton ROBOT du labo). */
(function(){
"use strict";

/* ---------- les réglages d'origine ---------- */
const DEFAUT = {
  eco: {bois: 50, or: 40, viande: 30, ouvriers: 3, rapport: 7, vitesse: 1.3, tBois: 2.2, tOr: 2.6, tViande: 2.0, ouvrier: 10, batir: 1},
  pop: {escouades: 3, ouvriers: 4, maisonEsc: 1, maisonOuv: 2},
  chateau: {pv: 800, bois: 60, or: 60, pvNiveau: .3},
  lance: {n: 4, pv: 24, dps: 4, r: .95, v: 1.2, bois: 10, or: 10, viande: 0, troll: 2.5},
  guer:  {n: 4, pv: 34, dps: 5.5, r: .75, v: 1.3, bois: 0, or: 20, viande: 10},
  arc:   {n: 4, pv: 15, dps: 3, r: 2.6, v: 1.3, bois: 15, or: 10, viande: 0},
  moine: {n: 2, pv: 15, soin: 5, r: 1.7, rGrade: .3, v: 1.2, bois: 0, or: 20, viande: 0},
  cav:   {n: 4, pv: 36, dps: 5, r: 1.0, v: 2.0, troll: 2.0, bois: 0, or: 25, viande: 15},
  epee:  {n: 4, pv: 46, dps: 7, r: .8, v: 1.3, bois: 0, or: 30, viande: 15},
  cata:  {n: 1, pv: 60, degats: 40, cadence: 3.5, zone: .9, r: 4.2, v: .45, bois: 40, or: 30, viande: 0},
  gob:    {pv: 30, dps: 6, r: .7, v: .55},
  lanceg: {pv: 40, dps: 7, r: .85, v: .5},
  gnoll:  {pv: 26, dps: 5, r: 2, v: .5},
  troll:  {pv: 300, dps: 24, r: .95, v: .33},
  maison:    {bois: 30, or: 0, travail: 10, pv: 150},
  caserne:   {bois: 40, or: 20, travail: 16, pv: 250},
  archerie:  {bois: 40, or: 0, travail: 14, pv: 200},
  monastere: {bois: 10, or: 40, travail: 16, pv: 200},
  atelier:   {bois: 50, or: 30, travail: 18, pv: 200},
  tour:      {bois: 30, or: 20, travail: 14, pv: 300, portee: 1.2, soigne: 1.5},
  tourbois:  {bois: 15, or: 0, travail: 7, pv: 110, portee: .7, soigne: .9},
  niveaux:   {cout: 1, travail: 1, max: 3},
  vagues: {premiere: 40, entre: 45, nombre: 10, base: 3, plus: 2, force: .12, troll: 4, deux: 5, alerte: 6},
  xp: {parPv: .1, survie: 4, veteran: 25, elite: 60, heros: 120, bonus: .2},
  renfort: {viande: 4, temps: 2},
  jeu: {ralenti: .35}
};
// noms des escouades, monstres, bâtiments (affichage)
const ESC = {lance: "LANCIERS", guer: "CHEVALIERS", arc: "ARCHERS", moine: "MOINES", cata: "CATAPULTE", cav: "CAVALIERS", epee: "EPEISTES"};
// promotions (caserne au niveau 2) : les lanciers deviennent des cavaliers, les chevaliers des épéistes ; le prix est celui de la nouvelle unité
const PROMO = {lance: "cav", guer: "epee"};
const RECRUTABLES = ["lance", "guer", "arc", "moine", "cata"];
const MONS = {gob: "GOBELINS", lanceg: "GOBELINS A LANCE", gnoll: "GNOLLS", troll: "TROLL"};
const BAT = {maison: "MAISON", caserne: "CASERNE", archerie: "ARCHERIE", monastere: "MONASTERE", atelier: "ATELIER", tour: "TOUR", tourbois: "TOUR EN BOIS"};
const FEMININ = {maison: 1, caserne: 1, archerie: 1, tour: 1, tourbois: 1, cata: 1};
// où se bâtit chaque bâtiment : les tours le long des chemins, le reste au village ; un seul exemplaire des bâtiments qui forment des unités
const TOURS = {tour: 1, tourbois: 1};
const UNIQUE = {caserne: 1, archerie: 1, monastere: 1, atelier: 1};
// les bâtiments qui s'améliorent (niveaux) : ceux qui forment des unités, et les maisons (plus de population)
const AMELIORABLE = {caserne: 1, archerie: 1, monastere: 1, atelier: 1, maison: 1};
// le bâtiment qui forme chaque unité (son niveau donne le grade des recrues)
const FORME = {lance: "chateau", guer: "caserne", arc: "archerie", moine: "monastere", cata: "atelier"};
// le bâtiment qui débloque chaque escouade (null = le château)
const DEBLOQUE = {lance: null, guer: "caserne", arc: "archerie", moine: "monastere", cata: "atelier"};
// qui peut monter dans une tour
const GARNISON = {arc: 1, moine: 1, cata: 1};
const GRADES = ["RECRUES", "VETERANS", "ELITE", "HEROS"];
const RES = ["bois", "or", "viande"];

/* ---------- la carte (11 × 14 cases) ----------
   F forêt, P chemin, w bois, g or, . herbe. Trois chemins sinueux mènent au château (en bas, au milieu) :
   le nord fait deux lacets, l'ouest rejoint le nord, l'est longe le côté droit. Bois, or et moutons derrière le château. */
const CARTE = ["FFFFFPFFFFF",
               "F....P....F",
               "F.PPPP....F",
               "F.P.....PPP",
               "PPP.....P.F",
               "F.P.....P.F",
               "F.PPPP..P.F",
               "F....P..P.F",
               "F....P..P.F",
               "F......PP.F",
               "F.........F",
               "F.........F",
               "F.........F",
               "Fww.....ggF",
               "Fww.....ggF",
               "FFFFFFFFFFF"];
const W = 11, H = 16;
const CHATEAU = [5.5, 9.6], DEPOT = [5.5, 10.6];
// chemins des monstres (points de passage, au milieu des cases), puis le château
const CHEMINS = {N: [[5.5, -0.6], [5.5, 2.5], [2.5, 2.5], [2.5, 6.5], [5.5, 6.5], [5.5, 8.6]],
                 O: [[-0.6, 4.5], [2.5, 4.5], [2.5, 6.5], [5.5, 6.5], [5.5, 8.6]],
                 E: [[11.6, 3.5], [8.5, 3.5], [8.5, 9.5], [7.2, 9.5]]};
const NOM_DIR = {N: "LE NORD", O: "L'OUEST", E: "L'EST"};
// emplacements de construction (pieds du bâtiment) : 8 le long des chemins, 2 près du château
// 0 à 7 : le long des chemins (tours seulement) ; 8 à 15 : le village, sous le château (les autres bâtiments)
const SITES = [[3.6, 1.6], [4.0, 4.9], [1.3, 3.5], [6.9, 4.8], [9.6, 6.2], [7.0, 1.8], [3.6, 8.4], [6.9, 8.0],
               [1.8, 11.0], [3.4, 11.1], [7.6, 11.1], [9.2, 11.0], [2.2, 12.7], [4.2, 12.8], [6.8, 12.8], [8.8, 12.7]];
const TYPE_SITE = SITES.map((_, i) => i < 8 ? "chemin" : "village");
const VILLAGE = [1, 10, 9, 3];   // le sol du village (cases) : x, y, largeur, hauteur
const ZONE_MOUTONS = [4.0, 13.4, 3.0, 1.2];   // x, y, largeur, hauteur

const d2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const copie = o => JSON.parse(JSON.stringify(o));
// réglages complets = DEFAUT modifié par les valeurs données (seuls les nombres connus sont pris)
function reglages(mods){
  const P = copie(DEFAUT);
  if (mods && typeof mods === "object") for (const g of Object.keys(P)) if (mods[g] && typeof mods[g] === "object")
    for (const k of Object.keys(P[g])) if (typeof mods[g][k] === "number" && isFinite(mods[g][k])) P[g][k] = mods[g][k];
  return P;
}
// différences avec DEFAUT (pour garder ou copier les réglages)
function ecarts(P){
  const o = {};
  for (const g of Object.keys(DEFAUT)) for (const k of Object.keys(DEFAUT[g])) if (P[g][k] !== DEFAUT[g][k]) (o[g] = o[g] || {})[k] = P[g][k];
  return o;
}

/* ---------- une partie ---------- */
function creer(mods, graine){
  const P = reglages(mods);
  let seed = (graine >>> 0) % 2147483646 + 1;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const S = {P, rnd, t: 0, res: {bois: P.eco.bois, or: P.eco.or, viande: P.eco.viande}, pv: P.chateau.pv, vague: 0, prochaine: P.vagues.premiere,
    alerte: null, dirs: [], pawns: [], esc: [], mons: [], fx: [], tirs: [], evts: [], fini: null, sel: null, nid: 1, enVague: false,
    triche: {invincible: false, tout: false},
    stats: {recolte: {bois: 0, or: 0, viande: 0}, tues: 0, pertes: 0, escouades: 0, batiments: 0, journal: []},
    arbres: [], filons: [], moutons: [], sites: SITES.map(([x, y], i) => ({i, x, y, type: TYPE_SITE[i], b: null, ruine: false})), niveauChateau: 1};
  // les ressources de la carte (même décor à chaque partie)
  let s2 = 3; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){ const ch = CARTE[y][x];
    if (ch === "w") for (const [ox, oy] of [[.3, .45], [.72, .7], [.35, .95]]) S.arbres.push({x: x + ox + (r2() - .5) * .1, y: y + oy, n: Math.floor(r2() * 2), ph: r2() * 8, coupe: 0});
    if (ch === "g") S.filons.push({x: x + .5 + (r2() - .5) * .3, y: y + .7, n: 3 + Math.floor(r2() * 3)}); }
  const [mx, my, mw, mh] = ZONE_MOUTONS;
  for (let k = 0; k < 4; k++) S.moutons.push({x: mx + .3 + k * .6, y: my + .3 + (k % 2) * .5, tx: 0, ty: 0, t: r2() * 5, face: 1});
  for (let k = 0; k < P.eco.ouvriers; k++) ajouterOuvrier(S, RES[k % 3], true);
  recruter(S, "lance", true);
  S.sel = null;
  dire(S, "DEFENDS LE CHATEAU", true);
  return S;
}
const dire = (S, txt, bon) => S.evts.push({txt, bon: !!bon});

/* ---------- les obstacles : le château et les bâtiments (on les contourne) ---------- */
function obstacles(S){
  const o = [{x: CHATEAU[0], y: CHATEAU[1] + .1, rx: 1.3, ry: .5}];
  for (const s of S.sites) if (s.b) o.push({x: s.x, y: s.y - .3, rx: TOURS[s.b.k] ? .62 : .52, ry: .34});
  return o;
}
const MARGE = .12;
// fait marcher e vers (tx, ty) en contournant les obstacles ; renvoie la distance restante
function marcher(S, e, tx, ty, v, dt, obs){
  const dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy);
  if (l < 1e-4) return 0;
  const s = Math.min(l, v * dt); let ux = dx / l, uy = dy / l, longe = false;
  for (const o of obs || obstacles(S)){
    const rx = o.rx + MARGE, ry = o.ry + MARGE;
    if (((tx - o.x) / rx) ** 2 + ((ty - o.y) / ry) ** 2 < 1) continue;    // le but est dans l'obstacle : on s'en approche
    const nx = (e.x + ux * s - o.x) / rx, ny = (e.y + uy * s - o.y) / ry;
    if (nx * nx + ny * ny < 1.15){
      // on longe le bord, du côté qui rapproche du but, et on garde ce côté tant qu'on longe (sinon on hésite devant l'obstacle)
      const gx = (e.x - o.x) / rx, gy = (e.y - o.y) / ry; let t1x = -gy * rx, t1y = gx * ry;
      if (!e.cote) e.cote = t1x * ux + t1y * uy < 0 ? -1 : 1;
      t1x *= e.cote; t1y *= e.cote; longe = true;
      const tl = Math.hypot(t1x, t1y) || 1; ux = t1x / tl; uy = t1y / tl;
    }
  }
  if (!longe) e.cote = 0;
  e.x += ux * s; e.y += uy * s; e.face = ux >= 0 ? 1 : -1;
  // jamais dans un obstacle
  for (const o of obs || obstacles(S)){
    const rx = o.rx + MARGE * .5, ry = o.ry + MARGE * .5, nx = (e.x - o.x) / rx, ny = (e.y - o.y) / ry, d = Math.hypot(nx, ny);
    if (d < 1 && d > 1e-6){ e.x = o.x + nx / d * rx; e.y = o.y + ny / d * ry; }
  }
  return Math.max(0, l - s);
}
// un point hors des obstacles (but d'un ordre)
function dehors(S, x, y){
  for (const o of obstacles(S)){ const rx = o.rx + MARGE * 2, ry = o.ry + MARGE * 2, nx = (x - o.x) / rx, ny = (y - o.y) / ry, d = Math.hypot(nx, ny);
    if (d < 1){ const k = d > 1e-6 ? 1 / d : 0; x = o.x + (k ? nx * k : 0) * rx; y = o.y + (k ? ny * k : 1) * ry; } }
  return [x, y];
}

/* ---------- population, déblocage ---------- */
// une maison compte autant de fois que son niveau (niveau 2 = deux maisons de population)
const maisons = S => S.sites.filter(s => s.b && s.b.k === "maison" && s.b.fini).reduce((n, s) => n + (s.b.niveau || 1), 0);
const maxEsc = S => S.P.pop.escouades + maisons(S) * S.P.pop.maisonEsc;
const maxOuv = S => S.P.pop.ouvriers + maisons(S) * S.P.pop.maisonOuv;
const nbEsc = S => S.esc.filter(q => q.pv > 0).length;
const aBatiment = (S, k) => S.sites.some(s => s.b && s.b.k === k && s.b.fini);
const debloque = (S, k) => S.triche.tout || !DEBLOQUE[k] || aBatiment(S, DEBLOQUE[k]);
const cout = (S, k) => { const E = S.P[k]; return {bois: E.bois || 0, or: E.or || 0, viande: E.viande || 0}; };
const peutPayer = (S, c) => RES.every(r => S.res[r] >= c[r]);
const payer = (S, c) => RES.forEach(r => S.res[r] -= c[r]);

/* ---------- les ouvriers ---------- */
function ajouterOuvrier(S, job, gratuit){
  if (!gratuit){
    if (S.pawns.length >= maxOuv(S)) return "PLUS DE PLACE : CONSTRUIS UNE MAISON";
    if (S.res.viande < S.P.eco.ouvrier) return "IL FAUT " + S.P.eco.ouvrier + " VIANDE";
    S.res.viande -= S.P.eco.ouvrier;
  }
  S.pawns.push({job, ancien: null, st: "go", x: DEPOT[0] + (S.rnd() - .5) * .4, y: DEPOT[1], cible: null, t: 0, face: 1, ph: S.rnd() * 5, charge: 0});
  return null;
}
// le métier le moins pourvu (pour l'ouvrier en plus)
const metierLibre = S => { const n = {bois: 0, or: 0, viande: 0}; S.pawns.forEach(p => { if (n[p.job] != null) n[p.job]++; }); return RES.slice().sort((a, b) => n[a] - n[b])[0]; };
// envoie un ouvrier de plus sur un métier (pris là où il y en a le plus)
function metier(S, job){
  const autres = S.pawns.filter(p => p.job !== job); if (!autres.length) return "PAS D'OUVRIER LIBRE";
  const compte = j => S.pawns.filter(p => p.job === j).length;
  autres.sort((a, b) => compte(b.job) - compte(a.job));
  const p = autres[0];
  if (job === "bati"){ if (!chantierPour(S, p)) return "RIEN A CONSTRUIRE NI A REPARER"; p.ancien = p.job; }
  else p.ancien = null;
  p.job = job; p.st = "go"; p.cible = null; return null;
}
// le chantier (ou le bâtiment abîmé) le plus proche
function chantierPour(S, p){
  let best = null, bd = 1e9;
  for (const s of S.sites) if (aFaire(S, s)){ const d = Math.hypot(s.x - p.x, s.y - p.y) + (s.b.fini && !s.b.travaux ? 3 : 0); if (d < bd){ bd = d; best = s; } }
  return best;
}
// un bâtiment qui attend des ouvriers : chantier, amélioration en cours ou réparation
const aFaire = (S, s) => !!(s && s.b && (!s.b.fini || s.b.travaux || s.b.pv < pvBat(S, s.b)));
const pvBat = (S, b) => S.P[b.k].pv * (1 + .25 * ((b.niveau || 1) - 1));
function pasOuvriers(S, dt, obs){
  const P = S.P;
  for (const p of S.pawns){
    if (p.job === "bati"){
      const s = aFaire(S, p.cible) ? p.cible : chantierPour(S, p);
      if (!s){ p.job = p.ancien || metierLibre(S); p.ancien = null; p.st = "go"; p.cible = null; continue; }
      p.cible = s;
      const tx = s.x + (p.ph % 2 < 1 ? -.62 : .62), ty = s.y + .1;
      if (Math.hypot(tx - p.x, ty - p.y) > .08){ p.st = "go"; marcher(S, p, tx, ty, P.eco.vitesse, dt, obs); continue; }
      p.st = "work"; p.face = s.x >= p.x ? 1 : -1;
      const b = s.b, B = P[b.k], pm = pvBat(S, b);
      if (!b.fini){ b.prog += P.eco.batir * dt; b.pv = Math.min(pm, b.pv + pm * .7 * P.eco.batir * dt / B.travail);
        if (b.prog >= B.travail){ b.fini = true; b.pv = pm; S.stats.batiments++; dire(S, BAT[b.k] + (FEMININ[b.k] ? " TERMINEE" : " TERMINE"), true); S.fx.push({k: "pouf", x: s.x, y: s.y, t0: S.t}); } }
      else if (b.travaux){ b.travaux.prog += P.eco.batir * dt;
        if (b.travaux.prog >= b.travaux.total){ b.niveau = (b.niveau || 1) + 1; b.travaux = null; b.pv = pvBat(S, b); dire(S, BAT[b.k] + " NIVEAU " + b.niveau, true); S.fx.push({k: "grade", x: s.x, y: s.y - .8, t0: S.t}); } }
      else b.pv = Math.min(pm, b.pv + pm * P.eco.batir * dt / B.travail);
      continue;
    }
    const tTravail = p.job === "bois" ? P.eco.tBois : p.job === "or" ? P.eco.tOr : P.eco.tViande;
    if (p.st === "go"){
      if (!p.cible){ const src = p.job === "bois" ? S.arbres : p.job === "or" ? S.filons : S.moutons; p.cible = src[Math.floor(S.rnd() * src.length)]; }
      const tx = p.cible.x + (p.job === "or" ? 0 : -.25), ty = p.cible.y + .05;
      if (Math.hypot(tx - p.x, ty - p.y) < .06){ p.st = "work"; p.t = tTravail; p.face = p.cible.x >= p.x ? 1 : -1; }
      else marcher(S, p, tx, ty, P.eco.vitesse, dt, obs);
    } else if (p.st === "work"){ p.t -= dt; if (p.t <= 0){ p.st = "back"; p.charge = p.job; if (p.job === "bois") p.cible.coupe = 1.2; } }
    else if (p.st === "back"){
      if (Math.hypot(DEPOT[0] - p.x, DEPOT[1] - p.y) < .12){ const r = p.charge || p.job; S.res[r] += P.eco.rapport; S.stats.recolte[r] += P.eco.rapport; S.fx.push({k: "txt", x: p.x, y: p.y - .4, t: "+" + P.eco.rapport, col: "#ffe08a", t0: S.t});
        p.st = "go"; p.cible = null; p.charge = 0; }
      else marcher(S, p, DEPOT[0], DEPOT[1], P.eco.vitesse, dt, obs);
    }
  }
  for (const a of S.arbres) if (a.coupe > 0) a.coupe -= dt;
  const [mx, my, mw, mh] = ZONE_MOUTONS;
  for (const m of S.moutons){ m.t -= dt; if (m.t <= 0){ m.t = 3 + S.rnd() * 4; m.tx = mx + S.rnd() * mw; m.ty = my + S.rnd() * mh; }
    const dx = m.tx - m.x, dy = m.ty - m.y, l = Math.hypot(dx, dy); m.mv = !!(l > .05 && m.tx); if (m.mv){ const v = Math.min(l, .3 * dt); m.x += dx / l * v; m.y += dy / l * v; m.face = dx >= 0 ? 1 : -1; } }
}

/* ---------- les bâtiments ---------- */
function construire(S, site, k){
  const s = typeof site === "number" ? S.sites[site] : site;
  if (!s || s.b) return "EMPLACEMENT PRIS";
  const err = peutBatir(S, s, k); if (err) return err;
  const c = cout(S, k); if (!peutPayer(S, c)) return "PAS ASSEZ DE RESSOURCES";
  if (!S.pawns.length) return "IL FAUT UN OUVRIER";
  payer(S, c);
  s.b = {k, fini: false, prog: 0, pv: S.P[k].pv * .1, garnison: null, niveau: 1, travaux: null}; s.ruine = false;
  // ceux qui se trouvent sur l'emplacement en sortent
  for (const e of [...S.esc, ...S.pawns]) if (!e.tour){ const [x, y] = dehors(S, e.x, e.y); e.x = x; e.y = y; }
  if (!S.pawns.some(p => p.job === "bati")) metier(S, "bati");
  return null;
}
// ce bâtiment peut-il aller sur cet emplacement ? (null = oui, sinon la raison)
function peutBatir(S, s, k){
  if (TOURS[k] && s.type !== "chemin") return "LES TOURS SE BATISSENT LE LONG DES CHEMINS";
  if (!TOURS[k] && s.type === "chemin") return "ICI, SEULEMENT DES TOURS";
  if (UNIQUE[k] && S.sites.some(o => o.b && o.b.k === k)) return (FEMININ[k] ? "UNE " : "UN ") + BAT[k] + " SEULEMENT";
  return null;
}
// améliorer un bâtiment qui forme des unités (niveau 2, puis 3) : prix = prix du bâtiment × niveau visé - 1 ; des ouvriers font les travaux
const coutNiveau = (S, b) => { const c = cout(S, b.k), m = S.P.niveaux.cout * (b.niveau || 1); return {bois: Math.round(c.bois * m), or: Math.round(c.or * m), viande: 0}; };
function ameliorer(S, site){
  const s = typeof site === "number" ? S.sites[site] : site, b = s && s.b;
  if (!b || !b.fini) return "PAS DE BATIMENT TERMINE";
  if (!AMELIORABLE[b.k]) return "CE BATIMENT NE S'AMELIORE PAS";
  if (b.travaux) return "TRAVAUX DEJA EN COURS";
  if ((b.niveau || 1) >= S.P.niveaux.max) return "NIVEAU MAXIMUM";
  const c = coutNiveau(S, b); if (!peutPayer(S, c)) return "PAS ASSEZ DE RESSOURCES";
  payer(S, c); b.travaux = {prog: 0, total: S.P[b.k].travail * S.P.niveaux.travail * (b.niveau || 1)};
  if (!S.pawns.some(p => p.job === "bati")) metier(S, "bati");
  return null;
}
// le château s'améliore sans ouvriers : plus de points de vie, lanciers plus aguerris
const coutChateau = S => { const m = S.niveauChateau; return {bois: S.P.chateau.bois * m, or: S.P.chateau.or * m, viande: 0}; };
const pvChateau = S => S.P.chateau.pv * (1 + S.P.chateau.pvNiveau * (S.niveauChateau - 1));
function ameliorerChateau(S){
  if (S.niveauChateau >= S.P.niveaux.max) return "NIVEAU MAXIMUM";
  const c = coutChateau(S); if (!peutPayer(S, c)) return "PAS ASSEZ DE RESSOURCES";
  payer(S, c); const avant = pvChateau(S); S.niveauChateau++; S.pv += pvChateau(S) - avant;
  dire(S, "CHATEAU NIVEAU " + S.niveauChateau, true); S.fx.push({k: "grade", x: CHATEAU[0], y: CHATEAU[1] - .3, t0: S.t});
  return null;
}
// le niveau du bâtiment qui forme une unité (1 s'il n'existe pas)
const niveauForme = (S, k) => { const f = FORME[k]; if (f === "chateau") return S.niveauChateau; const s = S.sites.find(o => o.b && o.b.k === f && o.b.fini); return s ? (s.b.niveau || 1) : 1; };
const peutPromouvoir = (S, q) => !!(q && q.pv > 0 && PROMO[q.k] && (S.triche.tout || S.sites.some(s => s.b && s.b.k === "caserne" && s.b.fini && (s.b.niveau || 1) >= 2)));
function promouvoir(S, q){
  if (!q || q.pv <= 0 || !PROMO[q.k]) return "CETTE ESCOUADE NE PEUT PAS ETRE PROMUE";
  if (!peutPromouvoir(S, q)) return "IL FAUT UNE CASERNE NIVEAU 2";
  const k = PROMO[q.k], c = cout(S, k); if (!peutPayer(S, c)) return "PAS ASSEZ DE RESSOURCES";
  payer(S, c);
  const part = q.pv / pvMax(S, q); q.k = k; q.pv = Math.max(1, part * pvMax(S, q));
  dire(S, "PROMUS : " + ESC[k], true); S.fx.push({k: "grade", x: q.x, y: q.y, t0: S.t});
  return null;
}
function detruire(S, s){
  const b = s.b; if (!b) return;
  if (b.garnison){ const q = b.garnison; q.tour = null; q.x = s.x; q.y = s.y + .4; q.tx = q.x; q.ty = q.y; }
  s.b = null; s.ruine = true; S.fx.push({k: "pouf", x: s.x, y: s.y, t0: S.t}, {k: "pouf", x: s.x - .3, y: s.y - .2, t0: S.t + .1});
  dire(S, BAT[b.k] + (b.fini ? (FEMININ[b.k] ? " DETRUITE" : " DETRUIT") : " : CHANTIER DETRUIT"));
}

/* ---------- les escouades ---------- */
const pvSoldat = (S, q) => { const X = S.P.xp; return S.P[q.k].pv * (1 + (q.grade >= 2 ? X.bonus : 0) + (q.grade >= 3 ? X.bonus : 0)); };
const nMax = (S, q) => S.P[q.k].n + (q.grade >= 2 && q.k !== "cata" ? 1 : 0);
const pvMax = (S, q) => nMax(S, q) * pvSoldat(S, q);
const vivants = (S, q) => Math.max(0, Math.ceil(q.pv / pvSoldat(S, q) - 1e-6));
const force = (S, q) => (1 + (q.grade >= 1 ? S.P.xp.bonus : 0)) * (1 + (q.grade >= 3 ? S.P.xp.bonus : 0));
// portée (tir, coup ou soin) : les moines soignent plus loin avec leur grade, la tour ajoute sa portée
function portee(S, q){
  const E = S.P[q.k];
  const T = q.tour && q.tour.b ? S.P[q.tour.b.k] : null;
  if (q.k === "moine") return E.r + q.grade * E.rGrade + (T ? T.soigne : 0);
  return E.r + (T ? T.portee : 0);
}
function recruter(S, k, gratuit){
  if (!gratuit){
    if (!debloque(S, k)) return "IL FAUT " + (FEMININ[DEBLOQUE[k]] ? "UNE " : "UN ") + BAT[DEBLOQUE[k]];
    if (nbEsc(S) >= maxEsc(S)) return "POPULATION AU MAXIMUM : CONSTRUIS UNE MAISON";
    const c = cout(S, k); if (!peutPayer(S, c)) return "PAS ASSEZ DE RESSOURCES";
    payer(S, c);
  }
  // l'escouade sort du bâtiment qui la forme (ou du château)
  if (!RECRUTABLES.includes(k)) return "PAS A RECRUTER";
  const src = DEBLOQUE[k] && S.sites.find(s => s.b && s.b.k === DEBLOQUE[k] && s.b.fini);
  const x0 = src ? src.x : DEPOT[0], y0 = src ? src.y + .25 : DEPOT[1] + .1;
  const a = S.esc.length * 1.3;
  const q = {id: S.nid++, k, x: x0, y: y0, tx: src ? x0 : DEPOT[0] + Math.cos(a) * 1.1, ty: src ? y0 + .3 : DEPOT[1] + .2 + Math.abs(Math.sin(a)) * .3,
    pv: 0, cd: 0, face: 1, mode: "idle", ordre: false, engage: false, xp: 0, grade: 0, tues: 0, tour: null, versTour: null, rt: 0, ph: S.rnd() * 3};
  // les recrues d'un bâtiment amélioré arrivent déjà aguerries (niveau 2 : vétérans, niveau 3 : élite)
  const g = gratuit ? 0 : Math.min(2, niveauForme(S, k) - 1);
  if (g > 0){ q.grade = g; q.xp = [0, S.P.xp.veteran, S.P.xp.elite][g]; }
  q.pv = pvMax(S, q);
  S.esc.push(q); S.stats.escouades++;
  if (!gratuit) S.sel = q;
  return null;
}
// ordre : aller en (x, y), ou monter dans une tour (site)
function envoyer(S, q, x, y, site){
  if (!q || q.pv <= 0) return "PAS D'ESCOUADE";
  if (site){
    if (!site.b || !TOURS[site.b.k] || !site.b.fini) return "CE N'EST PAS UNE TOUR";
    if (!GARNISON[q.k]) return "SEULS LES ARCHERS, LES MOINES ET LES CATAPULTES MONTENT DANS LES TOURS";
    if (site.b.garnison && site.b.garnison !== q) return "LA TOUR EST DEJA OCCUPEE";
    if (q.tour === site) return null;
  }
  if (q.tour){ const s = q.tour; s.b.garnison = null; q.tour = null; q.x = s.x; q.y = s.y + .35; }
  q.versTour = null;
  if (site){ q.versTour = site; x = site.x; y = site.y + .3; }
  else [x, y] = dehors(S, Math.max(.3, Math.min(W - .3, x)), Math.max(.3, Math.min(H - .3, y)));
  q.tx = x; q.ty = y; q.ordre = true; q.engage = false;
  return null;
}
// tenir la position : l'escouade ne part plus au-devant des monstres, elle frappe ceux qui arrivent à sa portée
function tenir(S, q){ if (!q || q.pv <= 0) return "PAS D'ESCOUADE"; q.tenir = !q.tenir; q.engage = false; return null; }
function gagnerXp(S, q, n){
  if (!q || q.pv <= 0) return;
  const X = S.P.xp, avant = q.grade, m0 = pvMax(S, q); q.xp += n;
  while (q.grade < 3 && q.xp >= [X.veteran, X.elite, X.heros][q.grade]) q.grade++;
  if (q.grade > avant){
    // mêmes blessures en proportion ; en passant élite, un soldat de plus, frais
    const part = q.pv / m0, plus = avant < 2 && q.grade >= 2 && nMax(S, q) > S.P[q.k].n;
    q.pv = Math.min(pvMax(S, q), plus ? part * (pvMax(S, q) - pvSoldat(S, q)) + pvSoldat(S, q) : part * pvMax(S, q));
    dire(S, ESC[q.k] + " : " + GRADES[q.grade], true); S.fx.push({k: "grade", x: q.x, y: q.y, t0: S.t});
  }
}
function pasEscouades(S, dt, obs){
  const P = S.P;
  for (const q of S.esc){
    if (q.pv <= 0) continue;
    const E = P[q.k], pvS = pvSoldat(S, q), nv = vivants(S, q), r = portee(S, q);
    if (q.tour){ q.x = q.tour.x; q.y = q.tour.y; }
    // les moines soignent les escouades dans leur zone
    if (E.soin){ q.cd -= dt; let soigne = false;
      for (const o of S.esc) if (o !== q && o.pv > 0 && o.pv < pvMax(S, o) && d2(o, q) < r){ o.pv = Math.min(pvMax(S, o), o.pv + E.soin * nv * force(S, q) * dt); soigne = true; if (q.cd <= 0) S.fx.push({k: "heal", x: o.x, y: o.y, cible: o, t0: S.t}); }
      if (q.cd <= 0) q.cd = 1.1;
      q.mode = soigne ? "atk" : "idle"; }
    let cible = null, best = 99;
    for (const m of S.mons) if (m.pv > 0 && m.delai <= 0){ const d = d2(m, q); if (d < best){ best = d; cible = m; } }
    const tire = q.k === "arc" || q.k === "cata";
    if (!q.tour){
      // un ordre de marche passe avant le combat ; sinon l'escouade attaque les monstres proches (pas la catapulte, qui reste en place) puis revient à son poste
      let gx = q.tx, gy = q.ty;
      if (!E.soin && q.k !== "cata" && !q.tenir && cible && best < E.r + 1.7 && !q.ordre){ q.engage = true; if (best > E.r * .9){ gx = cible.x; gy = cible.y; } else { gx = q.x; gy = q.y; } }
      else q.engage = false;
      const reste = Math.hypot(gx - q.x, gy - q.y);
      if (reste > .05){ marcher(S, q, gx, gy, E.v, dt, obs); q.mode = "walk"; }
      else if (!E.soin) q.mode = cible && best <= r + .1 ? "atk" : "idle";
      if (q.ordre && Math.hypot(q.tx - q.x, q.ty - q.y) <= .12){ q.ordre = false;
        if (q.versTour){ const s = q.versTour; q.versTour = null;
          if (s.b && TOURS[s.b.k] && s.b.fini && !s.b.garnison){ s.b.garnison = q; q.tour = s; q.engage = false; dire(S, ESC[q.k] + " EN GARNISON", true); } } }
      // renfort au château, hors combat
      if (!q.engage && nv < nMax(S, q) && Math.hypot(DEPOT[0] - q.x, DEPOT[1] - q.y) < 1.5){
        q.rt += dt; if (q.rt >= P.renfort.temps){ q.rt = 0; if (S.res.viande >= P.renfort.viande){ S.res.viande -= P.renfort.viande; q.pv = Math.min(pvMax(S, q), (nv + 1) * pvS); S.fx.push({k: "txt", x: q.x, y: q.y - .5, t: "+1", col: "#9fd8ff", t0: S.t}); } }
      } else q.rt = 0;
    } else if (!E.soin) q.mode = cible && best <= r + .1 ? "atk" : "idle";
    // le coup
    if (E.soin || !cible || best > r + .1){ if (q.k === "cata") q.cd = Math.max(q.cd - dt, 0); continue; }
    q.face = cible.x >= q.x ? 1 : -1;
    if (q.k === "cata"){
      // une pierre toutes les « cadence » secondes : dégâts de zone à l'arrivée
      q.cd -= dt; q.mode = q.cd < .9 ? "atk" : "idle";
      if (q.cd <= 0){ q.cd = E.cadence; const vol = .5 + best * .08;
        S.tirs.push({x: cible.x, y: cible.y, t: S.t + vol, deg: E.degats * force(S, q), zone: E.zone, par: q});
        S.fx.push({k: "pierre", x0: q.x, y0: q.y - (q.tour ? 1.4 : .3), x1: cible.x, y1: cible.y, t0: S.t, d: vol}); }
      continue;
    }
    const dmg = E.dps * nv * force(S, q) * dt * (q.k === "lance" && cible.t === "troll" ? E.troll : 1);
    cible.pv -= dmg; cible.dernier = q;
    q.cd -= dt; if (q.cd <= 0){ q.cd = .6; if (tire) for (let i = 0; i < Math.min(nv, 4); i++) S.fx.push({k: "fleche", x0: q.x, y0: q.y - (q.tour ? 1.4 : 0), x1: cible.x, y1: cible.y, t0: S.t + i * .08}); }
  }
  // les pierres qui arrivent
  for (const t of S.tirs) if (S.t >= t.t){
    t.fait = true; S.fx.push({k: "boum", x: t.x, y: t.y, t0: S.t});
    for (const m of S.mons) if (m.pv > 0 && m.delai <= 0 && Math.hypot(m.x - t.x, m.y - t.y) < t.zone){ m.pv -= t.deg; m.dernier = t.par; }
  }
  S.tirs = S.tirs.filter(t => !t.fait);
}

/* ---------- les vagues et les monstres ---------- */
const typesVague = w => w === 1 ? ["gob"] : w === 2 ? ["gob", "lanceg"] : ["gob", "lanceg", "gnoll"];
function directions(S, w){
  if (S.dirs[w]) return S.dirs[w];
  const ds = Object.keys(CHEMINS), d = w <= 3 ? ds[(w - 1) % 3] : ds[Math.floor(S.rnd() * 3)];
  const r = [d]; if (w >= S.P.vagues.deux) r.push(ds[(ds.indexOf(d) + 1) % 3]);
  return (S.dirs[w] = r);
}
const avecTroll = (S, w) => S.P.vagues.troll > 0 && (w % S.P.vagues.troll === 0 || w === S.P.vagues.nombre);
// la composition d'une vague (aussi pour l'annonce)
function composition(S, w){
  const V = S.P.vagues, types = typesVague(w), n = Math.max(1, Math.round(V.base + V.plus * (w - 1))), ds = directions(S, w), out = [];
  for (let i = 0; i < n; i++) out.push([types[i % types.length], ds[0], i * .9]);
  if (avecTroll(S, w)) out.push(["troll", ds[0], n * .9 + .5]);
  if (ds[1]){ const n2 = Math.max(1, Math.round(n * .6)); for (let i = 0; i < n2; i++) out.push([types[i % types.length], ds[1], 2 + i * .9]); }
  return out;
}
function lancerVague(S){
  S.vague++; const w = S.vague, mult = 1 + S.P.vagues.force * (w - 1);
  for (const [t, d, delai] of composition(S, w)){
    const [a] = CHEMINS[d], pv = S.P[t].pv * mult;
    S.mons.push({t, x: a[0] + (S.rnd() - .5) * .4, y: a[1] + (S.rnd() - .5) * .4, dir: d, etape: 1, ox: (S.rnd() - .5) * .5, oy: (S.rnd() - .5) * .5,
      pv, pvMax: pv, delai, cd: 0, face: 1, mode: "walk", ph: S.rnd() * 3, dernier: null});
  }
  S.prochaine = S.t + S.P.vagues.entre; S.alerte = null; S.enVague = true;
  S.stats.journal.push({vague: w, debut: S.t, pvChateau: null, pertes: 0, tues: 0, res: null});
}
function pasMonstres(S, dt, obs){
  const P = S.P;
  for (const m of S.mons){
    if (m.pv <= 0) continue;
    if (m.delai > 0){ m.delai -= dt; continue; }
    const MM = P[m.t];
    let q = null, best = 99;
    for (const s of S.esc) if (s.pv > 0 && !s.tour){ const d = d2(s, m); if (d < best){ best = d; q = s; } }
    m.cd -= dt;
    if (q && best <= MM.r + .05){
      m.mode = "atk"; m.face = q.x >= m.x ? 1 : -1;
      const av = vivants(S, q); q.pv -= MM.dps * dt; const ap = vivants(S, q);
      if (ap < av){ S.fx.push({k: "pouf", x: q.x + (S.rnd() - .5) * .5, y: q.y, t0: S.t}); S.stats.pertes += av - ap; const j = S.stats.journal[S.stats.journal.length - 1]; if (j) j.pertes += av - ap; }
      if (m.t === "gnoll" && m.cd <= 0){ m.cd = .9; S.fx.push({k: "os", x0: m.x, y0: m.y, x1: q.x, y1: q.y, t0: S.t}); }
      continue;
    }
    // un bâtiment tout près
    let bat = null, bd = 1.0;
    for (const s of S.sites) if (s.b){ const d = Math.hypot(s.x - m.x, s.y - .3 - m.y); if (d < bd){ bd = d; bat = s; } }
    if (bat){ m.mode = "atk"; m.face = bat.x >= m.x ? 1 : -1; bat.b.pv -= MM.dps * dt; if (bat.b.pv <= 0) detruire(S, bat); continue; }
    const dc = Math.hypot(CHATEAU[0] - m.x, CHATEAU[1] - m.y);
    if (dc < 1.75){ m.mode = "atk"; m.face = CHATEAU[0] >= m.x ? 1 : -1; if (!S.triche.invincible) S.pv -= MM.dps * dt; continue; }
    m.mode = "walk";
    if (q && best < 1.5 && m.t !== "gnoll"){ marcher(S, m, q.x, q.y, MM.v, dt, obs); continue; }
    // le chemin, point après point, puis le château
    const pts = CHEMINS[m.dir];
    if (m.etape < pts.length){ const [px, py] = pts[m.etape], tx = px + m.ox, ty = py + m.oy;
      if (Math.hypot(tx - m.x, ty - m.y) < .15) m.etape++; else marcher(S, m, tx, ty, MM.v, dt, obs); }
    else marcher(S, m, CHATEAU[0], CHATEAU[1], MM.v, dt, obs);
  }
}

/* ---------- un pas de temps ---------- */
function pas(S, dt){
  if (S.fini) return;
  S.t += dt;
  const V = S.P.vagues;
  if (S.vague < V.nombre){
    if (!S.alerte && S.t > S.prochaine - V.alerte){
      const w = S.vague + 1, ds = directions(S, w);
      S.alerte = ds; dire(S, "VAGUE " + w + " · PAR " + ds.map(d => NOM_DIR[d]).join(" ET ") + (avecTroll(S, w) ? " · AVEC LE TROLL" : ""));
    }
    if (S.t > S.prochaine) lancerVague(S);
  }
  const obs = obstacles(S);
  pasOuvriers(S, dt, obs);
  pasEscouades(S, dt, obs);
  pasMonstres(S, dt, obs);
  for (const m of S.mons) if (m.pv <= 0 && !m.mort){
    m.mort = S.t; S.fx.push({k: "pouf", x: m.x, y: m.y, t0: S.t}); S.stats.tues++;
    const j = S.stats.journal[S.stats.journal.length - 1]; if (j) j.tues++;
    gagnerXp(S, m.dernier, m.pvMax * S.P.xp.parPv);
    if (m.t === "troll") dire(S, "LE TROLL EST TOMBE", true);
  }
  for (const q of S.esc) if (q.pv <= 0 && !q.mort){
    q.mort = S.t; S.fx.push({k: "pouf", x: q.x, y: q.y, t0: S.t}); if (S.sel === q) S.sel = null;
    if (q.tour){ if (q.tour.b) q.tour.b.garnison = null; q.tour = null; }
    dire(S, ESC[q.k] + (q.k === "cata" ? " DETRUITE" : " ANEANTIS") + (q.grade ? " (" + GRADES[q.grade] + ")" : ""));
  }
  S.mons = S.mons.filter(m => !m.mort || S.t - m.mort < .6);
  S.esc = S.esc.filter(q => !q.mort || S.t - q.mort < .6);
  S.fx = S.fx.filter(f => S.t - f.t0 < (f.d || 0) + 1.4);
  // fin d'une vague : bilan dans le journal, expérience de survie
  if (S.enVague && !S.mons.some(m => m.pv > 0)){
    S.enVague = false; const j = S.stats.journal[S.stats.journal.length - 1];
    if (j){ j.fin = S.t; j.pvChateau = Math.round(S.pv); j.res = {bois: Math.floor(S.res.bois), or: Math.floor(S.res.or), viande: Math.floor(S.res.viande)}; j.esc = nbEsc(S); j.ouv = S.pawns.length; }
    for (const q of S.esc) if (q.pv > 0) gagnerXp(S, q, S.P.xp.survie);
    if (S.vague < V.nombre) dire(S, "VAGUE " + S.vague + " REPOUSSEE", true);
  }
  if (S.vague >= V.nombre && !S.enVague && !S.mons.length){ S.fini = "victoire"; dire(S, "LE CHATEAU A TENU · VICTOIRE", true); }
  if (S.pv <= 0){ S.pv = 0; S.fini = "defaite"; dire(S, "LE CHATEAU EST TOMBE"); const j = S.stats.journal[S.stats.journal.length - 1]; if (j && j.pvChateau == null) j.pvChateau = 0; }
}
// faire venir la prochaine vague tout de suite (labo)
function vagueMaintenant(S){ if (S.vague < S.P.vagues.nombre && !S.fini){ S.prochaine = S.t + .01; if (!S.alerte) S.alerte = directions(S, S.vague + 1); } }

/* ---------- le robot (simulateur et bouton ROBOT du labo) ----------
   Une stratégie simple et régulière, pour comparer des réglages : ouvriers équilibrés, archerie puis maisons,
   tours le long du chemin annoncé avec des archers dedans, escouades sur le chemin de la prochaine vague. */
const POSTE = {N: [4.2, 2.5], O: [1.4, 4.5], E: [8.5, 5.5]};
const SITE_TOUR = {N: [0, 1, 6], O: [2, 1, 6], E: [3, 4, 7]};
const SITE_BASE = [9, 10, 8, 11, 13, 14, 12, 15];
function robot(S, dt){
  S._rob = (S._rob || 0) - dt; if (S._rob > 0 || S.fini) return; S._rob = .5;
  const P = S.P;
  if (S.pawns.length < maxOuv(S) && S.res.viande >= P.eco.ouvrier + 6) ajouterOuvrier(S, metierLibre(S));
  const has = k => S.sites.some(s => s.b && s.b.k === k);
  const libre = ids => ids.map(i => S.sites[i]).find(s => !s.b);
  // pendant une vague : son chemin ; sinon celui de la prochaine
  const ds = S.enVague ? directions(S, S.vague) : S.alerte || directions(S, Math.min(P.vagues.nombre, S.vague + 1));
  const enChantier = S.sites.some(s => s.b && !s.b.fini);
  const nTours = S.sites.filter(s => s.b && TOURS[s.b.k]).length;
  if (!has("archerie")) construire(S, libre(SITE_BASE), "archerie");
  else if (!enChantier && nTours < 1 + Math.floor(S.vague / 2)){ const s = libre(SITE_TOUR[ds[0]]) || libre([0, 1, 2, 3, 4, 5, 6, 7]); if (s) construire(S, s, "tour"); }
  else if (!enChantier && nbEsc(S) >= maxEsc(S)){ const s = libre(SITE_BASE); if (s) construire(S, s, "maison"); }
  if (!enChantier && S.vague >= 3 && !has("caserne") && S.res.or >= 40){ const s = libre(SITE_BASE); if (s) construire(S, s, "caserne"); }
  // recrutement : archers d'abord (pour les tours), lanciers contre le troll
  const troll = S.mons.some(m => m.t === "troll" && m.pv > 0) || avecTroll(S, S.vague + 1);
  const nArc = S.esc.filter(q => q.k === "arc").length, nAutres = S.esc.length - nArc;
  const veut = troll ? "lance" : nArc < nAutres + 1 && debloque(S, "arc") ? "arc" : debloque(S, "guer") ? "guer" : "lance";
  if (nbEsc(S) < maxEsc(S)) recruter(S, veut);
  S.sel = null;
  // placement : archers dans les tours libres, les autres sur le chemin annoncé (partagés entre deux)
  const tours = S.sites.filter(s => s.b && TOURS[s.b.k] && s.b.fini && !s.b.garnison);
  let i = 0;
  for (const q of S.esc){
    if (q.pv <= 0 || q.tour || q.versTour) continue;
    if (q.k === "arc" && tours.length){ envoyer(S, q, 0, 0, tours.shift()); continue; }
    const blesse = vivants(S, q) < nMax(S, q) - 1 && !S.enVague;
    const [ex, ey] = blesse ? DEPOT : POSTE[ds[i % ds.length]]; i++;
    const recul = q.k === "arc" || q.k === "moine" ? .25 : 0, cx = ex + (CHATEAU[0] - ex) * recul, cy = ey + (CHATEAU[1] - ey) * recul;
    if (Math.hypot(q.tx - cx, q.ty - cy) > .6 && !q.engage) envoyer(S, q, cx + (S.rnd() - .5) * .4, cy + (S.rnd() - .5) * .4);
  }
}
// une partie complète jouée par le robot (simulateur) : résultat résumé
function simuler(mods, graine, tMax){
  const S = creer(mods, graine);
  while (!S.fini && S.t < (tMax || 1400)){ robot(S, .05); pas(S, .05); S.evts.length = 0; }
  return {fini: S.fini || "temps", vague: S.vague, pv: Math.round(S.pv), t: Math.round(S.t), tues: S.stats.tues, pertes: S.stats.pertes, journal: S.stats.journal};
}

const api = {DEFAUT, ESC, MONS, BAT, FEMININ, DEBLOQUE, GARNISON, GRADES, RES, CARTE, W, H, CHATEAU, DEPOT, CHEMINS, NOM_DIR, SITES, VILLAGE, TOURS, UNIQUE, FORME, PROMO, RECRUTABLES,
  peutBatir, ameliorer, tenir, AMELIORABLE, coutNiveau, ameliorerChateau, coutChateau, pvChateau, niveauForme, peutPromouvoir, promouvoir, pvBat,
  reglages, ecarts, creer, pas, ajouterOuvrier, metierLibre, metier, construire, recruter, envoyer, vagueMaintenant, composition, directions, obstacles, dehors,
  maxEsc, maxOuv, nbEsc, debloque, cout, peutPayer, vivants, nMax, pvMax, pvSoldat, portee, robot, simuler, maisons};
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.BastionRegles = api;
})();

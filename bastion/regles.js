/* Bastion : les règles, sans dessin. Partagées par le jeu (jeu.js) et le simulateur (node bastion/simulateur.js).
   Session 1 = le laboratoire : tous les nombres sont dans DEFAUT et se règlent dans le panneau LABO (copie modifiée = « réglages »).
   Une partie : B.creer(reglages, graine) → S ; B.pas(S, dt) fait avancer le temps (dt ≤ 0,05 s) ;
   les ordres du joueur (ouvrier, metier, recruter, construire, envoyer) renvoient un texte d'erreur ou null ;
   S.evts reçoit les messages à afficher ({txt, bon}) ; B.robot(S, dt) joue tout seul (simulateur, bouton ROBOT du labo). */
(function(){
"use strict";

/* ---------- les réglages d'origine ---------- */
const DEFAUT = {
  eco: {bois: 40, or: 40, viande: 30, ouvriers: 3, rapport: 6, vitesse: 1.15, tBois: 2.2, tOr: 2.6, tViande: 2.0, ouvrier: 10, batir: 1},
  pop: {escouades: 3, ouvriers: 4, maisonEsc: 1, maisonOuv: 2},
  chateau: {pv: 800},
  guer:  {n: 4, pv: 25, dps: 4.5, r: .75, v: 1.3, bois: 0, or: 10, viande: 10},
  arc:   {n: 4, pv: 15, dps: 3, r: 2.6, v: 1.3, bois: 15, or: 10, viande: 0},
  lance: {n: 4, pv: 28, dps: 4, r: .95, v: 1.1, bois: 10, or: 15, viande: 0, troll: 2.5},
  moine: {n: 2, pv: 15, soin: 5, r: 1.7, v: 1.2, bois: 0, or: 20, viande: 0},
  gob:    {pv: 30, dps: 6, r: .7, v: .55},
  lanceg: {pv: 40, dps: 7, r: .85, v: .5},
  gnoll:  {pv: 26, dps: 5, r: 2, v: .5},
  troll:  {pv: 300, dps: 24, r: .95, v: .33},
  maison:    {bois: 30, or: 0, travail: 10, pv: 150},
  caserne:   {bois: 40, or: 20, travail: 16, pv: 250},
  archerie:  {bois: 40, or: 0, travail: 14, pv: 200},
  monastere: {bois: 10, or: 40, travail: 16, pv: 200},
  tour:      {bois: 30, or: 20, travail: 14, pv: 300, portee: 1.2},
  vagues: {premiere: 35, entre: 45, nombre: 10, base: 3, plus: 2, force: .15, troll: 4, deux: 5, alerte: 6},
  xp: {parPv: .1, survie: 4, veteran: 25, elite: 60, heros: 120, bonus: .2},
  renfort: {viande: 4, temps: 2},
  jeu: {ralenti: .35}
};
// noms des escouades, monstres, bâtiments (affichage)
const ESC = {guer: "GUERRIERS", arc: "ARCHERS", lance: "LANCIERS", moine: "MOINES"};
const MONS = {gob: "GOBELINS", lanceg: "GOBELINS A LANCE", gnoll: "GNOLLS", troll: "TROLL"};
const BAT = {maison: "MAISON", caserne: "CASERNE", archerie: "ARCHERIE", monastere: "MONASTERE", tour: "TOUR"};
// le bâtiment qui débloque chaque escouade (null = le château)
const DEBLOQUE = {guer: null, arc: "archerie", lance: "caserne", moine: "monastere"};
const GRADES = ["RECRUES", "VETERANS", "ELITE", "HEROS"];
const RES = ["bois", "or", "viande"];

/* ---------- la carte (9 × 9 cases) ---------- */
// F forêt, P chemin, w bois, g or, . herbe ; le château au centre, les moutons en bas
const CARTE = ["FFFFPFFFF",
               "FF..P..FF",
               "F...P...F",
               "F...P...F",
               "PPPP.PPPP",
               "F.......F",
               "Fww...ggF",
               "Fww...ggF",
               "FFFFFFFFF"];
const N = 9;
const CHATEAU = [4.5, 4.5], DEPOT = [4.5, 5.45];
const CHEMINS = {N: [[4.5, -0.6], [4.5, 3.4]], O: [[-0.6, 4.5], [3.0, 4.5]], E: [[9.6, 4.5], [6.0, 4.5]]};
const NOM_DIR = {N: "LE NORD", O: "L'OUEST", E: "L'EST"};
// emplacements de construction (pieds du bâtiment)
const SITES = [[2.0, 2.5], [3.45, 2.3], [5.55, 2.3], [7.0, 2.5], [1.6, 5.8], [2.9, 6.0], [6.1, 6.0], [7.4, 5.8]];

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
    alerte: null, dirs: [], pawns: [], esc: [], mons: [], fx: [], evts: [], fini: null, sel: null, nid: 1, enVague: false,
    triche: {invincible: false, tout: false},
    stats: {recolte: {bois: 0, or: 0, viande: 0}, tues: 0, pertes: 0, escouades: 0, batiments: 0, journal: []},
    arbres: [], filons: [], moutons: [], sites: SITES.map(([x, y], i) => ({i, x, y, b: null, ruine: false}))};
  // les ressources de la carte
  let s2 = 3; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;   // même décor à chaque partie
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){ const ch = CARTE[y][x];
    if (ch === "w") for (const [ox, oy] of [[.3, .45], [.72, .7], [.35, .95]]) S.arbres.push({x: x + ox + (r2() - .5) * .1, y: y + oy, n: Math.floor(r2() * 2), ph: r2() * 8, coupe: 0});
    if (ch === "g") S.filons.push({x: x + .5 + (r2() - .5) * .3, y: y + .7, n: 3 + Math.floor(r2() * 3)}); }
  for (let k = 0; k < 4; k++) S.moutons.push({x: 3.6 + k * .55, y: 7.3 + (k % 2) * .3, tx: 0, ty: 0, t: r2() * 5, face: 1});
  for (let k = 0; k < P.eco.ouvriers; k++) ajouterOuvrier(S, RES[k % 3], true);
  recruter(S, "guer", true);
  S.sel = null;
  dire(S, "DEFENDS LE CHATEAU", true);
  return S;
}
const dire = (S, txt, bon) => S.evts.push({txt, bon: !!bon});

/* ---------- population, déblocage ---------- */
const maisons = S => S.sites.filter(s => s.b && s.b.k === "maison" && s.b.fini).length;
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
  for (const s of S.sites) if (s.b && (!s.b.fini || s.b.pv < S.P[s.b.k].pv)){ const d = Math.hypot(s.x - p.x, s.y - p.y) + (s.b.fini ? 3 : 0); if (d < bd){ bd = d; best = s; } }
  return best;
}
function pasOuvriers(S, dt){
  const P = S.P;
  for (const p of S.pawns){
    if (p.job === "bati"){
      const s = p.cible && p.cible.b && (!p.cible.b.fini || p.cible.b.pv < P[p.cible.b.k].pv) ? p.cible : chantierPour(S, p);
      if (!s){ p.job = p.ancien || metierLibre(S); p.ancien = null; p.st = "go"; p.cible = null; continue; }
      p.cible = s;
      const tx = s.x + (p.ph % 2 < 1 ? -.45 : .45), ty = s.y + .15, dx = tx - p.x, dy = ty - p.y, l = Math.hypot(dx, dy);
      if (l > .06){ p.st = "go"; const v = Math.min(l, P.eco.vitesse * dt); p.x += dx / l * v; p.y += dy / l * v; p.face = dx >= 0 ? 1 : -1; continue; }
      p.st = "work"; p.face = s.x >= p.x ? 1 : -1;
      const b = s.b, B = P[b.k];
      if (!b.fini){ b.prog += P.eco.batir * dt; b.pv = Math.min(B.pv, b.pv + B.pv * .7 * P.eco.batir * dt / B.travail);
        if (b.prog >= B.travail){ b.fini = true; b.pv = B.pv; S.stats.batiments++; dire(S, BAT[b.k] + " TERMINEE", true); S.fx.push({k: "pouf", x: s.x, y: s.y, t0: S.t}); } }
      else b.pv = Math.min(B.pv, b.pv + B.pv * P.eco.batir * dt / B.travail);
      continue;
    }
    const tTravail = p.job === "bois" ? P.eco.tBois : p.job === "or" ? P.eco.tOr : P.eco.tViande;
    if (p.st === "go"){
      if (!p.cible){ const src = p.job === "bois" ? S.arbres : p.job === "or" ? S.filons : S.moutons; p.cible = src[Math.floor(S.rnd() * src.length)]; p.st = "go"; }
      const tx = p.cible.x + (p.job === "or" ? 0 : -.25), ty = p.cible.y + .05, dx = tx - p.x, dy = ty - p.y, l = Math.hypot(dx, dy);
      if (l < .06){ p.st = "work"; p.t = tTravail; p.face = p.cible.x >= p.x ? 1 : -1; }
      else { const v = Math.min(l, P.eco.vitesse * dt); p.x += dx / l * v; p.y += dy / l * v; p.face = dx >= 0 ? 1 : -1; }
    } else if (p.st === "work"){ p.t -= dt; if (p.t <= 0){ p.st = "back"; p.charge = p.job; if (p.job === "bois") p.cible.coupe = 1.2; } }
    else if (p.st === "back"){
      const dx = DEPOT[0] - p.x, dy = DEPOT[1] - p.y, l = Math.hypot(dx, dy);
      if (l < .1){ const r = p.charge || p.job; S.res[r] += P.eco.rapport; S.stats.recolte[r] += P.eco.rapport; S.fx.push({k: "txt", x: p.x, y: p.y - .4, t: "+" + P.eco.rapport, col: "#ffe08a", t0: S.t});
        p.st = "go"; p.cible = null; p.charge = 0; }
      else { const v = Math.min(l, P.eco.vitesse * dt); p.x += dx / l * v; p.y += dy / l * v; p.face = dx >= 0 ? 1 : -1; }
    }
  }
  for (const a of S.arbres) if (a.coupe > 0) a.coupe -= dt;
  for (const m of S.moutons){ m.t -= dt; if (m.t <= 0){ m.t = 3 + S.rnd() * 4; m.tx = 3.4 + S.rnd() * 2.4; m.ty = 7.1 + S.rnd() * .7; }
    const dx = m.tx - m.x, dy = m.ty - m.y, l = Math.hypot(dx, dy); m.mv = !!(l > .05 && m.tx); if (m.mv){ const v = Math.min(l, .3 * dt); m.x += dx / l * v; m.y += dy / l * v; m.face = dx >= 0 ? 1 : -1; } }
}

/* ---------- les bâtiments ---------- */
function construire(S, site, k){
  const s = typeof site === "number" ? S.sites[site] : site;
  if (!s || s.b) return "EMPLACEMENT PRIS";
  const c = cout(S, k); if (!peutPayer(S, c)) return "PAS ASSEZ DE RESSOURCES";
  if (!S.pawns.length) return "IL FAUT UN OUVRIER";
  payer(S, c);
  s.b = {k, fini: false, prog: 0, pv: S.P[k].pv * .1, garnison: null}; s.ruine = false;
  if (!S.pawns.some(p => p.job === "bati")) metier(S, "bati");
  return null;
}
function detruire(S, s){
  const b = s.b; if (!b) return;
  if (b.garnison){ const q = b.garnison; q.tour = null; q.x = s.x; q.y = s.y + .35; q.tx = q.x; q.ty = q.y; }
  s.b = null; s.ruine = true; S.fx.push({k: "pouf", x: s.x, y: s.y, t0: S.t}, {k: "pouf", x: s.x - .3, y: s.y - .2, t0: S.t + .1});
  dire(S, BAT[b.k] + (b.fini ? " DETRUITE" : " : CHANTIER DETRUIT"));
}

/* ---------- les escouades ---------- */
const pvSoldat = (S, q) => { const X = S.P.xp; return S.P[q.k].pv * (1 + (q.grade >= 2 ? X.bonus : 0) + (q.grade >= 3 ? X.bonus : 0)); };
const nMax = (S, q) => S.P[q.k].n + (q.grade >= 2 ? 1 : 0);
const pvMax = (S, q) => nMax(S, q) * pvSoldat(S, q);
const vivants = (S, q) => Math.max(0, Math.ceil(q.pv / pvSoldat(S, q) - 1e-6));
const force = (S, q) => (1 + (q.grade >= 1 ? S.P.xp.bonus : 0)) * (1 + (q.grade >= 3 ? S.P.xp.bonus : 0));
function recruter(S, k, gratuit){
  if (!gratuit){
    if (!debloque(S, k)) return "IL FAUT " + ({archerie: "UNE ", caserne: "UNE "}[DEBLOQUE[k]] || "UN ") + BAT[DEBLOQUE[k]];
    if (nbEsc(S) >= maxEsc(S)) return "POPULATION AU MAXIMUM : CONSTRUIS UNE MAISON";
    const c = cout(S, k); if (!peutPayer(S, c)) return "PAS ASSEZ DE RESSOURCES";
    payer(S, c);
  }
  // l'escouade sort du bâtiment qui la forme (ou du château)
  const src = DEBLOQUE[k] && S.sites.find(s => s.b && s.b.k === DEBLOQUE[k] && s.b.fini);
  const x0 = src ? src.x : DEPOT[0], y0 = src ? src.y + .35 : DEPOT[1] + .1;
  const a = S.esc.length * 1.3;
  const q = {id: S.nid++, k, x: x0, y: y0, tx: src ? x0 : DEPOT[0] + Math.cos(a) * .9, ty: src ? y0 + .2 : DEPOT[1] - .3 + Math.sin(a) * .5,
    pv: 0, cd: 0, face: 1, mode: "idle", ordre: false, engage: false, xp: 0, grade: 0, tues: 0, tour: null, versTour: null, rt: 0, ph: S.rnd() * 3};
  q.pv = pvMax(S, q);
  S.esc.push(q); S.stats.escouades++;
  if (!gratuit) S.sel = q;
  return null;
}
// ordre : aller en (x, y), ou monter dans une tour (site)
function envoyer(S, q, x, y, site){
  if (!q || q.pv <= 0) return "PAS D'ESCOUADE";
  if (q.tour){ const s = q.tour; s.b.garnison = null; q.tour = null; q.x = s.x; q.y = s.y + .35; }
  q.versTour = null;
  if (site){
    if (!site.b || site.b.k !== "tour" || !site.b.fini) return "CE N'EST PAS UNE TOUR";
    if (q.k !== "arc") return "SEULS LES ARCHERS MONTENT DANS LES TOURS";
    if (site.b.garnison && site.b.garnison !== q) return "LA TOUR EST DEJA OCCUPEE";
    q.versTour = site; x = site.x; y = site.y + .3;
  }
  q.tx = Math.max(.3, Math.min(N - .3, x)); q.ty = Math.max(.3, Math.min(N - .3, y)); q.ordre = true; q.engage = false;
  return null;
}
function gagnerXp(S, q, n){
  if (!q || q.pv <= 0) return;
  const X = S.P.xp, avant = q.grade, m0 = pvMax(S, q); q.xp += n;
  while (q.grade < 3 && q.xp >= [X.veteran, X.elite, X.heros][q.grade]) q.grade++;
  if (q.grade > avant){
    // mêmes blessures en proportion ; en passant élite, un soldat de plus, frais
    const part = q.pv / m0, elite = avant < 2 && q.grade >= 2;
    q.pv = Math.min(pvMax(S, q), elite ? part * (pvMax(S, q) - pvSoldat(S, q)) + pvSoldat(S, q) : part * pvMax(S, q));
    dire(S, ESC[q.k] + " : " + GRADES[q.grade], true); S.fx.push({k: "grade", x: q.x, y: q.y, t0: S.t});
  }
}
function pasEscouades(S, dt){
  const P = S.P;
  for (const q of S.esc){
    if (q.pv <= 0) continue;
    const E = P[q.k], pvS = pvSoldat(S, q), nv = vivants(S, q);
    if (q.tour){ q.x = q.tour.x; q.y = q.tour.y; }
    // les moines soignent les escouades proches
    if (E.soin){ q.cd -= dt; let soigne = false;
      for (const o of S.esc) if (o !== q && o.pv > 0 && o.pv < pvMax(S, o) && d2(o, q) < E.r){ o.pv = Math.min(pvMax(S, o), o.pv + E.soin * nv * dt); soigne = true; if (q.cd <= 0){ S.fx.push({k: "heal", x: o.x, y: o.y, t0: S.t}); q.cd = 1.1; } }
      q.mode = soigne ? "atk" : "idle"; }
    const portee = E.r + (q.tour ? P.tour.portee : 0);
    let cible = null, best = 99;
    for (const m of S.mons) if (m.pv > 0 && m.delai <= 0){ const d = d2(m, q); if (d < best){ best = d; cible = m; } }
    if (!q.tour){
      // un ordre de marche passe avant le combat ; sinon l'escouade attaque les monstres proches puis revient à son poste (tx, ty)
      let gx = q.tx, gy = q.ty;
      if (!E.soin && cible && best < E.r + 1.7 && !q.ordre){ q.engage = true; if (best > E.r * .9){ gx = cible.x; gy = cible.y; } else { gx = q.x; gy = q.y; } }
      else q.engage = false;
      const dx = gx - q.x, dy = gy - q.y, l = Math.hypot(dx, dy);
      if (l > .05){ const v = Math.min(l, E.v * dt); q.x += dx / l * v; q.y += dy / l * v; q.face = dx >= 0 ? 1 : -1; q.mode = "walk"; }
      else if (!E.soin) q.mode = cible && best <= portee + .1 ? "atk" : "idle";
      if (q.ordre && Math.hypot(q.tx - q.x, q.ty - q.y) <= .1){ q.ordre = false;
        if (q.versTour){ const s = q.versTour; q.versTour = null;
          if (s.b && s.b.k === "tour" && s.b.fini && !s.b.garnison){ s.b.garnison = q; q.tour = s; q.engage = false; dire(S, "ARCHERS EN GARNISON", true); } } }
      // renfort au château, hors combat
      if (!q.engage && nv < nMax(S, q) && Math.hypot(DEPOT[0] - q.x, DEPOT[1] - q.y) < 1.3){
        q.rt += dt; if (q.rt >= P.renfort.temps){ q.rt = 0; if (S.res.viande >= P.renfort.viande){ S.res.viande -= P.renfort.viande; q.pv = Math.min(pvMax(S, q), (nv + 1) * pvS); S.fx.push({k: "txt", x: q.x, y: q.y - .5, t: "+1", col: "#9fd8ff", t0: S.t}); } }
      } else q.rt = 0;
    } else q.mode = cible && best <= portee + .1 ? "atk" : "idle";
    // le coup
    if (!E.soin && cible && best <= portee + .1){
      q.face = cible.x >= q.x ? 1 : -1;
      const dmg = E.dps * nv * force(S, q) * dt * (q.k === "lance" && cible.t === "troll" ? E.troll : 1);
      cible.pv -= dmg; cible.dernier = q;
      q.cd -= dt; if (q.cd <= 0){ q.cd = .6; if (q.k === "arc") for (let i = 0; i < nv; i++) S.fx.push({k: "fleche", x0: q.x, y0: q.y - (q.tour ? 1.1 : 0), x1: cible.x, y1: cible.y, t0: S.t + i * .08}); }
    }
  }
}

/* ---------- les vagues et les monstres ---------- */
const typesVague = w => w === 1 ? ["gob"] : w === 2 ? ["gob", "lanceg"] : ["gob", "lanceg", "gnoll"];
function directions(S, w){
  if (S.dirs[w]) return S.dirs[w];
  const ds = Object.keys(CHEMINS), d = w <= 3 ? ds[(w - 1) % 3] : ds[Math.floor(S.rnd() * 3)];
  const r = [d]; if (w >= S.P.vagues.deux) r.push(ds[(ds.indexOf(d) + 1) % 3]);
  return (S.dirs[w] = r);
}
// la composition d'une vague (aussi pour l'annonce)
function composition(S, w){
  const V = S.P.vagues, types = typesVague(w), n = Math.max(1, Math.round(V.base + V.plus * (w - 1))), ds = directions(S, w), out = [];
  for (let i = 0; i < n; i++) out.push([types[i % types.length], ds[0], i * .9]);
  if (V.troll > 0 && (w % V.troll === 0 || w === V.nombre)) out.push(["troll", ds[0], n * .9 + .5]);
  if (ds[1]){ const n2 = Math.max(1, Math.round(n * .6)); for (let i = 0; i < n2; i++) out.push([types[i % types.length], ds[1], 2 + i * .9]); }
  return out;
}
function lancerVague(S){
  S.vague++; const w = S.vague, mult = 1 + S.P.vagues.force * (w - 1);
  for (const [t, d, delai] of composition(S, w)){
    const [a] = CHEMINS[d], pv = S.P[t].pv * mult;
    S.mons.push({t, x: a[0] + (S.rnd() - .5) * .5, y: a[1] + (S.rnd() - .5) * .5, dir: d, pv, pvMax: pv, delai, cd: 0, face: 1, mode: "walk", ph: S.rnd() * 3, passe: false, dernier: null});
  }
  S.prochaine = S.t + S.P.vagues.entre; S.alerte = null; S.enVague = true;
  S.stats.journal.push({vague: w, debut: S.t, pvChateau: null, pertes: 0, tues: 0, res: null});
}
function pasMonstres(S, dt){
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
    // un bâtiment sur le chemin
    let bat = null, bd = 1.15;
    for (const s of S.sites) if (s.b){ const d = Math.hypot(s.x - m.x, s.y - .2 - m.y); if (d < bd){ bd = d; bat = s; } }
    if (bat){ m.mode = "atk"; m.face = bat.x >= m.x ? 1 : -1; bat.b.pv -= MM.dps * dt; if (bat.b.pv <= 0) detruire(S, bat); continue; }
    const dc = Math.hypot(CHATEAU[0] - m.x, CHATEAU[1] - m.y);
    if (dc < 1.45){ m.mode = "atk"; m.face = CHATEAU[0] >= m.x ? 1 : -1; if (!S.triche.invincible) S.pv -= MM.dps * dt; continue; }
    if (q && best < 1.5 && m.t !== "gnoll"){ m.mode = "walk"; const dx = q.x - m.x, dy = q.y - m.y, l = Math.hypot(dx, dy) || 1; m.x += dx / l * MM.v * dt; m.y += dy / l * MM.v * dt; m.face = dx >= 0 ? 1 : -1; continue; }
    const [, b] = CHEMINS[m.dir], tgt = !m.passe && Math.hypot(b[0] - m.x, b[1] - m.y) > .15 ? b : CHATEAU; if (tgt === CHATEAU) m.passe = true;
    const dx = tgt[0] - m.x, dy = tgt[1] - m.y, l = Math.hypot(dx, dy) || 1; m.mode = "walk"; m.x += dx / l * MM.v * dt; m.y += dy / l * MM.v * dt; m.face = dx >= 0 ? 1 : -1;
  }
}

/* ---------- un pas de temps ---------- */
function pas(S, dt){
  if (S.fini) return;
  S.t += dt;
  const V = S.P.vagues;
  if (S.vague < V.nombre){
    if (!S.alerte && S.t > S.prochaine - V.alerte){
      const w = S.vague + 1, ds = directions(S, w), troll = V.troll > 0 && (w % V.troll === 0 || w === V.nombre);
      S.alerte = ds; dire(S, "VAGUE " + w + " · PAR " + ds.map(d => NOM_DIR[d]).join(" ET ") + (troll ? " · AVEC LE TROLL" : ""));
    }
    if (S.t > S.prochaine) lancerVague(S);
  }
  pasOuvriers(S, dt);
  pasEscouades(S, dt);
  pasMonstres(S, dt);
  for (const m of S.mons) if (m.pv <= 0 && !m.mort){
    m.mort = S.t; S.fx.push({k: "pouf", x: m.x, y: m.y, t0: S.t}); S.stats.tues++;
    const j = S.stats.journal[S.stats.journal.length - 1]; if (j) j.tues++;
    gagnerXp(S, m.dernier, m.pvMax * S.P.xp.parPv);
    if (m.t === "troll") dire(S, "LE TROLL EST TOMBE", true);
  }
  for (const q of S.esc) if (q.pv <= 0 && !q.mort){
    q.mort = S.t; S.fx.push({k: "pouf", x: q.x, y: q.y, t0: S.t}); if (S.sel === q) S.sel = null;
    if (q.tour){ q.tour.b && (q.tour.b.garnison = null); q.tour = null; }
    dire(S, ESC[q.k] + " ANEANTIS" + (q.grade ? " (" + GRADES[q.grade] + ")" : ""));
  }
  S.mons = S.mons.filter(m => !m.mort || S.t - m.mort < .6);
  S.esc = S.esc.filter(q => !q.mort || S.t - q.mort < .6);
  S.fx = S.fx.filter(f => S.t - f.t0 < 1.4);
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
   Une stratégie simple et régulière, pour comparer des réglages : ouvriers équilibrés (plus de bois au début),
   archerie puis maison, tour sur le chemin de la vague annoncée, escouades devant l'entrée de la prochaine vague. */
const ENTREE = {N: [4.5, 3.0], O: [3.0, 4.5], E: [6.0, 4.5]};
const SITE_TOUR = {N: [1, 2], O: [0, 4], E: [3, 7]};
function robot(S, dt){
  S._rob = (S._rob || 0) - dt; if (S._rob > 0 || S.fini) return; S._rob = .5;
  const P = S.P, nb = j => S.pawns.filter(p => p.job === j).length;
  // ouvriers
  if (S.pawns.length < maxOuv(S) && S.res.viande >= P.eco.ouvrier + 6) ajouterOuvrier(S, metierLibre(S));
  // bâtiments
  const has = k => S.sites.some(s => s.b && s.b.k === k);
  const libre = ids => (ids || [0, 1, 2, 3, 4, 5, 6, 7]).map(i => S.sites[i]).find(s => !s.b);
  const ds = S.alerte || directions(S, Math.min(P.vagues.nombre, S.vague + 1));
  if (!has("archerie")) construire(S, libre([4, 5, 6, 7]), "archerie");
  else if (nbEsc(S) >= maxEsc(S) && S.sites.filter(s => s.b && s.b.k === "maison" && !s.b.fini).length === 0) construire(S, libre([5, 6, 4, 7]), "maison");
  else if (aBatiment(S, "archerie") && S.res.bois >= 60) { const s = libre(SITE_TOUR[ds[0]]); if (s) construire(S, s, "tour"); }
  if (S.vague >= 3 && !has("caserne") && S.res.or >= 40) construire(S, libre([4, 5, 6, 7]), "caserne");
  // recrutement : archers d'abord (pour les tours), lanciers contre le troll
  const troll = S.mons.some(m => m.t === "troll" && m.pv > 0) || (P.vagues.troll > 0 && (S.vague + 1) % P.vagues.troll === 0);
  const veut = troll && debloque(S, "lance") ? "lance" : S.esc.filter(q => q.k === "arc").length < S.esc.filter(q => q.k !== "arc").length + 1 && debloque(S, "arc") ? "arc" : "guer";
  if (nbEsc(S) < maxEsc(S)) recruter(S, veut);
  S.sel = null;
  // placement : archers dans les tours libres, les autres devant l'entrée annoncée (ou partagés entre deux)
  const tours = S.sites.filter(s => s.b && s.b.k === "tour" && s.b.fini && !s.b.garnison);
  let i = 0;
  for (const q of S.esc){
    if (q.pv <= 0 || q.tour || q.versTour) continue;
    if (q.k === "arc" && tours.length){ envoyer(S, q, 0, 0, tours.shift()); continue; }
    const blesse = vivants(S, q) < nMax(S, q) - 1 && !S.enVague;
    const [ex, ey] = blesse ? DEPOT : ENTREE[ds[i % ds.length]]; i++;
    const recul = q.k === "arc" || q.k === "moine" ? .35 : 0, cx = ex + (CHATEAU[0] - ex) * recul, cy = ey + (CHATEAU[1] - ey) * recul;
    if (Math.hypot(q.tx - cx, q.ty - cy) > .5 && !q.engage) envoyer(S, q, cx + (S.rnd() - .5) * .4, cy + (S.rnd() - .5) * .4);
  }
}
// une partie complète jouée par le robot (simulateur) : résultat résumé
function simuler(mods, graine, tMax){
  const S = creer(mods, graine);
  while (!S.fini && S.t < (tMax || 1200)){ robot(S, .05); pas(S, .05); S.evts.length = 0; }
  return {fini: S.fini || "temps", vague: S.vague, pv: Math.round(S.pv), t: Math.round(S.t), tues: S.stats.tues, pertes: S.stats.pertes, journal: S.stats.journal};
}

const api = {DEFAUT, ESC, MONS, BAT, DEBLOQUE, GRADES, RES, CARTE, N, CHATEAU, DEPOT, CHEMINS, NOM_DIR, SITES,
  reglages, ecarts, creer, pas, ajouterOuvrier, metierLibre, metier, construire, recruter, envoyer, vagueMaintenant, composition, directions,
  maxEsc, maxOuv, nbEsc, debloque, cout, peutPayer, vivants, nMax, pvMax, pvSoldat, robot, simuler, maisons};
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.BastionRegles = api;
})();

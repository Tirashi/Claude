/* =====================================================================
   DRAGON SIMULATOR · les RÈGLES (logique pure, sans Three.js ni DOM) :
   vol plané, feu, destruction, pièces, obstacles, dix bonus, décors
   (ville et aéroport en alternance), nid (améliorations), sauvegarde.
   Tout tourne en « pixels » comme la maquette : 12 px = 1 unité 3D,
   sol à DS_SOL ; une image = 1/60 s.
   Tout l'aléatoire passe par le générateur à graine rangé DANS la
   partie (p.ra) : aucun Math.random(), et une partie sauvegardée en
   JSON reprend exactement pareil.
   - Dans la page : script classique (portée globale, noms préfixés
     ds / DS_), lu par monde3d.js et jeu.js.
   - Dans Node : outils/dragon-simulateur.js le charge (vm).
   Cahier des charges : specs/dragon-simulator.md.
   ===================================================================== */
'use strict';
const DS_V = 1;
const DS_U = 12, DS_SOL = 268;                 // 12 px = 1 unité 3D ; le sol
const DS_IPS = 60;                             // images par seconde
const DS_PX_M = 8;                             // 8 px = 1 mètre
const DS_BIOMES = ['ville', 'aeroport'];
const DS_NOM_BIOME = { ville: 'LA VILLE', aeroport: "L'AEROPORT" };
const DS_LONG_BIOME = 3200;                    // 400 m par décor
const DS_M_PIECE = 20;                         // 1 pièce tous les 20 m
const DS_COUT_AILES = 2.5;                     // énergie d'un coup d'ailes

/* ---------- hasard à graine, état dans la partie ---------- */
function dsGraine(s) { let h = 2166136261; for (const ch of String(s)) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 13; } return h >>> 0; }
function dsAlea(p) { let a = p.ra = (p.ra + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
const dsEntre = (p, a, b) => a + Math.floor(dsAlea(p) * (b - a + 1));
const dsReel = (p, a, b) => a + dsAlea(p) * (b - a);
function dsPondere(p, poids) { let t = 0; for (const k in poids) t += poids[k]; let x = dsAlea(p) * t; for (const k in poids) { x -= poids[k]; if (x < 0) return k; } return Object.keys(poids)[0]; }
const dsBorne = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- tailles des modèles (unités 3D, largeur × hauteur, mesurées dans la maquette) ---------- */
const DS_TAILLES = {
  building_A_withoutBase: [1.207, 1.55], building_B_withoutBase: [1.607, 1.55], building_C_withoutBase: [1.207, 2.25],
  building_D_withoutBase: [1.607, 2.25], building_E_withoutBase: [2.007, 2.25], building_F_withoutBase: [2.007, 2.25],
  building_G_withoutBase: [2.007, 2.25], building_H_withoutBase: [2.007, 2.95],
  ks_house01: [1.3, 0.738], ks_house03: [1.708, 1.138], ks_house05: [1.308, 0.738], ks_house07: [1.3, 0.738],
  ks_house09: [1.3, 0.834], ks_house11: [1.258, 1.138], ks_house13: [1.35, 1], ks_house15: [0.904, 1.15],
  ks_house17: [1.406, 1.138], ks_house19: [1.2, 0.85], ks_house21: [0.858, 1.034],
  air_small_hangar: [14.6, 6],
};
const DS_IMMEUBLES = 'ABCDEFGH'.split('').map(l => 'building_' + l + '_withoutBase');
const DS_MAISONS = ['01', '03', '05', '07', '09', '11', '13', '15', '17', '19', '21'].map(n => 'ks_house' + n);
const DS_K_MAISON = 1.7, DS_K_PETIT_HANGAR = 0.26;
const DS_VOITURES = ['car_taxi', 'car_police', 'car_sedan', 'car_hatchback', 'car_stationwagon', 'kc_ambulance', 'kc_firetruck', 'kc_garbage-truck', 'kc_police', 'kc_taxi', 'kc_delivery', 'kc_truck', 'kc_race', 'kc_suv', 'kc_van', 'qv_Cop', 'qv_SportsCar', 'qv_SUV', 'qv_Taxi', 'qv_NormalCar1', 'qv_NormalCar2'];
const DS_ENGINS_AEROPORT = ['kc_tractor', 'kc_van', 'kc_truck', 'kc_delivery'];
const DS_ANIMAUX = ['an_Cow', 'an_Horse', 'an_Llama', 'an_Pig', 'an_Sheep', 'an_Zebra'];
// le nid : en haut de trois immeubles C
const DS_NID_Y = DS_SOL - (3 * DS_TAILLES.building_C_withoutBase[1] + 0.2) * DS_U - 12;

/* ---------- le nid : améliorations (§ 9) ---------- */
const DS_AMELIORATIONS = [
  { id: 'ecailles', nom: 'ECAILLES', aide: 'UN COEUR DE PLUS' },
  { id: 'flammes', nom: 'FLAMMES', aide: 'LE FEU BRULE PLUS FORT' },
  { id: 'reserve', nom: 'RESERVE DE FEU', aide: 'PLUS DE FEU' },
  { id: 'ailes', nom: 'AILES', aide: 'PLANE PLUS LONGTEMPS' },
];
const DS_NIV_MAX = 5;
const DS_COUT = [0, 40, 80, 140, 220];          // coût pour passer du niveau n au niveau n+1 : DS_COUT[n]
function dsStats(niv) {
  return {
    coeurs: 1 + niv.ecailles,                   // 2 au niveau 1
    force: 0.6 + 0.3 * niv.flammes,             // dégâts du feu
    feuMax: 30 + 15 * niv.reserve,              // 45 au niveau 1
    drain: 0.05 * (1 - 0.13 * (niv.ailes - 1)), // énergie perdue par image
    chute: 1 - 0.1 * (niv.ailes - 1),           // gravité et vitesse de chute planée
  };
}
function dsPrix(sauv, id) { const n = sauv.niv[id]; return n >= DS_NIV_MAX ? null : DS_COUT[n]; }
function dsAcheter(sauv, id) {
  const c = dsPrix(sauv, id); if (c === null || sauv.pieces < c) return false;
  sauv.pieces -= c; sauv.niv[id]++; return true;
}

/* ---------- les bonus (§ 8) ---------- */
const DS_BONUS = {
  pieces:   { nom: '+5', poids: 24 },
  jetpack:  { nom: 'JETPACK !', poids: 13 },
  lance:    { nom: 'FEU !', poids: 13 },
  grenade:  { nom: 'GRENADE', poids: 10 },
  bebe:     { nom: 'BEBE DRAGON !', poids: 7 },
  souffle:  { nom: 'SUPER-SOUFFLE !', poids: 7 },
  orage:    { nom: 'ORAGE !', poids: 8 },
  bouclier: { nom: 'BOUCLIER', poids: 8 },
  aimant:   { nom: 'AIMANT', poids: 5 },
  oeuf:     { nom: 'OEUF D\'OR !', poids: 5 },
};
const DS_DUREE = { jetpack: 150, bebe: 900, souffle: 300, aimant: 600, oeuf: 600 }; // en images
const DS_POIDS_BONUS = Object.fromEntries(Object.entries(DS_BONUS).map(([k, b]) => [k, b.poids]));

/* ---------- sauvegarde (§ 12) ---------- */
function dsNouvelleSauvegarde() {
  return { v: DS_V, pieces: 0, niv: { ecailles: 1, flammes: 1, reserve: 1, ailes: 1 }, decors: ['ville'], depart: 'ville',
    records: { distance: 0, pieces: 0 }, total: { parties: 0, batiments: 0, pieces: 0, distance: 0 } };
}
function dsMigrer(s) {
  const n = dsNouvelleSauvegarde();
  if (!s || typeof s !== 'object') return n;
  const r = Object.assign(n, s, { v: DS_V });
  r.niv = Object.assign({}, n.niv, s.niv); for (const a of DS_AMELIORATIONS) r.niv[a.id] = dsBorne(Math.floor(+r.niv[a.id]) || 1, 1, DS_NIV_MAX);
  r.records = Object.assign({ distance: 0, pieces: 0 }, s.records); r.total = Object.assign({ parties: 0, batiments: 0, pieces: 0, distance: 0 }, s.total);
  r.decors = (Array.isArray(s.decors) ? s.decors : []).filter(b => DS_BIOMES.includes(b)); if (!r.decors.includes('ville')) r.decors.unshift('ville');
  if (!r.decors.includes(r.depart)) r.depart = 'ville';
  r.pieces = Math.max(0, Math.floor(+r.pieces) || 0);
  return r;
}

/* ---------- une partie ---------- */
function dsNouvellePartie(sauv, graine) {
  const b0 = Math.max(0, DS_BIOMES.indexOf(sauv.depart));
  const s = dsStats(sauv.niv);
  const p = {
    v: DS_V, graine: String(graine), ra: dsGraine(graine), t: 0, nid: 1, b0, s,
    d: { x: 0, y: DS_NID_Y, vx: 0, vy: 0, ang: 0, f: 0, pose: true },
    lancer: 30, coeurs: s.coeurs, energie: 100, feu: s.feuMax, gren: 0, pieces: 0, dist: 0, inv: 0, ko: false, fin: null,
    jet: 0, souffle: 0, bebe: 0, bouclier: 0, aimant: 0, oeuf: 0,
    biome: DS_BIOMES[b0], detruits: 0, voitures: 0, chauves: 0, bonusPris: 0, mPayes: 0,
    bat: [], obs: [], bonus: [], route: [],
    nb: 40, nr: -264, no: 320, np: 170,
    flamme: null, flammeBebe: null, ev: [],
  };
  dsGenerer(p);
  return p;
}
function dsBiome(p, x) { return DS_BIOMES[(p.b0 + Math.floor(Math.max(0, x) / DS_LONG_BIOME)) % DS_BIOMES.length]; }
const dsEv = (p, t, o) => p.ev.push(Object.assign({ t }, o));

/* ---------- génération (§ 5, § 7, § 8) : bâtiments à brûler, route, obstacles, bonus ---------- */
function dsGenerer(p) {
  const loin = p.d.x + 200;
  while (p.nb < loin) {                                    // rangée de devant (bâtiments à brûler)
    const bi = dsBiome(p, p.nb); let o;
    if (bi === 'ville' && dsAlea(p) < 0.3) {
      const m = DS_MAISONS[dsEntre(p, 0, DS_MAISONS.length - 1)], [w, h] = DS_TAILLES[m];
      o = { modele: m, k: DS_K_MAISON, w: w * DS_K_MAISON * DS_U, h: h * DS_K_MAISON * DS_U, arbre: dsAlea(p) < 0.5 ? 'ks_tree' : 'ks_tree2', ecart: dsEntre(p, 8, 16) };
    } else if (bi === 'ville') {
      const m = DS_IMMEUBLES[dsEntre(p, 0, 7)], [w, h] = DS_TAILLES[m];
      o = { modele: m, k: 1, w: w * DS_U, h: h * DS_U, ecart: dsEntre(p, 3, 12) };
    } else {
      const r = dsAlea(p);
      if (r < 0.25) { const [w, h] = DS_TAILLES.air_small_hangar; o = { modele: 'air_small_hangar', k: DS_K_PETIT_HANGAR, w: w * DS_K_PETIT_HANGAR * DS_U, h: h * DS_K_PETIT_HANGAR * DS_U }; }
      else if (r < 0.45) { const w = dsEntre(p, 30, 40) / 10; o = { modele: 'hangar', l3: w, w: w * DS_U, h: (1 + w * 0.275) * DS_U }; }
      else if (r < 0.7) { const w = dsEntre(p, 30, 44) / 10; o = { modele: 'terminal', l3: w, w: w * DS_U, h: 1.9 * DS_U }; }
      else o = { modele: 'avion', couleur: dsEntre(p, 0, 2), w: 3.6 * DS_U, h: 1.3 * DS_U };
      o.ecart = dsEntre(p, 6, 18);
    }
    o.id = p.nid++; o.x = p.nb; o.biome = bi; o.hp = o.mx = o.h * 0.32; o.gain = Math.ceil(o.h / 10); o.brule = 0; o.mort = false;
    p.nb += o.w + o.ecart; delete o.ecart; p.bat.push(o);
  }
  while (p.nr < loin) {                                    // la route : véhicules et animaux, par tronçons de 24 px
    const bi = dsBiome(p, p.nr), x = p.nr + DS_U;
    if (bi === 'ville') {
      if (dsAlea(p) < 0.3) { const sens = dsAlea(p) < 0.5 ? 1 : -1; p.route.push({ id: p.nid++, t: 'voiture', modele: DS_VOITURES[dsEntre(p, 0, DS_VOITURES.length - 1)], x, z: 2.3 + sens * 0.5, sens, v: sens * dsReel(p, 0.24, 0.6), mort: false }); }
      if (dsAlea(p) < 0.07) { const sens = dsAlea(p) < 0.5 ? 1 : -1; p.route.push({ id: p.nid++, t: 'animal', modele: 'an_Pug', x, z: 1.35, sens, v: sens * dsReel(p, 0.05, 0.14), peur: 0 }); }
    } else {
      if (dsAlea(p) < 0.1) p.route.push({ id: p.nid++, t: 'voiture', modele: DS_ENGINS_AEROPORT[dsEntre(p, 0, 3)], x, z: 0.9, sens: dsAlea(p) < 0.5 ? 1 : -1, v: 0, mort: false });
      if (dsAlea(p) < 0.3) { const sens = dsAlea(p) < 0.5 ? 1 : -1; p.route.push({ id: p.nid++, t: 'animal', modele: DS_ANIMAUX[dsEntre(p, 0, 5)], x, z: dsReel(p, 4.3, 5.6), sens, v: sens * dsReel(p, 0.05, 0.14), peur: 0 }); }
    }
    p.nr += 24;
  }
  while (p.no < loin + 80) {                               // obstacles
    const bi = dsBiome(p, p.no), r = dsAlea(p); let o;
    if (r >= 0.22 && r < 0.36) o = { t: 'chauve', x: p.no + 60, y: dsEntre(p, 50, 160), vx: -0.5, mort: false };
    else if (r < 0.22) o = { t: 'helico', x: p.no + 80, y: dsEntre(p, 55, 150), vx: -0.7 };
    else if (bi === 'ville') {
      if (r < 0.7) o = { t: 'grue', x: p.no, haut: DS_SOL - dsEntre(p, 120, 175) };
      else o = { t: 'ballon', x: p.no, y: dsEntre(p, 50, 170), couleur: dsEntre(p, 0, 2) };
    } else {
      if (r < 0.4) o = { t: 'tour', x: p.no, haut: DS_SOL - dsEntre(p, 110, 160) };
      else if (r < 0.75) o = { t: 'avion', x: p.no + 120, y: dsEntre(p, 60, 170), vx: -1.1 };
      else o = { t: 'ballon', x: p.no, y: dsEntre(p, 50, 170), couleur: dsEntre(p, 0, 2) };
    }
    o.id = p.nid++; o.y0 = o.y; p.obs.push(o);
    p.no += dsEntre(p, 170, 280) - Math.min(70, p.dist * 0.1);
  }
  while (p.np < loin) {                                    // bonus dans le ciel
    p.bonus.push({ id: p.nid++, t: dsPondere(p, DS_POIDS_BONUS), x: p.np, y: dsEntre(p, 40, 190), pris: false });
    p.np += dsEntre(p, 90, 170);
  }
  const lim = p.d.x - 200, garde = o => o.x + (o.w || 60) >= lim && !o.pris;
  p.bat = p.bat.filter(garde); p.obs = p.obs.filter(garde); p.bonus = p.bonus.filter(garde); p.route = p.route.filter(garde);
}

/* ---------- pièces (l'œuf d'or double tout) ---------- */
function dsGagner(p, n, x, y) { if (p.oeuf > 0) n *= 2; p.pieces += n; dsEv(p, 'pieces', { n, x, y }); }

/* ---------- destruction (§ 6) ---------- */
function dsDetruire(p, o, cause) {
  if (o.mort) return; o.mort = true; p.detruits++;
  dsGagner(p, o.gain, o.x + o.w / 2, DS_SOL - o.h);
  dsEv(p, 'detruit', { id: o.id, x: o.x + o.w / 2, cause });
  if (p.gren > 0) {                                        // grenade : souffle tout à moins de 50 px
    p.gren--; const cx = o.x + o.w / 2; dsEv(p, 'grenade', { x: cx });
    for (const b of p.bat) if (!b.mort && Math.abs(b.x + b.w / 2 - cx) < 50) { b.mort = true; p.detruits++; dsGagner(p, b.gain, b.x + b.w / 2, DS_SOL - b.h); dsEv(p, 'detruit', { id: b.id, x: b.x + b.w / 2, cause: 'grenade' }); }
    for (const v of p.route) if (Math.abs(v.x - cx) < 50) dsToucherRoute(p, v);
  }
}
function dsToucherRoute(p, v) {
  if (v.t === 'animal') { if (v.peur < 60) dsEv(p, 'peur', { id: v.id }); v.peur = 90; return; }
  if (v.mort) return; v.mort = true; p.voitures++; dsGagner(p, 3, v.x, DS_SOL - 10); dsEv(p, 'voiture', { id: v.id, x: v.x });
}
// une flamme : de (ox, oy) dans la direction a (vers le bas quand a > 0), sur une portée, avec des dégâts par image
function dsFlamme(p, ox, oy, a, portee, degats) {
  const touches = new Set();
  for (let k = 8; k <= portee; k += 6) {
    const px = ox + Math.cos(a) * k, py = oy + Math.sin(a) * k;
    if (py > DS_SOL) break;
    for (const o of p.bat) if (!o.mort && px > o.x && px < o.x + o.w && py > DS_SOL - o.h) touches.add(o);
    for (const o of p.obs) if (o.t === 'chauve' && !o.mort && Math.hypot(px - o.x, py - o.y) < 13) { o.mort = true; p.chauves++; dsGagner(p, 4, o.x, o.y); dsEv(p, 'chauve', { id: o.id, x: o.x, y: o.y }); }
    if (py > DS_SOL - 18) for (const v of p.route) if (!v.mort && Math.abs(px - v.x) < 10) dsToucherRoute(p, v);
  }
  for (const o of touches) { o.hp -= degats; o.brule = 40; if (o.hp <= 0) dsDetruire(p, o, 'feu'); }
}

/* ---------- chocs ---------- */
function dsChoc(p) {
  if (p.inv > 0 || p.ko) return false;
  if (p.bouclier) { p.bouclier = 0; p.inv = 40; dsEv(p, 'bouclier', { x: p.d.x, y: p.d.y }); return true; }
  p.coeurs--; p.inv = 70; dsEv(p, 'choc', { x: p.d.x, y: p.d.y });
  if (p.coeurs <= 0) { p.ko = true; p.energie = 0; dsEv(p, 'ko', {}); }
  return true;
}

/* ---------- bonus ramassé ---------- */
function dsPrendre(p, b) {
  b.pris = true; p.bonusPris++; dsEv(p, 'bonus', { id: b.id, b: b.t, x: b.x, y: b.y });
  const d = p.d;
  switch (b.t) {
    case 'pieces': dsGagner(p, 5, b.x, b.y); break;
    case 'jetpack': p.jet = DS_DUREE.jetpack; p.energie = Math.min(100, p.energie + 35); break;
    case 'lance': p.feu = p.s.feuMax; break;
    case 'grenade': p.gren++; break;
    case 'bebe': p.bebe = DS_DUREE.bebe; break;
    case 'souffle': p.souffle = DS_DUREE.souffle; break;
    case 'bouclier': p.bouclier = 1; break;
    case 'aimant': p.aimant = DS_DUREE.aimant; break;
    case 'oeuf': p.oeuf = DS_DUREE.oeuf; break;
    case 'orage': {                                        // rebond vers le haut + éclair sur le bâtiment en dessous (ou juste devant)
      d.vy = -3.2; let cible = null, best = 1e9;
      for (const o of p.bat) { if (o.mort) continue; const dx = Math.abs(o.x + o.w / 2 - (d.x + 20)); if (dx < 80 && dx < best) { best = dx; cible = o; } }
      dsEv(p, 'eclair', { x: cible ? cible.x + cible.w / 2 : d.x, id: cible ? cible.id : 0 });
      if (cible) dsDetruire(p, cible, 'eclair');
      break;
    }
  }
}

/* ---------- la bouche du dragon (d'après l'os dragon_Nose de la maquette) ---------- */
function dsBouche(d) { const c = Math.cos(d.ang), s = Math.sin(d.ang); return { x: d.x + 2 + 8 * c - 4 * s, y: d.y + 8 * s + 4 * c }; }
function dsPosBebe(d) { return { x: d.x - 22, y: d.y + 18 }; }

/* ---------- une image (§ 4) ; e = { ailes: un coup d'ailes demandé, feu: bouton FEU tenu } ---------- */
function dsPas(p, e) {
  p.ev.length = 0; p.flamme = p.flammeBebe = null;
  if (p.fin) return;
  const d = p.d, s = p.s; p.t++;
  if (p.lancer > 0) { if (--p.lancer === 0) { d.pose = false; d.vx = 2; d.vy = -2.3; d.f = 14; dsEv(p, 'envol', {}); } return; }
  if (e && e.ailes && p.energie > 3 && !p.ko) { d.vy = Math.min(d.vy, 0.2) - 1.45; d.vx = Math.min(d.vx + 0.12, 3); p.energie -= DS_COUT_AILES; d.f = 14; dsEv(p, 'ailes', {}); }
  if (d.f > 0) d.f--;
  if (p.jet > 0) { p.jet--; d.vy -= 0.085; d.vx = Math.min(d.vx + 0.02, 3.2); }
  d.vy += 0.045 * s.chute;
  const vmax = (p.energie > 0 && !p.ko) ? 0.55 * s.chute + 0.15 : 1.8; if (d.vy > vmax) d.vy += (vmax - d.vy) * 0.12;
  d.vx += (1.7 - d.vx) * 0.004; d.x += d.vx; d.y += d.vy; if (d.y < 14) { d.y = 14; if (d.vy < 0) d.vy = 0; }
  d.ang = dsBorne(Math.atan2(d.vy, d.vx) * 0.9, -0.6, 0.7);
  p.energie = Math.max(0, p.energie - (p.jet > 0 ? 0 : s.drain));
  for (const k of ['souffle', 'bebe', 'aimant', 'oeuf']) if (p[k] > 0) p[k]--;
  p.dist = d.x / DS_PX_M;
  while (p.mPayes + DS_M_PIECE <= p.dist) { p.mPayes += DS_M_PIECE; dsGagner(p, 1, d.x, d.y - 14); }
  const bi = dsBiome(p, d.x); if (bi !== p.biome) { p.biome = bi; dsEv(p, 'biome', { b: bi }); }
  dsGenerer(p);
  // ce qui bouge
  for (const o of p.obs) {
    if (o.t === 'ballon') o.y += Math.sin(p.t * 0.03 + o.x) * 0.2;
    else if (o.t === 'avion') { o.x += o.vx; o.y -= 0.12; }
    else if (o.t === 'helico') { o.x += o.vx; o.y += Math.sin(p.t * 0.05 + o.x * 0.1) * 0.25; }
    else if (o.t === 'chauve') { if (o.mort) { if (o.y < DS_SOL - 6) { o.y += 2.2; o.x += 0.4; } } else { o.x += o.vx; o.y += Math.sin(p.t * 0.09 + o.x * 0.2) * 0.6; } }
  }
  for (const v of p.route) { if (v.mort) continue; let f = 1; if (v.peur > 0) { v.peur--; f = 4; } v.x += v.v * f; }
  for (const o of p.bat) if (o.brule > 0) o.brule--;
  // le feu du dragon
  const fort = p.souffle > 0;
  if (e && e.feu && (p.feu > 0 || fort) && !p.ko) {
    if (!fort) p.feu = Math.max(0, p.feu - 0.25);
    const b = dsBouche(d), a = dsBorne(d.ang + 0.8, 0.5, 1.25), portee = fort ? 224 : 112;
    p.flamme = { x: b.x, y: b.y, a, portee, fort };
    dsFlamme(p, b.x, b.y, a, portee, s.force * 0.9 * (fort ? 3 : 1));
  }
  // le bébé dragon crache tout seul sur ce qui est devant lui
  if (p.bebe > 0 && !p.ko) {
    const bb = dsPosBebe(d); let vise = false;
    for (const o of p.bat) { const dx = o.x + o.w / 2 - bb.x, dy = DS_SOL - o.h - bb.y; if (!o.mort && dx > 0 && dx < 70 && dy > 0 && dy < 90) { vise = true; break; } }
    if (!vise) for (const o of p.obs) if (o.t === 'chauve' && !o.mort && o.x - bb.x > 4 && o.x - bb.x < 50) { vise = true; break; }
    if (vise) { p.flammeBebe = { x: bb.x + 4, y: bb.y + 2, a: 0.8, portee: 70 }; dsFlamme(p, bb.x + 4, bb.y + 2, 0.8, 70, s.force * 0.5); }
  }
  // aimant : les bonus proches viennent au dragon (pas les nuages d'orage)
  if (p.aimant > 0) for (const b of p.bonus) { if (b.pris || b.t === 'orage') continue; const dx = d.x - b.x, dy = d.y - b.y, l = Math.hypot(dx, dy); if (l < 110 && l > 0.1) { const v = Math.min(l, 4); b.x += dx / l * v; b.y += dy / l * v; } }
  // chocs (§ 7)
  if (p.inv === 0 && !p.ko) {
    for (const o of p.obs) {
      if (o.t === 'grue') { if ((d.x > o.x - 3 && d.x < o.x + 7 && d.y > o.haut - 2) || (d.x > o.x - 36 && d.x < o.x + 18 && Math.abs(d.y - (o.haut + 1)) < 5)) { if (dsChoc(p)) d.vy = -1.6; } }
      else if (o.t === 'tour') { if (d.x > o.x - 10 && d.x < o.x + 10 && d.y > o.haut - 26) { if (dsChoc(p)) d.vy = -1.6; } }
      else if (o.t === 'avion' || o.t === 'helico' || o.t === 'chauve') { if (!o.mort && Math.abs(d.x - o.x) < (o.t === 'chauve' ? 13 : 20) && Math.abs(d.y - o.y) < 10) { if (dsChoc(p)) d.vy = 1; } }
      else if (Math.hypot(d.x - o.x, d.y - o.y) < 12) { if (dsChoc(p)) d.vy = 1; }
      if (p.inv > 0) break;
    }
    if (p.inv === 0) for (const o of p.bat) if (!o.mort && d.x + 6 > o.x && d.x - 6 < o.x + o.w && d.y + 5 > DS_SOL - o.h) { if (dsChoc(p)) d.vy = -1.6; break; }
  }
  if (p.inv > 0) p.inv--;
  for (const b of p.bonus) if (!b.pris && Math.hypot(d.x - b.x, d.y - b.y) < 13) dsPrendre(p, b);
  if (d.y > DS_SOL - 8) { d.y = DS_SOL - 8; d.ang = 0; p.fin = p.ko ? 'chute' : 'atterri'; dsEv(p, 'fin', { raison: p.fin }); }
}

/* ---------- fin de partie : pièces au nid, records, décors atteints ---------- */
function dsTerminer(sauv, p) {
  if (p.paye) return p.paye;
  const dist = Math.floor(p.dist), bilan = { distance: dist, pieces: p.pieces, batiments: p.detruits, raison: p.fin,
    recordDistance: dist > sauv.records.distance, recordPieces: p.pieces > sauv.records.pieces, nouveauxDecors: [] };
  sauv.pieces += p.pieces;
  if (bilan.recordDistance) sauv.records.distance = dist;
  if (bilan.recordPieces) sauv.records.pieces = p.pieces;
  sauv.total.parties++; sauv.total.batiments += p.detruits; sauv.total.pieces += p.pieces; sauv.total.distance += dist;
  for (let k = 0; k <= Math.floor(p.d.x / DS_LONG_BIOME); k++) { const b = DS_BIOMES[(p.b0 + k) % DS_BIOMES.length]; if (!sauv.decors.includes(b)) { sauv.decors.push(b); bilan.nouveauxDecors.push(b); } }
  return p.paye = bilan;
}

/* ---------- pilote automatique (démo de l'écran titre, simulateur) ----------
   adresse 0..1 : 1 = la démo de la maquette ; plus bas, il rate des coups d'ailes et tire moins bien. */
function dsPilote(p, adresse, alea) {
  const d = p.d, loin = 130 + 90 * adresse; let cible = 176;
  for (const o of p.obs) {
    const dx = o.x - d.x; if (dx <= -40 || dx >= loin) continue;
    if (o.t === 'grue' || o.t === 'tour') cible = Math.min(cible, o.haut - 28);
    else if (o.t === 'helico' || o.t === 'avion' || o.t === 'chauve') { if (!o.mort && Math.abs(o.y - cible) < 34) cible = o.y + 36 < DS_SOL - 60 ? o.y + 36 : o.y - 34; }
    else if (Math.abs(o.y - cible) < 30) cible = o.y - 34;
  }
  for (const b of p.bat) { const dx = b.x - d.x; if (dx > -14 && dx < 50 && !b.mort) cible = Math.min(cible, DS_SOL - b.h - 40); }
  cible = Math.max(cible, 30);
  const e = { ailes: false, feu: false };
  const presse = d.y - cible > 30 ? 1.1 : 0;                // loin sous la cible : il tape plus vite
  if (d.y > cible && d.vy > -0.3 - presse && p.t % 6 === 0 && alea() < 0.45 + 0.55 * adresse) e.ailes = true;
  let vise = false;
  for (const b of p.bat) { const dx = b.x + b.w / 2 - d.x, dy = DS_SOL - b.h - d.y; if (!b.mort && dx > 4 && dx < 95 && dy > 0 && dy < 100) vise = true; }
  for (const o of p.obs) if (o.t === 'chauve' && !o.mort && o.x - d.x > 8 && o.x - d.x < 70 && o.y > d.y) vise = true;
  e.feu = vise && (p.feu > 0 || p.souffle > 0) && alea() < 0.3 + 0.7 * adresse;
  return e;
}

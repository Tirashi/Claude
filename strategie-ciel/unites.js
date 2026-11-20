/* =====================================================================
   STRATEGIE SPATIALE (nom provisoire) · les UNITES : types, ordres (aller, attaquer, miner),
   combat, minage, production du porte-vaisseaux, vagues ennemies qui entrent par la porte d'ALTAIR.
   ===================================================================== */
'use strict';
const PI = Math.PI;
// L : longueur affichée (m) ; v : vitesse (m/s) ; portee, deg (dégâts par tir), cad (secondes entre deux tirs) ; alt : altitude de vol
const TYPES = {
  pv:         { nom: 'PORTE-VAISSEAUX', mod: 'fga_croiseur1', rot: -PI / 2, L: 330, vie: 3000, v: 6, portee: 380, deg: 12, cad: .5, alt: 110, gros: 1 },
  collecteur: { nom: 'COLLECTEUR', mod: 'py16', rot: PI, L: 26, vie: 60, v: 48, alt: 60, prix: 30, temps: 8, cap: 20, mine: 5, cle: 'T' },
  chasseur:   { nom: 'CHASSEUR', mod: 'py2', rot: PI, L: 14, vie: 45, v: 90, portee: 150, deg: 4, cad: .35, alt: 80, prix: 40, temps: 10, vole: 1, cle: 'Q' },
  bombardier: { nom: 'BOMBARDIER', mod: 'py35', rot: PI, L: 34, vie: 120, v: 58, portee: 210, deg: 20, cad: 1.6, alt: 72, prix: 80, temps: 16, antigros: 1, vole: 1, cle: 'W' },
  destroyer:  { nom: 'DESTROYER', mod: 'fga_destroyer2', rot: -PI / 2, L: 110, vie: 900, v: 15, portee: 340, deg: 15, cad: .6, alt: 92, prix: 220, temps: 32, gros: 1, cle: 'E' },
  r_chasseur: { nom: 'CHASSEUR ROUGE', mod: 'py13', rot: PI, L: 16, vie: 40, v: 85, portee: 150, deg: 4, cad: .35, alt: 82, vole: 1, camp: 1 },
  r_corvette: { nom: 'CORVETTE', mod: 'fga_corvette1_r', rot: -PI / 2, L: 40, vie: 170, v: 42, portee: 210, deg: 14, cad: 1, alt: 70, antigros: 1, camp: 1 },
  r_fregate:  { nom: 'FREGATE', mod: 'fga_fregate1_r', rot: -PI / 2, L: 60, vie: 420, v: 24, portee: 300, deg: 13, cad: .6, alt: 88, camp: 1 },
  r_destroyer:{ nom: 'DESTROYER ROUGE', mod: 'fga_destroyer1', rot: -PI / 2, L: 115, vie: 1300, v: 14, portee: 360, deg: 18, cad: .55, alt: 96, gros: 1, camp: 1 }};
const PRODUITS = ['collecteur', 'chasseur', 'bombardier', 'destroyer'];
// vagues : composition, et temps avant leur arrivée par la porte (secondes de jeu)
const VAGUES = [{ r_chasseur: 4 }, { r_chasseur: 6 }, { r_chasseur: 5, r_corvette: 2 }, { r_chasseur: 6, r_corvette: 3 }, { r_chasseur: 6, r_corvette: 2, r_fregate: 1 },
  { r_chasseur: 8, r_corvette: 3, r_fregate: 2 }, { r_chasseur: 8, r_corvette: 4, r_fregate: 2 }, { r_chasseur: 10, r_corvette: 4, r_fregate: 2, r_destroyer: 1 }];
const PREMIERE_VAGUE = 120, ENTRE_VAGUES = 100;

let U = [], ID = 0;
const S = { cristal: 300, vague: 0, prochaine: PREMIERE_VAGUE, file: [], fileT: 0, detruits: 0, perdus: 0, mine: 0, fin: null, ralliement: null };
const TEMPS = { t: 0, r: 0 };
const vivant = u => u && u.vie > 0;
const ennemis = c => U.filter(u => u.camp !== c && u.vie > 0);
const yawVers = (dx, dz) => Math.atan2(-dx, -dz);
function cree(type, pos, o = {}){ const T = TYPES[type], camp = T.camp || 0;
  const k = T.mod + (T.mod.startsWith('py') ? (camp ? '_r' : '_b') : '');
  const u = Object.assign({ id: ++ID, type, T, camp, vie: T.vie, pos: pos.clone(), yaw: camp ? PI / 2 : -PI / 2, cd: Math.random() * (T.cad || 1), ordre: { k: 'rien' }, cible: null, charge: 0, ph: Math.random() * 6.283, a: Math.random() * 6.283, sel: false, g: importe(k, T.rot, T.L) }, o);
  u.pos.y = T.alt + (Math.random() - .5) * 16; u.g.position.copy(u.pos); sc.add(u.g);
  u.anneau = new THREE.Mesh(geoAnneau, matSel[0]); u.anneau.renderOrder = 3; u.anneau.scale.setScalar(Math.max(18, T.L * .62)); u.anneau.visible = false; sc.add(u.anneau);
  U.push(u); return u; }
function meurt(u){ if (u.mort) return; u.mort = 1; u.vie = 0; explosion(u.pos, u.T.L); sc.remove(u.g); sc.remove(u.anneau); u.sel = false;
  if (u.camp) S.detruits++; else S.perdus++;
  if (u.type === 'pv' && !S.fin) S.fin = { gagne: false, raison: 'LE PORTE-VAISSEAUX AURORE EST DETRUIT' }; }

// ---------- ordres ----------
function ordonner(liste, k, cible, p){ const n = liste.length; if (!n) return;
  // formation : les unités se répartissent autour du point (spirale), les grosses plus espacées
  liste.forEach((u, i) => { if (u.type === 'pv' && k === 'miner') return;
    if (k === 'miner' && u.type !== 'collecteur'){ k2(u, 'aller'); return; }
    function k2(v, kk){ const a = i * 2.4, r = n > 1 ? 30 + Math.sqrt(i) * (v.T.gros ? 140 : 34) : 0; v.ordre = { k: kk, cible: kk === 'attaquer' ? cible : null, p: p ? p.clone().add(V3(Math.cos(a) * r, 0, Math.sin(a) * r)) : null }; v.cible = kk === 'attaquer' ? cible : null; }
    if (k === 'miner'){ u.ordre = { k: 'miner', gis: cible }; u.cible = null; } else k2(u, k); }); }
function plusProche(u, liste, max){ let m = null, dm = max * max; for (const v of liste){ const d = v.pos.distanceToSquared(u.pos); if (d < dm){ dm = d; m = v; } } return m; }
function gisementProche(p){ let m = null, dm = 1e18; for (const G of GIS) if (G.reste > 0){ const d = G.p.distanceToSquared(p); if (d < dm){ dm = d; m = G; } } return m; }

// ---------- une unité, à chaque image ----------
const _d = V3();
function majUnite(u, dt, adv){
  const T = u.T; let but = null, vmax = T.v;
  // cible : celle de l'ordre, sinon la plus proche à portée d'alerte (sauf en déplacement ordonné)
  if (u.cible && !vivant(u.cible)) u.cible = null;
  if (u.ordre.k === 'attaquer' && !vivant(u.ordre.cible)) u.ordre = { k: 'rien' };
  if (T.portee && !u.cible && u.ordre.k !== 'aller' && (u.ordre.k !== 'assaut' || true)){
    const alerte = u.ordre.k === 'assaut' ? 520 : T.portee * 1.6, pref = T.antigros ? adv.filter(v => v.T.gros || v.T.L > 30) : null;
    u.cible = (pref && plusProche(u, pref, alerte)) || plusProche(u, adv, alerte); }
  if (u.ordre.k === 'attaquer') u.cible = u.ordre.cible;
  // où aller
  if (u.cible && T.portee){
    const c = u.cible.pos;
    if (T.vole){ u.a += dt * T.v / 60; const r = 55 + (u.id % 5) * 9; but = V3(c.x + Math.cos(u.a) * r, c.y + Math.sin(u.a * 2 + u.ph) * 14, c.z + Math.sin(u.a) * r * .85); vmax = T.v * 1.05; }
    else { const d = u.pos.distanceTo(c); if (d > T.portee * .85) but = c.clone(); }
  } else if (u.ordre.k === 'aller' || u.ordre.k === 'assaut'){ but = u.ordre.p; if (u.ordre.k === 'aller' && _d.copy(u.ordre.p).setY(0).distanceTo(V3(u.pos.x, 0, u.pos.z)) < (T.gros ? 40 : 14)) u.ordre = { k: 'rien' }; }
  else if (u.ordre.k === 'miner') but = minage(u, dt);
  else if (T.vole){ // en attente : tourne en rond sur place
    if (!u.centre) u.centre = u.pos.clone(); u.a += dt * .7; but = V3(u.centre.x + Math.cos(u.a) * 30, u.centre.y, u.centre.z + Math.sin(u.a) * 30); vmax = T.v * .45; }
  if (u.ordre.k !== 'rien' || u.cible) u.centre = null;
  // déplacement
  if (but){ _d.copy(but).sub(u.pos); _d.y = (T.alt + (u.id % 7 - 3) * 4 - u.pos.y) * .5 + (T.vole && u.cible ? _d.y : 0); const d = _d.length();
    if (d > 1){ const pas = Math.min(d, vmax * dt * (T.gros && d < 60 ? d / 60 : 1)); u.pos.addScaledVector(_d.normalize(), pas);
      const vise = yawVers(_d.x, _d.z); let dy = vise - u.yaw; while (dy > PI) dy -= 2 * PI; while (dy < -PI) dy += 2 * PI;
      const vir = T.vole ? 4 : T.gros ? .5 : 1.6; u.yaw += clamp(dy, -vir * dt, vir * dt); u.roll = T.vole ? clamp(dy * 1.2, -.9, .9) : 0; } }
  else if (T.gros && u.cible){ _d.copy(u.cible.pos).sub(u.pos); const vise = yawVers(_d.x, _d.z) + PI / 2.6; let dy = vise - u.yaw; while (dy > PI) dy -= 2 * PI; while (dy < -PI) dy += 2 * PI; u.yaw += clamp(dy, -.3 * dt, .3 * dt); }
  // tir
  u.cd -= dt;
  if (u.cible && u.cd <= 0 && u.pos.distanceTo(u.cible.pos) <= T.portee){ u.cd = T.cad * (.85 + Math.random() * .3);
    const cv = u.cible; let deg = T.deg; if (T.antigros && (cv.T.gros || cv.T.L > 30)) deg *= 2.6; if (T.gros && cv.T.vole) deg *= .55;
    const de = T.gros ? u.pos.clone().add(V3((Math.random() - .5) * T.L * .5, 6, (Math.random() - .5) * T.L * .3)) : u.pos;
    tir(de, cv.pos.clone().add(V3((Math.random() - .5) * 6, 0, (Math.random() - .5) * 6)), u.camp, T.gros ? 26 : T.antigros ? 18 : 9, T.gros ? 600 : 480);
    cv.vie -= deg; cv.touche = TEMPS.t; if (cv.vie <= 0) meurt(cv); }
  // posé dans la scène
  u.g.position.copy(u.pos); u.g.rotation.y = u.yaw; u.g.rotation.z += ((u.roll || 0) - u.g.rotation.z) * Math.min(1, dt * 4);
  if (T.gros) u.g.rotation.z = Math.sin(TEMPS.t * .5 + u.ph) * .02;
}
// collecteur : va au gisement, mine jusqu'à être plein, rapporte au porte-vaisseaux
function minage(u, dt){ const o = u.ordre, pv = PV();
  if (!o.gis || o.gis.reste <= 0){ if (u.charge < u.T.cap) o.gis = gisementProche(u.pos); if (!o.gis && !u.charge){ u.ordre = { k: 'rien' }; return null; } }
  if (u.charge >= u.T.cap || (!o.gis && u.charge)){ if (!pv) return null; const d = u.pos.distanceTo(pv.pos);
    if (d < 120){ S.cristal += u.charge; S.mine += u.charge; u.charge = 0; u.rayon = 0; return null; } u.rayon = 0; return pv.pos; }
  const h = o.gis.haut(), d = u.pos.distanceTo(h);
  if (d < 46){ const m = Math.min(u.T.mine * dt, o.gis.reste, u.T.cap - u.charge); u.charge += m; o.gis.reste -= m; u.rayon = 1; majGisement(o.gis); u.a += dt * .8; u.rt = (u.rt || 0) - dt; if (u.rt < 0){ u.rt = .3; tir(u.pos, h.clone().setY(h.y - 18), 0, 5, 240); } return V3(h.x + Math.cos(u.a) * 26, h.y + 10, h.z + Math.sin(u.a) * 26); }
  u.rayon = 0; return h; }
const PV = () => U.find(u => u.type === 'pv' && u.vie > 0);

// ---------- production au porte-vaisseaux ----------
function produire(type){ const T = TYPES[type]; if (S.cristal < T.prix || S.file.length >= 6) return false; S.cristal -= T.prix; S.file.push(type); return true; }
function annuler(i){ const t = S.file[i]; if (!t) return; S.cristal += TYPES[t].prix; S.file.splice(i, 1); if (i === 0) S.fileT = 0; }
function majProduction(dt){ const pv = PV(); if (!pv || !S.file.length) return; S.fileT += dt; const t = S.file[0];
  if (S.fileT >= TYPES[t].temps){ S.fileT = 0; S.file.shift();
    const a = pv.yaw, cote = V3(Math.cos(a), 0, -Math.sin(a)), u = cree(t, pv.pos.clone().addScaledVector(cote, 60 + Math.random() * 40));
    if (t === 'collecteur'){ u.ordre = { k: 'miner', gis: gisementProche(u.pos) }; }
    else { const p = S.ralliement || pv.pos.clone().addScaledVector(cote, 160).add(V3((Math.random() - .5) * 80, 0, (Math.random() - .5) * 80)); u.ordre = { k: 'aller', p }; }
    annonceProd(u); } }

// ---------- vagues ennemies ----------
function lancerVague(){ const n = S.vague, comp = VAGUES[n], porte = PORTES[0]; S.vague++;
  let i = 0; for (const t in comp) for (let k = 0; k < comp[t]; k++){ const a = i * 2.4, r = 30 + Math.sqrt(i) * 40; i++;
    const u = cree(t, porte.p.clone().add(V3(Math.cos(a) * r, 0, Math.sin(a) * r))); u.vague = n + 1; u.ordre = { k: 'assaut', p: V3() }; }
  S.prochaine = n + 1 < VAGUES.length ? ENTRE_VAGUES : null; annonceVague(n + 1); }
function majVagues(dt){ if (S.fin || S.tuto) return; if (S.prochaine !== null){ S.prochaine -= dt; if (S.prochaine <= 0) lancerVague(); }
  else if (!U.some(u => u.camp === 1 && u.vie > 0)) S.fin = { gagne: true, raison: 'SOL-7 A TENU : LES ' + VAGUES.length + ' VAGUES SONT REPOUSSEES' };
  // l'assaut vise le porte-vaisseaux (là où il est), sinon ce qui reste
  const pv = PV(); for (const u of U) if (u.camp === 1 && u.ordre.k === 'assaut'){ const c = pv || U.find(v => v.camp === 0 && v.vie > 0); if (c) u.ordre.p = c.pos; } }

function majUnites(dt){ const bleus = U.filter(u => u.camp === 0 && u.vie > 0), rouges = U.filter(u => u.camp === 1 && u.vie > 0);
  for (const u of U) if (u.vie > 0) majUnite(u, dt, u.camp ? bleus : rouges);
  U = U.filter(u => !u.mort);
  majProduction(dt); majVagues(dt); }
function nouvellePartie(){ for (const u of U){ sc.remove(u.g); sc.remove(u.anneau); } U = []; ID = 0;
  Object.assign(S, { cristal: 300, vague: 0, prochaine: PREMIERE_VAGUE, file: [], fileT: 0, detruits: 0, perdus: 0, mine: 0, fin: null, ralliement: null });
  for (const G of GIS){ G.reste = G.max; majGisement(G); }
  const pv = cree('pv', BASE); pv.yaw = yawVers(1, -.3);
  for (let i = 0; i < 2; i++){ const c = cree('collecteur', BASE.clone().add(V3(80 + i * 30, 0, 90))); c.ordre = { k: 'miner', gis: gisementProche(c.pos) }; }
  for (let i = 0; i < 4; i++) cree('chasseur', BASE.clone().add(V3(220 + (i % 2) * 30, 0, -40 + (i >> 1) * 30)));
  cree('destroyer', BASE.clone().add(V3(240, 0, 200))).yaw = pv.yaw; }

/* Les Bannis : règles (run, héros, objets, vagues, combat en mouvement, dés). Aucun affichage :
   le combat produit des événements (C.ev) que jeu.js transforme en effets et en sons.
   Utilisable sous Node pour un futur simulateur. Rangé dans window.Bannis.R. */
(function(){
"use strict";
const B = window.Bannis = window.Bannis || {};
const D = B.D;
const W = 360;
const ZONE = {x0: 64, x1: 350, y0: 262, y1: 528};
const MUR_X = 50;
const CASES = [[92,290],[92,385],[92,480],[162,290],[162,385],[162,480]];
const VERSION_RUN = 1;

let alea = Math.random;
const r = (a, b) => a + alea()*(b-a);
const ent = (a, b) => Math.floor(r(a, b+1));
const pick = t => t[Math.floor(alea()*t.length)];
function tirage(t){ let s = t.reduce((a, b) => a + b.p, 0), x = alea()*s; for (const e of t){ x -= e.p; if (x <= 0) return e; } return t[0]; }
const melange = t => { const c = t.slice(); for (let i = c.length-1; i > 0; i--){ const j = Math.floor(alea()*(i+1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };

/* ---------- héros ---------- */
let idSuivant = 1;
function creerHeros(cls, nomsPris){
  const C = D.CLASSES[cls], k = () => r(0.8, 1.2);
  const noms = (C.sexe === "F" ? D.NOMS_F : D.NOMS.filter(n => !D.NOMS_F.includes(n))).filter(n => !(nomsPris || []).includes(n));
  const h = {id: idSuivant++, nom: pick(noms.length ? noms : D.NOMS), cls, leg: false, niv: 1, xp: 0,
    base: {pv: Math.round(C.pv*k()), atq: Math.max(4, Math.round(C.atq*k())), def: Math.max(0, Math.round(C.def*k())), vit: Math.round(C.vit*k()*100)/100, crit: Math.max(2, Math.round(C.crit*k()))},
    trait: pick(Object.keys(D.TRAITS)), equip: {arme: null, armure: null, bijou: null}, pv: 0, slot: 0, mort: false, kills: 0};
  h.pv = stats(h).pv;
  return h;
}
function recrues(n, nomsPris){
  const cls = melange(Object.keys(D.CLASSES)); const out = [], pris = (nomsPris || []).slice();
  for (let i = 0; i < n; i++){ const h = creerHeros(cls[i % cls.length], pris); pris.push(h.nom); out.push(h); }
  return out;
}
// statistiques réelles : base + trait + équipement + classe légendaire
function stats(h){
  const s = Object.assign({}, h.base); s.vol = 0; s.rate = 0; s.critMul = 1.8; s.soinRecu = 1; s.xpMul = 1; s.vitDep = 1;
  const t = h.trait;
  if (t === "ivrogne"){ s.atq = Math.round(s.atq*1.15); s.rate = 0.15; }
  if (t === "pieux") s.soinRecu = 1.3;
  if (t === "deserteur") s.vitDep = 1.25;
  if (t === "tetebrulee"){ s.crit += 10; s.def = Math.max(0, s.def-1); }
  if (t === "balafre") s.pv = Math.round(s.pv*1.15);
  if (t === "vantard") s.xpMul = 1.25;
  if (t === "parjure"){ s.pv = Math.round(s.pv*0.9); s.critMul = 2.2; }
  for (const o of Object.values(h.equip)) if (o) for (const [a, v] of Object.entries(o.b)){
    if (a === "vit") s.vit = Math.round(s.vit*(1+v/100)*100)/100; else if (a === "vol") s.vol += v/100; else s[a] += v; }
  if (h.leg){ s.pv = Math.round(s.pv*1.3); s.atq = Math.round(s.atq*1.3); s.def += 2; s.crit += 5; }
  return s;
}
function classeDe(h){ const C = D.CLASSES[h.cls]; return h.leg ? {n: C.leg.n, spr: C.leg.spr, d: C.leg.d} : {n: C.n, spr: C.spr, d: C.d}; }
function nivSuivant(h){ return D.XP_NIVEAUX[h.niv] || Infinity; }
// ajoute l'expérience ; renvoie le nombre de niveaux gagnés (les bonus sont choisis ensuite)
function gagnerXp(h, v){
  h.xp += Math.round(v*stats(h).xpMul); let n = 0;
  while (h.xp >= nivSuivant(h)){ h.niv++; n++; }
  return n;
}
function propositionsNiveau(){ return melange(D.BONUS_NIVEAU).slice(0, 2); }
function appliquerBonus(h, b){ const avant = stats(h).pv; b.f(h); h.pv = Math.min(stats(h).pv, h.pv + Math.max(0, stats(h).pv - avant)); }
function peutEvoluer(h){ return !h.leg && h.niv >= D.NIV_LEGENDAIRE; }
function evoluer(h){ h.leg = true; h.pv = stats(h).pv; }

/* ---------- objets ---------- */
function genererObjet(vague, mieux){
  const slot = pick(Object.keys(D.SLOTS)), [nom, ic, pour] = pick(D.SLOTS[slot].noms);
  let rar = tirage(D.RARETES.map((x, i) => Object.assign({}, x, {p: x.p * (i === 0 ? Math.max(0.3, 1 - vague*0.05) : 1 + (mieux ? 1.5 : 0) + vague*0.08), i})));
  const R = D.RARETES[rar.i], b = {};
  const possibles = melange(Object.keys(D.AFFIXES).filter(a => D.AFFIXES[a].s.includes(slot)));
  const echelle = R.k * (1 + vague*0.07);
  for (const a of possibles.slice(0, R.aff)) b[a] = Math.max(1, Math.round(D.AFFIXES[a].v * echelle * r(0.8, 1.2)));
  return {slot, n: nom, ic, rar: rar.i, b, pour: pour || null, prix: Math.round(6 + 8*R.k + vague)};
}
function texteBonus(o){ return Object.entries(o.b).map(([a, v]) => "+" + v + " " + D.AFFIXES[a].n.replace(/^% /, "% ")).map(t => t.replace("+" , "+")).join("  "); }
function peutPorter(h, o){ if (!o.pour) return true; return (o.pour === "cac") === (D.CLASSES[h.cls].role === "cac"); }
// stats du héros s'il portait cet objet (sans rien changer)
function statsAvec(h, o){ const e = h.equip; h.equip = Object.assign({}, e, {[o.slot]: o}); const s = stats(h); h.equip = e; return s; }
// niveau gagné : les stats montent toutes seules selon le rôle ; renvoie les gains
function monterNiveau(h){
  const g = D.CROISSANCE[D.CLASSES[h.cls].role], avant = stats(h), b = h.base;
  if (g.pv) b.pv = Math.round(b.pv*(1 + g.pv/100)); if (g.atq) b.atq += g.atq; if (g.def) b.def += g.def; if (g.crit) b.crit += g.crit; if (g.vit) b.vit = Math.round(b.vit*(100 + g.vit))/100;
  const apres = stats(h); h.pv = Math.min(apres.pv, h.pv + (apres.pv - avant.pv));
  return {pv: apres.pv - avant.pv, atq: apres.atq - avant.atq, def: apres.def - avant.def, crit: apres.crit - avant.crit, vit: Math.round((apres.vit - avant.vit)*100)/100};
}
function equiper(h, o){ const ancien = h.equip[o.slot]; const avant = stats(h).pv; h.equip[o.slot] = o; const apres = stats(h).pv; h.pv = Math.max(1, Math.min(apres, h.pv + (apres - avant))); return ancien; }

/* ---------- run ---------- */
function nouvelleRun(){
  return {v: VERSION_RUN, vague: 1, or: 20, mur: 100, murMax: 100, heros: [], stock: {potion: 1, parchemin: 1, vue: 1}, kills: 0, boss: 0, revele: false, debut: Date.now()};
}
function nomsPris(run){ return run.heros.map(h => h.nom); }
function placerParDefaut(run){
  // corps à corps devant, les autres derrière
  const libres = [3, 4, 5, 0, 1, 2], pris = new Set();
  const ordre = run.heros.slice().sort((a, b) => (D.CLASSES[a.cls].role === "cac" ? 0 : 1) - (D.CLASSES[b.cls].role === "cac" ? 0 : 1));
  let av = 0, ar = 0;
  for (const h of ordre){ const devant = D.CLASSES[h.cls].role === "cac";
    let s = devant ? [4, 3, 5][av++] : [1, 0, 2][ar++]; if (s === undefined || pris.has(s)) s = libres.find(x => !pris.has(x)); h.slot = s; pris.add(s); }
}
// début de vague : les héros tombés reviennent à 30 % de vie
function preparerVague(run){
  for (const h of run.heros){ const s = stats(h); if (h.mort || h.pv <= 0){ h.mort = false; h.pv = Math.round(s.pv*0.3); } h.pv = Math.min(h.pv, s.pv); }
  run.revele = false; run.relances = 1;
  run.compo = composerVague(run.vague);
}
function composerVague(v){
  const pal = D.PALIERS.find(p => v <= p.jusqua) || D.PALIERS[D.PALIERS.length-1];
  const n = Math.min(4 + v, 15), liste = [];
  const boss = D.BOSS[v];
  const especes = melange(pal.l).slice(0, 3 + Math.min(2, Math.floor(v/3)));
  for (let i = 0; i < (boss ? n - 2 : n); i++){ const k = pick(especes); liste.push({k, elite: alea() < 0.04 + v*0.035}); }
  // trois groupes de plus en plus forts ; le boss arrive avec le dernier
  liste.sort((a, b) => D.MONSTRES[a.k].pv - D.MONSTRES[b.k].pv);
  const groupes = [[], [], []]; liste.forEach((m, i) => groupes[Math.min(2, Math.floor(i*3/liste.length))].push(m));
  if (boss) for (const k of boss) groupes[2].push({k, elite: false});
  const file = []; let t = 0;
  groupes.forEach(g => { g.forEach((m, i) => file.push({t: t + i*0.45, k: m.k, elite: m.elite})); t += 5 + g.length*0.45; });
  return file;
}
function apercu(run){
  const vus = [];
  for (const e of run.compo){ let x = vus.find(v => v.k === e.k); if (!x){ x = {k: e.k, n: 0, boss: !!D.MONSTRES[e.k].boss}; vus.push(x); } x.n++; }
  vus.sort((a, b) => (a.boss ? 1 : 0) - (b.boss ? 1 : 0));
  return vus.map((v, i) => Object.assign(v, {cache: !run.revele && i >= 2}));
}

/* ---------- combat ---------- */
function uniteHeros(h){
  const s = stats(h), C = D.CLASSES[h.cls], c = CASES[h.slot] || CASES[0];
  return {camp: "h", h, nom: h.nom, role: C.role, spr: classeDe(h).spr, leg: h.leg, cls: h.cls, pv: h.pv, pvMax: s.pv, atq: s.atq, def: s.def, vit: s.vit, crit: s.crit,
    critMul: s.critMul, vol: s.vol + (h.leg && h.cls === "guerriere" ? 0.12 : 0), rate: s.rate, soinRecu: s.soinRecu, vitDep: s.vitDep, trait: h.trait,
    x: c[0], y: c[1], bx: c[0], by: c[1], kx: 0, ky: 0, dir: 1, cd: r(0.2, 0.8), act: "repos", ta: r(0, 2), cib: null, lunge: 0, flash: 0, mort: 0, hate: 0, kills: 0, frappe: null};
}
function uniteMonstre(e, vague){
  const M = D.MONSTRES[e.k], f = 1 + (vague-1)*0.13, fa = 1 + (vague-1)*0.08, el = e.elite ? 1 : 0;
  const pv = Math.round(M.pv * f * (el ? 1.8 : 1) * r(0.9, 1.1));
  return {camp: "m", k: e.k, nom: (el ? "ELITE " : "") + M.n, role: M.role, i: M.i, elite: !!el, boss: !!M.boss, t: M.t*(el ? 1.1 : 1),
    pv, pvMax: pv, atq: Math.round(M.atq*fa*(el ? 1.3 : 1)), def: M.def, vit: M.vit*r(0.92, 1.08), crit: 6, critMul: 1.6, vol: 0, rate: 0, soinRecu: 1, vitDep: 1,
    x: W + 30, y: r(ZONE.y0 + 10, ZONE.y1 - 10), kx: 0, ky: 0, dir: -1, cd: r(0.4, 1), act: "marche", ta: r(0, 1), cib: null, lunge: 0, flash: 0, mort: 0, ralenti: 0, entre: false, frappe: null};
}
function debutCombat(run){
  const C = {run, unites: [], file: run.compo.map(e => Object.assign({}, e)), tv: 0, proj: [], ev: [], fin: null, chant: 0, total: run.compo.length, tues: 0};
  for (const h of run.heros) if (h.pv > 0) C.unites.push(uniteHeros(h));
  return C;
}
const vivants = (C, camp) => C.unites.filter(u => u.camp === camp && u.pv > 0);
function cible(C, u){
  const adv = vivants(C, u.camp === "h" ? "m" : "h").filter(a => a.x < W - 4 || u.camp === "m");
  if (!adv.length) return null;
  let best = null, bd = 1e9;
  for (const a of adv){ let d = Math.hypot(a.x - u.x, (a.y - u.y)*1.3); if (a === u.cib) d *= 0.7; if (u.camp === "m") d += 40;
    if (d < bd){ bd = d; best = a; } }
  if (u.camp === "m" && bd > 170 && u.role !== "dist") return null;
  return best;
}
function degats(C, src, cib, base, opt = {}){
  if (cib.pv <= 0) return 0;
  if (src && src.rate && alea() < src.rate){ C.ev.push({k: "rate", x: cib.x, y: cib.y}); return 0; }
  const crit = !opt.sansCrit && alea()*100 < ((src && src.crit) || 0);
  let d = Math.max(1, Math.round(base*r(0.85, 1.15) - cib.def*(opt.perce ? 0.3 : 1)));
  if (crit) d = Math.round(d*((src && src.critMul) || 1.8));
  cib.pv = Math.max(0, cib.pv - d); cib.flash = 0.18; if (cib.act !== "coup") { cib.act = "mal"; cib.ta = 0; }
  if (src && src.x !== undefined && !opt.sansRecul){ const dx = cib.x - src.x, dy = cib.y - src.y, dd = Math.hypot(dx, dy) || 1, kb = (crit ? 260 : 150)*(cib.boss ? 0.25 : 1)*(src.leg && src.cls === "guerriere" ? 1.6 : 1);
    cib.kx += dx/dd*kb; cib.ky += dy/dd*kb*0.6; }
  if (src && src.vol) { const v = Math.round(d*src.vol); if (v > 0) soigner(C, src, v, true); }
  C.ev.push({k: "degats", u: cib, v: d, crit, c: opt.c, x: cib.x, y: cib.y});
  if (cib.pv <= 0){ cib.act = "mort"; cib.ta = 0; cib.mort = 0;
    C.ev.push({k: "mort", u: cib});
    if (cib.camp === "m"){ C.tues++; const run = C.run; run.kills++; if (cib.boss) run.boss++;
      let or = ent(2, 4) * (cib.elite ? 3 : 1) * (cib.boss ? 8 : 1); if (src && src.camp === "h"){ src.kills++; src.h.kills++; if (src.trait === "cleptomane") or += 2; }
      run.or += or; C.ev.push({k: "or", v: or, x: cib.x, y: cib.y}); }
    else cib.h.mort = true;
  }
  // le champion fend : ses critiques touchent aussi les voisins
  if (crit && src && src.leg && src.cls === "mercenaire" && !opt.fente) for (const o of vivants(C, "m")) if (o !== cib && Math.hypot(o.x - cib.x, o.y - cib.y) < 50) degats(C, src, o, base*0.6, {fente: true, sansCrit: true});
  return d;
}
function soigner(C, u, v, discret){ if (u.pv <= 0) return; v = Math.round(v*(u.soinRecu || 1)); const avant = u.pv; u.pv = Math.min(u.pvMax, u.pv + v);
  if (u.pv > avant && !discret) C.ev.push({k: "soin", u, v: u.pv - avant, x: u.x, y: u.y}); }
function attaquer(C, u, c){
  u.act = "coup"; u.ta = 0; u.dir = c.x >= u.x ? 1 : -1;
  if (u.role === "cac"){ u.lunge = 0.25; u.frappe = {c, t: 0.11}; }
  else { const mag = u.role !== "dist" || u.camp === "m";
    C.proj.push({x: u.x + u.dir*12, y: u.y - 36, cx: c, src: u, t: 0, c: u.camp === "m" ? "#ff6a3a" : u.role === "soin" ? "#ffe680" : u.role === "chant" ? "#9ff0ff" : "#c77dff"});
    C.ev.push({k: "tir", u, mag}); }
}
function etape(C, dt){
  if (C.fin) return;
  C.tv += dt;
  while (C.file.length && C.file[0].t <= C.tv){ const e = C.file.shift(), m = uniteMonstre(e, C.run.vague); C.unites.push(m); if (m.boss) C.ev.push({k: "boss", u: m}); }
  const tous = C.unites.filter(u => u.pv > 0);
  // chant du barde : l'escouade accélère
  for (const u of tous) if (u.role === "chant"){ u.chantT = (u.chantT || 0) + dt;
    if (u.chantT > 6){ u.chantT = 0; C.ev.push({k: "chant", u}); for (const h of vivants(C, "h")){ h.hate = 4; if (u.leg) soigner(C, h, Math.round(h.pvMax*0.05)); } } }
  for (const u of tous){
    u.cd -= dt*(u.hate > 0 ? 1.25 : 1)*(u.ralenti > 0 ? 0.6 : 1); u.hate = Math.max(0, (u.hate || 0) - dt); u.ralenti = Math.max(0, (u.ralenti || 0) - dt);
    if (u.frappe){ u.frappe.t -= dt; if (u.frappe.t <= 0){ const c = u.frappe.c; u.frappe = null; if (c.pv > 0 && Math.hypot(c.x - u.x, c.y - u.y) < D.PORTEE.cac + 24) degats(C, u, c, u.atq); } }
    if (!u.cib || u.cib.pv <= 0 || alea() < dt*0.6) u.cib = cible(C, u);
    let vx = 0, vy = 0;
    const occupe = (u.act === "coup" && u.ta < 0.3) || (u.act === "mal" && u.ta < 0.2);
    // le déserteur fuit vers la Muraille quand il est presque mort
    const fuit = u.trait === "deserteur" && u.pv < u.pvMax*0.2;
    if (fuit){ vx = -1; vy = (u.by - u.y)/100; u.dir = -1; }
    if (!fuit && u.role === "soin"){
      const blesse = vivants(C, "h").filter(h => h.pv < h.pvMax*0.75).sort((a, b) => a.pv/a.pvMax - b.pv/b.pvMax)[0];
      if (blesse){ const dx = blesse.x - u.x, dy = blesse.y - u.y, d = Math.hypot(dx, dy) || 1;
        if (d > 110){ vx = dx/d; vy = dy/d; u.dir = dx >= 0 ? 1 : -1; }
        else if (u.cd <= 0){ u.act = "coup"; u.ta = 0; C.ev.push({k: "soinLance", u});
          if (u.leg) for (const h of vivants(C, "h")) soigner(C, h, Math.round(u.atq*1.3)); else soigner(C, blesse, Math.round(u.atq*1.8));
          u.cd = r(1.3, 1.7)/u.vit; } }
    }
    const c = u.cib;
    if (!fuit && c && !(u.role === "soin" && vx)){
      const dx = c.x - u.x, dy = c.y - u.y, d = Math.hypot(dx, dy) || 1, p = D.PORTEE[u.role] || 30;
      if (!occupe) u.dir = dx >= 0 ? 1 : -1;
      if (d > p){ vx = dx/d; vy = dy/d; }
      else if (p > 60 && d < p*0.55 && u.camp === "h"){ vx = -dx/d; vy = -dy/d*0.6; }
      if (d <= p + 6 && u.cd <= 0){ attaquer(C, u, c); u.cd = r(1.0, 1.4)/u.vit*(u.camp === "m" ? 1.3 : 1); }
    } else if (!c && u.camp === "m"){
      vx = -1; u.dir = -1;
      if (u.x <= ZONE.x0 + 2){ vx = 0; if (u.cd <= 0){ u.act = "coup"; u.ta = 0; u.lunge = 0.25; const v = Math.max(1, Math.round(u.atq*0.6));
        C.run.mur = Math.max(0, C.run.mur - v); C.ev.push({k: "mur", v, y: u.y}); u.cd = r(1, 1.4); } }
    } else if (!c && u.camp === "h" && !fuit){
      const dx = u.bx - u.x, dy = u.by - u.y, d = Math.hypot(dx, dy); if (d > 8){ vx = dx/d*0.6; vy = dy/d*0.6; }
    }
    // écartement
    for (const o of tous) if (o !== u && o.pv > 0){ const ox = u.x - o.x, oy = (u.y - o.y)*1.4, od = Math.hypot(ox, oy), rr = (u.boss || o.boss) ? 52 : 36;
      if (od < rr && od > 0.01){ const k = (rr - od)/rr*2.4; vx += ox/od*k; vy += oy/od*k*0.7; } }
    if (occupe){ vx *= 0.2; vy *= 0.2; }
    const sp = u.vit*(u.camp === "h" ? 70 : 46)*(u.vitDep || 1)*(u.hate > 0 ? 1.15 : 1)*(u.ralenti > 0 ? 0.55 : 1);
    u.x += vx*sp*dt + u.kx*dt; u.y += vy*sp*dt*0.85 + u.ky*dt;
    u.kx *= Math.pow(0.02, dt); u.ky *= Math.pow(0.02, dt);
    u.y = Math.max(ZONE.y0, Math.min(ZONE.y1, u.y));
    if (u.camp === "h") u.x = Math.max(ZONE.x0, Math.min(ZONE.x1, u.x));
    else { if (u.x < W - 24) u.entre = true; u.x = Math.max(ZONE.x0, Math.min(u.entre ? W - 24 : W + 40, u.x)); }
    const bouge = Math.hypot(vx, vy) > 0.25;
    if (!occupe && (u.act === "repos" || u.act === "marche")) u.act = bouge ? "marche" : "repos";
  }
  for (const p of C.proj){ p.t += dt*2.6; const c = p.cx; p.x += (c.x - p.x)*Math.min(1, dt*8); p.y += (c.y - 34 - p.y)*Math.min(1, dt*8);
    if (Math.hypot(c.x - p.x, c.y - 34 - p.y) < 12 || p.t > 1.2){ p.fini = true;
      if (c.pv > 0){ const u = p.src;
        degats(C, u, c, u.atq, {c: p.c});
        if (u.leg && u.cls === "illusionniste") for (const o of vivants(C, "m")) if (o !== c && Math.hypot(o.x - c.x, o.y - c.y) < 55) degats(C, u, o, u.atq*0.5, {sansCrit: true, c: p.c});
        if (u.leg && u.cls === "magicienne") c.ralenti = 3; } } }
  C.proj = C.proj.filter(p => !p.fini);
  // fin du combat
  if (!vivants(C, "m").length && !C.file.length) C.fin = "victoire";
  else if (!vivants(C, "h").length || C.run.mur <= 0) C.fin = "defaite";
  if (C.fin) for (const u of C.unites) if (u.camp === "h"){ u.h.pv = Math.max(0, Math.round(u.pv)); if (u.pv <= 0) u.h.mort = true; }
}

/* ---------- dés du Mage ---------- */
const DES = ["d6", "d8", "d20"], FACES = {d6: 6, d8: 8, d20: 20};
function lancerDes(garder){
  return DES.map((k, i) => garder && garder[i] ? Object.assign({}, garder[i]) : {k, v: ent(1, FACES[k]), x2: k === "d8" && alea() < 0.25});
}
function resultatDes(des){
  const v = des.map(d => d.v); let mult = des.some(d => d.x2) ? 2 : 1, combo = null;
  const s = v.slice().sort((a, b) => a - b);
  if (v[0] === v[1] && v[1] === v[2]){ combo = "MIRACLE"; mult *= 3; }
  else if (s[1] === s[0] + 1 && s[2] === s[1] + 1){ combo = "SUITE"; mult *= 2; }
  else if (v[0] === v[1] || v[1] === v[2] || v[0] === v[2]){ combo = "PAIRE"; mult *= 1.5; }
  if (des[2].v === 20){ combo = combo ? combo + " + 20 NATUREL" : "20 NATUREL"; mult *= 2; }
  if (des[2].v === 1){ combo = "FIASCO"; mult *= 0.5; }
  return {total: Math.round(v.reduce((a, b) => a + b, 0)*mult), mult, combo};
}
function tirerSort(){ return tirage(D.SORTS); }
// applique un sort ; renvoie la liste des cibles (pour l'animation)
function jeterSort(C, sort, puissance){
  const ms = vivants(C, "m");
  if (sort.k === "feu") for (const m of ms) degats(C, null, m, puissance, {sansRecul: true, c: sort.c, perce: true});
  else if (sort.k === "soin") for (const h of vivants(C, "h")) soigner(C, h, Math.round(puissance*0.9));
  else if (sort.k === "foudre") ms.forEach(m => degats(C, null, m, Math.round(puissance*0.8), {sansRecul: true, c: sort.c, perce: true}));
  else for (const m of ms) degats(C, null, m, Math.round(puissance*0.6), {sansRecul: true, c: sort.c});
  return ms;
}
function utiliserObjet(C, k){
  const run = C.run;
  if (k === "potion" && run.stock.potion > 0){ const h = vivants(C, "h").sort((a, b) => a.pv/a.pvMax - b.pv/b.pvMax)[0]; if (!h) return false;
    run.stock.potion--; soigner(C, h, Math.round(h.pvMax*0.45)); return true; }
  if (k === "parchemin" && run.stock.parchemin > 0){ const ms = vivants(C, "m").filter(m => m.x < W); if (!ms.length) return false;
    const m = ms.sort((a, b) => b.pv - a.pv)[0]; run.stock.parchemin--; C.ev.push({k: "eclair", x: m.x}); degats(C, null, m, 22 + run.vague*4, {c: "#8fd8ff", perce: true}); return true; }
  return false;
}

/* ---------- fin de vague, fin de run ---------- */
function xpDeVague(run){ return 12 + run.vague*4; }
function eclatsDeRun(run, gagne){ return run.vague*4 + Math.floor(run.kills/4) + run.boss*10 + (gagne ? 30 : 0); }

/* ---------- sauvegarde ---------- */
function sauver(run){ const c = Object.assign({}, run); delete c.compo; return JSON.stringify(c); }
function charger(txt){
  try { const run = JSON.parse(txt); if (!run || run.v !== VERSION_RUN || !Array.isArray(run.heros) || !run.heros.length) return null;
    for (const h of run.heros) if (!D.CLASSES[h.cls]) return null;
    idSuivant = Math.max(idSuivant, ...run.heros.map(h => h.id + 1)); run.compo = composerVague(run.vague); return run; }
  catch (e){ return null; }
}

B.R = {W, ZONE, MUR_X, CASES, creerHeros, recrues, stats, classeDe, nivSuivant, gagnerXp, propositionsNiveau, appliquerBonus, peutEvoluer, evoluer,
  genererObjet, texteBonus, equiper, peutPorter, statsAvec, monterNiveau, nouvelleRun, nomsPris, placerParDefaut, preparerVague, composerVague, apercu, debutCombat, vivants, etape,
  lancerDes, resultatDes, tirerSort, jeterSort, utiliserObjet, xpDeVague, eclatsDeRun, sauver, charger,
  graine(f){ alea = f || Math.random; }};
})();

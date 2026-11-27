/* Les Bannis : affichage, écrans, toucher, effets et sons. Les règles sont dans regles.js (window.Bannis.R),
   les données dans donnees.js (window.Bannis.D). Canvas logique de 760 x 360 (paysage), agrandi sans lissage.
   Sauvegardes : bannis.run (nuit en cours, écrite au début de chaque vague), bannis.stats, bannis.son. */
(function(){
"use strict";
const {D, R} = window.Bannis;
const W = 760, H = 360;   // paysage (28/11)
const cv = document.getElementById("cv"), ctx = cv.getContext("2d");
let dpr = 1, echelle = 1;
const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
const alea = (a, b) => a + Math.random()*(b-a);
const ent = (a, b) => Math.floor(alea(a, b+1));
const pick = t => t[Math.floor(Math.random()*t.length)];

/* ---------- sauvegarde ---------- */
const lire = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e){ return d; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e){} };
const effacer = k => { try { localStorage.removeItem(k); } catch (e){} };
function statsJoueur(){ return Object.assign({nuits: 0, record: 0, gagnees: 0, eclats: 0, kills: 0}, lire("bannis.stats", {})); }
// arbre de compétences (session 4) : pour l'instant, seulement la liste des classes légendaires débloquées
function legendaires(){ const a = lire("bannis.arbre", {}); return Array.isArray(a && a.legendaires) ? a.legendaires : []; }
function runSauvee(){ try { const t = localStorage.getItem("bannis.run"); return t ? R.charger(t) : null; } catch (e){ return null; } }
function sauverRun(){ try { localStorage.setItem("bannis.run", R.sauver(G.run)); } catch (e){} }

/* ---------- images ---------- */
const IMG = {};
for (const k of ["heros", "monstres", "icones"]){   // plus de planches d'interface : l'interface moderne est dessinée en code
  const i = new Image(); i.src = (window.BANNIS_IMG && window.BANNIS_IMG[k]) || "img/" + k + ".png"; IMG[k] = i; }  // BANNIS_IMG : images en data: dans l'artefact

/* ---------- sons synthétisés (de vrais sons viendront à la session 5) ---------- */
let AC = null, sonOn = lire("bannis.son", true) !== false;
function audio(){ if (!AC){ try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e){} } if (AC && AC.state === "suspended") AC.resume(); }
function bip(f, d, type = "square", vol = .08, glisse = 0, t0 = 0){
  if (!sonOn || !AC) return; const t = AC.currentTime + t0;
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  if (glisse) o.frequency.exponentialRampToValueAtTime(Math.max(30, f*glisse), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02);
}
function bruit(d, vol = .12, filtre = 1800, t0 = 0){
  if (!sonOn || !AC) return; const t = AC.currentTime + t0;
  const n = AC.createBuffer(1, Math.max(1, AC.sampleRate*d), AC.sampleRate), c = n.getChannelData(0);
  for (let i = 0; i < c.length; i++) c[i] = (Math.random()*2 - 1)*(1 - i/c.length);
  const s = AC.createBufferSource(); s.buffer = n; const f = AC.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = filtre;
  const g = AC.createGain(); g.gain.value = vol; s.connect(f).connect(g).connect(AC.destination); s.start(t);
}
let dernierCoup = 0;
const SON = {
  coup(){ const t = performance.now(); if (t - dernierCoup < 45) return; dernierCoup = t; bruit(.08, .16, 2500); bip(110, .12, "triangle", .13, .5); },
  crit(){ bruit(.14, .2, 4000); bip(220, .18, "square", .09, .4); bip(880, .12, "square", .05, 1.5, .03); },
  tir(){ bip(1200, .08, "triangle", .035, .4); },
  sort(){ bip(500, .25, "sine", .06, 2.5); bip(750, .25, "sine", .04, 2, .05); },
  mort(){ bip(300, .35, "sawtooth", .05, .2); bruit(.25, .07, 600); },
  des(n = 8, delai = 0){ for (let i = 0; i < n; i++) bip(520 + (i%3)*70, .03, "square", .03, 0, delai + i*.075 + i*i*.004); bip(170, .12, "sine", .12, .6, delai + n*.075 + .05); },
  soin(){ [523, 659, 784].forEach((f, i) => bip(f, .16, "sine", .05, 1, i*.06)); },
  de(){ bruit(.03, .1, 6000); bip(ent(900, 1500), .03, "square", .025); },
  pose(){ bip(180, .08, "square", .07, .6); bruit(.05, .09, 1500); },
  combo(){ [392, 523, 659, 784, 1046].forEach((f, i) => bip(f, .35, "square", .045, 1, i*.06)); },
  boum(){ bruit(.6, .28, 900); bip(80, .5, "sine", .22, .4); },
  niveau(){ [523, 659, 784, 1046, 1318].forEach((f, i) => bip(f, .22, "triangle", .06, 1, i*.08)); },
  clic(){ bip(660, .05, "square", .045); },
  or(){ bip(1568, .06, "square", .03); bip(2093, .08, "square", .025, 1, .05); },
  butin(){ [784, 988, 1175, 1568].forEach((f, i) => bip(f, .3, "triangle", .055, 1, i*.09)); },
  defaite(){ [392, 349, 311, 262].forEach((f, i) => bip(f, .4, "triangle", .07, 1, i*.22)); },
  victoire(){ [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, i) => bip(f, .3, "square", .05, 1, i*.11)); },
  mur(){ bruit(.12, .14, 900); bip(70, .15, "sine", .14, .6); },
  chant(){ [880, 1109, 1319].forEach((f, i) => bip(f, .2, "sine", .04, 1, i*.07)); },
  poule(){ bip(1400, .06, "square", .035, .7); bip(1100, .06, "square", .035, .7, .08); }
};

/* ---------- état ---------- */
const G = {ecran: "titre", run: null, C: null, sel: -1, fiche: null, pause: false, vitesse: lire("bannis.vitesse", 1), t: 0, txt: [], part: [], fx: [], sec: 0, gel: 0,
  evo: null, butin: null, recrues: null, choisies: [], fin: null, lancer: null, nuages: []};
for (let i = 0; i < 40; i++) G.nuages.push({x: Math.random()*W, y: Math.random()*H, v: alea(8, 22), r: alea(.6, 1.8)});

/* ---------- dessin : outils ---------- */
function nine(cle, sx, sy, sw, sh, c, x, y, w, h){
  const im = IMG[cle]; if (!im.complete || !im.width) return; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const d = Math.min(c, Math.floor(w/2), Math.floor(h/2)), mw = sw - 2*c, mh = sh - 2*c, dw = w - 2*d, dh = h - 2*d;
  const PX = [[0, c, 0, d], [c, mw, d, dw], [c + mw, c, d + dw, d]], PY = [[0, c, 0, d], [c, mh, d, dh], [c + mh, c, d + dh, d]];
  for (const [ox, ow, px, pw] of PX) for (const [oy, oh, py, ph] of PY) if (pw > 0 && ph > 0) ctx.drawImage(im, sx + ox, sy + oy, ow, oh, x + px, y + py, pw, ph);
}
// interface moderne (27/11) : cartes arrondies sombres, liseré teal, Titillium Web ; les sprites restent en pixel art
const MOD = {fond: "#0e1a22", carte: "#16303a", bord: "#24505a", accent: "#3ddcbe", doux: "#8fb0ad", txt: "#e8f4f2", alerte: "#ffb08a", or: "#ffd76a"};
function carteM(x, y, w, h, bord, fond){ ctx.fillStyle = fond || MOD.carte; rr(x, y, w, h, Math.min(12, h/2)); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = bord || MOD.bord; rr(x, y, w, h, Math.min(12, h/2)); ctx.stroke(); }
const panneau = (x, y, w, h) => carteM(x, y, w, h, MOD.bord, "rgba(14,26,34,.92)");
const grand = (x, y, w, h) => carteM(x, y, w, h, MOD.bord, "rgba(14,26,34,.96)");
const petit = (x, y, w, h) => carteM(x, y, w, h, MOD.bord, MOD.carte);
function police(px, titre, gras){ ctx.font = `${titre ? 800 : gras === false ? 600 : 700} ${Math.round(px*(titre ? 1.12 : 1.05))}px "Titillium Web", "Jersey 10", sans-serif`; }
function texte(t, x, y, px, c = "#fff", al = "left", opt = {}){
  police(px, opt.titre, opt.gras); let p = px;
  if (opt.max) while (p > 8 && ctx.measureText(t).width > opt.max){ p--; police(p, opt.titre, opt.gras); }
  ctx.textAlign = al; ctx.textBaseline = "alphabetic";
  // fin contour sombre : le texte reste lisible sur la scène comme sur les cartes
  if (opt.ombre !== false){ ctx.lineJoin = "round"; ctx.lineWidth = 3; ctx.strokeStyle = opt.ombreC || "rgba(5,12,16,.85)"; ctx.strokeText(t, x, y); }
  ctx.fillStyle = c; ctx.fillText(t, x, y);
}
// texte sur plusieurs lignes ; renvoie la hauteur occupée
function paragraphe(t, x, y, larg, px, c = "#fff", interligne = 1.3, al = "left"){
  police(px, false); const mots = t.split(" "); let ligne = "", yy = y;
  for (const m of mots){ const essai = ligne ? ligne + " " + m : m; if (ctx.measureText(essai).width > larg && ligne){ texte(ligne, x, yy, px, c, al, {gras: false}); ligne = m; yy += px*interligne; } else ligne = essai; }
  if (ligne){ texte(ligne, x, yy, px, c, al, {gras: false}); yy += px*interligne; }
  return yy - y;
}
function icone(rc, x, y, s = 28){ const im = IMG.icones; if (!im.width) return; ctx.drawImage(im, rc[1]*32, rc[0]*32, 32, 32, x, y, s, s); }
// barre dans le cadre du pack : bouts de 12 px de chaque côté (dessinés hors de x..x+w), creux de 10 px de haut
function barre(x, y, w, h, v, c){
  ctx.fillStyle = "#08121a"; rr(x - 2, y - 2, w + 4, h + 4, (h + 4)/2); ctx.fill();
  const f = Math.max(0, w*Math.min(1, v)); if (f > 1){ ctx.fillStyle = c; rr(x, y, f, h, h/2); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.28)"; rr(x + 1, y + 1, Math.max(0, f - 2), Math.ceil(h/3), h/6); ctx.fill(); }
}
// petite barre sans cadre (vie au-dessus des unités)
function jauge(x, y, w, h, v, c){
  ctx.fillStyle = "#120a1a"; ctx.fillRect(x - 1, y - 1, w + 2, h + 2); ctx.fillStyle = "#3a1c2a"; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = c; ctx.fillRect(x, y, Math.max(0, w*Math.min(1, v)), h);
}
let zones = [];
function zone(x, y, w, h, f){ zones.push({x, y, w, h, f}); }
function bouton(x, y, w, h, t, f, actif = true, pulse = false, couleur = 0, sub){
  // couleurs de la planche Dragon Regalia : 0 rouge, 1 bleu ciel, 2 prune, 3 ardoise
  // couleur 0 ou 1 : bouton principal (teal) ; 2 ou 3 : bouton secondaire (carte à liseré)
  const prim = actif && couleur < 2;
  ctx.fillStyle = !actif ? "#1b3038" : prim ? MOD.accent : MOD.carte; rr(x, y, w, h, Math.min(12, h/2)); ctx.fill();
  if (!prim){ ctx.lineWidth = 2; ctx.strokeStyle = actif ? MOD.accent : MOD.bord; rr(x, y, w, h, Math.min(12, h/2)); ctx.stroke(); }
  if (pulse && actif){ ctx.save(); ctx.globalAlpha = .25 + .25*Math.sin(G.t*6); ctx.lineWidth = 4; ctx.strokeStyle = "#ffffff"; rr(x - 2, y - 2, w + 4, h + 4, Math.min(14, h/2 + 2)); ctx.stroke(); ctx.restore(); }
  texte(t, x + w/2, y + h/2 + (sub ? -1 : 7), sub ? 17 : 19, !actif ? "#6f9a9a" : prim ? "#05211c" : MOD.txt, "center", {max: w - 18, ombre: false});
  if (sub) texte(sub, x + w/2, y + h/2 + 15, 12, !actif ? "#6f9a9a" : prim ? "#0b3a31" : MOD.doux, "center", {max: w - 18, ombre: false, gras: false});
  if (actif) zone(x, y, w, h, f);
}
function rr(x, y, w, h, r){ ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* ---------- sprites ---------- */
const MV = {repos: [0, 1], marche: [0, 0], coup: [1, 1], mal: [0, 4], mort: [2, 5], sort: [1, 4], victoire: [2, 1]};
function dessinerHeros(spr, act, ta, x, y, dir, opt = {}){
  const im = IMG.heros; if (!im.width) return; const idx = D.HEROS.indexOf(spr); if (idx < 0) return;
  const [c, r] = MV[act] || MV.repos;
  const f = (act === "repos" || act === "victoire" || act === "marche") ? [0, 1, 2, 1][Math.floor(ta*(act === "marche" ? 10 : 5)) % 4] : Math.min(2, Math.floor(ta*8));
  const e = opt.e || 2.2, sx = (c*3 + f)*32, sy = idx*192 + r*32;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (dir > 0) ctx.scale(-1, 1);
  if (opt.alpha !== undefined) ctx.globalAlpha = opt.alpha;
  ctx.drawImage(im, sx, sy, 32, 32, -16*e, -30*e, 32*e, 32*e);
  if (opt.blanc > 0){ ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, opt.blanc); ctx.drawImage(im, sx, sy, 32, 32, -16*e, -30*e, 32*e, 32*e); }
  ctx.restore();
}
function dessinerMonstre(i, elite, x, y, dir, opt = {}){
  const im = IMG.monstres; if (!im.width) return; const e = opt.e || 1.2;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (dir > 0) ctx.scale(-1, 1);
  if (opt.sx) ctx.scale(opt.sx, opt.sy || 1);
  if (opt.alpha !== undefined) ctx.globalAlpha = opt.alpha;
  // cases de 96 px (img/monstres.png), pieds à 92 px du haut de la case
  ctx.drawImage(im, (i - 1)*96, elite ? 96 : 0, 96, 96, -48*e, -92*e, 96*e, 96*e);
  if (opt.blanc > 0){ ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, opt.blanc); ctx.drawImage(im, (i - 1)*96, elite ? 96 : 0, 96, 96, -48*e, -92*e, 96*e, 96*e); }
  ctx.restore();
}
function aura(x, y, t, k = 1){
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createRadialGradient(x, y - 30, 4, x, y - 30, 46); g.addColorStop(0, `rgba(255,214,110,${.3*k})`); g.addColorStop(1, "rgba(255,190,60,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y - 30, 40, 52, 0, 0, 7); ctx.fill();
  ctx.fillStyle = `rgba(255,236,160,${.9*k})`;
  for (let i = 0; i < 6; i++){ const p = ((t*.6 + i/6) % 1), px = x + Math.sin(i*2.3 + t*2)*22, py = y - p*70; ctx.globalAlpha = (1 - p)*k; ctx.fillRect(px - 1, py - 1, 2, 2); }
  ctx.restore();
}
// arme équipée tenue dans la main avant : icône du butin (en diagonale, pointe en haut à droite), pivot sur la poignée.
// Corps à corps : levée derrière puis abattue devant pendant le coup ; bâtons : levés pendant le sort.
function dessinerArme(u, x, y){
  const o = u.h && u.h.equip.arme; if (!o || u.pv <= 0) return;
  const im = IMG.icones; if (!im.width) return;
  const cac = u.role === "cac", dir = u.dir || 1;
  let a = cac ? -0.15 : -0.75, hx = 13, hy = -24;
  if (u.act === "marche") a += Math.sin(u.ta*12)*0.12;
  else if (u.act === "repos" || u.act === "victoire") a += Math.sin(u.ta*2.5)*0.05;
  if (u.act === "coup"){ const k = Math.min(1, u.ta/0.3);
    if (cac){ a = k < 0.35 ? -1.7*(k/0.35) : -1.7 + 3.2*((k - 0.35)/0.65); hx = 13 + k*6; }
    else { a = -0.75 - Math.sin(k*Math.PI)*0.5; hy = -24 - Math.sin(k*Math.PI)*8; } }
  const s = 0.75, sx = o.ic[1]*32, sy = o.ic[0]*32;
  ctx.save(); ctx.translate(Math.round(x + dir*hx), Math.round(y + hy)); if (dir < 0) ctx.scale(-1, 1);
  if (o.ic[0] === 13){ ctx.rotate(Math.sin(u.ta*3)*0.06); ctx.drawImage(im, sx, sy, 32, 32, -16*s, -26*s, 32*s, 32*s); }   // grimoire tenu droit
  else if (o.ic[0] === 5 && o.ic[1] === 6){ ctx.rotate(a + Math.PI); ctx.drawImage(im, sx, sy, 32, 32, -25*s, -7*s, 32*s, 32*s); }   // dague : poignée en haut à droite dans l'icône
  else { ctx.rotate(a); ctx.drawImage(im, sx, sy, 32, 32, -7*s, -25*s, 32*s, 32*s); }   // poignée en bas à gauche, pointe en haut à droite
  ctx.restore();
}
function poussiere(u){ if (reduit) return; u.pas = (u.pas || 0) + 1; if (u.pas % 14) return;
  G.part.push({x: u.x - (u.dir || 1)*6, y: u.y, vx: -(u.dir || 1)*alea(10, 30), vy: alea(-25, -10), t: 0, d: .45, c: "rgba(210,190,220,.55)", g: 20}); }
function dessinerUnite(u){
  let x = u.x + (u.lunge > 0 ? Math.sin((.25 - u.lunge)/.25*Math.PI)*(u.dir || 1)*16 : 0), y = u.y;
  const blanc = Math.max(u.flash*6, u.blanc || 0);
  if (u.camp === "h"){
    if (u.pv <= 0){ dessinerHeros(u.spr, "mort", 1, x, y, u.dir, {alpha: .55}); return; }
    if (u.leg) aura(x, y, G.t);
    if (u.hate > 0){ ctx.fillStyle = "rgba(160,240,255,.35)"; ctx.beginPath(); ctx.ellipse(x, y + 2, 22, 6, 0, 0, 7); ctx.fill(); }
    if (u.givre > 0){ ctx.strokeStyle = `rgba(190,235,255,${.5 + .2*Math.sin(G.t*6)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y - 30, 26, 40, 0, 0, 7); ctx.stroke(); }
    let a = u.act, sh = 0, saut = 0, pench = 0; if (a === "mal") sh = Math.sin(u.ta*60)*3;
    // marche : petits bonds, buste penché vers l'avant, poussière aux pieds
    if (a === "marche"){ saut = -Math.abs(Math.sin(u.ta*11))*4; pench = (u.dir || 1)*0.07; poussiere(u); }
    ctx.save(); ctx.translate(x + sh, y + saut); ctx.rotate(pench);
    dessinerHeros(u.spr, a === "coup" ? (u.role === "cac" ? "coup" : "sort") : a, u.ta, 0, 0, u.dir, {blanc});
    dessinerArme(u, 0, 0);
    ctx.restore();
    if (u.gele > 0){ ctx.fillStyle = "rgba(190,235,255,.45)"; ctx.fillRect(x - 20, y - 66, 40, 68); ctx.strokeStyle = "#e8f8ff"; ctx.lineWidth = 2; ctx.strokeRect(x - 20, y - 66, 40, 68); }
  } else {
    const k = u.t*1.2, mort = u.pv <= 0;
    let yy = y, sx = 1, sy = 1;
    if (mort){ sy = Math.max(.05, 1 - u.mort*1.2); }
    else if (u.act === "marche"){ yy -= Math.abs(Math.sin(u.ta*9))*5; const b = Math.sin(u.ta*18)*.05; sx = 1 - b; sy = 1 + b; poussiere(u); }
    else { const b = Math.sin(u.ta*3)*.04; sx = 1 + b; sy = 1 - b; }
    let xx = x; if (u.act === "coup" && u.ta < .3 && u.role === "dist") xx -= (u.dir || -1)*Math.sin(u.ta/.3*Math.PI)*10;
    if (u.act === "mal") xx += Math.sin(u.ta*60)*3;
    if (u.ralenti > 0){ ctx.fillStyle = "rgba(140,200,255,.35)"; ctx.beginPath(); ctx.ellipse(x, y + 2, 26*u.t, 7, 0, 0, 7); ctx.fill(); }
    dessinerMonstre(u.i, u.elite, xx, yy, u.dir, {e: k, sx, sy, blanc, alpha: mort ? Math.max(0, 1 - u.mort*1.4) : undefined});
  }
}

/* ---------- décor : crépuscule, volcan, Muraille ---------- */
function fond(){
  const t = G.t;
  let g = ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, "#1a1040"); g.addColorStop(.5, "#6a3a7a"); g.addColorStop(.8, "#e07a5a"); g.addColorStop(1, "#40243a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff"; for (let i = 0; i < 46; i++){ ctx.globalAlpha = .3 + .3*Math.sin(t*2 + i); ctx.fillRect((i*97) % W, 36 + (i*53) % 60, 2, 2); } ctx.globalAlpha = 1;
  // la Gueule au loin
  ctx.fillStyle = "#3a2050"; ctx.beginPath(); ctx.moveTo(250, 104); [[340, 84], [430, 70], [490, 40], [570, 40], [630, 66], [700, 84], [760, 92], [760, 104]].forEach(p => ctx.lineTo(...p)); ctx.fill();
  const lg = .6 + Math.sin(t*2)*.2; ctx.fillStyle = `rgba(255,${110 + lg*60},40,${lg})`; ctx.fillRect(494, 37, 72, 6);
  ctx.fillStyle = "rgba(90,50,70,.45)"; for (let i = 0; i < 4; i++){ const yy = 36 - ((t*10 + i*20) % 70); ctx.beginPath(); ctx.arc(530 + Math.sin(t + i)*14, yy, 10 + i*4, 0, 7); ctx.fill(); }
  // sol
  ctx.fillStyle = "#2a1838"; ctx.fillRect(0, 100, W, H - 100);
  for (let y = 100; y < H; y += 4){ ctx.fillStyle = y % 8 ? "#33204a" : "#2a1838"; ctx.fillRect(0, y, W, 2); }
  ctx.fillStyle = "rgba(0,0,0,.22)"; for (let x = 0; x < W; x += 8) for (let y = 104; y < H; y += 8) if (((x + y)/8) % 2 === 0) ctx.fillRect(x, y, 4, 4);
  // cendres
  ctx.fillStyle = "#ffae6a"; for (const c of G.nuages){ c.y -= c.v*.016; c.x += Math.sin(t + c.y*.05)*.2; if (c.y < 0){ c.y = H; c.x = Math.random()*W; } ctx.globalAlpha = .4; ctx.fillRect(c.x, c.y, c.r, c.r); } ctx.globalAlpha = 1;
}
function muraille(){
  const y0 = 72, y1 = 302, X = R.MUR_X;
  ctx.fillStyle = "#4a4458"; ctx.fillRect(0, y0, X, y1 - y0);
  ctx.fillStyle = "#3a3448"; for (let y = y0 + 8; y < y1; y += 14) for (let x = ((y/14) % 2)*12; x < X; x += 24) ctx.fillRect(x, y, 22, 1);
  ctx.fillStyle = "#2c2838"; ctx.fillRect(X - 4, y0, 4, y1 - y0);
  ctx.fillStyle = "#5c566c"; for (let x = 0; x < X; x += 16) ctx.fillRect(x, y0 - 12, 10, 12);
  ctx.fillStyle = "#6a6480"; ctx.fillRect(0, y0, X, 4);
  ctx.fillStyle = "rgba(255,190,90,.6)"; ctx.fillRect(14, y0 + 30, 6, 10); ctx.fillRect(28, y0 + 120, 6, 10);
  if (G.run){ const v = G.run.mur/G.run.murMax; barre(74, 56, 90, 7, v, v > .35 ? "#e8dcc0" : "#e8402a"); texte("MURAILLE " + Math.ceil(G.run.mur), 172, 63, 12, "#fff"); }
}

/* ---------- écrans : titre ---------- */
function ecranTitre(){
  fond(); muraille();
  const s = statsJoueur(), sauve = runSauvee();
  ctx.save(); const k = 1 + Math.sin(G.t*1.5)*.02; ctx.translate(250, 90); ctx.scale(k, k);
  texte("LES BANNIS", 0, 0, 34, "#ffd76a", "center", {titre: true, ombreC: "#3a0a20"}); ctx.restore();
  texte("Tenir la Muraille jusqu'au matin", 250, 122, 16, "#ffe9c8", "center");
  // l'escouade de l'écran titre
  [["glenys-3", 170, 290], ["ley-2", 130, 240], ["linail-2", 215, 235]].forEach(([spr, x, y], i) => dessinerHeros(spr, "repos", G.t + i, x, y, 1, {e: 1.8}));
  dessinerMonstre(19, false, 400, 300, -1, {e: 1.2}); dessinerMonstre(14, false, 340, 220, -1, {e: 1.3});
  // le menu à droite
  panneau(500, 40, 252, 300);
  let y = 54;
  if (sauve){ bouton(514, y, 224, 44, "CONTINUER · VAGUE " + sauve.vague, () => { G.run = sauve; R.preparerVague(G.run); allerPlacement(); SON.clic(); }, true, true); y += 52; }
  bouton(514, y, 224, 44, "NOUVELLE NUIT", () => { if (sauve) effacer("bannis.run"); nouvelleNuit(); SON.clic(); }, true, !sauve, sauve ? 2 : 0); y += 52;
  bouton(514, y, 224, 44, "ARBRE DES DES · " + s.eclats, () => ouvrirArbre("titre"), true, false, 2); y += 52;
  if (!window.ludoArtefact){ bouton(514, y, 224, 38, "◀ LUDOTHEQUE", () => { try { screen.orientation.unlock(); } catch (e){} location.href = "../index.html"; }, true, false, 3); y += 44; }
  const rec = s.nuits ? `Record : vague ${s.record}${s.gagnees ? "  ·  nuits tenues : " + s.gagnees : ""}` : "Le Mage banni et ses condamnés contre la Gueule.";
  texte(rec, 626, Math.min(y + 14, 330), 12, "#ffe3a8", "center", {gras: false, max: 232});
  // son
  petit(8, 36, 44, 30); texte(sonOn ? "SON" : "MUET", 30, 56, 12, "#fff", "center"); zone(8, 36, 44, 30, () => { sonOn = !sonOn; ecrire("bannis.son", sonOn); audio(); SON.clic(); });
}

/* ---------- dés à symboles : interface moderne (maquette 6, direction B, 27/11) ---------- */
try { document.fonts.load("700 20px \"Titillium Web\""); document.fonts.load("600 20px \"Titillium Web\""); } catch (e){}
const NOMFACE = {recrue: "RECRUE", bourse: "BOURSE", benediction: "BENEDICTION", danger: "RAID", coffre: "COFFRE", calme: "CALME"};
function policeM(px, gras){ ctx.font = `${gras === false ? 600 : 700} ${Math.round(px)}px "Titillium Web", "Jersey 10", sans-serif`; }
function texteM(t, x, y, px, c = MOD.txt, al = "left", opt = {}){
  policeM(px, opt.gras); let p = px;
  if (opt.max) while (p > 9 && ctx.measureText(t).width > opt.max){ p--; policeM(p, opt.gras); }
  ctx.textAlign = al; ctx.textBaseline = "alphabetic"; ctx.fillStyle = c; ctx.fillText(t, x, y);
}
function paragrapheM(t, x, y, larg, px, c = MOD.doux, interligne = 1.3, al = "left"){
  policeM(px, false); const mots = t.split(" "); let ligne = "", yy = y;
  for (const m of mots){ const essai = ligne ? ligne + " " + m : m; if (ctx.measureText(essai).width > larg && ligne){ texteM(ligne, x, yy, px, c, al, {gras: false}); ligne = m; yy += px*interligne; } else ligne = essai; }
  if (ligne){ texteM(ligne, x, yy, px, c, al, {gras: false}); yy += px*interligne; }
  return yy - y;
}
function boutonM(x, y, w, h, t, f, clair = true, actif = true){
  ctx.fillStyle = !actif ? "#24444b" : clair ? MOD.accent : MOD.carte; rr(x, y, w, h, 12); ctx.fill();
  if (!clair && actif){ ctx.lineWidth = 2; ctx.strokeStyle = MOD.bord; rr(x, y, w, h, 12); ctx.stroke(); }
  texteM(t, x + w/2, y + h/2 + 7, 19, !actif ? "#6f9a9a" : clair ? "#05211c" : MOD.txt, "center", {max: w - 24});
  if (actif) zone(x, y, w, h, f);
}
function nomFace(type, k){ return type === "slot" ? D.CLASSES[k].n : type === "quoi" ? D.SLOTS[k].n : type === "qual" ? D.RARETES[k].n : type === "act" ? D.ACTIONS[k].n : NOMFACE[k]; }
function gemme(cx, cy, r, c){ ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = c; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r*.8, 0); ctx.lineTo(0, r); ctx.lineTo(-r*.8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r*.8, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
// une face de dé : type "slot" (classe), "quoi", "qual" ou "event" ; o.sel : liseré, o.etiquette : nom dessous
// animation de lancer : o.t0 (début, peut être dans le futur), o.pool (faces qui défilent), o.dur ; o.deal : arrivée en glissant
function tileFace(type, k, x, y, s, o = {}){
  ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  let rot = 0, zoom = 1, dy = 0, cache = false;
  if (o.t0 !== undefined){
    const a = G.t - o.t0, dur = o.dur || .9;
    if (a < 0) cache = true;
    else if (a < dur){ const u = a/dur, d = 1 - u;
      if (o.pool && o.pool.length) k = o.pool[Math.floor(a*15) % o.pool.length];
      rot = d*d*Math.PI*4.5*(((Math.floor(o.t0*7)) % 2) ? 1 : -1); dy = -Math.abs(Math.sin(u*Math.PI*3))*d*s*.45; zoom = 1 + .12*Math.sin(u*Math.PI);
      ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(x + s/2, y + s + 4, s*.38*(1 - dy/s*-.6), s*.07, 0, 0, 7); ctx.fill(); }
    else if (a < dur + .3){ const u = (a - dur)/.3; zoom = 1 + .14*Math.sin(u*Math.PI)*(1 - u); }
  }
  if (o.deal !== undefined){ const a = Math.min(1, Math.max(0, (G.t - o.deal)/.35)), e = 1 - (1 - a)*(1 - a); dy += (1 - e)*34; ctx.globalAlpha *= e; }
  const cx = x + s/2, cy = y + s/2 + dy;
  if (rot || zoom !== 1){ ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy); }
  y += dy;
  ctx.fillStyle = o.fond || MOD.carte; rr(x, y, s, s, s*.2); ctx.fill();
  ctx.lineWidth = o.sel ? 3 : 2; ctx.strokeStyle = o.sel ? MOD.accent : MOD.bord; rr(x, y, s, s, s*.2); ctx.stroke();
  if (cache){ texteM("?", cx, y + s*.66, s*.5, MOD.accent, "center", {ombre: false}); ctx.restore(); return; }
  const et = o.etiquette && s >= 40 && !(rot);
  const ch = et ? s*.46 : s*.5;   // centre du symbole
  if (type === "slot") dessinerHeros(D.CLASSES[k].spr, "repos", G.t, cx, y + (et ? s*.62 : s*.7), 1, {e: s/(et ? 52 : 44)});
  else if (type === "quoi"){ const t = s*(et ? .5 : .62); icone(D.SLOTS[k].noms[0][1], cx - t/2, y + ch - t/2, t); }
  else if (type === "qual") gemme(cx, y + ch, s*(et ? .27 : .32), D.RARETES[k].c);
  else if (type === "act"){ const E = D.ACTIONS[k]; if (E.ic){ const t = s*(et ? .5 : .62); icone(E.ic, cx - t/2, y + ch - t/2, t); } else dessinerHeros("glenys-3", "repos", G.t, cx, y + (et ? s*.62 : s*.7), 1, {e: s/(et ? 52 : 44)}); }
  else { const E = D.EVENEMENTS[k]; if (E.ic){ const t = s*(et ? .5 : .62); icone(E.ic, cx - t/2, y + ch - t/2, t); } else dessinerHeros("glenys-3", "repos", G.t, cx, y + (et ? s*.62 : s*.7), 1, {e: s/(et ? 52 : 44)}); }
  if (et) texteM(nomFace(type, k), cx, y + s - 7, Math.max(10, s*.13), MOD.txt, "center", {max: s - 8});
  ctx.restore();
}
const fini = (t0, dur = .9) => t0 !== undefined && G.t >= t0 + dur;   // le dé a fini de rouler
const aRoule = t0 => t0 !== undefined && G.t - t0 < .5 ? {rot: (G.t - t0)/.5*Math.PI*2, zoom: 1 + .25*Math.sin((G.t - t0)/.5*Math.PI)} : {};

/* ---------- petit tuto (première fois, puis bouton ?) ---------- */
const TUTO = [
  {t: "UN DE PAR CASE", d: "Chaque case de la Muraille a son propre dé. Sur chaque face, il y a une classe de combattant. La face qui sort décide qui vient te défendre.", f: [["slot", "guerriere"], ["slot", "magicienne"], ["slot", "pretresse"]]},
  {t: "DEUX DES POUR LE BUTIN", d: "Après une vague, deux dés tombent : QUOI (une arme, une armure ou un bijou) et QUELLE QUALITE (gris : commun, bleu : rare, violet : épique, or : légendaire).", f: [["quoi", "arme"], ["quoi", "armure"], ["qual", 1], ["qual", 2]]},
  {t: "L'ARBRE DES DES", d: "À la fin d'une nuit, tu gagnes des éclats de Gueule. Entre deux nuits, ils achètent des paliers dans l'arbre : chaque palier te donne une gravure, que tu poses pour de bon sur une face d'un dé. Grave la même classe sur les six faces d'une case, et elle sortira toujours.", f: [["slot", "mercenaire"], ["qual", 3], ["quoi", "bijou"]]},
  {t: "LES EVENEMENTS", d: "Toutes les trois vagues, un dé d'événement tombe : un nouveau condamné, un coffre, une bénédiction, un raid... Le hasard continue, mais tu peux le préparer.", f: [["event", "recrue"], ["event", "coffre"], ["event", "danger"]]},
  {t: "LE DE D'ACTION", d: "Tes combattants rapportent de l'or. Chaque lancer du dé d'action en coûte : une recrue (ou un héros qui monte de niveau s'il est déjà là), un objet, un progrès, un soin, un sort ou une relique. Le prix monte à chaque lancer et revient à zéro à la vague suivante : 3 lancers avant le combat, 1 en urgence.", f: [["act", "recrue"], ["act", "objet"], ["act", "relique"]]}
];
function ecranTuto(){
  const p = G.tuto.p, P = TUTO[p];
  zone(0, 0, W, H, () => {});
  ctx.fillStyle = "rgba(5,12,16,.9)"; ctx.fillRect(0, 0, W, H);
  carteM(80, 16, 600, 328, MOD.accent, MOD.fond);
  texteM("COMMENT CA MARCHE  " + (p + 1) + "/" + TUTO.length, W/2, 46, 13, MOD.doux, "center");
  texteM(P.t, W/2, 82, 26, MOD.txt, "center", {max: 540});
  const n = P.f.length, s = 66, g = 14, x0 = (W - (n*s + (n - 1)*g))/2;
  P.f.forEach(([ty, k], i) => tileFace(ty, k, x0 + i*(s + g), 98, s, {etiquette: true, ...aRoule(G.tuto.t0 + i*.12)}));
  paragrapheM(P.d, 120, 198, 520, 16, MOD.txt, 1.3);
  if (p) boutonM(110, 288, 110, 42, "RETOUR", () => { G.tuto.p--; G.tuto.t0 = G.t; SON.clic(); }, false);
  boutonM(p ? 232 : 110, 288, p ? 418 : 540, 42, p === TUTO.length - 1 ? "COMPRIS !" : "SUIVANT", () => {
    SON.clic(); if (p === TUTO.length - 1){ G.tuto = null; if (G.ecran !== "recrutement") return; ecrire("bannis.tuto", 1); lancerAnim(); } else { G.tuto.p++; G.tuto.t0 = G.t; } }, true);
}
function ouvrirTuto(){ G.tuto = {p: 0, t0: G.t}; SON.clic(); }

/* ---------- fil d'étapes et consigne (butin) ---------- */
function etapesButin(){
  const v = G.run.vague, B = G.butin, l = [["BILAN", ["bilan", "niveau", "evolution"]], ["OBJET", ["objet", "equiper"]]];
  if (v % 3 === 0 || B.evFait) l.push(["EVENEMENT", ["evenement"]]);
  l.push(["MARCHAND", ["marchand"]]);
  return l;
}
function filEtapes(){
  const l = etapesButin(), n = l.length, g = 4, w = 92, cur = l.findIndex(e => e[1].includes(G.butin.etape));
  l.forEach(([nom], i) => { const x = 8 + i*(w + g), y = 36, on = i === cur, pass = i < cur;
    ctx.fillStyle = on ? MOD.accent : "rgba(14,26,34,.9)"; rr(x, y, w, 20, 10); ctx.fill();
    if (!on){ ctx.lineWidth = 1.5; ctx.strokeStyle = pass ? MOD.bord : "#1c3a44"; rr(x, y, w, 20, 10); ctx.stroke(); }
    texte((pass ? "OK  " : (i + 1) + ". ") + nom, x + w/2, y + 15, 11, on ? "#05211c" : pass ? MOD.doux : "#5f8a8a", "center", {ombre: false, max: w - 8}); });
}
// bandeau « A FAIRE » sous le fil d'étapes
function consigne(t, sous){
  ctx.fillStyle = "rgba(14,26,34,.95)"; rr(8, 60, W - 16, 26, 8); ctx.fill(); ctx.fillStyle = MOD.accent; rr(8, 60, 5, 26, 2); ctx.fill();
  texte("A FAIRE : " + t, 22, 78, 14, MOD.or, "left", {ombre: false, max: sous ? 330 : W - 40});
  if (sous) texte(sous, 22 + Math.min(330, 12 + (police(14), ctx.measureText("A FAIRE : " + t).width)), 78, 12, MOD.doux, "left", {ombre: false, gras: false, max: W - 60 - Math.min(330, 12 + (police(14), ctx.measureText("A FAIRE : " + t).width))});
}

/* ---------- l'arbre des dés : entre les nuits, les éclats de Gueule achètent des gravures ---------- */
const BR_TYPE = {classes: "slot", qual: "qual", quoi: "quoi", action: "act"};
const BR_NOM = {classes: "CLASSE", qual: "QUALITE", quoi: "OBJET", action: "ACTION"};
function ouvrirArbre(retour){ G.a = R.arbreCharger(lire("bannis.arbre", null)); G.ecran = "arbre"; G.arbreOnglet = "arbre"; G.forge = {br: null, face: null}; G.arbreRetour = retour || "titre"; G.arbreMsg = null; SON.clic(); }
function msgArbre(t){ G.arbreMsg = {t, t0: G.t}; }
function acheterArbre(b, cle){
  const s = statsJoueur(), c = R.acheter(G.a, s.eclats, b, cle);
  if (!c){ msgArbre(s.eclats ? "Pas assez d'éclats." : "Tu n'as pas d'éclats : gagne une nuit ou tiens longtemps."); SON.clic(); return; }
  s.eclats -= c; ecrire("bannis.stats", s); ecrire("bannis.arbre", G.a); SON.niveau(); SON.des(4);
  msgArbre(b === "legendes" ? "Légende débloquée : " + D.CLASSES[cle].leg.n + "." : "Palier acheté : une gravure de plus dans la FORGE.");
}
function ecranArbre(){
  const a = G.a, s = statsJoueur();
  ctx.fillStyle = MOD.fond; ctx.fillRect(0, 0, W, H);
  texteM("L'ARBRE DES DES", 14, 28, 22, MOD.txt, "left", {max: 230});
  texteM(s.eclats + " éclats de Gueule", 14, 50, 14, MOD.or, "left", {max: 230});
  const ong = G.arbreOnglet;
  boutonM(270, 6, 160, 34, "ARBRE (ACHETER)", () => { G.arbreOnglet = "arbre"; SON.clic(); }, ong === "arbre");
  boutonM(440, 6, 160, 34, "FORGE (GRAVER)", () => { G.arbreOnglet = "forge"; SON.clic(); }, ong === "forge");
  boutonM(W - 130, 6, 120, 34, "RETOUR", () => { G.ecran = G.arbreRetour; SON.clic(); }, false);
  const msg = G.arbreMsg && G.t - G.arbreMsg.t0 < 3 ? G.arbreMsg.t : null;
  if (msg) texteM(msg, 270, 58, 12, MOD.or, "left", {max: 480});
  if (ong === "arbre"){
    const cartes = ["classes", "qual", "quoi", "action", "legendes"];
    cartes.forEach((b, ci) => {
      const x = 8 + (ci % 3)*252, y = 66 + Math.floor(ci/3)*148;
      if (b === "legendes"){
        const T = D.ARBRE.legendes; carteM(x, y, 244, 140); texteM(T.n, x + 14, y + 26, 17, MOD.txt, "left"); texteM(a.legendaires.length + " / 6", x + 230, y + 26, 14, MOD.accent, "right");
        paragrapheM(T.d + " " + T.cout + " éclats chacune.", x + 14, y + 46, 216, 11.5, MOD.doux, 1.2);
        Object.keys(D.CLASSES).forEach((k, i) => { const cx = x + 8 + (i % 6)*39, cy = y + 90, ach = a.legendaires.includes(k), peut = s.eclats >= T.cout;
          ctx.fillStyle = ach ? "rgba(61,220,190,.25)" : MOD.carte; rr(cx, cy, 36, 40, 7); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = ach ? MOD.accent : peut ? MOD.bord : "#1c3a44"; rr(cx, cy, 36, 40, 7); ctx.stroke();
          ctx.save(); ctx.globalAlpha = ach || peut ? 1 : .45; dessinerHeros(D.CLASSES[k].leg.spr, "repos", G.t, cx + 18, cy + 38, 1, {e: 1}); ctx.restore();
          if (!ach) zone(cx, cy, 36, 40, () => acheterArbre("legendes", k)); });
        return;
      }
      const T = D.ARBRE[b], n = T.couts.length;
      carteM(x, y, 244, 140); texteM(T.n, x + 14, y + 26, 17, MOD.txt, "left"); texteM(a.niv[b] + " / " + n, x + 230, y + 26, 14, MOD.accent, "right");
      paragrapheM(T.d, x + 14, y + 46, 216, 11.5, MOD.doux, 1.2);
      for (let i = 0; i < n; i++){
        const cx = x + 8 + i*39, cy = y + 94, ach = i < a.niv[b], proch = i === a.niv[b], cout = T.couts[i], peut = proch && s.eclats >= cout;
        ctx.fillStyle = ach ? MOD.accent : MOD.carte; rr(cx, cy, 36, 34, 8); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = ach ? MOD.accent : proch ? (peut ? MOD.accent : MOD.alerte) : MOD.bord; rr(cx, cy, 36, 34, 8); ctx.stroke();
        texteM(ach ? "OK" : String(cout), cx + 18, cy + 23, 14, ach ? "#05211c" : proch ? (peut ? MOD.txt : MOD.alerte) : MOD.doux, "center", {ombre: false});
        if (proch) zone(cx, cy, 36, 34, () => acheterArbre(b));
      }
    });
    carteM(512, 214, 236, 136, MOD.bord, "rgba(14,26,34,.7)"); paragrapheM("Chaque palier acheté donne une gravure : va dans la FORGE pour la poser sur une face d'un dé de départ.", 526, 240, 208, 12.5, MOD.doux, 1.25);
    boutonM(526, 300, 208, 40, "ALLER A LA FORGE", () => { G.arbreOnglet = "forge"; SON.clic(); }, false);
  } else {
    const br = G.forge.br, creds = b => R.creditsGravure(a, b);
    texteM("1. CHOISIS UNE GRAVURE (tes crédits)", 14, 76, 12, MOD.accent, "left");
    R.BRANCHES.forEach((b, i) => { const x = 14 + (i % 2)*148, y = 84 + Math.floor(i/2)*46, c = creds(b), sel = br === b;
      ctx.fillStyle = sel ? MOD.accent : MOD.carte; rr(x, y, 142, 40, 9); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = c ? MOD.accent : MOD.bord; rr(x, y, 142, 40, 9); ctx.stroke();
      texteM(BR_NOM[b] + "   x" + c, x + 71, y + 26, 15, sel ? "#05211c" : c ? MOD.txt : MOD.doux, "center", {ombre: false});
      if (c) zone(x, y, 142, 40, () => { G.forge = {br: b, face: null}; SON.clic(); }); });
    if (!br){ paragrapheM("Aucune gravure choisie. Un palier acheté dans l'ARBRE donne un crédit ici. À droite : les dés avec lesquels tu commenceras la prochaine nuit.", 14, 190, 288, 13, MOD.doux, 1.25); }
    else {
      const poss = R.facesGravables(a, br), ty = BR_TYPE[br];
      texteM("2. CHOISIS LA FACE A GRAVER", 14, 186, 12, MOD.accent, "left");
      poss.forEach((f, i) => { const x = 14 + i*48; tileFace(ty, f, x, 194, 44, {sel: G.forge.face === f}); zone(x, 194, 44, 44, () => { G.forge.face = f; SON.clic(); }); });
      if (!poss.length) texteM("Achète le palier 1 de QUALITE dans l'arbre.", 14, 218, 12, MOD.alerte, "left");
      if (G.forge.face !== null) paragrapheM("3. TOUCHE, A DROITE, LA FACE A REMPLACER PAR " + nomFace(ty, G.forge.face) + ".", 14, 264, 288, 13, MOD.accent, 1.2);
    }
    const src = R.facesDeDepart(a), face = G.forge.face;
    rangeesDes(34, (ty) => br && face !== null && ty === BR_TYPE[br], (ty, d, i) => {
      if (!R.graverArbre(a, br, face, i, d)) return; ecrire("bannis.arbre", a); SON.or(); SON.des(5); G.forge.face = null; if (!creds(br)) G.forge.br = null; msgArbre("Gravé pour de bon sur le dé."); }, null, src, 52, 34, 316);
    boutonM(14, 304, 288, 40, "TOUT REMETTRE A ZERO", () => { R.remettreAZero(a); ecrire("bannis.arbre", a); G.forge = {br: null, face: null}; msgArbre("Dés remis comme au départ : les gravures sont rendues."); SON.clic(); }, false);
  }
}

/* ---------- recrutement : un dé par case ---------- */
function lancerAnim(){ G.rolls = [G.t + .2, G.t + .55, G.t + .9]; SON.des(11, .2); }
function nouvelleNuit(){
  G.run = R.nouvelleRun(); G.run.faces = R.facesDeDepart(R.arbreCharger(lire("bannis.arbre", null))); G.recrues = R.recruesDes(G.run); G.choisies = G.recrues.slice(); G.relR = 1; G.ecran = "recrutement";
  G.tuto = lire("bannis.tuto", 0) ? null : {p: 0, t0: G.t}; G.rolls = [-9, -9, -9]; if (!G.tuto) lancerAnim();
}
function ecranRecrutement(){
  ctx.fillStyle = MOD.fond; ctx.fillRect(0, 0, W, H);
  texteM("ETAPE 1 : TES CONDAMNES", 16, 28, 21, MOD.txt, "left", {max: 400});
  boutonM(W - 46, 6, 34, 28, "?", ouvrirTuto, false);
  ctx.fillStyle = "rgba(61,220,190,.1)"; rr(10, 38, W - 20, 28, 8); ctx.fill(); ctx.fillStyle = MOD.accent; rr(10, 38, 5, 28, 2); ctx.fill();
  texteM("A FAIRE : les dés ont désigné tes 3 combattants. Relance UN dé en le touchant si tu veux, puis appuie sur A LA MURAILLE.", 24, 57, 14, MOD.txt, "left", {max: W - 50, gras: false});
  const tousFinis = G.rolls.every(t => fini(t, .9));
  G.recrues.forEach((h, i) => {
    const x = 10 + i*250, y = 74, C = D.CLASSES[h.cls], s0 = R.stats(h), pret = fini(G.rolls[i], .9);
    carteM(x, y, 240, 222);
    tileFace("slot", h.cls, x + 12, y + 12, 80, {sel: G.relR > 0 && pret, etiquette: pret, t0: G.rolls[i], pool: G.run.faces.slots[i], dur: .9});
    texteM("DE DE LA CASE " + (i + 1), x + 52, y + 108, 11, MOD.doux, "center");
    if (G.relR > 0 && pret){ texteM("touche pour relancer", x + 52, y + 122, 11, MOD.accent, "center"); zone(x + 12, y + 12, 80, 112, () => {
      const pris = G.recrues.filter((_, j) => j !== i).map(v => v.nom);
      G.recrues[i] = R.recrueDeCase(G.run, i, pris); G.choisies = G.recrues.slice(); G.relR--; G.rolls[i] = G.t; SON.des(8); }); }
    ctx.fillStyle = pret ? MOD.accent : MOD.bord; ctx.beginPath(); ctx.moveTo(x + 98, y + 36); ctx.lineTo(x + 98, y + 58); ctx.lineTo(x + 110, y + 47); ctx.closePath(); ctx.fill();
    if (!pret){ texteM("Le dé roule...", x + 120, y + 56, 17, MOD.doux, "left"); return; }
    texteM(h.nom, x + 116, y + 32, 21, MOD.txt, "left", {max: 116});
    texteM(C.n + " · " + D.ROLES[C.role], x + 116, y + 52, 12, MOD.accent, "left", {max: 118});
    texteM(`VIE ${s0.pv}  ATQ ${s0.atq}  DEF ${s0.def}`, x + 116, y + 74, 12, MOD.txt, "left", {max: 118});
    texteM("TRAIT : " + D.TRAITS[h.trait].n, x + 116, y + 94, 12, MOD.alerte, "left", {max: 118});
    paragrapheM(D.TRAITS[h.trait].d, x + 12, y + 148, 216, 11, MOD.doux, 1.2);
    texteM("LES 6 FACES DE CE DE :", x + 12, y + 190, 11, MOD.doux, "left");
    G.run.faces.slots[i].forEach((k, j) => tileFace("slot", k, x + 12 + j*36, y + 194, 28, {alpha: k === h.cls ? 1 : .75}));
  });
  texteM(!tousFinis ? "Les dés roulent..." : G.relR > 0 ? "Relance disponible : 1" : "Relance utilisée", 16, 330, 14, G.relR > 0 && tousFinis ? MOD.accent : MOD.doux, "left");
  boutonM(300, 304, 450, 46, "A LA MURAILLE !", () => {
    G.run.heros = G.recrues.slice(); R.placerParDefaut(G.run); R.preparerVague(G.run); allerPlacement(); SON.pose(); }, true, tousFinis);
  if (G.tuto) ecranTuto();
}

/* ---------- butin : atelier et événement ---------- */
function rangeesDes(y0, ok, onTap, gravee, src, pas = 62, ts = 44, xd = 20){
  src = src || G.run.faces;
  const lignes = [["slot", 0, "CASE 1 · COMBATTANTS"], ["slot", 1, "CASE 2 · COMBATTANTS"], ["slot", 2, "CASE 3 · COMBATTANTS"], ["quoi", 0, "DE QUOI (ARME, ARMURE, BIJOU)"], ["qual", 0, "DE QUALITE (RARETE DE L'OBJET)"], ["act", 0, "DE D'ACTION (CE QU'UN LANCER RAPPORTE)"]];
  lignes.forEach(([ty, d, nom], r) => {
    const y = y0 + r*pas, f = ty === "slot" ? src.slots[d] : ty === "act" ? src.action : src[ty], actif = ok(ty, d);
    texteM(nom, xd, y + 11, 11, actif ? MOD.accent : MOD.doux, "left");
    f.forEach((k, i) => { const x = xd + i*(ts + 8), g = gravee && gravee.ty === ty && gravee.d === d && gravee.i === i;
      tileFace(ty, k, x, y + 14, ts, {sel: actif || g, alpha: actif || g || gravee ? 1 : .35, ...(g ? {t0: gravee.t0, pool: gravee.pool, dur: .7} : {})});
      if (actif && onTap) zone(x, y + 14, ts, ts, () => onTap(ty, d, i)); });
  });
}
function ecranEvenement(){
  const B = G.butin, e = B.ev, E = e.k ? D.EVENEMENTS[e.k] : null, DUR = 1.4;
  carteM(8, 92, W - 16, 260, MOD.bord, "rgba(14,26,34,.97)");
  const fin = e.t0 !== null && fini(e.t0, DUR + .3);
  consigne(e.t0 === null ? "lance le dé d'événement" : fin ? "lis ce qui arrive" : "le dé roule...", e.t0 === null ? "Il tombe après les vagues 3, 6 et 9." : "");
  if (!e.k){ carteM(46, 130, 120, 120, MOD.accent); texteM("?", 106, 218, 72, MOD.accent, "center"); }
  else tileFace("event", e.k, 46, 130, 120, {etiquette: fin, sel: fin, t0: e.t0, pool: G.run.faces.event, dur: DUR});
  if (e.t0 === null){
    texteM("LES 6 FACES DE CE DE :", 200, 114, 12, MOD.accent, "left");
    G.run.faces.event.forEach((k, i) => { const x = 200 + (i % 2)*280, y = 122 + Math.floor(i/2)*54, Ev = D.EVENEMENTS[k];
      tileFace("event", k, x, y, 40, {});
      texteM(Ev.n, x + 50, y + 18, 14, MOD.txt, "left", {max: 224}); texteM(Ev.d, x + 50, y + 34, 11, MOD.doux, "left", {gras: false, max: 224}); });
    boutonM(200, 296, 548, 46, "LANCER LE DE", () => { e.t0 = G.t; e.k = R.lancerEvenement(G.run); e.res = R.appliquerEvenement(G.run, e.k); SON.des(14); });
    return;
  }
  if (!fin) return;
  texteM(E.n, 210, 150, 24, MOD.accent, "left", {max: 520});
  const h1 = paragrapheM(E.d, 210, 184, 520, 16, MOD.txt, 1.25);
  if (e.res.texte) paragrapheM(e.res.texte, 210, 184 + h1 + 12, 520, 16, MOD.or, 1.25);
  boutonM(200, 296, 548, 46, "CONTINUER", () => {
    SON.clic();
    if (e.k === "coffre"){ B.objets = [R.genererObjet(G.run.vague, true, G.run)]; B.pris = null; B.tObj = undefined; }
    suiteButin(); });
}

/* ---------- placement et combat ---------- */
function allerPlacement(){
  G.ecran = "place"; G.sel = -1; G.C = null; G.lancer = null; G.evo = null; G.butin = null;
  if (!lire("bannis.tuto2", 0) && !G.tuto){ G.tuto = {p: TUTO.length - 1, t0: G.t, seul: true}; ecrire("bannis.tuto2", 1); } G.txt = []; G.part = []; G.fx = [];
  G.unitesPlace = G.run.heros.map(h => { const c = R.CASES[h.slot]; return {h, x: c[0], y: c[1], ta: Math.random()*2}; });
  sauverRun();
}
function lancerCombat(){
  G.C = R.debutCombat(G.run); G.ecran = "combat"; G.lancer = null; G.sel = -1; SON.pose();
}
function hud(){
  panneau(4, 3, W - 8, 28);
  texte("VAGUE " + G.run.vague + "/" + D.NB_VAGUES, 16, 23, 16, "#fff");
  icone([12, 7], 128, 6, 22); texte(String(G.run.or), 156, 23, 16, "#ffe14a");
  if (G.ecran === "combat"){
    petit(W - 108, 5, 44, 24); texte("x" + G.vitesse, W - 86, 23, 14, "#fff", "center");
    zone(W - 108, 5, 44, 24, () => { G.vitesse = G.vitesse === 1 ? 2 : 1; ecrire("bannis.vitesse", G.vitesse); SON.clic(); });
  }
  petit(W - 56, 5, 44, 24); ctx.fillStyle = "#fff"; ctx.fillRect(W - 40, 10, 5, 14); ctx.fillRect(W - 30, 10, 5, 14);
  zone(W - 56, 5, 44, 24, () => { G.pause = true; SON.clic(); });
}
function bandeau(){
  if (G.ecran === "place"){
    panneau(262, 38, 282, 56);
    texte("VAGUE ANNONCEE", 274, 56, 12, "#ffe3a8");
    texte(G.run.revele ? "VAGUE REVELEE" : "", 532, 56, 12, "#ffe14a", "right");
    const ap = R.apercu(G.run);
    ap.slice(0, 6).forEach((m, i) => {
      const x = 272 + i*42, y = 60; ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(x, y, 38, 30);
      if (m.cache){ texte("?", x + 19, y + 24, 20, "#ffe14a", "center"); return; }
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, 38, 30); ctx.clip(); dessinerMonstre(D.MONSTRES[m.k].i, false, x + 19, y + 29, -1, {e: .34}); ctx.restore();
      texte(m.boss ? "BOSS" : "x" + m.n, x + 37, y + 28, 11, m.boss ? "#ff7a5a" : "#fff", "right");
    });
  } else if (G.ecran === "combat"){
    const C = G.C, reste = C.file.length + R.vivants(C, "m").length, tot = C.total || 1;
    texte("lancers d'urgence : " + G.run.urgence, 205, 23, 13, G.run.urgence ? MOD.or : MOD.doux, "left", {ombre: false});
    barre(380, 13, 140, 7, 1 - reste/tot, MOD.accent);
    texte("monstres : " + reste, 540, 23, 13, "#fff", "left", {gras: false});
  }
}
function cartes(){
  const hs = G.run.heros, n = hs.length, wd = Math.min(160, Math.floor(496/n) - 4);
  hs.forEach((h, i) => {
    const x = 8 + i*(wd + 4), y = 302, hh = 52, s = R.stats(h), cl = R.classeDe(h);
    const u = G.C ? G.C.unites.find(v => v.h === h) : null, pv = u ? u.pv : h.pv, pvMax = u ? u.pvMax : s.pv, mort = pv <= 0;
    panneau(x, y, wd, hh);
    ctx.save(); if (mort) ctx.globalAlpha = .5;
    texte(h.nom, x + 10, y + 20, 16, "#fff", "left", {max: wd - 44});
    ctx.fillStyle = MOD.accent; ctx.beginPath(); ctx.arc(x + wd - 15, y + 15, 10, 0, 7); ctx.fill(); texte(String(h.niv), x + wd - 15, y + 20, 13, "#05211c", "center", {ombre: false});
    texte(cl.n, x + 10, y + 35, 11, h.leg ? "#ffd76a" : "#d8e4ff", "left", {max: wd - 20, gras: !!h.leg});
    barre(x + 10, y + 40, wd - 20, 6, pv/pvMax, pv/pvMax > .35 ? "#4ad05a" : "#e8402a");
    const xp0 = D.XP_NIVEAUX[h.niv - 1] || 0, xp1 = R.nivSuivant(h);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x + 10, y + 48, wd - 20, 2); ctx.fillStyle = "#9ad8ff"; ctx.fillRect(x + 10, y + 48, (wd - 20)*Math.min(1, (h.xp - xp0)/Math.max(1, xp1 - xp0)), 2);
    ctx.restore();
    if (G.sel === i){ ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 3; rr(x + 2, y + 2, wd - 4, hh - 4, 8); ctx.stroke(); }
    zone(x, y, wd, hh, () => { G.fiche = h; SON.clic(); });
  });
}
function objets(){
  const st = G.run.stock, liste = [["potion", [9, 0]], ["parchemin", [21, 1]], ["vue", [10, 7]]];
  liste.forEach(([k, ic], i) => {
    const x = 512 + i*38, y = 304, n = st[k] || 0;
    const utile = n > 0 && ((k === "potion" && G.ecran === "combat") || (k === "parchemin" && G.ecran === "combat") || (k === "vue" && G.ecran === "place" && !G.run.revele));
    panneau(x, y, 34, 34); ctx.save(); ctx.globalAlpha = utile ? 1 : .4; icone(ic, x + 4, y + 2, 26); ctx.restore();
    texte("x" + n, x + 32, y + 46, 11, "#fff", "right");
    zone(x, y, 34, 34, () => {
      if (!utile){ SON.clic(); return; }
      if (k === "vue"){ st.vue--; G.run.revele = true; SON.butin(); sauverRun(); }
      else if (R.utiliserObjet(G.C, k)){ if (k === "potion") SON.soin(); }
    });
  });
  const bx = 628, bw = 124;
  if (G.ecran === "place") bouton(bx, 304, bw, 48, "COMBATTRE", lancerCombat, true, true);
  else if (G.ecran === "combat"){ const ok = R.peutLancer(G.run, "combat"); bouton(bx, 304, bw, 48, G.run.urgence ? (ok ? "LANCER" : "PAS D'OR") : "PLUS DE LANCER", () => lancerDe("combat"), ok, ok, 0, G.run.urgence ? "urgence : " + G.run.prix + " or" : ""); }
}
function champPlacement(){
  // cases de départ devant la Muraille
  for (let s = 0; s < 6; s++){ const c = R.CASES[s], occ = G.run.heros.findIndex(h => h.slot === s), sel = G.sel >= 0 && G.run.heros[G.sel].slot === s;
    ctx.strokeStyle = sel ? "#ffe14a" : "rgba(255,255,255,.35)"; ctx.lineWidth = sel ? 3 : 1.5; ctx.setLineDash(sel ? [] : [5, 4]);
    ctx.beginPath(); ctx.ellipse(c[0], c[1] + 2, 30, 11, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    zone(c[0] - 36, c[1] - 66, 72, 82, () => {
      if (G.sel < 0){ if (occ >= 0){ G.sel = occ; SON.clic(); } return; }
      const h = G.run.heros[G.sel]; if (occ >= 0 && occ !== G.sel) G.run.heros[occ].slot = h.slot; h.slot = s; G.sel = -1; SON.pose();
      for (const u of G.unitesPlace){ const cc = R.CASES[u.h.slot]; u.tx = cc[0]; u.ty = cc[1]; } sauverRun(); });
  }
  texte("ARRIERE", 150, 300, 11, "#ffe3a8", "center"); texte("AVANT", 230, 300, 11, "#ffe3a8", "center");
  if (G.sel < 0) texte("Touche un héros, puis une case", 390, 118, 13, "#fff", "center", {max: 260});
  panneauDe();
  for (const u of G.unitesPlace){ if (u.tx !== undefined){ u.x += (u.tx - u.x)*.25; u.y += (u.ty - u.y)*.25; }
    if (u.h.leg) aura(u.x, u.y, G.t);
    dessinerHeros(R.classeDe(u.h).spr, "repos", G.t + u.ta, u.x, u.y, 1);
    dessinerArme({h: u.h, pv: 1, role: D.CLASSES[u.h.cls].role, dir: 1, act: "repos", ta: G.t + u.ta}, u.x, u.y); }
}

/* ---------- événements du combat : effets et sons ---------- */
function etincelles(x, y, n, c, monte){ if (reduit) n = Math.ceil(n/3);
  for (let i = 0; i < n; i++){ const a = Math.random()*Math.PI*2, v = alea(40, 170); G.part.push({x, y, vx: Math.cos(a)*v, vy: Math.sin(a)*v - (monte ? 80 : 0), t: 0, d: alea(.3, .7), c, g: monte ? -60 : 320}); } }
function flotte(x, y, v, c, opt = {}){ G.txt.push(Object.assign({x: x + alea(-6, 6), y, v, c, t: 0}, opt)); }
function traiterEvenements(){
  const C = G.C; if (!C) return;
  for (const e of C.ev){
    if (e.k === "degats"){
      flotte(e.x, e.y - 70, e.crit ? e.v + "!" : String(e.v), e.crit ? "#ffdf3a" : e.u.camp === "h" ? "#ff8a7a" : "#fff", {gros: e.crit});
      etincelles(e.x, e.y - 30, e.crit ? 16 : 7, e.c || (e.crit ? "#ffdf3a" : "#fff"));
      if (!reduit){ G.gel = Math.max(G.gel, e.crit ? .08 : .035); G.sec = Math.max(G.sec, e.crit ? 6 : 2.5); }
      if (e.crit) { SON.crit(); flotte(e.x, e.y - 96, "CRITIQUE", "#ff6a3a", {petit: true}); } else SON.coup();
    } else if (e.k === "mort"){ SON.mort(); etincelles(e.u.x, e.u.y - 30, 22, e.u.camp === "h" ? "#ff4040" : "#ffb040"); }
    else if (e.k === "or"){ flotte(e.x, e.y - 50, "+" + e.v, "#ffe14a", {petit: true}); SON.or(); }
    else if (e.k === "soin"){ flotte(e.x, e.y - 70, "+" + e.v, "#6dff8a"); etincelles(e.x, e.y - 40, 8, "#6dff8a", true); }
    else if (e.k === "soinLance") SON.soin();
    else if (e.k === "tir") SON.tir();
    else if (e.k === "mur"){ SON.mur(); etincelles(R.MUR_X, e.y - 30, 8, "#d8c8a8"); if (!reduit) G.sec = Math.max(G.sec, 3); flotte(R.MUR_X + 6, e.y - 60, "-" + e.v, "#ffb0a0", {petit: true}); }
    else if (e.k === "boss"){ flotte(W/2, 210, "LE BOSS ARRIVE", "#ff6a3a", {titre: true}); SON.boum(); if (!reduit) G.sec = 8; }
    else if (e.k === "chant"){ SON.chant(); for (const h of R.vivants(C, "h")) etincelles(h.x, h.y - 50, 4, "#9ff0ff", true); }
    else if (e.k === "rate") flotte(e.x, e.y - 70, "RATE", "#c8c8c8", {petit: true});
    else if (e.k === "fuite") flotte(e.u.x, e.u.y - 80, "FUIT !", "#ffb08a", {petit: true});
    else if (e.k === "rempart"){ flotte(R.MUR_X + 20, 300, "+" + e.v, "#e8dcc0"); }
    else if (e.k === "eclair"){ G.fx.push({k: "foudre", x: e.x, t: 0}); SON.crit(); }
  }
  C.ev.length = 0;
}

/* ---------- dé d'action (28/11) : de l'or contre des lancers ---------- */
const COUL_ACT = {recrue: "#ffd76a", objet: "#4aa8ff", progres: "#ff9a4a", soin: "#6dff8a", sort: "#d8b8ff", relique: "#3ddcbe"};
const typeDe = t => t === "action" ? "act" : t;
function lancerDe(phase, force){
  const run = G.run;
  if (G.lancer) return;
  if (!R.peutLancer(run, phase)){ G.refus = G.t; SON.clic(); return; }
  const res = R.lancerAction(run, phase, phase === "combat" ? G.C : null, force);
  G.lancer = {res, phase, t0: G.t, etat: "roule", p: [], pieces: Array.from({length: 7}, (_, i) => ({d: i*.05, x: 150 + alea(-10, 20), y: 34}))};
  SON.des(13); if (phase === "prep") sauverRun();
}
function fermerLancer(){
  const L = G.lancer; if (!L) return; G.lancer = null;
  if (L.res.k === "sort" && L.phase === "combat" && G.C) sortAuto(L.res.sort);
  if (L.res.k === "recrue" && L.res.mode === "nouvelle" && G.C){ const u = G.C.unites.find(v => v.h === L.res.h); if (u){ etincelles(u.x, u.y - 30, 24, "#ffd76a", true); flotte(u.x, u.y - 80, "ARRIVE !", "#ffd76a", {petit: true}); } }
}
// sort lancé tout seul (face SORT) : puissance selon la vague, jamais de déraillement
function sortAuto(k){
  const S = D.SORTS[k], p = 14 + G.run.vague*2;
  flotte(W/2, 196, S.n, S.c, {titre: true});
  const appliquer = () => { if (!G.C) return; const r = R.jeterSort(G.C, k, p, false);
    if (k === "meteores") for (const u of r.cibles || []){ G.fx.push({k: "impact", x: u.x, y: u.y, t: 0}); etincelles(u.x, u.y - 20, 24, "#ffb040"); } };
  if (k === "feu"){ SON.boum(); if (!reduit) G.sec = 12; G.fx.push({k: "feu", t: 0}); setTimeout(appliquer, 450); }
  else if (k === "meteores"){ SON.boum(); G.fx.push({k: "meteores", t: 0}); setTimeout(() => { appliquer(); if (!reduit) G.sec = 10; SON.boum(); }, 500); }
  else if (k === "soin"){ SON.soin(); G.fx.push({k: "soin", t: 0}); appliquer(); }
  else if (k === "foudre"){ R.vivants(G.C, "m").forEach((m, i) => setTimeout(() => { if (G.C && m.pv > 0){ G.fx.push({k: "foudre", x: m.x, t: 0}); SON.crit(); } }, i*120)); appliquer(); }
  else if (k === "givre"){ SON.chant(); G.fx.push({k: "teinte", c: "190,230,255", t: 0}); appliquer(); }
  else if (k === "gel"){ SON.chant(); G.fx.push({k: "vent", t: 0}); appliquer(); }
  else if (k === "rempart"){ SON.mur(); G.fx.push({k: "rempart", t: 0}); appliquer(); }
  else appliquer();
}
// panneau du dé d'action pendant le placement
function panneauDe(){
  const run = G.run, x = 560, y = 40, w = 192, ok = R.peutLancer(run, "prep"), sec = G.refus !== undefined && G.t - G.refus < .4 ? Math.sin(G.t*60)*3 : 0;
  ctx.save(); ctx.translate(sec, 0);
  carteM(x, y, w, 252, MOD.bord, "rgba(14,26,34,.95)");
  texteM("DE D'ACTION", x + 12, y + 24, 16, MOD.accent, "left", {max: w - 56});
  boutonM(x + w - 38, y + 6, 30, 26, "?", () => { G.tuto = {p: TUTO.length - 1, t0: G.t, seul: true}; SON.clic(); }, false);
  tileFace("act", G.derniereFace || "recrue", x + w/2 - 34, y + 36, 68, {etiquette: true, t0: G.derniereT0, pool: run.faces.action, dur: .9});
  texteM(run.lancers + " lancer" + (run.lancers > 1 ? "s" : "") + " avant le combat", x + w/2, y + 128, 14, run.lancers ? MOD.txt : MOD.doux, "center", {max: w - 12});
  texteM("Prochain : " + run.prix + " or  ·  tu as " + run.or, x + w/2, y + 148, 13, run.or >= run.prix ? MOD.or : MOD.alerte, "center", {max: w - 12});
  boutonM(x + 10, y + 158, w - 20, 44, run.lancers ? (ok ? "LANCER" : "PAS ASSEZ D'OR") : "PLUS DE LANCER", () => lancerDe("prep"), true, ok);
  texteM("Urgence en combat : " + run.urgence, x + w/2, y + 224, 13, MOD.or, "center", {max: w - 12, gras: false});
  texteM("(touche ? pour comprendre)", x + w/2, y + 242, 11, MOD.doux, "center", {gras: false, max: w - 12});
  ctx.restore();
}
function ecranLancer(dt){
  const L = G.lancer, res = L.res, k = res.k, a = G.t - L.t0, A = D.ACTIONS[k], coul = COUL_ACT[k];
  zone(0, 0, W, H, () => {});
  ctx.fillStyle = `rgba(5,12,16,${Math.min(.78, a*2)})`; ctx.fillRect(0, 0, W, H);
  // pièces qui partent du compteur d'or
  for (const c of L.pieces){ const u = Math.min(1, Math.max(0, (a - c.d)/.5)); if (u <= 0 || u >= 1) continue; ctx.save(); ctx.globalAlpha = 1 - u*.4; icone([12, 7], 150 + c.x%20 + (W/2 - 160 - c.x%20)*u, 6 + (170 - 6)*u - Math.sin(u*Math.PI)*40, 22); ctx.restore(); }
  texteM("- " + res.cout + " OR", 190, 24, 14, MOD.or, "left", {ombre: false});
  if (a < 1.5){   // le dé roule
    texteM("LE DE D'ACTION ROULE...", W/2, 76, 20, MOD.txt, "center");
    tileFace("act", k, W/2 - 60, 110, 120, {etiquette: a > 1.15, sel: a > 1.15, t0: L.t0 + .1, pool: G.run.faces.action, dur: 1.1});
    return;
  }
  if (L.etat === "roule"){ L.etat = "montre"; L.t1 = G.t; G.derniereFace = k; G.derniereT0 = G.t - 5;
    SON.niveau(); for (let i = 0; i < 46; i++){ const an = Math.random()*7, v = alea(60, 260); L.p.push({x: 230, y: 190, vx: Math.cos(an)*v, vy: Math.sin(an)*v - 80, t: 0, d: alea(.6, 1.3), c: coul}); } }
  const b = G.t - L.t1, pop = Math.min(1, b*4), sc = 1.7 - .7*pop*pop;
  // carte du résultat
  carteM(100, 30, 560, 300, coul, "rgba(14,26,34,.97)");
  ctx.save(); ctx.translate(380, 70); ctx.scale(sc, sc); ctx.globalAlpha = pop;
  const titre = k === "recrue" ? (res.mode === "absorbe" ? "ABSORPTION !" : res.mode === "plein" ? "ESCOUADE PLEINE" : "NOUVELLE RECRUE") : k === "objet" ? "OBJET" : k === "progres" ? "PROGRES" : k === "soin" ? "SOIN" : k === "sort" ? "SORT" : "RELIQUE";
  texteM(titre, 0, 0, 28, coul, "center", {max: 500, ombre: false}); ctx.restore();
  const cx = 225, cy = 190, tx = 350;
  ctx.save(); ctx.globalAlpha = pop;
  if (k === "recrue"){
    const h = res.h, cl = R.classeDe(h), tombe = Math.max(0, 1 - b*3), rebond = b < .5 ? 0 : Math.abs(Math.sin((b - .5)*7))*Math.max(0, 1 - (b - .5)*1.6)*14;
    if (res.mode === "absorbe" || res.mode === "plein"){ const g = ctx.createLinearGradient(cx - 50, 0, cx + 50, 0); g.addColorStop(0, "rgba(255,220,120,0)"); g.addColorStop(.5, `rgba(255,230,150,${.55*Math.min(1, b*2)})`); g.addColorStop(1, "rgba(255,220,120,0)"); ctx.fillStyle = g; ctx.fillRect(cx - 50, 90, 100, 190); aura(cx, cy + 60, G.t, 1.6); }
    dessinerHeros(cl.spr, "victoire", G.t, cx, cy + 70 - tombe*160 - rebond, 1, {e: 4});
    texteM(h.nom + " · " + cl.n, tx, 130, 20, MOD.txt, "left", {max: 290});
    if (res.mode !== "nouvelle"){ ctx.save(); ctx.translate(tx, 166); const z = 1 + Math.max(0, .5 - (b - .3))*1.2; ctx.scale(z, z); texteM("NIVEAU " + h.niv, 0, 0, 26, MOD.or, "left", {ombre: false}); ctx.restore();
      const g = res.gains || {}, l = []; if (g.pv) l.push("VIE +" + g.pv); if (g.atq) l.push("ATQ +" + g.atq); if (g.def) l.push("DEF +" + g.def); if (g.crit) l.push("CRIT +" + g.crit);
      texteM(l.join("   "), tx, 190, 15, "#d8ffd8", "left", {ombre: false}); }
    else texteM("Case " + (h.slot + 1) + " · " + (D.ROLES[D.CLASSES[h.cls].role]), tx, 156, 15, MOD.doux, "left", {gras: false});
  } else if (k === "objet"){
    const o = res.o, R0 = D.RARETES[o.rar]; tileFace("quoi", o.slot, 132, 96, 64, {etiquette: true, t0: L.t1, pool: G.run.faces.quoi, dur: .7}); tileFace("qual", o.rar, 254, 96, 64, {etiquette: true, t0: L.t1 + .15, pool: G.run.faces.qual, dur: .7});
    ctx.save(); ctx.translate(cx, 240); ctx.globalCompositeOperation = "lighter"; for (let i = 0; i < 10; i++){ ctx.rotate(Math.PI/5); ctx.fillStyle = R0.c + "33"; ctx.fillRect(-3, -3, 6, 44); } ctx.restore();
    icone(o.ic, cx - 28, 212, 56);
    texteM(o.n, tx, 130, 20, R0.c, "left", {max: 290}); texteM(D.SLOTS[o.slot].n + " · " + R0.n, tx, 152, 14, MOD.txt, "left", {gras: false}); texteM(R.texteBonus(o), tx, 174, 15, "#d8ffd8", "left", {max: 290, gras: false});
  } else if (k === "progres"){
    const h = res.h; dessinerHeros(R.classeDe(h).spr, "victoire", G.t, cx, 260, 1, {e: 4}); aura(cx, 260, G.t, 1.2);
    texteM(h.nom + " · " + R.classeDe(h).n, tx, 130, 19, MOD.txt, "left", {max: 290}); texteM(res.b.n, tx, 162, 22, coul, "left", {max: 290});
  } else if (k === "soin"){
    for (let i = 0; i < 8; i++){ const t = (G.t*.7 + i/8) % 1; ctx.fillStyle = `rgba(109,255,138,${1 - t})`; ctx.fillRect(120 + i*26, 290 - t*160, 8, 20); ctx.fillRect(116 + i*26, 296 - t*160, 16, 8); }
    icone(A.ic, cx - 36, 170, 72); texteM("TOUS LES HEROS SONT SOIGNES", tx, 140, 18, MOD.txt, "left", {max: 290});
  } else if (k === "sort"){
    const S = D.SORTS[res.sort]; icone(S.ic, cx - 40, 150, 80); texteM(S.n, tx, 140, 24, S.c, "left", {max: 290});
  } else if (k === "relique"){
    icone(A.ic, cx - 40, 150, 80);
  }
  ctx.restore();
  const dess = {
    recrue: () => res.mode === "absorbe" ? "Le dé de la case " + (res.slot + 1) + " a donné " + D.CLASSES[res.cls].n + ", déjà dans l'escouade : elles fusionnent et le héros gagne un niveau." : res.mode === "plein" ? "L'escouade a déjà 4 héros : la recrue est absorbée par un héros au hasard." : "Le dé de la case " + (res.slot + 1) + " a donné " + D.CLASSES[res.cls].n + " : elle rejoint l'escouade.",
    objet: () => res.h ? "Deux dés ont décidé : QUOI et QUALITE. Équipé sur " + res.h.nom + (res.ancien ? " (l'ancien objet est revendu " + Math.round(res.ancien.prix/2) + " or)." : ".") : "Personne ne peut le porter : revendu " + res.vendu + " or.",
    progres: () => "Un bonus de statistique, sans attendre la prochaine vague.", soin: () => "La Muraille gagne aussi 10 points.",
    sort: () => L.phase === "combat" ? "Le sort part tout de suite sur les monstres." : "Mis en réserve : il partira au premier gros groupe de monstres du combat.", relique: () => "Une seule relique pour toute la nuit :"};
  if (!(k === "relique" && !res.pris)) paragrapheM(dess[k](), tx, 214, 290, 14, MOD.doux, 1.25, "left");
  // particules
  for (const q of L.p){ q.t += dt; q.x += q.vx*dt; q.y += q.vy*dt; q.vy += 300*dt; ctx.globalAlpha = Math.max(0, 1 - q.t/q.d); ctx.fillStyle = q.c; ctx.fillRect(q.x - 3, q.y - 3, 6, 6); } ctx.globalAlpha = 1; L.p = L.p.filter(q => q.t < q.d);
  if (k === "relique" && !res.pris){
    texteM("Une seule relique pour toute la nuit :", tx, 104, 14, MOD.doux, "left", {gras: false});
    res.choix.forEach((r, i) => { const y = 114 + i*66; boutonM(tx, y, 290, 58, "", () => { R.appliquerRelique(G.run, r.k); res.pris = r; SON.niveau(); if (G.run) sauverRun(); }, false, true);
      texteM(r.n, tx + 12, y + 22, 16, MOD.txt, "left", {max: 266}); paragrapheM(r.d, tx + 12, y + 40, 268, 11, MOD.doux, 1.15); });
    return;
  }
  if (k === "relique" && res.pris){ texteM(res.pris.n, tx, 130, 20, coul, "left", {max: 290}); paragrapheM(res.pris.d, tx, 156, 290, 15, MOD.txt, 1.25, "left"); }
  boutonM(tx, 276, 290, 44, "SUPER !", () => { SON.clic(); fermerLancer(); });
}

function effets(dt){
  for (const f of G.fx){ f.t += dt;
    if (f.k === "feu"){ const k = f.t/.9; for (let i = 0; i < 5; i++){ const x = 480 + i*34 - k*220, y = -40 + k*(H + 60) - i*30; ctx.fillStyle = "#ff6a1f"; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); }
      if (f.t > .45 && f.t < .8){ ctx.fillStyle = `rgba(255,140,40,${.5 - (f.t - .45)})`; ctx.fillRect(0, 0, W, H); } if (f.t > .9) f.fini = true; }
    else if (f.k === "soin"){ ctx.fillStyle = `rgba(110,255,140,${Math.max(0, .3 - f.t*.3)})`; ctx.fillRect(0, 0, W, H); if (f.t > 1.2) f.fini = true; }
    else if (f.k === "foudre"){ ctx.strokeStyle = `rgba(200,240,255,${1 - f.t*3})`; ctx.lineWidth = 4; ctx.beginPath(); let x = f.x, y = 0; ctx.moveTo(x, y);
      while (y < H - 60){ y += 24; x = f.x + alea(-14, 14); ctx.lineTo(x, y); } ctx.stroke(); if (f.t > .33) f.fini = true; }
    else if (f.k === "teinte"){ ctx.fillStyle = `rgba(${f.c},${Math.max(0, .35 - f.t*.35)})`; ctx.fillRect(0, 0, W, H); if (f.t > 1) f.fini = true; }
    else if (f.k === "vent"){ ctx.strokeStyle = `rgba(200,235,255,${Math.max(0, .8 - f.t*.6)})`; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++){ const y = 110 + (i*37) % 180, x = W - ((f.t*900 + i*61) % (W + 120)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y + 4); ctx.stroke(); } if (f.t > 1.3) f.fini = true; }
    else if (f.k === "rempart"){ for (let i = 0; i < 8; i++){ const k = Math.min(1, f.t*1.8 - i*.08); if (k <= 0) continue; const x = 260 - k*200 + i*6, y = 110 + i*22 - Math.sin(k*Math.PI)*40;
        ctx.fillStyle = "#8a8498"; ctx.fillRect(x - 6, y - 5, 12, 10); ctx.fillStyle = "#5c566c"; ctx.fillRect(x - 6, y + 3, 12, 2); }
      if (f.t > .55 && f.t < .9){ ctx.fillStyle = `rgba(255,240,200,${.4 - (f.t - .55)})`; ctx.fillRect(0, 72, R.MUR_X, 230); } if (f.t > 1) f.fini = true; }
    else if (f.k === "meteores"){ const k = f.t/.5; for (let i = 0; i < 3; i++){ const x = 300 + i*150 - k*60, y = -60 + k*(250 + i*30); ctx.fillStyle = "rgba(255,120,30,.5)"; ctx.beginPath(); ctx.arc(x + 10, y - 14, 14, 0, 7); ctx.fill();
        ctx.fillStyle = "#ffb040"; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill(); ctx.fillStyle = "#fff0b0"; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); } if (f.t > .5) f.fini = true; }
    else if (f.k === "impact"){ ctx.strokeStyle = `rgba(255,190,90,${Math.max(0, 1 - f.t*2)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(f.x, f.y, 10 + f.t*90, 4 + f.t*30, 0, 0, 7); ctx.stroke(); if (f.t > .5) f.fini = true; }
    else if (f.k === "poule"){ f.x += dt*190; const sx = f.x, sy = f.y - Math.abs(Math.sin(f.t*12))*10;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.ellipse(sx, sy, 10, 8, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(sx + 8, sy - 7, 5, 0, 7); ctx.fill();
      ctx.fillStyle = "#e33"; ctx.fillRect(sx + 7, sy - 14, 4, 4); ctx.fillStyle = "#fb2"; ctx.fillRect(sx + 12, sy - 7, 5, 3);
      if (Math.random() < .02) SON.poule(); if (f.x > W + 30) f.fini = true; }
  }
  G.fx = G.fx.filter(f => !f.fini);
}

/* ---------- fin de vague : expérience, niveaux, évolution, butin, marchand ---------- */
function finDeVague(){
  const run = G.run, gagne = run.vague >= D.NB_VAGUES;
  const xp = R.xpDeVague(run), gains = [];
  for (const h of run.heros){ const n = R.gagnerXp(h, h.mort ? xp/2 : xp); if (!n) continue;
    const t = {pv: 0, atq: 0, def: 0, crit: 0, vit: 0}; for (let i = 0; i < n; i++){ const g = R.monterNiveau(h); for (const k in t) t[k] += g[k]; }
    gains.push({h, niv: h.niv, t}); }
  if (gagne){ finDeNuit(true); return; }
  const boss = !!D.BOSS[run.vague];
  G.butin = {etape: "bilan", t: 0, xp, gains, choix: null, objets: R.genererButin(run, boss), pris: null};
  G.ecran = "butin"; G.txt = []; G.fx = []; SON.victoire();
}
function suiteButin(){
  const B = G.butin, run = G.run;
  const ev = run.heros.find(h => R.peutEvoluer(h, legendaires()));
  if (ev){ B.etape = "evolution"; G.evo = {h: ev, t: 0, fait: false, avant: R.classeDe(ev).n}; SON.sort(); return; }
  if (!B.pris){ B.etape = "objet"; return; }
  if (!B.evFait && run.vague % 3 === 0){ B.evFait = true; B.ev = {t0: null, k: null, res: null}; B.etape = "evenement"; return; }
  B.etape = "marchand";
}
function ecranButin(dt){
  const B = G.butin; B.t += dt; G.txt = G.txt.filter(t => (t.t += dt) < 1.4);
  fond(); muraille();
  // l'escouade au repos
  for (const h of G.run.heros){ const c = R.CASES[h.slot]; if (h.leg) aura(c[0], c[1], G.t);
    if (G.evo && G.evo.h === h) continue; dessinerHeros(R.classeDe(h).spr, h.mort ? "mort" : "victoire", G.t + h.id, c[0], c[1], 1, {alpha: h.mort ? .55 : 1}); }
  hud();
  if (B.etape !== "evolution"){ filEtapes(); }
  if (B.etape === "bilan"){
    consigne("regarde les progrès de tes héros", "Chaque héros debout gagne de l'expérience.");
    grand(300, 94, 452, 258);
    texte("VAGUE TENUE !", 526, 126, 22, "#ffe14a", "center", {titre: true});
    texte("+" + B.xp + " d'expérience pour chaque héros debout", 526, 150, 14, "#fff", "center", {max: 420});
    texte("(la moitié pour les héros tombés)", 526, 168, 12, "#ffe3a8", "center", {gras: false});
    texte("Or : " + G.run.or + "   ·   Muraille : " + Math.ceil(G.run.mur) + " / " + G.run.murMax + "   ·   Monstres abattus : " + G.run.kills, 526, 192, 13, "#fff", "center", {max: 430});
    B.gains.forEach((g, i) => { const t = g.t, l = [];
      if (t.pv) l.push("VIE +" + t.pv); if (t.atq) l.push("ATQ +" + t.atq); if (t.def) l.push("DEF +" + t.def); if (t.crit) l.push("CRIT +" + t.crit); if (t.vit) l.push("VIT +" + t.vit.toFixed(2));
      texte(g.h.nom + " NIVEAU " + g.niv + " : " + l.join("  "), 526, 216 + i*18, 13, "#ffe14a", "center", {max: 430}); });
    if (B.gains.length && !B.sonNiv){ B.sonNiv = true; SON.niveau(); }
    bouton(380, 300, 292, 40, "CONTINUER", () => { suiteButin(); SON.clic(); }, true, true);
  } else if (B.etape === "niveau"){
    consigne("choisis un bonus pour ce héros");
    const h = B.h, cl = R.classeDe(h);
    grand(300, 94, 452, 258);
    texte("NIVEAU " + h.niv + " !", 526, 126, 20, "#ffe14a", "center", {titre: true});
    dessinerHeros(cl.spr, "victoire", G.t, 360, 260, 1, {e: 3});
    texte(h.nom + " · " + cl.n, 560, 160, 15, "#fff", "center", {max: 280});
    texte("Choisis un bonus :", 560, 186, 14, "#ffe3a8", "center");
    B.choix.forEach((b, i) => bouton(430, 202 + i*54, 300, 46, b.n, () => { R.appliquerBonus(h, b); SON.pose(); suiteButin(); }, true, false, i ? 2 : 1));
  } else if (B.etape === "evenement"){
    ecranEvenement();
  } else if (B.etape === "evolution"){
    evolution(dt);
  } else if (B.etape === "objet"){
    consigne("touche l'objet que tu veux garder", "Les dés QUOI et QUELLE QUALITE les ont décidés.");
    if (B.tObj === undefined) B.tObj = G.t;
    const n = B.objets.length, wd = n > 2 ? 244 : 300, x0 = (W - (n*wd + (n - 1)*8))/2;
    B.objets.forEach((o, i) => {
      const x = x0 + i*(wd + 8), y = 94, t0 = B.tObj + .2 + i*.3, vu = fini(t0, .8), R0 = D.RARETES[o.rar];
      if (!vu){ petit(x, y, wd, 190); tileFace("quoi", o.slot, x + wd/2 - 76, y + 50, 64, {t0, pool: G.run.faces.quoi, dur: .8}); tileFace("qual", o.rar, x + wd/2 + 12, y + 50, 64, {t0: t0 + .1, pool: G.run.faces.qual, dur: .8});
        texte("QUOI", x + wd/2 - 44, y + 134, 11, MOD.doux, "center", {ombre: false}); texte("QUALITE", x + wd/2 + 44, y + 134, 11, MOD.doux, "center", {ombre: false}); return; }
      petit(x, y, wd, 190); ctx.strokeStyle = R0.c; ctx.lineWidth = 2; rr(x + 2, y + 2, wd - 4, 186, 10); ctx.stroke();
      icone(o.ic, x + wd/2 - 28, y + 14, 56); gemme(x + wd - 22, y + 22, 12, R0.c);
      texte(o.n, x + wd/2, y + 98, 16, "#fff", "center", {max: wd - 20});
      texte(D.SLOTS[o.slot].n + " · " + R0.n, x + wd/2, y + 120, 13, R0.c, "center", {max: wd - 20});
      texte(R.texteBonus(o), x + wd/2, y + 144, 14, "#d8ffd8", "center", {max: wd - 20});
      if (o.pour) texte(o.pour === "cac" ? "pour le corps à corps" : "pour mages, soins et soutien", x + wd/2, y + 170, 12, "#ffe3a8", "center", {max: wd - 20});
      zone(x, y, wd, 190, () => { B.pris = o; B.etape = "equiper"; SON.clic(); });
    });
    bouton(180, 300, 400, 44, "NE RIEN PRENDRE : 12 PIECES D'OR", () => { G.run.or += 12; B.pris = {or: true}; SON.or(); suiteButin(); }, true, false, 3);
  } else if (B.etape === "equiper"){
    const o = B.pris, R0 = D.RARETES[o.rar];
    consigne("touche le héros qui portera l'objet", "Stats en vert : elles montent.");
    grand(8, 94, 236, 256);
    icone(o.ic, 126 - 30, 104, 60); texte(o.n, 126, 190, 16, R0.c, "center", {max: 220}); texte(D.SLOTS[o.slot].n + " · " + R0.n, 126, 210, 13, "#fff", "center", {gras: false}); texte(R.texteBonus(o), 126, 232, 14, "#d8ffd8", "center", {gras: false, max: 220});
    texte("L'objet remplacé est revendu.", 126, 262, 12, "#ffe3a8", "center", {gras: false});
    bouton(18, 292, 216, 44, "VENDRE : " + Math.round(o.prix/2) + " OR", () => { G.run.or += Math.round(o.prix/2); SON.or(); suiteButin(); }, true, false, 3);
    const hs = G.run.heros.slice().sort((a, b) => (R.peutPorter(b, o) ? 1 : 0) - (R.peutPorter(a, o) ? 1 : 0));
    hs.forEach((h, i) => {
      const x = 252 + (i % 2)*252, y = 94 + Math.floor(i/2)*130, ok = R.peutPorter(h, o), ac = h.equip[o.slot], s0 = R.stats(h), s1 = R.statsAvec(h, o);
      petit(x, y, 246, 124); ctx.save(); if (!ok) ctx.globalAlpha = .45;
      dessinerHeros(R.classeDe(h).spr, "repos", G.t + i, x + 34, y + 86, 1, {e: 1.9});
      texte(h.nom + " · " + R.classeDe(h).n, x + 66, y + 24, 14, "#fff", "left", {max: 172});
      texte(ok ? (ac ? "porte : " + ac.n : D.SLOTS[o.slot].n + " : rien") : "ne peut pas le porter", x + 66, y + 42, 12, ok ? (ac ? D.RARETES[ac.rar].c : "#c8e8c8") : "#ffb0a0", "left", {gras: !ac, max: 172});
      const L = [["VIE", s0.pv, s1.pv], ["ATQ", s0.atq, s1.atq], ["DEF", s0.def, s1.def], ["CRIT", s0.crit, s1.crit], ["VIT", s0.vit, s1.vit, 2], ["VOL", Math.round(s0.vol*100), Math.round(s1.vol*100)]];
      L.forEach(([n, a, b, dec], j) => { const xx = x + 66 + (j % 2)*88, yy = y + 66 + Math.floor(j/2)*18, d = Math.round((b - a)*100)/100;
        const t = n + " " + (dec ? a.toFixed(dec) : a); texte(t, xx, yy, 12, "#e8f0ff", "left"); police(12); const lw = ctx.measureText(t).width;
        if (ok && d) texte((d > 0 ? "+" : "") + (dec ? d.toFixed(dec) : d), xx + lw + 4, yy, 12, d > 0 ? "#6dff8a" : "#ff7a6a", "left"); });
      ctx.restore();
      if (ok) zone(x, y, 246, 124, () => { const ancien = R.equiper(h, o); if (ancien) G.run.or += Math.round(ancien.prix/2); SON.pose(); suiteButin(); });
    });
  } else if (B.etape === "marchand"){
    consigne("dépense ton or, puis lance la vague suivante", "Tu as " + G.run.or + " or.");
    D.MARCHAND.filter(m => m.k !== "de" && m.k !== "graver").forEach((m, i) => {
      const plein = (m.k === "mur" && G.run.mur >= G.run.murMax);
      const x = 8 + (i % 2)*380, y = 96 + Math.floor(i/2)*84, ok = G.run.or >= m.prix && !plein;
      petit(x, y, 372, 78); ctx.save(); if (!ok) ctx.globalAlpha = .5;
      icone(m.ic, x + 12, y + 20, 38);
      texte(m.n, x + 62, y + 28, 16, "#fff", "left", {max: 230});
      paragraphe(m.d, x + 62, y + 48, 230, 12, "#ffe3a8", 1.1);
      texte(m.prix + " OR", x + 360, y + 28, 16, "#ffe14a", "right");
      if (G.run.stock[m.k] !== undefined) texte("x" + (G.run.stock[m.k] || 0), x + 360, y + 62, 14, "#fff", "right");
      ctx.restore();
      if (ok) zone(x, y, 372, 78, () => { G.run.or -= m.prix;
        if (m.k === "mur") G.run.mur = Math.min(G.run.murMax, G.run.mur + 30);
        else G.run.stock[m.k] = (G.run.stock[m.k] || 0) + 1; SON.or(); });
    });
    bouton(180, 280, 400, 56, "LANCER LA VAGUE SUIVANTE", () => { G.run.vague++; R.preparerVague(G.run); allerPlacement(); SON.pose(); }, true, true);
    for (const t of G.txt) texte(t.v, t.x, t.y - t.t*20, 14, t.c, "center");
  }
}
function evolution(dt){
  const E = G.evo; E.t += dt; const h = E.h, c = R.CASES[h.slot];
  const blanc = E.t < 1.1 ? Math.min(1, E.t*1.1)*(.6 + .4*Math.sin(E.t*30)) : Math.max(0, 1 - (E.t - 1.1)*2.5);
  if (!E.fait && E.t >= 1.1){ E.fait = true; R.evoluer(h); etincelles(c[0], c[1] - 40, 50, "#ffe27a"); etincelles(c[0], c[1] - 40, 20, "#fff"); if (!reduit) G.sec = 9; SON.combo(); SON.niveau(); }
  ctx.fillStyle = `rgba(0,0,0,${Math.min(.55, E.t*.8)})`; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = "lighter";
  const g = ctx.createLinearGradient(c[0] - 30, 0, c[0] + 30, 0); g.addColorStop(0, "rgba(255,220,120,0)"); g.addColorStop(.5, `rgba(255,230,150,${.5*Math.min(1, E.t)})`); g.addColorStop(1, "rgba(255,220,120,0)");
  ctx.fillStyle = g; ctx.fillRect(c[0] - 30, 0, 60, c[1] + 6); ctx.restore();
  if (h.leg) aura(c[0], c[1], G.t);
  dessinerHeros(R.classeDe(h).spr, "victoire", G.t, c[0], c[1], 1, {blanc});
  if (E.t > 1.1){ const k = Math.min(1, (E.t - 1.1)*4); ctx.save(); ctx.translate(W/2, 70); ctx.scale(2 - k, 2 - k); ctx.globalAlpha = k; texte("EVOLUTION !", 0, 0, 20, "#ffe14a", "center", {titre: true}); ctx.restore();
    texte(E.avant + "  >  " + R.classeDe(h).n, W/2, 100, 16, "#fff", "center", {max: W - 30});
    paragraphe(D.CLASSES[h.cls].leg.d, 380, 150, 340, 14, "#ffe3a8"); }
  if (E.t > 2.8){ G.evo = null; suiteButin(); }
}

/* ---------- fin de nuit ---------- */
function finDeNuit(gagne){
  const run = G.run, s = statsJoueur(), ec = R.eclatsDeRun(run, gagne);
  s.nuits++; s.record = Math.max(s.record, run.vague); if (gagne) s.gagnees++; s.eclats += ec; s.kills += run.kills;
  ecrire("bannis.stats", s); effacer("bannis.run");
  G.fin = {gagne, vague: run.vague, kills: run.kills, boss: run.boss, eclats: ec, total: s.eclats, record: s.record}; G.ecran = "fin";
  gagne ? SON.victoire() : SON.defaite();
}
function ecranFin(){
  fond(); muraille();
  const F = G.fin;
  ctx.fillStyle = F.gagne ? "rgba(40,20,0,.35)" : "rgba(30,0,0,.55)"; ctx.fillRect(0, 0, W, H);
  grand(60, 20, W - 120, 320);
  texte(F.gagne ? "LE JOUR SE LEVE" : "LA MURAILLE EST TOMBEE", W/2, 66, 20, F.gagne ? "#ffe14a" : "#ff6a4a", "center", {titre: true, max: 560});
  if (F.gagne) texte("LA NUIT EST TENUE", W/2, 94, 16, "#ffe14a", "center", {titre: true});
  const l = [["Vague atteinte", F.vague + " / " + D.NB_VAGUES], ["Monstres abattus", F.kills], ["Boss abattus", F.boss], ["Éclats de Gueule gagnés", "+" + F.eclats], ["Éclats en réserve", F.total], ["Record", "vague " + F.record]];
  l.forEach(([a, b], i) => { texte(a, 90, 126 + i*30, 15, "#fff"); texte(String(b), 400, 126 + i*30, 15, "#ffe14a", "right"); });
  paragraphe("Les éclats achètent des gravures et des légendes dans l'arbre des dés.", 90, 318, 330, 12, "#ffe3a8");
  bouton(450, 110, 260, 48, "NOUVELLE NUIT", () => { nouvelleNuit(); SON.clic(); }, true, true);
  bouton(450, 170, 260, 44, "L'ARBRE DES DES", () => ouvrirArbre("fin"), true, false, 2);
  bouton(450, 224, 260, 40, "TITRE", () => { G.ecran = "titre"; SON.clic(); }, true, false, 3);
}

/* ---------- fiche d'un héros ---------- */
function ficheHeros(){
  const h = G.fiche, s = R.stats(h), cl = R.classeDe(h), C = D.CLASSES[h.cls];
  ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, H); zone(0, 0, W, H, () => {});
  grand(10, 8, W - 20, 344);
  // colonne gauche : le héros
  if (h.leg) aura(80, 150, G.t);
  dessinerHeros(cl.spr, "repos", G.t, 80, 150, 1, {e: 3});
  texte(h.nom, 140, 52, 22, "#fff", "left", {max: 200});
  texte(cl.n, 140, 74, 14, h.leg ? "#ffd76a" : "#d8e4ff", "left", {max: 200});
  texte("NIVEAU " + h.niv + (C.sexe === "F" ? " · FEMME" : C.sexe === "H" ? " · HOMME" : ""), 140, 94, 12, "#ffe14a");
  const xp0 = D.XP_NIVEAUX[h.niv - 1] || 0, xp1 = R.nivSuivant(h);
  barre(142, 104, 180, 6, (h.xp - xp0)/Math.max(1, xp1 - xp0), "#9ad8ff");
  texte(h.xp + " / " + (isFinite(xp1) ? xp1 : "max") + " xp", 140, 128, 11, "#d8f0ff", "left", {gras: false});
  texte(D.ROLES[C.role], 26, 190, 13, "#9ad8ff");
  paragraphe(cl.d, 26, 208, 300, 12, "#ffe3a8", 1.2);
  texte("TRAIT : " + D.TRAITS[h.trait].n, 26, 278, 13, "#ffb08a", "left", {max: 300});
  paragraphe(D.TRAITS[h.trait].d, 26, 296, 300, 12, "#ffd8c8", 1.2);
  // colonne centrale : les stats
  const pvAct = G.C ? (G.C.unites.find(u => u.h === h) || {pv: h.pv}).pv : h.pv;
  const lignes = [["VIE", Math.ceil(pvAct) + " / " + s.pv], ["ATTAQUE", s.atq], ["DEFENSE", s.def], ["VITESSE", s.vit.toFixed(2)], ["CRITIQUES", s.crit + " %"], ["VOL DE VIE", Math.round(s.vol*100) + " %"]];
  texte("STATISTIQUES", 350, 36, 14, "#ffe14a");
  lignes.forEach(([a, b], i) => { const y = 62 + i*30; texte(a, 350, y, 14, "#d8e4ff", "left", {gras: false}); texte(String(b), 480, y, 15, "#fff", "right"); });
  // colonne droite : l'équipement
  texte("EQUIPEMENT", 510, 36, 14, "#ffe14a");
  ["arme", "armure", "bijou"].forEach((sl, i) => {
    const o = h.equip[sl], y = 46 + i*62; petit(504, y, 240, 56);
    if (o){ icone(o.ic, 512, y + 12, 32); texte(o.n, 552, y + 24, 14, D.RARETES[o.rar].c, "left", {max: 184}); texte(R.texteBonus(o), 552, y + 44, 12, "#d8ffd8", "left", {gras: false, max: 184}); }
    else texte(D.SLOTS[sl].n + " : rien", 520, y + 34, 14, "#a8a0b8", "left", {gras: false});
  });
  if (!h.leg) texte(legendaires().includes(h.cls) ? "Au niveau " + D.NIV_LEGENDAIRE + " : " + C.leg.n : "Légendaire : " + C.leg.n + " (à débloquer dans l'arbre)", 510, 252, 12, "#ffd76a", "left", {max: 240});
  bouton(540, 296, 180, 42, "FERMER", () => { G.fiche = null; SON.clic(); }, true, false, 3);
}

function ecranPause(){
  ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, H); zone(0, 0, W, H, () => {});
  grand(190, 20, 380, 320);
  texte("PAUSE", W/2, 58, 20, "#ffe14a", "center", {titre: true});
  bouton(220, 76, 320, 44, "REPRENDRE", () => { G.pause = false; SON.clic(); }, true, true);
  bouton(220, 126, 154, 44, sonOn ? "SON : OUI" : "SON : NON", () => { sonOn = !sonOn; ecrire("bannis.son", sonOn); SON.clic(); }, true, false, 2);
  bouton(386, 126, 154, 44, "ABANDONNER", () => { G.pause = false; finDeNuit(false); }, true, false, 2);
  let y = 178; if (!window.ludoArtefact){ bouton(220, y, 320, 40, "◀ LUDOTHEQUE", () => { try { screen.orientation.unlock(); } catch (e){} location.href = "../index.html"; }, true, false, 3); y += 48; }
  paragraphe("La nuit est sauvegardée au début de chaque vague : tu peux quitter et reprendre plus tard.", 220, y + 14, 320, 12, "#ffe3a8");
}

/* ---------- boucle ---------- */
let der = performance.now();
function boucle(now){
  let dt = Math.min(.05, (now - der)/1000); der = now;
  zones = [];
  G.t += dt;
  ctx.setTransform(dpr*echelle, 0, 0, dpr*echelle, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (G.sec > 0 && !G.pause){ ctx.translate(alea(-G.sec, G.sec), alea(-G.sec, G.sec)); G.sec = Math.max(0, G.sec - dt*40); }
  if (G.ecran === "titre") ecranTitre();
  else if (G.ecran === "recrutement") ecranRecrutement();
  else if (G.ecran === "arbre") ecranArbre();
  else if (G.ecran === "fin") ecranFin();
  else if (G.ecran === "butin") ecranButin(dt);
  else if (G.ecran === "place" || G.ecran === "combat"){
    // simulation
    if (G.ecran === "combat" && !G.pause && !G.fiche){
      let ds = dt*G.vitesse; if (G.gel > 0){ G.gel -= dt; ds = 0; } if (G.lancer) ds = 0;
      for (let pas = ds; pas > 0; pas -= 1/60) R.etape(G.C, Math.min(1/60, pas));
      for (const u of G.C.unites){ u.ta += ds; u.flash = Math.max(0, u.flash - ds); u.lunge = Math.max(0, u.lunge - ds); if (u.pv <= 0) u.mort += ds;
        if (u.pv > 0 && (u.act === "coup" || u.act === "mal") && u.ta > .45){ u.act = "repos"; u.ta = 0; } }
      traiterEvenements();
      if (G.run.sortsPrets > 0 && R.vivants(G.C, "m").filter(m => m.x < W).length >= 3){ G.run.sortsPrets--; sortAuto(R.tirerSort(G.run.sorts)); }
      if (G.C.fin && !G.attenteFin){ G.attenteFin = true; const f = G.C.fin; setTimeout(() => { G.attenteFin = false; if (f === "victoire") finDeVague(); else finDeNuit(false); }, 1300); }
    }
    fond(); muraille();
    if (G.ecran === "place") champPlacement();
    else { const l = G.C.unites.filter(u => u.pv > 0 || u.camp === "h" || u.mort < 1.2).sort((a, b) => a.y - b.y);
      for (const u of l){ if (u.pv > 0){ ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(u.x, u.y + 2, u.boss ? 30 : 18, 6, 0, 0, 7); ctx.fill(); }
        dessinerUnite(u);
        if (u.pv > 0) jauge(u.x - (u.boss ? 30 : 18), u.y + 12, u.boss ? 60 : 36, 4, u.pv/u.pvMax, u.camp === "h" ? "#4ad05a" : u.elite ? "#ffb31f" : "#e8402a"); }
      for (const p of G.C.proj){ ctx.fillStyle = p.c; ctx.globalAlpha = .4; ctx.beginPath(); ctx.arc(p.x, p.y, 9, 0, 7); ctx.fill(); ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, 7); ctx.fill(); } }
    // particules et textes
    for (const q of G.part){ q.t += dt; q.x += q.vx*dt; q.y += q.vy*dt; q.vy += q.g*dt; ctx.globalAlpha = Math.max(0, 1 - q.t/q.d); ctx.fillStyle = q.c; ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
    ctx.globalAlpha = 1; G.part = G.part.filter(q => q.t < q.d);
    effets(dt);
    for (const t of G.txt){ t.t += dt;
      if (t.titre){ const k = Math.min(1, t.t*5); ctx.save(); ctx.globalAlpha = Math.max(0, 1 - (t.t - 1.1)*2); ctx.translate(t.x, t.y); ctx.scale(2 - k, 2 - k); texte(t.v, 0, 0, 16, t.c, "center", {titre: true, max: W - 40}); ctx.restore(); t.d = 1.6; continue; }
      const s = t.gros ? 1.4 - Math.min(.4, t.t*2) : 1; ctx.save(); ctx.globalAlpha = Math.max(0, 1 - (t.t - .5)*2); ctx.translate(t.x, t.y - t.t*40); ctx.scale(s, s);
      texte(t.v, 0, 0, t.petit ? 13 : 20, t.c, "center"); ctx.restore(); t.d = 1; }
    G.txt = G.txt.filter(t => t.t < (t.d || 1));
    hud(); bandeau(); cartes(); objets();
    if (G.lancer) ecranLancer(dt);
    if (G.tuto) ecranTuto();
  }
  ctx.restore();
  if (G.fiche) ficheHeros();
  if (G.pause) ecranPause();
  requestAnimationFrame(boucle);
}

/* ---------- toucher et taille ---------- */
function coords(e){ const r = cv.getBoundingClientRect(); return [(e.clientX - r.left)*W/r.width, (e.clientY - r.top)*H/r.height]; }
let orientationEssayee = false;
// paysage : on essaie de verrouiller l'écran au premier toucher (accepté en appli installée ou en plein écran), sinon le message « tourne ton téléphone » suffit
function essayerPaysage(){
  if (orientationEssayee || window.ludoArtefact || !window.matchMedia("(pointer: coarse)").matches) return; orientationEssayee = true;
  try { const o = screen.orientation; if (o && o.lock) o.lock("landscape").catch(() => { const el = document.documentElement; if (el.requestFullscreen) el.requestFullscreen().then(() => o.lock("landscape")).catch(() => {}); }); } catch (e){}
}
cv.addEventListener("pointerdown", e => {
  audio(); essayerPaysage();
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left)*W/r.width, y = (e.clientY - r.top)*H/r.height;
  for (let i = zones.length - 1; i >= 0; i--){ const z = zones[i]; if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h){ z.f(); return; } }
  if (G.ecran === "place") G.sel = -1;
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && (G.ecran === "combat" || G.ecran === "place")){ if (G.fiche) G.fiche = null; else G.pause = !G.pause; } });
function taille(){
  if (window.innerHeight > window.innerWidth && window.innerWidth < 700 && G.ecran === "combat") G.pause = true;   // en portrait, le jeu attend
  dpr = Math.min(3, window.devicePixelRatio || 1);
  echelle = Math.min(window.innerWidth/W, window.innerHeight/H);
  cv.style.width = Math.floor(W*echelle) + "px"; cv.style.height = Math.floor(H*echelle) + "px";
  cv.width = Math.floor(W*echelle*dpr); cv.height = Math.floor(H*echelle*dpr);
}
window.addEventListener("resize", taille); taille();
document.addEventListener("visibilitychange", () => { if (document.hidden && G.ecran === "combat") G.pause = true; });
// pour les tests
window.Bannis.G = G;
window.Bannis.J = {ouvrirArbre, nouvelleNuit, allerPlacement, lancerCombat, finDeVague, finDeNuit, lancerDe, fermerLancer, suiteButin};
requestAnimationFrame(boucle);
})();

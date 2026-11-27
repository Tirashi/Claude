/* Les Bannis : affichage, écrans, toucher, effets et sons. Les règles sont dans regles.js (window.Bannis.R),
   les données dans donnees.js (window.Bannis.D). Canvas logique de 360 x 760, agrandi sans lissage.
   Sauvegardes : bannis.run (nuit en cours, écrite au début de chaque vague), bannis.stats, bannis.son. */
(function(){
"use strict";
const {D, R} = window.Bannis;
const W = 360, H = 760;
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
for (const k of ["heros", "monstres", "icones", "ui-cadre", "ui-panneau", "ui-petit", "ui-boutons", "ui-boutons2", "ui-barre", "ui-ruban"]){
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
  des: null, evo: null, butin: null, recrues: null, choisies: [], fin: null, jauge: 0, ouvert: 0, nuages: []};
for (let i = 0; i < 40; i++) G.nuages.push({x: Math.random()*W, y: Math.random()*560, v: alea(8, 22), r: alea(.6, 1.8)});

/* ---------- dessin : outils ---------- */
function nine(cle, sx, sy, sw, sh, c, x, y, w, h){
  const im = IMG[cle]; if (!im.complete || !im.width) return; x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const d = Math.min(c, Math.floor(w/2), Math.floor(h/2)), mw = sw - 2*c, mh = sh - 2*c, dw = w - 2*d, dh = h - 2*d;
  const PX = [[0, c, 0, d], [c, mw, d, dw], [c + mw, c, d + dw, d]], PY = [[0, c, 0, d], [c, mh, d, dh], [c + mh, c, d + dh, d]];
  for (const [ox, ow, px, pw] of PX) for (const [oy, oh, py, ph] of PY) if (pw > 0 && ph > 0) ctx.drawImage(im, sx + ox, sy + oy, ow, oh, x + px, y + py, pw, ph);
}
const panneau = (x, y, w, h) => nine("ui-panneau", 0, 0, 72, 72, 24, x, y, w, h);
const grand = (x, y, w, h) => nine("ui-cadre", 0, 0, 144, 144, 48, x, y, w, h);
const petit = (x, y, w, h) => nine("ui-petit", 0, 0, 48, 48, 16, x, y, w, h);
// Jersey 10 est plus petite à corps égal : agrandie de 30 % ; une seule graisse (pas de gras simulé, qui brouille les pixels)
function police(px, titre){ ctx.font = titre ? `${Math.round(px)}px "Press Start 2P", monospace` : `${Math.round(px*1.3)}px "Jersey 10", sans-serif`; }
function texte(t, x, y, px, c = "#fff", al = "left", opt = {}){
  police(px, opt.titre); let p = px;
  if (opt.max) while (p > 8 && ctx.measureText(t).width > opt.max){ p--; police(p, opt.titre); }
  ctx.textAlign = al; ctx.textBaseline = "alphabetic";
  // contour sombre tout autour (une ombre décalée dédoublait les lettres, retour du 19/11)
  if (opt.ombre !== false){ ctx.lineJoin = "round"; ctx.lineWidth = opt.titre ? 4 : 3; ctx.strokeStyle = opt.ombreC || "#1a0e2e"; ctx.strokeText(t, x, y); }
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
  const im = IMG["ui-barre"], k = (h + 6)/16, y0 = Math.round(y - 3);
  if (im.width){ ctx.drawImage(im, 0, 0, 12, 16, x - 12, y0, 12, h + 6); ctx.drawImage(im, 13, 0, 10, 16, x, y0, w, h + 6); ctx.drawImage(im, 84, 0, 12, 16, x + w, y0, 12, h + 6); }
  ctx.fillStyle = "#241430"; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = c; ctx.fillRect(x, y, Math.max(0, w*Math.min(1, v)), h);
  ctx.fillStyle = "rgba(255,255,255,.3)"; ctx.fillRect(x, y, Math.max(0, w*Math.min(1, v)), Math.ceil(h/3));
}
// petite barre sans cadre (vie au-dessus des unités)
function jauge(x, y, w, h, v, c){
  ctx.fillStyle = "#120a1a"; ctx.fillRect(x - 1, y - 1, w + 2, h + 2); ctx.fillStyle = "#3a1c2a"; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = c; ctx.fillRect(x, y, Math.max(0, w*Math.min(1, v)), h);
}
let zones = [];
function zone(x, y, w, h, f){ zones.push({x, y, w, h, f}); }
function bouton(x, y, w, h, t, f, actif = true, pulse = false, couleur = 0){
  // couleurs de la planche Dragon Regalia : 0 rouge, 1 bleu ciel, 2 prune, 3 ardoise
  nine("ui-boutons", (actif ? couleur : 3)*100, 0, 100, 35, 14, x, y, w, h);
  if (pulse && actif){ ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = .16 + .16*Math.sin(G.t*8); nine("ui-boutons", 100, 0, 100, 35, 14, x, y, w, h); ctx.restore(); }
  ctx.save(); ctx.globalAlpha = actif ? 1 : .6;
  texte(t, x + w/2, y + h/2 + 7, 19, pulse ? "#fff3a8" : "#fff", "center", {max: w - 26}); ctx.restore();
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
  let g = ctx.createLinearGradient(0, 0, 0, 560); g.addColorStop(0, "#1a1040"); g.addColorStop(.5, "#6a3a7a"); g.addColorStop(.75, "#e07a5a"); g.addColorStop(1, "#40243a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#fff"; for (let i = 0; i < 30; i++){ ctx.globalAlpha = .3 + .3*Math.sin(t*2 + i); ctx.fillRect((i*97) % W, (i*53) % 150, 2, 2); } ctx.globalAlpha = 1;
  // la Gueule au loin
  ctx.fillStyle = "#3a2050"; ctx.beginPath(); ctx.moveTo(0, 240); [[50, 170], [120, 205], [215, 118], [250, 118], [300, 160], [360, 190], [360, 240]].forEach(p => ctx.lineTo(...p)); ctx.fill();
  const lg = .6 + Math.sin(t*2)*.2; ctx.fillStyle = `rgba(255,${110 + lg*60},40,${lg})`; ctx.fillRect(216, 114, 33, 7);
  ctx.fillStyle = "rgba(90,50,70,.45)"; for (let i = 0; i < 4; i++){ const yy = 112 - ((t*12 + i*28) % 110); ctx.beginPath(); ctx.arc(232 + Math.sin(t + i)*12, yy, 10 + i*4, 0, 7); ctx.fill(); }
  // sol
  ctx.fillStyle = "#2a1838"; ctx.fillRect(0, 236, W, 330);
  for (let y = 236; y < 560; y += 4){ ctx.fillStyle = y % 8 ? "#33204a" : "#2a1838"; ctx.fillRect(0, y, W, 2); }
  ctx.fillStyle = "rgba(0,0,0,.22)"; for (let x = 0; x < W; x += 8) for (let y = 240; y < 560; y += 8) if (((x + y)/8) % 2 === 0) ctx.fillRect(x, y, 4, 4);
  // cendres
  ctx.fillStyle = "#ffae6a"; for (const c of G.nuages){ c.y -= c.v*.016; c.x += Math.sin(t + c.y*.05)*.2; if (c.y < 0){ c.y = 560; c.x = Math.random()*W; } ctx.globalAlpha = .4; ctx.fillRect(c.x, c.y, c.r, c.r); } ctx.globalAlpha = 1;
}
function muraille(){
  const y0 = 200, y1 = 546, X = R.MUR_X;
  ctx.fillStyle = "#4a4458"; ctx.fillRect(0, y0, X, y1 - y0);
  ctx.fillStyle = "#3a3448"; for (let y = y0 + 8; y < y1; y += 14) for (let x = ((y/14) % 2)*12; x < X; x += 24) ctx.fillRect(x, y, 22, 1);
  ctx.fillStyle = "#2c2838"; ctx.fillRect(X - 4, y0, 4, y1 - y0);
  ctx.fillStyle = "#5c566c"; for (let x = 0; x < X; x += 16) ctx.fillRect(x, y0 - 12, 10, 12);
  ctx.fillStyle = "#6a6480"; ctx.fillRect(0, y0, X, 4);
  ctx.fillStyle = "rgba(255,190,90,.6)"; ctx.fillRect(14, y0 + 30, 6, 10); ctx.fillRect(28, y0 + 120, 6, 10);
  if (G.run){ const v = G.run.mur/G.run.murMax; barre(20, y0 - 34, 96, 8, v, v > .35 ? "#e8dcc0" : "#e8402a"); texte("MURAILLE " + Math.ceil(G.run.mur), 134, y0 - 25, 13, "#fff"); }
}

/* ---------- écrans : titre ---------- */
function ecranTitre(){
  fond(); muraille();
  const s = statsJoueur(), sauve = runSauvee();
  ctx.save(); const k = 1 + Math.sin(G.t*1.5)*.02; ctx.translate(W/2, 112); ctx.scale(k, k);
  texte("LES BANNIS", 0, 0, 28, "#ffd76a", "center", {titre: true, ombreC: "#3a0a20"}); ctx.restore();
  texte("Tenir la Muraille jusqu'au matin", W/2, 146, 16, "#ffe9c8", "center");
  // l'escouade de l'écran titre
  [["glenys-3", 120, 470], ["ley-2", 92, 400], ["linail-2", 160, 410]].forEach(([spr, x, y], i) => dessinerHeros(spr, "repos", G.t + i, x, y, 1));
  dessinerMonstre(19, false, 290, 440, -1, {e: 1.2}); dessinerMonstre(14, false, 320, 360, -1, {e: 1.5});
  panneau(24, 520, W - 48, 210);
  let y = 548;
  if (sauve){ bouton(44, y, W - 88, 46, "CONTINUER  ·  VAGUE " + sauve.vague, () => { G.run = sauve; R.preparerVague(G.run); allerPlacement(); SON.clic(); }, true, true); y += 54; }
  bouton(44, y, W - 88, 46, "NOUVELLE NUIT", () => { if (sauve) effacer("bannis.run"); nouvelleNuit(); SON.clic(); }, true, !sauve, sauve ? 2 : 0); y += 54;
  if (!window.ludoArtefact){ bouton(44, y, W - 88, 40, "◀ LUDOTHEQUE", () => { location.href = "../index.html"; }, true, false, 3); y += 48; }
  const rec = s.nuits ? `Record : vague ${s.record}${s.gagnees ? "  ·  nuits tenues : " + s.gagnees : ""}  ·  éclats : ${s.eclats}` : "Le Mage banni et ses condamnés contre la Gueule.";
  texte(rec, W/2, Math.min(y + 18, 718), 13, "#ffe3a8", "center", {gras: false, max: W - 70});
  // son
  petit(W - 58, 14, 44, 40); texte(sonOn ? "SON" : "MUET", W - 36, 40, 12, "#fff", "center"); zone(W - 58, 14, 44, 40, () => { sonOn = !sonOn; ecrire("bannis.son", sonOn); audio(); SON.clic(); });
}

/* ---------- dés à symboles : interface moderne (maquette 6, direction B, 27/11) ---------- */
try { document.fonts.load("700 20px \"Titillium Web\""); document.fonts.load("600 20px \"Titillium Web\""); } catch (e){}
const MOD = {fond: "#0e1a22", carte: "#16303a", bord: "#24505a", accent: "#3ddcbe", doux: "#8fb0ad", txt: "#e8f4f2"};
const NOMFACE = {recrue: "RECRUE", atelier: "FORGE", benediction: "BENEDICTION", danger: "RAID", coffre: "COFFRE", calme: "CALME"};
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
function carteM(x, y, w, h, bord, fond){ ctx.fillStyle = fond || MOD.carte; rr(x, y, w, h, 12); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = bord || MOD.bord; rr(x, y, w, h, 12); ctx.stroke(); }
function boutonM(x, y, w, h, t, f, clair = true, actif = true){
  ctx.fillStyle = !actif ? "#24444b" : clair ? MOD.accent : MOD.carte; rr(x, y, w, h, 12); ctx.fill();
  if (!clair && actif){ ctx.lineWidth = 2; ctx.strokeStyle = MOD.bord; rr(x, y, w, h, 12); ctx.stroke(); }
  texteM(t, x + w/2, y + h/2 + 7, 19, !actif ? "#6f9a9a" : clair ? "#05211c" : MOD.txt, "center", {max: w - 24});
  if (actif) zone(x, y, w, h, f);
}
function nomFace(type, k){ return type === "slot" ? D.CLASSES[k].n : type === "quoi" ? D.SLOTS[k].n : type === "qual" ? D.RARETES[k].n : NOMFACE[k]; }
function gemme(cx, cy, r, c){ ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = c; ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r*.8, 0); ctx.lineTo(0, r); ctx.lineTo(-r*.8, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.moveTo(0, -r); ctx.lineTo(r*.8, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.restore(); }
// une face de dé : type "slot" (classe), "quoi", "qual" ou "event" ; o.sel : liseré, o.etiquette : nom dessous, o.rot : animation
function tileFace(type, k, x, y, s, o = {}){
  ctx.save(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
  const cx = x + s/2, cy = y + s/2;
  if (o.rot){ ctx.translate(cx, cy); ctx.rotate(o.rot); ctx.scale(o.zoom || 1, o.zoom || 1); ctx.translate(-cx, -cy); }
  ctx.fillStyle = o.fond || MOD.carte; rr(x, y, s, s, s*.2); ctx.fill();
  ctx.lineWidth = o.sel ? 3 : 2; ctx.strokeStyle = o.sel ? MOD.accent : MOD.bord; rr(x, y, s, s, s*.2); ctx.stroke();
  const et = o.etiquette && s >= 40;
  const ch = et ? s*.46 : s*.5;   // centre du symbole
  if (type === "slot") dessinerHeros(D.CLASSES[k].spr, "repos", G.t, cx, y + (et ? s*.62 : s*.7), 1, {e: s/(et ? 52 : 44)});
  else if (type === "quoi"){ const t = s*(et ? .5 : .62); icone(D.SLOTS[k].noms[0][1], cx - t/2, y + ch - t/2, t); }
  else if (type === "qual") gemme(cx, y + ch, s*(et ? .27 : .32), D.RARETES[k].c);
  else { const E = D.EVENEMENTS[k]; if (E.ic){ const t = s*(et ? .5 : .62); icone(E.ic, cx - t/2, y + ch - t/2, t); } else dessinerHeros("glenys-3", "repos", G.t, cx, y + (et ? s*.62 : s*.7), 1, {e: s/(et ? 52 : 44)}); }
  if (et) texteM(nomFace(type, k), cx, y + s - 7, Math.max(10, s*.13), MOD.txt, "center", {max: s - 8});
  ctx.restore();
}
const aRoule = t0 => t0 !== undefined && G.t - t0 < .5 ? {rot: (G.t - t0)/.5*Math.PI*2, zoom: 1 + .25*Math.sin((G.t - t0)/.5*Math.PI)} : {};

/* ---------- petit tuto (première fois, puis bouton ?) ---------- */
const TUTO = [
  {t: "UN DE PAR CASE", d: "Chaque case de la Muraille a son propre dé. Sur chaque face, il y a une classe de combattant. La face qui sort décide qui vient te défendre.", f: [["slot", "guerriere"], ["slot", "magicienne"], ["slot", "pretresse"]]},
  {t: "DEUX DES POUR LE BUTIN", d: "Après une vague, deux dés tombent : QUOI (une arme, une armure ou un bijou) et QUELLE QUALITE (gris : commun, bleu : rare, violet : épique, or : légendaire).", f: [["quoi", "arme"], ["quoi", "armure"], ["qual", 1], ["qual", 2]]},
  {t: "L'ATELIER", d: "Une amélioration remplace UNE face d'un dé. Tu choisis donc ce qui sortira : grave la même classe sur les six faces d'une case, et elle sortira toujours.", f: [["slot", "mercenaire"], ["qual", 3], ["quoi", "bijou"]]},
  {t: "LES EVENEMENTS", d: "Toutes les trois vagues, un dé d'événement tombe : un nouveau condamné, un coffre, une bénédiction, un raid... Le hasard continue, mais tu peux le préparer.", f: [["event", "recrue"], ["event", "coffre"], ["event", "danger"]]}
];
function ecranTuto(){
  const p = G.tuto.p, P = TUTO[p];
  zone(0, 0, W, H, () => {});
  ctx.fillStyle = "rgba(5,12,16,.88)"; ctx.fillRect(0, 0, W, H);
  carteM(20, 150, W - 40, 430, MOD.accent, MOD.fond);
  texteM("COMMENT CA MARCHE  " + (p + 1) + "/" + TUTO.length, W/2, 190, 13, MOD.doux, "center");
  texteM(P.t, W/2, 232, 26, MOD.txt, "center", {max: W - 80});
  const n = P.f.length, s = 64, g = 12, x0 = (W - (n*s + (n - 1)*g))/2;
  P.f.forEach(([ty, k], i) => tileFace(ty, k, x0 + i*(s + g), 258, s, {etiquette: true, ...aRoule(G.tuto.t0 + i*.12)}));
  paragrapheM(P.d, 44, 376, W - 88, 17, MOD.txt, 1.3);
  if (p) boutonM(36, 516, 90, 44, "RETOUR", () => { G.tuto.p--; G.tuto.t0 = G.t; SON.clic(); }, false);
  boutonM(p ? 138 : 36, 516, p ? W - 174 : W - 72, 44, p === TUTO.length - 1 ? "COMPRIS !" : "SUIVANT", () => {
    SON.clic(); if (p === TUTO.length - 1){ G.tuto = null; ecrire("bannis.tuto", 1); } else { G.tuto.p++; G.tuto.t0 = G.t; } }, true);
}
function ouvrirTuto(){ G.tuto = {p: 0, t0: G.t}; SON.clic(); }

/* ---------- recrutement : un dé par case ---------- */
function nouvelleNuit(){
  G.run = R.nouvelleRun(); G.recrues = R.recruesDes(G.run); G.choisies = G.recrues.slice(); G.relR = 1; G.rolls = [-9, -9, -9]; G.ecran = "recrutement";
  G.tuto = lire("bannis.tuto", 0) ? null : {p: 0, t0: G.t};
}
function ecranRecrutement(){
  ctx.fillStyle = MOD.fond; ctx.fillRect(0, 0, W, H);
  texteM("TIRE TES CONDAMNES", 24, 48, 24, MOD.txt, "left", {max: W - 100});
  boutonM(W - 56, 22, 34, 34, "?", ouvrirTuto, false);
  paragrapheM("Chaque case de la Muraille a son dé : la face qui sort donne la classe du combattant. Touche un dé pour le relancer (une fois).", 24, 76, W - 48, 15, MOD.doux, 1.25);
  G.recrues.forEach((h, i) => {
    const y = 124 + i*170, C = D.CLASSES[h.cls], s = R.stats(h);
    carteM(14, y, W - 28, 162);
    const rr0 = aRoule(G.rolls[i]);
    tileFace("slot", h.cls, 28, y + 16, 80, {sel: G.relR > 0, etiquette: true, ...rr0});
    texteM("CASE " + (i + 1), 68, y + 120, 12, MOD.doux, "center");
    if (G.relR > 0) zone(28, y + 16, 80, 80, () => {
      const pris = G.recrues.filter((_, j) => j !== i).map(v => v.nom);
      G.recrues[i] = R.recrueDeCase(G.run, i, pris); G.choisies = G.recrues.slice(); G.relR--; G.rolls[i] = G.t; SON.clic(); });
    texteM(h.nom, 124, y + 36, 22, MOD.txt, "left", {max: W - 150});
    texteM(C.n + " · " + D.ROLES[C.role], 124, y + 56, 14, MOD.accent, "left", {max: W - 150});
    texteM(`VIE ${s.pv}   ATQ ${s.atq}   DEF ${s.def}`, 124, y + 78, 14, MOD.txt, "left", {max: W - 150});
    texteM("TRAIT : " + D.TRAITS[h.trait].n, 124, y + 98, 13, "#ffb08a", "left", {max: W - 150});
    texteM("LES 6 FACES DE CE DE :", 124, y + 120, 11, MOD.doux, "left");
    G.run.faces.slots[i].forEach((k, j) => tileFace("slot", k, 124 + j*31, y + 128, 27, {alpha: k === h.cls ? 1 : .8}));
  });
  texteM(G.relR > 0 ? "Relance disponible : 1" : "Relance utilisée", W/2, 650, 14, G.relR > 0 ? MOD.accent : MOD.doux, "center");
  boutonM(24, 664, W - 48, 58, "A LA MURAILLE !", () => {
    G.run.heros = G.recrues.slice(); R.placerParDefaut(G.run); R.preparerVague(G.run); allerPlacement(); SON.pose(); });
  if (G.tuto) ecranTuto();
}

/* ---------- butin : atelier et événement ---------- */
function rangeesDes(y0, ok, onTap, gravee){
  const lignes = [["slot", 0, "CASE 1 · COMBATTANTS"], ["slot", 1, "CASE 2 · COMBATTANTS"], ["slot", 2, "CASE 3 · COMBATTANTS"], ["quoi", 0, "DE QUOI (OBJETS)"], ["qual", 0, "DE QUALITE (RARETE)"]];
  lignes.forEach(([ty, d, nom], r) => {
    const y = y0 + r*76, f = ty === "slot" ? G.run.faces.slots[d] : G.run.faces[ty], actif = ok(ty, d);
    texteM(nom, 28, y + 12, 12, actif ? MOD.accent : MOD.doux, "left");
    f.forEach((k, i) => { const x = 28 + i*52, g = gravee && gravee.ty === ty && gravee.d === d && gravee.i === i;
      tileFace(ty, k, x, y + 18, 46, {sel: actif || g, alpha: actif || g || gravee ? 1 : .4, ...(g ? {rot: 0, zoom: 1 + .2*Math.abs(Math.sin(G.t*6))} : {})});
      if (actif && onTap) zone(x, y + 18, 46, 46, () => onTap(ty, d, i)); });
  });
}
function ecranAtelier(){
  const B = G.butin, c = B.choix;
  carteM(10, 78, W - 20, 640, MOD.bord, "rgba(14,26,34,.97)");
  texteM("L'ATELIER", W/2, 120, 26, MOD.txt, "center");
  if (B.gravee){
    paragrapheM(B.msg, 28, 150, W - 56, 16, MOD.txt, 1.25);
    rangeesDes(210, () => false, null, B.gravee);
    boutonM(28, 640, W - 56, 56, "CONTINUER", () => { SON.clic(); suiteButin(); });
    return;
  }
  if (!c){
    paragrapheM("Choisis une amélioration : elle remplacera une face de l'un de tes dés. Tu décides de ce qui sortira plus souvent.", 28, 150, W - 56, 16, MOD.doux, 1.25);
    B.offres.forEach((o, i) => {
      const x = 28 + i*108, y = 236, type = o.t === "slot" ? "slot" : o.t;
      tileFace(type, o.f, x, y, 96, {etiquette: true, ...aRoule(B.t0)});
      texteM(o.t === "slot" ? "FACE CLASSE" : o.t === "qual" ? "FACE QUALITE" : "FACE OBJET", x + 48, y + 118, 12, MOD.accent, "center");
      zone(x, y, 96, 96, () => { B.choix = o; SON.clic(); });
    });
    paragrapheM("FACE CLASSE : un combattant de plus dans les tirages. FACE QUALITE : de meilleurs objets. FACE OBJET : plus d'armes, d'armures ou de bijoux.", 28, 390, W - 56, 14, MOD.doux, 1.3);
    boutonM(28, 640, W - 56, 56, "PASSER", () => { SON.clic(); suiteButin(); }, false);
    return;
  }
  const type = c.t === "slot" ? "slot" : c.t;
  tileFace(type, c.f, 28, 140, 56, {etiquette: true, sel: true});
  paragrapheM("Touche la face à remplacer par " + nomFace(type, c.f) + ".", 100, 164, W - 130, 16, MOD.txt, 1.25);
  rangeesDes(230, ty => ty === (c.t === "slot" ? "slot" : c.t), (ty, d, i) => {
    const ancien = nomFace(ty, ty === "slot" ? G.run.faces.slots[d][i] : G.run.faces[ty][i]);
    R.graverSymbole(G.run, c, d, i); SON.or();
    B.gravee = {ty, d, i}; B.msg = nomFace(type, c.f) + " remplace " + ancien + (ty === "slot" ? " sur le dé de la case " + (d + 1) : " sur le dé " + (ty === "quoi" ? "QUOI" : "QUALITE")) + ".";
  });
  boutonM(28, 640, W - 56, 56, "CHOISIR AUTRE CHOSE", () => { B.choix = null; SON.clic(); }, false);
}
function ecranEvenement(){
  const B = G.butin, e = B.ev, E = e.k ? D.EVENEMENTS[e.k] : null;
  carteM(10, 78, W - 20, 640, MOD.bord, "rgba(14,26,34,.97)");
  texteM("EVENEMENT DE LA NUIT", W/2, 120, 24, MOD.txt, "center", {max: W - 60});
  paragrapheM("Un dé d'événement tombe toutes les trois vagues. Il peut amener un nouveau combattant, un coffre, une bénédiction ou un danger.", 28, 150, W - 56, 15, MOD.doux, 1.25);
  const rolling = e.t0 !== null && G.t - e.t0 < 1.1;
  if (!e.k){ carteM(W/2 - 62, 232, 124, 124, MOD.accent); texteM("?", W/2, 318, 72, MOD.accent, "center"); }
  else tileFace("event", e.k, W/2 - 62, 232, 124, {etiquette: !rolling, sel: true, rot: rolling ? (G.t - e.t0)*12 : 0, zoom: rolling ? 1 + .2*Math.sin((G.t - e.t0)*6) : 1});
  if (e.t0 === null){
    texteM("Les 6 faces du dé :", 28, 420, 13, MOD.doux, "left");
    G.run.faces.event.forEach((k, i) => tileFace("event", k, 28 + i*52, 432, 46, {etiquette: false}));
    boutonM(28, 640, W - 56, 56, "LANCER LE DE", () => { e.t0 = G.t; e.k = R.lancerEvenement(G.run); e.res = R.appliquerEvenement(G.run, e.k); SON.pose(); });
    return;
  }
  if (rolling) return;
  texteM(E.n, W/2, 392, 22, MOD.accent, "center", {max: W - 60});
  let y = 416 + paragrapheM(E.d, 36, 416, W - 72, 16, MOD.txt, 1.25, "left");
  if (e.res.texte) paragrapheM(e.res.texte, 36, y + 8, W - 72, 16, "#ffe3a8", 1.25);
  boutonM(28, 640, W - 56, 56, "CONTINUER", () => {
    SON.clic();
    if (e.k === "coffre"){ B.objets = [R.genererObjet(G.run.vague, true, G.run)]; B.pris = null; }
    if (e.k === "atelier"){ B.atelierFait = false; B.extraAtelier = true; }
    suiteButin(); });
}

/* ---------- placement et combat ---------- */
function allerPlacement(){
  G.ecran = "place"; G.sel = -1; G.C = null; G.des = null; G.sortPret = null; G.evo = null; G.butin = null; G.jauge = 0; G.txt = []; G.part = []; G.fx = [];
  G.unitesPlace = G.run.heros.map(h => { const c = R.CASES[h.slot]; return {h, x: c[0], y: c[1], ta: Math.random()*2}; });
  sauverRun();
}
function lancerCombat(){
  G.C = R.debutCombat(G.run); G.ecran = "combat"; G.jauge = 0; G.sel = -1; SON.pose();
}
function hud(){
  panneau(8, 8, W - 16, 50);
  texte("VAGUE " + G.run.vague + "/" + D.NB_VAGUES, 24, 40, 18, "#fff");
  icone([12, 7], 142, 18, 28); texte(String(G.run.or), 172, 40, 18, "#ffe14a");
  if (G.ecran === "combat"){
    petit(W - 112, 14, 46, 38); texte("x" + G.vitesse, W - 89, 40, 16, "#fff", "center");
    zone(W - 112, 14, 46, 38, () => { G.vitesse = G.vitesse === 1 ? 2 : 1; ecrire("bannis.vitesse", G.vitesse); SON.clic(); });
  }
  const gx = G.ecran === "combat" ? W - 164 : W - 112;
  petit(gx, 14, 46, 38); icone([13, 13], gx + 9, 19, 28); zone(gx, 14, 46, 38, () => { G.grimoire = true; SON.clic(); });
  petit(W - 60, 14, 46, 38); ctx.fillStyle = "#fff"; ctx.fillRect(W - 44, 23, 5, 20); ctx.fillRect(W - 34, 23, 5, 20);
  zone(W - 60, 14, 46, 38, () => { G.pause = true; SON.clic(); });
}
function bandeau(){
  if (G.ecran === "place"){
    panneau(8, 62, W - 16, 86);
    texte("VAGUE ANNONCEE", 22, 86, 14, "#ffe3a8");
    texte(G.run.revele ? "VAGUE REVELEE" : "", W - 22, 86, 13, "#ffe14a", "right");
    const ap = R.apercu(G.run);
    ap.slice(0, 6).forEach((m, i) => {
      // case de 46 x 42 dans le cadre ; le monstre (case de 96 px, jusqu'à 89 px de haut) réduit à 0,44 pour tenir en entier
      const x = 22 + i*53, y = 93; ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(x, y, 46, 42);
      if (m.cache){ texte("?", x + 23, y + 31, 22, "#ffe14a", "center"); return; }
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, 46, 42); ctx.clip(); dessinerMonstre(D.MONSTRES[m.k].i, false, x + 23, y + 41, -1, {e: .44}); ctx.restore();
      texte(m.boss ? "BOSS" : "x" + m.n, x + 44, y + 40, 12, m.boss ? "#ff7a5a" : "#fff", "right");
    });
  } else if (G.ecran === "combat"){
    panneau(8, 62, W - 16, 50);
    if (!G.sortPret) texte("LE MAGE INSTABLE", 22, 84, 13, "#ffe3a8");
    if (G.sortPret){ const S = D.SORTS[G.sortPret]; texte("PRET : " + S.n, 22, 84, 13, S.c, "left", {max: 220}); }
    const C = G.C, reste = C.file.length + R.vivants(C, "m").length;
    texte("monstres : " + reste, W - 22, 84, 13, "#fff", "right", {gras: false});
    barre(36, 92, W - 72, 9, G.jauge, G.jauge >= 1 ? `hsl(${(G.t*200) % 360},90%,62%)` : "#a77bff");
  }
}
function cartes(){
  const hs = G.run.heros, n = hs.length, w = Math.floor((W - 16 - (n - 1)*6)/n);
  hs.forEach((h, i) => {
    const x = 8 + i*(w + 6), y = 552, hh = 88, s = R.stats(h), cl = R.classeDe(h);
    const u = G.C ? G.C.unites.find(v => v.h === h) : null, pv = u ? u.pv : h.pv, pvMax = u ? u.pvMax : s.pv, mort = pv <= 0;
    panneau(x, y, w, hh);
    ctx.save(); if (mort) ctx.globalAlpha = .5;
    texte(h.nom, x + 12, y + 26, n > 3 ? 14 : 16, "#fff", "left", {max: n > 3 ? w - 22 : w - 50});
    if (n <= 3) texte("NIV " + h.niv, x + w - 12, y + 26, 13, "#ffe14a", "right");
    texte(cl.n + (n > 3 ? " " + h.niv : ""), x + 12, y + 46, 13, h.leg ? "#ffd76a" : "#d8e4ff", "left", {max: w - 24, gras: !!h.leg});
    barre(x + 22, y + 56, w - 44, 8, pv/pvMax, pv/pvMax > .35 ? "#4ad05a" : "#e8402a");
    const xp0 = D.XP_NIVEAUX[h.niv - 1] || 0, xp1 = R.nivSuivant(h);
    ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x + 12, y + 72, w - 24, 3); ctx.fillStyle = "#9ad8ff"; ctx.fillRect(x + 12, y + 72, (w - 24)*Math.min(1, (h.xp - xp0)/Math.max(1, xp1 - xp0)), 3);
    ctx.restore();
    if (G.sel === i){ ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 3; rr(x + 3, y + 3, w - 6, hh - 6, 6); ctx.stroke(); }
    zone(x, y, w, hh, () => { G.fiche = h; SON.clic(); });
  });
}
function objets(){
  const st = G.run.stock, liste = [["potion", [9, 0]], ["parchemin", [21, 1]], ["vue", [10, 7]]];
  liste.forEach(([k, ic], i) => {
    const x = 8 + i*62, y = 648, n = st[k] || 0;
    const utile = n > 0 && ((k === "potion" && G.ecran === "combat") || (k === "parchemin" && G.ecran === "combat") || (k === "vue" && G.ecran === "place" && !G.run.revele));
    panneau(x, y, 56, 58); ctx.save(); ctx.globalAlpha = utile ? 1 : .4; icone(ic, x + 12, y + 9, 32); ctx.restore();
    texte("x" + n, x + 50, y + 53, 13, "#fff", "right");
    zone(x, y, 56, 58, () => {
      if (!utile){ SON.clic(); return; }
      if (k === "vue"){ st.vue--; G.run.revele = true; SON.butin(); sauverRun(); }
      else if (R.utiliserObjet(G.C, k)){ if (k === "potion") SON.soin(); }
    });
  });
  const bx = 196, bw = W - 204;
  if (G.ecran === "place") bouton(bx, 648, bw, 58, "COMBATTRE", lancerCombat, true, true);
  else if (G.ecran === "combat") bouton(bx, 648, bw, 58, "LANCER LES DES", () => { if (G.jauge >= 1 && !G.des) ouvrirPlateau(); }, G.jauge >= 1 && !G.des, G.jauge >= 1);
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
  texte("ARRIERE", 92, 540, 12, "#ffe3a8", "center"); texte("AVANT", 162, 540, 12, "#ffe3a8", "center");
  if (G.sel < 0) texte("Touche un héros, puis une case", 268, 250, 14, "#fff", "center", {max: 170});
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
      if (e.u.camp === "m") G.jauge = Math.min(1, G.jauge + .035); else G.jauge = Math.min(1, G.jauge + .02);
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

/* ---------- dés du Mage ---------- */
const COUL_DES = {d4: "#3ac060", d6: "#f4f4f4", d8: "#3866e0", d10: "#9050d0", d12: "#e08030", d20: "#d83030"};
// ouvre le plateau : le sort annoncé, la réserve de dés ; on lance d'un geste vers le haut (ou le bouton)
function ouvrirPlateau(){
  if (!G.sortPret) G.sortPret = R.tirerSort(G.run.sorts);
  G.des = {etat: "attente", sort: G.sortPret, t: 0, res: null, des: null}; SON.clic();
}
function lancerDes(relance, force){
  const Dd = G.des, garder = relance && Dd.des ? Dd.des.map(d => d.garde ? d : null) : null;
  const f = Math.max(.4, Math.min(1.3, force || 1));
  Dd.des = R.lancerDes(G.run.des, garder).map((d, i) => Object.assign(d, {fin: d.garde ? 0 : (.55 + i*.22)*f, sp: alea(7, 12)*f, h: alea(60, 120)*f, garde: !!d.garde, pose: !!d.garde}));
  Dd.t = 0; Dd.etat = "roule"; Dd.res = null; SON.clic(); SON.de();
}
function formeDe(k, s){
  ctx.beginPath();
  if (k === "d4"){ ctx.moveTo(0, -s*1.1); ctx.lineTo(s*1.05, s*.75); ctx.lineTo(-s*1.05, s*.75); }
  else if (k === "d6") ctx.rect(-s, -s, 2*s, 2*s);
  else if (k === "d8"){ ctx.moveTo(0, -s*1.15); ctx.lineTo(s*1.15, 0); ctx.lineTo(0, s*1.15); ctx.lineTo(-s*1.15, 0); }
  else { const n = k === "d10" ? 4 : k === "d12" ? 5 : 6, rx = k === "d10" ? .85 : 1, ry = k === "d10" ? 1.2 : 1;
    for (let i = 0; i < n; i++){ const a = -Math.PI/2 + i*2*Math.PI/n; ctx.lineTo(Math.cos(a)*s*1.1*rx, Math.sin(a)*s*1.1*ry); } }
  ctx.closePath();
}
// un dé : sa forme et sa couleur selon le type ; face = {v} ou {s}, ou null (pas encore lancé)
function dessinerDe(k, face, x, y, taille, rot){
  const s = taille*.4;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
  ctx.fillStyle = "#120a1a"; ctx.save(); ctx.scale(1.14, 1.14); formeDe(k, s); ctx.fill(); ctx.restore();
  ctx.fillStyle = COUL_DES[k] || "#fff"; formeDe(k, s); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillRect(-s*.5, -s*.62, s*.6, 3);
  ctx.rotate(-(rot || 0));
  const fonce = k === "d6";
  if (!face) texte("?", 0, s*.42, taille*.36, fonce ? "#202040" : "#fff", "center", {ombre: !fonce});
  else if (face.v) texte(String(face.v), 0, s*.42, taille*.36, fonce ? "#202040" : "#fff", "center", {ombre: !fonce});
  else if (face.s === "x2") texte("x2", 0, s*.4, taille*.32, "#ffe14a", "center", {ombreC: "#3a1a00"});
  else if (face.s === "div2") texte("/2", 0, s*.4, taille*.32, "#9ff0ff", "center", {ombreC: "#00203a"});
  else if (face.s === "crane") icone([0, 0], -s*.6, -s*.6, s*1.2);
  else if (face.s === "etoile") icone([0, 5], -s*.6, -s*.6, s*1.2);
  ctx.restore();
}
// petit résumé des faces spéciales d'un dé
function specialesDe(de){ const c = {}; for (const f of de.f) if (f.s) c[f.s] = (c[f.s] || 0) + 1;
  return Object.entries(c).map(([k, n]) => (n > 1 ? n + " " : "") + D.FACES_SPECIALES[k].n).join(" "); }
function plateauDes(dt){
  const Dd = G.des; if (!Dd) return; Dd.t += dt;
  const S = D.SORTS[Dd.sort], n = G.run.des.length, py = 300;
  ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, H);
  grand(10, 112, W - 20, 470);
  icone(S.ic, 30, 136, 36);
  texte(S.n, 74, 162, 14, S.c, "left", {titre: true, max: W - 104});
  paragraphe(S.d, 30, 196, W - 60, 13, "#fff", 1.15);
  texte("S'il déraille : " + S.der, 30, 236, 12, "#ffb0a0", "left", {max: W - 60});
  const pos = i => W/2 + (i - (n - 1)/2)*Math.min(66, (W - 60)/n);
  let tousFinis = true;
  G.run.des.forEach((de, i) => {
    const x = pos(i); let y = py, rot = 0, face = null;
    if (Dd.etat === "attente"){ y += Math.sin(G.t*3 + i)*3; }
    else { const d = Dd.des[i], fini = Dd.t >= d.fin; if (!fini) tousFinis = false;
      if (!fini){ const k = Dd.t/d.fin; y = py + 170*(1 - k) - Math.abs(Math.sin(k*Math.PI*2.5))*d.h*(1 - k); rot = Dd.t*d.sp; face = R.nouveauDe(de.k).f[ent(0, D.TYPES_DES[de.k] - 1)]; if (Math.random() < .3) SON.de(); }
      else { face = d.face; if (!d.pose){ d.pose = true; SON.pose(); if (!reduit) G.sec = Math.max(G.sec, 3); etincelles(x, py, 8, "#fff"); } }
      if (fini && d.etoile) icone([0, 5], x + 14, py - 50, 20);
      if (Dd.etat === "choix"){ zone(x - 32, py - 34, 64, 70, () => { d.garde = !d.garde; SON.clic(); });
        if (d.garde){ ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 3; rr(x - 31, py - 34, 62, 68, 8); ctx.stroke(); texte("GARDE", x, py - 40, 11, "#ffe14a", "center"); } } }
    const z = Dd.etat === "choix" ? 1 + Math.max(0, .25 - (Dd.t - Dd.des[i].fin))*1.2 : 1;
    dessinerDe(de.k, face, x, y, 58*z, rot);
    texte(de.k.toUpperCase(), x, py + 50, 12, "#ffe3a8", "center");
    const sp = specialesDe(de); if (sp) texte(sp, x, py + 64, 10, "#ffe14a", "center", {max: 64});
  });
  if (Dd.etat === "attente"){
    const a = (G.t*1.5) % 1; ctx.save(); ctx.globalAlpha = 1 - a; texte("▲", W/2, 420 - a*30, 22, "#ffe14a", "center"); ctx.restore();
    texte("Glisse vers le haut pour lancer", W/2, 446, 15, "#fff", "center");
    bouton(80, 470, W - 160, 48, "LANCER", () => lancerDes(false, 1), true, true);
    bouton(110, 528, W - 220, 38, "PLUS TARD", () => { G.des = null; SON.clic(); }, true, false, 3);
  }
  if (tousFinis && Dd.etat === "roule"){ Dd.res = R.resultatDes(Dd.des); Dd.etat = "choix";
    if (Dd.res.deraille) SON.defaite(); else if (Dd.res.combo) SON.combo(); else SON.pose(); }
  if (Dd.etat === "choix"){
    const r = Dd.res;
    texte("BASE " + r.base + (r.etapes.length ? "  ·  " + r.etapes.join("  ·  ") : ""), W/2, 392, 13, "#ffe3a8", "center", {max: W - 50});
    const p = 1 + Math.sin(G.t*8)*.04; ctx.save(); ctx.translate(W/2, 422); ctx.scale(p, p);
    texte("PUISSANCE " + r.total, 0, 0, 16, r.deraille ? "#ff7a6a" : "#ffe14a", "center", {titre: true}); ctx.restore();
    if (r.deraille) texte("LE SORT VA DERAILLER !", W/2, 448, 15, "#ff5a4a", "center");
    else if (r.cranes === 1) texte("Un crâne : encore un et le sort déraille", W/2, 448, 13, "#ffb0a0", "center");
    const rel = G.run.relances || 0;
    bouton(26, 466, 150, 48, "RELANCER (" + rel + ")", () => { if (G.run.relances > 0){ G.run.relances--; lancerDes(true, 1); } }, rel > 0, false, 2);
    bouton(184, 466, W - 210, 48, "LANCER LE SORT", jeterSort, true, true);
    texte("Touche un dé pour le garder avant de relancer", W/2, 540, 12, "#ffe3a8", "center");
  }
}
function jeterSort(){
  const Dd = G.des, k = Dd.sort, S = D.SORTS[k], res = Dd.res; G.jauge = 0; G.sortPret = null; G.des = null;
  flotte(W/2, 196, S.n, S.c, {titre: true});
  if (res.deraille){ flotte(W/2, 232, "IL DERAILLE !", "#ff5a4a", {titre: true}); }
  const appliquer = () => { if (!G.C) return; const r = R.jeterSort(G.C, k, res.total, res.deraille);
    if (r.poulets){ SON.poule(); flotte(W/2, 268, "DES POULETS ?!", "#fff3c2", {titre: true}); for (let i = 0; i < Math.min(12, 4 + Math.round(res.total/6)); i++) G.fx.push({k: "poule", x: -20 - i*26, y: alea(260, 520), t: 0}); }
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
function effets(dt){
  for (const f of G.fx){ f.t += dt;
    if (f.k === "feu"){ const k = f.t/.9; for (let i = 0; i < 5; i++){ const x = 220 + i*28 - k*60, y = -40 + k*520 - i*30; ctx.fillStyle = "#ff6a1f"; ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill(); }
      if (f.t > .45 && f.t < .8){ ctx.fillStyle = `rgba(255,140,40,${.5 - (f.t - .45)})`; ctx.fillRect(0, 0, W, H); } if (f.t > .9) f.fini = true; }
    else if (f.k === "soin"){ ctx.fillStyle = `rgba(110,255,140,${Math.max(0, .3 - f.t*.3)})`; ctx.fillRect(0, 0, W, H); if (f.t > 1.2) f.fini = true; }
    else if (f.k === "foudre"){ ctx.strokeStyle = `rgba(200,240,255,${1 - f.t*3})`; ctx.lineWidth = 4; ctx.beginPath(); let x = f.x, y = 0; ctx.moveTo(x, y);
      while (y < 520){ y += 30; x = f.x + alea(-14, 14); ctx.lineTo(x, y); } ctx.stroke(); if (f.t > .33) f.fini = true; }
    else if (f.k === "teinte"){ ctx.fillStyle = `rgba(${f.c},${Math.max(0, .35 - f.t*.35)})`; ctx.fillRect(0, 0, W, H); if (f.t > 1) f.fini = true; }
    else if (f.k === "vent"){ ctx.strokeStyle = `rgba(200,235,255,${Math.max(0, .8 - f.t*.6)})`; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++){ const y = 250 + (i*37) % 280, x = W - ((f.t*520 + i*61) % (W + 120)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 40, y + 4); ctx.stroke(); } if (f.t > 1.3) f.fini = true; }
    else if (f.k === "rempart"){ for (let i = 0; i < 8; i++){ const k = Math.min(1, f.t*1.8 - i*.08); if (k <= 0) continue; const x = 200 - k*170 + i*6, y = 140 + i*45 - Math.sin(k*Math.PI)*60;
        ctx.fillStyle = "#8a8498"; ctx.fillRect(x - 6, y - 5, 12, 10); ctx.fillStyle = "#5c566c"; ctx.fillRect(x - 6, y + 3, 12, 2); }
      if (f.t > .55 && f.t < .9){ ctx.fillStyle = `rgba(255,240,200,${.4 - (f.t - .55)})`; ctx.fillRect(0, 196, R.MUR_X, 350); } if (f.t > 1) f.fini = true; }
    else if (f.k === "meteores"){ const k = f.t/.5; for (let i = 0; i < 3; i++){ const x = 120 + i*90 - k*40, y = -60 + k*(330 + i*40); ctx.fillStyle = "rgba(255,120,30,.5)"; ctx.beginPath(); ctx.arc(x + 10, y - 14, 14, 0, 7); ctx.fill();
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
  if (!B.atelierFait && (run.vague % 2 === 0 || B.extraAtelier)){ B.atelierFait = true; B.extraAtelier = false; B.offres = R.offresAtelier(run); B.choix = null; B.gravee = null; B.t0 = G.t; B.etape = "atelier"; return; }
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
  if (B.etape === "bilan"){
    grand(20, 150, W - 40, 300 + B.gains.length*22);
    texte("VAGUE TENUE !", W/2, 206, 18, "#ffe14a", "center", {titre: true});
    texte("+" + B.xp + " d'expérience pour chaque héros debout", W/2, 246, 15, "#fff", "center", {max: W - 80});
    texte("(la moitié pour les héros tombés)", W/2, 268, 13, "#ffe3a8", "center", {gras: false});
    texte("Or : " + G.run.or + "   ·   Muraille : " + Math.ceil(G.run.mur) + " / " + G.run.murMax, W/2, 304, 15, "#fff", "center");
    texte("Monstres abattus cette nuit : " + G.run.kills, W/2, 330, 15, "#fff", "center");
    // niveaux gagnés : les stats montent toutes seules
    B.gains.forEach((g, i) => { const t = g.t, l = [];
      if (t.pv) l.push("VIE +" + t.pv); if (t.atq) l.push("ATQ +" + t.atq); if (t.def) l.push("DEF +" + t.def); if (t.crit) l.push("CRIT +" + t.crit); if (t.vit) l.push("VIT +" + t.vit.toFixed(2));
      texte(g.h.nom + " NIVEAU " + g.niv + " : " + l.join("  "), W/2, 362 + i*22, 14, "#ffe14a", "center", {max: W - 70}); });
    if (B.gains.length && !B.sonNiv){ B.sonNiv = true; SON.niveau(); }
    bouton(70, 370 + B.gains.length*22 + 10, W - 140, 50, "CONTINUER", () => { suiteButin(); SON.clic(); }, true, true);
  } else if (B.etape === "niveau"){
    const h = B.h, cl = R.classeDe(h);
    grand(20, 130, W - 40, 380);
    texte("NIVEAU " + h.niv + " !", W/2, 186, 18, "#ffe14a", "center", {titre: true});
    dessinerHeros(cl.spr, "victoire", G.t, W/2, 286, 1, {e: 3});
    texte(h.nom + " · " + cl.n, W/2, 316, 16, "#fff", "center", {max: W - 80});
    texte("Choisis un bonus :", W/2, 346, 15, "#ffe3a8", "center");
    B.choix.forEach((b, i) => bouton(44, 362 + i*58, W - 88, 50, b.n, () => { R.appliquerBonus(h, b); SON.pose(); suiteButin(); }, true, false, i ? 2 : 1));
  } else if (B.etape === "atelier"){
    ecranAtelier();
  } else if (B.etape === "evenement"){
    ecranEvenement();
  } else if (B.etape === "evolution"){
    evolution(dt);
  } else if (B.etape === "objet"){
    grand(14, 104, W - 28, 520);
    texte("BUTIN", W/2, 150, 18, "#ffe14a", "center", {titre: true});
    texte("Deux dés ont décidé : QUOI (arme, armure, bijou) et QUELLE QUALITE.", W/2, 170, 13, "#ffe3a8", "center", {gras: false, max: W - 50}); texte("Choisis un objet, puis le héros qui le porte.", W/2, 188, 14, "#fff", "center", {gras: false});
    B.objets.forEach((o, i) => {
      const y = 194 + i*112;
      if (o.type === "de" || o.type === "page"){
        petit(30, y, W - 60, 104); ctx.strokeStyle = "#ffe14a"; ctx.lineWidth = 2; rr(32, y + 2, W - 64, 100, 8); ctx.stroke();
        if (o.type === "de"){ dessinerDe(o.de.k, {v: D.TYPES_DES[o.de.k]}, 66, y + 50, 52, Math.sin(G.t*2)*.1);
          texte(o.n, 102, y + 28, 15, "#fff", "left", {max: W - 146}); texte("UN DE DE PLUS POUR LE MAGE", 102, y + 48, 13, "#ffe14a", "left", {max: W - 146});
          texte(o.de.k.toUpperCase() + (specialesDe(o.de) ? " · " + specialesDe(o.de) : "") + " · réserve " + G.run.des.length + "/" + D.MAX_DES, 102, y + 69, 13, "#d8ffd8", "left", {max: W - 146}); }
        else { const S = D.SORTS[o.sort]; icone(S.ic, 42, y + 26, 48);
          texte("PAGE DE GRIMOIRE", 102, y + 28, 15, "#fff", "left", {max: W - 146}); texte("NOUVEAU SORT : " + S.n, 102, y + 48, 13, S.c, "left", {max: W - 146});
          paragraphe(S.d, 102, y + 68, W - 146, 12, "#d8ffd8", 1.05); }
        zone(30, y, W - 60, 104, () => { if (o.type === "de") G.run.des.push(o.de); else G.run.sorts.push(o.sort); B.pris = o; SON.butin(); suiteButin(); });
        return;
      }
      const R0 = D.RARETES[o.rar];
      petit(30, y, W - 60, 104); ctx.strokeStyle = R0.c; ctx.lineWidth = 2; rr(32, y + 2, W - 64, 100, 8); ctx.stroke();
      icone(o.ic, 42, y + 26, 48);
      texte(o.n, 102, y + 28, 15, "#fff", "left", {max: W - 146});
      texte(D.SLOTS[o.slot].n + " · " + R0.n, 102, y + 48, 13, R0.c, "left", {max: W - 176}); gemme(W - 52, y + 28, 14, R0.c);
      texte(R.texteBonus(o), 102, y + 69, 14, "#d8ffd8", "left", {max: W - 146});
      if (o.pour) texte(o.pour === "cac" ? "pour le corps à corps" : "pour les mages, soins et soutien", 102, y + 90, 12, "#ffe3a8", "left", {max: W - 146});
      zone(30, y, W - 60, 104, () => { B.pris = o; B.etape = "equiper"; SON.clic(); });
    });
    bouton(60, 556, W - 120, 46, "PRENDRE 12 PIECES D'OR", () => { G.run.or += 12; B.pris = {or: true}; SON.or(); suiteButin(); }, true, false, 3);
  } else if (B.etape === "equiper"){
    const o = B.pris, R0 = D.RARETES[o.rar];
    grand(10, 70, W - 20, 600);
    texte("QUI LE PORTE ?", W/2, 116, 16, "#ffe14a", "center", {titre: true});
    icone(o.ic, 30, 130, 40); texte(o.n, 78, 148, 15, R0.c, "left", {max: W - 104}); texte(R.texteBonus(o), 78, 168, 14, "#d8ffd8", "left", {gras: false, max: W - 104});
    const hs = G.run.heros.slice().sort((a, b) => (R.peutPorter(b, o) ? 1 : 0) - (R.peutPorter(a, o) ? 1 : 0));
    hs.forEach((h, i) => {
      const y = 186 + i*130, ok = R.peutPorter(h, o), ac = h.equip[o.slot], s0 = R.stats(h), s1 = R.statsAvec(h, o);
      petit(24, y, W - 48, 122); ctx.save(); if (!ok) ctx.globalAlpha = .45;
      dessinerHeros(R.classeDe(h).spr, "repos", G.t + i, 56, y + 72, 1, {e: 1.8});
      texte(h.nom + " · " + R.classeDe(h).n, 88, y + 24, 15, "#fff", "left", {max: W - 124});
      texte(ok ? (ac ? "porte : " + ac.n : D.SLOTS[o.slot].n + " : rien") : "ne peut pas porter cet objet", 88, y + 44, 12, ok ? (ac ? D.RARETES[ac.rar].c : "#c8e8c8") : "#ffb0a0", "left", {gras: !ac, max: W - 124});
      // stats actuelles et changement
      const L = [["VIE", s0.pv, s1.pv], ["ATQ", s0.atq, s1.atq], ["DEF", s0.def, s1.def], ["CRIT", s0.crit, s1.crit], ["VIT", s0.vit, s1.vit, 2], ["VOL", Math.round(s0.vol*100), Math.round(s1.vol*100)]];
      // deux colonnes ; le changement suit la valeur
      L.forEach(([n, a, b, dec], j) => { const x = 88 + (j % 2)*((W - 120)/2), yy = y + 66 + Math.floor(j/2)*20, d = Math.round((b - a)*100)/100;
        const t = n + " " + (dec ? a.toFixed(dec) : a); texte(t, x, yy, 13, "#e8f0ff", "left"); police(13); const lw = ctx.measureText(t).width;
        if (ok && d) texte((d > 0 ? "+" : "") + (dec ? d.toFixed(dec) : d), x + lw + 6, yy, 13, d > 0 ? "#6dff8a" : "#ff7a6a", "left"); });
      ctx.restore();
      if (ok) zone(24, y, W - 48, 122, () => { const ancien = R.equiper(h, o); if (ancien) G.run.or += Math.round(ancien.prix/2); SON.pose(); suiteButin(); });
    });
    texte("L'objet remplacé est revendu.", W/2, 590, 12, "#ffe3a8", "center", {gras: false});
    bouton(60, 602, W - 120, 44, "VENDRE (" + Math.round(o.prix/2) + " OR)", () => { G.run.or += Math.round(o.prix/2); SON.or(); suiteButin(); }, true, false, 3);
  } else if (B.etape === "marchand"){
    grand(14, 92, W - 28, 600);
    texte("LE MARCHAND", W/2, 138, 18, "#ffe14a", "center", {titre: true});
    texte("Tu as " + G.run.or + " pièces d'or.", W/2, 166, 15, "#fff", "center");
    D.MARCHAND.forEach((m, i) => {
      const plein = (m.k === "mur" && G.run.mur >= G.run.murMax) || (m.k === "de" && G.run.des.length >= D.MAX_DES);
      const y = 178 + i*70, ok = G.run.or >= m.prix && !plein;
      petit(30, y, W - 60, 64); ctx.save(); if (!ok) ctx.globalAlpha = .5;
      icone(m.ic, 40, y + 13, 38);
      texte(m.n, 88, y + 24, 15, "#fff", "left", {max: W - 184});
      paragraphe(m.d, 88, y + 42, W - 180, 12, "#ffe3a8", 1.0);
      texte(m.prix + " OR", W - 44, y + 24, 15, "#ffe14a", "right");
      if (G.run.stock[m.k] !== undefined) texte("x" + (G.run.stock[m.k] || 0), W - 44, y + 52, 13, "#fff", "right");
      if (m.k === "de") texte(G.run.des.length + "/" + D.MAX_DES, W - 44, y + 52, 13, "#fff", "right");
      ctx.restore();
      if (ok) zone(30, y, W - 60, 64, () => { G.run.or -= m.prix;
        if (m.k === "mur") G.run.mur = Math.min(G.run.murMax, G.run.mur + 30);
        else if (m.k === "de") G.run.des.push(R.nouveauDe("d8", "D8 DU PASSEUR"));
        else if (m.k === "graver"){ const de = R.graverFace(G.run); if (de) flotte(W/2, 640, de.n + " : une face devient x2", "#ffe14a", {petit: true}); }
        else G.run.stock[m.k] = (G.run.stock[m.k] || 0) + 1; SON.or(); });
    });
    bouton(50, 608, W - 100, 54, "VAGUE SUIVANTE", () => { G.run.vague++; R.preparerVague(G.run); allerPlacement(); SON.pose(); }, true, true);
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
  if (E.t > 1.1){ const k = Math.min(1, (E.t - 1.1)*4); ctx.save(); ctx.translate(W/2, 170); ctx.scale(2 - k, 2 - k); ctx.globalAlpha = k; texte("EVOLUTION !", 0, 0, 20, "#ffe14a", "center", {titre: true}); ctx.restore();
    texte(E.avant + "  >  " + R.classeDe(h).n, W/2, 206, 16, "#fff", "center", {max: W - 30});
    paragraphe(D.CLASSES[h.cls].leg.d, 200, 260, W - 220, 14, "#ffe3a8"); }
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
  grand(20, 140, W - 40, 470);
  texte(F.gagne ? "LE JOUR SE LEVE" : "LA MURAILLE", W/2, 200, 16, F.gagne ? "#ffe14a" : "#ff6a4a", "center", {titre: true});
  texte(F.gagne ? "LA NUIT EST TENUE" : "EST TOMBEE", W/2, 228, 16, F.gagne ? "#ffe14a" : "#ff6a4a", "center", {titre: true});
  const l = [["Vague atteinte", F.vague + " / " + D.NB_VAGUES], ["Monstres abattus", F.kills], ["Boss abattus", F.boss], ["Éclats de Gueule gagnés", "+" + F.eclats], ["Éclats en réserve", F.total], ["Record", "vague " + F.record]];
  l.forEach(([a, b], i) => { texte(a, 50, 280 + i*34, 16, "#fff"); texte(String(b), W - 50, 280 + i*34, 16, "#ffe14a", "right"); });
  paragraphe("Les éclats serviront à l'arbre de compétences (bientôt) : choix des recrues, classes légendaires, dés...", 50, 500, W - 100, 13, "#ffe3a8");
  bouton(50, 540, W - 100, 50, "NOUVELLE NUIT", () => { nouvelleNuit(); SON.clic(); }, true, true);
  bouton(80, 620, W - 160, 44, "TITRE", () => { G.ecran = "titre"; SON.clic(); }, true, false, 3);
}

/* ---------- fiche d'un héros ---------- */
function ficheHeros(){
  const h = G.fiche, s = R.stats(h), cl = R.classeDe(h), C = D.CLASSES[h.cls];
  ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, H); zone(0, 0, W, H, () => {});
  grand(10, 40, W - 20, 690);
  if (h.leg) aura(70, 196, G.t);
  dessinerHeros(cl.spr, "repos", G.t, 70, 196, 1, {e: 3});
  texte(h.nom, 130, 104, 22, "#fff");
  texte(cl.n, 130, 130, 15, h.leg ? "#ffd76a" : "#d8e4ff", "left", {max: W - 160});
  texte("NIVEAU " + h.niv + (C.sexe === "F" ? " · FEMME" : C.sexe === "H" ? " · HOMME" : ""), 130, 154, 13, "#ffe14a");
  const xp0 = D.XP_NIVEAUX[h.niv - 1] || 0, xp1 = R.nivSuivant(h);
  barre(142, 166, W - 196, 6, (h.xp - xp0)/Math.max(1, xp1 - xp0), "#9ad8ff");
  texte(h.xp + " / " + (isFinite(xp1) ? xp1 : "max") + " xp", 130, 192, 12, "#d8f0ff", "left", {gras: false});
  texte(D.ROLES[C.role], 34, 222, 14, "#9ad8ff");
  paragraphe(cl.d, 34, 242, W - 68, 13, "#ffe3a8");
  const pvAct = G.C ? (G.C.unites.find(u => u.h === h) || {pv: h.pv}).pv : h.pv;
  const lignes = [["VIE", Math.ceil(pvAct) + " / " + s.pv], ["ATTAQUE", s.atq], ["DEFENSE", s.def], ["VITESSE", s.vit.toFixed(2)], ["CRITIQUES", s.crit + " %"], ["VOL DE VIE", Math.round(s.vol*100) + " %"]];
  lignes.forEach(([a, b], i) => { const x = 34 + (i % 2)*((W - 68)/2), y = 290 + Math.floor(i/2)*26; texte(a, x, y, 14, "#d8e4ff", "left", {gras: false}); texte(String(b), x + (W - 68)/2 - 12, y, 14, "#fff", "right"); });
  texte("TRAIT DE CARACTERE : " + D.TRAITS[h.trait].n, 34, 384, 14, "#ffb08a", "left", {max: W - 68});
  paragraphe(D.TRAITS[h.trait].d, 34, 404, W - 68, 13, "#ffd8c8");
  texte("EQUIPEMENT", 34, 452, 15, "#ffe14a");
  ["arme", "armure", "bijou"].forEach((sl, i) => {
    const o = h.equip[sl], y = 462 + i*56; petit(30, y, W - 60, 50);
    if (o){ icone(o.ic, 40, y + 9, 32); texte(o.n, 82, y + 22, 14, D.RARETES[o.rar].c, "left", {max: W - 124}); texte(R.texteBonus(o), 82, y + 40, 12, "#d8ffd8", "left", {gras: false, max: W - 124}); }
    else texte(D.SLOTS[sl].n + " : rien", 46, y + 31, 14, "#a8a0b8", "left", {gras: false});
  });
  if (!h.leg) texte(legendaires().includes(h.cls) ? "Au niveau " + D.NIV_LEGENDAIRE + " : " + C.leg.n : "Légendaire : " + C.leg.n + " (à débloquer dans l'arbre)", W/2, 650, 13, "#ffd76a", "center", {max: W - 60});
  bouton(90, 664, W - 180, 46, "FERMER", () => { G.fiche = null; SON.clic(); }, true, false, 3);
}

/* ---------- grimoire : réserve de dés et sorts connus ---------- */
function ecranGrimoire(){
  ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, H); zone(0, 0, W, H, () => {});
  grand(10, 40, W - 20, 690);
  texte("LE GRIMOIRE", W/2, 90, 16, "#ffe14a", "center", {titre: true});
  // deux onglets : la réserve de dés, les sorts connus
  const onglet = G.ongletGrimoire || "des";
  bouton(30, 106, (W - 72)/2, 40, "DES " + G.run.des.length + "/" + D.MAX_DES, () => { G.ongletGrimoire = "des"; SON.clic(); }, true, onglet === "des", onglet === "des" ? 1 : 3);
  bouton(42 + (W - 72)/2, 106, (W - 72)/2, 40, "SORTS " + G.run.sorts.length, () => { G.ongletGrimoire = "sorts"; SON.clic(); }, true, onglet === "sorts", onglet === "sorts" ? 1 : 3);
  if (onglet === "des"){
  texte("Relances par vague : 1  ·  touche un dé gardé pour ne pas le relancer", W/2, 172, 12, "#ffe3a8", "center", {max: W - 60});
  G.run.des.forEach((de, i) => {
    const y = 186 + i*58; petit(26, y, W - 52, 52);
    dessinerDe(de.k, {v: D.TYPES_DES[de.k]}, 54, y + 24, 38, 0);
    texte(de.n, 84, y + 20, 14, "#fff", "left", {max: W - 120});
    // les faces, en petit
    de.f.forEach((f, j) => { const x = 84 + j*13, yy = y + 28; if (x > W - 44) return;
      ctx.fillStyle = f.s ? (f.s === "crane" ? "#5a2030" : "#5a4a10") : "rgba(0,0,0,.3)"; ctx.fillRect(x, yy, 12, 14);
      texte(f.v ? String(f.v) : f.s === "x2" ? "x2" : f.s === "div2" ? "/2" : f.s === "crane" ? "X" : "*", x + 6, yy + 11, 9, f.s ? "#ffe14a" : "#fff", "center", {ombre: false}); });
  });
  Object.entries(D.FACES_SPECIALES).forEach(([k, f], i) => texte(f.n + " : " + f.d, 30, 494 + i*20, 12, "#ffe14a", "left", {max: W - 60}));
  } else {
  const y = 160;
  G.run.sorts.forEach((k, i) => { const S = D.SORTS[k], yy = y + i*68;
    icone(S.ic, 28, yy + 6, 32); texte(S.n, 68, yy + 20, 14, S.c, "left", {max: W - 96});
    paragraphe(S.d, 68, yy + 38, W - 96, 12, "#fff", 1.05); texte("déraille : " + S.der, 68, yy + 64, 11, "#ffb0a0", "left", {max: W - 96}); });
  if (G.run.sorts.length < Object.keys(D.SORTS).length) texte("D'autres sorts dorment dans les pages du grimoire (butin des boss).", W/2, y + G.run.sorts.length*68 + 10, 12, "#ffe3a8", "center", {max: W - 60});
  }
  bouton(90, 664, W - 180, 46, "FERMER", () => { G.grimoire = false; SON.clic(); }, true, false, 3);
}

/* ---------- pause ---------- */
function ecranPause(){
  ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, H); zone(0, 0, W, H, () => {});
  grand(30, 170, W - 60, 420);
  texte("PAUSE", W/2, 228, 20, "#ffe14a", "center", {titre: true});
  bouton(60, 256, W - 120, 48, "REPRENDRE", () => { G.pause = false; SON.clic(); }, true, true);
  bouton(60, 314, W - 120, 48, sonOn ? "SON : OUI" : "SON : NON", () => { sonOn = !sonOn; ecrire("bannis.son", sonOn); SON.clic(); }, true, false, 2);
  bouton(60, 372, W - 120, 48, "ABANDONNER LA NUIT", () => { G.pause = false; finDeNuit(false); }, true, false, 2);
  let y = 430; if (!window.ludoArtefact){ bouton(60, y, W - 120, 44, "◀ LUDOTHEQUE", () => { location.href = "../index.html"; }, true, false, 3); y += 52; }
  paragraphe("La nuit est sauvegardée au début de chaque vague : tu peux quitter et reprendre plus tard.", 60, y + 16, W - 120, 12, "#ffe3a8");
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
  else if (G.ecran === "fin") ecranFin();
  else if (G.ecran === "butin") ecranButin(dt);
  else if (G.ecran === "place" || G.ecran === "combat"){
    // simulation
    if (G.ecran === "combat" && !G.pause && !G.fiche && !G.grimoire){
      let ds = dt*G.vitesse; if (G.gel > 0){ G.gel -= dt; ds = 0; } if (G.des) ds = 0;
      for (let pas = ds; pas > 0; pas -= 1/60) R.etape(G.C, Math.min(1/60, pas));
      for (const u of G.C.unites){ u.ta += ds; u.flash = Math.max(0, u.flash - ds); u.lunge = Math.max(0, u.lunge - ds); if (u.pv <= 0) u.mort += ds;
        if (u.pv > 0 && (u.act === "coup" || u.act === "mal") && u.ta > .45){ u.act = "repos"; u.ta = 0; } }
      traiterEvenements();
      if (G.jauge >= 1 && !G.sortPret){ G.sortPret = R.tirerSort(G.run.sorts); SON.niveau(); flotte(W/2, 170, "SORT PRET", "#d8b8ff", {titre: true}); }
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
    plateauDes(dt);
  }
  ctx.restore();
  if (G.fiche) ficheHeros();
  if (G.grimoire) ecranGrimoire();
  if (G.pause) ecranPause();
  requestAnimationFrame(boucle);
}

/* ---------- toucher et taille ---------- */
function coords(e){ const r = cv.getBoundingClientRect(); return [(e.clientX - r.left)*W/r.width, (e.clientY - r.top)*H/r.height]; }
cv.addEventListener("pointerup", e => {
  const g = G.geste; G.geste = null; if (!g || !G.des || G.des.etat !== "attente") return;
  const [, y] = coords(e), dy = g.y - y, dt = Math.max(.05, (performance.now() - g.t)/1000);
  if (dy > 40) lancerDes(false, .6 + Math.min(.7, dy/dt/2500));
});
cv.addEventListener("pointerdown", e => {
  audio();
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left)*W/r.width, y = (e.clientY - r.top)*H/r.height;
  if (G.des && G.des.etat === "attente" && y > 250 && y < 460) G.geste = {y, t: performance.now()};
  for (let i = zones.length - 1; i >= 0; i--){ const z = zones[i]; if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h){ z.f(); return; } }
  if (G.ecran === "place") G.sel = -1;
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && (G.ecran === "combat" || G.ecran === "place")){ if (G.fiche) G.fiche = null; else G.pause = !G.pause; } });
function taille(){
  dpr = Math.min(3, window.devicePixelRatio || 1);
  echelle = Math.min(window.innerWidth/W, window.innerHeight/H);
  cv.style.width = Math.floor(W*echelle) + "px"; cv.style.height = Math.floor(H*echelle) + "px";
  cv.width = Math.floor(W*echelle*dpr); cv.height = Math.floor(H*echelle*dpr);
}
window.addEventListener("resize", taille); taille();
document.addEventListener("visibilitychange", () => { if (document.hidden && G.ecran === "combat") G.pause = true; });
// pour les tests
window.Bannis.G = G;
window.Bannis.J = {nouvelleNuit, allerPlacement, lancerCombat, finDeVague, finDeNuit, ouvrirPlateau, lancerDes, jeterSort, suiteButin};
requestAnimationFrame(boucle);
})();

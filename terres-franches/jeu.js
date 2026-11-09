/* Terres franches : le dessin de la vallée (canvas), les villageois qui vont travailler, la caméra et le toucher.
   Les règles sont dans regles.js (window.TerresRegles), la carte dans carte.js ; l'interface (volets, bulles) dans ecran.js.
   window.Terres : S (la partie), cam, outils pour l'interface et les tests (avance(s), toucherCase(x, y), placer…). */
(function(){
"use strict";
const R = window.TerresRegles, C = window.TerresCarte, DON = window.TerresDonnees, AT = window.TerresAtlas, VL = window.TerresVillageois;
const T = C.T, MW = C.W * T, MH = C.H * T, CLE = "terres.partie";
const cv = document.getElementById("cv"), x = cv.getContext("2d");

/* ---------- images ---------- */
const decor = new Image(), vill = new Image();
let charges = 0; const fini = () => { if (++charges === 2) demarrer(); };
decor.onload = vill.onload = fini; decor.onerror = vill.onerror = fini;
decor.src = "img/decor.png"; vill.src = "img/villageois.png";
const ok = () => decor.naturalWidth > 0;
let planche = decor, saisonVue = 1;   // planche = le décor retouché pour la saison (vie.js)
const V = window.TerresVie;
// morceau n de la planche, pieds en (X, Y) (milieu du bas), échelle k ; f = image f d'une bande de `nf` images
function spr(n, X, Y, k, f, nf, miroir){
  const a = AT[n]; if (!a || !ok()) return; k = k || 1;
  const fw = nf ? a[2] / nf : a[2], sx = a[0] + (nf ? (Math.floor(f) % nf) * fw : 0), w = fw * k, h = a[3] * k;
  if (miroir){ x.save(); x.translate(Math.round(X), 0); x.scale(-1, 1); x.drawImage(planche, sx, a[1], fw, a[3], Math.round(-w / 2), Math.round(Y - h), w, h); x.restore(); }
  else x.drawImage(planche, sx, a[1], fw, a[3], Math.round(X - w / 2), Math.round(Y - h), w, h);
}
const pieces = {};   // morceau en canvas (motifs, icônes de l'interface)
function piece(n){
  if (pieces[n]) return pieces[n];
  const a = AT[n], c = document.createElement("canvas"); c.width = a[2]; c.height = a[3];
  c.getContext("2d").drawImage(decor, a[0], a[1], a[2], a[3], 0, 0, a[2], a[3]); return pieces[n] = c;
}
const ICONE = {bois: "i-bois", pierre: "i-pierre", baies: "i-baies", poisson: "i-poisson", ble: "i-ble", farine: "i-farine", pain: "i-pain", laine: "i-laine", vetements: "i-tissu", vivres: "i-baies"};
const icones = {};
function icone(r){ if (!icones[r] && ok()) icones[r] = piece(ICONE[r] || "i-or").toDataURL(); return icones[r] || ""; }
const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) ^ 0x5bd1e995; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

/* ---------- la partie ---------- */
let S = null;
function sauver(){ if (!S) return; S.vu = Date.now(); try { localStorage.setItem(CLE, R.sauver(S)); } catch (e){} }
function charger(){ let t = null; try { t = localStorage.getItem(CLE); } catch (e){} return (t && R.charger(t)) || null; }

/* ---------- la vallée : masques de l'eau et de la forêt (bords arrondis) ---------- */
function masque(car, seuils){
  const p = 4, m = document.createElement("canvas"); m.width = (C.W + 2) * p; m.height = (C.H + 2) * p;
  const b = m.getContext("2d"); b.fillStyle = "#fff";
  for (let y = -1; y <= C.H; y++) for (let xx = -1; xx <= C.W; xx++){
    const cx = Math.max(0, Math.min(C.W - 1, xx)), cy = Math.max(0, Math.min(C.H - 1, y));
    if (car.includes(C.GRILLE[cy][cx])) b.fillRect((xx + 1) * p, (y + 1) * p, p, p);
  }
  const g = document.createElement("canvas"); g.width = MW; g.height = MH; const gb = g.getContext("2d");
  gb.imageSmoothingEnabled = true; gb.filter = "blur(7px)"; gb.drawImage(m, -T, -T, (C.W + 2) * T, (C.H + 2) * T); gb.filter = "none";
  const d = gb.getImageData(0, 0, MW, MH).data;
  return seuils.map(([s, col]) => {
    const c = document.createElement("canvas"); c.width = MW; c.height = MH; const cb = c.getContext("2d"), im = cb.createImageData(MW, MH);
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] >= s){ im.data[i] = col[0]; im.data[i + 1] = col[1]; im.data[i + 2] = col[2]; im.data[i + 3] = col[3]; }
    cb.putImageData(im, 0, 0); return c;
  });
}
let EAU = null, RIVE = null, SOUS_BOIS = null, eauCalque = null;
// les arbres : un par carré de 2 × 2 cases de forêt (décalé au hasard), quelques jeunes arbres en lisière
const ARBRES = [];
function planterArbres(){
  for (let y = -2; y < C.H - 1; y += 2) for (let xx = -2; xx < C.W + 1; xx += 2){
    let n = 0; for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (C.case_(xx + dx, y + dy) === "T") n++;
    if (n < 3) continue;
    const h = hash(xx, y), X = (xx + 1 + (h - .5) * 1.2) * T, Y = (y + 1.6 + (hash(y, xx) - .5) * 1) * T;
    ARBRES.push({X, Y, n: "s-arbre" + (1 + Math.floor(h * 6)), ph: h * 6});
  }
  for (let y = 0; y < C.H; y++) for (let xx = 0; xx < C.W; xx++){
    if (C.GRILLE[y][xx] !== "T") continue;
    const voisin = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => /[.*]/.test(C.case_(xx + dx, y + dy)));
    if (voisin && hash(xx * 3, y * 7) < .35) ARBRES.push({X: (xx + .5) * T, Y: (y + .95) * T, n: "s-jeune", ph: xx});
  }
}
// le sol, redessiné quand une rue, un bâtiment ou le statut change
let fond = null, cleFond = "", ROUTES = {traces: [], cases: new Set()};
function lisser(cases){   // centre des cases, coins adoucis (Chaikin)
  let p = cases.map(([a, b]) => [(a + .5) * T, (b + .5) * T]);
  for (let k = 0; k < 2; k++){ if (p.length < 3) break; const q = [p[0]]; for (let i = 0; i < p.length - 1; i++){ const [a, b] = p[i], [c, d] = p[i + 1]; q.push([a * .75 + c * .25, b * .75 + d * .25], [a * .25 + c * .75, b * .25 + d * .75]); } q.push(p[p.length - 1]); p = q; }
  return p;
}
function dessinerFond(){
  const c = fond || (fond = document.createElement("canvas")); c.width = MW; c.height = MH; const b = c.getContext("2d");
  b.fillStyle = b.createPattern(piece("herbe"), "repeat"); b.fillRect(0, 0, MW, MH);
  for (let k = 0; k < 160; k++){ const h = hash(k, 7), X = hash(k, 3) * MW, Y = h * MH; b.fillStyle = k % 2 ? "rgba(255,255,200,.05)" : "rgba(20,60,10,.06)"; b.beginPath(); b.ellipse(X, Y, 20 + h * 40, 12 + h * 20, 0, 0, 6.3); b.fill(); }
  b.drawImage(SOUS_BOIS, 0, 0); b.drawImage(RIVE, 0, 0);
  const terre = b.createPattern(piece("terre"), "repeat"), st = S.statut, [fx, fy] = C.FEU;
  // la place : terre battue (pavée au village)
  const R0 = C.PLACE(st) * T, PX = (fx + .5) * T, PY = (fy + .5) * T;
  {  // bord irrégulier et adouci (piétiné), pavés au village
    const tmp = document.createElement("canvas"); tmp.width = MW; tmp.height = MH; const tb = tmp.getContext("2d");
    tb.fillStyle = terre; tb.beginPath();
    for (let k = 0; k <= 40; k++){ const an = k / 40 * 6.283, r = R0 * (1 + .1 * Math.sin(an * 3 + 1) + .06 * Math.sin(an * 7)); tb.lineTo(PX + Math.cos(an) * r, PY + Math.sin(an) * r * .9); }
    tb.fill();
    if (st >= 2){ tb.fillStyle = tb.createPattern(piece("pave"), "repeat"); tb.beginPath(); tb.ellipse(PX, PY, R0 * .7, R0 * .63, 0, 0, 6.3); tb.fill(); }
    tb.globalCompositeOperation = "destination-in"; const g = tb.createRadialGradient(PX, PY, R0 * .6, PX, PY, R0 * 1.15); g.addColorStop(0, "#000"); g.addColorStop(1, "rgba(0,0,0,0)");
    tb.fillStyle = g; tb.fillRect(0, 0, MW, MH); b.drawImage(tmp, 0, 0);
  }
  // les rues
  ROUTES = C.routes(S);
  b.lineCap = b.lineJoin = "round";
  for (const [w, s] of [[24, "rgba(90,70,30,.35)"], [20, terre]]){
    b.lineWidth = w; b.strokeStyle = s;
    for (const tr of ROUTES.traces){ const p = lisser(tr.cases); b.beginPath(); b.moveTo(p[0][0], p[0][1]); if (p.length === 1) b.lineTo(p[0][0] + .1, p[0][1]); for (const q of p.slice(1)) b.lineTo(q[0], q[1]); b.stroke(); }
  }
  // pied des terrains bâtis : un peu de terre devant la porte, potager des cabanes
  for (const id in S.lots){ const L = C.LOTS[id], bk = S.lots[id]; if (L.terrain !== "terre" || bk === "champ") continue;
    b.fillStyle = "rgba(80,110,40,.25)"; b.fillRect(L.x * T + 4, L.y * T + 8, L.l * T - 8, L.h * T - 10); }
  V.sol(c, saisonVue);   // l'herbe de la saison
}

/* ---------- l'eau, animée ---------- */
let motifEau = null;
function eau(t, X0, Y0, vw, vh){
  if (!eauCalque){ eauCalque = document.createElement("canvas"); eauCalque.width = MW; eauCalque.height = MH; }
  const b = eauCalque.getContext("2d");
  if (!motifEau) motifEau = b.createPattern(piece("eau"), "repeat");
  b.globalCompositeOperation = "source-over"; b.clearRect(0, 0, MW, MH);
  for (const [ox, oy, al] of [[t * 6, t * 3, 1], [-t * 5 + 17, t * 4 + 23, .45]]){ motifEau.setTransform(new DOMMatrix([1, 0, 0, 1, ox % 48, oy % 48])); b.globalAlpha = al; b.fillStyle = motifEau; b.fillRect(0, 0, MW, MH); }
  b.globalAlpha = 1;
  // reflets
  b.fillStyle = "rgba(255,255,255,.5)";
  for (let k = 0; k < 70; k++){ const gx = hash(k, 1) * MW, gy = hash(k, 2) * MH, a = Math.sin(t * 2 + k * 1.7); if (a > .6) b.fillRect(Math.round(gx + Math.sin(t * .5 + k) * 6), Math.round(gy), 4 + Math.round(a * 5), 2); }
  if (saisonVue === 3){ b.fillStyle = "rgba(228,238,246,.55)"; b.fillRect(0, 0, MW, MH); }   // l'hiver, l'eau gèle
  b.globalCompositeOperation = "destination-in"; b.drawImage(EAU, 0, 0); b.globalCompositeOperation = "source-over";
  x.drawImage(eauCalque, 0, 0);
}

/* ---------- les animations dessinées ---------- */
const vent = (X, Y, t) => Math.sin(t * 1.1 - X * .006 + Y * .002) * .6 + Math.sin(t * 2.7 + X * .03 + Y * .01) * .18;
function arbre(a, t){
  const at = AT[a.n]; if (!at) return; const w = vent(a.X, a.Y, t), h = at[3], iw = at[2], X0 = Math.round(a.X - iw / 2), Y0 = Math.round(a.Y - h + 8);
  for (let y = 0; y < h; y += 4){ const f = Math.pow(Math.max(0, (h - 34 - y) / (h - 34)), 1.3), dx = Math.round(w * 4 * f + Math.sin(a.ph + y * .07) * w * f);
    x.drawImage(planche, at[0], at[1] + y, iw, Math.min(4, h - y), X0 + dx, Y0 + y, iw, Math.min(4, h - y)); }
}
function champ(L, t, i){
  const s = V.etatChamp(t, i, saisonVue), at = AT["champ-" + s]; if (!at) return;
  const X = L.x * T, Y = L.y * T, W = L.l * T, H = L.h * T;
  if (saisonVue === 3){ x.drawImage(planche, at[0], at[1], at[2], at[3], X, Y, W, H); x.fillStyle = "rgba(240,246,255,.82)"; x.fillRect(X + 3, Y + 3, W - 6, H - 6); return; }
  if (s === "nu" || s === "pousse"){ x.drawImage(planche, at[0], at[1], at[2], at[3], X, Y, W, H); return; }
  for (let y = 0; y < at[3]; y += 2){ const w = vent(X + y, Y, t), dx = Math.round(w * 2 * ((y % 12) < 6 ? 1 : .5));
    x.drawImage(planche, at[0], at[1] + y, at[2], 2, X + dx, Y + y * H / at[3], W, 2 * H / at[3] + .5); }
}
// fumée : haut de la cheminée, en px de l'image (repérés pour la maquette 7)
const CHEMINEES = {chaume3: [74.5, 1], chaume4: [74, 10], colomb1: [77.5, 7], colomb2: [63, 21], pierre2: [63, 19], pierre3: [15.5, 6], pierre5: [19, 2]};
function fumee(n, X, Y, k, t, gris){
  const c = CHEMINEES[n], a0 = AT[n]; if (!c || !a0) return;
  const X0 = X - a0[2] * k / 2 + c[0] * k, Y0 = Y - a0[3] * k + c[1] * k, w = vent(X, Y, t);
  for (let q = 0; q < 6; q++){ const a = (t * .45 + q / 6 + X * .01) % 1, r = 2 + a * 6;
    x.fillStyle = `rgba(${gris ? "130,130,135" : "232,232,236"},${.55 * (1 - a)})`; x.beginPath(); x.arc(X0 + a * a * (14 + w * 12) + Math.sin(t * 2 + q) * a * 2, Y0 - 1 - r * .6 - a * 30, r, 0, 6.3); x.fill(); }
}
function tente(X, Y){
  x.fillStyle = "rgba(30,40,20,.3)"; x.beginPath(); x.ellipse(X, Y, 26, 7, 0, 0, 6.3); x.fill();
  x.fillStyle = "#c9b48a"; x.beginPath(); x.moveTo(X - 24, Y); x.lineTo(X, Y - 34); x.lineTo(X + 24, Y); x.fill();
  x.fillStyle = "#a8925f"; x.beginPath(); x.moveTo(X, Y - 34); x.lineTo(X + 24, Y); x.lineTo(X + 8, Y); x.fill();
  x.fillStyle = "#4a3418"; x.beginPath(); x.moveTo(X - 6, Y); x.lineTo(X, Y - 18); x.lineTo(X + 6, Y); x.fill();
  x.fillStyle = "#6a4a26"; x.fillRect(X - 1, Y - 38, 2, 6);
}
function ponton(L){
  const [dx, dy] = L.vers, X = (L.x + .5) * T, Y = (L.y + .5) * T, lg = 1.6 * T;
  x.save(); x.translate(X, Y); x.rotate(Math.atan2(dy, dx));
  x.fillStyle = "rgba(20,30,40,.3)"; x.fillRect(-4, -9, lg + 6, 22);
  x.fillStyle = "#5e3a1e"; x.fillRect(-6, -10, lg + 6, 20);
  for (let k = 0; k < lg / 7; k++){ x.fillStyle = k % 3 === 1 ? "#9a6838" : "#a8743f"; x.fillRect(-4 + k * 7, -8, 5, 16); }
  x.fillStyle = "#4a2c16"; for (const px of [lg - 8, lg / 2 - 4]) for (const py of [-12, 6]) x.fillRect(px, py, 6, 6);
  x.restore();
}
function carriere(L, bati){
  const X = L.x * T, Y = L.y * T;
  spr("rocher", X + 18, Y + 44, 1); spr("rocher", X + 46, Y + 40, .9); spr("rocher", X + 34, Y + 62, .8);
  if (!bati) return;
  for (const [a, b, w, h] of [[2, 46, 12, 8], [14, 50, 10, 7], [44, 52, 13, 9], [52, 44, 9, 7]]){ x.fillStyle = "#7d7a74"; x.fillRect(X + a, Y + b, w, h); x.fillStyle = "#a9a59c"; x.fillRect(X + a, Y + b, w, 2); }
  x.fillStyle = "#6a4a26"; x.fillRect(X + 58, Y + 14, 3, 42); x.fillRect(X + 40, Y + 14, 21, 3); x.fillStyle = "#d8d0b8"; x.fillRect(X + 42, Y + 17, 1, 14);
}
function bergerie(L, t){
  const X = L.x * T, Y = L.y * T, W = L.l * T, H = L.h * T;
  x.strokeStyle = "#7a5530"; x.lineWidth = 2;
  for (const yy of [Y + 38, Y + 46]){ x.beginPath(); x.moveTo(X + 4, yy); x.lineTo(X + 4, Y + H - 4); x.lineTo(X + W - 4, Y + H - 4); x.lineTo(X + W - 4, yy); x.stroke(); }
  for (let k = 0; k <= 8; k++){ x.fillStyle = "#6a4a26"; x.fillRect(X + 3 + k * (W - 8) / 8, Y + H - 12, 3, 10); }
  spr("grange", X + W / 2, Y + 50, .55);
  for (let k = 0; k < 3; k++){ const mx = X + 20 + k * 26 + Math.sin(t * .2 + k * 2) * 8, my = Y + 70 + (k % 2) * 10; spr("mouton-broute", mx, my, .32, t * 6 + k * 3, 12, Math.sin(t * .2 + k * 2 + 1.5) < 0); }
}
const MAISONS = {cabane: ["chaume1", "chaume2", "chaume3", "chaume4", "chaume5"], maison: ["colomb1", "colomb2", "colomb3", "colomb4", "pierre1", "pierre2", "pierre3", "pierre5"]};
const SPRITE = {four: ["four", 1], atelier: ["hangar", 1], moulin: ["moulin1", .5]};
function spriteDe(b, id){ if (MAISONS[b]){ const l = MAISONS[b]; return [l[id.charCodeAt(0) % l.length], 1]; } return SPRITE[b] || null; }

/* ---------- les villageois ---------- */
const AG = [];                                  // un par habitant ; i = rangée de villageois.png
const PIONNIER = VL.adultes.length - 1;
const ENTREE = [2, 23];
const rang = i => i === PIONNIER ? PIONNIER : i % (VL.adultes.length - 1);   // le pionnier a sa rangée à lui
const outil = i => VL.adultes[rang(i)].outil;
function lpc(a, X, Y, k){
  const ry = rang(a.i) * 256, row = {h: 0, g: 1, b: 2, d: 3}[a.dir] || 2;
  if (a.anim === "travail"){
    const hache = outil(a.i) === "hache", fs = hache ? 128 : 64, nb = hache ? 6 : 8, r = a.dir === "d" ? 1 : 0, f = Math.floor(a.f) % nb;
    x.drawImage(vill, 704 + f * fs, ry + r * fs, fs, fs, Math.round(X - fs / 2 * k), Math.round(Y - (hache ? 92 : 60) * k), fs * k, fs * k); return;
  }
  if (a.anim === "repos"){ const f = Math.floor(a.f / 4) % 2; x.drawImage(vill, 576 + f * 64, ry + row * 64, 64, 64, Math.round(X - 32 * k), Math.round(Y - 60 * k), 64 * k, 64 * k); return; }
  const f = 1 + Math.floor(a.f) % 8; x.drawImage(vill, f * 64, ry + row * 64, 64, 64, Math.round(X - 32 * k), Math.round(Y - 60 * k), 64 * k, 64 * k);
}
const PRODUIT = m => DON.METIERS[m].produit || DON.METIERS[m].sortie;
const RAPPORTE = {bucheron: 1, cueilleur: 1, pecheur: 1, carrier: 1};      // vont déposer au feu
const DUREE = {bucheron: 7, cueilleur: 6, pecheur: 11, carrier: 7, fermier: 9};
let cheminCache = new Map();
function marcher(a, cible, ensuite){
  const dep = [Math.max(0, Math.min(C.W - 1, Math.floor(a.x / T))), Math.max(0, Math.min(C.H - 1, Math.floor(a.y / T)))];
  const cle = dep + ">" + cible;
  let ch = cheminCache.get(cle);
  if (ch === undefined){ ch = (dep[0] === cible[0] && dep[1] === cible[1]) ? [dep] : C.chercher(dep, (xx, yy) => xx === cible[0] && yy === cible[1], ROUTES.cases, null); cheminCache.set(cle, ch); }
  a.chemin = ch ? ch.map(([u, v]) => [(u + .5) * T + (hash(a.i, u) - .5) * 8, (v + .5) * T + (hash(v, a.i) - .5) * 6]) : [[(cible[0] + .5) * T, (cible[1] + .5) * T]];
  a.etat = "marche"; a.apres = ensuite; a.anim = "marche";
}
function surPlace(a){ const [fx, fy] = C.FEU, r = C.PLACE(S.statut) * .7, an = hash(a.i, Math.floor(a.t)) * 6.3; return [Math.round(fx + Math.cos(an) * r), Math.round(fy + Math.sin(an) * r * .8)]; }
function synchroniser(){
  while (AG.length < S.pop){ const i = AG.length; AG.push({i, x: (ENTREE[0] + .5) * T, y: (ENTREE[1] + .5) * T, dir: "h", f: 0, t: 0, job: null, etat: "pret", anim: "marche"}); }
  AG.length = Math.min(AG.length, S.pop);
  for (const m in S.jobs){
    const les = AG.filter(a => a.job === m);
    for (let k = les.length - 1; k >= S.jobs[m]; k--){ les[k].job = null; les[k].etat = "pret"; }
    for (let k = les.length; k < S.jobs[m]; k++){
      const veut = ["bucheron", "carrier"].includes(m) ? "hache" : "houe";
      const libres = AG.filter(a => !a.job); if (!libres.length) break;
      const a = libres.find(b => outil(b.i) === veut) || libres[0]; a.job = m; a.etat = "pret";
    }
  }
}
function poste(a){
  const les = AG.filter(b => b.job === a.job), k = les.indexOf(a), p = C.postes(S, a.job);
  if (!p.length) return null;
  const q = p[k % p.length];
  if (a.job === "fermier"){ const L = C.LOTS[q[2]]; return [L.x + Math.floor(hash(a.i, a.t | 0) * L.l), L.y + Math.floor(hash(a.t | 0, a.i) * L.h), q[2]]; }
  return q;
}
function regarder(a, xx, yy){   // tourné vers la forêt, l'eau ou le rocher voisin
  const cible = a.job === "bucheron" ? "T" : a.job === "pecheur" ? "~" : a.job === "carrier" ? /[XY]/ : null;
  if (!cible) return;
  for (const [dx, dy, d] of [[-1, 0, "g"], [1, 0, "d"], [0, -1, "h"], [0, 1, "b"]]){ const c = C.case_(xx + dx, yy + dy); if (c === cible || (cible instanceof RegExp && cible.test(c))){ a.dir = d; return; } }
}
function bouger(a, dt){
  a.f += dt * (a.anim === "travail" ? 8 : 10); a.t += dt;
  if (a.etat === "marche"){
    const p = a.chemin[0]; if (!p){ a.etat = "arrive"; return; }
    const dx = p[0] - a.x, dy = p[1] - a.y, d = Math.hypot(dx, dy), v = 1.7 * T * dt;
    if (d <= v){ a.x = p[0]; a.y = p[1]; a.chemin.shift(); if (!a.chemin.length){ a.etat = "arrive"; } }
    else { a.x += dx / d * v; a.y += dy / d * v; a.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "d" : "g") : (dy > 0 ? "b" : "h"); }
    if (a.etat === "arrive" && a.apres){ const f = a.apres; a.apres = null; f(); }
    return;
  }
  if (a.etat === "pret"){
    if (!a.job){ marcher(a, surPlace(a), () => { a.etat = "flane"; a.anim = "repos"; a.dir = "b"; a.fin = a.t + 2 + hash(a.i, a.t | 0) * 5; }); return; }
    const p = poste(a); if (!p){ marcher(a, surPlace(a), () => { a.etat = "flane"; a.anim = "repos"; a.fin = a.t + 4; }); return; }
    const m = a.job;
    marcher(a, [p[0], p[1]], () => {
      if (a.job !== m){ a.etat = "pret"; return; }
      if (DON.METIERS[m].entree){ a.etat = "dedans"; a.fin = a.t + 30; return; }
      if (m === "berger"){ a.etat = "flane"; a.anim = "repos"; a.dir = "b"; a.fin = a.t + 8; return; }
      a.etat = "travail"; a.anim = m === "pecheur" ? "repos" : "travail"; regarder(a, p[0], p[1]); if (a.anim === "travail" && a.dir !== "g" && a.dir !== "d") a.dir = hash(a.i, 9) < .5 ? "g" : "d";
      a.fin = a.t + (DUREE[m] || 8);
    });
    return;
  }
  if ((a.etat === "flane" || a.etat === "dedans") && a.t > a.fin){ a.etat = "pret"; return; }
  if (a.etat === "travail" && a.t > a.fin){
    const m = a.job;
    if (RAPPORTE[m]){ a.porte = PRODUIT(m); marcher(a, surPlace(a), () => { flotte(a.x, a.y - 40, a.porte); a.porte = null; a.etat = "pret"; }); }
    else a.etat = "pret";
  }
}
function dessinerAgent(a){
  if (a.etat === "dedans") return;
  x.fillStyle = "rgba(20,30,10,.28)"; x.beginPath(); x.ellipse(a.x, a.y, 10, 4, 0, 0, 6.3); x.fill();
  lpc(a, a.x, a.y, .75);
  if (a.porte){ const ic = ICONE[a.porte], at = AT[ic]; if (at) x.drawImage(planche, at[0], at[1], at[2], at[3], Math.round(a.x - 8), Math.round(a.y - 58), 16, 16 * at[3] / at[2]); }
  if (a.job === "pecheur" && a.etat === "travail"){   // la ligne du pêcheur
    const s = a.dir === "g" ? -1 : a.dir === "d" ? 1 : 0, sy = a.dir === "h" ? -1 : a.dir === "b" ? 1 : 0, ex = a.x + s * 30 + (s ? 0 : 6), ey = a.y - 8 + sy * 26 + Math.sin(a.t * 2) * 1.5;
    x.strokeStyle = "rgba(240,240,220,.8)"; x.lineWidth = 1; x.beginPath(); x.moveTo(a.x + s * 6, a.y - 30); x.quadraticCurveTo(a.x + s * 22, a.y - 34, ex, ey); x.stroke(); x.fillStyle = "#e04030"; x.fillRect(Math.round(ex) - 1, Math.round(ey) - 1, 3, 3);
  }
}
// le pionnier, devant sa tente
const PI = {i: PIONNIER, x: (C.TENTE[0] + 1.6) * T, y: (C.TENTE[1] + 1.2) * T, dir: "b", f: 0, anim: "repos", fin: 0};

/* ---------- les chiffres qui s'envolent ---------- */
const flottes = [];
function flotte(X, Y, r, txt){ flottes.push({X, Y, r, txt: txt || "+", t: 0}); }
function dessinerFlottes(dt){
  for (let i = flottes.length - 1; i >= 0; i--){ const f = flottes[i]; f.t += dt; if (f.t > 1.4){ flottes.splice(i, 1); continue; }
    const a = AT[ICONE[f.r]], y = f.Y - f.t * 26; x.globalAlpha = Math.min(1, 1.4 - f.t) * 1;
    x.font = "8px 'Press Start 2P', monospace"; x.textAlign = "right"; x.fillStyle = "#000"; x.fillText(f.txt, f.X + 1, y + 1); x.fillStyle = "#fff"; x.fillText(f.txt, f.X, y);
    if (a) x.drawImage(planche, a[0], a[1], a[2], a[3], Math.round(f.X + 1), Math.round(y - 11), 14, 14 * a[3] / a[2]);
    x.globalAlpha = 1; }
}

/* ---------- la caméra ---------- */
const Z = [.6, .8, 1, 1.4, 2, 2.8];
const cam = {x: (C.FEU[0] + .5) * T, y: (C.FEU[1] + 1.5) * T, zi: 2};
function zoom(d){ cam.zi = Math.max(0, Math.min(Z.length - 1, cam.zi + d)); }
function borner(vw, vh){
  cam.x = vw >= MW ? MW / 2 : Math.max(vw / 2, Math.min(MW - vw / 2, cam.x));
  cam.y = vh >= MH ? MH / 2 : Math.max(vh / 2 - 60, Math.min(MH - vh / 2 + 120, cam.y));
}
const versMonde = (sx, sy) => { const z = Z[cam.zi]; return [cam.x + (sx - cv.clientWidth / 2) / z, cam.y + (sy - cv.clientHeight / 2) / z]; };
const versEcran = (wx, wy) => { const z = Z[cam.zi]; return [(wx - cam.x) * z + cv.clientWidth / 2, (wy - cam.y) * z + cv.clientHeight / 2]; };

/* ---------- le choix du terrain (placement) ---------- */
let PL = null;   // {b, lot, deplace} : bâtiment à poser (ou à déplacer depuis le terrain `deplace`)
function lotsPossibles(){ if (!PL) return []; const terr = C.LOTS[PL.deplace || ""] ? C.LOTS[PL.deplace].terrain : DON.BATIMENTS[PL.b].terrain; return C.libres(S, terr); }
function apercuRue(){
  if (!PL || !PL.lot) return null;
  const lots = Object.assign({}, S.lots), ordre = S.ordreLots.slice();
  if (PL.deplace){ delete lots[PL.deplace]; ordre[ordre.indexOf(PL.deplace)] = PL.lot; }
  else ordre.push(PL.lot);
  lots[PL.lot] = PL.b;
  const r = C.routes({lots, ordreLots: ordre, statut: S.statut}), t = r.traces.find(q => q.id === PL.lot);
  return t ? t.cases : null;
}
function dessinerPlacement(t){
  if (!PL) return;
  const pos = lotsPossibles();
  x.setLineDash([6, 5]); x.lineDashOffset = -t * 12; x.lineWidth = 2;
  for (const id of pos){ const L = C.LOTS[id]; x.strokeStyle = id === PL.lot ? "rgba(255,240,120,.95)" : "rgba(255,255,255,.65)"; x.strokeRect(L.x * T + 3, L.y * T + 3, L.l * T - 6, L.h * T - 6); }
  x.setLineDash([]);
  const ch = apercuRue();
  if (ch){ x.strokeStyle = "rgba(255,240,140,.7)"; x.lineWidth = 6; x.lineCap = "round"; x.setLineDash([2, 9]); x.beginPath(); const p = lisser(ch); x.moveTo(p[0][0], p[0][1]); for (const q of p) x.lineTo(q[0], q[1]); x.stroke(); x.setLineDash([]); }
  if (PL.lot){ const L = C.LOTS[PL.lot]; x.globalAlpha = .6 + .2 * Math.sin(t * 4); batiment(PL.b, PL.lot, t, true); x.globalAlpha = 1; x.fillStyle = "rgba(255,240,120,.18)"; x.fillRect(L.x * T + 3, L.y * T + 3, L.l * T - 6, L.h * T - 6); }
}

/* ---------- un bâtiment ---------- */
function batiment(b, id, t, fantome){
  const L = C.LOTS[id], X = (L.x + L.l / 2) * T, Y = (L.y + L.h) * T - 4;
  if (b === "champ"){ champ(L, t, id.charCodeAt(0)); return; }
  if (b === "ponton"){ ponton(L); return; }
  if (b === "carriere"){ carriere(L, true); return; }
  if (b === "bergerie"){ bergerie(L, t); return; }
  const s = spriteDe(b, id); if (!s) return;
  x.fillStyle = "rgba(20,30,10,.25)"; x.beginPath(); x.ellipse(X, Y - 2, 40 * s[1] / (s[1] < 1 ? .55 : 1), 7, 0, 0, 6.3); x.fill();
  spr(s[0], X, Y, s[1]);
  if (!fantome && (b === "cabane" || b === "maison")) fumee(s[0], X, Y, s[1], t);
}
function chantier(c, id, t){
  const L = C.LOTS[id], X = (L.x + L.l / 2) * T, Y = (L.y + L.h) * T - 6, tot = DON.BATIMENTS[c.k].travail, u = 1 - c.reste / tot;
  if (c.k === "champ"){ x.fillStyle = "rgba(110,80,40,.6)"; x.fillRect(L.x * T + 6, L.y * T + 6, (L.l * T - 12) * u, L.h * T - 12); }
  else if (c.k === "ponton"){ x.globalAlpha = .4 + .6 * u; ponton(L); x.globalAlpha = 1; }
  else spr("chantier", X, Y, .5);
  x.fillStyle = "#2a1608"; x.fillRect(X - 22, Y + 1, 44, 6); x.fillStyle = "#ffd94a"; x.fillRect(X - 21, Y + 2, 42 * u, 4);
  if (Math.sin(t * 9) > .6){ x.fillStyle = "#fff6c8"; x.fillRect(X - 10 + (t * 37 % 20), Y - 30 - (t * 53 % 14), 2, 2); }
}

/* ---------- une image ---------- */
let dernier = 0, vuLe = Date.now();
function image(now){
  requestAnimationFrame(image);
  const t = now / 1000, dt = Math.min(.25, Math.max(0, t - dernier)); dernier = t;
  if (!S) return;
  R.pas(S, dt);
  // ce que les règles annoncent
  if (S.evts.length){ for (const e of S.evts) window.TerresEcran && window.TerresEcran.annonce(e.txt, e.bon); S.evts = []; }
  const sv = V.saison(S); if (sv !== saisonVue){ saisonVue = sv; planche = V.recolorer(decor, sv); }
  const cle = sv + "|" + S.ordreLots.join("") + "|" + S.statut + "|" + Object.keys(S.lots).map(k => S.lots[k]).join(",");
  if (cle !== cleFond){ cleFond = cle; dessinerFond(); cheminCache = new Map(); }
  synchroniser();
  const dpr = Math.min(2, window.devicePixelRatio || 1), cw = cv.clientWidth, ch = cv.clientHeight;
  if (cv.width !== Math.round(cw * dpr) || cv.height !== Math.round(ch * dpr)){ cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr); }
  const z = Z[cam.zi], vw = cw / z, vh = ch / z; borner(vw, vh);
  const X0 = cam.x - vw / 2, Y0 = cam.y - vh / 2;
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = "#2a4a22"; x.fillRect(0, 0, cv.width, cv.height);
  x.imageSmoothingEnabled = false;
  x.setTransform(z * dpr, 0, 0, z * dpr, Math.round(-X0 * z * dpr), Math.round(-Y0 * z * dpr));
  x.drawImage(fond, 0, 0);
  eau(t, X0, Y0, vw, vh);
  // champs au sol (avant le reste)
  const enCours = {}; for (const c of S.chantiers) if (c.lot) enCours[c.lot] = c;
  for (const id in S.lots) if (S.lots[id] === "champ" && !enCours[id]) champ(C.LOTS[id], t, id.charCodeAt(0));
  for (const id in S.lots) if (S.lots[id] === "ponton" && !enCours[id]) ponton(C.LOTS[id]);
  // tout ce qui a des pieds, rangé de haut en bas
  const L = [], vis = (X, Y, m) => X > X0 - m && X < X0 + vw + m && Y > Y0 - 20 && Y < Y0 + vh + 170;
  for (const a of ARBRES) if (vis(a.X, a.Y, 70)) L.push([a.Y, () => arbre(a, t)]);
  for (let y = 0; y < C.H; y++) for (let xx = 0; xx < C.W; xx++) if (C.GRILLE[y][xx] === "*") L.push([(y + .9) * T, () => spr("buisson", (xx + .5) * T, (y + 1) * T, .4, (t * 5 + xx) , 8)]);
  for (const id in C.LOTS){ const Lo = C.LOTS[id];
    if (Lo.terrain === "roche" && S.lots[id] !== "carriere") L.push([(Lo.y + 2) * T, () => carriere(Lo, false)]);
    if (enCours[id]) L.push([(Lo.y + Lo.h) * T, () => chantier(enCours[id], id, t)]);
    else if (S.lots[id] && !["champ", "ponton"].includes(S.lots[id])) L.push([(Lo.y + Lo.h) * T - 2, () => batiment(S.lots[id], id, t)]);
  }
  const [fx, fy] = C.FEU, [tx, ty] = C.TENTE;
  if (S.statut < 2) L.push([(ty + .9) * T, () => tente((tx + .5) * T, (ty + .9) * T)]);   // au village, le pionnier a sa maison
  L.push([(fy + .8) * T, () => { spr("feu", (fx + .5) * T, (fy + .95) * T, 1, t * 9, 8); }]);
  if (S.statut >= 1) L.push([(fy - .4) * T, () => spr(S.statut >= 2 ? "fontaine" : "puits", (fx - 1.9) * T, (fy - .4) * T, S.statut >= 2 ? .8 : .7)]);
  for (const a of AG){ bouger(a, dt); L.push([a.y, () => dessinerAgent(a)]); }
  PI.f += dt * 8; if (PI.anim === "travail" && t > PI.fin) PI.anim = "repos";
  L.push([PI.y, () => dessinerAgent(PI)]);
  V.objets(L, x, t, dt, S, AG, vis);
  L.sort((a, b) => a[0] - b[0]);
  for (const [, f] of L) f();
  // les lumières de la nuit : le feu, la fontaine, une fenêtre par logis
  const lum = [[(fx + .5) * T, (fy + .6) * T, 90, 1.2]];
  for (const id in S.lots) if (!enCours[id] && (S.lots[id] === "cabane" || S.lots[id] === "maison" || S.lots[id] === "four")){ const Lo = C.LOTS[id]; lum.push([(Lo.x + Lo.l / 2) * T, (Lo.y + Lo.h) * T - 22, 46, .9]); }
  V.ciel(x, t, S, X0, Y0, vw, vh, lum);
  dessinerPlacement(t);
  dessinerFlottes(dt);
  // nuages qui passent
  for (let k = 0; k < 3; k++){ const nx = ((k * 420 + t * 12) % (MW + 600)) - 300, ny = 120 + k * 260; const g = x.createRadialGradient(nx, ny, 0, nx, ny, 160); g.addColorStop(0, "rgba(20,30,40,.12)"); g.addColorStop(1, "rgba(20,30,40,0)"); x.fillStyle = g; x.beginPath(); x.ellipse(nx, ny, 220, 120, 0, 0, 6.3); x.fill(); }
  if (window.TerresEcran) window.TerresEcran.image(t);
}

/* ---------- le toucher ---------- */
const doigts = new Map(); let glisse = null, pince = null, bouge = 0;
cv.addEventListener("pointerdown", e => {
  doigts.set(e.pointerId, [e.clientX, e.clientY]); cv.setPointerCapture(e.pointerId);
  if (doigts.size === 1){ glisse = {x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y}; bouge = 0; }
  if (doigts.size === 2){ const [a, b] = [...doigts.values()]; pince = {d: Math.hypot(a[0] - b[0], a[1] - b[1]), zi: cam.zi}; glisse = null; bouge = 99; }
});
cv.addEventListener("pointermove", e => {
  if (!doigts.has(e.pointerId)) return; doigts.set(e.pointerId, [e.clientX, e.clientY]);
  if (pince && doigts.size === 2){ const [a, b] = [...doigts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); cam.zi = Math.max(0, Math.min(Z.length - 1, pince.zi + Math.round(Math.log(d / pince.d) / Math.log(1.4)))); return; }
  if (!glisse) return; const z = Z[cam.zi], dx = e.clientX - glisse.x, dy = e.clientY - glisse.y; bouge = Math.max(bouge, Math.hypot(dx, dy));
  if (bouge > 8){ cam.x = glisse.cx - dx / z; cam.y = glisse.cy - dy / z; }
});
const lacher = e => {
  const tap = doigts.size === 1 && bouge <= 8 && glisse; doigts.delete(e.pointerId);
  if (doigts.size < 2) pince = null;
  if (tap) toucher(e.clientX, e.clientY);
  if (!doigts.size) glisse = null;
};
cv.addEventListener("pointerup", lacher); cv.addEventListener("pointercancel", e => { doigts.delete(e.pointerId); glisse = pince = null; });
cv.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, {passive: false});
function lotEn(wx, wy){ const tx = Math.floor(wx / T), ty = Math.floor(wy / T); for (const id in C.LOTS){ const L = C.LOTS[id]; if (tx >= L.x && tx < L.x + L.l && ty >= L.y && ty < L.y + L.h) return id; } return null; }
function toucher(sx, sy){
  const [wx, wy] = versMonde(sx, sy), E = window.TerresEcran;
  if (PL){ const id = lotEn(wx, wy); if (id && lotsPossibles().includes(id)){ PL.lot = id; E && E.placement(); } return; }
  const id = lotEn(wx, wy);
  if (id && S.lots[id]){ E && E.bulle(id); return; }
  E && E.bulle(null);
  // récolter : la case touchée ou une voisine (forêt, buisson, eau)
  const tx = Math.floor(wx / T), ty = Math.floor(wy / T);
  return toucherCase(tx, ty, wx, wy);
}
function toucherCase(tx, ty, wx, wy){
  const quoi = {T: "bois", "*": "baies", "~": "poisson"};
  let r = quoi[C.case_(tx, ty)];
  if (!r) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if ((r = quoi[C.case_(tx + dx, ty + dy)])) break;
  if (!r) return null;
  if (R.toucher(S, r)) return null;
  flotte(wx === undefined ? (tx + .5) * T : wx, wy === undefined ? ty * T : wy - 8, r, "+" + DON.PIONNIER.toucher);
  PI.anim = "travail"; PI.fin = dernier + .45; PI.dir = (tx + .5) * T < PI.x ? "g" : "d";
  return r;
}

/* ---------- départ, absence, sauvegarde ---------- */
function demarrer(){
  EAU = masque("~", [[128, [255, 255, 255, 255]]])[0];
  [RIVE] = masque("~", [[52, [150, 122, 76, 255]]]);
  [SOUS_BOIS] = masque("T", [[110, [30, 70, 24, 120]]]);
  planterArbres();
  S = charger();
  let recap = null;
  if (S && S.vu){ const s = (Date.now() - S.vu) / 1000; if (s > 60) recap = R.horsLigne(S, s); }
  if (!S) S = R.creer();
  vuLe = Date.now();
  document.getElementById("chargement").hidden = true;
  if (window.TerresEcran) window.TerresEcran.depart(recap);
  requestAnimationFrame(image);
  setInterval(sauver, 10000);
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden){ sauver(); vuLe = Date.now(); return; }
  const s = (Date.now() - vuLe) / 1000;
  if (S && s > 60){ const r = R.horsLigne(S, s); window.TerresEcran && window.TerresEcran.retour(r); }
  dernier = performance.now() / 1000;
});
window.addEventListener("pagehide", sauver);

function nouvelle(){ S = R.creer(); AG.length = 0; cleFond = ""; PL = null; sauver(); cam.x = (C.FEU[0] + .5) * T; cam.y = (C.FEU[1] + 1.5) * T; cam.zi = 2; }
function viser(id){ const L = C.LOTS[id]; cam.x = (L.x + L.l / 2) * T; cam.y = (L.y + L.h / 2) * T + 40; }
window.Terres = {
  get S(){ return S; }, cam, zoom, sauver, nouvelle, icone, piece, spriteDe, AT, viser, versEcran,
  get PL(){ return PL; }, set PL(v){ PL = v; },
  avance(s){ R.pas(S, s); }, toucherCase, AG, flotte
};
})();

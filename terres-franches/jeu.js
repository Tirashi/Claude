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
function icone(r){
  if (!icones[r] && ok()){
    if (r === "vivres"){ const c = document.createElement("canvas"); c.width = c.height = 48; const b = c.getContext("2d"), p1 = piece("i-baies"), p2 = piece("i-poisson");   // n'importe quelle nourriture
      b.drawImage(p1, 0, 0, 30, 30 * p1.height / p1.width); b.drawImage(p2, 14, 22, 34, 34 * p2.height / p2.width); icones[r] = c.toDataURL(); }
    else icones[r] = piece(ICONE[r] || "i-or").toDataURL();
  }
  return icones[r] || "";
}
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
    const h = hash(xx, y), n2 = "s-arbre" + (1 + Math.floor(h * 6));
    // décalé au hasard, sinon au centre du carré, sinon on recule vers la forêt : l'ombre au pied ne doit pas toucher l'eau
    for (const [ox, oy] of [[(h - .5) * 1.2, (hash(y, xx) - .5)], [0, 0], [.5, 0], [-.5, 0], [0, -.5]]){
      const X = (xx + 1 + ox) * T, Y = (y + 1.6 + oy) * T;
      if (piedSec(X, Y, AT[n2] ? AT[n2][2] * .42 : 40)){ ARBRES.push({X, Y, n: n2, ph: h * 6}); break; }
    }
  }
  for (let y = 0; y < C.H; y++) for (let xx = 0; xx < C.W; xx++){
    if (C.GRILLE[y][xx] !== "T") continue;
    const voisin = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => /[.*]/.test(C.case_(xx + dx, y + dy)));
    if (voisin && hash(xx * 3, y * 7) < .35 && piedSec((xx + .5) * T, (y + .95) * T, 26)) ARBRES.push({X: (xx + .5) * T, Y: (y + .95) * T, n: "s-jeune", ph: xx});
  }
}
// le pied d'un arbre (ellipse de demi-largeur r) est-il loin de l'eau ?
function piedSec(X, Y, r){
  for (const [dx, dy] of [[-r, 0], [r, 0], [0, -6], [0, 10], [-r * .7, 8], [r * .7, 8], [0, 0]]) if (C.case_(Math.floor((X + dx) / T), Math.floor((Y + dy) / T)) === "~") return false;
  return true;
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
  // les rues (avant la place : elles s'y fondent)
  ROUTES = C.routes(S);
  b.lineCap = b.lineJoin = "round";
  const PXf = (fx + .5) * T, PYf = (fy + .5) * T;
  for (const [w, s] of [[24, "rgba(90,70,30,.35)"], [20, terre]]){
    b.lineWidth = w; b.strokeStyle = s;
    for (const tr of ROUTES.traces){ const p = lisser(tr.cases); b.beginPath(); b.moveTo(p[0][0], p[0][1]);
      if (p.length === 1){ const d = Math.hypot(PXf - p[0][0], PYf - p[0][1]) || 1; b.lineTo(p[0][0] + (PXf - p[0][0]) / d * T * 1.2, p[0][1] + (PYf - p[0][1]) / d * T * 1.2); }
      for (const q of p.slice(1)) b.lineTo(q[0], q[1]); b.stroke(); }
  }
  // la place : terre battue (pavée au village), par-dessus le bout des rues
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
  // pied des terrains bâtis : un peu de terre devant la porte, potager des cabanes
  for (const id in S.lots){ const L = C.LOTS[id], bk = S.lots[id]; if (L.terrain !== "terre" || bk === "champ") continue;
    b.fillStyle = "rgba(80,110,40,.25)"; b.fillRect(L.x * T + 4, L.y * T + 8, L.l * T - 8, L.h * T - 10); }
  V.sol(c, saisonVue);   // l'herbe de la saison
  // le puits (hameau) puis la fontaine (village) : au bord de la place, jamais sur une rue ni sur un terrain
  PUITS = null;
  if (st >= 1){
    const Rp = C.PLACE(st) * .78;
    for (const an of [3.6, 2.7, 5.8, .5, 4.4, 1.6, 5.1, 3.1]){
      const px = fx + .5 + Math.cos(an) * Rp, py = fy + .5 + Math.sin(an) * Rp * .85, cx = Math.floor(px), cy = Math.floor(py);
      const occupe = [[0, 0], [-1, 0], [1, 0], [0, -1]].some(([dx, dy]) => ROUTES.cases.has((cy + dy) * C.W + cx + dx) || C.case_(cx + dx, cy + dy) !== "." && C.case_(cx + dx, cy + dy) !== "^" || Object.keys(C.LOTS).some(id => { const L = C.LOTS[id]; return cx + dx >= L.x && cx + dx < L.x + L.l && cy + dy >= L.y && cy + dy < L.y + L.h; }));
      if (!occupe){ PUITS = [px * T, (py + .4) * T]; break; }
    }
  }
  placerDecor();
}
let PUITS = null;
// le décor des lieux de récolte : il s'étoffe à chaque statut (la lisière des bûcherons devient un petit camp, etc.)
let DECOR = [];
const CAMPS = {
  bucheron: [[0, "souche-hache", .7], [1, "souche", .6], [1, "buche", .6], [2, "tonneaux", .6], [2, "buche", .6]],
  pecheur: [[1, "sechoir-poisson", .5], [2, "tonneau", .4], [2, "caisse-p", .45]],
  cueilleur: [[1, "panier-baies", .45], [2, "panier-pommes", .45]],
  carrier: [[1, "gravats", .7], [2, "caisse", .4]],
  fermier: [[1, "botte", .5], [2, "meule-foin", .5]]
};
function placerDecor(){
  DECOR = []; const pris = new Set();
  const libreIci = (cx, cy) => C.case_(cx, cy) === "." && !ROUTES.cases.has(cy * C.W + cx) && !C.surPlace(cx, cy, S.statut) && !pris.has(cy * C.W + cx)
    && !Object.values(C.LOTS).some(L => cx >= L.x && cx < L.x + L.l && cy >= L.y - 1 && cy <= L.y + L.h);   // ni sur un terrain ni devant sa porte
  for (const m in CAMPS){
    const postes = C.postes(S, m); if (!postes.length) continue;
    for (const p of postes.slice(0, 4)) pris.add(p[1] * C.W + p[0]);   // les premiers postes : les villageois s'y tiennent
    let k = 0;
    for (const [st, n, ech] of CAMPS[m]){
      if (st > S.statut) continue;
      // près du premier poste (le plus proche du feu), sur une case libre voisine
      for (let tour = 0; tour < 30; tour++){
        const p = postes[Math.min(postes.length - 1, Math.floor(k / 2))], d = [[1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1], [2, 0], [-2, 0], [0, 2]][(k + tour) % 8];
        const cx = p[0] + d[0], cy = p[1] + d[1];
        if (libreIci(cx, cy)){ pris.add(cy * C.W + cx); DECOR.push({n, X: (cx + .5) * T + (hash(cx, cy) - .5) * 8, Y: (cy + .85) * T, k: ech}); break; }
        if (tour === 29) k++;
      }
      k++;
    }
  }
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
const CHEMINEES = {four: [35, 31], chaume3: [74.5, 1], chaume4: [74, 10], colomb1: [77.5, 7], colomb2: [63, 21], pierre2: [63, 19], pierre3: [15.5, 6], pierre5: [19, 2]};
function fumee(n, X, Y, k, t, gris){
  const c = CHEMINEES[n] || (CHEMINEE_AJOUT[n] && [CHEMINEE_AJOUT[n][0], CHEMINEE_AJOUT[n][1] - 15]), a0 = AT[n]; if (!c || !a0) return;
  const X0 = X - a0[2] * k / 2 + c[0] * k, Y0 = Y - a0[3] * k + c[1] * k, w = vent(X, Y, t);
  for (let q = 0; q < 6; q++){ const a = (t * .45 + q / 6 + X * .01) % 1, r = 2 + a * 6;
    x.fillStyle = `rgba(${gris ? "120,120,126" : "214,214,220"},${.75 * (1 - a)})`; x.beginPath(); x.arc(X0 + a * a * (14 + w * 12) + Math.sin(t * 2 + q) * a * 2, Y0 - 1 - r * .6 - a * 30, r, 0, 6.3); x.fill(); }
}
function feuDeCamp(X, Y, t){
  x.fillStyle = "rgba(30,20,10,.35)"; x.beginPath(); x.ellipse(X, Y, 20, 8, 0, 0, 6.3); x.fill();
  // les bûches croisées (sous les flammes)
  x.lineCap = "round";
  for (const [a, c] of [[.5, "#6b4423"], [-.45, "#5a381c"], [.05, "#7a4e2a"]]){ x.strokeStyle = c; x.lineWidth = 5; x.beginPath(); x.moveTo(X - Math.cos(a) * 14, Y - 3 + Math.sin(a) * 4); x.lineTo(X + Math.cos(a) * 14, Y - 3 - Math.sin(a) * 4); x.stroke(); }
  x.fillStyle = "#3a2210"; for (const [a, b] of [[-13, -4], [12, -6], [-12, -1], [13, -1]]) x.fillRect(Math.round(X + a) - 1, Math.round(Y + b) - 1, 3, 3);
  x.lineCap = "butt";
  // le cercle de pierres (devant)
  for (let k = 0; k < 9; k++){ const an = k / 9 * 6.283 + .3, px = X + Math.cos(an) * 17, py = Y - 2 + Math.sin(an) * 6; if (Math.sin(an) < -.2) continue;
    x.fillStyle = "#6e6a62"; x.beginPath(); x.ellipse(px, py, 4.5, 3.2, 0, 0, 6.3); x.fill(); x.fillStyle = "#9a958a"; x.fillRect(Math.round(px - 2), Math.round(py - 3), 3, 1); }
  // les flammes : des langues qui ondulent, du rouge au jaune
  const lang = (dx, h, l, c, ph) => { const o = Math.sin(t * 7 + ph) * 2 + Math.sin(t * 13 + ph * 2) * 1, hh = h * (.85 + .15 * Math.sin(t * 9 + ph * 3));
    x.fillStyle = c; x.beginPath(); x.moveTo(X + dx - l, Y - 4); x.quadraticCurveTo(X + dx - l * .8, Y - 4 - hh * .55, X + dx + o, Y - 4 - hh); x.quadraticCurveTo(X + dx + l * .8, Y - 4 - hh * .55, X + dx + l, Y - 4); x.fill(); };
  for (const [dx, h, l, ph] of [[-6, 16, 6, 0], [6, 15, 6, 2], [0, 22, 8, 4]]) lang(dx, h, l, "#d8452a", ph);
  for (const [dx, h, l, ph] of [[-4, 11, 4.5, 1], [4, 12, 4.5, 3], [0, 16, 5.5, 5]]) lang(dx, h, l, "#f59a2c", ph);
  lang(0, 9 + Math.sin(t * 11) * 1.5, 3.5, "#ffe27a", 6);
  // étincelles qui montent
  for (let k = 0; k < 4; k++){ const u = (t * .8 + k / 4) % 1; x.fillStyle = `rgba(255,${200 - u * 120},80,${1 - u})`; x.fillRect(Math.round(X + Math.sin(k * 2.3 + t * 2) * 6 * u), Math.round(Y - 14 - u * 26), 2, 2); }
}
// cheminées ajoutées aux maisons du pack qui n'en ont pas (pied de la cheminée sur le toit, en px de l'image)
const CHEMINEE_AJOUT = {chaume1: [74, 18], chaume2: [62, 34], chaume5: [80, 24], colomb3: [80, 27], colomb4: [82, 16], pierre1: [80, 27], pierre4: [64, 32]};
function cheminee(n, X, Y, k){
  const c = CHEMINEE_AJOUT[n], a0 = AT[n]; if (!c || !a0) return;
  const X0 = Math.round(X - a0[2] * k / 2 + c[0] * k), Y0 = Math.round(Y - a0[3] * k + c[1] * k);
  x.fillStyle = "#5a5450"; x.fillRect(X0 - 4, Y0 - 13, 9, 13); x.fillStyle = "#8a847c"; x.fillRect(X0 - 3, Y0 - 12, 7, 11);
  x.fillStyle = "#a8a298"; x.fillRect(X0 - 5, Y0 - 15, 11, 3); x.fillStyle = "#3a3430"; x.fillRect(X0 - 3, Y0 - 14, 7, 1);
  x.fillStyle = "#6e6862"; x.fillRect(X0 - 3, Y0 - 8, 7, 1); x.fillRect(X0 - 3, Y0 - 4, 7, 1);
}
// buisson à baies (pack de la ferme Cute SCKR, rouges ou bleues) ; l'hiver, sans baies
function buissonBaies(cx, cy, t){
  const X = (cx + .5) * T, Y = (cy + 1) * T;
  if (saisonVue === 3){ spr("buisson", X, Y, .4, t * 5 + cx, 8); return; }
  spr(hash(cx, cy) < .5 ? "baies-rouges" : "baies-bleues", X + Math.round(vent(X, Y, t) * .6), Y, .78);
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
const ROCHERS = [[13, 26, .6], [50, 33, .58], [31, 60, .5]];   // [x, pied, taille] dans un terrain de 2 × 2
function carriere(L, bati){
  const X = L.x * T, Y = L.y * T;
  for (const [a, b, k] of ROCHERS) spr("rocher", X + a, Y + b, k);
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
// le pionnier (dernière rangée) est le premier villageois : AG[0] ; les autres prennent les rangées suivantes
const rang = i => i === 0 ? PIONNIER : (i - 1) % (VL.adultes.length - 1);
// l'outil de chaque métier (planches de villageois.png : VL.outils = {outil: [x, case, images]}) ; le cueilleur cueille à la main
const OUTIL = {bucheron: "hache", carrier: "pioche", pecheur: "canne", fermier: "houe"};
function lpc(a, X, Y, k){
  const ry = rang(a.i) * 256, row = {h: 0, g: 1, b: 2, d: 3}[a.dir] ?? 2;   // ?? et pas || : « haut » vaut 0
  if (a.anim === "travail" && VL.outils[a.outil || "hache"]){
    const [ox, fs, nb] = VL.outils[a.outil || "hache"], r = a.dir === "d" ? 1 : 0;
    // la canne : on lance une fois, puis on attend (petite secousse de temps en temps) ; les autres outils frappent en boucle
    const f = a.outil === "canne" ? (a.f < 4 ? Math.floor(a.f) : (Math.floor(a.t * 1.2) % 3 === 0 ? 5 : 4)) : Math.floor(a.f) % nb;
    x.drawImage(vill, ox + f * fs, ry + r * fs, fs, fs, Math.round(X - fs / 2 * k), Math.round(Y - (fs === 128 ? 92 : 60) * k), fs * k, fs * k); return;
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
// où déposer une récolte : la porte de sa réserve (grenier, aire) quand elle existe, sinon près du feu
function depot(a, r){ const b = R.gardien(S, r), id = b && S.bat[b] && Object.keys(S.lots).find(k => S.lots[k] === b); return id ? C.porte(S, id) : surPlace(a); }
function surPlace(a){ const [fx, fy] = C.FEU, r = C.PLACE(S.statut) * .7, an = hash(a.i, Math.floor(a.t)) * 6.3; return [Math.round(fx + Math.cos(an) * r), Math.round(fy + Math.sin(an) * r * .8)]; }
function synchroniser(){
  while (AG.length < S.pop){ const i = AG.length, [x0, y0] = i === 0 ? [PI.x, PI.y] : [(ENTREE[0] + .5) * T, (ENTREE[1] + .5) * T]; AG.push({i, x: x0, y: y0, dir: i ? "h" : "b", f: 0, t: 0, job: null, etat: "pret", anim: "marche"}); }
  AG.length = Math.min(AG.length, S.pop);
  for (const m in S.jobs){
    const les = AG.filter(a => a.job === m);
    for (let k = les.length - 1; k >= S.jobs[m]; k--){ les[k].job = null; les[k].etat = "pret"; }
    for (let k = les.length; k < S.jobs[m]; k++){
      const a = AG.find(b => !b.job); if (!a) break;
      a.job = m; a.etat = "pret";
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
  const cible = a.job === "bucheron" ? "T" : a.job === "pecheur" ? "~" : a.job === "cueilleur" ? "*" : a.job === "carrier" ? /[XY]/ : null;
  if (!cible) return;
  for (const [dx, dy, d] of [[-1, 0, "g"], [1, 0, "d"], [0, -1, "h"], [0, 1, "b"]]){ const c = C.case_(xx + dx, yy + dy); if (c === cible || (cible instanceof RegExp && cible.test(c))){ a.dir = d; return; } }
}
function bouger(a, dt){
  a.f += dt * (a.anim === "travail" ? 8 : 10); a.t += dt;
  if (a.etat === "marche"){
    const p = a.chemin[0]; if (!p){ a.etat = "arrive"; return; }
    const cx = Math.floor(a.x / T), cy = Math.floor(a.y / T), rue = ROUTES.cases.has(cy * C.W + cx) || C.surPlace(cx, cy, S.statut);
    const dx = p[0] - a.x, dy = p[1] - a.y, d = Math.hypot(dx, dy), v = DON.MARCHE.vitesse * (rue ? DON.MARCHE.route : 1) * T * dt;   // plus vite sur les rues
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
      a.etat = "travail"; a.anim = OUTIL[m] ? "travail" : "repos"; a.outil = OUTIL[m]; a.f = 0; regarder(a, p[0], p[1]); if (a.anim === "travail" && a.dir !== "g" && a.dir !== "d") a.dir = hash(a.i, 9) < .5 ? "g" : "d";
      a.fin = a.t + (DUREE[m] || 8);
    });
    return;
  }
  if ((a.etat === "flane" || a.etat === "dedans") && a.t > a.fin){ a.etat = "pret"; return; }
  if (a.etat === "travail" && a.t > a.fin){
    const m = a.job;
    if (RAPPORTE[m]){ a.porte = PRODUIT(m); marcher(a, depot(a, a.porte), () => { flotte(a.x, a.y - 40, a.porte); a.porte = null; a.etat = "pret"; }); }
    else a.etat = "pret";
  }
}
function dessinerAgent(a){
  if (a.etat === "dedans") return;
  x.fillStyle = "rgba(20,30,10,.28)"; x.beginPath(); x.ellipse(a.x, a.y, 10, 4, 0, 0, 6.3); x.fill();
  lpc(a, a.x, a.y, .75);
  if (a.porte){ const ic = ICONE[a.porte], at = AT[ic]; if (at) x.drawImage(planche, at[0], at[1], at[2], at[3], Math.round(a.x - 8), Math.round(a.y - 58), 16, 16 * at[3] / at[2]); }

}
// le pionnier, devant sa tente
const PI = {i: 0, x: (C.TENTE[0] + 1.6) * T, y: (C.TENTE[1] + 1.2) * T, dir: "b", f: 0, anim: "repos", fin: 0};

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
// sur grand écran (PC), les volets sont dans une colonne à droite (style.css) : la carte se cadre à sa gauche
const grand = matchMedia("(min-width: 900px)"), COLONNE = 384;
const margeD = () => grand.matches ? COLONNE : 0;
// zoom ; avec un point de l'écran (molette), ce point reste sous le curseur
function zoom(d, sx, sy){
  const zi = Math.max(0, Math.min(Z.length - 1, cam.zi + d)); if (zi === cam.zi) return;
  if (sx === undefined){ cam.zi = zi; return; }
  const [wx, wy] = versMonde(sx, sy); cam.zi = zi; const z = Z[zi];
  cam.x = wx - (sx - cv.clientWidth / 2) / z; cam.y = wy - (sy - cv.clientHeight / 2) / z;
}
// zoom de départ : sur PC, le plus grand qui montre toute la vallée à gauche de la colonne
function zoomDepart(){
  if (!grand.matches) return 2;
  const lw = cv.clientWidth - COLONNE, lh = cv.clientHeight; let zi = 0;
  Z.forEach((z, i) => { if (MW * z <= lw * 1.1 && MH * z <= lh * 1.1) zi = i; });
  return zi;
}
function borner(vw, vh){
  const md = margeD() / Z[cam.zi];
  cam.x = vw - md >= MW ? MW / 2 + md / 2 : Math.max(vw / 2, Math.min(MW - vw / 2 + md, cam.x));
  cam.y = vh >= MH ? MH / 2 : Math.max(vh / 2 - 60, Math.min(MH - vh / 2 + (grand.matches ? 60 : 120), cam.y));
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
/* ---------- les réserves : des tas qui suivent le stock (part = stock / place) ---------- */
/* ---------- les réserves : les morceaux des packs (bûches, rochers, sacs, paniers, tonneaux) suivent le stock (part = stock / place) ---------- */
const J_ouvert = () => window.TerresEcran && window.TerresEcran.ouvert ? window.TerresEcran.ouvert() : null;   // la bulle ouverte
const part = r => Math.max(0, Math.min(1, S.res[r] / R.capacite(S, r)));
// un tas : n morceaux au plus en pyramide, autant que la part f ; pas = écart entre deux morceaux
function tas(n, X, Y, f, max, k, px, py){
  const tot = Math.round(f * max); let i = 0;
  for (let rg = 0; i < tot; rg++) for (let c = 0; c < Math.ceil(Math.sqrt(max * 2)) - rg && i < tot; c++, i++) spr(n, X + c * px + rg * px / 2, Y - rg * py, k);
}
const buches = (X, Y, f, max) => tas("buche", X, Y, f, max || 10, .62, 15, 6);
const pierres = (X, Y, f, max) => tas("rocher-p", X, Y, f, max || 6, .5, 12, 6);
function rangee(n, X, Y, f, max, k, px){ const tot = Math.round(f * max); for (let i = 0; i < tot; i++) spr(n, X + i * px, Y, k); }
// l'aire de stockage : un abri ouvert ; bûches et pierres devant, laine et vêtements dessous
function aire(L, ouvert){
  const X = L.x * T, Y = L.y * T;
  x.fillStyle = "rgba(110,85,50,.3)"; x.fillRect(X + 2, Y + 30, 60, 32);
  x.globalAlpha = ouvert ? .35 : 1; spr("abri", X + 32, Y + 44, .68); x.globalAlpha = 1;
  rangee("sac", X + 12, Y + 42, part("laine"), 3, .3, 10); rangee("caisse-p", X + 44, Y + 42, part("vetements"), 2, .3, 10);
  buches(X + 2, Y + 62, part("bois"), 10); tas("rocher-p", X + 36, Y + 63, part("pierre"), 5, .44, 9, 5);
}
// le grenier : la grange ; quand on le touche, il devient transparent et on voit les vivres dedans (comme dans Stronghold)
function grenier(L, ouvert){
  const X = (L.x + L.l / 2) * T, Y = (L.y + L.h) * T - 2;
  x.fillStyle = "rgba(20,30,10,.25)"; x.beginPath(); x.ellipse(X, Y - 2, 32, 6, 0, 0, 6.3); x.fill();
  if (ouvert){
    x.fillStyle = "rgba(90,62,34,.85)"; x.fillRect(X - 30, Y - 40, 60, 38);   // le plancher
    rangee("sacs-grain", X - 27, Y - 26, part("ble"), 3, .4, 17); rangee("sac-farine", X - 27, Y - 12, part("farine"), 3, .36, 17);
    rangee("panier-patates", X + 6, Y - 26, part("pain"), 2, .4, 17); rangee("panier-baies", X + 6, Y - 4, part("baies"), 2, .42, 18);
    rangee("tonneau", X - 27, Y - 2, part("poisson"), 3, .36, 12);
    x.globalAlpha = .3; spr("grange", X, Y - 4, .66); x.globalAlpha = 1; return;
  }
  spr("grange", X, Y - 4, .66);
  if (part("baies") > .02) spr("panier-baies", X - 20, Y + 12, .38); if (part("poisson") > .02) spr("tonneau", X + 20, Y + 12, .34);
  if (part("ble") > .02) spr("sacs-grain", X - 2, Y + 12, .34);
}
// avant le grenier et l'aire : le stock est près du feu
function reservesDuFeu(){
  const [fx, fy] = C.FEU, X = (fx + .5) * T, Y = (fy + .5) * T;
  if (!S.bat.aire){ buches(X - 70, Y + 34, part("bois"), 6); if (S.res.pierre > 0) pierres(X - 70, Y + 48, part("pierre"), 3); }
  if (!S.bat.grenier){ if (part("baies") > .01) spr("panier-baies", X + 46, Y + 34, .4 + .2 * part("baies")); if (part("poisson") > .01) spr("tonneau", X + 68, Y + 34, .3 + .15 * part("poisson")); }
}
function batiment(b, id, t, fantome){
  const L = C.LOTS[id], X = (L.x + L.l / 2) * T, Y = (L.y + L.h) * T - 4;
  if (b === "aire"){ aire(L, J_ouvert() === id); return; }
  if (b === "grenier"){ grenier(L, J_ouvert() === id); return; }
  if (b === "champ"){ champ(L, t, id.charCodeAt(0)); return; }
  if (b === "ponton"){ ponton(L); return; }
  if (b === "carriere"){ carriere(L, true); return; }
  if (b === "bergerie"){ bergerie(L, t); return; }
  const s = spriteDe(b, id); if (!s) return;
  x.fillStyle = "rgba(20,30,10,.25)"; x.beginPath(); x.ellipse(X, Y - 2, 40 * s[1] / (s[1] < 1 ? .55 : 1), 7, 0, 0, 6.3); x.fill();
  spr(s[0], X, Y, s[1]); cheminee(s[0], X, Y, s[1]);
  if (!fantome && (b === "cabane" || b === "maison")) fumee(s[0], X, Y, s[1], t);
  if (!fantome && b === "four" && S.jobs.boulanger) fumee("four", X, Y, s[1], t, true);
}
function chantier(c, id, t, barre){
  const L = C.LOTS[id], X = (L.x + L.l / 2) * T, Y = (L.y + L.h) * T - 6, tot = DON.BATIMENTS[c.k].travail, u = 1 - c.reste / tot;
  if (c.k === "champ"){ x.fillStyle = "rgba(110,80,40,.6)"; x.fillRect(L.x * T + 6, L.y * T + 6, (L.l * T - 12) * u, L.h * T - 12); }
  else if (c.k === "ponton"){ x.globalAlpha = .4 + .6 * u; ponton(L); x.globalAlpha = 1; }
  else if (!barre) spr("chantier", X, Y, .5);
  x.fillStyle = "#2a1608"; x.fillRect(X - 22, Y + 1, 44, 6); x.fillStyle = "#ffd94a"; x.fillRect(X - 21, Y + 2, 42 * u, 4);
  if (Math.sin(t * 9) > .6){ x.fillStyle = "#fff6c8"; x.fillRect(X - 10 + (t * 37 % 20), Y - 30 - (t * 53 % 14), 2, 2); }
}

/* ---------- une image ---------- */
let dernier = 0, vuLe = Date.now();
function image(now){
  requestAnimationFrame(image);
  const t = now / 1000, dt = Math.min(.25, Math.max(0, t - dernier)); dernier = t;
  if (!S) return;
  if (fleches.size && !document.querySelector(".ecran:not([hidden])")){   // flèches ou ZQSD/WASD : la carte glisse
    const v = 520 * dt / Z[cam.zi];
    for (const k of fleches){ const d = DIRS[k]; cam.x += d[0] * v; cam.y += d[1] * v; }
  }
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
  for (let y = 0; y < C.H; y++) for (let xx = 0; xx < C.W; xx++) if (C.GRILLE[y][xx] === "*") L.push([(y + .95) * T, () => buissonBaies(xx, y, t)]);
  for (const id in C.LOTS){ const Lo = C.LOTS[id];
    if (Lo.terrain === "roche" && S.lots[id] !== "carriere") for (const [a, b2, k] of ROCHERS) L.push([Lo.y * T + b2, () => spr("rocher", Lo.x * T + a, Lo.y * T + b2, k)]);
    if (enCours[id] && enCours[id].agrandit) L.push([(Lo.y + Lo.h) * T, () => { batiment(S.lots[id], id, t); chantier(enCours[id], id, t, true); }]);
    else if (enCours[id]) L.push([(Lo.y + Lo.h) * T, () => chantier(enCours[id], id, t)]);
    else if (S.lots[id] && !["champ", "ponton"].includes(S.lots[id])) L.push([(Lo.y + Lo.h) * T - 2, () => batiment(S.lots[id], id, t)]);
  }
  const [fx, fy] = C.FEU, [tx, ty] = C.TENTE;
  if (S.statut < 1) L.push([(ty + .9) * T, () => tente((tx + .5) * T, (ty + .9) * T)]);   // au hameau, le pionnier a son toit
  L.push([(fy + .75) * T, () => feuDeCamp((fx + .5) * T, (fy + .75) * T, t)]);
  L.push([(fy + 1.4) * T, reservesDuFeu]);
  for (const d of DECOR) if (vis(d.X, d.Y, 60)) L.push([d.Y, () => spr(d.n, d.X, d.Y, d.k)]);
  if (PUITS) L.push([PUITS[1], () => spr(S.statut >= 2 ? "fontaine" : "puits", PUITS[0], PUITS[1], S.statut >= 2 ? .8 : .7)]);
  for (const a of AG){ bouger(a, dt); L.push([a.y, () => dessinerAgent(a)]); }
  PI.f += dt * 8; if (PI.anim === "travail" && t > PI.fin) PI.anim = "repos";
  if (!S.pop) L.push([PI.y, () => dessinerAgent(PI)]);
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
  if (e.pointerType === "mouse") survol(e.clientX, e.clientY, doigts.size > 0 && bouge > 8);
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
// molette (un cran à la fois, même avec un pavé tactile qui envoie beaucoup de petits pas), centrée sur le curseur
let molette = 0;
cv.addEventListener("wheel", e => { e.preventDefault(); const t = performance.now(); if (t - molette < 140 || !e.deltaY) return; molette = t; zoom(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY); }, {passive: false});
cv.addEventListener("pointerleave", () => { info.hidden = true; });

/* ---------- la souris (PC) : main sur ce qui se touche, étiquette qui suit le curseur ---------- */
const info = document.getElementById("info");
function survol(sx, sy, tire){
  let txt = null;
  if (!tire && S){
    const [wx, wy] = versMonde(sx, sy), id = lotEn(wx, wy);
    if (PL) txt = id && lotsPossibles().includes(id) ? (id === PL.lot ? "TERRAIN CHOISI" : "CHOISIR CE TERRAIN") : null;
    else if (id && S.lots[id]) txt = DON.BATIMENTS[S.lots[id]].nom + (S.chantiers.some(c => c.lot === id) ? " · CHANTIER" : "");
    else { const r = recolte(Math.floor(wx / T), Math.floor(wy / T)); if (r) txt = DON.RES[r].nom + " +" + DON.PIONNIER.toucher; }
  }
  cv.style.cursor = tire ? "grabbing" : txt ? "pointer" : "grab";
  info.hidden = !txt; if (!txt) return;
  info.textContent = txt; info.style.left = sx + 14 + "px"; info.style.top = sy + 16 + "px";
}

/* ---------- le clavier (PC) : la carte glisse avec les flèches ou ZQSD/WASD (touches physiques), + et − zooment ---------- */
const DIRS = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1], KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, -1], KeyS: [0, 1]};
const fleches = new Set();
addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (DIRS[e.code]){ fleches.add(e.code); e.preventDefault(); info.hidden = true; }
  else if (e.key === "+" || e.key === "=" || e.code === "NumpadAdd") zoom(1);
  else if (e.key === "-" || e.code === "NumpadSubtract") zoom(-1);
});
addEventListener("keyup", e => fleches.delete(e.code));
addEventListener("blur", () => fleches.clear());
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
// ce que le pionnier récolte en touchant cette case (ou une voisine) : forêt, buisson, eau
function recolte(tx, ty){
  const quoi = {T: "bois", "*": "baies", "~": "poisson"};
  let r = quoi[C.case_(tx, ty)];
  if (!r) for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if ((r = quoi[C.case_(tx + dx, ty + dy)])) break;
  return r || null;
}
function toucherCase(tx, ty, wx, wy){
  const r = recolte(tx, ty);
  if (!r) return null;
  if (R.toucher(S, r)) return null;
  flotte(wx === undefined ? (tx + .5) * T : wx, wy === undefined ? ty * T : wy - 8, r, "+" + DON.PIONNIER.toucher);
  if (!S.pop && r !== "baies"){ PI.anim = "travail"; PI.outil = r === "poisson" ? "canne" : "hache"; PI.f = 0; PI.fin = dernier + (r === "poisson" ? .8 : .45); PI.dir = (tx + .5) * T < PI.x ? "g" : "d"; }
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
  vuLe = Date.now(); cam.zi = zoomDepart();
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

function nouvelle(){ S = R.creer(); AG.length = 0; cleFond = ""; PL = null; sauver(); cam.x = (C.FEU[0] + .5) * T; cam.y = (C.FEU[1] + 1.5) * T; cam.zi = zoomDepart(); }
function viser(id){ const L = C.LOTS[id]; cam.x = (L.x + L.l / 2) * T + margeD() / 2 / Z[cam.zi]; cam.y = (L.y + L.h / 2) * T + (grand.matches ? 0 : 40); }
window.Terres = {
  get S(){ return S; }, rang, cam, zoom, sauver, nouvelle, icone, piece, spriteDe, AT, viser, versEcran,
  get PL(){ return PL; }, set PL(v){ PL = v; },
  avance(s){ R.pas(S, s); }, toucherCase, AG, flotte
};
})();

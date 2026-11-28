/* Armateur des étoiles : la carte (rendu 2D, caméra, zoom). Le monde est en cercles (voir regles.js) ; la vue les aplatit (tilt).
   Écran = centre + (position du monde − caméra) × échelle (en y : × tilt). Les vaisseaux sont de petits points, puis des sprites Relief au zoom. */
(function () {
const F = window.Flotte = window.Flotte || {};
const R = F.R, Mo = F.Monde;
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const THEMES = {
  bleue:    { nom: "Nuit bleue", bg: ["#091330", "#0a2147"], lane: "rgba(150,190,255,.34)", lab: "#a9c0f0", sub: "#6f86b8", ring: "rgba(150,190,255,.26)", ac: "#f0a830", pb: "rgba(150,190,255,.3)", pf: "#b9c9ee", pd: "#7f93c4" },
  violette: { nom: "Violette", bg: ["#190a2c", "#2b1049"], glow: "rgba(240,150,60,.13)", lane: "rgba(215,170,255,.34)", lab: "#d3b6f7", sub: "#8f77b8", ring: "rgba(215,170,255,.24)", ac: "#f0a830", pb: "rgba(215,170,255,.3)", pf: "#d9c4f5", pd: "#9b84c2" },
  verte:    { nom: "Phosphore", bg: ["#030f08", "#06180e"], lane: "rgba(70,255,150,.36)", lab: "#5fe89a", sub: "#3b9e68", ring: "rgba(70,255,150,.26)", ac: "#37f08c", pb: "rgba(70,255,150,.4)", pf: "#7cf0ae", pd: "#3fa56e" }
};
const TEINTES_M = ["#f4b860", "#e8944a", "#f0d070", "#d98a5b"], TEINTES_T = ["#8fe3d0", "#a6d8f5", "#c5b8f0", "#9fe0a8"];
const LONGUEUR = { m: 10, t: 12, p: 9, x: 11 };       // longueur d'un sprite à 100 % de zoom (px, échelle 1)
const SEUIL_SPRITE = 1.15, ZOOM_MIN = .6, ZOOM_MAX = 3.2;

const IMG = {}, IMGV = {};
// Teintes décalées (degrés) : quatre variantes par rôle, pour que la flotte ne soit pas uniforme (navigateurs sans ctx.filter : une seule teinte)
const VARIANTES = { m: [0, 22, -18, 40], t: [0, 35, -25, 70], p: [0, 18, -14, 30], x: [0, -12, 12, 25] };
function variantes() {
  if (!("filter" in document.createElement("canvas").getContext("2d"))) return;
  for (const k of Object.keys(IMG)) {
    const im = IMG[k]; if (!im.width) continue;
    IMGV[k] = VARIANTES[k].map(deg => { if (!deg) return im; const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; const g = c.getContext("2d"); g.filter = "hue-rotate(" + deg + "deg)"; g.drawImage(im, 0, 0); g.filter = "none"; return c; });
  }
}
// Lueurs de réacteur : un dégradé dessiné une fois (bleu pour la flotte, rose pour les pirates), puis simplement agrandi
const LUEUR = {};
function lueur(rose) {
  const k = rose ? 1 : 0; if (LUEUR[k]) return LUEUR[k];
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rose ? "rgba(255,140,200,.9)" : "rgba(170,215,255,.9)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return LUEUR[k] = c;
}
function charger() {
  return Promise.all(Object.keys(F.SPRITES).map(k => new Promise(ok => { const i = new Image(); i.onload = i.onerror = ok; i.src = F.SPRITES[k].src; IMG[k] = i; }))).then(variantes);
}

function creerVue() { return { W: 0, H: 0, dpr: 1, z: 1, px: 0, py: 0, cam: R.ZONES[0].cam, sel: null, seuil: 1.15, ms: 0, theme: "bleue", pops: [], booms: [], bg: null, etoiles: [], tilt: .62, u0: 1, cx0: 0, cy0: 0, sc: 1, ue: 1 }; }

// Dimensions de la fenêtre : recalcule la géométrie et le fond (cache)
function taille(V, cv, W, H) {
  V.dpr = Math.min(window.devicePixelRatio || 1, 2); V.W = W; V.H = H;
  cv.width = Math.round(W * V.dpr); cv.height = Math.round(H * V.dpr); cv.style.width = W + "px"; cv.style.height = H + "px";
  V.tilt = clamp(.62 + (H / W - .5625) * .2, .62, .92);
  V.u0 = Math.min(.46 * W, .46 * H / V.tilt);
  V.cx0 = W / 2; V.cy0 = H > W ? H * .46 : H / 2;
  V.sc = clamp(Math.min(W, H) / (H > W ? 300 : 380), .9, 1.8);
  V.etoiles = Array.from({ length: Math.round(W * H / 1800) }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .3 + Math.random() * .6, f: Math.random() * TAU }));
  fond(V);
}
function fond(V) {
  const T = THEMES[V.theme], c = document.createElement("canvas"); c.width = V.W; c.height = V.H;
  const g = c.getContext("2d"), l = g.createLinearGradient(0, 0, 0, V.H); l.addColorStop(0, T.bg[0]); l.addColorStop(1, T.bg[1]); g.fillStyle = l; g.fillRect(0, 0, V.W, V.H);
  if (T.glow) { const r = g.createRadialGradient(V.W, V.H * .2, 0, V.W, V.H * .2, V.W * .6); r.addColorStop(0, T.glow); r.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = r; g.fillRect(0, 0, V.W, V.H); }
  const v = g.createRadialGradient(V.W / 2, V.H / 2, Math.min(V.W, V.H) * .3, V.W / 2, V.H / 2, Math.max(V.W, V.H) * .75); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.35)"); g.fillStyle = v; g.fillRect(0, 0, V.W, V.H);
  V.bg = c;
}
function theme(V, nom) { if (!THEMES[nom]) nom = "bleue"; V.theme = nom; if (V.W) fond(V); const T = THEMES[nom], s = document.documentElement.style; for (const k of ["ac", "pb", "pf", "pd"]) s.setProperty("--" + k, T[k]); }

const ecran = (V, x, y) => [V.cx0 + (x - V.px) * V.ue, V.cy0 + (y - V.py) * V.ue * V.tilt];

// Un pas de caméra : échelle de la zone, suivi du navire choisi, chiffres qui s'envolent
function avancer(E, V, dt) {
  V.cam += (R.ZONES[E.lv].cam - V.cam) * Math.min(1, dt * 1.1);
  V.ue = V.u0 / V.cam * V.z;
  const cible = V.sel && E.ships.includes(V.sel) ? V.sel : null;
  const tx = cible ? cible.x : 0, ty = cible ? cible.y : 0;
  V.px += (tx - V.px) * Math.min(1, dt * 3); V.py += (ty - V.py) * Math.min(1, dt * 3);
  for (const e of E.evt) { if (e.kind === "boom") V.booms.push({ x: e.x, y: e.y, vie: 1 }); else if (e.kind === "alerte" || e.kind === "tir") continue; else V.pops.push({ x: e.x, y: e.y, n: e.n, col: e.col, perte: e.kind === "perte", vie: 1 }); }
  E.evt.length = 0;
  for (const o of V.pops) o.vie -= dt * .7;
  for (const o of V.booms) o.vie -= dt * 1.4;
  if (V.booms.length) V.booms = V.booms.filter(o => o.vie > 0);
  if (V.pops.length) V.pops = V.pops.filter(o => o.vie > 0);
  if (V.pops.length > 120) V.pops.splice(0, V.pops.length - 120);
}

function zoomer(V, facteur) { V.z = clamp(V.z * facteur, ZOOM_MIN, ZOOM_MAX); }

// Navire le plus proche d'un point de l'écran (px CSS), ou null
function choisir(E, V, mx, my) {
  let best = null, bd = 18 * V.sc;
  for (const sh of E.ships) { const [x, y] = ecran(V, sh.x, sh.y), d = Math.hypot(x - mx, y - my); if (d < bd) { bd = d; best = sh; } }
  return best;
}

function dessiner(c, E, V) {
  const T = THEMES[V.theme], sc = V.sc, t = E.t;
  c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);
  c.drawImage(V.bg, 0, 0, V.W, V.H);
  for (const st of V.etoiles) { c.fillStyle = "rgba(255,255,255," + (.2 + .25 * Math.sin(t * .6 + st.f)) + ")"; c.fillRect(st.x, st.y, st.r * 1.2, st.r * 1.2); }
  const [sx0, sy0] = ecran(V, 0, 0), ue = V.ue, til = V.tilt;
  const vis = b => b.lv === 0 ? 1 : clamp((t - b.t0) / 2.5, 0, 1);
  const fs = Math.round(7.5 * Math.max(1, sc));
  // anneaux de portée (le suivant en plus pâle)
  c.lineWidth = .8; c.setLineDash([4, 6]); c.strokeStyle = T.ring;
  for (let l = 0; l <= Math.min(R.ZONES.length - 1, E.lv + 1); l++) { c.globalAlpha = l <= E.lv ? 1 : .45; c.beginPath(); c.ellipse(sx0, sy0, R.ZONES[l].anneau * ue, R.ZONES[l].anneau * ue * til, 0, 0, TAU); c.stroke(); }
  c.globalAlpha = 1; c.setLineDash([]);
  c.font = Math.round(7 * Math.max(1, sc)) + 'px "Share Tech Mono", monospace'; c.fillStyle = T.sub; c.textAlign = "left";
  for (let l = 0; l <= E.lv; l++) c.fillText("ZONE " + (l + 1), sx0 + R.ZONES[l].anneau * ue * .72 + 2, sy0 - R.ZONES[l].anneau * ue * til * .72 - 2);
  // routes pointillées : astéroïde → avant-poste, avant-poste → marché
  const relais = Mo.relaisOuverts(E.M, E.lv);
  c.setLineDash([1.5, 4.5]); c.lineWidth = .9; c.strokeStyle = T.lane;
  for (const m of Mo.mines(E.M, E.lv)) { const h = Mo.plusProche(relais, m.x, m.y), a = ecran(V, m.x, m.y), b = ecran(V, h.x, h.y); c.globalAlpha = vis(m); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  for (const h of relais) { const a = ecran(V, h.x, h.y), b = ecran(V, E.M.prime.x, E.M.prime.y); c.globalAlpha = vis(h); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
  c.globalAlpha = 1; c.setLineDash([]);
  // le soleil
  c.fillStyle = "rgba(255,226,150,.9)"; c.beginPath(); c.arc(sx0, sy0, Math.max(2, 2.2 * sc * clamp(V.z, .8, 1.8)), 0, TAU); c.fill();
  // les corps
  for (const b of E.M.tous) {
    if (!Mo.ouvert(b, E.lv)) continue;
    const [x, y] = ecran(V, b.x, b.y), r = Math.max(1.6, b.r * sc * clamp(V.z, .8, 1.8));
    c.globalAlpha = vis(b);
    if (b.anneaux) { c.strokeStyle = "rgba(240,215,170,.55)"; c.lineWidth = .8; c.beginPath(); c.ellipse(x, y, r * 2, r * .55, -.35, 0, TAU); c.stroke(); }
    if (b.relais && !b.qg) { c.strokeStyle = T.lab; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r * 1.3, 0, TAU); c.stroke(); c.fillStyle = T.lab; c.beginPath(); c.arc(x, y, r * .5, 0, TAU); c.fill(); }
    else { c.fillStyle = b.qg ? "#ffd23a" : b.col; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    if (b.mine) { c.fillStyle = R.ORE[b.ore].c; c.beginPath(); c.arc(x + r * .4, y - r * .3, Math.max(.8, r * .38), 0, TAU); c.fill(); }
    if (b.qg) { c.strokeStyle = "rgba(255,210,60,.5)"; c.lineWidth = .8; c.beginPath(); c.arc(x, y, r * 2.2 + Math.sin(t * 2) * .8, 0, TAU); c.stroke(); }
    c.font = fs + 'px "Share Tech Mono", monospace'; c.fillStyle = b.qg ? "#ffe38a" : T.lab; c.textAlign = "left";
    c.fillText(b.qg ? b.n + " niv. " + (E.lv + 1) : b.n, x + r + 4, y + fs * .35);
    if (b.sub && (V.z >= .9 || b.relais)) { c.fillStyle = T.sub; c.font = Math.round(fs * .9) + 'px "Share Tech Mono", monospace'; c.fillText(b.sub, x + r + 4, y + fs * 1.4); }
    c.globalAlpha = 1;
  }
  // faisceaux de forage et traînées
  for (const sh of E.ships) {
    if (sh.type === "m" && sh.etat === "attente" && sh.a.mine) {
      const [x, y] = ecran(V, sh.x, sh.y), [mx, my] = ecran(V, sh.a.x, sh.a.y), pu = .5 + .5 * Math.sin(t * 9 + sh.id);
      c.strokeStyle = R.ORE[sh.a.ore].c; c.globalAlpha = .25 + .35 * pu; c.lineWidth = .7; c.beginPath(); c.moveTo(x, y); c.lineTo(mx, my); c.stroke(); c.globalAlpha = 1;
    }
    if (sh.etat === "vol" && sh.trace.length > 1) {
      const t0 = ecran(V, sh.trace[0][0], sh.trace[0][1]); if (t0[0] < -60 || t0[1] < -60 || t0[0] > V.W + 60 || t0[1] > V.H + 60) continue;
      c.lineWidth = .8;
      if (E.ships.length > 120) {                                            // grande flotte : un seul tracé, plus léger
        c.strokeStyle = "rgba(255,255,255,.12)"; c.beginPath(); c.moveTo(t0[0], t0[1]);
        for (let i = 1; i < sh.trace.length; i++) { const b = ecran(V, sh.trace[i][0], sh.trace[i][1]); c.lineTo(b[0], b[1]); }
        c.stroke();
      } else for (let i = 1; i < sh.trace.length; i++) { const a = ecran(V, sh.trace[i - 1][0], sh.trace[i - 1][1]), b = ecran(V, sh.trace[i][0], sh.trace[i][1]); c.strokeStyle = "rgba(255,255,255," + (i / sh.trace.length * .22) + ")"; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    }
  }
  for (const sh of E.ships) navire(c, V, sh, t);
  // patrouilles (elles gardent un avant-poste), tirs, pirates
  for (const q of E.patrouilles) {
    if (q.tir > 0 && q.cible) { const a = ecran(V, q.x, q.y), b = ecran(V, q.cible.x, q.cible.y); c.strokeStyle = "rgba(150,190,255," + Math.min(1, q.tir) + ")"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    navire(c, V, { type: "p", id: 0, x: q.x, y: q.y, ang: q.ang, etat: "vol" }, t);
  }
  for (const p of E.pirates) {
    const [x, y] = ecran(V, p.x, p.y);
    c.strokeStyle = "rgba(255,90,110,.65)"; c.lineWidth = .9; c.setLineDash([2, 3]); c.beginPath(); c.arc(x, y, 9 * sc, t * .8, t * .8 + TAU); c.stroke(); c.setLineDash([]);
    navire(c, V, { type: "x", id: 1, x: p.x, y: p.y, ang: p.ang, etat: "vol" }, t);
    if (V.z >= .9) { c.font = Math.round(7 * Math.max(1, sc)) + 'px "Share Tech Mono", monospace'; c.fillStyle = "rgba(255,120,140,.9)"; c.textAlign = "center"; c.fillText("HOSTILE", x, y - 13 * sc); }
  }
  c.globalCompositeOperation = "lighter";
  for (const o of V.booms) { const [x, y] = ecran(V, o.x, o.y), r = (1 - o.vie) * 26 * sc + 4, g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(255,200,140," + o.vie * .9 + ")"); g.addColorStop(1, "rgba(255,90,60,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  c.globalCompositeOperation = "source-over";
  if (V.sel && E.ships.includes(V.sel)) { const [x, y] = ecran(V, V.sel.x, V.sel.y); c.strokeStyle = "#5dffa6"; c.lineWidth = 1; c.setLineDash([2, 2.5]); c.beginPath(); c.arc(x, y, 9 * sc, t, t + TAU); c.stroke(); c.setLineDash([]); }
  c.font = "600 " + Math.round(8.5 * Math.max(1, sc)) + 'px "Share Tech Mono", monospace'; c.textAlign = "center";
  for (const o of V.pops) { const [x, y] = ecran(V, o.x, o.y); c.globalAlpha = Math.max(0, o.vie); c.fillStyle = o.perte ? "#ff9eb0" : (o.col || "#e1fff5"); c.fillText((o.perte ? "−" : "+") + o.n, x, y - (1 - o.vie) * 12); c.globalAlpha = 1; }
}

function navire(c, V, sh, t) {
  const [x, y] = ecran(V, sh.x, sh.y), sc = V.sc;
  if (x < -40 || y < -40 || x > V.W + 40 || y > V.H + 40) return;
  const ang = Math.atan2(Math.sin(sh.ang) * V.tilt, Math.cos(sh.ang));      // cap à l'écran (la vue aplatit)
  if (V.z >= V.seuil && IMG[sh.type] && IMG[sh.type].complete) { sprite(c, sh.type, x, y, ang, LONGUEUR[sh.type] * sc * clamp(V.z, .8, 2.6), t, sh.id, sh.etat === "vol", V.dpr); c.setTransform(V.dpr, 0, 0, V.dpr, 0, 0); return; }
  c.save(); c.translate(x, y); c.rotate(ang);
  const q = sc * (sh.type === "t" ? 1.1 : 1);
  c.fillStyle = sh.type === "m" ? TEINTES_M[sh.id % 4] : sh.type === "t" ? TEINTES_T[sh.id % 4] : sh.type === "p" ? "#8ab4ff" : "#ff5a6e";
  if (sh.type === "t") c.fillRect(-2.6 * q, -1 * q, 5.2 * q, 2 * q);
  else if (sh.type === "x") { c.beginPath(); c.moveTo(3 * q, 0); c.lineTo(0, 2.4 * q); c.lineTo(-3 * q, 0); c.lineTo(0, -2.4 * q); c.closePath(); c.fill(); }
  else { c.beginPath(); c.moveTo(3.2 * q, 0); c.lineTo(-2.4 * q, -2 * q); c.lineTo(-2.4 * q, 2 * q); c.closePath(); c.fill(); }
  c.restore();
}

// Sprite Relief (le vaisseau regarde vers le haut dans l'image), avec la lueur de ses réacteurs en vol
function sprite(g, type, x, y, ang, len, t, id, vol, dpr) {
  const v = F.SPRITES[type], im = (IMGV[type] && IMGV[type][id % 4]) || IMG[type], k = len / v.h, fl = .75 + .25 * Math.sin(t * 28 + id * 3);
  const a = ang + Math.PI / 2, co = Math.cos(a) * dpr, si = Math.sin(a) * dpr;
  g.setTransform(co, si, -si, co, x * dpr, y * dpr);                    // plus léger que save / translate / rotate / restore
  if (vol) {
    g.globalCompositeOperation = "lighter";
    const L = lueur(type === "x");
    for (const m of v.moteurs) { const gx = (m[0] - v.w / 2) * k, gy = (m[1] - v.h / 2) * k, r = m[2] * k * 2.6 * fl; g.drawImage(L, gx - r, gy - r, r * 2, r * 2); }
    g.globalCompositeOperation = "source-over";
  }
  g.drawImage(im, -v.w * k / 2, -v.h * k / 2, v.w * k, v.h * k);
}

F.Carte = { rafraichir: variantes, THEMES, SEUIL_SPRITE, ZOOM_MIN, ZOOM_MAX, charger, creerVue, taille, theme, ecran, avancer, zoomer, choisir, dessiner, sprite };
})();

/* Bastion, le laboratoire. Dessin, commandes au doigt, panneau LABO (vitesse, triches, robot, réglages, journal).
   Les règles sont dans regles.js (window.BastionRegles) ; les images dans img/ (Tiny Swords, voir la page des crédits). */
(() => {
"use strict";
const B = window.BastionRegles;
const {W, H, CARTE, CHATEAU, DEPOT, CHEMINS, ESC, BAT, FEMININ, DEBLOQUE, GARNISON, GRADES, RES, TOURS, UNIQUE, AMELIORABLE, PROMO, VILLAGE} = B;
const CS = 128, M = 3;                       // une case = 2 × 2 tuiles de 64 px ; M = bord de forêt autour de la carte
const IMG_DOSSIER = "img/";
const $ = s => document.querySelector(s);
const cv = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

/* ---------- sauvegardes ---------- */
const lire = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
let MODS = lire("bastion.labo", {}) || {};   // réglages du labo (écarts avec les valeurs d'origine)

/* ---------- les images ---------- */
const NOMS = ["tm", "sable", "buisson", "rocher", "poussiere", "feu", "fleche", "soin", "os", "chateau", "caserne", "archerie", "maison1", "maison2", "monastere", "tour",
  "atelier", "pierre", "explosion", "chantier", "ruine", "tourbois", "tourbois-chantier", "tm-village", "ic-fleche-verte", "ic-bouclier", "mouton-marche", "mouton-broute", "arbre1", "arbre2", "arbre3", "arbre4", "souche1", "souche2", "filon3", "filon4", "filon5"];
for (const o of ["hache", "hache-coupe", "bois", "pioche", "pioche-tape", "or", "couteau", "couteau-coupe", "viande", "marteau", "marteau-tape", "repos"]) NOMS.push("ouvrier-" + o);
for (const u of ["guer", "arc", "lance", "moine", "cata", "cav", "epee", "gob", "lanceg", "gnoll", "troll"]) for (const a of ["repos", "marche", "coup"]) NOMS.push(u + "-" + a);
const L = {};
const charge = n => new Promise(ok => { const i = new Image(); i.onload = () => { L[n] = i; ok(); }; i.onerror = () => ok(); i.src = IMG_DOSSIER + n + ".png"; });
const strip = (im, fs) => im._s || (im._s = Array.from({length: Math.max(1, Math.round(im.width / fs))}, (_, i) => { const c = cv(fs, im.height); c.getContext("2d").drawImage(im, i * fs, 0, fs, im.height, 0, 0, fs, im.height); return c; }));
const f8 = (im, fs, n) => { const s = strip(im, fs); return s[((Math.floor(n) % s.length) + s.length) % s.length]; };
const auto = (n, s, w, e) => [w ? (e ? 1 : 2) : (e ? 0 : 3), n ? (s ? 1 : 2) : (s ? 0 : 3)];
// figurines : taille d'une case de la bande, pieds, échelle ; animations repos, marche, coup
const FIG = {
  guer: {fs: 192, fx: 96, fy: 135, k: .8}, arc: {fs: 192, fx: 93, fy: 134, k: .8}, lance: {fs: 320, fx: 150, fy: 196, k: .8}, moine: {fs: 192, fx: 96, fy: 132, k: .8}, cata: {fs: 256, fx: 128, fy: 200, k: .62}, cav: {fs: 320, fx: 160, fy: 218, k: .62}, epee: {fs: 320, fx: 160, fy: 203, k: .66},
  gob: {fs: 192, fx: 80, fy: 133, k: .8}, lanceg: {fs: 256, fx: 125, fy: 171, k: .7}, gnoll: {fs: 192, fx: 97, fy: 135, k: .8}, troll: {fs: 384, fx: 195, fy: 297, k: .62}};
const OUV = {fs: 192, fx: 96, fy: 135, k: .72};
// bâtiments : image et pieds (bas de l'image utile)
const BATI = {chateau: ["chateau", 246], caserne: ["caserne", 240], archerie: ["archerie", 236], maison: ["maison1", 172], monastere: ["monastere", 304], atelier: ["atelier", 174], tour: ["tour", 226], tourbois: ["tourbois", 171], chantier: ["chantier", 180], ruine: ["ruine", 164]};
const ECH_TOUR = 1.5;    // la tour est dessinée 1,5 fois plus grande : ses occupants à taille normale sur la plateforme
// les tours : échelle du dessin, centre de la plateforme dans l'image (pixels), largeur d'une case de la bande animée
const TOUR = {tour: {ech: 1.5, px: 64, py: 95, fs: 0}, tourbois: {ech: 1.3, px: 128, py: 48, fs: 256}};
const HAUT = {maison: 1.4, caserne: 1.9, archerie: 1.9, monastere: 2.4, atelier: 1.4, tour: 2.7, tourbois: 2.0};   // hauteur de l'image, en cases (toucher, transparence)
const EFFET = {maison: "+1 escouade, +2 ouvriers", caserne: "debloque les chevaliers", archerie: "debloque les archers", monastere: "debloque les moines", atelier: "debloque les catapultes", tour: "garnison : archers, moines ou catapulte", tourbois: "moins chere, plus fragile, porte moins loin"};

/* ---------- la page ---------- */
const c = $("#cv"), x = c.getContext("2d");
const hud = $("#hud"), ban = $("#banniere");
let S = null, bg = null, VW = 6 * CS, camX = 0, camY = 0, pret = false, loin = false;
let vitesse = 1, ralentiOn = true, robotOn = false, choixSite = null, pause = true;
const WW = (W * 2 + M * 2) * 64, WH = (H * 2 + M * 2) * 64;
const P = (gx, gy) => [M * 64 + gx * CS, M * 64 + gy * CS];
const clamp = () => { camX = Math.max(-c.width * .1, Math.min(WW - c.width * .9, camX)); camY = Math.max(-c.height * .1, Math.min(WH - c.height * .55, camY)); };
// largeur de la vue (pixels du monde) : sur téléphone 6 cases ; sur un grand écran, la même taille de figurines (environ 2 pixels du monde par pixel d'écran),
// sans dépasser la carte ; « loin » = toute la carte
const vueProche = () => Math.max(6 * CS, Math.min((W + 2) * CS, innerWidth * 1.9));
function taille(){
  VW = loin ? Math.max((W + 1.5) * CS, vueProche()) : vueProche();
  const w = innerWidth, h = innerHeight; c.width = Math.round(VW); c.height = Math.round(h * c.width / w); x.imageSmoothingEnabled = false;
  const [X, Y] = P(5.5, 7.6); camX = X - c.width / 2; camY = Y - c.height * .45; clamp();
}
addEventListener("resize", taille);
// Android peut vider les petites toiles préparées quand on change d'appli : on les refait au retour (leçon de Doggy Saga)
const viderToiles = () => { for (const k in L) delete L[k]._s; if (pret) fond(); };
document.addEventListener("visibilitychange", () => { if (!document.hidden) viderToiles(); });
addEventListener("pageshow", viderToiles);
const ic = k => `<img class="ic" src="${IMG_DOSSIER}ic-${k}.png" alt="">`;
// un texte d'une ligne qui ne tient pas dans sa boîte : on réduit sa taille jusqu'à ce qu'il tienne
function ajuster(el, min = 5){ el.style.fontSize = ""; let f = parseFloat(getComputedStyle(el).fontSize); while (el.scrollWidth > el.clientWidth + 1 && f > min){ f -= .5; el.style.fontSize = f + "px"; } }
const prix = o => RES.filter(r => o[r]).map(r => o[r] + ic(r)).join(" ") || "GRATUIT";
function dire(t, bon){ ban.textContent = t; ban.classList.toggle("bon", !!bon); ban.classList.add("on"); clearTimeout(ban._t); ban._t = setTimeout(() => ban.classList.remove("on"), 2400); }

/* ---------- le bandeau du bas ---------- */
function construirePanneau(){
  $("#jobs").innerHTML = ["bois", "or", "viande"].map(j => `<button type="button" data-j="${j}">${ic(j)}<b>0</b></button>`).join("")
    + `<button type="button" data-j="bati">${ic("marteau")}<b>0</b></button><button type="button" class="plus" data-j="plus">+1<span class="cout"></span><span class="max" hidden>MAX</span></button>`;
  $("#cartes").innerHTML = B.RECRUTABLES.map(k => `<button type="button" data-e="${k}"><img class="av" src="${IMG_DOSSIER}av-${k}.png" alt=""><b>${ESC[k]}</b><span class="cout"></span><span class="verrou"></span></button>`).join("");
}
construirePanneau();
function maj(){
  if (!S) return;
  for (const r of RES) $("#r-" + r).textContent = Math.floor(S.res[r]);
  const nb = j => S.pawns.filter(p => p.job === j).length;
  document.querySelectorAll("#jobs [data-j]").forEach(b => { const j = b.dataset.j; if (j !== "plus") b.querySelector("b").textContent = nb(j); });
  const plus = $("#jobs .plus"); plus.querySelector(".cout").innerHTML = S.P.eco.ouvrier + ic("viande");
  plus.classList.toggle("cher", S.pawns.length >= B.maxOuv(S) || S.res.viande < S.P.eco.ouvrier);
  const pleinO = S.pawns.length >= B.maxOuv(S), pleinE = B.nbEsc(S) >= B.maxEsc(S);
  $("#popOuv").textContent = S.pawns.length + "/" + B.maxOuv(S); $("#popOuv").classList.toggle("plein", pleinO);
  $("#popEsc").textContent = B.nbEsc(S) + "/" + B.maxEsc(S); $("#popEsc").classList.toggle("plein", pleinE);
  plus.querySelector(".max").hidden = !pleinO;
  document.querySelectorAll("#cartes button").forEach(b => { const k = b.dataset.e, ok = B.debloque(S, k);
    b.querySelector(".cout").innerHTML = prix(B.cout(S, k)); const v = b.querySelector(".verrou"), t = !ok ? BAT[DEBLOQUE[k]] : pleinE ? "POPULATION MAX" : "";
    if (v.textContent !== t){ v.textContent = t; ajuster(v); }
    b.classList.toggle("ferme", !ok); b.classList.toggle("cher", ok && (!B.peutPayer(S, B.cout(S, k)) || B.nbEsc(S) >= B.maxEsc(S))); });
  const V = S.P.vagues;
  $("#vague").textContent = S.vague < V.nombre ? `VAGUE ${S.vague}/${V.nombre} · ${Math.max(0, Math.ceil(S.prochaine - S.t))} S` : `VAGUE ${V.nombre}/${V.nombre}`;
  $("#pvc i").style.width = Math.max(0, S.pv / B.pvChateau(S) * 100) + "%";
  const tn = $("#tenir"); tn.hidden = !(S.sel && !S.sel.tour && S.sel.k !== "cata"); if (!tn.hidden) tn.textContent = "TENIR LA POSITION : " + (S.sel.tenir ? "OUI" : "NON");
  tn.classList.toggle("or", !!(S.sel && S.sel.tenir));
  const pr = $("#promo"), q0 = S.sel; pr.hidden = !(q0 && PROMO[q0.k]);
  if (!pr.hidden){ const k2 = PROMO[q0.k]; pr.innerHTML = `PROMOUVOIR : ${ESC[k2]} ${prix(B.cout(S, k2))}`; pr.classList.toggle("cher", !B.peutPromouvoir(S, q0) || !B.peutPayer(S, B.cout(S, k2))); }
  $("#vit").textContent = vitesse === 0 ? "PAUSE" : "×" + vitesse;
  $("#vit").classList.toggle("on", vitesse !== 1 || robotOn);
  const q = S.sel;
  $("#aide").textContent = choixSite ? "Choisis un batiment" : q ? `${ESC[q.k]} · ${GRADES[q.grade]} · ${B.vivants(S, q)}/${B.nMax(S, q)} · XP ${Math.floor(q.xp)}${q.grade < 3 ? "/" + [S.P.xp.veteran, S.P.xp.elite, S.P.xp.heros][q.grade] : ""}${GARNISON[q.k] ? " · touche le sol ou une tour" : " · touche le sol"}`
    : robotOn ? "Le robot joue" : "Touche une escouade, ou un emplacement pour batir";
}
document.querySelectorAll("#jobs").forEach(el => el.addEventListener("click", e => { const b = e.target.closest("button"); if (!b || !S || S.fini) return; e.stopPropagation();
  const j = b.dataset.j, err = j === "plus" ? B.ajouterOuvrier(S, B.metierLibre(S)) : B.metier(S, j); if (err) dire(err); maj(); }));
$("#cartes").addEventListener("click", e => { const b = e.target.closest("button"); if (!b || !S || S.fini) return; e.stopPropagation();
  const err = B.recruter(S, b.dataset.e); if (err) dire(err); maj(); });

/* ---------- le menu de construction ---------- */
let ouvertA = 0;   // le clic qui suit le toucher ne doit pas choisir un bâtiment (leçon de Bannières)
function ouvrirChantier(site){
  choixSite = site; ouvertA = performance.now(); $("#construire h2").textContent = "CONSTRUIRE";
  $("#bats").innerHTML = Object.keys(BAT).filter(k => !!TOURS[k] === (site.type === "chemin")).map(k => { const im = BATI[k][0], c0 = B.cout(S, k), raison = B.peutBatir(S, site, k), ok = !raison && B.peutPayer(S, c0);
    return `<button type="button" data-b="${k}" class="${ok ? "" : "cher"}"><img src="${IMG_DOSSIER}${im}.png" alt="" class="${k === "tourbois" ? "bande4" : ""}"><b>${BAT[k]}</b><span class="cout">${raison ? "DEJA FAIT" : prix(c0)}</span><small>${EFFET[k]}</small></button>`; }).join("");
  $("#construire").hidden = false; maj();
}
// toucher un bâtiment du village (ou le château) : son niveau et le bouton AMELIORER
const ROLE_NIV = {caserne: "chevaliers", archerie: "archers", monastere: "moines", atelier: "catapultes"};
function ouvrirBatiment(site){
  choixSite = site; ouvertA = performance.now();
  const chateau = site === "chateau", b = chateau ? null : site.b, k = chateau ? "chateau" : b.k;
  const niv = chateau ? S.niveauChateau : (b.niveau || 1), max = S.P.niveaux.max, c0 = chateau ? B.coutChateau(S) : B.coutNiveau(S, b);
  $("#construire h2").textContent = (chateau ? "CHATEAU" : BAT[k]) + " · NIVEAU " + niv;
  const unite = chateau ? "lanciers" : ROLE_NIV[k];
  const effet = niv >= max ? "Niveau maximum." : k === "maison" ? `Niveau ${niv + 1} : +${S.P.pop.maisonEsc} escouade et +${S.P.pop.maisonOuv} ouvriers de population.` : `Niveau ${niv + 1} : les ${unite} recrutes arrivent ${niv + 1 === 2 ? "VETERANS" : "ELITE"}${chateau ? ", et le chateau a plus de points de vie" : ""}${k === "caserne" && niv === 1 ? " ; promotions : lanciers en cavaliers, chevaliers en epeistes" : ""}.`;
  const occupe = !chateau && b.travaux;
  $("#bats").innerHTML = `<button type="button" data-a="1" class="${niv >= max || occupe || !B.peutPayer(S, c0) ? "cher" : ""}" style="grid-column:1/-1"><b>${occupe ? "TRAVAUX EN COURS" : niv >= max ? "NIVEAU MAXIMUM" : "AMELIORER"}</b><span class="cout">${niv >= max || occupe ? "" : prix(c0)}</span><small>${effet}</small></button>`;
  $("#construire").hidden = false; maj();
}
const fermerChantier = () => { choixSite = null; $("#construire").hidden = true; };
$("#bats").addEventListener("click", e => { const b = e.target.closest("button"); if (!b || !choixSite || performance.now() - ouvertA < 400) return;
  const err = b.dataset.a ? (choixSite === "chateau" ? B.ameliorerChateau(S) : B.ameliorer(S, choixSite)) : B.construire(S, choixSite, b.dataset.b);
  if (err) dire(err); else fermerChantier(); maj(); });
$("#tenir").addEventListener("click", e => { e.stopPropagation(); if (!S || !S.sel) return; B.tenir(S, S.sel); maj(); });
$("#promo").addEventListener("click", e => { e.stopPropagation(); if (!S || !S.sel) return; const err = B.promouvoir(S, S.sel); if (err) dire(err); maj(); });
$("#bAnnulerB").addEventListener("click", () => { fermerChantier(); maj(); });

/* ---------- le décor ---------- */
const DECOR = [];
// une case est-elle un chemin (sur la carte, ou son prolongement hors de la carte) ?
const chemin = (cx, cy) => cx >= 0 && cy >= 0 && cx < W && cy < H ? CARTE[cy][cx] === "P" : (cx === 5 && cy < 0) || (cy === 4 && cx < 0) || (cy === 3 && cx >= W);
{ let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const libre = (x, y) => !chemin(Math.floor(x), Math.floor(y)) && !chemin(Math.floor(x), Math.floor(y - .4));
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++){ const ch = CARTE[y][xx];
    if (ch === "F") for (let k = 0; k < 2; k++){ const o = {k: "arbre", x: xx + .25 + k * .5 + (rnd() - .5) * .15, y: y + .55 + k * .35, n: Math.floor(rnd() * 4), ph: rnd() * 8}; if (libre(o.x, o.y)) DECOR.push(o); }
    if (ch === "." && rnd() < .1 && !B.SITES.some(([sx, sy]) => Math.hypot(sx - xx - .5, sy - y - .7) < 1.3)) DECOR.push({k: rnd() < .5 ? "buisson" : "rocher", x: xx + .5 + (rnd() - .5) * .6, y: y + .7, ph: rnd() * 8}); }
  const pousse = o => { if (libre(o.x, o.y)) DECOR.push(o); };
  for (let i = -3; i < W * 2 + 3; i += 1.4) for (const j of [-1.2, H * 2 + .4]) pousse({k: "arbre", x: i / 2, y: j / 2 + .9, n: Math.floor(rnd() * 4), ph: rnd() * 8});
  for (let j = -1; j < H * 2 + 1; j += 1.5) for (const i of [-1.3, W * 2 + .3]) pousse({k: "arbre", x: i / 2 + .3, y: j / 2 + .9, n: Math.floor(rnd() * 4), ph: rnd() * 8}); }
function fond(){
  bg = cv(WW, WH); const b = bg.getContext("2d"); b.imageSmoothingEnabled = false;
  const NX = WW / 64, NY = WH / 64, put = (im, c0, r0, i, j) => b.drawImage(im, c0 * 64, r0 * 64, 64, 64, i * 64, j * 64, 64, 64);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) put(L.tm, 1, 1, i, j);
  // le sol du village, d'une autre herbe (bords raccordés)
  const [vx, vy, vw, vh] = VILLAGE, isV = (i, j) => { const cx = (i - M) / 2, cy = (j - M) / 2; return cx >= vx && cy >= vy && cx < vx + vw && cy < vy + vh; };
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (isV(i, j)){ const [cc, r] = auto(isV(i, j - 1), isV(i, j + 1), isV(i - 1, j), isV(i + 1, j)); put(L["tm-village"], cc, r, i, j); }
  const isP = (i, j) => chemin(Math.floor((i - M) / 2), Math.floor((j - M) / 2));
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (isP(i, j)){ const [cc, r] = auto(isP(i, j - 1), isP(i, j + 1), isP(i - 1, j), isP(i + 1, j)); put(L.sable, 5 + cc, r, i, j); }
}

/* ---------- une partie ---------- */
function nouvelle(){
  S = B.creer(MODS, (Date.now() % 1e9) + 1);
  fermerChantier(); $("#fin").hidden = true; maj(); majJournal();
}
function finPartie(){
  const st = lire("bastion.parties", {jouees: 0, victoires: 0, vague: 0}) || {jouees: 0, victoires: 0, vague: 0};
  st.jouees++; if (S.fini === "victoire") st.victoires++; st.vague = Math.max(st.vague || 0, S.vague);
  if (!robotOn) ecrire("bastion.parties", st);
  $("#finTitre").textContent = S.fini === "victoire" ? "VICTOIRE" : "LE CHATEAU EST TOMBE";
  $("#finTexte").textContent = `Vague ${S.vague}/${S.P.vagues.nombre} · ${S.stats.tues} monstres abattus · ${S.stats.pertes} soldats perdus · ${Math.floor(S.t / 60)} min ${String(Math.floor(S.t % 60)).padStart(2, "0")}${robotOn ? " · partie du robot" : ""}`;
  $("#finJournal").innerHTML = tableJournal();
  $("#fin").hidden = false;
}

/* ---------- au doigt ---------- */
let drag = null;
c.addEventListener("pointerdown", e => { drag = {x: e.clientX, y: e.clientY, cx: camX, cy: camY, done: false}; });
addEventListener("pointermove", e => { if (!drag) return; const k = c.width / c.getBoundingClientRect().width, dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.hypot(dx, dy) > 10) drag.done = true; if (drag.done){ camX = drag.cx - dx * k; camY = drag.cy - dy * k; clamp(); } });
addEventListener("pointerup", e => { const d = drag; drag = null; if (!d || d.done || !S || S.fini || pause) return;
  const r = c.getBoundingClientRect(), X = (e.clientX - r.left) / r.width * c.width + camX, Y = (e.clientY - r.top) / r.height * c.height + camY, gx = (X - M * 64) / CS, gy = (Y - M * 64) / CS;
  toucher(gx, gy); maj(); });
function toucher(gx, gy){
  if (choixSite){ fermerChantier(); return; }
  // une escouade ?
  let pick = null, pd = .6;
  for (const q of S.esc) if (q.pv > 0){ const dd = Math.hypot(q.x - gx, q.y - (q.tour ? 1.45 : 0) - (gy + .2)); if (dd < pd){ pd = dd; pick = q; } }
  // un emplacement ? (toute l'image du bâtiment compte)
  let site = null, sd = 9;
  for (const s of S.sites){ const h = s.b ? (s.b.fini ? HAUT[s.b.k] : 1.2) : .9, w = s.b && TOURS[s.b.k] ? .75 : .65;
    if (Math.abs(gx - s.x) < w && gy < s.y + .15 && gy > s.y - h){ const dd = Math.abs(gx - s.x) + Math.abs(gy - (s.y - h / 2)) * .5; if (dd < sd){ sd = dd; site = s; } } }
  if (S.sel && pick !== S.sel){
    if (pick && !site){ S.sel = pick; return; }
    const tour = site && site.b && TOURS[site.b.k] && site.b.fini && GARNISON[S.sel.k] ? site : null;
    const err = B.envoyer(S, S.sel, gx, gy, tour); if (err) dire(err);
    S.sel = null; return;
  }
  if (pick){ S.sel = pick === S.sel ? null : pick; return; }
  if (site){
    if (!site.b) ouvrirChantier(site);
    else if (site.b.fini && AMELIORABLE[site.b.k]) ouvrirBatiment(site);
    else { const b = site.b, BB = S.P[b.k]; dire(`${BAT[b.k]}${b.fini ? "" : " EN CHANTIER " + Math.floor(b.prog / BB.travail * 100) + " %"} · PV ${Math.ceil(b.pv)}/${Math.round(B.pvBat(S, b))}${TOURS[b.k] ? (b.garnison ? " · " + ESC[b.garnison.k] + " DEDANS" : " · VIDE") : ""}`, true); }
    return;
  }
  // le château
  if (Math.abs(gx - CHATEAU[0]) < 1.25 && gy > CHATEAU[1] - 1.5 && gy < CHATEAU[1] + .55) ouvrirBatiment("chateau");
}

/* ---------- le dessin ---------- */
const POS = {1: [[0, 0]], 2: [[-.22, -.05], [.22, .05]], 3: [[-.24, -.12], [.24, -.12], [0, .18]], 4: [[-.24, -.15], [.24, -.15], [-.24, .18], [.24, .18]],
  5: [[-.28, -.16], [.28, -.16], [0, 0], [-.28, .18], [.28, .18]]};
// une figurine (case de bande d'images) ; sans ombre si elle est perchée
function fig(list, D, im, n, X, Y, face, k, filtre, z, sansOmbre){ if (!im) return; const f = f8(im, D.fs, n), s = D.fs * k;
  list.push([z == null ? Y : z, () => { if (!sansOmbre){ x.fillStyle = "rgba(30,40,10,.25)"; x.beginPath(); x.ellipse(Math.round(X), Math.round(Y), 22 * k / .8, 8 * k / .8, 0, 0, Math.PI * 2); x.fill(); }
    if (filtre) x.filter = filtre;
    if (face < 0){ x.save(); x.translate(Math.round(X), 0); x.scale(-1, 1); x.drawImage(f, -D.fx * k, Math.round(Y - D.fy * k), s, f.height * k); x.restore(); } else x.drawImage(f, Math.round(X - D.fx * k), Math.round(Y - D.fy * k), s, f.height * k);
    x.filter = "none"; }]); }
function etoiles(X, Y, n){
  for (let i = 0; i < n; i++){ const cx = X + (i - (n - 1) / 2) * 26, cy = Y; x.beginPath();
    for (let k = 0; k < 10; k++){ const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 6 : 13; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    x.closePath(); x.fillStyle = "#ffd94a"; x.strokeStyle = "#5a3a10"; x.lineWidth = 3; x.stroke(); x.fill(); }
}
// la flèche verte du pack, pointée vers le haut, qui sautille : « ce bâtiment peut s'améliorer » (pâle si on n'a pas de quoi payer)
function fleche(X, Y, T, ok){ const im = L["ic-fleche-verte"]; if (!im) return; x.save(); x.globalAlpha = ok ? 1 : .4; x.translate(X, Y - (ok ? Math.abs(Math.sin(T * 4)) * 10 : 0)); x.rotate(-Math.PI / 2);
  x.drawImage(im, -im.width * .6, -im.height * .6, im.width * 1.2, im.height * 1.2); x.restore(); }
function barre(X, Y, w, v, col){ x.fillStyle = "#2a1008"; x.fillRect(X - w / 2 - 2, Y, w + 4, 10); x.fillStyle = col; x.fillRect(X - w / 2, Y + 2, w * Math.max(0, Math.min(1, v)), 6); }
const anim = (q, k) => k + "-" + (q.mode === "walk" ? "marche" : q.mode === "atk" ? "coup" : "repos");
// quelqu'un (pieds en X, Y) est-il caché par une image posée en bx, by (largeur w, hauteur h en pixels) ?
let pieds = [];
const cache = (bx, by, w, h) => pieds.some(([X, Y]) => X > bx - w / 2 + 10 && X < bx + w / 2 - 10 && Y < by - 12 && Y > by - h + 30);
// un bâtiment, transparent si quelqu'un passe derrière
function batiment(im, X, Y, fy, ech){
  const w = im.width * ech, h = im.height * ech, gx = Math.round(X - w / 2), gy = Math.round(Y - fy * ech);
  if (cache(X, Y, w, fy * ech)) x.globalAlpha = .5;
  x.drawImage(im, gx, gy, w, h); x.globalAlpha = 1;
}
// la zone de soin d'un moine
function zoneSoin(list, q, X, Y, T){
  const r = B.portee(S, q) * CS, sel = S.sel === q;
  list.push([-1e8, () => { x.save(); x.fillStyle = sel ? "rgba(140,255,160,.2)" : "rgba(140,255,160,.12)"; x.strokeStyle = sel ? "rgba(220,255,220,.95)" : "rgba(190,255,190,.7)";
    x.lineWidth = 4; x.setLineDash([16, 12]); x.lineDashOffset = -T * 20; x.beginPath(); x.ellipse(X, Y, r, r, 0, 0, Math.PI * 2); x.fill(); x.stroke(); x.restore(); }]);
}
let last = performance.now(), majT = 0, finVue = false;
function frame(now){
  const dt0 = Math.min(.05, (now - last) / 1000); last = now; const T = now / 1000;
  if (pret && S && !pause){
    const v = vitesse * (S.sel && ralentiOn ? S.P.jeu.ralenti : 1);
    let reste = dt0 * v; while (reste > 1e-6){ const d = Math.min(.05, reste); reste -= d; if (robotOn) B.robot(S, d); B.pas(S, d); }
    for (const e of S.evts) dire(e.txt, e.bon); S.evts.length = 0;
    majT -= dt0; if (majT <= 0){ majT = .25; maj(); }
    if (S.fini && !finVue){ finVue = true; setTimeout(finPartie, 1500); }
  }
  x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = "#3c6a2a"; x.fillRect(0, 0, c.width, c.height);
  if (!pret || !S){ requestAnimationFrame(frame); return; }
  x.setTransform(1, 0, 0, 1, -Math.round(camX), -Math.round(camY)); x.drawImage(bg, 0, 0);
  const list = [], tS = S.t;
  pieds = [...S.esc.filter(q => !q.tour), ...S.mons.filter(m => m.delai <= 0), ...S.pawns].map(e => P(e.x, e.y));
  for (const o of DECOR){ const [X, Y] = P(o.x, o.y);
    if (o.k === "arbre"){ const im = L["arbre" + (o.n + 1)]; if (im) list.push([Y, () => x.drawImage(f8(im, 192, T * 8 + o.ph), Math.round(X - 96), Math.round(Y - (im.height === 256 ? 238 : 168)))]); }
    else if (o.k === "buisson") list.push([Y, () => x.drawImage(f8(L.buisson, 128, T * 8 + o.ph), Math.round(X - 64), Math.round(Y - 78))]);
    else if (o.k === "rocher") list.push([Y - 20, () => x.drawImage(L.rocher, Math.round(X - 32), Math.round(Y - 48))]); }
  for (const a of S.arbres){ const [X, Y] = P(a.x, a.y); list.push([Y, () => { if (a.coupe > 0) x.drawImage(L["souche" + (a.n + 1)], Math.round(X - 96), Math.round(Y - 238)); else x.drawImage(f8(L["arbre" + (a.n + 1)], 192, T * 8 + a.ph), Math.round(X - 96), Math.round(Y - 238)); }]); }
  for (const g of S.filons){ const [X, Y] = P(g.x, g.y); list.push([Y - 10, () => x.drawImage(L["filon" + g.n], Math.round(X - 64), Math.round(Y - 90))]); }
  for (const m of S.moutons){ const [X, Y] = P(m.x, m.y); fig(list, {fs: 128, fx: 64, fy: 84}, L[m.mv ? "mouton-marche" : "mouton-broute"], T * 8 + m.t, X, Y, m.face, .8); }
  // le château
  { const [X, Y] = P(CHATEAU[0], CHATEAU[1] + .55); list.push([Y, () => { batiment(L.chateau, X, Y, 246, 1);
    if (S.niveauChateau > 1) etoiles(X, Y + 22, S.niveauChateau - 1);
    if (S.niveauChateau < S.P.niveaux.max) fleche(X + 130, Y - 200, T, B.peutPayer(S, B.coutChateau(S)));
    const p = S.pv / B.pvChateau(S); if (p < .6) for (let k = 0; k < (p < .3 ? 4 : 2); k++) x.drawImage(f8(L.feu, 64, T * 10 + k * 3), Math.round(X - 100 + k * 60), Math.round(Y - 150 - (k % 2) * 40)); }]); }
  // les emplacements et les bâtiments
  for (const s of S.sites){ const [X, Y] = P(s.x, s.y), b = s.b;
    if (!b){
      list.push([Y - 400, () => { if (s.ruine) x.drawImage(L.ruine, Math.round(X - 64), Math.round(Y - 164));
        const on = choixSite === s; x.strokeStyle = on ? "#fff4a0" : "rgba(60,40,20,.5)"; x.lineWidth = on ? 7 : 5; x.setLineDash([14, 10]); x.beginPath(); x.ellipse(X, Y - 30, 70, 38, 0, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
        x.fillStyle = on ? "#fff4a0" : "rgba(60,40,20,.5)"; x.fillRect(X - 14, Y - 34, 28, 8); x.fillRect(X - 4, Y - 44, 8, 28); }]);
      continue; }
    const B0 = S.P[b.k], pm = B.pvBat(S, b);
    if (!b.fini){ list.push([Y, () => { if (b.k === "tourbois") batiment(L["tourbois-chantier"], X, Y, 171, 1.3); else batiment(L.chantier, X, Y, 180, 1); barre(X, Y + 4, 90, b.prog / B0.travail, "#ffd94a"); }]); continue; }
    const [nom, fy] = BATI[b.k], TT = TOUR[b.k], ech = TT ? TT.ech : 1, im = TT && TT.fs ? f8(L[nom], TT.fs, T * 6 + s.i) : L[nom];
    list.push([Y, () => { batiment(im, X, Y, fy, ech);
      if ((b.niveau || 1) > 1) etoiles(X, Y + 22, b.niveau - 1);
      if (AMELIORABLE[b.k] && (b.niveau || 1) < S.P.niveaux.max && !b.travaux) fleche(X + 58, Y - fy * ech + 40, T, B.peutPayer(S, B.coutNiveau(S, b)));
      if (b.travaux) barre(X, Y + 4, 90, b.travaux.prog / b.travaux.total, "#ffd94a");
      if (b.pv < pm * .5) x.drawImage(f8(L.feu, 64, T * 10 + s.i), Math.round(X - 40), Math.round(Y - fy * ech * .6));
      if (b.pv < pm && !b.travaux) barre(X, Y + 4, 90, b.pv / pm, "#7ad04a"); }]);
    // les occupants, sur la plateforme de la tour (dessinés juste après elle)
    if (TT && b.garnison){ const q = b.garnison, D = FIG[q.k], py = Y - (fy - TT.py) * ech + 20;
      const n = q.k === "cata" ? 1 : Math.min(3, B.vivants(S, q)), k = q.k === "cata" ? .5 : D.k, ecart = 36;
      for (let i = 0; i < n; i++) fig(list, D, L[anim(q, q.k)], T * 10 + q.ph + i * .7, X + (i - (n - 1) / 2) * ecart, py + (i % 2) * 6, q.face, k, null, Y + .5 + i * .01, true);
      list.push([Y + .6, () => { if (q.grade) etoiles(X, py - 130, q.grade); if (q.pv < B.pvMax(S, q)) barre(X, py - 112, 70, q.pv / B.pvMax(S, q), "#5ab0ff"); }]);
      if (S.sel === q) list.push([Y + .7, () => { x.strokeStyle = "#fff4c0"; x.lineWidth = 6; x.beginPath(); x.ellipse(X, py - 10, 74, 30, 0, 0, Math.PI * 2); x.stroke(); }]);
      if (q.k === "moine") zoneSoin(list, q, X, Y - 20, T); }
  }
  // ouvriers
  for (const p of S.pawns){ const [X, Y] = P(p.x, p.y);
    const k = p.job === "bati" ? (p.st === "work" ? "marteau-tape" : "marteau") : p.st === "work" ? {bois: "hache-coupe", or: "pioche-tape", viande: "couteau-coupe"}[p.job]
      : p.st === "back" ? (p.charge || p.job) : {bois: "hache", or: "pioche", viande: "couteau"}[p.job];
    fig(list, OUV, L["ouvrier-" + k], T * 10 + p.ph, X, Y, p.face, OUV.k); }
  // escouades
  for (const q of S.esc){ if (q.tour) continue; const D = FIG[q.k], n = q.pv > 0 ? B.vivants(S, q) : 1, [X, Y] = P(q.x, q.y), im = L[anim(q, q.k)];
    if (q.k === "moine" && q.pv > 0) zoneSoin(list, q, X, Y, T);
    if (S.sel === q) list.push([Y - 290, () => { x.strokeStyle = "#fff4c0"; x.lineWidth = 6; x.beginPath(); x.ellipse(X, Y + 10, 70, 34, 0, 0, Math.PI * 2); x.stroke(); }]);
    (q.k === "cata" ? POS[1] : POS[Math.min(5, n)] || POS[1]).forEach(([ox, oy], i) => fig(list, D, im, T * (q.k === "cata" && q.mode === "atk" ? 7 : 10) + q.ph + i * .7, X + ox * CS, Y + oy * CS, q.face, D.k, q.mort ? "opacity(.4)" : null));
    if (q.pv > 0){ const top = Y - 0.25 * CS - 120; list.push([Y + 2, () => { if (q.pv < B.pvMax(S, q)) barre(X, top, 70, q.pv / B.pvMax(S, q), "#5ab0ff"); if (q.grade) etoiles(X, top - 18, q.grade); if (q.tenir && L["ic-bouclier"]) x.drawImage(L["ic-bouclier"], X + 40, top - 34, 38, 38); }]); }
    if (q.ordre && Math.hypot(q.tx - q.x, q.ty - q.y) > .3){ const [tx, ty] = P(q.tx, q.ty); list.push([ty - 290, () => { x.strokeStyle = "#ffffff"; x.lineWidth = 5; x.beginPath(); x.ellipse(tx, ty, 34, 16, 0, 0, Math.PI * 2); x.stroke(); }]); } }
  // monstres
  for (const m of S.mons){ if (m.delai > 0) continue; const D = FIG[m.t], [X, Y] = P(m.x, m.y);
    fig(list, D, L[anim(m, m.t)], T * 10 + m.ph, X, Y, m.face, D.k, m.mort ? "opacity(.4)" : null);
    if (m.pv > 0 && m.pv < m.pvMax) list.push([Y + 1, () => barre(X, Y - D.fy * D.k - 14, m.t === "troll" ? 120 : 60, m.pv / m.pvMax, "#e84a2a")]); }
  // alerte : flèche rouge sur l'entrée de la prochaine vague
  if (S.alerte) for (const d of S.alerte){ const [a] = CHEMINS[d], [X, Y] = P(Math.max(.4, Math.min(W - .4, a[0])), Math.max(.4, Math.min(H - .4, a[1]))), bb = Math.abs(Math.sin(T * 5)) * 18;
    list.push([1e9, () => { x.fillStyle = "#e8301e"; x.strokeStyle = "#3a1408"; x.lineWidth = 5; x.beginPath(); x.moveTo(X - 26, Y - 50 - bb); x.lineTo(X + 26, Y - 50 - bb); x.lineTo(X, Y - 16 - bb); x.closePath(); x.fill(); x.stroke(); x.fillRect(X - 9, Y - 86 - bb, 18, 36); x.strokeRect(X - 9, Y - 86 - bb, 18, 36); }]); }
  for (const f of S.fx){ const t = tS - f.t0; if (t < 0) continue;
    if (f.k === "pouf"){ const [X, Y] = P(f.x, f.y); list.push([1e9, () => x.drawImage(f8(L.poussiere, 64, t * 14), Math.round(X - 48), Math.round(Y - 80), 96, 96)]); }
    if (f.k === "boum" && t < .6){ const [X, Y] = P(f.x, f.y); list.push([1e9, () => x.drawImage(f8(L.explosion, 192, t * 14), Math.round(X - 96), Math.round(Y - 140))]); }
    if (f.k === "heal" && t < 11 / 14){ const c0 = f.cible, [X, Y] = c0 && c0.pv > 0 ? P(c0.x, c0.y - (c0.tour ? 1.4 : 0)) : P(f.x, f.y);
      list.push([1e9, () => x.drawImage(f8(L.soin, 192, t * 14), Math.round(X - 96), Math.round(Y - 140))]); }
    if (f.k === "grade"){ const [X, Y] = P(f.x, f.y); list.push([1e9, () => { x.globalAlpha = Math.max(0, 1 - t / 1.4); etoiles(X, Y - 160 - t * 40, 3); x.globalAlpha = 1; }]); }
    if (f.k === "txt"){ const [X, Y] = P(f.x, f.y); list.push([1e9, () => { x.font = "bold 34px Cinzel, Georgia, serif"; x.textAlign = "center"; x.lineWidth = 6; x.strokeStyle = "#3a2410"; x.fillStyle = f.col; x.strokeText(f.t, X, Y - t * 50); x.fillText(f.t, X, Y - t * 50); }]); }
    if (f.k === "pierre" && t < f.d){ const u0 = t / f.d, [X0, Y0] = P(f.x0, f.y0), [X1, Y1] = P(f.x1, f.y1), X = X0 + (X1 - X0) * u0, Y = Y0 + (Y1 - Y0) * u0 - Math.sin(u0 * Math.PI) * 260 - 60;
      list.push([1e9, () => x.drawImage(L.pierre, Math.round(X - 64), Math.round(Y - 64))]); }
    if ((f.k === "fleche" || f.k === "os") && t < .4){ const u0 = t / .4, [X0, Y0] = P(f.x0, f.y0), [X1, Y1] = P(f.x1, f.y1), X = X0 + (X1 - X0) * u0, Y = Y0 + (Y1 - Y0) * u0 - Math.sin(u0 * Math.PI) * 80 - 50;
      list.push([1e9, () => { x.save(); x.translate(X, Y); x.rotate(f.k === "os" ? t * 20 : Math.atan2(Y1 - Y0 - Math.cos(u0 * Math.PI) * 250, X1 - X0)); x.drawImage(f.k === "os" ? f8(L.os, 64, 0) : L.fleche, -32, -32); x.restore(); }]); } }
  list.sort((a, b) => a[0] - b[0]); for (const [, f] of list) f();
  x.setTransform(1, 0, 0, 1, 0, 0);
  requestAnimationFrame(frame);
}

/* ---------- menus ---------- */
const ouvrirMenu = () => { pause = true; $("#menu").hidden = false; $("#bJouer").textContent = S && !S.fini ? "REPRENDRE" : "JOUER"; };
$("#bMenu").addEventListener("click", ouvrirMenu);
$("#bJouer").addEventListener("click", () => { if (!S || S.fini){ finVue = false; nouvelle(); } $("#menu").hidden = true; pause = false; last = performance.now(); });
$("#bNouvelle").addEventListener("click", () => { finVue = false; nouvelle(); $("#menu").hidden = true; pause = false; });
$("#bAide").addEventListener("click", () => { $("#aideTexte").hidden = !$("#aideTexte").hidden; });
$("#bRejouer").addEventListener("click", () => { finVue = false; nouvelle(); pause = false; });
$("#bFinLabo").addEventListener("click", () => ouvrirLabo());
$("#zoom").addEventListener("click", () => { loin = !loin; $("#zoom").textContent = loin ? "+" : "−"; taille(); });
$("#vit").addEventListener("click", () => { const L0 = [1, 2, 4, 0, .5]; vitesse = L0[(L0.indexOf(vitesse) + 1) % L0.length]; maj(); });

/* ---------- le LABO ---------- */
// libellés des réglages : groupe → [titre, {clé: libellé}]
const LIB = {
  eco: ["ECONOMIE", {bois: "Bois au depart", or: "Or au depart", viande: "Viande au depart", ouvriers: "Ouvriers au depart", rapport: "Rapporte par voyage", vitesse: "Vitesse des ouvriers (cases/s)",
    tBois: "Temps pour couper (s)", tOr: "Temps pour miner (s)", tViande: "Temps pour la viande (s)", ouvrier: "Prix d'un ouvrier (viande)", batir: "Vitesse de construction par ouvrier"}],
  pop: ["POPULATION", {escouades: "Escouades au depart", ouvriers: "Ouvriers max au depart", maisonEsc: "Escouades en plus par maison", maisonOuv: "Ouvriers en plus par maison"}],
  chateau: ["CHATEAU", {pv: "Points de vie", bois: "Amelioration : bois (× niveau)", or: "Amelioration : or (× niveau)", pvNiveau: "PV en plus par niveau (0,3 = +30 %)"}],
  lance: ["LANCIERS", null], guer: ["CHEVALIERS", null], arc: ["ARCHERS", null], moine: ["MOINES", null], cata: ["CATAPULTE", null], cav: ["CAVALIERS (promotion des lanciers)", null], epee: ["EPEISTES (promotion des chevaliers)", null],
  gob: ["GOBELINS A TORCHE", null], lanceg: ["GOBELINS A LANCE", null], gnoll: ["GNOLLS (lancent des os)", null], troll: ["TROLL", null],
  maison: ["MAISON", null], caserne: ["CASERNE", null], archerie: ["ARCHERIE", null], monastere: ["MONASTERE", null], atelier: ["ATELIER", null], tour: ["TOUR", null], tourbois: ["TOUR EN BOIS", null], niveaux: ["NIVEAUX DES BATIMENTS", {cout: "Prix d'un niveau (× prix du batiment × niveau actuel)", travail: "Temps des travaux (× temps de construction × niveau)", max: "Niveau maximum"}],
  vagues: ["VAGUES", {premiere: "Premiere vague (s)", entre: "Temps entre deux vagues (s)", nombre: "Nombre de vagues", base: "Monstres a la 1re vague", plus: "Monstres en plus par vague",
    force: "PV des monstres en plus par vague (0,15 = +15 %)", troll: "Troll toutes les N vagues (0 = jamais)", deux: "Deux chemins a partir de la vague", alerte: "Alerte avant la vague (s)"}],
  xp: ["EXPERIENCE", {parPv: "XP par PV de monstre abattu", survie: "XP pour une vague survecue", veteran: "XP pour VETERANS", elite: "XP pour ELITE", heros: "XP pour HEROS", bonus: "Bonus par grade (0,2 = +20 %)"}],
  renfort: ["RENFORTS AU CHATEAU", {viande: "Viande par soldat", temps: "Secondes par soldat"}],
  jeu: ["RYTHME", {ralenti: "Ralenti quand une escouade est choisie (1 = aucun)"}]};
const CHAMP = {n: "Soldats", pv: "PV (par soldat)", dps: "Degats par seconde (par soldat)", soin: "Soin par seconde (par moine)", r: "Portee (cases)", v: "Vitesse (cases/s)",
  bois: "Prix en bois", or: "Prix en or", viande: "Prix en viande", troll: "Degats contre le troll (×)", travail: "Temps de construction (s, 1 ouvrier)", portee: "Portee en plus (archers, catapulte)", soigne: "Zone de soin en plus (moines)", rGrade: "Zone de soin en plus par grade", degats: "Degats d'une pierre", cadence: "Secondes entre deux pierres", zone: "Rayon de l'explosion (cases)"};
function formulaire(){
  const P0 = B.reglages(MODS), D = B.DEFAUT;
  $("#reglages").innerHTML = Object.keys(D).map(g => { const [titre, libs] = LIB[g] || [g, null];
    return `<details><summary>${titre}</summary>${Object.keys(D[g]).map(k => `<label class="${P0[g][k] !== D[g][k] ? "mod" : ""}"><span>${(libs && libs[k]) || CHAMP[k] || k}</span><input type="number" step="any" inputmode="decimal" data-g="${g}" data-k="${k}" value="${P0[g][k]}"><i>${D[g][k]}</i></label>`).join("")}</details>`; }).join("");
}
function lireFormulaire(){
  const m = {};
  document.querySelectorAll("#reglages input").forEach(i => { const v = parseFloat(String(i.value).replace(",", ".")), g = i.dataset.g, k = i.dataset.k;
    if (isFinite(v) && v !== B.DEFAUT[g][k]) (m[g] = m[g] || {})[k] = v; });
  return m;
}
$("#reglages").addEventListener("input", e => { const i = e.target; if (!i.dataset || !i.dataset.g) return; i.parentNode.classList.toggle("mod", parseFloat(String(i.value).replace(",", ".")) !== B.DEFAUT[i.dataset.g][i.dataset.k]); });
function ouvrirLabo(){ pause = true; formulaire(); majJournal(); majLabo(); $("#labo").hidden = false; }
function fermerLabo(){ $("#labo").hidden = true; if ($("#menu").hidden && (!S || !S.fini)) { pause = false; last = performance.now(); } }
$("#bLabo").addEventListener("click", ouvrirLabo);
$("#bLaboMenu").addEventListener("click", () => { $("#menu").hidden = true; ouvrirLabo(); });
$("#bFermer").addEventListener("click", fermerLabo);
function majLabo(){
  document.querySelectorAll("#vitesses button").forEach(b => b.classList.toggle("on", Number(b.dataset.v) === vitesse));
  $("#tRalenti").textContent = "RALENTI AU CHOIX : " + (ralentiOn ? "OUI" : "NON");
  $("#tRobot").textContent = "LE ROBOT JOUE : " + (robotOn ? "OUI" : "NON");
  $("#tInvincible").textContent = "CHATEAU INVINCIBLE : " + (S && S.triche.invincible ? "OUI" : "NON");
  $("#tTout").textContent = "TOUT DEBLOQUE : " + (S && S.triche.tout ? "OUI" : "NON");
  const n = Object.keys(MODS).length; $("#etatReglages").textContent = n ? "Reglages modifies : " + Object.entries(MODS).map(([g, o]) => (LIB[g] ? LIB[g][0] : g) + " (" + Object.keys(o).length + ")").join(", ") : "Reglages d'origine";
}
$("#vitesses").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; vitesse = Number(b.dataset.v); majLabo(); maj(); });
$("#tRalenti").addEventListener("click", () => { ralentiOn = !ralentiOn; majLabo(); });
$("#tRobot").addEventListener("click", () => { robotOn = !robotOn; majLabo(); maj(); });
$("#tInvincible").addEventListener("click", () => { if (S){ S.triche.invincible = !S.triche.invincible; majLabo(); } });
$("#tTout").addEventListener("click", () => { if (S){ S.triche.tout = !S.triche.tout; majLabo(); maj(); } });
$("#bRiche").addEventListener("click", () => { if (S){ for (const r of RES) S.res[r] += 100; maj(); dire("+100 DE TOUT", true); } });
$("#bVague").addEventListener("click", () => { if (S){ B.vagueMaintenant(S); fermerLabo(); } });
$("#bAppliquer").addEventListener("click", () => { MODS = lireFormulaire(); ecrire("bastion.labo", MODS); finVue = false; nouvelle(); formulaire(); majLabo(); dire("NOUVEAUX REGLAGES", true); });
$("#bOrigine").addEventListener("click", () => { MODS = {}; ecrire("bastion.labo", MODS); formulaire(); majLabo(); finVue = false; nouvelle(); dire("REGLAGES D'ORIGINE", true); });
$("#bCopier").addEventListener("click", () => { const t = JSON.stringify(lireFormulaire()); $("#texte").value = t; try { navigator.clipboard.writeText(t).then(() => dire("REGLAGES COPIES", true), () => {}); } catch (e) {} });
$("#bCharger").addEventListener("click", () => { try { const m = JSON.parse($("#texte").value); MODS = B.ecarts(B.reglages(m)); ecrire("bastion.labo", MODS); formulaire(); majLabo(); finVue = false; nouvelle(); dire("REGLAGES CHARGES", true); } catch (e) { dire("TEXTE ILLISIBLE"); } });
// le simulateur : 30 parties jouées par le robot avec les réglages du formulaire
$("#bSimuler").addEventListener("click", () => {
  const m = lireFormulaire(), res = [], NB = 30, out = $("#simu"); let g = 0;
  out.textContent = "Simulation…";
  const tranche = () => { const t0 = performance.now(); while (g < NB && performance.now() - t0 < 40){ g++; res.push(B.simuler(m, g * 7919)); }
    out.textContent = `Simulation… ${g}/${NB}`; if (g < NB) return setTimeout(tranche, 0);
    const v = res.filter(r => r.fini === "victoire").length, moy = f => res.reduce((s, r) => s + f(r), 0) / NB, nbV = B.reglages(m).vagues.nombre;
    const parVague = []; for (let w = 1; w <= nbV; w++){ const atteint = res.filter(r => r.vague >= w).length, tombe = res.filter(r => r.fini === "defaite" && r.vague === w).length; parVague.push(`V${w} : ${atteint} y arrivent, ${tombe} perdues`); }
    out.innerHTML = `<b>${v}/${NB} victoires du robot</b> · vague moyenne ${moy(r => r.vague).toFixed(1)} · PV du château à la fin ${Math.round(moy(r => r.pv))} · ${Math.round(moy(r => r.tues))} monstres abattus, ${Math.round(moy(r => r.pertes))} soldats perdus<br><small>${parVague.join(" · ")}</small>`; };
  setTimeout(tranche, 30);
});
function tableJournal(){
  if (!S || !S.stats.journal.length) return "<p>Pas encore de vague.</p>";
  return `<table><tr><th>VAGUE</th><th>DUREE</th><th>CHATEAU</th><th>TUES</th><th>PERTES</th><th>ESC.</th><th>OUV.</th><th>RESTE</th></tr>${S.stats.journal.map(j => `<tr><td>${j.vague}</td><td>${j.fin ? Math.round(j.fin - j.debut) + " s" : "…"}</td><td>${j.pvChateau == null ? "…" : j.pvChateau}</td><td>${j.tues}</td><td>${j.pertes}</td><td>${j.esc ?? "…"}</td><td>${j.ouv ?? "…"}</td><td>${j.res ? RES.map(r => j.res[r]).join(" / ") : "…"}</td></tr>`).join("")}</table>
    <p class="petit">Recolte : ${RES.map(r => Math.round(S.stats.recolte[r]) + " " + r).join(", ")} · ${S.stats.batiments} batiments · ${S.stats.escouades} escouades recrutees</p>`;
}
function majJournal(){ $("#journal").innerHTML = tableJournal(); }

/* ---------- démarrage ---------- */
taille();
Promise.all(NOMS.map(charge)).then(() => { fond(); pret = true; nouvelle(); maj(); $("#chargement").hidden = true; });
requestAnimationFrame(frame);
window.Bastion = {get S(){ return S; }, B, nouvelle, toucher, avance: t => { for (let i = 0; i < t * 20; i++){ if (robotOn) B.robot(S, .05); B.pas(S, .05); } }, set robot(v){ robotOn = v; }, ouvrirLabo, fermerLabo};   // pour les essais
})();

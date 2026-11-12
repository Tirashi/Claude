/* Bastion : dessin, commandes au doigt (anneaux sur la carte, étiquettes des ouvriers), niveaux, tuto, panneau LABO (vitesse, triches, robot, réglages, journal).
   Les règles sont dans regles.js (window.BastionRegles) ; les images dans img/ (Tiny Swords, voir la page des crédits). */
(() => {
"use strict";
const B = window.BastionRegles;
const {W, H, CHATEAU, DEPOT, ESC, BAT, FEMININ, DEBLOQUE, GARNISON, GRADES, RES, TOURS, UNIQUE, AMELIORABLE, PROMO} = B;
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
let vitesse = 1, ralentiOn = true, robotOn = false, pause = true;
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

/* ---------- l'écran : ressources, population, actions de l'escouade choisie ---------- */
function maj(){
  if (!S) return;
  for (const r of RES) $("#r-" + r).textContent = Math.floor(S.res[r]);
  const pleinO = S.pawns.length >= B.maxOuv(S), pleinE = B.nbEsc(S) >= B.maxEsc(S);
  $("#popOuv b").textContent = S.pawns.length + "/" + B.maxOuv(S); $("#popOuv").classList.toggle("plein", pleinO);
  $("#popEsc b").textContent = B.nbEsc(S) + "/" + B.maxEsc(S); $("#popEsc").classList.toggle("plein", pleinE);
  const V = S.P.vagues;
  if (!tuto && S.prochaine > S.t + 1e5) S.prochaine = S.t + 12; // un tuto quitté en route ne bloque plus les vagues
  $("#vague").textContent = tuto ? "TUTO" : S.vague < V.nombre ? `VAGUE ${S.vague}/${V.nombre} · ${Math.max(0, Math.ceil(S.prochaine - S.t))} S` : `VAGUE ${V.nombre}/${V.nombre}`;
  $("#pvc i").style.width = Math.max(0, S.pv / B.pvChateau(S) * 100) + "%";
  const tn = $("#tenir"); tn.hidden = !(S.sel && !S.sel.tour && S.sel.k !== "cata"); if (!tn.hidden) tn.textContent = "TENIR LA POSITION : " + (S.sel.tenir ? "OUI" : "NON");
  tn.classList.toggle("or", !!(S.sel && S.sel.tenir));
  const pr = $("#promo"), q0 = S.sel; pr.hidden = !(q0 && PROMO[q0.k] && (S.c.L.promotions || S.triche.tout));
  if (!pr.hidden){ const k2 = PROMO[q0.k]; pr.innerHTML = `PROMOUVOIR : ${ESC[k2]} ${prix(B.cout(S, k2))}`; pr.classList.toggle("cher", !B.peutPromouvoir(S, q0) || !B.peutPayer(S, B.cout(S, k2))); }
  $("#vit").textContent = vitesse === 0 ? "PAUSE" : "×" + vitesse;
  $("#vit").classList.toggle("on", vitesse !== 1 || robotOn);
  const q = S.sel;
  $("#aide").textContent = anneau ? "" : q ? `${ESC[q.k]} · ${GRADES[q.grade]} · ${B.vivants(S, q)}/${B.nMax(S, q)} · XP ${Math.floor(q.xp)}${q.grade < 3 ? "/" + [S.P.xp.veteran, S.P.xp.elite, S.P.xp.heros][q.grade] : ""}${GARNISON[q.k] ? " · touche le sol ou une tour" : " · touche le sol"}`
    : robotOn ? "Le robot joue" : tuto ? "" : "Touche le chateau, un batiment, un cercle ou une escouade";
  majEtiquettes(); if (anneau) dessinerAnneau();
}

/* ---------- l'anneau : les boutons qui sortent autour du château, d'un bâtiment ou d'un emplacement ---------- */
let anneau = null, ouvertA = 0;   // le clic qui suit le toucher ne doit pas choisir un bouton (leçon de Bannières)
const ICONES = {};                 // vignettes faites au chargement (première image d'une bande)
function vignette(nom, fs){ const im = L[nom]; if (!im) return ""; const f = f8(im, fs, 0), t = cv(f.width, f.height); t.getContext("2d").drawImage(f, 0, 0); return t.toDataURL(); }
const ROLE_NIV = {caserne: "chevaliers", archerie: "archers", monastere: "moines", atelier: "catapultes"};
function itemsAnneau(cible){
  const out = [], P0 = S.P, max = P0.niveaux.max;
  const rec = k => { const c0 = B.cout(S, k), plein = B.nbEsc(S) >= B.maxEsc(S);
    return {k, img: IMG_DOSSIER + "av-" + k + ".png", titre: ESC[k], prix: c0, ok: B.debloque(S, k) && !plein && B.peutPayer(S, c0), raison: plein ? "POPULATION MAX" : "", faire: () => B.recruter(S, k)}; };
  const amel = (niv, c0, faire, effet) => ({k: "ameliorer", img: IMG_DOSSIER + "ic-fleche-verte.png", fleche: true, titre: "NIVEAU " + (niv + 1), prix: c0, ok: niv < max && B.peutPayer(S, c0), raison: niv >= max ? "MAXIMUM" : "", effet, faire});
  if (cible === "chateau"){
    out.push(rec("lance"));
    const plein = S.pawns.length >= B.maxOuv(S);
    out.push({k: "ouvrier", img: ICONES.ouvrier, titre: "OUVRIER", prix: {viande: P0.eco.ouvrier}, ok: !plein && S.res.viande >= P0.eco.ouvrier, raison: plein ? "POPULATION MAX" : "", faire: () => B.ajouterOuvrier(S, B.metierLibre(S))});
    if (S.c.L.niveaux || S.triche.tout) out.push(amel(S.niveauChateau, B.coutChateau(S), () => B.ameliorerChateau(S), "lanciers aguerris, chateau plus solide"));
  } else if (!cible.b){
    for (const k of Object.keys(BAT)) if (!!TOURS[k] === (cible.type === "chemin") && B.permis(S, k)){
      const c0 = B.cout(S, k), r = B.peutBatir(S, cible, k);
      out.push({k, img: ICONES[k] || IMG_DOSSIER + BATI[k][0] + ".png", bat: true, titre: BAT[k], prix: c0, ok: !r && B.peutPayer(S, c0), raison: r ? "DEJA FAIT" : "", effet: EFFET[k], faire: () => B.construire(S, cible, k)}); }
  } else if (cible.b.fini){
    const k = cible.b.k, u = Object.keys(B.FORME).find(e => B.FORME[e] === k);
    if (u) out.push(rec(u));
    if (AMELIORABLE[k] && (k === "maison" || S.c.L.niveaux || S.triche.tout)) out.push(amel(cible.b.niveau || 1, B.coutNiveau(S, cible.b), () => B.ameliorer(S, cible), k === "maison" ? "+1 escouade, +2 ouvriers" : "les " + ROLE_NIV[k] + " arrivent aguerris"));
  }
  return out;
}
function titreAnneau(cible){
  if (cible === "chateau") return "CHATEAU · NIV " + S.niveauChateau;
  if (!cible.b) return cible.type === "chemin" ? "BATIR UNE TOUR" : "BATIR AU VILLAGE";
  return BAT[cible.b.k] + (AMELIORABLE[cible.b.k] ? " · NIV " + (cible.b.niveau || 1) : "") + (cible.b.travaux ? " · TRAVAUX" : "");
}
function ouvrirAnneau(cible){
  anneau = {cible}; ouvertA = performance.now();
  if (!itemsAnneau(cible).length){ anneau = null; return false; }
  dessinerAnneau(); placerCalques(); return true;
}
function fermerAnneau(){ anneau = null; $("#anneau").hidden = true; $("#anneau").innerHTML = ""; }
function dessinerAnneau(){
  const el = $("#anneau"), items = itemsAnneau(anneau.cible); anneau.items = items;
  const cle = JSON.stringify(items.map(it => [it.k, it.ok, it.raison])) + titreAnneau(anneau.cible);
  if (el.dataset.cle === cle && !el.hidden) return;
  el.dataset.cle = cle;
  el.innerHTML = `<span class="titreA ruban">${titreAnneau(anneau.cible)}</span>` + items.map((it, i) => `<button type="button" class="pion${it.ok ? "" : " cher"}" data-i="${i}" data-k="${it.k}" title="${it.titre}${it.effet ? " : " + it.effet : ""}">
    <span class="rondA${it.bat ? " bat" : ""}${it.fleche ? " fl" : ""}"><img src="${it.img}" alt=""></span><b>${it.titre}</b><small>${it.raison || prix(it.prix)}</small></button>`).join("");
  el.hidden = false;
}
$("#anneau").addEventListener("click", e => { const b = e.target.closest("button[data-i]"); if (!b || !anneau || performance.now() - ouvertA < 400) return; e.stopPropagation();
  const it = anneau.items[Number(b.dataset.i)]; if (!it) return;
  const err = it.faire(); if (err) dire(err); else fermerAnneau(); maj(); });
// le centre (en pixels de l'écran) d'un point de la carte
function ecran(gx, gy){ const r = c.getBoundingClientRect(), [X, Y] = P(gx, gy); return [(X - camX) * r.width / c.width + r.left, (Y - camY) * r.height / c.height + r.top]; }
// place l'anneau et les étiquettes sur la carte (à chaque image : la vue peut bouger)
function placerCalques(){
  if (anneau){
    const el = $("#anneau"), ci = anneau.cible, h = ci === "chateau" ? 1.1 : ci.b ? Math.min(1.4, (HAUT[ci.b.k] || 1.2) * .55) : .45;
    const [cx, cy] = ci === "chateau" ? ecran(CHATEAU[0], CHATEAU[1] - .1) : ecran(ci.x, ci.y - h);
    const n = (anneau.items || []).length, R = n > 4 ? 92 : 80, dessous = cy < 190;
    el.style.left = cx + "px"; el.style.top = cy + "px";
    el.querySelectorAll(".pion").forEach((b, i) => { const a = n === 1 ? -Math.PI / 2 : (-Math.PI + Math.PI * (i + .5) / n) * (dessous ? -1 : 1);
      b.style.transform = `translate(${Math.cos(a) * R}px, ${Math.sin(a) * R * .9}px) translate(-50%, -50%)`; });
    const t = el.querySelector(".titreA"); if (t) t.style.transform = `translate(-50%, ${dessous ? -70 : 34}px)`;
  }
  for (const [j, gx, gy] of ZONES){ const e = document.querySelector(`.etiq[data-j="${j}"]`); if (!e) continue; const [ex, ey] = ecran(gx, gy); e.style.left = ex + "px"; e.style.top = ey + "px"; }
}

/* ---------- les étiquettes des ouvriers, posées sur le bois, l'or et les moutons ---------- */
const ZONES = [["bois", 2.0, 13.55], ["or", 9.0, 13.55], ["viande", 5.5, 13.9]];
$("#etiquettes").innerHTML = ZONES.map(([j]) => `<div class="etiq papier" data-j="${j}"><button type="button" data-a="-" aria-label="Un ouvrier de moins">−</button>${ic(j)}<b>0</b><button type="button" data-a="+" aria-label="Un ouvrier de plus">+</button></div>`).join("");
$("#etiquettes").addEventListener("click", e => { const b = e.target.closest("button"); if (!b || !S || S.fini) return; e.stopPropagation();
  const j = b.closest(".etiq").dataset.j, err = b.dataset.a === "+" ? B.metier(S, j) : B.retirer(S, j); if (err) dire(err); maj(); });
function majEtiquettes(){
  if (!S) return; const n = {bois: 0, or: 0, viande: 0}; S.pawns.forEach(p => { if (n[p.job] != null) n[p.job]++; });
  for (const [j] of ZONES){ const e = document.querySelector(`.etiq[data-j="${j}"] b`); if (e) e.textContent = n[j]; }
}
$("#tenir").addEventListener("click", e => { e.stopPropagation(); if (!S || !S.sel) return; B.tenir(S, S.sel); maj(); });
$("#promo").addEventListener("click", e => { e.stopPropagation(); if (!S || !S.sel) return; const err = B.promouvoir(S, S.sel); if (err) dire(err); maj(); });

/* ---------- le décor (refait pour chaque carte) ---------- */
let DECOR = [];
// une case est-elle un chemin (sur la carte, ou son prolongement hors de la carte) ?
const chemin = (cx, cy) => cx >= 0 && cy >= 0 && cx < W && cy < H ? S.c.carte[cy][cx] === "P" : B.routeHors(S.c, cx, cy);
function faireDecor(){
  DECOR = []; let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const libre = (x, y) => !chemin(Math.floor(x), Math.floor(y)) && !chemin(Math.floor(x), Math.floor(y - .4));
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++){ const ch = S.c.carte[y][xx];
    if (ch === "F") for (let k = 0; k < 2; k++){ const o = {k: "arbre", x: xx + .25 + k * .5 + (rnd() - .5) * .15, y: y + .55 + k * .35, n: Math.floor(rnd() * 4), ph: rnd() * 8}; if (libre(o.x, o.y)) DECOR.push(o); }
    if (ch === "." && rnd() < .1 && !S.sites.some(s => Math.hypot(s.x - xx - .5, s.y - y - .7) < 1.3)) DECOR.push({k: rnd() < .5 ? "buisson" : "rocher", x: xx + .5 + (rnd() - .5) * .6, y: y + .7, ph: rnd() * 8}); }
  const pousse = o => { if (libre(o.x, o.y)) DECOR.push(o); };
  for (let i = -3; i < W * 2 + 3; i += 1.4) for (const j of [-1.2, H * 2 + .4]) pousse({k: "arbre", x: i / 2, y: j / 2 + .9, n: Math.floor(rnd() * 4), ph: rnd() * 8});
  for (let j = -1; j < H * 2 + 1; j += 1.5) for (const i of [-1.3, W * 2 + .3]) pousse({k: "arbre", x: i / 2 + .3, y: j / 2 + .9, n: Math.floor(rnd() * 4), ph: rnd() * 8});
}
function fond(){
  if (!S) return;
  bg = cv(WW, WH); const b = bg.getContext("2d"); b.imageSmoothingEnabled = false;
  const NX = WW / 64, NY = WH / 64, put = (im, c0, r0, i, j) => b.drawImage(im, c0 * 64, r0 * 64, 64, 64, i * 64, j * 64, 64, 64);
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) put(L.tm, 1, 1, i, j);
  // le sol du village, d'une autre herbe (bords raccordés)
  const [vx, vy, vw, vh] = S.c.village, isV = (i, j) => { const cx = (i - M) / 2, cy = (j - M) / 2; return cx >= vx && cy >= vy && cx < vx + vw && cy < vy + vh; };
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (isV(i, j)){ const [cc, r] = auto(isV(i, j - 1), isV(i, j + 1), isV(i - 1, j), isV(i + 1, j)); put(L["tm-village"], cc, r, i, j); }
  const isP = (i, j) => chemin(Math.floor((i - M) / 2), Math.floor((j - M) / 2));
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) if (isP(i, j)){ const [cc, r] = auto(isP(i, j - 1), isP(i, j + 1), isP(i - 1, j), isP(i + 1, j)); put(L.sable, 5 + cc, r, i, j); }
}

/* ---------- une partie ---------- */
let niveau = 1, labo = false;
const progres = () => lire("bastion.progres", {etoiles: {}}) || {etoiles: {}};
const ouvert = n => n === 1 || (progres().etoiles[n - 1] || 0) > 0;
// niveau n (1 à 6), ou le bac à sable (niveau 4 avec les réglages du LABO)
function nouvelle(n, bac){
  if (n) niveau = n; if (bac != null) labo = bac;
  S = B.creer(labo ? MODS : {}, (Date.now() % 1e9) + 1, labo ? 4 : niveau);
  fermerAnneau(); $("#fin").hidden = true; finVue = false;
  faireDecor(); if (pret) fond(); taille();
  tuto = null; if (!labo && S.c.L.tuto) demarrerTuto();
  dire(labo ? "BAC A SABLE" : "NIVEAU " + niveau + " · " + S.c.nom, true);
  maj(); majJournal();
}
const etoilesDe = S0 => S0.fini !== "victoire" ? 0 : 1 + (S0.pv >= B.pvChateau(S0) * .5 ? 1 : 0) + (S0.pv >= B.pvChateau(S0) * .85 ? 1 : 0);
function finPartie(){
  const st = lire("bastion.parties", {jouees: 0, victoires: 0, vague: 0}) || {jouees: 0, victoires: 0, vague: 0};
  st.jouees++; if (S.fini === "victoire") st.victoires++; st.vague = Math.max(st.vague || 0, S.vague);
  const e = etoilesDe(S);
  if (!robotOn){ ecrire("bastion.parties", st);
    if (!labo && e){ const pg = progres(); pg.etoiles[niveau] = Math.max(pg.etoiles[niveau] || 0, e); ecrire("bastion.progres", pg); } }
  $("#finTitre").textContent = S.fini === "victoire" ? "VICTOIRE" : "LE CHATEAU EST TOMBE";
  $("#finEtoiles").textContent = labo ? "" : "★".repeat(e) + "☆".repeat(3 - e);
  $("#finTexte").textContent = `${labo ? "Bac a sable" : "Niveau " + niveau + " · " + S.c.nom} · vague ${S.vague}/${S.P.vagues.nombre} · ${S.stats.tues} monstres abattus · ${S.stats.pertes} soldats perdus · ${Math.floor(S.t / 60)} min ${String(Math.floor(S.t % 60)).padStart(2, "0")}${robotOn ? " · partie du robot" : ""}`;
  $("#finJournal").innerHTML = tableJournal();
  $("#bSuivant").hidden = labo || S.fini !== "victoire" || niveau >= B.NIVEAUX.length;
  $("#fin").hidden = false;
}

/* ---------- l'écran des niveaux ---------- */
const POS_NIV = [[30, 90], [68, 72], [28, 56], [72, 44], [30, 30], [70, 15]];
let nivChoisi = 1;
function ouvrirNiveaux(){
  pause = true; $("#menu").hidden = true; $("#fin").hidden = true;
  const pg = progres(); nivChoisi = Math.max(1, B.NIVEAUX.findIndex((_, i) => !(pg.etoiles[i + 1] > 0)) + 1 || B.NIVEAUX.length);
  dessinerNiveaux(); $("#niveaux").hidden = false;
}
function dessinerNiveaux(){
  const pg = progres();
  $("#carteNiv").querySelectorAll(".noeud").forEach(e => e.remove());
  B.NIVEAUX.forEach((L0, i) => { const n = i + 1, ok = ouvert(n), e = pg.etoiles[n] || 0, [px, py] = POS_NIV[i];
    const b = document.createElement("button"); b.type = "button"; b.className = "noeud" + (ok ? "" : " ferme") + (n === nivChoisi ? " choisi" : ""); b.dataset.n = n;
    b.style.left = px + "%"; b.style.top = py + "%";
    b.innerHTML = `<span class="rondA"><span>${n}</span></span><b>${L0.nom}</b><span class="et">${e ? "★".repeat(e) + "☆".repeat(3 - e) : ok ? "" : "FERME"}</span>`;
    $("#carteNiv").append(b); });
  const L0 = B.NIVEAUX[nivChoisi - 1];
  $("#ficheNiv").innerHTML = `<b>${nivChoisi} · ${L0.nom}</b><br>${L0.texte}`;
  $("#bJouerNiv").classList.toggle("cher", !ouvert(nivChoisi));
}
$("#carteNiv").addEventListener("click", e => { const b = e.target.closest(".noeud"); if (!b) return; nivChoisi = Number(b.dataset.n); dessinerNiveaux(); });
$("#bJouerNiv").addEventListener("click", () => { if (!ouvert(nivChoisi)){ dire("TERMINE D'ABORD LE NIVEAU " + (nivChoisi - 1)); return; }
  $("#niveaux").hidden = true; nouvelle(nivChoisi, false); pause = false; last = performance.now(); });
$("#bRetourNiv").addEventListener("click", () => { $("#niveaux").hidden = true; ouvrirMenu(); });

/* ---------- le tuto (niveau 1) : une étape à la fois, le jeu attend qu'elle soit faite ---------- */
let tuto = null;
const nbJob = j => S.pawns.filter(p => p.job === j).length;
const siteVillage = () => S.sites.find(s => s.type === "village" && !s.b) || S.sites.find(s => s.type === "village");
const ETAPES = [
  {txt: "Bienvenue, seigneur ! Voici ton <b>chateau</b>. Les monstres viendront par le <b>chemin du nord</b>. Je vais t'apprendre a le defendre.", vise: () => ["carte", CHATEAU[0], CHATEAU[1] - .4], toucher: true},
  {txt: "Touche le <b>chateau</b> : des boutons sortent autour de lui.", vise: () => ["carte", CHATEAU[0], CHATEAU[1] - .4], fait: () => anneau && anneau.cible === "chateau"},
  {txt: "Touche les <b>LANCIERS</b> pour recruter une escouade.", vise: () => ["dom", '#anneau [data-k="lance"]'], fait: () => S.esc.length >= 2},
  {txt: "Ton escouade est choisie (cercle clair). Touche le <b>chemin</b> pour l'y envoyer.", vise: () => ["carte", 5.5, 5.2], fait: () => S.esc.some(q => q.ordre || q.ty < 8.5)},
  {txt: "Tes <b>ouvriers</b> coupent le bois, minent l'or et ramenent la viande. Touche <b>+</b> sur l'etiquette du <b>bois</b> : un ouvrier de plus y part.", vise: () => ["dom", '.etiq[data-j="bois"] [data-a="+"]'], cam: () => [2.6, 13.4], debut: () => { tuto.bois = nbJob("bois"); }, fait: () => nbJob("bois") > tuto.bois},
  {txt: "Pour former des archers, il faut une <b>archerie</b>. Touche un <b>cercle du village</b>, sous le chateau, puis l'archerie.", vise: () => { const s = siteVillage(); return ["carte", s.x, s.y - .3]; }, fait: () => S.sites.some(s => s.b && s.b.k === "archerie")},
  {txt: "Un ouvrier prend son marteau. Pendant ce temps, touche un <b>cercle pres du chemin</b> et bâtis une <b>tour en bois</b>.", vise: () => ["carte", S.sites[2].x, S.sites[2].y - .3], fait: () => S.sites.some(s => s.b && B.TOURS[s.b.k])},
  {txt: "Quand l'archerie est terminee, touche-la et recrute des <b>ARCHERS</b>.", vise: () => { const s = S.sites.find(o => o.b && o.b.k === "archerie"); return s ? ["carte", s.x, s.y - .8] : null; }, fait: () => S.esc.some(q => q.k === "arc")},
  {txt: "Envoie les archers sur la tour : touche-les, puis touche la <b>tour</b> (une fois finie). La-haut, ils tirent plus loin et ne craignent pas les coups.", vise: () => { const s = S.sites.find(o => o.b && B.TOURS[o.b.k]); return s ? ["carte", s.x, s.y - 1] : null; }, fait: () => S.esc.some(q => q.k === "arc" && (q.tour || q.versTour))},
  {txt: "Parfait ! La premiere vague arrive. Tiens <b>5 vagues</b>. Quand une escouade est blessee, ramene-la pres du chateau pour la reformer. Bonne chance !", toucher: true}];
function demarrerTuto(){ tuto = {i: 0}; S.prochaine = 1e9; etapeTuto(); }
// fait glisser la vue vers un point de la carte s'il n'est pas bien visible (au-dessus de la bulle du tuto)
let camCible = null;
function montrer(gx, gy){
  const [sx, sy] = ecran(gx, gy), bas = innerHeight - ($("#tuto").hidden ? 80 : 190);
  if (sx > 40 && sx < innerWidth - 40 && sy > 150 && sy < bas) return;
  const [X, Y] = P(gx, gy); camCible = [X - c.width / 2, Y - c.height * .4];
}
function etapeTuto(){
  const E = ETAPES[tuto.i]; if (E.debut) E.debut();
  const v = E.cam ? ["carte", ...E.cam()] : E.vise && E.vise(); if (v && v[0] === "carte") montrer(v[1], v[2]);
  $("#tutoTexte").innerHTML = E.txt; $("#tutoEtape").textContent = `ETAPE ${tuto.i + 1} / ${ETAPES.length}` + (E.toucher ? " · touche la bulle pour continuer" : "") + " · PASSER";
  $("#tuto").hidden = false;
}
function finTuto(){ tuto = null; $("#tuto").hidden = true; $("#doigt").hidden = true; $("#cercle").hidden = true; if (S && !S.fini){ S.prochaine = S.t + 12; } ecrire("bastion.tuto", true); maj(); }
$("#tuto").addEventListener("click", e => { if (!tuto) return; e.stopPropagation();
  if (e.target.closest("#tutoEtape") && /PASSER/.test(e.target.textContent)){ finTuto(); return; }
  if (ETAPES[tuto.i].toucher){ tuto.i++; if (tuto.i >= ETAPES.length) finTuto(); else etapeTuto(); } });
// à chaque image : l'étape est-elle faite ? où pointer ?
function suivreTuto(T){
  if (!tuto || !S) return;
  S.prochaine = Math.max(S.prochaine, S.t + 30); S.alerte = null;
  const E = ETAPES[tuto.i];
  if (E.fait && E.fait()){ tuto.i++; if (tuto.i >= ETAPES.length) return finTuto(); etapeTuto(); return; }
  const v = E.vise && E.vise(), d = $("#doigt"), ce = $("#cercle");
  if (!v){ d.hidden = ce.hidden = true; return; }
  let x0, y0, r = 34;
  if (v[0] === "dom"){ const el = document.querySelector(v[1]); if (!el || !el.offsetParent){ d.hidden = ce.hidden = true; return; } const b = el.getBoundingClientRect(); x0 = b.left + b.width / 2; y0 = b.top + b.height / 2; r = Math.max(b.width, b.height) / 2 + 8; }
  else [x0, y0] = ecran(v[1], v[2]);
  ce.hidden = d.hidden = false;
  ce.style.left = (x0 - r) + "px"; ce.style.top = (y0 - r) + "px"; ce.style.width = ce.style.height = (2 * r) + "px";
  const k = Math.abs(Math.sin(T * 4)) * 6; d.style.left = (x0 + 4 + k) + "px"; d.style.top = (y0 + 6 + k) + "px";
}

/* ---------- au doigt ---------- */
let drag = null;
c.addEventListener("pointerdown", e => { camCible = null; drag = {x: e.clientX, y: e.clientY, cx: camX, cy: camY, done: false}; });
addEventListener("pointermove", e => { if (!drag) return; const k = c.width / c.getBoundingClientRect().width, dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (Math.hypot(dx, dy) > 10) drag.done = true; if (drag.done){ camX = drag.cx - dx * k; camY = drag.cy - dy * k; clamp(); } });
addEventListener("pointerup", e => { const d = drag; drag = null; if (!d || d.done || !S || S.fini || pause) return;
  const r = c.getBoundingClientRect(), X = (e.clientX - r.left) / r.width * c.width + camX, Y = (e.clientY - r.top) / r.height * c.height + camY, gx = (X - M * 64) / CS, gy = (Y - M * 64) / CS;
  toucher(gx, gy); maj(); });
function toucher(gx, gy){
  if (anneau){ fermerAnneau(); return; }
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
    if (!site.b || (site.b.fini && (AMELIORABLE[site.b.k] || Object.values(B.FORME).includes(site.b.k)))){ if (ouvrirAnneau(site)) return; }
    if (!site.b){ dire("RIEN A BATIR ICI DANS CE NIVEAU"); return; }
    { const b = site.b, BB = S.P[b.k]; dire(`${BAT[b.k]}${b.fini ? "" : " EN CHANTIER " + Math.floor(b.prog / BB.travail * 100) + " %"} · PV ${Math.ceil(b.pv)}/${Math.round(B.pvBat(S, b))}${TOURS[b.k] ? (b.garnison ? " · " + ESC[b.garnison.k] + " DEDANS" : " · VIDE") : ""}`, true); }
    return;
  }
  // le château
  if (Math.abs(gx - CHATEAU[0]) < 1.25 && gy > CHATEAU[1] - 1.5 && gy < CHATEAU[1] + .55) ouvrirAnneau("chateau");
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
    const v = vitesse * ((S.sel || anneau) && ralentiOn ? S.P.jeu.ralenti : 1);
    let reste = dt0 * v; while (reste > 1e-6){ const d = Math.min(.05, reste); reste -= d; if (robotOn) B.robot(S, d); B.pas(S, d); }
    for (const e of S.evts) dire(e.txt, e.bon); S.evts.length = 0;
    majT -= dt0; if (majT <= 0){ majT = .25; maj(); }
    if (S.fini && !finVue){ finVue = true; fermerAnneau(); if (tuto) finTuto(); setTimeout(finPartie, 1500); }
  }
  if (camCible){ camX += (camCible[0] - camX) * .12; camY += (camCible[1] - camY) * .12; clamp(); if (Math.hypot(camCible[0] - camX, camCible[1] - camY) < 2) camCible = null; }
  if (pret && S){ placerCalques(); suivreTuto(T); }
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
    if (S.niveauChateau < S.P.niveaux.max && (S.c.L.niveaux || S.triche.tout)) fleche(X + 130, Y - 200, T, B.peutPayer(S, B.coutChateau(S)));
    const p = S.pv / B.pvChateau(S); if (p < .6) for (let k = 0; k < (p < .3 ? 4 : 2); k++) x.drawImage(f8(L.feu, 64, T * 10 + k * 3), Math.round(X - 100 + k * 60), Math.round(Y - 150 - (k % 2) * 40)); }]); }
  // les emplacements et les bâtiments
  for (const s of S.sites){ const [X, Y] = P(s.x, s.y), b = s.b;
    if (!b){
      list.push([Y - 400, () => { if (s.ruine) x.drawImage(L.ruine, Math.round(X - 64), Math.round(Y - 164));
        const on = anneau && anneau.cible === s; x.strokeStyle = on ? "#fff4a0" : "rgba(60,40,20,.5)"; x.lineWidth = on ? 7 : 5; x.setLineDash([14, 10]); x.beginPath(); x.ellipse(X, Y - 30, 70, 38, 0, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
        x.fillStyle = on ? "#fff4a0" : "rgba(60,40,20,.5)"; x.fillRect(X - 14, Y - 34, 28, 8); x.fillRect(X - 4, Y - 44, 8, 28); }]);
      continue; }
    const B0 = S.P[b.k], pm = B.pvBat(S, b);
    if (!b.fini){ list.push([Y, () => { if (b.k === "tourbois") batiment(L["tourbois-chantier"], X, Y, 171, 1.3); else batiment(L.chantier, X, Y, 180, 1); barre(X, Y + 4, 90, b.prog / B0.travail, "#ffd94a"); }]); continue; }
    const [nom, fy] = BATI[b.k], TT = TOUR[b.k], ech = TT ? TT.ech : 1, im = TT && TT.fs ? f8(L[nom], TT.fs, T * 6 + s.i) : L[nom];
    list.push([Y, () => { batiment(im, X, Y, fy, ech);
      if ((b.niveau || 1) > 1) etoiles(X, Y + 22, b.niveau - 1);
      if (AMELIORABLE[b.k] && (b.k === "maison" || S.c.L.niveaux || S.triche.tout) && (b.niveau || 1) < S.P.niveaux.max && !b.travaux) fleche(X + 58, Y - fy * ech + 40, T, B.peutPayer(S, B.coutNiveau(S, b)));
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
  if (S.alerte) for (const d of S.alerte){ const [a] = S.c.chemins[d], [X, Y] = P(Math.max(.4, Math.min(W - .4, a[0])), Math.max(.4, Math.min(H - .4, a[1]))), bb = Math.abs(Math.sin(T * 5)) * 18;
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
let enJeu = false;   // une vraie partie a commencé (sinon le fond du menu)
function ouvrirMenu(){ pause = true; fermerAnneau(); $("#menu").hidden = false; $("#bReprendre").hidden = !(enJeu && S && !S.fini); }
$("#bMenu").addEventListener("click", ouvrirMenu);
$("#bReprendre").addEventListener("click", () => { $("#menu").hidden = true; pause = false; last = performance.now(); });
$("#bJouer").addEventListener("click", () => { ouvrirNiveaux(); });
$("#bJouerNiv").addEventListener("click", () => { enJeu = true; });
$("#bSuivant").addEventListener("click", () => { nouvelle(niveau + 1, false); pause = false; enJeu = true; });
$("#bFinNiveaux").addEventListener("click", () => ouvrirNiveaux());
$("#bAide").addEventListener("click", () => { $("#aideTexte").hidden = !$("#aideTexte").hidden; });
$("#bRejouer").addEventListener("click", () => { nouvelle(); pause = false; });
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
$("#bLaboMenu").addEventListener("click", () => { $("#menu").hidden = true; nouvelle(4, true); enJeu = true; pause = false; last = performance.now(); });
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
$("#bAppliquer").addEventListener("click", () => { MODS = lireFormulaire(); ecrire("bastion.labo", MODS); nouvelle(4, true); enJeu = true; formulaire(); majLabo(); dire("NOUVEAUX REGLAGES", true); });
$("#bOrigine").addEventListener("click", () => { MODS = {}; ecrire("bastion.labo", MODS); formulaire(); majLabo(); nouvelle(4, true); enJeu = true; dire("REGLAGES D'ORIGINE", true); });
$("#bCopier").addEventListener("click", () => { const t = JSON.stringify(lireFormulaire()); $("#texte").value = t; try { navigator.clipboard.writeText(t).then(() => dire("REGLAGES COPIES", true), () => {}); } catch (e) {} });
$("#bCharger").addEventListener("click", () => { try { const m = JSON.parse($("#texte").value); MODS = B.ecarts(B.reglages(m)); ecrire("bastion.labo", MODS); formulaire(); majLabo(); nouvelle(4, true); enJeu = true; dire("REGLAGES CHARGES", true); } catch (e) { dire("TEXTE ILLISIBLE"); } });
// le simulateur : 30 parties jouées par le robot avec les réglages du formulaire
$("#bSimuler").addEventListener("click", () => {
  const m = lireFormulaire(), res = [], NB = 30, out = $("#simu"); let g = 0;
  out.textContent = "Simulation…";
  const tranche = () => { const t0 = performance.now(); while (g < NB && performance.now() - t0 < 40){ g++; res.push(B.simuler(m, g * 7919, 1400, 4)); }
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
Promise.all(NOMS.map(charge)).then(() => {
  ICONES.ouvrier = vignette("ouvrier-repos", 192); ICONES.tourbois = vignette("tourbois", 256);
  pret = true; nouvelle(1, false); if (tuto){ tuto = null; $("#tuto").hidden = true; } $("#banniere").classList.remove("on"); $("#chargement").hidden = true; });
requestAnimationFrame(frame);
window.Bastion = {get S(){ return S; }, get tuto(){ return tuto; }, get anneau(){ return anneau; }, B, nouvelle, toucher, ouvrirNiveaux, finTuto, avance: t => { for (let i = 0; i < t * 20; i++){ if (robotOn) B.robot(S, .05); B.pas(S, .05); } }, set robot(v){ robotOn = v; }, ouvrirLabo, fermerLabo};   // pour les essais
})();

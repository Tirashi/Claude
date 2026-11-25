/* Démineur — style Prairie (maquette 3 validée le 22/11).
   Trois modes : Classique (3 tailles, première case toujours sûre), Grande prairie (sans fin, 3 cœurs, panier),
   Défi du jour (même grille pour tous, graine = date, plus grande du lundi au dimanche, une seule tentative classée :
   la partie en cours est gardée dans demineur.jourRun et reprise au même temps ; ratée ou réussie, le jour se rejoue
   hors classement).
   Sauvegardes : demineur.best {facile, moyen, difficile: ms}, demineur.jour {aaaammjj: ms}, demineur.jourRun,
   demineur.prairie {score, dist}. Classements : best:<taille> (temps), daily:<aaaammjj> (temps), prairie (points). */
"use strict";
(function(){
const $ = id => document.getElementById(id);
const load = (k, d) => { try { const v = localStorage.getItem("demineur." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem("demineur." + k, JSON.stringify(v)); } catch (e) {} };
const vibre = ms => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} };

/* ---------- Sprites en pixel art (fabriqués une fois, gardés en images data:) ---------- */
function toile(n, fn){ const c = document.createElement("canvas"); c.width = c.height = n; const g = c.getContext("2d");
  fn((x, y, col) => { if (col){ g.fillStyle = col; g.fillRect(x, y, 1, 1); } }); return c.toDataURL(); }
function carte(rows, pal, n = 16){ const o = (n - rows[0].length) >> 1, oy = (n - rows.length) >> 1;
  return toile(n, p => rows.forEach((r, y) => [...r].forEach((ch, x) => p(x + o, y + oy, pal[ch])))); }
function mulberry(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const A = "#2a2230";
const SPR = {
  mine: carte(["....a.......", ".a..a..a....", "..aaaaa.....", ".aakwkkaa...", "aakwwkkkaa..", ".akwkkkkka..", ".akkkkkkka..", "aakkkkkkaa..", ".aakkkkaa...", "..aaaaa.....", ".a..a..a....", "....a......."], {a: "#2a2a33", k: "#3b3b48", w: "#e8e8f0"}),
  drapeau: carte(["...arr......", "...arrrr....", "...arrrrrr..", "...arrwrrrr.", "...arrrrrr..", "...arrrr....", "...arr......", "...a........", "...a........", "...a........", ".aaaaa......", "aaaaaaa....."], {a: A, r: "#e8392f", w: "#ff9a8a"}),
  pelle: carte(["........aa..", ".......abba.", "......abbba.", ".....abbba..", "....aaaba...", "...aw.a.....", "..aw........", ".aw.........", "aw..........", "a..........."], {a: A, b: "#c8d0e0", w: "#9a6a3a"}),
  coeur: carte([".aa.aa.", "arrarra", "arwrrra", "arrrrra", ".arrra.", "..ara..", "...a..."], {a: A, r: "#ff4d5e", w: "#ffc0c8"}, 8),
  fleur: carte(["...aaa....", "..abbba...", ".abbbbba..", ".abbyybba.", ".abbyybba.", "..abbbba..", "...aaga...", "....ag.a..", "....agga..", "....ag...."], {a: A, b: "#ff8fc8", y: "#ffd23f", g: "#3f9a3a"}, 12),
  cerises: carte([".......aa...", "......aga...", ".....a..a...", "....a....a..", "..aaa...aaa.", ".arrra.arrra", ".arwra.arwra", ".arrra.arrra", "..aaa...aaa."], {a: A, g: "#3f9a3a", r: "#e8283c", w: "#ffb0b8"}),
  oeuf: carte(["....aaaa....", "...ayyyya...", "..ayywyyya..", "..aywyyyya..", ".ayyyyyyyya.", ".ayyyyyyyya.", ".ayyyyyooya.", "..ayyyyooa..", "...aaaaaa..."], {a: "#6b4a10", y: "#ffd23f", w: "#fff6c0", o: "#e0a020"}),
  trefle: carte(["..aa..aa..", ".agga.agga", ".aggaagga.", "..aggggga.", ".aggaagga.", ".agga.agga", "..aa.a.aa.", ".....a....", "....a....."], {a: "#1f5a22", g: "#5ccf4a"}, 12)
};
const BIOMES = [
  {nom: "Prairie", base: "#6cbf4b", hi: "#a6e67a", lo: "#3d8532", tex: "#4fa33c", tex2: "#8fd862", ouv: "#e3c896", ouvT: "#d2b37b"},
  {nom: "Champ de fleurs", base: "#7ccb5c", hi: "#b4ec8c", lo: "#468c38", tex: "#5bab45", tex2: "#a2e077", ouv: "#e6cc9c", ouvT: "#d6b984", fleurs: true},
  {nom: "Verger", base: "#4f9e45", hi: "#84cf6a", lo: "#2f6b2c", tex: "#3f8a39", tex2: "#73bf5c", ouv: "#d9bb85", ouvT: "#c8a66e"},
  {nom: "Automne", base: "#c9a640", hi: "#ead170", lo: "#8a6a22", tex: "#b08f30", tex2: "#f0dc80", ouv: "#d4ae80", ouvT: "#c39a6a"}
];
function tuile(b, v, ouverte){
  const r = mulberry(11 + v * 97 + (ouverte ? 500 : 0));
  return toile(16, p => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++){
      if ((x === 0 || x === 15) && (y === 0 || y === 15)) continue;
      let c;
      if (ouverte){ c = b.ouv; if (r() < .1) c = b.ouvT; if (y === 0 || x === 0) c = b.ouvT; }
      else { c = b.base; if (y === 0 || x === 0 || (y === 1 && x < 14) || (x === 1 && y < 14)) c = b.hi; if (y === 15 || x === 15 || (y === 14 && x > 1) || (x === 14 && y > 1)) c = b.lo; }
      p(x, y, c);
    }
    if (!ouverte){
      for (let k = 0; k < 7; k++){ const x = 2 + (r() * 12 | 0), y = 3 + (r() * 9 | 0); p(x, y, b.tex); p(x, y + 1, b.tex); p(x + 1, y - 1, b.tex2); }
      if (b.fleurs && v % 2 === 0){ const x = 3 + (r() * 9 | 0), y = 3 + (r() * 8 | 0), f = v === 0 ? "#ff8fc8" : "#fff"; p(x, y, f); p(x + 1, y, f); p(x, y + 1, f); p(x + 1, y + 1, "#ffd23f"); }
    } else for (let k = 0; k < 3; k++) p(2 + (r() * 12 | 0), 2 + (r() * 12 | 0), "#a88550");
  });
}
let css = "";
for (const k in SPR) css += `i.${k}{background-image:url(${SPR[k]})}`;
BIOMES.forEach((b, i) => { for (let v = 0; v < 4; v++) css += `.c.g${i}${v}{background-image:url(${tuile(b, v, false)})}.c.d${i}${v}{background-image:url(${tuile(b, v, true)})}`; });
const feuille = document.createElement("style"); feuille.textContent = css; document.head.appendChild(feuille);

/* ---------- Tailles, défi du jour ---------- */
const TAILLES = {facile: {nom: "Facile", w: 8, h: 10, m: 10}, moyen: {nom: "Moyen", w: 12, h: 18, m: 35}, difficile: {nom: "Difficile", w: 16, h: 26, m: 80}};
// du dimanche (0) au samedi : la grille grandit du lundi au dimanche
const JOURS = [{w: 16, h: 26, m: 80}, {w: 8, h: 10, m: 10}, {w: 9, h: 12, m: 15}, {w: 10, h: 14, m: 22}, {w: 11, h: 16, m: 30}, {w: 12, h: 18, m: 40}, {w: 14, h: 22, m: 56}];
const NOMJ = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const cleJour = (d = new Date()) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
const dateDe = k => new Date(Math.floor(k / 10000), Math.floor(k / 100) % 100 - 1, k % 100, 12);
const tailleDuJour = k => JOURS[dateDe(k).getDay()];
const mmss = ms => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const enPaysage = () => innerWidth > innerHeight * 1.15;
const voisins8 = (x, y, w, h) => { const r = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ if (!dx && !dy) continue; const a = x + dx, b = y + dy; if (a >= 0 && b >= 0 && a < w && b < h) r.push(b * w + a); } return r; };

/** Grille du jour, en portrait : mines tirées avec la date pour graine, case de départ = case vide la plus proche du centre. */
function grilleDuJour(k){
  const t = tailleDuJour(k), n = t.w * t.h;
  for (let s = 0; ; s++){
    const r = mulberry(k * 31 + s), idx = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--){ const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    const mines = new Set(idx.slice(0, t.m));
    let depart = -1, bd = 1e9;
    for (let i = 0; i < n; i++){
      if (mines.has(i)) continue;
      const x = i % t.w, y = (i / t.w) | 0;
      if (voisins8(x, y, t.w, t.h).some(v => mines.has(v))) continue;
      const d = (x - (t.w - 1) / 2) ** 2 + (y - (t.h - 1) / 2) ** 2;
      if (d < bd){ bd = d; depart = i; }
    }
    if (depart >= 0) return {w: t.w, h: t.h, m: t.m, mines: [...mines].sort((a, b) => a - b), depart};
  }
}

/* ---------- État commun ---------- */
const G = $("grille"), Z = $("zone");
let mode = null;            // "classique" | "jour" | "prairie"
let marque = false;         // bouton Drapeau enfoncé
let F = null;               // partie à grille finie (classique, jour)
let P = null;               // Grande prairie
let dernier = performance.now(), quitter = 0;

function message(html, boutons){
  const m = $("msg"); m.innerHTML = html + (boutons ? `<div class="boutons">${boutons.map((b, i) => `<button type="button" data-b="${i}" class="${b[2] || ""}">${b[0]}</button>`).join("")}</div>` : "");
  m.classList.add("vu"); m.classList.toggle("bloque", !!boutons);
  if (boutons){ const t0 = performance.now(); m.querySelectorAll("button").forEach(b => b.onclick = () => { if (performance.now() - t0 < 400) return; cacherMessage(); boutons[+b.dataset.b][1](); }); }
}
function cacherMessage(){ $("msg").classList.remove("vu", "bloque"); }
function journal(t){ $("journal").textContent = t; }
function boutonMode(){ const b = $("b-mode"); b.classList.toggle("on", marque);
  b.innerHTML = marque ? '<i class="spr drapeau"></i> Drapeau' : '<i class="spr pelle"></i> Creuser'; }
const chiffre = n => n ? `<span class="n${Math.min(n, 8)}">${n}</span>` : "";

/* ---------- Grille finie (classique et défi du jour) ---------- */
function nouvelleGrille(opt){
  // opt : {taille} | {jour, horsClasse, run}
  const land = opt.run ? !!opt.run.land : enPaysage();
  let w, h, m, mines = null, depart = -1;
  if (opt.jour){ const g = grilleDuJour(opt.jour); ({w, h, m} = g); mines = g.mines; depart = g.depart; }
  else ({w, h, m} = TAILLES[opt.taille]);
  const W = land ? h : w, H = land ? w : h;
  const conv = i => land ? (i % w) * h + ((i / w) | 0) : i;     // portrait → affichage
  F = {taille: opt.taille || null, jour: opt.jour || 0, horsClasse: !!opt.horsClasse, land, W, H, M: m,
       cases: Array.from({length: W * H}, (_, i) => ({m: 0, n: 0, o: false, f: false, v: (i * 7 + ((i / W) | 0) * 3) % 4})),
       fini: false, lance: false, elapsed: 0};
  if (mines){ mines.forEach(i => F.cases[conv(i)].m = 1); calculer(); }
  if (opt.run){
    F.elapsed = opt.run.el || 0;
    [...(opt.run.o || "")].forEach((c, i) => { if (c === "1" && F.cases[i]) F.cases[i].o = true; });
    [...(opt.run.f || "")].forEach((c, i) => { if (c === "1" && F.cases[i]) F.cases[i].f = true; });
  } else if (depart >= 0) ouvrir(conv(depart));
  mode = opt.jour ? "jour" : "classique";
  afficherJeu();
  $("titre").textContent = opt.jour ? `Défi du ${NOMJ[dateDe(opt.jour).getDay()]}` + (F.horsClasse ? " · hors classement" : "") : TAILLES[opt.taille].nom;
  $("b-neuf").hidden = !!opt.jour && !F.horsClasse;
  journal(opt.jour ? (F.horsClasse ? "Grille du jour rejouée hors classement." : opt.run ? `Partie reprise à ${mmss(F.elapsed)}.` : "Une seule tentative classée : le chrono part à ta première touche.")
                   : `${m} mines · la première case est toujours sûre`);
  dimensionner(); dessinerGrille();
  if (opt.jour && !F.horsClasse) garderRun();
}
function vois(i){ return voisins8(i % F.W, (i / F.W) | 0, F.W, F.H); }
function calculer(){ F.cases.forEach((c, i) => c.n = vois(i).reduce((s, v) => s + F.cases[v].m, 0)); }
function placer(sur){   // classique : mines tirées à la première touche, jamais sur elle ni autour
  const non = new Set([sur, ...vois(sur)]), l = F.cases.map((_, i) => i).filter(i => !non.has(i));
  for (let i = l.length - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [l[i], l[j]] = [l[j], l[i]]; }
  for (let k = 0; k < F.M; k++) F.cases[l[k]].m = 1;
  calculer();
}
function ouvrir(i){ const p = [i]; while (p.length){ const k = p.pop(), c = F.cases[k]; if (c.o || c.m) continue; c.o = true; c.f = false; if (!c.n) vois(k).forEach(v => { if (!F.cases[v].o) p.push(v); }); } }
function creuser(i){ const c = F.cases[i]; if (c.m){ c.boum = true; c.o = true; perdu(); } else ouvrir(i); }
function taperGrille(i){
  if (!F || F.fini) return;
  const c = F.cases[i];
  if (!F.lance){ if (mode === "classique") placer(i); F.lance = true; dernier = performance.now(); }
  if (c.f) return;
  if (c.o){ const v = vois(i); if (c.n && v.filter(k => F.cases[k].f).length === c.n) v.forEach(k => { if (!F.fini && !F.cases[k].f && !F.cases[k].o) creuser(k); }); }
  else creuser(i);
  if (!F.fini && F.cases.every(c => c.m || c.o)) gagne();
  if (mode === "jour" && !F.horsClasse && !F.fini) garderRun();
  dessinerGrille();
}
function marquerGrille(i){ if (!F || F.fini || F.cases[i].o) return; F.cases[i].f = !F.cases[i].f; vibre(12);
  if (mode === "jour" && !F.horsClasse) garderRun(); dessinerGrille(); }
function perdu(){
  F.fini = true; vibre(120);
  F.cases.forEach(c => { if (c.m) c.o = true; else if (c.f) c.faux = true; });
  if (mode === "jour" && !F.horsClasse){
    garderRun(true);
    message("<big>Boum !</big>Raté pour aujourd'hui.<small>Tu peux rejouer la grille du jour, mais hors classement. Rendez-vous demain !</small>",
      [["Menu", menu], ["Rejouer hors classement", () => lancerJour(), "accent"]]);
  } else message("<big>Boum !</big>Une mine était cachée là.", [["Menu", menu], ["Rejouer", rejouer, "accent"]]);
}
function gagne(){
  F.fini = true; vibre([30, 40, 30]);
  F.cases.forEach(c => { if (c.m) c.f = true; });
  const ms = Math.max(1, Math.round(F.elapsed));
  if (mode === "jour"){
    let txt = `<big>${mmss(ms)}</big>Défi du ${NOMJ[dateDe(F.jour).getDay()]} réussi !`;
    if (!F.horsClasse){
      const j = load("jour", {}) || {}; j[F.jour] = ms; save("jour", j); save("jourRun", null);
      message(txt + '<small id="rang">Envoi au classement…</small>', [["Menu", menu, "accent"]]);
      envoyer("daily:" + F.jour, ms, true);
    } else message(txt + "<small>Hors classement.</small>", [["Menu", menu, "accent"]]);
  } else {
    const b = load("best", {}) || {}, rec = !b[F.taille] || ms < b[F.taille];
    if (rec){ b[F.taille] = ms; save("best", b); }
    message(`<big>${mmss(ms)}</big>${rec ? "Nouveau record en " : "Terrain dégagé en "}${TAILLES[F.taille].nom.toLowerCase()} !<small id="rang">${rec ? "" : "Record : " + mmss(b[F.taille])}</small>`,
      [["Menu", menu], ["Rejouer", rejouer, "accent"]]);
    if (rec) envoyer("best:" + F.taille, ms, true);
  }
}
function envoyer(board, v, low){
  if (!window.LudoScores) { const r = $("rang"); if (r && /Envoi/.test(r.textContent)) r.textContent = ""; return; }
  Promise.resolve(LudoScores.submit("demineur", board, v, low)).then(r => { const e = $("rang"); if (e) e.textContent = r ? "Classement : " + LudoScores.rankText(r) : ""; })
    .catch(() => { const e = $("rang"); if (e) e.textContent = ""; });
}
function garderRun(rate){
  if (!F || mode !== "jour" || F.horsClasse) return;
  save("jourRun", {day: F.jour, land: F.land, el: Math.round(F.elapsed), perdu: !!rate,
    o: F.cases.map(c => c.o ? 1 : 0).join(""), f: F.cases.map(c => c.f ? 1 : 0).join("")});
}
function dessinerGrille(){
  $("pastille").innerHTML = `<i class="spr mine"></i>${F.M - F.cases.filter(c => c.f).length}`;
  $("chrono").textContent = mmss(F.elapsed);
  G.innerHTML = F.cases.map((c, i) => {
    let cl = "c", h = "";
    if (c.o){ cl += " d0" + c.v; if (c.m){ if (c.boum) cl += " boum"; h = '<i class="spr mine"></i>'; } else h = chiffre(c.n); }
    else { cl += " g0" + c.v; if (c.f){ h = '<i class="spr drapeau"></i>'; if (c.faux) cl += " faux"; } }
    return `<div class="${cl}" data-i="${i}">${h}</div>`;
  }).join("");
}

/* ---------- Grande prairie ---------- */
const PW = 10, ETAPE = 25;
const densite = r => Math.min(.24, .13 + Math.floor(r / ETAPE) * .025);
function nouvellePrairie(){
  P = {graine: (Math.random() * 1e9) | 0, lignes: [], coeurs: 3, loin: 0, panier: {fleur: 0, cerises: 0, oeuf: 0}, fini: false, elapsed: 0};
  mode = "prairie"; afficherJeu();
  $("titre").textContent = "Grande prairie"; $("b-neuf").hidden = false;
  journal("Descends dans la prairie : fais défiler vers le bas.");
  dimensionner(); ouvrirP(1, 4); Z.scrollTop = 0; dessinerPrairie();
}
function genere(r){
  const rnd = mulberry(P.graine * 7919 + r * 131 + 1), L = [];
  for (let x = 0; x < PW; x++){
    const sur = r < 4 && x >= 2 && x <= 7, m = !sur && rnd() < densite(r);
    let it = null;
    if (!m){ const q = rnd(); it = q < .006 ? "trefle" : q < .014 ? "oeuf" : q < .04 ? "cerises" : q < .11 ? "fleur" : null; }
    L.push({m: m ? 1 : 0, it, o: false, f: false, n: -1, v: (x * 7 + r * 3) % 4});
  }
  return L;
}
const assure = r => { while (P.lignes.length <= r) P.lignes.push(genere(P.lignes.length)); };
const cell = (r, x) => (assure(r), P.lignes[r][x]);
const voisP = (r, x) => { const v = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++){ if (!dx && !dy) continue; const a = x + dx, b = r + dy; if (a >= 0 && a < PW && b >= 0) v.push([b, a]); } return v; };
const nb = (r, x) => { const c = cell(r, x); if (c.n < 0) c.n = voisP(r, x).reduce((s, [b, a]) => s + cell(b, a).m, 0); return c.n; };
const scoreP = () => P.loin + P.panier.fleur + P.panier.cerises * 3 + P.panier.oeuf * 10;
function ramasser(c){
  if (!c.it) return; c.pop = Date.now();
  if (c.it === "trefle"){ if (P.coeurs < 5){ P.coeurs++; journal("Un trèfle à quatre feuilles : +1 cœur !"); } else journal("Un trèfle à quatre feuilles (tes cœurs sont déjà au complet)."); }
  else P.panier[c.it]++;
  setTimeout(() => { if (mode === "prairie") dessinerPrairie(); }, 850);
}
function ouvrirP(r, x){
  const p = [[r, x]];
  while (p.length){
    const [b, a] = p.pop(), c = cell(b, a); if (c.o || c.m) continue;
    c.o = true; c.f = false; ramasser(c);
    if (b > P.loin){ const avant = Math.floor(P.loin / ETAPE); P.loin = b; const ap = Math.floor(P.loin / ETAPE);
      if (ap > avant){ const bi = BIOMES[ap % 4]; message(`<big>${ap * ETAPE} m</big>${bi.nom} · les mines se resserrent`); setTimeout(() => { if (!$("msg").classList.contains("bloque")) cacherMessage(); }, 1800); } }
    if (nb(b, a) === 0) voisP(b, a).forEach(([bb, aa]) => { if (!cell(bb, aa).o) p.push([bb, aa]); });
  }
}
function mineP(r, x){
  const c = cell(r, x); c.o = true; c.boum = true; P.coeurs--; vibre(100);
  if (P.coeurs > 0){ journal(`Aïe, une mine ! Plus que ${P.coeurs} cœur${P.coeurs > 1 ? "s" : ""}.`); return; }
  P.fini = true;
  const sc = scoreP(), rec = load("prairie", {}) || {}, nouveau = sc > (rec.score || 0);
  if (nouveau) save("prairie", {score: sc, dist: P.loin});
  message(`<big>${sc} points</big>${nouveau ? "Nouveau record ! " : ""}${P.loin} m parcourus<small>${P.panier.fleur} fleurs · ${P.panier.cerises} cerises · ${P.panier.oeuf} œufs d'or</small><small id="rang"></small>`,
    [["Menu", menu], ["Recommencer", rejouer, "accent"]]);
  if (nouveau) envoyer("prairie", sc, false);
}
function taperP([r, x]){
  if (!P || P.fini) return; const c = cell(r, x); if (c.f) return;
  if (c.o){ if (c.m) return;
    const v = voisP(r, x), n = nb(r, x), f = v.filter(([b, a]) => { const k = cell(b, a); return k.f || k.boum; }).length;
    if (n && f === n) v.forEach(([b, a]) => { const k = cell(b, a); if (!P.fini && !k.o && !k.f){ if (k.m) mineP(b, a); else ouvrirP(b, a); } });
  } else if (c.m) mineP(r, x); else ouvrirP(r, x);
  dessinerPrairie();
}
function marquerP([r, x]){ if (!P || P.fini) return; const c = cell(r, x); if (c.o) return; c.f = !c.f; vibre(12); dessinerPrairie(); }
function dessinerPrairie(){
  const fin = P.loin + 14; assure(fin + 1);
  $("pastille").textContent = P.loin + " m"; $("chrono").textContent = scoreP() + " pts";
  $("coeurs").innerHTML = Array.from({length: Math.max(3, P.coeurs)}, (_, k) => `<i class="spr coeur${k < P.coeurs ? "" : " vide"}"></i>`).join("");
  $("pf").textContent = P.panier.fleur; $("pc").textContent = P.panier.cerises; $("po").textContent = P.panier.oeuf;
  const k = Math.floor(P.loin / ETAPE); $("bnom").textContent = BIOMES[k % 4].nom; $("bsuite").textContent = `prochain paysage à ${(k + 1) * ETAPE} m`;
  const now = Date.now(); let h = "";
  for (let r = 0; r <= fin; r++){ const bi = Math.floor(r / ETAPE) % 4;
    for (let x = 0; x < PW; x++){ const c = P.lignes[r][x]; let cl = "c", d = "";
      if (c.o){ cl += ` d${bi}${c.v}`; if (c.boum){ cl += " boum"; d = '<i class="spr mine"></i>'; } else { d = chiffre(nb(r, x)); if (c.pop && now - c.pop < 800) d += `<i class="spr pop ${c.it}"></i>`; } }
      else { cl += ` g${bi}${c.v}`; if (c.f) d = '<i class="spr drapeau"></i>'; else if (P.fini && c.m) d = '<i class="spr mine" style="opacity:.6"></i>'; }
      h += `<div class="${cl}" data-r="${r}" data-x="${x}">${d}</div>`; } }
  G.innerHTML = h;
}

/* ---------- Écrans ---------- */
function afficherJeu(){
  cacherMessage(); marque = false; boutonMode(); quitter = 0;
  $("menu").hidden = true; $("jeu").hidden = false;
  const pr = mode === "prairie";
  $("hud").hidden = !pr; $("biome").hidden = !pr; Z.classList.toggle("defile", pr);
}
function dimensionner(){
  const larg = Z.clientWidth - 16, haut = Z.clientHeight;
  let t;
  if (mode === "prairie") t = Math.min(46, Math.floor((larg - 12 - 2 * (PW - 1)) / PW));
  else t = Math.max(14, Math.min(46, Math.floor(Math.min((larg - 12 - 2 * (F.W - 1)) / F.W, (haut - 16 - 2 * (F.H - 1)) / F.H))));
  G.style.gridTemplateColumns = `repeat(${mode === "prairie" ? PW : F.W},${t}px)`; G.style.gridAutoRows = t + "px"; G.style.fontSize = Math.round(t * .62) + "px";
}
function menu(){
  if (mode === "jour" && F && !F.fini) garderRun();
  mode = null; F = null; P = null; cacherMessage();
  $("jeu").hidden = true; $("menu").hidden = false; majMenu();
  if (location.hash) history.replaceState(null, "", location.pathname);
}
function rejouer(){ if (mode === "prairie") nouvellePrairie(); else if (mode === "jour") lancerJour(); else if (F) nouvelleGrille({taille: F.taille}); }
function runDuJour(){ const r = load("jourRun", null); return r && r.day === cleJour() ? r : null; }
function lancerJour(){
  const k = cleJour(), fait = (load("jour", {}) || {})[k] > 0, run = runDuJour();
  if (fait || (run && run.perdu)) nouvelleGrille({jour: k, horsClasse: true});
  else nouvelleGrille({jour: k, run});
}
function majMenu(){
  const b = load("best", {}) || {};
  $("tailles").innerHTML = Object.entries(TAILLES).map(([k, t]) =>
    `<button type="button" data-t="${k}"><b>${t.nom}</b><span>${t.w}×${t.h} · ${t.m} mines</span><em>${b[k] ? mmss(b[k]) : "—"}</em></button>`).join("");
  $("tailles").querySelectorAll("button").forEach(x => x.onclick = () => nouvelleGrille({taille: x.dataset.t}));
  const p = load("prairie", {}) || {};
  $("b-prairie").innerHTML = `<div><b>Explorer</b><span>${p.score ? `record ${p.dist} m` : "sans fin, trois cœurs"}</span></div><em>${p.score ? p.score + " pts" : "Jouer"}</em>`;
  const k = cleJour(), t = tailleDuJour(k), fait = (load("jour", {}) || {})[k], run = runDuJour();
  const etat = fait ? `Réussi · ${mmss(fait)}` : run && run.perdu ? "Raté" : run ? `En cours · ${mmss(run.el || 0)}` : "Jouer";
  const bj = $("b-jour"); bj.classList.toggle("accent", !fait && !(run && run.perdu)); bj.classList.toggle("fait", !!fait || !!(run && run.perdu));
  bj.innerHTML = `<div><b>Défi du ${NOMJ[new Date().getDay()]}</b><span>${t.w}×${t.h} · ${t.m} mines${fait || (run && run.perdu) ? " · rejouer hors classement" : ""}</span></div><em>${etat}</em>`;
}

/* ---------- Touches : tape = creuser, appui long / clic droit / bouton = drapeau ---------- */
let appui = null, long = false, x0 = 0, y0 = 0;
const quelle = e => { const el = e.target.closest(".c"); if (!el) return null; return mode === "prairie" ? [+el.dataset.r, +el.dataset.x] : +el.dataset.i; };
const taper = q => mode === "prairie" ? taperP(q) : taperGrille(q);
const marquer = q => mode === "prairie" ? marquerP(q) : marquerGrille(q);
G.addEventListener("pointerdown", e => {
  if (e.button === 2) return; const q = quelle(e); if (q == null) return;
  long = false; x0 = e.clientX; y0 = e.clientY; clearTimeout(appui);
  appui = setTimeout(() => { long = true; marquer(q); }, 380);
});
G.addEventListener("pointermove", e => { if (Math.abs(e.clientX - x0) + Math.abs(e.clientY - y0) > 10) clearTimeout(appui); });
["pointerup", "pointerleave", "pointercancel"].forEach(n => G.addEventListener(n, () => clearTimeout(appui)));
G.addEventListener("click", e => { const q = quelle(e); if (q == null || long) return; quitter = 0; if (marque) marquer(q); else taper(q); });
G.addEventListener("contextmenu", e => { e.preventDefault(); if (e.pointerType === "touch") return; const q = quelle(e); if (q != null && !long) marquer(q); });
$("b-mode").onclick = () => { marque = !marque; boutonMode(); };
$("b-neuf").onclick = rejouer;
$("b-menu").onclick = () => {
  if (mode === "prairie" && P && !P.fini && P.loin > 1 && !quitter){ quitter = 1; journal("Touche encore ◀ Menu pour quitter : la prairie en cours sera perdue."); return; }
  menu();
};
$("b-prairie").onclick = nouvellePrairie;
$("b-jour").onclick = lancerJour;
document.addEventListener("keydown", e => { if (e.key === "Escape" && mode) $("b-menu").click(); if ((e.key === "f" || e.key === "F") && mode){ marque = !marque; boutonMode(); } });

// chrono (seulement page visible, après la première touche)
setInterval(() => {
  const t = performance.now(), dt = t - dernier; dernier = t;
  if (document.hidden || !F || F.fini || !F.lance || mode === "prairie") return;
  F.elapsed += Math.min(dt, 1000); $("chrono").textContent = mmss(F.elapsed);
}, 250);
document.addEventListener("visibilitychange", () => { dernier = performance.now(); if (document.hidden && mode === "jour") garderRun(); });
addEventListener("pagehide", () => { if (mode === "jour") garderRun(); });
addEventListener("resize", () => { if (mode === "prairie" || F){ dimensionner(); } });

window.Demineur = {grilleDuJour, tailleDuJour, cleJour, TAILLES, JOURS,
  etat: () => ({mode, F, P}), nouvelleGrille, nouvellePrairie, lancerJour, menu, taper, marquer};

majMenu();
if (location.hash === "#jour") lancerJour();
else if (location.hash === "#prairie") nouvellePrairie();
})();

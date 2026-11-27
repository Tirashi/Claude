/* Pokédex de la Ludothèque : la liste des 1025 Pokémon, leurs fiches et le calcul des types.
   Données lues sur les dépôts de PokéAPI (raw.githubusercontent.com/PokeAPI) :
   - liste : pokeapi/…/csv/pokemon_species_names.csv (noms français) + pokemon_types.csv (types) ;
   - fiche : api-data/…/pokemon-species/<n>/ (description, espèce) + evolution-chain/<id>/ (évolutions) ;
   - images : sprites/…/official-artwork/<n>.png.
   Tout est gardé dans le navigateur (localStorage ; le service worker garde aussi les fichiers) pour marcher hors ligne.
   Adresses : #p25 = fiche de Pikachu, #types = calcul des types, rien = la liste. */
(function () {
"use strict";
const D = window.PokedexDonnees;
const RAW = "https://raw.githubusercontent.com/PokeAPI/";
const CSV = RAW + "pokeapi/master/data/v2/csv/";
const API = RAW + "api-data/master/data/api/v2/";
const DESSIN = n => RAW + "sprites/master/sprites/pokemon/other/official-artwork/" + n + ".png";
const MAX = 1025;

/* ---------- sauvegardes ---------- */
const lire = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

/* ---------- outils ---------- */
const plat = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const num3 = n => String(n).padStart(3, "0");
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const ico = (t, cls = "ico") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${D.ICONES[t]}</svg>`;
const puce = (t, extra = "") => `<span class="puce" style="--c:${D.COULEURS[t]}">${ico(t)}${t}${extra}</span>`;
const bulle = t => `<span class="bulle" style="--c:${D.COULEURS[t]}" title="${t}">${ico(t)}</span>`;
const fondType = types => types.length > 1
  ? `linear-gradient(135deg, ${D.COULEURS[types[0]]} 0 50%, ${D.COULEURS[types[1]]} 50% 100%)`
  : `linear-gradient(160deg, color-mix(in srgb, ${D.COULEURS[types[0]]} 70%, white), ${D.COULEURS[types[0]]})`;
const image = (n, alt = "") => `<img src="${DESSIN(n)}" alt="${esc(alt)}" loading="lazy" decoding="async" crossorigin="anonymous">`;
const SVG_LOUPE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21"/></svg>`;
const SVG_LIVRE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20"/></svg>`;
const SVG_ECLAIR = `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M13.5 2L5 13h5.5L9.5 22 19 10.5h-5.5z"/></svg>`;
const SVG_EQUIPE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.5 19a5.5 5.5 0 0 1 11 0M14.5 19a4 4 0 0 1 7.5-1.5"/></svg>`;
const SVG_QUIZ = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.5"/><path d="M9.2 9.5a2.8 2.8 0 1 1 4 2.5c-.8.5-1.2 1-1.2 2M12 17.2v.1"/></svg>`;
const SVG_FLECHE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

// une ligne de CSV (champs entre guillemets possibles)
function champs(ligne) {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (q) { if (c === '"') { if (ligne[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur); return out;
}
async function texte(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.text(); }
async function json(url) { const r = await fetch(url); if (!r.ok) throw new Error(r.status); return r.json(); }

/* ---------- la liste des Pokémon (gardée 30 jours) ---------- */
const CLE_LISTE = "pokedex.liste";
let LISTE = null;   // [{n, nom, types: [..]}]
function deplier(l) { return l.map(([n, nom, t]) => ({ n, nom, types: t.split(".").map(i => D.TYPES[i - 1]), cle: plat(nom) })); }
async function chargerListe() {
  const [noms, types] = await Promise.all([texte(CSV + "pokemon_species_names.csv"), texte(CSV + "pokemon_types.csv")]);
  const nom = {}, typ = {};
  for (const l of noms.split("\n").slice(1)) { const c = champs(l.trim()); if (c[1] === "5" && +c[0] <= MAX) nom[+c[0]] = c[2]; }
  for (const l of types.split("\n").slice(1)) { const c = l.trim().split(","); const n = +c[0]; if (n >= 1 && n <= MAX) (typ[n] = typ[n] || [])[+c[2] - 1] = +c[1]; }
  const l = [];
  for (let n = 1; n <= MAX; n++) if (nom[n] && typ[n]) l.push([n, nom[n], typ[n].filter(Boolean).join(".")]);
  if (l.length < 1000) throw new Error("liste incomplète");
  ecrire(CLE_LISTE, { t: Date.now(), l });
  return deplier(l);
}

/* ---------- une fiche : description, espèce et évolutions ---------- */
const FICHES = lire("pokedex.fiches", {});     // n -> {d: description, e: espèce, c: n° de chaîne}
const CHAINES = lire("pokedex.chaines", {});   // id -> arbre [n, condition, [enfants]]
const idDe = url => +url.split("/").filter(Boolean).pop();
function propre(s) { return s.replace(/[\n\f\r­]+/g, " ").replace(/\s+/g, " ").replace(/ ([!?;:])/g, " $1").trim(); }
async function chargerFiche(n) {
  if (!FICHES[n]) {
    const e = await json(API + "pokemon-species/" + n + "/index.json");
    const fr = e.flavor_text_entries.filter(f => f.language.name === "fr");
    const g = e.genera.find(x => x.language.name === "fr");
    FICHES[n] = { d: fr.length ? propre(fr[fr.length - 1].flavor_text) : "", e: g ? g.genus : "", c: e.evolution_chain ? idDe(e.evolution_chain.url) : 0 };
    ecrire("pokedex.fiches", FICHES);
  }
  const f = FICHES[n];
  if (f.c && !CHAINES[f.c]) {
    const c = await json(API + "evolution-chain/" + f.c + "/index.json");
    const arbre = noeud => [idDe(noeud.species.url), D.condition(noeud.evolution_details), noeud.evolves_to.map(arbre).filter(x => x[0] <= MAX)];
    CHAINES[f.c] = arbre(c.chain);
    ecrire("pokedex.chaines", CHAINES);
  }
  return f;
}

/* ---------- les jeux : quels Pokémon dans quel jeu, évolutions, légendaires (gardés dans le navigateur) ---------- */
let ESP = lire("pokedex.esp", null);   // n -> pré-évolution * 8 + drapeaux (1 bébé, 2 légendaire, 4 fabuleux)
let DEX = lire("pokedex.dex", null);   // n° de Pokédex régional -> [n° nationaux]
async function chargerJeux() {
  const ids = new Set(); D.JEUX.forEach(j => (j.dex || []).forEach(i => ids.add(i)));
  const [esp, dex] = await Promise.all([texte(CSV + "pokemon_species.csv"), texte(CSV + "pokemon_dex_numbers.csv")]);
  const e = [];
  for (const l of esp.split("\n").slice(1)) { const c = l.trim().split(","); const n = +c[0]; if (n >= 1 && n <= MAX) e[n] = (+c[3] || 0) * 8 + (+c[11] ? 1 : 0) + (+c[16] ? 2 : 0) + (+c[17] ? 4 : 0); }
  const d = {};
  for (const l of dex.split("\n").slice(1)) { const c = l.trim().split(","); const n = +c[0], p = +c[1]; if (ids.has(p) && n >= 1 && n <= MAX) (d[p] = d[p] || []).push(n); }
  if (e.filter(x => x !== undefined).length < 1000 || Object.keys(d).length < ids.size) throw new Error("jeux incomplets");
  ESP = e.map(x => x || 0); DEX = d;
  ecrire("pokedex.esp", ESP); ecrire("pokedex.dex", DEX);
}

/* ---------- l'équipe ---------- */
const jeuDe = id => D.JEUX.find(j => j.id === id) || D.JEUX[0];
// les Pokémon qu'on peut avoir dans ce jeu
function dispo(jeu) {
  const j = jeuDe(jeu);
  if (!j.dex) return LISTE.map(p => p.n);
  const s = new Set(); j.dex.forEach(i => (DEX[i] || []).forEach(n => s.add(n)));
  return [...s].sort((x, y) => x - y);
}
// ceux qu'on propose à la génération : dernière évolution du jeu, ni bébé ni légendaire (sauf si demandé)
function candidats(jeu, legendaires) {
  const l = dispo(jeu), peres = new Set();
  l.forEach(n => { const f = ESP[n] >> 3; if (f) peres.add(f); });
  return l.filter(n => !peres.has(n) && !(ESP[n] & 1) && (legendaires || !(ESP[n] & 6)));
}
// note d'une équipe selon les objectifs cochés (def, att, var) ; sans objectif : 0 (donc tirage au hasard)
function noter(ns, obj) {
  const T = ns.map(n => parNum(n).types);
  let s = 0;
  if (obj.def) for (const a of D.ORDRE) {
    let w = 0, r = 0;
    for (const t of T) { const m = D.mult(a, t); if (m >= 4) w += 2; else if (m > 1) w++; else if (m === 0) r += 1.5; else if (m < 1) r++; }
    s += Math.min(r, 2) * .6 - w * .8 - (w >= 4 ? 5 : w === 3 ? 3 : w === 2 ? 1.2 : 0);
  }
  if (obj.att) {
    for (const d of D.ORDRE) { const k = T.filter(t => t.some(a => D.mult1(a, d) > 1)).length; s += k ? 1.2 + Math.min(k - 1, 2) * .3 : -1.5; }
  }
  if (obj.var) { const vus = {}; for (const t of T) for (const x of t) { if (vus[x]) s -= 1.5; vus[x] = 1; } }
  return s;
}
function generer(complete) {
  const garde = complete ? S.eq.m.filter(Boolean) : [];
  const libres = 6 - garde.length; if (!libres) return;
  const cand = candidats(S.eq.jeu, S.eq.leg).filter(n => !garde.includes(n));
  if (cand.length < libres) return;
  let meilleur = null, ms = -1e9;
  for (let r = 0; r < 12; r++) {
    const m = cand.slice(); for (let i = 0; i < libres; i++) { const j = i + Math.random() * (m.length - i) | 0; [m[i], m[j]] = [m[j], m[i]]; }
    let eq = garde.concat(m.slice(0, libres)), sc = noter(eq, S.eq.obj);
    for (let tour = 0; tour < 3; tour++) for (let k = garde.length; k < 6; k++) for (let c = 0; c < 60; c++) {
      const n = cand[Math.random() * cand.length | 0]; if (eq.includes(n)) continue;
      const e2 = eq.slice(); e2[k] = n; const s2 = noter(e2, S.eq.obj); if (s2 > sc) { eq = e2; sc = s2; }
    }
    if (sc > ms) { ms = sc; meilleur = eq; }
  }
  const neufs = meilleur.slice(garde.length);
  S.eq.m = complete ? S.eq.m.map(n => n || neufs.shift()) : meilleur;
  ecrire("pokedex.equipe", S.eq);
}
// noms proposés au fur et à mesure qu'on écrit
function suggere(q, l, max) {
  q = plat(q.trim()); if (!q) return [];
  const deb = [], mil = [];
  for (const n of l) { const p = parNum(n); if (!p) continue; if (p.cle.startsWith(q)) deb.push(p); else if (p.cle.includes(q)) mil.push(p); }
  return deb.concat(mil).slice(0, max);
}
const listeSuggest = (l, attr) => l.length ? l.map(p => `<button class="sug" ${attr}="${p.n}" type="button">${attr === "data-ajout" ? image(p.n, "") : ""}<span class="sn">${esc(p.nom)}</span>${attr === "data-ajout" ? p.types.map(t => bulle(t)).join("") : ""}</button>`).join("") : `<div class="sug-vide">Aucun nom ne ressemble à ça…</div>`;

function analyse(ns) {
  const T = ns.map(n => parNum(n).types), faibles = [], solides = [], trous = [];
  for (const a of D.ORDRE) {
    let w = 0, r = 0;
    for (const t of T) { const m = D.mult(a, t); if (m > 1) w++; else if (m < 1) r++; }
    if (w >= 2 && w > r) faibles.push([a, w]); else if (r >= 2 && w === 0) solides.push([a, r]);
  }
  for (const d of D.ORDRE) if (!T.some(t => t.some(a => D.mult1(a, d) > 1))) trous.push(d);
  const c = ([t, k]) => puce(t, `<em>${k}</em>`);
  return `<div class="bloc mauvais" style="--i:5"><h3>Faiblesses de l'équipe</h3><div class="puces">${faibles.length ? faibles.map(c).join("") : '<span class="chargement">Aucune faiblesse commune, bravo !</span>'}</div><p class="petit">Le chiffre = combien de tes Pokémon craignent ce type.</p></div>
    <div class="bloc bon" style="--i:6"><h3>Bien protégée contre</h3><div class="puces">${solides.length ? solides.map(c).join("") : '<span class="chargement">Rien de spécial.</span>'}</div></div>
    <div class="bloc" style="--i:7"><h3>Attaques super efficaces sur</h3><div class="puces">${D.ORDRE.filter(d => !trous.includes(d)).map(d => puce(d)).join("")}</div>
      ${trous.length ? `<h3 class="sous">Pas de coup super efficace sur</h3><div class="puces">${trous.map(d => puce(d)).join("")}</div>` : '<p class="petit">Ton équipe a de quoi frapper fort sur tous les types.</p>'}</div>`;
}

function vueEquipe() {
  const tete = `<div class="tete"><h1><small>Choisis ton équipe</small>Équipe</h1><a class="reglage ludo-retour" href="../index.html">‹ Ludothèque</a>${boutonTheme()}</div>`;
  if (!LISTE) return tete + `<div class="attente">${"<i></i>".repeat(3)}</div>`;
  if (!ESP || !DEX) return tete + (S.erreurJeux ? `<div class="vide">Il faut internet la première fois pour savoir quel Pokémon est dans quel jeu.<br><button class="reglage" data-rejeux>Réessayer</button></div>` : `<div class="attente">${"<i></i>".repeat(3)}</div>`);
  const e = S.eq, plein = e.m.filter(Boolean), gens = [...new Set(D.JEUX.map(j => j.gen))].filter(Boolean).sort((x, y) => x - y);
  const options = `<option value="nat" ${e.jeu === "nat" ? "selected" : ""}>${D.JEUX[0].nom}</option>` + gens.map(g => `<optgroup label="Génération ${g}">${D.JEUX.filter(j => j.gen === g).map(j => `<option value="${j.id}" ${e.jeu === j.id ? "selected" : ""}>${esc(j.nom)}</option>`).join("")}</optgroup>`).join("");
  const nb = candidats(e.jeu, e.leg).length;
  const cases = e.m.map((n, i) => {
    const p = n && parNum(n);
    return p ? `<div class="case" style="--fond-type:${fondType(p.types)}"><button class="cadre" data-case="${i}" aria-label="Changer ${esc(p.nom)}">${image(n, p.nom)}<b>${esc(p.nom)}</b></button><button class="x" data-retire="${i}" aria-label="Retirer ${esc(p.nom)}">✕</button><a class="fiche-lien" href="#p${n}" aria-label="Fiche de ${esc(p.nom)}">ℹ</a></div>`
      : `<button class="case vide-case ${S.choisir === i ? "sel" : ""}" data-case="${i}" aria-label="Ajouter un Pokémon"><span>+</span></button>`;
  }).join("");
  const picker = S.choisir === null ? "" : `<div class="bloc picker"><h3>Quel Pokémon pour la case ${S.choisir + 1} ?</h3><div class="recherche"><input id="qe" type="search" placeholder="Écris le début du nom…" autocomplete="off" autocapitalize="off" aria-label="Nom du Pokémon"></div><div id="resqe" class="sugs">${listeSuggest(suggere(S.qe || "", dispo(e.jeu).filter(n => !e.m.includes(n) || e.m[S.choisir] === n), 8), "data-ajout")}</div></div>`;
  return tete + `<div class="fiche equipe">
    <div class="bloc" style="--i:0"><h3>Pour quel jeu ?</h3><select id="jeu" aria-label="Jeu">${options}</select>
      <h3 class="sous">Ce que la génération automatique cherche</h3>
      <label class="coche"><input type="checkbox" data-obj="def" ${e.obj.def ? "checked" : ""}> 🛡 Défense : peu de faiblesses communes, des résistances</label>
      <label class="coche"><input type="checkbox" data-obj="att" ${e.obj.att ? "checked" : ""}> ⚔ Attaque : frapper fort sur un maximum de types</label>
      <label class="coche"><input type="checkbox" data-obj="var" ${e.obj.var ? "checked" : ""}> 🎨 Variété : pas deux fois le même type</label>
      <p class="petit">Aucune case cochée : équipe tirée au hasard.</p>
      <label class="coche"><input type="checkbox" id="leg" ${e.leg ? "checked" : ""}> Avec les Pokémon légendaires</label>
      ${S.msg ? `<p class="petit">${esc(S.msg)}</p>` : `<p class="petit">${nb} Pokémon possibles dans ce jeu pour la génération automatique.</p>`}</div>
    <div class="bloc" style="--i:1"><h3>Mon équipe ${plein.length}/6</h3><div class="cases">${cases}</div>
      <div class="actions"><button class="gros" data-gen>✨ Générer l'équipe</button>${plein.length && plein.length < 6 ? `<button class="gros" data-comp>Compléter</button>` : ""}${plein.length ? `<button class="reglage" data-vider>Vider</button>` : ""}</div></div>
    ${picker}
    ${plein.length ? analyse(plein) : `<div class="bloc"><h3>Comment ça marche ?</h3><p class="petit">Touche une case pour choisir un Pokémon (écris son nom, l'appli le propose), ou laisse l'appli composer une équipe équilibrée pour le jeu choisi. Elle regarde les faiblesses communes et les types que tu peux frapper fort.</p></div>`}
  </div>`;
}

/* ---------- le quiz « Qui est ce Pokémon ? » ---------- */
const Q = { etat: "debut", gen: 0, liste: [], i: 0, score: 0, essais: 0, indice: false, bon: false, rate: false, saisie: "" };
const meilleurs = lire("pokedex.quiz", {});
const TOURS = 10;
function lancerQuiz() {
  const pool = LISTE.filter(p => !Q.gen || D.region(p.n)[2] === Q.gen).map(p => p.n);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [pool[i], pool[j]] = [pool[j], pool[i]]; }
  Object.assign(Q, { etat: "jeu", liste: pool.slice(0, TOURS), i: 0, score: 0, essais: 0, indice: false, bon: false, rate: false, saisie: "" });
}
function repondre(n) {
  const cible = Q.liste[Q.i];
  if (n === cible) { Q.score += Q.essais === 0 && !Q.indice ? 1 : .5; Q.bon = true; Q.etat = "reponse"; }
  else { Q.essais++; if (Q.essais >= 2) { Q.rate = true; Q.etat = "reponse"; } else { Q.indice = true; Q.saisie = ""; Q.faux = n; } }
}
function suivant() {
  if (Q.i + 1 >= Q.liste.length) {
    Q.etat = "fin";
    const k = String(Q.gen); if (Q.score > (meilleurs[k] || 0)) { meilleurs[k] = Q.score; ecrire("pokedex.quiz", meilleurs); Q.record = true; } else Q.record = false;
  } else Object.assign(Q, { i: Q.i + 1, etat: "jeu", essais: 0, indice: false, bon: false, rate: false, saisie: "", faux: null });
}
const pts = x => String(x).replace(".", ",");
function vueQuiz() {
  const tete = `<div class="tete"><h1><small>Qui est ce Pokémon ?</small>Quiz</h1><a class="reglage ludo-retour" href="../index.html">‹ Ludothèque</a>${boutonTheme()}</div>`;
  if (!LISTE) return tete + `<div class="attente">${"<i></i>".repeat(3)}</div>`;
  if (Q.etat === "debut") {
    const rec = meilleurs[String(Q.gen)];
    return tete + `<div class="fiche"><div class="bloc quizdebut" style="--i:0"><h3>Prêt à jouer ?</h3><p>${TOURS} silhouettes à deviner. Écris le nom : l'appli te propose les noms au fur et à mesure, il n'y a plus qu'à choisir le bon.</p>
      <select id="qgen" aria-label="Génération"><option value="0">Tous les Pokémon</option>${D.REGIONS.map(r => `<option value="${r[2]}" ${Q.gen === r[2] ? "selected" : ""}>${r[1]} · génération ${r[2]}</option>`).join("")}</select>
      ${rec ? `<p class="petit">Ton record ici : ${pts(rec)} / ${TOURS}</p>` : ""}
      <div class="actions"><button class="gros" data-jouer>▶ Jouer</button></div></div></div>`;
  }
  if (Q.etat === "fin") {
    const s = Q.score, msg = s === TOURS ? "Parfait, maître Pokémon !" : s >= 7 ? "Excellent dresseur !" : s >= 4 ? "Pas mal du tout !" : "Continue à t'entraîner !";
    return tete + `<div class="fiche"><div class="bloc quizdebut" style="--i:0"><h3>Terminé</h3><div class="resultat"><div class="mult" style="--m:#3fa765">${pts(s)}<small> / ${TOURS}</small></div><div class="phr" style="--m:#3fa765">${msg}</div></div>${Q.record ? `<p class="petit">🏆 Nouveau record !</p>` : ""}
      <div class="actions"><button class="gros" data-jouer>↻ Rejouer</button><button class="reglage" data-qmenu>Changer de génération</button></div></div></div>`;
  }
  const n = Q.liste[Q.i], p = parNum(n), fini = Q.etat === "reponse";
  const stage = `<div class="stage ${fini ? "revele" : ""}">${image(n, fini ? p.nom : "Silhouette d'un Pokémon").replace(' loading="lazy"', "")}</div>`;
  const haut = `<div class="qhaut"><span>Question ${Q.i + 1} / ${TOURS}</span><span>Score : ${pts(Q.score)}</span></div><div class="jauge" style="margin:0 0 12px">${Q.liste.map((_, k) => `<i class="${k < Q.i || (k === Q.i && fini) ? "on" : ""}" style="--i:0;${k === Q.i ? "opacity:.6" : ""}"></i>`).join("")}</div>`;
  if (fini) return tete + `<div class="fiche"><div class="bloc quiz" style="--i:0;--c:${D.COULEURS[p.types[0]]}">${haut}${stage}
    <div class="verdict ${Q.bon ? "ok" : "ko"}">${Q.bon ? (Q.essais === 0 && !Q.indice ? "Bravo ! +1 point" : "Bien joué ! +½ point") : "Raté… c'était :"}</div><h2 class="qnom">${esc(p.nom)}</h2><div class="puces" style="justify-content:center">${p.types.map(t => puce(t)).join("")}</div>
    <div class="actions"><button class="gros" data-suivant autofocus>${Q.i + 1 >= TOURS ? "Voir mon score" : "Suivant ›"}</button></div></div></div>`;
  return tete + `<div class="fiche"><div class="bloc quiz" style="--i:0">${haut}${stage}
    ${Q.faux ? `<div class="verdict ko">Ce n'est pas ${esc(parNum(Q.faux).nom)}. Essaie encore !</div>` : ""}
    ${Q.indice ? `<div class="puces" style="justify-content:center;margin-bottom:10px">${p.types.map(t => puce(t)).join("")}</div>` : ""}
    <div class="recherche"><input id="qr" type="search" placeholder="Écris le nom du Pokémon…" value="${esc(Q.saisie)}" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Nom du Pokémon"></div>
    <div id="resqr" class="sugs">${listeSuggest(suggere(Q.saisie, LISTE.map(x => x.n), 5), "data-rep")}</div>
    <div class="actions"><button class="reglage" data-indice ${Q.indice ? "disabled" : ""}>💡 Indice : ses types</button><button class="reglage" data-passe>Je passe</button></div></div></div>`;
}

/* ---------- l'état et l'affichage ---------- */
const S = { sombre: lire("pokedex.sombre", true), q: "", filtre: null, att: "Eau", def: ["Feu", "Roche"], hautListe: 0, erreur: null, erreurJeux: false, choisir: null, qe: "", msg: "",
  eq: Object.assign({ jeu: "nat", leg: false, obj: { def: true, att: true, var: true }, m: [null, null, null, null, null, null] }, lire("pokedex.equipe", {})) };
S.eq.obj = Object.assign({ def: true, att: true, var: true }, S.eq.obj);
const racine = document.getElementById("app");
let routePrecedente = null, depuisListe = false;
const route = () => { const h = location.hash.slice(1); return h === "types" || h === "equipe" || h === "quiz" ? { v: h } : /^p\d+$/.test(h) ? { v: "fiche", n: +h.slice(1) } : { v: "liste" }; };
let MAP = null;
const parNum = n => { if (!LISTE) return null; if (!MAP || MAP.src !== LISTE) { MAP = new Map(LISTE.map(p => [p.n, p])); MAP.src = LISTE; } return MAP.get(n); };

function resultats() {
  if (S.erreur) return `<div class="vide">Le Pokédex a besoin d'internet la première fois, pour charger les 1025 Pokémon.<br><button class="reglage" data-recharger>Réessayer</button></div>`;
  if (!LISTE) return `<div class="attente">${"<i></i>".repeat(5)}</div>`;
  const q = plat(S.q.trim());
  const l = LISTE.filter(p => (!S.filtre || p.types.includes(S.filtre)) && (!q || p.cle.includes(q) || String(p.n) === q.replace(/^0+/, "") || p.types.some(t => plat(t).startsWith(q))));
  if (!l.length) return `<div class="vide">Aucun Pokémon ne s'appelle « ${esc(S.q)} »…<br>Essaie un autre nom, un numéro ou un type.</div>`;
  let h = "", reg = null, i = 0;
  for (const p of l) {
    const r = D.region(p.n);
    if (r !== reg) { if (reg) h += "</div>"; reg = r; h += `<div class="gen">${r[1]} · génération ${r[2]}</div><div class="liste">`; }
    h += `<button class="ligne" data-n="${p.n}" style="--fond-type:${fondType(p.types)};--i:${Math.min(i++, 8)}"><span class="nom"><small>N° ${num3(p.n)}</small><b>${esc(p.nom)}</b><span class="types">${p.types.map(t => puce(t)).join("")}</span></span>${image(p.n)}</button>`;
  }
  return h + `</div><p class="note">Données et images : <a href="https://pokeapi.co" target="_blank" rel="noopener">PokéAPI</a>. Pokémon © Nintendo, Creatures, GAME FREAK. Projet de fan, sans lien avec eux.</p>`;
}

const boutonTheme = () => `<button class="reglage rond" data-theme aria-label="${S.sombre ? "Passer en thème clair" : "Passer en thème sombre"}">${S.sombre ? "☾" : "☀"}</button>`;
const vueListe = () => `<div class="tete"><h1><small>Salut, dresseur !</small>Pokédex</h1><a class="reglage ludo-retour" href="../index.html">‹ Ludothèque</a>${boutonTheme()}</div>
  <label class="recherche">${SVG_LOUPE}<input id="q" type="search" placeholder="Chercher un nom, un numéro, un type…" value="${esc(S.q)}" autocomplete="off" aria-label="Chercher un Pokémon"></label>
  <div class="filtres">${D.ORDRE.map(t => `<button data-filtre="${t}" class="${S.filtre === t ? "on" : ""}" style="--c:${D.COULEURS[t]}" aria-pressed="${S.filtre === t}">${bulle(t)}${t}</button>`).join("")}</div>
  <div id="res">${resultats()}</div>`;

function chaine(n, f) {
  const a = f && f.c && CHAINES[f.c];
  if (!a) return `<div class="chargement">${f ? "Ce Pokémon n'évolue pas." : "…"}</div>`;
  const etages = []; let ici = 0;
  (function parcours(x, k) { (etages[k] = etages[k] || []).push(x); if (x[0] === n) ici = k; x[2].forEach(y => parcours(y, k + 1)); })(a, 0);
  const etape = x => { const p = parNum(x[0]); return `<button class="etape ${x[0] === n ? "ici" : ""}" data-n="${x[0]}"><span class="rond">${image(x[0])}</span>${p ? esc(p.nom) : "N° " + x[0]}</button>`; };
  const points = `<span class="stades">${etages.map((e, k) => `<i class="${k <= ici ? "on" : ""}"></i>`).join("")}</span>`;
  if (etages.length === 1) return { points, html: `<div class="chargement">Ce Pokémon n'évolue pas.</div>` };
  if (etages.every(e => e.length === 1)) return { points, html: `<div class="chaine">${etages.map((e, k) => (k ? `<div class="fl">${SVG_FLECHE}${esc(e[0][1])}</div>` : "") + etape(e[0])).join("")}</div>` };
  const branches = etages.slice(1).map(e => `<div class="sep">▼</div><div class="suite">${e.map(x => `<div class="etape-bloc">${etape(x)}<div class="cond" style="text-align:center;font-size:11px;color:var(--doux)">${esc(x[1])}</div></div>`).join("")}</div>`).join("");
  return { points, html: `<div class="branches"><div class="base">${etape(etages[0][0])}</div>${branches}</div>` };
}

function vueFiche(n) {
  const p = parNum(n);
  if (!p) return LISTE ? `<div class="vide">Ce Pokémon n'existe pas.<br><button class="reglage" data-retour>‹ Retour</button></div>` : `<div class="attente">${"<i></i>".repeat(3)}</div>`;
  const f = FICHES[n], ch = chaine(n, f);
  const m = D.ORDRE.map(a => [a, D.mult(a, p.types)]);
  const grp = test => m.filter(([, x]) => test(x)).map(([a, x]) => puce(a, `<em>${({ 0: "×0", .25: "×¼", .5: "×½", 2: "×2", 4: "×4" })[x]}</em>`)).join("");
  const craint = grp(x => x > 1), resiste = grp(x => x > 0 && x < 1), immun = grp(x => x === 0);
  return `<div style="--c:${D.COULEURS[p.types[0]]}">
    <div class="hero" style="--fond-type:${fondType(p.types)}"><div class="haut"><button class="retour" data-retour>‹ Retour</button><span class="num">N° ${num3(n)}</span></div>${image(n, p.nom).replace(' loading="lazy"', "")}</div>
    <div class="titre-fiche" style="--i:1"><h2>${esc(p.nom)}</h2>${f && f.e ? `<div class="espece">${/^pok/i.test(f.e) ? "" : "Pokémon "}${esc(f.e)}</div>` : ""}<div class="puces">${p.types.map(t => puce(t)).join("")}</div></div>
    <div class="fiche">
      <div class="bloc" style="--i:2"><h3>Évolution ${typeof ch === "object" ? ch.points : ""}</h3>${typeof ch === "object" ? ch.html : ch}</div>
      <div class="bloc" style="--i:3"><h3>Ce qu'on sait de lui</h3>${!f ? '<span class="chargement">Chargement…</span>' : f.d ? esc(f.d) : '<span class="chargement">Pas encore de description en français pour ce Pokémon.</span>'}</div>
      <div class="bloc mauvais" style="--i:4"><h3>Attention à ces attaques</h3><div class="puces">${craint}</div></div>
      ${resiste ? `<div class="bloc bon" style="--i:5"><h3>Il résiste bien à</h3><div class="puces">${resiste}</div></div>` : ""}
      ${immun ? `<div class="bloc bon" style="--i:6"><h3>Ça ne lui fait rien</h3><div class="puces">${immun}</div></div>` : ""}
    </div></div>`;
}

const TXT = m => ({ 0: "×0", .25: "×¼", .5: "×½", 1: "×1", 2: "×2", 4: "×4" })[m];
const PHRASE = m => m === 0 ? "Aucun effet !" : m === .25 ? "Presque rien…" : m === .5 ? "Pas très efficace…" : m === 1 ? "Dégâts normaux" : m === 2 ? "Super efficace !" : "Hyper efficace !!";
const COUL = m => m === 0 ? "#8d86a8" : m < 1 ? "#e2574c" : m === 1 ? "#5b8def" : "#3fa765";
function vueTypes() {
  const m = D.mult(S.att, S.def), a = D.TABLE[S.att];
  const choix = (k, on) => D.ORDRE.map(t => `<button data-${k}="${t}" class="${on(t) ? "on" : ""}" style="--c:${D.COULEURS[t]}" aria-pressed="${on(t)}">${bulle(t)}${t}</button>`).join("");
  const liste = l => l.length ? l.map(t => puce(t)).join("") : '<span style="color:var(--doux)">Personne</span>';
  return `<div class="tete"><h1><small>Qui gagne ?</small>Types</h1><a class="reglage ludo-retour" href="../index.html">‹ Ludothèque</a>${boutonTheme()}</div>
    <div class="fiche">
      <div class="bloc" style="--m:${COUL(m)};--i:0">
        <div class="versus"><div class="cote">${bulle(S.att)}Attaque ${S.att}</div><div class="fleche">➜</div><div class="cote"><span class="bulles">${S.def.map(bulle).join("")}</span>Défense ${S.def.join(" / ")}</div></div>
        <div class="resultat"><div class="mult">${TXT(m)}</div><div class="phr">${PHRASE(m)}</div></div>
        <div class="jauge">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= ({ 0: 0, .25: 1, .5: 2, 1: 3, 2: 4, 4: 5 })[m] ? "on" : ""}" style="--i:${i}"></i>`).join("")}</div>
      </div>
      <div class="bloc" style="--i:1"><h3>1. Le type de l'attaque</h3><div class="choix">${choix("att", t => t === S.att)}</div></div>
      <div class="bloc" style="--i:2"><h3>2. Le Pokémon qui défend (1 ou 2 types)</h3><div class="choix">${choix("def", t => S.def.includes(t))}</div></div>
      <div class="bloc" style="--i:3"><h3>${ico(S.att)} Une attaque ${S.att}…</h3><div class="effets">
        <div><b style="color:#3fa765">est très forte contre</b><div class="puces">${liste(a[0])}</div></div>
        <div><b style="color:#e2574c">est faible contre</b><div class="puces">${liste(a[1])}</div></div>
        ${a[2].length ? `<div><b style="color:var(--doux)">ne fait rien à</b><div class="puces">${liste(a[2])}</div></div>` : ""}
      </div></div>
    </div>`;
}

function rendre(entree) {
  const r = route();
  const corps = r.v === "types" ? vueTypes() : r.v === "equipe" ? vueEquipe() : r.v === "quiz" ? vueQuiz() : r.v === "fiche" ? vueFiche(r.n) : vueListe();
  document.body.classList.toggle("clair", !S.sombre);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = S.sombre ? "#15121f" : "#f4f1fb";
  racine.innerHTML = `<div class="app ${S.sombre ? "sombre" : ""} ${entree ? "entree" : ""}"><main class="vue">${corps}</main>
    <nav class="onglets">${[["liste", SVG_LIVRE, "Pokédex"], ["types", SVG_ECLAIR, "Types"], ["equipe", SVG_EQUIPE, "Équipe"], ["quiz", SVG_QUIZ, "Quiz"]].map(([k, s, t]) => `<button data-onglet="${k}" class="${(r.v === "fiche" ? "liste" : r.v) === k ? "on" : ""}">${s}${t}</button>`).join("")}</nav></div>`;
}
const vue = () => racine.querySelector(".vue");

// changement d'écran (adresse) : on garde la position dans la liste
function surAdresse() {
  const r = route(), avant = routePrecedente;
  if (avant && avant.v === "liste" && vue()) S.hautListe = vue().scrollTop;
  routePrecedente = r;
  rendre(true);
  vue().scrollTop = r.v === "liste" ? S.hautListe : 0;
  if (r.v === "equipe" && (!ESP || !DEX)) chargeurJeux();
  if (r.v === "fiche" && LISTE) {
    const n = r.n, f = FICHES[n];
    if (!f || (f.c && !CHAINES[f.c])) chargerFiche(n).then(() => { if (route().n === n) { const h = vue().scrollTop; rendre(false); vue().scrollTop = h; } }).catch(() => {});
  }
}
function chargeurJeux() {
  S.erreurJeux = false;
  chargerJeux().then(() => { if (route().v === "equipe") { rendre(false); } }).catch(() => { S.erreurJeux = true; if (route().v === "equipe") rendre(false); });
}
window.addEventListener("hashchange", surAdresse);

racine.addEventListener("click", ev => {
  const b = ev.target.closest("button"); if (!b) return;
  const haut = vue().scrollTop;
  if (b.dataset.n) { depuisListe = route().v !== "fiche" || depuisListe; location.hash = "p" + b.dataset.n; return; }
  if ("retour" in b.dataset) { if (depuisListe && history.length > 1) history.back(); else location.hash = ""; depuisListe = false; return; }
  if (b.dataset.onglet) { const h = b.dataset.onglet === "liste" ? "" : b.dataset.onglet; if (location.hash.slice(1) !== h) location.hash = h; else vue().scrollTo({ top: 0, behavior: "smooth" }); return; }
  if ("recharger" in b.dataset) { demarrer(); return; }
  if ("rejeux" in b.dataset) { chargeurJeux(); rendre(false); return; }
  if (b.dataset.case !== undefined) { const i = +b.dataset.case; S.choisir = S.choisir === i ? null : i; S.qe = ""; rendre(false); const q = document.getElementById("qe"); if (q) { q.focus(); q.scrollIntoView({ block: "center", behavior: "smooth" }); } return; }
  if (b.dataset.retire !== undefined) { S.eq.m[+b.dataset.retire] = null; ecrire("pokedex.equipe", S.eq); S.msg = ""; rendre(false); vue().scrollTop = haut; return; }
  if (b.dataset.ajout) { S.eq.m[S.choisir] = +b.dataset.ajout; ecrire("pokedex.equipe", S.eq); S.choisir = null; S.msg = ""; rendre(false); vue().scrollTop = haut; return; }
  if ("gen" in b.dataset) { S.choisir = null; S.msg = ""; generer(false); rendre(true); return; }
  if ("comp" in b.dataset) { S.choisir = null; S.msg = ""; generer(true); rendre(true); return; }
  if ("vider" in b.dataset) { S.eq.m = [null, null, null, null, null, null]; ecrire("pokedex.equipe", S.eq); S.choisir = null; S.msg = ""; rendre(false); return; }
  if ("jouer" in b.dataset) { lancerQuiz(); rendre(false); vue().scrollTop = 0; focusQ(); return; }
  if ("qmenu" in b.dataset) { Q.etat = "debut"; rendre(false); return; }
  if (b.dataset.rep) { repondre(+b.dataset.rep); rendre(false); focusQ(); return; }
  if ("indice" in b.dataset) { Q.indice = true; rendre(false); focusQ(); return; }
  if ("passe" in b.dataset) { Q.rate = true; Q.etat = "reponse"; rendre(false); return; }
  if ("suivant" in b.dataset) { suivant(); rendre(false); vue().scrollTop = 0; focusQ(); return; }
  if ("theme" in b.dataset) { S.sombre = !S.sombre; ecrire("pokedex.sombre", S.sombre); }
  else if (b.dataset.filtre) S.filtre = S.filtre === b.dataset.filtre ? null : b.dataset.filtre;
  else if (b.dataset.att) S.att = b.dataset.att;
  else if (b.dataset.def) {
    const t = b.dataset.def;
    if (S.def.includes(t)) { if (S.def.length > 1) S.def = S.def.filter(x => x !== t); }
    else S.def = S.def.length < 2 ? [...S.def, t] : [S.def[1], t];
  } else return;
  rendre(false);
  vue().scrollTop = haut;
});
function focusQ() { const q = document.getElementById("qr"); if (q) q.focus(); }
racine.addEventListener("input", ev => {
  const id = ev.target.id;
  if (id === "q") { S.q = ev.target.value; document.getElementById("res").innerHTML = resultats(); }
  else if (id === "qe") { S.qe = ev.target.value; document.getElementById("resqe").innerHTML = listeSuggest(suggere(S.qe, dispo(S.eq.jeu).filter(n => !S.eq.m.includes(n)), 8), "data-ajout"); }
  else if (id === "qr") { Q.saisie = ev.target.value; document.getElementById("resqr").innerHTML = listeSuggest(suggere(Q.saisie, LISTE.map(x => x.n), 5), "data-rep"); }
});
racine.addEventListener("change", ev => {
  const id = ev.target.id;
  if (ev.target.dataset.obj) { S.eq.obj[ev.target.dataset.obj] = ev.target.checked; ecrire("pokedex.equipe", S.eq); return; }
  if (id === "jeu") {
    S.eq.jeu = ev.target.value; S.choisir = null;
    const ok = new Set(dispo(S.eq.jeu)), avant = S.eq.m.filter(Boolean).length;
    S.eq.m = S.eq.m.map(n => n && ok.has(n) ? n : null);
    const perdus = avant - S.eq.m.filter(Boolean).length;
    S.msg = perdus ? `${perdus} Pokémon retiré${perdus > 1 ? "s" : ""} : absent${perdus > 1 ? "s" : ""} de ce jeu.` : "";
    ecrire("pokedex.equipe", S.eq); const h = vue().scrollTop; rendre(false); vue().scrollTop = h;
  } else if (id === "leg") { S.eq.leg = ev.target.checked; ecrire("pokedex.equipe", S.eq); const h = vue().scrollTop; rendre(false); vue().scrollTop = h; }
  else if (id === "qgen") { Q.gen = +ev.target.value; rendre(false); }
});
racine.addEventListener("keydown", ev => {
  const id = ev.target.id;
  if (id === "q" && ev.key === "Enter") ev.target.blur();
  else if (id === "qe" && ev.key === "Enter") { const b = document.querySelector("#resqe [data-ajout]"); if (b) b.click(); }
  else if (id === "qr" && ev.key === "Enter") { const b = document.querySelector("#resqr [data-rep]"); if (b) b.click(); }
  else if (ev.key === "Escape" && S.choisir !== null) { S.choisir = null; rendre(false); }
});

/* ---------- démarrage ---------- */
async function demarrer() {
  S.erreur = null;
  const garde = lire(CLE_LISTE, null);
  if (garde && garde.l && garde.l.length) LISTE = deplier(garde.l);
  surAdresse();
  // liste absente ou vieille de plus de 30 jours : on la recharge (en arrière-plan si on en a déjà une)
  if (!LISTE || Date.now() - (garde.t || 0) > 30 * 864e5) {
    try { LISTE = await chargerListe(); }
    catch (e) { if (!LISTE) S.erreur = e; }
    const h = vue().scrollTop; rendre(false); vue().scrollTop = h;
    surAdresseSiFiche();
  }
}
function surAdresseSiFiche() { if (route().v === "fiche") surAdresse(); }

window.Pokedex = { S, get liste() { return LISTE; }, chargerFiche, FICHES, CHAINES };
demarrer();
})();

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

/* ---------- l'état et l'affichage ---------- */
const S = { sombre: lire("pokedex.sombre", true), q: "", filtre: null, att: "Eau", def: ["Feu", "Roche"], hautListe: 0, erreur: null };
const racine = document.getElementById("app");
let routePrecedente = null, depuisListe = false;
const route = () => { const h = location.hash.slice(1); return h === "types" ? { v: "types" } : /^p\d+$/.test(h) ? { v: "fiche", n: +h.slice(1) } : { v: "liste" }; };
const parNum = n => LISTE && LISTE.find(p => p.n === n);

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
  const corps = r.v === "types" ? vueTypes() : r.v === "fiche" ? vueFiche(r.n) : vueListe();
  document.body.classList.toggle("clair", !S.sombre);
  const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = S.sombre ? "#15121f" : "#f4f1fb";
  racine.innerHTML = `<div class="app ${S.sombre ? "sombre" : ""} ${entree ? "entree" : ""}"><main class="vue">${corps}</main>
    <nav class="onglets"><button data-onglet="liste" class="${r.v !== "types" ? "on" : ""}">${SVG_LIVRE}Pokédex</button><button data-onglet="types" class="${r.v === "types" ? "on" : ""}">${SVG_ECLAIR}Types</button></nav></div>`;
}
const vue = () => racine.querySelector(".vue");

// changement d'écran (adresse) : on garde la position dans la liste
function surAdresse() {
  const r = route(), avant = routePrecedente;
  if (avant && avant.v === "liste" && vue()) S.hautListe = vue().scrollTop;
  routePrecedente = r;
  rendre(true);
  vue().scrollTop = r.v === "liste" ? S.hautListe : 0;
  if (r.v === "fiche" && LISTE) {
    const n = r.n, f = FICHES[n];
    if (!f || (f.c && !CHAINES[f.c])) chargerFiche(n).then(() => { if (route().n === n) { const h = vue().scrollTop; rendre(false); vue().scrollTop = h; } }).catch(() => {});
  }
}
window.addEventListener("hashchange", surAdresse);

racine.addEventListener("click", ev => {
  const b = ev.target.closest("button"); if (!b) return;
  const haut = vue().scrollTop;
  if (b.dataset.n) { depuisListe = route().v !== "fiche" || depuisListe; location.hash = "p" + b.dataset.n; return; }
  if ("retour" in b.dataset) { if (depuisListe && history.length > 1) history.back(); else location.hash = ""; depuisListe = false; return; }
  if (b.dataset.onglet) { const h = b.dataset.onglet === "types" ? "types" : ""; if (location.hash.slice(1) !== h) location.hash = h; else vue().scrollTo({ top: 0, behavior: "smooth" }); return; }
  if ("recharger" in b.dataset) { demarrer(); return; }
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
racine.addEventListener("input", ev => {
  if (ev.target.id !== "q") return;
  S.q = ev.target.value; document.getElementById("res").innerHTML = resultats();
});
racine.addEventListener("keydown", ev => { if (ev.target.id === "q" && ev.key === "Enter") ev.target.blur(); });

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

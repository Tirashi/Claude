/* Ludothèque : outils communs de l'accueil et des fiches des jeux.
   Ordre de chargement dans index.html : accueil-outils.js, puis les fiches (<dossier>/fiche.js), puis accueil.js.
   Ce sont des scripts classiques : les const de haut niveau d'ici sont visibles dans les fiches et dans accueil.js.

   Une fiche décrit tout ce que l'accueil sait d'un jeu :
   Ludo.fiche({
     k: "tetris/index.html",                      // chemin de la page (et place dans GAMES d'accueil.js, qui donne l'ordre)
     carte: {n, s, ic, fam, lb, lt, sh, rank, d, tags},   // la cartouche (voir GAMES)
     meta: {added, updated, genres},              // dates et genres (voir META)
     nom: "Nebula",                               // nom dans les phrases du gardien (sinon carte.n)
     enCours: () => "SECTEUR 2" | null,           // partie qui attend d'être reprise
     duJour: () => true | false | null,           // défi du jour fait (true), à faire (false), sans objet (null)
     records: () => [["Meilleur score", "1 200"]],// records affichés dans le volet
     classements: [{label, game, board, fmt…}],   // vues du volet (voir RANKS), rangées sous carte.rank
     transfert: {cle, collecter, decrire, fusionner} // ou une liste : une entrée du code LUDO1- (g[cle])
   });
   transfert : collecter() rend la valeur à mettre dans g[cle] (null : rien) ; decrire(v) une ligne du résumé ;
   fusionner(v) écrit ce qui est meilleur que la sauvegarde du navigateur et rend une ligne « Jeu : n records » (ou null).
   Ne jamais changer `cle` ni la forme de la valeur : un code fait avant doit se relire après. */

const Ludo = window.Ludo = { fiches: {}, fiche(f){ if (f && f.k) Ludo.fiches[f.k] = f; } };

/* ---------- lire les sauvegardes ---------- */
const rk = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const readKey = rk;
const writeKey = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

/* ---------- nombres, temps, jours ---------- */
const dayNum = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const mmss = ms => { const t = Math.floor(ms / 1000); return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };
const fmtTime = mmss;
const sum = o => Object.values(o || {}).reduce((a, v) => a + (Number(v) || 0), 0);
const count = o => Object.keys(o || {}).length;
const nf = v => String(Math.round(Number(v) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const num = (v, unit) => Number(v) > 0 ? nf(v) + (unit ? " " + unit : "") : null;
const N = v => nf(v), T = mmss;
const pl = (n, s, p) => n > 1 ? (p || s + "s") : s;   // pluriel : pl(3, "partie") = "parties"

/* ---------- état du volet des classements (jour affiché, réglages), partagé avec les fiches ---------- */
const dayKey = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
// même code que l'Arbre du jour de Lignée : C2-J + date aaaammjj en base 36
const dayCode = (mode, d) => `${mode}2-J${dayKey(d).toString(36).toUpperCase()}`;
const st = {view: 0, mode: "C", back: 0, level: 2, size: 7, plevel: 1, poke: null, tcmode: "classic", tcai: "normal", amai: "normal", esai: "normal", pssize: 9, sdk: "9-2", cclvl: 2, ccop: "mix"};
const day = () => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - st.back); return d; };
const dayName = () => st.back === 0 ? "AUJOURD'HUI" : st.back === 1 ? "HIER" :
  day().toLocaleDateString("fr-FR", {weekday: "short", day: "numeric", month: "short"}).toUpperCase().replace(/\./g, "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const daily = () => "daily:" + dayKey(day());

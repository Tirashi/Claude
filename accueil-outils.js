/* Ludothèque : outils communs de l'accueil et des fiches des jeux.
   Ordre de chargement dans index.html : accueil-outils.js, puis les fiches (<dossier>/fiche.js), puis accueil.js.
   Ajouter un jeu : sa fiche, son chemin dans ORDRE (accueil.js, ordre des cartouches), sa ligne <script src> dans index.html,
   la fiche dans FILES de sw.js, son icône dans icones.js (+ une ligne [date, "neuf", dossier, texte] dans NEWS d'accueil.js : le journal).
   Ce sont des scripts classiques : les const de haut niveau d'ici sont visibles dans les fiches et dans accueil.js.

   Une fiche décrit tout ce que l'accueil sait d'un jeu :
   Ludo.fiche({
     k: "tetris/index.html",                      // chemin de la page (et sa place dans ORDRE d'accueil.js)
     carte: {n, s, ic, fam, lb, lt, sh, rank, d, tags, more, demo},   // la cartouche : nom, nom court de l'étiquette, icône de icones.js,
                                                  // famille "16" | "32" | "rep" | "3d", étiquette et texte, teinte du plastique, classements,
                                                  // description, étiquettes, boutons en plus [[texte, page]], démo ;
                                                  // atelier: true + objet: "dex"|"calc"|"petri" = un outil, posé en objet sur l'étagère ATELIERS
     meta: {added, updated, genres},              // sortie et mise à jour visible (AAAA-MM-JJ : NEUF ou MAJ 3 jours), genres des filtres
     nom: "Nebula",                               // nom dans les phrases du gardien (sinon carte.n)
     enCours: () => "SECTEUR 2" | null,           // partie qui attend d'être reprise
     duJour: () => true | false | null,           // défi du jour fait (true), à faire (false), sans objet (null)
     records: () => [["Meilleur score", "1 200"]],// records affichés dans le volet
     classements: [{label, ctl, game, board, fmt, title, note, empty}],   // vues du volet, rangées sous carte.rank
                                                  // (ctl : réglages "day", "mode", "level", "sdk"… ; T = temps en ms)
     transfert: {cles: ["tetris16.best"], collecter(g){…}, decrire(g, out){…}, fusionner(g, done){…}}
   });
   transfert = la part du jeu dans le code LUDO1- : collecter(g) met ses sauvegardes dans g[cle] ; decrire(g, out) ajoute
   des lignes au résumé ; fusionner(g, done) écrit ce qui est meilleur que la sauvegarde du navigateur et ajoute
   « Jeu : n records » à done. Ne jamais changer les clés de g ni la forme des valeurs : un code fait avant doit se relire après.
   La reprise des records en rejoignant les classements reste dans ludo-scores.js (registerExisting, PSEUDO_BOARDS) :
   elle tourne aussi dans les pages des jeux (rattrapage SYNC). */

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

/* ---------- état du volet des classements (jour affiché, réglages), partagé avec les fiches ---------- */
const dayKey = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
// même code que l'Arbre du jour de Lignée : C2-J + date aaaammjj en base 36
const dayCode = (mode, d) => `${mode}2-J${dayKey(d).toString(36).toUpperCase()}`;
const st = {view: 0, mode: "C", back: 0, level: 2, size: 7, plevel: 1, poke: null, tcmode: "classic", tcai: "normal", amai: "normal", esai: "normal", pssize: 9, sdk: "9-2", cclvl: 2, ccop: "mix"};
const day = () => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - st.back); return d; };
const dayName = () => st.back === 0 ? "AUJOURD'HUI" : st.back === 1 ? "HIER" :
  day().toLocaleDateString("fr-FR", {weekday: "short", day: "numeric", month: "short"}).toUpperCase().replace(/\./g, "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const daily = () => "daily:" + dayKey(day());
// listes des réglages (puces du volet et titres des classements)
const LEVELS = ["FACILE", "MOYEN", "DIFFICILE", "EXPERT"];
const TCMODES = [["classic", "CLASSIQUE"], ["arsenal", "ARSENAL"]], TCAI = [["easy", "FACILE"], ["normal", "NORMAL"], ["hard", "AMIRAL"]];
const AMAI = [["easy", "MOUSSE"], ["normal", "CAPITAINE"], ["hard", "AMIRAL"]];
const ESAI = [["easy", "RECRUE"], ["normal", "PILOTE"], ["hard", "AS"]];
const CCLVL = [[1, "PETIT ECOLIER"], [2, "ECOLIER"], [3, "COLLEGE"], [4, "COSTAUD"], [5, "CHAMPION"]];
const CCOP = [["add", "+"], ["sub", "−"], ["mul", "×"], ["div", "÷"], ["mix", "MELANGE"]];
const SDK = [["4", "4×4"], ["6", "6×6"], ["9-1", "FACILE"], ["9-2", "MOYEN"], ["9-3", "DIFFICILE"]];

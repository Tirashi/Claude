/* Sudoku : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "sudoku/index.html",
  carte: {n: "SUDOKU", s: "SUDOKU", ic: "grid9", fam: "32", lb: "linear-gradient(#3a1a4a, #12082a)", lt: "#ffb8d0", sh: "#8a3aa8", rank: "sudoku",
    d: "Un chiffre par ligne, par colonne et par bloc, sous la lune d'un jardin japonais. Notes au crayon et grille du jour.", tags: ["4×4 A 9×9"]},
  meta: {added: "2026-10-16", genres: ["LOGIQUE", "DU JOUR"]},
  nom: "le Sudoku",
  enCours: () => { const d = rk("sudoku.dailyRun", null), g = rk("sudoku.game", null);
    return d && d.day === dayNum() ? "GRILLE DU JOUR" : g && !g.daily ? "UNE GRILLE" : null; },
  duJour: () => !!(rk("sudoku.daily", {}) || {})[dayNum()],
  records: () => { const b = rk("sudoku.best", {}) || {};
    return [["4", "4×4"], ["6", "6×6"], ["9-1", "9×9 facile"], ["9-2", "9×9 moyen"], ["9-3", "9×9 difficile"]].map(([k, l]) => [l, b[k] > 0 ? mmss(b[k]) : null]).concat([["Grilles terminées", num(rk("sudoku.wins", 0))]]); },
  classements: [{label: "GRILLE DU JOUR", ctl: ["day"], game: "sudoku", board: daily, fmt: T,
     title: () => "GRILLE DU JOUR", note: "La même grille 9×9 pour toute la famille (facile lundi et mardi, moyenne du mercredi au vendredi, difficile le week-end), plus 30 secondes par indice. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a rempli la grille ce jour-là." : "Personne n'a encore rempli la grille du jour : à toi de jouer !"},
    {label: "PAR NIVEAU", ctl: ["sdk"], game: "sudoku", board: () => "best:" + st.sdk, fmt: T, title: () => SDK.find(m => m[0] === st.sdk)[1], note: "Le meilleur temps, plus 30 secondes par indice."},
    {label: "GRILLES", game: "sudoku", board: () => "grilles", fmt: v => N(v) + (v > 1 ? " grilles" : " grille"), title: () => "GRILLES TERMINEES"}],
  transfert: {cles: ["sudoku"],
    collecter(g){
      const su = {b: readKey("sudoku.best", {}) || {}, d: readKey("sudoku.daily", {}) || {}, w: Number(readKey("sudoku.wins", 0)) || 0};
      if (su.w || Object.keys(su.b).length) g.sudoku = su;
    },
    decrire(g, out){
      if (g.sudoku){ const p = g.sudoku, nm = {"4": "4×4", "6": "6×6", "9-1": "9×9 facile", "9-2": "9×9 moyen", "9-3": "9×9 difficile"};
        const b = Object.keys(nm).filter(k => (p.b || {})[k] > 0).map(k => `${nm[k]} en ${fmtTime(p.b[k])}`);
        out.push(`Sudoku : ${p.w || 0} grille${p.w > 1 ? "s" : ""}` + (b.length ? ", " + b.join(", ") : "")); }
    },
    fusionner(g, done){
      if (g.sudoku && typeof g.sudoku === "object"){
        const p = g.sudoku, best = readKey("sudoku.best", {}) || {}, daily = readKey("sudoku.daily", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(p.b || {})) if (/^(4|6|9-[123])$/.test(k) && v > 0 && !(best[k] > 0 && best[k] <= v)){ best[k] = Math.round(v); n++; }
        for (const [k, v] of Object.entries(p.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] > 0 && daily[k] <= v)){ daily[k] = Math.round(v); n++; }
        const w = Number(readKey("sudoku.wins", 0)) || 0;
        if (p.w > w){ writeKey("sudoku.wins", Math.round(p.w)); n++; }
        if (n){ writeKey("sudoku.best", best); writeKey("sudoku.daily", daily); done.push(`Sudoku : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

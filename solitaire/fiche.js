/* Solitaire : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "solitaire/index.html",
  carte: {n: "SOLITAIRE", s: "SOLITAIRE", ic: "cards", fam: "rep", lb: "linear-gradient(#2a8a48, #145a2c)", lt: "#ffd23f", sh: "#2a8a48", rank: "solitaire",
    d: "Le Klondike de Windows XP : range les cartes de l'As au Roi, et regarde-les rebondir à la fin.", tags: ["PIOCHE 1 OU 3"]},
  meta: {genres: ["CARTES"]},
  nom: "le Solitaire",
  enCours: () => { const g = rk("solitaire16.game", null); return g && g.started && !g.won ? "UNE DONNE" : null; },
  records: () => [["Meilleur score", num(rk("solitaire16.best", 0))]],
  classements: [{label: "MEILLEUR SCORE", game: "solitaire", board: () => "best", fmt: N}],
  transfert: {cles: ["solitaire16.best"],
    collecter(g){
      { const v = Number(readKey("solitaire16.best", 0)); if (v > 0) g["solitaire16.best"] = v; }
    },
    decrire(g, out){
      if (g["solitaire16.best"]) out.push(`Solitaire : ${g["solitaire16.best"]} points`);
    },
    fusionner(g, done){
      { const v = Number(g["solitaire16.best"]); if (v > 0 && v > Number(readKey("solitaire16.best", 0))){ writeKey("solitaire16.best", v); done.push(`Solitaire : record ${v}`); } }
    }}
});

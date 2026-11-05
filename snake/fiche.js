/* Snake : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "snake/index.html",
  carte: {n: "SNAKE", s: "SNAKE", ic: "snake", fam: "rep", lb: "linear-gradient(#377a28, #1c4214)", lt: "#c4ff7a", sh: "#3fa02a", rank: "snake",
    d: "Mange les pommes sans te mordre la queue ni toucher les bords du jardin.", tags: []},
  meta: {genres: ["ARCADE"]},
  records: () => [["Meilleur score", num(rk("snakeBestScore", 0))]],
  classements: [{label: "MEILLEUR SCORE", game: "snake", board: () => "best", fmt: N}],
  transfert: {cles: ["snakeBestScore"],
    collecter(g){
      { const v = Number(readKey("snakeBestScore", 0)); if (v > 0) g["snakeBestScore"] = v; }
    },
    decrire(g, out){
      if (g["snakeBestScore"]) out.push(`Snake : ${g["snakeBestScore"]} points`);
    },
    fusionner(g, done){
      { const v = Number(g["snakeBestScore"]); if (v > 0 && v > Number(readKey("snakeBestScore", 0))){ writeKey("snakeBestScore", v); done.push(`Snake : record ${v}`); } }
    }}
});

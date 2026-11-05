/* Asteroids : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "asteroids/index.html",
  carte: {n: "ASTEROIDS", s: "ASTEROIDS", ic: "rock", fam: "rep", lb: "radial-gradient(circle at 70% 30%, #1d2a5a, #05040e 70%)", lt: "#5ce1ff", sh: "#2ab0d0", rank: "asteroids",
    d: "Pilote ton vaisseau et pulvérise les astéroïdes, vague après vague.", tags: ["VAGUES"]},
  meta: {genres: ["ARCADE", "ESPACE"]},
  records: () => [["Meilleur score", num(rk("asteroids16.best", 0))]],
  classements: [{label: "MEILLEUR SCORE", game: "asteroids", board: () => "best", fmt: N}],
  transfert: {cles: ["asteroids16.best"],
    collecter(g){
      { const v = Number(readKey("asteroids16.best", 0)); if (v > 0) g["asteroids16.best"] = v; }
    },
    decrire(g, out){
      if (g["asteroids16.best"]) out.push(`Asteroids : ${g["asteroids16.best"]} points`);
    },
    fusionner(g, done){
      { const v = Number(g["asteroids16.best"]); if (v > 0 && v > Number(readKey("asteroids16.best", 0))){ writeKey("asteroids16.best", v); done.push(`Asteroids : record ${v}`); } }
    }}
});

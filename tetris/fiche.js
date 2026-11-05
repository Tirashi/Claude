/* Tetris : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "tetris/index.html",
  carte: {n: "TETRIS", s: "TETRIS", ic: "blocks", fam: "rep", lb: "linear-gradient(#3b2a8a, #160f45)", lt: "#facc15", sh: "#6a4ad0", rank: "tetris",
    d: "Empile les pièces, complète des lignes, tiens le plus longtemps possible.", tags: ["NIVEAUX"]},
  meta: {genres: ["ARCADE"]},
  records: () => [["Meilleur score", num(rk("tetris16.best", 0))]],
  classements: [{label: "MEILLEUR SCORE", game: "tetris", board: () => "best", fmt: N}],
  // meilleur score : on garde le plus grand
  transfert: {cle: "tetris16.best",
    collecter: () => { const v = Number(readKey("tetris16.best", 0)); return v > 0 ? v : null; },
    decrire: v => `Tetris : ${v} points`,
    fusionner: v => { v = Number(v); if (!(v > 0) || v <= Number(readKey("tetris16.best", 0))) return null; writeKey("tetris16.best", v); return `Tetris : record ${v}`; }}
});

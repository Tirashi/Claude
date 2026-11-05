/* Yams : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "yams/index.html",
  carte: {n: "YAMS", s: "YAMS", ic: "des", fam: "3d", lb: "linear-gradient(#f6e1f3, #bfe8d0)", lt: "#6b4a7a", sh: "#e0559a", rank: "yams",
    d: "Le Yams classique avec de vrais dés en 3D : lance-les d'un geste, garde les bons et remplis les 13 cases de la feuille. Six styles de dés à débloquer, de la taverne à la Lune.", tags: ["3D", "DÉS", "6 STYLES"]},
  meta: {added: "2026-10-17", genres: ["HASARD"]},
  enCours: () => { const p = rk("yams.partie", null); return p && p.tour < 13 ? `TOUR ${p.tour + 1}/13` : null; },
  records: () => [["Meilleur score", num(rk("yams.best", 0), "pts")], ["Yams inscrits", num(rk("yams.nbYams", 0))], ["Parties jouées", num(rk("yams.parties", 0))]],
  classements: [{label: "MEILLEUR SCORE", game: "yams", board: () => "best", fmt: v => N(v) + " pts", title: () => "MEILLEUR SCORE"}],
  transfert: {cles: ["yams"],
    collecter(g){
      const ya = {b: Number(readKey("yams.best", 0)) || 0, p: Number(readKey("yams.parties", 0)) || 0, y: Number(readKey("yams.nbYams", 0)) || 0, o: Number(readKey("yams.bonus", 0)) || 0};
      if (ya.b || ya.p) g.yams = ya;
    },
    decrire(g, out){
      if (g.yams) out.push(`Yams : record ${g.yams.b || 0} pts, ${g.yams.p || 0} partie${g.yams.p > 1 ? "s" : ""}`);
    },
    fusionner(g, done){
      if (g.yams && typeof g.yams === "object"){
        const a = g.yams; let n = 0;
        if (a.b > (Number(readKey("yams.best", 0)) || 0)){ writeKey("yams.best", Math.round(a.b)); n++; }
        [["p", "parties"], ["y", "nbYams"], ["o", "bonus"]].forEach(([c, k]) => { if (a[c] > (Number(readKey("yams." + k, 0)) || 0)) writeKey("yams." + k, Math.round(a[c])); });
        if (n) done.push("Yams : record");
      }
    }}
});

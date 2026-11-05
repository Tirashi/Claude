/* Duché : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "duche/index.html",
  carte: {n: "DUCHE", s: "DUCHE", ic: "donjon", fam: "32", lb: "linear-gradient(#5a3a20, #2a1a0e)", lt: "#f0c24a", sh: "#8a6410", rank: "duche",
    d: "Un petit 4X au tour par tour sur 37 terres hexagonales en pixel art 32 bits : bâtis, recrute, conquiers les terres de trois seigneurs rivaux et gagne la couronne en 30 saisons. Combats en scènes HD-2D, événements, un Duché du jour pour toute la famille.", tags: ["STRATEGIE", "30 TOURS", "DUCHE DU JOUR"]},
  meta: {added: "2026-10-21", genres: ["TACTIQUE", "DU JOUR"]},
  enCours: () => { const d = rk("duche.dailyRun", null), r = rk("duche.run", null); return d && d.graine === dayNum() ? "DUCHE DU JOUR" : r && r.tour ? `TOUR ${r.tour}/30` : null; },
  duJour: () => { const t = rk("duche.dailyTry", null); return !!(t && t.j === dayNum()); },
  records: () => [["Meilleur score (normal)", num(rk("duche.best", 0), "pts")], ["Duchés du jour", num(count(rk("duche.daily", {})))]],
  classements: [{label: "MEILLEUR SCORE", game: "duche", board: () => "best", fmt: v => N(v) + " pts", title: () => "MEILLEUR REGNE",
     note: "Le meilleur score d'une partie en normal (Duché du jour compris) : terres ×100, or, bois ÷ 2, bâtiments ×20, légitimité ×5, votes ×50, primes de victoire."},
    {label: "DUCHE DU JOUR", ctl: ["day"], game: "duche", board: daily, fmt: v => N(v) + " pts", title: () => "DUCHE DU JOUR",
     note: "La même carte, les mêmes rivaux et les mêmes événements pour toute la famille, en normal. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a régné sur le duché ce jour-là." : "Personne n'a encore joué le Duché du jour : à toi !"}],
  transfert: {cles: ["duche"],
    collecter(g){
      const du = {b: Number(readKey("duche.best", 0)) || 0, d: readKey("duche.daily", {}) || {}};
      if (du.b || Object.keys(du.d).length) g.duche = du;
    },
    decrire(g, out){
      if (g.duche){ const d = Object.keys(g.duche.d || {}).length; out.push(`Duché : meilleur score ${g.duche.b || 0}${d ? `, ${d} duché${d > 1 ? "s" : ""} du jour` : ""}`); }
    },
    fusionner(g, done){
      if (g.duche && typeof g.duche === "object"){
        // fusion : le meilleur score, et pour chaque Duché du jour le plus haut
        const a = g.duche, daily = readKey("duche.daily", {}) || {}; let n = 0;
        if (Number(a.b) > (Number(readKey("duche.best", 0)) || 0)){ writeKey("duche.best", Math.round(a.b)); n++; }
        for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
        if (n){ writeKey("duche.daily", daily); done.push(`Duché : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

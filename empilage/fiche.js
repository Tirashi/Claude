/* Empilage : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "empilage/index.html",
  carte: {n: "EMPILAGE", s: "EMPILAGE", ic: "stack", fam: "3d", lb: "linear-gradient(#9fd8ff, #ffd6c8)", lt: "#5a46a8", sh: "#f29bc0", rank: "empilage",
    d: "Lâche chaque bloc pile sur la tour : ce qui dépasse tombe. Monte du matin jusqu'à la nuit étoilée, en 3D pastel. Une tour du jour pour toute la famille.", tags: ["3D", "TOUR DU JOUR"]},
  meta: {added: "2026-10-16", genres: ["ADRESSE", "DU JOUR"]},
  duJour: () => rk("empilage.dailyTry", 0) === dayNum(),
  records: () => [["Plus haute tour", num(rk("empilage.best", 0), "blocs")], ["Tours du jour", num(count(rk("empilage.daily", {})))], ["Parties jouées", num(rk("empilage.parties", 0))]],
  classements: [{label: "PLUS HAUTE TOUR", game: "empilage", board: () => "best", fmt: v => N(v) + (v > 1 ? " blocs" : " bloc"), title: () => "PLUS HAUTE TOUR"},
    {label: "TOUR DU JOUR", ctl: ["day"], game: "empilage", board: daily, fmt: v => N(v) + (v > 1 ? " blocs" : " bloc"), title: () => "TOUR DU JOUR",
     note: "Les mêmes vitesses et les mêmes départs pour toute la famille. Seule la première tour du jour est classée.",
     empty: () => st.back ? "Personne n'a joué la tour ce jour-là." : "Personne n'a encore joué la tour du jour : à toi !"}],
  transfert: {cles: ["empilage"],
    collecter(g){
      const em = {b: Number(readKey("empilage.best", 0)) || 0, p: Number(readKey("empilage.parties", 0)) || 0, d: readKey("empilage.daily", {}) || {}};
      if (em.b || em.p) g.empilage = em;
    },
    decrire(g, out){
      if (g.empilage) out.push(`Empilage : record ${g.empilage.b || 0} bloc${g.empilage.b > 1 ? "s" : ""}, ${g.empilage.p || 0} partie${g.empilage.p > 1 ? "s" : ""}`);
    },
    fusionner(g, done){
      if (g.empilage && typeof g.empilage === "object"){
        const a = g.empilage; let n = 0;
        if (a.b > (Number(readKey("empilage.best", 0)) || 0)){ writeKey("empilage.best", Math.round(a.b)); n++; }
        if (a.p > (Number(readKey("empilage.parties", 0)) || 0)) writeKey("empilage.parties", Math.round(a.p));
        const daily = readKey("empilage.daily", {}) || {};
        for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
        if (n){ writeKey("empilage.daily", daily); done.push(`Empilage : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

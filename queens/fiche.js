/* Queens : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "queens/index.html",
  carte: {n: "QUEENS", s: "QUEENS", ic: "crown", fam: "16", lb: "linear-gradient(#3a4cc8, #141a6a)", lt: "#ffd23f", sh: "#3a4cc8", rank: "queens",
    d: "Une reine par ligne, par colonne et par couleur, sans qu'elles se touchent.", tags: ["5×5 A 9×9"], more: [["GRILLE DU JOUR", "queens/index.html#jour"]]},
  meta: {updated: "2026-10-15", genres: ["LOGIQUE", "DU JOUR"]},
  nom: "Queens",
  enCours: () => { const r = rk("queens16.dailyRun", null); return r && r.day === dayNum() ? "GRILLE DU JOUR" : null; },
  duJour: () => !!(rk("queens16.daily", {}) || {})[dayNum()],
  records: () => { const b = rk("queens16.best", {}) || {};
    return Object.keys(b).filter(n => /^[5-9]$/.test(n) && b[n] > 0).sort().map(n => [`${n}×${n}`, mmss(b[n])]).concat([["Grilles du jour", num(count(rk("queens16.daily", {})))]]); },
  classements: [{label: "MEILLEUR TEMPS", ctl: ["size"], game: "queens", board: () => "best:" + st.size, fmt: T, title: () => `${st.size}×${st.size}`, note: "Grilles réussies sans indice."},
    {label: "GRILLE DU JOUR", ctl: ["day"], game: "queens", board: daily, fmt: T,
     title: () => { const n = [9, 5, 6, 7, 7, 8, 9][day().getDay()]; return `GRILLE DU JOUR · ${n}×${n}`; },
     note: "La même grille pour toute la famille, de 5×5 le lundi à 9×9 le week-end. Temps plus 30 secondes par indice. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a fini la grille ce jour-là." : "Personne n'a encore fini la grille du jour : à toi de jouer !"}],
  transfert: {cles: ["queens", "queensDaily"],
    collecter(g){
      const q = readKey("queens16.best", {}); if (q && Object.keys(q).length) g.queens = q;
      const qd = readKey("queens16.daily", {}); if (qd && Object.keys(qd).length) g.queensDaily = qd;
    },
    decrire(g, out){
      if (g.queens) out.push("Queens : " + Object.keys(g.queens).sort((a, b) => a - b).map(n => `${n}×${n} en ${fmtTime(g.queens[n])}`).join(", "));
      if (g.queensDaily){ const n = Object.keys(g.queensDaily).length; out.push(`Queens : ${n} grille${n > 1 ? "s" : ""} du jour`); }
    },
    fusionner(g, done){
      if (g.queens && typeof g.queens === "object"){
        const mine = readKey("queens16.best", {}) || {}; let n = 0;
        for (const [size, t] of Object.entries(g.queens)) if (/^[5-9]$/.test(size) && t > 0 && (!mine[size] || t < mine[size])){ mine[size] = Math.round(t); n++; }
        if (n){ writeKey("queens16.best", mine); done.push(`Queens : ${n} record${n > 1 ? "s" : ""}`); }
      }
      if (g.queensDaily && typeof g.queensDaily === "object"){
        const mine = readKey("queens16.daily", {}) || {}; let n = 0;
        for (const [d, t] of Object.entries(g.queensDaily)) if (/^\d{8}$/.test(d) && t > 0 && (!mine[d] || t < mine[d])){ mine[d] = Math.round(t); n++; }
        if (n){ writeKey("queens16.daily", mine); done.push(`Queens : ${n} grille${n > 1 ? "s" : ""} du jour`); }
      }
    }}
});

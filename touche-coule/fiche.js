/* Touché Coulé : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "touche-coule/index.html",
  carte: {n: "TOUCHE COULE", s: "TOUCHE COULE", ic: "boat", fam: "16", lb: "linear-gradient(#2b6fd0, #0f1866)", lt: "#ffd84a", sh: "#2b6fd0", rank: "touchecoule",
    d: "Bataille navale contre l'ordinateur, en mode classique ou avec sonar et torpilles.", tags: ["3 NIVEAUX D'IA"]},
  meta: {genres: ["TACTIQUE"]},
  records: () => { const b = rk("touchecoule.best", {}) || {}, ai = {easy: "facile", normal: "normale", hard: "amiral"};
    return Object.keys(b).filter(k => b[k] > 0).sort().map(k => { const [m, a] = k.split(":"); return [`${m === "arsenal" ? "Arsenal" : "Classique"} · IA ${ai[a] || a}`, num(b[k], "tirs")]; }); },
  classements: [{label: "MEILLEURE VICTOIRE", ctl: ["tcmode", "tcai"], game: "touchecoule", board: () => `best:${st.tcmode}:${st.tcai}`, fmt: v => N(v) + " tirs",
     title: () => `${TCMODES.find(m => m[0] === st.tcmode)[1]} · IA ${TCAI.find(m => m[0] === st.tcai)[1]}`, note: "La victoire en le moins de tirs, par mode et par niveau de l'IA."}],
  transfert: {cles: ["touchecoule"],
    collecter(g){
      const tc = readKey("touchecoule.best", {}); if (tc && Object.keys(tc).length) g.touchecoule = tc;
    },
    decrire(g, out){
      if (g.touchecoule){ const v = Object.values(g.touchecoule).filter(x => x > 0); if (v.length) out.push(`Touché Coulé : meilleure victoire en ${Math.min(...v)} tirs`); }
    },
    fusionner(g, done){
      if (g.touchecoule && typeof g.touchecoule === "object"){
        const mine = readKey("touchecoule.best", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(g.touchecoule)) if (/^(classic|arsenal):(easy|normal|hard)$/.test(k) && v > 0 && (!mine[k] || v < mine[k])){ mine[k] = Math.round(v); n++; }
        if (n){ writeKey("touchecoule.best", mine); done.push(`Touché Coulé : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

/* Escadrille ! : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "escadrille/index.html",
  carte: {n: "ESCADRILLE !", s: "ESCADRILLE", ic: "fighter", fam: "32", lb: "linear-gradient(#3a7cc4, #0f2850)", lt: "#ffd23f", sh: "#3a7cc4", rank: "escadrille",
    d: "La bataille aérienne où chaque avion a un pouvoir : radar, bombes en croix, missile, esquive, roquettes, leurres, ballons de barrage… Choisis tes 4 avions au hangar parmi 10, abats l'escadrille pirate cachée dans les nuages, gagne des avions et des escadrilles.", tags: ["3 NIVEAUX", "10 AVIONS", "4 ESCADRILLES"]},
  meta: {added: "2026-10-17", updated: "2026-10-19", genres: ["TACTIQUE"]},
  records: () => { const b = rk("escadrille.best", {}) || {}; return [["easy", "Recrue"], ["normal", "Pilote"], ["hard", "As"]].map(([k, l]) => [l, num(b[k], "tours")]).concat([["Victoires", num(rk("escadrille.victoires", 0), "")], ["Escadrilles", `${Math.max(1, (rk("escadrille.skins", ["a"]) || ["a"]).length)}/4`],
    // avions débloqués au hangar (mêmes conditions que escadrille/jeu.js : PLANES[..].need)
    ["Avions", (() => { const v = Number(rk("escadrille.victoires", 0)) || 0, p = rk("escadrille.palmares", {}) || {}, rap = p.rapide || Object.values(b).some(x => x > 0 && x < 25), as = Math.max(Number(p.hard) || 0, b.hard ? 1 : 0);
      return `${4 + (v >= 2) + (v >= 4) + (v >= 6) + !!rap + !!p.intacte + (as >= 2)}/10`; })()]]); },
  classements: [{label: "MEILLEURE VICTOIRE", ctl: ["esai"], game: "escadrille", board: () => `best:${st.esai}`, fmt: v => N(v) + " tours",
     title: () => ESAI.find(m => m[0] === st.esai)[1], note: "La victoire en le moins de tours, par niveau de l'ordinateur."}],
  transfert: {cles: ["escadrille"],
    collecter(g){
      const es = {b: readKey("escadrille.best", {}) || {}, v: Number(readKey("escadrille.victoires", 0)) || 0, s: readKey("escadrille.skins", []) || [], k: readKey("escadrille.skin", null), p: readKey("escadrille.palmares", {}) || {}}; if (Object.keys(es.b).length || es.v) g.escadrille = es;
    },
    decrire(g, out){
      if (g.escadrille){ const v = Object.values(g.escadrille.b || {}).filter(x => x > 0), n = g.escadrille.v || 0;
        const f = Math.max(1, (g.escadrille.s || []).length);
        if (v.length || n) out.push(`Escadrille ! : ${n} victoire${n > 1 ? "s" : ""}${v.length ? `, meilleure en ${Math.min(...v)} tours` : ""}, ${f} escadrille${f > 1 ? "s" : ""} sur 4`); }
    },
    fusionner(g, done){
      if (g.escadrille && typeof g.escadrille === "object"){
        const mine = readKey("escadrille.best", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(g.escadrille.b || {})) if (/^(easy|normal|hard)$/.test(k) && v > 0 && (!mine[k] || v < mine[k])){ mine[k] = Math.round(v); n++; }
        if (n) writeKey("escadrille.best", mine);
        const vic = Math.round(Number(g.escadrille.v) || 0), myVic = Number(readKey("escadrille.victoires", 0)) || 0;
        if (vic > myVic) writeKey("escadrille.victoires", vic);
        const mySk = readKey("escadrille.skins", ["a"]) || ["a"], sk = ["a", "b", "c", "d"].filter(k => mySk.includes(k) || (Array.isArray(g.escadrille.s) && g.escadrille.s.includes(k)));
        const newSk = sk.length > mySk.length; if (newSk) writeKey("escadrille.skins", sk);
        if (!readKey("escadrille.skin", null) && /^[abcd]$/.test(g.escadrille.k || "") && sk.includes(g.escadrille.k)) writeKey("escadrille.skin", g.escadrille.k);
        // palmarès (avions débloqués au hangar) : le plus grand de chaque compte
        const ep = readKey("escadrille.palmares", {}) || {}; let np = 0;
        for (const k of ["easy", "normal", "hard"]) { const v = Math.round(Number((g.escadrille.p || {})[k]) || 0); if (v > (ep[k] || 0)){ ep[k] = v; np++; } }
        for (const k of ["rapide", "intacte"]) if ((g.escadrille.p || {})[k] === true && !ep[k]){ ep[k] = true; np++; }
        if (np) writeKey("escadrille.palmares", ep);
        if (n || vic > myVic || newSk || np) done.push(`Escadrille ! : ${n ? n + " record" + (n > 1 ? "s" : "") : vic > myVic ? "victoires" : newSk ? "escadrilles" : "avions"}`);
      }
    }}
});

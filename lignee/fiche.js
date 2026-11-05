/* Lignée : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "lignee/index.html",
  carte: {n: "LIGNEE", s: "LIGNEE", ic: "tree", fam: "16", lb: "linear-gradient(#6b3f1f, #2f1a0c)", lt: "#e0a83a", sh: "#a0682e", rank: "lignee",
    d: "Reconstitue un arbre généalogique grâce aux indices, avec 3 vies : familles françaises, dynasties royales ou familles de films et de séries.", tags: ["ARBRES INFINIS"]},
  meta: {genres: ["LOGIQUE", "DU JOUR"]},
  nom: "Lignée",
  enCours: () => { const today = dayNum().toString(36).toUpperCase(), cd = rk("lignee.curDaily", null), c = rk("lignee.cur", null);
    return cd && cd.lives !== 0 && String(cd.code).endsWith("-J" + today) ? "ARBRE DU JOUR" : c && c.lives !== 0 ? "UN ARBRE" : null; },
  duJour: () => { const j = "-J" + dayNum().toString(36).toUpperCase(); return Object.keys(rk("lignee.daily", {}) || {}).some(c => c.endsWith(j)); },
  records: () => { const s = rk("lignee.stats", {}) || {}, out = [["Arbres reconstitués", num(Object.values(s).reduce((a, v) => a + (v && v.n || 0), 0))]];
    for (const m of ["C", "R"]) LEVELS.forEach((l, i) => { const v = s[m + (i + 1)]; if (v && v.best > 0) out.push([`${m === "R" ? "Royal" : "Classique"} ${l.toLowerCase()}`, mmss(v.best)]); });
    return out.concat([["Arbres du jour", num(count(rk("lignee.daily", {})))]]); },
  classements: [{label: "ARBRE DU JOUR", ctl: ["mode", "day"], game: "lignee", board: () => "daily:" + dayCode(st.mode, day()), fmt: T,
     title: () => `ARBRE DU JOUR · ${st.mode === "R" ? "ROYAL" : "CLASSIQUE"}`,
     empty: () => st.back ? "Personne n'a fini l'arbre ce jour-là." : "Personne n'a encore fini l'arbre du jour : à toi de jouer !"},
    {label: "PAR NIVEAU", ctl: ["mode", "level"], game: "lignee", board: () => "best:" + st.mode + st.level, fmt: T, title: () => `${st.mode === "R" ? "ROYAL" : "CLASSIQUE"} · ${LEVELS[st.level - 1]}`},
    {label: "ARBRES", game: "lignee", board: () => "arbres", fmt: v => N(v) + (v > 1 ? " arbres" : " arbre"), title: () => "ARBRES RECONSTITUES"}],
  transfert: {cles: ["lignee", "ligneeDaily"],
    collecter(g){
      const lg = readKey("lignee.stats", {}); if (lg && Object.keys(lg).length) g.lignee = lg;
      const ld = readKey("lignee.daily", {}); if (ld && Object.keys(ld).length) g.ligneeDaily = ld;
    },
    decrire(g, out){
      if (g.lignee){ const n = Object.values(g.lignee).reduce((s, v) => s + (v && v.n || 0), 0); if (n) out.push(`Lignée : ${n} arbre${n > 1 ? "s" : ""} reconstitué${n > 1 ? "s" : ""}`); }
    },
    fusionner(g, done){
      if (g.lignee && typeof g.lignee === "object"){
        const mine = readKey("lignee.stats", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(g.lignee)){
          if (!/^([CR][1-4]|F[1-4]:[A-Z]{2,8})$/.test(k) || !v) continue;
          const m = mine[k] || {best: 0, n: 0}, before = JSON.stringify(m);
          if (v.best > 0 && (!m.best || v.best < m.best)) m.best = Math.round(v.best);
          if ((v.n || 0) > (m.n || 0)) m.n = v.n;
          if (JSON.stringify(m) !== before){ mine[k] = m; n++; }
        }
        if (n){ writeKey("lignee.stats", mine); done.push(`Lignée : ${n} niveau${n > 1 ? "x" : ""} mis à jour`); }
      }
      if (g.ligneeDaily && typeof g.ligneeDaily === "object"){
        const mine = readKey("lignee.daily", {}) || {}; let n = 0;
        for (const [code, t] of Object.entries(g.ligneeDaily)) if (/^[CR]2-J[0-9A-Z]+$/.test(code) && t > 0 && (!mine[code] || t < mine[code])){ mine[code] = Math.round(t); n++; }
        if (n){ writeKey("lignee.daily", mine); done.push(`Lignée : ${n} Arbre${n > 1 ? "s" : ""} du jour`); }
      }
    }}
});

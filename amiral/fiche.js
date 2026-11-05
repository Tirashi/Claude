/* Amiral ! : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "amiral/index.html",
  carte: {n: "AMIRAL !", s: "AMIRAL !", ic: "anchor", fam: "32", lb: "linear-gradient(#1c579c, #0a1c40)", lt: "#ffd23f", sh: "#1c579c", rank: "amiral",
    d: "La bataille navale où chaque navire a un pouvoir : compose ta flotte au chantier naval parmi 11 navires (avion, salve, torpille, sonar, mines, fumée, leurre...), et chaque jour une bataille imposée.", tags: ["3 NIVEAUX", "DU JOUR"]},
  meta: {updated: "2026-10-19", genres: ["TACTIQUE", "DU JOUR"]},
  duJour: () => rk("amiral.dailyTry", 0) === dayNum(),
  records: () => { const b = rk("amiral.best", {}) || {}, p = rk("amiral.palmares", {}) || {};
    const nav = 8 + (p.normal > 0) + (p.hard > 0) + (p.victoires >= 10);
    return [["easy", "Mousse"], ["normal", "Capitaine"], ["hard", "Amiral"]].map(([k, l]) => [l, num(b[k], "tours")])
      .concat([["Victoires", num(p.victoires)], ["Navires au chantier", nav + " / 11"], ["Batailles du jour", num(count(rk("amiral.daily", {})))]]); },
  classements: [{label: "MEILLEURE VICTOIRE", ctl: ["amai"], game: "amiral", board: () => `best:${st.amai}`, fmt: v => N(v) + " tours",
     title: () => AMAI.find(m => m[0] === st.amai)[1], note: "La victoire en le moins de tours, par niveau de l'ordinateur."},
    {label: "BATAILLE DU JOUR", ctl: ["day"], game: "amiral", board: daily, fmt: v => N(v) + " tours", title: () => "BATAILLE DU JOUR",
     note: "Les mêmes flottes et le même ennemi pour toute la famille, en Capitaine ; la victoire en le moins de tours. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a gagné la bataille ce jour-là." : "Personne n'a encore gagné la bataille du jour : à toi !"}],
  transfert: {cles: ["amiral", "amiralPal"],
    collecter(g){
      const am = readKey("amiral.best", {}); if (am && Object.keys(am).length) g.amiral = am;
      const ap = {p: readKey("amiral.palmares", {}) || {}, d: readKey("amiral.daily", {}) || {}}; if (Object.keys(ap.p).length || Object.keys(ap.d).length) g.amiralPal = ap;
    },
    decrire(g, out){
      if (g.amiral){ const v = Object.values(g.amiral).filter(x => x > 0); if (v.length) out.push(`Amiral ! : meilleure victoire en ${Math.min(...v)} tours`); }
      if (g.amiralPal){ const n = Number((g.amiralPal.p || {}).victoires) || 0, d = Object.keys(g.amiralPal.d || {}).length;
        if (n || d) out.push(`Amiral ! : ${n} victoire${n > 1 ? "s" : ""}${d ? `, ${d} bataille${d > 1 ? "s" : ""} du jour` : ""}`); }
    },
    fusionner(g, done){
      if (g.amiral && typeof g.amiral === "object"){
        const mine = readKey("amiral.best", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(g.amiral)) if (/^(easy|normal|hard)$/.test(k) && v > 0 && (!mine[k] || v < mine[k])){ mine[k] = Math.round(v); n++; }
        if (n){ writeKey("amiral.best", mine); done.push(`Amiral ! : ${n} record${n > 1 ? "s" : ""}`); }
      }
      if (g.amiralPal && typeof g.amiralPal === "object"){
        // palmarès (navires débloqués au chantier) : le plus grand de chaque compte ; batailles du jour : le moins de tours
        const a = g.amiralPal, pm = readKey("amiral.palmares", {}) || {}, daily = readKey("amiral.daily", {}) || {}; let n = 0;
        for (const k of ["victoires", "easy", "normal", "hard"]) { const v = Math.round(Number((a.p || {})[k]) || 0); if (v > (pm[k] || 0)){ pm[k] = v; n++; } }
        for (const k of ["rapide", "intacte"]) if ((a.p || {})[k] === true && !pm[k]){ pm[k] = true; n++; }
        for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
        if (n){ writeKey("amiral.palmares", pm); writeKey("amiral.daily", daily); done.push("Amiral ! : palmarès et batailles du jour"); }
      }
    }}
});

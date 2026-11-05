/* Pont stellaire : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "pont-stellaire/index.html",
  carte: {n: "PONT STELLAIRE", s: "PONT STELLAIRE", ic: "stars", fam: "32", lb: "radial-gradient(circle at 70% 25%, #24407a, #070a1c 75%)", lt: "#ffd76a", sh: "#2a4a9a", rank: "pontstellaire",
    d: "Relie les étoiles par des faisceaux de lumière, sans croisement, pour dessiner une constellation. Un ciel du jour pour toute la famille.", tags: ["CIEL DU JOUR"]},
  meta: {added: "2026-10-12", updated: "2026-10-15", genres: ["LOGIQUE", "ESPACE", "DU JOUR"]},
  nom: "Pont stellaire",
  enCours: () => { const d = rk("pontstellaire.dailyRun", null), g = rk("pontstellaire.game", null);
    return d && d.day === dayNum() ? "CIEL DU JOUR" : g && !g.daily ? "UN CIEL" : null; },
  duJour: () => !!(rk("pontstellaire.daily", {}) || {})[dayNum()],
  records: () => { const b = rk("pontstellaire.best", {}) || {};
    return ["7", "9", "11"].map(n => [`${n}×${n}`, b[n] > 0 ? mmss(b[n]) : null]).concat([["Constellations", num(rk("pontstellaire.wins", 0))]]); },
  classements: [{label: "CIEL DU JOUR", ctl: ["day"], game: "pontstellaire", board: daily, fmt: T,
     title: () => "CIEL DU JOUR", note: "Le même ciel 9×9 pour toute la famille, plus 30 secondes par indice. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a dessiné le ciel ce jour-là." : "Personne n'a encore dessiné le ciel du jour : à toi de jouer !"},
    {label: "PAR TAILLE", ctl: ["pssize"], game: "pontstellaire", board: () => "best:" + st.pssize, fmt: T, title: () => `${st.pssize}×${st.pssize}`, note: "Le meilleur temps, plus 30 secondes par indice."},
    {label: "CONSTELLATIONS", game: "pontstellaire", board: () => "ciels", fmt: v => N(v) + (v > 1 ? " ciels" : " ciel"), title: () => "CONSTELLATIONS DESSINEES"}],
  transfert: {cles: ["pontstellaire"],
    collecter(g){
      const ps = {b: readKey("pontstellaire.best", {}) || {}, d: readKey("pontstellaire.daily", {}) || {}, w: Number(readKey("pontstellaire.wins", 0)) || 0};
      if (ps.w || Object.keys(ps.b).length) g.pontstellaire = ps;
    },
    decrire(g, out){
      if (g.pontstellaire){ const p = g.pontstellaire, b = Object.keys(p.b || {}).sort((x, y) => x - y).map(n => `${n}×${n} en ${fmtTime(p.b[n])}`);
        out.push(`Pont stellaire : ${p.w || 0} constellation${p.w > 1 ? "s" : ""}` + (b.length ? ", " + b.join(", ") : "")); }
    },
    fusionner(g, done){
      if (g.pontstellaire && typeof g.pontstellaire === "object"){
        const p = g.pontstellaire, best = readKey("pontstellaire.best", {}) || {}, daily = readKey("pontstellaire.daily", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(p.b || {})) if (/^(7|9|11)$/.test(k) && v > 0 && !(best[k] > 0 && best[k] <= v)){ best[k] = Math.round(v); n++; }
        for (const [k, v] of Object.entries(p.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] > 0 && daily[k] <= v)){ daily[k] = Math.round(v); n++; }
        const w = Number(readKey("pontstellaire.wins", 0)) || 0;
        if (p.w > w){ writeKey("pontstellaire.wins", Math.round(p.w)); n++; }
        if (n){ writeKey("pontstellaire.best", best); writeKey("pontstellaire.daily", daily); done.push(`Pont stellaire : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

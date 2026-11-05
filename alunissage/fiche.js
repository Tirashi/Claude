/* Alunissage : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "alunissage/index.html",
  carte: {n: "ALUNISSAGE", s: "ALUNISSAGE", ic: "lander", fam: "32", lb: "linear-gradient(#0a0c1e, #2c2a28)", lt: "#e8e4d8", sh: "#8a8a90", rank: "alunissage",
    d: "Pose ton module en douceur avec deux réacteurs, de la Lune à la comète. Plus l'aire est étroite, plus elle rapporte.", tags: ["MISSION DU JOUR"]},
  meta: {added: "2026-10-13", updated: "2026-10-15", genres: ["ADRESSE", "ESPACE", "DU JOUR"]},
  duJour: () => rk("alunissage.dailyTry", 0) === dayNum(),
  records: () => [["Meilleure mission", num(rk("alunissage.best", 0), "pts")], ["Sites atteints", num(rk("alunissage.sites", 0))], ["Missions du jour", num(count(rk("alunissage.daily", {})))]],
  classements: [{label: "MEILLEUR SCORE", game: "alunissage", board: () => "best", fmt: v => N(v) + " pts", title: () => "MEILLEURE MISSION",
     note: "Score d'une mission : à chaque site, (100 + carburant restant) × le multiplicateur de l'aire."},
    {label: "MISSION DU JOUR", ctl: ["day"], game: "alunissage", board: daily, fmt: v => N(v) + " pts",
     title: () => "MISSION DU JOUR", note: "La même suite de sites pour toute la famille. Seule la première mission du jour est classée.", empty: () => st.back ? "Personne n'a joué la mission ce jour-là." : "Personne n'a encore joué la mission du jour : à toi !"}],
  transfert: {cles: ["alunissage"],
    collecter(g){
      const al = {b: Number(readKey("alunissage.best", 0)) || 0, s: Number(readKey("alunissage.sites", 0)) || 0, d: readKey("alunissage.daily", {}) || {}};
      if (al.b || al.s) g.alunissage = al;
    },
    decrire(g, out){
      if (g.alunissage) out.push(`Alunissage : record ${g.alunissage.b || 0} points, ${g.alunissage.s || 0} site${g.alunissage.s > 1 ? "s" : ""} atteint${g.alunissage.s > 1 ? "s" : ""}`);
    },
    fusionner(g, done){
      if (g.alunissage && typeof g.alunissage === "object"){
        const a = g.alunissage; let n = 0;
        if (a.b > (Number(readKey("alunissage.best", 0)) || 0)){ writeKey("alunissage.best", Math.round(a.b)); n++; }
        if (a.s > (Number(readKey("alunissage.sites", 0)) || 0)){ writeKey("alunissage.sites", Math.round(a.s)); n++; }
        const daily = readKey("alunissage.daily", {}) || {};
        for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
        if (n){ writeKey("alunissage.daily", daily); done.push(`Alunissage : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

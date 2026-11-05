/* Le Mot d'or : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "mot-d-or/index.html",
  carte: {n: "LE MOT D'OR", s: "MOT D'OR", ic: "motdor", fam: "32", lb: "linear-gradient(#7a2a20, #2a0e0a)", lt: "#ffd23f", sh: "#b0402c", rank: "motdor",
    d: "Un mot de 6 lettres par jour à trouver en 6 essais, sur un bureau à la lueur de la lampe. Or : bien placée ; argent : mal placée. Le même mot pour toute la famille, et un entraînement pour rejouer.", tags: ["MOTS", "MOT DU JOUR"]},
  meta: {added: "2026-10-20", genres: ["LOGIQUE", "DU JOUR"]},
  enCours: () => { const j = rk("motdor.jour", null); return j && j.j === dayNum() && !j.fini && (j.rows || []).length ? "MOT DU JOUR" : null; },
  duJour: () => { const j = rk("motdor.jour", null); return !!(j && j.j === dayNum() && j.fini); },
  records: () => { const s = rk("motdor.stats", {}) || {};
    return [["Mots du jour trouvés", num(s.gagnees)], ["Meilleure série", num(s.record, s.record > 1 ? "jours" : "jour")], ["Parties", num(s.parties)]]; },
  classements: [{label: "MOT DU JOUR", ctl: ["day"], game: "motdor", board: daily, fmt: v => N(v) + (v > 1 ? " essais" : " essai"), title: () => "MOT DU JOUR",
     note: "Le même mot pour toute la famille ; le moins d'essais gagne. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a trouvé le mot ce jour-là." : "Personne n'a encore trouvé le mot du jour : à toi !"},
    {label: "SERIE", game: "motdor", board: () => "serie", fmt: v => N(v) + (v > 1 ? " jours" : " jour"), title: () => "MEILLEURE SERIE",
     note: "Le plus de jours d'affilée avec le mot du jour trouvé."}],
  transfert: {cles: ["motdor"],
    collecter(g){
      const mo = {s: readKey("motdor.stats", null), d: readKey("motdor.daily", {}) || {}};
      if (mo.s && mo.s.parties > 0) g.motdor = mo;
    },
    decrire(g, out){
      if (g.motdor && g.motdor.s){ const s = g.motdor.s; out.push(`Le Mot d'or : ${s.gagnees || 0} mot${s.gagnees > 1 ? "s" : ""} du jour trouvé${s.gagnees > 1 ? "s" : ""}, meilleure série ${s.record || 0}`); }
    },
    fusionner(g, done){
      if (g.motdor && typeof g.motdor === "object" && g.motdor.s && typeof g.motdor.s === "object"){
        // fusion : le plus grand de chaque statistique ; pour chaque mot du jour, le moins d'essais
        const a = g.motdor.s, s = Object.assign({parties: 0, gagnees: 0, serie: 0, record: 0, dernier: 0, dist: [0, 0, 0, 0, 0, 0]}, readKey("motdor.stats", {}) || {});
        const daily = readKey("motdor.daily", {}) || {}; let n = 0;
        for (const k of ["parties", "gagnees", "record"]) if (Number(a[k]) > s[k]){ s[k] = Math.round(Number(a[k])); n++; }
        if (Number(a.dernier) > s.dernier){ s.dernier = Math.round(Number(a.dernier)); s.serie = Math.round(Number(a.serie) || 0); }
        if (Array.isArray(a.dist)) s.dist = s.dist.map((v, i) => Math.max(v, Math.round(Number(a.dist[i]) || 0)));
        for (const [k, v] of Object.entries(g.motdor.d || {})) if (/^\d{8}$/.test(k) && v >= 1 && v <= 6 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
        if (n){ writeKey("motdor.stats", s); writeKey("motdor.daily", daily); done.push(`Le Mot d'or : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

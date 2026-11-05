/* Le Thé des Jarls : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "the-des-jarls/index.html",
  carte: {n: "LE THE DES JARLS", s: "JARLS", ic: "jarl", fam: "32", lb: "linear-gradient(#2c3c70, #0e1428)", lt: "#f3d58c", sh: "#3a4a8a", rank: "jarls",
    d: "Duel de dés viking façon Orlog : six dés, trois lancers, et chaque face lance ton armée de 45 soldats à l'assaut (charge des haches, volée de flèches, éclaireurs voleurs). Invoque les faveurs de 20 dieux nordiques, remonte la route du fjord de taverne en taverne, joue à deux sur le même téléphone et tente le défi du jour.", tags: ["DES", "CAMPAGNE", "A DEUX", "DEFI DU JOUR"]},
  meta: {added: "2026-10-21", genres: ["TACTIQUE", "HASARD", "DU JOUR"]},
  enCours: () => { const d = rk("jarls.dailyRun", null), r = rk("jarls.run", null); return d && d.E && d.E.graine === dayNum() ? "DEFI DU JOUR" : r && r.E ? `MANCHE ${r.E.manche}` : null; },
  duJour: () => { const t = rk("jarls.dailyTry", null); return !!(t && t.j === dayNum()); },
  records: () => { const e = (rk("jarls.campagne", {}) || {}).etoiles || {}, v = Object.values(e).map(Number).filter(x => x > 0);
    return [["Étoiles de la campagne", num(v.reduce((a, b) => a + b, 0), "/ 60")], ["Dieux battus", num(v.length, "/ 20")], ["Défis du jour", num(count(rk("jarls.daily", {})))]]; },
  classements: [{label: "ETOILES", game: "jarls", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "LA ROUTE DU FJORD",
     note: "Les étoiles de la campagne des tavernes : par dieu battu, 1 étoile, 2 en gardant 8 PV, 3 en gardant 12 PV (60 au maximum)."},
    {label: "DEFI DU JOUR", ctl: ["day"], game: "jarls", board: daily, fmt: v => N(v) + " pts", title: () => "DEFI DU JOUR",
     note: "Le même dieu, les mêmes faveurs et les mêmes dés pour toute la famille, en normal. Victoire : 1000 + 50 par PV gardé − 10 par manche ; défaite : 20 par PV pris au dieu. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a défié le dieu ce jour-là." : "Personne n'a encore relevé le défi du jour : à toi !"}],
  transfert: {cles: ["jarls"],
    collecter(g){
      const ja = {e: (readKey("jarls.campagne", {}) || {}).etoiles || {}, d: readKey("jarls.daily", {}) || {}};
      if (Object.keys(ja.e).length || Object.keys(ja.d).length) g.jarls = ja;
    },
    decrire(g, out){
      if (g.jarls){ const v = Object.values(g.jarls.e || {}).map(Number).filter(x => x > 0), d = Object.keys(g.jarls.d || {}).length;
        out.push(`Le Thé des Jarls : ${v.length} dieu${v.length > 1 ? "x" : ""} battu${v.length > 1 ? "s" : ""}, ${v.reduce((a, b) => a + b, 0)} étoiles${d ? `, ${d} défi${d > 1 ? "s" : ""} du jour` : ""}`); }
    },
    fusionner(g, done){
      if (g.jarls && typeof g.jarls === "object"){
        // fusion : pour chaque dieu, le plus d'étoiles ; pour chaque défi du jour, le plus haut score
        const a = g.jarls, camp = readKey("jarls.campagne", {}) || {}, et = Object.assign({}, camp.etoiles || {}), daily = readKey("jarls.daily", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(a.e || {})) if (/^[a-z]{2,10}$/.test(k) && v >= 1 && v <= 3 && !(et[k] >= v)){ et[k] = Math.round(v); n++; }
        for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v >= 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
        if (n){ writeKey("jarls.campagne", Object.assign({}, camp, {etoiles: et})); writeKey("jarls.daily", daily); done.push(`Le Thé des Jarls : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

/* Odyssée : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "odyssee/index.html",
  carte: {n: "ODYSSEE", s: "ODYSSEE", ic: "galere", fam: "3d", lb: "linear-gradient(#9fdcff, #1fb0c9)", lt: "#13506e", sh: "#2bb3cf", rank: "odyssee",
    d: "Penche le téléphone pour ramener la galère d'Ulysse de Troie à Ithaque : Polyphème, Éole, Circé, les Sirènes, Charybde et Scylla… 30 plateaux en 3D et un plateau du jour pour toute la famille.", tags: ["3D", "PLATEAU DU JOUR"]},
  meta: {added: "2026-10-17", genres: ["ADRESSE", "DU JOUR"]},
  duJour: () => rk("odyssee.dailyTry", 0) === dayNum(),
  records: () => { const s = rk("odyssee.stars", {}) || {}, n = sum(s); return [["Étoiles", n ? n + " / 90" : null], ["Plateaux réussis", num(Object.values(s).filter(v => v > 0).length)], ["Plateaux du jour", num(count(rk("odyssee.daily", {})))]]; },
  classements: [{label: "ETOILES", game: "odyssee", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "Par plateau : 1 étoile en arrivant au port, 2 sans naufrage, 3 sans naufrage et sous le temps cible (90 au maximum)."},
    {label: "PLATEAU DU JOUR", ctl: ["day"], game: "odyssee", board: daily, fmt: T, title: () => "PLATEAU DU JOUR",
     note: "Le même plateau et les mêmes dangers pour toute la famille ; le temps, plus 5 secondes par naufrage. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a navigué ce jour-là." : "Personne n'a encore tenté le plateau du jour : à toi !"}],
  transfert: {cles: ["odyssee"],
    collecter(g){
      const od = {s: readKey("odyssee.stars", {}) || {}, b: readKey("odyssee.best", {}) || {}, d: readKey("odyssee.daily", {}) || {}};
      if (Object.keys(od.s).length || Object.keys(od.d).length) g.odyssee = od;
    },
    decrire(g, out){
      if (g.odyssee){ const n = Object.values(g.odyssee.s || {}).reduce((s, v) => s + (Number(v) || 0), 0); out.push(`Odyssée : ${n} étoile${n > 1 ? "s" : ""}`); }
    },
    fusionner(g, done){
      if (g.odyssee && typeof g.odyssee === "object"){
        const a = g.odyssee, stars = readKey("odyssee.stars", {}) || {}, best = readKey("odyssee.best", {}) || {}, daily = readKey("odyssee.daily", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(a.s || {})) if (/^\d{1,2}-[1-3]$/.test(k) && v >= 1 && v <= 3 && !(stars[k] >= v)){ stars[k] = Math.round(v); n++; }
        for (const [k, v] of Object.entries(a.b || {})) if (/^\d{1,2}-[1-3]$/.test(k) && v > 0 && !(best[k] <= v)) best[k] = Math.round(v);
        for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
        writeKey("odyssee.best", best);
        if (n){ writeKey("odyssee.stars", stars); writeKey("odyssee.daily", daily); done.push(`Odyssée : ${n} plateau${n > 1 ? "x" : ""} amélioré${n > 1 ? "s" : ""}`); }
      }
    }}
});

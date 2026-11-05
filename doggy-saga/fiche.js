/* Doggy Saga : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "doggy-saga/index.html",
  carte: {n: "DOGGY SAGA", s: "DOGGY", ic: "doggy", fam: "32", lb: "linear-gradient(#ffb48a, #e8784f)", lt: "#fff6ea", sh: "#e8784f", rank: "doggysaga",
    d: "Trois en ligne au refuge : glisse les chiens pour en aligner 3 pareils et leur faire des câlins. Bandanas, nœuds et balles de tennis font de grosses cascades. Lave la boue, ouvre les niches, guide les chiots jusqu'à leur panier et trouve une famille aux 16 chiens dans 60 niveaux. Pour toute la famille, avec la journée du jour.", tags: ["60 NIVEAUX", "ALBUM", "DEFI DU JOUR"], more: [["JOURNEE DU JOUR", "doggy-saga/index.html#jour"]]},
  meta: {added: "2026-10-23", genres: ["LOGIQUE", "DU JOUR"]},
  duJour: () => rk("doggysaga.dailyTry", 0) === dayNum() || (rk("doggysaga.daily", {}) || {})[dayNum()] !== undefined,
  records: () => { const p = rk("doggysaga.progres", {}) || {}, e = p.etoiles || {}, d = rk("doggysaga.daily", {}) || {};
    return [["Étoiles", num(Object.values(e).reduce((a, v) => a + (Number(v) || 0), 0), "/ 180")], ["Niveaux réussis", num(count(e), "/ 60")], ["Chiens adoptés", num((p.album || []).length, "/ 16")],
      ["Meilleure journée", num(Math.max(0, ...Object.values(d).map(Number).filter(v => v >= 0)), "câlins")]]; },
  classements: [{label: "ETOILES", game: "doggysaga", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "LE REFUGE",
     note: "Les étoiles des 60 niveaux du refuge : 1 étoile par niveau réussi, 2 ou 3 avec beaucoup de points (180 au maximum)."},
    {label: "JOURNEE DU JOUR", ctl: ["day"], game: "doggysaga", board: daily, fmt: v => N(v) + " câlins", title: () => "JOURNEE DU JOUR",
     note: "La même grille et les mêmes chiens pour toute la famille : le plus de câlins en 20 coups. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a joué la journée de ce jour-là." : "Personne n'a encore joué la journée du jour : à toi !"}],
  transfert: {cles: ["doggysaga"],
    collecter(g){
      const dg = {e: (readKey("doggysaga.progres", {}) || {}).etoiles || {}, a: (readKey("doggysaga.progres", {}) || {}).album || [], d: readKey("doggysaga.daily", {}) || {}};
      if (Object.keys(dg.e).length || Object.keys(dg.d).length) g.doggysaga = dg;
    },
    decrire(g, out){
      if (g.doggysaga){ const v = Object.values(g.doggysaga.e || {}).map(Number).filter(x => x > 0), d = Object.keys(g.doggysaga.d || {}).length, a = (g.doggysaga.a || []).length;
        out.push(`Doggy Saga : ${v.length} niveau${v.length > 1 ? "x" : ""}, ${v.reduce((x, y) => x + y, 0)} étoiles, ${a} chien${a > 1 ? "s" : ""} adopté${a > 1 ? "s" : ""}${d ? `, ${d} journée${d > 1 ? "s" : ""} du jour` : ""}`); }
    },
    fusionner(g, done){
      if (g.doggysaga && typeof g.doggysaga === "object"){
        // fusion : pour chaque niveau, le plus d'étoiles ; l'album réunit les deux ; pour chaque journée, le plus de câlins
        const a = g.doggysaga, pr = readKey("doggysaga.progres", {}) || {}, et = Object.assign({}, pr.etoiles || {}), alb = (pr.album || []).slice(), daily = readKey("doggysaga.daily", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(a.e || {})) if (/^\d{1,2}$/.test(k) && v >= 1 && v <= 3 && !(et[k] >= v)){ et[k] = Math.round(v); n++; }
        for (const t of a.a || []) if (Number.isInteger(t) && t >= 0 && t < 16 && !alb.includes(t)){ alb.push(t); n++; }
        for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v >= 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
        if (n){ writeKey("doggysaga.progres", Object.assign({etoiles: {}, scores: {}, album: []}, pr, {etoiles: et, album: alb})); writeKey("doggysaga.daily", daily); done.push(`Doggy Saga : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

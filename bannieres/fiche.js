/* Bannières : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "bannieres/index.html",
  carte: {n: "BANNIERES", s: "BANNIERES", ic: "banniere", fam: "3d", lb: "linear-gradient(#9fd4f2, #5a9a3a)", lt: "#fff6e0", sh: "#d0482c", rank: "bannieres",
    d: "Un jeu de conquête en 3D pour les enfants : choisis ta couleur, fais courir tes chevaliers, archers et mages sur les cases, construis et décore ton village autour du château, et regarde les batailles. Des pièces, des cœurs, des étoiles et des mots simples. Après 25 tours, on compte les drapeaux !", tags: ["3D", "POUR LES ENFANTS", "25 TOURS"]},
  meta: {added: "2026-10-22", genres: ["TACTIQUE"]},
  enCours: () => { const r = rk("bannieres.run", null); return r && r.tour && !r.fin ? `TOUR ${Math.min(r.tour, 25)}/25` : null; },
  records: () => { const s = rk("bannieres.stats", {}) || {}; return [["Le plus de drapeaux", num(rk("bannieres.best", 0), "drapeaux")], ["Parties gagnées", num(s.gagnees)], ["Parties", num(s.parties)]]; },
  classements: [{label: "DRAPEAUX", game: "bannieres", board: () => "best", fmt: v => N(v) + (v > 1 ? " drapeaux" : " drapeau"), title: () => "LE PLUS DE DRAPEAUX",
     note: "Les drapeaux (les cases à toi) à la fin d'une partie sur la petite carte (37 cases), en facile ou en normal."}],
  transfert: {cles: ["bannieres"],
    collecter(g){
      const bn = {b: Number(readKey("bannieres.best", 0)) || 0, s: readKey("bannieres.stats", {}) || {}};
      if (bn.b || bn.s.parties) g.bannieres = bn;
    },
    decrire(g, out){
      if (g.bannieres){ const s = g.bannieres.s || {}; out.push(`Bannières : ${g.bannieres.b || 0} drapeaux au mieux${s.gagnees ? `, ${s.gagnees} partie${s.gagnees > 1 ? "s" : ""} gagnée${s.gagnees > 1 ? "s" : ""}` : ""}`); }
    },
    fusionner(g, done){
      if (g.bannieres && typeof g.bannieres === "object"){
        // fusion : le plus de drapeaux, et le plus grand nombre de parties (jouées, gagnées)
        const a = g.bannieres, s = readKey("bannieres.stats", {}) || {}; let n = 0;
        if (Number(a.b) > (Number(readKey("bannieres.best", 0)) || 0)){ writeKey("bannieres.best", Math.round(a.b)); n++; }
        for (const k of ["parties", "gagnees"]) if (Number((a.s || {})[k]) > (Number(s[k]) || 0)){ s[k] = Math.round(a.s[k]); n++; }
        if (n){ writeKey("bannieres.stats", s); done.push(`Bannières : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

/* Lune-Rover : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "lune-rover/index.html",
  carte: {n: "LUNE-ROVER", s: "LUNE-ROVER", ic: "rover", fam: "32", lb: "linear-gradient(#14142a, #3a3834)", lt: "#5ae6f2", sh: "#5a5a6a", rank: "lunerover",
    d: "Programme Pico, le petit robot lunaire, à l'avance (avancer, tourner, sauter, ramasser, boucles et conditions) pour récolter les cristaux. 3 étoiles pour le programme le plus court.", tags: ["30 NIVEAUX"]},
  meta: {added: "2026-10-16", genres: ["LOGIQUE", "ESPACE"]},
  records: () => { const s = rk("lunerover.stars", {}) || {}, n = sum(s); return [["Étoiles", n ? n + " / 90" : null], ["Niveaux réussis", num(Object.values(s).filter(v => v > 0).length)]]; },
  classements: [{label: "ETOILES", game: "lunerover", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "Par niveau : 3 étoiles pour le programme le plus court, 2 avec jusqu'à 2 instructions de plus, 1 sinon (90 au maximum)."}],
  transfert: {cles: ["lunerover"],
    collecter(g){
      const lr = readKey("lunerover.stars", {}); if (lr && Object.keys(lr).length) g.lunerover = lr;
    },
    decrire(g, out){
      if (g.lunerover){ const n = Object.values(g.lunerover).reduce((s, v) => s + (Number(v) || 0), 0); if (n) out.push(`Lune-Rover : ${n} étoile${n > 1 ? "s" : ""}`); }
    },
    fusionner(g, done){
      if (g.lunerover && typeof g.lunerover === "object"){
        const mine = readKey("lunerover.stars", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(g.lunerover)) if (/^\d{1,2}$/.test(k) && v >= 1 && v <= 3 && !(mine[k] >= v)){ mine[k] = Math.round(v); n++; }
        if (n){ writeKey("lunerover.stars", mine); done.push(`Lune-Rover : ${n} niveau${n > 1 ? "x" : ""} amélioré${n > 1 ? "s" : ""}`); }
      }
    }}
});

/* Orbite : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "orbite/index.html",
  carte: {n: "ORBITE", s: "ORBITE", ic: "planet", fam: "32", lb: "radial-gradient(circle at 30% 30%, #3a2a8a, #070a1c 75%)", lt: "#6fd8ff", sh: "#5a3ab8", rank: "orbite",
    d: "Lance ta sonde et laisse la gravité des planètes la guider jusqu'à la balise, entre trous noirs et portails.", tags: ["30 NIVEAUX"]},
  meta: {added: "2026-10-12", genres: ["ADRESSE", "ESPACE"]},
  records: () => { const s = rk("orbite.stars", {}) || {}, n = sum(s); return [["Étoiles", n ? n + " / 90" : null], ["Niveaux réussis", num(Object.values(s).filter(v => v > 0).length)]]; },
  classements: [{label: "ETOILES", game: "orbite", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "3 étoiles par niveau réussi du premier coup, 2 au deuxième essai, 1 au troisième (90 au maximum)."}],
  transfert: {cles: ["orbite"],
    collecter(g){
      const ob = readKey("orbite.stars", {}); if (ob && Object.keys(ob).length) g.orbite = ob;
    },
    decrire(g, out){
      if (g.orbite){ const n = Object.values(g.orbite).reduce((s, v) => s + (Number(v) || 0), 0); if (n) out.push(`Orbite : ${n} étoile${n > 1 ? "s" : ""}`); }
    },
    fusionner(g, done){
      if (g.orbite && typeof g.orbite === "object"){
        const mine = readKey("orbite.stars", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(g.orbite)) if (/^\d{1,2}$/.test(k) && v >= 1 && v <= 3 && !(mine[k] >= v)){ mine[k] = Math.round(v); n++; }
        if (n){ writeKey("orbite.stars", mine); done.push(`Orbite : ${n} niveau${n > 1 ? "x" : ""} amélioré${n > 1 ? "s" : ""}`); }
      }
    }}
});

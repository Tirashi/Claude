/* Écurie miniature : fiche de l'accueil (voir accueil-outils.js). Session 1 (20/11) : la boucle semaine → course 3D → résultats, saisons et divisions ; démo, sans classement. */
Ludo.fiche({
  k: "ecurie/index.html",
  carte: {n: "ECURIE MINIATURE", s: "ECURIE", ic: "ecurie", fam: "3d", lb: "linear-gradient(#ff6a13, #0b0f1a)", lt: "#ffffff", sh: "#ff6a13", demo: true, disquette: true, img: "ecurie/etiquette.jpg", jaq: "ecurie/jaquette.jpg",
    d: "Dirige une petite écurie de course : pilotes, voitures, pièces, sponsors et fans. Prépare la semaine, puis regarde la course en 3D sur un circuit de ville, derrière tes pilotes, en diorama ou à la télé. Monte de la Coupe 300 ch au Grand Prix illimité.", tags: ["3D", "COURSE", "5 CIRCUITS"]},
  meta: {added: "2026-11-20", genres: ["GESTION"]},
  enCours: () => { const p = rk("ecurie.partie", null); return p && p.saison ? "SAISON " + p.saison + " · GP " + (p.gp + 1) : null; },
  records: () => { const r = rk("ecurie.record", {}) || {};
    return [["Grands prix", num(r.gp, "")], ["Victoires", num(r.victoires, "")], ["Titres", num(r.titres, "")]]; },
  nom: "Écurie miniature",
  transfert: {cles: ["ecurie"],
    collecter(g){ const r = readKey("ecurie.record", null), p = readKey("ecurie.partie", null); if (r || p) g.ecurie = {r, p}; },
    decrire(g, out){ if (g.ecurie && g.ecurie.r){ const r = g.ecurie.r; out.push(`Écurie miniature : ${Math.round(Number(r.gp) || 0)} GP, ${Math.round(Number(r.victoires) || 0)} victoires`); } },
    fusionner(g, done){
      if (!g.ecurie) return;
      const a = g.ecurie.r;
      if (a && typeof a === "object"){ // le plus grand de chaque compte
        const m = readKey("ecurie.record", {}) || {}, n = {}; let change = false;
        for (const k of ["gp", "victoires", "podiums", "titres", "division", "fans", "saison"]){ n[k] = Math.max(Math.round(Number(a[k]) || 0), Math.round(Number(m[k]) || 0)); if (n[k] !== (m[k] || 0)) change = true; }
        if (change){ writeKey("ecurie.record", n); done.push("Écurie miniature : records"); }
      }
      // la partie en cours : seulement s'il n'y en a pas ici
      const p = g.ecurie.p; if (p && p.v === 1 && Array.isArray(p.parc) && !readKey("ecurie.partie", null)){ writeKey("ecurie.partie", p); done.push("Écurie miniature : partie en cours"); }
    }}
});

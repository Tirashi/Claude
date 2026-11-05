/* Le Magasinier : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "magasinier/index.html",
  carte: {n: "LE MAGASINIER", s: "MAGASINIER", ic: "caisse", fam: "3d", lb: "linear-gradient(#f6d39a, #a8683a)", lt: "#3a2414", sh: "#e8963a", rank: "magasinier",
    d: "Pousse les caisses sur les marques, dans un entrepôt baigné de soleil en HD-2D. 60 niveaux en 5 entrepôts, avec de la glace, des tapis roulants et des caisses en fonte, et une grille du jour pour toute la famille.", tags: ["3D", "PUZZLE", "GRILLE DU JOUR"]},
  meta: {added: "2026-10-20", genres: ["LOGIQUE", "DU JOUR"]},
  enCours: () => { const d = rk("magasinier.dailyRun", null), p = rk("magasinier.partie", null);
    return d && d.j === dayNum() ? "GRILLE DU JOUR" : p && p.chemin ? "NIVEAU " + (p.n + 1) : null; },
  duJour: () => !!(rk("magasinier.daily", {}) || {})[dayNum()],
  records: () => { const f = rk("magasinier.niveaux", {}) || {}, n = Object.values(f).reduce((a, v) => a + (Number(v && v.etoiles) || 0), 0);
    return [["Étoiles", n ? n + " / 180" : null], ["Niveaux réussis", num(count(f))], ["Grilles du jour", num(count(rk("magasinier.daily", {})))]]; },
  classements: [{label: "ETOILES", game: "magasinier", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "Par niveau : 3 étoiles au plus 10 % au-dessus du minimum de coups, 2 au plus 50 % au-dessus, sinon 1 (180 au maximum)."},
    {label: "GRILLE DU JOUR", ctl: ["day"], game: "magasinier", board: daily, fmt: v => N(v) + (v > 1 ? " coups" : " coup"), title: () => "GRILLE DU JOUR",
     note: "La même grille pour toute la famille ; le moins de coups gagne, en comptant ceux qu'on annule et ceux d'avant un recommencement. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a rangé l'entrepôt ce jour-là." : "Personne n'a encore tenté la grille du jour : à toi !"}],
  transfert: {cles: ["magasinier"],
    collecter(g){
      const mg = {n: readKey("magasinier.niveaux", {}) || {}, d: readKey("magasinier.daily", {}) || {}};
      if (Object.keys(mg.n).length || Object.keys(mg.d).length) g.magasinier = mg;
    },
    decrire(g, out){
      if (g.magasinier){ const n = Object.values(g.magasinier.n || {}).reduce((s, v) => s + (Number(v && v.etoiles) || 0), 0), d = Object.keys(g.magasinier.d || {}).length;
        out.push(`Le Magasinier : ${n} étoile${n > 1 ? "s" : ""}${d ? `, ${d} grille${d > 1 ? "s" : ""} du jour` : ""}`); }
    },
    fusionner(g, done){
      if (g.magasinier && typeof g.magasinier === "object"){
        // fusion : pour chaque niveau, le moins de coups et le plus d'étoiles ; pour chaque grille du jour, le moins de coups
        const a = g.magasinier, niv = readKey("magasinier.niveaux", {}) || {}, daily = readKey("magasinier.daily", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(a.n || {})) { if (!/^\d{1,2}$/.test(k) || !v || !(v.coups > 0)) continue;
          const m = niv[k], et = Math.min(3, Math.max(1, Math.round(v.etoiles) || 1));
          if (!m || v.coups < m.coups || et > m.etoiles){ niv[k] = {coups: Math.round(m ? Math.min(m.coups, v.coups) : v.coups), etoiles: Math.max(et, m ? m.etoiles : 0)}; n++; } }
        for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
        if (n){ writeKey("magasinier.niveaux", niv); writeKey("magasinier.daily", daily); done.push(`Le Magasinier : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

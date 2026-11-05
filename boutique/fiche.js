/* La Boutique de cartes : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "boutique/index.html",
  carte: {n: "LA BOUTIQUE DE CARTES", s: "BOUTIQUE", ic: "boutique", fam: "3d", lb: "linear-gradient(#8a63d2, #2b2838)", lt: "#ffd84d", sh: "#8a63d2", rank: "boutique",
    d: "Tiens une boutique de cartes à collectionner pendant un an, en 3D. Commande au grossiste, ouvre des boosters (vendre fermé ou ouvrir ? c'est tout le pari), remplis tes vitrines et ton classeur, aménage et agrandis la boutique, organise le tournoi du samedi, et regarde les clients acheter. Cinq extensions sortent dans l'année, les cotes bougent chaque dimanche.", tags: ["3D", "GESTION", "52 SEMAINES"]},
  meta: {added: "2026-10-23", genres: ["SIMULATION"]},
  enCours: () => { const r = rk("boutique.run", null); return r && r.semaine && !r.fin ? `SEMAINE ${r.semaine}/52` : null; },
  records: () => { const s = rk("boutique.stats", {}) || {}; return [["Meilleure boutique", num(rk("boutique.best", 0), "pts")], ["Années finies", num(s.finies)], ["Parties", num(s.parties)]]; },
  classements: [{label: "MEILLEURE BOUTIQUE", game: "boutique", board: () => "best", fmt: v => N(v) + " pts", title: () => "LA MEILLEURE BOUTIQUE",
     note: "Le score à la fin des 52 semaines : la valeur de la boutique (caisse, stock, cartes à leur cote, meubles, agrandissements, classeurs complets, moins le prêt). En cas de faillite, la moitié."}],
  transfert: {cles: ["boutique"],
    collecter(g){
      const bo = {b: Number(readKey("boutique.best", 0)) || 0, s: readKey("boutique.stats", {}) || {}};
      if (bo.b || bo.s.parties) g.boutique = bo;
    },
    decrire(g, out){
      if (g.boutique){ const s = g.boutique.s || {}; out.push(`La Boutique de cartes : meilleure boutique ${g.boutique.b || 0} pts${s.finies ? `, ${s.finies} année${s.finies > 1 ? "s" : ""} finie${s.finies > 1 ? "s" : ""}` : ""}`); }
    },
    fusionner(g, done){
      if (g.boutique && typeof g.boutique === "object"){
        // fusion : la meilleure boutique, et le plus grand nombre de parties (jouées, finies, faillites)
        const a = g.boutique, s = readKey("boutique.stats", {}) || {}; let n = 0;
        if (Number(a.b) > (Number(readKey("boutique.best", 0)) || 0)){ writeKey("boutique.best", Math.round(a.b)); n++; }
        for (const k of ["parties", "finies", "faillites"]) if (Number((a.s || {})[k]) > (Number(s[k]) || 0)){ s[k] = Math.round(a.s[k]); n++; }
        if (n){ writeKey("boutique.stats", s); done.push(`La Boutique de cartes : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

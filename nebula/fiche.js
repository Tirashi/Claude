/* Nebula : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "nebula/index.html",
  // ic "img" : la capture nebula/cartouche.jpg (NEBULA_IMG d'accueil.js, remplacée par un data: dans l'artefact de l'accueil)
  carte: {n: "NEBULA", s: "NEBULA", ic: "img", fam: "32", lb: "radial-gradient(circle at 75% 20%, #3a2a4a, #04060c 70%)", lt: "#f2b24a", sh: "#c07a20", rank: "nebula",
    d: "Mène ta flotte de balise en balise jusqu'à l'amiral pirate. Les pirates annoncent leurs tirs : esquive, riposte, survis.", tags: ["ROGUE-LITE"]},
  meta: {added: "2026-10-13", updated: "2026-10-15", genres: ["TACTIQUE", "ESPACE"]},
  nom: "Nebula",
  enCours: () => { const r = rk("nebula.run", null); return r && r.phase !== "end" && !r.training ? `SECTEUR ${r.sector || 1}` : null; },
  duJour: () => rk("nebula.dailyTry", 0) === dayNum(),
  records: () => { const m = rk("nebula.meta", {}) || {}; return [["Meilleur score", num(rk("nebula.best", 0), "pts")], ["Victoires", num(m.wins)], ["Parties jouées", num(m.games)]]; },
  classements: [
    {label: "MEILLEUR SCORE", game: "nebula", board: () => "best", fmt: v => N(v) + " pts", title: () => "MEILLEURE PARTIE",
     note: "1000 par secteur terminé, 20 par pirate détruit, les crédits restants, et 3000 pour la victoire finale."},
    {label: "MISSION DU JOUR", ctl: ["day"], game: "nebula", board: daily, fmt: v => N(v) + " pts",
     title: () => "MISSION DU JOUR", note: "La même carte et les mêmes combats pour toute la famille, avec la flotte et la règle du jour. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a joué la mission ce jour-là." : "Personne n'a encore joué la mission du jour : à toi !"},
    {label: "VICTOIRES", game: "nebula", board: () => "victoires", fmt: v => N(v) + " victoire" + (v > 1 ? "s" : ""), title: () => "VICTOIRES",
     note: "Le nombre de parties gagnées (la Rouille-Reine vaincue).", empty: "Personne n'a encore vaincu la Rouille-Reine."}],
  // g.nebula = {b: meilleur score, m: nebula.meta (compteurs, déblocages), d: nebula.daily}
  transfert: {cle: "nebula",
    collecter: () => { const nb = {b: Number(readKey("nebula.best", 0)) || 0, m: readKey("nebula.meta", null), d: readKey("nebula.daily", {}) || {}};
      return nb.b || (nb.m && nb.m.games) ? nb : null; },
    decrire: a => { const m = a.m || {}; return `Nebula : record ${a.b || 0} points, ${m.games || 0} partie${m.games > 1 ? "s" : ""}, ${m.data || 0} données stellaires`; },
    fusionner: a => {
      if (!a || typeof a !== "object") return null;
      let n = 0;
      if (a.b > (Number(readKey("nebula.best", 0)) || 0)){ writeKey("nebula.best", Math.round(a.b)); n++; }
      // statistiques : on garde le maximum de chaque compteur (les données stellaires ne s'additionnent pas, sinon un aller-retour les doublerait)
      if (a.m && typeof a.m === "object"){
        const mine = readKey("nebula.meta", {}) || {}; let ch = false;
        for (const [k, v] of Object.entries(a.m)) if (typeof v === "number" && v > (Number(mine[k]) || 0)){ mine[k] = v; ch = true; }
        // déblocages : on réunit les deux listes (le solde est recalculé par le jeu : données gagnées - coût des déblocages)
        if (Array.isArray(a.m.unlocked)){ const u = new Set(Array.isArray(mine.unlocked) ? mine.unlocked : []); for (const x of a.m.unlocked) if (typeof x === "string" && /^[a-z]{1,16}$/.test(x) && !u.has(x)){ u.add(x); ch = true; } mine.unlocked = [...u]; }
        if (ch){ writeKey("nebula.meta", mine); n++; }
      }
      const daily = readKey("nebula.daily", {}) || {};
      for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
      if (!n) return null;
      writeKey("nebula.daily", daily); return `Nebula : ${n} record${n > 1 ? "s" : ""}`;
    }}
});

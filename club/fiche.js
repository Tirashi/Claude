/* Le Club d'agility : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "club/index.html",
  carte: {n: "LE CLUB D'AGILITY", s: "CLUB AGILITY", ic: "cup", fam: "32", lb: "linear-gradient(#3f8a37, #173a1a)", lt: "#ffd23f", sh: "#3f8a37", rank: "club",
    d: "Recrute des chiens, entraîne-les semaine après semaine et mène ton club jusqu'au Championnat de France.", tags: ["6 RACES"]},
  meta: {added: "2026-10-12", genres: ["GESTION", "CHIENS"]},
  nom: "le Club",
  enCours: () => { const g = rk("club.save", null); return g && g.week > 1 ? `SEMAINE ${g.week}` : null; },
  records: () => { const g = rk("club.save", null) || {};
    return [["Réputation", num(Math.max(g.rep || 0, g.bestRep || 0))], ["Champion de France en", num(g.champion, "semaines")], ["Partie en cours", g.week > 1 ? "semaine " + g.week : null]]; },
  classements: [{label: "REPUTATION", game: "club", board: () => "rep", fmt: v => N(v) + " pts", title: () => "LA PLUS GRANDE REPUTATION"},
    {label: "CHAMPION", game: "club", board: () => "champion", fmt: v => N(v) + " sem.", title: () => "CHAMPION DE FRANCE LE PLUS RAPIDE",
     note: "Le nombre de semaines pour gagner le Championnat de France.", empty: "Personne n'est encore champion de France."}],
  transfert: {cles: ["club"],
    collecter(g){
      const cl = readKey("club.save", null); if (cl && cl.week > 1) g.club = cl;
    },
    decrire(g, out){
      if (g.club && g.club.week) out.push(`Club d'agility : semaine ${g.club.week}, ${(g.club.dogs || []).length} chien${(g.club.dogs || []).length > 1 ? "s" : ""}, réputation ${g.club.rep || 0}`);
    },
    fusionner(g, done){
      // le club : on garde la partie la plus avancée (la plus grande réputation)
      if (g.club && typeof g.club === "object" && g.club.v === 1 && Array.isArray(g.club.dogs)){
        const mine = readKey("club.save", null);
        if (!mine || (g.club.rep || 0) > (mine.rep || 0) || ((g.club.rep || 0) === (mine.rep || 0) && g.club.week > mine.week)){
          writeKey("club.save", g.club); done.push(`Club d'agility : partie de la semaine ${g.club.week}`); }
      }
    }}
});

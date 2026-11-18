/* Politique : fiche de l'accueil (voir accueil-outils.js). Session 1 de l'écran (17/11) : jouable de bout en bout, démo, sans classement. */
Ludo.fiche({
  k: "politique/index.html",
  carte: {n: "POLITIQUE", s: "POLITIQUE", ic: "crown", fam: "32", lb: "linear-gradient(#c9b48a, #6b5232)", lt: "#2b2118", sh: "#9b2a1f", demo: true, disquette: true,
    d: "Gouverne un petit pays pendant 40 tours, sur une carte à l'encre : bâtis dans tes régions, fais voter des lois, signe des contrats avec les voisins (une charrette part sur la route) et garde les cinq factions calmes. Une ambition à choisir, des médailles à gagner.", tags: ["STRATEGIE", "GESTION", "TOUR PAR TOUR"]},
  meta: {added: "2026-11-17", updated: "2026-11-17", genres: ["STRATEGIE"]},
  enCours: () => { const p = rk("politique-partie", null); return p && p.base ? "TOUR " + p.base.tour + " / " + p.base.tourMax : null; },
  records: () => { const p = rk("politique-partie", null) || {}, b = p.base || {}; return [["Tour", b.tour ? b.tour + " / " + b.tourMax : "—"], ["Trésor", b.tresor != null ? Math.round(b.tresor) + " or" : "—"]]; }
});

/* Bastion : fiche de l'accueil (voir accueil-outils.js). Session 1 = le laboratoire des règles : démo, sans classement. */
Ludo.fiche({
  k: "bastion/index.html",
  carte: {n: "BASTION", s: "BASTION", ic: "bastion", fam: "32", lb: "linear-gradient(#4a6a2a, #1c2a10)", lt: "#f2e3bf", sh: "#3a5a1a", demo: true, disquette: true,
    d: "Défends le château contre des vagues de gobelins, de gnolls et un troll. Tes ouvriers coupent le bois, minent l'or et ramènent la viande ; tu bâtis maisons, caserne, archerie, monastère et tours, tu recrutes des escouades qui gagnent des grades. Version laboratoire : vitesse, robot, simulateur et tous les réglages pour trouver le bon équilibre.", tags: ["STRATEGIE", "TEMPS REEL", "LABO"]},
  meta: {added: "2026-11-07", genres: ["TACTIQUE"]},
  records: () => { const p = rk("bastion.parties", null) || {}; return [["Parties jouées", num(p.jouees)], ["Victoires", num(p.victoires)], ["Meilleure vague", num(p.vague)]]; }
});

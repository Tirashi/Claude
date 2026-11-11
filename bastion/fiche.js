/* Bastion : fiche de l'accueil (voir accueil-outils.js). Démo : 6 niveaux et un tuto, le LABO en bac à sable ; sans classement. */
Ludo.fiche({
  k: "bastion/index.html",
  carte: {n: "BASTION", s: "BASTION", ic: "bastion", fam: "32", lb: "linear-gradient(#4a6a2a, #1c2a10)", lt: "#f2e3bf", sh: "#3a5a1a", demo: true, disquette: true,
    d: "Défends le château contre des vagues de gobelins, de gnolls et un troll. Tes ouvriers coupent le bois, minent l'or et ramènent la viande ; tu bâtis maisons, caserne, archerie, monastère et tours, tu recrutes des escouades qui gagnent des grades. Six niveaux, de la clairière à la forteresse, un tuto pour commencer, et le LABO en bac à sable.", tags: ["STRATEGIE", "TEMPS REEL", "6 NIVEAUX"]},
  meta: {added: "2026-11-07", updated: "2026-11-11", genres: ["TACTIQUE"]},
  records: () => { const p = rk("bastion.parties", null) || {}, e = (rk("bastion.progres", null) || {}).etoiles || {}; return [["Étoiles", num(sum(e)) && sum(e) + " / 18"], ["Niveaux réussis", num(count(e))], ["Parties jouées", num(p.jouees)]]; }
});

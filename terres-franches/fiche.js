/* Terres franches : fiche de l'accueil (voir accueil-outils.js). Session 1 = l'ère 1 (campement → village, Charte du Village) : démo, sans classement. */
Ludo.fiche({
  k: "terres-franches/index.html",
  carte: {n: "TERRES FRANCHES", s: "TERRES", ic: "terres", fam: "32", lb: "linear-gradient(#5a8a3a, #22401a)", lt: "#f6ecc8", sh: "#3a6a22", demo: true,
    d: "Un pionnier, une tente et un feu au bord d'une rivière. Récolte, accueille des villageois, donne-leur un métier et bâtis : le jeu propose le terrain le plus logique et trace les rues. Le campement devient hameau puis village, et la colonie continue de travailler (doucement) quand tu n'es pas là. Première ère : jusqu'à la Charte du Village.", tags: ["GESTION", "INCREMENTAL", "COLONIE"]},
  meta: {added: "2026-11-08", genres: ["GESTION"]},
  enCours: () => { const p = rk("terres.partie", null); return p && p.pop ? ["CAMPEMENT", "HAMEAU", "VILLAGE"][p.statut || 0] + " · " + p.pop + " HAB." : null; },
  records: () => { const p = rk("terres.partie", null) || {}; return [["Habitants", num(p.pop)], ["Statut", ["Campement", "Hameau", "Village"][p.statut || 0]], ["Charte du Village", p.loi ? "promulguée" : "—"]]; }
});

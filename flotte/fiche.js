/* Flotte du bureau : fiche de l'accueil (voir accueil-outils.js). Session 1 (26/11) : la carte, les mineurs et les marchands, les achats et la veille ; démo, sans classement. */
Ludo.fiche({
  k: "flotte/index.html",
  carte: {n: "FLOTTE DU BUREAU", s: "FLOTTE", ic: "flotte", fam: "3d", lb: "linear-gradient(#0a2147, #050a18)", lt: "#ffffff", sh: "#f0a830", demo: true, disquette: true, img: "flotte/etiquette.jpg", jaq: "flotte/jaquette.jpg", imgTitre: true,
    d: "Une petite flotte de mineurs et de marchands travaille toute seule dans un système, autour d'un QG. Achète des vaisseaux et regarde-les voler : orbites lentes, routes pointillées, sprites en relief quand tu zoomes. Une part des gains continue quand l'appli est fermée.", tags: ["INCREMENTAL", "ESPACE", "PC + TEL."]},
  meta: {added: "2026-11-26", genres: ["GESTION"]},
  enCours: () => { const p = rk("flotte.partie", null); return p && p.navires && p.navires.length ? p.navires.length + " NAVIRES" : null; },
  records: () => { const p = rk("flotte.partie", null) || {}; return [["Navires", num(p.navires && p.navires.length, "")], ["Crédits gagnés", num(p.total, "")], ["Pirates détruits", num(p.stats && p.stats.detruits, "")], ["Zone", p.lv >= 0 && p.navires ? String((p.lv || 0) + 1) + " / 4" : null]]; },
  nom: "Flotte du bureau",
  transfert: {cles: ["flotte"],
    collecter(g){ const p = readKey("flotte.partie", null); if (p) g.flotte = {p}; },
    decrire(g, out){ if (g.flotte && g.flotte.p){ const p = g.flotte.p; out.push(`Flotte du bureau : ${(p.navires || []).length} navires, ${Math.round(Number(p.total) || 0)} cr gagnés`); } },
    fusionner(g, done){
      if (!g.flotte || !g.flotte.p) return;
      const a = g.flotte.p, m = readKey("flotte.partie", null);
      // on garde la partie qui a le plus rapporté
      if (a.v === 1 && Array.isArray(a.navires) && (!m || (Number(a.total) || 0) > (Number(m.total) || 0))){ writeKey("flotte.partie", a); done.push("Flotte du bureau : partie en cours"); }
    }}
});

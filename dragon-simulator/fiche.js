/* Dragon Simulator : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "dragon-simulator/index.html",
  carte: {n: "DRAGON SIMULATOR", s: "DRAGON", ic: "dragonsim", fam: "3d", lb: "linear-gradient(#5ea7e6, #c23a3a)", lt: "#ffd25a", sh: "#c23a3a", rank: "dragonsim",
    d: "Une idée d'un garçon de 7 ans : dirige un dragon qui plane au-dessus de la ville, vu de profil, en 3D. Bats des ailes, crache du feu sur les immeubles et les voitures, évite grues et hélicoptères, ramasse jetpacks, grenades, bébé dragon et nuages d'orage. Plus tu vas loin, plus tu gagnes de pièces pour améliorer ton dragon au nid.", tags: ["3D", "POUR LES ENFANTS", "SANS FIN"]},
  meta: {added: "2026-11-02", genres: ["ARCADE"]},
  records: () => { const s = rk("dragonsim.sauvegarde", {}) || {}, r = s.records || {}, t = s.total || {}, n = Object.values(s.niv || {}).reduce((a, v) => a + Math.max(0, (Number(v) || 1) - 1), 0);
    return [["Plus long vol", num(r.distance, "m")], ["Meilleure partie", num(r.pieces, "pièces")], ["Bâtiments brûlés", num(t.batiments)], ["Vols", num(t.parties)], ["Nid", num(n, "/ 16 améliorations")]]; },
  classements: [{label: "DISTANCE", game: "dragonsim", board: () => "distance", fmt: v => N(v) + " m", title: () => "PLUS LONG VOL",
     note: "La plus grande distance parcourue en un vol, en mètres."}],
  transfert: {cles: ["dragonsim"],
    collecter(g){
      const dsg = readKey("dragonsim.sauvegarde", null);
      if (dsg && typeof dsg === "object" && ((dsg.total && dsg.total.parties) || dsg.pieces)) g.dragonsim = dsg;
    },
    decrire(g, out){
      if (g.dragonsim){ const r = g.dragonsim.records || {}, t = g.dragonsim.total || {}; out.push(`Dragon Simulator : plus long vol ${Number(r.distance) || 0} m, ${Number(t.parties) || 0} vol${t.parties > 1 ? "s" : ""}, ${Number(g.dragonsim.pieces) || 0} pièces au nid`); }
    },
    fusionner(g, done){
      if (g.dragonsim && typeof g.dragonsim === "object"){
        // fusion : le plus haut niveau de chaque amélioration, le plus de pièces, tous les décors atteints, les meilleurs records et totaux
        const a = g.dragonsim, cur = readKey("dragonsim.sauvegarde", null) || {}, av = JSON.stringify(cur), M = (x, y) => Math.max(Number(x) || 0, Math.round(Number(y) || 0));
        const out = Object.assign({v: 1, depart: /^[a-z]{2,12}$/.test(a.depart) ? a.depart : "ville"}, cur); out.pieces = M(cur.pieces, a.pieces);
        out.niv = Object.assign({}, cur.niv); for (const k of ["ecailles", "flammes", "reserve", "ailes"]) out.niv[k] = Math.min(5, Math.max(1, M((cur.niv || {})[k], (a.niv || {})[k])));
        out.decors = [...new Set([].concat(cur.decors || ["ville"], a.decors || []).filter(d => /^[a-z]{2,12}$/.test(d)))];
        out.records = {}; for (const k of ["distance", "pieces"]) out.records[k] = M((cur.records || {})[k], (a.records || {})[k]);
        out.total = {}; for (const k of ["parties", "batiments", "pieces", "distance"]) out.total[k] = M((cur.total || {})[k], (a.total || {})[k]);
        if (JSON.stringify(out) !== av){ writeKey("dragonsim.sauvegarde", out); writeKey("dragonsim.record", out.records.distance); done.push("Dragon Simulator : nid et records"); }
      }
    }}
});

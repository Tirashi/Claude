/* Démineur : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "demineur/index.html",
  carte: {n: "DEMINEUR", img: "demineur/etiquette.jpg", jaq: "demineur/jaquette.jpg", s: "DEMINEUR", ic: "mine", fam: "32", lb: "linear-gradient(#7ccb5c, #3d8532)", lt: "#fff6c2", sh: "#4fa33c", rank: "demineur",
    d: "Le démineur dans une prairie en pixel art : trois tailles, la Grande prairie sans fin et un défi du jour qui grandit au fil de la semaine.",
    tags: ["3 TAILLES", "PRAIRIE SANS FIN"], more: [["DEFI DU JOUR", "demineur/index.html#jour"], ["GRANDE PRAIRIE", "demineur/index.html#prairie"]]},
  meta: {added: "2026-11-22", updated: "2026-11-27", genres: ["LOGIQUE", "DU JOUR"]},
  nom: "le Démineur",
  enCours: () => { const r = rk("demineur.jourRun", null); return r && r.day === dayNum() && !r.perdu && !(rk("demineur.jour", {}) || {})[dayNum()] ? "DEFI DU JOUR" : null; },
  duJour: () => { const r = rk("demineur.jourRun", null); return !!(rk("demineur.jour", {}) || {})[dayNum()] || !!(r && r.day === dayNum() && r.perdu); },
  records: () => { const b = rk("demineur.best", {}) || {}, p = rk("demineur.prairie", {}) || {};
    return [["facile", "Facile"], ["moyen", "Moyen"], ["difficile", "Difficile"]].filter(([k]) => b[k] > 0).map(([k, n]) => [n, mmss(b[k])])
      .concat(p.score > 0 ? [["Grande prairie", `${nf(p.score)} pts · ${p.dist} m`]] : [], [["Défis du jour réussis", num(count(rk("demineur.jour", {})))]]); },
  classements: [
    {label: "MEILLEUR TEMPS", ctl: ["dmsize"], game: "demineur", board: () => "best:" + st.dmsize, fmt: T,
     title: () => (DMSIZE.find(([k]) => k === st.dmsize) || ["", ""])[1], note: "Grille classique dégagée sans exploser."},
    {label: "GRANDE PRAIRIE", game: "demineur", board: "prairie", fmt: N, title: "GRANDE PRAIRIE",
     note: "Points : un par mètre, plus le panier (fleur 1, cerises 3, œuf d'or 10)."},
    {label: "DEFI DU JOUR", ctl: ["day"], game: "demineur", board: daily, fmt: T,
     title: () => { const t = [[16, 26], [8, 10], [9, 12], [10, 14], [11, 16], [12, 18], [14, 22]][day().getDay()]; return `DEFI DU JOUR · ${t[0]}×${t[1]}`; },
     note: "La même grille pour toute la famille, de 8×10 le lundi à 16×26 le dimanche. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a dégagé la grille ce jour-là." : "Personne n'a encore dégagé la grille du jour : à toi de jouer !"}],
  transfert: {cles: ["demineur", "demineurJour", "demineurPrairie"],
    collecter(g){
      const b = readKey("demineur.best", {}); if (b && Object.keys(b).length) g.demineur = b;
      const j = readKey("demineur.jour", {}); if (j && Object.keys(j).length) g.demineurJour = j;
      const p = readKey("demineur.prairie", null); if (p && p.score > 0) g.demineurPrairie = p;
    },
    decrire(g, out){
      if (g.demineur) out.push("Démineur : " + Object.keys(g.demineur).map(k => `${k} en ${fmtTime(g.demineur[k])}`).join(", "));
      if (g.demineurJour){ const n = Object.keys(g.demineurJour).length; out.push(`Démineur : ${n} défi${n > 1 ? "s" : ""} du jour`); }
      if (g.demineurPrairie) out.push(`Démineur : Grande prairie ${g.demineurPrairie.score} pts`);
    },
    fusionner(g, done){
      if (g.demineur && typeof g.demineur === "object"){
        const mine = readKey("demineur.best", {}) || {}; let n = 0;
        for (const [k, t] of Object.entries(g.demineur)) if (/^(facile|moyen|difficile)$/.test(k) && t > 0 && (!mine[k] || t < mine[k])){ mine[k] = Math.round(t); n++; }
        if (n){ writeKey("demineur.best", mine); done.push(`Démineur : ${n} record${n > 1 ? "s" : ""}`); }
      }
      if (g.demineurJour && typeof g.demineurJour === "object"){
        const mine = readKey("demineur.jour", {}) || {}; let n = 0;
        for (const [d, t] of Object.entries(g.demineurJour)) if (/^\d{8}$/.test(d) && t > 0 && (!mine[d] || t < mine[d])){ mine[d] = Math.round(t); n++; }
        if (n){ writeKey("demineur.jour", mine); done.push(`Démineur : ${n} défi${n > 1 ? "s" : ""} du jour`); }
      }
      const p = g.demineurPrairie;
      if (p && typeof p === "object" && p.score > 0){
        const mine = readKey("demineur.prairie", {}) || {};
        if (!(mine.score >= p.score)){ writeKey("demineur.prairie", {score: Math.round(p.score), dist: Math.round(p.dist) || 0}); done.push("Démineur : record de la Grande prairie"); }
      }
    }}
});

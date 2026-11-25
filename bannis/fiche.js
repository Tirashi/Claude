/* Les Bannis : fiche de l'accueil (voir accueil-outils.js). Session 1 : une nuit de 12 vagues jouable ; démo, sans classement. */
Ludo.fiche({
  k: "bannis/index.html",
  carte: {n: "LES BANNIS", img: "bannis/etiquette.jpg", jaq: "bannis/jaquette.jpg", s: "BANNIS", ic: "bannis", fam: "32", lb: "linear-gradient(#6a3a7a, #1a1040)", lt: "#ffd76a", sh: "#e07a5a", demo: true,
    d: "Un autobattler rogue-lite. Le Mage instable, banni pour ses sorts imprévisibles, tient la Muraille de l'Île des Bannis avec trois condamnés tirés au sort. Place l'escouade, regarde-la se battre contre les hordes de la Gueule, lance les dés du Mage, équipe le butin et fais évoluer tes héros en classes légendaires. Douze vagues jusqu'au matin.", tags: ["ROGUE-LITE", "AUTOBATTLER", "DES"]},
  meta: {added: "2026-11-19", updated: "2026-11-19", genres: ["TACTIQUE", "HASARD"]},
  records: () => { const s = rk("bannis.stats", null) || {};
    return [["Meilleure vague", s.nuits ? num(s.record) + " / 12" : null], ["Nuits tenues", s.nuits ? num(s.gagnees || 0) + " / " + num(s.nuits) : null], ["Monstres abattus", s.kills ? num(s.kills) : null], ["Éclats de Gueule", s.eclats ? num(s.eclats) : null]]; },
  enCours: () => { const r = rk("bannis.run", null); return r && r.vague ? "Nuit en cours : vague " + r.vague : null; },
  nom: "Les Bannis",
  transfert: {cles: ["bannis.stats"],
    collecter(g){ const s = readKey("bannis.stats", null); if (s && s.nuits > 0) g["bannis.stats"] = s; },
    decrire(g, out){ const s = g["bannis.stats"]; if (s && s.nuits) out.push(`Les Bannis : record vague ${Math.round(Number(s.record) || 0)}, ${Math.round(Number(s.eclats) || 0)} éclats`); },
    fusionner(g, done){
      const a = g["bannis.stats"]; if (!a || typeof a !== "object" || !(a.nuits > 0)) return;
      // le plus grand de chaque compte
      const m = readKey("bannis.stats", null) || {}, n = {};
      for (const k of ["nuits", "record", "gagnees", "eclats", "kills"]) n[k] = Math.max(Math.round(Number(a[k]) || 0), Math.round(Number(m[k]) || 0));
      n.record = Math.min(12, n.record);
      if (["nuits", "record", "gagnees", "eclats", "kills"].some(k => n[k] !== (m[k] || 0))){ writeKey("bannis.stats", n); done.push(`Les Bannis : record vague ${n.record}`); }
    }}
});

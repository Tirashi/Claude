/* Résistance : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "resistance/index.html",
  carte: {n: "RESISTANCE", s: "RESISTANCE", ic: "resistance", fam: "32", lb: "linear-gradient(#2c4fa8, #121a3a)", lt: "#ffd23f", sh: "#2c4fa8",
    d: "Rogue-lite tactique façon Fire Emblem GBA : un tyran a soumis le continent, mène l'armée rebelle. Recrute tes soldats, traverse le pays de combat en combat (marchand, repos, événements), triangle des armes, mort définitive, et abats le général. À chaque retour, agrandis la forteresse rebelle : caserne, taverne, infirmerie, Mémorial des vétérans…", tags: ["ROGUE-LITE", "FORTERESSE", "11 CLASSES"]},
  meta: {added: "2026-10-28", genres: ["TACTIQUE"]},
  enCours: () => { const r = (rk("resistance.run", {}) || {}).run, n = r && r.map && r.current !== null ? r.map.nodes[r.current] : null; return r ? (n ? `ETAGE ${n.floor + 1}/${r.map.floors}` : "CAMPAGNE EN COURS") : null; },
  records: () => { const m = (rk("resistance.save", {}) || {}).meta || {}, b = Object.values(m.upgrades || {}).reduce((a, v) => a + (Number(v) || 0), 0);
    return [["Pays libérés", num(m.wins)], ["Campagnes", num(m.runs)], ["Forteresse", num(b, b > 1 ? "niveaux" : "niveau")], ["Vétéran", m.veteran && m.veteran.name ? `${m.veteran.name} (niv ${m.veteran.level})` : null]]; },
  transfert: {cles: ["resistance"],
    collecter(g){
      const re = (readKey("resistance.save", {}) || {}).meta;
      if (re && re.runs) g.resistance = re;
    },
    decrire(g, out){
      if (g.resistance){ const m = g.resistance; out.push(`Résistance : ${m.runs} campagne${m.runs > 1 ? "s" : ""}${m.wins ? `, ${m.wins} pays libéré${m.wins > 1 ? "s" : ""}` : ""}`); }
    },
    fusionner(g, done){
      if (g.resistance && typeof g.resistance === "object" && Number(g.resistance.runs) > 0){
        // fusion : la forteresse la plus avancée (le plus de campagnes) remplace l'autre en entier
        const loc = (readKey("resistance.save", {}) || {}).meta || {};
        if (Number(g.resistance.runs) > (Number(loc.runs) || 0)){ writeKey("resistance.save", {version: 1, meta: g.resistance}); done.push(`Résistance : forteresse après ${Math.round(g.resistance.runs)} campagnes`); }
      }
    }}
});

/* Tank Arena : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "tank-arena/index.html",
  carte: {n: "TANK ARENA", s: "TANK ARENA", ic: "tank", fam: "3d", lb: "linear-gradient(#5a6ee0, #2a2f6e)", lt: "#ffcf4a", sh: "#e2433a", rank: "tankarena",
    d: "Une petite arène de tanks en 3D. Toi contre trois tanks de l'ordinateur, chacun pour soi : glisse le doigt pour rouler, ton tank tire tout seul. Détruis-en le plus possible en 90 secondes, ou tiens en survie face à des vagues de chasseurs, de blindés et de tireurs. La caisse du centre : réparation, tir triple, bouclier, vitesse.", tags: ["3D", "ACTION", "SURVIE"]},
  meta: {added: "2026-11-17", updated: "2026-11-18", genres: ["ARCADE"]},
  records: () => { const s = rk("tankarena.stats", null) || {};
    return [["Meilleure manche", s.parties ? num(rk("tankarena.best", 0)) + " tanks" : null], ["Victoires", s.parties ? num(s.victoires || 0) + " / " + num(s.parties) : null], ["Tanks détruits", s.total ? num(s.total) : null], ["Survie", (rk("tankarena.survie", null) || {}).vague ? "vague " + num(rk("tankarena.survie", {}).vague) : null]]; },
  classements: [{label: "MEILLEURE MANCHE", game: "tankarena", board: () => "best", fmt: v => N(v) + (v > 1 ? " tanks" : " tank"), title: () => "TANKS DETRUITS EN UNE MANCHE",
    note: "Le plus de tanks détruits en une manche de 90 secondes."},
    {label: "SURVIE", game: "tankarena", board: () => "survie", fmt: v => "vague " + N(v), title: () => "VAGUE ATTEINTE EN SURVIE",
    note: "La vague atteinte en survie, avec 3 vies."}],
  transfert: {cles: ["tankarena.best", "tankarena.stats", "tankarena.survie"],
    collecter(g){
      const b = Number(readKey("tankarena.best", 0)), s = readKey("tankarena.stats", null);
      if (b > 0) g["tankarena.best"] = b;
      if (s && s.parties > 0) g["tankarena.stats"] = s;
      const sv = readKey("tankarena.survie", null); if (sv && sv.vague > 0) g["tankarena.survie"] = sv;
    },
    decrire(g, out){
      if (g["tankarena.best"] || g["tankarena.stats"] || g["tankarena.survie"]) out.push(`Tank Arena : record ${Number(g["tankarena.best"]) || 0} tank${g["tankarena.best"] > 1 ? "s" : ""}${g["tankarena.survie"] ? `, survie vague ${g["tankarena.survie"].vague}` : ""}`);
    },
    fusionner(g, done){
      const v = Number(g["tankarena.best"]);
      if (v > 0 && v > Number(readKey("tankarena.best", 0))){ writeKey("tankarena.best", Math.round(v)); done.push(`Tank Arena : record ${Math.round(v)}`); }
      const a = g["tankarena.stats"];
      if (a && typeof a === "object" && a.parties > 0){
        const m = readKey("tankarena.stats", null) || {parties: 0, victoires: 0, total: 0};
        if (a.parties > m.parties){ writeKey("tankarena.stats", {parties: Math.round(a.parties), victoires: Math.round(Number(a.victoires) || 0), total: Math.round(Number(a.total) || 0)}); done.push("Tank Arena : statistiques"); }
      }
      const sv = g["tankarena.survie"];
      if (sv && typeof sv === "object" && sv.vague > 0){
        const m = readKey("tankarena.survie", null) || {vague: 0, kills: 0, parties: 0};
        if (sv.vague > m.vague || (sv.vague === m.vague && sv.kills > m.kills)){
          writeKey("tankarena.survie", {vague: Math.round(sv.vague), kills: Math.round(Number(sv.kills) || 0), parties: Math.max(Math.round(Number(sv.parties) || 0), m.parties || 0)}); done.push(`Tank Arena : survie vague ${Math.round(sv.vague)}`); }
      }
    }}
});

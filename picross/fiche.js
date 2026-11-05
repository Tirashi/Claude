/* Picross Dex : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "picross/index.html",
  carte: {n: "PICROSS DEX", s: "PICROSS DEX", ic: "ball", fam: "16", lb: "#cf2b34", lt: "#fff7ec", sh: "#d23a3a", rank: "picross",
    d: "Remplis la grille d'après les nombres pour révéler un Pokémon. Fan-game personnel.", tags: ["207 GRILLES"]},
  meta: {genres: ["LOGIQUE"]},
  nom: "Picross Dex",
  enCours: () => { const n = count(rk("picrossdex.progress", {})); return n ? `${n} GRILLE${n > 1 ? "S" : ""}` : null; },
  records: () => { const cap = rk("picrossdex.captured", {}) || {}, n = Object.keys(cap).filter(id => cap[id] && !cap[id].test && id !== "pokeball").length;
    return [["Pokémon capturés", num(n)], ["Grilles commencées", num(count(rk("picrossdex.progress", {})))]]; },
  classements: [{label: "PAR POKEMON", ctl: ["pokemon"], game: "picross", board: () => "t:" + st.poke, fmt: T, title: () => st.poke ? Ludo.pokeLabel(st.poke) : "PAR POKEMON",
     note: "Temps de la grille, plus 30 secondes par indice utilisé.", empty: "Personne n'a encore capturé de Pokémon."},
    {label: "RECORDS DETENUS", kind: "records", game: "picross", fmt: v => N(v) + (v > 1 ? " records" : " record"), title: () => "QUI DETIENT LE PLUS DE RECORDS",
     note: "Nombre de Pokémon sur lesquels chacun a le meilleur temps de la famille."},
    {label: "POKEDEX", game: "picross", board: () => "dex", fmt: v => N(v) + " capturés", title: () => "LE POKEDEX LE PLUS COMPLET"}],
  transfert: {cles: ["picross"],
    collecter(g){
      const cap = readKey("picrossdex.captured", {}), prog = readKey("picrossdex.progress", {});
      const c = {}, p = {};
      for (const [id, v] of Object.entries(cap || {})) if (v && v.time > 0) c[id] = Object.assign({t: v.time, h: v.hints || 0}, v.test ? {x: 1} : {});
      for (const [id, v] of Object.entries(prog || {})) if (v && Array.isArray(v.cells)) p[id] = {c: v.cells.join(""), e: Math.round(v.elapsed || 0), h: v.hints || 0};
      if (Object.keys(c).length || Object.keys(p).length) g.picross = {c, p};
    },
    decrire(g, out){
      if (g.picross) out.push(`Picross Dex : ${Object.keys(g.picross.c).length} Pokémon` + (Object.keys(g.picross.p).length ? `, ${Object.keys(g.picross.p).length} grille(s) en cours` : ""));
    },
    fusionner(g, done){
      if (g.picross){
        const cap = readKey("picrossdex.captured", {}) || {}, prog = readKey("picrossdex.progress", {}) || {};
        let added = 0, faster = 0, grids = 0;
        for (const [id, v] of Object.entries(g.picross.c || {})){
          if (!/^[a-z0-9_-]+$/.test(id) || !(v.t > 0)) continue;
          const mk = () => Object.assign({time: Math.round(v.t), hints: v.h || 0}, v.x ? {test: true} : {});
          const score = (t, n) => t + 30000 * (n || 0);
          if (!cap[id]){ cap[id] = mk(); added++; }
          else if (score(v.t, v.h) < score(cap[id].time, cap[id].hints)){ cap[id] = mk(); faster++; }
        }
        for (const [id, v] of Object.entries(g.picross.p || {})){
          if (!/^[a-z0-9_-]+$/.test(id) || cap[id] || prog[id] || typeof v.c !== "string" || !/^[012]+$/.test(v.c)) continue;
          prog[id] = {cells: [...v.c].map(Number), elapsed: v.e || 0, hints: v.h || 0}; grids++;
        }
        for (const id of Object.keys(prog)) if (cap[id]) delete prog[id];
        writeKey("picrossdex.captured", cap); writeKey("picrossdex.progress", prog);
        const parts = [];
        if (added) parts.push(`${added} Pokémon`); if (faster) parts.push(`${faster} record${faster > 1 ? "s" : ""}`); if (grids) parts.push(`${grids} grille${grids > 1 ? "s" : ""} en cours`);
        if (parts.length) done.push("Picross Dex : " + parts.join(", "));
      }
    }}
});

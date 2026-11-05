/* Injagility : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "injagility/index.html",
  carte: {n: "INJAGILITY", s: "INJAGILITY", ic: "dog", fam: "32", lb: "linear-gradient(#78bae7, #5fb548)", lt: "#fff", sh: "#5fb548", rank: "injagility",
    d: "Ton chien en agility : course sans fin, ou parcours vus du dessus à tracer au doigt. Six races à adopter au chenil.", tags: ["COURSE", "PARCOURS"], play: "INFINI ▶", more: [["PARCOURS ▶", "injagility/parcours.html"]]},
  meta: {genres: ["ADRESSE", "CHIENS"]},
  records: () => { const p = rk("injagility.parcours", {}) || {};
    return [["Infini", num(rk("injagility.best", 0), "obstacles")], ["Parcours réussis", num((p.unlocked || 1) - 1)], ["Parcours : total", num(sum(p.best), "pts")]]; },
  classements: [{label: "INFINI", game: "injagility", board: () => "best", fmt: v => N(v) + " obst.", title: () => "INFINI · OBSTACLES FRANCHIS"},
    {label: "PARCOURS · TOTAL", game: "parcours", board: () => "total", fmt: v => N(v) + " pts", title: () => "PARCOURS · TOTAL DES MEILLEURS SCORES"},
    {label: "PAR PARCOURS", ctl: ["plevel"], game: "parcours", board: () => "lvl:" + st.plevel, fmt: v => N(v) + " pts", title: () => `PARCOURS N° ${st.plevel}`}],
  transfert: {cles: ["injagility.best", "parcours"],
    collecter(g){
      const pc = readKey("injagility.parcours", null); if (pc && (pc.wallet || (pc.unlocked || 1) > 1)) g.parcours = pc;
      { const v = Number(readKey("injagility.best", 0)); if (v > 0) g["injagility.best"] = v; }
    },
    decrire(g, out){
      if (g["injagility.best"]) out.push(`Injagility : ${g["injagility.best"]} obstacles`);
      if (g.parcours) out.push(`Injagility Parcours : ${(g.parcours.unlocked || 1) - 1} parcours réussis, ${g.parcours.wallet || 0} points, ${(g.parcours.owned || []).length} chien${(g.parcours.owned || []).length > 1 ? "s" : ""}`);
    },
    fusionner(g, done){
      { const v = Number(g["injagility.best"]); if (v > 0 && v > Number(readKey("injagility.best", 0))){ writeKey("injagility.best", v); done.push(`Injagility : record ${v}`); } }
      if (g.parcours && typeof g.parcours === "object"){
        // on garde le plus avancé : niveaux, meilleurs scores, chiens adoptés, et le plus gros porte-monnaie
        const mine = readKey("injagility.parcours", {}) || {}, o = g.parcours, before = JSON.stringify(mine);
        mine.unlocked = Math.max(mine.unlocked || 1, Math.min(999, o.unlocked || 1));
        mine.wallet = Math.max(mine.wallet || 0, Math.min(1e7, o.wallet || 0));
        mine.best = mine.best || {}; for (const [k, v] of Object.entries(o.best || {})) if (/^\d+$/.test(k) && v > (mine.best[k] || 0)) mine.best[k] = Math.round(v);
        mine.owned = [...new Set([...(mine.owned || ["bernois"]), ...(o.owned || []).filter(x => /^[a-z]+$/.test(x))])];
        mine.dog = mine.dog || o.dog || "bernois";
        if (JSON.stringify(mine) !== before){ writeKey("injagility.parcours", mine); done.push("Injagility Parcours : progression mise à jour"); }
      }
    }}
});

/* Romet : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "romet/index.html",
  carte: {n: "ROMET", s: "ROMET", ic: "romet", fam: "3d", lb: "linear-gradient(#c0281c, #5a1a0e)", lt: "#ffe2a0", sh: "#e2b04a", rank: "romet",
    d: "Un coin pusher en 3D, en hommage à Mynthos : lâche tes pièces, le poussoir fait tomber les autres dans le bac. Six machines à finir, de la foire à l'horloger, chacune avec sa règle (miel, courant, couloirs, clous, deux étages) et ses 6 trésors, et une machine secrète.", tags: ["3D", "7 MACHINES", "6 REGLES"]},
  meta: {added: "2026-10-22", genres: ["ARCADE", "HASARD"]},
  enCours: () => { const p = rk("romet.partie", {}) || {}, ids = Object.keys(p).filter(k => p[k] && !p[k].fini); return ids.length ? (ids.length > 1 ? ids.length + " PARTIES" : "PARTIE EN COURS") : null; },
  records: () => { const m = rk("romet.machines", {}) || {}, v = Object.values(m).filter(x => x && typeof x === "object");
    const t = v.reduce((a, x) => a + (Array.isArray(x.t) ? x.t.filter(Boolean).length : 0), 0), f = v.filter(x => Array.isArray(x.t) && x.t.length && x.t.every(Boolean)).length;
    return [["Trésors", num(t, "/ 42")], ["Machines terminées", num(f, "/ 7")], ["Meilleur butin", num(v.reduce((a, x) => Math.max(a, Number(x.butin) || 0), 0), "pièces")]]; },
  classements: [{label: "TRESORS", game: "romet", board: () => "tresors", fmt: v => N(v) + (v > 1 ? " trésors" : " trésor"), title: () => "TOTAL DES TRESORS",
     note: "Les trésors gagnés dans toutes les machines : 6 par machine, 42 en tout avec la machine secrète."},
    {label: "BUTIN", game: "romet", board: () => "butin", fmt: v => N(v) + (v > 1 ? " pièces" : " pièce"), title: () => "MEILLEUR BUTIN",
     note: "Le plus de pièces tombées dans le bac en une partie (une bourse), toutes machines confondues ; une pièce rejouée puis regagnée compte encore."}],
  transfert: {cles: ["romet"],
    collecter(g){
      const ro = readKey("romet.machines", null);
      if (ro && typeof ro === "object" && Object.keys(ro).length) g.romet = ro;
    },
    decrire(g, out){
      if (g.romet){ const v = Object.values(g.romet).filter(x => x && typeof x === "object"), t = v.reduce((a, x) => a + (Array.isArray(x.t) ? x.t.filter(Boolean).length : 0), 0);
        out.push(`Romet : ${t} trésor${t > 1 ? "s" : ""}, meilleur butin ${v.reduce((a, x) => Math.max(a, Number(x.butin) || 0), 0)}`); }
    },
    fusionner(g, done){
      if (g.romet && typeof g.romet === "object"){
        // fusion : par machine, les trésors gagnés d'un côté ou de l'autre, le meilleur butin, le plus de parties
        const cur = readKey("romet.machines", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(g.romet)) { if (!/^[a-z]{2,12}$/.test(k) || !v || typeof v !== "object") continue;
          const c = cur[k] && typeof cur[k] === "object" ? cur[k] : {t: [], butin: 0, parties: 0}, t = Array.isArray(c.t) ? c.t.slice() : [];
          const vt = Array.isArray(v.t) ? v.t.slice(0, 6) : []; let ch = !cur[k];
          vt.forEach((x, i) => { if (x && !t[i]) { t[i] = true; ch = true; } }); for (let i = 0; i < Math.max(6, t.length); i++) t[i] = !!t[i];
          const b = Math.max(Number(c.butin) || 0, Math.round(Number(v.butin) || 0)), p = Math.max(Number(c.parties) || 0, Math.round(Number(v.parties) || 0));
          if (b !== (Number(c.butin) || 0) || p !== (Number(c.parties) || 0)) ch = true;
          if (ch) { cur[k] = {t: t.slice(0, 6), butin: b, parties: p}; n++; } }
        if (n){ writeKey("romet.machines", cur); done.push(`Romet : ${n} machine${n > 1 ? "s" : ""}`); }
      }
    }}
});

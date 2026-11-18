/* Ciel de guerre : fiche de l'accueil (voir accueil-outils.js). Session 2 : 5 missions à étoiles et les vagues sans fin ; démo, sans classement. */
Ludo.fiche({
  k: "ciel-de-guerre/index.html",
  carte: {n: "CIEL DE GUERRE", s: "CIEL", ic: "cieldeguerre", fam: "3d", lb: "linear-gradient(#f2a37a, #4a2f5a)", lt: "#fff0dc", sh: "#c8642e", demo: true, disquette: true,
    d: "Combat aérien en 3D au-dessus d'un archipel, au milieu d'une bataille de grands vaisseaux. Loopings, tonneaux, canon et missiles à verrouiller, tourelles rouges à abattre, et 35 chasseurs en 4 familles au hangar. Cinq missions jusqu'à la forteresse volante, et des vagues sans fin. Au doigt sur téléphone, à la souris sur ordinateur.", tags: ["3D", "5 MISSIONS", "SOURIS"]},
  meta: {added: "2026-11-18", updated: "2026-11-18", genres: ["ACTION"]},
  records: () => { const r = rk("cieldeguerre.record", {}) || {}, m = rk("cieldeguerre.missions", {}) || {}, et = Object.values(m).reduce((a, v) => a + (Number(v && v.e) || 0), 0);
    return [["Étoiles", et ? et + " / 15" : null], ["Missions réussies", m && Object.keys(m).length ? Object.keys(m).length + " / 5" : null], ["Vagues : record", num(r.score, "")], ["Meilleure vague", num(r.vague, "")]]; },
  nom: "Ciel de guerre",
  transfert: {cles: ["cieldeguerre"],
    collecter(g){ const r = readKey("cieldeguerre.record", null), m = readKey("cieldeguerre.missions", null); if ((r && (r.score || r.parties)) || (m && Object.keys(m).length)) g.cieldeguerre = {r: r || {}, m: m || {}, a: readKey("cieldeguerre.avion", null)}; },
    decrire(g, out){ if (g.cieldeguerre && g.cieldeguerre.r){ const r = g.cieldeguerre.r, et = Object.values(g.cieldeguerre.m || {}).reduce((a, v) => a + (Number(v && v.e) || 0), 0);
      out.push(`Ciel de guerre : ${et} étoile${et > 1 ? "s" : ""}, record des vagues ${Math.round(Number(r.score) || 0)}`); } },
    fusionner(g, done){
      if (g.cieldeguerre && g.cieldeguerre.r && typeof g.cieldeguerre.r === "object"){
        // fusion : le plus grand de chaque compte
        const a = g.cieldeguerre.r, m = readKey("cieldeguerre.record", {}) || {}, n = {};
        for (const k of ["score", "vague", "parties"]) n[k] = Math.max(Math.round(Number(a[k]) || 0), Math.round(Number(m[k]) || 0));
        if (n.score !== (m.score || 0) || n.vague !== (m.vague || 0) || n.parties !== (m.parties || 0)){ writeKey("cieldeguerre.record", n); done.push("Ciel de guerre : record"); }
        // missions : le plus d'étoiles et le meilleur score de chacune
        const mm = readKey("cieldeguerre.missions", {}) || {}; let nm = 0;
        for (const [k, v] of Object.entries(g.cieldeguerre.m || {})) { if (!/^[a-z]{1,12}$/.test(k) || !v) continue; const e = Math.min(3, Math.max(0, Math.round(Number(v.e) || 0))), s = Math.max(0, Math.round(Number(v.s) || 0)), a = mm[k] || {};
          if (e > (a.e || 0) || s > (a.s || 0)){ mm[k] = {e: Math.max(e, a.e || 0), s: Math.max(s, a.s || 0)}; nm++; } }
        if (nm){ writeKey("cieldeguerre.missions", mm); done.push(`Ciel de guerre : ${nm} mission${nm > 1 ? "s" : ""}`); }
        if (!readKey("cieldeguerre.avion", null) && /^py\d{1,2}$/.test(g.cieldeguerre.a || "")) writeKey("cieldeguerre.avion", g.cieldeguerre.a);
      }
    }}
});

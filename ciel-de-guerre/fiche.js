/* Ciel de guerre : fiche de l'accueil (voir accueil-outils.js). Session 1 = le socle (vagues sans fin) : démo, sans classement. */
Ludo.fiche({
  k: "ciel-de-guerre/index.html",
  carte: {n: "CIEL DE GUERRE", s: "CIEL", ic: "cieldeguerre", fam: "3d", lb: "linear-gradient(#f2a37a, #4a2f5a)", lt: "#fff0dc", sh: "#c8642e", demo: true, disquette: true,
    d: "Combat aérien en 3D au-dessus d'un archipel, au milieu d'une bataille de grands vaisseaux. Loopings, tonneaux, canon et missiles à verrouiller, tourelles rouges à abattre, et 35 chasseurs en 4 familles au hangar. Au doigt sur téléphone, à la souris sur ordinateur.", tags: ["3D", "35 CHASSEURS", "SOURIS"]},
  meta: {added: "2026-11-18", genres: ["ACTION"]},
  records: () => { const r = rk("cieldeguerre.record", {}) || {};
    return [["Meilleur score", num(r.score, "")], ["Meilleure vague", num(r.vague, "")], ["Parties", num(r.parties, "")]]; },
  nom: "Ciel de guerre",
  transfert: {cles: ["cieldeguerre"],
    collecter(g){ const r = readKey("cieldeguerre.record", null); if (r && (r.score || r.parties)) g.cieldeguerre = {r, a: readKey("cieldeguerre.avion", null)}; },
    decrire(g, out){ if (g.cieldeguerre && g.cieldeguerre.r){ const r = g.cieldeguerre.r; out.push(`Ciel de guerre : record ${Math.round(Number(r.score) || 0)}, vague ${Math.round(Number(r.vague) || 0)}`); } },
    fusionner(g, done){
      if (g.cieldeguerre && g.cieldeguerre.r && typeof g.cieldeguerre.r === "object"){
        // fusion : le plus grand de chaque compte
        const a = g.cieldeguerre.r, m = readKey("cieldeguerre.record", {}) || {}, n = {};
        for (const k of ["score", "vague", "parties"]) n[k] = Math.max(Math.round(Number(a[k]) || 0), Math.round(Number(m[k]) || 0));
        if (n.score !== (m.score || 0) || n.vague !== (m.vague || 0) || n.parties !== (m.parties || 0)){ writeKey("cieldeguerre.record", n); done.push("Ciel de guerre : record"); }
        if (!readKey("cieldeguerre.avion", null) && /^py\d{1,2}$/.test(g.cieldeguerre.a || "")) writeKey("cieldeguerre.avion", g.cieldeguerre.a);
      }
    }}
});

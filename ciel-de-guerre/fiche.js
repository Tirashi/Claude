/* Ciel de guerre : fiche de l'accueil (voir accueil-outils.js). Session 5 : 6 missions, déblocages, classements à étoiles et les vagues sans fin ; démo, sans classement. */
Ludo.fiche({
  k: "ciel-de-guerre/index.html",
  carte: {n: "CIEL DE GUERRE", s: "CIEL", ic: "cieldeguerre", fam: "3d", lb: "linear-gradient(#f2a37a, #4a2f5a)", lt: "#fff0dc", sh: "#c8642e", rank: "cieldeguerre", disquette: true,
    d: "Combat aérien en 3D au-dessus d'un archipel, au milieu d'une bataille de grands vaisseaux. Loopings, tonneaux, canon et missiles à verrouiller, tourelles rouges à abattre, et 35 chasseurs en 4 familles au hangar. Six missions jusqu'à la forteresse volante (dont un raid sur une base au sol), des ailiers, cinq ambiances et des vagues sans fin. Chaque appareil a son profil ; la solde gagnée en jouant débloque les autres. Au doigt sur téléphone, à la souris sur ordinateur.", tags: ["3D", "6 MISSIONS", "SOURIS"]},
  meta: {added: "2026-11-18", updated: "2026-11-19", genres: ["ACTION"]},
  records: () => { const r = rk("cieldeguerre.record", {}) || {}, m = rk("cieldeguerre.missions", {}) || {}, et = Object.values(m).reduce((a, v) => a + (Number(v && v.e) || 0), 0);
    return [["Étoiles", et ? et + " / 18" : null], ["Missions réussies", m && Object.keys(m).length ? Object.keys(m).length + " / 6" : null], ["Vagues : record", num(r.score, "")], ["Meilleure vague", num(r.vague, "")], ["Appareils ouverts", (() => { const h = rk("cieldeguerre.hangar", {}) || {}; return (5 + (Array.isArray(h.ouverts) ? h.ouverts.filter(k => k !== "py7").length : 0)) + " / 35"; })()]]; },
  classements: [{label: "VAGUES", game: "cieldeguerre", board: () => "vagues", fmt: v => N(v) + " pts", title: () => "MEILLEUR SCORE EN VAGUES SANS FIN",
    note: "Le meilleur score d'une partie en vagues sans fin, avec 3 appareils."},
    {label: "ETOILES", game: "cieldeguerre", board: () => "etoiles", fmt: v => N(v) + " / 18", title: () => "ETOILES DES MISSIONS",
    note: "Le total des étoiles gagnées dans les 6 missions."}],
  nom: "Ciel de guerre",
  transfert: {cles: ["cieldeguerre"],
    collecter(g){ const r = readKey("cieldeguerre.record", null), m = readKey("cieldeguerre.missions", null); if ((r && (r.score || r.parties)) || (m && Object.keys(m).length)) g.cieldeguerre = {r: r || {}, m: m || {}, a: readKey("cieldeguerre.avion", null), h: readKey("cieldeguerre.hangar", null)}; },
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
        // hangar : la plus grosse solde, et tous les appareils ouverts d'un côté ou de l'autre
        const ha = g.cieldeguerre.h; if (ha && typeof ha === "object"){ const hm = readKey("cieldeguerre.hangar", {}) || {}, ou = new Set((Array.isArray(hm.ouverts) ? hm.ouverts : []).filter(k => /^py\d{1,2}$/.test(k)));
          let n = 0; for (const k of (Array.isArray(ha.ouverts) ? ha.ouverts : [])) if (/^py\d{1,2}$/.test(k) && !ou.has(k)){ ou.add(k); n++; }
          const so = Math.max(Math.round(Number(ha.solde) || 0), Math.round(Number(hm.solde) || 0));
          if (n || so !== (Math.round(Number(hm.solde) || 0))){ writeKey("cieldeguerre.hangar", {solde: so, ouverts: [...ou]}); done.push("Ciel de guerre : hangar"); } }
      }
    }}
});

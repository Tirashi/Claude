/* Stratégie spatiale (nom provisoire) : fiche de l'accueil (voir accueil-outils.js). Session 1 : un système (SOL-7) à défendre contre 8 vagues ; démo, sans classement. */
Ludo.fiche({
  k: "strategie-ciel/index.html",
  carte: {n: "STRATEGIE SPATIALE", img: "strategie-ciel/etiquette.jpg", jaq: "strategie-ciel/jaquette.jpg", s: "STRAT.", ic: "strategieciel", fam: "3d", lb: "linear-gradient(#2a3a7a, #0b0a1e)", lt: "#ffd27a", sh: "#5ab0ff", demo: true,
    d: "Stratégie en temps réel avec pause dans l'univers de Ciel de guerre (nom provisoire). Ton porte-vaisseaux Aurore, géant et lent, fabrique tout : collecteurs qui minent le cristal de la ceinture d'astéroïdes, chasseurs, bombardiers et destroyers. Défends le système SOL-7, son étoile et ses planètes en orbite, contre les vagues de la flotte rouge qui entrent par la porte d'Altair. Colonise les planètes avec des colons, construis-y mines, labos, chantiers et défenses, et fais avancer la recherche en choisissant tes cartes. À la souris sur ordinateur, au doigt sur téléphone.", tags: ["3D", "STRATEGIE", "PAUSE"]},
  meta: {added: "2026-11-20", updated: "2026-11-21", genres: ["STRATEGIE", "ESPACE"]},
  records: () => { const r = rk("strategieciel.record", {}) || {};
    return [["Vagues tenues (meilleur)", r.parties ? num(r.vagues || 0) + " / 8" : null], ["Victoires", r.parties ? num(r.victoires || 0) + " / " + num(r.parties) : null]]; },
  nom: "la stratégie spatiale",
  transfert: {cles: ["strategieciel"],
    collecter(g){ const r = readKey("strategieciel.record", null); if (r && r.parties > 0) g.strategieciel = r; },
    decrire(g, out){ const r = g.strategieciel; if (r && r.parties) out.push(`Stratégie spatiale : ${Math.round(Number(r.vagues) || 0)} vagues tenues au mieux`); },
    fusionner(g, done){
      const a = g.strategieciel; if (!a || typeof a !== "object" || !(a.parties > 0)) return;
      // le plus grand de chaque compte
      const m = readKey("strategieciel.record", null) || {}, n = {};
      for (const k of ["parties", "vagues", "victoires"]) n[k] = Math.max(Math.round(Number(a[k]) || 0), Math.round(Number(m[k]) || 0));
      n.vagues = Math.min(8, n.vagues);
      if (["parties", "vagues", "victoires"].some(k => n[k] !== (m[k] || 0))){ writeKey("strategieciel.record", n); done.push(`Stratégie spatiale : ${n.vagues} vagues`); }
    }}
});

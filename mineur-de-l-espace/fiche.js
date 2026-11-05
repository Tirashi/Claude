/* Mineur de l'espace : fiche de l'accueil (voir accueil-outils.js) */
{   // bloc : ces const ne sortent pas de la fiche
const mineurEtage = e => e.bases && e.bases.mars ? 4 : e.recherche && e.recherche.transfert ? 3 : e.recherche && e.recherche.centre ? 2 : 1;
const mineurTemps = t => { t = Math.floor((Number(t) || 0) / 60); return Math.floor(t / 60) + " h " + String(t % 60).padStart(2, "0"); };
Ludo.fiche({
  k: "mineur-de-l-espace/index.html",
  carte: {n: "MINEUR DE L'ESPACE", s: "MINEUR", ic: "mineur", fam: "32", lb: "radial-gradient(circle at 70% 25%, #24306a, #05060d 70%)", lt: "#ffcf4a", sh: "#3b6fd0",
    d: "Pilote ta corvette dans la ceinture d'astéroïdes, casse les roches et rapporte le minerai à la station en orbite. Améliore ta corvette, construis la station module par module, envoie des drones miner, pars vers la Lune et Mars, puis défends tes bases contre les aliens avec tes flottes, jusqu'à la grande bataille contre le vaisseau-mère. Une partie de 3 à 5 heures, sauvegardée au quai.", tags: ["GESTION", "MINAGE", "3 A 5 H"]},
  meta: {added: "2026-11-01", genres: ["SIMULATION", "ESPACE"]},
  enCours: () => { const e = rk("mineur-de-l-espace", null); return e && e.temps > 30 && !e.fin ? `ETAGE ${mineurEtage(e)}/4` : null; },
  records: () => { const e = rk("mineur-de-l-espace", null); if (!e) return [];
    return [["Étage atteint", e.fin ? "4 (fin)" : mineurEtage(e) + " / 4"], ["Temps de jeu", e.temps > 60 ? mineurTemps(e.temps) : null], ["Vaisseau-mère", e.fin ? "abattu" : null]]; },
  transfert: {cles: ["mineur"],
    collecter(g){
      const mi = readKey("mineur-de-l-espace", null); if (mi && mi.v && mi.temps > 0) g.mineur = mi;
    },
    decrire(g, out){
      if (g.mineur){ const e = g.mineur; out.push(`Mineur de l'espace : étage ${mineurEtage(e)}${e.fin ? " (fini)" : ""}, ${mineurTemps(e.temps)} de jeu`); }
    },
    fusionner(g, done){
      if (g.mineur && typeof g.mineur === "object" && g.mineur.v && Number(g.mineur.temps) > 0){
        // une seule partie : on garde la plus avancée (finie d'abord, puis le plus long temps de jeu)
        const loc = readKey("mineur-de-l-espace", null), a = g.mineur, rang = e => (e && e.fin ? 1e9 : 0) + (Number(e && e.temps) || 0);
        if (rang(a) > rang(loc)){ writeKey("mineur-de-l-espace", a); done.push(`Mineur de l'espace : partie de ${mineurTemps(a.temps)} reprise`); }
      }
    }}
});
}

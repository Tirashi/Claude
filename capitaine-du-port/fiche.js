/* Capitaine du port : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "capitaine-du-port/index.html",
  carte: {n: "CAPITAINE DU PORT", s: "CAPITAINE", ic: "remorqueur", fam: "32", lb: "linear-gradient(#2a7c97, #163f66)", lt: "#ffd23f", sh: "#2a7c97", rank: "capitaine",
    d: "Le port est encombré : glisse les bateaux dans leur longueur pour ouvrir la passe au navire doré. 60 bassins en 5 ports (pêche, commerce, marina, chantier naval, grand port), en pixel art 32 bits, et un bassin du jour pour toute la famille.", tags: ["PUZZLE", "60 BASSINS", "DU JOUR"]},
  meta: {added: "2026-10-20", genres: ["LOGIQUE", "DU JOUR"]},
  enCours: () => { const d = rk("capitaine.dailyRun", null), p = rk("capitaine.partie", null);
    return d && d.j === dayNum() ? "BASSIN DU JOUR" : p && p.coups ? "BASSIN " + (p.n + 1) : null; },
  duJour: () => !!(rk("capitaine.daily", {}) || {})[dayNum()],
  records: () => { const f = rk("capitaine.niveaux", {}) || {}, n = Object.values(f).reduce((a, v) => a + (Number(v && v.etoiles) || 0), 0);
    return [["Étoiles", n ? n + " / 180" : null], ["Bassins réussis", num(count(f))], ["Bassins du jour", num(count(rk("capitaine.daily", {})))]]; },
  classements: [{label: "ETOILES", game: "capitaine", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "Par bassin : 3 étoiles jusqu'à 10 % au-dessus du minimum de coups (au moins un coup de marge), 2 jusqu'à 50 % au-dessus, sinon 1 (180 au maximum)."},
    {label: "BASSIN DU JOUR", ctl: ["day"], game: "capitaine", board: daily, fmt: v => N(v) + (v > 1 ? " coups" : " coup"), title: () => "BASSIN DU JOUR",
     note: "Le même bassin pour toute la famille ; le moins de coups gagne, en comptant ceux qu'on annule et ceux d'avant un recommencement. Une seule tentative classée par jour.",
     empty: () => st.back ? "Aucun navire doré n'est rentré au port ce jour-là." : "Personne n'a encore tenté le bassin du jour : à toi !"}],
  transfert: {cles: ["capitaine"],
    collecter(g){
      const cp = {n: readKey("capitaine.niveaux", {}) || {}, d: readKey("capitaine.daily", {}) || {}};
      if (Object.keys(cp.n).length || Object.keys(cp.d).length) g.capitaine = cp;
    },
    decrire(g, out){
      if (g.capitaine){ const n = Object.values(g.capitaine.n || {}).reduce((s, v) => s + (Number(v && v.etoiles) || 0), 0), d = Object.keys(g.capitaine.d || {}).length;
        out.push(`Capitaine du port : ${n} étoile${n > 1 ? "s" : ""}${d ? `, ${d} bassin${d > 1 ? "s" : ""} du jour` : ""}`); }
    },
    fusionner(g, done){
      if (g.capitaine && typeof g.capitaine === "object"){
        // fusion : pour chaque bassin, le moins de coups et le plus d'étoiles ; pour chaque bassin du jour, le moins de coups
        const a = g.capitaine, niv = readKey("capitaine.niveaux", {}) || {}, daily = readKey("capitaine.daily", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(a.n || {})) { if (!/^\d{1,2}$/.test(k) || !v || !(v.coups > 0)) continue;
          const m = niv[k], et = Math.min(3, Math.max(1, Math.round(v.etoiles) || 1));
          if (!m || v.coups < m.coups || et > m.etoiles){ niv[k] = {coups: Math.round(m ? Math.min(m.coups, v.coups) : v.coups), etoiles: Math.max(et, m ? m.etoiles : 0)}; n++; } }
        for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
        if (n){ writeKey("capitaine.niveaux", niv); writeKey("capitaine.daily", daily); done.push(`Capitaine du port : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

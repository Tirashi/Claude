/* Calculator : fiche de l'accueil (voir accueil-outils.js) */
Ludo.fiche({
  k: "calculator/index.html",
  carte: {n: "CALCULATOR", s: "CALCULATOR", ic: "calc", fam: "32", lb: "linear-gradient(#3a3d43, #1c1d21)", lt: "#c4d0a8", sh: "#e8783a", rank: "calculator",
    d: "Le calcul mental de 7 à 77 ans : additions, soustractions, multiplications et divisions sur 5 niveaux, en série de 20, contre la montre ou avec le calcul du jour. Trois styles : arcade, cahier ou calculatrice.", tags: ["5 NIVEAUX"]},
  meta: {added: "2026-10-16", genres: ["CALCUL", "DU JOUR"]},
  duJour: () => rk("calculator.dailyTry", 0) === dayNum(),
  records: () => { const b = rk("calculator.best", {}) || {}, out = [], nm = {add: "+", sub: "−", mul: "×", div: "÷", mix: "mélange"};
    for (const k of Object.keys(b).sort()){ const [m, l, c] = k.split(":"); if (m === "serie" && b[k] > 0) out.push([`Série de 20 · niv. ${l} · ${nm[c] || c}`, mmss(b[k])]); }
    for (const k of Object.keys(b).sort()){ const [m, l, c] = k.split(":"); if (m === "chrono" && b[k] > 0) out.push([`60 s · niv. ${l} · ${nm[c] || c}`, num(b[k], "bonnes")]); }
    return out.slice(0, 8).concat([["Calculs du jour", num(count(rk("calculator.daily", {})))], ["Parties jouées", num(rk("calculator.parties", 0))]]); },
  classements: [{label: "CALCUL DU JOUR", ctl: ["day"], game: "calculator", board: daily, fmt: T,
     title: () => "CALCUL DU JOUR", note: "Les mêmes 20 calculs pour toute la famille, du plus facile au plus dur. Le temps, plus 5 secondes par erreur. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a fait le calcul ce jour-là." : "Personne n'a encore fait le calcul du jour : à toi de jouer !"},
    {label: "SERIE DE 20", ctl: ["cclvl", "ccop"], game: "calculator", board: () => `serie:${st.cclvl}:${st.ccop}`, fmt: T,
     title: () => `SERIE DE 20 · ${CCLVL.find(m => m[0] === st.cclvl)[1]} · ${CCOP.find(m => m[0] === st.ccop)[1]}`, note: "Le temps pour 20 calculs, plus 5 secondes par erreur. MELANGE : plusieurs opérations choisies."},
    {label: "60 SECONDES", ctl: ["cclvl", "ccop"], game: "calculator", board: () => `chrono:${st.cclvl}:${st.ccop}`, fmt: v => N(v) + (v > 1 ? " bonnes" : " bonne"),
     title: () => `60 SECONDES · ${CCLVL.find(m => m[0] === st.cclvl)[1]} · ${CCOP.find(m => m[0] === st.ccop)[1]}`, note: "Le plus de bonnes réponses en une minute."}],
  transfert: {cles: ["calculator"],
    collecter(g){
      const cc = {b: readKey("calculator.best", {}) || {}, d: readKey("calculator.daily", {}) || {}, p: Number(readKey("calculator.parties", 0)) || 0};
      if (cc.p || Object.keys(cc.b).length) g.calculator = cc;
    },
    decrire(g, out){
      if (g.calculator){ const p = g.calculator; out.push(`Calculator : ${p.p || 0} partie${p.p > 1 ? "s" : ""}, ${Object.keys(p.b || {}).length} record${Object.keys(p.b || {}).length > 1 ? "s" : ""}`); }
    },
    fusionner(g, done){
      if (g.calculator && typeof g.calculator === "object"){
        const p = g.calculator, best = readKey("calculator.best", {}) || {}, daily = readKey("calculator.daily", {}) || {}; let n = 0;
        for (const [k, v] of Object.entries(p.b || {})){
          if (!/^(serie|chrono):[1-5]:(add|sub|mul|div|mix)$/.test(k) || !(v > 0)) continue;
          const low = k.startsWith("serie");
          if (!(best[k] > 0) || (low ? v < best[k] : v > best[k])){ best[k] = Math.round(v); n++; }
        }
        for (const [k, v] of Object.entries(p.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] > 0 && daily[k] <= v)){ daily[k] = Math.round(v); n++; }
        const pa = Number(readKey("calculator.parties", 0)) || 0;
        if (p.p > pa){ writeKey("calculator.parties", Math.round(p.p)); n++; }
        if (n){ writeKey("calculator.best", best); writeKey("calculator.daily", daily); done.push(`Calculator : ${n} record${n > 1 ? "s" : ""}`); }
      }
    }}
});

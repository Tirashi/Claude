/* Le Magasinier : écrans, commandes et sauvegardes. Les règles sont dans regles.js, les niveaux dans niveaux.js,
   la scène 3D dans scene.js et le docker dans docker.js.
   Sauvegardes : magasinier.niveaux { n° : { coups, etoiles } }, magasinier.partie { n, chemin } (niveau en cours),
   magasinier.opts { croix, effets, bruit, musique }. Grille du jour : magasinier.daily { AAAAMMJJ : coups },
   magasinier.dailyRun { j, coups, chemin } (tentative classée en cours), magasinier.jour { j, plan, opt } (grille du jour gardée). */
(function () {
  const $ = id => document.getElementById(id);
  const lire = (k, d) => { try { const v = JSON.parse(localStorage.getItem("magasinier." + k)); return v == null ? d : v; } catch (e) { return d; } };
  const ecrire = (k, v) => { try { localStorage.setItem("magasinier." + k, JSON.stringify(v)); } catch (e) { /* stockage plein ou interdit */ } };
  let faits = lire("niveaux", {}), opts = Object.assign({ croix: true, effets: true, bruit: true, musique: true }, lire("opts", {}));

  const scene = MagScene.creer($("cv"), { fini: apresAnimation, son: (nom, delai) => MagSons.jouer(nom, delai) });
  scene.effets(opts.effets);

  // ---------- état de la partie ----------
  let n = 0, N = null, E = null, hist = [], chemin = "", fini = false, enAttente = [], enJeu = false;
  // grille du jour : n = -1 ; coupsJour compte tous les coups joués (annuler et recommencer ne les rendent pas)
  let jour = 0, grille = null, coupsJour = 0, classe = false;
  const auj = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  const entrepotDe = i => MAG_ENTREPOTS.findIndex(e => i >= e.debut && i < e.debut + e.n);
  const nomNiveau = i => { const e = MAG_ENTREPOTS[entrepotDe(i)]; return e.court + " " + (i - e.debut + 1); };
  const fait = i => !!faits[i];
  const entrepotOuvert = k => k === 0 || MAG_ENTREPOTS[k - 1].pret && Array.from({ length: MAG_ENTREPOTS[k - 1].n }, (_, j) => fait(MAG_ENTREPOTS[k - 1].debut + j)).filter(Boolean).length >= 8;
  const niveauOuvert = i => { const k = entrepotDe(i), e = MAG_ENTREPOTS[k]; return e.pret && entrepotOuvert(k) && (i === e.debut || fait(i) || fait(i - 1)); };
  const totalEtoiles = () => Object.values(faits).reduce((s, f) => s + f.etoiles, 0);

  function charger(i, rejouer) {
    n = i; N = magLire(MAG_NIVEAUX[i].plan); E = { d: N.depart.d, c: N.depart.c.map(k => ({ p: k.p, l: k.l })) };
    hist = []; chemin = ""; fini = false; enAttente = [];
    scene.niveau(N, E, entrepotDe(i), i + 1);
    if (rejouer) { for (const d of rejouer) { const r = magCoup(N, E, d); if (!r) break; hist.push(E); E = r.E; chemin += d; } scene.poser(E); }
    hud(); aide();
  }
  function chargerJour() {
    jour = auj(); const g = lire("jour", null);
    grille = g && g.j === jour ? g : Object.assign({ j: jour }, magGrilleDuJour(jour)); ecrire("jour", grille);
    n = -1; N = magLire(grille.plan); E = { d: N.depart.d, c: N.depart.c.map(k => ({ p: k.p, l: k.l })) };
    hist = []; chemin = ""; fini = false; enAttente = []; coupsJour = 0;
    classe = !lire("daily", {})[jour];
    scene.niveau(N, E, grille.glace ? 1 : 0, jour % 9973);
    const run = lire("dailyRun", null);
    if (classe && run && run.j === jour) { coupsJour = run.coups; for (const d of run.chemin) { const r = magCoup(N, E, d); if (!r) break; hist.push(E); E = r.E; chemin += d; } scene.poser(E); }
    hud(); aide();
  }
  function hud() { $("hNom").textContent = n < 0 ? "DU JOUR" : nomNiveau(n); $("hCoups").textContent = "COUPS " + (n < 0 ? coupsJour : chemin.length); }
  function aide() {
    const a = n < 0 ? (classe && !coupsJour ? "Grille du jour : une seule tentative classée. Chaque pas compte, même ceux qu'on annule." : null) : MAG_NIVEAUX[n].aide, b = $("bulle");
    b.hidden = !a || chemin.length > 0; if (a) b.textContent = a;
  }
  function sauverPartie() {
    if (n >= 0) ecrire("partie", fini ? null : { n, chemin });
    else if (classe) ecrire("dailyRun", fini ? null : { j: jour, coups: coupsJour, chemin });
  }

  function jouer(dir) {
    if (!enJeu || fini) return;
    if (scene.occupe()) { if (enAttente.length < 2) enAttente.push(dir); return; }   // deux gestes au plus en réserve
    const r = magCoup(N, E, dir);
    if (!r) { scene.bute(dir); return; }
    hist.push(E); E = r.E; chemin += dir; coupsJour++; scene.coup(r, dir);
    $("bulle").hidden = true;
    if (magGagne(N, E)) fini = true;
    hud(); sauverPartie();
  }
  function apresAnimation() {
    if (fini && enJeu) { enJeu = false; scene.gagne(); setTimeout(finNiveau, 1500); return; }
    if (enAttente.length) jouer(enAttente.shift());
  }
  function annuler() {
    if (!enJeu || !hist.length) return;
    E = hist.pop(); chemin = chemin.slice(0, -1); fini = false; enAttente = []; scene.poser(E); hud(); sauverPartie();
  }
  function recommencer() {
    if (!N) return;
    E = { d: N.depart.d, c: N.depart.c.map(k => ({ p: k.p, l: k.l })) }; hist = []; chemin = ""; fini = false; enAttente = [];
    scene.poser(E); hud(); aide(); sauverPartie();
  }

  // ---------- écrans ----------
  const ECRANS = ["eTitre", "eNiveaux", "ePause", "eFin"];
  function montrer(id) {
    ECRANS.forEach(e => { $(e).hidden = e !== id; });
    enJeu = !id;
    $("hud").hidden = $("cmd").hidden = id === "eTitre" || id === "eNiveaux";
    scene.calme(!!id); scene.flou(id === "eTitre" || id === "eNiveaux" ? 2.2 : 1);
    if (id) $("bulle").hidden = true; else aide();
  }
  function titre() {
    const p = lire("partie", null);
    $("bJour").textContent = lire("daily", {})[auj()] ? "GRILLE DU JOUR (FAITE)" : "GRILLE DU JOUR";
    $("bContinuer").hidden = !(p && MAG_NIVEAUX[p.n]);
    const t = totalEtoiles(); $("tEtoiles").textContent = t ? "ETOILES : " + t + " / " + 3 * MAG_NIVEAUX.length : "";
    montrer("eTitre");
  }
  let ongletActif = 0;
  function niveaux(k) {
    if (k == null) k = n < 0 ? 0 : entrepotDe(n);
    ongletActif = k; const e = MAG_ENTREPOTS[k], p = lire("partie", null);
    $("onglets").innerHTML = "";
    MAG_ENTREPOTS.forEach((x, j) => { const b = document.createElement("button"); b.className = "fenetre" + (j === k ? " actif" : ""); b.textContent = x.court;
      b.disabled = !x.pret || !entrepotOuvert(j); b.onclick = () => niveaux(j); $("onglets").appendChild(b); });
    $("nEntrepot").textContent = e.nom;
    const et = Array.from({ length: e.n }, (_, j) => faits[e.debut + j] ? faits[e.debut + j].etoiles : 0).reduce((a, b) => a + b, 0);
    $("nInfo").textContent = "ETOILES : " + et + " / " + 3 * e.n;
    $("grilleNiv").innerHTML = "";
    for (let j = 0; j < e.n; j++) { const i = e.debut + j, b = document.createElement("button"), f = faits[i];
      b.className = "fenetre" + (p && p.n === i ? " encours" : ""); b.disabled = !niveauOuvert(i);
      b.innerHTML = (j + 1) + "<small>" + (f ? "★".repeat(f.etoiles) : b.disabled ? "▪" : "") + "</small>";
      b.onclick = () => { charger(i, p && p.n === i ? p.chemin : null); montrer(null); }; $("grilleNiv").appendChild(b); }
    montrer("eNiveaux");
  }
  function finNiveau() {
    if (n < 0) return finJour();
    const opt = MAG_NIVEAUX[n].opt, coups = chemin.length, et = magEtoiles(opt, coups), avant = faits[n];
    if (!avant || coups < avant.coups) faits[n] = { coups, etoiles: Math.max(et, avant ? avant.etoiles : 0) };
    else if (et > avant.etoiles) faits[n].etoiles = et;
    ecrire("niveaux", faits); ecrire("partie", null);
    $("fEtoiles").innerHTML = "<b>★</b>".repeat(et) + "<span>★</span>".repeat(3 - et);
    $("fCoups").textContent = "COUPS : " + coups + (avant && coups < avant.coups ? "  RECORD !" : "");
    $("fObjectif").textContent = et < 3 ? "3 ETOILES EN " + Math.floor(opt * 1.1) + " COUPS AU PLUS" : "RECORD : " + faits[n].coups + " COUPS";
    const suivant = n + 1 < MAG_NIVEAUX.length && niveauOuvert(n + 1);
    $("bSuivant").hidden = !suivant; $("fRang").textContent = "";
    if ((!avant || et > avant.etoiles) && window.LudoScores) LudoScores.submit("magasinier", "etoiles", totalEtoiles(), false).then(r => { if (r) $("fRang").textContent = "ETOILES : " + LudoScores.rankText(r); });
    montrer("eFin");
  }
  function finJour() {
    const daily = lire("daily", {});
    if (classe) { daily[jour] = coupsJour; ecrire("daily", daily); ecrire("dailyRun", null); }
    $("fEtoiles").innerHTML = ""; $("fRang").textContent = "";
    $("fCoups").textContent = "COUPS : " + (classe ? coupsJour : chemin.length);
    $("fObjectif").textContent = "LE MINIMUM : " + grille.opt + " COUPS" + (classe ? "" : " (HORS CLASSEMENT)");
    if (classe && window.LudoScores) LudoScores.submit("magasinier", "daily:" + jour, coupsJour, true).then(r => { if (r) $("fRang").textContent = "GRILLE DU JOUR : " + LudoScores.rankText(r); });
    classe = false; $("bSuivant").hidden = true;
    montrer("eFin");
  }

  // ---------- commandes ----------
  document.querySelectorAll("#pad button").forEach(b => b.addEventListener("click", () => jouer(b.dataset.d)));
  $("bAnnuler").onclick = annuler; $("bRecommencer").onclick = recommencer;
  $("bPause").onclick = () => montrer("ePause");
  $("bReprendre").onclick = () => montrer(null);
  $("bRecommencerP").onclick = () => { recommencer(); montrer(null); };
  $("bNiveauxP").onclick = () => niveaux(); $("bNiveauxF").onclick = () => niveaux();
  $("bJouer").onclick = () => niveaux();
  $("bContinuer").onclick = () => { const p = lire("partie", null); charger(p.n, p.chemin); montrer(null); };
  $("bTitre").onclick = titre;
  $("bSuivant").onclick = () => { charger(n + 1); montrer(null); };
  $("bRejouer").onclick = () => { if (n < 0) chargerJour(); else charger(n); montrer(null); };
  $("bJour").onclick = () => { chargerJour(); montrer(null); };
  const majOpts = () => { $("bCroix").textContent = "CROIX : " + (opts.croix ? "OUI" : "NON"); $("bBruit").textContent = "BRUITAGES : " + (opts.bruit ? "OUI" : "NON"); $("bMusique").textContent = "MUSIQUE : " + (opts.musique ? "OUI" : "NON"); $("bEffets").textContent = "EFFETS : " + (opts.effets ? "COMPLETS" : "LEGERS");
    $("cmd").classList.toggle("sansCroix", !opts.croix); ecrire("opts", opts); };
  $("bCroix").onclick = () => { opts.croix = !opts.croix; majOpts(); };
  $("bBruit").onclick = () => { opts.bruit = !opts.bruit; MagSons.bruitages(opts.bruit); majOpts(); };
  $("bMusique").onclick = () => { opts.musique = !opts.musique; MagSons.musique(opts.musique); majOpts(); };
  MagSons.bruitages(opts.bruit); MagSons.musique(opts.musique);
  document.addEventListener("click", e => { if (e.target.closest(".ecranMenu button")) MagSons.jouer("bip"); });
  $("bEffets").onclick = () => { opts.effets = !opts.effets; scene.effets(opts.effets); majOpts(); };
  majOpts();
  // glisser le doigt sur l'écran
  let dep = null;
  $("ecran").addEventListener("pointerdown", e => { dep = { x: e.clientX, y: e.clientY }; });
  $("ecran").addEventListener("pointerup", e => {
    if (!dep) return; const sx = e.clientX - dep.x, sy = e.clientY - dep.y; dep = null;
    if (Math.hypot(sx, sy) < 18) return;
    jouer(Math.abs(sx) > Math.abs(sy) ? (sx > 0 ? "D" : "G") : (sy > 0 ? "B" : "H"));
  });
  addEventListener("keydown", e => {
    const d = { ArrowUp: "H", ArrowDown: "B", ArrowLeft: "G", ArrowRight: "D" }[e.key];
    if (d) { e.preventDefault(); jouer(d); }
    else if (e.key === "z" || e.key === "Z" || e.key === "Backspace") annuler();
    else if ((e.key === "r" || e.key === "R") && enJeu) recommencer();
    else if (e.key === "Escape") { if (enJeu) montrer("ePause"); else if (!$("ePause").hidden) montrer(null); }
  });
  // l'appli passe en arrière-plan : pause
  document.addEventListener("visibilitychange", () => { if (document.hidden && enJeu) montrer("ePause"); });

  // ---------- démarrage : le titre devant le premier niveau pas encore fini ----------
  let premier = 0; while (premier < MAG_NIVEAUX.length - 1 && fait(premier) && niveauOuvert(premier + 1)) premier++;
  if (location.hash === "#jour") { chargerJour(); montrer(null); } else { charger(premier); titre(); }

  // pour les tests
  // jouer une suite de coups sans attendre les animations
  function jouerVite(s) {
    for (const d of s) { if (fini) break; const r = magCoup(N, E, d); if (!r) continue; hist.push(E); E = r.E; chemin += d; coupsJour++; if (magGagne(N, E)) fini = true; }
    scene.poser(E); hud(); sauverPartie(); if (fini && enJeu) { enJeu = false; finNiveau(); }
  }
  window.Magasinier = { charger: i => { charger(i); montrer(null); }, jour: () => { chargerJour(); montrer(null); }, jouer: jouerVite, annuler, recommencer,
    etat: () => ({ n, E, chemin, fini, coupsJour, classe, grille }), N: () => N, montrer, grilleDuJour: magGrilleDuJour };
})();

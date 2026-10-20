/* Capitaine du port : écrans, commandes, boucle et sauvegardes. Les règles sont dans regles.js, les bassins dans
   niveaux.js, le dessin dans decor.js, les sons dans sons.js.
   La scène (pixel art) se dessine dans une toile de 216 px de large, agrandie sans lissage ; les textes sont écrits
   ensuite sur la toile affichée, pour rester nets (Press Start 2P pour les titres, Rajdhani 700 pour le reste).
   Sauvegardes : capitaine.niveaux { n° : { coups, etoiles } }, capitaine.partie { n, v, coups } (bassin en cours),
   capitaine.opts { bruit, musique }, capitaine.tuto { port : vu }. Bassin du jour : capitaine.jour { j, plan, sortie, opt }
   (gardé pour la journée), capitaine.daily { AAAAMMJJ : coups }, capitaine.dailyRun { j, v, coups } (tentative classée en cours :
   tous les coups comptent, même ceux qu'on annule ou d'avant un recommencement). */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const lire = (k, d) => { try { const v = JSON.parse(localStorage.getItem("capitaine." + k)); return v == null ? d : v; } catch (e) { return d; } };
  const ecrire = (k, v) => { try { localStorage.setItem("capitaine." + k, JSON.stringify(v)); } catch (e) { /* stockage plein ou interdit */ } };
  const D = window.CapDecor, VW = D.VW, OUT = D.OUT;
  const cv = $("cv"), gt = cv.getContext("2d");
  let VH = 384, buf = null, g = null;
  let faits = lire("niveaux", {}), opts = Object.assign({ bruit: true, musique: true }, lire("opts", {}));
  CapSons.bruitages(opts.bruit);

  // ---------- état de la partie ----------
  // n : numéro du bassin, ou -1 pour le bassin du jour ; coups : coups du chemin actuel (pour les étoiles) ;
  // coupsJour : au bassin du jour classé, tous les coups joués
  let n = 0, niv = null, N = null, v = null, hist = [], coups = 0, prise = null, gagne = 0, appui = null, enJeu = false;
  let jour = 0, classe = false, coupsJour = 0;
  let G = null, fondImg = null, spr = null;
  const auj = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  const portDe = i => (i < 0 ? 1 : CAP_PORTS.findIndex(p => p.n && i >= p.debut && i < p.debut + p.n));
  const nomBassin = i => { if (i < 0) return "DU JOUR"; const p = CAP_PORTS[portDe(i)]; return p.court + " " + (i - p.debut + 1); };
  const fait = i => !!faits[i];
  const finisDans = k => Array.from({ length: CAP_PORTS[k].n }, (_, j) => fait(CAP_PORTS[k].debut + j)).filter(Boolean).length;
  const portOuvert = k => CAP_PORTS[k].pret && (k === 0 || finisDans(k - 1) >= 8);
  const bassinOuvert = i => { const k = portDe(i), p = CAP_PORTS[k]; return k >= 0 && portOuvert(k) && (i === p.debut || fait(i) || fait(i - 1)); };
  const totalEtoiles = () => Object.values(faits).reduce((s, f) => s + f.etoiles, 0);
  const affiches = () => (n < 0 && classe ? coupsJour : coups);

  function preparerDecor() {
    G = D.geo(N.w, N.sortie, VH);
    fondImg = D.fond(G, portDe(n), N);
    spr = D.sprites(N, portDe(n), G.CS);
  }
  function poser(nv) { niv = nv; N = capLire(niv); v = capDepart(N); hist = []; coups = 0; prise = null; gagne = 0; preparerDecor(); }
  function charger(i) { n = i; poser(CAP_NIVEAUX[i]); sauverPartie(); aide(); }
  function bassinDuJour() {
    jour = auj();
    let b = lire("jour", null);
    if (!b || b.j !== jour) { b = Object.assign({ j: jour }, capBassinDuJour(jour)); ecrire("jour", b); }
    n = -1; poser(b); coupsJour = 0;
    classe = !lire("daily", {})[jour];
    const run = lire("dailyRun", null);
    if (classe && run && run.j === jour && Array.isArray(run.v) && run.v.length === v.length) { v = run.v.slice(); coupsJour = run.coups || 0; }
    aide();
  }
  function sauverPartie() {
    if (n < 0) { if (classe) ecrire("dailyRun", gagne ? null : { j: jour, v, coups: coupsJour }); return; }
    ecrire("partie", gagne || !coups ? null : { n, v, coups });
  }
  function jouer(b, p) {
    const r = capCoup(N, v, b, p); if (!r) return false;
    hist.push([b, v[b]]); v = r; coups++; coupsJour++;
    if (capGagne(N, v)) finir(); else { CapSons.jouer("cale"); sauverPartie(); }
    return true;
  }
  function annuler() {
    if (gagne || !hist.length) return;
    const [b, p] = hist.pop(); v = v.slice(); v[b] = p; coups--; CapSons.jouer("cale"); sauverPartie();
  }
  function recommencer() {
    if (n >= 0) { charger(n); return; }
    // au bassin du jour, recommencer ne rend pas les coups
    const c = coupsJour; poser(niv); coupsJour = c; sauverPartie();
  }
  function finir() {
    gagne = performance.now();
    CapSons.jouer("corne");
    let et = 0;
    $("fRang").textContent = "";
    if (n >= 0) {
      const L = CAP_NIVEAUX[n], avant = faits[n];
      et = capEtoiles(coups, L.opt);
      if (!avant || coups < avant.coups || et > avant.etoiles) faits[n] = { coups: Math.min(coups, avant ? avant.coups : coups), etoiles: Math.max(et, avant ? avant.etoiles : 0) };
      ecrire("niveaux", faits); ecrire("partie", null);
      if ((!avant || et > avant.etoiles) && window.LudoScores) LudoScores.submit("capitaine", "etoiles", totalEtoiles(), false).then(r => { if (r) $("fRang").textContent = "Étoiles : " + LudoScores.rankText(r); });
    } else {
      et = capEtoiles(coups, niv.opt);
      if (classe) {
        const daily = lire("daily", {}); daily[jour] = coupsJour; ecrire("daily", daily); ecrire("dailyRun", null);
        if (window.LudoScores) LudoScores.submit("capitaine", "daily:" + jour, coupsJour, true).then(r => { if (r) $("fRang").textContent = "Bassin du jour : " + LudoScores.rankText(r); });
      }
    }
    const score = n < 0 && classe ? coupsJour : coups, etaitClasse = n < 0 && classe;
    if (n < 0) classe = false;
    setTimeout(() => {
      if (!enJeu) return;
      CapSons.jouer("victoire");
      $("fEtoiles").innerHTML = "<b>★</b>".repeat(et) + "★".repeat(3 - et);
      $("fCoups").textContent = score + (score > 1 ? " coups" : " coup") + (etaitClasse ? " (classé)" : n < 0 ? " (hors classement)" : "");
      const opt = n < 0 ? niv.opt : CAP_NIVEAUX[n].opt;
      $("fObjectif").textContent = n < 0 ? "Le minimum : " + opt + " coups" : et === 3 ? "Bravo, capitaine !" : "3 étoiles en " + capSeuil3(opt) + " coups ou moins";
      $("bSuivant").hidden = !(n >= 0 && n + 1 < CAP_NIVEAUX.length && bassinOuvert(n + 1));
      montrer("eFin");
    }, 1700);
  }
  function aide() {
    const b = $("bulle"), k = portDe(n), vus = lire("tuto", {});
    let txt = "";
    if (n < 0) txt = classe && !coupsJour ? "Bassin du jour : une seule tentative classée. Chaque coup compte, même ceux qu'on annule." : "";
    else if (n === 0) txt = "Glisse les bateaux dans leur longueur pour ouvrir la passe au navire doré.";
    else if (n === 1) txt = "Un coup, c'est un bateau déplacé, aussi loin qu'on veut.";
    else if (n === 2) txt = "Peu de coups = 3 étoiles. ↶ annule le dernier coup.";
    else if (n === CAP_PORTS[k].debut && !vus[k]) {
      txt = ["", "", "À la marina, les bouées, les pieux et les épaves ne bougent jamais.", "Au chantier naval, les grands navires prennent 4 cases.", "Le grand port : 7 × 7, tout est mélangé. Bonne chance, capitaine !"][k] || "";
      vus[k] = true; ecrire("tuto", vus);
    }
    b.textContent = txt; b.hidden = !txt;
  }

  // ---------- écrans ----------
  function montrer(id) {
    for (const e of ["eTitre", "eNiveaux", "ePause", "eFin"]) $(e).hidden = e !== id;
    enJeu = !id;
    $("bulle").style.visibility = id ? "hidden" : "";
    if (id) CapSons.moteur(false);
  }
  function titre() {
    const p = lire("partie", null);
    $("bContinuer").hidden = !(p && CAP_NIVEAUX[p.n]);
    const t = totalEtoiles();
    $("tEtoiles").textContent = t ? `${t} étoiles sur ${CAP_NIVEAUX.length * 3}` : "";
    $("bJour").textContent = lire("daily", {})[auj()] ? "BASSIN DU JOUR ✓" : "BASSIN DU JOUR";
    montrer("eTitre");
  }
  let portVu = 0;
  function niveaux(k) {
    portVu = k == null ? Math.max(0, n < 0 ? 0 : portDe(n)) : k;
    const o = $("onglets"); o.innerHTML = "";
    CAP_PORTS.forEach((p, i) => {
      const b = document.createElement("button"); b.className = "plaque" + (i === portVu ? " actif" : "");
      b.textContent = p.court; b.disabled = !portOuvert(i); b.onclick = () => { CapSons.jouer("bip"); niveaux(i); }; o.appendChild(b);
    });
    const p = CAP_PORTS[portVu];
    $("nPort").textContent = p.nom;
    const et = Array.from({ length: p.n }, (_, j) => (faits[p.debut + j] || { etoiles: 0 }).etoiles).reduce((a, b) => a + b, 0);
    $("nInfo").textContent = `${et} étoiles sur ${p.n * 3}` + (portVu + 1 < CAP_PORTS.length ? " · 8 bassins finis ouvrent le port suivant" : "");
    const gr = $("grilleNiv"); gr.innerHTML = "";
    for (let j = 0; j < p.n; j++) {
      const i = p.debut + j, b = document.createElement("button"), f = faits[i];
      b.className = "plaque"; b.disabled = !bassinOuvert(i);
      b.innerHTML = `${j + 1}<small>${f ? "★".repeat(f.etoiles) : ""}</small>`;
      b.onclick = () => { CapSons.jouer("bip"); charger(i); montrer(null); };
      gr.appendChild(b);
    }
    montrer("eNiveaux");
  }
  function majReglages() {
    for (const id of ["bBruit", "bBruitT"]) $(id).textContent = "BRUITAGES : " + (opts.bruit ? "OUI" : "NON");
    for (const id of ["bMusique", "bMusiqueT"]) $(id).textContent = "MUSIQUE : " + (opts.musique ? "OUI" : "NON");
  }
  function basculer(k) {
    opts[k] = !opts[k]; ecrire("opts", opts); majReglages();
    if (k === "bruit") CapSons.bruitages(opts.bruit); else CapSons.musique(opts.musique);
    CapSons.jouer("bip");
  }
  const clic = (id, f) => { $(id).onclick = () => { CapSons.jouer("bip"); f(); }; };
  clic("bJouer", () => niveaux());
  clic("bJour", () => {
    // le premier tirage du jour prend une ou deux secondes sur le téléphone : on le dit avant de calculer
    if (!(lire("jour", null) || {}).j || lire("jour", null).j !== auj()) $("bJour").textContent = "PREPARATION...";
    setTimeout(() => { bassinDuJour(); montrer(null); }, 30);
  });
  clic("bContinuer", () => { const p = lire("partie", null); if (p) { reprendrePartie(p); montrer(null); } });
  clic("bTitre", titre);
  clic("bReprendre", () => montrer(null));
  clic("bRejouerP", () => { recommencer(); montrer(null); });
  clic("bNiveauxP", () => niveaux());
  clic("bRejouer", () => { if (n < 0) bassinDuJour(); else recommencer(); montrer(null); });
  clic("bNiveauxF", () => niveaux());
  clic("bSuivant", () => { charger(n + 1); montrer(null); });
  for (const id of ["bBruit", "bBruitT"]) $(id).onclick = () => basculer("bruit");
  for (const id of ["bMusique", "bMusiqueT"]) $(id).onclick = () => basculer("musique");
  function reprendrePartie(p) {
    charger(p.n);
    if (Array.isArray(p.v) && p.v.length === v.length) { v = p.v.slice(); coups = p.coups || 0; }
  }

  // ---------- commandes ----------
  const BOUTONS = () => [{ x: 6, y: VH - 40, w: 62, h: 34, a: "annuler" }, { x: 74, y: VH - 40, w: 62, h: 34, a: "rejouer" }, { x: 182, y: 6, w: 30, h: 28, a: "pause" }];
  const pos = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * VW, (e.clientY - b.top) / b.height * VH]; };
  cv.addEventListener("pointerdown", e => {
    if (!enJeu) return;
    const [mx, my] = pos(e);
    for (const b of BOUTONS()) if (mx >= b.x && mx < b.x + b.w && my >= b.y && my < b.y + b.h) {
      appui = { a: b.a, t: performance.now() }; CapSons.jouer("bip");
      if (b.a === "annuler") annuler(); else if (b.a === "rejouer") { if (!gagne) recommencer(); } else montrer("ePause");
      return;
    }
    if (gagne) return;
    const c = Math.floor((mx - G.GX) / G.CS), r = Math.floor((my - G.GY) / G.CS);
    if (c < 0 || r < 0 || c >= N.w || r >= N.w) return;
    const i = capOccupation(N, v)[r * N.w + c]; if (i < 0) return;
    const b = N.bateaux[i], [a, z] = capLimites(N, v, i);
    prise = { i, d: b.h ? mx : my, v0: v[i], a, z, f: v[i], bute: true };
    $("bulle").hidden = true;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", e => {
    if (!prise) return;
    const b = N.bateaux[prise.i], [mx, my] = pos(e), voulu = prise.v0 + ((b.h ? mx : my) - prise.d) / G.CS;
    prise.f = Math.max(prise.a, Math.min(prise.z, voulu));
    // le moteur tourne dès que le bateau bouge ; un « toc » quand il arrive contre un obstacle
    if (Math.abs(prise.f - prise.v0) > .04) CapSons.moteur(true);
    const contre = voulu < prise.a - .02 || voulu > prise.z + .02;
    if (contre && !prise.bute && prise.a !== prise.z) CapSons.jouer("toc");
    prise.bute = contre;
  });
  const lacher = () => {
    if (!prise) return;
    const q = prise; prise = null;
    CapSons.moteur(false);
    const p = Math.round(q.f);
    if (p !== q.v0) jouer(q.i, p);
  };
  cv.addEventListener("pointerup", lacher); cv.addEventListener("pointercancel", lacher);
  addEventListener("keydown", e => {
    if (!enJeu) { if (e.key === "Escape" && !$("ePause").hidden) montrer(null); return; }
    if (e.key === "z" || e.key === "Z" || e.key === "Backspace") { annuler(); e.preventDefault(); }
    else if (e.key === "r" || e.key === "R") { if (!gagne) recommencer(); }
    else if (e.key === "Escape") montrer("ePause");
  });

  // ---------- taille de l'écran ----------
  function taille() {
    const box = $("jeu").getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
    const W = box.width, H = box.height;
    let cw, ch;
    if (H / W >= 384 / VW) { cw = W; ch = H; VH = Math.round(VW * H / W); } else { ch = H; cw = H * VW / 384; VH = 384; }
    cv.style.width = cw + "px"; cv.style.height = ch + "px";
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    [buf, g] = D.mk(VW, VH);
    $("bulle").style.top = `calc(50% - ${ch / 2}px + ${(46 / VH) * ch}px)`;
    if (N) preparerDecor();
  }
  addEventListener("resize", taille);

  // ---------- dessin ----------
  function textes(t, s, x, y, z, col, align, logo) {
    t.textAlign = align || "left"; t.textBaseline = "top";
    if (logo) {
      t.font = `${z}px "Press Start 2P", monospace`; t.lineJoin = "round";
      t.fillStyle = OUT; t.fillText(s, x + 1.5, y + 2);
      t.lineWidth = Math.max(2, z / 4); t.strokeStyle = OUT; t.strokeText(s, x, y);
      const gr = t.createLinearGradient(0, y, 0, y + z); gr.addColorStop(0, "#fff6c2"); gr.addColorStop(.5, "#ffd23f"); gr.addColorStop(1, "#e0782a");
      t.fillStyle = gr; t.fillText(s, x, y);
    } else {
      t.font = `700 ${z}px Rajdhani, sans-serif`;
      t.fillStyle = OUT; t.fillText(s, x + .7, y + .7);
      t.fillStyle = col; t.fillText(s, x, y);
    }
  }
  const ICON = (() => {
    const icone = map => { const [c, gg] = D.mk(map[0].length + 2, map.length + 2);
      for (let j = 0; j < map.length; j++) for (let i = 0; i < map[0].length; i++) if (map[j][i] === "x") D.R(gg, i, j, 3, 3, OUT);
      for (let j = 0; j < map.length; j++) for (let i = 0; i < map[0].length; i++) if (map[j][i] === "x") D.R(gg, i + 1, j + 1, 1, 1, j < map.length / 2 ? "#ffffff" : "#d8e8f8");
      return c; };
    return {
      annuler: icone(["...x........", "..xx........", ".xxxxxxxx...", "xxxxxxxxxx..", ".xxx.....xx.", "..xx......xx", "...x......xx", "..........xx", ".........xx.", "...xxxxxxx.."]),
      rejouer: icone(["....xxxx....", "..xxxxxxx.x.", ".xx.....xxx.", ".x.....xxxx.", "xx..........", "xx..........", "xx........xx", "xx........xx", ".x.......xx.", ".xx.....xx..", "..xxxxxxx...", "....xxx....."]),
      pause: icone(["xxx..xxx", "xxx..xxx", "xxx..xxx", "xxx..xxx", "xxx..xxx", "xxx..xxx", "xxx..xxx", "xxx..xxx"]),
    };
  })();
  const ETOILE = (() => {
    const star = fill => { const [c, gg] = D.mk(15, 15);
      const ins = (x, y) => { const dx = x - 7, dy = y - 7.6, rr = Math.hypot(dx, dy), th = Math.atan2(dx, -dy); return rr < 3 + 4.4 * Math.pow(Math.abs(Math.cos(th * 2.5)), 3); };
      for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) { const i = ins(x + .5, y + .5); if (!i && (ins(x - .5, y + .5) || ins(x + 1.5, y + .5) || ins(x + .5, y - .5) || ins(x + .5, y + 1.5))) D.R(gg, x, y, 1, 1, OUT); }
      for (let y = 0; y < 15; y++) for (let x = 0; x < 15; x++) if (ins(x + .5, y + .5)) D.R(gg, x, y, 1, 1, fill ? (x + y < 12 ? "#fff6c2" : x + y < 17 ? "#ffd23f" : "#e0a020") : (x + y < 14 ? "#3a4060" : "#262a44"));
      return c; };
    return [star(false), star(true)];
  })();

  function image(now) {
    const lt = now / 1000, CS = G.CS;
    const sortie = gagne ? Math.min(1, (now - gagne) / 1600) : 0;
    const bat = N.bateaux.map((b, i) => {
      const s = spr[i], p = prise && prise.i === i ? prise.f : v[i];
      const c = b.h ? p : b.x, r = b.h ? b.y : p, w = b.h ? b.n * CS : CS, h = b.h ? CS : b.n * CS;
      const x = Math.round(G.GX + c * CS + w / 2 - s.img.width / 2);
      let y = Math.round(G.GY + r * CS + h / 2 - s.img.height / 2);
      if (i === 0) y -= Math.round(sortie * sortie * 140);
      return [s, x, y, !!(prise && prise.i === i)];
    });
    let tug = null;
    if (prise && Math.abs(prise.f - prise.v0) > .04) { const [s, x, y] = bat[prise.i]; tug = D.placeRemorqueur(Math.sign(prise.f - prise.v0), N.bateaux[prise.i].h, x, y, s.img, CS); }
    D.scene(g, G, portDe(n), fondImg, bat, tug, lt);
    // l'interface (plaques et icônes en pixels)
    const B = BOUTONS(), pr = appui && now - appui.t < 160 ? appui.a : null;
    D.plate(g, 4, 6, 126, 32);
    for (const b of B) {
      D.plate(g, b.x, b.y, b.w, b.h);
      if (pr === b.a) D.R(g, b.x + 2, b.y + 2, b.w - 4, b.h - 4, "rgba(255,210,63,.25)");
      const ic = ICON[b.a]; g.drawImage(ic, b.x + b.w / 2 - (ic.width >> 1), b.a === "pause" ? b.y + b.h / 2 - (ic.height >> 1) : b.y + 4);
    }
    const opt = n < 0 ? niv.opt : CAP_NIVEAUX[n].opt, et = gagne ? capEtoiles(coups, opt) : 0;
    D.plate(g, 142, VH - 40, 70, 34);
    for (let k = 0; k < 3; k++) g.drawImage(ETOILE[k < et ? 1 : 0], 147 + k * 21, VH - 24);
    if (gagne && now - gagne > 900) D.plate(g, 22, G.GY + 60, 172, 52);
    // la toile affichée : le pixel art agrandi, puis les textes
    gt.setTransform(1, 0, 0, 1, 0, 0); gt.imageSmoothingEnabled = false;
    gt.drawImage(buf, 0, 0, cv.width, cv.height);
    gt.setTransform(cv.width / VW, 0, 0, cv.height / VH, 0, 0);
    textes(gt, nomBassin(n), 11, 11, 9, "", "left", true);
    textes(gt, n < 0 ? (classe ? "Tentative classée" : "Hors classement") + " · min. " + opt : "3 étoiles : " + capSeuil3(opt) + " coups", 11, 24, 11, "#a8d0f4");
    textes(gt, "ANNULER", 37, VH - 21, 12, "#ffffff", "center");
    textes(gt, "REJOUER", 105, VH - 21, 12, "#ffffff", "center");
    textes(gt, "COUPS " + affiches(), 177, VH - 38, 12, "#ffffff", "center");
    if (gagne && now - gagne > 900) {
      textes(gt, "A QUAI !", VW / 2, G.GY + 70, 16, "", "center", true);
      const sc = affiches();
      textes(gt, sc + (sc > 1 ? " coups" : " coup"), VW / 2, G.GY + 92, 14, "#ffffff", "center");
    }
  }
  function boucle(t) {
    if (!document.hidden && N) image(t);
    requestAnimationFrame(boucle);
  }

  // ---------- démarrage ----------
  D.prepare();
  taille();
  majReglages();
  CapSons.musique(opts.musique);
  const p0 = lire("partie", null);
  if (p0 && CAP_NIVEAUX[p0.n]) reprendrePartie(p0); else charger(0);
  if (location.hash === "#jour") { bassinDuJour(); montrer(null); } else titre();
  Promise.all(['8px "Press Start 2P"', '700 10px Rajdhani'].map(f => document.fonts ? document.fonts.load(f).catch(() => {}) : null))
    .then(() => requestAnimationFrame(boucle));

  // pour les tests
  window.Capitaine = {
    etat: () => ({ n, v: v.slice(), coups, coupsJour, classe, gagne: !!gagne, enJeu }),
    charger: i => { charger(i); montrer(null); },
    jour: () => { bassinDuJour(); montrer(null); },
    jouer: liste => { for (const [b, p] of liste) if (!jouer(b, p)) return false; return true; },
    annuler, recommencer, bassin: () => N, niveau: () => niv, bassinDuJour: capBassinDuJour,
  };
})();

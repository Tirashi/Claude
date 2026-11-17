/* Politique : l'écran (session 1 du 17/11, d'après la maquette 4 validée). Branché sur le moteur :
   tout ce que le joueur peut faire vient de Tour.actionsDisponibles ; un ordre est appliqué tout de suite sur un aperçu
   (copie de l'état du début du tour) pour en montrer l'effet, puis « Tour suivant » rejoue les ordres avec tourSuivant.
   Partie sauvée dans localStorage (politique-partie). */
(function(){
"use strict";
const P = window.Politique, C = window.PolCarte;
const { Tour, Etat, Batiments, Lois, Factions, Diplomatie, Objectifs, Economie } = P;
const BAT = P.BATIMENTS, LOIS = P.LOIS.LOIS, CAT = P.LOIS.CATEGORIES, FAC = P.FACTIONS.FACTIONS, DIPLO = P.DIPLOMATIE;
const OBJ = P.OBJECTIFS.OBJECTIFS, CARTES = P.EVENEMENTS.CARTES, INST = P.INSTITUTIONS, TERR = P.TERRAINS, PAYS = P.PAYS;
const ROUGE = C.ROUGE, ENC = "rgb(58,42,28)", CLE = "politique-partie";
const FCOUL = { ouvriers: "#B23A2E", paysans: "#C98A1B", artisans: "#3E8E7E", patrons: "#2F5D9E", conservateurs: "#5B3B6E" };
const STATUT = { calme: "calme", grondement: "gronde", greve: "en grève", revolte: "en révolte", revolution: "révolution" };
const BIENS = { grain: "grain", fer: "fer", outils: "outils", tissu: "tissu", bois: "bois", charbon: "charbon", vin: "vin" };

// ======================= la partie =======================
let base = null, ordres = [], apercu = null, rPrev = null;
function recalcule(){ apercu = Etat.copie(base); apercu.journal = []; rPrev = { s: base.alea };
  for (const a of ordres) Tour.appliquerAction(apercu, a, rPrev); }
function faire(a, message){
  try { Tour.appliquerAction(apercu, a, rPrev); ordres.push(a); sauve(); maj(); if (message) toast(message); return true; }
  catch (err){ toast("Impossible : " + err.message.replace("action refusée : ", "")); return false; } }
function annulerDernier(){ if (!ordres.length) return; ordres.pop(); recalcule(); sauve(); maj(); }
const dispo = () => Tour.actionsDisponibles(apercu);
function sauve(){ try { localStorage.setItem(CLE, JSON.stringify({ base, ordres })); } catch (e){ /* navigation privée */ } }
function charge(){ try { const s = JSON.parse(localStorage.getItem(CLE)); if (s && s.base && s.base.version === Etat.VERSION) return s; } catch (e){ /* rien */ } return null; }
function nouvellePartie(pays){ base = Etat.creerEtat(P.SCENARIO_CHAMPS, (Date.now() % 2147483647) | 0, pays); ordres = []; recalcule(); sauve(); fermeModale(); change("monde"); maj(); demandeAmbition(); }
function finTour(){
  if (base.tour === 1 && !apercu.ambition){ demandeAmbition(); return; }
  const avant = base;
  try { base = Tour.tourSuivant(base, ordres); } catch (err){ toast("Erreur : " + err.message); return; }
  ordres = []; recalcule(); sauve();
  // ce qui a bougé : chantiers finis (fumée), puis le rapport du tour
  for (const r of C.RIDS){ const n0 = nb(avant, r), n1 = nb(base, r); if (n1 > n0 && carte === "pays") fumees.push({ r, t: performance.now() }); }
  maj(); rapport(avant);
}
const nb = (e, r) => Object.values(e.regions[r].batiments).reduce((a, b) => a + b, 0);

// ======================= textes =======================
const nomNation = n => (base.profils[n] || {}).nom || n;
const signe = v => (v > 0 ? "+" : "") + Math.round(v);
const humain = s => String(s).replace(/_/g, " ");
const texteLoi = id => { const t = LOIS[id].texte || ""; return Array.isArray(t) ? t.join(" ") : t; };
function offre(id){ return apercu.offres[id] || base.offres[id]; }
function libelle(a){
  const t = a.type;
  if (t === "loi") return `Proposer « ${LOIS[a.id].nom} »`;
  if (t === "abandonner") return "Abandonner le débat en cours";
  if (t === "impots") return `Impôts : ${a.id}`;
  if (t === "agrandir") return `Agrandir : ${BAT[a.id].nom} (${apercu.regions[a.region].nom})`;
  if (t === "projet") return `Projet commun : ${BAT[a.id].nom} avec ${nomNation(a.avec)}`;
  if (t === "defricher") return `Défricher (${Batiments.coutDefricher(apercu, a.region)} or)`;
  if (t === "institution") return `${INST.INSTITUTIONS[a.id].nom} : niveau ${a.niveau}`;
  if (t === "apaiser") return `Apaiser (${Factions.coutApaisement ? Factions.coutApaisement(apercu, a.id) : "?"} or)`;
  if (t === "reprimer") return "Réprimer";
  if (t === "don") return `Don de ${a.montant} or`;
  if (t === "contrat"){ const o = offre(a.id); return o ? `${o.sens === "achat" ? "Acheter" : "Vendre"} ${o.volume} ${BIENS[o.bien] || o.bien} · ${o.prix} or l'unité · ${o.duree} tours` : "Contrat"; }
  if (t === "traite") return `Signer : ${(DIPLO.traites[a.id] || {}).nom || humain(a.id)}`;
  if (t === "rompre") return `Rompre : ${(DIPLO.traites[a.id] || {}).nom || humain(a.id)}`;
  if (t === "embargo") return "Embargo";
  if (t === "lever_embargo") return "Lever l'embargo";
  if (t === "diplomate") return `Envoyer le diplomate (${DIPLO.diplomate.cout} or)`;
  if (t === "rappeler_diplomate") return "Rappeler le diplomate";
  if (t === "exiger") return `Exiger : ${humain(a.exigence)}`;
  if (t === "caravane") return `Acheter une caravane (${DIPLO.transport.coutCaravane} or)`;
  if (t === "route") return `Améliorer la route (${DIPLO.transport.coutRoute} or)`;
  if (t === "investir") return `Investir : ${BAT[a.id].nom} (${humain(a.region)})`;
  if (t === "recruter") return `Recruter un régiment (${apercu.regions[a.region].nom})`;
  if (t === "declarer_guerre") return "Déclarer la guerre";
  if (t === "bataille") return `Attaquer : ${humain(a.cible)}`;
  if (t === "paix_blanche") return "Proposer la paix blanche";
  if (t === "imposer_paix") return "Imposer la paix" + ["reparations", "lever_embargo", "non_rearmement", "cession"].filter(k => a[k]).map(k => " · " + humain(k)).join("");
  return humain(t);
}

// ======================= carte : rendus, sprites =======================
const tel = document.getElementById("tel"), cv = document.getElementById("c"), g = cv.getContext("2d");
let carte = "monde", vueRegistre = false, cam = { x: C.W / 2, y: C.H / 2, z: 10 }, choix = null, aConstruire = null;
const R = {}, S = {}, ZONES = [], fumees = [];
const PX = { monde: 28, pays: 60 };
function prepare(){
  R.monde = C.rendu(C.MONDE_B, PX.monde, false, false); R.pays = C.rendu(C.PAYS_B, PX.pays, false, true);
  S.charrette = C.charrette(120, false);
  for (const b in BAT) S[b] = C.picto(b === "fort" ? "caserne" : b === "entente_mill" ? "weaving" : b, 96, false);
  S.ville = C.tampon("open-city", 120); S.village = C.tampon("village", 100); S.maison = C.tampon("home", 60); S.capitale = C.tampon("open-city", 160);
  for (const b in BAT) BAT[b].url = S[b].toDataURL(); }
function dimensionne(){ const r = tel.getBoundingClientRect(), d = window.devicePixelRatio || 1; cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
function vue(){ const r = cv.getBoundingClientRect(); return { w: r.width, h: r.height }; }
const ecran = (x, y) => { const v = vue(); return [(x - cam.x) * cam.z + v.w / 2, (y - cam.y) * cam.z + v.h / 2]; };

// les places d'une région : bâtiments, chantiers, places libres, terrain à défricher
function places(e, r){
  const R0 = e.regions[r], l = [];
  for (const id in BAT) if (BAT[id].emplacement !== false) for (let k = 0; k < (R0.batiments[id] || 0); k++) l.push({ id, niveau: (Batiments.niveaux ? Batiments.niveaux(e, r, id) : 0) });
  for (const c of e.chantiers) if (c.region === r && !c.agrandir && !c.defricher && BAT[c.id] && BAT[c.id].emplacement !== false) l.push({ id: c.id, chantier: c.restant });
  const libres = Math.max(0, R0.emplacements - Batiments.occupes(e, r));
  for (let k = 0; k < libres; k++) l.push({ libre: true });
  const def = e.chantiers.find(c => c.region === r && c.defricher);
  if (def) l.push({ defrichage: def.restant });
  const reste = (INST.DEFRICHEMENT.couts.length - (R0.defriche || 0)) - (def ? 1 : 0);
  for (let k = 0; k < reste; k++) l.push({ friche: true });
  return l.slice(0, 8); }

function frame(){
  const d = window.devicePixelRatio || 1, v = vue();
  g.setTransform(d, 0, 0, d, 0, 0); g.imageSmoothingEnabled = true; g.fillStyle = "#3b2c1f"; g.fillRect(0, 0, v.w, v.h);
  if (!apercu){ requestAnimationFrame(frame); return; }
  if (carte === "pays" && vueRegistre){ registre(v); requestAnimationFrame(frame); return; }
  const Rm = R[carte], [ax, ay] = ecran(Rm.B.x0, Rm.B.y0), lw = (Rm.B.x1 - Rm.B.x0) * cam.z, lh = (Rm.B.y1 - Rm.B.y0) * cam.z;
  g.drawImage(Rm.c, Math.round(ax), Math.round(ay), Math.round(lw), Math.round(lh));
  const sprite = (img, x, y, taille, bas, a, miroir) => { const k = taille * cam.z / Math.max(img.width, img.height), w = img.width * k, h = img.height * k, [X, Y] = ecran(x, y);
    g.save(); if (a != null) g.globalAlpha = a; g.translate(Math.round(X), Math.round(Y)); if (miroir) g.scale(-1, 1); g.drawImage(img, Math.round(-w / 2), Math.round(bas ? -h : -h / 2), Math.round(w), Math.round(h)); g.restore(); };
  const taille = Math.max(0, Math.min(8, Math.round((apercu.familles - 60) / 12)));   // la capitale grandit avec la population
  if (carte === "monde"){ for (const id of C.IDS){ const G = C.GEO[id], [x, y] = G.graine; papierRond(x, y - .35, .85); sprite(G.grande ? S.ville : S.village, x, y + .25, G.grande ? 1.25 : .95, true); } }
  else {
    const [x, y] = C.CAP; papierRond(x, y - .5, .9); sprite(S.capitale, x, y + .3, 1.7, true);
    MAISONS.slice(0, taille).forEach(([dx, dy]) => sprite(S.maison, x + dx, y + dy, .42, true)); fumee(...ecran(x + .3, y - 1.2), 1, 9);
    C.RIDS.forEach((r, k) => { const [cx, cy] = C.CENTRES[r], mx = (C.CAP[0] + cx) / 2 + .6, my = (C.CAP[1] + cy) / 2 - .4;
      let t = (performance.now() / 9000 + k * .27) % 2; if (t > 1) t = 2 - t;
      passant(...ecran((1 - t) ** 2 * C.CAP[0] + 2 * (1 - t) * t * mx + t * t * cx, (1 - t) ** 2 * C.CAP[1] + 2 * (1 - t) * t * my + t * t * cy), cam.z / 60); });
    for (const r of C.RIDS) places(apercu, r).forEach((p, i) => { const [x0, y0] = C.LOTS[r][i];
      if (p.friche) return;
      if (p.libre){ const [X, Y] = ecran(x0, y0 - .3), k = 1 + .06 * Math.sin(performance.now() / 500 + i); cercleLibre(X, Y, .42 * cam.z * k, false);
        if (aConstruire){ const q = prodIci(aConstruire, r); etiquette(q.txt + (q.k > 1 ? " ★" : ""), x0, y0 + .45, 14, { sc: false, fond: q.k > 1 ? "rgba(155,42,31,.92)" : "rgba(239,227,200,.95)", coul: q.k > 1 ? "#efe3c8" : null, cadre: ENC }); }
        return; }
      if (p.defrichage){ const [X, Y] = ecran(x0, y0 - .3); g.strokeStyle = ENC; g.setLineDash([3, 3]); g.lineWidth = 1.5; g.strokeRect(X - .4 * cam.z, Y - .4 * cam.z, .8 * cam.z, .8 * cam.z); g.setLineDash([]);
        etiquette(`défrichage · ${p.defrichage} t.`, x0, y0 + .45, 12, { sc: false, fond: "rgba(239,227,200,.92)" }); return; }
      papierRond(x0, y0 - .35, .62); sprite(S[p.id], x0, y0 + .2, 1.15, true, p.chantier ? .45 : 1);
      if (!p.chantier && FUME[p.id]) fumee(...ecran(x0 + .25, y0 - .9), .7, i);
      etiquette(BAT[p.id].nom.replace("Mine de ", "Mine ") + (p.chantier ? ` · ${p.chantier} t.` : p.niveau ? " ★".repeat(Math.min(2, p.niveau)) : ""), x0, y0 + .55, 12, { sc: false, fond: "rgba(239,227,200,.92)" }); });
    if (REGIONS_OK(choix) && !aConstruire){ g.globalAlpha = .45; g.drawImage(masque(choix), Math.round(ax), Math.round(ay), Math.round(lw), Math.round(lh)); g.globalAlpha = 1; }
  }
  // une charrette par contrat en cours
  apercu.contrats.forEach((ct, k) => { const o = offre(ct.id); if (!o || !C.ROUTES[o.nation]) return; const p = posCharrette(o.nation, k); if (p) sprite(S.charrette, p[0], p[1] + .15, carte === "pays" ? .9 : 1.1, true, 1, p[2] < 0); });
  etiquettes();
  fumeesFin();
  requestAnimationFrame(frame);
}
const REGIONS_OK = r => !!(r && apercu.regions[r]);
const MAISONS = [[-.9, .2], [.9, .25], [-.5, .75], [.55, .8], [-1.3, -.35], [1.3, -.3], [0, 1.05], [-1.05, .9]];
const FUME = { farm: 1, workshop: 1, weaving: 1, scierie: 1, caserne: 1, entente_mill: 1 };
function papierRond(x, y, r){ const [X, Y] = ecran(x, y); g.fillStyle = "rgba(236,224,196,.75)"; g.beginPath(); g.ellipse(X, Y, r * cam.z, r * cam.z * .8, 0, 0, 6.3); g.fill(); }
const MASQUES = {};
function masque(r){ if (MASQUES[r]) return MASQUES[r];
  const Rm = R.pays, px = Rm.px, B = Rm.B, w = Rm.c.width, h = Rm.c.height, c = C.toile(w, h), k = c.getContext("2d"), im = k.createImageData(w, h), p = im.data, ri = C.RIDS.indexOf(r);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++){ const x = B.x0 + (i + .5) / px, y = B.y0 + (j + .5) / px;
    if (C.terre(x, y) && C.nationEn(x, y) === 0 && C.regionEn(x, y) !== ri){ const q = (j * w + i) * 4; p[q] = 40; p[q + 1] = 30; p[q + 2] = 20; p[q + 3] = 150; } }
  k.putImageData(im, 0, 0); return MASQUES[r] = c; }
function fumee(X, Y, k, graine){ const t = performance.now() / 1000; g.strokeStyle = "rgba(58,42,28,.55)"; g.lineWidth = 1.2;
  for (let n = 0; n < 3; n++){ const a = (t * .45 + n / 3 + graine * .13) % 1; g.globalAlpha = 1 - a; g.beginPath(); g.arc(X + Math.sin(a * 5 + graine) * 4 * k, Y - a * 26 * k, (2.5 + a * 5) * k, 0, 6.3); g.stroke(); } g.globalAlpha = 1; }
function passant(X, Y, k){ k = Math.max(.7, Math.min(1.4, k)); const t = performance.now() / 160; g.strokeStyle = ENC; g.fillStyle = ENC; g.lineWidth = 1.3;
  g.beginPath(); g.arc(X, Y - 9 * k, 1.8 * k, 0, 6.3); g.fill(); g.beginPath(); g.moveTo(X, Y - 7 * k); g.lineTo(X, Y - 3 * k);
  g.moveTo(X, Y - 3 * k); g.lineTo(X - 2 * k * Math.sin(t), Y); g.moveTo(X, Y - 3 * k); g.lineTo(X + 2 * k * Math.sin(t), Y); g.stroke(); }
function cercleLibre(X, Y, r, sel){ g.strokeStyle = ROUGE; g.lineWidth = 2; g.setLineDash([4, 3]); g.fillStyle = sel ? "rgba(155,42,31,.22)" : "rgba(250,243,226,.8)";
  g.beginPath(); g.arc(X, Y, r, 0, 6.3); g.fill(); g.stroke(); g.setLineDash([]); g.fillStyle = ROUGE;
  g.fillRect(Math.round(X - r * .45), Math.round(Y - 1.5), Math.round(r * .9), 3); g.fillRect(Math.round(X - 1.5), Math.round(Y - r * .45), 3, Math.round(r * .9)); }
function fumeesFin(){ for (let i = fumees.length - 1; i >= 0; i--) if (performance.now() - fumees[i].t > 1500) fumees.splice(i, 1); }

// ---------- étiquettes ----------
function etiquette(txt, x, y, taille, o){ o = o || {}; const [X, Y] = ecran(x, y);
  g.font = `${o.ital ? "italic " : ""}${taille}px ${o.sc === false ? "'IM Fell English'" : "'IM Fell English SC'"}, Georgia, serif`; g.textAlign = "center"; g.textBaseline = "middle";
  const w = g.measureText(txt).width;
  if (o.fond){ g.fillStyle = o.fond; g.fillRect(Math.round(X - w / 2 - 5), Math.round(Y - taille * .65), Math.round(w + 10), Math.round(taille * 1.3));
    if (o.cadre){ g.strokeStyle = o.cadre; g.lineWidth = 1.5; g.strokeRect(Math.round(X - w / 2 - 5), Math.round(Y - taille * .65), Math.round(w + 10), Math.round(taille * 1.3)); } }
  else { g.lineWidth = 4; g.strokeStyle = "rgba(236,224,196,.9)"; g.lineJoin = "round"; g.strokeText(txt, X, Y); }
  g.fillStyle = o.coul || "rgb(48,34,22)"; g.fillText(txt, X, Y); }
function etiquettes(){
  if (carte === "monde"){ for (const id of C.IDS){ const [x, y] = C.GEO[id].graine, sel = choix === id;
      if (id === "joueur"){ etiquette(P.PAYS[apercu.pays].nom.replace("Pays ", "Notre pays "), x, y + .75, 17, { fond: sel ? "rgba(155,42,31,.9)" : null, coul: sel ? "#efe3c8" : null }); continue; }
      const N = apercu.nations[id], pr = apercu.profils[id], guerre = apercu.guerre && (apercu.guerre.ennemis || []).includes(id);
      etiquette(pr.nom, x, y + .75, 17, { fond: sel ? "rgba(155,42,31,.9)" : null, coul: sel ? "#efe3c8" : null });
      const tr = apercu.traites.filter(t => t.avec === id).length;
      etiquette(`${signe(N.relation)} · ${pr.distance} étape${pr.distance > 1 ? "s" : ""}${tr ? " · traité" : ""}${apercu.embargos.includes(id) ? " · embargo" : ""}${guerre ? " · GUERRE" : ""}`, x, y + 1.45, 13, { sc: false, ital: true, coul: N.relation < 0 || guerre ? ROUGE : null }); } }
  else {
    for (const r of C.RIDS){ const [x, y] = C.CENTRES[r], Rg = apercu.regions[r], occ = (apercu.occupations || {})[r];
      etiquette(Rg.nom + (occ ? " (occupée)" : ""), x, y - 1.15, 18, { fond: choix === r ? "rgba(155,42,31,.9)" : `rgba(${C.RCOUL[r].join(",")},.85)`, coul: "#fbf3e0", cadre: ENC }); }
    for (const id of C.IDS) if (id !== "joueur"){ const p = C.ROUTES[id].find(([x, y]) => x < C.PAYS_B.x0 + 2.2 || y < C.PAYS_B.y0 + 2.2 || x > C.PAYS_B.x1 - 2.2 || y > C.PAYS_B.y1 - 2.2);
      if (p) etiquette(nomNation(id) + " →", p[0], p[1] - .5, 14, { sc: false, ital: true }); } } }

// ---------- charrettes : un aller-retour le long de la route ----------
function posCharrette(n, k){ const r = C.ROUTES[n], L = C.longueur(r), per = L / 1.2 * 2; let s = ((performance.now() / 1000 + k * 3.7) % per) / per * 2 * L, sens = 1;
  if (s > L){ s = 2 * L - s; sens = -1; }
  for (let i = 1; i < r.length; i++){ const l = Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); if (s <= l || i === r.length - 1){ const f = l ? Math.min(1, s / l) : 0;
      return [r[i - 1][0] + (r[i][0] - r[i - 1][0]) * f, r[i - 1][1] + (r[i][1] - r[i - 1][1]) * f, (r[i][0] - r[i - 1][0]) * sens]; } s -= l; } return null; }

// ======================= le registre du pays (cadastre) =======================
function ecrit(txt, x, y, taille, o){ o = o || {}; g.font = `${o.ital ? "italic " : ""}${taille}px ${o.sc ? "'IM Fell English SC'" : "'IM Fell English'"}, Georgia, serif`;
  g.textAlign = o.align || "center"; g.textBaseline = "middle"; let t = txt;
  if (o.max) while (g.measureText(t).width > o.max && t.length > 3) t = t.slice(0, -2) + "…";
  if (o.fond){ const w = g.measureText(t).width, x0 = o.align === "left" ? x - 3 : x - w / 2 - 4; g.fillStyle = o.fond; g.fillRect(Math.round(x0), Math.round(y - taille * .62), Math.round(w + 8), Math.round(taille * 1.24)); }
  g.fillStyle = o.coul || "rgb(43,33,24)"; g.fillText(t, x, y); }
function trait(x, y, w, h, ep, graine){ g.strokeStyle = ENC; for (const [e, dd] of [[ep, 0], [ep * .5, 4]]){ g.lineWidth = e; g.beginPath();
    [[x + dd, y + dd], [x + w - dd, y + dd], [x + w - dd, y + h - dd], [x + dd, y + h - dd]].forEach(([a, b], k) => { const j = (((k * 37 + graine * 11) % 7) / 7 - .5) * 1.6; k ? g.lineTo(a + j, b - j) : g.moveTo(a + j, b + j); }); g.closePath(); g.stroke(); } }
function registre(v){
  ZONES.length = 0; g.drawImage(C.IMG.papier, 0, 0, v.w, v.h);
  const haut = 150, bas = v.h - 156, A = { x: 10, y: haut + 50, w: v.w - 20, h: bas - haut - 50 }, gap = 8, pw = (A.w - gap) / 2, ph = (A.h - gap) / 2, cy = haut + 22;
  trait(A.x, haut, A.w, 44, 1.6, 9);
  const c0 = S.capitale, kc = 38 / c0.height; g.drawImage(c0, A.x + 10, cy + 18 - c0.height * kc, c0.width * kc, c0.height * kc); fumee(A.x + 30, cy - 8, .8, 3);
  ecrit("Capitale", A.x + 18 + c0.width * kc, cy - 7, 16, { sc: true, align: "left" });
  ecrit(`${Math.round(apercu.familles)} familles · trésor ${Math.round(apercu.tresor)} or`, A.x + 18 + c0.width * kc, cy + 10, 12, { ital: true, align: "left" });
  C.RIDS.forEach((r, n) => { const Rg = apercu.regions[r], x = A.x + (n % 2) * (pw + gap), y = A.y + Math.floor(n / 2) * (ph + gap), col = C.RCOUL[r], sel = choix === r;
    g.fillStyle = `rgba(${col.join(",")},.2)`; g.fillRect(x, y, pw, ph); trait(x, y, pw, ph, sel ? 3 : 1.6, n);
    if (sel){ g.strokeStyle = ROUGE; g.lineWidth = 2; g.strokeRect(x + 2, y + 2, pw - 4, ph - 4); }
    g.fillStyle = `rgba(${col.join(",")},.9)`; g.fillRect(x + 8, y + 8, pw - 16, 22); ecrit(Rg.nom, x + pw / 2, y + 19.5, 16, { sc: true, coul: "#fbf3e0", max: pw - 20 });
    const bon = Object.entries((TERR[Rg.terrain] || {}).bonus || {}).map(([k2, vv]) => BAT[k2].nom.replace("Mine de ", "") + " ×" + String(vv).replace(".", ",")).join(" · ");
    ecrit(`${(TERR[Rg.terrain] || {}).nom || Rg.terrain} : ${bon}`, x + pw / 2, y + 40, 11.5, { ital: true, max: pw - 14 });
    ZONES.push({ x, y, w: pw, h: ph, region: r });
    const cw = (pw - 12) / 3, ch0 = (ph - 56) / 3, liste = places(apercu, r);
    liste.slice(0, 9).forEach((p, i) => { const c1 = i % 3, row = Math.floor(i / 3), X = x + 6 + cw * (c1 + .5), Yb = y + 52 + ch0 * row + ch0 * .58, tl = Math.min(cw, ch0) * .55;
      g.strokeStyle = "rgba(58,42,28,.3)"; g.lineWidth = 1; g.strokeRect(Math.round(x + 6 + cw * c1) + .5, Math.round(y + 52 + ch0 * row) + .5, Math.round(cw - 2), Math.round(ch0 - 2));
      if (p.friche){ ecrit("friche", X, Yb - tl * .3, 10.5, { ital: true, coul: "rgba(43,33,24,.5)" }); return; }
      if (p.defrichage){ ecrit(`défrichage ${p.defrichage} t.`, X, Yb - tl * .3, 10.5, { ital: true, coul: ROUGE, max: cw - 4 }); return; }
      if (p.libre){ cercleLibre(X, Yb - tl * .5, Math.max(9, tl * .32), false);
        if (aConstruire){ const q = prodIci(aConstruire, r); ecrit(q.txt + (q.k > 1 ? " ★" : ""), X, Yb + 8, 11, { fond: q.k > 1 ? "rgba(155,42,31,.92)" : "rgba(250,243,226,.95)", coul: q.k > 1 ? "#fbf3e0" : null }); }
        else ecrit("libre", X, Yb + 7, 11, { ital: true, coul: ROUGE });
        ZONES.push({ x: X - cw / 2, y: Yb - ch0 * .58, w: cw, h: ch0, region: r, libre: true }); return; }
      const im = S[p.id], k = tl / Math.max(im.width, im.height); g.globalAlpha = p.chantier ? .4 : 1; g.drawImage(im, X - im.width * k / 2, Yb - im.height * k, im.width * k, im.height * k); g.globalAlpha = 1;
      ecrit(BAT[p.id].nom.replace("Mine de ", "Mine ").replace(" national", "") + (p.niveau ? " ★".repeat(Math.min(2, p.niveau)) : ""), X, Yb + 7, 10.5, { max: cw - 4 });
      if (p.chantier) ecrit(`chantier · ${p.chantier} t.`, X, Yb + 18, 9.5, { ital: true, coul: ROUGE });
      ZONES.push({ x: X - cw / 2, y: Yb - ch0 * .58, w: cw, h: ch0, region: r }); }); }); }

// ======================= production d'un bâtiment dans une région =======================
function prodIci(id, r){ const k = ((TERR[apercu.regions[r].terrain] || {}).bonus || {})[id] || 1, pr = BAT[id].produit;
  if (!pr) return { k, txt: id === "caserne" ? "recrutement" : BAT[id].nom };
  const b = Object.keys(pr)[0]; return { k, txt: Math.round(pr[b] * k) + " " + (BIENS[b] || b) }; }

// ======================= interactions =======================
let glisse = null;
cv.addEventListener("pointerdown", e => { glisse = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, bouge: false }; cv.setPointerCapture(e.pointerId); });
cv.addEventListener("pointermove", e => { if (!glisse || (carte === "pays" && vueRegistre)) return; const dx = e.clientX - glisse.x, dy = e.clientY - glisse.y; if (Math.hypot(dx, dy) > 6) glisse.bouge = true; cam.x = glisse.cx - dx / cam.z; cam.y = glisse.cy - dy / cam.z; });
cv.addEventListener("pointerup", e => { if (glisse && !glisse.bouge) touche(e); glisse = null; });
cv.addEventListener("wheel", e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });
document.getElementById("zPlus").onclick = () => zoom(1);
document.getElementById("zMoins").onclick = () => zoom(-1);
function zoom(sens){ const b = PX[carte]; cam.z = Math.max(b * (carte === "pays" ? .35 : .3), Math.min(b * 1.6, cam.z * (sens > 0 ? 1.3 : 1 / 1.3))); }
function touche(e){ if (!apercu) return;
  const r0 = cv.getBoundingClientRect(), X = e.clientX - r0.left, Y = e.clientY - r0.top;
  if (carte === "pays" && vueRegistre){ const z = [...ZONES].reverse().find(q => X >= q.x && X <= q.x + q.w && Y >= q.y && Y <= q.y + q.h);
    if (!z){ fermeFiche(); return; } choisirRegion(z.region, z.libre); return; }
  const v = vue(), x = (X - v.w / 2) / cam.z + cam.x, y = (Y - v.h / 2) / cam.z + cam.y;
  if (carte === "pays"){ let lot = null; for (const r of C.RIDS) places(apercu, r).forEach((p, i) => { const [a, b] = C.LOTS[r][i]; if (Math.hypot(a - x, b - .3 - y) < .55 && !p.friche) lot = [r, p]; });
    if (lot){ choisirRegion(lot[0], lot[1].libre); return; } }
  if (!C.terre(x, y)){ fermeFiche(); return; }
  const id = C.IDS[C.nationEn(x, y)];
  if (carte === "pays" && id === "joueur"){ choisirRegion(C.RIDS[C.regionEn(x, y)], false); return; }
  choix = id; ficheNation(id); }
function choisirRegion(r, libre){ if (aConstruire){ if (libre) batir(aConstruire, r); else toast("Touchez une place libre (cercle rouge +)."); return; }
  choix = r; if (libre) menuConstruire(r); else ficheRegion(r); }

// ======================= fiches (en bas) =======================
const fiche = document.getElementById("fiche");
function fermeFiche(){ fiche.classList.remove("ouverte"); choix = null; aConstruire = null; }
function ouvreFiche(html){ fiche.innerHTML = html; fiche.classList.add("ouverte"); fiche.scrollTop = 0; }
// une liste de boutons d'actions ; clic = l'ordre est donné
function boutons(liste, txt){ return liste.map((a, i) => `<div class="ligne"><span>${(txt || libelle)(a)}</span><button class="btn" data-a="${i}">Ordonner</button></div>`).join(""); }
function lier(el, liste, apres){ el.querySelectorAll("[data-a]").forEach(b => b.onclick = () => { const a = liste[+b.dataset.a]; if (faire(a, libelle(a))) apres(); }); }
function ficheNation(n){
  if (n === "joueur"){ ouvreFiche(`<h2>${PAYS[apercu.pays].nom}</h2><p>${Math.round(apercu.familles)} familles · ${Object.values(apercu.batiments).reduce((a, b) => a + b, 0)} bâtiments · ${apercu.regiments} régiments.</p><div class="actions"><button class="btn" id="voir">Ouvrir la carte de mon pays</button></div>`);
    document.getElementById("voir").onclick = () => change("pays"); return; }
  const N = apercu.nations[n], pr = apercu.profils[n], toutes = dispo();
  const miennes = toutes.filter(a => a.id === n || a.avec === n || (a.type === "contrat" && offre(a.id) && offre(a.id).nation === n));
  const ventes = Object.keys(pr.exporte).map(b => `${BIENS[b] || b} ${pr.exporte[b]}`).join(", "), achats = Object.keys(pr.importe).map(b => `${BIENS[b] || b} ${pr.importe[b]}`).join(", ");
  const enCours = apercu.contrats.filter(c => offre(c.id) && offre(c.id).nation === n).map(c => { const o = offre(c.id); return `${o.sens === "achat" ? "achat" : "vente"} de ${o.volume} ${BIENS[o.bien] || o.bien} (jusqu'au tour ${c.jusqua})`; });
  const traites = apercu.traites.filter(t => t.avec === n).map(t => (DIPLO.traites[t.type] || {}).nom || t.type);
  const ordre = ["contrat", "don", "diplomate", "traite", "route", "investir", "projet", "exiger", "embargo", "lever_embargo", "rompre", "declarer_guerre"];
  miennes.sort((a, b) => ordre.indexOf(a.type) - ordre.indexOf(b.type));
  ouvreFiche(`<h2>${pr.nom}</h2><p>Relation <b>${signe(N.relation)}</b> · ${pr.distance} étape${pr.distance > 1 ? "s" : ""} · trésor ${Math.round(N.tresor)} or</p>
    <p>Vend : ${ventes}. Achète : ${achats}.</p>${traites.length ? `<p>Traités : ${traites.join(", ")}.</p>` : ""}${enCours.length ? `<p>Contrats : ${enCours.join(" ; ")}.</p>` : ""}
    ${apercu.diplomate && apercu.diplomate.nation === n ? "<p><i>Notre diplomate est sur place.</i></p>" : ""}
    <div class="liste">${miennes.length ? boutons(miennes) : "<p class='aide'>Rien à proposer pour l'instant (relation, or ou traités insuffisants).</p>"}</div>`);
  lier(fiche, miennes, () => ficheNation(n)); }
function ficheRegion(r){ const Rg = apercu.regions[r], T0 = TERR[Rg.terrain] || {}, liste = places(apercu, r), toutes = dispo();
  const bonus = Object.entries(T0.bonus || {}).map(([k, v]) => `${BAT[k].nom.toLowerCase()} ×${String(v).replace(".", ",")}`).join(", ");
  const puces = liste.filter(p => !p.friche).map(p => p.libre ? `<span class="pc libre">+ libre</span>` : p.defrichage ? `<span class="pc ch">défrichage · ${p.defrichage} t.</span>` : `<span class="pc${p.chantier ? " ch" : ""}">${BAT[p.id].nom}${p.chantier ? ` · ${p.chantier} t.` : ""}</span>`).join("");
  const autres = toutes.filter(a => a.region === r && a.type !== "construire");
  ouvreFiche(`<h2>${Rg.nom}</h2><p>Terrain <b>${T0.nom || Rg.terrain}</b>${bonus ? " : " + bonus : ""}. Un seul chantier à la fois par région.</p><div class="puces">${puces}</div>
    <div class="actions"><button class="btn" id="bat" ${toutes.some(a => a.type === "construire" && a.region === r) ? "" : "disabled"}>Construire</button></div>
    <div class="liste">${boutons(autres)}</div>`);
  document.getElementById("bat").onclick = () => menuConstruire(r);
  lier(fiche, autres, () => ficheRegion(r)); }
function ligneBat(id, d, ok, extra){ return `<button class="choix" data-id="${id}" ${extra || ""} ${ok ? "" : "disabled"}><img src="${BAT[id].url}" alt=""><span class="n">${BAT[id].nom}</span><span class="d">${d}</span><span class="c">${Batiments.cout(id, apercu)} or</span></button>`; }
function menuConstruire(r){ const T0 = (TERR[apercu.regions[r].terrain] || {}).bonus || {}, ok = dispo().filter(a => a.type === "construire" && a.region === r).map(a => a.id);
  const liste = Object.keys(BAT).filter(id => !BAT[id].jalon && !BAT[id].traite).sort((a, b) => (T0[b] || 1) - (T0[a] || 1));
  ouvreFiche(`<h2>Bâtir — ${apercu.regions[r].nom}</h2><p class="aide">Tout se bâtit partout ; le terrain fait produire plus les bâtiments marqués ★.</p>
    <div class="menu">${liste.map(id => ligneBat(id, `${prodIci(id, r).txt} par tour ici${T0[id] ? " ★" : ""} · ${BAT[id].delai} tours`, ok.includes(id))).join("")}</div><div class="actions"><button class="btn" id="annule">◂ ${apercu.regions[r].nom}</button></div>`);
  fiche.querySelectorAll(".choix").forEach(el => el.onclick = () => batir(el.dataset.id, r));
  document.getElementById("annule").onclick = () => ficheRegion(r); }
function batir(id, r){ aConstruire = null; if (faire({ type: "construire", id, region: r }, `Chantier : ${BAT[id].nom} (${apercu.regions[r].nom}), ${BAT[id].delai} tours.`)){ choix = r; ficheRegion(r); } }
function menuGeneral(){ fermeFiche(); const ok = dispo().filter(a => a.type === "construire");
  ouvreFiche(`<h2>Que bâtir ?</h2><p class="aide">Tout se bâtit dans toutes les régions, sur une place libre, un chantier à la fois par région. Le terrain fait seulement produire plus : ★ = meilleur endroit.</p>
    <div class="menu">${Object.keys(BAT).filter(id => !BAT[id].jalon && !BAT[id].traite).map(id => { const best = C.RIDS.filter(r => ((TERR[apercu.regions[r].terrain] || {}).bonus || {})[id]);
      return ligneBat(id, `${prodIci(id, "bourg").txt.replace(/^\d+ /, (BAT[id].produit ? Object.values(BAT[id].produit)[0] : "") + " ")} par tour · ${BAT[id].delai} tours · ${best.length ? "★ " + best.map(r => apercu.regions[r].nom).join(", ") : "pareil partout"}`, ok.some(a => a.id === id)); }).join("")}</div>`);
  fiche.querySelectorAll(".choix").forEach(el => el.onclick = () => { aConstruire = el.dataset.id; choix = null; const B0 = BAT[aConstruire];
    ouvreFiche(`<h2>${B0.nom} · ${Batiments.cout(aConstruire, apercu)} or</h2><p>Touchez une <b>place libre</b> (cercle rouge +) : chacune montre ce que le bâtiment y produirait ; ★ = terrain favorable.</p><div class="actions"><button class="btn" id="autre">◂ Autre bâtiment</button><button class="btn" id="annule">Annuler</button></div>`);
    document.getElementById("autre").onclick = menuGeneral; document.getElementById("annule").onclick = fermeFiche; }); }

// ======================= menus du ruban =======================
function menuLois(){ const t = dispo(), lanc = t.filter(a => a.type === "loi"), deb = apercu.debat;
  let h = `<h2>Lois</h2>`;
  if (deb) h += `<p>En débat : <b>${LOIS[deb.id].nom}</b> (depuis le tour ${deb.depuis}) · chance d'adoption ${Math.round(Lois.chance(apercu, deb.id) * 100)} % par tour.</p><div class="actions"><button class="btn" id="abandon">Abandonner le débat</button></div>`;
  else h += `<p class="aide">Une seule loi en débat à la fois.</p>`;
  for (const c in CAT){ const v = apercu.lois[c], ls = lanc.filter(a => LOIS[a.id].categorie === c);
    h += `<div class="section">${CAT[c]} — ${v ? LOIS[v.id].nom : "au centre"}</div>`;
    h += ls.map(a => `<div class="ligne"><span>${LOIS[a.id].nom}<br><i class="ordres">${texteLoi(a.id).slice(0, 160)}${texteLoi(a.id).length > 160 ? "…" : ""} · ${Math.round(Lois.chance(apercu, a.id) * 100)} %</i></span><button class="btn" data-a="${lanc.indexOf(a)}">Proposer</button></div>`).join(""); }
  ouvreFiche(h); lier(fiche, lanc, menuLois); const ab = document.getElementById("abandon"); if (ab) ab.onclick = () => { if (faire({ type: "abandonner" }, "Débat abandonné.")) menuLois(); }; }
function menuBudget(){ const t = dispo(), b = Economie.bilan(apercu), imp = t.filter(a => a.type === "impots"), inst = t.filter(a => a.type === "institution");
  const l = (txt, v) => `<div class="ligne"><span>${txt}</span><b>${signe(v)}</b></div>`;
  ouvreFiche(`<h2>Budget</h2><p>Trésor <b>${Math.round(apercu.tresor)} or</b> · impôts <b>${apercu.impots || "normal"}</b> · prévision du tour <b>${signe(b.solde)} or</b></p>
    <div class="liste">${l("Impôts", b.impots)}${l("Ventes au marché", b.ventes)}${l("Achats au marché", -b.achats)}${l("Contrats", b.contrats)}${b.dividendes ? l("Dividendes", b.dividendes) : ""}${l("Entretiens et institutions", -b.entretiens)}</div>
    <div class="section">Impôts</div><div class="liste">${boutons(imp)}</div>
    <div class="section">Institutions</div><p class="aide">${Object.keys(INST.INSTITUTIONS).map(k => `${INST.INSTITUTIONS[k].nom} ${apercu.institutions[k] || 0}`).join(" · ")}</p><div class="liste">${boutons(inst)}</div>`);
  lier(fiche, imp.concat(inst), menuBudget);
  fiche.querySelectorAll("[data-a]").forEach((bt, i) => { const a = imp.concat(inst)[i]; bt.onclick = () => { if (faire(a, libelle(a))) menuBudget(); }; }); }
function menuArmee(){ const t = dispo(), gu = apercu.guerre, ac = t.filter(a => ["recruter", "declarer_guerre", "bataille", "paix_blanche", "imposer_paix"].includes(a.type));
  ouvreFiche(`<h2>Armée</h2><p><b>${apercu.regiments}</b> régiments.${gu ? ` En guerre contre ${(gu.ennemis || []).map(nomNation).join(", ")} depuis le tour ${gu.depuis}.` : " En paix."}</p>
    ${Object.keys(apercu.occupations || {}).length ? `<p>Régions occupées : ${Object.keys(apercu.occupations).join(", ")}.</p>` : ""}<div class="liste">${boutons(ac)}</div>`);
  lier(fiche, ac, menuArmee); }
function menuJournal(){ ouvreFiche(`<h2>Journal — tour ${base.tour}</h2>${(base.journal || []).length ? base.journal.map(m => `<p>• ${m}</p>`).join("") : "<p class='aide'>Rien de neuf.</p>"}
    <div class="section">Ordres de ce tour</div>${ordres.length ? ordres.map(a => `<p class="ordres">• ${libelle(a)}</p>`).join("") + `<div class="actions"><button class="btn" id="annulerOrdre">Annuler le dernier ordre</button></div>` : "<p class='aide'>Aucun ordre pour l'instant.</p>"}`);
  const b = document.getElementById("annulerOrdre"); if (b) b.onclick = () => { annulerDernier(); menuJournal(); }; }
function menuFactions(){ const t = dispo(), ac = t.filter(a => a.type === "apaiser" || a.type === "reprimer");
  let h = `<h2>Les factions</h2>`;
  for (const f in apercu.factions){ const x = apercu.factions[f], mes = ac.filter(a => a.id === f);
    h += `<div class="section" style="color:${FCOUL[f]}">${FAC[f].nom} — ${STATUT[x.statut] || x.statut}</div>
      <div class="ligne"><span>colère</span><div class="jauge"><span style="width:${x.colere}%;background:${ROUGE}"></span></div><b>${Math.round(x.colere)}</b></div>
      <div class="ligne"><span>puissance</span><div class="jauge"><span style="width:${Math.min(100, x.puissance)}%;background:${FCOUL[f]}"></span></div><b>${Math.round(x.puissance)}</b></div>
      ${mes.map(a => `<div class="ligne"><span>${libelle(a)}</span><button class="btn" data-a="${ac.indexOf(a)}">Ordonner</button></div>`).join("")}`; }
  ouvreFiche(h); lier(fiche, ac, menuFactions); }
document.getElementById("mLois").onclick = menuLois;
document.getElementById("mBudget").onclick = menuBudget;
document.getElementById("mArmee").onclick = menuArmee;
document.getElementById("mJournal").onclick = menuJournal;
document.getElementById("factions").onclick = menuFactions;
document.getElementById("ambition").onclick = () => { if (!apercu.ambition) demandeAmbition(); else ficheAmbition(); };

// ======================= modales : titre, pays, ambition, événement, rapport, fin =======================
const voile = document.getElementById("voile"), modale = document.getElementById("modale");
function ouvreModale(h){ modale.innerHTML = h; voile.classList.add("ouvert"); modale.scrollTop = 0; }
function fermeModale(){ voile.classList.remove("ouvert"); }
function titre(){ const s = charge();
  ouvreModale(`<h1>Politique</h1><p style="text-align:center"><i>Gouverner un petit pays pendant 40 tours : bâtir, faire voter des lois, commercer avec les voisins, garder les factions calmes.</i></p>
    <div class="actions" style="flex-direction:column">${s ? `<button class="btn" id="reprendre">Reprendre la partie (tour ${s.base.tour})</button>` : ""}<button class="btn" id="nouvelle">Nouvelle partie</button><a class="btn ludo-retour" href="../" style="display:flex;align-items:center;justify-content:center;text-decoration:none">◂ Ludothèque</a></div>`);
  const r = document.getElementById("reprendre"); if (r) r.onclick = () => { base = s.base; ordres = s.ordres || []; recalcule(); fermeModale(); change("monde"); maj(); };
  document.getElementById("nouvelle").onclick = choixPays; }
function choixPays(){
  ouvreModale(`<h2>Choisir son pays</h2><div class="liste">${Object.keys(PAYS).map(id => { const p = PAYS[id];
      return `<button class="carte-pays" data-p="${id}"><b>${p.nom}</b><br>${p.texte}<br><span class="ordres">${Object.keys(p.factions).map(f => `${FAC[f].nom} ${p.factions[f]}`).join(" · ")}</span></button>`; }).join("")}</div>
    <div class="actions"><button class="btn" id="retourTitre">◂ Retour</button></div>`);
  modale.querySelectorAll("[data-p]").forEach(b => b.onclick = () => nouvellePartie(b.dataset.p));
  document.getElementById("retourTitre").onclick = titre; }
function demandeAmbition(){ const ac = dispo().filter(a => a.type === "ambition"); if (!ac.length) return;
  ouvreModale(`<h2>Votre ambition</h2><p class="aide">Elle se choisit au premier tour et compte pour la victoire (médailles de bronze, d'argent et d'or).</p>
    <div class="liste">${ac.map((a, i) => `<button class="carte-pays" data-i="${i}"><b>${OBJ[a.id].nom}</b><br>${OBJ[a.id].texte}</button>`).join("")}</div>`);
  modale.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { const a = ac[+b.dataset.i]; if (faire(a, "Ambition : " + OBJ[a.id].nom)) fermeModale(); }); }
function ficheAmbition(){ const et = Objectifs.etapes(apercu);
  ouvreFiche(`<h2>Ambition : ${OBJ[apercu.ambition].nom}</h2><p>${OBJ[apercu.ambition].texte}</p>${et.map(x => `<p>${x.faite ? "✔" : "○"} ${x.texte}</p>`).join("")}`); }
function evenement(){ const ev = apercu.evenement, ac = dispo().filter(a => a.type === "evenement"); if (!ev || !ac.length) return;
  const Cd = CARTES[ev.id];
  ouvreModale(`<h2>${Cd.nom}</h2><p>${Cd.texte || ""}</p><div class="liste">${ac.map((a, i) => { const ch = Cd.choix.find(c => c.id === a.choix);
      return `<button class="carte-pays" data-i="${i}">${ch.texte}${ch.cout ? ` <b>(${ch.cout} or)</b>` : ""}</button>`; }).join("")}</div>`);
  modale.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { if (faire(ac[+b.dataset.i], Cd.nom)) fermeModale(); }); }
function rapport(avant){
  if (base.fin){ finDePartie(); return; }
  const d = base.tresor - avant.tresor;
  ouvreModale(`<h2>Tour ${base.tour}</h2><p>Trésor ${Math.round(base.tresor)} or (${signe(d)}) · ${Math.round(base.familles)} familles</p>${(base.journal || []).map(m => `<p>• ${m}</p>`).join("") || "<p class='aide'>Un tour calme.</p>"}
    <div class="actions"><button class="btn" id="ok">Continuer</button></div>`);
  document.getElementById("ok").onclick = () => { fermeModale(); evenement(); }; }
function finDePartie(){ const m = Objectifs.medailles(base), noms = ["aucune", "bronze", "argent", "or"];
  ouvreModale(`<h2>Fin de la partie</h2><p>${base.issue && base.issue.type === "revolution" ? `Révolution : les ${FAC[base.issue.faction] ? FAC[base.issue.faction].nom : base.issue.faction} ont renversé le gouvernement.` : "Les 40 tours sont passés."}</p>
    ${Object.keys(OBJ).map(id => `<div class="ligne"><span>${OBJ[id].nom}${id === base.ambition ? " (ambition)" : ""}</span><b>${noms[m[id] || 0]}</b></div>`).join("")}
    <div class="actions"><button class="btn" id="rejouer">Nouvelle partie</button></div>`);
  document.getElementById("rejouer").onclick = choixPays; }

// ======================= mise à jour, navigation =======================
let minut = null;
function toast(t){ const el = document.getElementById("toast"); el.textContent = t; el.classList.add("vue"); clearTimeout(minut); minut = setTimeout(() => el.classList.remove("vue"), 2600); }
function maj(){ if (!apercu) return;
  document.getElementById("tour").textContent = `Tour ${apercu.tour}/${apercu.tourMax}`;
  document.getElementById("or").textContent = `${Math.round(apercu.tresor)} or`;
  const tot = Object.values(apercu.factions).reduce((a, f) => a + f.puissance, 0) || 1;
  document.getElementById("factions").innerHTML = Object.keys(apercu.factions).map(f => `<span style="width:${apercu.factions[f].puissance / tot * 100}%;background:${FCOUL[f]};opacity:${apercu.factions[f].statut === "calme" ? .55 : 1}"></span>`).join("");
  const et = apercu.ambition ? Objectifs.etapes(apercu) : [];
  document.getElementById("ambition").textContent = apercu.ambition ? `${OBJ[apercu.ambition].nom} ${et.filter(x => x.faite).length}/${et.length}` : "Ambition ?";
  const f = document.getElementById("fin"); f.innerHTML = `Tour<br>suivant${ordres.length ? `<span class="compte">${ordres.length}</span>` : ""}`;
  majTitre(); }
function majTitre(){ document.getElementById("titre").textContent = carte === "monde" ? "Le continent" : vueRegistre ? "Registre du pays" : "Notre pays";
  document.getElementById("registre").textContent = vueRegistre ? "◂ Carte" : "▤ Registre";
  document.querySelector(".zoom").style.display = carte === "pays" && vueRegistre ? "none" : ""; }
function cadrePays(){ const v = vue(), B = C.PAYS_B, iw = B.x1 - B.x0 - 4, ih = B.y1 - B.y0 - 4;
  cam.x = (B.x0 + B.x1) / 2; cam.y = (B.y0 + B.y1) / 2 + 1.2; cam.z = Math.max(46, Math.min(v.w / iw, (v.h - 250) / ih)); }
function change(c){ carte = c; fermeFiche(); vueRegistre = false; const v = vue();
  if (c === "monde"){ cam.x = C.W / 2; cam.y = C.H / 2 + 1; cam.z = Math.min(v.w / (C.W - 4), (v.h - 200) / C.H); } else cadrePays();
  document.getElementById("bascule").textContent = c === "monde" ? "Mon pays ▸" : "◂ Le continent";
  document.getElementById("outilsPays").hidden = c === "monde"; majTitre(); }
document.getElementById("bascule").onclick = () => change(carte === "monde" ? "pays" : "monde");
document.getElementById("construire").onclick = () => { vueRegistre = true; majTitre(); menuGeneral(); };
document.getElementById("registre").onclick = () => { vueRegistre = !vueRegistre; fermeFiche(); majTitre(); if (!vueRegistre) cadrePays(); };
document.getElementById("fin").onclick = finTour;
window.addEventListener("resize", dimensionne);

// ======================= démarrage =======================
const NOMS = ["mount1", "mount2", "mount3", "mount4", "mount5", "mount6", "mount7", "mount8", "mount9", "mount10", "pine1", "pine3", "tree1", "tree4", "tree6", "tree7", "tree8", "home", "village", "open-city", "watchtower", "cave", "compass", "waves_2"];
Promise.all([C.charge("papier", "images/papier.jpg"), ...NOMS.map(n => C.charge(n, `images/tampons/${n}.png`))]).then(() => {
  document.documentElement.style.setProperty("--papier", `url(${C.IMG.papier.src})`);
  dimensionne(); prepare(); requestAnimationFrame(frame); titre(); });
window.PolEcran = { get etat(){ return apercu; }, get base(){ return base; }, faire, finTour, nouvellePartie, dispo, libelle, change };
})();

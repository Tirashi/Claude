/* Terres franches : l'interface (barre des ressources, volets VILLAGEOIS / CONSTRUIRE / COLONIE, bulle d'un bâtiment,
   choix du terrain, menus, récap du retour). Lit et commande la partie par window.Terres et window.TerresRegles. */
(function(){
"use strict";
const J = window.Terres, R = window.TerresRegles, DON = window.TerresDonnees, C = window.TerresCarte;
const $ = id => document.getElementById(id);
const fmt = n => n >= 1e4 ? (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + "k" : String(Math.floor(n + 1e-6));
const ic = r => `<img class="ic" src="${J.icone(r)}" alt="">`;
const NOM_RES = {vivres: "VIVRES"};
const nomRes = r => NOM_RES[r] || DON.RES[r].nom;

/* ---------- la barre du haut ---------- */
const TOUJOURS = ["bois", "baies", "poisson"];
let barre = "";
function majBarre(){
  const S = J.S, t = R.taux(S), vus = S.vus || (S.vus = {});
  for (const r in DON.RES) if (S.res[r] >= 1 || Math.abs(t[r]) > 1e-6) vus[r] = 1;
  const liste = Object.keys(DON.RES).filter(r => TOUJOURS.includes(r) || vus[r]);
  let h = liste.map(r => { const v = t[r] * 60, tx = Math.abs(v) < .05 ? "" : `<small class="${v < 0 ? "moins" : ""}">${v > 0 ? "+" : ""}${Math.abs(v) < 10 ? v.toFixed(1) : Math.round(v)}</small>`;
    return `<span>${ic(r)}<b>${fmt(S.res[r])}</b>${tx}</span>`; }).join("");
  h += `<span title="Habitants"><canvas class="ic portrait" width="30" height="30"></canvas><b>${S.pop}/${R.popMax(S)}</b></span>`;
  if (h !== barre){ barre = h; $("res").innerHTML = h; $("res").querySelectorAll("canvas.portrait").forEach(portrait); }
  const st = DON.STATUTS[S.statut].nom; if ($("statut").textContent !== st) $("statut").textContent = st;
}
const vill = new Image(); vill.src = "img/villageois.png";
function portrait(c, i){ const b = c.getContext("2d"); b.imageSmoothingEnabled = false; const go = () => { b.clearRect(0, 0, 30, 30); b.drawImage(vill, 576 + 17, J.rang(i || 0) * 256 + 128 + 6, 30, 30, 0, 0, 30, 30); }; vill.complete ? go() : vill.addEventListener("load", go); }

/* ---------- les volets ---------- */
let onglet = null, contenu = "";
function cout(c){
  const S = J.S;
  return `<span class="cout">${Object.entries(c).map(([r, n]) => { const a = r === "vivres" ? R.vivres(S) : S.res[r]; return `<span class="${a + 1e-9 < n ? "manque" : ""}">${ic(r)}${fmt(n)}</span>`; }).join("")}</span>`;
}
function volVillageois(){
  const S = J.S, P = R.reglages(S.mods), t = R.taux(S);
  let h = `<h3><span>HABITANTS ${S.pop}/${R.popMax(S)}</span><span>LIBRES ${R.libres(S)}</span></h3>`;
  // la limite : les toits (tente et feu, cabanes, maisons) ou le statut de la colonie, le plus petit des deux
  const toits = R.logement(S), lim = P.STATUTS[S.statut].popMax, suiv = P.STATUTS[S.statut + 1];
  h += `<p class="limite">Toits : <b>${toits}</b> · ${P.STATUTS[S.statut].nom} : <b>${lim}</b> au plus<br>${S.pop < R.popMax(S) ? "Il reste de la place : accueille quelqu'un."
    : toits < lim ? "Il manque des toits : construis une cabane." : suiv ? `Le ${P.STATUTS[S.statut].nom.toLowerCase()} est plein : il faut devenir ${suiv.nom.toLowerCase()} (volet COLONIE).` : "Plafond de l'ère : promulgue la Loi."}</p>`;
  const c = R.coutRecrue(S);
  h += `<div class="carte"><canvas width="30" height="30" class="portrait" data-p="${S.pop}"></canvas><span class="nom">ACCUEILLIR<small>${cout(c)}</small></span><button type="button" class="bouton petit or" data-act="recruter">+1</button></div>`;
  for (const m in P.METIERS){
    const M = P.METIERS[m], pl = R.places(S, m); if (!pl) continue;
    const r = M.produit || M.sortie, par = M.produit ? `${(t[r] * 60 >= 0 ? "+" : "")}${(t[r] * 60).toFixed(1)} ${nomRes(r)}/MIN` : `${Object.keys(M.entree).map(nomRes).join(" + ")} → ${nomRes(r)}`;
    h += `<div class="carte"><canvas width="36" height="36" data-i="${r}"></canvas><span class="nom">${M.nom}<small>${par}</small></span>
      <span class="pm"><button type="button" class="carre" data-m="${m}" data-d="-1" aria-label="Retirer">−</button><b>${S.jobs[m]}/${pl}</b><button type="button" class="carre" data-m="${m}" data-d="1" aria-label="Ajouter">+</button></span></div>`;
  }
  return h;
}
function volConstruire(){
  const S = J.S, P = R.reglages(S.mods); let h = "";
  for (const b in P.BATIMENTS){
    const B = P.BATIMENTS[b], e = R.peutConstruire(S, b), bloque = B.statut > S.statut, libres = C.libres(S, B.terrain).length;
    const plein = B.logement && !bloque && R.logement(S) >= P.STATUTS[S.statut].popMax;   // assez de toits : le statut limite
    const info = bloque ? `IL FAUT LE ${P.STATUTS[B.statut].nom}` : !libres ? "PLUS DE TERRAIN" : `${libres} TERRAIN${libres > 1 ? "S" : ""} LIBRE${libres > 1 ? "S" : ""}`;
    const desc = plein ? `Assez de toits pour le ${P.STATUTS[S.statut].nom.toLowerCase()} : un toit de plus n'apportera personne.` : B.desc;
    h += `<div class="carte${e ? " non" : ""}" data-b="${b}"><canvas width="36" height="36" data-s="${b}"></canvas><span class="nom">${B.nom} <small>${info}</small><small class="desc${plein ? " alerte" : ""}">${desc}</small>${bloque ? "" : cout(R.coutBat(S, b))}</span></div>`;
  }
  return h;
}
function volColonie(){
  const S = J.S, P = R.reglages(S.mods), mo = R.moral(S), st = P.STATUTS[S.statut], suiv = P.STATUTS[S.statut + 1];
  const NOMS = {variete: "Nourriture variée (2 sortes)", vetements: "Vêtements", pain: "Du pain", famine: "Famine !"};
  const V = window.TerresVie;
  let h = `<h3><span>${st.nom}</span><span>MORAL ${Math.round(mo.mult * 100)} %</span></h3><p>${V.NOMS[V.saison(S)]} DE L'AN ${V.annee(S)}${V.pluie(S) ? (V.saison(S) === 3 ? " · IL NEIGE" : " · IL PLEUT") : ""}${V.nuit(S) > .5 ? " · LA NUIT" : ""}</p>`;
  h += mo.det.length ? mo.det.map(d => `<div class="besoin ${d.ok ? "ok" : "non"}"><i>${d.ok ? "+" : "-"}</i>${NOMS[d.k]}</div>`).join("") : `<p>Pas encore de besoins : à 6 habitants, il faudra varier la nourriture.</p>`;
  if (suiv){
    h += `<h3 style="margin-top:8px"><span>DEVENIR ${suiv.nom}</span></h3><p>Jusqu'à ${suiv.popMax} habitants et de nouveaux bâtiments.</p>${conditions(suiv.pop, suiv.cout)}
      <button type="button" class="bouton or" data-act="statut"${R.peutMonter(S) ? " disabled" : ""}>FONDER LE ${suiv.nom}</button>`;
  } else {
    const L = P.LOI;
    h += `<h3 style="margin-top:8px"><span>${L.nom}</span></h3><p>La Loi de l'ère 1.</p>${conditions(L.pop, L.cout)}`;
    h += S.loi ? `<p>Promulguée !</p>` : `<button type="button" class="bouton or" data-act="loi"${R.peutPromulguer(S) ? " disabled" : ""}>PROMULGUER</button>`;
  }
  return h;
}
// les conditions d'un statut ou de la Loi : une ligne par condition, grande icône, ce qu'on a / ce qu'il faut, cochée quand c'est bon
function conditions(pop, c){
  const S = J.S, ligne = (ok, icone, a, n, nom) => `<div class="cond ${ok ? "ok" : "non"}"><i>${ok ? "✔" : "✘"}</i>${icone}<b>${a} / ${n}</b><span>${nom}</span></div>`;
  return `<div class="conds">${ligne(S.pop >= pop, `<canvas class="ic" width="30" height="30" data-p="0"></canvas>`, S.pop, pop, "HABITANTS")}`
    + Object.entries(c).map(([r, n]) => ligne(S.res[r] + 1e-9 >= n, ic(r), fmt(S.res[r]), fmt(n), nomRes(r))).join("") + `</div>`;
}
const VOLETS = {villageois: volVillageois, construire: volConstruire, colonie: volColonie};
function majVolet(force){
  const p = $("panneau");
  if (!onglet){ p.hidden = true; return; }
  p.hidden = false;
  const h = VOLETS[onglet]();
  if (h === contenu && !force) return;
  contenu = h; const haut = p.scrollTop; p.innerHTML = h; p.scrollTop = haut;
  p.querySelectorAll("canvas[data-i]").forEach(c => miniature(c, window.Terres.AT, null, c.dataset.i));
  p.querySelectorAll("canvas[data-s]").forEach(c => miniature(c, null, c.dataset.s));
  p.querySelectorAll("canvas[data-p]").forEach(c => portrait(c, +c.dataset.p));
}
const MINI = {champ: "champ-mur", carriere: "rocher", ponton: null, bergerie: "grange"};
function miniature(c, _, b, r){
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
  let n = r ? ({bois: "i-bois", pierre: "i-pierre", baies: "i-baies", poisson: "i-poisson", ble: "i-ble", farine: "i-farine", pain: "i-pain", laine: "i-laine", vetements: "i-tissu"})[r] : (b in MINI ? MINI[b] : (J.spriteDe(b, "a") || [])[0]);
  if (b === "ponton"){ g.fillStyle = "#4a8ab8"; g.fillRect(0, 22, 36, 14); g.fillStyle = "#a8743f"; for (let k = 0; k < 5; k++) g.fillRect(4 + k * 6, 6, 5, 24); return; }
  if (!n) return; const p = J.piece(n), k = Math.min(c.width / p.width, c.height / p.height);
  g.drawImage(p, (c.width - p.width * k) / 2, (c.height - p.height * k) / 2, p.width * k, p.height * k);
}
document.querySelector(".onglets").addEventListener("click", e => {
  const b = e.target.closest("[data-onglet]"); if (!b) return;
  onglet = onglet === b.dataset.onglet ? null : b.dataset.onglet; contenu = ""; bulle(null);
  document.querySelectorAll("[data-onglet]").forEach(x => x.classList.toggle("on", x.dataset.onglet === onglet));
  majVolet(true);
});
$("panneau").addEventListener("click", e => {
  const S = J.S, el = e.target.closest("button, .carte[data-b]"); if (!el) return;
  let err = null;
  if (el.dataset.m) err = R.affecter(S, el.dataset.m, +el.dataset.d);
  else if (el.dataset.act === "recruter") err = R.recruter(S);
  else if (el.dataset.act === "statut") err = R.monterStatut(S);
  else if (el.dataset.act === "loi"){ err = R.promulguer(S); if (!err) $("fin").hidden = false; }
  else if (el.dataset.b){ err = R.peutConstruire(S, el.dataset.b); if (!err) choisir(el.dataset.b); }
  if (err) annonce(err, false); else J.sauver();
  majVolet(true); majBarre();
});

/* ---------- choisir le terrain ---------- */
function choisir(b, depuis){
  const S = J.S;
  J.PL = {b, lot: depuis || C.proposer(S, b), deplace: depuis || null};
  onglet = null; majVolet(); document.querySelectorAll("[data-onglet]").forEach(x => x.classList.remove("on"));
  document.querySelector(".onglets").hidden = true; $("placement").hidden = false;
  if (J.PL.lot) J.viser(J.PL.lot);
  placement();
}
function placement(){
  const P = J.PL; if (!P) return; const nom = DON.BATIMENTS[P.b].nom;
  $("placeTexte").textContent = P.deplace ? (P.lot === P.deplace ? `Touche un terrain libre pour y déplacer : ${nom}.` : `Déplacer ici : ${nom} ? La rue suit.`)
    : `${nom} : le terrain proposé brille. Touche un autre terrain libre pour changer d'avis.`;
  $("bPoser").textContent = P.deplace ? "DEPLACER ICI" : "BATIR ICI";
  $("bPoser").disabled = !P.lot || (P.deplace && P.lot === P.deplace);
}
function finPlacement(){ J.PL = null; $("placement").hidden = true; document.querySelector(".onglets").hidden = false; }
$("bPoser").onclick = () => {
  const S = J.S, P = J.PL; if (!P) return;
  const err = P.deplace ? R.deplacer(S, P.deplace, P.lot) : R.construire(S, P.b, P.lot);
  if (err) annonce(err, false); else { annonce(P.deplace ? DON.BATIMENTS[P.b].nom + " DEPLACE" : "CHANTIER : " + DON.BATIMENTS[P.b].nom, true); J.sauver(); }
  finPlacement();
};
$("bAnnulerP").onclick = finPlacement;

/* ---------- la bulle d'un bâtiment ---------- */
let bulleLot = null;
function bulle(id){
  bulleLot = id; const el = $("bulle"); if (!id){ el.hidden = true; return; }
  const S = J.S, b = S.lots[id], B = DON.BATIMENTS[b], ch = S.chantiers.find(c => c.lot === id);
  const metiers = Object.keys(DON.METIERS).filter(m => DON.METIERS[m].places[b]);
  const qui = metiers.map(m => `${DON.METIERS[m].nom} : ${S.jobs[m]}/${R.places(S, m)}`).join("<br>");
  el.innerHTML = `<b>${B.nom}</b>${ch ? `Chantier : encore ${Math.ceil(ch.reste)} s` : B.logement ? `Loge ${B.logement} habitants` : qui || ""}
    <div class="rang"><button type="button" class="bouton petit" data-x="dep">DEPLACER</button><button type="button" class="bouton petit" data-x="ok">OK</button></div>`;
  el.hidden = false; placerBulle();
}
function placerBulle(){
  if (!bulleLot) return; const L = C.LOTS[bulleLot], [sx, sy] = J.versEcran((L.x + L.l / 2) * C.T, L.y * C.T);
  const el = $("bulle"); el.style.left = Math.max(80, Math.min(innerWidth - 80, sx)) + "px"; el.style.top = Math.max(150, sy) + "px";
}
$("bulle").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; const id = bulleLot; bulle(null);
  if (b.dataset.x === "dep") choisir(J.S.lots[id], id);
});

/* ---------- messages ---------- */
let minuteur = 0;
function annonce(txt, bon){
  const el = $("banniere"); el.textContent = txt; el.classList.toggle("mal", !bon); el.classList.add("vu");
  clearTimeout(minuteur); minuteur = setTimeout(() => el.classList.remove("vu"), 2200);
}

/* ---------- menus ---------- */
$("bMenu").onclick = () => { $("menu").hidden = false; J.sauver(); };
$("bReprendre").onclick = () => { $("menu").hidden = true; };
$("bAide").onclick = () => { $("aideTexte").hidden = !$("aideTexte").hidden; };
$("bNouvelle").onclick = () => { if (confirm("Recommencer une nouvelle colonie ? La vallee actuelle sera perdue.")){ J.nouvelle(); $("menu").hidden = true; onglet = null; majVolet(); finPlacement(); } };
$("zPlus").onclick = () => J.zoom(1); $("zMoins").onclick = () => J.zoom(-1);
$("bRetour").onclick = () => { $("retour").hidden = true; };
$("bFin").onclick = () => { $("fin").hidden = true; };
function duree(s){ const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} H ${String(m).padStart(2, "0")}` : `${m} MIN`; }
function retour(r){
  if (!r) return;
  const g = Object.entries(r.gains).filter(([, n]) => n > 0);
  $("retourSous").innerHTML = `ABSENCE : ${duree(r.absence)}<br>LA COLONIE A TRAVAILLE AU ${Math.round(r.rendement * 100)} %${r.plafonne ? `<br>(${duree(r.duree)} AU PLUS)` : ""}`;
  $("retourGains").innerHTML = g.length ? g.map(([k, n]) => `<span>${ic(k)} +${fmt(n)}</span>`).join("") : "<span>Rien de neuf : personne ne travaillait.</span>";
  $("retour").hidden = false;
}

/* ---------- le clavier (PC) : 1 2 3 = les volets, Échap = fermer / annuler / menu, Entrée = bâtir ici ---------- */
addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  const ouvert = [...document.querySelectorAll(".ecran:not([hidden])")].filter(x => x.id !== "chargement");
  if (e.key === "Escape"){
    e.preventDefault();
    if (ouvert.length) ouvert.forEach(x => { x.hidden = true; });
    else if (J.PL) finPlacement();
    else if (bulleLot) bulle(null);
    else if (onglet) document.querySelector(`[data-onglet="${onglet}"]`).click();
    else $("bMenu").click();
    return;
  }
  if (ouvert.length) return;
  if (e.key === "Enter" && J.PL){ e.preventDefault(); if (!$("bPoser").disabled) $("bPoser").click(); return; }
  const n = ["1", "2", "3"].indexOf(e.key);
  if (n >= 0 && !J.PL){ e.preventDefault(); document.querySelectorAll("[data-onglet]")[n].click(); }
});

let derniere = 0;
window.TerresEcran = {
  annonce, bulle, placement, retour,
  depart(recap){ majBarre(); retour(recap); },
  image(t){ if (t - derniere > .25){ derniere = t; majBarre(); majVolet(); } placerBulle(); }
};
})();

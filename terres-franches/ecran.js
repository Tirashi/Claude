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
  let h = liste.map(r => { const v = t[r] * 60, tx = Math.abs(v) < .05 ? `<small class="tx"></small>` : `<small class="tx${v < 0 ? " moins" : ""}">${v > 0 ? "+" : ""}${Math.abs(v) < 10 ? v.toFixed(1) : Math.round(v)}</small>`;
    const cap = R.capacite(S, r), f = Math.min(1, S.res[r] / cap), pl = f > .985;
    return `<span class="${pl ? "plein" : f > .8 ? "presque" : ""}" title="${nomRes(r)} : ${fmt(S.res[r])} / ${fmt(cap)}">${ic(r)}<b>${fmt(S.res[r])}</b><small class="max">/${fmt(cap)}</small>${pl ? "<small class='tx pl'>PLEIN</small>" : tx}<i class="jauge"><i style="width:${Math.round(f * 100)}%"></i></i></span>`; }).join("");
  const lib = R.libres(S);
  h += `<span title="Habitants"><canvas class="ic portrait" width="30" height="30"></canvas><b>${S.pop}/${R.popMax(S)}</b>${lib ? `<em class="libres" title="Sans métier">${lib} LIBRE${lib > 1 ? "S" : ""}</em>` : ""}</span>`;
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
  const lib = R.libres(S);
  let h = `<h3><span>HABITANTS ${S.pop}/${R.popMax(S)}</span></h3>`;
  h += `<div class="sans ${lib ? "oui" : ""}"><b>${lib}</b><span>${lib ? `villageois sans métier : donne-${lib > 1 ? "leur" : "lui"} un travail avec <i>+</i>` : "Tout le monde travaille."}</span></div>`;
  // la limite : les toits (tente et feu, cabanes, maisons) ou le statut de la colonie, le plus petit des deux
  // la limite du statut compte les améliorations (tentes d'appoint, droit d'accueil)
  const toits = R.logement(S), lim = R.plafondStatut(S), bonus = R.eff(S, "pop"), suiv = P.STATUTS[S.statut + 1];
  h += `<p class="limite">Toits : <b>${toits}</b> · ${P.STATUTS[S.statut].nom} : <b>${lim}</b> au plus${bonus ? ` (${P.STATUTS[S.statut].popMax} + ${bonus} par les améliorations)` : ""}<br>${S.pop < R.popMax(S) ? "Il reste de la place : accueille quelqu'un."
    : toits < lim ? "Il manque des toits : construis une cabane." : suiv ? `Le ${P.STATUTS[S.statut].nom.toLowerCase()} est plein : il faut devenir ${suiv.nom.toLowerCase()} (volet COLONIE).` : "Plafond de l'ère : promulgue la Loi."}</p>`;
  const c = R.coutRecrue(S);
  h += `<div class="carte"><canvas width="30" height="30" class="portrait" data-p="${S.pop}"></canvas><span class="nom">ACCUEILLIR<small>${cout(c)} <em>vivres = baies, poisson ou pain</em></small></span><button type="button" class="bouton petit or" data-act="recruter">+1</button></div>`;
  for (const m in P.METIERS){
    const M = P.METIERS[m], pl = R.places(S, m); if (!pl) continue;
    const bl = R.blesses(S), r = M.defend ? "armes" : M.produit || M.sortie;
    const par = M.defend ? `DEFEND LES RESERVES${bl ? ` · ${bl} BLESSE${bl > 1 ? "S" : ""}` : ""}${S.jobs[m] ? ` · ${R.gardesArmes(S)} ARME${R.gardesArmes(S) > 1 ? "S" : ""}` : ""}`
      : M.produit ? `${(t[r] * 60 >= 0 ? "+" : "")}${(t[r] * 60).toFixed(1)} ${nomRes(r)}/MIN` : `${Object.keys(M.entree).map(nomRes).join(" + ")} → ${nomRes(r)}`;
    h += `<div class="carte"><canvas width="36" height="36" data-i="${r}"></canvas><span class="nom">${M.nom}<small>${par}</small></span>
      <span class="pm"><button type="button" class="carre" data-m="${m}" data-d="-1" aria-label="Retirer">−</button><b>${S.jobs[m]}/${pl}</b><button type="button" class="carre" data-m="${m}" data-d="1" aria-label="Ajouter">+</button></span></div>`;
  }
  return h;
}
function volConstruire(){
  const S = J.S, P = R.reglages(S.mods); let h = "";
  for (const b of Object.keys(P.BATIMENTS).sort((u, v) => P.BATIMENTS[u].statut - P.BATIMENTS[v].statut)){   // dans l'ordre où l'on peut bâtir
    const B = P.BATIMENTS[b], e = R.peutConstruire(S, b), bloque = B.statut > S.statut, libres = C.libres(S, B.terrain).length;
    const plein = B.logement && !bloque && R.logement(S) >= R.plafondStatut(S);   // assez de toits : le statut limite
    if (B.niveaux && !B.stock && S.bat[b] + S.chantiers.filter(c => c.k === b).length > 0){   // caserne, tour, forge déjà là : on l'agrandit (s'il y a des niveaux)
      const n = S.bat[b], tr = S.chantiers.some(c => c.k === b), mx = n >= B.niveaux;
      const inf = tr ? (n ? "AGRANDISSEMENT EN COURS" : "EN CHANTIER") : mx ? (B.niveaux > 1 ? `NIVEAU ${n} : MAXIMAL` : "DEJA CONSTRUITE") : `NIVEAU ${n} → ${n + 1}`;
      h += `<div class="carte${e ? " non" : ""}" data-b="${b}"><canvas width="36" height="36" data-s="${b}"></canvas><span class="nom">${mx || tr ? "" : "AGRANDIR : "}${B.nom} <small>${inf}</small><small class="desc">${B.desc}</small>${mx || tr ? "" : cout(R.coutBat(S, b))}</span></div>`;
      continue;
    }
    if (B.niveaux && S.bat[b] + S.chantiers.filter(c => c.k === b).length > 0){   // une réserve déjà là : on l'agrandit
      const n = S.bat[b], tr = S.chantiers.some(c => c.k === b), mx = n >= B.niveaux, r0 = P.STOCK.groupes[B.stock][0];
      const inf = tr ? "AGRANDISSEMENT EN COURS" : mx ? `NIVEAU ${n} : MAXIMAL` : `NIVEAU ${n} → ${n + 1}`;
      h += `<div class="carte${e ? " non" : ""}" data-b="${b}"><canvas width="36" height="36" data-s="${b}"></canvas><span class="nom">AGRANDIR : ${B.nom} <small>${inf}</small><small class="desc">${nomRes(r0)} : ${fmt(R.capacite(S, r0))}${mx || tr ? "" : " → " + fmt(R.capacite(S, r0) * 2)} au plus. ${B.desc}</small>${mx || tr ? "" : cout(R.coutBat(S, b))}</span></div>`;
      continue;
    }
    const info = bloque ? `IL FAUT LE ${P.STATUTS[B.statut].nom}` : !libres ? "PLUS DE TERRAIN" : `${libres} TERRAIN${libres > 1 ? "S" : ""} LIBRE${libres > 1 ? "S" : ""}`;
    const desc = plein ? `Assez de toits pour le ${P.STATUTS[S.statut].nom.toLowerCase()} : un toit de plus n'apportera personne.` : B.desc;
    h += `<div class="carte${e ? " non" : ""}" data-b="${b}"><canvas width="36" height="36" data-s="${b}"></canvas><span class="nom">${B.nom} <small>${info}</small><small class="desc${plein ? " alerte" : ""}">${desc}</small>${bloque ? "" : cout(R.coutBat(S, b))}</span></div>`;
  }
  return h;
}
function volColonie(){
  const S = J.S, P = R.reglages(S.mods), mo = R.moral(S), st = P.STATUTS[S.statut], suiv = P.STATUTS[S.statut + 1];
  const NOMS = {fetes: "Jours de fête", variete: "Nourriture variée (2 sortes)", vetements: "Vêtements", pain: "Du pain", chauffage: "Bois pour se chauffer (hiver)", famine: "Famine !"};
  const V = window.TerresVie;
  let h = `<h3><span>${st.nom}</span><span>MORAL ${Math.round(mo.mult * 100)} %</span></h3><p>${V.NOMS[V.saison(S)]} DE L'AN ${V.annee(S)}${V.pluie(S) ? (V.saison(S) === 3 ? " · IL NEIGE" : " · IL PLEUT") : ""}${V.nuit(S) > .5 ? " · LA NUIT" : ""}</p>${R.hiver(S) ? `<p class="limite">L'hiver : chaque habitant brûle du bois et mange un peu plus. Sans bois, le moral baisse.</p>` : R.saison(S) === 2 ? `<p class="limite">L'automne : fais des réserves de bois et de nourriture pour l'hiver.</p>` : ""}`;
  h += mo.det.length ? mo.det.map(d => `<div class="besoin ${d.ok ? "ok" : "non"}"><i>${d.ok ? "+" : "-"}</i>${NOMS[d.k]}</div>`).join("") : `<p>Pas encore de besoins : à 6 habitants, il faudra varier la nourriture.</p>`;
  h += pillards();
  if (suiv){
    h += `<h3 style="margin-top:8px"><span>DEVENIR ${suiv.nom}</span></h3><p>Jusqu'à ${suiv.popMax + R.eff(S, "pop")} habitants${R.eff(S, "pop") ? ` (dont ${R.eff(S, "pop")} par les améliorations)` : ""} et de nouveaux bâtiments.</p>${conditions(suiv.pop, suiv.cout)}
      <button type="button" class="bouton or" data-act="statut"${R.peutMonter(S) ? " disabled" : ""}>FONDER LE ${suiv.nom}</button>`;
  } else {
    const L = P.LOI, suite = P.ERES[(S.ere || 1) + 1] && P.POINTS_LOI[S.ere || 1];
    h += `<h3 style="margin-top:8px"><span>${L.nom}</span></h3><p>La Loi de l'ère ${S.ere || 1}${suite ? ` : elle rapporte ${P.POINTS_LOI[S.ere || 1]} points de Loi et permet de fonder une nouvelle colonie` : ""}.</p>${conditions(L.pop, L.cout)}`;
    h += !S.loi ? `<button type="button" class="bouton or" data-act="loi"${R.peutPromulguer(S) ? " disabled" : ""}>PROMULGUER</button>`
      : suite ? `<p>Promulguée !</p><button type="button" class="bouton or" data-act="fonder">CHOISIR LES LOIS ET FONDER</button>`
      : `<p>Promulguée ! La suite de l'ère ${S.ere} (la côte et sa Loi) arrive bientôt.</p>`;
  }
  return h;
}
// les pillards (à partir du hameau) : ce qui est à l'abri, la garde, la dernière bande
function pillards(){
  const S = J.S, P = R.reglages(S.mods); if (!P.RAIDS.intervalle[S.statut]) return "";
  const d = Math.round(R.defense(S)), f = Math.round(R.forceBande(S)), dern = S.raids[S.raids.length - 1];
  let h = `<h3 style="margin-top:8px"><span>PILLARDS</span><span>${S.raid.phase ? "ILS ARRIVENT !" : ""}</span></h3>`;
  h += `<p class="limite">Une bande vient de temps en temps voler les réserves. À l'abri : <b>${Math.round(R.abri(S, "baies") * 100)} %</b> des vivres, <b>${Math.round(R.abri(S, "bois") * 100)} %</b> des matériaux (agrandis le grenier et l'aire).<br>`
    + `Garde : <b>${d}</b> contre une bande d'environ <b>${f}</b>${S.bat.caserne ? "" : " (construis une caserne)"}${S.bat.tour ? "" : " · une tour de guet donne l'alerte plus tôt"}.</p>`;
  if (dern) h += `<p>Dernière bande : ${dern.repousse ? "repoussée par la garde" : Object.keys(dern.vole).length ? "elle a volé " + Object.entries(dern.vole).map(([r, n]) => n + " " + nomRes(r).toLowerCase()).join(", ") : "repartie les mains vides"}${dern.blesses ? `, ${dern.blesses} garde(s) blessé(s)` : ""}.</p>`;
  return h;
}
// les conditions d'un statut ou de la Loi : une ligne par condition, grande icône, ce qu'on a / ce qu'il faut, cochée quand c'est bon
function conditions(pop, c){
  const S = J.S, ligne = (ok, icone, a, n, nom) => `<div class="cond ${ok ? "ok" : "non"}"><i>${ok ? "✔" : "✘"}</i>${icone}<b>${a} / ${n}</b><span>${nom}</span></div>`;
  return `<div class="conds">${ligne(S.pop >= pop, `<canvas class="ic" width="30" height="30" data-p="0"></canvas>`, S.pop, pop, "HABITANTS")}`
    + Object.entries(c).map(([r, n]) => ligne(S.res[r] + 1e-9 >= n, ic(r), fmt(S.res[r]), fmt(n), nomRes(r))
      + (R.capacite(S, r) < n ? `<div class="cond non place"><i>!</i><span>Pas assez de place : ${fmt(R.capacite(S, r))} ${nomRes(r).toLowerCase()} au plus. Agrandis ${R.gardien(S, r) === "grenier" ? "le grenier" : "l'aire de stockage"}.</span></div>` : "")).join("") + `</div>`;
}
// ordonnances et équipements : une carte par amélioration (on la touche pour l'acheter)
const ICONES_ORD = {outils: "souche-hache", panier: "panier-baies", hottes: "tonneaux", coupes: "souche", ateres: "buche", pioche: "rocher-p", chemins: "pave",
  serrures: "caisse-p", palissade: "souche", guetteurs: "tour", exercice: "ratelier", soins: "panier-legumes",
  tentes: "chaume2", etageres: "caisse", faucille: "i-ble", engrais: "botte", meules: "sac-farine", pelles: "panier-patates", forces: "i-laine", metiers: "i-tissu", conserves: "sechoir-poisson", fetes: "tonneau", charpente: "chantier", accueil: "chaume1", hospitalite: "panier-pommes"};
function volAmeliorer(){
  const S = J.S, P = R.reglages(S.mods), O = P.ORDONNANCES; let h = `<p class="limite">Ordonnances et équipements : chaque niveau s'ajoute au précédent.</p>`;
  for (const id of Object.keys(O).sort((a, b) => O[a].statut - O[b].statut)){
    const o = O[id], n = (S.ord || {})[id] || 0, e = R.peutAcheter(S, id), bloque = o.statut > S.statut, mx = n >= o.niveaux;
    const info = bloque ? `IL FAUT LE ${P.STATUTS[o.statut].nom}` : mx ? `NIVEAU ${n} : MAXIMAL` : o.niveaux > 1 ? `NIVEAU ${n} → ${n + 1} (SUR ${o.niveaux})` : o.type === "equipement" ? "EQUIPEMENT" : "ORDONNANCE";
    h += `<div class="carte${e ? " non" : ""}" data-o="${id}"><canvas width="36" height="36" data-m="${ICONES_ORD[id] || ""}"></canvas><span class="nom">${o.nom} <small>${info}</small><small class="desc">${o.desc}</small>${bloque || mx ? "" : cout(R.coutOrd(S, id))}</span></div>`;
  }
  return h;
}
const VOLETS = {villageois: volVillageois, construire: volConstruire, ameliorer: volAmeliorer, colonie: volColonie};
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
  p.querySelectorAll("canvas[data-m]").forEach(c => { if (!c.dataset.m) return; const g = c.getContext("2d"), q = J.piece(c.dataset.m), k = Math.min(36 / q.width, 36 / q.height); g.imageSmoothingEnabled = false; g.drawImage(q, (36 - q.width * k) / 2, (36 - q.height * k) / 2, q.width * k, q.height * k); });
}
const MINI = {champ: "champ-mur", carriere: "rocher", ponton: null, bergerie: "grange", grenier: "grange", aire: "i-bois", tour: "tour", caserne: "caserne", forge: "forge"};
function miniature(c, _, b, r){
  const g = c.getContext("2d"); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
  let n = r ? J.ICONE[r] : (b in MINI ? MINI[b] : (J.spriteDe(b, "a") || [])[0]);
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
  const S = J.S, el = e.target.closest("button, .carte[data-b], .carte[data-o]"); if (!el) return;
  let err = null;
  if (el.dataset.m) err = R.affecter(S, el.dataset.m, +el.dataset.d);
  else if (el.dataset.act === "recruter") err = R.recruter(S);
  else if (el.dataset.act === "statut") err = R.monterStatut(S);
  else if (el.dataset.act === "loi"){ err = R.promulguer(S); if (!err) fin(); }
  else if (el.dataset.act === "fonder"){ ecranLois("choix"); return; }
  else if (el.dataset.o){ err = R.acheter(S, el.dataset.o); }
  else if (el.dataset.b){
    const b = el.dataset.b, B = DON.BATIMENTS[b];
    if (!b) return;
    err = R.peutConstruire(S, b);
    if (!err && B.niveaux && S.bat[b] > 0){ err = R.construire(S, b); if (!err) annonce("AGRANDISSEMENT : " + B.nom, true); }   // sur place, sans choisir de terrain
    else if (!err) choisir(b);
  }
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
  el.innerHTML = `<div id="bInfo">${infoBulle(id)}</div>
    <div class="rang">${B.niveaux > 1 ? `<button type="button" class="bouton petit or" data-x="up">AGRANDIR</button>` : ""}<button type="button" class="bouton petit" data-x="dep">DEPLACER</button><button type="button" class="bouton petit" data-x="ok">OK</button></div>`;
  el.hidden = false; placerBulle();
}
// le texte de la bulle (refait 4 fois par seconde : le minuteur du chantier baisse)
function infoBulle(id){
  const S = J.S, b = S.lots[id]; if (!b) return ""; const B = DON.BATIMENTS[b], ch = S.chantiers.find(c => c.lot === id);
  const qui = Object.keys(DON.METIERS).filter(m => DON.METIERS[m].places[b]).map(m => `${DON.METIERS[m].nom} : ${S.jobs[m]}/${R.places(S, m)}`).join("<br>");
  const res = B.stock ? DON.STOCK.groupes[B.stock].map(r => `${nomRes(r).toLowerCase()} ${fmt(S.res[r])}/${fmt(R.capacite(S, r))}`).join("<br>") : "";
  const garde = b === "caserne" && S.bat.caserne ? `<br>Défense ${Math.round(R.defense(S))}${R.blesses(S) ? ` · ${R.blesses(S)} blessé(s)` : ""}` : b === "tour" && S.bat.tour ? `Alerte ${R.annonce(S)} s avant l'arrivée des pillards` : "";
  return `<b>${B.nom}${B.niveaux > 1 ? " · NIV. " + S.bat[b] : ""}</b>${ch ? `${ch.agrandit ? "Agrandissement" : "Chantier"} : encore ${Math.ceil(ch.reste)} s<br>` : ""}${B.logement ? `Loge ${B.logement} habitants` : (res || qui || "") + garde}`;
}
function placerBulle(){
  if (!bulleLot) return; const L = C.LOTS[bulleLot], [sx, sy] = J.versEcran((L.x + L.l / 2) * C.T, L.y * C.T);
  const el = $("bulle"); el.style.left = Math.max(80, Math.min(innerWidth - 80, sx)) + "px"; el.style.top = Math.max(150, sy) + "px";
}
$("bulle").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return; const id = bulleLot; bulle(null);
  if (b.dataset.x === "dep") choisir(J.S.lots[id], id);
  if (b.dataset.x === "up"){ const k = J.S.lots[id], e = R.construire(J.S, k); annonce(e || "AGRANDISSEMENT : " + DON.BATIMENTS[k].nom, !e); if (!e) J.sauver(); }
});

/* ---------- messages ---------- */
let minuteur = 0;
function annonce(txt, bon){
  const el = $("banniere"); el.textContent = txt; el.classList.toggle("mal", !bon); el.classList.add("vu");
  clearTimeout(minuteur); minuteur = setTimeout(() => el.classList.remove("vu"), 2200);
}

/* ---------- menus ---------- */
$("bMenu").onclick = () => { const S = J.reel; $("menuSous").textContent = `ERE ${S.ere || 1} · ${MAJ(nomColonie(S))}`; $("menu").hidden = false; J.sauver(); };
$("bReprendre").onclick = () => { $("menu").hidden = true; };
$("bAide").onclick = () => { $("aideTexte").hidden = !$("aideTexte").hidden; };
$("bNouvelle").onclick = () => { if (confirm(J.reel.ere > 1 ? "Recommencer cette colonie depuis le campement ? Elle sera perdue (les Lois et les autres terres restent)." : "Recommencer une nouvelle colonie ? La vallee actuelle sera perdue.")){ J.nouvelle(); $("menu").hidden = true; onglet = null; majVolet(); finPlacement(); } };
$("zPlus").onclick = () => J.zoom(1); $("zMoins").onclick = () => J.zoom(-1);
$("bRetour").onclick = () => { $("retour").hidden = true; };
$("bFin").onclick = () => { $("fin").hidden = true; };

/* ---------- le prestige : la Charte, l'arbre des Lois, le nom de la nouvelle colonie, mes terres, la visite ---------- */
const MAJ = t => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();   // Press Start 2P : pas de majuscules accentuées
const nomColonie = S => S.nom || DON.ERES[S.ere || 1].nom;
const pts = n => `${n} POINT${n > 1 ? "S" : ""}`;
const NOMS_COTE = ["Port-Clair", "Anse-aux-Mouettes", "Havre-du-Vent", "Roche-Blanche", "Pointe-des-Sables", "Baie-d'Ambre", "Cap-du-Large", "Grève-aux-Phoques",
  "Port-Joli", "Anse-Dorée", "Havre-de-Grâce", "Roche-aux-Goélands", "Pointe-Bleue", "Baie-des-Brumes"];
const auHasard = () => NOMS_COTE[Math.floor(Math.random() * NOMS_COTE.length)];
// la Loi de l'ère promulguée : ses points vont dans terres.lois
function fin(){
  const n = J.recompenser();
  $("finPoints").innerHTML = n ? `Elle te rapporte <b>${pts(n)} de Loi</b>.` : "";
  $("bFinLois").hidden = !n; $("fin").hidden = false;
}
$("bFinLois").onclick = () => { $("fin").hidden = true; ecranLois("choix"); };
let loisMode = "lecture";
function ecranLois(mode){ loisMode = mode; majLois(); $("loisEcran").hidden = false; }
function majLois(){
  const L = J.lois(), mods = J.reel.mods, P = R.reglages(mods), choix = loisMode === "choix", br = {};
  for (const id in P.LOIS) (br[P.LOIS[id].branche] = br[P.LOIS[id].branche] || []).push(id);
  $("loisSous").textContent = choix ? `${pts(L.points)} A DEPENSER` : `${pts(L.points)} DE COTE`;
  $("arbre").innerHTML = Object.entries(br).map(([b, ids]) => `<div class="branche"><h3>${b}</h3>${ids.map(id => {
    const X = P.LOIS[id], pr = L.prises.includes(id), e = R.peutPrendreLoi(L, id, mods), cl = pr ? "prise" : (!e && choix) ? "possible" : "ferme";
    return `<button type="button" class="loi ${cl}" data-loi="${id}"><b>${X.nom}</b><span>${X.desc}</span><i>${pr ? "PRISE" : pts(X.points)}</i></button>`; }).join("")}</div>`).join("");
  $("loisBas").innerHTML = choix
    ? `<button type="button" class="bouton or" data-l="nom">FONDER UNE NOUVELLE COLONIE</button><button type="button" class="bouton" data-l="fermer">PLUS TARD</button>`
    : `<p class="note">Les Lois se choisissent quand une colonie promulgue sa Loi (la Charte du Village pour la vallée) ; elles valent pour les colonies fondées ensuite.</p><button type="button" class="bouton or" data-l="fermer">FERMER</button>`;
}
$("loisEcran").addEventListener("click", e => {
  const b = e.target.closest("[data-loi], [data-l]"); if (!b) return;
  if (b.dataset.l === "fermer"){ $("loisEcran").hidden = true; return; }
  if (b.dataset.l === "nom"){ $("loisEcran").hidden = true; ecranNom(); return; }
  if (loisMode !== "choix" || !b.classList.contains("possible")) return;
  const id = b.dataset.loi, X = R.reglages(J.reel.mods).LOIS[id];
  if (!confirm(`Prendre la Loi ${X.nom} pour ${X.points} point${X.points > 1 ? "s" : ""} ? Elle vaudra pour toutes les colonies suivantes.`)) return;
  const L = J.lois(), err = R.prendreLoi(L, id, J.reel.mods);
  if (err) annonce(err, false); else { J.sauverLois(L); annonce("LOI PRISE : " + X.nom, true); }
  majLois();
});
function ecranNom(){
  const L = J.lois(), P = R.reglages(J.reel.mods);
  $("nomColonie").value = auHasard();
  $("nomLois").textContent = (L.prises.length ? "Lois : " + L.prises.map(id => P.LOIS[id].nom.toLowerCase()).join(", ") + "." : "Aucune Loi prise.")
    + (L.points ? ` Il te reste ${L.points} point${L.points > 1 ? "s" : ""} : ${L.points > 1 ? "ils seront gardés" : "il sera gardé"} pour plus tard.` : "")
    + " En attendant la carte de la côte, la nouvelle colonie s'installe dans une vallée semblable.";
  $("nomEcran").hidden = false;
}
$("bAutreNom").onclick = () => { $("nomColonie").value = auHasard(); };
$("bNomRetour").onclick = () => { $("nomEcran").hidden = true; ecranLois("choix"); };
$("bFonder").onclick = () => {
  const nom = $("nomColonie").value.replace(/\s+/g, " ").trim().slice(0, 22) || auHasard(), err = J.fonder(nom);
  if (err){ annonce(err, false); return; }
  $("nomEcran").hidden = true; $("fin").hidden = true; onglet = null; contenu = ""; bulle(null); finPlacement();
  document.querySelectorAll("[data-onglet]").forEach(x => x.classList.remove("on")); majVolet(true);
  annonce("BIENVENUE A " + MAJ(nom), true);
};
function ecranTerres(){
  const S = J.reel, L = J.lois();
  let h = `<div class="terre"><div><b>${MAJ(nomColonie(S))}</b><small>Ère ${S.ere || 1} · ${DON.STATUTS[S.statut].nom.toLowerCase()} de ${S.pop} habitant${S.pop > 1 ? "s" : ""} · en cours</small></div></div>`;
  for (const c of L.colonies.slice().reverse())
    h += `<div class="terre"><div><b>${MAJ(c.nom)}</b><small>Ère ${c.ere} · ${(DON.STATUTS[c.statut] || DON.STATUTS[0]).nom.toLowerCase()} de ${c.pop} habitants · figée</small></div>${c.ere === 1 && J.valleeGardee() ? `<button type="button" class="bouton petit or" data-visite="1">VISITER</button>` : ""}</div>`;
  if (!L.colonies.length) h += `<p class="note">Une seule colonie pour l'instant. Au village complet, la Charte du Village permettra d'en fonder une nouvelle ; celle-ci restera à revoir ici.</p>`;
  $("terresListe").innerHTML = h; $("terresEcran").hidden = false;
}
$("bTerres").onclick = () => { $("menu").hidden = true; ecranTerres(); };
$("bTerresFermer").onclick = () => { $("terresEcran").hidden = true; };
$("bMesLois").onclick = () => { $("terresEcran").hidden = true; ecranLois("lecture"); };
$("terresListe").addEventListener("click", e => {
  if (!e.target.closest("[data-visite]")) return;
  if (!J.visiter()) return;
  $("terresEcran").hidden = true; bulle(null); finPlacement();
  $("visiteNom").textContent = MAJ(nomColonie(J.S)) + " · FIGEE"; $("visite").hidden = false;
});
function revenir(){ J.revenir(); $("visite").hidden = true; }
$("bRevenir").onclick = revenir;
function duree(s){ const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? `${h} H ${String(m).padStart(2, "0")}` : `${m} MIN`; }
function retour(r){
  if (!r) return;
  const g = Object.entries(r.gains).filter(([, n]) => n > 0);
  $("retourSous").innerHTML = `ABSENCE : ${duree(r.absence)}<br>LA COLONIE A TRAVAILLE AU ${Math.round(r.rendement * 100)} %${r.plafonne ? `<br>(${duree(r.duree)} AU PLUS)` : ""}`;
  const rr = (r.raids || []).map(b => b.repousse ? "<span>Des pillards sont venus : la garde les a repoussés.</span>" : Object.keys(b.vole).length ? `<span>Des pillards ont volé ${Object.entries(b.vole).map(([k, n]) => `${ic(k)}${fmt(n)}`).join(" ")}</span>` : "<span>Des pillards sont venus, sans rien trouver.</span>").join("");
  $("retourGains").innerHTML = (g.length ? g.map(([k, n]) => `<span>${ic(k)} +${fmt(n)}</span>`).join("") : "<span>Rien de neuf : personne ne travaillait.</span>") + rr;
  $("retour").hidden = false;
}

/* ---------- le clavier (PC) : 1 2 3 = les volets, Échap = fermer / annuler / menu, Entrée = bâtir ici ---------- */
addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  const ouvert = [...document.querySelectorAll(".ecran:not([hidden])")].filter(x => x.id !== "chargement");
  if (e.key === "Escape" && J.visite && !document.querySelector(".ecran:not([hidden]):not(#chargement)")){ e.preventDefault(); revenir(); return; }
  if (J.visite) return;
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
  const n = ["1", "2", "3", "4"].indexOf(e.key);
  if (n >= 0 && !J.PL){ e.preventDefault(); document.querySelectorAll("[data-onglet]")[n].click(); }
});

// l'alerte des pillards : un bandeau rouge tant que la bande approche
function alerte(){
  const S = J.S, el = $("alerte"), ph = S.raid && S.raid.phase; el.hidden = !ph; if (!ph) return;
  const s = Math.max(0, Math.ceil(S.raid.proch - S.t)), tx = `PILLARDS DANS ${s} S` + (ph === "approche" ? " · A L'ABRI !" : " · VUS DE LA TOUR");
  if (el.textContent !== tx) el.textContent = tx;
}
let derniere = 0;
window.TerresEcran = {
  annonce, bulle, placement, retour, fin, ouvert: () => bulleLot,
  depart(recap){ majBarre(); retour(recap); },
  image(t){ if (t - derniere > .25){ derniere = t; majBarre(); majVolet(); alerte(); const bi = $("bInfo"); if (bi && bulleLot){ const h = infoBulle(bulleLot); if (bi.innerHTML !== h) bi.innerHTML = h; } } placerBulle(); }
};
})();

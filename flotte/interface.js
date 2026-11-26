/* Flotte du bureau : les fenêtres (DOM) par-dessus la carte : Flotte, Options, Console, fiche d'un navire, carte « Retour ». */
(function () {
const F = window.Flotte = window.Flotte || {};
const R = F.R, S = F.Sim;
const $ = id => document.getElementById(id);
const fmt = n => Math.floor(n).toLocaleString("fr-FR");
const hm = ms => { const d = new Date(ms); return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };
const duree = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + " h " + String(m).padStart(2, "0") : Math.max(1, m) + " min"; };

let app = null, derniereCle = "";
const panneaux = () => [...document.querySelectorAll(".pan")].filter(p => p.id !== "pFiche" && p.id !== "pRetour");

function init(a) {
  app = a;
  const tel = () => document.body.classList.toggle("tel", window.innerWidth < 900);
  tel(); window.addEventListener("resize", tel);
  // PC : flotte et console ouvertes ; téléphone : tout est replié
  if (!document.body.classList.contains("tel")) { $("pFlotte").classList.remove("shut"); $("pConsole").classList.remove("shut"); }
  else { $("pFlotte").classList.add("shut"); }
  for (const p of panneaux()) p.querySelector("header").addEventListener("click", e => {
    if (e.target.closest("#xFiche")) return;
    const ouvre = p.classList.contains("shut");
    if (ouvre && document.body.classList.contains("tel")) for (const o of panneaux()) if (o !== p && o.id !== "pConsole") o.classList.add("shut");
    p.classList.toggle("shut");
  });
  // quantité d'achat
  $("lots").innerHTML = R.lots.map(l => '<button type="button" data-l="' + l + '" aria-pressed="false">' + (l === "max" ? "max" : "×" + l) + "</button>").join("");
  $("lots").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; app.setLot(b.dataset.l); maj(); });
  document.querySelectorAll(".buy").forEach(b => b.addEventListener("click", () => { app.acheter(b.dataset.k); maj(); }));
  // ambiances
  $("themes").innerHTML = Object.keys(F.Carte.THEMES).map(k => '<button type="button" data-t="' + k + '" aria-pressed="false">' + F.Carte.THEMES[k].nom + "</button>").join("");
  $("themes").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; app.theme(b.dataset.t); maj(); });
  // nouvelle partie : deux touchers
  let attente = 0;
  $("bNouvelle").addEventListener("click", () => {
    if (!attente) { $("bNouvelle").textContent = "Effacer ? Touche encore"; $("bNouvelle").classList.add("danger"); attente = setTimeout(() => { attente = 0; $("bNouvelle").textContent = "Nouvelle partie"; $("bNouvelle").classList.remove("danger"); }, 4000); }
    else { clearTimeout(attente); attente = 0; $("bNouvelle").textContent = "Nouvelle partie"; $("bNouvelle").classList.remove("danger"); app.nouvelle(); }
  });
  $("zPlus").addEventListener("click", () => app.zoom(1.25)); $("zMoins").addEventListener("click", () => app.zoom(1 / 1.25));
  $("zSuivre").addEventListener("click", () => app.suivre());
  $("bCine").addEventListener("click", () => app.cine(true));
  $("xFiche").addEventListener("click", () => app.fermerFiche());
  $("bRetourOk").addEventListener("click", () => { $("pRetour").hidden = true; app.fermerRetour(); });
}

function maj(E, V) {
  E = E || app.E(); V = V || app.V();
  const lot = app.lot();
  $("vCredits").textContent = "$" + fmt(E.credits); $("hCredits").textContent = "$" + fmt(E.credits);
  $("vRevenu").textContent = "+" + S.revenu(E).toFixed(1) + " / s";
  $("vNavires").textContent = E.ships.length; $("vM").textContent = S.nombre(E, "m"); $("vT").textContent = S.nombre(E, "t");
  document.querySelectorAll("#lots button").forEach(b => b.setAttribute("aria-pressed", b.dataset.l === lot));
  document.querySelectorAll("#themes button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === V.theme));
  document.querySelectorAll(".buy").forEach(b => {
    const k = b.dataset.k, n = E.buys[k];
    const qte = lot === "max" ? Math.max(1, R.lotMax(k, n, E.credits, 200)) : Number(lot);
    b.disabled = E.credits < R.cout(k, n);
    b.querySelector(".c").textContent = (qte > 1 ? qte + " × " : "") + fmt(R.coutLot(k, n, qte)) + " cr";
  });
  $("zPct").textContent = Math.round(V.z * 100) + "%";
  const a = V.sel && E.ships.includes(V.sel) ? V.sel : null;
  $("pFiche").hidden = !a;
  if (a) {
    $("fNom").textContent = a.nom; $("fRole").textContent = "Affecté : " + R.ROLE[a.type].toUpperCase();
    $("fMat").textContent = (a.type === "m" ? "M-" : "T-") + String(a.id + 1).padStart(3, "0");
    $("fMode").textContent = a.etat === "vol" ? "EN VOL" : (a.type === "m" && a.a.mine ? "AU TRAVAIL" : "À QUAI");
    $("fTrips").textContent = a.trips; $("fGains").textContent = fmt(a.earn) + " cr";
  }
  const lignes = E.logs.slice(-14), cle = lignes.length + ":" + (lignes.length ? lignes[lignes.length - 1].h : 0);
  if (cle !== derniereCle) { derniereCle = cle; $("log").innerHTML = lignes.map(l => "<div><b>" + hm(l.h) + "</b> " + l.msg.replace(/</g, "&lt;") + "</div>").join(""); $("log").scrollTop = 1e6; }
}

function retour(a, E) {
  if (a.mode !== "veille") return;
  $("rTitre").textContent = "Absent " + duree(a.duree);
  $("rTexte").textContent = "Ta flotte a continué de travailler : " + Math.round(a.part * 100) + " % des gains, soit +" + fmt(a.gain) + " crédits.";
  $("pRetour").hidden = false;
}

function cine(on) { document.body.classList.toggle("cin", !!on); }

F.UI = { init, maj, retour, cine };
})();

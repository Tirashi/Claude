/* Armateur des étoiles : le chef d'orchestre (boucle, entrées, sauvegarde, reprise). Objet de test : window.Flotte.Jeu. */
(function () {
const F = window.Flotte = window.Flotte || {};
const R = F.R, S = F.Sim, C = F.Carte, UI = F.UI, Sv = F.Save;
const hm = s => { const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + " h " + String(m).padStart(2, "0") : Math.max(1, m) + " min"; };

let E, cv, ctx;
const V = C.creerVue();
let prefs = { lot: "1", theme: "bleue", cineSuivi: false, sons: true, musique: true, volume: .7 };
let zAvant = 1, tAdapt = 0, derniere = 0, derniereAction = 0, cacheDepuis = 0, tUI = 0, tSauve = 0, cine = false, cineSuite = 0;

function redim() { C.taille(V, cv, window.innerWidth, window.innerHeight); }
const maintenant = () => performance.now() / 1000;
const actif = () => { derniereAction = maintenant(); };

function annoncer(a, E2) {
  if (a.mode === "veille") S.log(E2, "Retour après " + hm(a.duree) + " : +" + Math.floor(a.gain).toLocaleString("fr-FR") + " cr (" + Math.round(a.part * 100) + " % des gains).");
  else if (a.mode === "rattrapage") S.log(E2, "Fenêtre cachée " + hm(a.dt) + " : rattrapage complet.");
}

// Sons : chaque événement du monde (livraison, pillage, explosion…) joue son bruit, placé à gauche ou à droite selon sa place à l'écran
const SON_DE = { perte: "pillage", boom: "explosion", alerte: "alerte", tir: "tir" };
function sonsDesEvenements() {
  if (!F.Son || !E.evt.length) return;
  for (const e of E.evt) {
    const x = C.ecran(V, e.x, e.y)[0]; if (x < -50 || x > V.W + 50) continue;
    F.Son.jouer(SON_DE[e.kind] || "livraison", { pan: x / V.W * 2 - 1 });
  }
}

function suivre() {
  if (!E.ships.length) return;
  V.sel = E.ships[Math.floor(Math.random() * E.ships.length)]; V.z = 2.8;
}
function sortirCinema() { if (!cine) return; cine = false; UI.cine(false); if (prefs.cineSuivi) { V.sel = null; V.z = zAvant; } }
function entrerCinema() { cine = true; UI.cine(true); cineSuite = 0; if (prefs.cineSuivi) zAvant = V.z; }

const app = {
  E: () => E, V: () => V,
  lot: () => prefs.lot, setLot: l => { prefs.lot = l; Sv.enregistrerPrefs(prefs); },
  acheter(k) { const n = S.acheter(E, k, prefs.lot === "max" ? "max" : Number(prefs.lot)); if (n) { Sv.enregistrer(E); F.Son.jouer("achat", { role: k, n }); } return n; },
  ameliorer(k) { if (S.ameliorer(E, k)) { Sv.enregistrer(E); F.Son.jouer("amelio"); } },
  portee() {
    if (!S.ouvrirZone(E)) return false;
    const z = R.ZONES[E.lv]; UI.toast("Portée " + (E.lv + 1) + " : " + z.n, "nouvelle ressource (" + z.ore + "), nouvel avant-poste"); Sv.enregistrer(E); F.Son.jouer("zone"); return true;
  },
  acheterHorizon(k) { if (S.acheterHorizon(E, k)) { Sv.enregistrer(E); F.Son.jouer("eclat"); } },
  horizon() {
    const gain = R.eclatsPour(E.total), N = S.horizon(E); if (!N) return false;
    E = N; V.sel = null; V.z = 1; V.px = V.py = 0; V.cam = R.ZONES[E.lv].cam; V.pops = []; V.booms = [];
    UI.toast("Horizon " + E.h.n, "+" + gain + " éclats : dépense-les dans la fenêtre Horizon"); UI.ouvrir("pHorizon"); Sv.enregistrer(E); UI.maj(E, V); F.Son.jouer("horizon"); return true;
  },
  theme(n) { prefs.theme = n; Sv.enregistrerPrefs(prefs); C.theme(V, n); },
  nouvelle() { Sv.effacer(); E = S.creer(); V.sel = null; V.z = 1; V.px = V.py = 0; V.cam = R.ZONES[0].cam; V.pops = []; Sv.enregistrer(E); UI.maj(E, V); },
  pref: k => prefs[k], setPref(k, v) { prefs[k] = v; Sv.enregistrerPrefs(prefs); if (k === "sons" || k === "musique" || k === "volume") F.Son.regler({ [k]: v }); },
  cineSuivi: () => !!prefs.cineSuivi, setCineSuivi(v) { prefs.cineSuivi = !!v; Sv.enregistrerPrefs(prefs); },
  zoom(f) { C.zoomer(V, f); },
  suivre,
  cine: on => { if (on) entrerCinema(); else sortirCinema(); },
  fermerFiche() { V.sel = null; if (V.z > 1.5) V.z = 1; },
  fermerRetour() {}
};

function entrees() {
  const pts = new Map(); let dist0 = 0, z0 = 1, deplace = false;
  cv.addEventListener("pointerdown", e => {
    actif(); cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); deplace = false;
    if (pts.size === 2) { const [a, b] = [...pts.values()]; dist0 = Math.hypot(a[0] - b[0], a[1] - b[1]); z0 = V.z; }
    if (cine && pts.size === 1) { sortirCinema(); pts.clear(); }
  });
  cv.addEventListener("pointermove", e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2 && dist0 > 0) { const [a, b] = [...pts.values()]; V.z = Math.max(C.ZOOM_MIN, Math.min(C.ZOOM_MAX, z0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / dist0)); deplace = true; }
  });
  const fin = e => {
    if (!pts.has(e.pointerId)) return;
    const seul = pts.size === 1; pts.delete(e.pointerId);
    if (seul && !deplace && e.type === "pointerup") {
      const r = cv.getBoundingClientRect(), nav = C.choisir(E, V, e.clientX - r.left, e.clientY - r.top);
      V.sel = nav; if (nav && V.z < 2) V.z = 2.4;
    }
    dist0 = 0;
  };
  cv.addEventListener("pointerup", fin); cv.addEventListener("pointercancel", fin);
  cv.addEventListener("wheel", e => { e.preventDefault(); actif(); C.zoomer(V, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
  document.addEventListener("pointerdown", actif, true);
  document.addEventListener("click", e => { if (e.target.closest(".btn, .amt button, .chev, .pan header, .zoom button, .cinb") && !e.target.closest(".buy, .ub, #bHorizon")) F.Son.jouer("clic"); });
  window.addEventListener("keydown", e => {
    actif();
    if (e.key === "Escape") { if (cine) sortirCinema(); else V.sel = null; }
    else if (e.key === "+" || e.key === "=") C.zoomer(V, 1.25);
    else if (e.key === "-") C.zoomer(V, 1 / 1.25);
    else if (e.key === "m" || e.key === "M") app.acheter("m");
    else if (e.key === "t" || e.key === "T") app.acheter("t");
    else if (e.key === "p" || e.key === "P") app.portee();
    else if (e.key === "c" || e.key === "C") (cine ? sortirCinema : entrerCinema)();
  });
}

// Fenêtre cachée : on note l'heure ; au retour, rattrapage complet (≤ 10 min) ou part de veille
function visibilite() {
  if (!document.hidden) C.rafraichir();
  if (document.hidden) { cacheDepuis = Date.now(); Sv.enregistrer(E); return; }
  if (!cacheDepuis) return;
  const a = Sv.reprendre(E, { quand: cacheDepuis, revenu: S.revenu(E, 60) });
  cacheDepuis = 0; derniere = maintenant();
  annoncer(a, E); UI.retour(a, E); UI.maj(E, V); if (a.mode === "veille") F.Son.jouer("retour");
}

function boucle() {
  const t = maintenant(), dt = Math.min(.1, Math.max(0, t - derniere)); derniere = t;
  if (!document.hidden) {
    S.maj(E, dt); sonsDesEvenements(); C.avancer(E, V, dt);
    const d0 = performance.now(); C.dessiner(ctx, E, V); V.ms += (performance.now() - d0 - V.ms) * .05;
    // appareil à la peine : les sprites n'apparaissent qu'à un zoom plus fort (et reviennent quand ça va mieux)
    if (t - tAdapt > 1) { tAdapt = t; if (V.ms > 14) V.seuil = Math.min(2.4, V.seuil * 1.1); else if (V.ms < 7) V.seuil = Math.max(1.15, V.seuil / 1.05); }
    if (t - tUI > .25) { tUI = t; UI.maj(E, V); }
    if (t - tSauve > 10) { tSauve = t; Sv.enregistrer(E); }
    if (!cine && t - derniereAction > 120) entrerCinema();
    if (cine && prefs.cineSuivi && t > cineSuite) { cineSuite = t + 9; V.sel = E.ships[Math.floor(Math.random() * E.ships.length)] || null; V.z = 2.4; }
  }
  requestAnimationFrame(boucle);
}

function demarrer() {
  cv = document.getElementById("cv"); ctx = cv.getContext("2d");
  prefs = Object.assign(prefs, Sv.prefs()); F.Son.init(prefs);
  C.theme(V, prefs.theme); redim(); window.addEventListener("resize", redim);
  const d = Sv.lire(Sv.CLE, null);
  E = Sv.importer(d);
  if (E) { V.cam = R.ZONES[E.lv].cam; const a = Sv.reprendre(E, d); annoncer(a, E); UI.init(app); UI.retour(a, E); }
  else { E = S.creer(); UI.init(app); }
  entrees();
  document.addEventListener("visibilitychange", visibilite);
  window.addEventListener("pagehide", () => Sv.enregistrer(E));
  derniere = tSauve = tUI = derniereAction = maintenant();
  UI.maj(E, V);
  C.charger().then(() => requestAnimationFrame(boucle));
}

F.Jeu = { etat: () => E, vue: () => V, app, entrerCinema, sortirCinema, suivre };
demarrer();
})();

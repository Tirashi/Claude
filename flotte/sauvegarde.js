/* Flotte du bureau : sauvegarde (localStorage), reprise d'une partie et part des gains appli fermée. */
(function () {
const F = window.Flotte = window.Flotte || {};
const R = F.R, S = F.Sim;
const CLE = "flotte.partie", CLE_PREFS = "flotte.prefs";

const lire = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const nb = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);

function exporter(E) {
  return { v: 1, quand: Date.now(), t: E.t, credits: E.credits, total: E.total, buys: E.buys, lv: E.lv, veille: E.veille,
    revenu: S.revenu(E, 60), navires: E.ships.map(s => ({ type: s.type, nom: s.nom, trips: s.trips, earn: s.earn })) };
}

// Refait une partie depuis une sauvegarde ; null si elle est absente ou illisible
function importer(d) {
  if (!d || d.v !== 1 || !Array.isArray(d.navires)) return null;
  const E = S.creer({ vide: true });
  E.t = Math.max(0, nb(d.t, 0)); E.credits = Math.max(0, nb(d.credits, R.DEPART.credits)); E.total = Math.max(0, nb(d.total, 0));
  E.lv = Math.max(0, Math.min(R.ZONES.length - 1, Math.floor(nb(d.lv, 0)))); E.veille = Math.max(0, Math.min(10, Math.floor(nb(d.veille, 0))));
  for (const k of ["m", "t", "p"]) E.buys[k] = Math.max(0, Math.floor(nb(d.buys && d.buys[k], 0)));
  F.Monde.placer(E.M, E.t);
  for (const n of d.navires.slice(0, 2000)) if (n && (n.type === "m" || n.type === "t")) S.ajouter(E, n.type, n);
  S.log(E, "Partie reprise.");
  return E;
}

const charger = () => importer(lire(CLE, null));
const enregistrer = E => ecrire(CLE, exporter(E));
const effacer = () => { try { localStorage.removeItem(CLE); } catch (e) {} };
const prefs = () => lire(CLE_PREFS, {}) || {};
const enregistrerPrefs = p => ecrire(CLE_PREFS, p);

// Au retour : écart (s) depuis la dernière sauvegarde ; renvoie ce qu'il faut annoncer ({mode, dt, gain, part})
function reprendre(E, d) {
  const dt = (Date.now() - nb(d && d.quand, Date.now())) / 1000;
  const a = R.absence(nb(d && d.revenu, 0), dt, E.veille);
  if (a.mode === "rattrapage") S.rattraper(E, dt);
  else if (a.mode === "veille") { E.credits += a.gain; E.total += a.gain; E.t += a.duree; F.Monde.placer(E.M, E.t); }
  return a;
}

F.Save = { CLE, lire, ecrire, exporter, importer, charger, enregistrer, effacer, prefs, enregistrerPrefs, reprendre };
})();

/* Flotte du bureau : la simulation (navires, gains, achats). Sans écran : tourne aussi sous Node (outils/flotte-simulateur.js).
   Un navire alterne « attente » (il tourne autour d'un corps) et « vol » (trajet presque droit vers un corps qui bouge). */
(function () {
const F = window.Flotte = window.Flotte || {};
const R = F.R, Mo = F.Monde;
const NOMS = ["Elena Star", "Marc Voss", "Iris Kaan", "Tom Reyes", "Lina Okoro", "Yan Dorel", "Mira Tesch", "Paul Aster", "Nadia Brun", "Eli Mercer", "Sofia Lund", "Hugo Valk", "Aya Nomura", "Leo Barrak", "Zoé Hartmann", "Ravi Sen"];

const rnd = (E, a, b) => a + E.rng() * (b - a);
const choisir = (E, l) => l[Math.floor(E.rng() * l.length)];

function log(E, msg) { E.logs.push({ t: E.t, h: Date.now(), msg }); if (E.logs.length > 40) E.logs.shift(); }

function creer(opts) {
  opts = opts || {};
  const M = Mo.creer(); Mo.placer(M, 0);
  const E = { M, t: 0, credits: R.DEPART.credits, total: 0, buys: { m: 0, t: 0, p: 0 }, lv: 0, veille: 0, up: { mot: 0, soute: 0 }, ships: [], inc: [], id: 0, rng: opts.rng || Math.random, evt: [], logs: [] };
  F.Pirates.init(E);
  if (!opts.vide) {
    for (let i = 0; i < R.DEPART.m; i++) ajouter(E, "m");
    for (let i = 0; i < R.DEPART.t; i++) ajouter(E, "t");
    log(E, "Système SOL-1 en ligne.");
    log(E, "Flotte initiale : " + R.DEPART.m + " mineurs, " + R.DEPART.t + " marchands.");
  }
  return E;
}

// Tourne lentement autour du corps où le navire attend
function survol(E, sh, b) {
  const rayon = .012 + (b.r || 3) * .0016, a = sh.id * 2.1 + E.t * .35;
  return [b.x + Math.cos(a) * rayon, b.y + Math.sin(a) * rayon];
}

function ajouter(E, type, sauve) {
  const sh = { id: E.id++, type, nom: (sauve && sauve.nom) || NOMS[E.id % NOMS.length], trips: (sauve && sauve.trips) || 0, earn: (sauve && sauve.earn) || 0,
    etat: "attente", attente: rnd(E, 0, 2), p: 0, bow: 0, sx: 0, sy: 0, x: 0, y: 0, ang: 0, ore: "fer", tt: 0, trace: [] };
  const relais = Mo.relaisOuverts(E.M, E.lv), mines = Mo.mines(E.M, E.lv);
  if (type === "m") { const m = choisir(E, mines); sh.a = Mo.plusProche(relais, m.x, m.y); sh.vers = choisir(E, mines); }
  else { sh.a = choisir(E, relais); sh.vers = E.M.prime; }
  const h = survol(E, sh, sh.a); sh.x = h[0]; sh.y = h[1];
  E.ships.push(sh);
  return sh;
}

// Point du trajet à la part p (0 à 1) ; renvoie aussi la distance directe
function trajet(sh, p) {
  const dx = sh.vers.x - sh.sx, dy = sh.vers.y - sh.sy, d = Math.hypot(dx, dy) || 1e-6, e = p * p * (3 - 2 * p), lat = sh.bow * Math.sin(p * Math.PI);
  return [sh.sx + dx * e - dy / d * lat, sh.sy + dy * e + dx / d * lat, d];
}

function gagner(E, sh, n, corps, col) {
  E.credits += n; E.total += n; E.inc.push({ t: E.t, n });
  sh.trips++; sh.earn += n;
  E.evt.push({ x: corps.x, y: corps.y, n, col });
}

function arriver(E, sh) {
  const dest = sh.vers, relais = Mo.relaisOuverts(E.M, E.lv);
  if (sh.type === "m") {
    if (dest.mine) { sh.ore = dest.ore; sh.a = dest; sh.vers = Mo.plusProche(relais, dest.x, dest.y); sh.attente = R.FORAGE; }
    else { gagner(E, sh, R.gainMineur(sh.ore, R.multGain(E.up.soute)), dest, R.ORE[sh.ore].c); sh.a = dest; sh.vers = choisir(E, Mo.mines(E.M, E.lv)); sh.attente = R.QUAI_MINEUR; }
  } else if (dest === E.M.prime) {
    gagner(E, sh, R.gainMarchand(E.lv, R.multGain(E.up.soute)), dest, "#e8fff6"); sh.a = dest; sh.vers = choisir(E, relais); sh.attente = R.QUAI_PRIME;
  } else { sh.a = dest; sh.vers = E.M.prime; sh.attente = R.QUAI_RELAIS; }
  sh.etat = "attente";
}

function maj(E, dt) {
  E.t += dt; Mo.placer(E.M, E.t);
  for (const sh of E.ships) {
    if (sh.etat === "attente") {
      const h = survol(E, sh, sh.a), k = Math.min(1, dt * 5);
      sh.x += (h[0] - sh.x) * k; sh.y += (h[1] - sh.y) * k; sh.attente -= dt;
      sh.ang = Math.atan2(sh.a.y - sh.y, sh.a.x - sh.x) + Math.PI / 2;
      if (sh.attente <= 0) {
        sh.etat = "vol"; sh.p = 0; sh.sx = sh.x; sh.sy = sh.y;
        sh.bow = Math.hypot(sh.vers.x - sh.x, sh.vers.y - sh.y) * R.ARC * (sh.id % 2 ? 1 : -1);
      }
    } else {
      const d0 = trajet(sh, sh.p)[2], v = R.VITESSE * R.multVitesse(E.up.mot) * (sh.type === "t" ? R.X_MARCHAND : 1);
      sh.p = Math.min(1, sh.p + v * dt / Math.max(d0, .1));
      const a = trajet(sh, sh.p), b = trajet(sh, Math.min(1, sh.p + .02));
      sh.x = a[0]; sh.y = a[1];
      if (b[0] !== a[0] || b[1] !== a[1]) sh.ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      if (sh.p >= 1) arriver(E, sh);
    }
    sh.tt += dt; if (sh.tt > .1) { sh.tt = 0; sh.trace.push([sh.x, sh.y]); if (sh.trace.length > 9) sh.trace.shift(); }
  }
  F.Pirates.maj(E, dt);
  if (E.inc.length && E.t - E.inc[0].t > 60) E.inc = E.inc.filter(i => E.t - i.t < 60);
}

// Revenu moyen (crédits par seconde) sur les fen dernières secondes
function revenu(E, fen) {
  fen = fen || R.FENETRE_REVENU;
  let s = 0; for (const i of E.inc) if (E.t - i.t < fen) s += i.n;
  return s / Math.min(fen, Math.max(E.t, 5));
}

function nombre(E, k) { return E.ships.filter(s => s.type === k).length; }

// Achète qte navires (nombre ou « max ») ; renvoie combien ont été achetés. Une patrouille garde les avant-postes (elle ne livre rien).
function acheter(E, k, qte) {
  if (k !== "m" && k !== "t" && k !== "p") return 0;
  const n = qte === "max" ? R.lotMax(k, E.buys[k], E.credits, 200) : qte;
  let fait = 0;
  for (let i = 0; i < n; i++) {
    const c = R.cout(k, E.buys[k]);
    if (E.credits < c) break;
    E.credits -= c; E.buys[k]++; if (k === "p") F.Pirates.ajouterPatrouille(E); else ajouter(E, k); fait++;
  }
  if (fait) log(E, "Acheté : " + fait + " " + R.ROLE[k] + (fait > 1 ? "s" : "") + ".");
  return fait;
}

// Amélioration d'Ingénierie (moteurs, soute) : un niveau de plus si les crédits suffisent
function ameliorer(E, k) {
  const a = R.AMELIO[k]; if (!a || E.up[k] >= a.max) return false;
  const c = R.coutAmelio(k, E.up[k]); if (E.credits < c) return false;
  E.credits -= c; E.up[k]++; log(E, a.n + " niveau " + E.up[k] + ".");
  return true;
}

// Portée du signal : ouvre la zone suivante, pose son avant-poste et fait dézoomer la carte
function ouvrirZone(E) {
  if (E.lv >= R.ZONES.length - 1) return false;
  const cout = R.ZONES[E.lv + 1].cout;
  if (E.credits < cout) return false;
  E.credits -= cout; E.lv++;
  for (const b of E.M.tous) if (b.lv === E.lv) b.t0 = E.t;
  log(E, "Portée du signal niveau " + (E.lv + 1) + " : " + R.ZONES[E.lv].n + ".");
  return true;
}

// Fait avancer la simulation de dt secondes par pas de 0,25 s (fenêtre cachée, reprise de partie)
function rattraper(E, dt) {
  let reste = Math.max(0, dt);
  while (reste > 1e-6) { const p = Math.min(.25, reste); maj(E, p); reste -= p; }
  E.evt.length = 0;
}

F.Sim = { creer, ajouter, maj, revenu, nombre, acheter, ameliorer, ouvrirZone, rattraper, log, trajet, survol };
})();

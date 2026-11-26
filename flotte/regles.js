/* Flotte du bureau : règles (données et formules, sans écran). Lu par le jeu et par outils/flotte-simulateur.js.
   Unités du monde : 1 = le rayon de la zone 4 / 1,22 ; les orbites sont des cercles (la vue les aplatit). Temps en secondes. */
(function () {
const F = window.Flotte = window.Flotte || {};

const ORE = {
  fer:      { c: "#ffc58a", v: 2 },
  glace:    { c: "#9fe0ff", v: 5 },
  cristal:  { c: "#dcaaff", v: 12 },
  iridium:  { c: "#ffe27a", v: 30 }
};
// Les quatre zones ouvertes par la portée du signal (session 2) : anneau et échelle de la caméra (portion du monde qui tient à l'écran)
const ZONES = [
  { n: "Système central",   ore: "fer",     anneau: .50, cam: .50, cout: 0 },
  { n: "Ceinture de glace", ore: "glace",   anneau: .74, cam: .76, cout: 3000 },
  { n: "Champ de cristal",  ore: "cristal", anneau: .97, cam: 1.0, cout: 40000 },
  { n: "Bord du système",   ore: "iridium", anneau: 1.22, cam: 1.26, cout: 100000 }
];
// Coût du n-ième navire d'un rôle : base × facteur^n
const PRIX = { m: [20, 1.08], t: [60, 1.10], p: [90, 1.20] };
const ROLE = { m: "mineur", t: "marchand", p: "patrouille", x: "pirate" };
const DEPART = { credits: 400, m: 5, t: 3 };

// Mouvement (unités du monde par seconde) et attentes (s)
const VITESSE = .04, X_MARCHAND = 1.15;
const FORAGE = 2, QUAI_MINEUR = .5, QUAI_PRIME = 1, QUAI_RELAIS = .6;
const ARC = .03;                      // flèche de la trajectoire, en part de la distance

// Appli fermée : part des gains, plafond de l'absence, rattrapage complet d'une fenêtre seulement cachée
const VEILLE = { base: .25, pas: .05, max: .75 };
const ABSENCE_MAX = 24 * 3600, RATTRAPAGE_MAX = 600, FENETRE_REVENU = 30;

// Améliorations d'Ingénierie payées en crédits : coût = base × facteur^niveau
const AMELIO = {
  mot:   { n: "Moteurs",       max: 10, base: 80,  f: 1.8, pas: .08, d: "Vitesse des navires +8 % par niveau." },
  soute: { n: "Soute étendue", max: 10, base: 120, f: 1.9, pas: .10, d: "Gains de chaque livraison +10 % par niveau." }
};
const coutAmelio = (k, n) => Math.round(AMELIO[k].base * Math.pow(AMELIO[k].f, n));
const multVitesse = n => 1 + AMELIO.mot.pas * (n || 0), multGain = n => 1 + AMELIO.soute.pas * (n || 0);

// Pirates : un par zone paire ouverte au plus, ils pillent les navires chargés ; les patrouilles gardent les avant-postes
const PIRATE = { grace: 45, mini: 40, maxi: 70, vitesse: .05, pv: 2, contact: .02, fuite: 6, butinSec: 10, butinMin: 10, primeSec: 10, primeMin: 25 };
const PATROUILLE = { portee: .22, degats: .8, orbite: .035, vitesseAng: .8 };
const butin = (revenu, credits) => Math.max(0, Math.min(credits, Math.max(PIRATE.butinMin, Math.round(revenu * PIRATE.butinSec))));
const prime = revenu => Math.max(PIRATE.primeMin, Math.round(revenu * PIRATE.primeSec));
const maxPirates = lv => 1 + Math.floor((lv || 0) / 2);

const lots = ["1", "10", "100", "max"];

function cout(k, n) { return Math.round(PRIX[k][0] * Math.pow(PRIX[k][1], n)); }
// Coût de qte navires à la suite quand on en a déjà n
function coutLot(k, n, qte) { let s = 0; for (let i = 0; i < qte; i++) s += cout(k, n + i); return s; }
// Combien de navires on peut acheter (au plus plafond) avec ces crédits
function lotMax(k, n, credits, plafond) { let q = 0, s = 0; plafond = plafond || 500; while (q < plafond) { const c = cout(k, n + q); if (s + c > credits) break; s += c; q++; } return q; }

const gainMineur = (ore, mult) => Math.round(ORE[ore].v * 2 * (mult || 1));
const gainMarchand = (niveau, mult) => Math.round(10 * (1 + .6 * niveau) * (mult || 1));
const partVeille = niveau => Math.min(VEILLE.max, VEILLE.base + VEILLE.pas * (niveau || 0));
// Absence de dt secondes : une fenêtre cachée peu de temps se rattrape à 100 %, une longue absence ne rapporte que la part de veille
function absence(revenu, dt, niveauVeille) {
  if (!(dt > 5)) return { mode: "rien", dt: 0, gain: 0 };
  if (dt <= RATTRAPAGE_MAX) return { mode: "rattrapage", dt, gain: 0 };
  const d = Math.min(dt, ABSENCE_MAX), part = partVeille(niveauVeille);
  return { mode: "veille", dt, duree: d, part, gain: Math.floor(Math.max(0, revenu) * d * part) };
}

F.R = { PIRATE, PATROUILLE, butin, prime, maxPirates, AMELIO, coutAmelio, multVitesse, multGain, ORE, ZONES, PRIX, ROLE, DEPART, VITESSE, X_MARCHAND, FORAGE, QUAI_MINEUR, QUAI_PRIME, QUAI_RELAIS, ARC, VEILLE, ABSENCE_MAX, RATTRAPAGE_MAX, FENETRE_REVENU,
  lots, cout, coutLot, lotMax, gainMineur, gainMarchand, partVeille, absence };
})();

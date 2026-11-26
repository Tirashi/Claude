/* Flotte du bureau : le système (corps célestes, orbites, zones). Positions dans le monde (voir regles.js) ; le rendu les aplatit. */
(function () {
const F = window.Flotte = window.Flotte || {};
const R = F.R;
const TAU = Math.PI * 2;
// Vitesse angulaire (rad/s) : lente mais visible, plus rapide près de l'étoile
const om = rf => .007 * Math.pow(rf, -1.5);

function corps(n, rf, ph, lv, o) { return Object.assign({ n, rf, ph, lv, om: om(rf), x: 0, y: 0, t0: 0 }, o); }

function creer() {
  const planetes = [
    corps("Cendre", .14, .8, 0, { r: 2.6, col: "#e0a883", sub: "Planète" }),
    corps("Géante", .60, 3.9, 1, { r: 5.5, col: "#d9a36f", sub: "Planète à anneaux", anneaux: true }),
    corps("Prime", .46, 2.2, 0, { r: 4, col: "#8fd0f5", sub: "Marché", marche: true })];
  const prime = planetes[2];
  const relais = [
    corps("QG de la flotte", .24, 5.3, 0, { r: 3.5, relais: true, qg: true }),
    corps("Orbite-G", .60, 4.4, 1, { r: 2.4, relais: true, sub: "Avant-poste", autour: planetes[1] }),
    corps("Relais 2", .88, 1.2, 2, { r: 2.4, relais: true, sub: "Avant-poste" }),
    corps("Bord du système", 1.15, 3.3, 3, { r: 2.4, relais: true, sub: "Avant-poste" })];
  const mines = [["Ast-1", .36, .4, 0, "fer"], ["Ast-2", .36, 3.2, 0, "fer"], ["Gla-1", .68, 2.5, 1, "glace"], ["Gla-2", .68, 5.4, 1, "glace"],
    ["Cri-1", .88, 3.9, 2, "cristal"], ["Cri-2", .88, .2, 2, "cristal"], ["Iri-1", 1.15, 5.5, 3, "iridium"], ["Iri-2", 1.15, 1.9, 3, "iridium"]]
    .map((p, i) => corps(p[0], p[1], p[2], p[3], { r: 2 + (i % 3) * .4, ore: p[4], mine: true, col: "#9aa0b8", sub: "Produit : " + p[4] }));
  return { planetes, relais, mines, prime, qg: relais[0], tous: [...planetes, ...relais, ...mines] };
}

// Place les corps à l'instant t (les avant-postes en orbite suivent leur planète)
function placer(M, t) {
  for (const b of M.tous) {
    if (b.autour) continue;
    const a = b.ph + b.om * t;
    b.x = Math.cos(a) * b.rf; b.y = Math.sin(a) * b.rf;
  }
  for (const b of M.tous) if (b.autour) { const a = b.ph + b.om * t * 8; b.x = b.autour.x + Math.cos(a) * .028; b.y = b.autour.y + Math.sin(a) * .028; }
}

const ouvert = (b, lv) => b.lv <= lv;
const mines = (M, lv) => M.mines.filter(b => ouvert(b, lv));
const relaisOuverts = (M, lv) => M.relais.filter(b => ouvert(b, lv));
function plusProche(liste, x, y) { let best = null, d = 1e9; for (const b of liste) { const k = Math.hypot(b.x - x, b.y - y); if (k < d) { d = k; best = b; } } return best; }

F.Monde = { TAU, creer, placer, ouvert, mines, relaisOuverts, plusProche };
})();

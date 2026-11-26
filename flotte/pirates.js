/* Flotte du bureau : pirates, patrouilles et primes (sans écran). Un pirate vise un navire chargé en vol, lui prend `butin` crédits (10 s de revenu)
   et s'enfuit avec ; une patrouille qui le détruit rend le butin et touche une prime (10 s de revenu). Pas de pirates appli fermée. */
(function () {
const F = window.Flotte = window.Flotte || {};
const R = F.R, Mo = F.Monde;
const rnd = (E, a, b) => a + E.rng() * (b - a);

function init(E) {
  E.pirates = []; E.patrouilles = []; E.stats = { detruits: 0, perdu: 0, primes: 0 };
  E.proch = R.PIRATE.grace + rnd(E, 0, 20);
}

// Les navires qui ont quelque chose à piller : mineurs en route vers un avant-poste, marchands en route vers le marché
const chargé = (E, sh) => sh.etat === "vol" && (sh.type === "t" ? sh.vers === E.M.prime : !sh.vers.mine);
const porteurs = E => E.ships.filter(sh => chargé(E, sh));

// Les pirates arrivent juste au-delà de l'anneau de la zone ouverte (visibles sur la carte)
const rayon = E => R.ZONES[E.lv].anneau + .2;

function ajouterPatrouille(E) {
  const q = { a: rnd(E, 0, Math.PI * 2), x: 0, y: 0, ang: 0, hub: Mo.relaisOuverts(E.M, E.lv)[0], tir: 0, cible: null };
  E.patrouilles.push(q); return q;
}

function apparaitre(E, cibles) {
  const a = rnd(E, 0, Math.PI * 2), c = cibles[Math.floor(E.rng() * cibles.length)];
  E.pirates.push({ x: Math.cos(a) * rayon(E), y: Math.sin(a) * rayon(E), pv: R.PIRATE.pv + E.lv, etat: "chasse", cible: c, loot: 0, hit: 0, ang: 0 });
  F.Sim.log(E, "Alerte : pirate détecté.");
}

function maj(E, dt) {
  const P = R.PIRATE, Pa = R.PATROUILLE, rev = F.Sim.revenu(E);
  if (E.t >= E.proch) {
    if (E.pirates.length < R.maxPirates(E.lv)) { const c = porteurs(E); if (c.length) { apparaitre(E, c); E.proch = E.t + rnd(E, P.mini, P.maxi); } else E.proch = E.t + 5; }
    else E.proch = E.t + 10;
  }
  const relais = Mo.relaisOuverts(E.M, E.lv);
  E.patrouilles.forEach((q, i) => {
    q.hub = relais[i % relais.length]; q.a += dt * Pa.vitesseAng;
    q.x = q.hub.x + Math.cos(q.a) * Pa.orbite; q.y = q.hub.y + Math.sin(q.a) * Pa.orbite; q.ang = q.a + Math.PI / 2; q.tir = Math.max(0, q.tir - dt * 3);
  });
  for (const p of E.pirates) {
    p.hit = Math.max(0, p.hit - dt * 3);
    if (p.etat === "chasse") {
      if (!p.cible || !chargé(E, p.cible)) { const c = porteurs(E); p.cible = c.length ? c[Math.floor(E.rng() * c.length)] : null; if (!p.cible) p.etat = "fuite"; }
      if (p.cible) {
        const dx = p.cible.x - p.x, dy = p.cible.y - p.y, d = Math.hypot(dx, dy) || 1e-6;
        p.ang = Math.atan2(dy, dx);
        if (d < P.contact) {
          const butin = R.butin(rev, E.credits); E.credits -= butin; p.loot += butin; E.stats.perdu += butin;
          F.Sim.log(E, "Un navire a été pillé : −" + butin.toLocaleString("fr-FR") + " cr.");
          E.evt.push({ kind: "perte", x: p.x, y: p.y, n: butin }); p.etat = "fuite"; p.cible = null;
        } else { const k = Math.min(1, P.vitesse * dt / d); p.x += dx * k; p.y += dy * k; }
      }
    }
    if (p.etat === "fuite") {
      const r = Math.hypot(p.x, p.y) || 1e-6, ux = p.x / r, uy = p.y / r; p.ang = Math.atan2(uy, ux);
      p.x += ux * P.vitesse * dt; p.y += uy * P.vitesse * dt;
    }
  }
  for (const q of E.patrouilles) for (const p of E.pirates) {
    if (Math.hypot(q.x - p.x, q.y - p.y) < Pa.portee) { p.pv -= Pa.degats * dt; p.hit = 1; q.tir = 1; q.cible = p; }
  }
  if (E.pirates.length) E.pirates = E.pirates.filter(p => {
    if (p.pv <= 0) {
      const prime = R.prime(rev); E.credits += p.loot + prime; E.total += prime; E.stats.primes += prime; E.stats.detruits++;
      F.Sim.log(E, "Pirate détruit : +" + (p.loot + prime).toLocaleString("fr-FR") + " cr (butin récupéré et prime).");
      E.evt.push({ kind: "boom", x: p.x, y: p.y }); E.evt.push({ x: p.x, y: p.y, n: p.loot + prime, col: "#ffd1dc" });
      return false;
    }
    return Math.hypot(p.x, p.y) < rayon(E) + .25;
  });
}

F.Pirates = { init, maj, apparaitre, ajouterPatrouille, porteurs };
})();

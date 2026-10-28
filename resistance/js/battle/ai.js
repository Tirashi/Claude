(() => {
  'use strict';
  const { reachable, pathTo, distanceField, manhattan, unkey, key, forecast, canReach } = Resistance;

  // Choisit l'action d'une unité ennemie : { path, target } ou { path } ou null.
  function planEnemy(battle, unit) {
    const res = reachable(battle, unit);
    const players = battle.units.filter((u) => u.alive && u.team === 'player');
    if (!players.length) return null;

    const stops = unit.ai === 'stationary' ? [key(unit.x, unit.y)] : [...res.stops];

    // 1. Chercher la meilleure attaque possible ce tour-ci.
    let best = null;
    for (const k of stops) {
      const [x, y] = unkey(k);
      const pos = { x, y };
      const terr = battle.terrainAt(x, y);
      for (const p of players) {
        if (!canReach(unit, manhattan(pos, p))) continue;
        const fc = forecast(battle, unit, p, pos);
        const total = fc.a.dmg * fc.a.count;
        let score = total * (fc.a.hit / 100) * 2 + fc.a.hit / 10;
        if (total >= p.hp) score += 40 * (fc.a.hit / 100);           // peut tuer
        if (fc.d) score -= fc.d.dmg * fc.d.count * (fc.d.hit / 100); // évite les ripostes
        score += (terr.avo + terr.def * 5) / 10;                     // aime le bon terrain
        score -= (res.dist.get(k) ?? 0) * 0.05;                      // préfère bouger peu
        if (!best || score > best.score) best = { score, pos, target: p };
      }
    }

    // Une unité "guard" ne s'active que si quelqu'un entre dans sa zone de menace.
    if (unit.ai === 'guard' && !best && !unit.awake) return null;
    if (best) {
      unit.awake = true;
      return { path: pathTo(res, best.pos.x, best.pos.y), target: best.target };
    }
    if (unit.ai === 'stationary') return null;

    // 2. Sinon, avancer vers le joueur le plus proche (en coût de déplacement réel).
    const field = distanceField(battle, players, unit.moveType);
    let bestStop = null;
    for (const k of stops) {
      const d = field.get(k) ?? Infinity;
      if (!bestStop || d < bestStop.d || (d === bestStop.d && res.dist.get(k) < bestStop.cost)) {
        bestStop = { d, cost: res.dist.get(k), k };
      }
    }
    if (!bestStop || !isFinite(bestStop.d)) return null;
    const [x, y] = unkey(bestStop.k);
    return { path: pathTo(res, x, y) };
  }

  Object.assign(Resistance, { planEnemy });
})();

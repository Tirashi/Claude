(() => {
  'use strict';
  const { moveCost } = Resistance;

  const key = (x, y) => `${x},${y}`;
  const unkey = (k) => k.split(',').map(Number);
  const manhattan = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Dijkstra limité au déplacement de l'unité.
  // On peut traverser ses alliés, pas les ennemis, et on ne peut pas s'arrêter sur une case occupée.
  function reachable(battle, unit) {
    const dist = new Map([[key(unit.x, unit.y), 0]]);
    const prev = new Map();
    const open = [[0, unit.x, unit.y]];
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]);
      const [d, x, y] = open.shift();
      if (d > (dist.get(key(x, y)) ?? Infinity)) continue;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (!battle.inBounds(nx, ny)) continue;
        const c = moveCost(battle.terrainAt(nx, ny), unit.moveType);
        if (!isFinite(c)) continue;
        const occ = battle.unitAt(nx, ny);
        if (occ && occ.team !== unit.team) continue;
        const nd = d + c;
        if (nd > unit.mov) continue;
        const k = key(nx, ny);
        if (nd < (dist.get(k) ?? Infinity)) {
          dist.set(k, nd);
          prev.set(k, key(x, y));
          open.push([nd, nx, ny]);
        }
      }
    }
    const stops = new Set();
    for (const k of dist.keys()) {
      const [x, y] = unkey(k);
      const occ = battle.unitAt(x, y);
      if (!occ || occ === unit) stops.add(k);
    }
    return { dist, prev, stops };
  }

  function pathTo(res, x, y) {
    const path = [];
    let k = key(x, y);
    while (k) {
      const [px, py] = unkey(k);
      path.unshift({ x: px, y: py });
      k = res.prev.get(k);
    }
    return path;
  }

  function tilesInRange(battle, x, y, min, max) {
    const out = [];
    for (let dy = -max; dy <= max; dy++) {
      for (let dx = -max; dx <= max; dx++) {
        const d = Math.abs(dx) + Math.abs(dy);
        if (d < min || d > max) continue;
        if (battle.inBounds(x + dx, y + dy)) out.push({ x: x + dx, y: y + dy });
      }
    }
    return out;
  }

  // Cases attaquables depuis n'importe quelle case d'arrêt (hors cases de déplacement).
  function threatTiles(battle, unit, res) {
    const out = new Set();
    for (const k of res.stops) {
      const [x, y] = unkey(k);
      for (const t of tilesInRange(battle, x, y, unit.weapon.min, unit.weapon.max)) {
        const tk = key(t.x, t.y);
        if (!res.stops.has(tk)) out.add(tk);
      }
    }
    return out;
  }

  // Carte de distance (en coût de déplacement) vers les unités d'une équipe.
  // Sert à l'IA pour savoir dans quelle direction avancer. Les unités ne bloquent pas.
  function distanceField(battle, targets, moveType) {
    const dist = new Map();
    const open = [];
    for (const t of targets) {
      dist.set(key(t.x, t.y), 0);
      open.push([0, t.x, t.y]);
    }
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]);
      const [d, x, y] = open.shift();
      if (d > (dist.get(key(x, y)) ?? Infinity)) continue;
      for (const [dx, dy] of DIRS) {
        const nx = x + dx, ny = y + dy;
        if (!battle.inBounds(nx, ny)) continue;
        const c = moveCost(battle.terrainAt(nx, ny), moveType);
        if (!isFinite(c)) continue;
        const nd = d + c;
        const k = key(nx, ny);
        if (nd < (dist.get(k) ?? Infinity)) {
          dist.set(k, nd);
          open.push([nd, nx, ny]);
        }
      }
    }
    return dist;
  }

  Object.assign(Resistance, { key, unkey, manhattan, reachable, pathTo, tilesInRange, threatTiles, distanceField });
})();

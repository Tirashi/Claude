// Types de terrain. Un coût absent = case infranchissable pour ce type de déplacement.
// base / overlay : variantes de tuiles (colonne, ligne) dans le tileset 16x16,
// choisies selon la position de la case. L'overlay est dessiné par-dessus la base.
(() => {
  'use strict';
  const GRASS = [[0, 2], [1, 2], [2, 2], [3, 2]];

  const TERRAIN = {
    '.': { id: 'plain', name: 'Plaine', def: 0, avo: 0,
           cost: { foot: 1, armor: 1, mounted: 1 },
           base: GRASS },
    'F': { id: 'forest', name: 'Forêt', def: 1, avo: 20,
           cost: { foot: 2, armor: 2, mounted: 3 },
           base: GRASS, overlay: [[10, 7], [11, 7], [10, 8], [11, 8]] },
    'T': { id: 'fort', name: 'Fort', def: 2, avo: 20, heal: 0.2,
           cost: { foot: 2, armor: 2, mounted: 2 },
           base: [[10, 1]], overlay: [[11, 11]] },
    'R': { id: 'rock', name: 'Rochers', def: 0, avo: 0, cost: {},
           base: GRASS, overlay: [[10, 6], [11, 6], [12, 6]] },
    'W': { id: 'water', name: 'Rivière', def: 0, avo: 0, cost: {},
           base: [[0, 13], [1, 13], [2, 13], [3, 13]] },
  };

  function moveCost(terrain, moveType) {
    return terrain.cost[moveType] ?? Infinity;
  }

  Object.assign(Resistance, { TERRAIN, moveCost });
})();

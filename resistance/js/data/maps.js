// Terrains de combat. Légende : . plaine, F forêt, T fort, R rochers, W rivière.
// spawns : cases de départ de l'armée rebelle, dans l'ordre de l'armée.
// Les ennemis sont placés par les rencontres (encounters.js).
(() => {
  'use strict';
  const MAPS = {
    frontiere: {
      name: 'Le gué de la frontière',
      tiles: [
        'RR..FF.....FF.R',
        'R.....WW.....F.',
        '..F...WW..T....',
        '......WW.......',
        '..F.........FF.',
        '.......F.......',
        '...FF..WW..R...',
        'T......WW...F..',
        '..F....WW......',
        'R....FF.....RRR',
      ],
      spawns: [
        { x: 2, y: 4 }, { x: 1, y: 3 }, { x: 1, y: 5 }, { x: 0, y: 4 }, { x: 0, y: 6 }, { x: 1, y: 2 },
      ],
    },
    clairiere: {
      name: 'La clairière',
      tiles: [
        '..FF....FF..FFR',
        '.F....F.......F',
        '....FF...F.F...',
        '.F......F......',
        '...F.FF....FF..',
        '..F......F.....',
        '.....F.FF...F..',
        '.FF........F.F.',
        '....F.FF.......',
        'R.F......FF..RR',
      ],
      spawns: [
        { x: 1, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 5 }, { x: 1, y: 6 }, { x: 0, y: 4 }, { x: 1, y: 2 },
      ],
    },
    pont: {
      name: 'Les deux gués',
      tiles: [
        'R....F...WW...R',
        '.....F...WW.F..',
        '..F............',
        '.........WW.T..',
        '..F..F...WW....',
        '.........WW....',
        '.F.......WW.F..',
        '....F..........',
        '..T......WW.F..',
        'R........WW..RR',
      ],
      spawns: [
        { x: 1, y: 4 }, { x: 0, y: 3 }, { x: 0, y: 5 }, { x: 2, y: 5 }, { x: 0, y: 4 }, { x: 1, y: 2 },
      ],
    },
  };

  Object.assign(Resistance, { MAPS });
})();

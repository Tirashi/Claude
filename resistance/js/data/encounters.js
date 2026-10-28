// Rencontres : quelles troupes du tyran, sur quel terrain (maps.js).
// Les ennemis indiquent leur comportement d'IA :
//  - 'aggressive' : fonce sur le joueur
//  - 'guard'      : attend qu'un rebelle entre dans sa zone de menace
//  - 'stationary' : ne bouge jamais (général sur son fort)
// level est le niveau de base ; la run ajoute des niveaux selon l'étage (countries.js).
// enemyMods : ajustement des stats (ex. malus pour les premiers combats).
// icon : classe affichée sur la carte de run (par défaut le général, sinon le premier ennemi).
(() => {
  'use strict';
  const ENCOUNTERS = {
    // ---- Premiers combats (étages 1-2), ennemis affaiblis
    patrouille: {
      name: 'Patrouille du gué', map: 'frontiere', enemyMods: { str: -1, skl: -1 },
      enemies: [
        { cls: 'axefighter',   x: 9,  y: 4, ai: 'aggressive' },
        { cls: 'spearfighter', x: 10, y: 6, ai: 'aggressive' },
        { cls: 'thief',        x: 9,  y: 8, ai: 'aggressive' },
        { cls: 'archer',       x: 12, y: 3, ai: 'guard' },
      ],
    },
    eclaireurs: {
      name: 'Éclaireurs du tyran', map: 'clairiere', enemyMods: { str: -1, skl: -1 },
      enemies: [
        { cls: 'thief',        x: 10, y: 3, ai: 'aggressive' },
        { cls: 'swordfighter', x: 11, y: 5, ai: 'aggressive' },
        { cls: 'spearfighter', x: 12, y: 8, ai: 'aggressive' },
        { cls: 'archer',       x: 13, y: 4, ai: 'guard' },
      ],
    },

    // ---- Combats
    embuscade: {
      name: 'Embuscade en forêt', map: 'clairiere',
      enemies: [
        { cls: 'thief',        x: 8,  y: 5, ai: 'aggressive' },
        { cls: 'swordfighter', x: 9,  y: 2, ai: 'aggressive' },
        { cls: 'axefighter',   x: 10, y: 6, ai: 'aggressive' },
        { cls: 'archer',       x: 12, y: 5, ai: 'guard' },
        { cls: 'wizard',       x: 13, y: 7, ai: 'guard' },
      ],
    },
    avantPoste: {
      name: 'Avant-poste des gués', map: 'pont',
      enemies: [
        { cls: 'lanceknight',  x: 12, y: 3, ai: 'guard' },
        { cls: 'spearfighter', x: 11, y: 2, ai: 'aggressive' },
        { cls: 'thief',        x: 12, y: 5, ai: 'aggressive' },
        { cls: 'axefighter',   x: 11, y: 7, ai: 'aggressive' },
        { cls: 'archer',       x: 13, y: 5, ai: 'guard' },
      ],
    },
    gue: {
      name: 'Cavaliers du gué', map: 'frontiere',
      enemies: [
        { cls: 'cavalier',     x: 13, y: 5, ai: 'aggressive' },
        { cls: 'swordcavalier', x: 10, y: 3, ai: 'aggressive' },
        { cls: 'lanceknight',  x: 10, y: 2, ai: 'guard' },
        { cls: 'archer',       x: 12, y: 8, ai: 'guard' },
        { cls: 'wizard',       x: 13, y: 2, ai: 'guard' },
      ],
    },

    raid: {
      name: 'Raid de cavalerie', map: 'pont', icon: 'mountedarcher',
      enemies: [
        { cls: 'swordcavalier', x: 11, y: 2, ai: 'aggressive' },
        { cls: 'cavalier',      x: 11, y: 7, ai: 'aggressive' },
        { cls: 'mountedarcher', x: 13, y: 5, ai: 'aggressive' },
        { cls: 'mountedarcher', x: 13, y: 1, ai: 'guard' },
      ],
    },

    // ---- Élites
    garnison: {
      name: 'Garnison des gués', map: 'pont', icon: 'axeknight',
      enemies: [
        { cls: 'cavalier',     x: 11, y: 2, ai: 'aggressive' },
        { cls: 'cavalier',     x: 11, y: 7, ai: 'aggressive' },
        { cls: 'spearfighter', x: 12, y: 5, ai: 'aggressive' },
        { cls: 'axeknight',    x: 12, y: 3, ai: 'guard' },
        { cls: 'mountedarcher', x: 13, y: 1, ai: 'guard' },
        { cls: 'wizard',       x: 13, y: 6, ai: 'guard' },
      ],
    },
    chevaliers: {
      name: 'Chevaliers du tyran', map: 'frontiere', icon: 'lanceknight',
      enemies: [
        { cls: 'axeknight',    x: 9,  y: 4, ai: 'aggressive' },
        { cls: 'cavalier',     x: 12, y: 5, ai: 'aggressive' },
        { cls: 'swordcavalier', x: 10, y: 8, ai: 'aggressive' },
        { cls: 'lanceknight',  x: 10, y: 2, ai: 'guard' },
        { cls: 'wizard',       x: 13, y: 3, ai: 'guard' },
      ],
    },

    // ---- Généraux
    gorvald: {
      name: 'Gorvald, le Mur de Fer', map: 'frontiere',
      enemies: [
        { cls: 'axefighter',   x: 9,  y: 4, ai: 'aggressive' },
        { cls: 'spearfighter', x: 10, y: 6, ai: 'aggressive' },
        { cls: 'thief',        x: 9,  y: 8, ai: 'aggressive' },
        { cls: 'archer',       x: 12, y: 3, ai: 'guard', level: 2 },
        { cls: 'axefighter',   x: 12, y: 7, ai: 'guard', level: 2 },
        { cls: 'axeknight',    x: 10, y: 2, ai: 'stationary', boss: true, level: 5,
          name: 'Gorvald', title: 'le Mur de Fer', weapon: 'steelAxe',
          bonus: { hp: 4, str: 2, skl: 3 } },
      ],
    },
  };

  // Classe affichée pour représenter une rencontre (carte de run).
  function encounterIcon(enc) {
    return enc.icon ?? (enc.enemies.find((e) => e.boss) ?? enc.enemies[0]).cls;
  }

  Object.assign(Resistance, { ENCOUNTERS, encounterIcon });
})();

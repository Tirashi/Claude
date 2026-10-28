// Pays occupés par le tyran. Chacun a sa carte de run, ses rencontres et son général.
(() => {
  'use strict';
  const COUNTRIES = {
    marches: {
      name: "Les Marches de l'Ouest",
      liberated: "Les Marches de l'Ouest sont libérées !",
      floors: 7,            // le dernier étage est celui du général
      lanes: 4,             // nombre de « couloirs » verticaux sur la carte
      paths: 3,             // chemins tracés du début au général (ils se rejoignent parfois)
      // Types des nœuds intermédiaires (le 1er étage est toujours un combat,
      // l'étage avant le général toujours un repos).
      weights: { combat: 50, elite: 18, rest: 12, shop: 15, event: 25 },
      eliteMinFloor: 2,     // étages comptés à partir de 0
      restMinFloor: 2,
      shopMinFloor: 1,
      eventMinFloor: 1,
      minShops: 1,          // au moins un marchand par carte
      minEvents: 1,         // au moins un événement par carte
      minFightsPerPath: 4,  // combats (élites comprises) minimum sur chaque chemin, avant le général
      // Jamais deux haltes (repos, marchand) de suite sur un chemin.
      // Butin. L'or se dépense pendant la run ; le ravitaillement est rapporté à la forteresse.
      rewards: {
        combat: { gold: 30, goldPerFloor: 5 },
        elite:  { gold: 60, goldPerFloor: 8, supplies: 1 },
        boss:   { gold: 100, supplies: 3 },
        rest:   { supplies: 1 },           // le village libéré donne des provisions
      },
      // Marchand : `size` articles, dont toujours ceux de `always`, le reste tiré dans `pool`.
      // Objets vendus par lot de `itemStock`, armes à l'unité.
      shop: {
        size: 4, itemStock: 3,
        always: ['vulneraire'],
        pool: ['elixir', 'phoenix', 'steelSword', 'slimSword', 'steelLance', 'javelin', 'steelAxe', 'handAxe', 'steelBow',
          'armorslayer', 'hammer', 'halberd'],
      },
      earlyFloors: 2,       // ces premiers étages piochent dans la liste « early »
      levelPerFloor: 0.5,   // niveaux ajoutés aux ennemis par étage
      eliteLevelBonus: 1,
      encounters: {
        early: ['patrouille', 'eclaireurs'],
        combat: ['embuscade', 'avantPoste', 'gue', 'raid'],
        elite: ['garnison', 'chevaliers'],
        boss: 'gorvald',
      },
      events: ['village', 'deserter', 'chest', 'shrine', 'forge'], // events.js
    },
  };

  Object.assign(Resistance, { COUNTRIES });
})();

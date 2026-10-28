// Règles qui s'appliquent à l'armée rebelle entre les combats.
// (L'armée elle-même est recrutée en début de run : voir recruits.js.)
(() => {
  'use strict';
  const RUN_RULES = {
    permadeath: true,       // une unité tombée est perdue pour la run (sinon : revient avec 1 PV)
    // Part des PV max récupérée après chaque victoire. 0 au départ : plus tard, un soigneur
    // dans l'armée et une amélioration de la forteresse viendront s'y ajouter.
    afterBattleHeal: 0,
    restHeal: 1,            // part des PV max récupérée sur un nœud de repos
    levelUpHeal: 1,         // part des PV max rendue à une unité qui monte de niveau (récompense immédiate)
  };

  // Types de nœuds de la carte de run (textes affichés).
  const NODE_TYPES = {
    combat: { name: 'Combat', desc: 'Des troupes du tyran barrent la route.' },
    elite:  { name: 'Élite',  desc: "Une troupe aguerrie : plus dangereuse, plus d'expérience." },
    rest:   { name: 'Repos',  desc: "Un village libéré accueille l'armée : PV rendus, provisions." },
    shop:   { name: 'Marchand', desc: 'Armes et objets contre de l\'or.' },
    event:  { name: 'Événement', desc: 'Un lieu inconnu : une rencontre, un choix.' },
    boss:   { name: 'Général', desc: 'Le général du tyran qui tient le pays.' },
  };

  Object.assign(Resistance, { RUN_RULES, NODE_TYPES });
})();

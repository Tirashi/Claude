// Objets consommables, rangés dans le sac de l'armée et utilisables en combat
// (action « Objet », qui termine le tour de l'unité).
//  heal   : PV rendus à l'unité qui l'utilise
//  revive : objet de protection, pas utilisable en combat : après un combat gagné (ou une
//           retraite), il ramène automatiquement une unité tombée avec cette part de ses PV
//  price  : prix chez le marchand, en or ; stock : exemplaires par marchand (sinon itemStock)
//  icon   : [colonne, ligne] dans la planche d'objets (icons.js)
(() => {
  'use strict';
  const ITEMS = {
    vulneraire: { name: 'Vulnéraire', desc: 'Rend 10 PV', heal: 10, price: 20, icon: [0, 0] },
    elixir:     { name: 'Élixir',     desc: 'Rend tous les PV', heal: 99, price: 60, icon: [1, 0] },
    // Produite par la Ferme de la forteresse (pas vendue) : l'armée part avec dans son sac.
    ration:     { name: 'Ration',     desc: 'Rend 5 PV', heal: 5, icon: [1, 6] },
    // Protection contre la mort définitive : rare (1 par marchand), aussi à l'Intendance et à l'Autel
    phoenix: {
      name: 'Fleur du phénix', desc: 'Après le combat, ramène une unité tombée (25 % des PV)',
      revive: 0.25, price: 90, stock: 1, icon: [5, 0],
    },
  };

  Object.assign(Resistance, { ITEMS });
})();

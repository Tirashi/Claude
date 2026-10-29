// Planches d'icônes 16×16 d'IvoryRed (CC BY 4.0, crédit dans le README).
// Une icône se désigne par [colonne, ligne] dans sa planche.
//  - weapons : colonnes = type (0 épée, 1 bâton, 2 masse, 3 hache, 4 lance, 5 grande épée,
//              6 dague, 7 arc, 8 tome, 9 divers), lignes = matériau (10 fer, 8 acier…)
//  - items   : potions, clés, pièces, gemmes, parchemins, bonus, provisions
(() => {
  'use strict';
  const ICON_SHEETS = {
    weapons: { src: 'assets/icons/weapons.png', cols: 10, rows: 13 },
    items:   { src: 'assets/icons/items.png',   cols: 8,  rows: 7 },
  };

  // Bâtiments de la carte de run (Mini World Sprites de Shade, CC0) : planche, case [col, ligne]
  // en tuiles de 16 px, taille en tuiles. Bleu cyan = rebelles, rouge = tyran.
  const MAP_SPRITES = {
    rest: { src: 'assets/world/houses.png',         at: [1, 0], size: [1, 1] }, // village libéré
    shop: { src: 'assets/world/market.png',         at: [0, 2], size: [1, 1] }, // étal du marchand
    camp: { src: 'assets/world/rebel-barracks.png', at: [1, 1], size: [1, 1] }, // camp rebelle (départ)
    event: { src: 'assets/world/cave.png',          at: [0, 0], size: [1, 1] }, // lieu inconnu (événement)
    boss: { src: 'assets/world/tyrant-keep.png',    at: [0, 0], size: [2, 2] }, // château du général
  };

  // Emblèmes des bâtiments de la forteresse : glyphes 7×7 dessinés dans un écusson 9×9
  // (le pack Mini World donne à tous les bâtiments la même allure, l'emblème dit ce qu'ils font).
  const EMBLEM_GLYPHS = {
    sword:  ['...1...', '...1...', '...1...', '...1...', '.11111.', '...1...', '..111..'],
    mug:    ['.1111..', '.1..111', '.1..1.1', '.1..1.1', '.1..111', '.1..1..', '.1111..'],
    shield: ['1111111', '1.....1', '1..1..1', '1.111.1', '.1.1.1.', '..1.1..', '...1...'],
    wheat:  ['1..1..1', '.1.1.1.', '..111..', '...1...', '...1...', '...1...', '...1...'],
    coin:   ['..111..', '.1...1.', '1..1..1', '1..1..1', '1..1..1', '.1...1.', '..111..'],
    staff:  ['..111..', '.1...1.', '..111..', '...1...', '...1...', '...1...', '...1...'],
    cross:  ['..111..', '..111..', '1111111', '1111111', '1111111', '..111..', '..111..'],
    chevron: ['...1...', '..1.1..', '.1...1.', '1..1..1', '..1.1..', '.1...1.', '1.....1'],
    flame:  ['...1...', '..11...', '..111..', '.1111.1', '.11.111', '1111111', '.11111.'],
    bag:    ['..1.1..', '...1...', '.11111.', '1111111', '1111111', '1111111', '.11111.'],
  };

  // Icônes d'objets prévues pour les ressources et les consommables de run.
  const ITEM_ICONS = {
    gold:     { sheet: 'items', at: [2, 2] }, // pièces d'or
    supplies: { sheet: 'items', at: [0, 6] }, // sac de provisions (ravitaillement)
    potion:   { sheet: 'items', at: [0, 0] }, // potion de soin
  };

  Object.assign(Resistance, { ICON_SHEETS, MAP_SPRITES, EMBLEM_GLYPHS, ITEM_ICONS });
})();

// La forteresse rebelle (hub entre les runs). On y dépense le ravitaillement rapporté des
// runs pour construire et améliorer des bâtiments ; chaque niveau renforce toutes les runs
// suivantes. Sprites : Mini World Sprites (Shade, CC0), bleu cyan = rebelles.
//  pos     : case (colonne, ligne) sur la grille 15×10 de l'écran
//  costs   : coût en ravitaillement de chaque niveau (leur nombre = niveau maximum)
//  effect  : bonus apportés par niveau (additionnés, voir fortressBonuses)
//  sprites : apparence à chaque niveau construit ; avant, un chantier (PLOT) ou `base`
//  exchange: le bâtiment ouvre un comptoir (acheter du ravitaillement) en plus de s'améliorer
(() => {
  'use strict';
  const W = 'assets/world/';

  const PLOT = { src: `${W}huts.png`, at: [0, 0] }; // fondations d'un bâtiment à construire

  // Règles de la méta-progression (fin de run et trésor de la rébellion)
  const META_RULES = {
    minSuppliesPerRun: 1,   // ravitaillement rapporté au minimum, même d'une run perdue tôt
    goldKept: 0.5,          // part de l'or restant en fin de run versée au trésor (+ Trésorerie)
    supplyPrice: 25,        // prix d'un ravitaillement au comptoir de la Trésorerie, en or
    // Vétéran (Mémorial) : rappel payé en or à l'Intendance, plus cher à chaque grade ;
    // il garde une part de ses niveaux (base + bonus du Mémorial).
    veteranPrice: 80,
    veteranPriceStep: 40,
    veteranKeep: 0.25,
  };

  // Prix du rappel d'un vétéran selon son grade actuel (0 : jamais rappelé)
  const veteranPrice = (vet) => META_RULES.veteranPrice + META_RULES.veteranPriceStep * (vet?.grade ?? 0);

  // Préparatifs de la prochaine run, achetés à l'Intendance avec l'or du trésor et consommés au
  // départ suivant (le choix : préparer la prochaine run ou convertir l'or en ravitaillement).
  //  id      : objet (items.js), arme (weapons.js) ou préparatif de PREP_EXTRAS
  //  price   : prix en or du trésor ; max : quantité préparée au plus pour une run
  const PREPARATION = [
    { id: 'vulneraire', price: 20, max: 5 },
    { id: 'elixir', price: 60, max: 2 },
    { id: 'phoenix', price: 100, max: 1 },
    { id: 'manual', price: 60, max: 2 },
    { id: 'steelSword', price: 60, max: 1 },
    { id: 'steelLance', price: 65, max: 1 },
    { id: 'steelAxe', price: 70, max: 1 },
    { id: 'steelBow', price: 65, max: 1 },
    { id: 'armorslayer', price: 70, max: 1 },
    { id: 'hammer', price: 70, max: 1 },
    { id: 'halberd', price: 65, max: 1 },
  ];

  // Préparatifs qui ne sont ni des objets ni des armes. effect : ajouté aux bonus de la run.
  const PREP_EXTRAS = {
    manual: {
      name: 'Manuel de tactique', desc: '+1 niveau de départ pour chaque recrue (cette run)',
      icon: [3, 3], effect: { startLevels: 1 },
    },
    // Rappel du vétéran du Mémorial (prix : veteranPrice) ; il prend une place de l'armée
    veteran: { name: 'Rappel du vétéran', desc: 'Il rejoint l\'armée comme Capitaine', icon: [0, 4] },
  };

  const FORTRESS = {
    keep: {
      name: 'Quartier général', pos: [7, 4],
      sprite: { src: `${W}rebel-keep.png`, at: [0, 0], size: [2, 2] },
    },
    // Intendance : toujours ouverte, sans niveaux (voir PREPARATION)
    quartermaster: {
      name: 'Intendance', pos: [12, 3], emblem: { glyph: 'bag', color: '#8a5a30' },
      sprite: { src: `${W}rebel-market.png`, at: [0, 1] },
    },
    buildings: {
      barracks: {
        name: 'Caserne', pos: [4, 4], costs: [6, 12], emblem: { glyph: 'sword', color: '#c83c3c' },
        effect: { slots: 1 }, effectText: "+1 place dans l'armée",
        sprites: [{ src: `${W}rebel-barracks.png`, at: [0, 1] }, { src: `${W}rebel-barracks.png`, at: [1, 1] }],
      },
      tavern: {
        name: 'Taverne', pos: [10, 4], costs: [4, 8], emblem: { glyph: 'mug', color: '#d08a2c' },
        effect: { candidates: 1, traitChance: 0.15 }, effectText: '+1 candidat au recrutement, +15 % de traits',
        sprites: [{ src: `${W}rebel-tavern.png`, at: [0, 1] }, { src: `${W}rebel-tavern.png`, at: [1, 1] }],
      },
      armory: {
        name: "Salle d'armes", pos: [4, 7], costs: [5, 10], emblem: { glyph: 'shield', color: '#5a6a9c' },
        effect: { startLevels: 1 }, effectText: '+1 niveau de départ pour chaque recrue',
        sprites: [{ src: `${W}rebel-workshop.png`, at: [0, 2] }, { src: `${W}rebel-workshop.png`, at: [1, 0] }],
      },
      farm: {
        // Premiers niveaux bon marché (29/10) : la Ferme à 1 et l'Infirmerie à 2, pour qu'une
        // première campagne, même perdue tôt, permette déjà de construire quelque chose
        name: 'Ferme', pos: [2, 6], costs: [1, 7], emblem: { glyph: 'wheat', color: '#6a9c34' },
        effect: { startRations: 2 }, effectText: "+2 rations (rendent 5 PV) dans le sac au départ",
        sprites: [{ src: `${W}resources.png`, at: [0, 1] }, { src: `${W}rebel-resources.png`, at: [0, 1] }],
        // Champs autour du moulin : terre labourée, puis blé mûr à partir de minLevel
        fields: {
          empty: { src: `${W}wheatfield.png`, at: [0, 0] },
          ripe: { src: `${W}wheatfield.png`, at: [3, 0] },
          spots: [
            { dx: 0, dy: 1, minLevel: 1 }, { dx: -1, dy: 1, minLevel: 1 },
            { dx: -1, dy: 0, minLevel: 2 }, { dx: 1, dy: 1, minLevel: 2 },
          ],
        },
      },
      // Le comptoir existe dès le début (base) : on y achète du ravitaillement avec l'or du trésor.
      treasury: {
        name: 'Trésorerie', pos: [12, 6], costs: [4, 8], exchange: true, emblem: { glyph: 'coin', color: '#c8a020' },
        effect: { goldKept: 0.25 }, effectText: "+25 % de l'or gardé en fin de run",
        base: { src: `${W}market.png`, at: [1, 0] },
        sprites: [{ src: `${W}market.png`, at: [2, 2] }, { src: `${W}rebel-market.png`, at: [2, 2] }],
      },
      // Mémorial : dès le niveau 1, on désigne en fin de run un soldat (mort ou vivant) qui
      // pourra être rappelé comme Capitaine. Chaque niveau : +25 % des niveaux qu'il garde.
      memorial: {
        name: 'Mémorial', pos: [2, 3], costs: [5, 10], emblem: { glyph: 'chevron', color: '#7a4ab0' },
        effect: { veteranKeep: 0.25 }, effectText: '+25 % des niveaux gardés par le vétéran (désigné en fin de run)',
        sprites: [{ src: `${W}rebel-tower.png`, at: [0, 0] }, { src: `${W}rebel-tower.png`, at: [1, 4] }],
      },
      // Autel du phénix : protection contre la mort définitive à chaque run
      altar: {
        name: 'Autel du phénix', pos: [12, 8], costs: [8, 16], emblem: { glyph: 'flame', color: '#d0602c' },
        effect: { startPhoenix: 1 }, effectText: '+1 Fleur du phénix dans le sac au départ (sauve une unité tombée)',
        sprites: [{ src: `${W}rebel-chapel.png`, at: [1, 0] }, { src: `${W}rebel-chapel.png`, at: [1, 1] }],
      },
      // Chapelle : débloque le soigneur au recrutement (un candidat par niveau) et renforce ses soins
      chapel: {
        name: 'Chapelle', pos: [5, 2], costs: [6, 12], emblem: { glyph: 'staff', color: '#3a8ac0' },
        effect: { clerics: 1, healBonus: 3 }, effectText: '+1 soigneur parmi les candidats, +3 PV par soin',
        sprites: [{ src: `${W}rebel-chapel.png`, at: [2, 0] }, { src: `${W}rebel-chapel.png`, at: [2, 1] }],
      },
      infirmary: {
        name: 'Infirmerie', pos: [10, 7], costs: [2, 8], emblem: { glyph: 'cross', color: '#c84858' },
        effect: { afterBattleHeal: 0.15 }, effectText: '+15 % de PV rendus après chaque victoire',
        sprites: [{ src: `${W}rebel-chapel.png`, at: [0, 0] }, { src: `${W}rebel-chapel.png`, at: [0, 1] }],
      },
    },
  };

  // Bonus totaux des bâtiments selon leurs niveaux ({ barracks: 1, … }).
  function fortressBonuses(levels = {}) {
    const total = {};
    for (const [id, b] of Object.entries(FORTRESS.buildings)) {
      const lvl = levels[id] ?? 0;
      for (const [k, v] of Object.entries(b.effect)) total[k] = (total[k] ?? 0) + v * lvl;
    }
    return total;
  }

  // Toutes les images de la forteresse (pour le chargement)
  function fortressSprites() {
    return [PLOT, FORTRESS.keep.sprite, FORTRESS.quartermaster.sprite, ...Object.values(FORTRESS.buildings).flatMap((b) =>
      [...b.sprites, ...(b.base ? [b.base] : []), ...(b.fields ? [b.fields.empty, b.fields.ripe] : [])])];
  }

  Object.assign(Resistance, { PLOT, META_RULES, veteranPrice, PREPARATION, PREP_EXTRAS, FORTRESS, fortressBonuses, fortressSprites });
})();

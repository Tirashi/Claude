// Armes. min/max = portée. magic = attaque basée sur MAG contre RES.
// icon : [colonne, ligne] dans la planche d'armes (icons.js).
// price : prix chez le marchand, en or (absent : pas vendue).
// effective : types de déplacement contre lesquels la Puissance de l'arme est triplée
//             (armes « efficaces » de Fire Emblem : de quoi percer les armures).
// Une classe peut manier toutes les armes du même type que son arme de départ.
(() => {
  'use strict';
  const WEAPONS = {
    ironSword:  { name: 'Épée de fer',    type: 'sword', mt: 5,  hit: 90,  crit: 0,  min: 1, max: 1, icon: [0, 10] },
    steelSword: { name: "Épée d'acier",   type: 'sword', mt: 8,  hit: 75,  crit: 0,  min: 1, max: 1, icon: [0, 8], price: 60 },
    slimSword:  { name: 'Épée fine',      type: 'sword', mt: 3,  hit: 100, crit: 5,  min: 1, max: 1, icon: [0, 0], price: 40 },
    armorslayer: { name: 'Perce-armure',  type: 'sword', mt: 8,  hit: 80,  crit: 0,  min: 1, max: 1, icon: [5, 8], price: 70, effective: ['armor'] },
    ironLance:  { name: 'Lance de fer',   type: 'lance', mt: 7,  hit: 80,  crit: 0,  min: 1, max: 1, icon: [4, 10] },
    steelLance: { name: "Lance d'acier",  type: 'lance', mt: 10, hit: 70,  crit: 0,  min: 1, max: 1, icon: [4, 8], price: 65 },
    javelin:    { name: 'Javelot',        type: 'lance', mt: 6,  hit: 65,  crit: 0,  min: 1, max: 2, icon: [4, 0], price: 50 },
    halberd:    { name: 'Hallebarde',     type: 'lance', mt: 7,  hit: 70,  crit: 0,  min: 1, max: 1, icon: [4, 9], price: 65, effective: ['mounted'] },
    ironAxe:    { name: 'Hache de fer',   type: 'axe',   mt: 8,  hit: 75,  crit: 0,  min: 1, max: 1, icon: [3, 10] },
    steelAxe:   { name: "Hache d'acier",  type: 'axe',   mt: 11, hit: 65,  crit: 0,  min: 1, max: 1, icon: [3, 8], price: 70 },
    handAxe:    { name: 'Hachette',       type: 'axe',   mt: 7,  hit: 60,  crit: 0,  min: 1, max: 2, icon: [3, 1], price: 50 },
    hammer:     { name: 'Marteau',        type: 'axe',   mt: 10, hit: 55,  crit: 0,  min: 1, max: 1, icon: [2, 10], price: 70, effective: ['armor'] },
    ironBow:    { name: 'Arc de fer',     type: 'bow',   mt: 6,  hit: 85,  crit: 0,  min: 2, max: 2, icon: [7, 10] },
    steelBow:   { name: "Arc d'acier",    type: 'bow',   mt: 9,  hit: 70,  crit: 0,  min: 2, max: 2, icon: [7, 8], price: 65 },
    fire:       { name: 'Feu',            type: 'anima', mt: 5,  hit: 90,  crit: 0,  min: 1, max: 2, magic: true, icon: [8, 2] },
    // Bâton (staff) : n'attaque pas ; soigne un allié à portée de Mag + heal PV (action Soigner)
    heal:       { name: 'Bâton de soin',  type: 'staff', mt: 0,  hit: 100, crit: 0,  min: 1, max: 1, staff: true, heal: 10, icon: [1, 10] },
    ironDagger: { name: 'Dague',          type: 'sword', mt: 4,  hit: 95,  crit: 10, min: 1, max: 1, icon: [6, 10] },
  };

  // Triangle des armes : la clé bat la valeur.
  const BEATS = { sword: 'axe', axe: 'lance', lance: 'sword' };

  // Noms des types de déplacement, pour « efficace contre les armures / les cavaliers ».
  const MOVE_TYPE_NAMES = { armor: 'les armures', mounted: 'les cavaliers', foot: 'les fantassins' };

  // Types d'arme : nom affiché et icône (rappel du triangle dans l'interface).
  const WEAPON_TYPES = {
    sword: { name: 'Épée',  icon: [0, 10] },
    axe:   { name: 'Hache', icon: [3, 10] },
    lance: { name: 'Lance', icon: [4, 10] },
    bow:   { name: 'Arc',   icon: [7, 10] },
    anima: { name: 'Magie', icon: [8, 2] },
    staff: { name: 'Bâton', icon: [1, 10] },
  };

  Object.assign(Resistance, { WEAPONS, BEATS, MOVE_TYPE_NAMES, WEAPON_TYPES });
})();

// Classes : statistiques de base, déplacement, sprite, arme par défaut
// et taux de croissance (% de chance de gagner +1 dans chaque stat à chaque niveau).
// deathFrames : nombre d'images de l'animation de mort sur la planche (4 par défaut).
(() => {
  'use strict';
  const CLASSES = {
    swordfighter: { name: 'Bretteur',  sprite: 'SwordFighter',  moveType: 'foot',    mov: 5,
      stats: { hp: 21, str: 5, mag: 0, skl: 9, spd: 10, lck: 5, def: 4, res: 1 }, 
      growths: { hp: 70, str: 40, mag: 5, skl: 60, spd: 65, lck: 50, def: 25, res: 20 }, weapon: 'ironSword' },
    axefighter:   { name: 'Guerrier',  sprite: 'AxeFighter',    moveType: 'foot',    mov: 5,
      stats: { hp: 26, str: 6, mag: 0, skl: 5, spd: 6, lck: 2, def: 5, res: 0 },  
      growths: { hp: 85, str: 60, mag: 0, skl: 40, spd: 35, lck: 30, def: 30, res: 10 }, weapon: 'ironAxe' },
    spearfighter: { name: 'Lancier',   sprite: 'SpearFighter',  moveType: 'foot',    mov: 5,
      stats: { hp: 23, str: 6, mag: 0, skl: 6, spd: 7, lck: 3, def: 6, res: 1 },  
      growths: { hp: 75, str: 50, mag: 0, skl: 45, spd: 45, lck: 35, def: 35, res: 15 }, weapon: 'ironLance' },
    cavalier:     { name: 'Cavalier',  sprite: 'LanceCavalier', moveType: 'mounted', mov: 7, deathFrames: 5,
      stats: { hp: 23, str: 6, mag: 0, skl: 6, spd: 7, lck: 4, def: 7, res: 1 },  
      growths: { hp: 75, str: 45, mag: 0, skl: 45, spd: 45, lck: 35, def: 35, res: 15 }, weapon: 'ironLance' },
    swordcavalier: { name: "Cavalier à l'épée", sprite: 'SwordCavalier', moveType: 'mounted', mov: 7, deathFrames: 5,
      stats: { hp: 22, str: 5, mag: 0, skl: 8, spd: 8, lck: 4, def: 6, res: 1 },
      growths: { hp: 70, str: 40, mag: 0, skl: 55, spd: 55, lck: 40, def: 30, res: 15 }, weapon: 'ironSword' },
    mountedarcher: { name: 'Archer monté', sprite: 'MountedArcher', moveType: 'mounted', mov: 7, deathFrames: 5,
      stats: { hp: 21, str: 5, mag: 0, skl: 7, spd: 7, lck: 4, def: 5, res: 2 },
      growths: { hp: 65, str: 40, mag: 5, skl: 50, spd: 45, lck: 40, def: 25, res: 20 }, weapon: 'ironBow' },
    lanceknight:  { name: 'Chevalier', sprite: 'LanceKnight',   moveType: 'armor',   mov: 4,
      stats: { hp: 27, str: 7, mag: 0, skl: 4, spd: 2, lck: 1, def: 11, res: 0 }, 
      growths: { hp: 85, str: 45, mag: 0, skl: 35, spd: 20, lck: 25, def: 60, res: 10 }, weapon: 'ironLance' },
    axeknight:    { name: 'Chevalier à la hache', sprite: 'AxeKnight', moveType: 'armor', mov: 4,
      stats: { hp: 28, str: 8, mag: 0, skl: 3, spd: 2, lck: 1, def: 10, res: 0 }, 
      growths: { hp: 90, str: 55, mag: 0, skl: 30, spd: 15, lck: 20, def: 55, res: 10 }, weapon: 'ironAxe' },
    archer:       { name: 'Archer',    sprite: 'Archer',        moveType: 'foot',    mov: 5,
      stats: { hp: 20, str: 5, mag: 0, skl: 8, spd: 7, lck: 4, def: 4, res: 2 },  
      growths: { hp: 65, str: 45, mag: 5, skl: 55, spd: 45, lck: 40, def: 25, res: 25 }, weapon: 'ironBow' },
    wizard:       { name: 'Mage',      sprite: 'Wizard',        moveType: 'foot',    mov: 5,
      stats: { hp: 18, str: 0, mag: 6, skl: 6, spd: 7, lck: 4, def: 2, res: 6 },  
      growths: { hp: 55, str: 0, mag: 60, skl: 45, spd: 45, lck: 40, def: 15, res: 50 }, weapon: 'fire' },
    // Soigneur (Chapelle de la forteresse) : bâton de soin, n'attaque pas. Sprite du mage en
    // attendant le clerc de l'extension « Specialist Units » (achat prévu en janvier 2027).
    cleric:       { name: 'Soigneur',  sprite: 'Wizard',        moveType: 'foot',    mov: 5,
      stats: { hp: 17, str: 0, mag: 5, skl: 5, spd: 7, lck: 6, def: 1, res: 7 },
      growths: { hp: 55, str: 0, mag: 55, skl: 35, spd: 45, lck: 50, def: 15, res: 55 }, weapon: 'heal' },
    thief:        { name: 'Voleur',    sprite: 'Thief',         moveType: 'foot',    mov: 6,
      stats: { hp: 18, str: 3, mag: 0, skl: 9, spd: 12, lck: 8, def: 3, res: 0 }, 
      growths: { hp: 60, str: 30, mag: 5, skl: 55, spd: 70, lck: 60, def: 20, res: 20 }, weapon: 'ironDagger' },
  };

  Object.assign(Resistance, { CLASSES });
})();

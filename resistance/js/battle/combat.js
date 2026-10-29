(() => {
  'use strict';
  const { BEATS, manhattan, CAPTAIN } = Resistance;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // +1 : avantage, -1 : désavantage, 0 : neutre
  function triangle(attW, defW) {
    if (BEATS[attW.type] === defW.type) return 1;
    if (BEATS[defW.type] === attW.type) return -1;
    return 0;
  }

  function canReach(unit, dist) {
    if (unit.weapon.staff) return false; // un bâton soigne, il n'attaque pas (et ne riposte pas)
    return dist >= unit.weapon.min && dist <= unit.weapon.max;
  }

  // Aura de Capitaine : un Capitaine allié (pas l'unité elle-même) se tient à côté de `pos`.
  function auraAt(battle, unit, pos) {
    return battle.units.some((c) => c.alive && c.grade && c !== unit && c.team === unit.team
      && manhattan(c, pos) === 1);
  }

  // Valeurs d'attaque d'une unité contre une autre (dégâts, précision, critique).
  function sideStats(battle, att, def, attPos, defPos) {
    const tri = triangle(att.weapon, def.weapon);
    const terr = battle.terrainAt(defPos.x, defPos.y);
    const magic = !!att.weapon.magic;
    // Arme efficace contre ce type d'unité : Puissance de l'arme ×3
    const effective = !!att.weapon.effective?.includes(def.moveType);
    const power = (magic ? att.mag : att.str) + att.weapon.mt * (effective ? 3 : 1) + tri;
    const guard = (magic ? def.res : def.def) + terr.def;
    const auraHit = auraAt(battle, att, attPos) ? CAPTAIN.aura.hit : 0;
    const auraAvo = auraAt(battle, def, defPos) ? CAPTAIN.aura.avo : 0;
    return {
      tri,
      effective,
      aura: auraHit > 0,
      dmg: Math.max(0, power - guard),
      // hitBonus / critBonus / avoBonus : traits des rebelles (0 pour les autres) ; aura de Capitaine
      hit: clamp(att.weapon.hit + att.skl * 2 + Math.floor(att.lck / 2) + tri * 15 + (att.hitBonus ?? 0) + auraHit
                 - (def.spd * 2 + def.lck + terr.avo + (def.avoBonus ?? 0) + auraAvo), 0, 100),
      crit: clamp(att.weapon.crit + Math.floor(att.skl / 2) + (att.critBonus ?? 0) - def.lck, 0, 100),
      count: 1,
    };
  }

  // Prévision complète : l'attaquant se tient en attPos.
  function forecast(battle, att, def, attPos = att) {
    const dist = manhattan(attPos, def);
    const a = sideStats(battle, att, def, attPos, def);
    const d = canReach(def, dist) ? sideStats(battle, def, att, def, attPos) : null;
    if (att.spd - def.spd >= 4) a.count = 2;
    if (d && def.spd - att.spd >= 4) d.count = 2;
    return { a, d, dist };
  }

  // Ordre des coups : attaquant, riposte, puis double attaque éventuelle.
  function strikeOrder(fc) {
    const order = [{ side: 'a' }];
    if (fc.d) order.push({ side: 'd' });
    if (fc.a.count === 2) order.push({ side: 'a' });
    if (fc.d && fc.d.count === 2) order.push({ side: 'd' });
    return order;
  }

  // PV restants si tous les coups touchent (sans critique), en respectant l'ordre des coups.
  function simulateAllHits(att, def, fc) {
    let ha = att.hp, hd = def.hp;
    for (const s of strikeOrder(fc)) {
      if (ha <= 0 || hd <= 0) break;
      if (s.side === 'a') hd = Math.max(0, hd - fc.a.dmg);
      else ha = Math.max(0, ha - fc.d.dmg);
    }
    return { att: ha, def: hd };
  }

  Object.assign(Resistance, { triangle, canReach, auraAt, forecast, strikeOrder, simulateAllHits });
})();

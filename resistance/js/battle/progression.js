// Expérience et montée de niveau.
(() => {
  'use strict';
  const MAX_LEVEL = 20;
  const STAT_KEYS = ['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'];
  const STAT_LABELS = { hp: 'PV', str: 'For', mag: 'Mag', skl: 'Tec', spd: 'Vit', lck: 'Chc', def: 'Déf', res: 'Rés' };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // EXP gagnée par une unité alliée après un échange contre un ennemi.
  //  - n'a touché personne : 1
  //  - a touché           : 10, +2 par niveau d'écart
  //  - a vaincu           : +20, +3 par niveau d'écart, +40 pour un général
  function expGain(unit, enemy, { landed, killed }) {
    if (unit.level >= MAX_LEVEL) return 0;
    if (!landed && !killed) return 1;
    const diff = enemy.level - unit.level;
    let exp = 10 + diff * 2;
    if (killed) exp += 20 + diff * 3 + (enemy.boss ? 40 : 0);
    return clamp(exp, 1, 100);
  }

  // Niveaux « moyens » pour les ennemis : chaque niveau ajoute le gain attendu selon
  // les croissances, sans hasard, pour qu'une même rencontre ait toujours la même difficulté.
  function autoLevel(stats, growths, levels) {
    if (levels <= 0) return;
    for (const k of STAT_KEYS) stats[k] += Math.round(((growths[k] ?? 0) * levels) / 100);
  }

  // Tire les gains d'un niveau selon les taux de croissance.
  // Garantit au moins un gain pour éviter les niveaux "vides", frustrants dans un rogue-lite.
  function rollLevelUp(unit, rng) {
    const gains = {};
    for (const k of STAT_KEYS) {
      if (rng.next() * 100 < (unit.growths[k] ?? 0)) gains[k] = 1;
    }
    if (!Object.keys(gains).length) {
      const best = STAT_KEYS.reduce((a, b) => ((unit.growths[b] ?? 0) > (unit.growths[a] ?? 0) ? b : a));
      gains[best] = 1;
    }
    const before = Object.fromEntries(STAT_KEYS.map((k) => [k, k === 'hp' ? unit.maxHp : unit[k]]));
    for (const k of Object.keys(gains)) {
      if (k === 'hp') { unit.maxHp += 1; unit.hp += 1; } else unit[k] += 1;
    }
    unit.level += 1;
    return { before, gains };
  }

  Object.assign(Resistance, { MAX_LEVEL, STAT_KEYS, STAT_LABELS, expGain, autoLevel, rollLevelUp });
})();

// Vérifie la cohérence des données au démarrage et signale les erreurs dans la console :
// ajouter une carte ou une rencontre ne doit pas casser le jeu en silence.
(() => {
  'use strict';
  const { CLASSES, WEAPONS, TERRAIN, moveCost, MAPS, ENCOUNTERS, COUNTRIES, RECRUITMENT, NAMES, TRAITS, STAT_KEYS, ICON_SHEETS, ITEM_ICONS, ITEMS, FORTRESS, PREPARATION, PREP_EXTRAS, fortressBonuses, EVENTS, WEAPON_UPGRADES } = Resistance;

  function validateData() {
    const problems = [];
    const tileAt = (map, x, y) => TERRAIN[map.tiles[y]?.[x]];

    for (const [id, map] of Object.entries(MAPS)) {
      const w = map.tiles[0].length;
      map.tiles.forEach((row, y) => {
        if (row.length !== w) problems.push(`carte ${id} : la ligne ${y} fait ${row.length} cases au lieu de ${w}`);
        for (const ch of row) if (!TERRAIN[ch]) problems.push(`carte ${id} : terrain inconnu « ${ch} »`);
      });
      // Armée maximale : places de base + toutes les places de la caserne, ou recrues des événements
      const maxArmy = Math.max(RECRUITMENT.maxArmy, RECRUITMENT.slots + (fortressBonuses(Object.fromEntries(
        Object.entries(FORTRESS.buildings).map(([bid, b]) => [bid, b.costs.length]))).slots ?? 0));
      if (map.spawns.length < maxArmy) problems.push(`carte ${id} : ${map.spawns.length} cases de départ pour une armée de ${maxArmy}`);
      for (const s of map.spawns) {
        const t = tileAt(map, s.x, s.y);
        if (!t || ['foot', 'armor', 'mounted'].some((m) => !isFinite(moveCost(t, m)))) {
          problems.push(`carte ${id} : case de départ (${s.x},${s.y}) infranchissable`);
        }
      }
    }

    for (const [id, enc] of Object.entries(ENCOUNTERS)) {
      const map = MAPS[enc.map];
      if (!map) { problems.push(`rencontre ${id} : carte « ${enc.map} » inconnue`); continue; }
      const used = new Set(map.spawns.map((s) => `${s.x},${s.y}`));
      for (const e of enc.enemies) {
        const cls = CLASSES[e.cls];
        if (!cls) { problems.push(`rencontre ${id} : classe « ${e.cls} » inconnue`); continue; }
        if (e.weapon && !WEAPONS[e.weapon]) problems.push(`rencontre ${id} : arme « ${e.weapon} » inconnue`);
        const t = tileAt(map, e.x, e.y);
        if (!t || !isFinite(moveCost(t, cls.moveType))) problems.push(`rencontre ${id} : ${e.cls} sur une case infranchissable (${e.x},${e.y})`);
        const k = `${e.x},${e.y}`;
        if (used.has(k)) problems.push(`rencontre ${id} : case (${k}) déjà occupée`);
        used.add(k);
      }
    }

    for (const [id, c] of Object.entries(COUNTRIES)) {
      const { boss, ...pools } = c.encounters;
      for (const list of Object.values(pools)) {
        for (const e of list) if (!ENCOUNTERS[e]) problems.push(`pays ${id} : rencontre « ${e} » inconnue`);
      }
      if (!ENCOUNTERS[boss]) problems.push(`pays ${id} : général « ${boss} » inconnu`);
    }

    const inSheet = (sheet, [c, r]) => c >= 0 && r >= 0 && c < ICON_SHEETS[sheet].cols && r < ICON_SHEETS[sheet].rows;
    for (const [id, w] of Object.entries(WEAPONS)) {
      if (w.icon && !inSheet('weapons', w.icon)) problems.push(`arme ${id} : icône hors de la planche`);
    }
    for (const [id, it] of Object.entries(ITEMS)) {
      if (!it.icon || !inSheet('items', it.icon)) problems.push(`objet ${id} : icône hors de la planche`);
    }
    for (const [cid, c] of Object.entries(COUNTRIES)) {
      for (const id of [...(c.shop?.always ?? []), ...(c.shop?.pool ?? [])]) {
        const def = ITEMS[id] ?? WEAPONS[id];
        if (!def) problems.push(`pays ${cid} : article de marchand « ${id} » inconnu`);
        else if (!(def.price > 0)) problems.push(`pays ${cid} : « ${id} » n'a pas de prix`);
      }
    }
    // Événements : rencontres et objets connus, et toujours un choix libre (sans coût ni condition)
    const outcomes = (o) => (o.chance !== undefined ? [o.success, o.failure] : [o]);
    for (const [id, ev] of Object.entries(EVENTS)) {
      if (!ev.choices.some((c) => !c.cost && !c.requires)) problems.push(`événement ${id} : aucun choix toujours possible`);
      for (const c of ev.choices) {
        for (const o of outcomes(c.outcome)) {
          if (!o) { problems.push(`événement ${id} : issue manquante (« ${c.label} »)`); continue; }
          if (o.battle && !ENCOUNTERS[o.battle]) problems.push(`événement ${id} : rencontre « ${o.battle} » inconnue`);
          for (const item of Object.keys(o.items ?? {})) if (!ITEMS[item]) problems.push(`événement ${id} : objet « ${item} » inconnu`);
        }
      }
    }
    for (const [cid, c] of Object.entries(COUNTRIES)) {
      for (const e of c.events ?? []) if (!EVENTS[e]) problems.push(`pays ${cid} : événement « ${e} » inconnu`);
    }
    for (const [from, to] of Object.entries(WEAPON_UPGRADES)) {
      if (!WEAPONS[from] || !WEAPONS[to] || WEAPONS[from].type !== WEAPONS[to].type) problems.push(`forge : ${from} → ${to} invalide`);
    }
    for (const p of PREPARATION) {
      const def = ITEMS[p.id] ?? WEAPONS[p.id] ?? PREP_EXTRAS[p.id];
      if (!def) problems.push(`intendance : préparatif « ${p.id} » inconnu`);
      else if (!(p.price > 0) || !(p.max > 0)) problems.push(`intendance : « ${p.id} » sans prix ou sans quantité`);
    }
    for (const [id, x] of Object.entries(PREP_EXTRAS)) {
      if (!inSheet('items', x.icon)) problems.push(`préparatif ${id} : icône hors de la planche`);
    }
    for (const [id, it] of Object.entries(ITEM_ICONS)) {
      if (!ICON_SHEETS[it.sheet] || !inSheet(it.sheet, it.at)) problems.push(`icône ${id} : hors de la planche`);
    }

    for (const c of RECRUITMENT.classes) if (!CLASSES[c]) problems.push(`recrutement : classe « ${c} » inconnue`);
    if (NAMES.length < RECRUITMENT.candidates) problems.push('recrutement : pas assez de noms pour les candidats');
    if (RECRUITMENT.slots > RECRUITMENT.candidates) problems.push('recrutement : plus de places que de candidats');
    for (const [id, t] of Object.entries(TRAITS)) {
      for (const k of Object.keys(t.stats ?? {})) if (!STAT_KEYS.includes(k)) problems.push(`trait ${id} : stat « ${k} » inconnue`);
    }

    for (const p of problems) console.warn('[données]', p);
    return problems;
  }

  Object.assign(Resistance, { validateData });
})();

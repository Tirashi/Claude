// État d'une run : la carte du pays, l'armée rebelle (qui garde PV, niveaux et EXP
// d'un combat à l'autre) et la position de l'armée sur la carte.
(() => {
  'use strict';
  const { RNG, CLASSES, COUNTRIES, RUN_RULES, RECRUITMENT, NAMES, TRAITS, CAPTAIN, traitsOf, traitBonus, traitLabel, WEAPONS, ITEMS, PREP_EXTRAS, WEAPON_UPGRADES, STAT_KEYS, rollLevelUp, generateRunMap } = Resistance;

  // Graine sur 32 bits (ce que RNG utilise réellement), pour qu'une graine affichée
  // redonne exactement la même run. `?seed=123` dans l'URL rejoue une run donnée.
  const randomSeed = () => Date.now() >>> 0;

  // Une classe manie toutes les armes du même type que son arme de départ.
  function canWield(clsId, weaponId) {
    return WEAPONS[CLASSES[clsId].weapon].type === WEAPONS[weaponId].type;
  }

  // Article de marchand : objet ou arme
  const shopEntry = (id) => ITEMS[id] ?? WEAPONS[id];

  // Niveau auquel revient un vétéran rappelé : une part `keep` de ses niveaux enregistrés,
  // plus les niveaux de départ de la run (Salle d'armes, Manuel de tactique).
  const veteranReturnLevel = (vet, keep, startLevels = 0) =>
    1 + Math.floor((vet.level - 1) * keep) + startLevels;

  // Préparatif de l'Intendance : objet, arme ou préparatif spécial (manuel…)
  const prepEntry = (id) => ITEMS[id] ?? WEAPONS[id] ?? PREP_EXTRAS[id];

  // « Vulnéraire ×2, Épée d'acier » (préparatifs { id: quantité }), ou '' s'il n'y a rien
  const prepText = (prep = {}) => Object.entries(prep).filter(([, n]) => n > 0)
    .map(([id, n]) => `${prepEntry(id).name}${n > 1 ? ` ×${n}` : ''}`).join(', ');

  // Bonus de run apportés par les préparatifs spéciaux (manuel de tactique : +1 niveau…)
  function prepBonuses(prep = {}, bonuses = {}) {
    const total = { ...bonuses };
    for (const [id, n] of Object.entries(prep)) {
      for (const [k, v] of Object.entries(PREP_EXTRAS[id]?.effect ?? {})) total[k] = (total[k] ?? 0) + v * n;
    }
    return total;
  }

  // Candidats au recrutement. Tirés sur leur propre flux aléatoire, pour que changer
  // le recrutement ne change pas la carte d'une graine donnée.
  // opts : { candidates, traitChance, startLevels } (valeurs de base + bonus de la forteresse)
  function makeCandidates(rng, opts) {
    const names = [...NAMES];
    const take = (list) => list.splice(rng.int(0, list.length - 1), 1)[0];
    // Chaque classe de base apparaît au moins une fois quand il y a assez de candidats.
    const classes = [...RECRUITMENT.classes];
    const traitIds = Object.keys(TRAITS);
    const out = [];
    for (let i = 0; i < opts.candidates; i++) {
      const cls = classes.length ? take(classes) : RECRUITMENT.classes[rng.int(0, RECRUITMENT.classes.length - 1)];
      const trait = rng.next() < opts.traitChance ? traitIds[rng.int(0, traitIds.length - 1)] : null;
      const stats = { ...CLASSES[cls].stats };
      for (const [k, v] of Object.entries(TRAITS[trait]?.stats ?? {})) stats[k] += v;
      // Niveaux de départ (Salle d'armes) : de vraies montées de niveau, tirées avec la graine
      const unit = { ...stats, maxHp: stats.hp, hp: stats.hp, level: 1, growths: growthsOf(cls, [trait].filter(Boolean)) };
      for (let l = 0; l < opts.startLevels; l++) rollLevelUp(unit, rng);
      const leveled = Object.fromEntries(STAT_KEYS.map((k) => [k, k === 'hp' ? unit.maxHp : unit[k]]));
      out.push({ name: take(names), cls, trait, stats: leveled, level: unit.level });
    }
    // Mélange final : les classes garanties ne sont pas toujours en tête de liste
    for (let i = out.length - 1; i > 0; i--) {
      const j = rng.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  // Croissances d'un soldat : celles de sa classe, plus le bonus de ses traits (Prodige…)
  function growthsOf(cls, traits) {
    const bonus = traitBonus(traits).growths;
    return Object.fromEntries(Object.entries(CLASSES[cls].growths)
      .map(([k, v]) => [k, v > 0 ? v + bonus : v]));
  }

  function enlist(candidate, armyId) {
    const cls = CLASSES[candidate.cls];
    const stats = { ...candidate.stats };
    return {
      armyId, name: candidate.name, cls: candidate.cls, trait: candidate.trait, level: candidate.level, exp: 0,
      stats, hp: stats.hp, weapon: cls.weapon, alive: true,
    };
  }

  class Run {
    // bonuses : améliorations de la forteresse (fortressBonuses dans data/fortress.js)
    constructor(seed, countryId = 'marches', bonuses = {}) {
      this.seed = seed >>> 0;
      this.countryId = countryId;
      this.country = COUNTRIES[countryId];
      this.map = generateRunMap(new RNG(this.seed), this.country);
      this.slots = RECRUITMENT.slots + (bonuses.slots ?? 0);
      this.rules = { ...RUN_RULES, afterBattleHeal: RUN_RULES.afterBattleHeal + (bonuses.afterBattleHeal ?? 0) };
      this.traitChance = Math.min(1, RECRUITMENT.traitChance + (bonuses.traitChance ?? 0));
      this.startLevels = bonuses.startLevels ?? 0;
      this.candidates = makeCandidates(new RNG((this.seed ^ 0x52656372) >>> 0), {
        candidates: Math.max(this.slots, RECRUITMENT.candidates + (bonuses.candidates ?? 0)),
        traitChance: this.traitChance,
        startLevels: this.startLevels,
      });
      this.army = [];           // rempli par recruit() au début de la run
      this.veteran = null;      // Capitaine rappelé du Mémorial (recallVeteran), avant le recrutement
      this.current = null;      // nœud où se trouve l'armée (null : avant le premier)
      this.visited = new Set();
      this.over = false;
      this.gold = 0;            // se dépense pendant la run (marchand)
      this.supplies = 0;        // ravitaillement, rapporté à la forteresse en fin de run
      this.inventory = {};      // sac de l'armée : id d'objet -> quantité
      this.stats = { won: 0, turns: 0 }; // bilan de la campagne (combats gagnés, tours joués)
      if (bonuses.startRations) this.inventory.ration = bonuses.startRations; // Ferme de la forteresse
      if (bonuses.startPhoenix) this.inventory.phoenix = bonuses.startPhoenix; // Autel du phénix
    }

    // Préparatifs de l'Intendance : les objets vont dans le sac. Renvoie la liste des armes
    // (une entrée par exemplaire), à confier ensuite aux recrues.
    addPreparations(prep = {}) {
      const weapons = [];
      for (const [id, n] of Object.entries(prep)) {
        if (ITEMS[id]) this.inventory[id] = (this.inventory[id] ?? 0) + n;
        else if (WEAPONS[id]) for (let i = 0; i < n; i++) weapons.push(id);
      }
      return weapons;
    }

    // Confie une arme préparée à une recrue (son arme de départ est remplacée).
    equip(armyId, weaponId) {
      const rec = this.army.find((r) => r.armyId === armyId);
      if (!rec || !canWield(rec.cls, weaponId)) return false;
      rec.weapon = weaponId;
      return true;
    }

    // ------------------------------------------------------------ événements
    // Chaque événement a son propre flux aléatoire, dérivé de la graine et du nœud.
    eventRng(node) { return new RNG((this.seed ^ Math.imul(node.id + 1, 0x4556454e)) >>> 0); }

    hasRoom() { return this.livingArmy().length < RECRUITMENT.maxArmy; }
    upgradableUnits() { return this.livingArmy().filter((r) => WEAPON_UPGRADES[r.weapon]); }

    // Un choix d'événement est-il possible (coût, condition) ?
    canChoose(choice) {
      if ((choice.cost?.gold ?? 0) > this.gold) return false;
      if (choice.requires?.room && !this.hasRoom()) return false;
      if (choice.requires?.upgradable && !this.upgradableUnits().length) return false;
      return true;
    }

    // Applique l'issue d'un choix (voir events.js). Renvoie { text, lines, battle, loot,
    // upgradeWeapon } : `lines` décrit ce qui a changé ; combat et forge restent à jouer par le jeu.
    applyOutcome(choice, rng) {
      let o = choice.outcome;
      if (o.chance !== undefined) o = rng.next() < o.chance ? o.success : o.failure;
      const lines = [];
      const cost = choice.cost?.gold ?? 0;
      if (cost) { this.gold -= cost; lines.push(`-${cost} or`); }
      if (o.gold) { this.gold = Math.max(0, this.gold + o.gold); lines.push(`${o.gold > 0 ? '+' : ''}${o.gold} or`); }
      if (o.supplies) { this.supplies += o.supplies; lines.push(`+${o.supplies} ravitaillement`); }
      for (const [id, n] of Object.entries(o.items ?? {})) {
        this.inventory[id] = (this.inventory[id] ?? 0) + n;
        lines.push(`+${n} ${ITEMS[id].name}`);
      }
      for (const rec of this.livingArmy()) {
        if (o.heal) rec.hp = Math.min(rec.stats.hp, rec.hp + Math.round(rec.stats.hp * o.heal));
        if (o.damage) rec.hp = Math.max(1, rec.hp - Math.round(rec.stats.hp * o.damage));
      }
      if (o.heal) lines.push(o.heal >= 1 ? "PV de toute l'armée rendus" : `+${Math.round(o.heal * 100)} % de PV pour l'armée`);
      if (o.damage) lines.push(`-${Math.round(o.damage * 100)} % de PV pour toute l'armée`);
      if (o.levelUp) {
        const living = this.livingArmy();
        const rec = living[rng.int(0, living.length - 1)];
        for (let i = 0; i < o.levelUp; i++) this.levelUp(rec, rng);
        lines.push(`${rec.name} passe au niveau ${rec.level}`);
      }
      if (o.recruit && this.hasRoom()) {
        const rec = this.recruitOne(rng);
        lines.push(`${rec.name} (${CLASSES[rec.cls].name}${rec.trait ? `, ${TRAITS[rec.trait].name}` : ''}) rejoint l'armée`);
      }
      return { text: o.text, lines, battle: o.battle ?? null, loot: o.loot ?? null, upgradeWeapon: !!o.upgradeWeapon };
    }

    // Une montée de niveau hors combat (sanctuaire…), soin complet comme en combat.
    levelUp(rec, rng) {
      const unit = { ...rec.stats, maxHp: rec.stats.hp, hp: rec.hp, level: rec.level, growths: growthsOf(rec.cls, traitsOf(rec)) };
      rollLevelUp(unit, rng);
      rec.stats = Object.fromEntries(STAT_KEYS.map((k) => [k, k === 'hp' ? unit.maxHp : unit[k]]));
      rec.level = unit.level;
      rec.hp = Math.min(rec.stats.hp, unit.hp + Math.round(rec.stats.hp * this.rules.levelUpHeal));
    }

    // Recrue rencontrée en chemin : à peu près au niveau de l'armée, nom différent des autres.
    recruitOne(rng) {
      const living = this.livingArmy();
      const avg = living.reduce((s, r) => s + r.level, 0) / Math.max(1, living.length);
      const level = Math.max(1 + this.startLevels, Math.round(avg) - 1);
      const names = new Set(this.army.map((r) => r.name));
      let cand;
      for (let i = 0; i < 10; i++) {
        cand = makeCandidates(rng, { candidates: 1, traitChance: this.traitChance, startLevels: level - 1 })[0];
        if (!names.has(cand.name)) break;
      }
      const rec = enlist(cand, Math.max(-1, ...this.army.map((r) => r.armyId)) + 1);
      this.army.push(rec);
      return rec;
    }

    // Butin d'un nœud (combat gagné, repos…). Renvoie ce qui a été gagné.
    // `node.loot` (combat d'un événement) remplace le butin habituel du type de nœud.
    collectRewards(node) {
      const r = node.loot ?? this.country.rewards[node.type];
      if (!r) return { gold: 0, supplies: 0 };
      const gold = (r.gold ?? 0) + (r.goldPerFloor ?? 0) * node.floor;
      const supplies = r.supplies ?? 0;
      this.gold += gold;
      this.supplies += supplies;
      return { gold, supplies };
    }

    // Achat chez le marchand. armyId : soldat qui reçoit l'arme (l'ancienne est abandonnée).
    buy(entry, armyId = null) {
      const def = shopEntry(entry.id);
      if (entry.qty <= 0 || this.gold < def.price) return false;
      if (ITEMS[entry.id]) {
        this.inventory[entry.id] = (this.inventory[entry.id] ?? 0) + 1;
      } else {
        const rec = this.army.find((r) => r.armyId === armyId);
        if (!rec || !canWield(rec.cls, entry.id)) return false;
        rec.weapon = entry.id;
      }
      this.gold -= def.price;
      entry.qty--;
      return true;
    }

    get floor() { return this.current ? this.current.floor : -1; }

    // indices : candidats choisis par le joueur (dans l'ordre de l'armée) ; le Capitaine
    // rappelé, s'il y en a un, prend la tête de l'armée.
    recruit(indices) {
      const recruits = indices.map((i) => enlist(this.candidates[i], 0));
      this.army = [...(this.veteran ? [this.veteran] : []), ...recruits];
      this.army.forEach((r, i) => { r.armyId = i; });
    }

    // Places à pourvoir au recrutement (le Capitaine en prend une)
    get recruitSlots() { return this.slots - (this.veteran ? 1 : 0); }

    // Vétéran du Mémorial rappelé : un grade et un trait de plus (jusqu'à CAPTAIN.maxGrade),
    // une part `keep` de ses niveaux, retirés avec la graine. vet : sauvegarde (meta.veteran).
    recallVeteran(vet, keep) {
      const rng = new RNG((this.seed ^ 0x56455445) >>> 0);
      const grade = Math.min(CAPTAIN.maxGrade, (vet.grade ?? 0) + 1);
      const captainTraits = [...(vet.captainTraits ?? [])];
      if (grade > (vet.grade ?? 0)) {
        const owned = new Set([vet.trait, ...captainTraits]);
        const pool = Object.keys(TRAITS).filter((t) => !owned.has(t));
        if (pool.length) captainTraits.push(pool[rng.int(0, pool.length - 1)]);
      }
      const traits = [vet.trait, ...captainTraits].filter(Boolean);
      const stats = { ...CLASSES[vet.cls].stats };
      for (const t of traits) for (const [k, v] of Object.entries(TRAITS[t].stats ?? {})) stats[k] += v;
      const unit = { ...stats, maxHp: stats.hp, hp: stats.hp, level: 1, growths: growthsOf(vet.cls, traits) };
      const levels = veteranReturnLevel(vet, keep, this.startLevels) - 1;
      for (let l = 0; l < levels; l++) rollLevelUp(unit, rng);
      const leveled = Object.fromEntries(STAT_KEYS.map((k) => [k, k === 'hp' ? unit.maxHp : unit[k]]));
      this.veteran = {
        armyId: 0, name: vet.name, cls: vet.cls, trait: vet.trait, captainTraits, grade,
        level: unit.level, exp: 0, stats: leveled, hp: leveled.hp, weapon: CLASSES[vet.cls].weapon, alive: true,
      };
      return this.veteran;
    }

    node(id) { return this.map.nodes[id]; }

    selectableNodes() {
      if (this.over) return [];
      if (!this.current) return this.map.nodes.filter((n) => n.floor === 0);
      return this.current.next.map((id) => this.node(id));
    }

    moveTo(node) {
      this.current = node;
      this.visited.add(node.id);
    }

    livingArmy() { return this.army.filter((r) => r.alive); }

    // Chaque combat a sa propre graine, dérivée de celle de la run et du nœud.
    battleSeed(node) { return (this.seed ^ Math.imul(node.id + 1, 0x9e3779b1)) >>> 0; }

    levelBonus(node) {
      return Math.floor(node.floor * this.country.levelPerFloor)
        + (node.type === 'elite' ? this.country.eliteLevelBonus : 0);
    }

    // Reporte le résultat d'un combat gagné sur l'armée. Renvoie un bilan par unité.
    // heal : soin d'après victoire (pas après une retraite) ; revive : les objets de protection
    // (Fleur du phénix) ramènent les unités tombées (pas après une défaite : la run est perdue).
    applyBattle(battle, { heal = true, revive = true } = {}) {
      const report = [];
      for (const u of battle.units) {
        if (u.team !== 'player' || u.armyId === null) continue;
        const rec = this.army.find((r) => r.armyId === u.armyId);
        rec.stats = Object.fromEntries(STAT_KEYS.map((k) => [k, k === 'hp' ? u.maxHp : u[k]]));
        rec.level = u.level;
        rec.exp = u.exp;
        rec.kills = (rec.kills ?? 0) + u.kills;
        let healed = 0;
        const fallen = !u.alive;
        const saver = revive && fallen && this.permadeathSaver();
        if (saver) {
          this.inventory[saver] -= 1;
          if (this.inventory[saver] <= 0) delete this.inventory[saver];
          rec.alive = true;
          rec.hp = Math.max(1, Math.round(rec.stats.hp * ITEMS[saver].revive));
          report.push(this.summary(rec, { revived: ITEMS[saver].name }));
          continue;
        }
        if (fallen) {
          if (this.rules.permadeath) rec.fellAt = battle.encounter.name;
          rec.alive = !this.rules.permadeath;
          rec.hp = rec.alive ? 1 : 0;
        } else {
          rec.hp = Math.min(u.maxHp, u.hp + (heal ? Math.round(u.maxHp * this.rules.afterBattleHeal) : 0));
          healed = rec.hp - u.hp;
        }
        report.push(this.summary(rec, { healed, fallen }));
      }
      return report;
    }

    // Objet du sac qui peut sauver une unité tombée (id), ou null
    permadeathSaver() {
      return Object.keys(this.inventory).find((id) => ITEMS[id]?.revive && this.inventory[id] > 0) ?? null;
    }

    rest() {
      return this.livingArmy().map((rec) => {
        const before = rec.hp;
        rec.hp = Math.min(rec.stats.hp, rec.hp + Math.round(rec.stats.hp * this.rules.restHeal));
        return this.summary(rec, { healed: rec.hp - before });
      });
    }

    // Sauvegarde de la run en cours. at : nœud où reprendre (null : sur la carte).
    // La carte est gardée telle quelle (stocks des marchands, combats d'événements).
    toSave(at = null) {
      return {
        seed: this.seed, countryId: this.countryId, map: this.map, slots: this.slots, rules: this.rules,
        traitChance: this.traitChance, startLevels: this.startLevels, candidates: this.candidates,
        army: this.army, current: this.current?.id ?? null, visited: [...this.visited],
        gold: this.gold, supplies: this.supplies, inventory: this.inventory, stats: this.stats, at,
      };
    }

    static fromSave(data) {
      const run = Object.create(Run.prototype);
      Object.assign(run, {
        seed: data.seed, countryId: data.countryId, country: COUNTRIES[data.countryId], map: data.map,
        slots: data.slots, rules: data.rules, traitChance: data.traitChance, startLevels: data.startLevels,
        candidates: data.candidates, army: data.army, visited: new Set(data.visited), over: false,
        gold: data.gold, supplies: data.supplies, inventory: data.inventory,
        stats: data.stats ?? { won: 0, turns: 0 },
      });
      run.current = data.current === null ? null : run.node(data.current);
      run.veteran = run.army.find((r) => r.grade) ?? null; // le Capitaine, s'il y en a un
      return run;
    }

    summary(rec, extra = {}) {
      return {
        name: rec.name, className: CLASSES[rec.cls].name, trait: traitLabel(rec),
        weapon: rec.weapon,
        level: rec.level, exp: rec.exp,
        hp: rec.hp, maxHp: rec.stats.hp, alive: rec.alive, healed: 0, fallen: false, ...extra,
      };
    }
  }

  Object.assign(Resistance, { randomSeed, canWield, shopEntry, veteranReturnLevel, prepEntry, prepText, prepBonuses, Run });
})();

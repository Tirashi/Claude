(() => {
  'use strict';
  const { RNG, CLASSES, WEAPONS, TERRAIN, MAPS, traitsOf, traitBonus, traitLabel, ITEMS, RUN_RULES, reachable, pathTo, threatTiles, key, manhattan, forecast, strikeOrder, canReach, planEnemy, expGain, rollLevelUp, autoLevel, MAX_LEVEL } = Resistance;

  const TILE = 16;

  let nextId = 1;

  // def vient soit d'une rencontre (ennemi : stats de classe + bonus + niveaux de l'étage),
  // soit de l'armée de la run (rebelle : stats déjà acquises dans def.stats, PV actuels dans def.hp).
  function makeUnit(def, team, { mods = {}, levelBonus = 0 } = {}) {
    const cls = CLASSES[def.cls];
    let stats;
    let level = def.level ?? 1;
    if (def.stats) {
      stats = { ...def.stats };
    } else {
      stats = { ...cls.stats };
      for (const [k, v] of Object.entries(def.bonus ?? {})) stats[k] += v;
      autoLevel(stats, cls.growths, levelBonus);
      level += levelBonus;
      for (const [k, v] of Object.entries(mods)) stats[k] = Math.max(0, stats[k] + v);
    }
    // Traits d'un rebelle, Capitaine compris (leurs bonus de stats sont déjà dans def.stats)
    const tb = traitBonus(traitsOf(def));
    const growths = Object.fromEntries(
      Object.entries(cls.growths).map(([k, v]) => [k, v > 0 ? v + tb.growths : v]),
    );
    return {
      id: nextId++,
      team,
      name: def.name ?? cls.name,
      title: def.title ?? null,
      cls: def.cls,
      className: cls.name,
      sprite: `${cls.sprite}_${team === 'player' ? 'blue' : 'red'}`,
      deathFrames: cls.deathFrames ?? 4,
      moveType: cls.moveType,
      mov: cls.mov + tb.mov,
      traitName: traitLabel(def),
      grade: def.grade ?? 0,     // Capitaine : chevrons et aura (combat.js)
      hitBonus: tb.hit, critBonus: tb.crit, avoBonus: tb.avo,
      ...stats,
      maxHp: stats.hp,
      hp: def.hp ?? stats.hp,
      weapon: { ...WEAPONS[def.weapon ?? cls.weapon] },
      level,
      exp: def.exp ?? 0,
      armyId: def.armyId ?? null,
      growths,
      x: def.x, y: def.y,
      px: def.x * TILE, py: def.y * TILE,
      facing: team === 'player' ? 'right' : 'left',
      anim: 'idle', animStart: 0,
      acted: false, alive: true, alpha: 1,
      flashUntil: 0, hitShakeUntil: 0,
      ai: def.ai ?? 'aggressive', boss: !!def.boss, awake: false,
    };
  }

  class Battle {
    // encounter : rencontre (encounters.js) ; army : rebelles encore debout ;
    // inventory : sac de l'armée (modifié quand un objet est utilisé) ;
    // onEnd(victoire) est appelé quand un camp est entièrement vaincu (true / false),
    // ou avec 'retreat' quand le joueur bat en retraite.
    constructor({ encounter, army, inventory = {}, seed, levelBonus = 0, ui, onEnd }) {
      this.encounter = encounter;
      this.inventory = inventory;
      this.menuLevel = null;     // 'items' quand le sous-menu Objet est ouvert
      this.mapDef = MAPS[encounter.map];
      this.grid = this.mapDef.tiles.map((row) => row.split(''));
      this.h = this.grid.length;
      this.w = this.grid[0].length;
      this.rng = new RNG(seed);
      this.seed = seed;
      this.ui = ui;
      this.onEnd = onEnd;

      const spawns = this.mapDef.spawns;
      const enemyOpts = { mods: encounter.enemyMods, levelBonus };
      this.units = [
        ...army.slice(0, spawns.length).map((rec, i) => makeUnit({ ...rec, ...spawns[i] }, 'player')),
        ...encounter.enemies.map((d) => makeUnit(d, 'enemy', enemyOpts)),
      ];

      this.turn = 1;
      this.phase = 'player';
      this.state = 'busy';       // idle | selected | menu | target | busy | over
      this.cursor = { x: this.units[0].x, y: this.units[0].y };
      this.selected = null;
      this.moveRes = null;
      this.threat = null;
      this.origin = null;
      this.danger = null;        // { unit, moves, threat } quand on inspecte un ennemi
      this.targets = [];
      this.targetIndex = 0;
      this.forecastShown = false;

      this.time = 0;
      this.tweens = [];
      this.floats = [];
      this.effects = [];
      this.shakeUntil = 0;
    }

    // ------------------------------------------------------------ utilitaires
    inBounds(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
    terrainAt(x, y) { return TERRAIN[this.grid[y][x]]; }
    unitAt(x, y) { return this.units.find((u) => u.alive && u.x === x && u.y === y) ?? null; }
    living(team) { return this.units.filter((u) => u.alive && u.team === team); }

    wait(ms) {
      return new Promise((resolve) => this.tweens.push({ start: this.time, dur: ms, resolve }));
    }
    tween(dur, fn) {
      return new Promise((resolve) => this.tweens.push({ start: this.time, dur, fn, resolve }));
    }

    update(now) {
      this.time = now;
      const done = [];
      for (const t of this.tweens) {
        const p = Math.min(1, (now - t.start) / t.dur);
        t.fn?.(p);
        if (p >= 1) done.push(t);
      }
      for (const t of done) {
        this.tweens.splice(this.tweens.indexOf(t), 1);
        t.resolve();
      }
      this.floats = this.floats.filter((f) => now - f.start < f.dur);
      this.effects = this.effects.filter((e) => now - e.start < e.dur);
    }

    // ------------------------------------------------------------ déroulement
    render(renderer) { renderer.draw(this); }

    async start() {
      this.ui.setTurn(this.turn, 'player');
      await this.ui.banner(this.encounter.name, 'enemy');
      await this.ui.banner(`Tour ${this.turn} — Phase alliée`, 'player');
      this.state = 'idle';
      this.refreshHover();
    }

    // Retraite (bouton, après confirmation) : seulement pendant la phase alliée, au repos.
    retreat() {
      if (this.phase !== 'player' || this.state === 'busy' || this.state === 'over') return;
      this.cancelAll();
      this.state = 'over';
      this.ui.hideAll();
      this.ui.setEndTurnEnabled(false);
      this.onEnd?.('retreat');
    }

    checkEnd() {
      if (this.state === 'over') return true;
      const win = !this.living('enemy').length;
      if (!win && this.living('player').length) return false;
      this.state = 'over';
      this.ui.hideAll();
      this.ui.setEndTurnEnabled(false);
      this.wait(500).then(() => this.onEnd?.(win));
      return true;
    }

    async endPlayerPhase() {
      if (this.phase !== 'player' || this.state === 'busy' || this.state === 'over') return;
      if (this.state !== 'idle') this.cancelAll();
      this.state = 'busy';
      this.danger = null;
      this.ui.hideAll();
      await this.runEnemyPhase();
    }

    async runEnemyPhase() {
      this.phase = 'enemy';
      this.ui.setTurn(this.turn, 'enemy');
      this.ui.setEndTurnEnabled(false);
      await this.ui.banner(`Tour ${this.turn} — Phase ennemie`, 'enemy');
      // Comme sur GBA, chaque camp se soigne sur les forts au début de sa propre phase.
      await this.healOnForts('enemy');

      for (const u of this.living('enemy')) {
        if (!u.alive) continue;
        const plan = planEnemy(this, u);
        if (!plan) continue;
        this.cursor = { x: u.x, y: u.y };
        await this.wait(150);
        await this.moveAlong(u, plan.path);
        if (plan.target && plan.target.alive) {
          await this.wait(120);
          await this.attack(u, plan.target);
        }
        u.facing = 'left';
        if (this.checkEnd()) return;
        await this.wait(120);
      }

      // Nouveau tour
      this.turn++;
      this.phase = 'player';
      for (const u of this.units) u.acted = false;
      this.ui.setTurn(this.turn, 'player');
      await this.ui.banner(`Tour ${this.turn} — Phase alliée`, 'player');
      await this.healOnForts('player');
      this.ui.setEndTurnEnabled(true);
      this.state = 'idle';
      this.refreshHover();
    }

    async healOnForts(team) {
      let any = false;
      for (const u of this.living(team)) {
        const t = this.terrainAt(u.x, u.y);
        if (t.heal && u.hp < u.maxHp) {
          const amount = Math.min(u.maxHp - u.hp, Math.max(1, Math.round(u.maxHp * t.heal)));
          u.hp += amount;
          this.addFloat(u, `+${amount}`, '#7dff8a');
          any = true;
        }
      }
      if (any) await this.wait(600);
    }

    finishUnit(u) {
      u.acted = true;
      u.facing = u.team === 'player' ? 'right' : 'left';
      this.selected = null;
      this.moveRes = null;
      this.threat = null;
      this.targets = [];
      this.ui.hideMenu();
      this.ui.hideForecast();
      if (this.checkEnd()) return;
      this.state = 'idle';
      this.refreshHover();
      if (this.living('player').every((p) => p.acted)) this.endPlayerPhase();
    }

    // ------------------------------------------------------------ animations
    async moveAlong(unit, path) {
      if (!path || path.length < 2) return;
      unit.anim = 'walk';
      const stepMs = unit.moveType === 'mounted' ? 70 : 95;
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1], b = path[i];
        unit.facing = b.x > a.x ? 'right' : b.x < a.x ? 'left' : b.y > a.y ? 'down' : 'up';
        await this.tween(stepMs, (p) => {
          unit.px = (a.x + (b.x - a.x) * p) * TILE;
          unit.py = (a.y + (b.y - a.y) * p) * TILE;
        });
      }
      const end = path[path.length - 1];
      unit.x = end.x; unit.y = end.y;
      unit.px = end.x * TILE; unit.py = end.y * TILE;
      unit.anim = 'idle';
    }

    snapTo(unit, x, y) {
      unit.x = x; unit.y = y;
      unit.px = x * TILE; unit.py = y * TILE;
      unit.anim = 'idle';
      unit.facing = unit.team === 'player' ? 'right' : 'left';
    }

    face(a, b) {
      const dx = b.x - a.x, dy = b.y - a.y;
      if (Math.abs(dx) >= Math.abs(dy)) a.facing = dx >= 0 ? 'right' : 'left';
      else a.facing = dy > 0 ? 'down' : 'up';
    }

    addFloat(unit, text, color, big = false) {
      this.floats.push({ x: unit.px + 8, y: unit.py - 2, text, color, big, start: this.time, dur: 900 });
    }

    async attack(att, def) {
      const fc = forecast(this, att, def, att);
      this.face(att, def);
      this.face(def, att);
      const landed = { [att.id]: false, [def.id]: false };
      for (const s of strikeOrder(fc)) {
        const [u, t, st] = s.side === 'a' ? [att, def, fc.a] : [def, att, fc.d];
        if (!u.alive || !t.alive || u.hp <= 0 || t.hp <= 0) break;
        if (await this.strike(u, t, st)) landed[u.id] = true;
        if (t.hp <= 0) break;
        await this.wait(120);
      }
      att.anim = 'idle';
      def.anim = 'idle';
      def.facing = def.team === 'player' ? 'right' : 'left';

      // Expérience pour l'unité alliée survivante
      const ally = att.team === 'player' ? att : def;
      const foe = ally === att ? def : att;
      if (ally.hp > 0) {
        const gain = expGain(ally, foe, { landed: landed[ally.id], killed: foe.hp <= 0 });
        if (gain > 0) await this.gainExp(ally, gain);
      }
    }

    async gainExp(unit, amount) {
      const from = unit.exp;
      unit.exp += amount;
      const leveled = unit.exp >= 100;
      await this.ui.showExp(unit, from, Math.min(100, unit.exp), amount);
      if (leveled) {
        unit.exp -= 100;
        const result = rollLevelUp(unit, this.rng);
        if (unit.level >= MAX_LEVEL) unit.exp = 0;
        // Récompense immédiate : la montée de niveau soigne l'unité
        const healed = Math.min(unit.maxHp - unit.hp, Math.round(unit.maxHp * RUN_RULES.levelUpHeal));
        unit.hp += healed;
        await this.ui.showLevelUp(unit, { ...result, healed });
        if (healed > 0) this.addFloat(unit, `+${healed}`, '#7dff8a');
      }
    }

    async strike(u, t, st) {
      u.anim = 'attack';
      u.animStart = this.time;
      await this.wait(200);
      const hit = this.rng.rollHit(st.hit);
      if (hit) {
        const crit = this.rng.rollCrit(st.crit);
        const dmg = crit ? st.dmg * 3 : st.dmg;
        t.hp = Math.max(0, t.hp - dmg);
        t.flashUntil = this.time + 140;
        t.hitShakeUntil = this.time + 200;
        if (crit) {
          this.effects.push({ type: 'crit', x: t.px, y: t.py, start: this.time, dur: 320 });
          this.shakeUntil = this.time + 300;
          this.addFloat(t, `Critique ! -${dmg}`, '#ffe066', true);
        } else {
          this.addFloat(t, dmg > 0 ? `-${dmg}` : '0', dmg > 0 ? '#ffffff' : '#bbbbbb');
        }
      } else {
        this.addFloat(t, 'Raté', '#9fb4ff');
      }
      await this.wait(220);
      u.anim = 'idle';
      if (t.hp <= 0) await this.kill(t);
      return hit;
    }

    async kill(u) {
      u.anim = 'death';
      u.animStart = this.time;
      await this.wait(u.deathFrames * 110 + 150);
      await this.tween(350, (p) => { u.alpha = 1 - p; });
      u.alive = false;
    }

    // ------------------------------------------------------------ entrées joueur
    hover(x, y) {
      if (!this.inBounds(x, y)) return;
      this.cursor = { x, y };
      if (this.state === 'target') {
        const i = this.targets.findIndex((t) => t.x === x && t.y === y);
        if (i >= 0) { this.targetIndex = i; this.showTargetForecast(); }
        return;
      }
      this.refreshHover();
    }

    refreshHover() {
      if (this.state === 'busy' || this.state === 'over' || this.state === 'menu') return;
      const { x, y } = this.cursor;
      const side = x < this.w / 2 ? 'right' : 'left';
      const u = this.unitAt(x, y);
      if (u) this.ui.showUnit(u, side); else this.ui.hideUnit();
      this.ui.showTerrain(this.terrainAt(x, y), side);
    }

    moveCursor(dx, dy) {
      if (this.state === 'target' && this.targets.length) {
        this.targetIndex = (this.targetIndex + (dx + dy > 0 ? 1 : -1) + this.targets.length) % this.targets.length;
        const t = this.targets[this.targetIndex];
        this.cursor = { x: t.x, y: t.y };
        this.showTargetForecast();
        return;
      }
      if (this.state === 'menu') { this.ui.menuMove(dy || dx); return; }
      const x = Math.max(0, Math.min(this.w - 1, this.cursor.x + dx));
      const y = Math.max(0, Math.min(this.h - 1, this.cursor.y + dy));
      this.hover(x, y);
    }

    confirm() {
      if (this.state === 'menu') { this.ui.menuConfirm(); return; }
      if (this.state === 'target') { this.click(this.cursor.x, this.cursor.y); return; }
      this.click(this.cursor.x, this.cursor.y);
    }

    async click(x, y) {
      if (!this.inBounds(x, y) || this.phase !== 'player') return;
      this.cursor = { x, y };
      const u = this.unitAt(x, y);

      switch (this.state) {
        case 'idle': {
          this.refreshHover();
          if (u && u.team === 'player' && !u.acted) { this.select(u); return; }
          if (u && u.team === 'enemy') { this.toggleDanger(u); return; }
          this.danger = null;
          return;
        }
        case 'selected': {
          const k = key(x, y);
          if (this.moveRes.stops.has(k)) {
            this.state = 'busy';
            this.origin = { x: this.selected.x, y: this.selected.y };
            await this.moveAlong(this.selected, pathTo(this.moveRes, x, y));
            this.openMenu();
            return;
          }
          if (u && u.team === 'player' && !u.acted && u !== this.selected) { this.select(u); return; }
          this.cancel();
          return;
        }
        case 'target': {
          const i = this.targets.findIndex((e) => e.x === x && e.y === y);
          if (i < 0) return;
          // Sur écran tactile, un premier appui affiche les prévisions, le second confirme.
          if (i !== this.targetIndex || !this.forecastShown) {
            this.targetIndex = i;
            this.showTargetForecast();
            return;
          }
          const t = this.targets[i];
          const att = this.selected;
          this.state = 'busy';
          this.ui.hideForecast();
          this.ui.hideUnit();
          await this.attack(att, t);
          if (att.alive) this.finishUnit(att);
          else {
            // l'attaquant est tombé pendant l'échange
            this.selected = null;
            if (this.checkEnd()) return;
            this.state = 'idle';
            this.refreshHover();
            if (this.living('player').every((p) => p.acted)) this.endPlayerPhase();
          }
          return;
        }
        default: return;
      }
    }

    select(u) {
      this.danger = null;
      this.selected = u;
      this.moveRes = reachable(this, u);
      this.threat = threatTiles(this, u, this.moveRes);
      this.state = 'selected';
    }

    toggleDanger(u) {
      if (this.danger?.unit === u) { this.danger = null; return; }
      const moves = reachable(this, u);
      if (u.ai === 'stationary') moves.stops = new Set([key(u.x, u.y)]);
      this.danger = { unit: u, moves, threat: threatTiles(this, u, moves) };
    }

    enemiesInRange(u) {
      return this.living('enemy').filter((e) => canReach(u, manhattan(u, e)));
    }

    // Objets du sac utilisables par l'unité (un soin ne sert à rien à PV pleins).
    usableItems(u) {
      return Object.entries(this.inventory)
        .filter(([id, n]) => n > 0 && ITEMS[id]?.heal && u.hp < u.maxHp);
    }

    openMenu() {
      const u = this.selected;
      const items = [];
      if (this.enemiesInRange(u).length) items.push({ id: 'attack', label: 'Attaquer' });
      if (this.usableItems(u).length) items.push({ id: 'item', label: 'Objet' });
      items.push({ id: 'wait', label: 'Attendre' });
      this.state = 'menu';
      this.menuLevel = null;
      this.ui.hideUnit();
      this.ui.showMenu(items, u, (id) => this.chooseAction(id));
    }

    openItemMenu() {
      const u = this.selected;
      const items = this.usableItems(u).map(([id, n]) => ({ id, label: `${ITEMS[id].name} ×${n}` }));
      this.menuLevel = 'items';
      this.ui.showMenu(items, u, (id) => this.useItem(u, id));
    }

    async useItem(u, id) {
      if (this.state !== 'menu' || !this.inventory[id]) return;
      this.ui.hideMenu();
      this.state = 'busy';
      const item = ITEMS[id];
      this.inventory[id] -= 1;
      if (this.inventory[id] <= 0) delete this.inventory[id];
      if (item.heal) {
        const amount = Math.min(u.maxHp - u.hp, item.heal);
        u.hp += amount;
        u.flashUntil = this.time + 140;
        this.addFloat(u, `+${amount}`, '#7dff8a');
      }
      await this.wait(600);
      this.finishUnit(u);
    }

    chooseAction(id) {
      if (this.state !== 'menu') return;
      const u = this.selected;
      this.ui.hideMenu();
      if (id === 'wait') { this.finishUnit(u); return; }
      if (id === 'item') { this.openItemMenu(); return; }
      if (id === 'attack') {
        this.targets = this.enemiesInRange(u);
        this.targetIndex = 0;
        this.forecastShown = false;
        this.state = 'target';
        const t = this.targets[0];
        this.cursor = { x: t.x, y: t.y };
        this.showTargetForecast();
      }
    }

    showTargetForecast() {
      const att = this.selected;
      const def = this.targets[this.targetIndex];
      if (!att || !def) return;
      const fc = forecast(this, att, def, att);
      this.ui.showForecast(att, def, fc, att.x < this.w / 2 ? 'right' : 'left');
      this.forecastShown = true;
    }

    cancel() {
      switch (this.state) {
        case 'selected':
          this.selected = null; this.moveRes = null; this.threat = null;
          this.state = 'idle';
          this.refreshHover();
          break;
        case 'menu': {
          const u = this.selected;
          this.ui.hideMenu();
          if (this.menuLevel === 'items') { this.openMenu(); break; } // retour au menu d'action
          this.snapTo(u, this.origin.x, this.origin.y);
          this.cursor = { x: u.x, y: u.y };
          this.select(u);
          this.refreshHover();
          break;
        }
        case 'target':
          this.ui.hideForecast();
          this.targets = [];
          this.cursor = { x: this.selected.x, y: this.selected.y };
          this.openMenu();
          break;
        case 'idle':
          this.danger = null;
          break;
        default:
          break;
      }
    }

    cancelAll() {
      while (this.state === 'target' || this.state === 'menu' || this.state === 'selected') this.cancel();
    }
  }

  Object.assign(Resistance, { TILE, Battle });
})();

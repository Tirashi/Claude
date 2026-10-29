(() => {
  'use strict';
  const { RNG, CLASSES, WEAPONS, TERRAIN, MAPS, traitsOf, traitBonus, traitLabel, ITEMS, RUN_RULES, reachable, pathTo, threatTiles, tilesInRange, key, unkey, manhattan, forecast, strikeOrder, canReach, planEnemy, expGain, rollLevelUp, autoLevel, MAX_LEVEL } = Resistance;

  const TILE = 16;

  // Dernières paroles d'un rebelle qui tombe. Choisies d'après son nom et le tour (pas avec
  // la graine du combat, pour qu'une partie rejouée reste la même).
  const LAST_WORDS = [
    'Continuez sans moi…',
    'Libérez le pays… pour moi.',
    'Je ne verrai pas la fin de la guerre…',
    'Dites à ma famille… que j\'ai tenu.',
    'Pardon… je n\'ai pas su tenir.',
    'Ne vous arrêtez pas…',
    'La rébellion… vivra…',
    'J\'aurais voulu revoir les montagnes…',
  ];
  const CAPTAIN_WORDS = ['Le Mémorial… gardera mon nom.', 'Un Capitaine tombe… cent autres se lèvent.'];
  function lastWords(u, turn) {
    const pool = u.grade ? CAPTAIN_WORDS : LAST_WORDS;
    let h = turn;
    for (const ch of u.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return pool[h % pool.length];
  }

  // Zone de danger (bouton « Danger ») : gardée d'un combat à l'autre
  let dangerZoneOn = false;

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
      kills: 0,                  // ennemis vaincus pendant ce combat (bilan de la campagne)
    };
  }

  class Battle {
    // encounter : rencontre (encounters.js) ; army : rebelles encore debout ;
    // inventory : sac de l'armée (modifié quand un objet est utilisé) ;
    // onEnd(victoire) est appelé quand un camp est entièrement vaincu (true / false),
    // ou avec 'retreat' quand le joueur bat en retraite.
    // guide : premier combat guidé (guide.js), ou null
    // healBonus : PV en plus à chaque soin (Chapelle de la forteresse)
    // options : réglages du joueur (Menu > Options) : fast (tout ×2), autoEnd (fin du tour quand
    // tous ont joué), doubleTap (toucher une seconde fois la cible pour attaquer)
    constructor({ encounter, army, inventory = {}, seed, levelBonus = 0, healBonus = 0, options = {}, ui, guide = null, onEnd }) {
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
      this.guide = guide;
      this.healBonus = healBonus;
      this.options = options;
      this.targetMode = 'attack'; // 'heal' quand on choisit l'allié à soigner
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
      this.marked = new Set();   // ennemis touchés : leur portée reste affichée (en rouge)
      this.preview = null;       // { x, y, path, walking } : flèche du chemin et silhouette à l'arrivée
      this.plan = null;          // { target, mode: 'attack' | 'heal', x, y } : action proposée en touchant une cible
      this.peek = null;          // ennemi hors de portée dont on montre la portée (en orange)
      this.threatCache = new Map();
      this.targets = [];
      this.targetIndex = 0;
      this.forecastShown = false;

      // Horloge du combat : elle avance deux fois plus vite quand on touche l'écran pendant
      // la phase ennemie (this.fast), et toutes les animations la suivent.
      this.time = 0;
      this.lastNow = null;
      this.fast = !!options.fast;
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
      const dt = this.lastNow === null ? 0 : Math.max(0, now - this.lastNow);
      this.lastNow = now;
      this.time += dt * (this.fast ? 2 : 1);
      now = this.time;
      this.ui.setCancelEnabled(['selected', 'menu', 'target'].includes(this.state) || (this.state === 'idle' && this.marked.size > 0));
      // Panneau du tour (au repos) : tour, objectif, soldats à jouer, bouton Suivant
      const toPlay = this.phase === 'player' ? this.living('player').filter((p) => !p.acted).length : 0;
      const status = this.state === 'idle' && this.phase === 'player' ? `${this.turn}|${toPlay}|${this.living('enemy').length}` : '';
      if (status !== this.statusKey) {
        this.statusKey = status;
        if (status) this.ui.showStatus({ turn: this.turn, toPlay, enemies: this.living('enemy').length }, () => this.selectNext());
        else this.ui.hideStatus();
      }
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
      this.cursorToNext();
      this.refreshHover();
      this.guide?.on('start');
    }

    // Zone de danger : toutes les cases qu'un ennemi peut frapper à son prochain tour,
    // recalculée quand une unité bouge ou tombe.
    get dangerOn() { return dangerZoneOn; }
    toggleDangerZone() {
      dangerZoneOn = !dangerZoneOn;
      this.ui.setDangerOn(dangerZoneOn);
      if (dangerZoneOn) this.guide?.on('danger');
    }
    // Cases qu'un ennemi peut frapper à son prochain tour : toutes les cases à portée d'une case
    // où il peut s'arrêter (y compris celles où il peut marcher). Recalculé quand une unité bouge.
    threatOf(e) {
      const sig = this.units.filter((u) => u.alive).map((u) => `${u.id}:${u.x},${u.y}`).join(' ');
      const c = this.threatCache.get(e.id);
      if (c?.sig === sig) return c.tiles;
      const moves = reachable(this, e);
      if (e.ai === 'stationary') moves.stops = new Set([key(e.x, e.y)]);
      const tiles = new Set();
      for (const k of moves.stops) {
        const [x, y] = unkey(k);
        for (const t of tilesInRange(this, x, y, e.weapon.min, e.weapon.max)) tiles.add(key(t.x, t.y));
      }
      this.threatCache.set(e.id, { sig, tiles });
      return tiles;
    }
    threatUnion(list) {
      const tiles = new Set();
      for (const e of list) for (const k of this.threatOf(e)) tiles.add(k);
      return tiles;
    }
    dangerTiles() { return this.threatUnion(this.living('enemy')); }
    markedTiles() {
      for (const e of this.marked) if (!e.alive) this.marked.delete(e);
      return this.threatUnion([...this.marked]);
    }
    // Ennemis qui pourront frapper la case (x, y) à leur prochain tour
    threatsAt(x, y) { return this.living('enemy').filter((e) => this.threatOf(e).has(key(x, y))); }

    // Soldats qui n'ont pas encore joué ce tour (garde-fou de « Fin du tour »)
    idleUnits() {
      return this.phase === 'player' ? this.living('player').filter((u) => !u.acted) : [];
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
      this.ui.setSpeed(null);
      this.ui.hideAll();
      this.ui.setEndTurnEnabled(false);
      this.wait(500).then(() => this.onEnd?.(win));
      return true;
    }

    async endPlayerPhase() {
      if (this.phase !== 'player' || this.state === 'busy' || this.state === 'over') return;
      if (this.state !== 'idle') this.cancelAll();
      this.state = 'busy';
      this.ui.hideAll();
      await this.runEnemyPhase();
    }

    async runEnemyPhase() {
      this.phase = 'enemy';
      this.ui.setTurn(this.turn, 'enemy');
      this.ui.setEndTurnEnabled(false);
      this.guide?.on('enemy');
      this.ui.setSpeed(this.fast ? 'fast' : 'hint');
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
      this.fast = !!this.options.fast;
      this.ui.setSpeed(null);
      this.turn++;
      this.phase = 'player';
      for (const u of this.units) u.acted = false;
      this.ui.setTurn(this.turn, 'player');
      await this.ui.banner(`Tour ${this.turn} — Phase alliée`, 'player');
      await this.healOnForts('player');
      this.ui.setEndTurnEnabled(true);
      this.state = 'idle';
      this.cursorToNext();
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
      this.clearPlan();
      if (this.checkEnd()) return;
      this.state = 'idle';
      this.cursorToNext(); // comme sur GBA, le curseur file au prochain soldat
      this.refreshHover();
      if (this.options.autoEnd !== false && this.living('player').every((p) => p.acted)) this.endPlayerPhase();
      else this.guide?.on('acted');
    }

    cursorToNext() {
      const next = this.living('player').find((p) => !p.acted);
      if (next) this.cursor = { x: next.x, y: next.y };
    }

    // Bouton « Suivant » : choisit le prochain soldat qui n'a pas joué (L sur GBA)
    selectNext() {
      if (this.phase !== 'player' || !['idle', 'selected'].includes(this.state)) return;
      const idle = this.living('player').filter((p) => !p.acted);
      if (!idle.length) return;
      const u = idle[(idle.indexOf(this.lastNext) + 1) % idle.length];
      this.lastNext = u;
      this.cursor = { x: u.x, y: u.y };
      this.select(u);
      this.refreshHover();
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
      if (t.hp <= 0) {
        if (u.team === 'player') u.kills += 1;
        await this.kill(t);
      }
      return hit;
    }

    async kill(u) {
      u.anim = 'death';
      u.animStart = this.time;
      await this.wait(u.deathFrames * 110 + 150);
      await this.tween(350, (p) => { u.alpha = 1 - p; });
      u.alive = false;
      if (u.team === 'player') {
        this.ui.showQuote(u.name, lastWords(u, this.turn));
        await this.wait(2000);
        this.ui.hideQuote();
      }
    }

    // ------------------------------------------------------------ entrées joueur
    // Façon Fire Emblem Heroes (maquette du 29/10, direction B) : un soldat choisi, un premier
    // toucher sur une case bleue montre la flèche du chemin et sa silhouette à l'arrivée
    // (preview), le second l'y envoie ; on peut aussi glisser le doigt depuis le soldat. Toucher
    // un ennemi propose un chemin jusqu'à lui avec les prévisions (plan) ; hors de portée, sa
    // portée s'affiche en orange (peek). Sans soldat choisi, toucher un ennemi garde sa portée.
    hover(x, y) {
      if (!this.inBounds(x, y)) return;
      this.cursor = { x, y };
      if (this.state === 'target') {
        const i = this.targets.findIndex((t) => t.x === x && t.y === y);
        if (i >= 0) { this.targetIndex = i; this.showTargetForecast(); }
        return;
      }
      // À la souris et au clavier, la flèche suit le curseur (comme sur GBA)
      if (this.state === 'selected' && !this.plan && this.moveRes.stops.has(key(x, y))) { this.setPreview(x, y, true); return; }
      this.refreshHover();
    }

    refreshHover() {
      if (this.state === 'busy' || this.state === 'over' || this.state === 'menu') return;
      if (this.plan) return; // les prévisions restent affichées
      const { x, y } = this.cursor;
      const side = x < this.w / 2 ? 'right' : 'left';
      const u = this.unitAt(x, y) ?? (this.state === 'selected' ? this.selected : null);
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
      if (this.state === 'target') { this.confirmTarget(); return; } // au clavier, Entrée confirme
      if (this.state === 'selected' && this.plan && this.cursor.x === this.plan.target.x && this.cursor.y === this.plan.target.y) { this.runPlan(); return; }
      this.click(this.cursor.x, this.cursor.y);
    }

    async click(x, y) {
      // Pendant la phase ennemie, toucher l'écran l'accélère
      if (this.phase === 'enemy' && this.state !== 'over') {
        if (!this.fast) { this.fast = true; this.ui.setSpeed('fast'); }
        return;
      }
      if (!this.inBounds(x, y) || this.phase !== 'player') return;
      this.ui.hideSheet();
      this.cursor = { x, y };
      const u = this.unitAt(x, y);

      switch (this.state) {
        case 'idle': {
          this.refreshHover();
          if (u && u.team === 'player' && !u.acted) { this.select(u); return; }
          if (u && u.team === 'enemy') this.toggleMark(u);
          return;
        }
        case 'selected': this.clickSelected(x, y, u); return;
        case 'target': {
          const i = this.targets.findIndex((e) => e.x === x && e.y === y);
          if (i < 0) return;
          // Un premier appui affiche les prévisions ; le bouton confirme (ou un second appui, en option)
          if (i !== this.targetIndex || !this.forecastShown || !this.options.doubleTap) {
            this.targetIndex = i;
            this.showTargetForecast();
            return;
          }
          await this.confirmTarget();
          return;
        }
        default: return;
      }
    }

    clickSelected(x, y, u) {
      const sel = this.selected;
      if (u === sel) { this.go(x, y); return; }
      if (u && u === this.plan?.target) { if (this.options.doubleTap) this.runPlan(); return; }
      // Le soigneur : toucher un allié blessé propose d'aller le soigner
      if (u && u.team === sel.team && sel.weapon.staff && u.hp < u.maxHp && this.planAction(u, 'heal')) return;
      if (u && u.team === 'player' && !u.acted) { this.select(u); return; }
      if (u && u.team === 'enemy') {
        if (!this.planAction(u, 'attack')) this.showPeek(u);
        return;
      }
      if (this.moveRes.stops.has(key(x, y))) {
        if (this.preview && this.preview.x === x && this.preview.y === y && !this.plan) { this.go(x, y); return; }
        this.setPreview(x, y);
        return;
      }
      this.cancel();
    }

    select(u) {
      this.clearPlan();
      this.ui.hideForecast();
      this.selected = u;
      this.moveRes = reachable(this, u);
      this.threat = u.weapon.staff ? new Set() : threatTiles(this, u, this.moveRes);
      this.state = 'selected';
      this.guide?.on('select');
    }

    // Toucher un ennemi au repos : sa portée reste affichée jusqu'à ce qu'il tombe ou qu'on le retouche
    toggleMark(e) {
      if (this.marked.has(e)) this.marked.delete(e); else this.marked.add(e);
    }

    clearPlan() {
      this.preview = null;
      this.plan = null;
      this.peek = null;
      this.ui.setHint(null);
    }

    // Texte « ! » quand la case d'arrivée sera menacée au prochain tour ennemi
    threatHint(x, y) {
      const foes = this.threatsAt(x, y);
      if (!foes.length) return null;
      const names = [...new Set(foes.map((e) => e.name))].join(', ');
      return `! Ici, ${names} pourra${foes.length > 1 ? 'ont' : ''} le frapper au prochain tour.`;
    }

    // Flèche jusqu'à (x, y) et silhouette du soldat à l'arrivée ; quiet : la souris ou le doigt
    // qui glisse (pas de consigne)
    setPreview(x, y, quiet = false) {
      if (this.preview && this.preview.x === x && this.preview.y === y && !this.plan) return;
      this.plan = null;
      this.peek = null;
      this.ui.hideForecast();
      this.preview = { x, y, path: pathTo(this.moveRes, x, y) };
      this.cursor = { x, y };
      this.ui.setHint(this.threatHint(x, y) ?? (quiet ? null : 'Touche encore la case pour y aller.'));
      this.ui.showUnit(this.selected, this.selected.x < this.w / 2 ? 'right' : 'left');
    }

    // Toucher une cible avec un soldat choisi : chemin jusqu'à la case d'où frapper (ou soigner),
    // puis prévisions avec Attaquer (ou Soigner) et Attendre là. Faux si la cible est hors d'atteinte.
    planAction(t, mode) {
      const sel = this.selected, w = sel.weapon;
      const ok = (x, y) => {
        const d = manhattan({ x, y }, t);
        return mode === 'heal' ? d >= w.min && d <= w.max : canReach(sel, d);
      };
      const cells = [...this.moveRes.stops].map(unkey).filter(([x, y]) => ok(x, y));
      if (!cells.length) return false;
      const same = (c, p) => p && c[0] === p.x && c[1] === p.y;
      // La case déjà visée, sinon sa place actuelle, sinon le meilleur terrain, puis la plus proche
      const best = cells.find((c) => same(c, this.preview)) ?? cells.find((c) => same(c, sel))
        ?? cells.sort((a, b) => {
          const ta = this.terrainAt(...a), tb = this.terrainAt(...b);
          return (tb.avo + tb.def * 5) - (ta.avo + ta.def * 5) || this.moveRes.dist.get(key(...a)) - this.moveRes.dist.get(key(...b));
        })[0];
      const [x, y] = best;
      this.peek = null;
      this.preview = { x, y, path: pathTo(this.moveRes, x, y) };
      this.plan = { target: t, mode, x, y };
      this.cursor = { x: t.x, y: t.y };
      this.ui.hideUnit();
      this.ui.setHint(this.threatHint(x, y));
      const side = sel.x < this.w / 2 ? 'right' : 'left';
      if (mode === 'heal') {
        this.ui.showHealForecast(sel, t, this.healAmount(sel, t), side, () => this.runPlan(), () => this.runPlan(true));
      } else {
        this.ui.showForecast(sel, t, forecast(this, sel, t, { x, y }), side, () => this.runPlan(), () => this.runPlan(true));
        this.guide?.on('forecast');
      }
      return true;
    }

    // Ennemi hors de portée : on montre sa portée, le soldat reste choisi
    showPeek(e) {
      this.preview = null;
      this.plan = null;
      this.peek = e;
      this.ui.hideForecast();
      this.ui.showUnit(e, this.selected.x < this.w / 2 ? 'right' : 'left');
      this.ui.setHint(this.selected.weapon.staff ? 'Le soigneur n\'attaque pas. La portée de l\'ennemi est en orange.'
        : 'Hors de portée. Sa portée est en orange ; le soldat choisi ne change pas.');
    }

    // Exécute le plan : le soldat suit la flèche, puis attaque ou soigne (ou attend seulement)
    async runPlan(waitOnly = false) {
      if (this.state !== 'selected' || !this.plan) return;
      const { target, mode } = this.plan;
      const u = this.selected;
      const path = this.preview.path;
      this.state = 'busy';
      this.ui.hideForecast();
      this.ui.hideUnit();
      this.origin = { x: u.x, y: u.y };
      this.clearPlan();
      this.preview = { x: path.at(-1).x, y: path.at(-1).y, path, walking: true };
      await this.moveAlong(u, path);
      this.preview = null;
      if (waitOnly) { this.finishUnit(u); return; }
      await this.act(u, target, mode);
    }

    // Aller sur une case puis ouvrir le menu d'action ; la flèche reste pendant la marche
    async go(x, y) {
      const u = this.selected;
      this.state = 'busy';
      this.ui.hideForecast();
      this.ui.setHint(null);
      this.origin = { x: u.x, y: u.y };
      const path = pathTo(this.moveRes, x, y);
      this.plan = null;
      this.peek = null;
      this.preview = { x, y, path, walking: true };
      await this.moveAlong(u, path);
      this.preview = null;
      this.openMenu();
      this.guide?.on('menu');
    }

    async confirmTarget() {
      const t = this.targets[this.targetIndex];
      const att = this.selected;
      if (this.state !== 'target' || !t || !att) return;
      this.state = 'busy';
      this.ui.hideForecast();
      this.ui.hideUnit();
      await this.act(att, t, this.targetMode);
    }

    // Attaque ou soin, puis fin de l'action du soldat
    async act(att, t, mode) {
      if (mode === 'heal') { await this.heal(att, t); this.finishUnit(att); return; }
      await this.attack(att, t);
      if (att.alive) { this.finishUnit(att); return; }
      // l'attaquant est tombé pendant l'échange
      this.selected = null;
      if (this.checkEnd()) return;
      this.state = 'idle';
      this.cursorToNext();
      this.refreshHover();
      if (this.options.autoEnd !== false && this.living('player').every((p) => p.acted)) this.endPlayerPhase();
    }

    // Glisser le doigt depuis un soldat : la flèche suit, lâcher sur une case bleue l'y envoie,
    // lâcher sur un ennemi (ou un allié blessé pour le soigneur) propose l'action
    dragStart(x, y) {
      if (this.phase !== 'player' || !['idle', 'selected'].includes(this.state)) return false;
      const u = this.unitAt(x, y);
      if (!u || u.team !== 'player' || u.acted) return false;
      if (this.selected !== u) this.select(u);
      return true;
    }
    dragTo(x, y) {
      if (this.state !== 'selected' || !this.inBounds(x, y)) return;
      const u = this.unitAt(x, y), sel = this.selected;
      if (u && u !== sel && u === this.plan?.target) return;
      if (u && u.team === 'enemy' && this.planAction(u, 'attack')) return;
      if (u && u.team === sel.team && u !== sel && sel.weapon.staff && u.hp < u.maxHp && this.planAction(u, 'heal')) return;
      if (this.moveRes.stops.has(key(x, y))) this.setPreview(x, y, true);
    }
    dragEnd() {
      if (this.state !== 'selected' || this.plan || !this.preview) return;
      const { x, y } = this.preview;
      if (x !== this.selected.x || y !== this.selected.y) this.go(x, y);
    }

    // Appui long : la fiche complète d'un soldat (allié ou ennemi)
    longPress(x, y) {
      const u = this.unitAt(x, y);
      if (!u) return false;
      this.ui.showSheet(u);
      return true;
    }

    enemiesInRange(u) {
      return this.living('enemy').filter((e) => canReach(u, manhattan(u, e)));
    }

    // Soin d'un bâton : Mag + soin de l'arme + bonus de la Chapelle, sans dépasser les PV max
    healAmount(healer, target) {
      return Math.min(target.maxHp - target.hp, healer.mag + healer.weapon.heal + this.healBonus);
    }

    // Alliés blessés à portée du bâton
    alliesToHeal(u) {
      if (!u.weapon.staff) return [];
      return this.living(u.team).filter((a) => a !== u && a.hp < a.maxHp
        && manhattan(u, a) >= u.weapon.min && manhattan(u, a) <= u.weapon.max);
    }

    async heal(healer, target) {
      const amount = this.healAmount(healer, target);
      this.face(healer, target);
      healer.anim = 'attack';
      healer.animStart = this.time;
      await this.wait(300);
      target.hp += amount;
      target.flashUntil = this.time + 140;
      this.addFloat(target, `+${amount}`, '#7dff8a');
      await this.wait(500);
      healer.anim = 'idle';
      if (healer.level < MAX_LEVEL) await this.gainExp(healer, 12); // comme un soin de Fire Emblem (~11 EXP)
    }

    // Objets du sac utilisables par l'unité (un soin ne sert à rien à PV pleins).
    usableItems(u) {
      return Object.entries(this.inventory)
        .filter(([id, n]) => n > 0 && ITEMS[id]?.heal && u.hp < u.maxHp);
    }

    openMenu() {
      const u = this.selected;
      const items = [];
      // Détail à droite de chaque action : la cible et la précision, les objets du sac
      const wounded = this.alliesToHeal(u);
      if (wounded.length) {
        const detail = wounded.length > 1 ? `${wounded.length} alliés` : `${wounded[0].name} · +${this.healAmount(u, wounded[0])} PV`;
        items.push({ id: 'heal', label: 'Soigner', detail, icon: this.ui.weaponIconHtml(u.weapon) });
      }
      const foes = this.enemiesInRange(u);
      if (foes.length) {
        const detail = foes.length > 1 ? `${foes.length} cibles` : `${foes[0].name} · ${forecast(this, u, foes[0], u).a.hit} %`;
        items.push({ id: 'attack', label: 'Attaquer', detail, icon: this.ui.weaponIconHtml(u.weapon) });
      }
      const usable = this.usableItems(u);
      if (usable.length) {
        const [id, n] = usable[0];
        items.push({ id: 'item', label: 'Objet', detail: usable.length > 1 ? `${usable.length} objets` : `${ITEMS[id].name} ×${n}`, icon: this.ui.itemIconHtml(id) });
      }
      const foesHere = this.threatsAt(u.x, u.y).length;
      items.push({ id: 'wait', label: 'Attendre', detail: foesHere ? `! ${foesHere} ennemi${foesHere > 1 ? 's' : ''} à portée` : '' });
      this.state = 'menu';
      this.menuLevel = null;
      this.ui.hideUnit();
      this.ui.showMenu(items, u, (id) => this.chooseAction(id));
    }

    openItemMenu() {
      const u = this.selected;
      const items = this.usableItems(u).map(([id, n]) => ({ id, label: ITEMS[id].name, detail: `×${n}`, icon: this.ui.itemIconHtml(id) }));
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
      if (id === 'attack' || id === 'heal') {
        this.targetMode = id;
        this.targets = id === 'heal' ? this.alliesToHeal(u) : this.enemiesInRange(u);
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
      this.forecastShown = true;
      if (this.targetMode === 'heal') {
        this.ui.showHealForecast(att, def, this.healAmount(att, def), att.x < this.w / 2 ? 'right' : 'left', () => {
          if (this.state === 'target' && this.targets[this.targetIndex] === def) this.confirmTarget();
        });
        return;
      }
      const fc = forecast(this, att, def, att);
      this.guide?.on('forecast');
      this.ui.showForecast(att, def, fc, att.x < this.w / 2 ? 'right' : 'left', () => {
        if (this.state === 'target' && this.targets[this.targetIndex] === def) this.confirmTarget();
      });
    }

    cancel() {
      switch (this.state) {
        case 'selected':
          // D'abord la flèche, le plan ou la portée montrée ; ensuite seulement le soldat
          if (this.preview || this.plan || this.peek) {
            this.clearPlan();
            this.ui.hideForecast();
            this.cursor = { x: this.selected.x, y: this.selected.y };
            this.refreshHover();
            break;
          }
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
          this.marked.clear();
          break;
        default:
          break;
      }
    }

    cancelAll() {
      this.clearPlan();
      while (this.state === 'target' || this.state === 'menu' || this.state === 'selected') this.cancel();
    }
  }

  Object.assign(Resistance, { TILE, Battle });
})();

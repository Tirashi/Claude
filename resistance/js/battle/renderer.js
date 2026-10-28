(() => {
  'use strict';
  const { img, grayImg, PIXEL_FONT, TILE, key, triangle, drawPixelText, toCell, place, faceOf, cacheValid, storeCache } = Resistance;

  const DIR_ROW = { right: 0, left: 0, down: 5, up: 10 };
  const ANIM_ROW = { idle: 0, walk: 1, attack: 2, death: 3 };

  function hash(x, y) {
    let h = (x * 374761393 + y * 668265263) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }

  // Flèche de 5×3 pixels avec contour : vers le haut et verte (avantage) ou vers le bas et rouge.
  function drawArrow(ctx, cx, cy, up) {
    const rows = up ? [1, 3, 5] : [5, 3, 1];
    ctx.fillStyle = '#101018';
    ctx.fillRect(cx - 3, cy - 1, 7, 5);
    ctx.fillStyle = up ? '#60f070' : '#ff5050';
    rows.forEach((w, i) => ctx.fillRect(cx - (w >> 1), cy + i, w, 1));
  }

  // Petit losange doré au-dessus d'un général (px, py : coin de sa case).
  function drawBossMark(ctx, px, py, t) {
    const bx = px + 8, by = py - 5 + Math.round(Math.sin(t / 250));
    ctx.fillStyle = '#1a1206';
    ctx.fillRect(bx - 2, by - 1, 5, 3); ctx.fillRect(bx - 1, by - 2, 3, 5);
    ctx.fillStyle = '#ffd34d';
    ctx.fillRect(bx - 1, by, 3, 1); ctx.fillRect(bx, by - 1, 1, 3);
  }

  // Chevrons dorés d'un Capitaine (un par grade), empilés au-dessus de sa tête (px, py : coin de sa case).
  const CHEVRON = ['..1..', '.111.', '11.11'];
  function drawChevrons(ctx, px, py, grade) {
    const x = px + 1;
    for (let g = 0; g < grade; g++) {
      const y = py - 4 - g * 3;
      for (const [dx, dy, c] of [[-1, 0, '#1a1206'], [1, 0, '#1a1206'], [0, -1, '#1a1206'], [0, 1, '#1a1206'], [0, 0, '#ffd34d']]) {
        ctx.fillStyle = c;
        CHEVRON.forEach((row, ry) => [...row].forEach((bit, rx) => {
          if (bit === '1') ctx.fillRect(x + rx + dx, y + ry + dy, 1, 1);
        }));
      }
    }
  }

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.mapCache = null;
      this.scale = 1;
    }

    resize(w, h, scale) {
      this.scale = scale;
      this.canvas.width = Math.round(w * scale);
      this.canvas.height = Math.round(h * scale);
    }

    buildMap(battle) {
      const c = document.createElement('canvas');
      c.width = battle.w * TILE;
      c.height = battle.h * TILE;
      const g = c.getContext('2d');
      const ts = img('tileset');
      const put = ([tx, ty], x, y) => g.drawImage(ts, tx * TILE, ty * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
      for (let y = 0; y < battle.h; y++) {
        for (let x = 0; x < battle.w; x++) {
          const h = hash(x, y);
          const { base, overlay } = battle.terrainAt(x, y);
          put(base[h % base.length], x, y);
          if (overlay) put(overlay[h % overlay.length], x, y);
        }
      }
      storeCache(this, battle, c);
    }

    draw(battle) {
      const { ctx } = this;
      const t = battle.time;
      if (!cacheValid(this, battle)) this.buildMap(battle);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0d1020';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      let ox = 0, oy = 0;
      if (t < battle.shakeUntil) { ox = (Math.random() - 0.5) * 3; oy = (Math.random() - 0.5) * 3; }
      ctx.setTransform(this.scale, 0, 0, this.scale, Math.round(ox * this.scale), Math.round(oy * this.scale));
      ctx.imageSmoothingEnabled = false;

      ctx.drawImage(this.mapCache, 0, 0);
      this.drawRanges(battle, t);
      this.drawCursor(battle, t);

      const units = battle.units.filter((u) => u.alive).sort((a, b) => a.py - b.py);
      for (const u of units) this.drawUnit(u, battle, t);
      for (const u of units) if (u.anim !== 'death') this.drawHpBar(u);
      this.drawTriangleHints(battle, t);

      this.drawEffects(battle, t);
      this.drawFloats(battle, t);
    }

    drawRanges(battle, t) {
      const frame = Math.floor(t / 70) % 14;
      const blue = img('rangeBlue'), red = img('rangeRed');
      const paint = (image, keys) => {
        for (const k of keys) {
          const [x, y] = k.split(',').map(Number);
          const c = toCell(x, y);
          this.ctx.drawImage(image, frame * TILE, 0, TILE, TILE, c.x * TILE, c.y * TILE, TILE, TILE);
        }
      };
      if (battle.state === 'selected' && battle.moveRes) {
        paint(blue, battle.moveRes.dist.keys());
        paint(red, battle.threat);
      } else if (battle.state === 'target') {
        paint(red, battle.targets.map((e) => key(e.x, e.y)));
      } else if (battle.danger && battle.danger.unit.alive) {
        paint(blue, battle.danger.moves.stops);
        paint(red, battle.danger.threat);
      }
    }

    drawCursor(battle, t) {
      if (battle.state === 'over') return;
      const frame = Math.floor(t / 400) % 2;
      const { x, y } = battle.cursor;
      place(this.ctx, x * TILE + 8, y * TILE + 8,
        () => this.ctx.drawImage(img('cursor'), frame * 32, 0, 32, 32, x * TILE - 8, y * TILE - 8, 32, 32));
    }

    frameOf(u, t) {
      switch (u.anim) {
        case 'walk': return Math.floor(t / 100) % 4;
        case 'attack': return Math.min(3, Math.floor((t - u.animStart) / 90));
        case 'death': return Math.min(u.deathFrames - 1, Math.floor((t - u.animStart) / 110));
        default: return Math.floor(t / 220) % 4;
      }
    }

    drawUnit(u, battle, t) {
      place(this.ctx, u.px + 8, u.py + 8, () => this.drawUnitHere(u, battle, t));
    }

    drawUnitHere(u, battle, t) {
      const { ctx } = this;
      const facing = faceOf(u.facing);
      const sheet = u.acted && u.team === 'player' && battle.phase === 'player' ? grayImg(u.sprite) : img(u.sprite);
      const col = this.frameOf(u, t);
      const row = DIR_ROW[facing] + ANIM_ROW[u.anim];
      let x = u.px - 8, y = u.py - 8;
      if (t < u.hitShakeUntil) x += Math.round(Math.sin(t / 15) * 1.5);

      ctx.save();
      ctx.globalAlpha = u.alpha;
      if (facing === 'left') {
        ctx.translate(x + 32, y);
        ctx.scale(-1, 1);
        ctx.drawImage(sheet, col * 32, row * 32, 32, 32, 0, 0, 32, 32);
        if (t < u.flashUntil) { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(sheet, col * 32, row * 32, 32, 32, 0, 0, 32, 32); }
      } else {
        ctx.drawImage(sheet, col * 32, row * 32, 32, 32, x, y, 32, 32);
        if (t < u.flashUntil) { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(sheet, col * 32, row * 32, 32, 32, x, y, 32, 32); }
      }
      ctx.restore();

      if (u.boss && u.alive) drawBossMark(ctx, u.px, u.py, t);
      if (u.grade && u.alive && u.anim !== 'death') drawChevrons(ctx, u.px, u.py, u.grade);
    }

    // Rappel du triangle des armes : quand une unité alliée est sélectionnée, une flèche
    // verte (avantage) ou rouge (désavantage) s'affiche au-dessus de chaque ennemi.
    drawTriangleHints(battle, t) {
      const sel = battle.selected;
      if (!sel || !['selected', 'menu', 'target'].includes(battle.state)) return;
      const bob = Math.floor(t / 300) % 2;
      for (const e of battle.units) {
        if (!e.alive || e.team === sel.team) continue;
        const tri = triangle(sel.weapon, e.weapon);
        if (tri) place(this.ctx, e.px + 8, e.py + 8, () => drawArrow(this.ctx, e.px + 13, e.py - 3 + (tri > 0 ? -bob : bob), tri > 0));
      }
    }

    drawHpBar(u) {
      place(this.ctx, u.px + 8, u.py + 8, () => this.drawHpBarHere(u));
    }

    drawHpBarHere(u) {
      const { ctx } = this;
      const w = 12, x = u.px + 2, y = u.py + 15;
      ctx.globalAlpha = u.alpha;
      ctx.fillStyle = '#100810';
      ctx.fillRect(x - 1, y - 1, w + 2, 3);
      ctx.fillStyle = u.team === 'player' ? '#2a3a7a' : '#5a1a1a';
      ctx.fillRect(x, y, w, 1);
      ctx.fillStyle = u.team === 'player' ? '#7fb0ff' : '#ff7070';
      ctx.fillRect(x, y, Math.max(0, Math.round(w * u.hp / u.maxHp)), 1);
      ctx.globalAlpha = 1;
    }

    drawEffects(battle, t) {
      for (const e of battle.effects) {
        if (e.type !== 'crit') continue;
        const f = Math.min(3, Math.floor((t - e.start) / 80));
        place(this.ctx, e.x + 8, e.y + 8, () => this.ctx.drawImage(img('crit'), f * 32, 0, 32, 32, e.x - 8, e.y - 10, 32, 32));
      }
    }

    drawFloats(battle, t) {
      const { ctx } = this;
      for (const f of battle.floats) {
        const p = (t - f.start) / f.dur;
        const y = f.y - Math.min(1, p * 3) * 8;
        ctx.globalAlpha = p > 0.75 ? (1 - p) * 4 : 1;
        ctx.font = `bold ${f.big ? 9 : 8}px ${PIXEL_FONT}, sans-serif`;
        place(ctx, f.x, f.y + 10, () => drawPixelText(ctx, f.text, f.x, Math.round(y), f.color)); // chiffres en glyphes pixel lisibles
        ctx.globalAlpha = 1;
      }
    }
  }

  Object.assign(Resistance, { drawBossMark, Renderer });
})();

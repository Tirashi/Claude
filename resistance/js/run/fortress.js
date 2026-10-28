// Écran de la forteresse rebelle (hub entre les runs) : on y améliore les bâtiments avec
// le ravitaillement, puis on part en campagne depuis le quartier général.
// Même interface d'entrées que les autres écrans (hover, click, moveCursor, confirm…).
(() => {
  'use strict';
  const { TILE, img, PIXEL_FONT, TERRAIN, FORTRESS, ITEM_ICONS, EMBLEM_GLYPHS, iconHtml, numberHtml, drawWorldSprite, drawPixelText, prepText } = Resistance;

  const suppliesIcon = () => iconHtml(ITEM_ICONS.supplies.sheet, ITEM_ICONS.supplies.at);

  class FortressScene {
    // meta : sauvegarde (ravitaillement, niveaux des bâtiments)
    // onUpgrade(id) -> 'ok' | 'poor' | 'max' | 'cancel' (éventuellement via une promesse,
    // le temps de la confirmation) ; onDepart() propose de lancer une run
    constructor(meta, ui, { onUpgrade, onExchange, onPrepare, onDepart }) {
      this.meta = meta;
      this.ui = ui;
      this.onUpgrade = onUpgrade;
      this.onExchange = onExchange;   // bâtiment avec comptoir (Trésorerie)
      this.onPrepare = onPrepare;     // Intendance : préparatifs de la prochaine run
      this.onDepart = onDepart;
      this.time = 0;
      this.floats = [];
      this.spots = [
        { id: 'keep', ...FORTRESS.keep, size: FORTRESS.keep.sprite.size },
        { id: 'quartermaster', ...FORTRESS.quartermaster, size: [1, 1] },
        ...Object.entries(FORTRESS.buildings).map(([id, b]) => ({ id, ...b, size: [1, 1] })),
      ];
      ui.setLabel('Forteresse rebelle');
      this.setFocus(this.spots[0]);
    }

    get cursor() { return { x: this.focus.pos[0], y: this.focus.pos[1] }; }

    level(id) { return this.meta.upgrades[id] ?? 0; }

    update(now) {
      this.time = now;
      this.floats = this.floats.filter((f) => now - (f.start ?? now) < 1200);
    }

    render(renderer) { drawFortress(renderer, this); }

    spotAt(x, y) {
      return this.spots.find(({ pos: [px, py], size: [w, h] }) =>
        Math.abs(x - px) <= w - 1 && y <= py && y > py - h) ?? null;
    }

    setFocus(spot) {
      this.focus = spot;
      this.ui.showNode(this.describe(spot));
    }

    describe(spot) {
      const supplies = `${suppliesIcon()} ${numberHtml(this.meta.supplies)}`;
      if (spot.id === 'keep') {
        return `<div class="unit-name player">${spot.name}</div>
          <div class="unit-class">Réserves : ${supplies}</div>
          <div class="fc-note">Touchez encore pour partir en campagne</div>`;
      }
      if (spot.id === 'quartermaster') {
        const gold = `${iconHtml(ITEM_ICONS.gold.sheet, ITEM_ICONS.gold.at)} ${numberHtml(this.meta.gold ?? 0)}`;
        return `<div class="unit-name player">${spot.name}</div>
          <div class="unit-class">Trésor : ${gold} · Préparé : ${prepText(this.meta.prep) || 'rien'}</div>
          <div>Armes, potions et manuels pour la prochaine campagne</div>
          <div class="fc-note">Touchez encore pour ouvrir l'Intendance</div>`;
      }
      const lvl = this.level(spot.id), max = spot.costs.length;
      const cost = spot.costs[lvl];
      if (spot.exchange) {
        const gold = `${iconHtml(ITEM_ICONS.gold.sheet, ITEM_ICONS.gold.at)} ${numberHtml(this.meta.gold ?? 0)}`;
        return `<div class="unit-name player">${spot.name} <span class="unit-class">Niv ${lvl}/${max}</span></div>
          <div class="unit-class">Trésor : ${gold} · Ravitaillement : ${supplies}</div>
          <div>Acheter du ravitaillement, garder plus d'or</div>
          <div class="fc-note">Touchez encore pour ouvrir le comptoir</div>`;
      }
      const next = lvl >= max ? 'Niveau maximum'
        : `${lvl ? 'Améliorer' : 'Construire'} : ${suppliesIcon()} ${numberHtml(cost)} (réserves : ${numberHtml(this.meta.supplies)})`;
      const hint = lvl >= max ? '' : this.meta.supplies >= cost ? 'Touchez encore pour bâtir' : 'Pas assez de ravitaillement';
      return `<div class="unit-name player">${spot.name} <span class="unit-class">Niv ${lvl}/${max}</span></div>
        <div class="unit-class">Chaque niveau : ${spot.effectText}</div>
        <div>${next}</div>${hint ? `<div class="fc-note">${hint}</div>` : ''}`;
    }

    async act(spot) {
      if (spot.id === 'keep') { this.onDepart(); return; }
      if (spot.id === 'quartermaster') { await this.onPrepare(); this.setFocus(spot); return; }
      const action = spot.exchange ? this.onExchange : this.onUpgrade;
      if (await action(spot.id) === 'ok') {
        this.floats.push({ spot, text: `Niveau ${this.level(spot.id)} !`, start: null });
      }
      this.setFocus(spot);
    }

    // ------------------------------------------------------------ entrées
    // Souris : survol pour voir, clic pour agir. Au doigt : un appui pour voir, un second pour agir.
    hover(x, y) {
      const s = this.spotAt(x, y);
      if (s && s !== this.focus) this.setFocus(s);
    }

    click(x, y) {
      const s = this.spotAt(x, y);
      if (!s) return;
      if (s === this.focus) this.act(s);
      else this.setFocus(s);
    }

    moveCursor(dx, dy) {
      const list = [...this.spots].sort((a, b) => a.pos[1] - b.pos[1] || a.pos[0] - b.pos[0]);
      const i = list.indexOf(this.focus);
      this.setFocus(list[(i + (dx + dy > 0 ? 1 : -1) + list.length) % list.length]);
    }

    confirm() { this.act(this.focus); }
    cancel() {}
  }

  // ------------------------------------------------------------ rendu
  function hash(x, y) {
    let h = (x * 374761393 + y * 668265263) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }

  // Fond : un plateau d'herbe entouré de montagnes (rochers) et de forêts, un chemin
  // descend du quartier général vers la vallée.
  function buildBackground(renderer, scene) {
    const c = document.createElement('canvas');
    c.width = 15 * TILE;
    c.height = 10 * TILE;
    const g = c.getContext('2d');
    const ts = img('tileset');
    const put = ([tx, ty], x, y) => g.drawImage(ts, tx * TILE, ty * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
    const plain = TERRAIN['.'], forest = TERRAIN.F, rock = TERRAIN.R;
    const [kx, ky] = FORTRESS.keep.pos;
    // Cases occupées par les bâtiments et leurs champs : ni rocher ni arbre dessus
    const reserved = new Set([FORTRESS.quartermaster.pos.join(',')]);
    for (const b of Object.values(FORTRESS.buildings)) {
      reserved.add(`${b.pos[0]},${b.pos[1]}`);
      for (const f of b.fields?.spots ?? []) reserved.add(`${b.pos[0] + f.dx},${b.pos[1] + f.dy}`);
    }
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 15; x++) {
        const h = hash(x + 31, y + 17);
        put(plain.base[h % plain.base.length], x, y);
        const edge = Math.min(x, 14 - x, y, 9 - y);   // distance au bord de l'écran
        if (x === kx && y > ky) { put([1, 1], x, y); continue; } // chemin
        if (reserved.has(`${x},${y}`)) continue;
        if (edge === 0 || (edge === 1 && h % 3 !== 0 && y !== 9)) {
          const deco = h % 5 < 3 ? rock.overlay : forest.overlay;   // surtout des rochers : la montagne
          put(deco[h % deco.length], x, y);
        }
      }
    }
    renderer.mapCache = c;
    renderer.mapOwner = scene;
  }

  // Écusson 11×11 en haut à droite d'un bâtiment (case tx, ty) : contour sombre, fond de la
  // couleur du bâtiment, glyphe clair 7×7 (EMBLEM_GLYPHS).
  function drawEmblem(ctx, { glyph, color }, tx, ty) {
    const bx = tx * TILE + 8, by = ty * TILE - 4;
    ctx.fillStyle = '#101830';
    ctx.fillRect(bx + 1, by, 9, 11);
    ctx.fillRect(bx, by + 1, 11, 9);
    ctx.fillStyle = color;
    ctx.fillRect(bx + 1, by + 1, 9, 9);
    ctx.fillStyle = '#fff4d8';
    EMBLEM_GLYPHS[glyph].forEach((row, gy) => [...row].forEach((bit, gx) => {
      if (bit === '1') ctx.fillRect(bx + 2 + gx, by + 2 + gy, 1, 1);
    }));
  }

  function drawFortress(renderer, s) {
    const { ctx } = renderer;
    const t = s.time;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d1020';
    ctx.fillRect(0, 0, renderer.canvas.width, renderer.canvas.height);
    ctx.setTransform(renderer.scale, 0, 0, renderer.scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (renderer.mapOwner !== s) buildBackground(renderer, s);
    ctx.drawImage(renderer.mapCache, 0, 0);

    for (const spot of s.spots) {
      const [x, y] = spot.pos;
      if (spot.sprite) { // QG, Intendance : sans niveaux
        drawWorldSprite(ctx, spot.sprite, x, y);
        if (spot.emblem) drawEmblem(ctx, spot.emblem, x, y);
        continue;
      }
      const lvl = s.level(spot.id);
      // Champs (Ferme) : terre labourée, blé mûr une fois le niveau atteint
      for (const f of spot.fields?.spots ?? []) {
        drawWorldSprite(ctx, lvl >= f.minLevel ? spot.fields.ripe : spot.fields.empty, x + f.dx, y + f.dy);
      }
      if (lvl || spot.base) drawWorldSprite(ctx, lvl ? spot.sprites[lvl - 1] : spot.base, x, y);
      else {
        // Chantier : le bâtiment à venir, en grisé et transparent
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.filter = 'grayscale(1)';
        drawWorldSprite(ctx, spot.sprites[0], x, y);
        ctx.restore();
      }
      drawEmblem(ctx, spot.emblem, x, y);
      // Pastilles de niveau sous le bâtiment
      const max = spot.costs.length, px = x * TILE + 8 - (max * 4 - 1) / 2, py = (y + 1) * TILE + 1;
      for (let i = 0; i < max; i++) {
        ctx.fillStyle = '#101830';
        ctx.fillRect(px + i * 4 - 1, py - 1, 5, 4);
        ctx.fillStyle = i < lvl ? '#ffd34d' : '#4a5480';
        ctx.fillRect(px + i * 4, py, 3, 2);
      }
    }

    // Curseur sur le bâtiment en avant
    const f = s.focus, frame = Math.floor(t / 400) % 2, [fw, fh] = f.size;
    const cx = f.pos[0] * TILE + 8 - (fw * TILE) / 2, cy = (f.pos[1] + 1 - fh) * TILE;
    if (fw === 1) ctx.drawImage(img('cursor'), frame * 32, 0, 32, 32, cx - 8, cy - 8, 32, 32);
    else ctx.drawImage(img('cursor'), frame * 32, 0, 32, 32, cx - 8, cy - 8, fw * TILE + 16, fh * TILE + 16);

    // Messages « Niveau 2 ! »
    for (const fl of s.floats) {
      if (fl.start === null) fl.start = t;
      const p = (t - fl.start) / 1200;
      ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
      ctx.font = `bold 8px ${PIXEL_FONT}, sans-serif`;
      const x = fl.spot.pos[0] * TILE + 8, y = fl.spot.pos[1] * TILE - 4 - p * 10;
      drawPixelText(ctx, fl.text, x, Math.round(y), '#ffe066');
      ctx.globalAlpha = 1;
    }
  }

  Object.assign(Resistance, { FortressScene });
})();

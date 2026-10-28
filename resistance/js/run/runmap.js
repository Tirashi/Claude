// Écran de la carte de run : choix du prochain nœud, sur la même grille que les combats
// (15×10 cases de 16 px), pour réutiliser curseur, cases animées et sprites.
(() => {
  'use strict';
  const { TILE, drawBossMark, img, grayImg, CLASSES, TERRAIN, ENCOUNTERS, encounterIcon, NODE_TYPES, MAP_SPRITES } = Resistance;

  const START = { x: 0, y: 5 };   // camp rebelle (bannière), à gauche du premier étage
  const WALK_MS = 450;            // trajet de l'armée vers le nœud choisi
  const GRID_W = 15;              // largeur de la carte en cases

  class RunMapScene {
    constructor(run, ui, onChoose) {
      this.run = run;
      this.ui = ui;
      this.onChoose = onChoose;
      this.time = 0;
      this.selectable = run.selectableNodes();
      this.focus = null;
      this.walk = null;
      const from = run.current ?? START;
      this.cursor = { x: from.x, y: from.y };
      const next = Math.min(run.floor + 2, run.map.floors);
      ui.setLabel(`${run.country.name} · Étage ${next}/${run.map.floors}`);
      if (this.selectable.length) this.setFocus(this.selectable[0]);
    }

    update(now) {
      this.time = now;
      const w = this.walk;
      if (!w) return;
      if (w.start === null) w.start = now;
      if (!w.done && now - w.start >= WALK_MS) {
        w.done = true;
        this.onChoose(w.to);
      }
    }

    render(renderer) { drawRunMap(renderer, this); }

    isSelectable(n) { return this.selectable.includes(n); }
    // Nœud sous la case touchée : sa propre case, ou n'importe quelle case couverte par son
    // bâtiment (le château du général fait 2×2 cases et se cale contre le bord droit).
    nodeAt(x, y) {
      const nodes = this.run.map.nodes;
      const px = x * TILE + 8, py = y * TILE + 8;
      return nodes.find((n) => n.x === x && n.y === y)
        ?? nodes.find((n) => {
          const sprite = MAP_SPRITES[n.type];
          if (!sprite) return false;
          const { dx, dy, w, h } = spriteRect(sprite, n.x, n.y);
          return px >= dx && px < dx + w && py >= dy && py < dy + h;
        })
        ?? null;
    }

    setFocus(n) {
      this.focus = n;
      this.cursor = { x: n.x, y: n.y };
      this.ui.showNode(describeNode(this.run, n, this.isSelectable(n)));
    }

    // ------------------------------------------------------------ entrées
    // Souris : le survol met un nœud en avant, un clic y va. Au doigt : un premier appui
    // le met en avant, un second y va (comme pour choisir une cible en combat).
    hover(x, y) {
      if (this.walk) return;
      const n = this.nodeAt(x, y);
      if (n && n !== this.focus) this.setFocus(n);
    }

    click(x, y) {
      if (this.walk) return;
      const n = this.nodeAt(x, y);
      if (!n) return;
      if (n === this.focus && this.isSelectable(n)) this.choose(n);
      else this.setFocus(n);
    }

    moveCursor(dx, dy) {
      if (this.walk || !this.selectable.length) return;
      const list = [...this.selectable].sort((a, b) => a.y - b.y);
      const i = list.indexOf(this.focus);
      const step = dx + dy > 0 ? 1 : -1;
      this.setFocus(list[i < 0 ? 0 : (i + step + list.length) % list.length]);
    }

    confirm() {
      if (this.focus && this.isSelectable(this.focus)) this.choose(this.focus);
    }

    cancel() {}

    choose(n) {
      if (this.walk) return;
      this.ui.hideRunPanels();
      this.walk = { from: this.run.current ?? START, to: n, start: null, done: false };
    }
  }

  // Trois lignes au plus : le panneau tient dans la bordure du haut sans cacher de nœud.
  function describeNode(run, n, selectable) {
    const type = NODE_TYPES[n.type];
    const tone = ['rest', 'shop', 'event'].includes(n.type) ? 'player' : 'enemy';
    let title = type.name, detail = type.desc;
    if (n.encounter) {
      const enc = ENCOUNTERS[n.encounter];
      const bonus = run.levelBonus(n);
      title += ` · ${enc.name}`;
      detail = `${enc.enemies.length} ennemis${bonus ? ` · niveau +${bonus}` : ''}`;
    }
    const hint = selectable ? 'Touchez encore pour y aller'
      : run.visited.has(n.id) ? 'Déjà traversé' : 'Pas encore accessible';
    return `<div class="unit-name ${tone}">${title}</div>
      <div class="unit-class">${detail}</div><div class="fc-note">${hint}</div>`;
  }

  // ------------------------------------------------------------ rendu
  const center = (n) => ({ x: n.x * TILE + 8, y: n.y * TILE + 8 });

  function hash(x, y) {
    let h = (x * 374761393 + y * 668265263) >>> 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return (h ^ (h >>> 16)) >>> 0;
  }

  // Bannière bleue du camp rebelle, plantée juste au-dessus du point de départ.
  function drawBanner(ctx, t) {
    const x = START.x * TILE + 3, ground = START.y * TILE + 2;
    const wave = Math.floor(t / 300) % 2;          // le drapeau claque au vent
    ctx.fillStyle = '#101830';                     // contours
    ctx.fillRect(x - 1, ground - 15, 3, 16);
    ctx.fillRect(x + 1, ground - 15, 10, 8 + wave);
    ctx.fillStyle = '#8a5a2a';                     // hampe
    ctx.fillRect(x, ground - 14, 1, 14);
    ctx.fillStyle = '#3858c8';                     // drapeau
    ctx.fillRect(x + 1, ground - 14, 9, 6);
    ctx.fillRect(x + 1 + 4 * wave, ground - 8, 5 - wave, wave);
    ctx.fillStyle = '#ffd34d';                     // emblème
    ctx.fillRect(x + 4, ground - 12, 3, 2);
  }

  // Fond : herbe, bordure d'arbres et de rochers.
  function buildBackground(renderer, run) {
    const c = document.createElement('canvas');
    c.width = 15 * TILE;
    c.height = 10 * TILE;
    const g = c.getContext('2d');
    const ts = img('tileset');
    const put = ([tx, ty], x, y) => g.drawImage(ts, tx * TILE, ty * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
    const plain = TERRAIN['.'], forest = TERRAIN.F, rock = TERRAIN.R;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 15; x++) {
        const h = hash(x, y);
        put(plain.base[h % plain.base.length], x, y);
        if (y === 0 || y === 9) {
          const deco = h % 4 === 0 ? rock.overlay : forest.overlay;
          put(deco[h % deco.length], x, y);
        }
      }
    }
    renderer.mapCache = c;
    renderer.mapOwner = run;
  }

  function drawPath(ctx, a, b, lit) {
    const p = center(a), q = center(b);
    const dist = Math.hypot(q.x - p.x, q.y - p.y);
    const steps = Math.max(2, Math.round(dist / 5));
    for (let i = 1; i < steps; i++) {
      const d = (i / steps) * dist;
      if (d < 7 || dist - d < 7) continue; // pas de points sous les nœuds
      const x = Math.round(p.x + ((q.x - p.x) * i) / steps);
      const y = Math.round(p.y + ((q.y - p.y) * i) / steps);
      if (lit) {
        ctx.fillStyle = '#101830';
        ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = '#f8f0c8';
        ctx.fillRect(x - 1, y - 1, 2, 2);
      } else {
        ctx.fillStyle = 'rgba(16, 24, 48, .5)';
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }
  }

  function drawSprite(ctx, sheet, col, row, x, y, flip) {
    if (flip) {
      ctx.save();
      ctx.translate(x + 32, y);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet, col * 32, row * 32, 32, 32, 0, 0, 32, 32);
      ctx.restore();
    } else {
      ctx.drawImage(sheet, col * 32, row * 32, 32, 32, x, y, 32, 32);
    }
  }

  function drawEliteMark(ctx, px, py) {
    const x = px + 13, y = py - 3;
    ctx.fillStyle = '#200808';
    ctx.fillRect(x - 1, y - 1, 3, 8);
    ctx.fillStyle = '#ff6048';
    ctx.fillRect(x, y, 1, 4);
    ctx.fillRect(x, y + 5, 1, 1);
  }

  // « ? » blanc au-dessus d'un événement pas encore visité (5×7, contour sombre, léger rebond)
  const QUESTION = ['01110', '10001', '00001', '00110', '00100', '00000', '00100'];
  function drawQuestionMark(ctx, px, py, t) {
    const x = px + 11, y = py - 6 + (Math.floor(t / 400) % 2);
    for (const [dx, dy, c] of [[-1, 0, '#101830'], [1, 0, '#101830'], [0, -1, '#101830'], [0, 1, '#101830'], [0, 0, '#fff4d8']]) {
      ctx.fillStyle = c;
      QUESTION.forEach((row, ry) => [...row].forEach((bit, rx) => {
        if (bit === '1') ctx.fillRect(x + rx + dx, y + ry + dy, 1, 1);
      }));
    }
  }

  // Sprite « Mini World » ({ src, at, size }) posé sur la case (x, y) : centré horizontalement
  // (sans déborder de l'écran), base alignée sur le bas de la case.
  function drawWorldSprite(ctx, sprite, x, y, bob = 0) {
    const [c, r] = sprite.at;
    const { dx, dy, w, h } = spriteRect(sprite, x, y);
    ctx.drawImage(img(sprite.src), c * TILE, r * TILE, w, h, dx, dy - bob, w, h);
  }

  // Rectangle (en pixels de jeu) occupé par un sprite posé sur la case (x, y)
  function spriteRect(sprite, x, y) {
    const [tw, th] = sprite.size ?? [1, 1];
    const w = tw * TILE, h = th * TILE;
    const dx = Math.max(0, Math.min(GRID_W * TILE - w, x * TILE + 8 - w / 2));
    return { dx, dy: (y + 1) * TILE - h, w, h };
  }

  const drawBuilding = (ctx, id, x, y, bob = 0) => drawWorldSprite(ctx, MAP_SPRITES[id], x, y, bob);

  function drawNode(ctx, s, n, t) {
    const { run } = s;
    const px = n.x * TILE, py = n.y * TILE;
    const visited = run.visited.has(n.id);
    const selectable = s.isSelectable(n);
    if (selectable) {
      const frame = Math.floor(t / 70) % 14;
      ctx.drawImage(img('rangeBlue'), frame * TILE, 0, TILE, TILE, px, py, TILE, TILE);
    }
    // Repos, marchand, général : un bâtiment (village, étal, château du tyran)
    if (MAP_SPRITES[n.type]) {
      ctx.globalAlpha = visited ? 0.55 : 1;
      drawBuilding(ctx, n.type, n.x, n.y, selectable ? Math.round(Math.sin(t / 250)) : 0);
      ctx.globalAlpha = 1;
      if (n.type === 'boss' && !visited) drawBossMark(ctx, px, py - 16, t);
      if (n.type === 'event' && !visited) drawQuestionMark(ctx, px, py, t);
      return;
    }
    if (run.current === n) return; // l'armée se tient sur ce nœud
    const sprite = `${CLASSES[encounterIcon(ENCOUNTERS[n.encounter])].sprite}_red`;
    ctx.globalAlpha = visited || selectable ? 1 : 0.8;
    const col = selectable ? Math.floor(t / 220) % 4 : 0;
    drawSprite(ctx, visited ? grayImg(sprite) : img(sprite), col, 0, px - 8, py - 8, true);
    ctx.globalAlpha = 1;
    if (visited) return;
    if (n.type === 'boss') drawBossMark(ctx, px, py, t);
    if (n.type === 'elite') drawEliteMark(ctx, px, py);
  }

  function drawArmy(ctx, s, t) {
    const { run } = s;
    const leader = run.livingArmy()[0];
    if (!leader) return;
    const sheet = img(`${CLASSES[leader.cls].sprite}_blue`);
    let { x, y } = run.current ?? START;
    let row = 0, col = Math.floor(t / 220) % 4, flip = false;
    const w = s.walk;
    if (w && w.start !== null) {
      const p = Math.min(1, (t - w.start) / WALK_MS);
      x = w.from.x + (w.to.x - w.from.x) * p;
      y = w.from.y + (w.to.y - w.from.y) * p;
      row = 1;                         // animation de marche
      col = Math.floor(t / 100) % 4;
      flip = w.to.x < w.from.x;
    }
    drawSprite(ctx, sheet, col, row, Math.round(x * TILE) - 8, Math.round(y * TILE) - 8, flip);
  }

  function drawRunMap(renderer, s) {
    const { ctx } = renderer;
    const { run } = s;
    const t = s.time;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d1020';
    ctx.fillRect(0, 0, renderer.canvas.width, renderer.canvas.height);
    ctx.setTransform(renderer.scale, 0, 0, renderer.scale, 0, 0);
    ctx.imageSmoothingEnabled = false;

    if (renderer.mapOwner !== run) buildBackground(renderer, run);
    ctx.drawImage(renderer.mapCache, 0, 0);

    const nodes = run.map.nodes;
    const reached = (n) => run.visited.has(n.id) || s.isSelectable(n);
    for (const n of nodes) {
      if (n.floor === 0) drawPath(ctx, START, n, reached(n));
      for (const id of n.next) drawPath(ctx, n, nodes[id], run.visited.has(n.id) && reached(nodes[id]));
    }
    for (const n of [...nodes].sort((a, b) => a.y - b.y)) drawNode(ctx, s, n, t);
    drawBuilding(ctx, 'camp', START.x, START.y);
    drawBanner(ctx, t);
    drawArmy(ctx, s, t);

    if (s.focus && !s.walk) {
      // Le curseur encadre la case du nœud, ou tout son bâtiment s'il est plus grand (château)
      const frame = Math.floor(t / 400) % 2;
      const sprite = MAP_SPRITES[s.focus.type];
      const r = sprite && (sprite.size?.[0] ?? 1) > 1 ? spriteRect(sprite, s.focus.x, s.focus.y)
        : { dx: s.focus.x * TILE, dy: s.focus.y * TILE, w: TILE, h: TILE };
      ctx.drawImage(img('cursor'), frame * 32, 0, 32, 32, r.dx - 8, r.dy - 8, r.w + 16, r.h + 16);
    }
  }

  Object.assign(Resistance, { RunMapScene, drawWorldSprite, spriteRect, drawRunMap });
})();

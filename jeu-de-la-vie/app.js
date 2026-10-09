(function () {
  'use strict';

  /* =========================================================
     Motifs
     ========================================================= */

  function pulsarCells() {
    const map = {
      0:  [2, 3, 4, 8, 9, 10],
      2:  [0, 5, 7, 12],
      3:  [0, 5, 7, 12],
      4:  [0, 5, 7, 12],
      5:  [2, 3, 4, 8, 9, 10],
      7:  [2, 3, 4, 8, 9, 10],
      8:  [0, 5, 7, 12],
      9:  [0, 5, 7, 12],
      10: [0, 5, 7, 12],
      12: [2, 3, 4, 8, 9, 10]
    };
    const cells = [];
    for (const y in map) for (const x of map[y]) cells.push([x, +y]);
    return cells;
  }

  function gosperCells() {
    return [
      [24, 0],
      [22, 1], [24, 1],
      [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
      [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
      [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
      [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5],
      [10, 6], [16, 6], [24, 6],
      [11, 7], [15, 7],
      [12, 8], [13, 8]
    ];
  }

  const PATTERNS = [
    { id: 'none',    label: 'Dessin libre',           cells: null },
    { id: 'block',   label: 'Bloc (stable)',          cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    { id: 'blinker', label: 'Clignotant (période 2)', cells: [[0, 0], [1, 0], [2, 0]] },
    { id: 'toad',    label: 'Crapaud (période 2)',    cells: [[1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1]] },
    { id: 'glider',  label: 'Planeur',                cells: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]] },
    { id: 'lwss',    label: 'Petit vaisseau (LWSS)',  cells: [[0, 0], [3, 0], [4, 1], [0, 2], [4, 2], [1, 3], [2, 3], [3, 3], [4, 3]] },
    { id: 'pulsar',  label: 'Pulsar (période 3)',     cells: pulsarCells() },
    { id: 'rpent',   label: 'R-pentomino',            cells: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]] },
    { id: 'acorn',   label: 'Gland (acorn)',          cells: [[1, 0], [3, 1], [0, 2], [1, 2], [4, 2], [5, 2], [6, 2]] },
    { id: 'diehard', label: 'Diehard',                cells: [[6, 0], [0, 1], [1, 1], [1, 2], [5, 2], [6, 2], [7, 2]] },
    { id: 'gosper',  label: 'Canon à planeurs',       cells: gosperCells() }
  ];

  const RULE_PRESETS = [
    { label: 'Life — la règle classique', rule: 'B3/S23' },
    { label: 'HighLife (réplicateurs)',   rule: 'B36/S23' },
    { label: 'Day & Night',               rule: 'B3678/S34678' },
    { label: 'Seeds (explosif)',          rule: 'B2/S' },
    { label: 'Réplicateur',               rule: 'B1357/S1357' },
    { label: 'Diamoeba',                  rule: 'B35678/S5678' },
    { label: '34 Life',                   rule: 'B34/S34' },
    { label: 'Maze (labyrinthe)',         rule: 'B3/S12345' }
  ];

  /* =========================================================
     État
     ========================================================= */

  const MAX_SIDE = 400;
  const TRAIL_STEPS = 6;

  let cols = 90, rows = 50, cellSize = 12;
  let grid = null, next = null, heat = null;
  const born = new Uint8Array(9);
  const survive = new Uint8Array(9);

  let running = false;
  let gen = 0, pop = 0;
  let speed = 12, density = 0.30;
  let wrap = true, showGrid = true, showTrails = true;

  let pattern = null;   // liste de [x, y] déjà pivotée, ou null en dessin libre
  let rotation = 0;
  let hover = null;     // {x, y} en coordonnées grille

  let painting = false, paintValue = 1, lastPaint = -1;
  let acc = 0, lastTs = 0;

  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d', { alpha: false });

  const $ = (id) => document.getElementById(id);
  const el = {
    statGen: $('statGen'), statPop: $('statPop'), statSize: $('statSize'), statRule: $('statRule'),
    boardWrap: $('boardWrap'),
    btnPlay: $('btnPlay'), btnStep: $('btnStep'), btnRandom: $('btnRandom'), btnClear: $('btnClear'),
    inSpeed: $('inSpeed'), outSpeed: $('outSpeed'),
    inDensity: $('inDensity'), outDensity: $('outDensity'),
    inPattern: $('inPattern'), btnRotate: $('btnRotate'), btnCenter: $('btnCenter'), patternHint: $('patternHint'),
    inRulePreset: $('inRulePreset'), inRule: $('inRule'),
    inCols: $('inCols'), inRows: $('inRows'), inCell: $('inCell'), outCell: $('outCell'),
    inWrap: $('inWrap'), inGridLines: $('inGridLines'), inTrails: $('inTrails'), btnFit: $('btnFit')
  };

  /* =========================================================
     Grille
     ========================================================= */

  function allocate(nc, nr) {
    const size = nc * nr;
    const g = new Uint8Array(size);
    const h = new Uint8Array(size);
    if (grid) {
      const cc = Math.min(cols, nc), rr = Math.min(rows, nr);
      for (let y = 0; y < rr; y++) {
        for (let x = 0; x < cc; x++) {
          g[y * nc + x] = grid[y * cols + x];
          h[y * nc + x] = heat[y * cols + x];
        }
      }
    }
    cols = nc; rows = nr;
    grid = g; next = new Uint8Array(size); heat = h;
    countPopulation();
    layout();
  }

  function layout() {
    const dpr = window.devicePixelRatio || 1;
    const w = cols * cellSize, h = rows * cellSize;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    el.statSize.textContent = cols + '×' + rows;
  }

  function countPopulation() {
    let n = 0;
    for (let i = 0; i < grid.length; i++) n += grid[i];
    pop = n;
  }

  function clearGrid() {
    grid.fill(0);
    heat.fill(0);
    gen = 0;
    pop = 0;
  }

  function randomize() {
    for (let i = 0; i < grid.length; i++) {
      const alive = Math.random() < density ? 1 : 0;
      grid[i] = alive;
      heat[i] = alive ? TRAIL_STEPS : 0;
    }
    gen = 0;
    countPopulation();
  }

  /* =========================================================
     Simulation
     ========================================================= */

  function step() {
    const c = cols, r = rows;
    for (let y = 0; y < r; y++) {
      for (let x = 0; x < c; x++) {
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          let ny = y + dy;
          if (ny < 0 || ny >= r) {
            if (!wrap) continue;
            ny = (ny + r) % r;
          }
          const base = ny * c;
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            let nx = x + dx;
            if (nx < 0 || nx >= c) {
              if (!wrap) continue;
              nx = (nx + c) % c;
            }
            n += grid[base + nx];
          }
        }
        const i = y * c + x;
        next[i] = grid[i] ? survive[n] : born[n];
      }
    }

    let alive = 0;
    for (let i = 0; i < next.length; i++) {
      if (next[i]) { heat[i] = TRAIL_STEPS; alive++; }
      else if (heat[i]) heat[i]--;
    }
    pop = alive;

    const tmp = grid; grid = next; next = tmp;
    gen++;
  }

  /* =========================================================
     Rendu
     ========================================================= */

  // palette 16 bits : traces en paliers de couleur au lieu d'un fondu continu
  const PAL = {
    bg: '#0b0f24', grid: '#18204a',
    cell: '#5cff8a', cellHi: '#d4ffe0', cellLo: '#1f8a4a', spark: '#ffffff',
    trail: ['#0f1a33', '#12243a', '#142e42', '#17394a', '#1a4552', '#1e525c'],
    ghost: 'rgba(255, 210, 63, 0.55)'
  };

  const buckets = [];
  for (let i = 0; i < TRAIL_STEPS; i++) buckets.push([]);

  function draw() {
    const w = cols * cellSize, h = rows * cellSize;

    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, w, h);

    const lines = showGrid && cellSize >= 5;

    if (lines) {
      ctx.strokeStyle = PAL.grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= cols; x++) {
        const px = Math.round(x * cellSize) + 0.5;
        ctx.moveTo(px, 0); ctx.lineTo(px, h);
      }
      for (let y = 0; y <= rows; y++) {
        const py = Math.round(y * cellSize) + 0.5;
        ctx.moveTo(0, py); ctx.lineTo(w, py);
      }
      ctx.stroke();
    }

    const gap = lines ? 1 : 0;
    const s = cellSize - gap;

    // Traces des cellules récemment mortes, regroupées par intensité
    if (showTrails) {
      for (let b = 0; b < TRAIL_STEPS; b++) buckets[b].length = 0;
      for (let i = 0; i < grid.length; i++) {
        const hv = heat[i];
        if (hv && !grid[i]) buckets[hv - 1].push(i);
      }
      for (let b = 0; b < TRAIL_STEPS; b++) {
        const list = buckets[b];
        if (!list.length) continue;
        ctx.fillStyle = PAL.trail[b];
        for (let k = 0; k < list.length; k++) {
          const i = list[k];
          const x = i % cols, y = (i - x) / cols;
          ctx.fillRect(x * cellSize + gap, y * cellSize + gap, s, s);
        }
      }
    }

    // Cellules vivantes : briques en relief dès qu'elles sont assez grandes
    const bevel = s >= 5;
    for (const [col, dx, dy, dw, dh] of bevel
      ? [[PAL.cellLo, 0, 0, s, s], [PAL.cell, 0, 0, s - 1, s - 1], [PAL.cellHi, 0, 0, s - 1, 1], [PAL.cellHi, 0, 0, 1, s - 1], [PAL.spark, 1, 1, 1, 1]]
      : [[PAL.cell, 0, 0, s, s]]) {
      ctx.fillStyle = col;
      for (let i = 0; i < grid.length; i++) {
        if (!grid[i]) continue;
        const x = i % cols, y = (i - x) / cols;
        ctx.fillRect(x * cellSize + gap + dx, y * cellSize + gap + dy, dw, dh);
      }
    }

    // Aperçu du motif sous le curseur
    if (pattern && hover) {
      ctx.fillStyle = PAL.ghost;
      const off = patternOffset();
      for (let k = 0; k < pattern.length; k++) {
        let px = hover.x + pattern[k][0] - off.x;
        let py = hover.y + pattern[k][1] - off.y;
        if (wrap) {
          px = (px % cols + cols) % cols;
          py = (py % rows + rows) % rows;
        } else if (px < 0 || py < 0 || px >= cols || py >= rows) {
          continue;
        }
        ctx.fillRect(px * cellSize + gap, py * cellSize + gap, s, s);
      }
    }
  }

  /* =========================================================
     Motifs : rotation et placement
     ========================================================= */

  function normalize(cells) {
    let minX = Infinity, minY = Infinity;
    for (const c of cells) {
      if (c[0] < minX) minX = c[0];
      if (c[1] < minY) minY = c[1];
    }
    return cells.map((c) => [c[0] - minX, c[1] - minY]);
  }

  function rotateCells(cells, times) {
    let out = cells.map((c) => [c[0], c[1]]);
    const t = ((times % 4) + 4) % 4;
    for (let k = 0; k < t; k++) out = normalize(out.map((c) => [-c[1], c[0]]));
    return normalize(out);
  }

  function patternSize(cells) {
    let maxX = 0, maxY = 0;
    for (const c of cells) {
      if (c[0] > maxX) maxX = c[0];
      if (c[1] > maxY) maxY = c[1];
    }
    return { w: maxX + 1, h: maxY + 1 };
  }

  function patternOffset() {
    const size = patternSize(pattern);
    return { x: Math.floor(size.w / 2), y: Math.floor(size.h / 2) };
  }

  function placePattern(cx, cy) {
    if (!pattern) return;
    const off = patternOffset();
    for (const c of pattern) {
      let x = cx + c[0] - off.x;
      let y = cy + c[1] - off.y;
      if (wrap) {
        x = (x % cols + cols) % cols;
        y = (y % rows + rows) % rows;
      } else if (x < 0 || y < 0 || x >= cols || y >= rows) {
        continue;
      }
      const i = y * cols + x;
      if (!grid[i]) pop++;
      grid[i] = 1;
      heat[i] = TRAIL_STEPS;
    }
  }

  function refreshPattern() {
    const def = PATTERNS.find((p) => p.id === el.inPattern.value);
    if (!def || !def.cells) {
      pattern = null;
      el.patternHint.textContent = 'Cliquez-glissez sur la grille pour dessiner. Clic droit pour effacer.';
    } else {
      pattern = rotateCells(def.cells, rotation);
      const size = patternSize(pattern);
      el.patternHint.textContent = 'Motif ' + size.w + '×' + size.h + ' — cliquez sur la grille pour le déposer.';
    }
  }

  /* =========================================================
     Règles
     ========================================================= */

  function applyRule(str) {
    const m = /^\s*B?([0-8]*)\s*\/\s*S?([0-8]*)\s*$/i.exec(str);
    if (!m) return false;
    born.fill(0);
    survive.fill(0);
    for (const d of m[1]) born[+d] = 1;
    for (const d of m[2]) survive[+d] = 1;
    el.statRule.textContent = 'B' + m[1].split('').sort().join('') + '/S' + m[2].split('').sort().join('');
    return true;
  }

  /* =========================================================
     Souris et tactile
     ========================================================= */

  function cellAt(ev) {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((ev.clientX - r.left) / cellSize);
    const y = Math.floor((ev.clientY - r.top) / cellSize);
    if (x < 0 || y < 0 || x >= cols || y >= rows) return null;
    return { x: x, y: y };
  }

  function paintAt(c) {
    const i = c.y * cols + c.x;
    if (i === lastPaint) return;
    lastPaint = i;
    if (grid[i] !== paintValue) {
      grid[i] = paintValue;
      pop += paintValue ? 1 : -1;
    }
    if (paintValue) heat[i] = TRAIL_STEPS;
  }

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    const c = cellAt(e);
    if (!c) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    if (pattern && e.button !== 2) {
      placePattern(c.x, c.y);
      return;
    }
    painting = true;
    lastPaint = -1;
    paintValue = (e.button === 2) ? 0 : (grid[c.y * cols + c.x] ? 0 : 1);
    paintAt(c);
  });

  canvas.addEventListener('pointermove', (e) => {
    const c = cellAt(e);
    hover = c;
    if (painting && c) paintAt(c);
  });

  canvas.addEventListener('pointerleave', () => { hover = null; });

  window.addEventListener('pointerup', () => { painting = false; lastPaint = -1; });

  /* =========================================================
     Contrôles
     ========================================================= */

  function setRunning(v) {
    running = v;
    el.btnPlay.textContent = running ? 'PAUSE' : 'DÉMARRER';
    el.btnPlay.classList.toggle('primary', !running);
    acc = 0;
  }

  el.btnPlay.addEventListener('click', () => setRunning(!running));
  el.btnStep.addEventListener('click', () => { setRunning(false); step(); });
  el.btnRandom.addEventListener('click', () => randomize());
  el.btnClear.addEventListener('click', () => { clearGrid(); setRunning(false); });

  el.inSpeed.addEventListener('input', () => {
    speed = +el.inSpeed.value;
    el.outSpeed.textContent = speed + ' gén/s';
  });

  el.inDensity.addEventListener('input', () => {
    density = +el.inDensity.value / 100;
    el.outDensity.textContent = el.inDensity.value + ' %';
  });

  el.inPattern.addEventListener('change', () => { rotation = 0; refreshPattern(); });
  el.btnRotate.addEventListener('click', () => { rotation++; refreshPattern(); });
  el.btnCenter.addEventListener('click', () => {
    if (pattern) placePattern(Math.floor(cols / 2), Math.floor(rows / 2));
  });

  el.inRulePreset.addEventListener('change', () => {
    el.inRule.value = el.inRulePreset.value;
    el.inRule.classList.remove('invalid');
    applyRule(el.inRule.value);
  });

  el.inRule.addEventListener('input', () => {
    const ok = applyRule(el.inRule.value);
    el.inRule.classList.toggle('invalid', !ok);
    if (ok) {
      const match = RULE_PRESETS.find((p) => p.rule === el.statRule.textContent);
      el.inRulePreset.value = match ? match.rule : '';
    }
  });

  function clampInt(value, lo, hi, fallback) {
    const v = parseInt(value, 10);
    if (!isFinite(v)) return fallback;
    return Math.max(lo, Math.min(hi, v));
  }

  function applySize() {
    const nc = clampInt(el.inCols.value, 10, MAX_SIDE, cols);
    const nr = clampInt(el.inRows.value, 10, MAX_SIDE, rows);
    el.inCols.value = nc;
    el.inRows.value = nr;
    if (nc !== cols || nr !== rows) allocate(nc, nr);
  }

  el.inCols.addEventListener('change', applySize);
  el.inRows.addEventListener('change', applySize);

  el.inCell.addEventListener('input', () => {
    cellSize = +el.inCell.value;
    el.outCell.textContent = cellSize + ' px';
    layout();
  });

  el.inWrap.addEventListener('change', () => { wrap = el.inWrap.checked; });
  el.inGridLines.addEventListener('change', () => { showGrid = el.inGridLines.checked; });
  el.inTrails.addEventListener('change', () => { showTrails = el.inTrails.checked; });

  function fitToWindow() {
    const r = el.boardWrap.getBoundingClientRect();
    const nc = clampInt(Math.floor((r.width - 34) / cellSize), 10, MAX_SIDE, cols);
    const nr = clampInt(Math.floor((r.height - 34) / cellSize), 10, MAX_SIDE, rows);
    el.inCols.value = nc;
    el.inRows.value = nr;
    if (nc !== cols || nr !== rows) allocate(nc, nr);
  }

  el.btnFit.addEventListener('click', fitToWindow);

  window.addEventListener('keydown', (e) => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
    switch (e.key.toLowerCase()) {
      case ' ': e.preventDefault(); setRunning(!running); break;
      case 'n': setRunning(false); step(); break;
      case 'r': randomize(); break;
      case 'c': clearGrid(); setRunning(false); break;
      case 'p': rotation++; refreshPattern(); break;
      default: break;
    }
  });

  /* =========================================================
     Boucle principale
     ========================================================= */

  let lastGen = -1, lastPop = -1;

  function updateStats() {
    if (gen !== lastGen) { el.statGen.textContent = gen.toLocaleString('fr-FR'); lastGen = gen; }
    if (pop !== lastPop) { el.statPop.textContent = pop.toLocaleString('fr-FR'); lastPop = pop; }
  }

  function loop(ts) {
    if (!lastTs) lastTs = ts;
    const dt = Math.min((ts - lastTs) / 1000, 0.25);
    lastTs = ts;

    if (running) {
      acc += dt;
      const interval = 1 / speed;
      let n = 0;
      while (acc >= interval && n < 10) { step(); acc -= interval; n++; }
      if (acc > 1) acc = 0;
    }

    draw();
    updateStats();
    requestAnimationFrame(loop);
  }

  /* =========================================================
     Initialisation
     ========================================================= */

  function init() {
    for (const p of PATTERNS) {
      const o = document.createElement('option');
      o.value = p.id;
      o.textContent = p.label;
      el.inPattern.appendChild(o);
    }
    for (const p of RULE_PRESETS) {
      const o = document.createElement('option');
      o.value = p.rule;
      o.textContent = p.label + ' — ' + p.rule;
      el.inRulePreset.appendChild(o);
    }

    applyRule('B3/S23');
    el.inRulePreset.value = 'B3/S23';
    refreshPattern();

    cellSize = +el.inCell.value;
    el.outCell.textContent = cellSize + ' px';
    speed = +el.inSpeed.value;
    el.outSpeed.textContent = speed + ' gén/s';
    density = +el.inDensity.value / 100;
    el.outDensity.textContent = el.inDensity.value + ' %';

    allocate(cols, rows);
    fitToWindow();
    randomize();

    requestAnimationFrame(loop);
  }

  init();
})();

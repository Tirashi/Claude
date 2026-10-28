(() => {
  'use strict';
  const { WEAPONS, WEAPON_TYPES, BEATS, MOVE_TYPE_NAMES, CLASSES, TRAITS, ICON_SHEETS, ITEM_ICONS, ITEMS, simulateAllHits, STAT_KEYS, STAT_LABELS, MAX_LEVEL, numberHtml } = Resistance;

  const $ = (id) => document.getElementById(id);

  // Petite image pixel (une lettre par couleur) -> adresse data: ; la main du menu d'action
  const HAND = ['.........', 'kkkk.....', 'kwwwkkkk.', 'kwwwwwwwk', 'kwwwwkkk.', 'kwwwwk...', 'kwwwk....', 'kkkk.....', '.........'];
  function pixelArt(rows, pal = { k: '#101830', w: '#f8f8f0' }) {
    const c = document.createElement('canvas');
    c.width = rows[0].length; c.height = rows.length;
    const g = c.getContext('2d');
    rows.forEach((row, y) => [...row].forEach((ch, x) => { if (pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } }));
    return c.toDataURL();
  }

  // Icône 16×16 d'une planche (icons.js), à la taille du texte (1em = une icône).
  function iconHtml(sheetId, [col, row]) {
    const s = ICON_SHEETS[sheetId];
    return `<span class="icon" style="background-image:url(${s.src});background-size:${s.cols}em ${s.rows}em;`
      + `background-position:-${col}em -${row}em"></span>`;
  }

  const weaponIcon = (w) => (w.icon ? iconHtml('weapons', w.icon) : '');
  const typeHtml = (type) => `${iconHtml('weapons', WEAPON_TYPES[type].icon)} ${WEAPON_TYPES[type].name}`;

  // « Efficace contre les armures » pour les armes qui triplent leur Puissance contre un type d'unité
  function effectiveText(w) {
    return w.effective?.length ? `Efficace contre ${w.effective.map((m) => MOVE_TYPE_NAMES[m]).join(' et ')}` : '';
  }

  // Place d'une arme dans le triangle : « Fort contre Hache · Faible contre Lance »
  function triangleHtml(w) {
    const strong = BEATS[w.type];
    const weak = Object.keys(BEATS).find((k) => BEATS[k] === w.type);
    if (!strong) return '<div class="tri-line unit-class">Hors du triangle des armes</div>';
    return `<div class="tri-line"><span class="fc-adv">Fort contre</span> ${typeHtml(strong)}
      · <span class="fc-dis">Faible contre</span> ${typeHtml(weak)}</div>`;
  }

  // Liste de l'armée (bilan de combat, repos, consultation). entries : voir Run.summary().
  function armyHtml(entries) {
    const rows = entries.map((e) => {
      const pct = e.maxHp ? (100 * e.hp) / e.maxHp : 0;
      const state = e.revived ? `<span class="fc-adv">Sauvé : ${e.revived}</span> · PV ${e.hp}/${e.maxHp}`
        : e.fallen && !e.alive ? '<span class="fc-dis">Tombé au combat</span>'
        : `PV ${e.hp}/${e.maxHp}${e.healed ? ` <span class="fc-adv">+${e.healed}</span>` : ''}`;
      return `<div class="army-row${e.alive ? '' : ' fallen'}">
        <span class="unit-name player">${e.name}</span>
        <span class="unit-class">${e.className}${e.trait ? ` · <span class="trait">${e.trait}</span>` : ''}
          ${e.weapon ? weaponIcon(WEAPONS[e.weapon]) : ''}</span>
        <span>Niv ${e.level}</span><span class="army-hp">${state}</span>
        <div class="bar"><div style="width:${pct}%"></div></div></div>`;
    }).join('');
    return `<div class="army-list">${rows}</div>`;
  }

  class UI {
    constructor({ onEndTurn, onRestart, onReplay, onCancel, onArmy, onDepart, onRetreat, tileToScreen }) {
      this.el = {
        unit: $('unit-panel'), terrain: $('terrain-panel'), menu: $('action-menu'),
        forecast: $('forecast'), banner: $('banner'), end: $('end-screen'),
        endTitle: $('end-title'), endText: $('end-text'), restart: $('restart-btn'),
        replay: $('replay-btn'), seed: $('seed-label'), endSeed: $('end-seed'),
        endTurn: $('end-turn-btn'), turn: $('turn-label'), cancel: $('cancel-btn'),
        exp: $('exp-panel'), levelup: $('levelup'), levelupBox: $('levelup-box'),
        army: $('army-btn'), node: $('node-panel'),
        runOverlay: $('run-overlay'), runBox: $('run-box'), resources: $('resources'),
        hud: $('hud'), stage: $('stage'),
      };
      this.tileToScreen = tileToScreen;
      // Petite main pixel du menu d'action (façon GBA), dessinée une fois
      document.documentElement.style.setProperty('--main', `url(${pixelArt(HAND)})`);
      this.menuItems = [];
      this.menuIndex = 0;
      this.menuCb = null;
      this.el.endTurn.addEventListener('click', onEndTurn);
      this.el.restart.addEventListener('click', onRestart);
      this.el.replay.addEventListener('click', onReplay);
      this.el.cancel.addEventListener('click', onCancel);
      this.el.army.addEventListener('click', onArmy);
      $('depart-btn').addEventListener('click', onDepart);
      $('retreat-btn').addEventListener('click', onRetreat);
      this.levelupResolve = null;
      this.runPanel = null; // { onConfirm, onCancel, onMove } pendant qu'une fenêtre de run est ouverte
      this.el.levelup.addEventListener('click', () => this.closeLevelUp());
    }

    get modalOpen() { return !!this.levelupResolve || !!this.runPanel; }

    // Clavier pendant une fenêtre modale : Entrée valide, Échap ferme si possible,
    // flèches pour les fenêtres qui ont plusieurs choix (recrutement).
    modalConfirm() {
      if (this.levelupResolve) this.closeLevelUp();
      else this.runPanel?.onConfirm();
    }
    modalCancel() {
      if (this.levelupResolve) this.closeLevelUp();
      else this.runPanel?.onCancel?.();
    }
    modalMove(dx, dy) {
      if (!this.levelupResolve) this.runPanel?.onMove?.(dx, dy);
    }

    openRunPanel(html, handlers) {
      this.el.runBox.innerHTML = html;
      this.runPanel = handlers;
      this.el.runOverlay.classList.remove('hidden');
    }
    closeRunPanel() {
      this.el.runOverlay.classList.add('hidden');
      this.runPanel = null;
    }

    hideAll() {
      this.hideUnit(); this.hideMenu(); this.hideForecast();
      this.el.terrain.classList.add('hidden');
    }

    // 'fortress' : forteresse (Partir en campagne) ; 'map' : carte de run (Armée) ;
    // 'battle' : combat (Annuler, Fin du tour)
    setMode(mode) {
      document.body.dataset.mode = mode;
      this.hideRunPanels();
    }

    // Or et ravitaillement de la run, dans la barre d'outils (null : masqués)
    setResources(res) {
      const el = this.el.resources;
      if (!res) { el.innerHTML = ''; return; }
      el.innerHTML = (res.gold === undefined ? ''
        : `<span title="Or">${iconHtml(ITEM_ICONS.gold.sheet, ITEM_ICONS.gold.at)} ${numberHtml(res.gold)}</span>`)
        + `<span title="Ravitaillement">${iconHtml(ITEM_ICONS.supplies.sheet, ITEM_ICONS.supplies.at)} ${numberHtml(res.supplies)}</span>`;
    }

    // « Annuler » n'est actif que s'il y a quelque chose à annuler
    setCancelEnabled(on) {
      if (this.el.cancel.disabled === !on) return;
      this.el.cancel.disabled = !on;
    }

    setLabel(text) {
      this.el.turn.textContent = text;
      this.el.turn.style.color = '';
    }

    setTurn(n, phase) {
      this.el.turn.textContent = `Tour ${n}`;
      this.el.turn.style.color = phase === 'player' ? '#9fc0ff' : '#ff9f9f';
    }

    // ------------------------------------------------------------ carte de run
    showNode(html) {
      this.el.node.innerHTML = html;
      this.el.node.classList.remove('hidden');
    }
    hideRunPanels() {
      this.el.node.classList.add('hidden');
    }

    // Fenêtre de run (repos, bilan de combat, armée). Renvoie l'id du bouton choisi.
    showRunPanel({ title, body, buttons = [{ id: 'ok', label: 'Continuer' }], cancel = null }) {
      return new Promise((resolve) => {
        const done = (id) => { this.closeRunPanel(); resolve(id); };
        this.openRunPanel(`<h2>${title}</h2>${body}<div class="run-actions"></div>`, {
          onConfirm: () => done(buttons[0].id),
          onCancel: cancel ? () => done(cancel) : null,
        });
        const actions = this.el.runBox.querySelector('.run-actions');
        buttons.forEach((b, i) => {
          const btn = document.createElement('button');
          btn.textContent = b.label;
          if (i === 0) btn.className = 'primary';
          btn.addEventListener('click', () => done(b.id));
          actions.appendChild(btn);
        });
      });
    }

    // Liste de choix (marchand, choix d'un soldat…). choices : [{ id, html, disabled }].
    // Renvoie l'id du choix ou du bouton cliqué. Clavier : flèches, Entrée, Échap (= cancel).
    showChoices({ title, body = '', choices, buttons = [], cancel = null }) {
      const list = choices.map((c, i) =>
        `<button class="choice" data-i="${i}"${c.disabled ? ' disabled' : ''}>${c.html}</button>`).join('');
      const html = `<h2>${title}</h2>${body}<div class="choice-list">${list}</div><div class="run-actions"></div>`;
      return new Promise((resolve) => {
        const done = (id) => { this.closeRunPanel(); resolve(id); };
        const n = choices.length + buttons.length; // les boutons suivent les choix dans l'ordre du focus
        let focus = choices.findIndex((c) => !c.disabled);
        if (focus < 0) focus = choices.length;
        const targets = () => [...this.el.runBox.querySelectorAll('.choice, .run-actions button')];
        const paint = () => targets().forEach((el, i) => el.classList.toggle('focus', i === focus));
        const pick = (i) => {
          if (i < choices.length) { if (!choices[i].disabled) done(choices[i].id); }
          else if (buttons[i - choices.length]) done(buttons[i - choices.length].id);
        };
        this.openRunPanel(html, {
          onConfirm: () => pick(focus),
          onCancel: cancel ? () => done(cancel) : null,
          onMove: (dx, dy) => { focus = Math.max(0, Math.min(n - 1, focus + (dy || dx))); paint(); },
        });
        const actions = this.el.runBox.querySelector('.run-actions');
        buttons.forEach((b, i) => {
          const btn = document.createElement('button');
          btn.textContent = b.label;
          if (i === 0) btn.className = 'primary';
          btn.addEventListener('click', () => done(b.id));
          actions.appendChild(btn);
        });
        this.el.runBox.querySelectorAll('.choice').forEach((el, i) => el.addEventListener('click', () => pick(i)));
        paint();
      });
    }

    // Recrutement : le joueur choisit `slots` candidats. Renvoie leurs indices.
    // Au clavier : flèches pour se déplacer, Entrée pour prendre / laisser un candidat,
    // puis Entrée sur « En route ! ».
    // intro : ligne en plus sous la consigne (le Capitaine rappelé, par exemple)
    showRecruitment(candidates, slots, intro = '') {
      const cards = candidates.map((c, i) => {
        const cls = CLASSES[c.cls];
        const trait = TRAITS[c.trait];
        const s = c.stats;
        return `<button class="recruit" data-i="${i}">
          <span class="portrait" style="background-image:url(assets/units/${cls.sprite}_blue.png)"></span>
          <span class="recruit-info">
            <span><span class="unit-name player">${c.name}</span> <span class="unit-class">${cls.name}</span>
              ${weaponIcon(WEAPONS[cls.weapon])}</span>
            <span class="trait">${trait ? `${trait.name} : ${trait.desc}` : '—'}</span>
            <span class="recruit-stats">${c.level > 1 ? `Niv ${c.level} · ` : ''}PV ${s.hp} · For ${s.str} · Tec ${s.skl} · Vit ${s.spd} · Déf ${s.def}</span>
          </span></button>`;
      }).join('');
      const html = `<h2>Recrutement</h2>
        <p>Choisissez ${slots} soldats pour cette run.</p>${intro}
        <div class="recruit-grid">${cards}</div>
        <div class="run-actions"><button class="primary" id="recruit-go"></button></div>`;

      return new Promise((resolve) => {
        const chosen = [];
        let focus = 0;
        const n = candidates.length;
        const go = () => {
          if (chosen.length !== slots) return;
          this.closeRunPanel();
          resolve([...chosen]);
        };
        const toggle = (i) => {
          const k = chosen.indexOf(i);
          if (k >= 0) chosen.splice(k, 1);
          else if (chosen.length < slots) chosen.push(i);
          paint();
        };
        const paint = () => {
          this.el.runBox.querySelectorAll('.recruit').forEach((el, i) => {
            el.classList.toggle('chosen', chosen.includes(i));
            el.classList.toggle('focus', i === focus);
          });
          const btn = this.el.runBox.querySelector('#recruit-go');
          btn.disabled = chosen.length !== slots;
          btn.textContent = `En route ! (${chosen.length}/${slots})`;
          btn.classList.toggle('focus', focus === n);
        };
        this.openRunPanel(html, {
          onConfirm: () => (focus === n ? go() : toggle(focus)),
          onMove: (dx, dy) => {
            // grille de 2 colonnes, puis le bouton « En route ! » (index n)
            const cols = getComputedStyle(this.el.runBox.querySelector('.recruit-grid'))
              .gridTemplateColumns.split(' ').length;
            const step = dy ? dy * cols : dx;
            focus = Math.max(0, Math.min(n, focus + step));
            paint();
          },
        });
        this.el.runBox.querySelectorAll('.recruit').forEach((el, i) => {
          el.addEventListener('click', () => { focus = i; toggle(i); });
        });
        this.el.runBox.querySelector('#recruit-go').addEventListener('click', go);
        paint();
      });
    }

    setEndTurnEnabled(on) { this.el.endTurn.disabled = !on; }

    setSeed(seed) {
      this.el.seed.textContent = `Graine ${seed}`;
      this.el.endSeed.textContent = seed;
    }

    banner(text, type) {
      const b = this.el.banner;
      // Deux bandeaux peuvent s'enchaîner sans pause (phase ennemie où personne ne bouge,
      // nom de la rencontre puis « Tour 1 ») : on force l'état caché avant de réafficher,
      // sinon l'animation CSS ne repart pas et le second bandeau reste invisible.
      b.className = 'hidden';
      void b.offsetWidth;
      b.textContent = text;
      b.className = type === 'enemy' ? 'enemy' : '';
      return new Promise((r) => setTimeout(() => { b.classList.add('hidden'); r(); }, 1200));
    }

    // ------------------------------------------------------------ unité
    showUnit(u, side) {
      const w = u.weapon;
      const title = u.title ? ` <span class="unit-class">${u.title}</span>` : '';
      this.el.unit.innerHTML = `
        <div class="unit-name ${u.team}">${u.name}${title}</div>
        <div class="row"><span class="unit-class">${u.className}${u.boss ? ' · Général' : ''}${u.traitName ? ` · <span class="trait">${u.traitName}</span>` : ''}</span><span>Niv ${u.level}</span></div>
        <div class="row"><span>PV ${u.hp} / ${u.maxHp}</span>${u.team === 'player' ? `<span class="unit-class">EXP ${u.level >= MAX_LEVEL ? '--' : u.exp}</span>` : ''}</div>
        <div class="bar"><div style="width:${(100 * u.hp) / u.maxHp}%"></div></div>
        ${u.team === 'player' ? `<div class="bar exp" style="height:3px"><div style="width:${u.exp}%"></div></div>` : ''}
        <div class="stats">
          <span><b>${w.magic ? 'Mag' : 'For'}</b> ${w.magic ? u.mag : u.str}</span>
          <span><b>Tec</b> ${u.skl}</span>
          <span><b>Vit</b> ${u.spd}</span>
          <span><b>Chc</b> ${u.lck}</span>
          <span><b>Déf</b> ${u.def}</span>
          <span><b>Rés</b> ${u.res}</span>
          <span><b>Dép</b> ${u.mov}</span>
        </div>
        <div class="weapon">${weaponIcon(w)} ${w.name} · Pui ${w.mt} · Pré ${w.hit} · Portée ${w.min === w.max ? w.min : `${w.min}-${w.max}`}</div>
        ${effectiveText(w) ? `<div class="tri-line eff-line">✦ ${effectiveText(w)} (Pui ×3)</div>` : ''}
        ${triangleHtml(w)}`;
      this.el.unit.classList.toggle('right', side === 'right');
      this.el.unit.classList.toggle('enemy', u.team === 'enemy'); // fenêtre rouge, comme sur GBA
      this.el.unit.classList.remove('hidden');
    }
    hideUnit() { this.el.unit.classList.add('hidden'); }

    showTerrain(t, side) {
      this.el.terrain.innerHTML = `<b>${t.name}</b><br><span class="unit-class">Déf ${t.def} · Esq ${t.avo}${t.heal ? ' · Soin' : ''}</span>`;
      this.el.terrain.classList.toggle('right', side === 'right');
      this.el.terrain.classList.remove('hidden');
    }

    // ------------------------------------------------------------ menu
    weaponIconHtml(w) { return weaponIcon(w); }
    itemIconHtml(id) { return ITEMS[id]?.icon ? iconHtml('items', ITEMS[id].icon) : ''; }
    showMenu(items, unit, cb) {
      this.menuItems = items;
      this.menuIndex = 0;
      this.menuCb = cb;
      const m = this.el.menu;
      m.innerHTML = '';
      items.forEach((it, i) => {
        // it : { id, label, icon (HTML, facultatif), detail (texte à droite, facultatif) }
        const b = document.createElement('button');
        b.innerHTML = `${it.icon ?? ''}<span>${it.label}</span>${it.detail ? `<span class="det">${it.detail}</span>` : ''}`;
        b.addEventListener('click', (e) => { e.stopPropagation(); cb(it.id); });
        b.addEventListener('mouseenter', () => { this.menuIndex = i; this.paintMenu(); });
        m.appendChild(b);
      });
      this.paintMenu();
      m.classList.remove('hidden');
      // Téléphone en portrait : gros boutons sous la carte, à la place de la fiche d'unité
      const docked = matchMedia('(max-aspect-ratio: 1/1)').matches;
      m.classList.toggle('docked', docked);
      if (docked) {
        if (m.parentNode !== this.el.hud) this.el.hud.prepend(m);
        m.style.left = m.style.top = '';
        return;
      }
      if (m.parentNode !== this.el.stage) this.el.stage.appendChild(m);
      // placement à côté de l'unité
      const { x, y, stageW } = this.tileToScreen(unit.x, unit.y);
      const mw = m.offsetWidth;
      const left = x + mw + 60 > stageW ? x - mw - 8 : x + 56;
      m.style.left = `${Math.max(4, left)}px`;
      m.style.top = `${Math.max(4, y - 10)}px`;
    }
    paintMenu() {
      [...this.el.menu.children].forEach((b, i) => b.classList.toggle('active', i === this.menuIndex));
    }
    menuMove(d) {
      if (!this.menuItems.length) return;
      this.menuIndex = (this.menuIndex + (d > 0 ? 1 : -1) + this.menuItems.length) % this.menuItems.length;
      this.paintMenu();
    }
    menuConfirm() { this.menuCb?.(this.menuItems[this.menuIndex].id); }
    hideMenu() { this.el.menu.classList.add('hidden'); this.menuItems = []; }

    // ------------------------------------------------------------ prévisions
    // onAttack : bouton « Attaquer » (même effet que toucher de nouveau la cible)
    showForecast(att, def, fc, side, onAttack = null) {
      const fmt = (s) => (s ? `${s.dmg}${s.count === 2 ? ' ×2' : ''}` : '–');
      const tri = (s) => (!s || !s.tri ? '' : s.tri > 0 ? ' <span class="fc-adv">▲</span>' : ' <span class="fc-dis">▼</span>');
      const sim = simulateAllHits(att, def, fc);
      // Rappel explicite du triangle quand il joue (vu du côté de l'attaquant)
      const ta = att.weapon.type, td = def.weapon.type;
      const triLine = fc.a.tri > 0
        ? `<div class="fc-tri adv">▲ ${typeHtml(ta)} bat ${typeHtml(td)} : +15 précision, +1 dégât</div>`
        : fc.a.tri < 0
          ? `<div class="fc-tri dis">▼ ${typeHtml(ta)} craint ${typeHtml(td)} : −15 précision, −1 dégât</div>`
          : '';
      // Armes efficaces : Puissance ×3 (pour l'attaquant comme pour la riposte)
      const effLine = (side, u, foe) => (side?.effective
        ? `<div class="fc-tri eff">✦ ${weaponIcon(u.weapon)} ${u.weapon.name} efficace contre ${foe.name} : Pui ×3</div>` : '');
      const eff = effLine(fc.a, att, def) + effLine(fc.d, def, att);
      // Aura d'un Capitaine adjacent (précision de l'attaquant ; l'esquive est déjà comptée)
      const aura = fc.a.aura ? '<div class="fc-tri adv">Aura du Capitaine : +10 précision et esquive</div>' : '';
      this.el.forecast.innerHTML = `
        <div class="fc-grid">
          <div class="fc-head p">${att.name}${tri(fc.a)}</div><div></div><div class="fc-head e">${def.name}${tri(fc.d)}</div>
          <div class="p">${weaponIcon(att.weapon)} ${att.weapon.name}</div><div></div><div class="e">${weaponIcon(def.weapon)} ${def.weapon.name}</div>
          <div>${att.hp} → ${sim.att}</div><div class="lbl">PV</div><div>${def.hp} → ${sim.def}</div>
          <div>${fmt(fc.a)}</div><div class="lbl">Dégâts</div><div>${fmt(fc.d)}</div>
          <div>${fc.a.hit}%</div><div class="lbl">Précision</div><div>${fc.d ? fc.d.hit + '%' : '–'}</div>
          <div>${fc.a.crit}%</div><div class="lbl">Critique</div><div>${fc.d ? fc.d.crit + '%' : '–'}</div>
        </div>
        ${triLine}${eff}${aura}
        <div class="fc-note">PV si tous les coups touchent</div>
        ${onAttack ? '<button class="fc-go">Attaquer</button>' : ''}`;
      this.el.forecast.querySelector('.fc-go')?.addEventListener('click', (e) => { e.stopPropagation(); onAttack(); });
      this.el.forecast.classList.toggle('left', side === 'left');
      this.el.forecast.classList.remove('hidden');
    }
    hideForecast() { this.el.forecast.classList.add('hidden'); }

    // ------------------------------------------------------------ expérience
    showExp(unit, from, to, amount) {
      const p = this.el.exp;
      p.innerHTML = `<div class="row"><b>${unit.name}</b><span style="color:var(--exp)">+${amount} EXP</span></div>
        <div class="bar exp"><div style="width:${from}%"></div></div>`;
      p.classList.remove('hidden');
      const fill = p.querySelector('.bar > div');
      void fill.offsetWidth;
      fill.style.width = `${to}%`;
      return new Promise((r) => setTimeout(() => { p.classList.add('hidden'); r(); }, 1000));
    }

    showLevelUp(unit, { before, gains, healed = 0 }) {
      const stats = STAT_KEYS
        .filter((k) => k !== 'mag' || unit.growths.mag > 10 || unit.mag > 0)
        .filter((k) => k !== 'str' || unit.growths.str > 10 || unit.str > 0);
      let delay = 0.25;
      const cells = stats.map((k) => {
        const up = gains[k];
        const plus = up ? `<span class="plus" style="animation-delay:${(delay += 0.18).toFixed(2)}s">+1</span>` : '<span></span>';
        return `<div class="stat"><span><b>${STAT_LABELS[k]}</b> <span class="${up ? 'up' : ''}">${before[k] + (up ? 1 : 0)}</span></span>${plus}</div>`;
      }).join('');
      this.el.levelupBox.innerHTML = `
        <h2>Niveau supérieur !</h2>
        <div><b class="unit-name player">${unit.name}</b> <span class="unit-class">${unit.className}</span></div>
        <div>Niv ${unit.level - 1} → <b>${unit.level}</b></div>
        <div class="lu-grid">${cells}</div>
        ${healed > 0 ? `<div class="fc-adv">PV entièrement restaurés (+${healed})</div>` : ''}
        <div class="fc-note">Touchez pour continuer</div>`;
      this.el.levelup.classList.remove('hidden');
      return new Promise((r) => { this.levelupResolve = r; });
    }

    closeLevelUp() {
      if (!this.levelupResolve) return;
      this.el.levelup.classList.add('hidden');
      const r = this.levelupResolve;
      this.levelupResolve = null;
      r();
    }

    // ------------------------------------------------------------ fin
    showEnd(win, text, title = win ? 'Victoire !' : 'Défaite…') {
      this.hideAll();
      this.hideRunPanels();
      this.el.endTitle.textContent = title;
      this.el.endTitle.style.color = win ? '#ffe28a' : '#ff8a8a';
      this.el.endText.textContent = text;
      this.el.end.classList.remove('hidden');
      this.setEndTurnEnabled(false);
    }
    hideEnd() { this.el.end.classList.add('hidden'); }
  }

  Object.assign(Resistance, { iconHtml, effectiveText, armyHtml, UI });
})();

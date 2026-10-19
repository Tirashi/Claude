/* ---------- sauvegarde (préfixe calculator.) ---------- */
const load = (k, d) => { try { const v = localStorage.getItem('calculator.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const save = (k, v) => { try { localStorage.setItem('calculator.' + k, JSON.stringify(v)); } catch (e) {} };
const $ = id => document.getElementById(id);

/* ---------- réglages ---------- */
const OPS = ['+', '-', 'x', '/'];
const SYM = { '+': '+', '-': '−', 'x': '×', '/': '÷' };
const CAT = { '+': 'add', '-': 'sub', 'x': 'mul', '/': 'div' };
const LEVELS = [['Petit écolier', '7 + 2'], ['Écolier', '8 × 7'], ['Collège', '45 + 27'], ['Costaud', '34 × 12'], ['Champion', '−8 × 15']];
const MODES = [['serie', 'Série 20', 'Série de 20'], ['chrono', '60 s', 'Contre la montre'], ['jour', 'Du jour', 'Calcul du jour']];
const STYLES = [['A', 'Arcade'], ['B', 'Cahier'], ['C', 'Calculatrice']];
const SERIE = 20, CHRONO_MS = 60000, PENALTY = 5000;
// étoiles en contre la montre : bonnes réponses pour 1, 2, 3 étoiles, par niveau
const CHRONO_STARS = { 1: [8, 14, 20], 2: [8, 14, 20], 3: [5, 9, 13], 4: [3, 6, 9], 5: [4, 7, 10] };
const cfg = Object.assign({ ops: '+-x', lvl: 2, mode: 'serie', style: 'A', son: true }, load('cfg', {}));
if (!/^[-+x/]{1,4}$/.test(cfg.ops)) cfg.ops = '+-x';
const catOf = ops => ops.length > 1 ? 'mix' : CAT[ops];
const dayNum = (d = new Date()) => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

/* ---------- les calculs ---------- */
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// un calcul d'opération op au niveau L ; les divisions tombent toujours juste, pas de négatif avant le niveau 5
function gen(op, L, r = Math.random) {
  const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
  const nz = (a, b) => { let v; do v = ri(a, b); while (v === 0 || v === 1 || v === -1); return v; };
  let a, b;
  if (L === 5) {
    if (op === '+' || op === '-') { a = nz(-99, 99); b = nz(-99, 99); if (a > 0 && b > 0) b = -b; }
    else if (op === 'x') { a = nz(-20, 20); b = ri(2, 15) * (r() < .5 ? -1 : 1); if (a > 0 && b > 0) a = -a; }
    else { b = ri(2, 12) * (r() < .5 ? -1 : 1); const q = ri(2, 20) * (r() < .5 ? -1 : 1); a = b * q; }
  } else if (op === '+') {
    if (L === 1) { a = ri(1, 9); b = ri(0, 10 - a); }
    else if (L === 2) { a = ri(2, 18); b = ri(1, 20 - a); }
    else if (L === 3) { a = ri(10, 99); b = ri(10, 99); }
    else { a = ri(100, 499); b = ri(100, 499); }
  } else if (op === '-') {
    if (L === 1) { a = ri(1, 10); b = ri(0, a); }
    else if (L === 2) { a = ri(5, 20); b = ri(1, a); }
    else if (L === 3) { a = ri(20, 99); b = ri(10, a); }
    else { a = ri(200, 999); b = ri(100, a); }
  } else if (op === 'x') {
    if (L === 1) { a = ri(1, 5); b = ri(1, 10); }
    else if (L === 2) { a = ri(2, 10); b = ri(2, 10); }
    else if (L === 3) { a = ri(11, 50); b = ri(2, 9); }
    else { a = ri(11, 25); b = ri(11, 19); }
    if (r() < .5) [a, b] = [b, a];
  } else {
    let q;
    if (L === 1) { b = ri(1, 5); q = ri(1, 10); }
    else if (L === 2) { b = ri(2, 10); q = ri(1, 10); }
    else if (L === 3) { b = ri(2, 9); q = ri(Math.ceil(10 / b), Math.floor(99 / b)); }
    else { b = ri(2, 15); q = ri(Math.ceil(100 / b), Math.min(99, Math.floor(999 / b))); }
    a = b * q;
  }
  const res = op === '+' ? a + b : op === '-' ? a - b : op === 'x' ? a * b : a / b;
  return { a, b, op, res, L };
}
// le calcul du jour : les mêmes 20 calculs pour toute la famille, du niveau 1 au niveau 4 (5 de chaque), les 4 opérations
function dailySeries(day = dayNum()) {
  const r = rng(day * 7919 + 13), out = [];
  for (let blk = 0; blk < 4; blk++) {
    const ops = OPS.slice();
    for (let i = ops.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ops[i], ops[j]] = [ops[j], ops[i]]; }
    ops.push(OPS[Math.floor(r() * 4)]);
    for (const op of ops) out.push(gen(op, blk + 1, r));
  }
  return out;
}
const neg = n => n < 0 ? '−' + (-n) : String(n);
const qText = c => `${neg(c.a)} ${SYM[c.op]} ${c.b < 0 ? '(' + neg(c.b) + ')' : c.b}`;

/* ---------- textes selon le style ---------- */
// arcade : majuscules sans accent (Press Start 2P n'a pas de majuscules accentuées)
const deacc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
const TXT = {
  ops: { A: 'Opérations', B: 'Je choisis mes calculs', C: 'Opérations' },
  lvl: { A: 'Niveau', B: 'Mon niveau', C: 'Niveau' },
  mode: { A: 'Mode', B: 'Mon exercice', C: 'Mode' },
  style: { A: 'Style', B: 'Mon style', C: 'Style' },
  go: { A: 'Jouer', B: "C'est parti !", C: 'On · jouer' },
  again: { A: 'Rejouer', B: 'Encore !', C: 'Rejouer' },
  back: { A: 'Menu', B: 'Menu', C: 'Menu' },
  rk: { A: 'Classement', B: 'Le classement de la famille', C: 'Classement' },
  lu: { A: '◀ Ludothèque', B: '◀ Ludothèque', C: '◀ Ludothèque' },
};
const t = (k, s = cfg.style) => { const v = TXT[k] ? TXT[k][s] : k; return s === 'A' ? deacc(v) : v; };
const tx = s => cfg.style === 'A' ? deacc(s) : s;

/* ---------- chiffres à 7 segments (style C) ---------- */
const SEGS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg', '-': 'g', '?': 'abge', '_': 'd', ' ': '' };
const GEO = { a: [3, 0, 14, 3], b: [17, 3, 3, 14], c: [17, 19, 3, 14], d: [3, 33, 14, 3], e: [0, 19, 3, 14], f: [0, 3, 3, 14], g: [3, 16.5, 14, 3] };
function seg(txt, h) {
  const w = h * 20 / 36;
  return [...String(txt)].map(ch => {
    if (ch === ':' || ch === '.') return `<span class="opsym">${ch}</span>`;
    const on = SEGS[ch] ?? '';
    return `<svg class="seg" width="${w}" height="${h}" viewBox="-1 -1 22 38">` + Object.entries(GEO).map(([k, [x, y, rw, rh]]) =>
      `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="1.2" fill="${on.includes(k) ? 'var(--c-lcd-ink)' : 'var(--c-ghost)'}"/>`).join('') + '</svg>';
  }).join('');
}
const segNum = (n, h) => seg(String(n).replace('−', '-'), h);
const segCalc = c => segNum(c.a, 30) + `<span class="opsym">${SYM[c.op]}</span>` + (c.b < 0 ? `<span class="opsym">(</span>${segNum(c.b, 30)}<span class="opsym">)</span>` : segNum(c.b, 30)) + '<span class="opsym">=</span>';

/* ---------- temps ---------- */
const fmtT = ms => { const s = Math.floor(ms / 1000), d = Math.floor(ms % 1000 / 100); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.${d}`; };
const fmtS = ms => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

/* ---------- sons (bips synthétisés) ---------- */
let AC = null;
function beep(f, d, type = 'square', vol = .06, f2) {
  if (!cfg.son) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t0 = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.linearRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
    o.connect(g).connect(AC.destination); o.start(t0); o.stop(t0 + d);
  } catch (e) {}
}
const SFX = {
  key: () => beep(cfg.style === 'C' ? 2400 : 900, .03, cfg.style === 'B' ? 'triangle' : 'square', .025),
  ok: () => { beep(660, .08, 'square', .05); setTimeout(() => beep(990, .12, 'square', .05), 70); },
  ko: () => beep(200, .3, 'sawtooth', .05, 120),
  end: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, .14, 'square', .05), i * 110)),
};

/* ---------- records ---------- */
const best = load('best', {});      // serie:L:cat (ms, plus bas = mieux), chrono:L:cat (bonnes réponses)
const daily = load('daily', {});    // AAAAMMJJ : temps de la tentative classée du jour
function recLine() {
  if (cfg.mode === 'jour') {
    const d = daily[dayNum()];
    return d ? tx('Aujourd\'hui : ' + fmtT(d)) : load('dailyTry', 0) === dayNum() ? tx('Calcul du jour commencé') : tx('Pas encore joué aujourd\'hui');
  }
  const v = best[`${cfg.mode}:${cfg.lvl}:${catOf(cfg.ops)}`];
  if (!v) return tx('Pas encore de record');
  return tx('Record : ') + (cfg.mode === 'serie' ? fmtT(v) : v + tx(' bonnes'));
}

/* ---------- menu ---------- */
function setStyle(s) {
  cfg.style = s; $('app').dataset.style = s;
  const m = document.querySelector('meta[name=theme-color]');   // absente de l'artefact
  if (m) m.content = s === 'A' ? '#10122b' : s === 'B' ? '#fbf8f0' : '#2b2d31';
}
function renderMenu() {
  const s = cfg.style;
  $('logo').textContent = s === 'A' ? 'CALCULATOR' : 'Calculator';
  $('date').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  $('rec').textContent = recLine();
  document.querySelectorAll('[data-t]').forEach(h => h.textContent = t(h.dataset.t));
  $('ops').innerHTML = OPS.map(o => `<button class="op${cfg.ops.includes(o) ? ' on' : ''}" data-op="${o}">${SYM[o]}</button>`).join('');
  $('lvl').innerHTML = LEVELS.map(([n, ex], i) => `<button class="${cfg.lvl === i + 1 ? 'on' : ''}" data-l="${i + 1}"><span>${s === 'B' ? n : tx((i + 1) + ' ' + n)}</span><span>${ex}</span></button>`).join('');
  $('modes').innerHTML = MODES.map(([k, short, long]) => `<button class="${cfg.mode === k ? 'on' : ''}" data-m="${k}">${s === 'B' ? long : tx(short)}</button>`).join('');
  $('styles').innerHTML = STYLES.map(([k, n]) => `<button class="${s === k ? 'on' : ''}" data-s="${k}">${tx(n)}</button>`).join('');
  const jour = cfg.mode === 'jour';
  $('boxOps').classList.toggle('dim', jour); $('boxLvl').classList.toggle('dim', jour);
  $('note').textContent = jour ? tx('20 calculs, du plus facile au plus dur, les 4 opérations. ' + (load('dailyTry', 0) === dayNum() ? 'Déjà joué : hors classement.' : 'Une seule tentative classée par jour.'))
    : cfg.mode === 'chrono' ? tx('Le plus de bonnes réponses en 60 secondes.') : tx('20 calculs chronométrés, 5 secondes de plus par erreur.');
  $('go').textContent = t('go'); $('rk').textContent = t('rk'); $('lu').textContent = t('lu');
  $('snd').textContent = tx(cfg.son ? 'Son : oui' : 'Son : non');
}
$('menu').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.op) { const o = b.dataset.op; let ops = cfg.ops.includes(o) ? cfg.ops.replace(o, '') : cfg.ops + o; if (!ops) return; cfg.ops = OPS.filter(x => ops.includes(x)).join(''); }
  else if (b.dataset.l) cfg.lvl = +b.dataset.l;
  else if (b.dataset.m) cfg.mode = b.dataset.m;
  else if (b.dataset.s) setStyle(b.dataset.s);
  else if (b.id === 'snd') cfg.son = !cfg.son;
  else if (b.id === 'go') return start();
  else return;
  save('cfg', cfg); SFX.key(); renderMenu();
});

/* ---------- partie ---------- */
let S = null;
function show(id) { for (const k of ['menu', 'play', 'end']) $(k).hidden = k !== id; }
function start() {
  const mode = cfg.mode, today = dayNum();
  S = { mode, lvl: cfg.lvl, ops: cfg.ops, cat: catOf(cfg.ops), i: 0, good: 0, bad: 0, misses: [], val: '', busy: false, t0: performance.now(), over: false };
  if (mode === 'jour') { S.list = dailySeries(today); S.day = today; S.ranked = load('dailyTry', 0) !== today; save('dailyTry', today); S.ops = '+-x/'; S.cat = 'mix'; }
  // la touche ± ne sert qu'au niveau Champion (résultats négatifs)
  const pm = mode !== 'jour' && cfg.lvl === 5;
  $('pad').innerHTML = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '±', '0', '←', 'OK'].map(k =>
    `<button data-k="${k}" class="${k === 'OK' ? 'ok' : k === '←' ? 'del' : k === '±' ? 'pm' + (pm ? '' : ' off') : ''}">${k === 'OK' ? t('ok') : k}</button>`).join('');
  show('play'); next(); SFX.key(); loop();
}
TXT.ok = { A: 'OK', B: 'Valider', C: '=' };
function next() {
  let c;
  if (S.list) c = S.list[S.i];
  else { const ops = [...S.ops]; do c = gen(ops[Math.floor(Math.random() * ops.length)], S.lvl); while (S.cur && qText(c) === qText(S.cur)); }
  S.cur = c; S.val = ''; S.busy = false; draw();
}
function draw(mark) {
  const c = S.cur, C = cfg.style === 'C';
  $('q').innerHTML = C ? segCalc(c) : qText(c) + (cfg.style === 'B' ? ' <span class="eq">=</span>' : ' =');
  const shown = mark === 'ko' ? String(c.res) : S.val;
  $('ans').innerHTML = C ? (shown ? segNum(shown.replace('−', '-'), 46) : `<span class="cur">${seg('_', 46)}</span>`) : (shown.replace('-', '−') || (cfg.style === 'A' ? '_' : '&nbsp;'));
  $('ans').className = 'ans' + (mark ? ' ' + mark : '');
  $('msg').className = 'msg' + (mark ? ' ' + mark : '');
  $('msg').textContent = mark === 'ok' ? tx(['Bravo !', 'Bien joué !', 'Juste !', 'Super !'][S.good % 4]) : mark === 'ko' ? tx("C'était " + neg(c.res)) : '';
  hud();
}
function hud() {
  const now = performance.now(), el = now - S.t0;
  if (S.mode === 'chrono') {
    const left = Math.max(0, CHRONO_MS - el);
    $('hl').textContent = tx('Bonnes : ') + S.good; $('hr').textContent = '⏱ ' + fmtS(left);
    $('barI').style.width = (left / CHRONO_MS * 100) + '%';
  } else {
    $('hl').textContent = tx(cfg.style === 'B' ? `calcul ${S.i + 1} sur ${SERIE}` : `Calcul ${S.i + 1}/${SERIE}`); $('hr').textContent = '⏱ ' + fmtS(el + S.bad * PENALTY).replace(/^/, '');
    $('barI').style.width = (S.i / SERIE * 100) + '%';
  }
}
function loop() {
  if (!S || S.over) return;
  hud();
  if (S.mode === 'chrono' && performance.now() - S.t0 >= CHRONO_MS) return finish();
  requestAnimationFrame(loop);
}
function press(k) {
  if (!S || S.over || S.busy) return;
  if (k === '←') S.val = S.val.slice(0, -1);
  else if (k === '±') S.val = S.val.startsWith('-') ? S.val.slice(1) : '-' + S.val;
  else if (k === 'OK') { if (S.val && S.val !== '-') answer(+S.val); return; }
  else if (/^\d$/.test(k) && S.val.replace('-', '').length < 5) S.val = S.val === '0' ? k : S.val === '-0' ? '-' + k : S.val + k;
  SFX.key();
  // juste : validé tout de suite, sans toucher OK
  if (S.val && S.val !== '-' && +S.val === S.cur.res) return answer(+S.val);
  draw();
}
function answer(v) {
  const c = S.cur, ok = v === c.res;
  S.busy = true;
  if (ok) { S.good++; SFX.ok(); }
  else { S.bad++; S.misses.push({ q: qText(c), given: v, res: c.res }); SFX.ko(); }
  draw(ok ? 'ok' : 'ko');
  const a = $('ans'); a.classList.remove('pop', 'shake'); void a.offsetWidth; a.classList.add(ok ? 'pop' : 'shake');
  setTimeout(() => { if (!S || S.over) return; S.i++; if (S.mode !== 'chrono' && S.i >= SERIE) finish(); else next(); }, ok ? 280 : 1200);
}
$('pad').addEventListener('click', e => { const b = e.target.closest('button'); if (b) press(b.dataset.k); });
document.addEventListener('keydown', e => {
  if ($('play').hidden) return;
  if (/^\d$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') press('←'); else if (e.key === 'Enter') press('OK'); else if (e.key === '-' && !$('play').querySelector('.pm.off')) press('±');
});
$('quit').addEventListener('click', () => { if (!S) return; S.over = true; SFX.key(); renderMenu(); show('menu'); });

/* ---------- fin de partie ---------- */
function finish() {
  S.over = true;
  const el = performance.now() - S.t0, today = dayNum();
  let score, key, isRec = false, stars;
  if (S.mode === 'chrono') {
    score = S.good; key = `chrono:${S.lvl}:${S.cat}`;
    if (score > 0 && !(best[key] >= score)) { best[key] = score; isRec = true; }
    stars = CHRONO_STARS[S.lvl].filter(n => score >= n).length;
  } else {
    score = Math.round(el + S.bad * PENALTY);
    stars = S.bad === 0 ? 3 : S.bad <= 2 ? 2 : S.bad <= 5 ? 1 : 0;
    if (S.mode === 'serie') { key = `serie:${S.lvl}:${S.cat}`; if (!(best[key] <= score)) { best[key] = score; isRec = true; } }
    else if (S.ranked) { daily[today] = score; save('daily', daily); }
  }
  save('best', best); save('parties', load('parties', 0) + 1);
  if (window.LudoScores) {
    const rank = r => { if (r) $('erank') && ($('erank').textContent = tx('Classement : ' + LudoScores.rankText(r))); };
    if (key && score > 0) LudoScores.submit('calculator', key, score, S.mode !== 'chrono').then(rank).catch(() => {});
    if (S.mode === 'jour' && S.ranked) LudoScores.submit('calculator', 'daily:' + today, score, true).then(rank).catch(() => {});
  }
  // l'écran de fin
  const C = cfg.style === 'C';
  $('et').textContent = tx(['Courage !', 'Pas mal !', 'Bravo !', 'Parfait !'][stars]);
  $('es').innerHTML = '★'.repeat(stars).split('').map(s => `<span>${s}</span>`).join('') + '★'.repeat(3 - stars).split('').map(s => `<span class="off">${s}</span>`).join('');
  const bigTxt = S.mode === 'chrono' ? String(score) : fmtT(score);
  $('eb').innerHTML = C ? seg(S.mode === 'chrono' ? String(score) : bigTxt.replace(/\.\d$/, ''), 44) : S.mode === 'chrono' ? score + tx(score > 1 ? ' bonnes' : ' bonne') : cfg.style === 'B' ? bigTxt.replace(/\.\d$/, '') : bigTxt;
  const rows = [];
  if (C) rows.push([`${MODES.find(m => m[0] === S.mode)[1].toUpperCase()} · ${S.mode === 'jour' ? 'DU ' + String(today).slice(6) + '/' + String(today).slice(4, 6) : 'NIV ' + S.lvl}`, S.mode === 'chrono' ? '' : fmtT(score)]);
  if (S.mode === 'chrono') rows.push([tx('Bonnes réponses'), S.good], [tx('Erreurs'), S.bad]);
  else rows.push([tx('Bonnes réponses'), `${S.good}/${SERIE}`], [tx('Pénalité'), S.bad ? `+${S.bad * PENALTY / 1000} s` : '0 s']);
  const recV = S.mode === 'jour' ? null : best[key];
  if (S.mode === 'jour') rows.push([tx(S.ranked ? 'Calcul du jour' : 'Hors classement'), S.ranked ? tx('classé') : tx('déjà joué')]);
  else rows.push([tx(isRec ? 'Nouveau record !' : 'Record'), S.mode === 'chrono' ? recV : fmtT(recV), 'rec']);
  $('er').innerHTML = rows.map(([a, b, cl]) => `<div class="${cl || ''}"><span>${a}</span><span>${b}</span></div>`).join('') + `<div class="rec" id="erank"></div>`;
  const miss = S.misses.slice(0, 6);
  $('em').innerHTML = miss.length ? (C ? '' : `<div><span>${tx(cfg.style === 'B' ? 'Je corrige :' : 'À revoir')}</span></div>`) + miss.map(m =>
    cfg.style === 'B' ? `<div><span>${m.q} = <s>${neg(m.given)}</s> <b>${neg(m.res)}</b></span></div>`
    : C ? `<div><span>${m.q} = ${neg(m.given)} ✗</span><span>${neg(m.res)}</span></div>`
    : `<div><span>${m.q} = <b>${neg(m.res)}</b></span><span>(${neg(m.given)})</span></div>`).join('') + (S.misses.length > 6 ? `<div><span>…</span></div>` : '') : '';
  $('again').textContent = t('again'); $('back').textContent = t('back');
  show('end'); SFX.end();
}
$('again').addEventListener('click', () => { SFX.key(); start(); });
$('back').addEventListener('click', () => { SFX.key(); renderMenu(); show('menu'); });

/* ---------- au démarrage ---------- */
setStyle(cfg.style); renderMenu();
// le bouton ◀ MENU de l'appli s'ajoute en haut de la page : il garde sa hauteur, le jeu prend le reste
window.addEventListener('resize', () => { const f = document.body.firstElementChild; if (f && f.id !== 'app') { f.style.flex = 'none'; document.body.style.flexWrap = 'nowrap'; } });
window.Calculator = { gen, dailySeries, start, press, answer, finish, cfg, best, daily, get S() { return S; }, renderMenu, setStyle, catOf };

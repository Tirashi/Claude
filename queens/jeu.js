(() => {
"use strict";

/* ---------- 16-bit palette for regions ---------- */
const COLORS = ["#ef7a5f","#ffcf4a","#86d16c","#5fb0ea","#b98ae0","#f59ac4","#8fe0d4","#d9a46e","#c9c6e4","#ff9f43"];
const SIZES = [{n:5,l:"5×5"},{n:6,l:"6×6"},{n:7,l:"7×7"},{n:8,l:"8×8"},{n:9,l:"9×9"}];

/* ---------- pixel sprites ---------- */
const CROWN = [
  ".o...o...o.",
  "oho.oho.oho",
  "oyo.oyo.oyo",
  "oyyoyyyoyyo",
  "ohyyyyyyyyo",
  "oyryyryyryo",
  "oyyyyyyyyyo",
  "odddddddddo",
  "ooooooooooo"];
const CROSS = [
  "oo...oo",
  "ooo.ooo",
  ".ooooo.",
  "..ooo..",
  ".ooooo.",
  "ooo.ooo",
  "oo...oo"];
const PAL = {o:"#1a0f2e", y:"#ffd23f", h:"#fff6c2", d:"#d98a1c", r:"#e8264d"};
function sprite(map, pal, cls){
  const h = map.length, w = map[0].length;
  let s = `<svg class="${cls||""}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" aria-hidden="true">`;
  map.forEach((row,y) => [...row].forEach((ch,x) => {
    if (pal[ch]) s += `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[ch]}"/>`;
  }));
  return s + "</svg>";
}
const SVG_Q = sprite(CROWN, PAL, "q");
const SVG_X = sprite(CROSS, {o:"rgba(26,15,46,.78)"}, "x");
const SVG_XA = sprite(CROSS, {o:"rgba(26,15,46,.78)"}, "xa");
document.getElementById("logoCrown").innerHTML = SVG_Q;
document.getElementById("winCrown").innerHTML = SVG_Q.replace('class="q"','style="width:64px"');

/* ---------- seeded RNG ---------- */
function mulberry32(a){ return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function shuffle(arr, rnd){ for (let i = arr.length - 1; i > 0; i--){ const j = Math.floor(rnd()*(i+1)); [arr[i],arr[j]] = [arr[j],arr[i]]; } return arr; }

/* ---------- solver: counts up to `limit` solutions ---------- */
function solve(reg, N, limit){
  const sols = [], cols = new Array(N), usedC = new Array(N).fill(false), usedR = new Array(N).fill(false);
  (function rec(r){
    if (r === N){ sols.push(cols.slice()); return sols.length >= limit; }
    for (let c = 0; c < N; c++){
      const g = reg[r*N+c];
      if (usedC[c] || usedR[g] || (r > 0 && Math.abs(cols[r-1]-c) <= 1)) continue;
      usedC[c] = usedR[g] = true; cols[r] = c;
      if (rec(r+1)) return true;
      usedC[c] = usedR[g] = false;
    }
    return false;
  })(0);
  return sols;
}

/* ---------- generator: unique-solution puzzle ---------- */
function neighbors4(i, N){ const r = Math.floor(i/N), c = i%N, out = [];
  if (r>0) out.push(i-N); if (r<N-1) out.push(i+N); if (c>0) out.push(i-1); if (c<N-1) out.push(i+1); return out; }

function randomQueens(N, rnd){
  const cols = [], used = new Array(N).fill(false);
  (function rec(r){
    if (r === N) return true;
    for (const c of shuffle([...Array(N).keys()], rnd)){
      if (used[c] || (r>0 && Math.abs(cols[r-1]-c) <= 1)) continue;
      used[c] = true; cols[r] = c;
      if (rec(r+1)) return true;
      used[c] = false;
    }
    return false;
  })(0);
  return cols;
}

function connectedWithout(reg, N, g, removed, seed){
  const seen = new Set([seed]), stack = [seed]; let size = 0;
  for (let i = 0; i < N*N; i++) if (reg[i] === g && i !== removed) size++;
  while (stack.length){ const i = stack.pop();
    for (const j of neighbors4(i,N)) if (j !== removed && reg[j] === g && !seen.has(j)){ seen.add(j); stack.push(j); } }
  return seen.size === size;
}

function generate(N, seed){
  const rnd = mulberry32(seed);
  for (let attempt = 0; attempt < 60; attempt++){
    const sol = randomQueens(N, rnd);
    const qcell = sol.map((c,r) => r*N+c);
    const reg = new Array(N*N).fill(-1);
    qcell.forEach((i,g) => reg[i] = g);
    // organic growth: pick a random frontier pair each step
    let left = N*N - N;
    while (left > 0){
      const front = [];
      for (let i = 0; i < N*N; i++) if (reg[i] === -1)
        for (const j of neighbors4(i,N)) if (reg[j] !== -1) front.push([i, reg[j]]);
      const [i,g] = front[Math.floor(rnd()*front.length)];
      reg[i] = g; left--;
    }
    // repair until the planted solution is the only one
    for (let it = 0; it < 400; it++){
      const sols = solve(reg, N, 2);
      if (sols.length === 1) return {N, reg, sol, seed};
      const alt = sols.find(s => s.some((c,r) => c !== sol[r]));
      const cand = shuffle(alt.map((c,r) => r*N+c).filter(i => !qcell.includes(i)), rnd);
      let moved = false;
      for (const i of cand){
        const g = reg[i];
        const opts = shuffle([...new Set(neighbors4(i,N).map(j => reg[j]).filter(h => h !== g))], rnd);
        if (!opts.length || !connectedWithout(reg, N, g, i, qcell[g])) continue;
        reg[i] = opts[0]; moved = true; break;
      }
      if (!moved) break;
    }
  }
  return null;
}

/* ---------- sound (square-wave chip blips) ---------- */
let actx = null, soundOn = true;
function blip(notes, type="square", dur=.07, vol=.06){
  if (!soundOn) return;
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    let t = actx.currentTime;
    for (const f of notes){
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t+dur); t += dur*.9;
    }
  }catch(e){}
}
const SFX = {
  x: () => blip([660], "square", .04, .035),
  q: () => blip([523, 784], "square", .07),
  clr: () => blip([330], "triangle", .05, .08),
  bad: () => blip([140, 110], "sawtooth", .12, .05),
  win: () => blip([523,659,784,1047,784,1047,1319], "square", .11, .06),
  hint: () => blip([880, 660, 990], "triangle", .08, .09),
};

/* ---------- storage (best times) ---------- */
function loadBest(){ try{ return JSON.parse(localStorage.getItem("queens16.best") || "{}"); }catch(e){ return {}; } }
function saveBest(b){ try{ localStorage.setItem("queens16.best", JSON.stringify(b)); }catch(e){} }
function loadPref(k, d){ try{ const v = localStorage.getItem("queens16."+k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } }
function savePref(k, v){ try{ localStorage.setItem("queens16."+k, JSON.stringify(v)); }catch(e){} }

/* ---------- state ---------- */
const $ = id => document.getElementById(id);
const boardEl = $("board");
let P = null;            // puzzle
let cells = [];          // 0 empty, 1 cross, 2 queen, 3 cross placed automatically by a queen
let history = [];
let startTime = 0, elapsed = 0, won = false, hints = 0, timerId = null;
let size = loadPref("size", 7), autoX = loadPref("autoCross", true);
/* grille du jour : la même pour toute la famille (graine = date), plus grande au fil de la semaine
   (5×5 le lundi → 9×9 le week-end) ; score = temps + 30 s par indice, gardé dans queens16.daily.
   Une seule tentative classée : la partie en cours (chrono compris) est gardée dans queens16.dailyRun et reprise
   si on revient ; une fois réussie, la grille du jour se rejoue hors classement (offRank). */
let daily = false, offRank = false, dailyDone = loadPref("daily", {}) || {};
const DAY_SIZE = [9, 5, 6, 7, 7, 8, 9], DAY_NAME = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
const todayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const dailySize = () => DAY_SIZE[new Date().getDay()];
const PENALTY = (window.LudoScores && LudoScores.HINT_PENALTY) || 30000;
let cursor = 0;
soundOn = loadPref("sound", true);
let best = loadBest();

const fmt = ms => { const s = Math.floor(ms/1000); return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); };

function setMsg(html){ $("msg").innerHTML = html; }

function newGame(seed, saved){
  seed = seed ?? (Math.floor(Math.random()*9000)+1000);
  let p = generate(size, seed), s = seed;
  while (!p){ s++; p = generate(size, s); }
  P = p; P.day = seed;      // graine demandée (la date pour la grille du jour), même si le générateur a dû la décaler
  cells = saved?.cells?.length === size*size ? saved.cells.slice() : new Array(size*size).fill(0);
  history = []; won = false; hints = saved?.hints || 0;
  elapsed = saved?.elapsed || 0; startTime = performance.now() - elapsed;
  cursor = 0;
  $("overlay").hidden = true;
  boardEl.classList.remove("won");
  $("stageK").textContent = daily ? "JOUR" : "STAGE"; $("bestK").textContent = daily ? "TON SCORE" : "RECORD";
  $("stageNo").textContent = daily ? `${String(P.day % 100).padStart(2, "0")}/${String(Math.floor(P.day / 100) % 100).padStart(2, "0")}` : String(P.seed).padStart(4,"0");
  $("nextBtn").textContent = daily ? "GRILLE AU HASARD" : "STAGE SUIVANT";
  $("rankLink").href = "../classements/index.html#queens" + (daily ? "-1" : "");
  paintDaily();
  renderBest();
  build();
  render();
  setMsg(daily ? `Grille du jour : trouve les <span class="hl">${size}</span> reines.` : `Trouve les <span class="hl">${size}</span> reines.`);
  clearInterval(timerId);
  timerId = setInterval(tick, 250); tick();
}
function tick(){ if (won || document.hidden) return; elapsed = performance.now() - startTime; $("time").textContent = fmt(elapsed); }
function renderBest(){ const b = daily ? dailyDone[P ? P.day : todayKey()] : best[size]; $("best").textContent = b ? fmt(b) : "--:--"; }
function paintDaily(){
  const k = todayKey(), done = dailyDone[k], b = $("dailyBtn");
  const run = !done && dailyRun();
  b.innerHTML = `GRILLE DU JOUR · ${DAY_NAME[new Date().getDay()]} ${dailySize()}×${dailySize()}` +
    (done ? `<small>TON SCORE ${fmt(done)}<br>REJOUER : HORS CLASSEMENT</small>` : run && !(daily && !won) ? `<small>EN COURS · ${fmt(run.elapsed)} · REPRENDRE</small>` : "");
  b.setAttribute("aria-pressed", daily);
}
function dailyRun(){ const r = loadPref("dailyRun", null); return r && r.day === todayKey() ? r : null; }
function saveRun(){
  if (!daily || offRank || won || !P) return;
  savePref("dailyRun", {day: P.day, cells, hints, elapsed: Math.round(document.hidden ? elapsed : performance.now() - startTime)});
}
function startDaily(){
  const k = todayKey(); daily = true; size = dailySize(); offRank = dailyDone[k] > 0; buildSizes();
  newGame(k, offRank ? null : dailyRun());
  if (offRank) setMsg(`Grille du jour déjà réussie : <span class="hl">hors classement</span>.`);
  saveRun();
}

function build(){
  const N = P.N; boardEl.style.setProperty("--n", N); boardEl.innerHTML = "";
  for (let i = 0; i < N*N; i++){
    const r = Math.floor(i/N), c = i%N, g = P.reg[i];
    const d = document.createElement("div");
    d.className = "cell"; d.dataset.i = i; d.setAttribute("role","gridcell");
    d.style.background = COLORS[g];
    d.style.borderRightWidth = c === N-1 ? "0" : (P.reg[i+1] !== g ? "3px" : "1px");
    d.style.borderBottomWidth = r === N-1 ? "0" : (P.reg[i+N] !== g ? "3px" : "1px");
    boardEl.appendChild(d);
  }
}

function conflicts(){
  const N = P.N, bad = new Set(), badQ = new Set();
  const qs = []; cells.forEach((v,i) => { if (v === 2) qs.push(i); });
  const mark = pred => { for (let i = 0; i < N*N; i++) if (pred(i)) bad.add(i); };
  for (let a = 0; a < qs.length; a++) for (let b = a+1; b < qs.length; b++){
    const i = qs[a], j = qs[b], ri = Math.floor(i/N), ci = i%N, rj = Math.floor(j/N), cj = j%N;
    let hit = false;
    if (ri === rj){ mark(k => Math.floor(k/N) === ri); hit = true; }
    if (ci === cj){ mark(k => k%N === ci); hit = true; }
    if (P.reg[i] === P.reg[j]){ mark(k => P.reg[k] === P.reg[i]); hit = true; }
    if (!hit && Math.abs(ri-rj) <= 1 && Math.abs(ci-cj) <= 1){ bad.add(i); bad.add(j); hit = true; }
    if (hit){ badQ.add(i); badQ.add(j); }
  }
  return {bad, badQ, qs};
}

function attacked(){
  const N = P.N, att = new Set();
  cells.forEach((v,i) => { if (v !== 2) return;
    const r = Math.floor(i/N), c = i%N;
    for (let k = 0; k < N*N; k++){ const rk = Math.floor(k/N), ck = k%N;
      if (k !== i && (rk === r || ck === c || P.reg[k] === P.reg[i] || (Math.abs(rk-r) <= 1 && Math.abs(ck-c) <= 1))) att.add(k); } });
  return att;
}

function render(){
  const {bad, badQ} = conflicts();
  [...boardEl.children].forEach((d,i) => {
    const v = cells[i];
    const want = v === 2 ? "q" : v === 1 ? "x" : v === 3 ? "a" : "";
    if (d.dataset.v !== want){
      d.dataset.v = want;
      d.innerHTML = want === "q" ? SVG_Q : want === "x" ? SVG_X : want === "a" ? SVG_XA : "";
    }
    d.classList.toggle("q", v === 2);
    d.classList.toggle("bad", bad.has(i));
    d.classList.toggle("badq", badQ.has(i));
    d.classList.toggle("cur", i === cursor && document.activeElement === boardEl);
    const r = Math.floor(i/P.N)+1, c = i%P.N+1;
    d.setAttribute("aria-label", `Ligne ${r}, colonne ${c}, ${["vide","croix","reine","croix"][v]}`);
  });
  return {bad, badQ};
}

// Crosses follow the queens: every cell a queen rules out gets one, and they go away with the queen.
function syncAuto(){
  const att = autoX ? attacked() : new Set();
  cells.forEach((v,i) => {
    if (v === 3 && !att.has(i)) cells[i] = 0;
    else if (v === 0 && att.has(i)) cells[i] = 3;
  });
}

function commit(prev){
  syncAuto();
  history.push(prev);
  if (history.length > 300) history.shift();
  const {badQ, qs} = Object.assign(render(), conflicts());
  if (badQ.size){ setMsg(`<span class="hl">Conflit !</span> Deux reines se gênent.`); }
  else setMsg(`Reines : <span class="hl">${qs.length}</span> / ${P.N}`);
  if (qs.length === P.N && !badQ.size) win(); else saveRun();
}

function setCell(i, v){ if (won) return; const prev = cells.slice(); cells[i] = v; commit(prev);
  if (v === 2){ conflicts().badQ.has(i) ? SFX.bad() : SFX.q(); } else if (v === 1) SFX.x(); else SFX.clr(); }

function cycle(i){ setCell(i, cells[i] === 3 ? 2 : (cells[i]+1) % 3); }

function win(){
  won = true; clearInterval(timerId);
  elapsed = performance.now() - startTime; $("time").textContent = fmt(elapsed);
  boardEl.classList.add("won");
  SFX.win();
  if (daily){ winDaily(); return; }
  const rec = !best[size] || elapsed < best[size];
  if (rec && !hints){ best[size] = Math.round(elapsed); saveBest(best); renderBest(); }
  setMsg(`<span class="hl">STAGE CLEAR !</span>`);
  $("winStats").innerHTML =
    `GRILLE ${size}×${size}<br>TEMPS ${fmt(elapsed)}<br>INDICES ${hints}<br>` +
    (hints ? `<span>RECORD NON ÉLIGIBLE</span>` : rec ? `<span class="new">NOUVEAU RECORD !</span>` : `RECORD ${fmt(best[size])}`);
  // classement familial : le meilleur temps sans indice part tout seul
  if (!hints && rec && window.LudoScores) LudoScores.submit("queens", "best:" + size, Math.round(elapsed), true).then(r => { if (r) $("winStats").innerHTML += `<br>${LudoScores.rankText(r).toUpperCase()} EN ${size}×${size}`; });
  setTimeout(() => { if (won){ $("overlay").hidden = false; $("nextBtn").focus(); } }, 1100);
}

// grille du jour : temps + 30 s par indice ; le meilleur score du jour part au classement queens / daily:AAAAMMJJ
function winDaily(){
  const k = P.day, sc = Math.round(elapsed) + hints * PENALTY;
  if (!offRank){ dailyDone[k] = sc; savePref("daily", dailyDone); savePref("dailyRun", null); }
  renderBest(); paintDaily();
  setMsg(`<span class="hl">GRILLE DU JOUR REUSSIE !</span>`);
  $("winStats").innerHTML = `GRILLE DU JOUR ${size}×${size}<br>TEMPS ${fmt(elapsed)}<br>INDICES ${hints}${hints ? ` (+${hints * PENALTY / 1000} S)` : ""}<br>SCORE ${fmt(sc)}<br>` +
    (offRank ? `DEJA JOUEE AUJOURD'HUI :<br>HORS CLASSEMENT (TON SCORE ${fmt(dailyDone[k])})` : `<span class="new">SCORE DU JOUR ENREGISTRE !</span>`);
  if (!offRank && window.LudoScores) LudoScores.submit("queens", "daily:" + k, sc, true).then(r => { if (r) $("winStats").innerHTML += `<br>GRILLE DU JOUR : ${LudoScores.rankText(r).toUpperCase()}`; });
  setTimeout(() => { if (won){ $("overlay").hidden = false; $("nextBtn").focus(); } }, 1100);
}

/* ---------- pointer: tap cycles, drag paints crosses ---------- */
let drag = null;
function cellAt(x, y){ const el = document.elementFromPoint(x, y); const c = el && el.closest(".cell"); return c && boardEl.contains(c) ? +c.dataset.i : -1; }
boardEl.addEventListener("pointerdown", e => {
  if (won) return;
  const i = cellAt(e.clientX, e.clientY); if (i < 0) return;
  e.preventDefault(); boardEl.focus({preventScroll:true});
  cursor = i;
  drag = {start:i, moved:false, prev:cells.slice(), painted:new Set()};
  try{ boardEl.setPointerCapture(e.pointerId); }catch(_){}
});
boardEl.addEventListener("pointermove", e => {
  if (!drag) return;
  const i = cellAt(e.clientX, e.clientY);
  if (i < 0 || (i === drag.start && !drag.moved)) return;
  if (!drag.moved){
    if (cells[drag.start] === 2){ return; }
    drag.moved = true;
    if (cells[drag.start] === 0){ cells[drag.start] = 1; drag.painted.add(drag.start); }
  }
  if (cells[i] === 0 && !drag.painted.has(i)){ cells[i] = 1; drag.painted.add(i); SFX.x(); render(); }
});
function endDrag(e){
  if (!drag) return;
  const d = drag; drag = null;
  if (d.moved){ if (d.painted.size) commit(d.prev); }
  else cycle(d.start);
}
boardEl.addEventListener("pointerup", endDrag);
boardEl.addEventListener("pointercancel", () => { if (drag && drag.moved && drag.painted.size) commit(drag.prev); drag = null; });

/* ---------- keyboard ---------- */
boardEl.addEventListener("focus", render);
boardEl.addEventListener("blur", render);
boardEl.addEventListener("keydown", e => {
  if (!P) return;
  const N = P.N, r = Math.floor(cursor/N), c = cursor%N;
  const k = e.key;
  if (k === "ArrowUp"){ cursor = ((r-1+N)%N)*N + c; }
  else if (k === "ArrowDown"){ cursor = ((r+1)%N)*N + c; }
  else if (k === "ArrowLeft"){ cursor = r*N + (c-1+N)%N; }
  else if (k === "ArrowRight"){ cursor = r*N + (c+1)%N; }
  else if (k === " " || k === "Enter"){ cycle(cursor); }
  else if (k === "q" || k === "Q"){ setCell(cursor, cells[cursor] === 2 ? 0 : 2); }
  else if (k === "x" || k === "X"){ setCell(cursor, cells[cursor] === 1 ? 0 : 1); }
  else if (k === "Backspace" || k === "Delete"){ setCell(cursor, 0); }
  else return;
  e.preventDefault(); render();
});
document.addEventListener("keydown", e => {
  if ((e.key === "z" || e.key === "Z") && !e.metaKey && !e.ctrlKey && document.activeElement?.tagName !== "INPUT") undo();
});

/* ---------- controls ---------- */
function undo(){ if (won || !history.length) return; cells = history.pop(); syncAuto(); render(); SFX.clr();
  setMsg(`Reines : <span class="hl">${cells.filter(v => v === 2).length}</span> / ${P.N}`); }
$("undoBtn").onclick = undo;
$("clearBtn").onclick = () => { if (won || cells.every(v => !v)) return; const prev = cells.slice(); cells.fill(0); commit(prev); SFX.clr(); };
$("hintBtn").onclick = () => {
  if (won) return;
  const N = P.N, solCells = new Set(P.sol.map((c,r) => r*N+c));
  const wrong = cells.findIndex((v,i) => v === 2 && !solCells.has(i));
  let target, text;
  if (wrong >= 0){ target = wrong; text = `Cette reine est <span class="hl">mal placée</span>.`; }
  else {
    const wrongX = cells.findIndex((v,i) => (v === 1 || v === 3) && solCells.has(i));
    if (wrongX >= 0){ target = wrongX; const prev = cells.slice(); cells[wrongX] = 2; hints++; commit(prev);
      text = `Une reine se cachait sous une croix !`; }
    else {
      const free = [...solCells].filter(i => cells[i] !== 2);
      target = free[Math.floor(Math.random()*free.length)];
      const prev = cells.slice(); cells[target] = 2; hints++; commit(prev);
      text = `Indice : une reine posée pour toi.`;
    }
  }
  if (!won) setMsg(text);
  SFX.hint();
  const el = boardEl.children[target]; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
};
$("autoBtn").onclick = () => { autoX = !autoX; savePref("autoCross", autoX); syncToggles(); if (!won){ syncAuto(); render(); } };
$("soundBtn").onclick = () => { soundOn = !soundOn; savePref("sound", soundOn); syncToggles(); SFX.q(); };
$("newBtn").onclick = () => { saveRun(); daily = false; buildSizes(); newGame(); SFX.hint(); };
$("nextBtn").onclick = () => { saveRun(); daily = false; buildSizes(); newGame(); SFX.hint(); };
$("dailyBtn").onclick = () => { if (daily && !won && P && P.day === todayKey()) return; saveRun(); startDaily(); SFX.hint(); };
// le chrono s'arrête quand l'appli est cachée, et la tentative du jour est sauvegardée régulièrement
document.addEventListener("visibilitychange", () => {
  if (won || !P) return;
  if (document.hidden){ elapsed = performance.now() - startTime; saveRun(); } else startTime = performance.now() - elapsed;
});
setInterval(() => { if (!document.hidden) saveRun(); }, 3000);
function syncToggles(){
  $("autoBtn").setAttribute("aria-pressed", autoX);
  $("soundBtn").setAttribute("aria-pressed", soundOn);
  $("soundBtn").textContent = soundOn ? "SON" : "MUET";
}
function buildSizes(){
  const nav = $("sizes"); nav.innerHTML = "";
  SIZES.forEach(s => {
    const b = document.createElement("button");
    b.className = "btn"; b.type = "button"; b.textContent = s.l;
    b.setAttribute("aria-pressed", !daily && s.n === size);
    b.onclick = () => { if (s.n === size && !won && !daily) return; saveRun(); daily = false; size = s.n; savePref("size", size); buildSizes(); newGame(); SFX.hint(); };
    nav.appendChild(b);
  });
}

/* ---------- boot (keeps an in-progress game across live updates) ---------- */
function start(data){
  if (data && data.size) size = data.size;
  if (data && data.daily && data.seed === todayKey()){ startDaily(); syncToggles(); return; }
  // lien direct vers la grille du jour (#jour), par exemple depuis l'accueil
  if (!data?.seed && location.hash === "#jour"){ startDaily(); syncToggles(); return; }
  buildSizes(); syncToggles();
  newGame(data?.seed, data);
}
window.claude?.hot?.snapshot?.(() => ({size, seed:P?.day, cells, elapsed, hints, daily}));
window.Queens = { generate, todayKey, dailySize, startDaily, setCell, puzzle: () => P, isDaily: () => daily };
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();

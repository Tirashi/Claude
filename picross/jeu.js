(() => {
"use strict";
const PAL = {k:"#20182e", r:"#e0383e", w:"#f6f4ee", b:"#a86a3c", p:"#f4a3b8", n:"#6b4428", m:"#b58ad8", u:"#3a7bd5",
  y:"#ffd23f", g:"#4fa86a", G:"#2f7a48", t:"#7fd0b8", d:"#3f9a86", o:"#f58a3a", v:"#7c5cb8", e:"#2f6f78", c:"#f1e2c0",
  a:"#5cb8e8", h:"#7a2e14", s:"#b8703a", q:"#3a2c58",
  i:"#4a78d0", l:"#e0a83a", x:"#f6f1de", f:"#ff7aa8", z:"#b8c0cc", B:"#86b8f0",
  P:"#e8607a", R:"#e0502a", T:"#2f8f9f", U:"#8fa8f0", A:"#3f6fb0", M:"#6cc04a", O:"#d8903a", j:"#c8954a", W:"#ddd0ea",
  C:"#a8b8cc", D:"#a898c8", E:"#a09a8a", F:"#6e685c", H:"#c8e890"};
// "w" is white: visible in the reveal but empty in the puzzle.
const filled = ch => ch !== "." && ch !== "w";

/* ---------- helpers ---------- */
const $ = id => document.getElementById(id);
const clueOf = line => { const o = []; let n = 0; for (const v of line){ if (v) n++; else if (n){ o.push(n); n = 0; } } if (n) o.push(n); return o; };
const same = (a,b) => a.length === b.length && a.every((v,i) => v === b[i]);
const fmt = ms => { const s = Math.floor(ms/1000); return String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0"); };
const store = {
  get(k, d){ try{ const v = localStorage.getItem("picrossdex."+k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("picrossdex."+k, JSON.stringify(v)); }catch(e){} }
};

/* ---------- sound ---------- */
let actx = null, soundOn = store.get("sound", true);
function blip(notes, type="square", dur=.06, vol=.05){
  if (!soundOn) return;
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    let t = actx.currentTime;
    for (const f of notes){ const o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t+dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t+dur); t += dur*.9; }
  }catch(e){}
}
const SFX = {
  fill: () => blip([520], "square", .035, .035),
  cross: () => blip([300], "triangle", .04, .07),
  line: () => blip([784, 1047], "square", .05, .04),
  hint: () => blip([880, 660, 990], "triangle", .07, .08),
  win: () => blip([392,523,659,784,659,784,1047], "square", .1, .055),
  nav: () => blip([660, 880], "square", .04, .03),
};

/* ---------- sprites ---------- */
function drawArt(canvas, p, size){
  const H = p.art.length, W = p.art[0].length;
  canvas.width = W; canvas.height = H;
  if (size){ canvas.style.width = size+"px"; canvas.style.height = size*H/W+"px"; }
  const x = canvas.getContext("2d"); x.clearRect(0,0,W,H);
  p.art.forEach((row,r) => [...row].forEach((ch,c) => { if (PAL[ch]){ x.fillStyle = PAL[ch]; x.fillRect(c,r,1,1); } }));
}

/* ---------- state ---------- */
let captured = store.get("captured", {});
let P = null, W = 0, H = 0, sol = [], cells = [], rowClues = [], colClues = [];
let history = [], tool = "fill", startT = 0, elapsed = 0, timer = null, solved = false, hints = 0, cursor = 0;
let progress = store.get("progress", {});   // unfinished grids, per puzzle id
let testMode = store.get("testmode", false);   // 5 taps on the title: every grid of the Dex can be opened
let encounters = store.get("encounters", {}); // current wild encounter per grid size, e.g. {"15x15": "pikachu"}

/* ---------- save transfer between browsers (e.g. Facebook's in-app browser -> Chrome) ---------- */
const SAVE_PREFIX = "PICROSSDEX1-";
function exportCode(){
  const c = {}, p = {};
  for (const [id, v] of Object.entries(captured)) c[id] = {t: v.time, h: v.hints || 0};
  for (const [id, v] of Object.entries(progress)) if (v && v.cells) p[id] = {c: v.cells.join(""), e: Math.round(v.elapsed || 0), h: v.hints || 0};
  return SAVE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify({c, p}))));
}
function importCode(text){
  const raw = (text || "").replace(/\s+/g, "");
  const dec = b => JSON.parse(decodeURIComponent(escape(atob(b))));
  const at = raw.indexOf(SAVE_PREFIX), atAll = raw.indexOf("LUDO1-");   // LUDO1- : code de tous les jeux, depuis le menu
  if (at < 0 && atAll < 0) throw new Error("Ce n'est pas un code de sauvegarde : il doit commencer par PICROSSDEX1- ou LUDO1-.");
  let data;
  try { data = at >= 0 ? dec(raw.slice(at + SAVE_PREFIX.length)) : ((dec(raw.slice(atAll + 6)).g || {}).picross || {}); }
  catch (e) { throw new Error("Le code est incomplet ou abîmé. Copie-le de nouveau en entier."); }
  const byId = Object.fromEntries(PUZZLES.map(q => [q.id, q])), before0 = Object.assign({}, captured);
  let added = 0, faster = 0, grids = 0;
  for (const [id, v] of Object.entries(data.c || {})){
    if (!byId[id] || !(v.t > 0)) continue;
    const mine = captured[id];
    const mk = () => Object.assign({time: Math.round(v.t), hints: v.h || 0}, v.x ? {test: true} : {});
    if (!mine){ captured[id] = mk(); added++; }
    else if (v.t + HINT_MS * (v.h || 0) < mine.time + HINT_MS * (mine.hints || 0)){ captured[id] = mk(); faster++; }
  }
  for (const [id, v] of Object.entries(data.p || {})){
    const q = byId[id];
    if (!q || captured[id] || progress[id] || typeof v.c !== "string") continue;
    if (v.c.length !== q.art.length * q.art[0].length || /[^012]/.test(v.c)) continue;
    progress[id] = {cells: [...v.c].map(Number), elapsed: v.e || 0, hints: v.h || 0}; grids++;
  }
  // grilles en cours devenues inutiles : seulement pour les Pokémon que cet import vient d'ajouter
  for (const [id, v] of Object.entries(data.c || {})) if (v && v.t > 0 && progress[id] && !Object.prototype.hasOwnProperty.call(before0, id)) delete progress[id];
  store.set("captured", captured); store.set("progress", progress);
  return {added, faster, grids};
}
function setXferRes(text, ok){ const el = $("xferRes"); el.textContent = text; el.className = "res " + (ok ? "ok" : "err"); }
$("xferBtn").onclick = () => {
  const box = $("xfer"); box.hidden = !box.hidden; $("xferBtn").setAttribute("aria-expanded", !box.hidden);
  if (!box.hidden) box.scrollIntoView({behavior: "smooth", block: "start"});
};
$("exportBtn").onclick = () => {
  const code = exportCode(), box = $("exportBox");
  box.value = code; box.hidden = false;
  const n = Object.keys(captured).length;
  const done = ok => setXferRes(ok ? `Sauvegarde copiée (${n} Pokémon). Colle-la dans l'autre navigateur.`
                                   : "Copie automatique impossible ici : appuie longuement sur le code ci-dessus, puis Copier.", ok);
  try { navigator.clipboard.writeText(code).then(() => done(true), () => { box.focus(); box.select(); done(false); }); }
  catch (e) { box.focus(); box.select(); done(false); }
};
$("pasteBtn").onclick = async () => {
  try { const t = await navigator.clipboard.readText(); if (t) { $("importBox").value = t; setXferRes("Code collé. Appuie sur IMPORTER.", true); return; } } catch (e) {}
  $("importBox").focus(); setXferRes("Appuie longuement dans la case, puis Coller.", false);
};
$("importBtn").onclick = () => {
  try {
    const r = importCode($("importBox").value);
    const parts = [];
    if (r.added) parts.push(`${r.added} Pokémon ajouté${r.added > 1 ? "s" : ""}`);
    if (r.faster) parts.push(`${r.faster} record${r.faster > 1 ? "s" : ""} amélioré${r.faster > 1 ? "s" : ""}`);
    if (r.grids) parts.push(`${r.grids} grille${r.grids > 1 ? "s" : ""} en cours`);
    setXferRes(parts.length ? "Importé : " + parts.join(", ") + "." : "Rien de nouveau : cette sauvegarde est déjà à jour ici.", true);
    $("importBox").value = ""; renderList(); SFX.win();
    if ((r.added || r.faster) && window.LudoScores) LudoScores.resync().then(() => { crowns = null; markCrowns(); });
  } catch (e) { setXferRes(e.message, false); blip([196, 147], "square", .08, .05); }
};
if (/FBAN|FBAV|FB_IAB|Instagram/i.test(navigator.userAgent)) $("fbNote").hidden = false;

/* ---------- legendary birds: locked until enough grids are solved ---------- */
const UNLOCK_AT = 10;
const LOCK = {art:[
  "...kkkk...",
  "..k....k..",
  "..k....k..",
  ".kkkkkkkk.",
  ".kxyyyyyk.",
  ".kyyykyyk.",
  ".kyykkkyk.",
  ".kyyykyyk.",
  ".kkkkkkkk.",
  ".........."]};
const MEWTWO_AT = 40;
const solvedCount = () => PUZZLES.filter(p => (!p.legend || p.legend === "mew") && captured[p.id]).length;
const legendsOpen = () => solvedCount() >= UNLOCK_AT;
const BIRDS = PUZZLES.filter(p => p.legend === true);
const birdsDone = () => BIRDS.filter(p => captured[p.id]).length;
const allDone = () => PUZZLES.filter(p => p.legend !== "mewtwo" && captured[p.id]).length;   // oiseaux compris
const mewtwoOpen = () => birdsDone() === BIRDS.length && allDone() >= MEWTWO_AT;
const MEWTWO = PUZZLES.find(p => p.legend === "mewtwo");
const mewOpen = () => !!captured[MEWTWO.id];
// un Pokémon déjà capturé n'est jamais reverrouillé (Mew a pu être capturé avant cette règle)
/* Johto legendaries
   - the three dogs wake up after 10 Johto captures, then roam: each new encounter in the Johto grass has
     1 chance in 10 to be one of them (guaranteed after 15 misses); leaving its grid makes it run away
   - Ho-Oh once the three dogs are caught, Lugia after 30 Johto captures, Celebi once both are caught */
const JOHTO_LEGENDS = ["dog", "lugia", "hooh", "celebi"];
const isJohtoLegend = p => JOHTO_LEGENDS.includes(p.legend);
const DOGS_AT = 10, LUGIA_AT = 30, DOG_CHANCE = 0.1, DOG_PITY = 15;
const DOGS = PUZZLES.filter(p => p.legend === "dog");
const isDog = p => p.legend === "dog";
const johtoCount = () => PUZZLES.filter(p => !p.legend && captured[p.id] && regionOf(p) === "johto").length;
const dogsAwake = () => johtoUnlocked() && johtoCount() >= DOGS_AT;
const dogsDone = () => DOGS.filter(p => captured[p.id]).length;
const hoohOpen = () => dogsDone() === DOGS.length;
// capped to the Johto Pokémon that exist so far, so Lugia stays reachable while the Dex grows
const lugiaAt = () => Math.min(LUGIA_AT, PUZZLES.filter(p => !p.legend && p.no !== "OBJ" && dexNum(p) > 151).length);
const lugiaOpen = () => johtoUnlocked() && johtoCount() >= lugiaAt();
const celebiOpen = () => PUZZLES.filter(p => p.legend === "lugia" || p.legend === "hooh").every(p => captured[p.id]);
const johtoLegendOpen = p => isDog(p) ? Object.values(encounters).includes(p.id)
  : p.legend === "hooh" ? hoohOpen() : p.legend === "lugia" ? lugiaOpen() : celebiOpen();
const isLocked = p => !captured[p.id] && (isJohtoLegend(p) ? !johtoLegendOpen(p) : p.legend === "mew" ? !mewOpen() : p.legend === "mewtwo" ? !mewtwoOpen() : (!!p.legend && !legendsOpen()));
function legendMsg(){
  const left = UNLOCK_AT - solvedCount();
  if (left > 0) return `Termine encore <b>${left}</b> picross pour réveiller les trois oiseaux légendaires.`;
  if (birdsDone() < BIRDS.length) return `Les <b>oiseaux légendaires</b> sont apparus (n° 144 à 146) ! Capture-les tous pour te rapprocher de Mewtwo.`;
  if (!mewtwoOpen()) return `Plus que <b>${MEWTWO_AT - allDone()}</b> picross pour faire apparaître <b>Mewtwo</b>.`;
  if (!captured[MEWTWO.id]) return `<b>Mewtwo</b> est apparu dans le Dex (n° 150) !`;
  return PUZZLES.some(p => p.legend === "mew" && !captured[p.id]) ? `Un Pokémon fabuleux se montre enfin : <b>Mew</b> (n° 151) !` : "";
}
const dexNum = p => p.no === "OBJ" ? 0 : parseInt(p.no, 10);
const DEX_ORDER = PUZZLES.map((_, i) => i).sort((a, b) => dexNum(PUZZLES[a]) - dexNum(PUZZLES[b]));

/* ---------- regions: Johto opens (hidden until then) once Mewtwo is captured ---------- */
const johtoUnlocked = () => !!captured[MEWTWO.id];
const johtoVisible = () => johtoUnlocked() || testMode;
// Togepi (#175) waits in the Kanto Dex and moves to Johto when it opens
const regionOf = p => p.no !== "OBJ" && dexNum(p) > 151 && (p.id !== "togepi" || johtoUnlocked()) ? "johto" : "kanto";
let region = store.get("region", "kanto");
const curRegion = () => region === "johto" && johtoVisible() ? "johto" : "kanto";
function setRegion(r){ region = r; store.set("region", r); if (r === "johto") store.set("johtoSeen", true); renderList(); }

function johtoMsg(){
  const n = johtoCount(), out = [];
  if (!n) out.push("Bienvenue à <b>Johto</b> ! De nouveaux Pokémon se cachent dans les hautes herbes.");
  if (!dogsAwake()) { if (n && n < DOGS_AT) out.push(`Capture encore <b>${DOGS_AT - n}</b> Pokémon à Johto : la Tour Cendrée cache un secret…`); }
  else if (dogsDone() < DOGS.length) out.push(`Raikou, Entei et Suicune rôdent dans les <b>hautes herbes</b> de Johto (${dogsDone()}/${DOGS.length} capturés).`);
  const lugia = PUZZLES.find(p => p.legend === "lugia"), hooh = PUZZLES.find(p => p.legend === "hooh"), celebi = PUZZLES.find(p => p.legend === "celebi");
  if (dogsAwake() && !lugiaOpen()) out.push(`Plus que <b>${lugiaAt() - n}</b> capture${lugiaAt() - n > 1 ? "s" : ""} à Johto pour que <b>Lugia</b> sorte des profondeurs.`);
  if (hoohOpen() && !captured[hooh.id]) out.push(`<b>Ho-Oh</b> est apparu dans le Dex (n° 250) !`);
  if (lugiaOpen() && !captured[lugia.id]) out.push(`<b>Lugia</b> est apparu dans le Dex (n° 249) !`);
  if (celebiOpen() && !captured[celebi.id]) out.push(`La GS Ball brille : <b>Celebi</b> t'attend (n° 251) !`);
  return out.join("<br>");
}
function dogRunsAway(p){
  delete progress[p.id]; store.set("progress", progress);
  for (const k of Object.keys(encounters)) if (encounters[k] === p.id) delete encounters[k];
  store.set("encounters", encounters);
}

/* ---------- hautes herbes : the wild Pokémon is drawn at random among those not yet captured ---------- */
const sizeOf = p => p.art[0].length + "x" + p.art.length;
const bySize = (a, b) => { const [aw, ah] = a.split("x").map(Number), [bw, bh] = b.split("x").map(Number); return aw*ah - bw*bh; };
const sizesOf = r => [...new Set(PUZZLES.filter(p => regionOf(p) === r).map(sizeOf))].sort(bySize);
const wildPool = (size, r = curRegion()) => PUZZLES.filter(p => !p.legend && !captured[p.id] && sizeOf(p) === size && regionOf(p) === r);
const encKey = (size, r = curRegion()) => r === "kanto" ? size : r + ":" + size;   // Kanto keeps the old keys
function currentEncounter(size, r = curRegion()){
  const k = encKey(size, r), id = encounters[k], p = id && PUZZLES.find(q => q.id === id);
  if (p && (!p.legend || isDog(p)) && !captured[id] && sizeOf(p) === size && regionOf(p) === r) return p;
  if (id){ delete encounters[k]; store.set("encounters", encounters); }   // an unfinished grid stays in progress, in its own Dex
  return null;
}
const inPlay = p => !!progress[p.id] || Object.values(encounters).includes(p.id);
const isWild = p => !p.legend && !captured[p.id];   // still hidden in the grass
function encounter(size){
  let p = currentEncounter(size);
  if (!p){
    const pool = wildPool(size), dogs = roamingDogs(size);
    if (!pool.length && !dogs.length) return;
    const fresh = pool.filter(q => !progress[q.id]);   // older unfinished grids stay in the Dex, so prefer new ones
    const pick = fresh.length ? fresh : pool;
    p = pick[Math.floor(Math.random()*pick.length)];
    if (!pool.length) p = dogs[Math.floor(Math.random()*dogs.length)];   // grass emptied: only the dogs are left
    else if (dogs.length){
      const miss = store.get("dogMiss", 0);
      if (miss + 1 >= DOG_PITY || Math.random() < DOG_CHANCE){ p = dogs[Math.floor(Math.random()*dogs.length)]; store.set("dogMiss", 0); }
      else store.set("dogMiss", miss + 1);
    }
    encounters[encKey(size)] = p.id; store.set("encounters", encounters);
  }
  open(PUZZLES.indexOf(p));
}
function flee(){
  if (!P || solved || !(isWild(P) || isDog(P) && !captured[P.id])) return;
  const dog = isDog(P) ? P.name : "";
  delete progress[P.id]; store.set("progress", progress);
  for (const k of Object.keys(encounters)) if (encounters[k] === P.id) delete encounters[k];
  store.set("encounters", encounters);
  P = null; clearInterval(timer); document.body.classList.remove("zoom"); $("barPrev").hidden = true;
  blip([392, 330, 262, 196], "square", .07, .05);
  $("playView").hidden = true; $("dexView").hidden = false; renderList();
  $("dexMsg").hidden = false; $("dexMsg").innerHTML = dog ? `<b>${dog}</b> s'est enfui ! Il rôde toujours dans les hautes herbes…` : "Tu as pris la fuite ! Le Pokémon est retourné dans les <b>hautes herbes</b>.";
}
// dogs still to catch, roaming the Johto grass of that size
const roamingDogs = (size, r = curRegion()) => r === "johto" && dogsAwake() ? DOGS.filter(d => !captured[d.id] && sizeOf(d) === size) : [];
function renderSizes(){
  const box = $("sizes"); box.innerHTML = "";
  for (const size of sizesOf(curRegion())){
    const left = wildPool(size).length, cur = currentEncounter(size), roam = roamingDogs(size).length;
    const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (cur ? " resume" : "");
    const label = size.replace("x", "×");
    b.innerHTML = `<span>${label}</span><small>${cur ? "REPRENDRE" : left ? left + (left > 1 ? " RESTANTS" : " RESTANT") : roam ? "LÉGENDAIRES" : "COMPLET"}</small>`;
    b.disabled = !left && !cur && !roam;
    b.setAttribute("aria-label", cur ? `Reprendre la rencontre en ${label}` : left ? `Chercher un Pokémon sauvage en ${label}, ${left} restants`
      : roam ? `Chercher les Pokémon légendaires qui rôdent en ${label}` : `Tous les Pokémon en ${label} sont capturés`);
    b.onclick = () => { SFX.nav(); encounter(size); };
    box.appendChild(b);
  }
}

/* ---------- Dex list ---------- */
const listScroll = {};   // position de défilement du Dex, par région
const helpBox = document.querySelector(".help");
function dexMode(on){
  document.body.classList.toggle("index", on);
  if (on) $("scroller").appendChild(helpBox); else document.querySelector("main.dex").appendChild(helpBox);
}
/* ---------- classement familial : couronne sur les Pokémon dont on détient le record ---------- */
let crowns = null, crownsAt = 0;
function markCrowns(){
  const L = window.LudoScores; if (!L || !L.joined()) return;
  const apply = () => { for (const b of $("list").querySelectorAll(".entry[data-id]")){ const r = crowns[b.dataset.id];
    b.classList.toggle("crown", !!(r && r.me)); if (r) b.title = `Record de la famille : ${r.pseudo} en ${fmt(r.value)}`;
    if (r && r.me && !/record de la famille/.test(b.getAttribute("aria-label"))) b.setAttribute("aria-label", b.getAttribute("aria-label") + ", record de la famille"); } };
  if (crowns && performance.now() - crownsAt < 60000) return apply();
  L.flush().then(() => L.bests("picross")).then(rows => { if (!rows) return; crowns = {};
    for (const x of rows) if (String(x.board).startsWith("t:")) crowns[x.board.slice(2)] = x;
    crownsAt = performance.now(); if (!$("dexView").hidden) apply(); }).catch(() => {});
}
function renderList(){
  const list = $("list"), sc = $("scroller"); if (document.body.classList.contains("index") && list.dataset.region) listScroll[list.dataset.region] = sc.scrollTop;
  if (!$("dexView").hidden) dexMode(true);
  list.innerHTML = "";
  const r = curRegion(), shown = DEX_ORDER.filter(idx => regionOf(PUZZLES[idx]) === r);
  $("tabs").hidden = !johtoVisible();
  $("tabKanto").setAttribute("aria-selected", r === "kanto"); $("tabJohto").setAttribute("aria-selected", r === "johto");
  $("tabJohto").classList.toggle("new", !store.get("johtoSeen", false) && r !== "johto");
  $("dexView").classList.toggle("johto", r === "johto");
  shown.forEach(idx => { const p = PUZZLES[idx];
    const got = captured[p.id];
    const b = document.createElement("button");
    b.className = "entry" + (p.legend ? " legend" : ""); b.type = "button";
    b.innerHTML = `<span class="no">${p.no === "OBJ" && !got ? "#???" : p.no === "OBJ" ? "OBJ" : "#"+p.no}</span>`;
    if (isLocked(p) && !testMode){
      b.classList.add("locked");
      const cv = document.createElement("canvas"); drawArt(cv, LOCK, 60); b.appendChild(cv);
      const mew = p.legend === "mewtwo", fab = p.legend === "mew" || p.legend === "celebi", jl = isJohtoLegend(p);
      const jmeta = !jl ? "" : isDog(p) ? (dogsAwake() ? "rôde à Johto" : "mystère…")
        : p.legend === "hooh" ? `chiens ${dogsDone()}/${DOGS.length}`
        : p.legend === "lugia" ? `${Math.min(johtoCount(), lugiaAt())}/${lugiaAt()} à Johto` : "après Lugia et Ho-Oh";
      b.insertAdjacentHTML("beforeend", jl
        ? `<span class="nm">${fab ? "FABULEUX" : "LÉGENDAIRE"}</span><span class="meta">${jmeta}</span>`
        : fab
        ? `<span class="nm">FABULEUX</span><span class="meta">après Mewtwo</span>`
        : mew
        ? `<span class="nm">LÉGENDAIRE</span><span class="meta">${Math.min(allDone(), MEWTWO_AT)}/${MEWTWO_AT} · oiseaux ${birdsDone()}/${BIRDS.length}</span>`
        : `<span class="nm">LÉGENDAIRE</span><span class="meta">${Math.min(solvedCount(), UNLOCK_AT)}/${UNLOCK_AT} picross</span>`);
      b.setAttribute("aria-label", jl ? "Pokémon légendaire de Johto, pas encore apparu"
                                 : fab ? "Pokémon fabuleux verrouillé : capture Mewtwo pour le faire apparaître"
                                 : mew ? `Pokémon légendaire verrouillé : capture les trois oiseaux et termine ${MEWTWO_AT} picross`
                                       : `Pokémon légendaire verrouillé : termine ${UNLOCK_AT} picross pour le débloquer`);
      b.onclick = () => { blip([196, 147], "square", .08, .05); $("dexMsg").hidden = false;
        $("dexMsg").innerHTML = !jl ? legendMsg() : isDog(p) && dogsAwake() ? `Ce Pokémon légendaire rôde dans les <b>hautes herbes</b> de Johto : il peut surgir à chaque rencontre.`
          : johtoMsg() || "Ce Pokémon légendaire ne s'est pas encore montré à <b>Johto</b>…"; };
      list.appendChild(b);
      return;
    }
    if (!got && isWild(p) && !inPlay(p) && !testMode){
      b.classList.add("hidden");
      b.insertAdjacentHTML("beforeend", `<div class="unk">?</div><span class="nm">???</span><span class="meta">&nbsp;</span>`);
      b.setAttribute("aria-label", `N° ${p.no}, pas encore rencontré`);
      b.onclick = () => { blip([196, 147], "square", .08, .05); $("dexMsg").hidden = false; $("dexMsg").innerHTML = "Ce Pokémon se cache encore dans les <b>hautes herbes</b>."; };
      list.appendChild(b);
      return;
    }
    if (got){ const cv = document.createElement("canvas"); drawArt(cv, p, 60); b.appendChild(cv); }
    else { const u = document.createElement("div"); u.className = "unk"; u.textContent = "?"; b.appendChild(u); }
    b.insertAdjacentHTML("beforeend", `<span class="nm">${got ? p.name : "???"}</span><span class="meta">${p.art[0].length}×${p.art.length}${got ? " · "+fmt(got.time) : progress[p.id] ? " · en cours" : ""}</span>`);
    b.setAttribute("aria-label", got ? `${p.name}, capturé en ${fmt(got.time)}` : isWild(p) ? `Pokémon sauvage en cours, grille ${p.art[0].length} par ${p.art.length}` : `N° ${p.no}, grille ${p.art[0].length} par ${p.art.length}, pas encore capturé`);
    if (!got && isWild(p)) b.querySelector(".no").textContent = "#???";
    if (got) b.dataset.id = p.id;
    b.onclick = () => { SFX.nav(); open(idx); };
    list.appendChild(b);
  });
  markCrowns();
  const n = shown.filter(idx => captured[PUZZLES[idx].id]).length;
  $("capCount").textContent = `${n}/${shown.length}`;
  $("capBar").style.width = (100*n/shown.length)+"%";
  const msg = r === "kanto" ? legendMsg() : johtoMsg();
  $("dexMsg").innerHTML = msg; $("dexMsg").hidden = !msg;
  renderSizes();
  $("testNote").hidden = !testMode;
  list.dataset.region = r; sc.scrollTop = listScroll[r] || 0;
}
function showDex(){
  const ran = P && !solved && isDog(P) && !captured[P.id] && !testMode ? P : null;
  saveProgress(); clearInterval(timer); P = null;
  if (ran) dogRunsAway(ran);
  document.body.classList.remove("zoom"); $("barPrev").hidden = true;
  $("playView").hidden = true; $("dexView").hidden = false; renderList();
  if (ran){ $("dexMsg").hidden = false; $("dexMsg").innerHTML = `<b>${ran.name}</b> s'est enfui ! Il rôde toujours dans les hautes herbes…`; blip([784, 659, 523, 392, 262], "square", .06, .05); }
}

/* ---------- puzzle ---------- */
function open(idx, saved){
  if (isLocked(PUZZLES[idx]) && !testMode) return;
  fleeArm = false;
  if (regionOf(PUZZLES[idx]) !== curRegion()){ region = regionOf(PUZZLES[idx]); store.set("region", region); }
  P = PUZZLES[idx]; P.idx = idx; H = P.art.length; W = P.art[0].length;
  sol = P.art.flatMap(r => [...r].map(ch => filled(ch) ? 1 : 0));
  rowClues = [...Array(H).keys()].map(r => clueOf(sol.slice(r*W, r*W+W)));
  colClues = [...Array(W).keys()].map(c => clueOf([...Array(H).keys()].map(r => sol[r*W+c])));
  const prog = saved || progress[P.id];
  cells = prog && prog.cells && prog.cells.length === W*H ? prog.cells.slice() : new Array(W*H).fill(0);
  elapsed = prog ? prog.elapsed || 0 : 0; hints = prog ? prog.hints || 0 : 0; syncHint();
  history = []; solved = false; cursor = 0;
  if (!$("dexView").hidden) listScroll[$("list").dataset.region] = $("scroller").scrollTop;
  dexMode(false);
  $("dexView").hidden = true; $("playView").hidden = false;
  $("win").hidden = true; $("tools").hidden = false; $("gpad").classList.remove("off");
  if (window.scrollY > $("playView").getBoundingClientRect().top + window.scrollY) window.scrollTo(0, 0);
  const roaming = isDog(P) && !captured[P.id];
  $("pNo").textContent = isWild(P) ? "???" : P.no; $("pName").textContent = captured[P.id] || roaming ? P.name : "???";
  $("fleeBtn").hidden = !(isWild(P) || roaming); $("fleeBtn").textContent = "FUIR";
  build(); render(); applyZoom();
  if (roaming){
    const w = $("wrap"); w.classList.remove("burst"); void w.offsetWidth; w.classList.add("burst");
    setTimeout(() => blip([131, 196, 262, 196, 262, 330, 392, 523], "sawtooth", .09, .05), 150);
  }
  setMsg(roaming ? `<span class="hl">${P.name}</span> surgit des hautes herbes ! Termine la grille sans la quitter, sinon il s'enfuit.` : captured[P.id] ? `Déjà capturé. Rejoue pour battre <span class="hl">${fmt(captured[P.id].time)}</span>.`
    : isWild(P) ? (cells.some(v => v) ? `Le Pokémon sauvage t'attend toujours…` : `Un Pokémon sauvage apparaît ! Qui se cache dans cette grille ?`)
    : `Qui se cache dans cette grille ?`);
  startT = performance.now() - elapsed; clearInterval(timer); timer = setInterval(tick, 250); tick();
}
function tick(){ if (solved || !P) return; elapsed = performance.now() - startT; $("pTime").textContent = fmt(elapsed); }
function saveProgress(){
  if (!P || solved) return;
  if (cells.some(v => v) || hints) progress[P.id] = {cells, elapsed, hints}; else delete progress[P.id];
  store.set("progress", progress);
}
function setMsg(h){ $("msg").innerHTML = h; }

let cellEls = [], rcEls = [], ccEls = [], preview = null;
function cellSize(){
  const avail = Math.min($("wrap").clientWidth || 320, 560);
  const maxR = Math.max(...rowClues.map(c => c.length));
  return Math.max(16, Math.min(30, Math.floor((avail - 10) / (W + maxR*0.72 + .4))));
}
function build(){
  const b = $("board"); b.innerHTML = ""; b.classList.remove("revealed");
  const cs = cellSize(); b.style.setProperty("--cell", cs+"px");
  b.style.gridTemplateColumns = `auto repeat(${W}, var(--cell))`;
  b.style.gridTemplateRows = `auto repeat(${H}, var(--cell))`;
  const corner = document.createElement("div"); corner.className = "corner";
  preview = document.createElement("canvas"); preview.width = W; preview.height = H;
  const ps = Math.max(W, Math.min(W*3, cs*2.2)); preview.style.width = ps+"px"; preview.style.height = ps*H/W+"px";
  corner.appendChild(preview); b.appendChild(corner); cornerEl = corner;
  requestAnimationFrame(fit);
  ccEls = colClues.map((cl,c) => { const d = document.createElement("div"); d.className = "cc"+(Math.floor(c/5)%2 ? " alt" : "");
    d.innerHTML = cl.map(n => `<span>${n}</span>`).join("") || "<span>0</span>"; b.appendChild(d); return d; });
  rcEls = []; cellEls = [];
  for (let r = 0; r < H; r++){
    const d = document.createElement("div"); d.className = "rc"+(Math.floor(r/5)%2 ? " alt" : "");
    d.innerHTML = rowClues[r].map(n => `<span>${n}</span>`).join("") || "<span>0</span>"; b.appendChild(d); rcEls.push(d);
    for (let c = 0; c < W; c++){
      const e = document.createElement("div"); let cls = "cell";
      if (c === 0) cls += " c0"; if (r === 0) cls += " r0";
      if (c === W-1) cls += " cl"; else if ((c+1)%5 === 0) cls += " c5";
      if (r === H-1) cls += " rl"; else if ((r+1)%5 === 0) cls += " r5";
      if ((Math.floor(r/5) + Math.floor(c/5)) % 2) cls += " b2";
      e.className = cls; e.dataset.i = r*W+c; e.style.setProperty("--d", r+c);
      b.appendChild(e); cellEls.push(e);
    }
  }
}
// shrink cells until clues + grid fit the screen width
let cornerEl = null;
function fit(){
  const b = $("board"), wrap = $("wrap"); if (!P || !wrap.clientWidth) return;
  let cs = cellSize(); b.style.setProperty("--cell", cs+"px");
  while (b.scrollWidth > wrap.clientWidth && cs > 12){ cs--; b.style.setProperty("--cell", cs+"px"); }
  // in ZOOM, grow to the largest size that still fits exactly
  if (document.body.classList.contains("zoom")){
    while (cs < 34){ b.style.setProperty("--cell", (cs+1)+"px"); if (b.scrollWidth > wrap.clientWidth){ b.style.setProperty("--cell", cs+"px"); break; } cs++; }
  }
}
function lineDone(vals, clue){ return same(clueOf(vals.map(v => v === 1)), clue); }
// numéros validés un par un : un bloc fermé (bord ou croix de chaque côté) atteint depuis un bord
// sans case vide sur le chemin correspond au nombre suivant de l'indice, en partant de ce bord
function clueMarks(vals, clue){
  const ok = new Set(), n = vals.length;
  let lim = 0; // le balayage depuis la droite s'arrête aux blocs déjà attribués depuis la gauche
  const scan = (from, step, idx) => {
    let i = from, k = 0;
    while (k < clue.length){
      while (i >= 0 && i < n && vals[i] === 2) i += step;
      if (i < 0 || i >= n || vals[i] !== 1 || (step < 0 && i < lim)) return;
      let len = 0; while (i >= 0 && i < n && vals[i] === 1){ len++; i += step; }
      if (i >= 0 && i < n && vals[i] !== 2) return;
      const ci = idx(k); if (len !== clue[ci]) return;
      ok.add(ci); k++; if (step > 0) lim = i;
    }
  };
  scan(0, 1, k => k); scan(n-1, -1, k => clue.length-1-k);
  return ok;
}
function markClues(el, vals, clue){
  const done = lineDone(vals, clue), ok = done ? null : clueMarks(vals, clue);
  el.classList.toggle("done", done);
  [...el.children].forEach((s, k) => s.classList.toggle("ok", !done && ok.has(k)));
}
function render(hot){
  cellEls.forEach((e,i) => {
    e.classList.toggle("f", cells[i] === 1); e.classList.toggle("x", cells[i] === 2);
    e.classList.toggle("cur", i === cursor && (document.activeElement === $("board") || document.body.classList.contains("zoom")));
  });
  for (let r = 0; r < H; r++) markClues(rcEls[r], cells.slice(r*W, r*W+W), rowClues[r]);
  for (let c = 0; c < W; c++) markClues(ccEls[c], [...Array(H).keys()].map(r => cells[r*W+c]), colClues[c]);
  const x = preview.getContext("2d"); x.clearRect(0,0,W,H); x.fillStyle = PAL.k;
  cells.forEach((v,i) => { if (v === 1) x.fillRect(i%W, Math.floor(i/W), 1, 1); });
  setHot(hot ?? lastHot);
}
let lastHot = -1;
function setHot(i){
  lastHot = i; const r = i >= 0 ? Math.floor(i/W) : -1, c = i >= 0 ? i%W : -1;
  rcEls.forEach((e,k) => e.classList.toggle("hot", k === r)); ccEls.forEach((e,k) => e.classList.toggle("hot", k === c));
  cellEls.forEach((e,k) => e.classList.toggle("hot", i >= 0 && (Math.floor(k/W) === r || k%W === c)));
}

function checkWin(){
  for (let r = 0; r < H; r++) if (!lineDone(cells.slice(r*W, r*W+W), rowClues[r])) return false;
  for (let c = 0; c < W; c++) if (!lineDone([...Array(H).keys()].map(r => cells[r*W+c]), colClues[c])) return false;
  return true;
}
function afterChange(prev){
  history.push(prev); if (history.length > 400) history.shift();
  render(); saveProgress();
  if (checkWin()) win();
}

const HINT_MS = 30000;   // 30 s par indice
let winToken = 0;
function win(){
  const myWin = ++winToken;
  const wasJohto = johtoUnlocked(), wasDogs = dogsAwake(), wasHooh = hoohOpen(), wasLugia = lugiaOpen(), wasCelebi = celebiOpen();
  const wasOpen = legendsOpen(), wasMew = mewtwoOpen(), wasFab = mewOpen() || !!captured[PUZZLES.find(q => q.legend === "mew").id];
  solved = true; clearInterval(timer); elapsed = performance.now() - startT; $("pTime").textContent = fmt(elapsed);
  delete progress[P.id]; store.set("progress", progress);
  for (const k of Object.keys(encounters)) if (encounters[k] === P.id) delete encounters[k];
  store.set("encounters", encounters);
  $("pNo").textContent = P.no; $("fleeBtn").hidden = true;
  const before = captured[P.id], score = (t, n) => t + HINT_MS * (n || 0);
  // un record se juge sur le temps pénalisé par les indices, comme au classement familial
  const record = !before || score(elapsed, hints) < score(before.time, before.hints) || (before.test && !testMode);
  if (record) captured[P.id] = Object.assign({time: Math.round(elapsed), hints}, testMode ? {test: true} : {});
  store.set("captured", captured);
  setHot(-1);
  const b = $("board"); b.classList.add("revealed");
  cellEls.forEach((e,i) => { const ch = P.art[Math.floor(i/W)][i%W]; e.className = "cell"; e.style.background = PAL[ch] || "var(--screen)"; });
  rcEls.concat(ccEls).forEach(e => e.classList.add("done"));
  $("pName").textContent = P.name;
  SFX.win();
  $("tools").hidden = true; $("gpad").classList.add("off"); padHold = null; setMsg("");
  $("winTitle").innerHTML = P.no === "OBJ" ? `Tu as trouvé une <span class="hl">${P.name}</span> !`
    : P.legend === "mew" || P.legend === "celebi" ? `<span class="hl">${P.name}</span>, Pokémon fabuleux, rejoint ton Dex !`
    : P.legend ? `<span class="hl">${P.name}</span>, Pokémon légendaire, rejoint ton Dex !`
    : `<span class="hl">${P.name}</span> a été enregistré dans le Dex !`;
  $("winStats").innerHTML = `TEMPS ${fmt(elapsed)} · INDICES ${hints}` + (before ? (record ? `<br>NOUVEAU RECORD !` : `<br>RECORD ${fmt(before.time)}`) : "");
  // classement familial : temps + 30 s par indice, et taille du Pokédex
  const L = window.LudoScores;
  if (L && !testMode){
    const id = P.id, name = P.name, value = Math.round(elapsed) + HINT_MS * hints, same = () => myWin === winToken && P && P.id === id && solved;
    L.submit("picross", "dex", Object.entries(captured).filter(([k, v]) => k !== "pokeball" && !v.test).length, false);
    if (L.joined()) L.submit("picross", "t:" + id, value, true).then(r => {
      crowns = null; if (!$("dexView").hidden) markCrowns();
      if (!r || !same()) return;
      $("winStats").innerHTML += `<br>${L.rankText(r).toUpperCase()} POUR ${name}` + (hints ? ` (+${hints * HINT_MS / 1000} S D'INDICES)` : "");
      return L.board("picross", "t:" + id, 3).then(rows => { if (!rows || !rows.length || !same()) return;
        const clean = s => String(s).replace(/[<>&"]/g, "");
        $("winStats").innerHTML += "<br>" + rows.map((x, i, all) => `${all.findIndex(y => y.value === x.value) + 1}. ${x.me ? "<span class=\"hl\">" + clean(x.pseudo) + "</span>" : clean(x.pseudo)} ${fmt(x.value)}`).join(" · "); });
    });
  }
  if (!wasOpen && legendsOpen()){
    $("winStats").innerHTML += `<br><span class="hl">LES OISEAUX LÉGENDAIRES SONT APPARUS !</span>`;
    setTimeout(() => blip([523, 659, 784, 1047, 784, 1047, 1319, 1568], "square", .12, .05), 900);
  }
  if (!wasFab && mewOpen()){
    $("winStats").innerHTML += `<br><span class="hl">UN POKÉMON FABULEUX SE MONTRE… MEW !</span>`;
    setTimeout(() => blip([1047, 1319, 1568, 2093, 1568, 2093, 2637], "triangle", .12, .06), 1500);
  }
  const announce = (txt, notes, wave, at) => { $("winStats").innerHTML += `<br><span class="hl">${txt}</span>`; setTimeout(() => blip(notes, wave, .11, .05), at); };
  if (!wasDogs && dogsAwake()) announce("TROIS POKÉMON LÉGENDAIRES SE SONT ENFUIS À TRAVERS JOHTO !", [262, 330, 392, 330, 262, 196, 262, 392, 523], "sawtooth", 900);
  if (!wasHooh && hoohOpen()) announce("UN ARC-EN-CIEL TRAVERSE LE CIEL… HO-OH EST APPARU !", [523, 659, 784, 1047, 1319, 1568, 2093], "triangle", 1300);
  if (!wasLugia && lugiaOpen()) announce("UNE PLUME ARGENTÉE TOMBE DES FLOTS… LUGIA EST APPARU !", [196, 247, 294, 392, 494, 587, 784], "triangle", 1300);
  if (!wasCelebi && celebiOpen()) announce("LA GS BALL SE MET À BRILLER… CELEBI !", [1047, 1319, 1568, 2093, 1568, 2093, 2637], "triangle", 1700);
  if (!wasJohto && johtoUnlocked()){
    $("winStats").innerHTML += `<br><span class="hl">UN NOUVEAU POKÉDEX S'OUVRE… JOHTO !</span>`;
    setTimeout(() => blip([392, 523, 659, 784, 659, 784, 1047, 1319, 1047, 1568], "triangle", .11, .06), 2600);
  }
  if (!wasMew && mewtwoOpen()){
    $("winStats").innerHTML += `<br><span class="hl">UN POKÉMON MYSTÉRIEUX EST APPARU… MEWTWO !</span>`;
    setTimeout(() => blip([220, 233, 247, 262, 523, 494, 466, 440, 880, 1760], "square", .14, .05), 1300);
  }
  $("nextBtn").hidden = !wildPool(sizeOf(P)).length && !roamingDogs(sizeOf(P)).length;
  $("nextBtn").textContent = `${sizeOf(P).replace("x", "×")} ▶`;
  $("nextBtn").setAttribute("aria-label", `Nouvelle rencontre en ${sizeOf(P).replace("x", "×")}`);
  $("win").hidden = false; ($("nextBtn").hidden ? $("backBtn2") : $("nextBtn")).focus({preventScroll:true});
}

/* ---------- painting: tap toggles, drag paints along one row or column ---------- */
let drag = null;
function cellAt(x, y){ const el = document.elementFromPoint(x, y); return el && el.classList.contains("cell") && $("board").contains(el) ? +el.dataset.i : -1; }
function paint(i){
  if (cells[i] !== drag.from || drag.done.has(i)) return;
  cells[i] = drag.to; drag.done.add(i);
}
$("board").addEventListener("contextmenu", e => e.preventDefault());
$("board").addEventListener("pointerdown", e => {
  if (solved) return;
  const i = cellAt(e.clientX, e.clientY); if (i < 0) return;
  e.preventDefault(); $("board").focus({preventScroll:true}); cursor = i;
  const t = (e.button === 2 || tool === "cross") ? 2 : 1;
  const from = cells[i];
  drag = {start:i, from, to: from === t ? 0 : (from === 0 ? t : (t === 1 ? 1 : 0)), done:new Set(), prev:cells.slice(), axis:null};
  if (from !== 0 && from !== t && t === 2){ drag = null; return; }   // a cross never overwrites a filled cell
  paint(i); (drag.to === 1 ? SFX.fill : SFX.cross)(); render(i);
  try{ $("board").setPointerCapture(e.pointerId); }catch(_){}
});
$("board").addEventListener("pointermove", e => {
  const i = cellAt(e.clientX, e.clientY);
  if (!drag){ if (!solved && e.pointerType === "mouse") setHot(i); return; }
  if (i < 0) return;
  const sr = Math.floor(drag.start/W), sc = drag.start%W, r = Math.floor(i/W), c = i%W;
  if (!drag.axis && i !== drag.start) drag.axis = r === sr ? "row" : c === sc ? "col" : (Math.abs(c-sc) >= Math.abs(r-sr) ? "row" : "col");
  if (!drag.axis) return;
  const n0 = drag.done.size;
  if (drag.axis === "row"){ for (let k = Math.min(sc,c); k <= Math.max(sc,c); k++) paint(sr*W+k); cursor = sr*W+c; }
  else { for (let k = Math.min(sr,r); k <= Math.max(sr,r); k++) paint(k*W+sc); cursor = r*W+sc; }
  if (drag.done.size !== n0){ (drag.to === 1 ? SFX.fill : SFX.cross)(); }
  render(cursor);
});
function endDrag(){ if (!drag) return; const d = drag; drag = null; if (d.done.size) afterChange(d.prev); }
$("board").addEventListener("pointerup", endDrag);
$("board").addEventListener("pointercancel", endDrag);
$("board").addEventListener("pointerleave", e => { if (!drag && e.pointerType === "mouse") setHot(-1); });

/* ---------- keyboard ---------- */
$("board").addEventListener("focus", () => render(cursor));
$("board").addEventListener("blur", () => render(-1));
$("board").addEventListener("keydown", e => {
  if (solved) return;
  const r = Math.floor(cursor/W), c = cursor%W, k = e.key;
  const set = v => { const prev = cells.slice(); cells[cursor] = cells[cursor] === v ? 0 : v; (v === 1 ? SFX.fill : SFX.cross)(); afterChange(prev); };
  if (k === "ArrowUp") cursor = ((r-1+H)%H)*W + c;
  else if (k === "ArrowDown") cursor = ((r+1)%H)*W + c;
  else if (k === "ArrowLeft") cursor = r*W + (c-1+W)%W;
  else if (k === "ArrowRight") cursor = r*W + (c+1)%W;
  else if (k === " " || k === "Enter") set(1);
  else if (k === "x" || k === "X") set(2);
  else if (k === "Backspace" || k === "Delete"){ const prev = cells.slice(); cells[cursor] = 0; afterChange(prev); }
  else return;
  e.preventDefault(); if (!solved) render(cursor);
});
document.addEventListener("keydown", e => { if ((e.key === "z" || e.key === "Z") && !e.ctrlKey && !e.metaKey && P) undo(); });

/* ---------- manette (mode ZOOM) : D-pad moves the cursor, A fills, B crosses; holding A/B while moving paints ---------- */
let padHold = null, padRep = null;
function padApply(i){
  // same rule as a finger drag: only cells still in the starting state change, a cross never covers a filled cell
  if (!padHold || cells[i] !== padHold.from) return;
  const prev = cells.slice(); cells[i] = padHold.to; (padHold.to === 1 ? SFX.fill : SFX.cross)(); afterChange(prev);
}
function padMove(d){
  if (!P || solved) return;
  const r = Math.floor(cursor/W), c = cursor%W;
  cursor = d === "up" ? ((r-1+H)%H)*W + c : d === "down" ? ((r+1)%H)*W + c : d === "left" ? r*W + (c-1+W)%W : r*W + (c+1)%W;
  padApply(cursor); if (!solved) render(cursor);
}
function padPress(t){
  if (!P || solved) return;
  const from = cells[cursor];
  if (t === 2 && from === 1){ padHold = null; return; }
  padHold = {from, to: from === t ? 0 : t};
  padApply(cursor); if (!solved) render(cursor);
}
document.querySelectorAll(".gk").forEach(btn => {
  const stop = () => { clearTimeout(padRep); clearInterval(padRep); padRep = null; };
  btn.addEventListener("pointerdown", e => { e.preventDefault(); stop(); padMove(btn.dataset.d);
    padRep = setTimeout(() => { padRep = setInterval(() => padMove(btn.dataset.d), 85); }, 320); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => btn.addEventListener(ev, stop));
  btn.addEventListener("contextmenu", e => e.preventDefault());
});
[["padA", 1], ["padB", 2]].forEach(([id, t]) => {
  const btn = $(id), up = () => { btn.classList.remove("on"); padHold = null; };
  btn.addEventListener("pointerdown", e => { e.preventDefault(); btn.classList.add("on"); padPress(t); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => btn.addEventListener(ev, up));
  btn.addEventListener("contextmenu", e => e.preventDefault());
});

/* ---------- tools ---------- */
function setTool(t){ tool = t; $("mFill").setAttribute("aria-pressed", t === "fill"); $("mCross").setAttribute("aria-pressed", t === "cross"); }
$("mFill").onclick = () => setTool("fill");
$("mCross").onclick = () => setTool("cross");
function undo(){ if (solved || !history.length) return; cells = history.pop(); render(); saveProgress(); SFX.cross(); }
$("undoBtn").onclick = undo;
$("resetBtn").onclick = () => { if (solved || !cells.some(v => v)) return; const prev = cells.slice(); cells.fill(0); afterChange(prev); SFX.cross(); setMsg("Grille effacée. <span class=\"hl\">ANNULER</span> la ramène."); };
const MAX_HINTS = 3;   // per grid; unlimited in test mode
const hintsLeft = () => testMode ? Infinity : Math.max(0, MAX_HINTS - hints);
function syncHint(){
  const b = $("hintBtn"), left = hintsLeft();
  b.textContent = testMode ? "INDICE" : `INDICE ${left}/${MAX_HINTS}`;
  b.disabled = !left;
  b.setAttribute("aria-label", testMode ? "Indice (illimité en mode test)" : `Indice, ${left} restant${left > 1 ? "s" : ""} sur ${MAX_HINTS}`);
}
$("hintBtn").onclick = () => {
  if (solved) return;
  if (!hintsLeft()){ setMsg(`Plus d'indice pour cette grille : à toi de jouer !`); return; }
  // reveal the first row that disagrees with the picture (fills and crosses)
  const rows = [...Array(H).keys()].filter(r => [...Array(W).keys()].some(c => (cells[r*W+c] === 1) !== (sol[r*W+c] === 1) || (sol[r*W+c] === 0 && cells[r*W+c] !== 2)));
  if (!rows.length) return;
  const r = rows[Math.floor(Math.random()*rows.length)];
  const prev = cells.slice();
  for (let c = 0; c < W; c++) cells[r*W+c] = sol[r*W+c] ? 1 : 2;
  hints++; syncHint(); SFX.hint();
  setMsg(`Indice : la ligne <span class="hl">${r+1}</span> est complétée.` + (testMode ? "" : hintsLeft() ? ` Encore <span class="hl">${hintsLeft()}</span>.` : ` C'était le dernier.`));
  afterChange(prev);
  if (!solved) for (let c = 0; c < W; c++){ const e = cellEls[r*W+c]; e.classList.remove("flash"); void e.offsetWidth; e.classList.add("flash"); }
};
$("backBtn").onclick = () => { SFX.nav(); showDex(); };
$("backBtn2").onclick = () => { SFX.nav(); showDex(); };
$("nextBtn").onclick = () => { SFX.nav(); const size = sizeOf(P); wildPool(size).length || roamingDogs(size).length ? encounter(size) : showDex(); };
// FUIR asks for a second tap: the unfinished grid is thrown away
let fleeArm = false, fleeT = null;
$("fleeBtn").onclick = () => {
  if (!fleeArm){ fleeArm = true; $("fleeBtn").textContent = "SÛR ?"; setMsg(`Touche encore <span class="hl">FUIR</span> pour abandonner cette grille.`); SFX.nav();
    clearTimeout(fleeT); fleeT = setTimeout(() => { fleeArm = false; $("fleeBtn").textContent = "FUIR"; }, 3000); return; }
  fleeArm = false; clearTimeout(fleeT); flee();
};
let titleTaps = 0, titleT = null;
$("tabKanto").onclick = () => { if (curRegion() !== "kanto"){ SFX.nav(); setRegion("kanto"); } };
$("tabJohto").onclick = () => { if (curRegion() !== "johto"){ SFX.nav(); setRegion("johto"); } };
$("title").addEventListener("click", () => {
  titleTaps++; clearTimeout(titleT); titleT = setTimeout(() => { titleTaps = 0; }, 1500);
  if (titleTaps < 5) return;
  titleTaps = 0; testMode = !testMode; store.set("testmode", testMode);
  blip(testMode ? [523, 659, 784, 1047] : [1047, 784, 659, 523], "square", .06, .05);
  if (P) showDex(); else renderList();
  syncHint();
});
// ZOOM: remembered; only applies while a grid is on screen
let zoomOn = store.get("zoom", false);
function applyZoom(){
  const z = zoomOn && !!P;
  document.body.classList.toggle("zoom", z);
  // the preview leaves the board's corner (it widened the clue column) for the bar under the grid
  if (preview){ if (z) $("barPrev").replaceChildren(preview); else { $("barPrev").replaceChildren(); if (cornerEl) cornerEl.appendChild(preview); } $("barPrev").hidden = !z; }
  $("zoomBtn").setAttribute("aria-pressed", zoomOn);
  if (P && !solved) render();   // shows (or hides) the pad cursor
  requestAnimationFrame(() => { fit(); if (P) window.scrollTo(0, 0); });
}
$("zoomBtn").onclick = () => { zoomOn = !zoomOn; store.set("zoom", zoomOn); SFX.nav(); applyZoom(); };
function syncSound(){ $("soundBtn").setAttribute("aria-pressed", soundOn); $("soundBtn").textContent = soundOn ? "SON" : "MUET"; }
$("soundBtn").onclick = () => { soundOn = !soundOn; store.set("sound", soundOn); syncSound(); SFX.nav(); };
window.addEventListener("resize", fit);
window.addEventListener("pagehide", saveProgress);
document.addEventListener("visibilitychange", () => {
  if (!P || solved) return;
  if (document.hidden){ elapsed = performance.now() - startT; clearInterval(timer); timer = null; saveProgress(); }
  else if (!timer){ startT = performance.now() - elapsed; timer = setInterval(tick, 250); tick(); }
});

/* ---------- boot (keeps the current grid across live updates) ---------- */
function start(data){
  syncSound();
  const gone = testMode ? [] : DOGS.filter(d => !captured[d.id] && Object.values(encounters).includes(d.id));
  gone.forEach(dogRunsAway);
  renderList();
  if (gone.length){ $("dexMsg").hidden = false; $("dexMsg").innerHTML = `<b>${gone.map(d => d.name).join(", ")}</b> ${gone.length > 1 ? "se sont enfuis" : "s'est enfui"} dans les hautes herbes…`; data = null; }
  if (data && data.id){ const k = PUZZLES.findIndex(p => p.id === data.id); if (k >= 0 && !data.solved) open(k, data); }
}
window.claude?.hot?.snapshot?.(() => P ? {id:P.id, cells, elapsed, hints, solved} : {});
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
window.Picross = { PUZZLES, filled, clueOf };   // pour les tests (outils/logique.js)
})();

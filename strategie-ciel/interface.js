/* =====================================================================
   STRATEGIE SPATIALE (nom provisoire) · l'INTERFACE : caméra libre (souris, clavier, doigts),
   sélection (clic, cadre, groupes), ordres (clic droit ou toucher), mini-carte, panneaux.
   ===================================================================== */
'use strict';
const $ = s => document.querySelector(s);
const CA = { c: V3(), yaw: 0, dist: 1700, tilt: 0 };
let VIT = 1;
function placeCam(){ const k = clamp((CA.dist - 400) / 2600, 0, 1), p = clamp(34 + 32 * k + CA.tilt, 20, 82) * PI / 180, d = CA.dist, c = CA.c;
  cam.position.set(c.x + Math.sin(CA.yaw) * Math.cos(p) * d, c.y + Math.sin(p) * d, c.z + Math.cos(CA.yaw) * Math.cos(p) * d); cam.lookAt(c);
  sc.fog.near = d * 1.4; sc.fog.far = d * 4.5; }
const zoom = f => { CA.dist = clamp(CA.dist * f, 380, 6500); };
function deplacer(dx, dy){ const k = 2 * CA.dist * Math.tan(16 * PI / 180) / ECRAN.clientHeight * 1.15, y = CA.yaw;
  CA.c.x = clamp(CA.c.x + (-Math.cos(y) * dx - Math.sin(y) * dy) * k, -5600, 5600); CA.c.z = clamp(CA.c.z + (Math.sin(y) * dx - Math.cos(y) * dy) * k, -5600, 5600); }
function centrer(p){ CA.c.set(p.x, 0, p.z); }

// ---------- écran ↔ monde ----------
const _p = V3();
function ecranDe(v){ _p.copy(v).project(cam); return { x: (_p.x + 1) / 2 * ECRAN.clientWidth, y: (1 - _p.y) / 2 * ECRAN.clientHeight, ok: _p.z < 1 }; }
function rayonEcran(v, r){ const d = v.distanceTo(cam.position); return r * cam.projectionMatrix.elements[5] / d * ECRAN.clientHeight / 2; }
function pointSol(x, y, h = 80){ const rc = new THREE.Raycaster(); rc.setFromCamera({ x: x / ECRAN.clientWidth * 2 - 1, y: 1 - y / ECRAN.clientHeight * 2 }, cam);
  const q = V3(); return rc.ray.intersectPlane(new THREE.Plane(V3(0, 1, 0), -h), q) ? q : null; }
function viseUnite(x, y){ let m = null, dm = 1e9; for (const u of U){ if (u.vie <= 0) continue; const e = ecranDe(u.pos); if (!e.ok) continue;
    const d = Math.hypot(e.x - x, e.y - y), r = Math.max(TACTILE ? 22 : 14, rayonEcran(u.pos, u.T.L * .5)); if (d < r && d < dm){ dm = d; m = u; } } return m; }
function viseGisement(x, y){ for (const G of GIS){ if (G.reste <= 0) continue; const h = G.haut(), e = ecranDe(h); if (e.ok && Math.hypot(e.x - x, e.y - y) < Math.max(24, rayonEcran(h, G.r * 1.3))) return G; } return null; }

// ---------- sélection ----------
const SEL = () => U.filter(u => u.sel && u.vie > 0 && u.camp === 0);
function choisir(liste, ajouter){ if (!ajouter) for (const u of U) u.sel = false; for (const u of liste) if (u.camp === 0) u.sel = ajouter && liste.length === 1 ? !u.sel : true; selModif = true; }
const GROUPES = { tout: u => u.T.portee && u.type !== 'pv', chasseur: u => u.type === 'chasseur', bombardier: u => u.type === 'bombardier', destroyer: u => u.type === 'destroyer', collecteur: u => u.type === 'collecteur', pv: u => u.type === 'pv' };
function groupe(k, centre){ const l = U.filter(u => u.camp === 0 && u.vie > 0 && GROUPES[k](u)); choisir(l, false); if (centre && l.length){ const m = V3(); l.forEach(u => m.add(u.pos)); centrer(m.divideScalar(l.length)); } }
function dansBoite(b, ajouter){ const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
  let l = U.filter(u => { if (u.camp || u.vie <= 0) return false; const e = ecranDe(u.pos); return e.ok && e.x >= x0 && e.x <= x1 && e.y >= y0 && e.y <= y1; });
  const comb = l.filter(u => GROUPES.tout(u)); if (comb.length) l = comb; choisir(l, ajouter); }
function ordre(x, y){ const sel = SEL(); if (!sel.length) return false; const u = viseUnite(x, y);
  if (u && u.camp === 1){ ordonner(sel, 'attaquer', u); ping(u.pos.clone().setY(u.pos.y), true); return true; }
  const G = viseGisement(x, y); if (G && sel.some(v => v.type === 'collecteur')){ ordonner(sel.filter(v => v.type === 'collecteur'), 'miner', G); const reste = sel.filter(v => v.type !== 'collecteur'); if (reste.length) ordonner(reste, 'aller', null, G.p); ping(G.haut(), 0); return true; }
  const p = pointSol(x, y); if (!p) return false; ordonner(sel, 'aller', null, p); ping(p); return true; }
let selModif = true, dernierClic = { t: 0, u: null };
function clicSur(x, y, ajouter){ const u = viseUnite(x, y), now = performance.now();
  if (u && u.camp === 0){ if (dernierClic.u === u && now - dernierClic.t < 380){ const l = U.filter(v => v.camp === 0 && v.vie > 0 && v.type === u.type && ecranDe(v.pos).ok); choisir(l, false); } else choisir([u], ajouter); dernierClic = { t: now, u }; return true; }
  return false; }

// ---------- pointeur : souris (gauche : choisir et cadre ; droit : ordre, glisser = pivoter) et doigts (un : déplacer la carte ; deux : zoom et rotation) ----------
const PTR = new Map(); let boite = null, modeCadre = false, souris = null;
const cadreDiv = $('#cadreSel');
function majBoite(){ if (!boite){ cadreDiv.hidden = true; return; } cadreDiv.hidden = false; Object.assign(cadreDiv.style, { left: Math.min(boite.x0, boite.x1) + 'px', top: Math.min(boite.y0, boite.y1) + 'px', width: Math.abs(boite.x1 - boite.x0) + 'px', height: Math.abs(boite.y1 - boite.y0) + 'px' }); }
const cv = R.domElement;
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(e.deltaY * .0012)); }, { passive: false });
cv.addEventListener('pointerdown', e => { try { cv.setPointerCapture(e.pointerId); } catch (x){} const r = ECRAN.getBoundingClientRect();
  PTR.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX - r.left, y0: e.clientY - r.top, b: e.button, souris: e.pointerType === 'mouse', bouge: false });
  if (PTR.size > 1) boite = null; majBoite(); });
cv.addEventListener('pointermove', e => { const r = ECRAN.getBoundingClientRect(); if (e.pointerType === 'mouse') souris = { x: e.clientX - r.left, y: e.clientY - r.top };
  const p = PTR.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y;
  if (!p.bouge && Math.hypot(e.clientX - r.left - p.x0, e.clientY - r.top - p.y0) > 7) p.bouge = true;
  if (PTR.size === 1 && p.bouge){
    if ((p.souris && p.b === 0) || (!p.souris && modeCadre)){ boite = { x0: p.x0, y0: p.y0, x1: e.clientX - r.left, y1: e.clientY - r.top }; majBoite(); }
    else if (p.souris && p.b !== 0){ CA.yaw -= dx * .006; CA.tilt = clamp(CA.tilt - dy * .15, -16, 18); }
    else deplacer(dx, dy); }
  else if (PTR.size === 2){ const [a, b] = [...PTR.values()], d0 = Math.hypot(a.x - b.x, a.y - b.y), a0 = Math.atan2(b.y - a.y, b.x - a.x); p.x = e.clientX; p.y = e.clientY; a.bouge = b.bouge = true;
    const d1 = Math.hypot(a.x - b.x, a.y - b.y), a1 = Math.atan2(b.y - a.y, b.x - a.x); if (d1 > 10) zoom(d0 / d1); let da = a1 - a0; if (da > PI) da -= 2 * PI; if (da < -PI) da += 2 * PI; CA.yaw += da; deplacer(dx / 2, dy / 2); }
  p.x = e.clientX; p.y = e.clientY; });
function lacher(e){ const p = PTR.get(e.pointerId); PTR.delete(e.pointerId); if (!p || e.type !== 'pointerup' || S.fin) return; const r = ECRAN.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (boite){ dansBoite(boite, e.shiftKey); boite = null; majBoite(); if (!p.souris){ modeCadre = false; majCadreBtn(); } return; }
  if (p.bouge || PTR.size) return;
  if (p.souris){ if (p.b === 0){ if (!clicSur(x, y, e.shiftKey) && !e.shiftKey) choisir([], false); } else if (p.b === 2) ordre(x, y); return; }
  // au doigt : toucher un de ses vaisseaux le choisit ; sinon, avec une sélection, c'est un ordre
  if (!clicSur(x, y, false)) ordre(x, y); }
cv.addEventListener('pointerup', lacher); cv.addEventListener('pointercancel', lacher);
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') souris = null; });

// ---------- clavier ----------
const TOUCHES = new Set(); let dernierGroupe = { n: 0, t: 0 };
addEventListener('keydown', e => { if (!enJeu()) return; const k = e.key.toLowerCase(); TOUCHES.add(e.key);
  if (k === ' '){ e.preventDefault(); vitesse(VIT ? 0 : 1); }
  else if (k === 'escape'){ if (SEL().length) choisir([], false); else menuPause(true); }
  else if (/^(Digit|Numpad)[1-5]$/.test(e.code)){ /* la touche physique (en AZERTY, « 2 » sans Maj donne « é ») ; un double appui centre la vue sur le groupe */
    const n = +e.code.slice(-1), now = performance.now(); groupe(['tout', 'chasseur', 'bombardier', 'destroyer', 'collecteur'][n - 1], dernierGroupe.n === n && now - dernierGroupe.t < 400); dernierGroupe = { n, t: now }; }
  else if (k === 'h'){ groupe('pv', true); }
  else if (k === 's'){ for (const u of SEL()){ u.ordre = { k: 'rien' }; u.cible = null; } }
  else { const t = PRODUITS.find(t => TYPES[t].cle && TYPES[t].cle.toLowerCase() === k); if (t) produire(t) || annonce('PAS ASSEZ DE CRISTAL'); }
  if (e.key.startsWith('Arrow')) e.preventDefault(); });
addEventListener('keyup', e => TOUCHES.delete(e.key));
function majClavier(dtr){ const v = -900 * dtr; /* deplacer() suit un doigt qui tire la carte (la vue part du côté opposé) : ici on veut aller du côté de la flèche ou du bord */ if (TOUCHES.has('ArrowLeft')) deplacer(-v, 0); if (TOUCHES.has('ArrowRight')) deplacer(v, 0); if (TOUCHES.has('ArrowUp')) deplacer(0, -v); if (TOUCHES.has('ArrowDown')) deplacer(0, v);
  // bords de l'écran (souris)
  if (souris && !PTR.size && document.hasFocus()){ const w = ECRAN.clientWidth, h = ECRAN.clientHeight, m = 6; if (souris.x < m) deplacer(-v, 0); else if (souris.x > w - m) deplacer(v, 0); if (souris.y < m) deplacer(0, -v); else if (souris.y > h - m) deplacer(0, v); } }

// ---------- boutons du tableau de bord ----------
function vitesse(v){ VIT = v; document.querySelectorAll('[data-vit]').forEach(b => b.classList.toggle('on', +b.dataset.vit === VIT)); }
function majCadreBtn(){ const b = $('#bCadre'); if (b) b.classList.toggle('on', modeCadre); }
$('#hud').addEventListener('click', e => { const b = e.target.closest('[data-vit],[data-cam],[data-gr],[data-prod],[data-file],[data-act],#bCadre'); if (!b) return;
  if (b.dataset.vit) vitesse(+b.dataset.vit);
  else if (b.dataset.cam){ const v = b.dataset.cam; if (v === '+') zoom(.75); if (v === '-') zoom(1.33); if (v === 'r') CA.yaw += PI / 4; if (v === 'n'){ CA.yaw = 0; CA.tilt = 0; const pv = PV(); if (pv) centrer(pv.pos); } }
  else if (b.dataset.gr) groupe(b.dataset.gr, true);
  else if (b.dataset.prod){ if (!produire(b.dataset.prod)) annonce(S.file.length >= 6 ? 'LA FILE EST PLEINE' : 'PAS ASSEZ DE CRISTAL'); }
  else if (b.dataset.file) annuler(+b.dataset.file);
  else if (b.dataset.act === 'stop'){ for (const u of SEL()){ u.ordre = { k: 'rien' }; u.cible = null; } }
  else if (b.dataset.act === 'miner'){ for (const u of SEL()) if (u.type === 'collecteur') u.ordre = { k: 'miner', gis: gisementProche(u.pos) }; }
  else if (b.dataset.act === 'aucun') choisir([], false);
  else if (b.dataset.act === 'menu') menuPause(true);
  else if (b.id === 'bCadre'){ modeCadre = !modeCadre; majCadreBtn(); } });
// mini-carte : toucher ou cliquer = y amener la caméra ; clic droit = ordre de déplacement
const mini = $('#mini'), EM = 5600;
const miniVers = (x, y) => V3((x / mini.clientWidth * 2 - 1) * EM, 0, (y / mini.clientHeight * 2 - 1) * EM);
mini.addEventListener('contextmenu', e => e.preventDefault());
mini.addEventListener('pointerdown', e => { e.stopPropagation(); const r = mini.getBoundingClientRect(), p = miniVers(e.clientX - r.left, e.clientY - r.top);
  if (e.button === 2){ const sel = SEL(); if (sel.length){ ordonner(sel, 'aller', null, p); ping(p); } } else centrer(p); });
function dessineMini(){ const x = mini.getContext('2d'), w = mini.width, h = mini.height, X = v => (v / EM * .5 + .5) * w, Z = v => (v / EM * .5 + .5) * h;
  x.fillStyle = '#0b0a1e'; x.fillRect(0, 0, w, h);
  x.strokeStyle = 'rgba(120,110,140,.35)'; x.lineWidth = (SYS.ceinture[1] - SYS.ceinture[0]) / EM * .5 * w; x.beginPath(); x.arc(X(0), Z(0), (SYS.ceinture[0] + SYS.ceinture[1]) / 2 / EM * .5 * w, 0, 6.283); x.stroke();
  x.lineWidth = 1; x.strokeStyle = 'rgba(154,160,216,.3)'; for (const P of PLANETES){ const c = P.autour ? PLN[P.autour] : { x: 0, z: 0 }; x.beginPath(); x.arc(X(c.x), Z(c.z), P.orb / EM * .5 * w, 0, 6.283); x.stroke(); }
  x.fillStyle = '#ffd27a'; x.beginPath(); x.arc(X(0), Z(0), 4, 0, 6.283); x.fill();
  for (const P of PLANETES){ x.fillStyle = COUL_PLA[P.t]; x.beginPath(); x.arc(X(P.x), Z(P.z), Math.max(2.5, P.r / EM * .5 * w), 0, 6.283); x.fill(); }
  for (const G of PORTES){ x.strokeStyle = G.alerte ? '#ff6a6a' : '#a890ff'; x.lineWidth = 2; x.beginPath(); x.arc(X(G.p.x), Z(G.p.z), 4, 0, 6.283); x.stroke(); }
  for (const G of GIS) if (G.reste > 0){ x.fillStyle = '#9ff0ff'; const s = 1.5 + 2 * G.reste / G.max; x.fillRect(X(G.p.x) - s, Z(G.p.z) - s, 2 * s, 2 * s); }
  for (const u of U){ if (u.vie <= 0) continue; x.fillStyle = u.camp ? '#ff6a4a' : u.sel ? '#d8ffd8' : '#7fd0ff'; const s = u.type === 'pv' ? 5 : u.T.gros ? 3.5 : 2; x.fillRect(X(u.pos.x) - s / 2, Z(u.pos.z) - s / 2, s, s); }
  const rc = new THREE.Raycaster(), pl = new THREE.Plane(V3(0, 1, 0), 0), pts = [];
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]){ rc.setFromCamera({ x: a, y: b }, cam); const q = V3(); if (rc.ray.intersectPlane(pl, q)) pts.push(q); }
  if (pts.length === 4){ x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 1; x.beginPath(); pts.forEach((q, i) => i ? x.lineTo(X(q.x), Z(q.z)) : x.moveTo(X(q.x), Z(q.z))); x.closePath(); x.stroke(); } }

// ---------- panneaux ----------
const barre = (v, c = '') => `<div class="barre ${c}"><i style="width:${Math.round(clamp(v, 0, 1) * 100)}%"></i></div>`;
function annonce(t, long){ const b = $('#bandeau'); b.innerHTML = t; b.style.opacity = 1; clearTimeout(annonce.t); annonce.t = setTimeout(() => { b.style.opacity = 0; }, long ? 4200 : 2200); }
function annonceVague(n){ annonce(`VAGUE ${n} / ${VAGUES.length}<b>FLOTTE ROUGE</b>ELLE ENTRE PAR LA PORTE D'ALTAIR`, 1); }
function annonceProd(){}
let sigSel = '', sigProd = '';
function majPanneaux(){
  const pv = PV(), bleus = U.filter(u => u.camp === 0 && u.vie > 0);
  $('#hCr').textContent = '◆ ' + Math.floor(S.cristal); $('#hNb').textContent = bleus.length; $('#hVg').textContent = S.vague + ' / ' + VAGUES.length;
  $('#hDate').textContent = 'J ' + (1 + Math.floor(TEMPS.t / 2));
  const rouges = U.filter(u => u.camp === 1 && u.vie > 0).length;
  $('#hAl').innerHTML = S.prochaine !== null ? `<span>VAGUE ${S.vague + 1} DANS</span><b>${Math.floor(S.prochaine / 60)}:${String(Math.floor(S.prochaine % 60)).padStart(2, '0')}</b>${rouges ? `<span class="rouge">${rouges} ENNEMIS DANS LE SYSTEME</span>` : ''}` : `<span class="rouge">DERNIERE VAGUE</span><b>${rouges} ENNEMIS</b>`;
  $('#hAl').classList.toggle('alerte', rouges > 0);
  // sélection
  const sel = SEL(), parT = {}; sel.forEach(u => { parT[u.type] = (parT[u.type] || 0) + 1; });
  const sig = Object.entries(parT).map(e => e.join(':')).join(',');
  if (sig !== sigSel || selModif){ sigSel = sig; selModif = false;
    $('#hSel').innerHTML = !sel.length ? `<span class="mut">${TACTILE ? 'TOUCHE UN VAISSEAU, OU UN GROUPE CI-DESSUS' : 'CLIC : CHOISIR · GLISSER : CADRE · CLIC DROIT : ORDRE'}</span>`
      : `<div class="l"><b>${Object.entries(parT).map(([t, n]) => (n > 1 ? n + ' ' : '') + TYPES[t].nom + (n > 1 && !TYPES[t].nom.endsWith('S') ? 'S' : '')).join(' · ')}</b><span class="bt" data-act="aucun">✕</span></div><div id="hSelB"></div>
        <div class="acts"><span class="bt" data-act="stop">${TACTILE ? '' : '<span class="k">S</span>'}ARRET</span>${parT.collecteur ? `<span class="bt" data-act="miner">MINER</span>` : ''}<span class="mut">${TACTILE ? 'TOUCHE UNE CIBLE, UN GISEMENT OU L\'ESPACE' : 'CLIC DROIT : ALLER, ATTAQUER, MINER'}</span></div>`; }
  const b = $('#hSelB'); if (b){ const v = sel.reduce((a, u) => a + u.vie, 0) / Math.max(1, sel.reduce((a, u) => a + u.T.vie, 0)); b.innerHTML = barre(v, 'vie'); }
  // production
  const sp = PRODUITS.map(t => S.cristal >= TYPES[t].prix ? 1 : 0).join('') + S.file.join(',') + (pv ? 1 : 0);
  if (sp !== sigProd){ sigProd = sp;
    $('#hProd').innerHTML = `<div class="l"><b>AURORE · CHANTIER</b>${pv ? '' : '<span class="rouge">DETRUIT</span>'}</div><div class="prods">${PRODUITS.map(t => `<span class="bt${S.cristal < TYPES[t].prix ? ' cher' : ''}" data-prod="${t}">${TACTILE ? '' : `<span class="k">${TYPES[t].cle}</span>`}${TYPES[t].nom}<b class="cr">${TYPES[t].prix}◆</b></span>`).join('')}</div>
      <div class="file">${S.file.map((t, i) => `<span class="bt" data-file="${i}" title="ANNULER">${TYPES[t].nom.slice(0, 4)}</span>`).join('') || '<span class="mut">FILE VIDE</span>'}</div><div id="hProdB"></div>`; }
  const pb = $('#hProdB'); if (pb) pb.innerHTML = S.file.length ? barre(S.fileT / TYPES[S.file[0]].temps, 'cap') : '';
  if (pv){ $('#hPv').innerHTML = barre(pv.vie / pv.T.vie, 'vie'); } }
// anneaux de sélection (couleur selon la vie), étiquettes des planètes et des portes
function majMarques(){ for (const u of U){ if (u.vie <= 0) continue; const on = u.sel || (u.camp === 0 && u.type === 'pv'); u.anneau.visible = u.sel;
    if (u.sel){ const f = u.vie / u.T.vie; u.anneau.material = matSel[f > .6 ? 0 : f > .3 ? 1 : 2]; u.anneau.position.copy(u.pos); } }
  let h = '';
  for (const P of PLANETES){ const e = ecranDe(V3(P.x, P.y + P.r + 30, P.z)); if (e.ok) h += `<div class="tag ${P.camp === 0 ? 'b' : 'n'}" style="left:${e.x | 0}px;top:${e.y | 0}px">${P.nom}${P.riche ? ' <span class="cr">◆◆</span>' : ''}${P.camp === 0 ? '<br>COLONIE' : ''}</div>`; }
  for (const G of PORTES){ const e = ecranDe(G.p.clone().setY(220)); if (e.ok) h += `<div class="tag ${G.alerte ? 'r' : 'n'}" style="left:${e.x | 0}px;top:${e.y | 0}px">PORTE · ${G.nom}</div>`; }
  if (CA.dist < 2600) for (const G of GIS){ const e = ecranDe(G.haut().setY(G.r + 40)); if (e.ok) h += `<div class="tag cr" style="left:${e.x | 0}px;top:${e.y | 0}px">◆ ${Math.ceil(G.reste)}</div>`; }
  $('#tags').innerHTML = h; }

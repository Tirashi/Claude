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
let VISE_U = 1;
function viseUnite(x, y){ let m = null, dm = 1e9; for (const u of U){ if (u.vie <= 0) continue; const e = ecranDe(u.pos); if (!e.ok) continue;
    const d = Math.hypot(e.x - x, e.y - y), r = Math.max(TACTILE ? 22 : 14, rayonEcran(u.pos, u.T.L * .5)); if (d < r && d / r < dm){ dm = d / r; m = u; } } VISE_U = dm; return m; }
function viseGisement(x, y){ for (const G of GIS){ if (G.reste <= 0) continue; const h = G.haut(), e = ecranDe(h); if (e.ok && Math.hypot(e.x - x, e.y - y) < Math.max(24, rayonEcran(h, G.r * 1.3))) return G; } return null; }

// ---------- sélection ----------
const SEL = () => U.filter(u => u.sel && u.vie > 0 && u.camp === 0);
function choisir(liste, ajouter){ if (liste.length) SELP = null; if (!ajouter) for (const u of U) u.sel = false; for (const u of liste) if (u.camp === 0) u.sel = ajouter && liste.length === 1 ? !u.sel : true; selModif = true; }
const GROUPES = { tout: u => u.T.portee && u.type !== 'pv', chasseur: u => u.type === 'chasseur', bombardier: u => u.type === 'bombardier', destroyer: u => u.type === 'destroyer', collecteur: u => u.type === 'collecteur', pv: u => u.type === 'pv' };
function groupe(k, centre){ const l = U.filter(u => u.camp === 0 && u.vie > 0 && GROUPES[k](u)); choisir(l, false); if (centre && l.length){ const m = V3(); l.forEach(u => m.add(u.pos)); centrer(m.divideScalar(l.length)); } }
function dansBoite(b, ajouter){ const x0 = Math.min(b.x0, b.x1), x1 = Math.max(b.x0, b.x1), y0 = Math.min(b.y0, b.y1), y1 = Math.max(b.y0, b.y1);
  let l = U.filter(u => { if (u.camp || u.vie <= 0) return false; const e = ecranDe(u.pos); return e.ok && e.x >= x0 && e.x <= x1 && e.y >= y0 && e.y <= y1; });
  const comb = l.filter(u => GROUPES.tout(u)); if (comb.length) l = comb; choisir(l, ajouter); }
function ordre(x, y){ const sel = SEL(); if (!sel.length) return false; const u = viseUnite(x, y);
  if (u && u.camp === 1){ ordonner(sel, 'attaquer', u); ping(u.pos.clone().setY(u.pos.y), true); return true; }
  const G = viseGisement(x, y); if (G && sel.some(v => v.type === 'collecteur')){ ordonner(sel.filter(v => v.type === 'collecteur'), 'miner', G); const reste = sel.filter(v => v.type !== 'collecteur'); if (reste.length) ordonner(reste, 'aller', null, G.p); ping(G.haut(), 0); return true; }
  const P = visePlanete(x, y), colons = sel.filter(v => v.type === 'colon');
  if (P && colons.length){ const pb = peutColoniser(P); if (pb){ bulle(pb); return true; } for (const c of colons){ c.ordre = { k: 'coloniser', P }; c.cible = null; } const reste = sel.filter(v => v.type !== 'colon'); if (reste.length) ordonner(reste, 'aller', null, V3(P.x, 0, P.z)); ping(V3(P.x, 40, P.z), 0); bulle('EN ROUTE POUR ' + P.nom); return true; }
  const p = pointSol(x, y); if (!p) return false; ordonner(sel, 'aller', null, p); ping(p); return true; }
let selModif = true, dernierClic = { t: 0, u: null };
function clicSur(x, y, ajouter){ let u = viseUnite(x, y), now = performance.now(); const qu = VISE_U;
  /* AURORE garée près d'une planète la recouvre : le plus centré des deux l'emporte */
  if (u && visePlanete(x, y) && VISE_P < qu) u = null;
  if (u && u.camp === 0){ if (dernierClic.u === u && now - dernierClic.t < 380){ const l = U.filter(v => v.camp === 0 && v.vie > 0 && v.type === u.type && ecranDe(v.pos).ok); choisir(l, false); } else choisir([u], ajouter); dernierClic = { t: now, u }; return true; }
  /* une planète : sans colon choisi, on ouvre son volet ; avec un colon, c'est un ordre (au doigt) ou rien (à la souris : clic droit) */
  const P = visePlanete(x, y); if (P && !(TACTILE && SEL().some(v => v.type === 'colon'))){ ouvrirPlanete(P); return true; }
  return false; }

// ---------- pointeur : souris (gauche : choisir et cadre ; droit : ordre, glisser = pivoter) et doigts (un : déplacer la carte ; deux : zoom et rotation) ----------
const PTR = new Map(); let boite = null, modeCadre = false, souris = null, modeRallier = false;
function poserRalliement(x, y){ const p = pointSol(x, y); modeRallier = false; sigProd = ''; ECRAN.classList.remove('vise'); if (!p) return; S.ralliement = p.setY(0); ping(V3(p.x, 40, p.z), 0); bulle('POINT DE RALLIEMENT POSE'); }
function rallier(){ modeRallier = !modeRallier; sigProd = ''; ECRAN.classList.toggle('vise', modeRallier); if (modeRallier) bulle(TACTILE ? 'TOUCHE L\'ENDROIT DU RALLIEMENT' : 'CLIQUE L\'ENDROIT DU RALLIEMENT'); }
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
  if (modeRallier && (!p.souris || p.b === 0)){ poserRalliement(x, y); return; }
  if (p.souris){ if (p.b === 0){ if (!clicSur(x, y, e.shiftKey) && !e.shiftKey) choisir([], false); } else if (p.b === 2) ordre(x, y); return; }
  // au doigt : toucher un de ses vaisseaux le choisit ; sinon, avec une sélection, c'est un ordre
  if (!clicSur(x, y, false)) ordre(x, y); }
cv.addEventListener('pointerup', lacher); cv.addEventListener('pointercancel', lacher);
cv.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') souris = null; });

// ---------- clavier ----------
const TOUCHES = new Set(); let dernierGroupe = { n: 0, t: 0 };
// noms des touches selon la disposition du clavier (AZERTY par défaut si le navigateur ne la donne pas)
const NOMS_TOUCHES = { KeyN: 'N', KeyM: ',', Comma: ';', Period: ':', Slash: '!', IntlBackslash: '<', KeyQ: 'A', KeyW: 'Z', KeyE: 'E', KeyR: 'R', KeyT: 'T', KeyY: 'Y', KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P', KeyZ: 'W', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyS: 'S', KeyH: 'H' };
const LAB = code => NOMS_TOUCHES[code] || code.replace('Key', '');
try { navigator.keyboard && navigator.keyboard.getLayoutMap && navigator.keyboard.getLayoutMap().then(m => { for (const c in NOMS_TOUCHES){ const v = m.get(c); if (v && /^[a-z]$/i.test(v)) NOMS_TOUCHES[c] = v.toUpperCase(); } sigProd = ''; majGroupesPerso(); }).catch(() => {}); } catch (e){}
// groupes personnels sur la première ligne de lettres : Maj + lettre = garder la sélection, lettre = la rappeler (deux fois : y aller)
const LIGNE = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP'], PERSO = {};
function garderGroupe(code){ const l = SEL(); if (!l.length){ bulle('CHOISIS D\'ABORD DES VAISSEAUX'); return; } PERSO[code] = new Set(l.map(u => u.id)); majGroupesPerso(); bulle(`GROUPE ${LAB(code)} : ${l.length} VAISSEAU${l.length > 1 ? 'X' : ''}`); }
function rappelGroupe(code, centre){ const ids = PERSO[code]; if (!ids) return; const l = U.filter(u => ids.has(u.id) && u.vie > 0); choisir(l, false); if (centre && l.length){ const m = V3(); l.forEach(u => m.add(u.pos)); centrer(m.divideScalar(l.length)); } }
/* groupes personnels : affichés dans la liste de la flotte (majListe) */
addEventListener('keydown', e => { if (!enJeu()) return; const k = e.key.toLowerCase(); TOUCHES.add(e.key);
  if (k === ' '){ e.preventDefault(); vitesse(VIT ? 0 : 1); }
  else if (k === 'escape'){ if (SEL().length) choisir([], false); else menuPause(true); }
  else if (/^(Digit|Numpad)[1-5]$/.test(e.code)){ /* la touche physique (en AZERTY, « 2 » sans Maj donne « é ») ; un double appui centre la vue sur le groupe */
    const n = +e.code.slice(-1), now = performance.now(); groupe(['tout', 'chasseur', 'bombardier', 'destroyer', 'collecteur'][n - 1], dernierGroupe.n === n && now - dernierGroupe.t < 400); dernierGroupe = { n, t: now }; }
  else if (LIGNE.includes(e.code) && !e.ctrlKey && !e.metaKey){ if (e.shiftKey) garderGroupe(e.code); else { const now = performance.now(); rappelGroupe(e.code, dernierGroupe.n === e.code && now - dernierGroupe.t < 400); dernierGroupe = { n: e.code, t: now }; } }
  else if (e.code === 'KeyH'){ groupe('pv', true); }
  else if (e.code === 'KeyB'){ rallier(); }
  else if (e.code === 'KeyS'){ for (const u of SEL()){ u.ordre = { k: 'rien' }; u.cible = null; } }
  else { const t = PRODUITS.find(t => TYPES[t].cle === e.code); if (t) produire(t) || bulle(S.deb && S.deb[t] === false ? 'A RECHERCHER D\'ABORD' : 'PAS ASSEZ DE CRISTAL'); }
  if (e.key.startsWith('Arrow')) e.preventDefault(); });
addEventListener('keyup', e => TOUCHES.delete(e.key));
function majClavier(dtr){ const v = -900 * dtr; /* deplacer() suit un doigt qui tire la carte (la vue part du côté opposé) : ici on veut aller du côté de la flèche ou du bord */ if (TOUCHES.has('ArrowLeft')) deplacer(-v, 0); if (TOUCHES.has('ArrowRight')) deplacer(v, 0); if (TOUCHES.has('ArrowUp')) deplacer(0, -v); if (TOUCHES.has('ArrowDown')) deplacer(0, v);
  // bords de l'écran (souris)
  if (souris && !PTR.size && document.hasFocus()){ const w = ECRAN.clientWidth, h = ECRAN.clientHeight, m = 6; if (souris.x < m) deplacer(-v, 0); else if (souris.x > w - m) deplacer(v, 0); if (souris.y < m) deplacer(0, -v); else if (souris.y > h - m) deplacer(0, v); } }

// ---------- boutons du tableau de bord ----------
function vitesse(v){ VIT = v; document.querySelectorAll('[data-vit]').forEach(b => b.classList.toggle('on', +b.dataset.vit === VIT)); }
function majCadreBtn(){ sigOrdres = ''; }
$('#hud').addEventListener('click', e => { const b = e.target.closest('[data-vit],[data-cam],[data-gr],[data-prod],[data-file],[data-act],[data-perso],[data-rech],[data-bat],[data-planete],#bCadre'); if (!b) return;
  if (b.dataset.rech){ choisirRecherche(b.dataset.rech); majRechPanneau(); return; }
  if (b.dataset.bat){ if (SELP && construire(SELP, b.dataset.bat)){ VOLET_CHOIX = false; } sigVolet = ''; majVolet(); return; }
  if (b.dataset.planete){ const P = PLN[b.dataset.planete]; ouvrirPlanete(P); const now = performance.now(); if (dernierGroupe.n === P.nom && now - dernierGroupe.t < 400) centrer(V3(P.x, 0, P.z)); dernierGroupe = { n: P.nom, t: now }; return; }
  if (b.dataset.act === 'recherche'){ RECH_OUVERT = !RECH_OUVERT; sigRech = ''; majRechPanneau(); return; }
  if (b.dataset.act === 'fermerP'){ SELP = null; majVolet(); sigListe = ''; return; }
  if (b.dataset.act === 'placer'){ VOLET_CHOIX = !VOLET_CHOIX; sigVolet = ''; majVolet(); return; }
  if (b.dataset.act === 'fonder' && SELP){ fonderColonie(SELP); sigVolet = ''; majVolet(); return; }
  if (b.dataset.act === 'amener' && SELP){ amenerAurore(SELP); return; }
  if (b.dataset.act === 'envoyerColon' && SELP){ const c = U.filter(u => u.type === 'colon' && u.vie > 0).sort((a, b2) => a.pos.distanceTo(SELP.g.position) - b2.pos.distanceTo(SELP.g.position))[0]; if (c){ c.ordre = { k: 'coloniser', P: SELP }; bulle('EN ROUTE POUR ' + SELP.nom); } return; }
  if (b.dataset.act === 'liste'){ LISTE_REPLIE = !LISTE_REPLIE; sigListe = ''; try { localStorage.setItem('strategieciel.liste', LISTE_REPLIE ? '1' : '0'); } catch (x){} majListe(); return; }
  if (b.dataset.perso){ const now = performance.now(); rappelGroupe(b.dataset.perso, dernierGroupe.n === b.dataset.perso && now - dernierGroupe.t < 400); dernierGroupe = { n: b.dataset.perso, t: now }; return; }
  if (b.dataset.act === 'garder'){ const c = LIGNE.find(c => !PERSO[c] || ![...PERSO[c]].some(id => U.some(u => u.id === id && u.vie > 0))) || LIGNE[0]; garderGroupe(c); return; }
  if (b.dataset.vit) vitesse(+b.dataset.vit);
  else if (b.dataset.cam){ const v = b.dataset.cam; if (v === '+') zoom(.75); if (v === '-') zoom(1.33); if (v === 'r') CA.yaw += PI / 4; if (v === 'n'){ CA.yaw = 0; CA.tilt = 0; const pv = PV(); if (pv) centrer(pv.pos); } }
  else if (b.dataset.gr){ const now = performance.now(); groupe(b.dataset.gr, dernierGroupe.n === b.dataset.gr && now - dernierGroupe.t < 400); dernierGroupe = { n: b.dataset.gr, t: now }; sigListe = ''; }
  else if (b.dataset.prod){ if (!produire(b.dataset.prod)) bulle(S.deb && S.deb[b.dataset.prod] === false ? 'A RECHERCHER D\'ABORD' : S.file.length >= 6 ? 'LA FILE EST PLEINE' : 'PAS ASSEZ DE CRISTAL'); }
  else if (b.dataset.file) annuler(+b.dataset.file);
  else if (b.dataset.act === 'stop'){ for (const u of SEL()){ u.ordre = { k: 'rien' }; u.cible = null; } }
  else if (b.dataset.act === 'miner'){ for (const u of SEL()) if (u.type === 'collecteur') u.ordre = { k: 'miner', gis: gisementProche(u.pos) }; }
  else if (b.dataset.act === 'aucun') choisir([], false);
  else if (b.dataset.act === 'menu') menuPause(true);
  else if (b.dataset.act === 'rallier') rallier();
  else if (b.dataset.act === 'sansrallier'){ S.ralliement = null; sigProd = ''; }
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

// ---------- panneaux (interface « liste de flotte », maquette d'interface du 20/11, direction C) ----------
// icônes : les vaisseaux eux-mêmes, photographiés vus de dessus au chargement (fabriquerIcones) ; sinon les dessins de index.html
const ICONES = {};
const ic = (n, s = 18) => ICONES[n] ? `<img class="ico" src="${ICONES[n]}" width="${Math.round(s * 1.25)}" height="${Math.round(s * 1.25)}" alt="">` : `<svg width="${s}" height="${s}" class="ico"><use href="#i-${n}"/></svg>`;
function fabriquerIcones(){ try {
  const T = 96, r = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setSize(T, T); r.setClearColor(0, 0);
  const s = new THREE.Scene(); s.add(new THREE.HemisphereLight('#dfe8ff', '#30304a', 1.1)); const d = new THREE.DirectionalLight('#ffffff', .9); d.position.set(-1, 3, -1); s.add(d);
  for (const t of ['pv', ...PRODUITS, 'colon']){ const Ty = TYPES[t], k = cleModele(Ty, 0), g = importe(k, Ty.rot, 10), long = Ty.gros; s.add(g);
    /* vus d'un peu de biais (on voit le volume) ; les longs (AURORE, destroyer) en diagonale, pour remplir le carré */
    g.rotation.y = long ? -PI / 4 : 0; g.updateMatrixWorld(true); const c = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 200);
    c.position.set(0, 40, 22); c.up.set(0, 1, 0); c.lookAt(0, 0, 0); c.updateMatrixWorld(true);
    // cadrage : la boîte du modèle vue depuis la caméra
    const b = new THREE.Box3().setFromObject(g), coins = []; for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) coins.push(V3(x, y, z).applyMatrix4(c.matrixWorldInverse));
    let m = 0; for (const q of coins) m = Math.max(m, Math.abs(q.x), Math.abs(q.y)); m *= long ? .6 : 1.04; Object.assign(c, { left: -m, right: m, top: m, bottom: -m }); c.updateProjectionMatrix();
    r.render(s, c); ICONES[t] = r.domElement.toDataURL('image/png'); s.remove(g); }
  ICONES.pv = ICONES.pv; r.dispose(); r.forceContextLoss && r.forceContextLoss(); sigListe = sigOrdres = ''; } catch (e){ console.warn('icônes', e); } }
const pvb = (v, c = '') => `<div class="pv ${c || (v < .3 ? 'f' : v < .6 ? 'm' : '')}"><i style="width:${Math.round(clamp(v, 0, 1) * 100)}%"></i></div>`;
function annonce(t, long){ const b = $('#bandeau'); b.innerHTML = t; b.style.opacity = 1; clearTimeout(annonce.t); annonce.t = setTimeout(() => { b.style.opacity = 0; }, long ? 4200 : 2200); }
function bulle(t){ const b = $('#bulle'); b.textContent = t; b.style.opacity = 1; clearTimeout(bulle.t); bulle.t = setTimeout(() => { b.style.opacity = 0; }, 1500); }
function annonceVague(n){ annonce(`VAGUE ${n} / ${VAGUES.length}<b>FLOTTE ROUGE</b>ELLE ENTRE PAR LA PORTE D'ALTAIR`, 1); }
function annonceProd(){}
let sigSel = '', sigProd = '', sigListe = '', sigOrdres = '', LISTE_REPLIE = false; const REV = [];
try { LISTE_REPLIE = localStorage.getItem('strategieciel.liste') === '1'; } catch (e){}
const NOMS_PL = { chasseur: 'CHASSEURS', bombardier: 'BOMBARDIERS', destroyer: 'DESTROYERS', collecteur: 'COLLECTEURS', colon: 'COLONS', intercepteur: 'INTERCEPTEURS', torpilleur: 'TORPILLEURS', corvette: 'CORVETTES', fregate: 'FREGATES', cuirasse: 'CUIRASSES' }, TOUCHE_GR = { chasseur: '2', bombardier: '3', destroyer: '4', collecteur: '5' };
const ORDRE_TXT = u => u.type === 'colon' ? (u.ordre.k === 'coloniser' ? 'EN ROUTE POUR ' + u.ordre.P.nom : 'EN ATTENTE') : u.type === 'collecteur' ? (u.ordre.k === 'miner' ? (u.charge >= u.T.cap ? 'RAPPORTENT' : 'MINENT') : 'EN ATTENTE') : u.cible ? 'ATTAQUE' : u.ordre.k === 'aller' ? 'EN ROUTE' : 'EN GARDE';
function resume(l){ const c = {}; l.forEach(u => { const o = ORDRE_TXT(u); c[o] = (c[o] || 0) + 1; }); const t = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; return t ? t[0] : ''; }
const vieM = l => l.reduce((a, u) => a + u.vie, 0) / Math.max(1, l.reduce((a, u) => a + u.vmax, 0));
function majGroupesPerso(){ sigListe = ''; }
function majListe(){ const L = $('#liste'), pv = PV(), sel = SEL(), seul = t => sel.length > 0 && sel.every(u => u.type === t);
  const groupes = ['chasseur', 'intercepteur', 'bombardier', 'torpilleur', 'corvette', 'fregate', 'destroyer', 'cuirasse', 'collecteur', 'colon'].map(t => [t, U.filter(u => u.camp === 0 && u.vie > 0 && u.type === t)]).filter(([, l]) => l.length);
  const persos = LIGNE.filter(c => PERSO[c]).map(c => [c, U.filter(u => PERSO[c].has(u.id) && u.vie > 0)]).filter(([, l]) => l.length);
  const sig = [LISTE_REPLIE, pv ? Math.round(pv.vie / pv.vmax * 20) : -1, seul('pv'), groupes.map(([t, l]) => t + l.length + Math.round(vieM(l) * 10) + resume(l) + seul(t)).join(), persos.map(([c, l]) => c + l.length).join(),
    PRODUITS.map(t => S.cristal >= TYPES[t].prix ? 1 : 0).join(''), S.file.join(), !!S.ralliement, modeRallier, sigProd, S.deb ? Object.values(S.deb).join() : '', colonies().map(P => P.nom + P.col.bat.join() + (P.col.file ? P.col.file.b : '') + Math.round(cristalMinute(P))).join(), SELP ? SELP.nom : ''].join('|');
  if (sig !== sigListe){ sigListe = sig; sigProd = sigProd || 'x'; L.classList.toggle('replie', LISTE_REPLIE); ECRAN.style.setProperty('--liste', LISTE_REPLIE ? '52px' : ''); /* les boutons de caméra, les ordres et les annonces suivent la largeur de la liste */
    if (LISTE_REPLIE){ L.innerHTML = `<div class="tete"><span class="b" data-act="liste" title="Déplier la liste">◂</span></div>` + (pv ? `<span class="b ligne${seul('pv') ? ' on' : ''}" data-gr="pv">${ic('pv', 20)}${pvb(pv.vie / pv.vmax)}</span>` : '')
      + groupes.map(([t, l]) => `<span class="b ligne${seul(t) ? ' on' : ''}" data-gr="${t}">${ic(t, 18)}<span class="n" style="font-size:11px">${l.length}</span></span>`).join('')
      + persos.map(([c, l]) => `<span class="b ligne" data-perso="${c}"><span class="or">${LAB(c)}</span><span class="n" style="font-size:11px">${l.length}</span></span>`).join(''); }
    else { let h = `<div class="tete"><span>FLOTTE DE SOL-7</span><span class="b" data-act="liste" title="Replier la liste">▸</span></div>`;
      if (pv){ h += `<div class="b ligne${seul('pv') ? ' on' : ''}" data-gr="pv"><div class="h">${ic('pv', 24)}<span>AURORE</span>${TACTILE ? '' : '<span class="k">H</span>'}</div>${pvb(pv.vie / pv.vmax)}<div class="o"><span>${S.file.length ? 'CHANTIER · ' + TYPES[S.file[0]].nom : 'CHANTIER LIBRE'}</span><span class="n" id="lProdT"></span></div></div>`;
        h += `<div class="prods">${PRODUITS.map(t => { const ver = S.deb && S.deb[t] === false; return `<span class="b${S.cristal < TYPES[t].prix || ver ? ' cher' : ''}${ver ? ' verrou' : ''}" data-prod="${t}" title="${TYPES[t].nom} · ${ver ? 'à rechercher' : TYPES[t].prix + ' cristaux'}">${ic(t, 22)}<span class="n">${ver ? ic('verrou', 11) : TYPES[t].prix}</span>${TACTILE || ver ? '' : `<span class="k">${LAB(TYPES[t].cle)}</span>`}</span>`; }).join('')}</div>`;
        h += `<div id="lProdB"></div>`;
        if (S.file.length > 1) h += `<div class="file">${S.file.slice(1).map((t, i) => `<span class="b" data-file="${i + 1}" title="Annuler">${ic(t, 14)}</span>`).join('')}<span class="dx" style="font-size:11px">ENSUITE</span></div>`;
        h += `<div class="ralli"><span class="b${modeRallier ? ' on' : ''}" data-act="rallier" title="Point de ralliement des nouveaux vaisseaux">${ic('drapeau', 14)} RALLIEMENT${TACTILE ? '' : ' <span class="k">B</span>'}</span>${S.ralliement ? '<span class="b" data-act="sansrallier" style="flex:0 0 28px" title="Retirer le point de ralliement">✕</span>' : ''}</div>`; }
      else h += `<div class="b ligne" style="opacity:.6"><div class="h">${ic('pv', 20)}<span class="rg">AURORE DETRUITE</span></div></div>`;
      for (const [t, l] of groupes) h += `<div class="b ligne${seul(t) ? ' on' : ''}" data-gr="${t}"><div class="h">${ic(t, 22)}<span>${NOMS_PL[t]}</span>${TACTILE || !TOUCHE_GR[t] ? '' : `<span class="k">${TOUCHE_GR[t]}</span>`}<span class="n">${l.length}</span></div>${pvb(vieM(l))}<div class="o"><span>${resume(l)}</span></div></div>`;
      for (const [c, l] of persos){ const ty = [...new Set(l.map(u => u.type))]; h += `<div class="b ligne" data-perso="${c}"><div class="h"><span class="or">GROUPE ${LAB(c)}</span>${ty.map(t => ic(t, 13)).join('')}<span class="n">${l.length}</span></div>${pvb(vieM(l))}</div>`; }
      const cols = colonies(); if (cols.length){ h += `<div class="tete" style="margin-top:4px"><span>COLONIES</span></div>`;
        for (const P of cols) h += `<div class="b ligne${SELP === P ? ' on' : ''}" data-planete="${P.nom}"><div class="h"><i class="pastille" style="background:${COUL_PLA[P.t]}"></i><span>${P.nom}</span><span class="n cr" style="margin-left:auto">+${Math.round(cristalMinute(P))}◆</span></div><div class="o"><span class="ibat">${P.col.bat.map(b => ic(ICB[b], 13)).join('')}${P.col.file ? ' <span class="dx">+ ' + BAT[P.col.file.b].nom + '</span>' : ''}</span><span class="n">${P.col.bat.length}/${places(P)}</span></div></div>`; }
      h += `<span class="b" data-act="garder" style="height:28px;flex:none;color:var(--or)" title="Garder la sélection dans un groupe${TACTILE ? '' : ' (Maj + une lettre de la première ligne)'}">${ic('groupe', 14)} NOUVEAU GROUPE</span>`;
      L.innerHTML = h; } }
  const pb = $('#lProdB'); if (pb){ if (S.file.length){ const T = TYPES[S.file[0]]; pb.innerHTML = pvb(S.fileT / T.temps, 'c'); $('#lProdT').textContent = Math.ceil(T.temps - S.fileT) + ' S'; } else pb.innerHTML = ''; } }
function majOrdres(){ const sel = SEL(), o = $('#ordres'), parT = {}; sel.forEach(u => { parT[u.type] = (parT[u.type] || 0) + 1; });
  if (!sel.length && !TACTILE){ o.hidden = true; sigOrdres = ''; return; } o.hidden = false;
  const sig = Object.entries(parT).join() + modeCadre;
  if (sig !== sigOrdres){ sigOrdres = sig;
    o.innerHTML = (sel.length ? `<div class="sel"><div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap">${Object.entries(parT).map(([t, n]) => `<span>${ic(t, 14)} <span class="n">${n}</span></span>`).join('')}</div><div id="oVie"></div></div>`
      + `<span class="b" data-act="stop" title="Arrêt">${ic('stop', 20)}${TACTILE ? '' : '<span class="k">S</span>'}</span>` + (parT.collecteur ? `<span class="b" data-act="miner" title="Miner">${ic('miner', 20)}</span>` : '')
      + `<span class="b" data-act="aucun" title="Ne rien choisir">✕</span>` : '')
      + (TACTILE ? `<span class="b${modeCadre ? ' on' : ''}" id="bCadre" title="Choisir plusieurs vaisseaux d'un cadre">${ic('cadre', 20)}</span>` : ''); }
  const v = $('#oVie'); if (v) v.innerHTML = pvb(vieM(sel)); }
function majPanneaux(){ const bleus = U.filter(u => u.camp === 0 && u.vie > 0), rouges = U.filter(u => u.camp === 1 && u.vie > 0).length;
  REV.push([TEMPS.t, S.mine]); while (REV.length > 2 && TEMPS.t - REV[0][0] > 60) REV.shift(); const d = TEMPS.t - REV[0][0];
  $('#hCr').textContent = '◆ ' + Math.floor(S.cristal); $('#hRev').textContent = (d > 5 ? '+' + Math.round((S.mine - REV[0][1]) / d * 60) : '+0') + '/MIN';
  $('#hNb').innerHTML = `${ic('chasseur', 13)} <span class="n">${bleus.length}</span>`; $('#hDate').textContent = 'J ' + (1 + Math.floor(TEMPS.t / 2));
  const al = $('#hAl'); al.classList.toggle('alerte', rouges > 0);
  al.innerHTML = S.prochaine !== null ? `VAGUE ${S.vague + 1}/${VAGUES.length} DANS <span class="n">${Math.floor(S.prochaine / 60)}:${String(Math.floor(S.prochaine % 60)).padStart(2, '0')}</span>${rouges ? ` · <span class="n">${rouges}</span> ENNEMIS` : ''}` : `DERNIERE VAGUE · <span class="n">${rouges}</span> ENNEMIS`;
  majListe(); majOrdres(); majVolet(); majRechPanneau(); }
// anneaux de sélection (couleur selon la vie), étiquettes des planètes et des portes
// icônes tactiques : visibles quand le vaisseau fait moins de ~12 px à l'écran, en fondu jusqu'à ~22 px ; taille fixe ; pointe dans le sens de la marche
const _av = V3();
function majIconesStrat(){ const H = ECRAN.clientHeight, k = 2 / (cam.projectionMatrix.elements[5] * H);
  for (const u of U){ if (u.vie <= 0 || !u.ic) continue; const r = rayonEcran(u.pos, u.T.L * .5), op = clamp((22 - r) / 10, 0, 1); u.ic.visible = op > .02; if (!u.ic.visible) continue;
    const m = u.ic.material; m.opacity = op; m.color.set(u.sel ? '#a8ffb0' : u.camp ? '#ff6a4a' : '#7fd0ff'); u.ic.position.copy(u.pos); u.ic.scale.setScalar(u.ic.userData.px * k);
    const a = ecranDe(u.pos); _av.set(-Math.sin(u.yaw), 0, -Math.cos(u.yaw)).multiplyScalar(u.T.L).add(u.pos); const b = ecranDe(_av); m.rotation = Math.atan2(b.x - a.x, a.y - b.y) * -1; } }
function majMarques(){ majIconesStrat(); for (const u of U){ if (u.vie <= 0) continue; const on = u.sel || (u.camp === 0 && u.type === 'pv'); u.anneau.visible = u.sel;
    if (u.sel){ const f = u.vie / u.vmax; u.anneau.material = matSel[f > .6 ? 0 : f > .3 ? 1 : 2]; u.anneau.position.copy(u.pos); } }
  let h = '';
  for (const P of PLANETES){ const e = ecranDe(V3(P.x, P.y + P.r + 30, P.z)); if (e.ok) h += `<div class="tag ${P.camp === 0 ? 'b' : 'n'}" style="left:${e.x | 0}px;top:${e.y | 0}px">${P.nom}${P.riche ? ' <span class="cr">◆◆</span>' : ''}${tagColonie(P)}</div>`; }
  for (const G of PORTES){ const e = ecranDe(G.p.clone().setY(220)); if (e.ok) h += `<div class="tag ${G.alerte ? 'r' : 'n'}" style="left:${e.x | 0}px;top:${e.y | 0}px">PORTE · ${G.nom}</div>`; }
  if (CA.dist < 2600) for (const G of GIS){ const e = ecranDe(G.haut().setY(G.r + 40)); if (e.ok) h += `<div class="tag cr" style="left:${e.x | 0}px;top:${e.y | 0}px">◆ ${Math.ceil(G.reste)}</div>`; }
  $('#tags').innerHTML = h; }

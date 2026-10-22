/* =====================================================================
   ROMET · la PAGE : rendu Three.js, écrans, sons, sauvegardes.
   La physique et les règles sont dans physique.js et machines.js ; les
   décors dans decors.js. Boucle à pas fixe (1/60 s), au plus 4 pas par image.
   Optimisations (mesurées dans les maquettes) : une seule InstancedMesh pour
   les pièces, ordre stable, seules les pièces qui ont bougé sont renvoyées
   à la carte graphique ; pièces endormies gratuites ; résolution qui baisse
   sous 50 images/s ; rien ne tourne quand la page est cachée.
   Sauvegardes : romet.machines (trésors, meilleur butin, parties par machine),
   romet.partie (la partie en cours de chaque machine), romet.opts.
   window.Romet pour les tests.
   ===================================================================== */
(function () {
'use strict';
const P = window.RometPhysique, MS = window.RometMachines, { R, H, DT, ZM, BORD, MAXP } = P;
const $ = id => document.getElementById(id);
const MAXBAC = 80;

// --- sauvegardes ---
const lire = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const prog = lire('romet.machines', {}), parties = lire('romet.partie', {});
const opts = Object.assign({ sons: true, vibr: true, derniere: 'foire' }, lire('romet.opts', {}));
function progres(mc) { let p = prog[mc.id]; if (!p || !Array.isArray(p.t)) p = prog[mc.id] = { t: mc.tresors.map(() => false), butin: 0, parties: 0 }; return p; }
const finie = mc => mc.tresors.length > 0 && progres(mc).t.every(Boolean);
function ouverte(i) { const mc = MS.MACHINES[i]; if (!mc.pret) return false; if (mc.secrete) return MS.MACHINES.filter(x => !x.secrete).every(finie); return i === 0 || finie(MS.MACHINES[i - 1]); }
const sauverProg = () => ecrire('romet.machines', prog);
function sauverPartie() { if (!partie) return; if (partie.fini) delete parties[m.id]; else parties[m.id] = partie.sauver(); ecrire('romet.partie', parties); }

// --- sons (Web Audio, après le premier toucher) et vibrations ---
let ac = null;
function son(f, dur, type, vol) { if (!ac || !opts.sons) return; const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime; o.type = type || 'triangle'; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(vol || .12, t); g.gain.exponentialRampToValueAtTime(.001, t + dur); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur); }
const tinte = () => { son(2100 + Math.random() * 500, .12); setTimeout(() => son(2900, .08, 'sine', .06), 40); };
const carillon = () => { son(1600, .3, 'sine', .1); setTimeout(() => son(2400, .4, 'sine', .08), 120); setTimeout(() => son(3200, .5, 'sine', .06), 260); };
function vibrer(ms) { if (opts.vibr && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} }

// --- rendu ---
const ecran = $('ecran'), rendu = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
let pr = Math.min(devicePixelRatio || 1, 1.5); rendu.setPixelRatio(pr); ecran.prepend(rendu.domElement);
const cam = new THREE.PerspectiveCamera(52, 1, .1, 60); cam.position.set(0, 10, 9.6); cam.lookAt(0, 0, -.3);
const dummy = new THREE.Object3D();
let m = null, partie = null, scene = null, D = null, V = null;   // V : les objets 3D de la machine

function jeter(s) { s.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? [].concat(o.material) : []; for (const x of ms) { if (x.map) x.map.dispose(); x.dispose(); } }); }
function construire() {
  if (scene) jeter(scene);
  const s = scene = new THREE.Scene(); D = RometDecors[m.id](s, m); V = {};
  const visuel = (sx, sy, sz, x, y, z, mat) => { const o = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat); o.position.set(x, y, z); s.add(o); return o; };
  const fc = m.finCotes, lg = fc + 7;
  visuel(5.2, .5, 10.5, 0, -.25, -1.75, D.sol); visuel(5.4, 3, .2, 0, 2.12, -5.45, D.fond);
  for (const sx of [-1, 1]) { visuel(.2, 1.9, lg, sx * 2.7, .65, -7 + lg / 2, D.murs); visuel(.08, .08, lg, sx * 2.62, 1.6, -7 + lg / 2, D.bandeMurs); }
  visuel(6, 1.6, .25, 0, -1.05, 3.8, D.facade);
  // bac des gains : fond, côtés et lèvre avant
  visuel(5.8, .12, 1.2, 0, -1.96, 4.5, D.bac); visuel(5.8, .4, .1, 0, -1.75, 5.1, D.levre); for (const sx of [-1, 1]) visuel(.1, .4, 1.2, sx * 2.9, -1.75, 4.5, D.bac);
  if (D.auvent) { const a = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.1), new THREE.MeshPhongMaterial({ map: D.auvent, transparent: true, alphaTest: .5, side: THREE.DoubleSide, shininess: 10 })); a.position.set(0, 4.05, -5.0); a.rotation.x = -.5; s.add(a); }
  if (D.ampoules) { const n = D.ampoules.length, am = V.ampoules = new THREE.InstancedMesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), n), c = new THREE.Color(D.allumee);
    D.ampoules.forEach((p, i) => { dummy.position.set(p[0], p[1], p[2]); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); am.setMatrixAt(i, dummy.matrix); am.setColorAt(i, c); }); s.add(am);
    V.cAllumee = c; V.cEteinte = new THREE.Color(D.eteinte); V.kAmp = -1; }
  V.mursBonus = [-1, 1].map(sx => visuel(.2, 1.9, BORD - fc, sx * 2.7, .65, (fc + BORD) / 2, D.murBonus));
  V.poussoir = visuel(5, .6, 5, 0, .3, ZM, D.poussoir); const bande = new THREE.Mesh(new THREE.BoxGeometry(5, .08, .08), D.bandePoussoir); bande.position.set(0, .26, 2.5); V.poussoir.add(bande);
  const geoPiece = new THREE.CylinderGeometry(R, R, H, D.segPiece || 20);
  V.inst = new THREE.InstancedMesh(geoPiece, D.piece, MAXP); V.inst.frustumCulled = false; V.inst.count = 0; s.add(V.inst); V.modif = -1;
  V.bac = new THREE.InstancedMesh(geoPiece, D.piece, MAXBAC); V.bac.frustumCulled = false; V.bac.count = 0; s.add(V.bac); V.bacP = []; V.bacI = 0;
  V.geo = { geante: new THREE.CylinderGeometry(.65, .65, .16, D.segPiece === 6 ? 6 : 24), mur: new THREE.BoxGeometry(.6, .3, .6), pluie: new THREE.CylinderGeometry(.3, .3, .3, 16), tresor: new THREE.OctahedronGeometry(.3, 0) };
  const phong = o => new THREE.MeshPhongMaterial(o);
  V.mat = { geante: D.geante, mur: phong({ color: 0x35e0ff, emissive: 0x0a4a60, shininess: 80 }), pluie: phong({ color: 0x5a8cff, emissive: 0x14244a, shininess: 80 }),
    tresors: m.tresors.map(l => phong({ color: l[1], emissive: new THREE.Color(l[1]).multiplyScalar(.25), specular: 0xffffff, shininess: 100, flatShading: true })) };
  V.viseur = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, D.segPiece || 20), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .35 })); V.viseur.position.set(0, 2.4, m.zLacher || -4.6); s.add(V.viseur);
  // étincelles : 60 points en mélange additif, recyclés
  const ge = new THREE.BufferGeometry(); V.etP = new Float32Array(60 * 3).fill(-100); V.etV = []; for (let i = 0; i < 60; i++) V.etV.push({ vx: 0, vy: 0, vz: 0, t: 0 });
  ge.setAttribute('position', new THREE.BufferAttribute(V.etP, 3)); V.etincelles = new THREE.Points(ge, new THREE.PointsMaterial({ color: D.etincelle, size: .14, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  V.etincelles.frustumCulled = false; s.add(V.etincelles); V.etI = 0;
  // règles visibles : couloirs du casino (bandes au bord avant), clous de la foire de nuit (sous la fente), étage de l'horloger
  const basic = o => new THREE.MeshBasicMaterial(o);
  if (m.couloirs) { const n = m.couloirs.n, l = 5.2 / n; V.couloirs = [];
    // une bande sur le plancher au bord avant, et une barre lumineuse sur la façade (visible même sous les pièces)
    for (let i = 0; i < n; i++) { const mat = basic({ color: D.couloirEteint, transparent: true, opacity: .85 }), x = -2.6 + l * (i + .5);
      const b = new THREE.Mesh(new THREE.PlaneGeometry(l - .08, .5), mat); b.rotation.x = -Math.PI / 2; b.position.set(x, .014, 3.2); s.add(b);
      visuel(l - .12, .1, .3, x, -.2, 3.78, mat); V.couloirs.push(b); }
    V.cAllume = new THREE.Color(D.couloirAllume); V.cEteint = new THREE.Color(D.couloirEteint); V.kCoul = ''; }
  if (m.clous) { const c = m.clous, pos = []; for (let k = 0; k < c.rangs; k++) for (let x = -2.4 + (k % 2) * .3; x <= 2.41; x += .6) pos.push([x, 2.15 - k * .22]);
    const cl = new THREE.InstancedMesh(new THREE.SphereGeometry(.065, 8, 6), D.clou, pos.length); pos.forEach((p, i) => { dummy.position.set(p[0], p[1], m.zLacher || -4.6); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); cl.setMatrixAt(i, dummy.matrix); }); s.add(cl); }
  if (m.etage) { const e = m.etage, pf = e.bord + 5.45; visuel(5.2, .1, pf, 0, e.y - .05, e.bord - pf / 2, D.etagere);
    V.haut = visuel(5, .45, 1.4, 0, e.y + .225, -5, D.poussoirHaut); }
  pr = D.pixel || Math.min(devicePixelRatio || 1, 1.5); rendu.setPixelRatio(pr);
  taille();
}
function taille() { const w = ecran.clientWidth, h = ecran.clientHeight; if (!w || !h) return; rendu.setSize(w, h, false); const a = w / h;
  cam.aspect = a; cam.fov = Math.max(52, Math.min(75, 2 * Math.atan(3.5 / (a * 11.7)) * 180 / Math.PI)); cam.updateProjectionMatrix(); }
new ResizeObserver(taille).observe(ecran);

// une pièce gagnée réapparaît dans le bac (les plus anciennes laissent la place) ; tout ce qui tombe lance quelques étincelles
function versBac(x, piece) {
  if (piece) { const i = V.bacI++ % MAXBAC, bx = Math.max(-2.5, Math.min(2.5, x + (Math.random() - .5) * .8)), bz = 4.1 + Math.random() * .8; let haut = -1.9;
    for (const p of V.bacP) if (p && (p.x - bx) ** 2 + (p.z - bz) ** 2 < .25 && p.repos + H > haut) haut = p.repos + H;
    V.bacP[i] = { x: bx, z: bz, y: -.6, vy: 0, repos: Math.min(haut, -1.6), ax: (Math.random() - .5) * .3, ay: Math.random() * 6.3, az: (Math.random() - .5) * .3, bouge: true };
    V.bac.count = Math.min(V.bacI, MAXBAC); }
  for (let k = 0; k < (piece ? 5 : 14); k++) { const j = V.etI++ % 60, v = V.etV[j]; V.etP[j * 3] = x + (Math.random() - .5) * .4; V.etP[j * 3 + 1] = .1; V.etP[j * 3 + 2] = 3.45;
    v.vx = (Math.random() - .5) * 1.5; v.vy = 1.5 + Math.random() * 2; v.vz = .4 + Math.random() * .8; v.t = .6 + Math.random() * .4; }
}
function dessiner() {
  const pl = partie.pl, inst = V.inst, tout = pl.modif !== V.modif; let n = 0, lo = 1e9, hi = -1;
  for (const o of pl.objets) {
    if (o.type !== 'piece') {
      if (!o.m) { o.m = new THREE.Mesh(V.geo[o.type], o.type === 'tresor' ? V.mat.tresors[o.lot] : V.mat[o.type]); scene.add(o.m); }
      o.m.position.set(o.x, o.y + o.h / 2, o.z); o.m.rotation.set(o.ax, o.ay + (o.type === 'tresor' ? pl.t : 0), o.az); continue; }
    const k = o.x + o.y * 3.1 + o.z * 7.3 + o.ax * 11 + o.az * 13;
    if (tout || k !== o.k) { o.k = k; dummy.position.set(o.x, o.y + H / 2, o.z); dummy.rotation.set(o.ax, o.ay, o.az); dummy.updateMatrix(); inst.setMatrixAt(n, dummy.matrix); if (n < lo) lo = n; hi = n; }
    n++; }
  if (hi >= 0) { const a = inst.instanceMatrix; a.updateRange.offset = lo * 16; a.updateRange.count = (hi - lo + 1) * 16; a.needsUpdate = true; }
  inst.count = n; V.modif = pl.modif; V.poussoir.position.z = pl.zp; if (V.haut) V.haut.position.z = pl.zHaut() - .7;
  const mur = partie.murT > 0; if (V.mursBonus[0].visible !== mur) V.mursBonus.forEach(x => x.visible = mur);
  rendu.render(scene, cam);
}
function animer(dt, t) {
  // pièces qui tombent dans le bac
  let bacSale = false;
  V.bacP.forEach((p, i) => { if (!p || !p.bouge) return; p.vy -= 15 * dt; p.y += p.vy * dt; if (p.y <= p.repos) { p.y = p.repos; if (p.vy < -3) p.vy *= -.25; else { p.vy = 0; p.bouge = false; } }
    dummy.position.set(p.x, p.y + H / 2, p.z); dummy.rotation.set(p.ax, p.ay, p.az); dummy.updateMatrix(); V.bac.setMatrixAt(i, dummy.matrix); bacSale = true; });
  if (bacSale) V.bac.instanceMatrix.needsUpdate = true;
  let et = false; for (let j = 0; j < 60; j++) { const v = V.etV[j]; if (v.t <= 0) continue; v.t -= dt; v.vy -= 6 * dt; V.etP[j * 3] += v.vx * dt; V.etP[j * 3 + 1] += v.vy * dt; V.etP[j * 3 + 2] += v.vz * dt; if (v.t <= 0) V.etP[j * 3 + 1] = -100; et = true; }
  if (et) V.etincelles.geometry.attributes.position.needsUpdate = true;
  // ampoules : on ne change les couleurs que quand le motif change
  if (V.ampoules) { const k = Math.floor(t * D.vitesseAmp); if (k !== V.kAmp) { V.kAmp = k; for (let i = 0; i < V.ampoules.count; i++) V.ampoules.setColorAt(i, D.clignote(i, k) ? V.cAllumee : V.cEteinte); V.ampoules.instanceColor.needsUpdate = true; } }
  if (V.couloirs) { const k = partie.couloirs.join(); if (k !== V.kCoul) { V.kCoul = k; V.couloirs.forEach((b, i) => b.material.color.copy(partie.couloirs[i] ? V.cAllume : V.cEteint)); } }
  D.animer(t, partie);
}

// --- bandeau, messages, trésors ---
let msgT = 0, gainAff = 0, gainT = 0, aff = {};
function message(t) { const c = $('combi'); c.textContent = t; c.classList.add('pop'); msgT = 1.4; setTimeout(() => c.classList.remove('pop'), 180); }
function hud() {
  const tx = m.textes, a = partie.fini ? '' : partie.murT > 0 ? 'Mur : ' + Math.ceil(partie.murT) + ' s' : partie.bourse <= 0 ? 'Plus de ' + tx.piece + 's… ce qui tombe se rejoue' : partie.lachers ? '' : tx.aide;
  for (const [id, v] of [['hBourse', partie.bourse], ['hButin', partie.butin], ['aide', a]]) if (aff[id] !== v) { aff[id] = v; $(id).textContent = v; }
}
function gemmes(el, t, neuf) { el.innerHTML = ''; m.tresors.forEach((l, i) => { const e = document.createElement('span'); e.className = 'gemme' + (t[i] ? ' on' : '') + (i === neuf ? ' neuf' : ''); e.title = l[0];
  e.style.setProperty('--c', '#' + l[1].toString(16).padStart(6, '0')); el.appendChild(e); }); }

// --- les écrans (un seul à la fois ; les autres attendent leur tour) ---
let menu = null, file = [];
function montrer(id, prep) { if (menu && menu !== id) { file.push([id, prep]); return; } if (prep) prep(); menu = id; $(id).hidden = false; doigt = null; }
function cacher() { if (menu) $(menu).hidden = true; menu = null; const n = file.shift(); if (n) montrer(n[0], n[1]); else sauverPartie(); }
function fermer() { if (menu) $(menu).hidden = true; menu = null; file = []; sauverPartie(); }
function aller(id, prep) { if (menu) $(menu).hidden = true; menu = null; file = []; montrer(id, prep); }
function liste() {
  const l = $('liste'); l.innerHTML = '';
  MS.MACHINES.forEach((mc, i) => {
    if (mc.secrete && !ouverte(i) && !MS.MACHINES.filter(x => !x.secrete).every(finie)) return;   // la machine secrète reste cachée
    const b = document.createElement('button'), ok = ouverte(i), p = mc.tresors.length ? progres(mc) : null;
    b.className = 'mach' + (ok ? '' : ' ferme') + (mc === m ? ' encours' : '');
    b.innerHTML = `<span class="nom">${ok ? '' : '🔒 '}${mc.nom}</span><span class="gemmes"></span><span class="etat"></span>`;
    if (p) { const g = b.querySelector('.gemmes'); mc.tresors.forEach((x, k) => { const e = document.createElement('span'); e.className = 'gemme' + (p.t[k] ? ' on' : ''); e.style.setProperty('--c', '#' + x[1].toString(16).padStart(6, '0')); g.appendChild(e); }); }
    b.querySelector('.etat').textContent = !mc.pret ? 'Bientôt' : !ok ? 'Finis la machine précédente pour l\'ouvrir' :
      (finie(mc) ? 'Terminée · ' : '') + 'Bourse de ' + mc.bourse + (p.butin ? ' · meilleur butin ' + p.butin : '') + (parties[mc.id] && mc !== m ? ' · partie en cours' : '');
    if (ok) b.onclick = () => { if (mc !== m) ouvrir(mc); else if (partie.fini) nouvelle(); fermer(); };
    l.appendChild(b);
  });
}
function finDePartie() {
  const p = progres(m), record = partie.butin > p.butin; p.parties++; if (record) p.butin = partie.butin; sauverProg(); sauverPartie();
  montrer('eFin', () => {
    $('fTitre').textContent = 'Plus de ' + m.textes.piece + 's !'; $('fButin').textContent = partie.butin;
    $('fMeilleur').textContent = record && p.parties > 1 ? 'Nouveau record !' : 'Meilleur butin : ' + p.butin;
    gemmes($('fTresors'), p.t); const n = p.t.filter(Boolean).length;
    $('fTexte').textContent = n === 6 ? 'Machine terminée : tous les trésors sont à toi.' : n + ' trésor' + (n > 1 ? 's' : '') + ' sur 6. Ils restent gagnés pour la prochaine partie.';
  });
}
function machineFinie() {
  const i = MS.MACHINES.indexOf(m), suiv = MS.MACHINES[i + 1];
  montrer('eFinie', () => { gemmes($('nTresors'), progres(m).t);
    $('nTexte').textContent = !suiv ? 'Toutes les machines sont terminées, même la secrète !' : suiv.secrete ? (ouverte(i + 1) ? 'Une machine secrète est apparue dans la liste…' : 'Toutes les machines sont terminées !') : suiv.nom + ' est ouverte !'; });
  carillon(); vibrer([30, 60, 30]);
}

// --- la partie ---
function ouvrir(mc) {
  if (partie) { sauverPartie(); for (const o of partie.pl.objets) o.m = null; }
  m = mc; opts.derniere = m.id; ecrire('romet.opts', opts); document.body.className = 'm-' + m.id;
  $('hRes').textContent = m.textes.reserve; $('hBut').textContent = m.textes.butin; aff = {};
  construire(); partie = null;
  const s = parties[m.id]; if (s && !s.fini) try { partie = new MS.Partie(m, progres(m).t, s); } catch (e) { partie = null; }
  if (!partie) nouvelle(); else gemmes($('tresors'), progres(m).t);
}
function nouvelle() {
  if (partie) for (const o of partie.pl.objets) if (o.m) { scene.remove(o.m); o.m = null; }
  partie = new MS.Partie(m, progres(m).t, null, (Math.random() * 4294967296) >>> 0);
  V.bacP = []; V.bacI = 0; V.bac.count = 0; aff = {}; gemmes($('tresors'), progres(m).t); sauverPartie();
}
function evenements() {
  for (const e of partie.evts) switch (e.t) {
    case 'tombe': if (e.o.m) { scene.remove(e.o.m); e.o.m = null; } break;
    case 'lache': son(500, .05, 'square', .04); break;
    case 'bonus': message(e.type === 'tresor' ? 'Un trésor !' : 'Bonus !'); son(880, .12, 'triangle', .07); setTimeout(() => son(1320, .15, 'triangle', .06), 90); break;
    case 'gain': versBac(e.x, true); gainAff += e.v; gainT = .5; tinte(); vibrer(12); if (e.double) { message(m.textes.double); setTimeout(tinte, 90); } else if (e.type === 'geante') message('+10 !'); break;
    case 'courant': message((e.sens < 0 ? '◀ ' : '') + m.textes.courant + (e.sens > 0 ? ' ▶' : '')); son(180, .9, 'sawtooth', .03); vibrer(60); break;
    case 'couloirs': son(1200, .06, 'square', .03); break;
    case 'clous': for (let k = 1; k <= e.n; k++) setTimeout(() => son(1800 + Math.random() * 600, .03, 'square', .025), k * 70); break;
    case 'perte': if (e.type !== 'piece') message('Perdu…'); break;
    case 'mur': versBac(e.x); message('Mur !'); son(700, .3, 'sawtooth', .05); break;
    case 'finMur': son(400, .2, 'sawtooth', .04); break;
    case 'pluie': versBac(e.x); message('Pluie !'); break;
    case 'tresor': versBac(e.x); message(m.tresors[e.lot][0]); carillon(); vibrer(40); if (e.nouveau) { sauverProg(); gemmes($('tresors'), progres(m).t, e.lot); } break;
    case 'finie': setTimeout(machineFinie, 1500); break;
    case 'fin': finDePartie(); break;
    case 'plein': message('Plateau plein'); break;
  }
  partie.evts.length = 0;
}

// --- le doigt : toucher pour lâcher une pièce ; doigt posé, une pièce toutes les 0,3 s ---
let doigt = null;
const xDoigt = e => { const r = ecran.getBoundingClientRect(); return Math.max(-2.1, Math.min(2.1, ((e.clientX - r.left) / r.width - .5) * 5.6)); };
function lacher(x) { if (partie.fini) return; if (partie.bourse <= 0) { message('Plus de ' + m.textes.piece + 's'); return; } partie.lacher(x); }
ecran.addEventListener('pointerdown', e => { e.preventDefault(); if (menu) return;
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {} }
  const x = xDoigt(e); V.viseur.position.x = x; doigt = { x, t: .3, id: e.pointerId }; lacher(x); });
ecran.addEventListener('pointermove', e => { const x = xDoigt(e); V.viseur.position.x = x; if (doigt && doigt.id === e.pointerId) doigt.x = x; });
for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) ecran.addEventListener(ev, () => { doigt = null; });

// --- boutons ---
const majOpts = () => { $('bSons').textContent = 'SONS : ' + (opts.sons ? 'OUI' : 'NON'); $('bVibr').textContent = 'VIBRATIONS : ' + (opts.vibr ? 'OUI' : 'NON'); ecrire('romet.opts', opts); };
$('bJouer').onclick = () => { if (partie.fini) nouvelle(); cacher(); };
$('bMachines').onclick = $('bPauseMachines').onclick = $('bFinMachines').onclick = $('bFinieMachines').onclick = () => aller('eMachines', liste);
$('bRetourTitre').onclick = () => aller('eTitre');
$('bPause').onclick = () => montrer('ePause', majOpts);
$('bReprendre').onclick = $('bContinuer').onclick = cacher;
$('bRejouer').onclick = () => { nouvelle(); cacher(); };
$('bSons').onclick = () => { opts.sons = !opts.sons; majOpts(); };
$('bVibr').onclick = () => { opts.vibr = !opts.vibr; majOpts(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) { sauverPartie(); if (!menu && partie && !partie.fini) montrer('ePause', majOpts); } });
addEventListener('pagehide', sauverPartie);

// --- la boucle ---
let avant = 0, acc = 0, tDecor = 0, tSauve = 0, seconde = 0, images = 0, lent = 0;
function boucle(t) {
  requestAnimationFrame(boucle);
  const dt = avant ? Math.min((t - avant) / 1000, .1) : 0; avant = t;
  if (!menu && !partie.fini) {
    acc += dt; let k = 0; while (acc >= DT && k < 4) { partie.pas(); acc -= DT; k++; } if (k === 4) acc = 0;
    if (doigt && (doigt.t -= dt) <= 0) { doigt.t = .3; lacher(doigt.x); }
    evenements();
    if ((tSauve += dt) > 5) { tSauve = 0; sauverPartie(); }
  }
  if (gainT > 0 && (gainT -= dt) <= 0 && gainAff) { if (gainAff > 1 || !msgT) message('+' + gainAff); gainAff = 0; }
  if (msgT > 0 && (msgT -= dt) <= 0) $('combi').textContent = '';
  tDecor += dt; animer(dt, tDecor); dessiner(); hud();
  // si le téléphone tombe sous 50 images/s deux secondes de suite, on baisse la résolution d'un cran (jusqu'à 1)
  images++; if ((seconde += dt) >= 1) { const fps = images / seconde; images = 0; seconde = 0;
    if (fps < 50) lent++; else lent = 0; if (lent >= 2 && pr > 1 && !D.pixel) { pr = Math.max(1, pr - .25); rendu.setPixelRatio(pr); taille(); lent = 0; } }
}

// les enseignes et les faces des pièces sont dessinées avec Rye et Chewy : on attend les polices (au plus 2,5 s)
Promise.race([Promise.all(['120px Rye', '92px Chewy', "96px 'Pirata One'", '110px Monoton', '700 24px Cinzel', "8px 'Press Start 2P'"].map(f => document.fonts.load(f))).catch(() => {}), new Promise(r => setTimeout(r, 2500))]).then(() => {
  const i = MS.MACHINES.findIndex(x => x.id === opts.derniere);
  ouvrir(MS.MACHINES[i >= 0 && ouverte(i) ? i : 0]);
  montrer('eTitre'); requestAnimationFrame(boucle);
});

window.Romet = { get partie() { return partie; }, get machine() { return m; }, get menu() { return menu; }, prog, ouvrir, nouvelle, lacher: x => lacher(x), MACHINES: MS.MACHINES };
})();

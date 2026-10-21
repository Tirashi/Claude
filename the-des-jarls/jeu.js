/* =====================================================================
   LE THÉ DES JARLS · la PAGE : écrans, dessin, toucher, sauvegarde.
   Les règles sont dans regles.js, l'ordinateur dans ia.js, le décor et les
   soldats (maquette 4) dans decor.js. Ici : la mise en page du téléphone
   (seul : bataille en haut, dés en bas ; à deux : téléphone à plat, les dés
   de chacun de son côté, ceux du haut tournés vers l'autre joueur), la
   chronologie de la bataille montrée événement par événement, les menus.
   Sauvegarde : jarls.run (la partie en cours), jarls.faveurs (dernier choix),
   jarls.vaincus (dieux battus, pour la campagne de la session 3).
   Pour les tests : window.Jarls.
   ===================================================================== */
'use strict';
const SAUVE = 'jarls.run', K_FAV = 'jarls.faveurs', K_VAINCUS = 'jarls.vaincus', K_NIV = 'jarls.niveau';
const lire = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const ecrire = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* stockage plein ou bloqué */ } };
const $ = id => document.getElementById(id);
const horloge = () => performance.now() / 1000;
const CINZEL = 'Cinzel, Georgia, serif', FRED = 'Fredoka, system-ui, sans-serif';
const ROMAIN = ['', 'I', 'II', 'III'];
// le style de chaque dieu, en deux mots (écran du choix de l'adversaire)
const STYLE_DIEU = {
  thrymr: 'le voleur de faveurs', var: 'se nourrit de tes dépenses', freyja: 'des dés en plus', frigg: 'relance tes dés', loki: 'le tricheur',
  tyr: 'le sacrifice', vidar: 'brise les casques', ullr: "l'archer", baldr: "l'invulnérable", brunhild: 'la furie des haches', freyr: 'la moisson',
  skadi: 'la chasseresse', heimdall: 'le gardien', hel: 'boit tes blessures', mimir: 'la sagesse', bragi: 'le beau parleur', skuld: 'la dette',
  thor: 'la foudre', idunn: 'les pommes de jouvence', odin: 'le père de tous',
};
const NOMS_DUO = ['JARL BLEU', 'JARL ROUGE'];

/* ---------- état ---------- */
let E = null;        // la partie (regles.js)
let V = null;        // la vue : soldats, dés animés, bataille en cours
let pause = false;
const cfg = { duo: false, dieu: 'thor', niveau: lire(K_NIV, 2), faveurs: [null, null] };

function nouvelleVue() {
  V = { sold: [0, 1].map(() => Array.from({ length: 45 }, () => ({ mort: null, rel: -9 }))), desT: [[], []], show: E.camps.map(c => ({ pv: c.pv, jetons: c.jetons })),
    anim: null, sel: [null, null], info: null, iaT: 0, cle: '', flash: null };
  for (const i of [0, 1]) { const vivants = Math.min(45, 3 * E.camps[i].pv); V.sold[i].forEach((s, k) => { if (k >= vivants) s.mort = -9; }); }
}
function sauver() { if (E && !E.fin) ecrire(SAUVE, { E, duo: cfg.duo, dieu: cfg.dieu, niveau: cfg.niveau }); }
const nomCamp = i => cfg.duo ? NOMS_DUO[i] : i === 0 ? 'TOI' : E.camps[1].nom.toUpperCase();
const humain = i => !E.camps[i].ia;

/* ---------- démarrage d'un duel ---------- */
function demarrer(graine) {
  const g = graine || (Date.now() % 2147483647);
  const j0 = { nom: cfg.duo ? 'Jarl bleu' : 'Toi', faveurs: cfg.faveurs[0] };
  const j1 = cfg.duo ? { nom: 'Jarl rouge', faveurs: cfg.faveurs[1] } : jarAdversaire(cfg.dieu, cfg.niveau);
  E = jarNouvelle(g, [j0, j1], cfg.duo ? 'duo' : 'libre');
  nouvelleVue(); pause = false; montrer(null); sauver(); redim();
}
function reprendre(s) {
  const e = jarMigrer(s && s.E);
  if (!e) { ecrire(SAUVE, null); return false; }
  E = e; cfg.duo = !!s.duo; cfg.dieu = s.dieu || 'thor'; cfg.niveau = s.niveau || 2;
  nouvelleVue();
  if (E.phase === 'bataille') lancerBataille(horloge());
  else if (E.phase === 'bilan') { jarSuivante(E); sauver(); }
  montrer(null); redim(); return true;
}

/* ---------- mise en page ---------- */
const cv = $('cv'), g = cv.getContext('2d');
let W = 0, H = 0, dpr = 1, L = null, decor = null;
function redim() {
  const r = cv.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height);
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  if (!W || !H) return;
  const duo = cfg.duo;
  if (duo) {
    const ph = Math.round(Math.min(H * 0.34, 250));
    L = { duo, hud: null, champ: { y: ph, h: H - 2 * ph }, pan: [{ y: H - ph, h: ph, rot: false }, { y: 0, h: ph, rot: true }] };
  } else {
    const hud = 42, ch = Math.round(Math.min(H * 0.47, W * 1.05));
    L = { duo, hud: { y: 0, h: hud }, champ: { y: hud, h: ch }, pan: [{ y: hud + ch, h: H - hud - ch, rot: false }, null] };
  }
  L.pan.forEach(p => { if (p) p.z = zones(p.h, duo); });
  L.pauseB = duo ? { x: 6, y: L.champ.y + L.champ.h / 2 - 16, w: 34, h: 32 } : { x: W / 2 - 17, y: 6, w: 34, h: 30 };
  // le champ de bataille : UW pixels de sprite sur toute la largeur
  const u = W * dpr / UW, UH = Math.ceil(L.champ.h * dpr / u);
  decor = { u, UH, fond: fondA(u, UH), avant: avantA(u, UH) };
}
// zones d'un panneau (coordonnées locales : 0..W, 0..h ; le haut est du côté de la bataille)
function zones(h, duo) {
  const z = {}, gap = 10;
  let y = 6;
  if (duo) { z.hud = { x: 0, y: 0, w: W, h: 26 }; y = 30; }
  const BH = 42, FH = 52;
  if (duo) {
    const s = Math.max(30, Math.min(50, (W - 7 * 8) / 6, h - y - FH - BH - 3 * gap - 6)), x0 = (W - 6 * s - 5 * 8) / 2;
    z.des = Array.from({ length: 6 }, (_, i) => ({ x: x0 + i * (s + 8), y: y + 6, s }));
    y += s + 12 + gap;
  } else {
    const s = Math.max(34, Math.min(62, (W - 4 * 14) / 3, (h - y - FH - BH - 3 * gap - 22) / 2)), x0 = (W - 3 * s - 2 * 14) / 2;
    z.des = Array.from({ length: 6 }, (_, i) => ({ x: x0 + (i % 3) * (s + 14), y: y + 10 + Math.floor(i / 3) * (s + 12), s }));
    y += 2 * s + 12 + 18 + gap;
  }
  const rest = h - y - FH - BH - gap, pad = Math.max(0, rest / 2);
  const fw = (W - 24 - 16) / 3;
  z.fav = [0, 1, 2].map(k => ({ x: 12 + k * (fw + 8), y: y + pad * 0.6, w: fw, h: FH }));
  const by = y + pad * 0.6 + FH + gap + pad * 0.4, bw = (W - 24 - 10) / 2;
  z.b1 = { x: 12, y: by, w: bw, h: BH }; z.b2 = { x: 12 + bw + 10, y: by, w: bw, h: BH };
  return z;
}
window.addEventListener('resize', () => { if (E) redim(); });

/* ---------- les soldats suivent les PV ---------- */
function soldats(i, pv, now, front) {
  const S = V.sold[i], vise = Math.max(0, Math.min(45, 3 * pv));
  let vivants = S.filter(s => s.mort === null).length;
  if (vise < vivants) {
    let v = S.map((s, k) => k).filter(k => S[k].mort === null);
    if (!front) v = v.map(k => [k, Math.sin(k * 91.7 + now * 13) % 1]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
    v.slice(0, vivants - vise).forEach(k => { S[k].mort = now; });
  } else if (vise > vivants) {
    S.filter(s => s.mort !== null).sort((a, b) => b.mort - a.mort).slice(0, vise - vivants).forEach(s => { s.mort = null; s.rel = now; });
  }
}

/* ---------- la bataille, événement par événement ---------- */
function lancerBataille(now) {
  const ev = jarBataille(E), ph = [];
  let t = 0.35;
  const add = (o, d, coup) => { o.t = t; o.d = d; o.coup = coup == null ? d * 0.5 : coup; ph.push(o); t += d; };
  const N = i => nomCamp(i);
  for (const e of ev) {
    const F = e.id && JAR_FAVEURS[e.id];
    switch (e.t) {
      case 'or': add({ nom: 'jetons', e, qui: e.qui, txt: `${N(e.qui)} : +${e.n} JETON${e.n > 1 ? 'S' : ''}\nFACES DORÉES` }, 0.9, 0.2); break;
      case 'faveur':
        if (e.ok) add({ nom: 'dieu', e, qui: e.qui, id: e.id, txt: `${N(e.qui)} INVOQUE ${F.dieu.toUpperCase()}\n${F.nom.toUpperCase()} ${ROMAIN[e.niv]}` }, F.quand === 'apres' ? 1.1 : 1.6, 0.3);
        else add({ nom: 'texte', e, txt: `${F.nom.toUpperCase()} RATÉE\n${N(e.qui)} N'A PLUS ASSEZ DE JETONS` }, 1.4, 0.2);
        break;
      case 'thrymr': add({ nom: 'texte', e, txt: e.a ? `THRYMR AFFAIBLIT\n${JAR_FAVEURS[e.cible].nom.toUpperCase()} : ${ROMAIN[e.de]} → ${ROMAIN[e.a]}` : `THRYMR VOLE\n${JAR_FAVEURS[e.cible].nom.toUpperCase()}` }, 1.4); break;
      case 'freyja': add({ nom: 'texte', e, txt: `FREYJA OFFRE ${e.faces.length} DÉ${e.faces.length > 1 ? 'S' : ''}\n${e.faces.map(f => f.toUpperCase()).join(' · ').replace(/FLECHE/g, 'FLÈCHE')}` }, 1.4); break;
      case 'frigg': add({ nom: 'texte', e, txt: `FRIGG RELANCE ${e.faces.length} DÉS\n${e.faces.map(f => f.toUpperCase()).join(' · ').replace(/FLECHE/g, 'FLÈCHE')}` }, 1.4); break;
      case 'loki': add({ nom: 'texte', e, txt: `LOKI ÉCARTE\n${e.faces.map(f => f.toUpperCase()).join(' · ').replace(/FLECHE/g, 'FLÈCHE')}` }, 1.4); break;
      case 'tyr': add({ nom: 'texte', e, txt: `TYR : ${N(e.qui)} SACRIFIE 1 PV\n${N(1 - e.qui)} PERD ${e.n} JETON${e.n > 1 ? 'S' : ''}` }, 1.4); break;
      case 'fleches': add({ nom: 'fleches', e, att: e.att, def: e.def, txt: `VOLÉE DE FLÈCHES\n${N(0)} −${e.dmg[0]}   ${N(1)} −${e.dmg[1]}` }, 1.8, 1.15); break;
      case 'haches': add({ nom: 'haches', e, att: e.att, def: e.def, front: true, txt: `CHARGE DES HACHES\n${N(0)} −${e.dmg[0]}   ${N(1)} −${e.dmg[1]}` }, 1.8, 0.9); break;
      case 'soin': add({ nom: 'soin', e, qui: e.qui, txt: `${JAR_FAVEURS[e.raison].dieu.toUpperCase()} : ${N(e.qui)} +${e.n} PV` }, 1.3, 0.4); break;
      case 'jetons': add({ nom: 'jetons', e, qui: e.qui, txt: `${JAR_FAVEURS[e.raison].dieu.toUpperCase()} : ${N(e.qui)} +${e.n} JETONS` }, 1.1, 0.3); break;
      case 'perte': add({ nom: 'texte', e, txt: `SKULD : ${N(e.qui)} PERD ${e.n} JETON${e.n > 1 ? 'S' : ''}` }, 1.1, 0.3); break;
      case 'vol': add({ nom: 'mains', e, att: e.att, txt: `LES ÉCLAIREURS VOLENT\n${N(0)} +${e.v[0]}   ${N(1)} +${e.v[1]}` }, 1.4, 0.9); break;
      case 'thor': add({ nom: 'foudre', e, qui: e.qui, txt: `FOUDRE DE THOR\n${N(1 - e.qui)} −${e.n}` }, 1.8, 0.95); break;
      case 'idunn': add({ nom: 'soin', e, qui: e.qui, txt: `POMMES D'IDUNN\n${N(e.qui)} +${e.n} PV` }, 1.6, 0.5); break;
      case 'odin': add({ nom: 'texte', e, txt: `ODIN : ${N(e.qui)} SACRIFIE ${e.pv} PV\nET GAGNE ${e.n} JETONS` }, 1.5); break;
      case 'hiver': add({ nom: 'hiver', e, txt: `L'HIVER MORD\nCHAQUE ARMÉE −${e.n} PV` }, 1.6, 0.8); break;
      case 'fin': add({ nom: 'fin', e, txt: '' }, 0.6, 0); break;
    }
  }
  if (ph.length <= 1) ph.unshift({ nom: 'texte', t: 0.2, d: 1.2, coup: 0, txt: 'AUCUN COUP PORTÉ' });
  V.anim = { t0: now, ph, fin: now + t + 0.5 };
  sauver();
}
function phaseEnCours(now) {
  const A = V.anim; if (!A) return null;
  for (const p of A.ph) { const s = now - A.t0 - p.t; if (s >= 0 && s < p.d) return { p, s, u: s / p.d }; }
  return null;
}
function majBataille(now) {
  const A = V.anim; if (!A) return;
  for (const p of A.ph) {
    if (!p.fait && now >= A.t0 + p.t + p.coup) {
      p.fait = true;
      if (p.e && p.e.etat) { V.show = p.e.etat.map(x => Object.assign({}, x)); for (const i of [0, 1]) soldats(i, V.show[i].pv, now, p.front); }
    }
  }
  if (now < A.fin) return;
  V.anim = null;
  V.show = E.camps.map(c => ({ pv: c.pv, jetons: c.jetons }));
  if (E.phase === 'fin') { finDuel(); return; }
  jarSuivante(E); V.sel = [null, null]; V.flash = { txt: `MANCHE ${E.manche}`, t: now };
  sauver();
}

/* ---------- les actions ---------- */
function action(f) { if (pause || V.anim || E.fin) return false; const ok = f(); if (ok) apres(); return ok; }
function apres() {
  const now = horloge();
  if (E.phase === 'bataille') { lancerBataille(now); return; }
  sauver();
}
function lancer(i) {
  return action(() => {
    const avant = E.camps[i].des.map(d => d.garde);
    if (!jarLancer(E, i)) return false;
    const now = horloge(); avant.forEach((gd, j) => { if (!gd) V.desT[i][j] = now; });
    V.info = null; return true;
  });
}
function choisirFaveur(i) {
  return action(() => { const s = V.sel[i]; const ok = jarChoisir(E, i, s && s.id, s && s.niv); if (ok) V.sel[i] = null; return ok; });
}
// l'ordinateur joue à son rythme
function tourIa(now) {
  if (pause || V.anim || E.fin || (E.phase !== 'lancer' && E.phase !== 'faveur')) return;
  const c = E.camps[E.tour]; if (!c || !c.ia) return;
  const cle = E.phase + E.tour + c.lancers;
  if (cle !== V.cle) { V.cle = cle; V.iaT = now + (E.phase === 'faveur' ? 1.0 : c.lancers ? 0.9 : 0.7); return; }
  if (now < V.iaT) return;
  const avant = c.des.map(d => d.garde);
  if (jarIaJouer(E)) {
    avant.forEach((gd, j) => { if (!gd && c.lancers) V.desT[1][j] = now; });
    V.cle = ''; apres();
  }
}

/* ---------- le toucher ---------- */
const dans = (x, y, r, m = 0) => r && x >= r.x - m && x <= r.x + r.w + m && y >= r.y - m && y <= r.y + r.h + m;
cv.addEventListener('pointerdown', e => {
  if (!E || !L) return;
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (dans(x, y, L.pauseB, 6)) { ouvrirPause(); return; }
  for (const i of [0, 1]) {
    const P = L.pan[i]; if (!P || !humain(i)) continue;
    if (y < P.y || y > P.y + P.h) continue;
    const lx = P.rot ? W - x : x, ly = P.rot ? P.y + P.h - y : y - P.y;
    toucherPanneau(i, P.z, lx, ly);
    return;
  }
  V.info = null;
});
function toucherPanneau(i, z, x, y) {
  if (V.info && V.info.qui === i) { V.info = null; return; }
  const c = E.camps[i], tour = E.tour === i && !V.anim && !E.fin;
  for (let j = 0; j < 6; j++) {
    const d = z.des[j];
    if (dans(x, y, { x: d.x, y: d.y, w: d.s, h: d.s }, 6)) { if (tour && E.phase === 'lancer') action(() => jarGarder(E, i, j)); return; }
  }
  for (let k = 0; k < 3; k++) {
    if (!dans(x, y, z.fav[k], 3)) continue;
    const id = c.faveurs[k];
    if (tour && E.phase === 'faveur') {
      const s = V.sel[i]; V.sel[i] = !s || s.id !== id ? { id, niv: 1 } : s.niv < 3 ? { id, niv: s.niv + 1 } : null;
    } else V.info = { qui: i, id };
    return;
  }
  if (dans(x, y, z.b1)) {
    if (tour && E.phase === 'lancer' && jarPeutLancer(E, i)) lancer(i);
    else if (tour && E.phase === 'faveur') { V.sel[i] = null; choisirFaveur(i); }
    return;
  }
  if (dans(x, y, z.b2)) {
    if (tour && E.phase === 'lancer') action(() => jarFinir(E, i));
    else if (tour && E.phase === 'faveur' && V.sel[i]) choisirFaveur(i);
  }
}

/* ---------- dessin ---------- */
function rrect(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function texte(t, x, y, o = {}) {
  g.font = `${o.poids || 900} ${o.taille || 13}px ${o.police || CINZEL}`; g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
  let tx = t, max = o.max || 0;
  if (max) { while (g.measureText(tx).width > max && tx.length > 3) tx = tx.slice(0, -2) + '…'; }
  if (o.ombre !== false) { g.fillStyle = 'rgba(0,0,0,.75)'; g.fillText(tx, x + 1, y + 1.5); }
  g.fillStyle = o.coul || '#ffe3a0'; g.fillText(tx, x, y);
}
function lignes(t, x, y, o = {}) { const L2 = String(t).split('\n'), lh = o.lh || 18; L2.forEach((l, k) => texte(l, x, y + k * lh, o)); }
function enveloppe(t, max, taille, police) {
  g.font = `400 ${taille}px ${police}`; const mots = t.split(' '), out = []; let l = '';
  for (const m of mots) { const essai = l ? l + ' ' + m : m; if (g.measureText(essai).width > max && l) { out.push(l); l = m; } else l = essai; }
  if (l) out.push(l); return out;
}
function pips(x, y, pv, droite) {
  for (let k = 0; k < 15; k++) {
    const px = droite ? x - (k % 8) * 8 - 6 : x + (k % 8) * 8, py = y + Math.floor(k / 8) * 9;
    g.fillStyle = k < pv ? '#c9d0d8' : '#3a3f4c'; rrect(px, py, 6, 7, 2); g.fill();
    if (k < pv) { g.fillStyle = '#6d7580'; g.fillRect(px, py + 5, 6, 2); }
  }
}
function jeton(x, y, n, droite) {
  const gr = g.createRadialGradient(x - 1.5, y - 1.5, 0.5, x, y, 5.5); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.55, '#e8b030'); gr.addColorStop(1, '#9a6a10');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, 5.5, 0, 7); g.fill();
  texte(String(n), droite ? x - 10 : x + 10, y + 1, { align: droite ? 'right' : 'left', taille: 13, police: FRED, poids: 600, coul: '#f3d58c' });
}
function hudSolo() {
  const y = L.hud.y, h = L.hud.h, gr = g.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, '#0b0e1c'); gr.addColorStop(1, '#121628'); g.fillStyle = gr; g.fillRect(0, y, W, h);
  for (const i of [0, 1]) {
    const d = i === 1, x = d ? W - 10 : 10;
    texte(i === 0 ? 'Toi' : E.camps[1].nom, x, y + 11, { align: d ? 'right' : 'left', taille: 13, max: W / 2 - 60 });
    pips(x, y + 21, V.show[i].pv, d);
    jeton(d ? W - 80 : 80, y + 12, V.show[i].jetons, !d);
  }
  boutonPause();
}
function boutonPause() {
  const b = L.pauseB; g.fillStyle = 'rgba(20,12,6,.6)'; rrect(b.x, b.y, b.w, b.h, 6); g.fill();
  g.fillStyle = '#f3d58c'; g.fillRect(b.x + b.w / 2 - 6, b.y + b.h / 2 - 7, 4, 14); g.fillRect(b.x + b.w / 2 + 2, b.y + b.h / 2 - 7, 4, 14);
}
function bouton(r, label, actif, dore) {
  const gr = g.createLinearGradient(0, r.y, 0, r.y + r.h);
  if (dore && actif) { gr.addColorStop(0, '#c8902c'); gr.addColorStop(1, '#7a4c10'); } else { gr.addColorStop(0, '#80502a'); gr.addColorStop(1, '#4a2a14'); }
  g.globalAlpha = actif ? 1 : 0.4;
  g.fillStyle = '#000'; rrect(r.x, r.y + 2, r.w, r.h, 7); g.fill();
  g.fillStyle = gr; rrect(r.x, r.y, r.w, r.h, 7); g.fill();
  g.strokeStyle = '#2a1a0c'; g.lineWidth = 2; rrect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, 8); g.stroke();
  g.fillStyle = dore && actif ? '#ffd27a' : '#c58a4a'; g.fillRect(r.x + 6, r.y + 1, r.w - 12, 1);
  texte(label, r.x + r.w / 2, r.y + r.h / 2 + 1, { taille: 14, coul: dore && actif ? '#fff4c8' : '#ffe0a0', max: r.w - 10 });
  g.globalAlpha = 1;
}
function carteFaveur(r, id, i, now) {
  const F = JAR_FAVEURS[id], c = E.camps[i], s = V.sel[i], choisi = s && s.id === id, ph = E.phase === 'faveur' && E.tour === i && !V.anim;
  const engage = E.phase !== 'lancer' && c.choix && c.choix.id === id;
  const dispo = c.jetons + (E.phase === 'faveur' ? jarOrDe(c) : 0);
  g.fillStyle = choisi || engage ? 'rgba(90,60,14,.92)' : 'rgba(28,20,12,.82)'; rrect(r.x, r.y, r.w, r.h, 7); g.fill();
  g.strokeStyle = choisi ? '#ffd36b' : engage ? '#c8902c' : ph ? 'rgba(243,213,140,.55)' : 'rgba(243,213,140,.22)'; g.lineWidth = choisi ? 2 : 1.2;
  rrect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1, 7); g.stroke();
  if (ph && !choisi) { g.fillStyle = `rgba(255,214,120,${0.06 + 0.05 * Math.sin(now * 4)})`; rrect(r.x, r.y, r.w, r.h, 7); g.fill(); }
  texte(F.dieu, r.x + r.w / 2, r.y + 13, { taille: 13, max: r.w - 8, coul: choisi ? '#fff4c8' : '#f3d58c' });
  // les trois niveaux : coût en jetons ; le niveau choisi est entouré
  const cw = (r.w - 10) / 3;
  for (let n = 1; n <= 3; n++) {
    const x = r.x + 5 + (n - 1) * cw + cw / 2, y = r.y + r.h - 15, cout = jarCout(id, n), sur = (choisi && s.niv === n) || (engage && c.choix.niv === n);
    if (sur) { g.fillStyle = '#ffd36b'; rrect(x - cw / 2 + 1, y - 9, cw - 2, 18, 5); g.fill(); }
    texte(ROMAIN[n], x - 7, y, { taille: 10, coul: sur ? '#3a2008' : '#c8b088', ombre: !sur });
    texte(String(cout), x + 6, y, { taille: 12, police: FRED, poids: 600, coul: sur ? '#3a2008' : cout <= dispo ? '#f3e6c8' : '#8a7458', ombre: !sur });
  }
}
function panneau(i, P, now) {
  const z = P.z, c = E.camps[i];
  g.save();
  if (P.rot) { g.translate(W, P.y + P.h); g.rotate(Math.PI); } else g.translate(0, P.y);
  // plateau de bois cerclé de fer
  let gr = g.createLinearGradient(0, 0, 0, P.h); gr.addColorStop(0, '#6a4224'); gr.addColorStop(1, '#3a2210'); g.fillStyle = gr; g.fillRect(0, 0, W, P.h);
  for (let y = 6; y < P.h; y += 26) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, y, W, 1.5); g.fillStyle = 'rgba(255,200,140,.08)'; g.fillRect(0, y + 1.5, W, 1); }
  for (let k = 0; k < 30; k++) { g.fillStyle = 'rgba(30,16,6,.18)'; g.fillRect(hash(k + 500 + i * 40) * W, hash(k + 501) * P.h, 8 + hash(k + 502) * 30, 1); }
  g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, W, 5); g.fillStyle = '#6a6a72'; g.fillRect(0, 0, W, 1.5);
  for (let x = 8; x < W; x += 24) { g.fillStyle = '#4a4a52'; g.beginPath(); g.arc(x, 2.5, 1.6, 0, 7); g.fill(); }
  if (z.hud) {
    texte(NOMS_DUO[i], 10, 15, { align: 'left', taille: 13, coul: i ? '#ff9a8a' : '#9ab8ff' });
    pips(116, 8, V.show[i].pv, false);
    jeton(W - 34, 15, V.show[i].jetons, true);
  }
  // les dés
  const tour = E.tour === i && !V.anim && !E.fin;
  c.des.forEach((d, j) => {
    const p = z.des[j], f = jarFace(j, d), t = V.desT[i][j] || -9;
    deA(g, p.x, p.y, p.s, f, d.garde && !c.fini, now - t < 0.5, now);
  });
  // les faveurs
  c.faveurs.forEach((id, k) => carteFaveur(z.fav[k], id, i, now));
  // les boutons
  if (E.phase === 'faveur' && tour) {
    const s = V.sel[i];
    bouton(z.b1, 'AUCUNE', true, false);
    bouton(z.b2, s ? `INVOQUER ${ROMAIN[s.niv]}` : 'INVOQUER', !!s, true);
  } else {
    const peut = tour && jarPeutLancer(E, i);
    bouton(z.b1, `LANCER ${c.lancers}/3`, peut, true);
    bouton(z.b2, 'TOUT GARDER', tour && E.phase === 'lancer' && c.lancers > 0 && !c.fini, false);
  }
  // la fiche d'une faveur
  if (V.info && V.info.qui === i) ficheFaveur(V.info.id, z, P);
  g.restore();
}
function ficheFaveur(id, z, P) {
  const F = JAR_FAVEURS[id], x = 10, w = W - 20, y = 8, h = z.fav[0].y - 14;
  g.fillStyle = 'rgba(14,10,6,.94)'; rrect(x, y, w, h, 9); g.fill(); g.strokeStyle = '#c8902c'; g.lineWidth = 1.5; rrect(x + 0.5, y + 0.5, w - 1, h - 1, 9); g.stroke();
  texte(F.nom, x + w / 2, y + 16, { taille: 15, max: w - 16 });
  const quand = F.quand === 'apres' ? 'Après la bataille (ratée si on t\'a volé tes jetons).' : 'Avant la bataille.';
  let yy = y + 36;
  for (let n = 1; n <= 3; n++) {
    const l = enveloppe(`${ROMAIN[n]} · ${jarCout(id, n)} jetons : ${jarTexte(id, n)}`, w - 24, 14, FRED);
    l.forEach(t => { texte(t, x + 12, yy, { align: 'left', police: FRED, poids: 400, taille: 14, coul: '#f2ede4' }); yy += 18; });
  }
  texte(quand, x + 12, yy + 2, { align: 'left', police: FRED, poids: 400, taille: 13, coul: '#c8bfae', max: w - 24 });
  texte('touche pour fermer', x + w / 2, y + h - 11, { police: FRED, poids: 400, taille: 12, coul: '#8a7c68' });
}
// le message du moment
function message(now) {
  if (V.anim) { const ph = phaseEnCours(now); return ph ? ph.p.txt : ''; }
  if (V.flash && now - V.flash.t < 1.4) return V.flash.txt;
  if (E.fin) return '';
  const i = E.tour, c = E.camps[i], N = nomCamp(i), o = E.camps[1 - i];
  const prep = o.choix ? `\n${nomCamp(1 - i)} PRÉPARE ${JAR_FAVEURS[o.choix.id].dieu.toUpperCase()} ${ROMAIN[o.choix.niv]}` : o.choix === null && E.phase === 'faveur' ? `\n${nomCamp(1 - i)} N'INVOQUE PERSONNE` : '';
  if (E.phase === 'lancer') {
    if (c.ia) return `${N} LANCE SES DÉS…`;
    if (cfg.duo) return c.lancers ? `${N} : TOUCHE UN DÉ\nPOUR LE GARDER` : `${N} : À TOI`;
    return c.lancers ? 'TOUCHE UN DÉ\nPOUR LE GARDER' : `MANCHE ${E.manche}\nLANCE TES DÉS`;
  }
  if (E.phase === 'faveur') {
    if (c.ia) return `${N} CHOISIT SA FAVEUR…`;
    const d = c.jetons + jarOrDe(c);
    return (cfg.duo ? `${N} : ` : '') + `UNE FAVEUR ? (${d} JETON${d > 1 ? 'S' : ''})` + prep;
  }
  return '';
}
function champ(now) {
  const C = L.champ, u = decor.u, UH = decor.UH, ph = phaseEnCours(now);
  g.save(); g.setTransform(1, 0, 0, 1, 0, C.y * dpr);
  let sx = 0, sy = 0;
  if (ph && ph.p.nom === 'foudre' && ph.u > 0.42 && ph.u < 0.66) { sx = Math.sin(now * 90) * 3 * dpr; sy = Math.cos(now * 77) * 2 * dpr; }
  if (ph && ph.p.nom === 'haches' && ph.u > 0.3 && ph.u < 0.4) sy = Math.sin(now * 80) * 1.5 * dpr;
  g.beginPath(); g.rect(0, 0, W * dpr, C.h * dpr); g.clip();
  g.translate(sx, sy); g.drawImage(decor.fond, 0, 0);
  g.save(); g.scale(u, u);
  g.fillStyle = 'rgba(255,236,190,.7)';
  for (let k = 0; k < 10; k++) { const q = (now * 1.5 + k * 0.37) % 1; if (q > 0.6) continue; g.fillRect(UW * 0.6 + hash(k) * UW * 0.18, UH * 0.47 + 1 + hash(k + 9) * 5, 1 + hash(k + 4) * 3, 0.4); }
  scene(now, UH, ph);
  g.restore();
  const Wd = W * dpr, Hd = C.h * dpr;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,214,150,${0.04 + 0.025 * Math.sin(now * 0.7 + k * 2)})`; g.beginPath(); g.moveTo(Wd * 0.68, Hd * 0.45); g.lineTo(Wd * (0.05 + k * 0.25), Hd); g.lineTo(Wd * (0.16 + k * 0.25), Hd); g.fill(); }
  g.restore();
  for (let k = 0; k < 3; k++) { const mx = ((now * 5 * (k + 1) + k * 90) % (W + 180) - 90) * dpr, my = Hd * (0.6 + k * 0.1), rg = g.createRadialGradient(mx, my, 0, mx, my, 95 * dpr); rg.addColorStop(0, 'rgba(225,230,245,.2)'); rg.addColorStop(1, 'rgba(225,230,245,0)'); g.fillStyle = rg; g.fillRect(mx - 95 * dpr, my - 35 * dpr, 190 * dpr, 70 * dpr); }
  for (let k = 0; k < 14; k++) { const px = ((k * 47 + now * 7 * (1 + k % 3)) % W) * dpr, py = (C.h * 0.35 + ((k * 31 + Math.sin(now + k) * 9) % (C.h * 0.55))) * dpr, a = 0.4 + 0.4 * Math.sin(now * 3 + k); g.fillStyle = `rgba(255,236,170,${a})`; g.beginPath(); g.arc(px, py, (1 + (k % 3) * 0.5) * dpr, 0, 7); g.fill(); }
  if (ph && ph.p.nom === 'hiver') { for (let k = 0; k < 90; k++) { const fx = (hash(k + 700) * W + Math.sin(now * 2 + k) * 8) * dpr, fy = ((hash(k + 701) * C.h + now * 40 * (0.6 + hash(k + 702))) % C.h) * dpr; g.fillStyle = 'rgba(240,246,255,.85)'; g.fillRect(fx, fy, 1.6 * dpr, 1.6 * dpr); } g.fillStyle = `rgba(200,220,255,${0.18 * Math.sin(ph.u * Math.PI)})`; g.fillRect(0, 0, Wd, Hd); }
  g.drawImage(decor.avant, 0, 0);
  g.restore();
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  // seul : les dés du dieu, sur une planche au-dessus du champ de bataille
  if (!cfg.duo) {
    const e = E.camps[1], ps = 18, ex = W - 6 * (ps + 3) - 8, y = C.y + 4;
    g.fillStyle = 'rgba(20,12,6,.55)'; rrect(ex - 6, y, 6 * (ps + 3) + 10, ps + 8, 6); g.fill();
    e.des.forEach((dd, j) => { const t = V.desT[1][j] || -9; deA(g, ex + j * (ps + 3), y + 4, ps, jarFace(j, dd), false, now - t < 0.5, now, true); });
    if (e.choix && !V.anim) texte(`${JAR_FAVEURS[e.choix.id].dieu} ${ROMAIN[e.choix.niv]}`, ex - 12, y + 4 + ps / 2, { align: 'right', taille: 12 });
  }
  // le message
  const m = message(now);
  if (m) {
    if (cfg.duo) {
      lignes(m, W / 2, C.y + C.h - 40, { taille: 14 });
      g.save(); g.translate(W / 2, C.y + 22); g.rotate(Math.PI); lignes(m, 0, -18 * (m.split('\n').length - 1), { taille: 14 }); g.restore();
    } else lignes(m, W / 2, C.y + 44, { taille: 14 });
  }
  if (cfg.duo) boutonPause();
}
// les soldats et les effets de la bataille (repris de la maquette 4)
function scene(now, UH, ph) {
  const gy = UH * 0.83;
  g.imageSmoothingEnabled = false;
  drakkar(g, UW / 2 + 3 + Math.sin(now * 0.05) * 4, Math.round(UH * 0.47) + 5, now);
  for (let k = 0; k < 7; k++) { const q = ((now * 0.25 + k / 7) % 1); g.fillStyle = `rgba(200,200,210,${0.35 * (1 - q)})`; g.beginPath(); g.arc(UW / 2 - 19 + Math.sin(q * 6 + k) * 2 + q * 6, UH * 0.47 - 11 - q * 20, 0.8 + q * 2.2, 0, 7); g.fill(); }
  for (let k = 0; k < 3; k++) { const bx = ((now * 7 + k * 40) % (UW + 40)) - 20, by = 18 + k * 6 + Math.sin(now * 2 + k) * 2, a = Math.floor(now * 6 + k) % 2; g.fillStyle = '#1a1a2a'; g.fillRect(bx, by, 1, 1); g.fillRect(bx - 1, by - 1 + a, 1, 1); g.fillRect(bx + 1, by - 1 + a, 1, 1); }
  for (const s of [0, 1]) for (const c of [0, 1, 2]) { const p = posA(s, c * 15 + 5, UH); banniere(g, p.x + (s ? -1 : 1) * -4, p.y - 2, s, now + c); }
  const items = [];
  for (const s of [0, 1]) V.sold[s].forEach((sd, i) => { if (sd.mort !== null && now - sd.mort > 30) return; items.push(Object.assign({ s, i, sd }, posA(s, i, UH))); });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    const { s, sd, r, k, d } = it, dir = s ? -1 : 1, o = 1 - s;
    let x = it.x, y = it.y, pose = '', ang = 0;
    // les poses et déplacements ne s'appliquent qu'aux soldats vivants (leçon de la maquette 4)
    if (ph && sd.mort === null) {
      const { p, u } = ph;
      if (p.nom === 'haches' && p.att[s] && r === 0) { x += dir * Math.sin(Math.min(1, u * 1.6) * Math.PI) * 24; pose = 'charge'; }
      if (p.nom === 'haches' && p.att[o] && p.def[s] && r < 2 && !pose) pose = 'garde';
      if (p.nom === 'fleches' && p.att[s] && r === 2 && u < 0.7) pose = 'tir';
      if (p.nom === 'fleches' && p.att[o] && p.def[s] && r < 2 && u > 0.1) pose = 'bouclier';
    }
    if (sd.mort !== null) { const q = sd.mort < 0 ? 1 : Math.min(1, (now - sd.mort) / 0.4); ang = q * Math.PI / 2; if (q < 1) y -= Math.sin(q * Math.PI) * 4; }
    else if (now - sd.rel < 0.6) ang = (1 - (now - sd.rel) / 0.6) * Math.PI / 2;
    const sp = spriteA(s, r, pose, it.i % 4, d); x = Math.round(x);
    if (ang) { g.save(); g.translate(x, y); g.rotate(-dir * ang); g.globalAlpha = sd.mort !== null ? 0.8 : 1; g.drawImage(sp, -14 * k, -25 * k, 28 * k, 30 * k); g.restore(); }
    else g.drawImage(sp, x - 14 * k, y - 25 * k, 28 * k, 30 * k);
    if (sd.mort !== null && sd.mort > 0 && now - sd.mort < 0.25) { g.fillStyle = '#fff6d0'; const q = (now - sd.mort) * 20; g.fillRect(x - 1, y - 14 - q, 2, 2); g.fillRect(x - 4 - q, y - 12, 2, 1); g.fillRect(x + 3 + q, y - 12, 2, 1); }
  }
  if (!ph) return;
  const { p, u, s: sec } = ph;
  if (p.nom === 'fleches') {
    for (const s of [0, 1]) {
      const n = Math.min(18, p.att[s] * 3);
      for (let j = 0; j < n; j++) {
        const v = Math.min(1, (sec - 0.15 - j * 0.06) / 0.7); if (v < 0) continue;
        const a = posA(s, 30 + (j * 4) % 15, UH), bb = posA(1 - s, (j * 7) % 45, UH), tx = bb.x + (hash(j + s * 9) - 0.5) * 10, ty = bb.y + 2 + hash(j + 3) * 3;
        const pt = w => ({ x: a.x + (tx - a.x) * w, y: a.y - 11 + (ty - a.y + 11) * w - Math.sin(w * Math.PI) * 34 });
        const q0 = pt(Math.max(0, v - 0.05)), q1 = pt(v), dx = q1.x - q0.x, dy = q1.y - q0.y, l = Math.hypot(dx, dy) || 1;
        g.strokeStyle = '#3a2412'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(q1.x - dx / l * 6, q1.y - dy / l * 6); g.lineTo(q1.x, q1.y); g.stroke();
        g.fillStyle = '#f4efe4'; g.fillRect(q1.x - dx / l * 6 - 0.5, q1.y - dy / l * 6 - 0.5, 1, 1);
      }
    }
  }
  if (p.nom === 'haches' && u > 0.22 && u < 0.6) {
    for (let k = 0; k < 8; k++) { const q = (u - 0.22) / 0.38, an = k / 8 * 6.28; g.fillStyle = `rgba(190,170,130,${0.5 * (1 - q)})`; g.beginPath(); g.arc(UW / 2 + Math.cos(an) * q * 14, gy - 3 + Math.sin(an) * q * 4, 2 + q * 4, 0, 7); g.fill(); }
    if (u < 0.45) { const k = Math.floor(now * 24) % 2; g.fillStyle = k ? '#fff6c0' : '#ffd040'; for (let j = 0; j < 5; j++) { const yy = gy - 20 + j * 5; g.fillRect(UW / 2 - 1 + (k ? -2 : 2), yy, 3, 1); g.fillRect(UW / 2 + (k ? 2 : -2), yy - 1, 1, 3); } }
  }
  if (p.nom === 'mains') for (const s of [0, 1]) {
    if (!p.att[s]) continue;
    const dir = s ? -1 : 1, aller = u < 0.5, w = lisse(aller ? u * 2 : 2 - u * 2), x0 = s ? UW - 50 : 50, x1 = s ? 24 : UW - 24, x = Math.round(x0 + (x1 - x0) * w), y = Math.round(gy + 10 + Math.abs(Math.sin(sec * 14)) * -1.5);
    const sp = spriteA(s, 2, '', 1); g.save(); if ((aller ? dir : -dir) !== dir) { g.translate(x, 0); g.scale(-1, 1); g.translate(-x, 0); } g.drawImage(sp, x - 14, y - 25); g.restore();
    if (!aller) { g.fillStyle = '#f2c94c'; g.fillRect(x - 1, y - 30, 3, 3); g.fillStyle = '#fff3b0'; g.fillRect(x - 1, y - 30, 1, 1); }
  }
  if (p.nom === 'dieu' || p.nom === 'foudre' || p.nom === 'soin') {
    const s = p.qui, thor = p.nom === 'foudre' || p.id === 'thor', idunn = p.nom === 'soin' || p.id === 'idunn';
    const cx = thor ? (s ? 48 : UW - 48) : (s ? UW - 48 : 48), a = Math.min(1, u * 3) * Math.min(1, (1 - u) * 4);
    if (thor) { g.fillStyle = `rgba(10,14,40,${0.45 * a})`; g.fillRect(0, 0, UW, UH); for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(40,46,70,${0.8 * a})`; g.beginPath(); g.ellipse(cx - 40 + k * 16, 10 + Math.sin(k * 2) * 4, 16, 6, 0, 0, 7); g.fill(); } }
    const rg = g.createRadialGradient(cx, 30, 2, cx, 30, 44); rg.addColorStop(0, thor ? `rgba(160,210,255,${0.6 * a})` : `rgba(255,230,140,${0.6 * a})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(cx - 50, -20, 100, 100);
    if (thor || idunn) { if (!DIEUX.length) DIEUX.push(spriteDieu(true), spriteDieu(false)); g.globalAlpha = a; g.drawImage(DIEUX[thor ? 0 : 1], Math.round(cx - 22), 4); g.globalAlpha = 1; }
    else {
      // les autres dieux (en attendant leurs portraits, session 3) : une pierre runique qui s'illumine
      g.globalAlpha = a; g.fillStyle = '#2a2a3a'; g.fillRect(cx - 7, 10, 14, 34); g.fillStyle = '#4a4a5c'; g.fillRect(cx - 7, 10, 3, 34);
      g.fillStyle = `rgba(255,220,130,${0.6 + 0.4 * Math.sin(now * 8)})`; const R = RUNES[JAR_IDS.indexOf(p.id) % RUNES.length];
      R.forEach((l, j) => { for (let q = 0; q < 5; q++) if (l[q] === '#') g.fillRect(cx - 5 + q * 2, 14 + j * 2, 2, 2); }); g.globalAlpha = 1;
    }
    if (p.nom === 'foudre' && u > 0.4 && u < 0.64) {
      g.save(); g.shadowColor = '#9fd8ff'; g.shadowBlur = 8;
      for (let k = 0; k < 3; k++) { const t = posA(1 - s, (k * 13 + Math.floor(now * 3) * 7) % 45, UH); g.strokeStyle = '#eef8ff'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx + 8, 8); const kk = Math.floor(now * 24); for (let q = 1; q < 7; q++) { const w = q / 7; g.lineTo(cx + 8 + (t.x - cx - 8) * w + Math.sin(kk * 7.3 + q * 13.1 + k) * 5, 8 + (t.y - 14) * w); } g.lineTo(t.x, t.y - 8); g.stroke(); }
      g.restore(); g.fillStyle = `rgba(230,245,255,${0.45 * (1 - Math.abs(u - 0.5) * 8)})`; g.fillRect(0, 0, UW, UH);
    }
    if (p.nom === 'soin' && u > 0.3) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 22; k++) { const t = posA(s, (k * 7) % 45, UH), yy = t.y - ((u * 50 + k * 7) % 32); g.fillStyle = k % 2 ? 'rgba(255,230,120,.9)' : 'rgba(180,255,150,.9)'; g.fillRect(t.x + Math.sin(k + now * 3) * 4, yy, 1, 1); } g.restore(); }
  }
}
// petites runes 5×13 (pierre des dieux sans portrait)
const RUNES = [
  ['..#..', '..#..', '#.#.#', '.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  ['#....', '##...', '#.#..', '#..#.', '#.#..', '##...', '#....', '#....', '#....', '#....', '#....', '#....', '#....'],
  ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#'],
  ['..#..', '.#.#.', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..', '..#..'],
];

function dessiner(now) {
  if (!E || !L || !decor) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#121628'; g.fillRect(0, 0, W, H);
  champ(now);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (L.hud) hudSolo();
  for (const i of [0, 1]) if (L.pan[i]) panneau(i, L.pan[i], now);
}
function boucle() {
  const now = horloge();
  try { if (E && !pause) { majBataille(now); tourIa(now); } dessiner(now); }
  catch (e) {
    // une erreur au milieu du dessin laisse des save() sans restore() : on repart d'un contexte propre (sinon tout s'empile, image après image)
    console.error(e);
    if (g.reset) g.reset(); else { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; }
  }
  requestAnimationFrame(boucle);
}

/* ---------- menus ---------- */
const ECRANS = ['eTitre', 'eDieu', 'eFaveurs', 'ePause', 'eFin', 'eAide'];
let retourAide = 'eTitre';
function montrer(id) { ECRANS.forEach(k => { $(k).hidden = k !== id; }); }
function ecranTitre() {
  E = null; pause = false; montrer('eTitre');
  $('bContinuer').hidden = !lire(SAUVE, null);
}
function ouvrirPause() { pause = true; if (V) V.pauseT = horloge(); montrer('ePause'); }   // la bataille attend pendant la pause
function finDuel() {
  const f = E.fin, g0 = f.gagnant;
  ecrire(SAUVE, null);
  let t, s;
  if (cfg.duo) { t = g0 < 0 ? 'ÉGALITÉ' : `${NOMS_DUO[g0]} GAGNE !`; s = `En ${f.manche} manche${f.manche > 1 ? 's' : ''}.`; }
  else if (g0 === 0) {
    t = 'VICTOIRE !'; s = `${E.camps[1].nom} est vaincu en ${f.manche} manche${f.manche > 1 ? 's' : ''}. Il te reste ${E.camps[0].pv} PV.`;
    const v = lire(K_VAINCUS, {}); v[cfg.dieu] = Math.max(v[cfg.dieu] || 0, cfg.niveau); ecrire(K_VAINCUS, v);
  } else if (g0 === 1) { t = 'DÉFAITE'; s = `${E.camps[1].nom} t'a vaincu en ${f.manche} manche${f.manche > 1 ? 's' : ''}.`; }
  else { t = 'ÉGALITÉ'; s = 'Les deux armées sont tombées ensemble.'; }
  $('tFin').textContent = t; $('sFin').textContent = s;
  $('eFin').classList.toggle('retourne', cfg.duo && g0 === 1);
  setTimeout(() => { if (E && E.fin) montrer('eFin'); }, 600);
}
// choix de l'adversaire
function ecranDieu() {
  const v = lire(K_VAINCUS, {});
  $('listeDieux').innerHTML = JAR_IDS.map(id => `<button data-d="${id}" class="${v[id] ? 'vaincu' : ''}">${JAR_FAVEURS[id].dieu}<small>${STYLE_DIEU[id]}</small></button>`).join('');
  [...$('niveaux').children].forEach(b => b.classList.toggle('choisi', Number(b.dataset.n) === cfg.niveau));
  montrer('eDieu');
}
$('niveaux').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cfg.niveau = Number(b.dataset.n); ecrire(K_NIV, cfg.niveau); ecranDieu(); });
$('listeDieux').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cfg.dieu = b.dataset.d; cfg.duo = false; ecranFaveurs(0); });
// choix des trois faveurs
let qui = 0, pris = [];
function ecranFaveurs(i) {
  qui = i;
  const dernier = lire(K_FAV, null);
  pris = cfg.faveurs[i] ? cfg.faveurs[i].slice() : i === 0 && Array.isArray(dernier) && dernier.length === 3 ? dernier.slice() : i === 1 ? ['vidar', 'brunhild', 'idunn'] : ['thor', 'idunn', 'vidar'];
  $('tFaveurs').textContent = cfg.duo ? `${NOMS_DUO[i]} : TES FAVEURS` : 'TES TROIS FAVEURS';
  $('sFaveurs').textContent = cfg.duo ? 'Choisis trois faveurs. Ton adversaire ne regarde pas !' : `Contre ${JAR_FAVEURS[cfg.dieu].dieu}, qui emporte : ${JAR_DIEUX[cfg.dieu].deck.map(x => JAR_FAVEURS[x].dieu).join(', ')}.`;
  $('eFaveurs').classList.toggle('retourne', cfg.duo && i === 1);
  majFaveurs(); montrer('eFaveurs');
  $('carteFaveurs').scrollTop = 0;
}
function majFaveurs() {
  $('listeFaveurs').innerHTML = JAR_IDS.map(id => {
    const F = JAR_FAVEURS[id], niv = [1, 2, 3].map(n => `${ROMAIN[n]} · ${jarCout(id, n)} : ${jarTexte(id, n)}`).join('<br>');
    return `<button data-f="${id}" class="${pris.includes(id) ? 'choisi' : ''}"><b>${F.nom}</b><i>${niv}${F.quand === 'apres' ? '<br>Après la bataille.' : ''}</i></button>`;
  }).join('');
  $('bFaveursOk').disabled = pris.length !== 3;
  $('bFaveursOk').textContent = pris.length === 3 ? (cfg.duo && qui === 0 ? 'AU JARL ROUGE' : 'AU COMBAT') : `${pris.length}/3 CHOISIES`;
}
$('listeFaveurs').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return; const id = b.dataset.f;
  if (pris.includes(id)) pris = pris.filter(x => x !== id); else if (pris.length < 3) pris.push(id); else { pris.shift(); pris.push(id); }
  const y = $('carteFaveurs').scrollTop; majFaveurs(); $('carteFaveurs').scrollTop = y;
});
$('bFaveursOk').onclick = () => {
  if (pris.length !== 3) return;
  cfg.faveurs[qui] = pris.slice();
  if (qui === 0 && !cfg.duo) ecrire(K_FAV, pris);
  if (cfg.duo && qui === 0) { ecranFaveurs(1); return; }
  $('eFaveurs').classList.remove('retourne');
  demarrer();
};
$('bFaveursRetour').onclick = () => { $('eFaveurs').classList.remove('retourne'); if (cfg.duo) { if (qui === 1) ecranFaveurs(0); else ecranTitre(); } else ecranDieu(); };
$('bSolo').onclick = () => { cfg.duo = false; cfg.faveurs = [null, null]; ecranDieu(); };
$('bDuo').onclick = () => { cfg.duo = true; cfg.faveurs = [null, null]; ecranFaveurs(0); };
$('bDieuRetour').onclick = ecranTitre;
$('bContinuer').onclick = () => { if (!reprendre(lire(SAUVE, null))) ecranTitre(); };
$('bAide').onclick = () => { retourAide = 'eTitre'; montrer('eAide'); };
$('bAideP').onclick = () => { retourAide = 'ePause'; montrer('eAide'); };
$('bAideOk').onclick = () => montrer(retourAide);
$('bReprendre').onclick = () => { pause = false; montrer(null); if (V && V.anim) { const d = horloge() - V.pauseT; V.anim.t0 += d; V.anim.fin += d; } };
$('bAbandon').onclick = () => { ecrire(SAUVE, null); ecranTitre(); };
$('bRevanche').onclick = () => { $('eFin').classList.remove('retourne'); demarrer(); };
$('bFinTitre').onclick = () => { $('eFin').classList.remove('retourne'); ecranTitre(); };

/* ---------- pour les tests ---------- */
window.Jarls = {
  etat: () => E, vue: () => V, cfg,
  // démarre un duel sans passer par les menus : { duo, dieu, niveau, faveurs: [[3], [3]], graine }
  duel(o = {}) { cfg.duo = !!o.duo; cfg.dieu = o.dieu || 'thor'; cfg.niveau = o.niveau || 2; cfg.faveurs = o.faveurs || [['thor', 'idunn', 'vidar'], ['vidar', 'brunhild', 'idunn']]; demarrer(o.graine); return E; },
  lancer, garder: (i, j) => action(() => jarGarder(E, i, j)), finir: i => action(() => jarFinir(E, i)),
  faveur(i, id, niv) { V.sel[i] = id ? { id, niv } : null; return choisirFaveur(i); },
  // saute l'animation de la bataille en cours
  accelerer() { if (V && V.anim) { const d = V.anim.fin - horloge() + 0.01; V.anim.t0 -= d; V.anim.fin -= d; } },
  titre: ecranTitre,
};

document.fonts && document.fonts.ready.then(() => { if (E) redim(); });
ecranTitre();
requestAnimationFrame(boucle);

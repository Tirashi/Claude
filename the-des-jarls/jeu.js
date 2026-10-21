/* =====================================================================
   LE THÉ DES JARLS · la PAGE : écrans, dessin, toucher, sauvegarde.
   Règles : regles.js ; ordinateur : ia.js ; campagne et défi du jour :
   campagne.js ; décor et soldats (maquette 4) : decor.js ; portraits et
   médaillons : dieux.js ; sons : sons.js ; duel guidé et livre : guide.js.
   Modes : campagne (route du fjord), jour (défi du jour), libre (un dieu au
   choix), duo (téléphone à plat), guide (premier duel avec Sigrid), rejeu
   (défi du jour déjà joué, hors classement).
   Sauvegarde : jarls.run (duel en cours hors défi du jour), jarls.dailyRun,
   jarls.dailyTry { j }, jarls.daily { AAAAMMJJ: score }, jarls.campagne
   (étoiles par dieu, couleur), jarls.faveurs (dernière main), jarls.niveau,
   jarls.guide (duel guidé fini), jarls.parties (astuces des 3 premières
   parties), jarls.sons. Classements : jarls / etoiles, jarls / daily:AAAAMMJJ.
   Pour les tests : window.Jarls.
   ===================================================================== */
'use strict';
const lire = (k, d) => { try { const v = localStorage.getItem('jarls.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const ecrire = (k, v) => { try { v === null ? localStorage.removeItem('jarls.' + k) : localStorage.setItem('jarls.' + k, JSON.stringify(v)); } catch (e) { /* stockage plein ou bloqué */ } };
const $ = id => document.getElementById(id);
const horloge = () => performance.now() / 1000;
const CINZEL = 'Cinzel, Georgia, serif', FRED = 'Fredoka, system-ui, sans-serif';
const ROMAIN = ['', 'I', 'II', 'III'];
const NOMS_DUO = ['JARL BLEU', 'JARL ROUGE'];
const auj = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const STYLE_DIEU = {
  thrymr: 'le voleur de faveurs', var: 'se nourrit de tes dépenses', freyja: 'des dés en plus', frigg: 'relance tes dés', loki: 'le tricheur',
  tyr: 'le sacrifice', vidar: 'brise les casques', ullr: "l'archer", baldr: "l'invulnérable", brunhild: 'la furie des haches', freyr: 'la moisson',
  skadi: 'la chasseresse', heimdall: 'le gardien', hel: 'boit tes blessures', mimir: 'la sagesse', bragi: 'le beau parleur', skuld: 'la dette',
  thor: 'la foudre', idunn: 'les pommes de jouvence', odin: 'le père de tous',
};
// effet résumé des trois niveaux (liste du conseil des jarls)
const COURT = { thor: '2 / 5 / 8 blessures après la bataille', brunhild: 'haches ×1,5 / ×2 / ×3', skadi: '+1 / 2 / 3 flèches par dé flèche', ullr: '2 / 3 / 6 flèches passent les boucliers',
  vidar: 'retire 2 / 4 / 6 casques adverses', freyr: '+2 / 3 / 4 à ta face la plus nombreuse', idunn: '+2 / 4 / 6 PV après la bataille', baldr: '+1 / 2 / 3 défense par casque et bouclier',
  heimdall: '+1 / 2 / 3 PV par attaque parée', hel: '+1 / 2 / 3 PV par blessure de hache', var: '+1 / 2 / 3 PV par jeton dépensé en face', bragi: '+2 / 3 / 4 jetons par main',
  mimir: '+1 / 2 / 3 jetons par PV perdu', odin: '3 PV contre 9 / 12 / 15 jetons', skuld: 'en face : −2 / 3 / 4 jetons par flèche', tyr: '1 PV contre −2 / 3 / 4 jetons en face',
  loki: 'écarte 1 / 2 / 3 dés adverses', frigg: 'relance 2 / 3 / 4 dés adverses', freyja: '1 / 2 / 3 dés de plus', thrymr: 'la faveur adverse perd 1 / 2 / 3 niveaux' };
// les quatre mains toutes prêtes du conseil des jarls
const MAINS = [['LA FOUDRE', ['thor', 'vidar', 'idunn'], 'Frappe fort, se soigne'], ['LE BOUCLIER', ['baldr', 'heimdall', 'idunn'], 'Tient la ligne, se relève'],
  ['LE VOLEUR', ['loki', 'bragi', 'thor'], 'Vole les jetons, puis Thor'], ['LA HORDE', ['brunhild', 'hel', 'vidar'], 'Haches, haches, haches']];
const ORDRE_FAM = ['att', 'def', 'jet', 'ruse'];
const PAR_FAMILLE = JAR_IDS.slice().sort((a, b) => ORDRE_FAM.indexOf(JAR_FAM[a]) - ORDRE_FAM.indexOf(JAR_FAM[b]));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const imgMed = (id, cl = '') => `<img class="med ${cl}" src="${medaillon(id)}" alt="">`;

/* ---------- état ---------- */
let E = null;        // la partie (regles.js)
let V = null;        // la vue : soldats, dés animés, bataille en cours
let pause = false;
let C = jarCampagne(lire('campagne', null));                    // la campagne
// cfg : le duel en cours (mode, dieu, niveau, taverne, faveurs des deux camps)
const cfg = { mode: 'libre', dieu: 'thor', niveau: lire('niveau', 2), taverne: -1, faveurs: [null, null] };
let G = null;        // le duel guidé : { k: n° d'étape } ou null
JarSons.actif(lire('sons', true));

function nouvelleVue() {
  V = { sold: [0, 1].map(() => Array.from({ length: 45 }, () => ({ mort: null, rel: -9 }))), desT: [[], []], show: E.camps.map(c => ({ pv: c.pv, jetons: c.jetons })),
    anim: null, sel: [null, null], info: null, iaT: 0, cle: '', flash: null, rappelT: 0 };
  for (const i of [0, 1]) { const vivants = Math.min(45, 3 * E.camps[i].pv); V.sold[i].forEach((s, k) => { if (k >= vivants) s.mort = -9; }); }
}
const cleSauve = () => cfg.mode === 'jour' ? 'dailyRun' : cfg.mode === 'guide' || cfg.mode === 'rejeu' ? null : 'run';
function sauver() { const k = cleSauve(); if (k && E && !E.fin) ecrire(k, { E, cfg: Object.assign({}, cfg) }); }
const nomCamp = i => cfg.mode === 'duo' ? NOMS_DUO[i] : i === 0 ? 'TOI' : E.camps[1].nom.toUpperCase();
const humain = i => !E.camps[i].ia;
// l'apparence de l'armée du joueur (couleurs et unités gagnées en campagne ; pas à deux)
function appliquerArmee() {
  if (cfg.mode === 'duo' || cfg.mode === 'guide') { ARMEES[0] = null; return; }
  const u = jarUnites(C).map(x => x.id);
  ARMEES[0] = { cle: C.couleur + ':' + u.join(','), coul: JAR_APPARENCES[C.couleur], unites: u };
}

/* ---------- démarrage d'un duel ---------- */
function demarrer(graine) {
  const g = graine || (Date.now() % 2147483647), m = cfg.mode;
  let j0 = { nom: m === 'duo' ? 'Jarl bleu' : 'Toi', faveurs: cfg.faveurs[0] }, j1, o = {};
  if (m === 'duo') j1 = { nom: 'Jarl rouge', faveurs: cfg.faveurs[1] };
  else if (m === 'guide') { j0.faveurs = GUIDE_FAVEURS.slice(); j1 = Object.assign({}, GUIDE_THORGRIM); o = { premier: 0, imposes: GUIDE_IMPOSES }; }
  else j1 = jarAdversaire(cfg.dieu, cfg.niveau);
  E = jarNouvelle(m === 'guide' ? GUIDE_GRAINE : g, [j0, j1], m, o);
  G = m === 'guide' ? { k: 0 } : null;
  appliquerArmee(); nouvelleVue(); pause = false; montrer(null); sauver(); redim();
}
function reprendre(s) {
  const e = jarMigrer(s && s.E);
  if (!e || !s.cfg) return false;
  E = e; Object.assign(cfg, s.cfg); G = null;
  appliquerArmee(); nouvelleVue();
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
  if (!W || !H || !E) return;
  const duo = cfg.mode === 'duo';
  if (duo) {
    const ph = Math.round(Math.min(H * 0.34, 250));
    L = { duo, hud: null, champ: { y: ph, h: H - 2 * ph }, pan: [{ y: H - ph, h: ph, rot: false }, { y: 0, h: ph, rot: true }] };
  } else {
    // seul : la bataille prend ce qu'il faut, le plateau ne dépasse pas 330 px (grand écran : moins de vide)
    const hud = 42, ch = Math.round(Math.max(Math.min(H * 0.47, W * 1.05), H - hud - 330));
    L = { duo, hud: { y: 0, h: hud }, champ: { y: hud, h: ch }, pan: [{ y: hud + ch, h: H - hud - ch, rot: false }, null] };
  }
  L.pan.forEach(p => { if (p) p.z = zones(p.h, duo); });
  L.pauseB = duo ? { x: 6, y: L.champ.y + L.champ.h / 2 - 34, w: 34, h: 30 } : { x: W / 2 - 38, y: 6, w: 34, h: 30 };
  L.aideB = duo ? { x: 6, y: L.champ.y + L.champ.h / 2 + 4, w: 34, h: 30 } : { x: W / 2 + 4, y: 6, w: 34, h: 30 };
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
  const vivants = S.filter(s => s.mort === null).length;
  if (vise < vivants) {
    let v = S.map((s, k) => k).filter(k => S[k].mort === null);
    if (!front) v = v.map(k => [k, Math.sin(k * 91.7 + now * 13) % 1]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
    v.slice(0, vivants - vise).forEach(k => { S[k].mort = now; });
  } else if (vise > vivants) {
    S.filter(s => s.mort !== null).sort((a, b) => b.mort - a.mort).slice(0, vise - vivants).forEach(s => { s.mort = null; s.rel = now; });
  }
}

/* ---------- la bataille, événement par événement ---------- */
const SON_PHASE = { jetons: 'jeton', dieu: 'dieu', fleches: 'fleches', haches: 'haches', mains: 'vol', foudre: 'foudre', soin: 'soin', hiver: 'hiver' };
function lancerBataille(now) {
  const ev = jarBataille(E), ph = [];
  let t = 0.35;
  const add = (o, d, coup) => { o.t = t; o.d = d; o.coup = coup == null ? d * 0.5 : coup; ph.push(o); t += d; };
  const N = i => nomCamp(i), faces = l => l.map(f => f.toUpperCase()).join(' · ').replace(/FLECHE/g, 'FLÈCHE');
  for (const e of ev) {
    const F = e.id && JAR_FAVEURS[e.id];
    switch (e.t) {
      case 'or': add({ nom: 'jetons', e, qui: e.qui, txt: `${N(e.qui)} : +${e.n} JETON${e.n > 1 ? 'S' : ''}\nFACES DORÉES` }, 0.9, 0.2); break;
      case 'faveur':
        if (e.ok) add({ nom: 'dieu', e, qui: e.qui, id: e.id, txt: `${N(e.qui)} INVOQUE ${F.dieu.toUpperCase()}\n${F.nom.toUpperCase()} ${ROMAIN[e.niv]}` }, F.quand === 'apres' ? 1.1 : 1.6, 0.3);
        else add({ nom: 'texte', e, txt: `${F.nom.toUpperCase()} RATÉE\n${N(e.qui)} N'A PLUS ASSEZ DE JETONS` }, 1.4, 0.2);
        break;
      case 'thrymr': add({ nom: 'texte', e, txt: e.a ? `THRYMR AFFAIBLIT\n${JAR_FAVEURS[e.cible].nom.toUpperCase()} : ${ROMAIN[e.de]} → ${ROMAIN[e.a]}` : `THRYMR VOLE\n${JAR_FAVEURS[e.cible].nom.toUpperCase()}` }, 1.4); break;
      case 'freyja': add({ nom: 'texte', e, txt: `FREYJA OFFRE ${e.faces.length} DÉ${e.faces.length > 1 ? 'S' : ''}\n${faces(e.faces)}` }, 1.4); break;
      case 'frigg': add({ nom: 'texte', e, txt: `FRIGG RELANCE ${e.faces.length} DÉS\n${faces(e.faces)}` }, 1.4); break;
      case 'loki': add({ nom: 'texte', e, txt: `LOKI ÉCARTE\n${faces(e.faces)}` }, 1.4); break;
      case 'tyr': add({ nom: 'texte', e, txt: `TYR : ${N(e.qui)} SACRIFIE 1 PV\n${N(1 - e.qui)} PERD ${e.n} JETON${e.n > 1 ? 'S' : ''}` }, 1.4); break;
      case 'fleches': add({ nom: 'fleches', e, att: e.att, def: e.def, txt: `VOLÉE DE FLÈCHES\n${N(0)} −${e.dmg[0]}   ${N(1)} −${e.dmg[1]}` }, 1.8, 1.15); break;
      case 'haches': add({ nom: 'haches', e, att: e.att, def: e.def, front: true, txt: `CHARGE DES HACHES\n${N(0)} −${e.dmg[0]}   ${N(1)} −${e.dmg[1]}` }, 1.8, 0.9); break;
      case 'soin': add({ nom: 'soin', e, qui: e.qui, txt: `${JAR_FAVEURS[e.raison].dieu.toUpperCase()} : ${N(e.qui)} +${e.n} PV` }, 1.3, 0.4); break;
      case 'jetons': add({ nom: 'jetons', e, qui: e.qui, txt: `${JAR_FAVEURS[e.raison].dieu.toUpperCase()} : ${N(e.qui)} +${e.n} JETONS` }, 1.1, 0.3); break;
      case 'perte': add({ nom: 'texte', e, txt: `SKULD : ${N(e.qui)} PERD ${e.n} JETON${e.n > 1 ? 'S' : ''}` }, 1.1, 0.3); break;
      case 'vol': add({ nom: 'mains', e, att: e.att, txt: `LES ÉCLAIREURS VOLENT\n${N(0)} +${e.v[0]}   ${N(1)} +${e.v[1]}` }, 1.4, 0.9); break;
      case 'thor': add({ nom: 'foudre', e, qui: e.qui, id: 'thor', txt: `FOUDRE DE THOR\n${N(1 - e.qui)} −${e.n}` }, 1.8, 0.95); break;
      case 'idunn': add({ nom: 'soin', e, qui: e.qui, id: 'idunn', txt: `POMMES D'IDUNN\n${N(e.qui)} +${e.n} PV` }, 1.6, 0.5); break;
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
    if (!p.sonne && now >= A.t0 + p.t) { p.sonne = true; if (SON_PHASE[p.nom] && now - A.t0 - p.t < 0.5) JarSons.jouer(SON_PHASE[p.nom]); }
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
  sauver(); guideSuite();
}

/* ---------- les actions ---------- */
function action(f) { if (pause || V.anim || E.fin) return false; const ok = f(); if (ok) apres(); return ok; }
function apres() {
  const now = horloge();
  if (E.phase === 'bataille') lancerBataille(now);
  else sauver();
  guideSuite();
}
function lancer(i) {
  return action(() => {
    const avant = E.camps[i].des.map(d => d.garde);
    if (!jarLancer(E, i)) return false;
    const now = horloge(); avant.forEach((gd, j) => { if (!gd) V.desT[i][j] = now; });
    V.info = null; JarSons.jouer('des'); return true;
  });
}
const garder = (i, j) => action(() => { const ok = jarGarder(E, i, j); if (ok) JarSons.jouer('garder'); return ok; });
const finir = i => action(() => jarFinir(E, i));
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
    if (E.phase !== 'bataille' && c.lancers) JarSons.jouer('des');
    V.cle = ''; apres();
  }
}

/* ---------- le duel guidé (Sigrid) ---------- */
const etapeGuide = () => G && GUIDE_ETAPES[G.k];
// l'action attendue par l'étape en cours est-elle permise ?
function guidePermet(quoi, j) {
  const e = etapeGuide(); if (!e) return true;
  if (e.a === 'lancer') return quoi === 'lancer';
  if (e.a === 'garder') return quoi === 'garder' && [0, 1, 3].includes(j) && !E.camps[0].des[j].garde;
  if (e.a === 'finir') return quoi === 'finir';
  if (e.a === 'faveur') return quoi === 'fav' || (quoi === 'invoquer' && V.sel[0] && V.sel[0].id === 'thor' && V.sel[0].niv === 1);
  return false;
}
// passe à l'étape suivante quand ce qu'elle attend est arrivé
function guideSuite() {
  if (!G) return;
  for (let n = 0; n < 3; n++) {
    const e = etapeGuide(); if (!e) { G = null; return; }
    const c = E.camps[0];
    const fait = e.a === 'lancer' ? c.lancers >= (G.k < 5 ? 1 : 2)
      : e.a === 'garder' ? [0, 1, 3].every(j => c.des[j].garde)
      : e.a === 'tour' ? (E.tour === 0 && !V.anim && (E.phase === 'faveur' || (E.phase === 'lancer' && !c.fini)))
      : e.a === 'finir' ? c.fini
      : e.a === 'faveur' ? c.choix !== undefined
      : e.a === 'bataille' ? E.manche >= 2 && !V.anim
      : false;
    if (!fait) return;
    G.k++; G.t = horloge();
    // les étapes « tour » sautent quand Thorgrim a déjà joué
  }
}
function guideOk() { const e = etapeGuide(); if (e && e.a === 'ok') { G.k++; G.t = horloge(); if (G.k >= GUIDE_ETAPES.length) G = null; guideSuite(); } }
// la zone éclairée par l'étape (coordonnées de l'écran)
function zoneGuide(z) {
  const P = L.pan[0], Z = P.z;
  if (z === 'champ') return { x: 0, y: L.champ.y, w: W, h: L.champ.h };
  if (z === 'hud') return { x: 0, y: 0, w: W, h: L.hud.h };
  if (z === 'desIA') return { x: W - 6 * 21 - 16, y: L.champ.y + 2, w: 6 * 21 + 12, h: 30 };
  if (z === 'des') { const a = Z.des[0], b = Z.des[5]; return { x: a.x - 8, y: P.y + a.y - 10, w: b.x + b.s - a.x + 16, h: b.y + b.s - a.y + 20 }; }
  if (z === 'fav') { const a = Z.fav[0], b = Z.fav[2]; return { x: a.x - 4, y: P.y + a.y - 4, w: b.x + b.w - a.x + 8, h: a.h + 8 }; }
  const r = Z[z]; return { x: r.x - 4, y: P.y + r.y - 4, w: r.w + 8, h: r.h + 8 };
}
function dessinerGuide(now) {
  const e = etapeGuide(); if (!e || pause) return;
  const z = zoneGuide(e.z), voile = e.a !== 'bataille' && e.a !== 'tour';
  if (voile) { g.fillStyle = 'rgba(0,0,0,.55)'; g.beginPath(); g.rect(0, 0, W, H); rrect(z.x, z.y, z.w, z.h, 10); g.fill('evenodd'); }
  g.strokeStyle = `rgba(255,211,107,${0.7 + 0.3 * Math.sin(now * 5)})`; g.lineWidth = 2.5; rrect(z.x, z.y, z.w, z.h, 10); g.stroke();
  // la bulle de Sigrid, au-dessus ou au-dessous de la zone
  const bw = W - 24, lignesT = enveloppe(e.t, bw - 28, 14, FRED), bh = 46 + lignesT.length * 18 + (e.a === 'ok' ? 30 : 8);
  let by = z.y + z.h / 2 < H / 2 ? z.y + z.h + 12 : z.y - bh - 12;
  if (e.z === 'champ') by = e.a === 'ok' && G.k === 0 ? L.champ.y + L.champ.h - bh - 8 : L.champ.y + L.champ.h + 8;
  by = Math.max(6, Math.min(H - bh - 6, by));
  g.fillStyle = 'rgba(30,20,10,.96)'; rrect(12, by, bw, bh, 12); g.fill();
  g.strokeStyle = '#c8902c'; g.lineWidth = 2; rrect(12, by, bw, bh, 12); g.stroke();
  g.save(); g.beginPath(); g.arc(36, by + 22, 15, 0, 7); g.fillStyle = '#c8902c'; g.fill(); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(portrait('sigrid'), 9, 0, 26, 24, 21, by + 7, 30, 28); g.restore();
  texte('SIGRID LA SKALDE', 58, by + 22, { align: 'left', taille: 13 });
  texte(`${Math.min(G.k + 1, GUIDE_ETAPES.length)} / ${GUIDE_ETAPES.length}`, 12 + bw - 12, by + 22, { align: 'right', taille: 11, police: FRED, poids: 500, coul: '#c8bfae' });
  lignesT.forEach((t, k) => texte(t, 26, by + 48 + k * 18, { align: 'left', police: FRED, poids: 400, taille: 14, coul: '#f2ede4', ombre: false }));
  if (e.a === 'ok') bouton({ x: 12 + bw - 112, y: by + bh - 36, w: 100, h: 28 }, G.k === GUIDE_ETAPES.length - 1 ? 'À MOI !' : 'SUIVANT', true, true);
}

/* ---------- les astuces des trois premières parties ---------- */
function astuce() {
  if (G || cfg.mode === 'duo' || V.anim || E.fin || E.tour !== 0 || lire('parties', 0) >= 3) return '';
  const c = E.camps[0], o = E.camps[1], n = (camp, f) => camp.des.reduce((a, d, j) => a + (jarFace(j, d) && jarFace(j, d).f === f ? 1 : 0), 0);
  if (E.phase === 'faveur') {
    const s = V.sel[0], mains = n(o, 'main');
    if (s && JAR_FAVEURS[s.id].quand === 'apres' && mains) return `Attention : ses ${mains} main${mains > 1 ? 's' : ''} peuvent voler les jetons de ${JAR_FAVEURS[s.id].dieu}.`;
    if (c.jetons + jarOrDe(c) < 2) return 'Pas assez de jetons pour un dieu : touche AUCUNE.';
    return 'Touche une faveur : niveau I, puis II, puis III. Touche AUCUNE pour garder tes jetons.';
  }
  if (E.phase !== 'lancer' || !c.lancers || c.fini) return '';
  const h = n(c, 'hache'), cas = n(o, 'casque'), fl = n(o, 'fleche'), bo = n(c, 'bouclier');
  if (!c.des.some(d => d.garde)) return 'Touche un dé pour le garder, puis relance les autres.';
  if (fl >= 2 && !bo) return `Il a ${fl} flèches et toi aucun bouclier : un bouclier en arrêterait une.`;
  if (h > cas && c.des.some((d, j) => !d.garde && jarFace(j, d).f === 'hache')) return 'Ses casques ne pareront pas toutes tes haches : garde-les !';
  return '';
}

/* ---------- le toucher ---------- */
const dans = (x, y, r, m = 0) => r && x >= r.x - m && x <= r.x + r.w + m && y >= r.y - m && y <= r.y + r.h + m;
cv.addEventListener('pointerdown', e => {
  if (!E || !L || pause) return;
  const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  if (dans(x, y, L.pauseB, 6)) { ouvrirPause(); return; }
  if (dans(x, y, L.aideB, 6)) { ouvrirRappel(); return; }
  if (G && etapeGuide() && etapeGuide().a === 'ok') { guideOk(); return; }
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
    if (dans(x, y, { x: d.x, y: d.y, w: d.s, h: d.s }, 6)) { if (tour && E.phase === 'lancer' && guidePermet('garder', j)) garder(i, j); return; }
  }
  for (let k = 0; k < 3; k++) {
    if (!dans(x, y, z.fav[k], 3)) continue;
    const id = c.faveurs[k];
    if (tour && E.phase === 'faveur' && guidePermet('fav')) {
      const s = V.sel[i]; V.sel[i] = !s || s.id !== id ? { id, niv: 1 } : s.niv < 3 ? { id, niv: s.niv + 1 } : null;
      JarSons.jouer('garder');
    } else if (!G) V.info = { qui: i, id };
    return;
  }
  if (dans(x, y, z.b1)) {
    if (tour && E.phase === 'lancer' && jarPeutLancer(E, i) && guidePermet('lancer')) lancer(i);
    else if (tour && E.phase === 'faveur' && !G) { V.sel[i] = null; choisirFaveur(i); }
    return;
  }
  if (dans(x, y, z.b2)) {
    if (tour && E.phase === 'lancer' && guidePermet('finir')) finir(i);
    else if (tour && E.phase === 'faveur' && V.sel[i] && guidePermet('invoquer')) choisirFaveur(i);
  }
}

/* ---------- dessin ---------- */
function rrect(x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function texte(t, x, y, o = {}) {
  g.font = `${o.poids || 900} ${o.taille || 13}px ${o.police || CINZEL}`; g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
  let tx = t;
  const max = o.max || 0;
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
    texte(i === 0 ? 'Toi' : E.camps[1].nom, x, y + 11, { align: d ? 'right' : 'left', taille: 13, max: W / 2 - 90 });
    pips(x, y + 21, V.show[i].pv, d);
    jeton(d ? W - 88 : 88, y + 29, V.show[i].jetons, !d);
  }
  petitsBoutons();
}
function petitsBoutons() {
  const b = L.pauseB, a = L.aideB;
  for (const r of [b, a]) { g.fillStyle = 'rgba(20,12,6,.6)'; rrect(r.x, r.y, r.w, r.h, 6); g.fill(); }
  g.fillStyle = '#f3d58c'; g.fillRect(b.x + b.w / 2 - 6, b.y + b.h / 2 - 7, 4, 14); g.fillRect(b.x + b.w / 2 + 2, b.y + b.h / 2 - 7, 4, 14);
  texte('?', a.x + a.w / 2, a.y + a.h / 2 + 1, { taille: 18 });
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
  // petite tête du dieu à gauche du nom
  g.save(); g.beginPath(); g.arc(r.x + 13, r.y + 13, 9, 0, 7); g.fillStyle = JAR_COUL_FAM[JAR_FAM[id]]; g.fill(); g.clip(); g.imageSmoothingEnabled = false; g.drawImage(portrait(id), 10, 2, 22, 20, r.x + 3, r.y + 4, 21, 19); g.restore();
  texte(F.dieu, r.x + r.w / 2 + 8, r.y + 13, { taille: 13, max: r.w - 30, coul: choisi ? '#fff4c8' : '#f3d58c' });
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
  const gr = g.createLinearGradient(0, 0, 0, P.h); gr.addColorStop(0, '#6a4224'); gr.addColorStop(1, '#3a2210'); g.fillStyle = gr; g.fillRect(0, 0, W, P.h);
  for (let y = 6; y < P.h; y += 26) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, y, W, 1.5); g.fillStyle = 'rgba(255,200,140,.08)'; g.fillRect(0, y + 1.5, W, 1); }
  for (let k = 0; k < 30; k++) { g.fillStyle = 'rgba(30,16,6,.18)'; g.fillRect(hash(k + 500 + i * 40) * W, hash(k + 501) * P.h, 8 + hash(k + 502) * 30, 1); }
  g.fillStyle = '#2a2a2e'; g.fillRect(0, 0, W, 5); g.fillStyle = '#6a6a72'; g.fillRect(0, 0, W, 1.5);
  for (let x = 8; x < W; x += 24) { g.fillStyle = '#4a4a52'; g.beginPath(); g.arc(x, 2.5, 1.6, 0, 7); g.fill(); }
  if (z.hud) {
    texte(NOMS_DUO[i], 10, 15, { align: 'left', taille: 13, coul: i ? '#ff9a8a' : '#9ab8ff' });
    pips(116, 8, V.show[i].pv, false);
    jeton(W - 34, 15, V.show[i].jetons, true);
  }
  const tour = E.tour === i && !V.anim && !E.fin;
  c.des.forEach((d, j) => { const p = z.des[j], t = V.desT[i][j] || -9; deA(g, p.x, p.y, p.s, jarFace(j, d), d.garde && !c.fini, now - t < 0.5, now); });
  c.faveurs.forEach((id, k) => carteFaveur(z.fav[k], id, i, now));
  if (E.phase === 'faveur' && tour) {
    const s = V.sel[i];
    bouton(z.b1, 'AUCUNE', !G, false);
    bouton(z.b2, s ? `INVOQUER ${ROMAIN[s.niv]}` : 'INVOQUER', !!s, true);
  } else {
    bouton(z.b1, `LANCER ${c.lancers}/3`, tour && jarPeutLancer(E, i), true);
    bouton(z.b2, 'TOUT GARDER', tour && E.phase === 'lancer' && c.lancers > 0 && !c.fini, false);
  }
  if (V.info && V.info.qui === i) ficheFaveur(V.info.id, z);
  g.restore();
}
function ficheFaveur(id, z) {
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
    if (cfg.mode === 'duo') return c.lancers ? `${N} : TOUCHE UN DÉ\nPOUR LE GARDER` : `${N} : À TOI`;
    return c.lancers ? 'TOUCHE UN DÉ\nPOUR LE GARDER' : `MANCHE ${E.manche}\nLANCE TES DÉS`;
  }
  if (E.phase === 'faveur') {
    if (c.ia) return `${N} CHOISIT SA FAVEUR…`;
    const d = c.jetons + jarOrDe(c);
    return (cfg.mode === 'duo' ? `${N} : ` : '') + `UNE FAVEUR ? (${d} JETON${d > 1 ? 'S' : ''})` + prep;
  }
  return '';
}
function champ(now) {
  const Cz = L.champ, u = decor.u, UH = decor.UH, ph = phaseEnCours(now);
  g.save(); g.setTransform(1, 0, 0, 1, 0, Cz.y * dpr);
  let sx = 0, sy = 0;
  if (ph && ph.p.nom === 'foudre' && ph.u > 0.42 && ph.u < 0.66) { sx = Math.sin(now * 90) * 3 * dpr; sy = Math.cos(now * 77) * 2 * dpr; }
  if (ph && ph.p.nom === 'haches' && ph.u > 0.3 && ph.u < 0.4) sy = Math.sin(now * 80) * 1.5 * dpr;
  g.beginPath(); g.rect(0, 0, W * dpr, Cz.h * dpr); g.clip();
  g.translate(sx, sy); g.drawImage(decor.fond, 0, 0);
  g.save(); g.scale(u, u);
  g.fillStyle = 'rgba(255,236,190,.7)';
  for (let k = 0; k < 10; k++) { const q = (now * 1.5 + k * 0.37) % 1; if (q > 0.6) continue; g.fillRect(UW * 0.6 + hash(k) * UW * 0.18, UH * 0.47 + 1 + hash(k + 9) * 5, 1 + hash(k + 4) * 3, 0.4); }
  scene(now, UH, ph);
  g.restore();
  const Wd = W * dpr, Hd = Cz.h * dpr;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) { g.fillStyle = `rgba(255,214,150,${0.04 + 0.025 * Math.sin(now * 0.7 + k * 2)})`; g.beginPath(); g.moveTo(Wd * 0.68, Hd * 0.45); g.lineTo(Wd * (0.05 + k * 0.25), Hd); g.lineTo(Wd * (0.16 + k * 0.25), Hd); g.fill(); }
  g.restore();
  for (let k = 0; k < 3; k++) { const mx = ((now * 5 * (k + 1) + k * 90) % (W + 180) - 90) * dpr, my = Hd * (0.6 + k * 0.1), rg = g.createRadialGradient(mx, my, 0, mx, my, 95 * dpr); rg.addColorStop(0, 'rgba(225,230,245,.2)'); rg.addColorStop(1, 'rgba(225,230,245,0)'); g.fillStyle = rg; g.fillRect(mx - 95 * dpr, my - 35 * dpr, 190 * dpr, 70 * dpr); }
  for (let k = 0; k < 14; k++) { const px = ((k * 47 + now * 7 * (1 + k % 3)) % W) * dpr, py = (Cz.h * 0.35 + ((k * 31 + Math.sin(now + k) * 9) % (Cz.h * 0.55))) * dpr, a = 0.4 + 0.4 * Math.sin(now * 3 + k); g.fillStyle = `rgba(255,236,170,${a})`; g.beginPath(); g.arc(px, py, (1 + (k % 3) * 0.5) * dpr, 0, 7); g.fill(); }
  if (ph && ph.p.nom === 'hiver') { for (let k = 0; k < 90; k++) { const fx = (hash(k + 700) * W + Math.sin(now * 2 + k) * 8) * dpr, fy = ((hash(k + 701) * Cz.h + now * 40 * (0.6 + hash(k + 702))) % Cz.h) * dpr; g.fillStyle = 'rgba(240,246,255,.85)'; g.fillRect(fx, fy, 1.6 * dpr, 1.6 * dpr); } g.fillStyle = `rgba(200,220,255,${0.18 * Math.sin(ph.u * Math.PI)})`; g.fillRect(0, 0, Wd, Hd); }
  g.drawImage(decor.avant, 0, 0);
  g.restore();
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (cfg.mode !== 'duo') {
    const e = E.camps[1], ps = 18, ex = W - 6 * (ps + 3) - 8, y = Cz.y + 4;
    g.fillStyle = 'rgba(20,12,6,.55)'; rrect(ex - 6, y, 6 * (ps + 3) + 10, ps + 8, 6); g.fill();
    e.des.forEach((dd, j) => { const t = V.desT[1][j] || -9; deA(g, ex + j * (ps + 3), y + 4, ps, jarFace(j, dd), false, now - t < 0.5, now, true); });
    if (e.choix && !V.anim) texte(`${JAR_FAVEURS[e.choix.id].dieu} ${ROMAIN[e.choix.niv]}`, ex - 12, y + 4 + ps / 2, { align: 'right', taille: 12 });
  }
  const m = message(now);
  if (m) {
    if (cfg.mode === 'duo') {
      lignes(m, W / 2, Cz.y + Cz.h - 40, { taille: 14 });
      g.save(); g.translate(W / 2, Cz.y + 22); g.rotate(Math.PI); lignes(m, 0, -18 * (m.split('\n').length - 1), { taille: 14 }); g.restore();
    } else lignes(m, W / 2, Cz.y + 44, { taille: 14 });
  }
  // l'astuce du moment (trois premières parties)
  const a = astuce();
  if (a) {
    const l = enveloppe(a, W - 48, 13, FRED), hh = 10 + l.length * 17, yy = Cz.y + Cz.h - hh - 8;
    g.fillStyle = 'rgba(14,10,6,.82)'; rrect(14, yy, W - 28, hh, 9); g.fill(); g.strokeStyle = 'rgba(243,213,140,.5)'; g.lineWidth = 1; rrect(14.5, yy + 0.5, W - 29, hh - 1, 9); g.stroke();
    l.forEach((t, k) => texte(t, W / 2, yy + 13 + k * 17, { police: FRED, poids: 500, taille: 13, coul: '#f3e6c8', ombre: false }));
  }
  if (cfg.mode === 'duo') petitsBoutons();
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
    const s = p.qui, id = p.id || 'idunn', thor = p.nom === 'foudre' || id === 'thor';
    const cx = s ? UW - 48 : 48, a = Math.min(1, u * 3) * Math.min(1, (1 - u) * 4);
    const tx = thor ? (s ? 48 : UW - 48) : cx;   // Thor apparaît au-dessus de l'armée qu'il frappe
    if (thor) { g.fillStyle = `rgba(10,14,40,${0.45 * a})`; g.fillRect(0, 0, UW, UH); for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(40,46,70,${0.8 * a})`; g.beginPath(); g.ellipse(tx - 40 + k * 16, 10 + Math.sin(k * 2) * 4, 16, 6, 0, 0, 7); g.fill(); } }
    const fam = JAR_FAM[id], halo = fam === 'att' ? '255,170,140' : fam === 'def' ? '160,210,255' : fam === 'jet' ? '255,230,140' : '210,170,255';
    const rg = g.createRadialGradient(tx, 30, 2, tx, 30, 44); rg.addColorStop(0, thor ? `rgba(160,210,255,${0.6 * a})` : `rgba(${halo},${0.6 * a})`); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(tx - 50, -20, 100, 100);
    g.globalAlpha = a; g.drawImage(portrait(id), Math.round(tx - 22), 4); g.globalAlpha = 1;
    if (p.nom === 'foudre' && u > 0.4 && u < 0.64) {
      g.save(); g.shadowColor = '#9fd8ff'; g.shadowBlur = 8;
      for (let k = 0; k < 3; k++) { const t = posA(1 - s, (k * 13 + Math.floor(now * 3) * 7) % 45, UH); g.strokeStyle = '#eef8ff'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(tx + 8, 8); const kk = Math.floor(now * 24); for (let q = 1; q < 7; q++) { const w = q / 7; g.lineTo(tx + 8 + (t.x - tx - 8) * w + Math.sin(kk * 7.3 + q * 13.1 + k) * 5, 8 + (t.y - 14) * w); } g.lineTo(t.x, t.y - 8); g.stroke(); }
      g.restore(); g.fillStyle = `rgba(230,245,255,${0.45 * (1 - Math.abs(u - 0.5) * 8)})`; g.fillRect(0, 0, UW, UH);
    }
    if (p.nom === 'soin' && u > 0.3) { g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 22; k++) { const t = posA(s, (k * 7) % 45, UH), yy = t.y - ((u * 50 + k * 7) % 32); g.fillStyle = k % 2 ? 'rgba(255,230,120,.9)' : 'rgba(180,255,150,.9)'; g.fillRect(t.x + Math.sin(k + now * 3) * 4, yy, 1, 1); } g.restore(); }
  }
}
function dessiner(now) {
  if (!E || !L || !decor) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.fillStyle = '#121628'; g.fillRect(0, 0, W, H);
  champ(now);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (L.hud) hudSolo();
  for (const i of [0, 1]) if (L.pan[i]) panneau(i, L.pan[i], now);
  if (G) dessinerGuide(now);
}
function boucle() {
  const now = horloge();
  try { if (E && !pause) { majBataille(now); tourIa(now); guideSuite(); } dessiner(now); }
  catch (e) {
    // une erreur au milieu du dessin laisse des save() sans restore() : on repart d'un contexte propre (sinon tout s'empile, image après image)
    console.error(e);
    if (g.reset) g.reset(); else { g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; }
  }
  requestAnimationFrame(boucle);
}

/* ---------- fin du duel ---------- */
function finDuel() {
  const f = E.fin, g0 = f.gagnant, m = cfg.mode, LS = window.LudoScores;
  let t, s, gains = '', b1 = ['REVANCHE', () => demarrer()], b2 = ['◀ TITRE', ecranTitre];
  const rang = (txt, r) => { if (r && LS) { const el = $('rangFin'); el.textContent = txt + LS.rankText(r); el.hidden = false; } };
  $('rangFin').hidden = true;
  if (m !== 'duo' && m !== 'guide') ecrire('parties', lire('parties', 0) + 1);
  if (m === 'duo') { t = g0 < 0 ? 'ÉGALITÉ' : `${NOMS_DUO[g0]} GAGNE !`; s = `En ${f.manche} manche${f.manche > 1 ? 's' : ''}.`; }
  else {
    t = g0 === 0 ? 'VICTOIRE !' : g0 === 1 ? 'DÉFAITE' : 'ÉGALITÉ';
    s = g0 === 0 ? `${E.camps[1].nom} est vaincu en ${f.manche} manche${f.manche > 1 ? 's' : ''}. Il te reste ${E.camps[0].pv} PV.`
      : g0 === 1 ? `${E.camps[1].nom} t'a vaincu en ${f.manche} manche${f.manche > 1 ? 's' : ''}.` : 'Les deux armées sont tombées ensemble.';
  }
  if (m === 'guide') {
    ecrire('guide', true);
    s += g0 === 0 ? ' Sigrid est fière de toi : la route du fjord t\'attend.' : ' Pas grave : Sigrid t\'attend pour une revanche.';
    b1 = ['LA ROUTE DU FJORD', ecranCampagne]; b2 = ['◀ TITRE', ecranTitre];
  }
  if (m === 'campagne') {
    b1 = ['LA ROUTE DU FJORD', ecranCampagne]; b2 = ['REJOUER LA TAVERNE', () => demarrer()];
    if (g0 === 0) {
      const r = jarVictoire(C, cfg.taverne, E.camps[0].pv); ecrire('campagne', C); appliquerArmee();
      gains += `<p class="etoilesFin">${'★'.repeat(r.etoiles)}${'☆'.repeat(3 - r.etoiles)}</p>`;
      if (r.faveur) gains += `<div class="gain">${imgMed(r.faveur)}<span>Nouvelle faveur :<br><b>${esc(JAR_FAVEURS[r.faveur].nom)}</b></span></div>`;
      if (r.apparence) gains += `<div class="gain"><i class="nuance" style="--c:${JAR_APPARENCES[r.apparence].t}"></i><span>Nouvelles couleurs :<br><b>${JAR_APPARENCES[r.apparence].nom}</b> (bouton ARMÉE)</span></div>`;
      if (r.unite) { const u = JAR_UNITES.find(x => x.id === r.unite); gains += `<div class="gain"><i class="nuance" style="--c:#c8902c"></i><span>Nouvelle unité : <b>${u.nom}</b><br>${u.txt}</span></div>`; }
      if (r.mieux && !r.premiere) gains += '<p class="petit">Plus d\'étoiles qu\'avant !</p>';
      if (r.mieux && LS) LS.submit('jarls', 'etoiles', jarTotalEtoiles(C), false).then(x => rang('Étoiles : ', x)).catch(() => {});
      if (jarProchaine(C) === null && r.premiere) gains += '<p class="or">Les vingt dieux sont battus : tu es le jarl des jarls !</p>';
    } else s += ' Change tes faveurs au conseil et retente ta chance.';
  }
  if (m === 'jour') {
    const sc = jarScoreJour(E), d = lire('daily', {}); d[E.graine] = sc; ecrire('daily', d); ecrire('dailyRun', null);
    gains += `<p class="or">Défi du jour : ${sc} points</p><p class="petit">${g0 === 0 ? '1000 + 50 par PV gardé − 10 par manche.' : '20 par PV pris au dieu.'}</p>`;
    if (LS) LS.submit('jarls', 'daily:' + E.graine, sc, false).then(x => rang('Défi du jour : ', x)).catch(() => {});
    b1 = ['CLASSEMENT', () => { location.href = '../index.html#jarls'; }]; b2 = ['◀ TITRE', ecranTitre];
  }
  if (m === 'rejeu') { gains += '<p class="petit">Défi du jour déjà joué : partie hors classement.</p>'; b1 = ['◀ TITRE', ecranTitre]; b2 = null; }
  if (m === 'libre') b2 = ['◀ TITRE', ecranTitre];
  if (cleSauve() === 'run') ecrire('run', null);
  JarSons.jouer(g0 === 0 || (m === 'duo' && g0 >= 0) ? 'victoire' : 'defaite');
  $('tFin').textContent = t; $('sFin').textContent = s; $('gainsFin').innerHTML = gains;
  $('bFin1').textContent = b1[0]; $('bFin1').onclick = () => { $('eFin').classList.remove('retourne'); b1[1](); };
  $('bFin2').hidden = !b2; if (b2) { $('bFin2').textContent = b2[0]; $('bFin2').onclick = () => { $('eFin').classList.remove('retourne'); b2[1](); }; }
  $('bFin1').classList.toggle('ludo-retour', m === 'jour');
  $('eFin').classList.toggle('retourne', m === 'duo' && g0 === 1);
  G = null;
  setTimeout(() => { if (E && E.fin) montrer('eFin'); }, 600);
}

/* ---------- menus ---------- */
const ECRANS = ['eTitre', 'eCampagne', 'eArmee', 'eDieu', 'eFaveurs', 'eIntro', 'ePause', 'eRappel', 'eLivre', 'eFin'];
function montrer(id) { ECRANS.forEach(k => { $(k).hidden = k !== id; }); }
let retour = null;   // où revenir après le livre ou le rappel
function ecranTitre() {
  E = null; G = null; pause = false; montrer('eTitre');
  $('bContinuer').hidden = !lire('run', null);
  const p = jarProchaine(C);
  $('sCampagne').textContent = p === null ? `${jarTotalEtoiles(C)} étoiles sur 60 : les vingt dieux sont battus` : `${jarBattus(C)} dieux battus sur 20 · prochaine : ${JAR_FAVEURS[JAR_TAVERNES[p].dieu].dieu}`;
  const j = auj(), fait = lire('daily', {})[j] != null, d = jarDuJour(j);
  $('sJour').textContent = fait ? `Fait : ${lire('daily', {})[j]} points` : `Contre ${JAR_FAVEURS[d.dieu].dieu} · une seule tentative classée`;
  majSons();
  dessinerFondTitre();
}
// derrière les menus : le champ de bataille au repos
function dessinerFondTitre() {
  const r = cv.getBoundingClientRect(); W = Math.round(r.width); H = Math.round(r.height); dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  if (!W || !H) return;
  const u = W * dpr / UW, UH = Math.ceil(H * dpr / u);
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(fondA(u, UH), 0, 0); g.drawImage(avantA(u, UH), 0, 0);
}
function majSons() { const t = 'SONS : ' + (JarSons.actif() ? 'OUI' : 'NON'); $('bSons').textContent = t; $('bSonsP').textContent = t; }
function basculerSons() { JarSons.actif(!JarSons.actif()); ecrire('sons', JarSons.actif()); majSons(); }
function ouvrirPause() { pause = true; if (V) V.pauseT = horloge(); montrer('ePause'); }
function reprendreJeu() { pause = false; montrer(null); if (V && V.anim && V.pauseT) { const d = horloge() - V.pauseT; V.anim.t0 += d; V.anim.fin += d; } }

// la route du fjord
const TAV_Y = 74;
function ecranCampagne() {
  E = null; G = null; pause = false;
  if (!lire('guide', false) && !jarBattus(C)) { proposerGuide(); return; }
  montrer('eCampagne');
  $('tCampagne').textContent = `${jarBattus(C)} dieux battus sur 20 · ★ ${jarTotalEtoiles(C)} / 60`;
  const route = $('route'), Ht = 20 * TAV_Y + 90, pos = i => ({ x: 50 + 30 * Math.sin(i * 1.15), y: Ht - 56 - i * TAV_Y });
  let d = `M${pos(0).x} ${pos(0).y}`;
  for (let i = 1; i < 20; i++) { const a = pos(i - 1), b = pos(i); d += ` C${a.x} ${a.y - TAV_Y / 2} ${b.x} ${b.y + TAV_Y / 2} ${b.x} ${b.y}`; }
  let h = `<div class="carteRoute" style="height:${Ht}px"><svg viewBox="0 0 100 ${Ht}" preserveAspectRatio="none" style="height:${Ht}px"><path d="${d}" fill="none" stroke="#c8a870" stroke-dasharray="4 3" vector-effect="non-scaling-stroke" style="stroke-width:4px"/></svg>`;
  const ici = jarProchaine(C);
  JAR_TAVERNES.forEach((t, i) => {
    const p = pos(i), n = C.etoiles[t.dieu] || 0, cl = n ? 'fait' : i === ici ? 'ici' : jarOuverte(C, i) ? '' : 'ferme';
    h += `<button class="tav ${cl}" data-i="${i}" style="left:${p.x}%;top:${p.y}px">${imgMed(t.dieu)}<span>${JAR_FAVEURS[t.dieu].dieu}</span>${n ? `<em>${'★'.repeat(n)}${'☆'.repeat(3 - n)}</em>` : ''}</button>`;
    if (i % 5 === 2) h += `<div class="chapitre" style="top:${p.y}px">${JAR_CHAPITRES[t.chapitre]}</div>`;
  });
  route.innerHTML = h + '</div>';
  const vise = ici === null ? 19 : ici;
  requestAnimationFrame(() => { route.scrollTop = pos(vise).y - route.clientHeight * 0.35; });
  ficheTaverne(vise);
}
function ficheTaverne(i) {
  const t = JAR_TAVERNES[i], f = $('ficheTav'), n = C.etoiles[t.dieu] || 0, ouverte = jarOuverte(C, i), r = jarRecompense(i);
  const gain = r.faveur ? `la faveur « ${esc(JAR_FAVEURS[r.faveur].nom)} »` : `les couleurs « ${JAR_APPARENCES[r.apparence].nom} »`;
  const u = JAR_UNITES.find(x => x.apres === i + 1);
  f.innerHTML = `<div class="ftete">${imgMed(t.dieu)}<div><b>Taverne ${t.nom}</b><span>${JAR_FAVEURS[t.dieu].dieu}, ${STYLE_DIEU[t.dieu]} · ${['', 'facile', 'normal', 'difficile'][t.niveau]}${n ? ' · ' + '★'.repeat(n) + '☆'.repeat(3 - n) : ''}</span></div></div>
    <p>${n ? 'Gagné : ' : 'À gagner : '}${gain}.${u ? ` Et ${n ? 'l\'unité' : 'une unité'} : <b>${u.nom}</b>.` : ''}</p>
    <button class="or" id="bDefier" ${ouverte ? '' : 'disabled'}>${!ouverte ? 'BATS D\'ABORD ' + JAR_FAVEURS[JAR_TAVERNES[i - 1].dieu].dieu.toUpperCase() : n ? (n < 3 ? 'REJOUER POUR LES ÉTOILES' : 'REJOUER') : 'DÉFIER ' + JAR_FAVEURS[t.dieu].dieu.toUpperCase()}</button>`;
  f.hidden = false;
  $('bDefier').onclick = () => { cfg.mode = 'campagne'; cfg.taverne = i; cfg.dieu = t.dieu; cfg.niveau = t.niveau; cfg.faveurs = [null, null]; ecranFaveurs(0); };
  $('route').querySelectorAll('.tav').forEach(b => b.classList.toggle('vue', Number(b.dataset.i) === i));
}
$('route').addEventListener('click', e => { const b = e.target.closest('.tav'); if (b) ficheTaverne(Number(b.dataset.i)); });
$('bCampRetour').onclick = ecranTitre;
// l'armée : couleurs et unités
function ecranArmee() {
  const ok = jarApparences(C), us = jarUnites(C).map(u => u.id);
  $('couleurs').innerHTML = Object.keys(JAR_APPARENCES).map(k => {
    const A = JAR_APPARENCES[k], libre = ok.includes(k);
    return `<button data-c="${k}" class="${C.couleur === k ? 'choisi' : ''}" ${libre ? '' : 'disabled'}><i class="nuance" style="--c:${A.t};--d:${A.b}"></i>${A.nom}<small>${libre ? (A.dieu ? 'Taverne de ' + JAR_FAVEURS[A.dieu].dieu : 'De départ') : '🔒 Bats ' + JAR_FAVEURS[A.dieu].dieu}</small></button>`;
  }).join('');
  $('unites').innerHTML = JAR_UNITES.map(u => `<div class="unite ${us.includes(u.id) ? '' : 'ferme'}"><b>${u.nom}</b><span>${us.includes(u.id) ? u.txt : `🔒 Après ${u.apres} dieux battus (${jarBattus(C)} / ${u.apres})`}</span></div>`).join('');
  montrer('eArmee');
}
$('couleurs').addEventListener('click', e => { const b = e.target.closest('button[data-c]'); if (!b || b.disabled) return; C.couleur = b.dataset.c; ecrire('campagne', C); appliquerArmee(); ecranArmee(); });
$('bArmee').onclick = ecranArmee;
$('bArmeeOk').onclick = ecranCampagne;
function proposerGuide() {
  $('carteIntro').innerHTML = `<img class="medGrand" src="${medaillon('sigrid')}" alt=""><p class="titre2">PREMIER DUEL ?</p>
    <p>Sigrid la skalde te montre tout en un petit duel contre le vieux Thorgrim (deux minutes).</p>
    <button class="or" id="bIntroGuide">APPRENDRE AVEC SIGRID</button><button id="bIntroPasser">J'AI DÉJÀ JOUÉ</button>`;
  montrer('eIntro');
  $('bIntroGuide').onclick = lancerGuide;
  $('bIntroPasser').onclick = () => { ecrire('guide', true); ecranCampagne(); };
}
function lancerGuide() { cfg.mode = 'guide'; cfg.taverne = -1; demarrer(); }
// duel libre : choix de l'adversaire
function ecranDieu() {
  $('listeDieux').innerHTML = JAR_IDS.map(id => `<button data-d="${id}" class="${C.etoiles[id] ? 'vaincu' : ''}">${imgMed(id, 'petit')}<span>${JAR_FAVEURS[id].dieu}<small>${STYLE_DIEU[id]}</small></span></button>`).join('');
  [...$('niveaux').children].forEach(b => b.classList.toggle('choisi', Number(b.dataset.n) === cfg.niveau));
  montrer('eDieu');
}
$('niveaux').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cfg.niveau = Number(b.dataset.n); ecrire('niveau', cfg.niveau); ecranDieu(); });
$('listeDieux').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; cfg.dieu = b.dataset.d; cfg.mode = 'libre'; cfg.faveurs = [null, null]; ecranFaveurs(0); });

// le conseil des jarls : trois faveurs (mains toutes prêtes ou liste par famille)
let qui = 0, pris = [], deplie = null;
const permises = () => cfg.mode === 'duo' ? JAR_IDS.slice() : jarFaveursGagnees(C);
function ecranFaveurs(i) {
  qui = i; deplie = null;
  const ok = permises(), dernier = lire('faveurs', null);
  pris = cfg.faveurs[i] ? cfg.faveurs[i].slice() : i === 0 && Array.isArray(dernier) && dernier.length === 3 && dernier.every(x => ok.includes(x)) ? dernier.slice()
    : i === 1 ? ['vidar', 'brunhild', 'idunn'] : JAR_DEPART.slice();
  pris = pris.filter(x => ok.includes(x));
  $('tFaveurs').textContent = cfg.mode === 'duo' ? `${NOMS_DUO[i]} : TES FAVEURS` : 'LE CONSEIL DES JARLS';
  const deck = JAR_DIEUX[cfg.dieu] ? JAR_DIEUX[cfg.dieu].deck.map(x => JAR_FAVEURS[x].dieu).join(', ') : '';
  $('sFaveurs').textContent = cfg.mode === 'duo' ? 'Choisis trois faveurs. Ton adversaire ne regarde pas !'
    : cfg.mode === 'campagne' ? `Taverne ${JAR_TAVERNES[cfg.taverne].nom} : ${JAR_FAVEURS[cfg.dieu].dieu} emporte ${deck}.`
    : `Contre ${JAR_FAVEURS[cfg.dieu].dieu}, qui emporte ${deck}.`;
  $('eFaveurs').classList.toggle('retourne', cfg.mode === 'duo' && i === 1);
  majFaveurs(); montrer('eFaveurs');
  $('listeFaveurs').scrollTop = 0;
}
function majFaveurs() {
  const ok = permises();
  $('slots').innerHTML = [0, 1, 2].map(k => { const id = pris[k]; return id ? `<button class="slot" data-id="${id}">${imgMed(id)}<small>${JAR_FAVEURS[id].dieu}</small></button>` : '<div class="slot vide">+</div>'; }).join('');
  $('decks').innerHTML = MAINS.map((d, i) => {
    const libre = d[1].every(x => ok.includes(x)), on = libre && pris.length === 3 && d[1].every(x => pris.includes(x));
    return `<button class="deck ${on ? 'on' : ''}" data-i="${i}" ${libre ? '' : 'disabled'}><b>${d[0]}</b><span class="mini">${d[1].map(x => imgMed(x)).join('')}</span><span>${libre ? d[2] : '🔒 ' + d[1].filter(x => !ok.includes(x)).map(x => JAR_FAVEURS[x].dieu).join(', ') + ' à gagner'}</span></button>`;
  }).join('');
  let h = '', f0 = '';
  for (const id of PAR_FAMILLE) {
    if (JAR_FAM[id] !== f0) { f0 = JAR_FAM[id]; h += `<p class="famT">${JAR_FAMILLES[f0]}</p>`; }
    const libre = ok.includes(id), F = JAR_FAVEURS[id], t = JAR_TAVERNES.findIndex(x => x.dieu === id);
    h += `<div class="ligne ${pris.includes(id) ? 'pris' : ''} ${deplie === id ? 'ouverte' : ''} ${libre ? '' : 'ferme'}" data-id="${id}">${imgMed(id)}<div class="txt"><b>${F.dieu}</b><span>${libre ? COURT[id] : '🔒 Taverne ' + JAR_TAVERNES[t].nom}</span>
      <span class="det">${esc(F.nom)}<br>${[1, 2, 3].map(n => `${ROMAIN[n]} · ${jarCout(id, n)} jetons : ${esc(jarTexte(id, n))}`).join('<br>')}<br>${F.quand === 'apres' ? 'Après la bataille (ratée si on t\'a volé tes jetons).' : 'Avant la bataille.'}</span></div>${libre ? `<button class="coche" data-c aria-label="emporter">${pris.includes(id) ? '✓' : ''}</button>` : ''}</div>`;
  }
  const y = $('listeFaveurs').scrollTop; $('listeFaveurs').innerHTML = h; $('listeFaveurs').scrollTop = y;
  $('bFaveursOk').disabled = pris.length !== 3;
  $('bFaveursOk').textContent = pris.length === 3 ? (cfg.mode === 'duo' && qui === 0 ? 'AU JARL ROUGE' : 'AU COMBAT') : `${pris.length} / 3`;
}
function basculer(id) {
  if (!permises().includes(id)) return;
  if (pris.includes(id)) pris = pris.filter(x => x !== id); else if (pris.length < 3) pris.push(id); else { pris.shift(); pris.push(id); }
  JarSons.jouer('garder'); majFaveurs();
}
$('slots').addEventListener('click', e => { const s = e.target.closest('.slot[data-id]'); if (s) basculer(s.dataset.id); });
$('decks').addEventListener('click', e => { const d = e.target.closest('.deck'); if (!d || d.disabled) return; pris = MAINS[d.dataset.i][1].slice(); JarSons.jouer('garder'); majFaveurs(); });
$('listeFaveurs').addEventListener('click', e => {
  const l = e.target.closest('.ligne'); if (!l) return;
  if (e.target.closest('[data-c]')) basculer(l.dataset.id);
  else { deplie = deplie === l.dataset.id ? null : l.dataset.id; majFaveurs(); }
});
$('bFaveursOk').onclick = () => {
  if (pris.length !== 3) return;
  cfg.faveurs[qui] = pris.slice();
  if (qui === 0 && cfg.mode !== 'duo') ecrire('faveurs', pris);
  if (cfg.mode === 'duo' && qui === 0) { ecranFaveurs(1); return; }
  $('eFaveurs').classList.remove('retourne');
  demarrer();
};
$('bFaveursRetour').onclick = () => {
  $('eFaveurs').classList.remove('retourne');
  if (cfg.mode === 'duo') { if (qui === 1) ecranFaveurs(0); else ecranTitre(); }
  else if (cfg.mode === 'campagne') ecranCampagne(); else ecranDieu();
};

// le défi du jour
function defiDuJour() {
  const j = auj(), fait = lire('daily', {})[j] != null, run = lire('dailyRun', null);
  if (!fait && run && run.E && run.E.graine === j && reprendre(run)) return;
  const d = jarDuJour(j);
  $('carteIntro').innerHTML = `<p class="titre2">DÉFI DU JOUR</p><img class="medGrand" src="${medaillon(d.dieu)}" alt="">
    <p>Contre <b>${JAR_FAVEURS[d.dieu].dieu}</b>, ${STYLE_DIEU[d.dieu]}, en normal. Toute la famille a le même dieu, les mêmes faveurs et les mêmes dés.</p>
    <div class="mainJour">${d.faveurs.map(x => `<span>${imgMed(x)}${JAR_FAVEURS[x].dieu}</span>`).join('')}</div>
    <p class="petit">${fait ? `Déjà joué aujourd'hui (${lire('daily', {})[j]} points) : partie hors classement.` : 'Une seule tentative classée : elle compte dès le premier lancer.'}</p>
    <button class="or" id="bIntroJour">AU COMBAT</button><button id="bIntroRetour">◀ RETOUR</button>`;
  montrer('eIntro');
  $('bIntroRetour').onclick = ecranTitre;
  $('bIntroJour').onclick = () => {
    Object.assign(cfg, { mode: fait ? 'rejeu' : 'jour', dieu: d.dieu, niveau: d.niveau, taverne: -1, faveurs: [d.faveurs.slice(), null] });
    if (!fait) ecrire('dailyTry', { j });
    demarrer(j);
  };
}

// le livre du skalde
let pageL = 0;
const imgDe = (f, s = 40) => { const c = mk(s + 6, s + 8), q = c.getContext('2d'); deA(q, 2, 4, s, f ? JAR_FACE(f) : null, false, false, 0); return `<img src="${c.toDataURL()}" alt="" width="${s + 6}" height="${s + 8}">`; };
const JAR_FACE = s => ({ f: s.replace('*', ''), or: s.endsWith('*') });
function ouvrirLivre(depuis) { retour = depuis; pageL = 0; montrer('eLivre'); pageLivre(); }
function pageLivre() {
  const [titre, ill, txt] = LIVRE[pageL];
  let i = '';
  if (ill.armees) i = '<div class="armees"><i class="a b"></i><b>contre</b><i class="a r"></i></div>';
  if (ill.faces) i = '<div class="facesL">' + FACES_TXT.slice(0, 5).map(([f, t]) => `<div>${imgDe(f, 30)}<span>${t}</span></div>`).join('') + '</div>';
  if (ill.des) i = '<div class="desL">' + ill.des.map(f => f === '→' || f === '=' ? `<b>${f}</b>` : f === 'jeton' ? '<i class="jetonL"></i>' : imgDe(f, 34)).join('') + '</div>';
  if (ill.med) i = '<div class="desL">' + ill.med.map(x => imgMed(x, 'moyen')).join('') + '</div>';
  if (ill.ordre) i = '<ol class="ordreL">' + ill.ordre.map(t => `<li>${t}</li>`).join('') + '</ol>';
  if (ill.hiver) i = '<div class="hiverL">❄</div>';
  $('pageL').innerHTML = `<h2>${titre}</h2>${i}<p>${txt}</p>`;
  $('puces').innerHTML = LIVRE.map((_, k) => `<i class="${k === pageL ? 'on' : ''}"></i>`).join('');
  $('bLivrePrec').disabled = !pageL;
  $('bLivreSuiv').textContent = pageL < LIVRE.length - 1 ? 'SUITE ›' : 'FERMER';
}
$('bLivrePrec').onclick = () => { if (pageL) { pageL--; JarSons.jouer('page'); pageLivre(); } };
$('bLivreSuiv').onclick = () => { if (pageL < LIVRE.length - 1) { pageL++; JarSons.jouer('page'); pageLivre(); } else fermerLivre(); };
function fermerLivre() { if (retour === 'jeu') montrer('ePause'); else ecranTitre(); }
{ let x0 = null; const P = $('pageL'); P.addEventListener('pointerdown', e => { x0 = e.clientX; }); P.addEventListener('pointerup', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 40) { const k = Math.max(0, Math.min(LIVRE.length - 1, pageL + (e.clientX < x0 ? 1 : -1))); if (k !== pageL) { pageL = k; JarSons.jouer('page'); pageLivre(); } } x0 = null; }); }
// le rappel des faces (bouton ? en jeu)
function ouvrirRappel() {
  pause = true; if (V) V.pauseT = horloge();
  $('carteRappel').innerHTML = `<p class="titre2">RAPPEL</p><div class="facesL">${FACES_TXT.map(([f, t]) => `<div>${imgDe(f, 30)}<span>${t}</span></div>`).join('')}</div>
    <p class="petit">L'ordre de la bataille :</p><ol class="ordreL">${LIVRE[5][1].ordre.map(t => `<li>${t}</li>`).join('')}</ol>
    <p class="petit">Touche une faveur pendant les lancers pour lire sa fiche.</p><button class="or" id="bRappelOk">REPRENDRE</button>`;
  montrer('eRappel');
  $('bRappelOk').onclick = reprendreJeu;
}

$('bContinuer').onclick = () => { if (!reprendre(lire('run', null))) { ecrire('run', null); ecranTitre(); } };
$('bCampagne').onclick = ecranCampagne;
$('bJour').onclick = defiDuJour;
$('bLibre').onclick = () => { cfg.mode = 'libre'; ecranDieu(); };
$('bDuo').onclick = () => { cfg.mode = 'duo'; cfg.faveurs = [null, null]; ecranFaveurs(0); };
$('bDieuRetour').onclick = ecranTitre;
$('bGuide').onclick = lancerGuide;
$('bLivre').onclick = () => ouvrirLivre('titre');
$('bLivreP').onclick = () => ouvrirLivre('jeu');
$('bRappelP').onclick = ouvrirRappel;
$('bSons').onclick = basculerSons; $('bSonsP').onclick = basculerSons;
$('bReprendre').onclick = reprendreJeu;
$('bAbandon').onclick = () => {
  // le défi du jour abandonné compte quand même (la tentative est commencée)
  if (cfg.mode === 'jour' && E && !E.fin) { E.fin = { gagnant: 1, manche: E.manche }; const sc = jarScoreJour(E), d = lire('daily', {}); d[E.graine] = sc; ecrire('daily', d); if (window.LudoScores) window.LudoScores.submit('jarls', 'daily:' + E.graine, sc, false).catch(() => {}); }
  if (cleSauve()) ecrire(cleSauve(), null);
  ecranTitre();
};

/* ---------- pour les tests ---------- */
window.Jarls = {
  etat: () => E, vue: () => V, cfg, campagne: () => C, guide: () => G,
  // démarre un duel sans passer par les menus : { mode, dieu, niveau, taverne, faveurs: [[3], [3]], graine }
  duel(o = {}) { Object.assign(cfg, { mode: o.duo ? 'duo' : o.mode || 'libre', dieu: o.dieu || 'thor', niveau: o.niveau || 2, taverne: o.taverne != null ? o.taverne : -1, faveurs: o.faveurs || [['thor', 'idunn', 'vidar'], ['vidar', 'brunhild', 'idunn']] }); demarrer(o.graine); return E; },
  lancer, garder, finir,
  faveur(i, id, niv) { V.sel[i] = id ? { id, niv } : null; return choisirFaveur(i); },
  // saute l'animation de la bataille en cours
  accelerer() { if (V && V.anim) { const d = V.anim.fin - horloge() + 0.01; V.anim.t0 -= d; V.anim.fin -= d; } },
  guideOk, lancerGuide, ecranCampagne, defiDuJour, ecranFaveurs, titre: ecranTitre,
};

document.fonts && document.fonts.ready.then(() => { if (E) redim(); else if (!$('eTitre').hidden) dessinerFondTitre(); });
window.addEventListener('resize', () => { if (!E) dessinerFondTitre(); });
ecranTitre();
requestAnimationFrame(boucle);

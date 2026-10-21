/* =====================================================================
   LE THÉ DES JARLS · les RÈGLES (logique pure, sans affichage ni stockage).
   Duel de dés à la manière de l'Orlog : 6 dés, 3 lancers chacun à tour de
   rôle, faces dorées = jetons de faveur, puis une faveur des dieux, puis la
   bataille (flèches contre boucliers, haches contre casques, éclaireurs qui
   volent des jetons). 15 PV par armée ; la première à 0 a perdu.
   Tout l'aléatoire passe par des générateurs à graine (jarRng), un flux par
   (usage, manche, n°) : les choix d'un joueur ne changent pas ce que l'autre
   tire. Les fonctions modifient l'état reçu (un objet JSON, sauvegardable
   tel quel) et ne touchent à rien d'autre : ni DOM, ni Math.random().
   - Dans la page : script classique chargé avant ia.js et jeu.js ; tout est
     en portée globale (noms préfixés jar / JAR).
   - Dans Node : outils/jarls-simulateur.js charge regles.js et ia.js dans un
     même contexte (vm), comme la page.
   Cahier des charges : specs/the-des-jarls.md.
   ===================================================================== */
'use strict';
const JAR_RUN_V = 1;
const JAR_PV = 15;
const JAR_LANCERS = 3;
const JAR_HIVER = 10;   // à partir de cette manche, l'hiver mord : chaque armée perd 1 PV à la fin de la manche, puis 2, puis 3… (pas de duel sans fin)
const JAR_FACES = ['hache', 'fleche', 'casque', 'bouclier', 'main'];
// les 6 dés : deux haches, une flèche, un casque, un bouclier, une main ; deux faces dorées par dé, à des places différentes
const JAR_DES = [
  ['hache', 'hache', 'fleche*', 'casque', 'bouclier*', 'main'],
  ['hache*', 'hache', 'fleche', 'casque', 'bouclier', 'main*'],
  ['hache', 'hache', 'fleche*', 'casque*', 'bouclier', 'main'],
  ['hache', 'hache', 'fleche', 'casque', 'bouclier*', 'main*'],
  ['hache', 'hache*', 'fleche', 'casque*', 'bouclier', 'main'],
  ['hache', 'hache', 'fleche*', 'casque', 'bouclier', 'main*'],
].map(d => d.map(s => ({ f: s.replace('*', ''), or: s.endsWith('*') })));
// dé ajouté par Freyja : le premier dé
const JAR_DE_BONUS = JAR_DES[0];

/* ---------- les faveurs des dieux ----------
   cout et val : niveaux I, II, III. quand : 'avant' (payée avant la bataille, dans l'ordre de prio),
   'apres' (payée après le vol des jetons : elle échoue si les éclaireurs ont pris de quoi la payer).
   style : comment l'ordinateur joue quand il incarne ce dieu (poids des faces à garder). */
const JAR_FAVEURS = {
  thrymr:   { dieu: 'Thrymr',   nom: 'Larcin de Thrymr',      cout: [3, 6, 9],    val: [1, 2, 3], quand: 'avant', prio: 1, txt: n => `La faveur adverse perd ${n} niveau${n > 1 ? 'x' : ''}.` },
  var:      { dieu: 'Var',      nom: 'Serment de Var',        cout: [6, 9, 12]  , val: [1, 2, 3], quand: 'avant', prio: 1, txt: n => `+${n} PV par jeton que l'adversaire dépense.` },
  freyja:   { dieu: 'Freyja',   nom: 'Abondance de Freyja',   cout: [2, 4, 6],    val: [1, 2, 3], quand: 'avant', prio: 2, txt: n => `Lance ${n} dé${n > 1 ? 's' : ''} de plus pour la bataille.` },
  frigg:    { dieu: 'Frigg',    nom: 'Regard de Frigg',       cout: [2, 3, 4],    val: [2, 3, 4], quand: 'avant', prio: 2, txt: n => `Relance les ${n} meilleurs dés adverses.` },
  loki:     { dieu: 'Loki',     nom: 'Ruse de Loki',          cout: [3, 6, 9],    val: [1, 2, 3], quand: 'avant', prio: 2, txt: n => `Écarte ${n} dé${n > 1 ? 's' : ''} adverse${n > 1 ? 's' : ''} (les plus dangereux).` },
  tyr:      { dieu: 'Tyr',      nom: 'Gage de Tyr',           cout: [4, 6, 8],    val: [2, 3, 4], quand: 'avant', prio: 3, txt: n => `Sacrifie 1 PV : l'adversaire perd ${n} jetons.` },
  vidar:    { dieu: 'Vidar',    nom: 'Puissance de Vidar',    cout: [2, 4, 6],    val: [2, 4, 6], quand: 'avant', prio: 4, txt: n => `Retire ${n} casques à l'adversaire.` },
  ullr:     { dieu: 'Ullr',     nom: 'Visée d\'Ullr',         cout: [2, 3, 4],    val: [2, 3, 6], quand: 'avant', prio: 4, txt: n => `${n} flèches passent les boucliers.` },
  baldr:    { dieu: 'Baldr',    nom: 'Invulnérabilité de Baldr', cout: [2, 4, 6], val: [1, 2, 3], quand: 'avant', prio: 4, txt: n => `+${n} défense par dé casque ou bouclier.` },
  brunhild: { dieu: 'Brunhild', nom: 'Fureur de Brunhild',    cout: [5, 8, 14],   val: [1.5, 2, 3], quand: 'avant', prio: 4, txt: n => `Haches ×${String(n).replace('.', ',')} (arrondi au-dessus).` },
  freyr:    { dieu: 'Freyr',    nom: 'Présent de Freyr',      cout: [4, 6, 8],    val: [2, 3, 4], quand: 'avant', prio: 4, txt: n => `+${n} à la face la plus nombreuse.` },
  skadi:    { dieu: 'Skadi',    nom: 'Chasse de Skadi',       cout: [6, 10, 14],  val: [1, 2, 3], quand: 'avant', prio: 4, txt: n => `+${n} flèche${n > 1 ? 's' : ''} par dé flèche.` },
  heimdall: { dieu: 'Heimdall', nom: 'Veille de Heimdall',    cout: [4, 7, 10],   val: [1, 2, 3], quand: 'avant', prio: 4, txt: n => `+${n} PV par attaque parée.` },
  hel:      { dieu: 'Hel',      nom: 'Étreinte de Hel',       cout: [5, 9, 14]  ,  val: [1, 2, 3], quand: 'avant', prio: 4, txt: n => `+${n} PV pour toi par PV que tes haches font perdre.` },
  mimir:    { dieu: 'Mimir',    nom: 'Sagesse de Mimir',      cout: [3, 5, 7],    val: [1, 2, 3], quand: 'avant', prio: 4, txt: n => `+${n} jeton${n > 1 ? 's' : ''} par PV perdu dans la bataille.` },
  bragi:    { dieu: 'Bragi',    nom: 'Verve de Bragi',        cout: [4, 8, 12],   val: [2, 3, 4], quand: 'avant', prio: 4, txt: n => `+${n} jetons par dé main.` },
  skuld:    { dieu: 'Skuld',    nom: 'Dette de Skuld',        cout: [4, 6, 8],    val: [2, 3, 4], quand: 'avant', prio: 4, txt: n => `L'adversaire perd ${n} jetons par dé flèche.` },
  thor:     { dieu: 'Thor',     nom: 'Foudre de Thor',        cout: [4, 8, 12],   val: [2, 5, 8], quand: 'apres', prio: 6, txt: n => `L'adversaire perd ${n} PV après la bataille.` },
  idunn:    { dieu: 'Idunn',    nom: 'Pommes d\'Idunn',       cout: [4, 7, 10],   val: [2, 4, 6], quand: 'apres', prio: 7, txt: n => `+${n} PV après la bataille.` },
  odin:     { dieu: 'Odin',     nom: 'Sacrifice d\'Odin',     cout: [2, 3, 4],    val: [3, 4, 5], quand: 'apres', prio: 7, txt: n => `Sacrifie 3 PV (jamais le dernier) : +${n} jetons par PV.` },
};
const JAR_IDS = Object.keys(JAR_FAVEURS);
const jarCout = (id, niv) => JAR_FAVEURS[id].cout[niv - 1];
const jarTexte = (id, niv) => JAR_FAVEURS[id].txt(JAR_FAVEURS[id].val[niv - 1]);

/* ---------- hasard à graine ---------- */
// mulberry32, le même que les autres jeux
function jarMulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// un flux par (graine, usage, a, b) : usage = premier, de, freyja, frigg, ia
function jarRng(graine, usage, a, b) {
  let h = 2166136261;
  for (const ch of String(graine) + '|' + usage + '|' + (a || 0) + '|' + (b || 0)) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 13; }
  return jarMulberry(h >>> 0);
}

/* ---------- nouvelle partie ----------
   joueurs : [{ nom, faveurs: [3 ids], ia: null | { dieu, niveau } }, …] ; le camp 0 est en bas de l'écran.
   o (facultatif) : { premier: 0 | 1, imposes: { 'manche-camp-lancer': [6 faces] } } pour le duel guidé. */
function jarNouvelle(graine, joueurs, mode, o) {
  o = o || {};
  const premier = o.premier != null ? o.premier : jarRng(graine, 'premier')() < 0.5 ? 0 : 1;
  const etat = {
    v: JAR_RUN_V, graine, mode: mode || 'libre', manche: 1, premier, tour: premier, phase: 'lancer',
    camps: joueurs.map(j => ({ nom: j.nom, ia: j.ia || null, faveurs: j.faveurs.slice(0, 3), pv: JAR_PV, jetons: 0, des: JAR_DES.map(() => ({ k: -1, garde: false })), lancers: 0, fini: false, choix: undefined })),
    journal: [], fin: null,
  };
  if (o.imposes) etat.imposes = o.imposes;
  return etat;
}
const jarAutre = i => 1 - i;
const jarFace = (j, d) => d.k < 0 ? null : JAR_DES[j][d.k];

/* ---------- les lancers ---------- */
function jarPeutLancer(etat, i) { const c = etat.camps[i]; return etat.phase === 'lancer' && etat.tour === i && !c.fini && c.lancers < JAR_LANCERS; }
function jarLancer(etat, i) {
  if (!jarPeutLancer(etat, i)) return false;
  const c = etat.camps[i], R = jarRng(etat.graine, 'de', etat.manche * 2 + i, c.lancers);
  // dés arrangés (duel guidé) : etat.imposes['manche-camp-lancer'] = les 6 faces (n° dans JAR_DES[j]) ; sinon le hasard à graine
  const imp = etat.imposes && etat.imposes[`${etat.manche}-${i}-${c.lancers}`];
  c.des.forEach((d, j) => { const x = Math.floor(R() * 6); if (!d.garde) d.k = imp ? imp[j] : x; });   // on tire toujours 6 nombres : garder un dé ne change pas les autres
  c.lancers++;
  if (c.lancers >= JAR_LANCERS) jarClore(etat, i); else jarPasser(etat, i);
  return true;
}
// garder ou relâcher un dé (avant de relancer)
function jarGarder(etat, i, j) {
  const c = etat.camps[i];
  if (etat.phase !== 'lancer' || etat.tour !== i || c.fini || c.lancers === 0) return false;
  c.des[j].garde = !c.des[j].garde;
  return true;
}
// tout garder : ses lancers sont finis pour la manche
function jarFinir(etat, i) {
  const c = etat.camps[i];
  if (etat.phase !== 'lancer' || etat.tour !== i || c.fini || c.lancers === 0) return false;
  jarClore(etat, i);
  return true;
}
function jarClore(etat, i) { const c = etat.camps[i]; c.fini = true; c.des.forEach(d => d.garde = true); jarPasser(etat, i); }
// à qui de lancer ? chacun son tour, sauf si l'autre a fini ; tous deux finis → les faveurs
function jarPasser(etat, i) {
  const o = jarAutre(i), [a, b] = [etat.camps[i], etat.camps[o]];
  if (a.fini && b.fini) { etat.phase = 'faveur'; etat.tour = etat.premier; return; }
  etat.tour = b.fini ? i : o;
}

/* ---------- les faveurs ----------
   chacun à son tour (le premier joueur d'abord) choisit une de ses trois faveurs et son niveau, ou aucune. */
function jarChoisir(etat, i, id, niv) {
  if (etat.phase !== 'faveur' || etat.tour !== i) return false;
  const c = etat.camps[i];
  if (id && (!c.faveurs.includes(id) || !(niv >= 1 && niv <= 3))) return false;
  c.choix = id ? { id, niv } : null;
  const o = jarAutre(i);
  if (etat.camps[o].choix === undefined) etat.tour = o; else etat.phase = 'bataille';
  return true;
}
// jetons attendus avant la bataille : ceux qu'on a + les faces dorées
const jarOrDe = c => c.des.reduce((n, d, j) => n + (jarFace(j, d) && jarFace(j, d).or ? 1 : 0), 0);

/* ---------- la bataille ----------
   Applique toute la résolution et renvoie la liste des événements, dans l'ordre, chacun avec l'état
   des deux camps juste après lui (pv, jetons) pour que la page les montre un par un :
   or, faveur (payée ou ratée), thrymr, freyja, frigg, loki, tyr, fleches, haches, soin, jetons, perte, vol, thor, idunn, odin, hiver, fin. */
function jarBataille(etat) {
  if (etat.phase !== 'bataille') return [];
  const C = etat.camps, ev = [], m = etat.manche, P = etat.premier, ordre = [P, jarAutre(P)];
  const pousser = e => { e.etat = C.map(c => ({ pv: c.pv, jetons: c.jetons })); ev.push(e); return e; };
  // les dés de la bataille : { f, or, j } (j = n° du dé, -1 pour un dé de Freyja) ; un dé écarté par Loki est retiré
  const des = C.map(c => c.des.map((d, j) => Object.assign({ j }, jarFace(j, d))).filter(d => d.f));
  const choix = C.map(c => c.choix ? Object.assign({}, c.choix) : null);
  const varN = [0, 0];      // Serment de Var : PV gagnés par jeton dépensé par l'adversaire
  const mort = () => C.some(c => c.pv <= 0);
  const payer = (i, id, niv) => {
    const cout = jarCout(id, niv), c = C[i];
    if (c.jetons < cout) { pousser({ t: 'faveur', qui: i, id, niv, ok: false, cout }); return false; }
    c.jetons -= cout;
    pousser({ t: 'faveur', qui: i, id, niv, ok: true, cout });
    const o = jarAutre(i);
    if (varN[o] && cout) { const n = Math.min(JAR_PV - C[o].pv, varN[o] * cout); if (n > 0) { C[o].pv += n; pousser({ t: 'soin', qui: o, n, raison: 'var' }); } }
    return true;
  };
  const compte = i => { const n = { hache: 0, fleche: 0, casque: 0, bouclier: 0, main: 0 }; for (const d of des[i]) n[d.f]++; return n; };

  // 1. les faces dorées rapportent un jeton chacune
  for (const i of ordre) { const n = des[i].filter(d => d.or).length; if (n) { C[i].jetons += n; pousser({ t: 'or', qui: i, n }); } }

  // 2. les faveurs payées avant la bataille, par priorité (à égalité, le premier joueur d'abord)
  const avant = ordre.filter(i => choix[i] && JAR_FAVEURS[choix[i].id].quand === 'avant').sort((a, b) => JAR_FAVEURS[choix[a].id].prio - JAR_FAVEURS[choix[b].id].prio);
  const actif = [null, null];   // faveurs payées : { id, n }
  for (const i of avant) {
    const o = jarAutre(i), ch = choix[i];
    if (!ch || ch.niv < 1) continue;   // annulée par Thrymr
    if (!payer(i, ch.id, ch.niv)) continue;
    const F = JAR_FAVEURS[ch.id], n = F.val[ch.niv - 1];
    actif[i] = { id: ch.id, n };
    if (ch.id === 'thrymr' && choix[o]) {
      const avantNiv = choix[o].niv; choix[o].niv = Math.max(0, avantNiv - n);
      pousser({ t: 'thrymr', qui: i, cible: choix[o].id, de: avantNiv, a: choix[o].niv });
      if (choix[o].niv === 0) choix[o] = null;
    } else if (ch.id === 'var') varN[i] = n;
    else if (ch.id === 'freyja') {
      const R = jarRng(etat.graine, 'freyja', m * 2 + i), ajout = [];
      for (let k = 0; k < n; k++) { const f = JAR_DE_BONUS[Math.floor(R() * 6)]; ajout.push(f.f); des[i].push(Object.assign({ j: -1 }, f)); if (f.or) C[i].jetons++; }
      pousser({ t: 'freyja', qui: i, faces: ajout });
    } else if (ch.id === 'frigg') {
      const R = jarRng(etat.graine, 'frigg', m * 2 + i), cibles = jarMenaces(des[o], des[i], C[o].jetons).slice(0, n), faces = [];
      for (const d of cibles) { const f = JAR_DES[d.j < 0 ? 0 : d.j][Math.floor(R() * 6)]; d.f = f.f; d.or = f.or; faces.push(f.f); }
      pousser({ t: 'frigg', qui: i, faces });
    } else if (ch.id === 'loki') {
      const cibles = jarMenaces(des[o], des[i], C[o].jetons).slice(0, n);
      des[o] = des[o].filter(d => !cibles.includes(d));
      pousser({ t: 'loki', qui: i, faces: cibles.map(d => d.f) });
    } else if (ch.id === 'tyr') {
      if (C[i].pv > 1) { C[i].pv -= 1; const n2 = Math.min(C[o].jetons, n); C[o].jetons -= n2; pousser({ t: 'tyr', qui: i, n: n2 }); }
    }
  }
  const eff = (i, id) => actif[i] && actif[i].id === id ? actif[i].n : 0;

  // 3. la bataille : flèches contre boucliers, puis haches contre casques
  const N = [compte(0), compte(1)];
  const force = N.map((n, i) => {
    const o = jarAutre(i), f = { hache: n.hache, fleche: n.fleche, casque: n.casque, bouclier: n.bouclier, main: n.main };
    const fr = eff(i, 'freyr');
    if (fr) { const maj = JAR_FACES.reduce((a, b) => n[b] > n[a] ? b : a, 'hache'); if (n[maj] > 0) f[maj] += fr; }
    if (eff(i, 'brunhild')) f.hache = Math.ceil(f.hache * eff(i, 'brunhild'));
    f.fleche += eff(i, 'skadi') * n.fleche;
    f.casque += eff(i, 'baldr') * n.casque; f.bouclier += eff(i, 'baldr') * n.bouclier;
    f.vidar = eff(o, 'vidar');
    f.ullr = Math.min(f.fleche, eff(i, 'ullr'));
    return f;
  });
  force.forEach(f => { f.casque = Math.max(0, f.casque - f.vidar); });
  const pare = [0, 0], blesse = [0, 0], blHache = [0, 0];
  const att = (type, def) => {
    const dmg = [0, 0], par = [0, 0];
    for (const i of [0, 1]) {
      const o = jarAutre(i), a = force[i][type], perce = type === 'fleche' ? force[i].ullr : 0;
      par[o] = Math.min(a - perce, force[o][def]); dmg[o] = a - par[o];
    }
    return { dmg, par };
  };
  for (const [type, def, t] of [['fleche', 'bouclier', 'fleches'], ['hache', 'casque', 'haches']]) {
    if (!force[0][type] && !force[1][type]) continue;
    const r = att(type, def);
    for (const i of [0, 1]) { C[i].pv -= r.dmg[i]; pare[i] += r.par[i]; blesse[i] += r.dmg[i]; if (type === 'hache') blHache[jarAutre(i)] += r.dmg[i]; }
    pousser({ t, att: [force[0][type], force[1][type]], def: [force[0][def], force[1][def]], dmg: r.dmg, perce: [force[0].ullr, force[1].ullr].map(x => type === 'fleche' ? x : 0) });
  }
  if (mort()) return jarConclure(etat, ev, pousser);
  // soins de la bataille (Heimdall, Hel), jetons de la bataille (Mimir, Bragi), pertes (Skuld)
  for (const i of ordre) {
    let s = eff(i, 'heimdall') * pare[i] + eff(i, 'hel') * blHache[i];
    s = Math.min(s, JAR_PV - C[i].pv);
    if (s > 0) { C[i].pv += s; pousser({ t: 'soin', qui: i, n: s, raison: actif[i].id }); }
    const j = eff(i, 'mimir') * blesse[i] + eff(i, 'bragi') * N[i].main;
    if (j > 0) { C[i].jetons += j; pousser({ t: 'jetons', qui: i, n: j, raison: actif[i].id }); }
    const o = jarAutre(i), p = Math.min(C[o].jetons, eff(i, 'skuld') * N[i].fleche);
    if (p > 0) { C[o].jetons -= p; pousser({ t: 'perte', qui: o, n: p, raison: 'skuld' }); }
  }

  // 4. les éclaireurs volent un jeton par main (en même temps)
  if (N[0].main || N[1].main) {
    const v = [Math.min(N[0].main, C[1].jetons), Math.min(N[1].main, C[0].jetons)];
    C[0].jetons += v[0] - v[1]; C[1].jetons += v[1] - v[0];
    pousser({ t: 'vol', att: [N[0].main, N[1].main], v });
  }

  // 5. les faveurs payées après la bataille (elles ratent si les jetons ont été volés)
  const apres = ordre.filter(i => choix[i] && JAR_FAVEURS[choix[i].id].quand === 'apres').sort((a, b) => JAR_FAVEURS[choix[a].id].prio - JAR_FAVEURS[choix[b].id].prio);
  for (const i of apres) {
    if (mort()) break;
    const o = jarAutre(i), ch = choix[i], n = JAR_FAVEURS[ch.id].val[ch.niv - 1];
    if (!payer(i, ch.id, ch.niv)) continue;
    if (ch.id === 'thor') { const d = Math.min(n, C[o].pv); C[o].pv -= d; pousser({ t: 'thor', qui: i, n: d }); }
    else if (ch.id === 'idunn') { const s = Math.min(n, JAR_PV - C[i].pv); C[i].pv += s; pousser({ t: 'idunn', qui: i, n: s }); }
    else if (ch.id === 'odin') { const pv = Math.min(3, C[i].pv - 1); C[i].pv -= pv; C[i].jetons += pv * n; pousser({ t: 'odin', qui: i, pv, n: pv * n }); }
  }
  // 6. l'hiver
  if (!mort() && m >= JAR_HIVER) { const n = m - JAR_HIVER + 1; C.forEach(c => { c.pv -= n; }); pousser({ t: 'hiver', n }); }
  return jarConclure(etat, ev, pousser);
}
// les dés adverses classés du plus dangereux au moins dangereux (Frigg relance, Loki écarte)
function jarMenaces(desAdv, mesDes, sesJetons) {
  const mien = f => mesDes.filter(d => d.f === f).length;
  const val = d => (d.f === 'hache' ? (mien('casque') ? 1.5 : 3) : d.f === 'fleche' ? (mien('bouclier') ? 1.5 : 3)
    : d.f === 'main' ? 1.2 : d.f === 'casque' ? (mien('hache') ? 2 : 0.3) : (mien('fleche') ? 2 : 0.3)) + (d.or ? 1.4 : 0);
  return desAdv.slice().sort((a, b) => val(b) - val(a) || a.j - b.j);
}
function jarConclure(etat, ev, pousser) {
  const C = etat.camps;
  etat.journal.push({ manche: etat.manche, pv: C.map(c => c.pv), jetons: C.map(c => c.jetons), choix: C.map(c => c.choix) });
  if (C.some(c => c.pv <= 0)) {
    // les PV peuvent passer sous zéro pendant la bataille : si les deux armées tombent ensemble, celle qui tombe le moins bas gagne
    // (à égalité, celle qui a le plus de jetons : la faveur des dieux)
    const g = C[0].pv !== C[1].pv ? (C[0].pv > C[1].pv ? 0 : 1) : C[0].jetons !== C[1].jetons ? (C[0].jetons > C[1].jetons ? 0 : 1) : -1;
    C.forEach(c => { c.pv = Math.max(0, c.pv); });
    etat.fin = { gagnant: g, manche: etat.manche };
    etat.phase = 'fin';
  } else etat.phase = 'bilan';
  pousser({ t: 'fin', gagnant: etat.fin ? etat.fin.gagnant : null });   // la seule fois où l'état joint montre les PV ramenés à 0
  return ev;
}
// manche suivante : le premier joueur change
function jarSuivante(etat) {
  if (etat.phase !== 'bilan') return false;
  etat.manche++;
  etat.premier = jarAutre(etat.premier); etat.tour = etat.premier; etat.phase = 'lancer';
  for (const c of etat.camps) { c.lancers = 0; c.fini = false; c.choix = undefined; c.des.forEach(d => { d.k = -1; d.garde = false; }); }
  return true;
}
// une partie sauvegardée par une ancienne version
function jarMigrer(etat) { if (!etat || etat.v !== JAR_RUN_V) return null; return etat; }

if (typeof module !== 'undefined') module.exports = { JAR_FAVEURS };

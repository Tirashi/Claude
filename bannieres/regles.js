/* =====================================================================
   BANNIÈRES · les RÈGLES (logique pure, sans affichage ni stockage).
   Carte de cases hexagonales (37, ou 61), armées de guerriers, village
   (bâtiments, décorations), batailles, pièces, tours, fin de partie.
   Tout l'aléatoire passe par des générateurs à graine, un flux par usage
   (carte, depart, bataille, deco, surprise, ia), dérivé de (graine, usage,
   tour, n°) : aucun Math.random().
   Les fonctions modifient l'état reçu (un objet JSON, sauvegardable tel
   quel) et ne touchent à rien d'autre (ni DOM, ni stockage).
   - Dans la page : script classique chargé avant surprises.js, ia.js et
     jeu.js ; tout est en portée globale (noms préfixés ban / BAN).
   - Dans Node : outils/bannieres-simulateur.js charge regles.js,
     surprises.js et ia.js dans un même contexte (vm), comme la page.
   Cahier des charges : specs/bannieres.md (version 7 ans).
   ===================================================================== */
'use strict';
const BAN_V = 1;
const BAN_DERNIER_TOUR = 25;   // après le tour 25, on compte les drapeaux (§ 2)
const BAN_POINTS = 2;          // pas par tour (§ 4)
const BAN_MAX_UNITES = 6, BAN_MAX_UNITES_REMPARTS = 8, BAN_MAX_ARMEES = 3;   // 8 guerriers par armée quand le château a ses remparts (6 bâtiments)
const BAN_COFFRE = 30;   // le coffre est plein à 30 pièces : au-delà, on ne gagne plus rien (« dépense-les ! »)
const BAN_PRIX_SOIN = 1;   // au château, 1 pièce rend tous les cœurs d'une armée
const BAN_SAISONS = ['printemps', 'été', 'automne', 'hiver'];
const BAN_VOIS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];   // 0 = est, puis dans le sens des aiguilles d'une montre vu du ciel
const BAN_COUT = { plaine: 1, foret: 2, colline: 2, marais: 2, riviere: 2, montagne: 2 };   // une montagne arrête en plus
const BAN_COULEURS = ['or', 'rouge', 'bleu', 'violet'];
const BAN_NOMS = ['Ta bannière', 'Baron Aldric', 'Comtesse Ysolde', 'Sire Gauvain'];
const BAN_CARACTERES = ['costaud', 'batisseur', 'malin'];   // § 8 : il attaque / il construit / il attend d'être plus fort
const BAN_NIVEAUX = {
  // facile : les rivaux n'attaquent le joueur qu'avec ★★★, jamais avant le tour 5, et ne prennent pas les châteaux des autres rivaux
  facile: { pieces: 12, bonus: 1, seuil: 0.75, premierTour: 5, chateauxRivaux: false, garde: ['fantassin', 'fantassin', 'lancier', 'archer', 'archer'] },
  normal: { pieces: 10, bonus: 0, seuil: 0, premierTour: 2, chateauxRivaux: true, audace: 0.12, bonusRivaux: 1 },   // seuil 0 : celui du caractère, moins l'audace ; +1 pièce par tour aux rivaux
};
const BAN_UNITES = {
  seigneur: { nom: 'Seigneur', pv: 5, att: 2 },
  fantassin: { nom: 'Chevalier', pv: 3, att: 1, pare: true, prix: 3 },
  archer: { nom: 'Archer', pv: 2, att: 1, tir: true, prix: 3 },
  lancier: { nom: 'Lancier', pv: 3, att: 1, contre: true, prix: 3 },   // +1 au premier assaut contre une armée qui fonce
  mage: { nom: 'Mage', pv: 2, att: 1, feu: true, prix: 5 },
  champion: { nom: 'Champion', pv: 4, att: 2, double: true, prix: 6, caserne: true },
  barbare: { nom: 'Barbare', pv: 3, att: 1 },
  voleur: { nom: 'Voleur', pv: 2, att: 1, fuit: true },
  squelette: { nom: 'Squelette', pv: 2, att: 1, os: true },   // les flèches passent une fois sur deux entre les os
  sbire: { nom: 'Sbire', pv: 2, att: 1, os: true },
  necromancien: { nom: 'Nécromancien', pv: 2, att: 1, feu: true, os: true },
};
const BAN_ACHATS = ['fantassin', 'archer', 'lancier', 'mage', 'champion'];
const BAN_BATIMENTS = {
  maison: { nom: 'Maison', prix: 4, gain: 1, phrase: '+1 pièce à chaque tour.', grand: 'Grande maison', plus: '+1 pièce de plus.' },
  moulin: { nom: 'Moulin', prix: 6, gain: 2, phrase: '+2 pièces à chaque tour.', grand: 'Grand moulin', plus: '+1 pièce de plus.' },
  marche: { nom: 'Marché', prix: 10, gain: 3, phrase: '+3 pièces à chaque tour.', grand: 'Grand marché', plus: '+1 pièce de plus.' },
  forge: { nom: 'Forge', prix: 8, gain: 0, phrase: 'Tes chevaliers et lanciers ont 1 cœur de plus.', grand: 'Grande forge', plus: 'Tes champions aussi ont 1 cœur de plus.' },
  caserne: { nom: 'Caserne', prix: 8, gain: 0, phrase: 'Tu peux acheter des champions.', grand: 'Grande caserne', plus: 'Les champions coûtent 1 pièce de moins.' },
  tour: { nom: 'Tour', prix: 6, gain: 0, phrase: 'Ici, tes archers tirent une fois de plus.', grand: 'Grande tour', plus: 'Ici, tes archers tirent encore une fois de plus.' },
};
// améliorer un bâtiment, une fois : au même prix que le bâtiment (la case garde t.grand = true)
const BAN_DECORS = ['puits', 'brouette', 'tonneau', 'caisses', 'cible', 'seau', 'palette', 'sac'];
const BAN_DECOS_PAR_CASE = 3, BAN_PRIX_DECO = 1;
const BAN_TRESOR = { camp: 5, ruine: 6 };
const BAN_GARDE = ['fantassin', 'fantassin', 'archer', 'archer'];   // un château sans armée se défend avec sa garde (elle ne bouge pas) ; en facile, celle du joueur est plus grande
const BAN_ETAPES_CHATEAU = [3, 6];   // le château grandit à 3 bâtiments (drapeaux), puis à 6 (remparts)

/* ---------- hasard ---------- */
function banMulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function banRng(graine, usage, a, b) {
  let h = 2166136261;
  for (const ch of String(graine) + '|' + usage + '|' + (a || 0) + '|' + (b || 0)) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 13; }
  return banMulberry(h >>> 0);
}
const banEntre = (R, a, b) => a + Math.floor(R() * (b - a + 1));
const banMelanger = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function banPondere(R, poids) { let t = 0; for (const k in poids) t += poids[k]; let x = R() * t; for (const k in poids) { x -= poids[k]; if (x < 0) return k; } return Object.keys(poids)[0]; }

/* ---------- la grille : rayon 3 (37 cases) ou 4 (61 cases) ---------- */
const banGrilles = {};
function banGrille(rayon) {
  if (banGrilles[rayon]) return banGrilles[rayon];
  const cases = [];   // [q, r], ligne par ligne (r de −rayon à rayon)
  for (let r = -rayon; r <= rayon; r++) for (let q = -rayon; q <= rayon; q++) if (Math.abs(q + r) <= rayon) cases.push([q, r]);
  const ici = (q, r) => cases.findIndex(c => c[0] === q && c[1] === r);
  const voisins = cases.map(([q, r]) => BAN_VOIS.map(([dq, dr]) => ici(q + dq, r + dr)).filter(i => i >= 0));
  const coins = [ici(-rayon, rayon), ici(0, -rayon), ici(rayon, -rayon), ici(rayon, 0)];   // toi en bas à gauche, les rivaux à 2 × rayon pas
  return (banGrilles[rayon] = { rayon, cases, ici, voisins, coins });
}
const banG = etat => banGrille(etat.rayon);
const banVoisins = (etat, i) => banG(etat).voisins[i];
const banChateau = (etat, s) => banG(etat).coins[s];
function banDist(etat, i, j) { const C = banG(etat).cases, [a, b] = C[i], [c, d] = C[j]; return (Math.abs(a - c) + Math.abs(b - d) + Math.abs(a + b - c - d)) / 2; }
const banSaison = tour => BAN_SAISONS[(tour - 1) % 4];

/* ---------- nouvelle partie ---------- */
function banCarte(graine, rayon) {
  const G = banGrille(rayon), R = banRng(graine, 'carte');
  const terres = G.cases.map(([q, r]) => ({ q, r, t: banPondere(R, { plaine: 34, foret: 24, colline: 16, montagne: 9, marais: 9 }) }));
  // la rivière : part d'un bord et avance vers le bord opposé en ondulant
  const d = banEntre(R, 0, 5), [dq, dr] = BAN_VOIS[d], [eq, er] = BAN_VOIS[(d + 1) % 6];
  const bord = G.cases.map((c, i) => i).filter(i => G.voisins[i].length < 6 && G.ici(G.cases[i][0] - dq, G.cases[i][1] - dr) < 0 && G.ici(G.cases[i][0] - eq, G.cases[i][1] - er) < 0 && !G.coins.includes(i));
  let i = bord.length ? bord[banEntre(R, 0, bord.length - 1)] : G.ici(0, -rayon);
  for (let n = 0; i >= 0 && n < 3 * rayon; n++) {
    terres[i].t = 'riviere';
    const [q, r] = G.cases[i], s = R() < 0.5 ? [dq, dr] : [eq, er];
    i = G.ici(q + s[0], r + s[1]);
  }
  return terres;
}

function banNouvelle(graine, niveau, rayon) {
  niveau = BAN_NIVEAUX[niveau] ? niveau : 'facile'; rayon = rayon === 4 ? 4 : 3;
  const G = banGrille(rayon), R = banRng(graine, 'depart');
  const terres = banCarte(graine, rayon).map(t => ({ ...t, prop: -1, bat: null, grand: false, decos: [], camp: false, ruine: false }));
  const car = banMelanger(R, BAN_CARACTERES.slice());
  const seigneurs = BAN_NOMS.map((nom, s) => ({ nom, coul: BAN_COULEURS[s], car: s ? car[s - 1] : null, pieces: s ? 10 : BAN_NIVEAUX[niveau].pieces, blesse: 0, tombe: false }));
  const etat = { v: BAN_V, graine, rayon, niveau, tour: 1, terres, seigneurs, armees: [], id: 1, nb: 0, pluie: false, surprise: null, fin: null };
  const armee = (s, terre, l) => etat.armees.push({ id: etat.id++, s, terre, pts: s >= 0 ? BAN_POINTS : 0, combat: false, unites: l.map(t => banUnite(etat, t, s)) });
  const DEPART = { costaud: ['champion', 'fantassin', 'lancier', 'archer', 'archer'], batisseur: ['fantassin', 'lancier', 'archer', 'archer'], malin: ['fantassin', 'lancier', 'archer', 'archer', 'mage'] };
  for (let s = 0; s < 4; s++) {
    const c = G.coins[s]; Object.assign(terres[c], { t: 'plaine', prop: s, bat: 'chateau' });
    const v = banMelanger(R, G.voisins[c].slice()).slice(0, 2);
    v.forEach(j => { terres[j].prop = s; if (terres[j].t === 'montagne') terres[j].t = 'colline'; });
    if (s === 0) { armee(0, c, ['seigneur', 'fantassin', 'archer', 'mage']); armee(0, v[0], ['lancier', 'fantassin', 'archer']); }
    else {
      armee(s, c, DEPART[seigneurs[s].car]);
      armee(s, v[1], ['fantassin', 'fantassin', 'archer']);
      if (seigneurs[s].car === 'batisseur') seigneurs[s].pieces += 4;
    }
  }
  // des camps de brigands et des ruines hantées sur des cases libres, loin des châteaux (2 + 2, ou 3 + 3 sur la grande carte)
  const n = rayon === 4 ? 3 : 2;
  const loin = terres.map((t, i) => i).filter(i => terres[i].prop < 0 && G.coins.every(c => banDist(etat, i, c) >= 2) && terres[i].t !== 'marais' && terres[i].t !== 'riviere');
  banMelanger(R, loin).slice(0, 2 * n).forEach((i, k) => {
    if (k < n) { terres[i].camp = true; armee(-1, i, k % 2 ? ['barbare', 'barbare', 'barbare', 'voleur'] : ['barbare', 'barbare', 'voleur', 'voleur', 'barbare']); }
    else { terres[i].ruine = true; armee(-2, i, k % 2 ? ['squelette', 'squelette', 'sbire', 'necromancien'] : ['squelette', 'sbire', 'sbire', 'squelette', 'necromancien']); }
  });
  return etat;
}
function banMigrer(etat) {
  if (!etat || typeof etat !== 'object' || !Array.isArray(etat.terres) || !Array.isArray(etat.armees)) return null;
  if (!BAN_NIVEAUX[etat.niveau]) etat.niveau = 'facile';
  if (etat.rayon !== 4) etat.rayon = 3;
  if (banGrille(etat.rayon).cases.length !== etat.terres.length) return null;
  etat.v = BAN_V; return etat;
}

/* ---------- petites questions ---------- */
const banNon = raison => ({ ok: false, raison });
const banNiveau = etat => BAN_NIVEAUX[etat.niveau] || BAN_NIVEAUX.facile;
const banArmee = (etat, id) => etat.armees.find(a => a.id === id);
const banArmeeSur = (etat, i) => etat.armees.find(a => a.terre === i);
const banArmeesDe = (etat, s) => etat.armees.filter(a => a.s === s);
const banDrapeaux = (etat, s) => etat.terres.filter(t => t.prop === s).length;
const banChateaux = (etat, s) => etat.terres.filter(t => t.prop === s && t.bat === 'chateau').length;
const banNbBat = (etat, s, b) => etat.terres.filter(t => t.prop === s && t.bat && t.bat !== 'chateau' && (!b || t.bat === b)).length;
const banEtapeChateau = (etat, s) => BAN_ETAPES_CHATEAU.filter(n => banNbBat(etat, s) >= n).length;   // 0, 1 (drapeaux), 2 (remparts)
// les cœurs d'un guerrier : ceux de sa sorte, +1 avec une forge pour les chevaliers et les lanciers
const banCoeursMax = (etat, type, s) => BAN_UNITES[type].pv + (s >= 0 && ((type === 'fantassin' || type === 'lancier') && banNbBat(etat, s, 'forge') || type === 'champion' && banGrand(etat, s, 'forge')) ? 1 : 0);
const banUnite = (etat, type, s) => ({ type, pv: banCoeursMax(etat, type, s) });
const banGrand = (etat, s, b) => etat.terres.some(t => t.prop === s && t.bat === b && t.grand);
const banMaxUnites = (etat, s) => (s >= 0 && banEtapeChateau(etat, s) >= 2 ? BAN_MAX_UNITES_REMPARTS : BAN_MAX_UNITES);
const banPrix = (etat, s, type) => BAN_UNITES[type].prix - (type === 'champion' && banGrand(etat, s, 'caserne') ? 1 : 0);
// gagner des pièces, sans dépasser le coffre ; renvoie ce qui est vraiment entré
function banGagner(etat, s, n) { const S = etat.seigneurs[s], avant = S.pieces; S.pieces = Math.max(avant, Math.min(BAN_COFFRE, avant + n)); return S.pieces - avant; }
const banRevenu = (etat, s) => etat.terres.reduce((n, t) => n + (t.prop === s ? 1 + (t.bat && BAN_BATIMENTS[t.bat] && BAN_BATIMENTS[t.bat].gain ? BAN_BATIMENTS[t.bat].gain + (t.grand ? 1 : 0) : 0) : 0), 0) + (s === 0 ? banNiveau(etat).bonus : banNiveau(etat).bonusRivaux || 0);
// une case où il faut se battre : une armée d'un autre camp, ou le château d'un autre seigneur (sa garde)
const banEnnemiSur = (etat, s, i) => { const o = banArmeeSur(etat, i); return o ? o.s !== s : etat.terres[i].bat === 'chateau' && etat.terres[i].prop !== s; };

/* ---------- bouger ---------- */
// les cases atteignables : on paie le terrain d'arrivée ; une montagne, une armée ou un château ennemi arrêtent ;
// sur une armée à soi on s'arrête aussi (les deux armées n'en font qu'une, 6 guerriers au plus, 8 avec les remparts)
function banAtteignables(etat, a) {
  const meil = new Map([[a.terre, { cout: 0, de: -1 }]]), file = [a.terre];
  const arret = i => etat.terres[i].t === 'montagne' || !!banArmeeSur(etat, i) || banEnnemiSur(etat, a.s, i);
  while (file.length) {
    file.sort((x, y) => meil.get(x).cout - meil.get(y).cout);
    const i = file.shift(), ci = meil.get(i).cout;
    if (i !== a.terre && arret(i)) continue;
    for (const j of banVoisins(etat, i)) {
      const c = ci + BAN_COUT[etat.terres[j].t], o = banArmeeSur(etat, j);
      if (c > a.pts || (o && o.s === a.s && o.unites.length + a.unites.length > banMaxUnites(etat, a.s))) continue;
      if (!meil.has(j) || meil.get(j).cout > c) { meil.set(j, { cout: c, de: i }); file.push(j); }
    }
  }
  meil.delete(a.terre);
  return meil;
}
function banChemin(m, i) { const c = []; while (i >= 0 && m.has(i)) { c.unshift(i); i = m.get(i).de; } return c; }
// une case change de seigneur : elle garde ses bâtiments et ses décorations (ils changent de couleur)
function banPrendre(etat, i, s) { if (s >= 0) etat.terres[i].prop = s; }
// bouger une armée (une fois par tour) : elle prend les cases qu'elle traverse ; renvoie la bataille à livrer s'il y en a une
function banDeplacer(etat, id, vers) {
  const a = banArmee(etat, id);
  if (!a || etat.fin) return banNon('Pas d\'armée ici.');
  if (a.pts <= 0) return banNon('Cette armée a déjà bougé.');
  const m = banAtteignables(etat, a);
  if (!m.has(vers)) return banNon('Trop loin.');
  const ch = banChemin(m, vers), o = banArmeeSur(etat, vers), bataille = banEnnemiSur(etat, a.s, vers);
  const pas = bataille ? ch.slice(0, -1) : ch, pris = [];
  for (const j of pas) { a.terre = j; if (a.s >= 0 && etat.terres[j].prop !== a.s) { banPrendre(etat, j, a.s); pris.push(j); } }
  a.pts = 0;
  if (o && o.s === a.s) {   // deux armées à soi n'en font plus qu'une
    o.unites.push(...a.unites); o.combat = o.combat || a.combat; o.pts = 0;
    etat.armees.splice(etat.armees.indexOf(a), 1);
    return { ok: true, chemin: pas, pris, fusion: o.id, bataille: null };
  }
  return { ok: true, chemin: pas, pris, fusion: null, bataille: bataille ? { att: a.id, terre: vers } : null };
}

/* ---------- la bataille : la règle (pure, tirée d'une graine ; § 7) ---------- */
// l'ordre de combat : la mêlée devant, archers et mages derrière ; la première ligne, ce sont les 3 premiers vivants
const banDerriere = t => (BAN_UNITES[t].tir || BAN_UNITES[t].feu ? 1 : 0);
function banRangs(liste) { return liste.map((u, k) => k).filter(k => liste[k].pv > 0).sort((a, b) => banDerriere(liste[a].type) - banDerriere(liste[b].type) || a - b); }
// A attaque D ; tactiques : charger (FONCER), tenir (TIRER D'ABORD), harceler (PRUDENT, l'attaquant seulement) ;
// tourDef : volées de plus du défenseur (1 au château ou avec une tour, 2 avec une grande tour). Renvoie le journal (pour la rejouer), l'issue et les survivants.
function banSimuler(A, D, tacA, tacD, terrain, chateau, graine, tourDef) {
  const R = banMulberry(graine), a = A.map(u => ({ ...u })), d = D.map(u => ({ ...u })), journal = [];
  const cotes = [a, d], vivants = l => l.filter(u => u.pv > 0).length, n0 = [a.length, d.length];
  const front = c => banRangs(cotes[c]).slice(0, 3);
  const cible = c => { const f = front(c); return f.length ? f[Math.floor(R() * f.length)] : -1; };
  const frapper = (c, k, deg, coups) => { const u = cotes[c][k]; if (u.pv <= 0) return; u.pv = Math.max(0, u.pv - deg); coups.push({ c, k, deg, mort: u.pv === 0 }); };
  // 1. les volées : 1 en FONCER, 2 sinon, +1 au défenseur sur une colline ou avec une tour ; une boule de feu par mage (sur 2 ennemis)
  const volees = c => 1 + ((c ? tacD : tacA) !== 'charger' ? 1 : 0) + (c === 1 && terrain === 'colline' ? 1 : 0) + (c === 1 ? +tourDef || 0 : 0);
  for (let v = 0; v < Math.max(volees(0), volees(1)); v++) {
    const tirs = [], coups = [];
    for (const c of [0, 1]) {
      if (v >= volees(c)) continue;
      const e = 1 - c;
      cotes[c].forEach((u, k) => {
        if (u.pv <= 0) return;
        if (BAN_UNITES[u.type].tir) { const t = cible(e); if (t >= 0) tirs.push({ c, k, e, t, sorte: 'fleche', touche: R() < 0.75 && !(e === 1 && terrain === 'foret' && R() < 0.5) && !(BAN_UNITES[cotes[e][t].type].os && R() < 0.5) }); }
        if (BAN_UNITES[u.type].feu && v === 0) front(e).slice(0, 2).forEach(t => tirs.push({ c, k, e, t, sorte: 'feu', touche: R() < 0.8 }));
      });
    }
    tirs.forEach(s => { if (s.touche) frapper(s.e, s.t, 1, coups); });
    if (tirs.length) journal.push({ temps: 'volee', tirs, coups });
  }
  const recule = c => (c ? tacD : tacA) === 'harceler' && vivants(cotes[c]) * 2 < n0[c];
  const fuit = c => cotes[c].some(u => BAN_UNITES[u.type].fuit) && vivants(cotes[c]) * 2 < n0[c];
  const verdict = () => {
    if (!vivants(d)) return 'victoire';
    if (!vivants(a)) return 'defaite';
    if (recule(0) || fuit(0)) return 'retraite';
    if (fuit(1)) return 'victoire';
    return null;
  };
  const fin = issue => { journal.push({ temps: 'fin', issue }); return { journal, issue, A: a, D: d }; };
  let v0 = verdict(); if (v0) return fin(v0);
  // 2. trois assauts : la première ligne de chaque camp frappe celle d'en face, coups simultanés
  for (let n = 0; n < 3; n++) {
    const coups = [], frappes = [];
    for (const c of [0, 1]) {
      const e = 1 - c, fe = front(e), tac = c ? tacD : tacA, etac = e ? tacD : tacA;
      if (!fe.length) continue;
      front(c).forEach((k, slot) => {
        const U = BAN_UNITES[cotes[c][k].type], s0 = Math.min(slot, fe.length - 1), cibles = [fe[s0]];
        if (U.double && fe.length > 1) cibles.push(fe[(s0 + 1) % fe.length]);
        cibles.forEach(t => {
          let deg = U.tir || U.feu ? (R() < 0.5 ? 1 : 0) : U.att;   // un archer ou un mage au contact frappe mal
          if (n === 0 && tac === 'charger') deg += 1;
          if (n === 0 && U.contre && etac === 'charger') deg += 1;   // le lancier attend la charge
          if (n === 0 && c === 0 && (terrain === 'marais' || terrain === 'riviere')) deg = Math.max(0, deg - 1);
          const V = BAN_UNITES[cotes[e][t].type];
          const pare = Math.min(0.6, (etac === 'tenir' && V.pare ? 0.33 : 0) + (e === 1 && terrain === 'montagne' ? 0.25 : 0) + (e === 1 && chateau ? 0.25 : 0));
          const p = deg > 0 && R() < pare;
          frappes.push({ c, k, e, t, deg: p ? 0 : deg, pare: p });
        });
      });
    }
    frappes.forEach(f => { if (f.deg) frapper(f.e, f.t, f.deg, coups); });
    journal.push({ temps: 'assaut', n, frappes, coups });
    v0 = verdict(); if (v0) return fin(v0);
  }
  return fin('tenu');   // personne n'a cédé : le défenseur garde sa case
}
// la chance de victoire de l'attaquant : la même règle, jouée 60 fois (les étoiles)
const banMemo = new Map();   // la même question revient souvent pendant le tour de l'ordinateur
function banChance(A, D, tacA, tacD, terrain, chateau, tourDef) {
  const cle = A.map(u => u.type + u.pv).join() + '|' + D.map(u => u.type + u.pv).join() + '|' + tacA + tacD + terrain + !!chateau + (+tourDef || 0);
  if (banMemo.has(cle)) return banMemo.get(cle);
  if (banMemo.size > 5000) banMemo.clear();
  let g = 0;
  for (let k = 0; k < 60; k++) if (banSimuler(A, D, tacA, tacD, terrain, chateau, 1000 + k * 7919, tourDef).issue === 'victoire') g++;
  banMemo.set(cle, g / 60);
  return g / 60;
}
const banEtoiles = c => (c >= 0.75 ? 3 : c >= 0.45 ? 2 : 1);   // ★★★ facile, ★★ ça peut marcher, ★ difficile
// la tactique de l'ordinateur : brigands → FONCER ; au moins moitié de tireurs → TIRER D'ABORD ; sinon FONCER
const banTactiqueIA = (l, brigand) => (brigand ? 'charger' : l.filter(u => BAN_UNITES[u.type].tir || BAN_UNITES[u.type].feu).length * 2 >= l.length ? 'tenir' : 'charger');
const BAN_TACTIQUES_ATTAQUE = ['charger', 'tenir', 'harceler'], BAN_TACTIQUES_DEFENSE = ['charger', 'tenir'];

// ce qu'on sait d'une bataille avant de la livrer : qui, où, avec quoi
function banApercu(etat, attId, i) {
  const a = banArmee(etat, attId), t = etat.terres[i], o = banArmeeSur(etat, i);
  if (!a || !banEnnemiSur(etat, a.s, i)) return null;
  const sDef = o ? o.s : t.prop, chezLui = t.bat === 'chateau' && sDef === t.prop;
  const garde = chezLui ? (sDef === 0 && banNiveau(etat).garde || BAN_GARDE).map(ty => banUnite(etat, ty, sDef)) : [];
  const D = (o ? o.unites : []).concat(garde);   // au château, la garde se bat avec l'armée qui y est (derrière elle)
  return { att: a, def: o || null, garde: garde.length, nArmee: o ? o.unites.length : 0, sDef: o ? o.s : t.prop, A: a.unites, D, terrain: t.t, chateau: t.bat === 'chateau', tourDef: (t.bat === 'tour' || t.bat === 'chateau') && (o ? o.s : t.prop) === t.prop ? 1 + (t.bat === 'tour' && t.grand ? 1 : 0) : 0 };   // au château aussi, les archers tirent une fois de plus
}
// les chances de chaque tactique pour un camp (0 = l'attaquant, 1 = le défenseur), l'autre camp jouant comme l'ordinateur
function banChances(etat, attId, i, cote) {
  const b = banApercu(etat, attId, i); if (!b) return null;
  const res = {};
  if (cote === 0) { const tD = banTactiqueIA(b.D, b.sDef < 0); BAN_TACTIQUES_ATTAQUE.forEach(tac => { res[tac] = banChance(b.A, b.D, tac, tD, b.terrain, b.chateau, b.tourDef); }); }
  else { const tA = banTactiqueIA(b.A, false); BAN_TACTIQUES_DEFENSE.forEach(tac => { res[tac] = 1 - banChance(b.A, b.D, tA, tac, b.terrain, b.chateau, b.tourDef); }); }
  return res;
}
// livrer la bataille et en appliquer le bilan ; renvoie le résultat (journal à rejouer, issue, trésor, château pris…)
function banResoudre(etat, attId, i, tacA, tacD) {
  const b = banApercu(etat, attId, i); if (!b || etat.fin) return null;
  if (!BAN_TACTIQUES_ATTAQUE.includes(tacA)) tacA = 'charger';
  if (!BAN_TACTIQUES_DEFENSE.includes(tacD)) tacD = banTactiqueIA(b.D, b.sDef < 0);
  const graine = Math.floor(banRng(etat.graine, 'bataille', etat.tour, etat.nb++)() * 1e9);
  const res = banSimuler(b.A, b.D, tacA, tacD, b.terrain, b.chateau, graine, b.tourDef);
  const out = { ...res, att: attId, terre: i, sAtt: b.att.s, sDef: b.sDef, garde: b.garde, tacA, tacD, tresor: 0, chateau: false, tombe: null, blesses: [] };
  const t = etat.terres[i], a = b.att;
  // les survivants ; le seigneur ne meurt jamais : blessé, il rentre au château dans 2 tours
  const bilan = (armee, l) => {
    if (l.some(u => u.type === 'seigneur' && u.pv === 0) && armee.s >= 0) { etat.seigneurs[armee.s].blesse = etat.tour + 2; out.blesses.push(armee.s); }
    armee.unites = l.filter(u => u.pv > 0); armee.combat = true;
  };
  bilan(a, res.A);
  if (b.def) { bilan(b.def, res.D.slice(0, b.nArmee)); if (!b.def.unites.length || res.issue === 'victoire') etat.armees.splice(etat.armees.indexOf(b.def), 1); }   // vaincus, les survivants s'enfuient
  if (!a.unites.length) etat.armees.splice(etat.armees.indexOf(a), 1);
  else if (res.issue === 'victoire') {
    a.terre = i;
    if (a.s >= 0) {
      const avant = t.prop;
      banPrendre(etat, i, a.s);
      if (t.camp || t.ruine) { out.tresor = t.ruine ? BAN_TRESOR.ruine : BAN_TRESOR.camp; out.tresor = banGagner(etat, a.s, out.tresor); }
      if (t.bat === 'chateau' && avant >= 0 && avant !== a.s) { out.chateau = true; if (i === banChateau(etat, avant)) { out.tombe = avant; banChute(etat, avant, a.s); } }   // un seigneur tombe quand on prend SON château
    }
    t.camp = t.ruine = false;
  }
  banVerifierFin(etat);
  return out;
}
// un seigneur perd son château : toutes ses cases passent au vainqueur, ses armées s'en vont
function banChute(etat, s, vainqueur) {
  etat.seigneurs[s].tombe = true;
  etat.terres.forEach(t => { if (t.prop === s) t.prop = vainqueur; });
  etat.armees = etat.armees.filter(a => a.s !== s);
}

/* ---------- le château : acheter des guerriers ---------- */
// un guerrier de plus au château : dans l'armée qui y est (6 au plus), ou dans une nouvelle armée (3 au plus)
function banPlaceAuChateau(etat, s) {
  const c = banChateau(etat, s), o = banArmeeSur(etat, c);
  if (etat.terres[c].prop !== s) return null;
  if (o) return o.s === s && o.unites.length < banMaxUnites(etat, s) ? o : null;
  return banArmeesDe(etat, s).length < BAN_MAX_ARMEES ? 'nouvelle' : null;
}
function banRenfort(etat, s, type) {
  const p = banPlaceAuChateau(etat, s); if (!p) return false;
  const u = banUnite(etat, type, s);
  if (p === 'nouvelle') etat.armees.push({ id: etat.id++, s, terre: banChateau(etat, s), pts: 0, combat: false, unites: [u] });   // une nouvelle armée bouge au tour suivant
  else p.unites.push(u);
  return true;
}
function banPeutAcheter(etat, s, type) {
  const U = BAN_UNITES[type];
  if (!U || !U.prix || etat.fin) return banNon('On ne peut pas acheter ça.');
  if (U.caserne && !banNbBat(etat, s, 'caserne')) return banNon('Il faut une caserne.');
  if (!banPlaceAuChateau(etat, s)) return banNon('Plus de place au château.');
  if (etat.seigneurs[s].pieces < banPrix(etat, s, type)) return banNon('Pas assez de pièces.');
  return { ok: true };
}
function banAcheter(etat, s, type) {
  const p = banPeutAcheter(etat, s, type); if (!p.ok) return p;
  etat.seigneurs[s].pieces -= banPrix(etat, s, type); banRenfort(etat, s, type);
  return { ok: true };
}

/* ---------- le village : construire et décorer (§ 6) ---------- */
function banPeutConstruire(etat, s, i, b) {
  const t = etat.terres[i], B = BAN_BATIMENTS[b];
  if (!B || !t || etat.fin) return banNon('On ne peut pas construire ça.');
  if (t.prop !== s) return banNon('Cette case n\'est pas à toi.');
  if (t.bat) return banNon('Un bâtiment par case.');
  if (etat.seigneurs[s].pieces < B.prix) return banNon('Pas assez de pièces.');
  return { ok: true };
}
function banConstruire(etat, s, i, b) {
  const p = banPeutConstruire(etat, s, i, b); if (!p.ok) return p;
  const avant = banEtapeChateau(etat, s), forge = banNbBat(etat, s, 'forge');
  etat.seigneurs[s].pieces -= BAN_BATIMENTS[b].prix; etat.terres[i].bat = b;
  if (b === 'forge' && !forge) banArmeesDe(etat, s).forEach(a => a.unites.forEach(u => { if (u.type === 'fantassin' || u.type === 'lancier') u.pv++; }));   // le cœur en plus, tout de suite
  return { ok: true, grandit: banEtapeChateau(etat, s) > avant };   // le château vient de grandir (drapeaux, remparts)
}
function banPeutAmeliorer(etat, s, i) {
  const t = etat.terres[i];
  if (!t || t.prop !== s || etat.fin) return banNon('Cette case n\'est pas à toi.');
  if (!t.bat || !BAN_BATIMENTS[t.bat]) return banNon('Il n\'y a rien à améliorer ici.');
  if (t.grand) return banNon('Il est déjà grand.');
  if (etat.seigneurs[s].pieces < BAN_BATIMENTS[t.bat].prix) return banNon('Pas assez de pièces.');
  return { ok: true };
}
function banAmeliorer(etat, s, i) {
  const p = banPeutAmeliorer(etat, s, i); if (!p.ok) return p;
  const t = etat.terres[i], forge = t.bat === 'forge' && !banGrand(etat, s, 'forge');
  etat.seigneurs[s].pieces -= BAN_BATIMENTS[t.bat].prix; t.grand = true;
  if (forge) banArmeesDe(etat, s).forEach(a => a.unites.forEach(u => { if (u.type === 'champion') u.pv++; }));
  return { ok: true };
}
function banPeutDecorer(etat, s, i) {
  const t = etat.terres[i];
  if (!t || t.prop !== s || etat.fin) return banNon('Cette case n\'est pas à toi.');
  if (t.decos.length >= BAN_DECOS_PAR_CASE) return banNon('Plus de place ici.');
  if (etat.seigneurs[s].pieces < BAN_PRIX_DECO) return banNon('Pas assez de pièces.');
  return { ok: true };
}
// une décoration au hasard parmi celles qui ne sont pas encore sur la case ; elle ne sert qu'à faire joli
function banDecorer(etat, s, i) {
  const p = banPeutDecorer(etat, s, i); if (!p.ok) return p;
  const t = etat.terres[i], libres = BAN_DECORS.filter(d => !t.decos.includes(d));
  const d = libres[Math.floor(banRng(etat.graine, 'deco', i, etat.tour * 10 + t.decos.length)() * libres.length)];
  etat.seigneurs[s].pieces -= BAN_PRIX_DECO; t.decos.push(d);
  return { ok: true, deco: d };
}

// soigner une armée au château : 1 pièce, tous ses cœurs reviennent
function banPeutSoigner(etat, s, id) {
  const a = banArmee(etat, id);
  if (!a || a.s !== s || etat.fin) return banNon('Pas d\'armée ici.');
  if (a.terre !== banChateau(etat, s) || etat.terres[a.terre].prop !== s) return banNon('On soigne au château.');
  if (a.unites.every(u => u.pv >= banCoeursMax(etat, u.type, s))) return banNon('Personne n\'est blessé.');
  if (etat.seigneurs[s].pieces < BAN_PRIX_SOIN) return banNon('Pas assez de pièces.');
  return { ok: true };
}
function banSoigner(etat, s, id) {
  const p = banPeutSoigner(etat, s, id); if (!p.ok) return p;
  etat.seigneurs[s].pieces -= BAN_PRIX_SOIN;
  banArmee(etat, id).unites.forEach(u => { u.pv = banCoeursMax(etat, u.type, s); });
  return { ok: true };
}

/* ---------- le tour ---------- */
// FIN DU TOUR (après les rivaux) : tour suivant, cœurs, pas, pièces, seigneur guéri, surprise (surprises.js)
function banFinTour(etat) {
  if (etat.fin) return null;
  etat.tour++;
  if (etat.tour > BAN_DERNIER_TOUR) { banVerifierFin(etat); return { gains: [0, 0, 0, 0], surprise: null, retour: [] }; }
  etat.pluie = false; etat.surprise = null;
  etat.armees.forEach(a => {
    if (a.s < 0) return;
    a.pts = BAN_POINTS;
    a.unites.forEach(u => { u.pv = Math.min(banCoeursMax(etat, u.type, a.s), u.pv + (a.combat ? 0 : 1)); });   // repos : +1 cœur
    a.combat = false;
  });
  const gains = etat.seigneurs.map((S, s) => { if (S.tombe) return 0; return banGagner(etat, s, banRevenu(etat, s)); });   // ce qui est vraiment entré (le coffre plein à 30)
  const retour = [];
  etat.seigneurs.forEach((S, s) => { if (S.blesse && etat.tour >= S.blesse && !S.tombe && banRenfort(etat, s, 'seigneur')) { S.blesse = 0; retour.push(s); } });   // s'il n'y a pas de place au château, il attend
  const surprise = typeof banSurprise === 'function' ? banSurprise(etat) : null;
  return { gains, surprise, retour };
}
// la fin : ton château pris (perdu), les 4 châteaux à toi (gagné), ou après le tour 25 (on compte les drapeaux)
function banVerifierFin(etat) {
  if (etat.fin) return etat.fin;
  const classement = () => etat.seigneurs.map((S, s) => ({ s, n: banDrapeaux(etat, s) })).sort((a, b) => b.n - a.n || a.s - b.s);
  if (etat.terres[banChateau(etat, 0)].prop !== 0) etat.fin = { issue: 'defaite', gagne: false, tour: etat.tour, classement: classement() };
  else if (banChateaux(etat, 0) === 4) etat.fin = { issue: 'victoire', gagne: true, tour: etat.tour, classement: classement() };
  else if (etat.tour > BAN_DERNIER_TOUR) {
    const c = classement();
    etat.fin = { issue: 'drapeaux', gagne: c[0].n === banDrapeaux(etat, 0), tour: BAN_DERNIER_TOUR, classement: c };   // à égalité en tête, tu as gagné
  }
  return etat.fin;
}
const banScore = etat => banDrapeaux(etat, 0);   // le meilleur score : les drapeaux à la fin

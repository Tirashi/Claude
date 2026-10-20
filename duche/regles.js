/* =====================================================================
   DUCHÉ · les RÈGLES (logique pure, sans affichage ni stockage).
   Carte de 37 terres hexagonales, économie, recrutement, déplacements,
   combat, revenus, tour, votes de la noblesse, score.
   Tout l'aléatoire passe par des générateurs à graine, un flux par usage
   (carte, paquet, evenement, combat, ia), dérivé de (graine, usage, tour,
   n°) : les choix du joueur ne changent pas ce qui est tiré ensuite.
   Les fonctions modifient l'état reçu (un objet JSON, sauvegardable tel
   quel) et ne touchent à rien d'autre : ni DOM, ni Math.random().
   - Dans la page : script classique chargé avant ia.js, evenements.js et
     jeu.js ; tout est en portée globale (noms préfixés duc / DUC).
   - Dans Node : outils/duche-simulateur.js charge regles.js, evenements.js
     et ia.js dans un même contexte (vm), comme la page.
   Cahier des charges : specs/duche.md.
   ===================================================================== */
'use strict';
const DUC_RUN_V = 1;
const DUC_TOURS = 30;
const DUC_SAISONS = ['printemps', 'été', 'automne', 'hiver'];
// hexagones pointe en haut, coordonnées axiales (q, r) ; le côté i a sa normale à 60·i degrés (y vers le bas)
const DUC_VOIS = [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]];
const DUC_CASES = [];   // [q, r] des 37 terres, ligne par ligne (r de −3 à 3) : terres[i] ↔ DUC_CASES[i]
for (let r = -3; r <= 3; r++) for (let q = -3; q <= 3; q++) if (Math.abs(q + r) <= 3) DUC_CASES.push([q, r]);
const ducCase = (q, r) => DUC_CASES.findIndex(c => c[0] === q && c[1] === r);
const DUC_VOISINS = DUC_CASES.map(([q, r]) => DUC_VOIS.map(([dq, dr]) => ducCase(q + dq, r + dr)).filter(i => i >= 0));
const ducDist = (i, j) => { const [a, b] = DUC_CASES[i], [c, d] = DUC_CASES[j]; return (Math.abs(a - c) + Math.abs(b - d) + Math.abs(a + b - c - d)) / 2; };
// coins de départ : le joueur en bas à gauche, les rivaux en haut à gauche, en haut à droite, à droite
const DUC_COINS = [ducCase(-3, 3), ducCase(0, -3), ducCase(3, -3), ducCase(3, 0)];

const DUC_TERRAINS = {
  plaine: { nom: 'Plaine', nour: 2, bois: 0, or: 0, def: 0 },
  foret: { nom: 'Forêt', nour: 0, bois: 2, or: 0, def: 1 },
  montagne: { nom: 'Montagne', nour: 0, bois: 0, or: 2, def: 3 },
  colline: { nom: 'Colline', nour: 0, bois: 1, or: 1, def: 2 },
  marais: { nom: 'Marais', nour: 1, bois: 0, or: 0, def: 1 },
  riviere: { nom: 'Rivière', nour: 1, bois: 0, or: 1, def: 0 },
};
// cout : bois, or ; prod : ajouté chaque tour ; def : défense de la terre ; terrains : où on peut le bâtir
const DUC_BATIMENTS = {
  ferme: { nom: 'Ferme', cout: { bois: 20, or: 0 }, prod: { nour: 2 }, def: 0, effet: '+2 nourriture' },
  scierie: { nom: 'Scierie', cout: { bois: 10, or: 0 }, prod: { bois: 2 }, def: 0, effet: '+2 bois' },
  mine: { nom: 'Mine', cout: { bois: 30, or: 0 }, prod: { or: 2 }, def: 0, terrains: ['colline', 'montagne'], effet: '+2 or' },
  marche: { nom: 'Marché', cout: { bois: 20, or: 20 }, prod: { or: 1, leg: 1 }, def: 0, effet: '+1 or, +1 légitimité, ouvre le change' },
  caserne: { nom: 'Caserne', cout: { bois: 20, or: 10 }, prod: {}, def: 0, effet: '+5 soldats au plafond, recrues moins chères' },
  tour: { nom: 'Tour de guet', cout: { bois: 15, or: 15 }, prod: {}, def: 2, effet: '+2 défense' },
  chateau: { nom: 'Château', cout: null, prod: { nour: 1, or: 1 }, def: 5, effet: '+5 défense, on y recrute' },
};
const DUC_TRAITS = {
  agressif: { nom: 'Agressif', texte: 'recrute tôt, attaque souvent (+20 % en attaque)' },
  marchand: { nom: 'Marchand', texte: 'marchés et or d\'abord, attaque peu' },
  isolationniste: { nom: 'Isolationniste', texte: 'défend ses frontières, ne prend que des terres neutres' },
  expansionniste: { nom: 'Expansionniste', texte: 'prend les terres neutres en priorité' },
  traitre: { nom: 'Traître', texte: 'peut rompre une alliance' },
  pieux: { nom: 'Pieux', texte: '+1 légitimité par tour' },
  batisseur: { nom: 'Bâtisseur', texte: 'bâtit beaucoup, armée plus petite' },
};
const DUC_TRAITS_EXCLUS = [['isolationniste', 'expansionniste'], ['isolationniste', 'agressif'], ['marchand', 'agressif']];
const DUC_NOMS = ['Baron Aldric', 'Comtesse Ysolde', 'Sire Enguerrand', 'Dame Mahaut', 'Comte Thibaut', 'Dame Aliénor', 'Baron Foulques', 'Comtesse Berthe', 'Sire Gauvain', 'Dame Ermengarde'];
const DUC_COULEURS = ['or', 'rouge', 'bleu', 'violet'];
const DUC_VOTES_COURONNE = 5, DUC_LEG_VOTE = 40, DUC_TOUR_ROI = 11;   // le roi meurt au tour 11 ; un électeur vote à la fin des tours 11, 13… 27
// les 9 grands électeurs, dans l'ordre de la graine ; chacun vote pour le seigneur le meilleur selon son critère
// (égalité : le plus légitime, puis le plus de terres, puis le joueur), parmi ceux qui ont au moins 40 de légitimité
const DUC_ELECTEURS = [
  { nom: 'L\'archevêque', crit: 'leg' }, { nom: 'L\'évêque', crit: 'leg' }, { nom: 'L\'abbesse', crit: 'leg' }, { nom: 'Le comte palatin', crit: 'leg' },
  { nom: 'Le connétable', crit: 'soldats' }, { nom: 'Le maréchal', crit: 'terres' }, { nom: 'Le trésorier', crit: 'or' }, { nom: 'Le grand architecte', crit: 'batiments' },
  { nom: 'La reine mère', crit: 'leg' },
];
const DUC_CRITERES = { leg: 'la légitimité', soldats: 'la plus grande armée', terres: 'le plus de terres', or: 'le trésor le plus riche', batiments: 'le plus de bâtiments' };
const DUC_CHANGES = 5;   // échanges au marché par tour

/* ---------- hasard à graine ---------- */
// mulberry32, le même que les autres jeux (ne pas le modifier : les graines du jour en dépendent)
function ducMulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// un flux par (graine, usage, a, b) : usage = carte, paquet, evenement, combat, ia
function ducRng(graine, usage, a, b) {
  let h = 2166136261;
  for (const ch of String(graine) + '|' + usage + '|' + (a || 0) + '|' + (b || 0)) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 13; }
  return ducMulberry(h >>> 0);
}
const ducEntre = (R, a, b) => a + Math.floor(R() * (b - a + 1));
const ducMelanger = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function ducPondere(R, poids) { let t = 0; for (const k in poids) t += poids[k]; let x = R() * t; for (const k in poids) { x -= poids[k]; if (x < 0) return k; } return Object.keys(poids)[0]; }

/* ---------- nouvelle partie ---------- */
function ducCarte(graine) {
  const R = ducRng(graine, 'carte');
  const terres = DUC_CASES.map(([q, r]) => ({
    q, r, t: ducPondere(R, { plaine: 30, foret: 25, colline: 16, montagne: 11, marais: 10 }),
    qual: +ducPondere(R, { 1: 50, 2: 35, 3: 15 }), prop: -1, bat: null, gar: 0, pret: 0, brig: false,
  }));
  // la rivière : part d'un bord et avance vers le bord opposé en ondulant (5 à 8 terres)
  const d = ducEntre(R, 0, 5), [dq, dr] = DUC_VOIS[d], [eq, er] = DUC_VOIS[(d + 1) % 6];
  const bord = DUC_CASES.map((c, i) => i).filter(i => DUC_VOISINS[i].length < 6 && ducCase(DUC_CASES[i][0] - dq, DUC_CASES[i][1] - dr) < 0 && ducCase(DUC_CASES[i][0] - eq, DUC_CASES[i][1] - er) < 0 && !DUC_COINS.includes(i));
  let i = bord.length ? bord[ducEntre(R, 0, bord.length - 1)] : ducCase(0, -3);
  for (let n = 0; i >= 0 && n < 9; n++) {
    terres[i].t = 'riviere';
    const [q, r] = DUC_CASES[i], s = R() < 0.5 ? [dq, dr] : [eq, er];
    i = ducCase(q + s[0], r + s[1]);
  }
  return terres;
}

function ducNouvelle(graine, mode) {
  const terres = ducCarte(graine), R = ducRng(graine, 'carte', 1);
  // les rivaux : nom, couleur, 2 traits compatibles
  const noms = ducMelanger(R, DUC_NOMS.slice()), cles = Object.keys(DUC_TRAITS);
  const seigneurs = [0, 1, 2, 3].map(s => {
    let traits = [];
    if (s > 0) do { const a = ducMelanger(R, cles.slice()); traits = [a[0], a[1]]; } while (DUC_TRAITS_EXCLUS.some(([x, y]) => traits.includes(x) && traits.includes(y)));
    return { nom: s ? noms[s - 1] : 'Votre duché', coul: DUC_COULEURS[s], traits, vivant: true, chateau: DUC_COINS[s],
      nour: 20, bois: 30, or: 20, leg: 20, votes: 0, change: 0, mercN: 0, mercFin: 0, hiver: 0, hiverPct: 1, tombe: 0 };
  });
  // les domaines : château sur une plaine + 2 voisines
  for (let s = 0; s < 4; s++) {
    const c = DUC_COINS[s];
    Object.assign(terres[c], { t: 'plaine', qual: 2, prop: s, bat: 'chateau', gar: 5 });
    for (const v of ducMelanger(R, DUC_VOISINS[c].slice()).slice(0, 2)) Object.assign(terres[v], { prop: s, gar: 1, t: terres[v].t === 'montagne' ? 'colline' : terres[v].t });
  }
  // le reste est neutre : une milice de 0 à 1 homme, et 4 à 7 bandes de brigands (2 à 6)
  const neutres = terres.map((t, i) => i).filter(i => terres[i].prop < 0);
  for (const i of neutres) terres[i].gar = ducEntre(R, 0, 1);
  const loin = neutres.filter(i => DUC_COINS.every(c => ducDist(i, c) >= 2));
  for (const i of ducMelanger(R, loin).slice(0, ducEntre(R, 4, 7))) Object.assign(terres[i], { gar: ducEntre(R, 2, 6), brig: true });
  const etat = {
    v: DUC_RUN_V, graine, mode: mode || 'libre', tour: 1, terres, seigneurs,
    paquet: [], cycle: 0, evt: null, alliances: {}, electeurs: 0, ordreElecteurs: ducMelanger(R, DUC_ELECTEURS.map((x, i) => i)), roiMort: false, nCombat: 0,
    fin: null, journal: [], coups: [], marchand: 0,
    stats: { prises: 0, perdues: 0, rivauxTombes: 0, picLeg: 20, combats: 0, victoires: 0 },
  };
  ducDebutTour(etat);
  return etat;
}

// une sauvegarde d'une version plus ancienne → la version actuelle (rien à faire en v1)
function ducMigrer(etat) { if (!etat || typeof etat !== 'object' || !Array.isArray(etat.terres)) return null; etat.v = DUC_RUN_V; return etat; }

/* ---------- lectures ---------- */
const ducSaison = tour => DUC_SAISONS[(tour - 1) % 4];
const ducAn = tour => Math.floor((tour - 1) / 4) + 1;
const ducTerresDe = (etat, s) => etat.terres.map((t, i) => i).filter(i => etat.terres[i].prop === s);
const ducSoldats = (etat, s) => etat.terres.reduce((n, t) => n + (t.prop === s ? t.gar : 0), 0);
const ducNbBat = (etat, s, b) => etat.terres.filter(t => t.prop === s && t.bat === b).length;
const ducPlafond = (etat, s) => 10 + 5 * ducNbBat(etat, s, 'caserne') + (etat.seigneurs[s].mercFin > etat.tour ? etat.seigneurs[s].mercN : 0);
const ducDefense = (etat, i) => { const t = etat.terres[i]; return t.gar + DUC_TERRAINS[t.t].def + (t.bat ? DUC_BATIMENTS[t.bat].def : 0); };
const ducFrontiere = (etat, i) => DUC_VOISINS[i].some(v => etat.terres[v].prop !== etat.terres[i].prop);
const ducAllies = (etat, a, b) => {
  if (a === b) return true;
  if (a !== 0 && b !== 0) return false;
  const al = etat.alliances[a || b];
  return !!al && al.fin >= etat.tour;
};
// recrue : 2 nourriture + 2 or (1,6 + 1,6 avec une caserne), total arrondi au-dessus
const ducCoutRecrues = (etat, s, n) => { const u = ducNbBat(etat, s, 'caserne') ? 1.6 : 2; return { nour: Math.ceil(u * n - 1e-9), or: Math.ceil(u * n - 1e-9) }; };

// production d'un tour (sans l'appliquer) : { nour, bois, or, leg, entretien }
function ducProduction(etat, s) {
  const S = etat.seigneurs[s], p = { nour: 0, bois: 0, or: 0, leg: 0, entretien: 0 };
  for (const t of etat.terres) if (t.prop === s) {
    const T = DUC_TERRAINS[t.t];
    p.nour += T.nour * t.qual; p.bois += T.bois * t.qual; p.or += T.or * t.qual;
    if (t.bat) for (const k in DUC_BATIMENTS[t.bat].prod) p[k] += DUC_BATIMENTS[t.bat].prod[k];
  }
  if (S.traits.includes('pieux')) p.leg += 1;
  if (s > 0 && etat.tour % 3 === 0) p.leg += 1;   // la cour des rivaux (ils n'ont pas d'événements) : +1 tous les 3 tours
  if (S.hiver > 0) p.nour = Math.floor(p.nour * S.hiverPct);
  p.entretien = Math.ceil(ducSoldats(etat, s) / 10);
  return p;
}

/* ---------- journal ---------- */
function ducNoter(etat, txt, s) {
  etat.journal.push({ tour: etat.tour, txt, s: s == null ? -1 : s });
  if (etat.journal.length > 40) etat.journal.splice(0, etat.journal.length - 40);
}

/* ---------- revenus (début de tour) ---------- */
function ducRevenus(etat, s) {
  const S = etat.seigneurs[s], p = ducProduction(etat, s);
  S.nour += p.nour - p.entretien; S.bois += p.bois; S.or += p.or; S.leg = Math.min(100, S.leg + p.leg);
  let famine = 0;
  if (S.nour < 0) {
    famine = Math.ceil(ducSoldats(etat, s) * 0.1);
    ducRetirerSoldats(etat, s, famine);
    S.leg = Math.max(0, S.leg - 2); S.nour = 0;
    if (s === 0) ducNoter(etat, `Famine : ${famine} soldat${famine > 1 ? 's' : ''} désertent, −2 légitimité.`, 0);
  }
  if (S.hiver > 0) S.hiver--;
  return { p, famine };
}

// retire n soldats des plus grosses garnisons (famine, mercenaires qui partent)
function ducRetirerSoldats(etat, s, n) {
  while (n > 0) {
    let best = -1;
    etat.terres.forEach((t, i) => { if (t.prop === s && t.gar > 0 && (best < 0 || t.gar > etat.terres[best].gar)) best = i; });
    if (best < 0) return;
    const t = etat.terres[best]; t.gar--; t.pret = Math.min(t.pret, t.gar); n--;
  }
}

function ducDebutTour(etat) {
  etat.nCombat = 0; etat.coups = []; etat.marchand = 0;
  for (let s = 0; s < 4; s++) {
    const S = etat.seigneurs[s];
    if (!S.vivant) continue;
    S.change = 0;
    // les mercenaires repartent : on retombe sous le plafond
    if (S.mercN && S.mercFin === etat.tour) {
      S.mercN = 0;
      const trop = ducSoldats(etat, s) - ducPlafond(etat, s);
      if (trop > 0) ducRetirerSoldats(etat, s, trop);
      if (s === 0) ducNoter(etat, 'Les mercenaires s\'en vont.', 0);
    }
    ducRevenus(etat, s);
  }
  // alliances : fin, ou trahison d'un Traître (chance tirée de la graine)
  for (const k in etat.alliances) {
    const al = etat.alliances[k], r = +k, S = etat.seigneurs[r];
    if (al.fin < etat.tour || !S.vivant) { delete etat.alliances[k]; if (S.vivant) ducNoter(etat, `L'alliance avec ${S.nom} prend fin.`, r); continue; }
    if (!al.forte && S.traits.includes('traitre') && ducRng(etat.graine, 'ia', etat.tour, 10 + r)() < 0.2) {
      delete etat.alliances[k]; S.leg = Math.max(0, S.leg - 10);
      ducNoter(etat, `${S.nom} trahit votre alliance !`, r);
    }
  }
  for (const t of etat.terres) t.pret = t.gar;
  etat.seigneurs[0].leg >= etat.stats.picLeg && (etat.stats.picLeg = etat.seigneurs[0].leg);
  ducVerifier(etat);
  if (!etat.fin && typeof ducTirerEvenement === 'function') etat.evt = ducTirerEvenement(etat);
}

/* ---------- décisions (joueur et rivaux) ---------- */
// chaque action rend { ok: true, ... } ou { ok: false, raison }
const ducNon = raison => ({ ok: false, raison });
function ducLibre(etat, s) {
  if (etat.fin) return 'La partie est finie.';
  if (s === 0 && etat.evt) return 'Répondez d\'abord à l\'événement.';
  if (!etat.seigneurs[s].vivant) return 'Ce seigneur est tombé.';
  return '';
}

function ducPeutConstruire(etat, s, i, b) {
  const t = etat.terres[i], B = DUC_BATIMENTS[b], S = etat.seigneurs[s];
  if (!B || !B.cout) return 'Bâtiment inconnu.';
  if (!t || t.prop !== s) return 'Cette terre n\'est pas à vous.';
  if (t.bat) return 'Il y a déjà un bâtiment.';
  if (B.terrains && !B.terrains.includes(t.t)) return 'Seulement sur une colline ou une montagne.';
  if (S.bois < B.cout.bois || S.or < B.cout.or) return 'Pas assez de ressources.';
  return '';
}
function ducConstruire(etat, s, i, b) {
  const err = ducLibre(etat, s) || ducPeutConstruire(etat, s, i, b);
  if (err) return ducNon(err);
  const S = etat.seigneurs[s], B = DUC_BATIMENTS[b];
  S.bois -= B.cout.bois; S.or -= B.cout.or; etat.terres[i].bat = b;
  return { ok: true };
}

// nombre de recrues possible sur la terre i (château ou caserne)
function ducRecruesMax(etat, s, i) {
  const t = etat.terres[i], S = etat.seigneurs[s];
  if (!t || t.prop !== s || (t.bat !== 'chateau' && t.bat !== 'caserne')) return 0;
  let n = Math.max(0, ducPlafond(etat, s) - ducSoldats(etat, s));
  while (n > 0) { const c = ducCoutRecrues(etat, s, n); if (c.nour <= S.nour && c.or <= S.or) break; n--; }
  return n;
}
function ducRecruter(etat, s, i, n) {
  const err = ducLibre(etat, s);
  if (err) return ducNon(err);
  const t = etat.terres[i];
  if (!t || t.prop !== s || (t.bat !== 'chateau' && t.bat !== 'caserne')) return ducNon('On recrute au château ou dans une caserne.');
  if (!(n >= 1) || n > ducRecruesMax(etat, s, i)) return ducNon(ducSoldats(etat, s) >= ducPlafond(etat, s) ? 'Plafond de soldats atteint.' : 'Pas assez de nourriture ou d\'or.');
  const c = ducCoutRecrues(etat, s, n), S = etat.seigneurs[s];
  S.nour -= c.nour; S.or -= c.or; t.gar += n;   // les recrues ne bougent pas ce tour (pret inchangé)
  return { ok: true, cout: c };
}

function ducDeplacer(etat, s, de, vers, n) {
  const err = ducLibre(etat, s);
  if (err) return ducNon(err);
  const a = etat.terres[de], b = etat.terres[vers];
  if (!a || !b || a.prop !== s || b.prop !== s) return ducNon('Les deux terres doivent être à vous.');
  if (!DUC_VOISINS[de].includes(vers)) return ducNon('Les terres doivent être voisines.');
  if (!(n >= 1) || n > a.pret) return ducNon('Ces soldats ont déjà bougé ce tour.');
  a.gar -= n; a.pret -= n; b.gar += n;
  return { ok: true };
}

function ducChanger(etat, s, sens) {
  const err = ducLibre(etat, s);
  if (err) return ducNon(err);
  const S = etat.seigneurs[s];
  if (!ducNbBat(etat, s, 'marche')) return ducNon('Il faut un marché.');
  if (S.change >= DUC_CHANGES) return ducNon('Plus d\'échange possible ce tour.');
  if (sens === 'bois') { if (S.or < 1) return ducNon('Pas assez d\'or.'); S.or -= 1; S.bois += 2; }
  else { if (S.bois < 2) return ducNon('Pas assez de bois.'); S.bois -= 2; S.or += 1; }
  S.change++;
  return { ok: true };
}

/* ---------- combat ---------- */
const ducBonus = (etat, s) => (etat.seigneurs[s].traits.includes('agressif') ? 0.2 : 0);
const ducChance = (attaque, defense) => (attaque + defense > 0 ? attaque / (attaque + defense) : 1);
// terres à soi voisines de la cible, avec leurs soldats encore prêts
const ducSources = (etat, s, cible) => DUC_VOISINS[cible].filter(v => etat.terres[v].prop === s && etat.terres[v].pret > 0);

function ducPeutAttaquer(etat, s, cible) {
  const t = etat.terres[cible];
  if (!t) return 'Terre inconnue.';
  if (t.prop === s) return 'Cette terre est déjà à vous.';
  if (t.prop >= 0 && ducAllies(etat, s, t.prop)) return 'Vous êtes alliés.';
  if (!DUC_VOISINS[cible].some(v => etat.terres[v].prop === s)) return 'Il faut une terre voisine.';
  return '';
}
// aperçu : { attaque, defense, chance } pour n soldats engagés
function ducApercu(etat, s, cible, n) {
  const attaque = n * (1 + ducBonus(etat, s)), defense = ducDefense(etat, cible);
  return { attaque, defense, chance: ducChance(attaque, defense) };
}

// sources : [{ i, n }] ; les soldats engagés quittent leurs terres, les survivants occupent la cible
function ducAttaquer(etat, s, cible, sources) {
  const err = ducLibre(etat, s) || ducPeutAttaquer(etat, s, cible);
  if (err) return ducNon(err);
  let n = 0;
  for (const { i, n: k } of sources) {
    if (!DUC_VOISINS[cible].includes(i) || etat.terres[i].prop !== s) return ducNon('Les soldats doivent venir de terres voisines de la cible.');
    if (!(k >= 0) || k > etat.terres[i].pret) return ducNon('Ces soldats ont déjà agi ce tour.');
    n += k;
  }
  if (n < 1) return ducNon('Engagez au moins un soldat.');
  const t = etat.terres[cible], def = t.prop, { attaque, defense, chance } = ducApercu(etat, s, cible, n);
  const R = ducRng(etat.graine, 'combat', etat.tour, etat.nCombat++);
  const tirage = R(), gagne = tirage < chance;
  for (const { i, n: k } of sources) { etat.terres[i].gar -= k; etat.terres[i].pret -= k; }
  const res = { ok: true, s, cible, def, n, attaque, defense, chance, gagne, garnison: t.gar, pertesA: 0, pertesD: 0, chateau: false, elimine: -1 };
  if (gagne) {
    res.pertesD = t.gar;
    res.pertesA = Math.min(n - 1, Math.round(defense * 0.5));
    const prisChateau = t.bat === 'chateau' && def >= 0;
    Object.assign(t, { prop: s, gar: n - res.pertesA, pret: 0, brig: false });
    if (s === 0) { etat.stats.prises++; etat.stats.victoires++; }
    if (def === 0) etat.stats.perdues++;
    if (prisChateau && etat.seigneurs[def].chateau === cible) {
      res.chateau = true; res.elimine = def;
      ducEliminer(etat, def, s, R);
      etat.seigneurs[s].leg = Math.min(100, etat.seigneurs[s].leg + 30);
    }
  } else {
    res.pertesA = n;
    res.pertesD = Math.min(t.gar, Math.round(attaque * 0.5));
    t.gar -= res.pertesD; t.pret = Math.min(t.pret, t.gar);
  }
  if (s === 0) etat.stats.combats++;
  etat.coups.push({ s, cible, def, gagne, n, chateau: res.chateau });
  const nomD = def < 0 ? (t.brig && !gagne ? 'des brigands' : 'une terre neutre') : def === 0 ? 'vous' : etat.seigneurs[def].nom;
  if (s === 0) ducNoter(etat, gagne ? `Victoire ! La terre est à vous (−${res.pertesA}).` : `Défaite : ${n} soldat${n > 1 ? 's' : ''} perdu${n > 1 ? 's' : ''}.`, 0);
  else if (def === 0) ducNoter(etat, `${etat.seigneurs[s].nom} vous attaque : ${gagne ? 'terre perdue' : 'repoussé'}.`, s);
  else if (gagne && def > 0) ducNoter(etat, `${etat.seigneurs[s].nom} prend une terre à ${nomD}.`, s);
  ducVerifier(etat);
  return res;
}

// un seigneur dont le château tombe : éliminé, ses terres redeviennent neutres (1 à 3 brigands)
// (sauf le château lui-même, pris par le vainqueur)
function ducEliminer(etat, def, vainqueur, R) {
  const S = etat.seigneurs[def];
  S.vivant = false; S.tombe = etat.tour; S.votes = def === 0 ? S.votes : 0;
  // (le joueur, lui, garde ses terres pour le score : la partie s'arrête là)
  if (def > 0) for (const t of etat.terres) if (t.prop === def) Object.assign(t, { prop: -1, gar: ducEntre(R, 1, 3), pret: 0, brig: true });
  delete etat.alliances[def];
  if (vainqueur === 0) etat.stats.rivauxTombes++;
  if (def > 0) ducNoter(etat, `${S.nom} est tombé${vainqueur === 0 ? ' sous vos coups' : ''} !`, def);
}

/* ---------- fin du tour ---------- */
// les rivaux jouent (ia.js), puis bilan : votes, victoire ou défaite, tour suivant
function ducFinTour(etat) {
  if (etat.fin) return etat;
  if (etat.evt) return etat;
  for (let s = 1; s < 4 && !etat.fin; s++) if (etat.seigneurs[s].vivant && typeof ducIaJouer === 'function') ducIaJouer(etat, s);
  const coups = etat.coups.slice();
  if (!etat.fin && etat.roiMort && (etat.tour - DUC_TOUR_ROI) % 2 === 0 && etat.electeurs < DUC_ELECTEURS.length) ducVoter(etat);
  ducVerifier(etat);
  if (!etat.fin && etat.tour >= DUC_TOURS) etat.fin = { type: 'regne', tour: etat.tour };
  if (!etat.fin) { etat.tour++; ducDebutTour(etat); etat.coupsRivaux = coups; }
  return etat;
}

// le prochain grand électeur (ou null s'ils ont tous voté)
const ducElecteur = etat => (etat.electeurs < DUC_ELECTEURS.length ? DUC_ELECTEURS[etat.ordreElecteurs[etat.electeurs]] : null);
function ducCritere(etat, s, crit) {
  if (crit === 'leg') return etat.seigneurs[s].leg;
  if (crit === 'soldats') return ducSoldats(etat, s);
  if (crit === 'terres') return ducTerresDe(etat, s).length;
  if (crit === 'or') return etat.seigneurs[s].or;
  return etat.terres.filter(t => t.prop === s && t.bat && t.bat !== 'chateau').length;
}
// un grand électeur vote (fin d'un tour sur deux dès la mort du roi : couronne au plus tôt au tour 19)
function ducVoter(etat) {
  const E = ducElecteur(etat), cle = s => [ducCritere(etat, s, E.crit), etat.seigneurs[s].leg, ducTerresDe(etat, s).length];
  let best = -1, bk = null;
  for (let s = 0; s < 4; s++) {
    if (!etat.seigneurs[s].vivant || etat.seigneurs[s].leg < DUC_LEG_VOTE) continue;   // il faut être digne de la couronne
    const k = cle(s);
    if (!bk || k[0] > bk[0] || (k[0] === bk[0] && (k[1] > bk[1] || (k[1] === bk[1] && k[2] > bk[2])))) { best = s; bk = k; }
  }
  etat.electeurs++;
  if (best < 0) { ducNoter(etat, `${E.nom} ne trouve personne de digne et s'abstient.`); return; }
  etat.seigneurs[best].votes++;
  ducNoter(etat, `${E.nom} (${DUC_CRITERES[E.crit]}) vote pour ${best === 0 ? 'vous' : etat.seigneurs[best].nom}.`, best);
}

/* ---------- victoire, défaite, score ---------- */
function ducVictoire(etat) {
  const J = etat.seigneurs[0];
  if (!J.vivant || etat.terres[J.chateau].prop !== 0) return { type: 'defaite', raison: 'Votre château est tombé.' };
  if (J.leg <= 0) return { type: 'defaite', raison: 'Révolte générale : le peuple vous chasse.' };
  if (ducSoldats(etat, 0) === 0 && J.or < 2 && ducProduction(etat, 0).or === 0) return { type: 'defaite', raison: 'Plus de soldats ni d\'or.' };
  if (J.votes >= DUC_VOTES_COURONNE) return { type: 'couronne', raison: 'La noblesse vous couronne roi !' };
  for (let s = 1; s < 4; s++) if (etat.seigneurs[s].vivant && etat.seigneurs[s].votes >= DUC_VOTES_COURONNE) return { type: 'rival', raison: `${etat.seigneurs[s].nom} est couronné.` };
  if (etat.seigneurs.slice(1).every(S => !S.vivant)) return { type: 'conquete', raison: 'Tous vos rivaux sont tombés.' };
  return null;
}
function ducVerifier(etat) {
  if (etat.fin) return etat.fin;
  const v = ducVictoire(etat);
  if (v) { etat.fin = Object.assign(v, { tour: etat.tour }); etat.evt = null; }
  return etat.fin;
}

// score détaillé : { lignes: [[libellé, points]], total }
function ducScore(etat) {
  const J = etat.seigneurs[0], f = etat.fin || {};
  const terres = ducTerresDe(etat, 0).length, bats = etat.terres.filter(t => t.prop === 0 && t.bat && t.bat !== 'chateau').length;
  const lignes = [['Terres', terres * 100], ['Or', J.or], ['Bois', Math.floor(J.bois / 2)], ['Bâtiments', bats * 20], ['Légitimité', J.leg * 5], ['Votes', J.votes * 50]];
  if (f.type === 'conquete') lignes.push(['Prime de conquête', (DUC_TOURS - f.tour) * 50 + 500]);
  if (f.type === 'couronne') lignes.push(['Prime de la couronne', (DUC_TOURS - f.tour) * 80 + 500]);
  let total = lignes.reduce((a, l) => a + l[1], 0);
  if (f.type === 'defaite') { lignes.push(['Défaite : moitié', -Math.ceil(total / 2)]); total = Math.floor(total / 2); }
  return { lignes, total };
}

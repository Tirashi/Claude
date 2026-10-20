/* =====================================================================
   DUCHÉ · l'IA des rivaux (logique pure ; chargé après regles.js et
   evenements.js). IA à scores d'utilité : chaque action possible
   (attaquer telle terre, recruter, bâtir tel bâtiment ici, déplacer)
   reçoit un score selon la situation (nourriture, menace, cibles
   faibles) et les traits du seigneur ; il prend les meilleures tant
   qu'il en a les moyens. Le hasard (petit bruit sur les scores) vient
   du flux « ia » (graine, tour, seigneur).
   ducIaJouer(etat, s, traits) sert aussi au joueur automatique du
   simulateur (traits : poids de jeu seulement, les règles ne changent
   pas) ; ducIaRepondre(etat) répond à ses événements.
   ===================================================================== */
'use strict';
const ducA = (traits, k) => traits.includes(k);

// valeur d'une unité de chaque ressource pour s, selon ses besoins (ce qui s'entasse ne vaut presque rien)
function ducBesoins(etat, s) {
  const S = etat.seigneurs[s], p = ducProduction(etat, s), net = p.nour - p.entretien;
  return {
    nour: net < 2 ? 2.5 : S.nour > 60 ? 0.1 : net < 5 ? 1.2 : 0.5,
    bois: S.bois < 30 ? 1.2 : S.bois > 70 ? 0.1 : 0.5,
    or: S.or < 30 ? 1.6 : S.or > 120 ? 0.4 : 1,
    leg: etat.roiMort || etat.tour >= DUC_TOUR_ROI - 6 ? 2.5 : 1.3,
  };
}
// soldats ennemis (non alliés) voisins de la terre i de s
const ducMenaceTerre = (etat, s, i) => DUC_VOISINS[i].reduce((n, v) => { const t = etat.terres[v]; return n + (t.prop >= 0 && t.prop !== s && !ducAllies(etat, s, t.prop) ? t.gar : 0); }, 0);
// soldats à garder sur une terre (château menacé, frontière face à un seigneur)
function ducGarde(etat, s, i) {
  const m = ducMenaceTerre(etat, s, i), t = etat.terres[i];
  if (t.bat === 'chateau') return Math.min(t.gar, Math.max(1, Math.ceil(m * 0.6)));
  return Math.min(t.gar, m > 0 ? Math.min(2, Math.ceil(m * 0.4)) : 0);
}
// valeur de la production d'une terre pour s
function ducValeurTerre(etat, s, i, V) {
  const t = etat.terres[i], T = DUC_TERRAINS[t.t];
  let v = (T.nour * V.nour + T.bois * V.bois + T.or * V.or) * t.qual;
  if (t.bat) { const P = DUC_BATIMENTS[t.bat].prod; for (const k in P) v += P[k] * V[k]; }
  return v;
}

// le seigneur qui mène : le plus de votes, puis le plus de terres
function ducMeneur(etat) {
  let best = -1, bk = null;
  for (let s = 0; s < 4; s++) {
    if (!etat.seigneurs[s].vivant) continue;
    const k = etat.seigneurs[s].votes * 100 + ducTerresDe(etat, s).length;
    if (bk === null || k > bk) { best = s; bk = k; }
  }
  return best;
}
// intérêt d'attaquer la terre c (0 si interdit ou sans intérêt)
function ducIaValeurCible(etat, s, c, traits, V) {
  const t = etat.terres[c];
  if (ducPeutAttaquer(etat, s, c)) return 0;
  if (t.prop >= 0 && ducA(traits, 'isolationniste')) return 0;
  let val = 3 + ducValeurTerre(etat, s, c, V);
  if (t.prop < 0) return val * (ducA(traits, 'expansionniste') ? 1.6 : 1);
  val *= ducA(traits, 'agressif') ? 1.4 : ducA(traits, 'marchand') ? 0.5 : 0.9;
  if (t.bat === 'chateau' && etat.seigneurs[t.prop].chateau === c) val += 12;
  if (t.prop === 0 && etat.roiMort && etat.seigneurs[0].votes >= 3) val += 4;   // freiner le joueur près de la couronne
  if (t.prop === 0 && s > 0 && ducMeneur(etat) === 0) val += ducNiveau(etat).viseMeneur;   // mode normal : on s'en prend au joueur qui mène
  return val;
}

function ducIaAttaques(etat, s, traits, R, V) {
  const S = etat.seigneurs[s], bonus = ducBonus(etat, s);
  const ratio = (ducA(traits, 'agressif') ? 1.2 : ducA(traits, 'marchand') ? 2 : 1.5) - (s > 0 ? ducNiveau(etat).ratioIa : 0);
  for (let essai = 0; essai < 12 && !etat.fin && S.vivant; essai++) {
    let best = null, bs = 0;
    for (let c = 0; c < etat.terres.length; c++) {
      const val = ducIaValeurCible(etat, s, c, traits, V);
      if (val <= 0) continue;
      const src = ducSources(etat, s, c).map(i => ({ i, n: etat.terres[i].pret - Math.max(0, ducGarde(etat, s, i) - (etat.terres[i].gar - etat.terres[i].pret)) })).filter(x => x.n > 0);
      const dispo = src.reduce((a, x) => a + x.n, 0), D = ducDefense(etat, c);
      if (!dispo) continue;
      // assez pour l'emporter nettement et garder au moins un survivant
      const besoin = Math.max(1, Math.ceil(D * ratio / (1 + bonus) + 1e-9), Math.round(D * 0.5) + 1);
      if (dispo < besoin) continue;
      const n = Math.min(dispo, besoin + 1), ch = ducChance(n * (1 + bonus), D);
      const sc = val * ch - n * 0.1 + R() * 0.4;
      if (sc > bs) { bs = sc; best = { c, src, n }; }
    }
    if (!best || bs < 1) return;
    // on prend d'abord sur les sources les mieux garnies
    let reste = best.n;
    const sources = best.src.sort((a, b) => b.n - a.n).map(x => { const k = Math.min(x.n, reste); reste -= k; return { i: x.i, n: k }; }).filter(x => x.n > 0);
    ducAttaquer(etat, s, best.c, sources);
  }
}

// rapproche les soldats de l'intérieur vers la frontière la plus menacée
// rassemble les soldats vers la terre d'où partira la prochaine attaque (la plus belle cible à portée)
function ducIaDeplacer(etat, s, traits, V) {
  const mes = ducTerresDe(etat, s);
  let rally = -1, rs = 0;
  for (let c = 0; c < etat.terres.length; c++) {
    const val = ducIaValeurCible(etat, s, c, traits, V);
    if (val <= 0) continue;
    const sc = val / (ducDefense(etat, c) + 2);
    if (sc <= rs) continue;
    const pres = DUC_VOISINS[c].filter(v => etat.terres[v].prop === s).sort((a, b) => etat.terres[b].gar - etat.terres[a].gar);
    if (pres.length) { rs = sc; rally = pres[0]; }
  }
  if (rally < 0) return;
  // distance à la terre de ralliement, en restant chez soi
  const dist = { [rally]: 0 }; let file = [rally];
  while (file.length) {
    const suite = [];
    for (const i of file) for (const v of DUC_VOISINS[i]) if (etat.terres[v].prop === s && dist[v] == null) { dist[v] = dist[i] + 1; suite.push(v); }
    file = suite;
  }
  for (const i of mes) {
    if (i === rally || dist[i] == null) continue;
    const t = etat.terres[i], n = t.pret - Math.max(0, ducGarde(etat, s, i) - (t.gar - t.pret));
    if (n <= 0) continue;
    const vers = DUC_VOISINS[i].find(v => dist[v] === dist[i] - 1);
    if (vers != null) ducDeplacer(etat, s, i, vers, n);
  }
}

function ducIaRecruter(etat, s, traits) {
  const S = etat.seigneurs[s], menace = ducMenace(etat, s), sold = ducSoldats(etat, s), plafond = ducPlafond(etat, s);
  let cible = plafond * (ducA(traits, 'batisseur') || ducA(traits, 'marchand') ? 0.7 : 1);
  if (menace > sold * 0.8) cible = plafond;
  let manque = Math.floor(cible) - sold;
  if (manque <= 0) return;
  // où : le château ou la caserne la plus menacée
  const lieux = ducTerresDe(etat, s).filter(i => etat.terres[i].bat === 'chateau' || etat.terres[i].bat === 'caserne')
    .sort((a, b) => ducMenaceTerre(etat, s, b) - ducMenaceTerre(etat, s, a));
  for (const i of lieux) {
    // garder de quoi nourrir l'armée et un peu d'or pour bâtir
    let n = Math.min(manque, ducRecruesMax(etat, s, i));
    while (n > 0) { const c = ducCoutRecrues(etat, s, n); if (S.nour - c.nour >= Math.ceil((sold + n) / 10) + 2 && (menace > sold || S.or - c.or >= 4)) break; n--; }
    if (n > 0 && ducRecruter(etat, s, i, n).ok) manque -= n;
    if (manque <= 0) return;
  }
}

function ducIaBatir(etat, s, traits, R, V) {
  for (let essai = 0; essai < 4; essai++) {
    const sold = ducSoldats(etat, s), plafond = ducPlafond(etat, s), libres = ducTerresDe(etat, s).filter(i => !etat.terres[i].bat).length;
    let best = null, bs = 0;
    for (const i of ducTerresDe(etat, s)) {
      const t = etat.terres[i];
      if (t.bat) continue;
      const interieur = !ducFrontiere(etat, i), m = ducMenaceTerre(etat, s, i);
      for (const b in DUC_BATIMENTS) {
        if (ducPeutConstruire(etat, s, i, b)) continue;
        const B = DUC_BATIMENTS[b];
        let v = 0;
        for (const k in B.prod) v += B.prod[k] * V[k] * Math.min(8, DUC_TOURS - etat.tour) / 4;
        if (b === 'marche') v *= (ducNbBat(etat, s, 'marche') ? 0.6 : 1.2) * (ducA(traits, 'marchand') ? 1.8 : 1);
        if (b === 'mine' && ducA(traits, 'marchand')) v *= 1.4;
        if (b === 'scierie') v *= ducNbBat(etat, s, 'scierie') >= 2 ? 0.4 : 1;
        if (b === 'caserne') v = (sold >= plafond * 0.6 ? 8 : 0.5) * (ducA(traits, 'agressif') ? 1.5 : 1) * (ducNbBat(etat, s, 'caserne') >= 3 ? 0.2 : 1);
        if (b === 'tour') v = m > 2 ? 1 + m * 0.4 : 0;
        if (b !== 'caserne' && libres <= 2 && !ducNbBat(etat, s, 'caserne') && sold >= plafond * 0.6) v *= 0.4;   // garder une place pour la caserne
        if (ducA(traits, 'batisseur')) v *= 1.3;
        v += interieur && b !== 'tour' ? 0.4 : 0;
        const c = ducCoutBat(etat, b), cout = (c.bois * V.bois + c.or * V.or) / 12;
        const sc = v - cout + R() * 0.5;
        if (sc > bs) { bs = sc; best = { i, b }; }
      }
    }
    if (!best || bs < 1) return;
    ducConstruire(etat, s, best.i, best.b);
  }
}

function ducIaChanger(etat, s) {
  const S = etat.seigneurs[s];
  if (!ducNbBat(etat, s, 'marche')) return;
  while (S.change < DUC_CHANGES && S.bois > 60 && S.or < 30) ducChanger(etat, s, 'or');
  while (S.change < DUC_CHANGES && S.or > 50 && S.bois < 15) ducChanger(etat, s, 'bois');
}

// un tour complet de s : attaques, déplacements, recrues, constructions, change
function ducIaJouer(etat, s, traits) {
  const S = etat.seigneurs[s];
  if (!S.vivant || etat.fin) return;
  traits = traits || S.traits;
  const R = ducRng(etat.graine, 'ia', etat.tour, s), V = ducBesoins(etat, s);
  ducIaChanger(etat, s);
  if (ducA(traits, 'batisseur') || ducA(traits, 'marchand')) ducIaBatir(etat, s, traits, R, V);
  ducIaAttaques(etat, s, traits, R, V);
  if (etat.fin || !S.vivant) return;
  ducIaDeplacer(etat, s, traits, V);
  ducIaRecruter(etat, s, traits);
  ducIaBatir(etat, s, traits, R, ducBesoins(etat, s));
}

// réponse du joueur automatique aux événements : le choix qui rapporte le plus selon ses besoins
function ducIaRepondre(etat) {
  if (!etat.evt) return null;
  const J = etat.seigneurs[0], V = ducBesoins(etat, 0), id = etat.evt.id;
  const pref = {
    recolte: J.or >= 30 ? 'payer' : 'perdre', revolte: J.or >= 30 ? 'payer' : 'reprimer', brigands: J.or >= 25 ? 'payer' : 'laisser',
    alliance: 'accepter', tournoi: J.or >= 40 ? 'or' : ducSoldats(etat, 0) >= 9 ? 'soldats' : 'non', relique: V.leg > 1.5 || J.or > 40 ? 'exposer' : 'vendre',
    impot: J.or >= 35 ? 'payer' : 'refuser', belle: V.nour > 1 ? 'stocker' : 'fete', marchand: J.bois > 40 ? 'vendre' : J.or > 40 ? 'acheter' : 'non',
    mariage: 'marier', hiver: J.bois >= 40 ? 'bruler' : 'subir', pelerins: J.nour >= 20 ? 'loger' : 'fermer', mercenaires: J.or >= 40 && ducMenace(etat, 0) > ducSoldats(etat, 0) ? 'engager' : 'non', roi: 'ok',
  }[id];
  const choix = ducChoix(etat);
  const c = choix.find(x => x.k === pref && x.ok) || choix.find(x => x.ok);
  return ducRepondre(etat, c.k);
}

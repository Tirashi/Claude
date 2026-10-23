/* =====================================================================
   LA BOUTIQUE DE CARTES · les CLIENTS (logique pure) : l'affluence de
   la semaine, ce que chaque client achète, le tournoi du samedi, les
   rencontres (vendeur de collection, collectionneur, marchand) et les
   événements. Chargé après regles.js et cartes.js.
   Cahier des charges : specs/boutique-de-cartes.md § 7, 9, 10.
   ===================================================================== */
'use strict';
const BOU_POIDS_JOUR = [0.8, 1.3, 0.85, 1.0, 1.6];   // mardi … samedi (le mercredi, les enfants ; le samedi, tout le monde)
const BOU_CLIENTS = {
  enfant: { nom: 'Enfant', budget: [4, 14] },
  joueur: { nom: 'Joueur', budget: [10, 45] },
  collectionneur: { nom: 'Collectionneur', budget: [20, 150] },
  parent: { nom: 'Parent', budget: [10, 40] },
  curieux: { nom: 'Curieux', budget: [3, 12] },
};
// le calendrier (semaine 1 = début janvier) : vacances scolaires et Noël
function bouSaison(s) {
  if (s >= 48 && s <= 51) return { nom: 'NOËL', noel: true, vacances: s === 51 };
  if (s === 52) return { nom: 'VACANCES DE NOËL', vacances: true };
  if (s === 7 || s === 8) return { nom: 'VACANCES D\'HIVER', vacances: true };
  if (s === 15 || s === 16) return { nom: 'VACANCES DE PRINTEMPS', vacances: true };
  if (s >= 28 && s <= 35) return { nom: 'VACANCES D\'ÉTÉ', vacances: true, ete: true };
  if (s === 43 || s === 44) return { nom: 'VACANCES DE LA TOUSSAINT', vacances: true };
  return { nom: '' };
}
// clients attendus par jour (avant le poids du jour)
function bouAffluence(e) {
  const S = bouSaison(e.semaine), T = bouTaille(e);
  let a = 14 * (0.6 + e.reputation / 60) * (1 + bouAttrait(e) / 80);
  if (S.noel) a *= 1.5; else if (S.ete) a *= 0.9; else if (S.vacances) a *= 1.15;
  if (e.evenement && e.evenement.id === 'video') a *= 1.25;
  if (e.evenement && e.evenement.id === 'salon') a *= 1.15;
  if (e.effets.concurrent >= e.semaine) a *= e.reputation >= 60 ? 0.95 : 0.78;
  return { moyenne: a, max: Math.round(T.L * T.P * 1.4) };
}
function bouPlanSemaine(e) {
  const R = bouRng(e.graine, 'plan', e.semaine), A = bouAffluence(e);
  const clients = BOU_POIDS_JOUR.map(p => Math.max(1, Math.min(A.max, Math.round(A.moyenne * p * (0.85 + R() * 0.3)))));
  const rencontres = [], jours = bouMelanger(R, [0, 1, 2, 3]);
  if (e.semaine >= 2 && R() < 0.35) rencontres.push({ jour: jours.pop(), type: 'vendeur' });
  if (R() < 0.25 * (0.5 + e.reputation / 50)) rencontres.push({ jour: jours.pop(), type: 'collectionneur' });
  if (rencontres.length < 2 && R() < 0.25) rencontres.push({ jour: jours.pop(), type: 'marchand' });
  return { clients, rencontres };
}

/* ---------- une visite ---------- */
function bouTypeClient(e, R, j) {
  const S = bouSaison(e.semaine), tables = bouNb(e, 'table'), ev = e.evenement && e.evenement.id;
  return bouPondere(R, {
    enfant: 40 * (S.vacances ? 1.8 : 1) * (j === 1 ? 1.6 : 1),
    joueur: 22 * (tables ? 1 + 0.15 * Math.min(4, tables) : 0.6) * (e.effets.tournoi === e.semaine ? 1.5 : 1) * (ev === 'video' ? 1.3 : 1),
    collectionneur: 12 * (0.5 + e.reputation / 50) * (bouNb(e, 'grande') ? 1.4 : 1) * (ev === 'salon' ? 1.8 : 1),
    parent: 15 * (S.noel ? 2 : 1),
    curieux: 10,
  });
}
// le plafond qu'un client accepte pour un produit (prix conseillé × humeur × réputation)
function bouLimite(e, R, cle) {
  const [a, n] = cle.split(':'), A = BOU_ARTICLES[a];
  let l = A.conseille * (0.95 + R() * 0.4) * (0.9 + e.reputation / 500);
  if (bouSaison(e.semaine).noel) l *= 1.1;
  if (A.ext) { const X = bouExtension(e, +n), fin = X.sortie + BOU_COMMANDABLE; if (e.semaine >= fin) l *= 1 + 0.03 * (e.semaine - fin); }
  return l;
}
function bouVisite(e, R, j) {
  const type = bouTypeClient(e, R, j), C = BOU_CLIENTS[type], v = { type, achats: [], dit: null };
  let budget = bouEntre(R, ...C.budget);
  if (type === 'collectionneur') budget = Math.round(budget * (0.6 + e.reputation / 100));
  if (bouSaison(e.semaine).noel) budget = Math.round(budget * 1.5);
  const rayon = bouEnRayon(e), envie = { manque: 0, trop: 0 };
  // un produit du rayon : pris s'il est rangé, en stock et pas trop cher
  const produit = cle => {
    if (!rayon.has(cle) || !(e.stock[cle] > 0)) { envie.manque++; return false; }
    const p = bouPrix(e, cle);
    if (p > budget) return false;
    if (p > bouLimite(e, R, cle)) { envie.trop++; return false; }
    e.stock[cle]--; budget -= p; bouEncaisser(e, p);
    v.achats.push({ cle, prix: p });
    return true;
  };
  // un booster : celui de la dernière extension, sinon un autre du rayon
  const booster = () => {
    const X = bouDerniere(e), cle = 'booster:' + X.n;
    if (rayon.has(cle) && e.stock[cle] > 0) return produit(cle);
    const autres = [...rayon].filter(c => c.startsWith('booster:') && e.stock[c] > 0);
    if (autres.length && R() < 0.6) return produit(bouChoix(R, autres));
    envie.manque++; return false;
  };
  const sortie = bouDerniere(e).sortie === e.semaine;   // la semaine de sortie d'une extension : la file d'attente
  if (type === 'enfant') {
    if (R() < (sortie ? 0.95 : 0.75)) { booster(); while (R() < 0.45 && booster()); }
    if (R() < 0.45) bouAcheterCartes(e, R, v, 1, budget, c => bouCote(e, c.id) <= 3, () => 1.1 + R() * 0.6, envie, x => budget -= x);
  } else if (type === 'joueur') {
    if (R() < (sortie ? 0.9 : 0.6)) { booster(); while (R() < 0.5 && booster()); }
    if (R() < 0.55) bouAcheterCartes(e, R, v, 2, budget, null, c => (0.95 + R() * 0.35) * (e.meta[c.el] || 1), envie, x => budget -= x, c => (c.atk + c.pv) * (e.meta[c.el] || 1));
    if (R() < 0.3) produit('pochettes');
  } else if (type === 'collectionneur') {
    if (R() < 0.85) bouAcheterCartes(e, R, v, 3, budget, c => c.rar >= 2, () => 1 + R() * 0.4, envie, x => budget -= x);
    if (!v.achats.length) {
      const vieux = [...rayon].filter(c => c.startsWith('booster:') && e.stock[c] > 0 && +c.split(':')[1] < bouDerniere(e).n);
      if (vieux.length && R() < 0.5) produit(bouChoix(R, vieux)); else if (R() < 0.3) produit('coffret:' + bouDerniere(e).n);
    }
  } else if (type === 'parent') {
    if (R() < 0.4) produit('classeur');
    if (R() < 0.4) produit('pochettes');
    if (R() < (bouSaison(e.semaine).noel ? 0.9 : 0.5)) produit('coffret:' + bouDerniere(e).n);
    if (R() < 0.3) booster();
  } else {
    if (R() < 0.4) booster();
    if (R() < 0.1) produit('pochettes');
  }
  if (type !== 'enfant' && type !== 'curieux' && rayon.has('figurine') && R() < 0.15) produit('figurine');
  // satisfaction : un achat fait plaisir, un rayon vide déçoit, un prix trop haut un peu
  if (v.achats.length) e.reputation += 0.02;
  else if (envie.manque) { v.dit = 'manque'; e.reputation -= 0.12; e.stats.manques++; }
  else if (envie.trop) { v.dit = 'trop'; e.reputation -= 0.03; e.stats.trop++; }
  e.reputation = Math.max(0, Math.min(100, e.reputation));
  e.stats.clients++; e.compte.clients++;
  return v;
}
function bouEncaisser(e, p) { e.caisse = bouArrondi(e.caisse + p); e.compte.ventes = bouArrondi(e.compte.ventes + p); e.stats.ventes++; }
// des cartes des vitrines : « filtre » dit lesquelles l'intéressent, « facteur » ce qu'il accepte de payer (× cote), « prefere » l'ordre
function bouAcheterCartes(e, R, v, max, budget, filtre, facteur, envie, payer, prefere) {
  const offres = [];
  for (const m of e.meubles) for (const [i, p] of (e.vitrines[m.id] || []).entries()) if (p) {
    const c = bouCarte(e, p.id);
    if (!filtre || filtre(c)) offres.push({ m, i, p, c, prix: bouPrixCarte(e, p) });
  }
  if (!offres.length) return;
  if (prefere) offres.sort((a, b) => prefere(b.c) - prefere(a.c)); else bouMelanger(R, offres);
  let pris = 0, cher = false;
  for (const o of offres) {
    if (pris >= max) break;
    if (o.prix > budget) continue;
    let f = facteur(o.c);
    if (e.evenement && e.evenement.id === 'video' && e.evenement.carte === o.c.id) f *= 1.3;
    if (o.prix > bouCote(e, o.c.id) * f) { cher = true; continue; }
    e.vitrines[o.m.id][o.i] = null; budget -= o.prix; payer(o.prix); bouEncaisser(e, o.prix);
    v.achats.push({ carte: o.c.id, prix: o.prix, meuble: o.m.id }); pris++;
  }
  if (!pris && cher) envie.trop++;
}

/* ---------- le tournoi du samedi ---------- */
function bouJouerTournoi(e) {
  const tables = bouNb(e, 'table');
  if (!e.tournoi.inscrit || !tables) return null;
  const R = bouRng(e.graine, 'tournoi', e.semaine), places = Math.min(16, 4 * tables), cle = 'booster:' + bouDerniere(e).n;
  const lots = Math.min(e.tournoi.lots, e.stock[cle] || 0), S = bouSaison(e.semaine);
  const remplissage = Math.max(0.15, Math.min(1, 0.3 + e.reputation / 150 + lots / places * 0.25 - e.tournoi.frais * 0.06 + (S.vacances ? 0.1 : 0) + R() * 0.15));
  const inscrits = Math.max(2, Math.round(places * remplissage)), recette = e.tournoi.frais * inscrits;
  e.stock[cle] = (e.stock[cle] || 0) - lots;
  e.caisse = bouArrondi(e.caisse + recette); e.compte.tournoi = recette;
  e.reputation = Math.min(100, e.reputation + Math.min(4, 0.6 + lots / inscrits * 3));
  // les deux finalistes jouent chacun un élément ; leurs cartes seront à la mode dimanche
  const els = [bouPondere(R, e.meta), bouPondere(R, e.meta)];
  e.tournoiRes = { els }; e.effets.tournoi = e.semaine + 1; e.stats.tournois++;
  return { inscrits, places, recette, lots, finalistes: els };
}
function bouEffetTournoi(e, res) {
  for (const el of new Set(res.els)) {
    e.meta[el] = Math.min(1.6, e.meta[el] * 1.04);
    for (const id in e.pop) { const c = bouCarte(e, id); if (c.el === el && c.rar >= 2) e.pop[id] = Math.min(4, e.pop[id] * 1.08); }
  }
}

/* ---------- les rencontres (le temps s'arrête, on décide) ---------- */
function bouTirerCarteSortie(e, R) {
  const X = bouChoix(R, bouSorties(e)), r = R();
  const rar = r < 0.005 ? 4 : r < 0.04 ? 3 : r < 0.15 ? 2 : r < 0.4 ? 1 : 0, debut = [0, 20, 30, 36, 39][rar], nb = BOU_RARETES[rar].nb;
  return X.cartes[debut + Math.floor(R() * nb)];
}
function bouPreparerRencontre(e, type, R) {
  if (type === 'vendeur') {
    const cartes = []; for (let k = bouEntre(R, 10, 24); k > 0; k--) cartes.push(bouTirerCarteSortie(e, R));
    const valeur = bouArrondi(cartes.reduce((s, id) => s + bouCote(e, id), 0));
    return { type, cartes, valeur, prix: Math.max(5, Math.round(valeur * (0.35 + R() * 0.5))) };
  }
  if (type === 'collectionneur') {
    const a = [];
    for (const id in e.reserve) if (bouCarte(e, id).rar >= 2) a.push(id);
    for (const k in e.vitrines) for (const p of e.vitrines[k]) if (p && bouCarte(e, p.id).rar >= 2) a.push(p.id);
    if (!a.length) return null;
    a.sort((x, y) => bouCote(e, y) - bouCote(e, x));
    const id = a[Math.floor(R() * Math.min(3, a.length))];
    return { type, carte: id, offre: Math.max(2, Math.round(bouCote(e, id) * (1.2 + R() * 0.4))) };
  }
  if (type === 'marchand') {
    const lot = {}; let nb = 0, valeur = 0;
    for (const id in e.reserve) if (bouCarte(e, id).rar <= 1) { lot[id] = e.reserve[id]; nb += lot[id]; valeur += lot[id] * bouCote(e, id); }
    if (nb < 15) return null;
    const f = 0.9 + R() * 0.2;
    return { type, lot, nb, valeur: bouArrondi(valeur), offres: [0.4, 0.48, 0.53].map(x => Math.max(1, Math.round(valeur * x * f))), etape: 0 };
  }
  return null;
}
// « oui » ou « non » ; le marchand fait jusqu'à trois offres
function bouRepondre(e, choix) {
  const r = e.rencontre; if (!r) return null;
  const res = { type: r.type, choix, ok: true };
  if (choix === 'oui') {
    if (r.type === 'vendeur') {
      if (r.prix > e.caisse) return { ok: false, raison: 'argent' };
      e.caisse = bouArrondi(e.caisse - r.prix); e.compte.rencontres -= r.prix;
      for (const id of r.cartes) e.reserve[id] = (e.reserve[id] || 0) + 1;
    } else if (r.type === 'collectionneur') {
      if (e.reserve[r.carte] > 0) bouRetirerReserve(e, r.carte);
      else { let fait = false; for (const k in e.vitrines) e.vitrines[k].forEach((p, i) => { if (!fait && p && p.id === r.carte) { e.vitrines[k][i] = null; fait = true; } }); if (!fait) return { ok: false, raison: 'carte' }; }
      e.caisse = bouArrondi(e.caisse + r.offre); e.compte.rencontres += r.offre;
    } else if (r.type === 'marchand') {
      for (const id in r.lot) { e.reserve[id] -= r.lot[id]; if (e.reserve[id] <= 0) delete e.reserve[id]; }
      const o = r.offres[r.etape]; e.caisse = bouArrondi(e.caisse + o); e.compte.rencontres += o;
    }
    e.stats.rencontres++; e.rencontre = null;
  } else if (r.type === 'marchand' && r.etape < 2 && bouRng(e.graine, 'marchand', e.semaine, r.etape)() > 0.25) {
    r.etape++; res.encore = true;   // il revient avec une meilleure offre
  } else e.rencontre = null;
  return res;
}

/* ---------- les événements (un par semaine au plus, annoncé une semaine à l'avance) ---------- */
const BOU_EVENEMENTS = {
  interdite: { nom: 'CARTE INTERDITE', poids: 2 },
  video: { nom: 'LA VIDÉO DE LA SEMAINE', poids: 2 },
  rupture: { nom: 'RUPTURE CHEZ LE GROSSISTE', poids: 1.5 },
  reedition: { nom: 'RÉÉDITION', poids: 1 },
  concurrent: { nom: 'UN CONCURRENT OUVRE', poids: 1 },
  salon: { nom: 'SALON DES COLLECTIONNEURS', poids: 1 },
};
function bouTirerEvenement(e, s) {
  const R = bouRng(e.graine, 'evenement', s);
  if (s < 3 || s > BOU_SEMAINES || R() > 0.45) return null;
  const sorties = bouCatalogue(e.graine).extensions.filter(x => x.sortie <= s), derniere = sorties[sorties.length - 1];
  const poids = {};
  for (const k in BOU_EVENEMENTS) poids[k] = BOU_EVENEMENTS[k].poids;
  const vieilles = sorties.filter(x => x.sortie + BOU_COMMANDABLE < s && !(e.effets.reeditees || []).includes(x.n));
  if (!vieilles.length) delete poids.reedition;
  if (s < 8 || e.effets.concurrentFait) delete poids.concurrent;
  const id = bouPondere(R, poids), ev = { id, semaine: s, nom: BOU_EVENEMENTS[id].nom };
  const carte = rar => { const X = bouChoix(R, sorties); return X.cartes[[30, 36][rar - 2] + Math.floor(R() * [6, 3][rar - 2])]; };
  if (id === 'interdite') ev.carte = carte(R() < 0.7 ? 2 : 3);
  if (id === 'video') ev.carte = carte(R() < 0.6 ? 2 : 3);
  if (id === 'rupture') ev.cle = 'booster:' + derniere.n;
  if (id === 'reedition') ev.ext = bouChoix(R, vieilles).n;
  return ev;
}
function bouDebutEvenement(e) {
  const ev = e.evenement;
  if (ev.id === 'interdite') e.pop[ev.carte] = Math.max(0.25, (e.pop[ev.carte] || 1) / 3);
  if (ev.id === 'video') e.pop[ev.carte] = Math.min(4, (e.pop[ev.carte] || 1) * 3);
  if (ev.id === 'reedition') {
    e.reedition = { ext: ev.ext, fin: e.semaine + 5 }; (e.effets.reeditees = e.effets.reeditees || []).push(ev.ext);
    for (const id of bouExtension(e, ev.ext).cartes) e.pop[id] = Math.max(0.25, e.pop[id] * 0.8);
  }
  if (ev.id === 'concurrent') { e.effets.concurrent = e.semaine + 4; e.effets.concurrentFait = true; }
}
// le dimanche : la vidéo est oubliée (la carte garde une partie de sa hausse) ; la réédition s'arrête
function bouFinEvenement(e) {
  const ev = e.evenement;
  if (ev && ev.id === 'video') e.pop[ev.carte] = Math.max(0.25, e.pop[ev.carte] * 0.6);
  if (e.reedition && e.semaine >= e.reedition.fin) e.reedition = null;
}

/* =====================================================================
   LA BOUTIQUE DE CARTES · les RÈGLES (logique pure, sans affichage ni
   stockage) : l'état de la partie, la semaine (lundi, cinq jours de
   clients, tournoi du samedi, bilan du dimanche), le grossiste, les prix,
   les vitrines, les meubles et les agrandissements, le prêt, la fin.
   Tout l'aléatoire passe par des générateurs à graine, un flux par usage
   (bouRng(graine, usage, a, b)) : aucun Math.random().
   Les fonctions modifient l'état reçu (un objet JSON, sauvegardable tel
   quel) et ne touchent à rien d'autre.
   - Dans la page : scripts classiques monstres.js, regles.js, cartes.js,
     clients.js (portée globale, noms préfixés bou / BOU).
   - Dans Node : outils/boutique-simulateur.js les charge dans un même
     contexte (vm), comme la page.
   Cahier des charges : specs/boutique-de-cartes.md.
   ===================================================================== */
'use strict';
const BOU_V = 1;
const BOU_SEMAINES = 52, BOU_ECHEANCE = 26;   // l'année ; le prêt est dû à la fin de la semaine 26
const BOU_PRET = 2000, BOU_INTERET = 0.2, BOU_APPORT = 400;   // la banque prête 2 000 € ; ce qui reste à la semaine 26 coûte 20 % de plus
const BOU_JOURS = ['MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'];
const BOU_BONUS_CLASSEUR = 200;   // un classeur complet (les 40 cartes d'une extension) : + 200 € de valeur et + 8 de réputation
const BOU_TAILLES = [
  { L: 6, P: 5, loyer: 60 },
  { L: 8, P: 5, prix: 900, loyer: 85, nom: 'L\'ARRIÈRE-BOUTIQUE' },
  { L: 8, P: 7, prix: 1600, loyer: 120, nom: 'LA SALLE DE TOURNOI' },
  { L: 10, P: 7, prix: 2600, loyer: 160, nom: 'LE GRAND MAGASIN' },
];
const BOU_PORTE = 1;   // la porte est dans le mur de devant, colonne 1 (la case (1, P − 1) reste libre)
// les meubles (posés face à +z quand r = 0 ; « client » : les clients viennent devant) ; « des » : débloqué à cette semaine
const BOU_MEUBLES = {
  caisse: { nom: 'Caisse', prix: 0, taille: [1, 1], attrait: 0, client: true, unique: true },
  rayon: { nom: 'Rayon de boosters', prix: 80, taille: [1, 1], attrait: 4, client: true, produits: 3 },
  vitrine: { nom: 'Vitrine basse', prix: 120, taille: [1, 1], attrait: 6, client: true, cartes: 8 },
  grande: { nom: 'Grande vitrine', prix: 220, taille: [1, 1], attrait: 10, client: true, cartes: 4, valeur: true },
  table: { nom: 'Table de tournoi', prix: 150, taille: [2, 2], attrait: 8 },
  classeurs: { nom: 'Étagère à classeurs', prix: 60, taille: [1, 1], attrait: 3, client: true, vend: ['classeur', 'pochettes'] },
  plante: { nom: 'Plante verte', prix: 15, taille: [1, 1], attrait: 3, deco: true },
  lampe: { nom: 'Lampadaire', prix: 25, taille: [1, 1], attrait: 2, deco: true },
  tapis: { nom: 'Tapis de jeu', prix: 40, taille: [1, 1], attrait: 4, deco: true, passe: true, des: 5 },
  affiche: { nom: 'Affiche géante', prix: 50, taille: [1, 1], attrait: 5, deco: true, des: 8 },
  arcade: { nom: 'Borne d\'arcade', prix: 300, taille: [1, 1], attrait: 12, revenu: 15, des: 12 },
  figurines: { nom: 'Présentoir de figurines', prix: 180, taille: [1, 1], attrait: 8, client: true, vend: ['figurine'], des: 20 },
};
// les articles du grossiste ; « ext » : un par extension (clé « booster:2 »)
const BOU_ARTICLES = {
  booster: { nom: 'Booster', achat: 2.5, conseille: 4, ext: true },
  presentoir: { nom: 'Présentoir de 24 boosters', achat: 54, ext: true, donne: 'booster', nb: 24 },
  coffret: { nom: 'Coffret découverte', achat: 9, conseille: 15, ext: true },
  pochettes: { nom: 'Pochettes de protection', achat: 1, conseille: 3 },
  classeur: { nom: 'Classeur', achat: 5, conseille: 12 },
  figurine: { nom: 'Figurine', achat: 6, conseille: 12, des: 20 },
};
const BOU_DIR = [[0, 1], [1, 0], [0, -1], [-1, 0]];

/* ---------- hasard ---------- */
function bouMulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function bouRng(graine, usage, a, b) {
  let h = 2166136261;
  for (const ch of String(graine) + '|' + usage + '|' + (a || 0) + '|' + (b || 0)) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 13; }
  return bouMulberry(h >>> 0);
}
const bouEntre = (R, a, b) => a + Math.floor(R() * (b - a + 1));
const bouChoix = (R, l) => l[Math.floor(R() * l.length)];
const bouMelanger = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function bouPondere(R, poids) { let t = 0; for (const k in poids) t += poids[k]; let x = R() * t; for (const k in poids) { x -= poids[k]; if (x < 0) return k; } return Object.keys(poids)[0]; }
const bouArrondi = v => Math.round(v * 100) / 100;

/* ---------- nouvelle partie ---------- */
function bouNouvelle(graine) {
  const e = {
    v: BOU_V, graine: String(graine), semaine: 1, phase: 'lundi', jour: 0,
    caisse: BOU_PRET + BOU_APPORT, pret: BOU_PRET, reputation: 20, niveau: 0,
    meubles: [], idMeuble: 1,
    stock: {}, prix: {}, commandes: [],
    reserve: {}, classeur: {}, vitrines: {},
    meta: {}, pop: {}, ouverts: 0,
    tournoi: { inscrit: false, frais: 2, lots: 4 },
    evenement: null, prochain: null, reedition: null, effets: {},
    rencontre: null, plan: null, compte: null, sousZero: 0, complets: [],
    stats: { clients: 0, ventes: 0, manques: 0, trop: 0, meilleure: null, tournois: 0, rencontres: 0, boostersOuverts: 0 },
    fin: null, livreDirect: true,
  };
  for (const el of BOU_ELEMENTS) e.meta[el] = 1;
  bouSortirExtension(e, 1);
  // la boutique de départ : la caisse, un rayon, une vitrine basse, et de quoi vendre la première semaine
  bouPlacer(e, 'caisse', 4, 1, 0);
  const r = bouPlacer(e, 'rayon', 0, 1, 1); r.produits = ['booster:1', 'coffret:1', 'pochettes'];
  bouPlacer(e, 'vitrine', 2, 1, 0);
  e.stock = { 'booster:1': 36, 'coffret:1': 3, pochettes: 15 };
  e.prochain = bouTirerEvenement(e, 2);
  bouNouveauCompte(e);
  return e;
}
function bouMigrer(e) {
  if (!e || e.v !== BOU_V) return null;
  if (!e.livreDirect) { if (e.phase === 'lundi') bouLivrer(e); e.livreDirect = true; }
  return e;
}
const bouTaille = e => BOU_TAILLES[e.niveau];
function bouNouveauCompte(e) { e.compte = { ventes: 0, achats: 0, loyer: 0, tournoi: 0, rencontres: 0, meubles: 0, arcade: 0, clients: 0, detail: {} }; }

/* ---------- prix et stock ---------- */
const bouArticle = cle => BOU_ARTICLES[cle.split(':')[0]];
const bouPrix = (e, cle) => e.prix[cle] !== undefined ? e.prix[cle] : bouArticle(cle).conseille;
function bouFixerPrix(e, cle, prix) { if (!bouArticle(cle) || !(prix > 0)) return false; e.prix[cle] = bouArrondi(prix); return true; }
// le grossiste : payé et livré tout de suite (demande du 23/10 : attendre le lundi suivant n'était pas intuitif) ;
// e.commandes garde la commande de ce lundi, pour pouvoir l'annuler tant que les articles sont encore en stock
const bouCleStock = cle => { const A = bouArticle(cle); return A.donne ? A.donne + ':' + cle.split(':')[1] : cle; };
function bouCommander(e, cle, nb) {
  const [a, n] = cle.split(':'), A = BOU_ARTICLES[a];
  if (!A || !(nb > 0) || e.phase !== 'lundi') return { ok: false, raison: 'phase' };
  if (A.ext && !bouCommandable(e, +n)) return { ok: false, raison: 'extension' };
  if (A.des && e.semaine < A.des) return { ok: false, raison: 'bloque' };
  if (e.evenement && e.evenement.id === 'rupture' && bouCleStock(cle) === e.evenement.cle) return { ok: false, raison: 'rupture' };
  const cout = bouArrondi(A.achat * nb);
  if (cout > e.caisse) return { ok: false, raison: 'argent' };
  e.caisse = bouArrondi(e.caisse - cout); e.compte.achats += cout;
  const k = bouCleStock(cle); e.stock[k] = (e.stock[k] || 0) + nb * (A.nb || 1);
  const c = e.commandes.find(x => x.cle === cle);
  if (c) c.nb += nb; else e.commandes.push({ cle, nb });
  return { ok: true, cout };
}
function bouAnnulerCommande(e, cle) {
  const i = e.commandes.findIndex(x => x.cle === cle);
  if (i < 0 || e.phase !== 'lundi') return false;
  const c = e.commandes[i], A = bouArticle(c.cle), k = bouCleStock(c.cle), nb = c.nb * (A.nb || 1);
  if ((e.stock[k] || 0) < nb) return false;   // déjà ouverts : on ne peut plus les rendre
  e.commandes.splice(i, 1); e.stock[k] -= nb;
  const rend = bouArrondi(A.achat * c.nb);
  e.caisse = bouArrondi(e.caisse + rend); e.compte.achats -= rend;
  return true;
}
// les anciennes sauvegardes (livraison le lundi suivant) : ce qui attendait d'être livré arrive tout de suite
function bouLivrer(e) {
  for (const c of e.commandes) { const k = bouCleStock(c.cle); e.stock[k] = (e.stock[k] || 0) + c.nb * (bouArticle(c.cle).nb || 1); }
  e.commandes = [];
}
// ouvrir un booster ou un coffret du stock : les cartes vont dans la réserve
function bouOuvrir(e, cle) {
  const [a, n] = cle.split(':');
  if ((a !== 'booster' && a !== 'coffret') || !(e.stock[cle] > 0) || e.phase !== 'lundi') return null;
  e.stock[cle]--;
  const ids = a === 'booster' ? bouTirerBooster(e, +n) : bouTirerCoffret(e, +n);
  for (const id of ids) e.reserve[id] = (e.reserve[id] || 0) + 1;
  e.stats.boostersOuverts += a === 'booster' ? 1 : 2;
  const best = ids.reduce((b, id) => bouCote(e, id) > bouCote(e, b) ? id : b);
  if (!e.stats.meilleure || bouCote(e, best) > bouCote(e, e.stats.meilleure)) e.stats.meilleure = best;
  return ids;
}
// le classeur personnel : une carte de la réserve qu'on garde (elle compte pour la valeur, pas à vendre)
function bouGarder(e, id) {
  if (!(e.reserve[id] > 0) || e.classeur[id]) return false;
  bouRetirerReserve(e, id); e.classeur[id] = 1;
  bouVerifierClasseurs(e);
  return true;
}
function bouRetirerReserve(e, id) { if (--e.reserve[id] <= 0) delete e.reserve[id]; }
function bouVerifierClasseurs(e) {
  for (const X of bouSorties(e)) if (!e.complets.includes(X.n) && X.cartes.every(id => e.classeur[id])) {
    e.complets.push(X.n); e.reputation = Math.min(100, e.reputation + 8);
  }
}

/* ---------- vitrines ---------- */
// une place de vitrine : { id, pct } (prix = cote × pct / 100, arrondi à 10 centimes)
const bouPrixCarte = (e, place) => Math.max(0.1, Math.round(bouCote(e, place.id) * place.pct / 10) / 10);
function bouPlaces(e, m) { const n = BOU_MEUBLES[m.type].cartes || 0; const v = e.vitrines[m.id] || (e.vitrines[m.id] = []); while (v.length < n) v.push(null); return v; }
function bouMettreEnVitrine(e, mid, place, id, pct = 110) {
  const m = e.meubles.find(x => x.id === mid); if (!m || !BOU_MEUBLES[m.type].cartes) return false;
  const v = bouPlaces(e, m); if (place < 0 || place >= v.length) return false;
  if (id && !(e.reserve[id] > 0)) return false;
  if (id && BOU_MEUBLES[m.type].valeur && bouCarte(e, id).rar < 2) return false;   // la grande vitrine : rare et mieux
  if (v[place]) e.reserve[v[place].id] = (e.reserve[v[place].id] || 0) + 1;
  v[place] = id ? { id, pct } : null;
  if (id) bouRetirerReserve(e, id);
  return true;
}
function bouPrixVitrine(e, mid, place, pct) { const v = e.vitrines[mid]; if (!v || !v[place]) return false; v[place].pct = Math.max(50, Math.min(300, Math.round(pct))); return true; }
// range tout seul la réserve : les cartes les plus chères dans les grandes vitrines, puis les vitrines basses ; les cartes déjà en place restent
function bouRemplirVitrines(e, pct = 110) {
  const ids = [];
  for (const id in e.reserve) for (let k = 0; k < e.reserve[id]; k++) ids.push(id);
  ids.sort((a, b) => bouCote(e, b) - bouCote(e, a));
  for (const valeur of [true, false]) for (const m of e.meubles) {
    if (!!BOU_MEUBLES[m.type].valeur !== valeur || !BOU_MEUBLES[m.type].cartes) continue;
    const v = bouPlaces(e, m);
    for (let p = 0; p < v.length; p++) if (!v[p]) {
      const i = ids.findIndex(id => !valeur || bouCarte(e, id).rar >= 2);
      if (i < 0) break;
      bouMettreEnVitrine(e, m.id, p, ids.splice(i, 1)[0], pct);
    }
  }
}
// ce qu'on vend en rayon : les produits rangés sur les rayons (3 par rayon), et ceux des étagères (classeurs, figurines)
function bouEnRayon(e) {
  const s = new Set();
  for (const m of e.meubles) {
    if (m.produits) m.produits.forEach(c => c && s.add(c));
    (BOU_MEUBLES[m.type].vend || []).forEach(c => s.add(c));
  }
  return s;
}
function bouRanger(e, mid, i, cle) {
  const m = e.meubles.find(x => x.id === mid); if (!m || m.type !== 'rayon' || i < 0 || i >= 3) return false;
  if (cle && !bouArticle(cle)) return false;
  m.produits[i] = cle || null; return true;
}

/* ---------- meubles : la grille, le chemin des clients ---------- */
function bouCases(type, x, z, r) { const [w, d] = BOU_MEUBLES[type].taille, [a, b] = r % 2 ? [d, w] : [w, d], l = []; for (let i = 0; i < a; i++) for (let j = 0; j < b; j++) l.push([x + i, z + j]); return l; }
// la case où se tient un client devant le meuble (meubles 1 × 1)
const bouDevant = m => [m.x + BOU_DIR[m.r][0], m.z + BOU_DIR[m.r][1]];
function bouOccupation(e, sauf) {
  const T = bouTaille(e), g = Array.from({ length: T.L }, () => new Array(T.P).fill(0));
  for (const m of e.meubles) if (m !== sauf && !BOU_MEUBLES[m.type].passe) for (const [x, z] of bouCases(m.type, m.x, m.z, m.r)) if (g[x] && z >= 0 && z < T.P) g[x][z] = m.id;
  return g;
}
// toutes les cases « devant » des meubles à clients doivent rester atteignables depuis la porte
function bouCheminLibre(e) {
  const T = bouTaille(e), g = bouOccupation(e), entree = [BOU_PORTE, T.P - 1];
  if (g[entree[0]][entree[1]]) return false;
  const vu = new Set([entree.join()]), file = [entree];
  while (file.length) {
    const [x, z] = file.shift();
    for (const [dx, dz] of BOU_DIR) { const a = x + dx, b = z + dz, k = a + ',' + b; if (a >= 0 && b >= 0 && a < T.L && b < T.P && !g[a][b] && !vu.has(k)) { vu.add(k); file.push([a, b]); } }
  }
  return e.meubles.every(m => !BOU_MEUBLES[m.type].client || vu.has(bouDevant(m).join()));
}
function bouPlaceLibre(e, type, x, z, r, sauf) {
  const T = bouTaille(e), g = bouOccupation(e, sauf);
  return bouCases(type, x, z, r).every(([a, b]) => a >= 0 && b >= 0 && a < T.L && b < T.P && (BOU_MEUBLES[type].passe || !g[a][b]));
}
// pose sans contrôle (départ) ; bouPoser contrôle le prix, la place et le chemin
function bouPlacer(e, type, x, z, r) {
  const m = { id: e.idMeuble++, type, x, z, r };
  if (type === 'rayon') m.produits = [null, null, null];
  e.meubles.push(m); return m;
}
// la raison pour laquelle on ne peut pas poser ce meuble là (« place », « chemin »), ou null (pour le fantôme de l'aménagement) ;
// « sauf » : le meuble qu'on déplace
function bouPeutPoser(e, type, x, z, r, sauf) {
  if (!bouPlaceLibre(e, type, x, z, r, sauf)) return 'place';
  const essai = { id: -1, type, x, z, r }, avant = e.meubles;
  e.meubles = avant.filter(m => m !== sauf).concat([essai]);
  const ok = bouCheminLibre(e);
  e.meubles = avant;
  return ok ? null : 'chemin';
}
function bouPoser(e, type, x, z, r) {
  const M = BOU_MEUBLES[type];
  if (!M || M.unique || e.phase !== 'lundi') return { ok: false, raison: 'phase' };
  if (M.des && e.semaine < M.des) return { ok: false, raison: 'bloque' };
  if (M.prix > e.caisse) return { ok: false, raison: 'argent' };
  if (!bouPlaceLibre(e, type, x, z, r)) return { ok: false, raison: 'place' };
  const m = bouPlacer(e, type, x, z, r);
  if (!bouCheminLibre(e)) { e.meubles.pop(); e.idMeuble--; return { ok: false, raison: 'chemin' }; }
  e.caisse = bouArrondi(e.caisse - M.prix); e.compte.meubles += M.prix;
  return { ok: true, meuble: m };
}
function bouDeplacer(e, id, x, z, r) {
  const m = e.meubles.find(q => q.id === id); if (!m || e.phase !== 'lundi') return false;
  if (!bouPlaceLibre(e, m.type, x, z, r, m)) return false;
  const avant = [m.x, m.z, m.r]; Object.assign(m, { x, z, r });
  if (!bouCheminLibre(e)) { [m.x, m.z, m.r] = avant; return false; }
  return true;
}
// revendre un meuble à moitié prix ; les cartes de ses places reviennent dans la réserve
function bouVendreMeuble(e, id) {
  const i = e.meubles.findIndex(q => q.id === id), m = e.meubles[i];
  if (!m || BOU_MEUBLES[m.type].unique || e.phase !== 'lundi') return false;
  for (const p of e.vitrines[id] || []) if (p) e.reserve[p.id] = (e.reserve[p.id] || 0) + 1;
  delete e.vitrines[id];
  e.meubles.splice(i, 1);
  const rend = Math.floor(BOU_MEUBLES[m.type].prix / 2);
  e.caisse = bouArrondi(e.caisse + rend); e.compte.meubles -= rend;
  return true;
}
function bouAgrandir(e) {
  const T = BOU_TAILLES[e.niveau + 1];
  if (!T || e.phase !== 'lundi' || T.prix > e.caisse) return false;
  e.caisse = bouArrondi(e.caisse - T.prix); e.compte.meubles += T.prix; e.niveau++;
  return true;
}
// l'attrait de la boutique : chaque meuble en donne ; les décorations du même genre comptent de moins en moins
function bouAttrait(e) {
  const vus = {}; let a = 0;
  for (const m of e.meubles) {
    const M = BOU_MEUBLES[m.type], k = vus[m.type] = (vus[m.type] || 0) + 1;
    a += M.deco ? M.attrait / (1 + (k - 1) * 0.5) : M.attrait;
  }
  return Math.round(a * 10) / 10;
}
const bouNb = (e, type) => e.meubles.filter(m => m.type === type).length;

/* ---------- le prêt ---------- */
function bouRembourser(e, montant) {
  montant = bouArrondi(Math.min(montant, e.pret, e.caisse));
  if (!(montant > 0)) return 0;
  e.caisse = bouArrondi(e.caisse - montant); e.pret = bouArrondi(e.pret - montant);
  return montant;
}

/* ---------- le tournoi ---------- */
function bouTournoi(e, reglage) {
  if (e.phase !== 'lundi') return false;
  Object.assign(e.tournoi, reglage);
  e.tournoi.frais = Math.max(0, Math.min(5, Math.round(e.tournoi.frais)));
  e.tournoi.lots = Math.max(0, Math.min(24, Math.round(e.tournoi.lots)));
  return true;
}

/* ---------- la semaine ---------- */
// lundi → mardi : les clients de la semaine sont prévus (nombre par jour, rencontres)
function bouOuvrirBoutique(e) {
  if (e.phase !== 'lundi' || e.fin) return false;
  e.phase = 'semaine'; e.jour = 0;
  e.plan = bouPlanSemaine(e);
  return true;
}
// un jour de vente : la liste des visites (à rejouer en 3D), le tournoi le samedi ; une rencontre arrête le temps
function bouJour(e) {
  if (e.phase !== 'semaine' || e.rencontre) return null;
  const j = e.jour, R = bouRng(e.graine, 'jour', e.semaine, j), visites = [];
  for (let k = 0; k < e.plan.clients[j]; k++) visites.push(bouVisite(e, R, j));
  const res = { jour: j, nom: BOU_JOURS[j], visites };
  if (j === 4) res.tournoi = bouJouerTournoi(e);
  const r = e.plan.rencontres.find(x => x.jour === j);
  if (r) { e.rencontre = bouPreparerRencontre(e, r.type, bouRng(e.graine, 'rencontre', e.semaine, j)); if (e.rencontre) res.rencontre = e.rencontre; }
  e.jour++;
  if (e.jour >= BOU_JOURS.length) e.phase = 'dimanche';
  return res;
}
// le dimanche : arcade, loyer, cotes, événement de la semaine prochaine, prêt, faillite, livraison ; puis lundi
function bouDimanche(e) {
  if (e.phase !== 'dimanche' || e.rencontre) return null;
  const T = bouTaille(e), b = { semaine: e.semaine, compte: e.compte, cotes: {} };
  const arcade = bouNb(e, 'arcade') * BOU_MEUBLES.arcade.revenu;
  e.caisse = bouArrondi(e.caisse + arcade - T.loyer); e.compte.arcade = arcade; e.compte.loyer = T.loyer;
  // les cotes des cartes qu'on a (pour les flèches du bilan)
  const avant = {}; for (const id of bouCartesPossedees(e)) avant[id] = bouCote(e, id);
  bouBougerCotes(e);
  if (e.tournoiRes) { bouEffetTournoi(e, e.tournoiRes); e.tournoiRes = null; }
  bouFinEvenement(e);
  for (const id in avant) { const v = bouCote(e, id); if (Math.abs(v - avant[id]) >= 0.01) b.cotes[id] = [avant[id], v]; }
  e.reputation = Math.max(0, Math.min(100, Math.round(e.reputation * 0.97 * 100) / 100));   // on oublie un peu chaque semaine
  // le prêt à la semaine 26
  if (e.semaine === BOU_ECHEANCE && e.pret > 0) {
    const du = bouArrondi(e.pret * (1 + BOU_INTERET));
    if (e.caisse >= du) { e.caisse = bouArrondi(e.caisse - du); b.banque = du; e.pret = 0; }
    else return bouTerminer(e, 'faillite', b);
  }
  e.sousZero = e.caisse < 0 ? e.sousZero + 1 : 0;
  if (e.sousZero >= 2) return bouTerminer(e, 'faillite', b);
  b.caisse = e.caisse; b.valeur = bouValeur(e); b.reputation = e.reputation;
  if (e.semaine >= BOU_SEMAINES) return bouTerminer(e, 'annee', b);
  // semaine suivante
  e.semaine++; e.phase = 'lundi'; e.plan = null; e.jour = 0;
  e.evenement = e.prochain; e.prochain = bouTirerEvenement(e, e.semaine + 1);
  for (const X of bouCatalogue(e.graine).extensions) if (X.sortie === e.semaine) bouSortirExtension(e, X.n);
  if (e.evenement) bouDebutEvenement(e);
  e.commandes = [];   // la commande du lundi ne s'annule plus
  b.evenement = e.evenement; b.prochain = e.prochain;
  bouNouveauCompte(e);
  return b;
}
function bouTerminer(e, raison, b) {
  const v = bouValeur(e);
  e.fin = { raison, semaine: e.semaine, valeur: v, score: raison === 'faillite' ? Math.max(0, Math.floor(v / 2)) : Math.max(0, Math.floor(v)) };
  e.phase = 'fin'; b.fin = e.fin;
  return b;
}
// toutes les cartes qu'on a (réserve, vitrines, classeur), sans doublon
function bouCartesPossedees(e) {
  const s = new Set(Object.keys(e.reserve).concat(Object.keys(e.classeur)));
  for (const k in e.vitrines) for (const p of e.vitrines[k]) if (p) s.add(p.id);
  return [...s];
}
// la valeur de la boutique (le score) : § 2
function bouValeur(e) {
  let v = e.caisse;
  for (const c in e.stock) v += e.stock[c] * bouArticle(c).achat;
  for (const id in e.reserve) v += e.reserve[id] * bouCote(e, id);
  for (const id in e.classeur) v += bouCote(e, id);
  for (const k in e.vitrines) for (const p of e.vitrines[k]) if (p) v += bouCote(e, p.id);
  for (const m of e.meubles) v += Math.floor(BOU_MEUBLES[m.type].prix / 2);
  for (let n = 1; n <= e.niveau; n++) v += BOU_TAILLES[n].prix / 2;
  v += e.complets.length * BOU_BONUS_CLASSEUR;
  v -= e.pret;
  return Math.round(v);
}

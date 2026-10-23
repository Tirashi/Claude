/* =====================================================================
   LA BOUTIQUE DE CARTES · le jeu de cartes inventé « CRÉATURES »
   (logique pure, sans affichage) : les 5 extensions de l'année, leurs
   40 cartes tirées à la graine, les boosters, les cotes.
   Chargé après monstres.js et regles.js (bouRng, bouEntre…).
   Cahier des charges : specs/boutique-de-cartes.md § 4.
   ===================================================================== */
'use strict';
const BOU_ELEMENTS = ['FEU', 'EAU', 'PLANTE', 'FOUDRE', 'OMBRE'];
// cote de départ (avant le tirage × 0,7 à 1,4) et nombre de cartes de chaque rareté dans une extension
const BOU_RARETES = [
  { n: 'COMMUNE', base: 0.2, nb: 20, atk: [1, 3], pv: [2, 4] },
  { n: 'PEU COMMUNE', base: 0.5, nb: 10, atk: [2, 4], pv: [3, 6] },
  { n: 'RARE', base: 1.5, nb: 6, atk: [3, 6], pv: [5, 8] },
  { n: 'ÉPIQUE', base: 6, nb: 3, atk: [5, 8], pv: [7, 10] },
  { n: 'LÉGENDAIRE', base: 40, nb: 1, atk: [8, 10], pv: [10, 13] },
];
const BOU_NB_CARTES = 40;
// une extension tous les 10 semaines ; son élément vedette a plus de cartes et sa légendaire
const BOU_EXTENSIONS = [
  { nom: 'VOLCANS ROUGES', theme: 'FEU', sortie: 1 },
  { nom: 'ABYSSES', theme: 'EAU', sortie: 11 },
  { nom: 'FORÊT ANCIENNE', theme: 'PLANTE', sortie: 21 },
  { nom: 'CIEL D\'ORAGE', theme: 'FOUDRE', sortie: 31 },
  { nom: 'NUIT ÉTERNELLE', theme: 'OMBRE', sortie: 41 },
];
const BOU_COMMANDABLE = 20;   // les boosters d'une extension se commandent 20 semaines après sa sortie (et la semaine d'avant)
const BOU_DEBUTS = {
  FEU: ['Flam', 'Brais', 'Pyr', 'Cendr', 'Tison', 'Ignis', 'Fourn', 'Brul', 'Lav', 'Scor'],
  EAU: ['Aqu', 'Ond', 'Marin', 'Goutt', 'Bulb', 'Hydr', 'Coral', 'Glac', 'Neig', 'Ecum'],
  PLANTE: ['Mouss', 'Feuill', 'Sylv', 'Ronc', 'Gland', 'Bourg', 'Lier', 'Pétal', 'Champ', 'Racin'],
  FOUDRE: ['Volt', 'Zap', 'Eclair', 'Statik', 'Orag', 'Fulgur', 'Tonn', 'Zing', 'Ion', 'Ampér'],
  OMBRE: ['Nyx', 'Ombr', 'Spectr', 'Brum', 'Noct', 'Lun', 'Fantom', 'Murmur', 'Obscur', 'Crép'],
};
const BOU_FINS = ['on', 'ix', 'aurus', 'ette', 'ard', 'elle', 'o', 'ax', 'in', 'ou', 'yx', 'ine', 'os', 'ak', 'ia'];

/* ---------- le catalogue de l'année (toutes les extensions, tirées une fois par graine) ---------- */
const bouCatalogues = {};
function bouCatalogue(graine) {
  if (bouCatalogues[graine]) return bouCatalogues[graine];
  // chaque élément parcourt ses 30 monstres dans un ordre tiré une fois : ils se répètent le moins possible
  const ordre = {}, pos = {};
  for (const el of BOU_ELEMENTS) {
    ordre[el] = bouMelanger(bouRng(graine, 'monstres', el), BOU_MONSTRES.map((m, i) => i).filter(i => BOU_MONSTRES[i].el === el && !BOU_MONSTRES[i].leg));
    pos[el] = 0;
  }
  const noms = new Set(), cartes = {}, extensions = [];
  BOU_EXTENSIONS.forEach((X, k) => {
    const n = k + 1, R = bouRng(graine, 'extension', n);
    // 39 cartes hors légendaire : 11 de l'élément vedette, 7 de chacun des autres
    const els = [];
    for (const el of BOU_ELEMENTS) for (let i = 0; i < (el === X.theme ? 11 : 7); i++) els.push(el);
    bouMelanger(R, els);
    const liste = [];
    let num = 1;
    BOU_RARETES.forEach((Ra, rar) => {
      for (let i = 0; i < Ra.nb; i++) {
        const el = rar === 4 ? X.theme : els.pop();
        const monstre = rar === 4 ? BOU_MONSTRES.findIndex(m => m.leg && m.el === X.theme) : ordre[el][pos[el]++ % ordre[el].length];
        let nom;
        do nom = (bouChoix(R, BOU_DEBUTS[el]) + bouChoix(R, BOU_FINS)).toUpperCase(); while (noms.has(nom));
        noms.add(nom);
        const c = { id: n + '-' + num, ext: n, num, nom, el, rar, monstre, atk: bouEntre(R, ...Ra.atk), pv: bouEntre(R, ...Ra.pv),
          base: Math.round(Ra.base * (0.7 + R() * 0.7) * 100) / 100 };
        cartes[c.id] = c; liste.push(c.id); num++;
      }
    });
    extensions.push({ n, nom: X.nom, theme: X.theme, sortie: X.sortie, cartes: liste });
  });
  return (bouCatalogues[graine] = { extensions, cartes });
}
const bouCarte = (etat, id) => bouCatalogue(etat.graine).cartes[id];
const bouExtension = (etat, n) => bouCatalogue(etat.graine).extensions[n - 1];
// extensions sorties à la semaine en cours
const bouSorties = etat => bouCatalogue(etat.graine).extensions.filter(x => x.sortie <= etat.semaine);
const bouDerniere = etat => bouSorties(etat).slice(-1)[0];
// on peut commander les boosters d'une extension la semaine d'avant sa sortie (précommande) et 20 semaines après, ou pendant une réédition
function bouCommandable(etat, n) {
  const X = bouExtension(etat, n);
  if (!X) return false;
  if (etat.reedition && etat.reedition.ext === n && etat.semaine <= etat.reedition.fin) return true;
  return etat.semaine >= X.sortie - 1 && etat.semaine < X.sortie + BOU_COMMANDABLE;
}

/* ---------- cotes ---------- */
// cote = cote de départ × mode de l'élément × popularité de la carte × âge (les cartes qu'on ne trouve plus prennent de la valeur)
function bouAge(etat, c) {
  const X = bouExtension(etat, c.ext), fin = X.sortie + BOU_COMMANDABLE;
  if (etat.semaine < fin || (etat.reedition && etat.reedition.ext === c.ext)) return 1;
  const w = etat.semaine - fin;
  return c.rar >= 2 ? Math.min(1.6, 1 + 0.012 * w) : Math.min(1.2, 1 + 0.004 * w);
}
function bouCote(etat, id) {
  const c = bouCarte(etat, id);
  const v = c.base * (etat.meta[c.el] || 1) * (etat.pop[id] || 1) * bouAge(etat, c);
  return Math.max(0.1, Math.round(v * 100) / 100);
}
// les cartes d'une extension qui sort prennent leur cote ; la mode de son élément monte un peu
function bouSortirExtension(etat, n) {
  const X = bouExtension(etat, n);
  for (const id of X.cartes) if (etat.pop[id] === undefined) etat.pop[id] = 1;
  etat.meta[X.theme] = Math.min(1.6, (etat.meta[X.theme] || 1) * 1.12);
}
// le dimanche : la mode des éléments et la popularité de chaque carte bougent un peu
function bouBougerCotes(etat) {
  const R = bouRng(etat.graine, 'cotes', etat.semaine), vedette = bouDerniere(etat).theme;
  for (const el of BOU_ELEMENTS) {
    let m = (etat.meta[el] || 1) * Math.exp((R() - 0.5) * 0.08);
    m += ((el === vedette ? 1.15 : 1) - m) * 0.04;   // revient doucement vers 1 (1,15 pour l'élément de la dernière extension)
    etat.meta[el] = Math.round(Math.min(1.6, Math.max(0.7, m)) * 1000) / 1000;
  }
  for (const id in etat.pop) {
    let p = etat.pop[id] * Math.exp((R() - 0.5) * 0.06);
    p += (1 - p) * 0.03;
    etat.pop[id] = Math.round(Math.min(4, Math.max(0.25, p)) * 1000) / 1000;
  }
}

/* ---------- boosters et coffrets ---------- */
// 3 communes, 1 peu commune, 1 rare ou mieux (épique 1 fois sur 5, légendaire 1 fois sur 40)
function bouTirerBooster(etat, n) {
  const X = bouExtension(etat, n), R = bouRng(etat.graine, 'booster', etat.ouverts++);
  const de = (debut, nb) => X.cartes[debut + Math.floor(R() * nb)];
  const r = R(), haut = r < 1 / 40 ? X.cartes[39] : r < 1 / 40 + 1 / 5 ? de(36, 3) : de(30, 6);
  return [de(0, 20), de(0, 20), de(0, 20), de(20, 10), haut];
}
// un coffret : 2 boosters et une carte promo (une rare de l'extension)
function bouTirerCoffret(etat, n) {
  const X = bouExtension(etat, n), R = bouRng(etat.graine, 'coffret', etat.ouverts++);
  return bouTirerBooster(etat, n).concat(bouTirerBooster(etat, n), [X.cartes[30 + Math.floor(R() * 6)]]);
}

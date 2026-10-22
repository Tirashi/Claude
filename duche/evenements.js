/* =====================================================================
   DUCHÉ · les ÉVÉNEMENTS (logique pure ; chargé après regles.js).
   Paquet de 13 cartes mélangé par la graine, sans répétition avant
   épuisement ; à chaque tirage on regarde les 3 cartes possibles du
   dessus et on prend la plus adaptée à la situation (poids). « Le roi
   est mort » est hors paquet, toujours au tour 11. Environ 2 tours sur
   3 ont un événement (aucun au tour 1).
   L'événement en cours est gardé dans l'état : { id, d } (d = ce qui a
   été tiré : rival, terre, nombre de révoltés…), pour que la sauvegarde
   le rende tel quel.
   ===================================================================== */
'use strict';
const ducPlaines = etat => etat.terres.filter(t => t.prop === 0 && t.t === 'plaine').length;
const ducRivauxLibres = etat => [1, 2, 3].filter(r => etat.seigneurs[r].vivant && !etat.alliances[r]);
// terre du joueur la plus éloignée de son château (pas le château)
function ducPlusLoin(etat) {
  const c = etat.seigneurs[0].chateau;
  let best = -1;
  for (const i of ducTerresDe(etat, 0)) if (i !== c && (best < 0 || ducDist(i, c) > ducDist(best, c))) best = i;
  return best;
}
// soldats qui peuvent réprimer une révolte sur la terre i : sa garnison et celles des terres voisines à soi
const ducRepresseurs = (etat, i) => [i].concat(DUC_VOISINS[i]).filter(v => etat.terres[v].prop === 0);
const ducMenace = (etat, s) => {   // soldats ennemis collés au territoire de s
  let n = 0;
  etat.terres.forEach((t, i) => { if (t.prop >= 0 && t.prop !== s && !ducAllies(etat, s, t.prop) && DUC_VOISINS[i].some(v => etat.terres[v].prop === s)) n += t.gar; });
  return n;
};

// choix : [{ k, txt, detail, ok }] ; rep(etat, d, k, R, mise) applique et rend le message
const DUC_EVENEMENTS = {
  recolte: {
    titre: 'Mauvaise récolte', texte: 'La pluie a pourri les blés. Les greniers se vident.',
    choix: (e) => [
      { k: 'perdre', txt: 'Rationner', detail: `−${Math.floor(e.seigneurs[0].nour * 0.3)} nourriture`, ok: true },
      { k: 'payer', txt: 'Acheter du grain', detail: '−10 or', ok: e.seigneurs[0].or >= 10 },
    ],
    rep: (e, d, k) => { const J = e.seigneurs[0]; if (k === 'payer') { J.or -= 10; return 'Le grain arrive de la ville.'; } J.nour -= Math.floor(J.nour * 0.3); return 'On serre la ceinture.'; },
  },
  revolte: {
    titre: 'Révolte paysanne', texte: 'Des paysans en colère prennent les fourches.',
    cond: e => e.seigneurs[0].leg < 30 && ducPlusLoin(e) >= 0, poids: () => 3,
    prep: (e, R) => ({ terre: ducPlusLoin(e), n: ducEntre(R, 3, 6) }),
    choix: (e, d) => {
      const F = ducRepresseurs(e, d.terre).reduce((a, i) => a + e.terres[i].gar, 0);
      return [
        { k: 'payer', txt: 'Apaiser', detail: '−20 or', ok: e.seigneurs[0].or >= 20 },
        { k: 'ceder', txt: 'Céder la terre', detail: 'la terre la plus éloignée devient neutre', ok: e.terres[d.terre].prop === 0 },
        { k: 'reprimer', txt: 'Réprimer', detail: `${d.n} révoltés · chance ${Math.round(ducChance(F, d.n) * 100)} %`, ok: F > 0 },
      ];
    },
    rep: (e, d, k, R) => {
      const J = e.seigneurs[0], t = e.terres[d.terre];
      if (k === 'payer') { J.or -= 20; return 'Les paysans rentrent chez eux.'; }
      if (k === 'ceder') {
        e.terres[J.chateau].gar += t.gar;
        Object.assign(t, { prop: -1, gar: d.n, pret: 0, brig: true });
        e.stats.perdues++;
        return 'La terre se donne aux révoltés ; vos soldats rentrent au château.';
      }
      const qui = ducRepresseurs(e, d.terre), F = qui.reduce((a, i) => a + e.terres[i].gar, 0), gagne = R() < ducChance(F, d.n);
      let pertes = Math.min(F, gagne ? Math.round(d.n * 0.5) : d.n);
      for (const i of qui) { const p = Math.min(pertes, e.terres[i].gar); e.terres[i].gar -= p; e.terres[i].pret = Math.min(e.terres[i].pret, e.terres[i].gar); pertes -= p; }
      if (gagne) return 'La révolte est écrasée.';
      J.leg = Math.max(0, J.leg - 15);
      return 'La répression échoue : −15 légitimité.';
    },
  },
  brigands: {
    titre: 'Brigands', texte: 'Une bande de brigands rôde près de vos terres.',
    cond: e => e.terres.some((t, i) => t.prop < 0 && DUC_VOISINS[i].some(v => e.terres[v].prop === 0)),
    prep: (e, R) => { const l = e.terres.map((t, i) => i).filter(i => e.terres[i].prop < 0 && DUC_VOISINS[i].some(v => e.terres[v].prop === 0)); return { terre: l[Math.floor(R() * l.length)] }; },
    choix: (e) => [
      { k: 'laisser', txt: 'Les laisser', detail: '+4 brigands sur une terre voisine', ok: true },
      { k: 'payer', txt: 'Les payer pour partir', detail: '−10 or', ok: e.seigneurs[0].or >= 10 },
    ],
    rep: (e, d, k) => {
      if (k === 'payer') { e.seigneurs[0].or -= 10; return 'Les brigands s\'en vont plus loin.'; }
      const t = e.terres[d.terre];
      if (t.prop < 0) { t.gar += 4; t.brig = true; }
      return 'Les brigands s\'installent à vos portes.';
    },
  },
  alliance: {
    titre: 'Offre d\'alliance', texte: 'Un seigneur voisin vous tend la main.',
    cond: e => ducRivauxLibres(e).length > 0, poids: e => (ducMenace(e, 0) >= 6 ? 2 : 1),
    prep: (e, R) => { const l = ducRivauxLibres(e); return { r: l[Math.floor(R() * l.length)] }; },
    choix: (e, d) => [
      { k: 'accepter', txt: 'Accepter', detail: `+2 légitimité, paix 10 tours avec ${e.seigneurs[d.r].nom}`, ok: true },
      { k: 'refuser', txt: 'Refuser', detail: 'rien', ok: true },
    ],
    rep: (e, d, k) => {
      if (k !== 'accepter' || !e.seigneurs[d.r].vivant) return 'Vous déclinez poliment.';
      e.alliances[d.r] = { fin: e.tour + 9, forte: false };
      e.seigneurs[0].leg = Math.min(100, e.seigneurs[0].leg + 2);
      return `Alliance conclue avec ${e.seigneurs[d.r].nom}.`;
    },
  },
  tournoi: {
    titre: 'Tournoi', texte: 'Un grand tournoi s\'ouvre. La gloire attend vos champions.',
    poids: e => (ducSoldats(e, 0) >= 8 ? 2 : 1),
    choix: (e, d, mise) => {
      const ms = Math.max(2, Math.min(6, mise && mise.soldats || 4)), mo = Math.max(10, Math.min(30, mise && mise.or || 20));
      return [
        { k: 'soldats', txt: `Miser ${ms} soldats`, detail: `chance ${Math.round((0.25 + 0.1 * ms) * 100)} % · +10 légitimité`, ok: ducSoldats(e, 0) > ms, mise: ms },
        { k: 'or', txt: `Miser ${mo} or`, detail: `chance ${Math.round((0.25 + 0.02 * mo) * 100)} % · +10 légitimité`, ok: e.seigneurs[0].or >= mo, mise: mo },
        { k: 'non', txt: 'Rester au château', detail: 'rien', ok: true },
      ];
    },
    rep: (e, d, k, R, c) => {
      if (k === 'non') return 'Vous regardez depuis la tribune.';
      const J = e.seigneurs[0], chance = k === 'soldats' ? 0.25 + 0.1 * c.mise : 0.25 + 0.02 * c.mise;
      if (R() < chance) { J.leg = Math.min(100, J.leg + 10); return 'Vos champions triomphent : +10 légitimité !'; }
      if (k === 'soldats') ducRetirerSoldats(e, 0, c.mise); else J.or -= c.mise;
      return k === 'soldats' ? `Défaite au tournoi : ${c.mise} soldats blessés.` : `Défaite au tournoi : ${c.mise} or perdus.`;
    },
  },
  relique: {
    titre: 'Relique', texte: 'Des moines vous apportent une relique sainte.',
    choix: () => [
      { k: 'vendre', txt: 'La vendre', detail: '+25 or', ok: true },
      { k: 'exposer', txt: 'L\'exposer', detail: '+5 légitimité', ok: true },
    ],
    rep: (e, d, k) => { const J = e.seigneurs[0]; if (k === 'vendre') { J.or += 25; return 'La relique part chez un riche marchand.'; } J.leg = Math.min(100, J.leg + 5); return 'Les fidèles affluent.'; },
  },
  impot: {
    titre: 'Impôt royal', texte: 'Le collecteur du roi frappe à la porte.',
    cond: e => e.tour < DUC_TOUR_ROI,
    choix: (e) => [
      { k: 'payer', txt: 'Payer', detail: '−15 or', ok: e.seigneurs[0].or >= 15 },
      { k: 'refuser', txt: 'Refuser', detail: '−5 légitimité', ok: true },
    ],
    rep: (e, d, k) => { const J = e.seigneurs[0]; if (k === 'payer') { J.or -= 15; return 'Le roi est satisfait.'; } J.leg = Math.max(0, J.leg - 5); return 'La cour murmure contre vous.'; },
  },
  belle: {
    titre: 'Belle récolte', texte: 'Les blés sont lourds et dorés cette année.',
    cond: e => ducPlaines(e) >= 4, poids: e => (e.seigneurs[0].nour < 10 ? 3 : 1),
    choix: (e) => [
      { k: 'stocker', txt: 'Remplir les greniers', detail: `+${2 * ducPlaines(e)} nourriture`, ok: true },
      { k: 'fete', txt: 'Faire la fête', detail: `+${ducPlaines(e)} nourriture, +3 légitimité`, ok: true },
    ],
    rep: (e, d, k) => { const J = e.seigneurs[0], p = ducPlaines(e); if (k === 'fete') { J.nour += p; J.leg = Math.min(100, J.leg + 3); return 'On danse dans les villages.'; } J.nour += 2 * p; return 'Les greniers débordent.'; },
  },
  marchand: {
    titre: 'Marchand ambulant', texte: 'Un marchand propose ses affaires, aujourd\'hui seulement.',
    cond: e => e.seigneurs[0].bois >= 3 || e.seigneurs[0].or >= 1,
    choix: (e) => {
      const J = e.seigneurs[0], kb = Math.min(3, Math.floor(J.bois / 3)), ko = Math.min(3, J.or);
      return [
        { k: 'vendre', txt: 'Vendre du bois', detail: `${3 * kb} bois → ${2 * kb} or`, ok: kb > 0 },
        { k: 'acheter', txt: 'Acheter du bois', detail: `${ko} or → ${3 * ko} bois`, ok: ko > 0 },
        { k: 'non', txt: 'Passer son chemin', detail: 'rien', ok: true },
      ];
    },
    rep: (e, d, k) => {
      const J = e.seigneurs[0];
      if (k === 'vendre') { const kb = Math.min(3, Math.floor(J.bois / 3)); J.bois -= 3 * kb; J.or += 2 * kb; return 'Affaire conclue.'; }
      if (k === 'acheter') { const ko = Math.min(3, J.or); J.or -= ko; J.bois += 3 * ko; return 'Affaire conclue.'; }
      return 'Le marchand s\'éloigne.';
    },
  },
  mariage: {
    titre: 'Mariage', texte: 'Un seigneur demande la main de votre fille.',
    cond: e => ducRivauxLibres(e).length > 0,
    prep: (e, R) => { const l = ducRivauxLibres(e); return { r: l[Math.floor(R() * l.length)] }; },
    choix: (e, d) => [
      { k: 'marier', txt: 'Accepter', detail: `+5 légitimité, alliance sûre 15 tours avec ${e.seigneurs[d.r].nom}`, ok: true },
      { k: 'refuser', txt: 'Refuser', detail: '+2 légitimité', ok: true },
    ],
    rep: (e, d, k) => {
      const J = e.seigneurs[0];
      if (k !== 'marier' || !e.seigneurs[d.r].vivant) { J.leg = Math.min(100, J.leg + 2); return 'Votre fille reste au château.'; }
      e.alliances[d.r] = { fin: e.tour + 14, forte: true };
      J.leg = Math.min(100, J.leg + 5);
      return `Noces avec la maison de ${e.seigneurs[d.r].nom}.`;
    },
  },
  hiver: {
    titre: 'Hiver précoce', texte: 'La neige tombe avant l\'heure sur les champs.',
    choix: (e) => [
      { k: 'subir', txt: 'Attendre le printemps', detail: 'nourriture −50 % pendant 2 tours', ok: true },
      { k: 'bruler', txt: 'Chauffer les granges', detail: '−15 bois, nourriture −25 % pendant 2 tours', ok: e.seigneurs[0].bois >= 15 },
    ],
    rep: (e, d, k) => {
      const J = e.seigneurs[0];
      J.hiver = 2; J.hiverPct = k === 'bruler' ? 0.75 : 0.5;
      if (k === 'bruler') J.bois -= 15;
      return 'L\'hiver sera long.';
    },
  },
  pelerins: {
    titre: 'Pèlerins', texte: 'Des pèlerins demandent le gîte en route vers la chapelle.',
    choix: (e) => [
      { k: 'loger', txt: 'Les loger', detail: '−5 nourriture, +5 légitimité', ok: e.seigneurs[0].nour >= 5 },
      { k: 'fermer', txt: 'Fermer les portes', detail: 'rien', ok: true },
    ],
    rep: (e, d, k) => { const J = e.seigneurs[0]; if (k === 'loger') { J.nour -= 5; J.leg = Math.min(100, J.leg + 5); return 'Les pèlerins chantent vos louanges.'; } return 'Les pèlerins passent leur chemin.'; },
  },
  mercenaires: {
    titre: 'Mercenaires', texte: 'Une compagnie de mercenaires offre ses lames.',
    poids: e => (ducMenace(e, 0) >= 6 ? 2 : 1),
    choix: (e) => [
      { k: 'engager', txt: 'Les engager', detail: '−20 or, +5 soldats au château pour 5 tours (hors plafond)', ok: e.seigneurs[0].or >= 20 && !(e.seigneurs[0].mercFin > e.tour) },
      { k: 'non', txt: 'Les renvoyer', detail: 'rien', ok: true },
    ],
    rep: (e, d, k) => {
      if (k !== 'engager') return 'Les mercenaires vont voir ailleurs.';
      const J = e.seigneurs[0];
      J.or -= 20; J.mercN = 5; J.mercFin = e.tour + 5; e.terres[J.chateau].gar += 5;
      return 'Cinq lames de plus au château.';
    },
  },
  roi: {
    titre: 'Le roi est mort', texte: 'Le roi est mort sans héritier. Les neuf grands électeurs choisiront le plus légitime des seigneurs : un vote à chaque saison, cinq votes font un roi.',
    choix: () => [{ k: 'ok', txt: 'Que la course commence', detail: '', ok: true }],
    rep: (e) => { e.roiMort = true; return 'La course à la couronne est ouverte.'; },
  },
};
const DUC_PAQUET = Object.keys(DUC_EVENEMENTS).filter(k => k !== 'roi');

// tire l'événement du tour (ou null) ; appelé par ducDebutTour, après les revenus
function ducTirerEvenement(etat) {
  if (etat.tour === DUC_TOUR_ROI && !etat.roiMort) return { id: 'roi', d: {} };
  if (etat.tour === 1 || ducRng(etat.graine, 'evenement', etat.tour, 0)() >= 2 / 3) return null;
  const possible = id => { const E = DUC_EVENEMENTS[id]; return !E.cond || E.cond(etat); };
  for (let essai = 0; essai < 2; essai++) {
    const vus = [];
    for (let j = 0; j < etat.paquet.length && vus.length < 3; j++) if (possible(etat.paquet[j])) vus.push(j);
    if (vus.length) {
      let best = vus[0], bp = -1;
      for (const j of vus) { const E = DUC_EVENEMENTS[etat.paquet[j]], p = E.poids ? E.poids(etat) : 1; if (p > bp) { bp = p; best = j; } }
      const id = etat.paquet.splice(best, 1)[0], E = DUC_EVENEMENTS[id];
      return { id, d: E.prep ? E.prep(etat, ducRng(etat.graine, 'evenement', etat.tour, 1)) : {} };
    }
    // plus rien de possible dans le paquet : nouveau paquet mélangé
    etat.paquet = ducMelanger(ducRng(etat.graine, 'paquet', etat.cycle++), DUC_PAQUET.slice());
  }
  return null;
}

const ducChoix = (etat, mise) => (etat.evt ? DUC_EVENEMENTS[etat.evt.id].choix(etat, etat.evt.d, mise) : []);
// répond à l'événement en cours ; mise : { soldats, or } pour le tournoi
function ducRepondre(etat, k, mise) {
  if (!etat.evt || etat.fin) return { ok: false, raison: 'Pas d\'événement.' };
  const E = DUC_EVENEMENTS[etat.evt.id], c = E.choix(etat, etat.evt.d, mise).find(x => x.k === k);
  if (!c || !c.ok) return { ok: false, raison: 'Ce choix n\'est pas possible.' };
  const msg = E.rep(etat, etat.evt.d, k, ducRng(etat.graine, 'evenement', etat.tour, 2), c);
  ducNoter(etat, `${E.titre} : ${msg}`, 0);
  etat.evt = null;
  const J = etat.seigneurs[0];
  if (J.leg > etat.stats.picLeg) etat.stats.picLeg = J.leg;
  ducVerifier(etat);
  return { ok: true, msg };
}

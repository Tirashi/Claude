/* Politique : joueurs automatiques (bots) du simulateur (M4, specs/politique/plan-simulateur.md).
   creer(nom, graine) → bot(etat) → liste d'actions du tour. Un bot ne choisit que dans Tour.actionsDisponibles :
   il compose son tour action par action sur une copie (plan), chaque action vérifiée sur l'état laissé par la précédente.
   Les nations de l'ordinateur suivent le persona de leur dirigeant (moteur ; donnees/personas.js) : un bot ne le lit pas. */
'use strict';
const path = require('path');
const INS = require(path.join(__dirname, '..', 'politique', 'donnees', 'institutions.js'));
const P = f => require(path.join(__dirname, '..', 'politique', f));
const Lois = P('moteur/lois.js'), Alea = P('moteur/alea.js'), Etat = P('moteur/etat.js'), Tour = P('moteur/tour.js'), Guerre = P('moteur/guerre.js'), Batiments = P('moteur/batiments.js');
const { LOIS } = P('donnees/lois.js');
const BAT = P('donnees/batiments.js'), ECO = P('donnees/economie.js');

const FACTIONS = ['ouvriers', 'paysans', 'artisans', 'patrons'];

// une bataille a une issue au hasard : elle n'est pas jouée sur la copie et passe en dernier dans le tour
// (sinon une action suivante pourrait compter sur une victoire, par exemple recruter dans une région libérée)
function plan(e){
  // même état du hasard que le moteur : une action qui tire au hasard (déclarer une guerre) donne le même résultat
  const tmp = Etat.copie(e), liste = [], r = { s: tmp.alea };
  let bataille = null;
  return {
    e: tmp,
    // la bataille gardée pour la fin n'est jouée que si elle reste possible (une paix a pu finir la guerre entre-temps)
    get acts(){ return bataille && this.peut(bataille) ? liste.concat([bataille]) : liste; },
    peut: a => Tour.actionsDisponibles(tmp).some(d => Tour.memeAction(a, d)),
    essayer(a){
      if (!this.peut(a)) return false;
      if (a.type === 'bataille'){ if (bataille) return false; bataille = a; return true; }
      Tour.appliquerAction(tmp, a, r); liste.push(a); return true;
    }
  };
}

// --- réflexes communs ---
// guerre : imposer la paix si l'ennemi capitule, paix blanche si possible, bataille si nos chances ≥ seuil
function guerre(p, o){
  const g = p.e.guerre;
  if (!g) return;
  if (g.capitulation === 'ennemi'){
    p.essayer({ type: 'imposer_paix', reparations: true, lever_embargo: !!o.leverEmbargo, non_rearmement: true, cession: true })
      || p.essayer({ type: 'imposer_paix', reparations: true, lever_embargo: !!o.leverEmbargo, non_rearmement: true, cession: false });
    return;
  }
  if (o.paixBlanche !== false && p.essayer({ type: 'paix_blanche' })) return;
  if (o.embargoEnGuerre) for (const n of g.ennemis) p.essayer({ type: 'embargo', id: n });
  if (o.seuilBataille == null) return;
  // la cible : d'abord une de nos régions occupées, sinon une région ennemie ; seulement si nos chances suffisent
  const nous = ['joueur'].concat(g.allies), fa = Guerre.forceCamp(p.e, nous);
  const cibles = Tour.actionsDisponibles(p.e).filter(a => a.type === 'bataille')
    .sort((a, b) => (p.e.regions[b.cible] ? 1 : 0) - (p.e.regions[a.cible] ? 1 : 0));
  for (const a of cibles){
    const fd = Guerre.forceCamp(p.e, g.ennemis, a.cible);
    if (fa + fd > 0 && fa / (fa + fd) >= o.seuilBataille){ p.essayer(a); break; }
  }
}
// l'armée : recruter tant que notre force reste sous ratio × la force de la nation la plus forte qui n'est pas notre alliée
// (les personas sont cachés : un bot ne sait pas qui est belliqueux)
function armee(p, ratio, reserve){
  const e = p.e, menaces = Object.keys(e.nations).filter(n => !e.traites.some(t => t.type === 'defense_mutuelle' && t.avec === n));
  const cible = ratio * Math.max(0, ...menaces.map(n => Guerre.force(e, n)));
  for (const a of Tour.actionsDisponibles(e).filter(x => x.type === 'recruter'))
    if (Guerre.force(p.e, 'joueur') < cible && p.e.tresor - 30 >= (reserve || 0)) p.essayer(a);
}
// le niveau d'imposition : haut si toutes les factions sont calmes (colère < 35), bas si l'une gronde (≥ 55), sinon normal
function fiscalite(p){
  const max = Math.max(...Object.values(p.e.factions).map(x => x.colere));
  const voulu = max >= 55 ? 'bas' : max < 35 ? 'haut' : 'normal';
  if ((p.e.impots || 'normal') !== voulu) p.essayer({ type: 'impots', id: voulu });
}
// un événement à choix : la réponse payante si on a au moins 3 fois son prix, sinon la gratuite (par défaut)
const { CARTES } = P('donnees/evenements.js');
function evenement(p){
  const ev = p.e.evenement;
  if (!ev) return;
  const payante = CARTES[ev.id].choix.find(c => c.cout && p.e.tresor >= 3 * c.cout);
  if (payante) p.essayer({ type: 'evenement', choix: payante.id });
}
// diplomate (V2 étape 2) : vers la nation la plus fâchée si la relation passe sous 0 ; rappelé quand toutes sont à +20
function diplomatie(p){
  const e = p.e, liste = Object.keys(e.nations).filter(n => !(e.guerre && e.guerre.ennemis.includes(n)));
  if (!liste.length) return;
  const pire = liste.sort((a, b) => e.nations[a].relation - e.nations[b].relation)[0];
  if (e.nations[pire].relation < 0 && (!e.diplomate || e.diplomate.nation !== pire) && e.tresor >= 20) p.essayer({ type: 'diplomate', id: pire });
  else if (e.diplomate && liste.every(n => e.nations[n].relation >= 20)) p.essayer({ type: 'rappeler_diplomate' });
}
// contraindre (V2 étape 3) : embargo et exigence contre une nation qui nous sanctionne ou nous provoque, si l'embargo peut
// lui faire mal (nous avons en trop ce qu'elle importe) et sans tomber à −50 ; embargo levé une fois l'affaire réglée
function contraindre(p){
  if (process.env.POLITIQUE_SANS_EXIGENCE) return;   // pour comparer avant / après dans le simulateur
  const e = p.e, en = n => !!e.guerre && e.guerre.ennemis.includes(n), b = (e.bilan || {}).balance || {};
  for (const n in e.nations){
    if (en(n)) continue;
    const enCours = (e.exigences || []).some(x => x.nation === n), sous = e.embargos.includes(n);
    if (sous && !enCours){ p.essayer({ type: 'lever_embargo', id: n }); continue; }
    if (sous || enCours) continue;
    const levier = Object.keys(e.profils[n].importe).some(x => (b[x] || 0) > 0);
    if (!levier || e.nations[n].relation - 30 <= -50) continue;
    const sanctionne = e.sanctions.some(x => x.par === n && x.contre === 'joueur');
    const provoque = e.journal.some(l => l.startsWith('Incident provoqué par ' + e.profils[n].nom));
    if (!sanctionne && !provoque) continue;
    if (p.essayer({ type: 'embargo', id: n })) p.essayer({ type: 'exiger', id: n, exigence: sanctionne ? 'lever_sanctions' : 'cesser_provocations' });
  }
}
// commercer : signer les contrats utiles (vendre ce qu'on a en trop, acheter ce qui manque) s'ils battent le marché une fois
// le transport payé ; investir : acheter une caravane quand elles sont toutes prises, améliorer la route la plus utilisée
const Diplo = P('moteur/diplomatie.js');
function commercer(p, investir){
  const e = p.e, b = (e.bilan || {}).balance || {}, pv = (e.bilan || {}).prixVente || {}, pa = (e.bilan || {}).prixAchat || {};
  const bonnes = Object.keys(e.offres).filter(id => {
    const c = e.offres[id];
    if (e.contrats.some(x => x.id === id)) return false;
    const t = Diplo.transport(e, c.nation);
    return c.sens === 'vente' ? (b[c.bien] || 0) >= c.volume && c.prix - t > (pv[c.bien] || ECO.prix[c.bien] * 0.8)
                              : (b[c.bien] || 0) <= -c.volume && c.prix + t < (pa[c.bien] || ECO.prix[c.bien] * 1.2);
  });
  for (const id of bonnes) p.essayer({ type: 'contrat', id });
  if (!investir) return;
  // une caravane de plus seulement si toutes sont prises et qu'un bon contrat attend (puis on le signe)
  const attend = bonnes.find(id => !p.e.contrats.some(x => x.id === id));
  if (attend && p.e.contrats.length >= (p.e.caravanes || 0) && p.e.tresor >= 200 && p.essayer({ type: 'caravane' })) p.essayer({ type: 'contrat', id: attend });
  if (p.e.tresor >= 400){
    const compte = {}; for (const x of p.e.contrats){ const n = p.e.offres[x.id].nation; if (p.e.profils[n].distance >= 2 && !(p.e.routes || []).includes(n)) compte[n] = (compte[n] || 0) + 1; }
    const n = Object.keys(compte).sort((x, y) => compte[y] - compte[x])[0];
    if (n) p.essayer({ type: 'route', id: n });
  }
}
// budget de fin de partie (14/11) : agrandir le bâtiment le plus rentable (prix de vente du tour, sans marché saturé),
// puis financer des institutions dans l'ordre des priorités du bot ; redescendre si le trésor fond
function budget(p, prio){
  if (process.env.POLITIQUE_SANS_BUDGET) return;   // pour comparer avant / après dans le simulateur
  const e = p.e, pv = (e.bilan || {}).prixVente || {};
  if (e.tresor >= 300){
    let mieux = null, score = 0;
    for (const a of Tour.actionsDisponibles(e).filter(a => a.type === 'agrandir')){
      const b = BAT[a.id], bien = Object.keys(b.produit)[0], prix = pv[bien] || ECO.prix[bien];
      if (prix < 0.6 * ECO.prix[bien]) continue;                       // marché saturé : inutile d'en produire plus
      const gain = (b.produit[bien] * prix - b.entretien) / Batiments.coutAgrandir(e, a.region, a.id);
      if (gain > score){ score = gain; mieux = a; }
    }
    if (mieux) p.essayer(mieux);
  }
  const niv = e.institutions || {}, solde = (e.bilan || {}).solde || 0;
  if (e.tresor < 100){ const haut = Object.keys(niv).filter(i => niv[i] > 0).sort((a, b) => niv[b] - niv[a])[0]; if (haut) p.essayer({ type: 'institution', id: haut, niveau: niv[haut] - 1 }); return; }
  for (const id of prio || []){
    const n = niv[id] || 0; if (n >= INS.max) continue;
    if (e.tresor >= 500 && solde > INS.INSTITUTIONS[id].cout[n + 1] - INS.INSTITUTIONS[id].cout[n] + 20) p.essayer({ type: 'institution', id, niveau: n + 1 });
    break;
  }
}
// une caserne d'abord si on n'en a pas
const avecCaserne = liste => e => (!e.batiments.caserne && !e.chantiers.some(c => c.id === 'caserne') ? ['caserne'] : []).concat(liste(e));
// apaiser les factions dont la colère atteint le seuil (la plus en colère d'abord)
function apaiser(p, seuil){
  if (seuil == null) return;
  for (const f of FACTIONS.slice().sort((a, b) => p.e.factions[b].colere - p.e.factions[a].colere))
    if (p.e.factions[f].colere >= seuil) p.essayer({ type: 'apaiser', id: f });
}
// la prochaine loi de la liste qui n'est ni en vigueur ni en cours (on garde le capital pour elle)
function loiSuivante(p, liste){
  const e = p.e;
  // une loi est « faite » si elle, ou une loi placée après elle dans la liste et de même catégorie, est en vigueur ou en cours
  // (sinon École publique et École gratuite se remplaceraient sans fin)
  const faite = (x, i) => liste.slice(i).some(y => LOIS[y].categorie === LOIS[x].categorie &&
    ((e.lois[LOIS[y].categorie] && e.lois[LOIS[y].categorie].id === y) || (e.debat && e.debat.id === y)));
  // V2 : une loi à la fois ; un débat sans espoir (moins de 15 % par tour) est abandonné
  if (e.debat){ if (Lois.chance(e, e.debat.id) < 0.15) p.essayer({ type: 'abandonner' }); return; }
  const id = liste.find((x, i) => !faite(x, i));
  if (id) p.essayer({ type: 'loi', id });
}
// les bâtiments par ordre d'utilité : d'abord ce qui manque (tissu, outils, fer), puis fermes, mines…
function batimentUtile(e){
  // ressources (15/11) : d'abord ce qui manque le plus cher (déficit × prix), puis l'ordre habituel
  const b = e.bilan ? e.bilan.balance : {};
  const PAR = { grain: 'farm', fer: 'mine', tissu: 'weaving', outils: 'workshop', bois: 'scierie', charbon: 'mine_charbon', vin: 'vignoble' };
  const l = Object.keys(PAR).filter(x => (b[x] || 0) < 0).sort((x, y) => b[x] * ECO.prix[x] - b[y] * ECO.prix[y]).map(x => PAR[x]);
  return l.concat(['farm', 'mine', 'workshop', 'weaving', 'scierie', 'mine_charbon', 'vignoble'].filter(x => !l.includes(x)));
}
// construire un bâtiment dans la région où il rend le plus (bonus de terrain), s'il y a une place
function construireMieux(p, id){
  const ou = Tour.actionsDisponibles(p.e).filter(a => a.type === 'construire' && a.id === id)
    .sort((a, b) => Batiments.bonus(p.e, b.region, id) - Batiments.bonus(p.e, a.region, id));
  return ou.length > 0 && p.essayer(ou[0]);
}
// remplir les chantiers libres (un par région), en gardant une réserve d'or
function construire(p, choix, reserve){
  for (let i = 0; i < Object.keys(p.e.regions).length; i++){
    const id = choix(p.e).find(x => p.e.tresor - BAT[x].cout >= (reserve || 0) && Tour.actionsDisponibles(p.e).some(a => a.type === 'construire' && a.id === x));
    if (!id || !construireMieux(p, id)) break;
  }
}

// un bot à programme : comme economy, avec sa liste de lois
function programme(lois, prio){
  return e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.6 });
    apaiser(p, 55);
    loiSuivante(p, lois);
    armee(p, 1, 50);
    construire(p, avecCaserne(batimentUtile), 0);
    fiscalite(p);
    evenement(p);
    diplomatie(p);
    contraindre(p);
    budget(p, prio);
    return p.acts;
  };
}

// --- les bots ---
const BOTS = {
  // ne fait rien (référence)
  passif: () => () => [],

  // tout dans la croissance : impôts, écoles, bâtiments sans réserve
  economy: () => e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.6 });
    apaiser(p, 55);
    loiSuivante(p, ['income_progressive', 'school_public', 'school_free', 'income_capital']);
    armee(p, 1, 50);
    construire(p, avecCaserne(batimentUtile), 0);
    fiscalite(p);
    evenement(p);
    diplomatie(p);
    contraindre(p);
    budget(p, ['enseignement', 'sante']);
    return p.acts;
  },

  // la Médecine du travail d'abord (option dominante supposée), puis comme economy
  // commerce (14/11) : gestion d'economy, contrats utiles, diplomate et exigences ; ambition Influence
  commerce: () => e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.6 });
    apaiser(p, 55);
    loiSuivante(p, ['income_progressive', 'school_public', 'libre_echange', 'school_free']);
    armee(p, 1, 50);
    construire(p, avecCaserne(batimentUtile), 0);
    fiscalite(p);
    evenement(p);
    commercer(p, true);
    diplomatie(p);
    contraindre(p);
    budget(p, ['enseignement', 'sante']);
    return p.acts;
  },
  spam_medicine: () => e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.6 });
    apaiser(p, 55);
    loiSuivante(p, ['labor_medicine', 'income_progressive', 'school_public', 'school_free', 'income_capital']);
    armee(p, 1, 50);
    construire(p, avecCaserne(batimentUtile), 0);
    fiscalite(p);
    evenement(p);
    diplomatie(p);
    contraindre(p);
    budget(p, ['sante', 'enseignement']);
    return p.acts;
  },

  // comme economy, sans jamais apaiser
  no_appeasement: () => e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.6 });
    loiSuivante(p, ['income_progressive', 'school_public', 'school_free', 'income_capital']);
    armee(p, 1, 50);
    construire(p, avecCaserne(batimentUtile), 0);
    fiscalite(p);
    evenement(p);
    diplomatie(p);
    contraindre(p);
    budget(p, ['enseignement']);
    return p.acts;
  },

  // conscription, deux casernes, des forts, armée au plafond ; attaque la nation la plus faible quand il l'écrase
  militarist: () => e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.5, embargoEnGuerre: true });
    apaiser(p, 55);   // essai à 70 (13/11) : pire (52 % de révolutions au lieu de 2 %)
    loiSuivante(p, ['army_conscription', 'income_progressive']);
    armee(p, 99, 30);
    construire(p, x => ((x.batiments.caserne || 0) + x.chantiers.filter(c => c.id === 'caserne').length < 2 ? ['caserne'] : [])
      .concat(Object.keys(x.regions).some(r => !x.regions[r].batiments.fort) ? ['fort'] : []).concat(batimentUtile(x)), 60);
    if (!p.e.guerre){
      const nous = Guerre.force(p.e, 'joueur');
      const cible = Object.keys(p.e.nations).sort((a, b) => Guerre.force(p.e, a) - Guerre.force(p.e, b))[0];
      if (nous > 1.5 * Guerre.force(p.e, cible)) p.essayer({ type: 'declarer_guerre', id: cible });
    }
    fiscalite(p);
    evenement(p);
    diplomatie(p);
    return p.acts;
  },

  // au hasard dans la liste des actions (graine du bot séparée de celle du moteur)
  random: graine => {
    const r = Alea.creer(graine * 7919 + 13);
    return e => {
      const p = plan(e);
      for (let i = 0; i < 3; i++){
        const d = Tour.actionsDisponibles(p.e);
        if (!d.length || Alea.suivant(r) < 0.4) break;
        p.essayer(Alea.choisir(r, d));
      }
      return p.acts;
    };
  },

  // programmes politiques (panel du 14/11) : même gestion qu'economy, lois du camp dans l'ordre
  gauche_med: () => programme(['labor_medicine', 'income_progressive', 'school_public', 'unions', 'suffrage_universal', 'journee_huit_heures', 'interventionnisme', 'school_free', 'army_professional'], ['sante', 'enseignement']),
  gauche: () => programme(['income_progressive', 'school_public', 'securite_sociale', 'unions', 'suffrage_universal', 'journee_huit_heures', 'interventionnisme', 'school_free', 'army_professional'], ['sante', 'enseignement']),
  droite: () => programme(['impot_minimal', 'libre_entreprise', 'ecoles_religieuses', 'police_etat', 'suffrage_census', 'syndicats_interdits', 'army_conscription', 'libre_echange', 'charite_privee'], ['police', 'sante']),
  extreme_gauche: () => programme(['income_capital', 'collectivisation', 'comites_populaires', 'securite_sociale', 'unions', 'milice_populaire', 'suffrage_universal', 'school_free', 'journee_huit_heures'], ['police', 'sante']),
  extreme_droite: () => programme(['laisser_faire', 'parti_unique', 'syndicats_interdits', 'police_etat', 'travail_enfants', 'army_conscription', 'impot_minimal', 'ecoles_religieuses', 'libre_echange'], ['police', 'sante']),

  // rejoue la trajectoire de la partie 1 (RULES_V1 § Trajectoire) : chaque étape est tentée à partir de son tour
  // jusqu'à ce qu'elle passe ; guerre gagnée par l'usure (embargo, pas de bataille), pas de paix blanche
  replica: () => {
    const etapes = [
      [1, { type: 'contrat', id: 'brume_tissu' }], [2, { type: 'construire', id: 'farm' }],
      [3, { type: 'loi', id: 'income_progressive' }], [4, { type: 'construire', id: 'mine' }],
      [5, { type: 'loi', id: 'school_public' }], [6, { type: 'construire', id: 'workshop' }],
      [7, { type: 'loi', id: 'journee_huit_heures' }], [8, { type: 'don', id: 'brume', montant: 50 }],
      [9, { type: 'construire', id: 'farm' }], [10, { type: 'traite', id: 'entente', avec: 'brume' }],
      [11, { type: 'loi', id: 'unions' }], [11, { type: 'don', id: 'contreforts', montant: 50 }],
      [12, { type: 'don', id: 'contreforts', montant: 50 }], [12, { type: 'traite', id: 'filature', avec: 'brume' }],
      [12, { type: 'construire', id: 'entente_mill' }], [13, { type: 'traite', id: 'entente', avec: 'contreforts' }],
      [14, { type: 'don', id: 'contreforts', montant: 20 }], [14, { type: 'construire', id: 'mine' }],
      [15, { type: 'loi', id: 'labor_medicine' }], [15, { type: 'embargo', id: 'val_roc' }],
      [16, { type: 'loi', id: 'army_professional' }], [17, { type: 'construire', id: 'weaving' }],
      [18, { type: 'traite', id: 'defense_mutuelle', avec: 'brume' }], [20, { type: 'construire', id: 'farm' }],
      [25, { type: 'loi', id: 'suffrage_universal' }], [27, { type: 'loi', id: 'school_free' }],
      [27, { type: 'construire', id: 'farm' }]
    ];
    const faites = new Set();
    return e => {
      const p = plan(e);
      guerre(p, { seuilBataille: null, paixBlanche: false, leverEmbargo: true, embargoEnGuerre: true });
      apaiser(p, 55);
      armee(p, 1, 50);
      if (e.tour >= 3 && !p.e.batiments.caserne && !p.e.chantiers.some(c => c.id === 'caserne')) construireMieux(p, 'caserne');
      etapes.forEach(([t, a], i) => { if (!faites.has(i) && e.tour >= t && (a.type === 'construire' ? construireMieux(p, a.id) : p.essayer(a))) faites.add(i); });
      fiscalite(p);
      evenement(p);
    diplomatie(p);
      budget(p, ['sante']);
    return p.acts;
    };
  }
};

// ambition de chaque bot (objectif de victoire choisi au tour 1) ; random la tire parmi ses actions, passif n'en a pas
const AMBITIONS = { economy: 'prosperite', no_appeasement: 'prosperite', spam_medicine: 'contentement', gauche: 'contentement', gauche_med: 'contentement',
  commerce: 'influence', replica: 'concorde', droite: 'autorite', extreme_droite: 'autorite', extreme_gauche: 'autorite' };
const creer = (nom, graine) => {
  if (!BOTS[nom]) throw new Error('bot inconnu : ' + nom);
  const bot = BOTS[nom](graine);
  return e => { const acts = bot(e); if (e.tour === 1 && !e.ambition && AMBITIONS[nom]) acts.unshift({ type: 'ambition', id: AMBITIONS[nom] }); return acts; };
};
module.exports = { creer, noms: Object.keys(BOTS), plan, AMBITIONS };

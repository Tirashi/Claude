/* Politique : joueurs automatiques (bots) du simulateur (M4, specs/politique/plan-simulateur.md).
   creer(nom, graine) → bot(etat) → liste d'actions du tour. Un bot ne choisit que dans Tour.actionsDisponibles :
   il compose son tour action par action sur une copie (plan), chaque action vérifiée sur l'état laissé par la précédente.
   Les nations de l'ordinateur suivent le persona de leur dirigeant (moteur ; donnees/personas.js) : un bot ne le lit pas. */
'use strict';
const path = require('path');
const P = f => require(path.join(__dirname, '..', 'politique', f));
const Lois = P('moteur/lois.js'), Alea = P('moteur/alea.js'), Etat = P('moteur/etat.js'), Tour = P('moteur/tour.js'), Guerre = P('moteur/guerre.js'), Batiments = P('moteur/batiments.js');
const { LOIS } = P('donnees/lois.js');
const BAT = P('donnees/batiments.js');

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
  const b = e.bilan ? e.bilan.balance : {}, l = [];
  if ((b.tissu || 0) < 0) l.push('weaving');
  if ((b.outils || 0) < 0) l.push('workshop');
  if ((b.fer || 0) < 0) l.push('mine');
  return l.concat(['farm', 'mine', 'workshop', 'weaving'].filter(x => !l.includes(x)));
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
function programme(lois){
  return e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.6 });
    apaiser(p, 55);
    loiSuivante(p, lois);
    armee(p, 1, 50);
    construire(p, avecCaserne(batimentUtile), 0);
    fiscalite(p);
    evenement(p);
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
    return p.acts;
  },

  // la Médecine du travail d'abord (option dominante supposée), puis comme economy
  spam_medicine: () => e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.6 });
    apaiser(p, 55);
    loiSuivante(p, ['labor_medicine', 'income_progressive', 'school_public', 'school_free', 'income_capital']);
    armee(p, 1, 50);
    construire(p, avecCaserne(batimentUtile), 0);
    fiscalite(p);
    evenement(p);
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
  gauche: () => programme(['income_progressive', 'school_public', 'securite_sociale', 'unions', 'suffrage_universal', 'journee_huit_heures', 'interventionnisme', 'school_free', 'army_professional']),
  droite: () => programme(['impot_minimal', 'libre_entreprise', 'ecoles_religieuses', 'police_etat', 'suffrage_census', 'syndicats_interdits', 'army_conscription', 'libre_echange', 'charite_privee']),
  extreme_gauche: () => programme(['income_capital', 'collectivisation', 'comites_populaires', 'securite_sociale', 'unions', 'milice_populaire', 'suffrage_universal', 'school_free', 'journee_huit_heures']),
  extreme_droite: () => programme(['laisser_faire', 'parti_unique', 'syndicats_interdits', 'police_etat', 'travail_enfants', 'army_conscription', 'impot_minimal', 'ecoles_religieuses', 'libre_echange']),

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
      return p.acts;
    };
  }
};

const creer = (nom, graine) => { if (!BOTS[nom]) throw new Error('bot inconnu : ' + nom); return BOTS[nom](graine); };
module.exports = { creer, noms: Object.keys(BOTS), plan };

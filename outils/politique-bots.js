/* Politique : joueurs automatiques (bots) du simulateur (M4, specs/politique/plan-simulateur.md).
   creer(nom, graine) → bot(etat) → liste d'actions du tour. Un bot ne choisit que dans Tour.actionsDisponibles :
   il compose son tour action par action sur une copie (plan), chaque action vérifiée sur l'état laissé par la précédente.
   Les politiques des nations de l'ordinateur sont dans le moteur (donnees/guerre.js), pas ici. */
'use strict';
const path = require('path');
const P = f => require(path.join(__dirname, '..', 'politique', f));
const Alea = P('moteur/alea.js'), Etat = P('moteur/etat.js'), Tour = P('moteur/tour.js'), Guerre = P('moteur/guerre.js'), Batiments = P('moteur/batiments.js');
const { LOIS } = P('donnees/lois.js');
const BAT = P('donnees/batiments.js');

const FACTIONS = ['ouvriers', 'paysans', 'artisans', 'patrons'];

function plan(e){
  const tmp = Etat.copie(e), acts = [], r = { s: 0 };
  return {
    e: tmp, acts,
    peut: a => Tour.actionsDisponibles(tmp).some(d => Tour.memeAction(a, d)),
    essayer(a){
      if (!this.peut(a)) return false;
      Tour.appliquerAction(tmp, a, r); acts.push(a); return true;
    }
  };
}

// --- réflexes communs ---
// guerre : imposer la paix si l'ennemi capitule, paix blanche si possible, bataille si nos chances ≥ seuil
function guerre(p, o){
  const g = p.e.guerre;
  if (!g) return;
  if (g.capitulation === 'ennemi'){ p.essayer({ type: 'imposer_paix', reparations: true, lever_embargo: !!o.leverEmbargo, non_rearmement: true }); return; }
  if (o.paixBlanche !== false && p.essayer({ type: 'paix_blanche' })) return;
  if (o.embargoEnGuerre) for (const n of g.ennemis) p.essayer({ type: 'embargo', id: n });
  const fa = Guerre.forceCamp(p.e, ['joueur'].concat(g.allies), false), fd = Guerre.forceCamp(p.e, g.ennemis, true);
  if (o.seuilBataille != null && fa + fd > 0 && fa / (fa + fd) >= o.seuilBataille) p.essayer({ type: 'bataille' });
}
// apaiser les factions dont la colère atteint le seuil (la plus en colère d'abord)
function apaiser(p, seuil){
  if (seuil == null) return;
  for (const f of FACTIONS.slice().sort((a, b) => p.e.factions[b].colere - p.e.factions[a].colere))
    if (p.e.factions[f].colere >= seuil) p.essayer({ type: 'apaiser', id: f });
}
// la prochaine loi de la liste qui n'est ni en vigueur ni en cours (on garde le capital pour elle)
function loiSuivante(p, liste){
  const e = p.e;
  const id = liste.find(x => !(e.lois[LOIS[x].categorie] && e.lois[LOIS[x].categorie].id === x) && !e.loisEnCours.some(c => c.id === x));
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
    construire(p, batimentUtile, 0);
    return p.acts;
  },

  // la Médecine du travail d'abord (option dominante supposée), puis comme economy
  spam_medicine: () => e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.6 });
    apaiser(p, 55);
    loiSuivante(p, ['labor_medicine', 'income_progressive', 'school_public', 'school_free', 'income_capital']);
    construire(p, batimentUtile, 0);
    return p.acts;
  },

  // comme economy, sans jamais apaiser
  no_appeasement: () => e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.6 });
    loiSuivante(p, ['income_progressive', 'school_public', 'school_free', 'income_capital']);
    construire(p, batimentUtile, 0);
    return p.acts;
  },

  // conscription, forge et fortifications, réserve d'or ; attaque la nation la plus faible quand il l'écrase
  militarist: () => e => {
    const p = plan(e);
    guerre(p, { seuilBataille: 0.5, embargoEnGuerre: true });
    apaiser(p, 55);   // essai à 70 (13/11) : pire (52 % de révolutions au lieu de 2 %)
    loiSuivante(p, ['army_conscription', 'income_progressive']);
    construire(p, x => [!x.batiments.forge && !x.chantiers.some(c => c.id === 'forge') ? 'forge' : null,
      !x.batiments.fortifications && !x.chantiers.some(c => c.id === 'fortifications') ? 'fortifications' : null].filter(Boolean).concat(batimentUtile(x)), 300);
    if (!p.e.guerre){
      const nous = Guerre.force(p.e, 'joueur', false);
      const cible = Object.keys(p.e.nations).sort((a, b) => Guerre.force(p.e, a) - Guerre.force(p.e, b))[0];
      if (nous > 1.5 * Guerre.force(p.e, cible, false)) p.essayer({ type: 'declarer_guerre', id: cible });
    }
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

  // rejoue la trajectoire de la partie 1 (RULES_V1 § Trajectoire) : chaque étape est tentée à partir de son tour
  // jusqu'à ce qu'elle passe ; guerre gagnée par l'usure (embargo, pas de bataille), pas de paix blanche
  replica: () => {
    const etapes = [
      [1, { type: 'contrat', id: 'brume_tissu' }], [2, { type: 'construire', id: 'farm' }],
      [3, { type: 'loi', id: 'income_progressive' }], [4, { type: 'construire', id: 'mine' }],
      [5, { type: 'loi', id: 'school_public' }], [6, { type: 'construire', id: 'workshop' }],
      [7, { type: 'loi', id: 'labor_code' }], [8, { type: 'don', id: 'brume', montant: 50 }],
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
      etapes.forEach(([t, a], i) => { if (!faites.has(i) && e.tour >= t && (a.type === 'construire' ? construireMieux(p, a.id) : p.essayer(a))) faites.add(i); });
      return p.acts;
    };
  }
};

const creer = (nom, graine) => { if (!BOTS[nom]) throw new Error('bot inconnu : ' + nom); return BOTS[nom](graine); };
module.exports = { creer, noms: Object.keys(BOTS), plan };

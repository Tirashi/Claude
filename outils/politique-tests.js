/* Politique (moteur de règles, sans écran) : tests sous Node.
   node outils/politique-tests.js
   M1 : économie, capital politique, lois, bâtiments (une règle = un test), puis des parties au hasard (invariants).
   M3a : nations de l'ordinateur, dons, contrats, embargo, traités (Entente, défense mutuelle, filature), réputation, paria.
   M3b et V2 étape 2 : régiments, recrutement, casernes, forts, occupation, déclarations, alliés, batailles, sanctions, capitulation, clauses, cession, paix blanche, trêve.
   M2 : factions (dissipation, effets par tour, chocs, suffrages, apaisement, bornes, statuts, moral, grève, révolte, révolution).
   M0 : hasard à graine, état initial du scénario « champs », invariants du tour
   (déterminisme, état reçu jamais modifié, JSON rechargé à l'identique, action hors liste refusée).
   Parties de bots et métriques : outils/politique-simulateur.js.
   Code de sortie 1 si un test échoue (lancé par outils/verifications.js). */
'use strict';
const path = require('path');
const P = f => require(path.join(__dirname, '..', 'politique', f));
const Alea = P('moteur/alea.js'), Etat = P('moteur/etat.js'), Tour = P('moteur/tour.js');
const Economie = P('moteur/economie.js'), Lois = P('moteur/lois.js'), FAm = P('moteur/factions.js');
const CHAMPS = P('donnees/champs.js'), ECO = P('donnees/economie.js'), { LOIS, CATEGORIES } = P('donnees/lois.js'), BAT = P('donnees/batiments.js');

// les tests écrits avant la V2 étape 3 vérifient des règles sans marché ni niveau de vie : prix fixes et dissipation de la V1
// (rétablis pour le bloc de l'étape 3, à la fin)
const RFV = P('donnees/factions.js').REGLES_FACTIONS, PENTE = P('donnees/economie.js').marche.pente;
P('donnees/economie.js').marche.pente = 0; RFV.niveauDeVie.actif = false;
// … et sans débat au hasard : une loi lancée au tour T est adoptée au tour T + 2 (le délai de la V1), sans colère de débat
const RLV = P('donnees/lois.js').REGLES_LOIS, RLV0 = JSON.parse(JSON.stringify(RLV));
Object.assign(RLV, { premierTirage: 3, colereDebat: 0, chance: Object.assign({}, RLV.chance, { min: 1, max: 1 }) });
// … et avec la réputation à part (avant la V2 étape 6)
const FUS = P('donnees/diplomatie.js').fusion; FUS.actif = false;
// … et sans entretien des bâtiments ni intérêts de la dette (avant le budget de la V2)
const ECOV = P('donnees/economie.js'), BUDGET0 = { entretienFacteur: ECOV.entretienFacteur, dette: JSON.parse(JSON.stringify(ECOV.dette)) };
ECOV.entretienFacteur = 0; ECOV.dette.taux = 0; ECOV.dette.colereFaillite = 0;
// … et sans événements tirés au hasard (avant le paquet d'événements)
const REV = P('donnees/evenements.js').REGLES_EVENEMENTS, CHANCE_EV = REV.chance; REV.chance = 0;

let fail = 0, n = 0;
const check = (ok, msg) => { n++; console.log((ok ? 'ok    ' : 'ÉCHEC ') + msg); if (!ok) fail++; };
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const gele = o => { if (o && typeof o === 'object') { Object.freeze(o); Object.values(o).forEach(gele); } return o; };

// --- hasard ---
{
  const suite = g => { const r = Alea.creer(g); return Array.from({ length: 1000 }, () => Alea.suivant(r)); };
  const a = suite(1), b = suite(1), c = suite(2);
  check(egal(a, b), 'hasard : même graine, même suite (1000 tirages)');
  check(!egal(a, c), 'hasard : graines 1 et 2 donnent des suites différentes');
  check(a.every(x => x >= 0 && x < 1), 'hasard : tirages dans [0, 1[');
  // implémentation de référence de mulberry32 (Tommy Ettinger), écrite à part : si elles divergent, toutes les parties enregistrées changent
  const ref = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const m = ref(1);
  check(egal(a, Array.from({ length: 1000 }, m)), 'hasard : identique à mulberry32 de référence (graine 1, 1000 tirages)');
  const moy = a.reduce((s, x) => s + x, 0) / a.length;
  check(moy > 0.45 && moy < 0.55, `hasard : moyenne ${moy.toFixed(3)} proche de 0,5`);
  const comptes = [0, 0, 0, 0, 0, 0]; const r = Alea.creer(7);
  for (let i = 0; i < 6000; i++) comptes[Alea.entier(r, 6)]++;
  check(comptes.every(k => k > 850 && k < 1150), 'hasard : entier(6) uniforme (' + comptes.join(' ') + ')');
  check(egal(Alea.creer('2026-11-13'), Alea.creer('2026-11-13')) && !egal(Alea.creer('2026-11-13'), Alea.creer('2026-11-14')), 'hasard : graine en texte (graine du jour)');
}

// --- état initial ---
{
  const e = Etat.creerEtat(CHAMPS, 1);
  check(e.tour === 1 && e.tourMax === 40 && !e.fin, 'état initial : tour 1 sur 40');
  check(e.tresor === CHAMPS.joueur.tresor && e.familles === CHAMPS.joueur.familles && e.cp === undefined && e.debat === null, 'état initial : trésor et familles du scénario ; pas de capital politique (V2), aucun débat');
  check(egal(Object.keys(e.factions), ['paysans', 'ouvriers', 'artisans', 'patrons']), 'état initial : les 4 factions');
  check(Object.values(e.factions).every(f => f.colere >= 0 && f.colere <= 100 && f.puissance >= 0 && f.puissance <= 100), 'état initial : colère et puissance dans 0-100');
  check(egal(Object.keys(e.nations), ['val_roc', 'brume', 'contreforts']), 'état initial : les 3 nations de l\'ordinateur');
  check(Object.values(e.nations).every(x => x.relation >= -100 && x.relation <= 100), 'état initial : relations dans -100…+100');
  check(egal(JSON.parse(JSON.stringify(e)), e), 'état initial : sérialisable en JSON');
  e.factions.paysans.colere = 99;
  check(CHAMPS.joueur.factions.paysans.colere !== 99, 'état initial : copie des données (le scénario n\'est pas modifié)');
}

// --- tour : invariants ---
const partie = (graine, coupe) => {
  let e = Etat.creerEtat(CHAMPS, graine); const traces = [];
  while (!e.fin) {
    if (coupe && e.tour === coupe) e = JSON.parse(JSON.stringify(e));   // sauvegarde et rechargement
    e = Tour.tourSuivant(e, []);
    traces.push(JSON.stringify(e));
  }
  return traces;
};
{
  const a = partie(42), b = partie(42), c = partie(42, 30);
  const fin42 = JSON.parse(a[a.length - 1]);
  check(a.length <= 40 && (a.length === 40) === (fin42.issue.type === 'fin'), `tour : une partie dure 40 tours, sauf révolution (graine 42 : ${a.length} tours, ${fin42.issue.type})`);
  check(egal(a, b), 'déterminisme : même graine, même partie (40 tours, état complet à chaque tour)');
  check(egal(a, c), 'déterminisme : identique après sauvegarde JSON et rechargement au tour 30');
  const e0 = gele(Etat.creerEtat(CHAMPS, 3)), avant = JSON.stringify(e0);
  let e1; try { e1 = Tour.tourSuivant(e0, []); } catch (err) { e1 = null; }
  check(e1 && JSON.stringify(e0) === avant && e1 !== e0, 'tour : l\'état reçu n\'est jamais modifié (état gelé)');
  check(e1 && e1.tour === 2, 'tour : le compteur avance');
  let refuse = false; try { Tour.tourSuivant(e0, [{ type: 'inventee' }]); } catch (err) { refuse = true; }
  check(refuse, 'tour : une action absente de actionsDisponibles est refusée');
  const r = Alea.creer(9); Alea.suivant(r); Alea.suivant(r);
  check(Tour.tourSuivant(e0, [], r).alea === r.s, 'tour : le hasard injecté est rangé dans le nouvel état');
  const fin = JSON.parse(a[a.length - 1]);
  check(fin.fin && egal(Tour.actionsDisponibles(fin), []), 'tour : plus aucune action après la fin');
}

// ===================== M1 =====================
// état de départ pour vérifier une règle à la fois : Val-Roc n'y déclare pas la guerre (caractère « commerçant ») ;
// les tests de M3b partent du vrai scénario (vrai())
// vrai() : la mise en place des tests écrits avant les personas (Val-Roc belliqueux, Brume marchande, Contreforts opportuniste,
// relations −20 / +20 / 0, crise du tissu au tour 1), pour qu'ils gardent leur sens ; la vraie mise en place : Etat.creerEtat
const vrai = (mod, graine) => {
  const e = Etat.creerEtat(CHAMPS, graine || 1);
  const ancien = { val_roc: ['belliqueux', -20, 5], brume: ['marchand', 20, 3], contreforts: ['opportuniste', 0, 2] };
  for (const n in ancien) { e.profils[n].persona = ancien[n][0]; e.nations[n].relation = ancien[n][1]; e.nations[n].regiments = ancien[n][2]; }
  e.evenements = [{ tour: 1, id: 'crise_tissu', texte: "Crise du tissu : le prix du tissu s'envole.", prix: { tissu: 1.5 }, duree: 6 }];
  return Object.assign(e, mod || {});
};
// neuf() : une seule région d'essai, sans bonus ni limite de place, avec les bâtiments donnés (4 fermes et 1 mine par défaut,
// la production de la V1) ; les tests des régions partent de vrai()
const Batiments = P('moteur/batiments.js');
const neuf = (mod) => {
  const m = Object.assign({}, mod), bats = m.batiments || { farm: 4, mine: 1 }; delete m.batiments;
  const e = vrai(Object.assign({ regiments: 0 }, m)); e.profils.val_roc.persona = 'marchand';   // sans armée ni guerre : l'économie de la V1
  e.regions = { essai: { nom: 'Essai', terrain: 'mixte', emplacements: 99, batiments: JSON.parse(JSON.stringify(bats)) } };
  e.batiments = Batiments.totaux(e.regions);
  return e;
};
const tours = (e, k, actions) => { for (let i = 0; i < k; i++) e = Tour.tourSuivant(e, i === 0 ? actions || [] : []); return e; };
const refuse = f => { try { f(); return false; } catch (err) { return true; } };
const proche = (a, b) => Math.abs(a - b) < 1e-6;

// --- actions composées ---
{
  check(refuse(() => Tour.tourSuivant(neuf({ tresor: 75 }), [{ type: 'construire', id: 'farm', region: 'essai' }, { type: 'apaiser', id: 'paysans' }, { type: 'apaiser', id: 'ouvriers' }])), 'actions : chaque action est vérifiée sur l\'état laissé par la précédente (le 2e apaisement n\'est plus payable)');
}

// --- lois : délai, catégories ---
{
  let e = Tour.tourSuivant(neuf(), [{ type: 'loi', id: 'income_progressive' }]);   // lancée au tour 1
  check(e.debat && e.debat.id === 'income_progressive' && e.debat.depuis === 1 && !e.lois.impot, 'lois : lancée au tour 1, en débat');
  e = Tour.tourSuivant(e, []);
  check(!e.lois.impot && proche(e.bilan.impots, 80.8), 'lois : pas encore en vigueur au tour 2 (impôts sans multiplicateur)');
  const fam3 = e.familles;
  e = Tour.tourSuivant(e, []);
  check(e.lois.impot && e.lois.impot.id === 'income_progressive' && e.lois.impot.depuis === 3 && !e.debat, 'lois : en vigueur au tour 3 (débat sans hasard : 2 tours, le délai de la V1)');
  check(proche(e.bilan.impots, Math.round(fam3 * 1.3 * 100) / 100), 'lois : ses effets jouent dès le tour d\'adoption');
  check(refuse(() => Tour.tourSuivant(neuf(), [{ type: 'loi', id: 'income_progressive' }, { type: 'loi', id: 'unions' }])), 'lois : une seule loi en débat à la fois (V2)');
  let g = neuf();
  g = tours(g, 3, [{ type: 'loi', id: 'school_public' }]);
  check(!Tour.actionsDisponibles(g).some(a => a.id === 'school_public'), 'lois : une loi en vigueur ne se relance pas');
  g = tours(g, 3, [{ type: 'loi', id: 'school_free' }]);
  check(g.lois.education.id === 'school_free' && Object.keys(g.lois).length === 1, 'lois : adopter une loi remplace celle de sa catégorie');
  check(Object.values(CATEGORIES).length === 10 && Object.values(LOIS).every(l => CATEGORIES[l.categorie]), 'lois : 10 catégories (panel du 14/11), chaque loi dans l\'une d\'elles');
  check(Object.keys(LOIS).length === 27 && !LOIS.labor_code && Object.values(LOIS).every(l => l.bord && l.texte.length > 0), 'lois : les 27 lois du panel (sans code du travail), chacune avec son bord et ses phrases pour le joueur');
  const h = tours(neuf(), 3, [{ type: 'loi', id: 'suffrage_universal' }]);
  const k = tours(neuf(), 3, [{ type: 'loi', id: 'suffrage_census' }]);
  check(h.reputation === 5 && k.reputation === -5, 'lois : suffrage universel +5 de réputation, censitaire −5');
}

// --- économie ---
const avecLois = (ids, depuis, mod) => { const e = neuf(mod); for (const id of ids) e.lois[LOIS[id].categorie] = { id, depuis: depuis == null ? 1 : depuis }; return e; };
{
  const b = Tour.tourSuivant(neuf(), []).bilan;   // le bilan du tour 1 (événement du tour compris)
  check(b.production.grain === 80 && b.production.fer === 15 && b.production.tissu === 0, 'économie : production = bâtiments × rendement (4 fermes, 1 mine)');
  check(b.consommation.grain === 80 && b.consommation.tissu === 18 && b.consommation.outils === 8 && b.consommation.fer === 4, 'économie : consommation = familles × besoins + armée');
  check(b.prix.tissu === 3 && b.prix.grain === 1, 'économie : crise du tissu (prix ×1,5) au tour 1');
  check(proche(b.ventes, 16.5) && proche(b.achats, 70) && proche(b.impots, 80) && b.entretiens === 0 && proche(b.solde, 26.5), 'économie : ventes 11 fer × 1,5, achats 18 tissu × 3 + 8 outils × 2, impôts 80, solde +26,5');
  const e1 = Tour.tourSuivant(neuf(), []);
  check(proche(e1.tresor, 226.5), 'économie : trésor += ventes − achats + impôts − entretiens');
  const e6 = tours(neuf(), 5), e7 = tours(neuf(), 6);
  check(Economie.bilan(e6).prix.tissu === 3 && Economie.bilan(e7).prix.tissu === 2, 'économie : la crise du tissu dure 6 tours (prix normal au tour 7)');
  check(proche(Economie.bilan(avecLois(['income_progressive'])).impots, 104) && proche(Economie.bilan(avecLois(['income_capital'])).impots, 124), 'économie : impôts = familles × 1 × multiplicateur (progressif ×1,3 ; capital ×1,55)');
  check(Economie.bilan(avecLois(['school_public', 'labor_medicine', 'army_professional'])).entretiens === 36 && Economie.bilan(avecLois(['school_free', 'army_conscription'])).entretiens === 32, 'économie : entretiens des lois (école 14 / 20, médecine 10, armée 12)');
  check(proche(Economie.bilan(avecLois(['journee_huit_heures'])).production.grain, 73.6), 'économie : journée de huit heures, production −8 %');
  check(proche(Tour.tourSuivant(neuf(), []).familles, 80.8), 'démographie : +1 % de familles par tour');
  check(Tour.tourSuivant(neuf({ familles: 199.5 }), []).familles === 200, 'démographie : plafond de 200 familles');
  const ecole = (depuis) => { const e = avecLois(['school_public'], depuis); e.tour = 11; return Economie.bilan(e).croissance; };
  check(proche(ecole(11), 0.01) && proche(ecole(6), 0.0125) && proche(ecole(1), 0.015) && proche(ecole(-5), 0.015), 'démographie : école publique +0,5 %, montée en 10 tours');
  const art = (ids, depuis) => { const e = avecLois(ids, depuis, { batiments: { workshop: 1 } }); e.tour = 11; return Economie.bilan(e).production.outils; };
  check(art([], 1) === 10 && proche(art(['school_public'], 6), 11.75) && proche(art(['school_public'], 1), 13.5) && proche(art(['school_free'], 1), 15), 'économie : artisans +35 % / +50 % à terme sur l\'atelier');
  check(proche(art(['school_free', 'journee_huit_heures'], 1), 13.8), 'économie : bonus des artisans et journée de huit heures se multiplient');
  check(Economie.bilan(neuf({ batiments: { workshop: 2 } })).consommation.fer === 14, 'économie : un atelier consomme 5 fer');
  const d = Tour.tourSuivant(avecLois(['school_free', 'labor_medicine', 'army_professional'], 1, { tresor: 0, familles: 10, batiments: {} }), []);
  check(d.tresor < 0 && !d.fin && !Tour.actionsDisponibles(d).some(a => a.type === 'construire'), 'économie : le trésor peut passer sous zéro, on ne peut plus rien construire');
}

// --- bâtiments ---
{
  const C = (id, region) => ({ type: 'construire', id, region });
  const e = Tour.tourSuivant(neuf(), [C('farm', 'essai')]);
  check(proche(e.tresor, 200 - 60 + 26.5), 'bâtiments : payés à la commande');
  check(refuse(() => Tour.tourSuivant(neuf({ tresor: 59 }), [C('farm', 'essai')])), 'bâtiments : refusés si le trésor ne suffit pas');
  check(!Tour.actionsDisponibles(neuf({ tresor: 10000 })).some(a => a.id === 'entente_mill') && ['caserne', 'fort'].every(id => Tour.actionsDisponibles(neuf({ tresor: 10000 })).some(a => a.id === id)), 'bâtiments : filature seulement avec son traité ; caserne et fort constructibles');
  check(refuse(() => Tour.tourSuivant(neuf({ tresor: 1000 }), [C('farm', 'essai'), C('farm', 'essai')])), 'régions : un seul chantier à la fois par région');
  const v = (k, acts, mod) => tours(vrai(Object.assign({ tresor: 2000 }, mod)), k, acts);
  const quatre = v(1, [C('farm', 'plaine'), C('farm', 'vallee'), C('mine', 'collines'), C('workshop', 'bourg')]);
  check(quatre.chantiers.length === 4, 'régions : un chantier dans chacune des 4 régions en même temps');
  check(Object.entries({ farm: 2, mine: 3, workshop: 3, weaving: 3 }).every(([id, d]) => { const r = id === 'mine' ? 'collines' : 'bourg'; const avant = vrai().batiments[id] || 0;
    return v(d, [C(id, r)]).batiments[id] === avant + 1 && (v(d - 1, [C(id, r)]).batiments[id] || 0) === avant; }), 'bâtiments : délais 2 / 3 / 3 / 3 tours (ferme, mine, atelier, tissage)');
  check(v(2, [C('farm', 'plaine')]).bilan.production.grain === 100 && v(3, [C('farm', 'plaine')]).bilan.production.grain === 130, 'bâtiments : un bâtiment fini produit dès le tour suivant (ferme en plaine : +30)');
  const ini = vrai(), b0 = Tour.tourSuivant(vrai(), []).bilan;
  check(egal(ini.batiments, { farm: 4, mine: 1, caserne: 1 }) && ini.regions.plaine.batiments.farm === 2 && ini.regions.vallee.batiments.farm === 2 && ini.regions.collines.batiments.mine === 1 && ini.regions.bourg.batiments.caserne === 1, 'régions : départ 2 fermes en Plaine, 2 en Vallée, 1 mine dans les Collines, une caserne au Bourg (14/11)');
  check(b0.production.grain === 100 && b0.production.fer === 22.5, 'régions : bonus de terrain (fermes ×1,5 en plaine fertile, mine ×1,5 dans les collines)');
  const bourg = v(4, [C('workshop', 'bourg')]), val = v(4, [C('workshop', 'vallee')]);
  check(bourg.bilan.production.outils === 12.5 && val.bilan.production.outils === 10, 'régions : atelier ×1,25 au bourg, ×1 ailleurs');
  let pl = vrai({ tresor: 5000 }); for (let k = 0; k < 2; k++) pl = tours(pl, 2, [C('farm', 'plaine')]);
  check(pl.regions.plaine.batiments.farm === 4 && Batiments.occupes(pl, 'plaine') === 4 && !Tour.actionsDisponibles(pl).some(a => a.region === 'plaine' && a.id === 'farm'), 'régions : 4 emplacements en plaine, plus de place ensuite');
  check(Tour.actionsDisponibles(pl).some(a => a.region === 'plaine' && a.id === 'fort'), 'régions : le fort ne prend pas d\'emplacement');
  const ch = Tour.tourSuivant(vrai({ tresor: 5000 }), [C('farm', 'vallee')]);
  check(Batiments.occupes(ch, 'vallee') === 3 && !Tour.actionsDisponibles(Tour.tourSuivant(ch, [])).some(a => a.region === 'vallee' && a.id === 'farm'), 'régions : un chantier occupe sa place (Vallée : 2 fermes + 1 en chantier = 3 sur 3)');
}

// --- parties au hasard : invariants ---
{
  var guerres = 0;
  const nonFini = o => typeof o === 'number' ? !Number.isFinite(o) : !!o && typeof o === 'object' && Object.values(o).some(nonFini);
  const joueurHasard = (graine, coupe) => {
    let e = Etat.creerEtat(CHAMPS, graine); const r = Alea.creer(graine * 7919), traces = []; let viol = '';
    while (!e.fin) {
      if (coupe && e.tour === coupe) e = JSON.parse(JSON.stringify(e));
      const acts = [];
      for (let i = 0; i < 3; i++) {
        const d = Tour.actionsDisponibles(e);
        if (!d.length || Alea.suivant(r) < 0.4) break;
        const a = Alea.choisir(r, d);
        // ne garder que ce qui reste valable après les actions déjà choisies
        try { Tour.tourSuivant(e, acts.concat([a])); acts.push(a); } catch (err) { break; }
      }
      e = Tour.tourSuivant(e, acts);
      const cats = Object.keys(e.lois);
      if (cats.some(c => LOIS[e.lois[c].id].categorie !== c)) viol = 'loi hors de sa catégorie';
      if (e.debat && Lois.enVigueur(e, e.debat.id)) viol = 'loi en débat déjà en vigueur';
      if (!(e.familles > 0 && e.familles <= ECO.plafondFamilles)) viol = 'familles hors bornes';
      if (e.chantiers.some(c => c.restant <= 0)) viol = 'chantier fini resté dans la file';
      if (Object.keys(Object.assign({}, e.batiments, Batiments.totaux(e.regions))).some(k => (e.batiments[k] || 0) !== (Batiments.totaux(e.regions)[k] || 0))) viol = 'totaux des bâtiments faux';
      if (Object.keys(e.regions).some(r => e.chantiers.filter(c => c.region === r).length > 1 || Batiments.occupes(e, r) > e.regions[r].emplacements)) viol = 'région débordée';
      if (Object.values(e.factions).some(x => x.colere < 0 || x.colere > 100 || x.puissance < 0 || x.puissance > 100)) viol = 'colère ou puissance hors bornes';
      if (Object.values(e.factions).some(x => x.statut !== FAm.statutDe(x))) viol = 'statut de faction faux';
      if (!(e.moral >= 0 && e.moral <= 1)) viol = 'moral hors de 0-1';
      if (Object.values(e.nations).some(x => x.relation < -100 || x.relation > 100 || x.colere < 0 || x.colere > 100 || !(x.moral >= 0 && x.moral <= 1))) viol = 'nation hors bornes';
      if (e.guerre && (!e.guerre.ennemis.length || e.guerre.ennemis.some(n => e.guerre.allies.includes(n)) || e.guerre.allies.includes(e.guerre.ennemis[0]))) viol = 'camps de guerre incohérents';
      if (e.guerre) guerres++;
      if (new Set(e.contrats.map(c => c.id)).size !== e.contrats.length || new Set(e.traites.map(t => t.type + t.avec)).size !== e.traites.length) viol = 'contrat ou traité en double';
      if (nonFini(e)) viol = 'nombre non fini (NaN)';
      if (!egal(JSON.parse(JSON.stringify(e)), e)) viol = 'pas sérialisable';
      traces.push(JSON.stringify(e));
    }
    return { traces, viol, fin: e };
  };
  let viols = [], diff = 0, lois = 0, diplo = 0; guerres = 0;
  for (let g = 1; g <= 40; g++) {
    const a = joueurHasard(g), b = joueurHasard(g, 1 + g % 59);
    if (a.viol) viols.push(g + ' : ' + a.viol);
    if (!egal(a.traces, b.traces)) diff++;
    lois += Object.keys(a.fin.lois).length;
    diplo += a.fin.traites.length + a.fin.embargos.length + a.fin.contrats.length + (a.fin.reputation !== 0 ? 1 : 0);
  }
  check(!viols.length, 'parties au hasard (40 parties de 40 tours) : invariants tenus' + (viols.length ? ' — ' + viols.slice(0, 3).join(' ; ') : ''));
  check(diff === 0, 'parties au hasard : identiques après sauvegarde JSON à un tour quelconque');
  check(lois > 40, `parties au hasard : des lois sont bien adoptées (${(lois / 40).toFixed(1)} catégories remplies en moyenne)`);
  check(guerres > 40, `parties au hasard : des guerres ont lieu (${guerres} tours de guerre)`);
  check(diplo > 40, `parties au hasard : la diplomatie est jouée (${diplo} traités, embargos, contrats ou réputations non nulles en fin de partie)`);
  check(refuse(() => Tour.tourSuivant(Object.assign(neuf(), { fin: true }), [])), 'tour : une partie terminée ne joue plus');
}

// ===================== M2 : factions =====================
{
  const FA = P('moteur/factions.js'), { REGLES_FACTIONS: RF } = P('donnees/factions.js');
  const fac = (e, f) => e.factions[f];
  const ini = neuf();
  check(Object.values(ini.factions).every(x => x.statut === 'calme') && ini.moral === 1, 'factions : au départ toutes calmes, moral 1');

  // dissipation et effets par tour
  const un = (ids, mod) => Tour.tourSuivant(avecLois(ids, 1, mod), []);
  let e = un([]);
  check(fac(e, 'paysans').colere === 29 && fac(e, 'patrons').colere === 19, 'factions : la colère se dissipe de 1 par tour');
  e = tours(neuf(), 40);
  check(Object.values(e.factions).every(x => x.colere === 0), 'factions : la colère ne descend pas sous 0');
  e = un(['journee_huit_heures']);
  check(fac(e, 'ouvriers').colere === 32 && fac(e, 'paysans').colere === 29, 'journée de huit heures : les ouvriers −2 de colère par tour');
  e = un(['labor_medicine']);
  check(['paysans', 'ouvriers', 'artisans', 'patrons'].every(f => fac(e, f).colere === CHAMPS.joueur.factions[f].colere - 2), 'médecine du travail : −1 colère par tour pour toutes les factions');
  e = un(['unions']);
  check(fac(e, 'ouvriers').colere === 30 && fac(e, 'ouvriers').puissance === 28, 'syndicats : ouvriers −4 colère et +3 puissance par tour');
  check(fac(tours(avecLois(['unions'], 1), 10), 'ouvriers').puissance === 55 && fac(tours(avecLois(['unions'], 1), 15), 'ouvriers').puissance === 55, 'syndicats : +3 puissance pendant 10 tours seulement (25 → 55)');

  // chocs : chaque loi change exactement ce que disent les données
  let ok = true;
  for (const id in LOIS) {
    const x = neuf(), avant = JSON.parse(JSON.stringify(x.factions)); FA.choc(x, id);
    const c = LOIS[id].factions.chocs || {};
    for (const f in x.factions) for (const j of ['colere', 'puissance'])
      if (x.factions[f][j] !== Math.max(0, Math.min(100, avant[f][j] + ((c[f] || {})[j] || 0)))) ok = false;
  }
  check(ok, 'chocs de lois : conformes aux données pour toutes les lois');
  const adop = tours(neuf(), 3, [{ type: 'loi', id: 'income_progressive' }]);
  check(fac(adop, 'patrons').colere === 20 - 3 + 5, 'chocs de lois : appliqués au tour de l\'adoption (impôt progressif, patrons +5)');
  const choc = (enVigueur, id) => { const x = avecLois(enVigueur); FA.choc(x, id); return x; };
  check(fac(choc(['suffrage_census'], 'income_capital'), 'patrons').colere === 30 && fac(choc(['suffrage_census'], 'income_capital'), 'artisans').colere === 30, 'suffrage censitaire : hausses de colère des élites 2× plus lentes (+20 → +10, +10 → +5)');
  check(fac(choc(['suffrage_universal'], 'school_free'), 'paysans').colere === 34 && fac(choc(['suffrage_universal'], 'army_conscription'), 'ouvriers').colere === 37.5, 'suffrage universel : hausses de colère des populaires 2× plus lentes');
  check(fac(choc(['suffrage_universal'], 'army_conscription'), 'ouvriers').puissance === 35 && fac(choc(['suffrage_universal'], 'army_professional'), 'ouvriers').colere === 30, 'suffrage : ni la puissance ni les baisses de colère ne sont ralenties');
  check(fac(choc(['suffrage_universal'], 'income_capital'), 'patrons').colere === 40, 'suffrage universel : les élites ne sont pas ralenties');

  // apaisement
  const ap = Tour.tourSuivant(neuf(), [{ type: 'apaiser', id: 'ouvriers' }]);
  check(fac(ap, 'ouvriers').colere === 35 - 18 - 1 && proche(ap.tresor, 200 - 12 + 26.5), 'apaisement : −18 colère pour 12 or');
  check(refuse(() => Tour.tourSuivant(neuf(), [{ type: 'apaiser', id: 'ouvriers' }, { type: 'apaiser', id: 'ouvriers' }])), 'apaisement : une fois par faction et par tour');
  check(fac(Tour.tourSuivant(ap, [{ type: 'apaiser', id: 'ouvriers' }]), 'ouvriers').colere === 0, 'apaisement : de nouveau possible au tour suivant ; la colère reste ≥ 0');
  const u = avecLois(['suffrage_universal']), c2 = avecLois(['suffrage_census']);
  check(FA.coutApaisement(u, 'paysans') === 6 && FA.coutApaisement(u, 'ouvriers') === 6 && FA.coutApaisement(u, 'patrons') === 12 && FA.coutApaisement(c2, 'patrons') === 6 && FA.coutApaisement(c2, 'artisans') === 6 && FA.coutApaisement(c2, 'ouvriers') === 12, 'apaisement : à moitié prix pour les factions favorisées par le suffrage');
  check(!FA.apaisables(neuf({ tresor: 11 })).length && FA.apaisables(neuf({ tresor: 12 })).length === 4, 'apaisement : refusé si le trésor ne suffit pas');
  const zero = neuf(); zero.factions.paysans.colere = 0;
  check(!FA.apaisables(zero).includes('paysans'), 'apaisement : pas proposé à une faction sans colère');

  // bornes, statuts
  const haut = neuf(); FA.modifier(haut, 'patrons', 'colere', 500); FA.modifier(haut, 'patrons', 'puissance', 500);
  check(fac(haut, 'patrons').colere === 100 && fac(haut, 'patrons').puissance === 100, 'factions : colère et puissance plafonnées à 100');
  const st = (colere, puissance) => FA.statutDe({ colere, puissance });
  check(st(54, 50) === 'calme' && st(55, 50) === 'grondement' && st(74, 50) === 'grondement' && st(75, 50) === 'greve' && st(100, 50) === 'revolution', 'statuts : seuils 55 grondement, 75 grève, 100 révolution');
  check(st(70, 85) === 'revolte' && st(69, 85) === 'grondement' && st(70, 84) === 'grondement' && st(100, 90) === 'revolution', 'statuts : révolte si puissance ≥ 85 et colère ≥ 70');

  // moral
  const mf = (colere, puissance) => { const x = { colere, puissance }; x.statut = FA.statutDe(x); return FA.moralFaction(x); };
  check(mf(0, 50) === 1 && mf(40, 50) === 1 && proche(mf(70, 50), 0.5) && proche(mf(74, 50), 26 / 60) && mf(80, 90) === 0, 'moral : 1 jusqu\'à colère 40, linéaire jusqu\'à 0 à 100, révolte 0');
  check(proche(mf(75, 50), Math.min(0.5, 25 / 60)), 'moral : grève plafonnée à 0,5');
  const mo = neuf(); mo.factions.ouvriers.colere = 70; FA.evaluer(mo);
  check(Math.abs(mo.moral - (40 + 25 * 0.5 + 30 + 45) / 140) < 1e-4, 'moral du pays : moyenne pondérée par la puissance');

  // conséquences des statuts
  const greve = (f, colere, puissance, mod) => { const x = neuf(mod); x.factions[f].colere = colere; if (puissance) x.factions[f].puissance = puissance; FA.evaluer(x); return Economie.bilan(x); };
  check(greve('paysans', 80).production.grain === 40 && greve('ouvriers', 80).production.fer === 7.5 && greve('artisans', 80, 0, { batiments: { workshop: 1, weaving: 1 } }).production.outils === 5, 'grève : les bâtiments de la faction produisent moitié moins');
  check(proche(greve('patrons', 80).impots, 64), 'grève des patrons : impôts ×0,8');
  check(greve('paysans', 80, 90).production.grain === 0 && proche(greve('patrons', 80, 90).impots, 40), 'révolte : bâtiments arrêtés ; patrons : impôts ×0,5');
  const g0 = neuf(); g0.factions.paysans.colere = 80; FA.evaluer(g0);
  const g1 = Tour.tourSuivant(g0, [{ type: 'apaiser', id: 'paysans' }]);
  check(g1.bilan.production.grain === 40 && g1.factions.paysans.statut === 'grondement' && Tour.tourSuivant(g1, []).bilan.production.grain === 80, 'grève : levée au tour suivant l\'apaisement (statut calculé en fin de tour)');
  const avecColere = (f, c, mod) => { const x = neuf(mod); x.factions[f].colere = c; FA.evaluer(x); return x; };
  const rv1 = Tour.tourSuivant(avecColere('paysans', 99), []);
  const rv2 = Tour.tourSuivant(avecColere('paysans', 93, { debat: { id: 'school_free', depuis: -1 } }), []);
  check(!rv1.fin && rv2.fin && rv2.issue.type === 'revolution' && rv2.issue.faction === 'paysans' && refuse(() => Tour.tourSuivant(rv2, [])), 'révolution : la colère touche 100 (école gratuite, paysans 93 + 8) = partie perdue, même redescendue à 99 en fin de tour ; à 99 rien');
  check(rv2.journal.some(t => /Révolution/.test(t)), 'révolution : annoncée dans le journal');
  check(tours(neuf(), 40).issue.type === 'fin', 'fin de partie normale après 40 tours');
}

// ===================== M3a : diplomatie et commerce =====================
{
  const DP = P('moteur/diplomatie.js'), D = P('donnees/diplomatie.js');
  const avecRel = (rels, mod) => { const e = neuf(mod); for (const n in rels) e.nations[n].relation = rels[n]; return e; };
  const dispo = (e, a) => Tour.actionsDisponibles(e).some(d => JSON.stringify(Object.entries(d).sort()) === JSON.stringify(Object.entries(a).sort()));
  const n0 = neuf();
  check(n0.nations.val_roc.colere === 30 && n0.nations.val_roc.moral === 1 && n0.profils.brume.taux === 1.3, 'nations : colère, moral et profil de départ');
  const t1 = Tour.tourSuivant(neuf(), []);
  check(t1.nations.val_roc.tresor === 475 && t1.nations.brume.tresor === 691 && t1.nations.contreforts.tresor === 164, 'nations : trésor += familles × taux − 3 par régiment, moins les recrues (Brume et Contreforts : +1 régiment, 30 or)');
  check(t1.nations.brume.familles === 100.5 && t1.nations.val_roc.colere === 29, 'nations : familles +0,5 %/tour, colère −1/tour');
  const mn = c => DP.moralNation(c);
  check(mn(40) === 1 && proche(mn(70), 0.5) && mn(100) === 0, 'nations : moral par la formule des factions');

  // dons
  const d1 = Tour.tourSuivant(neuf(), [{ type: 'don', id: 'brume', montant: 20 }, { type: 'don', id: 'val_roc', montant: 100 }]);
  check(d1.nations.brume.relation === 24 && d1.nations.val_roc.relation === 0 && d1.reputation === 6 && proche(d1.tresor, 200 - 120 + 26.5), 'dons : relation +1 par 5 or, réputation +1 par 20 or (max +5), payés par le trésor');
  check(Tour.tourSuivant(neuf(), [{ type: 'don', id: 'brume', montant: 50 }]).reputation === 2, 'dons : 50 or = +2 de réputation');
  check(refuse(() => Tour.tourSuivant(neuf(), [{ type: 'don', id: 'brume', montant: 20 }, { type: 'don', id: 'brume', montant: 20 }])), 'dons : un par nation et par tour');
  check(refuse(() => Tour.tourSuivant(neuf(), [{ type: 'don', id: 'brume', montant: 30 }])) && refuse(() => Tour.tourSuivant(neuf({ tresor: 99 }), [{ type: 'don', id: 'brume', montant: 100 }])), 'dons : 20, 50 ou 100 or seulement, si le trésor suffit');
  check(refuse(() => Tour.tourSuivant(neuf(), [{ type: 'don', id: 'brume', montant: 20, bonus: 1 }])), 'actions : un champ en trop est refusé');
  let rb = avecRel({ brume: 95 }, { tresor: 1000 });
  rb = Tour.tourSuivant(rb, [{ type: 'don', id: 'brume', montant: 100 }]);
  check(rb.nations.brume.relation === 100, 'relations : plafonnées à +100');

  // contrats
  check(!dispo(neuf(), { type: 'contrat', id: 'val_roc_grain' }) && dispo(avecRel({ val_roc: 0 }), { type: 'contrat', id: 'val_roc_grain' }), 'contrats : acceptés si la relation est ≥ 0');
  const c1 = Tour.tourSuivant(neuf(), [{ type: 'contrat', id: 'brume_tissu' }]);
  check(c1.nations.brume.relation === 25 && c1.contrats.length === 1, 'contrats : relation +5');
  check(c1.bilan.balance.tissu === -8 && proche(c1.bilan.contrats, -16) && proche(c1.bilan.achats, 8 * 3 + 16) && proche(c1.bilan.solde, 16.5 - 40 - 16 + 80), 'contrats : 10 tissu reçus à 1,6, le reste du déficit au marché (tissu à 3 pendant la crise)');
  const v1 = Tour.tourSuivant(avecRel({ val_roc: 0 }), [{ type: 'contrat', id: 'val_roc_grain' }]);
  check(v1.bilan.balance.grain === -10 && proche(v1.bilan.contrats, 13), 'contrats de vente : 10 grain livrés à 1,3, achetés au marché s\'ils manquent');
  const c10 = tours(neuf(), 10, [{ type: 'contrat', id: 'brume_tissu' }]);
  check(c10.contrats.length === 0 && tours(neuf(), 9, [{ type: 'contrat', id: 'brume_tissu' }]).contrats.length === 1 && tours(neuf(), 10, [{ type: 'contrat', id: 'brume_tissu' }]).bilan.contrats === -16, 'contrats : 10 tours, puis terminés');
  check(!dispo(c1, { type: 'contrat', id: 'brume_tissu' }), 'contrats : pas deux fois le même en même temps');

  // embargo
  const fermes = (mod) => neuf(Object.assign({ batiments: { farm: 6, mine: 1 } }, mod));
  const em = Tour.tourSuivant(fermes(), [{ type: 'embargo', id: 'val_roc' }]);
  check(em.nations.val_roc.relation === -50 && em.reputation === -5, 'embargo : relation −30, réputation −5 (sanction illégitime hors guerre)');
  check(em.nations.val_roc.manque === 15 && em.nations.val_roc.colere === 30 - 1 + 5 && em.nations.val_roc.tresor === 475 - 15, 'embargo : la cible manque du grain que le joueur a en trop (15) : colère +5, trésor −15');
  const em0 = Tour.tourSuivant(neuf(), [{ type: 'embargo', id: 'val_roc' }]);
  check(em0.nations.val_roc.manque === 0 && em0.nations.val_roc.colere === 29, 'embargo : sans surplus du joueur, il ne coûte rien à la cible');
  const ec = Tour.tourSuivant(neuf(), [{ type: 'contrat', id: 'brume_tissu' }, { type: 'embargo', id: 'brume' }]);
  check(ec.contrats.length === 0 && !dispo(ec, { type: 'contrat', id: 'brume_tissu' }), 'embargo : annule les contrats avec la cible, plus de contrat ni de traité');
  const el = Tour.tourSuivant(em, [{ type: 'lever_embargo', id: 'val_roc' }]);
  check(!el.embargos.length && el.nations.val_roc.manque === undefined, 'embargo : levé');
  check(DP.legitime(Object.assign(neuf(), { guerre: { ennemis: ['val_roc'], allies: [] } }), 'val_roc') && !DP.legitime(neuf(), 'val_roc'), 'embargo : légitime contre un ennemi en guerre (M3b)');

  // traités
  const b30 = avecRel({ brume: 30 });
  check(!dispo(neuf(), { type: 'traite', id: 'entente', avec: 'brume' }) && dispo(b30, { type: 'traite', id: 'entente', avec: 'brume' }), 'Entente des Ports : relation ≥ 30');
  const en = Tour.tourSuivant(b30, [{ type: 'traite', id: 'entente', avec: 'brume' }]);
  check(en.nations.brume.relation === 40 && en.reputation === 3, 'traités : relation +10, réputation +3');
  check(proche(en.bilan.ventes, 16.5 * 1.1) && proche(en.bilan.achats, 70 * 0.9), 'Entente des Ports : ventes +10 %, achats −10 %');
  check(!dispo(avecRel({ brume: 49 }), { type: 'traite', id: 'defense_mutuelle', avec: 'brume' }) && dispo(avecRel({ brume: 50 }), { type: 'traite', id: 'defense_mutuelle', avec: 'brume' }), 'défense mutuelle : relation ≥ 50');
  check(!dispo(b30, { type: 'traite', id: 'filature', avec: 'brume' }) && dispo(en, { type: 'traite', id: 'filature', avec: 'brume' }) && dispo(Object.assign(avecRel({ contreforts: 90 }), { traites: [{ type: 'entente', avec: 'contreforts', depuis: 1 }] }), { type: 'traite', id: 'filature', avec: 'contreforts' }), 'filature conjointe : Entente requise, avec n\'importe quelle nation');
  check(!Tour.actionsDisponibles(en).some(a => a.id === 'entente_mill'), 'filature : pas de bâtiment sans le traité');
  let fi = Tour.tourSuivant(en, [{ type: 'traite', id: 'filature', avec: 'brume' }]);
  check(dispo(fi, { type: 'construire', id: 'entente_mill', region: 'essai' }), 'filature : bâtiment constructible avec le traité');
  const avant = fi.tresor; fi = Tour.tourSuivant(fi, [{ type: 'construire', id: 'entente_mill', region: 'essai' }]);
  check(proche(fi.tresor, avant - 50 + fi.bilan.solde), 'filature : le joueur paie 50 or sur 100');
  fi = tours(fi, 6);
  check(fi.batiments.entente_mill === 1 && fi.bilan.production.tissu === 18 && proche(fi.bilan.contrats, 6), 'filature : +18 tissu, dont 6 livrés à Brume à 1 or');
  const r10 = tours(b30, 11, [{ type: 'traite', id: 'entente', avec: 'brume' }]);
  check(r10.reputation === 3 + 2 && tours(b30, 10, [{ type: 'traite', id: 'entente', avec: 'brume' }]).reputation === 3, 'traités : respectés, +2 de réputation tous les 10 tours');
  const ro = Tour.tourSuivant(fi, [{ type: 'rompre', id: 'entente', avec: 'brume' }]);
  check(!ro.traites.length && ro.reputation === fi.reputation - 30 && proche(ro.bilan.contrats, 0), 'rompre : −15 par traité ; rompre l\'Entente rompt aussi la filature (plus de livraison)');
  check(!Tour.actionsDisponibles(Object.assign(Tour.tourSuivant(ro, []), { tresor: 1000 })).some(a => a.id === 'entente_mill') && Tour.tourSuivant(ro, []).batiments.entente_mill === 1, 'rompre : la filature construite reste (tout son tissu va au marché), plus d\'autre à construire');
  const pa = avecRel({ brume: 90, val_roc: 90 }, { reputation: -51 });
  check(!Tour.actionsDisponibles(pa).some(a => a.type === 'traite' || a.type === 'contrat') && Tour.actionsDisponibles(Object.assign(pa, { reputation: -50 })).some(a => a.type === 'traite'), 'paria : sous −50 de réputation, plus aucun traité ni contrat');
}

// ===================== M3b et V2 étape 2 : armée en régiments, guerre et paix =====================
{
  const GU = P('moteur/guerre.js'), G = P('donnees/guerre.js'), DPm = P('moteur/diplomatie.js');
  const rng = s => Alea.creer(s);
  const enGuerre = (e, cible, agresseur, s) => { GU.declarer(e, cible, agresseur, rng(s || 1)); e.journal = []; return e; };
  const seul = e => { e.guerre.ennemis = ['val_roc']; e.guerre.allies = []; return e; };
  const ok2 = (e, a) => Tour.actionsDisponibles(e).some(d => JSON.stringify(Object.entries(d).sort()) === JSON.stringify(Object.entries(a).sort()));
  const caserne = (mod, regions) => { const e = vrai(mod); for (const r of regions || ['bourg']) e.regions[r].batiments.caserne = 1; e.batiments = Batiments.totaux(e.regions); return e; };

  // force
  const fj = (reg, lois, mod) => GU.force(Object.assign(vrai(Object.assign({ regiments: reg }, mod)), { lois: Object.fromEntries((lois || []).map(id => [LOIS[id].categorie, { id, depuis: 1 }])) }), 'joueur');
  check(fj(10) === 10 && fj(10, ['army_professional']) === 13 && fj(10, ['army_conscription']) === 16, 'force : régiments × loi militaire (milice ×1, métier ×1,3, conscription ×1,6)');
  check(fj(10, [], { moral: 0.5 }) === 5 && fj(10, [], { tresor: -500 }) === 10 && fj(10, [], { tresor: 99999 }) === 10, 'force : × moral ; le trésor ne compte plus');
  const ft = vrai(); ft.regions.plaine.batiments.fort = 1;
  check(GU.force(ft, 'joueur', 'plaine') === 4.5 && GU.force(ft, 'joueur', 'vallee') === 3 && GU.force(ft, 'joueur') === 3, 'fort : défense de sa région ×1,5, nulle part ailleurs');
  check(GU.force(vrai(), 'val_roc') === 8 && GU.force(vrai(), 'brume') === 3 && GU.force(vrai(), 'contreforts') === 2.6, 'force d\'une nation : régiments × loi militaire × moral (Val-Roc 5 × 1,6)');
  check(vrai().regiments === 3 && vrai().nations.val_roc.regiments === 5, 'départ : 3 régiments pour nous, 5 pour Val-Roc, 3 pour Brume, 2 pour Contreforts');

  // recrutement et entretien
  const sansCaserne = vrai({ tresor: 1000 }); delete sansCaserne.regions.bourg.batiments.caserne;
  check(!Tour.actionsDisponibles(sansCaserne).some(a => a.type === 'recruter') && ok2(vrai({ tresor: 1000 }), { type: 'recruter', region: 'bourg' }), 'recrutement : une caserne est nécessaire (une au Bourg au départ)');
  const rc = Tour.tourSuivant(caserne({ tresor: 1000 }), [{ type: 'recruter', region: 'bourg' }]);
  check(rc.regiments === 4 && refuse(() => Tour.tourSuivant(caserne({ tresor: 1000 }), [{ type: 'recruter', region: 'bourg' }, { type: 'recruter', region: 'bourg' }])), 'recrutement : 1 régiment par caserne et par tour');
  check(Tour.tourSuivant(caserne({ tresor: 1000 }, ['bourg', 'vallee']), [{ type: 'recruter', region: 'bourg' }, { type: 'recruter', region: 'vallee' }]).regiments === 5, 'recrutement : deux casernes, deux régiments');
  check(!ok2(caserne({ tresor: 1000, regiments: 8 }), { type: 'recruter', region: 'bourg' }) && ok2(caserne({ tresor: 1000, regiments: 7 }), { type: 'recruter', region: 'bourg' }), 'recrutement : au plus 1 régiment pour 10 familles (8 au départ)');
  check(!ok2(caserne({ tresor: 29 }), { type: 'recruter', region: 'bourg' }), 'recrutement : 30 or');
  const b0 = Economie.bilan(vrai()), b5 = Economie.bilan(vrai({ regiments: 5 }));
  check(b0.entretiens === 9 && b5.entretiens === 15, 'régiments : 3 or d\'entretien par tour chacun');
  check(Object.keys(BAT).includes('caserne') && BAT.caserne.cout === 60 && BAT.caserne.delai === 2 && BAT.fort.cout === 80 && BAT.fort.delai === 3 && !BAT.forge && !BAT.fortifications, 'bâtiments : caserne (60 or, 2 tours) et fort (80 or, 3 tours) remplacent forge et fortifications');
  const f1 = Tour.tourSuivant(vrai({ tresor: 1000 }), [{ type: 'construire', id: 'fort', region: 'plaine' }]);
  check(!ok2(Object.assign(JSON.parse(JSON.stringify(f1)), { chantiers: [], regions: Object.assign(JSON.parse(JSON.stringify(f1.regions)), { plaine: Object.assign({}, f1.regions.plaine, { batiments: { farm: 2, fort: 1 } }) }) }), { type: 'construire', id: 'fort', region: 'plaine' }), 'fort : un seul par région');
  // nations
  const nr = vrai(); DPm.tour(nr);
  check(nr.nations.val_roc.tresor === 400 + 90 - 15 && nr.nations.brume.tresor === 600 + 130 - 9 && nr.nations.contreforts.tresor === 150 + 50 - 6, 'nations : trésor += familles × taux − 3 par régiment');
  const no = vrai({ occupations: { hauts: 'joueur' } }); DPm.tour(no);
  check(no.nations.val_roc.tresor === 400 + 60 - 15, 'nations : une région occupée sur 3 retire un tiers du revenu');
  const nrec = vrai(); GU.tour(nrec, rng(99)); nrec.guerre = null;
  check(nrec.nations.val_roc.regiments === 7 && nrec.nations.brume.regiments === 4 && nrec.nations.contreforts.regiments === 3, 'nations : recrutent avec leur or selon leur caractère (Val-Roc +2 par tour, Brume +1, Contreforts +1)');
  let vr = vrai({}); for (const n in vr.nations) { vr.nations[n].tresor = 5000; vr.nations[n].relation = 0; } for (let k = 0; k < 8; k++) { GU.tour(vr, rng(k)); vr.guerre = null; }
  check(vr.nations.val_roc.regiments === 9 && vr.nations.brume.regiments === 5 && vr.nations.contreforts.regiments === 4, 'nations : jusqu\'à leur cible (Val-Roc au plafond de 9, Brume la moitié, Contreforts 70 %)');

  // déclaration du joueur
  const d1 = Tour.tourSuivant(neuf(), [{ type: 'declarer_guerre', id: 'contreforts' }]);
  check(d1.guerre && d1.guerre.ennemis[0] === 'contreforts' && d1.reputation === -20 && d1.nations.contreforts.relation === -100, 'déclarer la guerre : réputation −20 (agression), relation −100');
  check(!Tour.actionsDisponibles(d1).some(a => a.type === 'declarer_guerre'), 'guerre : une seule à la fois');
  const em = Tour.tourSuivant(d1, [{ type: 'embargo', id: 'contreforts' }]);
  check(em.reputation === -20 + 3, 'embargo : sanction légitime (+3) contre un ennemi en guerre');
  const ent = neuf({ traites: [{ type: 'entente', avec: 'brume', depuis: 1 }, { type: 'entente', avec: 'contreforts', depuis: 1 }, { type: 'defense_mutuelle', avec: 'contreforts', depuis: 1 }], contrats: [{ id: 'brume_tissu', jusqua: 9 }] });
  ent.nations.brume.relation = 60;
  const at = Tour.tourSuivant(ent, [{ type: 'declarer_guerre', id: 'contreforts' }]);
  check(at.reputation === -30 - 15 - 15, 'attaquer un membre de l\'Entente : −30 (au lieu de −20), et ses traités avec nous rompus (−15 chacun)');
  check(!at.traites.length && !at.contrats.length && at.nations.brume.relation === 30 && at.sanctions.some(s => s.par === 'brume' && s.contre === 'joueur'), 'sanctions de bloc : les autres membres rompent avec nous (traités, contrats, relation −30, embargo)');

  // déclarations des nations
  const declare = (mod, s, rel, regBrume) => { const e = vrai(Object.assign({ tour: 6 }, mod)); if (rel != null) e.nations.val_roc.relation = rel; if (regBrume) e.nations.brume.regiments = regBrume; GU.tour(e, rng(s)); return e.guerre; };
  let k = 0; for (let s = 1; s <= 400; s++) if (declare({}, s)) k++;
  check(k > 400 * 0.24 && k < 400 * 0.36, `un belliqueux (Val-Roc) déclare la guerre une fois sur trois environ quand il est 1,2× plus fort et pas notre ami (${k}/400)`);
  check([1, 2, 3, 4, 5, 6, 7, 8].every(s => !declare({}, s, 20) && !declare({ regiments: 20 }, s) && !declare({ tour: 5 }, s)), 'un belliqueux ne déclare rien avant le tour 6, si la relation est ≥ 20, ou s\'il n\'est pas 1,2× plus fort');
  check([1, 2, 3, 4, 5, 6, 7, 8].every(s => !declare({ traites: [{ type: 'defense_mutuelle', avec: 'brume', depuis: 1 }] }, s, null, 8)), 'la défense mutuelle compte dans la force qui dissuade');
  check([1, 2, 3, 4, 5, 6, 7, 8].every(s => { const e = vrai({ tour: 10 }); e.nations.brume.relation = -90; e.nations.contreforts.relation = -90; GU.tour(e, rng(s)); return !e.guerre || e.guerre.ennemis[0] === 'val_roc'; }), 'un marchand et un opportuniste ne déclarent jamais la guerre');
  const dm = enGuerre(vrai({ traites: [{ type: 'defense_mutuelle', avec: 'brume', depuis: 1 }, { type: 'entente', avec: 'brume', depuis: 1 }] }), 'val_roc', 'val_roc');
  check(dm.guerre.allies.includes('brume') && dm.sanctions.some(s => s.par === 'brume' && s.contre === 'val_roc'), 'défense mutuelle : Brume entre en guerre à nos côtés ; l\'Entente met l\'agresseur sous embargo');
  let contreNous = 0; for (let s = 1; s <= 300; s++) { const e = enGuerre(vrai(), 'val_roc', 'val_roc', s); if (e.guerre.ennemis.includes('contreforts')) contreNous++; }
  check(contreNous > 120 && contreNous < 180, `Contreforts rejoint le camp le plus fort une fois sur deux (ici Val-Roc : ${contreNous}/300)`);
  let rej = 0; for (let s = 1; s <= 300; s++) { const e = vrai({ regiments: 20 }); e.nations.contreforts.relation = 0; GU.declarer(e, 'val_roc', 'val_roc', rng(s)); if (e.guerre.allies.includes('contreforts')) rej++; }
  check(rej > 120 && rej < 180, `Contreforts nous rejoint si nous sommes les plus forts et que la relation est ≥ 0 (${rej}/300)`);

  // batailles et occupation
  check(egal(GU.cibles(seul(enGuerre(vrai(), 'val_roc', 'joueur')), ['joueur'], ['val_roc']), ['hauts', 'forges', 'marches']), 'bataille : on vise une région de l\'ennemi');
  check(ok2(seul(enGuerre(vrai(), 'val_roc', 'joueur')), { type: 'bataille', cible: 'hauts' }) && !ok2(seul(enGuerre(vrai(), 'val_roc', 'joueur')), { type: 'bataille' }), 'bataille : l\'action nomme sa cible');
  let gagne = 0; const N = 4000;
  for (let s = 1; s <= N; s++) { const e = seul(enGuerre(vrai({ regiments: 15 }), 'val_roc', 'joueur')); if (GU.bataille(e, true, 'hauts', rng(s))) gagne++; }
  check(Math.abs(gagne / N - 15 / 23) < 0.025, `bataille : l'attaquant gagne avec la probabilité Fa / (Fa + Fd) (15 contre 8 : ${(gagne / N).toFixed(3)} pour ${(15 / 23).toFixed(3)})`);
  let def = null, vic = null;
  for (let s = 1; s < 80 && !(def && vic); s++) { const e = seul(enGuerre(vrai({ regiments: 4 }), 'val_roc', 'joueur')); if (GU.bataille(e, true, 'hauts', rng(s))) vic = vic || e; else def = def || e; }
  const dc = G.defaite.colere;
  check(def.regiments === 3 && def.nations.val_roc.regiments === 5 && !def.occupations.hauts && Object.values(def.factions).every((x, i) => x.colere === Object.values(CHAMPS.joueur.factions)[i].colere + dc), 'défaite : −25 % de régiments (arrondi au-dessus), +5 de colère, pas d\'occupation');
  check(vic.occupations.hauts === 'joueur' && vic.nations.val_roc.regiments === 3 && vic.regiments === 4 && vic.nations.val_roc.colere === 30 + dc, 'victoire : la région est occupée ; l\'ennemi perd 25 % de ses régiments et prend +5 de colère ; le vainqueur perd 10 % (arrondi en dessous)');
  const oc = vrai({ occupations: { plaine: 'val_roc' } });
  check(Economie.bilan(oc).production.grain === 40 && !Tour.actionsDisponibles(Object.assign(oc, { tresor: 1000 })).some(a => a.region === 'plaine'), 'occupation : la région ne produit plus et on ne peut plus y construire');
  const ch = vrai({ occupations: { vallee: 'val_roc' }, chantiers: [{ id: 'farm', region: 'vallee', restant: 2 }] }); Batiments.avancer(ch);
  check(ch.chantiers[0].restant === 2, 'occupation : le chantier de la région s\'arrête');
  const lib = seul(enGuerre(vrai({ regiments: 40, occupations: { plaine: 'val_roc' } }), 'val_roc', 'val_roc'));
  check(GU.cibles(lib, ['joueur'], ['val_roc']).includes('plaine') && GU.bataille(lib, true, 'plaine', rng(1)) && !lib.occupations.plaine, 'libération : on peut reprendre une de nos régions occupées');
  const ia = seul(enGuerre(vrai(), 'val_roc', 'val_roc')); ia.regions.plaine.batiments.fort = 1; GU.tour(ia, rng(3));
  check(ia.guerre.bataille === 1 && ia.journal.some(t => /Bataille pour (?!Plaine)/.test(t)), 'l\'ennemi plus fort attaque une région sans fort');
  const iaLib = seul(enGuerre(vrai({ occupations: { hauts: 'joueur' } }), 'val_roc', 'val_roc')); GU.tour(iaLib, rng(3));
  check(iaLib.journal.some(t => /Bataille pour Hauts-Rocs/.test(t)), 'l\'ennemi cherche d\'abord à libérer ses régions');
  const faible = seul(enGuerre(vrai({ regiments: 20 }), 'val_roc', 'val_roc')); GU.tour(faible, rng(3));
  check(faible.guerre.bataille === null, 'l\'ennemi n\'attaque pas s\'il est plus faible');
  check(refuse(() => Tour.tourSuivant(seul(enGuerre(neuf({ regiments: 9 }), 'val_roc', 'joueur')), [{ type: 'bataille', cible: 'hauts' }, { type: 'bataille', cible: 'forges' }])), 'bataille : une par tour et par guerre');

  // capitulation et paix
  const cap = seul(enGuerre(vrai({ regiments: 20, embargos: ['val_roc'] }), 'val_roc', 'val_roc'));
  cap.nations.val_roc.colere = 90; cap.nations.val_roc.moral = DPm.moralNation(90); cap.nations.val_roc.tresor = 2000;
  GU.tour(cap, rng(1));
  check(cap.guerre.capitulation === 'ennemi', 'usure : un ennemi dont le moral passe sous 0,3 capitule');
  check(Tour.actionsDisponibles(cap).filter(a => a.type === 'imposer_paix').length === 8 && !Tour.actionsDisponibles(cap).some(a => a.type === 'bataille'), 'capitulation : clauses au choix (8 combinaisons sans région occupée), plus de bataille');
  const cap0 = seul(enGuerre(vrai({ regiments: 5, occupations: { hauts: 'joueur' } }), 'val_roc', 'val_roc')); cap0.nations.val_roc.regiments = 0; cap0.nations.val_roc.tresor = 0;
  GU.tour(cap0, rng(1));
  check(cap0.guerre.capitulation === 'ennemi' && Tour.actionsDisponibles(cap0).filter(a => a.type === 'imposer_paix').length === 16, 'capitulation : sans régiment et avec une région occupée ; 16 combinaisons avec la cession');
  const pa = Tour.tourSuivant(cap, [{ type: 'imposer_paix', reparations: true, lever_embargo: true, non_rearmement: true, cession: false }]);
  check(!pa.guerre && pa.nonRearmement.val_roc === 16 && !pa.embargos.length && pa.journal.some(t => /Réparations : 300 or/.test(t)), 'paix : réparations plafonnées à 300 or, embargo levé, non-réarmement 15 tours');
  const ce = Tour.tourSuivant(cap0, [{ type: 'imposer_paix', reparations: false, lever_embargo: false, non_rearmement: false, cession: true }]);
  check(ce.regions.hauts && ce.regions.hauts.terrain === 'filons' && ce.regions.hauts.emplacements === 3 && !ce.profils.val_roc.regions.hauts && !ce.occupations.hauts, 'cession : la région occupée devient nôtre (3 emplacements, son terrain)');
  check(Tour.actionsDisponibles(Object.assign(JSON.parse(JSON.stringify(ce)), { tresor: 1000 })).some(a => a.id === 'mine' && a.region === 'hauts'), 'cession : on peut construire dans la région gagnée');
  const nous = seul(enGuerre(vrai({ moral: 0.25, tresor: 800, embargos: ['val_roc'], occupations: { plaine: 'val_roc', vallee: 'val_roc' } }), 'val_roc', 'val_roc'));
  nous.regions.plaine.batiments.fort = 1;
  GU.tour(nous, rng(1));
  check(!nous.guerre && nous.tresor === 600 && !nous.embargos.length && nous.nonRearmement.joueur === 16, 'notre moral sous 0,3 : nous capitulons, l\'ennemi impose toutes les clauses');
  check(!nous.regions.plaine && nous.profils.val_roc.regions.plaine && nous.batiments.farm === 2 && !nous.batiments.fort && !nous.occupations.vallee, 'cession contre nous : la région la plus riche (Plaine : 2 fermes et un fort) est perdue avec ses bâtiments ; les autres sont rendues');
  const desarme = caserne({ tresor: 5000, nonRearmement: { joueur: 16 } });
  check(!Tour.actionsDisponibles(desarme).some(a => /^army_/.test(a.id) || a.type === 'recruter') && Tour.actionsDisponibles(Object.assign(desarme, { tour: 17 })).some(a => a.type === 'recruter'), 'non-réarmement : ni loi militaire ni recrutement pendant 15 tours');
  let pb = seul(enGuerre(vrai({ regiments: 20 }), 'val_roc', 'joueur'));
  pb = tours(pb, 4);
  check(pb.guerre && !ok2(pb, { type: 'paix_blanche' }) && ok2(Tour.tourSuivant(pb, []), { type: 'paix_blanche' }), 'paix blanche : proposée après 5 tours sans bataille');
  const pf = seul(enGuerre(vrai({ regiments: 1 }), 'val_roc', 'joueur')); pf.tour = 6;
  check(!ok2(pf, { type: 'paix_blanche' }), 'paix blanche : refusée par un ennemi plus fort');
  const pbo = Tour.tourSuivant(pb, []); pbo.occupations = { forges: 'joueur' };
  const fin = Tour.tourSuivant(pbo, [{ type: 'paix_blanche' }]);
  check(!fin.guerre && !fin.sanctions.length && !Object.keys(fin.occupations).length && fin.profils.val_roc.regions.forges, 'paix blanche : sans clause ; régions occupées rendues');
  // trêve après la paix
  const tr = Tour.tourSuivant(pb, []), tr1 = Tour.tourSuivant(tr, [{ type: 'paix_blanche' }]);
  check(tr1.treves.val_roc === tr.tour + 10 && !ok2(tr1, { type: 'declarer_guerre', id: 'val_roc' }) && ok2(tr1, { type: 'declarer_guerre', id: 'brume' }), 'trêve : 10 tours sans pouvoir redéclarer la guerre à l\'ancien ennemi');
  const finTreve = Object.assign(JSON.parse(JSON.stringify(tr1)), { tour: tr1.treves.val_roc + 1 });
  check(ok2(finTreve, { type: 'declarer_guerre', id: 'val_roc' }), 'trêve : finie après 10 tours');
  let redeclare = 0, apres = 0;
  for (let s = 1; s <= 100; s++) {
    const e = vrai({ tour: 6 }); e.treves = { val_roc: 10 }; GU.tour(e, rng(s)); if (e.guerre) redeclare++;
    const f = vrai({ tour: 6 }); f.treves = { val_roc: 0 }; GU.tour(f, rng(s)); if (f.guerre) apres++;
  }
  check(redeclare === 0 && apres > 15, `trêve : Val-Roc ne déclare pas la guerre pendant la trêve (${redeclare}/100), le fait après (${apres}/100)`);
  let traitre = 0; for (let s = 1; s <= 100; s++) { const e = vrai(); e.treves = { contreforts: 10 }; GU.declarer(e, 'val_roc', 'val_roc', rng(s)); if (e.guerre.ennemis.includes('contreforts')) traitre++; }
  check(traitre === 0, 'trêve : Contreforts ne rejoint pas nos ennemis pendant sa trêve avec nous');
  const zero = seul(enGuerre(vrai({ regiments: 0 }), 'val_roc', 'joueur'));
  check(!GU.bataille(zero, true, 'hauts', rng(1)) && zero.regiments === 0, 'bataille : sans régiment on perd toujours');
}


// ===================== Mise en place neutre et personas (13/11) =====================
{
  const GU = P('moteur/guerre.js'), PERS = P('donnees/personas.js'), DPm = P('moteur/diplomatie.js');
  const rng = s => Alea.creer(s);
  const ok3 = (e, a) => Tour.actionsDisponibles(e).some(d => JSON.stringify(Object.entries(d).sort()) === JSON.stringify(Object.entries(a).sort()));
  const vraie = g => Etat.creerEtat(CHAMPS, g || 1);
  check(Object.values(vraie().nations).every(n => n.relation === 10), 'mise en place : toutes les nations commencent à +10 de relation');
  check(vraie().evenements.length === 0 && Tour.tourSuivant(vraie(), []).bilan.prix.tissu === 2, 'mise en place : aucune crise au début de la partie');
  check(Object.keys(PERS).length === 7, 'personas : 7 (belliqueux, marchand, opportuniste, isolationniste, revanchard, idéaliste, prudent)');
  const tirages = Array.from({ length: 300 }, (_, g) => Object.values(vraie(g + 1).profils).map(p => p.persona));
  check(tirages.every(t => new Set(t).size === 3 && t.every(x => PERS[x])), 'personas : 3 différents à chaque partie');
  const vus = {}; tirages.forEach(t => t.forEach((x, i) => { vus[i + x] = 1; }));
  check(Object.keys(vus).length === 21, 'personas : chaque persona peut échoir à chaque nation');
  const agr = tirages.filter(t => t.includes('belliqueux')).length;
  check(agr > 300 * 0.33 && agr < 300 * 0.53, `personas : un belliqueux dans environ 3 parties sur 7 (${agr}/300), sinon pas d'agresseur désigné`);
  check(egal(vraie(4).profils, vraie(4).profils) && !egal(tirages[0], tirages[1]) || !egal(tirages[1], tirages[2]), 'personas : même graine, mêmes personas');
  const v = vraie(); check(Object.keys(v.nations).every(n => v.nations[n].regiments === PERS[v.profils[n].persona].regiments), 'personas : régiments de départ selon le persona');
  check(GU.force(Object.assign(vrai(), {}), 'val_roc') === 8 && (() => { const e = vrai(); e.profils.val_roc.persona = 'marchand'; return GU.force(e, 'val_roc') === 5; })(), 'personas : la force d\'une nation suit son persona (belliqueux ×1,6, marchand ×1)');
  // contrats tirés des échanges
  check(egal(Object.keys(v.offres).sort(), ['brume_fer', 'brume_grain', 'brume_tissu', 'contreforts_grain', 'contreforts_outils', 'val_roc_fer', 'val_roc_grain', 'val_roc_tissu']), 'contrats : chaque nation propose ce qu\'elle exporte et achète ce qu\'elle importe');
  check(egal(v.offres.brume_tissu, { nation: 'brume', sens: 'achat', bien: 'tissu', volume: 10, prix: 1.6, duree: 10 }) && egal(v.offres.val_roc_grain, { nation: 'val_roc', sens: 'vente', bien: 'grain', volume: 10, prix: 1.3, duree: 10 }) && v.offres.contreforts_grain.volume === 5, 'contrats : volume au plus 10, achat à ×0,8, vente à ×1,3, 10 tours');
  const mar = vrai(); mar.nations.brume.relation = -10;
  check(ok3(mar, { type: 'contrat', id: 'brume_tissu' }) && !ok3(Object.assign(mar, { nations: Object.assign(mar.nations, { brume: Object.assign(mar.nations.brume, { relation: -11 }) }) }), { type: 'contrat', id: 'brume_tissu' }), 'personas : un marchand commerce dès −10 de relation');
  // traités avec n'importe quelle nation, selon le persona
  const tr = vrai(); for (const n in tr.nations) tr.nations[n].relation = 59; tr.profils.contreforts.persona = 'prudent';
  check(ok3(tr, { type: 'traite', id: 'entente', avec: 'brume' }) && ok3(tr, { type: 'traite', id: 'entente', avec: 'contreforts' }) && !ok3(tr, { type: 'traite', id: 'entente', avec: 'val_roc' }), 'traités : relation minimale du persona (belliqueux 60, marchand 30, prudent 40)');
  const fi = vrai({ traites: [{ type: 'entente', avec: 'contreforts', depuis: 1 }] }); fi.nations.contreforts.relation = 40;
  check(ok3(fi, { type: 'traite', id: 'filature', avec: 'contreforts' }), 'filature conjointe : avec n\'importe quelle nation de l\'Entente');
  const iso = vrai(); iso.profils.brume.persona = 'isolationniste'; iso.nations.brume.relation = 90;
  check(!ok3(iso, { type: 'traite', id: 'defense_mutuelle', avec: 'brume' }) && ok3(iso, { type: 'traite', id: 'entente', avec: 'brume' }), 'personas : un isolationniste refuse la défense mutuelle');
  const ide = vrai({ reputation: -1 }); ide.profils.brume.persona = 'idealiste'; ide.nations.brume.relation = 90;
  check(!ok3(ide, { type: 'traite', id: 'entente', avec: 'brume' }) && ok3(Object.assign(ide, { reputation: 0 }), { type: 'traite', id: 'entente', avec: 'brume' }), 'personas : un idéaliste refuse de traiter avec un pays de mauvaise réputation');
  // guerre selon le persona
  const decl = (pers, mod, s, rel) => { const e = vrai(Object.assign({ tour: 10 }, mod)); e.profils.val_roc.persona = pers; e.nations.val_roc.relation = rel == null ? 10 : rel; e.nations.val_roc.regiments = 20; GU.tour(e, rng(s)); return !!e.guerre; };
  const compte = (f) => { let k = 0; for (let s = 1; s <= 200; s++) if (f(s)) k++; return k; };
  check(compte(s => decl('marchand', {}, s, -90)) === 0 && compte(s => decl('opportuniste', {}, s, -90)) === 0 && compte(s => decl('isolationniste', {}, s, -90)) === 0, 'personas : marchand, opportuniste et isolationniste ne déclarent jamais la guerre');
  check(compte(s => decl('prudent', {}, s, -20)) === 0 && compte(s => decl('prudent', {}, s, -40)) > 20, 'personas : un prudent ne déclare que si la relation est sous −30 (et 2× plus fort)');
  check(compte(s => decl('idealiste', {}, s, -90)) === 0 && compte(s => decl('idealiste', { reputation: -60 }, s)) > 30, 'personas : un idéaliste ne frappe qu\'un pays paria');
  check(compte(s => decl('revanchard', {}, s, 10)) === 0 && compte(s => decl('revanchard', { revanches: { val_roc: true } }, s, 10)) > 30, 'personas : un revanchard battu par nous redevient belliqueux contre nous');
  const cap = vrai({ regiments: 20 }); GU.declarer(cap, 'val_roc', 'val_roc', rng(1)); cap.guerre.ennemis = ['val_roc']; cap.guerre.allies = []; cap.guerre.capitulation = 'ennemi';
  GU.paix(cap, 'joueur', {});
  check(cap.revanches.val_roc === true, 'personas : une nation battue s\'en souvient (revanche)');
  const id2 = vrai(); id2.profils.brume.persona = 'idealiste'; GU.declarer(id2, 'contreforts', 'joueur', rng(1));
  const id3 = vrai(); id3.profils.brume.persona = 'idealiste'; GU.declarer(id3, 'val_roc', 'val_roc', rng(1));
  check(id2.guerre.ennemis.includes('brume') && id3.guerre.allies.includes('brume'), 'personas : un idéaliste rejoint le camp attaqué');
}

// ===================== V2 étape 3 : marché et niveau de vie =====================
{
  ECO.marche.pente = PENTE; RFV.niveauDeVie.actif = true;
  const FAx = P('moteur/factions.js');
  const b = Tour.tourSuivant(neuf(), []).bilan;   // 4 fermes, 1 mine, sans armée : grain 0, fer +11, tissu −18 (crise : ×1,5), outils −8
  check(b.prixVente.fer === 1.34 && proche(b.ventes, 11 * 1.34), 'marché : vendre 11 fer le fait baisser de 11 % (1,5 → 1,34, au centime)');
  check(proche(b.prixAchat.tissu, 3 * 1.18) && proche(b.prixAchat.outils, 2 * 1.08) && proche(b.achats, 18 * 3.54 + 8 * 2.16), 'marché : acheter 18 tissu le fait monter de 18 %, 8 outils de 8 %');
  const gros = Economie.bilan(neuf({ batiments: { farm: 20, mine: 1 } }));
  check(gros.balance.grain === 320 && gros.prixVente.grain === 0.5 && proche(gros.ventes - 11 * 1.34, 320 * 0.5), 'marché : le prix de vente ne descend pas sous la moitié');
  const manque = Economie.bilan(neuf({ batiments: {}, familles: 150 }));
  check(manque.prixAchat.grain === 1.5, 'marché : le prix d\'achat ne monte pas au-delà de ×1,5');
  check(Math.abs(Economie.bilan(Object.assign(neuf(), { traites: [{ type: 'entente', avec: 'brume', depuis: 1 }] })).ventes - 11 * 1.34 * 1.1) < 0.01, 'marché : les tarifs de l\'Entente s\'ajoutent');
  // niveau de vie
  const t1 = Tour.tourSuivant(vrai({ evenements: [] }), []);   // grain 100/80, fer 22,5/4, tissu 0/18, outils 0/8
  check(egal(t1.niveauDeVie, { paysans: 1, ouvriers: 0.5, artisans: 0, patrons: 0.5 }), 'niveau de vie : couverture du panier de chaque faction (paysans : grain ; ouvriers : grain, outils ; artisans : tissu, outils ; patrons : tissu, fer)');
  const c0 = CHAMPS.joueur.factions;
  check(t1.factions.paysans.colere === c0.paysans.colere - 2 && t1.factions.artisans.colere === c0.artisans.colere + 2 && t1.factions.ouvriers.colere === c0.ouvriers.colere && t1.factions.patrons.colere === c0.patrons.colere, 'niveau de vie : panier couvert −2 par tour, moins de la moitié +2, entre les deux rien');
  const lc = Tour.tourSuivant(Object.assign(vrai({ evenements: [] }), { lois: { travail: { id: 'journee_huit_heures', depuis: 1 } }, regions: { essai: { nom: 'Essai', terrain: 'mixte', emplacements: 99, batiments: { farm: 5, workshop: 1, mine: 1 } } }, batiments: { farm: 5, workshop: 1, mine: 1 } }), []);
  check(lc.niveauDeVie.ouvriers === 1 && lc.factions.ouvriers.colere === c0.ouvriers.colere - 4, 'niveau de vie : panier couvert −2, plus −2 avec la journée de huit heures (−4)');
  const su = Tour.tourSuivant(Object.assign(vrai({ evenements: [] }), { lois: { libertes: { id: 'suffrage_census', depuis: 1 } } }), []);
  check(su.factions.artisans.colere === c0.artisans.colere + 1, 'niveau de vie : la gêne d\'une faction favorisée par le suffrage monte 2× moins vite');
  const occ = Tour.tourSuivant(vrai({ evenements: [], occupations: { plaine: 'val_roc', vallee: 'val_roc' } }), []);
  check(occ.niveauDeVie.paysans === 0 && occ.factions.paysans.colere === c0.paysans.colere + 2, 'niveau de vie : des régions occupées affament les paysans');
  check(FAx.couverture({ bilan: { production: { grain: 0 }, consommation: { grain: 0 } } }, 'paysans') === 1, 'niveau de vie : rien à consommer = panier couvert');
}

// ===================== V2 étape 4 : une loi à la fois =====================
{
  Object.assign(RLV, JSON.parse(JSON.stringify(RLV0)));
  const LM = P('moteur/lois.js');
  const e0 = vrai({ evenements: [] });
  check(LM.lancables(e0).length === 27 && e0.cp === undefined, 'lois : plus de capital politique, toutes les lois se lancent dès le tour 1');
  check(LM.chance(e0, 'income_progressive') === 0.6 && LM.chance(e0, 'income_capital') === 0.25 && LM.chance(e0, 'school_public') === 0.775, 'débat : chance = 50 % + (puissance des pour − des contre) / 2 (progressif 60 %, capital 25 %, école 77,5 %)');
  const fort = vrai(); fort.factions.patrons.puissance = 100; fort.factions.artisans.puissance = 100;
  const faible = vrai(); for (const f in faible.factions) faible.factions[f].puissance = 100; faible.factions.patrons.puissance = 0;
  check(LM.chance(fort, 'income_capital') === 0.1 && LM.chance(faible, 'income_progressive') === 0.9, 'débat : chance bornée entre 10 % et 90 %');
  const d1 = Tour.tourSuivant(vrai({ evenements: [] }), [{ type: 'loi', id: 'unions' }]);
  check(d1.debat && d1.debat.id === 'unions' && !d1.lois.relations_sociales && !Tour.actionsDisponibles(d1).some(a => a.type === 'loi') && Tour.actionsDisponibles(d1).some(a => a.type === 'abandonner'), 'débat : une seule loi à la fois, pas d\'adoption au tour du lancement, on peut abandonner');
  const ab = Tour.tourSuivant(d1, [{ type: 'abandonner' }]);
  check(!ab.debat && !ab.lois.relations_sociales && Tour.actionsDisponibles(ab).some(a => a.type === 'loi'), 'débat : abandonné, on peut en ouvrir un autre');
  let adoptees = 0; const N = 600;
  for (let g = 1; g <= N; g++) { const x = Tour.tourSuivant(Tour.tourSuivant(Etat.creerEtat(CHAMPS, g), [{ type: 'loi', id: 'income_progressive' }]), []); if (x.lois.impot) adoptees++; }
  check(Math.abs(adoptees / N - 0.6) < 0.06, `débat : au 2e tour, adoptée avec la chance affichée (${(adoptees / N).toFixed(2)} pour 0,60)`);
  // colère des opposants pendant le débat (même partie avec et sans débat)
  const sans = Tour.tourSuivant(vrai({ evenements: [] }), []), avec = Tour.tourSuivant(vrai({ evenements: [] }), [{ type: 'loi', id: 'income_capital' }]);
  check(avec.factions.patrons.colere === sans.factions.patrons.colere + 1 && avec.factions.artisans.colere === sans.factions.artisans.colere + 1 && avec.factions.ouvriers.colere === sans.factions.ouvriers.colere, 'débat : +1 colère par tour pour les factions contre (impôt sur le capital : patrons et artisans)');
  check(Object.values(LOIS).every(l => Array.isArray(l.pour) && Array.isArray(l.contre) && l.pour.concat(l.contre).every(f => CHAMPS.joueur.factions[f]) && l.cp === undefined), 'lois : chacune a ses factions pour et contre, plus de coût');
  check(!LM.lancables(vrai({ nonRearmement: { joueur: 10 } })).some(id => /^army_/.test(id)), 'débat : pas de loi militaire sous la clause de non-réarmement');
}

// ===================== V2 étape 6 : réputation fusionnée dans les relations =====================
{
  FUS.actif = true;
  const DPm = P('moteur/diplomatie.js'), GU = P('moteur/guerre.js'), LM = P('moteur/lois.js');
  const base = () => { const e = vrai({ evenements: [] }); for (const n in e.nations) e.nations[n].relation = 10; return e; };
  const rel = e => Object.fromEntries(Object.entries(e.nations).map(([n, x]) => [n, x.relation]));
  const ag = base(); GU.declarer(ag, 'contreforts', 'joueur', Alea.creer(1));
  check(ag.nations.contreforts.relation === -100 && ag.nations.brume.relation === 0 && ag.nations.val_roc.relation === 0, 'réputation fusionnée : une agression vaut −100 avec la cible et −10 avec les autres');
  const don = base(); DPm.appliquer(don, { type: 'don', id: 'brume', montant: 100 });
  check(egal(rel(don), { val_roc: 12.5, brume: 32.5, contreforts: 12.5 }), 'réputation fusionnée : un don de 100 or vaut +20 avec la nation aidée et +2,5 avec toutes');
  const ts = base(); ts.nations.brume.relation = 30; DPm.appliquer(ts, { type: 'traite', id: 'entente', avec: 'brume' });
  check(egal(rel(ts), { val_roc: 11.5, brume: 41.5, contreforts: 11.5 }), 'réputation fusionnée : un traité signé vaut +10 avec le partenaire et +1,5 avec toutes');
  DPm.appliquer(ts, { type: 'rompre', id: 'entente', avec: 'brume' });
  check(egal(rel(ts), { val_roc: 4, brume: 34, contreforts: 4 }), 'réputation fusionnée : un traité rompu coûte −7,5 avec toutes');
  const em = base(); DPm.appliquer(em, { type: 'embargo', id: 'val_roc' });
  check(egal(rel(em), { val_roc: -22.5, brume: 7.5, contreforts: 7.5 }), 'réputation fusionnée : un embargo injustifié coûte −30 avec la cible et −2,5 avec toutes');
  const su = base(); LM.adopter(su, 'suffrage_universal');
  check(Object.values(rel(su)).every(x => x === 12.5) && su.reputation === CHAMPS.joueur.reputation, 'réputation fusionnée : le suffrage universel vaut +2,5 avec toutes ; la réputation à part ne bouge plus');
  check(DPm.reputation(base()) === 10 && DPm.reputation(Object.assign(base(), { nations: Object.assign(base().nations, { brume: Object.assign(base().nations.brume, { relation: 40 }) }) })) === 20, 'réputation fusionnée : la réputation affichée est la moyenne des relations');
  const pa = base(); for (const n in pa.nations) pa.nations[n].relation = -51;
  check(DPm.paria(pa) && !Tour.actionsDisponibles(pa).some(a => a.type === 'traite' || a.type === 'contrat'), 'réputation fusionnée : paria sous −50 de moyenne');
  const ide = base(); ide.profils.brume.persona = 'idealiste'; ide.nations.brume.relation = 90; ide.nations.val_roc.relation = -100; ide.nations.contreforts.relation = -100;
  check(!Tour.actionsDisponibles(ide).some(a => a.type === 'traite' && a.avec === 'brume') && Tour.actionsDisponibles(Object.assign(ide, { nations: Object.assign(ide.nations, { val_roc: Object.assign(ide.nations.val_roc, { relation: 10 }) }) })).some(a => a.type === 'traite' && a.avec === 'brume'), 'réputation fusionnée : un idéaliste juge la moyenne de nos relations');
}

// ===================== Équilibre de la guerre (14/11) =====================
{
  const GU = P('moteur/guerre.js'), Gd = P('donnees/guerre.js');
  const g = vrai({ regiments: 20 }); GU.declarer(g, 'val_roc', 'val_roc', Alea.creer(1)); g.guerre.ennemis = ['val_roc']; g.guerre.allies = [];
  g.occupations = { hauts: 'joueur' }; GU.tour(g, Alea.creer(1));
  const g2 = vrai({ regiments: 20 }); GU.declarer(g2, 'val_roc', 'val_roc', Alea.creer(1)); g2.guerre.ennemis = ['val_roc']; g2.guerre.allies = [];
  g2.occupations = { hauts: 'joueur', forges: 'joueur' }; GU.tour(g2, Alea.creer(1));
  check(Gd.capitulationMoitie && g.guerre && !g.guerre.capitulation && g2.guerre.capitulation === 'ennemi', 'capitulation : une nation dont 2 régions sur 3 sont occupées capitule (pas avec une seule)');
  const j = vrai({ regiments: 1 }); GU.declarer(j, 'val_roc', 'val_roc', Alea.creer(1)); j.guerre.ennemis = ['val_roc']; j.guerre.allies = [];
  j.occupations = { plaine: 'val_roc', vallee: 'val_roc' }; GU.tour(j, Alea.creer(1));
  check(!j.guerre && !j.regions.plaine && Object.keys(j.regions).length === 3, 'capitulation : deux de nos 4 régions occupées, nous capitulons et en cédons une');
}

// ===================== Budget (14/11) : niveau d'imposition, entretien des bâtiments, dette =====================
{
  Object.assign(ECOV, { entretienFacteur: BUDGET0.entretienFacteur, dette: BUDGET0.dette });
  const v = () => vrai({ evenements: [] });
  const imp = niv => Economie.bilan(Object.assign(v(), { impots: niv })).impots;
  check(imp('bas') === 60 && imp('normal') === 80 && imp('haut') === 108, 'impôts : niveau bas ×0,75, normal ×1, haut ×1,35');
  const tn = Tour.tourSuivant(v(), []), th = Tour.tourSuivant(v(), [{ type: 'impots', id: 'haut' }]), tb = Tour.tourSuivant(v(), [{ type: 'impots', id: 'bas' }]);
  check(Object.keys(tn.factions).every(f => th.factions[f].colere === tn.factions[f].colere + 4 && tb.factions[f].colere === Math.max(0, tn.factions[f].colere - 1)), 'impôts : haut +4 de colère par tour pour toutes les factions, bas −1');
  check(th.impots === 'haut' && !Tour.actionsDisponibles(th).some(a => a.type === 'impots' && a.id === 'haut') && Tour.actionsDisponibles(th).some(a => a.type === 'impots' && a.id === 'bas'), 'impôts : le niveau choisi reste jusqu\'au prochain changement');
  check(Economie.bilan(v()).entretiens === 4 * 3 + 4 + 3 + 3 * 3, 'entretien : 3 par ferme, 4 par mine, 3 par caserne, plus 3 par régiment (départ : 28 or par tour)');
  check(BAT.weaving.entretien === 5 && BAT.workshop.entretien === 4 && BAT.fort.entretien === 4 && BAT.entente_mill.entretien === 2, 'entretien : tissage 5, atelier 4, fort 4, filature 2 (part du joueur)');
  check(Economie.bilan(Object.assign(v(), { occupations: { plaine: 'val_roc' } })).entretiens === 28 - 6, 'entretien : une région occupée ne coûte plus (ni ne produit)');
  const dt = Economie.bilan(Object.assign(v(), { tresor: -100 }));
  check(dt.interets === 5 && dt.entretiens === 28 + 5 && Economie.bilan(v()).interets === 0, 'dette : sous zéro, 5 % d\'intérêts par tour');
  const ok = Tour.tourSuivant(Object.assign(v(), { tresor: -299 }), []), fa = Tour.tourSuivant(Object.assign(v(), { tresor: -400 }), []);
  check(Object.keys(ok.factions).every(f => fa.factions[f].colere === ok.factions[f].colere + 3), 'dette : sous −300 (faillite), +3 de colère par tour pour toutes les factions');
}

// ===================== Paquet d'événements (14/11) =====================
{
  REV.chance = CHANCE_EV;
  const EVd = P('donnees/evenements.js'), EVm = P('moteur/evenements.js'), CARTES = EVd.CARTES;
  check(Object.keys(CARTES).length === 12 && !CARTES.saturation && !CARTES.penurie && REV.debut === 5 && Math.abs(REV.chance - 1 / 6) < 1e-9, 'événements : 12 cartes (sans saturation ni pénurie), pas avant le tour 5, une chance sur six par tour');
  // fréquence et paquet
  let avant5 = 0, tirages = 0, tours = 0, doublon = false;
  for (let g = 1; g <= 150; g++) {
    let e = Etat.creerEtat(CHAMPS, g); const vus = [];
    while (!e.fin) {
      const t = e.tour; e = Tour.tourSuivant(e, []);
      const ev = e.journal.find(l => /^Événement/.test(l));
      if (t >= 5) tours++;
      if (ev) { if (t < 5) avant5++; tirages++; const nom = ev.slice(12).split('.')[0]; if (vus.includes(nom) && vus.length < 12) doublon = true; vus.push(nom); }
    }
  }
  check(avant5 === 0, 'événements : aucun avant le tour 5');
  check(Math.abs(tirages / tours - 1 / 6) < 0.025, `événements : environ une chance sur six par tour (${(tirages / tours).toFixed(3)})`);
  check(!doublon, 'événements : une carte ne revient pas avant que le paquet soit épuisé');
  // effets
  const prep = (id, mod) => { const e = Object.assign(vrai({ evenements: [], tour: 6 }), mod || {}); e.paquet = [id]; REV.chance = 1; EVm.tirer(e, Alea.creer(3)); REV.chance = CHANCE_EV; return e; };
  const sec = prep('secheresse'); sec.tour = 7;
  check(EVm.multProduction(sec, 'grain') === 0.6 && EVm.multProduction(sec, 'fer') === 1 && EVm.multProduction(Object.assign(sec, { tour: 10 }), 'grain') === 1, 'sécheresse : grain −40 % pendant 3 tours');
  const rec = prep('recolte'); rec.tour = 7;
  check(Economie.bilan(rec).production.grain === 140, 'bonne récolte : grain +40 % (100 → 140)');
  const ep = prep('epidemie');
  check(ep.evenement && ep.evenement.id === 'epidemie' && egal(Tour.actionsDisponibles(Object.assign(JSON.parse(JSON.stringify(ep)), { tour: 7 })).filter(a => a.type === 'evenement').map(a => a.choix), ['subir', 'quarantaine']), 'événements : une carte à choix attend la réponse du joueur au tour suivant');
  const ep1 = Tour.tourSuivant(Object.assign(JSON.parse(JSON.stringify(ep)), { tour: 7 }), []);
  check(!ep1.evenement && proche(ep1.familles, Math.round(Math.round(80 * 0.92 * 100) / 100 * 1.01 * 100) / 100), 'épidémie : sans réponse, la réponse gratuite (−8 % de familles)');
  const ep2 = Tour.tourSuivant(Object.assign(JSON.parse(JSON.stringify(ep)), { tour: 7 }), [{ type: 'evenement', choix: 'quarantaine' }]);
  check(ep2.bilan.production.grain === 80 && ep2.journal.some(l => /Quarantaine/.test(l)), 'épidémie : quarantaine, production −20 % pendant 2 tours');
  const sc = prep('scandale'); sc.tour = 7;
  const scA = Tour.tourSuivant(JSON.parse(JSON.stringify(sc)), []), scB = Tour.tourSuivant(JSON.parse(JSON.stringify(sc)), [{ type: 'evenement', choix: 'etouffer' }]);
  check(Object.keys(scA.factions).every(f => scA.factions[f].colere === scB.factions[f].colere + 8) && proche(scA.tresor - scB.tresor, 80), 'scandale : +8 de colère pour toutes, ou 80 or pour l\'étouffer');
  check(!Tour.actionsDisponibles(Object.assign(JSON.parse(JSON.stringify(sc)), { tresor: 50 })).some(a => a.choix === 'etouffer'), 'événements : une réponse trop chère n\'est pas proposée');
  const gr = prep('greve'); const f = gr.evenement.cibles.faction;
  check(f === 'ouvriers' && gr.factions.ouvriers.colere === CHAMPS.joueur.factions.ouvriers.colere + 15, 'grève sauvage : la faction la plus en colère +15');
  const fi = prep('filon');
  check(fi.regions.collines.emplacements === 4, 'filon découvert : un emplacement de plus dans une région à filons');
  const inc = prep('incident'); const n0 = inc.evenement.cibles.nation;
  check(inc.nations[n0].relation === vrai().nations[n0].relation - 20, 'incident de frontière : −20 avec une nation');
  const amb = prep('ambassadeur'); check(Object.values(amb.nations).some((x, i) => x.relation === Object.values(vrai().nations)[i].relation + 15), 'ambassadeur : +15 avec une nation');
  const inv = prep('inventeur'); inv.tour = 7; const inv2 = Tour.tourSuivant(inv, [{ type: 'evenement', choix: 'financer' }]);
  check(Object.values(inv2.bonusRendement)[0] === 1.15, 'inventeur : 100 or pour +15 % de rendement d\'un type de bâtiment');
  check(prep('mutinerie').paquet.includes('mutinerie') && (() => { const e = prep('mutinerie', { regiments: 8, moral: 0.5, guerre: { ennemis: ['val_roc'], allies: [] } }); return e.regiments === 6; })(), 'mutinerie : seulement en guerre et avec un moral sous 0,6 ; −25 % de régiments');
  const di = prep('dirigeant'); const avantP = Object.values(vrai().profils).map(p => p.persona), apresP = Object.values(di.profils).map(p => p.persona);
  check(apresP.filter((p, i) => p !== avantP[i]).length === 1 && new Set(apresP).size === 3, 'changement de dirigeant : un voisin change de persona (toujours 3 différents)');
  const ref = prep('refugies'); ref.tour = 7; const ref2 = Tour.tourSuivant(ref, [{ type: 'evenement', choix: 'accueillir' }]);
  check(ref2.journal.some(l => /Accueillir/.test(l)) && ref2.familles > 90, 'réfugiés : accueillir donne +10 familles');
  // invariants avec événements
  let viol = '';
  for (let g = 1; g <= 30; g++) { let e = Etat.creerEtat(CHAMPS, g); const r = Alea.creer(g);
    while (!e.fin) { const d = Tour.actionsDisponibles(e); const a = d.length && Alea.suivant(r) < 0.5 ? [Alea.choisir(r, d)] : []; e = Tour.tourSuivant(e, a);
      if (Object.values(e.factions).some(x => x.statut !== FAm.statutDe(x) || x.colere < 0 || x.colere > 100)) viol = 'faction'; if (!(e.familles > 0)) viol = 'familles'; if (e.regiments < 0) viol = 'régiments'; } }
  check(!viol, 'événements : parties au hasard, invariants tenus' + (viol ? ' — ' + viol : ''));
}

// ===================== Panel de lois du 14/11 =====================
{
  const LM = P('moteur/lois.js'), GU = P('moteur/guerre.js'), Bm = P('moteur/batiments.js');
  const avec = (ids, mod) => { const e = Object.assign(vrai({ evenements: [] }), mod || {}); for (const id of ids) e.lois[LOIS[id].categorie] = { id, depuis: 1 }; return e; };
  const b0 = Economie.bilan(avec([]));
  check(Economie.bilan(avec(['impot_minimal'])).impots === 68, 'impôt minimal : impôts ×0,85');
  const co = Economie.bilan(avec(['collectivisation']));
  check(co.production.grain === 115 && co.entretiens === 19 * 2 + 9, 'collectivisation : production +15 %, entretien des bâtiments ×2');
  const ad = avec([]); LM.adopter(ad, 'collectivisation');
  check(Object.values(ad.nations).every((x, i) => x.relation === Object.values(vrai().nations)[i].relation - 10) && ad.factions.patrons.puissance === 25, 'collectivisation : relations −10 avec toutes, patrons −20 de puissance');
  check(Bm.cout('farm', avec(['interventionnisme'])) === 48 && Bm.cout('farm', avec(['laisser_faire'])) === 45 && Bm.cout('farm', avec([])) === 60, 'interventionnisme : construire −20 % ; laisser-faire −25 %');
  const le = avec(['libre_entreprise'], { batiments: { farm: 4, mine: 1, caserne: 1 } });
  check(Economie.bilan(le).entretiens === 9 && Math.abs(Economie.bilan(le).ventes - b0.ventes * 0.85) < 0.01, 'libre entreprise : plus d\'entretien des bâtiments (les régiments restent), l\'État touche 85 % des ventes');
  check(Math.abs(Economie.bilan(avec(['laisser_faire'])).ventes - b0.ventes * 0.6) < 0.01, 'laisser-faire : l\'État touche 60 % des ventes');
  const te = Economie.bilan(Object.assign(avec(['travail_enfants']), { tour: 11 }));
  check(te.production.grain === 110 && proche(te.croissance, 0.005), 'travail des enfants : production +10 %, croissance −0,5 %');
  check(Economie.bilan(avec(['securite_sociale'])).entretiens === 28 + 20 && Economie.bilan(avec(['police_etat'])).entretiens === 28 + 12, 'sécurité sociale 20 or par tour, police d\'État 12');
  const pr = Economie.bilan(avec(['protectionnisme'], { regions: { essai: { nom: 'E', terrain: 'mixte', emplacements: 9, batiments: { farm: 4, mine: 1, workshop: 1 } } }, batiments: { farm: 4, mine: 1, workshop: 1 } }));
  check(pr.production.outils === 11.5 && pr.prixAchat.tissu === 2.83, 'protectionnisme : ateliers +15 % tout de suite, achats +20 %');
  const lx = Economie.bilan(avec(['libre_echange'], { batiments: {}, regions: { essai: { nom: 'E', terrain: 'mixte', emplacements: 9, batiments: { farm: 4, mine: 1 } } } }));
  check(lx.prixVente.fer === 1.42 && lx.balance.fer === 11, 'libre-échange : les prix bougent deux fois moins');
  const pu = avec(['parti_unique']);
  check(LM.chance(pu, 'income_progressive') === Math.round((0.6 + 0.25) * 1000) / 1000, 'parti unique : +25 % de chances pour les autres lois');
  const mi = avec(['milice_populaire'], { tresor: 1000, regiments: 8 });
  check(GU.plafond(mi, 'joueur') === 12 && Tour.actionsDisponibles(mi).some(a => a.type === 'recruter') && proche(Tour.tourSuivant(mi, [{ type: 'recruter', region: 'bourg' }]).tresor - Tour.tourSuivant(mi, []).tresor, -20 - 3) && GU.force(avec(['milice_populaire'], { regiments: 10 }), 'joueur') === 8, 'milice populaire : plafond ×1,5, régiment à 20 or (plus 3 d\'entretien), force ×0,8');
  // effets sur les factions par tour (une partie avec et sans la loi)
  const delta = (id, f) => { const a = Tour.tourSuivant(avec([id]), []), b = Tour.tourSuivant(avec([]), []); return a.factions[f].colere - b.factions[f].colere; };
  check(delta('impot_minimal', 'patrons') === -1 && delta('laisser_faire', 'ouvriers') === 2 && delta('laisser_faire', 'patrons') === -2, 'impôt minimal : patrons −1 par tour ; laisser-faire : ouvriers +2, patrons −2');
  check(delta('securite_sociale', 'ouvriers') === -2 && delta('securite_sociale', 'artisans') === -2 && delta('charite_privee', 'paysans') === 1 && delta('comites_populaires', 'patrons') === 2 && delta('police_etat', 'artisans') === -1, 'sécurité sociale, charité privée, comités populaires, police d\'État : colère par tour');
  check(delta('travail_enfants', 'artisans') === 1 && delta('libre_echange', 'artisans') === 1 && delta('ecoles_religieuses', 'paysans') === -1, 'travail des enfants, libre-échange, écoles religieuses : colère par tour');
  let si = avec([]); LM.adopter(si, 'syndicats_interdits'); const p0 = si.factions.ouvriers.puissance;
  check(si.factions.ouvriers.colere === CHAMPS.joueur.factions.ouvriers.colere + 10 && si.factions.patrons.colere === CHAMPS.joueur.factions.patrons.colere - 10, 'syndicats interdits : ouvriers +10, patrons −10 à l\'adoption');
  si.lois.relations_sociales.depuis = si.tour; si = tours(si, 12);
  check(si.factions.ouvriers.puissance === p0 - 20, 'syndicats interdits : ouvriers −2 de puissance par tour pendant 10 tours');
  let lb = avec([]); LM.adopter(lb, 'libre_entreprise'); lb = tours(lb, 12);
  check(lb.factions.patrons.puissance === CHAMPS.joueur.factions.patrons.puissance + 30, 'libre entreprise : patrons +3 de puissance par tour pendant 10 tours');
}

// --- V2 : objectifs de victoire (regles-v2.md § 6) ---
{
  const Ob = P('moteur/objectifs.js'), OD = P('donnees/objectifs.js'), Dp = P('moteur/diplomatie.js');
  const e0 = Etat.creerEtat(CHAMPS, 7);
  check(e0.suivi.tours === 0 && Ob.mesures(e0).contentement === 100 && Ob.mesures(e0).autorite === 0 && e0.ambition === null, 'objectifs : rien de cumulé au départ, pas d\'ambition');
  const m0 = Ob.mesures(e0), val = Object.keys(e0.batiments).reduce((t, id) => t + e0.batiments[id] * BAT[id].cout, 0);
  check(m0.prosperite === Math.round(e0.tresor + val), 'prospérité : trésor + coût des bâtiments en service');
  check(m0.puissance === 4 * 10 + P('moteur/guerre.js').force(e0, 'joueur'), 'puissance : 10 par région tenue + force de l\'armée');
  check(m0.concorde === Math.round(Dp.reputation(e0)), 'concorde : moyenne des relations (+10 par traité)');
  const e1 = Tour.tourSuivant(e0, []);
  const moy = Object.values(e1.factions).reduce((t, x) => t + x.colere, 0) / Object.keys(e1.factions).length;
  check(e1.suivi.tours === 1 && proche(e1.suivi.colere, moy) && Ob.mesures(e1).contentement === Math.round((100 - moy) * 10) / 10, 'contentement : 100 − colère moyenne des factions, cumulée chaque tour');
  const el = Etat.copie(e1); el.lois = { impot: { id: 'impot_minimal', depuis: 1 } };
  const Fp = f => el.factions[f].puissance;
  check(Ob.legitimite(el) === Fp('patrons') + Fp('artisans') - Fp('ouvriers'), 'autorité : puissance des factions pour − contre, pour chaque loi en vigueur');
  const el2 = Etat.copie(el); el2.lois.economie = { id: 'laisser_faire', depuis: 1 };
  check(Ob.legitimite(el2) === Math.round((Fp('patrons') + Fp('artisans') - Fp('ouvriers') + Fp('patrons') - Fp('ouvriers')) / 2 * 100) / 100, 'autorité : moyenne par loi (laisser-faire : contre les ouvriers seulement)');
  Ob.suivre(el);
  check(el.suivi.tours === 2 && Ob.mesures(el).autorite === Math.round((e1.suivi.legitimite + Ob.legitimite(el)) / 2), 'autorité : moyenne sur la partie');
  const eo = Etat.copie(e1); eo.occupations = { plaine: 'valroc' };
  check(Ob.mesures(eo).puissance === m0.puissance - 10, 'puissance : une région occupée ne compte pas');
  // ambition : tour 1 seulement, une fois
  const amb = Tour.actionsDisponibles(e0).filter(a => a.type === 'ambition').map(a => a.id);
  check(amb.join() === Object.keys(OD.OBJECTIFS).join(), 'ambition : les cinq objectifs proposés au tour 1');
  const ea = Tour.tourSuivant(e0, [{ type: 'ambition', id: 'concorde' }]);
  check(ea.ambition === 'concorde' && e0.ambition === null, 'ambition : choisie au tour 1');
  check(!Tour.actionsDisponibles(ea).some(a => a.type === 'ambition') && !Tour.actionsDisponibles(e1).some(a => a.type === 'ambition'), 'ambition : plus proposée après le tour 1');
  let deux = false; try { Tour.tourSuivant(e0, [{ type: 'ambition', id: 'concorde' }, { type: 'ambition', id: 'puissance' }]); } catch (x) { deux = true; }
  check(deux, 'ambition : une seule fois');
  const SE = JSON.parse(JSON.stringify(OD.OBJECTIFS));
  OD.OBJECTIFS.contentement.seuils = [50, 60, 70]; OD.OBJECTIFS.prosperite.seuils = [1e9, 2e9, 3e9];
  check(Ob.medailles(e1).contentement === 3 && Ob.medailles(e1).prosperite === 0, 'médailles : bronze, argent, or selon les seuils');
  check(Ob.resultat(Object.assign(Etat.copie(e1), { ambition: 'contentement' })).medaille === 3 && Ob.resultat(e1).medaille === null, 'victoire : la médaille de l\'ambition (sans ambition : aucune)');
  const er = Etat.copie(e1); er.issue = { type: 'revolution', faction: 'ouvriers' }; er.ambition = 'contentement';
  check(Ob.points(er) === 0 && Ob.resultat(er).medaille === 0, 'révolution : aucune médaille');
  for (const id in SE) OD.OBJECTIFS[id].seuils = SE[id].seuils;
}

// --- V2 : pays de départ (choisis par le joueur) ---
{
  const PAYS = P('donnees/pays.js'), LM2 = P('moteur/lois.js'), Fx = P('moteur/factions.js');
  const base = Etat.creerEtat(CHAMPS, 3), eq = Etat.creerEtat(CHAMPS, 3, 'equilibre');
  check(JSON.stringify(base) === JSON.stringify(eq) && base.pays === 'equilibre' && Object.keys(base.lois).length === 0, 'pays : par défaut le pays équilibré, sans loi');
  let inconnu = false; try { Etat.creerEtat(CHAMPS, 3, 'atlantide'); } catch (x) { inconnu = true; }
  check(inconnu, 'pays : un pays inconnu est refusé');
  for (const id in PAYS){
    const e = Etat.creerEtat(CHAMPS, 3, id), d = PAYS[id];
    check(Object.values(e.factions).reduce((t, x) => t + x.puissance, 0) === 140, `pays ${id} : puissance totale 140`);
    check(Object.keys(e.factions).every(f => e.factions[f].colere === CHAMPS.joueur.factions[f].colere), `pays ${id} : colère de départ inchangée`);
    check(Object.keys(e.regions).every(r => P('moteur/batiments.js').occupes(e, r) <= e.regions[r].emplacements), `pays ${id} : bâtiments dans les emplacements`);
    check(d.lois.every(l => e.lois[LOIS[l].categorie].id === l) && Object.keys(e.lois).length === d.lois.length, `pays ${id} : lois de départ en vigueur`);
    check(JSON.stringify(Etat.creerEtat(CHAMPS, 3, id)) === JSON.stringify(e) && Tour.actionsDisponibles(e).length > 0, `pays ${id} : départ reproductible et jouable`);
  }
  const ag = Etat.creerEtat(CHAMPS, 3, 'agricole'), ind = Etat.creerEtat(CHAMPS, 3, 'industriel'), ma = Etat.creerEtat(CHAMPS, 3, 'marchand'), mi = Etat.creerEtat(CHAMPS, 3, 'militaire');
  check(ag.factions.paysans.puissance === 60 && ag.regions.plaine.batiments.farm === 3 && ag.batiments.farm === 5, 'pays agricole : paysans 60, une ferme de plus dans la plaine');
  check(ind.regions.collines.batiments.mine === 2 && ind.regions.vallee.batiments.farm === 1 && ind.batiments.farm === 3, 'pays industriel : une mine de plus, une ferme de moins');
  check(ma.regions.bourg.emplacements === 5 && !ma.regions.bourg.batiments.workshop && mi.regions.bourg.batiments.fort === 1 && mi.regiments === 5 && ag.regiments === 3, 'pays marchand : bourg à 5 emplacements ; militaire : un fort et 5 régiments');
  // une loi de départ : installée depuis longtemps, remplaçable par un débat normal
  check(!LM2.lancables(ind).includes('syndicats_interdits') && LM2.lancables(ind).includes('unions'), 'loi de départ : en vigueur, une autre loi de sa catégorie peut être débattue');
  const i1 = Tour.tourSuivant(ind, []);
  check(i1.factions.ouvriers.puissance === ind.factions.ouvriers.puissance, 'loi de départ : ses effets de durée sont finis (syndicats interdits ne retirent plus de puissance)');
  check(Etat.creerEtat(CHAMPS, 3).regions.bourg.emplacements === 4, 'pays : les emplacements des autres pays ne changent pas');
}
console.log(`\n${n - fail}/${n} tests réussis`);
process.exit(fail ? 1 : 0);

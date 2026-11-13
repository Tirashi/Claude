/* Politique (moteur de règles, sans écran) : tests sous Node.
   node outils/politique-tests.js
   M1 : économie, capital politique, lois, bâtiments (une règle = un test), puis des parties au hasard (invariants).
   M2 : factions (dissipation, effets par tour, chocs, suffrages, apaisement, bornes, statuts, moral, grève, révolte, révolution).
   M0 : hasard à graine, état initial du scénario « champs », invariants du tour
   (déterminisme, état reçu jamais modifié, JSON rechargé à l'identique, action hors liste refusée).
   --rapport : trajectoire de deux joueurs simples (information, pas d'équilibrage).
   Code de sortie 1 si un test échoue (lancé par outils/verifications.js). */
'use strict';
const path = require('path');
const P = f => require(path.join(__dirname, '..', 'politique', f));
const Alea = P('moteur/alea.js'), Etat = P('moteur/etat.js'), Tour = P('moteur/tour.js');
const Economie = P('moteur/economie.js'), Lois = P('moteur/lois.js'), FAm = P('moteur/factions.js');
const CHAMPS = P('donnees/champs.js'), ECO = P('donnees/economie.js'), { LOIS, CATEGORIES } = P('donnees/lois.js'), BAT = P('donnees/batiments.js');

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
  check(e.tour === 1 && e.tourMax === 60 && !e.fin, 'état initial : tour 1 sur 60');
  check(e.tresor === CHAMPS.joueur.tresor && e.familles === CHAMPS.joueur.familles && e.cp === CHAMPS.joueur.cp, 'état initial : trésor, familles, capital politique du scénario');
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
  check(a.length === 60, 'tour : une partie dure 60 tours');
  check(egal(a, b), 'déterminisme : même graine, même partie (60 tours, état complet à chaque tour)');
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
const neuf = (mod) => Object.assign(Etat.creerEtat(CHAMPS, 1), mod || {});
const tours = (e, k, actions) => { for (let i = 0; i < k; i++) e = Tour.tourSuivant(e, i === 0 ? actions || [] : []); return e; };
const refuse = f => { try { f(); return false; } catch (err) { return true; } };
const proche = (a, b) => Math.abs(a - b) < 1e-6;

// --- capital politique ---
{
  check(tours(neuf(), 1).cp === 15 && tours(neuf(), 3).cp === 45, 'capital politique : +15 par tour');
  const e = Tour.tourSuivant(neuf({ cp: 100 }), [{ type: 'loi', id: 'income_progressive' }]);
  check(e.cp === 100 - 30 + 15, 'capital politique : lancer une loi coûte son prix (30)');
  check(!Tour.actionsDisponibles(neuf({ cp: 49 })).some(a => a.id === 'income_capital') && Tour.actionsDisponibles(neuf({ cp: 50 })).some(a => a.id === 'income_capital'), 'capital politique : une loi n\'est proposée que si le capital suffit');
  check(refuse(() => Tour.tourSuivant(neuf({ cp: 20 }), [{ type: 'loi', id: 'income_capital' }])), 'capital politique : une loi trop chère est refusée');
  const f = Tour.tourSuivant(neuf({ cp: 50 }), [{ type: 'loi', id: 'income_progressive' }, { type: 'loi', id: 'unions' }]);
  check(f.loisEnCours.length === 2 && f.cp === 15, 'actions : plusieurs lois le même tour si le capital suffit pour toutes');
  check(refuse(() => Tour.tourSuivant(neuf({ cp: 60 }), [{ type: 'loi', id: 'income_progressive' }, { type: 'loi', id: 'unions' }, { type: 'loi', id: 'labor_code' }])), 'actions : chaque action est vérifiée sur l\'état laissé par la précédente (la 3e loi n\'est plus payable)');
}

// --- lois : délai, catégories ---
{
  let e = Tour.tourSuivant(neuf({ cp: 100 }), [{ type: 'loi', id: 'income_progressive' }]);   // lancée au tour 1
  check(e.loisEnCours[0].adoption === 3 && !e.lois.impot, 'lois : lancée au tour 1, adoption prévue au tour 3');
  e = Tour.tourSuivant(e, []);
  check(!e.lois.impot && proche(e.bilan.impots, 80.8), 'lois : pas encore en vigueur au tour 2 (impôts sans multiplicateur)');
  const fam3 = e.familles;
  e = Tour.tourSuivant(e, []);
  check(e.lois.impot && e.lois.impot.id === 'income_progressive' && e.lois.impot.depuis === 3 && e.loisEnCours.length === 0, 'lois : en vigueur au tour 3 (2 tours de délai)');
  check(proche(e.bilan.impots, Math.round(fam3 * 1.35 * 100) / 100), 'lois : ses effets jouent dès le tour d\'adoption');
  check(refuse(() => Tour.tourSuivant(neuf({ cp: 200 }), [{ type: 'loi', id: 'income_progressive' }, { type: 'loi', id: 'income_capital' }])), 'lois : une seule loi en cours par catégorie');
  let g = neuf({ cp: 200 });
  g = tours(g, 3, [{ type: 'loi', id: 'school_public' }]);
  check(!Tour.actionsDisponibles(g).some(a => a.id === 'school_public'), 'lois : une loi en vigueur ne se relance pas');
  g = tours(g, 3, [{ type: 'loi', id: 'school_free' }]);
  check(g.lois.education.id === 'school_free' && Object.keys(g.lois).length === 1, 'lois : adopter une loi remplace celle de sa catégorie');
  check(Object.values(CATEGORIES).length === 7 && Object.values(LOIS).every(l => CATEGORIES[l.categorie]), 'lois : 7 catégories, chaque loi dans l\'une d\'elles');
  check(Object.keys(LOIS).length === 11, 'lois : les 11 lois de RULES_V1');
  const h = tours(neuf({ cp: 100 }), 3, [{ type: 'loi', id: 'suffrage_universal' }]);
  const k = tours(neuf({ cp: 100 }), 3, [{ type: 'loi', id: 'suffrage_census' }]);
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
  check(proche(Economie.bilan(avecLois(['income_progressive'])).impots, 108) && proche(Economie.bilan(avecLois(['income_capital'])).impots, 124), 'économie : impôts = familles × 1 × multiplicateur (×1,35 ; ×1,55)');
  check(Economie.bilan(avecLois(['school_public', 'labor_medicine', 'army_professional'])).entretiens === 36 && Economie.bilan(avecLois(['school_free', 'army_conscription'])).entretiens === 32, 'économie : entretiens des lois (école 14 / 20, médecine 10, armée 12)');
  check(proche(Economie.bilan(avecLois(['labor_code'])).production.grain, 75.2), 'économie : code du travail, production −6 %');
  check(proche(Tour.tourSuivant(neuf(), []).familles, 80.8), 'démographie : +1 % de familles par tour');
  check(Tour.tourSuivant(neuf({ familles: 199.5 }), []).familles === 200, 'démographie : plafond de 200 familles');
  const ecole = (depuis) => { const e = avecLois(['school_public'], depuis); e.tour = 11; return Economie.bilan(e).croissance; };
  check(proche(ecole(11), 0.01) && proche(ecole(6), 0.0125) && proche(ecole(1), 0.015) && proche(ecole(-5), 0.015), 'démographie : école publique +0,5 %, montée en 10 tours');
  const art = (ids, depuis) => { const e = avecLois(ids, depuis, { batiments: { workshop: 1 } }); e.tour = 11; return Economie.bilan(e).production.outils; };
  check(art([], 1) === 10 && proche(art(['school_public'], 6), 11.75) && proche(art(['school_public'], 1), 13.5) && proche(art(['school_free'], 1), 15), 'économie : artisans +35 % / +50 % à terme sur l\'atelier');
  check(proche(art(['school_free', 'labor_code'], 1), 14.1), 'économie : bonus des artisans et code du travail se multiplient');
  check(Economie.bilan(neuf({ batiments: { workshop: 2 } })).consommation.fer === 14, 'économie : un atelier consomme 5 fer');
  const d = Tour.tourSuivant(avecLois(['school_free', 'labor_medicine', 'army_professional'], 1, { tresor: 0, familles: 10, batiments: {} }), []);
  check(d.tresor < 0 && !d.fin && !Tour.actionsDisponibles(d).some(a => a.type === 'construire'), 'économie : le trésor peut passer sous zéro, on ne peut plus rien construire');
}

// --- bâtiments ---
{
  const e = Tour.tourSuivant(neuf(), [{ type: 'construire', id: 'farm' }]);
  check(proche(e.tresor, 200 - 60 + 26.5), 'bâtiments : payés à la commande');
  check(refuse(() => Tour.tourSuivant(neuf({ tresor: 59 }), [{ type: 'construire', id: 'farm' }])), 'bâtiments : refusés si le trésor ne suffit pas');
  check(!Tour.actionsDisponibles(neuf({ tresor: 10000 })).some(a => ['entente_mill', 'forge', 'fortifications'].includes(a.id)), 'bâtiments : filature, forge et fortifications attendent M3');
  const f = (k) => tours(neuf({ tresor: 1000 }), k, [{ type: 'construire', id: 'farm' }, { type: 'construire', id: 'farm' }, { type: 'construire', id: 'farm' }]);
  check(f(2).batiments.farm === 4 && f(3).batiments.farm === 6, 'bâtiments : ferme en 3 tours, deux chantiers à la fois');
  check(f(3).chantiers.length === 1 && f(3).chantiers[0].restant === 3 && f(5).batiments.farm === 6 && f(6).batiments.farm === 7, 'bâtiments : le 3e chantier attend un emplacement libre');
  check(f(3).bilan.production.grain === 80 && f(4).bilan.production.grain === 120, 'bâtiments : un bâtiment fini produit dès le tour suivant');
  check(Object.entries({ farm: 3, mine: 4, workshop: 5, weaving: 5 }).every(([id, d]) => { const g = tours(neuf({ tresor: 1000 }), d, [{ type: 'construire', id }]); const avant = CHAMPS.joueur.batiments[id] || 0; return g.batiments[id] === avant + 1 && (tours(neuf({ tresor: 1000 }), d - 1, [{ type: 'construire', id }]).batiments[id] || 0) === avant; }), 'bâtiments : délais 3 / 4 / 5 / 5 tours');
}

// --- parties au hasard : invariants ---
{
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
      if (new Set(e.loisEnCours.map(x => LOIS[x.id].categorie)).size !== e.loisEnCours.length) viol = 'deux lois en cours dans une catégorie';
      if (e.cp < 0) viol = 'capital politique négatif';
      if (!(e.familles > 0 && e.familles <= ECO.plafondFamilles)) viol = 'familles hors bornes';
      if (e.chantiers.some(c => c.restant <= 0)) viol = 'chantier fini resté dans la file';
      if (Object.values(e.factions).some(x => x.colere < 0 || x.colere > 100 || x.puissance < 0 || x.puissance > 100)) viol = 'colère ou puissance hors bornes';
      if (Object.values(e.factions).some(x => x.statut !== FAm.statutDe(x))) viol = 'statut de faction faux';
      if (!(e.moral >= 0 && e.moral <= 1)) viol = 'moral hors de 0-1';
      if (nonFini(e)) viol = 'nombre non fini (NaN)';
      if (!egal(JSON.parse(JSON.stringify(e)), e)) viol = 'pas sérialisable';
      traces.push(JSON.stringify(e));
    }
    return { traces, viol, fin: e };
  };
  let viols = [], diff = 0, lois = 0;
  for (let g = 1; g <= 40; g++) {
    const a = joueurHasard(g), b = joueurHasard(g, 1 + g % 59);
    if (a.viol) viols.push(g + ' : ' + a.viol);
    if (!egal(a.traces, b.traces)) diff++;
    lois += Object.keys(a.fin.lois).length;
  }
  check(!viols.length, 'parties au hasard (40 × 60 tours) : invariants tenus' + (viols.length ? ' — ' + viols.slice(0, 3).join(' ; ') : ''));
  check(diff === 0, 'parties au hasard : identiques après sauvegarde JSON à un tour quelconque');
  check(lois > 40, `parties au hasard : des lois sont bien adoptées (${(lois / 40).toFixed(1)} catégories remplies en moyenne)`);
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
  e = un(['labor_code']);
  check(fac(e, 'ouvriers').colere === 33 && fac(e, 'paysans').colere === 29, 'code du travail : la colère ouvrière se dissipe 2× plus vite');
  e = un(['labor_medicine']);
  check(['paysans', 'ouvriers', 'artisans', 'patrons'].every(f => fac(e, f).colere === CHAMPS.joueur.factions[f].colere - 3), 'médecine du travail : −2 colère par tour pour toutes les factions');
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
  check(ok, 'chocs de lois : conformes aux données pour les 11 lois');
  const adop = tours(neuf({ cp: 100 }), 3, [{ type: 'loi', id: 'income_progressive' }]);
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
  const rv2 = Tour.tourSuivant(avecColere('paysans', 93, { loisEnCours: [{ id: 'school_free', adoption: 1 }] }), []);
  check(!rv1.fin && rv2.fin && rv2.issue.type === 'revolution' && rv2.issue.faction === 'paysans' && refuse(() => Tour.tourSuivant(rv2, [])), 'révolution : la colère touche 100 (école gratuite, paysans 93 + 8) = partie perdue, même redescendue à 99 en fin de tour ; à 99 rien');
  check(rv2.journal.some(t => /Révolution/.test(t)), 'révolution : annoncée dans le journal');
  check(tours(neuf(), 60).issue.type === 'fin', 'fin de partie normale après 60 tours');
}

// --- rapport (information seulement) ---
if (process.argv.includes('--rapport')) {
  const ordre = ['income_progressive', 'school_public', 'labor_code', 'unions', 'labor_medicine', 'army_professional', 'suffrage_universal', 'school_free'];
  const joueurs = {
    rien: () => [],
    batisseur: e => {
      const d = Tour.actionsDisponibles(e), acts = [];
      const loi = ordre.find(id => d.some(a => a.id === id)); if (loi) acts.push({ type: 'loi', id: loi });
      const besoin = e.bilan && e.bilan.balance.tissu < 0 ? 'weaving' : e.bilan && e.bilan.balance.outils < 0 ? 'workshop' : 'farm';
      if (e.chantiers.length < 2 && d.some(a => a.id === besoin)) acts.push({ type: 'construire', id: besoin });
      return acts;
    }
  };
  const dures = ['income_capital', 'unions', 'labor_code', 'suffrage_universal', 'army_conscription', 'school_free'];
  joueurs.provocateur = e => { const d = Tour.actionsDisponibles(e); const id = dures.find(x => d.some(a => a.id === x)); return id ? [{ type: 'loi', id }] : []; };
  for (const nom in joueurs) {
    let e = Etat.creerEtat(CHAMPS, 1); const l = []; let t55 = 0, t75 = 0, cmax = 0, qui = '';
    while (!e.fin) {
      e = Tour.tourSuivant(e, joueurs[nom](e));
      const xs = Object.entries(e.factions), m = xs.reduce((a, b) => b[1].colere > a[1].colere ? b : a);
      if (m[1].colere > cmax) { cmax = m[1].colere; qui = m[0]; }
      if (xs.some(([, x]) => x.colere >= 55)) t55++; if (xs.some(([, x]) => x.colere >= 75)) t75++;
      if ([10, 30, 60].includes(e.tour - 1)) l.push(`t${e.tour - 1} or ${Math.round(e.tresor)} fam ${Math.round(e.familles)} cp ${e.cp} lois ${Object.keys(e.lois).length} moral ${e.moral.toFixed(2)}`);
    }
    console.log(`rapport ${nom.padEnd(11)} ` + l.join(' | ') + ` | colère max ${cmax} (${qui}), tours ≥55 : ${t55}, ≥75 : ${t75}, fin : ${e.issue.type} | puissance ${Object.entries(e.factions).map(([f, x]) => f + ' ' + x.puissance).join(', ')}`);
  }
}

console.log(`\n${n - fail}/${n} tests réussis`);
process.exit(fail ? 1 : 0);

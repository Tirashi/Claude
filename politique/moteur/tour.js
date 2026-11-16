/* Politique : le tour. tourSuivant(etat, actions, rng) → nouvel état ; ne mute jamais etat.
   actionsDisponibles(etat) : la seule liste que voient l'écran et les bots ; toute autre action est refusée.
   Actions : { type: "loi", id } lance une loi ; { type: "construire", id, region } commande un bâtiment (V2 : dans une région) ;
   { type: "projet", id, region, avec } : projet commun (bâtiment cofinancé par une nation de l'Entente) ;
   { type: "defricher", region } : +1 emplacement dans la région (chantier de 3 tours) ;
   { type: "agrandir", id, region } agrandit un bâtiment (niveau 2 puis 3) ; { type: "institution", id, niveau } (±1 par tour) ;
   { type: "apaiser", id: faction } apaise une faction (M2) ; diplomatie (M3a) : don, contrat, traite, rompre,
   embargo, lever_embargo, diplomate { id }, rappeler_diplomate, exiger { id, exigence }, caravane, route { id } (moteur/diplomatie.js) ; guerre (M3b, V2) : recruter, declarer_guerre, bataille { cible }, imposer_paix, paix_blanche ;
   { type: "ambition", id } (tour 1 seulement) : l'objectif de victoire.
   Les actions d'un tour s'appliquent dans l'ordre, chacune vérifiée sur l'état laissé par la précédente.
   Ordre du tour T (voir tourSuivant) : événements écrits de T → actions → réponse par défaut à l'événement en attente
   → débat de la loi (colère des opposants, tirage de l'adoption et ses chocs) → économie (production, marché, contrats,
   impôts, entretiens ; grèves du tour précédent ; démographie) → nations (revenus, embargos, diplomate, contrats échus,
   traités respectés) → exigences → guerre (recrutement, capitulations, bataille de l'ennemi, provocations, déclarations)
   → factions (effets par tour, thésaurisation, santé, niveau de vie, impôts, statuts, moral ; révolution = fin)
   → suivi des objectifs → chantiers → tirage d'un événement → T + 1. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const ECO = NODE ? require("../donnees/economie.js") : racine.Politique.ECONOMIE;
const Etat = NODE ? require("./etat.js") : racine.Politique.Etat;
const Lois = NODE ? require("./lois.js") : racine.Politique.Lois;
const Batiments = NODE ? require("./batiments.js") : racine.Politique.Batiments;
const Economie = NODE ? require("./economie.js") : racine.Politique.Economie;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;
const Guerre = NODE ? require("./guerre.js") : racine.Politique.Guerre;
const Evenements = NODE ? require("./evenements.js") : racine.Politique.Evenements;
const Objectifs = NODE ? require("./objectifs.js") : racine.Politique.Objectifs;
const INST = NODE ? require("../donnees/institutions.js") : racine.Politique.INSTITUTIONS;

function actionsDisponibles(etat){
  if (etat.fin) return [];
  return Lois.lancables(etat).map(id => ({ type: "loi", id }))
    .concat(etat.debat ? [{ type: "abandonner" }] : [])
    .concat(Object.keys(ECO.niveauxImpot).filter(n => n !== (etat.impots || "normal")).map(id => ({ type: "impots", id })))
    .concat(Batiments.constructibles(etat).map(c => ({ type: "construire", id: c.id, region: c.region })))
    .concat(Batiments.agrandissables(etat).map(c => ({ type: "agrandir", id: c.id, region: c.region })))
    .concat(Batiments.projets(etat).map(c => ({ type: "projet", id: c.id, region: c.region, avec: c.avec })))
    .concat(Batiments.defrichables(etat).map(region => ({ type: "defricher", region })))
    .concat(institutions(etat))
    .concat(Factions.apaisables(etat).map(id => ({ type: "apaiser", id })))
    .concat(Diplomatie.actions(etat))
    .concat(Guerre.actions(etat))
    .concat(Evenements.actions(etat))
    .concat(Objectifs.actions(etat));
}

// institutions (budget de fin de partie) : un cran de plus ou de moins, une fois par tour par institution ;
// monter demande l'or du nouveau niveau pour ce tour
function institutions(e){
  const r = [], niv = e.institutions || {};
  for (const id in INST.INSTITUTIONS){
    if ((e.institutionsChangees || []).includes(id)) continue;
    const n = niv[id] || 0, I = INST.INSTITUTIONS[id];
    if (n < INST.max && e.tresor >= I.cout[n + 1]) r.push({ type: "institution", id, niveau: n + 1 });
    if (n > 0) r.push({ type: "institution", id, niveau: n - 1 });
  }
  return r;
}

// même action : mêmes champs et mêmes valeurs, dans n'importe quel ordre
const cle = a => JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]]));
const memeAction = (a, b) => !!a && typeof a === "object" && cle(a) === cle(b);

function appliquerAction(e, a, r){
  if (!actionsDisponibles(e).some(d => memeAction(a, d))) throw new Error("action refusée : " + JSON.stringify(a));
  if (a.type === "loi") Lois.lancer(e, a.id);
  else if (a.type === "abandonner") Lois.abandonner(e);
  else if (a.type === "evenement") Evenements.appliquer(e, a.choix);
  else if (a.type === "impots"){ e.impots = a.id; e.journal.push(`Impôts : niveau ${a.id}.`); }
  else if (a.type === "construire") Batiments.commander(e, a.id, a.region);
  else if (a.type === "agrandir") Batiments.agrandir(e, a.id, a.region);
  else if (a.type === "projet") Batiments.commanderProjet(e, a.id, a.region, a.avec);
  else if (a.type === "defricher") Batiments.defricher(e, a.region);
  else if (a.type === "institution"){
    (e.institutions = e.institutions || {})[a.id] = a.niveau;
    (e.institutionsChangees = e.institutionsChangees || []).push(a.id);
    e.journal.push(`${INST.INSTITUTIONS[a.id].nom} : niveau ${a.niveau}.`);
  }
  else if (a.type === "apaiser") Factions.apaiser(e, a.id);
  else if (a.type === "ambition") Objectifs.choisir(e, a.id);
  else if (["recruter", "declarer_guerre", "bataille", "imposer_paix", "paix_blanche"].includes(a.type)) Guerre.appliquer(e, a, r);
  else Diplomatie.appliquer(e, a);
}

function evenements(e){
  for (const ev of e.evenements.filter(x => x.tour === e.tour)){
    if (ev.prix) e.modifPrix.push({ prix: { ...ev.prix }, jusqua: e.tour + ev.duree - 1 });
    e.journal.push(ev.texte);
  }
}

// rng : facultatif (tests) ; sinon repris de etat.alea. Son état final est rangé dans le nouvel état.
function tourSuivant(etat, actions, rng){
  if (etat.fin) throw new Error("partie terminée");
  const e = Etat.copie(etat);
  const r = rng || { s: e.alea };
  e.journal = [];
  e.recrues = [];
  evenements(e);
  for (const a of actions || []) appliquerAction(e, a, r);
  Evenements.reponseParDefaut(e);   // un événement sans réponse : la réponse gratuite
  Lois.debattre(e, r);
  Economie.appliquer(e);
  Diplomatie.tour(e);
  Diplomatie.exigences(e, r);       // V2 étape 3 : la nation sous embargo cède-t-elle ?
  Guerre.tour(e, r);
  Factions.finDeTour(e);
  Objectifs.suivre(e);              // objectifs de victoire : colère moyenne, tours calmes
  Batiments.avancer(e);
  Evenements.tirer(e, r);           // fin de tour : peut-être une carte (réponse au tour suivant)
  e.alea = r.s >>> 0;
  e.institutionsChangees = [];       // un changement par institution et par tour
  e.tour++;
  e.modifPrix = e.modifPrix.filter(m => m.jusqua >= e.tour);
  e.modifProd = (e.modifProd || []).filter(m => m.jusqua >= e.tour);
  if (e.tour > e.tourMax && !e.fin){ e.fin = true; e.issue = { type: "fin" }; }
  return e;
}

// pour les bots et l'écran : composer un tour action par action sur une copie (appliquerAction la modifie)
const Tour = { actionsDisponibles, tourSuivant, appliquerAction, memeAction };
if (NODE) module.exports = Tour; else (racine.Politique = racine.Politique || {}).Tour = Tour;
})(typeof window !== "undefined" ? window : globalThis);

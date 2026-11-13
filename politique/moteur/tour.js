/* Politique : le tour. tourSuivant(etat, actions, rng) → nouvel état ; ne mute jamais etat.
   actionsDisponibles(etat) : la seule liste que voient l'écran et les bots ; toute autre action est refusée.
   Actions : { type: "loi", id } lance une loi ; { type: "construire", id } commande un bâtiment ;
   { type: "apaiser", id: faction } apaise une faction (M2) ; diplomatie (M3a) : don, contrat, traite, rompre,
   embargo, lever_embargo (moteur/diplomatie.js).
   Les actions d'un tour s'appliquent dans l'ordre, chacune vérifiée sur l'état laissé par la précédente.
   Ordre du tour T (ASSUMPTION validée) : événements de T → actions → adoption des lois arrivées à échéance
   (et leurs chocs sur les factions) → économie (production, commerce, impôts, entretiens ; grèves du tour précédent)
   → démographie → nations (revenus, embargos, contrats échus, traités respectés) → factions (effets par tour, dissipation, statuts, moral ; révolution = fin) → chantiers
   → capital politique → T + 1. (M3 : diplomatie et guerre.) */
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

function actionsDisponibles(etat){
  if (etat.fin) return [];
  return Lois.lancables(etat).map(id => ({ type: "loi", id }))
    .concat(Batiments.constructibles(etat).map(id => ({ type: "construire", id })))
    .concat(Factions.apaisables(etat).map(id => ({ type: "apaiser", id })))
    .concat(Diplomatie.actions(etat));
}

// même action : mêmes champs et mêmes valeurs, dans n'importe quel ordre
const cle = a => JSON.stringify(Object.keys(a).sort().map(k => [k, a[k]]));
const memeAction = (a, b) => !!a && typeof a === "object" && cle(a) === cle(b);

function appliquerAction(e, a){
  if (!actionsDisponibles(e).some(d => memeAction(a, d))) throw new Error("action refusée : " + JSON.stringify(a));
  if (a.type === "loi") Lois.lancer(e, a.id);
  else if (a.type === "construire") Batiments.commander(e, a.id);
  else if (a.type === "apaiser") Factions.apaiser(e, a.id);
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
  evenements(e);
  for (const a of actions || []) appliquerAction(e, a);
  Lois.adopter(e);
  Economie.appliquer(e);
  Diplomatie.tour(e);
  Factions.finDeTour(e);
  Batiments.avancer(e);
  e.cp += ECO.cpParTour;
  e.alea = r.s >>> 0;
  e.tour++;
  e.modifPrix = e.modifPrix.filter(m => m.jusqua >= e.tour);
  if (e.tour > e.tourMax && !e.fin){ e.fin = true; e.issue = { type: "fin" }; }
  return e;
}

const Tour = { actionsDisponibles, tourSuivant };
if (NODE) module.exports = Tour; else (racine.Politique = racine.Politique || {}).Tour = Tour;
})(typeof window !== "undefined" ? window : globalThis);

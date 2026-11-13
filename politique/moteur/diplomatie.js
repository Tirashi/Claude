/* Politique : diplomatie, commerce et nations de l'ordinateur (M3a).
   e.nations[id] = { relation, tresor, familles, colere, moral } ; e.contrats = [{ id, jusqua }] ;
   e.embargos = [nation] ; e.traites = [{ type, avec, depuis }] ; e.dons = nations ayant reçu un don ce tour.
   Actions : don { id: nation, montant }, contrat { id }, traite { id: type, avec }, rompre { id: type, avec },
   embargo { id: nation }, lever_embargo { id: nation }. Fin de tour (tour) : nations, embargos, contrats, réputation. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const D = NODE ? require("../donnees/diplomatie.js") : racine.Politique.DIPLOMATIE;
const ECO = NODE ? require("../donnees/economie.js") : racine.Politique.ECONOMIE;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;

const arrondi = x => Math.round(x * 100) / 100;
const borneRel = x => Math.max(D.relation.min, Math.min(D.relation.max, arrondi(x)));
const paria = e => e.reputation < D.reputation.paria;
const embargo = (e, n) => e.embargos.includes(n);
const aTraite = (e, type, avec) => e.traites.some(t => t.type === type && (avec == null || t.avec === avec));
const relation = (e, n, d) => { e.nations[n].relation = borneRel(e.nations[n].relation + d); };

// état de départ des nations (etat.js)
function nationsInitiales(scenario){
  const r = {};
  for (const id in scenario.nations){
    const n = scenario.nations[id];
    r[id] = { relation: n.relation, tresor: n.tresor, familles: n.familles, colere: n.colere, moral: moralNation(n.colere) };
  }
  return r;
}
// moral d'une nation : la formule des factions, avec une seule jauge de colère
function moralNation(colere){
  const x = { colere, puissance: 0 }; x.statut = Factions.statutDe(x);
  return Math.round(Factions.moralFaction(x) * 10000) / 10000;
}

// une nation accepte un traité ou un contrat : pas de paria, pas d'embargo entre nous, relation suffisante
const ouverte = (e, n, min) => !paria(e) && !embargo(e, n) && e.nations[n].relation >= min;

function traitesPossibles(e){
  const r = [];
  for (const type in D.traites){
    const t = D.traites[type];
    for (const n of t.nations || Object.keys(e.nations))
      if (!aTraite(e, type, n) && ouverte(e, n, t.relationMin) && (!t.requiert || aTraite(e, t.requiert, n))) r.push({ type: "traite", id: type, avec: n });
  }
  return r;
}

function actions(e){
  const r = [];
  for (const n in e.nations){
    if (!e.dons.includes(n)) for (const m of D.dons) if (e.tresor >= m) r.push({ type: "don", id: n, montant: m });
    r.push(embargo(e, n) ? { type: "lever_embargo", id: n } : { type: "embargo", id: n });
  }
  for (const id in D.contrats){
    const c = D.contrats[id];
    if (!e.contrats.some(x => x.id === id) && ouverte(e, c.nation, D.relationContrat)) r.push({ type: "contrat", id });
  }
  r.push(...traitesPossibles(e));
  for (const t of e.traites) r.push({ type: "rompre", id: t.type, avec: t.avec });
  return r;
}

// sanction légitime : cible en guerre contre le joueur ou contre un membre de l'Entente (guerres en M3b)
const legitime = (e, n) => (e.guerres || []).some(g => g.contre === n);

function rompre(e, type, avec){
  const nom = D.traites[type].nom;
  e.traites = e.traites.filter(t => !(t.type === type && t.avec === avec));
  e.reputation += D.reputation.traiteRompu;
  e.journal.push(`Traité rompu : ${nom} avec ${avec}.`);
  // un traité qui dépendait de celui-ci tombe aussi (ASSUMPTION (M3a))
  for (const t of e.traites.filter(t => t.avec === avec && D.traites[t.type].requiert === type)) rompre(e, t.type, avec);
}

function appliquer(e, a){
  if (a.type === "don"){
    e.tresor = arrondi(e.tresor - a.montant);
    relation(e, a.id, a.montant * D.relation.donParOr);
    e.reputation += Math.min(D.reputation.donMax, Math.floor(a.montant / 20) * D.reputation.donPar20);
    e.dons.push(a.id);
    e.journal.push(`Don de ${a.montant} or à ${a.id}.`);
  } else if (a.type === "contrat"){
    const c = D.contrats[a.id];
    e.contrats.push({ id: a.id, jusqua: e.tour + c.duree - 1 });
    relation(e, c.nation, D.relation.contrat);
    e.journal.push(`Contrat signé : ${c.sens === "achat" ? "achat" : "vente"} de ${c.volume} ${c.bien} par tour à ${c.prix} (${c.duree} tours).`);
  } else if (a.type === "traite"){
    e.traites.push({ type: a.id, avec: a.avec, depuis: e.tour });
    relation(e, a.avec, D.relation.traite);
    e.reputation += D.reputation.traiteSigne;
    e.journal.push(`Traité signé : ${D.traites[a.id].nom} avec ${a.avec}.`);
  } else if (a.type === "rompre") rompre(e, a.id, a.avec);
  else if (a.type === "embargo"){
    e.embargos.push(a.id);
    relation(e, a.id, D.relation.embargo);
    e.reputation += legitime(e, a.id) ? D.reputation.sanctionLegitime : D.reputation.sanctionIllegitime;
    e.contrats = e.contrats.filter(x => D.contrats[x.id].nation !== a.id);   // plus de commerce avec la cible
    e.journal.push(`Embargo contre ${a.id}.`);
  } else if (a.type === "lever_embargo"){
    e.embargos = e.embargos.filter(n => n !== a.id);
    e.journal.push(`Embargo levé contre ${a.id}.`);
  }
}

// échanges à prix fixe du tour, vus du joueur : volume > 0 reçu (payé), < 0 livré (encaissé)
function flux(e){
  const r = [];
  for (const x of e.contrats){
    const c = D.contrats[x.id];
    r.push({ source: x.id, bien: c.bien, volume: c.sens === "achat" ? c.volume : -c.volume, prix: c.prix });
  }
  for (const t of e.traites){
    const l = D.traites[t.type].livraison, b = D.traites[t.type].batiment, n = l && (e.batiments[b] || 0);
    if (n) r.push({ source: t.type, bien: l.bien, volume: -l.volume * n, prix: l.prix });
  }
  return r;
}

// tarifs de l'Entente sur le marché (achat, vente) pour un membre
function tarifs(e){
  return aTraite(e, "entente") ? D.traites.entente.tarifs : { achat: 1, vente: 1 };
}

// fin de tour : nations (revenu, familles, colère, embargo), contrats échus, traités respectés
function tour(e){
  const surplus = e.bilan ? e.bilan.balance : {};
  for (const id in e.nations){
    const n = e.nations[id], s = e.profils[id];
    n.tresor = arrondi(n.tresor + n.familles * s.taux - D.nation.armee);
    n.familles = arrondi(n.familles * (1 + D.nation.croissance));
    let colere = n.colere - D.nation.dissipation;
    if (embargo(e, id)){
      let manque = 0, cout = 0;
      for (const b in s.importe){ const m = Math.min(s.importe[b], Math.max(0, surplus[b] || 0)); manque += m; cout += m * ECO.prix[b]; }
      colere += manque * D.embargo.colereParManque;
      n.tresor = arrondi(n.tresor - cout);
      n.manque = manque;
    } else delete n.manque;
    n.colere = Math.max(0, Math.min(100, arrondi(colere)));
    n.moral = moralNation(n.colere);
  }
  for (const x of e.contrats.filter(x => x.jusqua <= e.tour)) e.journal.push(`Contrat terminé : ${x.id}.`);
  e.contrats = e.contrats.filter(x => x.jusqua > e.tour);
  for (const t of e.traites){
    const age = e.tour - t.depuis;
    if (age > 0 && age % D.reputation.respectTous === 0) e.reputation += D.reputation.traiteRespecte;
  }
  e.dons = [];
}

const Diplomatie = { nationsInitiales, moralNation, actions, appliquer, flux, tarifs, tour, aTraite, paria, embargo, legitime };
if (NODE) module.exports = Diplomatie; else (racine.Politique = racine.Politique || {}).Diplomatie = Diplomatie;
})(typeof window !== "undefined" ? window : globalThis);

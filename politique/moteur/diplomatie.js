/* Politique : diplomatie, commerce et nations de l'ordinateur (M3a).
   e.nations[id] = { relation, tresor, familles, colere, moral } ; e.contrats = [{ id, jusqua }] ;
   e.diplomate = { nation, depuis } ou null (un seul diplomate) ; e.embargos = [nation] ; e.traites = [{ type, avec, depuis }] ; e.dons = nations ayant reçu un don ce tour.
   Actions : don { id: nation, montant }, contrat { id }, traite { id: type, avec }, rompre { id: type, avec },
   embargo { id: nation }, lever_embargo { id: nation }. Fin de tour (tour) : nations, embargos, contrats, réputation. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const Alea = NODE ? require("./alea.js") : racine.Politique.Alea;
const D = NODE ? require("../donnees/diplomatie.js") : racine.Politique.DIPLOMATIE;
const ECO = NODE ? require("../donnees/economie.js") : racine.Politique.ECONOMIE;
const GU = NODE ? require("../donnees/guerre.js") : racine.Politique.GUERRE;
const BAT = NODE ? require("../donnees/batiments.js") : racine.Politique.BATIMENTS;
const { LOIS } = NODE ? require("../donnees/lois.js") : racine.Politique.LOIS;
const PERSONAS = NODE ? require("../donnees/personas.js") : racine.Politique.PERSONAS;
const persona = (e, n) => PERSONAS[e.profils[n].persona];
const nom = (e, n) => (e.profils[n] || {}).nom || n;   // nom d'une nation pour le journal
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;

const { arrondi } = NODE ? require("./calcul.js") : racine.Politique.Calcul;
const borneRel = x => Math.max(D.relation.min, Math.min(D.relation.max, arrondi(x)));
// réputation (V2 étape 6) : fusionnée dans les relations ; la « réputation » est la moyenne des relations
const reputation = e => {
  if (!D.fusion.actif) return e.reputation;
  const r = Object.values(e.nations).map(n => n.relation);
  return arrondi(r.reduce((a, b) => a + b, 0) / r.length);
};
const paria = e => reputation(e) < D.reputation.paria;
const embargo = (e, n) => e.embargos.includes(n);
const aTraite = (e, type, avec) => e.traites.some(t => t.type === type && (avec == null || t.avec === avec));
// la seule façon de changer une relation : bornée par D.relation (−100 à 100)
const relation = (e, n, d) => { e.nations[n].relation = borneRel(e.nations[n].relation + d); };
// points de réputation du barème : toutes les relations bougent de part × points (sauf la nation « sauf »)
function reputer(e, points, sauf){
  if (!points) return;
  if (!D.fusion.actif){ e.reputation += points; return; }   // V1
  for (const n in e.nations) if (n !== sauf) relation(e, n, points * D.fusion.part);
}

// état de départ des nations (etat.js)
function nationsInitiales(scenario, profils){
  const r = {};
  for (const id in scenario.nations){
    const n = scenario.nations[id];
    r[id] = { relation: n.relation, tresor: n.tresor, familles: n.familles, colere: n.colere, moral: moralNation(n.colere), regiments: PERSONAS[profils[id].persona].regiments };
  }
  return r;
}
// contrats proposés : chaque nation achète ce qu'elle importe et vend ce qu'elle exporte (sens = ce que fait le joueur) ;
// identifiant « nation_bien », ou « nation_bien_achat » / « nation_bien_vente » si la nation exporte et importe ce bien
function offres(profils){
  const r = {}, C = D.contrats;
  for (const n in profils){
    const deux = b => profils[n].exporte[b] != null && profils[n].importe[b] != null;
    const cle = (b, sens) => n + "_" + b + (deux(b) ? "_" + sens : "");
    for (const b in profils[n].exporte) r[cle(b, "achat")] = { nation: n, sens: "achat", bien: b, volume: Math.min(C.volumeMax, profils[n].exporte[b]), prix: arrondi(ECO.prix[b] * C.prixAchat), duree: C.duree };
    for (const b in profils[n].importe) r[cle(b, "vente")] = { nation: n, sens: "vente", bien: b, volume: Math.min(C.volumeMax, profils[n].importe[b]), prix: arrondi(ECO.prix[b] * C.prixVente), duree: C.duree };
  }
  return r;
}
// moral d'une nation : la formule des factions, avec une seule jauge de colère
function moralNation(colere){
  const x = { colere, puissance: 0 }; x.statut = Factions.statutDe(x);
  return Math.round(Factions.moralFaction(x) * 10000) / 10000;
}

// une nation accepte un traité ou un contrat : pas de paria, pas d'embargo ni de sanction entre nous,
// pas en guerre contre nous, relation suffisante
const sanctionne = (e, n) => (e.sanctions || []).some(s => s.par === n && s.contre === "joueur");
const ennemi = (e, n) => !!e.guerre && e.guerre.ennemis.includes(n);
// partenaire d'un projet commun : l'Entente avec nous, sans embargo, sanction ni guerre
const partenaire = (e, n) => aTraite(e, "entente", n) && !embargo(e, n) && !sanctionne(e, n) && !ennemi(e, n);
const ouverte = (e, n, min) => !paria(e) && !embargo(e, n) && !sanctionne(e, n) && !ennemi(e, n) && e.nations[n].relation >= min;

// un traité : relation au moins celle du traité et celle du persona ; certains personas en refusent ; l'idéaliste juge la réputation
function traitesPossibles(e){
  const r = [];
  for (const type in D.traites){
    const t = D.traites[type];
    if (t.batiment && D.projet.actif) continue;   // filature conjointe : remplacée par le projet commun (16/11)
    for (const n of Object.keys(e.nations)){
      const p = persona(e, n);
      if ((p.refuse || []).includes(type) || (p.reputationMin != null && reputation(e) < p.reputationMin)) continue;
      if (!aTraite(e, type, n) && ouverte(e, n, Math.max(t.relationMin, p.traite)) && (!t.requiert || aTraite(e, t.requiert, n))) r.push({ type: "traite", id: type, avec: n });
    }
  }
  return r;
}

function actions(e){
  const r = [];
  for (const n in e.nations){
    if (!e.dons.includes(n)) for (const m of D.dons) if (e.tresor >= m) r.push({ type: "don", id: n, montant: m });
    r.push(embargo(e, n) ? { type: "lever_embargo", id: n } : { type: "embargo", id: n });
  }
  const plein = (D.contrats.maxEnCours != null && e.contrats.length >= D.contrats.maxEnCours)   // plafond (en essai)
    || (D.transport.actif && e.contrats.length >= (e.caravanes || 0));                               // transport : une caravane par contrat
  if (!plein) for (const id in e.offres){
    const c = e.offres[id];
    if (!e.contrats.some(x => x.id === id) && ouverte(e, c.nation, persona(e, c.nation).contrat)) r.push({ type: "contrat", id });
  }
  r.push(...traitesPossibles(e));
  for (const t of e.traites) r.push({ type: "rompre", id: t.type, avec: t.avec });
  // diplomate (V2 étape 2) : envoyé dans une nation qui n'est pas en guerre contre nous ; un seul, déplaçable, rappelable
  for (const n in e.nations) if (!ennemi(e, n) && (!e.diplomate || e.diplomate.nation !== n) && e.tresor >= D.diplomate.cout) r.push({ type: "diplomate", id: n });
  if (e.diplomate) r.push({ type: "rappeler_diplomate" });
  // transport (16/11) : acheter une caravane ; améliorer la route vers une nation (pas en guerre contre nous)
  if (D.transport.actif){
    if (e.tresor >= D.transport.coutCaravane) r.push({ type: "caravane" });
    for (const n in e.nations) if (!(e.routes || []).includes(n) && !ennemi(e, n) && e.tresor >= D.transport.coutRoute) r.push({ type: "route", id: n });
  }
  r.push(...investissables(e));
  // exigence (V2 étape 3) : contre une nation sous notre embargo, une à la fois par nation ; lever ses sanctions seulement si elle en a
  for (const n in e.nations){
    if (!embargo(e, n) || ennemi(e, n) || (e.exigences || []).some(x => x.nation === n)) continue;
    for (const t in D.exigence.types)
      if (t !== "lever_sanctions" || e.sanctions.some(x => x.par === n && x.contre === "joueur")) r.push({ type: "exiger", id: n, exigence: t });
  }
  return r;
}

// investir à l'étranger (16/11) : [{ type: "investir", id, avec, region }] (région de la nation, une par région)
function investissables(e){
  const I = D.investissement, r = [];
  if (!I.actif || Object.values(e.lois).some(l => LOIS[l.id].eco.sansInvestissement)) return r;   // Contrôle des capitaux
  for (const n in e.nations){
    if (!ouverte(e, n, I.relationMin)) continue;
    const libres = Object.keys(e.profils[n].regions).filter(reg => !(e.occupations || {})[reg] && !(e.investissements || []).some(x => x.region === reg));
    if (!libres.length) continue;
    for (const id of I.batiments){
      if (e.profils[n].exporte[Object.keys(BAT[id].produit)[0]] == null || e.tresor < BAT[id].cout) continue;
      for (const reg of libres) r.push({ type: "investir", id, avec: n, region: reg });
    }
  }
  return r;
}
// dividendes du tour, avant les lois : dividende × prix de chaque investissement construit
const dividendes = e => arrondi((e.investissements || []).filter(x => x.restant <= 0).reduce((t, x) => t + BAT[x.id].cout * D.investissement.dividende, 0));
// confiscation de nos investissements chez une nation (embargo, guerre, sanctions)
function confisquer(e, n){
  const perdus = (e.investissements || []).filter(x => x.nation === n);
  if (!perdus.length) return;
  e.investissements = e.investissements.filter(x => x.nation !== n);
  e.journal.push(`${nom(e, n)} confisque nos investissements (${perdus.map(x => BAT[x.id].nom.toLowerCase()).join(", ")}).`);
}

// fin de tour (V2 étape 3) : chaque exigence en cours ; la nation cède si l'embargo lui fait assez mal, sinon refuse au bout du délai
function exigences(e, r){
  const X = D.exigence, garde = [];
  for (const x of e.exigences || []){
    const n = e.nations[x.nation], nom = e.profils[x.nation].nom, type = X.types[x.exigence];
    if (!embargo(e, x.nation) || ennemi(e, x.nation)) continue;                    // embargo levé ou guerre : abandonnée
    const chance = n.manque > 0 ? Math.max(0, Math.min(1, (n.colere - X.debut) / (X.cede - X.debut))) : 0;
    if (chance > 0 && Alea.suivant(r) < chance){
      if (x.exigence === "lever_sanctions") e.sanctions = e.sanctions.filter(s => !(s.par === x.nation && s.contre === "joueur"));
      else if (x.exigence === "cesser_provocations") (e.calmes = e.calmes || {})[x.nation] = e.tour + type.tours;
      else if (x.exigence === "dedommagement"){ const o = Math.max(0, Math.min(type.or, n.tresor)); n.tresor = arrondi(n.tresor - o); e.tresor = arrondi(e.tresor + o); }
      relation(e, x.nation, X.cedeRelation);
      if (e.suivi) e.suivi.cedees = (e.suivi.cedees || 0) + 1;   // objectif Influence
      e.journal.push(`${nom} cède : accepte de ${type.nom}.`);
    } else if (e.tour - x.depuis + 1 >= X.duree){
      relation(e, x.nation, X.refusRelation);
      e.journal.push(`${nom} refuse de ${type.nom}.`);
    } else garde.push(x);
  }
  e.exigences = garde;
}

// sanction légitime : cible en guerre contre le joueur (seules guerres du jeu ; le joueur peut être membre de l'Entente)
const legitime = (e, n) => ennemi(e, n);

// sanctions de bloc d'un membre de l'Entente contre le joueur : fin de ses traités (sans pénalité pour le joueur),
// de ses contrats, relation −30 (ASSUMPTION validée (M3b))
function couper(e, n){
  e.traites = e.traites.filter(t => t.avec !== n);
  finirProjets(e, n, false);
  confisquer(e, n);
  e.contrats = e.contrats.filter(x => e.offres[x.id].nation !== n);
  relation(e, n, D.relation.embargo);
  e.sanctions.push({ par: n, contre: "joueur" });
  e.journal.push(`${e.profils[n].nom} rompt avec nous et nous met sous embargo.`);
}

function rompre(e, type, avec){
  e.traites = e.traites.filter(t => !(t.type === type && t.avec === avec));
  reputer(e, D.reputation.traiteRompu);
  if (type === "entente") finirProjets(e, avec, true);   // plus d'Entente : projets communs reniés
  e.journal.push(`Traité rompu : ${D.traites[type].nom} avec ${nom(e, avec)}.`);
  // un traité qui dépendait de celui-ci tombe aussi (ASSUMPTION validée (M3a))
  for (const t of e.traites.filter(t => t.avec === avec && D.traites[t.type].requiert === type)) rompre(e, t.type, avec);
}

function appliquer(e, a){
  if (a.type === "don"){
    e.tresor = arrondi(e.tresor - a.montant);
    relation(e, a.id, a.montant * D.relation.donParOr);
    reputer(e, Math.min(D.reputation.donMax, Math.floor(a.montant / 20) * D.reputation.donPar20));
    e.dons.push(a.id);
    e.journal.push(`Don de ${a.montant} or à ${nom(e, a.id)}.`);
  } else if (a.type === "contrat"){
    const c = e.offres[a.id];
    e.contrats.push({ id: a.id, jusqua: e.tour + c.duree - 1 });
    relation(e, c.nation, D.relation.contrat);
    e.journal.push(`Contrat signé avec ${nom(e, c.nation)} : ${c.sens === "achat" ? "achat" : "vente"} de ${c.volume} ${c.bien} par tour à ${c.prix} (${c.duree} tours).`);
  } else if (a.type === "traite"){
    e.traites.push({ type: a.id, avec: a.avec, depuis: e.tour });
    relation(e, a.avec, D.relation.traite);
    reputer(e, D.reputation.traiteSigne);
    e.journal.push(`Traité signé : ${D.traites[a.id].nom} avec ${nom(e, a.avec)}.`);
  } else if (a.type === "rompre") rompre(e, a.id, a.avec);
  else if (a.type === "embargo"){
    e.embargos.push(a.id);
    finirProjets(e, a.id, true);
    confisquer(e, a.id);
    relation(e, a.id, D.relation.embargo);
    reputer(e, legitime(e, a.id) ? D.reputation.sanctionLegitime : D.reputation.sanctionIllegitime);
    e.contrats = e.contrats.filter(x => e.offres[x.id].nation !== a.id);   // plus de commerce avec la cible
    e.journal.push(`Embargo contre ${nom(e, a.id)}.`);
  } else if (a.type === "investir"){
    e.tresor = arrondi(e.tresor - BAT[a.id].cout);
    (e.investissements = e.investissements || []).push({ nation: a.avec, region: a.region, id: a.id, restant: BAT[a.id].delai });
    e.journal.push(`Investissement chez ${nom(e, a.avec)} : ${BAT[a.id].nom} (${e.profils[a.avec].regions[a.region].nom}, ${BAT[a.id].cout} or).`);
  } else if (a.type === "caravane"){
    e.tresor = arrondi(e.tresor - D.transport.coutCaravane);
    e.caravanes = (e.caravanes || 0) + 1;
    e.journal.push(`Caravane achetée (${e.caravanes} en tout).`);
  } else if (a.type === "route"){
    e.tresor = arrondi(e.tresor - D.transport.coutRoute);
    (e.routes = e.routes || []).push(a.id);
    e.journal.push(`Route améliorée vers ${e.profils[a.id].nom}.`);
  } else if (a.type === "exiger"){
    (e.exigences = e.exigences || []).push({ nation: a.id, exigence: a.exigence, depuis: e.tour });
    e.journal.push(`Exigence envoyée à ${e.profils[a.id].nom} : ${D.exigence.types[a.exigence].nom}.`);
  } else if (a.type === "diplomate"){
    e.diplomate = { nation: a.id, depuis: e.tour };
    e.journal.push(`Diplomate envoyé chez ${e.profils[a.id].nom}.`);
  } else if (a.type === "rappeler_diplomate"){
    e.journal.push(`Diplomate rappelé de chez ${e.profils[e.diplomate.nation].nom}.`);
    e.diplomate = null;
  } else if (a.type === "lever_embargo"){
    e.embargos = e.embargos.filter(n => n !== a.id);
    e.journal.push(`Embargo levé contre ${nom(e, a.id)}.`);
  }
}

// échanges à prix fixe du tour, vus du joueur : volume > 0 reçu (payé), < 0 livré (encaissé)
function flux(e){
  const r = [];
  for (const x of e.contrats){
    const c = e.offres[x.id], t = transport(e, c.nation);
    // transport : à l'achat le prix monte, à la vente il baisse (jamais sous 0)
    r.push({ source: x.id, bien: c.bien, volume: c.sens === "achat" ? c.volume : -c.volume, prix: c.sens === "achat" ? arrondi(c.prix + t) : Math.max(0, arrondi(c.prix - t)) });
  }
  for (const t of e.traites){
    const l = D.traites[t.type].livraison, b = D.traites[t.type].batiment, n = l && enService(e, b);
    if (n) r.push({ source: t.type, bien: l.bien, volume: -l.volume * n, prix: l.prix });
  }
  // projets communs en service : la part du partenaire, à prix réduit, sans transport (pas pendant une occupation)
  for (const x of e.projets || []){
    if (!x.enService || (e.occupations || {})[x.region]) continue;
    const l = livraisonProjet(x.id);
    r.push({ source: "projet_" + x.nation, bien: l.bien, volume: -l.volume, prix: l.prix });
  }
  return r;
}

// projet commun : ce que reçoit le partenaire chaque tour (part de la production de base d'un bâtiment)
function livraisonProjet(id){
  const bien = Object.keys(BAT[id].produit)[0];
  return { bien, volume: Math.round(BAT[id].produit[bien] * D.projet.volume), prix: arrondi(ECO.prix[bien] * D.projet.prix) };
}
// fin des projets communs avec une nation avant leur terme ; faute : le joueur les renie (relation)
function finirProjets(e, n, faute){
  const fin = (e.projets || []).filter(x => x.nation === n);
  if (!fin.length) return;
  e.projets = e.projets.filter(x => x.nation !== n);
  if (faute) relation(e, n, D.projet.rupture);
  e.journal.push(`Projet commun avec ${nom(e, n)} interrompu` + (faute ? ` : nous renions notre dette (relation ${D.projet.rupture}).` : "."));
}

// bâtiments d'un type en service : ceux des régions occupées ne produisent pas (revue du 16/11)
const enService = (e, b) => Object.keys(e.regions).filter(r => !(e.occupations || {})[r]).reduce((t, r) => t + (e.regions[r].batiments[b] || 0), 0);

// coût de transport d'une unité vers une nation (16/11) : parUnite × distance, divisé par la route améliorée
function transport(e, n){
  if (!D.transport.actif) return 0;
  const p = e.profils[n];
  return arrondi(D.transport.parUnite * ((p && p.distance) || 1) * ((e.routes || []).includes(n) ? D.transport.route : 1));
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
    // V2 : le revenu suit la part des régions tenues (3 au départ ; occupées : perdues) ; l'armée coûte ses régiments
    const tenues = Object.keys(s.regions).filter(r => !(e.occupations || {})[r]).length;
    n.tresor = arrondi(n.tresor + n.familles * s.taux * tenues / 3 - n.regiments * GU.regiment.entretien);
    n.familles = arrondi(n.familles * (1 + D.nation.croissance));
    let colere = n.colere - D.nation.dissipation;
    // embargo du joueur (ce qu'il a en trop) et sanctions d'autres nations (ce qu'elles exportent)
    const par = e.sanctions.filter(x => x.contre === id && x.par !== "joueur").map(x => x.par);
    if (embargo(e, id) || par.length){
      let manque = 0, cout = 0;
      for (const b in s.importe){
        let m = embargo(e, id) ? Math.max(0, surplus[b] || 0) : 0;
        for (const p of par) m += e.profils[p].exporte[b] || 0;
        m = Math.min(s.importe[b], m); manque += m; cout += m * ECO.prix[b];
      }
      colere += manque * D.embargo.colereParManque;
      n.tresor = arrondi(n.tresor - cout);
      n.manque = manque;
    } else delete n.manque;
    n.colere = Math.max(0, Math.min(100, arrondi(colere)));
    n.moral = moralNation(n.colere);
  }
  // diplomate (V2 étape 2) : coût et relation chaque tour ; rappelé si la guerre éclate avec sa nation
  if (e.diplomate){
    if (ennemi(e, e.diplomate.nation)){ e.journal.push(`Diplomate rappelé : guerre avec ${e.profils[e.diplomate.nation].nom}.`); e.diplomate = null; }
    else { e.tresor = arrondi(e.tresor - D.diplomate.cout); relation(e, e.diplomate.nation, D.diplomate.relation); }
  }
  // le commerce rapproche (V2 étape 1) : +1 par tour avec une nation tant qu'un contrat ou un traité est en cours
  if (D.hostilite.actif) for (const id in e.nations){
    if (e.contrats.some(x => e.offres[x.id].nation === id) || e.traites.some(t => t.avec === id) || (e.projets || []).some(x => x.nation === id)
      || (e.investissements || []).some(x => x.nation === id))
      relation(e, id, D.hostilite.commerceParTour);
  }
  // projets communs : un tour de livraison de moins (pas pendant une occupation) ; terminé : le bâtiment est à nous
  for (const x of e.projets || []){
    if (!x.enService || (e.occupations || {})[x.region]) continue;
    if (--x.livraisons <= 0) e.journal.push(`Projet commun terminé avec ${nom(e, x.nation)} : ${BAT[x.id].nom} entièrement à nous.`);
  }
  if (e.projets) e.projets = e.projets.filter(x => x.livraisons > 0);
  // investissements en construction (arrêtés pendant une occupation de la région)
  for (const x of e.investissements || []){
    if (x.restant <= 0 || (e.occupations || {})[x.region]) continue;
    if (--x.restant <= 0) e.journal.push(`Investissement terminé chez ${nom(e, x.nation)} : ${BAT[x.id].nom} ; les dividendes commencent.`);
  }
  for (const x of e.contrats.filter(x => x.jusqua <= e.tour)) { const c = e.offres[x.id]; e.journal.push(`Contrat terminé : ${c.sens === "achat" ? "achat" : "vente"} de ${c.bien} (${nom(e, c.nation)}).`); }
  e.contrats = e.contrats.filter(x => x.jusqua > e.tour);
  for (const t of e.traites){
    const age = e.tour - t.depuis;
    if (age > 0 && age % D.reputation.respectTous === 0) reputer(e, D.reputation.traiteRespecte);
  }
  e.dons = [];
}

const Diplomatie = { investissables, dividendes, confisquer, partenaire, livraisonProjet, finirProjets, changerRelation: relation, transport, exigences, reputer, reputation, persona, offres, nationsInitiales, moralNation, actions, appliquer, flux, tarifs, tour, aTraite, paria, embargo, legitime, rompre, couper };
if (NODE) module.exports = Diplomatie; else (racine.Politique = racine.Politique || {}).Diplomatie = Diplomatie;
})(typeof window !== "undefined" ? window : globalThis);

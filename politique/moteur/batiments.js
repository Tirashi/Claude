/* Politique : bâtiments, régions et chantiers (RULES_V1 § Bâtiments ; V2 : régions, specs/politique/regles-v2.md § 1).
   e.regions[r] = { nom, terrain, emplacements, batiments: { id: nombre } } ; e.batiments = totaux du pays (somme des régions,
   tenue à jour ici) ; e.chantiers = [{ id, region, restant }], **un chantier par région**, tous avancent chaque tour.
   Un bâtiment occupe un emplacement de sa région (sauf emplacement: false). Payé à la commande (ASSUMPTION validée). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const BAT = NODE ? require("../donnees/batiments.js") : racine.Politique.BATIMENTS;
const TERRAINS = NODE ? require("../donnees/carte.js") : racine.Politique.TERRAINS;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;
const Lois = NODE ? require("./lois.js") : racine.Politique.Lois;
const { NIVEAUX, DEFRICHEMENT: DEF } = NODE ? require("../donnees/institutions.js") : racine.Politique.INSTITUTIONS;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;
const D = NODE ? require("../donnees/diplomatie.js") : racine.Politique.DIPLOMATIE;

const { arrondi } = NODE ? require("./calcul.js") : racine.Politique.Calcul;
// part payée par le joueur (bâtiment cofinancé par un traité)
// lois : interventionnisme, laisser-faire (coût des bâtiments) ; sans état : le prix de base
const cout = (id, e) => arrondi(BAT[id].cout * (BAT[id].partJoueur || 1) * (e ? Lois.effets(e).construction : 1));
const prendPlace = id => BAT[id].emplacement !== false;
// bonus de terrain d'un bâtiment dans une région
const bonus = (e, r, id) => TERRAINS[e.regions[r].terrain].bonus[id] || 1;
// emplacements pris dans une région (bâtiments en service et en chantier)
function occupes(e, r){
  let n = 0;
  for (const id in e.regions[r].batiments) if (prendPlace(id)) n += e.regions[r].batiments[id];
  for (const c of e.chantiers) if (c.region === r && !c.agrandir && !c.defricher && prendPlace(c.id)) n++;
  return n;
}
const enChantier = (e, r) => e.chantiers.some(c => c.region === r);

// une région peut-elle recevoir ce bâtiment ? (chantier libre, pas occupée, un fort par région, une place)
function placeLibre(e, reg, id){
  if (enChantier(e, reg) || (e.occupations || {})[reg]) return false;                       // V2 étape 2 : pas de chantier en région occupée
  if (BAT[id].unique && (e.regions[reg].batiments[id] || 0) > 0) return false;              // un fort par région
  return !prendPlace(id) || occupes(e, reg) < e.regions[reg].emplacements;
}
// ce qui peut se construire, et où : [{ id, region }]
function constructibles(e){
  const r = [];
  for (const id in BAT){
    const b = BAT[id];
    if (b.jalon || (b.traite && !Diplomatie.aTraite(e, b.traite)) || e.tresor < cout(id, e)) continue;
    for (const reg in e.regions) if (placeLibre(e, reg, id)) r.push({ id, region: reg });
  }
  return r;
}

// projet commun (16/11) : un bâtiment de production cofinancé par une nation partenaire (donnees/diplomatie.js, projet)
const coutProjet = (id, e) => arrondi(cout(id, e) * (1 - D.projet.part));
function projets(e){
  const P = D.projet, r = [];
  if (!P.actif) return r;
  for (const n in e.nations){
    if (!Diplomatie.partenaire(e, n) || (e.projets || []).some(x => x.nation === n)) continue;   // un projet en cours par nation
    for (const id of P.batiments){
      if (e.profils[n].importe[Object.keys(BAT[id].produit)[0]] == null || e.tresor < coutProjet(id, e)) continue;
      for (const reg in e.regions) if (placeLibre(e, reg, id)) r.push({ id, region: reg, avec: n });
    }
  }
  return r;
}
function commanderProjet(e, id, region, avec){
  const prix = coutProjet(id, e);
  e.tresor = arrondi(e.tresor - prix);
  e.chantiers.push({ id, region, restant: BAT[id].delai, projet: avec });
  (e.projets = e.projets || []).push({ nation: avec, id, region, livraisons: D.projet.livraisons, enService: false });
  Diplomatie.changerRelation(e, avec, D.projet.relation);
  e.journal.push(`Projet commun avec ${e.profils[avec].nom} : ${BAT[id].nom} (${e.regions[region].nom}, ${prix} or, le reste payé par eux).`);
}

// agrandir (budget de fin de partie, 14/11) : e.regions[r].niveaux[id] = nombre de niveaux ajoutés aux bâtiments de ce type
// (les bâtiments passent d'abord tous au niveau 2, puis au niveau 3 : au plus 2 niveaux par bâtiment)
const niveaux = (e, r, id) => ((e.regions[r].niveaux || {})[id] || 0);
// facteur d'un type de bâtiment dans une région : n bâtiments, k niveaux ajoutés → n + gain × k
const facteur = (e, r, id) => (e.regions[r].batiments[id] || 0) + NIVEAUX.gain * niveaux(e, r, id);
function coutAgrandir(e, r, id){
  const n = e.regions[r].batiments[id] || 0, k = niveaux(e, r, id);
  return arrondi(BAT[id].cout * NIVEAUX.cout[k < n ? 2 : 3] * Lois.effets(e).construction);
}
function agrandissables(e){
  const r = [];
  for (const reg in e.regions){
    if (enChantier(e, reg) || (e.occupations || {})[reg]) continue;
    for (const id of NIVEAUX.batiments){
      const n = e.regions[reg].batiments[id] || 0;
      if (n > 0 && niveaux(e, reg, id) < 2 * n && e.tresor >= coutAgrandir(e, reg, id)) r.push({ id, region: reg });
    }
  }
  return r;
}
function agrandir(e, id, region){
  const prix = coutAgrandir(e, region, id);
  e.tresor = arrondi(e.tresor - prix);
  e.chantiers.push({ id, region, restant: BAT[id].delai, agrandir: true });
  e.journal.push(`Agrandissement commandé : ${BAT[id].nom} (${e.regions[region].nom}, ${prix} or).`);
}

function commander(e, id, region){
  const prix = cout(id, e);
  e.tresor = arrondi(e.tresor - prix);
  e.chantiers.push({ id, region, restant: BAT[id].delai });
  e.journal.push(`Chantier commandé : ${BAT[id].nom} (${e.regions[region].nom}, ${prix} or).`);
}

// défricher (16/11) : +1 emplacement dans une région, 3 fois au plus par région, de plus en plus cher
const coutDefricher = (e, r) => arrondi(DEF.couts[e.regions[r].defriche || 0] * Lois.effets(e).construction);
function defrichables(e){
  if (!DEF.actif) return [];
  return Object.keys(e.regions).filter(r => !enChantier(e, r) && !(e.occupations || {})[r]
    && (e.regions[r].defriche || 0) < DEF.couts.length && e.tresor >= coutDefricher(e, r));
}
function defricher(e, region){
  const prix = coutDefricher(e, region);
  e.tresor = arrondi(e.tresor - prix);
  e.chantiers.push({ id: "defrichement", region, restant: DEF.delai, defricher: true });
  e.journal.push(`Défrichement commencé : ${e.regions[region].nom} (${prix} or).`);
}

// fin du tour : chaque chantier avance d'un tour ; un bâtiment fini produit dès le tour suivant
function avancer(e){
  for (const c of e.chantiers){
    if ((e.occupations || {})[c.region]) continue;   // chantier arrêté pendant l'occupation
    c.restant--;
    if (c.restant > 0) continue;
    if (c.defricher){
      const reg = e.regions[c.region];
      reg.emplacements++; reg.defriche = (reg.defriche || 0) + 1;
      if (e.factions.paysans){ Factions.modifier(e, "paysans", "colere", DEF.paysans); Factions.renforcer(e, "paysans", 1, "défrichement"); Factions.evaluer(e); }   // statuts à jour (fin de tour)
      e.journal.push(`Défrichement terminé : ${reg.nom} gagne un emplacement ; les paysans s'en réjouissent.`);
      continue;
    }
    if (c.agrandir){
      const nv = e.regions[c.region].niveaux = e.regions[c.region].niveaux || {};
      nv[c.id] = (nv[c.id] || 0) + 1;
      e.journal.push(`Agrandissement terminé : ${BAT[c.id].nom} (${e.regions[c.region].nom}).`);
      Factions.renforcer(e, "patrons", 1, "agrandissement"); Factions.evaluer(e);
      continue;
    }
    const b = e.regions[c.region].batiments;
    if (c.projet){   // projet commun : les livraisons commencent (s'il n'a pas été rompu pendant le chantier)
      const x = (e.projets || []).find(x => x.nation === c.projet && x.region === c.region && x.id === c.id && !x.enService);
      if (x){ x.enService = true; e.journal.push(`Projet commun : ${e.profils[c.projet].nom} reçoit sa part pendant ${x.livraisons} tours.`); }
    }
    b[c.id] = (b[c.id] || 0) + 1;
    e.batiments[c.id] = (e.batiments[c.id] || 0) + 1;
    e.journal.push(`Bâtiment terminé : ${BAT[c.id].nom} (${e.regions[c.region].nom}).`);
    const f = Factions.baseDe(c.id);
    if (f){ Factions.renforcer(e, f, 1, BAT[c.id].nom.toLowerCase() + " terminé"); Factions.evaluer(e); }
  }
  e.chantiers = e.chantiers.filter(c => c.restant > 0);
}

// totaux du pays à partir des régions
function totaux(regions){
  const t = {};
  for (const r in regions) for (const id in regions[r].batiments) t[id] = (t[id] || 0) + regions[r].batiments[id];
  return t;
}

const Batiments = { coutDefricher, defrichables, defricher, projets, coutProjet, commanderProjet, placeLibre, constructibles, commander, avancer, arrondi, cout, bonus, occupes, totaux, niveaux, facteur, coutAgrandir, agrandissables, agrandir };
if (NODE) module.exports = Batiments; else (racine.Politique = racine.Politique || {}).Batiments = Batiments;
})(typeof window !== "undefined" ? window : globalThis);

/* Politique : bâtiments et chantiers (RULES_V1 § Bâtiments).
   e.batiments : id → nombre en service ; e.chantiers : file [{ id, restant }], seuls les
   ECO.slotsChantier premiers avancent. Payé à la commande (ASSUMPTION validée). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const ECO = NODE ? require("../donnees/economie.js") : racine.Politique.ECONOMIE;
const BAT = NODE ? require("../donnees/batiments.js") : racine.Politique.BATIMENTS;

const constructibles = e => Object.keys(BAT).filter(id => !BAT[id].jalon && e.tresor >= BAT[id].cout);

function commander(e, id){
  e.tresor = arrondi(e.tresor - BAT[id].cout);
  e.chantiers.push({ id, restant: BAT[id].delai });
  e.journal.push(`Chantier commandé : ${BAT[id].nom} (${BAT[id].cout} or).`);
}

// fin du tour : les chantiers des slots avancent d'un tour ; un bâtiment fini produit dès le tour suivant
function avancer(e){
  const finis = [];
  e.chantiers.slice(0, ECO.slotsChantier).forEach(c => { c.restant--; if (c.restant <= 0) finis.push(c); });
  for (const c of finis){
    e.batiments[c.id] = (e.batiments[c.id] || 0) + 1;
    e.journal.push(`Bâtiment terminé : ${BAT[c.id].nom}.`);
  }
  e.chantiers = e.chantiers.filter(c => c.restant > 0);
}

const arrondi = x => Math.round(x * 100) / 100;

const Batiments = { constructibles, commander, avancer, arrondi };
if (NODE) module.exports = Batiments; else (racine.Politique = racine.Politique || {}).Batiments = Batiments;
})(typeof window !== "undefined" ? window : globalThis);

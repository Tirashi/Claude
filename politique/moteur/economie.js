/* Politique : économie d'un tour (RULES_V1 § Ressources et économie).
   production = bâtiments × rendement (× lois × grèves et révoltes des factions) ; consommation = familles × besoins + armée + bâtiments ;
   balance vendue (surplus) ou achetée (déficit) au prix du tour, sans stock ;
   trésor += ventes − achats + impôts − entretiens ; puis la démographie. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const ECO = NODE ? require("../donnees/economie.js") : racine.Politique.ECONOMIE;
const BAT = NODE ? require("../donnees/batiments.js") : racine.Politique.BATIMENTS;
const Lois = NODE ? require("./lois.js") : racine.Politique.Lois;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;

const arrondi = x => Math.round(x * 100) / 100;
const zero = () => Object.fromEntries(ECO.biens.map(b => [b, 0]));

// prix du tour : prix de base × modificateurs en cours (événements ; traités en M3)
function prix(e){
  const p = { ...ECO.prix };
  for (const m of e.modifPrix) if (m.jusqua >= e.tour) for (const b in m.prix) p[b] *= m.prix[b];
  return p;
}

function bilan(e){
  const fx = Lois.effets(e), fa = Factions.effetsEco(e), prod = zero(), conso = zero(), p = prix(e);
  for (const id in e.batiments){
    const n = e.batiments[id], b = BAT[id];
    if (!n) continue;
    const mult = fx.production * (b.artisans ? 1 + fx.artisans : 1) * (fa.batiments[id] == null ? 1 : fa.batiments[id]);
    for (const r in b.produit || {}) prod[r] += n * b.produit[r] * mult;
    for (const r in b.consomme || {}) conso[r] += n * b.consomme[r];
  }
  for (const r in ECO.besoinsParFamille) conso[r] += e.familles * ECO.besoinsParFamille[r];
  for (const r in ECO.besoinsArmee) conso[r] += ECO.besoinsArmee[r];
  let ventes = 0, achats = 0;
  const balance = {};
  for (const r of ECO.biens){
    prod[r] = arrondi(prod[r]); conso[r] = arrondi(conso[r]);
    balance[r] = arrondi(prod[r] - conso[r]);
    if (balance[r] > 0) ventes += balance[r] * p[r]; else achats -= balance[r] * p[r];
  }
  const impots = arrondi(e.familles * ECO.impotParFamille * fx.impots * fa.impots);
  const entretiens = fx.entretien;
  ventes = arrondi(ventes); achats = arrondi(achats);
  return { production: prod, consommation: conso, balance, prix: p, ventes, achats, impots, entretiens,
           solde: arrondi(ventes - achats + impots - entretiens), croissance: ECO.croissance + fx.croissance };
}

// applique le tour : trésor (peut passer sous zéro : ASSUMPTION validée, sans conséquence en V1), puis familles
function appliquer(e){
  const b = bilan(e);
  e.tresor = arrondi(e.tresor + b.solde);
  e.familles = arrondi(Math.min(ECO.plafondFamilles, e.familles * (1 + b.croissance)));
  e.bilan = b;
  return b;
}

const Economie = { prix, bilan, appliquer };
if (NODE) module.exports = Economie; else (racine.Politique = racine.Politique || {}).Economie = Economie;
})(typeof window !== "undefined" ? window : globalThis);

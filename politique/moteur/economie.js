/* Politique : économie d'un tour (RULES_V1 § Ressources et économie).
   production = bâtiments × rendement (× lois × grèves et révoltes des factions) ; consommation = familles × besoins + armée + bâtiments ;
   contrats et livraisons de traités à prix fixe (M3a) ; le reste de la balance vendu (surplus) ou acheté (déficit)
   au prix du tour (tarifs de l'Entente), sans stock ; trésor += ventes − achats + contrats + impôts − entretiens ; puis la démographie. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const ECO = NODE ? require("../donnees/economie.js") : racine.Politique.ECONOMIE;
const BAT = NODE ? require("../donnees/batiments.js") : racine.Politique.BATIMENTS;
const Lois = NODE ? require("./lois.js") : racine.Politique.Lois;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;
const TERRAINS = NODE ? require("../donnees/carte.js") : racine.Politique.TERRAINS;
const GU = NODE ? require("../donnees/guerre.js") : racine.Politique.GUERRE;
const Evenements = NODE ? require("./evenements.js") : racine.Politique.Evenements;

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
  let entretienBat = 0;
  // région par région (bonus de terrain, V2) ; une région occupée ne produit ni ne consomme rien (V2 étape 2)
  for (const reg in e.regions){
    if ((e.occupations || {})[reg]) continue;
    const bonus = TERRAINS[e.regions[reg].terrain].bonus;
    for (const id in e.regions[reg].batiments){
      const n = e.regions[reg].batiments[id], b = BAT[id];
      if (!n) continue;
      const mult = fx.production * (b.artisans ? 1 + fx.artisans : 1) * (fa.batiments[id] == null ? 1 : fa.batiments[id]) * (bonus[id] || 1)
        * ((e.bonusRendement || {})[id] || 1);                                      // Inventeur (événement)
      for (const r in b.produit || {}) prod[r] += n * b.produit[r] * mult * Evenements.multProduction(e, r);   // sécheresse, quarantaine…
      for (const r in b.consomme || {}) conso[r] += n * b.consomme[r];
      if (b.entretien) entretienBat += n * b.entretien;
    }
  }
  entretienBat *= ECO.entretienFacteur;                          // V2 budget : entretien des bâtiments
  entretienBat += (e.regiments || 0) * GU.regiment.entretien;   // V2 : entretien des régiments
  for (const r in ECO.besoinsParFamille) conso[r] += e.familles * ECO.besoinsParFamille[r];
  for (const r in ECO.besoinsArmee) conso[r] += ECO.besoinsArmee[r];
  let ventes = 0, achats = 0, contrats = 0;
  const balance = {}, pv = {}, pa = {}, fl = Diplomatie.flux(e), t = Diplomatie.tarifs(e);
  for (const r of ECO.biens){
    prod[r] = arrondi(prod[r]); conso[r] = arrondi(conso[r]);
    balance[r] = prod[r] - conso[r];
  }
  // contrats et livraisons à prix fixe : ils remplacent le marché pour leur volume
  for (const f of fl){ balance[f.bien] += f.volume; contrats -= f.volume * f.prix; }
  for (const r of ECO.biens){
    balance[r] = arrondi(balance[r]);
    // marché (V2) : le prix baisse avec la quantité vendue, monte avec la quantité achetée, dans le tour
    const q = Math.abs(balance[r]), M = ECO.marche;
    if (balance[r] > 0){ pv[r] = arrondi(p[r] * Math.max(M.min, 1 - M.pente * q)); ventes += q * pv[r] * t.vente; }
    else if (balance[r] < 0){ pa[r] = arrondi(p[r] * Math.min(M.max, 1 + M.pente * q)); achats += q * pa[r] * t.achat; }
  }
  contrats = arrondi(contrats);
  const niveau = ECO.niveauxImpot[e.impots || "normal"];
  const impots = arrondi(e.familles * ECO.impotParFamille * fx.impots * fa.impots * niveau.impots);
  // dette (V2 budget) : intérêts sur ce qui est dû
  const interets = e.tresor < 0 ? arrondi(-e.tresor * ECO.dette.taux) : 0;
  const entretiens = arrondi(fx.entretien + entretienBat + interets);
  ventes = arrondi(ventes); achats = arrondi(achats);
  return { interets, production: prod, consommation: conso, balance, prix: p, prixVente: pv, prixAchat: pa, ventes, achats, contrats, impots, entretiens,
           solde: arrondi(ventes - achats + contrats + impots - entretiens), croissance: ECO.croissance + fx.croissance };
}

// applique le tour : trésor (peut passer sous zéro : ASSUMPTION validée, sans conséquence en V1), puis familles
function appliquer(e){
  const b = bilan(e);
  e.tresor = arrondi(e.tresor + b.solde);
  // (en essai) réserves plafonnées : l'excédent est perdu
  if (ECO.reserves && e.tresor > ECO.reserves * b.impots){
    b.perdu = arrondi(e.tresor - ECO.reserves * b.impots); e.tresor = arrondi(ECO.reserves * b.impots);
    e.journal.push(`Réserves pleines : ${b.perdu} or perdus.`);
  }
  e.familles = arrondi(Math.min(ECO.plafondFamilles, e.familles * (1 + b.croissance)));
  e.bilan = b;
  return b;
}

const Economie = { prix, bilan, appliquer };
if (NODE) module.exports = Economie; else (racine.Politique = racine.Politique || {}).Economie = Economie;
})(typeof window !== "undefined" ? window : globalThis);

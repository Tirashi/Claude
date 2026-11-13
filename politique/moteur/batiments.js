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

const arrondi = x => Math.round(x * 100) / 100;
// part payée par le joueur (bâtiment cofinancé par un traité)
const cout = id => BAT[id].cout * (BAT[id].partJoueur || 1);
const prendPlace = id => BAT[id].emplacement !== false;
// bonus de terrain d'un bâtiment dans une région
const bonus = (e, r, id) => TERRAINS[e.regions[r].terrain].bonus[id] || 1;
// emplacements pris dans une région (bâtiments en service et en chantier)
function occupes(e, r){
  let n = 0;
  for (const id in e.regions[r].batiments) if (prendPlace(id)) n += e.regions[r].batiments[id];
  for (const c of e.chantiers) if (c.region === r && prendPlace(c.id)) n++;
  return n;
}
const enChantier = (e, r) => e.chantiers.some(c => c.region === r);

// ce qui peut se construire, et où : [{ id, region }]
function constructibles(e){
  const r = [];
  for (const id in BAT){
    const b = BAT[id];
    if (b.jalon || (b.traite && !Diplomatie.aTraite(e, b.traite)) || e.tresor < cout(id)) continue;
    for (const reg in e.regions){
      if (enChantier(e, reg) || (e.occupations || {})[reg]) continue;                       // V2 étape 2 : pas de chantier en région occupée
      if (b.unique && (e.regions[reg].batiments[id] || 0) > 0) continue;                    // un fort par région
      if (!prendPlace(id) || occupes(e, reg) < e.regions[reg].emplacements) r.push({ id, region: reg });
    }
  }
  return r;
}

function commander(e, id, region){
  e.tresor = arrondi(e.tresor - cout(id));
  e.chantiers.push({ id, region, restant: BAT[id].delai });
  e.journal.push(`Chantier commandé : ${BAT[id].nom} (${e.regions[region].nom}, ${cout(id)} or).`);
}

// fin du tour : chaque chantier avance d'un tour ; un bâtiment fini produit dès le tour suivant
function avancer(e){
  for (const c of e.chantiers){
    if ((e.occupations || {})[c.region]) continue;   // chantier arrêté pendant l'occupation
    c.restant--;
    if (c.restant > 0) continue;
    const b = e.regions[c.region].batiments;
    b[c.id] = (b[c.id] || 0) + 1;
    e.batiments[c.id] = (e.batiments[c.id] || 0) + 1;
    e.journal.push(`Bâtiment terminé : ${BAT[c.id].nom} (${e.regions[c.region].nom}).`);
  }
  e.chantiers = e.chantiers.filter(c => c.restant > 0);
}

// totaux du pays à partir des régions
function totaux(regions){
  const t = {};
  for (const r in regions) for (const id in regions[r].batiments) t[id] = (t[id] || 0) + regions[r].batiments[id];
  return t;
}

const Batiments = { constructibles, commander, avancer, arrondi, cout, bonus, occupes, totaux };
if (NODE) module.exports = Batiments; else (racine.Politique = racine.Politique || {}).Batiments = Batiments;
})(typeof window !== "undefined" ? window : globalThis);

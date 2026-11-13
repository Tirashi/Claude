/* Politique : lois et capital politique (RULES_V1 § Capital politique, § Lois).
   e.lois : catégorie → { id, depuis } (la loi en vigueur, une seule par catégorie) ;
   e.loisEnCours : [{ id, adoption }] (lancées, en vigueur au tour « adoption »).
   Ces fonctions modifient l'état qu'on leur donne : tour.js leur passe sa copie de travail. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const ECO = NODE ? require("../donnees/economie.js") : racine.Politique.ECONOMIE;
const { LOIS } = NODE ? require("../donnees/lois.js") : racine.Politique.LOIS;

const enVigueur = (e, id) => { const l = e.lois[LOIS[id].categorie]; return !!l && l.id === id; };

// une loi se lance si elle n'est pas en vigueur, qu'aucune loi de sa catégorie n'est en cours
// (ASSUMPTION validée le 13/11 avec M1) et que le capital politique suffit
function lancables(e){
  const occupees = new Set(e.loisEnCours.map(c => LOIS[c.id].categorie));
  return Object.keys(LOIS).filter(id => !enVigueur(e, id) && !occupees.has(LOIS[id].categorie) && e.cp >= LOIS[id].cp);
}

function lancer(e, id){
  e.cp -= LOIS[id].cp;
  e.loisEnCours.push({ id, adoption: e.tour + ECO.delaiLoi });
  e.journal.push(`Loi lancée : ${LOIS[id].nom} (adoption au tour ${e.tour + ECO.delaiLoi}).`);
}

// adopte les lois arrivées à échéance ; une loi remplace celle de sa catégorie
function adopter(e){
  const pretes = e.loisEnCours.filter(c => c.adoption <= e.tour);
  e.loisEnCours = e.loisEnCours.filter(c => c.adoption > e.tour);
  for (const c of pretes){
    const loi = LOIS[c.id], avant = e.lois[loi.categorie];
    e.lois[loi.categorie] = { id: c.id, depuis: e.tour };
    if (loi.eco.reputation) e.reputation += loi.eco.reputation;
    e.journal.push(`Loi adoptée : ${loi.nom}` + (avant ? ` (remplace ${LOIS[avant.id].nom}).` : "."));
  }
}

// part d'un effet « à terme » déjà atteinte : 0 à l'adoption, 1 après ECO.montee tours
const montee = (e, l) => Math.min(1, (e.tour - l.depuis) / ECO.montee);

// effets économiques cumulés des lois en vigueur
function effets(e){
  const r = { impots: 1, entretien: 0, production: 1, croissance: 0, artisans: 0, force: 1 };
  for (const cat in e.lois){
    const l = e.lois[cat], x = LOIS[l.id].eco;
    if (x.impots) r.impots *= x.impots;
    if (x.entretien) r.entretien += x.entretien;
    if (x.production) r.production *= x.production;
    if (x.force) r.force *= x.force;
    if (x.croissance) r.croissance += x.croissance * montee(e, l);
    if (x.artisans) r.artisans += x.artisans * montee(e, l);
  }
  return r;
}

const Lois = { lancables, lancer, adopter, effets, enVigueur, montee };
if (NODE) module.exports = Lois; else (racine.Politique = racine.Politique || {}).Lois = Lois;
})(typeof window !== "undefined" ? window : globalThis);

/* Politique : paquet d'événements (données : donnees/evenements.js).
   e.paquet : cartes restantes (mélangées au hasard à graine) ; e.evenement : { id, cibles, depuis } en attente de réponse ;
   e.modifProd : [{ bien (null = tous), mult, jusqua }] ; e.bonusRendement : { bâtiment: mult }.
   tirer (fin de tour) ; actions / appliquer (réponse du joueur au tour suivant) ; reponseParDefaut (après ses actions). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const { REGLES_EVENEMENTS: R, CARTES } = NODE ? require("../donnees/evenements.js") : racine.Politique.EVENEMENTS;
const PERSONAS = NODE ? require("../donnees/personas.js") : racine.Politique.PERSONAS;
const BAT = NODE ? require("../donnees/batiments.js") : racine.Politique.BATIMENTS;
const Alea = NODE ? require("./alea.js") : racine.Politique.Alea;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;

const arrondi = x => Math.round(x * 100) / 100;
const melanger = (liste, r) => { for (let i = liste.length - 1; i > 0; i--){ const k = Alea.entier(r, i + 1); [liste[i], liste[k]] = [liste[k], liste[i]]; } return liste; };

function conditionOk(e, c){
  if (c.condition === "filons") return Object.values(e.regions).some(x => x.terrain === "filons");
  if (c.condition === "guerreMoral") return !!e.guerre && e.moral < 0.6;
  return true;
}
const plusEnColere = e => Object.keys(e.factions).sort((a, b) => e.factions[b].colere - e.factions[a].colere)[0];

function effet(e, x, cibles){
  if (x.type === "production") e.modifProd.push({ bien: x.bien, mult: x.mult, jusqua: e.tour + x.duree });
  else if (x.type === "familles") e.familles = arrondi(x.mult ? e.familles * x.mult : e.familles + x.plus);
  else if (x.type === "colere" || x.type === "puissance"){
    const fs = x.cible === "toutes" ? Object.keys(e.factions) : [x.cible === "plusEnColere" ? cibles.faction : x.cible];
    for (const f of fs) Factions.modifier(e, f, x.type, x.delta);
  }
  else if (x.type === "or") e.tresor = arrondi(e.tresor + x.delta);
  else if (x.type === "relation"){
    for (const n of x.cible === "toutes" ? Object.keys(e.nations) : [cibles.nation])
      e.nations[n].relation = Math.max(-100, Math.min(100, arrondi(e.nations[n].relation + x.delta)));
  }
  else if (x.type === "emplacement") e.regions[cibles.region].emplacements += x.delta;
  else if (x.type === "rendement") e.bonusRendement[cibles.batiment] = arrondi((e.bonusRendement[cibles.batiment] || 1) * x.mult);
  else if (x.type === "regiments") e.regiments = Math.floor(e.regiments * x.mult);
  else if (x.type === "persona"){
    const libres = Object.keys(PERSONAS).filter(p => !Object.values(e.profils).some(q => q.persona === p));
    e.profils[cibles.nation].persona = libres[cibles.k % libres.length];
  }
}

// fin de tour : peut-être une carte
function tirer(e, r){
  if (e.tour < R.debut || e.evenement || Alea.suivant(r) >= R.chance) return;
  if (!e.paquet || !e.paquet.length) e.paquet = melanger(Object.keys(CARTES), r);
  const i = e.paquet.findIndex(id => conditionOk(e, CARTES[id]));
  if (i < 0) return;
  const id = e.paquet.splice(i, 1)[0], c = CARTES[id];
  const nations = Object.keys(e.nations), filons = Object.keys(e.regions).filter(x => e.regions[x].terrain === "filons");
  const productifs = Object.keys(BAT).filter(b => BAT[b].produit);
  const cibles = { nation: nations[Alea.entier(r, nations.length)], faction: plusEnColere(e), k: Alea.entier(r, 7),
                   region: filons.length ? filons[Alea.entier(r, filons.length)] : null, batiment: productifs[Alea.entier(r, productifs.length)] };
  e.journal.push(`Événement : ${c.nom}. ${c.texte}`);
  for (const x of c.effets || []) effet(e, x, cibles);
  if (c.choix) e.evenement = { id, cibles, depuis: e.tour };
  Factions.evaluer(e);   // la carte a pu changer des colères : statuts et moral à jour
}

// réponses possibles au tour qui suit le tirage (celles qui coûtent de l'or : si le trésor suffit)
function actions(e){
  if (!e.evenement || e.evenement.depuis >= e.tour) return [];
  return CARTES[e.evenement.id].choix.filter(c => !c.cout || e.tresor >= c.cout).map(c => ({ type: "evenement", choix: c.id }));
}
function appliquer(e, choixId){
  const ev = e.evenement, c = CARTES[ev.id].choix.find(x => x.id === choixId);
  if (c.cout) e.tresor = arrondi(e.tresor - c.cout);
  for (const x of c.effets) effet(e, x, ev.cibles);
  e.journal.push(`${CARTES[ev.id].nom} : ${c.texte}`);
  e.evenement = null;
}
// sans réponse du joueur, la première (gratuite) s'applique
function reponseParDefaut(e){
  if (e.evenement && e.evenement.depuis < e.tour) appliquer(e, CARTES[e.evenement.id].choix[0].id);
}

// production : multiplicateur d'un bien ce tour (modificateurs en cours) et bonus de rendement d'un bâtiment
function multProduction(e, bien){
  return (e.modifProd || []).filter(m => m.jusqua >= e.tour && (m.bien === null || m.bien === bien)).reduce((a, m) => a * m.mult, 1);
}

const Evenements = { tirer, actions, appliquer, reponseParDefaut, multProduction };
if (NODE) module.exports = Evenements; else (racine.Politique = racine.Politique || {}).Evenements = Evenements;
})(typeof window !== "undefined" ? window : globalThis);

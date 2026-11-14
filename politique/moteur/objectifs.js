/* Politique : objectifs de victoire (V2, specs/politique/regles-v2.md § 6).
   suivre(e) : à la fin de chaque tour (après les factions), cumule ce qui se mesure sur toute la partie (e.suivi).
   mesures(e) : les cinq valeurs ; medailles(e) : { objectif: 0 à 3 } (0 si révolution ou seuil pas encore fixé).
   Ambition : choisie au tour 1 (action { type: "ambition", id }) ; resultat(e) = { ambition, medaille }.
   Étapes (donnees/objectifs.js ETAPES) : vérifiées à chaque fin de tour, cochées pour de bon (e.suivi.etapes[objectif][i] = tour) ;
   etapes(e, objectif) = [{ id, texte, faite }] pour l'écran. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const O = NODE ? require("../donnees/objectifs.js") : racine.Politique.OBJECTIFS;
const BAT = NODE ? require("../donnees/batiments.js") : racine.Politique.BATIMENTS;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;
const Guerre = NODE ? require("./guerre.js") : racine.Politique.Guerre;
const { LOIS } = NODE ? require("../donnees/lois.js") : racine.Politique.LOIS;

const arrondi = x => Math.round(x * 100) / 100, dixieme = x => Math.round(x * 10) / 10;

function suivre(e){
  const s = e.suivi = e.suivi || { tours: 0, colere: 0, legitimite: 0 };
  const f = Object.values(e.factions);
  s.tours++;
  s.colere = arrondi(s.colere + f.reduce((t, x) => t + x.colere, 0) / f.length);
  s.legitimite = arrondi(s.legitimite + legitimite(e));
  // pour les étapes : grèves, séries de tours calmes, victoires
  const greve = f.some(x => x.statut === "greve" || x.statut === "revolte" || x.statut === "revolution");
  s.greves = (s.greves || 0) + (greve ? 1 : 0);
  s.serieSansGreve = greve ? 0 : (s.serieSansGreve || 0) + 1;
  s.serieSansGrondement = f.some(x => x.colere > O.ETAPES.contentement[1].seuil) ? 0 : (s.serieSansGrondement || 0) + 1;
  if (e.journal.some(l => l === "Paix : l'ennemi capitule." || /^Cession : .* passe à nous/.test(l))) s.victoires = (s.victoires || 0) + 1;
  s.etapes = s.etapes || {};
  for (const id in O.ETAPES){
    const t = s.etapes[id] = s.etapes[id] || O.ETAPES[id].map(() => null);
    O.ETAPES[id].forEach((et, i) => { if (t[i] == null && atteinte(e, et)) t[i] = e.tour; });
  }
}

// une étape est-elle atteinte maintenant ?
function atteinte(e, et){
  const s = e.suivi, f = Object.values(e.factions);
  const place = id => BAT[id] && BAT[id].emplacement !== false;
  switch (et.id){
    case "tresor": return e.tresor >= et.valeur;
    case "batiments": return Object.values(e.batiments).reduce((t, n) => t + n, 0) >= et.valeur;
    case "regions_pleines": return Object.keys(e.regions).every(r => Object.keys(e.regions[r].batiments).filter(place)
      .reduce((t, id) => t + e.regions[r].batiments[id], 0) >= e.regions[r].emplacements);
    case "colere_moyenne": return f.reduce((t, x) => t + x.colere, 0) / f.length < et.valeur;
    case "sans_grondement": return s.serieSansGrondement >= et.valeur;
    case "toutes_calmes": return f.every(x => x.colere < et.valeur);
    case "regiments": return (e.regiments || 0) >= et.valeur;
    case "fort": return (e.batiments.fort || 0) > 0;
    case "victoire": return (s.victoires || 0) > 0;
    case "traite": return (e.traites || []).length > 0;
    case "ami": return Object.values(e.nations).some(n => n.relation >= et.valeur);
    case "relations": return Diplomatie.reputation(e) >= et.valeur;
    case "lois": return Object.keys(e.lois).length >= et.valeur;
    case "soutien": {
      const P = id => e.factions[id] ? e.factions[id].puissance : 0, lois = Object.values(e.lois).map(l => LOIS[l.id]).filter(Boolean);
      return lois.length >= (et.valeur || 1) && lois.every(L => (L.pour || []).reduce((t, x) => t + P(x), 0) > (L.contre || []).reduce((t, x) => t + P(x), 0));
    }
    case "sans_greve": return s.serieSansGreve >= et.valeur;
    case "legitimite": return Object.keys(e.lois).length >= et.lois && legitimite(e) >= et.valeur;
  }
  throw new Error("étape inconnue : " + et.id);
}

// pour l'écran : les étapes d'un objectif (par défaut l'ambition), cochées ou non
function etapes(e, objectif){
  const id = objectif || e.ambition;
  if (!id) return [];
  const t = ((e.suivi || {}).etapes || {})[id] || [];
  return O.ETAPES[id].map((et, i) => ({ id: et.id, texte: et.texte, faite: t[i] != null }));
}

// soutien aux lois en vigueur : pour chaque loi, puissance des factions pour − puissance des factions contre ;
// moyenne par loi (décision du 14/11 : un programme court mais bien soutenu compte autant qu'un long) ; sans loi : 0
function legitimite(e){
  const P = id => e.factions[id] ? e.factions[id].puissance : 0;
  let t = 0, n = 0;
  for (const c in e.lois){
    const L = LOIS[e.lois[c].id];
    if (L){ t += (L.pour || []).reduce((s, f) => s + P(f), 0) - (L.contre || []).reduce((s, f) => s + P(f), 0); n++; }
  }
  return n ? arrondi(t / n) : 0;
}

function mesures(e){
  const s = e.suivi || { tours: 0, colere: 0, legitimite: 0 };
  let valeur = 0;
  for (const id in e.batiments) valeur += (e.batiments[id] || 0) * (BAT[id] ? BAT[id].cout : 0);
  const tenues = Object.keys(e.regions).filter(r => !(e.occupations || {})[r]).length;
  return {
    prosperite: Math.round(e.tresor + valeur),
    contentement: s.tours ? dixieme(100 - s.colere / s.tours) : 100,
    puissance: dixieme(tenues * O.pointsRegion + Guerre.force(e, "joueur")),   // force : régiments × loi militaire × moral
    concorde: Math.round(Diplomatie.reputation(e) + (e.traites || []).length * O.pointsTraite),
    autorite: s.tours ? Math.round(s.legitimite / s.tours) : 0
  };
}

function medailles(e){
  const m = mesures(e), r = {};
  for (const id in O.OBJECTIFS){
    const seuils = O.OBJECTIFS[id].seuils[e.pays || "equilibre"] || [];   // seuils du pays de départ
    r[id] = (e.issue && e.issue.type === "revolution") ? 0 : seuils.filter(x => x != null && m[id] >= x).length;
  }
  return r;
}
const points = e => Object.values(medailles(e)).reduce((t, x) => t + x, 0);

// ambition : se choisit au tour 1 seulement, une fois
const actions = e => e.tour === 1 && !e.ambition && !e.fin ? Object.keys(O.OBJECTIFS).map(id => ({ type: "ambition", id })) : [];
function choisir(e, id){
  e.ambition = id;
  e.journal.push(`Ambition : ${O.OBJECTIFS[id].nom}.`);
}
// victoire : la médaille de l'ambition (0 = aucune ; sans ambition : null)
const resultat = e => ({ ambition: e.ambition || null, medaille: e.ambition ? medailles(e)[e.ambition] : null });

const Objectifs = { suivre, mesures, medailles, points, legitimite, actions, choisir, resultat, etapes, atteinte };
if (NODE) module.exports = Objectifs; else (racine.Politique = racine.Politique || {}).Objectifs = Objectifs;
})(typeof window !== "undefined" ? window : globalThis);

/* Politique : guerre et paix (M3b). Une guerre à la fois, entre le camp du joueur et un camp ennemi.
   e.guerre = { ennemis: [nations], allies: [nations], agresseur, depuis, derniereBataille, bataille (tour), capitulation }
   (capitulation : null, ou "ennemi" quand l'ennemi a capitulé et que le joueur doit choisir les clauses).
   Actions : declarer_guerre { id }, bataille {}, imposer_paix { reparations, lever_embargo, non_rearmement }, paix_blanche {}.
   Après une paix : trêve de G.treve tours avec chaque ancien ennemi (pas de déclaration, Contreforts ne nous attaque pas).
   Fin de tour (tour) : capitulations (moral < 0,3), bataille de l'ennemi s'il est plus fort, déclarations de guerre des nations. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const G = NODE ? require("../donnees/guerre.js") : racine.Politique.GUERRE;
const Alea = NODE ? require("./alea.js") : racine.Politique.Alea;
const Lois = NODE ? require("./lois.js") : racine.Politique.Lois;
const Factions = NODE ? require("./factions.js") : racine.Politique.Factions;
const Diplomatie = NODE ? require("./diplomatie.js") : racine.Politique.Diplomatie;

const arrondi = x => Math.round(x * 100) / 100;
const enTreve = (e, n) => ((e.treves || {})[n] || 0) >= e.tour;

// force d'un membre ("joueur" ou une nation) ; defense : les fortifications du joueur comptent
function force(e, qui, defense){
  if (qui === "joueur"){
    let f = Math.max(0, e.tresor) * Lois.effets(e).force * e.moral;
    if (e.batiments.forge) f *= G.forge;
    if (defense && e.batiments.fortifications) f *= G.fortifications;
    return arrondi(f);
  }
  const n = e.nations[qui];
  return arrondi(Math.max(0, n.tresor) * e.profils[qui].force * n.moral);
}
const forceCamp = (e, membres, defense) => arrondi(membres.reduce((s, m) => s + force(e, m, defense), 0));
const campJoueur = g => ["joueur"].concat(g.allies);
const partenaires = (e, type) => e.traites.filter(t => t.type === type).map(t => t.avec);

// début d'une guerre ; agresseur = "joueur" ou la nation cible qui attaque
function declarer(e, cible, agresseur, r){
  const g = { ennemis: [cible], allies: [], agresseur, depuis: e.tour, derniereBataille: null, bataille: null, capitulation: null };
  const entente = partenaires(e, "entente");
  if (agresseur === "joueur"){
    const membre = entente.includes(cible);
    e.reputation += membre ? G.reputation.attaqueEntente : G.reputation.agression;
    for (const t of e.traites.filter(t => t.avec === cible)) if (e.traites.includes(t)) Diplomatie.rompre(e, t.type, cible);
    // attaquer un membre de l'Entente : sanctions de bloc des autres membres contre le joueur
    if (membre) for (const p of entente.filter(p => p !== cible)) Diplomatie.couper(e, p);
  } else {
    g.allies = partenaires(e, "defense_mutuelle").filter(n => n !== cible);   // défense mutuelle
    // attaquer un membre de l'Entente (le joueur) : les autres membres mettent l'agresseur sous embargo
    for (const p of entente.filter(p => p !== cible)) e.sanctions.push({ par: p, contre: cible });
  }
  e.nations[cible].relation = G.relationGuerre;
  e.guerre = g;
  e.journal.push(agresseur === "joueur" ? `Guerre déclarée à ${e.profils[cible].nom}.` : `${e.profils[cible].nom} nous déclare la guerre !`);
  // les opportunistes rejoignent le camp le plus fort (avec le joueur : relation ≥ 0)
  for (const n in e.nations){
    const pol = G.politiques[e.profils[n].caractere];
    if (!pol.rejoint || g.ennemis.includes(n) || g.allies.includes(n)) continue;
    if (Alea.suivant(r) >= pol.rejoint) continue;
    const fj = forceCamp(e, campJoueur(g), false), fe = forceCamp(e, g.ennemis, false);
    if (fj >= fe && e.nations[n].relation >= 0){ g.allies.push(n); e.journal.push(`${e.profils[n].nom} entre en guerre à nos côtés.`); }
    else if (fe > fj && !enTreve(e, n)){ g.ennemis.push(n); e.nations[n].relation = G.relationGuerre; e.journal.push(`${e.profils[n].nom} entre en guerre contre nous.`); }
  }
}

// une bataille : l'attaquant gagne avec la probabilité Fa / (Fa + Fd)
function bataille(e, joueurAttaque, r){
  const g = e.guerre, att = joueurAttaque ? campJoueur(g) : g.ennemis, def = joueurAttaque ? g.ennemis : campJoueur(g);
  const fa = forceCamp(e, att, false), fd = forceCamp(e, def, true);
  const p = fa + fd > 0 ? fa / (fa + fd) : 0.5;
  const gagne = Alea.suivant(r) < p, perdants = gagne ? def : att;
  for (const m of perdants){
    if (m === "joueur"){
      if (e.tresor > 0) e.tresor = arrondi(e.tresor * (1 - G.defaite.tresor));
      for (const f in e.factions) Factions.modifier(e, f, "colere", G.defaite.colere);
    } else {
      const n = e.nations[m];
      if (n.tresor > 0) n.tresor = arrondi(n.tresor * (1 - G.defaite.tresor));
      n.colere = Math.min(100, n.colere + G.defaite.colere);
      n.moral = Diplomatie.moralNation(n.colere);
    }
  }
  g.bataille = g.derniereBataille = e.tour;
  const nous = joueurAttaque === gagne;
  e.journal.push(`Bataille (${Math.round(fa)} contre ${Math.round(fd)}) : ${nous ? "victoire" : "défaite"} !`);
  return nous;
}

// fin de la guerre ; vainqueur : "joueur", "ennemi" ou null (paix blanche)
function paix(e, vainqueur, clauses){
  const g = e.guerre, chef = g.ennemis[0];
  clauses = clauses || {};
  if (vainqueur){
    const perdant = vainqueur === "joueur" ? chef : "joueur", gagnant = vainqueur === "joueur" ? "joueur" : chef;
    const caisse = q => q === "joueur" ? e : e.nations[q];
    if (clauses.reparations){
      const m = arrondi(Math.min(G.reparations.max, G.reparations.part * Math.max(0, caisse(perdant).tresor)));
      caisse(perdant).tresor = arrondi(caisse(perdant).tresor - m);
      caisse(gagnant).tresor = arrondi(caisse(gagnant).tresor + m);
      e.journal.push(`Réparations : ${m} or.`);
    }
    if (clauses.lever_embargo) e.embargos = e.embargos.filter(n => n !== chef);
    if (clauses.non_rearmement) e.nonRearmement[perdant] = e.tour + G.nonRearmement;
  }
  // les sanctions liées à la guerre sont levées
  const camp = g.ennemis.concat(g.allies, ["joueur"]);
  e.sanctions = e.sanctions.filter(s => !camp.includes(s.contre));
  // trêve : ni le joueur ni ses anciens ennemis ne peuvent se déclarer la guerre pendant G.treve tours
  for (const n of g.ennemis) e.treves[n] = e.tour + G.treve;
  e.guerre = null;
  e.journal.push(vainqueur ? (vainqueur === "joueur" ? "Paix : l'ennemi capitule." : "Paix : nous capitulons.") : "Paix blanche.");
}

const accepteBlanche = e => forceCamp(e, e.guerre.ennemis, false) <= forceCamp(e, campJoueur(e.guerre), false);

function actions(e){
  const g = e.guerre, r = [];
  if (!g){ for (const n in e.nations) if (!enTreve(e, n)) r.push({ type: "declarer_guerre", id: n }); return r; }
  if (g.capitulation === "ennemi"){
    for (const k of [0, 1, 2, 3, 4, 5, 6, 7]) r.push({ type: "imposer_paix", reparations: !!(k & 1), lever_embargo: !!(k & 2), non_rearmement: !!(k & 4) });
    return r;
  }
  if (g.bataille !== e.tour) r.push({ type: "bataille" });
  if (e.tour - (g.derniereBataille == null ? g.depuis : g.derniereBataille) >= G.paixBlanche && accepteBlanche(e)) r.push({ type: "paix_blanche" });
  return r;
}

function appliquer(e, a, r){
  if (a.type === "declarer_guerre") declarer(e, a.id, "joueur", r);
  else if (a.type === "bataille") bataille(e, true, r);
  else if (a.type === "imposer_paix") paix(e, "joueur", a);
  else if (a.type === "paix_blanche") paix(e, null);
}

// fin de tour : usure, bataille de l'ennemi, déclarations des nations
function tour(e, r){
  const g = e.guerre;
  if (g){
    if (g.capitulation) return;
    if (e.nations[g.ennemis[0]].moral < G.capitulation){ g.capitulation = "ennemi"; e.journal.push(`${e.profils[g.ennemis[0]].nom} capitule : à nous de fixer la paix.`); return; }
    if (e.moral < G.capitulation){ paix(e, "ennemi", { reparations: true, lever_embargo: true, non_rearmement: true }); return; }
    const pol = G.politiques[e.profils[g.ennemis[0]].caractere];
    if (pol.bataille && g.bataille !== e.tour && forceCamp(e, g.ennemis, false) > forceCamp(e, campJoueur(g), true)) bataille(e, false, r);
    return;
  }
  for (const n in e.nations){
    const d = G.politiques[e.profils[n].caractere].declare;
    if (!d || enTreve(e, n) || e.nations[n].relation >= d.relationMax) continue;
    const nous = forceCamp(e, ["joueur"].concat(partenaires(e, "defense_mutuelle")), true);
    if (force(e, n, false) > d.ratio * nous && Alea.suivant(r) < d.proba){ declarer(e, n, n, r); return; }
  }
}

const rearmementInterdit = (e, qui) => (e.nonRearmement[qui] || 0) >= e.tour;

const Guerre = { enTreve, force, forceCamp, declarer, bataille, paix, actions, appliquer, tour, rearmementInterdit };
if (NODE) module.exports = Guerre; else (racine.Politique = racine.Politique || {}).Guerre = Guerre;
})(typeof window !== "undefined" ? window : globalThis);

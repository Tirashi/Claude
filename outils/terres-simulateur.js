/* Terres franches : vérification des règles et simulateur d'équilibrage de l'ère 1 (le robot de terres-franches/regles.js joue).
   node outils/terres-simulateur.js                         → contrôles + les deux profils, avec les données d'origine
   node outils/terres-simulateur.js '{"RECRUTER":{"croit":1.3}}'   → mêmes parties avec des réglages modifiés
   Profils : ACTIF (le joueur reste, touche une fois par seconde les 15 premières minutes, décide toutes les 5 s) ;
             SESSIONS (5 min de jeu toutes les heures, le reste hors ligne).
   Affiche quand arrivent le 1er villageois, le hameau, le village, le plafond (20 habitants) et la Charte.
   Lancé par verifications.js : sort en erreur si une règle ou une cible du cahier (§ Équilibrage) ne tient pas. */
"use strict";
const R = require("../terres-franches/regles.js");
const mods = process.argv[2] ? JSON.parse(process.argv[2]) : {};
let erreurs = 0;
const verif = (ok, txt) => { if (!ok){ erreurs++; console.log("ÉCHEC " + txt); } };
const mn = s => s === undefined ? "  —  " : (s / 60).toFixed(1).padStart(5) + " min";

/* ---------- les règles ---------- */
{
  const S = R.creer();
  verif(S.pop === 0 && R.popMax(S) === 2 && R.vivres(S) === 0, "départ : le pionnier seul, le feu loge 2 villageois");
  verif(R.recruter(S) !== null, "sans vivres, personne ne vient");
  verif(R.toucher(S, "pierre") !== null && R.toucher(S, "bois", 5) === null && S.res.bois === 5, "le pionnier récolte bois, baies, poisson (pas la pierre)");
  const c0 = R.coutRecrue(S); R.toucher(S, "baies", c0.vivres); R.toucher(S, "bois", c0.bois - 5);
  verif(R.recruter(S) === null && S.pop === 1 && S.res.baies === 0 && S.res.bois === 0, "un villageois coûte des vivres et du bois");
  const c1 = R.coutRecrue(S); verif(c1.vivres > 10, "le suivant coûte plus cher");
  verif(R.affecter(S, "bucheron", 1) === null && R.affecter(S, "cueilleur", 1) !== null, "un seul villageois : un seul métier");
  verif(R.affecter(S, "carrier", -1) !== null && R.affecter(S, "meunier", 1) !== null, "pas de carrier à retirer, pas de meunier sans moulin");
  S.res.baies = 100; const b0 = S.res.bois; R.pas(S, 10);
  verif(Math.abs(S.res.bois - b0 - 2.2) < 1e-6, "un bûcheron : 0,22 bois par seconde");
  S.res.baies = 0; verif(R.moral(S).famine, "sans réserve de nourriture : famine");
  verif(R.construire(S, "champ") !== null, "le champ demande le hameau");
  S.res.bois = 100; verif(R.construire(S, "cabane") === null && S.chantiers.length === 1, "une cabane se paie et part en chantier");
  verif(R.coutBat(S, "cabane").bois > 14, "la 2e cabane coûte plus cher (chantier compris)");
  S.res.baies = 50; R.pas(S, 20);
  verif(S.bat.cabane === 1 && R.logement(S) === 4 && S.chantiers.length === 0, "la cabane finie loge 2 de plus");
  verif(!R.moral(S).famine, "des baies : plus de famine");
  // surexploitation : le 6e bûcheron rapporte moins que le 1er
  const T = R.creer(); T.pop = 6; T.jobs.bucheron = 5; T.res.baies = 1e3;
  const t5 = R.taux(T).bois; T.jobs.bucheron = 4; const t4 = R.taux(T).bois;
  verif(t5 - t4 < .22 - 1e-6 && t5 - t4 > 0, "au-delà de 4 bûcherons, chacun rapporte moins");
  // statut : population et ressources
  const U = R.creer(); U.pop = 4; U.res.bois = 5000; U.res.baies = 500; U.res.poisson = 500;
  verif(R.monterStatut(U) !== null, "le hameau demande 5 habitants");
  U.pop = 5; verif(R.monterStatut(U) === null && U.statut === 1 && R.popMax(U) === 2, "le hameau se fonde (le logement limite toujours)");
  verif(R.construire(U, "champ") === null, "au hameau, le champ est permis");
  // terrain limité : 2 rochers, 2 carrières au plus
  U.res.bois = 1e4; R.construire(U, "carriere"); R.construire(U, "carriere");
  verif(R.construire(U, "carriere") === "PLUS DE TERRAIN LIBRE", "plus de rocher libre : plus de carrière");
  // chaîne du pain : blé → farine → pain
  const V = R.creer(); V.statut = 1; V.bat.champ = 1; V.bat.moulin = 1; V.bat.four = 1; V.pop = 4; V.res.bois = 100; V.res.baies = 1e3;
  V.jobs.fermier = 2; V.jobs.meunier = 1; V.jobs.boulanger = 1; R.pas(V, 120);
  verif(V.res.pain > 10 && V.res.farine < 5, "la chaîne du pain produit du pain");
  // vêtements : au-delà de 12 habitants, plus de recrutement sans eux
  const W = R.creer(); W.statut = 2; W.bat.maison = 4; W.pop = 12; W.res.baies = 1e4; W.res.bois = 1e4;
  verif(R.recruter(W) === "IL FAUT DES VETEMENTS", "12 habitants : il faut des vêtements");
  W.res.vetements = 5; verif(R.recruter(W) === null, "avec des vêtements, on recrute");
  // hors ligne : plafonné à 8 h
  const X = R.creer({HIVER: {chauffage: 0, faim: 1}, STOCK: {base: {bois: 1e6, baies: 1e6}}}); X.pop = 1; X.jobs.bucheron = 1; X.res.baies = 1e4;   // sans hiver ni limite de stock
  const h = R.horsLigne(X, 20 * 3600);
  verif(h.plafonne && h.duree === 4 * 3600 && Math.abs(h.gains.bois - 4 * 3600 * .22 * .25) <= 1 && X.t === 20 * 3600, "hors ligne : production au quart, 4 h au plus, le temps passe quand même");
  // stockage : la place limite ce qu'on garde ; le grenier double la place à chaque niveau ; on l'agrandit sur place
  const K = R.creer(); K.res.bois = 1e4; K.res.baies = 290; R.pas(K, 1);
  verif(K.res.bois === 300 && R.toucher(K, "bois") !== null && R.capacite(K, "baies") === 100 && K.res.baies === 100, "stock : 300 bois et 100 baies au plus, le toucher refuse quand c'est plein");
  verif(R.construire(K, "grenier") === null && K.chantiers[0].lot === "S", "le grenier se pose sur sa réserve");
  R.pas(K, 40); verif(R.capacite(K, "baies") === 200 && R.capacite(K, "pain") === 120 && R.capacite(K, "bois") === 300, "grenier niveau 1 : la nourriture double, pas le bois");
  K.res.bois = 300; K.res.baies = 200; verif(R.construire(K, "grenier") === null && K.chantiers[0].lot === "S" && K.chantiers[0].agrandit && Object.keys(K.lots).length === 1, "agrandir le grenier : sur place, pas de nouveau terrain");
  // hiver : on se chauffe (le bois baisse), sans bois le moral baisse, personne ne meurt
  const Hv = R.creer(); Hv.pop = 4; Hv.res.baies = 100; Hv.res.bois = 50; Hv.t = 20 * 60 * 2.4; verif(R.hiver(Hv), "l'hiver arrive à la 3e saison");
  R.pas(Hv, 60); verif(Hv.res.bois < 50 && Hv.res.bois > 45 && Hv.pop === 4, "hiver : un peu de bois brûlé, 4 habitants toujours là");
  Hv.res.bois = 0; verif(R.moral(Hv).det.some(d => d.k === "chauffage" && !d.ok) && R.moral(Hv).mult < 1, "hiver sans bois : le moral baisse");
  // ordonnances et équipements : niveaux, coût qui grandit, effets
  const O = R.creer(); O.res.bois = 300; O.res.baies = 100;
  verif(R.peutAcheter(O, "pioche") !== null && R.peutAcheter(O, "accueil") !== null, "ordonnances : certaines attendent le hameau ou le village");
  const co1 = R.coutOrd(O, "outils").bois; verif(R.acheter(O, "outils") === null && O.ord.outils === 1 && R.coutOrd(O, "outils").bois > co1 && O.res.bois === 300 - co1, "outils affûtés niveau 1 : payé, le niveau suivant coûte plus");
  O.pop = 1; O.jobs.bucheron = 1; const tb = R.taux(O).bois; O.ord.outils = 0; verif(tb > R.taux(O).bois * 1.09, "outils : +10 % de bois par bûcheron");
  O.ord.coupes = 1; verif(R.places(O, "bucheron") === 6, "nouvelles coupes : une place de bûcheron de plus");
  O.ord.panier = 2; O.res.baies = 0; R.toucher(O, "baies"); verif(O.res.baies === 3, "panier du pionnier niveau 2 : 3 baies par toucher");
  O.ord.accueil = 1; verif(R.plafondStatut(O) === 7, "droit d'accueil : 2 habitants de plus que le statut");
  // sauvegarde
  const Y = R.charger(R.sauver(X)); verif(Y && Y.res.bois === X.res.bois && Y.jobs.bucheron === 1, "sauvegarde relue à l'identique");
  const Z = R.charger(JSON.stringify({res: {bois: 3}, jobs: {}})); verif(Z && Z.res.pain === 0 && Z.bat.cabane === 0 && Z.statut === 0, "une vieille sauvegarde est complétée");
  verif(R.charger("n'importe quoi") === null, "une sauvegarde abîmée est refusée");
}

/* ---------- les pillards ---------- */
{
  const P = R.reglages(), RA = P.RAIDS;
  const C0 = R.creer(); C0.pop = 4; C0.res.baies = 1e3; R.pas(C0, 3 * 3600); verif(C0.raid.n === 0 && C0.raid.proch === null, "pillards : aucun au campement");
  const fin = S => { if (S.raid.proch === null) R.pas(S, 1); R.pas(S, S.raid.proch - S.t + 1); return S.raids[S.raids.length - 1]; };
  const nv = () => { const S = R.creer(); S.graine = 7; S.statut = 1; S.pop = 8; S.res.bois = 200; S.res.baies = 90; S.res.pierre = 100; return S; };
  const A = nv(); R.pas(A, 1); verif(A.raid.proch >= RA.premier + RA.intervalle[1][0] && A.raid.proch <= RA.premier + RA.intervalle[1][1] + 2, "pillards : la première bande vient après le délai du hameau");
  const b = fin(A); verif(b && !b.repousse && b.vole.bois >= 30 && A.res.bois < 200, "pillards : sans garde, ils volent du stock (" + JSON.stringify(b && b.vole) + ")");
  const Ab = nv(); Ab.bat.aire = 3; Ab.bat.grenier = 3; const b2 = fin(Ab); verif(b2.vole.bois < b.vole.bois, "pillards : agrandir les réserves met du stock à l'abri");
  const G = nv(); G.bat.caserne = 2; G.bat.tour = 1; G.pop = 10; G.jobs.garde = 6; const b3 = fin(G);
  verif(b3.repousse && !Object.keys(b3.vole).length, "pillards : une garde prévenue les repousse");
  const Gb = nv(); Gb.bat.caserne = 1; Gb.jobs.garde = 3; Gb.pop = 8; R.pas(Gb, 1); Gb.raid.proch = Gb.t + 5; Gb.graine = 3; const b4 = fin(Gb);
  verif(b4.gardes === 3 && Gb.blesses.length === b4.blesses && R.gardesValides(Gb) === 3 - b4.blesses, "pillards : des gardes blessés (" + b4.blesses + ") ne se battent plus");
  if (b4.blesses){ R.pas(Gb, RA.garde.guerison + 2); verif(Gb.blesses.length === 0, "pillards : les blessés guérissent"); }
  const Pr = nv(); R.pas(Pr, 1); Pr.raid.proch = Pr.t + 30; Pr.jobs.bucheron = 3; const b0 = Pr.res.bois; R.pas(Pr, 5); verif(Pr.raid.phase === "approche" && Pr.res.bois === b0, "pillards : pendant l'approche, les récolteurs s'abritent");
  const H = nv(); R.pas(H, 1); const r = R.horsLigne(H, 3 * 3600); verif(r.raids.length >= 2 && r.raids.length === H.raid.n, "pillards : ils viennent aussi pendant l'absence (" + r.raids.length + " bandes)");
}
/* ---------- le prestige : les Lois et la nouvelle colonie ---------- */
{
  const D = R.reglages(), ids = Object.keys(D.LOIS);
  verif(ids.every(id => !D.LOIS[id].req || D.LOIS[D.LOIS[id].req]) && ids.length >= 13, "Lois : l'arbre se tient (chaque Loi requise existe)");
  const S = R.creer(); S.loi = true; const L = R.lois(null);
  verif(R.recompense(S, L) === 3 && L.points === 3 && R.recompense(S, L) === 0, "Lois : la Charte rapporte 3 points, une seule fois");
  verif(R.prendreLoi(L, "saisons") && !R.prendreLoi(L, "glanage") && L.points === 2, "Lois : on suit la branche (GLANAGE avant BONNES SAISONS)");
  verif(R.prendreLoi(L, "communs") && !R.prendreLoi(L, "saisons") && L.points === 0 && R.prendreLoi(L, "corvees") === "PAS ASSEZ DE POINTS", "Lois : les points se dépensent");
  const N = R.nouvelleColonie({nom: "Anse", lois: L.prises});
  verif(N.ere === 2 && N.nom === "Anse" && N.pop === 1 && N.t === 0 && !N.loi, "Lois : la nouvelle colonie part du campement avec le premier villageois");
  const N0 = R.nouvelleColonie({}); N0.jobs.bucheron = 1; N.jobs.bucheron = 1;
  verif(Math.abs(R.taux(N).bois / R.taux(N0).bois - 1.2) < .03, "Lois : +20 % de récolte avec GLANAGE et BONNES SAISONS");
  const T = R.nouvelleColonie({lois: ["corvees", "compagnons", "premierToit", "hospices", "fideles", "intendant", "veillee", "conseil", "granges"]});
  verif(T.bat.cabane === 1 && Object.values(T.lots).includes("cabane") && T.pop === 2, "Lois : cabane offerte et villageois emporté");
  verif(R.coutBat(T, "cabane").bois < R.coutBat(R.nouvelleColonie({}), "cabane").bois * 1.5 * .95 && R.coutRecrue(T).bois < R.coutRecrue(N0).bois, "Lois : bâtiments et recrues moins chers");
  const h = R.horsLigneRegle(T); verif(Math.abs(h.rendement - .5) < 1e-9 && h.plafond === 6 * 3600, "Lois : hors ligne à moitié, 6 h au plus");
  verif(Math.abs(R.capacite(T, "bois") / R.capacite(N0, "bois") - 1.25) < 1e-9, "Lois : +25 % de place");
}


/* ---------- la carte : emplacements proposés, déplacement, routes ---------- */
// les deux cartes : la vallée (ère 1) et la côte (ère 2) ; nb = terrains de 3 × 3, maxi = cases de rue au plus (pas de détours)
for (const [ere, nb, maxi, stMax] of [[1, 14, 150, 2], [2, 23, 300, 3]]){
  const C = require("../terres-franches/carte.js").CARTES[ere], L = C.LOTS, nom = C.nom.toLowerCase() + " : ";
  const compte = t => Object.values(L).filter(l => l.terrain === t).length;
  verif(compte("terre") === nb && compte("roche") === 2 && compte("rive") === 2 && C.FEU && C.TENTE && C.ENTREE && C.case_(...C.ENTREE) !== "T", nom + "carte : " + nb + " terrains, 2 rochers, 2 rives, le feu, la tente, l'entrée");
  verif(Object.values(L).every(l => l.terrain !== "terre" || (l.l === 3 && l.h === 3)), nom + "terrains de 3 × 3 cases");
  if (ere > 1) verif(Object.values(L).every(l => l.terrain !== "terre" || [...Array(stMax + 1).keys()].every(st => [[l.x, l.y], [l.x + 2, l.y], [l.x, l.y + 2], [l.x + 2, l.y + 2]].every(([x, y]) => !C.surPlace(x, y, st)))), nom + "la place, à son plus grand, ne mange aucun terrain");
  const S = ere === 1 ? R.creer() : R.nouvelleColonie({}); S.statut = 2; for (const r in S.res) S.res[r] = 1e5;
  const d = id => Math.hypot(L[id].cx - C.FEU[0], L[id].cy - C.FEU[1]);
  R.construire(S, "cabane"); const c1 = S.ordreLots[0];
  verif(Object.values(L).filter(l => l.terrain === "terre").every(l => d(c1) <= d(l.id) + 1e-9), nom + "la 1re cabane va au plus près du feu");
  R.construire(S, "champ"); const ch = S.ordreLots[1];
  verif(L[ch].tags.includes("fertile"), nom + "le champ va sur la bonne terre");
  R.construire(S, "moulin"); const mo = S.ordreLots[2];
  verif(!L[mo].tags.includes("fertile") && Math.hypot(L[mo].cx - L[ch].cx, L[mo].cy - L[ch].cy) < 9, nom + "le moulin se pose près du champ, sans manger la bonne terre");
  R.construire(S, "bergerie"); verif(L[S.ordreLots[3]].tags.includes("pre"), nom + "la bergerie va dans la clairière");
  R.construire(S, "carriere"); verif(L[S.ordreLots[4]].terrain === "roche", nom + "la carrière va sur un rocher");
  verif(R.construire(S, "cabane", "X") === "CE TERRAIN NE CONVIENT PAS" && R.construire(S, "cabane", c1) === "CE TERRAIN EST PRIS", nom + "on ne bâtit pas n'importe où");
  const libre = C.libres(S, "terre")[0];
  verif(R.deplacer(S, c1, libre) === null && S.lots[libre] === "cabane" && !S.lots[c1] && S.chantiers.some(c => c.lot === libre), nom + "déplacer une cabane (même en chantier)");
  // toutes les portes sont reliées à la place par une route, même la carte pleine
  while (!R.construire(S, "cabane") || !R.construire(S, "maison")) ;
  for (const t of ["terre", "roche", "rive", "reserve", "garnison", "guet"]) for (const id of C.libres(S, t)) S.lots[id] = t === "terre" ? "atelier" : t === "roche" ? "carriere" : t === "rive" ? "ponton" : t === "garnison" ? (id === "K" ? "caserne" : "forge") : t === "guet" ? "tour" : id === "R" ? "aire" : "grenier", S.ordreLots.push(id);
  const ro = C.routes(S);
  const bat = Object.keys(L).filter(id => L[id].terrain !== "port").length;   // le port (étape 3) attend son bâtiment
  verif(ro.traces.length === bat, nom + "routes : chaque bâtiment a sa rue (" + ro.traces.length + "/" + bat + ")");
  verif(ro.traces.every(tr => { const p = C.porte(S, tr.id); return tr.cases[0][0] === p[0] && tr.cases[0][1] === p[1]; }), nom + "routes : elles partent des portes");
  const nr = [...ro.cases].length; verif(nr < maxi, nom + "routes : pas de détours (" + nr + " cases)");
}

/* ---------- l'ère 2 : la côte (contenu du 13/11 ; le réglage fin des durées est l'étape 4) ---------- */
{
  const P1 = R.reglages(), P2 = R.reglages(undefined, 2);
  verif(!P1.BATIMENTS.scierie && !P1.RES.planches && P1.STATUTS.length === 3 && P1.LOI.nom === "CHARTE DU VILLAGE", "côte : l'ère 1 ne voit rien de la côte");
  verif(["scierie", "fumoir", "orge", "brasserie", "taverne", "port"].every(b => P2.BATIMENTS[b]) && P2.STATUTS[3].nom === "BOURG" && P2.STATUTS[3].popMax === 45 && P2.LOI.nom === "LOI DES GUILDES", "côte : ses bâtiments, le bourg (45), la Loi des Guildes");
  verif(!P2.LOI.cout.bois && P2.LOI.cout.planches, "côte : le coût de la Loi est le sien (pas celui de la Charte)");
  const S = R.nouvelleColonie({}); S.graine = 12345; S.statut = 3; S.pop = 30; S.bat.taverne = 1; S.res.biere = 50;
  verif(R.moral(S).det.some(d => d.k === "biere" && d.ok), "côte : de la bière à la taverne donne du moral à 25 habitants");
  // une partie du robot sur la côte, sans Lois : elle va jusqu'à la Loi des Guildes
  const G = R.nouvelleColonie({}); G.graine = 12345;
  while (G.t < 12 * 3600 && !G.loi){ const tape = G.t < 900 ? 1 : 0; for (let i = 0; i < 5; i++){ if (tape) R.toucher(G, R.aToucher(G), tape); R.pas(G, 1); } R.robot(G); }
  const j = G.jalons; console.log(`COTE      hameau ${mn(j.hameau)} | village ${mn(j.village)} | bourg ${mn(j.bourg)} | Guildes ${mn(j.loi)} (robot actif, sans Lois)`);
  verif(j.bourg && j.loi && j.loi <= 9 * 3600, "côte : le robot atteint le bourg et la Loi des Guildes (en moins de 9 h)");
}

/* ---------- les parties du robot ---------- */
function partie(profil){
  const S = R.creer(mods), fin = profil === "actif" ? 8 * 3600 : 72 * 3600; S.graine = 12345;   // le même hasard (pillards) à chaque partie
  let plafond;
  while (S.t < fin && !S.loi){
    const present = profil === "actif" || S.t % 3600 < 300;
    if (!present){ R.horsLigne(S, 3600 - S.t % 3600); R.robot(S); continue; }
    const tape = S.t < 900 ? 1 : 0;   // on touche au début, après les villageois font mieux
    for (let i = 0; i < 5; i++){ if (tape) R.toucher(S, R.aToucher(S), tape); R.pas(S, 1); }
    R.robot(S);
    if (plafond === undefined && S.statut === 2 && S.pop >= 20) plafond = S.t;
  }
  return {S, j: S.jalons, plafond};
}
const res = {};
for (const p of ["actif", "sessions"]){
  const {S, j, plafond} = partie(p); res[p] = {j, plafond, S};
  console.log(`${p.toUpperCase().padEnd(9)} 1er villageois ${mn(j.pop1)} | 5 hab. ${mn(j.pop5)} | hameau ${mn(j.hameau)} | 10 hab. ${mn(j.pop10)} | village ${mn(j.village)} | 20 hab. ${mn(plafond)} | Charte ${mn(j.loi)}`);
  console.log(`          ${Object.entries(S.bat).filter(e => e[1]).map(e => e[0] + " " + e[1]).join(", ")} ; métiers ${Object.entries(S.jobs).filter(e => e[1]).map(e => e[0] + " " + e[1]).join(", ")}`);
}
// cibles du cahier : 1er recrutement ~2 min, hameau ~20 min, village ~2 h, ère 1 en 2-3 h ; la Loi 15-30 min après le plafond
if (!process.argv[2]){
  const a = res.actif;
  verif(a.j.pop1 >= 60 && a.j.pop1 <= 240, "ACTIF : 1er villageois entre 1 et 4 min");
  verif(a.j.hameau >= 12 * 60 && a.j.hameau <= 30 * 60, "ACTIF : hameau entre 12 et 30 min");
  verif(a.j.village >= 80 * 60 && a.j.village <= 150 * 60, "ACTIF : village entre 1 h 20 et 2 h 30");
  verif(a.j.loi >= 120 * 60 && a.j.loi <= 200 * 60, "ACTIF : Charte entre 2 h et 3 h 20");
  verif(a.plafond !== undefined && a.j.loi - a.plafond <= 35 * 60, "ACTIF : la Charte moins de 35 min après le plafond");
  const s = res.sessions;
  verif(s.j.loi !== undefined && s.j.loi <= 48 * 3600, "SESSIONS : la Charte en moins de 2 jours");
  // reproductible (pas de hasard)
  verif(JSON.stringify(partie("actif").j) === JSON.stringify(a.j), "parties reproductibles");
}
if (erreurs){ console.log(erreurs + " échec(s)"); process.exit(1); }
console.log("Terres franches : tout est bon.");

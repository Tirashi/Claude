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
  const X = R.creer(); X.pop = 1; X.jobs.bucheron = 1; X.res.baies = 1e4;
  const h = R.horsLigne(X, 20 * 3600);
  verif(h.plafonne && h.duree === 4 * 3600 && Math.abs(h.gains.bois - 4 * 3600 * .22 * .25) <= 1 && X.t === 20 * 3600, "hors ligne : production au quart, 4 h au plus, le temps passe quand même");
  // sauvegarde
  const Y = R.charger(R.sauver(X)); verif(Y && Y.res.bois === X.res.bois && Y.jobs.bucheron === 1, "sauvegarde relue à l'identique");
  const Z = R.charger(JSON.stringify({res: {bois: 3}, jobs: {}})); verif(Z && Z.res.pain === 0 && Z.bat.cabane === 0 && Z.statut === 0, "une vieille sauvegarde est complétée");
  verif(R.charger("n'importe quoi") === null, "une sauvegarde abîmée est refusée");
}

/* ---------- la carte : emplacements proposés, déplacement, routes ---------- */
{
  const C = require("../terres-franches/carte.js"), L = C.LOTS;
  const compte = t => Object.values(L).filter(l => l.terrain === t).length;
  verif(compte("terre") === 14 && compte("roche") === 2 && compte("rive") === 2 && C.FEU && C.TENTE, "carte : 14 terrains, 2 rochers, 2 rives, le feu et la tente");
  verif(Object.values(L).every(l => l.terrain !== "terre" || (l.l === 3 && l.h === 3)), "carte : terrains de 3 × 3 cases");
  const S = R.creer(); S.statut = 2; for (const r in S.res) S.res[r] = 1e5;
  const d = id => Math.hypot(L[id].cx - C.FEU[0], L[id].cy - C.FEU[1]);
  R.construire(S, "cabane"); const c1 = S.ordreLots[0];
  verif(Object.values(L).filter(l => l.terrain === "terre").every(l => d(c1) <= d(l.id) + 1e-9), "la 1re cabane va au plus près du feu");
  R.construire(S, "champ"); const ch = S.ordreLots[1];
  verif(L[ch].tags.includes("fertile"), "le champ va sur la bonne terre");
  R.construire(S, "moulin"); const mo = S.ordreLots[2];
  verif(!L[mo].tags.includes("fertile") && Math.hypot(L[mo].cx - L[ch].cx, L[mo].cy - L[ch].cy) < 9, "le moulin se pose près du champ, sans manger la bonne terre");
  R.construire(S, "bergerie"); verif(L[S.ordreLots[3]].tags.includes("pre"), "la bergerie va dans la clairière");
  R.construire(S, "carriere"); verif(L[S.ordreLots[4]].terrain === "roche", "la carrière va sur un rocher");
  verif(R.construire(S, "cabane", "X") === "CE TERRAIN NE CONVIENT PAS" && R.construire(S, "cabane", c1) === "CE TERRAIN EST PRIS", "on ne bâtit pas n'importe où");
  const libre = C.libres(S, "terre")[0];
  verif(R.deplacer(S, c1, libre) === null && S.lots[libre] === "cabane" && !S.lots[c1] && S.chantiers.some(c => c.lot === libre), "déplacer une cabane (même en chantier)");
  // toutes les portes sont reliées à la place par une route, même la carte pleine
  while (!R.construire(S, "cabane") || !R.construire(S, "maison")) ;
  for (const t of ["terre", "roche", "rive"]) for (const id of C.libres(S, t)) S.lots[id] = t === "terre" ? "atelier" : t === "roche" ? "carriere" : "ponton", S.ordreLots.push(id);
  const ro = C.routes(S);
  verif(ro.traces.length === Object.keys(L).length, "routes : chaque bâtiment a sa rue (" + ro.traces.length + "/" + Object.keys(L).length + ")");
  verif(ro.traces.every(tr => { const p = C.porte(S, tr.id); return tr.cases[0][0] === p[0] && tr.cases[0][1] === p[1]; }), "routes : elles partent des portes");
  const nb = [...ro.cases].length; verif(nb < 150, "routes : pas de détours (" + nb + " cases)");
}

/* ---------- les parties du robot ---------- */
function partie(profil){
  const S = R.creer(mods), fin = profil === "actif" ? 8 * 3600 : 72 * 3600;
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

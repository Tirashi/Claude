/* Terres franches : les règles, sans dessin. Partagées par le jeu et le simulateur (node outils/terres-simulateur.js).
   Données dans donnees.js (window.TerresDonnees) ; un réglage = une copie modifiée (« mods », fusionnée sur les données).
   Une partie : R.creer(mods) → S (objet JSON simple, sauvé tel quel) ; R.pas(S, dt) fait avancer le temps ;
   les ordres (toucher, recruter, affecter, construire, monterStatut, promulguer) renvoient un texte d'erreur ou null ;
   S.evts reçoit les messages à afficher ({txt, bon}) ; R.horsLigne(S, s) rattrape une absence (récap) ;
   R.robot(S) joue un coup (simulateur). Les villageois sont comptés par métier (le jeu leur donne visage et nom). */
(function(){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;
const DON = NODE ? require("./donnees.js") : window.TerresDonnees;
const CARTE = NODE ? require("./carte.js") : window.TerresCarte;   // les terrains : où se pose chaque bâtiment
const VERSION = 1;

/* ---------- réglages ---------- */
const copie = o => JSON.parse(JSON.stringify(o));
function fusion(a, b){
  for (const k in b){
    if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object") fusion(a[k], b[k]);
    else a[k] = copie(b[k]);
  }
  return a;
}
const cache = new Map();
function reglages(mods){
  const cle = JSON.stringify(mods || {});
  if (!cache.has(cle)) cache.set(cle, fusion(copie(DON), mods || {}));
  return cache.get(cle);
}
const D = S => reglages(S.mods);

/* ---------- une partie ---------- */
function creer(mods){
  const P = reglages(mods), S = {v: VERSION, mods: mods || {}, t: 0, res: {}, bat: {}, chantiers: [], pop: 0, jobs: {},
    statut: 0, recrutes: 0, loi: false, touchers: 0, evts: [], jalons: {}, lots: {}, ordreLots: []};
  for (const r in P.RES) S.res[r] = 0;
  for (const b in P.BATIMENTS) S.bat[b] = 0;
  for (const m in P.METIERS) S.jobs[m] = 0;
  return S;
}
const evt = (S, txt, bon) => { S.evts.push({txt, bon: !!bon}); if (S.evts.length > 40) S.evts.shift(); };
const jalon = (S, k) => { if (S.jalons[k] === undefined) S.jalons[k] = S.t; };

/* ---------- comptes ---------- */
const occupes = S => Object.values(S.jobs).reduce((a, b) => a + b, 0);
const libres = S => S.pop - occupes(S);
function places(S, m){
  const pl = D(S).METIERS[m].places; let n = pl.base || 0;
  for (const b in pl) if (b !== "base") n += pl[b] * (S.bat[b] || 0);
  return n;
}
function logement(S){
  const P = D(S); let n = P.CARTE.feu;
  for (const b in P.BATIMENTS) n += (P.BATIMENTS[b].logement || 0) * S.bat[b];
  return n;
}
const popMax = S => Math.min(logement(S), D(S).STATUTS[S.statut].popMax);
const enChantier = (S, b) => S.chantiers.filter(c => c.k === b).length;
function parcellesLibres(S, terrain){
  if (CARTE) return CARTE.libres(S, terrain).length;
  const P = D(S); let n = P.CARTE[terrain] || 0;
  for (const b in P.BATIMENTS) if (P.BATIMENTS[b].terrain === terrain) n -= S.bat[b] + enChantier(S, b);
  return n;
}
function vivres(S){ const P = D(S); let v = 0; for (const r in P.RES) if (P.RES[r].vivres) v += S.res[r] * P.RES[r].vivres; return v; }

/* ---------- coûts ---------- */
function coutBat(S, b){
  const B = D(S).BATIMENTS[b], n = S.bat[b] + enChantier(S, b), c = {};
  for (const r in B.cout) c[r] = Math.ceil(B.cout[r] * Math.pow(B.croit, n));
  return c;
}
function coutRecrue(S){
  const R = D(S).RECRUTER, f = Math.pow(R.croit, S.recrutes);
  return {vivres: Math.ceil(R.vivres * f), bois: Math.ceil(R.bois * f)};
}
// « vivres » se paie avec n'importe quelle nourriture (d'abord la plus abondante)
function peutPayer(S, c){
  for (const r in c){
    if (r === "vivres"){ if (vivres(S) < c[r] - 1e-9) return false; }
    else if (S.res[r] < c[r] - 1e-9) return false;
  }
  return true;
}
function payerVivres(S, v){
  const P = D(S), nourr = Object.keys(P.RES).filter(r => P.RES[r].vivres);
  while (v > 1e-9){
    const r = nourr.filter(x => S.res[x] > 1e-9).sort((a, b) => S.res[b] * P.RES[b].vivres - S.res[a] * P.RES[a].vivres)[0];
    if (!r) break;
    const pris = Math.min(S.res[r], v / P.RES[r].vivres);
    S.res[r] -= pris; v -= pris * P.RES[r].vivres;
  }
}
function payer(S, c){ for (const r in c){ if (r === "vivres") payerVivres(S, c[r]); else S.res[r] -= c[r]; } }

/* ---------- moral ---------- */
function moral(S){
  const P = D(S), B = P.BESOINS, det = []; let m = 1;
  const nourr = Object.keys(P.RES).filter(r => P.RES[r].vivres && S.res[r] >= 1).length;
  if (S.pop >= B.variete.pop){
    const ok = nourr >= B.variete.types; m += ok ? B.variete.bonus : B.variete.malus;
    det.push({k: "variete", ok});
  }
  if (S.pop >= B.vetements.pop){ const ok = S.res.vetements >= .5; if (ok) m += B.vetements.bonus; det.push({k: "vetements", ok}); }
  if (S.pop >= B.pain.pop){ const ok = S.res.pain >= 1; if (ok) m += B.pain.bonus; det.push({k: "pain", ok}); }
  const famine = S.pop > 0 && vivres(S) < 1e-6;
  if (famine){ m *= B.famine; det.push({k: "famine", ok: false}); }
  return {mult: m, det, famine};
}

/* ---------- production ---------- */
// débit total d'un métier brut (surexploitation au-delà du seuil)
function debitBrut(M, n){
  let d = 0;
  for (let i = 0; i < n; i++) d += M.debit * (i < M.seuil ? 1 : Math.pow(M.use, i - M.seuil + 1));
  return d;
}
// débits nets par seconde (estimation à l'équilibre : sert au robot et au panneau « +x/min »)
function taux(S, jobs){
  const P = D(S), J = jobs || S.jobs, mult = moral(S).mult, t = {};
  for (const r in P.RES) t[r] = 0;
  for (const m in P.METIERS){ const M = P.METIERS[m]; if (M.produit) t[M.produit] += debitBrut(M, J[m]) * mult; }
  // transformations dans l'ordre des données (le blé avant la farine)
  for (const m in P.METIERS){
    const M = P.METIERS[m]; if (!M.entree || !J[m]) continue;
    let out = M.debit * J[m] * mult;
    for (const r in M.entree) if (S.res[r] < 1) out = Math.min(out, Math.max(0, t[r]) / M.entree[r]);
    for (const r in M.entree) t[r] -= out * M.entree[r];
    t[M.sortie] += out;
  }
  const v = S.pop * P.BESOINS.conso;
  t.vivres = Object.keys(P.RES).reduce((a, r) => a + (P.RES[r].vivres ? t[r] * P.RES[r].vivres : 0), 0) - v;
  if (S.pop >= P.BESOINS.vetements.pop) t.vetements -= S.pop * P.BESOINS.vetements.conso;
  return t;
}

// eff : part de la production pendant ce temps (1 en jeu, HORS_LIGNE.rendement quand l'appli est fermée) ; les chantiers avancent toujours
function pas(S, dt, eff){
  while (dt > 1e-9){ const h = Math.min(dt, 1); pas1(S, h, eff === undefined ? 1 : eff); dt -= h; }
}
function pas1(S, dt, eff){
  const P = D(S), mult = moral(S).mult * eff;
  S.t += dt;
  // chantiers
  for (const c of S.chantiers) c.reste -= dt;
  for (const c of S.chantiers.filter(c => c.reste <= 0)){
    S.bat[c.k]++; evt(S, P.BATIMENTS[c.k].nom + " TERMINE", true); jalon(S, c.k + S.bat[c.k]);
  }
  S.chantiers = S.chantiers.filter(c => c.reste > 0);
  // production brute
  for (const m in P.METIERS){ const M = P.METIERS[m]; if (M.produit && S.jobs[m]) S.res[M.produit] += debitBrut(M, S.jobs[m]) * mult * dt; }
  // transformations (limitées par ce qu'il y a en réserve)
  for (const m in P.METIERS){
    const M = P.METIERS[m]; if (!M.entree || !S.jobs[m]) continue;
    let out = M.debit * S.jobs[m] * mult * dt;
    for (const r in M.entree) out = Math.min(out, S.res[r] / M.entree[r]);
    if (out <= 0) continue;
    for (const r in M.entree) S.res[r] -= out * M.entree[r];
    S.res[M.sortie] += out;
  }
  // on mange, on s'habille
  if (S.pop){
    const besoin = S.pop * P.BESOINS.conso * dt * eff;
    payerVivres(S, Math.min(besoin, vivres(S)));
    if (S.pop >= P.BESOINS.vetements.pop) S.res.vetements = Math.max(0, S.res.vetements - S.pop * P.BESOINS.vetements.conso * dt * eff);
  }
  for (const r in S.res) if (S.res[r] < 1e-9) S.res[r] = 0;
}

/* ---------- ordres du joueur ---------- */
function toucher(S, r, n){
  const P = D(S); if (!P.PIONNIER.ressources.includes(r)) return "RIEN A RECOLTER";
  S.res[r] += P.PIONNIER.toucher * (n || 1); S.touchers += n || 1; return null;
}
function recruter(S){
  const P = D(S);
  if (S.pop >= D(S).STATUTS[S.statut].popMax) return S.statut + 1 < P.STATUTS.length ? "IL FAUT UN STATUT PLUS GRAND" : "PLAFOND DE L'ERE : PROMULGUER LA LOI";
  if (S.pop >= logement(S)) return "PLUS DE PLACE : CONSTRUIRE UN LOGIS";
  if (S.pop >= P.BESOINS.vetements.pop && P.BESOINS.vetements.bloque && S.res.vetements < .5) return "IL FAUT DES VETEMENTS";
  if (moral(S).famine) return "LA COLONIE A FAIM";
  const c = coutRecrue(S); if (!peutPayer(S, c)) return "PAS ASSEZ DE VIVRES OU DE BOIS";
  payer(S, c); S.pop++; S.recrutes++;
  evt(S, "UN VILLAGEOIS ARRIVE", true); jalon(S, "pop" + S.pop);
  return null;
}
function affecter(S, m, d){
  const P = D(S); if (!P.METIERS[m]) return "METIER INCONNU";
  if (d > 0){
    if (libres(S) < 1) return "PERSONNE DE LIBRE";
    if (S.jobs[m] >= places(S, m)) return "PLUS DE PLACE A CE POSTE";
    S.jobs[m]++;
  } else { if (S.jobs[m] < 1) return "PERSONNE A CE POSTE"; S.jobs[m]--; }
  return null;
}
function peutConstruire(S, b){
  const P = D(S), B = P.BATIMENTS[b]; if (!B) return "BATIMENT INCONNU";
  if (B.statut > S.statut) return "IL FAUT LE STATUT " + P.STATUTS[B.statut].nom;
  if (parcellesLibres(S, B.terrain) < 1) return "PLUS DE TERRAIN LIBRE";
  if (!peutPayer(S, coutBat(S, b))) return "PAS ASSEZ DE RESSOURCES";
  return null;
}
// lot = le terrain choisi par le joueur (sinon celui que propose la carte)
function construire(S, b, lot){
  const e = peutConstruire(S, b); if (e) return e;
  if (CARTE){
    lot = lot || CARTE.proposer(S, b);
    const L = CARTE.LOTS[lot];
    if (!L || L.terrain !== D(S).BATIMENTS[b].terrain) return "CE TERRAIN NE CONVIENT PAS";
    if (S.lots[lot]) return "CE TERRAIN EST PRIS";
    S.lots[lot] = b; S.ordreLots.push(lot);
  }
  payer(S, coutBat(S, b)); S.chantiers.push({k: b, reste: D(S).BATIMENTS[b].travail, lot: lot || null});
  return null;
}
// déplacer un bâtiment (ou son chantier) sur un autre terrain libre du même genre : gratuit
function deplacer(S, de, vers){
  if (!CARTE) return "PAS DE CARTE";
  const b = S.lots[de], L = CARTE.LOTS[vers];
  if (!b) return "RIEN A DEPLACER";
  if (!L || L.terrain !== CARTE.LOTS[de].terrain) return "CE TERRAIN NE CONVIENT PAS";
  if (S.lots[vers]) return "CE TERRAIN EST PRIS";
  delete S.lots[de]; S.lots[vers] = b; S.ordreLots[S.ordreLots.indexOf(de)] = vers;
  for (const c of S.chantiers) if (c.lot === de) c.lot = vers;
  return null;
}
function peutMonter(S){
  const P = D(S), st = P.STATUTS[S.statut + 1];
  if (!st) return "STATUT MAXIMAL DE L'ERE";
  if (S.pop < st.pop) return "IL FAUT " + st.pop + " HABITANTS";
  if (!peutPayer(S, st.cout)) return "PAS ASSEZ DE RESSOURCES";
  return null;
}
function monterStatut(S){
  const e = peutMonter(S); if (e) return e;
  const st = D(S).STATUTS[S.statut + 1]; payer(S, st.cout); S.statut++;
  evt(S, "LA COLONIE DEVIENT " + st.nom, true); jalon(S, st.nom.toLowerCase());
  return null;
}
function peutPromulguer(S){
  const L = D(S).LOI;
  if (S.loi) return "DEJA PROMULGUEE";
  if (S.statut < D(S).STATUTS.length - 1) return "IL FAUT LE STATUT " + D(S).STATUTS[D(S).STATUTS.length - 1].nom;
  if (S.pop < L.pop) return "IL FAUT " + L.pop + " HABITANTS";
  if (!peutPayer(S, L.cout)) return "PAS ASSEZ DE RESSOURCES";
  return null;
}
function promulguer(S){
  const e = peutPromulguer(S); if (e) return e;
  payer(S, D(S).LOI.cout); S.loi = true; evt(S, D(S).LOI.nom + " PROMULGUEE", true); jalon(S, "loi");
  return null;
}

/* ---------- hors ligne, sauvegarde ---------- */
function horsLigne(S, secondes){
  const H = D(S).HORS_LIGNE, s = Math.max(0, Math.min(secondes, H.plafond)), avant = copie(S.res);
  pas(S, s, H.rendement);
  if (secondes > s) pas(S, secondes - s, 0);   // au-delà du plafond : le temps passe (chantiers), plus rien ne se produit
  const gains = {}; for (const r in S.res){ const g = S.res[r] - avant[r]; if (Math.abs(g) >= .5) gains[r] = Math.round(g); }
  return {duree: s, absence: Math.max(0, secondes), plafonne: secondes > H.plafond, rendement: H.rendement, gains};
}
const sauver = S => JSON.stringify(S);
function charger(txt){
  let S; try { S = JSON.parse(txt); } catch (e){ return null; }
  if (!S || typeof S !== "object" || !S.res || !S.jobs) return null;
  const neuf = creer(S.mods);
  for (const k in neuf) if (S[k] === undefined) S[k] = neuf[k];
  for (const r in neuf.res) if (typeof S.res[r] !== "number") S.res[r] = 0;
  for (const b in neuf.bat) if (typeof S.bat[b] !== "number") S.bat[b] = 0;
  for (const m in neuf.jobs) if (typeof S.jobs[m] !== "number") S.jobs[m] = 0;
  if (!S.lots || typeof S.lots !== "object") S.lots = {};
  if (!Array.isArray(S.ordreLots)) S.ordreLots = Object.keys(S.lots);
  S.v = VERSION;
  return S;
}

/* ---------- le robot (simulateur) ---------- */
// plan de construction : le robot pose dans cet ordre ce qui est permis, quand il en a les moyens
const PLAN = ["cabane", "cabane", "champ", "carriere", "cabane", "moulin", "four", "cabane", "ponton", "cabane",
  "maison", "bergerie", "atelier", "maison", "maison", "champ", "carriere", "ponton", "maison", "maison", "maison"];
function prochainBat(S){
  const P = D(S), vus = {};
  for (const b of PLAN){
    vus[b] = (vus[b] || 0) + 1;
    if (S.bat[b] + enChantier(S, b) >= vus[b]) continue;
    if (P.BATIMENTS[b].statut > S.statut) continue;
    // un logis quand on manque de place, pas avant
    if (P.BATIMENTS[b].logement && logement(S) + enChantierLogement(S) > S.pop + 1 && S.pop < P.STATUTS[S.statut].popMax - 1) continue;
    if (parcellesLibres(S, P.BATIMENTS[b].terrain) < 1) continue;
    return b;
  }
  return null;
}
function enChantierLogement(S){ const P = D(S); return S.chantiers.reduce((a, c) => a + (P.BATIMENTS[c.k].logement || 0), 0); }
// ce qui manque pour le prochain achat (sert à choisir quoi toucher et où mettre les villageois)
function objectif(S){
  const P = D(S);
  if (S.statut === P.STATUTS.length - 1 && S.pop >= P.LOI.pop) return P.LOI.cout;
  const st = P.STATUTS[S.statut + 1];
  if (st && S.pop >= st.pop) return st.cout;
  const b = prochainBat(S), c = {};
  if (b) Object.assign(c, coutBat(S, b));
  if (S.pop < popMax(S)){ const r = coutRecrue(S); c.vivres = (c.vivres || 0) + r.vivres; c.bois = (c.bois || 0) + r.bois; }
  return c;
}
function manque(S, c){
  const m = {};
  for (const r in c){ const a = r === "vivres" ? vivres(S) : S.res[r]; if (a < c[r]) m[r] = c[r] - a; }
  return m;
}
// répartit tous les villageois : chaînes d'abord, puis de quoi manger, puis les matériaux qui manquent
function repartir(S){
  const P = D(S), J = {}; for (const m in P.METIERS) J[m] = 0;
  let reste = S.pop;
  const mettre = (m, n) => { const k = Math.max(0, Math.min(n, reste, places(S, m) - J[m])); J[m] += k; reste -= k; return k; };
  // pain : fermiers pour nourrir le moulin, meunier, boulanger
  if (S.bat.moulin && S.bat.four && S.pop >= 6){ mettre("fermier", 3); mettre("meunier", 1); mettre("boulanger", 1); }
  // vêtements quand le besoin compte bientôt
  if (S.bat.atelier && S.pop >= P.BESOINS.vetements.pop - 2){ mettre("berger", 2); mettre("tisserand", 1); }
  // de quoi manger, avec une marge
  const nourr = ["pecheur", "cueilleur"];
  let garde = 0;
  while (reste > 0 && garde++ < 40){
    const t = taux(S, J), cible = S.pop * P.BESOINS.conso * .35 + (manque(S, objectif(S)).vivres ? .25 : 0);
    if (t.vivres >= cible) break;
    const m = nourr.filter(x => J[x] < places(S, x)).sort((a, b) => J[a] - J[b])[0];
    if (!m){ if (!mettre("fermier", 1)) break; continue; }
    mettre(m, 1);
  }
  // matériaux : selon ce qui manque (le bois, la pierre, puis le reste de la chaîne)
  garde = 0;
  while (reste > 0 && garde++ < 40){
    const mq = manque(S, objectif(S)), t = taux(S, J);
    const cands = Object.keys(P.METIERS).filter(m => J[m] < places(S, m));
    if (!cands.length) break;
    let best = null, bs = -1;
    for (const m of cands){
      const M = P.METIERS[m], r = M.produit || M.sortie;
      let s = (mq[r] || 0) / Math.max(.05, t[r] + .05) + (r === "bois" ? .5 : 0) + (r === "pierre" && S.statut >= 1 ? .4 : 0);
      if (M.entree && Object.keys(M.entree).some(x => S.res[x] < 1 && t[x] <= 0)) s = 0;
      if (s > bs){ bs = s; best = m; }
    }
    mettre(best, 1);
  }
  S.jobs = J;
}
// un coup du robot : tout ce qu'il peut faire maintenant
function robot(S){
  const P = D(S);
  if (!peutPromulguer(S)) promulguer(S);
  if (!peutMonter(S)) monterStatut(S);
  const st = P.STATUTS[S.statut + 1], attend = st && S.pop >= st.pop;  // il économise pour le statut
  if (!attend){
    const b = prochainBat(S); if (b && !peutConstruire(S, b)) construire(S, b);
    let n = 0; while (n++ < 3 && !recruter(S));
  }
  repartir(S);
}
// ce que le pionnier touche : ce qui manque le plus pour le prochain achat
function aToucher(S){
  const mq = manque(S, objectif(S));
  if (mq.vivres || mq.baies || mq.poisson) return S.res.baies <= S.res.poisson ? "baies" : "poisson";
  return "bois";
}

const api = {VERSION, reglages, creer, pas, taux, moral, places, logement, popMax, libres, parcellesLibres, vivres,
  coutBat, coutRecrue, peutPayer, toucher, recruter, affecter, peutConstruire, construire, deplacer, peutMonter, monterStatut,
  peutPromulguer, promulguer, horsLigne, sauver, charger, robot, aToucher, objectif, PLAN};
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.TerresRegles = api;
})();

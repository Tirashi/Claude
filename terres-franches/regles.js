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
    if (k !== "cout" && b[k] && typeof b[k] === "object" && !Array.isArray(b[k]) && a[k] && typeof a[k] === "object") fusion(a[k], b[k]);   // un coût se remplace en entier
    else a[k] = copie(b[k]);
  }
  return a;
}
const cache = new Map();
// les données d'une partie : celles de l'ère 1, puis ce que change son ère (ERE2 pour la côte), puis les réglages du simulateur
function reglages(mods, ere){
  const cle = (ere || 1) + JSON.stringify(mods || {});
  if (!cache.has(cle)){ const P = copie(DON); if ((ere || 1) >= 2) fusion(P, DON.ERE2); cache.set(cle, fusion(P, mods || {})); }
  return cache.get(cle);
}
const D = S => reglages(S.mods, S.ere);

/* ---------- une partie ---------- */
function creer(mods, ere){
  const P = reglages(mods, ere), S = {v: VERSION, mods: mods || {}, t: 0, res: {}, bat: {}, chantiers: [], pop: 0, jobs: {},
    statut: 0, recrutes: 0, loi: false, ord: {}, touchers: 0, evts: [], jalons: {}, lots: {}, ordreLots: [],
    graine: Math.floor(Math.random() * 1e9), raid: {n: 0, proch: null, phase: null}, raids: [], blesses: [],
    ere: ere || 1, nom: "", lois: [], recompense: false};
  for (const r in P.RES) S.res[r] = 0;
  for (const b in P.BATIMENTS) S.bat[b] = 0;
  for (const m in P.METIERS) S.jobs[m] = 0;
  return S;
}
const evt = (S, txt, bon) => { S.evts.push({txt, bon: !!bon}); if (S.evts.length > 40) S.evts.shift(); };
const jalon = (S, k) => { if (S.jalons[k] === undefined) S.jalons[k] = S.t; };

/* ---------- ordonnances et équipements ---------- */
// effet cumulé d'une clé (somme sur les ordonnances achetées : effet × niveau)
// les Lois prises avant de fonder la colonie (S.lois) s'ajoutent de la même façon
function eff(S, k){ const P = D(S), O = P.ORDONNANCES || {}, n = S.ord || {}; let v = 0; for (const id in n) if (O[id] && O[id].effet[k]) v += O[id].effet[k] * n[id];
  for (const id of S.lois || []){ const L = P.LOIS[id]; if (L && L.effet[k]) v += L.effet[k]; } return v; }
const RECOLTEURS = ["bucheron", "cueilleur", "pecheur", "carrier", "fermier", "berger"];
// multiplicateur de débit d'un métier (outils, hottes, chemins)
const bonusMetier = (S, m) => 1 + (RECOLTEURS.includes(m) ? eff(S, "recolte") + eff(S, "porte") : 0) + eff(S, "route_prod") + eff(S, "m_" + m);
function coutOrd(S, id){ const O = D(S).ORDONNANCES[id], n = (S.ord || {})[id] || 0, c = {}; for (const r in O.cout) c[r] = Math.ceil(O.cout[r] * Math.pow(O.croit, n)); return c; }
function peutAcheter(S, id){
  const P = D(S), O = P.ORDONNANCES[id]; if (!O) return "INCONNU";
  if (O.statut > S.statut) return "IL FAUT LE " + P.STATUTS[O.statut].nom;
  if (((S.ord || {})[id] || 0) >= O.niveaux) return "NIVEAU MAXIMAL";
  if (!peutPayer(S, coutOrd(S, id))) return "PAS ASSEZ DE RESSOURCES";
  return null;
}
function acheter(S, id){
  const e = peutAcheter(S, id); if (e) return e;
  payer(S, coutOrd(S, id)); S.ord = S.ord || {}; S.ord[id] = (S.ord[id] || 0) + 1;
  evt(S, D(S).ORDONNANCES[id].nom + (D(S).ORDONNANCES[id].niveaux > 1 ? " NIV. " + S.ord[id] : ""), true); return null;
}

/* ---------- comptes ---------- */
const occupes = S => Object.values(S.jobs).reduce((a, b) => a + b, 0);
const libres = S => S.pop - occupes(S);
function places(S, m){
  const pl = D(S).METIERS[m].places; let n = pl.base ? pl.base + eff(S, "places") : 0;
  for (const b in pl) if (b !== "base") n += pl[b] * (S.bat[b] || 0);
  return n;
}
function logement(S){
  const P = D(S); let n = P.CARTE.feu;
  for (const b in P.BATIMENTS) n += (P.BATIMENTS[b].logement || 0) * S.bat[b];
  return n;
}
const plafondStatut = S => D(S).STATUTS[S.statut].popMax + eff(S, "pop");
const popMax = S => Math.min(logement(S), plafondStatut(S));
const enChantier = (S, b) => S.chantiers.filter(c => c.k === b).length;
function parcellesLibres(S, terrain){
  if (CARTE) return CARTE.de(S).libres(S, terrain).length;
  const P = D(S); let n = P.CARTE[terrain] || 0;
  for (const b in P.BATIMENTS) if (P.BATIMENTS[b].terrain === terrain) n -= S.bat[b] + enChantier(S, b);
  return n;
}
/* ---------- stockage et saisons ---------- */
// le bâtiment qui garde la ressource r (grenier ou aire), et la place : base × 2^niveau (niveau = nombre construit)
function gardien(S, r){ const P = D(S); for (const b in P.BATIMENTS){ const g = P.BATIMENTS[b].stock; if (g && P.STOCK.groupes[g].includes(r)) return b; } return null; }
function capacite(S, r){ const P = D(S), base = P.STOCK.base[r]; if (base === undefined) return Infinity; const b = gardien(S, r); return base * Math.pow(2, b ? S.bat[b] : 0) * (1 + eff(S, "stock")); }
function borner(S){ for (const r in S.res){ const c = capacite(S, r); if (S.res[r] > c) S.res[r] = c; } }
const plein = (S, r) => S.res[r] >= capacite(S, r) - 1e-9;
// saisons : 0 printemps … 3 hiver (comme vie.js, qui dessine)
function saison(S){ const H = D(S).HIVER; return Math.floor((S.t + H.saison * H.decalage) / H.saison) % 4; }
const hiver = S => saison(S) === 3;
const chauffage = S => D(S).HIVER.chauffage * Math.max(0, 1 - eff(S, "chauffage"));
const faimHiver = S => 1 + (D(S).HIVER.faim - 1) * Math.max(0, 1 - eff(S, "faim"));
function vivres(S){ const P = D(S); let v = 0; for (const r in P.RES) if (P.RES[r].vivres) v += S.res[r] * P.RES[r].vivres; return v; }

/* ---------- coûts ---------- */
function coutBat(S, b){
  const B = D(S).BATIMENTS[b], n = S.bat[b] + enChantier(S, b), c = {};
  for (const r in B.cout) c[r] = Math.ceil(B.cout[r] * Math.pow(B.croit, n) * (1 - eff(S, "batiment")));
  return c;
}
function coutRecrue(S){
  const R = D(S).RECRUTER, f = Math.pow(R.croit, S.recrutes) * (1 - eff(S, "recrue"));
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
  if (B.biere && S.pop >= B.biere.pop){ const ok = S.res.biere >= .5 && (S.bat[B.biere.lieu] || 0) > 0; if (ok) m += B.biere.bonus; det.push({k: "biere", ok}); }   // la côte : la bière, servie à la taverne
  if (hiver(S) && S.pop){ const ok = S.res.bois >= 1; if (!ok) m += P.HIVER.froid; det.push({k: "chauffage", ok}); }
  if (eff(S, "moral")){ m += eff(S, "moral"); det.push({k: "fetes", ok: true}); }
  const famine = S.pop > 0 && vivres(S) < 1e-6;
  if (famine){ m *= B.famine; det.push({k: "famine", ok: false}); }
  return {mult: m, det, famine};
}

/* ---------- les pillards (RAIDS de donnees.js) ---------- */
// hasard reproductible : le n-ième tirage de la partie (le simulateur rejoue la même suite)
function hasard(S, k){ let a = (S.graine + S.raid.n * 7919 + k * 104729) >>> 0; a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
// part du stock d'une ressource à l'abri (niveau de sa réserve + serrures)
function abri(S, r){ const P = D(S), g = gardien(S, r); return Math.min(P.RAIDS.abriMax, (g ? S.bat[g] : 0) * P.RAIDS.abri + eff(S, "abri")); }
// gardes en état de se battre (les blessés se soignent) ; armés = autant que d'armes en réserve
const blesses = S => Math.min(S.jobs.garde || 0, (S.blesses || []).length);
const gardesValides = S => Math.max(0, (S.jobs.garde || 0) - blesses(S));
const gardesArmes = S => Math.min(gardesValides(S), Math.floor(S.res.armes || 0));
const prevenus = S => S.bat.tour > 0;
const annonce = S => D(S).RAIDS.approche + (prevenus(S) ? D(S).RAIDS.annonce + eff(S, "guet") : 0);
function forceBande(S){
  const F = D(S).RAIDS.force, a = 1 + F.alea * (2 * hasard(S, 1) - 1);
  return Math.round((F.base + F.parHab * S.pop) * (F.statut[S.statut] || 0) * a * Math.max(.2, 1 - eff(S, "palissade")) * 10) / 10;
}
function defense(S){
  const G = D(S).RAIDS.garde, v = gardesValides(S), ar = gardesArmes(S);
  return (v + ar * (G.arme - 1)) * G.force * (1 + eff(S, "garde")) * (prevenus(S) ? G.prevenu : 1);
}
// la prochaine bande (aucune au campement)
function planifier(S, premier){
  const P = D(S).RAIDS, iv = P.intervalle[S.statut];
  if (!iv){ S.raid.proch = null; return; }
  S.raid.proch = S.t + (premier ? P.premier : 0) + iv[0] + (iv[1] - iv[0]) * hasard(S, 2);
}
// une bande arrive aux réserves : combat, vol, blessés
function combattre(S){
  const P = D(S), R = P.RAIDS, f = S.raid.force || forceBande(S), d = defense(S), engages = gardesValides(S);
  const repousse = d >= f, part = repousse ? 0 : R.vol * (1 - d / f), vole = {};
  if (part > 0) for (const r in S.res){
    const n = Math.floor(S.res[r] * (1 - abri(S, r)) * part); if (n >= 1){ S.res[r] -= n; vole[r] = n; }
  }
  // blessés : plus la bande est forte face à la garde, plus il y en a ; une arme protège
  let nb = 0;
  if (engages){
    const q = Math.min(1, f / Math.max(1, d)), armes = gardesArmes(S) / engages;
    nb = Math.min(engages, Math.round(engages * R.garde.blesse * q * (1 - armes / 2) + (hasard(S, 3) - .5) * .8));
    const duree = R.garde.guerison * Math.max(.2, 1 - eff(S, "soins"));
    for (let i = 0; i < Math.max(0, nb); i++) S.blesses.push(S.t + duree);
  }
  const bilan = {t: S.t, force: f, defense: Math.round(d * 10) / 10, gardes: engages, repousse, vole, blesses: Math.max(0, nb)};
  S.raids.push(bilan); if (S.raids.length > 12) S.raids.shift();
  const tot = Object.values(vole).reduce((a, b) => a + b, 0);
  evt(S, repousse ? "LA GARDE REPOUSSE LES PILLARDS" : tot ? "LES PILLARDS ONT VOLE " + tot + " RESSOURCES" : "LES PILLARDS REPARTENT LES MAINS VIDES", repousse || !tot);
  jalon(S, "raid" + S.raid.n);
  S.raid.n++; S.raid.phase = null; S.raid.force = null; planifier(S);
}
// à chaque pas : guérisons, alerte, arrivée de la bande
function pillards(S){
  const P = D(S).RAIDS;
  if (S.blesses.length){ const avant = S.blesses.length; S.blesses = S.blesses.filter(t => t > S.t); if (S.blesses.length < avant) evt(S, "UN GARDE EST GUERI", true); }
  if (!P.intervalle[S.statut]){ S.raid.proch = null; S.raid.phase = null; return; }
  if (S.raid.proch === null){ planifier(S, true); return; }
  const reste = S.raid.proch - S.t;
  if (reste <= 0){ combattre(S); return; }
  if (reste <= annonce(S) && !S.raid.phase){
    S.raid.force = forceBande(S); S.raid.phase = "alerte";
    evt(S, prevenus(S) ? "LA TOUR DE GUET VOIT VENIR DES PILLARDS !" : "DES PILLARDS ARRIVENT !", false);
  }
  if (reste <= P.approche && S.raid.phase === "alerte") S.raid.phase = "approche";
}
// pendant l'approche, les villageois s'abritent : les récolteurs ne récoltent plus (les ateliers continuent)
const abrites = S => S.raid && S.raid.phase === "approche";

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
  for (const m in P.METIERS){ const M = P.METIERS[m]; if (M.produit) t[M.produit] += debitBrut(M, J[m]) * mult * bonusMetier(S, m); }
  // transformations dans l'ordre des données (le blé avant la farine)
  for (const m in P.METIERS){
    const M = P.METIERS[m]; if (!M.entree || !J[m]) continue;
    let out = M.debit * J[m] * mult * bonusMetier(S, m);
    for (const r in M.entree) if (S.res[r] < 1) out = Math.min(out, Math.max(0, t[r]) / M.entree[r]);
    for (const r in M.entree) t[r] -= out * M.entree[r];
    t[M.sortie] += out;
  }
  const v = S.pop * P.BESOINS.conso * (hiver(S) ? faimHiver(S) : 1);
  if (hiver(S)) t.bois -= S.pop * chauffage(S);
  t.vivres = Object.keys(P.RES).reduce((a, r) => a + (P.RES[r].vivres ? t[r] * P.RES[r].vivres : 0), 0) - v;
  if (S.pop >= P.BESOINS.vetements.pop) t.vetements -= S.pop * P.BESOINS.vetements.conso;
  const Bi = P.BESOINS.biere; if (Bi && S.pop >= Bi.pop && S.bat[Bi.lieu]) t.biere -= S.pop * Bi.conso;
  return t;
}

// eff : part de la production pendant ce temps (1 en jeu, HORS_LIGNE.rendement quand l'appli est fermée) ; les chantiers avancent toujours
function pas(S, dt, eff){
  while (dt > 1e-9){ const h = Math.min(dt, 1); pas1(S, h, eff === undefined ? 1 : eff); dt -= h; }
}
function pas1(S, dt, rend){
  const P = D(S), mult = moral(S).mult * rend;
  S.t += dt;
  // chantiers
  const vite = 1 / Math.max(.3, 1 - eff(S, "chantier"));   // charpentiers
  for (const c of S.chantiers) c.reste -= dt * vite;
  for (const c of S.chantiers.filter(c => c.reste <= 0)){
    S.bat[c.k]++; evt(S, P.BATIMENTS[c.k].nom + " TERMINE", true); jalon(S, c.k + S.bat[c.k]);
  }
  S.chantiers = S.chantiers.filter(c => c.reste > 0);
  pillards(S);
  // production brute (rien pendant que les villageois s'abritent)
  if (!abrites(S)) for (const m in P.METIERS){ const M = P.METIERS[m]; if (M.produit && S.jobs[m]) S.res[M.produit] += debitBrut(M, S.jobs[m]) * mult * bonusMetier(S, m) * dt; }
  // transformations (limitées par ce qu'il y a en réserve)
  for (const m in P.METIERS){
    const M = P.METIERS[m]; if (!M.entree || !S.jobs[m]) continue;
    let out = Math.min(M.debit * S.jobs[m] * mult * bonusMetier(S, m) * dt, Math.max(0, capacite(S, M.sortie) - S.res[M.sortie]));
    for (const r in M.entree) out = Math.min(out, S.res[r] / M.entree[r]);
    if (out <= 0) continue;
    for (const r in M.entree) S.res[r] -= out * M.entree[r];
    S.res[M.sortie] += out;
  }
  // on mange, on s'habille
  if (S.pop){
    const H = hiver(S), besoin = S.pop * P.BESOINS.conso * (H ? faimHiver(S) : 1) * dt * rend;
    payerVivres(S, Math.min(besoin, vivres(S)));
    if (H) S.res.bois = Math.max(0, S.res.bois - S.pop * chauffage(S) * dt * rend);   // on se chauffe
    if (S.pop >= P.BESOINS.vetements.pop) S.res.vetements = Math.max(0, S.res.vetements - S.pop * P.BESOINS.vetements.conso * dt * rend);
    const Bi = P.BESOINS.biere; if (Bi && S.pop >= Bi.pop && S.bat[Bi.lieu]) S.res.biere = Math.max(0, S.res.biere - S.pop * Bi.conso * dt * rend);   // on boit à la taverne
  }
  for (const r in S.res) if (S.res[r] < 1e-9) S.res[r] = 0;
  borner(S);   // ce qui dépasse la place est perdu
}

/* ---------- ordres du joueur ---------- */
function toucher(S, r, n){
  const P = D(S), en_plus = {pierre: "toucherPierre", ble: "toucherBle", laine: "toucherLaine"};   // ce que les équipements ouvrent au toucher
  if (!P.PIONNIER.ressources.includes(r) && !(en_plus[r] && eff(S, en_plus[r]))) return "RIEN A RECOLTER";
  if (plein(S, r)) return r === "bois" ? "PLUS DE PLACE : AGRANDIS L'AIRE DE STOCKAGE" : "PLUS DE PLACE : AGRANDIS LE GRENIER";
  S.res[r] = Math.min(capacite(S, r), S.res[r] + (P.PIONNIER.toucher + eff(S, "toucher")) * (n || 1)); S.touchers += n || 1; return null;
}
function recruter(S){
  const P = D(S);
  if (S.pop >= plafondStatut(S)) return S.statut + 1 < P.STATUTS.length ? "IL FAUT UN STATUT PLUS GRAND" : "PLAFOND DE L'ERE : PROMULGUER LA LOI";
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
  const n = S.bat[b] + enChantier(S, b);
  if (B.niveaux && n >= B.niveaux) return "NIVEAU MAXIMAL";
  if (B.niveaux && enChantier(S, b)) return "DEJA EN TRAVAUX";
  if (!(B.niveaux && n > 0) && parcellesLibres(S, B.terrain) < 1) return "PLUS DE TERRAIN LIBRE";
  if (!peutPayer(S, coutBat(S, b))) return "PAS ASSEZ DE RESSOURCES";
  return null;
}
// lot = le terrain choisi par le joueur (sinon celui que propose la carte)
function construire(S, b, lot){
  const e = peutConstruire(S, b); if (e) return e;
  const ici = D(S).BATIMENTS[b].niveaux && Object.keys(S.lots).find(id => S.lots[id] === b);   // agrandir : sur place
  if (ici){ payer(S, coutBat(S, b)); S.chantiers.push({k: b, reste: D(S).BATIMENTS[b].travail, lot: ici, agrandit: true}); return null; }
  if (CARTE){
    lot = lot || CARTE.de(S).proposer(S, b);
    const L = CARTE.de(S).LOTS[lot];
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
  const b = S.lots[de], L = CARTE.de(S).LOTS[vers];
  if (!b) return "RIEN A DEPLACER";
  if (!L || L.terrain !== CARTE.de(S).LOTS[de].terrain) return "CE TERRAIN NE CONVIENT PAS";
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
// la part produite et la durée au plus, Lois de l'absence comprises
function horsLigneRegle(S){ const H = D(S).HORS_LIGNE; return {rendement: H.rendement + eff(S, "horsRendement"), plafond: H.plafond + eff(S, "horsPlafond")}; }
function horsLigne(S, secondes){
  const H = horsLigneRegle(S), s = Math.max(0, Math.min(secondes, H.plafond)), avant = copie(S.res), n0 = S.raid.n;
  pas(S, s, H.rendement);
  if (secondes > s) pas(S, secondes - s, 0);   // au-delà du plafond : le temps passe (chantiers), plus rien ne se produit
  const gains = {}; for (const r in S.res){ const g = S.res[r] - avant[r]; if (Math.abs(g) >= .5) gains[r] = Math.round(g); }
  const raids = S.raids.slice(-Math.min(S.raids.length, S.raid.n - n0));   // les bandes venues pendant l'absence (combat réglé tout seul)
  return {duree: s, absence: Math.max(0, secondes), plafonne: secondes > H.plafond, rendement: H.rendement, plafond: H.plafond, gains, raids};
}
const sauver = S => JSON.stringify(S);
function charger(txt){
  let S; try { S = JSON.parse(txt); } catch (e){ return null; }
  if (!S || typeof S !== "object" || !S.res || !S.jobs) return null;
  const neuf = creer(S.mods, S.ere);
  for (const k in neuf) if (S[k] === undefined) S[k] = neuf[k];
  for (const r in neuf.res) if (typeof S.res[r] !== "number") S.res[r] = 0;
  for (const b in neuf.bat) if (typeof S.bat[b] !== "number") S.bat[b] = 0;
  for (const m in neuf.jobs) if (typeof S.jobs[m] !== "number") S.jobs[m] = 0;
  if (!S.lots || typeof S.lots !== "object") S.lots = {};
  if (!Array.isArray(S.ordreLots)) S.ordreLots = Object.keys(S.lots);
  S.v = VERSION;
  return S;
}

/* ---------- le prestige : les Lois et la nouvelle colonie ---------- */
// L = ce qui se garde d'une colonie à l'autre (sauvé à part : terres.lois) : points à dépenser, Lois prises, colonies fondées
function lois(L){
  L = (L && typeof L === "object") ? L : {};
  if (typeof L.points !== "number" || L.points < 0) L.points = 0;
  if (!Array.isArray(L.prises)) L.prises = [];
  if (!Array.isArray(L.colonies)) L.colonies = [];
  return L;
}
function peutPrendreLoi(L, id, mods){
  const X = reglages(mods).LOIS[id]; if (!X) return "INCONNUE";
  if (L.prises.includes(id)) return "DEJA PRISE";
  if (X.req && !L.prises.includes(X.req)) return "IL FAUT D'ABORD " + reglages(mods).LOIS[X.req].nom;
  if (L.points < X.points) return "PAS ASSEZ DE POINTS";
  return null;
}
function prendreLoi(L, id, mods){ const e = peutPrendreLoi(L, id, mods); if (e) return e; L.points -= reglages(mods).LOIS[id].points; L.prises.push(id); return null; }
// la Loi de l'ère promulguée : ses points vont dans L, une seule fois
function recompense(S, L){
  if (!S.loi || S.recompense) return 0;
  const n = D(S).POINTS_LOI[S.ere || 1] || 0; L.points += n; S.recompense = true; return n;
}
// fonder la colonie suivante : nouvelle partie de l'ère suivante, avec les Lois prises, le premier villageois (et ceux des Lois),
// la cabane offerte ; o = {nom, lois, ere, mods}
function nouvelleColonie(o){
  const S = creer(o.mods, o.ere || 2); S.nom = o.nom || ""; S.lois = (o.lois || []).slice();
  if (eff(S, "cabaneOfferte")){ const lot = CARTE.de(S).proposer(S, "cabane"); if (lot){ S.lots[lot] = "cabane"; S.ordreLots.push(lot); S.bat.cabane = 1; } }
  S.pop = 1 + eff(S, "villageois");
  return S;
}

/* ---------- le robot (simulateur) ---------- */
// plan de construction : le robot pose dans cet ordre ce qui est permis, quand il en a les moyens
const PLANS = {
  1: ["cabane", "cabane", "champ", "carriere", "cabane", "moulin", "four", "cabane", "tour", "caserne", "ponton", "cabane",
    "maison", "bergerie", "atelier", "maison", "forge", "maison", "champ", "carriere", "caserne", "ponton", "maison", "maison", "maison"],
  // la côte : les mêmes débuts, puis planches et poisson fumé dès le hameau, la bière au village, le port au bourg
  2: ["cabane", "cabane", "champ", "carriere", "cabane", "scierie", "fumoir", "moulin", "four", "cabane", "tour", "caserne", "ponton", "cabane",
    "maison", "bergerie", "atelier", "maison", "orge", "brasserie", "taverne", "forge", "maison", "carriere", "caserne", "ponton",
    "maison", "maison", "maison", "maison", "port", "maison", "maison", "maison", "maison", "maison"]
};
const planDe = S => PLANS[Math.min(2, S.ere || 1)];
function prochainBat(S){
  const P = D(S), vus = {};
  const st = P.STATUTS[S.statut + 1], vise = Object.assign({}, st ? st.cout : P.LOI.cout);
  for (const r in vise){ if (vise[r] <= capacite(S, r) * .98) continue; const g = gardien(S, r); if (g && !peutConstruireSansCout(S, g)) return g; }
  for (const b of planDe(S)){
    vus[b] = (vus[b] || 0) + 1;
    if (S.bat[b] + enChantier(S, b) >= vus[b]) continue;
    if (P.BATIMENTS[b].statut > S.statut) continue;
    // un logis quand on manque de place, pas avant
    if (P.BATIMENTS[b].logement && logement(S) + enChantierLogement(S) > S.pop + 1 && S.pop < plafondStatut(S) - 1) continue;
    if (parcellesLibres(S, P.BATIMENTS[b].terrain) < 1) continue;
    return b;
  }
  return null;
}
function peutConstruireSansCout(S, b){ const e = peutConstruire(S, b); return e === "PAS ASSEZ DE RESSOURCES" ? null : e; }
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
  // une chaîne s'arrête quand son produit est en réserve en assez grande quantité (et que l'objectif n'en demande pas plus)
  //   (sur la côte seulement : l'ère 1 garde le robot réglé le 11/11) ; sur la côte, d'abord du bois et de la pierre
  const cote = (S.ere || 1) >= 2, mq0 = manque(S, objectif(S)), assez = r => cote && !mq0[r] && S.res[r] >= capacite(S, r) * .6;
  if (cote && S.pop >= 6){ if (S.res.bois < 300 || mq0.bois) mettre("bucheron", 2 + Math.floor(S.pop / 10)); if (S.bat.carriere && (S.res.pierre < 150 || mq0.pierre)) mettre("carrier", 1 + Math.floor(S.pop / 15)); }
  // pain : fermiers pour nourrir le moulin, meunier, boulanger
  if (S.bat.moulin && S.bat.four && S.pop >= 6 && !assez("pain")){ mettre("fermier", 3); mettre("meunier", 1); mettre("boulanger", 1); }
  // la garde (2 au hameau, 4 au village) et le forgeron tant qu'il manque des armes
  if (S.bat.caserne) mettre("garde", Math.min(S.statut >= 3 ? 6 : S.statut >= 2 ? 4 : 2, Math.max(2, Math.floor(S.pop / 4))));
  if (S.bat.forge && S.res.armes < J.garde) mettre("forgeron", 1);
  // vêtements quand le besoin compte bientôt
  if (S.bat.atelier && S.pop >= P.BESOINS.vetements.pop - 2 && !assez("vetements")){ mettre("berger", 2); mettre("tisserand", 1); }
  // la côte : de la bière quand le besoin compte bientôt, du poisson fumé et des planches tant qu'il en faut
  if (P.METIERS.brasseur && S.bat.brasserie && S.pop >= P.BESOINS.biere.pop - 3 && !assez("biere")){ mettre("paysan", 2); mettre("brasseur", 1); }
  if (P.METIERS.fumeur && S.bat.fumoir && (mq0.fume || S.pop >= 16) && !assez("fume")){ mettre("pecheur", 2); mettre("fumeur", 1); }
  if (P.METIERS.scieur && S.bat.scierie && mq0.planches){ mettre("scieur", Math.min(places(S, "scieur"), 1 + Math.floor(S.pop / 12))); }
  // de quoi manger, avec une marge
  const nourr = ["pecheur", "cueilleur"];
  let garde = 0;
  while (reste > 0 && garde++ < 40){
    const t = taux(S, J), cible = S.pop * P.BESOINS.conso * .35 + (manque(S, objectif(S)).vivres ? .25 + S.pop * .03 : 0);   // les recrues coûtent cher en vivres
    if (t.vivres >= cible) break;
    const m = nourr.filter(x => J[x] < places(S, x) && !plein(S, P.METIERS[x].produit)).sort((a, b) => J[a] - J[b])[0];
    if (!m){ if (!mettre("fermier", 1)) break; continue; }
    mettre(m, 1);
  }
  // matériaux : selon ce qui manque (le bois, la pierre, puis le reste de la chaîne)
  garde = 0;
  while (reste > 0 && garde++ < 40){
    const mq = manque(S, objectif(S)), t = taux(S, J);
    const cands = Object.keys(P.METIERS).filter(m => J[m] < places(S, m) && !P.METIERS[m].defend && m !== "forgeron");
    if (!cands.length) break;
    let best = null, bs = -1;
    for (const m of cands){
      const M = P.METIERS[m], r = M.produit || M.sortie;
      let s = (mq[r] || 0) / Math.max(.05, t[r] + .05) + (r === "bois" ? .5 : 0) + (r === "pierre" && S.statut >= 1 ? .4 : 0);
      if (M.entree && Object.keys(M.entree).some(x => S.res[x] < 1 && t[x] <= 0)) s = 0;
      if (plein(S, r)) s = -.5;   // stock plein : ailleurs d'abord
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
  // il économise pour le statut, sauf s'il manque une ressource que personne ne produit encore (le pain : moulin et four d'abord)
  const st = P.STATUTS[S.statut + 1], t = taux(S), attend = st && S.pop >= st.pop && Object.keys(st.cout).every(r => S.res[r] >= st.cout[r] || t[r] > 1e-6);
  if (!attend){
    const b = prochainBat(S); if (b && !peutConstruire(S, b)) construire(S, b);
    let n = 0; while (n++ < 3 && !recruter(S));
  }
  for (const id of ORDRE_ROBOT){ if (peutAcheter(S, id)) continue; const c = coutOrd(S, id); if (Object.keys(c).every(r => c[r] <= S.res[r] * .05)) acheter(S, id); }
  repartir(S);
}
const ORDRE_ROBOT = ["outils", "etageres", "tentes", "serrures", "meules", "pelles", "engrais", "metiers", "exercice", "hottes", "coupes", "ateres", "chemins", "palissade", "charpente", "conserves", "soins", "guetteurs", "fetes", "accueil", "hospitalite", "panier", "pioche"];
// ce que le pionnier touche : ce qui manque le plus pour le prochain achat
function aToucher(S){
  const mq = manque(S, objectif(S));
  if (mq.vivres || mq.baies || mq.poisson) return S.res.baies <= S.res.poisson ? "baies" : "poisson";
  return "bois";
}

const api = {VERSION, eff, coutOrd, peutAcheter, acheter, plafondStatut, chauffage, faimHiver, reglages, creer, pas, taux, moral, places, logement, popMax, libres, parcellesLibres, vivres, capacite, gardien, plein, saison, hiver,
  lois, peutPrendreLoi, prendreLoi, recompense, nouvelleColonie, horsLigneRegle,
  coutBat, coutRecrue, peutPayer, toucher, recruter, affecter, peutConstruire, construire, deplacer, peutMonter, monterStatut,
  peutPromulguer, promulguer, horsLigne, abri, defense, forceBande, gardesValides, gardesArmes, blesses, annonce, abrites, sauver, charger, robot, aToucher, objectif, PLAN: PLANS[1], PLANS};
if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.TerresRegles = api;
})();

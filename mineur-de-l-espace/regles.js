/* =====================================================================
   MINEUR DE L'ESPACE · les RÈGLES (logique pure, sans dessin ni
   stockage) : minerais et prix, corvettes (classes et améliorations),
   roches qui se brisent, usines, recherche, station spatiale, drones,
   planètes et bases, aliens (vagues, flottes composées, satellites,
   bataille finale).
   Tout l'aléatoire passe par des générateurs à graine (mdeRng) : aucun
   Math.random(). Les fonctions modifient l'état reçu (un objet JSON,
   sauvegardable tel quel) et ne touchent à rien d'autre.
   - Dans la page : script classique (portée globale, noms préfixés
     mde / MDE_).
   - Dans Node : outils/mineur-simulateur.js le charge (vm), comme la page.
   Cahier des charges : specs/mineur-de-l-espace.md.
   ===================================================================== */
'use strict';
const MDE_V = 1;

/* ---------- hasard à graine ---------- */
function mdeMulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function mdeRng(graine, usage, a, b) {
  let h = 2166136261;
  for (const ch of String(graine) + '|' + usage + '|' + (a || 0) + '|' + (b || 0)) { h = Math.imul(h ^ ch.charCodeAt(0), 16777619); h ^= h >>> 13; }
  return mdeMulberry(h >>> 0);
}
const mdeEntre = (R, a, b) => a + Math.floor(R() * (b - a + 1));
function mdePondere(R, poids) { let t = 0; for (const k in poids) t += poids[k]; let x = R() * t; for (const k in poids) { x -= poids[k]; if (x < 0) return k; } return Object.keys(poids)[0]; }

/* ---------- minerais (§ 6) ---------- */
const MDE_MINERAIS = {
  fer:     { nom: 'FER',     prix: 5,  couleur: '#b5643c' },
  or:      { nom: 'OR',      prix: 30, couleur: '#f2c14e' },
  glace:   { nom: 'GLACE',   prix: 6,  couleur: '#bfe8f2' },
  titane:  { nom: 'TITANE',  prix: 15, couleur: '#c9ccd6' },
  cobalt:  { nom: 'COBALT',  prix: 20, couleur: '#4f6fd8' },
  cristal: { nom: 'CRISTAL', prix: 80, couleur: '#d27ef0' },
};
const MDE_ORDRE = Object.keys(MDE_MINERAIS);

/* ---------- planètes et ceintures (§ 5) ---------- */
// part de chaque minerai dans les roches de la ceinture ; voyage : coût depuis la Terre (ou depuis la Lune pour Mars)
const MDE_PLANETES = {
  terre: { nom: 'TERRE', ceinture: { fer: 0.86, or: 0.14 }, voyage: null },
  lune:  { nom: 'LUNE',  ceinture: { glace: 0.5, titane: 0.36, fer: 0.14 }, voyage: { cr: 60 }, req: e => !!e.recherche.transfert },
  mars:  { nom: 'MARS',  ceinture: { cobalt: 0.6, fer: 0.3, cristal: 0.1 }, voyage: { cr: 150, glace: 10 }, req: e => !!e.recherche.lointain },
};
const MDE_DUREE_VOYAGE = 8;   // secondes d'animation

/* ---------- les roches (§ 3) ---------- */
// taille 3 = grosse, 2 = moyenne, 1 = petite (lâche du minerai)
const MDE_ROCHES = { 3: { pv: 7, nom: 'GROSSE' }, 2: { pv: 3, nom: 'MOYENNE' }, 1: { pv: 1, nom: 'PETITE' } };
// une nouvelle roche de la ceinture : son minerai se voit dès le début (veines)
function mdeRoche(e, planete, R) {
  const c = Object.assign({}, MDE_PLANETES[planete].ceinture);
  if (e.recherche.filon && c.or) c.or *= 2;
  if (e.recherche.filon && c.cristal) c.cristal *= 1.5;
  return { taille: 3, pv: MDE_ROCHES[3].pv, minerai: mdePondere(R, c) };
}
// une roche cassée : 2 à 4 éclats de la taille en dessous (même minerai) ; une petite ne donne rien (voir mdeButin)
function mdeEclats(roche, R) {
  if (roche.taille <= 1) return [];
  const n = mdeEntre(R, 2, 4), t = roche.taille - 1, l = [];
  for (let i = 0; i < n; i++) l.push({ taille: t, pv: MDE_ROCHES[t].pv, minerai: roche.minerai });
  return l;
}
// le minerai lâché par une petite roche : 1 ou 2 (les roches riches en lâchent 2 plus souvent)
const mdeChanceDouble = e => 0.3 + 0.15 * ((e.recherche.riche1 ? 1 : 0) + (e.recherche.riche2 ? 1 : 0) + (e.recherche.riche3 ? 1 : 0));
const mdeButin = (e, roche, R) => roche.taille === 1 ? (R() < mdeChanceDouble(e) ? 2 : 1) : 0;
// dangers (§ 3) : petites roches rapides par minute de vol, selon l'étage ; un choc = 1 point de coque
const MDE_DANGERS = { 1: 1.2, 2: 1.6, 3: 2.2, 4: 2.6 };

/* ---------- les corvettes (§ 7) ---------- */
// vol : secondes de carburant en poussant (on consomme MDE_CONSO.glisse en glissant)
const MDE_CONSO = { pousse: 1, glisse: 0.5 };
const MDE_TIR = { cadence: 0.45, portee: 210 };
const MDE_CLASSES = {
  eclaireur:   { nom: 'ECLAIREUR',   tourelles: 1, maxTourelles: 2, soute: 4,  vol: 34, coque: 3,  degats: 1, vitesse: 1,    capacite: null,       prix: null },
  prospecteur: { nom: 'PROSPECTEUR', tourelles: 2, maxTourelles: 3, soute: 6,  vol: 40, coque: 4,  degats: 1, vitesse: 1,    capacite: 'foreuse',  prix: { cr: 500, fer: 25 },  req: e => !!e.station.central },
  pionniere:   { nom: 'PIONNIERE',   tourelles: 3, maxTourelles: 4, soute: 8,  vol: 50, coque: 6,  degats: 1, vitesse: 1.1,  capacite: 'aimant',   prix: { cr: 2600, fer: 60, or: 8 }, req: e => !!e.station.ailes },
  escorte:     { nom: 'ESCORTE',     tourelles: 3, maxTourelles: 4, soute: 4,  vol: 44, coque: 10, degats: 2, vitesse: 1.15, capacite: 'bouclier', prix: { cr: 9000, titane: 40, cobalt: 30 }, req: e => !!e.station.quai },
  forteresse:  { nom: 'FORTERESSE',  tourelles: 5, maxTourelles: 6, soute: 10, vol: 60, coque: 14, degats: 2, vitesse: 0.85, capacite: 'salve',    prix: { cr: 24000, cobalt: 60, cristal: 25 }, req: e => !!e.recherche.cristal },
};
// améliorations, 5 niveaux, prix × 2 par niveau ; COMMUNES à toutes les classes (on les garde en changeant de
// classe : une classe neuve est toujours mieux que l'ancienne) ; elles se voient sur la corvette
const MDE_AMELIORATIONS = {
  reservoir: { nom: 'RESERVOIR', poids: 1,   effet: 'VOL +10 S' },
  soute:     { nom: 'SOUTE',     poids: 1.2, effet: 'SOUTE +2' },
  canon:     { nom: 'CANON',     poids: 1.5, effet: ['DEGATS +1', 'TOURELLE +1', 'DEGATS +1', 'TOURELLE +1', 'DEGATS +1'] },
  coque:     { nom: 'COQUE',     poids: 0.8, effet: 'COQUE +2' },
};
const MDE_NIV_MAX = 5, MDE_AMEL_PRIX = 50, MDE_AMEL_HAUSSE = 2;
const mdeAmel = e => e.ameliorations;
// niveaux 1 à 3 dès le départ ; le 4 avec le module central de la station, le 5 avec la base lunaire
const mdeNivMax = e => e.bases.lune ? 5 : e.station.central ? 4 : 3;
// ce que vaut la corvette d'une classe avec ses améliorations et la recherche
function mdeCorvette(e, classe) {
  classe = classe || e.classe;
  const C = MDE_CLASSES[classe], A = mdeAmel(e);
  return {
    classe, nom: C.nom, capacite: C.capacite,
    tourelles: Math.min(C.maxTourelles, C.tourelles + Math.floor(A.canon / 2)),
    degats: C.degats + Math.ceil(A.canon / 2),
    soute: C.soute + 2 * A.soute,
    vol: C.vol + 10 * A.reservoir,
    coque: C.coque + 2 * A.coque,
    vitesse: C.vitesse * (e.recherche.moteurs ? 1.15 : 1),
    aimant: (C.capacite === 'aimant' ? 1.6 : 1) * (e.recherche.aimant ? 1.6 : 1),
  };
}

/* ---------- usines (§ 8) : elles augmentent le prix de vente d'un minerai ---------- */
const MDE_USINE_MULT = [1, 1.25, 1.5, 2];
const MDE_USINES = {
  fonderie:   { nom: 'FONDERIE',   minerai: 'fer',     prix: [60, 240, 800] },
  affinerie:  { nom: 'AFFINERIE',  minerai: 'or',      prix: [150, 500, 1500] },
  distillerie:{ nom: 'DISTILLERIE',minerai: 'glace',   prix: [600, 1500, 3500],  req: e => !!e.recherche.transfert },
  laminoir:   { nom: 'LAMINOIR',   minerai: 'titane',  prix: [800, 2000, 4500], req: e => !!e.recherche.transfert },
  forge:      { nom: 'FORGE',      minerai: 'cobalt',  prix: [1200, 3000, 6500], req: e => !!e.recherche.lointain },
  taillerie:  { nom: 'TAILLERIE',  minerai: 'cristal', prix: [3000, 7000, 14000], req: e => !!e.recherche.cristal },
};

/* ---------- recherche (§ 8) : immédiate une fois payée ---------- */
const MDE_RECHERCHES = {
  riche1:    { nom: 'ROCHES RICHES',        effet: 'PLUS DE MINERAI',       prix: { cr: 140 } },
  aimant:    { nom: 'AIMANT',               effet: 'RAMASSE DE PLUS LOIN',  prix: { cr: 240 } },
  moteurs:   { nom: 'MOTEURS',              effet: 'VITESSE +15 %',         prix: { cr: 420, fer: 10 } },
  filon:     { nom: 'FILONS',               effet: 'OR ET CRISTAL PLUS SOUVENT', prix: { cr: 650, fer: 15 } },
  riche2:    { nom: 'ROCHES TRES RICHES',   effet: 'PLUS DE MINERAI',       prix: { cr: 1000, fer: 25 }, req: e => !!e.recherche.riche1 && !!e.station.central },
  centre:    { nom: 'CENTRE SPATIAL',       effet: 'LA STATION',            prix: { cr: 1000, fer: 40, or: 6 } },
  transfert: { nom: 'MOTEUR DE TRANSFERT',  effet: 'VOYAGE VERS LA LUNE',   prix: { cr: 6000, fer: 80, or: 15 }, req: e => !!e.station.radiateurs },
  riche3:    { nom: 'ROCHES GORGEES',       effet: 'PLUS DE MINERAI',       prix: { cr: 3500, titane: 25 }, req: e => !!e.recherche.riche2 && !!e.recherche.transfert },
  lointain:  { nom: 'PROPULSION LOINTAINE', effet: 'VOYAGE VERS MARS',      prix: { cr: 10000, glace: 40, titane: 30 }, req: e => !!e.bases.lune },
  blindage:  { nom: 'BLINDAGE',             effet: 'FLOTTES PV +30 %',      prix: { cr: 7000, titane: 30, cobalt: 20 }, req: e => mdeEtage(e) >= 4 },
  cristal:   { nom: 'TAILLE DU CRISTAL',    effet: 'CLASSE FORTERESSE',     prix: { cr: 14000, cristal: 10 }, req: e => !!e.bases.mars },
  commandement: { nom: 'COMMANDEMENT',      effet: 'FLOTTES +2 PLACES',     prix: { cr: 12000, cristal: 15 }, req: e => mdeEtage(e) >= 4 },
};

/* ---------- la station spatiale, module par module (§ 9) ---------- */
const MDE_MODULES = {
  central:    { nom: 'MODULE CENTRAL', effet: 'CLASSE PROSPECTEUR', prix: { cr: 300, fer: 20 } },
  poutre:     { nom: 'POUTRE',         effet: 'PORTE LES AILES',    prix: { cr: 450, fer: 35 },          req: e => !!e.station.central },
  ailes:      { nom: 'AILES SOLAIRES', effet: 'CLASSE PIONNIERE',   prix: { cr: 750, fer: 45, or: 6 },  req: e => !!e.station.poutre },
  hangar:     { nom: 'HANGAR',         effet: 'DRONES',             prix: { cr: 1000, fer: 60, or: 8 },  req: e => !!e.station.poutre },
  radiateurs: { nom: 'RADIATEURS',     effet: 'MOTEUR DE TRANSFERT',prix: { cr: 1600, fer: 70 },         req: e => !!e.station.ailes },
  raffinerie: { nom: 'RAFFINERIE',     effet: 'TOUS LES PRIX +20 %',prix: { cr: 3000, fer: 60, titane: 20 }, req: e => !!e.station.radiateurs && !!e.recherche.transfert },
  antenne:    { nom: 'ANTENNE',        effet: 'SATELLITES',         prix: { cr: 5000, titane: 30, cobalt: 10 }, req: e => !!e.bases.mars },
  quai:       { nom: 'QUAI',           effet: 'CLASSE ESCORTE, FLOTTES +2 PLACES', prix: { cr: 8000, titane: 40, cobalt: 25 }, req: e => !!e.bases.mars },
};
const MDE_STATION_ORDRE = Object.keys(MDE_MODULES);

/* ---------- drones (§ 9) : ils travaillent seuls, seulement pendant qu'on joue ---------- */
// production d'une planète (minerai par minute) = min(mineurs × 2, cargos × 4) : un cargo sert deux mineurs
const MDE_DRONE_MINEUR = 2, MDE_DRONE_CARGO = 4;
const MDE_DRONES = {
  mineur:     { nom: 'DRONE MINEUR', max: 6, prix: { cr: 450, fer: 10 }, hausse: 1.35 },
  cargo:      { nom: 'DRONE CARGO',  max: 3, prix: { cr: 350, fer: 10 }, hausse: 1.35 },
  reparateur: { nom: 'DRONE REPARATEUR', max: 1, prix: { cr: 1800, fer: 30, or: 6 }, effet: 'REPARE LA COQUE EN VOL' },
  satellite:  { nom: 'SATELLITE',    max: 3, prix: { cr: 1500, titane: 10 }, hausse: 1.4, req: e => !!e.station.antenne },
};

/* ---------- bases (§ 5) ---------- */
const MDE_BASES = {
  lune: { nom: 'BASE LUNAIRE',   prix: { cr: 5000, fer: 60, glace: 30, titane: 20 } },
  mars: { nom: 'BASE MARTIENNE', prix: { cr: 13000, glace: 50, titane: 40, cobalt: 20 } },
};
const mdeABase = (e, p) => p === 'terre' ? !!e.station.hangar : !!e.bases[p];

/* ---------- la défense (§ 10) ---------- */
// unités de flotte (posées dans les emplacements d'une planète) ; att : dégâts par seconde
const MDE_UNITES = {
  garde:      { nom: 'DRONE DE DEFENSE', pv: 10, att: 1.5, prix: { cr: 500, fer: 10 } },
  escorte:    { nom: 'ESCORTE AUTONOME', pv: 30, att: 3, prix: { cr: 2200, titane: 20, cobalt: 15 }, req: e => !!e.station.quai },
  reparateur: { nom: 'REPARATEUR',       pv: 12, att: 0, soin: 3, prix: { cr: 1600, fer: 10, titane: 10 } },
  canonniere: { nom: 'CANONNIERE',       pv: 60, att: 6, prix: { cr: 7000, cobalt: 30, cristal: 10 }, req: e => !!e.recherche.cristal },
};
const mdePlaces = e => 4 + (e.station.quai ? 2 : 0) + (e.recherche.commandement ? 2 : 0);
const MDE_ALIENS = {
  rodeur:   { nom: 'RODEUR',   pv: 6,   att: 1,  cout: 3 },
  chasseur: { nom: 'CHASSEUR', pv: 12,  att: 1.5, cout: 7 },
  croiseur: { nom: 'CROISEUR', pv: 36,  att: 3,  cout: 20 },
  mere:     { nom: 'VAISSEAU-MERE', pv: 400, att: 10, cout: 0, cibles: 3 },
};
const MDE_VAGUES = { intervalle: 360, premiere: 240, nombre: 8, budget: n => 6 + 8 * n, preavis: s => 20 + 15 * s, base: 250, siege: 0.5 };
const MDE_FINALE = { budget: 120, attente: 180 };
// retard de la flotte (secondes de combat avant son arrivée) : les satellites la font venir plus vite
const mdeRetard = (e, p) => Math.max(0, 10 - 3 * (e.satellites[p] || 0));

/* ---------- nouvelle partie ---------- */
function mdeNouvelle(graine) {
  return {
    v: MDE_V, graine: String(graine), temps: 0,
    cr: 0, entrepot: {}, planete: 'terre',
    classe: 'eclaireur', classes: { eclaireur: true }, ameliorations: { reservoir: 0, soute: 0, canon: 0, coque: 0 },
    usines: {}, recherche: {}, station: {}, bases: {},
    drones: { terre: { mineur: 0, cargo: 0 }, lune: { mineur: 0, cargo: 0 }, mars: { mineur: 0, cargo: 0 } },
    reste: {}, reparateur: 0, satellites: {},
    flottes: { terre: [], lune: [], mars: [] }, hs: {},
    aliens: { debut: null, vague: 0, prochaine: null, alerte: null, finale: false, finaleApres: null },
    fin: false, sorties: 0, achats: 0, journal: [],
  };
}
function mdeMigrer(e) { if (!e || typeof e !== 'object') return null; if (!e.v) return null; e.v = MDE_V; return e; }

/* ---------- l'étage atteint (§ 5) ---------- */
function mdeEtage(e) { return e.bases.mars ? 4 : e.recherche.transfert ? 3 : e.recherche.centre ? 2 : 1; }

/* ---------- vendre et garder (§ 3, § 6) ---------- */
function mdePrix(e, m) {
  const u = Object.values(MDE_USINES).find(u => u.minerai === m), k = u ? (e.usines[Object.keys(MDE_USINES).find(c => MDE_USINES[c] === u)] || 0) : 0;
  return Math.round(MDE_MINERAIS[m].prix * MDE_USINE_MULT[k] * (e.station.raffinerie ? 1.2 : 1) * 100) / 100;
}
// le quai met de côté le minerai d'un achat affiché dès qu'on a la moitié de ses CR (le plus gros besoin de chaque
// minerai) et vend le reste : au début, tout est vendu ; on garde pour un chantier quand il approche
function mdeBesoins(e) {
  const b = {};
  for (const a of mdeAchats(e)) if (2 * e.cr >= (a.prix.cr || 0)) for (const m in a.prix) if (m !== 'cr') b[m] = Math.max(b[m] || 0, a.prix[m]);
  if (e.recherche.lointain) b.glace = Math.max(b.glace || 0, MDE_PLANETES.mars.voyage.glace);
  return b;
}
// livrer du minerai (retour au quai ou drones) : { gain, garde : {minerai: n} }
function mdeLivrer(e, lot) {
  const besoin = mdeBesoins(e), garde = {}; let gain = 0;
  for (const m of MDE_ORDRE) {
    const n = lot[m] || 0; if (!n) continue;
    const g = Math.max(0, Math.min(n, (besoin[m] || 0) - (e.entrepot[m] || 0)));
    if (g) { e.entrepot[m] = (e.entrepot[m] || 0) + g; garde[m] = g; }
    gain += (n - g) * mdePrix(e, m);
  }
  gain = Math.round(gain); e.cr += gain;
  return { gain, garde };
}
// fin d'une sortie : soute = {minerai: n} ; panne (carburant ou coque à zéro) : remorquée, on perd la moitié de la soute
function mdeRetour(e, soute, panne) {
  e.sorties++;
  let lot = soute;
  if (panne) { lot = {}; let tot = 0; for (const m of MDE_ORDRE) tot += soute[m] || 0; let reste = Math.floor(tot / 2); for (const m of MDE_ORDRE) { const n = Math.min(soute[m] || 0, reste); if (n) lot[m] = n; reste -= n; } }
  return Object.assign(mdeLivrer(e, lot), { panne: !!panne });
}

/* ---------- le catalogue des achats ---------- */
// chaque achat : { id, type, nom, effet, prix: {cr, minerai…}, possible } ; seulement ceux qu'on peut voir maintenant
function mdeMult(p, f) { const r = {}; for (const k in p) r[k] = Math.round(p[k] * f); return r; }
function mdeAchats(e) {
  const l = [], A = mdeAmel(e);
  for (const k in MDE_AMELIORATIONS) if (A[k] < mdeNivMax(e)) {
    const D = MDE_AMELIORATIONS[k];
    l.push({ id: 'amel:' + k, type: 'amel', nom: D.nom + ' ' + (A[k] + 1), effet: Array.isArray(D.effet) ? D.effet[A[k]] : D.effet, prix: { cr: Math.round(MDE_AMEL_PRIX * D.poids * Math.pow(MDE_AMEL_HAUSSE, A[k])) } });
  }
  for (const k in MDE_CLASSES) { const D = MDE_CLASSES[k]; if (!e.classes[k] && D.prix && D.req(e)) l.push({ id: 'classe:' + k, type: 'classe', nom: 'CLASSE ' + D.nom, effet: D.tourelles + ' TOURELLES', prix: D.prix }); }
  for (const k in MDE_USINES) { const D = MDE_USINES[k], n = e.usines[k] || 0; if (n < 3 && (!D.req || D.req(e))) l.push({ id: 'usine:' + k, type: 'usine', nom: D.nom + ' ' + (n + 1), effet: MDE_MINERAIS[D.minerai].nom + ' X' + MDE_USINE_MULT[n + 1], prix: { cr: D.prix[n] } }); }
  for (const k in MDE_RECHERCHES) { const D = MDE_RECHERCHES[k]; if (!e.recherche[k] && (!D.req || D.req(e))) l.push({ id: 'rech:' + k, type: 'rech', nom: D.nom, effet: D.effet, prix: D.prix }); }
  if (e.recherche.centre) for (const k in MDE_MODULES) { const D = MDE_MODULES[k]; if (!e.station[k] && (!D.req || D.req(e))) l.push({ id: 'module:' + k, type: 'module', nom: D.nom, effet: D.effet, prix: D.prix }); }
  for (const k in MDE_BASES) if (!e.bases[k] && MDE_PLANETES[k].req(e) && (k === 'lune' || e.bases.lune)) l.push({ id: 'base:' + k, type: 'base', nom: MDE_BASES[k].nom, effet: 'DRONES ET FLOTTE', prix: MDE_BASES[k].prix });
  const p = e.planete;
  if (mdeABase(e, p)) {
    for (const k of ['mineur', 'cargo']) { const n = e.drones[p][k]; if (n < MDE_DRONES[k].max) l.push({ id: 'drone:' + k, type: 'drone', nom: MDE_DRONES[k].nom, effet: MDE_PLANETES[p].nom, prix: mdeMult(MDE_DRONES[k].prix, Math.pow(MDE_DRONES[k].hausse, n)) }); }
    if (MDE_DRONES.satellite.req(e) && (e.satellites[p] || 0) < 3) l.push({ id: 'drone:satellite', type: 'drone', nom: 'SATELLITE', effet: 'ALERTE PLUS TOT', prix: mdeMult(MDE_DRONES.satellite.prix, Math.pow(1.4, e.satellites[p] || 0)) });
    if (mdeEtage(e) >= 4 && e.flottes[p].length < mdePlaces(e)) for (const k in MDE_UNITES) { const D = MDE_UNITES[k]; if (!D.req || D.req(e)) l.push({ id: 'unite:' + k, type: 'unite', nom: D.nom, effet: 'FLOTTE ' + MDE_PLANETES[p].nom, prix: D.prix }); }
    if (e.hs[p]) l.push({ id: 'reparer', type: 'reparer', nom: 'REPARER LA BASE', effet: MDE_PLANETES[p].nom, prix: mdeCoutReparation(e, p) });
  }
  if (e.station.hangar && e.reparateur < 1) l.push({ id: 'drone:reparateur', type: 'drone', nom: MDE_DRONES.reparateur.nom, effet: MDE_DRONES.reparateur.effet, prix: MDE_DRONES.reparateur.prix });
  for (const a of l) a.possible = mdePeutPayer(e, a.prix);
  return l;
}
const mdeCoutReparation = (e, p) => ({ cr: p === 'terre' ? 800 : Math.round(MDE_BASES[p].prix.cr / 10) });
function mdePeutPayer(e, prix) { for (const k in prix) if ((k === 'cr' ? e.cr : e.entrepot[k] || 0) < prix[k]) return false; return true; }
function mdePayer(e, prix) { for (const k in prix) { if (k === 'cr') e.cr -= prix[k]; else e.entrepot[k] -= prix[k]; } }
// acheter : true si c'est fait
function mdeAcheter(e, id) {
  const a = mdeAchats(e).find(x => x.id === id);
  if (!a || !a.possible) return false;
  mdePayer(e, a.prix);
  const [t, k] = id.split(':'), p = e.planete;
  if (t === 'amel') mdeAmel(e)[k]++;
  else if (t === 'classe') { e.classes[k] = true; e.classe = k; }
  else if (t === 'usine') e.usines[k] = (e.usines[k] || 0) + 1;
  else if (t === 'rech') e.recherche[k] = true;
  else if (t === 'module') e.station[k] = true;
  else if (t === 'base') e.bases[k] = true;
  else if (t === 'drone') { if (k === 'satellite') e.satellites[p] = (e.satellites[p] || 0) + 1; else if (k === 'reparateur') e.reparateur++; else e.drones[p][k]++; }
  else if (t === 'unite') e.flottes[p].push({ type: k });
  else if (t === 'reparer') delete e.hs[p];
  e.achats++;
  if (e.bases.mars && !e.aliens.debut) { e.aliens.debut = e.temps; e.aliens.prochaine = e.temps + MDE_VAGUES.premiere; }
  return true;
}
// retirer une unité d'une flotte (pour en mettre une autre) : rend la moitié de ses CR
function mdeRetirerUnite(e, p, i) { const u = e.flottes[p][i]; if (!u) return false; e.flottes[p].splice(i, 1); e.cr += Math.round(MDE_UNITES[u.type].prix.cr / 2); return true; }
// changer de classe au quai (parmi les classes achetées)
function mdeChangerClasse(e, k) { if (!e.classes[k]) return false; e.classe = k; return true; }
// voyager vers une autre planète (depuis le quai)
function mdeCoutVoyage(e, p) { const V = MDE_PLANETES[p].voyage; return V && p !== e.planete ? (p === 'terre' ? MDE_PLANETES[e.planete].voyage : V) : null; }
function mdePeutVoyager(e, p) { const P = MDE_PLANETES[p]; return p !== e.planete && (!P.req || P.req(e)) && (p !== 'mars' || e.bases.lune) && mdePeutPayer(e, mdeCoutVoyage(e, p)); }
function mdeVoyager(e, p) { if (!mdePeutVoyager(e, p)) return false; mdePayer(e, mdeCoutVoyage(e, p)); e.planete = p; return true; }

/* ---------- le temps qui passe (pendant qu'on joue seulement) ---------- */
// production des drones d'une planète, en minerai par minute
function mdeProduction(e, p) { if (!mdeABase(e, p) || e.hs[p]) return 0; const d = e.drones[p]; return Math.min(d.mineur * MDE_DRONE_MINEUR, d.cargo * MDE_DRONE_CARGO); }
// avance de dt secondes : drones (livrés au fil de l'eau), vagues aliens ; renvoie les événements
function mdeAvancer(e, dt) {
  e.temps += dt;
  const ev = { gain: 0 };
  for (const p in MDE_PLANETES) {
    const q = mdeProduction(e, p) * dt / 60; if (!q) continue;
    const r = e.reste[p] || (e.reste[p] = {}), lot = {};
    for (const [m, part] of Object.entries(MDE_PLANETES[p].ceinture)) { r[m] = (r[m] || 0) + q * part; const n = Math.floor(r[m]); if (n) { lot[m] = n; r[m] -= n; } }
    if (Object.keys(lot).length) ev.gain += mdeLivrer(e, lot).gain;
  }
  const A = e.aliens;
  if (A.prochaine !== null && !e.fin && !A.finale) {
    if (!A.alerte && e.temps >= A.prochaine) {
      const cible = mdeCibleVague(e);
      if (cible) { A.alerte = { planete: cible, a: e.temps + MDE_VAGUES.preavis(e.satellites[cible] || 0), vague: A.vague + 1 }; ev.alerte = A.alerte; }
      else A.prochaine = e.temps + 30;   // personne à attaquer pour l'instant : on attend
    }
    if (A.alerte && e.temps >= A.alerte.a) ev.attaque = A.alerte;
  }
  if (A.finaleApres !== null && e.temps >= A.finaleApres) A.finale = true;
  return ev;
}
// planète visée : une planète à base défendue (flotte) ou celle où est le joueur ; jamais une base sans défense pendant qu'on est loin
function mdeCibleVague(e) {
  const l = Object.keys(MDE_PLANETES).filter(p => mdeABase(e, p) && !e.hs[p] && (e.flottes[p].length || p === e.planete));
  return l.length ? l[Math.floor(mdeRng(e.graine, 'cible', e.aliens.vague)() * l.length)] : null;
}
// composition d'une vague (budget en points)
function mdeVague(e, n, budget) {
  const R = mdeRng(e.graine, 'vague', n), l = [];
  let b = budget === undefined ? MDE_VAGUES.budget(n) : budget;
  while (b >= MDE_ALIENS.rodeur.cout) {
    const poss = ['rodeur', 'chasseur', 'croiseur'].filter(k => MDE_ALIENS[k].cout <= b && (k !== 'croiseur' || n >= 5) && (k !== 'chasseur' || n >= 2));
    const k = poss[Math.floor(R() * poss.length)]; l.push(k); b -= MDE_ALIENS[k].cout;
  }
  return l;
}

/* ---------- les combats sans le joueur aux commandes (« auto battler ») ---------- */
// jeu calme : une unité abattue n'est pas perdue (remorquée et réparée après le combat) ; perdre met la base
// hors service (plus de drones ni de flotte achetable) jusqu'à sa réparation
// camp : [{type, pv, att, soin?}] ; la flotte arrive après `retard` secondes ; avant, les aliens tirent sur la base
// corvette : stats de mdeCorvette si le joueur est là (il est remorqué, pas détruit, à zéro PV)
function mdeUniteCombat(e, u) { const D = MDE_UNITES[u.type]; return { type: u.type, pv: Math.round(D.pv * (e.recherche.blindage ? 1.3 : 1)), att: D.att, soin: D.soin || 0 }; }
function mdeCorvetteCombat(c) { return { type: 'corvette', pv: c.coque * 5, att: c.tourelles * c.degats * 0.9, soin: 0 }; }
function mdeCombat(graine, usage, defense, aliens, opts) {
  opts = opts || {};
  const R = mdeRng(graine, usage), retard = opts.retard || 0;
  const D = defense.map(u => Object.assign({}, u, { max: u.pv })), A = aliens.map(k => ({ type: k, pv: MDE_ALIENS[k].pv, att: MDE_ALIENS[k].att, cibles: MDE_ALIENS[k].cibles || 1 }));
  let base = opts.base === undefined ? MDE_VAGUES.base : opts.base, t = 0;
  const vivants = l => l.filter(u => u.pv > 0);
  while (t < 300 && vivants(A).length && (base > 0 || opts.sansBase)) {
    t++;
    if (opts.sansBase && !vivants(D).length) break;
    const d = vivants(D).filter(u => u.type === 'corvette' || t > retard), a = vivants(A);
    // la défense tire (sur l'alien le plus abîmé, sinon au hasard), puis les réparateurs soignent
    for (const u of d) { if (!u.att) continue; const v = vivants(A); if (!v.length) break; const c = v.reduce((m, x) => x.pv < m.pv ? x : m, v[Math.floor(R() * v.length)]); c.pv -= u.att; }
    for (const u of d) if (u.soin) { const v = d.filter(x => x !== u && x.pv > 0 && x.pv < x.max); if (v.length) { const c = v[Math.floor(R() * v.length)]; c.pv = Math.min(c.max, c.pv + u.soin); } }
    // les aliens tirent : sur la flotte présente, sinon sur la base (un siège : moitié moins vite)
    for (const u of a) for (let i = 0; i < u.cibles; i++) {
      const v = vivants(d);
      if (v.length) v[Math.floor(R() * v.length)].pv -= u.att / u.cibles; else base -= MDE_VAGUES.siege * u.att / u.cibles;
    }
  }
  return { victoire: !vivants(A).length, base: Math.max(0, Math.round(base)), restants: D.map(u => u.pv > 0), duree: t };
}
// une vague attaque : `corvette` = true si le joueur défend lui-même (dans le jeu, le vrai combat le remplace)
function mdeResoudreAttaque(e, corvette) {
  const al = e.aliens.alerte; if (!al) return null;
  const p = al.planete, F = e.flottes[p];
  const def = F.map(u => mdeUniteCombat(e, u)); if (corvette) def.push(mdeCorvetteCombat(mdeCorvette(e)));
  const r = mdeCombat(e.graine, 'attaque' + al.vague, def, mdeVague(e, al.vague), { retard: mdeRetard(e, p) });
  if (!r.victoire) e.hs[p] = true;   // les unités abattues sont remorquées et réparées : seule la base est mise hors service
  e.aliens.vague = al.vague; e.aliens.alerte = null;
  if (e.aliens.vague >= MDE_VAGUES.nombre) { e.aliens.prochaine = null; e.aliens.finaleApres = e.temps; }
  else e.aliens.prochaine = e.temps + MDE_VAGUES.intervalle;
  e.journal.push({ t: Math.round(e.temps), vague: al.vague, planete: p, victoire: r.victoire });
  return Object.assign(r, { planete: p, vague: al.vague });
}
// la grande bataille : le vaisseau-mère et sa flotte contre TOUTES les flottes du joueur réunies, et sa corvette
function mdeForceFlottes(e) { let f = 0; for (const p in e.flottes) for (const u of e.flottes[p]) { const s = mdeUniteCombat(e, u); f += s.pv * Math.max(s.att, 1); } return f; }
function mdeFinale(e) {
  if (!e.aliens.finale || e.fin) return null;
  const tous = [];
  for (const p in e.flottes) for (const u of e.flottes[p]) tous.push(mdeUniteCombat(e, u));
  tous.push(mdeCorvetteCombat(mdeCorvette(e)));
  const essai = e.journal.filter(j => j.finale).length;
  const r = mdeCombat(e.graine, 'finale' + essai, tous, ['mere'].concat(mdeVague(e, 99, MDE_FINALE.budget)), { sansBase: true });
  e.journal.push({ t: Math.round(e.temps), finale: true, victoire: r.victoire });
  if (r.victoire) e.fin = true; else { e.aliens.finale = false; e.aliens.finaleApres = e.temps + MDE_FINALE.attente; }
  return r;
}

/* =====================================================================
   NEBULA · les RÈGLES (logique pure, sans affichage ni stockage).
   Combat, IA des pirates, carte du secteur, comptoir, dock, score.
   Tout l'aléatoire passe par des générateurs à graine : même graine =
   même carte, mêmes combats. Le combat produit une liste d'événements
   (déplacement, tir, dégâts, explosion…) que l'affichage rejoue.
   - Dans la page : script classique chargé avant le script du jeu ; ses
     constantes et fonctions sont partagées avec lui (portée globale).
   - Dans Node : require('nebula/regles.js') (simulateur, tests).
   Cahier des charges : specs/nebula.md.
   ===================================================================== */
// @ts-check   (vérifié par tsc sans rien compiler : node outils/verifications.js)
'use strict';
/**
 * @typedef {{ name: string, dmg: number, rng: number, fx: string, big?: boolean, swarm?: boolean, min?: number, zone?: boolean, mark?: boolean }} Weapon
 * @typedef {{ name: string, n: number, hull: number, sh: number, spd: number, w: Weapon[], skill: string, sdesc: string, short?: string,
 *   price?: number, sprite?: string, temp?: boolean, foe?: boolean, ai?: string, turrets?: number, regen?: boolean,
 *   spawn?: { every: number, t: string, n: number } }} ShipType
 * @typedef {[number, number]} Cell
 * @typedef {{ k: string, name: string, vet?: number }} Pilot   un pilote (k : as, mecano, tireur, prudent, veteran ; vet : bonus du vétéran)
 * @typedef {{ t: string, mods?: string[], mult?: number, pilot?: Pilot | null }} Fit   un vaisseau, ses modules et son pilote (en combat ou dans la flotte)
 * @typedef {{ id: number, t: string, side: string, c: number, r: number, mods: string[], dead: boolean, moved: boolean, acted: boolean,
 *   rip: boolean, bay: number, from: { c: number, r: number } | null, hull: number, hmax: number, sh: number, shMax: number,
 *   mult?: number, fid?: number, name?: string, goal?: number, fired?: number, mark?: number, pilot?: Pilot | null }} Ship
 * @typedef {{ src: number, cell: Cell, dmg: number, fx: string, cross?: number, splash?: number, pack?: boolean, pull?: number }} Intent
 * @typedef {{ seed: number, kind: string, floor: number, sector: number, ai?: number, turn: number, ships: Ship[], rocks: Cell[],
 *   intents: Intent[], kills: number, next: number, result: string | null, log: any[], ions?: Cell[], fog?: Cell[], label?: string }} Combat
 * @typedef {{ e: string, [k: string]: any }} Ev   événement rejoué par l'affichage
 * @typedef {{ c: number, r: number, d: number, prev: string | null, through?: boolean }} Step   position atteignable
 * @typedef {{ uid: number, t: string, name: string, mods: string[], hull: number, pilot?: Pilot | null }} FleetShip
 * @typedef {{ id: number, k: string, f: number, i: number, x: number, y: number, links: number[] }} MapNode
 * @typedef {{ name: string, boss: string, shop: string, rocks: number[], ions: number[], fog: number, mult: number, extra: number, ai: number, aiHeavy?: number,
 *   pool: { early: string[], mid: string[], lourd: (string | string[])[], escort: string[] } }} Sector
 * @typedef {{ frac: number, stay: number, kill: number, iso: number, hurt: number, risk: number, near: number, block: boolean, refine: boolean }} AiLevel
 */
const COLS = 7, ROWS = 9;
// générateur à graine mulberry32 (le même que NebulaVaisseaux.rnd : ne pas le modifier, les graines en dépendent)
function rng(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const seedOf = (...a) => { let h = 2166136261; for (const x of a) { h = Math.imul(h ^ (x | 0), 16777619); h ^= h >>> 13; } return h >>> 0; };
const pick = (R, a) => a[Math.floor(R() * a.length)];
const shuffle = (R, a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- vaisseaux ---------- */
// short : la capacité en une ligne (fiche de combat, hangar) ; sdesc : en entier (comptoir, fiches des pirates)
/** @type {Record<string, ShipType>} */
const TYPES = {
  chasseur: { name: 'CHASSEUR', n: 1, hull: 6, sh: 1, spd: 4, w: [{ name: 'CANONS', dmg: 2, rng: 3, fx: 'canon' }], skill: 'RIPOSTE', short: 'tire 1 sur un pirate qui arrive à 2 cases', sdesc: 'tire 1 dégât sur un pirate qui finit son déplacement à 2 cases ou moins (une fois par tour).', price: 80 },
  fregate: { name: 'FRÉGATE', n: 2, hull: 10, sh: 2, spd: 3, w: [{ name: 'LASER', dmg: 3, rng: 3, fx: 'laser' }, { name: 'MISSILE', dmg: 2, rng: 5, fx: 'missile' }], skill: 'DOUBLE ARMEMENT', short: 'laser ou missile, au choix à chaque tour', sdesc: 'laser précis ou missile à longue portée, au choix à chaque tour.', price: 120 },
  mere: { name: 'PORTE-VAISSEAUX', n: 3, hull: 16, sh: 3, spd: 1, w: [{ name: 'CANONS', dmg: 2, rng: 3, fx: 'canon' }], skill: 'BAIES', short: 'lance un chasseur ou 3 drones tous les 2 tours', sdesc: 'tous les 2 tours, lance un chasseur léger ou 3 drones (2 en jeu au plus).', price: 0 },
  bombardier: { name: 'BOMBARDIER', n: 1, hull: 6, sh: 0, spd: 2, w: [{ name: 'TORPILLES', dmg: 3, rng: 2, fx: 'torpille', big: true }], skill: 'TORPILLES LOURDES', short: 'dégâts ×2 contre les vaisseaux de 2 et 3 cases', sdesc: 'dégâts doublés contre les vaisseaux de 2 et 3 cases.', price: 90 },
  drones: { name: 'NUÉE DE DRONES', n: 1, hull: 5, sh: 0, spd: 4, w: [{ name: 'ESSAIM', dmg: 2, rng: 1, fx: 'essaim', swarm: true }], skill: 'ESSAIM', short: 'frappe tous les pirates collés à la nuée', sdesc: '2 dégâts à chaque pirate sur les 8 cases autour (1 s\'il reste 2 drones ou moins).', price: 85 },
  egide: { name: 'ÉGIDE', n: 2, hull: 10, sh: 4, spd: 2, w: [{ name: 'CANON', dmg: 1, rng: 2, fx: 'canon' }], skill: 'BULLE', short: '+1 bouclier aux alliés voisins à chaque tour', sdesc: 'en début de tour, +1 bouclier aux alliés voisins (jusqu\'à 1 au-dessus de leur maximum).', price: 110 },
  eclaireur: { name: 'ÉCLAIREUR', n: 1, hull: 3, sh: 0, spd: 5, w: [{ name: 'CANON', dmg: 1, rng: 4, fx: 'canon', mark: true }], skill: 'MARQUAGE', short: 'le pirate touché prend +1 à chacun de tes tirs ce tour', sdesc: 'le pirate qu\'il touche subit +1 dégât de chacun de tes tirs jusqu\'à la fin du tour.', price: 70 },
  convoyeur: { name: 'CONVOYEUR', n: 2, hull: 8, sh: 1, spd: 2, w: [], skill: 'SOUTE', short: '+50 % de crédits et de carburant gagnés', sdesc: '+50 % de crédits et de carburant gagnés tant qu\'il est en vie ; s\'il est détruit, la flotte perd 20 crédits.', price: 90 },
  artilleur: { name: 'ARTILLEUR', n: 2, hull: 7, sh: 1, spd: 2, w: [{ name: 'SALVE', dmg: 2, rng: 6, min: 3, fx: 'missile', zone: true }], skill: 'TIR INDIRECT', short: 'salve 2×2 de 3 à 6 cases, ignore les astéroïdes', sdesc: 'salve de 2 dégâts sur une zone de 2×2 cases, de 3 à 6 cases de distance, par-dessus les astéroïdes (pas plus près).', price: 120 },
  cuirasse: { name: 'CUIRASSÉ', n: 3, hull: 16, sh: 2, spd: 1, w: [{ name: 'TOURELLES', dmg: 3, rng: 4, fx: 'canon' }], turrets: 2, skill: 'BORDÉE', short: '2 tirs par tour, sur la même cible ou sur deux', sdesc: 'ses deux tourelles tirent chacune une fois par tour, sur la même cible ou sur deux cibles différentes.', price: 150 },
  atelier: { name: 'ATELIER MOBILE', n: 3, hull: 14, sh: 2, spd: 1, w: [], skill: 'RÉPARATION', short: '+2 coque aux alliés collés par tour, +3 à tous après combat', sdesc: 'en début de tour, +2 coque aux alliés collés ; après chaque combat, +3 coque à toute la flotte.', price: 140 },
  leger: { name: 'CHASSEUR LÉGER', sprite: 'chasseur', n: 1, hull: 3, sh: 0, spd: 4, w: [{ name: 'CANONS', dmg: 2, rng: 3, fx: 'canon' }], temp: true, skill: 'ESCADRILLE', short: 'lancé par le porte-vaisseaux, part après le combat', sdesc: 'lancé par le porte-vaisseaux, disparaît après le combat.' },
  essaim: { name: 'DRONES', sprite: 'drones', n: 1, hull: 3, sh: 0, spd: 4, w: [{ name: 'ESSAIM', dmg: 2, rng: 1, fx: 'essaim', swarm: true }], temp: true, skill: 'ESSAIM', short: 'frappe les pirates collés ; partent après le combat', sdesc: 'lancés par le porte-vaisseaux, disparaissent après le combat.' },
  // pirates
  intercepteur: { name: 'INTERCEPTEUR', n: 1, hull: 4, sh: 0, spd: 4, w: [{ name: 'CANON', dmg: 2, rng: 3, fx: 'canon' }], foe: true, ai: 'near', skill: 'MEUTE', sdesc: '+1 dégât s\'il est collé à un autre intercepteur. Vise le plus proche.' },
  brulot: { name: 'BRÛLOT', n: 1, hull: 3, sh: 0, spd: 4, w: [], foe: true, ai: 'brulot', skill: 'CHARGE', sdesc: 'fonce sur ton plus gros vaisseau et explose au contact : 5 dégâts, 2 autour. Détruit avant : 2 dégâts autour.' },
  croiseur: { name: 'CROISEUR PIRATE', n: 2, hull: 10, sh: 2, spd: 2, w: [{ name: 'TORPILLE', dmg: 4, rng: 6, fx: 'torpille' }], foe: true, ai: 'big', skill: 'TORPILLE', sdesc: 'longue portée, 2 dégâts sur les 4 cases voisines ; vise d\'abord les vaisseaux de 3 cases, puis de 2.' },
  harponneur: { name: 'HARPONNEUR', n: 2, hull: 10, sh: 1, spd: 2, w: [{ name: 'CANON', dmg: 2, rng: 2, fx: 'canon' }], foe: true, ai: 'harpon', skill: 'GRAPPIN', sdesc: 'à 3 cases ou moins, attire un vaisseau de 1 case de 2 cases vers lui au lieu de tirer (tu le vois venir : case marquée GRAPPIN).' },
  amiral: { name: 'AMIRAL ROUILLÉ', n: 3, hull: 30, sh: 3, spd: 1, w: [{ name: 'TOURELLES', dmg: 3, rng: 4, fx: 'canon' }], foe: true, ai: 'amiral', turrets: 3, spawn: { every: 3, t: 'intercepteur', n: 2 }, skill: 'RENFORTS', sdesc: '3 tourelles sur 3 cibles (2 dégâts autour de chaque case visée) ; tous les 3 tours, appelle 2 intercepteurs.' },
};
// amiraux des secteurs 2 et 3
Object.assign(TYPES, {
  veuve: { name: 'VEUVE D\'ORPHÉE', n: 3, hull: 32, sh: 3, spd: 1, w: [{ name: 'CANONS', dmg: 3, rng: 4, fx: 'canon' }], foe: true, ai: 'amiral', turrets: 2, spawn: { every: 3, t: 'brulot', n: 2 }, skill: 'COUVÉE', sdesc: '2 tourelles (2 dégâts autour de chaque case visée) ; tous les 3 tours, lâche 2 brûlots.' },
  reine: { name: 'ROUILLE-REINE', n: 3, hull: 32, sh: 3, spd: 1, w: [{ name: 'TOURELLES', dmg: 3, rng: 4, fx: 'canon' }], foe: true, ai: 'amiral', turrets: 3, regen: true, spawn: { every: 3, t: 'intercepteur', n: 2 }, skill: 'BOUCLIER RÉGÉNÉRANT', sdesc: '3 tourelles ; son bouclier se recharge en entier à chaque tour (frappe-la fort en un seul tour) ; tous les 3 tours, 2 intercepteurs.' },
});
const sprite = t => (TYPES[t] && TYPES[t].sprite) || t;
// réglages issus du simulateur : sans tirs de zone, un joueur attentif esquivait tout
const TUNE = { cross: { croiseur: 2, amiral: 2, veuve: 2, reine: 2 } };   // dégâts sur les 4 cases voisines de la case visée
const MODS = {
  blindage: { name: 'BLINDAGE', desc: '+3 coque', long: '+3 points de coque maximum (et 3 tout de suite).', price: 50 },
  bouclier: { name: 'BOUCLIER+', desc: '+1 bouclier', long: '+1 point de bouclier maximum, rechargé chaque tour.', price: 60 },
  propulseurs: { name: 'PROPULSEURS', desc: '+1 vitesse', long: '+1 case de déplacement par tour.', price: 55 },
  ciblage: { name: 'CIBLAGE', desc: '+1 portée', long: "+1 case de portée pour les armes (sauf l'essaim).", price: 45 },
  canons: { name: 'CANONS MK2', desc: '+1 dégât', long: '+1 dégât à chaque tir (essaim compris).', price: 75 },
};
const MOD_IDS = Object.keys(MODS);
const NAMES = ['ARCHE', 'AURORE', 'PIQUE', 'VESPER', 'ORION', 'SIRIUS', 'ÉCLAT', 'BORÉE', 'ALTAÏR', 'COMÈTE', 'ZÉPHYR', 'ANTARÈS', 'VÉGA', 'HÉLIOS', 'NOVA', 'CASSINI'];
const nMod = (s, m) => (s.mods || []).filter(x => x === m).length;
const slotsOf = t => TYPES[t].n === 1 ? 2 : 3;
/* ---------- pilotes (un par vaisseau, recrutés au comptoir ou dans les épaves) ---------- */
const PILOTS = {
  as: { name: 'AS', desc: '+1 vitesse' },
  mecano: { name: 'MÉCANO', desc: '+1 coque à chaque tour' },
  tireur: { name: 'TIREUR', desc: '+1 dégât à chaque tir' },
  prudent: { name: 'PRUDENT', desc: '+1 bouclier' },
  veteran: { name: 'VÉTÉRAN', desc: '+1 coque max par combat gagné (jusqu\'à +4)' },
};
const PILOT_IDS = Object.keys(PILOTS);
const PILOT_NAMES = ['LINA', 'MARCO', 'SÉLÈNE', 'YUKI', 'TOMAS', 'INÈS', 'KOFI', 'ANYA', 'RAFA', 'NOOR', 'ELIO', 'MAÏ', 'OSKAR', 'ZÉLIE'];
/** @param {Fit} s @param {string} k */
const hasPilot = (s, k) => !!(s.pilot && s.pilot.k === k);
/** @param {Fit} s */
const maxHullOf = s => Math.round(TYPES[s.t].hull * (s.mult || 1)) + 3 * nMod(s, 'blindage') + (hasPilot(s, 'veteran') ? s.pilot.vet || 0 : 0);
/** @param {Fit} s */
const shMaxOf = s => TYPES[s.t].sh + nMod(s, 'bouclier') + (hasPilot(s, 'prudent') ? 1 : 0);
/** @param {Fit} s */
const spdOf = s => TYPES[s.t].spd + nMod(s, 'propulseurs') + (hasPilot(s, 'as') ? 1 : 0);
/** @param {Fit} s @param {Weapon} w */
const wDmg = (s, w) => w.dmg + nMod(s, 'canons') + (hasPilot(s, 'tireur') ? 1 : 0);
const wRng = (s, w) => w.swarm ? 1 : w.rng + nMod(s, 'ciblage');

/* ---------- géométrie de la grille ---------- */
/** @param {{ t: string, c: number, r: number }} s @returns {Cell[]} */
const cellsOf = s => footprint(s.c, s.r, TYPES[s.t].n);
/** @param {number} c @param {number} r @param {number} n @returns {Cell[]} */
const footprint = (c, r, n) => { /** @type {Cell[]} */ const o = []; for (let i = 0; i < n; i++) o.push(/** @type {Cell} */ ([c, r + i])); return o; };
const lenOf = s => TYPES[s.t].n;
// distance de Tchebychev entre les cases les plus proches de deux emprises verticales
function gap(c1, r1, n1, c2, r2, n2) { return Math.max(Math.abs(c1 - c2), Math.max(0, r2 - (r1 + n1 - 1), r1 - (r2 + n2 - 1))); }
const dist = (a, b) => gap(a.c, a.r, lenOf(a), b.c, b.r, lenOf(b));
const alive = st => st.ships.filter(s => !s.dead);
const sideOf = (st, side) => st.ships.filter(s => !s.dead && s.side === side);
const byId = (st, id) => st.ships.find(s => s.id === id);
const rockAt = (st, c, r) => st.rocks.some(k => k[0] === c && k[1] === r);
const inGrid = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
function occupant(st, c, r, except) { for (const s of st.ships) if (!s.dead && s !== except && s.c === c && r >= s.r && r < s.r + lenOf(s)) return s; return null; }
// ligne de vue : un astéroïde entre deux cases bloque les tirs directs
function clearLine(st, a, b) {
  const [ax, ay] = [a[0] + .5, a[1] + .5], [bx, by] = [b[0] + .5, b[1] + .5], n = Math.ceil(Math.hypot(bx - ax, by - ay) * 8);
  for (let i = 1; i < n; i++) {
    const t = i / n, c = Math.floor(ax + (bx - ax) * t), r = Math.floor(ay + (by - ay) * t);
    if ((c === a[0] && r === a[1]) || (c === b[0] && r === b[1])) continue;
    if (rockAt(st, c, r)) return false;
  }
  return true;
}
function los(st, cellsA, cellsB) { for (const a of cellsA) for (const b of cellsB) if (clearLine(st, a, b)) return true; return false; }
// la case de la cible la plus proche du tireur (cases d'emprise passées en argument)
/** @param {{ c: number, r: number }} from @param {number} n @param {Ship} target @returns {Cell} */
function nearestCell(from, n, target) {
  /** @type {Cell} */ let best = null;
  let bd = 1e9;
  for (const [c, r] of cellsOf(target)) { const d = gap(from.c, from.r, n, c, r, 1) * 10 + Math.abs(c - from.c); if (d < bd) { bd = d; best = [c, r]; } }
  return best;
}
// positions atteignables (case du haut de l'emprise) : on passe à travers ses alliés, pas à travers l'ennemi ni les astéroïdes
/** @param {Combat} st @param {Ship} s @returns {Map<string, Step>} */
function reachable(st, s, spd = spdOf(s)) {
  /** @type {Map<string, Step>} */ const out = new Map();
  const n = lenOf(s), key = (c, r) => c + ',' + r, q = [[s.c, s.r]]; out.set(key(s.c, s.r), { c: s.c, r: s.r, d: 0, prev: null });
  const pass = (c, r) => { for (let i = 0; i < n; i++) { if (!inGrid(c, r + i) || rockAt(st, c, r + i)) return false; const o = occupant(st, c, r + i, s); if (o && o.side !== s.side) return false; } return true; };
  while (q.length) {
    const [c, r] = q.shift(), cur = out.get(key(c, r)); if (cur.d >= spd) continue;
    for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nc = c + dc, nr = r + dr, k = key(nc, nr); if (out.has(k) || !pass(nc, nr)) continue;
      out.set(k, { c: nc, r: nr, d: cur.d + 1, prev: key(c, r) }); q.push([nc, nr]);
    }
  }
  // on ne s'arrête que sur des cases libres
  for (const [k, p] of out) { if (p.d === 0) continue; for (let i = 0; i < n; i++) if (occupant(st, p.c, p.r + i, s)) { p.through = true; break; } }
  return out;
}
const ends = reach => [...reach.values()].filter(p => !p.through);
/** @returns {Cell[]} */
function pathTo(reach, c, r) { /** @type {Cell[]} */ const o = []; let k = c + ',' + r; while (k) { const p = reach.get(k); o.unshift(/** @type {Cell} */ ([p.c, p.r])); k = p.prev; } return o; }
// peut-on tirer depuis (c, r) sur la cible avec cette arme ?
function canHit(st, s, w, c, r, target) {
  const n = lenOf(s), d = gap(c, r, n, target.c, target.r, lenOf(target));
  if (d > wRng(s, w) || (w.min && d < w.min)) return false;
  if (w.swarm) return d <= 1;
  if (d > 2 && s.t !== 'eclaireur' && cellsOf(target).every(([x, y]) => fogAt(st, x, y))) return false;   // caché dans la nébuleuse
  if (w.zone) return true;   // tir indirect : par-dessus les astéroïdes
  const mine = []; for (let i = 0; i < n; i++) mine.push([c, r + i]);
  return los(st, mine, cellsOf(target));
}

/* ---------- dégâts ---------- */
function damage(st, s, amount, ev, byPlayer) {
  if (s.dead || amount <= 0) return;
  const abs = Math.min(s.sh, amount); s.sh -= abs; const h = amount - abs; s.hull = Math.max(0, s.hull - h);
  ev.push({ e: 'dmg', id: s.id, n: amount, sh: abs, hull: h });
  if (s.hull <= 0) kill(st, s, ev, byPlayer);
}
function kill(st, s, ev, byPlayer, silent) {
  s.dead = true; ev.push({ e: 'boom', id: s.id, big: lenOf(s) });
  if (s.side === 'E' && byPlayer && !silent) st.kills++;
  // un brûlot détruit avant d'arriver explose sur place
  if (s.t === 'brulot' && !silent) blast(st, s.c, s.r, 0, 2, ev, byPlayer, s);
}
// explosion : `main` dégâts sur la case, `around` sur les 8 cases autour
function blast(st, c, r, main, around, ev, byPlayer, src) {
  ev.push({ e: 'blast', c, r, big: main > 0 });
  const hit = new Set(), center = occupant(st, c, r, src);
  if (center && main) { hit.add(center); damage(st, center, main, ev, byPlayer); }
  for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
    if (!dc && !dr) continue; const o = occupant(st, c + dc, r + dr, src);
    if (o && !hit.has(o) && o !== center) { hit.add(o); damage(st, o, around, ev, byPlayer); }
  }
}

/* ---------- création d'un combat ---------- */
// ai : niveau de l'IA des pirates (0 = IA simple de la session 1, 1 et 2 = IA par score, voir AI_LEVELS) ;
// aiHeavy : niveau pour les contacts lourds, s'il est différent
// rocks, ions : nombre d'astéroïdes et de nuages ioniques (min, max) ; fog : chance d'une nébuleuse dans un combat ;
// mult : coque des pirates ; extra : intercepteurs en plus ; pool : pirates tirés au sort (contacts des étages 1-2,
// des étages 3 et plus, contacts lourds case par case, escorte de l'amiral)
/** @type {Sector[]} */
const SECTORS = [
  { name: 'CEINTURE DE KARN', boss: 'amiral', shop: 'MARCHÉ LIBRE DE KARN', rocks: [3, 5], ions: [0, 0], fog: 0, mult: 1.5, extra: 1, ai: 0, aiHeavy: 1,
    pool: { early: ['intercepteur', 'intercepteur', 'brulot'], mid: ['intercepteur', 'intercepteur', 'brulot', 'croiseur'], lourd: ['croiseur', ['croiseur', 'intercepteur'], 'intercepteur', ['intercepteur', 'brulot']], escort: ['intercepteur', 'intercepteur'] } },
  { name: 'NÉBULEUSE D\'ORPHÉE', boss: 'veuve', shop: 'COMPTOIR D\'ORPHÉE', rocks: [1, 2], ions: [2, 3], fog: 1, mult: 1.6, extra: 2, ai: 1,
    pool: { early: ['intercepteur', 'intercepteur', 'brulot', 'harponneur'], mid: ['intercepteur', 'brulot', 'harponneur', 'croiseur'], lourd: ['croiseur', ['harponneur', 'croiseur'], 'intercepteur', ['brulot', 'harponneur']], escort: ['harponneur', 'intercepteur'] } },
  { name: 'LE SEUIL', boss: 'reine', shop: 'DERNIER COMPTOIR', rocks: [2, 3], ions: [1, 2], fog: .5, mult: 1.8, extra: 2, ai: 2,
    pool: { early: ['intercepteur', 'brulot', 'harponneur', 'croiseur'], mid: ['intercepteur', 'brulot', 'harponneur', 'croiseur'], lourd: ['croiseur', ['croiseur', 'harponneur'], 'harponneur', ['intercepteur', 'brulot']], escort: ['croiseur', 'intercepteur'] } },
];
// terrain : nuages ioniques et nébuleuse
const inCells = (cells, c, r) => !!cells && cells.some(k => k[0] === c && k[1] === r);
const ionAt = (st, c, r) => inCells(st.ions, c, r);
const fogAt = (st, c, r) => inCells(st.fog, c, r);
const inIons = (st, s) => cellsOf(s).some(([c, r]) => ionAt(st, c, r));
/** @param {Combat} st @param {string} t @param {string} side @param {number} c @param {number} r @returns {Ship} */
function makeShip(st, t, side, c, r, o = {}) {
  const s = /** @type {Ship} */ (Object.assign({ id: st.next++, t, side, c, r, mods: [], dead: false, moved: false, acted: false, rip: false, bay: 0, from: null }, o));
  if (s.hull == null) s.hull = maxHullOf(s);
  s.hmax = maxHullOf(s); s.shMax = shMaxOf(s); s.sh = s.shMax;
  st.ships.push(s); return s;
}
function pirateList(R, kind, floor, sector) {
  const S = SECTORS[sector - 1] || SECTORS[0];
  if (kind === 'amiral') return [S.boss, ...S.pool.escort];
  let list;
  if (kind === 'lourd') list = S.pool.lourd.map(x => typeof x === 'string' ? x : pick(R, x));
  else {
    const n = floor <= 2 ? 2 : floor <= 4 ? 3 : 3 + (R() < .5 ? 1 : 0);
    list = []; for (let i = 0; i < n; i++) list.push(pick(R, floor <= 2 ? S.pool.early : S.pool.mid));
    // un seul gros pirate (2 cases) par contact
    let big = 0; list = list.map(t => TYPES[t].n > 1 && big++ ? 'intercepteur' : t);
  }
  for (let i = 0; i < S.extra; i++) list.push('intercepteur');
  return list;
}
/** @param {number} seed @param {string} kind @param {number} floor @param {FleetShip[]} fleet @param {number} [sector] @returns {Combat} */
function makeCombat(seed, kind, floor, fleet, sector = 1, /** @type {{ ai?: number, fog?: boolean, label?: string }} */ o = {}) {
  const R = rng(seed), S = SECTORS[sector - 1] || SECTORS[0];
  const ai = o.ai != null ? o.ai : kind === 'lourd' && S.aiHeavy != null ? S.aiHeavy : S.ai;
  /** @type {Combat} */
  const st = { seed, kind, floor, sector, ai, label: o.label, turn: 0, ships: [], rocks: [], intents: [], kills: 0, next: 1, result: null, log: [] };
  // astéroïdes au milieu de la grille
  const nr = S.rocks[0] + Math.floor(R() * (S.rocks[1] - S.rocks[0] + 1)) - (kind === 'amiral' ? 1 : 0);
  while (st.rocks.length < nr) { const c = Math.floor(R() * COLS), r = 3 + Math.floor(R() * 3); if (!rockAt(st, c, r)) st.rocks.push([c, r]); }
  // nuages ioniques (1 ou 2 cases) et nébuleuse (3 × 2 cases), au milieu de la grille
  if (S.ions[1]) {
    st.ions = []; const k = S.ions[0] + Math.floor(R() * (S.ions[1] - S.ions[0] + 1));
    for (let i = 0; i < k; i++) for (let t = 0; t < 20; t++) {
      const c = Math.floor(R() * COLS), r = 2 + Math.floor(R() * 5), c2 = c + (R() < .5 ? 1 : -1), two = R() < .5 && inGrid(c2, r);
      if (rockAt(st, c, r) || ionAt(st, c, r)) continue;
      st.ions.push([c, r]); if (two && !rockAt(st, c2, r) && !ionAt(st, c2, r)) st.ions.push([c2, r]); break;
    }
  }
  if (o.fog || (S.fog && R() < S.fog)) {
    const c0 = Math.floor(R() * (COLS - 2)), r0 = 2 + Math.floor(R() * 3); st.fog = [];
    for (let dc = 0; dc < 3; dc++) for (let dr = 0; dr < 2; dr++) if (!rockAt(st, c0 + dc, r0 + dr)) st.fog.push([c0 + dc, r0 + dr]);
  }
  // pirates en haut
  for (const t of pirateList(R, kind, floor, sector)) {
    const n = TYPES[t].n;
    for (let k = 0; k < 60; k++) {
      const c = t === 'amiral' ? 3 : Math.floor(R() * COLS), r = n === 3 ? 0 : Math.floor(R() * (4 - n));
      let ok = true; for (let i = 0; i < n; i++) if (occupant(st, c, r + i) || rockAt(st, c, r + i)) ok = false;
      if (ok) { makeShip(st, t, 'E', c, r, { mult: S.mult }); break; }
    }
  }
  // la flotte en bas, les plus gros d'abord
  const order = [3, 1, 5, 2, 4, 0, 6];
  fleet.slice().sort((a, b) => TYPES[b.t].n - TYPES[a.t].n).forEach(f => {
    const n = TYPES[f.t].n, r = n === 1 ? 7 : 6;
    const c = order.find(c => ![0, 1, 2].some(i => i < n && (occupant(st, c, r + i) || rockAt(st, c, r + i))));
    if (c != null) makeShip(st, f.t, 'P', c, r, { fid: f.uid, name: f.name, mods: f.mods.slice(), hull: f.hull, pilot: f.pilot || null });
  });
  startTurn(st, []);
  return st;
}

/* ---------- déroulement d'un tour ---------- */
function startTurn(st, ev) {
  st.turn++;
  ev.push({ e: 'turn', n: st.turn });
  if (st.turn > 1) for (const s of alive(st)) if (s.sh < s.shMax) { s.sh = TYPES[s.t].regen ? s.shMax : s.sh + 1; }
  for (const s of sideOf(st, 'P')) {
    s.moved = s.acted = s.rip = false; s.from = null; s.fired = 0; if (s.bay > 0) s.bay--;
    if (hasPilot(s, 'mecano') && s.hull < s.hmax && st.turn > 1) { s.hull++; ev.push({ e: 'heal', id: s.id, n: 1 }); }
    if (s.t === 'atelier') for (const o of sideOf(st, 'P')) if (o !== s && dist(o, s) === 1 && o.hull < o.hmax) { const k = Math.min(2, o.hmax - o.hull); o.hull += k; ev.push({ e: 'heal', id: o.id, n: k }); }
    if (s.t === 'egide') for (const o of sideOf(st, 'P')) if (o !== s && dist(o, s) === 1 && o.sh < o.shMax + 1) { o.sh++; ev.push({ e: 'shield', id: o.id }); }
  }
  for (const s of sideOf(st, 'E')) s.rip = false;
  // renforts des amiraux (par le haut de la grille, à côté de l'amiral)
  for (const boss of sideOf(st, 'E').filter(s => TYPES[s.t].spawn)) {
    const sp = TYPES[boss.t].spawn, len = TYPES[sp.t].n; if (st.turn % sp.every) continue;
    let n = 0; for (const c of [boss.c - 1, boss.c + 1, boss.c - 2, boss.c + 2, boss.c - 3, boss.c + 3]) {
      if (n >= sp.n || !inGrid(c, 0) || footprint(c, 0, len).some(([x, y]) => occupant(st, x, y) || rockAt(st, x, y))) continue;
      const s = makeShip(st, sp.t, 'E', c, 0, { mult: boss.mult }); ev.push({ e: 'spawn', id: s.id }); n++;
    }
  }
  planPirates(st, ev);
  checkEnd(st);
}
function targetOrder(st, p) {
  const T = sideOf(st, 'P'), ai = TYPES[p.t].ai;
  if (ai === 'brulot' || ai === 'big') return T.sort((a, b) => lenOf(b) - lenOf(a) || dist(p, a) - dist(p, b) || a.id - b.id);
  return T.sort((a, b) => dist(p, a) - dist(p, b) || a.id - b.id);
}
// IA des pirates : ils se déplacent tout de suite, puis annoncent leurs tirs (sur une CASE)
/** @param {Combat} st @param {Ev[]} ev */
function planPirates(st, ev) {
  if (st.ai && AI_LEVELS[st.ai]) { planScored(st, ev, AI_LEVELS[st.ai]); return; }
  // niveau 0 (secteur 1) : chaque pirate choisit sa cible selon sa règle, s'approche et tire sur la case la plus proche
  st.intents = [];
  const pirates = sideOf(st, 'E').sort((a, b) => a.id - b.id);
  for (const p of pirates) {
    if (p.dead || !sideOf(st, 'P').length) continue;
    const reach = reachable(st, p), E = ends(reach), order = targetOrder(st, p), ai = TYPES[p.t].ai, w = TYPES[p.t].w[0];
    /** @type {{ pos: Step, key: number } | null} */ let best = null;
    const better = (pos, key) => { if (!best || key < best.key) best = { pos, key }; };
    if (ai === 'brulot') {
      const T = order[0];
      for (const pos of E) { const d = gap(pos.c, pos.r, 1, T.c, T.r, lenOf(T)); better(pos, (d <= 1 ? 0 : d * 100) + pos.d); }
      p.goal = T.id;
    } else if (ai === 'amiral') {
      for (const pos of E) { const k = order.filter(T => canHit(st, p, w, pos.c, pos.r, T)).length; better(pos, -k * 100 + pos.d); }
    } else {
      for (const T of order) {
        for (const pos of E) if (canHit(st, p, w, pos.c, pos.r, T)) better(pos, pos.d * 10 - gap(pos.c, pos.r, lenOf(p), T.c, T.r, lenOf(T)));
        if (best) { p.goal = T.id; break; }
      }
      if (!best) { const T = order[0]; p.goal = T.id; for (const pos of E) better(pos, gap(pos.c, pos.r, lenOf(p), T.c, T.r, lenOf(T)) * 100 + pos.d); }
    }
    if (best && (best.pos.c !== p.c || best.pos.r !== p.r)) {
      ev.push({ e: 'move', id: p.id, path: pathTo(reach, best.pos.c, best.pos.r) }); p.c = best.pos.c; p.r = best.pos.r;
    }
    riposte(st, p, ev);
  }
  // annonces, une fois tout le monde en place
  for (const p of sideOf(st, 'E').sort((a, b) => a.id - b.id)) {
    const ai = TYPES[p.t].ai, w = TYPES[p.t].w[0], n = lenOf(p);
    if (ai === 'brulot') {
      const T = byId(st, p.goal); if (T && !T.dead && dist(p, T) <= 1) st.intents.push({ src: p.id, cell: nearestCell(p, n, T), dmg: 5, splash: 2, fx: 'charge' });
    } else if (ai === 'harpon' && grappleIntent(st, p)) {
      st.intents.push(grappleIntent(st, p));
    } else if (ai === 'amiral') {
      targetOrder(st, p).filter(T => canHit(st, p, w, p.c, p.r, T)).slice(0, TYPES[p.t].turrets)
        .forEach(T => st.intents.push({ src: p.id, cell: nearestCell(p, n, T), dmg: wDmg(p, w), fx: w.fx, cross: TUNE.cross[p.t] || 0 }));
    } else {
      let T = byId(st, p.goal);
      if (!T || T.dead || !canHit(st, p, w, p.c, p.r, T)) T = targetOrder(st, p).find(o => canHit(st, p, w, p.c, p.r, o));
      if (!T) continue;
      const pack = TYPES[p.t].skill === 'MEUTE' && sideOf(st, 'E').some(o => o !== p && o.t === 'intercepteur' && dist(o, p) === 1);
      st.intents.push({ src: p.id, cell: nearestCell(p, n, T), dmg: wDmg(p, w) + (pack ? 1 : 0), fx: w.fx, pack, cross: TUNE.cross[p.t] || 0 });
    }
  }
}
/* ---------- IA des pirates par score (niveaux 1 et 2) ----------
   Le joueur esquive : pour chacun de ses vaisseaux, on regarde toutes les positions où il
   pourrait se replier ce tour-ci (« positions de repli ») et on suppose qu'il prendra la
   moins touchée. Chaque pirate, à son tour, note chaque case d'arrivée et chaque case visée :
   - dégâts que le vaisseau ne pourra PAS éviter (le minimum sur ses positions de repli,
     en comptant les tirs déjà annoncés par les autres pirates : tirs croisés) ;
   - prime s'il ne peut plus échapper à la destruction (kill) ;
   - part des positions de repli couvertes (frac) : moins d'options pour le joueur ;
   - dégâts sur la place actuelle du vaisseau (stay) : rester sur place se paie ;
   - vaisseaux abîmés (hurt) et isolés (iso) visés en priorité ;
   - danger encouru à l'arrivée (risk), rester au contact (near) ;
   - niveau 2 : se poser sur une case de repli pour la bloquer (block), puis chaque pirate
     revoit son tir une fois tout le monde en place (refine) ; l'amiral joue avec ses escortes.
   Aucun hasard : à positions égales, l'ordre de parcours décide (parties reproductibles). */
/** @type {(AiLevel | null)[]} */
const AI_LEVELS = [null,
  { frac: 1.5, stay: .4, kill: 3, iso: .3, hurt: .5, risk: .08, near: .25, block: false, refine: false },
  { frac: 2, stay: .3, kill: 5, iso: .6, hurt: 1, risk: .04, near: .3, block: true, refine: true },
];
// dégâts d'une annonce sur une emprise (case visée, puis 4 voisines « cross », puis 8 voisines « splash »)
/** @param {Intent} it @param {Cell[]} cells */
function hitOn(it, cells) {
  let d = 0;
  for (const [c, r] of cells) {
    const dc = Math.abs(c - it.cell[0]), dr = Math.abs(r - it.cell[1]);
    if (!dc && !dr) return it.dmg;
    if (it.cross && dc + dr === 1) d = Math.max(d, it.cross);
    else if (it.splash && dc <= 1 && dr <= 1) d = Math.max(d, it.splash);
  }
  return d;
}
/** @type {WeakMap<Combat, Map<number, boolean>>} */
const LOSC = new WeakMap();   // lignes de vue déjà calculées (les astéroïdes ne bougent pas pendant un combat)
/** @param {Combat} st @param {Cell[]} cells @param {number} c @param {number} r */
function losCell(st, cells, c, r) {
  let m = LOSC.get(st); if (!m) LOSC.set(st, m = new Map());
  for (const a of cells) {
    const k = a[0] + a[1] * COLS + (c + r * COLS) * 100; let v = m.get(k);
    if (v === undefined) { v = clearLine(st, a, [c, r]); m.set(k, v); }
    if (v) return true;
  }
  return false;
}
/** @typedef {{ S: Ship, w: number, hp: number, pos: { cells: Cell[], base: number }[], cur: number, rel: Set<number> }} Escape */
// positions de repli de chaque vaisseau du joueur, et dégâts déjà annoncés sur chacune
/** @param {Combat} st @param {Intent[]} intents @param {AiLevel} A @returns {Escape[]} */
function escapes(st, intents, A) {
  const P = sideOf(st, 'P');
  return P.map(S => {
    const n = lenOf(S), E = ends(reachable(st, S)), pos = E.map(p => { const cells = footprint(p.c, p.r, n); return { cells, base: intents.reduce((a, it) => a + hitOn(it, cells), 0) }; });
    /** @type {Set<number>} */ const rel = new Set();
    for (const p of pos) for (const [c, r] of p.cells) for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) if (inGrid(c + dc, r + dr)) rel.add(c + dc + (r + dr) * COLS);
    const alone = !P.some(o => o !== S && dist(o, S) <= 2);
    const w = (TYPES[S.t].temp ? .4 : 1) * (1 + A.hurt * (1 - S.hull / S.hmax) + (alone ? A.iso : 0));
    return { S, w, hp: S.hull + S.sh, pos, cur: E.findIndex(p => !p.d), rel };
  });
}
// ce que vaut un vaisseau pour les pirates : dégâts inévitables, prime de destruction, repli couvert
/** @param {Escape} e @param {number[]} base @param {boolean[] | null} blocked @param {Intent | null} it @param {AiLevel} A */
function gainOf(e, base, blocked, it, A) {
  let min = Infinity, hit = 0, n = 0;
  for (let j = 0; j < e.pos.length; j++) {
    if (blocked && blocked[j]) continue;
    const d = base[j] + (it ? hitOn(it, e.pos[j].cells) : 0); n++; if (d < min) min = d; if (d > 0) hit++;
  }
  if (!n) return 0;
  const cur = e.cur < 0 ? 0 : base[e.cur] + (it ? hitOn(it, e.pos[e.cur].cells) : 0);
  return e.w * (Math.min(min, e.hp) + (min >= e.hp ? A.kill : 0) + A.frac * hit / n + A.stay * Math.min(cur, e.hp));
}
// annonce type d'un pirate posé en (c, r) (sans la case visée)
/** @param {Combat} st @param {Ship} p @param {number} c @param {number} r @returns {Intent | null} */
function shotOf(st, p, c, r) {
  if (TYPES[p.t].ai === 'brulot') return { src: p.id, cell: [c, r], dmg: 5, splash: 2, fx: 'charge' };
  const w = TYPES[p.t].w[0]; if (!w) return null;
  const pack = TYPES[p.t].skill === 'MEUTE' && sideOf(st, 'E').some(o => o !== p && o.t === 'intercepteur' && gap(c, r, 1, o.c, o.r, lenOf(o)) === 1);
  return { src: p.id, cell: [c, r], dmg: wDmg(p, w) + (pack ? 1 : 0), fx: w.fx, pack, cross: TUNE.cross[p.t] || 0 };
}
// meilleurs tirs d'un pirate posé en (c, r) : jusqu'à `turrets` cases visées, choisies une à une
/** @param {Combat} st @param {Ship} p @param {number} c @param {number} r @param {Escape[]} E @param {AiLevel} A */
function bestShots(st, p, c, r, E, A) {
  const n = lenOf(p), mine = footprint(c, r, n), tpl = shotOf(st, p, c, r);
  const blocked = E.map(e => A.block ? e.pos.map(P => P.cells.some(([x, y]) => x === c && y >= r && y < r + n)) : null);
  const base = E.map(e => e.pos.map(P => P.base)), now = E.map((e, i) => gainOf(e, base[i], blocked[i], null, A));
  let total = now.reduce((a, b) => a + b, 0);
  /** @type {Intent[]} */ const shots = [];
  if (!tpl) return { v: total, shots };
  const brulot = TYPES[p.t].ai === 'brulot', rg = brulot ? 1 : wRng(p, TYPES[p.t].w[0]), others = sideOf(st, 'E').filter(o => o !== p);
  /** @type {number[]} */ const cand = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    const d = gap(c, r, n, x, y, 1); if (!d || d > rg || rockAt(st, x, y) || !E.some(e => e.rel.has(x + y * COLS))) continue;
    if (d > 2 && fogAt(st, x, y)) continue;   // on ne vise pas dans la nébuleuse au-delà de 2 cases
    if (brulot || losCell(st, mine, x, y)) cand.push(x + y * COLS);
  }
  for (let t = 0; t < (TYPES[p.t].turrets || 1); t++) {
    /** @type {{ it: Intent, delta: number } | null} */ let best = null;
    for (const k of cand) {
      if (shots.some(s => s.cell[0] + s.cell[1] * COLS === k)) continue;
      /** @type {Intent} */ const it = Object.assign({}, tpl, { cell: [k % COLS, Math.floor(k / COLS)] });
      let delta = 0;
      E.forEach((e, i) => { if (e.rel.has(k)) delta += gainOf(e, base[i], blocked[i], it, A) - now[i]; });
      for (const o of others) delta -= .7 * hitOn(it, cellsOf(o));   // tir allié
      if (brulot) delta -= 2;                                            // le brûlot se sacrifie
      if (delta > .001 && (!best || delta > best.delta)) best = { it, delta };
    }
    if (!best) break;
    shots.push(best.it); total += best.delta;
    E.forEach((e, i) => { e.pos.forEach((P, j) => { base[i][j] += hitOn(best.it, P.cells); }); now[i] = gainOf(e, base[i], blocked[i], null, A); });
  }
  return { v: total, shots };
}
/** @param {Combat} st @param {Ev[]} ev @param {AiLevel} A */
function planScored(st, ev, A) {
  /** @type {Map<number, Intent[]>} */ const plan = new Map();
  const committed = () => [...plan.values()].flat();
  const pirates = sideOf(st, 'E').sort((a, b) => a.id - b.id);
  for (const p of pirates) {
    if (p.dead || !sideOf(st, 'P').length) continue;
    const reach = reachable(st, p), n = lenOf(p), E = escapes(st, committed(), A), mine = committed(), P = sideOf(st, 'P');
    let best = null;
    for (const pos of ends(reach)) {
      const o = bestShots(st, p, pos.c, pos.r, E, A), cells = footprint(pos.c, pos.r, n);
      let threat = 0, near = 99;
      for (const S of P) {
        const d = gap(pos.c, pos.r, n, S.c, S.r, lenOf(S)), ws = TYPES[S.t].w; near = Math.min(near, d);
        if (ws.length && d <= spdOf(S) + Math.max(...ws.map(w => wRng(S, w)))) threat += Math.max(...ws.map(w => wDmg(S, w)));
      }
      const ions = cells.some(([x, y]) => ionAt(st, x, y)) ? p.sh : 0;   // finir dans un nuage ionique coûte le bouclier
      const v = o.v - A.risk * threat - A.near * near - .01 * pos.d - mine.reduce((a, it) => a + hitOn(it, cells), 0) - ions;
      if (!best || v > best.v + 1e-9) best = { pos, v, shots: o.shots };
    }
    if (!best) continue;
    if (best.pos.c !== p.c || best.pos.r !== p.r) { ev.push({ e: 'move', id: p.id, path: pathTo(reach, best.pos.c, best.pos.r) }); p.c = best.pos.c; p.r = best.pos.r; }
    if (TYPES[p.t].ai === 'harpon') { const it = grappleIntent(st, p); if (it) best.shots = [it]; }   // le grappin d'abord
    plan.set(p.id, best.shots);
    riposte(st, p, ev); if (p.dead) plan.delete(p.id);
  }
  // niveau 2 : chacun revoit son tir une fois tout le monde en place
  if (A.refine) for (const p of pirates) {
    if (p.dead || !plan.has(p.id)) continue;
    if (plan.get(p.id).some(it => it.fx === 'grapple')) continue;
    plan.delete(p.id); plan.set(p.id, bestShots(st, p, p.c, p.r, escapes(st, committed(), A), A).shots);
  }
  st.intents = pirates.filter(p => !p.dead && plan.has(p.id)).flatMap(p => /** @type {Intent[]} */ (plan.get(p.id)));
  // la meute se compte une fois tout le monde en place
  for (const it of st.intents) { const p = byId(st, it.src); if (p && TYPES[p.t].skill === 'MEUTE') { const s = shotOf(st, p, p.c, p.r); if (s) { it.dmg = s.dmg; it.pack = s.pack; } } }
}
// riposte du chasseur sur un pirate qui vient d'arriver tout près
function riposte(st, p, ev) {
  for (const s of sideOf(st, 'P')) {
    if (p.dead) return;
    if (s.t !== 'chasseur' || s.rip || dist(s, p) > 2 || !los(st, cellsOf(s), cellsOf(p))) continue;
    s.rip = true; ev.push({ e: 'shot', from: s.id, to: p.id, fx: 'canon', riposte: true }); damage(st, p, 1, ev, true);
  }
}
function checkEnd(st) {
  if (st.result) return st.result;
  if (!sideOf(st, 'E').length) st.result = 'won';
  else if (!sideOf(st, 'P').some(s => !TYPES[s.t].temp)) st.result = 'lost';
  return st.result;
}
// FIN DU TOUR : les pirates tirent dans l'ordre annoncé, puis le tour suivant commence
function endTurn(st) {
  const ev = [];
  if (st.result) return ev;
  // nuages ioniques : qui y finit le tour perd son bouclier (avant les tirs)
  for (const s of alive(st)) if (s.sh > 0 && inIons(st, s)) { s.sh = 0; ev.push({ e: 'ion', id: s.id }); }
  for (const it of st.intents) {
    const p = byId(st, it.src); if (!p || p.dead) continue;
    if (it.fx === 'grapple') grapple(st, p, it, ev);
    else if (it.fx === 'charge') { ev.push({ e: 'shot', from: p.id, cell: it.cell, fx: 'charge' }); kill(st, p, ev, false, true); blast(st, it.cell[0], it.cell[1], it.dmg, it.splash, ev, false, p); }
    else {
      ev.push({ e: 'shot', from: p.id, cell: it.cell, fx: it.fx });
      const o = occupant(st, it.cell[0], it.cell[1], p); if (o) damage(st, o, it.dmg, ev, false); else ev.push({ e: 'miss', cell: it.cell });
      if (it.cross) { const hit = new Set([o, p]); for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) { const q = occupant(st, it.cell[0] + dc, it.cell[1] + dr); if (q && !hit.has(q)) { hit.add(q); damage(st, q, it.cross, ev, false); } } }
    }
    if (checkEnd(st)) break;
  }
  st.intents = [];
  if (!checkEnd(st)) startTurn(st, ev);
  return ev;
}

// grappin du harponneur : un vaisseau de 1 case sur la case visée est tiré de 2 cases vers lui
/** @param {Combat} st @param {Ship} p @param {Intent} it @param {Ev[]} ev */
function grapple(st, p, it, ev) {
  ev.push({ e: 'shot', from: p.id, cell: it.cell, fx: 'grapple' });
  const o = occupant(st, it.cell[0], it.cell[1], p);
  if (!o || o.side !== 'P' || lenOf(o) !== 1) { ev.push({ e: 'miss', cell: it.cell }); return; }
  /** @type {Cell[]} */ const path = [[o.c, o.r]];
  for (let k = 0; k < (it.pull || 2); k++) {
    const t = nearestCell(o, 1, p), dc = Math.sign(t[0] - o.c), dr = Math.sign(t[1] - o.r);
    const steps = Math.abs(t[0] - o.c) >= Math.abs(t[1] - o.r) ? [[dc, 0], [0, dr]] : [[0, dr], [dc, 0]];
    const go = steps.find(([a, b]) => (a || b) && inGrid(o.c + a, o.r + b) && !rockAt(st, o.c + a, o.r + b) && !occupant(st, o.c + a, o.r + b));
    if (!go) break;
    o.c += go[0]; o.r += go[1]; path.push([o.c, o.r]);
  }
  if (path.length > 1) ev.push({ e: 'move', id: o.id, path, pulled: true });
}
// annonce de grappin : le vaisseau de 1 case le plus proche, à 3 cases ou moins et en vue
/** @param {Combat} st @param {Ship} p @returns {Intent | null} */
function grappleIntent(st, p) {
  const T = sideOf(st, 'P').filter(o => lenOf(o) === 1 && dist(p, o) <= 3 && dist(p, o) > 1 && los(st, cellsOf(p), cellsOf(o))).sort((a, b) => dist(p, a) - dist(p, b) || a.id - b.id)[0];
  return T ? { src: p.id, cell: [T.c, T.r], dmg: 0, fx: 'grapple', pull: 2 } : null;
}

/* ---------- actions du joueur ---------- */
function canAct(st, s) { return !st.result && s && !s.dead && s.side === 'P' && !s.acted; }
function moveShip(st, s, c, r) {
  if (!canAct(st, s) || s.moved) return null;
  const reach = reachable(st, s), p = reach.get(c + ',' + r); if (!p || p.through || !p.d) return null;
  s.from = { c: s.c, r: s.r }; s.moved = true; s.c = c; s.r = r;
  return [{ e: 'move', id: s.id, path: pathTo(reach, c, r) }];
}
// replacer un vaisseau déjà déplacé (tant qu'il n'a pas agi) : comme s'il repartait de sa case de départ
/** @param {Combat} st @param {Ship} s @param {number} c @param {number} r @returns {Ev[] | null} */
function replaceShip(st, s, c, r) {
  if (!canAct(st, s) || !s.moved || !s.from) return null;
  const cur = [s.c, s.r], from = s.from;
  if (from.c === c && from.r === r) return undoMove(st, s);
  s.c = from.c; s.r = from.r; s.moved = false; s.from = null;
  const ev = moveShip(st, s, c, r);
  if (!ev) { s.c = cur[0]; s.r = cur[1]; s.moved = true; s.from = from; return null; }
  return [{ e: 'move', id: s.id, path: [/** @type {Cell} */ (cur), [c, r]] }];
}
// positions accessibles ce tour-ci (depuis la case de départ si le vaisseau a déjà bougé sans agir)
/** @param {Combat} st @param {Ship} s @returns {Step[]} */
function moveSpots(st, s) {
  if (!canAct(st, s)) return [];
  if (!s.moved) return ends(reachable(st, s)).filter(p => p.d);
  if (!s.from) return [];
  const cur = [s.c, s.r]; s.c = s.from.c; s.r = s.from.r;
  const out = ends(reachable(st, s)); s.c = cur[0]; s.r = cur[1];
  return out.filter(p => p.c !== cur[0] || p.r !== cur[1]);
}
// la position choisie quand on touche la case (c, r) : l'emprise qui la contient, centrée au plus près
/** @param {Combat} st @param {Ship} s @param {number} c @param {number} r @returns {Step | null} */
function spotAt(st, s, c, r) {
  let best = null, bd = 1e9;
  for (const p of moveSpots(st, s)) if (c === p.c && r >= p.r && r < p.r + lenOf(s)) { const d = Math.abs(p.r + (lenOf(s) - 1) / 2 - r); if (d < bd) { bd = d; best = p; } }
  return best;
}
function undoMove(st, s) {
  if (!s || !s.moved || s.acted || !s.from) return null;
  const ev = [{ e: 'move', id: s.id, path: [[s.c, s.r], [s.from.c, s.from.r]] }]; s.c = s.from.c; s.r = s.from.r; s.from = null; s.moved = false; return ev;
}
const targetsFor = (st, s, wi) => { const w = TYPES[s.t].w[wi]; return w ? sideOf(st, 'E').filter(T => canHit(st, s, w, s.c, s.r, T)) : []; };
function attack(st, s, wi, target) {
  const w = TYPES[s.t].w[wi]; if (!canAct(st, s) || !w) return null;
  const ev = [];
  if (w.swarm) {
    const T = sideOf(st, 'E').filter(o => dist(o, s) <= 1); if (!T.length) return null;
    const d = (s.hull <= 2 ? 1 : 2) + nMod(s, 'canons');
    ev.push({ e: 'swarm', from: s.id }); for (const o of T) damage(st, o, d + marked(st, o), ev, true);
  } else if (w.zone) {
    if (!target || target.dead || !canHit(st, s, w, s.c, s.r, target)) return null;
    const z = zoneFor(st, s, target);
    ev.push({ e: 'shot', from: s.id, to: target.id, fx: w.fx }, { e: 'zone', c: z[0], r: z[1] });
    for (const o of zoneShips(st, z)) damage(st, o, wDmg(s, w) + marked(st, o), ev, true);
  } else {
    if (!target || target.dead || !canHit(st, s, w, s.c, s.r, target)) return null;
    const d = wDmg(s, w) * (w.big && lenOf(target) >= 2 ? 2 : 1) + marked(st, target);
    ev.push({ e: 'shot', from: s.id, to: target.id, fx: w.fx }); damage(st, target, d, ev, true);
    if (w.mark && !target.dead) { target.mark = st.turn; ev.push({ e: 'mark', id: target.id }); }
  }
  s.fired = (s.fired || 0) + 1; s.moved = true; s.from = null;
  s.acted = s.fired >= (TYPES[s.t].turrets || 1);   // le cuirassé tire deux fois
  checkEnd(st);
  return ev;
}
// +1 sur un pirate marqué par l'éclaireur ce tour-ci
const marked = (st, o) => o.mark === st.turn ? 1 : 0;
// salve de l'artilleur : la zone de 2×2 (case du haut à gauche) qui contient la cible et touche le plus de pirates
/** @param {Combat} st @param {Ship} s @param {Ship} target @returns {Cell} */
function zoneFor(st, s, target) {
  const [c, r] = nearestCell(s, lenOf(s), target); let bn = -1;
  /** @type {Cell} */ let best = null;
  for (const [x, y] of [[c, r], [c - 1, r], [c, r - 1], [c - 1, r - 1]]) {
    if (!inGrid(x, y) || !inGrid(x + 1, y + 1)) continue;
    const n = zoneShips(st, [x, y]).length; if (n > bn) { bn = n; best = [x, y]; }
  }
  return best || [Math.min(c, COLS - 2), Math.min(r, ROWS - 2)];
}
/** @param {Combat} st @param {Cell} z */
function zoneShips(st, z) { const out = new Set(); for (let dc = 0; dc < 2; dc++) for (let dr = 0; dr < 2; dr++) { const o = occupant(st, z[0] + dc, z[1] + dr); if (o && o.side === 'E') out.add(o); } return [...out]; }
// baies du porte-vaisseaux : ne compte pas comme l'action du vaisseau
function launchFrom(st, s, t) {
  if (st.result || !s || s.dead || s.t !== 'mere' || s.bay > 0) return null;
  if (sideOf(st, 'P').filter(o => TYPES[o.t].temp).length >= 2) return null;
  const spots = [[s.c, s.r - 1], [s.c - 1, s.r], [s.c + 1, s.r], [s.c - 1, s.r + 1], [s.c + 1, s.r + 1], [s.c - 1, s.r + 2], [s.c + 1, s.r + 2], [s.c, s.r + 3]];
  const pos = spots.find(([c, r]) => inGrid(c, r) && !rockAt(st, c, r) && !occupant(st, c, r)); if (!pos) return null;
  const o = makeShip(st, t, 'P', pos[0], pos[1], { name: t === 'leger' ? 'ESCADRILLE' : 'DRONES' }); o.moved = o.acted = true;
  s.bay = 2;
  return [{ e: 'spawn', id: o.id, from: s.id }];
}
const bayReady = (st, s) => s && s.t === 'mere' && !s.dead && s.bay <= 0 && sideOf(st, 'P').filter(o => TYPES[o.t].temp).length < 2;
const canFlee = st => st.turn >= 3 && st.kind !== 'amiral' && sideOf(st, 'P').filter(s => !TYPES[s.t].temp).every(s => s.r + lenOf(s) - 1 === ROWS - 1);
function flee(st) { if (!canFlee(st) || st.result) return false; st.result = 'fled'; return true; }
// cases menacées par les annonces (pour l'affichage et l'IA de test)
function dangerMap(st) {
  const m = new Map(), add = (c, r, d) => { const k = c + ',' + r; m.set(k, (m.get(k) || 0) + d); };
  for (const it of st.intents) { add(it.cell[0], it.cell[1], it.dmg); if (it.cross) for (const [dc, dr] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) add(it.cell[0] + dc, it.cell[1] + dr, it.cross); if (it.splash) for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) if (dc || dr) add(it.cell[0] + dc, it.cell[1] + dr, it.splash); }
  return m;
}

/* ---------- IA du joueur (pour les tests automatiques) ---------- */
function autoTurn(st, riskW = 4) {
  for (const s of sideOf(st, 'P').sort((a, b) => lenOf(b) - lenOf(a))) {
    if (st.result) break;
    if (bayReady(st, s)) launchFrom(st, s, 'leger');
    if (s.acted) continue;
    const danger = dangerMap(st), reach = reachable(st, s);
    let best = null;
    for (const pos of ends(reach)) {
      let risk = 0; for (let i = 0; i < lenOf(s); i++) risk += (danger.get(pos.c + ',' + (pos.r + i)) || 0) + (ionAt(st, pos.c, pos.r + i) ? s.sh * .5 : 0);
      let gain = 0, act = null;
      TYPES[s.t].w.forEach((w, wi) => {
        if (w.swarm) { const T = sideOf(st, 'E').filter(o => gap(pos.c, pos.r, 1, o.c, o.r, lenOf(o)) <= 1); const v = T.length * 2; if (v > gain) { gain = v; act = [wi, null]; } return; }
        for (const T of sideOf(st, 'E')) if (canHit(st, s, w, pos.c, pos.r, T)) {
          const d = wDmg(s, w) * (w.big && lenOf(T) >= 2 ? 2 : 1), v = Math.min(d, T.hull + T.sh) + (d >= T.hull + T.sh ? 4 : 0) + (T.t === 'brulot' ? 2 : 0);
          if (v > gain) { gain = v; act = [wi, T]; }
        }
      });
      const near = Math.min(...sideOf(st, 'E').map(o => gap(pos.c, pos.r, lenOf(s), o.c, o.r, lenOf(o))));
      const score = gain * 3 - risk * riskW - near * .2 - pos.d * .01;
      if (!best || score > best.score) best = { pos, act, score };
    }
    if (best.pos.d) moveShip(st, s, best.pos.c, best.pos.r);
    if (best.act) attack(st, s, best.act[0], best.act[1]);
    // deuxième tourelle du cuirassé : le pirate le plus abîmé à portée
    if (!s.acted && !st.result && best.act) { const T = targetsFor(st, s, best.act[0]).sort((a, b) => (a.hull + a.sh) - (b.hull + b.sh))[0]; if (T) attack(st, s, best.act[0], T); }
  }
  if (!st.result) endTurn(st);
}
/** @param {number} seed @param {string} kind @param {number} floor @param {FleetShip[]} fleet @param {number} [sector] @param {number} [ai] */
function simulate(seed, kind, floor, fleet, riskW = 4, maxTurns = 30, sector = 1, ai) {
  const st = makeCombat(seed, kind, floor, fleet, sector, { ai });
  while (!st.result && st.turn <= maxTurns) autoTurn(st, riskW);
  return { result: st.result || 'timeout', turns: st.turn, kills: st.kills, hull: sideOf(st, 'P').filter(s => !TYPES[s.t].temp).reduce((a, s) => a + s.hull, 0), lost: fleet.length - sideOf(st, 'P').filter(s => !TYPES[s.t].temp).length };
}

/* ---------- carte d'un secteur ---------- */
const NODE_NAMES = { depart: 'POINT DE SAUT', contact: 'CONTACT', lourd: 'CONTACT LOURD', comptoir: 'COMPTOIR', dock: 'DOCK', epave: 'ÉPAVE', nebuleuse: 'NÉBULEUSE', amiral: 'AMIRAL PIRATE' };
const bossOf = sector => (SECTORS[sector - 1] || SECTORS[0]).boss;
const nodeName = (k, sector) => k === 'amiral' ? TYPES[bossOf(sector)].name : NODE_NAMES[k];
// ce qu'on trouve à chaque balise (légende et fiche de la carte)
const NODE_INFO = {
  depart: 'Point d\'arrivée de la flotte dans le secteur.',
  contact: 'Combat contre quelques pirates. Butin : crédits, parfois du carburant ou un module.',
  lourd: 'Combat difficile contre des pirates mieux armés. Module garanti et plus de crédits.',
  comptoir: 'Marché : carburant, réparations, modules et un vaisseau à recruter.',
  dock: 'Chantier gratuit : réparation de la moitié des dégâts, ou un module offert.',
  epave: 'Une rencontre à choix : butin, pilote, piège ou embuscade… à toi de décider.',
  nebuleuse: 'Une brume épaisse : un combat où l\'on vise mal de loin, ou un moment de calme.',
  amiral: 'Le chef pirate du secteur et ses escortes. Le vaincre ouvre le secteur suivant (le 3e : victoire finale).',
};
function makeMap(seed, sector = 1) {
  const R = rng(seedOf(seed, sector, 77)), floors = [[{ k: 'depart' }]];
  for (let f = 1; f <= 7; f++) { const n = R() < .55 ? 3 : 2, row = []; for (let i = 0; i < n; i++) row.push({ k: 'contact' }); floors.push(row); }
  floors.push([{ k: 'amiral' }]);
  // 2 contacts lourds (étages 3 à 6, deux étages différents), 1 ou 2 comptoirs, 1 dock juste avant l'amiral
  shuffle(R, [3, 4, 5, 6]).slice(0, 2).forEach(f => { pick(R, floors[f]).k = 'lourd'; });
  const shopFloors = shuffle(R, [2, 3, 4, 5, 6]).slice(0, R() < .5 ? 1 : 2);
  shopFloors.forEach(f => { const free = floors[f].filter(x => x.k === 'contact'); if (free.length) pick(R, free).k = 'comptoir'; });
  pick(R, floors[7]).k = 'dock';
  // 1 ou 2 épaves (étages 2 à 6) et une nébuleuse (étages 3 à 6), à la place de contacts
  const free = f => floors[f].filter(x => x.k === 'contact');
  for (const f of shuffle(R, [2, 3, 4, 5, 6]).slice(0, R() < .5 ? 1 : 2)) { const fr = free(f); if (fr.length > 1) pick(R, fr).k = 'epave'; }
  { const fs = [3, 4, 5, 6].filter(f => free(f).length > 1); if (fs.length) pick(R, free(pick(R, fs))).k = 'nebuleuse'; }
  const nodes = [];
  floors.forEach((row, f) => row.forEach((nd, i) => {
    const n = row.length, sp = n === 3 ? 168 : 210, jx = n === 1 ? 0 : (R() - .5) * 36;
    Object.assign(nd, { id: nodes.length, f, i, x: Math.round(272 + (i - (n - 1) / 2) * sp + jx), y: Math.round(812 - f * 80 + (n === 1 ? 0 : (R() - .5) * 18)), links: [] });
    nodes.push(nd);
  }));
  // liaisons sans croisement : chaque balise a au moins un départ et une arrivée
  for (let f = 0; f < floors.length - 1; f++) {
    const A = floors[f], B = floors[f + 1]; let i = 0, j = 0; A[0].links.push(B[0].id);
    while (i < A.length - 1 || j < B.length - 1) {
      const ci = i < A.length - 1, cj = j < B.length - 1, r = R();
      if (ci && cj && r < .34) { i++; j++; } else if (cj && (!ci || r < .67)) j++; else i++;
      if (!A[i].links.includes(B[j].id)) A[i].links.push(B[j].id);
    }
  }
  return { sector, nodes };
}

/* ---------- la partie ---------- */
const FLEETS = [
  { id: 'escorte', name: "FLOTTE D'ESCORTE", ships: ['mere', 'fregate', 'chasseur'], desc: 'Un porte-vaisseaux et son escorte : solide et polyvalente.' },
  { id: 'choc', name: 'FLOTTE DE CHOC', ships: ['cuirasse', 'bombardier', 'chasseur'], locked: 60, desc: 'Cuirassé, bombardier et chasseur : frappe lourde.' },
  { id: 'marchande', name: 'FLOTTE MARCHANDE', ships: ['convoyeur', 'egide', 'fregate', 'eclaireur'], locked: 80, desc: 'Plus de crédits, moins de puissance.' },
];
function newRun(seed, fleetId = 'escorte') {
  const R = rng(seedOf(seed, 5)), names = shuffle(R, NAMES.slice());
  const run = { v: RUN_V, seed, sector: 1, fuel: 6, cr: 40, kills: 0, heavy: 0, admirals: 0, sectorsDone: 0, stock: [], crew: [], data: 0, seen: [], uid: 1, phase: 'map', visited: [], combat: null, shop: null, reward: null, event: null, msg: null, fleet: [] };
  for (const t of FLEETS.find(f => f.id === fleetId).ships) addFleet(run, t, names.pop());
  run.map = makeMap(seed, 1); run.at = 0; run.visited = [0];
  return run;
}
function addFleet(run, t, name) { const f = { uid: run.uid++, t, name: name || NAMES[run.uid % NAMES.length], mods: [] }; f.hull = maxHullOf(f); run.fleet.push(f); return f; }
const nodeAt = (run, id) => run.map.nodes[id];
const nextNodes = run => nodeAt(run, run.at).links.map(id => nodeAt(run, id));
const bonus = run => run.fleet.some(f => f.t === 'convoyeur') ? 1.5 : 1;   // soute du convoyeur
function jump(run, id) {
  if (run.phase !== 'map' || !nodeAt(run, run.at).links.includes(id)) return false;
  run.msg = null;
  if (run.fuel > 0) run.fuel--;
  else { for (const f of run.fleet) f.hull = Math.max(1, f.hull - 2); run.msg = 'DÉRIVE : PLUS DE CARBURANT, CHAQUE VAISSEAU PERD 2 DE COQUE'; }
  run.at = id; run.visited.push(id);
  const nd = nodeAt(run, id), seed = seedOf(run.seed, run.sector, id);
  if (nd.k === 'contact' || nd.k === 'lourd' || nd.k === 'amiral') { run.combat = makeCombat(seed, nd.k, nd.f, run.fleet, run.sector); run.phase = 'combat'; }
  else if (nd.k === 'comptoir') { run.shop = makeShop(run, seed); run.phase = 'shop'; }
  else if (nd.k === 'dock') { run.dockMod = pick(rng(seed), MOD_IDS); run.phase = 'dock'; }
  else if (nd.k === 'epave') startEvent(run, 'epaves', seed);
  else if (nd.k === 'nebuleuse') {
    // une fois sur deux, la brume cache un combat
    if (rng(seedOf(seed, 21))() < .5) { run.combat = makeCombat(seed, 'contact', nd.f, run.fleet, run.sector, { fog: true, label: 'NÉBULEUSE' }); run.phase = 'combat'; }
    else startEvent(run, 'nebuleuses', seed);
  }
  return true;
}

/* ---------- épaves et nébuleuses : les événements (textes dans evenements.js) ---------- */
/** @type {{ epaves: any[], nebuleuses: any[] }} */
const EVENTS = (typeof window !== 'undefined' && window.NEBULA_EVENTS) || (typeof require !== 'undefined' ? require('./evenements.js') : { epaves: [], nebuleuses: [] });
const eventById = id => EVENTS.epaves.concat(EVENTS.nebuleuses).find(e => e.id === id);
// un événement pas encore vu dans la partie (sinon n'importe lequel)
function startEvent(run, list, seed) {
  const all = EVENTS[list], fresh = all.filter(e => !(run.seen || []).includes(e.id)), ev = pick(rng(seedOf(seed, 17)), fresh.length ? fresh : all);
  (run.seen = run.seen || []).push(ev.id);
  run.event = { id: ev.id, kind: list === 'epaves' ? 'epave' : 'nebuleuse', seed, done: null }; run.phase = 'event';
}
/** @param {any} run @param {any} ch */
const canChoose = (run, ch) => !ch.need || ((run.cr >= (ch.need.cr || 0)) && (run.fuel >= (ch.need.fuel || 0)));
function randomPilot(R, run, k) {
  const used = new Set([...run.crew, ...run.fleet.map(f => f.pilot).filter(Boolean)].map(p => p.name)), names = PILOT_NAMES.filter(n => !used.has(n));
  return { k: k || pick(R, PILOT_IDS), name: pick(R, names.length ? names : PILOT_NAMES), vet: 0 };
}
// choisir dans un événement : l'issue est tirée avec la graine, les effets appliqués tout de suite
function resolveEvent(run, i) {
  const E = run.event, ev = E && eventById(E.id), ch = ev && ev.choices[i];
  if (run.phase !== 'event' || E.done || !ch || !canChoose(run, ch)) return false;
  const R = rng(seedOf(E.seed, 31, i)); let x = R(), o = ch.outcomes[ch.outcomes.length - 1];
  for (const c of ch.outcomes) { if (x < c.p) { o = c; break; } x -= c.p; }
  if (ch.pay) { run.cr -= ch.pay.cr || 0; run.fuel -= ch.pay.fuel || 0; }
  /** @type {string[]} */ const gains = [];
  if (o.cr) { const n = Array.isArray(o.cr) ? o.cr[0] + Math.floor(R() * (o.cr[1] - o.cr[0] + 1)) : o.cr; run.cr = Math.max(0, run.cr + n); gains.push(`${n > 0 ? '+' : ''}${n} CRÉDITS`); }
  if (o.fuel) { run.fuel += o.fuel; gains.push(`+${o.fuel} CARBURANT`); }
  if (o.heal) { for (const f of run.fleet) f.hull = Math.min(maxHullOf(f), f.hull + o.heal); gains.push(`+${o.heal} COQUE À CHAQUE VAISSEAU`); }
  if (o.dmg) { for (const f of run.fleet) f.hull = Math.max(1, f.hull - o.dmg); gains.push(`-${o.dmg} COQUE À CHAQUE VAISSEAU`); }
  if (o.dmgOne && run.fleet.length) { const f = pick(R, run.fleet); f.hull = Math.max(1, f.hull - o.dmgOne); gains.push(`-${o.dmgOne} COQUE : ${f.name}`); }
  if (o.mod) { const m = pick(R, MOD_IDS); run.stock.push(m); gains.push('MODULE : ' + MODS[m].name); }
  if (o.pilot) { const p = randomPilot(R, run, typeof o.pilot === 'string' ? o.pilot : null); run.crew.push(p); gains.push(`PILOTE : ${p.name} (${PILOTS[p.k].name})`); }
  if (o.ship) {
    if (run.fleet.length < 5) { const t = pick(R, RECRUITS), f = addFleet(run, t, pick(R, NAMES)); f.hull = Math.ceil(maxHullOf(f) / 2); gains.push('VAISSEAU : ' + TYPES[t].name); }
    else { run.cr += 40; gains.push('+40 CRÉDITS (FLOTTE PLEINE)'); }
  }
  if (o.data) { run.data = (run.data || 0) + o.data; gains.push(`+${o.data} DONNÉES STELLAIRES`); }
  if (o.combat) gains.push(o.combat === 'lourd' ? 'COMBAT DIFFICILE !' : 'COMBAT !');
  E.done = { choice: i, text: o.text, gains, combat: o.combat || null };
  return true;
}
// après l'événement : la carte, ou le combat qu'il a déclenché
function closeEvent(run) {
  const E = run.event; if (run.phase !== 'event' || !E || !E.done) return false;
  if (E.done.combat) { run.combat = makeCombat(seedOf(E.seed, 13), E.done.combat, nodeAt(run, run.at).f, run.fleet, run.sector, { label: 'EMBUSCADE' }); run.phase = 'combat'; }
  else run.phase = 'map';
  run.event = null; return true;
}
// pilotes : poser un pilote de l'équipage sur un vaisseau (l'ancien retourne à l'équipage), ou le retirer
function assignPilot(run, uid, i) {
  const f = run.fleet.find(x => x.uid === uid), p = run.crew[i]; if (!f || !p) return false;
  const old = f.pilot; run.crew.splice(i, 1); if (old) run.crew.push(old);
  const before = maxHullOf(f); f.pilot = p; f.hull = Math.max(1, Math.min(maxHullOf(f), f.hull + maxHullOf(f) - before)); return true;
}
function unassignPilot(run, uid) {
  const f = run.fleet.find(x => x.uid === uid); if (!f || !f.pilot) return false;
  const before = maxHullOf(f); run.crew.push(f.pilot); f.pilot = null; f.hull = Math.max(1, Math.min(maxHullOf(f), f.hull + maxHullOf(f) - before)); return true;
}
function finishCombat(run) {
  const st = run.combat; if (!st || !st.result) return;
  const lostCargo = run.fleet.some(f => f.t === 'convoyeur' && (st.ships.find(x => x.fid === f.uid) || { dead: true }).dead) ? 20 : 0;
  run.fleet = run.fleet.filter(f => { const s = st.ships.find(x => x.fid === f.uid); if (!s || s.dead) return false; f.hull = s.hull; return true; });
  run.kills += st.kills; run.cr = Math.max(0, run.cr - lostCargo);
  if (st.result !== 'lost' && run.fleet.some(f => f.t === 'atelier')) for (const f of run.fleet) f.hull = Math.min(maxHullOf(f), f.hull + 3);
  const R = rng(seedOf(st.seed, 99));
  if (st.result === 'won') {
    const k = st.kind, rw = { kind: k, kills: st.kills };
    rw.cr = Math.round((k === 'amiral' ? 100 : k === 'lourd' ? 50 + R() * 21 : 20 + R() * 16) * bonus(run));
    rw.fuel = Math.round((k === 'lourd' ? 1 : k === 'contact' && R() < .5 ? 1 : 0) * bonus(run)); rw.lostCargo = lostCargo;
    rw.mod = k === 'lourd' || k === 'amiral' || R() < .25 ? pick(R, MOD_IDS) : null;
    run.cr += rw.cr; run.fuel += rw.fuel; if (rw.mod) run.stock.push(rw.mod);
    if (k === 'lourd') run.heavy++;
    for (const f of run.fleet) if (hasPilot(f, 'veteran') && (f.pilot.vet || 0) < 4) { f.pilot.vet = (f.pilot.vet || 0) + 1; f.hull++; }
    if (k === 'amiral') { run.admirals++; run.sectorsDone++; }
    run.reward = rw; run.phase = 'reward';
  } else if (st.result === 'fled') { run.fuel = Math.max(0, run.fuel - 1); run.phase = 'map'; run.msg = 'FUITE : PAS DE RÉCOMPENSE, -1 CARBURANT'; }
  else { run.phase = 'end'; run.victory = false; }
  run.combat = null;
}
const REFUEL = 3;   // carburant offert en entrant dans un nouveau secteur
// après la récompense : le secteur suivant, ou la fin (victoire) après le dernier amiral
function afterReward(run) {
  const k = run.reward && run.reward.kind; run.reward = null;
  if (k === 'amiral') {
    if (run.sector < SECTORS.length) {
      run.sector++; run.map = makeMap(run.seed, run.sector); run.at = 0; run.visited = [0]; run.phase = 'map';
      run.fuel += REFUEL; run.msg = `SECTEUR ${String(run.sector).padStart(2, '0')} · RAVITAILLEMENT : +${REFUEL} CARBURANT`;
    } else { run.phase = 'end'; run.victory = run.sectorsDone >= SECTORS.length; run.cleared = true; }
  } else run.phase = 'map';
}
const RECRUITS = ['chasseur', 'fregate', 'bombardier', 'drones', 'egide', 'eclaireur', 'convoyeur', 'artilleur', 'cuirasse', 'atelier'];
function makeShop(run, seed) {
  const R = rng(seedOf(seed, 3)), mods = shuffle(R, MOD_IDS.slice()).slice(0, 2).map(m => ({ m, price: Math.round(Math.min(80, Math.max(40, MODS[m].price + (R() - .5) * 20))), sold: false }));
  const t = pick(R, RECRUITS);
  return { mods, ship: { t, price: Math.round(Math.min(150, Math.max(80, TYPES[t].price + (R() - .5) * 20))), name: pick(R, NAMES), sold: false },
    pilot: { p: randomPilot(R, run), price: 40 + Math.floor(R() * 21), sold: false } };
}
const missingHull = run => run.fleet.reduce((a, f) => a + maxHullOf(f) - f.hull, 0);
function buy(run, what, i) {
  const sh = run.shop; if (run.phase !== 'shop') return false;
  if (what === 'fuel') { if (run.cr < 10) return false; run.cr -= 10; run.fuel++; return true; }
  if (what === 'repair') {
    let pts = Math.min(missingHull(run), Math.floor(run.cr / 3)); if (!pts) return false; run.cr -= pts * 3;
    for (const f of run.fleet) { const k = Math.min(pts, maxHullOf(f) - f.hull); f.hull += k; pts -= k; } return true;
  }
  if (what === 'pilot') { const o = sh.pilot; if (!o || o.sold || run.cr < o.price) return false; run.cr -= o.price; o.sold = true; run.crew.push(o.p); return true; }
  if (what === 'mod') { const o = sh.mods[i]; if (!o || o.sold || run.cr < o.price) return false; run.cr -= o.price; o.sold = true; run.stock.push(o.m); return true; }
  if (what === 'ship') { const o = sh.ship; if (o.sold || run.cr < o.price || run.fleet.length >= 5) return false; run.cr -= o.price; o.sold = true; addFleet(run, o.t, o.name); return true; }
  return false;
}
function dock(run, choice) {
  if (run.phase !== 'dock') return false;
  if (choice === 'repair') for (const f of run.fleet) f.hull += Math.ceil((maxHullOf(f) - f.hull) / 2);
  else run.stock.push(run.dockMod);
  run.phase = 'map'; return true;
}
// modules : poser depuis la réserve, ou rendre à la réserve
function install(run, uid, m) {
  const f = run.fleet.find(x => x.uid === uid), i = run.stock.indexOf(m);
  if (!f || i < 0 || f.mods.length >= slotsOf(f.t)) return false;
  run.stock.splice(i, 1); f.mods.push(m); if (m === 'blindage') f.hull += 3; return true;
}
function uninstall(run, uid, k) {
  const f = run.fleet.find(x => x.uid === uid); if (!f || !f.mods[k]) return false;
  const m = f.mods.splice(k, 1)[0]; run.stock.push(m); if (m === 'blindage') f.hull = Math.max(1, f.hull - 3); return true;
}
/* ---------- sauvegardes d'une version à l'autre ----------
   RUN_V : version de la partie sauvegardée. Quand une session ajoute des champs
   à la partie, monter RUN_V et compléter ici les anciennes sauvegardes.
   Renvoie la partie remise à niveau, ou null si elle est illisible. */
const RUN_V = 2;
const PHASES = ['map', 'combat', 'reward', 'shop', 'dock', 'event', 'end'];
function migrate(r) {
  if (!r || typeof r !== 'object' || !(r.v >= 1) || r.v > RUN_V) return null;
  if (r.v === 1) { r.crew = r.crew || []; r.data = r.data || 0; r.seen = r.seen || []; r.event = null; r.v = 2; }   // session 2 : pilotes, données, événements
  const ok = Array.isArray(r.fleet) && r.fleet.every(f => f && TYPES[f.t] && Array.isArray(f.mods)) && r.map && Array.isArray(r.map.nodes)
    && r.map.nodes[r.at] && PHASES.includes(r.phase) && (r.phase !== 'combat' || (r.combat && Array.isArray(r.combat.ships)))
    && (r.phase !== 'shop' || r.shop) && (r.phase !== 'reward' || r.reward) && (r.phase !== 'event' || (r.event && eventById(r.event.id))) && Array.isArray(r.stock) && Array.isArray(r.crew);
  return ok ? r : null;
}
const scoreOf = run => 1000 * run.sectorsDone + 20 * run.kills + run.cr + (run.victory ? 3000 : 0);
const stellarOf = run => 10 * run.sector + 3 * run.heavy + 20 * run.admirals + (run.data || 0);

const NEBULA_API = { TUNE, nextNodes, nodeAt, makeShop, TYPES, MODS, SECTORS, FLEETS, makeCombat, startTurn, endTurn, moveShip, undoMove, replaceShip, moveSpots, spotAt, attack, launchFrom, flee, canFlee, targetsFor, reachable, autoTurn, simulate, makeMap, newRun, jump, finishCombat, afterReward, buy, dock, install, uninstall, scoreOf, stellarOf, seedOf, dangerMap, PILOTS, EVENTS, eventById, resolveEvent, closeEvent, canChoose, assignPilot, unassignPilot, nodeName, bossOf, ionAt, fogAt, REFUEL, zoneFor, zoneShips, NODE_INFO, RUN_V, migrate, AI_LEVELS };
if (typeof window !== 'undefined') window.Nebula = NEBULA_API;
if (typeof module !== 'undefined') module.exports = NEBULA_API;

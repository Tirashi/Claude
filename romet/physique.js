/* =====================================================================
   ROMET · la PHYSIQUE des pièces (logique pure, sans Three.js ni DOM).
   Reprise des maquettes du 22/10 (cannon.js était trop lent avec 150 pièces).
   Chaque objet est un disque posé à plat (x, z ; y = hauteur du dessous) qui
   repose sur le plus haut appui sous son centre : le plancher, le dessus du
   poussoir ou une autre pièce. Les disques d'une même couche se repoussent ;
   un disque trop serré grimpe sur son voisin (les tas se forment comme dans
   une vraie machine). Sans appui, il tombe en basculant.
   Repères : plancher x ±2.6, z de -7 à 3.5 (bord avant) ; poussoir de 5 × 5
   qui va et vient (avant entre -1.5 et -0.3) ; mur du fond au-dessus du
   poussoir (z -5.35) ; parois latérales jusqu'à z = finCotes, ensuite les
   côtés sont ouverts (pertes).
   Règles de certaines machines : courant (épave : une vague pousse tout le
   tas vers un côté), pièce guidée (foire de nuit : déviée par les clous en
   tombant, gx et gn), étage (horloger : une étagère en haut, avec son propre
   poussoir, d'où les pièces tombent sur le plateau du bas).
   Mise au repos : une pièce posée qui ne bouge plus s'endort ; elle ne coûte
   presque plus rien jusqu'à ce qu'on la pousse ou que son appui bouge.
   Tout l'aléatoire passe par un générateur à graine (état sauvegardable).
   - Dans la page : script classique, window.RometPhysique.
   - Dans Node : require (outils/romet-simulateur.js).
   Cahier des charges : specs/romet.md.
   ===================================================================== */
(function (racine) {
'use strict';
const R = 0.36, H = 0.1, DT = 1 / 60, ZM = -3.4, AMP = 0.6, PERIODE = 2.6, BORD = 3.5, CASE = 1.05, MAXP = 300;
const FORMES = { piece: [R, H, 1], geante: [.65, .16, 4], mur: [.36, .3, 1.5], pluie: [.3, .3, 1.5], tresor: [.3, .5, 1.5] };
const TYPES = Object.keys(FORMES);
const REPOS = 2e-4, CALME = 20;   // une pièce qui bouge de moins de 0,2 mm par pas pendant 20 pas s'endort

// générateur à graine (mulberry32) : l'état tient dans un nombre, qu'on sauvegarde avec le tas
function Hasard(a) { this.a = a >>> 0; }
Hasard.prototype.n = function () { let t = this.a = (this.a + 0x6D2B79F5) >>> 0; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };

// opts : finCotes (fin des parois latérales), grimpe (pièce trop serrée qui grimpe, en rayons), miel ([z0, z1] bande collante ou null),
// etage ({ y, bord, avance, amp } : hauteur de l'étagère, son bord avant, milieu et amplitude de l'avant de son poussoir, ou null)
function Plateau(opts, graine) {
  this.finCotes = opts.finCotes || 2; this.grimpe = opts.grimpe || 1.3; this.miel = opts.miel || null; this.etage = opts.etage || null; this.courant = 0;
  this.h = new Hasard(graine == null ? 1 : graine);
  this.objets = []; this.t = 0; this.zp = ZM; this.murs = false; this.modif = 0; this.cases = new Map();
}
Plateau.prototype.ajouter = function (type, x, y, z, lot) {
  const f = FORMES[type], h = this.h, o = { type, x, y, z, r: f[0], h: f[1], kg: f[2], vx: 0, vy: 0, vz: 0, dx: 0, dz: 0, sup: null, chute: false,
    ax: (h.n() - .5) * .12, ay: h.n() * 6.3, az: (h.n() - .5) * .12, bx: 0, bz: 0, dort: false, calme: 0, ex: 0, ez: 0 };
  if (type === 'tresor') o.lot = lot;
  this.objets.push(o); this.modif++; return o;
};
Plateau.prototype.voisins = function () {
  const g = this.cases; g.clear();
  for (const o of this.objets) { if (o.chute && o.y < -.3) continue; const k = Math.floor(o.x / CASE) * 1000 + Math.floor(o.z / CASE); let l = g.get(k); if (!l) g.set(k, l = []); l.push(o); }
};
Plateau.prototype.autour = function (o, f) {
  const cx = Math.floor(o.x / CASE), cz = Math.floor(o.z / CASE);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const l = this.cases.get((cx + i) * 1000 + cz + j); if (l) for (const n of l) if (n !== o) f(n); }
};
// avant du poussoir de l'étage (il va et vient à l'opposé du grand poussoir)
Plateau.prototype.zHaut = function (t) { const e = this.etage; return e.avance + e.amp * Math.sin(2 * Math.PI * (t == null ? this.t : t) / PERIODE + Math.PI); };
Plateau.prototype.dansMiel = function (o) { const m = this.miel; return !!m && !o.chute && o.y < .05 && o.z > m[0] && o.z < m[1]; };
Plateau.prototype.pas = function () {
  const zp = ZM + AMP * Math.sin(2 * Math.PI * (this.t + DT) / PERIODE), dzp = zp - this.zp; this.zp = zp; this.t += DT;
  const av = zp + 2.5, ar = zp - 2.5, murs = this.murs, fc = this.finCotes, h = this.h, et = this.etage, zu = et ? this.zHaut() : 0, cour = this.courant;
  // copie triée par hauteur : this.objets garde son ordre, donc chaque pièce garde sa place dans l'InstancedMesh
  const os = this.objets.slice().sort((a, b) => a.y - b.y); this.voisins();
  // 1. transport par l'appui, inertie, gravité, appui
  for (const c of os) {
    c.px = c.x; c.pz = c.z; c.py = c.y; c.tx = c.tz = 0; c.pen = 0; c.colle = this.dansMiel(c);
    if (c.dort) { if (!cour && (c.sup === 'sol' || c.sup === 'e' || c.sup.dort)) continue; c.dort = false; c.calme = 0; }
    const py = c.y; let tx = 0, tz = 0;
    if (c.sup === 'p') tz = dzp; else if (c.sup && typeof c.sup === 'object') { tx = c.sup.dx * .85; tz = c.sup.dz * .85; }
    // une pièce posée en déséquilibre sur une autre glisse vers l'extérieur (les tas s'étalent)
    // (écart au centre des pièces qui la portent, mesuré au pas précédent)
    if (c.sup && c.sup.kg) { const ex = c.ex, ez = c.ez, e = Math.sqrt(ex * ex + ez * ez); if (e > .22) { c.vx += ex / e * 2.5 * DT; c.vz += ez / e * 2.5 * DT; } }
    if (c.gn > 0) { c.gn--; tx += c.gx; }   // pièce déviée par les clous pendant sa chute
    if (cour && c.sup) c.vx += cour * DT;   // le courant pousse tout ce qui est posé
    c.tx = tx; c.tz = tz; c.x += tx + c.vx * DT; c.z += tz + c.vz * DT;
    c.vy -= 15 * DT; c.y += c.vy * DT;
    let s = -1e9, sup = null;
    if (Math.abs(c.x) < 2.6 && c.z < BORD && c.z > -7) { s = 0; sup = 'sol'; }
    if (Math.abs(c.x) < 2.55 && c.z > ar && c.z < av && py > .5) { s = .6; sup = 'p'; }
    if (et && Math.abs(c.x) < 2.55 && c.z > -5.4 && c.z < et.bord && py > et.y - .05) { s = et.y; sup = 'e'; }
    let sx = 0, sz = 0, ns = 0;
    this.autour(c, n => { if (n.chute) return; const t = n.y + n.h; if (t > py + .03) return; const dx = n.x - c.x, dz = n.z - c.z, lim = (c.r + n.r) * .62; if (dx * dx + dz * dz >= lim * lim) return;
      if (t > s + .03) { s = t; sup = n; sx = n.x; sz = n.z; ns = 1; } else if (t > s - .03) { sx += n.x; sz += n.z; ns++; if (t > s) { s = t; sup = n; } } });
    if (ns) { c.ex = c.x - sx / ns; c.ez = c.z - sz / ns; } else c.ex = c.ez = 0;
    if (c.y <= s) { c.y = s; c.vy = c.vy < -4 ? -c.vy * .12 : 0; c.sup = sup; c.chute = false; }
    else { c.sup = null; if (s < -1e8 && !c.chute) { c.chute = true; c.bx = c.z >= BORD ? 1 : 0; c.bz = c.z >= BORD ? 0 : -Math.sign(c.x); if (c.bx) c.vz += .6; else c.vx += Math.sign(c.x) * .6; } }
  }
  // 2. les disques d'une même couche se repoussent. On les parcourt d'arrière en avant : un disque calé par le poussoir
  // (ou par un disque calé) ne recule pas et pousse tout son voisin, donc la poussée traverse le tas d'un seul passage.
  // Dans le miel, une pièce résiste (elle pèse trois fois plus) et ne transmet pas la poussée : le tas s'y serre et monte.
  // Deux pièces endormies ne se testent pas ; une pièce endormie qu'on déplace se réveille.
  const parZ = os.slice().sort((a, b) => a.z - b.z);
  for (let it = 0; it < 2; it++) {
    for (const c of parZ) c.cale = false;
    for (const c of parZ) {
      if (!c.chute) {
        const x0 = c.x, z0 = c.z;
        if (c.y < .55) { if (c.z - c.r < av && c.z > ar) { c.z = av + c.r; c.cale = true; } }
        else { if (c.z - c.r < -5.35) { c.z = -5.35 + c.r; c.cale = true; }
          if (et && c.y > et.y - .05 && c.z - c.r < zu) { c.z = zu + c.r; c.cale = true; } }
        if (c.z < fc || murs || c.y >= .55) { const lim = 2.6 - c.r; if (c.x > lim) c.x = lim; else if (c.x < -lim) c.x = -lim; }
        if (c.dort && (c.x !== x0 || c.z !== z0)) { c.dort = false; c.calme = 0; }
      }
      this.autour(c, n => { if (n.z < c.z || (n.z === c.z && n.x <= c.x)) return; if (c.dort && n.dort) return;
        if (Math.abs((c.y + c.h / 2) - (n.y + n.h / 2)) >= (c.h + n.h) * .42) return;
        const dx = n.x - c.x, dz = n.z - c.z, m = c.r + n.r, d2 = dx * dx + dz * dz; if (d2 >= m * m || d2 < 1e-8) return;
        const d = Math.sqrt(d2), p = (m - d), ux = dx / d, uz = dz / d, kc = c.kg * (c.colle ? 3 : 1), kn = n.kg * (n.colle ? 3 : 1), wc = c.cale ? 0 : kn / (kc + kn), wn = 1 - wc;
        c.x -= ux * p * wc; c.z -= uz * p * wc; n.x += ux * p * wn; n.z += uz * p * wn; if (c.cale && uz > .3 && !n.colle) n.cale = true; if (it === 1) { c.pen += p; n.pen += p; }
        if (p * wc > REPOS) c.dort = false; if (p * wn > REPOS) n.dort = false; });
    }
  }
  // 3. vitesses, déplacement transmis aux pièces posées dessus, pièces trop serrées qui grimpent, mise au repos
  for (const c of os) {
    if (c.dort) { c.dx = c.dz = 0; continue; }
    const ret = c.colle ? 0 : .2;
    c.vx = (c.x - c.px - c.tx) / DT * ret; c.vz = (c.z - c.pz - c.tz) / DT * ret; c.dx = c.x - c.px; c.dz = c.z - c.pz;
    if (c.chute) { c.ax += c.bx * DT * 7; c.az += c.bz * DT * 7; continue; }
    if (!c.sup || typeof c.sup === 'string') { c.ax *= .8; c.az *= .8; }
    if (c.pen > c.r * this.grimpe && c.type === 'piece') { let haut = null; this.autour(c, n => { if (!n.chute && Math.abs(n.y - c.y) < .06 && (!haut || n.pen < haut.pen)) { const dx = n.x - c.x, dz = n.z - c.z; if (dx * dx + dz * dz < (c.r + n.r) ** 2) haut = n; } });
      if (haut) { c.y = haut.y + haut.h + .01; c.ax = (h.n() - .5) * .2; c.az = (h.n() - .5) * .2; c.calme = 0; continue; } }
    if ((c.sup === 'sol' || c.sup === 'e' || (c.sup && c.sup.dort)) && Math.abs(c.dx) + Math.abs(c.dz) + Math.abs(c.y - c.py) < REPOS) {
      if (++c.calme >= CALME) { c.dort = true; c.vx = c.vz = c.vy = 0; } } else c.calme = 0;
  }
};
// retire ce qui est tombé sous le plateau ; renvoie la liste, chaque objet marqué gagne (tombé à l'avant, dans le bac) ou non
Plateau.prototype.retirer = function () {
  let out = null;
  for (let i = this.objets.length - 1; i >= 0; i--) { const o = this.objets[i]; if (o.y > -1.2) continue;
    o.gagne = o.z > BORD - .05 && Math.abs(o.x) < 2.65; this.objets.splice(i, 1); this.modif++; (out || (out = [])).push(o); }
  return out;
};
// remplissage d'un nouveau tas : on lâche les pièces une à une au hasard ; chacune se pose sur le tas déjà là, sans chevaucher sa couche
// (70 % sur le plancher, le reste sur le poussoir), puis la machine tourne 8 secondes à vide (ce qui tombe alors ne compte pas)
Plateau.prototype.remplir = function (nb, extras) {
  const h = this.h; this.objets = []; this.t = 0; this.zp = ZM; this.modif++;
  const poser = (x0, x1, z0, z1, base) => { let best = null; for (let k = 0; k < 25; k++) { const x = x0 + h.n() * (x1 - x0), z = z0 + h.n() * (z1 - z0); let y = base, ok = true;
      for (const o of this.objets) { const dx = o.x - x, dz = o.z - z, d2 = dx * dx + dz * dz; if (d2 < .2 && o.y + o.h > y) y = o.y + o.h; }
      for (const o of this.objets) { const dx = o.x - x, dz = o.z - z; if (Math.abs(o.y - y) < .06 && dx * dx + dz * dz < .5) { ok = false; break; } }
      if (ok && (!best || y < best[1])) best = [x, y, z]; }
    if (best && best[1] < base + .36) this.ajouter('piece', best[0], best[1], best[2]); return !!best && best[1] < base + .36; };
  const nSol = Math.round(nb * .7);
  let reste = 0; for (let i = 0; i < nSol; i++) if (!poser(-2.2, 2.2, -.55, 3.15, 0)) reste++;
  for (let i = nSol - reste; i < nb; i++) poser(-2.15, 2.15, -4.95, -1.75, .6);
  if (this.etage) { const e = this.etage; for (let i = 0; i < Math.round(nb * .22); i++) poser(-2.15, 2.15, e.avance + e.amp + .45, e.bord - .4, e.y); }
  for (const e of extras || []) this.ajouter(e[0], e[1], 1.2, e[2], e[3]);
  for (let i = 0; i < 480; i++) { this.pas(); if (i % 30 === 0) this.retirer(); }
  this.retirer();
};
// sauvegarde compacte du tas (positions au millimètre) et de l'état du générateur
const arr = v => Math.round(v * 1000) / 1000;
Plateau.prototype.sauver = function () {
  return { t: arr(this.t), a: this.h.a, o: this.objets.filter(o => !o.chute).map(o => { const l = [TYPES.indexOf(o.type), arr(o.x), arr(o.y), arr(o.z), arr(o.ax), arr(o.ay), arr(o.az)]; if (o.type === 'tresor') l.push(o.lot); return l; }) };
};
Plateau.prototype.charger = function (s) {
  this.t = s.t; this.zp = ZM + AMP * Math.sin(2 * Math.PI * s.t / PERIODE); this.h.a = s.a >>> 0; this.objets = []; this.modif++;
  for (const l of s.o) { const o = this.ajouter(TYPES[l[0]], l[1], l[2], l[3], l[7]); o.ax = l[4]; o.ay = l[5]; o.az = l[6]; }
  this.h.a = s.a >>> 0;   // ajouter() a tiré des nombres : on remet le générateur où il était
};

const P = { R, H, DT, ZM, AMP, PERIODE, BORD, MAXP, FORMES, Hasard, Plateau };
if (typeof module !== 'undefined' && module.exports) module.exports = P; else racine.RometPhysique = P;
})(typeof window !== 'undefined' ? window : globalThis);

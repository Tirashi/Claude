/* =====================================================================
   ESCADRILLE ! : les avions en relief, construits avec le moteur des vaisseaux de Nebula
   (nebula/vaisseaux.js : builder, render, half, MAT). Script classique, chargé avant le jeu.
   Données et constructeurs seulement (repris de la maquette validée maquettes/escadrille.html) :
     EscAvions.STYLES  : matières par famille, pour mon escadrille (mine) et les pirates (foe)
     EscAvions.AVIONS  : constructeurs par famille (a escadre, b furtif, c hélices, d canonnière)
     EscAvions.SIZE    : taille de chaque avion nez en haut (pixels logiques)
     EscAvions.rotBuilder(w, h, d) : un constructeur tourné d'un quart de tour d sens horaire
   ===================================================================== */
(function () {
'use strict';
/* ---------- les avions, en relief comme les vaisseaux de Nebula ----------
   Chaque avion est une carte de hauteurs construite avec le moteur de nebula/vaisseaux.js
   (plaques, rainures, ombres, reflets, verrières, petits boîtiers), puis éclairée.
   Quatre familles aux silhouettes différentes ; les cases occupées restent les mêmes.
   Pour chaque sens, on tourne la construction AVANT l'éclairage : la lumière vient toujours d'en haut à gauche.
   Les sprites sont fabriqués en double définition, à la demande, puis gardés. */
const NV = window.NebulaVaisseaux; NV.setScale(2);
Object.assign(NV.MAT, {
  acier: { c: [136, 142, 152], spec: .45, plates: 1 }, acier2: { c: [100, 106, 116], spec: .35, plates: 1 },
});
const PIRATE = { hull: 'rust', hull2: 'scrap', deck: 'scrap', mark: 'hazard', feu: NV.REDL, lueur: 1, pirate: true };
const STYLES = {
  a: { mine: { hull: 'acier', hull2: 'acier2', deck: 'deck', mark: 'amber', feu: NV.WARM, lueur: 0 }, foe: PIRATE },
  b: { mine: { hull: 'hull', hull2: 'hull2', deck: 'hull2', mark: 'amber', feu: NV.CYAN, lueur: 0 }, foe: PIRATE },
  c: { mine: { hull: 'acier', hull2: 'hull', deck: 'deck', mark: 'amber', feu: NV.WARM, lueur: 0 }, foe: PIRATE },
  d: { mine: { hull: 'acier2', hull2: 'hull', deck: 'deck', mark: 'amber', feu: NV.WARM, lueur: 0 }, foe: PIRATE },
};
// un constructeur Nebula tourné d'un quart de tour d sens horaire : on décrit l'avion nez en haut
function rotBuilder(w, h, d) {
  const B = NV.builder(d % 2 ? h : w, d % 2 ? w : h);
  const T = ([x0, y0]) => { let x = x0, y = y0, ch = h, cw = w; for (let k = 0; k < d; k++) { [x, y] = [ch - y, x]; [cw, ch] = [ch, cw]; } return [x, y]; };
  const rect = (x, y, bw, bh) => { const a = T([x, y]), b = T([x + bw, y + bh]); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])]; };
  const Rb = {
    B, T,
    poly(pts, top, bev, mat, base) { B.poly(pts.map(T), top, bev, mat, base); return Rb; },
    box(x, y, bw, bh, top, bev, mat, base) { return Rb.poly([[x, y], [x + bw, y], [x + bw, y + bh], [x, y + bh]], top, bev, mat, base); },
    dome(cx, cy, rx, ry, base, top, mat) { const [x, y] = T([cx, cy]); B.dome(x, y, d % 2 ? ry : rx, d % 2 ? rx : ry, base, top, mat); return Rb; },
    holeE(cx, cy, rx, ry, depth, mat) { const [x, y] = T([cx, cy]); B.holeE(x, y, d % 2 ? ry : rx, d % 2 ? rx : ry, depth, mat); return Rb; },
    paint(x, y, bw, bh, mat) { B.paint(...rect(x, y, bw, bh), mat); return Rb; },
    greebles(n, seed, area) { B.greebles(n, seed, rect(...area)); return Rb; },
    lights(pts, col) { B.lights(pts.map(T), col); return Rb; },
    engines(pts) { B.engines(pts.map(p => [...T(p), p[2]])); return Rb; },
  };
  return Rb;
}
const half = NV.half;
/* Chaque constructeur dessine l'avion nez en haut et rend ses pièces animées :
   ['helice', x, y, rayon, sens], ['rotor', x, y, rayon, sens], ['antenne', x, y, longueur]. */
const AVIONS = {
  // A. ESCADRE : réacteurs en nacelles, grand disque radar, aile delta
  a: {
    bomb: (R, m, c) => {
      R.poly(half(c, [[0, 25], [32, 30], [32, 37], [0, 42]]), 5, 3, m.hull);
      R.poly(half(c, [[0, 74], [16, 79], [16, 84], [0, 85]]), 4, 2, m.hull);
      for (const s of [-1, 1]) {
        R.poly([[c + s * 32, 30], [c + s * 27, 29.6], [c + s * 27, 37], [c + s * 32, 37]], 6, 1, m.mark, 4);
        R.poly([[c + s * 16, 79], [c + s * 12, 78], [c + s * 12, 84], [c + s * 16, 84]], 5, 1, m.mark, 3);
        for (const e of [12, 24]) { const x = c + s * e; R.poly([[x - 2, 22], [x + 2, 22], [x + 3, 25], [x + 3, 35], [x - 3, 35], [x - 3, 25]], 7.5, 2.5, m.hull, 4); R.dome(x, 23.5, 1.8, 1.2, 6, 7, 'black'); }
      }
      R.poly(half(c, [[0, 3], [4, 8], [6.5, 18], [6.5, 60], [5, 78], [3, 86], [0, 88]]), 7, 4, m.hull);
      R.poly(half(c, [[0, 20], [3, 22], [3, 64], [0, 66]]), 9.5, 2, m.deck, 7);
      R.box(c - 1, 70, 2, 19, 10, .6, m.hull2, 7); R.box(c - 6, 66, 12, 2.6, 7.6, 1, m.mark, 6);
      R.dome(c, 11, 3.5, 5, 7, 10, 'glass');
      R.dome(c, 48, 3.6, 3.6, 9.5, 13, m.hull2); R.box(c - 2.2, 39, 1.2, 8, 13, .5, m.hull2, 10); R.box(c + 1, 39, 1.2, 8, 13, .5, m.hull2, 10);
      R.greebles(28, 3, [8, 22, 53, 56]);
      R.lights([[c - 31, 34], [c + 31, 34], [c - 4, 30], [c + 4, 30], [c - 4, 58], [c + 4, 58]], m.feu);
      R.engines([[c - 24, 36.5, 2.2], [c - 12, 36.5, 2.6], [c + 12, 36.5, 2.6], [c + 24, 36.5, 2.2]]);
      return [];
    },
    radar: (R, m, c) => {
      R.poly(half(c, [[0, 27], [32, 31], [32, 37], [0, 40]]), 5, 2.6, m.hull);
      R.poly(half(c, [[0, 58], [14, 61], [14, 65], [0, 66]]), 4, 2, m.hull);
      for (const s of [-1, 1]) {
        R.poly([[c + s * 32, 31], [c + s * 28, 30.6], [c + s * 28, 37], [c + s * 32, 37]], 6, 1, m.mark, 4);
        const x = c + s * 15; R.poly([[x - 2, 22], [x + 2, 22], [x + 3, 25], [x + 3, 36], [x - 3, 36], [x - 3, 25]], 7, 2.5, m.hull, 4); R.dome(x, 23.5, 1.8, 1.2, 5.5, 6.5, 'black');
        R.box(c + s * 13 - 1, 57, 2, 9, 7, .6, m.hull2, 3);
      }
      R.poly(half(c, [[0, 3], [4, 8], [5.5, 16], [5.5, 50], [3.5, 62], [0, 65]]), 7, 4, m.hull);
      R.dome(c, 10, 3, 4.5, 7, 10, 'glass'); R.box(c - 2, 37, 4, 6, 9, 1, m.hull2, 6);
      R.dome(c, 46, 10.5, 10.5, 9, 14, m.hull2); R.box(c - 9, 45, 18, 2.4, 14.4, .6, m.mark, 12);
      R.greebles(16, 7, [6, 26, 57, 12]);
      R.lights([[c - 31, 34], [c + 31, 34], [c, 30]], m.feu);
      R.engines([[c - 15, 37, 2.2], [c + 15, 37, 2.2]]);
      return [];
    },
    jet: (R, m, c) => {
      R.poly(half(c, [[0, 16], [5, 18], [30, 35], [30, 40], [5, 41], [0, 41]]), 4, 2.5, m.hull);
      for (const s of [-1, 1]) {
        R.poly([[c + s * 24, 35], [c + s * 12, 27], [c + s * 10, 30], [c + s * 21, 38]], 5, 1.4, m.mark, 3);
        R.box(c + s * 28 - 1, 27, 2, 13, 6.2, .7, m.deck, 3);
        R.poly([[c + s * 4, 36], [c + s * 12, 41], [c + s * 12, 44], [c + s * 4, 44]], 5, 1, m.hull2, 3);
      }
      R.poly(half(c, [[0, 1], [3, 6], [4.5, 16], [4.5, 40], [3.5, 44], [0, 44]]), 7, 3, m.hull);
      R.poly(half(c, [[0, 18], [2.5, 21], [2.5, 38], [0, 40]]), 9, 1.6, m.hull2, 6);
      R.dome(c, 12, 2.6, 5.5, 7, 10.5, 'glass');
      R.greebles(8, 11, [10, 24, 49, 14]);
      R.lights([[c - 29, 39], [c + 29, 39]], m.feu);
      R.engines([[c - 2, 44.6, 2], [c + 2, 44.6, 2]]);
      return [];
    },
    heli: (R, m, c) => {
      for (const s of [-1, 1]) R.box(c + s * 8 - .8, 4, 1.6, 19, 2.6, .6, m.hull2);
      R.poly(half(c, [[0, 18], [2.4, 20], [1.5, 40], [0, 41]]), 4.5, 1.6, m.hull);
      R.box(c - 1, 36, 2, 9, 6, .6, m.hull2, 3);
      R.dome(c, 13, 7, 9.5, 0, 8, m.hull); R.dome(c, 8, 4.8, 4.2, 4, 9, 'glass');
      R.box(c - 3, 15, 6, 6, 10, 1.2, m.hull2, 7); R.box(c - 1.2, 26, 2.4, 4, 5.4, .6, m.mark, 4);
      R.lights([[c, 40]], m.feu);
      return [['rotor', c, 15, 12, 1]];
    },
  },
  // B. FURTIF : facettes, aile volante en dents de scie, ailes inversées, fenestron
  b: {
    bomb: (R, m, c) => {
      R.poly(half(c, [[0, 2], [8, 14], [33, 32], [33, 36], [27, 39], [22, 36], [16, 40], [9, 38], [6, 52], [0, 54]]), 6, 10, m.hull);
      R.poly(half(c, [[0, 30], [6, 34], [6, 78], [4, 86], [0, 88]]), 6, 5, m.hull);
      R.poly(half(c, [[0, 72], [5, 72], [17, 81], [17, 86], [5, 84], [0, 84]]), 4.5, 3, m.hull2);
      R.poly(half(c, [[0, 6], [3, 12], [4.5, 40], [0, 46]]), 9, 4, m.hull2, 5);
      R.poly(half(c, [[0, 9], [2.6, 12], [2.6, 17], [0, 18]]), 10, 1, 'glass', 8);
      for (const s of [-1, 1]) {
        R.poly([[c + s * 5, 20], [c + s * 10, 24], [c + s * 9, 27], [c + s * 5, 25]], 7.5, 1, 'black', 5);
        R.poly([[c + s * 20, 24.2], [c + s * 31, 32], [c + s * 30, 33.4], [c + s * 19, 25.6]], 6.5, .8, m.mark, 4);
        R.poly([[c + s * 6, 52], [c + s * 6, 76], [c + s * 5, 76], [c + s * 5, 52]], 6.4, .5, m.mark, 5);
      }
      R.box(c - 11, 37, 22, 1.8, 6.4, .5, 'black', 4);
      R.greebles(8, 31, [12, 20, 45, 20]);
      R.lights([[c - 32, 34], [c + 32, 34], [c, 60]], m.feu);
      R.engines([[c - 9, 38.5, 1.8], [c - 4, 38.5, 1.8], [c + 4, 38.5, 1.8], [c + 9, 38.5, 1.8]]);
      return [];
    },
    radar: (R, m, c) => {
      R.poly(half(c, [[0, 27], [33, 34], [33, 38], [0, 41]]), 4, 3, m.hull);
      R.dome(c, 34, 22, 14, 1, 8, m.hull);
      R.poly(half(c, [[0, 3], [4, 10], [6, 24], [0, 26]]), 7, 5, m.hull);
      R.poly(half(c, [[0, 44], [5, 46], [4, 64], [0, 66]]), 6, 4, m.hull);
      for (const s of [-1, 1]) R.poly([[c + s * 4, 55], [c + s * 11, 63], [c + s * 10, 66], [c + s * 3, 62]], 8, 1, m.hull2, 4);
      R.dome(c, 34, 15, 9.5, 7, 10.5, m.hull2);
      R.box(c - 15, 33.2, 30, 1.6, 10.6, .4, m.mark, 9.5);
      R.dome(c, 34, 3, 3, 10, 12.5, 'glass');
      R.poly(half(c, [[0, 8], [2.4, 11], [2.4, 16], [0, 17]]), 8, 1, 'glass', 6);
      R.greebles(6, 33, [16, 20, 37, 8]);
      R.lights([[c - 32, 36], [c + 32, 36], [c - 18, 34], [c + 18, 34]], m.feu);
      R.engines([[c - 2.5, 66, 1.8], [c + 2.5, 66, 1.8]]);
      return [];
    },
    jet: (R, m, c) => {
      R.poly(half(c, [[0, 36], [6, 35], [31, 24], [33, 31], [11, 45], [0, 45]]), 5, 3, m.hull);
      R.poly(half(c, [[0, 12], [12, 17], [12, 20], [0, 19]]), 5.5, 1.5, m.hull2, 3);
      R.poly(half(c, [[0, 1], [3, 6], [5, 14], [6, 30], [5, 44], [0, 45]]), 7, 4, m.hull);
      for (const s of [-1, 1]) {
        R.poly([[c + s * 5, 33], [c + s * 10, 39], [c + s * 9, 42], [c + s * 4, 39]], 8.5, 1, m.hull2, 5);
        R.poly([[c + s * 5, 16], [c + s * 8, 18], [c + s * 8, 24], [c + s * 5, 23]], 7.5, 1, 'black', 5);
        R.poly([[c + s * 13, 35.6], [c + s * 27, 28], [c + s * 28, 30], [c + s * 14, 37.6]], 6, .8, m.mark, 4.5);
      }
      R.dome(c, 10, 2.4, 4.6, 7, 10, 'glass');
      R.greebles(5, 37, [26, 22, 17, 12]);
      R.lights([[c - 32, 26], [c + 32, 26]], m.feu);
      R.engines([[c - 2.5, 45, 2.2], [c + 2.5, 45, 2.2]]);
      return [];
    },
    heli: (R, m, c) => {
      R.poly(half(c, [[0, 17], [9.5, 18], [9.5, 21], [0, 22]]), 4, 1.2, m.hull2, 2);
      R.poly(half(c, [[0, 2], [4, 6], [6, 14], [5, 22], [2.5, 27], [2, 36], [0, 38]]), 7, 4, m.hull);
      R.dome(c, 40, 4.4, 5.2, 0, 6, m.hull2); R.holeE(c, 40, 1.8, 2.6, 3, 'hull2');
      R.dome(c, 7, 2.6, 3, 6, 9, 'glass'); R.dome(c, 13, 2.6, 3, 6, 9.4, 'glass');
      R.box(c - .6, 24, 1.2, 10, 7.4, .4, m.mark, 6);
      R.lights([[c - 9, 19.5], [c + 9, 19.5]], m.feu);
      return [['rotor', c, 16, 12, 1]];
    },
  },
  // C. HÉLICES : bipoutre, grosses hélices, antenne tournante, hélices contrarotatives, rotors coaxiaux
  c: {
    bomb: (R, m, c) => {
      R.poly(half(c, [[0, 26], [33, 29], [33, 37], [0, 38]]), 5, 3, m.hull);
      R.box(c - 16, 78, 32, 6, 5, 2, m.hull, 2);
      const an = [];
      for (const s of [-1, 1]) {
        const b = c + s * 13;
        R.poly([[b - 2.5, 14], [b + 2.5, 14], [b + 3, 24], [b + 2.5, 80], [b - 2.5, 80], [b - 3, 24]], 7, 3, m.hull, 2);
        R.dome(b, 16, 4, 4, 5, 9.5, m.hull2); R.dome(b, 12.5, 1.8, 1.8, 8, 10.5, m.mark);
        R.box(b - 1, 73, 2, 13, 9.5, .6, m.hull2, 5); R.box(b - 2.5, 60, 5, 2.4, 7.5, .6, m.mark, 6);
        R.poly([[c + s * 33, 29], [c + s * 28, 28.6], [c + s * 28, 37.4], [c + s * 33, 37]], 6, 1, m.mark, 4);
        an.push(['helice', b, 11, 9, s]);
      }
      R.poly(half(c, [[0, 4], [4, 8], [5.5, 18], [5.5, 46], [3, 56], [0, 58]]), 7, 4, m.hull);
      R.dome(c, 9, 4, 5, 6, 9.5, 'glass');
      R.dome(c, 40, 3.5, 3.5, 8, 11.5, m.hull2); R.box(c - 2.2, 32, 1.2, 7, 11.5, .5, m.hull2, 9); R.box(c + 1, 32, 1.2, 7, 11.5, .5, m.hull2, 9);
      R.dome(c, 54, 2.6, 2.6, 6, 8.4, 'glass');
      R.greebles(22, 41, [6, 18, 57, 64]);
      R.lights([[c - 32, 33], [c + 32, 33], [c, 22]], m.feu);
      return an;
    },
    radar: (R, m, c) => {
      R.poly(half(c, [[0, 28], [33, 30], [33, 37], [0, 38]]), 4.5, 2.5, m.hull);
      R.poly(half(c, [[0, 56], [12, 60], [12, 64], [0, 64]]), 4, 2, m.hull);
      const an = [];
      for (const s of [-1, 1]) {
        const b = c + s * 18;
        R.poly([[b - 2.5, 22], [b + 2.5, 22], [b + 3, 26], [b + 3, 39], [b - 3, 39], [b - 3, 26]], 7.5, 2.5, m.hull2, 3);
        R.dome(b, 21.5, 1.8, 1.8, 7, 9, m.mark);
        R.box(c + s * 12 - 1, 54, 2, 12, 7, .6, m.hull2, 3);
        an.push(['helice', b, 20, 7.5, s]);
      }
      R.poly(half(c, [[0, 2], [5, 8], [7.5, 20], [7.5, 48], [4, 60], [0, 64]]), 8, 6, m.hull);
      R.dome(c, 9, 3.5, 4, 7, 10, 'glass');
      R.dome(c, 42, 5, 5, 8, 11.5, m.hull2);
      R.box(c - 7.5, 50, 15, 2.2, 8.6, .6, m.mark, 7);
      R.greebles(18, 43, [8, 14, 53, 44]);
      R.lights([[c - 32, 33], [c + 32, 33]], m.feu);
      an.push(['antenne', c, 42, 15]);
      return an;
    },
    jet: (R, m, c) => {
      R.poly(half(c, [[0, 22], [22, 24], [31, 28], [33, 33], [30, 38], [0, 40]]), 4.5, 3, m.hull);
      R.poly(half(c, [[0, 39], [10, 40], [10, 44], [0, 45]]), 4, 1.5, m.hull);
      R.poly(half(c, [[0, 6], [5.5, 10], [5, 30], [2.5, 44], [0, 45]]), 7, 4, m.hull);
      R.dome(c, 8, 6, 5.5, 3, 9, m.hull2); R.dome(c, 3, 2.2, 2.2, 7, 10, m.mark);
      for (const s of [-1, 1]) {
        R.box(c + s * 12 - .6, 17, 1.2, 8, 6, .4, m.hull2, 4);
        R.poly([[c + s * 33, 33], [c + s * 29, 27], [c + s * 27, 28], [c + s * 30, 37]], 5.6, .8, m.mark, 4);
        for (const y of [11, 13, 15]) R.box(c + s * 5.5 - .5, y, 1, 1, 7.4, .3, 'black', 6);
      }
      R.dome(c, 22, 3, 4.5, 7, 10.5, 'glass');
      R.greebles(10, 47, [8, 26, 53, 10]);
      R.lights([[c - 32, 33], [c + 32, 33]], m.feu);
      return [['helice', c, 2, 10, 1], ['helice', c, 2.4, 9, -1]];
    },
    heli: (R, m, c) => {
      R.box(c - 8, 36, 16, 3, 5, 1, m.hull2, 2);
      for (const s of [-1, 1]) { R.box(c + s * 8 - 1, 33, 2, 9, 7, .6, m.hull2, 3); R.box(c + s * 6 - .7, 6, 1.4, 16, 2.6, .5, m.hull2); }
      R.poly(half(c, [[0, 22], [2.6, 24], [2, 38], [0, 39]]), 5, 1.8, m.hull);
      R.dome(c, 14, 8, 11, 0, 9, m.hull);
      R.dome(c, 8, 6, 5, 4, 10, 'glass');
      R.box(c - 1.2, 28, 2.4, 3, 5.6, .5, m.mark, 4);
      R.lights([[c, 38]], m.feu);
      return [['rotor', c, 15, 12, 1], ['rotor', c, 15, 10.5, -1]];
    },
  },
  // D. CANONNIÈRE : coques blindées comme les frégates de Nebula, tourelles, nacelles, dômes de détection
  d: {
    bomb: (R, m, c) => {
      R.poly(half(c, [[0, 28], [30, 30], [33, 34], [33, 40], [0, 42]]), 4.5, 3, m.hull2);
      R.poly(half(c, [[0, 72], [17, 76], [17, 86], [0, 88]]), 6, 2.5, m.hull2);
      for (const s of [-1, 1]) {
        R.poly([[c + s * 26, 24], [c + s * 31, 26], [c + s * 31, 42], [c + s * 26, 42]].map(p => p), 7.5, 2, m.hull, 3);
        R.box(Math.min(c + s * 27, c + s * 30), 27, 3, 4, 8, 1, m.mark, 6);
        R.box(c + s * 10 - 1.5, 48, 3, 18, 7.2, 1, m.mark, 5);
      }
      R.poly(half(c, [[0, 2], [7, 10], [12, 30], [12.5, 70], [10, 84], [0, 86]]), 6, 4, m.hull);
      R.poly(half(c, [[0, 24], [6, 28], [7, 66], [0, 70]]), 9, 2.5, m.deck, 6);
      R.box(c - 5, 34, 10, 14, 13, 2, m.hull, 9); R.box(c - 4, 36, 8, 2.6, 14.4, 1, 'glass', 12);
      R.dome(c, 16, 4, 4, 6, 10, m.hull2); R.box(c - 1, 5, 2, 10, 10, .6, m.hull2, 8);
      R.dome(c, 58, 4.5, 4.5, 9, 13, m.hull2); R.box(c - 1, 60, 2, 10, 13, .6, m.hull2, 10);
      R.greebles(40, 51, [8, 20, 53, 64]);
      R.lights([[c - 8, 26], [c + 8, 26], [c - 8, 70], [c + 8, 70], [c - 31, 30], [c + 31, 30]], m.feu);
      R.engines([[c - 12, 86.5, 3], [c, 88, 3.5], [c + 12, 86.5, 3], [c - 28.5, 42.5, 2.4], [c + 28.5, 42.5, 2.4]]);
      return [];
    },
    radar: (R, m, c) => {
      R.poly(half(c, [[0, 29], [26, 30], [26, 38], [0, 39]]), 5, 2.5, m.hull2);
      for (const s of [-1, 1]) { R.dome(c + s * 28, 34, 5, 5, 3, 10, m.hull); R.dome(c + s * 28, 34, 2.2, 2.2, 10, 11.6, 'glass'); R.box(c + s * 20 - 1, 30, 2, 8, 6.4, .6, m.mark, 5); }
      R.poly(half(c, [[0, 2], [6, 10], [8, 24], [8, 50], [5, 64], [0, 66]]), 6, 4, m.hull);
      R.dome(c, 34, 7, 7, 6, 13, m.hull2); R.box(c - 7, 33, 14, 2, 13.2, .5, m.mark, 11);
      R.box(c - .6, 44, 1.2, 12, 9, .4, m.hull2, 7); R.dome(c, 12, 2.6, 4, 6, 9, 'glass');
      R.greebles(26, 53, [6, 12, 57, 50]);
      R.lights([[c - 5, 20], [c + 5, 20], [c - 5, 50], [c + 5, 50]], m.feu);
      R.engines([[c - 3.5, 66, 2.4], [c + 3.5, 66, 2.4]]);
      return [];
    },
    jet: (R, m, c) => {
      R.poly(half(c, [[0, 30], [33, 34], [33, 40], [0, 40]]), 4, 2, m.hull);
      for (const s of [-1, 1]) {
        R.poly([[c + s * 14, 24], [c + s * 22, 24], [c + s * 23, 44], [c + s * 13, 44]], 7.5, 2.5, m.hull2, 3);
        R.box(Math.min(c + s * 15, c + s * 21), 24, 6, 2, 8, .6, 'black', 6);
        R.box(c + s * 31 - 1, 24, 2, 14, 5.6, .5, m.hull2, 3);
        R.box(Math.min(c + s * 15, c + s * 21), 33, 6, 2, 8, .6, m.mark, 6.5);
      }
      R.poly(half(c, [[0, 1], [5, 8], [9, 24], [10, 44], [0, 45]]), 7, 5, m.hull);
      R.dome(c, 11, 2.6, 4.6, 7, 10.5, 'glass'); R.box(c - .6, 0, 1.2, 5, 7, .4, m.hull2, 5);
      R.greebles(12, 57, [8, 22, 53, 20]);
      R.lights([[c - 31, 39], [c + 31, 39]], m.feu);
      R.engines([[c - 18, 44.6, 3], [c + 18, 44.6, 3]]);
      return [];
    },
    heli: (R, m, c) => {
      R.poly(half(c, [[0, 16], [10, 17], [10, 21], [0, 22]]), 5, 1.2, m.hull2, 3);
      for (const s of [-1, 1]) { R.box(c + s * 9 - 1.5, 14, 3, 9, 7, 1, m.hull, 4); R.dome(c + s * 9, 14.5, 1.2, 1, 7, 7.6, 'black'); }
      R.poly(half(c, [[0, 1], [3, 4], [5, 12], [5, 24], [2.4, 28], [1.8, 40], [0, 41]]), 7, 3.5, m.hull);
      R.dome(c, 6, 2.6, 3, 6, 9, 'glass'); R.dome(c, 12, 2.8, 3.2, 6, 10, 'glass');
      R.box(c - .6, 0, 1.2, 3, 7, .4, m.hull2, 5); R.box(c - 1, 37, 2, 7, 6, .6, m.hull2, 3);
      R.box(c - 2.4, 30, 4.8, 2, 4.8, .5, m.mark, 3);
      R.lights([[c, 40]], m.feu);
      return [['rotor', c, 17, 12, 1]];
    },
  },
};
const SIZE = { bomb: [69, 92], radar: [69, 69], jet: [69, 46], heli: [23, 46] };
window.EscAvions = { NV, STYLES, AVIONS, SIZE, rotBuilder, PIRATE };
})();

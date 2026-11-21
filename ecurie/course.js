/* Écurie miniature : la simulation d'une course (pur calcul, sans Three.js : aussi sous Node).
   Voiture : vmax (m/s), acc (m/s²), grip (g). Pilote : tal, cst, agr (0 à 1). Reprise de la maquette 6.
   Course.creer(circuit, grille, {tours, rng}) puis Course.pas(C, dt) à chaque image, ou Course.finir(C) pour le résultat direct. */
(function (W) {
  const FREIN = 13, LONG = 4.8, LARG = 2.25, COTE = 3.3, VLAT = 3.2, BORD = 3.7, DT = 1 / 30;
  function creer(K, grille, o = {}) {
    const rng = o.rng || Math.random, tours = o.tours || 8;
    // qualifications : un tour lancé estimé (voiture, talent, un peu de hasard selon la constance) ; le plus rapide part devant
    const quali = grille.map(g => g.vmax * .3 + g.grip * 20 + g.tal * 6 + (rng() - .5) * (5 - 3 * g.cst));
    const ordreDep = grille.map((g, k) => k).sort((a, b) => quali[b] - quali[a]);
    const V = grille.map((g, k) => { const rang = ordreDep.indexOf(k), col = rang % 2 ? 2.4 : -2.4;
      // casse mécanique tirée d'avance (fiabilité) : à quel moment de la course
      const casse = rng() < (g.panne || 0) ? .1 + rng() * .8 : null;
      return Object.assign({}, g, {k, rang, s: K.DEPART - 5 - rang * 7.5, col, lat: 0, cibleLat: 0, dec: col, v: 0, cibleV: 0, erreur: 0, sortie: false,
        bloque: 0, mem: 0, lacet: 0, tang: 0, freine: false, fini: false, abandon: null, casse, temps: 0, depass: 0, erreurs: 0, sorties: 0, x: 0, z: 0, h: 0}); });
    const C = {K, V, rng, tours, t: -4.5, ordre: V.slice().sort((a, b) => b.s - a.s), EV: [], journal: [], arrivee: [], fin: false, tFin: null, depart: ordreDep};
    placer(C); return C;
  }
  const evenement = (C, x) => { C.EV.unshift({x, t: C.t}); C.EV.length = Math.min(C.EV.length, 3); C.journal.push(x); };
  const vVirage = (K, i, g) => Math.sqrt(g * 9.81 * Math.min(K.RAYON[((i % K.NP) + K.NP) % K.NP], 400));
  const cote = (a, b) => Math.abs(a.dec - b.dec) < LARG;
  const enPiste = v => !v.abandon;
  function placer(C) { for (const v of C.V) { const [x, z, h] = C.K.at(v.s, v.dec); v.x = x; v.z = z; v.h = h; } }
  function pas(C, dt) {
    if (C.fin) return; const K = C.K, V = C.V, R = C.rng, NP = K.NP; C.t += dt; const t = C.t;
    if (t < 0) { placer(C); return; }
    const fin = K.DEPART + C.tours * K.TOT;
    for (const v of V) {
      if (v.abandon) { v.v = Math.max(0, v.v - 9 * dt); v.cibleV = 0; continue; }
      // casse mécanique
      if (v.casse != null && !v.fini && (v.s - K.DEPART) / (C.tours * K.TOT) > v.casse) { v.abandon = 'CASSE'; v.casse = null; evenement(C, `ABANDON DE ${v.nom} : CASSE MECANIQUE`); continue; }
      const g = v.grip * (.94 + .08 * v.tal) * (1 - .05 * Math.min(1, Math.abs(v.lat) / COTE)); let cible = v.vmax * (.97 + .03 * v.tal); const i0 = K.idx(v.s);
      for (let d = 0; d < 70; d += 3) { const vc = vVirage(K, i0 + d, g); cible = Math.min(cible, Math.sqrt(vc * vc + 2 * FREIN * (.9 + .1 * v.tal) * (v.mem > 0 ? 1 + .12 * v.agr : 1) * d)); }
      for (const o of V) if (o !== v && enPiste(o)) { const e = o.s - v.s; if (e > 0 && e < 20 && cote(o, v) && K.RAD[i0] > 1e8) cible *= 1.07; }
      if (v.erreur > 0) { v.erreur -= dt; cible *= v.sortie ? .45 : .6; if (v.erreur <= 0) v.sortie = false; }
      else if (t > 4 && !v.fini && R() < (1 - v.cst) * .035 * dt) { v.erreur = 1.2 + R(); let virage = false; for (let d = 0; d < 25; d += 5) if (K.RAD[(i0 + d) % NP] < 1e8) virage = true;
        v.sortie = virage && R() < .6;
        if (v.sortie) { v.sorties++; if (R() < .12) { v.abandon = 'ACCIDENT'; evenement(C, `ACCIDENT ! ${v.nom} ABANDONNE`); continue; } evenement(C, `SORTIE DE PISTE DE ${v.nom} !`); }
        else { v.erreurs++; evenement(C, `ERREUR DE ${v.nom} !`); } }
      v.cibleV = cible; if (v.v < cible) v.v = Math.min(cible, v.v + v.acc * (1 - v.v / (v.vmax * 1.1)) * dt * 1.6); else v.v = Math.max(cible, v.v - FREIN * 1.3 * dt);
      v.cibleLat = v.mem > 0 || v.bloque > 0 ? v.cibleLat : 0;
    }
    // attaques et défenses : l'attaquant quitte la trajectoire du côté où il y a de la place
    const O = V.filter(enPiste).sort((a, b) => b.s - a.s);
    for (let i = 1; i < O.length; i++) { const b = O[i], a = O[i - 1], e = a.s - b.s;
      if (e < 10 && cote(a, b)) {
        const plusVite = b.cibleV > a.v + .6 || b.v > a.v + .8;
        if (plusVite && !b.fini && b.mem <= 0 && R() < b.agr * dt * 4) { const l = K.ligne(b.s), cote1 = l > 0 ? -COTE : COTE;
          const ok = c => Math.abs(l + c) <= BORD + .01 && O.every(o => o === b || Math.abs(o.s - b.s) > LONG + 1 || Math.abs(o.dec - (l + c)) >= LARG);
          let virage = false; { const ib = K.idx(b.s); for (let d = 15; d < 60; d += 5) if (K.RAD[(ib + d) % NP] < 1e8) virage = true; }
          const c = virage && ok(COTE) ? COTE : ok(cote1) ? cote1 : ok(-cote1) ? -cote1 : 0;
          if (c) { b.cibleLat = c; b.mem = 4; if (a.bloque <= 0 && !a.fini && R() < a.agr * .3) { a.cibleLat = c * .7; a.bloque = 2.5; evenement(C, `${a.nom} FERME LA PORTE A ${b.nom}`); } } }
        if (Math.abs(a.dec - b.dec) < LARG) b.v = Math.min(b.v, a.v + (e - 6.5) * .8); } }
    for (const v of V) { v.mem -= dt; v.bloque -= dt; v.s += v.v * dt;
      if (!v.fini && !v.abandon && v.s >= fin) { v.fini = true; v.temps = t; C.arrivee.push(v);
        if (C.arrivee.length === 1) { C.tFin = t; evenement(C, `${v.nom} GAGNE LE ${K.nom} !`); } } }
    // pas de voitures qui se traversent
    const P2 = V.filter(enPiste).sort((a, b) => b.s - a.s);
    for (let i = 1; i < P2.length; i++) for (let j = 0; j < i; j++) { const a = P2[j], b = P2[i]; if (a.s - b.s < LONG && cote(a, b)) { b.s = a.s - LONG; b.v = Math.min(b.v, a.v); } }
    // déplacement latéral progressif, bloqué si la place est prise
    for (const v of V) { const l = K.ligne(v.s); let vise = Math.max(-BORD, Math.min(BORD, l + v.cibleLat));
      const parcouru = v.s - K.DEPART; if (parcouru < 110) { const w = Math.max(0, Math.min(1, (parcouru - 15) / 95)); vise = v.col * (1 - w) + vise * w; }
      if (v.sortie) vise = -5.6; if (v.abandon) vise = -6.5;
      const pasL = Math.max(-VLAT * dt, Math.min(VLAT * dt, vise - v.dec)), nd = v.dec + pasL;
      const gene = !v.abandon && V.some(o => o !== v && enPiste(o) && Math.abs(o.s - v.s) < LONG + .4 && Math.abs(o.dec - nd) < LARG && Math.abs(o.dec - nd) < Math.abs(o.dec - v.dec));
      if (!gene) { v.lat = nd - l; v.dec = nd; } else v.lat = v.dec - l;
      const [x, z, h] = K.at(v.s, v.dec); v.x = x; v.z = z; v.h = h;
      v.lacet += ((Math.atan2(gene ? 0 : pasL, Math.max(.01, v.v * dt))) - v.lacet) * Math.min(1, dt * 8);
      v.freine = v.v > v.cibleV + .4 || v.erreur > 0 || (!!v.abandon && v.v > 0);
      v.tang += ((v.freine ? .022 : v.v < v.cibleV - 1 ? -.012 : 0) - v.tang) * Math.min(1, dt * 6); }
    // classement (marge de 2,5 m : sinon deux voitures côte à côte s'échangent la place à chaque image)
    const avant = C.ordre; let ordre = avant.slice();
    for (let p = 0; p < 3; p++) for (let i = 1; i < ordre.length; i++) if (ordre[i].s > ordre[i - 1].s + 2.5 && !ordre[i - 1].fini && !ordre[i].abandon) { const x = ordre[i]; ordre[i] = ordre[i - 1]; ordre[i - 1] = x; }
    // arrivés devant (dans l'ordre d'arrivée), abandons derrière
    ordre = C.arrivee.concat(ordre.filter(v => !v.fini && !v.abandon), ordre.filter(v => v.abandon && !v.fini));
    if (t > 3) ordre.forEach((v, i) => { const j = avant.indexOf(v); if (j === i + 1 && !v.fini && !avant[i].abandon) { v.depass++; evenement(C, `DEPASSEMENT ! ${v.nom} PASSE ${avant[i].nom} (P${i + 1})`); } });
    C.ordre = ordre;
    const restants = V.filter(v => !v.fini && !v.abandon).length;
    if (C.tFin != null && (restants === 0 || t > C.tFin + 40)) C.fin = true;
    if (t > 900) C.fin = true; // sécurité
  }
  function finir(C) { let n = 0; while (!C.fin && n++ < 200000) pas(C, DT); return C; }
  // tour en cours (du premier), pour l'affichage
  const tour = C => Math.min(C.tours, Math.max(1, Math.floor((C.ordre[0].s - C.K.DEPART) / C.K.TOT) + 1));
  W.Course = {creer, pas, finir, tour, DT};
  if (typeof window !== 'undefined') window.Course = W.Course; // déclaré pour l'analyse du code (lint.js)
})(typeof window !== 'undefined' ? window : globalThis);

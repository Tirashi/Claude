/* Écurie miniature : les circuits, posés « à la tortue » tuile par tuile (Modular Roads).
   Pur calcul (pas de Three.js) : utilisable sous Node. 'S' = ligne droite de 12 m, 18 / 42 = virage de 90° de ce rayon. */
(function (W) {
  const CIRCUITS = [
    {k: 'ville', nom: 'GP de la Ville', plan: ['S','S','S','S',42,'S','S',18,'S','S','S','S','S','S','S','S',18,'S','S',42]},
    {k: 'port', nom: 'GP du Port', plan: ['S','S','S','S','S','S','S',42,'S',42,'S','S','S','S','S','S','S',18,'S','S','S','S','S',18]},
    {k: 'collines', nom: 'GP des Collines', plan: ['S','S','S','S',18,'S','S','S','S','S','S',18,18,'S',-18,'S','S','S','S',18,'S','S',18,'S','S','S']},
    {k: 'canal', nom: 'GP du Canal', plan: ['S','S',18,'S','S',18,-42,'S','S','S',18,'S','S','S','S','S',18,'S','S','S','S','S',18,-42,18,'S','S','S']},
    {k: 'parc', nom: 'GP du Parc', plan: ['S','S','S','S','S','S',42,'S','S','S',18,'S','S','S','S','S','S',42,'S','S','S',18]}
  ];
  const BORD = 3.7, LOC = {18: {e: [18, 12], R: 18}, 42: {e: [42, 36], R: 42}};
  const rot = (x, z, a) => [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
  function construire(def) {
    let px = 0, pz = 0, th = 0; const pts = [], RAD = [], SENS = [], tuiles = [];
    for (const p of def.plan) {
      if (p === 'S') {
        const dx = Math.cos(th), dz = Math.sin(th);
        tuiles.push({type: 'S', x: px + dx * 6, z: pz + dz * 6, ry: -(th - Math.PI / 2), th});
        for (let i = 0; i < 12; i++) { pts.push([px + dx * i, pz + dz * i]); RAD.push(1e9); SENS.push(0); }
        px += dx * 12; pz += dz * 12;
      } else if (p > 0) { // virage à gauche
        const L = LOC[p], phi = th - Math.PI, [ex, ez] = rot(L.e[0], L.e[1], phi);
        const cx = px + L.R * Math.cos(th + Math.PI / 2), cz = pz + L.R * Math.sin(th + Math.PI / 2), n = Math.round(L.R * Math.PI / 2);
        tuiles.push({type: 'C', R: L.R, x: px - ex, z: pz - ez, ry: -phi, cx, cz, a0: th - Math.PI / 2, a1: th, sens: 1});
        for (let i = 0; i < n; i++) { const a = th - Math.PI / 2 + i / n * Math.PI / 2; pts.push([cx + L.R * Math.cos(a), cz + L.R * Math.sin(a)]); RAD.push(L.R); SENS.push(1); }
        th += Math.PI / 2; px = cx + L.R * Math.cos(th - Math.PI / 2); pz = cz + L.R * Math.sin(th - Math.PI / 2);
      } else { // virage à droite : la même tuile, parcourue à l'envers (posée comme un virage à gauche qui part de la sortie)
        const L = LOC[-p], R = L.R, cx = px + R * Math.sin(th), cz = pz - R * Math.cos(th), n = Math.round(R * Math.PI / 2);
        const qx = cx + R * Math.cos(th), qz = cz + R * Math.sin(th), H = th + Math.PI / 2, phi = H - Math.PI, [ex, ez] = rot(L.e[0], L.e[1], phi);
        tuiles.push({type: 'C', R, x: qx - ex, z: qz - ez, ry: -phi, cx, cz, a0: th + Math.PI / 2, a1: th, sens: -1});
        for (let i = 0; i < n; i++) { const a = th + Math.PI / 2 - i / n * Math.PI / 2; pts.push([cx + R * Math.cos(a), cz + R * Math.sin(a)]); RAD.push(R); SENS.push(-1); }
        th -= Math.PI / 2; px = qx; pz = qz;
      }
    }
    const ferme = Math.hypot(px, pz) < .01 && Math.abs(((th % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) < .01;
    const NP = pts.length, Ls = [0];
    for (let i = 1; i <= NP; i++) { const a = pts[i - 1], b = pts[i % NP]; Ls.push(Ls[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
    const TOT = Ls[NP];
    const idx = s => { s = ((s % TOT) + TOT) % TOT; let lo = 0, hi = NP - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (Ls[m] <= s) lo = m; else hi = m - 1; } return lo; };
    const at = (s, dec = 0) => { const i = idx(s), a = pts[i], b = pts[(i + 1) % NP], f = (((s % TOT) + TOT) % TOT - Ls[i]) / (Ls[i + 1] - Ls[i]);
      const h = Math.atan2(b[1] - a[1], b[0] - a[0]); return [a[0] + (b[0] - a[0]) * f - Math.sin(h) * dec, a[1] + (b[1] - a[1]) * f + Math.cos(h) * dec, h]; };
    // ligne de départ : 6 m avant la fin de la plus longue ligne droite
    let DEPART = 0; { let best = 0, i = 0; while (i < NP) { if (RAD[i] > 1e8) { let j = i; while (j < NP && RAD[j] > 1e8) j++; if (j - i > best) { best = j - i; DEPART = Ls[j - 6]; } i = j; } else i++; } }
    // trajectoire idéale : extérieur avant le virage, corde au milieu, extérieur en sortie (intérieur : dec > 0 à gauche, dec < 0 à droite)
    const brut = new Float32Array(NP), OFF = new Float32Array(NP);
    { let i = 0; while (i < NP) { if (RAD[i] < 1e8) { let j = i; while (j < NP && RAD[j] < 1e8 && SENS[j] === SENS[i]) j++; const n = j - i, sg = SENS[i], ap = Math.min(BORD, 1.2 + 90 / RAD[i]);
        for (let k = i; k < j; k++) brut[k] = sg * ap * Math.sin(Math.PI * (k - i + .5) / n);
        const avant = Math.round(Math.min(34, RAD[i] * 1.4));
        for (let d = 1; d <= avant; d++) { const a = (i - d + NP) % NP, b = (j - 1 + d) % NP, f = -sg * BORD * Math.sin(Math.PI * d / (avant + 1));
          if (RAD[a] > 1e8 && Math.abs(f) > Math.abs(brut[a])) brut[a] = f; if (RAD[b] > 1e8 && Math.abs(f) > Math.abs(brut[b])) brut[b] = f; }
        i = j; } else i++; } }
    { const Wn = 9; for (let i = 0; i < NP; i++) { let s = 0; for (let d = -Wn; d <= Wn; d++) s += brut[(i + d + NP) % NP]; OFF[i] = Math.max(-BORD, Math.min(BORD, s / (2 * Wn + 1))); } }
    const ligne = s => { const i = idx(s), j = (i + 1) % NP, f = (((s % TOT) + TOT) % TOT - Ls[i]) / (Ls[i + 1] - Ls[i]); return OFF[i] + (OFF[j] - OFF[i]) * f; };
    const RAYON = new Float32Array(NP); for (let i = 0; i < NP; i++) RAYON[i] = RAD[i] < 1e8 ? RAD[i] + 2 * BORD + 2 : 1e9;
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const [x, z] of pts) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
    return {k: def.k, nom: def.nom, plan: def.plan, ferme, pts, RAD, SENS, NP, Ls, TOT, idx, at, DEPART, OFF, ligne, RAYON, tuiles,
      centre: [(x0 + x1) / 2, (z0 + z1) / 2], taille: Math.max(x1 - x0, z1 - z0), tours: Math.max(5, Math.round(3000 / TOT))}; // environ 3 km : 2 minutes de course
  }
  const cache = {};
  W.Circuits = {LISTE: CIRCUITS, BORD, get(k) { const d = CIRCUITS.find(c => c.k === k) || CIRCUITS[0]; return cache[d.k] || (cache[d.k] = construire(d)); }, construire};
  if (typeof window !== 'undefined') window.Circuits = W.Circuits; // déclaré pour l'analyse du code (lint.js)
})(typeof window !== 'undefined' ? window : globalThis);

/* =====================================================================
   MINEUR DE L'ESPACE · le CHANTIER : corvettes, tourelles et roches
   fabriquées avec le moteur de vaisseaux de Nebula (nebula/vaisseaux.js,
   non modifié). La géométrie est tournée AVANT l'éclairage : chaque angle
   est un vrai rendu (lumière fixe en haut à gauche), tracé à la demande,
   puis l'image est ramenée à la palette de la planète.
   Repris des maquettes 4 à 6 (maquettes/mineurs-d-etoiles-6.html).
   ===================================================================== */
'use strict';
const NV = window.NebulaVaisseaux, { builder, render, half, MAT } = NV, TAU = Math.PI*2;
Object.assign(MAT, {
  orange: { c: [190, 108, 44], spec: .35, plates: 0 }, blanc: { c: [150, 154, 160], spec: .4, plates: 0 }, sarcelle: { c: [58, 116, 124], spec: .35, plates: 0 },
  coque: { c: [92, 98, 108], spec: .35, plates: 0 }, coque2: { c: [62, 66, 74], spec: .3, plates: 0 }, pont: { c: [118, 120, 122], spec: .25, plates: 0 },
  roche: { c: [118, 110, 102], spec: .12, plates: 0 }, rocheB: { c: [124, 92, 70], spec: .12, plates: 0 },
});
const PALETTE = ['#f4f6fb', '#c9cde0', '#9ea4c2', '#71789c', '#4c5274', '#33374f', '#20223a', '#14152a',
  '#ffe08a', '#f2a94a', '#d0752c', '#8c4a24', '#5a2e1c', '#a8e6f0', '#4fa4b8', '#2f6a8a', '#7ab84a', '#c23a2e',
  '#d8c2aa', '#b0927a', '#86685a', '#5e4640', '#3c2c2c'].map(h => [1, 3, 5].map(k => parseInt(h.slice(k, k + 2), 16)));
function aplats(src, gain = 1.35){
  const [c, x] = NV.mk(src.width, src.height); x.drawImage(src, 0, 0); const d = x.getImageData(0, 0, c.width, c.height), p = d.data;
  for (let i = 0; i < p.length; i += 4){ if (!p[i+3]) continue; const r = p[i]*gain, g = p[i+1]*gain, b = p[i+2]*gain; let best = 0, bd = 1e9;
    for (let k = 0; k < PALETTE.length; k++){ const q = PALETTE[k], dd = (q[0] - r)**2*.3 + (q[1] - g)**2*.59 + (q[2] - b)**2*.11; if (dd < bd){ bd = dd; best = k; } }
    p[i] = PALETTE[best][0]; p[i+1] = PALETTE[best][1]; p[i+2] = PALETTE[best][2]; }
  x.putImageData(d, 0, 0); return c;
}
// constructeur tourné : on donne les coordonnées par rapport au centre du vaisseau, nez vers le haut
function tourne(B, a, o){
  const c = Math.cos(a), s = Math.sin(a), P = ([x, y]) => [o + x*c - y*s, o + x*s + y*c];
  const R = {
    poly(pts, top, bev, mat, base = 0){ B.poly(pts.map(P), top, bev, mat, base); return R; },
    box(x, y, w, h, top, bev, mat, base = 0){ return R.poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], top, bev, mat, base); },
    dome(cx, cy, rx, ry, base, top, mat){ if (Math.abs(rx - ry) < .01){ const [px, py] = P([cx, cy]); B.dome(px, py, rx, ry, base, top, mat); }
      else { const pts = []; for (let i = 0; i < 20; i++){ const t = i/20*TAU; pts.push([cx + Math.cos(t)*rx, cy + Math.sin(t)*ry]); } B.poly(pts.map(P), top, Math.min(rx, ry), mat, base); } return R; },
    holeE(cx, cy, rx, ry, d, mat){ const [px, py] = P([cx, cy]); B.holeE(px, py, rx, ry, d, mat); return R; },
    lights(pts, col){ B.lights(pts.map(P), col); return R; },
    engines(pts){ B.engines(pts.map(p => [...P(p), p[2]])); return R; },
    // rainure : creuse un trait dans la carte de hauteurs (plaques de coque), suit la rotation
    rainure(x1, y1, x2, y2, prof = .55){ const raw = B.raw || B, n = Math.ceil(Math.hypot(x2 - x1, y2 - y1)*2) + 1, vu = new Set();
      for (let i = 0; i <= n; i++){ const [px, py] = P([x1 + (x2 - x1)*i/n, y1 + (y2 - y1)*i/n]), xi = Math.floor(px), yi = Math.floor(py), k = yi*raw.w + xi;
        if (xi < 0 || yi < 0 || xi >= raw.w || yi >= raw.h || vu.has(k) || raw.H[k] <= 0) continue; vu.add(k); raw.H[k] -= prof; } return R; },
  }; return R;
}
const N_ANG = 64, L_NEF = 128;
const paresseux = f => { const t = []; return new Proxy(t, { get: (o, k) => { const i = typeof k === 'string' && /^\d+$/.test(k) ? +k : -1; if (i < 0) return o[k]; return o[i] || (o[i] = f(i)); } }); };
const nAng = a => ((Math.round(a/TAU*N_ANG) % N_ANG) + N_ANG) % N_ANG;
const ROUGE_FEU = [140, 230, 255];
const pont = (B, y, w, z) => { B.box(-w/2, y, w, 10, z, 1.5, 'coque2', z - 4); B.box(-w/2 + 1, y + 1, w - 2, 2.5, z + 1.5, 1, 'glass', z - 1); };
// --- les classes : coque, emplacements des tourelles, des réservoirs et des conteneurs (côté droit, recopiés à gauche)
// détails communs : rainures de plaques (traits en travers), aérations, bloc moteur, hublots
function plaques(B, ys, demi){ for (const y of ys) B.rainure(-demi(y), y, demi(y), y); }
const RELIEF = {
  eclaireur(B){ B.box(-1.5, -20, 3, 40, 8.4, .8, 'pont', 7); plaques(B, [-14, -4, 8, 18, 28], y => y < 20 ? 9.5 : 8.5);
    B.box(-7, 26, 14, 8, 9, 1.2, 'coque2', 6); for (const s of [-1, 1]){ B.holeE(s*5, 10, 1.6, 1.6, 1.4, 'black'); B.holeE(s*5, 16, 1.6, 1.6, 1.4, 'black'); B.rainure(s*11, 0, s*19, 2); B.rainure(s*11, 8, s*19, 10); }
    B.lights([[-3, -12], [3, -12], [-3, -6], [3, -6]], [255, 206, 140]); },
  prospecteur(B){ B.box(-2, -18, 4, 44, 8.4, .8, 'pont', 7); plaques(B, [-26, -14, -2, 10, 22, 32], y => y < -20 ? 9 : 11.5);
    B.box(-8, 30, 16, 9, 9.2, 1.2, 'coque2', 6); for (const s of [-1, 1]){ B.holeE(s*6, 2, 1.7, 1.7, 1.4, 'black'); B.holeE(s*6, 8, 1.7, 1.7, 1.4, 'black'); B.rainure(s*12, -2, s*23, 2); B.rainure(s*12, 12, s*23, 14); }
    B.box(-6, -40, 12, 3, 7.6, .8, 'hazard', 6.5); B.lights([[-4, -10], [4, -10], [-4, -4], [4, -4]], [255, 206, 140]); },
  pionniere(B){ for (const s of [-1, 1]){ for (const y of [-12, -2, 8, 18, 28]) B.rainure(s*6.5, y, s*13.5, y); B.holeE(s*10, 36, 1.6, 1.6, 1.4, 'black'); B.rainure(s*15, 0, s*26, 4); B.rainure(s*15, 12, s*26, 16); }
    B.box(-1.5, -24, 3, 50, 10.2, .8, 'coque', 9); B.box(-8, 36, 16, 9, 9, 1.2, 'coque2', 5); B.lights([[-3, 0], [3, 0], [-3, 8], [3, 8]], [255, 206, 140]); },
  escorte(B){ for (const s of [-1, 1]){ for (const y of [-30, -18, -6, 6]) B.rainure(s*5.5, y, s*(8 + Math.max(0, y + 14)*.4), y); B.rainure(s*11, 14, s*19, 22); B.holeE(s*7, 34, 1.6, 1.6, 1.4, 'black'); }
    B.box(-1.5, -24, 3, 44, 10.2, .8, 'coque', 9); B.box(-8, 32, 16, 9, 8.6, 1.2, 'coque2', 5); B.lights([[-2, -4], [2, -4], [-2, 2], [2, 2]], [255, 206, 140]); },
};
const CLASSES = {
  eclaireur: { nom: 'ECLAIREUR', aide: 'petite, une tourelle', prix: 0, soute: 4, carbu: 34, tourelles: [[0, 4], [0, -16]], base: 1, degats: 1,
    reservoirs: [[11, 24], [10, 30], [12, 17]], conteneurs: [[17, -8], [17, 3], [17, 14]],
    coque(B){ B.poly(half(0, [[0, -34], [6, -30], [9, -16], [10, 22], [8, 34], [0, 34]]), 7, 3.5, 'coque');
      B.dome(0, -32, 5, 5, 4, 9, 'blanc'); B.lights([[-2, -34], [2, -34]], ROUGE_FEU);
      for (const s of [-1, 1]) B.poly([[s*9, -10], [s*20, -4], [s*20, 14], [s*9, 18]], 6.5, 2, 'orange', 2);
      pont(B, -24, 10, 12); return [[-4, 35, 3.5], [4, 35, 3.5]]; } },
  prospecteur: { nom: 'PROSPECTEUR', aide: 'foreuse, deux tourelles sur caissons', prix: 150, soute: 6, carbu: 40, tourelles: [[19, 6], [-19, 6], [0, 24]], base: 2, degats: 1,
    reservoirs: [[13, 30], [11, 36], [14, 23]], conteneurs: [[0, 30], [0, 38], [0, 14]],
    coque(B){ B.poly([[-4, -38], [4, -38], [0, -49]], 6, 2, 'hazard', 3);
      B.poly(half(0, [[0, -40], [7, -36], [10, -20], [12, 26], [9, 40], [0, 40]]), 7, 3.5, 'coque');
      for (const s of [-1, 1]) B.poly([[s*10, -10], [s*24, -4], [s*24, 16], [s*11, 20]], 7, 2, 'coque2', 2);
      pont(B, -28, 12, 12); return [[-5, 41, 4], [5, 41, 4]]; } },
  pionniere: { nom: 'PIONNIERE', aide: 'polyvalente, quatre tourelles, pour la Lune', prix: 400, soute: 8, carbu: 50, tourelles: [[21, 8], [-21, 8], [0, -30], [0, 16]], base: 3, degats: 1,
    reservoirs: [[13, 30], [10, 40], [15, 25]], conteneurs: [[0, 30], [0, 38], [0, -14]],
    coque(B){ B.poly([[-4, -40], [4, -40], [0, -51]], 6, 2, 'hazard', 3);
      B.poly(half(0, [[0, -44], [6, -38], [9, -16], [14, 8], [14, 30], [9, 34], [8, 46], [0, 46]]), 6, 4, 'coque');
      B.poly(half(0, [[0, -28], [5, -24], [6, 28], [0, 30]]), 9, 2.5, 'pont', 6);
      for (const s of [-1, 1]) B.poly([[s*13, -8], [s*27, -2], [s*27, 18], [s*14, 22]], 7, 2, 'orange', 2);
      pont(B, -16, 8, 13); return [[-5, 47, 4], [5, 47, 4], [-20, 23, 2.5], [20, 23, 2.5]]; } },
  escorte: { nom: 'ESCORTE', aide: 'peu de soute, beaucoup de feu (defense)', prix: 700, soute: 3, carbu: 40, tourelles: [[0, -30], [0, 6], [15, 22], [-15, 22]], base: 3, degats: 2,
    reservoirs: [[11, 33], [10, 39], [19, 8]], conteneurs: [[0, 30], [0, 37], [0, 23]],
    coque(B){ B.poly(half(0, [[0, -48], [6, -38], [10, -14], [20, 12], [20, 26], [10, 30], [9, 44], [0, 44]]), 6, 4, 'coque');
      B.poly(half(0, [[0, -26], [5, -22], [6, 20], [0, 22]]), 9, 2.5, 'pont', 6);
      for (const s of [-1, 1]) B.box(s < 0 ? -18 : 14, 14, 4, 10, 8, 1, 'amber', 6);
      pont(B, -12, 8, 13); return [[-5, 45, 4], [5, 45, 4], [-16, 27, 2.5], [16, 27, 2.5]]; } },
};
// niveaux { reservoir, soute, canon } : ce qui se voit sur la coque
// n : niveaux VISIBLES (0 à 3) des réservoirs et de la soute ; nbT : nombre de tourelles (règles)
function construireNef(cl, n, nbT){
  const C = CLASSES[cl]; nbT = Math.min(C.tourelles.length, nbT || C.base);
  const frames = paresseux(k => {
    const B0 = builder(L_NEF, L_NEF), B = tourne(B0, k/N_ANG*TAU, L_NEF/2);
    const eng = C.coque(B); RELIEF[cl](B);
    for (let i = 0; i < n.reservoir; i++){ const [x, y] = C.reservoirs[i]; for (const s of [-1, 1]) B.dome(s*x, y, 3.5, 3.5, 3, 8, 'blanc'); }
    for (let i = 0; i < n.soute; i++){ const [x, y] = C.conteneurs[i]; if (x) for (const s of [-1, 1]) B.box(s*x - 3, y, 6, 8, 8, 1.2, i % 2 ? 'sarcelle' : 'orange', 4); else B.box(-6, y, 12, 7, 10, 1.2, i % 2 ? 'sarcelle' : 'orange', 6); }
    for (let i = 0; i < nbT; i++){ const [x, y] = C.tourelles[i]; B.dome(x, y, 5, 5, 7, 10, 'coque2'); }
    B.engines(eng);
    const r = render(B0, { seed: 5 }); return { img: aplats(r.img), engines: r.engines };
  });
  return { frames, tourelles: C.tourelles.slice(0, nbT) };
}
// tourelle : dôme et canon(s), un rendu par angle ; le canon s'allonge et se double avec le niveau
const TOURELLES = {};
function tourelle(niv){
  if (TOURELLES[niv]) return TOURELLES[niv];
  const fr = paresseux(k => { const B0 = builder(28, 28), B = tourne(B0, k/N_ANG*TAU, 14), lg = 8 + niv*2;
    B.dome(0, 0, 4.5, 4.5, 2, 6, 'blanc');
    if (niv >= 2){ B.box(-2.6, -lg - 3, 1.8, lg, 6, .6, 'pont', 4); B.box(.8, -lg - 3, 1.8, lg, 6, .6, 'pont', 4); } else B.box(-1, -lg - 3, 2, lg, 6, .6, 'pont', 4);
    return aplats(render(B0, { seed: 3 }).img); });
  return TOURELLES[niv] = fr;
}
// roches : polygone déchiqueté en relief (arêtes nettes), éclats et cratères ; 16 angles ; veines selon le minerai
const N_ROC = 24, nRoc = a => ((Math.round(a/TAU*N_ROC) % N_ROC) + N_ROC) % N_ROC;
function construireRoche(R, rayon, sorte){
  const L = Math.ceil(rayon*2 + 6), n = 9 + (R()*4|0), pts = [];
  for (let i = 0; i < n; i++){ const a = i/n*TAU + (R() - .5)*.4, rr = rayon*(.7 + R()*.3); pts.push([Math.cos(a)*rr, Math.sin(a)*rr]); }
  const eclats = []; for (let i = 0; i < 2; i++){ const a = R()*TAU, d = rayon*.35, m = 5 + (R()*2|0), q = []; for (let j = 0; j < m; j++){ const b = j/m*TAU, r2 = rayon*(.3 + R()*.15); q.push([Math.cos(a)*d + Math.cos(b)*r2, Math.sin(a)*d + Math.sin(b)*r2]); } eclats.push(q); }
  const crat = []; for (let i = 0, k = 1 + (R()*3|0); i < k; i++){ const a = R()*TAU, d = R()*rayon*.5; crat.push([Math.cos(a)*d, Math.sin(a)*d, 1.5 + R()*rayon*.15]); }
  const veines = []; for (let i = 0, k = Math.round(rayon*(sorte === 'or' ? 1.4 : .9)); i < k; i++){ const a = R()*TAU, d = Math.sqrt(R())*rayon*.75; veines.push([Math.cos(a)*d, Math.sin(a)*d, R()]); }
  const V = sorte === 'or' ? [[255, 224, 138], [242, 169, 74]] : [[208, 117, 44], [140, 74, 36]], mat = sorte === 'or' ? 'roche' : 'rocheB';
  const fr = paresseux(k => { const ang = k/N_ROC*TAU, B0 = builder(L, L), B = tourne(B0, ang, L/2);
    B.poly(pts, rayon*.5, rayon*.55, mat); for (const q of eclats) B.poly(q, rayon*.62, rayon*.2, mat, rayon*.3);
    for (const [x, y, r] of crat) B.holeE(x, y, r, r, 1.5, mat);
    const im = aplats(render(B0, { seed: 7 }).img, 1.25), x = im.getContext('2d'), d = x.getImageData(0, 0, L, L), p = d.data, c = Math.cos(ang), s = Math.sin(ang);
    for (const [vx, vy, vk] of veines){ const px = Math.round(L/2 + vx*c - vy*s), py = Math.round(L/2 + vx*s + vy*c), j = (py*L + px)*4; if (p[j+3]){ const col = V[vk < .6 ? 0 : 1]; p[j] = col[0]; p[j+1] = col[1]; p[j+2] = col[2]; } }
    x.putImageData(d, 0, 0); return im; });
  return { fr, L };
}

/* =====================================================================
   MINEUR DE L'ESPACE · la STATION : pièces façon ISS fabriquées avec le
   moteur de vaisseaux de Nebula (comme les corvettes), reprises de la
   maquette 6. La station grandit avec les modules achetés (e.station) ;
   elle tourne autour de la planète, son quai toujours tourné vers
   l'extérieur : 64 angles tracés à la demande, puis le petit reste tourné.
   ===================================================================== */
'use strict';
Object.assign(MAT, { solaire: { c: [44, 66, 120], spec: .9, plates: 0 }, vert: { c: [70, 120, 60], spec: .3, plates: 0 } });
const CHAUD = [255, 206, 140], FROID = [140, 230, 255];
const PIECES = {
  noyau(B, x, y){ B.dome(x, y, 30, 30, 2, 6, 'coque2'); B.holeE(x, y, 25, 25, 2.5, 'black'); B.dome(x, y, 20, 20, 4, 13, 'blanc');
    for (let i = 0; i < 4; i++){ const a = i*Math.PI/2 + Math.PI/4; B.box(x + Math.cos(a)*22 - 2.5, y + Math.sin(a)*22 - 2.5, 5, 5, 7, 1, 'coque', 3); }
    for (let i = 0; i < 12; i++){ const a = i/12*TAU; B.rainure(x + Math.cos(a)*9, y + Math.sin(a)*9, x + Math.cos(a)*19, y + Math.sin(a)*19, .45); }
    B.dome(x, y, 6, 6, 12, 16, 'glass'); B.lights([[x - 13, y], [x + 13, y], [x, y - 13], [x, y + 13]], CHAUD); },
  bras(B, x1, y1, x2, y2){ const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1)/d, uy = (y2 - y1)/d, nx = -uy*2.5, ny = ux*2.5;
    B.poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], 6, 1.2, 'coque', 2);
    for (let t = 6; t < d - 4; t += 8) B.rainure(x1 + ux*t + nx, y1 + uy*t + ny, x1 + ux*t - nx, y1 + uy*t - ny, .5); },
  habitat(B, x, y){ B.poly(half(x, [[0, y - 22], [6, y - 20], [8, y - 14], [8, y + 14], [6, y + 20], [0, y + 22]]), 9, 4, 'blanc', 2);
    for (let i = -2; i <= 2; i++) B.rainure(x - 8, y + i*8, x + 8, y + i*8, .5);
    B.lights([-15, -7, 1, 9, 17].flatMap(dy => [[x - 4, y + dy - 2], [x + 4, y + dy - 2]]), CHAUD); },
  solaire(B, x, y, horiz = true){ const w = horiz ? 54 : 18, h = horiz ? 18 : 54; B.box(x - w/2, y - h/2, w, h, 3.5, .8, 'solaire', 1);
    for (let i = 1; i < (horiz ? 6 : 2); i++) B.rainure(x - w/2 + i*w/(horiz ? 6 : 2), y - h/2, x - w/2 + i*w/(horiz ? 6 : 2), y + h/2, .6);
    for (let i = 1; i < (horiz ? 2 : 6); i++) B.rainure(x - w/2, y - h/2 + i*h/(horiz ? 2 : 6), x + w/2, y - h/2 + i*h/(horiz ? 2 : 6), .6); },
  hangar(B, x, y){ B.box(x - 20, y - 14, 40, 28, 10, 2.5, 'coque', 2); B.box(x - 12, y + 6, 24, 9, 6, 1, 'black', 1); B.box(x - 14, y + 4, 28, 2.5, 10.6, .6, 'hazard', 9.5);
    for (const s of [-1, 1]) B.rainure(x + s*6, y - 14, x + s*6, y + 4); B.box(x - 6, y - 10, 12, 6, 11.5, 1, 'coque2', 9.5); B.lights([[x - 16, y - 10], [x + 16, y - 10]], CHAUD); },
  raffinerie(B, x, y){ for (const [dx, dy] of [[-10, -6], [10, -6], [0, 10]]) { B.dome(x + dx, y + dy, 9, 9, 2, 10, 'orange'); B.rainure(x + dx - 8, y + dy, x + dx + 8, y + dy, .5); }
    B.box(x - 12, y - 1, 24, 3, 7, .6, 'coque2', 2); B.box(x - 1.5, y - 6, 3, 16, 7, .6, 'coque2', 2); },
  antenne(B, x, y){ B.box(x - 2, y - 2, 4, 16, 7, 1, 'coque2', 2); B.dome(x, y - 6, 9, 9, 3, 9, 'blanc'); B.holeE(x, y - 6, 6, 6, 3, 'blanc'); B.dome(x, y - 6, 1.5, 1.5, 8, 11, 'coque2'); B.lights([[x, y - 6]], FROID); },
  quai(B, x, y){ B.box(x - 30, y - 3, 60, 6, 6, 1.2, 'coque', 2); for (const dx of [-24, -8, 8, 24]){ B.box(x + dx - 3, y - 8, 6, 5, 7.5, 1, 'hazard', 5); B.lights([[x + dx, y + 1]], CHAUD); } },
};
Object.assign(MAT, { or_: { c: [196, 150, 70], spec: .6, plates: 0 } });
const ISS = {
  poutre(B, x1, x2, y){ B.box(x1, y - 4, x2 - x1, 8, 6, 1.2, 'coque', 2); for (let x = x1 + 4; x < x2; x += 8){ B.rainure(x, y - 4, x + 4, y + 4, .7); B.rainure(x + 4, y - 4, x, y + 4, .7); } B.rainure(x1, y, x2, y, .35); },
  aile(B, x, y, dir){ const L = 46, w = 12, y0 = dir < 0 ? y - 6 - L : y + 6;   // mât puis panneau doré quadrillé
    B.box(x - 1, Math.min(y, y0 + (dir < 0 ? L : 0)), 2, 6, 5, .5, 'coque2', 2);
    B.box(x - w/2, y0, w, L, 3.5, .8, 'solaire', 1); B.rainure(x, y0, x, y0 + L, .6); for (let k = 1; k < 8; k++) B.rainure(x - w/2, y0 + k*L/8, x + w/2, y0 + k*L/8, .6);
    B.box(x - w/2, y0 + (dir < 0 ? 0 : L - 2), w, 2, 4, .5, 'or_', 2); },
  radiateur(B, x, y, dir){ const L = 22; B.box(x - 5, dir < 0 ? y - 4 - L : y + 4, 10, L, 3, .6, 'blanc', 1); for (let k = 1; k < 4; k++) B.rainure(x - 5, (dir < 0 ? y - 4 - L : y + 4) + k*L/4, x + 5, (dir < 0 ? y - 4 - L : y + 4) + k*L/4, .5); },
  module(B, x1, y1, x2, y2, r = 5, mat = 'blanc'){ const d = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1)/d, uy = (y2 - y1)/d, nx = -uy*r, ny = ux*r;
    B.poly([[x1 + nx, y1 + ny], [x2 + nx, y2 + ny], [x2 - nx, y2 - ny], [x1 - nx, y1 - ny]], 9, r*.9, mat, 3);
    for (let t = 7; t < d - 3; t += 7) B.rainure(x1 + ux*t + nx, y1 + uy*t + ny, x1 + ux*t - nx, y1 + uy*t - ny, .45); },
};
// la station de la partie : un petit avant-poste au départ (module court et barre d'amarrage), puis chaque
// module acheté s'y ajoute. Repère : le quai est en bas (+y), là où la corvette s'amarre, nez vers la station.
const L_ST = 240, QUAI_ST = 92;   // taille du dessin ; distance du centre de la station au centre de la corvette amarrée
function piecesStation(B, st) {
  if (st.poutre) { ISS.poutre(B, st.quai ? -104 : -64, st.quai ? 104 : 64, 0);
    if (st.ailes) for (const x of st.quai ? [-96, -80, 80, 96] : [-56, 56]) for (const d of [-1, 1]) ISS.aile(B, x, 0, d); }
  else if (st.ailes) for (const d of [-1, 1]) ISS.aile(B, 0, d * 14, d);
  if (st.radiateurs) for (const x of [-30, 30]) ISS.radiateur(B, x, -4, -1);
  if (st.central) { ISS.module(B, 0, -18, 0, 30, 6); ISS.module(B, -22, -14, 22, -14, 5); B.lights([[0, -6], [0, 6], [0, 18]], CHAUD); }
  else { ISS.module(B, 0, -6, 0, 30, 5, 'coque'); B.lights([[0, 10]], CHAUD); }
  if (st.hangar) PIECES.hangar(B, -36, 26);
  if (st.raffinerie) PIECES.raffinerie(B, 36, 24);
  if (st.antenne) { ISS.module(B, 0, -18, 0, -44, 4); PIECES.antenne(B, 0, -50); }
  ISS.module(B, 0, 30, 0, 44, 3.5, 'coque');
  PIECES.quai(B, 0, 50);
}
const STATIONS = {};
function construireStation(st) {
  const cle = Object.keys(st).filter(k => st[k]).sort().join(',');
  if (STATIONS[cle]) return STATIONS[cle];
  return STATIONS[cle] = paresseux(k => { const B0 = builder(L_ST, L_ST), B = tourne(B0, k / N_ANG * TAU, L_ST / 2); piecesStation(B, st); return aplats(render(B0, { seed: 9 }).img); });
}

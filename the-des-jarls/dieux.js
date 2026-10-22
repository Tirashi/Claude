/* =====================================================================
   LE THÉ DES JARLS · les PORTRAITS DES DIEUX (pixel art 44×52, détourés
   comme les soldats). Thor et Idunn sont ceux de la maquette 4
   (spriteDieu, decor.js) ; les 18 autres sont composés ici à partir d'une
   fiche (peau, cheveux, barbe, robe, coiffe, attribut). Les médaillons des
   menus sont la tête du portrait sur un rond à la couleur de la famille.
   portrait(id) → canvas (mis en cache) ; medaillon(id) → image data: URL.
   ===================================================================== */
'use strict';
// famille de chaque faveur : att(aque), def(ense et soins), jet(ons), ruse
const JAR_FAMILLES = { att: 'ATTAQUE', def: 'DÉFENSE', jet: 'JETONS', ruse: 'RUSE' };
const JAR_FAM = { thor: 'att', brunhild: 'att', skadi: 'att', ullr: 'att', vidar: 'att', freyr: 'att', idunn: 'def', baldr: 'def', heimdall: 'def', hel: 'def', var: 'def',
  bragi: 'jet', mimir: 'jet', odin: 'jet', skuld: 'jet', tyr: 'jet', loki: 'ruse', frigg: 'ruse', freyja: 'ruse', thrymr: 'ruse' };
const JAR_COUL_FAM = { att: '#d0573e', def: '#4f86e8', jet: '#e2ad2c', ruse: '#a274dc' };
const PEAU = '#f0c08e', BOTTE = '#4c3d2e';
// f : femme ; ch cheveux ; ba barbe ; r/R robe claire/sombre ; co coiffe ; at attribut ; ca cape ; ex détail
const FICHES = {
  heimdall: { ch: '#ece4c4', ba: '#ece4c4', r: '#e2e6ec', R: '#a8b0bc', co: 'casque', at: 'cor', ca: '#c8a040' },
  var:      { f: 1, ch: '#d8a060', r: '#c87ab0', R: '#8a4a7a', co: 'voile', at: 'anneau' },
  thrymr:   { pe: '#a8c8e0', ch: '#eef6ff', ba: '#eef6ff', r: '#4a6a8a', R: '#2a4058', co: 'couronne', at: 'massue' },
  bragi:    { ch: '#b0b0b8', ba: '#d0d0d8', long: 1, r: '#7a3a8a', R: '#4a2058', at: 'harpe' },
  brunhild: { f: 1, ch: '#e6c66a', r: '#9aa2aa', R: '#5a626a', co: 'ailes', at: 'lance', ex: 'bouclier' },
  odin:     { ch: '#c8c8d0', ba: '#dcdce4', long: 1, r: '#3a3a5a', R: '#24243a', co: 'chapeau', at: 'lance', ca: '#2a2a40', ex: 'bandeau' },
  skadi:    { f: 1, ch: '#2a2a30', r: '#e8eef4', R: '#9aa8b8', co: 'capuche', cc: '#f4f8fc', at: 'arc' },
  loki:     { ch: '#c84a2a', ba: '#c84a2a', bouc: 1, r: '#2a7a3a', R: '#1a4a24', at: 'flamme' },
  skuld:    { f: 1, ch: '#3a2a4a', r: '#3e3e50', R: '#24242e', co: 'voile', cc: '#5a5a70', at: 'ciseaux' },
  frigg:    { f: 1, ch: '#8a4a20', r: '#ece4d4', R: '#a89a80', co: 'couronne', at: 'quenouille' },
  mimir:    { ch: '#9aa4b0', ba: '#b8c4d0', long: 1, r: '#2a5a7a', R: '#1a3a54', at: 'corne', ex: 'eau' },
  baldr:    { ch: '#f8e8a0', ba: '#f8e8a0', r: '#f8f0d8', R: '#d8c890', co: 'couronne', at: 'bouclierR', ex: 'aura' },
  freyja:   { f: 1, ch: '#f0d070', r: '#c84a6a', R: '#8a2a44', at: 'plume', ex: 'collier', ca: '#b88a5a' },
  tyr:      { ch: '#6a4a2a', ba: '#6a4a2a', r: '#8a3a2a', R: '#5a2418', co: 'casque', at: 'epee', ex: 'moignon' },
  ullr:     { ch: '#8a5a2a', ba: '#8a5a2a', r: '#3a6a3a', R: '#24482a', co: 'capuche', cc: '#2e5a30', at: 'arc' },
  vidar:    { ch: '#5a4a3a', ba: '#4a3a2a', r: '#5a5a62', R: '#3a3a42', co: 'casque', at: 'epee', ex: 'botte' },
  freyr:    { ch: '#e6b84a', ba: '#e6b84a', r: '#c89a2a', R: '#8a6a14', at: 'gerbe', ca: '#3a7a3a' },
  hel:      { f: 1, ch: '#1a1a20', r: '#2a2a34', R: '#141418', at: 'aucun', ex: 'moitie' },
  // Sigrid la skalde (le duel guidé) et Thorgrim, le vieux jarl
  sigrid:   { f: 1, ch: '#d88a3a', r: '#6a4a8a', R: '#4a2a6a', at: 'harpe', ca: '#3a6a5a' },
  thorgrim: { ch: '#a8a8b0', ba: '#c8c8d0', long: 1, r: '#8a5a3a', R: '#5a3a22', co: 'casque', at: 'massue' },
};
const PORTRAITS = new Map();
function portrait(id) {
  if (PORTRAITS.has(id)) return PORTRAITS.get(id);
  let c;
  if (id === 'thor' || id === 'idunn') c = spriteDieu(id === 'thor');
  else c = composerDieu(FICHES[id] || FICHES.heimdall);
  PORTRAITS.set(id, c);
  return c;
}
function composerDieu(F) {
  const c = mk(44, 52), g = c.getContext('2d'), R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const pe = F.pe || PEAU, peS = '#c98f62';
  // derrière : cape, aura, eau
  if (F.ex === 'aura') { g.fillStyle = 'rgba(255,230,140,.45)'; g.beginPath(); g.arc(20, 22, 19, 0, 7); g.fill(); }
  if (F.ex === 'eau') { R(4, 44, 36, 6, '#3a7aa8'); R(6, 44, 32, 1, '#a8d8f8'); R(10, 47, 6, 1, '#a8d8f8'); R(24, 48, 8, 1, '#a8d8f8'); }
  if (F.ca) { R(8, 21, 24, 27, F.ca); R(8, 21, 3, 27, '#0003'); }
  // corps
  if (F.f) { R(11, 19, 18, 27, F.r); R(11, 19, 4, 27, F.R); R(11, 30, 18, 2, '#f2c94c'); R(14, 46, 4, 2, BOTTE); R(22, 46, 4, 2, BOTTE); }
  else {
    R(12, 21, 16, 19, F.r); R(12, 21, 4, 19, F.R); R(12, 33, 16, 3, '#5a3a1e'); R(18, 33, 4, 3, '#f2c94c');
    R(13, 40, 6, 8, F.R); R(21, 40, 6, 8, F.R); R(12, 47, 7, 3, BOTTE); R(21, 47, 7, 3, BOTTE);
    if (F.ex === 'botte') { R(20, 44, 9, 6, '#6a5040'); R(20, 44, 9, 1, '#8a7060'); }
  }
  // bras gauche (main au côté) et bras droit (tient l'attribut)
  R(8, 22, 4, 11, F.R); R(8, 32, 4, 3, pe);
  if (F.ex !== 'moignon') { R(28, 22, 4, 8, F.R); R(28, 29, 4, 3, pe); } else { R(28, 22, 4, 6, F.R); R(28, 27, 4, 1, '#e8d8c0'); }
  // tête
  if (F.f && F.co !== 'capuche') { R(12, 5, 16, 5, F.ch); R(12, 8, 3, 19, F.ch); R(25, 8, 3, 19, F.ch); }
  R(15, 7, 10, 10, pe); R(15, 15, 10, 2, peS);
  if (F.ex === 'moitie') { R(20, 7, 5, 10, '#d8dee8'); R(21, 11, 2, 2, '#1a1a24'); R(20, 15, 5, 1, '#9aa0aa'); }
  R(17, 11, 2, 1, '#203060'); if (F.ex !== 'moitie') R(21, 11, 2, 1, '#203060');
  if (F.ex === 'bandeau') { R(15, 10, 10, 1, '#2a1a10'); R(20, 10, 3, 3, '#2a1a10'); }
  if (!F.ba) R(18, 14, 4, 1, F.f ? '#c86a5a' : '#a8644a');
  if (!F.f && F.co !== 'capuche') { R(14, 5, 12, 3, F.ch); R(14, 7, 2, 6, F.ch); R(24, 7, 2, 6, F.ch); }
  if (F.ba) {
    if (F.bouc) { R(18, 15, 4, 5, F.ba); R(16, 13, 1, 2, F.ba); R(23, 13, 1, 2, F.ba); }
    else { R(15, 14, 10, 5, F.ba); R(16, 19, 8, F.long ? 9 : 3, F.ba); if (F.long) R(18, 28, 4, 3, F.ba); R(18, 15, 4, 1, '#a8644a'); }
  }
  if (F.ex === 'collier') { R(16, 19, 8, 1, '#f2c94c'); R(19, 20, 2, 2, '#ff8a6a'); }
  // coiffe
  if (F.co === 'casque' || F.co === 'ailes') { R(14, 3, 12, 5, '#9aa3ad'); R(14, 3, 12, 1, '#e2e8ee'); R(19, 8, 2, 4, '#9aa3ad'); }
  if (F.co === 'ailes') { R(9, 1, 5, 2, '#fff'); R(10, 3, 4, 2, '#e0e4ea'); R(26, 1, 5, 2, '#fff'); R(26, 3, 4, 2, '#e0e4ea'); }
  if (F.co === 'couronne') { R(15, 4, 10, 2, '#f2c94c'); R(15, 2, 2, 2, '#f2c94c'); R(19, 1, 2, 3, '#f2c94c'); R(23, 2, 2, 2, '#f2c94c'); R(19, 4, 2, 1, '#e85a5a'); }
  if (F.co === 'voile') { R(13, 3, 14, 4, F.cc || '#e8e0f0'); R(12, 6, 3, 24, F.cc || '#e8e0f0'); R(25, 6, 3, 24, F.cc || '#e8e0f0'); }
  if (F.co === 'capuche') { const k = F.cc || F.R; R(13, 3, 14, 5, k); R(12, 6, 4, 16, k); R(24, 6, 4, 16, k); R(14, 3, 12, 1, '#fff3'); }
  if (F.co === 'chapeau') { R(9, 4, 22, 2, '#2a2a3a'); R(14, 0, 12, 5, '#2a2a3a'); R(14, 3, 12, 1, '#4a4a60'); }
  // attribut dans la main droite
  const at = F.at;
  if (at === 'lance') { R(31, 0, 2, 50, '#7a4f2a'); R(30, 0, 4, 4, '#c8d0d8'); R(31, 0, 1, 3, '#fff'); }
  if (at === 'epee') { R(31, 6, 2, 22, '#d8dde2'); R(31, 6, 1, 22, '#fff'); R(28, 27, 8, 2, '#f2c94c'); R(31, 29, 2, 4, '#5a3a1e'); }
  if (at === 'massue') { R(30, 8, 4, 22, '#6a4a2a'); R(29, 4, 6, 7, '#8a6a4a'); R(29, 6, 1, 1, '#c8d0d8'); R(34, 8, 1, 1, '#c8d0d8'); }
  if (at === 'cor') { R(26, 12, 7, 3, '#e8d8a8'); R(32, 9, 4, 8, '#e8d8a8'); R(33, 10, 2, 6, '#8a6a3a'); R(26, 12, 7, 1, '#fff6'); }
  if (at === 'harpe') { R(30, 16, 2, 16, '#f2c94c'); R(30, 16, 9, 2, '#f2c94c'); R(37, 16, 2, 14, '#c8902c'); for (let x = 32; x < 37; x += 2) R(x, 18, 1, 12, '#fff8'); }
  if (at === 'arc') { for (let y = 4; y < 44; y++) { const dx = Math.round(4 * Math.sin((y - 4) / 40 * Math.PI)); R(33 + dx, y, 2, 1, '#7a4f2a'); } R(33, 4, 1, 40, '#f4efe4'); }
  if (at === 'flamme') { R(29, 22, 5, 5, '#3ad070'); R(30, 18, 3, 5, '#7af0a0'); R(31, 15, 1, 4, '#c8ffd8'); }
  if (at === 'ciseaux') { R(30, 22, 2, 8, '#c8d0d8'); R(33, 22, 2, 8, '#c8d0d8'); R(31, 29, 3, 2, '#c8d0d8'); R(29, 31, 3, 3, '#5a5a6a'); R(33, 31, 3, 3, '#5a5a6a'); R(10, 34, 26, 1, '#e8d8a8'); }
  if (at === 'quenouille') { R(31, 10, 2, 26, '#8a6a4a'); R(29, 10, 6, 8, '#f4f0e8'); R(29, 12, 6, 1, '#d8d0c0'); }
  if (at === 'corne') { R(28, 24, 8, 3, '#e8d8a8'); R(34, 20, 3, 5, '#e8d8a8'); R(28, 24, 2, 3, '#c8a040'); }
  if (at === 'bouclierR') { g.fillStyle = '#c8902c'; g.beginPath(); g.arc(34, 28, 8, 0, 7); g.fill(); g.fillStyle = '#f8e8a0'; g.beginPath(); g.arc(34, 28, 6, 0, 7); g.fill(); R(33, 21, 2, 14, '#c8902c'); R(27, 27, 14, 2, '#c8902c'); }
  if (at === 'anneau') { g.strokeStyle = '#f2c94c'; g.lineWidth = 2; g.beginPath(); g.arc(32, 25, 3, 0, 7); g.stroke(); R(32, 21, 1, 1, '#fff'); }
  if (at === 'plume') { R(30, 14, 3, 14, '#e8e0d0'); R(33, 16, 2, 10, '#c8b8a0'); R(29, 16, 1, 10, '#c8b8a0'); R(31, 26, 1, 6, '#8a6a4a'); }
  if (at === 'gerbe') { for (let k = 0; k < 4; k++) { R(29 + k * 2, 10 + (k % 2) * 2, 1, 22, '#c8a040'); R(28 + k * 2, 8 + (k % 2) * 2, 3, 4, '#f2d070'); } R(28, 26, 9, 2, '#8a5a2a'); }
  if (F.ex === 'bouclier') { g.fillStyle = '#8a1e18'; g.beginPath(); g.arc(8, 32, 8, 0, 7); g.fill(); g.fillStyle = '#c8d0d8'; g.beginPath(); g.arc(8, 32, 2, 0, 7); g.fill(); g.strokeStyle = '#5a3a1e'; g.lineWidth = 1; g.beginPath(); g.arc(8, 32, 8, 0, 7); g.stroke(); }
  return detourer(c);
}
// médaillon : la tête du portrait (agrandie sans lissage) sur un rond de la couleur de la famille
const MEDAILLONS = new Map();
function medaillon(id) {
  if (MEDAILLONS.has(id)) return MEDAILLONS.get(id);
  const T = 64, c = mk(T, T), g = c.getContext('2d'), col = JAR_COUL_FAM[JAR_FAM[id]] || '#888';
  const gr = g.createRadialGradient(T * 0.38, T * 0.3, 2, T / 2, T / 2, T / 2); gr.addColorStop(0, '#fff8'); gr.addColorStop(0.35, col); gr.addColorStop(1, '#0008');
  g.fillStyle = col; g.beginPath(); g.arc(T / 2, T / 2, T / 2 - 1, 0, 7); g.fill(); g.fillStyle = gr; g.fill();
  g.save(); g.beginPath(); g.arc(T / 2, T / 2, T / 2 - 3, 0, 7); g.clip();
  g.imageSmoothingEnabled = false; g.drawImage(portrait(id), 6, 0, 32, 30, 0, 4, T, T * 30 / 32);
  g.restore();
  g.strokeStyle = '#1a1208'; g.lineWidth = 2; g.beginPath(); g.arc(T / 2, T / 2, T / 2 - 1, 0, 7); g.stroke();
  const url = c.toDataURL();
  MEDAILLONS.set(id, url);
  return url;
}

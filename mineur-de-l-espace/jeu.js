/* =====================================================================
   MINEUR DE L'ESPACE · le JEU : vol (joystick à inertie, tourelles qui
   tirent seules, roches qui se brisent, minerai à ramasser, petites
   roches rapides qui abîment la coque), quai (vente, AMELIORER, USINES,
   RECHERCHE, STATION), pause, sauvegarde.
   Toute l'économie vient de regles.js (mde…) ; les dessins de chantier.js
   et planetes.js. Repris de la maquette 6 (maquettes/mineurs-d-etoiles-6.html).
   Objet de test : window.Mineur.
   ===================================================================== */
'use strict';
// noms globaux venus de regles.js (mde…, MDE_…), planetes.js et chantier.js (pas de commentaire « global » : la page les déclare déjà)
const CLE = 'mineur-de-l-espace';
const H = 300, R_QUAI = RT / 2 + 34, LUNE_D = 1080, TAILLES = [11, 19, 32];   // TAILLES : rayon des petites, moyennes, grosses
let W = 640;

/* ---------- petites images : pépites de minerai, ciel, nébuleuse ---------- */
function teinte(hex, f) { const c = [1, 3, 5].map(k => parseInt(hex.slice(k, k + 2), 16)); return '#' + c.map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f).toString(16).padStart(2, '0')).join(''); }
function pepite(m) {
  const b = MDE_MINERAIS[m].couleur, P = [teinte(b, -0.6), b, teinte(b, 0.55)];
  const forme = ['.0000.', '011110', '012210', '011110', '.0110.'], [c, x] = toile(6, 5);
  forme.forEach((l, j) => [...l].forEach((ch, i) => { if (ch !== '.') { x.fillStyle = P[+ch]; x.fillRect(i, j, 1, 1); } }));
  return c;
}
const PEP = {}; for (const m in MDE_MINERAIS) PEP[m] = pepite(m);
const [ciel, cielX] = toile(512);
(() => { const R = mulberry(7); for (let i = 0; i < 300; i++) { const b = R(); cielX.fillStyle = b < 0.7 ? '#3a4170' : b < 0.93 ? '#8a93c8' : '#fff4c8';
  const x = R() * 512 | 0, y = R() * 512 | 0; cielX.fillRect(x, y, 1, 1); if (b > 0.985) { cielX.fillRect(x - 1, y, 3, 1); cielX.fillRect(x, y - 1, 1, 3); } } })();
const [neb, nebX] = toile(128);   // nébuleuse dessinée ici (taches floues), agrandie × 4 sans lissage : gros pixels
(() => { const R = mulberry(31), C = ['#5a2a8a', '#2a3a8a', '#8a2a6a', '#2a6a8a'];
  for (let i = 0; i < 16; i++) { const x = 20 + R() * 88, y = 20 + R() * 88, r = 10 + R() * 26, g = nebX.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, C[i % 4] + '55'); g.addColorStop(1, C[i % 4] + '00'); nebX.fillStyle = g; nebX.fillRect(0, 0, 128, 128); } })();
// réserve de roches : 3 tailles × 3 formes × 2 aspects (veines dorées ou rouille), tracées à la demande
const ROCS = [];
function preparerRoches() { const R = mulberry(99); for (let t = 0; t < 3; t++) { ROCS[t] = { fer: [], or: [] }; for (let v = 0; v < 3; v++) { const g = R() * 1e9 | 0;
  for (const s of ['fer', 'or']) ROCS[t][s].push(construireRoche(mulberry(g), TAILLES[t], s)); } } }
// halo d'une météorite : disque de braise en gros pixels (ajouté en mode « lighter » sur la roche)
const [BRAISE, braiseX] = toile(16);
(() => { for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const d = Math.hypot(i - 7.5, j - 7.5); if (d > 7.5) continue;
  braiseX.fillStyle = d < 3 ? '#e08a40' : d < 5.5 ? '#b04420' : '#5a180a'; braiseX.fillRect(i, j, 1, 1); } })();
const aspect = m => m === 'or' || m === 'cristal' ? 'or' : 'fer';
// niveau d'amélioration (0 à 5) → ce qui se voit sur la corvette (0 à 3)
const VISIBLE = [0, 1, 2, 2, 3, 3];

/* ---------- la partie ---------- */
class Partie {
  constructor(el) {
    this.el = el;
    const e = document.createElement('div'); e.className = 'ecran'; el.appendChild(e); this.ecran = e;
    const [c, x] = toile(W, H); this.c = c; this.x = x; e.appendChild(c);
    this.e = this.charger(); this.onglet = 'amel';
    this.ship = { x: 0, y: -R_QUAI, vx: 0, vy: 0, a: 0 }; this.cam = { x: 0, y: 0 };
    this.soute = []; this.balles = []; this.drops = []; this.parts = []; this.textes = []; this.joy = null; this.auto = false; this.panne = 0;
    this.asts = []; this.R = mulberry(Date.now() & 0xffffff); this.prochainDanger = 20; this.respawn = 0; this.secousse = 0; this.pauseVue = false; this.tSauve = 0;
    for (let k = 0; k < 16; k++) this.nouvelleRoche();
    this.panneau(); this.pause(); this.entrees(); this.rebatir(); this.accoster(true);
    this.cam.x = this.ship.x; this.cam.y = this.ship.y;
    this.ajuster(); addEventListener('resize', () => this.ajuster());
  }
  /* sauvegarde : l'état des règles (un objet JSON) */
  charger() {
    try { const t = localStorage.getItem(CLE); if (t) { const e = mdeMigrer(JSON.parse(t)); if (e) return e; } } catch (err) { /* stockage indisponible */ }
    return mdeNouvelle('m' + Date.now());
  }
  sauver() { try { localStorage.setItem(CLE, JSON.stringify(this.e)); } catch (err) { /* stockage indisponible */ } }
  nouvellePartie() { this.e = mdeNouvelle('m' + Date.now()); this.sauver(); this.soute = []; this.drops = []; this.rebatir(); this.ship.x = 0; this.ship.y = -R_QUAI; this.accoster(true); }
  // l'écran : 300 px de haut, largeur selon le téléphone (à l'horizontale)
  ajuster() {
    const r = this.el.getBoundingClientRect(), L = Math.round(Math.max(420, Math.min(760, H * r.width / Math.max(1, r.height))));
    if (L !== W) { W = L; this.c.width = W; this.x = this.c.getContext('2d'); this.x.imageSmoothingEnabled = false; }
    const k = Math.min(r.width / W, r.height / H); this.ecran.style.width = W + 'px'; this.ecran.style.height = H + 'px';
    this.ecran.style.transform = `translate(${(r.width - W * k) / 2}px, ${(r.height - H * k) / 2}px) scale(${k})`;
    document.body.classList.toggle('debout', r.height > r.width);
  }
  get C() { return mdeCorvette(this.e); }
  rebatir() {
    const A = this.e.ameliorations, c = this.C, cl = CLASSES[this.e.classe] ? this.e.classe : 'escorte';
    this.nef = construireNef(cl, { reservoir: VISIBLE[A.reservoir], soute: VISIBLE[A.soute] }, c.tourelles);
    this.tour = tourelle(VISIBLE[A.canon]);
    this.tirs = this.nef.tourelles.map((_, i) => ({ a: 0, t: i * 0.15 }));
    this.carbu = c.vol; this.coque = c.coque;
  }
  get rMax() { return 800 * (this.e.recherche.moteurs ? 1.15 : 1); }
  // une roche : taille 3, 2 ou 1 (règles) ; sans position, une grosse roche loin du joueur dans la ceinture
  nouvelleRoche(r, x, y, vx = 0, vy = 0) {
    const R = this.R;
    if (!r) r = mdeRoche(this.e, this.e.planete, R);
    if (x === undefined) { let d, an; do { d = 280 + R() * 340; an = R() * TAU; } while (Math.hypot(Math.cos(an) * d - this.ship.x, Math.sin(an) * d - this.ship.y) < 260 && this.asts.length);
      x = Math.cos(an) * d; y = Math.sin(an) * d; }
    const t = r.taille - 1;
    this.asts.push({ x, y, vx, vy, r, v: ROCS[t][aspect(r.minerai)][R() * 3 | 0], ray: TAILLES[t] * 0.82, rot: R() * TAU, vr: (R() - 0.5) * (1.2 - t * 0.3), flash: 0, pvMax: r.pv });
  }
  // danger : une météorite (petite roche chauffée au rouge, traînée de feu) qui fonce vers la corvette ; elle est
  // annoncée 1,3 s avant par une alerte au bord de l'écran, du côté d'où elle vient ; les tourelles peuvent l'abattre
  danger(an) {
    const s = this.ship;
    an = an === undefined ? this.R() * TAU : an; const x = s.x + Math.cos(an) * 380, y = s.y + Math.sin(an) * 380, vise = an + Math.PI + (this.R() - 0.5) * 0.5, v = 150 + this.R() * 50;
    this.nouvelleRoche({ taille: 1, pv: 1, minerai: 'fer' }, x, y, Math.cos(vise) * v, Math.sin(vise) * v);
    const a = this.asts[this.asts.length - 1]; a.rapide = true; a.vie = 5;
  }
  /* ---------- le quai : panneau à onglets ---------- */
  panneau() {
    const p = document.createElement('div'); p.className = 'panneau'; this.ecran.appendChild(p); this.p = p;
    p.addEventListener('click', ev => { const b = ev.target.closest('button'); if (!b || b.disabled) return;
      if (b.dataset.o) this.onglet = b.dataset.o;
      else if (b.dataset.a) { const id = b.dataset.a; if (mdeAcheter(this.e, id)) { if (/^(amel|classe)/.test(id)) this.rebatir(); this.texte(this.ship.x, this.ship.y - 46, 'ACHETE !', '#7be07b'); this.sauver(); } }
      else if (b.dataset.c) { if (mdeChangerClasse(this.e, b.dataset.c)) { this.rebatir(); this.sauver(); } }
      else if (b.dataset.go) return this.decoller();
      this.majPanneau(); });
  }
  majPanneau() {
    const e = this.e, l = mdeAchats(e), O = [['amel', 'AMELIORER'], ['usine', 'USINES'], ['rech', 'RECHERCHE']];
    if (e.recherche.centre) O.push(['station', 'STATION']);
    if (!O.some(o => o[0] === this.onglet)) this.onglet = 'amel';
    const prix = P => Object.entries(P).map(([k, v]) => k === 'cr' ? v + ' CR' : v + ' ' + MDE_MINERAIS[k].nom).join(' + ');
    let h = `<div class="onglets">${O.map(([k, n]) => `<button class="btn ${this.onglet === k ? 'actif' : ''}" data-o="${k}">${n}</button>`).join('')}</div>`;
    h += `<h4>A QUAI · ${e.cr} CR</h4>`;
    const mis = Object.entries(e.entrepot).filter(([, n]) => n > 0);
    if (mis.length) h += `<p class="mis">MIS DE COTE : ${mis.map(([m, n]) => n + ' ' + MDE_MINERAIS[m].nom).join(', ')}</p>`;
    const ligne = (a) => `<div class="ligne"><span class="nom">${a.nom}<small>${a.effet}</small></span><button class="btn" data-a="${a.id}" ${a.possible ? '' : 'disabled'}>${prix(a.prix)}</button></div>`;
    const rien = t => `<p class="vide">${t}</p>`;
    if (l.some(x => !x.possible && Object.keys(x.prix).length > 1 && x.type === (this.onglet === 'station' ? 'module' : this.onglet)))
      h += '<p>LE QUAI MET DE COTE LE MINERAI D\'UN ACHAT DES QUE TU AS LA MOITIE DE SES CR.</p>';
    if (this.onglet === 'amel') {
      const c = this.C; h += `<p class="fiche">${c.nom} · ${c.tourelles} TOURELLE${c.tourelles > 1 ? 'S' : ''} · DEGATS ${c.degats} · SOUTE ${c.soute} · ${c.vol} S · COQUE ${c.coque}</p>`;
      const a = l.filter(x => x.type === 'amel'); h += a.length ? a.map(ligne).join('') : rien('TOUT EST AU MAXIMUM POUR L\'INSTANT');
    } else if (this.onglet === 'usine') {
      h += `<p class="fiche">PRIX : ${Object.keys(MDE_MINERAIS).filter(m => m === 'fer' || m === 'or' || mdeEtage(e) >= 3).map(m => MDE_MINERAIS[m].nom + ' ' + mdePrix(e, m)).join(' · ')}</p>`;
      const a = l.filter(x => x.type === 'usine'); h += a.length ? a.map(ligne).join('') : rien('TOUTES LES USINES SONT AU MAXIMUM');
    } else if (this.onglet === 'rech') {
      const a = l.filter(x => x.type === 'rech'); h += a.length ? a.map(ligne).join('') : rien('RIEN A CHERCHER POUR L\'INSTANT');
    } else {
      h += `<p class="fiche">LA STATION SE CONSTRUIT MODULE PAR MODULE${Object.keys(e.station).length ? ' · ' + Object.keys(e.station).length + ' MODULE(S)' : ''}</p>`;
      h += l.filter(x => x.type === 'module' || x.type === 'classe').map(ligne).join('');
      const k = Object.keys(e.classes); if (k.length > 1) h += k.map(c => `<div class="ligne"><span class="nom">${MDE_CLASSES[c].nom}<small>CLASSE ACHETEE</small></span><button class="btn" data-c="${c}" ${c === e.classe ? 'disabled' : ''}>${c === e.classe ? 'A BORD' : 'PRENDRE'}</button></div>`).join('');
    }
    h += `<button class="btn go" data-go="1">DECOLLER</button>`;
    this.p.innerHTML = h;
  }
  /* ---------- pause ---------- */
  pause() {
    const b = document.createElement('button'); b.className = 'btn bpause'; b.textContent = 'II'; this.ecran.appendChild(b);
    const f = document.createElement('div'); f.className = 'pause'; this.ecran.appendChild(f); this.f = f;
    f.innerHTML = `<div class="boite"><h3>PAUSE</h3><button class="btn" data-p="reprendre">REPRENDRE</button><button class="btn" data-p="nouvelle">NOUVELLE PARTIE</button>
      <a class="btn ludo-retour" href="../index.html">◀ LUDOTHEQUE</a><p class="doux">LA PARTIE EST SAUVEGARDEE AU QUAI.</p></div>`;
    b.addEventListener('click', () => { this.pauseVue = true; this.joy = null; f.classList.add('vu'); });
    f.addEventListener('click', ev => { const k = ev.target.dataset && ev.target.dataset.p; if (!k) return;
      if (k === 'nouvelle') { if (!ev.target.dataset.sur) { ev.target.dataset.sur = 1; ev.target.textContent = 'SUR ? TOUT EST EFFACE'; return; } this.nouvellePartie(); }
      f.querySelectorAll('[data-sur]').forEach(x => { delete x.dataset.sur; x.textContent = 'NOUVELLE PARTIE'; });
      this.pauseVue = false; f.classList.remove('vu'); });
  }
  /* ---------- quai, décollage ---------- */
  accoster(debut, panne) {
    this.quai = true; this.auto = false; this.joy = null; this.ship.vx = this.ship.vy = 0; this.panne = 0; this.alerteMeteo = null;
    if (!debut) {
      const lot = {}; for (const m of this.soute) lot[m] = (lot[m] || 0) + 1;
      const r = mdeRetour(this.e, lot, panne), g = Object.entries(r.garde).map(([m, n]) => n + ' ' + MDE_MINERAIS[m].nom).join(', ');
      if (r.gain) this.texte(this.ship.x, this.ship.y - 40, `+${r.gain} CR`, '#ffcf4a');
      if (g) this.texte(this.ship.x, this.ship.y - 56, 'MIS DE COTE : ' + g, '#9fd0ff');
      this.sauver();
    }
    this.soute = []; const c = this.C; this.carbu = c.vol; this.coque = c.coque; this.majPanneau(); this.p.classList.add('vu');
  }
  decoller() {
    this.quai = false; this.sorti = false; this.p.classList.remove('vu'); const s = this.ship, d = Math.hypot(s.x, s.y) || 1;
    s.vx = s.x / d * 45; s.vy = s.y / d * 45; s.a = Math.atan2(s.vy, s.vx) + Math.PI / 2; this.prochainDanger = 12 + this.R() * 20;
  }
  texte(x, y, t, c) { this.textes.push({ x, y, t, c, v: 1.8 }); }
  entrees() {
    const pos = ev => { const r = this.c.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; };
    this.c.addEventListener('pointerdown', ev => { if (this.quai || this.panne || this.pauseVue) return; const [x, y] = pos(ev);
      if (x > W - 120 && y > H - 52) { this.auto = true; return; }
      if (x < W * 0.6) { this.c.setPointerCapture(ev.pointerId); this.joy = { id: ev.pointerId, bx: x, by: y, dx: 0, dy: 0 }; this.auto = false; } });
    this.c.addEventListener('pointermove', ev => { const j = this.joy; if (!j || j.id !== ev.pointerId) return; const [x, y] = pos(ev);
      let dx = x - j.bx, dy = y - j.by; const d = Math.hypot(dx, dy); if (d > 40) { dx *= 40 / d; dy *= 40 / d; } j.dx = dx; j.dy = dy; });
    const fin = ev => { if (this.joy && this.joy.id === ev.pointerId) this.joy = null; }; this.c.addEventListener('pointerup', fin); this.c.addEventListener('pointercancel', fin);
  }
  mondeTourelle(i) { const [mx, my] = this.nef.tourelles[i], s = this.ship, c = Math.cos(s.a), si = Math.sin(s.a); return [s.x + mx * c - my * si, s.y + mx * si + my * c]; }
  /* ---------- un pas de simulation ---------- */
  pas(dt) {
    if (this.pauseVue) return;
    const s = this.ship, c = this.C, e = this.e;
    mdeAvancer(e, dt); this.tSauve += dt; if (this.tSauve > 30) { this.tSauve = 0; this.sauver(); }
    // roches : dérive autour de la planète ; les rapides vont tout droit
    for (const a of this.asts) {
      if (a.rapide) { a.vie -= dt; } else { const r = Math.hypot(a.x, a.y) || 1, w = 0.045 / Math.sqrt(r / 260), tx = -a.y / r * w * r, ty = a.x / r * w * r;
        a.vx += (tx - a.vx) * Math.min(1, dt * 0.6); a.vy += (ty - a.vy) * Math.min(1, dt * 0.6); }
      a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt; a.flash = Math.max(0, a.flash - dt); }
    this.asts = this.asts.filter(a => !a.rapide || a.vie > 0);
    // de nouvelles grosses roches arrivent dans la ceinture
    this.respawn -= dt; if (this.respawn <= 0) { this.respawn = 6; if (this.asts.filter(a => a.r.taille === 3).length < 12 && this.asts.length < 40) this.nouvelleRoche(); }
    if (this.quai) { const ang = Math.atan2(s.y, s.x) + dt * 0.06; s.x = Math.cos(ang) * R_QUAI; s.y = Math.sin(ang) * R_QUAI; s.a = ang + Math.PI / 2; this.suite(dt); return; }
    if (this.panne) { this.panne -= dt; s.vx *= 0.985; s.vy *= 0.985; s.x += s.vx * dt; s.y += s.vy * dt;
      if (this.panne <= 0) { const d = Math.hypot(s.x, s.y); s.x = s.x / d * R_QUAI; s.y = s.y / d * R_QUAI;
        const perdu = this.soute.length - Math.floor(this.soute.length / 2); this.texte(s.x, s.y - 72, 'REMORQUEE' + (perdu ? ` · -${perdu} MINERAI` : ''), '#ff6a5c'); this.accoster(false, true); }
      this.suite(dt); return; }
    const j = this.joy, jx = j ? j.dx / 40 : 0, jy = j ? j.dy / 40 : 0, force = Math.hypot(jx, jy), V = c.vitesse, M = c.maniabilite, TOUR = 2.4 * M; let pousse = 0;
    if (this.auto) { const d = Math.hypot(s.x, s.y), tx = s.x / d * (R_QUAI - 4), ty = s.y / d * (R_QUAI - 4), ex = tx - s.x, ey = ty - s.y, el = Math.hypot(ex, ey) || 1, v = Math.min(120 * V, el * 1.2);
      s.vx += (ex / el * v - s.vx) * Math.min(1, dt * 1.5); s.vy += (ey / el * v - s.vy) * Math.min(1, dt * 1.5); pousse = 1;
      if (Math.hypot(s.vx, s.vy) > 8) { const voulu = Math.atan2(s.vy, s.vx) + Math.PI / 2; let dd = voulu - s.a; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); s.a += Math.max(-TOUR * dt, Math.min(TOUR * dt, dd)); } }
    else { if (force > 0.15) { const voulu = Math.atan2(jy, jx) + Math.PI / 2; let d = voulu - s.a; d = Math.atan2(Math.sin(d), Math.cos(d)); s.a += Math.max(-TOUR * dt, Math.min(TOUR * dt, d));
        // propulseurs : petites bouffées blanches sur le nez quand la corvette tourne
        if (e.ameliorations.propulseurs && Math.abs(d) > 0.15 && this.R() < 0.5) { const cot = d > 0 ? -1 : 1, nx = s.x + Math.sin(s.a) * 22, ny = s.y - Math.cos(s.a) * 22;
          this.parts.push({ x: nx, y: ny, vx: Math.cos(s.a) * cot * 50 + s.vx, vy: Math.sin(s.a) * cot * 50 + s.vy, v: 0.25, c: '#c9cde0', t: 2 }); }
        if (Math.abs(d) < 0.9) { pousse = force; const acc = 110 * V * (0.85 + 0.15 * M) * force * dt; s.vx += Math.sin(s.a) * acc; s.vy -= Math.cos(s.a) * acc; } }
      s.vx *= 1 - dt * 0.12; s.vy *= 1 - dt * 0.12; const v = Math.hypot(s.vx, s.vy); if (v > 150 * V) { s.vx *= 150 * V / v; s.vy *= 150 * V / v; } }
    this.pousse = pousse; s.x += s.vx * dt; s.y += s.vy * dt;
    const de = Math.hypot(s.x, s.y);
    if (de > this.rMax) { s.vx -= s.x / de * 160 * dt; s.vy -= s.y / de * 160 * dt; if ((this.avert || 0) <= 0) { this.texte(s.x, s.y - 44, 'MOTEURS TROP FAIBLES', '#ff6a5c'); this.avert = 2.5; } }
    this.avert = (this.avert || 0) - dt;
    if (de < RT / 2 + 14) { s.x = s.x / de * (RT / 2 + 14); s.y = s.y / de * (RT / 2 + 14); }
    if (de > R_QUAI + 30) this.sorti = true;
    if (this.sorti && de < R_QUAI + 4) { this.accoster(); this.suite(dt); return; }
    if (de > R_QUAI + 10) { this.carbu -= dt * (MDE_CONSO.glisse + (MDE_CONSO.pousse - MDE_CONSO.glisse) * pousse);
      if (this.carbu <= 0) this.tomberEnPanne('PANNE SECHE !'); }
    // dangers : petites roches rapides, plus nombreuses aux étages suivants
    if (de > R_QUAI + 60) { this.prochainDanger -= dt; if (this.prochainDanger <= 0 && !this.alerteMeteo) { this.alerteMeteo = { an: this.R() * TAU, t: 1.3 }; this.prochainDanger = 60 / MDE_DANGERS[mdeEtage(e)] * (0.5 + this.R()); } }
    if (this.alerteMeteo && (this.alerteMeteo.t -= dt) <= 0) { this.danger(this.alerteMeteo.an); this.alerteMeteo = null; }
    for (const a of this.asts) if (a.rapide && this.R() < 0.9) { const k = this.R(); this.parts.push({ x: a.x + (this.R() - 0.5) * 4, y: a.y + (this.R() - 0.5) * 4,
      vx: -a.vx * 0.15 + (this.R() - 0.5) * 20, vy: -a.vy * 0.15 + (this.R() - 0.5) * 20, v: 0.25 + this.R() * 0.3, c: k < 0.3 ? '#fff2a0' : k < 0.6 ? '#f2a94a' : k < 0.85 ? '#d0752c' : '#8c4a24', t: k < 0.5 ? 2 : 1 }); }
    for (const a of this.asts) if (a.rapide && Math.hypot(a.x - s.x, a.y - s.y) < a.ray + 14) {
      a.vie = 0; this.coque--; this.secousse = 0.3; this.eclats(a.x, a.y, 12, 'fer', true); this.texte(s.x, s.y - 44, 'CHOC ! COQUE ' + Math.max(0, this.coque), '#ff6a5c');
      if (navigator.vibrate) try { navigator.vibrate(60); } catch (err) { /* sans vibreur */ }
      if (this.coque <= 0) { this.tomberEnPanne('COQUE DETRUITE !'); break; } }
    // drone réparateur : un point de coque toutes les 20 s
    if (e.reparateur && this.coque < c.coque) { this.repare = (this.repare || 0) + dt; if (this.repare > 20) { this.repare = 0; this.coque++; } }
    // tourelles : chacune vise la roche la plus proche (les rapides d'abord), tourne puis tire quand elle est alignée
    this.tirs.forEach((T, i) => { const [tx, ty] = this.mondeTourelle(i); let cible = null, bd = MDE_TIR.portee;
      for (const a of this.asts) { const d = Math.hypot(a.x - tx, a.y - ty) - a.ray - (a.rapide ? 120 : 0); if (d < bd) { bd = d; cible = a; } }
      T.t -= dt; if (!cible) return;
      const voulu = Math.atan2(cible.y - ty, cible.x - tx) + Math.PI / 2; let d = voulu - T.a; d = Math.atan2(Math.sin(d), Math.cos(d)); T.a += Math.max(-5 * dt, Math.min(5 * dt, d));
      if (Math.abs(d) < 0.12 && T.t <= 0) { T.t = MDE_TIR.cadence; const fx = Math.sin(T.a), fy = -Math.cos(T.a), lg = 10 + VISIBLE[e.ameliorations.canon] * 2;
        this.balles.push({ x: tx + fx * lg, y: ty + fy * lg, vx: fx * 380, vy: fy * 380, v: 0.65, a: T.a }); T.recul = 0.08; } });
    this.suite(dt);
  }
  tomberEnPanne(t) { this.carbu = Math.max(0, this.carbu); this.panne = 2.4; this.joy = null; this.auto = false; this.texte(this.ship.x, this.ship.y - 44, t, '#ff6a5c'); }
  suite(dt) {
    const s = this.ship, deg = this.C.degats;
    for (const b of this.balles) { b.x += b.vx * dt; b.y += b.vy * dt; b.v -= dt;
      for (const a of this.asts) if (Math.hypot(a.x - b.x, a.y - b.y) < a.ray) { b.v = 0; a.r.pv -= deg; a.flash = 0.08; this.eclats(b.x, b.y, 3, a.r.minerai); if (a.r.pv <= 0) this.casser(a); break; } }
    this.balles = this.balles.filter(b => b.v > 0);
    const aimant = 90 * this.C.aimant;
    for (const d of this.drops) { d.v -= dt; const dx = s.x - d.x, dy = s.y - d.y, dist = Math.hypot(dx, dy);
      if (!this.quai && !this.panne && dist < aimant) { const plein = this.soute.length >= this.C.soute;
        if (!plein) { d.vx += dx / dist * 600 * dt; d.vy += dy / dist * 600 * dt; } else if (dist < 40 && !(this.pleinT > 0)) { this.pleinT = 2; this.texte(s.x, s.y - 44, 'SOUTE PLEINE', '#ff6a5c'); }
        if (!plein && dist < 18) { d.v = 0; this.soute.push(d.type); const rare = MDE_MINERAIS[d.type].prix >= 20; this.texte(d.x, d.y - 8, rare ? MDE_MINERAIS[d.type].nom + ' !' : '+1', rare ? '#ffcf4a' : '#d8c2aa'); } }
      d.vx *= 1 - dt * 1.2; d.vy *= 1 - dt * 1.2; d.x += d.vx * dt; d.y += d.vy * dt; }
    this.drops = this.drops.filter(d => d.v > 0); this.pleinT = (this.pleinT || 0) - dt;
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.v -= dt; } this.parts = this.parts.filter(p => p.v > 0);
    for (const t of this.textes) { t.y -= 14 * dt; t.v -= dt; } this.textes = this.textes.filter(t => t.v > 0);
    for (const T of this.tirs) T.recul = Math.max(0, (T.recul || 0) - dt);
    this.secousse = Math.max(0, this.secousse - dt);
    const qx = Math.cos(Math.atan2(s.y, s.x)) * 0, cx = this.quai ? W / 2 - Math.min(170, W * 0.27) + qx : s.x + s.vx * 0.5, cy = this.quai ? 0 : s.y + s.vy * 0.5;
    this.cam.x += (cx - this.cam.x) * Math.min(1, dt * (this.quai ? 2 : 3)); this.cam.y += (cy - this.cam.y) * Math.min(1, dt * (this.quai ? 2 : 3));
  }
  // une roche cassée : ses éclats (règles), ou son minerai si c'était une petite
  casser(a) {
    this.asts.splice(this.asts.indexOf(a), 1);
    if (a.rapide) { this.eclats(a.x, a.y, 8, 'fer', true); return; }
    const R = this.R, l = mdeEclats(a.r, R);
    l.forEach((r, i) => { const an = i / l.length * TAU + R() * 0.6, v = 25 + R() * 25;
      this.nouvelleRoche(r, a.x + Math.cos(an) * a.ray * 0.5, a.y + Math.sin(an) * a.ray * 0.5, a.vx + Math.cos(an) * v, a.vy + Math.sin(an) * v); });
    const n = mdeButin(this.e, a.r, R);
    for (let i = 0; i < n; i++) { const an = R() * TAU; this.drops.push({ x: a.x, y: a.y, vx: a.vx + Math.cos(an) * 40, vy: a.vy + Math.sin(an) * 40, v: 14, type: a.r.minerai }); }
    this.eclats(a.x, a.y, l.length ? 14 : 10, a.r.minerai, true);
  }
  eclats(x, y, n, m, gros) { const C = aspect(m) === 'or' ? ['#c9cde0', '#ffe08a', '#71789c'] : ['#b0927a', '#d0752c', '#5e4640'];
    for (let i = 0; i < n; i++) { const an = this.R() * TAU, v = 20 + this.R() * (gros ? 80 : 40); this.parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, v: 0.3 + this.R() * (gros ? 0.7 : 0.2), c: C[i % 3], t: gros && i % 4 === 0 ? 3 : gros ? 2 : 1 }); } }
  /* ---------- dessin ---------- */
  dessin(t) {
    const x = this.x, s = this.ship, e = this.e, c = this.C, sk = this.secousse > 0 ? (this.R() - 0.5) * 6 : 0;
    const ox = Math.round(W / 2 - this.cam.x + sk), oy = Math.round(H / 2 - this.cam.y + sk);
    x.fillStyle = '#05060d'; x.fillRect(0, 0, W, H);
    const px = ((-this.cam.x * 0.2) % 512 + 512) % 512, py = ((-this.cam.y * 0.2) % 512 + 512) % 512;
    for (let i = -1; i < 2; i++) for (let k = -1; k < 1; k++) x.drawImage(ciel, Math.round(px + i * 512), Math.round(py + k * 512));
    x.globalAlpha = 0.6; x.drawImage(neb, Math.round(ox * 0.3 + 200), Math.round(oy * 0.3 - 330), 512, 512); x.drawImage(neb, Math.round(ox * 0.3 - 700), Math.round(oy * 0.3 + 60), 512, 512); x.globalAlpha = 1;
    x.strokeStyle = '#1c2246'; x.setLineDash([3, 6]); x.beginPath(); x.arc(ox, oy, this.rMax, 0, 7); x.stroke(); x.setLineDash([]);
    const la = -2.4 + t * 0.008, lx = ox + Math.cos(la) * LUNE_D, ly = oy + Math.sin(la) * LUNE_D;
    if (lx > -RL && ly > -RL && lx < W + RL && ly < H + RL) { x.drawImage(luneC, Math.round(lx - RL / 2), Math.round(ly - RL / 2));
      x.font = '9px Silkscreen'; x.fillStyle = '#8c93c4'; x.textAlign = 'center'; x.fillText(e.recherche.transfert ? 'LUNE' : 'LUNE · MOTEUR DE TRANSFERT', lx, ly + RL / 2 + 12); }
    x.drawImage(terreC, ox - RT / 2, oy - RT / 2);
    x.strokeStyle = this.quai ? '#7be07b66' : '#7be07b26'; x.beginPath(); x.arc(ox, oy, R_QUAI, 0, 7); x.stroke();
    for (const a of this.asts) { const sx = Math.round(a.x + ox), sy = Math.round(a.y + oy), L = a.v.L; if (sx < -L || sy < -L || sx > W + L || sy > H + L) continue;
      if (a.rapide) { // queue de feu en gros pixels, qui s'amincit derrière la météorite
        const v = Math.hypot(a.vx, a.vy) || 1, ux = -a.vx / v, uy = -a.vy / v, lg = 30 + ((t * 20 | 0) % 3) * 2;
        for (let q = lg; q >= 0; q -= 1) { const f = q / lg, w = Math.max(1, Math.round(7 * (1 - f)));
          x.fillStyle = f < 0.2 ? '#fff2a0' : f < 0.45 ? '#f2a94a' : f < 0.75 ? '#d0752c' : '#8c4a24'; x.fillRect(Math.round(sx + ux * q - w / 2), Math.round(sy + uy * q - w / 2), w, w); } }
      const im = a.v.fr[nRoc(a.rot)]; x.drawImage(im, sx - (L >> 1), sy - (L >> 1));
      if (a.rapide) { x.globalCompositeOperation = 'lighter'; x.drawImage(BRAISE, sx - 8, sy - 8); x.globalCompositeOperation = 'source-over'; }
      if (a.flash > 0) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.45; x.drawImage(im, sx - (L >> 1), sy - (L >> 1)); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
      if (a.r.pv < a.pvMax) { x.fillStyle = '#000a'; x.fillRect(sx - 12, sy - a.ray - 8, 24, 3); x.fillStyle = '#ff9d4a'; x.fillRect(sx - 12, sy - a.ray - 8, 24 * a.r.pv / a.pvMax, 3); } }
    for (const d of this.drops) { const b = Math.sin(t * 5 + d.x); x.drawImage(PEP[d.type], Math.round(d.x + ox - 6), Math.round(d.y + oy - 5 + b), 12, 10); }
    for (const p of this.parts) { x.fillStyle = p.c; x.fillRect(Math.round(p.x + ox), Math.round(p.y + oy), p.t, p.t); }
    for (const b of this.balles) { x.save(); x.translate(Math.round(b.x + ox), Math.round(b.y + oy)); x.rotate(b.a); x.fillStyle = '#d0752c'; x.fillRect(-1.5, -5, 3, 10); x.fillStyle = '#fff2a0'; x.fillRect(-0.5, -4, 1, 7); x.restore(); }
    // corvette : rendu de l'angle le plus proche, tourné du petit reste ; flammes ; tourelles
    const k = nAng(s.a), F = this.nef.frames[k], sx0 = Math.round(s.x + ox), sy0 = Math.round(s.y + oy), bx = -Math.sin(s.a), by = Math.cos(s.a);
    if (this.pousse > 0.1 && !this.panne && !this.quai) for (const [ex, ey, er] of F.engines) { const nm = e.ameliorations.moteur, l = er * (1.2 + this.pousse * 1.6) * (1 + 0.15 * nm) + ((t * 30 | 0) % 2);
      for (let q = 0; q < l; q++) { const f = q / l; x.fillStyle = f < 0.3 ? (nm >= 3 ? '#bfe8ff' : '#fff2a0') : f < 0.65 ? '#f2a94a' : '#d0752c'; const w = Math.max(1, Math.round(er * (1 - f * 0.6)));
        x.fillRect(Math.round(sx0 - L_NEF / 2 + ex + bx * q - w / 2), Math.round(sy0 - L_NEF / 2 + ey + by * q - w / 2), w, w); } }
    const reste = s.a - k / N_ANG * TAU; x.save(); x.translate(sx0, sy0); x.rotate(Math.atan2(Math.sin(reste), Math.cos(reste)));
    if (this.secousse > 0 && (t * 20 | 0) % 2) x.globalAlpha = 0.5; x.drawImage(F.img, -L_NEF / 2, -L_NEF / 2); x.restore();
    this.tirs.forEach((T, i) => { const [tx, ty] = this.mondeTourelle(i), kt = nAng(T.a), rt = T.a - kt / N_ANG * TAU; x.save(); x.translate(Math.round(tx + ox), Math.round(ty + oy)); x.rotate(Math.atan2(Math.sin(rt), Math.cos(rt))); x.drawImage(this.tour[kt], -14, -14); x.restore(); });
    for (const tx of this.textes) { x.font = '11px Silkscreen'; x.textAlign = 'center'; x.fillStyle = '#000'; x.fillText(tx.t, tx.x + ox + 1, tx.y + oy + 1); x.fillStyle = tx.c; x.fillText(tx.t, tx.x + ox, tx.y + oy); }
    // flèche vers la Terre quand elle sort de l'écran (rouge si le carburant devient juste)
    if (ox < -RT / 2 + 20 || oy < -RT / 2 + 20 || ox > W + RT / 2 - 20 || oy > H + RT / 2 - 20) { const an = Math.atan2(oy - H / 2, ox - W / 2), kk = Math.min((W / 2 - 26) / Math.abs(Math.cos(an)), (H / 2 - 50) / Math.abs(Math.sin(an)));
      const fx = W / 2 + Math.cos(an) * kk, fy = H / 2 + Math.sin(an) * kk + 10, d = Math.hypot(s.x, s.y) - R_QUAI, juste = d / (120 * c.vitesse) > this.carbu * 0.7, col = juste ? '#ff6a5c' : '#7be07b';
      x.save(); x.translate(fx, fy); x.rotate(an); x.fillStyle = col; x.beginPath(); x.moveTo(10, 0); x.lineTo(-6, -7); x.lineTo(-6, 7); x.fill(); x.restore();
      x.font = '9px Silkscreen'; x.textAlign = 'center'; x.fillStyle = col; x.fillText('TERRE ' + Math.round(d / 10) + ' KM', fx - Math.cos(an) * 24, fy - Math.sin(an) * 20 + 3); }
    // alerte météorite : chevrons rouges qui clignotent au bord de l'écran, du côté d'où elle arrive
    if (this.alerteMeteo && (t * 6 | 0) % 2) { const an = this.alerteMeteo.an, kk = Math.min((W / 2 - 20) / Math.abs(Math.cos(an)), (H / 2 - 44) / Math.abs(Math.sin(an)));
      const fx = W / 2 + Math.cos(an) * kk, fy = H / 2 + 8 + Math.sin(an) * kk; x.save(); x.translate(fx, fy); x.rotate(an + Math.PI); x.fillStyle = '#ff6a5c';
      for (const o of [0, 9]) { x.beginPath(); x.moveTo(o + 8, 0); x.lineTo(o - 4, -8); x.lineTo(o - 4, 8); x.fill(); } x.restore();
      x.font = '9px Silkscreen'; x.textAlign = 'center'; x.fillStyle = '#ff6a5c'; x.fillText('METEORITE', fx - Math.cos(an) * 34, fy - Math.sin(an) * 22 + 3); }
    // barre du haut : CR, classe, soute, coque, carburant (le bouton de pause est à droite, en HTML)
    x.fillStyle = '#05060dcc'; x.fillRect(0, 0, W, 30);
    x.font = '13px Silkscreen'; x.textAlign = 'left'; x.fillStyle = '#ffcf4a'; x.fillText(e.cr + ' CR', 10, 20);
    x.font = '9px Silkscreen'; x.fillStyle = '#8c93c4'; x.fillText(c.nom, 92, 19);
    const sm = c.soute, s0 = Math.round(W / 2 - sm * 6.5 - 30); for (let i = 0; i < sm; i++) { const cx = s0 + i * 13; x.fillStyle = '#1a1f40'; x.fillRect(cx, 8, 11, 12); x.strokeStyle = '#2f3770'; x.strokeRect(cx + 0.5, 8.5, 10, 11);
      if (this.soute[i]) x.drawImage(PEP[this.soute[i]], cx + 1, 10, 9, 8); }
    const c0 = s0 + sm * 13 + 10; for (let i = 0; i < c.coque; i++) { x.fillStyle = i < this.coque ? '#9fd0ff' : '#2a3060'; x.fillRect(c0 + i * 6, 10, 4, 10); }
    const f = this.carbu / c.vol, bw = 90, bxx = W - 48 - bw; x.textAlign = 'right'; x.fillStyle = '#8c93c4'; x.fillText('CARBU', bxx - 6, 18); x.fillStyle = '#1a1f40'; x.fillRect(bxx, 11, bw, 8);
    x.fillStyle = f < 0.25 ? (t * 4 % 1 < 0.5 ? '#ff6a5c' : '#7a2a26') : f < 0.5 ? '#ff9d4a' : '#7be07b'; x.fillRect(bxx, 11, Math.round(bw * f), 8);
    if (!this.quai && !this.panne) { const j = this.joy, bx2 = j ? j.bx : 70, by2 = j ? j.by : H - 70;
      x.globalAlpha = j ? 0.55 : 0.25; x.strokeStyle = '#9fd0ff'; x.lineWidth = 2; x.beginPath(); x.arc(bx2, by2, 40, 0, 7); x.stroke();
      x.fillStyle = '#9fd0ff'; x.beginPath(); x.arc(bx2 + (j ? j.dx : 0), by2 + (j ? j.dy : 0), 15, 0, 7); x.fill(); x.lineWidth = 1; x.globalAlpha = 1;
      x.fillStyle = this.auto ? '#2f7a3a' : '#1d2560cc'; x.strokeStyle = this.auto ? '#6fdc7f' : '#5a6be0'; x.fillRect(W - 116, H - 46, 104, 34); x.strokeRect(W - 115.5, H - 45.5, 103, 33);
      x.font = '11px Silkscreen'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText(this.auto ? 'RETOUR...' : 'RENTRER', W - 64, H - 24); }
  }
}

/* ---------- lancement ---------- */
let partie = null, lance = false;
function demarrer() {
  if (lance) return; lance = true;
  preparerRoches(); partie = new Partie(document.getElementById('jeu'));
  window.Mineur = { get partie() { return partie; }, get etat() { return partie.e; } };
  dessinerLune(); let av = performance.now();
  function boucle(n) { const dt = Math.min(0.05, (n - av) / 1000); av = n; majPlanetes(dt); if ((n / 250 | 0) !== boucle.l) { boucle.l = n / 250 | 0; dessinerLune(); }
    partie.pas(dt); partie.dessin(n / 1000); requestAnimationFrame(boucle); }
  requestAnimationFrame(boucle);
}
(document.fonts ? document.fonts.ready : Promise.resolve()).then(demarrer);
setTimeout(demarrer, 2500);

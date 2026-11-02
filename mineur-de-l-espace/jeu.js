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
const H = 300, R_ST = 255, W_ST = 0.02;
// les planètes qu'on voit au loin depuis chaque planète : [planète, angle de départ, distance, échelle]
const CIEL = { terre: [['lune', -2.4, 1080, 1]], lune: [['terre', 0.9, 1150, 1.25]], mars: [['terre', -0.6, 1500, 0.45], ['lune', -0.75, 1480, 0.2]] };   // R_ST : orbite de la station (au-delà de la planète) ; W_ST : sa vitesse (rad/s)
const TAILLES = [11, 19, 32];   // TAILLES : rayon des petites, moyennes, grosses
let W = 640;
const CLE_COMMANDES = 'mineur-de-l-espace.commandes';
// joystick fixe en bas à gauche ; en mode « bouton », POUSSER en bas à droite et RENTRER au-dessus
const JOY = { x: 78, y: H - 78, r: 40 }, GAZ = () => ({ x: W - 66, y: H - 66, r: 40 }), BRENTRER = pc => modeCommandes === 'bouton' && !pc ? { x: W - 116, y: H - 148, w: 104, h: 32 } : { x: W - 116, y: H - 46, w: 104, h: 34 };
let modeCommandes = 'bouton';
const CLE_VIBRE = 'mineur-de-l-espace.vibre';
let modeVibre = true; try { modeVibre = localStorage.getItem(CLE_VIBRE) !== 'non'; } catch (err) { /* stockage indisponible */ }
try { modeCommandes = localStorage.getItem(CLE_COMMANDES) || 'bouton'; } catch (err) { /* stockage indisponible */ }

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
// réserve de roches : 3 tailles × 3 formes × chaque minerai (sa roche et ses veines, chantier.js), angles tracés à la demande
const ROCS = [];
function preparerRoches() { const R = mulberry(99); for (let t = 0; t < 3; t++) { ROCS[t] = {}; for (const m in MDE_MINERAIS) ROCS[t][m] = []; for (let v = 0; v < 3; v++) { const g = R() * 1e9 | 0;
  for (const m in MDE_MINERAIS) ROCS[t][m].push(construireRoche(mulberry(g), TAILLES[t], m)); } } }
// halo d'une météorite : disque de braise en gros pixels (ajouté en mode « lighter » sur la roche)
const [BRAISE, braiseX] = toile(16);
(() => { for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { const d = Math.hypot(i - 7.5, j - 7.5); if (d > 7.5) continue;
  braiseX.fillStyle = d < 3 ? '#e08a40' : d < 5.5 ? '#b04420' : '#5a180a'; braiseX.fillRect(i, j, 1, 1); } })();
// niveau d'amélioration (0 à 5) → ce qui se voit sur la corvette (0 à 3)
const VISIBLE = [0, 1, 2, 2, 3, 3];

/* ---------- la partie ---------- */
class Partie {
  constructor(el) {
    this.el = el;
    const e = document.createElement('div'); e.className = 'ecran'; el.appendChild(e); this.ecran = e;
    const [c, x] = toile(W, H); this.c = c; this.x = x; e.appendChild(c);
    this.e = this.charger(); this.onglet = 'amel';
    this.ship = { x: 0, y: -R_ST - QUAI_ST, vx: 0, vy: 0, a: 0 }; this.cam = { x: 0, y: 0 };
    this.soute = []; this.balles = []; this.drops = []; this.parts = []; this.textes = []; this.joy = null; this.gaz = null; this.auto = false; this.panne = 0;
    this.asts = []; this.R = mulberry(Date.now() & 0xffffff); this.prochainDanger = 20; this.respawn = 0; this.secousse = 0; this.pauseVue = false; this.tSauve = 0;
    for (let k = 0; k < 16; k++) this.nouvelleRoche();
    this.panneau(); this.pause(); this.entrees(); this.rebatir(); this.accoster(true);
    this.cam.x = this.ship.x; this.cam.y = this.ship.y;
    this.ajuster(); addEventListener('resize', () => this.ajuster());
    this.titre();
  }
  /* ---------- écran titre : la station et la planète tournent derrière ; continuer, nouvelle partie, retour ---------- */
  titre() {
    const e = this.e, enCours = e.temps > 30, f = document.createElement('div'); f.className = 'titre'; this.ecran.appendChild(f); this.ecranTitre = f; this.pauseVue = true; this.p.classList.remove('vu');
    const etage = mdeEtage(e), h = Math.floor(e.temps / 3600), m = Math.floor(e.temps / 60) % 60;
    f.innerHTML = `<div class="boite"><h1>MINEUR<br>DE L'ESPACE</h1><p class="sous">CASSE, RAMASSE, CONSTRUIS, DEFENDS</p>
      ${enCours ? `<button class="btn grand" data-t="continuer">CONTINUER</button><p class="doux">${e.fin ? 'PARTIE FINIE · MODE LIBRE' : 'ETAGE ' + etage + ' / 4'} · ${h} H ${String(m).padStart(2, '0')} · ${e.cr} CR</p>
        <button class="btn" data-t="nouvelle">NOUVELLE PARTIE</button>` : `<button class="btn grand" data-t="nouvelle">JOUER</button>`}
      <a class="btn ludo-retour" href="../index.html">◀ LUDOTHEQUE</a><p class="doux">AU PC : CLAVIER ET SOURIS · ENTREE : JOUER</p></div>`;
    f.addEventListener('click', ev => { const b = ev.target.closest('[data-t]'); if (!b) return; const k = b.dataset.t;
      if (k === 'nouvelle' && enCours) { if (!b.dataset.sur) { b.dataset.sur = 1; b.textContent = 'SUR ? LA PARTIE EST EFFACEE'; return; } }
      if (k === 'nouvelle' && enCours) this.nouvellePartie();
      this.son('quai'); f.remove(); this.ecranTitre = null; this.pauseVue = false; if (this.quai) { this.majPanneau(); this.p.classList.add('vu'); } });
  }
  /* sauvegarde : l'état des règles (un objet JSON) */
  charger() {
    try { const t = localStorage.getItem(CLE); if (t) { const e = mdeMigrer(JSON.parse(t)); if (e) return e; } } catch (err) { /* stockage indisponible */ }
    return mdeNouvelle('m' + Date.now());
  }
  sauver() { try { localStorage.setItem(CLE, JSON.stringify(this.e)); } catch (err) { /* stockage indisponible */ } }
  nouvellePartie() { this.e = mdeNouvelle('m' + Date.now()); this.sauver(); this.soute = []; this.drops = []; this.rebatir(); this.accoster(true); }
  // l'écran : 300 px de haut, largeur selon le téléphone (à l'horizontale)
  ajuster() {
    const r = this.el.getBoundingClientRect(), L = Math.round(Math.max(420, Math.min(760, H * r.width / Math.max(1, r.height))));
    W = L; const k = Math.min(r.width / W, r.height / H);
    // résolution : le canvas est tracé à la taille réelle de l'écran (multiple entier de 300 px de haut), le pixel art
    // grossit en gros pixels réguliers, le texte, les traits et les rotations restent fins (surtout sur PC)
    const RES = Math.max(1, Math.min(4, Math.floor(k * (devicePixelRatio || 1) + 0.15)));
    if (this.c.width !== W * RES || this.c.height !== H * RES) { this.c.width = W * RES; this.c.height = H * RES; this.x = this.c.getContext('2d'); }
    this.res = RES; if (this.majResolution) this.majResolution(RES); this.x.imageSmoothingEnabled = false; this.ecran.style.width = W + 'px'; this.ecran.style.height = H + 'px';
    this.ecran.style.transform = `translate(${(r.width - W * k) / 2}px, ${(r.height - H * k) / 2}px) scale(${k})`;
    document.body.classList.toggle('debout', r.height > r.width);
  }
  get C() { return mdeCorvette(this.e); }
  // ce qui est construit à la station de la planète où l'on est : la grande station sur Terre ; ailleurs un avant-poste, puis la base
  stationIci() { const e = this.e, p = e.planete; return p === 'terre' ? e.station : e.bases[p] ? { central: true, poutre: true, ailes: true, hangar: true, radiateurs: p === 'mars' } : {}; }
  // la station : angle sur son orbite (lié au temps de jeu), position, vitesse, et la place de la corvette amarrée (quai vers l'extérieur)
  station() {
    const phi = -Math.PI / 2 + this.e.temps * W_ST, ux = Math.cos(phi), uy = Math.sin(phi), x = ux * R_ST, y = uy * R_ST;
    return { phi, x, y, vx: -uy * R_ST * W_ST, vy: ux * R_ST * W_ST, qx: x + ux * QUAI_ST, qy: y + uy * QUAI_ST, a: phi - Math.PI / 2 };
  }
  rebatir() {
    const A = this.e.ameliorations, c = this.C, cl = CLASSES[this.e.classe] ? this.e.classe : 'escorte';
    // les sprites des packs (combat.js) s'ils sont chargés, sinon le moteur de Nebula
    const sp = this.nefSprite && this.nefSprite(this.e.classe, c.tourelles), ts = sp && this.tourSprite();
    this.nef = sp || construireNef(cl, { reservoir: VISIBLE[A.reservoir], soute: VISIBLE[Math.min(5, A.soute)] }, c.tourelles);
    this.tour = ts ? ts.fr : tourelle(VISIBLE[A.canon]); this.tourEch = ts ? ts.ech : 1;
    if (this.armerEscadrille) this.armerEscadrille();
    this.tirs = this.nef.tourelles.map((_, i) => ({ a: 0, t: i * 0.15 }));
    this.carbu = c.vol; this.coque = c.coque;
  }
  get rMax() { return 800 * (this.e.recherche.moteurs ? 1.15 : 1); }
  // une roche : taille 3, 2 ou 1 (règles) ; sans position, une grosse roche loin du joueur dans la ceinture
  nouvelleRoche(r, x, y, vx = 0, vy = 0) {
    const R = this.R;
    if (!r) r = mdeRoche(this.e, this.e.planete, R);
    if (x === undefined) { let d, an; do { d = 340 + R() * 320; an = R() * TAU; } while (Math.hypot(Math.cos(an) * d - this.ship.x, Math.sin(an) * d - this.ship.y) < 260 && this.asts.length);
      x = Math.cos(an) * d; y = Math.sin(an) * d; }
    const t = r.taille - 1;
    this.asts.push({ x, y, vx, vy, r, v: ROCS[t][r.minerai][R() * 3 | 0], ray: TAILLES[t] * 0.82, rot: R() * TAU, vr: (R() - 0.5) * (1.2 - t * 0.3), flash: 0, pvMax: r.pv });
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
      else if (b.dataset.a) { const id = b.dataset.a; if (mdeAcheter(this.e, id)) { this.son('achat'); if (/^(amel|classe|esc)/.test(id)) this.rebatir();
        const S = this.station(), mod = id.startsWith('module:');
        this.texte(mod ? S.x : this.ship.x, mod ? S.y - 80 : this.ship.y - 46, mod ? MDE_MODULES[id.slice(7)].nom + ' INSTALLE !' : id.startsWith('drone:') ? 'NOUVEAU DRONE !' : 'ACHETE !', '#7be07b'); this.sauver(); } }
      else if (b.dataset.c) { if (mdeChangerClasse(this.e, b.dataset.c)) { this.rebatir(); this.sauver(); } }
      else if (b.dataset.r) { if (!this.bat && mdeRetirerUnite(this.e, this.e.planete, +b.dataset.r)) this.sauver(); }
      else if (b.dataset.fin) { if (this.e.aliens.finale && !this.e.fin && !this.bat) { this.decoller(); this.lancerBataille(true); } return; }
      else if (b.dataset.go) return this.decoller();
      else if (b.dataset.v) return this.voyager(b.dataset.v);
      this.majPanneauSiCalme(); });
  }
  majPanneau() {
    const e = this.e, l = mdeAchats(e), O = [['amel', 'AMELIORER'], ['usine', 'USINES'], ['rech', 'RECHERCHE']];
    if (e.recherche.centre) O.push(['station', 'STATION']);
    if (e.recherche.transfert) O.push(['carte', 'CARTE']);
    if (!O.some(o => o[0] === this.onglet)) this.onglet = 'amel';
    const prix = P => Object.entries(P).map(([k, v]) => k === 'cr' ? v + ' CR' : v + ' ' + MDE_MINERAIS[k].nom).join(' + ');
    let h = `<div class="onglets">${O.map(([k, n]) => `<button class="btn ${this.onglet === k ? 'actif' : ''}" data-o="${k}">${n}</button>`).join('')}</div>`;
    h += `<h4>A QUAI · ${MDE_PLANETES[e.planete].nom} · ${e.cr} CR</h4>`;
    // étage 4 : combat en cours, base hors service, bataille finale
    if (this.bat && !this.bat.fini) h += `<p class="alerte">${this.bat.finale ? 'BATAILLE FINALE EN COURS !' : 'ATTAQUE EN COURS : DECOLLE POUR DEFENDRE LA STATION !'}</p>`;
    if (e.hs[e.planete]) h += `<p class="alerte">BASE HORS SERVICE : PLUS DE DRONES NI DE FLOTTE ICI. REPARE-LA (ONGLET STATION).</p>`;
    if (e.aliens.finale && !e.fin && !this.bat) h += `<p class="alerte">LE VAISSEAU-MERE APPROCHE. TOUTES TES FLOTTES SE REUNIRONT POUR LA BATAILLE.</p><button class="btn go finale" data-fin="1">BATAILLE FINALE</button>`;
    const mis = Object.entries(e.entrepot).filter(([, n]) => n > 0);
    if (mis.length) h += `<p class="mis">MIS DE COTE : ${mis.map(([m, n]) => n + ' ' + MDE_MINERAIS[m].nom).join(', ')}</p>`;
    const ligne = (a) => `<div class="ligne"><span class="nom">${a.nom}<small>${a.effet}</small></span><button class="btn" data-a="${a.id}" ${a.possible ? '' : 'disabled'}>${prix(a.prix)}</button></div>`;
    const rien = t => `<p class="vide">${t}</p>`;
    if (l.some(x => !x.possible && Object.keys(x.prix).length > 1 && x.type === (this.onglet === 'station' ? 'module' : this.onglet)))
      h += '<p>LE QUAI MET DE COTE LE MINERAI D\'UN ACHAT DES QUE TU AS LA MOITIE DE SES CR.</p>';
    if (this.onglet === 'amel') {
      const c = this.C; h += `<p class="fiche">${c.nom} · ${c.tourelles} TOURELLE${c.tourelles > 1 ? 'S' : ''} · DEGATS ${c.degats} · SOUTE ${c.soute} · ${c.vol} S · COQUE ${c.coque}</p>`;
      const a = l.filter(x => x.type === 'amel'); h += a.length ? a.map(ligne).join('') : rien('TOUT EST AU MAXIMUM POUR L\'INSTANT');
      if (e.classes.porte) { const E = mdeEscadrille(e), es = l.filter(x => x.type === 'esc');
        h += `<h5>ESCADRILLE DU PORTE-VAISSEAUX</h5><p class="fiche">${E.nb} CHASSEURS · ENERGIE ${E.energie} S · DEGATS ${E.degats} · PV ${E.pv} · DEFENSE ${E.defense.portee} M${E.grand ? ' · CHASSEURS LOURDS' : ''}</p>`;
        h += es.length ? es.map(ligne).join('') : rien('ESCADRILLE AU MAXIMUM POUR L\'INSTANT'); }
    } else if (this.onglet === 'usine') {
      h += `<p class="fiche">PRIX : ${Object.keys(MDE_MINERAIS).filter(m => m === 'fer' || m === 'or' || mdeEtage(e) >= 3).map(m => MDE_MINERAIS[m].nom + ' ' + mdePrix(e, m)).join(' · ')}</p>`;
      const a = l.filter(x => x.type === 'usine'); h += a.length ? a.map(ligne).join('') : rien('TOUTES LES USINES SONT AU MAXIMUM');
    } else if (this.onglet === 'carte') {
      // la carte du système : les trois planètes, où l'on est, les voyages et les bases
      h += `<canvas class="carte" width="280" height="64"></canvas>`;
      for (const pl of Object.keys(MDE_PLANETES)) { const P = MDE_PLANETES[pl], ici = pl === e.planete, ouvert = !P.req || P.req(e), mars = pl !== 'mars' || e.bases.lune;
        const mins = Object.keys(P.ceinture).map(m => MDE_MINERAIS[m].nom).join(', '), cout = mdeCoutVoyage(e, pl);
        let bouton;
        if (ici) bouton = `<button class="btn" disabled>ICI</button>`;
        else if (!ouvert || !mars) bouton = `<button class="btn" disabled>FERME</button>`;
        else bouton = `<button class="btn" data-v="${pl}" ${mdePeutVoyager(e, pl) ? '' : 'disabled'}>${prix(cout)}</button>`;
        const pourquoi = !ouvert ? (pl === 'lune' ? 'IL FAUT LE MOTEUR DE TRANSFERT' : 'IL FAUT LA BASE LUNAIRE PUIS LA PROPULSION LOINTAINE') : !mars ? 'IL FAUT LA BASE LUNAIRE' : mins;
        h += `<div class="ligne"><span class="nom">${P.nom}${e.bases[pl] ? ' · BASE' : ''}<small>${pourquoi}</small></span>${bouton}</div>`; }
      const b = l.filter(x => x.type === 'base'); if (b.length) { h += `<h5>BASES</h5><p>UNE BASE DONNE UN HANGAR A DRONES A LA PLANETE (ET PLUS TARD UNE FLOTTE).</p>` + b.map(ligne).join(''); }
    } else if (this.onglet === 'rech') {
      const a = l.filter(x => x.type === 'rech'); h += a.length ? a.map(ligne).join('') : rien('RIEN A CHERCHER POUR L\'INSTANT');
    } else {
      // trois parties : modules (la station grandit), classes de corvette, drones du hangar
      const titre = t => `<h5>${t}</h5>`, nMod = Object.keys(e.station).filter(k => e.station[k]).length;
      h += titre('MODULES · ' + nMod + ' / ' + Object.keys(MDE_MODULES).length);
      const mods = l.filter(x => x.type === 'module'); h += mods.length ? mods.map(ligne).join('') : rien(nMod === Object.keys(MDE_MODULES).length ? 'LA STATION EST COMPLETE' : 'LES AUTRES MODULES ARRIVENT PLUS TARD');
      h += titre('CLASSES DE CORVETTE');
      h += l.filter(x => x.type === 'classe').map(ligne).join('');
      h += Object.keys(e.classes).map(c => `<div class="ligne"><span class="nom">${MDE_CLASSES[c].nom}<small>${MDE_CLASSES[c].tourelles} TOURELLE(S) · SOUTE ${MDE_CLASSES[c].soute} · ${MDE_CLASSES[c].vol} S</small></span><button class="btn" data-c="${c}" ${c === e.classe ? 'disabled' : ''}>${c === e.classe ? 'A BORD' : 'PRENDRE'}</button></div>`).join('');
      const rep = l.find(x => x.type === 'reparer'); if (rep) h += titre('BASE HORS SERVICE') + ligne(rep);
      if (mdeEtage(e) >= 4 && mdeABase(e, e.planete)) {
        // la flotte de la planète (auto battler) : elle se bat seule quand les aliens attaquent
        const F = e.flottes[e.planete], pl = mdePlaces(e);
        h += titre('FLOTTE · ' + MDE_PLANETES[e.planete].nom + ' · ' + F.length + ' / ' + pl);
        h += `<p>ELLE DECOLLE QUAND LES ALIENS ATTAQUENT (PLUS TOT AVEC DES SATELLITES : ${e.satellites[e.planete] || 0} / 3). RETIRER UNE UNITE REND LA MOITIE DE SES CR.</p>`;
        h += F.map((u, i) => { const D = MDE_UNITES[u.type]; return `<div class="ligne"><span class="nom">${D.nom}<small>PV ${D.pv}${D.att ? ' · ATTAQUE ' + D.att : ''}${D.soin ? ' · SOIGNE ' + D.soin : ''}</small></span><button class="btn" data-r="${i}" ${this.bat ? 'disabled' : ''}>RETIRER</button></div>`; }).join('');
        h += l.filter(x => x.type === 'unite').map(ligne).join('');
      }
      h += titre('DRONES');
      if (!e.station.hangar) h += rien('IL FAUT LE HANGAR POUR FABRIQUER DES DRONES');
      else { const p = e.planete, q = mdeProduction(e, p), d = e.drones[p], val = Object.entries(MDE_PLANETES[p].ceinture).reduce((t, [m, x]) => t + x * mdePrix(e, m), 0);
        h += `<p class="mis">${d.mineur} MINEUR(S), ${d.cargo} CARGO(S) : ${q} MINERAI/MIN, ENVIRON ${Math.round(q * val)} CR/MIN${d.mineur > 2 * d.cargo ? ' · IL MANQUE DES CARGOS' : d.cargo * 2 > d.mineur + 1 && d.mineur < MDE_DRONES.mineur.max ? ' · IL MANQUE DES MINEURS' : ''}</p>`;
        h += `<p>LES DRONES TRAVAILLENT PENDANT QUE TU JOUES (PAS QUAND LE JEU EST FERME).</p>`;
        h += l.filter(x => x.type === 'drone').map(ligne).join(''); }
    }
    h += `<button class="btn go" data-go="1">DECOLLER${this.pc ? ' (ENTREE)' : ''}</button>`;
    this.p.innerHTML = h;
    const cv = this.p.querySelector('canvas.carte'); if (cv) this.dessinerCarte(cv);
  }
  // la petite carte : la Terre, la Lune et Mars sur leurs orbites autour d'un soleil, la planète où l'on est entourée
  dessinerCarte(cv) {
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#05060d'; x.fillRect(0, 0, cv.width, cv.height);
    x.fillStyle = '#ffcf4a'; x.beginPath(); x.arc(14, 32, 7, 0, 7); x.fill();
    const pos = { terre: [96, 32, 30], lune: [140, 20, 18], mars: [226, 34, 26] };
    x.strokeStyle = '#2a3060'; x.beginPath(); x.moveTo(96, 32); x.lineTo(140, 20); x.moveTo(140, 20); x.lineTo(226, 34); x.stroke();
    for (const pl in pos) { const [px, py, L] = pos[pl], ouvert = pl === 'terre' || (MDE_PLANETES[pl].req(this.e) && (pl !== 'mars' || this.e.bases.lune));
      x.globalAlpha = ouvert ? 1 : 0.35; x.drawImage(LOINTAINES[pl][0], px - L / 2, py - L / 2, L, L); x.globalAlpha = 1;
      if (pl === this.e.planete) { x.strokeStyle = '#7be07b'; x.beginPath(); x.arc(px, py, L / 2 + 3, 0, 7); x.stroke(); } }
  }
  majPanneauSiCalme() { const y = this.p.scrollTop; this.majPanneau(); this.p.scrollTop = y; }
  /* ---------- pause ---------- */
  pause() {
    const b = document.createElement('button'); b.className = 'btn bpause'; b.textContent = 'II'; this.ecran.appendChild(b);
    const f = document.createElement('div'); f.className = 'pause'; this.ecran.appendChild(f); this.f = f;
    f.innerHTML = `<div class="boite"><h3>PAUSE</h3><button class="btn" data-p="reprendre">REPRENDRE</button><button class="btn" data-p="commandes"></button><button class="btn" data-p="sons"></button><button class="btn" data-p="vibre"></button><button class="btn" data-p="titre">ECRAN TITRE</button>
      <a class="btn ludo-retour" href="../index.html">◀ LUDOTHEQUE</a><p class="doux">JOYSTICK + POUSSER : LE JOYSTICK TOURNE LA CORVETTE, LE BOUTON ACCELERE. JOYSTICK SEUL : IL TOURNE ET POUSSE. LA PARTIE EST SAUVEGARDEE AU QUAI.</p><p class="doux">SUR PC : Z (OU W), FLECHE HAUT OU ESPACE POUSSE ; Q (OU A) ET D OU LES FLECHES TOURNENT ; LA SOURIS VISE, CLIC GAUCHE POUSSE ; R RENTRE ; ENTREE DECOLLE ; ECHAP : PAUSE.</p></div>`;
    const majC = () => { f.querySelector('[data-p="commandes"]').textContent = modeCommandes === 'bouton' ? 'COMMANDES : JOYSTICK + POUSSER' : 'COMMANDES : JOYSTICK SEUL';
      f.querySelector('[data-p="sons"]').textContent = 'SONS : ' + (typeof MineurSons === 'undefined' || MineurSons.actif ? 'OUI' : 'NON');
      f.querySelector('[data-p="vibre"]').textContent = 'VIBRATIONS : ' + (modeVibre ? 'OUI' : 'NON'); }; majC();
    this.ouvrirPause = () => { this.pauseVue = true; this.joy = null; this.gaz = null; this.clic = false; if (this.touches) this.touches.clear(); f.classList.add('vu'); };
    this.fermerPause = () => { if (this.ecranTitre) return; this.pauseVue = false; f.classList.remove('vu'); };
    b.addEventListener('click', () => this.ouvrirPause());
    f.addEventListener('click', ev => { const k = ev.target.dataset && ev.target.dataset.p; if (!k) return;
      if (k === 'commandes') { modeCommandes = modeCommandes === 'bouton' ? 'glisse' : 'bouton'; try { localStorage.setItem(CLE_COMMANDES, modeCommandes); } catch (err) { /* stockage indisponible */ } majC(); return; }
      if (k === 'sons') { if (typeof MineurSons !== 'undefined') MineurSons.basculer(); majC(); return; }
      if (k === 'vibre') { modeVibre = !modeVibre; try { localStorage.setItem(CLE_VIBRE, modeVibre ? 'oui' : 'non'); } catch (err) { /* stockage indisponible */ } if (modeVibre) this.vibrer(80); majC(); return; }
      f.classList.remove('vu');
      if (k === 'titre') { this.sauver(); this.titre(); return; }
      this.pauseVue = false; });
  }
  /* ---------- quai, décollage ---------- */
  accoster(debut, panne) {
    this.quai = true; this.auto = false; this.joy = null; this.gaz = null; this.ship.vx = this.ship.vy = 0; this.panne = 0; this.alerteMeteo = null;
    { const S = this.station(); this.ship.x = S.qx; this.ship.y = S.qy; this.ship.a = S.a; }
    if (!debut) {
      const lot = {}; for (const m of this.soute) lot[m] = (lot[m] || 0) + 1;
      const r = mdeRetour(this.e, lot, panne), g = Object.entries(r.garde).map(([m, n]) => n + ' ' + MDE_MINERAIS[m].nom).join(', ');
      this.son(r.gain ? 'vente' : 'quai'); if (r.gain) this.texte(this.ship.x, this.ship.y - 40, `+${r.gain} CR`, '#ffcf4a');
      if (g) this.texte(this.ship.x, this.ship.y - 56, 'MIS DE COTE : ' + g, '#9fd0ff');
      this.sauver();
    }
    this.soute = []; const c = this.C; this.carbu = c.vol; this.coque = c.coque; if (this.armerEscadrille) this.armerEscadrille(); this.majPanneau(); this.p.classList.add('vu');
  }
  voyager(pl) {
    const de = this.e.planete; if (!mdeVoyager(this.e, pl)) return;
    this.p.classList.remove('vu'); this.enVoyage = { de, vers: pl, t: 0, d: 4 }; this.sauver(); this.son('voyage');
  }
  finVoyage() {
    const pl = this.enVoyage.vers; this.enVoyage = null;
    this.asts = []; this.drops = []; this.balles = []; this.parts = []; this.textes = []; for (let k = 0; k < 16; k++) this.nouvelleRoche();
    this.onglet = 'amel'; this.accoster(true); const S = this.station(); this.cam.x = S.x; this.cam.y = S.y;
    this.texte(S.x, S.y - 80, 'BIENVENUE : ' + MDE_PLANETES[pl].nom, '#7be07b');
  }
  decoller() {
    this.quai = false; this.sorti = false; this.p.classList.remove('vu'); const s = this.ship, S = this.station();
    this.son('decollage'); s.vx = S.vx + Math.cos(S.phi) * 45; s.vy = S.vy + Math.sin(S.phi) * 45; s.a = S.phi + Math.PI / 2;   // on recule du quai, nez vers l'extérieur this.prochainDanger = 12 + this.R() * 20;
  }
  texte(x, y, t, c) { this.textes.push({ x, y, t, c, v: 1.8 }); }
  entrees() {
    const pos = ev => { const r = this.c.getBoundingClientRect(); return [(ev.clientX - r.left) * W / r.width, (ev.clientY - r.top) * H / r.height]; };
    // le joystick ne bouge pas : il est fixe en bas à gauche, on peut poser le pouce n'importe où dans la moitié gauche
    const viser = (j, x, y) => { let dx = x - JOY.x, dy = y - JOY.y; const d = Math.hypot(dx, dy); if (d > JOY.r) { dx *= JOY.r / d; dy *= JOY.r / d; } j.dx = dx; j.dy = dy; };
    // PC : la souris vise (la corvette se tourne vers le pointeur), le clic gauche maintenu pousse ; le clavier est plus bas
    this.c.addEventListener('pointerdown', ev => { if (ev.pointerType !== 'mouse') this.pc = false; }, true);
    this.c.addEventListener('pointerdown', ev => { if (ev.pointerType !== 'mouse' || this.quai || this.panne || this.pauseVue) return;
      this.pc = true; const [x, y] = pos(ev), B = BRENTRER(true); this.souris = { x, y }; this.viseSouris = true;
      if (x > B.x && x < B.x + B.w && y > B.y && y < B.y + B.h) { this.auto = true; ev.stopImmediatePropagation(); return; }
      if (ev.button === 0) { this.capturer(ev); this.clic = true; this.auto = false; } ev.stopImmediatePropagation(); });
    this.c.addEventListener('pointermove', ev => { if (ev.pointerType !== 'mouse') return; this.pc = true; const [x, y] = pos(ev); this.souris = { x, y }; this.viseSouris = true; });
    this.c.addEventListener('pointerup', ev => { if (ev.pointerType === 'mouse') this.clic = false; });
    this.c.addEventListener('contextmenu', ev => ev.preventDefault());
    this.touches = new Set();
    const TOUCHES = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'Space'];
    addEventListener('keydown', ev => {
      if (this.ecranTitre) { if (ev.code === 'Enter' || ev.code === 'Space') { this.ecranTitre.querySelector('[data-t]').click(); ev.preventDefault(); } return; }
      if (ev.code === 'Escape' || ev.code === 'KeyP') { if (this.pauseVue) this.fermerPause(); else this.ouvrirPause(); ev.preventDefault(); return; }
      if (this.pauseVue) return;
      this.pc = true;
      if (this.quai && (ev.code === 'Enter' || ev.code === 'NumpadEnter' || ev.code === 'Space') && !ev.repeat && !(ev.target && ev.target.closest && ev.target.closest('button'))) { this.decoller(); ev.preventDefault(); return; }
      if (ev.code === 'KeyR' && !this.quai && !this.panne) { this.auto = true; return; }
      if (TOUCHES.includes(ev.code)) { this.touches.add(ev.code); if (/Left|Right|KeyA|KeyD/.test(ev.code)) this.viseSouris = false; ev.preventDefault(); } });
    addEventListener('keyup', ev => this.touches.delete(ev.code));
    addEventListener('blur', () => { this.touches.clear(); this.clic = false; });
    this.c.addEventListener('pointerdown', ev => { if (this.quai || this.panne || this.pauseVue) return; const [x, y] = pos(ev), B = BRENTRER(this.pc), G = GAZ();
      if (x > B.x - 6 && x < B.x + B.w + 6 && y > B.y - 6 && y < B.y + B.h + 6) { this.auto = true; return; }
      if (modeCommandes === 'bouton' && Math.hypot(x - G.x, y - G.y) < G.r + 14) { this.capturer(ev); this.gaz = ev.pointerId; this.auto = false; return; }
      if (x < W * 0.5 && !this.joy) { this.capturer(ev); this.joy = { id: ev.pointerId, dx: 0, dy: 0 }; viser(this.joy, x, y); this.auto = false; } });
    this.c.addEventListener('pointermove', ev => { const j = this.joy; if (!j || j.id !== ev.pointerId) return; const [x, y] = pos(ev); viser(j, x, y); });
    const fin = ev => { if (this.joy && this.joy.id === ev.pointerId) this.joy = null; if (this.gaz === ev.pointerId) this.gaz = null; };
    this.c.addEventListener('pointerup', fin); this.c.addEventListener('pointercancel', fin);
  }
  capturer(ev) { try { this.c.setPointerCapture(ev.pointerId); } catch (err) { /* pointeur déjà relâché */ } }
  // la station agrandie aux pixels de l'écran (au plus proche, nette) ; seuls les derniers angles servis sont gardés
  // (elle tourne lentement : 2 ou 3 angles à la fois), pour la tourner ensuite en douceur sans faire grouiller ses pixels
  stationHD(FS, k) {
    const r = this.res || 1, c = (this.stHD = this.stHD || []).find(o => o.fs === FS && o.k === k && o.r === r); if (c) return c.img;
    const img = document.createElement('canvas'); img.width = img.height = L_ST * r; const g = img.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(FS[k], 0, 0, L_ST * r, L_ST * r);
    this.stHD.unshift({ fs: FS, k, r, img }); this.stHD.length = Math.min(this.stHD.length, 4); return img;
  }
  // sons (sons.js) et vibrations (réglage de la pause)
  son(n) { if (typeof MineurSons !== 'undefined') MineurSons.jouer(n); }
  vibrer(ms) { if (modeVibre && navigator.vibrate) try { navigator.vibrate(ms); } catch (err) { /* sans vibreur */ } }
  // RENTRER : la ligne droite vers le quai si elle ne frôle pas la planète ; sinon un point de passage qui fait le tour
  // de la planète par le plus court côté, à distance (retour du 02/11 : la corvette raclait la planète)
  cheminRetour(S) {
    const s = this.ship, Rs = RT / 2 + 50, dx = S.qx - s.x, dy = S.qy - s.y, L2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, -(s.x * dx + s.y * dy) / L2)), px = s.x + dx * t, py = s.y + dy * t;
    if (Math.hypot(px, py) >= Rs) return [S.qx, S.qy];
    const r = Math.hypot(s.x, s.y), fs = Math.atan2(s.y, s.x), fq = Math.atan2(S.qy, S.qx), d = Math.atan2(Math.sin(fq - fs), Math.cos(fq - fs));
    const f = fs + Math.sign(d || 1) * Math.min(Math.abs(d), 0.7), rw = Math.max(Rs + 25, Math.min(r, R_ST + QUAI_ST));
    return [Math.cos(f) * rw, Math.sin(f) * rw];
  }
  mondeTourelle(i) { const [mx, my] = this.nef.tourelles[i], s = this.ship, c = Math.cos(s.a), si = Math.sin(s.a); return [s.x + mx * c - my * si, s.y + mx * si + my * c]; }
  /* ---------- un pas de simulation ---------- */
  pas(dt) {
    if (this.pauseVue) return;
    if (this.enVoyage) { mdeAvancer(this.e, dt); this.enVoyage.t += dt; if (this.enVoyage.t >= this.enVoyage.d) this.finVoyage(); return; }
    const s = this.ship, c = this.C, e = this.e;
    const ev = mdeAvancer(e, dt);
    if (this.evenementsAliens) { this.evenementsAliens(ev); this.pasCombat(dt); this.pasEscadrille(dt); }
    if (this.bandeau) this.bandeau.v -= dt;
    if (ev.gain) { this.livre = (this.livre || 0) + ev.gain; if (this.quai) this.majPanneauBientot = true; }
    this.tLivre = (this.tLivre || 0) + dt; if (this.tLivre > 4) { this.tLivre = 0; if (this.livre) { const S = this.station(); this.texte(S.x, S.y - 70, '+' + this.livre + ' CR (DRONES)', '#ffcf4a'); this.livre = 0; if (this.majPanneauBientot && this.quai) { this.majPanneauBientot = false; this.majPanneauSiCalme(); } } }
    this.tSauve += dt; if (this.tSauve > 30) { this.tSauve = 0; this.sauver(); }
    // roches : dérive autour de la planète ; les rapides vont tout droit
    for (const a of this.asts) {
      if (a.rapide) { a.vie -= dt; } else { const r = Math.hypot(a.x, a.y) || 1, w = 0.045 / Math.sqrt(r / 260), tx = -a.y / r * w * r, ty = a.x / r * w * r;
        a.vx += (tx - a.vx) * Math.min(1, dt * 0.6); a.vy += (ty - a.vy) * Math.min(1, dt * 0.6); }
      a.x += a.vx * dt; a.y += a.vy * dt; a.rot += a.vr * dt; a.flash = Math.max(0, a.flash - dt); }
    this.asts = this.asts.filter(a => !a.rapide || a.vie > 0);
    // de nouvelles grosses roches arrivent dans la ceinture
    this.respawn -= dt; if (this.respawn <= 0) { this.respawn = 6; if (this.asts.filter(a => a.r.taille === 3).length < 12 && this.asts.length < 40) this.nouvelleRoche(); }
    const S = this.station();
    if (this.quai) { s.x = S.qx; s.y = S.qy; s.a = S.a; this.suite(dt); return; }
    if (this.panne) { this.panne -= dt; s.vx *= 0.985; s.vy *= 0.985; s.x += s.vx * dt; s.y += s.vy * dt;
      if (this.panne <= 0) { const perdu = this.soute.length - Math.floor(this.soute.length / 2); this.accoster(false, true); this.texte(s.x, s.y - 72, 'REMORQUEE' + (perdu ? ` · -${perdu} MINERAI` : ''), '#ff6a5c'); }
      this.suite(dt); return; }
    const j = this.joy, jx = j ? j.dx / 40 : 0, jy = j ? j.dy / 40 : 0, force = Math.hypot(jx, jy), V = c.vitesse, M = c.maniabilite, TOUR = 2.4 * M; let pousse = 0;
    // PC : touches et souris
    const K = this.touches || new Set(), tg = (K.has('ArrowLeft') || K.has('KeyA') ? -1 : 0) + (K.has('ArrowRight') || K.has('KeyD') ? 1 : 0);
    const gazPC = K.has('ArrowUp') || K.has('KeyW') || K.has('Space') || !!this.clic;
    if (this.auto && (tg || gazPC)) this.auto = false;
    if (this.auto) { const [cx, cy] = this.cheminRetour(S), ex = cx - s.x, ey = cy - s.y, el = Math.hypot(ex, ey) || 1, v = cx === S.qx ? Math.min(120 * V, el * 1.2) : 120 * V;
      s.vx += (ex / el * v + S.vx - s.vx) * Math.min(1, dt * 1.5); s.vy += (ey / el * v + S.vy - s.vy) * Math.min(1, dt * 1.5); pousse = 1;
      if (Math.hypot(s.vx, s.vy) > 8) { const voulu = Math.atan2(s.vy, s.vx) + Math.PI / 2; let dd = voulu - s.a; dd = Math.atan2(Math.sin(dd), Math.cos(dd)); s.a += Math.max(-TOUR * dt, Math.min(TOUR * dt, dd)); } }
    else { if (force > 0.15) { const voulu = Math.atan2(jy, jx) + Math.PI / 2; let d = voulu - s.a; d = Math.atan2(Math.sin(d), Math.cos(d)); s.a += Math.max(-TOUR * dt, Math.min(TOUR * dt, d));
        // propulseurs : petites bouffées blanches sur le nez quand la corvette tourne
        if (Math.abs(d) > 0.15) this.bouffee(d > 0 ? -1 : 1);
        if (modeCommandes === 'glisse' && Math.abs(d) < 0.9) { pousse = force; const acc = 110 * V * (0.85 + 0.15 * M) * force * dt; s.vx += Math.sin(s.a) * acc; s.vy -= Math.cos(s.a) * acc; } }
      if (tg) { s.a += tg * TOUR * dt; this.bouffee(tg); }
      else if (this.pc && this.viseSouris && this.souris && !j) { const wx = this.souris.x - (this.ox || 0), wy = this.souris.y - (this.oy || 0);
        // la souris : la corvette tourne vite vers le pointeur (2,2 × la vitesse de rotation du clavier), en ralentissant
        // à l'approche du bon cap (plus d'à-coups) ; zone morte réduite à 12 px autour d'elle
        if (Math.hypot(wx - s.x, wy - s.y) > 12) { const voulu = Math.atan2(wy - s.y, wx - s.x) + Math.PI / 2; let d = voulu - s.a; d = Math.atan2(Math.sin(d), Math.cos(d));
          const v = Math.min(TOUR * 2.2, Math.abs(d) * 9 + 0.3) * dt; s.a += Math.max(-v, Math.min(v, d)); if (Math.abs(d) > 0.3) this.bouffee(-Math.sign(d)); } }
      if (gazPC || (modeCommandes === 'bouton' && this.gaz !== null)) { pousse = 1; const acc = 110 * V * (0.85 + 0.15 * M) * dt; s.vx += Math.sin(s.a) * acc; s.vy -= Math.cos(s.a) * acc; }
      s.vx *= 1 - dt * 0.12; s.vy *= 1 - dt * 0.12; const v = Math.hypot(s.vx, s.vy); if (v > 150 * V) { s.vx *= 150 * V / v; s.vy *= 150 * V / v; } }
    this.pousse = pousse; s.x += s.vx * dt; s.y += s.vy * dt;
    const de = Math.hypot(s.x, s.y);
    if (de > this.rMax) { s.vx -= s.x / de * 160 * dt; s.vy -= s.y / de * 160 * dt; if ((this.avert || 0) <= 0) { this.texte(s.x, s.y - 44, 'MOTEURS TROP FAIBLES', '#ff6a5c'); this.avert = 2.5; } }
    this.avert = (this.avert || 0) - dt;
    if (de < RT / 2 + 14) { s.x = s.x / de * (RT / 2 + 14); s.y = s.y / de * (RT / 2 + 14); }
    // amarrage : il suffit d'arriver près du quai de la station
    const dq = Math.hypot(s.x - S.qx, s.y - S.qy);
    if (dq > 90) this.sorti = true;
    if (this.sorti && dq < 34) { this.accoster(); this.suite(dt); return; }
    if (dq > 50) { this.carbu -= dt * (MDE_CONSO.glisse + (MDE_CONSO.pousse - MDE_CONSO.glisse) * pousse); if (this.carbu < c.vol * 0.25) this.son('carbu');
      if (this.carbu <= 0) this.tomberEnPanne('PANNE SECHE !'); }
    // dangers : petites roches rapides, plus nombreuses aux étages suivants
    if (dq > 140) { this.prochainDanger -= dt; if (this.prochainDanger <= 0 && !this.alerteMeteo) { this.alerteMeteo = { an: this.R() * TAU, t: 1.3 }; this.prochainDanger = 60 / MDE_DANGERS[mdeEtage(e)] * (0.5 + this.R()); } }
    if (this.alerteMeteo && (this.alerteMeteo.t -= dt) <= 0) { this.danger(this.alerteMeteo.an); this.alerteMeteo = null; }
    for (const a of this.asts) if (a.rapide && this.R() < 0.9) { const k = this.R(); this.parts.push({ x: a.x + (this.R() - 0.5) * 4, y: a.y + (this.R() - 0.5) * 4,
      vx: -a.vx * 0.15 + (this.R() - 0.5) * 20, vy: -a.vy * 0.15 + (this.R() - 0.5) * 20, v: 0.25 + this.R() * 0.3, c: k < 0.3 ? '#fff2a0' : k < 0.6 ? '#f2a94a' : k < 0.85 ? '#d0752c' : '#8c4a24', t: k < 0.5 ? 2 : 1 }); }
    for (const a of this.asts) if (a.rapide && Math.hypot(a.x - s.x, a.y - s.y) < a.ray + 14) {
      a.vie = 0; this.coque--; this.secousse = 0.3; this.eclats(a.x, a.y, 12, 'fer', true); this.son('choc'); this.texte(s.x, s.y - 44, 'CHOC ! COQUE ' + Math.max(0, this.coque), '#ff6a5c');
      this.vibrer(60);
      if (this.coque <= 0) { this.tomberEnPanne('COQUE DETRUITE !'); break; } }
    // drone réparateur : un point de coque toutes les 20 s
    if (e.reparateur && this.coque < c.coque) { this.repare = (this.repare || 0) + dt; if (this.repare > 20) { this.repare = 0; this.coque++; } }
    // tourelles : chacune vise la roche la plus proche (les rapides d'abord), tourne puis tire quand elle est alignée
    this.tirs.forEach((T, i) => { const [tx, ty] = this.mondeTourelle(i); let cible = null, bd = MDE_TIR.portee;
      for (const a of this.asts) { const d = Math.hypot(a.x - tx, a.y - ty) - a.ray - (a.rapide ? 120 : 0); if (d < bd) { bd = d; cible = a; } }
      if (this.bat) for (const a of this.bat.aliens) if (a.pv > 0 && !a.fuite) { const d = Math.hypot(a.x - tx, a.y - ty) - 150; if (d < bd) { bd = d; cible = a; } }
      T.t -= dt; if (!cible) return;
      const voulu = Math.atan2(cible.y - ty, cible.x - tx) + Math.PI / 2; let d = voulu - T.a; d = Math.atan2(Math.sin(d), Math.cos(d)); T.a += Math.max(-5 * dt, Math.min(5 * dt, d));
      if (Math.abs(d) < 0.12 && T.t <= 0) { T.t = MDE_TIR.cadence; const fx = Math.sin(T.a), fy = -Math.cos(T.a), lg = 10 + VISIBLE[e.ameliorations.canon] * 2;
        this.balles.push({ x: tx + fx * lg, y: ty + fy * lg, vx: fx * 380, vy: fy * 380, v: 0.65, a: T.a }); T.recul = 0.08; this.son('tir'); } });
    this.suite(dt);
  }
  // propulseurs : petites bouffées blanches sur le nez quand la corvette tourne (cot : côté de la bouffée)
  bouffee(cot) { const s = this.ship; if (!this.e.ameliorations.propulseurs || this.R() > 0.5) return; const nx = s.x + Math.sin(s.a) * 22, ny = s.y - Math.cos(s.a) * 22;
    this.parts.push({ x: nx, y: ny, vx: Math.cos(s.a) * cot * 50 + s.vx, vy: Math.sin(s.a) * cot * 50 + s.vy, v: 0.25, c: '#c9cde0', t: 2 }); }
  tomberEnPanne(t) { this.carbu = Math.max(0, this.carbu); this.panne = 2.4; this.joy = null; this.auto = false; this.texte(this.ship.x, this.ship.y - 44, t, '#ff6a5c'); }
  suite(dt) {
    const s = this.ship, deg = this.C.degats;
    for (const b of this.balles) { b.x += b.vx * dt; b.y += b.vy * dt; b.v -= dt; const dg = b.deg || deg;
      if (this.bat && this.toucheAlien(b, dg)) { b.v = 0; continue; }
      if (b.sorte === 'flotte') continue;   // la flotte ne vise que les aliens
      for (const a of this.asts) if (Math.hypot(a.x - b.x, a.y - b.y) < a.ray) { b.v = 0; a.r.pv -= dg; a.flash = 0.08; if (a.r.pv > 0) this.son('touche'); this.eclats(b.x, b.y, 3, a.r.minerai); if (a.r.pv <= 0) this.casser(a); break; } }
    this.balles = this.balles.filter(b => b.v > 0);
    const aimant = 90 * this.C.aimant;
    for (const d of this.drops) { d.v -= dt; const dx = s.x - d.x, dy = s.y - d.y, dist = Math.hypot(dx, dy);
      if (!this.quai && !this.panne && dist < aimant) { const plein = this.soute.length >= this.C.soute;
        if (!plein) { d.vx += dx / dist * 600 * dt; d.vy += dy / dist * 600 * dt; } else if (dist < 40 && !(this.pleinT > 0)) { this.pleinT = 2; this.son('plein'); this.texte(s.x, s.y - 44, 'SOUTE PLEINE', '#ff6a5c'); }
        if (!plein && dist < 18) { d.v = 0; this.soute.push(d.type); const rare = MDE_MINERAIS[d.type].prix >= 20; this.son(rare ? 'rare' : 'ramasse'); this.texte(d.x, d.y - 8, rare ? MDE_MINERAIS[d.type].nom + ' !' : '+1', rare ? '#ffcf4a' : '#d8c2aa'); } }
      d.vx *= 1 - dt * 1.2; d.vy *= 1 - dt * 1.2; d.x += d.vx * dt; d.y += d.vy * dt; }
    this.drops = this.drops.filter(d => d.v > 0); this.pleinT = (this.pleinT || 0) - dt;
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.v -= dt; } this.parts = this.parts.filter(p => p.v > 0);
    for (const t of this.textes) { t.y -= 14 * dt; t.v -= dt; } this.textes = this.textes.filter(t => t.v > 0);
    for (const T of this.tirs) T.recul = Math.max(0, (T.recul || 0) - dt);
    this.secousse = Math.max(0, this.secousse - dt);
    const S = this.station(), cx = this.quai ? S.x + W / 2 - Math.min(180, W * 0.28) : s.x + s.vx * 0.5, cy = this.quai ? S.y : s.y + s.vy * 0.5;
    this.cam.x += (cx - this.cam.x) * Math.min(1, dt * (this.quai ? 2 : 3)); this.cam.y += (cy - this.cam.y) * Math.min(1, dt * (this.quai ? 2 : 3));
  }
  // une roche cassée : ses éclats (règles), ou son minerai si c'était une petite
  casser(a) {
    this.asts.splice(this.asts.indexOf(a), 1); this.son(a.r.taille >= 2 ? 'grosse' : 'roche');
    if (a.rapide) { this.eclats(a.x, a.y, 8, 'fer', true); return; }
    const R = this.R, l = mdeEclats(a.r, R);
    l.forEach((r, i) => { const an = i / l.length * TAU + R() * 0.6, v = 25 + R() * 25;
      this.nouvelleRoche(r, a.x + Math.cos(an) * a.ray * 0.5, a.y + Math.sin(an) * a.ray * 0.5, a.vx + Math.cos(an) * v, a.vy + Math.sin(an) * v); });
    const n = mdeButin(this.e, a.r, R);
    for (let i = 0; i < n; i++) { const an = R() * TAU; this.drops.push({ x: a.x, y: a.y, vx: a.vx + Math.cos(an) * 40, vy: a.vy + Math.sin(an) * 40, v: 14, type: a.r.minerai }); }
    this.eclats(a.x, a.y, l.length ? 14 : 10, a.r.minerai, true);
  }
  eclats(x, y, n, m, gros) { const V = VEINES[m] || VEINES.fer, hex = c => '#' + c.map(v => v.toString(16).padStart(2, '0')).join(''), C = [hex(V.c[0]), hex(V.c[1]), '#71789c'];
    for (let i = 0; i < n; i++) { const an = this.R() * TAU, v = 20 + this.R() * (gros ? 80 : 40); this.parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, v: 0.3 + this.R() * (gros ? 0.7 : 0.2), c: C[i % 3], t: gros && i % 4 === 0 ? 3 : gros ? 2 : 1 }); } }
  /* ---------- les drones au travail (dessin seulement : la production vient des règles, mdeProduction) ---------- */
  // mineurs : chacun à son poste dans la ceinture, derrière la station sur son orbite, laser sur un petit caillou ;
  // cargos : navettes entre la station et les mineurs ; réparateur : suit la corvette
  dessinDrones(x, ox, oy, t, S) {
    const e = this.e, p = e.planete, d = e.drones[p], marche = mdeABase(e, p) && !e.hs[p];
    const tire = (k, px, py, a) => { const sx = Math.round(px + ox), sy = Math.round(py + oy); if (sx < -30 || sy < -30 || sx > W + 30 || sy > H + 30) return false;
      if (typeof pretSpr === 'function' && pretSpr('d_' + k)) { dessineSpr(x, 'd_' + k, sx, sy, a); return true; }
      const F = drone(k), n = nAng(a), r = a - n / N_ANG * TAU; x.save(); x.translate(sx, sy); x.rotate(Math.atan2(Math.sin(r), Math.cos(r))); x.drawImage(F[n], -20, -20); x.restore(); return true; };
    const postes = [];
    if (marche) for (let i = 0; i < d.mineur; i++) {
      const an = S.phi - 0.45 - i * 0.3 + Math.sin(t * 0.2 + i) * 0.03, r = 420 + (i % 2) * 46, px = Math.cos(an) * r, py = Math.sin(an) * r;
      const cx = px + Math.cos(an) * 16, cy = py + Math.sin(an) * 16; postes.push([px, py]);
      const sx = Math.round(cx + ox), sy = Math.round(cy + oy);
      if (sx > -20 && sy > -20 && sx < W + 20 && sy < H + 20) { const roc = ROCS[0][Object.keys(MDE_PLANETES[p].ceinture)[0]][i % 3]; x.drawImage(roc.fr[nRoc(t * 0.3 + i)], sx - (roc.L >> 1), sy - (roc.L >> 1));
        if ((t * 3 + i) % 1 < 0.6) { x.strokeStyle = '#ff9d4a'; x.beginPath(); x.moveTo(Math.round(px + ox), Math.round(py + oy)); x.lineTo(sx, sy); x.stroke();
          if (this.R() < 0.2) this.parts.push({ x: cx, y: cy, vx: (this.R() - 0.5) * 40, vy: (this.R() - 0.5) * 40, v: 0.3, c: '#ffe08a', t: 1 }); } }
      tire('mineur', px, py, an + Math.PI / 2);   // nez vers le caillou
    }
    if (marche && postes.length) for (let j = 0; j < d.cargo; j++) {
      const P = postes[(j * 2) % postes.length], ph = (t / 16 + j * 0.37) % 1;
      let f, va; if (ph < 0.42) { f = ph / 0.42; va = 1; } else if (ph < 0.5) { f = 1; va = 0; } else if (ph < 0.92) { f = 1 - (ph - 0.5) / 0.42; va = -1; } else { f = 0; va = 0; }
      const g = f * f * (3 - 2 * f), px = S.x + (P[0] - S.x) * g, py = S.y + (P[1] - S.y) * g, dir = Math.atan2(P[1] - S.y, P[0] - S.x) + (va < 0 ? Math.PI : 0);
      tire('cargo', px + Math.cos(dir + Math.PI / 2) * 10 * Math.sin(f * Math.PI), py + Math.sin(dir + Math.PI / 2) * 10 * Math.sin(f * Math.PI), dir + Math.PI / 2);
    }
    if (e.reparateur) { const s = this.ship, sur = !this.quai && !this.panne, px = sur ? s.x - Math.sin(s.a) * 46 + Math.cos(t) * 8 : S.x + 50, py = sur ? s.y + Math.cos(s.a) * 46 + Math.sin(t) * 8 : S.y + 10;
      this.rep = this.rep || { x: px, y: py }; this.rep.x += (px - this.rep.x) * 0.08; this.rep.y += (py - this.rep.y) * 0.08;
      tire('reparateur', this.rep.x, this.rep.y, sur ? s.a : 0);
      if (sur && this.coque < this.C.coque && (t * 4 | 0) % 2) { x.fillStyle = '#7be07b'; x.fillRect(Math.round(this.rep.x + ox) - 1, Math.round(this.rep.y + oy) - 14, 3, 3); } }
  }
  /* ---------- dessin ---------- */
  // le voyage : la corvette file entre les étoiles, de la planète de départ à celle d'arrivée
  dessinVoyage(t) {
    const x = this.x, V = this.enVoyage, f = V.t / V.d, R = mulberry(5);
    x.fillStyle = '#05060d'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const y = R() * H, v = 0.3 + R(), xx = ((R() * W - t * 420 * v) % W + W) % W, l = 4 + v * 18; x.fillStyle = v > 1 ? '#c9cde0' : '#4c5274'; x.fillRect(Math.round(xx), Math.round(y), Math.round(l), 1); }
    const L1 = Math.round(RL * (1 - f) * 1.4), L2 = Math.round(RL * f * 1.6);
    if (L1 > 2) x.drawImage(LOINTAINES[V.de][0], Math.round(-L1 / 2 + 40 - f * 120), Math.round(H / 2 - L1 / 2), L1, L1);
    if (L2 > 2) x.drawImage(LOINTAINES[V.vers][0], Math.round(W - 40 - L2 / 2 + (1 - f) * 120), Math.round(H / 2 - L2 / 2), L2, L2);
    const F = this.nef.frames[nAng(Math.PI / 2)], EC = this.nef.ech || 1; x.drawImage(F.img, Math.round(W / 2 - F.img.width * EC / 2), Math.round(H / 2 - F.img.height * EC / 2), F.img.width * EC, F.img.height * EC);
    for (let q = 0; q < 16; q++) { const fl = q / 16; x.fillStyle = fl < 0.3 ? '#fff2a0' : fl < 0.65 ? '#f2a94a' : '#d0752c'; const w = Math.max(1, Math.round(4 * (1 - fl)));
      x.fillRect(Math.round(W / 2 - 34 - q * 2 - (t * 30 | 0) % 2), Math.round(H / 2 - w / 2), w, w); }
    x.font = '13px Silkscreen'; x.textAlign = 'center'; x.fillStyle = '#ffcf4a'; x.fillText('EN ROUTE VERS ' + (V.vers === 'lune' ? 'LA LUNE' : V.vers === 'mars' ? 'MARS' : 'LA TERRE'), W / 2, 50);
    x.fillStyle = '#1a1f40'; x.fillRect(W / 2 - 80, 62, 160, 5); x.fillStyle = '#7be07b'; x.fillRect(W / 2 - 80, 62, Math.round(160 * f), 5);
  }
  dessin(t) {
    this.x.setTransform(this.res || 1, 0, 0, this.res || 1, 0, 0); this.x.imageSmoothingEnabled = false;
    if (this.enVoyage) return this.dessinVoyage(t);
    const x = this.x, s = this.ship, e = this.e, c = this.C, sk = this.secousse > 0 ? (this.R() - 0.5) * 6 : 0;
    const rp = this.res || 1, ox = Math.round((W / 2 - this.cam.x + sk) * rp) / rp, oy = Math.round((H / 2 - this.cam.y + sk) * rp) / rp; this.ox = ox; this.oy = oy;   // au pixel de l'écran
    const cur = !this.quai && this.pc && !this.pauseVue ? 'none' : 'default'; if (this.c.style.cursor !== cur) this.c.style.cursor = cur;   // en vol sur PC : le viseur dessiné remplace la flèche
    x.fillStyle = '#05060d'; x.fillRect(0, 0, W, H);
    const px = ((-this.cam.x * 0.2) % 512 + 512) % 512, py = ((-this.cam.y * 0.2) % 512 + 512) % 512;
    for (let i = -1; i < 2; i++) for (let k = -1; k < 1; k++) x.drawImage(ciel, Math.round(px + i * 512), Math.round(py + k * 512));
    x.globalAlpha = 0.6; x.drawImage(neb, Math.round(ox * 0.3 + 200), Math.round(oy * 0.3 - 330), 512, 512); x.drawImage(neb, Math.round(ox * 0.3 - 700), Math.round(oy * 0.3 + 60), 512, 512); x.globalAlpha = 1;
    x.strokeStyle = '#1c2246'; x.setLineDash([3, 6]); x.beginPath(); x.arc(ox, oy, this.rMax, 0, 7); x.stroke(); x.setLineDash([]);
    for (const [pl, a0, dist, ech] of CIEL[e.planete]) { const la = a0 + t * 0.008, lx = ox * 0.7 + W * 0.15 + Math.cos(la) * dist * 0.7, ly = oy * 0.7 + H * 0.15 + Math.sin(la) * dist * 0.7, L = Math.round(RL * ech);
      if (lx > -L && ly > -L && lx < W + L && ly < H + L) { x.drawImage(LOINTAINES[pl][0], Math.round(lx - L / 2), Math.round(ly - L / 2), L, L);
        x.font = '9px Silkscreen'; x.fillStyle = '#8c93c4'; x.textAlign = 'center'; x.fillText(MDE_PLANETES[pl].nom + (pl === 'lune' && !e.recherche.transfert ? ' · MOTEUR DE TRANSFERT' : ''), lx, ly + L / 2 + 12); } }
    x.drawImage(planeteC, ox - RT / 2, oy - RT / 2);
    // orbite et station : le quai (barre jaune et noire) toujours tourné vers l'extérieur
    const S = this.station(), FS = construireStation(this.stationIci()), kS = nAng(S.a), rS = S.a - kS / N_ANG * TAU, stx = Math.round((S.x + ox) * rp) / rp, sty = Math.round((S.y + oy) * rp) / rp;
    x.strokeStyle = '#7be07b22'; x.setLineDash([2, 5]); x.beginPath(); x.arc(ox, oy, R_ST, 0, 7); x.stroke(); x.setLineDash([]);
    if (stx > -L_ST && sty > -L_ST && stx < W + L_ST && sty < H + L_ST) { x.save(); x.translate(stx, sty); x.rotate(Math.atan2(Math.sin(rS), Math.cos(rS))); x.imageSmoothingEnabled = true; x.drawImage(this.stationHD(FS, kS), -L_ST / 2, -L_ST / 2, L_ST, L_ST); x.imageSmoothingEnabled = false; x.restore();
      if (!this.quai && this.sorti) { x.strokeStyle = (t * 2 % 1) < 0.5 ? '#7be07b88' : '#7be07b33'; x.beginPath(); x.arc(Math.round(S.qx + ox), Math.round(S.qy + oy), 30, 0, 7); x.stroke(); } }
    this.dessinDrones(x, ox, oy, t, S);
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
    if (this.dessinCombat) this.dessinCombat(x, ox, oy, t);
    for (const b of this.balles) { if (b.sorte) { const c = b.sorte === 'chasseur' ? '#ff9d4a' : '#9fd0ff'; x.fillStyle = c; x.fillRect(Math.round(b.x + ox) - 1, Math.round(b.y + oy) - 1, 2, 2); continue; } x.save(); x.translate(Math.round(b.x + ox), Math.round(b.y + oy)); x.rotate(b.a); x.fillStyle = '#d0752c'; x.fillRect(-1.5, -5, 3, 10); x.fillStyle = '#fff2a0'; x.fillRect(-0.5, -4, 1, 7); x.restore(); }
    // corvette : rendu de l'angle le plus proche, tourné du petit reste ; flammes ; tourelles
    const k = nAng(s.a), F = this.nef.frames[k], sx0 = Math.round((s.x + ox) * rp) / rp, sy0 = Math.round((s.y + oy) * rp) / rp, bx = -Math.sin(s.a), by = Math.cos(s.a), EC = this.nef.ech || 1;
    if (this.pousse > 0.1 && !this.panne && !this.quai) for (const [ex, ey, er] of F.engines) { const nm = e.ameliorations.moteur, l = er * (1.2 + this.pousse * 1.6) * (1 + 0.15 * nm) + ((t * 30 | 0) % 2);
      for (let q = 0; q < l; q++) { const f = q / l; x.fillStyle = f < 0.3 ? (nm >= 3 ? '#bfe8ff' : '#fff2a0') : f < 0.65 ? '#f2a94a' : '#d0752c'; const w = Math.max(1, Math.round(er * (1 - f * 0.6)));
        x.fillRect(Math.round(sx0 + (ex - F.img.width / 2) * EC + bx * q - w / 2), Math.round(sy0 + (ey - F.img.height / 2) * EC + by * q - w / 2), w, w); } }
    const reste = s.a - k / N_ANG * TAU; x.save(); x.translate(sx0, sy0); x.rotate(Math.atan2(Math.sin(reste), Math.cos(reste)));
    x.imageSmoothingEnabled = !!this.nef.sprite; if (this.secousse > 0 && (t * 20 | 0) % 2) x.globalAlpha = 0.5; x.drawImage(F.img, -F.img.width * EC / 2, -F.img.height * EC / 2, F.img.width * EC, F.img.height * EC); x.restore();   // taille du dessin : 128 px pour le chantier, autre pour un habillage
    // tourelles accrochées à la coque : placées depuis la position de la corvette À L'ÉCRAN (sx0, sy0), sans arrondi à part
    // (sinon elles tremblent d'un pixel par rapport à la coque)
    const ca = Math.cos(s.a), sa = Math.sin(s.a);
    this.tirs.forEach((T, i) => { const [mx, my] = this.nef.tourelles[i], kt = nAng(T.a), rt = T.a - kt / N_ANG * TAU; x.save(); x.translate(Math.round((sx0 + mx * ca - my * sa) * rp) / rp, Math.round((sy0 + mx * sa + my * ca) * rp) / rp); x.rotate(Math.atan2(Math.sin(rt), Math.cos(rt))); const TE = this.tourEch || 1, Ti = this.tour[kt]; x.imageSmoothingEnabled = !!this.nef.sprite; x.drawImage(Ti, -Ti.width * TE / 2, -Ti.height * TE / 2, Ti.width * TE, Ti.height * TE); x.restore(); });
    for (const tx of this.textes) { x.font = '11px Silkscreen'; x.textAlign = 'center'; x.fillStyle = '#000'; x.fillText(tx.t, tx.x + ox + 1, tx.y + oy + 1); x.fillStyle = tx.c; x.fillText(tx.t, tx.x + ox, tx.y + oy); }
    // flèche vers la station quand elle sort de l'écran (rouge si le carburant devient juste)
    const qsx = S.qx + ox, qsy = S.qy + oy;
    if (!this.quai && (qsx < 10 || qsy < 40 || qsx > W - 10 || qsy > H - 10)) { const an = Math.atan2(qsy - H / 2, qsx - W / 2), kk = Math.min((W / 2 - 26) / Math.abs(Math.cos(an)), (H / 2 - 50) / Math.abs(Math.sin(an)));
      const fx = W / 2 + Math.cos(an) * kk, fy = H / 2 + Math.sin(an) * kk + 10, d = Math.hypot(s.x - S.qx, s.y - S.qy), juste = d / (120 * c.vitesse) > this.carbu * 0.7, col = juste ? '#ff6a5c' : '#7be07b';
      x.save(); x.translate(fx, fy); x.rotate(an); x.fillStyle = col; x.beginPath(); x.moveTo(10, 0); x.lineTo(-6, -7); x.lineTo(-6, 7); x.fill(); x.restore();
      x.font = '9px Silkscreen'; x.textAlign = 'center'; x.fillStyle = col; x.fillText('STATION ' + Math.round(d / 10) + ' KM', fx - Math.cos(an) * 24, fy - Math.sin(an) * 20 + 3); }
    // alerte météorite : chevrons rouges qui clignotent au bord de l'écran, du côté d'où elle arrive
    if (this.alerteMeteo && (t * 6 | 0) % 2) { const an = this.alerteMeteo.an, kk = Math.min((W / 2 - 20) / Math.abs(Math.cos(an)), (H / 2 - 44) / Math.abs(Math.sin(an)));
      const fx = W / 2 + Math.cos(an) * kk, fy = H / 2 + 8 + Math.sin(an) * kk; x.save(); x.translate(fx, fy); x.rotate(an + Math.PI); x.fillStyle = '#ff6a5c';
      for (const o of [0, 9]) { x.beginPath(); x.moveTo(o + 8, 0); x.lineTo(o - 4, -8); x.lineTo(o - 4, 8); x.fill(); } x.restore();
      x.font = '9px Silkscreen'; x.textAlign = 'center'; x.fillStyle = '#ff6a5c'; x.fillText('METEORITE', fx - Math.cos(an) * 34, fy - Math.sin(an) * 22 + 3); }
    if (this.ecranTitre) return;   // l'écran titre : seulement la scène derrière
    // barre du haut : CR, classe, soute, coque, carburant (le bouton de pause est à droite, en HTML)
    x.fillStyle = '#05060dcc'; x.fillRect(0, 0, W, 30);
    x.font = '13px Silkscreen'; x.textAlign = 'left'; x.fillStyle = '#ffcf4a'; x.fillText(e.cr + ' CR', 10, 20);
    x.font = '9px Silkscreen'; x.fillStyle = '#8c93c4'; x.fillText(c.nom, 92, 19);
    // soute et coque : cases plus étroites quand elles sont nombreuses (porte-vaisseaux amélioré : 22 cases, 26 plaques)
    const sm = c.soute, pas = Math.min(13, Math.floor((W - 440) / sm)), s0 = Math.max(Math.round(W / 2 - sm * pas / 2 - 40), x.measureText(c.nom).width + 104 | 0);
    for (let i = 0; i < sm; i++) { const cx = s0 + i * pas; x.fillStyle = '#1a1f40'; x.fillRect(cx, 8, pas - 2, 12); x.strokeStyle = '#2f3770'; x.strokeRect(cx + 0.5, 8.5, pas - 3, 11);
      if (this.soute[i]) x.drawImage(PEP[this.soute[i]], cx + 1, 10, pas - 4, 8); }
    const c0 = s0 + sm * pas + 8, cp = Math.min(6, Math.max(2, Math.floor(56 / c.coque))); for (let i = 0; i < c.coque; i++) { x.fillStyle = i < this.coque ? '#9fd0ff' : '#2a3060'; x.fillRect(c0 + i * cp, 10, Math.max(1, cp - 2), 10); }
    const f = this.carbu / c.vol, bw = 90, bxx = W - 48 - bw; x.textAlign = 'right'; x.fillStyle = '#8c93c4'; x.fillText('CARBU', bxx - 6, 18); x.fillStyle = '#1a1f40'; x.fillRect(bxx, 11, bw, 8);
    x.fillStyle = f < 0.25 ? (t * 4 % 1 < 0.5 ? '#ff6a5c' : '#7a2a26') : f < 0.5 ? '#ff9d4a' : '#7be07b'; x.fillRect(bxx, 11, Math.round(bw * f), 8);
    if (this.dessinAlertes) this.dessinAlertes(x, t);
    // commandes : joystick fixe, bouton POUSSER (mode « bouton »), RENTRER
    if (!this.quai && !this.panne && this.pc && this.viseSouris && this.souris) { const mx = Math.round(this.souris.x), my = Math.round(this.souris.y); x.fillStyle = this.clic ? '#ffcf4a' : '#9fd0ff';
      for (const [a, b, w, h] of [[-8, 0, 5, 1], [4, 0, 5, 1], [0, -8, 1, 5], [0, 4, 1, 5]]) x.fillRect(mx + a, my + b, w, h); }
    if (!this.quai && !this.panne && !this.pc) { const j = this.joy;
      x.globalAlpha = j ? 0.55 : 0.3; x.strokeStyle = '#9fd0ff'; x.lineWidth = 2; x.beginPath(); x.arc(JOY.x, JOY.y, JOY.r, 0, 7); x.stroke();
      x.fillStyle = '#9fd0ff'; x.beginPath(); x.arc(JOY.x + (j ? j.dx : 0), JOY.y + (j ? j.dy : 0), 15, 0, 7); x.fill(); x.lineWidth = 1; x.globalAlpha = 1;
      if (modeCommandes === 'bouton') { const G = GAZ(), on = this.gaz !== null;
        x.globalAlpha = on ? 0.9 : 0.55; x.fillStyle = on ? '#7a3a14' : '#3a1e10'; x.strokeStyle = on ? '#ffcf4a' : '#d0752c'; x.lineWidth = 2;
        x.beginPath(); x.arc(G.x, G.y, G.r, 0, 7); x.fill(); x.stroke(); x.lineWidth = 1; x.globalAlpha = 1;
        x.font = '10px Silkscreen'; x.textAlign = 'center'; x.fillStyle = on ? '#ffcf4a' : '#f2a94a'; x.fillText('POUSSER', G.x, G.y + 4); }
    }
    if (!this.quai && !this.panne) {
      const B = BRENTRER(this.pc); x.fillStyle = this.auto ? '#2f7a3a' : '#1d2560cc'; x.strokeStyle = this.auto ? '#6fdc7f' : '#5a6be0'; x.fillRect(B.x, B.y, B.w, B.h); x.strokeRect(B.x + 0.5, B.y + 0.5, B.w - 1, B.h - 1);
      x.font = '11px Silkscreen'; x.textAlign = 'center'; x.fillStyle = '#fff'; x.fillText(this.auto ? 'RETOUR...' : this.pc ? 'RENTRER (R)' : 'RENTRER', B.x + B.w / 2, B.y + B.h / 2 + 4); }
  }
}

/* ---------- lancement ---------- */
let partie = null, lance = false;
function demarrer() {
  if (lance) return; lance = true;
  preparerRoches(); partie = new Partie(document.getElementById('jeu'));
  window.Mineur = { get partie() { return partie; }, get etat() { return partie.e; } };
  dessinerLointaines(); let av = performance.now();
  function boucle(n) { const dt = Math.min(0.05, (n - av) / 1000); av = n; majPlanetes(dt, partie.e.planete); if ((n / 500 | 0) !== boucle.l) { boucle.l = n / 500 | 0; dessinerLointaines(); }
    partie.pas(dt); partie.dessin(n / 1000); requestAnimationFrame(boucle); }
  requestAnimationFrame(boucle);
}
// au chargement de la page (tous les scripts lus, combat.js compris), polices et sprites prêts
const lancer = () => Promise.all([document.fonts ? document.fonts.ready : 0, typeof spritesPrets !== 'undefined' ? spritesPrets : 0]).then(demarrer);
if (document.readyState === 'complete') lancer(); else addEventListener('load', lancer);
setTimeout(demarrer, 4000);

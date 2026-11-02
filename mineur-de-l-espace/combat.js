/* Mineur de l'espace : session 5 (étage 4). Étend la classe Partie de jeu.js :
   - les sprites des packs (sprites.js) : corvettes Zoser, porte-vaisseaux et chasseurs Cute SCKR, drones et flottes
     Star Fleet, aliens Zoser bleu canard ;
   - les vagues aliens jouées EN DIRECT quand on est sur la planète visée (sinon les règles calculent le combat) :
     alerte, aliens qui attaquent la station, la corvette et la flotte, flotte qui décolle (plus tôt avec les satellites) ;
   - le porte-vaisseaux : escadrille de chasseurs (décollent, minent, se battent, reviennent se recharger) et défense
     rapprochée (abat météorites et aliens trop proches) ;
   - la bataille finale (vaisseau-mère et grande flotte contre toutes les flottes du joueur), l'écran de victoire et le
     mode libre. */

/* ---------- sprites : chargés une fois, 64 angles tournés à la demande, sans lissage, tracés à leur échelle ---------- */
const SPR = {};
const spritesPrets = typeof SPRITES === 'undefined' ? Promise.resolve() : Promise.all(Object.entries(SPRITES).map(([k, d]) => new Promise(ok => {
  const im = new Image(); im.onload = im.onerror = () => ok(); SPR[k] = Object.assign({ im }, d); im.src = d.src; })));
const pretSpr = k => !!(SPR[k] && SPR[k].im.complete && SPR[k].im.naturalWidth > 0);
// angles d'un sprite, tracés À LA RÉSOLUTION DE L'ÉCRAN (RES_SPR pixels par pixel de jeu) : chaque angle est mis à
// l'échelle une fois pour toutes, puis copié pixel pour pixel ; à une échelle non entière (× 1,5…) il est lissé à la
// fabrication. Avant, l'image était agrandie à chaque dessin d'un facteur non entier : ses pixels changeaient de largeur
// quand le vaisseau bougeait d'un pixel, il « tremblait » (retour du 01/11). Tuyères tournées avec lui (pixels de la toile).
let RES_SPR = 1;
function tournesSpr(k) {
  const S = SPR[k], cle = 'fr' + RES_SPR; if (S[cle]) return S[cle];
  const f = S.ech * RES_SPR, L = 2 * Math.ceil(Math.hypot(S.w, S.h) * f / 2 + 2), lisse = Math.abs(f - Math.round(f)) > 0.01;
  return S[cle] = paresseux(i => { const a = i / N_ANG * TAU, c = document.createElement('canvas'); c.width = c.height = L; const x = c.getContext('2d'); x.imageSmoothingEnabled = lisse;
    x.translate(L / 2, L / 2); x.rotate(a); x.scale(f, f); x.drawImage(S.im, -S.w / 2, -S.h / 2);
    const co = Math.cos(a), si = Math.sin(a);
    return { img: c, engines: S.moteurs.map(([ex, ey, er]) => { const dx = (ex - S.w / 2) * f, dy = (ey - S.h / 2) * f; return [L / 2 + dx * co - dy * si, L / 2 + dx * si + dy * co, er]; }) }; });
}
const auPixel = v => Math.round(v * RES_SPR) / RES_SPR;   // arrondi au pixel de l'écran (pas au pixel de jeu)
// un sprite tourné (a = 0 : nez en haut) centré en (sx, sy) à l'écran
function dessineSpr(x, k, sx, sy, a, ech, alpha) {
  const F = tournesSpr(k), n = nAng(a), r = a - n / N_ANG * TAU, f = F[n], L = f.img.width / RES_SPR;
  x.save(); x.translate(auPixel(sx), auPixel(sy)); x.rotate(Math.atan2(Math.sin(r), Math.cos(r))); if (alpha !== undefined) x.globalAlpha = alpha;
  x.imageSmoothingEnabled = true;   // le petit reste de rotation, lissé : les pixels ne grouillent pas quand le vaisseau tourne
  x.drawImage(f.img, -L / 2, -L / 2, L, L); x.restore();
}
const versAngle = (dx, dy) => Math.atan2(dy, dx) + Math.PI / 2;   // angle du nez pour regarder vers (dx, dy)
const tournerVers = (a, voulu, v) => { let d = voulu - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + Math.max(-v, Math.min(v, d)); };

/* ---------- les aliens et les unités de la flotte en direct ---------- */
// comportement des aliens : vitesse, distance de tir, cadence ; les dégâts suivent les règles (att = dégâts par seconde)
const AL_VOL = { rodeur: { v: 85, d: 110, cd: 1.5, ray: 12 }, chasseur: { v: 62, d: 140, cd: 1.2, ray: 16 }, croiseur: { v: 38, d: 170, cd: 0.9, ray: 26 }, mere: { v: 20, d: 210, cd: 0.45, ray: 60 } };
const UN_VOL = { garde: { v: 90, d: 110 }, escorte: { v: 80, d: 130 }, reparateur: { v: 70, d: 60 }, canonniere: { v: 45, d: 170 } };
const RAY_ST = 40;
const MERE_DIRECT = 3;   // en direct, le vaisseau-mère tient 3 fois plus (sinon la grande bataille dure 15 s)   // la station : cible des aliens (rayon de touche)

Object.assign(Partie.prototype, {
  // le dessin de la corvette : sprite du pack si chargé (porte-vaisseaux compris), sinon le moteur de Nebula
  nefSprite(cl, nbT) {
    if (!pretSpr(cl)) return null;
    // tourelles sur les flancs, par paires ; une seule (Éclaireur au départ) : au centre ; nombre impair : la dernière au centre
    const S = SPR[cl], e = S.ech, T = S.tourelles, n = Math.max(1, nbT), np = n - (n % 2);
    // coque trop étroite pour deux tourelles côte à côte (Éclaireur) : l'une derrière l'autre, sur l'axe
    const l = n === 1 ? [T.centre] : T.paires.length >= np ? T.paires.slice(0, np).concat(n % 2 ? [T.centre] : []) : T.axe.slice(0, n);
    return { frames: tournesSpr(cl), ech: 1 / RES_SPR, sprite: cl, tourelles: l.map(([a, b]) => [a * e, b * e]) };
  },
  tourSprite() { return pretSpr('tourelle') ? { fr: paresseux(i => tournesSpr('tourelle')[i].img), ech: 1 / RES_SPR } : null; },
  // la résolution de l'écran change (rotation, fenêtre) : on refait les dessins des sprites, sans toucher à la corvette
  majResolution(res) {
    if (res === RES_SPR) return; RES_SPR = res;
    if (this.nef && this.nef.sprite) { this.nef = this.nefSprite(this.nef.sprite, this.nef.tourelles.length) || this.nef; const ts = this.tourSprite(); if (ts) { this.tour = ts.fr; this.tourEch = ts.ech; } }
  },
  // l'escadrille du porte-vaisseaux : chasseurs à bord, pleins d'énergie
  armerEscadrille() {
    const E = this.C.escadrille; this.escadrille = [];
    if (E) for (let i = 0; i < E.nb; i++) this.escadrille.push({ etat: 'bord', energie: E.energie, pv: E.pv, cargo: [], x: 0, y: 0, vx: 0, vy: 0, a: 0, t: i * 0.4, cible: null });
    this.defT = 0;
  },

  /* ----- vagues : alerte, puis combat en direct (ou calculé par les règles si l'on est ailleurs) ----- */
  evenementsAliens(ev) {
    const e = this.e;
    if (ev.alerte) { const P = MDE_PLANETES[ev.alerte.planete].nom; this.annonce('ALERTE ! ATTAQUE ALIEN SUR ' + P, '#ff6a5c'); this.son('alerte'); this.vibrer(200); }
    if (ev.attaque && !this.bat) {
      if (ev.attaque.planete === e.planete && !this.enVoyage) this.lancerBataille(false);
      else { const r = mdeResoudreAttaque(e, false), P = MDE_PLANETES[r.planete].nom;
        this.son(r.victoire ? 'flotte' : 'defaite'); this.annonce(r.victoire ? 'LA FLOTTE DE ' + P + ' A REPOUSSE LA VAGUE ' + r.vague : 'BASE ' + P + ' HORS SERVICE', r.victoire ? '#7be07b' : '#ff6a5c'); this.sauver();
        if (this.quai) this.majPanneauSiCalme(); }
    }
  },
  annonce(t, c) { this.bandeau = { t, c, v: 5 }; },
  lancerBataille(finale) {
    const e = this.e, p = e.planete, S = this.station(), R = this.R;
    const liste = finale ? ['mere'].concat(mdeVague(e, 99, MDE_FINALE.budget)) : mdeVague(e, e.aliens.alerte.vague);
    // ils arrivent ensemble de l'espace, en formation, du côté de la station
    const an = S.phi + (R() - 0.5) * 0.9, ux = Math.cos(an), uy = Math.sin(an);
    const aliens = liste.map((k, i) => { const rang = Math.floor((i + 1) / 2), cote = i % 2 ? 1 : -1, d = 720 + rang * 34 + (k === 'mere' ? 120 : 0);
      const x = ux * d - uy * cote * rang * 30, y = uy * d + ux * cote * rang * 30;
      return { k, x, y, vx: 0, vy: 0, a: versAngle(-ux, -uy), pv: MDE_ALIENS[k].pv * (k === 'mere' ? MERE_DIRECT : 1), max: MDE_ALIENS[k].pv * (k === 'mere' ? MERE_DIRECT : 1), t: 1 + R() * 1.5, flash: 0, orb: R() * TAU, cible: null }; });
    const F = finale ? Object.values(e.flottes).flat() : e.flottes[p];
    const unites = F.map((u, i) => { const s = mdeUniteCombat(e, u); return Object.assign(s, { max: s.pv, x: S.x, y: S.y, vx: 0, vy: 0, a: S.a, t: i * 0.2, orb: i / Math.max(1, F.length) * TAU, la: false }); });
    this.bat = { finale, vague: finale ? 0 : e.aliens.alerte.vague, aliens, unites, base: finale ? 0 : MDE_VAGUES.base, baseMax: MDE_VAGUES.base, t: 0, retard: finale ? 0 : mdeRetard(e, p), fini: 0 };
    this.tirsA = [];
    this.annonce(finale ? 'LE VAISSEAU-MERE ARRIVE !' : 'VAGUE ' + this.bat.vague + ' : LES ALIENS ATTAQUENT !', '#d27ef0');
    if (this.quai) this.majPanneauSiCalme();
  },
  finBataille(victoire) {
    const B = this.bat, e = this.e; if (!B || B.fini) return;
    B.fini = 1;
    if (B.finale) { mdeFinFinale(e, victoire); if (victoire) this.victoire(); else { this.son('defaite'); this.annonce('LE VAISSEAU-MERE A GAGNE CETTE FOIS : IL REVIENDRA', '#ff6a5c'); } }
    else { mdeFinVague(e, victoire); this.son(victoire ? 'flotte' : 'defaite'); this.annonce(victoire ? 'VAGUE ' + B.vague + ' REPOUSSEE !' : 'LA STATION EST HORS SERVICE (A REPARER AU QUAI)', victoire ? '#7be07b' : '#ff6a5c'); }
    for (const a of B.aliens) if (a.pv > 0) a.fuite = true;   // les survivants repartent dans l'espace
    this.sauver(); if (this.quai) this.majPanneauSiCalme();
  },
  // les cibles possibles des aliens : la corvette en vol, la flotte, les chasseurs sortis, la station (sauf finale)
  ciblesAliens() {
    const l = [], s = this.ship, B = this.bat;
    if (!this.quai && !this.panne) l.push({ x: s.x, y: s.y, ray: 16, quoi: 'corvette' });
    for (const u of B.unites) if (u.la && u.pv > 0) l.push({ x: u.x, y: u.y, ray: 10, quoi: u });
    for (const c of this.escadrille || []) if (c.etat !== 'bord') l.push({ x: c.x, y: c.y, ray: 9, quoi: c });
    if (!B.finale) { const S = this.station(); l.push({ x: S.x, y: S.y, ray: RAY_ST, quoi: 'station' }); }
    return l;
  },
  // un tir alien qui touche : la corvette perd de la coque (4 points de dégâts = 1 plaque), la station des PV (siège : moitié)
  toucher(quoi, dmg) {
    const B = this.bat;
    if (quoi === 'corvette') { if (this.quai || this.panne) return; this.coque -= dmg / 4; this.secousse = 0.15; this.son('touche'); this.vibrer(25);
      if (this.coque <= 0) { if (B && B.finale) this.finBataille(false); this.tomberEnPanne('COQUE DETRUITE !'); } }
    else if (quoi === 'station') { B.base -= dmg * MDE_VAGUES.siege; if (B.base <= 0) { B.base = 0; this.finBataille(false); } }
    else if (quoi.etat) { quoi.pv -= dmg; if (quoi.pv <= 0) { quoi.etat = 'retour'; quoi.energie = 0; this.texte(quoi.x, quoi.y - 12, 'CHASSEUR TOUCHE', '#ff9d4a'); } }
    else { quoi.pv -= dmg; if (quoi.pv <= 0) { this.texte(quoi.x, quoi.y - 14, MDE_UNITES[quoi.type].nom + ' REMORQUE', '#ff9d4a'); this.eclats(quoi.x, quoi.y, 10, 'titane', true); } }
  },
  // une balle du joueur (tourelles, chasseurs, flotte) touche-t-elle un alien ?
  toucheAlien(b, deg) {
    const B = this.bat; if (!B) return false;
    for (const a of B.aliens) if (a.pv > 0 && !a.fuite && Math.hypot(a.x - b.x, a.y - b.y) < AL_VOL[a.k].ray) { this.blesserAlien(a, deg); return true; }
    return false;
  },
  blesserAlien(a, deg) {
    a.pv -= deg; a.flash = 0.08; this.eclats(a.x, a.y, 2, 'cobalt'); this.son('touche');
    if (a.pv <= 0) { this.eclats(a.x, a.y, a.k === 'mere' ? 60 : a.k === 'croiseur' ? 30 : 16, 'cristal', true); this.secousse = a.k === 'mere' ? 0.6 : 0.15; this.son(a.k === 'mere' ? 'mere' : 'boum'); if (a.k === 'mere') this.vibrer(400);
      this.texte(a.x, a.y - 16, MDE_ALIENS[a.k].nom + ' ABATTU', '#d27ef0'); }
  },

  /* ----- un pas de combat : aliens, flotte, tirs aliens ----- */
  pasCombat(dt) {
    const B = this.bat; if (!B) return;
    const e = this.e, R = this.R, S = this.station(); B.t += dt;
    const vivants = B.aliens.filter(a => a.pv > 0 && !a.fuite);
    if (!B.fini && !vivants.length) this.finBataille(true);
    // la flotte décolle de la station après son retard (les satellites la font venir plus tôt)
    for (const u of B.unites) if (!u.la && B.t >= B.retard + u.t) { u.la = true; u.x = S.x; u.y = S.y; if (u === B.unites[0]) { this.texte(S.x, S.y - 60, 'LA FLOTTE DECOLLE !', '#9fd0ff'); this.son('flotte'); } }
    // les aliens
    const cibles = this.ciblesAliens();
    for (const a of B.aliens) {
      if (a.pv <= 0) continue;
      const V = AL_VOL[a.k];
      a.flash = Math.max(0, a.flash - dt);
      if (a.fuite) { const r = Math.hypot(a.x, a.y) || 1; a.vx += (a.x / r * V.v * 2.5 - a.vx) * dt; a.vy += (a.y / r * V.v * 2.5 - a.vy) * dt; a.x += a.vx * dt; a.y += a.vy * dt; a.a = tournerVers(a.a, versAngle(a.vx, a.vy), 2 * dt);
        if (r > 1400) a.pv = 0; continue; }
      a.t -= dt; a.chg = (a.chg || 0) - dt;
      if (a.chg <= 0 || !a.cible || (a.cible.quoi !== 'corvette' && a.cible.quoi !== 'station' && a.cible.quoi.pv <= 0)) { a.chg = 1 + R();
        let best = null, bd = 1e9; for (const c of cibles) { const d = Math.hypot(c.x - a.x, c.y - a.y) * (c.quoi === 'station' ? 1.3 : 1); if (d < bd) { bd = d; best = c; } } a.cible = best; }
      const c = a.cible; if (!c) continue;
      const cx = c.quoi === 'corvette' ? this.ship.x : c.quoi === 'station' ? S.x : c.quoi.x, cy = c.quoi === 'corvette' ? this.ship.y : c.quoi === 'station' ? S.y : c.quoi.y;
      // ils tournent autour de leur cible à leur distance de tir
      a.orb += dt * (V.v / Math.max(60, V.d)) * 0.5;
      const px = cx + Math.cos(a.orb) * V.d, py = cy + Math.sin(a.orb) * V.d, dx = px - a.x, dy = py - a.y, dl = Math.hypot(dx, dy) || 1, vv = Math.min(V.v, dl * 1.5);
      a.vx += (dx / dl * vv - a.vx) * Math.min(1, dt * 1.2); a.vy += (dy / dl * vv - a.vy) * Math.min(1, dt * 1.2); a.x += a.vx * dt; a.y += a.vy * dt;
      const dc = Math.hypot(cx - a.x, cy - a.y);
      a.a = tournerVers(a.a, dc < V.d + 120 ? versAngle(cx - a.x, cy - a.y) : versAngle(a.vx, a.vy), 3 * dt);
      if (dc < V.d + 70 && a.t <= 0) { a.t = V.cd * (0.85 + R() * 0.3);
        const n = a.k === 'mere' ? 3 : 1; this.son('alien');
        for (let i = 0; i < n; i++) { const vise = Math.atan2(cy - a.y, cx - a.x) + (i - (n - 1) / 2) * 0.12, v = 210;
          this.tirsA.push({ x: a.x + Math.cos(vise) * V.ray * 0.6, y: a.y + Math.sin(vise) * V.ray * 0.6, vx: Math.cos(vise) * v, vy: Math.sin(vise) * v, v: 2.2, dmg: MDE_ALIENS[a.k].att * V.cd / n, cible: c.quoi }); } }
    }
    B.aliens = B.aliens.filter(a => a.pv > 0);
    // les tirs aliens : ils touchent leur cible (ou la corvette sur leur chemin)
    for (const b of this.tirsA) { b.x += b.vx * dt; b.y += b.vy * dt; b.v -= dt;
      const q = b.cible, tx = q === 'corvette' ? this.ship.x : q === 'station' ? S.x : q.x, ty = q === 'corvette' ? this.ship.y : q === 'station' ? S.y : q.y, ray = q === 'corvette' ? 16 : q === 'station' ? RAY_ST : 10;
      if ((q === 'corvette' || q === 'station' || q.pv > 0) && Math.hypot(tx - b.x, ty - b.y) < ray) { b.v = 0; this.toucher(q, b.dmg); this.eclats(b.x, b.y, 3, 'cristal'); continue; }
      if (q !== 'corvette' && !this.quai && !this.panne && Math.hypot(this.ship.x - b.x, this.ship.y - b.y) < 14) { b.v = 0; this.toucher('corvette', b.dmg); this.eclats(b.x, b.y, 3, 'cristal'); } }
    this.tirsA = this.tirsA.filter(b => b.v > 0);
    // la flotte : chaque unité vise l'alien le plus proche de la station, s'en approche et tire (dégâts par seconde = att)
    for (const u of B.unites) {
      if (!u.la || u.pv <= 0) continue;
      const V = UN_VOL[u.type] || UN_VOL.garde; u.t -= dt; u.orb += dt * 0.6;
      let cible = null, bd = 1e9;
      if (u.soin) { for (const v of B.unites) if (v !== u && v.la && v.pv > 0 && v.pv < v.max) { const d = Math.hypot(v.x - u.x, v.y - u.y); if (d < bd) { bd = d; cible = v; } } }
      else for (const a of B.aliens) if (!a.fuite) { const d = Math.hypot(a.x - S.x, a.y - S.y) + Math.hypot(a.x - u.x, a.y - u.y) * 0.5; if (d < bd) { bd = d; cible = a; } }
      const cx = cible ? cible.x : S.x, cy = cible ? cible.y : S.y, dd = cible ? V.d : 70;
      const px = cx + Math.cos(u.orb) * dd, py = cy + Math.sin(u.orb) * dd, dx = px - u.x, dy = py - u.y, dl = Math.hypot(dx, dy) || 1, vv = Math.min(V.v, dl * 1.5);
      u.vx += (dx / dl * vv - u.vx) * Math.min(1, dt * 1.5); u.vy += (dy / dl * vv - u.vy) * Math.min(1, dt * 1.5); u.x += u.vx * dt; u.y += u.vy * dt;
      const dc = Math.hypot(cx - u.x, cy - u.y);
      u.a = tournerVers(u.a, cible && dc < dd + 100 ? versAngle(cx - u.x, cy - u.y) : versAngle(u.vx, u.vy), 3 * dt);
      if (cible && u.soin && dc < 90) { cible.pv = Math.min(cible.max, cible.pv + u.soin * dt); u.rayon = cible; } else u.rayon = null;
      if (cible && !u.soin && u.att && dc < dd + 80 && u.t <= 0) { u.t = 0.6; const an = Math.atan2(cy - u.y, cx - u.x);
        this.balles.push({ x: u.x + Math.cos(an) * 8, y: u.y + Math.sin(an) * 8, vx: Math.cos(an) * 330, vy: Math.sin(an) * 330, v: 0.9, a: an + Math.PI / 2, deg: u.att * 0.6, sorte: 'flotte' }); }
    }
    if (B.fini && !B.aliens.some(a => a.pv > 0)) { this.bat = null; this.tirsA = []; }
  },

  /* ----- le porte-vaisseaux : escadrille et défense rapprochée (en vol seulement) ----- */
  pasEscadrille(dt) {
    const E = this.C.escadrille; if (!E || !this.escadrille) return;
    const s = this.ship, R = this.R, enVol = !this.quai && !this.panne, B = this.bat;
    const aliens = B ? B.aliens.filter(a => a.pv > 0 && !a.fuite) : [];
    const prises = new Set(this.escadrille.map(c => c.cible));
    const chercher = (x, y, portee) => {   // un alien d'abord, sinon une petite ou moyenne roche libre
      let best = null, bd = portee;
      for (const a of aliens) { const d = Math.hypot(a.x - x, a.y - y) - 80; if (d < bd) { bd = d; best = a; } }
      if (best) return best;
      for (const a of this.asts) if (!a.rapide && a.r.taille <= 2 && !prises.has(a)) { const d = Math.hypot(a.x - x, a.y - y); if (d < bd) { bd = d; best = a; } }
      return best;
    };
    const vivante = c => c && (c.k ? c.pv > 0 && !c.fuite : this.asts.includes(c));
    for (const c of this.escadrille) {
      c.t -= dt;
      if (c.etat === 'bord') {
        c.x = s.x; c.y = s.y; c.a = s.a;
        c.energie = Math.min(E.energie, c.energie + dt * E.energie / 3); if (c.energie >= E.energie) c.pv = E.pv;
        if (enVol && c.energie >= E.energie && c.t <= 0) { const cb = chercher(s.x, s.y, 360); if (cb) { c.etat = 'sortie'; c.cible = cb; prises.add(cb);
          const an = s.a + (R() - 0.5) * 2; c.vx = s.vx + Math.sin(an) * 90; c.vy = s.vy - Math.cos(an) * 90; c.t = 0.3; } }
        continue;
      }
      if (!enVol) { c.etat = 'retour'; }
      c.energie -= dt;
      const dS = Math.hypot(s.x - c.x, s.y - c.y);
      if (c.etat === 'sortie') {
        if (!vivante(c.cible)) { c.cible = chercher(c.x, c.y, 300); if (c.cible) prises.add(c.cible); }
        if (!c.cible || c.energie < dS / 160 + 1.5 || (c.cargo.length >= E.soute && !c.cible.k)) c.etat = 'retour';
      }
      let tx, ty, dd;
      if (c.etat === 'sortie') { tx = c.cible.x; ty = c.cible.y; dd = c.cible.k ? 70 : 46; } else { tx = s.x; ty = s.y; dd = 0; }
      const an0 = Math.atan2(c.y - ty, c.x - tx), px = tx + Math.cos(an0 + dt) * dd, py = ty + Math.sin(an0 + dt) * dd;
      const dx = px - c.x, dy = py - c.y, dl = Math.hypot(dx, dy) || 1, vv = Math.min(170, dl * 3);
      c.vx += (dx / dl * vv - c.vx) * Math.min(1, dt * 3); c.vy += (dy / dl * vv - c.vy) * Math.min(1, dt * 3); c.x += c.vx * dt; c.y += c.vy * dt;
      c.a = tournerVers(c.a, c.etat === 'sortie' && Math.hypot(tx - c.x, ty - c.y) < dd + 60 ? versAngle(tx - c.x, ty - c.y) : versAngle(c.vx, c.vy), 6 * dt);
      if (c.etat === 'sortie' && c.t <= 0 && Math.hypot(tx - c.x, ty - c.y) < dd + 50) { c.t = 0.5; const an = Math.atan2(ty - c.y, tx - c.x);
        this.son('chasseur'); this.balles.push({ x: c.x + Math.cos(an) * 6, y: c.y + Math.sin(an) * 6, vx: Math.cos(an) * 300, vy: Math.sin(an) * 300, v: 0.5, a: an + Math.PI / 2, deg: E.degats, sorte: 'chasseur' }); }
      // ramasser le minerai qui passe tout près
      if (c.cargo.length < E.soute) for (const d of this.drops) if (d.v > 0 && Math.hypot(d.x - c.x, d.y - c.y) < 16) { d.v = 0; c.cargo.push(d.type); if (c.cargo.length >= E.soute) break; }
      if (c.etat === 'retour' && dS < 16) {
        for (const m of c.cargo) { if (this.soute.length < this.C.soute) { this.soute.push(m); this.texte(s.x, s.y - 30, '+1', '#9fd0ff'); }
          else this.drops.push({ x: s.x, y: s.y, vx: (R() - 0.5) * 60, vy: (R() - 0.5) * 60, v: 14, type: m }); }
        c.cargo = []; c.etat = 'bord'; c.cible = null; c.t = 0.5; c.energie = Math.max(0, c.energie);
      }
    }
    // défense rapprochée : un éclair abat la météorite ou blesse l'alien le plus proche dans sa portée
    this.zaps = (this.zaps || []).filter(z => (z.v -= dt) > 0);
    if (!enVol) return;
    this.defT -= dt; if (this.defT > 0) return;
    let best = null, bd = E.defense.portee;
    for (const a of this.asts) if (a.rapide) { const d = Math.hypot(a.x - s.x, a.y - s.y); if (d < bd) { bd = d; best = a; } }
    for (const a of aliens) { const d = Math.hypot(a.x - s.x, a.y - s.y) - AL_VOL[a.k].ray; if (d < bd) { bd = d; best = a; } }
    if (!best) return;
    this.defT = E.defense.cadence; this.son('zap'); this.zaps.push({ x: best.x, y: best.y, v: 0.1 });
    if (best.k) this.blesserAlien(best, 1); else { best.vie = 0; this.eclats(best.x, best.y, 8, 'fer', true); }
  },

  /* ----- dessin : satellites, flotte, aliens, escadrille, tirs ----- */
  dessinCombat(x, ox, oy, t) {
    const e = this.e, p = e.planete, B = this.bat, vu = (X, Y, m) => X > -m && Y > -m && X < W + m && Y < H + m;
    // satellites en orbite basse : veille (aliens), guidage, météo, radar ; ceux de défense plus haut, avec leurs tirs
    const orb = [];
    for (let k = 0; k < (e.satellites[p] || 0); k++) orb.push('d_satellite');
    if (e.orbite.guidage) orb.push('d_guidage'); if (e.orbite.meteo) orb.push('d_meteo'); if (e.orbite.radar) orb.push('d_radar');
    orb.forEach((k, i) => { const an = t * 0.05 + i / orb.length * TAU, X = Math.cos(an) * 205 + ox, Y = Math.sin(an) * 205 + oy;
      if (vu(X, Y, 20)) { if (pretSpr(k)) dessineSpr(x, k, X, Y, an); else { x.fillStyle = '#9fd0ff'; x.fillRect(Math.round(X) - 2, Math.round(Y) - 2, 4, 4); }
        if (k === 'd_radar' && this.radarT > 0) { const f = (t * 1.2) % 1; x.strokeStyle = `rgba(255,207,74,${0.5 * (1 - f)})`; x.beginPath(); x.arc(Math.round(X), Math.round(Y), 6 + f * 40, 0, 7); x.stroke(); } } });
    for (const sd of this.satsDef || []) { const X = sd.x + ox, Y = sd.y + oy; if (!vu(X, Y, 20)) continue;
      if (pretSpr('d_satdef')) dessineSpr(x, 'd_satdef', X, Y, sd.a); else { x.fillStyle = '#ff9d4a'; x.fillRect(Math.round(X) - 3, Math.round(Y) - 3, 6, 6); }
      if (sd.feu > 0) { x.strokeStyle = '#fff2a0'; x.beginPath(); x.moveTo(Math.round(X), Math.round(Y)); x.lineTo(Math.round(sd.cx + ox), Math.round(sd.cy + oy)); x.stroke(); } }
    if (B) {
      for (const u of B.unites) { if (!u.la || u.pv <= 0) continue; const X = u.x + ox, Y = u.y + oy; if (!vu(X, Y, 30)) continue;
        if (u.rayon) { x.strokeStyle = '#7be07b'; x.beginPath(); x.moveTo(Math.round(X), Math.round(Y)); x.lineTo(Math.round(u.rayon.x + ox), Math.round(u.rayon.y + oy)); x.stroke(); }
        if (pretSpr('u_' + u.type)) dessineSpr(x, 'u_' + u.type, X, Y, u.a); else { x.fillStyle = '#9fd0ff'; x.fillRect(Math.round(X) - 4, Math.round(Y) - 4, 8, 8); }
        if (u.pv < u.max) { x.fillStyle = '#000a'; x.fillRect(Math.round(X) - 8, Math.round(Y) - 16, 16, 2); x.fillStyle = '#7be07b'; x.fillRect(Math.round(X) - 8, Math.round(Y) - 16, Math.round(16 * u.pv / u.max), 2); } }
      for (const a of B.aliens) { const X = a.x + ox, Y = a.y + oy, V = AL_VOL[a.k]; if (!vu(X, Y, V.ray * 2 + 20)) continue;
        // tuyères violettes qui clignotent
        if (pretSpr('a_' + a.k)) { dessineSpr(x, 'a_' + a.k, X, Y, a.a);
          if (a.flash > 0) { x.globalCompositeOperation = 'lighter'; dessineSpr(x, 'a_' + a.k, X, Y, a.a, undefined, 0.5); x.globalCompositeOperation = 'source-over'; } }
        else { x.fillStyle = '#d27ef0'; x.beginPath(); x.arc(Math.round(X), Math.round(Y), V.ray * 0.6, 0, 7); x.fill(); }
        if (a.pv < a.max && !a.fuite) { const w = a.k === 'mere' ? 90 : 22; x.fillStyle = '#000a'; x.fillRect(Math.round(X - w / 2), Math.round(Y - V.ray - 10), w, 3); x.fillStyle = '#d27ef0'; x.fillRect(Math.round(X - w / 2), Math.round(Y - V.ray - 10), Math.round(w * a.pv / a.max), 3); } }
      for (const b of this.tirsA || []) { const X = Math.round(b.x + ox), Y = Math.round(b.y + oy); x.fillStyle = '#8a3fd0'; x.fillRect(X - 2, Y - 2, 4, 4); x.fillStyle = '#f0c8ff'; x.fillRect(X - 1, Y - 1, 2, 2); }
    }
    // escadrille sortie : chasseurs avec leur barre d'énergie quand elle baisse
    const E = this.C.escadrille;
    if (E && this.escadrille) for (const c of this.escadrille) { if (c.etat === 'bord') continue; const X = c.x + ox, Y = c.y + oy; if (!vu(X, Y, 20)) continue;
      const k = E.grand ? 'chasseur2' : 'chasseur1';
      if (pretSpr(k)) dessineSpr(x, k, X, Y, c.a); else { x.fillStyle = '#ff6a5c'; x.fillRect(Math.round(X) - 3, Math.round(Y) - 3, 6, 6); }
      if (c.cargo.length) x.drawImage(PEP[c.cargo[0]], Math.round(X) - 4, Math.round(Y) + 9, 8, 7);
      const f = Math.max(0, c.energie / E.energie); if (f < 0.6) { x.fillStyle = '#000a'; x.fillRect(Math.round(X) - 7, Math.round(Y) - 14, 14, 2); x.fillStyle = f < 0.25 ? '#ff6a5c' : '#ffcf4a'; x.fillRect(Math.round(X) - 7, Math.round(Y) - 14, Math.round(14 * f), 2); } }
    for (const z of this.zaps || []) { const s = this.ship; x.strokeStyle = '#bfe8ff'; x.lineWidth = 2; x.beginPath(); x.moveTo(Math.round(s.x + ox), Math.round(s.y + oy)); x.lineTo(Math.round(z.x + ox), Math.round(z.y + oy)); x.stroke(); x.lineWidth = 1; }
  },
  // en haut de l'écran : alerte (compte à rebours), combat en cours (aliens restants, PV de la station, flotte), annonces ;
  // chevrons violets au bord de l'écran vers les aliens hors champ
  dessinAlertes(x, t) {
    const e = this.e, B = this.bat, al = e.aliens.alerte;
    let ligne = null, col = '#ff6a5c';
    if (B && !B.fini) { const n = B.aliens.filter(a => a.pv > 0 && !a.fuite).length;
      ligne = (B.finale ? 'BATAILLE FINALE' : 'VAGUE ' + B.vague) + ' · ' + n + ' ALIEN' + (n > 1 ? 'S' : '') + (B.t < B.retard && B.unites.length ? ' · FLOTTE DANS ' + Math.ceil(B.retard - B.t) + ' S' : ''); col = '#d27ef0'; }
    else if (al && !B) ligne = 'ALERTE : ATTAQUE SUR ' + MDE_PLANETES[al.planete].nom + ' DANS ' + Math.max(0, Math.ceil(al.a - e.temps)) + ' S';
    if (ligne) { x.font = '10px Silkscreen'; x.textAlign = 'center'; const w = x.measureText(ligne).width + 16;
      x.fillStyle = '#05060dcc'; x.fillRect(Math.round(W / 2 - w / 2), 32, Math.round(w), 15); x.fillStyle = (t * 3 % 1 < 0.7 || B) ? col : '#7a2a26'; x.fillText(ligne, W / 2, 43);
      if (B && !B.finale && !B.fini) { const bw = 120, bx = Math.round(W / 2 - bw / 2); x.fillStyle = '#1a1f40'; x.fillRect(bx, 49, bw, 4); x.fillStyle = B.base / B.baseMax < 0.3 ? '#ff6a5c' : '#7be07b'; x.fillRect(bx, 49, Math.round(bw * B.base / B.baseMax), 4);
        x.font = '8px Silkscreen'; x.fillStyle = '#8c93c4'; x.textAlign = 'right'; x.fillText('STATION', bx - 4, 54); } }
    if (this.bandeau && this.bandeau.v > 0) { const b = this.bandeau; x.font = '12px Silkscreen'; x.textAlign = 'center'; x.globalAlpha = Math.min(1, b.v);
      x.fillStyle = '#000'; x.fillText(b.t, W / 2 + 1, 75); x.fillStyle = b.c; x.fillText(b.t, W / 2, 74); x.globalAlpha = 1; }
    if (B && !this.quai) { const ox = this.ox, oy = this.oy; let n = 0;
      for (const a of B.aliens) { if (a.pv <= 0 || a.fuite || n >= 6) continue; const X = a.x + ox, Y = a.y + oy; if (X > 0 && Y > 30 && X < W && Y < H) continue; n++;
        const an = Math.atan2(Y - H / 2, X - W / 2), kk = Math.min((W / 2 - 16) / Math.abs(Math.cos(an)), (H / 2 - 64) / Math.abs(Math.sin(an))), fx = W / 2 + Math.cos(an) * kk, fy = H / 2 + 24 + Math.sin(an) * kk;
        x.save(); x.translate(fx, fy); x.rotate(an); x.fillStyle = '#d27ef0'; x.beginPath(); x.moveTo(7, 0); x.lineTo(-5, -6); x.lineTo(-5, 6); x.fill(); x.restore(); } }
  },

  /* ----- drones des stations (02/11) : les mineurs vont de roche en roche, les cargos ramassent le plus proche ----- */
  // dessin et mouvement seulement : la production reste celle des règles (mdeProduction) ; le minerai des roches cassées
  // par un mineur devient un « colis » que seuls les cargos ramassent
  pasDrones(dt) {
    const e = this.e, p = e.planete, d = e.drones[p], marche = mdeABase(e, p) && !e.hs[p];
    this.colis = (this.colis || []).filter(c => (c.v -= dt) > 0);
    if (!marche) { this.drn = null; this.colis = []; return; }
    const S = this.station(), D = this.drn || (this.drn = { m: [], c: [] }), s = this.ship;
    while (D.m.length < d.mineur) D.m.push({ x: S.x, y: S.y, vx: 0, vy: 0, a: 0, cible: null });
    while (D.c.length < d.cargo) D.c.push({ x: S.x, y: S.y, vx: 0, vy: 0, a: 0, charge: 0, cible: null, orb: this.R() * TAU });
    D.m.length = d.mineur; D.c.length = d.cargo;
    const aller = (o, tx, ty, v, dist) => { const dx = tx - o.x, dy = ty - o.y, dl = Math.hypot(dx, dy) || 1, vv = Math.min(v, Math.max(0, dl - dist) * 1.5);
      o.vx += (dx / dl * vv - o.vx) * Math.min(1, dt * 2); o.vy += (dy / dl * vv - o.vy) * Math.min(1, dt * 2); o.x += o.vx * dt; o.y += o.vy * dt; return dl; };
    const prises = new Set(D.m.map(m => m.cible));
    for (const m of D.m) {
      m.laser = null;
      if (!m.cible || !this.asts.includes(m.cible)) {   // la roche la plus proche, loin de la corvette (on ne lui vole pas la sienne)
        let best = null, bd = 1e9; for (const a of this.asts) { if (a.rapide || prises.has(a) || Math.hypot(a.x - s.x, a.y - s.y) < 220) continue; const dd = Math.hypot(a.x - m.x, a.y - m.y); if (dd < bd) { bd = dd; best = a; } }
        m.cible = best; prises.add(best);
      }
      const a = m.cible; if (!a) { aller(m, S.x * 1.6, S.y * 1.6, 40, 0); m.a = tournerVers(m.a, versAngle(m.vx, m.vy), 3 * dt); continue; }
      const dl = aller(m, a.x, a.y, 60, a.ray + 16);
      m.a = tournerVers(m.a, dl < a.ray + 60 ? versAngle(a.x - m.x, a.y - m.y) : versAngle(m.vx, m.vy), 3 * dt);
      if (dl < a.ray + 40) { m.laser = a; a.r.pv -= dt * 0.9; a.flash = 0.05;
        if (this.R() < dt * 6) this.parts.push({ x: a.x + (this.R() - 0.5) * a.ray, y: a.y + (this.R() - 0.5) * a.ray, vx: (this.R() - 0.5) * 30, vy: (this.R() - 0.5) * 30, v: 0.3, c: '#ffe08a', t: 1 });
        if (a.r.pv <= 0) { this.casser(a, true); m.cible = null; } }
    }
    const visees = new Set(D.c.map(c => c.cible));
    for (const c of D.c) {
      if (c.charge < 3 && (!c.cible || !this.colis.includes(c.cible))) {   // le colis le plus proche de lui
        let best = null, bd = 1e9; for (const k of this.colis) { if (visees.has(k)) continue; const dd = Math.hypot(k.x - c.x, k.y - c.y); if (dd < bd) { bd = dd; best = k; } }
        c.cible = best; visees.add(best);
      }
      if (c.charge < 3 && c.cible) { const dl = aller(c, c.cible.x, c.cible.y, 80, 0); c.a = tournerVers(c.a, versAngle(c.vx, c.vy), 4 * dt);
        if (dl < 10) { this.colis.splice(this.colis.indexOf(c.cible), 1); c.charge++; c.cible = null; } }
      else if (c.charge) { const dl = aller(c, S.x, S.y, 80, 0); c.a = tournerVers(c.a, versAngle(c.vx, c.vy), 4 * dt); if (dl < 14) c.charge = 0; }
      else { c.orb += dt * 0.4; aller(c, S.x + Math.cos(c.orb) * 50, S.y + Math.sin(c.orb) * 50, 40, 0); c.a = tournerVers(c.a, versAngle(c.vx, c.vy), 3 * dt); }
    }
    for (const k of this.colis) { k.vx *= 1 - dt * 0.8; k.vy *= 1 - dt * 0.8; k.x += k.vx * dt; k.y += k.vy * dt; }
  },
  /* ----- satellites de défense : en orbite haute, ils tirent sur les roches proches et sur les aliens ----- */
  pasOrbite(dt) {
    const e = this.e, n = e.orbite.defense[e.planete] || 0, R = MDE_SATDEF;
    if (!this.satsDef || this.satsDef.length !== n) this.satsDef = Array.from({ length: n }, (_, i) => ({ i, x: 0, y: 0, a: 0, t: i * 0.3, feu: 0 }));
    const aliens = this.bat ? this.bat.aliens.filter(a => a.pv > 0 && !a.fuite) : [];
    for (const sd of this.satsDef) {
      const an = e.temps * 0.03 + sd.i / n * TAU; sd.x = Math.cos(an) * 300; sd.y = Math.sin(an) * 300; sd.t -= dt; sd.feu -= dt;
      let best = null, bd = R.portee;
      for (const a of aliens) { const d = Math.hypot(a.x - sd.x, a.y - sd.y) - 40; if (d < bd) { bd = d; best = a; } }
      if (!best) for (const a of this.asts) { const d = Math.hypot(a.x - sd.x, a.y - sd.y) - a.ray; if (d < bd) { bd = d; best = a; } }
      sd.a = best ? tournerVers(sd.a, versAngle(best.x - sd.x, best.y - sd.y), 4 * dt) : an + Math.PI;
      if (best && sd.t <= 0) { sd.t = R.cadence; sd.feu = 0.06; sd.cx = best.x; sd.cy = best.y;
        if (best.k) this.blesserAlien(best, R.att * R.cadence * 1.5);
        else { best.r.pv -= 1; best.flash = 0.08; this.eclats(best.x, best.y, 3, best.rapide ? 'fer' : best.r.minerai); if (best.r.pv <= 0) { if (best.rapide) best.vie = 0; else this.casser(best); } } }
    }
  },
  /* ----- le radar (bouton) : les roches les plus proches dans sa portée, montrées quelques secondes ----- */
  radar() {
    const e = this.e, P = e.orbite.radar ? MDE_RADAR[e.orbite.radar - 1] : 0; if (!P || this.radarT > 0) return;
    const s = this.ship, l = this.asts.filter(a => !a.rapide).map(a => ({ a, d: Math.hypot(a.x - s.x, a.y - s.y) })).filter(o => o.d < P).sort((u, v) => u.d - v.d).slice(0, 3).map(o => o.a);
    this.radarL = l; this.radarT = 6; this.son('zap');
    if (!l.length) this.texte(s.x, s.y - 44, 'RADAR : RIEN A ' + P + ' M', '#ffcf4a');
  },
  dessinRadar(x, t) {
    if (!(this.radarT > 0) || this.quai) return;
    const ox = this.ox, oy = this.oy, s = this.ship;
    (this.radarL || []).forEach((a, i) => { if (!this.asts.includes(a)) return; const X = a.x + ox, Y = a.y + oy, d = Math.round(Math.hypot(a.x - s.x, a.y - s.y) / 10);
      x.strokeStyle = '#ffcf4a'; x.globalAlpha = Math.min(1, this.radarT);
      if (X > 10 && Y > 40 && X < W - 10 && Y < H - 10) { const r = a.ray + 6 + Math.sin(t * 6) * 2; x.beginPath(); x.arc(Math.round(X), Math.round(Y), r, 0, 7); x.stroke(); }
      else { const an = Math.atan2(Y - H / 2, X - W / 2), kk = Math.min((W / 2 - 40) / Math.abs(Math.cos(an)), (H / 2 - 70) / Math.abs(Math.sin(an))), fx = W / 2 + Math.cos(an) * kk, fy = H / 2 + 14 + Math.sin(an) * kk;
        x.save(); x.translate(fx, fy); x.rotate(an); x.fillStyle = '#ffcf4a'; x.beginPath(); x.moveTo(9, 0); x.lineTo(-5, -6); x.lineTo(-5, 6); x.fill(); x.restore();
        x.font = '8px Silkscreen'; x.textAlign = 'center'; x.fillStyle = '#ffcf4a'; x.fillText((i === 0 ? 'ROCHE ' : '') + d + ' KM', fx - Math.cos(an) * 26, fy - Math.sin(an) * 16 + 3); }
      x.globalAlpha = 1; });
  },
  /* ----- fin de partie ----- */
  victoire() {
    const e = this.e, f = document.createElement('div'); f.className = 'pause vu victoire'; this.ecran.appendChild(f);
    const h = Math.floor(e.temps / 3600), m = Math.floor(e.temps / 60) % 60, g = e.journal.filter(j => j.vague && j.victoire).length;
    f.innerHTML = `<div class="boite"><h3>VICTOIRE !</h3><p class="doux" style="font-size:10px;color:#dfe3ff">LE VAISSEAU-MERE EST ABATTU. LES ALIENS NE REVIENDRONT PLUS.</p>
      <p class="doux">TEMPS DE JEU : ${h} H ${String(m).padStart(2, '0')} · VAGUES REPOUSSEES : ${g} / ${MDE_VAGUES.nombre}</p>
      <button class="btn" data-libre="1">CONTINUER EN MODE LIBRE</button><a class="btn ludo-retour" href="../index.html">◀ LUDOTHEQUE</a></div>`;
    this.pauseVue = true; this.son('victoire');
    f.addEventListener('click', ev => { if (ev.target.dataset && ev.target.dataset.libre) { f.remove(); this.pauseVue = false; this.annonce('MODE LIBRE : MINE A TA GUISE', '#7be07b'); } });
  },
});

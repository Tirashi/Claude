/* Doggy Saga : la page (rendu de la grille, animations, menus). Les règles sont dans regles.js (dogCoup règle tout
   le coup d'un bloc et rend des événements) ; ici on les rejoue un par un en animation sur une « grille visible » (P.vis)
   qui rattrape la vraie grille à la fin de chaque coup. Dessins des chiens : chiens.js (DogDessin).
   Toile logique de 360 de large et 600 à 820 de haut (selon l'écran), agrandie à la taille réelle (2 pixels par pixel logique au plus). */
'use strict';
(function () {
  const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);
  const W = 360, N = 8, CELL = 42, BX = 12, L8 = CELL * N;
  let H = 640, K = 1, OX = 0, OY = 0, BY = 168, T = 0, vite = 1;

  /* ---------- sauvegarde ---------- */
  const CLE = 'doggysaga.';
  const lire = (k, d) => { try { const v = localStorage.getItem(CLE + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const ecrire = (k, v) => { try { localStorage.setItem(CLE + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } };
  const prog = Object.assign({ etoiles: {}, scores: {}, album: [] }, lire('progres', {}));
  const sauver = () => ecrire('progres', prog);
  const totalEtoiles = () => Object.values(prog.etoiles).reduce((a, b) => a + b, 0);
  const debloque = id => id === 1 || (prog.etoiles[id - 1] || 0) > 0;
  const prochain = () => { for (const n of DOG_NIVEAUX) if (!prog.etoiles[n.id]) return n.id; return DOG_NIVEAUX.length; };
  // journée du jour : une seule tentative classée, comptée dès le départ (doggysaga.dailyTry) ; câlins dans doggysaga.daily
  const auj = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  const jourJoue = j => lire('dailyTry', 0) === j || lire('daily', {})[j] !== undefined;
  const envoyer = (tab, v) => { try { if (window.LudoScores) return LudoScores.submit('doggysaga', tab, v, false); } catch (e) { /* hors ligne */ } return Promise.resolve(null); };

  /* ---------- sons (sons.js, DogSons) ---------- */
  const son = (k, n) => { try { if (window.DogSons) window.DogSons.jouer(k, n); } catch (e) { /* pas de son */ } };

  /* ---------- textes ---------- */
  const MOTS = ['Ouaf !', 'Trop mignon !', 'Câlin géant !', 'Toute la meute !'];
  const AIDES = {
    glisser: 'Glisse un chien vers son voisin pour aligner 3 chiens pareils. Chaque chien aligné reçoit un câlin !',
    bandana: 'Aligne 4 chiens : l\'un d\'eux met un bandana. Fais-le partir : il vide toute sa ligne !',
    balle: 'Aligne 5 chiens : voici la balle de tennis ! Échange-la avec un chien : tous ceux de sa race partent jouer.',
    boue: 'Les chiens sont pleins de boue ! Aligne les chiens posés sur la boue pour la laver.',
    chiots: 'Des chiots se sont perdus. Fais-les descendre tout en bas, jusqu\'à leur panier.',
    niche: 'Les niches bloquent le passage. Aligne des chiens juste à côté pour les ouvrir.',
    gamelle: 'Les gamelles ne s\'alignent pas. Aligne des chiens à côté pour les renverser.',
    laisse: 'Un chien en laisse ne bouge pas. Aligne-le avec ses copains pour le libérer.',
  };
  const MOTS_FAMILLE = [
    'Biscotte renifle tout le jardin et dort au pied du lit.',
    'Neige chante avec les sirènes et adore jouer dans la neige.',
    'Kumo fait la sieste au soleil, sur le tapis du salon.',
    'Domino court après les vélos, mais il ne les attrape jamais.',
    'Praline va chez le coiffeur tous les mois. Elle adore ça !',
    'Réglisse range les jouets des enfants… à sa façon.',
    'Chorizo creuse des trous partout. Ses nouveaux amis rient beaucoup.',
    'Pompon ronfle très fort, mais c\'est le roi des câlins.',
    'Gaston garde le canapé. Personne n\'ose lui prendre sa place.',
    'Pépite voyage dans un sac, comme une princesse.',
    'Éclair court plus vite que tout le monde au parc.',
    'Cacao saute dans toutes les flaques qu\'il trouve.',
    'Nounours tire la luge des enfants tout l\'hiver.',
    'Galette sautille sur ses petites pattes pour dire bonjour.',
    'Flocon sourit tout le temps. Sa famille aussi !',
    'Caramel a les plus belles oreilles du quartier.',
  ];
  const ETOILE = on => `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21l1.6-7L2 9.2l7.1-.6z" fill="${on ? '#ffc531' : '#eadfd5'}" stroke="${on ? '#c98a00' : '#c9b5a4'}" stroke-width="1.5" stroke-linejoin="round"/></svg>`;

  /* ---------- images pour les menus ---------- */
  const imgs = {};
  function img(cle, taille, dessin) {
    const k = cle + '|' + taille;
    if (imgs[k]) return imgs[k];
    const c = document.createElement('canvas'), px = taille * 2;
    c.width = c.height = px;
    const g = c.getContext('2d');
    g.translate(px / 2, px / 2);
    dessin(g, px * 0.46);
    return (imgs[k] = c.toDataURL());
  }
  const imgChien = (t, taille, humeur, gris) => img('c' + t + '_' + (humeur || 0) + (gris ? 'g' : ''), taille, (g, R) => DogDessin.carte(g, t, R, humeur || 0, gris));
  const imgBoue = taille => img('boue', taille, (g, R) => { DogDessin.boue(g, R * 2, 2, 4); });
  const imgChiot = taille => img('chiot', taille, (g, R) => DogDessin.chiot(g, R, 2));
  // le premier chapitre où l'on peut faire adopter chaque chien
  const chapitreDe = t => { const n = DOG_NIVEAUX.find(v => v.obj.some(o => o.k === 'calins' && o.t === t)); return n ? n.chap : 1; };

  /* ---------- écrans ---------- */
  let ecran = 'titre';
  const OVERLAYS = ['eTitre', 'eCarte', 'eAlbum', 'eFiche', 'eIntro', 'ePause', 'eFin'];
  function montrer(...ids) { for (const id of OVERLAYS) $(id).hidden = !ids.includes(id); }
  function titre() {
    ecran = 'titre'; P = null;
    const t = prog.album.length ? prog.album[Math.floor(Math.random() * prog.album.length)] : 0;
    $('tChien').src = imgChien(t, 140, 2);
    const n = prog.album.length;
    const j = auj(), dj = lire('daily', {})[j];
    $('bJour').innerHTML = 'La journée du jour' + (jourJoue(j) ? `<small>${dj !== undefined ? dj + ' câlins aujourd\'hui' : 'déjà jouée'} · pour le plaisir</small>` : '<small>20 coups, le plus de câlins possible</small>');
    majSon();
    $('tBilan').textContent = totalEtoiles() + ' étoile' + (totalEtoiles() > 1 ? 's' : '') + ' · ' + n + ' chien' + (n > 1 ? 's' : '') + ' adopté' + (n > 1 ? 's' : '') + ' sur ' + DOG_RACES.length;
    montrer('eTitre');
  }
  const COULEURS_CHAP = ['#ffe9d2', '#dde8f0', '#fde4ec', '#e3f1d6', '#fff2c8'];
  function carte() {
    ecran = 'carte'; P = null;
    const box = $('carte'); box.innerHTML = '';
    $('cEtoiles').innerHTML = totalEtoiles() + ' / ' + DOG_NIVEAUX.length * 3 + ' ' + ETOILE(true).replace('<svg', '<svg style="width:20px;height:20px;vertical-align:-3px"');
    const vus = new Set(), ici = prochain();
    let cible = null;
    DOG_CHAPITRES.forEach((ch, k) => {
      const niv = DOG_NIVEAUX.filter(n => n.chap === k + 1), sec = document.createElement('section');
      sec.className = 'chapitre'; sec.style.background = COULEURS_CHAP[k];
      const nouveaux = [];
      for (const n of niv) for (const t of n.races) if (!vus.has(t)) { vus.add(t); nouveaux.push(t); }
      const haut = 150, pas = 92;
      sec.style.height = haut + niv.length * pas + 'px';
      sec.innerHTML = `<h3>${k + 1}. ${ch.nom}</h3><p class="soustitre">${ch.texte}</p><div class="nouveaux">${nouveaux.map(t => `<img src="${imgChien(t, 40)}" alt="${DOG_RACES[t].nom}">`).join('')}</div>`;
      const pts = niv.map((n, j) => [50 + 26 * Math.sin(j * 1.15 + k), haut + j * pas]);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'chemin'); svg.setAttribute('viewBox', `0 0 100 ${haut + niv.length * pas}`); svg.setAttribute('preserveAspectRatio', 'none');
      svg.innerHTML = `<polyline points="${pts.map(p => p[0] + ',' + (p[1] + 31)).join(' ')}" fill="none" stroke="#e8b48f" stroke-width="10" stroke-dasharray="2 14" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
      sec.appendChild(svg);
      niv.forEach((n, j) => {
        const b = document.createElement('button'), e = prog.etoiles[n.id] || 0, ok = debloque(n.id);
        b.className = 'noeud' + (!ok ? ' ferme' : e ? ' fini' : '') + (n.id === ici && ok ? ' ici' : '');
        b.style.left = pts[j][0] + '%'; b.style.top = pts[j][1] + 'px';
        b.textContent = n.id;
        b.setAttribute('aria-label', 'Niveau ' + n.id);
        if (e) b.insertAdjacentHTML('beforeend', `<span class="et">${[1, 2, 3].map(s => ETOILE(s <= e)).join('')}</span>`);
        if (n.id === ici && ok) { b.insertAdjacentHTML('beforeend', `<img class="toi" src="${imgChien(n.races[0], 46, 2)}" alt="">`); cible = b; }
        b.disabled = !ok;
        b.onclick = () => intro(n.id);
        sec.appendChild(b);
      });
      box.appendChild(sec);
    });
    montrer('eCarte');
    if (cible) box.scrollTop = Math.max(0, cible.offsetTop + cible.parentNode.offsetTop - box.clientHeight / 2);
  }
  function album() {
    ecran = 'album';
    const box = $('album'); box.innerHTML = '';
    $('aCompte').textContent = prog.album.length + ' / ' + DOG_RACES.length;
    DOG_RACES.forEach((r, t) => {
      const b = document.createElement('button'), a = prog.album.includes(t);
      b.className = a ? '' : 'vide';
      b.innerHTML = `<img src="${imgChien(t, 76, a ? 2 : 0, !a)}" alt="">${a ? r.nom : '???'}`;
      b.onclick = () => fiche(t);
      box.appendChild(b);
    });
    montrer('eAlbum');
  }
  function fiche(t) {
    const r = DOG_RACES[t], a = prog.album.includes(t);
    $('fiche').innerHTML = a
      ? `<img class="grand" src="${imgChien(t, 150, 2)}" alt=""><h2>${r.nom}</h2><p class="sur">${r.race}</p><p class="mot">${MOTS_FAMILLE[t]}</p><button class="gros" id="bFicheOk">Fermer</button>`
      : `<img class="grand" src="${imgChien(t, 150, 0, true)}" alt=""><h2>???</h2><p class="mot">Ce chien attend encore sa famille. Tu le rencontreras au chapitre ${chapitreDe(t)} : ${DOG_CHAPITRES[chapitreDe(t) - 1].nom}.</p><button class="gros" id="bFicheOk">Fermer</button>`;
    montrer('eAlbum', 'eFiche');
    $('bFicheOk').onclick = () => montrer('eAlbum');
  }
  function htmlObjectifs(niv, av) {
    return niv.obj.map((o, k) => {
      const a = av && av[k], fait = a && a.fait >= a.total;
      if (o.k === 'calins') return `<div class="obj${fait ? ' fait' : ''}"><img src="${imgChien(o.t, 58, fait ? 2 : 0)}" alt="">${a ? Math.min(a.fait, o.n) + ' / ' : ''}${o.n} câlins<br>${DOG_RACES[o.t].nom}</div>`;
      if (o.k === 'boue') return `<div class="obj${fait ? ' fait' : ''}"><img src="${imgBoue(58)}" alt="">${a && !fait ? 'encore ' + a.reste : fait ? 'tout est' : 'toute la'}<br>${fait ? 'propre' : 'boue'}</div>`;
      return `<div class="obj${fait ? ' fait' : ''}"><img src="${imgChiot(58)}" alt="">${a ? a.fait + ' / ' : ''}${o.n} chiot${o.n > 1 ? 's' : ''}<br>au panier</div>`;
    }).join('');
  }
  function intro(id) {
    const niv = DOG_NIVEAUX[id - 1];
    $('iChapitre').textContent = 'Chapitre ' + niv.chap + ' · ' + DOG_CHAPITRES[niv.chap - 1].nom;
    $('iTitre').textContent = 'Niveau ' + id;
    $('iObj').innerHTML = htmlObjectifs(niv);
    $('iAide').hidden = !niv.tuto; $('iAide').textContent = niv.tuto ? AIDES[niv.tuto] : '';
    $('iCoups').textContent = niv.coups + ' coups';
    $('bPartir').onclick = () => lancer(id);
    montrer('eIntro');
    ecran = 'intro';
  }

  function introJour() {
    const j = auj(), niv = dogJour(j), classe = !jourJoue(j), dj = lire('daily', {})[j];
    $('iChapitre').textContent = 'Journée du jour · ' + new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    $('iTitre').textContent = 'Le plus de câlins !';
    $('iObj').innerHTML = niv.races.map(t => `<div class="obj"><img src="${imgChien(t, 46)}" alt="">${DOG_RACES[t].nom}</div>`).join('');
    $('iAide').hidden = false;
    $('iAide').textContent = classe ? 'Une seule tentative classée par jour : elle compte dès le départ. La même grille pour toute la famille !'
      : 'Tentative classée déjà jouée' + (dj !== undefined ? ' (' + dj + ' câlins)' : '') + '. Tu peux rejouer pour le plaisir, sans classement.';
    $('iCoups').textContent = niv.coups + ' coups';
    $('bPartir').onclick = () => lancerJour(classe);
    montrer('eIntro');
    ecran = 'intro';
  }

  /* ---------- la partie ---------- */
  let P = null;
  const rc = i => [Math.floor(i / N), i % N];
  function vt(p, i) { const [r, c] = rc(i); return { t: p.t, sp: p.sp, ch: p.ch || 0, gm: p.gm || 0, ls: p.ls || 0, x: c, y: r, x0: c, y0: r, vy: 0, grow: 1, sq: 0, ph: Math.random() * 10 }; }
  function lancer(id) { demarrer(DOG_NIVEAUX[id - 1], dogNouvelle(DOG_NIVEAUX[id - 1], String(Date.now() % 1e9))); }
  function lancerJour(classe) {
    const j = auj();
    if (classe && jourJoue(j)) classe = false;
    if (classe) ecrire('dailyTry', j);
    demarrer(dogJour(j), dogNouvelleJour(j));
    P.jour = j; P.classe = classe;
  }
  const estJour = () => !!(P && P.jour);
  function demarrer(niv, e) {
    P = {
      niv, e, vis: e.g.map((p, i) => (p ? vt(p, i) : null)), vb: e.boue.slice(), vn: e.niche.slice(),
      aff: { coups: e.coups, score: 0, calins: new Array(DOG_RACES.length).fill(0), boue: e.boueDepart, chiots: 0 },
      couleurs: {}, file: [], attente: 0, enCours: null, dying: [], parts: [], fx: [], textes: [], banniere: null,
      repos: 0, indice: null, choisi: null, appui: null, fete: false, fini: false, adoptes: [],
    };
    niv.races.forEach((t, k) => (P.couleurs[t] = DogDessin.MEDAILLONS[k]));
    // entrée : les chiens tombent du haut
    P.vis.forEach((v, i) => { if (v) { const [r, c] = rc(i); v.y = v.y0 = r - 9 - c * 0.3; } });
    P.enCours = { k: 'chute', fini: () => toutPose() };
    sprites = {};
    ecran = 'partie';
    $('bRecommencer').hidden = false;
    montrer();
    son('debut');
  }
  function toutPose() { return P.vis.every((v, i) => !v || (v.y === Math.floor(i / N) && v.x === i % N)); }
  const occupe = () => !!(P && (P.file.length || P.enCours || P.attente > 0));
  function jouer(a, b) {
    if (!P || occupe() || P.e.fin || ecran !== 'partie') return false;
    const r = dogCoup(P.e, a, b);
    if (!r) return false;
    P.file.push(...r.ev);
    P.repos = 0; P.indice = null; P.choisi = null;
    return r.ok;
  }

  /* ---------- rejouer les événements ---------- */
  function traiter(x) {
    const e = P.e;
    if (x.k === 'echange' || x.k === 'retour') {
      const A = P.vis[x.a], B = P.vis[x.b];
      P.vis[x.a] = B; P.vis[x.b] = A;
      const [ra, ca] = rc(x.a), [rb, cb] = rc(x.b);
      P.enCours = { k: 'tween', t: 0, d: 0.16, A, B, de: [ca, ra], a: [cb, rb], fini() { return this.t >= 1; } };
      if (x.k === 'echange') son('glisse');
      else son('non');
      if (x.k === 'retour') P.aff.coups = e.coups;
      return;
    }
    if (x.k === 'effet') {
      const [r, c] = rc(x.i);
      P.fx.push(Object.assign({ t: 0, d: x.type === 'balle' || x.type === 'toutes' ? 0.6 : 0.5, r, c }, x));
      if (x.type === 'rayon' || x.type === 'croix') { P.secousse = Math.max(P.secousse || 0, 7); son('rayon'); }
      else if (x.type === 'noeud' || x.type === 'noeuds') { P.secousse = Math.max(P.secousse || 0, 10); son('noeud'); coeurs(c, r, 12); }
      else { P.secousse = Math.max(P.secousse || 0, 12); P.flash = 0.6; son('balle'); }
      P.attente = x.type === 'balle' || x.type === 'toutes' ? 0.3 : 0.1;
      return;
    }
    if (x.k === 'efface') {
      let sx = 0, sy = 0, n = 0;
      for (const c of x.cases) {
        const v = P.vis[c.i], [r, cc] = rc(c.i);
        if (v) { P.dying.push({ v, x: cc, y: r, t: 0 }); P.vis[c.i] = null; }
        eclat(cc, r, c);
        sx += cc; sy += r; n++;
        if (c.t >= 0 && c.sp !== 4) {
          P.aff.calins[c.t]++;
          const k = estJour() ? 0 : P.niv.obj.findIndex(o => o.k === 'calins' && o.t === c.t);
          if (k >= 0) { const [cx, cy] = cellXY(cc, r), [tx, ty] = posObjectif(k); P.parts.push({ k: 'vers', x0: cx, y0: cy, x1: tx, y1: ty, l: -Math.random() * 0.15, d: 0.6, col: '#ff6b8a' }); }
        }
      }
      P.aff.score += x.points;
      if (n && x.points) { const [cx, cy] = cellXY(sx / n, sy / n); P.textes.push({ x: cx, y: cy, s: '+' + x.points, t: 0 }); }
      if (x.combo >= 1 && !P.fete) { P.banniere = { s: MOTS[Math.min(x.combo - 1, 3)], t: 0 }; son('cascade', x.combo); }
      son('pop', x.combo);
      P.attente = 0.2;
      return;
    }
    if (x.k === 'boue') {
      P.vb[x.i] = x.n; P.aff.boue--; son('boue');
      const [r, c] = rc(x.i), [cx, cy] = cellXY(c, r);
      for (let k = 0; k < 6; k++) { const a = Math.random() * 7, v = 60 + Math.random() * 120; P.parts.push({ k: 'goutte', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 500, l: 0, d: 0.5, s: 3 + Math.random() * 3, col: '#8b5a2b' }); }
      return;
    }
    if (x.k === 'niche') {
      P.vn[x.i] = x.n;
      const [r, c] = rc(x.i), [cx, cy] = cellXY(c, r);
      for (let k = 0; k < (x.n ? 5 : 14); k++) { const a = Math.random() * 7, v = 60 + Math.random() * 140; P.parts.push({ k: 'bois', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 100, g: 600, l: 0, d: 0.7, s: 3 + Math.random() * 4, col: Math.random() < 0.5 ? '#c98a4a' : '#d94b3a', rot: Math.random() * 6 }); }
      P.secousse = Math.max(P.secousse || 0, 4);
      son('niche', x.n);
      return;
    }
    if (x.k === 'cree') {
      const v = vt({ t: x.t, sp: x.sp }, x.i); v.grow = 0;
      P.vis[x.i] = v;
      P.fx.push({ k: 'effet', type: 'anneau', t: 0, d: 0.35, r: rc(x.i)[0], c: rc(x.i)[1] });
      son('bonus');
      P.attente = 0.1;
      return;
    }
    if (x.k === 'chute') {
      const ancien = P.vis.slice(), nv = P.vis.slice();
      for (const [de] of x.mv) nv[de] = null;
      for (const [de, a] of x.mv) { nv[a] = ancien[de]; const v = nv[a]; v.x0 = v.x; v.y0 = v.y; }
      for (const n of x.neufs) {
        const [r, c] = rc(n.i);
        let haut = 0; while (haut < N && !P.e.ok[haut * N + c]) haut++;
        const v = vt(n, n.i); v.y = v.y0 = haut - 1 - n.k - 0.2; v.x = v.x0 = c;
        nv[n.i] = v;
      }
      P.vis = nv;
      P.enCours = { k: 'chute', fini: () => toutPose() };
      return;
    }
    if (x.k === 'sauve') {
      const v = P.vis[x.i], [r, c] = rc(x.i);
      if (v) { P.dying.push({ v, x: c, y: r, t: 0, saut: 1 }); P.vis[x.i] = null; }
      P.aff.chiots++;
      const [cx, cy] = cellXY(c, r);
      P.textes.push({ x: cx, y: cy - 20, s: 'Sauvé !', t: 0 });
      coeurs(c, r, 8);
      son('sauve');
      P.attente = 0.3;
      return;
    }
    if (x.k === 'adopte') {
      P.banniere = { s: DOG_RACES[x.t].nom + ' a une famille !', t: 0, long: 1 };
      P.adoptes.push(x.t);
      const k = P.niv.obj.findIndex(o => o.k === 'calins' && o.t === x.t);
      if (k >= 0) { const [tx, ty] = posObjectif(k); for (let j = 0; j < 14; j++) { const a = Math.random() * 7, v = 60 + Math.random() * 120; P.parts.push({ k: 'coeur', x: tx, y: ty, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 200, l: 0, d: 0.9, s: 9, col: '#ff6b8a' }); } }
      son('adopte');
      P.attente = 0.35;
      return;
    }
    if (x.k === 'melange') {
      son('melange');
      P.vis = x.g.map((p, i) => { if (!p) return null; const v = vt(p, i); v.grow = 0; return v; });
      P.banniere = { s: 'On mélange !', t: 0 };
      P.attente = 0.5;
      return;
    }
    if (x.k === 'bonus') {
      if (!P.fete) { P.fete = true; P.banniere = { s: 'C\'est la fête !', t: 0 }; son('fete'); }
      const v = P.vis[x.i];
      if (v) { v.sp = x.sp; v.grow = 0.4; }
      P.aff.coups = Math.max(0, P.aff.coups - (x.sp === 1 || x.sp === 2 ? 1 : 0));
      P.attente = 0.16;
      return;
    }
    if (x.k === 'fin') { P.attente = 0.7; P.finale = x; }
  }
  function avancer(dt) {
    if (!P) return;
    if (P.attente > 0) { P.attente -= dt; if (P.attente > 0) return; P.attente = 0; }
    if (P.enCours) { if (!P.enCours.fini()) return; P.enCours = null; }
    let garde = 0;
    while (P.file.length && !P.enCours && P.attente <= 0 && garde++ < 50) {
      const x = P.file.shift();
      if (x.k === 'echange' && !P.file.some(y => y.k === 'retour')) P.aff.coups--;
      traiter(x);
    }
    if (!P.file.length && !P.enCours && P.attente <= 0) {
      // fin d'un coup : la grille visible doit être la vraie grille (sinon on la recopie)
      const e = P.e;
      for (let i = 0; i < 64; i++) {
        const p = e.g[i], v = P.vis[i];
        if (!p !== !v || (p && (p.t !== v.t || p.sp !== v.sp || (p.ch || 0) !== v.ch || (p.gm || 0) !== v.gm))) { P.vis[i] = p ? vt(p, i) : null; P.desync = (P.desync || 0) + 1; }
      }
      P.vb = e.boue.slice(); P.vn = e.niche.slice(); P.aff.coups = e.coups; P.aff.score = e.score;
      if (P.classe) { const d = lire('daily', {}); d[P.jour] = dogCalinsTotal(e); ecrire('daily', d); }
      if (P.finale && !P.fini) { P.fini = true; finPartie(); }
    }
  }
  function finJour() {
    const e = P.e, n = dogCalinsTotal(e), classe = P.classe;
    son('gagne');
    let rec = 0;
    for (const v of Object.values(lire('daily', {}))) rec = Math.max(rec, v);
    $('fin').innerHTML = `<p class="sur">Journée du jour</p><h2>${n} câlins !</h2><div class="objectifs">${P.niv.races.map(t => `<div class="obj"><img src="${imgChien(t, 46, 2)}" alt="">${e.calins[t]}</div>`).join('')}</div>`
      + `<p>${e.score.toLocaleString('fr-FR')} points</p>`
      + (classe ? `<p class="aide" id="fRang">Câlins envoyés au classement de la famille.</p>` : `<p class="petit">Partie pour le plaisir, pas classée.</p>`)
      + (rec ? `<p class="petit">Ton meilleur jour : ${rec} câlins</p>` : '')
      + `<div class="boutons"><button class="gros" id="bFinTitre">Au refuge</button><button id="bRejouer">Rejouer pour le plaisir</button></div>`;
    montrer('eFin');
    ecran = 'fin';
    $('bFinTitre').onclick = titre;
    $('bRejouer').onclick = () => lancerJour(false);
    if (classe) envoyer('daily:' + P.jour, n).then(r => { if (r && $('fRang')) $('fRang').textContent = 'Classement du jour : ' + LudoScores.rankText(r); });
  }
  function finPartie() {
    if (estJour()) { finJour(); return; }
    const e = P.e, niv = P.niv, gagne = e.fin === 'gagne', et = dogEtoiles(niv, e);
    const nouveaux = [];
    if (gagne) {
      const avant = totalEtoiles();
      prog.etoiles[niv.id] = Math.max(prog.etoiles[niv.id] || 0, et);
      prog.scores[niv.id] = Math.max(prog.scores[niv.id] || 0, e.score);
      for (const o of niv.obj) if (o.k === 'calins' && !prog.album.includes(o.t)) { prog.album.push(o.t); nouveaux.push(o.t); }
      sauver();
      if (totalEtoiles() > avant) envoyer('etoiles', totalEtoiles()).then(r => { if (r && $('fRang')) $('fRang').textContent = 'Étoiles : ' + LudoScores.rankText(r); });
      son('gagne');
    } else son('perdu');
    const suivant = niv.id < DOG_NIVEAUX.length;
    $('fin').innerHTML = gagne
      ? `<h2>Bravo !</h2><div class="etoiles">${[1, 2, 3].map(s => ETOILE(s <= et)).join('')}</div><p>${e.score.toLocaleString('fr-FR')} points</p><p class="petit" id="fRang"></p>`
        + (nouveaux.length ? `<div class="objectifs">${nouveaux.map(t => `<div class="obj fait"><img src="${imgChien(t, 58, 2)}" alt="">${DOG_RACES[t].nom}</div>`).join('')}</div><p class="aide">${nouveaux.length > 1 ? 'Ils rejoignent' : 'Rejoint'} l'album des familles !</p>` : '')
        + `<div class="boutons">${suivant ? '<button class="gros" id="bSuivant">Niveau suivant</button>' : ''}<button id="bRejouer">Rejouer</button><button id="bFinCarte">La carte</button></div>`
      : `<h2>Plus de coups !</h2><p>Encore un essai ?</p><div class="objectifs">${htmlObjectifs(niv, dogAvancement(e))}</div><div class="boutons"><button class="gros" id="bRejouer">Réessayer</button><button id="bFinCarte">La carte</button></div>`;
    montrer('eFin');
    ecran = 'fin';
    if ($('bSuivant')) $('bSuivant').onclick = () => intro(niv.id + 1);
    $('bRejouer').onclick = () => lancer(niv.id);
    $('bFinCarte').onclick = carte;
  }

  /* ---------- effets ---------- */
  const cellXY = (c, r) => [BX + (c + 0.5) * CELL, BY + (r + 0.5) * CELL];
  function eclat(c, r, p) {
    const [cx, cy] = cellXY(c, r), col = p.gm ? '#e8413a' : p.t >= 0 ? (P.couleurs[p.t] || '#ffd59e') : '#ffffff';
    for (let i = 0; i < 5; i++) { const a = Math.random() * 7, v = 70 + Math.random() * 140; P.parts.push({ k: 'goutte', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, g: 520, l: 0, d: 0.55, s: 3 + Math.random() * 3, col: sh(col, -0.15) }); }
    const a = Math.random() * 7;
    P.parts.push({ k: 'coeur', x: cx, y: cy, vx: Math.cos(a) * 40, vy: -70, g: -20, l: 0, d: 0.7, s: 8, col: '#ff6b8a' });
  }
  function coeurs(c, r, n) {
    const [cx, cy] = cellXY(c, r);
    for (let i = 0; i < n; i++) { const a = Math.random() * 7, v = 90 + Math.random() * 120; P.parts.push({ k: 'coeur', x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, g: 240, l: 0, d: 0.8, s: 9, col: '#ff6b8a' }); }
  }
  function sh(h, a) {
    if (h[0] !== '#') return h;
    const n = parseInt(h.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255], f = a > 0 ? x => x + (255 - x) * a : x => x * (1 + a);
    return 'rgb(' + c.map(x => f(x) | 0).join(',') + ')';
  }

  /* ---------- mise à jour ---------- */
  function maj(dt) {
    T += dt;
    if (!P) return;
    P.secousse = Math.max(0, (P.secousse || 0) - dt * 40); P.flash = Math.max(0, (P.flash || 0) - dt * 2.5);
    const en = P.enCours;
    if (en && en.k === 'tween') {
      en.t = Math.min(1, en.t + dt / en.d);
      const q = en.t < 0.5 ? 2 * en.t * en.t : 1 - Math.pow(-2 * en.t + 2, 2) / 2;
      if (en.A) { en.A.x = en.de[0] + (en.a[0] - en.de[0]) * q; en.A.y = en.de[1] + (en.a[1] - en.de[1]) * q; }
      if (en.B) { en.B.x = en.a[0] + (en.de[0] - en.a[0]) * q; en.B.y = en.a[1] + (en.de[1] - en.a[1]) * q; }
    }
    P.vis.forEach((v, i) => {
      if (!v) return;
      if (v.grow < 1) v.grow = Math.min(1, v.grow + dt * 3.5);
      if (v.sq > 0) v.sq = Math.max(0, v.sq - dt * 3);
      if (en && en.k === 'tween') return;
      const r = Math.floor(i / N), c = i % N;
      if (v.y < r) {
        v.vy += 60 * dt; v.y += v.vy * dt;
        const k = v.y0 < r ? Math.min(1, Math.max(0, (v.y - v.y0) / (r - v.y0))) : 1;
        v.x = v.x0 + (c - v.x0) * k;
        if (v.y >= r) { v.y = r; v.x = c; if (v.vy > 3) v.sq = 1; v.vy = 0; }
      } else if (v.y > r || v.x !== c) { v.y = r; v.x = c; v.vy = 0; }
    });
    avancer(dt);
    for (const d of P.dying) d.t += dt / (d.saut ? 0.6 : 0.28);
    P.dying = P.dying.filter(d => d.t < 1);
    for (const p of P.parts) { p.l += dt; if (p.l < 0 || p.k === 'vers') continue; p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; }
    P.parts = P.parts.filter(p => p.l < p.d);
    for (const f of P.fx) f.t += dt;
    P.fx = P.fx.filter(f => f.t < f.d);
    for (const t of P.textes) t.t += dt;
    P.textes = P.textes.filter(t => t.t < 0.9);
    if (P.banniere) { P.banniere.t += dt; if (P.banniere.t > (P.banniere.long ? 1.8 : 1.2)) P.banniere = null; }
    if (ecran === 'partie' && !occupe() && !P.e.fin) {
      P.repos += dt;
      const delai = P.niv.id <= 3 ? 2 : 5;
      if (P.repos > delai && !P.indice) P.indice = coupConseille();
    }
  }
  // l'indice : au tutoriel, le coup qui fabrique le bonus à apprendre
  function coupConseille() {
    const l = dogCoupsPossibles(P.e);
    if (!l.length) return null;
    const veut = P.niv.tuto === 'bandana' ? [1, 2] : P.niv.tuto === 'balle' ? [4] : null;
    if (veut) for (const m of l) { const c = dogCopie(P.e), r = dogCoup(c, m[0], m[1]); if (r && r.ev.some(x => x.k === 'cree' && veut.includes(x.sp))) return m; }
    return l[Math.floor(Math.random() * l.length)];
  }

  /* ---------- dessin ---------- */
  let sprites = {};
  function sprite(v, humeur) {
    const cle = v.gm ? 'gm' : v.ch ? 'ch' + humeur : v.sp === 4 ? 'b' : v.t + '_' + v.sp + '_' + humeur;
    if (sprites[cle]) return sprites[cle];
    const L = CELL * 1.3, px = Math.ceil(L * K), c = document.createElement('canvas');
    c.width = c.height = px;
    const g = c.getContext('2d');
    g.scale(px / L, px / L); g.translate(L / 2, L / 2);
    DogDessin.piece(g, v, CELL * 0.46, humeur, P.couleurs[v.t]);
    c.addEventListener('contextrestored', () => { sprites = {}; });
    return (sprites[cle] = c);
  }
  function dessinerPiece(g, v, cx, cy, sx, sy, rot, alpha, humeur) {
    const s = sprite(v, humeur), L = CELL * 1.3;
    g.save(); g.translate(cx, cy); if (rot) g.rotate(rot); g.scale(sx, sy); if (alpha !== undefined) g.globalAlpha = alpha;
    g.drawImage(s, -L / 2, -L / 2, L, L); g.restore();
  }
  function patte(g, x, y, s, col, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s / 10, s / 10); g.fillStyle = col;
    g.beginPath(); g.ellipse(0, 3, 5, 4, 0, 0, 7); g.fill();
    for (const [a, b] of [[-6, -3], [-2, -7], [2, -7], [6, -3]]) { g.beginPath(); g.ellipse(a, b, 2, 2.6, 0, 0, 7); g.fill(); }
    g.restore();
  }
  function coeur(g, x, y, s, col) {
    g.save(); g.translate(x, y); g.scale(s / 10, s / 10); g.beginPath(); g.moveTo(0, 4); g.bezierCurveTo(-10, -3, -6, -11, 0, -6); g.bezierCurveTo(6, -11, 10, -3, 0, 4); g.fillStyle = col; g.fill(); g.restore();
  }
  function txt(g, s, x, y, taille, o) {
    o = o || {};
    g.font = (o.poids || 800) + ' ' + taille + 'px "Baloo 2", system-ui, sans-serif';
    g.textAlign = o.align || 'center'; g.textBaseline = 'alphabetic';
    if (o.max) { const w = g.measureText(s).width; if (w > o.max) { g.save(); g.translate(x, y); g.scale(o.max / w, o.max / w); txt(g, s, 0, 0, taille, Object.assign({}, o, { max: 0 })); g.restore(); return; } }
    if (o.ombre) { g.fillStyle = o.ombre; g.fillText(s, x + 1.5, y + 2); }
    if (o.contour) { g.lineJoin = 'round'; g.lineWidth = o.ep || 5; g.strokeStyle = o.contour; g.strokeText(s, x, y); }
    g.fillStyle = o.coul || '#7a3e1d'; g.fillText(s, x, y);
  }
  function fond(g) {
    let gr = g.createLinearGradient(0, 0, 0, H - 90); gr.addColorStop(0, '#ffe9d2'); gr.addColorStop(1, '#ffd5bb');
    g.fillStyle = gr; g.fillRect(-W, -H, W * 3, H * 3);
    for (let y = 20, i = 0; y < H - 90; y += 46, i++) for (let x = (i % 2) * 24; x < W + 24; x += 48) patte(g, x, y, 9, 'rgba(160,98,58,.08)', (i % 3 - 1) * 0.4);
    const sol = H - 92;
    g.fillStyle = '#fff3e6'; g.fillRect(-W, sol - 4, W * 3, 8);
    g.fillStyle = '#d99c61'; g.fillRect(-W, sol + 4, W * 3, H);
    g.strokeStyle = '#bf8149'; g.lineWidth = 2;
    for (let y = sol + 4, i = 0; y < H + 30; y += 23, i++) { g.beginPath(); g.moveTo(-W, y); g.lineTo(W * 2, y); g.stroke(); for (let x = (i % 2) * 60 + 30; x < W; x += 120) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 23); g.stroke(); } }
  }
  function plateau(g) {
    const e = P.e;
    // la couverture : une case arrondie par case du niveau, avec une bordure plus foncée
    g.fillStyle = 'rgba(120,60,20,.16)';
    for (let i = 0; i < 64; i++) if (e.ok[i]) { const [r, c] = rc(i); rondRect(g, BX + c * CELL - 3, BY + r * CELL + 1, CELL + 6, CELL + 6, 12); g.fill(); }
    g.fillStyle = '#f3c9a3';
    for (let i = 0; i < 64; i++) if (e.ok[i]) { const [r, c] = rc(i); rondRect(g, BX + c * CELL - 3, BY + r * CELL - 3, CELL + 6, CELL + 6, 12); g.fill(); }
    for (let i = 0; i < 64; i++) if (e.ok[i]) {
      const [r, c] = rc(i);
      g.fillStyle = (r + c) % 2 ? '#fde8d2' : '#fff6ea';
      g.fillRect(BX + c * CELL, BY + r * CELL, CELL, CELL);
    }
    for (let i = 0; i < 64; i++) {
      if (!e.ok[i]) continue;
      const [r, c] = rc(i), [cx, cy] = cellXY(c, r);
      if (P.vb[i]) { g.save(); g.translate(cx, cy); DogDessin.boue(g, CELL, P.vb[i], i); g.restore(); }
      if (P.vn[i]) { g.save(); g.translate(cx, cy + 3); DogDessin.niche(g, CELL, P.vn[i]); g.restore(); }
    }
    if (P.niv.obj.some(o => o.k === 'chiots')) for (const s of e.sorties) {
      const [r, c] = rc(s), [cx, cy] = cellXY(c, r);
      g.save(); g.translate(cx, cy + CELL * 0.5 + 2); DogDessin.panier(g, CELL * 0.8); g.restore();
    }
  }
  function rondRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function pieces(g) {
    g.save(); g.beginPath(); g.rect(BX - 10, BY - 3, L8 + 20, L8 + 14); g.clip();
    const ind = P.indice, estInd = i => ind && (ind[0] === i || ind[1] === i);
    P.vis.forEach((v, i) => {
      if (!v) return;
      let [cx, cy] = cellXY(v.x, v.y);
      const s = easeBack(v.grow);
      let sx = s, sy = s, rot = Math.sin(T * 1.6 + v.ph) * 0.06, h = (T + v.ph) % 4.3 < 0.14 ? 1 : 0;
      if (v.sq > 0) { const w = Math.sin(v.sq * Math.PI * 2) * v.sq * 0.2; sx *= 1 + w; sy *= 1 - w; cy += CELL * 0.4 * w; }
      if (estInd(i) && T % 1.4 < 0.6) { rot += Math.sin(T * 26) * 0.22; h = 2; }
      if (P.choisi === i) { const p = 1.1 + Math.sin(T * 10) * 0.05; sx *= p; sy *= p; h = 2; }
      if (v.vy > 4) h = 2;
      if (v.sp === 4) rot += T * 1.5;
      if (v.gm || v.ls) rot = 0;
      dessinerPiece(g, v, cx, cy, sx, sy, rot, undefined, h);
      if (!v.gm && !v.ch && P.vb[i] && v.y === Math.floor(i / N)) { g.save(); g.translate(cx, cy); DogDessin.salissures(g, CELL * 0.46, P.vb[i], i); g.restore(); }
      if (v.ls) { g.save(); g.translate(cx, cy); DogDessin.laisse(g, CELL * 0.46); g.restore(); }
    });
    g.restore();
    for (const d of P.dying) {
      const [cx, cy] = cellXY(d.x, d.y), t = d.t;
      if (d.saut) { const k = 1 - t; dessinerPiece(g, d.v, cx, cy + 20 * t - Math.sin(t * Math.PI) * 50, k + 0.2, k + 0.2, 0, 1 - t * t, 2); continue; }
      const s = t < 0.3 ? 1 + t * 0.8 : Math.max(0, (1 - t) / 0.7 * 1.24);
      dessinerPiece(g, d.v, cx, cy - t * 16, s, s, 0, 1 - t * t, 2);
    }
    // la main du tutoriel
    if (ind && P.niv.id <= 3) {
      const [ra, ca] = rc(ind[0]), [rb, cb] = rc(ind[1]), k = (T % 1.4) / 1.4, q = k < 0.25 ? 0 : k > 0.75 ? 1 : (k - 0.25) * 2;
      const [x0, y0] = cellXY(ca, ra), [x1, y1] = cellXY(cb, rb), x = x0 + (x1 - x0) * q + 10, y = y0 + (y1 - y0) * q + 14;
      g.save(); g.globalAlpha = k > 0.9 ? (1 - k) * 10 : 1;
      g.fillStyle = 'rgba(90,40,10,.25)'; g.beginPath(); g.ellipse(x + 3, y + 5, 13, 15, -0.3, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.strokeStyle = '#7a3e1d'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y, 12, 14, -0.3, 0, 7); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(x - 5, y - 15, 4.5, 9, -0.2, 0, 7); g.fill(); g.stroke();
      g.restore();
    }
  }
  const easeBack = t => { const u = t - 1; return 1 + 2.7 * u * u * u + 1.7 * u * u; };
  function effets(g) {
    for (const f of P.fx) {
      const t = Math.min(1, f.t / f.d), u = 1 - t, [cx, cy] = cellXY(f.c, f.r);
      if (f.type === 'rayon' || f.type === 'croix') {
        const lignes = f.type === 'croix' ? [-1, 0, 1] : [0];
        for (const d of lignes) for (const hz of f.type === 'croix' ? [1, 0] : [f.h]) {
          const y = cy + d * CELL, x = cx + d * CELL, hh = CELL * (0.9 * u + 0.1);
          g.globalAlpha = u * 0.6; g.fillStyle = '#ffffff';
          if (hz) g.fillRect(BX - 8, y - hh / 2, L8 + 16, hh); else g.fillRect(x - hh / 2, BY - 8, hh, L8 + 16);
          g.globalAlpha = Math.min(1, u * 1.5);
          for (let i = 0; i < N; i++) { if (i / N > t * 1.6) continue; const px = hz ? BX + (i + 0.5) * CELL : x + (i % 2 ? 6 : -6), py = hz ? y + (i % 2 ? 6 : -6) : BY + (i + 0.5) * CELL; patte(g, px, py, 10, '#a0623a', hz ? Math.PI / 2 : Math.PI); }
        }
      } else if (f.type === 'noeud' || f.type === 'noeuds' || f.type === 'anneau' || f.type === 'toutes') {
        const R = CELL * (0.4 + t * (f.type === 'anneau' ? 0.8 : f.type === 'noeud' ? 2.2 : 4));
        g.globalAlpha = u; g.strokeStyle = f.type === 'anneau' ? '#ffffff' : '#ff8cc0'; g.lineWidth = (f.type === 'anneau' ? 5 : 12) * u + 1;
        g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
      } else if (f.type === 'balle') {
        const k = Math.min(1, t * 1.8);
        for (const j of f.cibles) {
          const [r2, c2] = rc(j), [x2, y2] = cellXY(c2, r2);
          for (let i = 1; i <= 6; i++) { const q = i / 6; if (q > k) break; g.globalAlpha = 1; coeur(g, cx + (x2 - cx) * q, cy + (y2 - cy) * q - Math.sin(q * Math.PI) * 20, 7 * u + 3, '#ff6b8a'); }
        }
      }
      g.globalAlpha = 1;
    }
  }
  function particules(g) {
    for (const p of P.parts) {
      if (p.l < 0) continue;
      const u = 1 - p.l / p.d;
      if (p.k === 'goutte') { g.fillStyle = p.col; g.globalAlpha = Math.min(1, u * 1.6); g.beginPath(); g.arc(p.x, p.y, p.s * Math.min(1, u * 1.3) + 0.5, 0, 7); g.fill(); }
      else if (p.k === 'coeur') { g.globalAlpha = Math.min(1, u * 2); coeur(g, p.x, p.y, p.s, p.col); }
      else if (p.k === 'bois') { g.globalAlpha = Math.min(1, u * 2); g.save(); g.translate(p.x, p.y); g.rotate(p.rot + p.l * 8); g.fillStyle = p.col; g.fillRect(-p.s, -p.s * 0.35, p.s * 2, p.s * 0.7); g.restore(); }
      else if (p.k === 'vers') {
        const q = Math.min(1, p.l / p.d), e2 = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2;
        g.globalAlpha = 1; coeur(g, p.x0 + (p.x1 - p.x0) * e2, p.y0 + (p.y1 - p.y0) * e2 - Math.sin(e2 * Math.PI) * 50, 9, p.col);
      }
    }
    g.globalAlpha = 1;
    for (const t of P.textes) {
      const k = t.t / 0.9, y = t.y - k * 40, s = k < 0.15 ? 0.6 + k / 0.15 * 0.6 : 1.2 - Math.min(0.2, (k - 0.15) * 2);
      g.save(); g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1; g.translate(t.x, y); g.scale(s, s);
      txt(g, t.s, 0, 0, 20, { coul: '#fff', contour: '#ff4f7b', ep: 5 }); g.restore();
    }
    if (P.banniere) {
      const b = P.banniere, t = b.t, fin = b.long ? 1.8 : 1.2, cy = BY + L8 / 2;
      const s = t < 0.18 ? t / 0.18 * 1.2 : 1.2 - Math.min(0.2, (t - 0.18) * 2.5), a = t > fin - 0.3 ? Math.max(0, (fin - t) / 0.3) : 1;
      g.save(); g.globalAlpha = a; g.translate(180, cy); g.scale(s, s); g.rotate(-0.06 + Math.sin(T * 6) * 0.03);
      txt(g, b.s, 0, 12, 38, { coul: '#fff6ea', contour: '#e8784f', ep: 9, max: 300 }); g.restore();
    }
  }
  // objectifs en haut de l'écran
  function posObjectif(k) {
    const n = Math.max(1, P.niv.obj.length), w = 76;
    return [180 - (n - 1) * w / 2 + k * w, 104];
  }
  function hud(g) {
    const niv = P.niv, a = P.aff;
    // bouton pause
    g.beginPath(); g.arc(30, 34, 20, 0, 7); g.fillStyle = '#fff6ea'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#e8784f'; g.stroke();
    g.fillStyle = '#d4572e'; g.fillRect(23, 25, 5, 18); g.fillRect(32, 25, 5, 18);
    if (estJour()) { hudJour(g); return; }
    txt(g, 'Niveau ' + niv.id, 60, 32, 19, { align: 'left', coul: '#7a3e1d' });
    // barre des points avec les seuils des étoiles
    const bx = 60, bw = 196, max = niv.etoiles[1] * 1.12, f = Math.min(1, a.score / max);
    g.fillStyle = '#f3d9c9'; rondRect(g, bx, 42, bw, 10, 5); g.fill();
    if (f > 0) { const gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#ff6b8a'); gr.addColorStop(1, '#ffb84d'); g.fillStyle = gr; rondRect(g, bx, 42, Math.max(10, bw * f), 10, 5); g.fill(); }
    niv.etoiles.forEach((s, k) => { const x = bx + bw * s / max, on = a.score >= s; etoileC(g, x, 47, 8, on); if (k === 1) etoileC(g, x + 13, 47, 8, on); });
    txt(g, a.score.toLocaleString('fr-FR'), bx, 70, 14, { align: 'left', poids: 700, coul: '#a0623a' });
    coupsHud(g);
    objectifsHud(g);
  }
  function coupsHud(g) {
    const a = P.aff;
    g.beginPath(); g.arc(318, 40, 30, 0, 7); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 4; g.strokeStyle = a.coups <= 5 ? '#ff4f7b' : '#e8784f'; g.stroke();
    txt(g, String(Math.max(0, a.coups)), 318, 50, 28, { coul: a.coups <= 5 ? '#e8264f' : '#d4572e' });
    txt(g, 'coups', 318, 64, 11, { poids: 700, coul: '#a0623a' });
  }
  function hudJour(g) {
    const a = P.aff, n = a.calins.reduce((x, y) => x + y, 0);
    txt(g, 'Journée du jour', 60, 32, 19, { align: 'left', coul: '#7a3e1d' });
    txt(g, a.score.toLocaleString('fr-FR') + ' points' + (P.classe ? '' : ' · pour le plaisir'), 60, 56, 14, { align: 'left', poids: 700, coul: '#a0623a' });
    coupsHud(g);
    // le compteur de câlins (les cœurs volent vers lui)
    const [x, y] = posObjectif(0), b = 1 + 0.06 * Math.sin(T * 5);
    g.save(); g.translate(x - 30, y + 2); g.scale(b, b);
    g.beginPath(); g.moveTo(0, 12); g.bezierCurveTo(-24, -4, -12, -22, 0, -10); g.bezierCurveTo(12, -22, 24, -4, 0, 12);
    g.fillStyle = '#ff6b8a'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); g.restore();
    txt(g, String(n), x + 4, y + 14, 34, { align: 'left', coul: '#d4572e' });
    txt(g, 'câlins', x - 30, y + 36, 13, { poids: 700, coul: '#a0623a' });
    const sol = H - 92;
    txt(g, 'Le plus de câlins en ' + P.niv.coups + ' coups !', 180, sol + 40, 16, { coul: '#fff6ea', ombre: 'rgba(90,40,10,.45)', poids: 700 });
    for (let i = 0; i < 5; i++) patte(g, 40 + i * 70 + ((T * 30) % 70), sol + 70 - (i % 2) * 6, 8, 'rgba(120,60,20,.22)', Math.PI / 2);
  }
  function objectifsHud(g) {
    const niv = P.niv, a = P.aff;
    niv.obj.forEach((o, k) => {
      const [x, y] = posObjectif(k);
      g.fillStyle = 'rgba(255,255,255,.7)'; rondRect(g, x - 34, y - 28, 68, 64, 16); g.fill();
      let fait, texte;
      g.save(); g.translate(x, y - 6);
      if (o.k === 'calins') { fait = a.calins[o.t] >= o.n; DogDessin.carte(g, o.t, 19, fait ? 2 : 0); texte = fait ? '' : Math.min(a.calins[o.t], o.n) + '/' + o.n; }
      else if (o.k === 'boue') { fait = a.boue <= 0; DogDessin.boue(g, 34, fait ? 0 : 2, 4); if (fait) DogDessin.carte(g, P.niv.races[0], 15, 2); texte = fait ? '' : String(a.boue); }
      else { fait = a.chiots >= o.n; g.scale(0.42, 0.42); DogDessin.chiot(g, 44, 2); texte = fait ? '' : a.chiots + '/' + o.n; }
      g.restore();
      if (fait) { g.beginPath(); g.arc(x + 16, y + 12, 10, 0, 7); g.fillStyle = '#3ec46d'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + 11, y + 12); g.lineTo(x + 15, y + 16); g.lineTo(x + 21, y + 8); g.stroke(); }
      else txt(g, texte, x, y + 30, 15, { coul: '#7a3e1d' });
    });
    // en bas, sur le plancher
    const sol = H - 92;
    if (niv.tuto && P.e.coupsJoues < 2) txt(g, AIDES[niv.tuto].split('.')[0] + '.', 180, sol + 40, 15, { coul: '#fff6ea', ombre: 'rgba(90,40,10,.45)', max: 330, poids: 700 });
    else txt(g, DOG_CHAPITRES[niv.chap - 1].nom, 180, sol + 40, 16, { coul: '#fff6ea', ombre: 'rgba(90,40,10,.45)', poids: 700 });
    for (let i = 0; i < 5; i++) patte(g, 40 + i * 70 + ((T * 30) % 70), sol + 70 - (i % 2) * 6, 8, 'rgba(120,60,20,.22)', Math.PI / 2);
  }
  function etoileC(g, x, y, R, on) {
    g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + Math.PI / 5 * i, r = i % 2 ? R * 0.47 : R; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath();
    g.fillStyle = on ? '#ffc531' : '#fff'; g.fill(); g.lineWidth = 1.6; g.strokeStyle = on ? '#c98a00' : '#e8b48f'; g.stroke();
  }
  function dessiner() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#ffd5bb'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(K, 0, 0, K, OX, OY);
    fond(ctx);
    if (!P) return;
    ctx.save();
    const sk = P.secousse || 0;
    if (sk > 0 && !calme) ctx.translate((Math.random() - 0.5) * sk, (Math.random() - 0.5) * sk);
    plateau(ctx);
    if (P.choisi !== null && P.choisi !== undefined) { const [r, c] = rc(P.choisi); ctx.strokeStyle = '#ff8a5c'; ctx.lineWidth = 3; rondRect(ctx, BX + c * CELL + 2, BY + r * CELL + 2, CELL - 4, CELL - 4, 10); ctx.stroke(); }
    pieces(ctx);
    effets(ctx);
    ctx.restore();
    hud(ctx);
    particules(ctx);
    if (P.flash > 0 && !calme) { ctx.fillStyle = 'rgba(255,255,255,' + P.flash * 0.45 + ')'; ctx.fillRect(-W, -H, W * 3, H * 3); }
  }
  const calme = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- taille de la toile ---------- */
  function taille() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    if (!r.width || !r.height) return;
    H = Math.round(Math.max(600, Math.min(820, W * r.height / r.width)));
    const s = Math.min(r.width / W, r.height / H);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    K = s * dpr; OX = (cv.width - W * K) / 2; OY = (cv.height - H * K) / 2;
    BY = Math.round(150 + Math.max(0, (H - 92 - 150 - L8) / 2 - 6));
    sprites = {};
  }

  /* ---------- toucher ---------- */
  function point(ev) { const r = cv.getBoundingClientRect(), dpr = cv.width / r.width; return { x: ((ev.clientX - r.left) * dpr - OX) / K, y: ((ev.clientY - r.top) * dpr - OY) / K }; }
  cv.addEventListener('pointerdown', ev => {
    if (!P || ecran !== 'partie') return;
    const p = point(ev);
    if (Math.hypot(p.x - 30, p.y - 34) < 26) { pause(); return; }
    if (occupe() || P.e.fin) return;
    const c = Math.floor((p.x - BX) / CELL), r = Math.floor((p.y - BY) / CELL);
    if (r < 0 || r >= N || c < 0 || c >= N || !P.vis[r * N + c]) { P.choisi = null; return; }
    P.appui = { i: r * N + c, x: p.x, y: p.y };
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* rien */ }
  });
  cv.addEventListener('pointermove', ev => {
    if (!P || !P.appui) return;
    const p = point(ev), dx = p.x - P.appui.x, dy = p.y - P.appui.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < CELL * 0.35) return;
    const a = P.appui.i, [r, c] = rc(a);
    P.appui = null;
    let b;
    if (Math.abs(dx) > Math.abs(dy)) { if (c + Math.sign(dx) < 0 || c + Math.sign(dx) >= N) return; b = a + Math.sign(dx); }
    else { if (r + Math.sign(dy) < 0 || r + Math.sign(dy) >= N) return; b = a + Math.sign(dy) * N; }
    if (jouer(a, b) === false && !occupe()) refus(a);
  });
  cv.addEventListener('pointerup', () => {
    if (!P || !P.appui) return;
    const i = P.appui.i;
    P.appui = null;
    if (P.choisi !== null && P.choisi !== undefined && dogCote(P.choisi, i)) { const a = P.choisi; P.choisi = null; if (jouer(a, i) === false && !occupe()) refus(a); }
    else P.choisi = P.choisi === i ? null : i;
  });
  cv.addEventListener('pointercancel', () => { if (P) P.appui = null; });
  // un chien qu'on ne peut pas bouger (en laisse, gamelle) : il remue la tête
  function refus(i) { const v = P.vis[i]; if (v) v.sq = 1; son('non'); }

  function pause() { if (ecran !== 'partie') return; ecran = 'pause'; $('bRecommencer').hidden = !!P.classe; majSon(); montrer('ePause'); }
  function majSon() { const on = !window.DogSons || DogSons.actif; document.querySelectorAll('.bSon').forEach(b => (b.textContent = on ? '🔊 Son : oui' : '🔇 Son : non')); }
  document.querySelectorAll('.bSon').forEach(b => (b.onclick = () => { if (window.DogSons) { DogSons.actif = !DogSons.actif; son('clic'); } majSon(); }));
  $('bReprendre').onclick = () => { ecran = 'partie'; montrer(); };
  $('bRecommencer').onclick = () => (estJour() ? lancerJour(false) : lancer(P.niv.id));
  $('bPauseCarte').onclick = carte;
  $('bJouer').onclick = () => { const n = prochain(); if (!prog.etoiles[1]) intro(1); else carte(); return n; };
  $('bAlbum').onclick = album;
  $('bJour').onclick = introJour;
  $('bCarteRetour').onclick = titre;
  $('bAlbumRetour').onclick = titre;
  $('bIntroCarte').onclick = carte;
  if (window.ludoArtefact) document.querySelectorAll('.ludo-retour').forEach(e => (e.hidden = true));

  /* ---------- boucle ---------- */
  let dernier = performance.now();
  function boucle(ts) {
    const dt = Math.min(0.033, (ts - dernier) / 1000) * vite;
    dernier = ts;
    try { maj(dt); dessiner(); } catch (err) { console.error(err); }
    requestAnimationFrame(boucle);
  }
  if (window.ResizeObserver) new ResizeObserver(taille).observe(cv); else addEventListener('resize', taille);
  // Android vide parfois les toiles hors écran quand l'appli passe en arrière-plan (les chiens préparés deviennent
  // transparents) : au retour, on les redessine.
  const refaire = () => { sprites = {}; taille(); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refaire(); });
  addEventListener('pageshow', refaire);
  cv.addEventListener('contextrestored', refaire);
  taille();
  titre();
  if (location.hash === '#jour') introJour();
  if (document.fonts && document.fonts.load) document.fonts.load('800 20px "Baloo 2"').then(() => { for (const k in imgs) delete imgs[k]; if (ecran === 'titre') titre(); }).catch(() => {});
  requestAnimationFrame(boucle);

  // pour les tests (outils/fumee.js) : on lance un niveau, on joue un coup, on lit l'état
  window.DoggySaga = {
    lancer, jouer, carte, album, titre, intro, introJour, lancerJour, auj,
    etat: () => P && P.e, partie: () => P, ecran: () => ecran, occupe,
    set vite(v) { vite = v ? 12 : 1; }, get vite() { return vite > 1; },
    progres: prog,
  };
})();

/* global Regles, Scene3D, Circuits, Course, Modeles */
/* Écurie miniature : les écrans (titre, gestion en six onglets, grille de départ, course 3D, résultats, fin de saison).
   Style A de la maquette 8. Partie sauvée dans localStorage « ecurie.partie », records dans « ecurie.record ». */
(function () {
  const R = Regles, app = document.getElementById('app');
  const CLE = 'ecurie.partie', CLE_REC = 'ecurie.record';
  const lire = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let E = lire(CLE, null); if (E && E.v !== 1) E = null;
  const sauver = () => ecrire(CLE, E);
  const nombre = n => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ');
  const argent = n => (n < 0 ? '-' : '') + nombre(Math.abs(n)) + ' $';
  const signe = n => (n > 0 ? '+' : n < 0 ? '-' : '') + nombre(Math.abs(n)) + ' $';
  const initiales = n => n.replace(/[^A-Z ]/g, '').split(' ').filter(Boolean).map(x => x[0]).join('').slice(0, 2);
  const pastille = c => `<i class="pastille" style="background:${c}"></i>`;
  const NOTES = ['VITESSE', 'ACCELERATION', 'ADHERENCE', 'FIABILITE'];
  const TEINTES = ['#f08a24', '#2456c8', '#c8262c', '#1f8a4c', '#f4f4f4', '#18181e', '#e8c43a', '#7a2a9a', '#18b4b0', '#e86aa0'];
  const ONGLETS = [['ecurie', 'ECURIE'], ['garage', 'GARAGE'], ['achat', 'ACHAT'], ['sponsors', 'SPONSORS'], ['semaine', 'SEMAINE'], ['fans', 'FANS']];
  const MODELES = {'cosmo-coupe': 'COSMO COUPE', 'rgsdev-hatchback': 'RG CITY', 'cosmo-mobil': 'AMERICAINE 50S', 'rgsdev-police-sports': 'INTERCEPTOR', 'rgsdev-muscle': 'RG MUSCLE', 'kenney-race-future': 'PROTO X'};
  const nomModele = m => { const v = R.VOITURES.find(x => x.m === m); return v ? v.nom : MODELES[m] || m.toUpperCase(); };
  const categorie = ch => ch <= 150 ? '150 CH' : ch <= 300 ? '300 CH' : ch <= 500 ? '500 CH' : 'ILLIMITEE';

  /* ---------- icônes en pixels (9 × 9, en masque : couleur du texte) ---------- */
  const PIX = {
    ecurie: ['..#####..', '.#######.', '#########', '####...##', '####...##', '#########', '########.', '.######..', '.........'],
    garage: ['......##.', '.....#..#', '......#.#', '.....###.', '....###..', '...###...', '..###....', '.###.....', '.##......'],
    achat: ['.........', '...####..', '..#.#..#.', '.########', '#########', '#########', '.##...##.', '.##...##.', '.........'],
    sponsors: ['....#....', '....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.........'],
    semaine: ['.#.....#.', '#########', '#########', '#.......#', '#.#.#.#.#', '#.......#', '#.#.#.#.#', '#.......#', '#########'],
    fans: ['.##...##.', '####.####', '#########', '#########', '.#######.', '..#####..', '...###...', '....#....', '.........'],
    camera: ['.........', '..###....', '#########', '####.####', '###...###', '####.####', '#########', '.........', '.........'],
    vite: ['.........', '#...#....', '##..##...', '###.###..', '########.', '###.###..', '##..##...', '#...#....', '.........'],
    drapeau: ['#........', '#########', '##.#.#.##', '#.#.#.#.#', '##.#.#.##', '#########', '#........', '#........', '#........'],
    piece: ['..#####..', '.##...##.', '##.###.##', '#.##..#.#', '#.##..#.#', '##.###.##', '.##...##.', '..#####..', '.........'],
    etoile: ['....#....', '...###...', '#########', '.#######.', '..#####..', '..##.##..', '.##...##.', '.#.....#.', '.........'],
    menu: ['.........', '#########', '#########', '.........', '#########', '#########', '.........', '#########', '#########'],
    outil: ['.##...##.', '.##...##.', '.#######.', '..#####..', '...###...', '...###...', '...###...', '...###...', '...###...'],
    lit: ['.........', '#........', '#.##.....', '#.##.####', '#########', '#########', '#.......#', '#.......#', '.........'],
    micro: ['...###...', '..#####..', '..#####..', '..#####..', '#.#####.#', '#..###..#', '.#.....#.', '...###...', '..#####..'],
    ecran: ['#########', '#.......#', '#.#.#.#.#', '#.......#', '#.#####.#', '#.......#', '#########', '...###...', '.#######.'],
    chrono: ['...###...', '....#....', '..#####..', '.#..#..#.', '#...#...#', '#...##..#', '#.......#', '.#.....#.', '..#####..'],
    pilote: ['..#####..', '.#######.', '.#.....#.', '.#######.', '..#####..', '...###...', '.#######.', '#########', '#########'],
    trophee: ['#########', '#.#####.#', '#.#####.#', '.#######.', '..#####..', '...###...', '...###...', '..#####..', '.#######.']};
  const ICONES = {}; for (const [k, L] of Object.entries(PIX)) { let r = ''; L.forEach((l, y) => [...l].forEach((c, x) => { if (c === '#') r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; }));
    ICONES[k] = `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 9' shape-rendering='crispEdges'>${r}</svg>`).replace(/'/g, '%27')}')`; }
  const ic = k => `<i class="ic" style="--m:${ICONES[k]}"></i>`;
  const ICJOUR = ['chrono', 'outil', 'ecran', 'lit', 'micro'];

  /* ---------- boucle d'affichage (une seule) ---------- */
  let actif = null, av = performance.now();
  (function b(m) { const dt = Math.min(.05, Math.max(0, (m - av) / 1000)); av = m; if (actif) try { actif(dt); } catch (e) { console.error(e); actif = null; } requestAnimationFrame(b); })(av);
  let VIT = null; const cvVit = document.createElement('canvas');
  const vitrine = () => VIT || (VIT = Scene3D.vitrine(cvVit));
  let toastT; function toast(t) { const x = app.querySelector('.toast'); if (!x) return; x.textContent = t; x.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => x.classList.remove('on'), 1700); }

  /* ---------- écran titre ---------- */
  function titre() {
    finCourse();
    app.innerHTML = `<div class="titre"><h1>ECURIE<br>MINIATURE<small>GERE TON ECURIE, REGARDE TES PILOTES</small></h1><div class="vitrine" id="vt"></div>
      <div class="boutons">${E ? `<button class="btn grand" data-a="continuer">${ic('drapeau')}CONTINUER</button><div class="doux" style="text-align:center">SAISON ${E.saison} · GP ${E.gp + 1}/${R.GP_SAISON} · ${R.DIVISIONS[E.division].nom}</div>` : ''}
        <button class="btn ${E ? 'second' : 'grand'}" data-a="nouvelle">${ic('pilote')}NOUVELLE PARTIE</button><button class="btn second" data-a="aide">${ic('ecran')}COMMENT JOUER</button>
        <a class="btn second ludo-retour" href="../index.html">LUDOTHEQUE</a></div></div><div class="toast"></div>`;
    app.querySelector('#vt').appendChild(cvVit);
    const x = E && (R.voitureDe(E, E.pilotes[0] && E.pilotes[0].voiture) || E.parc[0]);
    vitrine().montrer([[x ? R.VOITURES[x.v].m : 'cosmo-italia', x ? x.c : R.TEINTE]]);
    actif = dt => VIT.image(dt);
  }
  function aide() {
    app.innerHTML = `<div class="entete"><span>COMMENT JOUER</span><button class="menu" data-a="titre">RETOUR</button></div><div class="corps">
      <div class="bloc"><h3>LE BUT</h3><div class="doux">Tu diriges une petite écurie. Tu ne pilotes pas : tu prépares la semaine, puis tu regardes la course. Une saison compte ${R.GP_SAISON} grands prix ; finis dans les 3 premiers du championnat pour monter de division (300 ch, puis 500 ch, puis illimitée).</div></div>
      <div class="bloc"><h3>LA SEMAINE</h3><div class="doux">Choisis l'activité de chaque jour (essais, atelier, simulateur, repos, médias), puis LANCER LE GRAND PRIX. Après la course : points, primes, sponsors, fans, salaires et entretien.</div></div>
      <div class="bloc"><h3>LES VOITURES</h3><div class="doux">Chaque pilote reçoit une voiture du parc ; les autres restent en réserve et remplacent une voiture cassée. Les pièces améliorent les notes, mais attention : une voiture trop puissante pour la division ne peut pas courir (le turbo ajoute 45 ch).</div></div>
      <div class="bloc"><h3>L'ECURIE GRANDIT</h3><div class="doux">Les points marqués donnent de la réputation : au niveau 2, une troisième place de pilote et de nouveaux sponsors. Les fans viennent avec les bons résultats ; au bout d'un moment, ouvre une boutique de goodies, une convention, un fan club.</div></div>
      <div class="bloc"><h3>LA COURSE</h3><div class="doux">Le bouton CAMERA passe d'une vue à l'autre : derrière tes pilotes, le diorama, la télé. Tu peux accélérer la course ou passer directement au résultat.</div></div></div>`;
    actif = null;
  }

  /* ---------- la gestion ---------- */
  const U = {onglet: 'ecurie', choix: 0, vue: 0, occ: false, ouvert: null};
  const places = () => R.PLACES[E.niveau - 1];
  const notesBarres = L => `<div class="barres">${L.map(([nom, v]) => `<div class="barre"><span>${nom}</span><div class="j">${Array.from({length: 10}, (_, i) => `<i class="${i < v ? 'p' : ''}"></i>`).join('')}</div><em>${v}</em></div>`).join('')}</div>`;
  const etatTxt = x => x.repar ? `<span class="etat">EN REPARATION · ${x.repar} SEM.</span>` : x.etat < 60 ? `<span class="etat">ETAT ${x.etat} %</span>` : `<span class="ok">ETAT ${x.etat} %</span>`;
  const prixVente = x => Math.round(R.VOITURES[x.v].prix * .45 * x.etat / 100 / 100) * 100;
  const pneusOfferts = () => E.signes.some(i => R.SPONSORS[i].cond === 'pneus');
  const prixPiece = q => q.k === 'pneus' && pneusOfferts() ? 0 : q.prix;
  const vues = {
    ecurie() { const pl = places(), libres = pl - E.pilotes.length, reserve = E.parc.filter(x => !R.piloteDe(E, x.id));
      const signes = new Set(E.pilotes.map(p => p.nom));
      return `<div class="bloc"><h3>${ic('pilote')}PILOTES · ${E.pilotes.length}/${pl} PLACES</h3>${E.pilotes.map((p, i) => { const x = R.voitureDe(E, p.voiture), emp = x && R.empechement(E, x);
          return `<div class="carte"><div class="tete" style="background:${p.c}">${initiales(p.nom)}</div><b>${p.nom}</b><small>TAL ${p.n[0]} · CST ${p.n[1]} · AGR ${p.n[2]} · FORME ${p.forme} %</small>
            ${E.pilotes.length > 1 ? `<button class="lib" data-liberer="${i}">LIBERER</button>` : `<small>${p.age} ANS · ${argent(p.salaire)} / SEM.</small>`}
            <button class="vt" data-donner="${i}"><i style="background:${x ? x.c : '#120e1e'}"></i>${x ? R.VOITURES[x.v].nom : 'AUCUNE'}<span style="font-size:1.4cqi;color:${emp ? '#ff8a6a' : '#c9c0e8'}">${U.ouvert === i ? 'FERMER' : emp ? 'INDISPONIBLE' : 'CHANGER'}</span></button></div>
            ${U.ouvert === i ? `<div class="liste-choix">${E.parc.map(v => { const autre = R.piloteDe(E, v.id), moi = v.id === p.voiture, n = R.notes(v), emp2 = R.empechement(E, v);
              const raison = moi ? 'SA VOITURE' : emp2 ? emp2 : autre ? 'PILOTE : ' + autre.nom : '';
              return `<button class="ligne ${moi ? 'on' : raison ? 'non' : ''}" ${raison ? '' : `data-prendre="${v.id}"`}><span>${pastille(v.c)}${R.VOITURES[v.v].nom}</span><em>${raison ? '' : 'PRENDRE'}</em><small>${raison || 'DISPONIBLE'} · VIT ${n[0]} · ACC ${n[1]} · ADH ${n[2]} · FIA ${n[3]}</small></button>`; }).join('')}</div>` : ''}`; }).join('')}
          ${libres > 0 ? `<div class="carte verrou"><div class="tete">?</div><b>PLACE LIBRE</b><small>RECRUTE UN PILOTE CI-DESSOUS</small></div>` : ''}
          ${pl < 4 ? `<div class="carte verrou"><div class="tete">X</div><b>PLACE ${pl + 1}</b><small>NIVEAU ${E.niveau + 1} DE L'ECURIE · REPUTATION ${E.rep}/${R.NIVEAUX[E.niveau]}</small></div>` : ''}</div>
        <div class="bloc"><h3>${ic('achat')}RESERVE · ${reserve.length} VOITURE${reserve.length > 1 ? 'S' : ''}</h3>${reserve.length ? reserve.map(x => `<button class="ligne" data-voir="${E.parc.indexOf(x)}"><span>${pastille(x.c)}${R.VOITURES[x.v].nom}</span><em>VOIR</em><small>${etatTxt(x)} · ${categorie(R.chevaux(x))}</small></button>`).join('') : '<div class="doux">AUCUNE VOITURE DE RESERVE</div>'}
          <div class="doux">SI UNE VOITURE CASSE, LA RESERVE LA REMPLACE AU GP SUIVANT.</div></div>
        <div class="bloc"><h3>${ic('pilote')}PILOTES LIBRES</h3>${R.LIBRES.filter(l => !signes.has(l.nom)).map(l => `<button class="ligne ${libres > 0 ? '' : 'non'}" data-recrue="${R.LIBRES.indexOf(l)}"><span>${l.nom} · ${l.age} ANS</span><em>${argent(l.salaire)}<br><small style="color:#a99fd0">/ SEM.</small></em><small>TAL ${l.n[0]} · CST ${l.n[1]} · AGR ${l.n[2]} · ${l.note} · PRIME ${argent(l.salaire * 2)}</small></button>`).join('')}
          <div class="doux">${libres > 0 ? 'TOUCHE UN PILOTE POUR LE SIGNER (PRIME = 2 SEMAINES DE SALAIRE).' : 'PLUS DE PLACE : IL FAUT MONTER DE NIVEAU (OU LIBERER UN PILOTE).'}</div></div>`; },
    garage() { U.choix = Math.min(U.choix, E.parc.length - 1); const x = E.parc[U.choix], v = R.VOITURES[x.v], n = R.notes(x), p = R.piloteDe(E, x.id), ch = R.chevaux(x), hc = R.horsCategorie(E, x);
      return `<div class="bloc"><div class="nav2"><button class="fl" data-fl="-1">‹</button><div style="text-align:center"><h3>${v.nom}</h3><div class="doux">${U.choix + 1}/${E.parc.length} · ${p ? 'PILOTE : ' + p.nom : 'EN RESERVE'}</div></div><button class="fl" data-fl="1">›</button></div>
        <div class="doux">${categorie(ch)} · ${ch} CH · ${etatTxt(x)}</div>${hc ? `<div class="etat">TROP PUISSANTE POUR LA ${R.DIVISIONS[E.division].nom} : ELLE NE PEUT PAS COURIR</div>` : ''}${notesBarres(NOTES.map((y, i) => [y, n[i]]))}
        <div class="teintes">${TEINTES.map(t => `<button data-teinte="${t}" class="${x.c === t ? 'on' : ''}" style="background:${t}"></button>`).join('')}</div>
        ${x.repar ? `<button class="btn" data-reparer="1">REPARER TOUT DE SUITE ${argent(4000 * x.repar)}</button>` : x.etat < 100 ? `<button class="btn second" data-remettre="1">REMETTRE A NEUF ${argent((100 - x.etat) * 80)}</button>` : ''}
        ${p || E.parc.length <= 1 ? '' : `<button class="btn second" data-vendre="1">VENDRE ${argent(prixVente(x))}</button>`}</div>
        <div class="bloc"><h3>${ic('garage')}PIECES</h3>${R.PIECES.map(q => { const pose = x.pieces[q.k]; return `<button class="ligne ${pose ? 'on' : ''}" data-piece="${q.k}"><span>${q.nom}</span><em>${pose ? (q.k === 'pneus' ? pose + ' GP' : 'POSEE') : prixPiece(q) ? argent(q.prix) : 'OFFERT'}</em><small>${q.d}${pose ? ' · TOUCHE POUR LA REVENDRE' : ''}</small></button>`; }).join('')}</div>`; },
    achat() { const L = U.occ ? E.occasions : R.VOITURES; if (!L.length) { U.occ = false; return vues.achat(); }
      U.vue = Math.min(U.vue, L.length - 1); const o = U.occ ? E.occasions[U.vue] : null, v = U.occ ? R.VOITURES[o.i] : R.VOITURES[U.vue];
      const n = v.n.map((x, i) => Math.max(0, x + (o ? o.u[i] : 0))), prix = o ? o.prix : v.prix, trop = v.ch > R.DIVISIONS[E.division].ch;
      return `<div class="nav2"><button class="onglet2 ${U.occ ? '' : 'choisi'}" data-occ="0">NEUVES</button><button class="onglet2 ${U.occ ? 'choisi' : ''}" data-occ="1">OCCASION (${E.occasions.length})</button></div>
        <div class="bloc"><div class="nav2"><button class="fl" data-fl="-1">‹</button><div style="text-align:center"><h3>${v.nom}</h3><div class="doux">${U.vue + 1}/${L.length} · ${categorie(v.ch)} · ${v.ch} CH${o ? ' · ' + nombre(o.km) + ' KM' : ''}</div></div><button class="fl" data-fl="1">›</button></div>
        ${notesBarres(NOTES.map((x, i) => [x, n[i]]))}<div class="doux">${o ? o.etat + ' · ETAT ' + o.et + ' %' : 'NEUVE'} · ELLE REJOINDRA TON PARC (${E.parc.length} VOITURE${E.parc.length > 1 ? 'S' : ''})</div>
        ${trop ? `<div class="etat">TROP PUISSANTE POUR LA ${R.DIVISIONS[E.division].nom}</div>` : ''}
        <div class="nav2"><b class="gros" style="font-weight:400;font-size:2.6cqi">${argent(prix)}</b><button class="btn" data-acheter="1">${prix > E.argent ? 'TROP CHER' : 'ACHETER'}</button></div></div>
        <div class="doux">LES OCCASIONS CHANGENT CHAQUE SEMAINE. ENTRETIEN : ${argent(R.ENTRETIEN)} PAR VOITURE ET PAR SEMAINE.</div>`; },
    sponsors() { return `<div class="bloc"><h3>${ic('sponsors')}CONTRATS · ${E.signes.length}/2 PLACES</h3>${R.SPONSORS.map((s, i) => { const on = E.signes.includes(i), rompu = E.rompus.includes(i), bloque = s.niv > E.niveau;
        return `<button class="ligne ${on ? 'on' : rompu || bloque || E.signes.length >= 2 ? 'non' : ''}" data-sponsor="${i}"><span>${pastille(s.coul)}${s.nom}</span><em>${on ? 'SIGNE' : bloque ? 'NIV. ' + s.niv : rompu ? 'ROMPU' : '+' + argent(s.gain)}</em><small>${argent(s.gain)} PAR COURSE · ${s.obj}${rompu ? ' · CONTRAT ROMPU CETTE SAISON' : ''}</small></button>`; }).join('')}
        <div class="doux">TOUCHE UN CONTRAT POUR LE SIGNER OU LE RESILIER.</div></div>`; },
    semaine() { const J = ['LUN', 'MAR', 'MER', 'JEU', 'VEN'], tot = {}; E.semaine.forEach(a => tot[a] = (tot[a] || 0) + 1);
      const K = Circuits.get(R.calendrier(E.gp)), cl = R.classement(E);
      return `<div class="bloc"><h3>${ic('semaine')}GP ${E.gp + 1}/${R.GP_SAISON} · ${K.nom}</h3><div class="jours">${E.semaine.map((a, i) => `<button data-jour="${i}"><b>${J[i]}</b>${ic(ICJOUR[a])}${R.ACTIVITES[a].n}</button>`).join('')}</div><div class="doux">TOUCHE UN JOUR POUR CHANGER SON ACTIVITE.</div></div>
        <div class="bloc"><h3>${ic('etoile')}EFFETS</h3>${Object.entries(tot).map(([a, n]) => `<div class="ligne fixe"><span>${R.ACTIVITES[a].n} ×${n}</span><small>${R.ACTIVITES[a].e}</small></div>`).join('')}</div>
        <button class="btn grand" data-gp="1">${ic('drapeau')}LANCER LE GRAND PRIX</button>
        <div class="bloc"><h3>${ic('trophee')}CHAMPIONNAT · ${R.DIVISIONS[E.division].nom}</h3><table>${cl.map((c, i) => `<tr class="${c.joueur ? 'moi' : ''}"><td>${i + 1}</td><td>${c.nom}</td><td>${c.pts} PTS</td></tr>`).join('')}</table>
          <div class="doux">LES 3 PREMIERS MONTENT DE DIVISION EN FIN DE SAISON.</div></div>`; },
    fans() { const rev = R.REVENUS.filter(x => E.revenus[x.k]), parSemaine = rev.filter(x => x.tous === 1).reduce((a, x) => a + Math.round(E.fans * x.par), 0), prochain = R.REVENUS.find(x => E.fans < x.seuil);
      return `<div class="bloc" style="text-align:center"><h3 style="justify-content:center">${ic('fans')}TES FANS</h3><div class="gros">${nombre(E.fans)}</div>
          ${prochain ? `<div class="jauge"><i style="width:${Math.round(E.fans / prochain.seuil * 100)}%"></i><span>${prochain.nom} A ${nombre(prochain.seuil)}</span></div>` : ''}
          <div class="doux">REVENUS DES FANS : <span class="ok">+${argent(parSemaine)} PAR SEMAINE</span></div></div>
        <div class="bloc"><h3>${ic('fans')}CE QUI ATTIRE LES FANS</h3>
          <div class="ligne fixe"><span>VICTOIRE</span><em>+400</em></div><div class="ligne fixe"><span>PODIUM</span><em>+150</em></div><div class="ligne fixe"><span>CHAQUE POINT</span><em>+10</em></div>
          <div class="ligne fixe"><span>DEPASSEMENT</span><em>+10</em></div><div class="ligne fixe"><span>JOUR DE MEDIAS</span><em>+60</em></div><div class="ligne fixe"><span>ABANDON</span><em class="moins">-20</em></div></div>
        <div class="bloc"><h3>${ic('piece')}REVENUS A DEBLOQUER</h3>${R.REVENUS.map(x => { const on = E.revenus[x.k], peut = E.fans >= x.seuil;
          return `<button class="ligne ${on ? 'on' : peut ? '' : 'non'}" data-revenu="${x.k}"><span>${x.nom}</span><em>${on ? '+' + argent(Math.round(E.fans * x.par)) : peut ? argent(x.prix) : nombre(x.seuil) + ' FANS'}</em><small>${x.d} · ${x.par} $ PAR FAN ${x.quand}</small></button>`; }).join('')}</div>`; }};
  function gestion(onglet) {
    finCourse(); if (onglet) U.onglet = onglet;
    app.innerHTML = `<div class="entete"><span class="puce">${ic('etoile')}NIV ${E.niveau}</span><span class="puce">${ic('drapeau')}${E.gp + 1}/${R.GP_SAISON}</span><b class="puce arg"></b><button class="menu" data-a="titre">${ic('menu')}</button></div>
      <div class="vitrine" id="vt"></div><div class="corps"></div><nav>${ONGLETS.map(([k, n]) => `<button data-o="${k}">${ic(k)}${n}</button>`).join('')}</nav><div class="toast"></div>`;
    app.querySelector('#vt').appendChild(cvVit); majGestion(); actif = dt => { if (!app.querySelector('#vt').hidden) VIT.image(dt); };
  }
  function majGestion() {
    const vt = app.querySelector('#vt'), corps = app.querySelector('.corps'); if (!vt) return;
    const a = app.querySelector('.arg'); a.innerHTML = ic('piece') + argent(E.argent); a.style.color = E.argent < 0 ? '#ff8a6a' : '';
    vt.hidden = !['ecurie', 'garage', 'achat'].includes(U.onglet);
    if (!vt.hidden) { let objets;
      if (U.onglet === 'ecurie') objets = E.pilotes.map(p => R.voitureDe(E, p.voiture)).filter(Boolean).map(x => [R.VOITURES[x.v].m, x.c]);
      else if (U.onglet === 'achat') { const o = U.occ ? E.occasions[U.vue] : null; objets = [[R.VOITURES[o ? o.i : Math.min(U.vue, R.VOITURES.length - 1)].m, o ? o.c : R.TEINTE]]; }
      else { const x = E.parc[Math.min(U.choix, E.parc.length - 1)]; objets = [[R.VOITURES[x.v].m, x.c]]; }
      if (!objets.length) objets = [[R.VOITURES[E.parc[0].v].m, E.parc[0].c]];
      vitrine().montrer(objets); }
    const haut = corps.scrollTop; corps.innerHTML = vues[U.onglet](); corps.scrollTop = haut;
    app.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.o === U.onglet));
  }
  function actionGestion(d) {
    const x = E.parc[Math.min(U.choix, E.parc.length - 1)];
    if (d.o) { U.onglet = d.o; U.ouvert = null; app.querySelector('.corps').scrollTop = 0; }
    else if (d.donner) { const i = Number(d.donner), dispo = E.parc.filter(v => !R.empechement(E, v) && !R.piloteDe(E, v.id));
      if (U.ouvert === i) U.ouvert = null; else if (!dispo.length) { toast('AUCUNE VOITURE DISPONIBLE'); U.ouvert = i; } else U.ouvert = i; }
    else if (d.prendre) { const p = E.pilotes[U.ouvert]; p.voiture = Number(d.prendre); U.ouvert = null; toast(p.nom + ' : ' + R.VOITURES[R.voitureDe(E, p.voiture).v].nom); }
    else if (d.liberer) { const p = E.pilotes[Number(d.liberer)]; if (!confirm('Libérer ' + p.nom + ' ? Il quitte l\'écurie.')) return; E.pilotes.splice(Number(d.liberer), 1); U.ouvert = null; toast(p.nom + ' QUITTE L\'ECURIE'); }
    else if (d.voir) { U.choix = Number(d.voir); U.onglet = 'garage'; app.querySelector('.corps').scrollTop = 0; }
    else if (d.recrue) { if (E.pilotes.length >= places()) { toast('PLUS DE PLACE'); return; } const l = R.LIBRES[Number(d.recrue)], prime = l.salaire * 2;
      if (E.argent < prime) { toast('PAS ASSEZ D\'ARGENT'); return; } E.argent -= prime;
      const libre = E.parc.find(v => !R.piloteDe(E, v.id) && !R.empechement(E, v));
      E.pilotes.push({nom: l.nom, age: l.age, n: l.n.slice(), forme: 80, prog: 0, salaire: l.salaire, voiture: libre ? libre.id : null, c: l.c}); toast(l.nom + ' SIGNE !'); }
    else if (d.teinte) x.c = d.teinte;
    else if (d.fl) { if (U.onglet === 'garage') U.choix = (U.choix + Number(d.fl) + E.parc.length) % E.parc.length; else { const n = (U.occ ? E.occasions : R.VOITURES).length; U.vue = (U.vue + Number(d.fl) + n) % n; } }
    else if (d.piece) { const q = R.PIECES.find(y => y.k === d.piece), pr = prixPiece(q);
      if (x.pieces[q.k]) { delete x.pieces[q.k]; const r = q.k === 'pneus' ? 0 : Math.round(q.prix * .5); E.argent += r; toast(r ? 'PIECE REVENDUE +' + argent(r) : 'PIECE DEMONTEE'); }
      else if (E.argent >= pr) { x.pieces[q.k] = q.k === 'pneus' ? 4 : true; E.argent -= pr; toast(q.nom + ' POSE' + (R.horsCategorie(E, x) ? ' · HORS CATEGORIE !' : '')); } else toast('PAS ASSEZ D\'ARGENT'); }
    else if (d.vendre) { const pr = prixVente(x); E.argent += pr; E.parc.splice(U.choix, 1); U.choix = 0; toast('VOITURE VENDUE +' + argent(pr)); }
    else if (d.reparer) { const c = 4000 * x.repar; if (E.argent < c) { toast('PAS ASSEZ D\'ARGENT'); return; } E.argent -= c; x.repar = 0; x.etat = Math.max(x.etat, 80); toast('VOITURE REPAREE'); }
    else if (d.remettre) { const c = (100 - x.etat) * 80; if (E.argent < c) { toast('PAS ASSEZ D\'ARGENT'); return; } E.argent -= c; x.etat = 100; toast('VOITURE REMISE A NEUF'); }
    else if (d.occ) { U.occ = d.occ === '1'; U.vue = 0; if (U.occ && !E.occasions.length) { U.occ = false; toast('PLUS D\'OCCASION CETTE SEMAINE'); } }
    else if (d.acheter) { const o = U.occ ? E.occasions[U.vue] : null, prix = o ? o.prix : R.VOITURES[U.vue].prix; if (prix > E.argent) { toast('PAS ASSEZ D\'ARGENT'); return; }
      E.argent -= prix; E.parc.push({id: E.prochainId++, v: o ? o.i : U.vue, c: o ? o.c : R.TEINTE, pieces: {}, usure: o ? o.u.slice() : [0, 0, 0, 0], etat: o ? o.et : 100, repar: 0});
      if (o) { E.occasions.splice(U.vue, 1); U.vue = 0; } U.choix = E.parc.length - 1; U.onglet = 'garage'; toast('NOUVELLE VOITURE AU PARC !'); }
    else if (d.sponsor) { const i = Number(d.sponsor), s = R.SPONSORS[i];
      if (E.signes.includes(i)) { E.signes = E.signes.filter(y => y !== i); toast('CONTRAT RESILIE'); }
      else if (s.niv > E.niveau) { toast('IL FAUT LE NIVEAU ' + s.niv); return; } else if (E.rompus.includes(i)) { toast('CONTRAT ROMPU CETTE SAISON'); return; }
      else if (E.signes.length < 2) { E.signes.push(i); toast('CONTRAT SIGNE'); } else { toast('PLUS DE PLACE'); return; } }
    else if (d.jour) { const i = Number(d.jour); E.semaine[i] = (E.semaine[i] + 1) % R.ACTIVITES.length; }
    else if (d.revenu) { const rv = R.REVENUS.find(y => y.k === d.revenu); if (E.revenus[rv.k]) return; if (E.fans < rv.seuil) { toast('IL FAUT ' + nombre(rv.seuil) + ' FANS'); return; }
      if (E.argent < rv.prix) { toast('PAS ASSEZ D\'ARGENT'); return; } E.argent -= rv.prix; E.revenus[rv.k] = true; toast(rv.nom + ' : OUVERT !'); }
    else if (d.gp) { lancer(); return; }
    sauver(); majGestion();
  }

  /* ---------- grand prix : grille, course, résultats ---------- */
  let G = null; // {prep, C, S, vitesse, cams, cam, bilan}
  function finCourse() { if (G && G.S) { G.S.liberer(); G.S = null; } }
  function lancer() {
    if (!E.pilotes.length) { toast('IL TE FAUT UN PILOTE'); return; }
    const prep = R.preparer(E), K = Circuits.get(prep.circuit);
    if (!prep.grille.some(g => g.joueur)) { toast('AUCUN PILOTE NE PEUT COURIR'); E = lire(CLE, E); return; }
    const C = Course.creer(K, prep.grille, {tours: 8});
    G = {prep, C, K, vitesse: 1, cam: 0, bilan: null};
    const ordreDep = C.depart.map(k => C.V[k]);
    app.innerHTML = `<div class="entete"><span>${K.nom}</span><span class="puce">${ic('drapeau')}GP ${E.gp + 1}/${R.GP_SAISON}</span></div><div class="corps">
      ${prep.msg.length ? `<div class="bloc"><h3>${ic('semaine')}TA SEMAINE</h3>${prep.msg.map(m => `<div class="doux">${m}</div>`).join('')}</div>` : ''}
      <div class="bloc"><h3>${ic('drapeau')}GRILLE DE DEPART · 8 TOURS</h3><table>${ordreDep.map((v, i) => `<tr class="${v.joueur ? 'moi' : ''}"><td>P${i + 1}</td><td>${pastille(v.c)}${v.nom}</td><td>${nomModele(v.m)}</td></tr>`).join('')}</table>
        <div class="doux">LA GRILLE VIENT DES QUALIFICATIONS : VOITURE, TALENT ET UN PEU DE CHANCE.</div></div>
      <button class="btn grand vert" data-a="depart">${ic('drapeau')}DEPART !</button><button class="btn second" data-a="direct">${ic('vite')}RESULTAT DIRECT</button></div><div class="toast"></div>`;
    actif = null;
  }
  function course() {
    const {C, K} = G;
    app.innerHTML = `<div class="course"><canvas></canvas><div class="hud"><div class="haut"><span>${K.nom}</span><span class="tourN"></span></div><div class="tour"></div><div class="feux"></div>
      <div class="cam"></div><div class="duel"></div><div class="fil"></div><div class="flash"></div></div>
      <div class="commandes"><button data-a="camera"></button><button class="second" data-a="vitesse"></button><button class="second" data-a="direct">${ic('drapeau')}RESULTAT</button></div></div>`;
    G.cams = []; C.V.forEach((v, i) => { if (v.joueur) G.cams.push(['SUIVIE ' + v.pil, 0, i]); }); G.cams.push(['DIORAMA', 1], ['TELE', 2]); G.cam = 0;
    G.S = Scene3D.creer(app.querySelector('canvas'), K, C); appliquerCam();
    const hud = app.querySelector('.hud'); let acc = 1, feux = -1, coupe = 0, finVu = false;
    actif = dt => {
      const n = G.vitesse; for (let k = 0; k < n; k++) Course.pas(C, dt);
      G.S.image(dt);
      const etat = C.t < -3.5 ? 0 : C.t < 0 ? Math.min(5, Math.floor((C.t + 3.5) / .6) + 1) : C.t < 1.2 ? 6 : 7;
      if (etat !== feux) { feux = etat; hud.querySelector('.feux').innerHTML = etat === 7 ? '' : Array.from({length: 5}, (_, i) => `<i class="${etat === 6 ? 'v' : i < etat ? 'r' : ''}"></i>`).join(''); }
      if (G.S.mode === 2 && G.S.tele.coupe !== coupe) { coupe = G.S.tele.coupe; const f = hud.querySelector('.flash'); f.style.transition = 'none'; f.style.opacity = .8; requestAnimationFrame(() => { f.style.transition = 'opacity .3s'; f.style.opacity = 0; }); }
      if ((acc += dt) > .25) { acc = 0; majHud(hud); }
      if (C.fin && !finVu) { finVu = true; const c = app.querySelector('.commandes'); c.innerHTML = '<button data-a="resultats">' + ic('trophee') + 'VOIR LES RESULTATS</button>'; majHud(hud); }
    };
  }
  function appliquerCam() { const [nom, mode, suivi] = G.cams[G.cam]; G.S.mode = mode; if (suivi != null) G.S.suivi = suivi; const b = app.querySelector('[data-a=camera]'); if (b) b.innerHTML = ic('camera') + nom; const v = app.querySelector('[data-a=vitesse]'); if (v) v.innerHTML = ic('vite') + '×' + G.vitesse; }
  function majHud(hud) {
    const C = G.C, O = C.ordre, L0 = O[0];
    hud.querySelector('.tourN').textContent = C.fin ? 'ARRIVEE' : C.arrivee.length ? 'DRAPEAU A DAMIER' : 'TOUR ' + Course.tour(C) + '/' + C.tours;
    hud.querySelector('.tour').innerHTML = O.map((v, i) => `<div class="${v.joueur ? 'moi' : ''} ${v.abandon ? 'ab' : ''}"><span>${i + 1}</span><i style="background:${v.c}"></i>${v.pil}${i ? ' <small>' + (v.abandon ? 'AB' : v.fini ? '+' + (v.temps - L0.temps).toFixed(1) : '+' + ((L0.s - v.s) / Math.max(10, v.v)).toFixed(1)) + '</small>' : ''}</div>`).join('');
    hud.querySelector('.fil').innerHTML = C.EV.filter(e => C.t - e.t < 8).map(e => `<div>${e.x}</div>`).join('');
    const tele = G.S && G.S.mode === 2; hud.querySelector('.cam').textContent = tele ? '● CAM ' + G.S.tele.num : ''; hud.querySelector('.duel').textContent = tele ? G.S.tele.duel : '';
  }
  function resultats() {
    finCourse(); const {C, prep, K} = G;
    if (!G.bilan) { G.bilan = R.resultats(E, C, prep); record(C, G.bilan); sauver(); }
    const b = G.bilan, L0 = C.ordre[0], total = b.lignes.reduce((a, [, v]) => a + (typeof v === 'number' ? v : 0), 0);
    app.innerHTML = `<div class="entete"><span>RESULTATS · ${K.nom}</span><b class="puce arg">${ic('piece')}${argent(E.argent)}</b></div><div class="corps">
      <div class="bloc"><h3>${ic('drapeau')}ARRIVEE</h3><table>${C.ordre.map((v, i) => `<tr class="${v.joueur ? 'moi' : ''}"><td>${i + 1}</td><td>${pastille(v.c)}${v.nom}</td><td>${v.abandon ? 'ABANDON' : i ? '+' + (v.fini ? (v.temps - L0.temps).toFixed(1) + ' S' : '1 TOUR') : (L0.temps / 60 | 0) + ':' + String((L0.temps % 60).toFixed(1)).padStart(4, '0')}</td><td>${v.abandon ? 0 : R.POINTS[i] || 0} PTS</td></tr>`).join('')}</table></div>
      <div class="bloc"><h3>${ic('piece')}BILAN DE LA SEMAINE</h3>${b.lignes.map(([t, v]) => `<div class="ligne fixe"><span>${t}</span><em class="${typeof v === 'number' ? (v < 0 ? 'moins' : 'plus') : ''}">${typeof v === 'number' ? signe(v) : ''}</em></div>`).join('')}
        <div class="ligne fixe"><span>TOTAL</span><em class="${total < 0 ? 'moins' : 'plus'}">${signe(total)}</em></div></div>
      ${b.monte ? `<div class="bloc"><h3>L'ECURIE PASSE AU NIVEAU ${b.niveau} !</h3><div class="doux">${b.places} PLACES DE PILOTES, DE NOUVEAUX SPONSORS.</div></div>` : ''}
      <button class="btn grand" data-a="apres">${ic(b.fin ? 'trophee' : 'semaine')}${b.fin ? 'FIN DE SAISON' : 'SEMAINE SUIVANTE'}</button></div>`;
    actif = null;
  }
  function apres() {
    const b = G.bilan;
    if (b.faillite) { app.innerHTML = `<div class="entete"><span>FAILLITE</span></div><div class="corps"><div class="bloc"><h3>LA BANQUE FERME L'ECURIE</h3><div class="doux">Tes dettes dépassent 20 000 $. L'aventure s'arrête là… pour cette fois.</div></div><button class="btn grand" data-a="refaire">NOUVELLE PARTIE</button></div>`;
      E = null; try { localStorage.removeItem(CLE); } catch (e) {} G = null; return; }
    if (b.fin) { const f = b.fin; b.fin = null;
      app.innerHTML = `<div class="entete"><span>FIN DE LA SAISON ${f.saison}</span><b class="arg">${argent(E.argent)}</b></div><div class="corps">
        <div class="bloc" style="text-align:center"><h3>${f.champion ? 'CHAMPION !' : 'TON MEILLEUR PILOTE : ' + f.rang + (f.rang === 1 ? 'ER' : 'E')}</h3><div class="gros">${f.rang}${f.rang === 1 ? 'ER' : 'E'}</div>
          <div class="doux">PRIME DE FIN DE SAISON : <span class="ok">+${argent(f.prime)}</span></div>
          <div class="doux">${f.promu ? 'PROMOTION ! LA SAISON PROCHAINE : ' + f.division : 'LA SAISON PROCHAINE : ' + f.division}</div></div>
        <div class="bloc"><h3>CLASSEMENT · ${f.avant}</h3><table>${f.classement.map((c, i) => `<tr class="${c.joueur ? 'moi' : ''}"><td>${i + 1}</td><td>${c.nom}</td><td>${c.pts} PTS</td></tr>`).join('')}</table></div>
        ${f.promu ? '<div class="doux">LES ADVERSAIRES SONT PLUS FORTS ET LES VOITURES PLUS PUISSANTES (VOIR LA CONCESSION). LES PRIMES AUSSI SONT PLUS GROSSES.</div>' : ''}
        <button class="btn grand" data-a="apres">SAISON ${E.saison}</button></div>`;
      return; }
    G = null; U.ouvert = null; gestion('semaine');
  }
  function record(C, b) {
    const r = lire(CLE_REC, {}) || {}; r.gp = (r.gp || 0) + 1;
    const i = C.ordre.findIndex(v => v.joueur && !v.abandon); if (i === 0) r.victoires = (r.victoires || 0) + 1; if (i >= 0 && i < 3) r.podiums = (r.podiums || 0) + 1;
    if (b.fin) { if (b.fin.champion) r.titres = (r.titres || 0) + 1; }
    r.division = Math.max(r.division || 0, E.division); r.fans = Math.max(r.fans || 0, E.fans); r.saison = Math.max(r.saison || 0, E.saison);
    ecrire(CLE_REC, r);
  }

  /* ---------- les clics ---------- */
  app.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.a === 'continuer') gestion();
    else if (d.a === 'nouvelle') { if (E && !confirm('Recommencer une nouvelle écurie ? La partie en cours sera perdue.')) return; E = R.nouvellePartie(); sauver(); Object.assign(U, {onglet: 'ecurie', choix: 0, vue: 0, occ: false, ouvert: null}); gestion('ecurie'); }
    else if (d.a === 'refaire') { E = R.nouvellePartie(); sauver(); gestion('ecurie'); }
    else if (d.a === 'aide') aide();
    else if (d.a === 'titre') titre();
    else if (d.a === 'depart') course();
    else if (d.a === 'direct') { Course.finir(G.C); resultats(); }
    else if (d.a === 'camera') { G.cam = (G.cam + 1) % G.cams.length; appliquerCam(); majHud(app.querySelector('.hud')); }
    else if (d.a === 'vitesse') { G.vitesse = G.vitesse === 1 ? 2 : G.vitesse === 2 ? 4 : 1; b.innerHTML = ic('vite') + '×' + G.vitesse; }
    else if (d.a === 'resultats') resultats();
    else if (d.a === 'apres') apres();
    else if (E && app.querySelector('nav')) actionGestion(d);
  });

  // démarrage : charger les modèles puis l'écran titre
  Modeles.charger().then(titre).catch(e => { console.error(e); app.innerHTML = '<div class="charge">ERREUR DE CHARGEMENT</div>'; });
  window.Ecurie = {etat: () => E, regles: R, nouvelle() { E = R.nouvellePartie(); sauver(); gestion('ecurie'); }, gestion, lancer, course, resultats, apres, titre, jeu: () => G,
    finirCourse() { Course.finir(G.C); }};
})();

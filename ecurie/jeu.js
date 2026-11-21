/* Écurie miniature : les écrans (titre, gestion en six onglets, grille de départ, course 3D, résultats, fin de saison).
   Direction A « la télé » de la maquette 9 (21/11). Partie sauvée dans localStorage « ecurie.partie », records dans « ecurie.record ». */
(function () {
  const R = Regles, app = document.getElementById('app'), SON = window.EcurieSons;
  const CLE = 'ecurie.partie', CLE_REC = 'ecurie.record';
  const lire = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const ecrire = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let E = lire(CLE, null); if (E && E.v !== 1) E = null;
  const sauver = () => ecrire(CLE, E);
  const nombre = n => Math.round(n).toLocaleString('fr-FR').replace(/\s/g, ' ');
  const argent = n => (n < 0 ? '−' : '') + nombre(Math.abs(n)) + ' $';
  const signe = n => (n > 0 ? '+' : n < 0 ? '−' : '') + nombre(Math.abs(n)) + ' $';
  const pastille = c => `<i class="pastille" style="background:${c}"></i>`;
  const NOTES = ['Vitesse', 'Accélération', 'Adhérence', 'Fiabilité'];
  const TEINTES = ['#ff6a13', '#2456c8', '#c8262c', '#1f8a4c', '#f4f4f4', '#18181e', '#e8c43a', '#7a2a9a', '#18b4b0', '#e86aa0'];
  const ONGLETS = [['ecurie', 'Écurie'], ['garage', 'Garage'], ['achat', 'Achat'], ['sponsors', 'Sponsors'], ['semaine', 'Semaine'], ['fans', 'Fans']];
  const MODELES = {'cosmo-coupe': 'COSMO COUPE', 'rgsdev-hatchback': 'RG CITY', 'cosmo-mobil': 'AMÉRICAINE 50S', 'rgsdev-police-sports': 'INTERCEPTOR', 'rgsdev-muscle': 'RG MUSCLE', 'kenney-race-future': 'PROTO X'};
  const nomModele = m => { const v = R.VOITURES.find(x => x.m === m); return v ? v.nom : MODELES[m] || m.toUpperCase(); };
  const categorie = ch => ch <= 150 ? '150 ch' : ch <= 300 ? '300 ch' : ch <= 500 ? '500 ch' : 'illimitée';
  const NUMEROS = [7, 12, 21, 33];
  const numero = (p, i) => p.num || NUMEROS[i] || 40 + i;

  /* ---------- icônes au trait (SVG, couleur du texte) ---------- */
  const ICO = {ecurie: '<path d="M4 15a8 8 0 0 1 16 0v3H4z"/><path d="M12 10h8"/>', garage: '<path d="M14.5 5.5a4 4 0 0 0 4.9 4.9L11 18.8 8.2 16l8.4-8.4"/><path d="M6 20l2.2-4"/>',
    achat: '<path d="M3 15l2.2-5h13.6L21 15v3H3z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>', sponsors: '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    semaine: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', fans: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', camera: '<path d="M3 8h4l2-3h6l2 3h4v11H3z"/><circle cx="12" cy="13" r="3.5"/>', vite: '<path d="M4 6l7 6-7 6zM13 6l7 6-7 6z"/>',
    drapeau: '<path d="M5 21V4M5 4h13l-3 4 3 4H5"/>', son: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>', muet: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6"/>', trophee: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8"/>',
    essais: '<circle cx="12" cy="13" r="7"/><path d="M12 13l3-3M10 3h4"/>', atelier: '<path d="M14.5 5.5a4 4 0 0 0 4.9 4.9L11 18.8 8.2 16l8.4-8.4"/>',
    simu: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/>', repos: '<path d="M3 18V8M3 14h18v4M7 14v-3h6a3 3 0 0 1 3 3"/>',
    medias: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'};
  const ic = k => `<svg class="ic" viewBox="0 0 24 24">${ICO[k]}</svg>`;

  /* ---------- boucle d'affichage (une seule) ---------- */
  let actif = null, av = performance.now();
  (function b(m) { const dt = Math.min(.05, Math.max(0, (m - av) / 1000)); av = m; if (actif) try { actif(dt); } catch (e) { console.error(e); actif = null; } requestAnimationFrame(b); })(av);
  let VIT = null; const cvVit = document.createElement('canvas');
  const vitrine = () => VIT || (VIT = Scene3D.vitrine(cvVit));
  let toastT; function toast(t) { const x = app.querySelector('.toast'); if (!x) return; x.textContent = t; x.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => x.classList.remove('on'), 1800); }
  // confirmation dans la page (confirm() ne marche pas partout)
  let suiteConf = null;
  function confirmer(titre, texte, oui, faire) { suiteConf = faire; const v = document.createElement('div'); v.className = 'voile';
    v.innerHTML = `<div class="boite-conf"><b>${titre}</b><div class="doux">${texte}</div><div class="btns"><button class="btn second petit" data-a="conf-non">Annuler</button><button class="btn petit" data-a="conf-oui">${oui}</button></div></div>`; app.appendChild(v); }
  const enTete = (titre, droite) => `<div class="entete"><b>${titre}</b>${droite || ''}</div>`;

  /* ---------- écran titre ---------- */
  function titre() {
    finCourse();
    app.innerHTML = `<div class="titre"><h1><span>ÉCURIE</span><b>Miniature</b><small>Gère ton écurie, regarde tes pilotes courir</small></h1><div class="scene" id="vt"></div>
      <div class="boutons">${E ? `<button class="cta" data-a="continuer">Continuer</button><div class="reprise">Saison ${E.saison} · GP ${E.gp + 1}/${R.GP_SAISON} · ${R.DIVISIONS[E.division].nom}</div>` : ''}
        <button class="${E ? 'btn second' : 'cta'}" data-a="nouvelle">Nouvelle partie</button><button class="btn second" data-a="aide">Comment jouer</button>
        <a class="btn second ludo-retour" href="../index.html">Ludothèque</a></div></div><div class="toast"></div>`;
    app.querySelector('#vt').appendChild(cvVit);
    const x = E && (R.voitureDe(E, E.pilotes[0] && E.pilotes[0].voiture) || E.parc[0]);
    vitrine().montrer([[x ? R.VOITURES[x.v].m : 'cosmo-italia', x ? x.c : R.TEINTE]]);
    actif = dt => VIT.image(dt);
  }
  function aide() {
    app.innerHTML = `${enTete('Comment jouer', '<button class="menu" data-a="titre">Retour</button>')}<div class="corps texte">
      <div class="bloc"><h4>Le but</h4><p>Tu diriges une petite écurie. Tu ne pilotes pas : tu prépares la semaine, puis tu regardes la course. Une saison compte ${R.GP_SAISON} grands prix ; finis dans les 3 premiers du championnat pour monter de division (300 ch, puis 500 ch, puis illimitée).</p></div>
      <div class="bloc"><h4>La semaine</h4><p>Choisis l'activité de chaque jour (essais, atelier, simulateur, repos, médias), puis lance le grand prix. Après la course : points, primes, sponsors, fans, salaires et entretien.</p></div>
      <div class="bloc"><h4>Les voitures</h4><p>Chaque pilote reçoit une voiture du parc ; les autres restent en réserve et remplacent une voiture cassée. Les pièces améliorent les notes, mais une voiture trop puissante pour la division ne peut pas courir (le turbo ajoute 45 ch).</p></div>
      <div class="bloc"><h4>L'écurie grandit</h4><p>Les points marqués donnent de la réputation : au niveau 2, une troisième place de pilote et de nouveaux sponsors. Les fans viennent avec les bons résultats ; au bout d'un moment, ouvre une boutique, une convention, un fan club.</p></div>
      <div class="bloc"><h4>La course</h4><p>Le bouton Caméra passe d'une vue à l'autre : derrière tes pilotes, le diorama, la télé. Tu peux accélérer la course ou passer directement au résultat.</p></div></div>`;
    actif = null;
  }

  /* ---------- la gestion ---------- */
  const U = {onglet: 'ecurie', choix: 0, vue: 0, occ: false, ouvert: null, jour: null};
  const places = () => R.PLACES[E.niveau - 1];
  const barres = L => `<div class="barres">${L.map(([nom, v]) => `<div class="barre"><span>${nom}</span><i><b style="width:${v * 10}%"></b></i><em>${v}</em></div>`).join('')}</div>`;
  const etatTxt = x => x.repar ? `<span class="etat">En réparation · ${x.repar} sem.</span>` : x.etat < 60 ? `<span class="etat">État ${x.etat} %</span>` : `<span class="ok">État ${x.etat} %</span>`;
  const prixVente = x => Math.round(R.VOITURES[x.v].prix * .45 * x.etat / 100 / 100) * 100;
  const pneusOfferts = () => E.signes.some(i => R.SPONSORS[i].cond === 'pneus');
  const prixPiece = q => q.k === 'pneus' && pneusOfferts() ? 0 : q.prix;
  const prochainGP = cta => { const K = Circuits.get(R.calendrier(E.gp)); return `<section class="prochain bloc"><small>Prochain grand prix · ${E.gp + 1}/${R.GP_SAISON}</small><b>${K.nom}</b><span>${K.tours} tours · ${Math.round(K.TOT)} m · ${R.DIVISIONS[E.division].nom}</span>${cta ? '<button class="cta" data-gp="1">Lancer le grand prix</button>' : ''}</section>`; };
  const vues = {
    ecurie() { const pl = places(), libres = pl - E.pilotes.length, reserve = E.parc.filter(x => !R.piloteDe(E, x.id)), signes = new Set(E.pilotes.map(p => p.nom));
      return `${prochainGP(true)}
        <section class="bloc"><h4>Pilotes<em>${E.pilotes.length}/${pl} places</em></h4>${E.pilotes.map((p, i) => { const x = R.voitureDe(E, p.voiture), emp = x && R.empechement(E, x);
          return `<div class="pilote"><div class="num" style="background:${p.c}">${numero(p, i)}</div><b>${p.nom}</b>
            <button class="voit" data-donner="${i}"><i style="background:${x ? x.c : '#26314d'}"></i>${x ? R.VOITURES[x.v].nom : 'Aucune'}<span class="${emp || !x ? 'alerte' : ''}">${U.ouvert === i ? 'Fermer' : emp ? 'Indisponible' : 'Changer'}</span></button>
            <small>${p.age} ans · forme ${p.forme} % · ${argent(p.salaire)}/sem.</small>${barres([['Talent', p.n[0]], ['Constance', p.n[1]], ['Agressivité', p.n[2]]])}
            ${E.pilotes.length > 1 ? `<button class="lien" data-liberer="${i}">Libérer</button>` : ''}</div>
            ${U.ouvert === i ? `<div class="liste-choix">${E.parc.map(v => { const autre = R.piloteDe(E, v.id), moi = v.id === p.voiture, n = R.notes(v), emp2 = R.empechement(E, v);
              const raison = moi ? 'Sa voiture' : emp2 ? emp2 : autre ? 'Pilote : ' + autre.nom : '';
              return `<button class="ligne ${moi ? 'on' : raison ? 'non' : ''}" ${raison ? '' : `data-prendre="${v.id}"`}><span>${pastille(v.c)}${R.VOITURES[v.v].nom}</span><em>${moi ? 'Prise' : raison ? '—' : 'Prendre'}</em><small>${raison || 'Disponible'} · VIT ${n[0]} · ACC ${n[1]} · ADH ${n[2]} · FIA ${n[3]}</small></button>`; }).join('')}</div>` : ''}`; }).join('')}
          ${libres > 0 ? `<div class="place-vide"><div class="num">+</div><div><b>Place libre</b><div class="doux">Recrute un pilote plus bas.</div></div></div>` : ''}
          ${pl < 4 ? `<div class="place-vide"><div class="num">${pl + 1}</div><div><b>Place ${pl + 1}</b><div class="doux">Niveau ${E.niveau + 1} de l'écurie · réputation ${E.rep}/${R.NIVEAUX[E.niveau]}</div></div></div>` : ''}</section>
        <section class="bloc"><h4>Réserve<em>${reserve.length} voiture${reserve.length > 1 ? 's' : ''}</em></h4>${reserve.length ? reserve.map(x => `<button class="ligne" data-voir="${E.parc.indexOf(x)}"><span>${pastille(x.c)}${R.VOITURES[x.v].nom}</span><em>Voir</em><small>${etatTxt(x)} · ${categorie(R.chevaux(x))}</small></button>`).join('') : '<div class="doux">Aucune voiture de réserve. Si une voiture casse, la réserve la remplace au grand prix suivant.</div>'}</section>
        <section class="bloc"><h4>Pilotes libres</h4>${R.LIBRES.filter(l => !signes.has(l.nom)).map(l => `<button class="ligne ${libres > 0 ? '' : 'non'}" data-recrue="${R.LIBRES.indexOf(l)}"><span>${l.nom} · ${l.age} ans</span><em>${argent(l.salaire)}</em><small>TAL ${l.n[0]} · CST ${l.n[1]} · AGR ${l.n[2]} · ${l.note} · prime ${argent(l.salaire * 2)}</small></button>`).join('')}
          <div class="doux">${libres > 0 ? 'Touche un pilote pour le signer (prime de deux semaines de salaire).' : 'Plus de place : il faut monter de niveau, ou libérer un pilote.'}</div></section>`; },
    garage() { U.choix = Math.min(U.choix, E.parc.length - 1); const x = E.parc[U.choix], v = R.VOITURES[x.v], n = R.notes(x), p = R.piloteDe(E, x.id), ch = R.chevaux(x), hc = R.horsCategorie(E, x);
      return `<section class="bloc"><div class="nav2"><button class="fl" data-fl="-1">‹</button><div style="text-align:center"><h3>${v.nom}</h3><div class="doux">${U.choix + 1}/${E.parc.length} · ${p ? 'pilote : ' + p.nom : 'en réserve'}</div></div><button class="fl" data-fl="1">›</button></div>
        <div class="doux">${ch} ch · catégorie ${categorie(ch)} · ${etatTxt(x)}</div>${hc ? `<div class="alerte-bloc">Trop puissante pour la ${R.DIVISIONS[E.division].nom} : elle ne peut pas courir.</div>` : ''}
        ${barres(NOTES.map((y, i) => [y, n[i]]))}
        <div class="teintes">${TEINTES.map(t => `<button data-teinte="${t}" class="${x.c === t ? 'on' : ''}" style="background:${t}" aria-label="Peinture"></button>`).join('')}</div>
        <div class="btns">${x.repar ? `<button class="btn petit" data-reparer="1">Réparer · ${argent(4000 * x.repar)}</button>` : x.etat < 100 ? `<button class="btn second petit" data-remettre="1">Remettre à neuf · ${argent((100 - x.etat) * 80)}</button>` : ''}
        ${p || E.parc.length <= 1 ? '' : `<button class="btn second petit" data-vendre="1">Vendre · ${argent(prixVente(x))}</button>`}</div></section>
        <section class="bloc"><h4>Pièces</h4>${R.PIECES.map(q => { const pose = x.pieces[q.k]; return `<button class="ligne ${pose ? 'on' : ''}" data-piece="${q.k}"><span>${q.nom}</span><em>${pose ? (q.k === 'pneus' ? pose + ' GP' : 'Posée') : prixPiece(q) ? argent(q.prix) : 'Offert'}</em><small>${q.d}${pose ? ' · touche pour la revendre' : ''}</small></button>`; }).join('')}</section>`; },
    achat() { const L = U.occ ? E.occasions : R.VOITURES; if (!L.length) { U.occ = false; return vues.achat(); }
      U.vue = Math.min(U.vue, L.length - 1); const o = U.occ ? E.occasions[U.vue] : null, v = U.occ ? R.VOITURES[o.i] : R.VOITURES[U.vue];
      const n = v.n.map((x, i) => Math.max(0, x + (o ? o.u[i] : 0))), prix = o ? o.prix : v.prix, trop = v.ch > R.DIVISIONS[E.division].ch;
      return `<div class="onglets2"><button class="${U.occ ? '' : 'choisi'}" data-occ="0">Neuves</button><button class="${U.occ ? 'choisi' : ''}" data-occ="1">Occasion (${E.occasions.length})</button></div>
        <section class="bloc"><div class="nav2"><button class="fl" data-fl="-1">‹</button><div style="text-align:center"><h3>${v.nom}</h3><div class="doux">${U.vue + 1}/${L.length} · ${v.ch} ch · ${categorie(v.ch)}${o ? ' · ' + nombre(o.km) + ' km' : ''}</div></div><button class="fl" data-fl="1">›</button></div>
        ${barres(NOTES.map((x, i) => [x, n[i]]))}<div class="doux">${o ? o.etat.charAt(0) + o.etat.slice(1).toLowerCase() + ' · état ' + o.et + ' %' : 'Neuve'} · elle rejoindra ton parc (${E.parc.length} voiture${E.parc.length > 1 ? 's' : ''}).</div>
        ${trop ? `<div class="alerte-bloc">Trop puissante pour la ${R.DIVISIONS[E.division].nom}.</div>` : ''}
        <div class="prix"><b>${argent(prix)}</b><button class="btn ${prix > E.argent ? 'second' : ''}" data-acheter="1">${prix > E.argent ? 'Trop cher' : 'Acheter'}</button></div></section>
        <div class="doux">Les occasions changent chaque semaine. Entretien : ${argent(R.ENTRETIEN)} par voiture et par semaine.</div>`; },
    sponsors() { return `<section class="bloc"><h4>Contrats<em>${E.signes.length}/2 places</em></h4>${R.SPONSORS.map((s, i) => { const on = E.signes.includes(i), rompu = E.rompus.includes(i), bloque = s.niv > E.niveau;
        return `<button class="ligne ${on ? 'on' : rompu || bloque || E.signes.length >= 2 ? 'non' : ''}" data-sponsor="${i}"><span>${pastille(s.coul)}${s.nom}</span><em>${on ? 'Signé' : bloque ? 'Niv. ' + s.niv : rompu ? 'Rompu' : '+' + argent(s.gain)}</em><small>${argent(s.gain)} par course · ${s.obj}${rompu ? ' · contrat rompu cette saison' : ''}</small></button>`; }).join('')}
        <div class="doux">Touche un contrat pour le signer ou le résilier.</div></section>`; },
    semaine() { const J = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], tot = {}; E.semaine.forEach(a => tot[a] = (tot[a] || 0) + 1); const cl = R.classement(E);
      return `${prochainGP(false)}
        <section class="bloc"><h4>La semaine</h4><div class="jours">${E.semaine.map((a, i) => `<button class="${U.jour === i ? 'choisi' : ''}" data-jour="${i}"><b>${J[i]}</b>${ic(R.ACTIVITES[a].k)}${R.ACTIVITES[a].n}</button>`).join('')}</div>
          ${U.jour != null ? `<div class="liste-choix"><div class="doux">Que fait l'écurie le ${['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'][U.jour]} ?</div>${R.ACTIVITES.map((x, k) => `<button class="ligne ${E.semaine[U.jour] === k ? 'on' : ''}" data-activite="${k}"><span>${x.n}</span><em>${E.semaine[U.jour] === k ? 'Choisi' : 'Choisir'}</em><small>${x.e}</small></button>`).join('')}</div>`
            : '<div class="doux">Chaque jour, l\'écurie fait une activité. Touche un jour pour la choisir.</div>'}</section>
        <section class="bloc"><h4>Ce que la semaine apporte</h4>${Object.entries(tot).map(([a, n]) => `<div class="ligne fixe"><span>${R.ACTIVITES[a].n} ×${n}</span><small>${R.ACTIVITES[a].e}</small></div>`).join('')}</section>
        <button class="cta" data-gp="1">Lancer le grand prix</button>
        <section class="bloc"><h4>Championnat<em>${R.DIVISIONS[E.division].nom}</em></h4><table>${cl.map((c, i) => `<tr class="${c.joueur ? 'moi' : ''}"><td>${i + 1}</td><td>${c.nom}</td><td>${c.pts} pts</td></tr>`).join('')}</table>
          <div class="doux">Les 3 premiers montent de division en fin de saison.</div></section>`; },
    fans() { const rev = R.REVENUS.filter(x => E.revenus[x.k]), parSemaine = rev.filter(x => x.tous === 1).reduce((a, x) => a + Math.round(E.fans * x.par), 0), prochain = R.REVENUS.find(x => E.fans < x.seuil);
      return `<section class="bloc compteur"><h4>Tes fans</h4><b>${nombre(E.fans)}</b>
          ${prochain ? `<div class="jauge"><i style="width:${Math.round(E.fans / prochain.seuil * 100)}%"></i><span>${prochain.nom} à ${nombre(prochain.seuil)}</span></div>` : ''}
          <div class="doux">Revenus des fans : <span class="ok">+${argent(parSemaine)} par semaine</span></div></section>
        <section class="bloc"><h4>Ce qui attire les fans</h4>
          <div class="ligne fixe"><span>Victoire</span><em>+400</em></div><div class="ligne fixe"><span>Podium</span><em>+150</em></div><div class="ligne fixe"><span>Chaque point</span><em>+10</em></div>
          <div class="ligne fixe"><span>Dépassement</span><em>+10</em></div><div class="ligne fixe"><span>Jour de médias</span><em>+60</em></div><div class="ligne fixe"><span>Abandon</span><em class="moins">−20</em></div></section>
        <section class="bloc"><h4>Revenus à débloquer</h4>${R.REVENUS.map(x => { const on = E.revenus[x.k], peut = E.fans >= x.seuil;
          return `<button class="ligne ${on ? 'on' : peut ? '' : 'non'}" data-revenu="${x.k}"><span>${x.nom}</span><em>${on ? '+' + argent(Math.round(E.fans * x.par)) : peut ? argent(x.prix) : nombre(x.seuil) + ' fans'}</em><small>${x.d} · ${x.par} $ par fan ${x.quand}</small></button>`; }).join('')}</section>`; }};
  function gestion(onglet) {
    finCourse(); if (onglet) U.onglet = onglet;
    app.innerHTML = `<header class="top"><div class="marque"><small>Écurie · niv. ${E.niveau}</small><b>Miniature</b></div><div class="infos"><span class="arg"></span><span class="gp">GP ${E.gp + 1}/${R.GP_SAISON}</span><button class="menu" data-a="titre" aria-label="Menu">${ic('menu')}</button></div></header>
      <div class="scene" id="vt"><div class="legende"><b></b><small></small></div></div><div class="corps"></div><nav>${ONGLETS.map(([k, n]) => `<button data-o="${k}">${ic(k)}${n}</button>`).join('')}</nav><div class="toast"></div>`;
    app.querySelector('#vt').prepend(cvVit); majGestion(); actif = dt => { const v = app.querySelector('#vt'); if (v && !v.hidden) VIT.image(dt); };
  }
  function majGestion() {
    const vt = app.querySelector('#vt'), corps = app.querySelector('.corps'); if (!vt) return;
    const a = app.querySelector('.arg'); a.textContent = argent(E.argent); a.classList.toggle('neg', E.argent < 0);
    vt.hidden = !['ecurie', 'garage', 'achat'].includes(U.onglet);
    if (!vt.hidden) { let objets, nom, info;
      if (U.onglet === 'ecurie') { const xs = E.pilotes.map(p => R.voitureDe(E, p.voiture)).filter(Boolean); objets = xs.map(x => [R.VOITURES[x.v].m, x.c]);
        nom = 'Tes voitures'; info = xs.map(x => R.VOITURES[x.v].nom).join(' · ') || 'aucune'; }
      else if (U.onglet === 'achat') { const o = U.occ ? E.occasions[U.vue] : null, v = R.VOITURES[o ? o.i : Math.min(U.vue, R.VOITURES.length - 1)]; objets = [[v.m, o ? o.c : R.TEINTE]]; nom = v.nom; info = v.ch + ' ch · ' + categorie(v.ch); }
      else { const x = E.parc[Math.min(U.choix, E.parc.length - 1)], v = R.VOITURES[x.v]; objets = [[v.m, x.c]]; nom = v.nom; info = R.chevaux(x) + ' ch · ' + categorie(R.chevaux(x)); }
      if (!objets.length) objets = [[R.VOITURES[E.parc[0].v].m, E.parc[0].c]];
      vitrine().montrer(objets); vt.querySelector('.legende b').textContent = nom; vt.querySelector('.legende small').textContent = info; }
    const haut = corps.scrollTop; corps.innerHTML = vues[U.onglet](); corps.scrollTop = haut;
    app.querySelectorAll('nav button').forEach(b => b.classList.toggle('on', b.dataset.o === U.onglet));
  }
  function actionGestion(d) {
    const x = E.parc[Math.min(U.choix, E.parc.length - 1)];
    if (d.o) { U.onglet = d.o; U.ouvert = null; U.jour = null; app.querySelector('.corps').scrollTop = 0; }
    else if (d.donner) { const i = Number(d.donner), dispo = E.parc.filter(v => !R.empechement(E, v) && !R.piloteDe(E, v.id));
      if (U.ouvert === i) U.ouvert = null; else { if (!dispo.length) toast('Aucune voiture disponible'); U.ouvert = i; } }
    else if (d.prendre) { const p = E.pilotes[U.ouvert]; p.voiture = Number(d.prendre); U.ouvert = null; toast(p.nom + ' : ' + R.VOITURES[R.voitureDe(E, p.voiture).v].nom); }
    else if (d.liberer) { const i = Number(d.liberer), p = E.pilotes[i];
      confirmer('Libérer ' + p.nom + ' ?', 'Il quitte l\'écurie ; sa voiture passe en réserve.', 'Libérer', () => { E.pilotes.splice(i, 1); U.ouvert = null; sauver(); majGestion(); toast(p.nom + ' quitte l\'écurie'); }); return; }
    else if (d.voir) { U.choix = Number(d.voir); U.onglet = 'garage'; app.querySelector('.corps').scrollTop = 0; }
    else if (d.recrue) { if (E.pilotes.length >= places()) { toast('Plus de place'); return; } const l = R.LIBRES[Number(d.recrue)], prime = l.salaire * 2;
      if (E.argent < prime) { toast('Pas assez d\'argent'); return; } E.argent -= prime;
      const libre = E.parc.find(v => !R.piloteDe(E, v.id) && !R.empechement(E, v)), pris = new Set(E.pilotes.map(p => p.num).filter(Boolean));
      const num = [21, 33, 44, 55, 3, 9].find(n => !pris.has(n) && !NUMEROS.slice(0, E.pilotes.length).includes(n));
      E.pilotes.push({nom: l.nom, age: l.age, n: l.n.slice(), forme: 80, prog: 0, salaire: l.salaire, voiture: libre ? libre.id : null, c: l.c, num}); toast(l.nom + ' signe !'); }
    else if (d.teinte) x.c = d.teinte;
    else if (d.fl) { if (U.onglet === 'garage') U.choix = (U.choix + Number(d.fl) + E.parc.length) % E.parc.length; else { const n = (U.occ ? E.occasions : R.VOITURES).length; U.vue = (U.vue + Number(d.fl) + n) % n; } }
    else if (d.piece) { const q = R.PIECES.find(y => y.k === d.piece), pr = prixPiece(q);
      if (x.pieces[q.k]) { delete x.pieces[q.k]; const r = q.k === 'pneus' ? 0 : Math.round(q.prix * .5); E.argent += r; toast(r ? 'Pièce revendue +' + argent(r) : 'Pièce démontée'); }
      else if (E.argent >= pr) { x.pieces[q.k] = q.k === 'pneus' ? 4 : true; E.argent -= pr; toast(q.nom + ' posé' + (R.horsCategorie(E, x) ? ' · hors catégorie !' : '')); } else toast('Pas assez d\'argent'); }
    else if (d.vendre) { const pr = prixVente(x), nom = R.VOITURES[x.v].nom;
      confirmer('Vendre la ' + nom + ' ?', 'Elle quitte ton parc contre ' + argent(pr) + '.', 'Vendre', () => { E.argent += pr; E.parc.splice(U.choix, 1); U.choix = 0; sauver(); majGestion(); toast('Voiture vendue +' + argent(pr)); }); return; }
    else if (d.reparer) { const c = 4000 * x.repar; if (E.argent < c) { toast('Pas assez d\'argent'); return; } E.argent -= c; x.repar = 0; x.etat = Math.max(x.etat, 80); toast('Voiture réparée'); }
    else if (d.remettre) { const c = (100 - x.etat) * 80; if (E.argent < c) { toast('Pas assez d\'argent'); return; } E.argent -= c; x.etat = 100; toast('Voiture remise à neuf'); }
    else if (d.occ) { U.occ = d.occ === '1'; U.vue = 0; if (U.occ && !E.occasions.length) { U.occ = false; toast('Plus d\'occasion cette semaine'); } }
    else if (d.acheter) { const o = U.occ ? E.occasions[U.vue] : null, prix = o ? o.prix : R.VOITURES[U.vue].prix; if (prix > E.argent) { toast('Pas assez d\'argent'); return; }
      E.argent -= prix; E.parc.push({id: E.prochainId++, v: o ? o.i : U.vue, c: o ? o.c : R.TEINTE, pieces: {}, usure: o ? o.u.slice() : [0, 0, 0, 0], etat: o ? o.et : 100, repar: 0});
      if (o) { E.occasions.splice(U.vue, 1); U.vue = 0; } U.choix = E.parc.length - 1; U.onglet = 'garage'; toast('Nouvelle voiture au parc !'); }
    else if (d.sponsor) { const i = Number(d.sponsor), s = R.SPONSORS[i];
      if (E.signes.includes(i)) { E.signes = E.signes.filter(y => y !== i); toast('Contrat résilié'); }
      else if (s.niv > E.niveau) { toast('Il faut le niveau ' + s.niv); return; } else if (E.rompus.includes(i)) { toast('Contrat rompu cette saison'); return; }
      else if (E.signes.length < 2) { E.signes.push(i); toast('Contrat signé'); } else { toast('Plus de place'); return; } }
    else if (d.jour) { const i = Number(d.jour); U.jour = U.jour === i ? null : i; }
    else if (d.activite) { E.semaine[U.jour] = Number(d.activite); toast(['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'][U.jour] + ' : ' + R.ACTIVITES[E.semaine[U.jour]].n.toLowerCase()); U.jour = null; }
    else if (d.revenu) { const rv = R.REVENUS.find(y => y.k === d.revenu); if (E.revenus[rv.k]) return; if (E.fans < rv.seuil) { toast('Il faut ' + nombre(rv.seuil) + ' fans'); return; }
      if (E.argent < rv.prix) { toast('Pas assez d\'argent'); return; } E.argent -= rv.prix; E.revenus[rv.k] = true; toast(rv.nom + ' : ouvert !'); }
    else if (d.gp) { lancer(); return; }
    sauver(); majGestion();
  }

  /* ---------- grand prix : grille, course, résultats ---------- */
  let G = null; // {prep, C, K, S, vitesse, cams, cam, bilan}
  function finCourse() { SON.moteurOff(); if (G && G.S) { G.S.liberer(); G.S = null; } }
  function lancer() {
    if (!E.pilotes.length) { toast('Il te faut un pilote'); return; }
    const prep = R.preparer(E), K = Circuits.get(prep.circuit);
    if (!prep.grille.some(g => g.joueur)) { toast('Aucun pilote ne peut courir'); E = lire(CLE, E); return; }
    const C = Course.creer(K, prep.grille, {tours: K.tours});
    G = {prep, C, K, vitesse: 1, cam: 0, bilan: null};
    const ordreDep = C.depart.map(k => C.V[k]);
    app.innerHTML = `${enTete(K.nom, `<span>GP ${E.gp + 1}/${R.GP_SAISON}</span>`)}<div class="corps">
      ${prep.msg.length ? `<section class="bloc"><h4>Ta semaine</h4>${prep.msg.map(m => `<div class="doux">${m}</div>`).join('')}</section>` : ''}
      <section class="bloc"><h4>Grille de départ<em>${K.tours} tours</em></h4><table>${ordreDep.map((v, i) => `<tr class="${v.joueur ? 'moi' : ''}"><td>${i + 1}</td><td>${pastille(v.c)}${v.nom}</td><td class="petit-txt">${nomModele(v.m)}</td></tr>`).join('')}</table>
        <div class="doux">La grille vient des qualifications : voiture, talent et un peu de chance.</div></section>
      <button class="cta" data-a="depart">Départ !</button><button class="btn second" data-a="direct">Résultat direct</button></div><div class="toast"></div>`;
    actif = null;
  }
  function course() {
    const {C, K} = G;
    app.innerHTML = `<div class="course"><canvas></canvas><div class="hud"><div class="haut"><span>${K.nom}</span><span class="tourN"></span></div><div class="tour"></div><div class="feux"></div>
      <div class="cam"></div><div class="duel"></div><div class="fil"></div><div class="flash"></div></div>
      <div class="commandes"><button data-a="camera"></button><button data-a="vitesse"></button><button data-a="direct">${ic('drapeau')}Résultat</button><button class="son" data-a="son" aria-label="Son">${ic(SON.actif() ? 'son' : 'muet')}</button></div></div>`;
    G.cams = []; C.V.forEach((v, i) => { if (v.joueur) G.cams.push(['Suivie ' + v.pil, 0, i]); }); G.cams.push(['Diorama', 1], ['Télé', 2]); G.cam = 0;
    G.S = Scene3D.creer(app.querySelector('canvas'), K, C); appliquerCam();
    const hud = app.querySelector('.hud'); let acc = 1, feux = -1, coupe = 0, finVu = false, nbEv = C.journal.length;
    SON.moteurOn();
    actif = dt => {
      for (let k = 0; k < G.vitesse; k++) Course.pas(C, dt);
      G.S.image(dt);
      const etat = C.t < -3.5 ? 0 : C.t < 0 ? Math.min(5, Math.floor((C.t + 3.5) / .6) + 1) : C.t < 1.2 ? 6 : 7;
      if (etat !== feux) { if (etat >= 1 && etat <= 5) SON.bip(false); else if (etat === 6) SON.bip(true); feux = etat; hud.querySelector('.feux').innerHTML = etat === 7 ? '' : Array.from({length: 5}, (_, i) => `<i class="${etat === 6 ? 'v' : i < etat ? 'r' : ''}"></i>`).join(''); }
      if (G.S.mode === 2 && G.S.tele.coupe !== coupe) { coupe = G.S.tele.coupe; const f = hud.querySelector('.flash'); f.style.transition = 'none'; f.style.opacity = .8; requestAnimationFrame(() => { f.style.transition = 'opacity .3s'; f.style.opacity = 0; }); }
      // le moteur de la voiture filmée (suivie), plus discret en diorama et à la télé ; un souffle à chaque dépassement
      { const v = G.S.mode === 0 ? C.V[G.S.suivi] : C.ordre[0]; SON.moteurMaj(C.t < 0 ? 4 : v.v, G.S.mode === 0); }
      while (nbEv < C.journal.length) { if (/^Dépassement/.test(C.journal[nbEv])) SON.passage(); nbEv++; }
      if ((acc += dt) > .25) { acc = 0; majHud(hud); }
      if (C.fin && !finVu) { finVu = true; SON.foule(); SON.moteurOff(); app.querySelector('.commandes').innerHTML = `<button data-a="resultats">${ic('trophee')}Voir les résultats</button>`; majHud(hud); }
    };
  }
  function appliquerCam() { const [nom, mode, suivi] = G.cams[G.cam]; G.S.mode = mode; if (suivi != null) G.S.suivi = suivi;
    const b = app.querySelector('[data-a=camera]'); if (b) b.innerHTML = ic('camera') + nom; const v = app.querySelector('[data-a=vitesse]'); if (v) v.innerHTML = ic('vite') + '×' + G.vitesse; }
  function majHud(hud) {
    const C = G.C, O = C.ordre, L0 = O[0];
    hud.querySelector('.tourN').textContent = C.fin ? 'Arrivée' : C.arrivee.length ? 'Dernier tour' : 'Tour ' + Course.tour(C) + '/' + C.tours;
    hud.querySelector('.tour').innerHTML = O.map((v, i) => `<div class="${v.joueur ? 'moi' : ''} ${v.abandon ? 'ab' : ''}"><span>${i + 1}</span><i style="background:${v.c}"></i><span>${v.pil}</span><small>${i ? (v.abandon ? 'AB' : v.fini ? '+' + (v.temps - L0.temps).toFixed(1) : '+' + ((L0.s - v.s) / Math.max(10, v.v)).toFixed(1)) : '—'}</small></div>`).join('');
    hud.querySelector('.fil').innerHTML = C.EV.filter(e => C.t - e.t < 8).map(e => `<div>${e.x}</div>`).join('');
    const tele = G.S && G.S.mode === 2; hud.querySelector('.cam').textContent = tele ? '● Cam ' + G.S.tele.num : ''; hud.querySelector('.duel').textContent = tele ? G.S.tele.duel : '';
  }
  function resultats() {
    finCourse(); const {C, prep, K} = G;
    if (!G.bilan) { G.bilan = R.resultats(E, C, prep); record(C, G.bilan); sauver(); }
    const b = G.bilan, L0 = C.ordre[0], total = b.lignes.reduce((a, [, v]) => a + (typeof v === 'number' ? v : 0), 0), O = C.ordre;
    const marche = (v, k) => v ? `<div class="p${k}"><b>${v.pil}</b><div class="marche" style="${v.joueur ? 'background:#ff6a13' : ''}">${k}</div></div>` : '<div></div>';
    app.innerHTML = `${enTete('Résultats', `<span class="arg">${argent(E.argent)}</span>`)}<div class="corps">
      <section class="bloc"><h4>${K.nom}</h4><div class="podium">${marche(O[1], 2)}${marche(O[0], 1)}${marche(O[2], 3)}</div></section>
      <section class="bloc"><h4>Arrivée</h4><table>${O.map((v, i) => `<tr class="${v.joueur ? 'moi' : ''}"><td>${i + 1}</td><td>${pastille(v.c)}${v.nom}</td><td class="petit-txt">${v.abandon ? 'abandon' : i ? '+' + (v.fini ? (v.temps - L0.temps).toFixed(1) + ' s' : '1 tour') : (L0.temps / 60 | 0) + ':' + String((L0.temps % 60).toFixed(1)).padStart(4, '0')}</td><td>${v.abandon ? 0 : R.POINTS[i] || 0} pts</td></tr>`).join('')}</table></section>
      <section class="bloc"><h4>Bilan de la semaine</h4>${b.lignes.map(([t, v]) => `<div class="ligne fixe"><span>${t}</span><em class="${typeof v === 'number' ? (v < 0 ? 'moins' : 'plus') : ''}">${typeof v === 'number' ? signe(v) : ''}</em></div>`).join('')}
        <div class="ligne fixe"><span>Total</span><em class="${total < 0 ? 'moins' : 'plus'}">${signe(total)}</em></div></section>
      ${b.monte ? `<section class="prochain bloc"><small>L'écurie grandit</small><b>Niveau ${b.niveau} !</b><span>${b.places} places de pilotes, de nouveaux sponsors.</span></section>` : ''}
      <button class="cta" data-a="apres">${b.fin ? 'Fin de saison' : 'Semaine suivante'}</button></div>`;
    actif = null;
  }
  function apres() {
    const b = G.bilan;
    if (b.faillite) { app.innerHTML = `${enTete('Faillite')}<div class="corps texte"><section class="bloc"><h4>La banque ferme l'écurie</h4><p>Tes dettes dépassent 20 000 $. L'aventure s'arrête là… pour cette fois.</p></section><button class="cta" data-a="refaire">Nouvelle partie</button></div>`;
      E = null; try { localStorage.removeItem(CLE); } catch (e) {} G = null; return; }
    if (b.fin) { const f = b.fin; b.fin = null; const er = f.rang === 1 ? 'er' : 'e';
      app.innerHTML = `${enTete('Fin de la saison ' + f.saison, `<span class="arg">${argent(E.argent)}</span>`)}<div class="corps">
        <section class="bloc compteur"><h4>${f.champion ? 'Champion !' : 'Ton meilleur pilote'}</h4><b>${f.rang}<small style="font-size:.45em">${er}</small></b>
          <div class="doux">Prime de fin de saison : <span class="ok">+${argent(f.prime)}</span></div>
          <div class="doux">${f.promu ? 'Promotion ! La saison prochaine : ' + f.division : 'La saison prochaine : ' + f.division}</div></section>
        <section class="bloc"><h4>Classement<em>${f.avant}</em></h4><table>${f.classement.map((c, i) => `<tr class="${c.joueur ? 'moi' : ''}"><td>${i + 1}</td><td>${c.nom}</td><td>${c.pts} pts</td></tr>`).join('')}</table></section>
        ${f.promu ? '<div class="doux">Les adversaires sont plus forts et les voitures plus puissantes (voir la concession). Les primes aussi sont plus grosses.</div>' : ''}
        <button class="cta" data-a="apres">Saison ${E.saison}</button></div>`;
      return; }
    G = null; U.ouvert = null; gestion('semaine');
  }
  function record(C, b) {
    const r = lire(CLE_REC, {}) || {}; r.gp = (r.gp || 0) + 1;
    const i = C.ordre.findIndex(v => v.joueur && !v.abandon); if (i === 0) r.victoires = (r.victoires || 0) + 1; if (i >= 0 && i < 3) r.podiums = (r.podiums || 0) + 1;
    if (b.fin && b.fin.champion) r.titres = (r.titres || 0) + 1;
    r.division = Math.max(r.division || 0, E.division); r.fans = Math.max(r.fans || 0, E.fans); r.saison = Math.max(r.saison || 0, E.saison);
    ecrire(CLE_REC, r);
  }
  function nouvelle() { E = R.nouvellePartie(); sauver(); Object.assign(U, {onglet: 'ecurie', choix: 0, vue: 0, occ: false, ouvert: null}); gestion('ecurie'); }

  /* ---------- les clics ---------- */
  app.addEventListener('click', ev => {
    const b = ev.target.closest('button'); if (!b) return; const d = b.dataset;
    if (d.a === 'conf-oui' || d.a === 'conf-non') { const v = app.querySelector('.voile'); if (v) v.remove(); const f = suiteConf; suiteConf = null; if (d.a === 'conf-oui' && f) f(); return; }
    if (d.a === 'continuer') gestion();
    else if (d.a === 'nouvelle') { if (E) confirmer('Nouvelle écurie ?', 'La partie en cours sera perdue.', 'Recommencer', nouvelle); else nouvelle(); }
    else if (d.a === 'refaire') nouvelle();
    else if (d.a === 'aide') aide();
    else if (d.a === 'titre') titre();
    else if (d.a === 'depart') course();
    else if (d.a === 'direct') { Course.finir(G.C); resultats(); }
    else if (d.a === 'camera') { G.cam = (G.cam + 1) % G.cams.length; appliquerCam(); majHud(app.querySelector('.hud')); }
    else if (d.a === 'vitesse') { G.vitesse = G.vitesse === 1 ? 2 : G.vitesse === 2 ? 4 : 1; appliquerCam(); }
    else if (d.a === 'son') { SON.regler(!SON.actif()); b.innerHTML = ic(SON.actif() ? 'son' : 'muet'); if (SON.actif()) SON.moteurOn(); }
    else if (d.a === 'resultats') resultats();
    else if (d.a === 'apres') apres();
    else if (E && app.querySelector('nav')) actionGestion(d);
  });

  // démarrage : charger les modèles puis l'écran titre
  Modeles.charger().then(titre).catch(e => { console.error(e); app.innerHTML = '<div class="charge">Erreur de chargement</div>'; });
  window.Ecurie = {etat: () => E, regles: R, nouvelle, gestion, lancer, course, resultats, apres, titre, jeu: () => G,
    finirCourse() { Course.finir(G.C); }};
})();

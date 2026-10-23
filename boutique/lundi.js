/* =====================================================================
   LA BOUTIQUE DE CARTES · les ÉCRANS DU LUNDI (session 3a) :
   grossiste, rayons et prix, vitrines, boosters (ouverture animée de la
   maquette 2), classeur, tournoi, banque. Chaque écran est un panneau en
   bas de l'écran, la boutique 3D reste visible au-dessus.
   BouLundi(ctx) est appelé par jeu.js : ctx = { etat(), sauver, maj, boite, journal, euros }.
   Cahier des charges : specs/boutique-de-cartes.md § 5, 6, 9, 12.
   ===================================================================== */
'use strict';
function BouLundi(ctx) {
  const $ = id => document.getElementById(id), euros = ctx.euros;
  const RCOUL = ['#e8e3f0', '#7fd67f', '#5ab4ff', '#c58cff', '#ffcf3d'];
  const PAS = { booster: 6, presentoir: 1, coffret: 2, pochettes: 10, classeur: 2, figurine: 2 };
  let e = null, courant = null, ouvertA = 0, message = '', nomEcran = null;

  /* ---------- outils ---------- */
  const images = new Map();
  // l'image d'une carte (dessinée une fois, gardée en data: URL)
  function imgCarte(id) {
    if (!images.has(id)) images.set(id, BouCartes.dessiner(bouCarte(e, id)).toDataURL());
    return '<img class="mc" alt="" src="' + images.get(id) + '">';
  }
  const nomExt = n => bouExtension(e, n).nom;
  function nomArticle(cle) {
    const [a, n] = cle.split(':');
    return BOU_ARTICLES[a].nom + (n ? ' <i>' + nomExt(+n) + '</i>' : '');
  }
  // la pochette d'un booster : couleurs de l'élément vedette de l'extension, son monstre légendaire
  function pochette(n) {
    const X = bouExtension(e, n), S = BouCartes.STYLE[X.theme];
    return 'background:linear-gradient(160deg,' + S.ciel[0] + ',' + S.ciel[1] + ' 50%,' + S.f + ')';
  }
  const legendaire = n => BOU_MONSTRES.findIndex(m => m.leg && m.el === bouExtension(e, n).theme);
  const reserveTriee = filtre => Object.keys(e.reserve).filter(id => !filtre || filtre(bouCarte(e, id))).sort((a, b) => bouCote(e, b) - bouCote(e, a));
  const nbReserve = () => Object.values(e.reserve).reduce((s, n) => s + n, 0);
  function changer() { ctx.sauver(); ctx.maj(); rendre(); }

  /* ---------- le panneau ---------- */
  function ouvrir(titre, rendu) {
    e = ctx.etat(); courant = rendu; message = '';
    $('pTitre').textContent = titre; $('panneau').hidden = false; ouvertA = performance.now();
    $('pCorps').scrollTop = 0; rendre(); ctx.maj();
  }
  function fermer() { $('panneau').hidden = true; courant = null; ctx.maj(); }
  function rendre() { if (courant) $('pCorps').innerHTML = courant() + (message ? '<p class="msg">' + message + '</p>' : ''); message = ''; }
  $('pFermer').onclick = fermer;
  // le clic du toucher qui a ouvert le panneau ne doit pas toucher un bouton du panneau
  $('panneau').addEventListener('click', ev => { if (performance.now() - ouvertA < 400) { ev.stopPropagation(); ev.preventDefault(); } }, true);
  const actions = {};
  $('pCorps').addEventListener('click', ev => { const b = ev.target.closest('[data-act]'); if (b && !b.disabled) actions[b.dataset.act](b.dataset); });
  $('pCorps').addEventListener('change', ev => { const s = ev.target.closest('select[data-act]'); if (s) actions[s.dataset.act](s.dataset, s.value); });
  const bouton = (act, texte, data = {}, classe = '', off = false) =>
    '<button data-act="' + act + '"' + Object.keys(data).map(k => ' data-' + k + '="' + data[k] + '"').join('') + (classe ? ' class="' + classe + '"' : '') + (off ? ' disabled' : '') + '>' + texte + '</button>';

  /* ---------- le grossiste ---------- */
  function articlesGrossiste() {
    const l = [];
    for (const X of bouCatalogue(e.graine).extensions) if (bouCommandable(e, X.n)) for (const a of ['booster', 'presentoir', 'coffret']) l.push(a + ':' + X.n);
    return l.concat(['pochettes', 'classeur', 'figurine']);
  }
  function grossiste() {
    let total = 0, h = '';
    for (const cle of articlesGrossiste()) {
      const [a, n] = cle.split(':'), A = BOU_ARTICLES[a], c = e.commandes.find(x => x.cle === cle), nb = c ? c.nb : 0;
      const bloque = A.des && e.semaine < A.des, stock = e.stock[A.donne ? A.donne + ':' + n : cle] || 0;
      total += nb * A.achat;
      const nouvelle = n && bouExtension(e, +n).sortie > e.semaine;
      h += '<div class="art' + (bloque ? ' bloque' : '') + '">' + (n ? '<span class="paq" style="' + pochette(+n) + '"></span>' : '') +
        '<div class="nom">' + nomArticle(cle) + '<small>' + (bloque ? 'à partir de la semaine ' + A.des : euros(A.achat) + (A.nb ? ' (' + A.nb + ' boosters)' : ' pièce') + ' · en stock : ' + stock + (nouvelle ? ' · <b>précommande</b>' : '')) + '</small></div>' +
        (bloque ? '' : bouton('moins', '−', { cle }, 'rond', !nb) + '<b class="nb">' + nb + '</b>' + bouton('plus', '+', { cle }, 'rond')) + '</div>';
    }
    const rupture = e.evenement && e.evenement.id === 'rupture' ? '<p class="msg">Rupture chez le grossiste : les ' + nomArticle(e.evenement.cle) + ' ne seront pas livrés lundi.</p>' : '';
    return rupture + h + '<p class="total">Commande de la semaine <b>' + euros(total) + '</b><small>payée tout de suite, livrée lundi prochain</small></p>';
  }
  actions.plus = d => {
    const r = bouCommander(e, d.cle, PAS[d.cle.split(':')[0]]);
    if (!r.ok) message = r.raison === 'argent' ? 'Pas assez d\'argent en caisse.' : 'Impossible de commander cet article.';
    changer();
  };
  actions.moins = d => {
    const c = e.commandes.find(x => x.cle === d.cle); if (!c) return;
    const reste = c.nb - PAS[d.cle.split(':')[0]];
    bouAnnulerCommande(e, d.cle); if (reste > 0) bouCommander(e, d.cle, reste);
    changer();
  };

  /* ---------- les rayons et les prix ---------- */
  function produits() {
    const l = [];
    for (const X of bouSorties(e)) l.push('booster:' + X.n, 'coffret:' + X.n);
    l.push('pochettes', 'classeur');
    if (e.semaine >= BOU_ARTICLES.figurine.des) l.push('figurine');
    return l;
  }
  function rayons() {
    const rs = e.meubles.filter(m => m.type === 'rayon'), choix = produits();
    let h = '<h3>TES RAYONS</h3>';
    if (!rs.length) h += '<p class="aide">Pas de rayon : pose-en un en aménageant.</p>';
    rs.forEach((m, k) => {
      h += '<div class="art"><div class="nom">Rayon ' + (k + 1) + '</div></div><div class="rangs">';
      for (let i = 0; i < 3; i++) {
        const cle = m.produits[i];
        h += '<select data-act="ranger" data-mid="' + m.id + '" data-i="' + i + '"><option value="">— vide —</option>' +
          choix.concat(cle && !choix.includes(cle) ? [cle] : []).map(c => '<option value="' + c + '"' + (c === cle ? ' selected' : '') + '>' + nomArticle(c).replace(/<\/?i>/g, '') + ' (' + (e.stock[c] || 0) + ')</option>').join('') + '</select>';
      }
      h += '</div>';
    });
    if (bouNb(e, 'classeurs')) h += '<p class="aide">L\'étagère à classeurs vend aussi les classeurs et les pochettes.</p>';
    if (bouNb(e, 'figurines')) h += '<p class="aide">Le présentoir vend les figurines.</p>';
    const enRayon = bouEnRayon(e), cles = [...new Set([...enRayon, ...Object.keys(e.stock).filter(c => e.stock[c] > 0)])].sort();
    h += '<h3>LES PRIX</h3>';
    for (const cle of cles) {
      const A = bouArticle(cle), p = bouPrix(e, cle), marge = p - A.achat, stock = e.stock[cle] || 0;
      const etat = !enRayon.has(cle) ? ' · <b class="rouge">pas en rayon</b>' : !stock ? ' · <b class="rouge">rupture !</b>' : '';
      h += '<div class="art"><div class="nom">' + nomArticle(cle) + '<small>stock ' + stock + ' · conseillé ' + euros(A.conseille) + etat + '</small></div>' +
        bouton('prix', '−', { cle, s: -1 }, 'rond') + '<b class="prix">' + euros(p) + '<small class="' + (marge > 0 ? 'vert' : 'rouge') + '">marge ' + (marge > 0 ? '+' : '') + euros(marge) + '</small></b>' + bouton('prix', '+', { cle, s: 1 }, 'rond') + '</div>';
    }
    return h + '<p class="aide">Trop cher, les clients repartent sans rien ; un rayon vide les déçoit.</p>';
  }
  actions.ranger = (d, v) => { bouRanger(e, +d.mid, +d.i, v || null); changer(); };
  actions.prix = d => { const p = bouPrix(e, d.cle), pas = p < 10 ? 0.5 : 1; bouFixerPrix(e, d.cle, Math.max(0.5, p + d.s * pas)); changer(); };

  /* ---------- les vitrines ---------- */
  let sel = null;   // { mid, p } : la place touchée
  const PCTS = [[90, '−10 %'], [100, 'À LA COTE'], [110, '+10 %'], [125, '+25 %'], [150, '+50 %']];
  function vitrines() {
    const vs = e.meubles.filter(m => BOU_MEUBLES[m.type].cartes);
    let h = '<div class="art"><div class="nom">Réserve : ' + nbReserve() + ' cartes<small>les cartes ouvertes qui ne sont pas en vitrine</small></div>' + bouton('remplir', 'TOUT RANGER', {}, 'jaune', !nbReserve()) + '</div>';
    if (!vs.length) h += '<p class="aide">Pas de vitrine : pose-en une en aménageant.</p>';
    const num = {};
    for (const m of vs) {
      const M = BOU_MEUBLES[m.type], v = bouPlaces(e, m);
      num[m.type] = (num[m.type] || 0) + 1;
      h += '<h3>' + M.nom.toUpperCase() + ' ' + num[m.type] + (M.valeur ? ' <small>rares et mieux</small>' : '') + '</h3><div class="places">';
      v.forEach((pl, p) => {
        const choisie = sel && sel.mid === m.id && sel.p === p;
        h += '<div class="place' + (choisie ? ' choisie' : '') + (pl ? '' : ' vide') + '" data-act="place" data-mid="' + m.id + '" data-p="' + p + '">' + (pl ? imgCarte(pl.id) + '<small>' + euros(bouPrixCarte(e, pl)) + '</small>' : '+') + '</div>';
      });
      h += '</div>';
      if (sel && sel.mid === m.id) h += detailPlace(m, v[sel.p]);
    }
    return h;
  }
  function detailPlace(m, pl) {
    if (pl) {
      const c = bouCarte(e, pl.id);
      return '<div class="detail"><div class="nom">' + c.nom + '<small style="color:' + RCOUL[c.rar] + '">' + BOU_RARETES[c.rar].n.toLowerCase() + '</small> cote ' + euros(bouCote(e, pl.id)) + ' · prix <b>' + euros(bouPrixCarte(e, pl)) + '</b> (' + pl.pct + ' %)</div>' +
        '<div class="pcts">' + PCTS.map(([p, t]) => bouton('pct', t, { p }, p === pl.pct ? 'jaune' : 'gris')).join('') + '</div>' +
        '<div class="pcts">' + bouton('retirer', 'REMETTRE EN RÉSERVE', {}, 'gris') + '</div></div>';
    }
    const ids = reserveTriee(BOU_MEUBLES[m.type].valeur ? c => c.rar >= 2 : null).slice(0, 40);
    if (!ids.length) return '<div class="detail"><p class="aide">' + (BOU_MEUBLES[m.type].valeur ? 'Pas de carte rare ou mieux en réserve.' : 'La réserve est vide : ouvre des boosters.') + '</p></div>';
    return '<div class="detail"><p class="aide">Choisis la carte à mettre en vitrine :</p><div class="choix">' +
      ids.map(id => '<div data-act="mettre" data-id="' + id + '">' + imgCarte(id) + '<small>' + euros(bouCote(e, id)) + (e.reserve[id] > 1 ? ' ×' + e.reserve[id] : '') + '</small></div>').join('') + '</div></div>';
  }
  actions.place = d => { const m = +d.mid, p = +d.p; sel = sel && sel.mid === m && sel.p === p ? null : { mid: m, p }; rendre(); };
  actions.mettre = d => { bouMettreEnVitrine(e, sel.mid, sel.p, d.id, 110); changer(); };
  actions.pct = d => { bouPrixVitrine(e, sel.mid, sel.p, +d.p); changer(); };
  actions.retirer = () => { bouMettreEnVitrine(e, sel.mid, sel.p, null); changer(); };
  actions.remplir = () => { bouRemplirVitrines(e, 110); sel = null; changer(); };

  /* ---------- les boosters ---------- */
  function boosters() {
    const cles = Object.keys(e.stock).filter(c => /^(booster|coffret):/.test(c) && e.stock[c] > 0).sort();
    let h = '<p class="aide">Fermé, un booster se vend sans risque. Ouvert, ses 5 cartes vont dans la réserve : souvent moins, parfois beaucoup plus.</p>';
    if (!cles.length) h += '<p class="aide"><b>Aucun booster en stock.</b> Commande-en au grossiste.</p>';
    for (const cle of cles) {
      const n = +cle.split(':')[1], coffret = cle[0] === 'c';
      h += '<div class="art"><span class="paq' + (coffret ? ' coffret' : '') + '" style="' + pochette(n) + '"></span><div class="nom">' + nomArticle(cle) + '<small>' + e.stock[cle] + ' en stock · vendu ' + euros(bouPrix(e, cle)) + ' fermé</small></div>' +
        (e.stock[cle] > 1 ? bouton('toutOuvrir', 'TOUT', { cle }, 'gris') : '') + bouton('ouvrir', 'OUVRIR', { cle }) + '</div>';
    }
    const m = e.stats.meilleure;
    if (e.stats.boostersOuverts) h += '<p class="aide">' + e.stats.boostersOuverts + ' boosters ouverts' + (m ? ' · ta meilleure carte : <b>' + bouCarte(e, m).nom + '</b> (' + euros(bouCote(e, m)) + ')' : '') + '</p>';
    return h;
  }
  actions.ouvrir = d => { if (d.cle[0] === 'c') return resume(d.cle, 1); booster(d.cle); };
  actions.toutOuvrir = async d => {
    const nb = e.stock[d.cle];
    const ok = await ctx.boite('<h2>TOUT OUVRIR ?</h2><p>Ouvrir les <b>' + nb + '</b> ' + nomArticle(d.cle) + ' ? Fermés, ils valent ' + euros(nb * bouPrix(e, d.cle)) + ' en rayon.</p>',
      [{ texte: 'NON', classe: 'gris', valeur: 0 }, { texte: 'OUVRIR', valeur: 1 }]);
    if (ok) resume(d.cle, nb);
  };
  // ouvrir sans animation (un coffret, ou tout le stock) : le résumé des cartes
  async function resume(cle, nb) {
    let ids = [];
    for (let k = 0; k < nb; k++) { const r = bouOuvrir(e, cle); if (r) ids = ids.concat(r); }
    if (!ids.length) return;
    ctx.sauver(); rendre();
    ids.sort((a, b) => bouCote(e, b) - bouCote(e, a));
    const tot = ids.reduce((s, id) => s + bouCote(e, id), 0), vus = ids.slice(0, 24);
    const p = ctx.boite('<h2>' + ids.length + ' CARTES</h2><p>Valeur totale : <b>' + euros(tot) + '</b> · ta meilleure : <b>' + bouCarte(e, ids[0]).nom + '</b></p><div class="cartes" id="rc"></div>' + (ids.length > vus.length ? '<p class="aide">… et ' + (ids.length - vus.length) + ' autres, dans la réserve.</p>' : ''),
      [{ texte: 'AU CLASSEUR', classe: 'gris', valeur: 'classeur' }, { texte: 'EN VITRINE', valeur: 'vitrine' }, { texte: 'OK', valeur: 0 }]);
    vus.forEach(id => { const cv = BouCartes.dessiner(bouCarte(e, id)); $('rc').appendChild(cv); });
    apres(await p, ids);
  }
  // après une ouverture : ranger au classeur les cartes qui lui manquent, ou remplir les vitrines
  function apres(choix, ids) {
    if (choix === 'classeur') { const n = ids.filter(id => bouGarder(e, id)).length; ctx.journal(n ? n + ' carte' + (n > 1 ? 's' : '') + ' rangée' + (n > 1 ? 's' : '') + ' au classeur' : 'Tu avais déjà ces cartes au classeur'); }
    if (choix === 'vitrine') { bouRemplirVitrines(e, 110); ctx.journal('Vitrines remplies'); }
    ctx.sauver(); ctx.maj(); rendre();
  }

  /* ---------- l'ouverture animée (maquette 2, écran C) ---------- */
  const B = $('booster'), paquet = $('paquet'), pile = $('pile');
  let cleB = null, idsB = [], prochaine = 0;
  function booster(cle) {
    cleB = cle; const n = +cle.split(':')[1];
    pile.innerHTML = ''; prochaine = 0; idsB = [];
    $('bBilan').classList.remove('on'); $('rayons').classList.remove('on'); B.classList.remove('ouvre');
    paquet.className = 'paquet'; paquet.querySelector('.face').style.cssText = pochette(n);
    $('bTitre').innerHTML = nomExt(n) + '<small>extension n° ' + n + ' · booster de 5 cartes · vendu ' + euros(bouPrix(e, cle)) + ' fermé</small>';
    $('bLogo').innerHTML = 'CRÉATURES<small>' + nomExt(n) + '</small>';
    BouCartes.bete(legendaire(n), 3, $('bBete'));
    $('bAide').textContent = 'Touche le booster pour l\'ouvrir'; $('bAide').hidden = false;
    B.hidden = false; ouvertA = performance.now();
  }
  paquet.onclick = () => {
    if (paquet.classList.contains('ouvert') || performance.now() - ouvertA < 400) return;
    idsB = bouOuvrir(e, cleB); if (!idsB) return;
    ctx.sauver(); rendre();
    BouSons.dechire(); paquet.classList.add('tremble'); setTimeout(() => paquet.classList.add('ouvert'), 350);
    // la meilleure carte est tout en dessous de la pile : on la découvre en dernier
    idsB.sort((a, b) => bouCarte(e, a).rar - bouCarte(e, b).rar || bouCote(e, a) - bouCote(e, b));
    setTimeout(() => {
      paquet.classList.add('vide'); B.classList.add('ouvre');
      [...idsB].reverse().forEach((id, k) => {
        const c = bouCarte(e, id), d = document.createElement('div'); d.className = 'carte3d';
        const dos = document.createElement('div'); dos.className = 'dos'; dos.appendChild(BouCartes.dos());
        const av = document.createElement('div'); av.className = 'avant'; av.appendChild(BouCartes.dessiner(c));
        if (c.rar >= 2) { const h = document.createElement('div'); h.className = 'holo'; av.appendChild(h); }
        const rg = document.createElement('div'); rg.className = 'rang'; rg.textContent = BOU_RARETES[c.rar].n + ' · ' + euros(bouCote(e, id)); rg.style.color = RCOUL[c.rar];
        d.append(dos, av, rg);
        d.style.transform = 'translateY(' + (240 - k * 2) + 'px) rotateZ(' + (k * 2 - 4) + 'deg)';
        pile.appendChild(d);
        setTimeout(() => { d.style.transform = 'translateZ(' + (k * 2) + 'px) rotateZ(' + (k * 1.5 - 3) + 'deg)'; }, 30 + k * 70);
      });
      $('bAide').textContent = 'Touche la carte pour la retourner';
    }, 800);
  };
  pile.onclick = () => {
    const cs = [...pile.children]; if (prochaine >= cs.length) return;
    const d = cs[cs.length - 1 - prochaine], c = bouCarte(e, idsB[prochaine]);
    cs.forEach(x => { if (x.dataset.vue) { const n = +x.dataset.vue; Object.assign(x.style, { left: (-178 + (n - 1) * 68) + 'px', top: '-292px', width: '96px', height: '123px', transform: 'rotateY(180deg) rotateZ(' + ((n - 2.5) * 5) + 'deg)' }); x.querySelector('.rang').style.display = 'none'; } });
    d.dataset.vue = ++prochaine; d.classList.add('retournee'); d.style.transform = 'rotateY(180deg) scale(1.08)'; d.style.zIndex = 10;
    BouSons.carte();
    if (c.rar >= 2) { eclats(c.rar >= 3 ? 26 : 12); setTimeout(() => BouSons.eclat(c.rar), 200); }
    if (c.rar >= 3) $('rayons').classList.add('on');
    if (prochaine === cs.length) {
      $('bAide').hidden = true;
      const tot = idsB.reduce((s, id) => s + bouCote(e, id), 0), ferme = bouPrix(e, cleB), best = bouCarte(e, idsB[idsB.length - 1]);
      $('bTotal').textContent = euros(tot);
      $('bLigne').innerHTML = (tot > ferme ? '<b class="vert">Bon pari !</b> ' : '<b class="rouge">Pas de chance.</b> ') + 'Ouvert : ' + euros(tot) + ' contre ' + euros(ferme) + ' fermé. Ta meilleure : <b>' + best.nom + '</b> (' + BOU_RARETES[best.rar].n.toLowerCase() + ').';
      $('bEncore').disabled = !(e.stock[cleB] > 0); $('bEncore').textContent = e.stock[cleB] > 0 ? 'UN AUTRE (' + e.stock[cleB] + ')' : 'PLUS DE BOOSTER';
      setTimeout(() => $('bBilan').classList.add('on'), 700);
    }
  };
  function eclats(n) {
    for (let k = 0; k < n; k++) {
      const d = document.createElement('div'); d.className = 'eclat'; const a = Math.random() * 6.28, r = 90 + Math.random() * 120;   // décor seulement : pas de graine
      d.style.left = innerWidth / 2 + 'px'; d.style.top = innerHeight / 2 - 30 + 'px'; d.style.setProperty('--dx', Math.cos(a) * r + 'px'); d.style.setProperty('--dy', Math.sin(a) * r + 'px');
      B.appendChild(d); setTimeout(() => d.remove(), 950);
    }
  }
  B.addEventListener('pointermove', ev => {
    const d = [...pile.children].find(x => +x.dataset.vue === prochaine); if (!d) return;
    const nx = ev.clientX / innerWidth - 0.5, ny = ev.clientY / innerHeight - 0.5;
    d.style.transform = 'rotateY(' + (180 + nx * 30) + 'deg) rotateX(' + (-ny * 25) + 'deg) scale(1.08)';
    const h = d.querySelector('.holo'); if (h) { h.style.animation = 'none'; h.style.setProperty('--px', (50 + nx * 120) + '%'); h.style.setProperty('--py', (50 + ny * 120) + '%'); }
  });
  function finBooster(choix) { if (choix) apres(choix, idsB); B.hidden = true; ctx.maj(); }
  $('bFermer').onclick = () => finBooster(null);
  $('bClasseur').onclick = () => { finBooster('classeur'); };
  $('bVitrine').onclick = () => { finBooster('vitrine'); };
  $('bEncore').onclick = () => { if (e.stock[cleB] > 0) booster(cleB); };

  /* ---------- le classeur ---------- */
  let ext = 0, page = 0;
  function classeur() {
    const xs = bouSorties(e); if (!ext || !xs.find(x => x.n === ext)) ext = xs[xs.length - 1].n;
    const X = bouExtension(e, ext), a = X.cartes.filter(id => e.classeur[id]).length;
    const cote = X.cartes.filter(id => e.classeur[id]).reduce((s, id) => s + bouCote(e, id), 0);
    const nouvelles = Object.keys(e.reserve).filter(id => !e.classeur[id]).length;
    let h = '<div class="onglets">' + xs.map(x => bouton('ext', x.nom, { n: x.n }, x.n === ext ? 'jaune' : 'gris')).join('') + '</div>';
    h += '<div class="art"><div class="nom">' + a + ' / 40 cartes' + (e.complets.includes(ext) ? ' · <b class="vert">COMPLET !</b>' : '') + '<small>cote du classeur ' + euros(cote) + ' · complet : +' + euros(BOU_BONUS_CLASSEUR) + ' de valeur et des clients fidèles</small></div>' +
      bouton('garderTout', 'RANGER LA RÉSERVE' + (nouvelles ? ' (' + nouvelles + ')' : ''), {}, 'jaune', !nouvelles) + '</div><div class="page">';
    for (let i = page * 9; i < page * 9 + 9; i++) {
      const id = X.cartes[i];
      if (!id) { h += '<div></div>'; continue; }
      const c = bouCarte(e, id);
      if (e.classeur[id]) h += '<div class="case">' + imgCarte(id) + '<small>' + euros(bouCote(e, id)) + '</small></div>';
      else h += '<div class="case vide' + (e.reserve[id] ? ' dispo" data-act="garder" data-id="' + id : '') + '"><span>' + c.num + '</span><i style="color:' + RCOUL[c.rar] + '">' + '★'.repeat(c.rar + 1) + '</i>' + (e.reserve[id] ? '<small>en réserve<br>RANGER</small>' : '') + '</div>';
    }
    h += '</div><div class="pages">' + bouton('page', '◀', { s: -1 }, 'rond', page === 0) + '<span>page ' + (page + 1) + ' / 5</span>' + bouton('page', '▶', { s: 1 }, 'rond', page === 4) + '</div>';
    return h + '<p class="aide">Les cartes du classeur comptent dans la valeur de la boutique ; elles ne sont jamais vendues.</p>';
  }
  actions.ext = d => { ext = +d.n; page = 0; rendre(); };
  actions.page = d => { page = Math.max(0, Math.min(4, page + +d.s)); rendre(); };
  actions.garder = d => { const avant = e.complets.length; bouGarder(e, d.id); bravo(avant); changer(); };
  actions.garderTout = () => {
    const avant = e.complets.length, n = Object.keys(e.reserve).filter(id => !e.classeur[id] && bouGarder(e, id)).length;
    ctx.journal(n + ' carte' + (n > 1 ? 's' : '') + ' rangée' + (n > 1 ? 's' : '') + ' au classeur'); bravo(avant); changer();
  };
  function bravo(avant) { if (e.complets.length > avant) ctx.boite('<h2>CLASSEUR COMPLET !</h2><p>Les 40 cartes de <b>' + nomExt(e.complets[e.complets.length - 1]) + '</b> : la boutique gagne ' + euros(BOU_BONUS_CLASSEUR) + ' de valeur et de la réputation.</p>', [{ texte: 'BRAVO', valeur: 1 }]); }

  /* ---------- le tournoi ---------- */
  function tournoi() {
    const tables = bouNb(e, 'table'), T = e.tournoi;
    if (!tables) return '<p class="aide">Il faut au moins une <b>table de tournoi</b> (AMÉNAGER) pour organiser le tournoi du samedi.</p>';
    const places = Math.min(16, 4 * tables), cle = 'booster:' + bouDerniere(e).n, stock = e.stock[cle] || 0;
    return '<div class="art"><div class="nom">Tournoi de samedi<small>' + places + ' places (' + tables + ' table' + (tables > 1 ? 's' : '') + ')</small></div>' + bouton('inscrire', T.inscrit ? 'INSCRIT ✓' : 'S\'INSCRIRE', {}, T.inscrit ? '' : 'jaune') + '</div>' +
      '<div class="art"><div class="nom">Inscription<small>payée par chaque joueur</small></div>' + bouton('regler', '−', { k: 'frais', s: -1 }, 'rond', T.frais <= 0) + '<b class="nb">' + euros(T.frais) + '</b>' + bouton('regler', '+', { k: 'frais', s: 1 }, 'rond', T.frais >= 5) + '</div>' +
      '<div class="art"><div class="nom">Lots<small>boosters ' + nomExt(bouDerniere(e).n) + ' pris dans le stock (' + stock + ')</small></div>' + bouton('regler', '−', { k: 'lots', s: -1 }, 'rond', T.lots <= 0) + '<b class="nb">' + T.lots + '</b>' + bouton('regler', '+', { k: 'lots', s: 1 }, 'rond', T.lots >= 24) + '</div>' +
      '<p class="aide">Des lots généreux et une inscription bon marché attirent plus de joueurs et font monter la réputation. Les cartes des finalistes prennent de la valeur dimanche.</p>';
  }
  actions.inscrire = () => { bouTournoi(e, { inscrit: !e.tournoi.inscrit }); changer(); };
  actions.regler = d => { bouTournoi(e, { [d.k]: e.tournoi[d.k] + +d.s }); changer(); };

  /* ---------- la banque ---------- */
  async function banque() {
    e = ctx.etat(); if (e.phase !== 'lundi' || courant || !B.hidden) return;
    if (!e.pret) return ctx.boite('<h2>LA BANQUE</h2><p>Le prêt est remboursé. Bravo !</p>', [{ texte: 'OK', valeur: 0 }]);
    const tout = Math.min(e.pret, e.caisse);
    const v = await ctx.boite('<h2>LA BANQUE</h2><p>Il reste <b>' + euros(e.pret) + '</b> à rendre. À la fin de la semaine ' + BOU_ECHEANCE + ', la banque prend ce qui reste <b>plus 20 %</b>' + (e.semaine > BOU_ECHEANCE ? '' : ' (dans ' + (BOU_ECHEANCE - e.semaine + 1) + ' semaines)') + '.</p><p>En caisse : ' + euros(e.caisse) + '</p>',
      [{ texte: 'PLUS TARD', classe: 'gris', valeur: 0 }, { texte: 'RENDRE 500 €', classe: 'jaune', valeur: Math.min(500, tout) }, { texte: 'RENDRE ' + euros(tout), valeur: tout }]);
    if (v > 0) { const r = bouRembourser(e, v); if (r) { ctx.journal('Banque : −' + euros(r)); ctx.sauver(); ctx.maj(); } }
  }

  const ECRANS = { grossiste: ['LE GROSSISTE', grossiste], rayons: ['RAYONS ET PRIX', rayons], vitrines: ['LES VITRINES', vitrines], boosters: ['LES BOOSTERS', boosters], classeur: ['LE CLASSEUR', classeur], tournoi: ['LE TOURNOI', tournoi] };
  return {
    ouvrir: nom => { sel = null; nomEcran = nom; ouvrir(...ECRANS[nom]); },
    fermer, banque,
    get ouvert() { return !!courant || !B.hidden; },
    get ecran() { return courant ? nomEcran : null; }, get booster() { return !B.hidden; },
  };
}

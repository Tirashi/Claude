/* Duché : écrans, gestes, boucle, sauvegardes. Les règles sont dans regles.js, evenements.js et ia.js,
   le dessin dans decor.js.
   La scène se dessine dans une toile basse de 216 × 384 agrandie sans lissage ; les textes s'écrivent ensuite
   sur la toile affichée (Press Start 2P pour les titres, Rajdhani 700 pour le reste). Les menus sont en HTML.
   Écrans dans la toile : carte (et tour des rivaux), événement, combat.
   Sauvegardes : duche.run (partie libre en cours), duche.dailyRun (Duché du jour en cours, classé),
   duche.dailyTry { j } (tentative du jour commencée), duche.daily { AAAAMMJJ : score }, duche.best (meilleur score
   en normal), duche.opts, duche.tuto. La partie est sauvegardée après chaque action. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const lire = (k, d) => { try { const v = JSON.parse(localStorage.getItem('duche.' + k)); return v == null ? d : v; } catch (e) { return d; } };
  const ecrire = (k, v) => { try { if (v == null) localStorage.removeItem('duche.' + k); else localStorage.setItem('duche.' + k, JSON.stringify(v)); } catch (e) { /* stockage plein ou interdit */ } };
  const D = window.DucDecor, W = D.W, H = D.H, PS = D.PS, SEIG = D.SEIG, r = D.r;
  const cv = $('cv'), g = cv.getContext('2d');
  const low = D.mk(W, H), L = low.getContext('2d');
  const lent = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOIS = ['JANVIER', 'FEVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOUT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DECEMBRE'];
  const auj = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  const dateJour = j => `${j % 100} ${MOIS[Math.floor(j / 100) % 100 - 1]}`;
  const sansAccent = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

  // ---------- état ----------
  let etat = null, cle = null;          // cle : 'run', 'dailyRun' ou null (Duché du jour rejoué, hors classement)
  let base = null, baseTour = -1, baseSig = '';
  let ecran = 'titre', sel = -1, mode = null, nb = 1, dest = -1, voirCarte = false;
  let msg = '', msgT = 0;               // dernier message (journal), affiché quelques secondes
  let combat = null, rivaux = null, clignote = null, marche = null;
  let apercu = null;                    // carte du jour en fond de l'écran titre
  let btns = [], textes = [];
  let k = 3, t0 = performance.now(), tNow = 0;

  const J = () => etat.seigneurs[0];
  const nomSeig = s => (s < 0 ? 'Terre libre' : s === 0 ? 'Votre duché' : etat.seigneurs[s].nom);
  // sauvegarde ; une partie finie est enregistrée tout de suite (score du jour, record), même si l'écran de fin n'est pas encore montré
  let infoFin = '';
  function sauver() {
    if (!cle || !etat) return;
    if (!etat.fin) { ecrire(cle, etat); return; }
    const sc = ducScore(etat).total;
    infoFin = '';
    const LS = window.LudoScores, rang = (txt, r) => { if (r) { const el = $('fRang'); el.textContent = txt + LS.rankText(r); el.hidden = false; } };
    if (cle === 'dailyRun') {
      const d = lire('daily', {}); d[etat.graine] = sc; ecrire('daily', d); infoFin = `Duché du jour du ${dateJour(etat.graine).toLowerCase()} : ${sc}.`;
      if (LS) LS.submit('duche', 'daily:' + etat.graine, sc, false).then(r => rang('Duché du jour : ', r)).catch(() => {});
    }
    if (etat.niveau === 'normal' && etat.mode !== 'rejeu') {
      const b = lire('best', 0); if (sc > b) { ecrire('best', sc); infoFin += ' Nouveau record !'; }
      if (LS && cle !== 'dailyRun') LS.submit('duche', 'best', sc, false).then(r => rang('Meilleur score : ', r)).catch(() => {});
      else if (LS) LS.submit('duche', 'best', sc, false).catch(() => {});
    }
    ecrire(cle, null); cle = null;
  }
  const dire = m => { msg = m; msgT = tNow; };

  // ---------- démarrer ----------
  function lancer(e, c) {
    etat = e; cle = c; sel = -1; mode = null; combat = null; rivaux = null; clignote = null; voirCarte = false; base = null;
    msg = ''; infoFin = ''; montrer(null);
    ecran = etat.fin ? 'carte' : etat.evt ? 'evenement' : 'carte';
    if (etat.fin) finir();
    sauver();
  }
  function partieLibre(niveau) { lancer(ducNouvelle((Math.random() * 2 ** 31) >>> 0, 'libre', niveau), 'run'); }
  function ducheDuJour() {
    const j = auj(), fait = lire('daily', {})[j] != null, run = ducMigrer(lire('dailyRun', null));
    if (!fait && run && run.graine === j) { lancer(run, 'dailyRun'); return; }
    if (!fait) { ecrire('dailyTry', { j }); lancer(ducNouvelle(j, 'jour', 'normal'), 'dailyRun'); return; }
    lancer(ducNouvelle(j, 'rejeu', 'normal'), null);   // déjà joué : hors classement, pas sauvegardé
    dire('Duché du jour déjà joué : partie hors classement.');
  }
  function continuer() { const e = ducMigrer(lire('run', null)); if (e) lancer(e, 'run'); }

  // ---------- menus HTML ----------
  const MENUS = ['eTitre', 'eNiveau', 'ePause', 'eAide', 'eFin'];
  let retourAide = 'eTitre';
  function montrer(id) { MENUS.forEach(m => { $(m).hidden = m !== id; }); }
  function titre() {
    ecran = 'titre'; etat = null; cle = null;
    const j = auj(), run = lire('run', null), fait = lire('daily', {})[j], dr = lire('dailyRun', null);
    $('bContinuer').hidden = !run;
    if (run) $('bContinuer').textContent = `CONTINUER · TOUR ${run.tour}/30`;
    $('bJour').innerHTML = `DUCHE DU JOUR<small>${dateJour(j)}${fait != null ? ' · FAIT · ' + fait : dr && dr.graine === j ? ' · REPRENDRE' : ''}</small>`;
    const best = lire('best', 0);
    $('tRecord').textContent = best ? `Meilleur score (normal) : ${best}` : 'Un tour = une saison. 30 tours pour devenir roi.';
    if (!apercu || apercu.graine !== j) { apercu = ducNouvelle(j, 'jour', 'normal'); base = null; }
    montrer('eTitre');
  }
  // ---------- sons ----------
  const opts = Object.assign({ bruit: true, musique: true }, lire('opts', {}));
  function majSons() {
    DucSons.bruitages(opts.bruit); DucSons.musique(opts.musique);
    ['bBruitT', 'bBruit'].forEach(id => { $(id).textContent = 'BRUITAGES : ' + (opts.bruit ? 'OUI' : 'NON'); });
    ['bMusiqueT', 'bMusique'].forEach(id => { $(id).textContent = 'MUSIQUE : ' + (opts.musique ? 'OUI' : 'NON'); });
    ecrire('opts', opts);
  }
  ['bBruitT', 'bBruit'].forEach(id => { $(id).onclick = () => { opts.bruit = !opts.bruit; majSons(); }; });
  ['bMusiqueT', 'bMusique'].forEach(id => { $(id).onclick = () => { opts.musique = !opts.musique; majSons(); }; });
  majSons();
  $('bContinuer').onclick = continuer;
  $('bJour').onclick = ducheDuJour;
  $('bLibre').onclick = () => montrer('eNiveau');
  $('bFacile').onclick = () => partieLibre('facile');
  $('bNormal').onclick = () => partieLibre('normal');
  $('bNiveauRetour').onclick = () => montrer('eTitre');
  $('bAide').onclick = () => { retourAide = 'eTitre'; montrer('eAide'); };
  $('bAideRetour').onclick = () => montrer(retourAide);
  $('bReprendre').onclick = () => montrer(null);
  $('bAideP').onclick = () => { retourAide = 'ePause'; montrer('eAide'); };
  $('bTitreP').onclick = () => { sauver(); titre(); };
  $('bAbandon').onclick = () => {
    const b = $('bAbandon');
    if (b.dataset.sur !== '1') { b.dataset.sur = '1'; b.textContent = 'ABDIQUER : SUR ?'; return; }
    b.dataset.sur = ''; b.textContent = 'ABDIQUER';
    etat.fin = { type: 'defaite', raison: 'Vous avez abdiqué.', tour: etat.tour }; etat.evt = null;
    montrer(null); finir();
  };
  $('bRejouer').onclick = () => { if (etat && etat.mode === 'libre') partieLibre(etat.niveau); else titre(); };
  $('bTitreF').onclick = titre;
  function pause() { $('bAbandon').dataset.sur = ''; $('bAbandon').textContent = 'ABDIQUER'; montrer('ePause'); }

  // ---------- fin de partie ----------
  const TITRES_FIN = { conquete: 'VICTOIRE !', couronne: 'COURONNE !', defaite: 'DEFAITE', regne: 'FIN DU REGNE', rival: 'UN AUTRE ROI' };
  function finir() {
    const f = etat.fin, sc = ducScore(etat);
    $('fTitre').textContent = TITRES_FIN[f.type] || 'FIN';
    $('fRaison').textContent = f.raison || (f.type === 'regne' ? 'Trente saisons ont passé. Votre règne s\'achève.' : '');
    $('fLignes').innerHTML = sc.lignes.map(([l, p]) => `<tr><td>${l}</td><td>${p >= 0 ? '' : '−'}${Math.abs(p)}</td></tr>`).join('') + `<tr class="total"><td>SCORE</td><td>${sc.total}</td></tr>`;
    const st = etat.stats;
    $('fFaits').textContent = `${st.prises} terre${st.prises > 1 ? 's' : ''} prise${st.prises > 1 ? 's' : ''} · ${st.rivauxTombes} rival${st.rivauxTombes > 1 ? 'aux' : ''} tombé${st.rivauxTombes > 1 ? 's' : ''} · légitimité au plus haut : ${st.picLeg} · tour ${f.tour}`;
    $('fRang').hidden = true;
    sauver();
    DucSons.jouer(f.type === 'couronne' ? 'couronne' : f.type === 'conquete' ? 'victoire' : f.type === 'defaite' || f.type === 'rival' ? 'defaite' : 'cloche');
    $('fInfo').textContent = (infoFin || (etat.mode === 'rejeu' ? 'Partie hors classement.' : '')).trim();
    $('bRejouer').hidden = etat.mode !== 'libre';
    montrer('eFin');
  }

  // ---------- aides de calcul ----------
  function prodTerre(i) {
    const t = etat.terres[i], T = DUC_TERRAINS[t.t], p = { nour: (t.t === 'plaine' ? ducNiveau(etat).plaine : T.nour) * t.qual, bois: T.bois * t.qual, or: T.or * t.qual, leg: 0 };
    if (t.bat) for (const x in DUC_BATIMENTS[t.bat].prod) p[x] += DUC_BATIMENTS[t.bat].prod[x];
    return p;
  }
  const texteProd = p => [[p.nour, 'nourriture'], [p.bois, 'bois'], [p.or, 'or'], [p.leg, 'légitimité']].filter(x => x[0]).map(x => `${x[0]} ${x[1]}`).join(', ') || 'rien';
  const dispo = i => ducSources(etat, 0, i).reduce((a, v) => a + etat.terres[v].pret, 0);
  function sourcesPour(i, n) {
    const out = []; let reste = n;
    for (const v of ducSources(etat, 0, i).sort((a, b) => etat.terres[b].pret - etat.terres[a].pret)) { const x = Math.min(reste, etat.terres[v].pret); if (x > 0) { out.push({ i: v, n: x }); reste -= x; } }
    return out;
  }
  function alerte() {
    if (etat.tour === 1 && !lire('tuto', false)) return ['Touchez une terre voisine pour l\'attaquer, votre château pour recruter.', '#8ee070'];
    const p = ducProduction(etat, 0);
    if (J().nour + p.nour - p.entretien < 0) return ['Famine au prochain tour : nourrissez l\'armée !', '#f07060'];
    if (J().leg < 10) return ['Le peuple gronde : légitimité très basse.', '#f07060'];
    if (etat.roiMort) {
      const E = ducElecteur(etat);
      return [E ? `Couronne : ${J().votes}/5 votes · prochain : ${E.nom.toLowerCase()} (${DUC_CRITERES[E.crit]})` : `Couronne : ${J().votes}/5 votes · tous ont voté`, '#f0c24a'];
    }
    if (etat.tour < DUC_TOUR_ROI) return [`Le vieux roi vit encore (il mourra au tour ${DUC_TOUR_ROI}).`, '#c8b08a'];
    return ['', '#c8b08a'];
  }

  // ---------- boutons et textes (dessinés en bas, écrits en haut) ----------
  const T = (txt, x, y, o) => textes.push([txt, x, y, o]);
  function btn(x, y, w, h, style, fn, label, sous) {
    D.bouton(L, x, y, w, h, fn ? style : 'eteint');
    btns.push({ x, y, w, h, fn });
    if (label) T(label, x + w / 2, sous ? y + h / 2 - 4 : y + h / 2 + 0.5, { f: PS, s: label.length > 12 ? 4.6 : 5.5, a: 'center', w: '400', c: fn ? '#fff' : '#8a7a68' });
    if (sous) T(sous, x + w / 2, y + h / 2 + 6, { s: 7.5, a: 'center', c: fn ? '#f1e6d0' : '#8a7a68' });
  }
  function moinsPlus(x, y, val, min, max, set) {
    btn(x, y, 22, 20, 'normal', val > min ? () => set(val - 1) : null, '-');
    T(String(val), x + 41, y + 10.5, { f: PS, s: 7, a: 'center', w: '400' });
    btn(x + 60, y, 22, 20, 'normal', val < max ? () => set(val + 1) : null, '+');
  }

  // ---------- haut de l'écran ----------
  function hud() {
    D.plaque(L, 3, 3, 210, 32);
    [['ble', 8], ['bois', 46], ['or', 80], ['epee', 112]].forEach(([n, x]) => D.icone(L, n, x, 8));
    D.icone(L, 'couronne', 8, 23);
    const S = J(), lg = Math.max(0, Math.min(100, S.leg));
    r(L, 19, 23, 62, 7, '#120c08'); r(L, 20, 24, 60, 5, '#2a1a10'); r(L, 20, 24, Math.round(60 * lg / 100), 5, lg < 15 ? '#d04030' : '#e0b030'); r(L, 20, 24, Math.round(60 * lg / 100), 1, '#fff0a0');
    r(L, 20 + Math.round(60 * DUC_LEG_VOTE / 100), 23, 1, 7, '#fff6c0');
    T(String(S.nour), 17, 11.5, { s: 9 }); T(String(S.bois), 55, 11.5, { s: 9 }); T(String(S.or), 89, 11.5, { s: 9 });
    T(`${ducSoldats(etat, 0)}/${ducPlafond(etat, 0)}`, 121, 11.5, { s: 9 });
    T(String(S.leg), 85, 26.5, { s: 9, c: '#f0c24a' }); T(etat.roiMort ? `VOTES ${S.votes}/5` : 'LEGITIMITE', 101, 26.5, { s: 7, c: '#d8c09a' });
    T(`TOUR ${etat.tour}/30`, 208, 12, { f: PS, s: 5.5, a: 'right', c: '#f0c24a', w: '400' });
    T(`${ducSaison(etat.tour).toUpperCase()} · AN ${ducAn(etat.tour)}${etat.niveau === 'facile' ? ' · FACILE' : ''}`, 208, 26, { s: 7.5, a: 'right', c: '#d8c09a' });
  }

  // ---------- la carte et son panneau ----------
  function laBase() {
    const sig = etat.terres.map(t => t.prop + (t.bat || '') + t.t).join(',') + ducSaison(etat.tour);
    if (!base || sig !== baseSig) { base = D.carteFixe(etat); baseSig = sig; }
    return base;
  }
  function panneau() {
    const y0 = 266;
    D.plaque(L, 3, 250, 210, 13, 1); D.plaque(L, 3, y0, 210, 115);
    const recent = msg && tNow - msgT < 5;
    const [al, ac] = alerte();
    T(recent ? msg : al, 8, 256.5, { s: 7.5, c: recent ? '#e8d8b8' : ac });
    if (etat.fin) { btn(10, y0 + 84, 196, 22, 'fort', () => finir(), 'VOIR LE SCORE'); return; }
    if (ecran === 'rivaux') {
      T('LES RIVAUX JOUENT', 108, y0 + 12, { f: PS, s: 6, a: 'center', c: '#f0c24a', w: '400' });
      const st = rivaux.etapes[rivaux.i];
      if (st) D.lignes(g, k, st.txt, 190, { s: 8.5 }).slice(0, 3).forEach((l, j) => T(l, 108, y0 + 30 + j * 11, { s: 8.5, a: 'center', c: '#f1e6d0' }));
      btn(10, y0 + 84, 196, 22, 'normal', () => finRivaux(), 'PASSER');
      return;
    }
    if (etat.evt) {
      T('Un événement attend votre réponse.', 10, y0 + 12, { s: 8.5, c: '#f1e6d0' });
      btn(10, y0 + 84, 196, 22, 'fort', () => { voirCarte = false; ecran = 'evenement'; }, 'EVENEMENT');
      return;
    }
    if (mode === 'construire') return panneauConstruire(y0);
    if (mode === 'changer') return panneauChanger(y0);
    if (sel < 0) {
      const p = ducProduction(etat, 0);
      T('VOTRE DUCHE', 10, y0 + 10, { f: PS, s: 6.5, c: '#f0c24a', w: '400' });
      T(`${ducTerresDe(etat, 0).length} terres`, 206, y0 + 10, { s: 8.5, a: 'right', c: SEIG[0].c });
      T(`Par tour : +${p.nour} nourriture, +${p.bois} bois, +${p.or} or${p.leg ? ', +' + p.leg + ' légitimité' : ''}`, 10, y0 + 22, { s: 8, c: '#f1e6d0' });
      T(`Entretien de l'armée : ${p.entretien} nourriture`, 10, y0 + 32, { s: 8, c: '#c8b08a' });
      T('Touchez une terre pour agir.', 10, y0 + 45, { s: 8, c: '#c8b08a' });
    } else panneauTerre(y0);
    if (mode !== 'recruter' && mode !== 'deplacer') btn(10, y0 + 84, 196, 22, 'fort', finTour, 'FIN DU TOUR');
  }
  function panneauTerre(y0) {
    const i = sel, t = etat.terres[i], T0 = DUC_TERRAINS[t.t], o = t.prop;
    T(sansAccent(T0.nom), 10, y0 + 10, { f: PS, s: 6.5, c: '#f0c24a', w: '400' });
    g.font = '400 ' + 6.5 * k + 'px ' + PS; const wt = g.measureText(sansAccent(T0.nom)).width / k;
    T('◆'.repeat(t.qual), 13 + wt, y0 + 10, { s: 7, c: '#f0c24a' });
    T(o < 0 ? (t.gar ? (t.brig ? 'Brigands' : 'Milice') : 'Terre libre') : nomSeig(o), 206, y0 + 10, { s: 8.5, a: 'right', c: o >= 0 ? SEIG[o].c : '#c8b08a' });
    const def = ducDefense(etat, i);
    T((t.bat ? DUC_BATIMENTS[t.bat].nom + ' · ' : '') + 'rend ' + texteProd(prodTerre(i)), 10, y0 + 22, { s: 8, c: '#f1e6d0' });
    let l2 = `${t.gar ? t.gar + ' soldat' + (t.gar > 1 ? 's' : '') : 'aucun soldat'} · défense ${def}`;
    if (o > 0) { const S = etat.seigneurs[o]; l2 += ` · ${S.traits.map(x => DUC_TRAITS[x].nom).join(', ')} · légit. ${S.leg}${etat.roiMort ? ' · ' + S.votes + ' votes' : ''}`; }
    if (o === 0 && t.gar) l2 = `${t.gar} soldat${t.gar > 1 ? 's' : ''} (${t.pret} prêt${t.pret > 1 ? 's' : ''}) · défense ${def}`;
    T(l2, 10, y0 + 32, { s: 8, c: '#c8b08a' });
    const ay = y0 + 56;
    if (o === 0) {
      if (mode === 'recruter') {
        const max = ducRecruesMax(etat, 0, i), c = ducCoutRecrues(etat, 0, nb);
        T(max ? `Recruter ${nb} : −${c.nour} nourriture, −${c.or} or` : ducSoldats(etat, 0) >= ducPlafond(etat, 0) ? 'Plafond atteint : bâtissez une caserne.' : 'Pas assez de nourriture ou d\'or.', 10, y0 + 45, { s: 8.5, c: '#f1e6d0' });
        if (max) { moinsPlus(10, ay, nb, 1, max, v => { nb = v; }); btn(98, ay, 108, 20, 'fort', () => { if (agir(ducRecruter(etat, 0, i, nb), `${nb} recrue${nb > 1 ? 's' : ''} au ${t.bat === 'chateau' ? 'château' : 'quartier'}.`, 'recruter')) mode = null; }, 'RECRUTER'); }
        btn(10, y0 + 84, 196, 22, 'normal', () => { mode = null; }, 'RETOUR');
        return;
      }
      if (mode === 'deplacer') {
        if (dest < 0) T('Touchez une terre voisine à vous.', 10, y0 + 45, { s: 8.5, c: '#f1e6d0' });
        else {
          T(`Déplacer ${nb} soldat${nb > 1 ? 's' : ''} vers ${DUC_TERRAINS[etat.terres[dest].t].nom.toLowerCase()}`, 10, y0 + 45, { s: 8.5, c: '#f1e6d0' });
          moinsPlus(10, ay, nb, 1, t.pret, v => { nb = v; });
          btn(98, ay, 108, 20, 'fort', () => { const de = i, vers = dest, n2 = nb; if (agir(ducDeplacer(etat, 0, de, vers, n2), `${n2} soldat${n2 > 1 ? 's' : ''} en marche.`)) { marche = { de, vers, s: 0, t0: tNow }; sel = vers; mode = null; dest = -1; } }, 'DEPLACER');
        }
        btn(10, y0 + 84, 196, 22, 'normal', () => { mode = null; dest = -1; }, 'RETOUR');
        return;
      }
      const acts = [];
      if (!t.bat) acts.push(['CONSTRUIRE', () => { mode = 'construire'; }]);
      if (t.bat === 'chateau' || t.bat === 'caserne') acts.push(['RECRUTER', () => { mode = 'recruter'; nb = Math.max(1, Math.min(ducRecruesMax(etat, 0, i), 3)); }]);
      if (t.bat === 'marche') acts.push(['CHANGER', () => { mode = 'changer'; }]);
      acts.push(['DEPLACER', t.pret > 0 && DUC_VOISINS[i].some(v => etat.terres[v].prop === 0) ? () => { mode = 'deplacer'; dest = -1; nb = t.pret; } : null]);
      T(t.bat === 'chateau' ? 'Votre château : on y recrute.' : 'Votre terre.', 10, y0 + 45, { s: 8, c: '#c8b08a' });
      const w = Math.floor((196 - (acts.length - 1) * 4) / acts.length);
      acts.forEach(([lab, fn], j) => btn(10 + j * (w + 4), ay, w, 20, 'normal', fn, lab));
      return;
    }
    const err = ducPeutAttaquer(etat, 0, i), dsp = dispo(i);
    if (err || !dsp) { T(err === 'Vous êtes alliés.' ? `Allié de votre duché (jusqu'au tour ${etat.alliances[o].fin}).` : err ? 'Trop loin : attaquez une terre qui touche la vôtre.' : 'Vos soldats voisins ont déjà agi ce tour.', 10, y0 + 45, { s: 8, c: '#c8b08a' }); return; }
    nb = Math.max(1, Math.min(nb, dsp));
    const ap = ducApercu(etat, 0, i, nb), ch = Math.round(ap.chance * 100);
    T(`${nb} soldat${nb > 1 ? 's' : ''} contre ${ap.defense}`, 10, y0 + 45, { s: 8.5, c: '#f1e6d0' });
    T(`CHANCE ${ch} %`, 206, y0 + 45, { s: 9, a: 'right', c: ch >= 60 ? '#8ee070' : ch >= 40 ? '#f0c24a' : '#f07060' });
    moinsPlus(10, ay, nb, 1, dsp, v => { nb = v; });
    btn(98, ay, 108, 20, 'rouge', () => attaquer(i, nb), 'ATTAQUER');
  }
  const ORDRE_BAT = ['ferme', 'scierie', 'mine', 'marche', 'caserne', 'tour'];
  function panneauConstruire(y0) {
    const i = sel;
    T('CONSTRUIRE', 10, y0 + 10, { f: PS, s: 6.5, c: '#f0c24a', w: '400' });
    T(`${J().bois} bois · ${J().or} or`, 206, y0 + 10, { s: 8.5, a: 'right', c: '#c8b08a' });
    ORDRE_BAT.forEach((b, j) => {
      const x = 10 + (j % 2) * 100, y = y0 + 18 + Math.floor(j / 2) * 21, c = ducCoutBat(etat, b), ok = !ducPeutConstruire(etat, 0, i, b), B = DUC_BATIMENTS[b];
      btn(x, y, 96, 19, 'normal', ok ? () => { if (agir(ducConstruire(etat, 0, i, b), `${B.nom} bâti${b === 'ferme' || b === 'scierie' || b === 'mine' || b === 'caserne' || b === 'tour' ? 'e' : ''}.`, 'batir')) mode = null; } : null);
      T(B.nom, x + 5, y + 6, { s: 8, c: ok ? '#fff' : '#8a7a68' });
      T(`${c.bois} bois${c.or ? ' ' + c.or + ' or' : ''}`, x + 91, y + 6, { s: 7, a: 'right', c: ok ? '#f0c24a' : '#8a7a68' });
      T(B.effet.split(',')[0], x + 5, y + 13.5, { s: 6.5, c: ok ? '#e8d8b8' : '#7a6a58' });
    });
    btn(10, y0 + 84, 196, 22, 'normal', () => { mode = null; }, 'RETOUR');
  }
  function panneauChanger(y0) {
    T('MARCHE', 10, y0 + 10, { f: PS, s: 6.5, c: '#f0c24a', w: '400' });
    T(`${DUC_CHANGES - J().change} échange${DUC_CHANGES - J().change > 1 ? 's' : ''} ce tour`, 206, y0 + 10, { s: 8.5, a: 'right', c: '#c8b08a' });
    T(`${J().bois} bois · ${J().or} or`, 10, y0 + 24, { s: 8.5, c: '#f1e6d0' });
    const reste = J().change < DUC_CHANGES;
    btn(10, y0 + 40, 96, 30, 'normal', reste && J().bois >= 2 ? () => agir(ducChanger(etat, 0, 'or'), 'Vendu : 2 bois pour 1 or.', 'pieces') : null, 'VENDRE', '2 bois → 1 or');
    btn(110, y0 + 40, 96, 30, 'normal', reste && J().or >= 1 ? () => agir(ducChanger(etat, 0, 'bois'), 'Acheté : 2 bois pour 1 or.', 'pieces') : null, 'ACHETER', '1 or → 2 bois');
    btn(10, y0 + 84, 196, 22, 'normal', () => { mode = null; }, 'RETOUR');
  }
  function agir(res, texte, son) {
    if (!res || !res.ok) { dire(res ? res.raison : 'Impossible.'); return false; }
    dire(texte); DucSons.jouer(son || 'clic'); sauver();
    if (etat.fin) finir();
    return true;
  }

  // ---------- attaquer : la scène de combat ----------
  function attaquer(i, n) {
    const t = etat.terres[i], avant = { terrain: t.t, def: t.prop, brig: t.brig || t.prop < 0, garnison: t.gar, defense: ducDefense(etat, i) };
    const res = ducAttaquer(etat, 0, i, sourcesPour(i, n));
    if (!res.ok) { dire(res.raison); return; }
    combat = Object.assign({ i, t0: tNow, res, saison: ducSaison(etat.tour), passeSon: 0 }, avant);
    DucSons.jouer('tambour');
    sel = i; mode = null; ecran = 'combat'; sauver();
  }
  function finCombat() {
    const c = combat; combat = null; ecran = 'carte';
    clignote = { i: c.i, c: c.res.gagne ? SEIG[0].c : '#f07060', t0: tNow };
    dire(c.res.gagne ? (c.res.elimine > 0 ? `${etat.seigneurs[c.res.elimine].nom} est tombé ! +30 légitimité.` : `Victoire ! ${c.res.n - c.res.pertesA} soldat${c.res.n - c.res.pertesA > 1 ? 's' : ''} tiennent la terre.`) : `Défaite : ${c.res.n} soldat${c.res.n > 1 ? 's' : ''} perdu${c.res.n > 1 ? 's' : ''}.`);
    if (etat.fin) finir();
  }
  const UW = W, UH = 200, SY = 37;
  const posC = (s, i) => { const j = i % 15, a = Math.floor(j / 5), d = j % 5, x = UW / 2 - (32 + a * 13 + (d % 2) * 4) * (0.84 + d * 0.04); return { x: Math.round(s ? UW - x : x), y: Math.round(UH * (0.58 + d * 0.085)), a, d }; };
  const ordreC = n => [...Array(n).keys()].sort((i, j) => posC(0, i).a - posC(0, j).a || D.hash(i) - D.hash(j));
  const OA = ordreC(15);
  function dessinerCombat() {
    const c = combat, t = tNow - c.t0, R = c.res, fini = t >= 6.2;
    const passe = t < 1.6 ? 0 : Math.min(3, 1 + Math.floor((t - 1.6) / 1.5)), ph = t < 1.6 ? 0 : ((t - 1.6) % 1.5) / 1.5;
    if (passe > c.passeSon && !fini) { c.passeSon = passe; DucSons.jouer('epee'); }
    if (fini && c.passeSon < 9) { c.passeSon = 9; DucSons.jouer(R.gagne ? 'victoire' : 'defaite'); }
    const na = R.n - Math.round(R.pertesA * passe / 3), nd = c.garnison - Math.round(R.pertesD * passe / 3);
    D.plaque(L, 0, 0, W, H); hud(); D.plaque(L, 3, 240, 210, 104);
    const bar = (x, y, w, n, max, col, dir) => { r(L, x, y, w, 9, '#120c08'); r(L, x + 1, y + 1, w - 2, 7, '#2a1a10'); const ww = Math.round((w - 2) * n / Math.max(1, max)); r(L, dir > 0 ? x + 1 : x + w - 1 - ww, y + 1, ww, 7, col); r(L, dir > 0 ? x + 1 : x + w - 1 - ww, y + 1, ww, 1, 'rgba(255,255,255,.4)'); };
    const colD = c.def > 0 ? SEIG[c.def].c : '#a09888', mx = Math.max(R.n, c.garnison, 1);
    bar(10, 262, 94, na, mx, SEIG[0].c, 1); bar(112, 262, 94, nd, mx, colD, -1);
    for (let j = 0; j < 3; j++) { r(L, 84 + j * 18, 300, 10, 10, '#120c08'); r(L, 85 + j * 18, 301, 8, 8, j < passe ? '#f0c24a' : '#4a3018'); }
    btn(10, 350, 196, 22, fini ? 'fort' : 'normal', fini ? finCombat : () => { c.t0 = tNow - 6.2; }, fini ? 'CONTINUER' : 'PASSER');
    // la scène, à pleine résolution
    g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, W * k, H * k);
    const fond = D.fondCombat(UW, UH, 3, c.terrain, c.saison), avantPlan = D.avantCombat(UW, UH, 3, c.saison);
    g.drawImage(fond, 0, SY * k, W * k, UH * k);
    g.save(); g.beginPath(); g.rect(0, SY * k, W * k, UH * k); g.clip(); g.translate(0, SY * k); g.scale(k, k); g.imageSmoothingEnabled = false;
    const ta = lent ? 3.9 : tNow;
    g.save(); g.globalCompositeOperation = 'lighter'; for (let j = 0; j < 3; j++) { g.fillStyle = `rgba(255,236,190,${0.045 + 0.025 * Math.sin(ta * 0.7 + j * 2)})`; g.beginPath(); g.moveTo(UW * 0.8, UH * 0.12); g.lineTo(UW * (0.02 + j * 0.22), UH); g.lineTo(UW * (0.12 + j * 0.22), UH); g.fill(); } g.restore();
    let av; if (t < 1.6) av = t / 1.6; else if (fini) av = 1; else av = 0.82 + 0.18 * Math.cos(ph * Math.PI * 2);
    const dec = av * 15, gagneA = fini && R.gagne, gagneD = fini && !R.gagne;
    // 1 soldat = 3 figurines (15 au plus de chaque côté)
    const figA = Math.min(15, R.n * 3), figD = Math.min(15, c.garnison * 3);
    const vivA = Math.round(figA * na / Math.max(1, R.n)), vivD = c.garnison ? Math.round(figD * nd / c.garnison) : 0;
    const typeD = c.def > 0 ? 'soldat' : 'brigand', SD = c.def > 0 ? SEIG[c.def] : null;
    [0, 1].forEach(s => {
      const p = posC(s, 12);
      if (s === 0 && !gagneD) D.banniereD(g, p.x - 6 + dec * 0.6, p.y - 4, 1, SEIG[0].c, SEIG[0].f, 'couronne', '#7a1a10', ta, false);
      if (s === 1 && figD && !gagneA) { if (SD) D.banniereD(g, p.x + 6 - dec * 0.6, p.y - 4, -1, SD.c, SD.f, SD.em, SD.emc, ta + 1, false); else D.banniereD(g, p.x + 6 - dec * 0.6, p.y - 4, -1, '#3a3430', '#1a1614', 'crane', '#e8e0d0', ta + 1, true); }
    });
    const items = [], OD = ordreC(figD);
    for (let j = 0; j < figA; j++) items.push({ s: 0, i: j, vivant: OA.indexOf(j) < vivA, ...posC(0, j) });
    for (let j = 0; j < figD; j++) items.push({ s: 1, i: j, vivant: OD.indexOf(j) < vivD, ...posC(1, j) });
    items.sort((a, b) => a.y - b.y);
    items.forEach(it => {
      const dir = it.s ? -1 : 1, type = it.s ? typeD : 'soldat', col = it.s ? (SD ? SD.c : '#888') : SEIG[0].c, colf = it.s ? (SD ? SD.f : '#444') : SEIG[0].f;
      let x = it.x + dir * (it.vivant ? dec : 15), y = it.y;
      if (!it.vivant) { g.drawImage(D.spriteD(it.s, type, 'mort', it.i % 6, col, colf), Math.round(x - 15), Math.round(y - 12)); return; }
      if (t < 1.6 || (!fini && ph > 0.3)) y -= Math.floor(ta * 7 + it.i) % 2;
      if (fini && ((it.s === 0 && gagneA) || (it.s === 1 && gagneD))) y -= Math.max(0, Math.sin(ta * 8 + it.i)) > 0.7 ? 2 : 0;
      const pose = fini ? 'garde' : (it.a === 0 && av > 0.85 ? 'charge' : 'garde');
      g.drawImage(D.spriteD(it.s, type, pose, it.i % 6, col, colf), Math.round(x - 14), Math.round(y - 26));
    });
    if (!fini && t >= 1.6 && ph < 0.3) {
      const kk = ph / 0.3;
      for (let j = 0; j < 14; j++) { const yy = UH * (0.58 + (j % 5) * 0.085) - 14, a = D.hash(j + Math.floor(ta * 10)) * 6.28, Rr = 2 + kk * 12; g.fillStyle = j % 2 ? '#fff6c0' : '#ffb040'; g.fillRect(UW / 2 + Math.cos(a) * Rr, yy + Math.sin(a) * Rr * 0.6, 1, 1); }
      g.save(); g.filter = 'blur(2px)'; for (let j = 0; j < 5; j++) { g.fillStyle = `rgba(200,180,140,${0.45 * (1 - kk)})`; g.beginPath(); g.arc(UW / 2 + (j - 2) * 8, UH * (0.62 + j * 0.07) - kk * 8, 4 + kk * 8, 0, 7); g.fill(); } g.restore();
    }
    g.restore();
    g.drawImage(avantPlan, 0, SY * k, W * k, UH * k);
    const nomD = c.def > 0 ? etat.seigneurs[c.def].nom.toUpperCase() : c.garnison ? (c.brig ? 'BRIGANDS' : 'MILICE') : 'TERRE LIBRE';
    T(fini ? (R.gagne ? 'VICTOIRE !' : 'DEFAITE...') : 'ATTAQUE · ' + sansAccent(DUC_TERRAINS[c.terrain].nom), 108, 48, { f: PS, s: fini ? 8 : 6, a: 'center', c: fini && !R.gagne ? '#f07060' : '#f0c24a', w: '400' });
    T('VOTRE DUCHE', 10, 252, { s: 8.5, c: SEIG[0].c }); T(String(na), 104, 252, { f: PS, s: 7, a: 'right', w: '400' });
    T(nomD, 206, 252, { s: 8.5, a: 'right', c: c.def > 0 ? colD : '#c8c0b0' }); T(String(nd), 112, 252, { f: PS, s: 7, w: '400' });
    T(`${R.n} soldat${R.n > 1 ? 's' : ''} contre ${c.garnison} + défense de la terre (${c.defense - c.garnison})`, 108, 282, { s: 8, a: 'center', c: '#c8b08a' });
    T(fini ? (R.gagne ? `TERRE PRISE · PERTES ${R.pertesA}` : `REPOUSSES · PERTES ${R.n}`) : passe ? `PASSE ${passe}/3` : `CHANCE ${Math.round(R.chance * 100)} %`, 108, 320, { f: PS, s: 5, a: 'center', c: '#d8c09a', w: '400' });
    T(fini && R.elimine > 0 ? `${etat.seigneurs[R.elimine].nom} est tombé ! +30 légitimité` : 'Le perdant perd tous ses soldats engagés.', 108, 334, { s: 7.5, a: 'center', c: fini && R.elimine > 0 ? '#8ee070' : '#a8906a' });
  }

  // ---------- fin du tour : les rivaux jouent ----------
  function finTour() {
    if (etat.evt) { ecran = 'evenement'; return; }
    DucSons.jouer('tambour'); if (etat.tour === 1) ecrire('tuto', true);
    const n0 = etat.journal.length, tour = etat.tour;
    ducFinTour(etat);
    sel = -1; mode = null; marche = null;
    const etapes = [];
    for (const cp of etat.coupsRivaux || []) {
      const de = DUC_VOISINS[cp.cible].find(v => etat.terres[v].prop === cp.s), S = etat.seigneurs[cp.s];
      const qui = cp.def < 0 ? 'une terre libre' : cp.def === 0 ? 'vous' : etat.seigneurs[cp.def].nom;
      if (cp.def !== 0 && !cp.gagne) continue;   // on ne montre pas leurs échecs entre eux
      etapes.push({ de: de == null ? cp.cible : de, vers: cp.cible, s: cp.s, txt: cp.def === 0 ? `${S.nom} vous attaque${cp.gagne ? ' et prend une terre !' : ' : repoussé !'}` : `${S.nom} prend ${cp.def < 0 ? 'une terre libre' : 'une terre à ' + qui}.`, perte: cp.def === 0 && cp.gagne });
    }
    etat.journal.slice(n0).forEach(j => { if (!/attaque|prend une terre/.test(j.txt) && j.tour === tour) etapes.push({ txt: j.txt }); });
    const neufs = etat.journal.slice(n0).filter(j => j.tour !== tour);
    sauver();
    if (!etapes.length) return apresRivaux(neufs);
    rivaux = { etapes, i: 0, t0: tNow, neufs };
    ecran = 'rivaux';
  }
  function finRivaux() { const n = rivaux.neufs; rivaux = null; apresRivaux(n); }
  function apresRivaux(neufs) {
    ecran = 'carte';
    if (etat.fin) { finir(); return; }
    dire(neufs.length ? neufs[neufs.length - 1].txt : `${ducSaison(etat.tour)[0].toUpperCase() + ducSaison(etat.tour).slice(1)} de l'an ${ducAn(etat.tour)}.`);
    if (etat.evt) { ecran = 'evenement'; DucSons.jouer('cloche', 0.3); }
  }

  // ---------- événement ----------
  function dessinerEvenement() {
    const E = DUC_EVENEMENTS[etat.evt.id], ch = ducChoix(etat);
    L.globalAlpha = 0.6; r(L, 0, 0, W, H, '#0a0604'); L.globalAlpha = 1;
    D.parchemin(L, 8, 42, 200, 338);
    const IX = 18, IY = 76, IW = 180, IH = 100;
    const ys = [236, 270, 304];
    ch.forEach((c, j) => btn(20, ys[j], 176, 30, j === 0 ? 'fort' : j === 1 ? 'rouge' : 'normal', c.ok ? () => repondre(c.k) : null, sansAccent(c.txt), c.detail || ' '));
    btn(20, 344, 176, 20, 'normal', () => { voirCarte = true; ecran = 'carte'; }, 'VOIR LA CARTE');
    g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, W * k, H * k);
    const cleIll = etat.evt.id + ducSaison(etat.tour) + k;
    if (!dessinerEvenement.ill || dessinerEvenement.cle !== cleIll) { dessinerEvenement.ill = D.illustration(etat.evt.id, ducSaison(etat.tour), IW, IH, 3); dessinerEvenement.cle = cleIll; }
    g.drawImage(dessinerEvenement.ill, IX * k, IY * k, IW * k, IH * k);
    g.save(); g.beginPath(); g.rect(IX * k, IY * k, IW * k, IH * k); g.clip(); g.translate(IX * k, IY * k); g.scale(k, k); g.imageSmoothingEnabled = false;
    D.figurantsIllustration(g, etat.evt.id, lent ? 3.9 : tNow, IW, IH, etat.evt.d && etat.evt.d.r != null ? etat.evt.d.r : 0);
    g.restore();
    g.strokeStyle = '#5a3a1e'; g.lineWidth = k; g.strokeRect(IX * k - k / 2, IY * k - k / 2, IW * k + k, IH * k + k);
    T(`EVENEMENT · TOUR ${etat.tour}`, 108, 54, { f: PS, s: 5, a: 'center', c: '#8a5a20', w: '400', ombre: false });
    T(sansAccent(E.titre), 108, 66, { f: PS, s: 7, a: 'center', c: '#5a2a10', w: '400', ombre: false });
    let texte = E.texte, d = etat.evt.d;
    if (d && d.r != null) texte += ` (${etat.seigneurs[d.r].nom})`;
    if (etat.evt.id === 'revolte') texte += ` ${d.n} révoltés tiennent la campagne.`;
    D.lignes(g, k, texte, 176, { s: 8.5 }).slice(0, 4).forEach((l, j) => T(l, 108, 188 + j * 10.5, { s: 8.5, a: 'center', c: '#3e2610', ombre: false }));
  }
  function repondre(kk) {
    const res = ducRepondre(etat, kk);
    if (!res.ok) { dire(res.raison); return; }
    dire(res.msg); ecran = 'carte'; voirCarte = false; sauver();
    if (etat.fin) finir();
  }

  // ---------- dessin d'une image ----------
  function dessiner() {
    btns = []; textes = [];
    const ta = lent ? 3.9 : tNow;
    if (ecran === 'titre') {
      if (apercu) {
        if (!base || baseSig !== 'apercu') { base = D.carteFixe(apercu); baseSig = 'apercu'; }
        L.drawImage(base, 0, 0); D.carteAnimee(L, ta, apercu, base, {});
        L.globalAlpha = 0.35; r(L, 0, 0, W, H, '#0a0604'); L.globalAlpha = 1;
      } else r(L, 0, 0, W, H, '#14110d');
      g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, W * k, H * k);
      return;
    }
    if (!etat) return;
    if (ecran === 'evenement' && !etat.evt) ecran = 'carte';
    if (ecran === 'combat' && combat) { dessinerCombat(); return ecrireTextes(); }
    const B = laBase();
    L.drawImage(B, 0, 0);
    const o = { sel: ecran === 'carte' ? sel : -1 };
    if (ecran === 'carte' && sel >= 0 && etat.terres[sel].prop !== 0 && !etat.evt && !ducPeutAttaquer(etat, 0, sel) && dispo(sel)) o.fleches = ducSources(etat, 0, sel).map(v => [v, sel]);
    if (mode === 'deplacer' && sel >= 0) { o.cibles = DUC_VOISINS[sel].filter(v => etat.terres[v].prop === 0); if (dest >= 0) o.fleches = [[sel, dest]]; }
    if (marche && tNow - marche.t0 < 1) o.marche = marche;
    if (clignote && tNow - clignote.t0 < 1.6) o.clignote = clignote;
    if (ecran === 'rivaux') {
      const st = rivaux.etapes[rivaux.i];
      if (st && st.vers != null) { o.fleches = [[st.de, st.vers, SEIG[st.s].c]]; o.clignote = { i: st.vers, c: SEIG[st.s].c }; }
      if (tNow - rivaux.t0 > (st && st.vers != null ? 1.4 : 1.8)) { rivaux.i++; rivaux.t0 = tNow; if (rivaux.i >= rivaux.etapes.length) { finRivaux(); } }
    }
    const ecus = D.carteAnimee(L, ta, etat, B, o);
    hud();
    // bouton de pause, dans la mer en haut à droite
    D.plaque(L, 190, 40, 22, 15); D.icone(L, 'pause', 198, 45); btns.push({ x: 188, y: 38, w: 26, h: 19, fn: pause });
    if (ecran === 'evenement' && etat.evt) { dessinerEvenement(); ecus.length = 0; }
    else panneau();
    if (ecran !== 'evenement') { g.imageSmoothingEnabled = false; g.drawImage(low, 0, 0, W * k, H * k); }
    ecus.forEach(([x, y, n2]) => T(String(n2), x, y + 0.5, { s: 9, a: 'center' }));
    ecrireTextes();
  }
  function ecrireTextes() { textes.forEach(([txt, x, y, o]) => D.Tx(g, k, txt, x, y, o)); }

  // ---------- gestes ----------
  cv.addEventListener('pointerdown', e => {
    if (ecran === 'titre' || !etat) return;
    const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * W, y = (e.clientY - b.top) / b.height * H;
    for (const bt of btns) if (x >= bt.x && x < bt.x + bt.w && y >= bt.y && y < bt.y + bt.h) { if (bt.fn) bt.fn(); return; }
    if (ecran === 'rivaux') { rivaux.i++; rivaux.t0 = tNow; if (rivaux.i >= rivaux.etapes.length) finRivaux(); return; }
    if (ecran !== 'carte' || y < 38 || y > 248) return;
    const i = D.versCase(x, y);
    if (mode === 'deplacer' && sel >= 0 && i >= 0 && DUC_VOISINS[sel].includes(i) && etat.terres[i].prop === 0) { dest = i; nb = etat.terres[sel].pret; return; }
    mode = null; dest = -1;
    if (i < 0 || i === sel) { sel = -1; return; }
    sel = i;
    if (etat.terres[i].prop !== 0 && !ducPeutAttaquer(etat, 0, i)) nb = dispo(i);
  });

  // ---------- taille et boucle ----------
  function taille() {
    const box = $('jeu').getBoundingClientRect(), dpr = Math.min(3, window.devicePixelRatio || 1);
    let cw = box.width, ch = box.height;
    if (ch / cw > H / W) ch = cw * H / W; else cw = ch * W / H;
    cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    k = cv.width / W;
    dessinerEvenement.ill = null;
  }
  addEventListener('resize', taille);
  let dernier = 0;
  function boucle(now) {
    tNow = (now - t0) / 1000;
    if (now - dernier > 45) { dernier = now; try { dessiner(); } catch (err) { console.error(err); } }
    requestAnimationFrame(boucle);
  }
  const polices = document.fonts ? Promise.all(["10px 'Press Start 2P'", '700 10px Rajdhani', '500 10px Rajdhani'].map(x => document.fonts.load(x))).catch(() => {}) : Promise.resolve();
  taille(); titre();
  if (location.hash === '#jour') ducheDuJour();
  polices.then(() => requestAnimationFrame(boucle));
  document.addEventListener('visibilitychange', () => { if (document.hidden) sauver(); });

  // pour les tests (outils/logique.js, fumee.js)
  window.Duche = {
    etat: () => etat, ecran: () => ecran, mode: () => mode, sel: () => sel,
    libre: niveau => partieLibre(niveau || 'normal'), jour: ducheDuJour, continuer, titre,
    choisir: i => { sel = i; mode = null; dest = -1; if (i >= 0 && etat.terres[i].prop !== 0 && !ducPeutAttaquer(etat, 0, i)) nb = dispo(i); },
    attaquer, finTour, repondre, finCombat: () => { if (combat) finCombat(); }, passerRivaux: () => { if (rivaux) finRivaux(); },
    construire: (i, b) => agir(ducConstruire(etat, 0, i, b), 'ok'), recruter: (i, n) => agir(ducRecruter(etat, 0, i, n), 'ok'),
  };
})();

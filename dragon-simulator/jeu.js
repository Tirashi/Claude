/* =====================================================================
   DRAGON SIMULATOR · le JEU : écrans (titre avec démo, nid, partie,
   pause, bilan), commandes, HUD, sauvegarde, boucle à 60 images par
   seconde. Les règles sont dans regles.js, la 3D dans monde3d.js, les
   sons dans sons.js. Cahier des charges : specs/dragon-simulator.md.
   Sauvegarde : localStorage dragonsim.sauvegarde (JSON, dsMigrer),
   dragonsim.record (plus grande distance), dragonsim.son.
   Pour les tests : window.DragonSim.
   ===================================================================== */
'use strict';
(function () {
  const $ = id => document.getElementById(id);
  const CLE = 'dragonsim.sauvegarde', CLE_SON = 'dragonsim.son';
  let sauv = dsNouvelleSauvegarde();
  try { sauv = dsMigrer(JSON.parse(localStorage.getItem(CLE) || 'null')); } catch (e) { /* sauvegarde illisible : on repart de zéro */ }
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(sauv)); localStorage.setItem('dragonsim.record', String(sauv.records.distance)); } catch (e) { /* stockage plein ou interdit */ } }
  let son = true; try { son = localStorage.getItem(CLE_SON) !== '0'; } catch (e) { /* rien */ }
  DsSons.actif = son;

  let monde = null, p = null, mode = 'charge', ailes = false, feuTenu = false, finT = 0, bilan = null, annT = 0, aideT = 0, demoN = 0, hudCache = '';
  const graine = () => Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36);

  /* ---------- écrans ---------- */
  const ECRANS = ['eTitre', 'eNid', 'ePause', 'eBilan', 'hud', 'bPause', 'bFeu', 'aide', 'annonce'];
  function montrer(...ids) { for (const id of ECRANS) $(id).hidden = !ids.includes(id); }
  function annoncer(t) { $('annonce').textContent = t; $('annonce').hidden = false; annT = 120; }
  function majSon() { for (const id of ['bSonT', 'bSonP']) $(id).textContent = 'SON : ' + (son ? 'OUI' : 'NON'); }
  function basculerSon() { son = !son; try { localStorage.setItem(CLE_SON, son ? '1' : '0'); } catch (e) { /* rien */ } DsSons.demarrer(); DsSons.regler(son); majSon(); }

  function titre() {
    mode = 'titre'; montrer('eTitre'); DsSons.feu(false);
    const r = sauv.records;
    $('tRecord').innerHTML = r.distance ? `RECORD : ${r.distance} M<br>MEILLEURE PARTIE : ${r.pieces} PIECES` : 'UN DRAGON, UNE VILLE,<br>ET BEAUCOUP DE FEU !';
    demo();
  }
  function demo() {
    const s = dsNouvelleSauvegarde(); s.niv = { ecailles: 3, flammes: 3, reserve: 3, ailes: 3 }; s.depart = DS_BIOMES[demoN++ % DS_BIOMES.length];
    p = dsNouvellePartie(s, graine()); p.lancer = 1; monde.preparer(p); finT = 0;
  }
  function allerNid() {
    mode = 'nid'; montrer('eNid'); DsSons.feu(false);
    p = dsNouvellePartie(sauv, graine()); monde.preparer(p); majNid();
  }
  function construireNid() {
    const box = $('nAmels');
    for (const a of DS_AMELIORATIONS) {
      const d = document.createElement('div'); d.className = 'amel'; d.dataset.id = a.id;
      d.innerHTML = `<b>${a.nom}</b><small>${a.aide.charAt(0) + a.aide.slice(1).toLowerCase()}</small><span class="pips">${'<i></i>'.repeat(DS_NIV_MAX)}</span><button type="button"></button>`;
      d.querySelector('button').addEventListener('click', () => {
        if (!dsAcheter(sauv, a.id)) return; sauver(); DsSons.demarrer(); DsSons.jouer('achat');
        p.s = dsStats(sauv.niv); p.coeurs = p.s.coeurs; p.feu = p.s.feuMax;                   // le dragon du nid profite tout de suite de l'achat
        monde.etincelles(p.d.x / DS_U, (DS_SOL - p.d.y) / DS_U, 0xffd25a, 30); majNid();
      });
      box.appendChild(d);
    }
  }
  function majNid() {
    $('nPieces').textContent = '● ' + sauv.pieces;
    for (const d of $('nAmels').children) {
      const n = sauv.niv[d.dataset.id], c = dsPrix(sauv, d.dataset.id), b = d.querySelector('button');
      d.querySelectorAll('.pips i').forEach((x, i) => x.classList.toggle('on', i < n));
      if (c === null) { b.textContent = 'MAX'; b.disabled = true; } else { b.textContent = '+1 : ' + c + ' ●'; b.disabled = sauv.pieces < c; }
    }
    const dec = $('nDecors'); dec.innerHTML = '';
    for (const bi of DS_BIOMES) {
      const ok = sauv.decors.includes(bi), bt = document.createElement('button'); bt.type = 'button';
      bt.textContent = ok ? DS_NOM_BIOME[bi].replace(/^LA |^L'/, '') : '? ' + (DS_BIOMES.indexOf(bi) * DS_LONG_BIOME / DS_PX_M) + ' M';
      bt.disabled = !ok; bt.classList.toggle('choisi', bi === sauv.depart);
      bt.addEventListener('click', () => { if (sauv.depart === bi) return; sauv.depart = bi; sauver(); DsSons.jouer('bouton'); p = dsNouvellePartie(sauv, graine()); monde.preparer(p); majNid(); });
      dec.appendChild(bt);
    }
  }
  function envol() {
    DsSons.demarrer(); DsSons.musique(true);
    mode = 'jeu'; ailes = feuTenu = false; $('bFeu').classList.remove('on');
    montrer('hud', 'bPause', 'bFeu', 'aide'); aideT = sauv.total.parties < 3 ? 600 : 300;
    annoncer(DS_NOM_BIOME[p.biome]); hudCache = '';
  }
  function pause() { if (mode !== 'jeu') return; mode = 'pause'; feuTenu = false; $('bFeu').classList.remove('on'); DsSons.feu(false); $('ePause').hidden = false; }
  function reprendre() { mode = 'jeu'; $('ePause').hidden = true; dern = performance.now(); }
  function abandon() { p.fin = 'abandon'; dsTerminer(sauv, p); sauver(); allerNid(); }
  function finir() {
    mode = 'fin'; finT = 0; feuTenu = false; DsSons.feu(false);
    bilan = dsTerminer(sauv, p); sauver();
    $('bFeu').hidden = $('aide').hidden = $('bPause').hidden = true;
  }
  function montrerBilan() {
    const b = bilan, L = [];
    $('bTitre').textContent = b.raison === 'chute' ? 'AIE !' : 'ATTERRI !';
    L.push(`${b.distance} M`, `<span class="or">+${b.pieces} PIECES</span>`, `${b.batiments} BATIMENT${b.batiments > 1 ? 'S' : ''} BRULE${b.batiments > 1 ? 'S' : ''}`);
    if (b.recordDistance) L.push('<span class="nouveau">RECORD DE DISTANCE !</span>');
    else L.push(`RECORD : ${sauv.records.distance} M`);
    for (const d of b.nouveauxDecors) L.push(`<span class="nouveau">NOUVEAU DEPART :<br>${DS_NOM_BIOME[d]} !</span>`);
    $('bLignes').innerHTML = L.join('<br>'); $('eBilan').hidden = false;
    if (b.recordDistance || b.nouveauxDecors.length) DsSons.jouer('record');
  }

  /* ---------- HUD ---------- */
  function majHud() {
    if (mode !== 'jeu' && mode !== 'fin') return;
    const s = p.s, sec = n => Math.ceil(n / DS_IPS) + 'S';
    $('hDist').textContent = Math.floor(p.dist) + ' M';
    const c = Math.max(0, p.coeurs); $('hCoeurs').textContent = '♥'.repeat(c) + '♡'.repeat(Math.max(0, s.coeurs - c));
    $('hPieces').textContent = '● ' + p.pieces;
    $('hEnergie').style.width = p.energie + '%'; $('hFeu').style.width = (100 * p.feu / s.feuMax) + '%';
    const a = [];
    if (p.gren) a.push(['#9fe08a', 'GRENADE' + (p.gren > 1 ? ' X' + p.gren : '')]);
    if (p.bouclier) a.push(['#8fd8ff', 'BOUCLIER']);
    if (p.jet > 0) a.push(['#8fe0ff', 'JETPACK ' + sec(p.jet)]);
    if (p.souffle > 0) a.push(['#ff6a3a', 'SUPER-SOUFFLE ' + sec(p.souffle)]);
    if (p.bebe > 0) a.push(['#ffb06a', 'BEBE ' + sec(p.bebe)]);
    if (p.aimant > 0) a.push(['#ff8a9a', 'AIMANT ' + sec(p.aimant)]);
    if (p.oeuf > 0) a.push(['#ffd25a', 'PIECES X2 ' + sec(p.oeuf)]);
    const h = a.map(([c2, t]) => `<span style="color:${c2}">${t}</span>`).join('');
    if (h !== hudCache) { $('hActifs').innerHTML = h; hudCache = h; }
    const bf = $('bFeu'); bf.classList.toggle('vide', p.feu <= 0 && p.souffle <= 0); bf.classList.toggle('fort', p.souffle > 0);
  }

  /* ---------- une image des règles ---------- */
  function pas() {
    if (annT > 0 && --annT === 0) $('annonce').hidden = true;
    if (mode === 'titre') {
      dsPas(p, dsPilote(p, 1, Math.random)); monde.pas(p);
      if (p.fin && ++finT > 120) demo();
    } else if (mode === 'nid') monde.pas(p);
    else if (mode === 'jeu' || mode === 'fin') {
      dsPas(p, { ailes, feu: feuTenu }); ailes = false;
      monde.pas(p); DsSons.evenements(p); DsSons.feu(!!p.flamme, p.souffle > 0);
      for (const e of p.ev) if (e.t === 'biome') annoncer(DS_NOM_BIOME[e.b] + ' !');
      if (aideT > 0 && --aideT === 0) $('aide').hidden = true;
      if (mode === 'jeu' && p.fin) finir();
      else if (mode === 'fin' && ++finT === 80) montrerBilan();
    }
  }
  let dern = performance.now(), acc = 0;
  function boucle(now) {
    requestAnimationFrame(boucle);
    const dt = Math.min(0.1, Math.max(0, (now - dern) / 1000)); dern = now;
    if (!monde || mode === 'pause' || mode === 'charge') return;
    acc += dt; let n = 0;
    while (acc >= 1 / DS_IPS && n < 4) { acc -= 1 / DS_IPS; n++; pas(); }
    if (n === 4) acc = 0;
    monde.dessiner(p, dt, mode === 'nid' ? 'nid' : mode === 'titre' ? 'demo' : mode);
    majHud();
  }

  /* ---------- commandes ---------- */
  $('jeu').addEventListener('pointerdown', e => {
    if (e.target.closest('button,a,.nid,.voile')) return;
    e.preventDefault(); if (mode === 'jeu') ailes = true;
  });
  const bf = $('bFeu');
  bf.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (mode !== 'jeu') return; feuTenu = true; bf.classList.add('on'); try { bf.setPointerCapture(e.pointerId); } catch (x) { /* rien */ } });
  for (const n of ['pointerup', 'pointercancel', 'lostpointercapture']) bf.addEventListener(n, () => { feuTenu = false; bf.classList.remove('on'); });
  bf.addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('keydown', e => {
    if (e.repeat) { if (e.code === 'KeyF' || e.code === 'ArrowRight') e.preventDefault(); return; }
    if (mode === 'jeu' && (e.code === 'Space' || e.code === 'ArrowUp')) { ailes = true; e.preventDefault(); }
    else if (mode === 'jeu' && (e.code === 'KeyF' || e.code === 'ArrowRight')) { feuTenu = true; e.preventDefault(); }
    else if (e.code === 'Escape' || e.code === 'KeyP') { if (mode === 'jeu') pause(); else if (mode === 'pause') reprendre(); }
  });
  addEventListener('keyup', e => { if (e.code === 'KeyF' || e.code === 'ArrowRight') feuTenu = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { pause(); DsSons.musique(false); } else if (mode !== 'titre' && mode !== 'charge') DsSons.musique(true); });
  $('bJouer').addEventListener('click', () => { DsSons.demarrer(); DsSons.regler(son); DsSons.jouer('bouton'); allerNid(); });
  $('bNidRetour').addEventListener('click', () => { DsSons.jouer('bouton'); DsSons.musique(false); titre(); });
  $('bEnvol').addEventListener('click', envol);
  $('bPause').addEventListener('click', pause);
  $('bReprendre').addEventListener('click', reprendre);
  $('bAuNid').addEventListener('click', abandon);
  $('bRetourNid').addEventListener('click', () => { DsSons.jouer('bouton'); allerNid(); });
  $('bSonT').addEventListener('click', basculerSon); $('bSonP').addEventListener('click', basculerSon);
  majSon(); construireNid();

  /* ---------- démarrage ---------- */
  DsMonde.charger('modeles.glb').then(gltf => {
    monde = new DsMonde($('scene'), $('couche'), gltf);
    $('charge').hidden = true; titre(); dern = performance.now();
  }).catch(err => { $('charge').textContent = 'OUPS, LE DRAGON NE SE REVEILLE PAS. ' + (err && err.message || ''); });
  requestAnimationFrame(boucle);

  window.DragonSim = {
    get mode() { return mode; }, get partie() { return p; }, get sauvegarde() { return sauv; }, get monde() { return monde; },
    envol, allerNid, titre, pause, reprendre,
    regler(f) { f(sauv); sauver(); if (mode === 'nid') allerNid(); },
  };
})();

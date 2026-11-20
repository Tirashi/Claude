/* =====================================================================
   STRATEGIE SPATIALE (nom provisoire) · le JEU : chargement, écrans (titre, pause, fin), boucle,
   pause et trois vitesses, record local. Session 1 : défendre SOL-7 contre 8 vagues.
   Tests : window.StrategieCiel.
   ===================================================================== */
'use strict';
let ETAT = 'charge'; // charge | titre | jeu | pause | finale | fin
const enJeu = () => ETAT === 'jeu';
function ecran(id){ for (const e of document.querySelectorAll('.ecran')) e.hidden = e.id !== id; ECRAN.classList.toggle('menu', !!id); }
function lireRecord(){ try { return JSON.parse(localStorage.getItem('strategieciel.record')) || {}; } catch (e){ return {}; } }
function ecrireRecord(r){ try { localStorage.setItem('strategieciel.record', JSON.stringify(r)); } catch (e){} }
function majTitre(){ const r = lireRecord(); $('#tRecord').textContent = r.parties ? `MEILLEUR : ${r.vagues || 0} VAGUE${(r.vagues || 0) > 1 ? 'S' : ''} TENUE${(r.vagues || 0) > 1 ? 'S' : ''}${r.victoires ? ' · ' + r.victoires + ' VICTOIRE' + (r.victoires > 1 ? 'S' : '') : ''}` : ''; }
function jouer(tuto){ if (tuto === undefined) tuto = !lireTuto(); nouvellePartie(); TEMPS.t = 0; const pv = PV(); centrer(pv.pos.clone().add(V3(260, 0, 40))); CA.dist = 1500; CA.yaw = 0; CA.tilt = 0; vitesse(1); sigSel = sigProd = ''; selModif = true;
  ETAT = 'jeu'; ecran(null); if (tuto) tutoDebut(); else { tutoFin(false); annonce(`DEFENDS SOL-7<b>${VAGUES.length} VAGUES</b>LA PREMIERE ARRIVE DANS 2 MINUTES`, 1); } }
// ---------- tutoriel guidé : une étape à la fois, les vagues attendent qu'il soit fini ----------
const lireTuto = () => { try { return localStorage.getItem('strategieciel.tuto') === '1'; } catch (e){ return false; } };
const TUTO = [
  { t: 'BIENVENUE', pc: "VOICI AURORE, TON PORTE-VAISSEAUX : GEANT ET LENT, IL FABRIQUE TOUS TES VAISSEAUX ET RECOIT LE CRISTAL. S'IL EST DETRUIT, LA PARTIE EST PERDUE.", suivant: 1 },
  { t: 'LA VUE', pc: "DEPLACE LA VUE AVEC LES FLECHES OU EN AMENANT LA SOURIS AU BORD DE L'ECRAN, ZOOME A LA MOLETTE, PIVOTE EN GLISSANT AVEC LE CLIC DROIT.", tel: "DEPLACE LA VUE AVEC UN DOIGT ; ZOOME ET PIVOTE AVEC DEUX DOIGTS.",
    debut: st => { st.c = CA.c.clone(); st.d = CA.dist; st.y = CA.yaw; }, fait: st => CA.c.distanceTo(st.c) > 250 || Math.abs(CA.dist / st.d - 1) > .25 || Math.abs(CA.yaw - st.y) > .4 },
  { t: 'CHOISIR', pc: "CHOISIS TES CHASSEURS : TOUCHE 2, OU LE BOUTON CHASS. (TU PEUX AUSSI CLIQUER SUR UN VAISSEAU, OU GLISSER UN CADRE AUTOUR).", tel: "CHOISIS TES CHASSEURS : BOUTON CHASS. A GAUCHE (OU TOUCHE UN VAISSEAU).", guide: '[data-gr="chasseur"]',
    fait: () => SEL().some(u => u.type === 'chasseur') },
  { t: 'DONNER UN ORDRE', pc: "ENVOIE-LES PLUS LOIN : CLIC DROIT DANS L'ESPACE. UN CLIC DROIT SUR UN ENNEMI L'ATTAQUE.", tel: "ENVOIE-LES PLUS LOIN : TOUCHE L'ESPACE. TOUCHER UN ENNEMI L'ATTAQUE.",
    fait: () => U.some(u => u.type === 'chasseur' && u.ordre.k === 'aller') },
  { t: 'LE CHANTIER', pc: "PRODUIS UN COLLECTEUR AU CHANTIER D'AURORE (TOUCHE T, OU LE BOUTON). IL COUTE 30 CRISTAUX.", tel: "PRODUIS UN COLLECTEUR AU CHANTIER D'AURORE (EN BAS A DROITE). IL COUTE 30 CRISTAUX.", guide: '[data-prod="collecteur"]',
    fait: () => S.file.includes('collecteur') || U.filter(u => u.type === 'collecteur').length > 2 },
  { t: 'LE CRISTAL', pc: "LES COLLECTEURS MINENT SEULS LE CRISTAL DES ASTEROIDES (LES CHIFFRES BLEUS) ET LE RAPPORTENT A AURORE. ATTENDS QU'ILS EN RAPPORTENT 60.", guide: '#hRes',
    debut: st => { st.m = S.mine; }, fait: st => S.mine - st.m >= 60 },
  { t: 'LA PAUSE', pc: "METS LE JEU EN PAUSE (ESPACE, OU ❚❚ EN HAUT A DROITE). EN PAUSE, TU PEUX TOUJOURS CHOISIR ET DONNER DES ORDRES.", tel: "METS LE JEU EN PAUSE (❚❚ EN HAUT A DROITE). EN PAUSE, TU PEUX TOUJOURS CHOISIR ET DONNER DES ORDRES.", guide: '[data-vit="0"]',
    fait: () => VIT === 0 },
  { t: 'LES VITESSES', pc: "RELANCE LE TEMPS : ▶, OU ▶▶ ET ▶▶▶ POUR ALLER PLUS VITE QUAND TOUT EST CALME.", guide: '#hVit', fait: () => VIT > 0 },
  { t: 'LA FLOTTE ROUGE', pc: "ELLE ARRIVERA PAR LA PORTE D'ALTAIR (LE ROND ROUGE DE LA MINI-CARTE), EN 8 VAGUES. PRODUIS DES CHASSEURS, DES BOMBARDIERS (CONTRE LES GROS VAISSEAUX) ET DES DESTROYERS, ET GARDE-LES PRES D'AURORE. BONNE CHANCE !", fin: 1 }];
const TU = { i: -1, st: {} };
function tutoDebut(){ S.tuto = true; TU.i = -1; tutoEtape(0); }
function tutoEtape(i){ document.querySelectorAll('.guide').forEach(e => e.classList.remove('guide')); TU.i = i; TU.st = {}; const E = TUTO[i];
  if (!E){ tutoFin(true); return; } if (E.debut) E.debut(TU.st);
  $('#tuto').hidden = false; $('#tuto').innerHTML = `<div class="l"><b>${E.t}</b><span>${i + 1} / ${TUTO.length}</span></div><p>${(TACTILE && E.tel) || E.pc}</p><div class="l">${E.suivant || E.fin ? `<span class="bt on" data-tuto="suivant">${E.fin ? 'COMMENCER' : 'SUIVANT'}</span>` : '<span class="mut">A TOI !</span>'}<span class="bt" data-tuto="passer">PASSER LE TUTO</span></div>`;
  if (E.guide) document.querySelectorAll(E.guide).forEach(e => e.classList.add('guide')); }
function tutoFin(annoncer){ S.tuto = false; TU.i = -1; $('#tuto').hidden = true; document.querySelectorAll('.guide').forEach(e => e.classList.remove('guide'));
  try { localStorage.setItem('strategieciel.tuto', '1'); } catch (e){}
  if (annoncer) annonce(`A TOI !<b>8 VAGUES</b>LA PREMIERE ARRIVE DANS 2 MINUTES`, 1); }
function majTuto(){ if (!S.tuto || TU.i < 0) return; const E = TUTO[TU.i]; if (E.guide && !document.querySelector('.guide')) document.querySelectorAll(E.guide).forEach(e => e.classList.add('guide'));
  if (E.fait && E.fait(TU.st)){ tutoEtape(TU.i + 1); } }
$('#tuto').addEventListener('click', e => { const b = e.target.closest('[data-tuto]'); if (!b) return; if (b.dataset.tuto === 'passer') tutoFin(true); else tutoEtape(TU.i + 1); });
function menuPause(on){ if (on && ETAT === 'jeu'){ ETAT = 'pause'; ecran('ePause'); } else if (!on && ETAT === 'pause'){ ETAT = 'jeu'; ecran(null); } }
function finPartie(){ const f = S.fin; ETAT = 'fin'; const tenues = f.gagne ? VAGUES.length : Math.max(0, S.vague - 1);
  const r = lireRecord(); r.parties = (r.parties || 0) + 1; r.vagues = Math.max(r.vagues || 0, tenues); if (f.gagne) r.victoires = (r.victoires || 0) + 1; ecrireRecord(r);
  $('#fTitre').textContent = f.gagne ? 'VICTOIRE' : 'DEFAITE'; $('#fRaison').textContent = f.raison;
  $('#fStats').innerHTML = `VAGUES TENUES : ${tenues} / ${VAGUES.length}<br>ENNEMIS DETRUITS : ${S.detruits}<br>VAISSEAUX PERDUS : ${S.perdus}<br>CRISTAL MINE : ${Math.floor(S.mine)}<br>DUREE : ${Math.floor(TEMPS.t / 60)} MIN`;
  ecran('eFin'); majTitre(); }
$('#aJouer').onclick = () => jouer(); $('#aTuto').onclick = () => jouer(true); $('#pReprendre').onclick = () => menuPause(false); $('#pRecommencer').onclick = () => jouer(false); $('#fRejouer').onclick = () => jouer(false);
$('#aCommandes').onclick = () => { const c = $('#tCommandes'); c.hidden = !c.hidden; };
addEventListener('resize', redim); addEventListener('orientationchange', () => setTimeout(redim, 200));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ETAT === 'pause') menuPause(false); });

// ---------- boucle ----------
let der = performance.now(), tHud = 0, tMini = 0; const IPS = { n: 0, t: 0, v: 0 };
function boucle(now){ requestAnimationFrame(boucle); const dtr = Math.min(.05, (now - der) / 1000); der = now; TEMPS.r += dtr;
  IPS.n++; IPS.t += dtr; if (IPS.t >= 1){ IPS.v = Math.round(IPS.n / IPS.t); $('#ips').textContent = `IPS ${IPS.v}`; IPS.n = IPS.t = 0; }
  const joue = ETAT === 'jeu', dt = joue ? dtr * VIT : ETAT === 'titre' ? dtr * .5 : 0;
  if (joue){ majClavier(dtr); TEMPS.t += dt; if (dt > 0){ // pas fixes : les combats restent justes même en vitesse ×3
      const n = Math.ceil(dt / .034); for (let i = 0; i < n; i++) majUnites(dt / n); }
    if (S.fin && ETAT === 'jeu') setTimeout(finPartie, 1200), ETAT = 'finale'; }
  else if (ETAT === 'titre'){ CA.yaw += dtr * .03; TEMPS.t += dt; }
  if (ETAT === 'finale') TEMPS.t += dtr;
  placeCam(); soleil.target.position.copy(CA.c); soleil.target.updateMatrixWorld(); soleil.position.copy(CA.c).add(V3(-CA.c.x * .3, 800, -CA.c.z * .3));
  majDecor(dt, dtr, dt === 0); majTirs(dt || (ETAT === 'finale' ? dtr : 0)); majPings(dtr);
  if (ETAT !== 'titre'){ tHud -= dtr; if (tHud <= 0){ tHud = .15; majPanneaux(); majTuto(); } majMarques(); tMini -= dtr; if (tMini <= 0){ tMini = .12; dessineMini(); } }
  R.render(sc, cam); }

// ---------- démarrage : modèles, puis écran titre (la bataille tourne au ralenti derrière) ----------
redim();
Promise.all(MODELES.map(charger)).then(() => { $('#charge').remove(); nouvellePartie(); centrer(BASE); CA.dist = 2300; ETAT = 'titre'; ecran('eTitre'); majTitre(); requestAnimationFrame(boucle); });
window.StrategieCiel = { tutoFin, tutoEtape, TU, S, U: () => U, TYPES, VAGUES, GIS, CA, jouer, produire, ordonner, groupe, lancerVague, vitesse, finPartie, meurt, etat: () => ETAT, avance(s){ const n = Math.ceil(s / .034); for (let i = 0; i < n; i++) majUnites(s / n); TEMPS.t += s; } };

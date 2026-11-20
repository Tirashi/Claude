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
function jouer(){ nouvellePartie(); TEMPS.t = 0; const pv = PV(); centrer(pv.pos.clone().add(V3(260, 0, 40))); CA.dist = 1500; CA.yaw = 0; CA.tilt = 0; vitesse(1); sigSel = sigProd = ''; selModif = true;
  ETAT = 'jeu'; ecran(null); annonce(`DEFENDS SOL-7<b>${VAGUES.length} VAGUES</b>LA PREMIERE ARRIVE DANS 2 MINUTES`, 1); }
function menuPause(on){ if (on && ETAT === 'jeu'){ ETAT = 'pause'; ecran('ePause'); } else if (!on && ETAT === 'pause'){ ETAT = 'jeu'; ecran(null); } }
function finPartie(){ const f = S.fin; ETAT = 'fin'; const tenues = f.gagne ? VAGUES.length : Math.max(0, S.vague - 1);
  const r = lireRecord(); r.parties = (r.parties || 0) + 1; r.vagues = Math.max(r.vagues || 0, tenues); if (f.gagne) r.victoires = (r.victoires || 0) + 1; ecrireRecord(r);
  $('#fTitre').textContent = f.gagne ? 'VICTOIRE' : 'DEFAITE'; $('#fRaison').textContent = f.raison;
  $('#fStats').innerHTML = `VAGUES TENUES : ${tenues} / ${VAGUES.length}<br>ENNEMIS DETRUITS : ${S.detruits}<br>VAISSEAUX PERDUS : ${S.perdus}<br>CRISTAL MINE : ${Math.floor(S.mine)}<br>DUREE : ${Math.floor(TEMPS.t / 60)} MIN`;
  ecran('eFin'); majTitre(); }
$('#aJouer').onclick = jouer; $('#pReprendre').onclick = () => menuPause(false); $('#pRecommencer').onclick = jouer; $('#fRejouer').onclick = jouer;
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
  if (ETAT !== 'titre'){ tHud -= dtr; if (tHud <= 0){ tHud = .15; majPanneaux(); } majMarques(); tMini -= dtr; if (tMini <= 0){ tMini = .12; dessineMini(); } }
  R.render(sc, cam); }

// ---------- démarrage : modèles, puis écran titre (la bataille tourne au ralenti derrière) ----------
redim();
Promise.all(MODELES.map(charger)).then(() => { $('#charge').remove(); nouvellePartie(); centrer(BASE); CA.dist = 2300; ETAT = 'titre'; ecran('eTitre'); majTitre(); requestAnimationFrame(boucle); });
window.StrategieCiel = { S, U: () => U, TYPES, VAGUES, GIS, CA, jouer, produire, ordonner, groupe, lancerVague, vitesse, finPartie, meurt, etat: () => ETAT, avance(s){ const n = Math.ceil(s / .034); for (let i = 0; i < n; i++) majUnites(s / n); TEMPS.t += s; } };

/* =====================================================================
   STRATEGIE SPATIALE (nom provisoire) · session 2 : COLONIES, BATIMENTS et RECHERCHE continue.
   Recherche : trois domaines qui avancent en même temps ; quand un projet finit, on choisit le suivant parmi trois cartes.
   Colonies : un colon s'installe sur une planète libre ; chaque colonie a des emplacements de bâtiments (mine, labo, chantier, défense).
   ===================================================================== */
'use strict';
// ---------- recherche ----------
const DOMAINES = { vaisseaux: 'VAISSEAUX', colonies: 'COLONIES', armement: 'ARMEMENT' };
const RECH = {
  bombardiers:   { d: 'vaisseaux', nom: 'BOMBARDIERS', txt: 'Débloque le bombardier, fort contre les gros vaisseaux.', c: 40, f(){ S.deb.bombardier = true; } },
  destroyers:    { d: 'vaisseaux', nom: 'DESTROYERS', txt: 'Débloque le destroyer et ses tourelles.', c: 90, f(){ S.deb.destroyer = true; } },
  intercepteurs: { d: 'vaisseaux', nom: 'INTERCEPTEURS', txt: 'Débloque l\'intercepteur : très rapide, fragile, fort contre les chasseurs.', c: 50, f(){ S.deb.intercepteur = true; } },
  corvettes:     { d: 'vaisseaux', nom: 'CORVETTES', txt: 'Débloque la corvette d\'escorte : tir rapide, redoutable contre les chasseurs.', c: 60, f(){ S.deb.corvette = true; } },
  fregates:      { d: 'vaisseaux', nom: 'FREGATES DE SOUTIEN', txt: 'Débloque la frégate, qui répare les vaisseaux autour d\'elle.', c: 90, req: 'corvettes', f(){ S.deb.fregate = true; } },
  torpilleurs:   { d: 'vaisseaux', nom: 'TORPILLEURS', txt: 'Débloque le torpilleur : grosses torpilles tirées de très loin contre les grands vaisseaux.', c: 90, req: 'bombardiers', f(){ S.deb.torpilleur = true; } },
  cuirasses:     { d: 'vaisseaux', nom: 'CUIRASSES', txt: 'Débloque le cuirassé : énorme, lent, six tourelles.', c: 160, req: 'destroyers', f(){ S.deb.cuirasse = true; } },
  moteurs:       { d: 'vaisseaux', nom: 'MOTEURS', txt: '+15 % de vitesse pour toute la flotte.', c: 60, f(){ S.mod.vit *= 1.15; } },
  coll_lourd:    { d: 'vaisseaux', nom: 'COLLECTEUR LOURD', txt: 'Les collecteurs emportent deux fois plus de cristal.', c: 60, f(){ S.mod.cap *= 2; } },
  blindage_ch:   { d: 'vaisseaux', nom: 'BLINDAGE DES CHASSEURS', txt: '+30 % de vie pour les chasseurs.', c: 50, f(){ renforcer('chasseur', 1.3); } },
  coque:         { d: 'vaisseaux', nom: 'COQUE D\'AURORE', txt: '+30 % de vie pour AURORE.', c: 80, f(){ renforcer('pv', 1.3); } },
  colonisation:  { d: 'colonies', nom: 'COLONISATION', txt: 'Permet de fonder des colonies : amène AURORE près d\'une planète libre.', c: 30, f(){ S.deb.colon = true; } },
  glace:         { d: 'colonies', nom: 'HABITAT DE GLACE', txt: 'Permet de coloniser BOREA, planète de glace riche.', c: 70, req: 'colonisation', f(){ S.deb.glace = true; } },
  lave:          { d: 'colonies', nom: 'HABITAT RESISTANT', txt: 'Permet de coloniser BRASIER, planète de lave.', c: 60, req: 'colonisation', f(){ S.deb.lave = true; } },
  raffinerie:    { d: 'colonies', nom: 'RAFFINERIE', txt: '+30 % de cristal pour les mines des colonies.', c: 60, f(){ S.mod.mine *= 1.3; } },
  labo2:         { d: 'colonies', nom: 'LABORATOIRES II', txt: '+50 % de recherche pour les labos.', c: 80, f(){ S.mod.labo *= 1.5; } },
  agrandir:      { d: 'colonies', nom: 'AGRANDISSEMENT', txt: 'Un emplacement de bâtiment de plus sur chaque colonie.', c: 90, f(){ S.mod.places++; } },
  chantier_rapide: { d: 'colonies', nom: 'CHANTIER RAPIDE', txt: 'AURORE produit 20 % plus vite.', c: 70, f(){ S.mod.prod *= .8; } },
  boucliers1:    { d: 'armement', nom: 'BOUCLIERS I', txt: '-15 % de dégâts reçus par toute la flotte.', c: 50, f(){ S.mod.bouclier *= .85; } },
  boucliers2:    { d: 'armement', nom: 'BOUCLIERS II', txt: 'Encore -15 % de dégâts reçus.', c: 120, req: 'boucliers1', f(){ S.mod.bouclier *= .85; } },
  tourelles:     { d: 'armement', nom: 'TOURELLES DE COLONIE', txt: 'Débloque la DEFENSE, une tourelle posée sur une colonie.', c: 40, f(){ S.deb.defense = true; } },
  missiles:      { d: 'armement', nom: 'MISSILES', txt: '+25 % de dégâts pour chasseurs et bombardiers.', c: 60, f(){ S.mod.degCh *= 1.25; } },
  canons:        { d: 'armement', nom: 'CANONS LOURDS', txt: '+25 % de dégâts pour AURORE et les destroyers.', c: 70, f(){ S.mod.degLourd *= 1.25; } },
  reparation:    { d: 'armement', nom: 'DRONES DE REPARATION', txt: 'AURORE se répare lentement (4 PV par seconde).', c: 80, f(){ S.mod.repar = 4; } }};
const DEPART_RECH = { vaisseaux: 'bombardiers', colonies: 'colonisation', armement: 'boucliers1' };
// points par minute : AURORE en donne 30, chaque labo 15 ; partagés entre les trois domaines
const pointsMinute = () => 30 + colonies().reduce((a, P) => a + P.col.bat.filter(b => b === 'labo').length, 0) * 15 * S.mod.labo;
function renforcer(type, f){ if (type === 'pv') S.mod.viePv *= f; else S.mod.vieCh *= f; for (const u of U) if (u.camp === 0 && u.type === type && u.vie > 0){ u.vmax *= f; u.vie *= f; } }
function tirerCartes(d){ const fait = S.rech.fait, l = Object.keys(RECH).filter(k => RECH[k].d === d && !fait.includes(k) && k !== S.rech.dom[d].cur && (!RECH[k].req || fait.includes(RECH[k].req)));
  for (let i = l.length - 1; i > 0; i--){ const j = Math.random() * (i + 1) | 0; [l[i], l[j]] = [l[j], l[i]]; } return l.slice(0, 3); }
function choisirRecherche(k){ const R = RECH[k]; if (!R) return; const D = S.rech.dom[R.d]; if (D.cur || !D.choix.includes(k)) return; D.cur = k; D.choix = []; sigRech = ''; }
function majRecherche(dt){ const parDom = pointsMinute() / 3 / 60 * dt;
  for (const d in S.rech.dom){ const D = S.rech.dom[d]; D.pts += parDom;
    if (D.cur && D.pts >= RECH[D.cur].c){ const k = D.cur; D.pts -= RECH[k].c; RECH[k].f(); S.rech.fait.push(k); D.cur = null; D.choix = tirerCartes(d); sigRech = sigListe = '';
      bulle(`RECHERCHE TERMINEE : ${RECH[k].nom}`); } } }
const enAttente = () => Object.values(S.rech.dom).filter(D => !D.cur && D.choix.length).length;

// ---------- colonies et bâtiments ----------
const PLACES = { terre: 6, desert: 4, glace: 4, lave: 3, roche: 2, gaz: 0 };
const BAT = { mine: { nom: 'MINE', prix: 100, temps: 20, txt: '+25 cristal/min (×1,5 sur une planète riche)' }, labo: { nom: 'LABO', prix: 120, temps: 25, txt: '+15 points de recherche/min' },
  chantier: { nom: 'CHANTIER', prix: 150, temps: 30, txt: 'AURORE produit 10 % plus vite' }, defense: { nom: 'DEFENSE', prix: 140, temps: 25, txt: 'Une tourelle qui tire sur les ennemis proches', req: 'defense' } };
const colonies = () => PLANETES.filter(P => P.camp === 0 && P.col);
const places = P => PLACES[P.t] + (P.col ? S.mod.places : 0);
function cristalMinute(P){ return P.col.bat.filter(b => b === 'mine').length * 25 * S.mod.mine * (P.riche ? 1.5 : 1); }
const facteurChantier = () => Math.pow(.9, colonies().reduce((a, P) => a + P.col.bat.filter(b => b === 'chantier').length, 0)) * S.mod.prod;
function construire(P, b){ const B = BAT[b]; if (!P.col || P.col.file || P.col.bat.length >= places(P)) return false; if (B.req && !S.deb[B.req]){ bulle('A RECHERCHER D\'ABORD'); return false; }
  if (S.cristal < B.prix){ bulle('PAS ASSEZ DE CRISTAL'); return false; } S.cristal -= B.prix; P.col.file = { b, t: 0 }; sigVolet = sigListe = ''; return true; }
function peutColoniser(P){ if (P.camp === 0) return 'DEJA COLONISEE'; if (P.t === 'gaz') return 'GEANTE GAZEUSE : INHABITABLE POUR L\'INSTANT';
  if (P.t === 'glace' && !S.deb.glace) return 'IL FAUT LA RECHERCHE HABITAT DE GLACE'; if (P.t === 'lave' && !S.deb.lave) return 'IL FAUT LA RECHERCHE HABITAT RESISTANT'; return ''; }
// fonder une colonie : AURORE doit être près de la planète ; un colon part d'AURORE et s'y pose
const PRIX_COLONIE = 150, PRES = P => P.r + 650;
const aurorePres = P => { const pv = PV(); return pv && Math.hypot(pv.pos.x - P.x, pv.pos.z - P.z) < PRES(P); };
function fonderColonie(P){ const pb = peutColoniser(P); if (pb){ bulle(pb); return false; } if (!S.deb.colon){ bulle('IL FAUT LA RECHERCHE COLONISATION'); return false; }
  if (!aurorePres(P)){ bulle('AMENE AURORE PRES DE ' + P.nom); return false; } if (P.colon && vivant(P.colon)){ bulle('UN COLON EST EN ROUTE'); return false; }
  if (S.cristal < PRIX_COLONIE){ bulle('PAS ASSEZ DE CRISTAL'); return false; } S.cristal -= PRIX_COLONIE; const pv = PV(), u = cree('colon', pv.pos.clone()); u.ordre = { k: 'coloniser', P }; P.colon = u; sigVolet = ''; bulle('UN COLON PART POUR ' + P.nom); return true; }
function amenerAurore(P){ const pv = PV(); if (!pv) return; const d = V3(pv.pos.x - P.x, 0, pv.pos.z - P.z).normalize().multiplyScalar(P.r + 420); pv.ordre = { k: 'aller', p: V3(P.x, 0, P.z).add(d) }; pv.cible = null; ping(V3(P.x, 40, P.z), 0); bulle('AURORE PART POUR ' + P.nom); }
function coloniser(P, u){ const pb = peutColoniser(P); if (pb){ bulle(pb); u.ordre = { k: 'rien' }; return; }
  P.camp = 0; P.col = { bat: [], file: null }; anneauPlanete(P); eclat(V3(P.x, P.y + P.r, P.z), 160);
  u.mort = 1; u.vie = 0; sc.remove(u.g); sc.remove(u.anneau); sc.remove(u.ic); u.sel = false; sigListe = sigVolet = ''; bulle(`${P.nom} EST COLONISEE`); }
// défense des colonies : chaque tourelle tire sur l'ennemi le plus proche à moins de 550 m de la planète
function majDefense(P, dt, rouges){ const n = P.col.bat.filter(b => b === 'defense').length; if (!n) return; P.cdDef = (P.cdDef || 0) - dt; if (P.cdDef > 0) return;
  const o = V3(P.x, P.y + P.r * .8, P.z); let c = null, dm = 550 * 550; for (const r of rouges){ const d = r.pos.distanceToSquared(o); if (d < dm){ dm = d; c = r; } }
  if (!c) return; P.cdDef = .7 / n; tir(o, c.pos.clone(), 0, 22, 560); c.vie -= 14; if (c.vie <= 0) meurt(c); }
function majColonies(dt){ if (!S.rech) return; majRecherche(dt); const rouges = U.filter(u => u.camp === 1 && u.vie > 0);
  for (const P of colonies()){ const m = cristalMinute(P) / 60 * dt; S.cristal += m; S.mine += m;
    if (P.col.file){ P.col.file.t += dt; if (P.col.file.t >= BAT[P.col.file.b].temps){ P.col.bat.push(P.col.file.b); bulle(`${P.nom} : ${BAT[P.col.file.b].nom} TERMINE`); P.col.file = null; sigVolet = sigListe = ''; } }
    majDefense(P, dt, rouges); }
  if (S.mod.repar){ const pv = PV(); if (pv && pv.vie < pv.vmax) pv.vie = Math.min(pv.vmax, pv.vie + S.mod.repar * dt); } }
function initColonies(){
  S.deb = { collecteur: true, chasseur: true, bombardier: false, destroyer: false, colon: false, intercepteur: false, corvette: false, fregate: false, torpilleur: false, cuirasse: false, glace: false, lave: false, defense: false };
  S.mod = { vit: 1, cap: 1, vieCh: 1, viePv: 1, degCh: 1, degLourd: 1, bouclier: 1, mine: 1, labo: 1, prod: 1, places: 0, repar: 0 };
  S.rech = { fait: [], dom: {} }; for (const d in DOMAINES) S.rech.dom[d] = { cur: DEPART_RECH[d], pts: 0, choix: [] };
  for (const P of PLANETES){ P.col = null; P.colon = null; if (P.camp === 0 && P.nom !== 'GAIA') P.camp = undefined; anneauPlanete(P); }
  const G = PLN.GAIA; G.camp = 0; G.col = { bat: ['mine'], file: null }; anneauPlanete(G); SELP = null; sigRech = sigVolet = ''; }

// ---------- panneaux : recherche, volet de la planète ----------
let SELP = null, sigRech = '', sigVolet = '', RECH_OUVERT = false, VOLET_CHOIX = false;
const ICB = { mine: 'mine', labo: 'labo', chantier: 'chantier', defense: 'defense' };
function ouvrirPlanete(P){ SELP = P; VOLET_CHOIX = false; sigVolet = ''; choisir([], false); }
function visePlanete(x, y){ let m = null, dm = 1e9; for (const P of PLANETES){ const e = ecranDe(P.g.position); if (!e.ok) continue; const d = Math.hypot(e.x - x, e.y - y), r = Math.max(24, rayonEcran(P.g.position, P.r)); if (d < r && d < dm){ dm = d; m = P; } } return m; }
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function majVolet(){ const v = $('#volet'), P = SELP; if (!P){ v.hidden = true; sigVolet = ''; return; } v.hidden = false;
  const c = P.col, sig = [P.nom, c ? c.bat.join() + (c.file ? c.file.b : '') : '-', VOLET_CHOIX, Object.keys(BAT).map(b => S.cristal >= BAT[b].prix ? 1 : 0).join(''), S.deb.defense, S.deb.colon, P.camp === 0 ? 1 : aurorePres(P), P.colon && vivant(P.colon), S.cristal >= PRIX_COLONIE, places(P)].join('|');
  if (sig !== sigVolet){ sigVolet = sig; const type = { terre: 'TERRESTRE', desert: 'DESERT', glace: 'GLACE', lave: 'LAVE', roche: 'ROCHE', gaz: 'GAZEUSE' }[P.t];
    let h = `<div class="vt"><i style="background:${COUL_PLA[P.t]}"></i><b>${P.nom}</b><span class="dx">${type}${P.riche ? ' · <span class="cr">◆◆ RICHE</span>' : ''}</span><span class="b" data-act="fermerP" title="Fermer">✕</span></div>`;
    if (c){ const n = places(P); h += `<div class="dx" style="font-size:12px">COLONIE · <span class="n cr">+${Math.round(cristalMinute(P))}◆</span>/MIN</div><div class="places">`;
      for (let i = 0; i < n; i++){ const b = c.bat[i];
        if (b) h += `<span class="b place" title="${BAT[b].txt}">${ic(ICB[b], 18)}<span>${BAT[b].nom}</span></span>`;
        else if (i === c.bat.length && c.file) h += `<span class="b place en">${ic(ICB[c.file.b], 18)}<span>${BAT[c.file.b].nom}</span><span class="n" id="vT"></span></span>`;
        else h += `<span class="b place vide${VOLET_CHOIX && i === c.bat.length ? ' on' : ''}" data-act="${c.file ? '' : 'placer'}" title="Construire">+</span>`; }
      h += `</div>`;
      if (VOLET_CHOIX && !c.file) h += `<div class="choix">${Object.entries(BAT).map(([k, B]) => { const ver = B.req && !S.deb[B.req]; return `<span class="b${S.cristal < B.prix || ver ? ' cher' : ''}" data-bat="${k}" title="${B.txt}${ver ? ' (à rechercher)' : ''}">${ic(ICB[k], 18)}<span>${B.nom}</span><span class="n cr">${ver ? ic('verrou', 11) : B.prix}</span></span>`; }).join('')}</div>`; }
    else { const pb = peutColoniser(P), pres = aurorePres(P), enRoute = P.colon && vivant(P.colon);
      h += `<div style="font-size:13px">PLANETE LIBRE · ${places(P)} EMPLACEMENT${places(P) > 1 ? 'S' : ''}</div><div class="dx" style="font-size:12px">${pb || (!S.deb.colon ? 'IL FAUT LA RECHERCHE COLONISATION' : enRoute ? 'UN COLON EST EN ROUTE' : pres ? 'AURORE EST ASSEZ PROCHE POUR FONDER UNE COLONIE' : 'AMENE AURORE PRES DE LA PLANETE POUR Y FONDER UNE COLONIE')}</div>`;
      if (!pb && S.deb.colon && !enRoute) h += pres ? `<span class="b${S.cristal < PRIX_COLONIE ? ' cher' : ''}" data-act="fonder" style="height:30px;margin-top:4px">${ic('colon', 16)} FONDER UNE COLONIE · <span class="n cr">${PRIX_COLONIE}◆</span></span>` : `<span class="b" data-act="amener" style="height:30px;margin-top:4px">${ic('pv', 16)} AMENER AURORE</span>`; }
    v.innerHTML = h; }
  const t = $('#vT'); if (t && c && c.file) t.textContent = Math.ceil(BAT[c.file.b].temps - c.file.t) + ' S'; }
function majRechPanneau(){ const b = $('#rBadge'), n = enAttente(); b.textContent = n || ''; b.hidden = !n; $('#bRech').classList.toggle('alerte', n > 0);
  const o = $('#recherche'); o.hidden = !RECH_OUVERT; if (!RECH_OUVERT) return; const pm = pointsMinute() / 3;
  const sig = [Object.values(S.rech.dom).map(D => D.cur + D.choix.join()).join(), S.rech.fait.length, Math.round(pm)].join('|');
  if (sig !== sigRech){ sigRech = sig;
    o.innerHTML = `<div class="vt"><b>RECHERCHE</b><span class="dx">+${Math.round(pm * 3)} POINTS/MIN · AURORE ET LABOS</span><span class="b" data-act="recherche" title="Fermer">✕</span></div><div class="doms">${Object.entries(DOMAINES).map(([d, nom]) => { const D = S.rech.dom[d];
      return `<div class="dom"><div class="dt"><b>${nom}</b><span class="n dx">+${Math.round(pm)}/MIN</span></div>` + (D.cur ? `<div class="carte-r en"><span class="dx">EN COURS</span><b>${RECH[D.cur].nom}</b><span class="dx">${RECH[D.cur].txt}</span><div id="rP-${d}"></div><span class="n dx" id="rT-${d}"></span></div>`
        : D.choix.length ? `<div class="dx">CHOISIS LA SUITE :</div>` + D.choix.map(k => `<span class="b carte-r" data-rech="${k}"><b>${RECH[k].nom}</b><span class="dx">${RECH[k].txt}</span><span class="n cr">${RECH[k].c} PTS</span></span>`).join('') : `<div class="dx">TOUT EST TROUVE</div>`)
        + (S.rech.fait.filter(k => RECH[k].d === d).length ? `<div class="faits">${S.rech.fait.filter(k => RECH[k].d === d).map(k => RECH[k].nom).join(' · ')}</div>` : '') + `</div>`; }).join('')}</div>`; }
  for (const d in S.rech.dom){ const D = S.rech.dom[d], p = $('#rP-' + d); if (p && D.cur){ p.innerHTML = pvb(D.pts / RECH[D.cur].c, 'c'); $('#rT-' + d).textContent = mmss(Math.max(0, (RECH[D.cur].c - D.pts) / Math.max(.01, pm / 60))); } } }
// tags des colonies sur la carte : leurs bâtiments en petites icônes
const tagColonie = P => P.col ? `<br><span class="ibat">${P.col.bat.map(b => ic(ICB[b], 12)).join('')}${P.col.file ? '<span class="dx">+</span>' : ''}</span>` : '';

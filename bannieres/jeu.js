/* =====================================================================
   BANNIÈRES · le JEU : écrans (titre, carte, bataille, fin, aide, pause),
   actions du joueur, tour des rivaux, sauvegarde (bannieres.run, à chaque
   action), réglages (bannieres.opts), record local (bannieres.best).
   Les règles sont dans regles.js, surprises.js et ia.js ; la 3D dans
   carte3d.js et bataille3d.js ; l'interface dans interface.js.
   window.Bannieres : pour les tests (outils/logique.js, fumee.js).
   ===================================================================== */
'use strict';
const CLE = 'bannieres.';
const lire = (k, d) => { try { const v = localStorage.getItem(CLE + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const ecrire = (k, v) => { try { if (v == null) localStorage.removeItem(CLE + k); else localStorage.setItem(CLE + k, JSON.stringify(v)); } catch (e) {} };
const opts = Object.assign({ sons: true, niveau: 'facile', rayon: 3, coul: 'or' }, lire('opts', {}));
Sons.actif = opts.sons;
let ecran = 'chargement', occupe = false, chemins = null;
const sauver = () => ecrire('run', etat && !etat.fin && !etat.demo ? etat : null);

// ---------- les mots ----------
const nomCamp = s => (s === 0 ? 'TON ARMEE' : s > 0 ? sansAccent(etat.seigneurs[s].nom) : s === -2 ? 'REVENANTS' : 'BRIGANDS');
const nomSeigneur = s => (s === 0 ? 'TOI' : sansAccent(etat.seigneurs[s].nom));
const compo = l => { const n = {}; l.forEach(u => { n[u.type] = (n[u.type] || 0) + 1; }); return Object.entries(n).map(([t, k]) => (k > 1 ? k + ' ' : '') + sansAccent(BAN_UNITES[t].nom) + (k > 1 ? 'S' : '')).join(', '); };
const coeurs = l => l.reduce((t, u) => t + u.pv, 0);
const POUVOIRS = { fantassin: 'Il est solide : son bouclier arrête des coups.', archer: 'Il tire de loin, avant les autres.', lancier: 'Il arrête ceux qui foncent sur lui.', mage: 'Il lance du feu sur deux ennemis.', champion: 'Il frappe très fort, deux ennemis à la fois.' };
const TACTIQUES = { charger: ['FONCER', 'On court tout de suite.'], tenir: ["TIRER D'ABORD", 'Les archers tirent 2 fois.'], harceler: ['PRUDENT', 'On recule si ça va mal.'] };
const NOM_CASE = t => (t.bat === 'chateau' ? 'CHATEAU' : t.bat ? sansAccent(t.grand ? BAN_BATIMENTS[t.bat].grand : BAN_BATIMENTS[t.bat].nom) : t.camp ? 'CAMP DE BRIGANDS' : t.ruine ? 'RUINES HANTEES' : NOM_TERRAIN[t.t]);
const pieces = () => etat.seigneurs[0].pieces;
const blesses = a => a.unites.some(u => u.pv < banCoeursMax(etat, u.type, a.s));

// ---------- le haut et le bas de l'écran ----------
function majRes() {
  const plein = pieces() >= BAN_COFFRE;
  $('res').innerHTML = `<span>${I('piece')} <b>${pieces()}</b>${plein ? '<small> PLEIN</small>' : ''}</span><span>${I('drapeau')} <b>${banDrapeaux(etat, 0)}</b></span><span>${I('chateau')} <b>${banChateaux(etat, 0)}/4</b></span>` +
    `<span class="tour"><span>TOUR ${Math.min(etat.tour, BAN_DERNIER_TOUR)}/${BAN_DERNIER_TOUR}</span><span>${sansAccent(banSaison(etat.tour))}</span></span>`;
}
function actions(...l) { const b = document.createElement('div'); b.className = 'actions'; l.filter(Boolean).forEach(x => b.append(x)); return b; }
function majFiche(i) {
  const f = $('fiche'), a = armeeChoisie != null && banArmee(etat, armeeChoisie);
  if (occupe) { f.innerHTML = `<div class="titre">LES AUTRES JOUENT...</div><div class="journal">REGARDE BIEN LA CARTE.</div>`; return; }
  if (a) {
    f.innerHTML = `<div class="titre">${nomCamp(0)}</div><div>${compo(a.unites)}</div><div>${I('coeur')} ${coeurs(a.unites)}</div>` +
      `<div class="journal">TOUCHE UNE CASE QUI BRILLE. EN ROUGE : BATAILLE !</div>`;
    const gar = banPeutGarnison(etat, 0, a.id).ok && bouton('RESTER DANS LA TOUR', () => menuGarnison(a.id));
    f.append(actions(bouton('ANNULER', () => { deselectionner(); majFiche(); }), gar));
    return;
  }
  if (i != null && i >= 0) {
    const t = etat.terres[i], o = banArmeeSur(etat, i), B = t.bat && BAN_BATIMENTS[t.bat];
    f.innerHTML = `<div class="titre">${NOM_CASE(t)}</div>` +
      `<div>${t.prop >= 0 ? (t.prop === 0 ? 'A TOI' : 'A ' + nomSeigneur(t.prop)) : 'A PERSONNE'}${B ? ' · ' + sansAccent(B.phrase) + (t.grand ? ' ' + sansAccent(B.plus) : '') : ''}</div>` +
      (o ? `<div>${nomCamp(o.s)} : ${compo(o.unites)} ${I('coeur')} ${coeurs(o.unites)}</div>` : '') +
      (t.garnison && t.garnison.length ? `<div>GARNISON : ${compo(t.garnison)} ${I('coeur')} ${coeurs(t.garnison)}</div>` : '') +
      `<div class="journal">${EFFETS[t.t]}${t.decos.length ? ' · ' + t.decos.length + '/' + BAN_DECOS_PAR_CASE + ' DECORATIONS' : ''}</div>`;
    if (t.prop !== 0) return;
    const deco = t.decos.length < BAN_DECOS_PAR_CASE && bouton(`DECORER · ${BAN_PRIX_DECO} ${I('piece')}`, () => decorer(i), banPeutDecorer(etat, 0, i).ok);
    const soin = o && o.s === 0 && t.bat === 'chateau' && blesses(o) && bouton(`SOIGNER · ${BAN_PRIX_SOIN} ${I('piece')}`, () => soigner(o.id, i), banPeutSoigner(etat, 0, o.id).ok);
    if (t.bat === 'chateau') f.append(actions(bouton('ACHETER', () => menuAcheter(i)), soin, deco));
    else if (!t.bat) f.append(actions(bouton('CONSTRUIRE', () => menuConstruire(i)), deco));
    else f.append(actions(!t.grand && B && bouton(`AGRANDIR · ${B.prix} ${I('piece')}`, () => menuAgrandir(i), banPeutAmeliorer(etat, 0, i).ok), deco));
    return;
  }
  const n = banArmeesDe(etat, 0).filter(x => x.pts > 0).length;
  f.innerHTML = `<div class="titre">A TOI DE JOUER !</div><div class="journal">${n ? `TOUCHE UNE ARMEE POUR LA FAIRE BOUGER (${n} PEUT${n > 1 ? 'VENT' : ''} BOUGER), OU UNE CASE A TOI POUR CONSTRUIRE.` : 'TES ARMEES ONT BOUGE. TU PEUX CONSTRUIRE, PUIS APPUIE SUR FIN DU TOUR.'} CHAQUE TOUR : +${banRevenu(etat, 0)} ${I('piece')}</div>`;
}
function majTout(i) { majScene(); majArmees(); majRes(); majFiche(i); }

// ---------- toucher la carte ----------
function selectionner(a) {
  deselectionner();
  armeeChoisie = a.id;
  const m = banAtteignables(etat, a);
  m.forEach((v, j) => { v.combat = banEnnemiSur(etat, 0, j); });
  chemins = m; eclairer(m); majArmee(a); majFiche();
}
function deselectionner() {
  eclairer(null); chemins = null;
  const a = armeeChoisie != null && banArmee(etat, armeeChoisie); armeeChoisie = null; if (a) majArmee(a);
}
function choisir(x, y) {
  if (occupe || bataille || ecran !== 'carte' || ouverte()) return;
  const p = piocher(x, y);
  if (!p) { deselectionner(); majFiche(); return; }
  if (armeeChoisie != null && chemins && chemins.has(p.terre)) { deplacerJoueur(armeeChoisie, p.terre); return; }
  const a = banArmeeSur(etat, p.terre);
  if (a && a.s === 0 && a.pts > 0 && a.id !== armeeChoisie) { Sons.toc(); selectionner(a); return; }
  deselectionner(); majFiche(p.terre);
}
async function deplacerJoueur(id, i) {
  const a = banArmee(etat, id); if (!a) return;
  // une bataille : on choisit comment se battre AVANT que l'armée coure ; PARTIR n'enlève rien (elle garde ses pas)
  let tac = null;
  if (chemins && chemins.get(i) && chemins.get(i).combat) {
    const ch = banChemin(chemins, i), depuis = ch.length > 1 ? ch[ch.length - 2] : a.terre;
    tac = await choisirTactique(id, i, depuis);
    if (!tac) { majFiche(); return; }
  }
  occupe = true; deselectionner();
  const depart = a.terre, r = banDeplacer(etat, id, i);
  if (!r.ok) { toast(r.raison); occupe = false; majFiche(); return; }
  await marcher(id, depart, r.chemin);
  majScene();
  if (r.fusion) toast("Les deux armées n'en font plus qu'une !");
  if (r.pris.length) Sons.piece();
  if (r.bataille) await combattre(id, i, null, tac);
  occupe = false; majTout(); sauver();
  if (etat.fin) montrerFin();
}

// ---------- la bataille ----------
// avant d'attaquer : qui est en face, et les étoiles de chaque façon de se battre (null : PARTIR)
function choisirTactique(id, i, depuis) {
  const ap = banApercu(etat, id, i, depuis), ch = banChances(etat, id, i, 0, depuis), t = etat.terres[i];
  const effets = [EFFETS[t.t]];
  if (ap.garde) effets.push(`LA GARDE ${t.bat === 'chateau' ? 'DU CHATEAU' : t.bat === 'tour' ? 'DE LA TOUR' : 'DE LA CASERNE'} SE BAT AUSSI.`);
  if (ap.nGarnison) effets.push('LA GARNISON DE LA TOUR SE BAT AUSSI.');
  if (banEau(etat.terres[depuis].t)) effets.push("TU ATTAQUES DEPUIS L'EAU : TU TE PROTEGES MAL.");
  return demander("A L'ATTAQUE !", `<p>EN FACE : ${nomCamp(ap.sDef)}<br><b>${compo(ap.D)}</b> ${I('coeur')} ${coeurs(ap.D)}</p><p class="petit">${effets.join('<br>')}</p><p>COMMENT VEUX-TU TE BATTRE ? <span class="etoiles">${I('etoile').repeat(3)}</span> = FACILE</p>`,
    Object.keys(ch).map(k => [`${TACTIQUES[k][0]} <span class="etoiles">${etoilesHtml(ch[k])}</span>`, k, TACTIQUES[k][1]]).concat([['PARTIR', null, "L'armée ne bouge pas.", 'rouge']]));
}
// tacIA : la tactique de l'attaquant quand c'est l'ordinateur qui attaque le joueur ; tacJoueur : déjà choisie (le joueur attaque)
async function combattre(attId, i, tacIA, tacJoueur) {
  const ap = banApercu(etat, attId, i); if (!ap) return null;
  const joueurAttaque = ap.att.s === 0, source = ap.att.terre;
  secouer(i);
  ouvrirBataille(ap, source, i);
  ecran = 'bataille';
  // avant : les étoiles de chaque façon de se battre
  const ch = tacJoueur ? null : banChances(etat, attId, i, joueurAttaque ? 0 : 1);
  const tac = tacJoueur || await new Promise(ok => {
    const p = $('issue');
    p.innerHTML = `<h2 class="banniere">${joueurAttaque ? "A L'ATTAQUE !" : "ON T'ATTAQUE !"}</h2><div class="petit">COMMENT VEUX-TU TE BATTRE ? <span class="etoiles">${I('etoile').repeat(3)}</span> = FACILE</div>`;
    const rang = document.createElement('div'); rang.className = 'tactiques'; p.append(rang);
    Object.keys(ch).forEach(t => rang.append(bouton(`${TACTIQUES[t][0]}<br><span class="etoiles">${etoilesHtml(ch[t])}</span>`, () => ok(t), true, TACTIQUES[t][1])));
    if (joueurAttaque) { const r = bouton('PARTIR', () => ok(null)); r.className = 'renoncer'; p.append(r); }
    p.classList.remove('cache');
  });
  $('issue').classList.add('cache');
  if (!tac) { fermerBataille(); ecran = 'carte'; return null; }   // l'armée reste devant la case
  const tacA = joueurAttaque ? tac : tacIA || banTactiqueIA(ap.A, false), tacD = joueurAttaque ? banTactiqueIA(ap.D, ap.sDef < 0) : tac;
  const res = banResoudre(etat, attId, i, tacA, tacD);
  sauver();
  $('vite').classList.remove('cache');
  await rejouerBataille(res);
  $('vite').classList.add('cache');
  // après : BRAVO ou DOMMAGE, ce qu'on a perdu, le trésor
  const moi = joueurAttaque ? 0 : 1, gagne = (res.issue === 'victoire') === joueurAttaque;
  const morts = c => (c ? ap.D : ap.A).filter((u, k) => (c ? res.D : res.A)[k].pv === 0).length;
  const phrase = gagne ? (res.issue === 'victoire' ? 'LA CASE EST A TOI !' : 'TU AS TENU BON !') : (joueurAttaque ? 'TON ARMEE RECULE.' : 'ILS ONT PRIS LA CASE.');
  let extra = '';
  if (res.tresor && joueurAttaque) extra += `<br>LE TRESOR : +${res.tresor} ${I('piece')}`;
  if (res.chateau && joueurAttaque) extra += '<br>UN CHATEAU DE PLUS !';
  if (res.blesses.includes(0)) extra += '<br>TON SEIGNEUR EST BLESSE : IL REVIENT AU CHATEAU DANS 2 TOURS.';
  if (gagne) Sons.fanfare(); else Sons.triste();
  if (res.chateau && joueurAttaque) feuArtifice();   // un château de plus : grande fête
  await new Promise(ok => {
    $('issue').innerHTML = `<h2 class="banniere">${gagne ? 'BRAVO !' : 'DOMMAGE...'}</h2><div>${phrase}<br>TU PERDS ${morts(moi)} GUERRIER${morts(moi) > 1 ? 'S' : ''}, EUX ${morts(1 - moi)}.${extra}</div>`;
    $('issue').append(bouton('CONTINUER', ok, true, '', 'vert'));
    $('issue').classList.remove('cache');
  });
  fermerBataille(); ecran = 'carte';
  if (res.tombe != null) toast(res.tombe === 0 ? 'Ton château est tombé...' : `${etat.seigneurs[res.tombe].nom} a perdu son château : ses cases sont à ${res.sAtt === 0 ? 'toi' : etat.seigneurs[res.sAtt].nom} !`);
  return res;
}
$('vite').onclick = () => { vitesseB = vitesseB > 1 ? 1 : 2.5; $('vite').textContent = vitesseB > 1 ? 'VITE : OUI' : 'VITE'; };

// ---------- le château et le village ----------
function menuAcheter(i) {
  const place = banPlaceAuChateau(etat, 0), caserne = banNbBat(etat, 0, 'caserne');
  const ici = banArmeeSur(etat, banChateau(etat, 0)), max = banMaxUnites(etat, 0), nA = banArmeesDe(etat, 0).length;
  const armee = ici ? `<p>AU CHATEAU : ${ici.unites.map(u => sansAccent(BAN_UNITES[u.type].nom) + ' ' + I('coeur') + u.pv).join(', ')}<br>PLACE : ${ici.unites.length}/${max}</p>`
    : `<p>PAS D'ARMEE AU CHATEAU : LES NOUVEAUX FORMENT UNE NOUVELLE ARMEE (${nA}/${BAN_MAX_ARMEES} ARMEES).</p>`;
  boite('ACHETER', `<p>TU AS ${pieces()} ${I('piece')}.</p>${armee}${place ? '' : `<p>PLUS DE PLACE (${max} PAR ARMEE, ${BAN_MAX_ARMEES} ARMEES).</p>`}`,
    BAN_ACHATS.map(ty => {
      const U = BAN_UNITES[ty], p = banPeutAcheter(etat, 0, ty);
      const base = BAN_UNITES[ty].pv, plus = banCoeursMax(etat, ty, 0) - base;
      return bouton(`${sansAccent(U.nom)} · ${banPrix(etat, 0, ty)} ${I('piece')} · ${I('coeur').repeat(base)}${plus ? ` +${I('coeur').repeat(plus)} FORGE` : ''}`, () => { if (banAcheter(etat, 0, ty).ok) { Sons.piece(); majTout(i); sauver(); menuAcheter(i); } }, p.ok, U.caserne && !caserne ? 'Il faut une caserne.' : POUVOIRS[ty]);
    }).concat([bouton('FINI', () => { fermer(); majFiche(i); }, true, '', 'vert')]));
}
function menuConstruire(i) {
  boite('CONSTRUIRE', `<p>TU AS ${pieces()} ${I('piece')}. UN BATIMENT PAR CASE.</p>`,
    Object.keys(BAN_BATIMENTS).map(k => { const B = BAN_BATIMENTS[k], p = banPeutConstruire(etat, 0, i, k); return bouton(`${sansAccent(B.nom)} · ${B.prix} ${I('piece')}`, () => { fermer(); construire(i, k); }, p.ok, p.ok || p.raison === 'Pas assez de pièces.' ? B.phrase : p.raison); })
      .concat([bouton('RETOUR', () => { fermer(); majFiche(i); })]));
}
function construire(i, k) {
  const r = banConstruire(etat, 0, i, k); if (!r.ok) { toast(r.raison); return; }
  Sons.batir(); majTout(i); sauver();
  toast(r.grandit ? (banEtapeChateau(etat, 0) >= 2 ? 'Ton château a des remparts : 8 guerriers par armée !' : 'Ton château a des drapeaux !') : BAN_BATIMENTS[k].nom + ' construit' + (k === 'maison' ? 'e' : '') + ' !');
}
function menuAgrandir(i) {
  const t = etat.terres[i], B = BAN_BATIMENTS[t.bat];
  boite('AGRANDIR', `<p>${sansAccent(B.grand)} · ${B.prix} ${I('piece')}<br>${sansAccent(B.plus)}</p><p class="petit">ON NE PEUT AGRANDIR QU'UNE FOIS.</p>`, [
    bouton('AGRANDIR', () => { fermer(); if (banAmeliorer(etat, 0, i).ok) { Sons.batir(); majTout(i); sauver(); toast(B.grand + ' !'); } }, banPeutAmeliorer(etat, 0, i).ok, '', 'vert'),
    bouton('RETOUR', () => { fermer(); majFiche(i); }),
  ]);
}
// RESTER DANS LA TOUR : l'armée devient la garnison de la grande tour, pour toujours
function menuGarnison(id) {
  const a = banArmee(etat, id), t = a && etat.terres[a.terre]; if (!a) return;
  boite('RESTER DANS LA TOUR', `<p>TES GUERRIERS ENTRENT DANS LA TOUR ET Y RESTENT POUR TOUJOURS. ILS LA DEFENDENT AVEC LA GARDE.</p><p class="petit">${BAN_GARNISON_MAX} AU PLUS (DEJA ${(t.garnison || []).length}). LE SEIGNEUR RESTE DEHORS.</p>`, [
    bouton('ILS RESTENT', () => { fermer(); const r = banGarnison(etat, 0, id); if (r.ok) { Sons.batir(); deselectionner(); majTout(a.terre); sauver(); toast(r.n + ' guerrier' + (r.n > 1 ? 's' : '') + ' dans la tour !'); } }, true, '', 'vert'),
    bouton('RETOUR', fermer),
  ]);
}
// MON ROYAUME (toucher le haut de l'écran) : ce qu'on gagne, ce qu'on peut avoir, les bonus
function monRoyaume() {
  if (ecran !== 'carte' || occupe || bataille) return;
  const n = banDrapeaux(etat, 0), bats = etat.terres.filter(t => t.prop === 0 && t.bat && BAN_BATIMENTS[t.bat]);
  const gainBat = bats.reduce((x, t) => x + (BAN_BATIMENTS[t.bat].gain ? BAN_BATIMENTS[t.bat].gain + (t.grand ? 1 : 0) : 0), 0), bonus = banNiveau(etat).bonus;
  const a = (b, txt) => `<li>${I(b ? 'etoile' : 'vide')} ${txt}</li>`, forge = banNbBat(etat, 0, 'forge'), caserne = banNbBat(etat, 0, 'caserne'), etape = banEtapeChateau(etat, 0);
  const tours = etat.terres.filter(t => t.prop === 0 && t.bat === 'tour'), garnison = tours.reduce((x, t) => x + (t.garnison || []).length, 0);
  const garde = (etat.niveau === 'facile' ? banNiveau(etat).garde : BAN_GARDE).length + (etat.niveau === 'facile' ? etape : 0);
  boite('MON ROYAUME', `<p>${I('piece')} CHAQUE TOUR : +${banRevenu(etat, 0)}<br>(${n} CASES${gainBat ? ` + ${gainBat} BATIMENTS` : ''}${bonus ? ` + ${bonus} FACILE` : ''}). COFFRE : ${pieces()}/${BAN_COFFRE}</p>` +
    `<p>ARMEES : ${banArmeesDe(etat, 0).length}/${BAN_MAX_ARMEES} · ${banMaxUnites(etat, 0)} GUERRIERS PAR ARMEE${etape >= 2 ? ' (REMPARTS)' : ''}<br>GARDE DU CHATEAU : ${garde} GUERRIERS</p>` +
    `<ul class="bonus">${a(etape >= 1, 'DRAPEAUX AU CHATEAU (3 BATIMENTS)' + (etat.niveau === 'facile' ? ' : +1 ARCHER DE GARDE' : ''))}${a(etape >= 2, 'REMPARTS (6 BATIMENTS) : 8 GUERRIERS PAR ARMEE' + (etat.niveau === 'facile' ? ', +1 CHAMPION DE GARDE' : ''))}` +
    `${a(forge, 'FORGE : +1 ' + I('coeur') + ' CHEVALIERS ET LANCIERS' + (banGrand(etat, 0, 'forge') ? ', CHAMPIONS AUSSI' : ''))}${a(caserne, 'CASERNE : CHAMPIONS' + (banGrand(etat, 0, 'caserne') ? ', SOIGNE LA MOITIE DES COEURS' : ''))}` +
    `${a(tours.length, `TOURS : ${tours.length}${garnison ? `, ${garnison} EN GARNISON` : ''}`)}${etat.seigneurs[0].blesse ? `<li>${I('coeur')} TON SEIGNEUR REVIENT AU TOUR ${etat.seigneurs[0].blesse}</li>` : ''}</ul>` +
    `<p class="petit">UNE SEULE FORGE ET UNE SEULE CASERNE : ELLES NE S'ADDITIONNENT PAS.</p>`, [bouton('OK', fermer, true, '', 'vert')]);
}
$('res').onclick = monRoyaume;
function decorer(i) { const r = banDecorer(etat, 0, i); if (!r.ok) { toast(r.raison); return; } Sons.toc(); majTout(i); sauver(); }
function soigner(id, i) { if (banSoigner(etat, 0, id).ok) { Sons.piece(); majTout(i); sauver(); toast('Tous les cœurs sont revenus !'); } }

// ---------- FIN DU TOUR : les rivaux jouent, puis le tour suivant ----------
async function finDuTour() {
  if (occupe || bataille || ecran !== 'carte' || etat.fin) return;
  deselectionner(); occupe = true; majFiche(); $('fin').textContent = 'VITE'; $('fin').classList.add('vite');
  for (let s = 1; s < 4 && !etat.fin; s++) {
    if (etat.seigneurs[s].tombe) continue;
    banIaGerer(etat, s); majScene();
    for (const id of banArmeesDe(etat, s).map(a => a.id)) {
      const a = banArmee(etat, id); if (!a || etat.fin) continue;
      const c = banIaCoup(etat, a); if (!c) continue;
      const depart = a.terre, r = banDeplacer(etat, id, c.vers); if (!r.ok) continue;
      await marcher(id, depart, r.chemin); majScene();
      if (r.bataille) {
        const ap = banApercu(etat, id, c.vers);
        if (ap.sDef === 0) { occupe = false; await combattre(id, c.vers, c.tac); occupe = true; }   // on attaque le joueur : il choisit comment se défendre
        else {   // une bataille entre les autres : on la voit de loin
          const res = banResoudre(etat, id, c.vers, c.tac, banTactiqueIA(ap.D, ap.sDef < 0)); secouer(c.vers);
          if (res && res.tombe != null) toast(`${etat.seigneurs[res.tombe].nom} a perdu son château !`);
        }
        majTout();
      }
      majArmees();
    }
  }
  vite = false; $('fin').textContent = 'FIN DU TOUR'; $('fin').classList.remove('vite');
  if (!etat.fin) await tourSuivant();
  occupe = false; majTout(); sauver();
  if (etat.fin) montrerFin();
}
async function tourSuivant() {
  const avant = pieces(), revenu = banRevenu(etat, 0), r = banFinTour(etat);
  appliquerSaison();
  if (etat.fin || !r) return;
  majTout();
  if (r.gains[0]) { Sons.piece(); toast(`+${r.gains[0]} pièces !`); }
  if (pieces() >= BAN_COFFRE && r.gains[0] < revenu) toast(avant >= BAN_COFFRE ? 'Ton coffre est plein : dépense-les !' : `+${r.gains[0]} pièces : ton coffre est plein !`);
  if (r.retour.includes(0)) toast('Ton seigneur est guéri : il est au château.');
  if (r.surprise) {
    const S = BAN_SURPRISES[r.surprise.id];
    await demander(S.titre, `<p>${sansAccent(S.texte)}${r.surprise.note ? '<br>' + sansAccent(r.surprise.note) : ''}</p>`, [['SUPER !', true, '', 'vert']]);
    majTout();
  }
  if (etat.tour === BAN_DERNIER_TOUR - 2)
    await demander('PLUS QUE 3 TOURS !', `<p>APRES LE TOUR ${BAN_DERNIER_TOUR}, ON COMPTE LES DRAPEAUX. TU EN AS ${banDrapeaux(etat, 0)} ${I('drapeau')}.</p>`, [['OK !', true, '', 'vert']]);
}
$('fin').onclick = () => { if (occupe) { vite = !vite; vitesseB = vite ? 2.5 : 1; $('fin').textContent = vite ? 'VITE : OUI' : 'VITE'; } else finDuTour(); };

// ---------- la fin de la partie ----------
function montrerFin() {
  if (ecran === 'fin') return;
  const F = etat.fin; ecran = 'fin';
  // le record et le classement : les drapeaux à la fin, sur la petite carte seulement (la grande en donne plus)
  const classee = etat.rayon === 3, sc = banScore(etat), best = classee ? Math.max(lire('best', 0), sc) : lire('best', 0);
  const st = lire('stats', {}); st.parties = (st.parties || 0) + 1; if (F.gagne) st.gagnees = (st.gagnees || 0) + 1; ecrire('stats', st);
  ecrire('best', best); ecrire('run', null);
  const LS = window.LudoScores;
  if (classee && LS && sc > 0) LS.submit('bannieres', 'best', sc, false).catch(() => {});
  const titre = F.issue === 'victoire' ? 'VICTOIRE !' : F.issue === 'defaite' ? 'OH NON...' : F.gagne ? 'TU AS GAGNE !' : 'FINI !';
  const texte = F.issue === 'victoire' ? 'TU AS PRIS LES 3 CHATEAUX. TU ES LE ROI DES BANNIERES !' : F.issue === 'defaite' ? "ON T'A PRIS TON CHATEAU." : `${BAN_DERNIER_TOUR} TOURS SONT PASSES. ON COMPTE LES DRAPEAUX :`;
  const liste = F.classement.map((x, k) => `${k + 1}. ${nomSeigneur(x.s)} : ${x.n} ${I('drapeau')}`).join('<br>');
  if (F.gagne) { Sons.victoire(); feuArtifice(); } else Sons.triste();
  boite(titre, `<p>${texte}</p><p>${liste}</p>${F.issue === 'drapeaux' && !F.gagne ? '<p>LA PROCHAINE FOIS, PRENDS PLUS DE CASES !</p>' : ''}<p class="petit">${classee ? `RECORD : ${best} ${I('drapeau')}` : 'GRANDE CARTE : PAS DE RECORD.'}</p>`, [
    bouton('REJOUER', () => { fermer(); nouvellePartie(opts.niveau, opts.rayon); }, true, '', 'vert'),
    bouton('TITRE', () => { fermer(); montrerTitre(); }),
  ]);
}

// ---------- les écrans du menu ----------
function nouvellePartie(niveau, rayon, graine) {
  etat = banNouvelle(graine == null ? Math.floor(Date.now() % 1e9) : graine, niveau, rayon, opts.coul);
  opts.niveau = etat.niveau; opts.rayon = etat.rayon; ecrire('opts', opts);
  commencer();
  if (!lire('tuto', false)) { ecrire('tuto', true); setTimeout(() => aide(0), 2600); }
}
function commencer() {
  armeeChoisie = null; chemins = null; occupe = false; tourneSeule = false; angle = -0.5;
  $('titre').classList.add('cache'); document.body.classList.remove('au-titre');
  cadrer(); nouvelleScene(); majRes(); majFiche(); sauver();
  ecran = 'carte';
}
function montrerTitre() {
  ecran = 'titre'; fermer(); fermerBataille();
  const run = banMigrer(lire('run', null));
  if (!etat || etat.fin || !run) { etat = run || Object.assign(banNouvelle(20261022, 'facile', 3), { demo: true }); cadrer(); nouvelleScene(); }
  tourneSeule = true; document.body.classList.add('au-titre');
  $('bContinuer').hidden = !run;
  $('tRecord').innerHTML = lire('best', 0) ? `RECORD : ${lire('best', 0)} ${I('drapeau')}` : '';
  $('bSons').textContent = 'SONS : ' + (opts.sons ? 'OUI' : 'NON');
  $('titre').classList.remove('cache');
}
$('bContinuer').onclick = () => { const run = banMigrer(lire('run', null)); if (!run) return; etat = run; commencer(); };
$('bNouvelle').onclick = () => {
  const carte = () => `CARTE : ${opts.rayon === 4 ? 'GRANDE (61 CASES)' : 'PETITE (37 CASES)'}`;
  // la couleur de ta bannière : 4 pastilles ; les autres seigneurs prennent les 3 autres couleurs
  const couleurs = () => {
    const d = document.createElement('div'); d.className = 'couleurs';
    BAN_COULEURS.forEach(c => {
      const b = document.createElement('button'); b.className = 'pastille' + (opts.coul === c ? ' choisie' : '');
      b.style.setProperty('--c', '#' + COUL[c].hex.toString(16).padStart(6, '0'));
      b.innerHTML = `<i></i>${{ or: 'OR', rouge: 'ROUGE', bleu: 'BLEU', violet: 'VIOLET' }[c]}`;
      b.onclick = () => { opts.coul = c; ecrire('opts', opts); Sons.toc(); choix(); };
      d.append(b);
    });
    return d;
  };
  const choix = () => boite('NOUVELLE PARTIE', '<p>TA COULEUR :</p>', [
    couleurs(),
    (() => { const p = document.createElement('p'); p.innerHTML = 'CHOISIS TON NIVEAU.'; p.style.marginTop = '10px'; return p; })(),
    bouton('FACILE', () => { fermer(); nouvellePartie('facile', opts.rayon); }, true, 'Les autres seigneurs sont gentils.', 'vert'),
    bouton('NORMAL', () => { fermer(); nouvellePartie('normal', opts.rayon); }, true, 'Ils attaquent plus souvent.'),
    bouton(carte(), () => { opts.rayon = opts.rayon === 4 ? 3 : 4; ecrire('opts', opts); choix(); }),
    bouton('RETOUR', fermer),
  ]);
  choix();
};
$('bAide').onclick = () => aide(0);
$('bSons').onclick = () => { opts.sons = !opts.sons; Sons.actif = opts.sons; ecrire('opts', opts); $('bSons').textContent = 'SONS : ' + (opts.sons ? 'OUI' : 'NON'); };
// COMMENT JOUER : 4 petites pages avec des dessins
const AIDE = [
  ['BOUGE TES ARMEES', `<p>${I('drapeau')} TOUCHE UNE ARMEE, PUIS UNE CASE QUI BRILLE. ELLE Y COURT ET LES CASES DEVIENNENT A TOI.</p><p>UNE ARMEE BOUGE UNE FOIS PAR TOUR, DE 2 PAS. L'HERBE = 1 PAS ; LA FORET, LA COLLINE, LE MARAIS, LA RIVIERE = 2 PAS. LA MONTAGNE T'ARRETE.</p>`],
  ['LES BATAILLES', `<p>UNE CASE ROUGE = UNE BATAILLE. CHOISIS COMMENT TE BATTRE : FONCER, TIRER D'ABORD OU PRUDENT.</p><p><span class="etoiles">${I('etoile').repeat(3)}</span> FACILE · <span class="etoiles">${I('etoile').repeat(2)}${I('vide')}</span> CA PEUT MARCHER · <span class="etoiles">${I('etoile')}${I('vide').repeat(2)}</span> DIFFICILE</p><p>LES ${I('coeur')} AU-DESSUS DES GUERRIERS DISPARAISSENT QUAND ILS SONT TOUCHES.</p>`],
  ['TON VILLAGE', `<p>${I('piece')} CHAQUE TOUR, CHAQUE CASE A TOI DONNE 1 PIECE. TON COFFRE EST PLEIN A ${BAN_COFFRE} : DEPENSE-LES !</p><p>AU ${I('chateau')} : ACHETE DES GUERRIERS ET SOIGNE TON ARMEE. SUR TES CASES : CONSTRUIS, AGRANDIS ET DECORE TON VILLAGE.</p><p>TOUCHE LE HAUT DE L'ECRAN POUR VOIR TON ROYAUME ET TES BONUS.</p>`],
  ['GAGNER', `<p>${I('chateau')} PRENDS LES 3 CHATEAUX DES AUTRES : TU ES LE ROI !</p><p>${I('drapeau')} SINON, APRES LE TOUR ${BAN_DERNIER_TOUR}, ON COMPTE LES DRAPEAUX : CELUI QUI EN A LE PLUS GAGNE.</p><p>GARDE BIEN TON CHATEAU !</p>`],
];
function aide(n) {
  const [t, h] = AIDE[n];
  boite(t, h + `<p class="petit">${n + 1} / ${AIDE.length}</p>`, [
    n < AIDE.length - 1 ? bouton('SUITE', () => aide(n + 1), true, '', 'vert') : bouton("C'EST PARTI !", fermer, true, '', 'vert'),
    n > 0 ? bouton('RETOUR', () => aide(n - 1)) : null,
  ].filter(Boolean));
}
// MENU pendant la partie (la pause)
$('menu').onclick = () => {
  if (occupe || bataille || ecran !== 'carte') return;
  boite('MENU', '', [
    bouton('CONTINUER', fermer, true, '', 'vert'),
    bouton('COMMENT JOUER', () => aide(0)),
    bouton('SONS : ' + (opts.sons ? 'OUI' : 'NON'), () => { opts.sons = !opts.sons; Sons.actif = opts.sons; ecrire('opts', opts); $('menu').onclick(); }),
    bouton('TITRE', () => { sauver(); fermer(); montrerTitre(); }, true, 'La partie est gardée.'),
    (() => { const a = document.createElement('a'); a.className = 'bouton ludo-retour'; a.href = '../index.html'; a.textContent = '◀ LUDOTHEQUE'; a.onclick = () => sauver(); return a; })(),
  ]);
};

// ---------- toucher, tourner, animer ----------
let doigt = null;
rendu.domElement.addEventListener('pointerdown', e => { doigt = { x: e.clientX, y: e.clientY, a: angle, bouge: false }; });
addEventListener('pointermove', e => {
  if (!doigt || bataille) return;
  const dx = e.clientX - doigt.x;
  if (Math.abs(dx) > 6) doigt.bouge = true;
  if (doigt.bouge) { angle = doigt.a - dx * 0.008; tourneSeule = false; }
});
addEventListener('pointerup', e => { if (doigt && !doigt.bouge) choisir(e.clientX, e.clientY); doigt = null; });
addEventListener('resize', cadrer);
let avant = performance.now();
function boucle(now) {
  const dt = Math.min(0.05, (now - avant) / 1000); avant = now;
  try { if (bataille) animerBataille(now, dt); else if (etat) animerCarte(now, dt); } catch (e) { console.error(e); }
  requestAnimationFrame(boucle);
}

// ---------- au démarrage : la police et les personnages, puis le titre ----------
document.body.prepend(rendu.domElement);
const police = document.fonts ? document.fonts.load("10px 'Press Start 2P'").catch(() => {}) : Promise.resolve();
Promise.all([police, preparerAventuriers().catch(e => console.error('personnages', e))]).then(() => {
  $('chargement').classList.add('cache');
  montrerTitre(); requestAnimationFrame(boucle);
});

window.Bannieres = {
  get etat() { return etat; }, get ecran() { return ecran; }, get occupe() { return occupe; },
  nouvelle: (niveau, rayon, graine) => nouvellePartie(niveau || 'facile', rayon || 3, graine),
  deplacer: deplacerJoueur, finTour: finDuTour, construire, decorer, soigner, menuAcheter,
  titre: montrerTitre,
};

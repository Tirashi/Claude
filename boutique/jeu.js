/* =====================================================================
   LA BOUTIQUE DE CARTES · le JEU : la page par-dessus le monde 3D.
   Session 2 : la semaine (lundi → cinq jours rejoués en 3D → bilan du
   dimanche), aménager et agrandir, les rencontres, la sauvegarde.
   Les écrans du lundi (grossiste, vitrines, classeur, boosters), le titre,
   les sons et le classement viennent en session 3 (specs § 16).
   ===================================================================== */
'use strict';
const Boutique = (() => {
  const $ = id => document.getElementById(id);
  const CLE = 'boutique.run';
  let e = null, vignettes = {}, vitesse = 1, pause = false, amen = false, caisseVue = 0;
  const euros = v => (Math.round(v * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
  const attendre = ms => new Promise(ok => setTimeout(ok, ms));

  /* ---------- sauvegarde ---------- */
  function sauver() { try { localStorage.setItem(CLE, JSON.stringify(e)); } catch (err) { /* stockage plein ou interdit : la partie continue */ } }
  function relire() { try { return bouMigrer(JSON.parse(localStorage.getItem(CLE))); } catch (err) { return null; } }
  function nouvelle() { e = bouNouvelle('b' + Date.now().toString(36)); sauver(); }

  /* ---------- le haut de l'écran ---------- */
  function majHaut() {
    const jour = e.phase === 'lundi' ? 'LUNDI' : e.phase === 'semaine' ? BOU_JOURS[Math.min(e.jour, 4)] : e.phase === 'dimanche' ? 'DIMANCHE' : 'FIN';
    $('hSemaine').textContent = 'SEMAINE ' + e.semaine + ' · ' + jour;
    const S = bouSaison(e.semaine), T = bouTaille(e), ev = e.evenement;
    $('hInfo').textContent = [T.L + ' × ' + T.P, 'réputation ' + Math.round(e.reputation), S.nom, ev && ev.nom].filter(Boolean).join(' · ');
    if (e.phase !== 'semaine') caisseVue = e.caisse;
    $('hCaisse').textContent = euros(caisseVue);
    $('hArgent').classList.toggle('moins', caisseVue < 0);
    $('barreLundi').hidden = e.phase !== 'lundi' || amen;
    $('barreSemaine').hidden = e.phase !== 'semaine';
  }
  function journal(t) { const j = $('journal'), d = document.createElement('div'); d.textContent = t; j.appendChild(d); while (j.children.length > 3) j.firstChild.remove(); setTimeout(() => d.remove(), 6000); }

  /* ---------- fenêtres ---------- */
  // une fenêtre avec des boutons ; la promesse rend la valeur du bouton touché
  let ouverteA = 0;
  function boite(html, boutons) {
    $('boite').innerHTML = html + '<div class="boutons">' + boutons.map((b, i) => '<button data-i="' + i + '" class="' + (b.classe || 'vert') + '">' + b.texte + '</button>').join('') + '</div>';
    $('voile').hidden = false; ouverteA = performance.now();
    return new Promise(ok => {
      $('boite').querySelectorAll('.boutons button').forEach(btn => btn.onclick = () => {
        if (performance.now() - ouverteA < 400) return;   // le clic du toucher qui a ouvert la fenêtre (specs/ludotheque.md, Bannières)
        $('voile').hidden = true; ok(boutons[+btn.dataset.i].valeur);
      });
    });
  }
  function mini(id) { const cv = BouCartes.dessiner(bouCarte(e, id)); cv.title = bouCarte(e, id).nom; return cv; }

  /* ---------- la semaine ---------- */
  async function ouvrirBoutique() {
    if (!bouOuvrirBoutique(e)) return;
    majHaut();
    while (e.phase === 'semaine') {
      BouMonde.maj(e);   // la boutique telle qu'elle est au début du jour
      caisseVue = e.caisse;
      const j = bouJour(e);
      $('sJour').textContent = j.nom; $('sClients').textContent = j.visites.length + ' clients';
      $('hSemaine').textContent = 'SEMAINE ' + e.semaine + ' · ' + j.nom;
      await BouMonde.rejouer(j, 9);
      caisseVue = e.caisse; majHaut();
      if (j.tournoi) journal('Tournoi : ' + j.tournoi.inscrits + ' joueurs, ' + euros(j.tournoi.recette) + ' d\'inscriptions');
      while (e.rencontre) await rencontre();
      BouMonde.maj(e);
      await attendre(300);
    }
    await dimanche();
  }
  async function rencontre() {
    const r = e.rencontre;
    let res;
    if (r.type === 'vendeur') {
      const html = '<h2>UNE COLLECTION À VENDRE</h2><p>« Je vends toute ma collection : <b>' + r.cartes.length + ' cartes</b> pour <b>' + euros(r.prix) + '</b>. »</p><div class="cartes" id="rc"></div><p>Cote totale : <b>' + euros(r.valeur) + '</b></p>';
      const p = boite(html, [{ texte: 'NON MERCI', classe: 'gris', valeur: 'non' }, { texte: 'ACHETER', valeur: 'oui' }]);
      r.cartes.forEach(id => $('rc').appendChild(mini(id)));
      res = await p;
    } else if (r.type === 'collectionneur') {
      const c = bouCarte(e, r.carte), html = '<h2>UN COLLECTIONNEUR</h2><p>« Vous avez <b>' + c.nom + '</b> ? Je vous l\'achète <b>' + euros(r.offre) + '</b>. »</p><div class="cartes grande" id="rc"></div><p>Sa cote : ' + euros(bouCote(e, r.carte)) + '</p>';
      const p = boite(html, [{ texte: 'JE LA GARDE', classe: 'gris', valeur: 'non' }, { texte: 'VENDRE', valeur: 'oui' }]);
      $('rc').appendChild(mini(r.carte));
      res = await p;
    } else {
      const html = '<h2>UN MARCHAND</h2><p>« Je vous prends vos <b>' + r.nb + ' cartes</b> communes et peu communes pour <b>' + euros(r.offres[r.etape]) + '</b>' + (r.etape ? ', c\'est mon offre ' + (r.etape === 2 ? 'finale' : 'suivante') : '') + '. »</p><p>Leur cote totale : ' + euros(r.valeur) + '</p>';
      res = await boite(html, [{ texte: 'NON', classe: 'gris', valeur: 'non' }, { texte: 'D\'ACCORD', valeur: 'oui' }]);
    }
    const out = bouRepondre(e, res);
    if (out && out.ok === false) { await boite('<p>Pas assez d\'argent en caisse.</p>', [{ texte: 'TANT PIS', valeur: 0 }]); bouRepondre(e, 'non'); }
    caisseVue = e.caisse; majHaut();
  }
  async function dimanche() {
    const b = bouDimanche(e);
    if (!b) return;
    const c = b.compte, lignes = [['Ventes', c.ventes], ['Tournoi', c.tournoi], ['Rencontres', c.rencontres], ['Borne d\'arcade', c.arcade], ['Commandes', -c.achats], ['Meubles et travaux', -c.meubles], ['Loyer', -c.loyer]].filter(l => l[1]);
    const hausse = Object.values(b.cotes).filter(([a, n]) => n > a).length, baisse = Object.values(b.cotes).filter(([a, n]) => n < a).length;
    let html = '<h2>BILAN DE LA SEMAINE ' + b.semaine + '</h2><table>' + lignes.map(l => '<tr><td>' + l[0] + '</td><td>' + (l[1] > 0 ? '+' : '') + euros(l[1]) + '</td></tr>').join('') + '</table>';
    html += '<p>' + c.clients + ' clients · réputation ' + Math.round(e.reputation) + (hausse + baisse ? ' · cotes de tes cartes : ' + hausse + ' ▲ ' + baisse + ' ▼' : '') + '</p>';
    if (b.banque) html += '<p>La banque a pris <b>' + euros(b.banque) + '</b> (le prêt et 20 %).</p>';
    if (b.fin) {
      html += b.fin.raison === 'faillite' ? '<p><b>FAILLITE !</b> La boutique ferme. Score : ' + b.fin.score + '</p>' : '<p><b>L\'ANNÉE EST FINIE !</b> Valeur de la boutique : ' + euros(b.fin.valeur) + '</p>';
      await boite(html, [{ texte: 'NOUVELLE PARTIE', valeur: 1 }]);
      nouvelle(); BouMonde.maj(e); majHaut(); return;
    }
    html += '<p>Valeur de la boutique : <b>' + euros(b.valeur) + '</b>' + (e.pret ? ' · prêt à rendre : ' + euros(e.pret) + ' (semaine ' + BOU_ECHEANCE + ')' : '') + '</p>';
    if (b.evenement) html += '<p>Cette semaine : <b>' + b.evenement.nom + '</b></p>';
    const X = bouCatalogue(e.graine).extensions.find(x => x.sortie === e.semaine);
    if (X && X.n > 1) html += '<p>Sortie de l\'extension <b>' + X.nom + '</b> !</p>';
    await boite(html, [{ texte: 'SEMAINE ' + e.semaine, valeur: 1 }]);
    sauver(); BouMonde.maj(e); majHaut();
  }

  /* ---------- aménager ---------- */
  let choisi = null;
  function feuille(n) { ['fCatalogue', 'fPose', 'fChoix'].forEach(f => $(f).hidden = f !== n); }
  function majCatalogue() {
    const c = $('catalogue'); c.innerHTML = '';
    const A = BOU_TAILLES[e.niveau + 1];
    if (A) { const d = document.createElement('div'); d.className = 'objet agrandir'; d.innerHTML = '<img alt="" src="' + vignetteAgrandir() + '"><b>Agrandir la boutique</b><span>' + euros(A.prix) + '</span>'; d.onclick = proposerAgrandir; c.appendChild(d); }
    for (const t in BOU_MEUBLES) {
      const M = BOU_MEUBLES[t]; if (M.unique) continue;
      const bloque = M.des && e.semaine < M.des, d = document.createElement('div');
      d.className = 'objet' + (bloque ? ' bloque' : M.prix > e.caisse ? ' trop' : '');
      d.innerHTML = '<img alt="" src="' + (vignettes[t] || '') + '"><b>' + M.nom + '</b><span>' + (bloque ? 'semaine ' + M.des : euros(M.prix)) + '</span>';
      d.onclick = () => { if (!bloque) poser(t); };
      c.appendChild(d);
    }
  }
  function vignetteAgrandir() {
    const cv = document.createElement('canvas'); cv.width = cv.height = 76; const c = cv.getContext('2d');
    c.fillStyle = '#7fbf6a'; c.fillRect(8, 20, 60, 44); c.setLineDash([6, 4]); c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeRect(10, 22, 56, 40);
    c.fillStyle = '#fffaf0'; c.fillRect(22, 8, 32, 20); c.strokeStyle = '#e5534b'; c.setLineDash([]); c.lineWidth = 2; c.strokeRect(22, 8, 32, 20);
    c.fillStyle = '#e5534b'; c.font = '9px "Luckiest Guy", sans-serif'; c.textAlign = 'center'; c.fillText('À VENDRE', 38, 22);
    return cv.toDataURL();
  }
  function amenager(oui) {
    amen = oui; BouMonde.amenager(oui); choisi = null;
    $('feuille').hidden = !oui; $('journal').hidden = oui;
    feuille('fCatalogue'); if (oui) majCatalogue(); majHaut();
  }
  function poser(type, deplace) {
    choisi = null; BouMonde.selectionner(null);
    const m = deplace && e.meubles.find(q => q.id === deplace), r = m ? m.r : 0, [x, z] = m ? [m.x, m.z] : BouMonde.caseLibre(type, r);
    BouMonde.commencerFantome(type, x, z, r, deplace || null);
    const M = BOU_MEUBLES[type];
    $('poseNom').innerHTML = M.nom + '<small>' + (deplace ? 'déplacement gratuit' : euros(M.prix)) + '</small>';
    $('poseOk').textContent = deplace ? 'ICI' : 'POSER';
    feuille('fPose');
  }
  const AIDE = { place: 'La place est prise.', chemin: 'Les clients ne pourraient plus passer (porte, caisse ou meuble bouché).' };
  BouMonde.ecouter('fantome', f => {
    const cher = !f.deplace && BOU_MEUBLES[f.type].prix > e.caisse;
    $('poseOk').disabled = !!f.raison || cher;
    $('poseAide').textContent = cher ? 'Pas assez d\'argent en caisse.' : f.raison ? AIDE[f.raison] : 'Fais glisser le meuble avec le doigt.';
  });
  $('poseTourner').onclick = () => BouMonde.tournerFantome();
  $('poseAnnuler').onclick = () => { BouMonde.finFantome(); feuille('fCatalogue'); };
  $('poseOk').onclick = () => {
    const f = BouMonde.fantome; if (!f || f.raison) return;
    const { type, x, z, r, deplace } = f;
    BouMonde.finFantome();
    if (deplace) bouDeplacer(e, deplace, x, z, r);
    else { const res = bouPoser(e, type, x, z, r); if (res.ok) { journal(BOU_MEUBLES[type].nom + ' : −' + euros(BOU_MEUBLES[type].prix)); if (type === 'rayon') bouRanger(e, res.meuble.id, 0, 'booster:' + bouDerniere(e).n); } }
    BouMonde.maj(e); sauver(); majHaut(); majCatalogue(); feuille('fCatalogue');
  };
  BouMonde.ecouter('meuble', m => {
    if (!amen || !m) return;
    choisi = m; BouMonde.selectionner(m.id);
    const M = BOU_MEUBLES[m.type];
    $('choixNom').innerHTML = M.nom + '<small>attrait +' + M.attrait + '</small>';
    $('choixVendre').hidden = !!M.unique; $('choixVendre').textContent = 'VENDRE +' + euros(Math.floor(M.prix / 2));
    feuille('fChoix');
  });
  BouMonde.ecouter('vide', () => { if (amen && choisi) { choisi = null; BouMonde.selectionner(null); feuille('fCatalogue'); } });
  BouMonde.ecouter('terrain', () => { if (e.phase === 'lundi') proposerAgrandir(); });
  BouMonde.ecouter('vente', (total, x, y) => {
    caisseVue += total; $('hCaisse').textContent = euros(caisseVue);
    const d = document.createElement('div'); d.className = 'gain'; d.textContent = '+' + euros(total); d.style.left = x + 'px'; d.style.top = y + 'px';
    document.body.appendChild(d); setTimeout(() => d.remove(), 1400);
  });
  $('choixFermer').onclick = () => { choisi = null; BouMonde.selectionner(null); feuille('fCatalogue'); };
  $('choixTourner').onclick = () => { const m = choisi; if (bouDeplacer(e, m.id, m.x, m.z, (m.r + 1) % 4)) { BouMonde.maj(e); BouMonde.selectionner(m.id); sauver(); } };
  $('choixDeplacer').onclick = () => { const m = choisi; poser(m.type, m.id); };
  $('choixVendre').onclick = () => { const m = choisi; choisi = null; BouMonde.selectionner(null); if (bouVendreMeuble(e, m.id)) { BouMonde.maj(e); sauver(); majHaut(); majCatalogue(); } feuille('fCatalogue'); };
  async function proposerAgrandir() {
    const A = BOU_TAILLES[e.niveau + 1], T = bouTaille(e); if (!A || e.phase !== 'lundi') return;
    const ok = A.prix <= e.caisse;
    const v = await boite('<h2>' + A.nom + '</h2><p>La boutique passe de ' + T.L + ' × ' + T.P + ' à <b>' + A.L + ' × ' + A.P + '</b> cases.</p><p>Prix : <b>' + euros(A.prix) + '</b> · loyer : ' + euros(T.loyer) + ' → ' + euros(A.loyer) + ' par semaine.</p>',
      [{ texte: 'PLUS TARD', classe: 'gris', valeur: 0 }, { texte: ok ? 'ACHETER' : 'PAS ASSEZ', valeur: ok ? 1 : 0 }]);
    if (v && bouAgrandir(e)) { BouMonde.maj(e); sauver(); majHaut(); majCatalogue(); journal('Boutique agrandie : ' + A.L + ' × ' + A.P); }
  }

  /* ---------- boutons ---------- */
  $('bAmenager').onclick = () => amenager(true);
  $('fini').onclick = () => amenager(false);
  $('bOuvrir').onclick = () => ouvrirBoutique();
  $('gauche').onclick = () => BouMonde.tourner(-1);
  $('droite').onclick = () => BouMonde.tourner(1);
  $('bVitesse').onclick = () => { vitesse = vitesse === 4 ? 1 : vitesse * 2; BouMonde.vitesse(vitesse); $('bVitesse').textContent = '×' + vitesse; };
  $('bPause').onclick = () => { pause = !pause; BouMonde.pause(pause); $('bPause').textContent = pause ? 'REPRENDRE' : 'PAUSE'; };

  /* ---------- démarrage ---------- */
  (async () => {
    await Promise.all(['22px "Luckiest Guy"', '600 13px Fredoka', '700 20px "Pixelify Sans"'].map(f => document.fonts.load(f).catch(() => {})));
    await BouCartes.charger();
    await BouMonde.init($('scene'));
    e = relire();
    if (!e || e.fin || e.phase !== 'lundi') nouvelle();   // on ne sauve que le lundi : une semaine interrompue n'est jamais enregistrée
    BouMonde.maj(e);
    vignettes = BouMonde.vignettes();
    $('chargement').remove(); majHaut();
  })();
  return { get etat() { return e; }, set etat(v) { e = v; BouMonde.maj(e); majHaut(); }, ouvrirBoutique, amenager, poser, nouvelle: () => { nouvelle(); BouMonde.maj(e); majHaut(); } };
})();

/* La Dernière Lanterne — branche le moteur (moteur-rpg/) aux données du jeu (donnees/) :
   écran titre, trois emplacements de partie, choix du nom, boucle d'affichage.
   Les combats arrivent avec la session 2 du moteur : en attendant, toucher un monstre le fait fuir.
   window.Lanterne : pour les tests (nouvelle partie, état, commandes simulées). */
(function () {
  const MR = window.MoteurRPG, J = window.LANTERNE;
  const $ = id => document.getElementById(id);

  // localStorage, ou une mémoire de secours si le navigateur le refuse (mode privé)
  const stockage = (() => {
    try { localStorage.setItem('lanterne.test', '1'); localStorage.removeItem('lanterne.test'); return localStorage; }
    catch (e) { const m = {}; return { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; } }; }
  })();
  let reglages = { musique: true, effets: true };
  try { Object.assign(reglages, JSON.parse(stockage.getItem('lanterne.reglages') || '{}')); } catch (e) { /* réglages par défaut */ }
  const enregistrerReglages = () => { try { stockage.setItem('lanterne.reglages', JSON.stringify(reglages)); } catch (e) { /* rien */ } };
  const sauvegardes = MR.Etat.Sauvegardes(stockage, 'lanterne');

  let poupees, rendu, ui, entrees, sons, partie = null, emplacement = 1, choisi = 1;

  const atlas = new Image();
  atlas.onload = demarrer;
  atlas.src = 'tuiles.png';

  function demarrer() {
    poupees = MR.Poupees.Poupees(atlas, J.tuiles, J.prises);
    sons = MR.Sons.Sons(J.effets, J.musiques, reglages);
    rendu = MR.Rendu.Rendu($('scene'), poupees, J.style);
    ui = MR.Interface.Interface($('fenetres'), { persos: J.persos, poupees, sons });
    entrees = MR.Entrees.Entrees($('commandes'));
    titre();
    let avant = performance.now();
    (function boucle(maintenant) {
      const dt = Math.min(.05, (maintenant - avant) / 1000); avant = maintenant;
      const t = maintenant / 1000;
      if (partie) { partie.pas(dt, t); rendu.rendre(t); }
      requestAnimationFrame(boucle);
    })(avant);
  }

  // ---------- écran titre ----------
  function titre() {
    if (partie) { partie.arreter(); partie = null; }
    $('titre').classList.remove('cache'); $('nommer').classList.add('cache'); $('emplacements').classList.remove('cache');
    const z = $('emplacements'); z.innerHTML = '';
    for (let n = 1; n <= 3; n++) {
      const r = sauvegardes.resume(n), b = document.createElement('div');
      b.className = 'empl';
      b.innerHTML = `<span class="empl-num">${n}</span><span class="empl-info"></span>`;
      const info = b.querySelector('.empl-info');
      if (r) {
        info.innerHTML = '<b></b><small></small>';
        info.querySelector('b').textContent = `${r.nom} · Niv. ${r.niveau}`;
        info.querySelector('small').textContent = `${r.chapitre} · ${r.lieu} · ${MR.Menu.duree(r.temps)}`;
        const eff = document.createElement('button'); eff.className = 'empl-effacer'; eff.textContent = 'Effacer';
        eff.onclick = e => { e.stopPropagation(); if (confirm(`Effacer la partie ${n} (${r.nom}) ?`)) { sauvegardes.effacer(n); titre(); } };
        b.append(eff);
        b.onclick = () => continuer(n);
      } else {
        info.innerHTML = '<b>Nouvelle partie</b><small>Emplacement libre</small>';
        b.onclick = () => nommer(n);
      }
      z.append(b);
    }
  }

  function nommer(n) {
    choisi = n;
    $('emplacements').classList.add('cache'); $('nommer').classList.remove('cache');
    const champ = $('nom'); champ.focus(); champ.select();
  }
  const nomPropre = s => (s || '').replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'-]/g, '').toUpperCase().slice(0, 8) || 'ALDEN';
  $('nomOk').onclick = () => nouvelle(choisi, nomPropre($('nom').value));
  $('nomRetour').onclick = titre;
  $('nom').addEventListener('keydown', e => { if (e.key === 'Enter') $('nomOk').onclick(); });

  // ---------- lancer une partie ----------
  function nouvelle(n, nom) {
    sauvegardes.effacer(n);
    lancer(n, MR.Etat.nouvellePartie(J, nom), true);
  }
  function continuer(n) {
    const e = sauvegardes.pourReprendre(n);
    if (e) lancer(n, e, false);
  }
  function lancer(n, etat, neuve) {
    if (partie) partie.arreter();
    emplacement = n;
    J.persos.heros.nom = etat.nom;
    $('titre').classList.add('cache');
    partie = MR.Partie.Partie({ jeu: J, rendu, ui, entrees, sons, poupees, sauvegardes, emplacement: n, etat, combat, defaite, reglages, enregistrerReglages });
    partie.entrer(etat.carte, etat.x, etat.y, etat.dir);
    if (neuve) partie.jouer('debut');
  }

  // en attendant le moteur de combat (session 2) : le monstre s'enfuit
  async function combat(info) {
    const m = J.monstres[info.type] || { nom: 'Un monstre' };
    sons.effet('rencontre', .5);
    const debut = info.initiative === 'heros' ? 'Tu surprends' : info.initiative === 'monstre' ? 'Tu es surpris par' : 'Tu tombes sur';
    await ui.dire(null, [`${debut} : ${m.nom} !`, `${m.nom} se dissout dans la brume. (Les combats arrivent avec la prochaine version.)`]);
    return 'victoire';
  }
  function defaite() {
    const e = sauvegardes.pourDefaite(emplacement);
    if (e) lancer(emplacement, e, false); else titre();
  }

  window.Lanterne = {
    get partie() { return partie; }, get etat() { return partie && partie.etat; }, get entrees() { return entrees; },
    sauvegardes, nouvelle, continuer, titre
  };
})();

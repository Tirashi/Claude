/* Moteur RPG — le menu du jeu (navigateur) : onglets ÉQUIPE, OBJETS, JOURNAL, OPTIONS,
   et le retour à la Ludothèque (classe ludo-retour : masqué dans les artefacts).
   Tout le texte vient des données du jeu : classes (nom, phrase), heros (nom), objets (nom, description),
   statistiques (libellé et aide de chaque stat), journal(etat) → la quête en cours en une phrase. */
(function (M) {
  const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const duree = s => { const m = Math.floor(s / 60); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; };

  function nomHeros(jeu, etat, id) { return id === etat.equipe[0] && jeu.heros[id].nomJoueur ? etat.nom : jeu.heros[id].nom; }

  function construire(racine, o) {
    const { jeu, etat } = o;
    const tete = h('div', 'rpg-menu-tete'), page = h('div', 'rpg-menu-page'), pied = h('div', 'rpg-menu-pied');
    const onglets = [['equipe', 'Équipe'], ['objets', 'Objets'], ['journal', 'Journal'], ['options', 'Options']];
    let actif = 'equipe';
    for (const [k, t] of onglets) { const b = h('button', 'rpg-onglet', t); b.dataset.k = k; b.onclick = () => { actif = k; o.sons.effet('bip', .3); montrer(); }; tete.append(b); }
    const fermer = h('button', 'rpg-bouton', 'Fermer ✕'); fermer.onclick = o.fermer;
    const retour = h('a', 'rpg-bouton ludo-retour', '◀ Ludothèque'); retour.href = '../index.html';
    pied.append(retour, fermer);
    racine.append(tete, page, pied);

    function montrer() {
      tete.querySelectorAll('.rpg-onglet').forEach(b => b.classList.toggle('actif', b.dataset.k === actif));
      page.innerHTML = '';
      ({ equipe, objets, journal, options })[actif]();
    }

    function equipe() {
      for (const id of etat.equipe) {
        const x = etat.heros[id], cl = jeu.classes[x.classe], carte = h('div', 'rpg-fiche');
        const v = h('canvas', 'rpg-fiche-visage'); v.width = v.height = 56;
        M.Poupees.portrait(v, o.poupees.perso(jeu.heros[id].perso));
        const info = h('div', 'rpg-fiche-info');
        info.append(h('div', 'rpg-fiche-nom', `${nomHeros(jeu, etat, id)} · ${cl.nom} · Niv. ${x.niveau}`), h('div', 'rpg-fiche-phrase', `« ${cl.phrase} »`));
        const barre = (k, max, cls) => { const b = h('div', 'rpg-barre ' + cls); const i = h('i'); i.style.width = (100 * x[k] / max) + '%'; b.append(i); return b; };
        info.append(h('div', 'rpg-fiche-pv', `PV ${x.pv} / ${x.pvMax}`), barre('pv', x.pvMax, 'pv'), h('div', 'rpg-fiche-pv', `PM ${x.pm} / ${x.pmMax}`), barre('pm', x.pmMax, 'pm'));
        const stats = h('div', 'rpg-stats');
        for (const s of jeu.statistiques.filter(s => !['pv', 'pm'].includes(s.cle))) {
          const l = h('div', 'rpg-stat'); l.append(h('b', '', s.nom), h('span', '', String(x[s.cle])), h('small', '', s.aide)); stats.append(l);
        }
        info.append(stats);
        carte.append(v, info); page.append(carte);
      }
    }

    function objets() {
      const ids = Object.keys(etat.objets).filter(k => etat.objets[k] > 0);
      page.append(h('div', 'rpg-ecus', `${etat.ecus} écus`));
      if (!ids.length) { page.append(h('p', 'rpg-vide', 'Aucun objet pour le moment.')); return; }
      for (const id of ids) {
        const ob = jeu.objets[id] || { nom: id }, l = h('div', 'rpg-objet');
        l.append(h('b', '', `${ob.nom} × ${etat.objets[id]}`), h('small', '', ob.description || ''));
        page.append(l);
      }
    }

    function journal() {
      page.append(h('div', 'rpg-journal-quete', jeu.journal ? jeu.journal(etat) : ''));
      page.append(h('p', '', `${etat.chapitre ? etat.chapitre + ' · ' : ''}${etat.lieu}`));
      page.append(h('p', 'rpg-vide', `Temps de jeu : ${duree(etat.temps)}`));
    }

    function options() {
      const r = o.reglages;
      const bascule = (k, t) => {
        const b = h('button', 'rpg-bouton large', `${t} : ${r[k] ? 'oui' : 'non'}`);
        b.onclick = () => { r[k] = !r[k]; o.enregistrerReglages(); o.sons.majReglages(); b.textContent = `${t} : ${r[k] ? 'oui' : 'non'}`; };
        page.append(b);
      };
      bascule('musique', 'Musique'); bascule('effets', 'Bruitages');
      page.append(h('p', 'rpg-vide', 'La partie se sauvegarde toute seule aux moments clés, et à la main aux lanternes.'));
    }

    montrer();
  }

  M.Menu = { construire, nomHeros, duree };
})(window.MoteurRPG = window.MoteurRPG || {});

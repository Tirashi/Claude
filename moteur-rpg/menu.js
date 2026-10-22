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

    let choixEquip = null;   // l'emplacement dont on choisit l'objet : 'heros:arme'
    function equipe() {
      const R = M.Regles;
      for (const id of etat.equipe) {
        const x = etat.heros[id], cl = jeu.classes[x.classe], carte = h('div', 'rpg-fiche'), s = R.statsEquipees(jeu, x);
        const v = h('canvas', 'rpg-fiche-visage'); v.width = v.height = 56;
        M.Poupees.portrait(v, o.poupees.perso(jeu.heros[id].perso));
        const info = h('div', 'rpg-fiche-info');
        info.append(h('div', 'rpg-fiche-nom', `${nomHeros(jeu, etat, id)} · ${cl.nom} · Niv. ${x.niveau}`), h('div', 'rpg-fiche-phrase', `« ${cl.phrase} »`));
        const barre = (k, max, cls) => { const b = h('div', 'rpg-barre ' + cls); const i = h('i'); i.style.width = (100 * x[k] / max) + '%'; b.append(i); return b; };
        info.append(h('div', 'rpg-fiche-pv', `PV ${x.pv} / ${x.pvMax}${x.pv <= 0 ? ' · à terre' : ''}`), barre('pv', x.pvMax, 'pv'), h('div', 'rpg-fiche-pv', `PM ${x.pm} / ${x.pmMax}`), barre('pm', x.pmMax, 'pm'));
        if (x.niveau < R.NIVEAU_MAX) info.append(h('div', 'rpg-fiche-pv', `Expérience ${x.xp} / ${R.xpPourNiveau(x.niveau)} avant le niveau ${x.niveau + 1}`));
        const stats = h('div', 'rpg-stats');
        for (const st of jeu.statistiques.filter(st => !['pv', 'pm'].includes(st.cle))) {
          const bonus = s[st.cle] - x[st.cle], l = h('div', 'rpg-stat');
          l.append(h('b', '', st.nom), h('span', '', String(s[st.cle])), h('small', '', (bonus ? `(${x[st.cle]} ${bonus > 0 ? '+' : '−'} ${Math.abs(bonus)} d'équipement) ` : '') + st.aide));
          stats.append(l);
        }
        info.append(stats);
        // équipement : toucher un emplacement pour changer d'objet (flèches vertes et rouges : ce que ça change)
        const eq = h('div', 'rpg-equip');
        for (const emp of R.EMPLACEMENTS) {
          const porte = x.equipement[emp], cle = id + ':' + emp;
          const l = h('button', 'rpg-equip-ligne' + (choixEquip === cle ? ' ouvert' : ''));
          l.append(h('span', '', { arme: 'Arme', armure: 'Armure', accessoire: 'Accessoire' }[emp]), h('b', '', porte ? jeu.objets[porte].nom : '—'));
          l.onclick = () => { choixEquip = choixEquip === cle ? null : cle; o.sons.effet('bip', .3); montrer(); };
          eq.append(l);
          if (choixEquip === cle) {
            const choix = Object.keys(etat.objets).filter(k => etat.objets[k] > 0 && jeu.objets[k] && jeu.objets[k].equip && jeu.objets[k].equip.emplacement === emp && R.peutPorter(jeu, x, k));
            const liste = h('div', 'rpg-equip-choix');
            if (!choix.length && !porte) liste.append(h('small', 'rpg-vide', 'Rien à porter ici pour le moment.'));
            for (const k of choix.concat(porte ? [null] : [])) {
              const nv = k ? jeu.objets[k].equip : {}, act = porte ? jeu.objets[porte].equip : {};
              const diffs = ['for', 'def', 'mag', 'vit'].map(st => [st, (nv[st] || 0) - (act[st] || 0)]).filter(([, d]) => d);
              const b = h('button', 'rpg-equip-option');
              b.append(h('span', '', k ? jeu.objets[k].nom : 'Enlever'));
              for (const [st, d] of diffs) b.append(h('i', d > 0 ? 'plus' : 'moins', `${d > 0 ? '▲' : '▼'} ${st.toUpperCase()} ${d > 0 ? '+' : '−'}${Math.abs(d)}`));
              b.onclick = () => { M.Etat.equiper(etat, jeu, id, emp, k); choixEquip = null; o.sons.effet('ok', .4); montrer(); };
              liste.append(b);
            }
            eq.append(liste);
          }
        }
        info.append(eq);
        const talents = R.talentsConnus(jeu.talents || {}, x.classe, x.niveau).map(t => `${jeu.talents[t].nom} (${jeu.talents[t].pm} PM)`);
        if (talents.length) info.append(h('div', 'rpg-fiche-talents', 'Talents : ' + talents.join(', ')));
        carte.append(v, info); page.append(carte);
      }
    }

    let objetChoisi = null;
    function objets() {
      const ids = Object.keys(etat.objets).filter(k => etat.objets[k] > 0);
      page.append(h('div', 'rpg-ecus', `${etat.ecus} écus`));
      if (!ids.length) { page.append(h('p', 'rpg-vide', 'Aucun objet pour le moment.')); return; }
      for (const id of ids) {
        const ob = jeu.objets[id] || { nom: id }, l = h('div', 'rpg-objet');
        l.append(h('b', '', `${ob.nom} × ${etat.objets[id]}`), h('small', '', ob.description || ''));
        // les objets de soin s'utilisent aussi hors combat : on choisit le héros
        const effet = ob.combat;
        if (effet && (effet.soin || effet.pm || effet.guerit || effet.releve)) {
          const b = h('button', 'rpg-bouton petit', objetChoisi === id ? 'Sur qui ?' : 'Utiliser');
          b.onclick = () => { objetChoisi = objetChoisi === id ? null : id; montrer(); };
          l.append(b);
          if (objetChoisi === id) {
            const qui = h('div', 'rpg-equip-choix');
            for (const hid of etat.equipe) {
              const x = etat.heros[hid], utile = effet.releve ? x.pv <= 0 : x.pv > 0 && ((effet.soin && x.pv < x.pvMax) || (effet.pm && x.pm < x.pmMax) || (effet.guerit && x.etats && x.etats[effet.guerit]));
              const c = h('button', 'rpg-equip-option' + (utile ? '' : ' non'));
              c.append(h('span', '', `${nomHeros(jeu, etat, hid)} · PV ${x.pv}/${x.pvMax} · PM ${x.pm}/${x.pmMax}`));
              c.onclick = () => {
                if (!utile || !M.Etat.prendre(etat, id, 1)) return;
                if (effet.releve) x.pv = Math.max(1, Math.round(x.pvMax * effet.releve));
                if (effet.soin) x.pv = Math.min(x.pvMax, x.pv + effet.soin);
                if (effet.pm) x.pm = Math.min(x.pmMax, x.pm + effet.pm);
                if (effet.guerit && x.etats) delete x.etats[effet.guerit];
                o.sons.effet('soin', .5); objetChoisi = null; montrer();
              };
              qui.append(c);
            }
            l.append(qui);
          }
        }
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

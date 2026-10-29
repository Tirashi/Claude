/* Moteur RPG — le menu du jeu (navigateur) : onglets ÉQUIPE, OBJETS, MONSTRES (bestiaire), JOURNAL, AIDE, OPTIONS,
   et le retour à la Ludothèque (classe ludo-retour : masqué dans les artefacts).
   Tout le texte vient des données du jeu : classes (nom, phrase), heros (nom), objets (nom, description),
   statistiques (libellé et aide de chaque stat), journal(etat) → la quête en cours en une phrase,
   objets[id].icone (tuile), monstres (bestiaire : texte), aide : [{ titre, texte }] (règles expliquées au joueur).
   Bestiaire : etat.bestiaire[type] = { r: combats rencontrés, v: combats gagnés } ; les infos se dévoilent
   à la 1re, 3e et 5e victoire (tout d'un coup pour un boss). */
(function (M) {
  const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const duree = s => { const m = Math.floor(s / 60); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}`; };

  function nomHeros(jeu, etat, id) { return id === etat.equipe[0] && jeu.heros[id].nomJoueur ? etat.nom : jeu.heros[id].nom; }

  function construire(racine, o) {
    const { jeu, etat } = o;
    const tete = h('div', 'rpg-menu-tete'), page = h('div', 'rpg-menu-page'), pied = h('div', 'rpg-menu-pied');
    const onglets = [['equipe', 'Équipe'], ['objets', 'Objets'], ['monstres', 'Monstres'], ['journal', 'Journal'], ['aide', 'Aide'], ['options', 'Options']];
    // l'image d'un objet ou d'un monstre, dans un petit canevas
    const image = (tuile, taille = 30, retourne = false) => {
      const cv = h('canvas', 'rpg-icone'); cv.width = cv.height = taille;
      const img = tuile && o.poupees.decoupe(tuile);
      if (img) { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; if (retourne) { g.translate(taille, 0); g.scale(-1, 1); } g.drawImage(img, 0, 0, taille, taille); }
      return cv;
    };
    let actif = 'equipe';
    for (const [k, t] of onglets) { const b = h('button', 'rpg-onglet', t); b.dataset.k = k; b.onclick = () => { actif = k; o.sons.effet('bip', .3); montrer(); }; tete.append(b); }
    const fermer = h('button', 'rpg-bouton', 'Fermer ✕'); fermer.onclick = o.fermer;
    const retour = h('a', 'rpg-bouton ludo-retour', '◀ Ludothèque'); retour.href = '../index.html';
    pied.append(retour, fermer);
    racine.append(tete, page, pied);

    function montrer() {
      tete.querySelectorAll('.rpg-onglet').forEach(b => b.classList.toggle('actif', b.dataset.k === actif));
      page.innerHTML = '';
      ({ equipe, objets, monstres, journal, aide, options })[actif]();
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
          const nomPorte = h('b', '');
          if (porte) nomPorte.append(image(jeu.objets[porte].icone, 22), ' ' + jeu.objets[porte].nom); else nomPorte.textContent = '—';
          l.append(h('span', '', { arme: 'Arme', armure: 'Armure', accessoire: 'Accessoire' }[emp]), nomPorte);
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
        const ob = jeu.objets[id] || { nom: id }, l = h('div', 'rpg-objet'), titre = h('div', 'rpg-objet-titre');
        titre.append(image(ob.icone), h('b', '', `${ob.nom} × ${etat.objets[id]}`));
        l.append(titre, h('small', '', ob.description || ''));
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

    // bestiaire : les monstres déjà rencontrés, leurs infos se dévoilent au fil des victoires
    function monstres() {
      const b = etat.bestiaire || {}, ids = Object.keys(jeu.monstres).filter(k => b[k]);
      if (!ids.length) { page.append(h('p', 'rpg-vide', 'Aucun monstre rencontré pour le moment.')); return; }
      page.append(h('p', 'rpg-vide', `${ids.length} sur ${Object.keys(jeu.monstres).length} · les infos se dévoilent à la 1re, 3e et 5e victoire.`));
      const NOMS = { feu: 'feu', glace: 'glace', foudre: 'foudre', lumiere: 'lumière' };
      for (const k of ids) {
        const m = jeu.monstres[k], { v } = b[k], niv = m.boss ? (v >= 1 ? 3 : 0) : v >= 5 ? 3 : v >= 3 ? 2 : v >= 1 ? 1 : 0;
        const carte = h('div', 'rpg-monstre'), info = h('div', 'rpg-fiche-info');
        info.append(h('div', 'rpg-fiche-nom', m.nom + (m.boss ? ' · boss' : '')), h('small', 'rpg-vide', `Vaincu ${v} fois`));
        if (niv === 0) info.append(h('p', 'rpg-vide', 'Gagne un combat contre lui pour en savoir plus.'));
        if (niv >= 1) info.append(h('p', 'rpg-fiche-phrase', `« ${m.bestiaire || '…'} »`), h('div', 'rpg-fiche-pv', `Niveau ${m.niveau || '?'} · PV ${m.pv}`));
        if (niv >= 2) info.append(h('div', 'rpg-fiche-pv', `FOR ${m.for} · DEF ${m.def} · MAG ${m.mag || 0} · VIT ${m.vit} · ${m.xp} XP · ${m.ecus} écus`));
        // faiblesses : toutes à la 3e étape, sinon celles découvertes avec des sorts
        const elts = Object.entries(NOMS).map(([e, nom]) => [nom, niv >= 3 ? (m.elements || {})[e] || 1 : ({ faible: 1.5, resiste: .5 })[etat.drapeaux['element:' + k + ':' + e]]]).filter(([, x]) => x && x !== 1);
        if (elts.length) info.append(h('div', 'rpg-fiche-pv', [['Faible', x => x > 1], ['Résiste', x => x < 1]].map(([t, f]) => { const l = elts.filter(([, x]) => f(x)).map(([n]) => n); return l.length ? `${t} : ${l.join(', ')}` : ''; }).filter(Boolean).join(' · ')));
        if (niv >= 3 && (m.butin || []).length) info.append(h('div', 'rpg-fiche-pv', 'Butin : ' + m.butin.map(x => (jeu.objets[x.objet] || {}).nom || x.objet).join(', ')));
        if (niv < 3) info.append(h('small', 'rpg-vide', m.boss ? '' : `Prochaine info à ${niv < 1 ? 1 : niv < 2 ? 3 : 5} victoires.`));
        carte.append(image(m.tuile, 56, true), info); page.append(carte);
      }
    }

    function aide() {
      for (const x of jeu.aide || []) page.append(h('div', 'rpg-aide-titre', x.titre), h('p', 'rpg-aide', x.texte));
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
      bascule('musique', 'Musique'); bascule('effets', 'Bruitages'); bascule('combatRapide', 'Combats rapides');
      // graphismes : auto (beaux, allégés tout seuls si le téléphone peine), beaux, rapides
      if (o.graphismes) {
        const NOMS = ['auto', 'beaux', 'rapides'], b = h('button', 'rpg-bouton large');
        const texte = () => { b.textContent = `Graphismes : ${r.graphismes || 'auto'}${(r.graphismes || 'auto') === 'auto' ? ` (${o.graphismes()} en ce moment)` : ''}`; };
        b.onclick = () => { r.graphismes = NOMS[(NOMS.indexOf(r.graphismes || 'auto') + 1) % 3]; o.enregistrerReglages(); o.graphismes(r.graphismes); texte(); };
        texte(); page.append(b);
        page.append(h('p', 'rpg-vide', 'Rapides : image moins fine, sans flou de profondeur, mais plus fluide sur les petits téléphones.'));
      }
      page.append(h('p', 'rpg-vide', 'La partie se sauvegarde toute seule aux moments clés, et à la main aux lanternes.'));
    }

    montrer();
  }

  M.Menu = { construire, nomHeros, duree };
})(window.MoteurRPG = window.MoteurRPG || {});

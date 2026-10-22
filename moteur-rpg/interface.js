/* Moteur RPG — fenêtres par-dessus le jeu (navigateur, en HTML pour un texte net avec les accents) :
   dialogue avec portrait et texte lettre par lettre, choix au curseur ▶, menu, petit message
   « Sauvegarde… », fondu au noir. Les fenêtres se commandent au doigt ou par les touches (A, haut, bas). */
(function (M) {
  const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };

  // racine : l'élément qui recouvre l'écran de jeu ; opts : { persos: { id: { nom, perso } }, poupees, sons, vitesse }
  function Interface(racine, opts) {
    const o = Object.assign({ vitesse: 55 }, opts);
    const boite = h('div', 'rpg-dialogue'), visage = h('canvas', 'rpg-visage'), nom = h('div', 'rpg-nom'), texte = h('div', 'rpg-texte'), suite = h('div', 'rpg-suite', '▼');
    visage.width = visage.height = 60;
    const corps = h('div', 'rpg-corps'); corps.append(nom, texte);
    boite.append(visage, corps, suite);
    const liste = h('div', 'rpg-choix');
    const toast = h('div', 'rpg-toast');
    const fondu = h('div', 'rpg-fondu');
    const menu = h('div', 'rpg-menu');
    racine.append(boite, liste, toast, fondu, menu);

    let attente = null;   // ce qu'une touche A fait en ce moment (dialogue ou choix)
    let curseur = 0, options = [], choisi = null;

    function montrerQui(qui) {
      const p = qui && o.persos[qui];
      visage.style.display = p ? '' : 'none';
      nom.textContent = p ? p.nom : '';
      nom.style.display = p ? '' : 'none';
      if (p) M.Poupees.portrait(visage, o.poupees.perso(p.perso));
    }

    // écrit une page lettre par lettre ; A (ou un toucher) termine la page, puis passe à la suivante
    function page(t) {
      return new Promise(fin => {
        texte.textContent = ''; suite.style.visibility = 'hidden';
        let i = 0, fini = false, minuteur = null;
        const tout = () => { clearInterval(minuteur); texte.textContent = t; fini = true; suite.style.visibility = 'visible'; };
        minuteur = setInterval(() => {
          i++; texte.textContent = t.slice(0, i);
          if (o.sons && i % 3 === 1 && /\S/.test(t[i - 1] || '')) o.sons.effet('bip', .25);
          if (i >= t.length) tout();
        }, 1000 / o.vitesse);
        attente = () => { if (!fini) tout(); else { attente = null; fin(); } };
      });
    }

    async function dire(qui, pages) {
      montrerQui(qui); boite.classList.add('on');
      for (const t of pages) await page(t);
      boite.classList.remove('on');
    }

    function choix(question, opts) {
      return new Promise(fin => {
        montrerQui(null); texte.textContent = question; suite.style.visibility = 'hidden'; boite.classList.add('on');
        options = opts; curseur = 0; liste.innerHTML = '';
        opts.forEach((t, i) => { const b = h('div', 'rpg-option', t); b.onclick = () => { curseur = i; valider(); }; liste.append(b); });
        const majCurseur = () => [...liste.children].forEach((b, i) => b.classList.toggle('sel', i === curseur));
        majCurseur(); liste.classList.add('on');
        const valider = () => { liste.classList.remove('on'); boite.classList.remove('on'); attente = null; choisi = null; if (o.sons) o.sons.effet('ok', .5); fin(curseur); };
        choisi = d => { curseur = (curseur + (d === 'haut' ? -1 : 1) + options.length) % options.length; majCurseur(); if (o.sons) o.sons.effet('bip', .3); };
        attente = valider;
      });
    }

    let toastMinuteur = null;
    function message(t, duree = 1400) {
      toast.textContent = t; toast.classList.add('on');
      clearTimeout(toastMinuteur); toastMinuteur = setTimeout(() => toast.classList.remove('on'), duree);
    }
    function noir(oui) { fondu.classList.toggle('on', oui); return new Promise(r => setTimeout(r, 320)); }

    // menu : contenu HTML fourni par la partie ; fermer() le cache
    function ouvrirMenu(construire) { menu.innerHTML = ''; construire(menu); menu.classList.add('on'); }
    function fermerMenu() { menu.classList.remove('on'); menu.innerHTML = ''; }

    boite.addEventListener('pointerdown', e => { if (attente) { e.preventDefault(); attente(); } });

    return {
      dire, choix, message, noir, ouvrirMenu, fermerMenu,
      get occupe() { return !!attente || menu.classList.contains('on'); },
      get menuOuvert() { return menu.classList.contains('on'); },
      // une touche : renvoie vrai si une fenêtre l'a prise
      touche(t) {
        if (t === 'A' && attente) { attente(); return true; }
        if ((t === 'haut' || t === 'bas') && choisi) { choisi(t); return true; }
        return !!attente;
      }
    };
  }

  M.Interface = { Interface };
})(window.MoteurRPG = window.MoteurRPG || {});

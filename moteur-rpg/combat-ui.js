/* Moteur RPG — l'écran de combat (navigateur) : relie moteur-rpg/combat.js au rendu HD-2D, aux sons et aux commandes.
   - en haut : la frise de l'ordre de passage (ce tour, puis le suivant en plus pâle), la barre du boss avec sa
     prochaine action, l'alerte quand il prépare un grand coup, et les messages tapés lettre par lettre ;
   - en bas : l'équipe (PV, PM) et le menu du héros dont c'est le tour : ATTAQUE, TALENTS, OBJETS, DÉFENSE, FUITE ;
   - chacun agit à son tour (flèche dorée au-dessus de lui), le héros choisit quand vient son tour ;
     curseur ▶, croix haut / bas, A pour valider, B ou « Retour » pour revenir ; cible marquée ▼ au-dessus d'elle ;
   - chaque action est jouée : pas en avant, geste, projectile, impact, chiffres qui montent, son.
   Combattre(o) → promesse du résultat de Combat.terminer : { fin: 'victoire' | 'fuite' | 'defaite', xp, ecus, objets, niveaux }.
   o : { jeu, etat, rencontre, decor, rendu, racine, entrees, sons, poupees, rapide, rng } ; pendant le combat, appeler .pas(t) à chaque image.
   rapide : combats plus rapides (réglage du joueur). */
(function (M) {
  const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  let lent = 1;   // 1, ou moins pour les combats rapides
  const attendre = ms => new Promise(r => setTimeout(r, ms * lent));
  // places à l'écran : monstres à gauche, héros à droite (selon leur nombre)
  const PLACES_H = { 1: [[1.9, .3]], 2: [[1.6, -.8], [2.4, 1.1]], 3: [[1.5, -1.5], [2.5, .1], [1.6, 1.7]], 4: [[1.4, -1.8], [2.5, -.5], [1.5, .9], [2.6, 2.2]] };
  const PLACES_M = { 1: [[-1.9, .2]], 2: [[-1.6, -1], [-2.3, 1.1]], 3: [[-1.5, -1.5], [-2.5, .1], [-1.5, 1.7]], 4: [[-1.4, -1.8], [-2.5, -.5], [-1.5, .9], [-2.6, 2.2]] };
  // effets : son, image du projectile et de l'impact, couleur de la lumière
  const EFFETS = {
    coup: { son: 'coup', impact: '_arc' }, morsure: { son: 'morsure', impact: '_arc' }, fleche: { son: 'fleche', projectile: 'fleche', impact: '_arc' },
    feu: { son: 'feu', projectile: 'flamme', impact: 'explosion', lumiere: 0xff8a30 }, glace: { son: 'givre', projectile: 'givre', impact: 'givre_impact', lumiere: 0x7cc8ff },
    foudre: { son: 'foudre', impact: 'foudre', lumiere: 0xd8e8ff }, lumiere: { son: 'soin', impact: 'rayon', lumiere: 0xfff0a0 },
    soin: { son: 'soin', impact: 'eclat0', lumiere: 0x8cff9a }, buff: { son: 'victoire', impact: 'buff', lumiere: 0xffe08a },
    poison: { son: 'morsure', impact: 'poison_nuage' }, sommeil: { son: 'givre', projectile: 'dard', impact: 'sommeil_nuage', lumiere: 0xc890ff },
    brise: { son: 'coup', impact: '_arc' }
  };

  function Combattre(o) {
    const { jeu, etat, rendu, sons } = o, C = M.Combat;
    const c = C.creer(jeu, etat, o.rencontre, o.rng || Math.random);
    lent = o.rapide ? .55 : 1;
    const anims = new Map();   // id → { etat, debut, duree, de, vers, boucle }
    const projectiles = [];    // { cle, tuile, de, vers, debut, duree, impact }
    let t0 = 0, maintenant = 0, attente = null, touche = null;
    // PV et PM affichés : le moteur calcule tout le tour d'un coup, l'écran ne retire les PV qu'au moment du coup
    const vue = new Map(c.heros.concat(c.monstres).map(f => [f.id, { pv: f.pv, pm: f.pm }]));
    const synchro = () => { for (const f of c.heros.concat(c.monstres)) Object.assign(vue.get(f.id), { pv: f.pv, pm: f.pm }); };
    const courant = new Map();   // id → position du moment (pendant un élan)

    // ---------- l'écran ----------
    const racine = h('div', 'cb'), banniere = h('div', 'cb-message'), calque = h('div', 'cb-calque'), bas = h('div', 'cb-bas');
    const equipe = h('div', 'cb-equipe'), menu = h('div', 'cb-menu');
    const haut = h('div', 'cb-haut'), frise = h('div', 'cb-frise'), barreBoss = h('div', 'cb-boss'), alerte = h('div', 'cb-alerte');
    haut.append(frise, barreBoss, alerte, banniere);
    barreBoss.style.display = alerte.style.display = 'none';   // remplies après l'annonce des monstres
    bas.append(equipe, menu); racine.append(calque, haut, bas); o.racine.append(racine);
    banniere.addEventListener('pointerdown', e => { if (attente) { e.preventDefault(); attente(); } });
    const marque = h('div', 'cb-marque', '▼'), fleche = h('div', 'cb-marque acteur', '▼'); calque.append(marque, fleche);

    // ---------- placer les combattants ----------
    rendu.chargerCombat(o.decor);
    const places = new Map();
    c.heros.forEach((x, i) => {
      const [px, pz] = PLACES_H[c.heros.length][i];
      rendu.acteur(x.id, jeu.heros[x.id].perso, { taille: 1.5, aura: x.classe === 'CLERC' ? 'rgba(140,255,160,A)' : x.classe === 'ARCANISTE' ? 'rgba(120,190,255,A)' : null });
      places.set(x.id, [px, pz]);
    });
    c.monstres.forEach((x, i) => {
      const [px, pz] = PLACES_M[c.monstres.length][i];
      rendu.acteur(x.id, x.def.tuile, { taille: 1.5 * (x.def.taille || 1) });
      places.set(x.id, [px, pz]);
    });
    const combattant = id => c.heros.concat(c.monstres).find(f => f.id === id);
    const sens = id => (combattant(id).camp === 'h' ? 1 : -1);   // les héros regardent à gauche, les monstres (retournés) à droite

    function anim(id, etat, duree = .6, mvt = null) { anims.set(id, { etat, debut: maintenant, duree: duree * lent, de: mvt && mvt.de, vers: mvt && mvt.vers }); }

    // chaque image : poses, déplacements, projectiles, lumière, chiffres et marque
    function pas(t) {
      maintenant = t; if (!t0) t0 = t;
      for (const f of c.heros.concat(c.monstres)) {
        if (!places.has(f.id)) continue;
        let [x, z] = places.get(f.id), e = vue.get(f.id).pv > 0 ? 'repos' : 'ko', q = 0;
        const a = anims.get(f.id);
        if (a) {
          const k = Math.min(1, (t - a.debut) / a.duree);
          if (k >= 1 && !a.garde) anims.delete(f.id);
          else {
            e = a.etat; q = k;
            if (a.vers) { const b = Math.sin(Math.min(1, k / .85) * Math.PI); x = a.de[0] + (a.vers[0] - a.de[0]) * b; z = a.de[1] + (a.vers[1] - a.de[1]) * b; }
          }
        }
        courant.set(f.id, [x, z]);
        rendu.placerMonde(f.id, x, z, e, q, sens(f.id));
      }
      let lum = 0;
      for (const p of projectiles.slice()) {
        const k = (t - p.debut) / p.duree;
        if (k >= 1) { rendu.effet(p.cle, null); projectiles.splice(projectiles.indexOf(p), 1); continue; }
        if (p.impact) {
          rendu.effet(p.cle, { tuile: p.tuile, x: p.vers[0], y: p.vers[1], z: p.vers[2] + .4, taille: (p.taille || 1.4) * (.7 + .5 * k), op: 1 - k * k, rot: p.tuile === '_arc' ? -k * 2 : 0 });
          if (p.lumiere) { rendu.eclair(p.lumiere, 2.6 * (1 - k), p.vers[0], 1.4, p.vers[2] + .9); lum = 1; }
        } else {
          const x = p.de[0] + (p.vers[0] - p.de[0]) * k, y = p.de[1] + (p.vers[1] - p.de[1]) * k + Math.sin(k * Math.PI) * .4, z = p.de[2] + (p.vers[2] - p.de[2]) * k;
          let rot = 0;
          if (p.tuile === 'fleche') { const [ax, ay] = rendu.projeter(...p.de), [bx, by] = rendu.projeter(...p.vers); rot = -Math.atan2(by - ay, bx - ax) - Math.PI / 2; }
          else if (p.tuile === 'givre') rot = t * 8;
          rendu.effet(p.cle, { tuile: p.tuile, x, y, z: z + .4, taille: .9, rot });
          if (p.lumiere) { rendu.eclair(p.lumiere, 1.6, x, y + .3, z + .6); lum = 1; }
        }
      }
      if (!lum) rendu.eclair(0xffffff, 0, 0, 0, 0);
      for (const [id, x] of barresPV) if (places.has(id)) {
        const [px, pz] = places.get(id), [sx, sy] = rendu.projeter(px, 0, pz + .45);
        x.el.style.transform = `translate(${Math.round(sx - 28)}px, ${Math.round(sy)}px)`;
      }
      for (const m of [marque, fleche]) if (m.dataset.cible && places.has(m.dataset.cible)) {
        const [x, z] = courant.get(m.dataset.cible) || places.get(m.dataset.cible), f = combattant(m.dataset.cible);
        const y = f && f.camp === 'm' ? 1.6 * (f.def.taille || 1) + .5 : 2.3;
        const [sx, sy] = rendu.projeter(x, y, z);
        m.style.transform = `translate(${sx - 8}px, ${sy - 22 + Math.sin(t * 8) * 3}px)`;
      }
    }
    function marquer(id) { marque.dataset.cible = id || ''; marque.style.display = id ? '' : 'none'; }
    function montrerActeur(id) { fleche.dataset.cible = id || ''; fleche.style.display = id ? '' : 'none'; }
    marquer(null); montrerActeur(null);

    // une petite barre de PV sous chaque monstre (pas le boss : il a sa barre en haut) ;
    // les chiffres n'apparaissent que si on l'a déjà vaincu une fois (bestiaire)
    // une barre qui se vide en douceur, suivie d'une traînée claire (la part qui vient d'être perdue)
    function jauge(cls) {
      const el = h('div', 'rpg-barre ' + cls), trace = h('b', 'trace'), i = h('i');
      el.append(trace, i); return { el, i, trace };
    }
    function remplir(j, k) { const l = Math.max(0, Math.min(1, k)) * 100 + '%'; j.i.style.width = l; j.trace.style.width = l; }
    // un nombre qui défile jusqu'à sa nouvelle valeur
    function compter(el, v, max) {
      const de = el.dataset.v === undefined ? v : +el.dataset.v, ecrire = n => { el.textContent = max === undefined ? n : `${n}/${max}`; };
      el.dataset.v = v;
      if (de === v) { ecrire(v); return; }
      const debut = performance.now(), d = 420 * lent, jeton = el.jeton = {};
      const suite = t => { if (el.jeton !== jeton) return; const k = Math.min(1, (t - debut) / d); ecrire(Math.round(de + (v - de) * k)); if (k < 1) requestAnimationFrame(suite); };
      requestAnimationFrame(suite);
    }

    const barresPV = new Map();
    for (const m of c.monstres) if (!m.boss) {
      const el = h('div', 'cb-pv-monstre'), j = jauge('pv'), t = h('small', '');
      el.append(j.el, t); calque.append(el);
      barresPV.set(m.id, { el, j, t, connu: ((etat.bestiaire || {})[m.type] || {}).v >= 1 });
    }
    function majPV() {
      for (const [id, x] of barresPV) {
        const m = combattant(id), pv = vue.get(id).pv;
        x.el.style.display = pv > 0 && places.has(id) ? '' : 'none';
        remplir(x.j, pv / m.pvMax);
        if (x.connu) compter(x.t, pv, m.pvMax);
      }
    }

    // ---------- la frise de l'ordre de passage, la barre du boss, l'alerte ----------
    const portraits = new Map();
    function portrait(f) {
      if (portraits.has(f.id)) return portraits.get(f.id);
      const cv = document.createElement('canvas'); cv.width = cv.height = 32;
      if (o.poupees && f.camp === 'h') M.Poupees.portrait(cv, o.poupees.perso(jeu.heros[f.id].perso));
      else if (o.poupees) { const img = o.poupees.decoupe(f.def.tuile); if (img) { const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(img, 0, 0, 32, 32); } }
      portraits.set(f.id, cv); return cv;
    }
    function majFrise(actif) {
      frise.innerHTML = '';
      const case_ = (id, cls) => {
        const f = combattant(id); if (!f || f.pv <= 0) return;
        const d = h('div', 'cb-tour ' + (f.camp === 'h' ? 'h ' : 'm ') + (cls || ''));
        const cv = portrait(f).cloneNode(); cv.getContext('2d').drawImage(portrait(f), 0, 0); d.append(cv);
        if (f.camp === 'm' && f.prepare) d.append(h('i', 'cb-danger', '!'));
        frise.append(d);
      };
      if (actif) case_(actif, 'actif');
      for (const id of (c.ordre || []).filter(id => id !== actif)) case_(id);
      frise.append(h('span', 'cb-sep', '▸'));
      for (const id of c.ordreSuivant || []) case_(id, 'suivant');
    }
    const boss = {};
    function majBoss() {
      const b = c.monstres.find(m => m.boss && m.pv > 0);
      barreBoss.style.display = b ? '' : 'none';
      if (b) {
        if (!boss.j) { boss.nom = h('b'); boss.j = jauge('pv'); boss.p = h('small'); barreBoss.append(boss.nom, boss.j.el, boss.p); }
        const p = C.prochaineAction(c, b);
        boss.nom.textContent = b.nom; remplir(boss.j, vue.get(b.id).pv / b.pvMax);
        boss.p.className = p && (p.grand || p.prepare) ? 'grand' : ''; boss.p.textContent = p ? 'Prochaine action : ' + p.nom : '';
      }
      const prepare = c.monstres.find(m => m.pv > 0 && m.prepare);
      alerte.style.display = prepare ? '' : 'none';
      if (prepare) alerte.textContent = `⚠ ${prepare.nom} prépare ${prepare.prepare.nom || 'un grand coup'} ! Mets-toi en Défense.`;
    }

    // un chiffre qui monte au-dessus d'un combattant
    function chiffre(id, texte, cls) {
      if (!places.has(id)) return;
      const [x, z] = places.get(id), f = combattant(id), haut = f.camp === 'm' ? 1.2 * (f.def.taille || 1) : 1.6;
      const [sx, sy] = rendu.projeter(x, haut, z), e = h('div', 'cb-chiffre ' + (cls || ''), texte);
      e.style.left = sx + 'px'; e.style.top = sy + 'px'; calque.append(e); setTimeout(() => e.remove(), 1100);
    }
    const centre = id => { const [x, z] = places.get(id), f = combattant(id); return [x, f.camp === 'm' ? .8 * (f.def.taille || 1) : 1.1, z]; };

    // ---------- l'équipe ----------
    // chaque fiche est construite une fois, puis mise à jour (pour que les barres glissent)
    const fiches = new Map();
    function majEquipe(actif) {
      for (const x of c.heros) {
        let l = fiches.get(x.id);
        if (!l) {
          l = { el: h('div'), nom: h('b'), tpv: h('span'), pv: jauge('pv'), tpm: h('span'), pm: jauge('pm') };
          const lpv = h('div', 'cb-ligne'), lpm = h('div', 'cb-ligne');
          lpv.append(h('span', '', 'PV'), l.tpv); lpm.append(h('span', '', 'PM'), l.tpm);
          l.el.append(l.nom, lpv, l.pv.el, lpm, l.pm.el); equipe.append(l.el); fiches.set(x.id, l);
        }
        const v = vue.get(x.id), etats = Object.keys(x.etats).map(k => ({ poison: '☠', sommeil: 'Zz', silence: '…' })[k] || '').join(' ');
        l.el.className = 'cb-heros' + (x.id === actif ? ' actif' : '') + (v.pv <= 0 ? ' ko' : '');
        l.nom.textContent = x.nom + (etats ? ' ' + etats : '');
        compter(l.tpv, v.pv, x.pvMax); remplir(l.pv, v.pv / x.pvMax);
        compter(l.tpm, v.pm, x.pmMax); remplir(l.pm, x.pmMax ? v.pm / x.pmMax : 0);
      }
    }

    // ---------- messages ----------
    function afficher(texte, pause = 650) {
      return new Promise(fin => {
        banniere.classList.add('on'); banniere.textContent = '';
        let i = 0, fini = false;
        const minuteur = setInterval(() => { i += 2; banniere.textContent = texte.slice(0, i); if (i >= texte.length) tout(); }, 1000 / 70);
        let suite = null;
        const tout = () => { clearInterval(minuteur); banniere.textContent = texte; if (!fini) { fini = true; suite = setTimeout(() => { attente = null; fin(); }, pause * lent); } };
        attente = () => { if (!fini) tout(); else { clearTimeout(suite); attente = null; fin(); } };
      });
    }

    // ---------- menus ----------
    // une liste au curseur ▶ ; options : [{ texte, aide, non }] ; renvoie l'indice, ou -1 pour Retour
    function liste(options, retour) {
      return new Promise(fin => {
        menu.innerHTML = '';
        let cur = Math.max(0, options.findIndex(x => !x.non));
        const lignes = options.map((x, i) => {
          const b = h('div', 'cb-option' + (x.non ? ' non' : ''));
          b.append(h('span', '', x.texte)); if (x.aide) b.append(h('small', '', x.aide));
          b.onclick = () => { if (!x.non) { cur = i; valider(); } };
          if (x.survol) b.onpointerenter = () => x.survol();
          menu.append(b); return b;
        });
        if (retour) { const b = h('div', 'cb-option retour', '◀ Retour'); b.append(h('i', 'cb-touche', 'B')); b.onclick = () => finir(-1); menu.append(b); }
        const maj = () => { lignes.forEach((b, i) => b.classList.toggle('sel', i === cur)); if (options[cur] && options[cur].survol) options[cur].survol(); };
        const finir = i => { touche = null; sons.effet(i < 0 ? 'bip' : 'ok', .4); fin(i); };
        const valider = () => { if (!options[cur].non) finir(cur); };
        touche = t => {
          if (t === 'haut' || t === 'bas') { const d = t === 'haut' ? -1 : 1; for (let k = 0; k < options.length; k++) { cur = (cur + d + options.length) % options.length; if (!options[cur].non) break; } sons.effet('bip', .25); maj(); }
          else if (t === 'A') valider();
          else if ((t === 'B' || t === 'MENU') && retour) finir(-1);
        };
        maj();
      });
    }
    async function choisirCible(cibles) {
      if (!cibles.length) return null;
      const i = await liste(cibles.map(x => ({ texte: x.nom, aide: x.camp === 'h' ? `PV ${x.pv}/${x.pvMax}` : '', survol: () => marquer(x.id) })), true);
      marquer(null);
      return i < 0 ? null : cibles[i].id;
    }

    const usables = () => Object.keys(etat.objets).filter(k => etat.objets[k] > 0 && jeu.objets[k] && jeu.objets[k].combat);
    async function menuHeros(x, premier) {
      for (;;) {
        marquer(x.id);
        const talents = M.Regles.talentsConnus(jeu.talents, x.classe, x.ref.niveau);
        const ops = [{ texte: 'Attaque' }, { texte: 'Talents', non: !talents.length }, { texte: 'Objets', non: !usables().length }, { texte: 'Défense' }, { texte: 'Fuite', non: !C.fuite(c).possible, aide: C.fuite(c).possible ? `Chance de fuir : ${Math.round(100 * M.Regles.chanceFuite(C.fuite(c).vh, C.fuite(c).vm))} %` : C.fuite(c).raison }];
        const i = await liste(ops, !premier);
        if (i < 0) return 'retour';
        if (i === 0) { const id = await choisirCible(C.vivants(c.monstres)); if (id) return { action: 'attaque', cible: id }; }
        if (i === 1) {
          const j = await liste(talents.map(id => { const t = jeu.talents[id]; return { texte: t.nom, aide: `${t.pm} PM · ${t.description}`, non: t.pm > x.pm }; }), true);
          if (j >= 0) {
            const id = talents[j], t = jeu.talents[id];
            if (['soi', 'ennemis', 'allies'].includes(t.cible)) return { action: 'talent', talent: id };
            const cibles = t.cible === 'ennemi' ? C.vivants(c.monstres) : t.cible === 'allie_ko' ? c.heros.filter(y => y.pv <= 0) : C.vivants(c.heros);
            const cible = await choisirCible(cibles);
            if (cible) return { action: 'talent', talent: id, cible };
          }
        }
        if (i === 2) {
          const obs = usables();
          const j = await liste(obs.map(k => ({ texte: `${jeu.objets[k].nom} × ${etat.objets[k]}`, aide: jeu.objets[k].description })), true);
          if (j >= 0) {
            const ob = jeu.objets[obs[j]];
            const cible = await choisirCible(ob.combat.releve ? c.heros.filter(y => y.pv <= 0) : C.vivants(c.heros));
            if (cible) return { action: 'objet', objet: obs[j], cible };
          }
        }
        if (i === 3) return { action: 'defense' };
        if (i === 4) return { fuite: true };
      }
    }
    // ---------- jouer les événements d'un tour ----------
    // Une action se joue dans cet ordre : l'annonce (« Le loup attaque Alden ! »), le geste, puis AU CONTACT
    // l'impact, le son, le recul de la cible, le chiffre et la barre qui baisse, tout ensemble ; enfin les messages.
    async function jouer(evs) {
      for (let i = 0; i < evs.length;) {
        if (evs[i].t !== 'action') { await seul(evs[i++]); continue; }
        let j = i + 1;
        while (j < evs.length && evs[j].t !== 'action') j++;
        await action(evs[i], evs.slice(i + 1, j)); i = j;
      }
      synchro(); majEquipe(null); majPV();
    }

    // ce qu'un coup change à l'écran (au moment du contact)
    function toucher(e) {
      const v = vue.get(e.a), f = combattant(e.a);
      if (e.t === 'degats') {
        anim(e.a, 'touche', .5); sons.effet('touche', e.critique ? .7 : .45);
        v.pv = Math.max(0, v.pv - e.n);
        chiffre(e.a, '-' + e.n, e.critique ? 'critique' : '');
        if (e.critique) chiffre(e.a, 'CRITIQUE', 'critique-mot');
      }
      else if (e.t === 'soin') { v.pv = Math.min(f.pvMax, v.pv + e.n); v.pm = f.pm; if (e.n) chiffre(e.a, '+' + e.n, 'soin'); }
      else if (e.t === 'rate') chiffre(e.a, 'Raté', 'rate');
      else if (e.t === 'releve') { anims.delete(e.a); v.pv = f.pv; chiffre(e.a, 'Debout !', 'soin'); }
      else if (e.t === 'etat') {
        const txt = { poison: 'Poison', sommeil: 'Zz', silence: 'Silence', buff: '▲', brise: '▼ DEF', gueri: 'Guéri', reveil: '!' }[e.etat];
        if (txt) chiffre(e.a, txt, e.etat === 'buff' || e.etat === 'gueri' ? 'soin' : 'etat');
      }
      else if (e.t === 'fuite') sons.effet('fuite', .5);
      majEquipe(null); majPV(); majBoss();
    }
    // un monstre vaincu s'efface
    async function tomber(e) {
      if (combattant(e.a).camp !== 'm' || !places.has(e.a)) return;
      sons.effet('vaincu', .5); anim(e.a, 'touche', .5); await attendre(450);
      rendu.retirer(e.a); places.delete(e.a); majPV();
    }
    // un événement hors d'une action (poison en fin de tour, réveil, fuite…)
    async function seul(e) {
      if (e.t === 'message') await afficher(e.texte);
      else if (e.t === 'ko') await tomber(e);
      else { toucher(e); if (e.t === 'degats' || e.t === 'soin') await attendre(350); }
    }

    async function action(e, suite) {
      const x = combattant(e.de), fx = EFFETS[e.effet] || {};
      const coups = suite.filter(s => s.t !== 'message' && s.t !== 'ko'), kos = suite.filter(s => s.t === 'ko');
      const messages = suite.filter(s => s.t === 'message').map(s => s.texte);
      // les vraies cibles (un protecteur peut avoir pris le coup à la place)
      const touches = [...new Set(coups.map(s => s.a))].filter(id => places.has(id));
      const cibles = touches.length ? touches : e.cibles.filter(id => places.has(id)), cible = cibles[0];
      // l'annonce d'abord, puis le geste
      if (messages.length && suite[0].t === 'message') await afficher(messages.shift(), 250);
      if (x.camp === 'h') { vue.get(x.id).pm = x.pm; majEquipe(null); }   // les PM partent avec le geste
      const [px, pz] = places.get(e.de);
      if (e.anim === 'attaque' && cible && cible !== e.de && !fx.projectile) {
        const [cx, cz] = places.get(cible), k = .62;
        anim(e.de, 'attaque', .7, { de: [px, pz], vers: [px + (cx - px) * k, pz + (cz - pz) * k + .02] });
        await attendre(300);   // l'élan arrive au plus près de la cible
      } else {
        anim(e.de, e.anim === 'attaque' ? 'attaque' : 'sort', .8);
        await attendre(e.anim === 'repos' ? 150 : 280);
      }
      if (fx.projectile && cible) {
        if (fx.son) sons.effet(fx.son, .55);
        for (const id of cibles) projectiles.push({ cle: 'p' + id, tuile: fx.projectile, de: centre(e.de), vers: centre(id), debut: maintenant, duree: .38 * lent, lumiere: fx.lumiere });
        await attendre(380);
      } else if (fx.son) sons.effet(fx.son, .55);
      // le contact : chaque cible à son tour, un peu décalées pour une attaque de zone
      for (let n = 0; n < cibles.length; n++) {
        const id = cibles[n];
        if (n) await attendre(110);
        if (!places.has(id)) continue;
        if (fx.impact) projectiles.push({ cle: 'i' + id, tuile: fx.impact, vers: centre(id), debut: maintenant, duree: .5 * lent, impact: true, lumiere: fx.lumiere, taille: e.effet === 'lumiere' ? 2 : 1.4 });
        for (const s of coups) if (s.a === id) toucher(s);
      }
      for (const s of coups) if (!cibles.includes(s.a)) toucher(s);
      await attendre(coups.length ? 380 : 200);   // le temps de voir le coup
      for (const k of kos) await tomber(k);
      for (const m of messages) await afficher(m);
    }

    // ---------- montée de niveau, à la Fire Emblem : les caractéristiques en colonne, qui montent une à une ----------
    function tableauNiveau(n, p) {
      return new Promise(async fin => {
        banniere.classList.remove('on');
        const fen = h('div', 'cb-niveau'), tete = h('div', 'cb-niveau-tete'), cv = document.createElement('canvas');
        cv.width = cv.height = 48;
        if (o.poupees) M.Poupees.portrait(cv, o.poupees.perso(jeu.heros[n.id].perso));
        const titre = h('div', ''); titre.append(h('b', '', n.nom), h('div', 'cb-niveau-num', `NIVEAU ${p.niveau}`));
        tete.append(cv, titre); fen.append(tete);
        const lignes = [['pv', 'PV'], ['pm', 'PM'], ['for', 'Force'], ['def', 'Défense'], ['mag', 'Magie'], ['vit', 'Vitesse']].map(([k, nom]) => {
          const l = h('div', 'cb-niveau-ligne'), val = h('span', 'val', String(p.avant[k])), gain = h('span', 'gain', '');
          l.append(h('span', 'nom', nom), val, gain); fen.append(l);
          return { l, val, gain, d: p.apres[k] - p.avant[k], apres: p.apres[k] };
        });
        racine.append(fen); sons.effet('niveau', .6);
        let presse = false;
        fen.addEventListener('pointerdown', () => { presse = true; });
        await attendre(500);
        for (const x of lignes) {
          if (!presse) await attendre(280);
          if (x.d > 0) { x.val.textContent = String(x.apres); x.gain.textContent = '+' + x.d; x.l.classList.add('monte'); sons.effet('bip', .45); }
        }
        for (const t of p.talents) fen.append(h('div', 'cb-niveau-talent', `Nouveau talent : ${jeu.talents[t].nom} !`));
        fen.append(h('small', 'cb-niveau-suite', 'A ou toucher pour continuer'));
        const finir = () => { attente = null; fen.remove(); fin(); };
        attente = finir; fen.onclick = finir;
      });
    }

    // ---------- le combat ----------
    async function derouler() {
      majEquipe(null);
      sons.effet('rencontre', .5); sons.musique('combat');
      await attendre(350);
      for (const t of C.intro(c)) await afficher(t);
      majBoss(); majPV();
      while (!c.fin) {
        C.debutTour(c);
        let f;
        while ((f = C.prochain(c))) {
          majFrise(f.id); montrerActeur(f.id);
          let a = null;
          if (f.camp === 'h' && !f.etats.sommeil) {
            majEquipe(f.id);
            const r = await menuHeros(f, true);
            a = r.fuite ? { action: 'fuite' } : r;
            marquer(null); menu.innerHTML = ''; majEquipe(null);
          }
          await jouer(C.agirUn(c, a));
          majBoss();
        }
        montrerActeur(null);
        if (!c.fin) { await jouer(C.finTour(c)); majBoss(); }
      }
      frise.innerHTML = ''; barreBoss.style.display = 'none'; alerte.style.display = 'none';
      for (const x of barresPV.values()) x.el.remove();
      const r = C.terminer(c);
      menu.innerHTML = '';
      if (r.fin === 'victoire') {
        sons.musique(null); sons.effet('victoire', .6);
        for (const x of C.vivants(c.heros)) { anims.set(x.id, { etat: 'victoire', debut: maintenant, duree: .6, garde: true }); }
        const boucle = setInterval(() => { for (const x of C.vivants(c.heros)) { const a = anims.get(x.id); if (a) a.debut = maintenant; } }, 600);
        await afficher('Victoire !', 900);
        await afficher(`L'équipe gagne ${r.xp} points d'expérience et ${r.ecus} écus.`, 1100);
        for (const ob of r.objets) await afficher(`Tu trouves : ${jeu.objets[ob].nom}.`, 900);
        for (const n of r.niveaux) for (const p of n.passages) await tableauNiveau(n, p);
        clearInterval(boucle);
      } else if (r.fin === 'defaite') {
        sons.musique(null);
        await afficher('L\'équipe est tombée…', 1400);
      }
      marquer(null);
      for (const k of [...places.keys()]) rendu.retirer(k);
      for (const p of projectiles) rendu.effet(p.cle, null);
      rendu.quitterCombat();
      racine.remove();
      return r;
    }

    const promesse = derouler();
    return {
      promesse, pas, combat: c,
      // touches de la croix et des boutons : d'abord le message, puis le menu
      touche(t) { if (t === 'A' && attente) { attente(); return true; } if (touche) { touche(t); return true; } return false; }
    };
  }

  M.CombatUI = { Combattre };
})(window.MoteurRPG = window.MoteurRPG || {});

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

    // ---------- l'écran ----------
    const racine = h('div', 'cb'), banniere = h('div', 'cb-message'), calque = h('div', 'cb-calque'), bas = h('div', 'cb-bas');
    const equipe = h('div', 'cb-equipe'), menu = h('div', 'cb-menu');
    const haut = h('div', 'cb-haut'), frise = h('div', 'cb-frise'), barreBoss = h('div', 'cb-boss'), alerte = h('div', 'cb-alerte');
    haut.append(frise, barreBoss, alerte, banniere);
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

    function anim(id, etat, duree = .6, mvt = null) { anims.set(id, { etat, debut: maintenant, duree, de: mvt && mvt.de, vers: mvt && mvt.vers }); }

    // chaque image : poses, déplacements, projectiles, lumière, chiffres et marque
    function pas(t) {
      maintenant = t; if (!t0) t0 = t;
      for (const f of c.heros.concat(c.monstres)) {
        if (!places.has(f.id)) continue;
        let [x, z] = places.get(f.id), e = f.pv > 0 ? 'repos' : 'ko', q = 0;
        const a = anims.get(f.id);
        if (a) {
          const k = Math.min(1, (t - a.debut) / a.duree);
          if (k >= 1 && !a.garde) anims.delete(f.id);
          else {
            e = a.etat; q = k;
            if (a.vers) { const b = Math.sin(Math.min(1, k / .85) * Math.PI); x = a.de[0] + (a.vers[0] - a.de[0]) * b; z = a.de[1] + (a.vers[1] - a.de[1]) * b; }
          }
        }
        if (f.pv <= 0 && f.camp === 'm') continue;
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
        const [x, z] = places.get(m.dataset.cible), f = combattant(m.dataset.cible);
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
    const barresPV = new Map();
    for (const m of c.monstres) if (!m.boss) {
      const el = h('div', 'cb-pv-monstre'), b = h('div', 'rpg-barre pv'), i = h('i'), t = h('small', '');
      b.append(i); el.append(b, t); calque.append(el);
      barresPV.set(m.id, { el, i, t, connu: ((etat.bestiaire || {})[m.type] || {}).v >= 1 });
    }
    function majPV() {
      for (const [id, x] of barresPV) {
        const m = combattant(id);
        x.el.style.display = m.pv > 0 && places.has(id) ? '' : 'none';
        x.i.style.width = 100 * m.pv / m.pvMax + '%';
        x.t.textContent = x.connu ? `${m.pv}/${m.pvMax}` : '';
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
    function majBoss() {
      const b = c.monstres.find(m => m.boss && m.pv > 0);
      barreBoss.style.display = b ? '' : 'none';
      if (b) {
        barreBoss.innerHTML = '';
        const p = C.prochaineAction(c, b), barre = h('div', 'rpg-barre pv'), i = h('i');
        i.style.width = 100 * b.pv / b.pvMax + '%'; barre.append(i);
        barreBoss.append(h('b', '', b.nom), barre, h('small', p && (p.grand || p.prepare) ? 'grand' : '', p ? 'Prochaine action : ' + p.nom : ''));
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
    function majEquipe(actif) {
      equipe.innerHTML = '';
      for (const x of c.heros) {
        const l = h('div', 'cb-heros' + (x.id === actif ? ' actif' : '') + (x.pv <= 0 ? ' ko' : ''));
        const etats = Object.keys(x.etats).map(k => ({ poison: '☠', sommeil: 'Zz', silence: '…' })[k] || '').join(' ');
        l.append(h('b', '', x.nom + (etats ? ' ' + etats : '')));
        const pv = h('div', 'cb-ligne'); pv.append(h('span', '', 'PV'), h('span', '', `${x.pv}/${x.pvMax}`));
        const bpv = h('div', 'rpg-barre pv'), ipv = h('i'); ipv.style.width = 100 * x.pv / x.pvMax + '%'; bpv.append(ipv);
        const pm = h('div', 'cb-ligne'); pm.append(h('span', '', 'PM'), h('span', '', `${x.pm}/${x.pmMax}`));
        const bpm = h('div', 'rpg-barre pm'), ipm = h('i'); ipm.style.width = (x.pmMax ? 100 * x.pm / x.pmMax : 0) + '%'; bpm.append(ipm);
        l.append(pv, bpv, pm, bpm); equipe.append(l);
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
    async function jouer(evs) {
      for (const e of evs) {
        if (e.t === 'message') await afficher(e.texte);
        else if (e.t === 'action') {
          const x = combattant(e.de), fx = EFFETS[e.effet] || {}, cible = e.cibles[0];
          const [px, pz] = places.get(e.de);
          if (e.anim === 'attaque' && cible && places.has(cible) && !fx.projectile) {
            const [cx, cz] = places.get(cible), k = .62;
            anim(e.de, 'attaque', .7, { de: [px, pz], vers: [px + (cx - px) * k, pz + (cz - pz) * k + .02] });
            await attendre(330);
          } else {
            anim(e.de, e.anim === 'attaque' ? 'attaque' : 'sort', .8);
            await attendre(260);
          }
          if (fx.son) sons.effet(fx.son, .55);
          if (fx.projectile && cible) {
            for (const id of e.cibles.filter(id => places.has(id))) projectiles.push({ cle: 'p' + id, tuile: fx.projectile, de: centre(e.de), vers: centre(id), debut: maintenant, duree: .38, lumiere: fx.lumiere });
            await attendre(380);
          }
          for (const id of e.cibles.filter(id => places.has(id))) if (fx.impact) projectiles.push({ cle: 'i' + id, tuile: fx.impact, vers: centre(id), debut: maintenant, duree: .5, impact: true, lumiere: fx.lumiere, taille: e.effet === 'lumiere' ? 2 : 1.4 });
          if (x.camp === 'h') majEquipe(null);
          await attendre(fx.impact ? 200 : 60);
        }
        else if (e.t === 'degats') {
          anim(e.a, 'touche', .5); sons.effet('touche', .45);
          chiffre(e.a, '-' + e.n, e.critique ? 'critique' : ''); majEquipe(null); majPV();
          await attendre(120);
        }
        else if (e.t === 'soin') { if (e.n) chiffre(e.a, '+' + e.n, 'soin'); majEquipe(null); majPV(); }
        else if (e.t === 'rate') { chiffre(e.a, 'Raté', 'rate'); }
        else if (e.t === 'ko') {
          const f = combattant(e.a);
          if (f.camp === 'm') { sons.effet('vaincu', .5); anim(e.a, 'touche', .5); await attendre(450); rendu.retirer(e.a); places.delete(e.a); majPV(); }
          majEquipe(null);
        }
        else if (e.t === 'releve') { anims.delete(e.a); chiffre(e.a, 'Debout !', 'soin'); majEquipe(null); }
        else if (e.t === 'etat') {
          const txt = { poison: 'Poison', sommeil: 'Zz', silence: 'Silence', buff: '▲', brise: '▼ DEF', gueri: 'Guéri', reveil: '!' }[e.etat];
          if (txt) chiffre(e.a, txt, e.etat === 'buff' || e.etat === 'gueri' ? 'soin' : 'etat');
          majEquipe(null);
        }
        else if (e.t === 'fuite') sons.effet('fuite', .5);
      }
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

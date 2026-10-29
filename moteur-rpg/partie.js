/* Moteur RPG — la partie en cours sur la carte (navigateur) : relie l'état, le monde, les événements,
   le rendu, l'interface, les commandes et les sons.
   - déplacement case par case du chef de file, l'équipe le suit en file ;
   - A : parler à l'habitant ou utiliser l'objet devant soi (coffre, panneau, lanterne) ;
   - sorties (fondu au noir), déclencheurs, monstres qui errent et lancent un combat au contact ;
   - sauvegardes : automatique à l'arrivée sur certaines cartes et par les événements, à la main aux lanternes,
     copie de reprise à chaque changement de carte ;
   - MENU : équipe, objets, journal, options, retour à la Ludothèque.
   o : { jeu, rendu, ui, entrees, sons, poupees, sauvegardes, emplacement, etat, combat(groupe) → promesse 'victoire' | 'fuite' | 'defaite',
         reglages, enregistrerReglages(), defaite() } */
(function (M) {
  const PAS = .2;   // secondes pour avancer d'une case
  const CADENCE = 2.4;   // cycles de marche par seconde (deux petits rebonds par cycle)
  const SENS = { gauche: 1, droite: -1 };

  function Partie(o) {
    const { jeu, rendu, ui, entrees, sons } = o;
    const W = M.Monde, Ev = M.Evenements;
    let etat = o.etat, carte = null, occupe = false, menuOuvert = false, actif = true;
    let chef = null, suiveurs = [], pnjs = [], monstres = [], vaincus = new Set();
    let mouvement = null;   // { t } pendant qu'on avance d'une case
    let ensuite = null;     // événement d'arrivée d'une carte atteinte pendant un autre événement

    const nomObjet = id => (jeu.objets[id] || {}).nom || id;
    const ctx = () => ({ etat, jeu, ui, actions });

    // ---------- arrivée sur une carte ----------
    function entrer(id, x, y, dir, auto = true) {
      const def = jeu.cartes[id];
      if (!def) throw new Error('carte inconnue : ' + id);
      carte = W.preparer(def, jeu.legende, c => Ev.condition(c, etat));
      Object.assign(etat, { carte: id, x, y, dir: dir || etat.dir, lieu: def.nom || '' });
      rendu.chargerCarte(carte);
      vaincus = new Set();
      equipe();
      pnjs = (def.pnj || []).filter(p => (!p.cache && Ev.condition(p.si, etat) && etat.drapeaux['pnj:' + p.id] !== 'cache') || etat.drapeaux['pnj:' + p.id] === 'montre')
        .map(p => {
          const a = rendu.acteur('pnj:' + p.id, p.perso);
          const n = { def: p, id: p.id, aid: 'pnj:' + p.id, x: p.x, y: p.y, ox: p.x, oy: p.y, de: [p.x, p.y], t: 1, sens: p.sens || 1, prochain: 1 + Math.random() * 2, a };
          return n;
        });
      monstres = (def.monstres || []).map((m, i) => ({ def: m, id: 'mon:' + i, aid: 'mon:' + i, i, x: m.x, y: m.y, ox: m.x, oy: m.y, rayon: m.rayon || 2, dir: 'bas', de: [m.x, m.y], t: 1, sens: 1, prochain: Math.random() * 1.5 }));
      monstres.forEach(m => rendu.acteur(m.id, (jeu.monstres[m.def.type] || {}).tuile || m.def.type, { taille: (jeu.monstres[m.def.type] || {}).taille || 1 }));
      objetsOuverts();
      rendu.viser(x, y, true);
      sons.musique(def.musique || null);
      if (auto) o.sauvegardes.ecrire(o.emplacement, 'reprise', etat);
      dessiner(0);
    }

    // l'état des objets qui changent (coffres ouverts, leviers, grilles, portes, nappes) ; la carte est relue pour les passages
    function objetsOuverts() {
      carte = W.preparer(carte.def, jeu.legende, c => Ev.condition(c, etat));
      for (const ob of carte.def.objets || []) {
        if (ob.type === 'coffre') rendu.majObjet(ob, !!etat.drapeaux['coffre:' + ob.id]);
        else if (ob.type === 'levier') rendu.majObjet(ob, !!etat.drapeaux[ob.drapeau]);
        else if (W.OUVRABLES.includes(ob.type)) rendu.majObjet(ob, W.estOuvert(ob, c => Ev.condition(c, etat)));
      }
      lanternes();
    }
    // lanternes oubliées déjà rallumées (drapeau « oubliee:<id> »)
    function lanternes() { for (const ob of carte.def.objets || []) if (ob.type === 'lanterne_oubliee' && etat.drapeaux['oubliee:' + ob.id]) rendu.allumer(ob); }

    // les acteurs de l'équipe (à refaire quand quelqu'un rejoint ou quitte l'équipe)
    function equipe() {
      for (const s of [chef, ...suiveurs]) if (s) rendu.retirer(s.id);
      const ids = etat.equipe;
      chef = { id: 'eq:' + ids[0], heros: ids[0], x: etat.x, y: etat.y, de: [etat.x, etat.y], dir: etat.dir, sens: SENS[etat.dir] || 1 };
      suiveurs = ids.slice(1).map((h, i) => ({ id: 'eq:' + h, heros: h, x: etat.x, y: etat.y, de: [etat.x, etat.y], dir: etat.dir, sens: 1, rang: i }));
      [chef, ...suiveurs].forEach((s, i) => { const a = rendu.acteur(s.id, jeu.heros[s.heros].perso); a.ordre = 9 - i; });
    }

    // ---------- chaque image ----------
    function pas(dt, t) {
      etat.temps += dt;
      const libre = !occupe && !menuOuvert && !ui.occupe;
      if (mouvement) {
        mouvement.t += dt / (PAS * (mouvement.duree || 1));
        if (mouvement.t >= 1) { const recul = mouvement.recul; mouvement = null; if (!recul) arrive(); }
      }
      if (!mouvement && libre) { const d = entrees.dir(); if (d) essayer(d); }
      if (libre) errer(dt);
      dessiner(t);
    }

    const lisse = (s, k) => [s.de[0] + (s.x - s.de[0]) * k, s.de[1] + (s.y - s.de[1]) * k];
    function dessiner(t) {
      const k = mouvement ? Math.min(1, mouvement.t) : 1;
      // le pas suit l'horloge (et pas l'avancée dans la case) : un balancement doux, même en avançant vite
      [chef, ...suiveurs].forEach((s, i) => {
        const [x, y] = lisse(s, k), bouge = mouvement && (s.x !== s.de[0] || s.y !== s.de[1]);
        rendu.placer(s.id, x, y, bouge ? 'marche' : 'repos', bouge ? (t * CADENCE + i * .3) % 1 : 0, s.sens);
      });
      for (const n of pnjs.concat(monstres)) {
        n.t = Math.min(1, n.t + (t - (n.dernier || t)) / (PAS * 1.6)); n.dernier = t;
        const [x, y] = lisse(n, n.t), bouge = n.t < 1;
        const anim = !bouge && n.def && n.def.anim;   // un habitant peut avoir son geste à lui (par ex. 'attaque')
        rendu.placer(n.aid, x, y, bouge ? 'marche' : anim || 'repos', bouge ? (t * CADENCE * .8 + (n.def && n.def.x || 0) * .37) % 1 : anim ? (t * .7 + (n.def.x || 0)) % 1 : 0, n.sens);
      }
      const [cx, cy] = lisse(chef, k);
      rendu.viser(cx, cy);
    }

    // ---------- déplacement ----------
    const occupees = (sauf) => pnjs.concat(monstres).filter(n => n !== sauf).map(n => ({ x: n.x, y: n.y }));
    function essayer(dir) {
      chef.dir = etat.dir = dir; if (SENS[dir]) chef.sens = SENS[dir];
      const [nx, ny] = W.devant(chef.x, chef.y, dir);
      const m = monstres.find(x => x.x === nx && x.y === ny);
      if (m) { combat(m, W.initiative(dir, m.dir, 'heros')); return; }
      if (W.estBloque(carte, nx, ny, pnjs.map(n => ({ x: n.x, y: n.y })))) return;
      const ancien = { x: chef.x, y: chef.y, dir: chef.dir };
      const file = W.avancerFile(suiveurs.map(s => ({ x: s.x, y: s.y, dir: s.dir })), ancien);
      chef.de = [chef.x, chef.y]; chef.x = nx; chef.y = ny;
      suiveurs.forEach((s, i) => { s.de = [s.x, s.y]; s.x = file[i].x; s.y = file[i].y; if (s.x !== s.de[0]) s.sens = s.x > s.de[0] ? -1 : 1; });
      etat.x = nx; etat.y = ny;
      mouvement = { t: 0 };
    }

    function arrive() {
      const s = W.sortieEn(carte, chef.x, chef.y);
      if (s && s.si && !Ev.condition(s.si, etat)) { reculer(s.refus); return; }
      if (s) { passer(s.vers, s.a[0], s.a[1], s.dir); return; }
      const d = W.declencheurEn(carte, chef.x, chef.y, c => Ev.condition(c, etat));
      if (d) jouer(d.evenement);
    }

    // sortie pas encore permise : l'événement de refus, puis un pas en arrière
    async function reculer(refus) {
      if (refus) await jouer(refus);
      const dir = W.OPPOSE[chef.dir], [nx, ny] = W.devant(chef.x, chef.y, dir);
      if (W.estBloque(carte, nx, ny)) return;
      chef.de = [chef.x, chef.y]; chef.x = nx; chef.y = ny; etat.x = nx; etat.y = ny;
      suiveurs.forEach(s => { s.de = [s.x, s.y]; s.x = nx; s.y = ny; });
      mouvement = { t: 0, recul: true };
    }

    // ---------- monstres et habitants qui se promènent ----------
    function errer(dt) {
      for (const m of monstres) {
        if ((m.prochain -= dt) > 0 || m.t < 1) continue;
        m.prochain = .7 + Math.random() * .9;
        const p = W.pasErrant(m, carte, Math.random, occupees(m));
        if (!p) continue;
        if (p.x === chef.x && p.y === chef.y && !mouvement) { m.dir = p.dir; combat(m, W.initiative(chef.dir, p.dir, 'monstre')); return; }
        if (suiveurs.some(s => s.x === p.x && s.y === p.y) || (p.x === chef.x && p.y === chef.y)) continue;
        m.de = [m.x, m.y]; m.x = p.x; m.y = p.y; m.dir = p.dir; m.t = 0; if (SENS[p.dir]) m.sens = SENS[p.dir];
      }
      for (const n of pnjs) {
        if (!n.def.erre || (n.prochain -= dt) > 0 || n.t < 1) continue;
        n.prochain = 1.5 + Math.random() * 2.5;
        const p = W.pasErrant(Object.assign({ rayon: n.def.erre }, n), carte, Math.random, occupees(n).concat([chef, ...suiveurs]));
        if (!p) continue;
        n.de = [n.x, n.y]; n.x = p.x; n.y = p.y; n.t = 0; if (SENS[p.dir]) n.sens = SENS[p.dir];
      }
    }

    // ---------- actions ----------
    async function interagir() {
      const [fx, fy] = W.devant(chef.x, chef.y, chef.dir);
      const n = pnjs.find(p => p.x === fx && p.y === fy);
      if (n) {
        if (fx !== chef.x) n.sens = chef.x > fx ? -1 : 1;
        if (n.def.evenement) await jouer(n.def.evenement);
        return;
      }
      const ob = W.objetEn(carte, fx, fy);
      if (!ob) return;
      if (ob.evenement) return jouer(ob.evenement);
      if (ob.type === 'panneau') return jouer([{ dire: [].concat(ob.texte) }]);
      if (ob.type === 'pieu') return jouer([{ dire: etat.drapeaux['outil:grappin'] ? 'Un pieu solide. De l\'autre côté de l\'eau, face à un pieu, B lance le grappin.' : 'Un vieux pieu planté dans la vase, cerclé de fer. On pourrait y accrocher quelque chose.' }]);
      if (ob.type === 'coffre') {
        if (etat.drapeaux['coffre:' + ob.id]) return jouer([{ dire: 'Le coffre est vide.' }]);
        etat.drapeaux['coffre:' + ob.id] = true; rendu.majObjet(ob, true); sons.effet('coffre');
        const c = ob.contenu || {};
        return jouer(c.ecus ? [{ ecus: c.ecus }, { dire: `{HEROS} trouve ${c.ecus} écus.` }]
          : [{ donner: c.objet, n: c.n || 1 }, { dire: `{HEROS} trouve ${(c.n || 1) > 1 ? c.n + ' × ' : ''}${nomObjet(c.objet)}.` }]);
      }
      if (ob.type === 'lanterne') return jouer(jeu.evenements.lanterne ? 'lanterne' : [{ soigner: true }, { sauver: 'main' }]);
      const ouvert = W.estOuvert(ob, c => Ev.condition(c, etat));
      if (ob.type === 'levier') {
        if (etat.drapeaux[ob.drapeau]) return jouer([{ dire: 'Le levier est déjà baissé.' }]);
        etat.drapeaux[ob.drapeau] = true; sons.effet('porte', .6);
        return jouer([{ dire: ob.texte || 'Le levier grince… Quelque part, un mécanisme se met en marche.' }]);
      }
      if (ob.type === 'porte_cle' && !ouvert) {
        if ((etat.objets[ob.cle] || 0) < 1) return jouer([{ dire: `La porte est fermée à clé. Il faudrait : ${nomObjet(ob.cle)}.` }]);
        M.Etat.prendre(etat, ob.cle, 1); etat.drapeaux['ouvert:' + ob.id] = true; sons.effet('porte', .7);
        return jouer([{ dire: `${nomObjet(ob.cle)} tourne dans la serrure. La porte s'ouvre.` }]);
      }
      if (ob.type === 'nappe' && !ouvert) {
        const outil = jeu.outils && jeu.outils[ob.outil];
        return jouer([{ dire: etat.drapeaux['outil:' + ob.outil] ? `Une nappe de brume épaisse. ${outil ? outil.aide : ''}` : 'Une nappe de brume, épaisse comme un mur. Impossible de passer sans lumière.' }]);
      }
      // un autre obstacle qu'un outil ôte (rocher fendu, mur fissuré) : sa description, puis l'aide de l'outil ou ce qui manque
      if (ob.outil && !ouvert) {
        const outil = (jeu.outils && jeu.outils[ob.outil]) || {};
        return jouer([{ dire: [].concat(ob.texte || [], etat.drapeaux['outil:' + ob.outil] ? outil.aide || [] : outil.sans || []) }]);
      }
      if (ob.type === 'grille' && !ouvert) return jouer([{ dire: ob.texte || 'Une lourde grille barre le passage.' }]);
    }

    // B : l'outil sur ce qui est devant soi (une nappe de brume et la lanterne, un rocher et la masse, de l'eau et le grappin)
    function outil() {
      const [fx, fy] = W.devant(chef.x, chef.y, chef.dir), ob = W.objetEn(carte, fx, fy);
      if (ob && ob.outil && etat.drapeaux['outil:' + ob.outil] && !W.estOuvert(ob, c => Ev.condition(c, etat))) {
        const o2 = jeu.outils && jeu.outils[ob.outil];
        etat.drapeaux['ouvert:' + ob.id] = true; sons.effet(o2 && o2.son || 'lanterne', .7);
        objetsOuverts();
        if (o2 && o2.texte) ui.message(o2.texte, 1800);
        return;
      }
      if (etat.drapeaux['outil:grappin'] && !W.dehors(carte, fx, fy) && carte.cases[fy][fx].franchissable) grappin();
    }
    // le grappin file jusqu'au pieu d'en face et tire toute l'équipe sur l'autre rive
    function grappin() {
      const cible = W.cibleGrappin(carte, chef.x, chef.y, chef.dir);
      if (!cible) { ui.message('Rien où accrocher le grappin.', 1500); return; }
      const d = Math.abs(cible[0] - chef.x) + Math.abs(cible[1] - chef.y);
      sons.effet((jeu.outils.grappin || {}).son || 'fleche', .7);
      for (const s of [chef, ...suiveurs]) { s.de = [s.x, s.y]; s.x = cible[0]; s.y = cible[1]; }
      etat.x = cible[0]; etat.y = cible[1];
      mouvement = { t: 0, duree: .45 * d };
    }

    async function jouer(script) {
      if (occupe) return;
      occupe = true; entrees.lacherTout();
      try { await Ev.jouer(script, ctx()); }
      catch (e) { console.error(e); ui.message('Erreur : ' + e.message, 4000); }
      occupe = false;
      objetsOuverts();
      if (ensuite) { const s = ensuite; ensuite = null; await jouer(s); }
    }

    async function passer(id, x, y, dir) {
      const avant = occupe; occupe = true;
      sons.effet('porte', .4);
      await ui.noir(true);
      entrer(id, x, y, dir);
      await ui.noir(false);
      occupe = avant;
      const def = jeu.cartes[id];
      if (def.sauvegardeAuto) sauver('auto');
      if (def.entree) { if (avant) ensuite = def.entree; else await jouer(def.entree); }
    }

    function sauver(type) {
      const ok = o.sauvegardes.ecrire(o.emplacement, type, etat);
      ui.message(ok ? 'Sauvegarde…' : 'Sauvegarde impossible');
    }

    async function combat(m, initiative) {
      if (occupe) return;
      occupe = true; entrees.lacherTout();
      rendu.retirer(m.id); monstres = monstres.filter(x => x !== m); vaincus.add(m.i);
      // un monstre bien plus faible que l'équipe s'enfuit (§ 8.3 : plus de combats inutiles)
      const t = jeu.monstres[m.def.type] || {}, chef = etat.heros[etat.equipe[0]];
      if (!t.boss && t.niveau && chef.niveau >= t.niveau + 6) { ui.message(`${t.nom} s'enfuit.`); occupe = false; return; }
      const r = await o.combat({ type: m.def.type, monstres: m.def.groupe, initiative, fuite: m.def.fuite });
      occupe = false;
      if (r === 'defaite') o.defaite();
    }

    const actions = {
      sauver: c => sauver(c.sauver === 'main' ? 'main' : 'auto'),
      teleporter: c => passer(c.teleporter, c.x, c.y, c.dir),
      combat: async c => { const r = await o.combat({ monstres: [].concat(c.combat), boss: c.boss, fuite: c.fuite, initiative: 'normal' }); if (r === 'defaite') { o.defaite(); return false; } },
      pnj: c => {
        if (c.cacher || c.montrer) {
          etat.drapeaux['pnj:' + c.pnj] = c.cacher ? 'cache' : 'montre';
          const n = pnjs.find(p => p.id === c.pnj);
          if (n && c.cacher) { rendu.retirer(n.a.id); pnjs = pnjs.filter(p => p !== n); }
          if (!n && c.montrer) {
            const p = (jeu.cartes[etat.carte].pnj || []).find(x => x.id === c.pnj);
            if (p) { const a = rendu.acteur('pnj:' + p.id, p.perso); pnjs.push({ def: p, id: p.id, aid: 'pnj:' + p.id, x: p.x, y: p.y, ox: p.x, oy: p.y, de: [p.x, p.y], t: 1, sens: p.sens || 1, prochain: 2, a }); }
          }
        }
        if (c.aller) {
          const n = pnjs.find(p => p.id === c.pnj);
          if (n) { n.de = [n.x, n.y]; if (c.aller[0] !== n.x) n.sens = c.aller[0] > n.x ? -1 : 1; n.x = c.aller[0]; n.y = c.aller[1]; n.t = 0; return new Promise(r => setTimeout(r, PAS * 1.6 * 1000)); }
        }
      },
      son: c => sons.effet(c.son),
      musique: c => sons.musique(c.musique),
      attendre: c => new Promise(r => setTimeout(r, c.attendre * 1000)),
      recu: (objet, n) => { if (n > 0) { sons.effet('coffre', .5); ui.message(objet === 'ecus' ? `+ ${n} écus` : `${nomObjet(objet)} × ${n}`); } },
      soigner: () => sons.effet('soin', .5),
      equipe: () => { equipe(); dessiner(0); }
    };

    // ---------- menu ----------
    function ouvrirMenu() {
      menuOuvert = true; entrees.lacherTout(); sons.effet('ok', .4);
      ui.ouvrirMenu(racine => M.Menu.construire(racine, { jeu, etat, poupees: o.poupees, reglages: o.reglages, sons, fermer: fermerMenu, enregistrerReglages: o.enregistrerReglages, graphismes: o.graphismes }));
    }
    function fermerMenu() { ui.fermerMenu(); menuOuvert = false; }

    entrees.on(t => {
      if (!actif || !carte) return;
      if (ui.touche(t)) return;
      if (menuOuvert) { if (t === 'MENU') fermerMenu(); return; }
      if (occupe) return;
      if (t === 'A' && !mouvement) interagir();
      if (t === 'B' && !mouvement) outil();
      if (t === 'MENU') ouvrirMenu();
    });

    return {
      entrer, pas, jouer, sauver, passer, arreter() { actif = false; if (menuOuvert) fermerMenu(); },
      get etat() { return etat; }, get carte() { return carte; }, get occupe() { return occupe || menuOuvert || ui.occupe || !!mouvement; },
      get monstres() { return monstres; }, get pnjs() { return pnjs; }
    };
  }

  M.Partie = { Partie, PAS };
})(window.MoteurRPG = window.MoteurRPG || {});

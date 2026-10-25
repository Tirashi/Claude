/* Moteur RPG — le combat au tour par tour (testable sous Node, sans DOM) : cahier des charges § 10.
   Une équipe de 1 à 4 héros contre 1 à 4 monstres. Au début de chaque tour, on choisit l'action de chaque
   héros, puis tout le monde agit dans l'ordre de la Vitesse (Défense, Protection et Rempart d'abord).

   creer(jeu, etat, rencontre, rng) → combat     rencontre : { monstres: ['feu_follet', …], initiative, boss, fuite: false (combat qu'on ne peut pas fuir) }
   resoudre(c, choix) → liste d'événements à montrer, dans l'ordre :
     choix = { <héros>: { action: 'attaque' | 'talent' | 'objet' | 'defense', cible, talent, objet }, fuite: true }
     événements : { t: 'message', texte } { t: 'action', de, anim, effet, cibles } { t: 'degats', a, n, critique }
       { t: 'soin', a, n } { t: 'rate', a } { t: 'ko', a } { t: 'releve', a } { t: 'etat', a, etat } { t: 'fuite', ok }
   terminer(c) → écrit le résultat dans l'état de la partie (PV, PM, expérience, écus, butin) et le renvoie.

   Données du jeu :
     talents: { id: { nom, classe, niveau, pm, cible: 'ennemi'|'ennemis'|'allie'|'allies'|'soi'|'allie_ko',
                      effet: { type: 'arme'|'sort'|'soin'|'buff'|'brise'|'etat'|'protection'|'rempart'|'esquive'|'purification'|'releve'|'vol', … } } }
     monstres: { id: { nom, pv, pm, for, def, mag, vit, xp, ecus, elements: { feu: 1.5 }, butin: [{ objet, chance }], vol, boss,
                       actions: [{ type: 'attaque'|'sort'|'etat'|'charge', poids, nom, puissance, element, etat, chance, zone, prepare, mult }],
                       cycle: [numéros d'actions] (boss au rythme fixe, sinon tirage selon les poids) } }
     objets:   { id: { nom, combat: { soin, pm, guerit, releve } } } */
(function (M) {
  const R = () => M.Regles, E = () => M.Etat;
  const LETTRES = 'ABCDEF';

  function nomHeros(jeu, etat, id) { return id === etat.equipe[0] && jeu.heros[id].nomJoueur ? etat.nom : jeu.heros[id].nom; }

  function creer(jeu, etat, rencontre, rng = Math.random) {
    const c = { jeu, etat, rng, tour: 0, fin: null, initiative: rencontre.initiative || 'normal', boss: !!rencontre.boss, sansFuite: rencontre.fuite === false,
      heros: [], monstres: [], protecteur: null, rempart: false };
    etat.equipe.forEach((id, i) => {
      const h = etat.heros[id], s = R().statsEquipees(jeu, h);
      c.heros.push({ camp: 'h', id, rang: i, nom: nomHeros(jeu, etat, id), classe: h.classe, ref: h, pv: Math.min(h.pv, s.pvMax), pvMax: s.pvMax, pm: h.pm, pmMax: s.pmMax,
        base: s, effets: {}, etats: Object.assign({}, h.etats || {}) });
    });
    const compte = {}, vus = {};
    for (const t of rencontre.monstres) compte[t] = (compte[t] || 0) + 1;
    rencontre.monstres.forEach((t, i) => {
      const m = jeu.monstres[t];
      if (!m) throw new Error('monstre inconnu : ' + t);
      vus[t] = (vus[t] || 0) + 1;
      c.monstres.push({ camp: 'm', id: 'm' + i, type: t, rang: i, nom: compte[t] > 1 ? `${m.nom} ${LETTRES[vus[t] - 1]}` : m.nom,
        pv: m.pv, pvMax: m.pv, pm: m.pm || 0, pmMax: m.pm || 0, base: { for: m.for, def: m.def, mag: m.mag || 0, vit: m.vit },
        elements: m.elements || {}, effets: {}, etats: {}, boss: !!m.boss, def: m, prepare: null });
      if (m.boss) c.boss = true;
    });
    return c;
  }

  const vivants = liste => liste.filter(f => f.pv > 0);
  const tous = c => c.heros.concat(c.monstres);
  const trouve = (c, id) => tous(c).find(f => f.id === id);
  const camp = (c, f, memeCamp) => (f.camp === 'h') === memeCamp ? c.heros : c.monstres;
  // une stat avec les effets passagers (Cri, Bénédiction, Ombre, Brise-armure)
  function stat(f, k) {
    let v = f.base[k];
    if (f.effets[k]) v *= f.effets[k].mult;
    if (k === 'def' && f.effets.brise) v *= .5;
    return Math.round(v);
  }

  // quelques mots d'introduction (surprise, boss)
  function intro(c) {
    const t = [];
    const noms = c.monstres.map(m => m.nom);
    t.push(c.monstres.length === 1 ? `${noms[0]} apparaît !` : `${noms.slice(0, -1).join(', ')} et ${noms[noms.length - 1]} apparaissent !`);
    if (c.initiative === 'heros') t.push('Tu les prends par surprise !');
    if (c.initiative === 'monstre') t.push('Ils te prennent par surprise !');
    return t;
  }

  // ---------- un tour ----------
  function resoudre(c, choix = {}) {
    const ev = [], rng = c.rng, dire = texte => ev.push({ t: 'message', texte });
    if (c.fin) return ev;
    c.tour++;
    let herosAgissent = !(c.tour === 1 && c.initiative === 'monstre');
    const monstresAgissent = !(c.tour === 1 && c.initiative === 'heros');

    if (choix.fuite && herosAgissent) {
      const f = fuite(c);
      if (!f.possible) dire(f.raison);
      else {
        const { vh, vm } = f;
        if (rng() < R().chanceFuite(vh, vm)) { ev.push({ t: 'fuite', ok: true }); dire('L\'équipe prend la fuite !'); c.fin = 'fuite'; return ev; }
        ev.push({ t: 'fuite', ok: false }); dire('La fuite échoue !');
      }
      herosAgissent = false;
    }

    const acteurs = [];
    if (herosAgissent) for (const h of vivants(c.heros)) if (choix[h.id]) acteurs.push({ f: h, a: choix[h.id] });
    if (monstresAgissent) for (const m of vivants(c.monstres)) acteurs.push({ f: m, a: choisirIA(c, m) });
    const prioritaire = x => x.a.action === 'defense' || x.a.action === 'objet' || (x.a.action === 'talent' && ((c.jeu.talents[x.a.talent] || {}).effet || {}).priorite);
    for (const x of acteurs) x.ordre = (prioritaire(x) ? 1000 : 0) + R().tirageOrdre(stat(x.f, 'vit'), rng);
    acteurs.sort((a, b) => b.ordre - a.ordre);

    for (const x of acteurs) {
      if (c.fin) break;
      if (x.f.pv <= 0) continue;
      if (x.f.etats.sommeil) {
        if (rng() < 1 / 3) { delete x.f.etats.sommeil; dire(`${x.f.nom} se réveille.`); ev.push({ t: 'etat', a: x.f.id, etat: 'reveil' }); }
        else { dire(`${x.f.nom} dort profondément.`); continue; }
      }
      agir(c, x.f, x.a, ev);
      verifierFin(c);
    }

    // fin du tour : poison, effets qui s'épuisent
    if (!c.fin) for (const f of vivants(tous(c))) {
      if (f.etats.poison) {
        const n = Math.max(1, Math.round(f.pvMax / 10));
        dire(`${f.nom} souffre du poison.`); blesser(c, f, n, ev, false);
      }
    }
    for (const f of tous(c)) {
      f.defense = false;
      for (const k in f.effets) if (--f.effets[k].tours <= 0) delete f.effets[k];
    }
    c.protecteur = null; c.rempart = false;
    verifierFin(c);
    return ev;
  }

  // peut-on fuir ? (boss, combat d'histoire, ou un monstre bien plus rapide que toute l'équipe)
  function fuite(c) {
    if (c.boss || c.sansFuite) return { possible: false, raison: 'Impossible de fuir !' };
    const vh = Math.max(...vivants(c.heros).map(h => stat(h, 'vit')));
    const rapide = vivants(c.monstres).reduce((a, m) => (!a || stat(m, 'vit') > stat(a, 'vit') ? m : a), null), vm = stat(rapide, 'vit');
    if (!R().fuitePossible(vh, vm)) return { possible: false, raison: `${rapide.nom} est bien trop rapide pour être semé !` };
    return { possible: true, vh, vm };
  }

  function verifierFin(c) {
    if (c.fin) return;
    if (!vivants(c.monstres).length) c.fin = 'victoire';
    else if (!vivants(c.heros).length) c.fin = 'defaite';
  }

  // cible choisie, ou une autre au hasard si elle est déjà tombée
  function cibleDe(c, f, id, allie = false) {
    const liste = vivants(camp(c, f, allie));
    const v = liste.find(x => x.id === id);
    return v || liste[Math.floor(c.rng() * liste.length)] || null;
  }

  function agir(c, f, a, ev) {
    const dire = texte => ev.push({ t: 'message', texte }), jeu = c.jeu;
    if (a.action === 'defense') { ev.push({ t: 'action', de: f.id, anim: 'repos', effet: null, cibles: [] }); dire(`${f.nom} se met en garde.`); f.defense = true; return; }
    if (a.action === 'prepare') { ev.push({ t: 'action', de: f.id, anim: 'sort', effet: null, cibles: [] }); dire(a.texte); return; }
    if (a.action === 'attaque') {
      const cible = cibleDe(c, f, a.cible);
      if (!cible) return;
      ev.push({ t: 'action', de: f.id, anim: 'attaque', effet: f.camp === 'h' ? (jeu.heros[f.id].effetAttaque || 'coup') : (f.def.effetAttaque || 'morsure'), cibles: [cible.id] });
      dire(`${f.nom} attaque !`);
      frapper(c, f, cible, 1, ev);
      return;
    }
    if (a.action === 'objet') {
      const ob = jeu.objets[a.objet], ok = ob && ob.combat && E().prendre(c.etat, a.objet, 1);
      if (!ok) { dire(`${f.nom} n'a plus de ${ob ? ob.nom : a.objet}.`); return; }
      const effet = ob.combat;
      const cible = effet.releve ? c.heros.find(h => h.id === a.cible && h.pv <= 0) || c.heros.find(h => h.pv <= 0) : cibleDe(c, f, a.cible, true);
      ev.push({ t: 'action', de: f.id, anim: 'sort', effet: 'soin', cibles: cible ? [cible.id] : [] });
      dire(`${f.nom} utilise : ${ob.nom}.`);
      if (!cible) { dire('Sans effet.'); return; }
      appliquerSoutien(c, f, cible, effet, ev);
      return;
    }
    if (a.action === 'talent' || a.action === 'sort') {
      const t = a.action === 'talent' ? jeu.talents[a.talent] : a.sort;
      if (!t) return;
      if (a.action === 'talent') {
        if (f.etats.silence) { dire(`${f.nom} ne peut pas prononcer un mot !`); return; }
        if (f.pm < t.pm) { dire(`${f.nom} n'a pas assez de PM.`); return; }
        f.pm -= t.pm;
      }
      lancer(c, f, t, a.cible, ev);
    }
  }

  // cibles d'un talent selon son type
  function ciblesDe(c, f, t, id) {
    switch (t.cible) {
      case 'ennemis': return vivants(camp(c, f, false));
      case 'allies': return vivants(camp(c, f, true));
      case 'soi': return [f];
      case 'allie': { const x = cibleDe(c, f, id, true); return x ? [x] : []; }
      case 'allie_ko': { const ko = camp(c, f, true).filter(x => x.pv <= 0); return [ko.find(x => x.id === id) || ko[0]].filter(Boolean); }
      default: { const x = cibleDe(c, f, id); return x ? [x] : []; }
    }
  }

  function lancer(c, f, t, id, ev) {
    const dire = texte => ev.push({ t: 'message', texte }), e = t.effet, rng = c.rng;
    const cibles = ciblesDe(c, f, t, id);
    ev.push({ t: 'action', de: f.id, anim: t.anim || (e.type === 'arme' ? 'attaque' : 'sort'), effet: t.visuel || e.element || e.type, cibles: cibles.map(x => x.id) });
    dire(`${f.nom} : ${t.nom} !`);
    if (!cibles.length) { dire('Sans effet.'); return; }
    switch (e.type) {
      case 'arme':
        for (const x of cibles) for (let i = 0; i < (e.coups || 1); i++) if (x.pv > 0) frapper(c, f, x, e.mult || 1, ev, e.critique, e.poison);
        break;
      case 'sort':
        for (const x of cibles) {
          if (x.pv <= 0) continue;
          const mult = x.camp === 'm' ? R().multElement(x.elements, e.element) : 1;
          let n = R().degatsSort(e.puissance, stat(f, 'mag'), rng, mult);
          if (t.cible === 'ennemis' && e.reduction) n = Math.round(n * e.reduction);
          if (mult > 1) dire('C\'est très efficace !'); else if (mult < 1) dire('Ça ne lui fait pas grand-chose.');
          if (x.camp === 'm' && e.element) c.etat.drapeaux['element:' + x.type + ':' + e.element] = mult > 1 ? 'faible' : mult < 1 ? 'resiste' : 'neutre';
          blesser(c, x, reduire(c, x, n), ev, false);
        }
        break;
      case 'soin':
        for (const x of cibles) soigner(c, x, R().soin(e.puissance, stat(f, 'mag')), ev);
        break;
      case 'buff':
        for (const x of cibles) { x.effets[e.stat] = { mult: e.mult, tours: e.tours || 3 }; ev.push({ t: 'etat', a: x.id, etat: 'buff' }); dire(`${e.texte ? x.nom + ' ' + e.texte : x.nom + ' se sent plus fort.'}`); }
        break;
      case 'brise':
        for (const x of cibles) { x.effets.brise = { mult: 1, tours: e.tours || 3 }; ev.push({ t: 'etat', a: x.id, etat: 'brise' }); dire(`L'armure de ${x.nom} se fend !`); }
        break;
      case 'etat':
        for (const x of cibles) {
          if (x.boss && e.etat === 'sommeil') { dire(`${x.nom} n'y prête aucune attention.`); continue; }
          if (rng() < (e.chance || 1)) { x.etats[e.etat] = true; ev.push({ t: 'etat', a: x.id, etat: e.etat }); dire(`${x.nom} ${ETATS[e.etat]}`); }
          else { ev.push({ t: 'rate', a: x.id }); dire(`${x.nom} résiste.`); }
        }
        break;
      case 'protection': c.protecteur = f; dire(`${f.nom} se dresse devant l'équipe.`); break;
      case 'rempart': c.rempart = true; dire('L\'équipe se serre derrière le bouclier !'); break;
      case 'esquive': f.effets.esquive = { mult: 1, tours: 2 }; dire(`${f.nom} guette le prochain coup.`); break;
      case 'purification': for (const x of cibles) { x.etats = {}; ev.push({ t: 'etat', a: x.id, etat: 'gueri' }); dire(`${x.nom} est purifié.`); } break;
      case 'releve': for (const x of cibles) appliquerSoutien(c, f, x, { releve: e.part || .5 }, ev); break;
      case 'vol': {
        const x = cibles[0];
        if (x.def && x.def.vol && !x.vole && rng() < (e.chance || .5)) { x.vole = true; E().donner(c.etat, x.def.vol, 1); dire(`${f.nom} vole : ${(c.jeu.objets[x.def.vol] || {}).nom || x.def.vol} !`); }
        else dire('Rien à voler…');
        break;
      }
      default: dire('…');
    }
  }
  const ETATS = { poison: 'est empoisonné !', sommeil: 's\'endort !', silence: 'ne peut plus parler !' };

  // une attaque à l'arme (esquive, protection, critique, Défense, Rempart)
  function frapper(c, att, cible, mult, ev, critiqueSur = false, poison = 0) {
    const dire = texte => ev.push({ t: 'message', texte }), rng = c.rng;
    if (att.camp === 'm' && cible.camp === 'h' && c.protecteur && c.protecteur !== cible && c.protecteur.pv > 0) {
      dire(`${c.protecteur.nom} protège ${cible.nom} !`); cible = c.protecteur;
    }
    if (cible.effets.esquive) { delete cible.effets.esquive; ev.push({ t: 'rate', a: cible.id }); dire(`${cible.nom} esquive !`); return; }
    if (!critiqueSur && rng() < R().chanceEsquive(stat(cible, 'vit'), stat(att, 'vit'))) { ev.push({ t: 'rate', a: cible.id }); dire(`${cible.nom} esquive !`); return; }
    const classe = att.camp === 'h' ? c.jeu.classes[att.classe] : null;
    const critique = critiqueSur || rng() < R().chanceCritique(classe);
    if (critique) dire('COUP CRITIQUE !');
    const n = R().degatsArme(stat(att, 'for'), stat(cible, 'def'), rng, critique, mult);
    blesser(c, cible, reduire(c, cible, n), ev, critique);
    if (poison && cible.pv > 0 && rng() < poison) { cible.etats.poison = true; ev.push({ t: 'etat', a: cible.id, etat: 'poison' }); dire(`${cible.nom} ${ETATS.poison}`); }
  }

  function reduire(c, cible, n) {
    if (cible.defense) n = Math.ceil(n / 2);
    if (c.rempart && cible.camp === 'h') n = Math.ceil(n / 2);
    return Math.max(1, n);
  }

  function blesser(c, x, n, ev, critique) {
    x.pv = Math.max(0, x.pv - n);
    ev.push({ t: 'degats', a: x.id, n, critique });
    ev.push({ t: 'message', texte: `${x.nom} perd ${n} PV.` });
    if (x.etats.sommeil && x.pv > 0) { delete x.etats.sommeil; ev.push({ t: 'message', texte: `${x.nom} se réveille !` }); }
    if (x.pv <= 0) {
      x.etats = {}; x.effets = {};
      ev.push({ t: 'ko', a: x.id });
      ev.push({ t: 'message', texte: x.camp === 'm' ? `${x.nom} est vaincu !` : `${x.nom} tombe !` });
      if (x.camp === 'm') c.etat.drapeaux['vaincu:' + x.type] = (c.etat.drapeaux['vaincu:' + x.type] || 0) + 1;
    }
  }
  function soigner(c, x, n, ev) {
    if (x.pv <= 0) return;
    const avant = x.pv; x.pv = Math.min(x.pvMax, x.pv + n);
    ev.push({ t: 'soin', a: x.id, n: x.pv - avant });
    ev.push({ t: 'message', texte: `${x.nom} récupère ${x.pv - avant} PV.` });
  }
  // objets et talents de soutien : soin, PM, guérison, relève
  function appliquerSoutien(c, f, x, e, ev) {
    const dire = texte => ev.push({ t: 'message', texte });
    if (e.releve) {
      if (x.pv > 0) { dire(`${x.nom} est déjà debout.`); return; }
      x.pv = Math.max(1, Math.round(x.pvMax * e.releve)); ev.push({ t: 'releve', a: x.id }); dire(`${x.nom} se relève !`); return;
    }
    if (x.pv <= 0) { dire(`${x.nom} est à terre.`); return; }
    if (e.soin) soigner(c, x, e.soin, ev);
    if (e.pm) { const avant = x.pm; x.pm = Math.min(x.pmMax, x.pm + e.pm); ev.push({ t: 'soin', a: x.id, n: 0 }); dire(`${x.nom} récupère ${x.pm - avant} PM.`); }
    if (e.guerit) { if (x.etats[e.guerit]) { delete x.etats[e.guerit]; ev.push({ t: 'etat', a: x.id, etat: 'gueri' }); dire(`${x.nom} est guéri.`); } else dire('Sans effet.'); }
  }

  // ---------- les monstres ----------
  function choisirIA(c, m) {
    if (m.prepare) { const a = m.prepare; m.prepare = null; return { action: 'sort', sort: aSort(a), cible: null }; }
    const actions = m.def.actions || [{ type: 'attaque', poids: 1 }];
    let a;
    if (m.def.cycle) {   // un boss au rythme fixe, que le joueur peut apprendre : cycle = numéros des actions, dans l'ordre
      const etape = m.etape || 0; m.etape = etape + 1;
      a = actions[m.def.cycle[etape % m.def.cycle.length]];
      if (a.pm && m.pm < a.pm) a = actions.find(x => x.type === 'attaque') || a;
    } else {
      const pret = actions.filter(a => !a.pm || m.pm >= a.pm);
      const total = pret.reduce((s, a) => s + (a.poids || 1), 0);
      let r = c.rng() * total; a = pret[0];
      for (const x of pret) { r -= x.poids || 1; if (r < 0) { a = x; break; } }
    }
    if (a.pm) m.pm -= a.pm;
    if (a.prepare) { m.prepare = a; return { action: 'prepare', texte: a.prepare }; }
    if (a.type === 'attaque') return { action: 'attaque', cible: null };
    return { action: 'sort', sort: aSort(a), cible: null };
  }
  // une action spéciale de monstre, sous la forme d'un talent
  function aSort(a) {
    const cible = a.zone ? 'ennemis' : 'ennemi';
    if (a.type === 'charge') return { nom: a.nom, cible, anim: 'attaque', visuel: a.visuel || 'coup', effet: { type: 'arme', mult: a.mult || 1.5 } };
    if (a.type === 'etat') return { nom: a.nom, cible, visuel: a.visuel || a.etat, effet: { type: 'etat', etat: a.etat, chance: a.chance } };
    return { nom: a.nom, cible, visuel: a.visuel || a.element, effet: { type: 'sort', puissance: a.puissance, element: a.element } };
  }

  // ---------- fin du combat ----------
  function terminer(c) {
    const r = { fin: c.fin, xp: 0, ecus: 0, objets: [], niveaux: [] };
    for (const h of c.heros) { h.ref.pv = h.pv; h.ref.pm = h.pm; h.ref.etats = Object.assign({}, h.etats); }
    if (c.fin !== 'victoire') return r;
    for (const m of c.monstres) {
      r.xp += m.def.xp || 0; r.ecus += m.def.ecus || 0;
      for (const b of m.def.butin || []) if (c.rng() < b.chance && E().donner(c.etat, b.objet, 1)) r.objets.push(b.objet);
    }
    c.etat.ecus += r.ecus;
    for (const h of c.heros) if (h.pv > 0) {
      const passages = R().gagnerXp(c.jeu, h.ref, r.xp);
      if (passages.length) r.niveaux.push({ id: h.id, nom: h.nom, passages });
    }
    return r;
  }

  /* Pour les tests et l'équilibrage : une stratégie simple pour les héros (soigner qui en a besoin,
     le meilleur sort selon les faiblesses, se protéger quand un boss prépare un grand coup). */
  function choixAuto(c) {
    const jeu = c.jeu, choix = {}, mons = vivants(c.monstres);
    const charge = mons.some(m => m.prepare);
    const faible = mons.slice().sort((a, b) => a.pv - b.pv)[0];
    for (const h of vivants(c.heros)) {
      const connus = R().talentsConnus(jeu.talents, h.classe, h.ref.niveau).map(id => [id, jeu.talents[id]]).filter(([, t]) => t.pm <= h.pm);
      const de = type => connus.filter(([, t]) => t.effet.type === type);
      const blesse = vivants(c.heros).filter(x => x.pv < x.pvMax * .45).sort((a, b) => a.pv / a.pvMax - b.pv / b.pvMax)[0];
      const ko = c.heros.find(x => x.pv <= 0);
      let a = { action: 'attaque', cible: faible.id };
      const releve = de('releve')[0];
      const soinG = connus.find(([, t]) => t.effet.type === 'soin' && t.cible === 'allies'), soin1 = connus.find(([, t]) => t.effet.type === 'soin' && t.cible === 'allie');
      const rempart = de('rempart')[0];
      if (charge && rempart) a = { action: 'talent', talent: rempart[0] };
      else if (ko && releve) a = { action: 'talent', talent: releve[0], cible: ko.id };
      else if (blesse && (soinG || soin1)) a = vivants(c.heros).filter(x => x.pv < x.pvMax * .5).length >= 2 && soinG ? { action: 'talent', talent: soinG[0] } : { action: 'talent', talent: (soin1 || soinG)[0], cible: blesse.id };
      else if (blesse && h.id === blesse.id && (c.etat.objets.herbe || 0) > 0 && h.pv < h.pvMax * .3) a = { action: 'objet', objet: 'herbe', cible: h.id };
      else if (charge && !rempart) a = { action: 'defense' };
      else {
        // le sort qui fait le plus de dégâts attendus (en comptant les faiblesses), s'il vaut mieux que l'arme
        let mieux = null, score = Math.max(1, stat(h, 'for') - stat(faible, 'def') / 2) * (h.classe === 'LAME' || h.classe === 'RODEUR' ? 1 : .8);
        for (const [id, t] of de('sort')) {
          const cibles = t.cible === 'ennemis' ? mons : [faible];
          const s = cibles.reduce((v, x) => v + (t.effet.puissance + stat(h, 'mag') / 2) * R().multElement(x.elements, t.effet.element), 0);
          if (s > score * 1.2) { score = s; mieux = { action: 'talent', talent: id, cible: faible.id }; }
        }
        for (const [id, t] of de('arme')) {
          const cibles = t.cible === 'ennemis' ? mons : [faible];
          const s = cibles.length * Math.max(1, (t.effet.critique ? stat(h, 'for') * 1.5 : stat(h, 'for') - stat(faible, 'def') / 2) * (t.effet.mult || 1) * (t.effet.coups || 1));
          if (s > score * 1.2 && (c.boss || faible.pv > s * .6)) { score = s; mieux = { action: 'talent', talent: id, cible: faible.id }; }
        }
        if (mieux) a = mieux;
      }
      choix[h.id] = a;
    }
    return choix;
  }
  // un combat entier joué par choixAuto (tests, équilibrage)
  function simuler(jeu, etat, rencontre, rng = Math.random, maxTours = 60) {
    const c = creer(jeu, etat, rencontre, rng);
    while (!c.fin && c.tour < maxTours) resoudre(c, choixAuto(c));
    return { fin: c.fin || 'trop long', tours: c.tour, combat: c };
  }

  M.Combat = { creer, intro, resoudre, terminer, choixAuto, simuler, stat, vivants, nomHeros, fuite };
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? (window.MoteurRPG = window.MoteurRPG || {}) : (globalThis.MoteurRPG = globalThis.MoteurRPG || {}));

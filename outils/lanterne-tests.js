/* La Dernière Lanterne, sous Node (sans navigateur) : le moteur et les données du jeu.
   node outils/lanterne-tests.js        (lancé aussi par verifications.js ; code de sortie 1 en cas d'erreur)
   1. moteur : sauvegardes (auto, main, reprise, défaite), objets plafonnés à 8, équipe en file,
      initiative des combats, pas des monstres, langage des événements ;
   2. données : chaque carte se lit ; sorties, habitants, objets, monstres et déclencheurs sont bien placés ;
      chaque événement, personnage, objet, tuile, sol et décor cité existe ; chaque drapeau lu est écrit quelque part ;
   3. accessibilité : depuis le départ, en marchant et en passant les sorties, on atteint chaque carte,
      chaque coffre, chaque habitant et chaque objet. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
let fail = 0;
const bad = m => { console.log('ÉCHEC ' + m); fail++; };
const ok = m => console.log('ok    ' + m);
const egal = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) bad(`${m} : ${JSON.stringify(a)} au lieu de ${JSON.stringify(b)}`); };

// le moteur (partie testable) et les données, chargés comme dans la page
const ctx = { console };
ctx.window = ctx.globalThis = ctx;   // comme dans la page : window est l'objet global
vm.createContext(ctx);
for (const f of ['moteur-rpg/regles.js', 'moteur-rpg/etat.js', 'moteur-rpg/monde.js', 'moteur-rpg/evenements.js', 'moteur-rpg/combat.js',
  'lanterne/donnees/tuiles.js', 'lanterne/donnees/base.js', 'lanterne/donnees/combat.js', 'lanterne/donnees/cartes.js', 'lanterne/donnees/evenements.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const M = ctx.window.MoteurRPG, J = ctx.window.LANTERNE;
const { Etat, Monde, Evenements, Combat, Regles } = M;
const fixe = (...v) => { let i = 0; return () => v[i++ % v.length]; };   // tirages imposés

(async () => {
  // ---------- 1. le moteur ----------
  const e = Etat.nouvellePartie(J, 'ALDEN');
  egal(e.heros.heros.pvMax, J.classes.LAME.depart.pv, 'PV de départ de la Lame');
  egal(M.Regles.statsDeClasse(J.classes.ARCANISTE, 3).mag, 9 + Math.floor(2.5 * 2), 'MAG de l\'Arcaniste niveau 3');
  egal(Etat.donner(e, 'herbe', 10), 8, 'objets plafonnés à 8');
  egal(Etat.prendre(e, 'herbe', 9), false, 'on ne prend pas plus qu\'on n\'a');
  Etat.prendre(e, 'herbe', 8); egal(e.objets.herbe, undefined, 'objet épuisé retiré');

  const memoire = {}, stock = { getItem: k => (k in memoire ? memoire[k] : null), setItem: (k, v) => { memoire[k] = v; }, removeItem: k => { delete memoire[k]; } };
  let horloge = 1000;
  const S = Etat.Sauvegardes(stock, 'test', () => horloge);
  egal(S.resume(1), null, 'emplacement vide');
  e.lieu = 'A'; S.ecrire(1, 'auto', e); horloge++;
  e.lieu = 'B'; S.ecrire(1, 'main', e); horloge++;
  e.lieu = 'C'; S.ecrire(1, 'reprise', e); horloge++;
  egal(S.pourReprendre(1).lieu, 'C', 'reprise de l\'appli : la copie la plus récente');
  egal(S.pourDefaite(1).lieu, 'B', 'défaite : la plus récente des vraies sauvegardes (jamais la reprise)');
  e.lieu = 'D'; S.ecrire(1, 'auto', e);
  egal(S.lire(1).reprise, null, 'une vraie sauvegarde efface la copie de reprise');
  egal(S.pourDefaite(1).lieu, 'D', 'défaite après une sauvegarde automatique plus récente');
  memoire['test.partie2'] = '{pas du json'; egal(S.resume(2), null, 'sauvegarde illisible ignorée');
  S.effacer(1); egal(S.resume(1), null, 'emplacement effacé');

  egal(Monde.avancerFile([{ x: 1, y: 1 }, { x: 1, y: 2 }], { x: 2, y: 1, dir: 'droite' }).map(p => [p.x, p.y]), [[2, 1], [1, 1]], 'équipe en file');
  egal(Monde.initiative('haut', 'haut', 'heros'), 'heros', 'monstre touché par derrière');
  egal(Monde.initiative('haut', 'bas', 'heros'), 'normal', 'monstre touché de face');
  egal(Monde.initiative('haut', 'haut', 'monstre'), 'monstre', 'chef surpris par derrière');
  const essai = Monde.preparer({ id: 'essai', plan: ['...', '.#.', '...'] }, { '.': { sol: 'a' }, '#': { sol: 'a', bloque: true } });
  let sorti = false;
  for (let i = 0; i < 300; i++) { const p = Monde.pasErrant({ x: 0, y: 0, ox: 0, oy: 0, rayon: 1 }, essai, Math.random); if (p && (p.x > 1 || p.y > 1 || p.x < 0 || p.y < 0)) sorti = true; }
  if (sorti) bad('un monstre s\'éloigne plus loin que son rayon');

  const vu = [];
  const ui = { dire: async (qui, pages) => { vu.push(qui + ':' + pages.join(' / ')); }, choix: async () => 1 };
  const e2 = Etat.nouvellePartie(J, 'BRUNE'), actions = { sauver: () => vu.push('SAUVE') };
  await Evenements.jouer('debut', { etat: e2, jeu: J, ui, actions });
  egal([!!e2.drapeaux.mission, e2.objets.herbe, e2.ecus, e2.chapitre], [true, 2, 30, 'Prologue'], 'événement de début (choix « Pourquoi moi ? »)');
  if (!vu.some(t => t.includes('BRUNE'))) bad('{HEROS} n\'est pas remplacé par le nom');
  if (!vu.some(t => t.includes('soixante-dix hivers'))) bad('la suite du deuxième choix n\'est pas jouée');
  if (!vu.includes('SAUVE')) bad('la sauvegarde automatique du début n\'est pas demandée');
  egal(await Evenements.jouer([{ dire: 'a' }, { stop: true }, { drapeau: 'apres' }], { etat: e2, jeu: J, ui, actions }), false, '{ stop } arrête l\'événement');
  egal(e2.drapeaux.apres, undefined, 'rien après { stop }');
  // combat perdu dans un événement : l'action renvoie false, la suite (victoire, boss caché, sauvegarde) ne joue pas
  egal(await Evenements.jouer([{ combat: ['loup'] }, { drapeau: 'vaincu' }], { etat: e2, jeu: J, ui, actions: { combat: async () => false } }), false, 'un combat perdu arrête l\'événement');
  egal(e2.drapeaux.vaincu, undefined, 'rien après un combat perdu');
  egal(Evenements.condition({ tous: ['mission', { non: 'rien' }, { objet: 'herbe', min: 2 }] }, e2), true, 'conditions composées');
  if (!fail) ok('moteur : sauvegardes, objets, file, initiative, monstres, événements');

  // ---------- 1 bis. règles et combat ----------
  const avantC = fail;
  egal([Regles.degatsArme(20, 12, () => 0), Regles.degatsArme(20, 12, () => .5), Regles.degatsArme(20, 12, () => .999)], [13, 14, 15], 'FOR 20 contre DEF 12 : 13 à 15 (§ 9.2)');
  egal(Regles.degatsArme(3, 40, () => .5), 1, 'une attaque fait au moins 1');
  egal([Regles.degatsSort(10, 16, () => .5), Regles.degatsSort(10, 16, () => .5, 1.5)], [18, 27], 'Étincelle avec MAG 16 : 18, et 27 sur un monstre faible au feu (§ 9.2)');
  egal(Regles.degatsArme(20, 12, () => .5, true), 30, 'coup critique : ignore la Défense, × 1,5');
  egal([Regles.chanceEsquive(10, 10), Regles.chanceEsquive(40, 1)], [.03, .25], 'esquive : 3 %, plafond 25 %');
  egal(Regles.chanceFuite(10, 8), .6, 'fuite : 50 % + 5 % par point de VIT');
  const hx = Regles.creerHeros(J, 'heros', 1);
  const pass = Regles.gagnerXp(J, hx, 8 + 32);
  egal([hx.niveau, hx.xp, pass.length, pass[0].apres.for - pass[0].avant.for], [3, 0, 2, 2], 'expérience : 8 × niveau² par niveau, gains fixes');
  egal(Regles.talentsConnus(J.talents, 'LAME', 4), ['coup_puissant', 'cri'], 'talents connus de la Lame au niveau 4');
  egal([hx.pv, hx.pm], [hx.pvMax, hx.pmMax], 'un passage de niveau remplit PV et PM');
  egal(Regles.statsEquipees(J, Regles.creerHeros(J, 'heros', 1)).for, J.classes.LAME.depart.for + J.objets.epee_courte.equip.for, 'l\'épée courte compte dans la Force');
  const ee = Etat.nouvellePartie(J, 'X'); Etat.donner(ee, 'epee_longue', 1);
  egal([Etat.equiper(ee, J, 'heros', 'arme', 'epee_longue'), ee.heros.heros.equipement.arme, ee.objets.epee_courte, ee.objets.epee_longue], [true, 'epee_longue', 1, undefined], 'changer d\'arme : l\'ancienne revient dans le sac');
  egal(Etat.equiper(ee, J, 'heros', 'arme', 'baton'), false, 'la Lame ne prend pas le bâton de l\'Arcaniste');
  const vieille = { v: 1, nom: 'V', equipe: ['heros'], heros: { heros: { id: 'heros', classe: 'LAME', niveau: 1 } }, objets: {}, drapeaux: {} };
  egal(Etat.migrer(vieille, J).heros.heros.equipement.arme, 'epee_courte', 'une partie de la version 1 reçoit son équipement de départ');

  // un combat réglé à la main : Défense, Protection, fuite, fin
  const ec = Etat.nouvellePartie(J, 'TEST'); ec.equipe = ['heros', 'eloi'];
  for (const id of ec.equipe) Object.assign(ec.heros[id], Regles.creerHeros(J, id, 8));
  let c = Combat.creer(J, ec, { monstres: ['loup', 'loup'] }, fixe(.5));
  egal(c.monstres.map(m => m.nom), ['Loup gris A', 'Loup gris B'], 'monstres de même nom : A, B');
  let ev = Combat.resoudre(c, { heros: { action: 'talent', talent: 'protection' }, eloi: { action: 'defense' } });
  if (!ev.some(x => x.t === 'message' && x.texte.includes('protège Eloi'))) bad('Protection : les coups sur Eloi vont à la Lame');
  if (c.heros[1].pv !== c.heros[1].pvMax) bad('Protection : Eloi ne doit rien recevoir');
  c = Combat.creer(J, ec, { monstres: ['roi_aulnes'] }, fixe(.01));
  ev = Combat.resoudre(c, { fuite: true });
  if (!ev.some(x => x.texte === 'Impossible de fuir !') || c.fin) bad('on ne fuit pas un boss');
  // le Roi des aulnes suit son cycle : coup, coup, Souffle, racines (préparation), Étreinte
  c = Combat.creer(J, ec, { monstres: ['roi_aulnes'] }, fixe(.5));
  const rythme = [];
  for (let t = 0; t < 5 && !c.fin; t++) { const evs = Combat.resoudre(c, { [c.heros[0].id]: { action: 'defense' } }); rythme.push(evs.some(x => /plonge ses racines/.test(x.texte || '')) ? 'racines' : evs.some(x => /Étreinte/.test(x.texte || '')) ? 'etreinte' : evs.some(x => /Souffle/.test(x.texte || '')) ? 'souffle' : 'coup'); }
  egal(rythme.join(' '), 'coup coup souffle racines etreinte', 'le Roi des aulnes suit son cycle');
  c = Combat.creer(J, ec, { monstres: ['feu_follet'], fuite: false }, fixe(.01));
  ev = Combat.resoudre(c, { fuite: true });
  if (!ev.some(x => x.texte === 'Impossible de fuir !') || c.fin) bad('on ne fuit pas un combat marqué fuite: false');
  c = Combat.creer(J, ec, { monstres: ['feu_follet'] }, fixe(.01));
  ev = Combat.resoudre(c, { fuite: true }); egal(c.fin, 'fuite', 'fuite réussie');
  c = Combat.creer(J, ec, { monstres: ['feu_follet'], initiative: 'heros' }, fixe(.5));
  ev = Combat.resoudre(c, { heros: { action: 'attaque', cible: 'm0' }, eloi: { action: 'attaque', cible: 'm0' } });
  if (ev.some(x => x.t === 'action' && x.de === 'm0')) bad('surprise : le monstre ne joue pas au premier tour');
  if (!c.fin) Combat.resoudre(c, { heros: { action: 'attaque', cible: 'm0' }, eloi: { action: 'attaque', cible: 'm0' } });
  egal(c.fin, 'victoire', 'le feu follet tombe en deux tours');
  const ecusAvant = ec.ecus, r = Combat.terminer(c);
  egal([r.xp, ec.ecus - ecusAvant, ec.heros.heros.pv === c.heros[0].pv], [J.monstres.feu_follet.xp, J.monstres.feu_follet.ecus, true], 'fin du combat : expérience, écus, PV écrits dans la partie');
  // l'herbe en combat
  ec.objets = { herbe: 1 }; ec.heros.eloi.pv = 5;
  c = Combat.creer(J, ec, { monstres: ['feu_follet'], initiative: 'heros' }, fixe(.5));
  Combat.resoudre(c, { heros: { action: 'objet', objet: 'herbe', cible: 'eloi' }, eloi: { action: 'defense' } });
  egal([c.heros[1].pv, ec.objets.herbe], [Math.min(c.heros[1].pvMax, 55), undefined], 'l\'herbe rend 50 PV et disparaît du sac');

  // équilibrage : les mêmes cas que outils/lanterne-combats.js, sur moins de combats
  const LC = require('./lanterne-combats.js');
  for (const cas of LC.CAS) {
    const x = LC.jouerCas(M, J, cas, 150, 3), cb = cas.cible;
    if (x.victoire < cb.victoire - .06 || x.tours < cb.tours[0] - .5 || x.tours > cb.tours[1] + .5)
      bad(`équilibrage : ${cas.nom} : ${Math.round(x.victoire * 100)} %, ${x.tours.toFixed(1)} tours (voir outils/lanterne-combats.js)`);
  }
  if (fail === avantC) ok(`règles et combats : formules du § 9.2, niveaux, équipement, Protection, fuite, surprise, objets ; équilibrage des ${LC.CAS.length} cas`);

  // ---------- 2. les données ----------
  const avant = fail;
  const tuile = n => !!J.tuiles[n], perso = n => tuile(n + '_c') || tuile(n);
  const cartes = {};
  for (const id in J.cartes) {
    try { cartes[id] = Monde.preparer(Object.assign({ id }, J.cartes[id]), J.legende); } catch (err) { bad(err.message); }
  }
  const evenementsCites = [], quiCites = [], objetsCites = [], drapeauxLus = new Set(), drapeauxEcrits = new Set(['coffre:', 'pnj:', 'ouvert:']);
  for (const d of Object.values(J.cartes)) for (const o of d.objets || []) { if (o.drapeau) drapeauxEcrits.add(o.drapeau); if (o.ouvertSi) Evenements.drapeauxLus(o.ouvertSi).forEach(f => drapeauxLus.add(f)); }
  const citer = (ev, ou) => { if (typeof ev === 'string') { if (!J.evenements[ev]) bad(`${ou} : événement inconnu « ${ev} »`); } else if (Array.isArray(ev)) evenementsCites.push([ev, ou]); };
  for (const id in cartes) {
    const c = cartes[id], d = J.cartes[id], libre = (x, y) => x >= 0 && y >= 0 && x < c.l && y < c.h && !c.bloque[y][x];
    if (d.musique && !J.musiques[d.musique]) bad(`${id} : musique inconnue ${d.musique}`);
    if (d.entree) citer(d.entree, id + ' (entrée)');
    for (const s of d.sorties || []) {
      const cible = cartes[s.vers];
      if (!cible) { bad(`${id} : sortie vers une carte inconnue ${s.vers}`); continue; }
      const [ax, ay] = s.a;
      if (ax < 0 || ay < 0 || ax >= cible.l || ay >= cible.h || cible.bloque[ay][ax]) bad(`${id} : la sortie vers ${s.vers} arrive sur une case bloquée (${ax}, ${ay})`);
      if (Monde.sortieEn(cible, ax, ay)) bad(`${id} : la sortie vers ${s.vers} arrive sur une autre sortie (${ax}, ${ay})`);
      if (s.refus) citer(s.refus, `${id} (refus de sortie)`);
      if (s.si) Evenements.drapeauxLus(s.si).forEach(f => drapeauxLus.add(f));
    }
    for (const [px, py] of c.portes) if (!Monde.sortieEn(c, px, py) && !Monde.declencheurEn(c, px, py)) bad(`${id} : la porte (${px}, ${py}) ne mène nulle part`);
    for (const p of d.pnj || []) {
      if (!perso(p.perso)) bad(`${id} : personnage inconnu ${p.perso}`);
      if (!libre(p.x, p.y)) bad(`${id} : l'habitant ${p.id} est sur une case bloquée`);
      if (p.evenement) citer(p.evenement, `${id}/${p.id}`);
      if (p.si) Evenements.drapeauxLus(p.si).forEach(f => drapeauxLus.add(f));
    }
    const coffres = new Set();
    for (const o of d.objets || []) {
      if (o.x < 0 || o.y < 0 || o.x >= c.l || o.y >= c.h) { bad(`${id} : objet hors de la carte`); continue; }
      if (!J.style.objets[o.type]) bad(`${id} : type d'objet inconnu ${o.type}`);
      const t = o.tuile || (J.style.objets[o.type] || {}).tuile; if (t && !tuile(t)) bad(`${id} : tuile inconnue ${t}`);
      for (const p of (J.style.objets[o.type] || {}).pieces || []) for (const t of [p.dessus, p.face, p.cote].filter(Boolean)) if (!tuile(t)) bad(`objet ${o.type} : tuile inconnue ${t}`);
      if (o.evenement) citer(o.evenement, `${id} (objet ${o.type})`);
      if (o.type === 'coffre') {
        if (!o.id || coffres.has(o.id)) bad(`${id} : coffre sans nom ou en double`); coffres.add(o.id);
        if (!o.evenement && (!o.contenu || (!o.contenu.ecus && !J.objets[o.contenu.objet]))) bad(`${id} : contenu du coffre ${o.id} inconnu`);
      }
      if (o.type === 'panneau' && !o.texte && !o.evenement) bad(`${id} : panneau sans texte`);
    }
    for (const m of d.monstres || []) {
      const t = J.monstres[m.type];
      if (!t || !tuile(t.tuile)) bad(`${id} : monstre inconnu ${m.type}`);
      if (!libre(m.x, m.y)) bad(`${id} : monstre ${m.type} sur une case bloquée`);
    }
    for (const dc of d.declencheurs || []) { citer(dc.evenement, `${id} (déclencheur)`); if (dc.si) Evenements.drapeauxLus(dc.si).forEach(f => drapeauxLus.add(f)); }
    for (const ligne of c.cases) for (const k of ligne) {
      if (!(k.sol in J.style.sols)) bad(`${id} : sol inconnu ${k.sol}`);
      if (k.decor && !J.style.decors[k.decor]) bad(`${id} : décor inconnu ${k.decor}`);
    }
  }
  for (const [id, c] of Object.entries(J.cartes)) for (const o of c.ornements || []) {
    const s = (J.style.ornements || {})[o.type];
    if (!s) bad(`${id} : ornement inconnu ${o.type}`); else if (!tuile(o.tuile || s.tuile)) bad(`${id} : tuile inconnue ${o.tuile || s.tuile}`);
  }
  for (const [nom, d] of Object.entries(J.style.decors)) for (const t of [].concat(d.tuiles || [], d.tuile || [], d.alterne || [], ...(d.pieces || []).map(p => [p.dessus, p.face, p.cote].filter(Boolean)))) if (!tuile(t)) bad(`décor ${nom} : tuile inconnue ${t}`);
  for (const [nom, s] of Object.entries(J.style.sols)) if (s) for (const t of [].concat(s.tuiles || [], s.semis ? s.semis.tuiles : [], s.bordure ? Object.values(s.bordure) : [])) if (!tuile(t)) bad(`sol ${nom} : tuile inconnue ${t}`);
  for (const id in J.heros) {
    if (!perso(J.heros[id].perso)) bad(`héros ${id} : personnage inconnu`);
    for (const [emp, o] of Object.entries(J.heros[id].equipement || {})) if (!J.objets[o] || J.objets[o].equip.emplacement !== emp || !Regles.peutPorter(J, { classe: J.heros[id].classe }, o)) bad(`héros ${id} : équipement de départ ${o} impossible`);
  }
  for (const [id, t] of Object.entries(J.talents)) {
    if (!J.classes[t.classe]) bad(`talent ${id} : classe inconnue`);
    if (!['ennemi', 'ennemis', 'allie', 'allies', 'soi', 'allie_ko'].includes(t.cible)) bad(`talent ${id} : cible inconnue ${t.cible}`);
  }
  for (const c0 of Object.keys(J.classes)) if (Regles.talentsConnus(J.talents, c0, 30).length < 6) bad(`classe ${c0} : moins de 6 talents`);
  for (const [id, m] of Object.entries(J.monstres)) {
    if (!tuile(m.tuile)) bad(`monstre ${id} : tuile inconnue ${m.tuile}`);
    for (const g of m.groupes || []) for (const t of g) if (!J.monstres[t]) bad(`monstre ${id} : groupe avec un monstre inconnu ${t}`);
    for (const b of (m.butin || []).map(b => b.objet).concat(m.vol || [])) if (!J.objets[b]) bad(`monstre ${id} : objet inconnu ${b}`);
    if (!(m.pv > 0) || !(m.xp >= 0)) bad(`monstre ${id} : PV ou expérience manquants`);
  }
  for (const [id, o] of Object.entries(J.objets)) if (o.equip && o.equip.classes) for (const c0 of o.equip.classes) if (!J.classes[c0]) bad(`objet ${id} : classe inconnue ${c0}`);
  for (const id in J.persos) if (!perso(J.persos[id].perso)) bad(`dialogues : personnage inconnu ${J.persos[id].perso}`);
  for (const f of Object.values(J.effets).concat(Object.values(J.musiques))) if (!fs.existsSync(path.join(ROOT, 'lanterne', f))) bad(`son absent : lanterne/${f}`);
  if (!cartes[J.depart.carte] || cartes[J.depart.carte].bloque[J.depart.y][J.depart.x]) bad('départ sur une carte inconnue ou une case bloquée');

  // chaque commande de chaque événement
  for (const [nom, script] of Object.entries(J.evenements)) {
    Evenements.parcourir(script, c => {
      if (c.evenement) citer(c.evenement, `événement ${nom}`);
      if (c.qui && !J.persos[c.qui]) bad(`événement ${nom} : personnage qui parle inconnu ${c.qui}`);
      for (const k of ['donner', 'prendre']) if (c[k] && !J.objets[c[k]]) bad(`événement ${nom} : objet inconnu ${c[k]}`);
      if (c.teleporter && !cartes[c.teleporter]) bad(`événement ${nom} : carte inconnue ${c.teleporter}`);
      if (c.drapeau !== undefined && !('si' in c)) drapeauxEcrits.add(c.drapeau);
      if (c.si !== undefined) Evenements.drapeauxLus(c.si).forEach(f => drapeauxLus.add(f));
      if (c.son && !J.effets[c.son]) bad(`événement ${nom} : son inconnu ${c.son}`);
      if (c.musique && !J.musiques[c.musique]) bad(`événement ${nom} : musique inconnue ${c.musique}`);
      if (c.pnj && !Object.values(J.cartes).some(d => (d.pnj || []).some(p => p.id === c.pnj))) bad(`événement ${nom} : habitant inconnu ${c.pnj}`);
    });
  }
  for (const f of drapeauxLus) if (!drapeauxEcrits.has(f) && ![...drapeauxEcrits].some(p => p.endsWith(':') && f.startsWith(p)))
    if (!f.startsWith('oubliee:')) bad(`le drapeau « ${f} » est lu mais jamais écrit`);
  if (fail === avant) ok(`données : ${Object.keys(cartes).length} cartes, ${Object.keys(J.evenements).length} événements, ${drapeauxLus.size} drapeaux lus, tout est cohérent`);

  // ---------- 3. accessibilité ----------
  /* Un solveur optimiste : on explore depuis le départ ; tout ce qu'on peut atteindre est utilisé (coffres, leviers,
     habitants et déclencheurs dont l'événement donne des drapeaux ou des objets, portes avec la clé, nappes avec l'outil),
     puis on recommence avec les nouveaux drapeaux, jusqu'à ne plus rien gagner. */
  const avant3 = fail, flags = {}, sac = {}, utilise = new Set();
  const etatTest = () => ({ drapeaux: flags, objets: sac, ecus: 1e6, equipe: Object.keys(J.heros), nom: 'X' });
  const test = cond => Evenements.condition(cond, etatTest());
  const donnerScript = (script, vus = new Set()) => {
    if (typeof script === 'string') { if (vus.has(script)) return; vus.add(script); script = J.evenements[script]; }
    Evenements.parcourir(script, c => {
      if (c.drapeau !== undefined && c.valeur !== false && !('si' in c)) flags[c.drapeau] = true;
      if (c.donner) sac[c.donner] = (sac[c.donner] || 0) + (c.n || 1);
      if (c.prendre) sac[c.prendre] = Math.max(0, (sac[c.prendre] || 0) - (c.n || 1));
      if (c.evenement) donnerScript(c.evenement, vus);
    });
  };
  let atteint = {};
  for (let tour = 0; tour < 30; tour++) {
    const cartesT = {};
    for (const id in J.cartes) cartesT[id] = Monde.preparer(Object.assign({ id }, J.cartes[id]), J.legende, test);
    atteint = {};
    const file = [[J.depart.carte, J.depart.x, J.depart.y]], visites = new Set();
    while (file.length) {
      const [id, x, y] = file.pop(), k = `${id}:${x},${y}`;
      if (visites.has(k)) continue; visites.add(k);
      (atteint[id] = atteint[id] || new Set()).add(x + ',' + y);
      const c = cartesT[id], s = Monde.sortieEn(c, x, y);
      if (s && (!s.si || test(s.si))) { file.push([s.vers, s.a[0], s.a[1]]); continue; }
      for (const dir in Monde.DIRS) { const [nx, ny] = Monde.devant(x, y, dir); if (!Monde.estBloque(c, nx, ny)) file.push([id, nx, ny]); }
    }
    const pres = (id, x, y) => Object.values(Monde.DIRS).some(([dx, dy]) => atteint[id] && atteint[id].has((x + dx) + ',' + (y + dy)));
    const avantFlags = JSON.stringify([flags, sac]);
    for (const id in atteint) {
      const d = J.cartes[id];
      if (d.entree && !utilise.has('e:' + id)) { utilise.add('e:' + id); donnerScript(d.entree); }
      for (const o of d.objets || []) {
        if (!pres(id, o.x, o.y)) continue;
        const cle = `o:${id}:${o.x},${o.y}`;
        if (o.type === 'coffre' && !utilise.has(cle)) { utilise.add(cle); flags['coffre:' + o.id] = true; if (o.contenu && o.contenu.objet) sac[o.contenu.objet] = (sac[o.contenu.objet] || 0) + (o.contenu.n || 1); }
        if (o.evenement && !utilise.has(cle + 'e')) { utilise.add(cle + 'e'); donnerScript(o.evenement); }
        if (o.type === 'levier') flags[o.drapeau] = true;
        if (o.type === 'porte_cle' && !flags['ouvert:' + o.id] && (sac[o.cle] || 0) > 0) { sac[o.cle]--; flags['ouvert:' + o.id] = true; }
        if (o.type === 'nappe' && flags['outil:' + o.outil]) flags['ouvert:' + o.id] = true;
      }
      for (const p of d.pnj || []) if (p.evenement && !p.cache && (!p.si || test(p.si)) && pres(id, p.x, p.y) && !utilise.has('p:' + p.id)) { utilise.add('p:' + p.id); donnerScript(p.evenement); }
      for (const dc of d.declencheurs || []) {
        const xs = [].concat(dc.x), ys = [].concat(dc.y);
        let ok = false;
        for (let x = xs[0]; x <= xs[xs.length - 1]; x++) for (let y = ys[0]; y <= ys[ys.length - 1]; y++) if (atteint[id].has(x + ',' + y)) ok = true;
        if (ok && !utilise.has('d:' + id + dc.evenement)) { utilise.add('d:' + id + dc.evenement); donnerScript(dc.evenement); }
      }
    }
    if (JSON.stringify([flags, sac]) === avantFlags) break;
  }
  const voisinAtteint = (id, x, y) => Object.values(Monde.DIRS).some(([dx, dy]) => atteint[id] && atteint[id].has((x + dx) + ',' + (y + dy)));
  for (const id in cartes) {
    if (!atteint[id]) { bad(`carte jamais atteinte : ${id}`); continue; }
    const d = J.cartes[id];
    for (const o of d.objets || []) if (!voisinAtteint(id, o.x, o.y)) bad(`${id} : on ne peut pas atteindre l'objet ${o.type} (${o.x}, ${o.y})`);
    for (const p of d.pnj || []) if (p.evenement && !p.cache && !voisinAtteint(id, p.x, p.y) && !atteint[id].has(p.x + ',' + p.y)) bad(`${id} : on ne peut pas parler à ${p.id}`);
    for (const dc of d.declencheurs || []) {
      const xs = [].concat(dc.x), ys = [].concat(dc.y), cases = [];
      for (let x = xs[0]; x <= xs[xs.length - 1]; x++) for (let y = ys[0]; y <= ys[ys.length - 1]; y++) cases.push(x + ',' + y);
      if (!cases.some(k => atteint[id].has(k))) bad(`${id} : déclencheur ${dc.evenement} hors d'atteinte`);
    }
  }
  for (const f of J.fin || []) if (!flags[f]) bad(`la fin de cette version n'est pas atteignable : drapeau ${f} jamais obtenu`);
  if (fail === avant3) ok(`accessibilité : les ${Object.keys(cartes).length} cartes, leurs objets, habitants et déclencheurs sont atteignables depuis le départ (clés, leviers et outils compris)${(J.fin || []).length ? ', jusqu\'à ' + J.fin.join(', ') : ''}`);

  process.exit(fail ? 1 : 0);
})().catch(err => { console.log('ÉCHEC ' + (err.stack || err)); process.exit(1); });

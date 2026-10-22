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
for (const f of ['moteur-rpg/regles.js', 'moteur-rpg/etat.js', 'moteur-rpg/monde.js', 'moteur-rpg/evenements.js',
  'lanterne/donnees/tuiles.js', 'lanterne/donnees/base.js', 'lanterne/donnees/cartes.js', 'lanterne/donnees/evenements.js'])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const M = ctx.window.MoteurRPG, J = ctx.window.LANTERNE;
const { Etat, Monde, Evenements } = M;

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
  egal(Evenements.condition({ tous: ['mission', { non: 'rien' }, { objet: 'herbe', min: 2 }] }, e2), true, 'conditions composées');
  if (!fail) ok('moteur : sauvegardes, objets, file, initiative, monstres, événements');

  // ---------- 2. les données ----------
  const avant = fail;
  const tuile = n => !!J.tuiles[n], perso = n => tuile(n + '_c') || tuile(n);
  const cartes = {};
  for (const id in J.cartes) {
    try { cartes[id] = Monde.preparer(Object.assign({ id }, J.cartes[id]), J.legende); } catch (err) { bad(err.message); }
  }
  const evenementsCites = [], quiCites = [], objetsCites = [], drapeauxLus = new Set(), drapeauxEcrits = new Set(['coffre:', 'pnj:']);
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
      if (o.evenement) citer(o.evenement, `${id} (objet ${o.type})`);
      if (o.type === 'coffre') {
        if (!o.id || coffres.has(o.id)) bad(`${id} : coffre sans nom ou en double`); coffres.add(o.id);
        if (!o.contenu || (!o.contenu.ecus && !J.objets[o.contenu.objet])) bad(`${id} : contenu du coffre ${o.id} inconnu`);
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
  for (const [nom, d] of Object.entries(J.style.decors)) for (const t of [].concat(d.tuiles || [], d.tuile || [], d.alterne || [])) if (!tuile(t)) bad(`décor ${nom} : tuile inconnue ${t}`);
  for (const [nom, s] of Object.entries(J.style.sols)) if (s) for (const t of [].concat(s.tuiles || [], s.semis ? s.semis.tuiles : [], s.bordure ? Object.values(s.bordure) : [])) if (!tuile(t)) bad(`sol ${nom} : tuile inconnue ${t}`);
  for (const id in J.heros) if (!perso(J.heros[id].perso)) bad(`héros ${id} : personnage inconnu`);
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
  const avant3 = fail, atteint = {}, file = [[J.depart.carte, J.depart.x, J.depart.y]];
  const cle = (c, x, y) => `${c}:${x},${y}`;
  const visites = new Set();
  while (file.length) {
    const [id, x, y] = file.pop(), k = cle(id, x, y);
    if (visites.has(k)) continue; visites.add(k);
    (atteint[id] = atteint[id] || new Set()).add(x + ',' + y);
    const c = cartes[id], s = Monde.sortieEn(c, x, y);
    if (s) { file.push([s.vers, s.a[0], s.a[1]]); continue; }
    for (const dir in Monde.DIRS) { const [nx, ny] = Monde.devant(x, y, dir); if (!Monde.estBloque(c, nx, ny)) file.push([id, nx, ny]); }
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
  if (fail === avant3) ok(`accessibilité : les ${Object.keys(cartes).length} cartes, leurs objets, habitants et déclencheurs sont atteignables depuis le départ`);

  process.exit(fail ? 1 : 0);
})().catch(err => { console.log('ÉCHEC ' + (err.stack || err)); process.exit(1); });

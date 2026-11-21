/* Écurie miniature : les règles de la gestion (pur calcul : aussi sous Node).
   État de la partie E (sauvé dans localStorage « ecurie.partie ») ; Regles.preparer(E) fabrique la grille du GP,
   Regles.resultats(E, C, prep) applique la course terminée (points, argent, fans, usure, fin de saison). */
(function (W) {
  const VOITURES = [ // modèle, nom, chevaux, prix, notes [vitesse, accélération, adhérence, fiabilité]
    {m: 'kenney-hatchback-sports', nom: 'KAZE PICO R', ch: 140, prix: 18500, n: [3, 4, 5, 8]},
    {m: 'rgsdev-roadster', nom: 'KAZE LIBRE', ch: 150, prix: 26000, n: [4, 4, 6, 7]},
    {m: 'cosmo-rally', nom: 'NORD 4X', ch: 260, prix: 34000, n: [5, 6, 6, 8]},
    {m: 'kenney-sedan-sports', nom: 'KITA GT', ch: 285, prix: 39000, n: [5, 6, 7, 7]},
    {m: 'cosmo-italia', nom: 'BRAVA ITALIA', ch: 296, prix: 42000, n: [6, 6, 6, 7]},
    {m: 'rgsdev-sports', nom: 'RG SPORT', ch: 300, prix: 46000, n: [6, 7, 7, 6]},
    {m: 'cosmo-kamaro', nom: 'STROM V8', ch: 430, prix: 58000, n: [8, 7, 6, 6]},
    {m: 'rgsdev-muscle-2', nom: 'STROM V8 R', ch: 480, prix: 71000, n: [8, 8, 7, 5]},
    {m: 'cosmo-ghini', nom: 'VENTO R', ch: 600, prix: 175000, n: [10, 9, 8, 5]},
    {m: 'cosmo-fenyr', nom: 'FENYR', ch: 620, prix: 190000, n: [10, 9, 8, 5]},
    {m: 'cosmo-lamb', nom: 'TORO SV', ch: 640, prix: 215000, n: [10, 9, 9, 5]},
    {m: 'kenney-race', nom: 'PROTO K1', ch: 680, prix: 240000, n: [10, 10, 10, 4]}];
  const PIECES = [ // clé, nom, prix, effet sur les notes, chevaux en plus
    {k: 'moteur', nom: 'MOTEUR PREPARE', prix: 9500, e: [1, 1, 0, -1], ch: 20, d: '+20 ch · +1 vitesse · +1 accélération · −1 fiabilité'},
    {k: 'turbo', nom: 'TURBO', prix: 14000, e: [1, 2, 0, -1], ch: 45, d: '+45 ch · +1 vitesse · +2 accélération · −1 fiabilité'},
    {k: 'aileron', nom: 'AILERON', prix: 4800, e: [-1, 0, 2, 0], ch: 0, d: '+2 adhérence · −1 vitesse'},
    {k: 'pneus', nom: 'PNEUS SPORT', prix: 2600, e: [0, 0, 1, 0], ch: 0, d: '+1 adhérence · durent 4 grands prix'},
    {k: 'freins', nom: 'FREINS CARBONE', prix: 6200, e: [0, 0, 1, 1], ch: 0, d: '+1 adhérence · +1 fiabilité'},
    {k: 'allegement', nom: 'ALLEGEMENT', prix: 8800, e: [0, 1, 1, -1], ch: 0, d: '−80 kg · +1 accélération · +1 adhérence · −1 fiabilité'}];
  const DIVISIONS = [{nom: 'Coupe 300 ch', ch: 300, x: 1}, {nom: 'Trophée 500 ch', ch: 500, x: 2.5}, {nom: 'Grand Prix illimité', ch: 1e9, x: 6}];
  const RIVAUX = [ // par division : nom, couleur, modèle, notes de la voiture, notes du pilote [talent, constance, agressivité]
    [['HAYASHI', '#e8c43a', 'rgsdev-sports', [6, 7, 7, 6], [8, 7, 5]], ['RUIZ', '#7a2a9a', 'cosmo-coupe', [6, 6, 6, 7], [7, 6, 8]],
     ['NOVAK', '#18b4b0', 'kenney-sedan-sports', [6, 6, 7, 7], [8, 7, 6]], ['KOWALSKI', '#1f8a4c', 'rgsdev-hatchback', [5, 6, 7, 8], [6, 8, 5]],
     ['DUMONT', '#f4f4f4', 'cosmo-rally', [6, 6, 6, 8], [7, 7, 6]], ['TANAKA', '#2456c8', 'kenney-hatchback-sports', [5, 6, 6, 8], [7, 6, 7]]],
    [['HAYASHI', '#e8c43a', 'rgsdev-muscle', [8, 8, 7, 6], [7, 7, 5]], ['RUIZ', '#7a2a9a', 'cosmo-kamaro', [8, 8, 6, 6], [6, 6, 8]],
     ['NOVAK', '#18b4b0', 'rgsdev-muscle-2', [8, 8, 7, 5], [8, 7, 5]], ['VOGEL', '#1f8a4c', 'cosmo-mobil', [7, 7, 7, 6], [7, 8, 4]],
     ['DUMONT', '#f4f4f4', 'rgsdev-police-sports', [7, 8, 8, 6], [7, 7, 6]], ['ESPOSITO', '#2456c8', 'cosmo-italia', [8, 7, 7, 6], [7, 6, 7]]],
    [['HAYASHI', '#e8c43a', 'cosmo-ghini', [10, 9, 8, 5], [8, 7, 5]], ['OKONKWO', '#7a2a9a', 'kenney-race-future', [10, 10, 9, 4], [8, 6, 8]],
     ['NOVAK', '#18b4b0', 'cosmo-lamb', [10, 9, 9, 5], [9, 6, 5]], ['RUIZ', '#c8262c', 'kenney-race', [10, 10, 10, 4], [7, 6, 8]],
     ['LINDBERG', '#f4f4f4', 'cosmo-fenyr', [10, 9, 8, 5], [7, 9, 3]], ['ESPOSITO', '#2456c8', 'rgsdev-muscle-2', [9, 9, 6, 5], [8, 7, 7]]]];
  const LIBRES = [
    {nom: 'T. OKAFOR', age: 27, n: [8, 6, 8], salaire: 5000, note: 'Rapide mais sanguin', c: '#2456c8'},
    {nom: 'I. LINDQVIST', age: 34, n: [6, 9, 3], salaire: 3500, note: 'Régulier, finit toujours', c: '#f4f4f4'},
    {nom: 'M. SOUZA', age: 19, n: [5, 5, 7], salaire: 1500, note: 'Jeune espoir, apprend vite', c: '#1f8a4c'},
    {nom: 'A. FERRAND', age: 22, n: [6, 6, 6], salaire: 2500, note: 'Solide partout', c: '#e8c43a'},
    {nom: 'G. MORETTI', age: 31, n: [8, 7, 7], salaire: 7000, note: 'Un vrai champion', c: '#7a2a9a'},
    {nom: 'K. ADEYEMI', age: 20, n: [5, 7, 5], salaire: 1800, note: 'Calme, apprend vite', c: '#18b4b0'}];
  const SPONSORS = [
    {nom: 'LAIT DU MONT', coul: '#2f7a4a', gain: 3000, niv: 1, obj: 'Prime de 2 000 $ si un pilote finit dans les 5 premiers', cond: 'top5'},
    {nom: 'PNEUS ROCCA', coul: '#c8262c', gain: 1500, niv: 1, obj: 'Pneus sport offerts', cond: 'pneus'},
    {nom: 'MECA PLUS', coul: '#5a6a7a', gain: 4500, niv: 1, obj: 'Rompu si une voiture abandonne', cond: 'arrivee'},
    {nom: 'VOLTAGE', coul: '#24406e', gain: 9000, niv: 2, obj: 'Exige un podium tous les 3 grands prix', cond: 'podium3'},
    {nom: 'ORBITAL TV', coul: '#d0a020', gain: 16000, niv: 3, obj: 'Exige une victoire tous les 4 grands prix', cond: 'victoire4'}];
  const ACTIVITES = [
    {k: 'essais', n: 'ESSAIS', e: '+1 % de vitesse et d\'adhérence au grand prix (3 jours au plus)'},
    {k: 'atelier', n: 'ATELIER', e: '+8 % d\'état aux voitures · réparations plus rapides'},
    {k: 'simu', n: 'SIMULATEUR', e: 'Les pilotes progressent en talent (lentement)'},
    {k: 'repos', n: 'REPOS', e: '+10 de forme (essais, simulateur et médias fatiguent)'},
    {k: 'medias', n: 'MÉDIAS', e: '+1 000 $ · +60 fans'}];
  const REVENUS = [
    {k: 'boutique', nom: 'BOUTIQUE DE GOODIES', seuil: 1000, prix: 15000, par: 2, tous: 1, quand: 'par semaine', d: 'Casquettes, t-shirts, miniatures'},
    {k: 'convention', nom: 'CONVENTION', seuil: 5000, prix: 40000, par: 6, tous: 4, quand: 'tous les 4 grands prix', d: 'Un week-end de fête avec les fans'},
    {k: 'club', nom: 'FAN CLUB', seuil: 10000, prix: 80000, par: 1.5, tous: 1, quand: 'par semaine', d: 'Abonnements, visites du garage'}];
  const POINTS = [10, 8, 6, 5, 4, 3, 2, 1], PRIX = [8000, 6000, 4500, 3500, 2800, 2200, 1600, 1200];
  const NIVEAUX = [0, 40, 120, 250], PLACES = [2, 3, 4, 4], GP_SAISON = 8, ENTRETIEN = 500, TEINTE = '#ff6a13';
  const occasionsRnd = Math.random;

  function nouvellePartie() {
    const E = {v: 1, argent: 30000, niveau: 1, rep: 0, fans: 200, division: 0, saison: 1, gp: 0, prochainId: 3,
      parc: [{id: 1, v: 4, c: TEINTE, pieces: {}, usure: [0, 0, 0, 0], etat: 100, repar: 0}, {id: 2, v: 2, c: TEINTE, pieces: {}, usure: [0, 0, 0, 0], etat: 100, repar: 0}],
      pilotes: [{nom: 'L. MARCHAL', age: 24, n: [7, 8, 6], forme: 80, prog: 0, salaire: 3000, voiture: 1, c: '#ff6a13', num: 7},
                {nom: 'P. BELLINI', age: 29, n: [6, 7, 5], forme: 80, prog: 0, salaire: 2000, voiture: 2, c: '#d8323c', num: 12}],
      signes: [], rompus: [], semaine: [0, 1, 2, 3, 4], revenus: {}, points: {}, historique: [], occasions: [], sansPodium: 0, sansVictoire: 0};
    E.occasions = tirerOccasions(E); return E;
  }
  function tirerOccasions(E) {
    const lim = DIVISIONS[Math.min(2, E.division + 1)].ch, L = [];
    const possibles = VOITURES.map((v, i) => i).filter(i => VOITURES[i].ch <= lim);
    const ETATS = [['BON ETAT', [0, 0, 0, 0], 85], ['EMBRAYAGE FATIGUE', [0, -1, 0, -2], 65], ['MOTEUR A REVOIR', [-1, -1, 0, -3], 55], ['UN SEUL PROPRIETAIRE', [0, 0, 0, -1], 90], ['CARROSSERIE ABIMEE', [0, 0, -1, -1], 70]];
    const COUL = ['#7a8a96', '#2f6a3e', '#8a3a2a', '#202028', '#e8c43a', '#2456c8'];
    for (let k = 0; k < 3; k++) { const i = possibles[Math.floor(occasionsRnd() * possibles.length)], [etat, u, et] = ETATS[Math.floor(occasionsRnd() * ETATS.length)];
      L.push({i, km: (20 + Math.floor(occasionsRnd() * 120)) * 1000, etat, u, et, prix: Math.round(VOITURES[i].prix * (.35 + et / 100 * .35) / 100) * 100, c: COUL[Math.floor(occasionsRnd() * COUL.length)]}); }
    return L;
  }
  const voitureDe = (E, id) => E.parc.find(x => x.id === id);
  const piloteDe = (E, id) => E.pilotes.find(p => p.voiture === id);
  function notes(x) { const n = VOITURES[x.v].n.slice(); for (const p of PIECES) if (x.pieces[p.k]) p.e.forEach((y, i) => n[i] += y); return n.map((y, i) => Math.max(0, Math.min(10, y + (x.usure[i] || 0)))); }
  function chevaux(x) { let c = VOITURES[x.v].ch; for (const p of PIECES) if (x.pieces[p.k]) c += p.ch; return c; }
  const horsCategorie = (E, x) => chevaux(x) > DIVISIONS[E.division].ch;
  // pourquoi une voiture ne peut pas courir (null si elle peut)
  const empechement = (E, x) => x.repar > 0 ? 'En réparation · ' + x.repar + ' sem.' : horsCategorie(E, x) ? 'Hors catégorie (' + chevaux(x) + ' ch)' : null;
  const niveauDe = rep => NIVEAUX.filter(s => rep >= s).length;
  // notes → stats physiques de la simulation
  function physique(n, etat, reglage) { const f = .94 + .06 * etat / 100, r = 1 + .01 * reglage;
    return {vmax: (44 + 1.6 * n[0]) * f * r, acc: 7 + .5 * n[1], grip: (1.1 + .06 * n[2]) * (.97 + .03 * etat / 100) * r, panne: Math.max(.01, (10 - n[3]) * .012)}; }
  function rivaux(E) { return RIVAUX[E.division].map(([nom, c, m, n, p]) => ({nom, c, m, n, p})); }

  // la semaine : effets des activités, puis la grille du GP
  function preparer(E) {
    const msg = [], cpt = {}; E.semaine.forEach(a => cpt[ACTIVITES[a].k] = (cpt[ACTIVITES[a].k] || 0) + 1);
    const reglage = Math.min(3, cpt.essais || 0); if (reglage) msg.push('Essais : +' + reglage + ' % de vitesse et d\'adhérence');
    if (cpt.atelier) { for (const x of E.parc) { x.etat = Math.min(100, x.etat + 8 * cpt.atelier); if (x.repar > 0) x.repar = Math.max(0, x.repar - (cpt.atelier >= 2 ? 1 : 0)); } msg.push('Atelier : voitures entretenues (+' + 8 * cpt.atelier + ' % d\'état)'); }
    const fatigue = (cpt.essais || 0) + (cpt.simu || 0) + (cpt.medias || 0);
    for (const p of E.pilotes) {
      p.forme = Math.max(30, Math.min(100, p.forme + 10 * (cpt.repos || 0) - 4 * fatigue));
      if (cpt.simu) { p.prog = (p.prog || 0) + .12 * cpt.simu * (p.age < 24 ? 1.6 : 1); if (p.prog >= 1 && p.n[0] < 10) { p.prog -= 1; p.n[0]++; msg.push(p.nom + ' progresse : talent ' + p.n[0]); } }
    }
    if (cpt.medias) { E.argent += 1000 * cpt.medias; E.fans += 60 * cpt.medias; msg.push('Médias : +' + 1000 * cpt.medias + ' $ · +' + 60 * cpt.medias + ' fans'); }
    // chaque pilote prend sa voiture ; si elle ne peut pas courir, une voiture de la réserve la remplace
    const grille = [], prises = new Set();
    for (const p of E.pilotes) {
      let x = voitureDe(E, p.voiture);
      if (!x || empechement(E, x)) { const rempl = E.parc.find(y => !empechement(E, y) && !piloteDe(E, y.id) && !prises.has(y.id));
        if (rempl) { msg.push(p.nom + ' prend la ' + VOITURES[rempl.v].nom + (x ? ' (' + empechement(E, x) + ')' : '')); x = rempl; } else { msg.push(p.nom + ' ne court pas : pas de voiture'); continue; } }
      prises.add(x.id);
      const tal = p.n[0] / 10 * (.85 + .15 * p.forme / 100), cst = p.n[1] / 10 * (.9 + .1 * p.forme / 100);
      grille.push(Object.assign({nom: p.nom.replace(/^.\. /, ''), pil: p.nom.replace(/^.\. /, '').slice(0, 3), c: x.c, m: VOITURES[x.v].m, joueur: true, pilote: p.nom, voiture: x.id,
        tal, cst, agr: p.n[2] / 10}, physique(notes(x), x.etat, reglage)));
    }
    for (const r of rivaux(E).slice(0, 8 - grille.length)) grille.push(Object.assign({nom: r.nom, pil: r.nom.slice(0, 3), c: r.c, m: r.m, joueur: false, pilote: r.nom,
      tal: r.p[0] / 10, cst: r.p[1] / 10, agr: r.p[2] / 10}, physique(r.n, 95, 0)));
    return {grille, msg, circuit: calendrier(E.gp)};
  }
  const calendrier = gp => ['ville', 'port', 'parc'][gp % 3];

  // la course est finie : points, argent, fans, usure ; renvoie le bilan à afficher
  function resultats(E, C, prep) {
    const L = [], ajout = (t, v) => L.push([t, v]);
    const classes = C.ordre; let gainCourse = 0, fansGagnes = 0, pts = 0, meilleur = 99, abandon = false;
    const div = DIVISIONS[E.division];
    classes.forEach((v, i) => { const p = v.abandon ? 0 : (POINTS[i] || 0); E.points[v.pilote] = (E.points[v.pilote] || 0) + p;
      if (!v.joueur) return;
      if (v.abandon) { abandon = true; ajout(v.pilote + ' : abandon (' + v.abandon.toLowerCase() + ')', ''); }
      else { const prime = Math.round(PRIX[i] * div.x); gainCourse += prime; pts += p; meilleur = Math.min(meilleur, i);
        ajout(v.pilote + ' : P' + (i + 1) + (p ? ' · ' + p + ' pt' + (p > 1 ? 's' : '') : ''), prime); }
      fansGagnes += (v.abandon ? 0 : i === 0 ? 400 : i < 3 ? 150 : 0) + (v.abandon ? 0 : p * 10) + 10 * v.depass - (v.abandon ? 20 : 0); });
    E.argent += gainCourse;
    // sponsors
    if (meilleur < 3) E.sansPodium = 0; else E.sansPodium++;
    if (meilleur === 0) E.sansVictoire = 0; else E.sansVictoire++;
    for (const i of E.signes.slice()) { const s = SPONSORS[i]; let g = s.gain, rompu = false;
      if (s.cond === 'top5' && meilleur < 5) g += 2000;
      if (s.cond === 'arrivee' && abandon) rompu = true;
      if (s.cond === 'podium3' && E.sansPodium >= 3) rompu = true;
      if (s.cond === 'victoire4' && E.sansVictoire >= 4) rompu = true;
      E.argent += g; ajout('Sponsor ' + s.nom, g);
      if (rompu) { E.signes = E.signes.filter(y => y !== i); E.rompus.push(i); ajout(s.nom + ' rompt le contrat !', ''); } }
    // usure des voitures
    for (const v of classes) { if (!v.joueur) continue; const x = voitureDe(E, v.voiture); if (!x) continue;
      x.etat = Math.max(5, Math.round(x.etat - 3 - Math.random() * 5 - 6 * v.sorties));
      if (v.abandon === 'ACCIDENT') { x.etat = Math.max(5, x.etat - 35); x.repar = 2; ajout(VOITURES[x.v].nom + ' : accident, 2 semaines de réparation', ''); }
      if (v.abandon === 'CASSE') { x.etat = Math.max(5, x.etat - 20); x.repar = 1; ajout(VOITURES[x.v].nom + ' : casse, 1 semaine de réparation', ''); }
      if (x.pieces.pneus) { x.pieces.pneus = (x.pieces.pneus === true ? 4 : x.pieces.pneus) - 1; if (x.pieces.pneus <= 0) { delete x.pieces.pneus; ajout(VOITURES[x.v].nom + ' : pneus sport usés', ''); } } }
    // réparations en cours (celles d'avant cette course)
    for (const x of E.parc) if (x.repar > 0 && !classes.some(v => v.voiture === x.id && v.abandon)) { x.repar--; if (!x.repar) { x.etat = Math.max(x.etat, 80); ajout(VOITURES[x.v].nom + ' réparée', ''); } }
    // fans et leurs revenus
    E.fans = Math.max(0, E.fans + fansGagnes); ajout('Fans ' + (fansGagnes >= 0 ? '+' : '') + fansGagnes, '');
    for (const r of REVENUS) if (E.revenus[r.k] && (E.gp + 1) % r.tous === 0) { const g = Math.round(E.fans * r.par); E.argent += g; ajout(r.nom, g); }
    // dépenses de la semaine
    const sal = E.pilotes.reduce((a, p) => a + p.salaire, 0); E.argent -= sal; ajout('Salaires', -sal);
    const ent = ENTRETIEN * E.parc.length; E.argent -= ent; ajout('Entretien du parc (' + E.parc.length + ' voitures)', -ent);
    // réputation et niveau
    E.rep += pts; const niv = niveauDe(E.rep); let monte = false; if (niv > E.niveau) { E.niveau = niv; monte = true; }
    E.historique.push({s: E.saison, gp: E.gp, c: prep.circuit, place: meilleur < 99 ? meilleur + 1 : null, pts});
    if (E.historique.length > 40) E.historique.shift();
    E.gp++; E.occasions = tirerOccasions(E);
    const bilan = {lignes: L, gain: gainCourse, fans: fansGagnes, pts, monte, niveau: E.niveau, places: PLACES[E.niveau - 1], faillite: E.argent < -20000, fin: null};
    if (E.gp >= GP_SAISON) bilan.fin = finSaison(E);
    return bilan;
  }
  function classement(E) { const noms = new Set(Object.keys(E.points)); E.pilotes.forEach(p => noms.add(p.nom)); rivaux(E).forEach(r => noms.add(r.nom));
    return [...noms].map(n => ({nom: n, pts: E.points[n] || 0, joueur: E.pilotes.some(p => p.nom === n)})).sort((a, b) => b.pts - a.pts || (a.nom < b.nom ? -1 : 1)); }
  function finSaison(E) {
    const cl = classement(E), rang = cl.findIndex(x => x.joueur), prime = Math.round([30000, 20000, 12000, 8000, 5000, 3000, 2000, 1000][Math.min(7, rang)] * DIVISIONS[E.division].x);
    E.argent += prime; const avant = E.division; let promu = false;
    if (rang <= 2 && E.division < 2) { E.division++; promu = true; }
    const f = {saison: E.saison, rang: rang + 1, champion: rang === 0, prime, promu, division: DIVISIONS[E.division].nom, avant: DIVISIONS[avant].nom, classement: cl.slice(0, 8)};
    E.saison++; E.gp = 0; E.points = {}; E.rompus = []; E.sansPodium = 0; E.sansVictoire = 0; E.occasions = tirerOccasions(E);
    return f;
  }
  W.Regles = {VOITURES, PIECES, DIVISIONS, LIBRES, SPONSORS, ACTIVITES, REVENUS, POINTS, PRIX, NIVEAUX, PLACES, GP_SAISON, ENTRETIEN, TEINTE,
    nouvellePartie, tirerOccasions, voitureDe, piloteDe, notes, chevaux, horsCategorie, empechement, niveauDe, physique, rivaux, preparer, resultats, classement, calendrier};
  if (typeof window !== 'undefined') window.Regles = W.Regles; // déclaré pour l'analyse du code (lint.js)
})(typeof window !== 'undefined' ? window : globalThis);

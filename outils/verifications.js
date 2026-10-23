/* Vérifications rapides de toute la Ludothèque, sans navigateur (lancées par la CI GitHub
   à chaque push, et à lancer avant de pousser) :  node outils/verifications.js
   1. syntaxe de chaque script (.js et <script> des pages .html, maquettes comprises) ;
   2. sw.js : chaque fichier de FILES existe ; la version du cache notée dans CLAUDE.md est la bonne ;
   3. sécurité : aucune clé secrète Supabase dans le dépôt, le SQL garde MON-CODE ;
   4. menu : les icônes de ICONS (icones.js) font bien 16 lignes de 16 caractères ;
   5. Nebula : simulateur de combats et de parties (reproductibilité, migrate()) ;
   6. Nebula : types de regles.js (// @ts-check + JSDoc) vérifiés par tsc, sans rien compiler ;
   7. Lune-Rover : chaque niveau est gagné par sa solution de référence ;
   8. Odyssée : chaque plateau est traversé par le pilote automatique, sous le temps cible ;
   8 ter. La Dernière Lanterne : moteur RPG, données et accessibilité (outils/lanterne-tests.js) ;
   8 sexies. Romet : physique et règles (outils/romet-simulateur.js) ;
   8 septies. Doggy Saga : règles, obstacles, reproductibilité et 60 niveaux (outils/doggy-saga-simulateur.js) ;
   9. classements : chaque record envoyé par un jeu (LudoScores.submit) a son tableau dans le volet de
      l'accueil (RANKS, accueil.js), est repris en rejoignant (registerExisting) et son jeu sert à vérifier les pseudos.
   Code de sortie 1 si quelque chose ne va pas. */
const fs = require('fs'), path = require('path'), vm = require('vm'), { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let fail = 0;
const bad = msg => { console.log('ÉCHEC ' + msg); fail++; };
const ok = msg => console.log('ok    ' + msg);

// fichiers suivis par git (pas les fichiers de travail locaux)
const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);

// 1. syntaxe : vm.Script compile sans exécuter
let n = 0;
const compile = (code, where) => { n++; try { new vm.Script(code, { filename: where }); } catch (e) { bad(`syntaxe ${where} : ${e.message}`); } };
for (const f of files) {
  if (f.endsWith('.js')) compile(read(f), f);
  else if (f.endsWith('.html')) {
    const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g; let m;
    while ((m = re.exec(read(f)))) {
      const attrs = m[1] || '';
      if (/\ssrc=/.test(attrs) || /type="(module|application\/(ld\+)?json|text\/plain)"/.test(attrs) || !m[2].trim()) continue;
      compile(m[2], `${f} (script ligne ${read(f).slice(0, m.index).split('\n').length})`);
    }
  }
}
ok(`${n} scripts compilés`);

// 2. service worker
const sw = read('sw.js');
const list = JSON.parse('[' + sw.match(/const FILES = \[([\s\S]*?)\];/)[1].replace(/,\s*$/, '') + ']');
const missing = list.filter(f => f !== './' && !fs.existsSync(path.join(ROOT, f)));
missing.length ? bad('sw.js : fichiers absents de FILES : ' + missing.join(', ')) : ok(`sw.js : les ${list.length} fichiers de FILES existent`);
const doublons = list.filter((f, i) => list.indexOf(f) !== i);   // cache.addAll refuse une liste avec deux fois le même fichier : plus rien hors connexion
if (doublons.length) bad('sw.js : fichiers en double dans FILES : ' + doublons.join(', '));
const version = sw.match(/const VERSION = "([^"]+)"/)[1];
read('CLAUDE.md').includes('`' + version + '`') ? ok(`version du cache ${version} notée dans CLAUDE.md`) : bad(`CLAUDE.md ne mentionne pas la version du cache ${version}`);
for (const f of files.filter(f => /^[a-z0-9-]+\/[a-z0-9-]+\.(html|js|css)$/.test(f) && !/^(maquettes|outils|supabase|specs)\//.test(f)))
  if (!list.includes('./' + f)) bad(`sw.js : ${f} n'est pas dans FILES (pas disponible hors connexion)`);
// chaque script et feuille de style locale d'une page du site : présent et dans FILES
for (const f of files.filter(f => f.endsWith('.html') && !/^(maquettes|outils|supabase|specs)\//.test(f)))
  for (const m of read(f).matchAll(/<(?:script src|link rel="stylesheet" href)="(?!https?:|\/\/)([^"]+\.(?:js|css))"/g)) {
    const p = path.posix.normalize(path.posix.join(path.posix.dirname(f), m[1]));
    if (!fs.existsSync(path.join(ROOT, p))) bad(`${f} : ${m[1]} n'existe pas`);
    else if (!list.includes('./' + p)) bad(`sw.js : ${p} (chargé par ${f}) n'est pas dans FILES`);
  }

// 3. sécurité
const secret = /sb_secret_[A-Za-z0-9_-]{8,}|service_role|eyJhbGciOi[A-Za-z0-9_-]{20,}/;
const leaks = files.filter(f => !/\.(png|jpg|jpeg|gif|ico|webp|woff2?)$/.test(f) && f !== 'outils/verifications.js' && secret.test(read(f)));
leaks.length ? bad('clé secrète possible dans : ' + leaks.join(', ')) : ok('aucune clé secrète Supabase dans le dépôt');
// le code familial n'est écrit qu'à un endroit : « insert into ludo_private.settings … values (1, '…') »
for (const f of files.filter(f => f.endsWith('.sql')))
  for (const m of read(f).matchAll(/insert into ludo_private\.settings[\s\S]*?values\s*\(\s*1\s*,\s*'([^']*)'/gi))
    if (m[1] !== 'MON-CODE') bad(`${f} : le code familial doit rester MON-CODE dans le dépôt`);

// 4. icônes du menu
const icons = read('icones.js').match(/const ICONS = \{([\s\S]*?)\n\};/);
if (!icons) bad('icones.js : ICONS introuvable');
else {
  let k = 0;
  for (const m of icons[1].matchAll(/(\w+)\s*:\s*\{[^[]*map:\s*\[([\s\S]*?)\]/g)) {
    const rows = [...m[2].matchAll(/"([^"]*)"/g)].map(x => x[1]); k++;
    if (rows.length !== 16 || rows.some(r => r.length !== 16)) bad(`icône ${m[1]} : ${rows.length} lignes, longueurs ${[...new Set(rows.map(r => r.length))].join('/')}`);
  }
  ok(`${k} icônes du menu vérifiées`);
}

// 5. Nebula
try { execFileSync(process.execPath, [path.join(__dirname, 'nebula-simulateur.js'), '40', '4'], { stdio: 'pipe', encoding: 'utf8' }); ok('Nebula : simulateur (combats possibles, parties reproductibles, migrate)'); }
catch (e) { bad('Nebula : simulateur\n' + (e.stdout || '') + (e.stderr || '')); }

// 6. types de Nebula (tsc installé : npm install -g typescript ; la CI l'installe)
try { execFileSync('tsc', ['-p', path.join(__dirname, 'tsconfig.nebula.json')], { stdio: 'pipe', encoding: 'utf8' }); ok('Nebula : types de regles.js (tsc)'); }
catch (e) { if (e.code === 'ENOENT') console.log('--    Nebula : tsc absent, types non vérifiés'); else bad('Nebula : types de regles.js\n' + (e.stdout || '') + (e.stderr || '')); }

// 7. Lune-Rover : chaque niveau est gagné par sa solution de référence
try { execFileSync(process.execPath, [path.join(__dirname, 'lune-rover-niveaux.js')], { stdio: 'pipe', encoding: 'utf8' }); ok('Lune-Rover : les 30 niveaux ont une solution'); }
catch (e) { bad('Lune-Rover : niveaux\n' + (e.stdout || '') + (e.stderr || '')); }

// 8. Odyssée : chaque plateau est traversé par le pilote automatique
try { execFileSync(process.execPath, [path.join(__dirname, 'odyssee.js')], { stdio: 'pipe', encoding: 'utf8' }); ok('Odyssée : chaque plateau est faisable, sous le temps cible'); }
catch (e) { bad('Odyssée : plateaux\n' + (e.stdout || '') + (e.stderr || '')); }

// 8 ter. La Dernière Lanterne : moteur RPG, cohérence des données, tout est atteignable depuis le départ
try { execFileSync(process.execPath, [path.join(__dirname, 'lanterne-tests.js')], { stdio: 'pipe', encoding: 'utf8' }); ok('La Dernière Lanterne : moteur, données et accessibilité'); }
catch (e) { bad('La Dernière Lanterne\n' + (e.stdout || '') + (e.stderr || '')); }

// 8 bis. Le Magasinier : chaque niveau est gagné par sa solution notée (l'optimum complet : magasinier-solveur.js --optimum)
try { execFileSync(process.execPath, [path.join(__dirname, 'magasinier-solveur.js')], { stdio: 'pipe', encoding: 'utf8' }); ok('Le Magasinier : chaque niveau est gagné par sa solution notée'); }
catch (e) { bad('Le Magasinier : niveaux\n' + (e.stdout || '') + (e.stderr || '')); }
// 8 quater. Le Mot d'or : les mots (6 lettres A à Z, sans doublon, chaque solution est un essai accepté)
try {
  const MO = require(path.join(__dirname, '..', 'mot-d-or', 'mots.js')), sol = MO.solutions.split(' '), acc = new Set(MO.acceptes.split(' '));
  const mauvais = sol.concat([...acc]).filter(w => !/^[A-Z]{6}$/.test(w)), absents = sol.filter(w => !acc.has(w));
  if (mauvais.length || absents.length || new Set(sol).size !== sol.length || !/^\d{4}-\d{2}-\d{2}$/.test(MO.debut))
    bad(`Le Mot d'or : mots.js abîmé (${mauvais.slice(0, 5).join(' ')} ${absents.slice(0, 5).join(' ')})`);
  else ok(`Le Mot d'or : ${sol.length} solutions et ${acc.size} essais acceptés, tous de 6 lettres`);
} catch (e) { bad("Le Mot d'or : mots.js illisible (" + e.message + ')'); }

// 8 ter. Capitaine du port : chaque bassin est gagné par sa solution notée (l'optimum complet : capitaine-solveur.js --optimum)
try { execFileSync(process.execPath, [path.join(__dirname, 'capitaine-solveur.js')], { stdio: 'pipe', encoding: 'utf8' }); ok('Capitaine du port : chaque bassin est gagné par sa solution notée'); }
catch (e) { bad('Capitaine du port : bassins\n' + (e.stdout || '') + (e.stderr || '')); }

// 8 quater. Duché : règles, IA et événements (déterminisme, sauvegarde, règles de base, équilibrage grossier)
try { execFileSync(process.execPath, [path.join(__dirname, 'duche-simulateur.js'), '60'], { stdio: 'pipe', encoding: 'utf8' }); ok('Duché : simulateur (parties reproductibles, règles, équilibrage)'); }
catch (e) { bad('Duché : simulateur\n' + (e.stdout || '') + (e.stderr || '')); }
// 8 quinquies. Le Thé des Jarls : chaque faveur, déterminisme, ordinateur, équilibre entre les dieux
try { execFileSync(process.execPath, [path.join(__dirname, 'jarls-simulateur.js'), '60'], { stdio: 'pipe', encoding: 'utf8' }); ok('Le Thé des Jarls : simulateur (20 faveurs, duels reproductibles, ordinateur, équilibre)'); }
catch (e) { bad('Le Thé des Jarls : simulateur\n' + (e.stdout || '') + (e.stderr || '')); }

// 8 quinquies. Bannières : règles, rivaux et surprises (déterminisme, sauvegarde, règles de base, équilibrage grossier)
try { execFileSync(process.execPath, [path.join(__dirname, 'bannieres-simulateur.js'), '20'], { stdio: 'pipe', encoding: 'utf8' }); ok('Bannières : simulateur (parties reproductibles, règles, équilibrage)'); }
catch (e) { bad('Bannières : simulateur\n' + (e.stdout || '') + (e.stderr || '')); }

// 8 sexies. La Boutique de cartes : catalogue, boosters, règles de base, années complètes (équilibrage grossier), déterminisme, sauvegarde
try { execFileSync(process.execPath, [path.join(__dirname, 'boutique-simulateur.js'), '6'], { stdio: 'pipe', encoding: 'utf8' }); ok('La Boutique de cartes : simulateur (catalogue, règles, années reproductibles, équilibrage)'); }
catch (e) { bad('La Boutique de cartes : simulateur\n' + (e.stdout || '') + (e.stderr || '')); }
// 8 septies. Doggy Saga : règles du trois en ligne sur grilles préparées, grille toujours saine, reproductibilité, 60 niveaux
try { execFileSync(process.execPath, [path.join(__dirname, 'doggy-saga-simulateur.js')], { stdio: 'pipe', encoding: 'utf8' }); ok('Doggy Saga : simulateur (règles, bonus, obstacles, parties reproductibles, 60 niveaux)'); }
catch (e) { bad('Doggy Saga : simulateur\n' + (e.stdout || '') + (e.stderr || '')); }
// 8 sexies. Romet : physique et règles (tas reproductible, sauvegarde et reprise, pièces endormies, fin de partie)
try { execFileSync(process.execPath, [path.join(__dirname, 'romet-simulateur.js')], { stdio: 'pipe', encoding: 'utf8' }); ok('Romet : simulateur (tas reproductible, reprise, mise au repos, fin de partie)'); }
catch (e) { bad('Romet : simulateur\n' + (e.stdout || '') + (e.stderr || '')); }

// 9. classements : jeu + début du nom du tableau (« best », « daily »…), lus dans le code
{
  const pre = new Map(), idx = read('accueil.js'), ls = read('ludo-scores.js');
  for (const f of files.filter(f => /\.(html|js)$/.test(f) && !/^(maquettes|outils|lib)\//.test(f) && f !== 'ludo-scores.js'))
    for (const m of read(f).matchAll(/\.submit\(\s*(['"])([a-z]+)\1\s*,\s*(?:(['"`])([A-Za-z]+)|\w+)/g))
      if (m[4]) pre.set(m[2] + ' ' + m[4], f);   // tableau calculé (Calculator : serie/chrono) : non vérifié
  const at = idx.indexOf('const RANKS = {'), ranks = idx.slice(at, idx.indexOf('\n};', at));
  const shown = new Set([...ranks.matchAll(/game: "([a-z]+)", board: (?:\(\) => ["`]([A-Za-z]+)|daily)/g)].map(m => m[1] + ' ' + (m[2] || 'daily')));
  const resent = new Set([...ls.matchAll(/\b(?:hi|lo)\("([a-z]+)", "([A-Za-z]+)/g)].map(m => m[1] + ' ' + m[2]));
  const pseudo = new Set([...ls.matchAll(/\["([a-z]+)", "[^"]+"\]/g)].map(m => m[1]));
  if (at < 0 || !pre.size || !shown.size || !resent.size) bad('classements : RANKS, submit ou registerExisting introuvables (format changé ?)');
  for (const [k, f] of pre) {
    if (!shown.has(k)) bad(`classements : ${f} envoie « ${k.replace(' ', ' / ')} » mais le volet de l'accueil (RANKS) ne l'affiche pas`);
    if (!resent.has(k)) bad(`classements : « ${k.replace(' ', ' / ')} » (${f}) n'est pas repris en rejoignant (registerExisting de ludo-scores.js)`);
    if (!pseudo.has(k.split(' ')[0])) bad(`classements : le jeu ${k.split(' ')[0]} manque à PSEUDO_BOARDS (ludo-scores.js)`);
  }
  ok(`classements : ${pre.size} tableaux envoyés, tous affichés et repris en rejoignant`);
}

console.log(fail ? `\n${fail} problème(s)` : '\nTout est bon.');
process.exit(fail ? 1 : 0);

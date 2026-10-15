/* Vérifications rapides de toute la Ludothèque, sans navigateur (lancées par la CI GitHub
   à chaque push, et à lancer avant de pousser) :  node outils/verifications.js
   1. syntaxe de chaque script (.js et <script> des pages .html, maquettes comprises) ;
   2. sw.js : chaque fichier de FILES existe ; la version du cache notée dans CLAUDE.md est la bonne ;
   3. sécurité : aucune clé secrète Supabase dans le dépôt, le SQL garde MON-CODE ;
   4. menu : les icônes de ICONS (icones.js) font bien 16 lignes de 16 caractères ;
   5. Nebula : simulateur de combats et de parties (reproductibilité, migrate()) ;
   6. Nebula : types de regles.js (// @ts-check + JSDoc) vérifiés par tsc, sans rien compiler.
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
const version = sw.match(/const VERSION = "([^"]+)"/)[1];
read('CLAUDE.md').includes('`' + version + '`') ? ok(`version du cache ${version} notée dans CLAUDE.md`) : bad(`CLAUDE.md ne mentionne pas la version du cache ${version}`);
for (const f of files.filter(f => /^[a-z0-9-]+\/[a-z0-9-]+\.(html|js)$/.test(f) && !/^(maquettes|outils|supabase|specs)\//.test(f)))
  if (!list.includes('./' + f)) bad(`sw.js : ${f} n'est pas dans FILES (pas disponible hors connexion)`);

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

console.log(fail ? `\n${fail} problème(s)` : '\nTout est bon.');
process.exit(fail ? 1 : 0);

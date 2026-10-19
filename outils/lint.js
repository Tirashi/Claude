/* Analyse du code (ESLint) de chaque page du site, avec les scripts qu'elle charge, dans l'ordre :
   variable non définie (faute de frappe), fonction ou constante déclarée deux fois, code jamais atteint,
   comparaison toujours fausse… Lancé par la CI ; en local seulement pour déboguer.
   node outils/lint.js   (code de sortie 1 en cas d'erreur)
   Les variables du navigateur sont lues dans Chromium (Playwright) ; celles que le site ajoute à window
   (window.LudoScores = …) sont trouvées dans le code. */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
let ESLint; try { ({ ESLint } = require('eslint')); } catch (e) { ({ ESLint } = require('/opt/node22/lib/node_modules/eslint')); }
const { phone } = require('./pw');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(Boolean);
const pages = files.filter(f => f.endsWith('.html') && !/^(maquettes|outils|specs|supabase)\//.test(f));

// une page = ses scripts locaux puis ses scripts en ligne, mis bout à bout (on retient d'où vient chaque ligne)
function assemble(page) {
  const t = read(page), segs = []; let code = '', m;
  const add = (src, txt, first) => { segs.push({ src, at: code.split('\n').length, first }); code += txt + '\n'; };
  const re = /<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;
  while ((m = re.exec(t))) {
    const attrs = m[1] || '', src = /\ssrc="([^"]+)"/.exec(attrs);
    if (src) { if (!/^(https?:|\/\/)/.test(src[1]) && !/(^|\/)lib\//.test(src[1])) { const p = path.posix.normalize(path.posix.join(path.posix.dirname(page), src[1])); if (fs.existsSync(path.join(ROOT, p))) add(p, read(p), 1); } continue; }
    if (/type="(module|application)/.test(attrs) || !m[2].trim()) continue;
    add(page, m[2], t.slice(0, m.index + m[0].indexOf('>') + 1).split('\n').length);
  }
  return { code, segs };
}

(async () => {
  const { browser, ctx } = await phone(); const p = await ctx.newPage(); await p.goto('about:blank');
  const names = await p.evaluate(() => { const s = new Set(); for (let o = window; o; o = Object.getPrototypeOf(o)) Object.getOwnPropertyNames(o).forEach(n => s.add(n)); return [...s]; });
  await browser.close();
  const globals = Object.fromEntries(names.map(n => [n, 'readonly']));
  for (const f of files.filter(f => /\.(js|html)$/.test(f) && !/^(maquettes|outils)\//.test(f)))
    for (const m of read(f).matchAll(/window\.([A-Za-z_$][\w$]*)\s*=[^=]/g)) globals[m[1]] = 'writable';
  Object.assign(globals, { THREE: 'readonly', CANNON: 'readonly', module: 'readonly', require: 'readonly' });   // module, require : export des règles pour les tests sous Node
  const eslint = new ESLint({ cwd: ROOT, overrideConfigFile: true, overrideConfig: { languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals }, rules: {
    'no-undef': 'error', 'no-redeclare': ['error', { builtinGlobals: false }], 'no-dupe-keys': 'error', 'no-duplicate-case': 'error', 'no-dupe-else-if': 'error',
    'no-unreachable': 'error', 'no-self-assign': 'error', 'no-self-compare': 'error', 'no-const-assign': 'error', 'no-func-assign': 'error', 'use-isnan': 'error',
    'valid-typeof': 'error', 'no-unsafe-negation': 'error', 'no-unsafe-finally': 'error', 'no-compare-neg-zero': 'error', 'no-sparse-arrays': 'error', 'no-loss-of-precision': 'error' } } });
  const seen = new Set(); let n = 0;
  for (const page of pages) {
    const { code, segs } = assemble(page); if (!code) continue;
    const [res] = await eslint.lintText(code, { filePath: path.join(ROOT, 'page.js') });
    for (const msg of res.messages) {
      let s = segs[0]; for (const x of segs) if (x.at <= msg.line) s = x;
      const where = `${s.src}:${msg.line - s.at + s.first}`, line = `${where}  ${msg.message}${msg.ruleId ? ' (' + msg.ruleId + ')' : ''}`;
      if (!seen.has(line)) { seen.add(line); console.log('ÉCHEC ' + line); n++; }
    }
  }
  console.log(n ? `\n${n} problème(s)` : `ok    ${pages.length} pages analysées, aucun problème`);
  process.exit(n ? 1 : 0);
})();

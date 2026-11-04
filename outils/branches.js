#!/usr/bin/env node
// Classe les branches de GitHub (origin/*) par rapport à main, pour repérer le travail oublié.
//   node outils/branches.js [--fetch] [--markdown fichier] [--a-supprimer fichier]
//   --fetch           : git fetch origin --prune d'abord (en local)
//   --markdown f      : écrit aussi le tableau en Markdown (résumé de la CI)
//   --a-supprimer f   : écrit « branche sha » pour chaque branche qu'on peut supprimer (workflow de ménage)
// Catégories :
//   FUSIONNEE  : tous ses commits sont dans main                                   -> supprimable
//   REPRISE    : ses changements sont déjà dans main (fusionner n'apporterait rien), ou branche
//                d'avant la remise à zéro de main (sans ancêtre commun, plus ancienne que le début
//                de l'historique de main) dont tous les fichiers existent dans main  -> supprimable
//   ABANDONNEE : listée dans outils/branches-abandonnees.txt (version de main)       -> supprimable
//   EN ATTENTE : du travail absent de main                                          -> gardée
// main n'est jamais supprimée. Rien n'est modifié par ce script.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');

const args = process.argv.slice(2);
const opt = (nom) => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : null; };
const git = (...a) => {
  try { return execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }); }
  catch (e) { const err = new Error('git ' + a.join(' ')); err.status = e.status; err.stdout = e.stdout; throw err; }
};
const essai = (...a) => { try { return git(...a); } catch (e) { return null; } };

if (args.includes('--fetch')) git('fetch', 'origin', '--prune', '--quiet');

const MAIN = 'origin/main';
const mainTree = git('rev-parse', MAIN + '^{tree}').trim();
// Début de l'historique de main (le plus ancien commit racine) : les branches sans ancêtre commun
// plus anciennes que ça datent d'avant une remise à zéro de main.
const racines = git('log', MAIN, '--max-parents=0', '--format=%ct').trim().split('\n').map(Number);
const debutMain = Math.min(...racines);
const fichiersMain = new Set(git('ls-tree', '-r', '--name-only', MAIN).split('\n').filter(Boolean));

// Branches abandonnées : « nom | date | raison » par ligne, # pour les commentaires.
const abandonnees = new Map();
const texte = essai('show', MAIN + ':outils/branches-abandonnees.txt') || '';
for (const ligne of texte.split('\n')) {
  const l = ligne.trim();
  if (!l || l.startsWith('#')) continue;
  const [nom, date, ...raison] = l.split('|').map((s) => s.trim());
  abandonnees.set(nom.replace(/^origin\//, ''), { date: date || '', raison: raison.join(' | ') });
}

const branches = git('for-each-ref', '--format=%(refname:short)', 'refs/remotes/origin')
  .split('\n').filter((b) => b && b !== 'origin' && b !== 'origin/HEAD' && b !== MAIN);

const lignes = [];
for (const ref of branches) {
  const nom = ref.replace(/^origin\//, '');
  const sha = git('rev-parse', ref).trim();
  const [quand, sujet] = git('log', '-1', '--format=%ct%x09%s', ref).trim().split('\t');
  const date = new Date(Number(quand) * 1000).toISOString().slice(0, 10);
  const enPlus = Number(git('rev-list', '--count', MAIN + '..' + ref).trim());
  let cat, detail;
  const ab = abandonnees.get(nom);
  if (enPlus === 0) { cat = 'FUSIONNEE'; detail = 'tous ses commits sont dans main'; }
  else if (ab) { cat = 'ABANDONNEE'; detail = (ab.date ? ab.date + ' : ' : '') + (ab.raison || 'sans raison notée'); }
  else if (!essai('merge-base', MAIN, ref)) {
    const manquants = git('ls-tree', '-r', '--name-only', ref).split('\n').filter((f) => f && !fichiersMain.has(f));
    if (manquants.length === 0 && Number(quand) < debutMain) {
      cat = 'REPRISE'; detail = "d'avant la remise à zéro de main, tous ses fichiers sont dans main";
    } else {
      cat = 'EN ATTENTE';
      detail = 'sans ancêtre commun avec main' + (manquants.length ? ', ' + manquants.length + ' fichier(s) absent(s) de main : ' + manquants.slice(0, 3).join(', ') + (manquants.length > 3 ? '…' : '') : ', plus récente que le début de main');
    }
  } else {
    // Que changerait une fusion dans main ?
    let arbre = null;
    try { arbre = git('merge-tree', '--write-tree', MAIN, ref).split('\n')[0].trim(); }
    catch (e) { arbre = null; }
    if (arbre === mainTree) { cat = 'REPRISE'; detail = "ses changements sont déjà dans main (fusionner n'apporterait rien)"; }
    else {
      cat = 'EN ATTENTE';
      if (arbre) {
        const stat = git('diff', '--shortstat', MAIN, arbre).trim();
        const fichiers = git('diff', '--name-only', MAIN, arbre).split('\n').filter(Boolean);
        detail = enPlus + ' commit(s) ; fusionner apporterait ' + stat + ' (' + fichiers.slice(0, 3).join(', ') + (fichiers.length > 3 ? '…' : '') + ')';
      } else detail = enPlus + ' commit(s) ; la fusion aurait des conflits';
    }
  }
  lignes.push({ nom, sha, date, sujet, cat, detail });
}

const ORDRE = { 'EN ATTENTE': 0, ABANDONNEE: 1, REPRISE: 2, FUSIONNEE: 3 };
const ICONE = { 'EN ATTENTE': '⚠️', ABANDONNEE: '❌', REPRISE: '🟡', FUSIONNEE: '✅' };
lignes.sort((a, b) => ORDRE[a.cat] - ORDRE[b.cat] || b.date.localeCompare(a.date));
const supprimables = lignes.filter((l) => l.cat !== 'EN ATTENTE');

for (const l of lignes) {
  console.log(`${ICONE[l.cat]} ${l.cat.padEnd(10)} ${l.date}  ${l.nom}`);
  console.log(`      ${l.detail}`);
  if (l.cat === 'EN ATTENTE') console.log(`      dernier commit : ${l.sujet}`);
}
const nAttente = lignes.length - supprimables.length;
console.log(`\n${lignes.length} branche(s) en plus de main : ${nAttente} en attente, ${supprimables.length} à supprimer.`);
for (const nom of abandonnees.keys()) {
  if (!branches.includes('origin/' + nom)) console.log(`(branches-abandonnees.txt : « ${nom} » n'existe plus sur GitHub, la ligne peut rester comme trace)`);
}

const md = opt('--markdown');
if (md) {
  const esc = (s) => String(s).replace(/\|/g, '\\|');
  let out = `### Branches (${lignes.length} en plus de main : ${nAttente} en attente, ${supprimables.length} à supprimer)\n\n| | Branche | Date | Détail |\n|---|---|---|---|\n`;
  for (const l of lignes) out += `| ${ICONE[l.cat]} ${l.cat} | \`${l.nom}\` | ${l.date} | ${esc(l.detail)}${l.cat === 'EN ATTENTE' ? '<br>dernier commit : ' + esc(l.sujet) : ''} |\n`;
  fs.appendFileSync(md, out);
}
const sup = opt('--a-supprimer');
if (sup) fs.writeFileSync(sup, supprimables.map((l) => l.nom + ' ' + l.sha).join('\n') + (supprimables.length ? '\n' : ''));

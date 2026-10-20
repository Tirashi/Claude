/* Le Mot d'or, sous Node : fabrique mot-d-or/mots.js (les mots à trouver et les essais acceptés).
   node outils/mot-d-or-mots.js <index.json du paquet npm an-array-of-french-words>
   - Essais acceptés : tous les mots de 6 lettres du dictionnaire (formes fléchies comprises), sans accents,
     en majuscules (Œ → OE, Æ → AE ; les mots à tiret, apostrophe ou chiffre sont écartés).
   - Solutions : outils/mot-d-or-solutions.txt, gardées si elles ont 6 lettres et que le dictionnaire les connaît.
   - Ordre des mots du jour : celui du mots.js existant est gardé (le mot d'un jour déjà passé ou d'aujourd'hui ne
     change pas) ; un mot retiré de la liste est remplacé sur place par un mot nouveau, les autres nouveaux mots sont
     mélangés (graine fixe) et ajoutés à la fin.
   Dictionnaire : an-array-of-french-words (licence MIT, Zeke Sikelianos, tiré de la liste de Letterpress). */
const fs = require('fs'), path = require('path');
const src = process.argv[2];
if (!src) { console.error('usage : node outils/mot-d-or-mots.js <index.json>'); process.exit(2); }
const sans = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/gi, 'oe').replace(/æ/gi, 'ae').toUpperCase();
const dico = new Set();
for (const w of JSON.parse(fs.readFileSync(src, 'utf8'))) {
  if (/[^a-zàâäéèêëîïôöùûüÿçœæ]/i.test(w) || w !== w.toLowerCase()) continue;   // pas de noms propres ni de tirets
  const m = sans(w); if (/^[A-Z]{6}$/.test(m)) dico.add(m);
}
const txt = fs.readFileSync(path.join(__dirname, 'mot-d-or-solutions.txt'), 'utf8');
const voulus = [], ecartes = [];
for (const l of txt.split('\n')) {
  if (/^\s*#/.test(l)) continue;
  for (const w of l.split(/\s+/).filter(Boolean)) {
    const m = sans(w);
    if (!/^[A-Z]{6}$/.test(m)) { ecartes.push(w + ' (pas 6 lettres)'); continue; }
    if (!dico.has(m)) { ecartes.push(w + ' (inconnu du dictionnaire)'); continue; }
    if (!voulus.includes(m)) voulus.push(m);
  }
}
// ordre existant
const cible = path.join(__dirname, '..', 'mot-d-or', 'mots.js');
let avant = [];
try { avant = require(cible).solutions.split(' '); } catch (e) { /* premier passage */ }
const garde = new Set(voulus);
let nouveaux = voulus.filter(m => !avant.includes(m));
let r = 2026; const hasard = () => { r = (r * 1103515245 + 12345) & 0x7fffffff; return r / 0x80000000; };
for (let i = nouveaux.length - 1; i > 0; i--) { const j = Math.floor(hasard() * (i + 1)); [nouveaux[i], nouveaux[j]] = [nouveaux[j], nouveaux[i]]; }
const ordre = avant.map(m => garde.has(m) ? m : nouveaux.shift()).filter(Boolean).concat(nouveaux);
const acceptes = [...new Set([...dico, ...ordre])].sort();
const sortie = `/* Le Mot d'or : les mots. Fichier fabriqué par outils/mot-d-or-mots.js (ne pas modifier à la main :
   changer outils/mot-d-or-solutions.txt puis relancer l'outil).
   solutions : les mots à trouver, dans l'ordre des mots du jour (le jour 0 est debut).
   acceptes : les essais acceptés, d'après le dictionnaire an-array-of-french-words (licence MIT, © 2016 Zeke Sikelianos,
   tiré de la liste de Letterpress), réduit aux mots de 6 lettres, sans accents. */
var MOTDOR_MOTS = {
  debut: "2026-10-20",
  solutions: "${ordre.join(' ')}",
  acceptes: "${acceptes.join(' ')}"
};
if (typeof module !== "undefined") module.exports = MOTDOR_MOTS;
`;
fs.writeFileSync(cible, sortie);
console.log(`${ordre.length} solutions, ${acceptes.length} essais acceptés, ${Math.round(sortie.length / 1024)} Ko`);
if (ecartes.length) console.log('écartés : ' + ecartes.join(', '));

/* La Dernière Lanterne, sous Node : combats simulés pour l'équilibrage (cahier des charges § 12.3).
   node outils/lanterne-combats.js [n]   (n combats par cas, 400 par défaut)
   Chaque cas : une équipe au niveau prévu à ce moment de l'histoire contre une rencontre ; on mesure
   les victoires, le nombre de tours et les PV perdus. Le héros joue avec choixAuto (moteur-rpg/combat.js).
   Les cas et leurs cibles sont dans CAS ; lanterne-tests.js vérifie les mêmes cibles sur moins de combats. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');

function charger() {
  const ctx = { console }; ctx.window = ctx.globalThis = ctx; vm.createContext(ctx);
  for (const f of ['moteur-rpg/regles.js', 'moteur-rpg/etat.js', 'moteur-rpg/combat.js', 'lanterne/donnees/base.js', 'lanterne/donnees/combat.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  return { M: ctx.window.MoteurRPG, J: ctx.window.LANTERNE };
}

// tirage reproductible
function hasard(graine) { let s = graine >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* equipe : ids des héros ; niveau ; objets portés dans le sac ; cible : { victoire, tours: [min, max] } */
const CAS = [
  { nom: 'Prologue : héros seul niv. 1 contre un feu follet', equipe: ['heros'], niveau: 1, monstres: ['feu_follet'], objets: { herbe: 2 }, cible: { victoire: .97, tours: [1.5, 4] } },
  { nom: 'Prologue : héros seul niv. 1 contre deux feux follets', equipe: ['heros'], niveau: 1, monstres: ['feu_follet', 'feu_follet'], objets: { herbe: 2 }, cible: { victoire: .85, tours: [2.5, 6] } },
  { nom: 'Prologue : héros seul niv. 2 contre un crapaud-cloche', equipe: ['heros'], niveau: 2, monstres: ['crapaud'], objets: { herbe: 2 }, cible: { victoire: .9, tours: [2, 5] } },
  { nom: 'Prologue : héros seul niv. 2 contre deux corbeaux', equipe: ['heros'], niveau: 2, monstres: ['corbeau', 'corbeau'], objets: { herbe: 2 }, cible: { victoire: .85, tours: [2.5, 6] } },
  { nom: 'Acte 1 : héros + Eloi niv. 3 contre deux loups', equipe: ['heros', 'eloi'], niveau: 3, monstres: ['loup', 'loup'], objets: { herbe: 3 }, cible: { victoire: .9, tours: [2.5, 6] } },
  { nom: 'Acte 1, boss : héros + Eloi + Vérène niv. 6 contre le Grand Cerf', equipe: ['heros', 'eloi', 'verene'], niveau: 6, monstres: ['grand_cerf'], objets: { herbe: 4, fiole: 2 }, cible: { victoire: .8, tours: [5, 10] } }
];

function jouerCas(M, J, cas, n, graine = 1) {
  let victoires = 0, tours = 0, pvPerdus = 0;
  for (let i = 0; i < n; i++) {
    const e = M.Etat.nouvellePartie(J, 'TEST');
    e.equipe = cas.equipe.slice();
    for (const id of e.equipe) Object.assign(e.heros[id], M.Regles.creerHeros(J, id, cas.niveau));
    e.objets = Object.assign({}, cas.objets);
    const r = M.Combat.simuler(J, e, { monstres: cas.monstres }, hasard(graine * 7919 + i));
    const pvAvant = cas.equipe.reduce((s, id) => s + r.combat.heros.find(h => h.id === id).pvMax, 0);
    const pvApres = r.combat.heros.reduce((s, h) => s + h.pv, 0);
    if (r.fin === 'victoire') { victoires++; tours += r.tours; pvPerdus += 1 - pvApres / pvAvant; }
  }
  return { victoire: victoires / n, tours: victoires ? tours / victoires : 0, pvPerdus: victoires ? pvPerdus / victoires : 0 };
}

if (require.main === module) {
  const n = +process.argv[2] || 400, { M, J } = charger();
  let ok = true;
  for (const cas of CAS) {
    const r = jouerCas(M, J, cas, n), c = cas.cible;
    const bon = r.victoire >= c.victoire && r.tours >= c.tours[0] && r.tours <= c.tours[1];
    if (!bon) ok = false;
    console.log(`${bon ? 'ok   ' : 'HORS '} ${cas.nom} : ${Math.round(r.victoire * 100)} % de victoires, ${r.tours.toFixed(1)} tours, ${Math.round(r.pvPerdus * 100)} % des PV perdus` +
      `   (cible : ≥ ${c.victoire * 100} %, ${c.tours[0]} à ${c.tours[1]} tours)`);
  }
  process.exit(ok ? 0 : 1);
}
module.exports = { charger, CAS, jouerCas, hasard };

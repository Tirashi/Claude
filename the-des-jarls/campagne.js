/* =====================================================================
   LE THÉ DES JARLS · la CAMPAGNE DES TAVERNES et le DÉFI DU JOUR
   (logique pure, sans affichage ni stockage ; préfixe jar / JAR).
   Règles validées le 21/10 (maquette 5, route du fjord) :
   - on part avec Thor, Idunn et Vidar ; 20 tavernes du plus faible des
     dieux au plus fort (mesuré par outils/jarls-simulateur.js) ; battre un
     dieu gagne sa faveur et ouvre la taverne suivante ;
   - ordinateur FACILE aux tavernes 1 à 7, NORMAL de 8 à 14, DIFFICILE de 15 à 20 ;
   - étoiles : 1 pour la victoire, 2 en gardant 8 PV, 3 en gardant 12 PV ;
   - les tavernes de Thor, Idunn et Vidar donnent une apparence (couleurs
     de l'armée) ; tous les 5 dieux battus, une unité ;
   - en duel libre, on n'emporte que des faveurs gagnées.
   État sauvegardé (jarls.campagne) : { etoiles: { dieu: 1..3 }, couleur }.
   ===================================================================== */
'use strict';
const JAR_DEPART = ['thor', 'idunn', 'vidar'];
const JAR_CHAPITRES = ['MIDGARD', 'VANAHEIM', 'JÖTUNHEIM', 'ASGARD'];
// [dieu, nom de la taverne] du plus faible au plus fort
const JAR_TAVERNES = [
  ['heimdall', 'du Corbeau'], ['idunn', 'de la Corne'], ['var', 'du Sanglier'], ['thrymr', "de l'Ancre"], ['bragi', 'du Loup gris'],
  ['brunhild', 'de la Hache'], ['odin', 'du Chaudron'], ['skadi', "de l'Ours"], ['loki', 'du Serpent'], ['skuld', 'de la Lune'],
  ['frigg', 'du Rouet'], ['mimir', 'du Puits'], ['baldr', 'de la Lumière'], ['freyja', 'du Chat'], ['tyr', 'du Pacte'],
  ['ullr', "de l'Arc"], ['vidar', 'du Silence'], ['thor', 'du Tonnerre'], ['freyr', 'de la Moisson'], ['hel', 'des Brumes'],
].map(([dieu, nom], i) => ({ dieu, nom, niveau: i < 7 ? 1 : i < 14 ? 2 : 3, chapitre: Math.floor(i / 5) }));
// couleurs de l'armée : t/T tunique, c/C cape, r motif des boucliers, b/B bannière ; dieu : la taverne qui la donne
const JAR_APPARENCES = {
  bleu:    { nom: 'Bleu du fjord',  dieu: null,    t: '#3f73d6', T: '#27498f', c: '#8a6440', C: '#5a3e26', r: '#f2ead8', b: '#1e3a7a', B: '#122a5a' },
  orage:   { nom: "Nuit d'orage",   dieu: 'thor',  t: '#2c3c70', T: '#1a2444', c: '#9aa6b8', C: '#5a6678', r: '#e8f0ff', b: '#1a2040', B: '#0e1428' },
  pommier: { nom: 'Verger d\'Idunn', dieu: 'idunn', t: '#3a8a4a', T: '#225a2c', c: '#a8803a', C: '#6a5020', r: '#f8e8a0', b: '#2a6a34', B: '#1a4a22' },
  fer:     { nom: 'Fer de Vidar',   dieu: 'vidar', t: '#46464e', T: '#26262c', c: '#7a2a20', C: '#4a1810', r: '#d8d0c0', b: '#2a2a30', B: '#18181c' },
};
// unités : gagnées tous les 5 dieux battus ; rang = rang de l'armée qu'elles changent (0 haches, 1 lances, 2 archers, -1 tous)
const JAR_UNITES = [
  { id: 'berserkers', apres: 5, rang: 0, nom: 'Berserkers', txt: 'Ton premier rang charge tête nue, en peau d\'ours.' },
  { id: 'skjaldmo', apres: 10, rang: 1, nom: 'Skjaldmö', txt: 'Les vierges au bouclier tiennent ton deuxième rang.' },
  { id: 'chasseurs', apres: 15, rang: 2, nom: 'Chasseurs d\'Ullr', txt: 'Tes archers portent le capuchon vert des chasseurs.' },
  { id: 'garde', apres: 20, rang: -1, nom: 'Garde du jarl', txt: 'Toute ton armée porte le casque doré.' },
];
const jarEtoiles = pv => pv >= 12 ? 3 : pv >= 8 ? 2 : 1;

function jarCampagne(s) {
  const c = { etoiles: {}, couleur: 'bleu' };
  if (s && typeof s === 'object') {
    for (const t of JAR_TAVERNES) { const n = Number(s.etoiles && s.etoiles[t.dieu]) || 0; if (n > 0) c.etoiles[t.dieu] = Math.min(3, Math.round(n)); }
    if (JAR_APPARENCES[s.couleur]) c.couleur = s.couleur;
  }
  if (!jarApparences(c).includes(c.couleur)) c.couleur = 'bleu';
  return c;
}
const jarBattus = c => JAR_TAVERNES.filter(t => c.etoiles[t.dieu] > 0).length;
const jarTotalEtoiles = c => JAR_TAVERNES.reduce((n, t) => n + (c.etoiles[t.dieu] || 0), 0);
const jarOuverte = (c, i) => i === 0 || (c.etoiles[JAR_TAVERNES[i - 1].dieu] || 0) > 0;
// la taverne à défier : la première pas encore gagnée (ou null quand tout est fait)
const jarProchaine = c => { const i = JAR_TAVERNES.findIndex(t => !c.etoiles[t.dieu]); return i < 0 ? null : i; };
const jarFaveursGagnees = c => JAR_IDS.filter(id => JAR_DEPART.includes(id) || c.etoiles[id] > 0);
const jarApparences = c => Object.keys(JAR_APPARENCES).filter(k => !JAR_APPARENCES[k].dieu || c.etoiles[JAR_APPARENCES[k].dieu] > 0);
const jarUnites = c => JAR_UNITES.filter(u => jarBattus(c) >= u.apres);
// ce que rapporte la taverne i : { faveur } ou { apparence }, et { unite } à chaque 5e taverne
function jarRecompense(i) {
  const d = JAR_TAVERNES[i].dieu, r = {};
  if (JAR_DEPART.includes(d)) r.apparence = Object.keys(JAR_APPARENCES).find(k => JAR_APPARENCES[k].dieu === d);
  else r.faveur = d;
  return r;
}
// une victoire contre le dieu de la taverne i avec pv restants : met à jour c, renvoie ce qui est nouveau
function jarVictoire(c, i, pv) {
  const d = JAR_TAVERNES[i].dieu, avant = c.etoiles[d] || 0, e = jarEtoiles(pv), battusAvant = jarBattus(c);
  const out = { etoiles: e, mieux: e > avant, premiere: !avant };
  if (e > avant) c.etoiles[d] = e;
  if (!avant) {
    Object.assign(out, jarRecompense(i));
    const u = JAR_UNITES.find(x => x.apres === battusAvant + 1);
    if (u) out.unite = u.id;
  }
  return out;
}

/* ---------- défi du jour ----------
   j = AAAAMMJJ (date locale) : même dieu, mêmes faveurs, mêmes dés pour toute la famille, en NORMAL. */
function jarDuJour(j) {
  const R = jarRng(j, 'jour'), dieu = JAR_TAVERNES[Math.floor(R() * 20)].dieu, pool = JAR_IDS.slice(), f = [];
  while (f.length < 3) { const k = Math.floor(R() * pool.length); f.push(pool.splice(k, 1)[0]); }
  return { dieu, faveurs: f, niveau: 2 };
}
// score du jour (plus haut = mieux) : victoire 1000 + 50 par PV gardé − 10 par manche ; sinon 20 par PV pris au dieu
function jarScoreJour(etat) {
  const f = etat.fin, a = etat.camps[0], b = etat.camps[1];
  if (f && f.gagnant === 0) return 1000 + 50 * a.pv - 10 * f.manche;
  return 20 * (JAR_PV - Math.max(0, b.pv));
}

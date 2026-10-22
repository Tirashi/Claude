/* Moteur RPG — le monde (testable sous Node, sans DOM) : cartes en grilles de caractères, cases bloquées,
   sorties, déclencheurs, objets, habitants, équipe en file et monstres qui errent.

   Une carte (données du jeu) :
     { id, nom, musique, exterieur, brume,
       legende: { 'T': { sol: 'herbe', decor: 'arbre', bloque: true }, … }   (s'ajoute à la légende commune)
       plan: [ 'TTTT…', … ]                          une lettre par case, toutes les lignes de même longueur
       maisons:   [{ x, y, l, p, h, mur, toit, porte: dx }]  la porte est sur la rangée du bas, à x + dx
       objets:    [{ type: 'coffre' | 'panneau' | 'lanterne' | 'deco', x, y, … }]  (bloquent le passage)
       pnj:       [{ id, perso, x, y, evenement, erre, si, cache }]   erre : rayon de promenade (0 : immobile) ;
                  cache : n'apparaît que par la commande { pnj, montrer } d'un événement ;
                  anim : son geste quand il ne marche pas (ex. 'attaque'), sinon il respire
       sorties:   [{ x, y, vers, a: [x, y], dir }]   x peut être un intervalle [x1, x2]
       declencheurs: [{ x, y, evenement, si }]       lancé quand le chef de file arrive sur la case
       monstres:  [{ type, x, y, rayon }]
       entree: 'evenement'                            lancé à chaque arrivée sur la carte } */
(function (M) {
  const DIRS = { haut: [0, -1], bas: [0, 1], gauche: [-1, 0], droite: [1, 0] };
  const OPPOSE = { haut: 'bas', bas: 'haut', gauche: 'droite', droite: 'gauche' };

  const dans = (v, a) => Array.isArray(a) ? v >= a[0] && v <= a[1] : v === a;

  function preparer(def, legendeCommune) {
    const legende = Object.assign({}, legendeCommune, def.legende || {});
    const h = def.plan.length, l = def.plan[0].length;
    const cases = [], bloque = [];
    def.plan.forEach((ligne, y) => {
      if (ligne.length !== l) throw new Error(`${def.id} : la ligne ${y} fait ${ligne.length} cases au lieu de ${l}`);
      cases.push([]); bloque.push([]);
      for (let x = 0; x < l; x++) {
        const c = legende[ligne[x]];
        if (!c) throw new Error(`${def.id} : lettre « ${ligne[x]} » inconnue (ligne ${y}, colonne ${x})`);
        cases[y].push(c); bloque[y].push(!!c.bloque);
      }
    });
    const portes = [];
    for (const m of def.maisons || []) {
      for (let y = m.y; y < m.y + m.p; y++) for (let x = m.x; x < m.x + m.l; x++) if (bloque[y]) bloque[y][x] = true;
      if (m.porte !== undefined) { const px = m.x + m.porte, py = m.y + m.p - 1; bloque[py][px] = false; portes.push([px, py]); }
    }
    for (const o of def.objets || []) if (o.bloque !== false) bloque[o.y][o.x] = true;
    return { id: def.id, def, l, h, cases, bloque, portes };
  }

  const dehors = (c, x, y) => x < 0 || y < 0 || x >= c.l || y >= c.h;
  // autres : positions occupées en ce moment (habitants, monstres)
  function estBloque(c, x, y, autres = []) {
    if (dehors(c, x, y) || c.bloque[y][x]) return true;
    return autres.some(o => o.x === x && o.y === y);
  }
  const sortieEn = (c, x, y) => (c.def.sorties || []).find(s => dans(x, s.x) && dans(y, s.y)) || null;
  // test(condition) : vrai si la condition du déclencheur est remplie (voir Evenements.condition)
  const declencheurEn = (c, x, y, test = () => true) => (c.def.declencheurs || []).find(d => dans(x, d.x) && dans(y, d.y) && (!d.si || test(d.si))) || null;
  const objetEn = (c, x, y) => (c.def.objets || []).find(o => o.x === x && o.y === y) || null;
  const devant = (x, y, dir) => [x + DIRS[dir][0], y + DIRS[dir][1]];

  /* L'équipe en file : le chef avance, chacun des suivants prend la place de celui qui le précède.
     file : positions des suivants, du plus proche au plus loin. */
  function avancerFile(file, ancienneTete) {
    if (!file.length) return file;
    return [{ x: ancienneTete.x, y: ancienneTete.y, dir: ancienneTete.dir }].concat(file.slice(0, -1));
  }
  const fileGroupee = (n, x, y, dir) => Array.from({ length: n }, () => ({ x, y, dir }));

  /* Un pas de monstre qui erre : une direction au hasard (ou rester), sans s'éloigner de plus de « rayon »
     de son point de départ ni marcher sur une case bloquée. hasard() renvoie un nombre dans [0, 1[. */
  function pasErrant(m, c, hasard, autres = []) {
    const choix = ['haut', 'bas', 'gauche', 'droite', null][Math.floor(hasard() * 5)];
    if (!choix) return null;
    const [x, y] = devant(m.x, m.y, choix);
    if (Math.abs(x - m.ox) > m.rayon || Math.abs(y - m.oy) > m.rayon) return null;
    if (estBloque(c, x, y, autres) || sortieEn(c, x, y)) return null;
    return { x, y, dir: choix };
  }

  /* Qui commence le combat (§ 8.3) : toucher un monstre par derrière donne l'initiative aux héros ;
     un monstre qui fonce sur le chef de file par derrière le surprend. */
  function initiative(dirChef, dirMonstre, quiBouge) {
    if (quiBouge === 'heros') return dirChef === dirMonstre ? 'heros' : 'normal';
    return dirChef === dirMonstre ? 'monstre' : 'normal';
  }

  M.Monde = { DIRS, OPPOSE, preparer, estBloque, sortieEn, declencheurEn, objetEn, devant, avancerFile, fileGroupee, pasErrant, initiative };
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? (window.MoteurRPG = window.MoteurRPG || {}) : (globalThis.MoteurRPG = globalThis.MoteurRPG || {}));

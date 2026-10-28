/* Moteur RPG — règles chiffrées (testable sous Node, sans DOM) : cahier des charges § 9.
   Classes : { depart: {pv, pm, for, def, mag, vit}, gain: {…}, critique } ; les demi-points s'accumulent
   et on affiche l'arrondi. Équipement : objets du jeu avec equip: { emplacement, classes, for, def, mag, vit }.
   Le hasard (rng) est toujours passé en paramètre (Math.random en jeu, un tirage fixe dans les tests). */
(function (M) {
  const STATS = ['pv', 'pm', 'for', 'def', 'mag', 'vit'];
  const EMPLACEMENTS = ['arme', 'armure', 'accessoire'];
  const ELEMENTS = ['feu', 'glace', 'foudre', 'lumiere'];

  // valeurs d'une classe à un niveau : départ + gain × (niveau − 1), arrondi vers le bas
  function statsDeClasse(classe, niveau) {
    const s = {};
    for (const k of STATS) s[k] = Math.floor(classe.depart[k] + classe.gain[k] * (niveau - 1));
    return s;
  }

  // expérience pour passer du niveau n au niveau n + 1 (§ 9.3)
  const xpPourNiveau = n => 8 * n * n;
  const NIVEAU_MAX = 30;

  function creerHeros(jeu, id, niveau) {
    const h = jeu.heros[id], s = statsDeClasse(jeu.classes[h.classe], niveau);
    return { id, classe: h.classe, niveau, xp: 0, pv: s.pv, pvMax: s.pv, pm: s.pm, pmMax: s.pm, for: s.for, def: s.def, mag: s.mag, vit: s.vit,
      equipement: Object.assign({ arme: null, armure: null, accessoire: null }, h.equipement || {}), etats: {} };
  }

  // stats avec l'équipement porté (sans les effets passagers du combat)
  function statsEquipees(jeu, h) {
    const s = { for: h.for, def: h.def, mag: h.mag, vit: h.vit, pvMax: h.pvMax, pmMax: h.pmMax };
    for (const e of EMPLACEMENTS) {
      const ob = h.equipement && h.equipement[e] && jeu.objets[h.equipement[e]];
      if (ob && ob.equip) for (const k of ['for', 'def', 'mag', 'vit']) s[k] += ob.equip[k] || 0;
    }
    return s;
  }
  // un héros peut-il porter cet objet ?
  const peutPorter = (jeu, h, id) => { const e = jeu.objets[id] && jeu.objets[id].equip; return !!e && (!e.classes || e.classes.includes(h.classe)); };

  /* Dégâts d'une attaque à l'arme : FOR − DEF ÷ 2, ± 10 %, au moins 1.
     Un coup critique fait × 1,5 (règle du 25/10 : avant, il ignorait la Défense, et un critique de monstre
     faisait 2 à 5 fois un coup normal). perce : coup qui ignore la Défense (talent à coup critique assuré). */
  function degatsArme(force, defense, rng, critique = false, mult = 1, perce = false) {
    const base = (perce ? force : force - defense / 2) * (critique ? 1.5 : 1);
    return Math.max(1, Math.round(base * (.9 + .2 * rng()) * mult));
  }
  // sort offensif : puissance + MAG ÷ 2, ± 10 %, × l'élément (faible 1,5, résistant 0,5) ; la Défense ne compte pas
  function degatsSort(puissance, magie, rng, element = 1) {
    return Math.max(1, Math.round((puissance + magie / 2) * (.9 + .2 * rng()) * element));
  }
  const soin = (puissance, magie) => puissance + magie;
  // multiplicateur d'un élément sur un monstre : elements = { feu: 1.5, glace: .5 }
  const multElement = (elements, element) => (element && elements && elements[element]) || 1;

  const chanceCritique = classe => (classe && classe.critique) || 1 / 16;
  // ordre du tour : VIT + un petit hasard (0 à VIT ÷ 4)
  const tirageOrdre = (vit, rng) => vit + Math.floor(rng() * (Math.floor(vit / 4) + 1));
  // esquive : 3 % de base + 1 % par point de VIT au-dessus de l'attaquant, plafonnée à 25 %
  const chanceEsquive = (vitDefenseur, vitAttaquant) => Math.min(.25, .03 + Math.max(0, vitDefenseur - vitAttaquant) * .01);
  // fuite : 50 % + 5 % par point de VIT au-dessus du monstre le plus rapide (entre 10 et 95 %)
  // trop lent pour fuir : le monstre le plus rapide a ECART_FUITE points de VIT de plus que le héros le plus rapide
  const ECART_FUITE = 5;
  const fuitePossible = (vitHeros, vitMonstre) => vitMonstre - vitHeros < ECART_FUITE;
  const chanceFuite = (vitHeros, vitMonstre) => Math.max(.1, Math.min(.95, .5 + (vitHeros - vitMonstre) * .05));

  // talents connus d'une classe à un niveau (talents : { id: { classe, niveau, … } })
  const talentsConnus = (talents, classe, niveau) => Object.keys(talents).filter(id => talents[id].classe === classe && talents[id].niveau <= niveau);

  /* Gagner de l'expérience. Renvoie les passages de niveau : [{ niveau, avant, apres, talents }].
     Chaque passage remplit les PV et les PM (§ 9.3). */
  function gagnerXp(jeu, h, xp) {
    const passages = [];
    if (h.niveau >= NIVEAU_MAX) return passages;
    h.xp += xp;
    while (h.niveau < NIVEAU_MAX && h.xp >= xpPourNiveau(h.niveau)) {
      h.xp -= xpPourNiveau(h.niveau);
      const avant = { pv: h.pvMax, pm: h.pmMax, for: h.for, def: h.def, mag: h.mag, vit: h.vit };
      const ancien = talentsConnus(jeu.talents || {}, h.classe, h.niveau);
      h.niveau++;
      const s = statsDeClasse(jeu.classes[h.classe], h.niveau);
      Object.assign(h, { pvMax: s.pv, pmMax: s.pm, for: s.for, def: s.def, mag: s.mag, vit: s.vit, pv: s.pv, pm: s.pm });
      const apres = { pv: h.pvMax, pm: h.pmMax, for: h.for, def: h.def, mag: h.mag, vit: h.vit };
      const nouveaux = talentsConnus(jeu.talents || {}, h.classe, h.niveau).filter(t => !ancien.includes(t));
      passages.push({ niveau: h.niveau, avant, apres, talents: nouveaux });
    }
    if (h.niveau >= NIVEAU_MAX) h.xp = 0;
    return passages;
  }

  M.Regles = { STATS, EMPLACEMENTS, ELEMENTS, NIVEAU_MAX, statsDeClasse, xpPourNiveau, creerHeros, statsEquipees, peutPorter,
    degatsArme, degatsSort, soin, multElement, chanceCritique, tirageOrdre, chanceEsquive, chanceFuite, fuitePossible, ECART_FUITE, talentsConnus, gagnerXp };
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? (window.MoteurRPG = window.MoteurRPG || {}) : (globalThis.MoteurRPG = globalThis.MoteurRPG || {}));

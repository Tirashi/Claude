/* Moteur RPG — règles des statistiques (testable sous Node). La session 2 y ajoutera les dégâts,
   les éléments, les états, la fuite et l'expérience (cahier des charges, § 9).
   Classes : { depart: {pv, pm, for, def, mag, vit}, gain: {…} } ; les demi-points s'accumulent
   et on affiche l'arrondi. */
(function (M) {
  const STATS = ['pv', 'pm', 'for', 'def', 'mag', 'vit'];

  // valeurs d'une classe à un niveau : départ + gain × (niveau − 1), arrondi vers le bas
  function statsDeClasse(classe, niveau) {
    const s = {};
    for (const k of STATS) s[k] = Math.floor(classe.depart[k] + classe.gain[k] * (niveau - 1));
    return s;
  }

  // expérience pour passer du niveau n au niveau n + 1 (§ 9.3)
  const xpPourNiveau = n => 8 * n * n;

  function creerHeros(jeu, id, niveau) {
    const h = jeu.heros[id], s = statsDeClasse(jeu.classes[h.classe], niveau);
    return { id, classe: h.classe, niveau, xp: 0, pv: s.pv, pvMax: s.pv, pm: s.pm, pmMax: s.pm, for: s.for, def: s.def, mag: s.mag, vit: s.vit };
  }

  M.Regles = { STATS, statsDeClasse, xpPourNiveau, creerHeros };
  if (typeof module !== 'undefined') module.exports = M;
})(typeof window !== 'undefined' ? (window.MoteurRPG = window.MoteurRPG || {}) : (globalThis.MoteurRPG = globalThis.MoteurRPG || {}));

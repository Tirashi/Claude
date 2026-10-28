// Sauvegarde locale (localStorage), au format versionné. Pour l'instant : la méta-progression
// (ravitaillement accumulé pour la forteresse, nombre de runs). Une sauvegarde d'une autre
// version est ignorée : à migrer ici quand le format changera.
(() => {
  'use strict';
  const KEY = 'resistance.save';
  const VERSION = 1;

  // upgrades : niveau de chaque bâtiment de la forteresse ({ barracks: 1, … })
  // gold : trésor de la rébellion (part de l'or gardée en fin de run)
  // wins : pays libérés (records sur l'accueil de la Ludothèque)
  const defaultMeta = () => ({ supplies: 0, gold: 0, runs: 0, wins: 0, upgrades: {} });

  function loadMeta() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY));
      if (data?.version === VERSION) return { ...defaultMeta(), ...data.meta };
    } catch { /* stockage indisponible ou illisible : on repart de zéro */ }
    return defaultMeta();
  }

  function saveMeta(meta) {
    try {
      localStorage.setItem(KEY, JSON.stringify({ version: VERSION, meta }));
    } catch { /* navigation privée, quota… : la partie continue sans sauvegarde */ }
  }

  Object.assign(Resistance, { loadMeta, saveMeta });
})();

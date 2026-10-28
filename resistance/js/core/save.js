// Sauvegarde locale (localStorage), au format versionné : la méta-progression (ravitaillement
// accumulé pour la forteresse, nombre de runs) et la run en cours (reprise si le téléphone ferme
// le jeu). Une sauvegarde d'une autre version est ignorée : à migrer ici quand le format changera.
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

  // Run en cours (Run.toSave) : écrite à chaque étape, effacée en fin de run
  const RUN_KEY = 'resistance.run';
  const RUN_VERSION = 1;

  function loadRun() {
    try {
      const data = JSON.parse(localStorage.getItem(RUN_KEY));
      if (data?.version === RUN_VERSION) return data.run;
    } catch { /* illisible : pas de reprise */ }
    return null;
  }

  function saveRun(run) {
    try {
      localStorage.setItem(RUN_KEY, JSON.stringify({ version: RUN_VERSION, run }));
    } catch { /* la run continue sans sauvegarde */ }
  }

  function clearRun() {
    try { localStorage.removeItem(RUN_KEY); } catch { /* rien à faire */ }
  }

  Object.assign(Resistance, { loadMeta, saveMeta, loadRun, saveRun, clearRun });
})();

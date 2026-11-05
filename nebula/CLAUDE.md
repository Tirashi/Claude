# Nebula — notes pour Claude
Rogue-lite tactique spatial. Cahier des charges : [`specs/nebula.md`](../specs/nebula.md) (détails et historique en fin de fichier).
- `regles.js` : logique pure (combat, IA, carte, comptoir, score, `RUN_V` + `migrate()`), sans DOM ni `localStorage`, aussi chargée par Node ; `// @ts-check` + JSDoc (tsc dans `verifications.js` : garder les typedefs à jour).
- `evenements.js` : textes des épaves et nébuleuses (données). `vaisseaux.js` : moteur de sprites en relief, **partagé** (Escadrille !, Mineur de l'espace). `sons.js` : bruitages synthétisés. `jeu.js` : affichage, commandes, sauvegarde. `cartouche.jpg` : image de la cartouche.
- Tests : `window.Nebula` (`simulate`, `makeCombat`, `makeMap`, `newRun`, `migrate`, `crash`, `run`…). Outils : `outils/nebula-simulateur.js` (dans `verifications.js`), `nebula-parties.js`, `nebula-flottes.js`, `tsconfig.nebula.json`.
- Sauvegardes `nebula.run` (à chaque action ; illisible → `nebula.run.bak`), `nebula.compo`, `nebula.tuto` ; classements `nebula` : `best`, `daily:AAAAMMJJ`, `victoires`.

## Pièges
- `regles.js` et `jeu.js` partagent la même portée globale (scripts classiques) ; ajouter un champ à la partie = monter `RUN_V` et compléter `migrate()`.
- `txt()` resserre un texte trop large (polices plus larges sur le téléphone) : passer `maxW` pour une longue phrase.
- Fluidité : fonds agrandis une fois (`drawBg`, `drawStatic`), 2 pixels max par pixel logique ; double définition (`setScale(2)`) seulement sur ordinateur.
- Une erreur affiche l'écran INCIDENT au lieu de figer le jeu.

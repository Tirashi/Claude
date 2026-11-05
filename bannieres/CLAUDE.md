# Bannières — notes pour Claude
Conquête en 3D pour un enfant de 7 ans. Cahier des charges : [`specs/bannieres.md`](../specs/bannieres.md) (détails en fin de fichier).
- Three.js r128 + `lib/GLTFLoader.js` + `lib/SkeletonUtils.js`. Modèles KayKit (CC0) : `modeles.js` (géométries en base64, atlas en `data:`) et `personnages.js` (GLB en base64, animations), recolorés par seigneur.
- **Logique pure, aussi sous Node** (`outils/bannieres-simulateur.js`, dans `verifications.js`) : `regles.js` (état JSON, grille de rayon 3 ou 4, hasard `banRng(graine, usage, a, b)`, `banSimuler`, `banResoudre`), `surprises.js`, `ia.js` (`banIaGerer`, `banIaCoup`, `banIaJouer`).
- **Navigateur** : `interface.js` (pixel art, `boite`, `demander`), `carte3d.js` (objets 3D des armées dans `OBJ`, hors de l'état), `bataille3d.js` (bataille réglée d'abord puis rejouée ; horloge propre pour VITE), `sons.js` (`Sons`), `jeu.js`, `style.css`.
- Sauvegardes `bannieres.run`, `.opts`, `.best`, `.tuto`, `.stats` (parties, gagnées). Classement `bannieres` / `best` (drapeaux à la fin, petite carte seulement).
- Tests : `window.Bannieres` (`etat`, `ecran`, `occupe`, `nouvelle`, `deplacer`, `finTour`, `construire`…).

## Pièges
- Leçons de Bannières dans le mémo ([`specs/ludotheque.md`](../specs/ludotheque.md)) : modèles glTF dans un artefact (`fetch` interdit sur `data:`), toucher qui traverse une fenêtre, matière « skinning » partagée, `page.evaluate` qui attend une promesse.

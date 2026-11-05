# Le Thé des Jarls — notes pour Claude
Duel de dés viking façon Orlog. Cahier des charges : [`specs/the-des-jarls.md`](../specs/the-des-jarls.md) (détails en fin de fichier).
- Canvas 2D pour le champ de bataille HD-2D, menus en HTML (Cinzel, Fredoka).
- `regles.js` : état JSON, 20 faveurs, bataille rendue en liste d'événements, dés imposables pour le guide.
- `ia.js` : style et main de chaque dieu, faveur choisie en simulant la bataille, niveaux 1 à 3.
- `campagne.js` : 20 tavernes, étoiles, couleurs, unités, défi du jour `jarDuJour`, score `jarScoreJour`.
- `decor.js` : champ de bataille (45 soldats par armée, `ARMEES[s]`). `dieux.js` : portraits 44 × 52 et médaillons. `sons.js` : `JarSons`. `guide.js` : duel guidé de Sigrid, livre du skalde. `jeu.js`, `style.css`.
- Sauvegardes `jarls.*` : `run`, `dailyRun`, `dailyTry`, `daily`, `campagne`, `faveurs`, `niveau`, `guide`, `parties`, `sons`. Classements `jarls` : `etoiles`, `daily:AAAAMMJJ` (plus haut).
- Simulateur `outils/jarls-simulateur.js` (dans `verifications.js`). Tests : `window.Jarls`.

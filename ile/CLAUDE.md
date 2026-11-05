# La colonie (`ile/`) — notes pour Claude
Petit Banished au tour par tour en paysage (640 × 360), remplace l'Île des naufragés (retirée le 16/10 ; icône `palm` gardée). Cahier des charges : [`specs/colonie.md`](../specs/colonie.md) (détails en fin de fichier). Pas encore sur l'accueil ni dans les classements.
- `regles.js` : logique pure aussi chargée par Node (île à graine, lieux, bâtiments, postes, saisons, champs, bois, gibier, outils, logement, faim et froid, naissances, recherche, score, `RUN_V` + `migrate()`).
- `jeu.js` + `index.html` + `style.css` : affichage (décor agrandi une fois, colons animés, 30 images/s puis 10 au repos).
- Tests : `window.Ile` (règles + `run`, `nextWeek`, `openSheet`, `startRun`, `selectTile`). Pilote automatique : `node outils/ile-colonie.js [parties] [années] [graine] [détail]`.
- Sauvegarde `ile.run`, records `ile.best` (`score`, `annees`, `population`).

## Pièges
- Même portée globale entre `regles.js` et `jeu.js` (scripts classiques) : pas de DOM dans `regles.js`.
- Ajouter un champ à la partie = monter `RUN_V` et compléter `migrate()`.

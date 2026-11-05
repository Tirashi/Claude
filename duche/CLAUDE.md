# Duché — notes pour Claude
Petit 4X au tour par tour sur 37 hexagones en pixel art 32 bits. Cahier des charges : [`specs/duche.md`](../specs/duche.md) (détails en fin de fichier).
- Canvas 2D : scène en 216 × 384 agrandie sans lissage, textes écrits ensuite sur la toile fine (Press Start 2P, Rajdhani 700) ; menus en HTML.
- **Logique pure, aussi sous Node** (`outils/duche-simulateur.js`, vm, même contexte, dans `verifications.js`) : `regles.js` (état JSON, hasard par flux `ducRng(graine, usage, a, b)`, difficultés `DUC_NIVEAUX`), `evenements.js` (`DUC_EVENEMENTS`, `ducTirerEvenement`, `ducRepondre`), `ia.js` (`ducIaJouer`, scores d'utilité ; aussi le joueur automatique).
- **Navigateur** : `decor.js` (`DucDecor` : carte avec saisons, scènes HD-2D, illustrations), `sons.js` (`DucSons`, modèle de `the-des-jarls/sons.js`), `jeu.js`, `style.css`.
- Sauvegardes `duche.run`, `.dailyRun`, `.dailyTry` (posé dès le départ : mission), `.daily`, `.best`, `.opts`, `.tuto`. Classements `duche` : `best` (normal seulement, Duché du jour compris), `daily:AAAAMMJJ` (plus haut).
- Tests : `window.Duche` (`libre`, `jour`, `choisir`, `attaquer`, `finTour`, `repondre`, `finCombat`, `passerRivaux`, `etat`, `ecran`).

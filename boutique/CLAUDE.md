# La Boutique de cartes — notes pour Claude
Gestion d'une boutique de cartes sur 52 semaines, en 3D. Cahier des charges : [`specs/boutique-de-cartes.md`](../specs/boutique-de-cartes.md) (détails en fin de fichier).
- **Logique pure, aussi sous Node** (`outils/boutique-simulateur.js`, dans `verifications.js`) : `regles.js` (état JSON, hasard `bouRng(graine, usage, a, b)`, lundi → semaine → dimanche, grossiste, vitrines, rayons, meubles, clients, prêt, valeur), `cartes.js` (`bouCatalogue` : 5 extensions de 40 cartes, cotes, boosters), `clients.js` (affluence, visites, tournoi, rencontres, événements).
- **Images** : `monstres.js` + `monstres.png` (155 monstres Dungeon Crawl, `outils/boutique-monstres.py`), `modeles.js` et `images.js` (`outils/boutique-modeles.py`), `dessin-cartes.js` (`BouCartes`).
- **Navigateur** : `monde3d.js` (`BouMonde` : boutique, meubles, clients qui rejouent `bouJour`), `lundi.js` (`BouLundi(ctx)`, écrans du lundi), `guide.js` (`BouGuide`, semaine guidée), `sons.js` (`BouSons`), `jeu.js` (`Boutique` : titre, menu), `style.css`.
- Sauvegardes `boutique.run` (le lundi), `.opts`, `.best`, `.stats` (`parties`, `finies`, `faillites`), `.guide`. Classement `boutique` / `best` (valeur de la boutique, moitié en cas de faillite).
- Tests : `window.Boutique` (`ecran`, `nouvelle`, `continuer`, `titre`, `menu`, `lundi.ouvrir('grossiste' | 'rayons' | 'vitrines' | 'boosters' | 'classeur' | 'tournoi')`, `guide.lancer()`).

## Pièges
- Artefact : Three.js chargé depuis cdnjs.

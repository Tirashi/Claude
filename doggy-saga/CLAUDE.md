# Doggy Saga — notes pour Claude
Trois en ligne façon Candy Crush pour toute la famille. Cahier des charges : [`specs/doggy-saga.md`](../specs/doggy-saga.md) (détails en fin de fichier).
- Canvas 2D (360 de large, 600 à 820 de haut) + menus HTML (Baloo 2).
- `regles.js` : logique pure, aussi sous Node (`dogNouvelle`, `dogCoup` règle tout le coup et rend une liste d'événements ; `dogJour(AAAAMMJJ)`).
- `niveaux.js` : 60 niveaux, fabriqué par `outils/doggy-saga-niveaux.js` avec le joueur automatique `outils/doggy-saga-joueur.js`.
- `chiens.js` (`DogDessin`, 16 portraits vectoriels, `COULEURS`), `sons-chiens.js` (vrais sons CC0 en base64 : seuls `ouaf-e` et `mignon-05` gardés), `sons.js` (`DogSons.jouer`, `CHOIX` ; banc `maquettes/doggy-saga-sons.html`), `jeu.js` (rejoue les événements en animation), `style.css`.
- Sauvegardes `doggysaga.progres` { etoiles, scores, album }, `.daily`, `.dailyTry` (posé dès le départ), `.son`, `.sons`. Classements `doggysaga` : `etoiles`, `daily:AAAAMMJJ` (le plus de câlins).
- Simulateur `outils/doggy-saga-simulateur.js` (dans `verifications.js`). Tests : `window.DoggySaga` (`lancer(id)`, `jouer(a, b)`, `introJour`, `lancerJour(classe)`, `auj`, `etat`, `partie`, `ecran`, `occupe`, `vite = true`, `progres`).

## Pièges
- La grille visible est resynchronisée à chaque fin de coup : `partie.desync` doit rester 0.
- Toiles préparées vidées par Android en arrière-plan : leçon dans le mémo ([`specs/ludotheque.md`](../specs/ludotheque.md)).

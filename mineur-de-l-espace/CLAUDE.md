# Mineur de l'espace — notes pour Claude
Minage spatial + gestion + auto battler en canvas. Cahier des charges : [`specs/mineur-de-l-espace.md`](../specs/mineur-de-l-espace.md) (détails et historique en fin de fichier).
- `regles.js` : état JSON, hasard `mdeRng`, préfixe `mde` / `MDE_`, sans dessin ; chargé par `outils/mineur-simulateur.js` (dans `verifications.js`).
- `jeu.js` : classe `Partie` (vol, quai, panneau, titre, pause, rendu à la résolution de l'écran). `combat.js` : aliens en direct, flottes, escadrille, bataille finale.
- `planetes.js` : shaders Deep-Fold en WebGL 2. `chantier.js` + `station.js` : corvettes, roches, station et drones faits avec `nebula/vaisseaux.js` (**partagé**, en secours).
- `sprites.js` : sprites des packs Zoser et Cute SCKR, fabriqué par `outils/mineur-sprites.py` (packs hors dépôt). `sons.js` : `MineurSons`, synthétisés. `icone.png`.
- Sauvegarde `mineur-de-l-espace` (l'état entier), réglages `mineur-de-l-espace.commandes`, `.sons`, `.vibre`. Pas de classement. Transfert : la partie la plus avancée.
- Tests : `window.Mineur` (`partie`, `etat`).

## Pièges
- Ne pas modifier `nebula/vaisseaux.js` pour ce jeu : il sert aussi à Nebula et à Escadrille !.
- Crédits des packs dans `credits/index.html` (`planetes.js` et `sprites.js` y sont cités).

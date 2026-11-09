# Terres franches — notes pour Claude
Colonie incrémentale en temps réel. Session 1 = l'ère 1 (campement → hameau → village → Charte du Village). Cahier des charges : [`specs/terres-franches.md`](../specs/terres-franches.md).
- `donnees.js` (`window.TerresDonnees`) : **tous les nombres** (ressources, métiers, bâtiments et leurs affinités `pres`, statuts, Loi, besoins, hors ligne).
- `carte.js` (`window.TerresCarte`, aussi sous Node) : la vallée en texte (`GRILLE`, case = 32 px), terrains 3 × 3 (`LOTS`, étiquettes `fertile`/`pre`), `proposer(S, b)` (emplacement logique), `porte`, `routes(S)` (rues dans l'ordre de construction, A* qui préfère les rues et les lignes droites), `postes(S, métier)`.
- `regles.js` (`window.TerresRegles`, aussi sous Node) : `creer`, `pas(S, dt, eff)`, ordres (`toucher`, `recruter`, `affecter`, `construire(S, b, lot)`, `deplacer`, `monterStatut`, `promulguer`) qui renvoient une erreur ou null, `taux`, `moral`, `horsLigne` (quart de la production, 4 h au plus), `sauver`/`charger`, `robot`.
- `jeu.js` (`window.Terres`) : dessin, villageois (`AG`), caméra, toucher, sauvegarde `terres.partie`. `ecran.js` (`window.TerresEcran`) : barre, volets, bulle, choix du terrain, menus. `vie.js` (`window.TerresVie`) : saisons, nuit, météo, animaux, enfants (décor seulement).
- Images : `img/decor.png` + `atlas.js`, `img/villageois.png` + `villageois.js`, `img/ui-*.png`, fabriqués par `python3 -I outils/terres-maquette/atlas.py <SCKR> <icônes> <villageois LPC> <animaux>` (packs hors du dépôt : skill packs-itch).
- **PC** (≥ 900 px, `grand` et `COLONNE` = 384 dans `jeu.js`, `@media` à la fin de `style.css`) : volets dans une colonne à droite, la caméra se cadre à sa gauche (`borner`, `viser`, `zoomDepart`) ; clavier dans `jeu.js` (flèches/ZQSD par `e.code`, + −) et `ecran.js` (1 2 3, Échap, Entrée) ; survol souris = `#info`.
- Tests : `outils/terres-simulateur.js` (règles, carte, robot ; dans `verifications.js`), bloc dans `fumee.js`.

## Pièges
- Une lettre minuscule de `GRILLE` = un terrain : la tente est `^`, pas `t`. Garder des ruelles (le moulin s'est retrouvé enfermé entre les champs et le lac).
- Le pionnier est `AG[0]` (rangée `PIONNIER` de `villageois.png`, `rang(i)`) ; `PI` ne se dessine qu'avant le premier villageois. Planches LPC des bêtes : chien et chat, ligne 0 = vers la droite.
- Stock : `R.capacite(S, r)` = `STOCK.base` × 2^niveau du gardien (grenier / aire, `stock` dans BATIMENTS) ; un bâtiment à `niveaux` s'agrandit sur place (chantier `agrandit`). Hiver : `R.hiver(S)` (même calcul que `vie.js`).
- Changer un nombre : relancer le simulateur (cibles du cahier vérifiées). Changer la carte : les contrôles de la carte (portes reliées, pas de détour).

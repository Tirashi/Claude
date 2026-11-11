# Terres franches — notes pour Claude
Colonie incrémentale en temps réel, ère 1 (campement → hameau → village → Charte). Cahier des charges : [`specs/terres-franches.md`](../specs/terres-franches.md).
- `donnees.js` (`window.TerresDonnees`) : **tous les nombres** (ressources, métiers, bâtiments, affinités `pres`, statuts, Loi, pillards `RAIDS`).
- `carte.js` (`window.TerresCarte`, aussi sous Node) : la vallée en texte (`GRILLE`, case = 32 px), `LOTS`, `proposer`, `porte`, `routes(S)`, `postes`.
- `regles.js` (`window.TerresRegles`, aussi sous Node) : `creer`, `pas`, ordres (erreur ou null), `taux`, `moral`, pillards (`S.raid`, `S.raids`, `S.blesses`), `horsLigne`, `charger`, `robot`.
- `jeu.js` (`window.Terres`) : dessin, villageois (`AG`), caméra, toucher, sauvegarde `terres.partie`. `ecran.js` : barre, volets, bulle, menus. `vie.js` : saisons, nuit, météo, bêtes, enfants.
- Images : `img/decor.png` + `atlas.js`, `img/villageois.png` + `villageois.js`, `img/ui-*.png` (`outils/terres-maquette/atlas.py`) ; `img/soldats.png` + `soldats.js` (`lpc-soldats.py`) ; packs hors du dépôt.
- **PC** (≥ 900 px : `grand`, `COLONNE` de `jeu.js`, fin de `style.css`) : volets à droite ; clavier ; survol = `#info`.
- Tests : `outils/terres-simulateur.js` (règles, carte, robot ; dans `verifications.js`), bloc dans `fumee.js`.

## Pièges
- `GRILLE` : minuscule = terrain (la tente est `^`), K L = garnison, G = guet ; garder des ruelles.
- Le pionnier est `AG[0]` (`rang(i)`) ; `PI` ne se dessine qu'avant le premier villageois. Bêtes LPC : chien et chat, ligne 0 = vers la droite.
- Pillards : le combat est dans `regles.js` ; `BANDE` de `jeu.js` n'est que le dessin (arrive à `S.raid.proch`).
- Stock : `R.capacite` = `STOCK.base` × 2^niveau du grenier / de l'aire ; `niveaux` = agrandi sur place. `R.hiver(S)` = calcul de `vie.js`.
- Changer un nombre : relancer le simulateur (cibles du cahier vérifiées). Changer la carte : les contrôles de la carte (portes reliées, pas de détour).

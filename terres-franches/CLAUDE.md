# Terres franches — notes pour Claude
Colonie incrémentale ; ère 1 (campement → village → Charte), puis Lois et nouvelle colonie. Cahier des charges : [`specs/terres-franches.md`](../specs/terres-franches.md).
- `donnees.js` (`window.TerresDonnees`) : **tous les nombres** ; `ERE2` = ce que la côte change (fusionné par `R.reglages(mods, ere)`).
- `carte.js` (`window.TerresCarte`, aussi sous Node) : `CARTES[1]` vallée, `[2]` côte (grilles en texte, case = 32 px) ; `LOTS`, `proposer`, `routes(S)`, `postes`. Règles : `CARTE.de(S)` ; écran : carte affichée, `utiliser(n)`.
- `regles.js` (`window.TerresRegles`, aussi sous Node) : `creer`, `pas`, ordres (erreur ou null), `taux`, pillards, `horsLigne`, `robot` ; prestige : `prendreLoi`, `recompense`, `nouvelleColonie` (`S.ere`, `S.lois`).
- `jeu.js` (`window.Terres`) : dessin, villageois (`AG`), caméra, toucher, sauvegardes `terres.partie`, `terres.lois`, `terres.vallee` ; `fonder`, `visiter` (`REEL` = partie en cours). `ecran.js` : interface. `vie.js` : saisons, météo, bêtes.
- Images : `img/*.png` + `atlas.js`, `villageois.js` (`outils/terres-maquette/atlas.py`), `soldats.js` (`lpc-soldats.py`) ; packs hors du dépôt.
- **PC** (≥ 900 px : `grand`, `COLONNE`, fin de `style.css`) : volets à droite, clavier.
- Tests : `outils/terres-simulateur.js` (dans `verifications.js`), bloc dans `fumee.js`.

## Pièges
- `GRILLE` : minuscule = terrain, `^` tente, `,` sable, K L garnison, G guet, M port ; garder des ruelles. `preparerCarte` (jeu.js) refait masques et arbres.
- Le pionnier est `AG[0]` (`rang(i)`) ; `PI` ne se dessine qu'avant le premier villageois.
- Pillards : le combat est dans `regles.js` ; `BANDE` de `jeu.js` n'est que le dessin (arrive à `S.raid.proch`).
- Stock : `R.capacite` = base × 2^niveau du grenier / de l'aire. Lois et ordonnances : mêmes clés, lues par `R.eff`.
- Changer un nombre : relancer le simulateur (cibles du cahier vérifiées). Changer la carte : les contrôles de la carte (portes reliées, pas de détour).

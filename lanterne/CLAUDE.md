# La Dernière Lanterne — notes pour Claude
RPG au tour par tour en HD-2D, premier jeu du moteur `moteur-rpg/` (`window.MoteurRPG`, qui ne sait rien du jeu : voir [`moteur-rpg/CLAUDE.md`](../moteur-rpg/CLAUDE.md)). Cahier des charges : [`specs/rpg.md`](../specs/rpg.md) (détails et historique en fin de fichier).
- `jeu.js` : branche le moteur aux données (titre, 3 emplacements, nom, boucle d'affichage).
- `donnees/` : `base.js` (classes, héros, objets, monstres, départ, légende des cartes, style), `cartes.js` (cartes en lettres), `combat.js` (équipement, talents, rencontres), `evenements.js` (dialogues), `tuiles.js` (fabriqué par `outils/lanterne-tuiles.py`, ne pas modifier à la main).
- `tuiles.png` (Dungeon Crawl, CC0), `sons/`, `style.css` ; police Pixelify Sans (`polices/lanterne.css`).
- Sauvegardes `lanterne.partie1..3` (copies `auto` / `main` / `reprise`), réglages `lanterne.reglages`. Pas de classement, pas encore dans `LUDO1-`.
- Accueil : `demo: true` dans `GAMES` (étiquette DEMO, pas « à la une ») ; à retirer quand le jeu sera fini.
- Tests : `window.Lanterne` (`nouvelle(n, nom)`, `continuer(n)`, `partie`, `etat`, `entrees.simuler(touche, ms)`, `sauvegardes`, `combat`). `outils/lanterne-tests.js` (dans `verifications.js`, avec le solveur d'accessibilité qui vise `LANTERNE.fin`), `outils/lanterne-combats.js` (équilibrage), bloc dans `fumee.js`.

## Pièges
- Leçon « HD-2D avec des panneaux » du mémo ([`specs/ludotheque.md`](../specs/ludotheque.md)) : à lire avant de toucher au rendu, aux cartes ou aux combats.
- Une sortie ne doit pas arriver sur un objet qui s'ouvre ; un combat d'histoire après une `sauvegardeAuto` : `boss: true` + déclencheur qui rejoue la scène.
- Régler un boss pour le niveau prévu et vérifier le niveau d'en dessous.

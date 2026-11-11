# Bastion — notes pour Claude
RTS + tower defense en temps réel (Tiny Swords, vue du dessus) : 6 niveaux, tuto, interface « tout sur la carte » ; LABO = bac à sable. Cahier des charges : [`specs/bastion.md`](../specs/bastion.md).
- `regles.js` : **règles pures, aussi sous Node** (`window.BastionRegles`) : `DEFAUT`, `reglages(mods, base)`, `creer(mods, graine, niveau)` (4 par défaut = carte du labo), `pas(S, dt ≤ 0,05)`, ordres (`construire`, `recruter`, `envoyer`, `metier`, `retirer`, `ameliorer`, `promouvoir`, `tenir`), `S.evts`, `robot`, `simuler(mods, graine, tMax, niveau)`. `NIVEAUX` (carte, chemins, tours/village, vagues, bâtiments permis) → `S.c`.
- `jeu.js` : dessin (case = 2 × 2 tuiles de 64 px), anneaux (`itemsAnneau`), étiquettes des ouvriers, niveaux et étoiles, tuto (`ETAPES`), LABO. `window.Bastion` pour les tests (`S`, `toucher`, `avance`, `robot`, `anneau`, `tuto`).
- `img/` : seulement les images utilisées (packs achetés : **pas de redistribution**, jamais un pack entier ; `ui-*` = pièces d'interface recollées). Liste `NOMS` dans `jeu.js`, à reporter dans `FILES` de `sw.js`.
- Sauvegardes : `bastion.progres` (étoiles), `bastion.labo`, `bastion.parties`. Pas de classement (démo).
- Tests : `outils/bastion-simulateur.js` (règles + robot, dans `verifications.js`), bloc dans `fumee.js`.

## Pièges
- Anneau ouvert sur `pointerup` : il ignore les clics 400 ms (leçon de Bannières). Bandes d'images recoupées au retour dans l'appli (`viderToiles`).
- Clé `guer` = CHEVALIERS (caserne) ; `lance` = lanciers de départ. Changer une règle : relancer le simulateur.
- `marcher` garde le côté choisi (`e.cote`) en longeant un obstacle. Le tuto repousse les vagues (`S.prochaine`) tant qu'il n'est pas fini.

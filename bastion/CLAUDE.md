# Bastion — notes pour Claude
RTS + tower defense en temps réel (Tiny Swords, vue du dessus). Session 1 = **laboratoire** : tous les nombres se règlent dans le panneau LABO. Cahier des charges : [`specs/bastion.md`](../specs/bastion.md).
- `regles.js` : **règles pures, aussi sous Node** (`window.BastionRegles` / `module.exports`) : `DEFAUT`, `reglages(mods)`, `ecarts(P)`, `creer(mods, graine)`, `pas(S, dt ≤ 0,05)`, ordres (`ajouterOuvrier`, `metier`, `construire`, `recruter`, `envoyer` (tour = garnison)), messages dans `S.evts`, `robot(S, dt)` et `simuler(mods, graine)`. Carte 11 × 14 (`CARTE`, `CHEMINS` = points de passage, `SITES` = 10 emplacements) ; obstacles (`obstacles`, `marcher` contourne, `dehors`).
- `jeu.js` : dessin (case = 2 × 2 tuiles de 64 px), commandes au doigt, menus, LABO. `window.Bastion` pour les tests (`S`, `toucher(gx, gy)`, `avance(s)`, `robot`).
- `img/` : seulement les images utilisées (Free Pack, Enemy Pack et Warfare achetés, chantier/ruine/sable de l'ancienne version CC0 ; `ui-*` = pièces d'interface recollées, voir `style.css`) : **pas de redistribution**, ne jamais y mettre un pack entier. Noms courts (`guer-coup.png`, `ouvrier-marteau.png`…), liste `NOMS` dans `jeu.js`, à reporter dans `FILES` de `sw.js`.
- Sauvegardes : `bastion.labo` (écarts des réglages), `bastion.parties`. Pas de classement ni de `LUDO1-` (démo).
- Tests : `outils/bastion-simulateur.js` (règles + robot, dans `verifications.js` ; `node outils/bastion-simulateur.js 100 '<réglages copiés>'` pour l'équilibrage), bloc dans `fumee.js`.

## Pièges
- Le volet CONSTRUIRE s'ouvre sur `pointerup` : il ignore les clics 400 ms (leçon de Bannières). Les bandes d'images sont recoupées au retour dans l'appli (`viderToiles`).
- La clé `guer` = les CHEVALIERS (caserne) ; `lance` = les lanciers de départ. Changer une règle : relancer le simulateur (07/11 : 11 victoires du robot sur 30).
- Contournement : `marcher` garde le côté choisi (`e.cote`) tant qu'il longe un obstacle, sinon l'escouade hésite devant le château.

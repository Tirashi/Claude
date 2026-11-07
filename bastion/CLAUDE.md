# Bastion — notes pour Claude
RTS + tower defense en temps réel (Tiny Swords, vue du dessus). Session 1 = **laboratoire** : tous les nombres se règlent dans le panneau LABO. Cahier des charges : [`specs/bastion.md`](../specs/bastion.md).
- `regles.js` : **règles pures, aussi sous Node** (`window.BastionRegles` / `module.exports`) : `DEFAUT` (tous les réglages, par groupe), `reglages(mods)`, `ecarts(P)`, `creer(mods, graine)`, `pas(S, dt ≤ 0,05)`, ordres (`ajouterOuvrier`, `metier`, `construire`, `recruter`, `envoyer` (tour = garnison)), messages dans `S.evts`, `robot(S, dt)` et `simuler(mods, graine)`. Carte 9 × 9 (`CARTE`, `SITES` = 8 emplacements de construction).
- `jeu.js` : dessin (case = 2 × 2 tuiles de 64 px), commandes au doigt, menus, LABO (vitesse, triches, robot, simulateur dans la page, journal, réglages). `window.Bastion` pour les tests (`S`, `toucher(gx, gy)`, `avance(s)`, `robot`).
- `img/` : seulement les images utilisées (Free Pack, Enemy Pack achetés, chantier/ruine/sable de l'ancienne version CC0) : **pas de redistribution**, ne jamais y mettre un pack entier. Noms courts (`guer-coup.png`, `ouvrier-marteau.png`…), liste `NOMS` dans `jeu.js`, à reporter dans `FILES` de `sw.js`.
- Sauvegardes : `bastion.labo` (écarts des réglages), `bastion.parties` (jouées, victoires, meilleure vague ; pas les parties du robot). Pas de classement ni de `LUDO1-` (démo).
- Tests : `outils/bastion-simulateur.js` (règles + robot, dans `verifications.js` ; `node outils/bastion-simulateur.js 100 '<réglages copiés>'` pour l'équilibrage), bloc dans `fumee.js`.

## Pièges
- Le volet CONSTRUIRE s'ouvre sur `pointerup` : il ignore les clics 400 ms (leçon de Bannières). Les bandes d'images sont recoupées au retour dans l'appli (`viderToiles`).
- Changer une règle : relancer le simulateur (le robot tenait 9,5 vagues sur 10 en moyenne, 1 victoire sur 3, le 07/11).

# Escadrille ! — cahier des charges

La bataille aérienne des pouvoirs, petite sœur d'Amiral ! (idée du fils de l'utilisateur : « Amiral ! avec des avions »).
Maquette validée le 17/10 : https://claude.ai/artifact/Kbhvmnp4ahAAW9msZiUaqE — source `maquettes/escadrille.html` (versions et retours dans `IDEES.md`, jeux de bateaux n° 5).

## 1. Décisions (17/10)
- **Même DA qu'Amiral !** : mêmes plaques, boutons, police Press Start 2P, petite police 3×5, cadre riveté, brouillard en nuages, flammes, fumée, explosions, typographie et mise en page des écrans. Le ciel remplace la mer, un pilote (casque de cuir, lunettes) remplace l'amiral.
- **Avions en relief façon Nebula** : construits avec le moteur de `nebula/vaisseaux.js` (`builder`, `render`, `half`, `MAT`), en double définition (`setScale(2)`). Pour chaque sens, la construction est tournée **avant** l'éclairage (`rotBuilder` de la maquette) : la lumière vient toujours d'en haut à gauche. Sprites fabriqués à la demande puis gardés.
- **Écran en 544 × 960** (comme Nebula) : on dessine avec `setTransform(2, 0, 0, 2, 0, 0)` sur une base logique de 272 × 480 ; l'interface pixel d'Amiral reste nette (rectangles entiers, lissage coupé), les avions sont dessinés lissés.
- **Écartés** : la règle du cockpit, le Canadair, le dirigeable (pour le moment), les dessins pixel, jouets, patrouille et les simples changements de couleur.
- **Encore à choisir plus tard** : le ciel du jour (classement famille, une tentative par jour, règle des défis du jour), le pilote en parachute quand un avion est abattu.

## 2. Règles
- Ciel de **9 × 9** (cases de 23 px logiques, grille en `BX = 40`, `BY = 58`). Chacun cache son escadrille ; à chaque tour **un tir ou un pouvoir prêt**, comme dans Amiral !.
- Un avion est **abattu quand toutes ses cases sont touchées** ; il perd alors son pouvoir. Les avions se tournent dans les 4 sens (`shapeOf(def, d)`).
- Record : la victoire en le moins de tours, par niveau. Niveaux de l'ordinateur : **RECRUE, PILOTE, AS** (reprendre l'IA d'Amiral ! : densité, visée, usage des pouvoirs, esquive menacée).

| Avion | Cases (nez en haut) | Pouvoir | Attente |
|---|---|---|---|
| Bombardier | 8 : nez, ailes de 3, fuselage, queue de 3 (3 × 4) | **BOMBES** : cinq tirs en croix | 4 tours |
| Avion radar | 5 : croix (3 × 3) | **RADAR** : révèle une zone de 3 × 3 sans tirer | 3 tours |
| Chasseur | 4 : nez + ailes de 3 (3 × 2) | **MISSILE** : file sur une ligne ou une colonne jusqu'au premier avion | 3 tours |
| Hélicoptère | 2 (1 × 2) | **ESQUIVE** : s'échappe de 2 cases s'il n'est pas touché | 4 tours |

Visée des pouvoirs comme dans Amiral ! : on touche une case pour viser, une deuxième fois pour lancer ; MISSILE a ses boutons LIGNE / COLONNE au-dessus de la grille.

## 3. Écrans (d'après la maquette)
- **Titre** : logo ESCADRILLE !, les 4 pouvoirs avec leur avion, niveaux et records, DECOLLAGE !, CLASSEMENT, HANGAR, retour à la Ludothèque (`!window.ludoArtefact`), SON, MUSIQUE, le pilote et sa bulle.
- **Placement** : PIVOTER, HASARD, DECOLLAGE ! ; miniature du ciel ennemi et plaque ESCADRILLE ENNEMIE.
- **Combat** : TOUR n, MENU (QUITTER ?), barre des 5 boutons (TIR, RADAR, BOMBES, MISSILE, ESQUIVE) avec attente / PRET / avion abattu, miniature de son escadrille (touchée pour basculer la vue), message qui s'écrit.
- **Fin** : victoire ou défaite, record, déblocage éventuel.

## 4. Familles d'avions (skins) et déblocages
Les familles ne changent que le dessin (mêmes cases, mêmes règles). Les ennemis sont **les pirates de la même famille** que celle du joueur : tôle rouillée rapiécée, bandes de danger, feux rouges, lueur orange (`PIRATE` de la maquette).

| Famille | Formes | Comment l'obtenir |
|---|---|---|
| **A. Escadre** | réacteurs en nacelles, disque radar sur pylône, aile delta, hélico simple | au départ |
| **B. Furtif** | facettes, aile volante en dents de scie et queue en V, soucoupe radar, ailes inversées et plans canard, hélico à fenestron | une victoire en PILOTE |
| **C. Hélices** | bipoutre, antenne radar tournante, hélices contrarotatives, rotors coaxiaux | 10 victoires (tous niveaux) |
| **D. Canonnière** | coques blindées façon frégate de Nebula, tourelles, passerelle, dômes de détection, hélico d'attaque à roquettes | une victoire en AS |

- **HANGAR** (depuis l'écran titre) : les 4 familles, celles qui sont bloquées en silhouette sombre avec leur condition ; on choisit son escadrille parmi les familles débloquées.
- À la victoire qui débloque : annonce « NOUVELLE ESCADRILLE DEBLOQUEE ! » avec les avions de la famille.
- Plus tard peut-être : déblocage avion par avion pour mélanger les familles.

## 5. Sauvegarde, classements, intégration
- Sauvegardes : `escadrille.best` (record par niveau), `escadrille.diff`, `escadrille.opts` (son, musique), `escadrille.victoires`, `escadrille.skins` (familles débloquées), `escadrille.skin` (famille choisie). À inclure dans le transfert `LUDO1-`.
- Classement `escadrille` : `best:<niveau>` (le moins de tours gagne), comme Amiral !.
- Fichiers : `escadrille/index.html` (+ `escadrille/avions.js` pour les constructeurs d'avions et les familles s'il devient gros) ; charge `injagility/chiens32.js`, `nebula/vaisseaux.js`, `ludo-scores.js`.
- Suivre la **liste de contrôle « Ajouter un nouveau jeu »** de `specs/ludotheque.md` (accueil, cartouche, icône, `sw.js`, classements, transfert, fumée, artefact).
- Sons et musique : reprendre le moteur d'Amiral ! ; bruitages à adapter (moteurs, missile, radar, hélices).

## 6. Plan de travail proposé
1. Session 1 : le jeu complet avec la famille A (règles, IA aux 3 niveaux, écrans, sons), sauvegarde, accueil, classement, transfert, tests (`fumee.js`, pilote automatique éventuel), artefact.
2. Session 2 : familles B, C, D, HANGAR, déblocages et annonce.

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

## 7. Bilan de la session 1 (17/10)
- **Fichiers** : `escadrille/index.html` (le jeu) et `escadrille/avions.js` (`window.EscAvions` : matières `STYLES`, constructeurs `AVIONS` des 4 familles, `SIZE`, `rotBuilder`, repris tels quels de la maquette). Charge `injagility/chiens32.js`, `nebula/vaisseaux.js`, `ludo-scores.js`. La famille en cours est `STYLE` (`'a'` pour l'instant) : la session 2 n'aura qu'à la lire dans `escadrille.skin`.
- **Moteur** : celui d'Amiral ! (état `S`, `act()`, `describe()`, `aiTurn()`, `gameOver()`), avec des avions en forme (`shapeOf`, `cellsOf`, `fits`, `put`) au lieu de navires droits. ESQUIVE = la plongée d'Amiral ! (2 cases au plus dans chaque sens, même orientation, jamais sur une case déjà visée ; ce que l'adversaire savait de ces cases est oublié).
- **IA** : celle d'Amiral !, la densité compte toutes les positions des avions encore en vol dans les 4 sens. RECRUE vise au hasard ou à côté d'un feu ; PILOTE chasse en damier (60 %) et, une fois sur deux, tire à côté d'un feu au lieu de calculer ; AS calcule toujours et esquive plus tôt. Mesure (60 parties, sans esquive du joueur) : l'ordinateur abat une escadrille en **51 tours (RECRUE), 22 (PILOTE), 19 (AS)** en moyenne.
- **Écrans** : ceux de la maquette (titre, placement, combat, fin). Placement : toucher un avion, puis une case (l'avion s'y centre) ; toucher encore l'avion le tourne (décalé s'il le faut pour tenir). RADAR : faisceau qui tourne sur la zone puis balayage ; bombes qui tombent avec leur ombre ; missile avec sa traînée ; hélicoptère qui file vers sa nouvelle place (caché chez l'ennemi). Fin : pilote, ou pilote pirate (casque sombre, lunettes rouges) à la défaite.
- **Sons** : moteur d'Amiral !, bruitages adaptés (bombe qui siffle, pouf dans un nuage, bips du radar, souffle du missile, battements de l'hélicoptère, réacteurs au décollage) ; musique : une marche de l'air en ré.
- **Affichage** : canvas à la résolution de l'écran, ×K entier entre 2 et 4 (au moins la double définition des avions, au plus 4 pour la fluidité) ; sprites fabriqués à la demande et préparés un par image sur l'écran titre.
- **Sauvegardes** : `escadrille.best`, `.diff`, `.opts`, `.victoires` (toutes les victoires, pour débloquer C en session 2 ; B et D se déduisent de `best.normal` et `best.hard`). Transfert `LUDO1-` : records et victoires (le plus grand nombre gagne).
- **Intégration** : accueil (cartouche 32 bits, icône `fighter`, volet avec records et victoires, classement par niveau), `ludo-scores.js` (`registerExisting`, `PSEUDO_BOARDS`, `SYNC` 15), `sw.js` v35, test fumée (un toucher largue une bombe, l'ordinateur riposte).
- **Le sol** (retour du 17/10 : le ciel bleu faisait penser à de l'eau) : `escadrille/sol.js` (`EscSol.build(st)`, tuiles de 272 × 256 sans couture) ; A campagne, B forêts et montagnes, C désert et canyon, **tiré au hasard à chaque partie** (`SOL`). Il défile vers le bas (8 px/s sous la grille, 5 px/s en fond assombri des menus), avec un voile d'altitude, les cumulus et leur ombre. Marge du bas : zone sûre du téléphone + 14 px.
- **À essayer sur le téléphone** : fluidité, taille des cases (23 px logiques), difficulté des trois niveaux, classement avec un vrai record.

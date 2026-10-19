# Escadrille ! — cahier des charges

La bataille aérienne des pouvoirs, petite sœur d'Amiral ! (idée du fils de l'utilisateur : « Amiral ! avec des avions »).
Maquette validée le 17/10 : https://claude.ai/artifact/Kbhvmnp4ahAAW9msZiUaqE — source `maquettes/escadrille.html` (versions et retours dans `IDEES.md`, jeux de bateaux n° 5).

## 1. Décisions (17/10)
- **Même DA qu'Amiral !** : mêmes plaques, boutons, police Press Start 2P, petite police 3×5, cadre riveté, brouillard en nuages, flammes, fumée, explosions, typographie et mise en page des écrans. Le ciel remplace la mer, un pilote (casque de cuir, lunettes) remplace l'amiral.
- **Avions en relief façon Nebula** : construits avec le moteur de `nebula/vaisseaux.js` (`builder`, `render`, `half`, `MAT`), en double définition (`setScale(2)`). Pour chaque sens, la construction est tournée **avant** l'éclairage (`rotBuilder` de la maquette) : la lumière vient toujours d'en haut à gauche. Sprites fabriqués à la demande puis gardés.
- **Écran en 544 × 960** (comme Nebula) : on dessine avec `setTransform(2, 0, 0, 2, 0, 0)` sur une base logique de 272 × 480 ; l'interface pixel d'Amiral reste nette (rectangles entiers, lissage coupé), les avions sont dessinés lissés.
- **Écartés** : la règle du cockpit, le Canadair, le dirigeable (pour le moment), les dessins pixel, jouets, patrouille et les simples changements de couleur.
- **Décidé le 17/10 (session 2)** : le pilote en parachute quand un avion est abattu : **oui** ; le ciel du jour : **non**.

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

## 8. Bilan de la session 2 (17/10)
- **Familles** : `SKINS` (A escadre, B furtif, C hélices, D canonnière), `STYLE` = famille choisie (`escadrille.skin`). Les ennemis sont toujours les pirates de la même famille. `unlockedSkins()` : A au départ, B si `best.normal`, C si `victoires` ≥ 10, D si `best.hard` ; le résultat est gardé dans `escadrille.skins` (calculé au démarrage, donc les victoires d'avant la session 2 comptent).
- **HANGAR** (bouton de l'écran titre, entre CLASSEMENT et LUDOTHEQUE) : 4 cartes avec une fenêtre sur le sol, mon escadrille en haut et les pirates en dessous ; bloquée : silhouettes sombres, BLOQUEE et la condition (C : compteur n/10) ; toucher une famille débloquée la met EN SERVICE.
- **Annonce** : à la victoire qui débloque, un cartouche doré « NOUVELLE ESCADRILLE DEBLOQUEE ! » sous le tableau de fin, avec les avions de la famille et « A CHOISIR AU HANGAR », et une petite fanfare (`SFX.unlock`).
- **Parachute** : quand un avion est abattu, son pilote saute (deux pour le bombardier) : vu de dessus, la voile s'ouvre puis rapetisse en descendant vers le sol et dérive, avec son ombre ; voile blanche et rouge chez moi, jaune et noire chez les pirates (effet `para`, 3,8 s, `SFX.chute`).
- **Préparation des sprites** : sur l'écran titre et au hangar, un sprite par image : la famille choisie dans les 4 sens, puis les autres familles nez en haut (pour le hangar) ; une famille choisie au hangar est préparée dans tous les sens.
- **Accueil et transfert** : volet (records, victoires, escadrilles n/4), transfert `LUDO1-` (familles débloquées réunies, famille choisie reprise si on n'en a pas), quoi de neuf, étiquette MAJ. Test fumée : le hangar s'affiche.

## 9. Reprendre les changements d'Amiral ! (rapport du 17/10, rien n'est décidé)
Escadrille est partie du moteur d'Amiral ! **d'avant** sa refonte « chantier naval » (`specs/amiral.md`). Elle en a donc
les défauts corrigés depuis dans Amiral ! : Press Start 2P et petite police 3 × 5, écran figé à 272 × 480 (`LH`, `BY_BAR`
constants), boutons LIGNE / COLONNE pour le missile (`setMissile`), pas de bouton FEU !, pouvoirs liés à un indice d'avion
fixe (`POWERS[..].ship`, `FLEET` figée).

### Lot 1 : ergonomie et polices (facile, environ une demi-session, Sonnet ou opusplan)
Reprise presque mot pour mot d'Amiral ! (même structure de fichier) :
- **hauteur qui suit l'écran** (480 à 620) : `layout()` (`BY_BAR`, `BAR_H`, minicarte, messages), écrans de menus centrés
  (`OY`) ; préparer le sol qui défile (`escadrille/sol.js`) et le ciel à 620 de haut ;
- **police C** : Press Start 2P pour les logos, Rajdhani 700 pour le reste (`polices/nebula.css` en local) ; reprendre
  directement la version **corrigée** de `tiny()` d'Amiral ! (voir `specs/amiral.md`, correction du 17/10 :
  l'alignement s'était retrouvé dans un commentaire) ;
- **missile en deux gestes** (case, puis flèche à gauche de la ligne ou au-dessus de la colonne), comme la torpille ;
- **bouton FEU !** sur la plaque du pouvoir (radar, bombes, esquive) ;
- noms longs resserrés dans le panneau de la flotte ennemie ;
- vérifier en captures tous les écrans (titre, HANGAR, placement, combat, fin) avec les 4 familles ; republier l'artefact.

### Lot 2 : choisir ses avions (gros chantier, 2 ou 3 sessions avec Opus, plus les dessins)
1. **Règle des places.** Les avions ont une forme (bombardier 8 cases, radar 5, chasseur 4, hélicoptère 2) : des places par
   catégorie (un gros, deux moyens, un petit) et **chaque nouvel avion avec le même nombre de cases** que celui qu'il remplace,
   sinon le ciel de 9 × 9 se remplit plus ou moins et la difficulté change.
2. **Dessins : le plus gros coût.** Chaque avion existe en 4 familles (escadre, furtif, hélices, canonnière), en joueur et en
   pirate, et dans 4 orientations (calculées par `rotBuilder`). 7 nouveaux avions × 4 familles = 28 dessins, plus une planche de
   maquettes. Pour alléger : moins d'avions (4), ou les nouveaux avions dans une seule famille commune (moins cohérent avec le HANGAR).
3. **Pouvoirs** : ceux d'Amiral ! se transposent (le code est écrit et testé) :

   | Amiral ! | Escadrille (proposition) |
   |---|---|
   | MISSILES (3 cases au choix) | ROQUETTES : bombardier d'attaque |
   | SONAR (compte une ligne) | DETECTION : avion de patrouille |
   | PROJECTEUR (ligne de 4) | CAMERA : drone de reconnaissance |
   | REPARATION | REPARATION : avion ravitailleur |
   | MINES | FLAK : ballons de barrage |
   | FUMEE | LEURRES : avion brouilleur |
   | LEURRE | FAUX AVION : le dirigeable (écarté le 17/10 « pour le moment ») |
4. **IA** : celle d'Amiral ! a été réécrite pour jouer les deux camps et chaque pouvoir ; celle d'Escadrille raisonne en formes
   à 4 orientations (`density`, `aiNear`, `heliThreat`). Porter chaque pouvoir en tenant compte des formes, puis régler avec
   des parties simulées (comme `Amiral.simulate`). Partie délicate : Opus.
5. **Deux collections** : le HANGAR débloque des familles (dessins) ; des avions à débloquer en feraient une deuxième. Les réunir
   sur un seul écran (onglets FAMILLES / AVIONS) pour que l'enfant s'y retrouve.
6. **Pas de bataille du jour** : décision du 17/10 (« pas de ciel du jour ») ; à reconfirmer si on veut des flottes imposées.

### Lot 2 lancé (19/10) : maquette, en attente de validation
Maquette `maquettes/escadrille-avions.html` (https://claude.ai/artifact/JCF7jhxKLJdxVa8AtpBbdn) : planche des 10 avions
(4 de départ, 6 nouveaux dessinés dans la famille A, en joueur et en pirate) et deux directions pour les choisir
(1 : hangar à onglets FAMILLES / AVIONS ; 2 : flèches ◀ ▶ sur la rangée de l'écran de placement).
Places : gros 8, moyen 5, moyen 4, petit 2 (19 cases, comme aujourd'hui). Formes proposées (nez en haut) :
attaque ROQUETTES `.X./XXX/XXX/.X.`, ravitailleur REPARATION `..X../XXXXX/..X../..X..`, patrouille DETECTION `XXX/.X./.X.`,
brouilleur LEURRES `XXX/X.X`, ballons de barrage FLAK `XX/XX`, drone CAMERA `X/X`. Déblocages et recharges proposés sur les cartes.
À décider par l'utilisateur : formes, nombre d'avions (6, ou les 4 dont le pouvoir existe déjà dans Amiral !), une famille ou
quatre pour les nouveaux, direction 1 ou 2, conditions. Rappel : lot 1 et session 2 d'Amiral ! pas encore faits.

### Moteur commun aux deux jeux ?
Déconseillé pour l'instant : grille 8 × 8 contre 9 × 9, lignes contre formes, sol qui défile, familles. Porter par copie,
fonction par fonction, et noter chaque reprise dans les deux cahiers des charges.

### Recommandation
1. **Lot 1 tout de suite** : peu coûteux, Escadrille devient aussi lisible qu'Amiral !.
2. **Lot 2 après la session 2 d'Amiral !** et les essais sur le téléphone, pour ne porter qu'une fois des pouvoirs stables
   (mines, fumée et leurre compris).
3. Lot 2 en commençant par une **maquette** : les nouveaux avions dans une seule famille pour juger les formes, puis décider du
   nombre d'avions et de familles.

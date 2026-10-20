# Capitaine du port — cahier des charges

Casse-tête façon « Rush Hour » dans un port, vu du dessus en pixel art 32 bits : le bassin est encombré de bateaux qui ne glissent que dans le sens de leur longueur ; il faut les déplacer pour ouvrir la passe au **navire doré** et l'amener jusqu'à la mer. Des bassins à la suite répartis en 5 ports, avec des étoiles, et un bassin du jour. Pensé aussi pour le fils de l'utilisateur (jeux de bateaux).

## 1. Décisions de l'utilisateur
- 20/10, maquette 1 (`maquettes/capitaine-du-port.html`, version 1 : pixels 16 bits, bateaux-jouets, carte marine) : « aucune ne me convient » ; l'utilisateur veut la DA de la scène du port de la planche « 9 coups de cœur + 4 jeux de bateaux en 32 bits » (https://claude.ai/artifact/XzRmvgNKZeSMRUAM1NuFsA).
- 20/10, maquette 2 (même fichier, https://claude.ai/artifact/GXnCqj89iVvxUbDfcr3urg) : le moteur de cette scène en portrait, jouable, à trois heures ; **plein jour retenu**, polices à revoir « comme Amiral ! et Escadrille ! ».
- 20/10, maquette 3 (même lien) : Press Start 2P pour les logos, Rajdhani 700 pour le reste. **Validée** : polices OK ; **remorqueur décoratif** (on glisse les bateaux, il vient pousser celui qu'on déplace) ; grilles de **6 × 6**, et **7 × 7 pour le dernier port**.

## 2. Principe et règles
- Un **bassin** en cases : **6 × 6** (ports 1 à 4) ou **7 × 7** (port 5). Les bateaux occupent 2, 3 ou 4 cases en ligne, posés en long ou en travers.
- Un bateau ne bouge **que dans le sens de sa longueur**, d'autant de cases libres qu'on veut ; il ne traverse ni les autres bateaux ni les quais.
- **Un coup = un bateau déplacé**, quelle que soit la distance (règle de Rush Hour, comme la maquette).
- Le **navire doré** (2 cases) est toujours posé en long, dans la colonne de la **passe** (une ouverture dans le quai du haut) ; le bassin est gagné quand il arrive à la passe (la case du haut de sa colonne) : il sort alors tout seul vers la mer.
- La colonne de la passe change d'un bassin à l'autre (elle fait partie du niveau).
- Pas de limite de coups ni de temps : **annuler sans limite** (↶) et **recommencer** (⟲).
- Nouveautés par port (confirmées le 20/10) :
  1. **Le port de pêche** : les bases (chalutiers, voiliers de 2 cases, quelques cargos de 3) ; les 3 premiers bassins servent de tutoriel.
  2. **Le port de commerce** : plus de grands bateaux de 3 (cargos, ferries, péniches), bassins plus encombrés.
  3. **La marina** : des **obstacles fixes** d'une case (bouée d'amarrage, pilier de ponton, épave) qui ne bougent jamais.
  4. **Le chantier naval** : des **bateaux de 4 cases** (pétrolier, paquebot) qui barrent toute une rangée.
  5. **Le grand port** : **7 × 7**, tout mélangé, les plus difficiles.

## 3. Commandes
- **Glisser un bateau** du doigt, dans le sens de sa longueur (comme la maquette) : il suit le doigt entre ses butées, puis se cale sur la case la plus proche au lâcher. Pendant le glissement, le remorqueur rouge apparaît derrière lui et le pousse, avec son remous.
- Un **toucher court** sur un bateau ne fait rien (pas de coup compté).
- ↶ ANNULER et ⟲ REJOUER en bas de l'écran (plaques de la maquette).
- Sur ordinateur : glisser à la souris ; Z ou Retour arrière pour annuler, R pour recommencer, Échap pour la pause.

## 4. Rendu (DA 32 bits de la planche des coups de cœur, plein jour)
Reprendre le code de la maquette (`maquettes/capitaine-du-port.html`, lui-même repris de la scène « port » de la planche) :
- **Canvas 2D en pixel art** : la scène est dessinée en **216 × 384** puis agrandie 3 fois, sans lissage ; les **textes** sont écrits ensuite sur la toile fine pour rester nets (fonction `textes`).
- **Sprites des bateaux** générés par code (`makeBoat` : coque, pont, timonerie, biseaux clairs en haut à gauche et sombres en bas à droite, contour sélectif), avec ombre portée sur l'eau, liseré d'écume qui va et vient, halo et éclats du navire doré. Catalogue de départ : navire doré, chalutiers (3 couleurs), voilier, vedette du pilote, barge de sable (2 cases) ; cargo, ferry, péniche fleurie (3 cases) ; à dessiner dans le même style : pétrolier et paquebot (4 cases), bouée, pilier de ponton, épave (1 case). Les sprites dépendent de la taille de case (30 px en 6 × 6, 26 px en 7 × 7 : longueur = n × case − 6).
- **Le décor** : eau animée (rides, scintillement), quais en granit et margelles, bittes d'amarrage, amarres, capitainerie, phare, grue qui pivote avec sa charge, conteneurs, lampadaires, mouettes qui tournent, passe dorée avec chevrons qui montent. **Un décor par port** autour du même bassin (casiers et filets au port de pêche, conteneurs et grue au port de commerce, pontons et voiliers amarrés à la marina, cale sèche et coques en chantier, tout au grand port) ; **lumière de plein jour partout** (choix du 20/10).
- **Animations** : glissement des bateaux, remorqueur et remous, sortie du navire doré vers la mer, « A QUAI ! » et étoiles.
- **Polices** (comme Amiral ! et Escadrille !) : Press Start 2P pour les logos et gros titres (majuscules sans accent), **Rajdhani 700** pour tout le reste, à environ 1,6 × la taille Press Start ; Rajdhani en local (`polices/nebula.css`) pour le hors connexion.
- Interface en **plaques bleu nuit** à double liseré (fonction `plate` de la maquette), icônes en pixels (annuler, rejouer), étoiles en pixels.

## 5. Les bassins
- **60 bassins** en **5 ports de 12** (§ 2). Ports 1 à 4 en 6 × 6, port 5 en 7 × 7.
- Bassins **générés hors du jeu puis figés** : un outil Node (`outils/capitaine-solveur.js`) tire des bassins au hasard, les résout (recherche en largeur, un coup = un bateau déplacé), et garde ceux dont l'optimum tombe dans la plage voulue ; on les choisit et on les range par difficulté dans `capitaine-du-port/niveaux.js` avec leur optimum. Pas de bassins copiés des cartes de Rush Hour.
- Difficulté visée (optimum en coups) : port 1 de 3 à 12, port 2 de 10 à 20, port 3 de 12 à 24, port 4 de 15 à 28, port 5 de 20 à 40.
- Codage d'un bassin en texte, une ligne par rangée : `.` eau, `D` navire doré, une lettre par autre bateau (même lettre sur toutes ses cases ; la forme donne le sens et la longueur ; le sprite est tiré de la longueur et du port), `o` obstacle fixe ; la colonne de la passe en champ à part.
- Un port se débloque quand on a fini 8 bassins du précédent ; dans un port, on joue les bassins débloqués dans l'ordre qu'on veut (le suivant de chaque bassin fini).

## 6. Étoiles et score
- À la fin d'un bassin : **3 étoiles** si le nombre de coups est au plus l'optimum + 10 % (arrondi au-dessus, donc au moins + 1 : des enfants jouent, décision du 20/10), **2 étoiles** au plus l'optimum + 50 % (au moins + 3), sinon **1 étoile**. Les annulations ne comptent pas (seul le chemin final compte).
- On garde pour chaque bassin le meilleur nombre de coups et les étoiles. Total sur 180.
- Écran de fin : le navire doré sort vers la mer, « A QUAI ! », étoiles qui tombent une à une, coups et objectif, boutons SUIVANT, REJOUER, PORTS.

## 7. Bassin du jour
- Bassin **généré** à partir de la date (graine `AAAAMMJJ`), le même pour toute la famille : 6 × 6, 8 à 13 bateaux ; gardé seulement si le solveur le résout en **12 à 30 coups**. Générateur et solveur dans `regles.js` (sans `Math.random`), assez rapides pour le téléphone (un bassin 6 × 6 a peu d'états).
- **Une seule tentative classée par jour** (règle des défis du jour, puzzles) : tentative sauvegardée à part (`capitaine.dailyRun`) et reprise là où on l'a laissée. **Score = tous les coups joués, annulations et recommencements compris**, comme la grille du jour du Magasinier. Une fois réussi, le bassin se rejoue hors classement.
- Ajouté à `TODAY` de l'accueil (marque du défi du jour) et lien `#jour`.

## 8. Écrans
- **Titre** : la scène du port en fond (bateaux au repos, mouettes, grue), logo CAPITAINE DU PORT, boutons JOUER, BASSIN DU JOUR, CLASSEMENT, REGLAGES et le retour à la Ludothèque (dessiné dans le canvas, seulement si `!window.ludoArtefact`).
- **Ports** : les 5 ports en plaques (nom, étoiles sur 36, cadenas), puis les 12 bassins du port choisi (numéro, étoiles, cadenas).
- **Jeu** : en haut le bassin (« PECHE 3 ») et l'objectif ; en bas ANNULER, REJOUER et la plaque des coups et des étoiles (comme la maquette) ; bouton pause en haut à droite.
- **Tutoriel** : bulles courtes sur les 3 premiers bassins et au premier bassin de chaque nouveau port (« Les bouées ne bougent jamais »), avec la main qui montre le geste (reprise de la scène de la planche).
- **Pause** : REPRENDRE, REJOUER, PORTS, réglages, retour à la Ludothèque.
- **Réglages** : bruitages, musique.

## 9. Sons
Bruitages synthétisés en Web Audio (sans fichier), discrets : moteur du remorqueur pendant le glissement, « toc » de butée contre un bateau ou un quai, clapotis quand un bateau se cale, cri de mouette de temps en temps, corne de brume quand le navire doré sort, petite fanfare et cloche de port à la victoire, bips des menus. **Musique d'ambiance discrète** (décision du 20/10) : générative, synthétisée en Web Audio comme celle du Magasinier, calme et ensoleillée (accordéon ou guitare doux, petite mélodie espacée), mixée nettement sous les bruitages ; bruitages et musique coupables à part dans les réglages.

## 10. Technique
- Dossier **`capitaine-du-port/`** : `index.html` (canvas et styles), `jeu.js` (écrans, commandes, boucle), **`regles.js`** (logique pure, partagée avec Node : bassin, coups, butées, annulation, victoire, générateur à graine, solveur ; pas de DOM, pas de `localStorage`, pas de `Math.random`), **`niveaux.js`** (les 60 bassins et leur optimum), **`decor.js`** (sprites des bateaux et décor des 5 ports, repris de la maquette), **`sons.js`**. Charge `../ludo-scores.js`. Scripts classiques, sans build.
- Pas de Three.js : jeu en 2D, léger ; rendu arrêté quand la page est cachée ; décor fixe dessiné une fois par port.
- `window.Capitaine` pour les tests (état, `charger(n)`, `jouer([[bateau, delta], …])`, `annuler()`, `bassinDuJour(date)`).
- **Solveur** `outils/capitaine-solveur.js` (Node) : vérifie chaque bassin et son optimum, sert à générer les bassins figés, et vérifie le bassin du jour sur 60 jours ; lancé par `verifications.js` en version rapide.

## 11. Sauvegarde, classements, intégration
- Sauvegardes (préfixe `capitaine.`) : `capitaine.niveaux` {numéro: {coups, etoiles}}, `capitaine.partie` (bassin en cours et coups joués), `capitaine.daily` {AAAAMMJJ: coups}, `capitaine.dailyRun`, `capitaine.opts`, `capitaine.tuto`. Toutes dans le transfert `LUDO1-` (fusion : moins de coups et plus d'étoiles).
- Classements `capitaine` : `etoiles` (total, le plus haut gagne) et `daily:AAAAMMJJ` (le moins de coups gagne).
- Accueil : famille **32 bits** (cartouche noire, comme Amiral ! et Escadrille !), icône 16×16 (remorqueur ou navire doré), `META`, `NEWS`, `RECS`, `RANKS`, `PROGRESS`, `TODAY`.
- Suivre la **liste de contrôle « Ajouter un nouveau jeu »** de `specs/ludotheque.md` (`ludo-scores.js`, `sw.js`, transfert, tests, docs) ; **artefact** : demander le lien à l'utilisateur ou en créer un s'il le dit (le lien de la maquette reste celui de la maquette).

## 12. Plan de travail (opusplan, une conversation par session)
1. **Session 1, le moteur** : `regles.js` et solveur, `decor.js` repris de la maquette (tailles de case 30 et 26), commandes, écran de jeu et fin de bassin, outil de génération ; **les 24 bassins des ports 1 et 2**. Jouable sur le téléphone.
2. **Session 2, le contenu et l'intégration** : obstacles fixes, bateaux de 4 cases et 7 × 7, les 36 autres bassins et leurs décors, écrans titre, ports, pause et réglages, tutoriel, sons, bassin du jour, classements, accueil, transfert, tests, docs, artefact.

Coût estimé : **5 à 7 % de la semaine** (jeu moyen en 2D, dessin déjà fait dans la maquette ; le plus long est de choisir et d'habiller 60 bassins).

## 14. Bilan de la session 1 (20/10)
Fait (dossier `capitaine-du-port/`, jouable par son adresse ; pas encore sur l'accueil) :
- **`regles.js`** (logique pure, aussi sous Node) : lecture d'un bassin (`capLire`, lettres et `o`), butées (`capLimites`), coup (`capCoup`), victoire, solveur en largeur (`capResoudre`), étoiles (`capSeuil3` = optimum + 10 % arrondi au-dessus et au moins + 1 ; `capSeuil2` = + 50 % et au moins + 3), générateur à graine (`capHasard`, `capGenerer` : pose au hasard sans bateau debout dans la colonne de la passe, explore toute la composante des états atteignables, calcule la distance à la victoire depuis les états gagnés, garde l'état le plus difficile dans la plage voulue).
- **`niveaux.js`** : les 24 bassins des ports 1 et 2 (`CAP_PORTS`, `CAP_NIVEAUX` avec `plan`, `sortie`, `opt`, `sol`), fabriqués par `outils/capitaine-generateur.js` (un par optimum visé : pêche 3 à 12, commerce 10 à 20) ; les ports 3 à 5 sont annoncés (`pret: false`).
- **`outils/capitaine-solveur.js`** : chaque bassin est gagné par sa solution en `opt` coups ; `--optimum` vérifie que c'est le minimum (les 24 le sont). Lancé par `verifications.js` (§ 8 ter).
- **`decor.js`** : le moteur de la maquette, paramétré par la géométrie du bassin (`geo(w, sortie, VH)` : taille de case, passe, capitainerie et phare placés à l'écart de la passe, lampadaires) ; la hauteur de la scène suit celle de l'écran (384 px au moins, la mer et le quai s'allongent) ; quai du bas différent par port (casiers, caisses de poissons et filet à la pêche ; conteneurs et grue au commerce) ; sprites par longueur et par port, sens de la proue tiré de la position.
- **`jeu.js`** : glisser un bateau (il suit le doigt entre ses butées, le remorqueur pousse), ANNULER, REJOUER, pause (Échap), Z/R au clavier, sortie du navire doré, « A QUAI ! », écran de fin (étoiles, SUIVANT, REJOUER, PORTS), écran titre (CONTINUER, JOUER, retour à la Ludothèque), choix du port et des bassins (8 bassins finis ouvrent le port suivant), bulles d'aide sur les 3 premiers bassins. Sauvegardes `capitaine.niveaux` et `capitaine.partie` ; `window.Capitaine` pour les tests.
- Menus en HTML (plaques bleu nuit, Press Start 2P pour les titres, Rajdhani 700 pour le reste) par-dessus le canvas, comme Le Magasinier ; le retour à la Ludothèque est un lien `ludo-retour`.
- `sw.js` : les 6 fichiers ajoutés, cache `ludotheque-v42`.

Reste pour la session 2 : obstacles fixes (marina), bateaux de 4 cases (chantier), 7 × 7 (grand port, sprites à la case de 26 px), les 36 autres bassins et leurs décors, sons et musique, bassin du jour, classements, accueil, transfert, tests (`fumee.js`, `logique.js`), README, artefact.

## 13. Points confirmés par l'utilisateur (20/10)
1. Nouveautés des 5 ports : **d'accord** (pêche, commerce, marina avec obstacles fixes, chantier naval avec bateaux de 4 cases, grand port en 7 × 7).
2. Étoiles : **3 étoiles jusqu'à l'optimum + 10 %** (« il y a des enfants qui jouent »), pas à l'optimum exact.
3. Bassin du jour : **tous les coups comptent**, annulations comprises.
4. **Bruitages et musique discrète.**
5. Dossier **`capitaine-du-port/`**.

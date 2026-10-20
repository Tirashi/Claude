# Le Magasinier — cahier des charges

Sokoban d'entrepôt en HD-2D façon Octopath Traveler : le docker pousse des caisses sur des marques peintes au sol, sans jamais pouvoir les tirer. Nouveautés par rapport au Sokoban classique : la glace, les tapis roulants et les caisses lourdes. Des niveaux à la suite, avec des étoiles, et une grille du jour.

## 1. Décisions de l'utilisateur
- 17/10, maquette 1 (`maquettes/magasinier.html`) : aucun des trois styles ne va (HD-2D dessiné sur canvas, diorama en bois, 16 bits vu de dessus).
- 19/10, maquette 2 (`magasinier-2.html`, pixel art 3/4, dessin animé, Game Boy) : rien ne va ; « un tout petit peu plus réaliste, et un peu plus d'animation ».
- 19/10, maquette 3 (`magasinier-3.html`, vue de dessus réaliste et animée) : rien ne plaît ; « essaye des pixels à la Octopath Traveler ».
- 19/10, maquette 4 (`magasinier-4.html`, https://claude.ai/artifact/ADL8cQLmu3qgt15oRTjZU4) : **lieu A, l'entrepôt au soleil, retenu** (« super »).
- 19/10, maquette 5 (`magasinier-5.html`, https://claude.ai/artifact/GgoQvusipqntR4Zhgktttf) : **personnage A, le docker, retenu** (« parfait »).

## 2. Principe et règles
- Plateau en cases, au plus **9 de large et 11 de haut** (écran de téléphone en portrait). Murs, sol, marques, caisses, le docker.
- Un coup = un pas du docker d'une case (haut, bas, gauche, droite). S'il marche sur une caisse, il la pousse d'une case si la case suivante est libre ; il ne peut pas pousser deux caisses à la fois ni tirer.
- Niveau gagné quand **toutes les caisses sont sur une marque** (autant de marques que de caisses).
- **Glace** : une caisse ou le docker qui arrive sur la glace continue de glisser dans le même sens tant que la case suivante est libre et qu'il est encore sur la glace ; il s'arrête sur la première case qui n'est plus de la glace, ou contre un obstacle. (Règle de la maquette.)
- **Tapis roulant** (une flèche par case) : à la fin de chaque coup, ce qui est sur un tapis avance d'une case dans le sens de la flèche si la case suivante est libre, une seule fois par coup. Ordre de traitement fixe (de l'aval vers l'amont) pour que deux caisses à la file avancent ensemble. **Seules les caisses sont emportées** : le docker marche sur un tapis comme sur le sol et garde toujours la main, comme dans le Sokoban d'origine (décision du 19/10).
- **Caisse lourde** (caisse en fonte cerclée de fer) : se pousse comme une autre, mais **ne glisse pas** (elle s'arrête sur la première case de glace) et **les tapis ne la déplacent pas**. Elle sert à bloquer ou à ancrer.
- Pas de limite de coups ni de temps : on peut **annuler sans limite** (↶) et **recommencer** (⟲).
- Idées gardées pour plus tard (pas dans la première version) : tonneaux qui roulent jusqu'au premier obstacle, plaques et portes, monte-charge.

## 3. Commandes
- **Glisser le doigt** sur l'écran : un pas dans le sens du geste (comme les maquettes). Un geste pendant une animation est mis en attente (un seul en réserve).
- **Croix directionnelle** à l'écran (comme les maquettes), avec ↶ ANNULER et ⟲ RECOMMENCER de chaque côté ; on peut la masquer dans les réglages pour ne jouer qu'au geste.
- Pas de déplacement en touchant une case (décision du 19/10) : on avance pas à pas.
- Sur ordinateur : flèches du clavier, Z ou Retour arrière pour annuler, R pour recommencer, Échap pour la pause.

## 4. Rendu (lieu A, l'entrepôt au soleil, et le docker)
Reprendre le code des maquettes 4 et 5 :
- **Three.js r128** (`lib/three.min.js`). Plateau en blocs habillés de **textures en pixel art 16×16** générées par code (plancher, briques, dessus de mur en pierre, caisses, glace, marques), filtrage au plus proche.
- Caméra en perspective penchée à 54°, cadrée pour que le plateau tienne en largeur et en hauteur. Rangée de murs du bas abaissée (0,45) pour ne pas cacher le docker.
- **Passe finale** : flou tilt-shift en haut et en bas, halo des zones claires, vignettage, teinte chaude.
- **Lumières** : soleil avec ombres douces, ciel chaud, deux suspensions qui se balancent, rayons de soleil par les fenêtres, poussière qui flotte.
- **Décor autour du plateau** : mur de briques à fenêtres au fond, rayonnages chargés, tonneaux, sacs et caisses devant. Le décor s'adapte à la taille du niveau.
- **Le docker** : sprite 32×44 généré par code (`TENUES.A` de la maquette 5 : casquette gavroche, chemise retroussée, gilet de cuir, foulard rouge, barbe), 5 tons par couleur, contour coloré. Vues de face, de dos et de profil (la gauche en miroir) ; marche en 4 temps, poussée, glissade, clignement des yeux, victoire.
- **Nouveaux éléments** à dessiner dans le même style : **tapis roulant** (bande sombre avec chevrons jaunes qui défilent, rouleaux sur les côtés), **caisse lourde** (fonte gris-bleu cerclée, rivets, plus basse et plus large), flèche de sens bien lisible.
- **Animations** (validées au tour 3 et reprises) : marche, poussée avec poussière, glissade avec éclats, butée contre un mur, respiration, il se retourne vers le joueur quand il attend, caisse bien placée qui s'allume en vert avec une onde et une lumière verte, saut de joie et confettis à la fin.
- **Même lumière partout** (décision du 19/10) : l'entrepôt au soleil de la maquette 4 pour tous les entrepôts ; seuls le décor autour du plateau et les accessoires changent un peu d'un entrepôt à l'autre (caisses de glace dans la chambre froide, machines dans l'atelier…).

## 5. Les niveaux
- **60 niveaux** répartis en **5 entrepôts de 12 niveaux**, chacun présentant une nouveauté :
  1. **Le quai** : Sokoban de base, du très facile au moyen (les 3 premiers servent de tutoriel).
  2. **La chambre froide** : la glace.
  3. **L'atelier** : les tapis roulants.
  4. **La fonderie** : les caisses lourdes.
  5. **Le grand entrepôt** : tout mélangé, les plus difficiles.
- Niveaux **écrits à la main** dans `magasinier/niveaux.js` (texte, un caractère par case) et **tous vérifiés par un solveur** (§ 11), qui donne aussi le nombre de coups optimal pour les étoiles. Pas de niveaux copiés d'autres jeux.
- Codage : `#` mur, ` ` sol, `.` marque, `$` caisse, `*` caisse sur marque, `@` docker, `+` docker sur marque, `~` glace, `^ v < >` tapis, `h` caisse lourde, `H` caisse lourde sur marque ; combinaisons (caisse sur glace…) écrites avec une couche à part.
- Un entrepôt se débloque quand on a fini 8 niveaux du précédent ; dans un entrepôt, on peut jouer les niveaux dans l'ordre qu'on veut parmi les débloqués (le suivant de chaque niveau fini).

## 6. Étoiles et score
- À la fin d'un niveau : **3 étoiles** si le nombre de coups est au plus l'optimum du solveur + 10 %, **2 étoiles** au plus + 50 %, sinon **1 étoile**. Les annulations ne comptent pas (seul le chemin final compte).
- On garde pour chaque niveau le meilleur nombre de coups et les étoiles. Total d'étoiles sur 180.
- Écran de fin : étoiles qui tombent une à une, coups et objectif des 3 étoiles, boutons SUIVANT, REJOUER, ENTREPOTS.

## 7. Grille du jour
- Niveau **généré** à partir de la date (graine `AAAAMMJJ`), même grille pour toute la famille : plateau de 7×7 à 9×9, 3 à 5 caisses, un peu de glace ou de tapis certains jours. Générateur dans `regles.js`, qui ne garde une grille que si le solveur la résout en 25 à 80 coups (assez dure, mais pas trop).
- **Une seule tentative classée par jour** (règle des défis du jour, puzzles) : la tentative est sauvegardée à part (`magasinier.dailyRun`) et reprise là où on l'a laissée. Le **score est le nombre de coups joués, annulations et recommencements compris** (annuler ne rend pas les coups), pour que connaître la solution ne suffise pas. Une fois réussie, la grille se rejoue hors classement.
- Ajoutée à `TODAY` de l'accueil (marque du défi du jour) et lien `#jour`.

## 8. Écrans
- **Titre** : le docker attend dans l'entrepôt (scène en fond, flou plus fort), titre LE MAGASINIER, boutons JOUER, GRILLE DU JOUR, CLASSEMENT, REGLAGES et le bouton de retour à la Ludothèque (`ludo-retour`).
- **Entrepôts** : les 5 entrepôts en cartes (nom, étoiles gagnées sur 36, cadenas), puis la grille des 12 niveaux de l'entrepôt choisi (numéro, étoiles, cadenas).
- **Jeu** : en haut le niveau (« QUAI 3 »), les coups et le bouton pause ; en bas la croix, ANNULER et RECOMMENCER. Fenêtres et boutons dans le style RPG des maquettes (fond bleu nuit dégradé, double liseré clair), police Press Start 2P (majuscules sans accent).
- **Tutoriel** : bulles courtes sur les 3 premiers niveaux du quai et au premier niveau de chaque nouvel entrepôt (« Sur la glace, tout glisse jusqu'au premier obstacle »).
- **Pause** : REPRENDRE, RECOMMENCER, ENTREPOTS, réglages (bruitages, musique, croix à l'écran, effets), retour à la Ludothèque.
- **Réglages** : bruitages oui/non, musique oui/non, croix à l'écran oui/non, **effets complets ou légers** (légers : sans ombres, sans flou ni halo, moins de particules, pour les téléphones lents).

## 9. Sons
Bruitages synthétisés (Web Audio, comme les autres jeux), discrets : pas sur le plancher, raclement de la caisse poussée, glissade sur la glace, ronron des tapis, choc contre un mur, « clac » et petite note quand une caisse arrive sur une marque, fanfare courte de victoire, bips des menus. **Musique d'ambiance discrète** (décision du 19/10) : générative, synthétisée en Web Audio comme les ambiances de Nebula, chaude et calme (accords doux, petite mélodie espacée, façon taverne ou atelier d'Octopath), mixée nettement sous les bruitages ; coupable à part dans les réglages.

## 10. Technique
- Dossier **`magasinier/`** : `index.html` (écrans HTML, styles), `jeu.js` (écrans, commandes, boucle), **`regles.js`** (logique pure, partagée avec Node : état, coups, glace, tapis, caisses lourdes, annulation, victoire, générateur à graine et solveur ; pas de DOM, pas de `localStorage`, pas de `Math.random`), **`niveaux.js`** (les 60 niveaux et leur optimum), **`scene.js`** (Three.js : textures pixel art, décor, lumières, passe finale, animations des caisses et particules), **`docker.js`** (génération des sprites du docker, reprise de la maquette 5). Charge `../lib/three.min.js` et `../ludo-scores.js`. Scripts classiques, sans build.
- **Animations séparées des règles** : `regles.js` donne la liste des déplacements d'un coup (pas, poussée, glissades, tapis) ; `jeu.js` les joue à vitesse constante (3,4 cases/s à pied, 6,5 sur la glace) avant d'accepter le coup suivant.
- **Fluidité** : un seul rendu WebGL, résolution plafonnée à 2, ombres 1024, images/s réduites dans les menus, rendu arrêté quand la page est cachée ; textures et sprites générés une fois au chargement.
- Musique et bruitages dans **`sons.js`** (Web Audio, sans fichier son).
- `window.Magasinier` pour les tests (état, `charger(n)`, `jouer('HHDG…')`, `annuler()`, `grilleDuJour(date)`).
- **Solveur** `outils/magasinier-solveur.js` (Node) : recherche en largeur sur (position du docker, caisses), avec la glace, les tapis et les caisses lourdes ; vérifie que chaque niveau a une solution, calcule l'optimum en coups et l'écrit pour les étoiles, et vérifie que le générateur du jour produit des grilles valides sur 60 jours. Lancé par `verifications.js` en version rapide (niveaux déjà vérifiés : seulement leur relecture).

## 11. Sauvegarde, classements, intégration
- Sauvegardes (préfixe `magasinier.`) : `magasinier.niveaux` {numéro: {coups, etoiles}}, `magasinier.partie` (niveau en cours et suite de coups, pour le reprendre), `magasinier.daily` {AAAAMMJJ: coups}, `magasinier.dailyRun` (tentative du jour en cours : coups, historique), `magasinier.opts` (bruitages, musique, croix, effets), `magasinier.tuto`. Toutes dans le transfert `LUDO1-` (fusion : meilleur nombre de coups et plus d'étoiles de chaque côté).
- Classements `magasinier` : `etoiles` (total, le plus haut gagne) et `daily:AAAAMMJJ` (le moins de coups gagne).
- Accueil : famille **`3d`** (boîtier de CD, comme Empilage, Odyssée et le Yams), icône 16×16 (caisse et casquette), `META` en tête, `NEWS`, `RECS` (étoiles, niveaux finis, grille du jour), `RANKS`, `PROGRESS` (niveau en cours), `TODAY` (grille du jour).
- Suivre la **liste de contrôle « Ajouter un nouveau jeu »** de `specs/ludotheque.md` : `ludo-scores.js` (`SYNC`, `PSEUDO_BOARDS`), `sw.js` (`FILES`, `VERSION`), transfert, tests (`fumee.js`, `logique.js` pour le générateur du jour), docs, **artefact** (demander le lien à l'utilisateur, ou en créer un s'il le dit).

## 12. Plan de travail (opusplan, une conversation par session)
1. **Session 1, le moteur** : `regles.js` (règles de base et glace, annulation), solveur, `scene.js` et `docker.js` repris des maquettes, commandes (geste, croix, toucher une case), écran de jeu et fin de niveau ; **les 24 niveaux du quai et de la chambre froide**. Jouable sur le téléphone.
2. **Session 2, le contenu** : tapis roulants et caisses lourdes (règles, dessin, solveur), les 36 autres niveaux, étoiles, écrans titre et entrepôts, tutoriel, pause, réglages, bruitages et musique d'ambiance.
3. **Session 3, l'intégration** : grille du jour (générateur, tentative unique), classements, accueil, transfert, tests, docs, artefact.

Coût estimé : 6 à 9 % de la semaine en tout (jeu moyen, mais en 3D avec 60 niveaux à écrire et vérifier).

## 13. Points confirmés par l'utilisateur (19/10)
1. Tapis roulants : « fait comme le jeu original » → le docker n'est pas emporté, seules les caisses (§ 2). *À corriger si ce n'est pas ce qui était voulu.*
2. Caisse lourde telle que décrite : oui.
3. 60 niveaux en 5 entrepôts de 12, entrepôt suivant à 8 niveaux finis : oui.
4. Toucher une case pour déplacer le docker : **non**.
5. Grille du jour comptée en coups, annulations comprises : oui.
6. Lumière qui change d'un entrepôt à l'autre : **non**, même lumière partout.
7. Bruitages **et une musique d'ambiance discrète**.

Cahier des charges validé : prochaine étape la **session 1** (§ 12), opusplan, dans une nouvelle conversation.

## 14. Bilan de la session 1 (19/10)
Fait :
- **`magasinier/regles.js`** : lecture des plans (`magLire` : intérieur, coins morts), coup (`magCoup` : poussée, glace, tapis déjà prêts pour la session 2, caisses lourdes qui ne glissent pas), victoire, solveur en largeur (`magResoudre`), étoiles (`magEtoiles`). Utilisable sous Node.
- **24 niveaux** (`magasinier/niveaux.js`) : 12 au quai, 12 dans la chambre froide (dont le niveau de la maquette, FROID 3). Salles dessinées à la main (`outils/magasinier-salles.js`), marques, caisses et docker placés par `outils/magasinier-generateur.js` (sans glace : recherche à rebours exacte, le niveau le plus long pour ces marques ; avec glace : essais puis améliorations), rangés du plus simple au plus riche. Chaque niveau garde son optimum (`opt`) et une solution optimale (`sol`) ; `outils/magasinier-solveur.js` les vérifie (lancé par `verifications.js`, `--optimum` pour refaire la recherche complète). Optimums : quai 6 à 140 coups, chambre froide 9 à 76.
- **`docker.js`** (sprites du docker repris de la maquette 5) et **`scene.js`** (scène de la maquette 4, généralisée à toutes les tailles de niveau : cadrage auto, murs bas devant une case, décor qui s'adapte, blocs de glace autour de la chambre froide ; animations à vitesse constante, tapis après le pas du docker, poussière, éclats, onde verte, confettis ; réglage « effets légers » : sans ombres ni passe finale).
- **`jeu.js`** : titre (CONTINUER le niveau en cours, JOUER), choix des niveaux par entrepôt (déblocage : le suivant d'un niveau fini ; entrepôt suivant à 8 niveaux finis), jeu (geste, croix, clavier, deux gestes en réserve pendant une animation, ANNULER sans limite, RECOMMENCER), bulles d'aide aux niveaux 1, 2, 3 et 13, pause (croix oui/non, effets complets/légers, retour à la Ludothèque), fin de niveau (étoiles, record). Sauvegardes `magasinier.niveaux`, `magasinier.partie`, `magasinier.opts`. `window.Magasinier` pour les tests.
- `sw.js` (fichiers, version `ludotheque-v40`), test de fumée de la CI.

Pas encore : le jeu n'est **pas sur l'accueil** (session 3) ; on l'ouvre par `magasinier/index.html`. Pas d'artefact (session 3 : demander le lien ou en créer un).

Reste pour la session 2 : dessin des tapis roulants et de la caisse lourde, les 36 niveaux de l'atelier, de la fonderie et du grand entrepôt (salles à dessiner dans `magasinier-salles.js` ; le générateur devra gérer tapis et caisses lourdes par essais et améliorations), bruitages et musique (`sons.js`, le crochet `MagSons.jouer(nom)` est déjà appelé : `pas`, `pousse`, `mur`, `marque`, `victoire`), tutoriel des nouveaux entrepôts, réglages du son.

## 15. Bilan de la session 2 (20/10)
Fait :
- **Tapis roulants et caisses lourdes dessinés** (`scene.js`) : bande sombre à lattes avec chevrons jaunes qui défilent dans le sens du tapis, rebords métalliques ; caisse lourde en fonte gris-bleu cerclée, rivets, plus basse et plus large. Les tapis bougent après le pas du docker.
- **36 niveaux de plus** (`niveaux.js`, 60 en tout) : l'atelier (tapis), la fonderie (caisses lourdes avec glace ou tapis, pour que la différence compte) et le grand entrepôt (tout mélangé, 3 ou 4 caisses). Salles dessinées dans `outils/magasinier-salles.js` ; le générateur gère maintenant tapis et caisses lourdes (essais puis améliorations) et n'accepte que les niveaux dont la solution utilise vraiment les tapis et pousse au moins une caisse lourde. Optimums : atelier 11 à 66 coups, fonderie 11 à 50, grand entrepôt 37 à 122. Les 60 niveaux sont vérifiés (`magasinier-solveur.js --optimum` : ~25 s).
- **Bulles d'aide** au premier niveau de chaque entrepôt (glace, tapis, fonte, grand entrepôt).
- **Sons** (`sons.js`, Web Audio, aucun fichier) : pas, poussée (raclement), glissade, ronron des tapis, choc contre un mur, « clac » et deux notes sur une marque, petite fanfare de victoire, bip des menus ; **musique d'ambiance** générative (accords doux la m, fa, do, sol à 70 battements par minute, basse pincée, quelques notes de mélodie pentatonique), mixée sous les bruitages, coupée quand l'appli passe en arrière-plan. Réglages BRUITAGES et MUSIQUE dans la pause (`magasinier.opts.bruit`, `.musique`).
- `sw.js` : `sons.js`, version `ludotheque-v41`.

Reste pour la session 3 : grille du jour (générateur à graine dans `regles.js`, tentative unique), classements (`etoiles`, `daily:`), accueil, transfert `LUDO1-`, `logique.js`, README, artefact (demander le lien d'abord).

## 16. Bilan de la session 3 (20/10)
Fait :
- **Grille du jour** (`regles.js` : `magGrilleDuJour(AAAAMMJJ)`) : salle tirée de la date (7 à 9 cases de côté avec les murs, quelques blocs de murs, une seule zone libre), 3 marques, recherche à rebours exacte jusqu'à 80 coups, départ le plus lointain entre 25 et 80 coups ; un jour sur trois (jour divisible par 3), quelques cases de glace, alors vérifiées par le solveur (25 à 90 coups). ~0,1 s sous Node ; la grille est gardée pour la journée (`magasinier.jour`). Une seule tentative classée : `magasinier.dailyRun { j, coups, chemin }` reprise au même point ; score = tous les coups joués (annuler et recommencer ne les rendent pas) ; `magasinier.daily { AAAAMMJJ : coups }` ; ensuite la grille se rejoue hors classement. Bouton GRILLE DU JOUR au titre (« FAITE » une fois réussie), lien `#jour`.
- **Classements** `magasinier` : `etoiles` (total, le plus haut gagne, envoyé quand les étoiles montent) et `daily:AAAAMMJJ` (le moins de coups gagne). `ludo-scores.js` : `registerExisting`, `PSEUDO_BOARDS`, `SYNC` 18. Bouton CLASSEMENT au titre (`../index.html#magasinier`).
- **Accueil** : cartouche de la famille 3D (icône `caisse`), `META` en tête (sorti le 20/10, LOGIQUE et DU JOUR), `NEWS`, `RECS` (étoiles sur 180, niveaux réussis, grilles du jour), `RANKS`, `PROGRESS` (grille du jour ou niveau en cours), `TODAY`. **Transfert** `LUDO1-` (`magasinier.niveaux` : moins de coups et plus d'étoiles de chaque côté ; `magasinier.daily` : moins de coups).
- **Tests** : `magasinier-solveur.js` vérifie aussi 3 grilles du jour (60 avec `--optimum`) ; `fumee.js` lance la grille du jour ; `logique.js` fait passer des records du Magasinier par le transfert. README.

Reste : l'**artefact** (demander d'abord à l'utilisateur s'il a un lien) ; essais sur le téléphone (fluidité, difficulté, sons) ; classements à confirmer avec un vrai record.

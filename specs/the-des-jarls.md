# Le Thé des Jarls — cahier des charges (brainstorm du 16/10, à approfondir)

Jeu de dés en duel inspiré de l'**Orlog** d'Assassin's Creed Valhalla (Ubisoft) : on garde ses règles de base, mais **sous un autre nom** et avec notre propre présentation (la mythologie nordique est libre, le nom « Orlog » et les visuels d'Ubisoft non).

## L'idée (choix de l'utilisateur)
- **Thème** : Vikings et dieux nordiques (Thor, Freyja, Loki, Idunn, Vidar…).
- **La différence avec l'original** : au lieu d'un plateau de dés, **deux armées se font face**, et chaque face de dé **déclenche une action de l'armée** :
  - **Hache** → les fantassins chargent (attaque au corps à corps) ;
  - **Flèche** → les archers tirent une volée (attaque à distance) ;
  - **Casque** → les soldats serrent les rangs et parent la charge ;
  - **Bouclier** → les soldats lèvent leur bouclier contre les flèches (mur de boucliers) ;
  - **Main** → un éclaireur file voler un jeton de faveur à l'adversaire ;
  - **Faveur d'un dieu** → le dieu apparaît au-dessus du champ de bataille (éclair de Thor, soin d'Idunn…).
- **Vie** : 15 PV. ~~Un soldat par PV~~ (jugé « un peu vide » le 17/10) → **3 soldats par PV, 45 par armée** (maquette 3) ; chaque dégât fait tomber 3 soldats. L'armée à 0 PV perd.
- **Adversaires** : **contre l'ordinateur** et **à deux sur un téléphone** (on se le passe) ; **en famille à distance plus tard** (duel tour par tour, nouveau script SQL Supabase à lancer par l'utilisateur, même compte que les classements).
- **Progression** : une **campagne de tavernes** (adversaires de plus en plus forts) qui débloque des **faveurs des dieux** et des **unités et apparences** pour son armée (berserkers, cavaliers, bannières ; surtout visuel).
- **Style** : à choisir sur une **maquette** (règle « maquette d'abord ») comparant : HD-2D de profil (soldats en pixel art détaillé, champ de bataille en relief, brume), diorama low poly (figurines vues de haut et en biais), pixel art 16 bits de profil (le moins cher).

## Règles de base reprises de l'Orlog (à vérifier et ajuster)
- 6 dés par joueur, jusqu'à 3 lancers chacun à tour de rôle en gardant les dés voulus.
- Faces : hache, flèche, casque, bouclier, main ; certaines faces **dorées** rapportent un jeton de faveur.
- Avant le combat, chaque joueur emporte 3 faveurs (3 niveaux chacune) ; après les lancers, il peut en payer une avec ses jetons.
- Résolution : haches contre casques, flèches contre boucliers, les mains volent, les faveurs s'appliquent dans l'ordre de leur priorité.

## Réponses de l'utilisateur (16/10, suite du brainstorm)
1. **Défi du jour : oui**, selon la règle des défis du jour de la Ludothèque (une seule tentative classée par jour, comptée dès le départ comme une mission ; même adversaire et mêmes dés pour toute la famille).
2. **Dés** : 3D lancés d'un geste ou dessinés, **à voir sur les maquettes**.
3. **Autant de tavernes que de faveurs** : dans chaque taverne, on affronte **le dieu à qui appartient la faveur** ; il faut le battre pour obtenir sa faveur. **Autant de faveurs que dans Assassin's Creed Valhalla** (20 de mémoire, à vérifier : Baldr, Bragi, Brunhild, Freyja, Freyr, Frigg, Heimdall, Hel, Idunn, Loki, Mimir, Odin, Skadi, Skuld, Thor, Thrymr, Tyr, Ullr, Var, Vidar) ; peut-être d'autres plus tard. Effets à reprendre en les vérifiant, sous nos propres textes.
4. Caractères de l'ordinateur : pas encore tranché ; chaque dieu peut avoir son style de jeu (Thor attaque, Loki vole, Heimdall défend…).
5. **Téléphone en portrait** : **les dés en bas, la bataille en haut**. En **mode deux joueurs sur le même téléphone** (choix du 16/10) : **le téléphone posé à plat entre les deux joueurs**, chacun ses dés en bas de son côté (ceux de l'adversaire tournés vers lui, à l'envers pour l'autre), **la bataille au milieu**.

## Ampleur et découpage proposé
🔴 Gros (2 à 3 conversations, Opus) : (1) maquette du style (dont le choix des dés ; montrer aussi l'écran à deux joueurs) ; (2) règles en logique pure dans `the-des-jarls/regles.js`, testables sous Node, + ordinateur + duel à deux ; (3) armées animées, campagne, déblocages, intégration (accueil, transfert `LUDO1-`, `sw.js`) ; plus tard : duel en famille avec Supabase.

## Maquette (17/10)
`maquettes/the-des-jarls.html` (https://claude.ai/artifact/JVCdwKwDpuyQuh4BVW3yq9), jouable dans les trois styles avec une première version des règles (6 dés, 3 lancers, flèches/boucliers, haches/casques, mains, faces dorées, faveur à 4 jetons : Thor foudroie 2 soldats, Idunn en relève 2 ; l'ordinateur garde haches, flèches et faces dorées). La classe `Partie` de la maquette peut servir de point de départ à `regles.js`. Écran à deux : téléphone à plat, dés et boutons de J2 tournés à 180°, bataille au milieu. Retour : A et B « les plus sympas », A manquait de détails.

## Maquette 2 (17/10)
`maquettes/the-des-jarls-2.html` (https://claude.ai/artifact/28nP1RqW7LD8rShRZh9i5k) : A et B seulement, plus détaillés. A : sprites 28×30 composés pixel par pixel (corps, armes, boucliers peints selon la variante), détourés et éclairés côté soleil, mis en cache ; champ de 158 pixels de large ; drakkar, maison longue, pierre runique, bannières corbeau / loup, flèches plantées, poussière, orage de Thor. B : figurines avec bras, cape, nasal, boucliers peints (6 motifs), chef porte-bannière, terrain en relief avec gué et pont, feu de camp, table avec tasse de thé, bougie et pièces (= jetons), dés arrondis. Piège rencontré : clé de cache `s+kind+pose+v` additionnée en nombre → toujours joindre avec un séparateur. Choix entre A et B : à venir.

## Maquette 3 (17/10)
`maquettes/the-des-jarls-3.html` (https://claude.ai/artifact/XRr9NuYqtwD29qdqhLC3eR) : retour « 15 soldats pour 15 PV, ça fait un peu vide » → 15 PV gardés (casques du HUD), 45 soldats par armée (3 rangs : haches, lances, archers ; chacun 3 colonnes × 5 de profondeur), 3 soldats tombent par PV, Idunn en relève 6. A : perspective (taille 0,74 à 1,02 selon la profondeur) et brume sur les rangs du fond, une bannière par rang. B : figurines à l'échelle 0,8, **fusionnées en une seule géométrie à couleurs de sommets** (bouclier, bras armé et arc restent à part pour être animés) pour garder ~270 objets à dessiner ; lumière déplacée pour que l'ombre de l'armée ne noircisse pas le gué. Choix à venir : nombre de soldats (45 ou entre-deux) et style.

## Choix et maquette 4 (17/10)
**Choix de l'utilisateur : style A (HD-2D), 45 soldats par armée** (« c'est bien mieux avec 45 soldats », « la A est vraiment bien »). Retour : le décor ne faisait pas cohérent avec les soldats et les armées étaient trop proches. Maquette 4 `maquettes/the-des-jarls-4.html` (https://claude.ai/artifact/Ew99jUKZM3iANjBmxHWBLz), A seul : champ de 172 pixels, 26 pixels d'écart de chaque côté du centre (charge de 24) ; **tout le décor en pixels de la même taille que les soldats** (calques de UW×UH pixels agrandis sans lissage) et **détouré** comme eux : contour sombre pour le proche (pierre runique, rochers du premier plan), contour bleu-gris et teintes brumeuses pour le lointain (maison longue, pins et drakkar sur l'autre rive, au centre, dans l'axe du chemin). Le ciel, les montagnes et la brume restent peints en douceur (profondeur de champ). Bannières plus petites. **Validée par l'utilisateur le 17/10** (« tout me va »). Bug signalé et corrigé dans la maquette : un soldat mort au tour précédent avançait avec la charge → **dans le jeu, les poses et déplacements de bataille ne s'appliquent qu'aux soldats vivants**. Prochaine étape : session 2 (règles dans `the-des-jarls/regles.js`, ordinateur, duel à deux), avec Opus, dans une nouvelle conversation.

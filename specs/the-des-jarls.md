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
- **Vie** : les 15 pierres de vie deviennent **15 soldats** ; chaque dégât fait tomber un soldat. L'armée qui n'a plus de soldat perd.
- **Adversaires** : **contre l'ordinateur** et **à deux sur un téléphone** (on se le passe) ; **en famille à distance plus tard** (duel tour par tour, nouveau script SQL Supabase à lancer par l'utilisateur, même compte que les classements).
- **Progression** : une **campagne de tavernes** (adversaires de plus en plus forts) qui débloque des **faveurs des dieux** et des **unités et apparences** pour son armée (berserkers, cavaliers, bannières ; surtout visuel).
- **Style** : à choisir sur une **maquette** (règle « maquette d'abord ») comparant : HD-2D de profil (soldats en pixel art détaillé, champ de bataille en relief, brume), diorama low poly (figurines vues de haut et en biais), pixel art 16 bits de profil (le moins cher).

## Règles de base reprises de l'Orlog (à vérifier et ajuster)
- 6 dés par joueur, jusqu'à 3 lancers chacun à tour de rôle en gardant les dés voulus.
- Faces : hache, flèche, casque, bouclier, main ; certaines faces **dorées** rapportent un jeton de faveur.
- Avant le combat, chaque joueur emporte 3 faveurs (3 niveaux chacune) ; après les lancers, il peut en payer une avec ses jetons.
- Résolution : haches contre casques, flèches contre boucliers, les mains volent, les faveurs s'appliquent dans l'ordre de leur priorité.

## Questions encore ouvertes
1. Défi du jour (même adversaire, mêmes dés pour toute la famille, une seule tentative classée) : oui ou non ? Un classement des tavernes battues ?
2. Les dés en 3D lancés d'un geste (partagés avec **Yams**) ou des dés dessinés ?
3. Combien de tavernes et de faveurs (par exemple 8 tavernes, 12 faveurs) ? Un boss final (un jarl légendaire) ?
4. L'ordinateur : quelques caractères différents (prudent, agressif, voleur) ?
5. Téléphone en portrait (armées en haut et en bas) ou en paysage (armées à gauche et à droite) ?

## Ampleur et découpage proposé
🔴 Gros (2 à 3 conversations, Opus) : (1) maquette du style ; (2) règles en logique pure dans `the-des-jarls/regles.js`, testables sous Node, + ordinateur + duel à deux ; (3) armées animées, campagne, déblocages, intégration (accueil, transfert `LUDO1-`, `sw.js`) ; plus tard : duel en famille avec Supabase.

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

## Session 2 (21/10) : règles, ordinateur, duel à deux — fait
Fichiers : `the-des-jarls/regles.js` (logique pure, préfixe `jar` / `JAR`), `ia.js` (l'ordinateur), `decor.js` (dessin de la maquette 4 repris tel quel : décor, soldats, dieux Thor et Idunn, dés en os), `jeu.js` (page), `index.html`, `style.css` ; simulateur `outils/jarls-simulateur.js` (lancé par `verifications.js`) ; test de fumée dans `outils/fumee.js`. Le jeu est jouable à l'adresse `the-des-jarls/` mais **pas encore sur l'accueil** (session 3). Fichiers dans `sw.js` (`ludotheque-v48`).

**Règles retenues** (Orlog vérifié sur des guides de Valhalla, nos propres textes) :
- 6 dés de 6 faces : 2 haches, 1 flèche, 1 casque, 1 bouclier, 1 main ; **2 faces dorées par dé**, à des places différentes (`JAR_DES`). Une face dorée = 1 jeton.
- Chacun son tour, 3 lancers au plus ; toucher un dé le garde ; TOUT GARDER arrête ses lancers. Le premier joueur est tiré au sort, puis change à chaque manche.
- Après les lancers, chacun (le premier joueur d'abord, l'autre voit son choix) invoque **une** de ses 3 faveurs au niveau I, II ou III, ou aucune.
- Ordre de la bataille : jetons des faces dorées → faveurs « avant » par priorité (Thrymr et Var, puis Freyja, Frigg, Loki, puis Tyr, puis les faveurs de combat) → flèches contre boucliers → haches contre casques → soins et jetons de la bataille (Heimdall, Hel, Mimir, Bragi, Skuld) → les mains volent 1 jeton chacune → faveurs « après » (Thor, Idunn, Odin), qui **ratent si les jetons ont été volés**. Une faveur se paie au moment de son effet ; sans assez de jetons, elle rate.
- À 0 PV la bataille s'arrête aussitôt. Si les deux armées tombent ensemble : celle qui tombe le moins bas gagne, puis celle qui a le plus de jetons, sinon égalité.
- **L'hiver** (ajout à nous, contre les duels sans fin entre dieux qui se soignent) : à partir de la manche 10, chaque armée perd 1 PV à la fin de la manche, puis 2, puis 3…
- Frigg relance et Loki écarte **les dés adverses les plus dangereux, choisis automatiquement** (`jarMenaces`) : pas d'écran de choix en plus.

**Les 20 faveurs** (coûts I/II/III ; effets) : Thrymr 3/6/9, la faveur adverse perd 1/2/3 niveaux ; Var 6/9/12, +1/2/3 PV par jeton dépensé par l'adversaire ; Freyja 2/4/6, 1/2/3 dés de plus ; Frigg 2/3/4, relance 2/3/4 dés adverses ; Loki 3/6/9, écarte 1/2/3 dés adverses ; Tyr 4/6/8, sacrifie 1 PV, l'adversaire perd 2/3/4 jetons ; Vidar 2/4/6, retire 2/4/6 casques ; Ullr 2/3/4, 2/3/6 flèches passent les boucliers ; Baldr 2/4/6, +1/2/3 défense par dé casque ou bouclier ; Brunhild 5/8/14, haches ×1,5/2/3 ; Freyr 4/6/8, +2/3/4 à la face la plus nombreuse ; Skadi 6/10/14, +1/2/3 flèches par dé flèche ; Heimdall 4/7/10, +1/2/3 PV par attaque parée ; Hel 5/9/14, +1/2/3 PV par blessure de hache infligée ; Mimir 3/5/7, +1/2/3 jetons par PV perdu ; Bragi 4/8/12, +2/3/4 jetons par dé main ; Skuld 4/6/8, l'adversaire perd 2/3/4 jetons par dé flèche ; Thor 4/8/12, 2/5/8 blessures après ; Idunn 4/7/10, +2/4/6 PV après ; Odin 2/3/4, sacrifie 3 PV (jamais le dernier) pour 3/4/5 jetons par PV. **Changé par rapport à l'Orlog** pour l'équilibre : Var (10/14/18), Hel (6/12/18), Brunhild (6/10/18), Baldr (3/6/9) moins chers ; Odin à coût bas et sacrifice fixe de 3 PV ; Tyr sacrifie 1 PV.

**L'ordinateur** (`ia.js`) : chaque dieu a un style (poids des faces) et trois faveurs, la sienne d'abord (`JAR_DIEUX`). Il garde ses dés selon son style et ce que montre l'adversaire ; pour la faveur, il essaie chaque faveur à chaque niveau sur une copie de la partie et prend la meilleure. Niveaux 1 (FACILE, se trompe souvent), 2 (NORMAL), 3 (DIFFICILE).

**Équilibre mesuré** (`node outils/jarls-simulateur.js 200 --detail`, ordinateurs niveau 3) : un duel dure environ 6 manches (14 au plus) ; 1 % d'égalités ; le premier joueur gagne 47 % ; le niveau 3 bat un joueur au hasard 98 fois sur 100 et le niveau 1 deux fois sur trois ; chaque dieu gagne de 31 % (Heimdall) à 65 % (Hel) contre les 19 autres. Écart voulu : les plus faibles feront les premières tavernes.

**La page** : seul, la bataille en haut (HUD avec PV en casques et jetons, dés du dieu sur une planche) et le plateau de bois en bas (6 dés en 3 × 2, les 3 faveurs avec leurs coûts, LANCER n/3 et TOUT GARDER ; pendant le choix : toucher une faveur fait I → II → III → aucune, puis INVOQUER ou AUCUNE ; toucher une faveur à un autre moment ouvre sa fiche). À deux : téléphone à plat, plateau de chacun de son côté (celui du jarl rouge tourné de 180°), bataille au milieu, message écrit dans les deux sens ; l'écran du choix des faveurs du jarl rouge est retourné. La bataille est montrée événement par événement (texte, soldats qui tombent 3 par PV, charge, volée de flèches, éclaireurs, dieu qui apparaît, foudre, pommes d'Idunn, neige de l'hiver). Les dieux sans portrait apparaissent en pierre runique qui s'illumine. Sauvegarde : `jarls.run` (duel en cours, repris par CONTINUER), `jarls.faveurs` (dernier choix), `jarls.vaincus` (dieu → meilleur niveau battu, pour la campagne), `jarls.niveau`. Objet de test : `window.Jarls` (`duel()`, `lancer()`, `garder()`, `finir()`, `faveur()`, `accelerer()`).

**Session 3 (à faire, Opus)** : campagne des tavernes (20 dieux du plus faible au plus fort selon le simulateur, gagner sa faveur en battant le dieu), déblocages (faveurs, puis unités et apparences), portraits des 18 autres dieux, sons, défi du jour (même dieu, mêmes dés pour la famille, une tentative comptée dès le départ), classements, accueil (cartouche, icône, `RECS`, `META`, `NEWS`, transfert `LUDO1-`), artefact (lien à demander). Plus tard : duel en famille à distance (Supabase).

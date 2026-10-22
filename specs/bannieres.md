# Bannières — cahier des charges

Petit jeu de conquête au tour par tour, **en 3D**, **pour un enfant de 7 ans** (demande de l'utilisateur du 22/10 : d'où les graphismes « jouet » de KayKit). Tu es un seigneur : tu déplaces tes **armées** sur une carte de cases hexagonales, tu prends des cases, tu **construis ton village** autour de ton château, et tu livres des **batailles qu'on regarde**, jusqu'à prendre les 3 châteaux des autres seigneurs.

**Règle d'or** : des **mots simples**, des **petits nombres** (de 1 à 10), des **dessins** partout (pièces, cœurs, étoiles), une seule règle par chose. Rien à calculer de tête : le jeu montre tout.

Né de l'essai « Duché en 3D » du 21/10. **Duché reste tel quel** ; Bannières est un autre jeu. Nom choisi le 22/10 (BANNIERES à l'écran), dossier `bannieres/`. Version « 7 ans » écrite le 22/10 (elle remplace la première version du cahier, plus compliquée : or, vivres, gloire, électeurs, pourcentages) ; **à valider par l'utilisateur**, avec la maquette 3 (§ 15).

## 1. Ce qu'on garde, ce qu'on simplifie

| Première version | Version 7 ans | Pourquoi |
|---|---|---|
| Or, vivres, gloire, entretien, famine | **Des pièces**, c'est tout | Un seul compteur, qu'on comprend |
| Points de vie « 17/17 » | **Des cœurs** au-dessus des guerriers | On les voit disparaître |
| Chance « 62 % » | **Des étoiles** : ★★★ facile, ★★ ça peut marcher, ★ difficile | Pas de pourcentage à 7 ans |
| Charger / Tenir / Harceler | **FONCER**, **TIRER D'ABORD**, **PRUDENT** (gros boutons avec un dessin) | Le mot dit ce qui se passe |
| Couronne, 9 électeurs, votes | **25 tours, puis on compte les drapeaux** ; ou prendre les 3 châteaux (§ 2) | Un but visible |
| 6 bâtiments à effets fins | **Le village** : 6 bâtiments, une phrase chacun, et des **décorations** pour faire joli (§ 6) | Il aime aménager son village |
| Événements avec des coûts | **Petites surprises** sans calcul (§ 9) | Que du plaisir |
| 24 tours, simulateur d'équilibrage | **25 tours** (une partie = 20 à 30 minutes) ; niveau **facile** où les rivaux sont gentils | Une fin claire |

## 2. Le but

- **La partie dure 25 tours** (choix de l'utilisateur du 22/10). **Après le tour 25, on compte les drapeaux** (les cases de chacun) : celui qui en a le plus gagne. Trois tours avant la fin, un message le rappelle (« PLUS QUE 3 TOURS ! »).
- **Gagner tout de suite** : prendre les **3 châteaux** des autres seigneurs. Chaque château pris : grande fête, les drapeaux changent de couleur.
- **Perdre** : seulement si on te prend ton château. Ton seigneur, lui, ne meurt jamais : s'il tombe, il est **blessé** et rentre au château pour 2 tours.
- **Niveaux** : **FACILE** (les rivaux attaquent rarement, et seulement s'ils sont bien plus forts ; plus de pièces), **NORMAL**.

## 3. La carte

- **37 cases** hexagonales (réglable à 61 si c'est trop petit), tirées au hasard : herbe, forêt, colline, montagne, marais, une rivière. Pas de brouillard (mode possible plus tard).
- 4 seigneurs dans 4 coins : toi (**jaune**), et le rouge, le bleu, le violet.
- Des **camps de brigands** (barbares, voleurs) et des **ruines hantées** (squelettes) gardent un **trésor**.
- Une case à toi a **ta couleur sur ses bords**.

## 4. Un tour

1. **Les pièces tombent** : 1 pièce par case à toi, plus ce que donnent tes bâtiments (on voit « +7 » s'envoler au-dessus du château).
2. **À toi de jouer**, dans l'ordre que tu veux :
   - **bouger une armée** : tu la touches, les cases où elle peut aller **brillent** (en rouge : il y a des ennemis, c'est une bataille) ; tu touches une case, elle y court. Une armée bouge **une fois par tour**, de **2 pas** (une herbe = 1 pas ; une forêt, une colline, un marais, une rivière = 2 pas ; une montagne t'arrête) ;
   - **acheter des guerriers** au château (§ 5) ;
   - **construire** et **décorer** ton village (§ 6).
3. **FIN DU TOUR** : les autres seigneurs bougent. S'ils t'attaquent, tu choisis comment te défendre, et tu regardes la bataille.
4. Au début de chaque tour, chaque guerrier qui ne s'est pas battu regagne **1 cœur**.

## 5. Les guerriers

Chaque guerrier est **un personnage**. Une armée de 5, ce sont 5 personnages. 6 guerriers au plus par armée, 3 armées au plus.

| Guerrier | Prix | Cœurs | Son pouvoir (une phrase) |
|---|---|---|---|
| **Chevalier** | 3 pièces | ♥♥♥ | Il est solide : son bouclier arrête parfois les coups. |
| **Archer** | 3 pièces | ♥♥ | Il tire de loin, avant que les autres arrivent. |
| **Lancier** | 3 pièces | ♥♥♥ | Il arrête ceux qui foncent sur lui. |
| **Mage** | 5 pièces | ♥♥ | Il lance une boule de feu sur deux ennemis. |
| **Champion** | 6 pièces (il faut une caserne) | ♥♥♥♥ | Il frappe très fort, deux ennemis à la fois. |
| **Seigneur** (toi, un seul) | — | ♥♥♥♥♥ | Il ne meurt jamais : blessé, il rentre au château. |

Ennemis : **barbares** (♥♥♥), **voleurs** (♥♥, ils s'enfuient quand ça tourne mal), **squelettes** (♥♥, les flèches passent une fois sur deux entre leurs os), **nécromancien** (♥♥, boule de feu verte).

## 6. Le village (demande de l'utilisateur du 22/10)

On touche **une case à soi**, on appuie sur **CONSTRUIRE**, on choisit un bâtiment (son dessin, son prix, ce qu'il fait). Un échafaudage apparaît, puis le bâtiment **sort de terre** à la couleur du seigneur. **Un bâtiment par case.**

| Bâtiment | Prix | Ce qu'il fait |
|---|---|---|
| **Maison** | 4 pièces | +1 pièce à chaque tour. |
| **Moulin** | 6 pièces | +2 pièces à chaque tour. |
| **Marché** | 10 pièces | +3 pièces à chaque tour. |
| **Forge** | 8 pièces | Tes chevaliers et lanciers ont 1 cœur de plus. |
| **Caserne** | 8 pièces | Tu peux acheter des champions. |
| **Tour** | 6 pièces | Si on t'attaque sur cette case, tes archers tirent une fois de plus. |

- **Décorer** : sur une case à toi, **DECORER** pose une décoration (**1 pièce**) : puits, brouette, tonneaux, caisses, cible de tir, seau, palette de bois. **3 au plus par case**, à des places fixes autour du bâtiment. Elles ne servent qu'à faire joli (et c'est très bien).
- **Le château grandit** : à **3 bâtiments**, des drapeaux de ta couleur poussent autour du château ; à **6 bâtiments**, des remparts (pack KayKit, § 13) ; le château lui-même devient plus grand.
- Une case prise par un ennemi **garde ses bâtiments** (ils changent de couleur) : il faut défendre son village.

## 7. Les batailles

1. **Avant** : les deux armées face à face ; pour chaque façon de se battre, des **étoiles** (★★★ facile, ★★ ça peut marcher, ★ difficile ; calculées en jouant 60 fois la même bataille). Trois gros boutons :
   - **FONCER** : on court tout de suite, et on frappe plus fort au premier coup ;
   - **TIRER D'ABORD** : on attend, les archers tirent deux fois, les chevaliers se protègent ;
   - **PRUDENT** : les archers tirent deux fois, puis on recule si la moitié de l'armée tombe.
   On peut aussi **PARTIR** (l'armée reste où elle était).
2. **Pendant** (une dizaine de secondes, bouton **VITE**) : les flèches, les boules de feu, puis trois corps à corps. Les **cœurs** au-dessus des guerriers disparaissent quand ils sont touchés ; un guerrier sans cœur tombe.
3. **Après** : **BRAVO !** (la case est à toi, le trésor s'il y en a un : « +5 pièces ») ou **DOMMAGE…** (ton armée recule). Les guerriers tombés sont perdus.
- Le terrain compte (une phrase à l'écran) : **forêt** = les flèches passent mal ; **colline** = celui qui défend tire une fois de plus ; **marais, rivière** = celui qui attaque frappe moins fort au premier coup ; **château** = celui qui défend se protège mieux.
- La règle exacte (dégâts, parades) reste celle de la maquette : un calcul tiré d'une graine, le même pour les étoiles et pour la bataille ; les chiffres restent cachés à l'enfant.

## 8. Les rivaux

Trois seigneurs (Baron Aldric, Comtesse Ysolde, Sire Gauvain), chacun avec **un caractère** dit en un mot : **costaud** (il attaque), **bâtisseur** (il construit), **malin** (il attend d'être plus fort). En **facile**, ils n'attaquent que s'ils ont ★★★, et jamais avant le tour 5.

## 9. Petites surprises (environ un tour sur trois)

Une carte en parchemin, un dessin, une phrase, un bouton **SUPER !** : « Un marchand passe : +3 pièces ! », « Un chevalier rejoint ton armée ! », « La récolte est bonne : +2 pièces ! », « Il pleut : les armées ne bougent que d'1 pas ce tour », « Un dragon passe dans le ciel… » (rien, juste pour voir). Pas de mauvaise surprise grave.

## 10. Écrans (portrait, téléphone)

1. **Titre** : la carte qui tourne derrière le logo, CONTINUER, NOUVELLE PARTIE (FACILE / NORMAL), COMMENT JOUER (3 images), sons, ◀ LUDOTHEQUE.
2. **Carte** : en haut, les **pièces**, les **drapeaux**, les **châteaux** (petites icônes) et le **tour** (« TOUR 7/25 ») ; la carte ; en bas, ce qu'on a touché et ses boutons (BOUGER, ACHETER, CONSTRUIRE, DECORER) ; FIN DU TOUR.
3. **Bataille** : avant (étoiles, 3 boutons), pendant (cœurs), après (BRAVO / DOMMAGE).
4. **Surprise**, **fin** (VICTOIRE ! avec feu d'artifice, ou château perdu : REESSAYER), **pause**.
- **Textes** : courts, en MAJUSCULES sans accent (police Press Start 2P), **assez gros** (9 px au moins) ; à vérifier avec lui qu'il les lit (sinon : plus d'icônes, ou une police plus lisible).

## 11. Hasard

Graine (mulberry32) pour la carte, les batailles et les surprises ; **aucun `Math.random()` dans la logique**. Pas de partie du jour, pas de classement obligatoire (un meilleur score `best` possible : drapeaux à la fin).

## 12. Sauvegarde

La partie est sauvegardée à chaque action ; CONTINUER la reprend.

## 13. Technique

- Dossier `bannieres/`, **scripts classiques** : `regles.js` (carte, armées, village, bataille ; logique pure), `ia.js`, `surprises.js`, `carte3d.js`, `bataille3d.js`, `interface.js` (pixel art dessiné par la page), `sons.js`, `jeu.js`.
- `lib/three.min.js`, `lib/GLTFLoader.js`, `lib/SkeletonUtils.js` (r128).
- Modèles **KayKit** (Kay Lousberg, CC0) : Medieval Hexagon (cases, bâtiments, décorations), Adventurers 2.0 et Character Animations 1.1 (personnages, animations), Skeletons (revenants), Dungeon (bannières, murs, caisses, torches), Fantasy Weapons (lance), Forest (buissons). Conversion : `outils/kaykit-conversion.py`, `outils/duche-3d/aventuriers.js`. Données dans des fichiers à part (environ 6 Mo), **mises en cache** par `sw.js` ; écran de chargement.
- **Leçon** : dans un artefact, pas d'image glTF en `data:` (mémo technique).
- Performance : un seul personnage animé par armée sur la carte.

## 14. Plan de travail

0. **Maquettes** : maquette 1 (armées, déplacement, tactiques) et 2 (étendards, lancier, revenants, décors) du 22/10 ; **maquette 3** (version 7 ans : pièces, cœurs, étoiles, gros boutons, village, achat de guerriers), **à valider** (idéalement en la faisant essayer à l'enfant).
1. **Session 1 — Règles** (Opus) : **faite le 22/10**. `bannieres/regles.js` (grille de rayon 3 ou 4, carte, armées, pas, achat, village, décorations, bataille reprise de la maquette, tour, fin ; état JSON, hasard par flux `banRng(graine, usage, a, b)`), `bannieres/surprises.js` (les 5 surprises), `bannieres/ia.js` (rivaux à caractère : achats, bâtiments, où va chaque armée, meilleure tactique ; aussi le joueur automatique), `outils/bannieres-simulateur.js` (lancé par `verifications.js`, 20 parties). Voir § 17.
2. **Session 2 — La 3D et l'interface** (opusplan) : reprise du code de la maquette en fichiers, titre, sauvegarde, comment jouer.
3. **Session 3 — Finitions** : sons, fin de partie, accueil (cartouche), artefact, mémo, tests.

## 15. Points à confirmer par l'utilisateur

- **Les pièces s'entassent** (session 1) : avec 1 pièce par case, le joueur a 15 à 20 pièces par tour vers le tour 10, et le joueur automatique en a 200 au tour 20 (loin des « petits nombres »). Pistes : un **coffre plein à 30 pièces** (« dépense-les ! »), ou **1 pièce pour 2 cases**. À trancher en jouant.

- Les **prix** et les **bâtiments** du § 6 (on ajustera en jouant).
- La **lisibilité** : « ça devrait aller, on verra à l'usage » (22/10).
- Réglé le 22/10 : **session 1 faite** (§ 17) ; **25 tours puis on compte les drapeaux** (ou les 3 châteaux) ; pas de brouillard ; le seigneur ne meurt pas ; pas de cheval pour l'instant (cheval Quaternius CC0 noté dans `IDEES.md`) ; pas de partie classée du jour ; le mage ; les 3 façons de se battre (renommées pour 7 ans) ; des bâtiments à aménager.

## 16. Maquettes

- Maquette 1 et 2 : `maquettes/bannieres.html`, https://claude.ai/artifact/WjSLr1Tx1CPvWEWGmGzyUQ (22/10). Maquette 3 : même lien.
- Packs KayKit gratuits passés en revue le 22/10 : retenus Dungeon (bannières → étendards, murs → remparts, caisses, tonneaux, torches), Skeletons (revenants), Fantasy Weapons (lance ; hallebarde et marteaux en réserve), Forest (buissons, pierres) ; vus et pas retenus : Board Game Bits, Resource Bits, Prototype, Furniture, City Builder, Space Base ; les « Mystery Monthly » n'ont pas de version gratuite.

## 17. Règles ajoutées en session 1 (22/10, à valider)

- **La garde du château** : un château sans armée se défend avec sa garde (2 chevaliers et 2 archers ; en facile, celle du joueur a en plus un lancier). Sans elle, un château vide se prenait en marchant dessus.
- **Au château**, comme avec une tour, les archers de celui qui défend tirent une fois de plus.
- **Deux armées à soi** qui se rejoignent n'en font plus qu'une (6 guerriers au plus) : les guerriers achetés au château peuvent ainsi rejoindre l'armée du seigneur.
- **Une armée bouge une fois par tour** (même s'il lui reste un pas).
- **Prendre le château d'origine d'un seigneur** le fait tomber : ses cases (avec bâtiments et décorations) passent au vainqueur, ses armées s'en vont. Reprendre un château qui avait déjà changé de main ne fait tomber personne.
- **En facile**, les rivaux ne prennent pas les châteaux des autres rivaux (sinon l'un d'eux grossit jusqu'à dépasser l'enfant).
- Les **caractères** des 3 rivaux sont tirés au hasard ; le bâtisseur commence avec 4 pièces de plus et une armée un peu plus petite.
- **Au simulateur** (100 parties par niveau, joueur automatique « malin ») : en **facile**, le joueur gagne 77 % des parties (presque toujours aux drapeaux, en moyenne 16 drapeaux contre 7 par rival) et **ne perd jamais son château** ; en **normal**, 47 % de victoires et 4 % de châteaux perdus. Environ 9 batailles livrées et 6 subies par partie ; une partie va presque toujours jusqu'au tour 25.

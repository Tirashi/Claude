# Amiral ! : le chantier naval (cahier des charges)

Refonte décidée le 17/10. Jeu actuel : `amiral/index.html` (canvas 272 × 480 logiques, bataille navale 8 × 8,
4 navires à pouvoir, IA à 3 niveaux, record en moins de tours, classement `best:<niveau>`).

## 1. Maquettes validées
- **Écrans et ergonomie** : `maquettes/amiral-chantier.html` (https://claude.ai/artifact/7jpyciqv3pN5x4AYJqe2aS).
  C'est une copie du jeu modifiée : on peut reprendre son code (mise en page, polices, torpille, FEU !, écrans).
- **Dessins des navires** : `maquettes/amiral-navires.html` (https://claude.ai/artifact/2kK1n6Uj7Smo4JCavJLiSN),
  fonctions de dessin à reprendre telles quelles.

## 2. Ergonomie (validée)
- **Hauteur qui suit l'écran** : hauteur logique `LH` = largeur × rapport de l'écran, entre 480 et 620 ; la place gagnée va
  aux boutons des pouvoirs (`BAR_H`), à la minicarte et à la boîte des messages (3 lignes). Écrans de menus centrés (`OY`).
- **Torpille en deux gestes** : toucher une case (la ligne et la colonne s'éclairent), puis la flèche du sens voulu
  (à gauche de la ligne, au-dessus de la colonne). Plus de boutons LIGNE / COLONNE.
- **Bouton FEU !** : une fois la cible choisie, la plaque du pouvoir devient « FEU ! » (toucher encore la case marche toujours).

## 3. Polices (validée : direction C « mélange »)
- Logo et gros titres : **Press Start 2P**.
- Tout le reste (textes, boutons, étiquettes, coordonnées de la grille) : **Rajdhani 700**, environ 1,6 × la taille
  Press Start ; petites étiquettes en Rajdhani 700 10 px. La petite police 3 × 5 disparaît.
- Rajdhani est déjà dans `polices/` (`polices/nebula.css`) : l'utiliser en local (feuille de polices avec `data-google`,
  comme Nebula), pour que le jeu marche hors connexion. Messages coupés à la largeur mesurée (`measureText`).

## 4. La flotte : 4 navires à choisir (règle des places 4 / 3 / 3 / 2)
Un navire de 4 cases, deux de 3, un de 2 ; chaque navire au plus une fois. Les 4 navires actuels sont de départ.

| Taille | Navire | Pouvoir | Effet | Recharge | Dessin retenu | Déblocage |
|---|---|---|---|---|---|---|
| 4 | Porte-avions | AVION | révèle une zone 3 × 3 | 3 | actuel | départ |
| 4 | Croiseur | MISSILES | 3 tirs sur 3 cases au choix | 5 | **C « pont bleu 1944 »** (cuirassé façon USS Iowa / Missouri, pont peint en bleu marine) | victoire en moins de 20 tours |
| 4 | Navire-atelier | REPARATION | répare une case touchée d'un navire pas coulé | 5 | A « portiques » | victoire sans perdre de navire |
| 3 | Cuirassé | SALVE | 5 tirs en croix | 4 | actuel | départ |
| 3 | Sous-marin | PLONGEE | se déplace (2 cases au plus, s'il n'est pas touché) | 4 | actuel | départ |
| 3 | Destroyer | SONAR | nombre de cases de navire sur une ligne ou une colonne | 3 | A « moderne » | une victoire |
| 3 | Mouilleur de mines | MINES | pose 2 mines dans ses eaux ; l'ennemi qui tire dessus prend un tir en retour | 5 | **C2** (file de mines, flancs orange, cabine et cheminée) | victoire en CAPITAINE |
| 3 | Brouilleur | FUMEE | 2 tours : les tirs ennemis dans une zone 3 × 3 ne disent plus « touché » ou « manqué » | 5 | **A1** (parabole, pots de fumée, passerelle à ailerons et mât) | victoire en AMIRAL |
| 2 | Torpilleur | TORPILLE | file jusqu'au premier navire | 3 | actuel | départ |
| 2 | Vedette | LEURRE | un faux navire de 2 cases | 6 | B « porte-leurre » | 10 victoires |
| 2 | Garde-côte | PROJECTEUR | révèle une ligne de 4 cases | 3 | A « bande rouge » | 5 victoires |

Les recharges et les conditions sont des propositions, à ajuster pendant les sessions.

## 5. Écrans
- **Titre** : JOUER mène au CHANTIER NAVAL ; bouton BATAILLE DU JOUR ; reste comme aujourd'hui.
- **Chantier naval** : les 4 places en haut (toucher une place la sélectionne et ouvre l'onglet de sa taille) ; onglets
  4 / 3 / 2 CASES ; cartes du catalogue (dessin, nom, pouvoir, recharge, effet) ; verrouillé = silhouette + cadenas +
  condition en rouge ; « EN SERVICE », badge « NOUVEAU ! » ; boutons MENU et PLACER LA FLOTTE. Annonce
  « NOUVEAU NAVIRE DEBLOQUE ! » en fin de partie (comme le HANGAR d'Escadrille).
- **Flotte ennemie** : MOUSSE = flotte classique ; CAPITAINE et AMIRAL = tirée dans tout le catalogue ;
  le panneau FLOTTE ENNEMIE montre ses pouvoirs.
- **Bataille du jour** : flottes des deux camps imposées et tirées de la date (navires verrouillés compris, étiquette
  « A ESSAYER »), placement ennemi et hasard de l'IA tirés de la date ; une seule tentative classée par jour (règle du
  15/10, tentative comptée dès le départ) ; classement `daily:<date>` au nombre de tours.

## 6. Découpage
- **Session 1** : ergonomie, polices, hauteur, écran du chantier, pouvoirs généralisés par navire (aujourd'hui
  `POWERS[..].ship` est un indice fixe), 3 ou 4 nouveaux navires jouables avec l'IA qui sait les utiliser et les contrer
  (commencer par les plus simples : MISSILES, SONAR, PROJECTEUR, REPARATION).
- **Session 2** : MINES, FUMEE, LEURRE (les plus délicats pour l'IA), déblocages et annonce, bataille du jour,
  accueil, classements (`daily:`), transfert `LUDO1-` (navires débloqués), fumée, artefact au lien d'Amiral !.
- Modèle : Opus (l'IA des pouvoirs est le point délicat).

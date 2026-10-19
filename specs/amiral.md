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

## 7. Bilan de la session 1 (17/10)
Fait dans `amiral/index.html` :
- **Ergonomie** : hauteur logique `LH` entre 480 et 620 selon l'écran (`layout()` : `BY_BAR`, `BAR_H`, minicarte, boîte des
  messages qui affiche autant de lignes qu'elle peut) ; titre et chantier dessinés pour 480 et centrés (`OY`) ; écran de fin centré.
- **Polices** (direction C) : Press Start 2P pour les logos, Rajdhani 700 pour tout le reste (`polices/nebula.css` en local,
  et le lien Google qui contient aussi Press Start 2P pour l'artefact). Petite police 3 × 5 retirée. Les noms trop longs pour
  leur plaque (REPARATION, PROJECTEUR) passent en 9 px.
- **Pouvoirs généralisés** : `SHIPS` (catalogue des 11 navires : taille, pouvoir, `ok` = programmé), `POWERS` (nom, recharge,
  description, `dir` = pouvoir en ligne à deux gestes, `own` = vise sa propre flotte). Chaque flotte est une liste de 4 navires
  (`makeBoard(fleet)`), `b.cd` est indexé par ses pouvoirs, `shipOf(b, pouvoir)` retrouve le navire, `blocked(side, p)` dit
  pourquoi un pouvoir ne peut pas servir (`sunk`, `cd`, `hit`, `stuck`, `intact`).
- **Torpille, sonar et projecteur en deux gestes** : toucher une case, puis la flèche de gauche (ligne) ou du haut (colonne).
  **FEU !** sur la plaque du pouvoir quand la cible est choisie.
- **4 nouveaux navires jouables** :
  - croiseur, MISSILES (recharge **4**) : toucher 3 cases (toucher une cible la retire), puis FEU ! ; les missiles arrivent en biais avec leur traînée ;
  - destroyer, SONAR (3) : compte les cases de navire **pas encore touchées** d'une ligne ou colonne. Le badge au bout de la
    ligne (`b.sonar`) reste à jour : il baisse à chaque touché, monte à chaque réparation, disparaît si le sous-marin plonge
    dans la ligne ; à 0 les cases inconnues deviennent de l'eau, s'il égale le nombre de cases inconnues elles sont repérées (`sonarDeduce`) ;
  - garde-côte, PROJECTEUR (**2**) : révèle 4 cases autour de la case touchée, dans le sens choisi ;
  - navire-atelier, REPARATION (**4**) : répare une case touchée d'un navire pas coulé ; **la case retourne dans le brouillard**
    pour l'adversaire (avec « l'ennemi sait toujours qu'un navire est là », le navire-atelier ne servait à rien : l'ennemi refrappait aussitôt).
    Réparer le sous-marin lui rend sa plongée.
- **IA** (fonctions qui prennent le camp, pour pouvoir jouer les deux) : repérage d'abord (avion, projecteur, sonar), puis
  n'importe quelle arme prête plutôt qu'un tir simple ; missiles sur les 3 cases les plus probables ; sonar sur la ligne la plus
  prometteuse jamais sondée ; densité renforcée sur les lignes sondées ; réparation dès qu'un navire est touché (d'abord celui
  qui va couler, ou le sous-marin) ; le sous-marin plonge aussi quand sa ligne a été sondée.
- **Chantier naval** : JOUER → chantier ; 4 places, onglets 4 / 3 / 2 CASES, cartes du catalogue, EN SERVICE, NOUVEAU !
  (jusqu'à la première visite de l'onglet), MOUILLEUR, BROUILLEUR et VEDETTE en silhouette « EN CONSTRUCTION » (session 2).
  Flotte gardée dans `amiral.flotte`, navires vus dans `amiral.vus`. Écran titre : les 4 pouvoirs de la flotte choisie.
  Écran de fin : bouton CHANTIER.
- **Flotte ennemie** : classique en MOUSSE, tirée parmi les navires programmés en CAPITAINE et AMIRAL.
- **Palmarès** (`amiral.palmares` : `victoires`, victoires par niveau, `rapide` < 20 tours, `intacte` sans perdre de navire),
  enregistré dès maintenant pour les déblocages de la session 2.
- **Tests** : `window.Amiral` ; `Amiral.simulate(flotteA, flotteB, niveau)` joue une partie IA contre IA sans animation
  (`S.fast`) ; `outils/fumee.js` joue missiles, sonar, projecteur, réparation, la riposte, et 36 parties simulées.

**Réglages** (parties simulées IA contre IA en AMIRAL, 1 500 par flotte, contre la flotte classique ; le camp qui commence
gagne 0,60 à flottes égales) : croiseur à la place du porte-avions 0,56 ; navire-atelier à la place du porte-avions 0,50 ;
garde-côte à la place du torpilleur 0,51 ; destroyer à la place du sous-marin 0,64 (à la place du cuirassé 0,29 : la salve
est forte). Les pouvoirs de renseignement valent sans doute plus pour un joueur que pour l'IA.

**Pour la session 2** : retirer « EN CONSTRUCTION », brancher les conditions de déblocage sur `amiral.palmares`
(et `usable()`), l'annonce « NOUVEAU NAVIRE DEBLOQUE ! » ; MINES, FUMEE, LEURRE ; bataille du jour ; accueil ; transfert ; artefact.
**Décision de l'utilisateur (17/10) : on ne reverrouille pas** les 4 navires ouverts à la session 1 (croiseur, destroyer, garde-côte, navire-atelier) ; seuls le mouilleur, le brouilleur et la vedette auront une condition de déblocage.

## Correction du 17/10 (après la session 1)
- **Textes mal alignés** (boutons, « EN SERVICE », lignes de fin de partie) : dans `tiny()`, l'instruction
  `g.textAlign = …; g.textBaseline = …` s'était retrouvée collée à la fin d'un commentaire `//`, donc jamais exécutée ;
  chaque étiquette prenait l'alignement du texte précédent. Leçon : ne jamais ajouter un commentaire de fin de ligne
  devant une instruction sur la même ligne.
- Panneau FLOTTE ENNEMIE : un nom long (REPARATION, PROJECTEUR) se resserre pour ne plus toucher « PRET ».

## 8. Bilan de la session 2 (19/10)
Fait dans `amiral/jeu.js` :
- **Mouilleur, MINES** (recharge 5) : toucher 2 cases d'eau libre de sa flotte (ni navire, ni case visée ou repérée par l'ennemi), puis FEU ! ; 4 mines au plus. L'ennemi qui tire sur une mine la fait sauter et prend un **tir en retour qui touche à coup sûr** un de ses navires (au hasard). Un tir en retour ne déclenche pas de mine (pas de chaîne). L'IA pose ses mines à côté de ses navires touchés (l'adversaire va y chercher la suite), sinon près de ses navires.
- **Brouilleur, FUMEE** (5) : une zone 3 × 3 de sa flotte ; pendant les **2 coups ennemis** suivants, ce qu'on tire dedans ne dit ni touché ni à l'eau (« ? » dans la fumée), l'avion et le projecteur n'y voient rien ; un navire coulé se voit quand même ; quand la fumée se dissipe, les résultats apparaissent. Le sonar n'est pas trompé (son badge baisse quand on touche dans la fumée). Plateaux : `b.smoke`, `b.veil` ; l'IA ignore les cases voilées. L'IA s'en sert sur ses navires touchés ou repérés.
- **Vedette, LEURRE** (**5**, au lieu de 6) : un faux navire de 2 cases sur de l'eau libre (toucher une case, encore une fois pour le pivoter, FEU !). Pour l'adversaire c'est un navire : touché au tir (`shots` = 3), vu par l'avion, le projecteur, le sonar, arrête la torpille. Ses deux cases touchées, il se dégonfle (« C'était un leurre ! ») et redevient de l'eau. 2 leurres au plus. L'IA le pose là où l'adversaire a le plus de chances de tirer (ses probabilités), loin de ses navires, un à la fois.
- **Déblocages** (`unlocked()`, `need` dans `SHIPS`) : mouilleur = gagner en Capitaine, brouilleur = gagner en Amiral, vedette = 10 victoires ; silhouette, cadenas et condition en rouge au chantier ; annonce « NOUVEAU NAVIRE DEBLOQUE ! » sous le bilan de fin, badge NOUVEAU ! au chantier.
- **Bataille du jour** (bouton sur l'écran titre, écran « BATAILLE DU JOUR » avec les deux flottes, étiquette A ESSAYER sur un navire pas encore débloqué) : flottes tirées dans tout le catalogue, placement ennemi et hasard de l'IA tirés de la date (`seeded`, `rng`), niveau Capitaine ; tentative classée comptée au COMBAT ! (`amiral.dailyTry`), la suite hors classement ; `amiral.daily`, classement `daily:<AAAAMMJJ>` ; la victoire du jour compte au palmarès mais pas au record du niveau.
- **Accueil** : défi du jour (marque de la cartouche), records (victoires, navires au chantier, batailles du jour), vue BATAILLE DU JOUR du classement, transfert du palmarès et des batailles du jour, `SYNC` 17.
- **Tests** : `outils/fumee.js` (mines, riposte, fumée, leurre, bataille du jour, 108 parties simulées avec les nouveaux navires), `outils/logique.js` (bataille du jour des 60 prochains jours, transfert).

**Réglages** (Amiral contre Amiral, contre la flotte classique ; le camp qui commence gagne 0,60 à flottes égales) : mouilleur à la place du sous-marin 0,50 avec un tir en retour ordinaire, **0,55** avec le touché assuré ; brouilleur à la place du sous-marin **0,51 à 0,56** ; vedette à la place du torpilleur 0,41 puis **0,47–0,48** avec le leurre posé sur les probabilités de l'adversaire (autant que le garde-côte à la même place, 0,48 : la torpille est forte dans les mains de l'IA). Comme à la session 1, ces pouvoirs défensifs valent sans doute plus pour un joueur que pour l'IA.

# Jeux 16 bits

Des jeux jouables dans le navigateur, sans build ni dépendance. La page [`index.html`](index.html) à la racine est un menu qui mène à tous les jeux :

- [`queens/index.html`](queens/index.html) : **Queens 16-Bit**, une reprise du jeu Queens de LinkedIn.
- [`picross/index.html`](picross/index.html) : **Picross Dex**, un picross sur le thème des Pokémon (fan-game personnel, non officiel).
- [`lignee/index.html`](lignee/index.html) : **Lignée**, un puzzle de généalogie : reconstituer un arbre grâce aux indices, en famille française ou en dynastie royale.
- [`injagility/index.html`](injagility/index.html) : **Injagility**, un jeu d'agility canine en 32 bits : course sans fin façon dino de Chrome, et parcours vus du dessus ([`injagility/parcours.html`](injagility/parcours.html)) avec six races à adopter.
- [`touche-coule/index.html`](touche-coule/index.html) : **Touché Coulé**, une bataille navale contre l'ordinateur (modes Classique et Arsenal).
- [`club/index.html`](club/index.html) : **Le Club d'agility**, un jeu de gestion en 32 bits : recruter des chiens, les entraîner semaine après semaine, gagner les concours et faire grandir le club jusqu'au Championnat de France.
- [`amiral/index.html`](amiral/index.html) : **Amiral !**, une bataille navale tactique en 32 bits où chaque navire a un pouvoir (avion de reconnaissance, salve, torpille, plongée du sous-marin).
- [`lune-rover/index.html`](lune-rover/index.html) : **Lune-Rover**, un puzzle de programmation en 32 bits : écrire à l'avance le programme d'un petit robot lunaire pour ramasser tous les cristaux, en 30 niveaux.
- [`orbite/index.html`](orbite/index.html) : **Orbite**, un jeu de physique en 32 bits : lancer une sonde dont la trajectoire est courbée par la gravité des planètes pour atteindre une balise, en 30 niveaux.
- [`pont-stellaire/index.html`](pont-stellaire/index.html) : **Pont stellaire**, un puzzle de logique en 32 bits (les règles du Hashi) : relier les étoiles par des faisceaux de lumière pour dessiner une constellation, avec un Ciel du jour.
- [`calculator/index.html`](calculator/index.html) : **Calculator**, le calcul mental de 7 à 77 ans : additions, soustractions, multiplications et divisions sur 5 niveaux, en série de 20, contre la montre ou avec le calcul du jour, en trois styles (arcade, cahier d'écolier, calculatrice de poche).
- [`sudoku/index.html`](sudoku/index.html) : **Sudoku**, le jardin des chiffres en 32 bits : grilles 4×4 et 6×6 pour débuter, 9×9 facile, moyen ou difficile, notes au crayon et grille du jour.
- [`empilage/index.html`](empilage/index.html) : **Empilage**, le premier jeu en 3D : lâcher chaque bloc pile sur la tour et monter du matin jusqu'à la nuit étoilée.
- [`odyssee/index.html`](odyssee/index.html) : **Odyssée**, en 3D : pencher le téléphone pour ramener la galère d'Ulysse de Troie jusqu'à Ithaque.
- [`alunissage/index.html`](alunissage/index.html) : **Alunissage**, un jeu d'adresse : poser un module en douceur avec deux réacteurs, site après site.
- [`nebula/index.html`](nebula/index.html) : **Nebula**, un rogue-lite tactique spatial : mener sa flotte de balise en balise et vaincre les pirates qui annoncent leurs tirs.
- [`tetris/index.html`](tetris/index.html) : **Tetris**.
- [`snake/index.html`](snake/index.html) : **Snake**.
- [`asteroids/index.html`](asteroids/index.html) : **Asteroids**.
- [`jeu-de-la-vie/index.html`](jeu-de-la-vie/index.html) : **Jeu de la Vie**, l'automate cellulaire de Conway (voir son propre README).
- [`solitaire/index.html`](solitaire/index.html) : **Solitaire**, le Klondike de Windows XP.

Sur le menu : les **cartouches en 3D**, debout sur des planches, qui flottent et pivotent doucement (un modèle par famille : cartouche grise pour les jeux 16 bits, noire striée pour les jeux 32 bits, poche en plastique transparent pour les reprises), avec des filtres (tous, favoris, nouveau, du jour, **en cours**) commentés par le gardien. Une étiquette signale un jeu tout neuf, mis à jour ou une partie en cours, une étoile les favoris et une couronne les jeux où l'on détient un record de la famille. **Toucher une cartouche** la fait tourner, puis un volet monte du bas : la **boîte du jeu** qui tourne, sa description, ☆ FAVORI, **mes records** sur cet appareil, **le classement de la famille** et JOUER (le bouton retour du téléphone referme le volet). Sous les cartouches : un **tri** (favoris d'abord, nouveautés, nom, dernière partie lancée depuis le menu), une **recherche** (nom, description ou genre, sans se soucier des accents ; Entrée ouvre le premier jeu trouvé), le bouton **Surprends-moi** (les cartouches défilent dans une console et un jeu au hasard parmi ceux affichés est lancé), le jeu à la une dans sa boîte avec le quoi de neuf, et le transfert de sauvegardes.

---

## Queens 16-Bit

Une reprise du jeu **Queens** de LinkedIn, jouable dans le navigateur, avec une direction artistique rétro 16 bits (fenêtres façon RPG Super Nintendo, police pixel, sprites de couronne, scanlines CRT et bruitages chiptune).

### Jouer

Ouvre `queens/index.html` dans n'importe quel navigateur récent. Aucun build, aucune dépendance.

### Règles

- Une reine par ligne, par colonne et par zone de couleur.
- Deux reines ne peuvent pas se toucher, même en diagonale.
- Un clic pose une croix, deux clics une reine, trois clics vident la case. Glisser pose plusieurs croix.

### Fonctionnalités

- Grilles de 5×5 à 9×9 générées à l'infini, chacune avec **une solution unique** (vérifiée par un solveur).
- Conflits signalés en rouge.
- Auto-X (activé par défaut) : poser une reine met une croix sur toutes les cases qu'elle interdit, retirer la reine les enlève.
- Annuler, effacer, indice, chrono et record par taille (stocké localement).
- **Grille du jour** : la même grille pour toute la famille (graine = date), qui grandit au fil de la semaine (5×5 le lundi, 6×6 le mardi, 7×7 le mercredi et le jeudi, 8×8 le vendredi, 9×9 le week-end). Score = temps + 30 secondes par indice. **Une seule tentative classée** : la partie du jour est sauvegardée, chrono compris (le chrono s'arrête quand on quitte l'appli et reprend au retour) ; une fois réussie, elle se rejoue hors classement. Le score du jour part au classement et au transfert de sauvegardes. Lien direct : `queens/index.html#jour`.
- Jouable au clavier : flèches, Espace, Q, X, Z.

---

## Picross Dex

Un picross (nonogramme) dans un boîtier de Dex rouge façon 16 bits. Chaque grille résolue révèle un Pokémon en couleur et l'enregistre dans le Dex.

- 207 grilles : 8 en 10×10, 193 en 15×15, 3 en 15×10 et 3 en 20×20 (Dracaufeu, Léviator et Mewtwo), toutes résolubles par pure logique, sans deviner (vérifié par un solveur). Le Dex est rangé par numéro de Pokédex.
- Les 151 Pokémon de la première génération au complet (de Bulbizarre à Mew), plus la Poké Ball.
- Johto : les n° 152 à 200 (des starters à Feuforêve, Togepi compris), dessinés d'après la planche « Minidex », et ses légendaires :
  - Raikou, Entei et Suicune se réveillent après 10 captures à Johto, puis rôdent : chaque nouvelle rencontre dans les hautes herbes de Johto a 1 chance sur 10 d'en faire surgir un (garanti après 15 rencontres sans chien). Quitter sa grille, ou fermer le jeu, le fait fuir. Une fois les autres Pokémon de Johto tous capturés, le bouton des hautes herbes affiche LÉGENDAIRES et chaque rencontre fait surgir un chien.
  - Ho-Oh apparaît une fois les trois chiens capturés, Lugia après 30 captures à Johto (plafonné au nombre de Pokémon de Johto déjà dans le jeu), et Celebi (fabuleux) une fois Lugia et Ho-Oh capturés.
- **Deux Pokédex, Kanto et Johto** : le Dex de Johto reste caché jusqu'à la capture de Mewtwo, puis un onglet JOHTO apparaît (liste, compteur et hautes herbes propres à chaque région). Togepi attend dans le Dex de Kanto et passe dans celui de Johto à ce moment-là, capture comprise.
- **Hautes herbes** : on choisit une taille de grille et un Pokémon sauvage pas encore capturé de cette taille est tiré au hasard. Son nom et son numéro restent cachés jusqu'à la fin de la grille ; il apparaît ensuite dans le Dex, où l'on peut refaire sa grille pour battre son temps.
- Une rencontre en cours par taille : quitter la grille la met de côté, et le bouton de la taille devient REPRENDRE. FUIR (deux appuis) abandonne la grille et renvoie le Pokémon dans les hautes herbes.
- Les cases des Pokémon pas encore rencontrés restent vides dans le Dex. Les grilles commencées avant l'arrivée des hautes herbes y restent accessibles (« en cours »).
- Lignes d'évolution complètes de Roucool, Minidraco et Caninos.
- Les trois oiseaux légendaires (Artikodin, Électhor, Sulfura) sont verrouillés jusqu'à ce que 10 picross soient terminés.
- Mewtwo apparaît une fois les trois oiseaux capturés et 40 picross terminés, et Mew (Pokémon fabuleux) une fois Mewtwo capturé. Un Pokémon déjà capturé n'est jamais reverrouillé.
- Les nouvelles grilles sont toujours ajoutées en fin de liste, sans toucher aux anciennes, pour que les sauvegardes restent valides.
- **Mode test** : toucher 5 fois le titre PICROSS DEX ouvre toutes les grilles du Dex (légendaires compris) et rend les indices illimités ; 5 nouveaux appuis le coupent. Les captures y comptent comme d'habitude.
- Clic ou toucher pour remplir, clic droit ou outil CROIX pour marquer, glisser pour peindre une ligne.
- Indices barrés quand une ligne est juste, aperçu miniature, chrono, annuler.
- **ZOOM** (pendant une grille) : masque le boîtier, la décoration et l'aide, place la miniature, le numéro et le chrono sous la grille et ajuste les cases au pixel près pour que la grille prenne toute la largeur (sur téléphone, cases de 17 à 23 px en 15×15, de 13 à 17 px en 20×20). Le choix est mémorisé.
- **Manette du mode ZOOM** : une croix directionnelle déplace un curseur sur la grille, A remplit et B pose une croix (un second appui efface). Garder A ou B appuyé en se déplaçant remplit ou barre toute une ligne ; garder une flèche appuyée fait défiler le curseur.
- 3 indices par grille (chacun complète une ligne), illimités en mode test. Effacer la grille ne les rend pas.
- Progression, records et grilles en cours sauvegardés dans le navigateur.
- **Transférer ma sauvegarde** (en bas du Dex) : copie un code dans le presse-papiers et le colle dans un autre navigateur, par exemple pour passer du navigateur intégré de Facebook à Chrome. L'import fusionne les deux progressions et garde le meilleur temps.

Projet de fan à usage strictement personnel, sans lien avec Nintendo, Game Freak ou The Pokémon Company. Le pixel art a été dessiné pour ce jeu.

---

## Lignée

Un puzzle de logique sur le thème de la généalogie. Un arbre vide s'affiche (couples reliés, enfants en dessous) avec une réserve de personnages en pixel art ; une liste d'indices (« Louise est la grand-mère de Hugo », « Paul n'a pas de frère », « Le père de Chloé n'a ni frère ni sœur »…) permet de replacer chacun dans sa case.

- Trois modes : **Classique** (familles françaises, prénoms d'époque de génération en génération), **Royal** (dynasties médiévales, portraits couronnés, indices au vocabulaire royal : aïeul, premier-né, descendance…) et **Cinélogie**.
- **Cinélogie** : les familles de films et de séries, dans leur version officielle et sans révélation : les Ewing (Dallas), les Maisons Stark et Lannister (Game of Thrones), les Simpson, les Skywalker (Star Wars), les Weasley (Harry Potter), les Corleone (Le Parrain), les Roy (Succession) et les Bridgerton. L'arbre est fixe, mais chaque partie tire de nouveaux indices au niveau choisi. Un trait en pointillés relie un enfant à un seul parent (Jon Snow, Herb Simpson, Connor Roy…), et les jumeaux à l'ordre de naissance inconnu (Fred et George) sont interchangeables.
- Quatre niveaux : **Facile** (3 générations, 6 ou 7 personnes, liens directs), **Moyen** (3 générations, 9 ou 10 personnes, grands-parents, oncles, cousins, aînés), **Difficile** (4 générations, 12 à 14 personnes, belle-famille et comptages) et **Expert** (4 générations, jusqu'à 16 personnes, sans le sexe des cases hors couples).
- Conventions : dans un couple, l'homme est à gauche ; les frères et sœurs vont du plus âgé (à gauche) au plus jeune (à droite) ; l'arbre est complet.
- Indices « X est plus âgé que Y » entre frères et sœurs, en plus des liens de parenté.
- Arbres générés à l'infini : le générateur tire une famille, écrit des indices vrais, puis un solveur ajoute et retire des indices jusqu'à ce qu'il ne reste qu'une seule solution, trouvable sans deviner.
- Chaque arbre a un code (par exemple `C2-K3F9QX`) pour le rejouer ou le partager, et un **Arbre du jour** (niveau Moyen) est le même pour tout le monde, en Classique et en Royal. Un arbre déjà reconstitué se rejoue hors classement.
- Toucher une personne (la réserve est rangée par ordre alphabétique) puis une case pour la placer. Une personne bien placée y reste ; une erreur coûte une des **3 vies** et renvoie la personne dans la réserve. Quand il n'y a plus de vie, l'arbre est perdu : on peut le recommencer depuis le début, mais le chrono continue.
- Un indice dont toutes les personnes sont placées se coche tout seul et descend en bas de la liste, en gardant son numéro.
- La partie en cours est sauvegardée ; les records de temps et le nombre d'arbres réussis par mode et par niveau font partie du transfert de sauvegardes.

## Injagility

Deux modes, reliés par des onglets en haut de page.

**Mode infini** : ton chien enchaîne les obstacles d'agility, dans l'esprit du jeu du dino de Chrome. Le chien est celui choisi au chenil du mode Parcours.

- Graphismes en style 32 bits : écran de 480 × 240, décor en plusieurs plans (nuages, collines, arbres, barrière du ring avec fanions, pelouse tondue), obstacles vus de trois quarts.
- Les 6 races sont dessinées par [`injagility/chiens32.js`](injagility/chiens32.js), partagé par les deux modes : chaque chien est monté comme un squelette (corps, cou, tête, oreilles, queue, quatre pattes articulées), peint en pixels ombrés avec 4 nuances par couleur, avec ses propres proportions, marques, oreilles, queue et poil. Galop en 8 images, saut en 5, reptation dans le tunnel en 4.

- Obstacles : haie, oxer (double barre), pneu (plus haut) et tunnel (il faut se baisser jusqu'à la sortie).
- Saut à hauteur variable selon la durée d'appui, descente rapide en se baissant en l'air.
- Vitesse qui augmente avec la distance, points par obstacle, record sauvegardé dans le navigateur.
- Commandes : Espace ou ↑ pour sauter, ↓ pour se baisser ; sur mobile, toucher l'écran, glisser vers le bas ou utiliser les boutons SAUTER et TUNNEL.

**Mode parcours** ([`injagility/parcours.html`](injagility/parcours.html)) : un terrain vu du dessus, en grille. Il est dessiné en 32 bits, comme le mode Infini : cases de 32 pixels, pelouse tondue, buissons et flaques en volume, obstacles avec leurs ombres, et un chien vu du dessus pour chaque race, qui trotte, saute et accélère après un os. On trace au doigt le chemin du chien de la ligne de départ à l'arrivée, en passant par les obstacles numérotés dans l'ordre, puis le chien le parcourt.

- Haie et pneu se prennent de face (on entre et on ressort tout droit, barre en travers) ; le tunnel, en U ou en S, se suit d'un bout à l'autre ; slalom et passerelle demandent pendant la course de taper une suite de flèches (◀ ▶ pour le slalom) avant la fin du chrono.
- Os en bonus (des points, et un coup de boost de 4 cases), flaques en malus (ralentissent et coûtent des points), buissons infranchissables.
- Parcours numérotés et sans fin, de plus en plus longs, avec de nouveaux obstacles aux niveaux 2 à 5. Chaque parcours est généré à partir d'un chemin caché, donc toujours faisable.
- Points : 30 par obstacle, os, bonus de temps, moins les flaques et les fautes de boutons. Ils servent à adopter des races au chenil : Jack Russell (slalom facile), Golden retriever (os doublés), Border collie (plus rapide), Berger australien (les sauts ne ralentissent pas), Berger des Shetland (passerelle facile, flaques sans effet).
- La progression (niveaux, records, points, chiens) est sauvegardée et fait partie du transfert de sauvegardes.

---

## Lune-Rover

Un puzzle de programmation en style dessin animé : on écrit à l'avance le programme de Pico, le petit robot lunaire, puis GO ! Pico réagit à ce qu'il fait (concentré, ravi quand il ramasse un cristal, étourdi après un choc, vertige au bord d'un cratère). Il l'exécute pas à pas et doit ramasser tous les cristaux, sans heurter un rocher ni tomber dans un cratère.

- **Les instructions** : avancer, tourner à gauche ou à droite, sauter par-dessus une case (un cratère, pas un rocher), ramasser. On les touche dans la palette, elles s'ajoutent au programme (16 cases au plus).
- **30 niveaux en 5 étapes** : les bases, puis le saut, les répétitions (toucher une instruction posée, puis + et -), la fonction **F1** (une suite d'instructions qu'on appelle d'un seul bloc) et enfin les **conditions** (SI sur un cristal, voie libre, cratère devant, bloqué devant) et la **BOUCLE** (avec une condition, elle devient « tant que »).
- **3 étoiles** pour le programme le plus court (pas plus long que la solution de référence), 2 avec jusqu'à 2 instructions de plus, 1 sinon. Réussir un niveau ouvre le suivant ; le programme de chaque niveau est gardé.
- Les niveaux sont posés sur une carte, un chemin de pierres en 5 zones (bases, sauts, répéter, F1, conditions) qu'on fait défiler du doigt.
- Vitesse x1, x2 ou x4 ; un bouton ? rappelle la consigne du niveau, dite par Pico. Chaque niveau est vérifié par un outil de test (sa solution de référence gagne).
- Les étoiles font partie du transfert de sauvegardes ; le total d'étoiles (90 au maximum) part au classement familial.

## Orbite

Un jeu de physique spatiale en 32 bits : on lance une sonde depuis sa rampe, la gravité des planètes courbe sa trajectoire, et il faut atteindre la balise dorée.

- **Viser au lance-pierre** : poser le doigt n'importe où, tirer vers l'arrière, puis lâcher. Plus on tire, plus la sonde part vite (jauge de puissance en bas). Le début de la trajectoire s'affiche pendant la visée, et les essais ratés restent tracés en pâle pour corriger le tir.
- **30 niveaux** qui introduisent peu à peu les planètes (rocheuses, gazeuses, glacées, de lave, jungle, à anneaux), les astéroïdes fixes, les trous noirs (ils attirent très fort et avalent la sonde), les portails (on ressort par l'autre bout avec la même vitesse) et les astéroïdes en orbite autour des planètes.
- **3 essais par niveau** : 3 étoiles du premier coup, 2 au deuxième essai, 1 au troisième. Après trois sondes perdues, on recommence le niveau avec trois sondes neuves. Réussir un niveau ouvre le suivant ; on peut rejouer les anciens pour gagner des étoiles.
- Le vol est calculé à pas fixe : une même visée donne toujours la même trajectoire. Chaque niveau a été vérifié par un solveur, qui s'assure qu'il existe des tirs gagnants avec une marge suffisante pour être faits au doigt.
- Les étoiles sont sauvegardées et font partie du transfert de sauvegardes ; le total d'étoiles (90 au maximum) part au classement familial.

---

## Pont stellaire

Un puzzle de logique sur les règles du **Hashi**, dans un ciel étoilé en 32 bits.

- Chaque étoile porte un nombre : c'est le nombre de faisceaux de lumière qui doivent en partir.
- Les faisceaux sont droits (horizontaux ou verticaux) et vont d'une étoile à sa voisine : un ou deux entre deux étoiles, jamais plus, et ils ne se croisent jamais.
- À la fin, toutes les étoiles doivent être reliées en une seule constellation, qui s'illumine en or et reçoit un nom (la Lyre, le Cygne, Cassiopée…).
- **Commandes** : toucher une étoile puis sa voisine, ou glisser de l'une vers l'autre, pose un faisceau ; recommencer en pose deux, puis les enlève. Toucher un faisceau le fait aussi tourner. Une étoile devient verte quand elle est complète, rouge quand elle a trop de faisceaux. ANNULER, EFFACER (deux appuis) et INDICE (+30 secondes).
- **Trois tailles** (7×7, 9×9 et 11×11) et un **Ciel du jour** en 9×9, le même pour toute la famille. Les grilles sont générées à l'infini, et un solveur vérifie que chacune n'a **qu'une seule solution**.
- **Ciel du jour : une seule tentative classée.** Elle est sauvegardée à part, chrono compris : quitter puis revenir la reprend au même temps. Une fois réussi, le ciel du jour se rejoue hors classement.
- La partie en cours est sauvegardée et se reprend depuis l'écran titre. Les meilleurs temps, les temps du Ciel du jour et le nombre de constellations font partie du transfert de sauvegardes.

---

## Sudoku

Le **Sudoku** classique, sous la lune d'un jardin japonais en 32 bits.

- Chaque ligne, chaque colonne et chaque bloc contient une seule fois chaque chiffre.
- **Commandes** : toucher une case, puis un chiffre en bas (retoucher le même chiffre l'enlève). Le **CRAYON** note les chiffres possibles dans une case ; ces notes s'effacent toutes seules quand le chiffre est posé ailleurs dans la ligne, la colonne ou le bloc. GOMME, ANNULER et INDICE (+30 secondes). Les chiffres du même genre que la case choisie sont surlignés, et les doublons apparaissent en rouge (réglage DOUBLONS au menu). Sur ordinateur : chiffres au clavier, flèches, N pour le crayon.
- **Tailles et niveaux** : 4×4 et 6×6 pour débuter ; 9×9 **facile** (beaucoup de chiffres donnés), **moyen** (peu de chiffres, mais tout se trouve case par case) et **difficile** (il faut raisonner sur les notes : candidats bloqués et paires). Les grilles sont générées à l'infini et toujours **à solution unique**.
- **Grille du jour** en 9×9, la même pour toute la famille : facile le lundi et le mardi, moyenne du mercredi au vendredi, difficile le week-end. **Une seule tentative classée**, sauvegardée à part avec son chrono ; une fois réussie, elle se rejoue hors classement.
- La partie en cours (notes comprises) est sauvegardée et se reprend depuis l'écran titre. Les meilleurs temps et le nombre de grilles font partie du transfert de sauvegardes.

---

## Nebula

Rogue-lite tactique dans l'espace, vaisseaux en relief : trois secteurs pirates à traverser.

- **Flotte de départ à composer** avec 10 points de flotte, 4 vaisseaux au plus (éclaireur, convoyeur, drones 1 ; bombardier, égide 2 ; chasseur, artilleur, porte-vaisseaux, atelier 3 ; frégate 4 ; cuirassé 5). Trois modèles se chargent d'un toucher puis se modifient : **escorte** (porte-vaisseaux, frégate, chasseur), **choc** (cuirassé, bombardier, chasseur), **marchande** (convoyeur, 2 chasseurs, éclaireur). **Prime d'audace** : chaque point non dépensé donne +10 % de score et de données stellaires en fin de partie (au plus +50 %).
- **Contrat de partie** : au départ, on choisit un contrat parmi 3 (chasse aux pirates, gros gibier, zéro perte, équipage complet, fortune, grande escadre, tête brûlée…) ; son avancement s'affiche sur la carte, et réussi il rapporte des points de score et des données stellaires.
- **Défi de combat** : chaque combat a son défi, affiché sous la barre du haut (aucune perte, victoire en peu de tours, abattre un pirate précis en premier, coques à moitié ou plus) ; réussi, il rapporte des crédits en plus du butin.
- La flotte traverse la **Ceinture de Karn** : une carte de 7 étages de balises jusqu'à l'**amiral rouillé**. Chaque saut coûte 1 carburant ; sans carburant, chaque vaisseau perd 2 de coque.
- **Combat** sur une grille de 7×9 : les vaisseaux occupent 1, 2 ou 3 cases. À chaque tour, les pirates se déplacent puis **annoncent en rouge la case qu'ils vont frapper** : on sort de la case, ou on détruit le pirate avant la fin du tour. Chaque vaisseau se déplace (cases bleues) puis agit une fois. Les astéroïdes bloquent les tirs ; le bouclier encaisse d'abord et remonte de 1 par tour. Un vaisseau détruit est perdu pour la partie. Le bouton **PORTÉES** (en haut) montre ou cache la portée des armes sur la grille : en ambre celle du vaisseau choisi, en rouge les cases où les pirates peuvent tirer (plus c'est foncé, plus ils sont nombreux).
- Capacités (rappelées sur la fiche du vaisseau en combat et au hangar) : riposte du chasseur, laser ou missile de la frégate, baies du porte-vaisseaux (chasseur léger ou drones), torpilles du bombardier, essaim des drones (on touche un pirate collé à la nuée pour l'attaquer), bulle de l'Égide. Pirates : intercepteurs en meute, brûlots kamikazes, croiseurs lance-torpilles, l'amiral et ses renforts. Dans les contacts lourds, les pirates manœuvrent pour **coincer** la flotte : ils visent aussi les cases où l'on pourrait se replier.
- Pour déplacer un vaisseau, garder le doigt sur une case bleue montre où il ira (et les dégâts qui l'y attendent) ; il part quand on lève le doigt. Tant qu'il n'a pas tiré, on peut le replacer en touchant une autre case bleue.
- Autres vaisseaux à recruter au comptoir : **éclaireur** (marque un pirate : +1 à chacun de tes tirs sur lui ce tour), **convoyeur** (+50 % de crédits et de carburant), **artilleur** (salve sur 2×2 cases par-dessus les astéroïdes), **cuirassé** (deux tirs par tour), **atelier mobile** (répare les voisins et toute la flotte après chaque combat). Nouveau pirate : le **harponneur**, qui attire les petits vaisseaux avec son grappin.
- **Mission du jour** (écran titre) : la même carte et les mêmes combats pour toute la famille, avec une mission qui change chaque jour et impose sa flotte et sa règle (escadrille de chasseurs, tapis de bombes, convoi dont le convoyeur ne doit pas être détruit, équipage d'élite avec pilotes, blocus sans comptoirs, réservoirs à sec, armada, la meute), sans prime d'audace ; un écran la présente avant le départ. Seule la première tentative du jour est classée, on peut la rejouer hors classement.
- **Données stellaires** (gagnées en fin de partie et dans certaines épaves) : l'écran **DÉBLOCAGES** les dépense pour ouvrir de nouveaux vaisseaux (éclaireur, convoyeur, artilleur, cuirassé, atelier), qui entrent alors dans la flotte de départ, au comptoir et dans les épaves. (Les anciens déblocages de flottes ont disparu : les données dépensées sont revenues.) Les déblocages font partie du transfert de sauvegardes.
- **Nouveaux vaisseaux** (à débloquer) : le **brouilleur** annule le tir annoncé d'un pirate à 4 cases (la case devient grise, BROUILLÉ) au lieu de tirer ; le **mouilleur de mines** pose des mines invisibles pour les pirates (4 par combat, 5 dégâts au passage). Nouveaux pirates (secteurs 2 et 3) : la **frégate-bouclier** donne +1 bouclier aux pirates collés à elle, le **poseur de mines** annonce une mine (case MINE) à côté d'un de tes vaisseaux puis la pose : passer dessus coûte 3 dégâts.
- **Épaves** : une petite histoire à choix (fouiller une soute, réveiller un pilote, répondre à un signal de détresse… parfois un piège ou une embuscade). **Nébuleuses** : un combat dans la brume, ou un moment de calme.
- **Pilotes** (épaves et comptoirs) : As (+1 vitesse), Mécano (répare 1 de coque par tour), Tireur (+1 dégât), Prudent (+1 bouclier), Vétéran (gagne de la coque à chaque victoire). On les place au hangar, un par vaisseau.
- Sur la carte, chaque balise porte son nom ; en touchant une balise hors de portée, sa fiche dit ce qu'on y trouve, et le bouton **? LÉGENDE** les explique toutes.
- Entre les combats : **comptoir** (carburant, réparations, modules, recrues), **dock** (réparation ou module gratuit), **hangar** pour poser les modules (blindage, bouclier, propulseurs, ciblage, canons Mk2) : en touchant un module, chaque vaisseau montre ce qu'il y gagnerait (par exemple VITESSE 3 → 4) ; de même en touchant un pilote de la réserve.
- Trois secteurs, chacun gardé par un amiral : la **Ceinture de Karn** (astéroïdes, l'amiral rouillé), la **Nébuleuse d'Orphée** (nuages ioniques qui font perdre le bouclier à qui y finit son tour, nébuleuse où l'on ne vise rien à plus de 2 cases ; la Veuve d'Orphée et sa couvée de brûlots) et **Le Seuil** (pirates plus nombreux et plus rusés ; la Rouille-Reine, dont le bouclier se recharge à chaque tour). +3 carburant en entrant dans un nouveau secteur.
- **Gestes** : garder le doigt sur un vaisseau, un pirate ou une balise ouvre sa fiche (sur ordinateur : clic droit) ; le tir et le saut partent au lever du doigt ; FIN DU TOUR demande confirmation si un vaisseau peut encore tirer. Réglages de l'écran titre : animations ×1 / ×2, vibrations (quand un vaisseau est touché) et nappe d'ambiance (coupée par défaut).
- Sons : armes et impacts discrets et étouffés (comme entendus à travers la coque), bips discrets, saut en hyperespace lourd ; ambiance (réglage AMBIANCE) : une marche héroïque sur la carte, une musique de tension en combat.
- Nebula marche entièrement hors connexion dès la première visite (ses polices sont incluses) et ménage la batterie quand rien ne bouge.
- Au début de chaque combat, la flotte arrive à toute vitesse du bas de l'écran et freine jusqu'à sa case de départ.
- **Entraînement guidé** : un petit combat en 5 étapes (choisir un vaisseau, esquiver une case rouge, tirer, bouclier et coque, fin du tour), proposé une fois avant le premier départ et rejouable depuis le manuel ; la partie en cours n'est pas touchée.
- **Manuel** (écran titre, ou bouton MANUEL COMPLET de la légende de la carte) : les règles en rubriques, une fiche par vaisseau et par pirate (coque, bouclier, vitesse, armes, capacité, où le trouver), le terrain, les balises, les modules et les pilotes.
- Score : 1000 par secteur terminé, 20 par pirate détruit, plus les crédits restants, plus 3000 pour la victoire finale. Partie sauvegardée à chaque étape. Le record fait partie des classements et du transfert de sauvegardes.

---

## Odyssée

Le retour d'Ulysse en 3D : on penche le téléphone pour guider sa galère sur la mer Égée, de Troie jusqu'à Ithaque.

- **Penche le téléphone** : le plateau penche avec lui et la galère glisse dans la pente. La position du téléphone au départ sert de « plat » (bouton ⟲ À PLAT pour recommencer). Sans capteur, fais glisser le doigt depuis le point touché ; sur ordinateur, les flèches du clavier. Pendant la partie, l'écran reste en portrait.
- **10 épisodes de 3 plateaux**, sur la carte de l'Égée : Troie (flèches enflammées), les Lotophages (lotus qui collent à la coque), Polyphème (rochers lancés là où va la galère : l'ombre grossit, change de cap !), Éole (vents, puis l'outre qui s'ouvre et fait tourner les vents), Circé (l'équipage en cochons : galère lourde, il faut trouver l'herbe moly et éviter les coupes), les Enfers (nuit noire, seule la lanterne éclaire), les Sirènes (leur chant attire : bouton CIRE pour boucher les oreilles un moment), Charybde et Scylla (tourbillons et têtes qui jaillissent quand l'eau frissonne), Calypso (courants autour de l'île : trouve la sortie), Ithaque (tous les dangers mêlés).
- Les **récifs** font sombrer la galère : on repart du départ, ou du dernier **phare** allumé.
- **Trois étoiles** par plateau : une en arrivant au port, deux sans naufrage, trois sans naufrage et sous le temps cible.
- **Plateau du jour** : le même plateau (parfois en miroir) et les mêmes dangers pour toute la famille. Seule la première tentative du jour est classée (elle compte dès le départ) : le temps, plus 5 secondes par naufrage.
- **Sons** : une lyre et une flûte qui improvisent doucement (plus inquiètes face aux dangers, plus lentes chez les morts), la mer en fond, les rames, le chant des Sirènes… Bouton SON : OUI/NON sur l'écran titre et dans la pause.
- Le total d'étoiles et le plateau du jour font partie des classements et du transfert de sauvegardes.

## Empilage

Le premier jeu en 3D de la Ludothèque : une tour de blocs pastel à faire monter le plus haut possible.

- Un bloc va et vient au-dessus de la tour, une fois dans un sens, une fois dans l'autre. **Touche l'écran** (ou Espace) pour le lâcher : ce qui dépasse tombe, et le bloc suivant est plus petit.
- Un bloc posé **pile** sur le précédent garde sa taille (PARFAIT) ; **trois parfaits d'affilée** le font regrandir un peu. Les blocs vont de plus en plus vite.
- Le ciel change avec la hauteur : matin, coucher de soleil vers 25 blocs, nuit vers 50, étoiles et lune au-delà. À la fin, la caméra recule pour montrer toute la tour.
- **Tour du jour** : les mêmes vitesses et les mêmes départs pour toute la famille. Seule la première tentative du jour est classée (elle compte dès le départ) ; on peut la rejouer hors classement.
- Le record et la tour du jour font partie des classements et du transfert de sauvegardes.

---

## Alunissage

Poser un module lunaire en douceur, site après site.

- **Deux réacteurs**, un par moitié d'écran (un doigt chacun) : le gauche pousse vers le haut et vers la droite, le droit vers le haut et vers la gauche, les deux ensemble tout droit. Au clavier : flèches gauche, droite, haut.
- Se poser **sur une aire**, à plat, avec une vitesse verticale et horizontale assez faibles (affichées en vert ou en rouge). Les aires étroites rapportent ×5, les moyennes ×3, les larges ×2.
- **Cadrans près du module**, pour ne pas le quitter des yeux : un réticule qui passe au vert quand tout est bon pour se poser (orange ou rouge sinon), 5 segments de carburant au-dessus, deux barres de vitesse (V et H, le trait blanc marque la limite) dessous, l'aire survolée à côté (×2, ×3, ×5, ou un trait si le sol est en pente), une flèche qui montre où va le module, et sous 120 m un pointillé jusqu'au sol avec la hauteur.
- Une **mission** enchaîne les sites (la Lune, Phobos, Mars, Europe, Titan et son vent, une comète…), de plus en plus durs, jusqu'au crash ou à l'arrêt. Chaque site rapporte (100 + carburant restant) × le multiplicateur ; le carburant se recharge en partie à chaque alunissage.
- **Mission du jour** : la même suite de sites pour toute la famille. Seule la première tentative du jour est classée (elle compte dès le départ) ; on peut la rejouer hors classement. Le record et la mission du jour font partie des classements et du transfert de sauvegardes.
- **Graphismes « cinématiques »** : un soleil qui éclaire le relief et fait des ombres, des montagnes lointaines qui glissent avec le module, un sol de cratères et de rochers, l'astre de chaque monde dans le ciel (la Terre, Mars, Jupiter, Saturne…) et ses effets (vent de poussière sur Mars, geysers sur Europe, brume sur Titan, jets de gaz sur la comète). Le module, plus grand, a ses feux de position, une ombre et des flammes qui éclairent le sol ; après un alunissage, un astronaute plante un drapeau ; après un crash, explosion et cratère fumant.

---

## Les classiques passés en 16 bits

Touché Coulé était déjà en 16 bits : il n'a gagné que son record (victoire en le moins de tirs) et le classement. Les quatre autres ont gardé leurs règles et leurs commandes d'origine, avec une nouvelle direction artistique pixel art (police pixel, fenêtres façon RPG, scanlines, bruitages chiptune).

- **Tetris** : briques en relief, puits en damier, pièce fantôme en pointillés, record sauvegardé, un niveau toutes les 10 lignes avec une vitesse qui suit la courbe de la NES (jusqu'à une case par image au niveau 29), écran d'accueil, boutons tactiles avec répétition.
- **Snake** : jardin en damier, pomme et serpent dessinés en pixels, tête orientée avec langue, record conservé (même clé que l'original), file de virages pour ne jamais se retourner sur soi, glisser ou croix directionnelle sur mobile.
- **Asteroids** : rendu en basse résolution pixel par pixel, astéroïdes ombrés avec cratères, grand vaisseau au contour lumineux, flamme du réacteur, nébuleuse et étoiles fixes qui scintillent, record sauvegardé, tir continu en maintenant le bouton sur mobile.
- **Jeu de la Vie** : moteur et réglages inchangés ; cellules en briques, traces en paliers de couleur, panneaux et curseurs en style pixel.

---

## Solitaire

Le Klondike tel qu'il était livré avec Windows XP, en pixel art 16 bits.

- Pioche de 3 cartes par défaut, comme sous XP, ou d'une seule carte (changer de mode redistribue les cartes).
- Barème « standard » de Windows : +10 par carte posée sur une pile, +5 par carte posée de la défausse vers une colonne ou retournée, −15 pour reprendre une carte d'une pile, −2 toutes les 10 secondes, −100 (pioche 1) ou −20 (pioche 3) à chaque tour de pioche, et un bonus de vitesse à la victoire (700 000 ÷ secondes, au-delà de 30 s).
- Toucher une carte l'envoie à la meilleure place (pile d'abord, sinon colonne) ; on peut aussi la glisser. Annuler, bouton TOUT RANGER quand toutes les cartes sont visibles.
- Les cartes rebondissent à la victoire, comme dans l'original.
- La partie en cours est sauvegardée et reprend au prochain lancement ; le meilleur score fait partie du transfert de sauvegardes.

## Transférer ses sauvegardes

Chaque navigateur garde ses propres sauvegardes : le navigateur intégré de Facebook, Chrome et l'appli installée ne partagent pas forcément les mêmes. Le bouton **Transférer mes sauvegardes**, en bas du menu, copie un code `LUDO1-…` qui contient les sauvegardes de tous les jeux (Picross Dex, Lignée, Queens, Tetris, Snake, Asteroids, Injagility et son mode Parcours, Solitaire, Touché Coulé, Amiral !, le Club d'agility, Orbite, Lune-Rover, Pont stellaire, Sudoku, Calculator, Alunissage, Nebula, Empilage, Odyssée), à coller dans l'autre navigateur. L'import ne supprime rien : il garde le meilleur score ou le meilleur temps de chaque côté. Le Jeu de la Vie n'enregistre rien. Le Picross Dex garde aussi son propre bouton, et les deux formats de code (`LUDO1-` et `PICROSSDEX1-`) sont acceptés aux deux endroits.

## Classements familiaux

Les classements sont dans le **volet de chaque jeu**, sur l'accueil : des classements privés, partagés entre les personnes qui connaissent le **code familial**. On choisit un pseudo, on entre le code une fois (dans le volet d'un jeu, ou avec le bouton **Rejoindre le classement de la famille** sous les cartouches), et c'est tout : ensuite les records partent **tout seuls**. Pour jouer sous le même pseudo dans un autre navigateur (Chrome, l'appli, une tablette…), le bouton **Code de mon compte** donne un code à coller là-bas avec **J'ai déjà un compte** : les deux navigateurs comptent pour le même joueur au classement (le meilleur score de chacun est gardé), mais chacun garde ses propres sauvegardes. Ce code sert de clé : il ne faut le donner à personne. Le volet montre les tableaux du jeu (1er en or, 2e en argent, 3e en bronze, sa propre ligne en vert) avec leurs réglages (jour, taille, niveau…). Une couronne au-dessus d'une cartouche signale un jeu où l'on détient au moins un record. L'ancienne page `classements/` ne fait plus que renvoyer vers l'accueil, sur le volet du bon jeu.

- **Tetris, Snake, Asteroids, Solitaire** : le meilleur score de chacun.
- **Queens** : le meilleur temps sans indice, une grille par taille (5×5 à 9×9).
- **Picross Dex** : un classement par Pokémon (temps de la grille, plus **30 secondes par indice**), le tableau de qui détient le plus de records, et le Pokédex le plus complet. L'écran de victoire montre sa place et le top 3 de la famille sur ce Pokémon ; dans le Pokédex, une couronne marque les Pokémon dont on détient le record (le mode test n'envoie rien).
- **Lignée** : l'Arbre du jour (Classique et Royal, qui repart de zéro chaque jour, avec les flèches pour revoir les jours précédents), le meilleur temps par mode et par niveau, et le nombre d'arbres reconstitués.
- **Injagility** : le record d'obstacles du mode Infini, les points de chaque parcours numéroté et le total des meilleurs scores du mode Parcours.
- **Touché Coulé** : la victoire en le moins de tirs, par mode (Classique, Arsenal) et par niveau de l'IA (Facile, Normal, Amiral).
- **Le Club d'agility** : la plus grande réputation, et le Championnat de France gagné en le moins de semaines.
- **Amiral !** : la victoire en le moins de tours, par niveau de l'ordinateur (Mousse, Capitaine, Amiral).
- **Orbite** : le total d'étoiles gagnées sur les 30 niveaux.
- **Lune-Rover** : le total d'étoiles gagnées sur les 30 niveaux.
- **Alunissage** : la meilleure mission et la mission du jour.
- **Empilage** : la plus haute tour et la tour du jour.
- **Odyssée** : le total d'étoiles sur les 30 plateaux, et le plateau du jour (le temps, plus 5 secondes par naufrage).
- **Nebula** : le meilleur score, la partie du jour (jour par jour) et le nombre de victoires.
- **Pont stellaire** : le Ciel du jour (avec les flèches pour revoir les jours précédents), le meilleur temps par taille (7×7, 9×9, 11×11, plus 30 secondes par indice) et le nombre de constellations dessinées.
- **Calculator** : le calcul du jour (même série pour toute la famille, une seule tentative classée), la série de 20 et les 60 secondes, par niveau et par opération (MELANGE quand on en choisit plusieurs).
- **Sudoku** : la grille du jour (avec les flèches pour revoir les jours précédents), le meilleur temps par taille et niveau (4×4, 6×6, 9×9 facile, moyen, difficile ; plus 30 secondes par indice) et le nombre de grilles terminées.

Les ex æquo partagent le même rang (1, 2, 2, 4). En rejoignant le classement, un pseudo déjà utilisé par un autre joueur de la famille est refusé (la vérification se fait sur les principaux classements : un joueur qui n'a encore aucun score n'y apparaît pas).

Les jeux affichent leur place au classement quand un record part (écran de fin ou de victoire), et plusieurs ont un bouton **Classement** qui ouvre directement le volet du jeu sur le bon tableau. Hors connexion, un record attend dans le téléphone et part au retour du réseau. En rejoignant, les records déjà faits dans ce navigateur sont envoyés aussi ; les joueurs déjà inscrits envoient une fois ceux des jeux ajoutés depuis.

Côté technique, les scores sont rangés dans une base [Supabase](https://supabase.com) (offre gratuite). Le site ne contient que l'adresse du projet et sa clé **publique**. La table des scores est verrouillée : on n'y accède qu'au travers de fonctions qui vérifient le code familial, et ce code n'est rangé que dans Supabase, jamais dans le dépôt. Le script de création est [`supabase/classements.sql`](supabase/classements.sql) ; [`supabase/classements-2.sql`](supabase/classements-2.sql) ajoute la fonction `ludo_bests` (le meilleur de chaque classement d'un jeu, pour les records du Picross) sur une base déjà installée. Le module partagé par les jeux est [`ludo-scores.js`](ludo-scores.js). Une tâche GitHub Actions ([`reveil-classements.yml`](.github/workflows/reveil-classements.yml)) réveille la base tous les 3 jours, pour que Supabase ne la mette pas en pause. Attention : GitHub suspend ces tâches planifiées après 60 jours sans activité sur le dépôt ; il suffit alors de la relancer depuis l'onglet Actions.

## Application installable (PWA)

Sur le site GitHub Pages, la Ludothèque s'installe comme une application, avec une seule icône pour tous les jeux.

- **Android, ou Chrome et Edge sur ordinateur** : le bouton INSTALLER L'APPLI apparaît sous le titre du menu.
- **iPhone et iPad** : un encadré explique la marche à suivre dans Safari (Partager, puis Sur l'écran d'accueil). Apple ne permet pas à une page de lancer l'installation elle-même.
- **Hors connexion** : `sw.js` met tous les jeux en cache à la première visite. En ligne, il sert toujours la dernière version publiée.
- Un bouton **◀ LUDOTHÈQUE**, dans les menus de chaque jeu (écran titre, pause, fin de partie), ramène à la Ludothèque.

Fichiers : `manifest.webmanifest`, `sw.js` et le dossier `icons/`. Quand on ajoute ou renomme un fichier de jeu, il faut l'ajouter à la liste `FILES` de `sw.js` et changer `VERSION`, pour que le préchargement hors connexion en tienne compte.

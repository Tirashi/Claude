# Jeux 16 bits

Des jeux jouables dans le navigateur, sans build ni dépendance. La page [`index.html`](index.html) à la racine est un menu qui mène à tous les jeux :

- [`queens/index.html`](queens/index.html) : **Queens 16-Bit**, une reprise du jeu Queens de LinkedIn.
- [`picross/index.html`](picross/index.html) : **Picross Dex**, un picross sur le thème des Pokémon (fan-game personnel, non officiel).
- [`lignee/index.html`](lignee/index.html) : **Lignée**, un puzzle de généalogie : reconstituer un arbre grâce aux indices, en famille française ou en dynastie royale.
- [`injagility/index.html`](injagility/index.html) : **Injagility**, un jeu d'agility canine en 32 bits : course sans fin façon dino de Chrome, et parcours vus du dessus ([`injagility/parcours.html`](injagility/parcours.html)) avec six races à adopter.
- [`touche-coule/index.html`](touche-coule/index.html) : **Touché Coulé**, une bataille navale contre l'ordinateur (modes Classique et Arsenal).
- [`tetris/index.html`](tetris/index.html) : **Tetris**.
- [`snake/index.html`](snake/index.html) : **Snake**.
- [`asteroids/index.html`](asteroids/index.html) : **Asteroids**.
- [`jeu-de-la-vie/index.html`](jeu-de-la-vie/index.html) : **Jeu de la Vie**, l'automate cellulaire de Conway (voir son propre README).
- [`solitaire/index.html`](solitaire/index.html) : **Solitaire**, le Klondike de Windows XP.

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

## Les classiques passés en 16 bits

Touché Coulé était déjà en 16 bits et n'a pas été modifié. Les quatre autres ont gardé leurs règles et leurs commandes d'origine, avec une nouvelle direction artistique pixel art (police pixel, fenêtres façon RPG, scanlines, bruitages chiptune).

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

Chaque navigateur garde ses propres sauvegardes : le navigateur intégré de Facebook, Chrome et l'appli installée ne partagent pas forcément les mêmes. Le bouton **Transférer mes sauvegardes**, en bas du menu, copie un code `LUDO1-…` qui contient les sauvegardes de tous les jeux (Picross Dex, Lignée, Queens, Tetris, Snake, Asteroids, Injagility et son mode Parcours, Solitaire), à coller dans l'autre navigateur. L'import ne supprime rien : il garde le meilleur score ou le meilleur temps de chaque côté. Touché Coulé et le Jeu de la Vie n'enregistrent rien. Le Picross Dex garde aussi son propre bouton, et les deux formats de code (`LUDO1-` et `PICROSSDEX1-`) sont acceptés aux deux endroits.

## Classements familiaux

Le bouton doré **Classements**, en haut du menu, ouvre la page [`classements/`](classements/index.html) : des classements privés, partagés entre les personnes qui connaissent le **code familial**. On choisit un pseudo, on entre le code une fois, et c'est tout : ensuite les records partent **tout seuls**. Chaque tableau a son podium et la liste complète, et sa propre ligne est en vert.

- **Tetris, Snake, Asteroids, Solitaire** : le meilleur score de chacun.
- **Queens** : le meilleur temps sans indice, une grille par taille (5×5 à 9×9).
- **Picross Dex** : un classement par Pokémon (temps de la grille, plus **30 secondes par indice**), le tableau de qui détient le plus de records, et le Pokédex le plus complet. L'écran de victoire montre sa place et le top 3 de la famille sur ce Pokémon ; dans le Pokédex, une couronne marque les Pokémon dont on détient le record (le mode test n'envoie rien).
- **Lignée** : l'Arbre du jour (Classique et Royal, qui repart de zéro chaque jour, avec les flèches pour revoir les jours précédents), le meilleur temps par mode et par niveau, et le nombre d'arbres reconstitués.
- **Injagility** : le record d'obstacles du mode Infini, les points de chaque parcours numéroté et le total des meilleurs scores du mode Parcours.

Les jeux affichent leur place au classement quand un record part (écran de fin ou de victoire), et plusieurs ont un bouton **Classement** qui ouvre directement le bon tableau. Hors connexion, un record attend dans le téléphone et part au retour du réseau. En rejoignant, les records déjà faits dans ce navigateur sont envoyés aussi ; les joueurs déjà inscrits envoient une fois ceux des jeux ajoutés depuis.

Côté technique, les scores sont rangés dans une base [Supabase](https://supabase.com) (offre gratuite). Le site ne contient que l'adresse du projet et sa clé **publique**. La table des scores est verrouillée : on n'y accède qu'au travers de fonctions qui vérifient le code familial, et ce code n'est rangé que dans Supabase, jamais dans le dépôt. Le script de création est [`supabase/classements.sql`](supabase/classements.sql) ; [`supabase/classements-2.sql`](supabase/classements-2.sql) ajoute la fonction `ludo_bests` (le meilleur de chaque classement d'un jeu, pour les records du Picross) sur une base déjà installée. Le module partagé par les jeux est [`ludo-scores.js`](ludo-scores.js). Une tâche GitHub Actions ([`reveil-classements.yml`](.github/workflows/reveil-classements.yml)) réveille la base tous les 3 jours, pour que Supabase ne la mette pas en pause.

## Application installable (PWA)

Sur le site GitHub Pages, la Ludothèque s'installe comme une application, avec une seule icône pour tous les jeux.

- **Android, ou Chrome et Edge sur ordinateur** : le bouton INSTALLER L'APPLI apparaît sous le titre du menu.
- **iPhone et iPad** : un encadré explique la marche à suivre dans Safari (Partager, puis Sur l'écran d'accueil). Apple ne permet pas à une page de lancer l'installation elle-même.
- **Hors connexion** : `sw.js` met tous les jeux en cache à la première visite. En ligne, il sert toujours la dernière version publiée.
- **Dans l'appli installée**, un bouton ◀ MENU en haut de chaque jeu ramène à la Ludothèque, puisqu'il n'y a plus de barre de navigateur.

Fichiers : `manifest.webmanifest`, `sw.js` et le dossier `icons/`. Quand on ajoute ou renomme un fichier de jeu, il faut l'ajouter à la liste `FILES` de `sw.js` et changer `VERSION`, pour que le préchargement hors connexion en tienne compte.

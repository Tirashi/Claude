# Jeux 16 bits

Des jeux jouables dans le navigateur, sans build ni dépendance. La page [`index.html`](index.html) à la racine est un menu qui mène à tous les jeux :

- [`queens/index.html`](queens/index.html) : **Queens 16-Bit**, une reprise du jeu Queens de LinkedIn.
- [`picross/index.html`](picross/index.html) : **Picross Dex**, un picross sur le thème des Pokémon (fan-game personnel, non officiel).
- [`injagility/index.html`](injagility/index.html) : **Injagility**, un jeu de course sans fin façon dino de Chrome, avec un bouvier bernois sur un parcours d'agility.
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

- 162 grilles : 8 en 10×10, 148 en 15×15, 3 en 15×10 et 3 en 20×20 (Dracaufeu, Léviator et Mewtwo), toutes résolubles par pure logique, sans deviner (vérifié par un solveur). Le Dex est rangé par numéro de Pokédex.
- Les 151 Pokémon de la première génération au complet (de Bulbizarre à Mew), les starters de la deuxième génération et leurs évolutions (n° 152 à 160), plus Togepi et la Poké Ball.
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
- 3 indices par grille (chacun complète une ligne), illimités en mode test. Effacer la grille ne les rend pas.
- Progression, records et grilles en cours sauvegardés dans le navigateur.
- **Transférer ma sauvegarde** (en bas du Dex) : copie un code dans le presse-papiers et le colle dans un autre navigateur, par exemple pour passer du navigateur intégré de Facebook à Chrome. L'import fusionne les deux progressions et garde le meilleur temps.

Projet de fan à usage strictement personnel, sans lien avec Nintendo, Game Freak ou The Pokémon Company. Le pixel art a été dessiné pour ce jeu.

---

## Injagility (prototype)

Un petit bouvier bernois enchaîne les obstacles d'agility au pied des Alpes, dans l'esprit du jeu du dino de Chrome.

- Obstacles : haie, oxer (double barre), pneu (plus haut) et tunnel (il faut se baisser jusqu'à la sortie).
- Saut à hauteur variable selon la durée d'appui, descente rapide en se baissant en l'air.
- Vitesse qui augmente avec la distance, points par obstacle, record sauvegardé dans le navigateur.
- Commandes : Espace ou ↑ pour sauter, ↓ pour se baisser ; sur mobile, toucher l'écran, glisser vers le bas ou utiliser les boutons SAUTER et TUNNEL.

---

## Les classiques passés en 16 bits

Touché Coulé était déjà en 16 bits et n'a pas été modifié. Les quatre autres ont gardé leurs règles et leurs commandes d'origine, avec une nouvelle direction artistique pixel art (police pixel, fenêtres façon RPG, scanlines, bruitages chiptune).

- **Tetris** : briques en relief, puits en damier, pièce fantôme en pointillés, record sauvegardé, écran d'accueil, boutons tactiles avec répétition.
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

Chaque navigateur garde ses propres sauvegardes : le navigateur intégré de Facebook, Chrome et l'appli installée ne partagent pas forcément les mêmes. Le bouton **Transférer mes sauvegardes**, en bas du menu, copie un code `LUDO1-…` qui contient les sauvegardes de tous les jeux (Picross Dex, Queens, Tetris, Snake, Asteroids, Injagility, Solitaire), à coller dans l'autre navigateur. L'import ne supprime rien : il garde le meilleur score ou le meilleur temps de chaque côté. Touché Coulé et le Jeu de la Vie n'enregistrent rien. Le Picross Dex garde aussi son propre bouton, et les deux formats de code (`LUDO1-` et `PICROSSDEX1-`) sont acceptés aux deux endroits.

## Application installable (PWA)

Sur le site GitHub Pages, la Ludothèque s'installe comme une application, avec une seule icône pour tous les jeux.

- **Android, ou Chrome et Edge sur ordinateur** : le bouton INSTALLER L'APPLI apparaît sous le titre du menu.
- **iPhone et iPad** : un encadré explique la marche à suivre dans Safari (Partager, puis Sur l'écran d'accueil). Apple ne permet pas à une page de lancer l'installation elle-même.
- **Hors connexion** : `sw.js` met tous les jeux en cache à la première visite. En ligne, il sert toujours la dernière version publiée.
- **Dans l'appli installée**, un bouton ◀ MENU en haut de chaque jeu ramène à la Ludothèque, puisqu'il n'y a plus de barre de navigateur.

Fichiers : `manifest.webmanifest`, `sw.js` et le dossier `icons/`. Quand on ajoute ou renomme un fichier de jeu, il faut l'ajouter à la liste `FILES` de `sw.js` et changer `VERSION`, pour que le préchargement hors connexion en tienne compte.

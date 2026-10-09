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

- 26 grilles : 7 en 10×10, 16 en 15×15 et 3 en 15×10, toutes résolubles par pure logique, sans deviner (vérifié par un solveur).
- Les nouvelles grilles sont toujours ajoutées en fin de liste, sans toucher aux anciennes, pour que les sauvegardes restent valides.
- Clic ou toucher pour remplir, clic droit ou outil CROIX pour marquer, glisser pour peindre une ligne.
- Indices barrés quand une ligne est juste, aperçu miniature, chrono, indice, annuler.
- Progression, records et grilles en cours sauvegardés dans le navigateur.

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

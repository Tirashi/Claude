# Jeux 16 bits

Des jeux jouables dans le navigateur, sans build ni dépendance :

- [`index.html`](index.html) : **Queens 16-Bit**, une reprise du jeu Queens de LinkedIn.
- [`picross/index.html`](picross/index.html) : **Picross Dex**, un picross sur le thème des Pokémon (fan-game personnel, non officiel).
- [`injagility/index.html`](injagility/index.html) : **Injagility**, un jeu de course sans fin façon dino de Chrome, avec un bouvier bernois sur un parcours d'agility.

---

## Queens 16-Bit

Une reprise du jeu **Queens** de LinkedIn, jouable dans le navigateur, avec une direction artistique rétro 16 bits (fenêtres façon RPG Super Nintendo, police pixel, sprites de couronne, scanlines CRT et bruitages chiptune).

### Jouer

Ouvre `index.html` dans n'importe quel navigateur récent. Aucun build, aucune dépendance.

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

- 10 grilles : 4 en 10×10 et 6 en 15×15, toutes résolubles par pure logique, sans deviner (vérifié par un solveur).
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

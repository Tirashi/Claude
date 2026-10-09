# Jeu de la Vie

Implémentation du jeu de la vie de Conway, jouable dans le navigateur.
Aucune dépendance, aucun build : **ouvrez `index.html`** (double-clic) et c'est parti.

## Fichiers

| Fichier      | Rôle                                              |
|--------------|---------------------------------------------------|
| `index.html` | structure de la page et panneau de contrôle        |
| `style.css`  | thème 16 bits, mise en page                        |
| `app.js`     | moteur de simulation, rendu canvas, interactions   |

## Commandes

- **Souris** : clic-glisser pour dessiner, clic droit pour effacer. Le dessin
  fonctionne aussi pendant que la simulation tourne.
- **Motifs** : choisissez un motif (planeur, pulsar, canon à planeurs…), un
  aperçu suit le curseur, un clic le dépose. PIVOTER l'oriente.
- **Clavier** : `Espace` démarrer/pause · `N` une génération · `R` aléatoire ·
  `C` vider · `P` pivoter le motif.

## Réglages

- Vitesse de 1 à 60 générations par seconde, densité du remplissage aléatoire.
- Taille de grille (jusqu'à 400×400) et taille des cellules, ou AJUSTER À LA
  FENÊTRE.
- **Bords toriques** : le monde boucle sur lui-même (un planeur qui sort à droite
  revient à gauche). Désactivé, les bords tuent ce qui les dépasse.
- **Traces** : les cellules récemment mortes s'estompent sur quelques générations.

## Règles

La règle standard est `B3/S23` : une cellule morte naît avec exactement 3
voisins, une cellule vivante survit avec 2 ou 3. Le champ « règle
personnalisée » accepte n'importe quelle notation `B.../S...`, et huit variantes
connues sont proposées (HighLife, Day & Night, Seeds, Maze…).

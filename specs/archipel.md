# Archipel (cahier des charges)

Idée de l'utilisateur du 19/11 : « ça donnerait quoi un Colons de Catane ? ». C'est le genre (île en hexagones, dés, routes, villages), avec **notre nom, nos règles exactes et nos dessins** : rien du jeu d'origine (nom, plateau, illustrations, textes).

## Maquettes (19/11)
1. [Maquette 1](https://claude.ai/artifact/Hp2EpJEM3JLjJhcVbQSyBj) (`maquettes/archipel.html`) : jouable, trois styles dessinés par le code : A plateau de bois, B pixel 16 bits, C carte à l'encre. Retour : A et C plaisent, mais « trop jeu de plateau » ; demande de graphismes venus de packs et d'animation (cheminées, personnages sur les routes, bûcherons).
2. [Maquette 2](https://claude.ai/artifact/Ef9AZBbib7WsyaHvvgUgjy) (`maquettes/archipel-2.html`) : A diorama 3D (KayKit de Bannières, personnages Adventurers), C carte vivante (tampons Deface Games de Politique). **Refusée** : la 3D ne marche pas, c'est trop petit et illisible, et les personnages à l'encre sont trop simples.
3. [Maquette 3](https://claude.ai/artifact/UVhdmXXcgFug72xAFDzxxE) (`maquettes/archipel-3.html`) : pixel 32 bits avec les images de Terres franches (décor Cute SCKR, villageois LPC, pillard LPC, interface Tiny Swords), zoom. **Direction A « hexagones nets » validée le 19/11** (la B « paysage » fondait les terres et ne montrait la grille qu'au moment de choisir).

## Ce que la maquette 3 fixe (à garder dans le jeu)
- Île de 19 terres en hexagones (pointe en haut), anneau de mer, côte en sable et écume ; chaque terre a son liseré.
- Terres : forêt (bois, arbres), carrière d'argile (brique, sol de terre, fosses, four), pré (laine, moutons qui broutent puis marchent), champs (blé), montagne (pierre, grotte, rochers), lande (rien, dolmen et menhir) ; jetons de 2 à 12, 6 et 8 en rouge, toujours lisibles quel que soit le zoom.
- Terre exploitée (touchée par un village) : son ouvrier LPC au travail : bûcheron à la hache, carrier et briquetier à la pioche, paysan à la houe, berger ; accessoires (souche, charrette, sacs, tonneau).
- Villages = chaumières, villes = maison en pierre et tour ; fanion du joueur, fumée de cheminée.
- Routes : terre battue bordée de la couleur du joueur ; villageois du joueur qui y marchent (cercle de couleur sous les pieds).
- Pirate : pillard LPC au drapeau noir, qui marche jusqu'à sa nouvelle terre.
- Ressources qui s'envolent de la terre vers les villages quand les dés tombent ; voilier et barque, mer qui scintille.
- Zoom : pincer, glisser, molette, toucher (un toucher rapproche, au plus près revient à l'île entière), boutons + / − / [ ].
- Interface Tiny Swords comme Terres franches (papier, parchemin, rubans, boutons bleus et rouges), polices Press Start 2P et Cinzel.

## Décisions de l'utilisateur (19/11)
- Nom : **Archipel**. Dossier `archipel/`.
- **Partie libre** contre l'ordinateur, sur une île au hasard, avec **niveaux d'ordinateur** (facile, moyen, fort). Pas d'île du jour ni de classement pour le moment.
- En plus des règles de la maquette : **pose de départ au choix** (le joueur place ses 2 villages et 2 routes, en serpent avec l'ordinateur), **ports spéciaux** (3 contre 1, ou 2 contre 1 pour une ressource), **bonus de 2 points** pour la plus longue route et pour la plus grande garde.
- Pas de cartes d'événement dans la première version.

## Règles (version 1, à valider)
- 3 joueurs (toi en rouge, deux ordinateurs), premier à 10 points. Village 1 point, ville 2 points (produit double).
- Coûts : route = bois + brique ; village = bois + brique + laine + blé ; ville = 2 blé + 3 pierre.
- Village : à 2 arêtes au moins de tout autre village, relié à une de ses routes (sauf à la pose de départ ; le second village de départ donne une carte de chaque terre voisine).
- 7 aux dés : le pirate va sur une terre au choix (elle ne produit plus) et on vole une carte à un voisin de cette terre ; un joueur qui a plus de 7 cartes en perd la moitié (à décider).
- Port 4 contre 1 partout ; 9 ports sur la côte (4 à 3 contre 1, 5 à 2 contre 1, un par ressource), utilisables par un village posé à côté.
- **Plus longue route** : 5 routes à la suite au moins, +2 points, reprise par qui fait plus long.
- **Garde** (proposition, puisqu'il n'y a pas de cartes) : on recrute un garde (laine + blé + pierre) ; recruter un garde déplace le pirate et vole une carte ; **plus grande garde** à 3 gardes au moins, +2 points.
- Ordinateur : **facile** (joue au hasard parmi les bons coups, n'échange pas), **moyen** (le comportement de la maquette), **fort** (vise les meilleures terres et les ports, garde de quoi bâtir, envoie le pirate sur le joueur en tête).

## Référence : les règles du jeu de société de base (résumé)
Résumé fait de mémoire et **avec nos mots** (les mécanismes d'un jeu sont libres ; le texte du livret, le nom et les dessins ne le sont pas) ; à recouper avec les règles officielles en ligne si un point fait débat. Jeu de base pour 3 ou 4 joueurs.
- **Plateau** : 19 terres (4 forêts, 4 prés, 4 champs, 3 collines d'argile, 3 montagnes, 1 désert) entourées de mer ; 18 jetons de 2 à 12 (un seul 2 et un seul 12, deux de chaque autre, pas de 7) ; le voleur part du désert. 9 ports sur la côte : 4 à 3 contre 1, 5 à 2 contre 1 (un par ressource). En variante, les 6 et les 8 ne se touchent pas.
- **Réserve** : 19 cartes de chaque ressource ; si la banque ne peut pas servir tout le monde pour une ressource, personne n'en reçoit (sauf s'il n'y a qu'un seul joueur concerné). Chaque joueur a 15 routes, 5 colonies, 4 villes.
- **Mise en place** : chacun pose une colonie et une route, dans l'ordre, puis une seconde colonie et une route dans l'ordre inverse (en serpent) ; la seconde colonie rapporte une carte de chaque terre voisine. Règle de distance : jamais deux colonies sur des coins voisins.
- **Un tour** : 1. lancer les deux dés : chaque terre qui porte le nombre donne 1 carte par colonie et 2 par ville qui la touchent, à tous les joueurs (sauf la terre du voleur) ; 2. échanger : avec les autres joueurs (seulement avec celui dont c'est le tour) ou avec la banque (4 contre 1, ou le taux d'un port où l'on a une colonie) ; 3. construire et acheter, dans l'ordre qu'on veut (échanges et constructions peuvent se mélanger).
- **Coûts** : route = bois + argile ; colonie = bois + argile + laine + blé ; ville (remplace une colonie) = 2 blé + 3 minerai ; carte de développement = laine + blé + minerai.
- **Construire** : une route touche une de ses routes, colonies ou villes ; une colonie respecte la distance et touche une de ses routes.
- **Le 7** : personne ne produit ; tout joueur qui a plus de 7 cartes en défausse la moitié (arrondie en dessous) ; le joueur déplace le voleur sur une autre terre (elle ne produit plus) et prend une carte au hasard à un joueur qui a une colonie ou une ville sur cette terre.
- **Cartes de développement** (25) : 14 chevaliers (déplacer le voleur et voler, comme sur un 7), 5 points de victoire (cachés jusqu'à la victoire), 2 constructions de routes (2 routes gratuites), 2 inventions (2 ressources au choix de la banque), 2 monopoles (tous les autres donnent leurs cartes d'une ressource nommée). Une seule carte jouée par tour, jamais celle achetée dans le tour (sauf les points de victoire) ; un chevalier peut se jouer avant les dés.
- **Bonus** : **route la plus longue** (5 routes à la suite au moins, sans compter les branches ; une colonie adverse coupe la route) = 2 points, reprise par qui fait strictement plus long ; **armée la plus puissante** (3 chevaliers joués au moins) = 2 points, même principe.
- **Fin** : le premier à 10 points pendant son tour gagne (colonie 1, ville 2, bonus 2, cartes points de victoire 1).

## Ce qu'Archipel en reprend (proposition)
| Jeu de base | Archipel v1 |
|---|---|
| Argile, minerai | Brique, pierre (déjà dans la maquette) |
| Colonie | Village |
| Voleur | Pirate (le pillard LPC) |
| Plateau fixe ou variable | Île au hasard, 6 et 8 jamais voisins, ni deux numéros pareils |
| 9 ports | Pareil (4 à 3:1, 5 à 2:1) |
| Défausse de la moitié au-delà de 7 cartes | **Gardée** (proposé : rend le 7 utile et empêche d'amasser) |
| Échanges entre joueurs | Version 1 : l'ordinateur accepte ou refuse une offre du joueur (1 contre 1 ou 2 contre 1), et propose parfois un échange ; à confirmer |
| Cartes de développement | Pas dans la v1 ; le **garde** (laine + blé + pierre, même coût) joue le rôle du chevalier, et la **plus grande garde** celui de l'armée la plus puissante |
| Limites (15 routes, 5 colonies, 4 villes, 19 cartes) | Gardées pour les pièces ; banque sans limite (plus simple à suivre) |

## Points ouverts
- À confirmer : défausse sur un 7 et échanges avec l'ordinateur (voir le tableau). Durée d'une partie (≈ 15 à 20 min ?), sons, sauvegarde de la partie en cours, records locaux (victoires, meilleur nombre de tours).
- Moteur des règles pur et testable sous Node (simulateur de parties entre ordinateurs, comme Bannières et Terres franches).
- Modèle conseillé : opusplan (jeu moyen bien défini).

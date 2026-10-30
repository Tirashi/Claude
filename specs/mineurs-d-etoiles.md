# Mineurs d'étoiles (chantier, nom de travail)

Idée de l'utilisateur du 30/10 : exploration spatiale + gestion + auto battler.

## État
- DA **différente de Nebula** : pixel art ; planètes du **Pixel Planet Generator** de Deep-Fold (MIT, shaders passés en WebGL 2, calculés en direct), vaisseaux **Void** de Foozle (CC0).
- **Maquette 1** (30/10, `maquettes/mineurs-d-etoiles.html`, https://claude.ai/artifact/P7jTbpdzH6gQkfNn9tW3ro) : l'étage 1 jouable, trois pilotages (A le doigt guide, B inertie, C toucher la cible), galerie des vaisseaux et tableau des packs. **En attente du retour de l'utilisateur.**

## L'idée
Départ en orbite terrestre : un petit vaisseau (carburant et soute limités) casse des astéroïdes au tir et ramasse le minerai (fer, rarement or ; un minerai = une case de soute), qu'il faut ramener sur Terre avant la panne sèche. Le minerai devient de l'argent : usines (meilleur prix), centre spatial et recherche (carburant, soute, puissance de tir, plus de minerai par astéroïde, nouveaux minerais). Puis station spatiale et vaisseaux de minage autonomes ; on va plus loin (Lune, Mars…) avec des bases ; vaisseaux de guerre et drones qui patrouillent autour des bases contre les aliens.

## Décisions (30/10)
- Construire par **étages** (proposé) : 1 la Terre et sa ceinture (minage, retour, usines, recherches) ; 2 station et mineurs autonomes ; 3 Lune et Mars, bases ; 4 aliens, vaisseaux de guerre, drones. Pas de vraie physique orbitale (l'orbite est un décor). Prévoir une vraie fin.
- **Combat** (choix de l'utilisateur) : le joueur **défend lui-même** avec son vaisseau, et **compose la flotte** qui défend chaque planète ; des **satellites** préviennent la flotte d'une attaque et la font venir plus vite.
- Pilotage : à choisir avec la maquette 1.

## Vaisseaux proposés (itch.io, 30/10)
- **Void** de Foozle (CC0, prix libre) : vaisseau du joueur en 4 moteurs, 4 armes, 4 boucliers, 4 états de dégâts (les améliorations se voient) ; Fleet Packs Kla'ed, Nairan, Nautolan (8 vaisseaux animés chacun) pour les aliens. Retenu pour la maquette.
- Wenrexa, Sprites Spaceships Pack [+468] (0,95 $, CC0) : un modèle par mineur, cargo, drone.
- Pixels by Skab, Spaceships Assembler (1 $) : vaisseaux à assembler, pour composer sa flotte.
- DyLESTorm, Pixel Spaceships Lite (gratuit) / Pixel Enemies (4,99 $).
- Deep-Fold, Pixel Space Background Generator (MIT) : fonds d'espace.
- Écartés : CarlyDraws Spaceships Vol. 1 (licence jeux de rôle sur table), Cuxrie Essentials Kit.

## Maquette 1 : réglages
Terre 150 px (shader terre + nuages), quai à 101 px du centre, ceinture de 190 à 460, orbite limite 640, Lune à 860 (visible, inaccessible). 26 astéroïdes de 30 à 58 px (1 PV par 14 px), 1 à 3 minerais, or 10 %. Fer 4 CR, or 25 CR. Carburant 30 s (+12 par niveau ; en B : 0,55/s en glissant, 1,6/s en poussant), soute 5 (+2), canon 1 (+1). Panne sèche : remorqué, moitié de la soute perdue. Les niveaux changent le moteur (réservoir) et l'arme (canon) du vaisseau.

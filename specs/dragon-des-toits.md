# Dragon Simulator (ex-« Dragon des toits ») — idée du fils de l'utilisateur (7 ans), 01/11

## L'idée telle qu'il l'a donnée
Le joueur dirige un dragon qui plane au-dessus d'une ville. Il faut faire attention aux obstacles. Plus on va loin, plus on a de points. Avec ces points, on améliore le dragon **dans le nid** : sa résistance, la force de ses flammes, le nombre de fois (carburant) où il peut cracher du feu, comment il plane…

Pendant la partie, le dragon détruit des maisons et trouve des bonus pour aller plus loin :
- **jetpack** pour voler plus longtemps ;
- **lance-flammes** pour recharger ses flammes ;
- **grenade** pour améliorer l'explosion des immeubles touchés par les flammes (nombre limité aux grenades ramassées) ;
- etc.

## Maquette 1 (01/11)
https://claude.ai/artifact/NgYdCyJaL66PGyHJ8CkHUf — source `maquettes/dragon.html`. Jouable : chaque téléphone joue tout seul (démo), on le touche pour prendre les commandes ; les pièces gagnées vont dans le nid, dont les achats changent les trois essais.
- **A Le grand plané** : vu de côté, coucher de soleil ; toucher = coup d'ailes (use l'énergie), bouton FEU ; grues et montgolfières ; quand l'énergie est vide, le dragon se pose et la partie s'arrête.
- **B La ville d'en haut** : vu de dessus, en plein jour ; glisser le doigt pour diriger, FEU sur les toits devant ; tours en relief à contourner, montgolfières.
- **C Les toits de nuit** : derrière le dragon, trois couloirs ; glisser pour changer de couloir, vers le haut pour sauter, boules de feu sur les maisons qui barrent la route ; tours à éviter, câbles à sauter.
- **Le nid** (commun) : écailles (cœurs), flammes (force), réserve de feu (carburant), ailes (plané) ; 5 niveaux, 40 / 80 / 140 / 220 pièces.
- Bonus de la maquette : jetpack, lance-flammes, grenade, pièces ; proposés en plus : bouclier, aimant, œuf d'or.

## Questions de la maquette 1
Façon de jouer (A, B, C ou mélange) ; couleur et nom du dragon ; ville d'aujourd'hui ou Moyen Âge ; fin de partie (énergie vide ou plus de cœurs) ; obstacles à garder ou ajouter ; but au bout (sans fin ou boss) ; autres bonus ; classement de la famille.

## Réponses du 01/11 (le créateur)
- Façon de jouer **A** (vol plané vu de côté). Nom : **Dragon Simulator**.
- **Ville d'aujourd'hui** ; d'autres décors ensuite (le premier : **l'aéroport**) ; on choisit **dans le nid** le décor de départ.
- La partie s'arrête **quand le dragon touche le sol**. On garde **tous les obstacles**. Partie **sans fin**.
- Pas encore d'autres bonus : à proposer. Demande : essayer **en 3D**, avec des packs itch.io.

## Maquette 2 en 3D (01/11)
https://claude.ai/artifact/93nrGTRHG1G1qbt9GCg97q — source `maquettes/dragon-simulator.html` (Three.js r128 + GLTFLoader ; modèles en GLB base64 à la fin du fichier, 2,8 Mo). Jouable : démo, toucher → le nid (améliorations, décor de départ VILLE / AEROPORT, PORT et FETE FORAINE verrouillés), ENVOLER !, retour au nid après l'atterrissage. Mêmes règles qu'A (logique en « pixels », 12 px = 1 unité). Décors de 400 m qui alternent. Deux caméras : **1 de profil**, **2 trois-quarts**.
- Ville : 8 immeubles KayKit à brûler, rangées d'immeubles derrière, route avec voitures, lampadaires ; grues et montgolfières.
- Aéroport (fait à la main) : hangars, terminal, avions garés à brûler ; tour de contrôle, avions qui décollent, montgolfières.
- Bonus proposés : bébé dragon, super-souffle, nuage d'orage, bouclier, aimant, œuf d'or. Décors proposés : port, fête foraine, montagne, château fort.
- Packs : Quaternius LowPoly Animated Monsters (CC0, dragon animé), KayKit City Builder Bits (CC0) ; repérés : Kenney City Kit Suburban (CC0), Rigged Dragon Pack d'akochan-lu (4,99 $, 6 dragons animés), Airport & Aviation 3D Pixel Art Kit d'antahonist (4,99 $).
- **Leçons techniques** : conversion FBX → GLB dans Playwright (FBXLoader + GLTFExporter de three 0.128, `npm pack three@0.128.0` car jsdelivr est bloqué depuis le conteneur) : `outils/fbx-vers-glb.js`. Le maillage FBX à 99 groupes doit être regroupé par matériau **et indexé**, sinon chaque primitive glTF dessine tout le corps (le dernier matériau, noir, gagne). Le dragon est rendu en **matcap** (couleurs par nom de matériau : Main, Wings, Belly, Eyes, Claws).

Questions posées : quelle caméra ; le dragon de Quaternius plaît-il (sinon le pack payant) ; ordre des décors suivants ; bonus à garder ; ville avec ou sans petites maisons.

## Choix du 01/11 (après la maquette 2) et maquette 2 bis
- **Caméra de profil** retenue ; **bonus proposés validés** (bébé dragon, super-souffle, nuage d'orage, bouclier, aimant, œuf d'or) ; **dragon de Quaternius gardé** ; pour le moment **ville et aéroport en alternance**.
- Retour : « les flammes sont censées pouvoir détruire des bâtiments » → flammes plus longues (portée ~110 px, angle vers le bas 0,5 à 1,25 rad, 5 particules par image), bâtiments plus fragiles (PV = hauteur × 0,32), feu à 0,25 par image ; le bâtiment noircit, brûle, **s'effondre** (s'enfonce en 45 images dans la poussière) et laisse des **ruines qui brûlent** ; la démo vole plus bas pour brûler.
- Nouveaux modèles : hélicoptère (ville et aéroport, rotor qui tourne), petit avion d'école qui décolle, petit hangar à brûler, manche à air (Low-Poly Aircraft Kit Free, **CC BY 4.0, à citer**) ; pompiers et police sur la route (Kenney Car Kit, CC0).
- Catalogue de 60 vignettes dans la page (`LES MODELES 3D DISPONIBLES`), fabriquées hors ligne dans Playwright (rendu 128 px en JPEG) : KayKit City Builder Bits, Quaternius Monsters / Animals / Modular Street / Cars, Kenney Car Kit / Suburban, Aircraft Kit. Payants repérés : Rigged Dragon Pack (4,99 $), Aircraft Kit complet (8,99 $), Airport & Aviation Kit (4,99 $).
- Même lien d'artefact (republié). Questions : la destruction plaît-elle ; nouveaux modèles à garder ; envies dans le catalogue.

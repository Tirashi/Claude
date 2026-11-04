# Dragon Simulator — cahier des charges

Idée du fils de l'utilisateur (7 ans), 01/11. Maquette 3D jouable qui sert de référence : https://claude.ai/artifact/93nrGTRHG1G1qbt9GCg97q (source `maquettes/dragon-simulator.html`). L'historique des maquettes et des décisions est à la fin du fichier.

## 1. Décisions du créateur et de l'utilisateur
- Le joueur dirige un **dragon** qui **plane au-dessus d'une ville**, vu **de profil**, en 3D. Il évite les obstacles ; **plus il va loin, plus il gagne de points (pièces)** ; avec les pièces, on **améliore le dragon dans le nid**.
- **Ville d'aujourd'hui**, puis d'autres décors ; pour le moment **ville et aéroport en alternance**. Le **décor de départ se choisit dans le nid**.
- La partie s'arrête **quand le dragon touche le sol**. Partie **sans fin**.
- **On garde tous les obstacles.** Les **flammes détruisent les bâtiments** (ils noircissent, brûlent, s'effondrent) ; les voitures explosent ; les **chauves-souris se brûlent** ; les **animaux s'enfuient** sans brûler.
- **Le dragon** : celui de Quaternius (rouge, ventre jaune). **Tous les modèles gratuits** sont gardés ; les packs payants, « on verra plus tard ».
- **Bonus** : jetpack, lance-flammes, grenade, pièces, et les six nouveaux validés (bébé dragon, super-souffle, nuage d'orage, bouclier, aimant, œuf d'or).

## 2. La boucle
Écran titre → **nid** (améliorations, choix du décor de départ, ENVOLER !) → le dragon s'élance du nid, en haut d'une tour → vol plané, feu, bonus → **atterrissage** (énergie vide) ou **chute** (plus de cœurs) → bilan (distance, pièces, records) → retour au nid.

## 3. Commandes (téléphone, en portrait)
- **Toucher l'écran** : un coup d'ailes (le dragon remonte et accélère un peu ; coûte de l'énergie).
- **Bouton FEU** (en bas à droite), maintenu : le dragon crache ses flammes vers l'avant et le bas, tant qu'il reste du feu.
- Bouton **pause** en haut (reprendre, nid, retour à la Ludothèque).

## 4. Le vol (règles de la maquette, à garder)
La logique tourne en « pixels » (12 px = 1 unité 3D, sol à 268) pour être testée sous Node.
- Vitesse de croisière **1,15 px/image au départ, qui monte jusqu'à 1,75 à 600 m** (04/11 : trop rapide au début ; avant : 1,7 fixe), un coup d'ailes ajoute au plus 0,8, le jetpack 1,4 (`DS_VITESSE`, `dsCroisiere`) ; gravité 0,045 × plané, chute plafonnée tant qu'il reste de l'énergie (vol plané), libre quand elle est vide.
- Coup d'ailes : −1,45 en vertical, +0,09 en vitesse, −2,5 d'énergie (3 dans la maquette, réglé en session 1).
- **Énergie** 100, qui baisse de 0,05 par image (0,07 dans la maquette ; −13 % par niveau d'AILES) : au niveau 1, une partie dure environ 25 s (simulateur).
- **Feu** : réserve de 45 au niveau 1 (+15 par niveau), 0,25 par image ; portée ~110 px vers l'avant et le bas ; la flamme part de la gueule (os `dragon_Nose`).
- **Cœurs** : 2 au départ (+1 par niveau d'ÉCAILLES) ; un choc en retire un et rend invincible un instant ; à 0, le dragon tombe.
- **Difficulté** : les obstacles se rapprochent avec la distance (jusqu'à −70 px d'écart).

## 5. Les décors
- Chaque décor dure **250 m** (400 m avant le 04/11), puis le suivant : ville, maisons, centre-ville, usines, aéroport, ville… Annonce « L'AEROPORT ! » au changement.
- **Ville** : rangée d'immeubles KayKit et de maisons Kenney à brûler, rangées d'immeubles derrière, route avec 21 sortes de véhicules, trottoir (lampadaires, feux, panneaux, bancs, bennes, bouches d'incendie, carlin), château d'eau.
- **Maisons** (04/11, Kenney City Kit Suburban 2.0) : pavillons à brûler avec leur arbre, quelques petits immeubles tout faits (Modular Buildings), pavillons et arbres derrière, bacs à fleurs et haies, peu de voitures, plus de carlins, plus de montgolfières que de grues.
- **Centre-ville** (04/11, City Kit Commercial 2.1) : bureaux et tours toutes faites (Modular Buildings) à brûler, tours blanches et gratte-ciel derrière, réverbères courbes et feux (City Kit Roads 2.2), beaucoup de voitures.
- **Usines** (04/11, City Kit Industrial 2.0) : ateliers, grandes cheminées et cuves à brûler ; derrière, ateliers, cheminées qui fument, cuves, éoliennes ; conteneurs, cônes et barrières de chantier sur le trottoir ; camions sur la route.
- La ville a maintenant aussi des maisons Suburban 2.0 (à la place des 1.0) et des tours toutes faites de Modular Buildings.
- **Aéroport** : hangars, terminal, avions garés et petit hangar à brûler ; piste, cônes, tracteurs ; animaux dans l'herbe ; manche à air.
- **Décor de départ** : tout décor **déjà atteint une fois** se choisit dans le nid (la ville l'est d'emblée). Décors proposés pour plus tard : port, fête foraine, montagne, château fort, campagne.

## 6. Destruction et pièces
- Bâtiment : points de vie = hauteur × 0,32 ; dégâts = force × 0,9 par image de flamme ; gain = hauteur / 10, arrondi au-dessus (2 à 4 pièces). Il noircit, brûle, s'effondre en 45 images dans la poussière, laisse des ruines qui brûlent 4 s.
- Véhicule : explose (+3), débris qui volent. Chauve-souris : tombe en flammes (+4). Animaux : s'enfuient en sautillant (rien à gagner).
- **Grenade** : la prochaine destruction souffle aussi tout ce qui est à moins de 50 px.
- **Pièces de distance** : 1 pièce tous les 20 m (validé, en plus de la destruction et des pièces ramassées), pour coller à « plus on va loin, plus on a de points ».

## 7. Obstacles
Grues (ville), tour de contrôle (aéroport), montgolfières, hélicoptère (partout), petit avion qui décolle (aéroport), chauves-souris (partout, brûlables), toits des bâtiments.

## 8. Les bonus (dans le ciel, environ tous les 90 à 170 px)
| Bonus | Effet |
|---|---|
| Pièces | +5 |
| Jetpack | énergie +35, ne baisse plus et poussée pendant 2,5 s |
| Lance-flammes | feu au maximum |
| Grenade | +1 grenade (voir § 6), plusieurs possibles |
| Bébé dragon | un petit dragon vole à côté et crache du feu tout seul pendant 15 s |
| Super-souffle | flamme géante, portée double et dégâts triples, sans user le feu, pendant 5 s |
| Nuage d'orage | le dragon rebondit dessus vers le haut, avec un éclair qui détruit le bâtiment en dessous |
| Bouclier | bulle qui absorbe un choc |
| Aimant | attire pièces et bonus pendant 10 s |
| Œuf d'or | pièces doublées pendant 10 s |

## 9. Le nid
- Quatre améliorations, 5 niveaux chacune, coûts 40 / 80 / 140 / 220 (1 920 pièces pour tout) : **ÉCAILLES** (cœurs), **FLAMMES** (force), **RÉSERVE DE FEU** (carburant), **AILES** (plané : énergie qui dure plus, chute plus lente).
- Choix du **décor de départ** (§ 5), ENVOLER !
- Le dragon dans son nid, en haut de la tour, avec ses pièces.

## 10. Écrans
Titre (DRAGON SIMULATOR, le dragon qui plane, JOUER, retour à la Ludothèque), nid, partie (HUD : distance, cœurs, pièces, jauges ÉNERGIE et FEU, grenades, bouton FEU), pause, bilan (distance, pièces gagnées, record battu). Police Press Start 2P pour les titres (majuscules sans accents), Fredoka pour les textes.

## 11. Sons (Web Audio, synthétisés, coupables)
Battement d'ailes, souffle du feu, crépitement, explosion, effondrement, pièce, bonus, choc, atterrissage ; une **petite musique discrète** en boucle (validée). Pas de cris d'animaux ni de bruits réalistes de destruction.

## 12. Sauvegarde et classements
- Sauvegarde locale `dragonsim.*` : pièces, niveaux, décors atteints, records (plus grande distance, plus de pièces en une partie, total de bâtiments détruits). Ajoutée au transfert `LUDO1-` de l'accueil.
- **Classement de la famille** : plus grande distance (validé). Pas de vol du jour.

## 13. Technique
- Dossier `dragon-simulator/` : `index.html`, `style.css`, `regles.js` (vol, économie, nid, bonus, génération des décors en « pixels », sans Three.js, testable sous Node), `monde3d.js` (scène, modèles, caméra, particules), `jeu.js` (écrans, HUD, commandes, sons), `modeles.glb` (fichier binaire d'environ 3 Mo fabriqué par `outils/fbx-vers-glb.js`, à adapter pour écrire un `.glb`).
- Three.js r128 de `lib/` avec `GLTFLoader.js` et `SkeletonUtils.js` (déjà dans `lib/`). Modèles fixes rendus en flatShading (normales retirées) ; dragon et chauve-souris en matcap.
- Simulateur `outils/dragon-simulateur.js` (parties automatiques sous Node : durée, distance, pièces par partie selon les niveaux) pour régler l'économie.
- Service worker : ajouter les fichiers à `FILES` (le `.glb` compris) et changer `VERSION`. Crédits déjà à jour.
- Téléphone : `setPixelRatio` ≤ 1,5, objets retirés derrière la caméra, pas d'ombres portées.

## 14. Plan de travail (opusplan, une conversation par session)
1. **Règles et simulateur** ✅ (02/11) : `dragon-simulator/regles.js` (vol, destruction, économie, bonus, génération, pilote automatique), `outils/dragon-simulateur.js` (lancé par `verifications.js`), réglage ci-dessous (§ 16).
2. **Le jeu en 3D** ✅ (02/11) : `monde3d.js`, `jeu.js`, `sons.js`, `index.html`, `style.css`, `modeles.glb` (voir § 17).
3. **Intégration** ✅ (02/11) : voir § 18.

## 15. Questions tranchées (02/11) : cahier des charges validé
1. **Pièces de distance** (1 tous les 20 m), en plus de la destruction : **oui**.
2. **Classement de la famille** sur la plus grande distance : **oui**.
3. **Vol du jour** : **non**.
4. **Musique** : **oui, une petite musique discrète** en boucle (coupable avec les sons).

## 16. Session 1 : règles et réglage (02/11)
- **`dragon-simulator/regles.js`** : script classique, noms `ds…` / `DS_…`. La partie est un objet JSON (sauvegardable tel quel), avec son propre générateur à graine (`p.ra`, aucun `Math.random`). `dsNouvellePartie(sauv, graine)`, puis à chaque image `dsPas(p, { ailes, feu })` ; `p.ev` liste ce qui vient d'arriver (envol, ailes, choc, bouclier, ko, detruit, grenade, voiture, peur, chauve, bonus, pieces, eclair, biome, fin) pour les sons et effets ; `p.flamme` et `p.flammeBebe` disent où dessiner le feu. Chaque objet a un `id` pour retrouver son modèle 3D. `dsTerminer(sauv, p)` paie une seule fois (pièces, records, décors atteints). `dsPilote(p, adresse, alea)` sert à la démo de l'écran titre et au simulateur.
- La décoration (immeubles du fond, trottoir, arbres, buissons) n'a pas de règle : `monde3d.js` la tire lui-même.
- La bouche du dragon est calculée par les règles (décalage mesuré sur l'os `dragon_Nose`) ; la 3D peut faire partir les particules de l'os lui-même.
- Choix pour les bonus : le **bébé dragon** vole derrière et sous le dragon, et crache (portée 70, dégâts ×0,5) sur ce qui est devant lui ; le **nuage d'orage** foudroie le bâtiment le plus proche, juste devant ; l'**aimant** attire tout sauf les nuages ; l'**œuf d'or** double toutes les pièces, distance comprise.
- **Réglage** (`node outils/dragon-simulateur.js 6`, trois pilotes automatiques qui achètent l'amélioration la moins chère) : première partie ≈ 25 s et 375 m ; dragon au maximum ≈ 60 s et 1 000 m (il atteint l'aéroport). Avec les coûts validés (1 920 pièces), un joueur moyen gagne environ 70 à 90 pièces par vol au début et environ 200 à la fin. Il achète sa **première amélioration dès le premier vol** et **tout en environ 16 vols (11 min de vol)**. Cibles vérifiées par le simulateur : première partie de 20 à 45 s, première amélioration en 2 vols au plus, tout en 12 à 45 vols, dragon amélioré nettement plus loin.
- Les pilotes adroits ou maladroits finissent à peu près pareil : le jeu pardonne beaucoup (le bouclier, les cœurs, le plané).
- La plupart des vols finissent en « chute » : quand l'énergie est vide, le dragon descend sur les toits.

## 17. Session 2 : le jeu en 3D (02/11)
- **Fichiers** (`dragon-simulator/`) : `index.html` et `style.css` (écrans par-dessus la scène, colonne de téléphone centrée sur un écran large), `regles.js`, `monde3d.js` (`window.DsMonde` : scène, modèles, décor, particules, caméra, textes flottants), `sons.js` (`window.DsSons` : sons synthétisés, souffle continu du feu, petite musique en la mineur au triangle), `jeu.js` (écrans, commandes, HUD, sauvegarde, boucle à 60 images par seconde à pas fixe ; `window.DragonSim` pour les tests), `modeles.glb` (2,9 Mo, le même GLB que la maquette ; `outils/fbx-vers-glb.js` écrit maintenant un `.glb` si la sortie finit par `.glb`). Polices locales `polices/dragon-simulator.css` (Press Start 2P, Fredoka).
- **Écrans** : titre (démo jouée par `dsPilote`, dragon niveau 3, ville puis aéroport), nid (achats qui profitent tout de suite au dragon posé, décor de départ : un décor pas encore atteint affiche la distance où on le trouve), partie (HUD : distance, cœurs, pièces, jauges, bonus en cours avec leurs secondes ; bouton FEU qui pâlit sans feu et blanchit avec le super-souffle), pause (aussi quand l'appli passe en arrière-plan ; RENTRER AU NID paie quand même les pièces), bilan (distance, pièces, bâtiments brûlés, record, nouveau départ débloqué).
- **Clavier** (pour l'ordinateur) : Espace ou ↑ = coup d'ailes, F ou → tenu = feu, Échap ou P = pause.
- **Nouveaux modèles faits à la main** : bébé dragon (clone orange du dragon, en plus petit, qui vole derrière), icônes des bonus (tête de bébé dragon, flamme, nuage d'orage avec éclair, bulle-bouclier, aimant, œuf d'or), bulle autour du dragon avec le bouclier, éclair en zigzag avec flash.
- **Sauvegarde** : `dragonsim.sauvegarde` (JSON lu par `dsMigrer`), `dragonsim.record` (plus grande distance, pour l'accueil), `dragonsim.son`.
- **Artefact** : le jeu remplace la maquette au même lien (https://claude.ai/artifact/93nrGTRHG1G1qbt9GCg97q) ; la copie reçoit `modeles.glb` en base64 (`window.DS_MODELES_B64`, inséré après `outils/artefact.py`, 4,8 Mo en tout).
- Reste pour la session 3 : accueil (cartouche, volet, classement de la distance, transfert `LUDO1-`), service worker, tests `fumee.js` / `logique.js`, essais sur le téléphone.

## 18. Session 3 : intégration (02/11)
- **Accueil** (`accueil.js`) : cartouche (famille 3D, icône `dragonsim` dans `icones.js`, tête de dragon qui crache du feu), `META` (sorti le 02/11, genre ARCADE, à la une), `NEWS`, `RECS` (plus long vol, meilleure partie, bâtiments brûlés, vols, améliorations du nid sur 16), `RANKS` (`dragonsim` / `distance`, en mètres).
- **Classement** : `LudoScores.submit('dragonsim', 'distance', m)` à chaque fin de vol (aussi en rentrant au nid depuis la pause), rang affiché sous le bilan ; `registerExisting` reprend le record, `PSEUDO_BOARDS`, `SYNC` 27.
- **Transfert `LUDO1-`** : `dragonsim.sauvegarde` ; fusion = plus haut niveau de chaque amélioration, le plus de pièces, tous les décors, meilleurs records et totaux. Cas ajouté à `outils/logique.js`.
- **Tests** : `outils/fumee.js` (titre, nid, ENVOLER !, un toucher bat des ailes, atterrissage → bilan et vol sauvegardé).
- À essayer sur le téléphone : fluidité, bouton FEU tenu pendant qu'on tape l'écran, classement réel (testé seulement sans Supabase).

## Historique du chantier

### Dragon des toits — idée du fils de l'utilisateur (7 ans), 01/11

### L'idée telle qu'il l'a donnée
Le joueur dirige un dragon qui plane au-dessus d'une ville. Il faut faire attention aux obstacles. Plus on va loin, plus on a de points. Avec ces points, on améliore le dragon **dans le nid** : sa résistance, la force de ses flammes, le nombre de fois (carburant) où il peut cracher du feu, comment il plane…

Pendant la partie, le dragon détruit des maisons et trouve des bonus pour aller plus loin :
- **jetpack** pour voler plus longtemps ;
- **lance-flammes** pour recharger ses flammes ;
- **grenade** pour améliorer l'explosion des immeubles touchés par les flammes (nombre limité aux grenades ramassées) ;
- etc.

### Maquette 1 (01/11)
https://claude.ai/artifact/NgYdCyJaL66PGyHJ8CkHUf — source `maquettes/dragon.html`. Jouable : chaque téléphone joue tout seul (démo), on le touche pour prendre les commandes ; les pièces gagnées vont dans le nid, dont les achats changent les trois essais.
- **A Le grand plané** : vu de côté, coucher de soleil ; toucher = coup d'ailes (use l'énergie), bouton FEU ; grues et montgolfières ; quand l'énergie est vide, le dragon se pose et la partie s'arrête.
- **B La ville d'en haut** : vu de dessus, en plein jour ; glisser le doigt pour diriger, FEU sur les toits devant ; tours en relief à contourner, montgolfières.
- **C Les toits de nuit** : derrière le dragon, trois couloirs ; glisser pour changer de couloir, vers le haut pour sauter, boules de feu sur les maisons qui barrent la route ; tours à éviter, câbles à sauter.
- **Le nid** (commun) : écailles (cœurs), flammes (force), réserve de feu (carburant), ailes (plané) ; 5 niveaux, 40 / 80 / 140 / 220 pièces.
- Bonus de la maquette : jetpack, lance-flammes, grenade, pièces ; proposés en plus : bouclier, aimant, œuf d'or.

### Questions de la maquette 1
Façon de jouer (A, B, C ou mélange) ; couleur et nom du dragon ; ville d'aujourd'hui ou Moyen Âge ; fin de partie (énergie vide ou plus de cœurs) ; obstacles à garder ou ajouter ; but au bout (sans fin ou boss) ; autres bonus ; classement de la famille.

### Réponses du 01/11 (le créateur)
- Façon de jouer **A** (vol plané vu de côté). Nom : **Dragon Simulator**.
- **Ville d'aujourd'hui** ; d'autres décors ensuite (le premier : **l'aéroport**) ; on choisit **dans le nid** le décor de départ.
- La partie s'arrête **quand le dragon touche le sol**. On garde **tous les obstacles**. Partie **sans fin**.
- Pas encore d'autres bonus : à proposer. Demande : essayer **en 3D**, avec des packs itch.io.

### Maquette 2 en 3D (01/11)
https://claude.ai/artifact/93nrGTRHG1G1qbt9GCg97q — source `maquettes/dragon-simulator.html` (Three.js r128 + GLTFLoader ; modèles en GLB base64 à la fin du fichier, 2,8 Mo). Jouable : démo, toucher → le nid (améliorations, décor de départ VILLE / AEROPORT, PORT et FETE FORAINE verrouillés), ENVOLER !, retour au nid après l'atterrissage. Mêmes règles qu'A (logique en « pixels », 12 px = 1 unité). Décors de 400 m qui alternent. Deux caméras : **1 de profil**, **2 trois-quarts**.
- Ville : 8 immeubles KayKit à brûler, rangées d'immeubles derrière, route avec voitures, lampadaires ; grues et montgolfières.
- Aéroport (fait à la main) : hangars, terminal, avions garés à brûler ; tour de contrôle, avions qui décollent, montgolfières.
- Bonus proposés : bébé dragon, super-souffle, nuage d'orage, bouclier, aimant, œuf d'or. Décors proposés : port, fête foraine, montagne, château fort.
- Packs : Quaternius LowPoly Animated Monsters (CC0, dragon animé), KayKit City Builder Bits (CC0) ; repérés : Kenney City Kit Suburban (CC0), Rigged Dragon Pack d'akochan-lu (4,99 $, 6 dragons animés), Airport & Aviation 3D Pixel Art Kit d'antahonist (4,99 $).
- **Leçons techniques** : conversion FBX → GLB dans Playwright (FBXLoader + GLTFExporter de three 0.128, `npm pack three@0.128.0` car jsdelivr est bloqué depuis le conteneur) : `outils/fbx-vers-glb.js`. Le maillage FBX à 99 groupes doit être regroupé par matériau **et indexé**, sinon chaque primitive glTF dessine tout le corps (le dernier matériau, noir, gagne). Le dragon est rendu en **matcap** (couleurs par nom de matériau : Main, Wings, Belly, Eyes, Claws).

Questions posées : quelle caméra ; le dragon de Quaternius plaît-il (sinon le pack payant) ; ordre des décors suivants ; bonus à garder ; ville avec ou sans petites maisons.

### Choix du 01/11 (après la maquette 2) et maquette 2 bis
- **Caméra de profil** retenue ; **bonus proposés validés** (bébé dragon, super-souffle, nuage d'orage, bouclier, aimant, œuf d'or) ; **dragon de Quaternius gardé** ; pour le moment **ville et aéroport en alternance**.
- Retour : « les flammes sont censées pouvoir détruire des bâtiments » → flammes plus longues (portée ~110 px, angle vers le bas 0,5 à 1,25 rad, 5 particules par image), bâtiments plus fragiles (PV = hauteur × 0,32), feu à 0,25 par image ; le bâtiment noircit, brûle, **s'effondre** (s'enfonce en 45 images dans la poussière) et laisse des **ruines qui brûlent** ; la démo vole plus bas pour brûler.
- Nouveaux modèles : hélicoptère (ville et aéroport, rotor qui tourne), petit avion d'école qui décolle, petit hangar à brûler, manche à air (Low-Poly Aircraft Kit Free, **CC BY 4.0, à citer**) ; pompiers et police sur la route (Kenney Car Kit, CC0).
- Catalogue de 60 vignettes dans la page (`LES MODELES 3D DISPONIBLES`), fabriquées hors ligne dans Playwright (rendu 128 px en JPEG) : KayKit City Builder Bits, Quaternius Monsters / Animals / Modular Street / Cars, Kenney Car Kit / Suburban, Aircraft Kit. Payants repérés : Rigged Dragon Pack (4,99 $), Aircraft Kit complet (8,99 $), Airport & Aviation Kit (4,99 $).
- Même lien d'artefact (republié). Questions : la destruction plaît-elle ; nouveaux modèles à garder ; envies dans le catalogue.

### Retours du 02/11 et maquette 2 ter
- La destruction plaît ; **tous les modèles plaisent** → ajout de **tous les gratuits** ; bug : **le feu ne partait pas de la gueule**.
- Feu : il part de l'os `dragon_Nose` (position monde à chaque image, convertie en « pixels » pour les touches).
- Ajouts : maisons Kenney Suburban (30 % de la rangée de devant en ville, avec un arbre), 21 véhicules (KayKit, Kenney Car Kit, Quaternius Cars) qui **explosent** sous les flammes (+3 pièces, débris Kenney qui volent et rebondissent), lampadaires / feux / panneaux Quaternius et KayKit, bancs, bennes, bouches d'incendie, carlin sur le trottoir ; à l'aéroport animaux Quaternius dans l'herbe au premier plan (ils **s'enfuient** devant le feu, ne brûlent pas), cônes, tracteurs, camionnettes ; **chauve-souris animée** (obstacle, `SkeletonUtils.clone`, matcap).
- `outils/fbx-vers-glb.js` réécrit : prend un dossier (FBX, GLB/glTF, OBJ+MTL), préfixe os et pistes des FBX, regroupe et indexe, retire les normales et fusionne les sommets hors FBX (rendu en flatShading dans la page), partage les textures identiques : 60 modèles en 4 Mo de base64.
- Questions : animaux qui fuient au lieu de brûler ; chauve-souris à brûler ou non ; packs payants pour plus tard.

## 19. Retours du 04/11 : vitesse et City Kits 2 de Kenney
- **Vitesse** : trop rapide en début de partie. Croisière 1,15 px/image au départ, qui monte jusqu'à 1,75 à 600 m ; coup d'ailes +0,09 (au plus croisière + 0,8), jetpack au plus croisière + 1,4. Simulateur : premier vol ~25 s et ~300 m, dragon au maximum ~60 s et ~900 m, tout acheté en ~18 vols.
- **City Kits 2 de Kenney** (Suburban 2.0, Commercial 2.1, Industrial 2.0, Roads 2.2) et **Modular Buildings** (immeubles tout faits), CC0, pris sur OpenGameArt (kenney.nl et les pages itch.io de Commercial et Industrial ne répondent pas depuis le conteneur). Trois nouveaux décors : **maisons**, **centre-ville**, **usines** ; décors de 250 m. Un décor atteint devient un départ possible au nid (5 boutons).
- Modèles : 73 de plus dans `modeles.glb` (3,0 → 3,9 Mo), préfixes `ksu_`, `kco_`, `kin_`, `kro_`, `kmb_` ; les maisons Suburban 1.0 (`ks_house…`) sont retirées. Chaque kit a sa propre `colormap.png` : le GLB de chaque modèle est réécrit pour pointer vers `Textures/colormap_<préfixe>.png` avant `outils/fbx-vers-glb.js` (sinon tous prendraient la même texture).
- Fumée des cheminées d'usine (particules grises), éoliennes tournées de profil.

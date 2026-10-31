# Mineurs d'étoiles — cahier des charges

Proposition du 31/10, écrite après la maquette 6 validée. **À relire par l'utilisateur** (il dira quoi changer). L'historique du chantier (idée, maquettes, retours) est au § 18.

## 1. Décisions de l'utilisateur (30 et 31/10)
- Fusion **exploration spatiale + gestion + auto battler**, départ depuis la Terre ; DA **différente de Nebula**.
- Le joueur pilote une **corvette** (pas un chasseur), **lente et lourde**, au **joystick avec inertie**, écran **à l'horizontale**, bouton **RENTRER**.
- Minage : on casse les astéroïdes, un minerai = une case de soute, il faut rentrer vendre **avant la panne sèche** ; les **gros astéroïdes se brisent en 2 à 4** plus petits.
- Graphismes : planètes du **Pixel Planet Generator** de Deep-Fold ; corvettes, roches, station et drones faits avec le **moteur de vaisseaux de Nebula** en rendu **palette** ; **rotation continue** (angle tracé le plus proche + petit reste tourné).
- Les **améliorations se voient** sur la corvette ; une **station spatiale** (façon **ISS**) débloque d'autres **classes** de corvette.
- Combat : le joueur **défend lui-même** avec sa corvette et **compose la flotte** qui défend chaque planète ; des **satellites** préviennent la flotte d'une attaque et la font venir plus vite.

## 2. Le jeu en une phrase
Un jeu de minage et de gestion **calme et sans pièges de jeu mobile** (pas de pub, d'énergie, de longues attentes ni de récompense quotidienne forcée) : on part avec une petite corvette autour de la Terre, on mine, on améliore, on bâtit une station, on automatise avec des drones, on pousse jusqu'à la Lune puis Mars, et on finit par défendre ses bases contre les aliens. **Une vraie fin** (3 à 5 h de jeu), puis un mode libre.

## 3. La sortie de minage (cœur du jeu, comme les maquettes)
- On **décolle** du quai (orbite basse de la planète). Le carburant baisse dès qu'on quitte le quai : lentement en glissant, plus vite en poussant.
- Les **tourelles** visent et tirent seules sur la roche la plus proche (portée ~200 px). Le joueur ne fait que **piloter** : se placer, esquiver, choisir ses roches.
- Roches : **grosse** (7 PV) → 2 à 4 **moyennes** (3 PV) → 2 à 4 **petites** (1 PV) qui lâchent **1 ou 2 minerais**. Les minerais sont attirés par la corvette quand elle passe près ; soute pleine = on ne ramasse plus.
- **Retour au quai** : vente automatique du minerai (selon les prix de l'usine), plein de carburant, panneau du quai.
- **Panne sèche** : la corvette est remorquée au quai et **perd la moitié de sa soute** (pas d'autre punition).
- Une sortie dure de 30 s à 2 min ; aucune limite au nombre de sorties.
- **Dangers** (à partir de l'étage 1, peu nombreux) : petites roches rapides qui abîment la coque (barre de coque, réparée au quai), débris ; aliens à l'étage 4.

## 4. Commandes (maquette 6)
- **Joystick flottant** sous le pouce gauche (apparaît là où on pose le doigt) : la corvette se tourne vers la direction et pousse ; on lâche = elle glisse.
- Bouton **RENTRER** (bas à droite) : pilote automatique vers le quai, annulé dès qu'on reprend le joystick.
- Plus tard : bouton **CIBLE** (choisir la roche ou l'alien prioritaire pour les tourelles) et bouton de **capacité** de la classe (foreuse, bouclier…).

## 5. Les étages (la progression)
| Étage | Lieu | Ce qu'on y fait | Débloqué par |
|---|---|---|---|
| 1 | **Terre et sa ceinture** | Minage de fer et d'or, premières améliorations, usines, recherche | départ |
| 2 | **Station spatiale** (orbite terrestre) | Construire l'ISS module par module ; classes de corvette ; **drones** de minage et cargos qui travaillent seuls | Centre spatial (recherche) |
| 3 | **Lune**, puis **Mars** | Voyage (carburant), nouvelle ceinture et nouveaux minerais, **bases** (petite station locale avec son quai) | Moteur de transfert (recherche) |
| 4 | **Aliens** | Attaques sur les planètes à bases ; défense par le joueur, la flotte et les drones ; satellites d'alerte ; vaisseau-mère alien | Première base sur Mars |
- **Voyage** entre planètes : depuis la carte du système (écran simple, planètes de Deep-Fold), coût en carburant ou en temps de trajet court (5 à 10 s, animation), pas de vraie physique orbitale.
- **Fin** : détruire le **vaisseau-mère alien** au-delà de Mars. Ensuite, **mode libre** (on continue à miner et à agrandir).

## 6. Minerais et prix (proposition, à régler au simulateur)
| Minerai | Où | Prix de base | Rôle |
|---|---|---|---|
| Fer | Terre | 4 CR | argent, construction de la station |
| Or | Terre (rare) | 25 CR | argent |
| Glace | Lune | 6 CR | **carburant** des bases et des voyages |
| Titane | Lune | 15 CR | coques des classes avancées, drones |
| Cobalt | Mars | 20 CR | tourelles, défense |
| Cristal | ceinture de Mars (rare) | 80 CR | recherches de fin de partie |
- Les roches montrent leur minerai (veines dorées = or, rouille = fer, etc.).
- Certaines constructions demandent **des minerais en plus des CR** (ex. module de station = CR + fer), pour donner envie d'aller chercher chaque minerai.

## 7. Améliorer la corvette
- **Améliorations de classe** (au quai, comme la maquette) : **réservoir** (+10 s, cuves blanches), **soute** (+2 cases, conteneurs), **canon** (+1 dégât, canons plus longs puis doublés, +1 tourelle au niveau 2), **coque** (plus de résistance, plaques). 3 niveaux chacune, prix croissants (×1,8).
- **Classes** (achetées à la station, on garde les classes achetées et on change au quai) :

| Classe | Rôle | Tourelles | Soute | Vol | Débloquée |
|---|---|---|---|---|---|
| Éclaireur | départ, petite | 1 | 4 | 34 s | départ |
| Prospecteur | minage, foreuse | 2 | 6 | 40 s | station stade 1 |
| Pionnière | polyvalente, voyages | 3–4 | 8 | 50 s | station stade 2, pour la Lune |
| Escorte | défense, dégâts ×2 | 3–4 | 3 | 40 s | station stade 3, étage 4 |
| (à définir) | lourde, fin de partie | 5–6 | 10 | 60 s | cristal |
- Chaque classe a une **capacité** (proposition) : Prospecteur = foreuse (casse une petite roche au contact), Pionnière = aimant (ramasse de plus loin), Escorte = bouclier quelques secondes.

## 8. Usines et recherche (sur Terre puis sur la station)
- **Usines** (achat unique puis niveaux) : Fonderie (fer ×1,5), Affinerie (or ×1,5), etc. Elles augmentent le **prix de vente**.
- **Centre de recherche** : arbre court, sans minuteur (la recherche est **immédiate** une fois payée) : plus de minerai par roche, roches plus riches, aimant, moteurs plus puissants (orbite plus large), centre spatial (→ station), moteur de transfert (→ Lune), etc.
- Pas d'attente : on paie, c'est fait.

## 9. La station spatiale et les drones (étage 2)
- La station se construit **module par module** (façon ISS, maquette 6) : **module central** → **poutre** et **ailes solaires** (énergie) → **radiateurs** → **hangar** (drones) → **raffinerie** (meilleurs prix) → **antenne** (satellites) → **quai** (changer de classe, réparer).
- **Énergie** : chaque module consomme, les ailes solaires produisent ; il faut assez d'ailes pour faire tourner hangar et raffinerie (petite contrainte de gestion).
- **Drones** (fabriqués au hangar) : **mineur** (casse les petites roches), **cargo** (ramène le minerai), **réparateur**, **défense**, **satellite**. Ils travaillent seuls autour de la station pendant qu'on pilote ; leur rendement est affiché au quai.
- **Hors ligne** (proposition) : les drones continuent un peu quand le jeu est fermé (résumé au retour, **plafonné à 2 h**), sans notification ni rappel.

## 10. La défense (étage 4)
- Les aliens (vaisseaux du même moteur, palette violette ou rouge) **attaquent une planète à base** de temps en temps (vague annoncée, jamais pendant qu'on est loin sans protection possible).
- **Le joueur défend lui-même** avec sa corvette (les tourelles tirent sur les aliens en priorité).
- **La flotte** : à la station, on **compose** la flotte de chaque planète (emplacements limités : drones de défense, escortes autonomes) — c'est la partie « auto battler » : elle se bat seule.
- **Satellites** : posés autour d'une planète, ils **préviennent** de l'attaque plus tôt et font **venir la flotte plus vite** ; sans satellite, la flotte arrive tard.
- Une base perdue n'est pas détruite : elle est **mise hors service** (plus de revenus) jusqu'à réparation.

## 11. Écrans
- **Titre** (Terre qui tourne, corvette), **continuer / nouvelle partie**, retour à la Ludothèque (`ludo-retour`).
- **Vol** (maquette 6) : barre du haut (CR, soute, carburant, coque), joystick, RENTRER, flèche vers le quai.
- **Quai** : onglets **AMÉLIORER**, **STATION** (classes, modules, drones), **RECHERCHE**, **CARTE** (voyager) ; à droite, la planète.
- **Carte du système** : Terre, Lune, Mars (planètes de Deep-Fold), bases, alertes.
- **Pause** : sons, vibrations, retour au menu.

## 12. Graphismes et technique
- Planètes : shaders de Deep-Fold en **WebGL 2** (repli : disque de couleur si WebGL 2 manque).
- Vaisseaux, roches, station, drones, aliens : **`nebula/vaisseaux.js`** (moteur partagé, non modifié) + un fichier du jeu pour la **géométrie tournée**, les **rainures**, la **palette** et les pièces (repris des maquettes 4 à 6). Angles tracés **à la demande** (64 pour les vaisseaux, 24 pour les roches), rotation continue par le petit reste.
- Fichiers proposés : `mineurs-d-etoiles/index.html`, `jeu.js` (vol, écrans), `regles.js` (économie, progression, sans dessin), `chantier.js` (fabrication des sprites), `planetes.js` (shaders), `sons.js` ; simulateur `outils/mineurs-simulateur.js`.
- Polices : Silkscreen et Pixelify Sans (Google Fonts, à héberger dans `polices/` et citer dans les crédits).

## 13. Sons
Sons synthétisés (comme la Boutique) : tirs des tourelles, roche qui éclate, minerai ramassé, alarme de carburant, vente au quai, achat ; musique d'ambiance douce (à voir en fin de chantier).

## 14. Sauvegarde, classements, défi du jour
- **Sauvegarde** automatique (au quai et toutes les 30 s), une partie ; transfert `LUDO1-` comme les autres jeux.
- **Classements** (proposition) : `temps` (temps pour atteindre la fin, plus bas = mieux) et `credits` (crédits gagnés au total).
- **Pas de défi du jour** (proposition).

## 15. Durée et équilibrage (cibles)
- Étage 1 : ~30 min ; étage 2 : ~1 h ; étage 3 : ~1 h 30 ; étage 4 et fin : ~1 h. Total 3 à 5 h.
- Chaque achat doit arriver après **1 à 3 sorties** au début, puis s'espacer doucement ; jamais plus de ~10 min sans nouvel achat.
- Le **simulateur** joue des parties automatiques (sorties types) pour régler prix et rendements.

## 16. Plan de travail (Opus, une conversation par session)
1. **Règles et simulateur** : `regles.js` (minerais, prix, améliorations, classes, usines, recherche, station, drones, étages), `outils/mineurs-simulateur.js`, réglages.
2. **Étage 1 jouable** : vol (repris de la maquette 6), quai, améliorations, usines, recherche, sauvegarde ; `index.html` en banc d'essai.
3. **Station et drones** (étage 2) : construction module par module, énergie, hangar, drones qui travaillent, hors ligne plafonné.
4. **Lune et Mars** (étage 3) : carte du système, voyages, nouvelles ceintures et minerais, bases.
5. **Aliens et défense** (étage 4) : vagues, flotte composée, satellites, vaisseau-mère, fin et mode libre.
6. **Finitions** : sons, titre, pause, classements, accueil (cartouche, volet), transfert, crédits, tests, artefact.

## 17. Questions pour l'utilisateur
1. Le **nom** : « Mineurs d'étoiles » (nom de travail) te va ?
2. Les **dangers** de l'étage 1 (roches rapides qui abîment la coque) : oui, ou minage sans aucun danger jusqu'aux aliens ?
3. Les **drones hors ligne** (plafonnés à 2 h) : oui ou non ?
4. L'**énergie** de la station (assez d'ailes solaires pour faire tourner les modules) : bonne contrainte ou trop de gestion ?
5. Les **classements** proposés (temps pour finir, crédits gagnés) ?
6. La **fin** (vaisseau-mère alien au-delà de Mars) te convient-elle ?

## 18. Historique du chantier

Idée de l'utilisateur du 30/10 : exploration spatiale + gestion + auto battler.

### État
- **DA et boucle validées** (31/10, maquette 6) : corvette du moteur de Nebula en rendu palette, rotation continue, roches qui se brisent, station façon ISS. Prochaine étape : **cahier des charges**.
- DA **différente de Nebula** : pixel art ; planètes du **Pixel Planet Generator** de Deep-Fold (MIT, shaders passés en WebGL 2, calculés en direct), vaisseaux **Void** de Foozle (CC0).
- **Maquette 1** (30/10, `maquettes/mineurs-d-etoiles.html`, https://claude.ai/artifact/P7jTbpdzH6gQkfNn9tW3ro) : l'étage 1 jouable, trois pilotages (A le doigt guide, B inertie, C toucher la cible), galerie des vaisseaux et tableau des packs. Retour (30/10) : « bon premier jet » ; planète plus grosse, **jeu à l'horizontale**, **petit joystick** ; toucher l'astéroïde (C) « pas ouf » ; vaisseau et astéroïdes Void « pas super super ».
- **Maquette 2** (30/10, `maquettes/mineurs-d-etoiles-2.html`, https://claude.ai/artifact/YWhxRWxszBnVFepMEAaR6Q) : écran 640 × 300 à l'horizontale, Terre de 320 px, joystick flottant sous le pouce gauche (pilotage DIRECT ou INERTIE), bouton RENTRER (pilote automatique), panneau à quai à droite avec la Terre à gauche ; deux styles d'astéroïdes : A shader Deep-Fold plus gros, veiné (rouille = fer, éclats dorés = or à 60 %), B astéroïde de Foozle qui se fissure puis éclate ; 13 vaisseaux à faire défiler (DyLESTorm Pixel SHMUP Free, démo Coffee Beans). Retour (30/10) : **A avec l'inertie « vraiment bien »** ; vaisseaux : style chasseur, taille et palette pas assorties à la planète ; astéroïdes : formes molles.
- **Maquette 3** (30/10, `maquettes/mineurs-d-etoiles-3.html`, https://claude.ai/artifact/23ySkiF51xqSeC47LEf8rX) : pilotage à inertie seul ; **vaisseaux et roches tracés pixel par pixel par le code** pour 32 angles (pas d'image pivotée, lumière fixe en haut à gauche, palette des planètes, contour sombre) : trois mineurs (la Pince, la Foreuse, le Cargo, formes agrandies ×1,5, réservoirs, soute et canon visibles à chaque niveau) ; roches à facettes (pyramide aplatie de 7 à 11 facettes, cratères, taches), grises veinées d'or ou brunes rouillées. Retour (30/10) : la boucle fonctionne bien (encore brute), mais vaisseau et astéroïdes **trop en décalage** avec la planète → chercher d'autres packs ; plus besoin de maquette jouable, des images de présentation suffisent.
- **Planche des packs** (30/10, https://claude.ai/artifact/3oN77nAQqpE623SpGsqNhW, **hors dépôt** : images de présentation d'autres auteurs) : la Terre en référence ; vaisseaux : Ravenmore Pixel Space Shooter Assets (5,76 $), Guilnix Shoot 'em Up 16x (3 $), Matt Walkden Space Shooter Pack (5 $) et Free Lunar Battle Pack (CC0, idée pour la Lune), BLEEDx ships with upgrades (0,50 $), PixlWalkr (3,99 $), AteBits SHMUPED 2 (1 $), Wenrexa 468 (0,95 $), ScratchBattles Space Pack ; astéroïdes : VerzatileDev A Bunch of Space Asteroids (1,50 €), RehanDev 300+ (gratuit, .rar), Wenrexa Asteroids (0,28 $), Lazy_Nomad_31 (5 $). Écartés : générateur de vaisseaux de Deep-Fold (pas en pixel art), Hat Tap, Beardy Luke. Mise à jour après la vision « corvette » : section **Corvettes** en tête, avec la collection **Collapse of the Sol Hegemony** de NickyBHobbying (bundle de 7 packs à 10 $, déjà dans les Achats ; corvettes Gallant, Resolute, Messenger, Envoy, Luchnik, Bogatyr, cargos de Merchants and Scoundrels, vaisseau-colonie Pioneer gratuit présenté au-dessus d'une planète de style Deep-Fold) : **recommandée** ; aussi Foozle Void Fleet 2 et 3 (aliens), Starship Mastery (écarté : rendu 3D).
- **Essai du moteur de Nebula** (31/10, demande de l'utilisateur, `maquettes/mineurs-d-etoiles-corvettes.html`, https://claude.ai/artifact/9rT9tCYQw1wfCRby1svNqN) : dix corvettes de minage avec `nebula/vaisseaux.js` (builder + render, matières ajoutées : orange, blanc, sarcelle) : Pic, Pelle, Bourdon, Remorqueur, Catamaran, Grue, Escorte, Citerne, Marteau, Prospecteur ; chacune en rendu Nebula et ramenée à une palette courte proche de la planète (couleur la plus proche, éclaircie ×1,35) ; scène à l'échelle (640 × 300) devant la Terre. Retour (31/10) : **Escorte et Prospecteur** plaisent plus que tout ce qui a été trouvé jusqu'ici.
- **Corvettes 2** (31/10, `maquettes/mineurs-d-etoiles-corvettes-2.html`, https://claude.ai/artifact/9Rpjjm7LMTpTXN49E8pVve) : les deux préférées rappelées, puis dix variations : Vigie, Sondeuse, Flèche, Arpenteur, Garde-côte, Carotteuse, Sentinelle, Éclaireur, Faucon, Pionnière (flèche d'Escorte avec caissons et foreuse du Prospecteur). Retour (31/10) : **rendu « palette » retenu** (moteur de Nebula ramené à la palette de la planète) ; **améliorations visibles sur la corvette** retenues ; idée de l'utilisateur : une **station spatiale** qui débloque d'autres **classes de vaisseau** pour le joueur.
- **Maquette 4** (31/10, `maquettes/mineurs-d-etoiles-4.html`, https://claude.ai/artifact/AHUgUHHt5jYZMWf1b51TSY) : corvette fabriquée avec le moteur de Nebula, **géométrie tournée avant l'éclairage** (32 angles, lumière fixe), ramenée à la palette ; quatre classes : Éclaireur (départ, 1 tourelle, soute 4, 34 s), Prospecteur (150 CR, 2 tourelles, soute 6, 40 s), Pionnière (400 CR, 3 à 4 tourelles, soute 8, 50 s), Escorte (700 CR, 3 à 4 tourelles, dégâts ×2, soute 3) ; améliorations visibles : réservoir = paires de cuves blanches (+10 s), soute = conteneurs (+2 cases), canon = dégâts +1, canons allongés puis doublés, une tourelle de plus au niveau 2 ; **tourelles** qui pivotent (5 rad/s) et tirent seules (0,45 s) ; corvette plus lente (poussée 110, vitesse max 150, virage 2,4 rad/s) ; **roches** du même moteur (polygone déchiqueté en relief, éclats, cratères, 16 angles, veines dorées ou rouillées) : grosses (7 PV) → 2 à 4 moyennes (3 PV) → 2 à 4 petites (1 PV) qui lâchent le minerai ; panneau à quai à deux onglets AMELIORER / STATION, bouton « +300 CR (essai) ». Préparation des images : environ 2 s sur ordinateur. Retour (31/10) : rotation **saccadée** ; coques trop plates aux premiers niveaux (« gros rectangle gris ») ; personnaliser le moteur pour des **parties de station** et des **drones**.
- **Maquette 5** (31/10, `maquettes/mineurs-d-etoiles-5.html`, https://claude.ai/artifact/WyTW9XKF8NnTFgSUsY7HBL) : **64 angles** pour la corvette et les tourelles (24 pour les roches), tracés **à la demande** (premier affichage de chaque angle ; prêt en 0,8 s au lieu de 3,6 s) ; **relief** sur chaque classe : rainures de plaques creusées dans la carte de hauteurs et qui tournent avec la coque (`rainure` ajoutée au constructeur tourné), arête centrale, bloc moteur, aérations, hublots éclairés ; **station** : modules Noyau (anneau), Habitat, Panneau solaire, Hangar, Raffinerie, Antenne, Quai, reliés par des bras, station en 3 stades et scène devant la Terre ; **drones** : mineur, cargo, défense, satellite, réparateur. Retour (31/10) : « pas mal » ; question : pourquoi ne pas simplement tourner le sprite ? Réponse : un sprite tourné à n'importe quel angle déforme les pixels et fait tourner la lumière avec le vaisseau ; station voulue **façon ISS**.
- **Maquette 6** (31/10, `maquettes/mineurs-d-etoiles-6.html`, https://claude.ai/artifact/1d3pKCvcRP2wrsoBhQo8Xw) : **rotation continue** = angle tracé le plus proche (64) puis le petit reste (moins de 3°) tourné à l'affichage, pour la corvette et les tourelles ; **station façon ISS** : poutre en treillis, ailes solaires par paires, radiateurs, modules cylindriques en croix ; 3 stades (un module et une paire d'ailes ; poutre, deux paires et radiateurs ; ISS complète à quatre paires) ; modules Aile solaire, Poutre, Module, Radiateur ajoutés à la planche. **Validée** (31/10 : « là on tient quelque chose, c'est vraiment pas mal »). Prochaine étape : cahier des charges.

### L'idée
Départ en orbite terrestre : un petit vaisseau (carburant et soute limités) casse des astéroïdes au tir et ramasse le minerai (fer, rarement or ; un minerai = une case de soute), qu'il faut ramener sur Terre avant la panne sèche. Le minerai devient de l'argent : usines (meilleur prix), centre spatial et recherche (carburant, soute, puissance de tir, plus de minerai par astéroïde, nouveaux minerais). Puis station spatiale et vaisseaux de minage autonomes ; on va plus loin (Lune, Mars…) avec des bases ; vaisseaux de guerre et drones qui patrouillent autour des bases contre les aliens.

### Décisions (30/10)
- Construire par **étages** (proposé) : 1 la Terre et sa ceinture (minage, retour, usines, recherches) ; 2 station et mineurs autonomes ; 3 Lune et Mars, bases ; 4 aliens, vaisseaux de guerre, drones. Pas de vraie physique orbitale (l'orbite est un décor). Prévoir une vraie fin.
- **Combat** (choix de l'utilisateur) : le joueur **défend lui-même** avec son vaisseau, et **compose la flotte** qui défend chaque planète ; des **satellites** préviennent la flotte d'une attaque et la font venir plus vite.
- **Vision précisée (30/10)** : le joueur ne pilote pas un chasseur monoplace mais une **corvette** : plus grosse, **déplacements plus lents** (inertie plus lourde), tourelles qui tirent seules. Les **gros astéroïdes se brisent en 2 à 4 petits** (qui se brisent à leur tour), seuls les petits lâchent le minerai.
- **Vaisseaux (31/10)** : moteur de Nebula (`nebula/vaisseaux.js`) en rendu **palette** ; la corvette se construit pièce par pièce et **les améliorations se voient** (caissons, soute, tourelles) ; la **station spatiale** débloque de nouvelles **classes** de corvette (piste : Éclaireur → Prospecteur → Pionnière, ou une lignée Escorte) ; mineurs autonomes et escorte de défense sortent du même chantier.
- Pilotage : **joystick + inertie** (maquette 2, choisi le 30/10), écran à l'horizontale, bouton RENTRER.

### Vaisseaux proposés (itch.io, 30/10)
- **Void** de Foozle (CC0, prix libre) : vaisseau du joueur en 4 moteurs, 4 armes, 4 boucliers, 4 états de dégâts (les améliorations se voient) ; Fleet Packs Kla'ed, Nairan, Nautolan (8 vaisseaux animés chacun) pour les aliens. Retenu pour la maquette.
- Wenrexa, Sprites Spaceships Pack [+468] (0,95 $, CC0) : un modèle par mineur, cargo, drone.
- Pixels by Skab, Spaceships Assembler (1 $) : vaisseaux à assembler, pour composer sa flotte.
- DyLESTorm, Pixel Spaceships Lite (gratuit) / Pixel Enemies (4,99 $).
- Deep-Fold, Pixel Space Background Generator (MIT) : fonds d'espace.
- Écartés : CarlyDraws Spaceships Vol. 1 (licence jeux de rôle sur table), Cuxrie Essentials Kit.

### Maquette 1 : réglages
Terre 150 px (shader terre + nuages), quai à 101 px du centre, ceinture de 190 à 460, orbite limite 640, Lune à 860 (visible, inaccessible). 26 astéroïdes de 30 à 58 px (1 PV par 14 px), 1 à 3 minerais, or 10 %. Fer 4 CR, or 25 CR. Carburant 30 s (+12 par niveau ; en B : 0,55/s en glissant, 1,6/s en poussant), soute 5 (+2), canon 1 (+1). Panne sèche : remorqué, moitié de la soute perdue. Les niveaux changent le moteur (réservoir) et l'arme (canon) du vaisseau.

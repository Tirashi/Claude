# Stratégie en temps réel dans l'univers de Ciel de guerre (chantier ouvert le 20/11, nom à trouver)

Idée de l'utilisateur du 20/11 : un jeu de stratégie en temps réel pensé **d'abord pour le PC** (souris : sélection au cadre, ordres au clic droit, raccourcis clavier), avec les graphismes et les vaisseaux de [Ciel de guerre](ciel-de-guerre.md) : les 35 chasseurs en 4 familles, corvettes et frégates, destroyers et croiseurs, archipel en 3D low poly, ambiances (crépuscule, nuit, orage, désert, neige). **À voir : l'adapter au téléphone** (sélection au doigt, groupes en boutons, ordres simplifiés, caméra au pincement).

Voisins à ne pas répéter : Ciel de guerre (combat vu de derrière l'appareil), Bastion (RTS et tower defense au sol), Armada (survivor spatial), Défense orbitale.

## Décisions de l'utilisateur (20/11)
- **Base du joueur : un porte-vaisseaux mobile.** Il fabrique les escadrilles et se déplace ; le perdre fait perdre la partie.
- **Rythme : les trois formes, en commençant par la première.**
  1. **Escarmouches à étoiles** : missions de 10 à 15 minutes contre une IA, débloquées une à une, comme dans Ciel de guerre. **C'est la première étape.**
  2. Ensuite une **campagne** sur la carte de l'archipel, île par île, avec une flotte qu'on garde d'une bataille à l'autre.
  3. Enfin une **partie libre** (ennemi à détruire, sans scénario).
- **Ressources : une seule au départ**, récoltée sur les îles, mais le code ne doit pas fermer la porte à une deuxième plus tard. Prévoir un tableau de ressources plutôt qu'un seul nombre.
- **Maquette** : 2 ou 3 directions qui varient **à la fois la caméra et l'interface**.

## Pistes à creuser (brainstorm)
- Îles à tenir : chaque île prise rapporte la ressource ; un avant-poste s'y pose.
- Escadrilles à composer depuis le porte-vaisseaux ; grands vaisseaux à protéger.
- Reprendre de Ciel de guerre : les modèles (`ciel-de-guerre/modeles/`), les ambiances (`AMBS`), le rendu (image interne réduite, contour d'1 px, tramage), les sons.

## Maquette 1 (20/11) : https://claude.ai/artifact/CS2t1YEqkqfjtzGnUhgy5A
Source `maquettes/strategie-ciel-source.html` (lit `../lib/` et `../ciel-de-guerre/modeles/`) ; copie autonome `maquettes/strategie-ciel.html` fabriquée par `python3 outils/strategie-ciel/fabriquer.py` (Three.js, GLTFLoader et 7 modèles en base64, 2,2 Mo). La même bataille animée (porte-vaisseaux Aurore = croiseur bleu grossi, 2 destroyers, 3 escadrilles contre destroyer, frégates, corvettes et 2 escadrilles rouges ; archipel de 5 îles nommées, cristaux, anneaux de prise), avec bascules PC / téléphone et crépuscule / nuit / désert :
- **A · État-major** : vue de haut ; interface classique (ressources, mini-carte, barre des groupes 1 à 4, panneau de la sélection et ses ordres, chantier du porte-vaisseaux) ; téléphone : groupes à gauche, ordres à droite.
- **B · Carte vivante** : vue de biais ; tout sur la carte (étiquettes et points de vie, anneaux des îles, ordre en pointillés, chantier en menu autour du porte-vaisseaux), dans l'esprit de Bastion B.
- **C · Passerelle** : vue basse derrière le porte-vaisseaux ; une carte par escadrille en bas, ordres sur la carte tactique.
Chasseurs grossis (15 m au lieu de 4) pour rester lisibles.

## Retours sur la maquette 1 (20/11) et maquette 2 (même lien, version 2)
- **Caméra A choisie** comme caméra par défaut, mais **libre** : zoom, rotation, etc. Maquette 2 : molette ou pincement = zoom (420 à 2 400 m), clic droit glissé ou deux doigts = pivoter (et incliner un peu), glisser = déplacer (dans le jeu, le clic gauche glissé fera le cadre de sélection ; déplacement aux bords et aux flèches), boutons + − ⟲ N. L'inclinaison suit le zoom (36° de près, 66° de loin) : de près on retrouve l'allure de B.
- **Plus de netteté** : rendu à la pleine résolution de l'écran, anticrénelage, lumière ambiante en plus (les coques étaient trop sombres). Bascule NET / PIXEL pour comparer ; NET par défaut.
- **Niveaux dans l'espace** avec **champs d'astéroïdes** : ambiance ESPACE (fond d'étoiles et de nébuleuses, 520 astéroïdes, gros astéroïdes à la place des îles, gisements dessus ; pas de sol : ni ombres ni tiges sous les marqueurs).
- **Porte-vaisseaux géant et très lent** (330 m, presque immobile) qui fabrique tout.
- **Collecteurs** : 3 vaisseaux (polyyai 5 en bleu) font la navette porte-vaisseaux → gisement, minent au rayon, reviennent. Chantier : COLLECTEUR 30◆ (T), bouton ARSENAL (U) pour l'arbre d'améliorations.

## Propositions en attente de réponse (20/11)
- **Économie** : les collecteurs minent les gisements (îles ou astéroïdes) et rapportent au porte-vaisseaux ; une île prise ou un avant-poste posé près d'un gisement raccourcit la navette. Les collecteurs sont la cible naturelle des raids ennemis.
- **Arbre d'améliorations en deux étages** :
  1. **Entre les missions** (permanent, payé en étoiles ou en solde comme dans Ciel de guerre) : trois branches, CHASSEURS (blindage, missiles, nouvelles familles des 35 chasseurs), NAVIRES (frégates, destroyers, croiseurs à débloquer, tourelles), PORTE-VAISSEAUX (vitesse du chantier, blindage, collecteurs plus rapides, deuxième file de production).
  2. **Pendant la partie** (payé en cristal, perdu à la fin) : quelques modules du porte-vaisseaux, comme dans un jeu de stratégie classique.

## Retours du 20/11 et maquette 3 (même lien, version 3)
- **Deux étages d'améliorations : oui.** L'escarmouche se joue **comme Age of Empires** : le porte-vaisseaux est le centre-ville, les collecteurs sont les villageois (ils minent et posent les stations), et **3 âges** (choix de l'utilisateur) débloquent vaisseaux, stations et améliorations :
  - **I · Avant-poste** (au départ) : collecteur, chasseur ; raffinerie (dépôt près d'un gisement), tourelle ; collecte +20 %, blindage I.
  - **II · Flotte** (500◆ + 1 raffinerie) : bombardier (corvette), frégate ; station orbitale (prend une planète riche), chantier naval (deuxième file) ; missiles, boucliers I.
  - **III · Armada** (1 200◆ + 1 station orbitale) : destroyer, croiseur ; forteresse (bouclier de zone), canon orbital ; boucliers II, saut du porte-vaisseaux.
  - Entre les missions : les étoiles débloquent les modèles (35 chasseurs, corvettes, frégates…) et des bonus de départ.
  - (Contenu proposé, à valider.)
- **Peut-être entièrement dans l'espace**, carte plus grande, avec des **planètes** comme dans Mineur de l'espace. **Rôle des planètes : gisements riches** (choix de l'utilisateur) ; une station orbitale les prend ; les astéroïdes restent les gisements de départ.
- **Style des planètes** : comparer les planètes de Mineur et des packs trouvés. Maquette 3 : espace par défaut (archipel gardé pour comparer), carte de ±2 500 m (zoom jusqu'à 4 200 m), 6 planètes (Gaia bleue avec station, Brasier rouge avec station, Borea et Dune riches, Titan géante à anneaux, Echo), 1 100 astéroïdes, stations en orbite faites dans le code, étiquettes des planètes, âge dans l'en-tête et le chantier (vaisseaux d'âge II grisés, bouton AGE II), onglet **ARBRE DES AGES**. Trois styles :
  - **PIXEL 3D** : « 3D Pixel Planet Pack 0001 » d'AstroJar (CC0) ;
  - **LOW POLY** : « Low Poly Planets Pack » de Heck (CC0, système solaire en photo) ;
  - **MINEUR** : les shaders de Deep-Fold de `mineur-de-l-espace/planetes.js` (seulement terre, lune et mars), en image plate face à la caméra.
  - Conversion : `python3 -I outils/strategie-ciel/planetes.py <PixelPlanet1_TOON> <LowPolyPlanetsPack/OBJ>` → `maquettes/strategie-ciel-planetes.js` (761 Ko ; un maillage par pack, 6 textures chacun). Crédits ajoutés.

## Retours du 20/11 : façon Stellaris, maquette 4 (même lien, version 4)
- La carte restait trop petite. **Décision : façon Stellaris** (choix de l'utilisateur) : une seule grande partie **en temps réel avec pause**, deux vues :
  - **galaxie** : des systèmes solaires reliés par des **routes spatiales** ; territoires ; on voit arriver l'adversaire le long des routes ;
  - **système** : la vue de la maquette 3, agrandie : étoile au centre, planètes en orbite, on **colonise les planètes avec des bâtiments**, on surveille l'arrivée de l'ennemi par les **portes** des routes.
  - Ce qui reste des décisions d'avant : porte-vaisseaux géant et lent qui fabrique tout, collecteurs, une ressource (porte ouverte), 3 âges (à revoir dans une partie longue : âges ou recherche ?), caméra libre.
- **Planètes animées** : l'utilisateur hésite ; comparer les deux styles animés.
- Maquette 4 :
  - onglet **GALAXIE** (dessin 2D) : 22 systèmes en spirale, routes (arbre couvrant + liens proches), empire bleu autour de SOL-7, empire rouge autour d'OMEGA, systèmes lointains inconnus, flotte rouge qui suit les routes vers ALTAIR, fond de galaxie (shader Galaxy), étoiles animées teintées ; clic = volet du système, double clic ou ENTRER = vue du système ;
  - onglet **SYSTEME** : étoile SOL-7 au centre (lumière depuis l'étoile), 6 planètes en orbite lente (GAIA colonie, BRASIER, DUNE et BOREA riches, TITAN géante à anneaux et sa lune ECHO), orbites tracées, ceinture d'astéroïdes où se joue la bataille, deux portes (ALTAIR en alerte, CASTOR) ; volet de GAIA à 6 emplacements de bâtiments ; mini-carte du système ;
  - **pause et trois vitesses** (❚❚ ▶ ▶▶ ▶▶▶), date qui avance ; alerte de la flotte rouge ;
  - styles de planètes : **DEEP-FOLD** (les 12 sortes du Pixel Planet Generator, converties en WebGL 2 par `outils/strategie-ciel/shaders.py` → `maquettes/strategie-ciel-shaders.js`, dessinées par `maquettes/strategie-ciel-df.js` ; lumière tournée vers l'étoile) ou **PIXEL 3D** (sphères d'AstroJar qui tournent, couche de nuages, halo d'atmosphère) ;
  - archipel, LOW POLY et MINEUR retirés des boutons (le code de l'archipel reste).

## Décisions du 20/11 et maquette 5 (même lien, version 5)
- **Planètes : Deep-Fold** (choix de l'utilisateur). Le style PIXEL 3D est retiré des boutons (les données d'AstroJar et de Heck restent dans `maquettes/strategie-ciel-planetes.js`, plus utilisées par défaut).
- **Performances sur téléphone à améliorer** (demande de l'utilisateur). Maquette 5 :
  - chaque planète n'est redessinée que selon sa taille à l'écran (grande : toutes les 0,08 s ; moyenne : 0,2 s ; petite : 0,5 s ; hors de l'écran : jamais) ; en pause, seulement si la lumière change (caméra qui bouge) ;
  - 64 pixels par planète au lieu de 100 sur écran tactile (`DF_PX`) ;
  - galaxie : fond et étoiles redessinés toutes les 0,15 s au lieu de chaque image ;
  - compteur en bas du cadre : IPS (images par seconde), planètes redessinées par seconde, pixels par planète. **À essayer sur le téléphone** (le rendu logiciel de l'environnement de Claude ne donne pas de vrai chiffre).
  - Pistes suivantes si ça ne suffit pas : rendre les couches directement dans une texture WebGL (sans passer par un canvas 2D), un seul contexte WebGL pour tout, moins d'astéroïdes, image interne réduite.
- **Recherche continue à la place des âges** (choix de l'utilisateur). Proposition dans l'onglet RECHERCHE : trois domaines (VAISSEAUX, COLONIES, ARMEMENT) qui avancent en même temps, chacun avec un projet en cours ; les points viennent des laboratoires des colonies et des stations (+34 par mois dans la maquette) ; quand un projet finit, on choisit le suivant parmi **trois cartes tirées au hasard** (comme Stellaris) ; les anomalies et épaves de la galaxie en ajoutent. Le chantier montre « RECHERCHE » sur les vaisseaux pas encore trouvés ; le volet de GAIA a un emplacement LABO. À valider.

## Session 1 (20/11) : SOL-7 jouable, fait
Décisions avant la session : **nom provisoire** (dossier `strategie-ciel/`), **découpage validé** : session 1 un système jouable ; session 2 colonies, bâtiments et recherche continue ; session 3 galaxie (plusieurs systèmes, routes, empire rouge) et sauvegarde ; session 4 sons, équilibrage, performances.
- **Le système SOL-7** (`monde.js`) : l'étoile au centre (Deep-Fold teintée en jaune), 6 planètes Deep-Fold en orbite lente (GAIA, colonie avec sa station ; DUNE et BOREA riches ; TITAN et sa lune ECHO ; BRASIER), orbites tracées, ceinture d'astéroïdes (1 400 cailloux, 900 au doigt), **8 gisements de cristal** de 1 500 chacun (les cristaux rapetissent), portes d'ALTAIR (en alerte) et de CASTOR.
- **Unités** (`unites.js`, `TYPES`) : porte-vaisseaux AURORE (3 000 PV, 6 m/s, tire, fabrique, reçoit le cristal ; sa perte = défaite) ; COLLECTEUR 30◆ (charge 20, mine 5/s, rapporte à AURORE, repart seul au gisement le plus proche) ; CHASSEUR 40◆ (tourne autour de sa cible) ; BOMBARDIER 80◆ (×2,6 contre les gros) ; DESTROYER 220◆. Départ : 300◆, AURORE, 2 collecteurs, 4 chasseurs, 1 destroyer. Ennemis : chasseurs rouges, corvettes (contre les gros), frégates, destroyer rouge.
- **8 vagues** par la porte d'ALTAIR : la première à 2:00, puis toutes les 1:40 ; elles foncent sur AURORE et attaquent ce qu'elles croisent. Victoire quand la 8e est détruite. Essais (joueur automatique) : un joueur qui produit gagne avec AURORE à environ 2 000 PV ; un joueur qui ne fait rien perd. Le réglage fin est pour la session 4.
- **Commandes** (`interface.js`) : souris (clic, cadre, double clic = même type, clic droit = aller / attaquer / miner, clic droit glissé = pivoter, molette, bords et flèches), clavier (espace, 1 à 5, H, Q W E T, S, Échap), doigts (toucher = choisir puis ordonner, un doigt = carte, deux = zoom et rotation, bouton CADRE). Groupes FLOTTE, CHASS., BOMB., DESTR., COLL., AURORE. Mini-carte du système (toucher = y aller, clic droit = ordre).
- **Pause et 3 vitesses** (les ordres se donnent en pause) ; combat en pas fixes de 0,034 s. Menu ☰ (REPRENDRE, RECOMMENCER, LUDOTHEQUE). Fin de partie : vagues tenues, ennemis détruits, pertes, cristal miné. Record `strategieciel.record` (vagues, victoires ; transfert dans la fiche). Pas de classement (démo).
- Accueil : fiche, icône, journal ; `sw.js` v117 ; crédits (Deep-Fold, craftpix, polyyai) ; test de fumée. Artefact : le jeu a remplacé la maquette au même lien (versions 1 à 5 = maquettes).

## Retours du 20/11 sur la session 1 (corrigés le même jour)
- **Défilement à l'envers** au bord de l'écran et aux flèches (souris à gauche → la vue partait à droite) : corrigé (`majClavier` : `deplacer()` suit un doigt qui tire la carte, il faut le sens inverse).
- **Tutoriel guidé** (demande de l'utilisateur) : 9 étapes (Aurore, la vue, choisir, ordonner, le chantier, le cristal, la pause, les vitesses, la flotte rouge), chacune validée par l'action demandée, le bouton à toucher clignote ; les vagues attendent la fin du tuto. Lancé tout seul à la première partie (`strategieciel.tuto`), bouton TUTORIEL sur l'écran titre, PASSER LE TUTO à tout moment.
- **Modèles bien différents** (demande de l'utilisateur, planche des 35 polyyai et des corvettes vue de dessus) : collecteur = polyyai 16 (cargo carré à moteurs latéraux, 26 m), chasseur = polyyai 2 (flèche fine, 14 m), bombardier = polyyai 35 (large et massif, 34 m).
- **Tourelles qui pivotent** (demande du 20/11) : le catalogue de Ciel de guerre (`ciel-de-guerre/catalogue.js`, chargé par la page) découpe les tourelles des grands vaisseaux (`decoupe`, comme dans Ciel de guerre) : AURORE 3, destroyer bleu 2, destroyer rouge 6 (frégates et corvettes n'en ont pas). Chaque tourelle choisit sa cible (celle du vaisseau si elle est à portée, sinon l'ennemi le plus proche), pivote (1,6 rad/s) et tire de son canon quand elle est alignée ; la cadence est partagée entre les tourelles (dégâts par seconde inchangés).
- **Flammes des réacteurs** : trois cônes en mélange additif, un point chaud et une lueur (repris de Ciel de guerre), posés sur les tuyères repérées dans chaque modèle (`tuyeres`, calculées une fois par modèle) ; bleues pour nous, orangées pour l'ennemi ; plus longues quand le vaisseau va vite, elles vacillent.
- Départ d'AURORE un peu décalé (la station de GAIA la traversait).
- **Touches 1 à 5 en AZERTY** (retour du 20/11 : « 2 » ne choisissait pas les chasseurs, il fallait Maj + 2) : les groupes se lisent sur la touche physique (`e.code` : `Digit1`… et le pavé numérique) ; un double appui centre la vue sur le groupe (au lieu de Maj).
- **Groupes personnels** (demande du 20/11) : Maj + une lettre de la première ligne (A Z E R T Y U I O P en AZERTY ; touche physique, noms lus dans la disposition du clavier si le navigateur la donne) garde la sélection, la lettre seule la rappelle, deux fois de suite : la vue y va. Puces des groupes au-dessus de la barre des groupes ; bouton + GROUPE (utile au doigt). La production passe sur la ligne du bas : W X C V (collecteur, chasseur, bombardier, destroyer).
- **AURORE plus grosse** (470 m au lieu de 330) et **hologramme du chantier** (demande du 20/11, façon Supreme Commander) : le vaisseau en cours se dessine en bleu translucide (plein + fil de fer) entre les fourches de l'avant, de l'arrière vers l'avant (plan de coupe qui avance avec la production, ligne lumineuse du « laser »), puis éclair et le vrai vaisseau apparaît là et sort vers l'avant.
- Équilibrage : les tourelles visant chacune l'ennemi le plus proche, la 8e vague (destroyer rouge à 6 tourelles) décimait les chasseurs ; dégâts des grands vaisseaux contre les petits ×0,4 (au lieu de 0,55) et destroyer rouge 15 par tir (au lieu de 18) : le joueur automatique regagne 3 fois sur 3.
- **Réacteurs d'AURORE** (retour du 20/11) : la détection automatique ne trouvait qu'une tuyère ; positions relevées à la main (`TUY_MAIN` dans `monde.js`) : trois de chaque côté et une au centre, plus grande.
- **Point de ralliement** (demande du 20/11) : bouton ⚑ RALLIEMENT du chantier (ou touche B), puis un clic ou un toucher pose un fanion ; les nouveaux vaisseaux s'y rendent (les collecteurs vont miner), ✕ le retire.
- **Équilibrage** (demande du 20/11) : destroyers plus rapides (22 m/s au lieu de 15), chasseurs plus résistants (60 PV au lieu de 45). Joueur automatique : 2 victoires sur 2 ; joueur passif : défaite.
- **Nouvelle station** (« elle dénote avec le reste ») : modèle de « Space Stations » de Viktor Hahn (CC BY 4.0, station06 : roue grise aux lumières bleues), converti par `outils/strategie-ciel/stations.py` dans `strategie-ciel/stations.js` (349 Ko, textures 512 px) ; l'ancienne, faite dans le code, reste en secours. Le kit de Kenney (intérieurs) et le pack de whynomakethings (sans station, sans licence) ont été écartés.

## Interface : maquette du 20/11 (https://claude.ai/artifact/3qGuYnokCt3hUXBzH9J6vz)
Retour de l'utilisateur : interface mobile trop chargée, boutons à moitié cachés (AURORE) ; s'inspirer de l'existant, polices et interface plus fines pour rétrécir ; l'interface PC peut changer aussi.
Maquette `maquettes/strategie-ciel-ui.html` (source `-source.html`, captures du jeu `-fond-tel.jpg` et `-fond-pc.jpg`) : polices Rajdhani (texte), Share Tech Mono (chiffres), Michroma (titres), icônes de vaisseaux au lieu des mots, barre du haut fine (cristal, flotte, vague, vitesses, jour, menu). Trois directions, bascule téléphone / PC et sélection (chasseurs ou AURORE) :
- **A · barre de commande** (StarCraft, Command & Conquer) : mini-carte en bas à gauche, onglets des groupes, sélection au centre, grille de commandes 3 × 2 à droite qui devient le chantier quand AURORE est choisie.
- **B · tiroirs** (Rusted Warfare, Mindustry) : groupes en boutons ronds à gauche, bulle d'ordres sous la sélection, chantier dans un tiroir à droite (bouton AURORE), mini-carte derrière un bouton.
- **C · liste de flotte** (Sins of a Solar Empire, Stellaris) : liste à droite (groupes avec nombre, vie, ordre ; AURORE se déplie en chantier), repliable en colonne d'icônes ; ordres en bas.
En attente du choix de l'utilisateur.

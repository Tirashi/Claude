# Cahier des charges — TERRES FRANCHES

> Nom choisi le 08/11 (nom de travail du cahier : « Terres d'Éveil »).

> Cahier des charges de l'utilisateur reçu le 08/11/2026 (recopié tel quel plus bas, § « Cahier reçu »). Avant lui : les **adaptations à la Ludothèque** et l'état du chantier.
> Dossier prévu : `terres-franches/`. Modèle conseillé : Opus pour le moteur (économie, agents, prestige), opusplan pour les sessions de contenu.

## 1. État du chantier
- **08/11 — maquette 1** : https://claude.ai/artifact/HGXY4qdbJLhXCgGw3bJiJ7 — source `maquettes/terres-d-eveil.html` (images en `@@nom@@`), page fabriquée par `python3 outils/terres-maquette/fabriquer.py <sortie>` (met en base64 les images Tiny Swords de `bastion/img/` ; la page fabriquée ne va pas dans le dépôt). Jouable : le pionnier seul (toucher arbres, buissons, eau = +1), accueillir des villageois (vivres + bois, coût ×1,2), métiers bûcheron / cueilleur / pêcheur avec + et − (aller, travailler, rapporter au feu, « +3 » qui s'envole), manger (baies et poisson ; les deux = moral 110 %, faim = tout ralentit), cabanes (+3 places, chantier de 20 s), paliers campement → hameau (3) → village (8, tour de guet), jour et nuit (90 s), bouton ×10. Trois directions :
  - **A · Tiny Swords** : le pack déjà acheté pour Bastion (villageois animés hache / couteau / fagot / viande, moutons, maisons, chantier, tour) ; eau, écume, pontons et tente dessinés par le code ; feu et fenêtres allumés la nuit ; panneau de bois à onglets VILLAGEOIS / CONSTRUIRE.
  - **B · 16 bits de la Ludothèque** : tout dessiné par le code en gros pixels (toile 160 × 200 agrandie ×2), Press Start 2P, villageois colorés selon le métier, liste d'incrémental classique.
  - **C · Le carnet de la vallée** : carte à l'encre et à l'aquarelle sur parchemin (toponymes, rose des vents), personnages au trait, la partie racontée dans une **chronique** (« Jour 3 : Berthe se fait cueilleur »).
  - **À choisir** (et retours sur le rythme, l'écran en portrait, le panneau du bas).
- **Retour sur la maquette 1 (08/11)** : la direction **A (Tiny Swords)** plaît, mais crainte de **manquer de bâtiments** : la finalité est de **construire et d'aménager un grand territoire**. **Pas de classement** (rien d'évident à comparer entre joueurs). Des noms sont demandés (§ 3).
- Inventaire : Tiny Swords n'a que **7 sortes de bâtiments** (maisons 1 à 3, tour, caserne, archerie, château, monastère), en 5 couleurs, plus la mine d'or et la maison et la tour en bois des gobelins (ancienne version) : ni moulin, ni ferme, ni marché, ni forge. Le **lot Cute SCKR** déjà acheté (668 packs, `api.itch.io/profile/owned-keys`, fichiers `.rar` à ouvrir avec `unar`) a tout : *Medieval Village* (≈ 30 maisons en chaume, colombages ou pierre, granges, écuries, 4 moulins, meules, puits, 2 églises), *Medieval Buildings* (mairie, halle, guildes, auberge, étals, forge, remparts et portes, lanternes), *Medieval Farm* (champs de blé à plusieurs stades, potagers, clôtures, outils), *Large Forest* (arbres, jeunes pousses, souches) ; et plus loin *Medieval Blacksmith*, *Arcane Library*, *Medieval Alchemist Laboratory*, *Crystal Mine*, *Orchard and Vineyard*, *Medieval Harbour*… Images de 48 px (format RPG Maker), licence « usage dans un jeu, pas de revente ni de redistribution » ; l'auteur les signale **assistées par IA**.
- **08/11 — maquette 2, le grand territoire** : https://claude.ai/artifact/WE1dTX3PUzYUnq7gBXCzGL — page source `outils/terres-maquette/source-2.html`, fabriquée par `python3 -I outils/terres-maquette/fabriquer-2.py <Free Pack> <dossier SCKR> <sortie> [planche.png]` (découpes listées dans le script ; les packs ne sont pas dans le dépôt). Une vallée de 40 × 46 cases (forêt, rivière et pont, mer, carrière, enclos), à trois étapes (**campement** 3 habitants, **village** 20, **bourg** 48 avec mairie, église, auberge, forge, marché pavé, remparts bas, deuxième moulin), glisser au doigt, zoom, nuit, piquets = terrains libres, bouton BATIMENTS (catalogue). Deux directions avec les mêmes villageois Tiny Swords :
  - **A · Tiny Swords, complété** : sol, eau, arbres et maisons Tiny Swords (château = mairie, monastère = église, tour, caserne = grange) ; le reste vient de Cute SCKR.
  - **B · Tout Cute SCKR** : sol, arbres et bâtiments Cute SCKR ; les maisons changent avec le palier (chaume → colombages et pierre).
  - **À choisir.**
- **Choix (08/11)** : **direction B, tout Cute SCKR** (« tout est dans la même DA, et les petits personnages de Tiny Swords ne jurent pas trop »). Nom : **Terres franches**. Demande : des villageois **plus variés**, et des images pour l'**interface** et les **icônes des ressources**.
- **Recherche des villageois (08/11)** : les packs payants regardés ont peu de variété ou peu d'animations de travail (8 NPC Pack de Tiny Questers 5,99 $ : marche et repos seulement ; Medieval Citizens de hnnnnnnn 6 $ : 3 personnages ; Villager de sanctumpixel 4,20 $ : hache, pioche, ferme, construction, 6 couleurs, mais un style réaliste sans contour ; Mana Seed NPC Packs 10 $ : 10 personnages ; Minifantasy Crafting : 8 × 8 px, trop petit). **Retenu pour la maquette : LPC** (*Universal LPC Spritesheet Character Generator*, dépôt public LiberatedPixelCup, CC-BY-SA 3.0 / GPL 3.0 / OGA-BY selon les calques, auteurs dans son `CREDITS.csv`) : gratuit, des centaines de têtes, coiffures, habits, tabliers, chapeaux et couleurs de peau (palettes), animations marche, repos, coup (hache, pioche, marteau avec les calques d'outils), poussée (houe, pelle, arrosoir), canne à pêche, assis… ; même échelle que les tuiles de 48 px. Composés par `outils/terres-maquette/lpc-villageois.py <dépôt LPC> <sortie> [nombre] [graine]` (clone partiel : `git clone --depth 1 --filter=blob:none --no-checkout` puis `git sparse-checkout` des calques utiles). Licence à suivre : citer chaque auteur des calques utilisés, et les images LPC dérivées restent en CC-BY-SA.
- **Icônes des ressources** : packs du lot Cute SCKR déjà achetés, *Medieval Fantasy Icons Pack*, *Pixel Medieval Fantasy Icon Pack*, *Pixel Food Icon Pack* (grilles de 7 ou 8 icônes sur 1024 px) : pierre, minerai, cristaux, tissu, grimoire, or, laine, sac de farine, pain, viande, poisson, baies, potions, parchemins… ; le bois (tas de bûches) et le blé (gerbe) viennent des feuilles de village et de ferme.
- **Interface** : *Fantasy UI* de ToffeeCraft (version gratuite : pancartes, cadre en bois suspendu, petits boutons +, −, ✓ et ✕, barre ; licence : usage et modification libres, pas de redistribution ni de revente ; un « méga pack » payant existe) ou l'interface de Tiny Swords (déjà dans Bastion). Autres packs repérés : Wood UI V1 de Pixel Vault (3 $), Pixel UI Kit de gegx (assisté par IA), Medieval Age GUI de pzuh.
- **08/11 — maquette 3, villageois et interface** : https://claude.ai/artifact/4XZsL63g4soMJoPrKNerue — page source `outils/terres-maquette/source-3.html` (reprend le code de la vallée de `source-2.html`), fabriquée par `python3 -I outils/terres-maquette/fabriquer-3.py <Free Pack> <dossier SCKR> <dossier icônes> <villageois LPC> <freefantasy.png de ToffeeCraft> <sortie> [planche.png]`. Vallée B au bourg, 24 villageois LPC tirés au hasard (hache ou houe, la récolte au-dessus de la tête au retour ; bouton TS pour revoir Tiny Swords), barre de 6 ressources avec leurs icônes, panneau des métiers (portrait du villageois, icône, + et −), chantier du moulin avec sa jauge. **A** habillage bois et parchemin (ToffeeCraft) ; **B** habillage Tiny Swords. **À choisir.**
- **Choix (08/11)** : **interface Tiny Swords** (B de la maquette 3) ; les villageois LPC plaisent (« ça commence à rendre vraiment bien »). Regret : les arbres, le moulin, les maisons et les champs ne bougent pas.
- **Décors animés (08/11)** : les packs animés trouvés ([arbres de heosphorus](https://heosphorus.itch.io/animated-trees), [Meadow Trees de neivik](https://neivik.itch.io/meadowtrees), [moulin de Szadi Art](https://szadiart.itch.io/rpg-buildings-and-interriors-windmill)…) sont d'un autre style que Cute SCKR. **Choix proposé : animer nous-mêmes les images Cute SCKR par le code**, sans changer de style :
  - **moulin** : `outils/terres-maquette/moulin-anime.py <tile-B-03 de Medieval Village> <sortie> [N] [planche]` découpe une aile du moulin 1 (géométrie mesurée : moyeu (91, 113), bras à −44°, 46°, 140°, −132°, toile du côté angle − 90°), reconstitue la tour derrière les ailes (même colonne 16 ou 32 px plus bas pour les pierres, pixel voisin pour le toit de chaume), puis compose 8 images où les 4 ailes tournent (rotation au plus proche voisin, donc sans flou). Seul le moulin 1 est fait (les autres modèles : mesurer leur géométrie de la même façon) ;
  - **arbres** : dessinés en bandes de 3 px, décalées d'autant plus qu'on monte (le pied ne bouge pas), selon un **vent** qui traverse la vallée en rafales (`vent(x, y, t)`) ; feuilles qui tombent ;
  - **champs** : le blé ondule en bandes de 2 px, une vague claire passe sur les épis, et chaque champ passe par les stades nu → pousses → mûr → blond (les images de *Medieval Farm*) ;
  - **ambiance** : reflets qui bougent sur la mer et la rivière, jet de la fontaine, papillons près des champs, vol d'oiseaux, ombres des nuages ; fumée des cheminées et lumières de la nuit (maquette 2).
- **08/11 — maquette 4, la vallée vivante** : https://claude.ai/artifact/LsfwAW5RYuihKKDiSrbXXe — page source `outils/terres-maquette/source-4.html` (la maquette 3 avec l'interface Tiny Swords seule), fabriquée par `fabriquer-4.py` (mêmes arguments que `fabriquer-3.py`). Bouton ANIM pour tout couper et comparer. **À valider.**
- **Retours sur la maquette 4 (08/11)** : arbres et champs « super » ; à revoir : morceaux du toit qui tournent avec les ailes, l'eau, la fumée pas sur les cheminées, une ligne claire qui traverse les champs (c'était la « vague du vent » : retirée) ; demande d'animaux (oiseaux, poissons, biches, chiens, chats). Les chemins de la maquette 4 étaient dessinés par le code (couleur unie).
- **08/11 — maquette 5, bêtes et cheminées** : https://claude.ai/artifact/3wXMDswHZQJRMTKRFPVmnX — `outils/terres-maquette/source-5.html`, `fabriquer-5.py` (arguments de `fabriquer-3.py` plus le dossier des animaux avant la sortie). Nouveautés :
  - **moulin** : une aile ne garde que la toile claire, son contour et le bras quand elle passe sur le toit (le chaume doré reste au toit) ; restent quelques plaques un peu floues sur les côtés du toit, cachées par les ailes la plupart du temps ;
  - **eau** : texture d'eau du pack (*Medieval Village*, feuille 3, 48 × 48) en deux couches qui glissent en sens contraires, bord sombre, écume en pointillés qui avance le long de la rive, rive de terre ;
  - **chemins et place** : texture de terre battue du pack (*Medieval Village*, feuille 1, 32 × 32 sans herbe) ;
  - **fumée** : seulement sur les vraies cheminées, repérées à la main en pixels de l'image (`CHEMINEES` : chaume3 et 4, colomb1 et 2, pierre2, 3 et 5, forge ; le four fume par sa gueule) ; elle penche avec le vent ;
  - **animaux LPC** (OpenGameArt, licences libres, crédits) : biches et cerf à l'orée (marche, broutent), renard dans la prairie, chiens et chats au village (les chats restent couchés longtemps), poules près de la grange, vaches et cochons dans l'enclos (à la place des moutons Tiny Swords), oiseaux au sol près des champs et en vol, poissons en ombre sous l'eau qui sautent parfois (ronds dans l'eau). Chaque bête se promène dans sa zone (`ZONES`) avec des pauses.
- **Retours sur la maquette 5 (08/11, captures du téléphone)** : à revoir la jonction rivière-mer, la jonction pont-route, des lignes entre les carrés d'herbe, des petits défauts au centre des ailes ; « toutes tes pistes sont super » (autres moulins, saisons, pluie, villageois qui caressent les bêtes, enfants).
- **08/11 — maquette 6, quatre saisons** : https://claude.ai/artifact/SkPnFbK5ySxWhWcHLcT4fv — `outils/terres-maquette/source-6.html`, `fabriquer-6.py` (arguments de `fabriquer-5.py` ; villageois et enfants : `lpc-villageois.py <LPC> <sortie> 24 11 6`, les enfants sont tirés après les adultes pour que les adultes restent les mêmes) :
  - **corrections** : la rivière s'arrête à la côte (avant, elle allait jusqu'au bord de la carte et, dans le chemin de découpe, la zone commune avec la mer s'annulait : rectangle clair) ; le pont est posé là où la route croise la rivière et tourné dans son axe ; l'herbe = un seul carré de *Medieval Village* qui se raccorde sans couture (235, 387), retourné au hasard (le carré d'avant avait une colonne claire sur son bord) ; moulin : les bras près du moyeu sont redessinés à chaque image (l'aile modèle commence à 27 px du moyeu) et le chaume caché par les ailes est recopié depuis la même rangée (le chaume est en couches horizontales) ;
  - **moulins en bois** (modèles 2 à 4, `moulin-anime.py … [modèle]`, géométries mesurées dans `MOULINS`) : **pas encore propres** (les bras ont la couleur du toit ; restes de toile), donc pas utilisés : les deux moulins de la carte restent le moulin de pierre ;
  - **saisons** (bouton SAISON) : images retouchées au pixel une fois par saison (`variante()` : feuillage roux ou doré à l'automne, fleurs roses au printemps, givre et neige sur le haut des arbres, des toits et des bâtiments en hiver), herbe retouchée (`sol()` : fleurs au printemps, dorée à l'automne, neige en hiver ; les chemins et la place gardent leur couleur), champs selon la saison, feuilles qui tombent (rousses à l'automne, pétales au printemps), eau gelée en hiver, papillons au printemps et en été ;
  - **météo** (bouton METEO) : pluie (ciel assombri, gouttes, ronds sur l'eau) ; en hiver, il neige (et quelques flocons même sans le bouton) ;
  - **vie du village** : 6 enfants LPC qui jouent autour de la fontaine, un chien qui suit un bûcheron, une villageoise qui caresse un chat (cœurs).
- **Retours sur la maquette 6 (08/11)** : « c'est vraiment très bien » ; restent la route du sud qui passait sous les champs, la fumée un peu décalée (et le four qui fumait par le haut sans cheminée), un petit morceau de toit qui tournait avec les ailes, et pas d'oiseaux visibles.
- **08/11 — maquette 7, retouches** : https://claude.ai/artifact/BuUxWHgRBp4VoShKw87FvC — `source-7.html`, `fabriquer-7.py` (mêmes arguments) : la route du sud longe les champs (patch de la scène commune dans `fabriquer-7.py`) ; cheminées vérifiées au pixel (haut de la cheminée, en px de l'image) et fumée qui monte droit avant de pencher (dérive en a²), plus de fumée au four ; moulin : l'aile modèle ne prend plus rien sur le toit, et son bout près du moyeu est refait en recopiant la toile 18 px plus loin (toiles rectangulaires nettes) ; oiseaux : deux vols qui traversent l'écran à tour de rôle (rangée 0 vers la droite, 3 vers la gauche) et des oiseaux au sol près des champs et sur la place (oiseau brun : rangées 4 gauche, 7 droite, 5 dos, 6 face), plus petits.
- **Décision (08/11) : le moulin reste immobile** (image d'origine du pack) : malgré plusieurs essais, l'animation des ailes laissait toujours des défauts (« je crois qu'on y arrivera pas avec le moulin »). `moulin-anime.py` est gardé dans `outils/` au cas où un pack proposerait un jour un moulin animé dans ce style. Maquette 7 republiée au même lien.
- **Validation (08/11)** : « la maquette représente globalement le jeu » (maquette 7 : Cute SCKR, villageois et animaux LPC, interface Tiny Swords, décors animés par le code, saisons, météo). Ajustements à prévoir ; **à revoir dans le jeu : l'emplacement des bâtiments et des routes, pour que ce soit plus logique** (dans la maquette, tout est posé à la main autour d'une place ; dans le jeu, les bâtiments se posent sur des terrains et les routes doivent relier ce qui travaille ensemble : champs → moulin → boulangerie, forêt → scierie, carrière → chantiers, port au bord de l'eau).
- **08/11 — placement décidé : le mélange** : le joueur choisit quoi construire, le jeu **propose un emplacement logique** (près de ce qui travaille avec : champ près du moulin, carrière sur le rocher, ponton sur la rive) et trace la route ; le joueur peut **déplacer** le bâtiment.
- **08/11 — simulateur de l'ère 1** : `terres-franches/donnees.js` (toutes les données : ressources, métiers, bâtiments, statuts, besoins, Loi, carte, recrutement, hors ligne) et `terres-franches/regles.js` (règles pures, aussi sous Node, `window.TerresRegles` : `creer`, `pas`, `taux`, `moral`, ordres qui renvoient une erreur ou null, `horsLigne` plafonné à 8 h, `sauver`/`charger`, `robot`) ; `outils/terres-simulateur.js` (dans `verifications.js`) contrôle les règles puis fait jouer le robot. Modèle : villageois comptés par métier ; débit par villageois (marche comprise) ; surexploitation au-delà d'un seuil (5e bûcheron ×0,85…) ; terrain limité (14 parcelles de terre, 2 rochers, 2 rives) ; moral = variété (≥ 6 hab.), vêtements (≥ 12 hab., sinon plus de recrutement), pain (≥ 15 hab.), famine ×0,5. Statuts : campement (5 hab.) → hameau (5 hab., 800 bois, 150 baies, 150 poissons ; 10 hab.) → village (10 hab., 3000 bois, 1200 pierres, 400 pains ; 20 hab.) → Charte du Village (20 hab., 2000 bois, 1200 pierres, 500 pains, 60 vêtements). Recrue : 40 vivres + 20 bois × 1,15^n. **Résultat (profil ACTIF, une touche par seconde les 15 premières minutes)** : 1er villageois 1 min, hameau 19 min, village 1 h 49, 20 habitants 2 h 17, Charte 2 h 43 (cibles du cahier : ~2 min, ~20 min, ~2 h, ère en 2-3 h, Loi 15-30 min après le plafond). Profil SESSIONS (5 min par heure, hors ligne à 100 %) : Charte au bout de 4 h, en 25 min de jeu. Les 14 parcelles sont toutes prises au plafond (le verrou « place » se voit). **À surveiller** : le palier 10 habitants → village dure 1 h 13 (on économise 3000 bois) ; le hors ligne à 100 % est généreux.
- **08/11 — hors ligne** (décision de l'utilisateur) : on gagne bien moins hors ligne, surtout au début : **le quart de la production, 4 h au plus** (`HORS_LIGNE`) ; des **Lois** débloquées par les prestiges l'augmenteront. Profil SESSIONS (5 min par heure) : Charte au bout de 10 h.
- **08/11 — session 1 : l'ère 1 jouable** dans `terres-franches/` (démo sur l'accueil). La première carte est **à peine un campement** : le pionnier, sa tente et un feu dans une clairière, au bord d'une rivière qui finit dans un lac ; forêt au nord et à l'ouest, deux rochers au nord-est. **La vallée** (`carte.js`) est écrite en texte, 24 × 24 cases de 32 px : 14 terrains de 3 × 3 cases (8 autour de la place, 4 de bonne terre au sud-ouest pour les champs, 1 au bord du lac pour le moulin, 1 clairière au nord pour les moutons), 2 rochers (carrières), 2 rives (pontons). **Placement** : chaque bâtiment a ses affinités (`pres` dans `donnees.js` : cabanes et maisons autour du feu, champs sur la bonne terre et entre eux, moulin près des champs et de l'eau sans manger la bonne terre, four entre le moulin et les maisons, bergerie dans la clairière, atelier près des maisons) ; le jeu propose le meilleur terrain libre (il brille, la future rue est en pointillés), le joueur peut en toucher un autre, et **déplacer** plus tard un bâtiment ou un chantier (gratuit). **Rues** : tracées dans l'ordre de construction depuis la porte de chaque bâtiment (au sud, sauf les champs qui s'ouvrent vers le village) jusqu'à la rue ou la place la plus proche ; elles préfèrent les rues existantes et les lignes droites, contournent les terrains, et se rejoignent toutes seules en un réseau ; la place grandit avec le statut (terre battue, pavée au village, puits au hameau, fontaine au village ; la tente disparaît au village). **Villageois** : LPC (24 visages), ils arrivent par le sud-ouest, vont à leur poste (lisière pour les bûcherons, buissons, rive avec une ligne pour les pêcheurs, rochers, champs, bâtiments), travaillent puis rapportent au feu ; les sans-métier flânent sur la place. **Interface** Tiny Swords : ressources en haut (avec le débit par minute), volets VILLAGEOIS (accueillir, + et − par métier), CONSTRUIRE, COLONIE (moral, statut suivant, Charte), menu, récap du retour. Décor animé : eau, arbres, champs, fumée des cheminées, feu, moutons, nuages. **Pas encore** : animaux, enfants, saisons, météo, jour et nuit, ère 2 et Lois.
- **09/11 — main mis à jour** (session 1 sur le site) ; pas d'artefact pour l'instant (décision de l'utilisateur : le jeu est très long).
- **09/11 — session 2 : la vie de la vallée** (`vie.js`, repris de la maquette 7, décor seulement) : le temps suit la partie (`S.t`, absence comprise), la partie commence au printemps ; **saisons** de 20 min (feuilles roses au printemps, rousses en automne, neige sur l'herbe, les toits et les arbres et eau gelée en hiver ; champs qui poussent, mûrissent, sont moissonnés, enneigés) ; **jour et nuit** (12 min dont 3 de nuit : tout s'assombrit, le feu et une fenêtre par logis éclairent) ; **pluie** ou neige par moments (plus souvent l'hiver) ; **animaux** LPC (`img/animaux.png`) : biches et cerf à l'orée, renard sur la rive est, poissons qui sautent, vols d'oiseaux, oiseaux près des champs et sur la place, poules près des logis, chats (un villageois qui flâne caresse le chat : cœurs), chien qui suit un villageois dès 3 habitants ; **enfants** qui jouent en rond sur la place à partir du hameau (un pour 3 habitants, couchés la nuit). Le volet COLONIE dit la saison, l'année, la pluie et la nuit.
- **09/11 — décisions pour l'ère 2 et les Lois** (questions de Claude, réponses de l'utilisateur) :
  - **Prestige** : à la Charte, on fonde une nouvelle colonie (la côte) ; on emporte **les Lois et un villageois** (le premier), tout le reste repart de zéro.
  - **L'ancienne vallée** reste **visitable en souvenir** (figée telle qu'on l'a laissée, avec ses villageois, saisons et animaux ; menu « Mes terres ») ; elle ne produit plus.
  - **Lois : un arbre** : chaque Loi promulguée rapporte des points à dépenser dans un arbre (production, hors ligne, chantiers, recrues, place…). À concevoir avec le simulateur (ère 1 puis ère 2).
  - **Contenu prioritaire de l'ère 2** : **port et bateaux** (pêche en mer avec des barques, fumoir → poisson fumé), **planches** (scierie, pour les bâtiments avancés), **bière et taverne** (orge → brasseur → bière ; besoin « moral »). Le marché attendra.
- **09/11 — retours de l'utilisateur après avoir joué (PC)** et corrections faites le jour même :
  - **Feu de camp** dessiné par le code (cercle de pierres, bûches croisées, flammes qui ondulent sans s'arrêter, étincelles) à la place du feu Tiny Swords qui ressemblait à une explosion.
  - **Baies** : buissons semés de baies rouges et violettes (peu au printemps, aucune l'hiver) ; le **cueilleur** se tient devant le buisson (au sud), plus dedans (on voyait ses jambes sous le buisson) ; il cueille à la main (pas d'outil).
  - **Rochers** : trois rochers plus petits et espacés, rangés chacun à sa profondeur. **Arbres** : le pied et son ombre ne touchent plus l'eau (on recule l'arbre vers la forêt).
  - **Place et rues** : les rues sont dessinées avant la place, qui les recouvre (plus de chevauchement ni de petit rond devant une porte collée à la place).
  - **Puits / fontaine** : posés au bord de la place, jamais sur une rue ni un terrain. **Tente** : disparaît au hameau. **Le pionnier devient le premier villageois** (il prend un métier au lieu de rester au feu).
  - **Cheminées** : dessinées sur les maisons du pack qui n'en ont pas, fumée plus visible, fumée du four quand un boulanger travaille.
  - **Bêtes** : chien et chat tournés du bon côté (planches : ligne 0 = vers la droite) ; plus de trajet sur l'eau (le renard), ni sur le feu et ses abords (le chat).
  - **Pêcheur** : la canne part de la main.
  - **Interface** : volet VILLAGEOIS : « Toits : x · CAMPEMENT : 5 au plus » et la phrase qui dit ce qui bloque ; CONSTRUIRE : une phrase par bâtiment (ponton : 2 places de pêcheur de plus) et, quand il y a assez de toits, l'avertissement qu'une cabane n'apportera personne ; COLONIE : conditions en lignes (grande icône, « 8 / 800 », coche) ; plus de barre de défilement ; ressources plus grandes sur PC.
  - **Pas encore fait** : (1) **outils par métier** : le générateur LPC a la pioche, la canne, la houe, l'arrosoir, le marteau : refaire `villageois.png` avec plusieurs outils par villageois (hache = bûcheron, pioche = carrier, houe = fermier, canne = pêcheur), étape à part ; (2) « certains personnages de face au lieu de dos » : pas retrouvé (marche, repos et travail vérifiés), à préciser.
- **09/11 — idées de l'utilisateur (à concevoir avec le simulateur)** :
  - **Améliorations pendant la partie** (en plus des Lois) : les **Lois** relèvent les stats de base (permanentes, entre prestiges) ; pendant la partie, des **édits / ordonnances / équipements** (brouette, outils…) donnent un pourcentage en plus : récolte au clic, quantité rapportée par voyage, vitesse de récolte, limite de population, places par ressource.
  - **Bâtiments de stockage** : grenier (nourriture), aire de stockage (bois, pierre) ; on **voit les ressources s'accumuler** (piles de bûches, tas de pierres, sacs) ; en construire plus ou les améliorer : plus de place et récolte plus rapide (moins de trajet). Implique une **capacité** par ressource.
  - **Loi : vitesse sur les routes** (les villageois marchent plus vite sur les rues).
  - **Hiver** (question de l'utilisateur) : consommer plus de nourriture et du **bois de chauffage** l'hiver ?
- **09/11 — réponses et réalisation** :
  - **Marche vers le haut** : on voyait le visage (le villageois semblait reculer) : `{h: 0}[dir] || 2` donnait 2 ; corrigé (`??`).
  - **Outils** : chaque villageois a les quatre outils LPC (`villageois.png` refait, mêmes villageois) : hache (bûcheron), pioche (carrier), canne (pêcheur : lancer puis attente), houe (fermier) ; le cueilleur cueille à la main.
  - **Hiver** (personne ne meurt) : `HIVER` de `donnees.js` : chaque habitant brûle 0,006 bois/s (0,36/min) et mange 25 % de plus ; sans bois, moral −15 % (« Bois pour se chauffer »). Le volet COLONIE prévient à l'automne.
  - **Stock limité** (pour voir ; on l'enlèvera si c'est trop contraignant) : `STOCK.base` (bois 300, pierre 200, baies/poisson/blé 100, farine/pain/laine 60, vêtements 40) ; **grenier** (nourriture) et **aire de stockage** (bois, pierre, laine, vêtements) sur deux réserves 2 × 2 de la carte (`S` près des champs, `R` près des rochers et de la rivière, terrain `reserve`) ; chaque niveau double la place (grenier 4 niveaux, aire 5), on agrandit sur place (coût × 2). Ce qui dépasse est perdu, le toucher refuse quand c'est plein. **On voit le stock** : bûches, pierres, sacs et paniers qui grossissent et fondent (près du feu avant le grenier et l'aire) ; les récolteurs déposent à leur réserve ; jauge sous chaque ressource (rouge et PLEIN quand c'est plein) ; le volet COLONIE dit quand une condition dépasse la place.
  - Simulateur (robot qui agrandit ses réserves et ne garde pas de récolteurs sur un stock plein) : hameau 24 min, village 1 h 59, Charte 3 h 10 (sans le stock : 2 h 45).
- **09/11 — retours (2e partie) et demandes de l'utilisateur** :
  - Retouches : volet CONSTRUIRE rangé dans l'ordre où l'on peut bâtir (l'aire de stockage était en bas) ; pêcheur figé sur le geste du lancer au lieu de la canne tendue ; minuteur de la bulle d'un chantier qui ne baisse pas ; le **poisson doit compter pour recruter** (c'est de la nourriture : le coût affiché « baies » trompe) ; **villageois libres** plus lisibles ; **place maximale** de chaque ressource visible (chiffre sur PC, jauge plus nette sur mobile) ; biches bloquées (les laisser passer sous les arbres) ; ombre du chat couché (il lévite) ; les villageois vont-ils plus vite sur les routes ? (à faire, et améliorable).
  - **Graphismes avec les packs** : aire de stockage et tas avec les morceaux des packs (bûches des icônes, caisses, tonneaux, sacs…), pas dessinés à la main ; **grenier « à la Stronghold »** : quand on le touche, il devient transparent et on voit les vivres dedans ; **décor aux lieux de récolte**, qui s'étoffe à chaque statut (la lisière des bûcherons devient un petit camp de bûcherons, etc.).
  - **Ordonnances et équipements** (pendant la partie, payés en ressources ; certains seulement à partir du hameau, faute de pierre au campement) : vitesse sur les routes ; vitesse de récolte ; quantité portée ; nombre maximal d'habitants indépendamment du statut ; bonheur général ; bois brûlé l'hiver ; nourriture mangée l'hiver ; nombre de personnes par lieu de récolte (les villageois vont sur d'autres arbres, buissons, coins de pêche) ; récolter la pierre (puis d'autres ressources) au toucher ; plus d'une ressource par toucher ; et d'autres petites améliorations.
  - **Pillards** (très peu au début) : ils volent des ressources ; agrandir le grenier et l'aire **met à l'abri** une partie du stock (des ordonnances aussi) ; une **petite tour** prévient de leur arrivée ; une **caserne** et un nouveau métier, la **garde**, défendent le village automatiquement ; des améliorations rendent les gardes plus forts ; la **forge** fait de meilleurs équipements ; un garde blessé met du temps à se remettre (d'autres améliorations possibles).
- Prochaines étapes après le choix : décisions du § 2, puis **simulateur d'équilibrage d'abord** (`outils/terres-simulateur.js`, ère 1), puis session 1.

## 2. Adaptations à la Ludothèque (proposées le 08/11, à confirmer)
Le cahier reçu est écrit pour un projet seul ; dans la Ludothèque, quelques points changent :

| Cahier reçu | Dans la Ludothèque | Pourquoi |
|---|---|---|
| Vanilla JS **ou React + Vite**, build par GitHub Actions | **Vanilla JS sans build**, scripts classiques (`regles.js` pur et testable sous Node, `jeu.js` dessin et interface, `donnees.js` bâtiments et ressources) | Règle du dépôt : le fichier poussé est celui que joue le téléphone ; GitHub Pages publie déjà le site. |
| Structure `src/game`, `src/render`, `src/ui` | Même découpage, mais en quelques fichiers dans `terres-franches/` (comme Bastion) | Pas de modules ES ni de npm. |
| PC d'abord, responsive mobile | **Téléphone d'abord** (appli PWA Android), en portrait ; le PC suit | C'est là que la famille joue. |
| Assets Kenney / itch.io CC0 | Selon la maquette : Tiny Swords (déjà acheté, déjà crédité), ou dessiné par le code | Règle des crédits ; images rangées dans le dossier du jeu. |
| Sauvegarde `localStorage` + export/import JSON | `localStorage` (clé `terres.partie`) + le **transfert `LUDO1-`** de l'accueil (qui sert déjà d'export) | Déjà en place pour tous les jeux. |
| Gains hors ligne plafonnés | Gardé : calculés au chargement, plafond 8 h, récap au retour | Comme le temps réel doux du Clan / la Mine sans fond. |
| Pas de compte | Gardé ; **classement facultatif** de la famille (par ex. population maximale ou nombre de Lois), à décider | Les autres jeux en ont un. |
| Simulateur à l'étape 12 | **Simulateur dès la session 1** (`outils/terres-simulateur.js`, dans `verifications.js`) | Leçon de Bastion, Duché, Bannières : régler les nombres avant de les coder. |
| Chemins A* | Chemins simples (ligne droite + contournement des bâtiments) au début ; A* seulement si la carte en a besoin | Petite carte. |

**Points communs avec d'autres chantiers** (à garder en tête, pas de fusion proposée) : **la colonie** (`ile/`, tour par tour, la nature est l'ennemie, cdc `specs/colonie.md`) ; **le Clan du fjord** (en pause : les graphismes à créer l'ont bloqué → ici, choisir un style qui ne demande pas de tout dessiner) ; **la Mine sans fond** (incrémental, `IDEES.md`). Terres d'Éveil s'en distingue par le **temps réel incrémental** (production qui continue appli fermée) et le **prestige par les Lois**.

**Décidé (08/11)** : **pas de classement**. **Placement** (08/11) : le mélange (emplacement proposé, déplaçable). **Question ouverte** : durée visée (le cahier dit 25 à 40 h ; sur téléphone, en sessions courtes, ça tient si l'idle fait sa part) .

## 3. Noms proposés (08/11)
| Nom | Pourquoi |
|---|---|
| **Terres franches** (**choisi le 08/11**) | Au Moyen Âge, une ville « franche » est celle qui a reçu sa charte de libertés : c'est le prestige par les Lois. |
| **Clairval** | Le nom de la première vallée ; court, doux, se retient. |
| **Feux et Chartes** | Du feu de camp du début aux chartes qui font les villes. |
| **Les Bâtisseurs du Val** | Dit tout de suite qu'on construit. |
| **De Hameau en Capitale** | Raconte la progression des cinq ères. |
| **Terres d'Éveil** | Le nom de travail du cahier. |

---

# Cahier reçu (08/11, tel quel)

**Genre** : jeu incrémental / gestion de colonie, navigateur web (PC d'abord, responsive mobile)
**Hébergement** : GitHub Pages (100% statique, aucun backend)
**Ambiance** : médiéval-fantasy, contemplatif, lente progression visible sur une carte vivante

## 🎯 Vision

Le joueur commence seul : un pionnier qui clique pour cueillir, pêcher et abattre du bois.
Peu à peu il recrute des villageois, leur assigne des métiers, construit des bâtiments et
développe des chaînes de production de plus en plus complexes. La carte raconte l'histoire :
chaque palier de croissance se voit, chaque villageois animé vaque à ses occupations.

**Piliers de design** :
1. **Lent et gratifiant** : pas de prestige agressif, des coûts exponentiels doux, toujours
   "une petite amélioration à acheter dans 2 minutes".
2. **La carte est le jeu** : les nombres s'incarnent en bâtiments, personnages et animations.
3. **Les chaînes de production** : transformer des ressources brutes en produits finis
   donne des bonus et satisfait les besoins de la population.
4. **La magie comme couche tardive** : une deuxième économie qui se débloque quand le
   village est installé.

## 🔁 Boucle de jeu

1. **Clic manuel** : récolter du bois / baies / poisson (feedback immédiat : "+1" flottant,
   animation du personnage, petit son discret).
2. **Recrutement** : attirer un villageois coûte de la nourriture + des ressources. Chaque
   villageois a besoin d'être nourri (et plus tard : vêtu, logé, diverti).
3. **Assignation** : le joueur attribue un métier à chaque villageois (bûcheron, fermier,
   pêcheur...). Le villageois apparaît sur la carte et se déplace vers son lieu de travail.
4. **Construction** : bâtiments = multiplicateurs et déblocs. Un bâtiment doit être
   construit avec des ressources (certaines issues de chaînes).
5. **Besoins de population** : la population croissante exige de plus en plus de types de
   biens. Satisfaits = bonus de moral (multiplicateur global) ; insatisfaits = production
   ralentie.
6. **Idle / offline** : la production continue hors-ligne (plafonnée, avec un récap au
   retour).

## 📦 Ressources et chaînes de production

### Ressources de base (Phase 1)
- **Bois** (clic puis bûcherons)
- **Baies / gibier** (clic puis cueilleurs)
- **Poisson** (clic puis pêcheurs)
- **Pierres** (carrière, un peu plus tard)

### Exemple de chaîne complète

```mermaid
flowchart LR
  fermier["🧑‍🌾 Fermier"] --> champ["🌾 Champ"]
  champ --> ble["Blé"]
  ble --> meunier["🧑‍🔧 Meunier"]
  meunier --> moulin["🏗️ Moulin"]
  moulin --> farine["Farine"]
  farine --> boulanger["🧑‍🍳 Boulanger"]
  boulanger --> four["🔥 Four à pain"]
  four --> pain["Pain"]
  pain --> nourrir["Nourrir les habitants"]
```

Autres chaînes prévues (même logique, débloquées par paliers) :

| Chaîne | Brute | Transformation 1 | Transformation 2 | Produit final | Sert à |
|---|---|---|---|---|---|
| Vêtements | Mouton → laine | Fileuse → fil | Tisserand → tissu | Vêtements | Besoin "confort" des habitants |
| Construction | Bois + pierre | Scierie → planches | Charpentier → charpente | Structures | Construire plus vite / bâtiments avancés |
| Pêche | Poisson | Fumoir → poisson fumé | Marché → provisions | Provisions longues | Nourrir de grosses populations |
| Boisson | Orge | Brasseur → bière | Taverne | Bière | Besoin "morale" des habitants |
| Savoir (tardif) | Herbes rares | Alchimiste → essences | Bibliothèque → grimoires | Essences, grimoires | Débloquer la magie |

**Principe de design des chaînes** : chaque transformation donne un bonus multiplicateur
supérieur à la simple vente de la ressource brute, mais le joueur doit arbitrer ses
villageois entre production brute et transformation.

## 👥 Population et besoins

La population a des besoins qui se débloquent par paliers. Chaque habitant consomme
par tick :

| Palier population | Besoins | Effet si satisfait | Effet si non satisfait |
|---|---|---|---|
| 1-5 | Nourriture (base) | Croissance possible | Pas de recrutement |
| 6-15 | Nourriture variée (pain OU poisson OU gibier) | +10% production globale | Production -10% |
| 16-40 | Vêtements | +10% supplémentaire | Croissance stoppée |
| 41-80 | Logement (cabane → maison en pierre) | +10% | Moral baisse lentement |
| 81+ | Morale (taverne, bière, fête) | +10% | Émeutes visibles ? (v1.2) |

Le **moral global** est le multiplicateur central du jeu : il encourage à diversifier
plutôt qu'à spammer une seule ressource.

## 🧙 Couche magie (mi-partie)

Débloquée via la chaîne "savoir" (alchimiste + bibliothèque + grimoires) :

- **Cristaux** : ressource magique rare, extraite dans la forêt profonde puis la grotte.
- **Sorts passifs** : achetés avec des cristaux, effets lents et permanents
  (croissance des champs +5%, pluie bénéfique périodique...).
- **Le mage** : villageois spécial, unique, qui se balade et "enchanté" les bâtiments
  proches (zone d'effet visible sur la carte).

## ⚖️ Bottlenecks et prestige : les Lois

Le prestige n'est pas un reset arbitraire : c'est **promulguer une Loi** qui transforme
la colonie en véritable ville, puis **fonder une nouvelle colonie** sur une carte plus
grande avec un nouveau nom. Chaque ère = un cycle prestige.

### Les bottlenecks (verrous naturels, pas des murs artificiels)

1. **Place limitée** : la carte d'une ère a un nombre de tuiles constructibles fixe
   (le village ne peut pas s'étendre au-delà de sa vallée). Quand toutes les bonnes
   terres sont prises, la croissance plafonne → le joueur comprend *visuellement* qu'il
   faut passer à l'échelle supérieure.
2. **Population plafonnée par le niveau de ville** : le statut juridique actuel limite
   le nombre d'habitants. Le village ne peut pas dépasser N âmes sans charte.
3. **Chaînes verrouillées par niveau** : certains bâtiments (moulin, taverne, bibliothèque)
   exigent un statut de ville plus élevé, ce qui plafonne les bonus de moral.
4. **Rendements décroissants** : au-delà de X bâtiments du même type sur une carte,
   chaque ajout rapporte moins (sur-exploitation des ressources locales).

### Les Lois (améliorations permanentes, conservées entre prestiges)

Chaque loi coûte des ressources de fin de partie + un seuil de population. Exemples :

| Loi | Ère requise | Effet permanent |
|---|---|---|
| Charte du Village | 1 | Débloque les cartes "hameau", +10% production de base, garde 1 villageois au restart |
| Loi des Guildes | 2 | Les métiers de transformation coûtent -20%, débloque le bourg |
| Édit du Commerce | 3 | Marché disponible dès le début, conversion de ressources +25% |
| Droit des Savants | 4 | Bibliothèque dès le début, la magie se débloque 2 fois plus vite |
| Grandes Armoiries | 5 | +1 tuile de départ partout, toutes les chaînes +15% |

### Les ères et les cartes

| Ère | Statut atteint | Taille de carte | Pop. max | Nouveau contenu |
|---|---|---|---|---|
| 1 | Campement → Village | 24×24 | ~20 | Chaînes de base + pain + vêtements |
| 2 | Bourg | 32×32 | ~45 | Bière, planches, marché |
| 3 | Petite ville | 40×40 | ~80 | Magie, cristaux, mage |
| 4 | Cité | 48×48 | ~150 | Chaînes magiques, prestige sorcier |
| 5 | Capitale | 56×56 | ~250 | Contenu final, monuments |

À chaque prestige : nouvelle carte (nom généré ou choisi par le joueur), nouveau
biome léger (vallée → côte → forêt profonde → montagne → plaine capitale) pour la
fraîcheur visuelle, et les lois choisies s'appliquent dès le départ.

### Équilibrage : est-ce qu'il y a assez de place ?

- **Durée cible par ère** : Ère 1 ~2-3h, puis 4-6h, 6-10h, 10-15h (croissance classique
  des incrementals). Total ~25-40h pour une complétion, ce qui est raisonnable.
- **Assez de contenu ?** 5 ères × (5-8 nouveaux bâtiments + 2-3 chaînes) ≈ 40-50 items
  de contenu à définir : c'est dense mais data-driven, donc gérable.
- **Anti-grind** : si le joueur atteint le bottleneck trop tôt, la loi doit être
  *accessible* (achat en 15-30 min de farm après le cap), sinon frustration.
- **À simuler avant de coder** : un petit script de simulation (rendements, coûts,
  population) par ère pour vérifier que les caps arrivent au bon moment — ajouter au
  roadmap une étape "simulateur d'équilibrage".

## 🗺️ Paliers de croissance (carte)

| Palier | Population | Éléments visuels ajoutés |
|---|---|---|
| Campement | 1-2 | Feu de camp, tente, sentiers de terre |
| Hameau | 3-7 | Cabanes en bois, puits, premier champ clôturé |
| Village | 8-20 | Place centrale, moulin à vent visible, chemins pavés, lanternes |
| Bourg | 21-45 | Maisons à étage, marché, église/tour de guet, rempart bas |
| Petite ville | 46-80 | Fontaine, routes pavées, tour du mage, parc |

Chaque palier est un **moment célébré** : petite animation de transition (villageois qui
s'assemblent, bannière, son).

## 🎨 Animations (priorisées)

**Indispensables (v1)** :
- Sprites des villageois qui marchent maison → travail → dépôt (chemins simples A*)
- "+X" flottants au clic et à chaque récolte
- Fumée de cheminées, construction progressive des bâtiments (échafaudage → terminé)
- Cycle jour/nuit teinté (lanternes qui s'allument)

**v1.1** : saisons légères (rendements modifiés, neige), poissons qui sautent, feuilles.
**v1.2** : météo (pluie), feux d'artifice aux paliers, visiteurs/merchants en carriole.

## 🛠️ Stack technique (contrainte GitHub Pages)

- **Vanilla JS ou React + Vite** — build statique déployé via GitHub Actions.
- **Rendu** : Canvas 2D (ou PixiJS si les besoins grandissent). Carte à tuiles 2D
  top-down, assets pixel art libres (Kenney, itch.io CC0).
- **Responsive** : carte à tuiles qui se scale ; sur mobile, zoom auto sur la zone active
  et UI en panneau bas déroulant.
- **Sauvegarde** : `localStorage` + export/import JSON (bouton simple, utile pour
  l'anti-frustration). Les gains offline calculés au chargement.
- **Pas de backend, pas de compte** : tout côté client.

### Structure de projet suggérée

```
src/
  game/
    state.js        # état global sérialisable (source de vérité unique)
    economy.js      # production, consommation, chaînes, moral
    population.js   # villageois, métiers, besoins
    buildings.js    # définitions des bâtiments (data-driven)
    save.js         # localStorage, export/import, offline gains
  render/
    map.js          # tuiles, caméra, zoom
    agents.js       # déplacement des villageois
    effects.js      # particules, "+1", jour/nuit
  ui/
    panels/         # menus, shop, recrutement
```

## 🗺️ Roadmap d'itération pour Claude Code

Travailler par petites étapes, une fonctionnalité jouable à la fois :

1. **Squelette** : page HTML, canvas, boucle de jeu (requestAnimationFrame), clic sur
   un arbre → bois, compteur, "+1" flottant.
2. **Économie de base** : coût exponentiel, premier bûcheron (production passive),
   sauvegarde localStorage.
3. **Carte + agents** : tuiles, un villageois sprite qui se déplace, dépôt de ressources.
4. **Chaîne pain** : fermier, champ, blé, moulin, farine, boulanger, pain. Besoin
   "nourriture variée".
5. **Recrutement & moral** : attirer villageois, assigner métiers, moral global.
6. **Paliers de croissance** : campement → hameau → village, animations de transition.
7. **Chaînes 2** : vêtements, construction (planches). Paliers bourg.
8. **Jour/nuit + particules + polish animations**.
9. **Magie** : cristaux, sorts passifs, mage.
10. **Prestige & Lois** : bottlenecks de place, promulgation de loi, restart sur
    nouvelle carte, arbre de lois permanent.
11. **Offline gains, export JSON, responsive mobile, deployment GitHub Actions.**
12. **Simulateur d'équilibrage** : script Node qui simule les 5 ères (rendements,
    coûts, caps de population) et affiche le temps réel jusqu'à chaque bottleneck.

**Conseils pour bien piloter Claude Code** :
- Donner l'état du jeu comme un objet JSON unique documenté (facilite les itérations).
- Garder les définitions de bâtiments/ressources dans des fichiers de données
  data-driven (ajouter un bâtiment = ajouter une entrée, pas de logique dispersée).
- Une session = une feature du roadmap ci-dessus, avec un test rapide dans le
  navigateur avant de passer à la suivante.
- Faire valider les formules d'équilibrage (coûts, rendements) avec un petit tableau
  ou script de simulation avant de les coder.

## 💰 Équilibrage (principes)

- Coût d'un bâtiment N : `base × 1.15^N` (croissance douce typique des incrementals).
- Chaque nouveau palier de chaîne ×2 la valeur du produit vs brut, mais coûte un villageois.
- Objectif de rythme : premier recrutement en ~2 min, premier palier (hameau) en ~20 min,
   village en ~2h de jeu actif ou idle.

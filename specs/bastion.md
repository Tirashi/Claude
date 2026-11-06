# Bastion (chantier ouvert le 06/11)

Nom provisoire. Jeu de défense tactique en temps réel **à la Bad North** (idée de l'utilisateur du 06/11) : on défend un petit plateau contre des vagues d'ennemis avec quelques escouades ; on ne bâtit rien, on place ses troupes au bon endroit au bon moment. Jeu original : notre monde, nos unités, nos cartes (rien repris de Bad North).

## Décisions de l'utilisateur (06/11)
- **Univers** : médiéval **ou** asiatique ; **pas d'île**, pas forcément maritime → un plateau découpé posé comme une maquette sur la table ; les ennemis sortent de la forêt ou des chemins en bordure.
- **Graphismes** : à choisir sur la maquette (3D épurée ou pixel art isométrique).
- **Structure** : **niveaux fixes** (étoiles) + **défi du jour** pour toute la famille, avec classement (règle des défis du jour : une seule tentative classée).
- **Rythme** : **temps réel ralenti** : le jeu tourne seul et ralentit fortement quand on touche une escouade pour lui donner un ordre.

## Maquette 1 (06/11)
https://claude.ai/artifact/8qDoUNaYTK79s32mZquYWv — source `maquettes/bastion.html` (jouable ; Three.js r128 depuis cdnjs pour A et B, canvas 2D pour C).
Commun aux trois : plateau 9 × 9 à trois hauteurs, 4 maisons et une tour au sommet, 4 entrées en bordure ; 3 escouades (épées : 6 soldats ; archers : 5, tirent à 3 cases ; lances : 6, frappent fort) ; vagues de plus en plus grosses qui visent la maison la plus proche ; une escouade au repos près d'une maison debout se remet sur pied ; partie perdue quand tout brûle. Toucher une escouade (sur le plateau ou sa carte en bas) → **RALENTI** (×0,15) ; toucher le sol → elle y court.
- **A · médiéval en 3D** : hameau de Valbrune, toits de chaume, pins, tour ; parchemin et lettres gravées (Cinzel) ; on tourne autour du plateau en glissant le doigt.
- **B · asiatique en 3D** : temple de la Grue, pagode, torii, cerisiers, rônins au chapeau de paille ; papier de riz, laque rouge, encre (Shippori Mincho).
- **C · médiéval en pixel art isométrique** : le même hameau en 32 bits dessiné par le code, vue fixe ; fenêtres noires à bord blanc de la Ludothèque.

Retours (06/11) : **C abandonnée** ; A et B plaisent bien.

## Maquette 2 (06/11)
https://claude.ai/artifact/4K652xgNxZud1Dn5gqNfxx — source `maquettes/bastion-2.html`. Les deux mondes en 3D gardés, plus riches, et le menu qui les réunit :
- **A · le Royaume de l'Ouest** (Valbrune, plein jour) : rivière et pont de bois, rochers, cheminées et fumée des maisons touchées, épées à bouclier rond, archers, piquiers ; chef barbare casqué à cornes.
- **B · l'Empire de l'Est** (temple de la Grue, crépuscule) : brume, lanternes, étang, cerisiers, pagode à flèche dorée, torii à deux traverses ; samouraïs, grands arcs, naginata ; un oni rouge comme chef.
- **Le menu** : deux onglets, une campagne de **8 terres** par monde sur une carte dans son style (parchemin ou montagnes au soleil couchant), 3 étoiles par terre, et le **défi du jour** en bas (une tentative classée).
- Nouveautés de jeu, dans A et B : une **capacité spéciale** par escouade (bouton sous sa carte, puis attente : MUR / 盾 garde = plus de dégâts pendant 5 s ; SALVE / 雨 pluie = 3 flèches par archer ; CHARGE / 突 assaut = les lances foncent, dégâts doublés 3 s) ; un **chef** toutes les 3 vagues ; une **alerte** 3 s avant chaque vague (« Ils arrivent par l'est », flèche rouge à l'entrée) ; un **bilan** à chaque vague repoussée (★ toujours, + maisons peu touchées, + aucune escouade perdue) ; un repère blanc là où une escouade est envoyée.

Retours (06/11) : **on garde l'Empire de l'Est** (monde asiatique, B) ; le Royaume de l'Ouest n'est pas retenu. Mais les graphismes de la maquette (formes simples dessinées par le code) ne suffisent pas : **trouver de vrais modèles 3D** (packs CC0 ou payants autorisés, skill `packs-itch`, crédits) **ou les améliorer beaucoup**. Prochaine étape : chercher des packs de modèles 3D asiatiques (temple, maisons, samouraïs, rônins, cerisiers) et refaire une maquette avec.

## À décider ensuite
Nom du jeu ; nombre de niveaux et de mondes ; progression (escouades qui gagnent de l'expérience ? nouvelles troupes débloquées ?) ; règles des étoiles (maisons sauvées, temps, soldats perdus) ; contenu du défi du jour (carte et vagues imposées) ; ennemis spéciaux (béliers, cavaliers, archers ennemis, chefs).

## Recherche de modèles 3D (06/11)
Licences : CC0 en priorité ; « usage libre, pas de revente ni de redistribution » accepté (règle du 30/10, fichiers dans le dossier du jeu, crédits avec le lien).

**Bâtiments et décor**
| Pack | Prix | Licence | Contenu | Avis |
|---|---|---|---|---|
| [Japanese Low Poly Shrine & Temple 25](https://sceneforgestudio.itch.io/sf023-japanese-low-poly-shrine-temple-25) (SceneForge Studio, SF023) | **5,27 $** au lieu de 7,99 $ jusqu'au **12/11** | à lire à l'achat (README) | 25 pièces : pagode à 5 étages, grand portail rouge, salle principale, scène de kagura, galeries couvertes modulaires (grille de 2 m), tunnel de torii, murs, lions-gardiens, lanternes, tambour… GLB, une seule texture palette 256 × 256, 44 à 3 750 triangles | Le plus beau et le plus proche du temple de la Grue ; une série (SF015 à SF022) dans le même style |
| [Samurai Town Asset Pack](https://lowpolyboy.itch.io/3dsamuraitownassetpack) (LowPolyBoy) | **19,99 $** | à lire | 9 maisons, 16 grands décors (torii, ponts, clôtures, azumaya), 52 petits (lanternes, bannières, étals), 40 plantes et rochers, sols ; **1 personnage riggé, 8 costumes, 8 armes** ; une texture dégradé | Le plus complet (village + soldats), le plus cher |
| [Low Poly Japanese Castle Town](https://reodesuxz.itch.io/low-poly-japanese-castle-town-pack), [Shrine](https://reodesuxz.itch.io/low-poly-japanese-shrine-pack), [Ninja Dojo & Castle](https://reodesuxz.itch.io/low-poly-ninja-dojo-castle-pack) (reodesuxz) | **gratuits** | usage libre, pas de redistribution | 26 + 29 + 28 modèles (donjon, portes, machiya, pagode, torii, lanternes, dojo, jardin), GLB, sans texture | Très simples (≈ 100 triangles par modèle) : à peine mieux que nos formes ; bien pour les petits objets |

**Personnages**
| Pack | Prix | Licence | Contenu | Avis |
|---|---|---|---|---|
| [LOWPO: Samurai Pack](https://standout7.itch.io/lowpo-samurai) (Standout 7) | gratuit / **Pro 9,99 $** | CC0 | Gratuit : 2 samouraïs riggés, katana, FBX, **sans animation**. Pro : + tank, ninja, samouraï royal, **animations** (repos, marche, course, 2 attaques), **GLB** | Le meilleur choix pour les soldats et les rônins ; CC0 |
| Personnage de Samurai Town (ci-dessus) | inclus | à lire | 1 corps riggé, 8 costumes, 8 armes | Utile si on prend Samurai Town |

Rien de samouraï chez Kenney, Quaternius ou KayKit (CC0) ; leurs personnages génériques animés peuvent servir de base (repeints en couleurs d'escouade).

**Proposition** : SceneForge SF023 (temple, 5,27 $ en promotion jusqu'au 12/11) + LOWPO Samurai Pro (soldats animés, 9,99 $), et les packs gratuits de reodesuxz pour les petits objets. Une maquette 3 refaite avec ces modèles avant de décider.

## Maquette 3 : les modèles gratuits (06/11)
https://claude.ai/artifact/EUUdLdBMUsWXTd5nPqPTND — fabriquée par `outils/bastion-maquette/fabriquer.py` (page source `outils/bastion-maquette/source.html` ; reprend la simulation de `maquettes/bastion-2.html` ; GLTFLoader, SkeletonUtils, FBXLoader et fflate de three r128 intégrés). **Les packs ne sont pas dans le dépôt** (pas de redistribution) : la page fabriquée n'existe qu'en artefact ; à refaire, retélécharger les packs (skill `packs-itch`, commande dans l'en-tête du script).
- Le temple de la Grue jouable, refait avec les trois packs gratuits de reodesuxz (pagode, torii, lions-gardiens, lanternes, jardin zen, tour de guet ; maisons : machiya, maison de thé, entrepôt kura ; arbres : cerisiers, érables, pins, bambous) et les deux samouraïs de LOWPO (gratuit) teintés aux couleurs des escouades (rônins en violet, chef en rouge, 1,8 fois plus grand).
- La vitrine : une vignette de chacun des 85 modèles (83 reodesuxz + 2 LOWPO).
- Constats : les modèles reodesuxz sont propres et cohérents, en couleurs unies, plus détaillés que nos formes (toits recourbés, poutres, bannières) ; les samouraïs LOWPO gratuits n'ont **pas d'animation** (pose bras écartés, ils glissent) : pour de vrais soldats, il faut la version Pro (animations, GLB, 9,99 $) ou un autre pack.
- Licences : reodesuxz (usage libre, pas de revente ni redistribution, pas d'entraînement d'IA ; crédit apprécié) ; LOWPO gratuit (CC0). À citer dans `credits/index.html` dès qu'ils entrent dans le jeu.

Retours (06/11) : **les décors reodesuxz sont « vraiment pas mal »** (gardés) ; **les soldats LOWPO gratuits sont « catastrophiques »** (figés bras écartés, sans animation) : à remplacer.

## Maquette 4 : les soldats dessinés par le code (06/11)
Choix de l'utilisateur : dessiner les soldats par le code plutôt qu'acheter un pack. https://claude.ai/artifact/WhXCAVxBoJJeyWd4yT5zNY — page source `outils/bastion-maquette/source-4.html`, fabriquée par `fabriquer.py 4` (décors reodesuxz seulement).
- Figurines d'environ 60 formes simples à facettes (`figurine(kind, team)`) : jambes et bras articulés, cuirasse à lamelles, jupe de lamelles, épaulières ; **samouraï** (kabuto à croissant doré, katana), **archer** (jingasa, grand arc, carquois), **lancier** (jingasa, yari), **rônin** (chapeau de paille, kimono usé, katana), **oni** (peau rouge, cornes, massue cloutée, 1,7 fois plus grand). Bannière sashimono dans le dos aux couleurs de l'escouade avec un rond blanc ; armure teintée de la même couleur.
- Animations par le code (`anim(f, mode, t)`) : marche (jambes et bras en balancier), frappe (sabre levé puis abattu, massue), coup de lance (lance abaissée vers l'avant), tir (arc tendu, corde tirée), repos (respiration). Les soldats se tournent vers leur marche ou vers l'ennemi le plus proche ; tout ralentit avec le temps.
- À droite : le gros plan des cinq figurines, qui alterne marche, attaque et repos.
- Matériaux : MeshPhongMaterial à facettes (MeshLambertMaterial n'a pas `flatShading` en r128).

Retour (06/11) : « je me suis trompé, c'est pas de la 3D que je cherche ; essayons en **2D iso** », avec un pack à essayer ([8x8] Isometric TRPG) et d'autres à chercher.

## Recherche de packs 2D iso (06/11)
| Pack | Prix | Licence | Contenu | Avis |
|---|---|---|---|---|
| [[8x8] Isometric TRPG](https://gvituri.itch.io/isometric-trpg) (Gustavo Vituri) — trouvé par l'utilisateur | gratuit | usage libre, même commercial, modification permise ; **pas de redistribution**, pas de NFT ; crédit apprécié | 1 planche de tuiles 16×17 (8 terrains et leurs demi-tuiles, eau, 2 jeux de 11 routes, 4 murs et 4 sols de bâtiments, pont, grille, 12 décors), 16 figurines 8×8 (face et dos, 2 images de repos + 2 d'attaque ; version avec contour), UI | **Retenu pour la maquette 5** : tout ce qu'il faut pour un Bad North en cubes ; médiéval-fantastique ; pas de toits, pas d'arbres « vrais » |
| [Isoverse: Medieval Outdoors](https://zatoart.itch.io/isoverse-medieval-outdoors) (zatoart) | gratuit (version Premium payante) | à lire | Gratuit : 14 cubes 32 px, un arbre, un rocher, une maison (deux sens) | Joli mais trop maigre en gratuit ; pas de soldats |
| [Free Japanese City](https://guttykreum.itch.io/free-japanese-city-game-assets) (GuttyKreum) | gratuit | à lire | Ville japonaise moderne | **Pas isométrique** (vue de dessus 3/4, style RPG Maker), moderne : écarté |
| [Isometric Medieval Tactics](https://gamer-ant.itch.io/isometric-medieval-tactics) (gamer-ant) | 2,46 $ | à lire | archer, épéiste, arbalétrier (attaque, mort, repos, toutes directions) | À voir si on veut des soldats plus grands |
| [Isometric fantasy knights](https://nulllgames.itch.io/isometric-fantasy-knights) (nulllgames) | 8 $ | à lire | 48 chevaliers, 8 directions, rendus 3D 384 px | Trop gros et réaliste pour notre style |
| [Mini-Crusader](https://remos.itch.io/mini-crusader) (Remos) | gratuit | CC-BY 4.0 | un croisé, 8 directions, animations complètes | Un seul personnage |
| Personnages isométriques d'[engvee](https://engvee.itch.io) | gratuits (un par page) | à lire | guerrier hallebardier, orc, khajit… 8 à 16 directions | Rendus 3D, style différent ; un par un |
Rien d'isométrique et asiatique en gratuit (FEUDAL JAPAN de FeralPixelForge, 13,99 $, est un kit de cartes de jeu de rôle peint, pas du pixel art).

## Maquette 5 : la 2D iso en pixel art (06/11)
https://claude.ai/artifact/GpCeg68qf7wZKAdk2iBayS — page source `outils/bastion-maquette/source-5.html`, fabriquée par `fabriquer.py 5 <dossier Assets du pack>` (les deux planches du pack en base64 ; le pack n'est pas dans le dépôt). Reprend la simulation et l'interface de la maquette 2 ; dessin sur une toile de 136 px de large agrandie sans flou (`image-rendering: pixelated`).
- **Plateau en cubes** empilés (terre en dessous, roche pour les étages, herbe ou route sur le dessus, eau en demi-cube qui ondule), triés de l'arrière vers l'avant ; **quart de tour** du plateau au doigt (glisser) ou avec les flèches ⟲ ⟳.
- **A · le pack tel quel** (médiéval) : chevaliers (épées), lanciers, archers contre gobelins et gobelins archers ; chef orc deux fois plus grand. Arbres = tronc + cube de feuillage du pack ; maisons, toits et donjon à créneaux dessinés au pixel par le code (le pack n'a pas de toits).
- **B · l'Empire de l'Est** : le même pack **recoloré par le code** (rampes de couleurs selon la luminosité) : herbe moussue, roche grise, cerisiers roses et érables rouges, pins sombres ; samouraïs = chevaliers repeints, casque à la couleur de l'escouade (noir, vert, rouge) avec un croissant doré ajouté, armure laquée ; archers et lanciers repeints ; ennemis : ninjas (l'ombre du pack) et rônins (lanciers repeints en violet, capuche de paille), l'oni = le démon rouge du pack. Pagode à trois toits, torii, maisons blanches à toits gris relevés, lanternes de pierre : dessinés au pixel par le code.
- Escouades rangées en deux rangs nets à l'écran, petite ombre sous chaque soldat ; images de repos, de marche (repos accéléré + sautillement) et d'attaque ; figurines de face ou de dos et retournées selon la direction.
- Sous chaque téléphone, la vitrine des six figurines en grand.
- Le script de téléchargement `itch.py` (skill `packs-itch`) gère maintenant les pages « téléchargement direct » (fichiers listés sur la page, sans prix libre).

Retour (06/11) : « c'est trop petit, pas assez détaillé ; trouve d'autres packs ».

## Deuxième recherche de packs 2D iso (06/11)
| Pack | Prix | Licence | Contenu | Avis |
|---|---|---|---|---|
| [Isometric Classic Hero + Tiles (32x32)](https://opengameart.org/node/92757) (DezrasDragons, OpenGameArt) | gratuit | **CC0** | Tuiles iso 32×32 en dalles (herbe, mousse, sable, neige, pierre, eau, planches, souche, rochers) ; 8 personnages d'environ 19 px (repos, marche, attaque, de face et de dos) : **samouraï au chapeau de paille**, **ninja**, chevalier, viking, mousquetaire, pirate, **hoplite à lance et bouclier**, héros | **Retenu pour la maquette 6** (sol et soldats) ; planches sur fond lavande et quadrillage, enlevés par le code |
| [EAST, échantillon gratuit](https://mmorwynn.itch.io/east-free-sample) (mmorwynn) | gratuit (les packs complets : 3,49 $ chacun en promotion, 4,99 $ sinon) | usage libre, même commercial, crédit non obligatoire ; pas de revente ni redistribution | Japon en iso pixel art très détaillé, deux tailles (14 m = 96 px ou 192 px) : machiya, minka, salle de culte, **pagode à cinq toits**, torii, renards gardiens, lanternes kasuga, bassin aux carpes, pont rouge, cerisier, érable, bambous (4 saisons, animation du vent), ombres à part | **Retenu pour B** ; packs complets : [EAST HOUSES](https://mmorwynn.itch.io/east-houses-pack), [SHRINES](https://mmorwynn.itch.io/shrines-pack), [GARDENS](https://mmorwynn.itch.io/gardens-pack), [BAMBOO](https://mmorwynn.itch.io/bamboo-pack). Art fait par des générateurs procéduraux (code écrit avec l'aide d'une IA, aucune image dessinée par une IA, d'après l'auteur) |
| [PEOPLE](https://mmorwynn.itch.io/people-pack) (mmorwynn) | 3,49 $ (promotion) | même licence | 14 sortes de gens médiévaux (dont garde, chevalier), 3 variantes, **8 directions**, repos, marche, course, attaque… ~27 px, même échelle qu'EAST | Pas de samouraï ; à garder en tête pour un Bastion médiéval |
| [Medieval Strategy (MARCHKEEP)](https://mmorwynn.itch.io/marchkeep) et [Imperial China (JADEKEEP)](https://mmorwynn.itch.io/jadekeep) (mmorwynn) | 6,99 $ chacun (promotion) | même licence | Décors complets de jeu de stratégie (château, ville, champs ; palais, pagodes, ville sur le fleuve), sol en cases 64×32, 4 vues, été/hiver | Décors seulement, pas de personnages |
| [Edo Town](https://antahonist.itch.io/edo-town-feudal-japan-pixel-buildings) (Antahonist) | 3,49 à 6,29 $ | à lire | Bâtiments du Japon féodal en iso (pagode, donjon, sanctuaire, maison de thé…) | Auteur qui publie des centaines de packs ; pas vu de près |
Toujours aucun soldat asiatique en iso dans un pack complet : le samouraï et le ninja de DezrasDragons sont les seuls trouvés.

## Maquette 6 : plus grand, plus détaillé (06/11)
https://claude.ai/artifact/RVrXXUxEURRGwQn6NHis7i — page source `outils/bastion-maquette/source-6.html`, fabriquée par `fabriquer.py 6 <dossier des planches OGA> <dossier east-free-sample>` (plateau de **7×7 cases** : la simulation de la maquette 2 est reprise avec d'autres plans et `N = 7`).
- Cases de 64×32 (tuiles CC0 affichées à 2×), soldats d'environ 38 px (1,5 fois ceux de la maquette 5, contre 8 px avant) ; **zoom 1,7×** par défaut, plateau déplacé au doigt, loupe ⊕/⊖ pour le voir en entier, flèches ⟲ ⟳ pour le tourner.
- Escouades : samouraïs (sabre), arquebusiers (teppō, le mousquetaire), ashigaru (yari, l'hoplite) ; ennemis : ninjas, pirates wakō, et l'oni (le viking repeint : peau rouge, cheveux noirs ; 1,6 fois plus grand).
- **A** : maisons blanches à toits gris, pagode à quatre toits, torii, lanternes, cerisiers, érables et pins dessinés au pixel par le code, au grain des tuiles.
- **B** : les mêmes sol et soldats, avec les bâtiments et arbres de l'échantillon EAST à leur taille (pixels deux fois plus fins que les soldats) : machiya, salle de culte, minka, pagode, torii, renards, lanternes kasuga, bassin, bottes de riz, lanterne de papier, cerisiers, érables, bambous, iris.
- Vitrine des six figurines en grand sous les téléphones.

Retour (06/11) : « c'est toujours pas très joli ; essayons une **vue du dessus** ».

## Maquette 7 : vue du dessus (06/11)
https://claude.ai/artifact/9o9SWWAVKgva4e83xywF2K — page source `outils/bastion-maquette/source-7.html`, fabriquée par `fabriquer.py 7 <dossier Tiny Swords> <dossier Ninja Adventure>` (plan de 9×9 cases propre à la vue du dessus : maisons aux quatre coins, colline au centre, entrées au milieu des bords).
| Pack | Prix | Licence | Contenu |
|---|---|---|---|
| [Tiny Swords](https://pixelfrog-assets.itch.io/tiny-swords) (Pixel Frog), **ancienne version** (Update 010) | gratuit | **CC0** (le fichier s'appelle « TS_old version_CC0 Licensed » ; la nouvelle version gratuite a d'autres conditions, à relire) | tuiles de 64 px qui se raccordent (herbe, sable, falaises, escaliers, eau), chevaliers (guerrier, archer, ouvrier) et gobelins (torche, dynamite, tonneau) en 4 couleurs, animés dans plusieurs directions en cases de 192 px ; maisons, tour, château (avec ruines), arbres au vent, moutons, décors |
| [Ninja Adventure](https://pixel-boy.itch.io/ninja-adventure-asset-pack) (Pixel-boy et AAA) | gratuit | **CC0** | tuiles de 16 px (sol, chemins, falaises, eau, maisons japonaises, torii, statues, arbres dont cerisiers), plus de 90 personnages en 4 directions (samouraïs, ninjas, moines, démons…), monstres et boss (tengu, samouraïs géants, kappa…), effets, sons et musiques |
- **Une case du jeu = 2 × 2 tuiles** : les soldats font une tuile de haut, les maisons 2 × 3 (Tiny Swords) ou 4 × 3 tuiles (Ninja Adventure). Zoom par défaut (11 tuiles de large pour A, 9 pour B), plateau déplacé au doigt, loupe ⊖/⊕ pour le voir en entier ; forêt tout autour (pas d'île).
- Sol dessiné une fois dans une toile à part (herbe, chemins des entrées jusqu'au pied de la colline, colline à falaises avec escalier) ; arbres, maisons, tour, soldats triés par leur pied.
- **A · Tiny Swords** : guerriers (épées), archers (tir dans 5 directions), ouvriers à la hache ; gobelins à torche et à dynamite, chef gobelin violet 1,5 fois plus grand ; maisons bleue, rouge, jaune (ruine quand elles brûlent), tour au sommet.
- **B · Ninja Adventure** : samouraïs au casque doré, archers au chapeau de paille, lanciers bleus ; ninjas noirs, gris et rouges ; le tengu rouge en chef ; quatre maisons japonaises, temple au toit rouge et torii au centre, cerisiers et arbres verts autour.
- Leçon : Tiny Swords trace un contour sombre au bord de chaque plateau ; deux étages de colline et des chemins qui la traversent donnaient un quadrillage : un seul étage, des chemins qui s'arrêtent au pied.

Retour (06/11) : **« Tiny Swords est vraiment bien »** ; il y a aussi des lanciers dans la version actuelle ; chercher d'autres packs du même genre (et le pack payant de l'auteur qui ajoute régulièrement des unités).

## L'univers Tiny Swords (relevé du 06/11)
| Pack | Prix | Licence | Contenu |
|---|---|---|---|
| [Tiny Swords, Free Pack](https://pixelfrog-assets.itch.io/tiny-swords) (version actuelle, déc. 2025) | gratuit | usage libre (commercial, modifications) ; **pas de redistribution, revente ni reconditionnement**, même modifié ; crédit bienvenu | guerrier, **lancier**, archer, **moine** (soigneur), ouvrier en 5 couleurs (bleu, rouge, violet, jaune, noir) ; 8 bâtiments (maisons, caserne, tours, château) en 5 couleurs ; terrain (5 couleurs d'herbe, hauteurs, escaliers, eau animée, ombres), buissons et rochers animés, arbres, moutons, or, effets (poussière, feu, explosions), interface. **Pas d'ennemis** : l'armée rouge peut servir d'ennemi |
| Tiny Swords, ancienne version (Update 010) | gratuit | CC0 | celle de la maquette 7 (guerrier, archer, ouvrier, gobelins) |
| [Enemy Pack](https://pixelfrog-assets.itch.io/tiny-swords) (même page) | **15 $** | même licence | **22 ennemis**, 8 de plus annoncés (« dernière ligne droite ») : gobelins à torche, gnolls à lance, requins, crânes chamanes, voleurs encapuchonnés, squelettes, bombardiers, minotaure, gnome, moine au chapeau de paille, araignées, tortues, lézards, ours, serpents, **troll géant**, chauves-souris… |
| [Tiny Swords: Warfare](https://pixelfrog-assets.itch.io/tiny-swords-warfare) | **15 $** en promotion (30 $ ; minimum affiché 30 $ hors promo) | même licence | **accès anticipé, enrichi régulièrement** : roi, berserker, épéiste, lancier à cheval, catapulte, en 5 couleurs ; feuille de route : hallebardier, porte-masse, marteau de guerre, lanceur de javelot, arbalétrier, éclaireur, tambour, porte-bannière, bombardier, porte-torche, bélier, chien de guerre, magicien ; écuries, atelier de siège, camp, tour de mage, forteresse, citadelle ; murs en bois et en pierre, tours, baliste, canon ; port, barques |
Autres packs « à la Tiny Swords » regardés, tous moins bons : [Tiny Kingdom Armies](https://two-faces-studio.itch.io/tiny-kingdom-armies) (3,99 $, 9 unités, pas de marche), [Medieval Units](https://citrusgames.itch.io/mediaval-units) (gratuit, 32 px, simple), [Medieval Army Pack](https://mtpixls.itch.io/medieval-army-pack) (gratuit, soldats au repos seulement), [Pixel Heroes and Foes](https://swordforge.itch.io/pixel-heroes-and-foes-fantasy-pixel-art-sprite-pack) (vue de côté). Les autres packs de Pixel Frog (Tiny RPG Character, Sunnyside World) ne sont pas des armées.
Proposition : Free Pack (gratuit) pour nos escouades (guerriers, lanciers, archers, moines) ; ennemis = l'armée rouge du Free Pack, ou l'Enemy Pack (15 $) pour des monstres et un troll en chef ; Warfare plus tard si on veut des murs, des tours et des engins de siège.

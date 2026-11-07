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

**Décision (06/11) : on part sur le médiéval avec Tiny Swords** (l'Empire de l'Est est abandonné) ; maquette refaite avec le Free Pack.

## Maquette 8 : Tiny Swords, Free Pack (06/11)
https://claude.ai/artifact/Jwyug7BrbEHE1br4TinE5J — page source `outils/bastion-maquette/source-8.html`, fabriquée par `fabriquer.py 8 <dossier Free Pack> <dossier ancienne version>` (95 images ; le Free Pack n'est pas dans le dépôt).
- Même moteur que la maquette 7 (case = 2 × 2 tuiles de 64 px, zoom 12 tuiles, loupe pour tout voir, déplacement au doigt) ; maisons rapprochées du centre ; château sur la colline.
- Nouveau tilemap (9 × 6 tuiles par couleur : herbe raccordée, plateau surélevé et falaise) ; chemins de sable et maison en ruine de l'ancienne version (CC0), le Free Pack n'en ayant pas.
- Figurines en bandes d'images (192 px, lancier 320 px) : **guerriers** (repos, course, deux coups, **garde** derrière le bouclier pendant MUR), **archers** (tir), **lanciers** (coups vers la droite, en bas à droite, en bas, en haut à droite, en haut), **moines** (deux devant le village, qui lèvent leur bâton et font briller le soin sur une escouade qui se soigne près des maisons).
- Ennemis : guerriers et lanciers de l'autre armée, chef = lancier 1,5 fois plus grand ; maisons qui prennent feu (flammes animées du pack) puis tombent en ruine.
- **A** : prairie claire (couleur d'herbe 1), bleus contre rouges. **B** : herbe sombre (couleur 4), jaunes contre noirs.

Retour (06/11) : **A retenue**. L'utilisateur veut l'**Enemy Pack** (troll, monstres) : il s'achète sur la page de Tiny Swords en payant 15 $ ou plus au « Download Now » (prix libre) ; il enverra le zip.

## Packs achetés (06/11) et maquette 9
L'utilisateur a acheté l'**Enemy Pack** et **Warfare** ; récupérés avec l'API itch.io (le proxy de l'environnement ajoute sa clé) : `GET https://api.itch.io/profile/owned-keys` (clés d'achat : Tiny Swords 161477580, Warfare 161477642), `GET /games/<id>/uploads?download_key_id=<clé>`, puis `GET /uploads/<id>/download?download_key_id=<clé>` qui **redirige (302)** vers le fichier (suivre avec `curl -L`). Fichiers : `Tiny Swords (Enemy Pack).zip` (upload 19101739, 2,8 Mo), `Warfare_001.zip` (upload 19996771, 3,1 Mo). Pas dans le dépôt pour l'instant (pas de redistribution ; à ranger dans le dossier du jeu, avec les crédits, quand on le programmera).
- **Enemy Pack** : 23 monstres (ours, poisson-bombe, bourdon, chauve-souris géante, gnoll lanceur d'os, gnome, gnome à fronde, requins à pagaie et à harpon, chaman maléfique, diablotin, lézard, minotaure, panda, crâne/squelette, serpent, gobelin à lance, araignée, voleur, gobelin à torche, **troll** (coup préparé, frappe, récupération, mort), tortue) ; bonus : cabanes gobeline et de pêcheur, cabane et tour de gnomes, tour pirate, canon (5 directions), bateaux, grotte, arbre mort, barrière en bois, crânes et os, cochon et gobelin chevaucheur.
- **Warfare** (accès anticipé, version 001) : roi, berserker, épéiste, cavalier, catapulte (charger, tirer la pierre), en 5 couleurs, avec portraits.
- Images en bandes de cases carrées : 192 px (gobelin à torche, gnoll, squelette, voleur), 256 (gobelin à lance), 320 (minotaure), 384 (troll, plus de 3 tuiles de haut).

Maquette 9 : https://claude.ai/artifact/6PrQpKxp5vk34jaG7EmUSF — page source `outils/bastion-maquette/source-9.html`, `fabriquer.py 9 <Free Pack> <ancienne version> <Enemy Pack> <sortie>` ; la direction A de la maquette 8 (prairie, armée bleue) contre les monstres : **A** gobelins à torche et à lance, gnolls, **troll** en chef ; **B** squelettes et voleurs, **minotaure** en chef ; pour la maquette, le chef vient dès la 1re vague.

Retour (06/11) : « fais une maquette pour voir ce que ça donnerait **comme un Wargroove** ; au lieu d'une unité sur la carte, un groupe comme dans la maquette ».

## Maquette 10 : tactique au tour par tour, façon Wargroove (06/11)
https://claude.ai/artifact/VdGCvnzk4mfP2V72h8dEiB — page source `outils/bastion-maquette/source-10.html` (moteur à part, sans la simulation des maquettes précédentes), `fabriquer.py 10 <Free Pack> <ancienne version> <Enemy Pack> <Warfare> <sortie>` (58 images). Jouable :
- Carte de **7 × 11 cases** (une case = 2 × 2 tuiles de 64 px, quadrillage léger) : plaine, forêt (+2 déf., coûte 2), colline (+3, coûte 2), chemin (0), village (+3), lac (infranchissable) ; château bleu en bas, cabane gobeline en haut ; zoom 5,6 cases de large, défilement au doigt.
- **Escouades** : 1 à 4 soldats selon les PV (sur 10, pastille bleue ou rouge) ; les chefs sont seuls (pastille avec une couronne). Bleus : **roi** (Warfare, le perdre = défaite), guerriers, lanciers (×1,6 contre cavaliers, ×1,8 contre le troll), archers (portée 2-3, ne ripostent pas au contact), moines (soignent +3 un allié voisin), cavaliers (Warfare, marche 6, forts contre archers, gnolls, moines). Monstres : gobelins à torche, gobelins à lance (forts contre les cavaliers), gnolls (lancent des os à 2 cases), **troll** (chef, garde sa colline tant que personne n'approche à 5 cases ; l'abattre = victoire).
- Tour du joueur : toucher une escouade → cases bleues (déplacement, coût du terrain, on traverse ses alliés) et cases rouges pâles (ennemis atteignables) → toucher une case → cibles en rouge (ou vertes pour les moines) → attaquer, ou ATTENDRE ; ANNULER avant de bouger ; FIN DU TOUR (automatique quand tout le monde a joué). Escouades qui ont joué en gris.
- Dégâts = force × bonus × (PV/10) × (1 − défense du terrain × 9 %) ± 8 % ; riposte à 80 % si la cible survit et peut atteindre l'attaquant.
- Monstres : chacun choisit la case et la cible qui rapportent le plus (le roi vaut plus, les blessés aussi), sinon avance vers l'armée bleue.
- Panneau du bas : portrait (avatars des packs), PV, soldats, marche, portée, terrain.
- **A** : le combat se joue sur la carte (coup, flèche ou os qui vole, chiffre des dégâts, soldats qui tombent dans la poussière, riposte). **B** : chaque attaque ouvre une **bande de gros plan** au milieu de l'écran (les deux escouades en grand face à face, coup puis riposte, soldats qui disparaissent).
- Essai automatique dans Chromium : choix, déplacement, attaque, tour des monstres, pas d'erreur.

Retour (06/11) : l'utilisateur **préfère le temps réel à la Bad North** ; idée : un **mélange de RTS et de tower defense** : des ouvriers ramassent des ressources (économie à gérer comme dans un RTS) et on place des soldats pour défendre le château.

## Maquette 11 : RTS et tower defense (06/11)
https://claude.ai/artifact/LLw2PCz722gndc8bumRK5F — page source `outils/bastion-maquette/source-11.html` (moteur à part), `fabriquer.py 11 <Free Pack> <ancienne version> <Enemy Pack> <sortie>` (65 images). En temps réel :
- Carte de 9 × 9 cases (2 × 2 tuiles) : château au centre, trois chemins (nord, ouest, est) par où viennent les monstres ; en bas, le bois (arbres, souche quand on vient de couper), l'or (filons), les moutons qui broutent ; caserne, archerie, maisons en décor ; forêt autour.
- **Économie** : 3 ouvriers au départ (bois, or, viande) ; chacun marche jusqu'à sa ressource (hache, pioche, couteau), travaille 2 à 2,6 s, rapporte 8 au château (bûches, pépite, viande sur l'épaule) ; rangée OUVRIERS : toucher une ressource y envoie un ouvrier de plus (pris là où il y en a le plus) ; + OUVRIER = 10 viande. Départ : 40 bois, 40 or, 30 viande.
- **Recrutement** : guerriers (10 or, 10 viande ; 4 soldats), archers (15 bois, 10 or ; tir à 2,6 cases), lanciers (15 or, 10 bois ; ×2,5 contre le troll), moines (20 or ; 2 moines qui soignent les escouades proches). Une escouade de guerriers offerte au départ.
- **Vagues** : 8 vagues, la 1re à 35 s puis toutes les 45 s, alerte 6 s avant (flèche rouge sur l'entrée) ; gobelins à torche, gobelins à lance, gnolls (os à 2 cases) ; le **troll** aux vagues 4 et 8 ; à partir de la 5e, deux chemins à la fois. Les monstres attaquent les escouades qu'ils croisent, sinon le château (barre de vie en haut, flammes sous 60 %). Château détruit = défaite ; 8 vagues tenues = victoire.
- **A · escouades libres** : l'escouade recrutée sort du château ; la toucher puis toucher le sol pour l'envoyer ; elle combat les monstres proches (sauf pendant un ordre de marche).
- **B · emplacements** : 6 cercles près des chemins ; toucher une carte puis un cercle libre : l'escouade y va, défend les abords (2,4 cases) et revient à sa place.
- Essai automatique (Chromium) : récolte, recrutement, vagues, combats, sans erreur ; sans action du joueur, le château de A tombe à la 3e vague (B tient avec ses archers et lanciers).

**Décision (06/11) : A (escouades libres).** À reprendre : **l'équilibrage**, **les bâtiments**, et peut-être **l'amélioration des unités selon l'expérience** qu'elles accumulent.

## Propositions pour la suite (06/11, à valider)
**Bâtiments** (construits par les ouvriers au marteau — le pack a « Interact Hammer » — sur des emplacements de chantier ; images du Free Pack, ruines de l'ancienne version) :
| Bâtiment | Coût | Effet |
|---|---|---|
| Château | — | cœur du village ; le perdre = défaite ; peut s'améliorer (plus de PV, tir d'archers) |
| Maison | bois | +2 ouvriers et +1 escouade possibles (plafonds de population) |
| Caserne | bois + or | débloque les guerriers puis les lanciers |
| Archerie | bois | débloque les archers |
| Monastère | or | débloque les moines |
| Tour | bois + or | **garnison d'archers** : on y envoie une escouade d'archers, qui monte dessus (dessinée sur la plateforme du haut), tire plus loin et ne peut pas être attaquée au contact tant que la tour tient ; vide, la tour ne tire pas |
| Murs / palissades (Warfare plus tard) | bois | ralentissent les monstres sur un chemin |
Les monstres peuvent attaquer les bâtiments (flammes, puis ruine à reconstruire).

**Expérience** : chaque escouade gagne de l'expérience en tuant ou en survivant à une vague ; 3 grades (étoiles au-dessus de l'escouade) : vétérans (+20 % de dégâts), élite (+20 % de PV, un soldat de plus), héros (+20 % de dégâts et de PV en plus). **Pas de capacité spéciale** (décision du 06/11) : ni dans les grades, ni sur les cartes d'escouade (le bouton MUR, SALVE, CHARGE des maquettes disparaît). Une escouade décimée revient au château pour se reformer (contre de la viande) et garde son grade : on s'attache à ses troupes, comme dans Bad North.

**Population** (décision du 06/11) : le nombre d'escouades est limité (par exemple 3 au départ, +1 par maison, plafond affiché à côté des cartes de recrutement, « 3/4 ») ; les ouvriers ont leur propre plafond.

**Équilibrage** : réglé avec un simulateur (comme pour les autres jeux) : revenus par minute selon le nombre d'ouvriers, coût d'une défense « suffisante » par vague, et une première partie où l'on peut perdre sans tout comprendre ; un ralenti quand on touche une escouade (comme dans les maquettes 1-4) aiderait sur téléphone.

Retour (06/11) sur ces propositions : « pas mal, mais **pas de capacité spéciale** » ; **limite de population** pour les soldats ; voir si l'on peut **mettre des archers en garnison dans une tour** (oui : la tour du Free Pack, 128 × 256 px, a une plateforme en haut où dessiner 2 ou 3 archers ; à montrer dans la prochaine maquette ou dès la session 1).

**Structure** (décisions du début) : niveaux fixes (une carte par niveau, de nouveaux monstres et bâtiments au fil des niveaux) + défi du jour (carte et vagues tirées du jour, une seule tentative classée).

## Session 1 : le laboratoire (07/11)
Demande de l'utilisateur : une première version jouable qui sert de **laboratoire** pour essayer les règles et l'équilibrage. Dossier `bastion/` (notes : [`bastion/CLAUDE.md`](../bastion/CLAUDE.md)), sur l'accueil en **démo** (étiquette LABO).
- **Règles** à part (`bastion/regles.js`, aussi sous Node) ; carte et économie de la maquette 11 (direction A, escouades libres) ; **tous les nombres** sont dans `DEFAUT` et se règlent dans le jeu.
- **Bâtiments** : 8 emplacements (cercles) ; toucher un emplacement → MAISON (+1 escouade, +2 ouvriers), CASERNE (lanciers), ARCHERIE (archers), MONASTERE (moines), TOUR ; un ouvrier prend son marteau (chantier de l'ancienne version, barre d'avancement), puis retourne à son métier ; les ouvriers au marteau réparent aussi. Les guerriers se recrutent au château. Les monstres frappent les bâtiments qu'ils longent (flammes sous 50 %, ruine).
- **Population** : 3 escouades et 4 ouvriers au départ, plus par maison (« 2/3 » à côté des titres).
- **Tour à garnison** : des archers choisis puis envoyés sur une tour finie montent sur la plateforme (3 dessinés) ; portée +1,2 ; les monstres attaquent la tour et pas eux ; tour détruite = archers remis au sol.
- **Grades** : XP = 10 % des PV du monstre abattu (au dernier qui frappe) + 4 par vague survécue ; VETERANS 25 (+20 % de dégâts), ELITE 60 (+20 % de PV, un soldat de plus), HEROS 120 (+20 % en plus) ; étoiles au-dessus de l'escouade. **Pas de capacité spéciale.**
- **Renforts** : une escouade hors combat près du château regagne un soldat toutes les 2 s contre 4 viande ; une escouade anéantie est perdue avec son grade.
- **Vagues** : 10 ; 3 monstres + 2 par vague, PV +15 % par vague ; gnolls dès la 3e ; troll aux vagues 4, 8 et à la dernière ; deux chemins dès la 5e ; alerte 6 s avant (flèche rouge).
- **Ralenti** : le temps passe à 35 % pendant qu'une escouade est choisie.
- **LABO** : vitesse (pause, ×½ à ×4), triches (+100 de tout, vague maintenant, château invincible, tout débloqué), **robot** qui joue la partie en cours, **simulateur** (30 parties du robot avec les réglages du formulaire, même non appliqués : victoires, où l'on perd), **journal** de la partie (par vague : durée, PV du château, tués, pertes, escouades, ouvriers, stock), **réglages** (par groupe, valeur d'origine à droite, modifiés en jaune ; APPLIQUER ET REJOUER, ORIGINE, COPIER / CHARGER pour s'échanger des réglages).
- **Simulateur** en ligne de commande : `node outils/bastion-simulateur.js 100 '<réglages copiés>'` ; avec les réglages d'origine, le robot (stratégie simple et fixe) gagne environ 1 partie sur 3 et tient 9,5 vagues en moyenne ; sans rien faire, le château tombe à la 3e vague. Le robot amasse de l'or et de la viande qu'il ne dépense pas : piste pour l'équilibrage (moins d'or, ou plus de choses à acheter).
- Pas encore : niveaux, défi du jour, sons, amélioration du château, murs.

Retours de l'utilisateur sur la session 1 (07/11) : les personnages traversent les bâtiments ; on ne les voit plus derrière ; utiliser au maximum l'interface des packs ; carte à rééquilibrer (ennemis trop vite au contact : chemins plus longs, avec des places pour des tours) ; tours plus grosses (pour grossir les archers dedans) ; montrer la zone de soin des moines, qui grandit avec leur grade ; moines en garnison dans les tours ; débloquer des catapultes, qui vont aussi dans les tours (dégâts de zone, fragiles, lentes, grande portée).

## Session 2 : retours sur le laboratoire (07/11)
- **Nouvelle carte 11 × 14** : château en bas au milieu, trois chemins sinueux (nord : deux lacets, 15 cases ; ouest : rejoint le nord, 10 cases ; est : longe le côté droit, 10 cases ; avant : 4 cases). 10 emplacements : 8 le long des chemins (pour les tours), 2 près du château. Bois, or et moutons derrière le château. Première vague à 40 s.
- **Contournement** : le château et chaque bâtiment sont des obstacles (ellipses) ; ouvriers, escouades et monstres les longent (en gardant le côté choisi) et n'entrent jamais dedans ; un ordre donné sur un bâtiment vise le bord.
- **Transparence** : un bâtiment (château compris) devient à moitié transparent quand quelqu'un passe derrière.
- **Tours** dessinées 1,5 fois plus grandes ; leurs occupants à taille normale sur la plateforme (3 archers, 2 moines ou la catapulte).
- **Moines** : zone de soin visible (cercle vert en pointillés, plus marqué quand l'escouade est choisie) ; portée 1,7 + 0,3 par grade, + 1,5 dans une tour ; leur soin profite aussi du bonus de grade.
- **Catapulte** (Warfare) : débloquée par l'**atelier** (image de la maison 3 du Free Pack, en attendant un atelier de siège dans Warfare) ; 40 bois, 30 or ; une machine, 60 PV, lente (0,45), ne se bat pas au contact ; une pierre toutes les 3,5 s à 4,2 cases, 40 dégâts dans un rayon de 0,9 (explosion du pack) ; en tour : portée +1,2. Garnison : archers, moines, catapulte.
- **Interface** faite avec les pièces du pack (UI Elements) : table en bois (bandeau du bas, volet CONSTRUIRE), papier (ressources, cartes, labo), parchemin (menu), boutons bleus et rouges, rubans (titres, vague, messages), barre de vie, icônes (bois, or, viande, marteau, engrenage du LABO). Planches recollées en images compactes (`ui-*.png`) pour les bordures CSS.
- Équilibrage d'origine : 3 monstres + 1,5 par vague, PV +12 % par vague ; le robot gagne environ 1 partie sur 6 et tient 8,5 vagues en moyenne (il bâtit ses tours avant ses maisons et place mal ses escouades : un joueur attentif fait mieux).

Retour (07/11) : portraits des guerriers et des lanciers inversés (corrigé) ; **les lanciers deviennent l'unité de départ** (recrutés au château, escouade offerte, 10 bois et 10 or, 24 PV, ×2,5 contre le troll) et **les guerriers deviennent des CHEVALIERS**, débloqués par la caserne (20 or et 10 viande, 34 PV, 5,5 dégâts par seconde). Le robot gagne alors 11 parties sur 30 (vague moyenne 9,2). Cache v94.

## Maquette 12 : le bestiaire (07/11)
https://claude.ai/artifact/Lgd7UTdT8JTAUq66Uyz1CX — page source `outils/bastion-maquette/source-12.html`, `fabriquer.py 12 <Free Pack> <Enemy Pack> <Warfare> <sortie>` (2,3 Mo). Demande de l'utilisateur : voir toutes les unités des packs. Grille des **32 unités** (Free Pack en bleu : archer, lancier, moine, ouvrier, guerrier ; Enemy Pack : 22 monstres ; Warfare en bleu : berserker, catapulte, cavalier, roi, épéiste), filtres par pack et « Dans Bastion » (point doré) ; l'unité choisie montre au-dessus ses **144 animations** en boucle (nombre d'images, taille), vitesse réglable, fond herbe, damier ou sombre.

Ajout (07/11) : onglet **Bâtiments** (24) : les 8 bâtiments du Free Pack dans ses 5 couleurs (archerie, caserne, château, 3 maisons, monastère, tour), ceux de l'Enemy Pack (cabane gobeline et cabane de pêcheur animées, cabane et tour de gnomes, tour pirate sur terre et dans l'eau, grotte, canon en 5 directions et son boulet, barrière, arbre mort, crânes et os) et ceux de l'ancienne version CC0 (château, maison et tour en 4 couleurs avec leurs états « en construction » et « détruit », maison gobeline, tour en bois animée, mine d'or). Les animations rangées dans « Extra » de l'Enemy Pack sont rattachées à leurs monstres (garde, coup reçu, mort du troll, coup fort, sorts du chaman) ou deviennent des unités (cavalier sur cochon, cochon, bateau, bateau-hippocampe) : 36 unités, 168 animations. `fabriquer.py 12 <Free Pack> <Enemy Pack> <Warfare> <ancienne version> <sortie>` (3,6 Mo). Warfare n'a pas encore de bâtiment.

## Suivi des mises à jour des packs (07/11)
Warfare, Tiny Swords et le Fantasy Battle Pack (Résistance) sont dans `outils/packs-suivis.json` ; le workflow « Suivi des packs » regarde chaque lundi leur page publique et leur devlog et ouvre une issue (étiquette `packs`) s'il y a du nouveau ; le téléchargement se fait ensuite par Claude (API itch.io). Détails : skill `packs-itch`.

## Session 3 : village, niveaux, promotions (07/11)
Retours de l'utilisateur : tour en bois (plus fragile, moins chère) ; un village à part avec ses emplacements, les tours seulement le long des chemins ; améliorer les bâtiments pour qu'ils forment des unités déjà aguerries ; un seul exemplaire de l'archerie, du monastère… ; promotions : lanciers → cavaliers (le sprite a une lance), chevaliers → épéistes ; pas encore d'idée pour les archers.
- **Carte 11 × 16** : sous le château, le **village** (sol d'une autre herbe, couleur 4 du Free Pack) avec 8 emplacements pour maisons, caserne, archerie, monastère, atelier ; les 8 emplacements le long des chemins ne prennent que des tours. Bois, or et moutons descendus d'un rang (au sud du village).
- **Un seul** exemplaire de la caserne, de l'archerie, du monastère et de l'atelier (le menu affiche « DÉJÀ FAIT »).
- **Tour en bois** (ancienne version CC0, animée, avec son chantier) : 15 bois, 7 s de travaux, 110 PV, portée +0,7 et soin +0,9 (tour de pierre : 30 bois et 20 or, 300 PV, +1,2 et +1,5) ; même garnison.
- **Niveaux** : toucher la caserne, l'archerie, le monastère, l'atelier (ou le château) ouvre AMÉLIORER ; prix = prix du bâtiment × niveau actuel, des ouvriers font les travaux (temps de construction × niveau) ; niveau 2 → recrues VÉTÉRANS, niveau 3 → ÉLITE ; étoiles sous le bâtiment ; un bâtiment amélioré a 25 % de PV en plus par niveau. Le château s'améliore sans ouvriers (60 bois et 60 or × niveau) : +30 % de PV par niveau, lanciers aguerris.
- **Promotions** (caserne niveau 2) : une escouade choisie montre PROMOUVOIR ; lanciers → **cavaliers** (Horseman de Warfare : 36 PV, 5 dégâts/s, vitesse 2, ×2 contre le troll ; 25 or, 15 viande), chevaliers → **épéistes** (Swordsman : 46 PV, 7 dégâts/s ; 30 or, 15 viande). Grade et blessures gardés.
- Archers : **pas de promotion pour l'instant** (décision du 07/11) ; aucun archer monté dans Tiny Swords (seulement dans le Fantasy Battle Pack, d'un autre style) ; on attend les **arbalétriers** annoncés par Warfare (le suivi des packs préviendra).
- Équilibrage d'origine : 7 par voyage (les ressources sont plus loin), 3 monstres + 2 par vague ; le robot gagne environ 1 partie sur 2 (il n'améliore rien et ne promeut personne).

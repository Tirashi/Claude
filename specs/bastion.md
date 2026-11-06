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

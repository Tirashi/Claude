# Maquette « Escadrille pixel » (17/11) : `maquettes/escadrille-pixel.html`
Référence de l'utilisateur : captures de « fighterv2 » sur forge.ui8.ai (shoot'em up en 3D pixelisée : mer et îles, traînées, boutons LOOP / VIEW / GUN / MISSILE / BOOST).
- Vraie 3D (Three.js r128) rendue dans une cible 180 × 320 (NearestFilter), puis passe finale : couleurs arrondies à 7 niveaux + tramage de Bayer 4 × 4 ; toile agrandie en `image-rendering: pixelated`.
- Relief infini en carreaux de 200 (5 × 5 autour de l'avion), couleurs par face (mer profonde, haut-fond, écume, plage, 3 verts, rocher) ; mer = plan texturé d'écume (NearestFilter) recalé par pas de 64 ; nuages = sprites pixel.
- Vol : lacet, tangage (glisser vers le haut = piqué), roulis, looping (LOOP), tonneau (deux touchers), canon, missiles à tête chercheuse, pilote automatique.
- `source.html` : `/*DONNEES*/` → `const MODELES={racing, intercepteur}` (GLB Edenpunk réduits par `outils/vol-3d/glb_reduire.py`).

## Version 2 (17/11, retours de l'utilisateur : haut de l'image bizarre, vaisseau pas joli, décor pas assez pixelisé, couleurs)
- Plus de tramage global (il faisait fourmiller tout le ciel) : **palette fixe** de 29 couleurs relevée sur la capture de référence ; la passe finale donne à chaque pixel la couleur la plus proche.
- **Ciel** : texture de larges bandes unies avec 3 lignes de damier à chaque frontière (sphère, NearestFilter) ; brouillard à la couleur de l'horizon.
- **Sol** : texture de 64 × 64 par carreau de 200 (≈ 3 m par pixel), couleur par pixel (`couleurSol` : mer profonde et écume rare, haut-fond, liseré blanc, plage, 4 verts selon la pente et le hasard, rochers), MeshBasicMaterial ; géométrie aplatie au niveau de la mer ; au plus 2 carreaux neufs par image.
- **Avions construits dans le code** (`chasseur()` : fuselage hexagonal, nez, verrière, ailes delta extrudées, bouts d'ailes rouges, double dérive inclinée, deux réacteurs et leurs flammes) ; les ennemis : le même en gris clair et orange. Plus de GLB : `MODELES={}`.

## Version 3 (17/11, « l'avion n'est pas pixelisé du tout »)
- Les avions (joueur et ennemis, calque 1 via `versCalque`) sont dessinés à part dans une cible de **90 × 160** (deux fois moins de pixels que le décor), fond transparent ; la passe finale les pose sur le décor avec un **contour sombre d'un pixel** (voisins de la cible des avions), puis la palette. Les lumières sont activées sur les deux calques. Ailes épaissies (0,24) pour rester lisibles de profil.

## Version 4 (17/11, « même comme ça c'est pas très joli » ; pas d'avion vu de dos en pixel art sur itch.io)
- Le joueur est un **sprite pixel art** : `chasseur.py <sortie.png>` dessine le chasseur vu de dos (64 × 40) sous 16 angles de tonneau × 3 inclinaisons, avec des rampes de gris faites à la main, bouts d'ailes et bande rouges, verrière, double dérive, réacteurs, contour d'un pixel ; écrit aussi `.json` (taille, positions des tuyères par image). Planche et json copiés ici (`chasseur.png`, `chasseur.json`).
- Dans le jeu : le modèle 3D du joueur est invisible (il sert aux calculs) ; `placerSprite()` projette sa position, choisit l'angle de tonneau d'après l'aile droite projetée à l'écran et l'inclinaison d'après ce qu'on voit du dessus, et pose le sprite (et deux flammes qui vacillent) par-dessus l'image finale, calé au pixel. `/*DONNEES*/` → `const MODELES={};const SPRITE={src,w,h,nr,tuyeres}`.
- Bug corrigé : `Vector3.randomDirection` n'existe pas dans three r128 (les explosions plantaient).

## Version 5 (17/11 : « c'est beaucoup mieux » ; flammes décalées ; vol libre et vagues d'ennemis)
- Flammes posées pile sur les tuyères : ancre entière du sprite (haut à `py + 25`), cœur 2 × 2 jaune ou orange, queue de 1 px qui vacille.
- **Vagues** (`vague()`) : 1 + 2 × n chasseurs (11 au plus) en V à 300 m devant, ils foncent (« arrivee ») puis tournent devant le joueur (« combat », rayon 18 à 46) et tirent des paires de balles orange avec avance ; blindage 100 (−7 par balle, pas pendant un tonneau), bordure orange quand on est touché, « ABATTU » à 0 ; vague finie : bonus 500 × n et +30 de blindage ; HUD : score, vague, ennemis, blindage.
- Pilote automatique : vise l'ennemi le plus proche, tire quand il est dans un cône de 0,3 rad, remonte sous 14 m.
- Sommets : roche selon la pente, neige au-dessus de 34 m (plus de damier gris et blanc).

## Version 6 (17/11 : ennemis à reculons, boutons carrés peu pratiques)
- Ennemis : `Object3D.lookAt` tourne l'axe +Z vers la cible, le chasseur a le nez en −Z : modèle retourné (`rotation.y = π`) dans son groupe.
- Commandes de jeu de tir sur téléphone : **joystick** qui apparaît sous le pouce gauche (anneau 104 px, bille bornée à 46 px ; joystick vers le haut = l'avion monte, vers le bas = il descend (choix de l'utilisateur)), suivi par `pointerId` ; **boutons ronds** à droite en arc : FEU (84 px, à garder appuyé), MISSILE, LOOP, TONNEAU ; VUE en petit en haut à droite. Le pilote automatique reprend 4 s après qu'on a tout lâché.

## Sensibilité (17/11 : « ça va trop vite »)
- Zone morte de 12 % au centre du joystick ; virage en courbe (dx × |dx| × 0,75, au lieu de dx × 1,7) avec une vitesse de virage lissée (`S.vyaw`) ; tangage plus doux (−dy × 0,7, borné à ± 0,75 rad, suivi en 1/1,3 s au lieu de 1/2,2 s).
- Puis « un petit peu plus rapide » : virage dx × |dx| × 1, tangage −dy × 0,9 (borné à ± 0,85, suivi en 1/1,7 s), lissage du virage ×3.

## Viseur et verrouillage (17/11 : « on ne voit pas bien où on vise », « les missiles devraient se lock »)
- Toile 2D par-dessus (même 180 × 320, `viseur()`) : croix pixel art 120 m devant l'avion ; coins autour de chaque ennemi visible (gris, rouges dans l'axe à moins de 0,06 rad).
- Verrouillage (`LOCK`) : l'ennemi le plus près de l'axe (cône 0,3 rad, moins de 240 m) ; cadre jaune et orange qui se resserre pendant 0,7 s, puis cadre rouge épais + « LOCK » qui clignote et « MISSILE PRET ». Le missile ne poursuit que la cible verrouillée (virage plus serré), sinon il part tout droit.
- Balles traçantes plus longues et jaunes.

## Looping et vagues variées (17/11 : « le looping marche bizarrement », ennemis trop faciles en ligne)
- Looping : (1) en fin de boucle, l'angle valait 2π et le tangage le ramenait doucement à 0 : l'avion refaisait la boucle à l'envers → on retire les tours complets ; (2) la caméra faisait `up.lerp` de +1 à −1 en passant par 0 (perte d'orientation) → caméra par quaternion (`S.qc.slerp`) ; (3) pas de virage au joystick pendant la boucle.
- Bug : un bouton pressé avant le joystick donnait `S.dy` indéfini → NaN, jeu figé (corrigé : `dx:0, dy:0` au départ).
- `window.Escadrille = {S, ennemis}` pour les tests.
- Vagues (`MOTIFS`) : de face, par derrière, sur les flancs, par le dessus, encerclement (3 groupes), en deux temps (6 s d'écart) ; formation en V, en ligne ou dispersée ; vague 1 de face, vague 2 sur les flancs, puis au hasard ; file d'attente `V.file`.
- Rôles au combat : `tournoi` (tourne devant), `chasse` (se cale 32 m derrière le joueur), `passe` (traverse puis s'éloigne à 260 m et revient) ; esquive (écart de 0,8 s) si l'ennemi reste dans le viseur 0,6 s (0,35 s pour un as) ; **as** dès la vague 4 (30 %, 5 points de vie, plus vifs, accent rouge). Ils ne tirent que s'ils font face au joueur.
- Flèches au bord de l'écran pour les ennemis hors de vue (rouge clignotant s'ils sont derrière à moins de 80 m).

## Commandes PC (17/11)
- Clavier (codes physiques, donc AZERTY et QWERTY) : ↑/Z/W monter, ↓/S descendre, ←/Q/A et →/D virer (rampe de 0,25 s comme un joystick, `clavierPilote`) ; Espace canon (maintenu), E missile, R looping, F ou Maj tonneau, V vue. Les touches déclenchent les mêmes gestionnaires que les boutons ronds (`PointerEvent` envoyé au bouton) ; flèches et Espace ne font pas défiler la page quand le jeu est visible.
- Aide des touches en bas à gauche sur écran à souris (`@media (hover:hover) and (pointer:fine)`), estompée dès qu'on joue au clavier ; la souris garde le joystick (cliquer-glisser) et les boutons.

## Chasseurs qu'on ne pouvait pas semer (17/11)
- Avant : le rôle `chasse` visait un point 32 m derrière le joueur, recalculé à chaque image (il suivait instantanément virages et loopings) et la vitesse tournait sans limite : flèches rouges permanentes, ennemis jamais visibles.
- Maintenant : poursuite du joueur lui-même (avance ≤ 25 m) ; **virage limité** (1,1 rad/s, 1,5 pour un as : `applyAxisAngle`) ; **pente limitée à 33°** (ils ne peuvent pas suivre un looping) ; vitesse 1,06 × celle du joueur au-delà de 60 m, 0,97 entre 30 et 60, 0,88 plus près ; s'il passe devant le joueur → `tournoi` 6 s, après 10 s de chasse → `passe` 5 s, puis retour à la chasse (`roleDepart`).
- Test : `test-chasseurs.js` (Playwright, page servie avec three depuis `lib/`) : 3 chasseurs placés 40 m derrière ; après un looping, ils sont 50 à 75 m devant, en `tournoi`.

## Vague 2 impossible à finir, et autres chasseurs (17/11)
- Diagnostic (`test-vagues.js` : le pilote automatique joue, l'état des ennemis est noté toutes les 5 s) : les ennemis `passe` revenaient vers un point *devant le joueur qui avançait avec lui* : jamais atteint, ils restaient 29 m derrière pour toujours. Corrigé : deux trajets à points fixes (150 m au loin, puis là où était le joueur), 6 s au plus chacun.
- **Fatigue** : après 25 s de combat, l'ennemi vient tourner devant le joueur (rayon ≤ 25), plus lent, sans esquive (`e.las`) ; un ennemi qui tourne et n'est pas devant accélère (1,35 × la vitesse du joueur) ; aucun ennemi sous l'eau ni dans le relief.
- Verrouillage 0,5 s (avant 0,7) ; esquive après 0,9 s dans le viseur (0,6 pour un as), 2,5 s de répit entre deux ; pilote automatique : angle réel en 3D.
- **Quatre chasseurs** (`flotte_air.py <dossier>` → `avions/<nom>.png|json`, 32 angles de tonneau × 5 inclinaisons) : FAUCON (gris et rouge, delta, double dérive), HIRONDELLE (bleu et or, flèche inversée, une dérive, un réacteur), CORSAIRE (hélice, olive et jaune, pas de flammes), VIPERE (rouge brique, canards, deux réacteurs). Bouton AVION ou touche C ; choix gardé dans `escadrille.avion`. Données : `const SPRITES={nom:{src,w,h,nr,np,tuyeres,env,nom}}`.

## Nouvelle direction « Escadrille crépuscule » (17/11) : `maquettes/escadrille-crepuscule.html`
L'utilisateur : « ce n'est pas ce que je veux : dynamique, low poly fluide, décor plus détaillé et plus fin, moins de gros pixels » (références : captures de l'artefact « Dusk Patrol »). La version pixel reste (`escadrille-pixel.html`).
- `vers_crep.py <scratchpad>` transforme `source.html` (pixel) en `source-crepuscule.html` (même jeu) : résolution ≈ écran / 2,5 (240 à 560 px de large) ; toile du viseur gardée à 180 × 320 (`OW`, `OH`).
- **Shaders** (bruit de valeur `h21`/`vn`/`fb` en GLSL) : ciel (dégradé lavande, rose, pêche, jaune ; soleil bas `SOLEIL` et halo ; traînées de nuages) ; sol (`matSol`, attribut `hauteur` = hauteur réelle, géométrie aplatie au niveau de la mer) : mer par profondeur (turquoise → bleu profond), écume des côtes animée, moutons, reflets ; forêts d'automne mouchetées par biomes, roche mauve sur les pentes, plage, éclairage par la normale ; brume `BRUME` de 220 à 760 m.
- Nuages : 34 grappes de boules low poly, shader 3 tons. Carreaux 7 × 7 de 200 m (50 segments), 3 neufs par image au plus.
- Avion 3D low poly (`chasseur()`), contour fin à la même finesse ; 4 couleurs (`COULEURS`, bouton AVION / touche C, `escadrille.avion3d`) ; caméra à 17 m (30 en vue large) ; tramage final léger (22 niveaux, Bayer 4 × 4).

## Crépuscule v2 (17/11 : « c'est bien fluide » ; il manque des avions différents et un décor plus détaillé)
- `vers_crep2.py <scratchpad>` (après `vers_crep.py`) : `MODELES3D` = 5 avions low poly construits dans le code (aides `plan`, `paire`, `derive`, `piece`) : faucon, hirondelle (flèche inversée, canards, un réacteur), corsaire (hélice qui tourne, ailes droites, verrière en bulle, pas de flammes), vipere (biréacteur, entrées d'air, canards, deux grandes dérives), spectre (aile volante). `construire(c, flammes)` → `{g, tuy, env, helice, flammes}` ; matériaux partagés par couleur (`M`).
- Ennemis : chasseurs (faucon sombre), **as** = vipère rouge, **bombardiers** dès la vague 3 (22 %) = spectre ×2,2, 10 points de vie, rayon de touche 9, vol droit et lent (34) entre des points à 220 m, tirent vers le joueur dès qu'il est à 150 m, sans esquive.
- Décor (`decor(i,j)`, déterministe par carreau, en `InstancedMesh` par sorte avec `setColorAt`) : jusqu'à ~170 essais d'arbres (sapins au-dessus de 15 m ou 30 %, feuillus d'automne avec tronc ; pas sur les pentes > 3,4), un village par carreau (40 %) de 6 à 16 maisons (murs crème, toits de tuiles) sur un replat côtier, jusqu'à 6 voiliers entre −2,5 et −14 m.

## Les packs de l'utilisateur dans le hangar (17/11)
- Packs (monogon Voxel Plane et Voxel Spaceships, niko-3d-models, Texnist, Free Game Assets, Majadroid ; liens et licences dans `credits/index.html`) téléchargés hors du dépôt ; 21 modèles choisis dans `conversion/liste.json` (chemins en `PACKS/…`).
- `conversion/convertir.js` (+ `page.html`) : ouvre chaque modèle (FBX, OBJ+MTL) dans Chromium, matériaux simplifiés (couleur + texture ≤ 256 px, 384 pour une texture imposée), plus de normales, de couleurs de sommets ni de cartes de relief, sommets fusionnés (`mergeVertices`), export GLB → `conversion/modeles.json` (≈ 3,8 Mo). Pièges : `Color.set(1,1,1)` = 0x000001 (noir) → `setRGB` ; couleurs de sommets FBX noires ; textures Majadroid avec chemins Windows, cherchées par nom plus haut dans les dossiers ; TGA de niko converties en PNG 512 avant.
- `vers_crep3.py` : `IMPORTS` (GLB analysés une fois, matériaux **Phong à facettes** : Lambert ne sait pas faire de facettes sans normales en r128 → silhouettes noires), `importe(cle, rot, taille)` (rotation par modèle, taille 6,4), flammes au cul sauf avions à hélice ; **hangar** (bouton AVION) groupé par pack ; bombardiers ennemis = frégate FGA. Page : `/*DONNEES*/` → `const MODELES={};const GLBS=<modeles.json>`.

## Hélices qui tournent (17/11)
- Les 6 avions monogon sont d'un seul bloc (OBJ et .vox à un seul modèle). `conversion/helices.py` repère les pales dans les voxels : plaques d'un voxel d'épaisseur en X (nez vers +X), larges, allongées (rapport ≥ 2,2, ce qui écarte les haubans en croix) ; deux pales au même X, à moins de 10 voxels, forment une hélice ; moyeu = centre des pales.
- `conversion/vox_glb.py <.vox> <.glb>` reconstruit l'avion depuis les voxels : nœud `corps` + un nœud `heliceN` par hélice, centré sur son moyeu ; faces regroupées en rectangles de même couleur (greedy meshing) ; couleurs de sommets en octets, converties en linéaire (puissance 2,2) pour avoir les mêmes teintes que les textures ; repère vox (x, y, z) → three (x, z, −y). 125 à 330 Ko par avion. Résultat : P-01, P-03, P-05 à deux hélices, P-02, P-04, P-06 à une.
- Jeu : `importe()` collecte les nœuds `/^helice/` (matériaux Phong avec `vertexColors`) ; ils tournent autour de leur axe X (38 rad/s).

## Crépuscule : couleurs, flammes, carrier (17/11)
- **Couleurs sombres** : GLTFLoader marque les textures en sRGB ; le jeu n'a pas de sortie sRGB, donc elles étaient décodées sans être réencodées (couleurs à la puissance 2,2, très sombres). Les textures importées passent en `LinearEncoding` ; les palettes MagicaVoxel (256 × 1) en `NearestFilter` sans mipmaps. `vox_glb.py` garde les couleurs de la palette telles quelles.
- **Flammes** : `tuyeres(g)` cherche les points les plus en arrière du modèle (7 % de la longueur), les regroupe en taches sur une grille x-y, une flamme par tache (4 au plus). Réglage à la main pour quelques modèles : `tuy:[[fx,fy],…]` en fractions de la largeur, la profondeur est mesurée sur le modèle.
- **niko** : le **carrier** manquait (3e fichier de la page) ; ajoutés aussi les fighter et bomber **rouges** (albédos rouges du pack). Textures TGA 2048 réduites en PNG 512 avant conversion.

## Crépuscule : grands vaisseaux dans le décor (17/11)
- Pack « Battle Spaceship Free 3D Low Poly Models » (Free Game Assets, craftpix) : 5 destroyers et 5 croiseurs légers (FBX, textures `T_Spase_64` / `T_Spase_blue`), convertis par `convertir.js` (dossier du pack attendu : `PACKS/fga2/x_Battle_SpaceShip/`). Tous dans le hangar.
- **Flotte** (`FLOTTE`, `flotte(dt)`) : 3 vaisseaux bleus contre 4 rouges, 85 à 120 m de long, à 60-120 m d'altitude, qui avancent lentement en sens opposés et échangent des lasers (`LASERS`, éclats à l'impact). La bataille suit le joueur : un vaisseau à plus de 560 m revient devant lui, à 460-520 m, dans la brume. Les balles du joueur ricochent dessus (décor, pas de vie).
- **Hangar sur téléphone** (17/11) : on choisissait au `pointerdown`, donc glisser pour faire défiler la liste choisissait l'avion sous le doigt et fermait le hangar. On choisit maintenant au `click`. Pour tester au téléphone avec Playwright, ajouter la balise `viewport` à la copie de test : l'artefact publié l'ajoute, le fichier n'en a pas.

## Crépuscule : sens des vaisseaux, tourelles qui tirent (17/11)
- **Sens** : vérifié vu de dessus contre les aperçus des pages itch.io (tuyères à l'arrière). Retournés de 180° : les 5 niko (fighter, bomber, carrier, versions rouges) et Majadroid 1, 2, 3.
- **Tourelles** : les modèles Free Game Assets sont d'un seul bloc, mais chaque tourelle est faite d'îlots de géométrie séparés. `tour.py` : îlots (`ilots.py`, sommets fusionnés par position), petits îlots regroupés s'ils se touchent ; une tourelle = une base ronde + des canons allongés qui dépassent de la base. `python3 -I tour.py dest1,dest2 image.png modeles.json` dessine les tourelles trouvées (numérotées) ; `tour_export.py modeles.json` garde celles choisies à la main (`GARDE`) et range dans chaque modèle `tour:[{pl (plages de triangles), piv, a0 (angle des canons), bout}]`.
- Dans le jeu, `decoupe()` sort ces triangles dans des pièces `tourelleN` qui pivotent autour de leur base. Chaque tourelle choisit une cible : un vaisseau de l'autre flotte, le joueur (flotte rouge, à moins de 260 m) ou un chasseur ennemi (flotte bleue). Elle pivote vers sa cible (1,4 rad/s) et tire 2 lasers du bout de ses canons quand elle est alignée. Les lasers rouges font perdre 6 de blindage.
- **Tourelles destructibles** (17/11) : les tourelles rouges (`TOURS`, une cible factice `{g, vie: 8, rayon}` placée chaque image sur la tourelle) prennent les balles du joueur (8 balles) et se verrouillent pour les missiles comme les chasseurs (cadres affichés à moins de 320 m). Une tourelle détruite : explosion, +300, elle disparaît et fume. Toutes les tourelles d'un vaisseau détruites : +2000, le vaisseau prend feu, pique du nez et tombe (`n.chute`), puis revient plus tard, réparé, devant le joueur.

## Crépuscule : pilotage à la souris sur PC (17/11, choix de l'utilisateur : « la souris pilote »)
- Premier clic dans le jeu : mode souris (`S.souris`), capture de la souris si le navigateur l'accepte (Échap la rend). La souris déplace une **direction fixe dans le monde** (`S.my`, `S.mp`, repère rond pointillé à 120 m) ; l'avion tourne vers elle (virage limité comme avant). Clic gauche : feu (tant qu'il est enfoncé) ; clic droit : missile.
- En mode souris, ZQSD/WASD deviennent des manœuvres : Z accélère (boost), S freine (×0,62), Q/D écart de côté (22 m/s) ; **double appui** (moins de 0,3 s) : Z = looping, Q/D = tonneau de ce côté (avec un écart). Les flèches pilotent toujours comme un joystick.
- Les mouvements de plus de 150 px d'un coup sont ignorés (saut parasite de Chrome à la capture). Le hangar libère la souris.
- Test Playwright : le double appui avec `keyboard.press` échoue sous swiftshader (images trop lentes, les deux appuis arrivent à plus de 0,3 s) ; envoyer les `KeyboardEvent` dans un même `evaluate`.
- **Avions à hélices retirés** (17/11, décision de l'utilisateur : des vaisseaux, pas d'avions) : les 6 monogon voxel plane et le Corsaire sortent du hangar et de `modeles.json` ; on garde Faucon, Hirondelle, Vipère et Spectre.

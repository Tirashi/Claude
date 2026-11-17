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

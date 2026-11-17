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

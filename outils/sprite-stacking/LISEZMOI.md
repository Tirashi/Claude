# Sprite stacking (maquette du 16/11)

- `voxelise.py <modèle.obj> <texture.png> <sortie.png> [pas]` : découpe un modèle voxel exporté en .obj (faces alignées sur les axes, pas 0.1 par défaut) en un ruban de tranches (de bas en haut, une tranche = largeur X), et remplit l'intérieur.
- `reduire.py <ruban.png> <largeur> <sortie.png>` : réduit de moitié (2×2×2 → 1).
- `donnees.py <scratchpad>` : fabrique `const PILES={…}` (images en base64) pour `source.html` ; la maquette = `source.html` où `/*DONNEES*/` est remplacé par ce bloc → `maquettes/sprite-stacking.html`.
- Packs (dans le scratchpad, pas dans le dépôt) : Medieval Voxel Assets (Felix Strefter, CC0), IsoSlice Basic Dungeon (Aquanoctis), Sprite Stack Cars (edu), Voxel Plane (monogon, CC BY-ND).

## Maquette 2 (16/11) : `maquettes/sprite-stacking-2.html`
- `vox.py <fichier.vox> <dossier>` : un .vox MagicaVoxel (palette par défaut reconstituée si absente) → un ruban par modèle ; `TEINTE=r,g,b` pour colorier les modèles d'une seule couleur (padadu).
- `maille.py <obj> <texture> <sortie.png> <taille d'un voxel> [z]` : voxelise n'importe quel .obj texturé (kits Kenney : `colormap.png`) ; `z` si le modèle a Z en haut ; `NOFLIP=1` si les UV sont à l'envers ; `TEINTE=r,g,b`.
- `piles.py` : commun (intérieur rempli, dessus éclairés, `tailles.json` à côté des rubans). `planche.py <dossier> <sortie.png>` : planche d'aperçu de 3/4.
- `donnees2.py` + `source2.html` → la maquette. Sens des modèles : Kenney nez vers le bas de l'image (π/2), avions vers le haut, F1 vers la gauche.
- Packs : Kenney Watercraft Kit et Car Kit (CC0), padadu Voxel Pack 02 et 15 (CC0, une couleur), coralorca F1 (licence non précisée), pixelemy airplanes (libre).

## Maquette 3 (16/11) : `maquettes/bateaux-relief.html` (Amiral ! et Capitaine du port)
- `flotte.py <dossier> [case=28]` : construit en voxels les 11 navires d'Amiral ! (longueur = cases × 28 − 4 ; proue en haut de l'image).
- `voxeliser.js <modèle fbx|glb|obj> <longueur> <sortie.json> [rotY] [largeur max]` + `voxeliseur.html` : voxelise n'importe quel modèle dans Chromium avec Three.js (couleurs des matières et textures) ; il faut les loaders de three 0.128 (`npm pack three@0.128.0`, dossier `npm/package/examples/js`, ou `THREE_JS=`). La largeur max resserre les bateaux trop larges pour une case. `grille.py <json> <png>` écrit le ruban.
- `source3.html` + données (navires, bateaux Kenney, maisons médiévales, phare) → la maquette.
- Piste payante repérée : Low Poly Modern Military RTS Pack Vol. 2 (artiquea, 10 €) : 13 navires de guerre modernes.

## Leçon de performance (16/11)
- Ne jamais redessiner les tranches à chaque image : assembler chaque pile **une fois par angle** (arrondi à 1/64 de tour) dans une toile en cache, puis un seul `drawImage` par objet (`assembler()` dans `source3.html`). Mesuré avec le processeur ralenti ×6 (comme un téléphone) : 8 → 58 images/s.
- Pas de `ctx.filter = blur(...)` recalculé à chaque image (effet HD-2D) : trop lourd sur téléphone ; préférer un vignetage précalculé, ou flouter seulement le décor fixe une fois.

## Article de SpriteCook (lu le 16/11) : https://www.spritecook.ai/blog/sprite-stacking-pixel-art
- Même technique que la nôtre ; leurs réglages : écrasement 0,75 (en dessous de 0,6 les toits deviennent trop fins), 1 px entre tranches, positions arrondies au pixel, tri des piles par leur point au sol (jamais tranche par tranche).
- Contour : ne pas le mettre sur chaque tranche (lignes sombres à l'intérieur en diagonale) ; dessiner la pile finie hors écran puis faire le contour une fois.
- Rotation lente qui tremble : dessiner plus grand, ou RotSprite (agrandir ×8 avec Scale2x, tourner, prendre le pixel central).
- Piles qui ne tournent jamais (arbres, rochers) : les assembler une fois au chargement (ce qu'on fait déjà, voir plus haut).
- Fabriquer les tranches à partir de 4 vues à plat (dessus, côté, avant, arrière) : un voxel existe là où toutes les vues en ont un ; couleur du dessus = vue de dessus, bords = vue du côté concerné. Marche pour les objets simples (pas de trous ni de surplombs). Outil gratuit dans le navigateur : « Sprite Stack Generator » de SpriteCook.

## Essai des 4 vues (16/11) : `maquettes/quatre-vues.html` (https://claude.ai/artifact/TbS2xJjpTCLth4s6ng1dJ5)
- `vues.py <dossier>` : dessine les 4 vues d'un remorqueur et d'un chalutier (dessus : ligne 0 = proue ; côté : colonne = même rang que le dessus, ligne 0 = en haut ; avant, arrière), les sculpte (`sculpter` : voxel là où les 4 vues sont d'accord ; dessus = couleur du dessus, bords = vue du côté) et écrit les planches `-vues.png` et les rubans.
- `source4.html` : la page (`/*DONNEES*/` → `const DONNEES={nom:{vues,pile,w,h,n}}`) ; `assembler()` avec contour tracé une fois autour de la pile finie.

## Labo vaisseaux (22/11) : `maquettes/sprite-stacking-vaisseaux.html` (https://claude.ai/artifact/WS2wDL9KRx2KvtkAZnQaSe)
Pour un jeu spatial perso de l'utilisateur (hors Ludothèque), à partir de sa démo « Vaisseau en sprite stacking » (https://claude.ai/artifact/EhTbZk6oYdpDHjjpsBbJts), d'après loktar00/sprite-stack-animation (MIT).
- `vox-bande.py <fichier.vox> <dossier> [--cellule N] [--tourner Q] [--creux] [--dessus F] [--bas F] [--modele K]` : .vox → bande au format de loktar00 (tranches côte à côte, la plus basse à gauche, **cellule carrée, modèle centré** = pivot au centre) + `.json` {cellule, tranches}. Intérieur rempli, dessus éclaircis, bas assombri. Nez attendu vers +x (droite) : `--tourner` en quarts de tour horaires sinon.
- `vox-exemple.py <dossier>` : fabrique un `flotte.vox` de test (chasseur 35×30×9, astéroïde) et `sprite-plat.png` (vaisseau 32×32 à plat, nez en haut).
- `donnees5.py <dossier> <page>` : met les trois exemples en base64 dans la page (`var EXEMPLES = …;`).
- Dans la page : `chargerBande(img, q)` (cellule = hauteur de l'image), `extruder(img, n, forme, q)` (hauteur par pixel : plaque, biseau = distance au bord × n/3, dôme ; flancs assombris vers le bas), `makeStack` (tranches + copies sombres + rayon pour les collisions). Une image dont la largeur est un multiple (≥ 2) de la hauteur est prise pour une bande, sinon elle est extrudée. Bouton « Voir la bande » : la pile courante en PNG au même format.
- Hauteur d'une tranche : 1,5 px pour les tranches du code (8 couches pour 32 px), **1 px pour un .vox** (voxels cubiques).
- Port vers GameMaker : la bande devient un sprite à N sous-images (« import strip ») avec l'origine au centre ; pour chaque tranche i, `draw_sprite_ext(spr, i, x, y - i * lz, 1, 1, angle, c_white, 1)`. `draw_sprite_ext` tourne après l'échelle, donc pas d'écrasement `sin(pitch)` : soit vue de dessus pure (pas d'écrasement, le relief vient du seul décalage), soit dessiner la pile dans une surface puis l'étirer en y, soit `matrix_set(matrix_world, …)` avec rotation puis échelle. Penser au cache par angle (voir la leçon de performance).

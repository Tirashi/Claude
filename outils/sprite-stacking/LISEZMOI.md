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

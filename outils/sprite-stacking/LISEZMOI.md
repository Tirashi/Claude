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

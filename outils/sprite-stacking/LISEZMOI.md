# Sprite stacking (maquette du 16/11)

- `voxelise.py <modèle.obj> <texture.png> <sortie.png> [pas]` : découpe un modèle voxel exporté en .obj (faces alignées sur les axes, pas 0.1 par défaut) en un ruban de tranches (de bas en haut, une tranche = largeur X), et remplit l'intérieur.
- `reduire.py <ruban.png> <largeur> <sortie.png>` : réduit de moitié (2×2×2 → 1).
- `donnees.py <scratchpad>` : fabrique `const PILES={…}` (images en base64) pour `source.html` ; la maquette = `source.html` où `/*DONNEES*/` est remplacé par ce bloc → `maquettes/sprite-stacking.html`.
- Packs (dans le scratchpad, pas dans le dépôt) : Medieval Voxel Assets (Felix Strefter, CC0), IsoSlice Basic Dungeon (Aquanoctis), Sprite Stack Cars (edu), Voxel Plane (monogon, CC BY-ND).

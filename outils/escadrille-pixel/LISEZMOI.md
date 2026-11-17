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

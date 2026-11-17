# Maquette « Escadrille pixel » (17/11) : `maquettes/escadrille-pixel.html`
Référence de l'utilisateur : captures de « fighterv2 » sur forge.ui8.ai (shoot'em up en 3D pixelisée : mer et îles, traînées, boutons LOOP / VIEW / GUN / MISSILE / BOOST).
- Vraie 3D (Three.js r128) rendue dans une cible 180 × 320 (NearestFilter), puis passe finale : couleurs arrondies à 7 niveaux + tramage de Bayer 4 × 4 ; toile agrandie en `image-rendering: pixelated`.
- Relief infini en carreaux de 200 (5 × 5 autour de l'avion), couleurs par face (mer profonde, haut-fond, écume, plage, 3 verts, rocher) ; mer = plan texturé d'écume (NearestFilter) recalé par pas de 64 ; nuages = sprites pixel.
- Vol : lacet, tangage (glisser vers le haut = piqué), roulis, looping (LOOP), tonneau (deux touchers), canon, missiles à tête chercheuse, pilote automatique.
- `source.html` : `/*DONNEES*/` → `const MODELES={racing, intercepteur}` (GLB Edenpunk réduits par `outils/vol-3d/glb_reduire.py`).

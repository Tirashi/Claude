# Maquette « vol en 3D » (16/11) : `maquettes/vol-3d.html`
- `source.html` : la page ; `/*DONNEES*/` est remplacé par `const MODELES={racing, intercepteur, speeder}` (GLB en base64).
- `glb_reduire.py <entrée.glb> <sortie.glb> 512` : réduit les textures d'un GLB (Edenpunk : 4096 → 512 px, ~1 Mo par vaisseau).
- Modèles : Edenpunk Spaceship Pack Vol.1 (Light_Fighter_Racing_Variant, Light_Fighter_Interceptor ; libres même en commercial), Kenney Space Kit `craft_speederA` (CC0, nez vers −Z : rotY = 0) ; Edenpunk : nez vers +Z, rotY = π.
- Matières des GLB : metalness à 0 sinon tout est noir sans carte d'environnement.

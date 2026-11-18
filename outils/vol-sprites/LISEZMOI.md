# Maquette « vol en sprites » (16/11) : `maquettes/vol-sprites.html`
- Sprites pré-calculés : `photographe.html` (Three.js) photographie un GLB sous 16 angles de tonneau × 3 inclinaisons, réduit en pixel art (couleurs arrondies, contour sombre) ; `faire.js` (Playwright) la lance et écrit les planches PNG. Remplacer `/*MODELES*/` par `const MODELES={nom: base64 du GLB}` (GLB réduits par `outils/vol-3d/glb_reduire.py`).
- `source.html` : le jeu, sol en perspective ligne par ligne (Mode 7), horizon qui penche, objets projetés ; `/*DONNEES*/` → `const SPR={nom:{src,w,h}}` (taille d'une vue).
- Nez des modèles : Edenpunk +Z (rotY = π), Kenney craft −Z (rotY = 0). L'ennemi est photographié de face (8 vues).

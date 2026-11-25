# Voitures low poly (Écurie miniature, 18/11)

Convertit des modèles 3D de packs différents (GLB, FBX, OBJ) dans un même format compact, pour les mélanger dans une page Three.js sans fichiers à côté.

- `node cuire.js <liste.json> <sortie.json>` : liste = `[{nom, fichier, rot, ignorer, tex}]` (`rot` en quarts de tour autour de Y pour mettre la longueur sur X et le nez vers +X ; `tex` = texture à appliquer si le modèle n'en a pas, ex. OBJ sans .mtl). Il faut les chargeurs de three 0.128 (`npm pack three@0.128.0`, dossier `package/examples/js`, ou `THREE_JS=`), avec `libs/fflate.min.js` pour le FBX.
- Sortie par modèle : positions quantifiées en int16 (longueur 1, posé au sol, centré), une couleur par triangle (lue dans la texture au centre UV, ou couleur de la matière), palette, indices.
- Pièges : textures glTF non retournées (`flipY = false`) ; les .tga des OBJ sont servis en .png ; matériau `MeshStandardMaterial` avec `flatShading` (Lambert sans normales = noir).
- Dans la page : en-tête JSON + blob gzip en base64 (`DecompressionStream`), carrosserie repeinte = famille de teintes vives la plus présente (±20°). Exemple : `maquettes/ecurie-5.html`.
- Packs essayés : Cosmo Low Poly Cars, Kenney Car Kit, rgsdev Free Low Poly Vehicles (CC0, gardés) ; Devil's Work.shop (CC0, écarté : trop trapu).

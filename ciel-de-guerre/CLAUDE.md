# Ciel de guerre — notes pour Claude
Combat aérien 3D low poly. Cahier des charges : [`specs/ciel-de-guerre.md`](../specs/ciel-de-guerre.md). Né de la maquette « Escadrille crépuscule » : outils et historique dans `outils/escadrille-pixel/` (LISEZMOI.md, `conversion/`).
- **Fichiers** : `index.html` (écrans titre, pause, fin, commandes), `style.css`, `jeu.js` (tout le jeu, Three.js r128 + `lib/GLTFLoader.js`), `catalogue.js` (`window.CDG_CAT` : nom, pack et tourelles de chaque modèle), `modeles/*.glb` (52 modèles quantifiés), `fiche.js`.
- **jeu.js est fabriqué** depuis la source de la maquette par `outils/escadrille-pixel/vers_jeu.py` pendant la session 1 ; désormais on modifie `jeu.js` directement.
- **Modèles** : chargés à la demande (`chargerModele`) ; au démarrage la flotte, les bombardiers, l'appareil du joueur et les polyvalents, le reste en fond. Pas dans `FILES` de `sw.js` (9 Mo) : le service worker les garde au fil du jeu. Copie artefact : `window.CDG_B64` (base64) remplace les fichiers.
- **Repeinture** : `repeint()` fait `<cle>_b` et `<cle>_r` (bleu joueur, rouge ennemi). **Quantifiés** (`conversion/quantifie.py`) : `dequantifie()` remet les coordonnées d'origine (tourelles et tuyères en dépendent).
- **Familles** `FAMILLES` (vitesse, virage, blindage, missiles, vie ennemie) ; `FAM()` = celle de l'appareil du joueur.
- **Écrans** : `S.mode` = titre | jeu | pause | fin ; hors partie, pilote automatique et pas de dégâts.
- **Tests** : `window.CielDeGuerre` (`S`, `ennemis`, `nouvellePartie()`, `abattu()`, `pause()`, `mode`, `vague`). Les `.glb` se chargent en `http://` (serveur local), pas en `file://`.
- **Pièges** : la largeur du viseur suit le format (`OW = 320 × w / h`) ; tout ce qui dessine dans le viseur doit lire `OW`/`OH` ; double appui clavier : 0,3 s.

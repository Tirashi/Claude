# Ciel de guerre — notes pour Claude
Combat aérien 3D low poly. Cahier des charges : [`specs/ciel-de-guerre.md`](../specs/ciel-de-guerre.md). Outils : `outils/escadrille-pixel/`.
- **Fichiers** : `index.html` (écrans), `style.css`, `jeu.js` (tout le jeu, Three.js r128 + GLTFLoader), `sons.js` (`CDGSons`, sons synthétisés), `catalogue.js` (`window.CDG_CAT` : nom, pack et tourelles de chaque modèle), `modeles/*.glb` (52 modèles quantifiés), `fiche.js`.
- **Modèles** : chargés à la demande (`chargerModele`) ; au démarrage la flotte, les bombardiers, l'appareil du joueur et les polyvalents, le reste en fond. Pas dans `FILES` de `sw.js` (gardés au fil du jeu). Artefact : `window.CDG_B64`.
- **Repeinture** : `repeint()` fait `<cle>_b` et `<cle>_r` (bleu joueur, rouge ennemi). **Quantifiés** (`conversion/quantifie.py`) : `dequantifie()` remet les coordonnées d'origine (tourelles et tuyères en dépendent).
- **Souris** : le curseur (`S.cx`, `S.cy` de −1 à 1) est le viseur et, loin du centre, le manche ; `visee(fwd)` = direction des canons (rayon de la caméra à travers le curseur, cône 35°).
- **Familles** `FAMILLES` (vitesse, virage, blindage, missiles, vie ennemie) ; `FAM()` = celle de l'appareil du joueur.
- **Écrans** : `S.mode` = titre | jeu | pause | fin ; hors partie, pilote automatique et pas de dégâts.
- **Missions** (`MISSIONS`, `MIS`, `majMission`, `finMission`) : `debut/maj/etat/etoiles/fin` ; `navire()`, `escadre()`, `objectif()`, `OBJ` (objectifs en bleu).
- **Tests** : `window.CielDeGuerre` (`S`, `ennemis`, `nouvellePartie(i)` (mission i, ou rien = vagues), `mission`, `finMission(g)`, `abattu()`, `pause()`, `mode`, `vague`). Les `.glb` se chargent en `http://` (serveur local), pas en `file://`.
- **Pièges** : viseur en unités `OW`×`OH` (320 de haut), dessiné ×`K` (résolution de l'écran) ; textes par `txt()` ; tête d'écran en HTML (`majHud`, `etat(M)` des missions) ; double appui clavier : 0,3 s.

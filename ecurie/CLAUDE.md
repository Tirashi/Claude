# Écurie miniature — notes pour Claude
Gestion d'écurie de course, courses regardées en 3D. Cahier des charges : [`specs/ecurie.md`](../specs/ecurie.md).

## Fichiers (scripts classiques, dans cet ordre)
- `donnees.js` : modèles (`ENTETE`, `BLOB` gzip base64, `GLB` des 3 tuiles de route) ; tiré de la maquette 6, ne pas éditer à la main.
- `modeles.js` (`Modeles`) : décodage, carrosserie repeinte (`maillage(nom, teinte)`) ; `voiture(nom, teinte)` : roues séparées qui tournent (`tourner(d)`, plafonné) et feux stop (`feu`) ; tuiles GLB ; met `createImageBitmap` à `undefined` (artefact).
- `circuit.js` (`Circuits`) : circuits posés « à la tortue » (`plan` : 'S' = 12 m, 18 / 42 = virage), trajectoire idéale, ligne de départ. Un plan doit se refermer (4 virages à gauche ; `ferme`).
- `course.js` (`Course`) : simulation pure (`creer`, `pas`, `finir`) ; qualifications, arrivée, abandons (accident, casse tirée d'avance).
- `regles.js` (`Regles`) : données (voitures, pièces, rivaux par division, sponsors, activités, revenus) et logique (`preparer`, `resultats`, fin de saison).
- `scene.js` (`Scene3D`) : la course en 3D et ses caméras ; la vitrine (plateau qui tourne).
- `jeu.js` (`window.Ecurie`) : écrans en HTML (style A, unités `cqi` du conteneur `.boite`), une seule boucle `requestAnimationFrame` (`actif`) ; icônes en pixels 9 × 9 (`PIX`, masque SVG : couleur du texte).

## Tests
- `node outils/ecurie-simulateur.js` (lancé par `verifications.js`) ; `… equilibre` : place moyenne selon division et voitures.
- Playwright : `Ecurie.nouvelle()`, `Ecurie.lancer()`, `Ecurie.course()`, `Ecurie.finirCourse()`, `Ecurie.resultats()`.

## Pièges
- `regles.js`/`course.js` ne doivent pas toucher à `THREE` ni au DOM (Node).
- Chaque course crée un nouveau canevas et son `WebGLRenderer` ; `finCourse()` le libère (sinon trop de contextes WebGL).
- Grille inversée : non (une voiture plus rapide partie derrière ne remontait pas).
- Textes en Press Start 2P : majuscules sans accent.

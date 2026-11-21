# Écurie miniature — notes pour Claude
Gestion d'écurie de course, courses regardées en 3D. Cahier des charges : [`specs/ecurie.md`](../specs/ecurie.md).

## Fichiers (scripts classiques, dans cet ordre)
- `donnees.js` : modèles (`ENTETE`, `BLOB` gzip base64, `GLB` des 3 tuiles de route) ; ne pas éditer à la main.
- `modeles.js` (`Modeles`) : décodage, `maillage(nom, teinte)` repeint ; `voiture()` : roues qui tournent, feux stop (`feu`) ; tuiles GLB ; `createImageBitmap` à `undefined` (artefact).
- `circuit.js` (`Circuits`) : circuits « à la tortue » (`plan` : 'S' = 12 m, 18 / 42 = virage à gauche, −18 / −42 = à droite, la même tuile à l'envers ; `SENS`), trajectoire, départ, `tours` (≈ 3 km). Un plan doit se refermer (`ferme`) ; nouveaux plans : chercher par programme (fermés, sans croisement).
- `course.js` (`Course`) : simulation pure (`creer`, `pas`, `finir`) ; qualifications, arrivée, abandons (accident, casse tirée d'avance).
- `regles.js` (`Regles`) : données et logique (`preparer`, `resultats`, fin de saison).
- `sons.js` (`EcurieSons`) : sons synthétisés (moteur, bips, foule, passage) ; `ecurie.son`.
- `scene.js` (`Scene3D`) : la course en 3D et ses caméras ; la vitrine (plateau qui tourne).
- `jeu.js` (`window.Ecurie`) : écrans HTML « la télé » (Titillium Web, `clip-path`, unités `cqi`), une seule boucle `requestAnimationFrame` (`actif`), icônes `ICO`, `confirmer` (pas de `confirm()`).

## Tests
- `node outils/ecurie-simulateur.js` (lancé par `verifications.js`) ; `… equilibre` : place moyenne selon division et voitures.
- Playwright : `Ecurie.nouvelle()`, `.lancer()`, `.course()`, `.finirCourse()`, `.resultats()`.

## Pièges
- `regles.js`/`course.js` ne doivent pas toucher à `THREE` ni au DOM (Node).
- Chaque course crée un nouveau canevas et son `WebGLRenderer` ; `finCourse()` le libère (sinon trop de contextes WebGL).
- Pas de grille inversée (la voiture rapide partie derrière ne remontait pas).
- Objets déclarés aussi en `window.X` (sinon `lint.js` ne les voit pas).

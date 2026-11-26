# Flotte du bureau — notes pour Claude
Incrémental de flotte spatiale qu'on regarde travailler (inspiré de *Desk Space*, Steam). Cahier des charges : [`specs/flotte-du-bureau.md`](../specs/flotte-du-bureau.md). Démo, sans classement ni défi du jour.
- Scripts classiques, objet commun `window.Flotte` : `regles.js` (`F.R` : tous les nombres, formules, `absence`), `monde.js` (`F.Monde` : corps, orbites, zones), `flotte.js` (`F.Sim` : navires, `maj`, `acheter`, `ameliorer`, `ouvrirZone`, `rattraper`), `sauvegarde.js` (`F.Save`), `sprites.js` (4 sprites Relief de Mineur de l'espace), `carte.js` (`F.Carte` : rendu, caméra), `interface.js` (`F.UI` : fenêtres), `jeu.js` (`F.Jeu` : boucle, entrées).
- **Monde en cercles** (unité = rayon de la zone 4 ÷ 1,22) ; la vue aplatit les ellipses (`V.tilt`) et le cap des sprites se recalcule à l'écran. Zoom ≥ 115 % : sprites Relief, sinon petits points.
- Sauvegarde `flotte.partie` (JSON, `v: 1`), préférences `flotte.prefs`. Fenêtre cachée ≤ 10 min : rattrapage à 100 % ; au-delà : part de veille (25 % + 5 points par niveau, 75 % max, 24 h max). L'autosave ne tourne pas quand la page est cachée (sinon on perdrait le temps à rattraper).
- Tests : `outils/flotte-simulateur.js` (dans `verifications.js` ; `rythme` donne le revenu d'un joueur qui rachète), bloc dans `fumee.js`. Étiquette et jaquette : `outils/etiquettes.js flotte`.
- Cinéma : interface masquée seulement ; avec la préférence `cineSuivi` (Options), suit un navire au hasard (`etiquettes.js` l'active pour les images).
- Session 2 : fenêtre Ingénierie (`R.AMELIO` : moteurs, soute ; portée = `R.ZONES[i].cout`), quatre zones et avant-postes, clavier `P` / `M` / `T` / `C`. Pas de pirates ni de patrouilles (session 3). Artefact : `python3 outils/artefact.py flotte/index.html <sortie>` (lien dans le skill `republier-artefact`).

## Pièges
- Les navires gardent leur départ en **coordonnées du monde** (`sx`, `sy`) : jamais en pixels, sinon la caméra les fait glisser.
- `E.evt` (chiffres qui s'envolent) est vidé par `Carte.avancer` ; sous Node, `rattraper` le vide.
- Équilibrage : `node outils/flotte-simulateur.js rythme` (joueur qui rachète au mieux) : zones 2, 3, 4 à ~8, 36 et 93 min ; le contrôle exige 5-15, 25-60 et 70-140 min. Changer un coût : relancer le simulateur. Après le prestige (session 4), recaler.

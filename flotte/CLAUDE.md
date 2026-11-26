# Flotte du bureau — notes pour Claude
Incrémental de flotte spatiale qu'on regarde travailler (inspiré de *Desk Space*, Steam). Cahier des charges : [`specs/flotte-du-bureau.md`](../specs/flotte-du-bureau.md). Démo, sans classement ni défi du jour.
- Scripts classiques, objet commun `window.Flotte` : `regles.js` (`F.R` : tous les nombres, formules, `absence`), `monde.js` (`F.Monde` : corps, orbites, zones), `flotte.js` (`F.Sim` : navires, `maj`, `acheter`, `ouvrirZone`, `rattraper`), `sauvegarde.js` (`F.Save`), `sprites.js` (4 sprites Relief de Mineur de l'espace), `carte.js` (`F.Carte` : rendu, caméra), `interface.js` (`F.UI` : fenêtres), `jeu.js` (`F.Jeu` : boucle, entrées).
- **Monde en cercles** (unité = rayon de la zone 4 ÷ 1,22) ; la vue aplatit les ellipses (`V.tilt`) et le cap des sprites se recalcule à l'écran. Zoom ≥ 115 % : sprites Relief, sinon petits points.
- Sauvegarde `flotte.partie` (JSON, `v: 1`), préférences `flotte.prefs`. Fenêtre cachée ≤ 10 min : rattrapage à 100 % ; au-delà : part de veille (25 % + 5 points par niveau, 75 % max, 24 h max). L'autosave ne tourne pas quand la page est cachée (sinon on perdrait le temps à rattraper).
- Tests : `outils/flotte-simulateur.js` (dans `verifications.js` ; `rythme` donne le revenu d'un joueur qui rachète), bloc dans `fumee.js`. Étiquette et jaquette : `outils/etiquettes.js flotte`.
- Session 1 : zone 1 seule en jeu ; `ouvrirZone` et les corps des zones 2 à 4 existent mais n'ont pas de bouton (session 2). Pas de pirates ni de patrouilles (session 3).

## Pièges
- Les navires gardent leur départ en **coordonnées du monde** (`sx`, `sy`) : jamais en pixels, sinon la caméra les fait glisser.
- `E.evt` (chiffres qui s'envolent) est vidé par `Carte.avancer` ; sous Node, `rattraper` le vide.
- Équilibrage : un joueur simple ouvre les 4 zones en ~15 min, bien avant les 2 à 3 h visées : à recaler avec la portée (session 2) et le prestige (session 4).

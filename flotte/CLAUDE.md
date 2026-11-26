# Flotte du bureau — notes pour Claude
Incrémental de flotte spatiale qu'on regarde (inspiré de *Desk Space*). Cahier des charges : [`specs/flotte-du-bureau.md`](../specs/flotte-du-bureau.md). Démo, sans classement.
- Scripts classiques, `window.Flotte` : `regles.js` (`F.R` : tous les nombres, `absence`), `monde.js` (corps, orbites, zones), `flotte.js` (`F.Sim` : `maj`, `acheter`, `ameliorer`, `ouvrirZone`, `rattraper`), `pirates.js` (pirates, patrouilles, primes), `sauvegarde.js`, `sprites.js` (4 sprites Relief), `carte.js` (rendu, caméra), `interface.js` (fenêtres), `jeu.js` (boucle ; objet de test `F.Jeu`).
- **Monde en cercles** (unité = rayon zone 4 ÷ 1,22), la vue aplatit (`V.tilt`) ; zoom ≥ 115 % : sprites Relief, sinon points.
- Sauvegarde `flotte.partie` (`v: 1`), prefs `flotte.prefs`. Fenêtre cachée ≤ 10 min : rattrapage à 100 % ; au-delà : veille (25 % + 5 points par niveau, 24 h max), sans pirates. Pas d'autosave page cachée.
- Cinéma : masque l'interface ; préférence `cineSuivi` = suit un navire (`etiquettes.js` l'active).
- Pirates : pillent un navire chargé (10 s de revenu), patrouilles (une par avant-poste) rendent butin + prime (`R.PIRATE`, `R.PATROUILLE`). Clavier : M T P C.
- Tests : `outils/flotte-simulateur.js` (dans `verifications.js` ; `rythme`), bloc dans `fumee.js`. Étiquette : `outils/etiquettes.js flotte`. Artefact : `outils/artefact.py` (lien dans `republier-artefact`).

## Pièges
- Départs de trajet en **coordonnées du monde** (`sx`, `sy`), jamais en pixels.
- `E.evt` est vidé par `Carte.avancer` (et par `rattraper` sous Node).
- Équilibrage : `rythme` donne zones 2, 3, 4 à ~8, 33 et 79 min (le contrôle exige 5-15, 25-60, 70-140). Changer un coût : relancer le simulateur ; recaler après le prestige.

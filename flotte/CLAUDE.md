# Armateur des étoiles — notes pour Claude
Incrémental de flotte spatiale qu'on regarde (inspiré de *Desk Space*). Cahier des charges : [`specs/flotte-du-bureau.md`](../specs/flotte-du-bureau.md). Démo, sans classement.
- Scripts classiques, `window.Flotte` : `regles.js` (`F.R` : tous les nombres), `monde.js`, `flotte.js` (`F.Sim`), `pirates.js`, `sauvegarde.js`, `sprites.js` (4 sprites Relief), `carte.js` (rendu, caméra), `interface.js` (fenêtres), `jeu.js` (boucle ; objet de test `F.Jeu`).
- **Monde en cercles** (unité = rayon zone 4 ÷ 1,22), la vue aplatit (`V.tilt`) ; zoom ≥ 115 % : sprites Relief, sinon points.
- Sauvegarde `flotte.partie` (`v: 1`), prefs `flotte.prefs`. Fenêtre cachée ≤ 10 min : rattrapage à 100 % ; au-delà : veille (25 % + 5 points par niveau, 24 h max), sans pirates. Pas d'autosave caché.
- Cinéma : masque l'interface ; préférence `cineSuivi` = suit un navire (`etiquettes.js` l'active).
- **Horizon** (prestige, `R.HORIZON`, `S.horizon`, `S.acheterHorizon`, `E.h`) : seuil 2 M cr et zone 4 ; éclats ⌊3√(gagné/seuil)⌋ ; 5 améliorations permanentes ; friction portée +10 %, pirates +5 % par tour. `E.veille` vient de `E.h.niv.veille`.
- Pirates : pillent un navire chargé (10 s de revenu), patrouilles (une par avant-poste) rendent butin + prime (`R.PIRATE`, `R.PATROUILLE`). Clavier : M T P C.
- Tests : `outils/flotte-simulateur.js` (dans `verifications.js` ; `rythme`), bloc dans `fumee.js`. Étiquette : `outils/etiquettes.js flotte`. Artefact : `outils/artefact.py` (lien dans `republier-artefact`).

## Pièges
- Départs de trajet en **coordonnées du monde** (`sx`, `sy`), jamais en pixels.
- `E.evt` est vidé par `Carte.avancer` (et par `rattraper` sous Node).
- Équilibrage : `rythme [minutes] horizons` : zones à ~8, 33, 79 min ; Horizons après 116, 90, 82 min. Changer un nombre : relancer le simulateur (bornes dans ses contrôles).
- `#ui > .toast` doit rester `pointer-events: none` (sinon l'annonce intercepte les touchers).

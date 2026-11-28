# Armateur des étoiles — notes pour Claude
Incrémental de flotte spatiale qu'on regarde (inspiré de *Desk Space*). Cahier des charges : [`specs/flotte-du-bureau.md`](../specs/flotte-du-bureau.md). Démo.
- Scripts classiques, `window.Flotte` : `regles.js` (`F.R` : tous les nombres), `monde.js`, `flotte.js` (`F.Sim`), `pirates.js`, `sauvegarde.js`, `sprites.js` (4 sprites Relief), `carte.js` (rendu, caméra), `son.js` (sons et musique), `interface.js` (fenêtres), `jeu.js` (boucle ; objet de test `F.Jeu`).
- **Monde en cercles** (unité = rayon zone 4 ÷ 1,22), la vue aplatit (`V.tilt`) ; zoom ≥ `V.seuil` (1,15, monte si le dessin dépasse 14 ms) : sprites Relief teintés (4 variantes), sinon points.
- Sauvegarde `flotte.partie` (`v: 1`), prefs `flotte.prefs`. Fenêtre cachée ≤ 10 min : rattrapage à 100 % ; au-delà : veille (25 % + 5 points par niveau, 24 h max), sans pirates. Pas d'autosave caché.
- **Son** : tout synthétisé (Web Audio, aucun fichier, rien à créditer) ; les événements `E.evt` (`kind` : gain, perte, boom, alerte, tir) jouent leur bruit, placé en stéréo ; musique générative très douce ; prefs `sons`, `musique`, `volume`. Démarre au premier geste.
- Cinéma : masque l'interface ; préférence `cineSuivi` = suit un navire (`etiquettes.js` l'active).
- **Horizon** (prestige, `R.HORIZON`, `S.horizon`, `E.h`) : seuil 2 M cr, éclats ⌊3√(gagné/seuil)⌋, 5 bonus, friction légère. Pirates : pillent un navire chargé, patrouilles = butin + prime. Clavier : M T P C.
- Tests : `outils/flotte-simulateur.js` (dans `verifications.js` ; `rythme [min] horizons`), bloc dans `fumee.js`. Étiquette : `outils/etiquettes.js flotte`. Artefact : `outils/artefact.py`.

## Pièges
- Départs de trajet en **coordonnées du monde** (`sx`, `sy`), jamais en pixels.
- `E.evt` est lu par `jeu.js` (sons) puis vidé par `Carte.avancer`.
- `#ui > .toast` : `pointer-events: none` obligatoire.
- Équilibrage : zones à ~8, 33, 79 min ; Horizons après 116, 90, 82 min (simulateur).

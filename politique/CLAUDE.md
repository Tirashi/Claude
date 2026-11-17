# Politique — notes pour Claude
« Victoria 3 minimaliste » au tour par tour (nom à trouver). Moteur + **écran** (session 1 du 17/11, maquette 4 validée) : `index.html`, `ecran/carte.js` (carte à l'encre), `ecran/ecran.js` (branché sur `actionsDisponibles`, ordres appliqués sur un aperçu), `images/` (`outils/politique-images.py`), `fiche.js` (démo de l'accueil). Cahier des charges : [`specs/politique.md`](../specs/politique.md) (règles, backlog, simulateur : `specs/politique/`).
- `moteur/` : logique pure, **ni DOM, ni réseau, ni Date, ni Math.random**. Scripts classiques (`window.Politique.X` / `require`). `alea.js`, `calcul.js` (arrondis), `etat.js`, `economie.js`, `lois.js`, `batiments.js`, `factions.js`, `diplomatie.js`, `guerre.js`, `evenements.js`, `objectifs.js`, `tour.js` : `tourSuivant(etat, actions, rng)` ne mute jamais `etat` ; `actionsDisponibles(etat)` = seules actions acceptées.
- Une relation ne change que par `Diplomatie.changerRelation` (bornée). Le moteur ne lit jamais le texte du journal : un compteur dans `e.suivi`.
- `donnees/` : **tous les nombres** (scénario et nations dans `champs.js`, personas cachés, pays…). Valeur nouvelle : `// ASSUMPTION: …`, listée pour validation.
- Tests : `node outils/politique-tests.js` (lancé par `verifications.js`) ; interrupteurs en tête pour garder les règles d'avant. Bots : `outils/politique-bots.js` ; lots : `node outils/politique-simulateur.js --parties 200`, `--balayage chemin=v1,v2`, `--pays tous`.

## Règles du chantier
- **Liste fermée** : seulement les règles validées (`specs/politique/regles-v1.md`, `regles-v2.md`). Idée nouvelle → `specs/politique/backlog-v2.md`, puis accord de l'utilisateur.
- Chaque règle écrite = un test. Pas d'équilibrage à l'intuition : simulations avant/après.
- En cas d'ambiguïté de règle : demander.
- Identifiants en français ; les `id` des lois et bâtiments gardent ceux de `regles-v1.md`.

# Politique — notes pour Claude
« Victoria 3 minimaliste » au tour par tour (nom à trouver). Pour l'instant **un moteur de règles sans écran** ; l'écran viendra après une maquette validée. Cahier des charges : [`specs/politique.md`](../specs/politique.md) (renvoie aux règles V1, au backlog V2 et au plan du simulateur dans `specs/politique/`).
- `moteur/` : logique pure, **ni DOM, ni réseau, ni Date, ni Math.random**. Scripts classiques (pas de modules ES) : `window.Politique.X` dans la page, `require` sous Node. `alea.js` (mulberry32, `creer/suivant/entier/choisir`), `etat.js` (`creerEtat(scenario, graine)`), `tour.js` (`tourSuivant(etat, actions, rng)` ne mute jamais `etat` ; `actionsDisponibles(etat)` = seules actions acceptées).
- `donnees/` : **tous les nombres** (scénarios, lois, bâtiments). Une valeur jamais chiffrée dans la partie 1 porte `// ASSUMPTION: …` et est listée dans la réponse pour validation.
- Tests : `node outils/politique-tests.js` (lancé par `verifications.js`). Simulateur et bots : `outils/politique-simulateur.js` (M4).

## Règles du chantier
- **Liste fermée** : seulement ce qui est dans `specs/politique/regles-v1.md`. Toute idée nouvelle → `specs/politique/backlog-v2.md`, puis accord de l'utilisateur.
- Chaque règle écrite = un test. Pas d'équilibrage à l'intuition : simulations avant/après.
- En cas d'ambiguïté de règle : demander.
- Identifiants du code en français (comme le reste du dépôt) ; les `id` des lois et bâtiments gardent ceux de `regles-v1.md`.

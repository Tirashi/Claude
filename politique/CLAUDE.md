# Politique — notes pour Claude
« Victoria 3 minimaliste » au tour par tour (nom à trouver). Pour l'instant **un moteur de règles sans écran** ; l'écran viendra après une maquette validée. Cahier des charges : [`specs/politique.md`](../specs/politique.md) (renvoie aux règles V1, au backlog V2 et au plan du simulateur dans `specs/politique/`).
- `moteur/` : logique pure, **ni DOM, ni réseau, ni Date, ni Math.random**. Scripts classiques : `window.Politique.X` dans la page, `require` sous Node. `alea.js` (mulberry32), `etat.js` (`creerEtat`), `economie.js`, `lois.js`, `batiments.js`, `factions.js` (statuts, moral, grèves), `diplomatie.js` (nations, contrats, traités, embargo), `guerre.js` (force, batailles, paix), `tour.js` : `tourSuivant(etat, actions, rng)` ne mute jamais `etat` (ordre du tour en tête du fichier) ; `actionsDisponibles(etat)` = seules actions acceptées, comparées champ par champ.
- `donnees/` : **tous les nombres** (`champs.js` scénario et profils des nations, `economie.js`, `lois.js`, `batiments.js`, `factions.js`, `diplomatie.js`, `guerre.js`). Valeur jamais chiffrée dans la partie 1 : `// ASSUMPTION: …`, listée dans la réponse pour validation.
- Tests : `neuf()` = départ sans guerre (Val-Roc « commerçant ») pour tester une règle seule, `vrai()` = scénario réel. `node outils/politique-tests.js` (lancé par `verifications.js`). Bots : `outils/politique-bots.js` ; lots : `node outils/politique-simulateur.js --parties 200`, `--balayage guerre.defaite.colere=10,5,2`.

## Règles du chantier
- **Liste fermée** : seulement ce qui est dans `specs/politique/regles-v1.md`. Toute idée nouvelle → `specs/politique/backlog-v2.md`, puis accord de l'utilisateur.
- Chaque règle écrite = un test. Pas d'équilibrage à l'intuition : simulations avant/après.
- En cas d'ambiguïté de règle : demander.
- Identifiants du code en français (comme le reste du dépôt) ; les `id` des lois et bâtiments gardent ceux de `regles-v1.md`.

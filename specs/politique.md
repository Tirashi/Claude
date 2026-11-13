# Politique (« Victoria 3 minimaliste », nom à trouver) — chantier

Jeu de gestion politique au tour par tour : une petite nation, ses ressources, ses lois, ses factions, la diplomatie et la guerre.
Une première partie a été jouée à la main avec un LLM comme maître du jeu ; ses incohérences motivent un **moteur de règles déterministe, testé par simulation**, puis un écran par-dessus.
Proche de l'idée « Grande stratégie commerciale victorienne » d'`IDEES.md`.

## 1. Documents de l'utilisateur (13/11)
- [`politique/regles-v1.md`](politique/regles-v1.md) : règles V1, **source de vérité du moteur**.
- [`politique/backlog-v2.md`](politique/backlog-v2.md) : idées V2 et problèmes, **hors périmètre** tant que non validé.
- [`politique/plan-simulateur.md`](politique/plan-simulateur.md) : plan du moteur, des bots, des métriques, jalons M0 à M7.
- [`politique/bilan-partie-1.md`](politique/bilan-partie-1.md) : bilan de la partie 1 et pistes V2.

## 2. Adaptation au dépôt
Les documents parlent de `engine/ data/ sim/ test/ ui/`, de modules ES et de `node --test`. Dans la Ludothèque :

| Document | Dépôt |
|---|---|
| `engine/` | `politique/moteur/` (scripts classiques, `window.Politique.X` / `require`) |
| `data/`, `data/scenarios/champs.js` | `politique/donnees/`, `politique/donnees/champs.js` |
| `test/`, `node --test` | `outils/politique-tests.js` (lancé par `outils/verifications.js`) |
| `sim/run.js` | `outils/politique-simulateur.js` (M4) |
| `ui/` | `politique/index.html` + fiche, **après une maquette validée** (règle « maquette d'abord ») |
| `docs/` | `specs/politique/` |

Identifiants du code en français comme le reste du dépôt ; les `id` des lois et bâtiments restent ceux des règles V1.

## 3. Jalons
- **M0 — socle** ✅ (13/11) : hasard mulberry32 à graine, état initial du scénario `champs`, tour vide, tests (déterminisme, état non modifié, JSON, action hors liste refusée).
- **M1** — économie, capital politique, lois, bâtiments : **attend la validation du § 4**.
- M2 factions, M3 diplomatie et guerre, M4 bots, M5 métriques, M6 backlog, M7 écran : voir le plan.

## 4. Valeurs à valider (propositions du 13/11)
Liste détaillée dans la réponse de la session du 13/11 ; les valeurs retenues seront recopiées ici une fois validées.

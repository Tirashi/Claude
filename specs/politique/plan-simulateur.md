# Plan du moteur et du simulateur

Objectif : tester les règles par le calcul (milliers de parties) au lieu de l'intuition d'un joueur ou d'un LLM.

## Principes
- Moteur pur et déterministe : `nextTurn(state, actions, rng) -> newState`, état JSON, RNG à graine (mulberry32) injecté.
- Règles et chiffres en données (`data/`), logique générique dans `engine/`.
- Même code dans Node (tests, sim) et le navigateur (jeu).
- Le moteur expose aussi `getAvailableActions(state)` : c'est ce que voient l'UI et les bots (jamais d'action hors liste).

## Structure proposée
```
engine/    state.js rng.js turn.js economy.js factions.js laws.js buildings.js diplomacy.js war.js
data/      laws.js buildings.js nations.js events.js scenarios/champs.js
sim/       run.js metrics.js bots/*.js ai/*.js report.js
test/      *.test.js
ui/        (plus tard)
```

## Jalons
**M0 — Socle** : arborescence, RNG, état initial du scénario `champs` (valeurs `ASSUMPTION` listées), test de déterminisme (même graine = même partie).

**M1 — Économie + capital politique + lois + bâtiments** (RULES_V1, sans diplomatie ni guerre).
Tests : une loi par catégorie, délai de 2 tours, files de construction (2 slots), formules d'impôt, bornes.

**M2 — Factions** : colère, puissance, seuils, apaisement, chocs de lois, risque de révolte. Tests unitaires par effet de loi.

**M3 — Diplomatie, commerce, traités, réputation, guerre par bataille** avec IA à politiques simples écrites (priorité + seuil + tirage). Les **À TRANCHER** de la guerre doivent être validés avant.

**M4 — Bots et runner** :
- `replica` : rejoue la trajectoire de la partie 1 (sert de test de non-régression : doit finir proche de 3214 or / réputation +42 ; si ça diverge beaucoup, les `ASSUMPTION` sont à revoir).
- `economy` (tout dans la croissance), `spam_medicine`, `militarist`, `no_appeasement`, `random`.
- `node sim/run.js --games 1000 --bot <nom> --turns 60 --seed 1` → JSON + résumé texte.

**M5 — Métriques et balayages**. Par bot et en agrégé :
- tour où le catalogue de lois est entièrement acheté (et part du catalogue jamais acheté) ;
- trésor et CP médians aux tours 20, 40, 60 ;
- nombre de tours avec au moins une faction ≥ 55 / 75 ; fréquence des grèves et révolutions ;
- taux de victoire / défaite / guerre par bot ;
- **détection de stratégie dominante** : un bot qui bat tous les autres à > X % ;
- tours « sans décision réelle » (une seule action raisonnable possible) ;
- balayage de paramètre : `--sweep appeasement.cost=8,12,20` → courbes comparées.

**M6 — Backlog V2** (prix dynamiques, événements, etc.) : un item à la fois, en comparant les métriques avant/après. Seulement après accord.

**M7 — UI** : affichage de l'état, liste d'actions disponibles, bouton tour suivant, sauvegarde `localStorage`, déploiement GitHub Pages.

## Invariants à tester en continu
- Déterminisme (graine fixe).
- `nextTurn` ne mute pas son entrée.
- Une seule loi active par catégorie.
- Colère et puissance dans leurs bornes ; stocks non négatifs (ou conséquence explicite).
- Aucune action hors `getAvailableActions` n'est acceptée.
- L'état reste sérialisable en JSON et se recharge à l'identique.

## Définition de « terminé » pour un jalon
Tests verts, README du jalon à jour, valeurs `ASSUMPTION` listées dans la réponse, et pour M4+ : un rapport de simulation joint.

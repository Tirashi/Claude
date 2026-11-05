# Résistance — notes pour Claude
Rogue-lite tactique façon Fire Emblem GBA, repris le 28/10 d'un dépôt fait avec une autre IA. Cahier des charges : [`specs/resistance.md`](../specs/resistance.md) (§ 5 technique, détails en fin de fichier).
- `js/` : 30 scripts classiques (anciens modules ES). Chacun lit ses dépendances dans `window.Resistance` et y range ce qu'il partage ; **l'ordre des `<script>` de `index.html` suit les dépendances**.
  - `core/` : images (`assets`), chiffres, hasard (`rng`), sauvegarde, vue.
  - `data/` : classes, pays, rencontres, événements, forteresse, icônes, objets, cartes, rebelles, recrues, terrain, armes.
  - `run/` : forteresse, partie, génération et carte de la run, validation.
  - `battle/` : IA, bataille, combat, guide, chemins, progression, rendu, interface.
  - `main.js` : démarrage.
- `assets/` : Fantasy Battle Pack, IvoryRed, Mini World, Mana Soul (crédits) ; police `polices/pixelify-sans.woff2`.
- Sauvegardes `resistance.save` (forteresse) et `resistance.run` (run en cours, reprise au lancement ; un combat interrompu recommence ; `PROGRESS` de l'accueil).
- Tests : `__game`, `__run`, `__battle`. Pas de classement ni d'artefact.

## Pièges
- Pas de modules ES : un nouveau script va dans `index.html` à sa place dans l'ordre, et dans `FILES` de `sw.js`.

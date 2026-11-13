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
- **M1 — économie, capital politique, lois, bâtiments** ✅ (13/11) : `donnees/economie.js`, `lois.js`, `batiments.js` ; `moteur/economie.js`, `lois.js`, `batiments.js`, `tour.js`. Les effets des lois sur les factions sont écrits dans les données mais appliqués en M2. Filature de l'Entente, forge et fortifications attendent M3.
- **M2 — factions** ✅ (13/11) : `donnees/factions.js`, `moteur/factions.js` : chocs à l'adoption, effets par tour (durée limitée pour la puissance des syndicats), dissipation, suffrages (apaisement à moitié prix, hausses ralenties), apaisement (action `apaiser`), bornes, statuts, moral, grève, révolte, révolution (fin de partie).
- M3 diplomatie et guerre, M4 bots, M5 métriques, M6 backlog, M7 écran : voir le plan.

## 4. Valeurs validées (13/11, toutes les propositions par défaut)
**Économie** : trésor 200, capital politique 0, 80 familles, 4 fermes et 1 mine ; +1 %/tour de familles, plafond 200 ; impôts = familles × 1 or × loi ;
besoins par famille grain 1, tissu 0,2, outils 0,1 ; armée 4 fer + 2 tissu ; atelier 5 fer ; surplus vendu et déficit acheté au prix du tour, sans stock ;
conscription 12 or, milice 0 ; code du travail −6 % sur toute la production ; bâtiments payés à la commande, productifs le tour qui suit leur fin ;
trésor négatif permis, sans conséquence en V1 ; crise du tissu au tour 1 : tissu ×1,5 pendant 6 tours.
Effets « à terme » (croissance des écoles +0,5 / +1 %, artisans +35 / +50 % sur ateliers et tissages) : montée en ligne droite sur 10 tours après l'adoption (repart de zéro quand l'école gratuite remplace la publique).

**Factions** (appliquées en M2) : colère / puissance de départ paysans 30/40, ouvriers 35/25, artisans 25/30, patrons 20/45 ; dissipation −1 colère/tour ; apaisement une fois par faction et par tour ;
chocs : impôt progressif patrons +5, armée de métier ouvriers −5, conscription ouvriers +5 colère et +10 puissance ; syndicats +3 puissance pendant 10 tours ;
suffrage universel patrons +15 colère ; populaires = paysans, ouvriers ; élites = patrons, artisans.

**Nations** : Val-Roc −20 / 400 or / 90 familles ; Brume +20 / 600 / 100 ; Contreforts 0 / 150 / 50 ; réputation de départ 0.

**À TRANCHER, tranchés** : 7 catégories de lois ; barème de réputation (don +1 par 20 or, max +5 ; traité signé +3 ; respecté +2 tous les 10 tours ; rompu −15 ; sanction légitime +3, illégitime −5 ; guerre d'agression −20 ; attaque d'un membre de l'Entente −30 ; suffrages ±5 ; paria sous −50) ;
moral : 1 jusqu'à colère 40, puis linéaire jusqu'à 0 à 100, grève (≥ 75) plafonnée à 0,5, révolte 0, moyenne pondérée par la puissance.
Restent pour M3 : cumul des bonus de guerre (multiplicatif proposé), effet de l'embargo sur l'économie visée.

**Ajoutées en M1** (même logique, à confirmer) : une seule loi **en cours** par catégorie ; plusieurs actions par tour, chacune vérifiée sur l'état laissé par la précédente ;
ordre du tour T : événements → actions → adoption des lois (lancée en T, en vigueur en T + 2, effets dès ce tour) → économie → démographie → chantiers → +15 capital politique → T + 1 ;
montants arrondis au centime.

**Proposées avec M2 (à valider)** : bâtiments de chaque faction (paysans fermes, ouvriers mines, artisans ateliers et tissages ; patrons : les impôts) ;
grève = leurs bâtiments à 50 %, patrons impôts ×0,8 ; révolte = bâtiments arrêtés, patrons impôts ×0,5 ; révolution (colère qui touche 100 à n'importe quel moment du tour) = partie perdue ;
« colère montante 2× plus lente » = toute hausse de colère (chocs et effets par tour) des factions favorisées divisée par 2, pas la puissance ;
statuts calculés en fin de tour : une grève pèse sur l'économie du tour suivant, l'apaisement la lève au tour d'après.

## 5. Premières observations (M1, information, pas d'équilibrage)
`node outils/politique-tests.js --rapport` : sans rien faire, 1 718 or au tour 60 ; un bâtisseur simple (lois sociales dans l'ordre de la partie 1, une ferme dès qu'il n'y a pas de déficit) finit le tour 30 à ~3 100 or (partie 1 : 3 214) mais le tour 60 à ~14 600 or avec 29 fermes.
Une ferme (60 or, +20 grain vendus 1 or) se rembourse en 3 tours et rien ne limite le nombre : c'est le problème A1 du backlog (prix dynamiques en B1), à mesurer en M4/M5.

M2 : aucun joueur du rapport n'atteint la grève. Même un « provocateur » qui adopte impôt sur le capital, syndicats, code du travail, suffrage universel, conscription et école gratuite **sans jamais apaiser** plafonne à 67 de colère (patrons) : en V1 la colère ne monte que par les chocs de lois, et la dissipation (−1/tour) l'efface. L'apaisement est donc inutile (pire que le problème A2). Le plafond de 0,5 du moral en grève ne joue jamais : à colère 75, la formule donne déjà 0,42.


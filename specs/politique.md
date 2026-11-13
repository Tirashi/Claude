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
- **M3a — diplomatie et commerce** ✅ (13/11) : `donnees/diplomatie.js`, profils des nations dans `donnees/champs.js`, `moteur/diplomatie.js` : nations simplifiées, dons, contrats, embargo, Entente des Ports, défense mutuelle, filature conjointe (`entente_mill`), réputation, paria.
- **M3b — guerre et paix** ✅ (13/11) : `donnees/guerre.js`, `moteur/guerre.js` : force, forge, fortifications, déclarations (joueur et Val-Roc), défense mutuelle, Contreforts opportuniste, batailles au hasard à graine, sanctions de bloc de l'Entente, usure et capitulation, clauses (réparations, levée d'embargo, non-réarmement), paix blanche.
- M4 bots et simulateur, M4 bots, M5 métriques, M6 backlog, M7 écran : voir le plan.

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

**Ajoutées en M1, validées le 13/11** : une seule loi **en cours** par catégorie ; plusieurs actions par tour, chacune vérifiée sur l'état laissé par la précédente ;
ordre du tour T : événements → actions → adoption des lois (lancée en T, en vigueur en T + 2, effets dès ce tour) → économie → démographie → chantiers → +15 capital politique → T + 1 ;
montants arrondis au centime.

**Proposées avec M2, validées le 13/11** : bâtiments de chaque faction (paysans fermes, ouvriers mines, artisans ateliers et tissages ; patrons : les impôts) ;
grève = leurs bâtiments à 50 %, patrons impôts ×0,8 ; révolte = bâtiments arrêtés, patrons impôts ×0,5 ; révolution (colère qui touche 100 à n'importe quel moment du tour) = partie perdue ;
« colère montante 2× plus lente » = toute hausse de colère (chocs et effets par tour) des factions favorisées divisée par 2, pas la puissance ;
statuts calculés en fin de tour : une grève pèse sur l'économie du tour suivant, l'apaisement la lève au tour d'après.

## 5. Premières observations (M1, information, pas d'équilibrage)
`node outils/politique-tests.js --rapport` : sans rien faire, 1 718 or au tour 60 ; un bâtisseur simple (lois sociales dans l'ordre de la partie 1, une ferme dès qu'il n'y a pas de déficit) finit le tour 30 à ~3 100 or (partie 1 : 3 214) mais le tour 60 à ~14 600 or avec 29 fermes.
Une ferme (60 or, +20 grain vendus 1 or) se rembourse en 3 tours et rien ne limite le nombre : c'est le problème A1 du backlog (prix dynamiques en B1), à mesurer en M4/M5.

M2 : aucun joueur du rapport n'atteint la grève. Même un « provocateur » qui adopte impôt sur le capital, syndicats, code du travail, suffrage universel, conscription et école gratuite **sans jamais apaiser** plafonne à 67 de colère (patrons) : en V1 la colère ne monte que par les chocs de lois, et la dissipation (−1/tour) l'efface. L'apaisement est donc inutile (pire que le problème A2). Le plafond de 0,5 du moral en grève ne joue jamais : à colère 75, la formule donne déjà 0,42.


## 5 bis. Observations M3a (information)
Joueur « diplomate » du rapport (bâtisseur + Entente avec Brume et Contreforts, contrat de tissu, filature, défense mutuelle, embargo contre Val-Roc au tour 15) : 3 250 or et réputation +34 au tour 30 (partie 1 : 3 214 or, +42 avec la guerre et la paix).
L'embargo ne mord presque pas : la colère de Val-Roc n'est qu'à 27,5 au tour 30 (48 au tour 60), car le joueur n'a qu'un petit surplus de grain. La victoire par usure (moral < 0,3, soit colère ≥ 82 environ) serait hors d'atteinte en M3b avec ces valeurs : à mesurer avant d'équilibrer.

## 5 ter. Observations M3b (information, rien n'a été équilibré)
`--rapport` sur 50 graines : la guerre décide de tout. Val-Roc démarre à 640 de force contre 200 pour le joueur (trésor 400 × conscription 1,6) : il remplit la condition « 1,2× plus fort » dès le tour 1, déclare la guerre dans les premiers tours (30 % par tour), livre bataille à chaque tour où il est plus fort, et chaque défaite ajoute +10 de colère à toutes nos factions. Révolution en ~9 tours pour les joueurs qui investissent (leur trésor, donc leur force, baisse) : bâtisseur 50/50, provocateur 50/50, diplomate 49/50 ; même le joueur qui ne fait rien finit en révolution 36 fois sur 50.
Leviers possibles (à mesurer par balayage en M4/M5, pas à l'intuition) : trésor ou force de départ de Val-Roc, seuil de déclaration (1,2), colère d'une défaite (+10), une bataille ennemie par tour, la force tirée du trésor non dépensé (problème A5 du backlog), pas de trêve après la paix (Val-Roc peut redéclarer la guerre au tour suivant : relation restée à −100).

## 6. Propositions pour M3 (13/11, validées le 13/11)
**Détails ajoutés en écrivant M3b (à confirmer)** : une seule guerre à la fois ; une forge ou des fortifications ne comptent qu'une fois quel que soit leur nombre ; l'attaque d'un membre de l'Entente coûte −30 **au lieu de** −20 (pas les deux), plus −15 par traité rompu avec la cible ; sanctions de bloc contre le joueur = chaque autre membre rompt ses traités et contrats (sans pénalité de réputation pour le joueur), relation −30, et le met sous embargo (sans effet sur le marché du joueur en V1) ; sanctions de bloc contre une nation = elle manque de ce que les membres exportent ; Contreforts peut rejoindre Val-Roc si Val-Roc est le plus fort (les relations entre nations ne sont pas modélisées) ; les alliés ne livrent pas de bataille à part, ils perdent comme leur camp ; l'ennemi accepte la paix blanche s'il n'est pas plus fort ; quand nous capitulons, l'ennemi impose toutes les clauses ; quand l'ennemi capitule, la guerre est suspendue jusqu'à ce que le joueur choisisse ses clauses ; à la paix, les sanctions liées à la guerre sont levées ; le non-réarmement n'empêche pas le perdant de redéclarer la guerre, et un joueur sous la clause ne peut tout simplement pas la violer (le « ré-embargo » n'arrive donc jamais en V1).

**Détails ajoutés en écrivant M3a (à confirmer)** : un don par nation et par tour ; un embargo est une sanction légitime seulement contre une nation en guerre contre le joueur ou un membre de l'Entente (donc toujours −5 avant M3b) ; un embargo annule les contrats avec la cible ; rompre un traité rompt ceux qui en dépendent (Entente → filature, −15 chacun) ; une filature déjà construite reste au joueur après la rupture, tout son tissu va alors au marché ; la réputation « traité respecté » compte la filature comme un traité ; Entente : les tarifs jouent dès qu'on a l'Entente avec une seule nation ; une rupture ne change pas la relation (le barème ne le prévoit pas).

M3 coupé en deux : **M3a** diplomatie, commerce, traités, réputation, économie simplifiée des nations ; **M3b** guerre, paix, forge, fortifications, politiques militaires des nations.

**Nations de l'ordinateur (modèle simplifié, pas de lois ni de bâtiments)** : trésor, familles (+0,5 %/tour), revenu = familles × taux − 12 (armée) ; une seule jauge de colère (dissipation −1/tour) qui donne le moral par la formule des factions ; loi militaire fixe ; un profil commercial fixe (ce qu'elles importent et exportent chaque tour).

| Nation | Taux | Armée | Colère | Exporte | Importe |
|---|---|---|---|---|---|
| Val-Roc | 1,0 | conscription ×1,6 | 30 | fer 10 | grain 15, tissu 5 |
| Brume | 1,3 | milice ×1 | 20 | tissu 20 | fer 10, grain 5 |
| Contreforts | 1,0 | armée de métier ×1,3 | 25 | outils 10 | grain 5 |

**Commerce** : contrats tirés d'une liste fixe par nation (ex. Brume vend 10 tissu à 1,6 ; Contreforts vend 5 outils à 1,6 ; Val-Roc achète 10 grain à 1,3), 10 tours ; la nation accepte si relation ≥ 0. Le volume du contrat remplace le marché à ce prix ; s'il manque au joueur, il est acheté au marché pour être livré.
**Relations** : traité signé +10, contrat +5, don +1 par 5 or, embargo −30 avec la cible, guerre → −100 ; bornes −100/+100 ; pas de dérive.
**Dons** : 20, 50 ou 100 or (réputation selon le barème validé).
**Embargo** (À TRANCHER) : le joueur cesse de vendre à la cible ; pour chaque bien qu'elle importe et dont le joueur a un surplus, il lui manque min(import, surplus) unités : colère +1 par 3 unités manquantes et par tour, trésor − (manque × prix). Pour le joueur : rien en V1 (marché anonyme) sauf relation et réputation — c'est le problème A3 du backlog, reproduit tel quel.
**Traités** (acceptés selon la relation) :
- Entente des Ports (relation ≥ 30) : achats −10 % et ventes +10 % pour ses membres ; consultation = un membre ne peut pas attaquer un autre membre (sinon traité rompu, −15) ; attaquer un membre = embargo de tous les membres.
- Défense mutuelle (≥ 50) : si l'un est attaqué, l'autre entre en guerre ; les forces s'additionnent.
- Filature conjointe (Brume, ≥ 30, Entente requise) : bâtiment `entente_mill` à 50 or pour le joueur, +18 tissu dont 6 livrés à Brume à 1 or.
- Non-réarmement : clause de paix (M3b).
**Paria** : réputation < −50 → plus aucun traité ni contrat accepté.

**Guerre (M3b)** :
- Force = trésor (≥ 0) × loi militaire × moral × forge 1,15 × fortifications 1,2 (en défense) — bonus **multipliés** (À TRANCHER) ; alliés : forces additionnées.
- Forge : consomme 10 fer + 8 or par tour, toujours.
- Bataille (action, une par tour et par guerre) : l'attaquant gagne avec la probabilité Fa / (Fa + Fd), tirée au hasard à graine. Perdant : −25 % de trésor et +10 de colère (toutes les factions pour le joueur).
- Usure : un camp dont le moral passe sous 0,3 capitule.
- Paix : capitulation (le vainqueur choisit les clauses) ou paix blanche après 5 tours sans bataille si les deux le veulent. Clauses : réparations (25 % du trésor du perdant, plafond 300), levée d'embargo, non-réarmement (15 tours sans changer de loi militaire ni bâtir de forge ; sinon ré-embargo automatique).
- **Territoire** : pas de carte en V1 → pas de pertes de territoire ni de clause de restitution (proposé au backlog).
- Politiques : Val-Roc déclare la guerre si sa force > 1,2 × la force du joueur et de ses alliés, relation < 0 et tirage < 30 % ; livre bataille si sa force dépasse celle d'en face ; Brume ne déclare jamais la guerre et honore la défense mutuelle ; Contreforts, quand une guerre éclate, rejoint le camp le plus fort avec lequel sa relation est ≥ 0 (tirage 50 %).

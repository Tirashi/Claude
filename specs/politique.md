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
| `sim/run.js`, `sim/bots/` | `outils/politique-simulateur.js`, `outils/politique-bots.js` |
| `ui/` | `politique/index.html` + fiche, **après une maquette validée** (règle « maquette d'abord ») |
| `docs/` | `specs/politique/` |

Identifiants du code en français comme le reste du dépôt ; les `id` des lois et bâtiments restent ceux des règles V1.

## 3. Jalons
- **M0 — socle** ✅ (13/11) : hasard mulberry32 à graine, état initial du scénario `champs`, tour vide, tests (déterminisme, état non modifié, JSON, action hors liste refusée).
- **M1 — économie, capital politique, lois, bâtiments** ✅ (13/11) : `donnees/economie.js`, `lois.js`, `batiments.js` ; `moteur/economie.js`, `lois.js`, `batiments.js`, `tour.js`. Les effets des lois sur les factions sont écrits dans les données mais appliqués en M2. Filature de l'Entente, forge et fortifications attendent M3.
- **M2 — factions** ✅ (13/11) : `donnees/factions.js`, `moteur/factions.js` : chocs à l'adoption, effets par tour (durée limitée pour la puissance des syndicats), dissipation, suffrages (apaisement à moitié prix, hausses ralenties), apaisement (action `apaiser`), bornes, statuts, moral, grève, révolte, révolution (fin de partie).
- **M3a — diplomatie et commerce** ✅ (13/11) : `donnees/diplomatie.js`, profils des nations dans `donnees/champs.js`, `moteur/diplomatie.js` : nations simplifiées, dons, contrats, embargo, Entente des Ports, défense mutuelle, filature conjointe (`entente_mill`), réputation, paria.
- **M3b — guerre et paix** ✅ (13/11) : `donnees/guerre.js`, `moteur/guerre.js` : force, forge, fortifications, déclarations (joueur et Val-Roc), défense mutuelle, Contreforts opportuniste, batailles au hasard à graine, sanctions de bloc de l'Entente, usure et capitulation, clauses (réparations, levée d'embargo, non-réarmement), paix blanche.
- **M4 — bots et simulateur** ✅ (13/11) : `outils/politique-bots.js` (passif, economy, spam_medicine, no_appeasement, militarist, random, replica), `outils/politique-simulateur.js` (`--parties`, `--bot`, `--tours`, `--graine`, `--json`, `--controle`) ; métriques par partie (fins, durée, trésor et capital politique aux tours 20/30/40/60, réputation, guerres, batailles, colère, grèves, apaisements, lois adoptées, catalogue complet).
- **M5 — métriques et balayages** ✅ (13/11) : `--regle chemin=valeur`, `--balayage chemin=v1,v2,v3` (tableau comparatif, données modifiées en mémoire seulement), confrontations bot contre bot et stratégie dominante, issue des guerres, lois jamais adoptées, tours sans vraie décision politique.
- **Décisions du 13/11** : colère d'une défaite 10 → 5 ; trêve de 10 tours après une paix (backlog E1). Règles complètes du moteur : [`politique/regles-moteur.md`](politique/regles-moteur.md).
- M6 : brainstorming sur les règles, puis backlog (un item à la fois, après accord). M7 écran (après maquette).

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
Ancien rapport des tests (remplacé par le simulateur en M4) : sans rien faire, 1 718 or au tour 60 ; un bâtisseur simple (lois sociales dans l'ordre de la partie 1, une ferme dès qu'il n'y a pas de déficit) finit le tour 30 à ~3 100 or (partie 1 : 3 214) mais le tour 60 à ~14 600 or avec 29 fermes.
Une ferme (60 or, +20 grain vendus 1 or) se rembourse en 3 tours et rien ne limite le nombre : c'est le problème A1 du backlog (prix dynamiques en B1), à mesurer en M4/M5.

M2 : aucun joueur du rapport n'atteint la grève. Même un « provocateur » qui adopte impôt sur le capital, syndicats, code du travail, suffrage universel, conscription et école gratuite **sans jamais apaiser** plafonne à 67 de colère (patrons) : en V1 la colère ne monte que par les chocs de lois, et la dissipation (−1/tour) l'efface. L'apaisement est donc inutile (pire que le problème A2). Le plafond de 0,5 du moral en grève ne joue jamais : à colère 75, la formule donne déjà 0,42.


## 5 bis. Observations M3a (information)
Joueur « diplomate » du rapport (bâtisseur + Entente avec Brume et Contreforts, contrat de tissu, filature, défense mutuelle, embargo contre Val-Roc au tour 15) : 3 250 or et réputation +34 au tour 30 (partie 1 : 3 214 or, +42 avec la guerre et la paix).
L'embargo ne mord presque pas : la colère de Val-Roc n'est qu'à 27,5 au tour 30 (48 au tour 60), car le joueur n'a qu'un petit surplus de grain. La victoire par usure (moral < 0,3, soit colère ≥ 82 environ) serait hors d'atteinte en M3b avec ces valeurs : à mesurer avant d'équilibrer.

## 5 ter. Observations M3b (information, rien n'a été équilibré)
Rapport sur 50 graines : la guerre décide de tout. Val-Roc démarre à 640 de force contre 200 pour le joueur (trésor 400 × conscription 1,6) : il remplit la condition « 1,2× plus fort » dès le tour 1, déclare la guerre dans les premiers tours (30 % par tour), livre bataille à chaque tour où il est plus fort, et chaque défaite ajoute +10 de colère à toutes nos factions. Révolution en ~9 tours pour les joueurs qui investissent (leur trésor, donc leur force, baisse) : bâtisseur 50/50, provocateur 50/50, diplomate 49/50 ; même le joueur qui ne fait rien finit en révolution 36 fois sur 50.
Leviers possibles (à mesurer par balayage en M4/M5, pas à l'intuition) : trésor ou force de départ de Val-Roc, seuil de déclaration (1,2), colère d'une défaite (+10), une bataille ennemie par tour, la force tirée du trésor non dépensé (problème A5 du backlog), pas de trêve après la paix (Val-Roc peut redéclarer la guerre au tour suivant : relation restée à −100).

## 5 quater. Premier passage du simulateur (M4, 200 parties par bot, graines 1 à 200 ; information, rien n'a été équilibré)
| Bot | Fins | Trésor t30 / t60 | Guerre (tours) | Batailles G / P | Apaisements | Lois |
|---|---|---|---|---|---|---|
| passif | révolution 66 % | −515 / −1 983 | 20 | 1,0 / 10,1 | 0 | 0 |
| economy | fin 100 % | 637 / 9 214 | 49 | 6,9 / 35,4 | 71 | 3 |
| spam_medicine | fin 100 % | 588 / 7 748 | 52 | 6,8 / 37,5 | 56 | 4 |
| no_appeasement | révolution 97 % (17 tours) | — | 10 | 0,8 / 6,9 | 0 | 3 |
| militarist | fin 98 % | 97 / 70 | 59 | 3,3 / 49,3 | 101 | 2 |
| random | révolution 100 % (11 tours) | — | 9 | 0,5 / 8,2 | 2 | 2 |
| replica | fin 100 % | 2 739 / 8 960 | 16 | 1,6 / 11,5 | 19 | 8 |

- **Non-régression (replica)** : 2 739 or et réputation +27 au tour 30, contre 3 214 et +42 dans la partie 1 (−15 % d'or, −15 de réputation) ; la guerre dure 16 tours au lieu de 3 et coûte 11,5 défaites.
- **L'apaisement est devenu vital** (à cause de la guerre, pas des lois) : sans lui, révolution 97 % ; avec, aucune grève. 12 or contre −18 de colère reste la parade à tout (problème A2 du backlog, sous une autre forme).
- **Val-Roc est en guerre contre le joueur presque toute la partie** et gagne 80 à 95 % des batailles : il n'attaque que quand il est plus fort.
- **Le catalogue n'est jamais acheté en entier** (lois exclusives par catégorie) ; le capital politique s'accumule chez les bots qui ne votent pas (passif 900, militarist 825 au tour 60).

## 5 quinquies. Balayages M5 (13/11, 100 parties par bot et par valeur ; information, aucune valeur changée)
**Choix de mesure (à confirmer)** : un bot en bat un autre sur une graine s'il finit la partie et pas l'autre, sinon s'il a plus d'or à la fin (deux révolutions : celui qui tient le plus longtemps) ; stratégie dominante = bat chaque autre bot sur plus de 75 % des graines ; « tour sans vraie décision » = au plus une loi, un traité, un contrat ou une action de guerre possible (les bâtiments ne comptent pas, toujours possibles dès 60 or).
- **Stratégie dominante : aucune.** economy bat spam_medicine 82 % du temps, fait jeu égal avec replica (51 %) ; la Médecine du travail d'abord n'est pas dominante (problème A3 non confirmé par les chiffres).
- **Tours sans vraie décision : ~0 %** (3 % pour replica, 6 % pour no_appeasement) : le capital politique s'accumule, il y a toujours une loi à lancer, et une bataille possible en guerre.
- **Trésor de départ de Val-Roc** (400 / 200 / 100) et **seuil de déclaration** (1,2 / 2 / 3) : presque aucun effet (guerre 45 à 50 tours sur 60 pour economy dans tous les cas). Val-Roc gagne ~78 or par tour sans rien dépenser, sa force (= trésor) dépasse vite n'importe quel seuil : c'est le problème A5 du backlog (force tirée du trésor non dépensé), le vrai moteur des guerres sans fin, avec l'absence de trêve.
- **Colère d'une défaite** (10 / 5 / 2) : le levier le plus fort. À 5, plus aucune révolution pour passif (66 % → 0 %) ni militarist, apaisements d'economy divisés par 2,4 (67 → 28), replica inchangé (2 794 or au tour 30). no_appeasement et random restent en révolution : l'apaisement reste utile sans être obligatoire.
- **Coût de l'apaisement** (12 / 24 / 36) : à 24, economy perd 57 % de son or au tour 60 sans révolution ; à 36, 15 à 20 % de révolutions pour economy, spam_medicine et replica. Rendre l'apaisement cher sans toucher à la guerre punit surtout les bons joueurs.
- **Militarist** : un essai d'apaisement plus tardif (70) l'a fait passer de 2 % à 52 % de révolutions ; retiré.

## 5 sexies. Bilan avant M6 (13/11, défaite à +5 et trêve, 200 parties par bot)
| Bot | Fins | Or t30 / t60 | Guerre (tours) | Batailles G / P | Apaisements | Grève |
|---|---|---|---|---|---|---|
| passif | fin 100 % (avant : révolution 66 %) | −271 / −1 303 | 26 | 1,5 / 22,0 | 0 | 100 % |
| economy | fin 100 % | 756 / 9 785 | 49 | 8,5 / 33,2 | 28 (avant 67) | 0 % |
| spam_medicine | fin 100 % | 750 / 9 363 | 49 | 8,3 / 33,8 | 10 | 0 % |
| no_appeasement | révolution 96 % | — | 16 | 1,7 / 13,8 | 0 | 97 % |
| militarist | fin 100 % | 143 / 109 | 59 | 5,0 / 51,2 | 41 | 0 % |
| random | révolution 95 % | — | 20 | 1,3 / 22,5 | 4 | 98 % |
| replica | fin 100 % | 2 781 / 9 003 | 16 | 2,2 / 11,7 | 6 | 0 % |

**Ce qui va** : moteur stable et reproductible ; aucune stratégie dominante (economy bat spam_medicine 79 %, égalité avec replica 56/44) ; un joueur qui gère ses factions ne fait jamais grève, un joueur qui les néglige va à la révolution ; replica proche de la partie 1 (2 781 or au tour 30 contre 3 214) et **gagne sa guerre par l'usure** (embargo + sanctions de l'Entente : 1 guerre gagnée par partie), la thèse de la partie 1 tient.

**Ce qui ne va pas** :
1. **Guerre perpétuelle** : toutes les parties, 49 tours sur 60 pour economy, 59 pour militarist ; Val-Roc gagne ~80 % des batailles. La trêve ne joue presque pas, faute de paix (Val-Roc, toujours plus fort, ne capitule ni n'accepte la paix blanche). Cause : force = trésor, et Val-Roc ne dépense rien (+78 or/tour) (A5).
2. **L'investissement militaire ne rapporte rien** : militarist garde ~130 or, sa conscription multiplie presque zéro (A5).
3. **Trésor sans débouché** : economy 9 785 or au tour 60, no_appeasement 17 069 (A1 ; une ferme se rembourse en 3 tours).
4. **Capital politique sans débouché** : 825 à 900 chez les bots qui votent peu ; même les bons bots n'adoptent que 3 ou 4 lois (A1, B5).
5. **L'apaisement reste la parade universelle** : avec, jamais de grève ; sans, 96 % de révolutions (A2).
6. **Pas de hasard hors des batailles** : une seule crise écrite au tour 1 (A4).
7. **La Médecine du travail n'est pas dominante** (A3 non confirmé) : elle remplace des apaisements (28 → 10) pour 10 or par tour.

**Pistes du backlog les plus prometteuses** (ordre proposé) : B4 stock militaire distinct du trésor (règle 1 et 2) ; B1 prix dynamiques (règle 3, et rend embargos et traités systémiques) ; B2 deck d'événements (règle 6, tensions de milieu de partie) ; B5 capital politique dégressif et lois rapportables (règle 4) ; coûts croissants de l'apaisement (A1 « coûts croissants », règle 5).

## 8. V2, étape 1 : 40 tours et régions (13/11)
Fait : `donnees/carte.js` (terrains), régions dans `champs.js`, `moteur/batiments.js` (un chantier par région, emplacements, bonus de terrain), délais raccourcis. 183 tests. Avant (V1, 60 tours) → après (200 parties par bot) :

| Bot | Or t40 avant → après | Guerre (tours) | Batailles P | Révolutions | Apaisements |
|---|---|---|---|---|---|
| economy | 1 386 → 8 217 | 49/60 → 20/40 | 33 → 13 | 0 % → 0 % | 28 → 5 |
| spam_medicine | 1 342 → 7 857 | 49/60 → 20/40 | 34 → 13 | 0 % → 0 % | 10 → 1 |
| no_appeasement | — → 9 443 | 16 → 16 | 14 → 10 | 96 % → 59 % | 0 |
| militarist | 130 → 6 313 | 59/60 → 14/40 | 51 → 7 (2,65 guerres gagnées) | 0 % → 0 % | 41 → 1 |
| replica | 4 872 → 8 173 | 16 → 12 | 12 → 6 | 0 % → 0 % | 6 → 1 |

- L'économie va **beaucoup plus vite** (bonus de terrain, 4 chantiers en parallèle, délais courts) : le trésor déborde encore plus (A1). Attendu : l'armée en régiments (étape 2) et le marché (étape 3) doivent l'absorber.
- Plus riches, les bots tiennent tête à Val-Roc : guerres deux fois plus courtes, et militarist gagne ses guerres (2,65 par partie).
- Aucune stratégie dominante (economy bat spam_medicine 90 %, replica 51 %).
- replica n'est plus une référence de non-régression (règles V2 ≠ partie 1).

## 7. Brainstorming M6 (13/11)
Décisions : public adulte (l'utilisateur surtout), parties sauvegardées, **40 tours** ; grille de décision (une règle = une phrase, effet visible, un choix, liée à deux systèmes, 5 systèmes au plus) ; tableau des mécaniques validé ; réputation fusionnée dans les relations, à juger aux simulations ; personas cachés ; une seule carte. Premier jet chiffré : [`politique/regles-v2.md`](politique/regles-v2.md) (à valider).

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

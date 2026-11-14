# Règles V2 (premier jet validé le 13/11)

Issu du brainstorming M6 (`backlog-v2.md` F et G, `specs/politique.md` § 7).
Tous les nombres sont des propositions de Claude, **validées le 13/11** ; ils vont dans `politique/donnees/` marqués `ASSUMPTION validée (V2)`.

**Réponses du 13/11** : paniers des factions gardés tels quels (les patrons restent aussi sensibles aux lois d'impôt par leurs chocs) ; **cession d'une région** ajoutée aux clauses de paix ; caserne et fort remplacent forge et fortifications ; le reste validé.

## Décisions de l'utilisateur (13/11)
- Public : l'utilisateur surtout, des adultes. Une partie peut être un peu longue si elle se **sauvegarde**. Objectif : **40 tours**.
- **Grille de décision** : une règle = une phrase ; effet visible avec sa raison ; crée un choix à chaque partie ; touche au moins deux autres systèmes ; au plus 5 systèmes visibles (si on en ajoute un, on en retire un).
- **Tableau validé** : garder régions et chantier par région, plafond selon le terrain, prix qui bougent, niveau de vie, une loi à la fois, personas cachés, armée (régiments, entretien, forts) ; couper routes, biens en plus, gouvernement, services en niveaux ; supprimer le capital politique ; plus tard : entretien des bâtiments et industries privées, guerre en phases.
- **Réputation fusionnée dans les relations** : à essayer, on jugera aux simulations.
- Persona des dirigeants caché ; une seule carte, les mêmes régions à chaque partie.

## Les 5 systèmes
**Carte → bâtiments → marché → factions et lois → armée et voisins.**

### 1. Carte et régions
- Les Champs ont 4 régions fixes :

| Région | Terrain | Emplacements | Bonus |
|---|---|---|---|
| Plaine du Nord | fertile | 4 | ferme ×1,5 |
| Vallée | mixte | 3 | — |
| Collines | filons | 3 | mine ×1,5 |
| Bourg | ville | 4 | atelier et tissage ×1,25 |

- Départ : 2 fermes en Plaine, 2 fermes en Vallée, 1 mine en Collines (même production qu'en V1 à rendement de base).
- **Un chantier par région à la fois** (4 en parallèle au plus) ; un bâtiment occupe un emplacement.
- Chaque nation voisine a 3 régions (sert à l'occupation).

### 2. Bâtiments (délais raccourcis pour 40 tours)
| Bâtiment | Coût | Délai | Effet |
|---|---|---|---|
| Ferme | 60 | 2 | +20 grain |
| Mine | 80 | 3 | +15 fer |
| Atelier d'outils | 90 | 3 | +10 outils, −5 fer |
| Tissage | 110 | 3 | +10 tissu |
| Fort | 80 | 3 | défense de la région ×1,5 (pas d'emplacement) |
| Caserne | 60 | 2 | permet de recruter dans la région |
Filature de l'Entente : inchangée (traité). Forge et fortifications V1 remplacées par la caserne et le fort.

### 3. Marché et niveau de vie
- **« Plus tu vends d'un bien dans le tour, moins il rapporte ; plus tu en achètes, plus il coûte. »** Prix de vente = base × (1 − vendu / 100), au moins ×0,5 ; prix d'achat = base × (1 + acheté / 100), au plus ×1,5.
- **« Chaque faction veut que le pays produise ses biens. »** Couverture d'un bien = production / consommation du pays.

| Faction | Panier |
|---|---|
| Paysans | grain |
| Ouvriers | grain, outils |
| Artisans | tissu, outils |
| Patrons | tissu, fer |

- Couverture moyenne du panier ≥ 100 % : colère −2/tour ; 50 à 100 % : 0 ; < 50 % : +2/tour. Remplace la dissipation fixe de −1.

### 4. Lois (une à la fois)
- **Plus de capital politique.** Une seule loi en débat ; on peut l'abandonner.
- Chaque loi a des factions **pour** et **contre** (dans ses données). Chaque tour de débat (à partir du 2e) : chance d'adoption = 50 % + (puissance des pour − puissance des contre) / 2, bornée entre 10 % et 90 %, affichée.
- Chaque tour de débat, les factions contre prennent +1 de colère.
- Les 11 lois et leurs effets restent ceux de la V1 (à revoir en équilibrage).

### 5. Armée, guerre et voisins
- **Régiments** : recruter coûte 30 or (une caserne requise), entretien 3 or/tour par régiment. Départ : 3 régiments.
- **Force** = régiments × loi militaire (×1 / ×1,3 / ×1,6) × moral ; fort ×1,5 dans la région défendue. Le trésor ne compte plus.
- **Bataille** : l'attaquant vise une région ; il gagne avec la probabilité Fa / (Fa + Fd). Le perdant perd 25 % de ses régiments engagés, le gagnant 10 %. Une attaque gagnée **occupe** la région : elle ne produit plus pour son propriétaire.
- **Paix** : les régions occupées sont rendues, sauf une que le vainqueur peut se faire **céder** (clause « cession ») ; clauses de la V1 (réparations, levée d'embargo, non-réarmement = pas de recrutement). Trêve de 10 tours.
- **Nations** : régiments et recrutement selon leur persona, avec leur or (elles dépensent enfin). Val-Roc commence avec 5 régiments, Brume 3, Contreforts 2.
- **Personas cachés**, tirés au hasard pour chaque dirigeant : belliqueux, marchand, opportuniste, isolationniste, revanchard, idéaliste, prudent. Chacun règle : seuil de déclaration de guerre, relation minimale pour un traité ou un contrat, ralliement à une guerre, recrutement, réaction à un embargo.
- **Relations** (réputation fusionnée) : une seule jauge par nation. Les actions qui touchaient la réputation touchent toutes les relations à la moitié de leur effet (ex. agression : −100 avec la cible, −10 avec les autres).

### 6. Objectifs de victoire (14/11)
- Cinq objectifs mesurés à la fin de la partie (tour 40), chacun avec trois paliers : bronze, argent, or. Une révolution = défaite, aucune médaille.
- **Ambition** : au tour 1, le joueur choisit un objectif (une fois). Sa victoire = la médaille de cet objectif ; les autres sont un bilan.
- **Prospérité** : trésor + coût des bâtiments en service. **Contentement** : 100 − colère moyenne des factions, en moyenne sur la partie. **Puissance** : 10 par région tenue (non occupée) + force de l'armée. **Concorde** : moyenne des relations + 10 par traité en cours. **Autorité** : soutien des factions puissantes aux lois en vigueur (puissance des pour − des contre, moyenne par loi), en moyenne sur la partie.
- Seuils **par pays de départ**, fixés par simulation (`--objectifs --pays tous`), d'après les bots qui visent l'objectif : bronze = leur médiane, argent = 75e centile, or = 87e (`donnees/objectifs.js`, validés le 14/11).
- **Étapes** (option 3) : trois repères par ambition (facile, moyen, difficile), affichés pendant la partie et cochés pour de bon, sans point (`ETAPES` de `donnees/objectifs.js`).

### 7. Pays de départ (14/11)
- Le joueur choisit son pays à la création de la partie : équilibré, agricole, industriel, marchand ou militaire (`donnees/pays.js`). Même carte pour tous.
- Le pays fixe la puissance de départ des factions (total 140), change un ou deux bâtiments (ou emplacements) de départ, l'armée, et met une loi en vigueur depuis longtemps (remplaçable par un débat normal). La colère de départ ne change pas.

### 8. Relation à deux sens, la guerre en dernier recours (14/11)
- Une seule jauge par nation (la relation, −100 à +100). Paliers : +50 alliance et défense mutuelle ; +30 Entente et filature ; de −49 à +29 commerce et ultimatums ; **−50 et moins : hostile, la guerre devient possible** (pour le joueur comme pour les nations).
- Le commerce rapproche : +1 par tour avec une nation tant qu'un contrat ou un traité est en cours.
- Les dirigeants belliqueux (et revanchards après une défaite) provoquent des incidents (−20) avant de pouvoir déclarer.
- À venir : envoyer un diplomate ; ultimatum ; embargo qui fait céder ; pays minier et ambition Influence.

## Ordre de mise en œuvre proposé (chaque étape : code, tests, simulation avant/après)
1. ✅ (13/11) 40 tours, régions, un chantier par région, emplacements et bonus de terrain.
2. 🟡 (13/11) Armée en régiments, forts, casernes, occupation, cession ; force sans le trésor ; nations qui recrutent. **Mécanique faite et testée ; équilibre à décider** (`specs/politique.md` § 9).
3. ✅ (13/11) Marché qui bouge et niveau de vie des factions.
4. ✅ (13/11) Une loi à la fois, sans capital politique.
5. ✅ (13/11, avancée avant d'équilibrer la guerre) Personas cachés.
6. ✅ (13/11) Réputation fusionnée dans les relations.

## Propositions du 13/11 (à valider) : personas avancés avant d'équilibrer la guerre
Remarque de l'utilisateur : Val-Roc ne doit pas être l'ennemi désigné à chaque partie. Le caractère passe donc de la nation au **dirigeant**, tiré au hasard (3 personas différents parmi 7, cachés au joueur). La nation garde ses régions, son économie et ses échanges ; le persona décide de l'armée, de la guerre et de la diplomatie, et de la relation de départ.

| Persona | Déclare la guerre | Rejoint une guerre | Armée (loi, régiments au départ, armée visée) | Traités / contrats (relation min.) | Relation de départ |
|---|---|---|---|---|---|
| Belliqueux | force > 1,2 × la nôtre, relation < 0, 30 %/tour, pas avant le tour 6 | non | ×1,6 ; 5 ; plafond | 60 / 0 | −20 |
| Marchand | jamais | non | ×1 ; 3 ; moitié | 30 / −10 | +20 |
| Opportuniste | jamais | le plus fort, 1 fois sur 2 | ×1,3 ; 3 ; 70 % | 30 / 0 | 0 |
| Isolationniste | jamais | jamais ; refuse la défense mutuelle | ×1,3 ; 4 ; 70 % | 50 / 0 | 0 |
| Revanchard | comme prudent ; belliqueux contre qui l'a battu, après la trêve | non | ×1,3 ; 3 ; 70 % | 40 / 0 | −10 |
| Idéaliste | si le joueur est paria (réputation < −50) | contre un agresseur | ×1 ; 3 ; moitié | 30 / 0 et plus réputation ≥ 0 | réputation ÷ 2 |
| Prudent | force > 2 × la nôtre, relation < −30, 20 %/tour | non | ×1,3 ; 3 ; 70 % | 40 / 0 | 0 |

Avec l'équilibre de la guerre (étape 2) : capitulation quand la moitié de ses régions est occupée (à la place de « sans régiment ») ; fort ×2 ; une caserne au Bourg au départ ; l'ordinateur vainqueur n'impose que réparations et cession au joueur.

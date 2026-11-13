# Règles V2 — premier jet (13/11, à valider)

Issu du brainstorming M6 (`backlog-v2.md` F et G, `specs/politique.md` § 7).
Tous les nombres sont des propositions de Claude, à valider ; ils iront dans `politique/donnees/` marqués `ASSUMPTION`.

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
- **Paix** : les régions occupées sont rendues (pas d'annexion pour l'instant) ; clauses de la V1 (réparations, levée d'embargo, non-réarmement = pas de recrutement). Trêve de 10 tours.
- **Nations** : régiments et recrutement selon leur persona, avec leur or (elles dépensent enfin). Val-Roc commence avec 5 régiments, Brume 3, Contreforts 2.
- **Personas cachés**, tirés au hasard pour chaque dirigeant : belliqueux, marchand, opportuniste, isolationniste, revanchard, idéaliste, prudent. Chacun règle : seuil de déclaration de guerre, relation minimale pour un traité ou un contrat, ralliement à une guerre, recrutement, réaction à un embargo.
- **Relations** (réputation fusionnée) : une seule jauge par nation. Les actions qui touchaient la réputation touchent toutes les relations à la moitié de leur effet (ex. agression : −100 avec la cible, −10 avec les autres).

## Ordre de mise en œuvre proposé (chaque étape : code, tests, simulation avant/après)
1. 40 tours, régions, un chantier par région, emplacements et bonus de terrain.
2. Armée en régiments, forts, casernes, occupation ; force sans le trésor ; nations qui recrutent.
3. Marché qui bouge et niveau de vie des factions.
4. Une loi à la fois, sans capital politique.
5. Personas cachés.
6. Réputation fusionnée dans les relations.

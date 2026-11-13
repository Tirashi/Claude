# Règles du moteur (état au 13/11, après M5, colère de défaite à 5 et trêve)

Toutes les règles que le moteur applique aujourd'hui, avec leurs chiffres (RULES_V1 + valeurs validées).
Base du brainstorming de M6. Les nombres vivent dans `politique/donnees/`.

## 1. Cadre et tour
- 60 tours. Le joueur : la République des Champs. Trois nations de l'ordinateur : Val-Roc (militariste), Brume (commerçante), Contreforts (opportuniste).
- **Ordre d'un tour** : événements → actions du joueur (vérifiées une à une) → adoption des lois → économie → démographie → nations (revenus, embargos) → guerre (usure, bataille ennemie, déclarations) → factions (effets par tour, dissipation, statuts, moral) → chantiers → +15 capital politique.
- **Actions** : lancer une loi, construire, apaiser, don, contrat, traité, rompre, embargo, lever l'embargo, déclarer la guerre, livrer bataille, imposer la paix, paix blanche.
- Fin : tour 60, ou **révolution** (une faction touche 100 de colère) = partie perdue. Pas de condition de victoire.

## 2. Économie
- Départ : 200 or, 80 familles, 4 fermes, 1 mine, 0 capital politique.
- 4 biens, prix de base : grain 1, fer 1,5, tissu 2, outils 2. **Pas de stock** : le surplus est vendu, le déficit acheté au même prix, chaque tour.
- Production = bâtiments × rendement (× lois × grèves). Consommation par famille : grain 1, tissu 0,2, outils 0,1 ; armée : 4 fer + 2 tissu ; atelier : 5 fer ; forge : 10 fer.
- Trésor += ventes − achats + contrats + impôts − entretiens. **Impôts** = familles × 1 or × loi (×1,35 progressif, ×1,55 capital). Le trésor peut être négatif sans conséquence.
- **Démographie** : +1 %/tour (+0,5 % école publique, +1 % école gratuite, montée sur 10 tours), plafond 200 familles.
- **Événement** : crise du tissu au tour 1 (tissu ×1,5 pendant 6 tours). Aucun autre hasard économique.

## 3. Bâtiments
2 chantiers à la fois, file d'attente, payés à la commande, productifs le tour qui suit.

| Bâtiment | Coût | Délai | Effet |
|---|---|---|---|
| Ferme | 60 | 3 | +20 grain |
| Mine | 80 | 4 | +15 fer |
| Atelier d'outils | 90 | 5 | +10 outils, −5 fer (bonus des artisans) |
| Tissage national | 110 | 5 | +10 tissu (bonus des artisans) |
| Filature de l'Entente | 50 (sur 100) | 6 | +18 tissu dont 6 livrés à Brume à 1 or ; traité de filature requis |
| Forge | 120 | 5 | force ×1,15 ; −10 fer et −8 or par tour |
| Fortifications | 150 | 6 | force ×1,2 en défense |

## 4. Capital politique et lois
- +15 par tour, sans plafond. Une loi lancée au tour T entre en vigueur au tour T+2. Une loi en vigueur et une en cours au plus par catégorie ; adopter remplace la loi de la catégorie. Pas d'abrogation.
- 7 catégories, 11 lois :

| Loi | Catégorie | CP | Effets |
|---|---|---|---|
| Impôt progressif | Impôt | 30 | impôts ×1,35 ; patrons +5 colère |
| Impôt sur le capital | Impôt | 50 | impôts ×1,55 ; patrons +20, artisans +10 |
| École publique | Éducation | 40 | 14 or/tour ; croissance +0,5 % ; artisans +35 % (sur 10 tours) |
| École gratuite | Éducation | 50 | 20 or/tour ; croissance +1 % ; artisans +50 % ; paysans +8 |
| Code du travail | Réglementation | 30 | production −6 % ; dissipation ouvrière ×2 ; patrons +10 |
| Médecine du travail | Santé | 40 | 10 or/tour ; toutes factions −2/tour |
| Syndicats | Relations sociales | 20 | ouvriers −4 colère/tour, +3 puissance/tour pendant 10 tours ; patrons +15 |
| Suffrage universel | Libertés publiques | 50 | paysans et ouvriers : apaisement à moitié prix, hausses de colère ÷2 ; réputation +5 ; patrons +15 |
| Suffrage censitaire | Libertés publiques | 50 | patrons et artisans : mêmes effets ; réputation −5 ; ouvriers +10, paysans +10 |
| Armée de métier | Armée | 30 | force ×1,3 ; 12 or/tour ; ouvriers −5 |
| Conscription | Armée | 45 | force ×1,6 ; 12 or/tour ; ouvriers +5 colère, +10 puissance |

## 5. Factions
- Paysans 30/40, ouvriers 35/25, artisans 25/30, patrons 20/45 (colère / puissance de départ), bornes 0-100.
- Colère : −1/tour (dissipation) ; monte seulement par les chocs de lois et les défaites (+5 à toutes).
- **Apaisement** : −18 colère pour 12 or (6 si favorisée par le suffrage), une fois par faction et par tour.
- Statuts : grondement ≥ 55 (sans effet), **grève** ≥ 75 (bâtiments de la faction à 50 % : paysans fermes, ouvriers mines, artisans ateliers et tissages ; patrons : impôts ×0,8), **révolte** puissance ≥ 85 et colère ≥ 70 (bâtiments arrêtés, impôts ×0,5), **révolution** à 100 (partie perdue). Une grève pèse sur le tour suivant.
- **Moral** : par faction 1 jusqu'à 40 de colère, puis linéaire jusqu'à 0 à 100 (grève plafonnée à 0,5, révolte 0) ; moyenne pondérée par la puissance.

## 6. Diplomatie et commerce
- Nations simplifiées : trésor, familles (+0,5 %/tour), revenu = familles × taux (1,0 / 1,3 / 1,0) − 12, une jauge de colère (−1/tour), moral, profil d'import-export fixe. Elles ne dépensent rien.
- Relations −100 à +100 : traité +10, contrat +5, don +1 par 5 or, embargo −30, guerre → −100. Aucune dérive.
- **Réputation** : don +1 par 20 or (max +5), traité +3, traité respecté +2 tous les 10 tours, rompu −15, sanction légitime +3 (contre un ennemi en guerre) ou −5, agression −20, attaque d'un membre de l'Entente −30, suffrages ±5 ; **paria** sous −50 (plus aucun traité ni contrat).
- **Dons** : 20, 50 ou 100 or, un par nation et par tour.
- **Contrats** (10 tours, relation ≥ 0) : Brume vend 10 tissu à 1,6 ; Contreforts vend 5 outils à 1,6 ; Val-Roc achète 10 grain à 1,3.
- **Embargo** : la cible manque de ce qu'elle importe et dont le joueur a un surplus : +1 colère par 3 unités et par tour, et elle paie ce manque. Il ne coûte rien au joueur (marché anonyme). Il annule les contrats avec la cible.
- **Traités** : Entente des Ports (relation ≥ 30 ; achats −10 %, ventes +10 %), défense mutuelle (≥ 50 ; l'allié entre en guerre si on est attaqué), filature conjointe (Brume, Entente requise). Rompre un traité rompt ceux qui en dépendent.

## 7. Guerre et paix
- **Force** = trésor (≥ 0) × loi militaire (1 / 1,3 / 1,6) × moral × forge × fortifications ; une nation : trésor × force fixe (Val-Roc 1,6, Brume 1, Contreforts 1,3) × moral ; forces d'un camp additionnées.
- Une guerre à la fois. Déclarer coûte −20 de réputation (−30 contre un membre de l'Entente, plus ses traités rompus et l'embargo des autres membres).
- **Val-Roc** déclare la guerre s'il est plus de 1,2 fois plus fort que le joueur et ses alliés de défense mutuelle, relation < 0, 30 % par tour. **Brume** ne déclare jamais. **Contreforts** rejoint le camp le plus fort une fois sur deux. Attaquer le joueur membre de l'Entente : ses partenaires mettent l'agresseur sous embargo.
- **Bataille** (une par tour) : l'attaquant gagne avec la probabilité Fa / (Fa + Fd). Perdant : −25 % de trésor, +5 de colère. L'ennemi attaque chaque tour où il est le plus fort.
- **Paix** : capitulation sous 0,3 de moral (le vainqueur choisit : réparations 25 % du trésor plafonnées à 300, levée d'embargo, non-réarmement 15 tours), ou paix blanche après 5 tours sans bataille si l'ennemi n'est pas plus fort. Sanctions levées.
- **Trêve** : 10 tours sans déclaration de guerre entre anciens ennemis après une paix.
- Pas de territoires, pas de relations ni de guerres entre nations.

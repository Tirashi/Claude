# Backlog V2 — HORS PÉRIMÈTRE tant que non validé par l'utilisateur

Rien ici n'entre dans `engine/` sans accord explicite. Ce fichier sert à garder les idées sans improviser.

## A. Problèmes identifiés sur V1 (à mesurer par simulation d'abord)
1. **Épuisement du contenu** : lois adoptées = 250 CP, catalogue complet = 395 CP ; à +15/tour tout est acheté en 17 à 26 tours. Le trésor (3214 or en fin de partie) n'a pas de débouché.
   → Il faut des puits de ressources : coûts croissants, entretien qui grimpe, lois rapportables, exclusivités.
2. **Apaisement quasi gratuit** (−18 colère pour 12 or) : les seuils de grève/révolution sont inatteignables.
3. **Options dominantes** : Médecine du travail (−2 colère toutes factions, 10 or, sans opposition) ; embargo + usure qui gagne toujours.
4. **Pas de hasard extérieur**, IA qui ne contre-jouent pas : tout est planifiable.
5. **Force militaire dérivée du trésor sans le consommer** : être riche suffit à être fort.
6. **Incohérences V2 chiffrées** : privé +20 % de production vs public −20 %, mais communiste +20 % ; le capitaliste cumule +30 % revenus, +20 % production privée et Patrons alliés avec peu de malus.
7. **Industries privées non modélisables** tant que l'assiette des impôts n'est pas liée à la production.

## B. Pistes, par ordre de priorité suggéré
1. **Prix dynamiques** : prix = base × f(offre/demande du marché continental). Rend bâtiments, embargos et traités systémiques.
2. **Deck d'événements de crise** (10-15 cartes) tirés au RNG : saturation de marché, épidémie, sécheresse, scandale.
3. **IA à règles écrites** : une priorité, un seuil, un tirage (ex. Val-Roc attaque si sa force > 1.2× la tienne et sa colère < 50). « Rivaux apprenants » : elles adoptent les lois qui les ont fait perdre.
4. **Stock de puissance militaire distinct du trésor** (construit, entretenu, perdu).
5. **Capital politique dégressif** (+15 puis +10 puis +5) et **lois rapportables** (abrogation coûteuse).
6. **Guerre en phases** : crise prégueurre (1-2 tours) → campagne (2-4 tours, doctrine par tour : assaut / défense / usure) → règlement clause par clause. Options : fronts multiples, événements de guerre, occupation.
7. **Seuils de puissance de faction** : à 85+ la faction devient politiquement active.
8. **Objectifs de victoire multiples** : hégémonie économique, société idéale, alliance continentale, survie dynastique.
9. **Réserves et dons de stocks** (coût de stockage, plafond, pillage), **Forge**, **Fortifications**, **Exercices conjoints** (+10 % force alliée).

## C. Idéologies et formes de gouvernement (le plus lourd, en dernier)
Idéologies envisagées : socialiste, communiste, capitaliste/libéral, totalitaire, démocrate libéral (bonus, malus et lois signature : voir le doc de brainstorming d'origine).
Formes : république (CP par consensus), monarchie (CP par trésor/prestige), oligarchie (Patrons gagnent de la puissance, lois anti-riches ×2), théocratie à définir.

**Alternative à étudier avant d'implémenter le produit idéologie × forme × affinités** : faire émerger le régime de la **faction au pouvoir**
(Patrons = oligarchie capitaliste, Ouvriers = socialisme…), ce qui réutilise les factions existantes sans nouvelle couche de tables.

Pour les industries privées : modèle simple proposé — chaque bâtiment est public ou privé. Public : coût et revenu au trésor. Privé : coût nul pour l'État, taux fixe (ex. 30 %) prélevé sur la valeur produite, puissance des Patrons en hausse. À valider.

## D. Notées pendant M0 (13/11, propositions de Claude, non validées)
1. **Écart entre prix d'achat et de vente** (ex. vente ×0,8, achat ×1,2) : en V1 surplus et déficit se font au même prix, le commerce ne coûte rien.
2. **Conséquence d'un trésor négatif** (dette, intérêts, colère) : en V1 rien n'est prévu.
3. **Stocks de biens** : en V1 la balance est vendue ou achetée chaque tour, rien n'est gardé (voir aussi B9, réserves).

## E. Notées pendant M3 (13/11, propositions de Claude, non validées)
1. ✅ **Trêve après la paix** : 10 tours sans déclaration possible entre anciens ennemis (acceptée et faite le 13/11).
2. **Territoires** : pertes de territoire et clause de restitution (RULES_V1 « éventuelles »), impossibles sans carte.
3. **Relations entre nations** et guerres entre nations de l'ordinateur.
4. **Effet d'un embargo contre le joueur** sur son marché (aujourd'hui seulement la fin des contrats et traités).

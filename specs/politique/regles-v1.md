# Règles V1 (extraites de la partie 1, 30 tours jouées sur 60)

Source de vérité du moteur. Les éléments marqués **À TRANCHER** n'ont jamais été chiffrés dans la partie
(le maître du jeu LLM les gérait à l'intuition) : proposer une valeur, la marquer `ASSUMPTION`, faire valider.

## Cadre
- 60 tours. Le joueur dirige la République des Champs (dirigeante Tessia la Rouge, socialiste).
- 3 nations IA : **Val-Roc** (Vermeil, militariste), **Brume-la-Brume** (Ferreol, commerçante), **Contreforts** (Harl, opportuniste).

## Ressources et économie
- 4 biens : grain, fer, tissu, outils. Prix de base : grain 1.0, fer 1.5, tissu 2.0, outils 2.0
  (modulés par traités : contrats à prix fixe, tarifs préférentiels de l'Entente).
- Production = nb bâtiments × rendement (voir Bâtiments).
- Consommation = familles × besoin unitaire (grain ≈ 1/famille) + besoins des ateliers et de l'armée en tissu/outils/fer.
- Balance/tour = production − consommation. Surplus vendu au prix du marché, déficit acheté.
- Trésorerie += balance (valorisée) + impôts − entretiens.
- Entretiens : armée 12 or/tour, école 14 puis ~20, médecine du travail 10.
- Impôts = revenu de base × multiplicateur de loi (progressif ×1.35, capital ×1.55).

## Factions : Paysans, Ouvriers, Artisans, Patrons
Chaque faction a deux jauges :
- **Colère** 0-100. Seuils : 55 grondement, 75 grève, 100 révolution.
- **Puissance** : capacité de trouble à long terme (évolue par lois et événements).
- Colère varie par : apaisement (−18 pour 12 or), effets de lois par tour, chocs de lois ponctuels.
- Risque de révolte si puissance ≥ 85 **et** colère ≥ 70.
- Valeurs de fin de partie connues : Patrons puissance 45, Ouvriers puissance 55.

## Capital politique (CP)
- +15 par tour. Dépensé pour lancer une loi. Délai de 2 tours entre lancement et adoption.
- **Une seule loi active par catégorie** : adopter une loi remplace la précédente de la même catégorie.

## Lois
Catégories de la partie : Impôt, Éducation, Réglementation, Libertés publiques, Armée.

| id | Loi | Catégorie | CP | Effets |
|---|---|---|---|---|
| income_progressive | Impôt progressif | Impôt | 30 | Impôts ×1.35 ; Patrons légèrement mécontents |
| income_capital | Impôt sur le capital | Impôt | 50 | Impôts ×1.55 ; Patrons +20 colère, Artisans +10 |
| school_public | École publique | Éducation | 40 | Entretien 14 or/tour ; croissance démographique accélérée ; Artisans +35 % productifs à terme |
| school_free | École gratuite et obligatoire | Éducation | 50 | Entretien ~20 or/tour ; croissance plus forte ; Artisans +50 % à terme ; Paysans +8 colère |
| labor_code | Code du travail | Réglementation | 30 | Production −6 % ; colère ouvrière dissipée 2× plus vite ; Patrons +10 |
| unions | Syndicats autorisés | Libertés publiques* | 20 | Ouvriers −4 colère/tour, +3 puissance/tour ; Patrons +15 |
| labor_medicine | Médecine du travail | Réglementation* | 40 | Toutes factions −2 colère/tour ; 10 or/tour |
| army_professional | Armée de métier | Armée | 30 | Force militaire ×1.3 ; 12 or/tour |
| army_conscription | Conscription | Armée | 45 | Force ×1.6 ; Ouvriers +5 colère et + puissance |
| suffrage_universal | Suffrage universel | Libertés publiques* | 50 | Factions populaires : apaisement à moitié prix, colère montante 2× plus lente ; réputation +5 ; Patrons −15 |
| suffrage_census | Suffrage censitaire | Libertés publiques* | 50 | Factions d'élite : mêmes effets ; réputation −5 ; Ouvriers +10, Paysans +10 |

\* **À TRANCHER (incohérence de la partie 1)** : Syndicats et Suffrage universel sont tous deux en « Libertés publiques »,
Code du travail et Médecine du travail tous deux en « Réglementation », et pourtant les quatre ont été adoptées.
Option par défaut proposée pour reproduire la partie 1 comme baseline : 7 catégories
(Impôt, Éducation, Réglementation = code du travail, Santé = médecine du travail, Relations sociales = syndicats,
Libertés publiques = suffrages, Armée). À valider : le but d'équilibrage est de **réduire** le nombre de slots plus tard, pas de l'augmenter.

## Bâtiments
2 slots de construction simultanés, file d'attente. Rendements fixes.

| id | Bâtiment | Coût | Délai | Effet |
|---|---|---|---|---|
| farm | Ferme | 60 | 3 | +20 grain/tour |
| mine | Mine | 80 | 4 | +15 fer/tour |
| workshop | Atelier d'outils | 90 | 5 | +10 outils/tour |
| weaving | Tissage national | 110 | 5 | +10 tissu/tour |
| entente_mill | Filature de l'Entente (spéciale) | 100 (cofinancée 50/50 avec Brume) | 6 | +18 tissu/tour ; livraison prioritaire à l'Entente en échange d'un prix réduit |
| forge | Forge d'armes *(non jouée)* | 120 | 5 | Convertit 10 fer + 8 or/tour en +15 % de force |
| fortifications | Fortifications *(non jouée)* | 150 | 6 | +20 % de force, en défense uniquement |

Les bâtiments ont des effets géopolitiques narratifs (un 2e atelier casserait les prix du vendeur d'outils allié) : **non modélisé en V1**, voir backlog (prix dynamiques).

## Diplomatie et commerce
- Relation −100 à +100 par nation.
- Contrats commerciaux : volumes et prix fixes.
- Réputation continentale : somme d'actions (dons, traités respectés, sanctions légitimes). Une nation sous −50 est paria ; attaquer l'Entente déclenche des sanctions de bloc. **À TRANCHER** : barème de points par action.
- Traités (engagement précis + bénéfice chiffré) : Entente des Ports (tarifs réduits, consultation), défense mutuelle (attaque sur l'un = guerre de tous),
  filature conjointe (cofinancement 50/50), clause de non-réarmement (15 tours, sinon ré-embargo).

## Guerre (résolution en un tour par bataille)
- Force effective = base (trésor) × multiplicateur de loi militaire (milice ×1, armée de métier ×1.3, conscription ×1.6) × moral des pops (0 à 1 selon la colère des factions).
- Population en rébellion : ne se bat pas, force effondrée.
- Défaite : −25 % du trésor, pertes de territoire éventuelles, chute de moral.
- Victoire par usure : embargo + effondrement du moral ennemi, sans bataille décisive.
- Paix négociée clause par clause (restitution, réparations, levée d'embargo, non-réarmement ; la Paix de Brume : réparations 300 or).
- **À TRANCHER** : fonction colère → moral ; règle de cumul des bonus (forge, fortifications, exercices : additif ou multiplicatif) ; comment l'embargo affecte l'économie ennemie.

## État initial et valeurs manquantes — À FOURNIR / ASSUMER
Jamais chiffrés dans la partie, à proposer en `data/scenarios/` avec `ASSUMPTION` :
- trésor initial, nombre de familles, formule de croissance démographique et plafond ;
- revenu de base des impôts ;
- besoins unitaires hors grain ;
- colère et puissance initiales de chaque faction ; effets exacts de l'apaisement par faction ;
- bâtiments initiaux ; relations initiales ;
- statistiques et comportement des 3 IA (en V1 : politiques simples écrites, voir SIMULATOR_PLAN) ;
- événement du tour 1 (« crise du tissu »).

## Trajectoire de la partie 1 (pour calibrer le bot « réplique »)
Crise du tissu (t1) → école, code du travail (t5-9) → Entente des Ports (t10) → syndicats, accueil de Contreforts (t11-13) →
filature conjointe, dons (t12-14) → médecine du travail, embargo de grain contre Val-Roc (t15-17) → défense mutuelle, tissage national (t18-22) →
guerre par usure (t23-25) → paix de Brume, suffrage universel (t25-26) → prospérité, école gratuite (t27-30).
Fin au tour 30 : 3214 or, réputation +42, toutes factions calmes.

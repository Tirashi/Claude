# Jeu de simulation politique — Bilan & Design V2

## 1. Bilan de la partie 1 (Tessia la Rouge, 30 tours joués sur 60)

### ✅ Ce qui a marché

| Élément | Pourquoi ça a marché |
|---|---|
| **La boucle économique** | Ressources → commerce → trésor → lois/bâtiments → factions. Lisible, chiffré, chaque décision avait un coût et un rendement clairs. |
| **Les factions comme cœur du jeu** | Colère (court terme) et puissance (long terme) sont deux jauges distinctes : on peut avoir une faction calme mais dangereuse (Patrons). C'est ce qui a rendu chaque loi intéressante. |
| **La fin de partie de Val-Roc** | Une guerre gagnée sans bataille (embargo + grèves + usure) a validé la thèse du jeu : le moral des pops et l'économie décident des conflits. |
| **Les traités à effets chiffrés** | Chaque traité (Entente, défense mutuelle, filature conjointe) avait un engagement clair + un bénéfice clair. Le joueur pouvait évaluer avant de signer. |
| **La trajectoire politique** | Programme socialiste complet adopté en 30 tours avec cohérence : chaque loi préparait la suivante. |

### ❌ Ce qui n'a pas marché

| Problème | Manifestation | Cause |
|---|---|---|
| **Fin de partie "sur des rails"** | Au tour 30, plus aucune menace active, tout est débloqué, la victoire est acquise | Aucun déclencheur ne réveille les tensions latentes (Patrons 45, Ouvriers 55, Vermeil humiliée) |
| **Le jeu s'est terminé à mi-parcours** | 60 tours calibrés, le tour du jeu fait en 30 | Pas de contenu de milieu/fin de partie : pas de victoire conditionnelle, pas d'escalade |
| **Les guerres manquent de relief** | Une bataille = un événement résolu en un tour, sans étapes ni choix du joueur pendant | Pas de phases, pas de fronts, pas de décisions en cours de conflit |
| **Pas d'identité de régime** | Le "socialisme" de Tessia était un rôle de rôle, pas une mécanique : un joueur capitaliste aurait eu exactement les mêmes leviers | Les idéologies n'ont aucun effet systémique |
| **Improvisations non encadrées** | "Armée aguerrie", "volontaires +10%", "réserves stratégiques" : inventées en cours de partie puis retirées | Pas de liste fermée de mécaniques → tentation permanente d'improviser |
| **Le capital politique trop généreux en fin de course** | +15/tour sans coût a permis de tout débloquer | Pas de rareté croissante, pas de lois exclusives entre elles |

### 📝 Résumé de la partie : règles et formules utilisées

**Cadre** : 60 tours calibrés. Le joueur dirige la République des Champs (dirigeante : Tessia la Rouge, socialiste). Trois IA-nations : Val-Roc (Vermeil, militariste), Brume-la-Brume (Ferreol, commerçante), Contreforts (Harl, opportuniste).

**Ressources et production** :
- 4 biens : grain 🌾, fer ⚒️, tissu 🧵, outils 🔨. Chaque bien a un prix de base (grain 1.0, fer 1.5, tissu 2.0, outils 2.0) modulé par les traités (contrats à prix fixe, tarifs préférentiels de l'Entente).
- Production = bâtiments × rendement : ferme +20 grain, mine +15 fer, atelier +10 outils, filature +18 tissu.
- Consommation = familles × besoin unitaire (grain ≈ 1/famille, plus les besoins en tissu/outils/fer des ateliers et de l'armée).
- Balance/tour = production - consommation. Surplus vendu au prix du marché, déficit acheté. Trésorerie += balance + impôts - entretiens (armée 12 or/tour, école 14 puis ~20, médecine 10).
- Impôts = revenu de base × multiplicateur de loi (progressif +35%, capital +55%).

**Factions** (Paysans, Ouvriers, Artisans, Patrons) — deux jauges :
- **Colère** 0-100 : seuils 55 grondement · 75 grève · 100 révolution.
- **Puissance** : capacité de trouble à long terme, évolue par événements et lois.
- Colère évolue par : apaisement (-18 pour 12 or), lois (ex. syndicats -4/tour ouvriers), médecine du travail (-2/tour toutes), chocs de lois (ex. suffrage universel Patrons +15).
- Risque de révolte si puissance ≥ 85 **et** colère ≥ 70 (jamais atteint chez le joueur ; atteint chez Val-Roc en guerre).

**Capital politique (🏛️)** : +15/tour, dépensé en lois. Chaque loi a un coût (40-50), un délai (2 tours entre lancement et adoption) et des effets de faction. Une seule loi active par catégorie (Impôt, Éducation, Réglementation, Libertés publiques, Armée) — précisé en cours de partie : syndicats classés en Libertés publiques, code du travail en Réglementation.

**Bâtiments** : 2 slots de construction, file d'attente, coûts 60-120 or, délais 3-6 tours. Rendements fixes (voir production).

**Commerce et relations** : relation -100 à +100 par nation. Contrats commerciaux à volumes et prix fixes. Réputation continentale (somme des actions : dons, respect des traités, sanctions légitimes). Coalition de réputation : une nation sous -50 devient paria, attaquer l'Entente déclenche des sanctions de bloc.

**Traités** : chaque traité = engagement précis + bénéfice chiffré. Entente des Ports (tarifs réduits, consultation), défense mutuelle (attaque sur l'un = guerre de tous), filature conjointe (cofinancement 50/50, livraison prioritaire), clause de non-réarmement (15 tours, sinon re-embargo).

**Guerre** — résolution en un tour par bataille :
- Force effective = base (trésor) × multiplicateur de loi militaire (milice ×1, armée de métier ×1.3, conscription ×1.6) × moral des pops (facteur 0 à 1 selon la colère des factions).
- Une population en rébellion ne se bat pas : colère haute = force effective effondrée.
- Défaite = -25% de trésor, pertes de territoire éventuelles, chute de moral. Victoire par usure = embargo + effondrement du moral ennemi, sans bataille décisive.
- Guerre de 3 tours (t23-t26) contre Val-Roc, gagnée par l'usure : embargo de grain + grèves internes ennemies + forteresses de Contreforts.
- Paix négociée clause par clause (restitution, réparation 300 or, levée d'embargo, non-réarmement).

**Trajectoire de la partie** : crise du tissu (t1) → école, code du travail (t5-9) → Entente des Ports (t10) → syndicats, Contreforts accueilli (t11-13) → filature conjointe, dons (t12-14) → médecine du travail, embargo de grain contre Val-Roc (t15-17) → défense mutuelle, tissage national (t18-22) → guerre par usure (t23-25) → paix de Brume, suffrage universel (t25-26) → prospérité et école gratuite (t27-30). Fin : 3214 or, réputation +42, toutes factions calmes, hégémonie douce de l'Entente.

### 📝 Bâtiments constructibles (catalogue complet de la partie)

| Bâtiment | Coût | Délai | Effet | Notes de partie |
|---|---|---|---|---|
| 🌾 **Ferme** | 60 or | 3 tours | +20 grain/tour | Construite ×4 (3 en service + 1 en chantier à la fin). Le pain de la croissance démographique. |
| ⚒️ **Mine** | 80 or | 4 tours | +15 fer/tour | Construite ×2. Premier export du pays (~1.5 or/unité vendue). |
| 🔨 **Atelier d'outils** | 90 or | 5 tours | +10 outils/tour | Construit ×1. Un second aurait cassé les prix de Harl (allié vendeur d'outils) : les bâtiments ont des effets géopolitiques. |
| 🧵 **Tissage national** | 110 or | 5 tours | +10 tissu/tour | Lancé au t17, achevé t22, un tour avant la guerre. A réduit la dépendance textile de 19 à 11 unités/tour. |
| 🧵 **Filature de l'Entente** *(spéciale)* | 100 or (cofinancée 50/50 avec Brume) | 6 tours | +18 tissu/tour | Livraison prioritaire à l'Entente en contrepartie du prix réduit. Modèle de bâtiment "traité + construction". |
| ⚒️ **Forge d'armes** *(proposée, non jouée)* | 120 or | 5 tours | Convertit 10 fer + 8 or/tour en +15% de force militaire | Liste d'équilibrage V2. |
| 🏰 **Fortifications** *(proposée, non jouée)* | 150 or | 6 tours | +20% de force, uniquement en défense | Liste d'équilibrage V2. |

### 📝 Lois (catalogue complet : votées et non votées)

**Lois adoptées dans la partie :**

| Loi | Catégorie | Coût | Effets | Réactions de faction |
|---|---|---|---|---|
| **Impôt progressif** | Impôt | 30 🏛️ | Revenus fiscaux +35% | Patrons légèrement mécontents |
| **École publique** *(puis gratuite et obligatoire)* | Éducation | 40 puis 50 🏛️ | 14 puis ~20 or/tour ; croissance démographique accélérée (nettement après t30) ; Artisans +35% puis +50% productifs à terme | Paysans +8 à la version gratuite (les enfants quittent les champs) |
| **Code du travail** | Réglementation | 30 🏛️ | Production -6% ; colère ouvrière dissipée 2× plus vite | Patrons +10, Ouvriers apaisés |
| **Syndicats autorisés** | Libertés publiques | 20 🏛️ | Ouvriers : -4 colère/tour, +3 puissance/tour | Patrons +15, Vermeil : "laboratoire du désordre" |
| **Médecine du travail** | Réglementation | 40 🏛️ | Toutes factions -2 colère/tour ; 10 or/tour | Aucune opposition |
| **Armée de métier** | Armée | 30 🏛️ | +30% de force militaire ; 12 or/tour d'entretien | Ouvriers contents (emplois), Patrons neutres |
| **Suffrage universel** | Libertés publiques | 50 🏛️ | Factions populaires : apaisement à moitié prix, colère montante 2× plus lente ; réputation +5 | Patrons **-15** (perte d'influence politique) — le plus gros choc social de la partie |

**Lois disponibles mais non votées :**

| Loi | Catégorie | Coût | Effets | Pourquoi non votée |
|---|---|---|---|---|
| **Impôt sur le capital** | Impôt *(remplace le progressif)* | 50 🏛️ | Revenus +55% (~+40 or/tour de plus) | Patrons +20 ⚠️, Artisans +10 ; jugé inutile avec 3200 or en caisse, risqué avec Patrons à 45 de puissance |
| **Conscription** | Armée *(remplace l'Armée de métier)* | 45 🏛️ | +60% de force militaire | Ouvriers +5 colère et +puissance (armer le peuple) ; aurait remplacé l'Armée de métier fraîchement adoptée ; inabordable au moment voulu (45 > 15 🏛️) |
| **Suffrage censitaire** | Libertés publiques *(alternative au suffrage universel)* | 50 🏛️ | Factions d'élite : apaisement à moitié prix, colère montante 2× plus lente ; réputation -5 | Trahison du programme socialiste : Ouvriers et Paysans +10 chacun ; incohérent avec la base électorale de Tessia |

**Rappel de structure** : une seule loi active par catégorie. Catégories de la partie : Impôt · Éducation · Réglementation · Libertés publiques · Armée. Cette contrainte a créé les vrais dilemmes (Armée de métier vs Conscription ; Suffrage censitaire vs universel).

### 📝 Idées notées en cours de partie (liste d'équilibrage)

- Forge d'armes (bâtiment : convertit fer + or en force militaire)
- Fortifications frontalières (+20% défense)
- Exercices conjoints de l'Entente (+10% force alliée)
- Réserves stratégiques (stocker du grain/tissu, dons de stocks aux alliés)

---

## 2. Design V2 — les grandes pistes

### 2.1 Idéologies (choix en début de partie, avec bonus/malus)

Chaque idéologie modifie l'économie, l'adoption des lois, les relations et les événements.

| Idéologie | Bonus | Malus | Loi signature |
|---|---|---|---|
| **Socialiste** | Ouvriers -colère, lois sociales -30% coût, croissance démographique forte | Patrons +puissance et +colère, revenus fiscaux -10% | Médecine du travail, Suffrage universel |
| **Communiste** | État contrôle tout : production +20%, aucune faction ouvrière hostile | Patrons = faction *ennemie* active dès le départ, commerce extérieur -30%, réputation -10 auprès des monarchies | Collectivisation, Plan quinquennal |
| **Capitaliste / Libéral** | Revenus +30%, construction privée (voir 2.3), Patrons alliés | Ouvriers +colère de base, lois sociales +50% coût ou indisponibles, risque de crise économique périodique | Libre entreprise, Impôt minimal |
| **Totalitaire** | Capital politique +10/tour, répression possible (baisse colère par la force), mobilisation totale en guerre | Réputation -15, risque de complot d'élite, économie moins efficace (-10%) | Police secrète, Parti unique |
| **Démocrate libéral** | Réputation +15, alliances plus faciles, apaisement à moitié prix | Décisions soumises à des élections : certaines lois peuvent être rejetées ou rapportées | Constitution, Élections |

### 2.2 Formes de gouvernement (couche séparée de l'idéologie)

| Forme | Effet structurel |
|---|---|
| **République** | Capital politique gagné par le consensus des factions ; les lois coûteuses exigent un minimum de calme social |
| **Monarchie** | Capital politique gagné par le trésor et le prestige ; lois adoptées sans consensus, mais chaque loi impopulaire nourrit les factions *et* la réputation |
| **Oligarchie** *(le régime dirigé par les riches)* | Les Patrons gagnent de la puissance automatiquement ; leurs "votes" remplacent une partie du capital politique ; les lois anti-riches coûtent le double |
| **Théocratie / autres** | À définir : légitimité par un ressort spécifique (foi, armée, parti) |

**Règle clé V2** : idéologie (le programme) × forme de gouvernement (la mécanique de pouvoir) = un espace de jeu combiné. Une oligarchie capitaliste et une république socialiste ne jouent pas du tout pareil.

### 2.3 Industries privées (la piste capitaliste)

- Le privé construit **à ses frais** : le joueur ne paie pas le bâtiment.
- Les **ventes de production vont aux industriels**, pas au trésor : le joueur ne touche que **impôts et taxes** sur leur activité.
- En échange : production plus élevée (+20% vs public), mais le joueur ne contrôle ni les prix ni les destinations d'export.
- Conséquence en cascade : en guerre, le privé peut **refuser l'embargo** (perte sèche) ou vendre à l'ennemi — sauf loi de contrôle des échanges (coûteuse en colère Patronne).
- Version socialiste miroir : tout est public, contrôle total, mais tout est payé par le trésor et la production est de 20% inférieure.

### 2.4 Lois dépendantes de l'idéologie

- Chaque loi a une **affinité** : la médecine du travail s'adopte -30% chez les régimes de gauche, +50% chez les capitalistes, est indisponible en oligarchie stricte.
- Chaque idéologie a des **lois exclusives** (signature) et des lois **verrouillées**.
- Le capital politique gagné par tour pourrait dépendre du régime (voir 2.2), ce qui rend l'ordre d'adoption stratégique.

### 2.5 Guerres avec plus de relief

Proposition de structure en **phases** (toujours sans unités ni effectifs) :

1. **Crise prégueurre** (1-2 tours) : ultimatum, mobilisation, choix diplomatiques. Chaque tour de crise modifie les forces (moral, trésor).
2. **Campagne** (2-4 tours) : chaque tour, le joueur choisit une doctrine : *assaut* (force +, pertes de trésor ++), *défense* (force défensive ++, initiative -), *usure* (embargos, sabotage moral ennemi, batailles évitées).
3. **Règlement** : paix négociée clause par clause (comme la Paix de Brume, qui a bien fonctionné — c'est le modèle à généraliser).

Ajouts possibles : fronts multiples (le joueur répartit son effort), événements de guerre (hiver, mutinerie, héros), occupation (territoire perdu = production perdue).

### 2.6 Anti-"rails" : déclencheurs de milieu de partie

- **Seuils de puissance faction** : à 85+, une faction devient *politiquement active* (exige des lois, peut renverser le programme).
- **Événements de crise** périodiques : saturation de marché, épidémie, sécheresse, scandale — tirés dans un deck, pas écrits à l'avance.
- **Rivaux apprenants** : les IA-nations adoptent les lois qui les ont fait perdre (Vermeil a pris le suffrage censitaire — systématiser ça).
- **Objectifs de victoire conditionnels** : plusieurs lignes d'arrivée (hégémonie économique, société idéale, alliance continentale, survie dynastique) pour que la partie ne soit jamais acquise avant le tour 55+.

### 2.7 Autres mécaniques à tester

- **Réserves et dons de stocks** (validée en principe, à équilibrer : coût de stockage, plafond, pillage)
- **Forge d'armes / Fortifications / Exercices conjoints** (déjà listées)
- **Capital politique dégressif** : +15/tour jusqu'au tour 30, puis +10, puis +5 — la fin de partie se joue sur les choix, pas sur l'accumulation
- **Lois rapportables** : une loi peut être abrogée (coût élevé) — ouvre des stratégies de retournement

---

## 3. Prochaines étapes proposées

1. Choisir **2-3 idéologies** à implémenter en premier (socialiste, capitaliste, totalitaire ?)
2. Définir précisément **oligarchie et monarchie** (les deux formes les plus distinctes de la république jouée)
3. Prototyper la **guerre en phases** sur un scénario papier
4. Écrire le **deck d'événements de crise** (10-15 cartes)
5. Rejouer une partie test avec le nouveau cadre
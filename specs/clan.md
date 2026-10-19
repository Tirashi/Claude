# Le Clan (nom provisoire) — cahier des charges

Gestion et stratégie viking : un petit clan développe son village, produit ses ressources, arme ses drakkars, part en raid pour piller de l'or et défend son village contre les raids ennemis. Idée et première version du cahier des charges proposées par l'utilisateur le 19/10, mises en forme ici. Version 0.1, à relire (§ 16).

## 1. Décisions de l'utilisateur (19/10)
- **Genre** : gestion, économie, stratégie (raids), défense. Pas un vrai jeu incrémental : la production automatique sert la gestion, elle n'en est pas le cœur. Ni prestige, ni remise à zéro, ni clics répétés.
- **Quatre écrans** : **Village** (bâtiments, recrutement, améliorations), **Port** (flotte et raids), **Entrée** (défense), **Terres** (production).
- **Quatre ressources** : bois, pierre, nourriture (produits) et **or (seulement par le pillage)**.
- **Quatre unités** : guerrier, archer, lancier, cavalier léger. **Deux navires** : drakkar (attaque), bateau de transport (soldats et butin).
- **Arbitrage central** : plus de soldats = plus de chances de gagner, mais moins de place pour le butin.
- **DA** : pixel art 2D détaillé, palette chaude (bois, terre, végétation, mer, lumière dorée), interface en bois sombre et parchemin, d'après une **capture de référence** de l'utilisateur.
- **V1 réduite** : boucle complète et lisible avant tout ; tout le reste va en V2 (§ 15).

## 2. Principes de conception
1. Chaque écran a une fonction claire.
2. Chaque amélioration apporte un bénéfice concret, visible dans le décor quand c'est possible.
3. Les choix ont des conséquences (soldats contre butin, attaque contre défense).
4. Les pertes sont compréhensibles et proportionnées au risque ; le rapport explique toujours ce qui s'est passé.
5. Lisible sur un téléphone, en portrait, au doigt.
6. Pas de surveillance permanente : on peut fermer l'appli et revenir plus tard.

## 3. Écran et navigation (téléphone en portrait)
- **Barre du haut** : bois, pierre, nourriture, or (et soldats disponibles).
- **Zone centrale** : le décor du lieu, dessiné en pixel art sur un canvas ; on touche un bâtiment, un navire ou un groupe de soldats pour le sélectionner.
- **Volet du bas** (HTML, comme le volet de la colonie) : détails et boutons de l'élément choisi (construire, améliorer, recruter, composer…).
- **Barre de navigation** : VILLAGE · PORT · ENTREE · TERRES (une icône 16×16 et un mot ; la police Press Start 2P n'a pas de majuscules accentuées).
- Les quatre écrans sont **quatre vues du même village** (même ciel, même lumière, même heure) : on doit sentir qu'on se déplace dans un seul lieu.
- **Retour à la Ludothèque** dans le menu du jeu (règle du 17/10), pas de bouton permanent.

## 4. Les quatre écrans
### 4.1 Village — développement du clan
Construire et améliorer les bâtiments ; recruter les unités débloquées ; améliorer unités et équipement ; voir les effectifs.
Bâtiments proposés pour la V1 (à confirmer) :
- **Grande halle** (niveau du clan) : plafonne le niveau des autres bâtiments et débloque les étapes.
- **Maisons longues** : population maximale (nombre de soldats).
- **Caserne** : recrutement (débloque archer, lancier, cavalier) et niveau d'équipement.
- **Forge** : améliorations d'attaque et de défense des unités.

### 4.2 Port — flotte et raids
Navires disponibles, amélioration des quais, déblocage et amélioration des navires, choix de la cible, composition de la flotte, missions en cours, rapports et historique.
**Les quais limitent le nombre de navires par expédition** (élément central de la progression).

### 4.3 Entrée — défense
Palissade (remparts en V2), garnison (soldats affectés, capacité qui grandit), tour de guet, historique des attaques subies. Chaque amélioration se voit dans le décor : palissade renforcée, porte fortifiée, tour plus haute, garnison plus nombreuse.

### 4.4 Terres — production
Ferme (nourriture), camp de bûcherons (bois), carrière (pierre). Production automatique ; on améliore, on consulte les rendements, on **collecte** ce qui s'est accumulé (avec un plafond de stockage).

## 5. Ressources
| Ressource | Source | Sert à |
|---|---|---|
| Bois | camp de bûcherons | bâtiments, quais et navires, palissade |
| Pierre | carrière | bâtiments solides, fortifications, bâtiments avancés |
| Nourriture | ferme | entretien des soldats (proposition : chaque soldat consomme un peu ; sans nourriture, plus de recrutement) ; éventuellement le départ des expéditions (à tester) |
| Or | **pillage uniquement** | améliorations avancées, déblocages, dépenses militaires |

Pas de bonus de combat par la nourriture en V1 (rations : V2).

## 6. Armée
Effectif commun au clan ; chaque soldat est **disponible**, **en expédition** ou **en garnison**, jamais deux à la fois (le moteur tient un compte par état, pas une liste à cocher). Le clan commence avec quelques guerriers.

Proposition de rôles (à chiffrer pendant l'équilibrage), pour que chaque unité ait un vrai rôle :
| Unité | Rôle | Fort contre | Faible contre |
|---|---|---|---|
| Guerrier | polyvalent, pas cher | — | — |
| Archer | attaque à distance, fort contre les défenses (palissades, tours) | cibles fortifiées | cavaliers |
| Lancier | défense, arrête les charges | cavaliers | archers |
| Cavalier léger | rapide, pille plus (porte du butin ?) | archers | lanciers |

Chaque cible (et chaque raid ennemi) a sa propre composition : bien composer son expédition contre la cible compte autant que le nombre.
Pertes : une partie des pertes revient **blessée** (indisponible un temps) plutôt que morte ; le rapport distingue morts et blessés (proposition).

## 7. Navires
| Navire | Soldats | Cale (butin) | Effet |
|---|---|---|---|
| Drakkar | peu | petite | bonus d'attaque, plus rapide |
| Bateau de transport | beaucoup | grande | pas de bonus d'attaque, plus lent |

Navires persistants (pas de perte de navire en V1). Un navire en mer est indisponible jusqu'à son retour. Le port augmente le nombre de navires par expédition, débloque le transport et améliore les navires (capacité, cale, vitesse).

## 8. Raids (le cœur stratégique)
1. **Cible** : liste de cibles graduées (difficulté, force estimée, butin possible, durée). Une cible pillée se « reconstitue » avec le temps (pas de pillage en boucle de la même cible).
2. **Navires** : choisis parmi les disponibles, dans la limite des quais.
3. **Soldats** : répartis entre les quatre unités, dans la limite des places des navires.
4. **Récapitulatif** : navires, soldats, places utilisées et restantes, cale libre, **attaque**, **défense**, **durée aller-retour**, **chances estimées** (une jauge et un mot : FACILE, RISQUE, TRES RISQUE). On peut modifier avant de partir.
5. **Résolution** : calculée au départ par le moteur (graine tirée au départ, donc rejouable et testable) ; une animation courte (arrivée, assaut, victoire ou retraite, chargement) se **passe d'un toucher** et ne change rien au résultat.
6. **Retour et rapport** : résultat, butin, morts et blessés, soldats et navires rentrés, durée.

### 8.1 Capacité et butin
Chaque navire a des **places** (soldats) et une **cale** (butin) ; proposition simple et lisible : une place libre devient de la cale (un soldat de moins = plus de butin). Deux jauges : places et cale. Le butin rapporté = le plus petit entre ce que la cible contient, ce que la victoire permet de prendre (victoire nette / courte / retraite) et la cale.

### 8.2 Formule de combat (proposition, à régler avec le simulateur)
Attaque = somme des unités × (forge) × (bonus drakkars) × (avantages de composition contre la cible). Défense de la cible = garnison × fortifications. Le rapport Attaque / Défense donne la probabilité de victoire (courbe en S), affichée avant le départ ; un petit hasard tranche. Les pertes dépendent de l'écart : grosse victoire = peu de pertes.

## 9. Défense du village
- **Raids ennemis** : à heures tirées d'avance ; leur force suit la richesse et le niveau du clan ; **trêve** après une attaque (pas d'attaques à la suite).
- **Palissade** : réduit la force de l'attaquant ; **garnison** : se bat ; **tour de guet** : annonce le prochain raid **à l'avance** (« raid dans 2 h ») pour pouvoir rappeler des soldats en garnison ou attendre le retour d'une flotte.
- **Défaite** : une part des ressources (jamais l'or déjà dépensé, jamais tout) est volée, quelques pertes ; pas de bâtiment détruit en V1 (proposition, pour rester proportionné).
- **Historique** à l'Entrée : chaque attaque, son résultat, ses conséquences.

## 10. Temps et rythme (proposition)
- **Temps réel doux** : production, constructions, recrutements et expéditions avancent avec l'heure du téléphone, même appli fermée ; **tout est rattrapé à la réouverture** (le moteur calcule ce qui s'est passé pendant l'absence, raids ennemis compris, et un résumé « PENDANT TON ABSENCE » s'affiche).
- **Durées courtes** pour qu'une partie avance pendant une soirée : constructions et raids de 1 à 30 minutes au début, quelques heures au plus plus tard. Stockage plafonné (environ 8 h de production) pour inviter à revenir sans obliger.
- Pas de notifications en V1 (il faudrait un serveur) : V2.
- **Option à décider** : temps réel (comme ci-dessus) ou **tours** (un tour = une saison, comme la colonie). Le temps réel colle mieux à « partir en raid et attendre le retour » ; les tours sont plus simples à équilibrer et à tester.

## 11. Progression
Départ : quelques guerriers, un drakkar, peu de ressources, des bâtiments de niveau 1.
Étapes : produire et dépenser → premiers raids faciles → l'or finance la caserne et la forge → plus de navires (quais) → arbitrer attaque et défense → cibles fortes. Les déblocages suivent le niveau de la grande halle et des quais.
**Objectif de la V1** (proposition, pour donner une fin et un classement) : **la renommée** (points gagnés par les raids réussis et les défenses tenues) et un but affiché, par exemple « devenir jarl de la région » en pillant la cible la plus forte.

## 12. Technique (règles de la Ludothèque)
- Dossier `clan/` (nom à remplacer) : `index.html` + `jeu.js` + `style.css` ; **`clan/regles.js`** : tout le moteur (ressources, bâtiments, armée, raids, défense, rattrapage du temps), **sans dessin**, script classique avec export pour Node, testable comme `ile/regles.js` et `odyssee/regles.js`.
- Décor : **canvas en pixel art** (272 × 480 pixels logiques agrandis sans lissage, comme les jeux 32 bits) ; panneaux en HTML pour la lisibilité ; police Press Start 2P pour les titres et une police lisible pour les textes (comme Amiral !).
- **Tout est dessiné par le code** (pas d'images toutes faites dans le dépôt, sauf exception comme la cartouche de Nebula) : c'est le plus gros du travail de dessin (4 décors détaillés qui évoluent avec les niveaux). On peut réutiliser l'esprit du dessin en volumes des chiens d'Injagility et des décors d'Alunissage.
- Heure : `Date.now()`, avec une protection simple contre l'horloge qu'on recule (on garde la dernière heure vue).
- Sauvegarde `localStorage` préfixée `clan.` ; sons WebAudio discrets (cor, marteau, vagues) ; arrêt quand l'appli passe en arrière-plan.
- Artefact au lien à créer (demander à l'utilisateur), `sw.js` (`FILES`, `VERSION`).

## 13. Intégration à la Ludothèque
Cartouche et volet sur l'accueil (famille 32 bits, genre GESTION) ; classements `renommee` (et `or` total pillé) ; reprise des records en rejoignant (`registerExisting`) ; transfert de sauvegarde `LUDO1-` (toute la partie) ; tests : `verifications.js` (classements branchés), `logique.js` (moteur), simulateur sous Node `outils/clan.js` (un pilote automatique joue des semaines de jeu en accéléré : progression, raids gagnés, attaques subies) pour l'équilibrage.
Pas de défi du jour en V1 (une idée possible plus tard : « le raid du jour », même cible et même flotte pour toute la famille).

## 14. Périmètre de la V1
**Inclus** : 4 écrans ; bois, pierre, nourriture produits ; or par pillage ; bâtiments du § 4 ; 4 unités et leurs améliorations ; drakkar et transport ; limite des quais ; composition des expéditions ; places et cale ; attaque, défense, durée, chances ; résolution automatique ; rapports ; palissade, garnison, tour de guet ; raids ennemis et historique ; rattrapage du temps ; interface au doigt en pixel art.
**Hors V1** : vivres et engins de siège, autres navires, diplomatie, multijoueur, grand arbre technologique, prestige, ressources secondaires, combats tactiques en temps réel.

## 15. Pistes pour la V2 (conservées)
- **Expéditions** : emplacements de vivres (moins de pertes, moins de cale) et d'engins de siège (échelles, béliers contre les cibles fortifiées).
- **Navires** : nouveaux types, chacun avec un rôle (pas simplement meilleur que le précédent).
- **Défense** : remparts après la palissade, pièges, tour de guet plus utile, entrée qui change d'aspect.
- **Clan** : paliers avancés, nouveaux bâtiments, personnalité du clan.
- **Cibles** : villages fortifiés, comptoirs, sites particuliers, objectifs autres que l'or.
- **Économie** : commerce, échanges, rôle plus riche de la nourriture, production avancée.
- **Armée** : nouvelles unités à rôle distinct, rapports et animations plus riches.
- **Confort** : stockage et absence mieux réglés, notifications de retour (demande un serveur).
- **Famille** : classements déjà là en V1 ; défis entre clans de la famille, cibles qui sont les villages des autres joueurs (demanderait du SQL Supabase en plus).

## 16. Points à décider avec l'utilisateur
1. **Le nom du jeu.**
2. **Temps réel doux ou tours** (§ 10).
3. **La capture de référence** : la déposer dans `maquettes/ref/` pour la maquette (elle n'est pas dans le dépôt).
4. Bâtiments du Village (§ 4.1) et but de la V1 (renommée, « jarl de la région ») : d'accord ?
5. Rôles des unités (§ 6) : le **cavalier** sur un drakkar est peu viking ; le garder, ou le remplacer par une unité plus nordique (berserker : forte attaque, pertes élevées ; ou bouclier : défense) ?
6. Défaite en défense sans bâtiment détruit (§ 9) : d'accord ?
7. Lien avec **Le Thé des Jarls** (même univers viking) : même région, mêmes jarls comme cibles ? Simple clin d'œil ou rien du tout.
Le reste (coûts, statistiques, durées, formule) se règle avec le simulateur, en testant la boucle plutôt qu'en équilibrant tout d'avance.

## 17. Plan de travail proposé (Opus, une conversation par étape)
0. **Maquette** (règle du 16/10) : 2 ou 3 directions pixel art sur un écran de téléphone d'après la capture de référence (le Port avec la préparation d'un raid, et le Village), puis validation par l'utilisateur. ~1 à 2 % de la semaine.
1. **Le moteur** (`regles.js`) et le simulateur sous Node : ressources, bâtiments, armée, raids, défense, rattrapage du temps ; premier équilibrage. Écran minimal pour jouer.
2. **Les quatre décors** en pixel art (qui évoluent avec les niveaux), le volet, la navigation, les animations (fumées, drapeaux, départ et retour des navires).
3. **Raids et défense complets** : préparation avec jauges, animation passable, rapports, historique, tour de guet, résumé d'absence ; sons.
4. **Intégration et équilibrage** : accueil, classements, transfert, tests, artefact, réglages après les premières parties de l'utilisateur.

## 18. Critères de réussite de la V1
Commencer avec son petit village, ses soldats et son drakkar ; produire et construire ; recruter et améliorer ; développer le port ; choisir une cible et composer une expédition cohérente ; comprendre le compromis soldats contre butin ; lancer un raid, revenir plus tard et lire le rapport ; utiliser l'or pour progresser ; tenir une garnison et améliorer les défenses ; subir des attaques et en comprendre les conséquences ; passer facilement d'un écran à l'autre sur le téléphone.

# Le Clan du fjord — cahier des charges

Gestion et stratégie viking : un petit clan développe son village, produit ses ressources, arme ses drakkars, part en raid pour piller de l'or et défend son village contre les raids ennemis. Idée et première version du cahier des charges proposées par l'utilisateur le 19/10, mises en forme ici. Version 0.2 : points du § 16 tranchés le 29/10 ; prochaine étape, la maquette (§ 17).

## 1. Décisions de l'utilisateur (19/10)
- **Genre** : gestion, économie, stratégie (raids), défense. Pas un vrai jeu incrémental : la production automatique sert la gestion, elle n'en est pas le cœur. Ni prestige, ni remise à zéro, ni clics répétés.
- **Quatre écrans** : **Village** (bâtiments, recrutement, améliorations), **Port** (flotte et raids), **Entrée** (défense), **Terres** (production).
- **Quatre ressources** : bois, pierre, nourriture (produits) et **or (seulement par le pillage)**.
- **Quatre unités** : guerrier, archer, lancier, cavalier léger. **Deux navires** : drakkar (attaque), bateau de transport (soldats et butin).
- **Arbitrage central** : plus de soldats = plus de chances de gagner, mais moins de place pour le butin.
- **DA** : pixel art 2D détaillé, palette chaude (bois, terre, végétation, mer, lumière dorée), interface en bois sombre et parchemin, d'après une **capture de référence** de l'utilisateur.
- **V1 réduite** : boucle complète et lisible avant tout ; tout le reste va en V2 (§ 15).

### 1.1 Décisions du 29/10
- **Nom : Le Clan du fjord** (dossier `clan-du-fjord/`).
- **Temps réel doux** (§ 10) : tout avance avec l'heure du téléphone, même appli fermée, résumé « PENDANT TON ABSENCE » au retour.
- Capture de référence : finalement **aucune** (29/10, « partons d'une page blanche ») ; chercher des graphismes sur les sites autorisés.
- Bâtiments du Village et but de la V1 (renommée, « jarl de la région ») : **d'accord**.
- **Pas de cavalier** : remplacé par le **berserker**.
- Défense perdue sans bâtiment détruit : **d'accord**.
- **Lien avec Le Thé des Jarls** : même région ; les jarls du Thé sont des cibles de raid (les plus fortes), avec leurs couleurs et leur portrait.
- **Plus d'unités** (archer, porte-bouclier, lanceur de haches…) **et plus de types de bateaux**, pas seulement des drakkars, « tant pis si c'est un peu anachronique » : § 6 et § 7.
- **Petites animations sur chaque écran**, qui **évoluent avec les bâtiments** (mouettes au port comme dans Capitaine du port, moulin qui tourne sur les Terres…) : § 4.5.

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

### 4.5 Animations de chaque écran (demande du 29/10)
Chaque écran vit en permanence, et **chaque amélioration ajoute ou change une animation** : on voit le village grandir. Animations en boucle, légères (quelques sprites, pas de physique), coupées quand l'appli passe en arrière-plan.
| Écran | Toujours là | Qui apparaît avec les bâtiments |
|---|---|---|
| **Village** | fumée des toits, poules, bannière du clan qui flotte sur la grande halle | une fumée de plus par maison longue ; forgeron qui frappe avec des étincelles (forge) ; soldats à l'entraînement devant la caserne, de plus en plus nombreux ; feu dans le foyer de la halle, puis torches aux niveaux suivants |
| **Port** | **mouettes** qui tournent et se posent (comme dans Capitaine du port), vagues, reflets, navires qui tanguent à quai | pêcheur et filets ; quais qui s'allongent ; grue de chargement ; navires qui **partent et rentrent** pour de vrai (un navire en mer n'est plus à quai) ; butin déchargé au retour d'un raid |
| **Entrée** | corbeaux sur la palissade, drapeau, feu du brasero | gardes qui font la ronde (un par groupe de la garnison) ; vigie qui scrute au sommet de la tour de guet, cor qui sonne quand un raid est annoncé ; porte renforcée qui s'ouvre au retour des soldats |
| **Terres** | blés qui ondulent, ruisseau, nuages | **moulin qui tourne** (ferme améliorée) ; moutons puis vaches ; bûcherons qui cognent et un arbre qui tombe de temps en temps (camp de bûcherons) ; chariot de pierres qui fait l'aller-retour (carrière) |
Commun aux quatre écrans : même ciel et même lumière ; **heure du jour** qui suit celle du téléphone (aube, jour, crépuscule, nuit avec fenêtres éclairées) et saisons (neige l'hiver), à confirmer sur la maquette.

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

Unités (demande du 29/10 : plusieurs unités différentes, pas de cavalier), débloquées peu à peu par la caserne ; chacune a un vrai rôle, les chiffres se règlent au simulateur :
| Unité | Arme | Rôle | Fort contre | Faible contre | Déblocage |
|---|---|---|---|---|---|
| Guerrier | hache et bouclier rond | polyvalent, pas cher | — | — | départ |
| Archer | arc | tire avant le corps-à-corps, fort contre les défenses (palissades, tours) | cibles fortifiées, berserkers | lanceurs de haches | caserne 1 |
| Porte-bouclier | grand bouclier et épée | mur de boucliers : encaisse, réduit les pertes de tout le groupe | archers | lanceurs de haches | caserne 2 |
| Lanceur de haches | haches de jet | volée de haches qui brise les boucliers | porte-boucliers, archers | lanciers | caserne 2 |
| Lancier | lance longue | défense, tient la ligne, excellent en garnison | berserkers, lanceurs de haches | archers | caserne 3 |
| Berserker | deux haches, peau d'ours | très forte attaque, mais pertes élevées | lanciers, garnisons faibles | archers, porte-boucliers | caserne 4 + or |
| Pilleur | sac et gourdin | se bat mal, mais **porte du butin en plus** (prend une place, ajoute de la cale) | — | tous | port 2 |
Le pilleur rend l'arbitrage soldats contre butin plus fin : on peut emmener moins de combattants mais mieux chargés.
Les défenseurs des cibles et les raids ennemis utilisent les mêmes unités (sans pilleur).

Chaque cible (et chaque raid ennemi) a sa propre composition : bien composer son expédition contre la cible compte autant que le nombre.
Pertes : une partie des pertes revient **blessée** (indisponible un temps) plutôt que morte ; le rapport distingue morts et blessés (proposition).

## 7. Navires
Plusieurs types de navires (demande du 29/10 : pas seulement des drakkars ; un peu d'anachronisme accepté). Aucun n'est simplement meilleur qu'un autre : chacun a un rôle.
| Navire | Places | Cale | Vitesse | Effet | Déblocage |
|---|---|---|---|---|---|
| Drakkar | moyen | petite | rapide | bonus d'attaque (débarquement en force) | départ |
| Snekkja | peu | très petite | très rapide | raids éclair : durée divisée, idéal pour les petites cibles proches | port 1 |
| Knarr (transport) | beaucoup | grande | lent | pas de bonus d'attaque ; le navire du butin | port 2 |
| Barque à fond plat | moyen | moyenne | moyen | **remonte les rivières** : seule à atteindre les cibles de l'intérieur des terres | port 3 |
| Cogue (anachronique) | moyen | grande | lent | château à l'avant : **bonus aux archers**, robuste | port 4 + or |
| Nef de siège (anachronique) | peu | petite | lent | **baliste** : réduit la palissade et les tours de la cible | port 4 + or |
| Grand dragon du jarl | beaucoup | moyenne | rapide | unique, fin de partie : bonus d'attaque et de renommée ; nécessaire contre les jarls les plus forts | grande halle max |
Une flotte mélange les types : par exemple un drakkar pour frapper, un knarr pour rapporter, une nef de siège contre un village fortifié.

Navires persistants (pas de perte de navire en V1). Un navire en mer est indisponible jusqu'à son retour. Le port augmente le nombre de navires par expédition, débloque les types de navires et les améliore (capacité, cale, vitesse).

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
- Dossier `clan-du-fjord/` : `index.html` + `jeu.js` + `style.css` ; **`clan-du-fjord/regles.js`** : tout le moteur (ressources, bâtiments, armée, raids, défense, rattrapage du temps), **sans dessin**, script classique avec export pour Node, testable comme `ile/regles.js` et `odyssee/regles.js`.
- Décor : **canvas en pixel art** (272 × 480 pixels logiques agrandis sans lissage, comme les jeux 32 bits) ; panneaux en HTML pour la lisibilité ; police Press Start 2P pour les titres et une police lisible pour les textes (comme Amiral !).
- **Tout est dessiné par le code** (pas d'images toutes faites dans le dépôt, sauf exception comme la cartouche de Nebula) : c'est le plus gros du travail de dessin (4 décors détaillés qui évoluent avec les niveaux). On peut réutiliser l'esprit du dessin en volumes des chiens d'Injagility et des décors d'Alunissage.
- Heure : `Date.now()`, avec une protection simple contre l'horloge qu'on recule (on garde la dernière heure vue).
- Sauvegarde `localStorage` préfixée `clan.` ; sons WebAudio discrets (cor, marteau, vagues) ; arrêt quand l'appli passe en arrière-plan.
- Artefact au lien à créer (demander à l'utilisateur), `sw.js` (`FILES`, `VERSION`).

## 13. Intégration à la Ludothèque
Cartouche et volet sur l'accueil (famille 32 bits, genre GESTION) ; classements `renommee` (et `or` total pillé) ; reprise des records en rejoignant (`registerExisting`) ; transfert de sauvegarde `LUDO1-` (toute la partie) ; tests : `verifications.js` (classements branchés), `logique.js` (moteur), simulateur sous Node `outils/clan.js` (un pilote automatique joue des semaines de jeu en accéléré : progression, raids gagnés, attaques subies) pour l'équilibrage.
Pas de défi du jour en V1 (une idée possible plus tard : « le raid du jour », même cible et même flotte pour toute la famille).

## 14. Périmètre de la V1
**Inclus** : 4 écrans ; bois, pierre, nourriture produits ; or par pillage ; bâtiments du § 4 ; 7 unités et leurs améliorations ; 7 types de navires ; animations de chaque écran (§ 4.5) ; limite des quais ; composition des expéditions ; places et cale ; attaque, défense, durée, chances ; résolution automatique ; rapports ; palissade, garnison, tour de guet ; raids ennemis et historique ; rattrapage du temps ; interface au doigt en pixel art.
**Hors V1** : vivres et engins de siège à embarquer, diplomatie, multijoueur, grand arbre technologique, prestige, ressources secondaires, combats tactiques en temps réel.

## 15. Pistes pour la V2 (conservées)
- **Expéditions** : emplacements de vivres (moins de pertes, moins de cale) et d'engins de siège (échelles, béliers contre les cibles fortifiées).
- **Défense** : remparts après la palissade, pièges, tour de guet plus utile, entrée qui change d'aspect.
- **Clan** : paliers avancés, nouveaux bâtiments, personnalité du clan.
- **Cibles** : villages fortifiés, comptoirs, sites particuliers, objectifs autres que l'or.
- **Économie** : commerce, échanges, rôle plus riche de la nourriture, production avancée.
- **Armée** : rapports et animations de combat plus riches.
- **Confort** : stockage et absence mieux réglés, notifications de retour (demande un serveur).
- **Famille** : classements déjà là en V1 ; défis entre clans de la famille, cibles qui sont les villages des autres joueurs (demanderait du SQL Supabase en plus).

## 16. Points décidés (29/10)
Tous tranchés : voir § 1.1.

## 16.1 Maquette 1 (29/10)
`maquettes/clan-du-fjord.html`, https://claude.ai/artifact/SxZqj6uVzxCErka8PJJxmX. Graphismes cherchés sur OpenGameArt et itch.io (kenney.nl est bloqué par le proxy) : rien de libre ne couvre à la fois bâtiments, 7 unités et 7 navires dans un même style (drakkar CC0 isolé, tuiles de village viking en vue de dessus, environnements de plateforme) ; tout est donc **dessiné par le code**. Trois téléphones jouables, chacun avec PORT (cible, navires, 7 unités, jauges places / cale / chances, départ et retour de la flotte avec butin) et VILLAGE (AMELIORER change le décor : maison et fumée, forgeron et étincelles, torches, soldats à l'entraînement) :
- **A, de côté** : panorama du fjord au soleil couchant, montagnes, reflets ; volet en parchemin.
- **B, de dessus** : comme Capitaine du port (mouettes et leurs ombres, pontons, toits de gazon) ; volet en ardoise.
- **C, isométrique** : diorama, murs et toits en volume, navires en biais ; volet en cuir et laiton.
À choisir : point de vue, habillage du volet, lumière suivant l'heure du téléphone ou non.
**Retour (29/10)** : petits personnages appréciés, navires « presque bien », aucune vue ne convient ; l'utilisateur imagine de l'**isométrique** ; maquettes **trop peu détaillées**, bâtiments trop simples et trop lisses.

## 16.2 Maquette 2 (29/10)
`maquettes/clan-du-fjord-2.html`, https://claude.ai/artifact/KnJ1KRcdn2L6v2KDdAknaz. Tout en isométrique 2:1, **chaque face texturée pixel par pixel** (moteur `face()` : origine et deux vecteurs dans le monde, texture en coordonnées u, v, lumière par face) : planches avec joints et nœuds, fondations en pierre, clayonnage, gazon fleuri avec lattes d'écorce, chaume en couches, bardeaux ; portes ferrées, fenêtres, boucliers peints, dragons croisés au pignon de la grande halle. Accessoires : puits, pierre runique, séchoirs à poissons, tas de bois, tonneaux, caisses, foin, charrette, linge, champs, mannequins, cible, râtelier, clôtures, pins, bouleaux, rochers ; moutons, poules, villageoise. Navires redessinés (bordage à clins, équipage, voile à losanges). Positions données à l'écran (`at()`), sol calculé pour chaque pixel, quai dans une couche à part pour passer devant le drakkar. Trois rendus : A été sans contours, B contours 32 bits (contour sombre autour de chaque pan, couleurs plus vives), C soir d'hiver (neige, lumière froide, fenêtres éclairées, flocons).
**Retour (29/10)** : le B ressemble plus à ce qui est cherché, « mais c'est pas encore ça » ; référence : **Ikariam**.

## 16.3 Maquette 3 (29/10), esprit Ikariam
`maquettes/clan-du-fjord-3.html`, https://claude.ai/artifact/Tj53abvMNFpSH7Y4LEEuBn. **Un seul monde, deux caméras** (VILLAGE et PORT) : la ville sur un **plateau** (hauteur 10) qui tombe en **falaises** stratifiées sur la plage et la mer (sol calculé pour chaque pixel : dessus du plateau, sinon on descend le long de la falaise, sinon plage ou eau) ; **emplacements** bordés de pierres pour chaque bâtiment, **panneau « à bâtir »** sur les emplacements libres ; escalier taillé dans la falaise vers le port. Moteur à l'échelle K : **rendu peint** à K = 2,5 (640 × 560, bruit doux interpolé, dégradés sur les murs et les toits, arbres et rochers en boules éclairées, fumée ronde, **navires vectoriels** posés en biais : coque à clins en dégradé, boucliers bicolores, voile rayée et ombrée, dragon, rames qui battent) ; **pixel HD** à K = 1,25. Trois rendus : A peint avec contours bruns, B pixel HD avec contours, C peint sans contours en lumière de fin d'après-midi.
Le reste (coûts, statistiques, durées, formule) se règle avec le simulateur, en testant la boucle plutôt qu'en équilibrant tout d'avance.

## 17. Plan de travail proposé (Opus, une conversation par étape)
0. **Maquette** (règle du 16/10) : 2 ou 3 directions pixel art sur un écran de téléphone d'après la capture de référence (le Port avec la préparation d'un raid, et le Village), puis validation par l'utilisateur. ~1 à 2 % de la semaine.
1. **Le moteur** (`regles.js`) et le simulateur sous Node : ressources, bâtiments, armée, raids, défense, rattrapage du temps ; premier équilibrage. Écran minimal pour jouer.
2. **Les quatre décors** en pixel art (qui évoluent avec les niveaux), le volet, la navigation, les animations (fumées, drapeaux, départ et retour des navires).
3. **Raids et défense complets** : préparation avec jauges, animation passable, rapports, historique, tour de guet, résumé d'absence ; sons.
4. **Intégration et équilibrage** : accueil, classements, transfert, tests, artefact, réglages après les premières parties de l'utilisateur.

Coût revu (29/10) : 7 unités, 7 navires et les animations de chaque écran ajoutent du dessin ; compter **20 à 30 % de la semaine** au total.

## 18. Critères de réussite de la V1
Commencer avec son petit village, ses soldats et son drakkar ; produire et construire ; recruter et améliorer ; développer le port ; choisir une cible et composer une expédition cohérente ; comprendre le compromis soldats contre butin ; lancer un raid, revenir plus tard et lire le rapport ; utiliser l'or pour progresser ; tenir une garnison et améliorer les défenses ; subir des attaques et en comprendre les conséquences ; passer facilement d'un écran à l'autre sur le téléphone.

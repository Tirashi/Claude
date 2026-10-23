# Doggy Saga — cahier des charges

Un « trois en ligne » façon Candy Crush avec des **portraits de chiens**, **pour toute la famille**, dans un refuge pour chiens : on échange deux chiens voisins pour en aligner trois ou plus ; chaque chien aligné reçoit un **câlin**, et quand un chien a reçu assez de câlins, il **trouve une famille**. Des niveaux à la suite (les journées au refuge), avec des étoiles, et une grille du jour. Jeu bien dynamique : animations, effets, sons.

## 1. Décisions de l'utilisateur
- 22/10, maquette 1 (`maquettes/bonbons.html`, https://claude.ai/artifact/6VgviU7PYUgeK26wpE5cLZ : Confiserie, Pixel 32 bits, Néon) : « autre chose que des bonbons ou des trucs 32 bits ».
- 22/10, maquette 2 (`maquettes/bonbons-2.html`, https://claude.ai/artifact/NHjS2wtFiwviNf7C2HZWEF : le Refuge, le Héros, la Fresque) : **le Refuge retenu** (« vraiment cool »).
- 22/10, réponses aux questions du cahier des charges : nom **Doggy Saga** ; objectifs et chapitres (§ 3 et 5) **d'accord** ; **pas** les chiens de la famille d'Injagility ; jeu **pour toute la famille** (début doux, mots simples) ; journée du jour **d'accord** ; sons : **chercher de vrais sons** libres de droits, sinon les fabriquer.
- Ce qui est donc acquis : la DA de la maquette (portraits ronds de chiens dessinés en vectoriel sur des médaillons pastel, couverture cousue, mur aux pattes, plancher, police Baloo 2), les chiens qui clignent des yeux, penchent la tête et sourient, les cœurs qui s'envolent vers le portrait, les pièces spéciales (bandana, nœud, balle de tennis), les petits « ouaf ».

## 2. Principe et règles (comme la maquette)
- Grille de **8 × 8** (certains niveaux auront une forme découpée : cases vides qui font une silhouette).
- On **glisse** un chien vers son voisin (ou on touche l'un puis l'autre). L'échange n'est gardé que s'il fait un alignement ; sinon les chiens reviennent.
- Les chiens alignés partent (heureux) ; ceux du dessus tombent ; de nouveaux arrivent par le haut ; les **cascades** comptent double, puis triple…
- **Pièces spéciales** :
  - aligner 4 : **chien au bandana** (vide sa ligne ou sa colonne, la flèche du badge indique le sens) ;
  - aligner en L ou en T : **chien au nœud** (explose en cœurs autour de lui, 3 × 3) ;
  - aligner 5 : **balle de tennis** (échangée avec un chien, elle fait partir tous les chiens de cette race) ;
  - deux spéciaux échangés partent ensemble (balle + bandana : toute la race prend un bandana ; balle + balle : toute la grille).
- Indice après 5 s sans jouer ; mélange automatique s'il n'y a plus de coup possible.
- **Coups limités** par niveau ; quand l'objectif est rempli, les coups restants se transforment en bonus (fin façon Candy Crush : les coups restants lancent des bandanas, pour le spectacle et les points).

## 3. Les objectifs (proposition)
Chaque niveau a un ou deux objectifs, affichés en haut à la place des portraits :
- **Câlins** : faire N câlins à certains chiens (comme la maquette) ; le chien est adopté quand sa jauge est pleine.
- **Boue** : des cases sont crottées de boue ; un alignement sur la case la nettoie (la « gelée » de Candy Crush). Il faut laver tout le refuge.
- **Chiots perdus** : des chiots sont posés dans la grille et ne s'alignent pas ; il faut les faire descendre jusqu'en bas pour qu'ils rejoignent leur panier (les « ingrédients »).
- **Obstacles** (sans être des objectifs) : **niches** (cases fixes qu'un alignement voisin abîme en 1 à 3 fois), **laisses** (un chien attaché ne peut pas être déplacé, un alignement le libère), **gamelles** (bloc qui tombe comme un chien mais ne s'aligne pas).

## 4. Les chiens
- Les 6 de la maquette (Biscotte le beagle, Neige la husky, Kumo le shiba, Domino le dalmatien, Praline la caniche, Réglisse la border collie), plus d'autres qui arrivent au fil des chapitres, par exemple : golden retriever, teckel, carlin, bouvier bernois, jack russell, berger australien, berger des Shetland, bouledogue français, chihuahua, lévrier.
- Chaque niveau utilise **5 ou 6 races** (5 = plus facile, pour le début et les petits).
- **Album des familles** : chaque chien adopté une première fois rejoint un album (son portrait, son nom, sa race, un petit mot de sa nouvelle famille). C'est la collection qu'on remplit en jouant.
- Les chiens de la famille d'Injagility n'y sont **pas** (décision du 22/10) : les races qui leur ressemblent (bernois, golden…) restent possibles, mais avec d'autres noms et d'autres robes.

### Pour toute la famille
- Textes courts et simples, sans mot difficile ; chiffres et icônes plutôt que des phrases.
- Chapitre 1 très doux (beaucoup de coups, 5 races, pas d'échec possible sur les 3 premiers niveaux) ; on peut rejouer un niveau raté autant qu'on veut, sans vies ni attente.
- Rien d'effrayant ni de triste : un chien pas encore adopté « attend sa famille », il ne lui arrive rien.

## 5. Les niveaux (proposition)
- **60 niveaux en 5 chapitres** de 12, comme les autres jeux à niveaux :
  1. **L'arrivée** : câlins seulement, 5 races, coups généreux ; les 3 premiers niveaux servent de tutoriel (glisser, bandana, balle).
  2. **Jour de pluie** : la **boue** arrive.
  3. **La nurserie** : les **chiots perdus**.
  4. **Le jardin** : **niches** et **gamelles**, grilles découpées.
  5. **La grande journée portes ouvertes** : tout mélangé, les plus difficiles, **laisses**.
- **Étoiles** : 1 étoile quand l'objectif est rempli, 2 et 3 selon les points (les coups restants rapportent beaucoup).
- Les niveaux sont écrits à la main dans `niveaux.js` (forme, objectifs, coups, races, obstacles) ; le **simulateur** vérifie qu'un joueur moyen les gagne (taux de réussite visé : 90 % au chapitre 1, 50 à 70 % au chapitre 5).
- Carte des niveaux : un chemin qui traverse le refuge (chenil, jardin, nurserie…), avec les étoiles sous chaque niveau.

## 6. Grille du jour
- La **journée du jour** : même grille et même tirage pour tout le monde (hasard réglé par la date), une seule tentative classée (règle du 15/10), comptée dès le départ.
- Proposition : 20 coups, on fait le plus de câlins possible ; classement `daily:` sur les câlins.

## 7. Écrans
- **Écran titre** : le logo DOGGY SAGA, un chien qui remue la tête, JOUER, LA JOURNEE DU JOUR, L'ALBUM, et le retour au menu de la Ludothèque (classe `ludo-retour`).
- **Carte des niveaux**, **partie** (en haut : objectifs et coups ; la grille ; en bas : le plancher), **pause** (reprendre, recommencer, carte, son), **fin de niveau** (étoiles, chiens adoptés, suivant), **album**.

## 8. Rendu et effets
- Canvas 2D, dessin vectoriel des chiens comme la maquette, **portraits préparés une fois** en images (3 humeurs : normal, yeux fermés, content) pour rester fluide.
- Effets de la maquette : rebond à l'atterrissage, chiens qui partent en grossissant et en montant, éclaboussures et cœurs, cœurs qui volent vers l'objectif, traces de pattes du bandana, onde de cœurs du nœud, cœurs vers chaque chien touché par la balle, écran qui tremble sur les gros bonus, mots sur les cascades (Ouaf !, Trop mignon !, Câlin géant !, Toute la meute !).
- À ajouter : la boue qui s'en va en éclaboussures, les chiots qui sautent dans leur panier, un petit feu d'artifice de cœurs à l'adoption.

## 9. Sons
- Décision du 22/10 : **chercher de vrais sons** libres de droits ; sinon, les fabriquer (synthèse comme la maquette : pop qui monte pendant les cascades, « ouaf », couinement de la balle).
- Pistes trouvées le 22/10 sur OpenGameArt (le site est joignable depuis l'environnement de Claude) :
  - [Dog sounds](https://opengameart.org/content/dog-sounds) (pauliuw, **CC0**, 9 sons : aboiements, grognements, jappements ; archive `dog.7z` ; qualité inégale) ;
  - [80 CC0 creature SFX](https://opengameart.org/content/80-cc0-creature-sfx) (rubberduck, **CC0**, dont 2 aboiements) ;
  - [dog barking mono](https://opengameart.org/content/dog-barking-mono) (licence à vérifier : OGA-BY 3.0 et CC0 affichées) ;
  - Dog-O SFX (troutsneeze, licence à vérifier fichier par fichier).
- En session 3 : un **banc d'écoute** (petite page, comme pour Nebula) qui met côte à côte les vrais sons retenus et les sons fabriqués ; l'utilisateur choisit. Tout son gardé est cité dans `credits/` (nom, créateur, licence, lien, jeu).

## 10. Technique
- Dossier `doggy-saga/` : `index.html`, `jeu.js` (écrans, rendu, animations), `regles.js` (le trois en ligne sans affichage, testable : grille, alignements, spéciaux, gravité, objectifs, hasard réglable), `niveaux.js`, `chiens.js` (dessin des portraits), `sons.js` ; objet `window.DoggySaga` pour les tests.
- Police **Baloo 2** (SIL OFL) copiée dans `polices/` et citée dans `credits/`.
- Simulateur `outils/doggy-saga-simulateur.js` (un joueur automatique qui joue chaque niveau des centaines de fois et donne le taux de réussite).
- Sauvegarde locale : niveaux finis, étoiles, album, réglages.

## 11. Classements et intégration
- Classements : `etoiles` (total des étoiles) et `daily:` (câlins de la journée du jour).
- Accueil (cartouche, volet, marque du défi du jour), `sw.js`, `README.md`, mémo, tests de fumée et de logique, artefact.

## 12. Plan de travail (opusplan, une conversation par session)
1. **Session 1** : `regles.js` (moteur et objectifs), `niveaux.js` (les 60 niveaux), simulateur, réglage de la difficulté.
2. **Session 2** : `jeu.js` et `chiens.js` (rendu de la maquette, nouvelles races, boue, chiots, obstacles, écrans, carte, album).
3. **Session 3** : sons, journée du jour, classements, accueil, tests, artefact.

## 13. Questions pour l'utilisateur
Toutes tranchées le 22/10 (voir § 1).

## 14. Bilan de la session 1 (22 et 23/10)
- **`doggy-saga/regles.js`** (logique pure, sans DOM ni `Math.random`, aussi sous Node) : grille 8 × 8 lue depuis un plan en texte (trous, boue `b`/`B`, niches `n`/`N`/`M`, gamelles `g`, laisses `l`/`L`, chiots `c`), état JSON (hasard `mulberry32` dans `e.rng`, graine par niveau), 16 chiens `DOG_RACES` (les 6 de la maquette + 10 nouveaux : Chorizo le teckel, Pompon le carlin, Gaston le bouledogue, Pépite la chihuahua, Éclair le lévrier, Cacao le labrador, Nounours le bouvier bernois (demande du 23/10, à la place du saint-bernard), Galette le corgi, Flocon le samoyède, Caramel le cocker). `dogCoup(e, a, b)` règle tout le coup d'un bloc et rend la **liste des événements** que la page rejouera en animation : `echange`, `retour`, `effet` (rayon, noeud, balle, croix, noeuds, toutes), `efface`, `cree`, `boue`, `niche`, `chute` (déplacements et nouvelles pièces), `sauve`, `adopte`, `melange`, `bonus`, `fin`.
- Règles posées : bandana (4), nœud (L ou T, 3 × 3), balle (5) ; bonus échangés : balle + chien = toute la race, balle + bonus = toute la race prend ce bonus, balle + balle = toute la grille, nœud + bandana = **grande croix** (3 rangées et 3 colonnes), nœud + nœud = **5 × 5**, bandana + bandana = les deux partent ; gravité avec trous traversés et **remplissage en diagonale** sous une niche ou un chien en laisse ; chiots immunisés, sauvés en bas de leur colonne, un nouveau tous les 2 coups (2 au plus sur la grille, réglable) ; gamelles renversées par un chien qui part à côté ; niches abîmées pareil ; chien en laisse : ne bouge pas, part quand il est aligné ; **bouquet final** façon Candy Crush (les bonus restants partent, puis chaque coup restant devient un bandana) ; mélange automatique s'il n'y a plus de coup.
- Points : chien 20 × la cascade, bandana 60, nœud 100, balle 200, boue 100 par couche, niche 40, gamelle 60, chiot 1 000. Étoiles : 1 = objectif rempli, 2 et 3 = seuils de points (`etoiles` de chaque niveau).
- **Journée du jour** : `dogJour(AAAAMMJJ)` (6 races et une forme tirées par la date, 20 coups, pas d'objectif) ; score = câlins (`dogCalinsTotal`).
- **60 niveaux** dans `doggy-saga/niveaux.js` (fabriqué par `outils/doggy-saga-niveaux.js`, ne pas modifier à la main) avec `DOG_CHAPITRES`. Chaque chien a au moins un niveau de câlins (pour l'album). Coups réglés avec le joueur automatique (`outils/doggy-saga-joueur.js` : meilleur coup 7 fois sur 10, sinon au hasard ; il essaie les coups sur une copie avec un autre tirage, pour ne pas voir l'avenir) : taux de réussite visé de 97 % (chapitre 1) à 61 % (niveau 60), plus doux au début de chaque chapitre ; les 3 premiers niveaux sont imperdables. Résultat : 11 à 39 coups par niveau (moyennes par chapitre : 29, 32, 29, 23, 22).
- Leçons : la forme en **os** et les coins isolés rendent la boue presque impossible à laver (niveaux refaits) ; un **anneau de laisses** enferme des cases qui ne se remplissent jamais (le simulateur l'a vu ; formes changées) ; 6 races au lieu de 5 rendent un niveau bien plus long ; les chiots partent de la 3e rangée pour ne pas allonger les niveaux.
- **`outils/doggy-saga-simulateur.js`** (dans `verifications.js`, 1 s) : 33 vérifications (voir `outils/README.md`).
- Prochaine étape : **session 2** (`jeu.js`, `chiens.js` : rendu de la maquette, 10 nouvelles races à dessiner, boue, chiots, niches, gamelles, laisses, écrans, carte, album), opusplan.

## 15. Bilan de la session 2 (23/10)
- **Demande du 23/10** : un **bouvier bernois** dans le jeu ; il prend la place du saint-bernard (`DOG_RACES[12]`, Nounours : noir, feu et blanc), ce qui garde les 60 niveaux tels quels.
- **`doggy-saga/chiens.js`** (`DogDessin`) : les 16 portraits en vectoriel (oreilles tombantes, pointues, grandes, en chauve-souris, rabattues, longues, bouclées, frisées ; liste blanche, masque du husky, taches du dalmatien, rides et masque noir du carlin, marques feu du bernois…), 3 humeurs ; bandana, nœud, balle, chiot (médaillon rose en pointillés, ruban, flèche verte vers le bas), gamelle, niche (petits os sur le toit = coups qu'il reste), boue (flaque jusqu'aux coins de la case, plus foncée à 2 couches, et taches sur le chien), laisse (piquet, laisse et collier), panier des chiots. Les couleurs des médaillons sont données **par place dans le niveau** (6 couleurs bien distinctes), pas par race.
- **`doggy-saga/jeu.js`** : toile de 360 de large et 600 à 820 de haut ; la grille visible `P.vis` rejoue un par un les événements de `dogCoup` (échange et retour, effets, chiens qui partent en grossissant, cœurs qui volent vers l'objectif, boue et niches abîmées, bonus créés, chute avec rebond, chiots qui sautent dans le panier, adoptions, mélange, bouquet final « C'est la fête ! ») ; à la fin de chaque coup, elle est comparée à la vraie grille (compteur `P.desync`, 0 dans les essais). Haut de l'écran : pause, niveau, barre des points avec les seuils des étoiles, coups, objectifs. Indice au bout de 5 s (2 s aux niveaux 1 à 3, avec une main qui montre le geste ; au niveau 2, le coup qui fait un bandana, au niveau 3 celui qui fait une balle).
- **Menus en HTML** (`index.html`, `style.css`, police Baloo 2 dans `polices/doggy-saga.css`, citée dans `credits/`) : titre (chien qui remue la tête, JOUER, album, bilan, retour Ludothèque), carte des 60 niveaux en 5 chapitres (chemin, nouveaux chiens du chapitre, étoiles, niveau en cours avec un chien qui saute), présentation du niveau (objectifs en images, aide des niveaux d'apprentissage, coups), pause, fin (étoiles qui sautent, chiens qui rejoignent l'album ; ou « Plus de coups ! » avec l'avancement), album des familles (16 cases, fiche avec un petit mot de la famille ; un chien pas encore adopté dit dans quel chapitre on le rencontre).
- Sauvegarde `doggysaga.progres` (`etoiles`, `scores`, `album`). Un niveau s'ouvre quand le précédent a au moins une étoile. `window.DoggySaga` : `lancer(id)`, `jouer(a, b)`, `etat()`, `partie()`, `ecran()`, `occupe()`, `vite = true` (animations 12 fois plus rapides), `carte()`, `album()`, `progres`.
- Essais (Playwright) : niveaux 1, 13, 25, 37, 49 et 60 joués jusqu'au bout, aucune erreur, aucune différence entre la grille visible et la vraie.
- Pas encore fait (session 3) : sons (`DogSons.jouer(k, n)` est déjà appelé partout : debut, glisse, non, pop, cascade, rayon, noeud, balle, bonus, niche, sauve, adopte, fete, gagne, perdu), journée du jour, classements, accueil, `sw.js`, tests de fumée, artefact.

## 16. Bilan de la session 3 (23/10)
- **Sons** (`doggy-saga/sons.js`, `DogSons`) : vrais sons CC0 d'OpenGameArt (« Dog sounds » de pauliuw, « 80 CC0 creature SFX » de rubberduck ; 13 sons coupés, égalisés, en Ogg Vorbis mono 32 kHz, encodés en base64 dans `sons-chiens.js`, 128 Ko, pour marcher hors connexion et dans l'artefact), et petits sons fabriqués en Web Audio comme la maquette (pop qui monte pendant les cascades, couinement de la balle, fanfare, bois de la niche, boue, mélange). Quatre rôles d'aboiement (`ouaf`, `joie`, `petit`, `triste`) ; choix par défaut `ouaf-c`, `ouaf-a`, `mignon-04`, `triste`, **à confirmer par l'utilisateur** au banc d'écoute `maquettes/doggy-saga-sons.html` (https://claude.ai/artifact/Hy4TBKtqswub6Yf4oKR87Z ; sur le site, le choix fait au banc est gardé dans `doggysaga.sons` et vaut aussi pour le jeu). Une fois choisis, on pourra retirer les sons inutilisés de `sons-chiens.js`. Son coupé au titre ou dans la pause (`doggysaga.son`). Crédits dans `credits/`.
- **Journée du jour** : bouton au titre (et lien `#jour`) ; présentation (date, les 6 chiens du jour, la règle de la tentative unique) ; en partie, compteur de câlins vers lequel volent les cœurs ; tentative classée posée dès le départ (`doggysaga.dailyTry`), câlins écrits à chaque fin de coup (`doggysaga.daily`) ; pas de « Recommencer » pendant la tentative classée ; ensuite on rejoue pour le plaisir, sans classement.
- **Classements** `doggysaga` : `etoiles` (envoyé quand le total monte) et `daily:AAAAMMJJ` (le plus de câlins) ; repris en rejoignant (`registerExisting`, `SYNC` 24), dans `PSEUDO_BOARDS`.
- **Accueil** : cartouche (icône beagle 16 × 16 `doggy`), « à la une », volet avec records et classements, bouton JOURNEE DU JOUR, marque du défi du jour, quoi de neuf, transfert `LUDO1-` (étoiles, album, journées).
- **Tests** : `logique.js` (30 journées du jour : même grille pour tous, 6 races, des coups possibles, pas d'alignement tout fait, grilles différentes ; transfert des sauvegardes) et `fumee.js` (niveau 1 joué jusqu'au bout sans décalage de la grille visible, journée du jour lancée).
- **Artefact** : https://claude.ai/artifact/6BHJa8xeXP91zKLkf1GiN6 (sans classement, comme les autres).
- Service worker `ludotheque-v58`.
- **Aboiements choisis par l'utilisateur** (23/10, au banc d'écoute) : alignements et bandana = `ouaf-e` (rubberduck, barking_01), joie = son fabriqué, petit chien = `mignon-05` (rubberduck, cute_05), plus de coups = son fabriqué. Les 11 autres candidats sont retirés de `sons-chiens.js` (128 Ko → 17 Ko) ; « Dog sounds » de pauliuw n'est plus utilisé (retiré des crédits). Service worker `ludotheque-v60`.

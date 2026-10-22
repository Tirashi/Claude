# Le Refuge — cahier des charges (à valider)

Un « trois en ligne » façon Candy Crush avec des **portraits de chiens** : on échange deux chiens voisins pour en aligner trois ou plus ; chaque chien aligné reçoit un **câlin**, et quand un chien a reçu assez de câlins, il **trouve une famille**. Des niveaux à la suite (les journées au refuge), avec des étoiles, et une grille du jour. Jeu bien dynamique : animations, effets, sons.

## 1. Décisions de l'utilisateur
- 22/10, maquette 1 (`maquettes/bonbons.html`, https://claude.ai/artifact/6VgviU7PYUgeK26wpE5cLZ : Confiserie, Pixel 32 bits, Néon) : « autre chose que des bonbons ou des trucs 32 bits ».
- 22/10, maquette 2 (`maquettes/bonbons-2.html`, https://claude.ai/artifact/NHjS2wtFiwviNf7C2HZWEF : le Refuge, le Héros, la Fresque) : **le Refuge retenu** (« vraiment cool »).
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
- Question : y mettre aussi **les chiens de la famille** (ceux d'Injagility : bouvier bernois, jack russell, golden, border collie, berger australien, berger des Shetland) ? Par exemple comme bénévoles du refuge, ou en chiens à débloquer à la fin.

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
- **Écran titre** : le logo, un chien qui remue la tête, JOUER, LA JOURNEE DU JOUR, L'ALBUM, et le retour au menu de la Ludothèque (classe `ludo-retour`).
- **Carte des niveaux**, **partie** (en haut : objectifs et coups ; la grille ; en bas : le plancher), **pause** (reprendre, recommencer, carte, son), **fin de niveau** (étoiles, chiens adoptés, suivant), **album**.

## 8. Rendu et effets
- Canvas 2D, dessin vectoriel des chiens comme la maquette, **portraits préparés une fois** en images (3 humeurs : normal, yeux fermés, content) pour rester fluide.
- Effets de la maquette : rebond à l'atterrissage, chiens qui partent en grossissant et en montant, éclaboussures et cœurs, cœurs qui volent vers l'objectif, traces de pattes du bandana, onde de cœurs du nœud, cœurs vers chaque chien touché par la balle, écran qui tremble sur les gros bonus, mots sur les cascades (Ouaf !, Trop mignon !, Câlin géant !, Toute la meute !).
- À ajouter : la boue qui s'en va en éclaboussures, les chiots qui sautent dans leur panier, un petit feu d'artifice de cœurs à l'adoption.

## 9. Sons
- Sons synthétisés comme la maquette (pop qui monte pendant les cascades, « ouaf », couinement de la balle). Proposition : chercher aussi de **vrais aboiements libres de droits** (CC0) pour quelques moments (adoption) ; dans ce cas, les citer dans `credits/`.

## 10. Technique
- Dossier `refuge/` : `index.html`, `jeu.js` (écrans, rendu, animations), `regles.js` (le trois en ligne sans affichage, testable : grille, alignements, spéciaux, gravité, objectifs, hasard réglable), `niveaux.js`, `chiens.js` (dessin des portraits), `sons.js` ; objet `window.Refuge` pour les tests.
- Simulateur `outils/refuge-simulateur.js` (un joueur automatique qui joue chaque niveau des centaines de fois et donne le taux de réussite).
- Sauvegarde locale : niveaux finis, étoiles, album, réglages.

## 11. Classements et intégration
- Classements : `etoiles` (total des étoiles) et `daily:` (câlins de la journée du jour).
- Accueil (cartouche, volet, marque du défi du jour), `sw.js`, `README.md`, mémo, tests de fumée et de logique, artefact.

## 12. Plan de travail (opusplan, une conversation par session)
1. **Session 1** : `regles.js` (moteur et objectifs), `niveaux.js` (les 60 niveaux), simulateur, réglage de la difficulté.
2. **Session 2** : `jeu.js` et `chiens.js` (rendu de la maquette, nouvelles races, boue, chiots, obstacles, écrans, carte, album).
3. **Session 3** : sons, journée du jour, classements, accueil, tests, artefact.

## 13. Questions pour l'utilisateur
1. Le nom : **Le Refuge**, **Le Refuge des Quatre Pattes**, ou autre ?
2. Les objectifs et les chapitres (§ 3 et 5) te conviennent-ils ?
3. Les chiens de la famille d'Injagility dans le jeu (§ 4) ?
4. Pour qui : toi, ou aussi l'enfant de 7 ans (alors chapitre 1 plus doux et mots simples) ?
5. La journée du jour (§ 6) : d'accord ?
6. Sons : rester en synthèse, ou chercher de vrais aboiements libres de droits ?

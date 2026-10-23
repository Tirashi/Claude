# Romet — cahier des charges

Coin pusher en 3D (Three.js) pour le téléphone, en hommage à Mynthos qui a popularisé le genre. On lâche des pièces sur un plateau où un poussoir va et vient ; les pièces qui tombent par l'avant sont gagnées, celles des côtés sont perdues. **Le jeu est une suite de machines**, chacune dans un monde différent, de plus en plus difficiles à finir (idée de l'utilisateur du 22/10, après les trois maquettes).

## 1. Décisions de l'utilisateur
- 22/10, maquette 1 (`maquettes/coin-pusher.html`, https://claude.ai/artifact/T54AGRTH85JwZstrEcV9n1) : casino néon et fête foraine retenus ; **60 images/s** sur son téléphone (55 au pire) avec la physique maison.
- 22/10 : le jeu s'appelle **Romet**.
- 22/10, maquette 2 (`maquettes/romet.html`, https://claude.ai/artifact/E1oayNtBM9SsemAnFdhcfk) : « pas mal, mais tu peux faire mieux, sois original ».
- 22/10, maquette 3 (`maquettes/romet-3.html`, https://claude.ai/artifact/54niZV1m7XcXPzcjGMKEs1) : l'épave, la ruche, l'horloger.
- 22/10 : « ils sont tous sympa, même les premiers » → **chaque monde devient une machine, de plus en plus dure à finir**.
- 22/10, réponses aux questions du brouillon : **une bourse de départ, sans recharge** (les pièces gagnées se rejouent, et à un moment il n'y en a plus assez pour continuer à l'infini) ; **pas de défi du jour pour le moment** ; ordre des machines, règles spéciales et **machine secrète** approuvés ; **pas de secousse**. Cahier des charges validé.

## 2. Principe
- Une partie se joue sur **une machine** : on touche l'écran pour lâcher une pièce à l'endroit du doigt (viseur au-dessus de la fente). Le poussoir va et vient ; ce qui tombe à l'avant tombe dans le bac et revient dans la réserve ; ce qui tombe sur les côtés est perdu.
- **Finir une machine = gagner ses 6 trésors** (les objets à collectionner de chaque monde : peluches à la foire, pierres au casino, pollen et gelée royale à la ruche, perles dans l'épave, rubis chez l'horloger…). Les trésors tombent de temps en temps avec les pièces ; il faut les amener jusqu'au bord.
- Finir une machine **débloque la suivante**. On peut toujours revenir sur une machine finie (pour le plaisir et le record de butin).
- **Une partie = une bourse** (§ 5) : on joue jusqu'à ce qu'elle soit vide et que plus rien ne tombe. Les **trésors gagnés restent acquis** d'une partie à l'autre ; le tas et la bourse repartent de zéro à la partie suivante. Il faut donc souvent plusieurs parties pour finir une machine.
- **La partie en cours est sauvegardée** (position des pièces, bourse, trésors) : on retrouve son tas comme on l'a laissé.

## 3. Les machines (ordre proposé, de la plus facile à la plus dure)
Chaque machine reprend le décor de sa maquette et ajoute **une règle à elle**, qui rend la suivante un peu plus dure :

| # | Machine | Monde (maquette) | Sa particularité | Ce qui la rend plus dure |
|---|---|---|---|---|
| 1 | **La foire** | B de la maquette 2 (fête foraine de jour) | aucune : apprendre le jeu | parois longues (peu de pertes), bonus fréquents |
| 2 | **La ruche** | B de la maquette 3 | pièces hexagonales qui s'empilent plus haut ; **coulée de miel** : une bande collante où les pièces avancent lentement | ouvertures latérales un peu plus longues |
| 3 | **L'épave** | A de la maquette 3 | **le courant** : de temps en temps une vague pousse le tas vers un côté | pertes latérales plus fréquentes |
| 4 | **Le casino** | A de la maquette 2 (néon) | **couloirs lumineux** : une pièce qui tombe dans un couloir allumé compte double ; les couloirs changent | trésors plus rares |
| 5 | **La foire de nuit** | C de la maquette 2 | **clous** sous la fente, comme un flipper japonais : la pièce rebondit et ne tombe pas toujours où l'on vise | visée moins sûre |
| 6 | **L'horloger** | C de la maquette 3 | **deux étages** : un premier poussoir en haut fait tomber les pièces sur le plateau du bas ; le mécanisme est visible | le plus long à faire tomber |

La maquette 1 (pixel 3D rétro) sert de **machine secrète** (bonus à la fin) : couloirs et clous à la fois, parois très courtes, bourse de 30.

Réalisation (session 2, 22/10) :
- **Courant** (épave) : toutes les 10 à 18 s, pendant 2 s, tout ce qui est posé reçoit une poussée latérale (pièces endormies réveillées) ; reflets, bulles, algues et poissons partent du même côté ; message « ◀ Courant ! ».
- **Couloirs** (casino) : 7 couloirs au bord avant, un seul allumé, qui change toutes les 5 s ; bande au sol et barre lumineuse sur la façade ; une pièce (ou une géante) qui tombe dans le couloir allumé compte double.
- **Clous** (foire de nuit) : 4 rangées de clous sous la fente ; chaque rangée dévie la pièce de 0,3 à gauche ou à droite pendant sa chute (petits « tic »).
- **Deux étages** (horloger) : étagère à y = 1,3 (bord avant z = -3), avec son propre poussoir qui va et vient à l'opposé du grand ; les pièces sont lâchées sur l'étagère et tombent sur le poussoir du bas.
- Rendements en partie (simulateur, 4 parties) : épave 78 % (finie en 3 à 6 parties), casino 88 % (4), foire de nuit ~80 % (3 à 4), horloger 60 à 80 % (5 à 6), machine secrète 79 % (6 à 7).

## 4. Bonus (communs à toutes les machines)
Repris de la maquette, habillés selon le monde :
- **Pièce géante** : vaut 10 pièces.
- **Mur** : ferme les côtés pendant 12 secondes (plus de pertes ; 20 s au départ, trop généreux au simulateur).
- **Pluie** : 10 pièces gratuites tombent d'un coup.
- **Trésor** : un des 6 trésors de la machine (on ne retombe pas sur un trésor déjà gagné tant qu'il en manque).
- Pas de secousse (décision du 22/10).

## 5. La bourse (décision du 22/10)
- On commence chaque partie avec **une bourse de pièces** ; **pas de recharge**. Les pièces qui tombent dans le bac reviennent dans la bourse et se rejouent.
- La machine rend un peu moins qu'on ne lâche (environ 8 à 9 pièces sur 10 en régime, à régler machine par machine) : la bourse finit par se vider. Les bonus (pièce géante, pluie, cascades) font les bons moments.
- **Fin de partie** : bourse vide et plus rien ne bouge pendant 3 secondes → écran de fin (butin de la partie, trésors gagnés, meilleur butin), puis REJOUER (nouveau tas, nouvelle bourse) ou MACHINES.
- Bourse de départ selon la machine, de plus en plus petite : foire 60, ruche 55, épave 50, casino 45, foire de nuit 40, horloger 40 (**50 depuis la session 2** : l'étage du haut garde une trentaine de pièces), machine secrète 30 (à régler en jouant, avec un petit simulateur Node).
- **Réglages de la session 1** (simulateur, joueur au hasard, une pièce toutes les 0,4 s) : chaque bonus de pièces (géante, pluie, mur) vaut environ 8 pièces, donc les bonus doivent rester rares : un tous les 10 lâchers rendait 130 % et la bourse ne se vidait jamais. Foire : bonus tous les 30 lâchers, mur de 12 s, parois jusqu'à z = 1,7 → rendement 86 %, environ 420 lâchers par bourse, 4,5 trésors par partie, finie en 2 à 4 parties. Ruche : bonus tous les 35, parois jusqu'à 1,5, miel → 73 %, 200 lâchers, 1,8 trésor par partie.
- **Butin** d'une partie = toutes les pièces tombées dans le bac (une pièce rejouée puis regagnée compte encore).

## 6. Score et classements
- Par machine : **trésors** (sur 6) et **meilleur butin** en une partie.
- Classements `romet` : `tresors` (total des trésors, toutes machines) et `butin` (meilleur butin en une partie, toutes machines confondues).
- **Pas de défi du jour pour le moment** (décision du 22/10) ; on pourra ajouter une machine du jour plus tard.

## 7. Écrans
- **Titre** : la machine en cours qui tourne en fond, logo ROMET, boutons JOUER, CLASSEMENT, RÉGLAGES, retour à la Ludothèque.
- **Les machines** : une carte par machine (vignette, nom, trésors gagnés, cadenas).
- **Jeu** : bandeau en haut (réserve, logo, butin, dans le style de la machine), la machine, la rangée des 6 trésors en bas, bouton pause.
- **Pause** : REPRENDRE, MACHINES, réglages, retour à la Ludothèque.
- **Fin de partie** : butin de la partie, meilleur butin, trésors ; REJOUER ou MACHINES.
- **Machine finie** : les 6 trésors qui brillent, « MACHINE TERMINÉE », la suivante qui se déverrouille.
- **Machine secrète** (pixel 3D rétro de la maquette 1) : apparaît quand les 6 machines sont finies.

## 8. Sons
Bruitages synthétisés en Web Audio : pièce lâchée, tintement des pièces qui tombent (plus fort pour une cascade), poussoir, trésor gagné, bonus. Une petite ambiance par monde (orgue de foire, bourdonnement des abeilles, bulles et houle, tic-tac). Réglages : bruitages, ambiance, vibrations.

## 9. Technique
- Dossier **`romet/`** : `index.html`, `jeu.js` (écrans, boucle, rendu), **`physique.js`** (la physique maison des maquettes : disques posés sur le plus haut appui, poussée propagée d'arrière en avant, glissement des tas, bascule dans le vide ; logique pure, testable sous Node, avec une graine pour des tas reproductibles), **`machines.js`** (les 6 machines et la secrète : bourse, paramètres, règle spéciale, trésors) ; simulateur `outils/romet-simulateur.js` (joue des parties au hasard et mesure la durée d'une bourse et le rendement de chaque machine), **`decors.js`** (habillage 3D de chaque monde, repris des maquettes).
- Three.js r128 (`lib/three.min.js`). Pas de cannon.js (trop lent avec 150 pièces, mesuré le 22/10).
- Optimisations déjà essayées dans les maquettes : une seule InstancedMesh pour les pièces (ordre stable, seules les pièces qui bougent sont recalculées), ampoules en une seule InstancedMesh, résolution qui baisse sous 50 images/s. À ajouter : **mise au repos** des pièces immobiles dans la physique, rendu arrêté quand la page est cachée, environ 150 pièces au plus par machine.
- `window.Romet` pour les tests.
- Polices : celles des mondes retenus (Rye, Monoton, Chewy, Pirata One, Cinzel : Google Fonts, licence OFL) à copier dans `polices/` pour le hors connexion et à citer dans `credits/`.

## 10. Sauvegarde, classements, intégration
- Sauvegardes (préfixe `romet.`) : `romet.machines` (par machine : trésors, meilleur butin), `romet.partie` (la partie en cours **de chaque machine** : tas, bourse, butin ; on peut changer de machine sans perdre son tas), `romet.opts`. Dans le transfert `LUDO1-` (fusion : le plus de trésors et le meilleur butin).
- Classements `romet` : voir § 6.
- Accueil : famille 3D (comme le Yams et Le Magasinier), icône 16×16 (une pièce frappée d'un R), `META`, `NEWS`, `RECS`, `RANKS`, `PROGRESS` (pas de `TODAY` tant qu'il n'y a pas de défi du jour).
- Liste de contrôle « Ajouter un nouveau jeu » de `specs/ludotheque.md` ; artefact à créer (demander le lien à l'utilisateur).

## 11. Plan de travail (opusplan)
1. **Session 1, le moteur et 2 machines** (**faite le 22/10**, détails dans `specs/suivi.md`) : `physique.js` (reprise des maquettes, mise au repos, sauvegarde du tas), rendu, bonus, bourse et fin de partie, trésors, simulateur, la foire et la ruche jouables du début à la fin.
2. **Session 2, les 4 autres machines et la secrète** (**faite le 22/10**, détails dans `specs/suivi.md`) : l'épave, le casino, la foire de nuit, l'horloger, la machine secrète, avec leurs règles et leurs décors ; écran des machines, déblocages ; réglage des bourses au simulateur.
3. **Session 3, finitions et intégration** (**faite le 22/10**, détails dans `specs/suivi.md` ; pas d'artefact pour le moment, choix de l'utilisateur du 23/10) : titre, pause, sons et ambiances, classements, accueil, transfert, crédits, tests, docs, artefact.

Coût estimé : **10 à 15 % de la semaine** (le moteur et les décors existent déjà dans les maquettes ; le plus long est de faire 6 règles et de régler la difficulté).

## 12. Questions tranchées (22/10)
1. Bourse de départ sans recharge, les pièces gagnées se rejouent (§ 5).
2. Pas de défi du jour pour le moment (§ 6).
3. Ordre des machines, règles spéciales et machine secrète : oui (§ 3).
4. Pas de secousse (§ 4).

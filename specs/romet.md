# Romet — cahier des charges (brouillon à valider)

Coin pusher en 3D (Three.js) pour le téléphone, en hommage à Mynthos qui a popularisé le genre. On lâche des pièces sur un plateau où un poussoir va et vient ; les pièces qui tombent par l'avant sont gagnées, celles des côtés sont perdues. **Le jeu est une suite de machines**, chacune dans un monde différent, de plus en plus difficiles à finir (idée de l'utilisateur du 22/10, après les trois maquettes).

## 1. Décisions de l'utilisateur
- 22/10, maquette 1 (`maquettes/coin-pusher.html`, https://claude.ai/artifact/T54AGRTH85JwZstrEcV9n1) : casino néon et fête foraine retenus ; **60 images/s** sur son téléphone (55 au pire) avec la physique maison.
- 22/10 : le jeu s'appelle **Romet**.
- 22/10, maquette 2 (`maquettes/romet.html`, https://claude.ai/artifact/E1oayNtBM9SsemAnFdhcfk) : « pas mal, mais tu peux faire mieux, sois original ».
- 22/10, maquette 3 (`maquettes/romet-3.html`, https://claude.ai/artifact/54niZV1m7XcXPzcjGMKEs1) : l'épave, la ruche, l'horloger.
- 22/10 : « ils sont tous sympa, même les premiers » → **chaque monde devient une machine, de plus en plus dure à finir**.

## 2. Principe
- Une partie se joue sur **une machine** : on touche l'écran pour lâcher une pièce à l'endroit du doigt (viseur au-dessus de la fente). Le poussoir va et vient ; ce qui tombe à l'avant tombe dans le bac et revient dans la réserve ; ce qui tombe sur les côtés est perdu.
- **Finir une machine = gagner ses 6 trésors** (les objets à collectionner de chaque monde : peluches à la foire, pierres au casino, pollen et gelée royale à la ruche, perles dans l'épave, rubis chez l'horloger…). Les trésors tombent de temps en temps avec les pièces ; il faut les amener jusqu'au bord.
- Finir une machine **débloque la suivante**. On peut toujours revenir sur une machine finie (pour le plaisir et le record de butin).
- **L'état de chaque machine est sauvegardé** (position des pièces, réserve, trésors gagnés) : on retrouve son tas comme on l'a laissé, comme sur une vraie machine.

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

La maquette 1 (pixel 3D rétro) peut servir de **machine secrète** (bonus à la fin), si on veut.

## 4. Bonus (communs à toutes les machines)
Repris de la maquette, habillés selon le monde :
- **Pièce géante** : vaut 10 pièces.
- **Mur** : ferme les côtés pendant 20 secondes (plus de pertes).
- **Pluie** : 10 pièces gratuites tombent d'un coup.
- **Trésor** : un des 6 trésors de la machine (on ne retombe pas sur un trésor déjà gagné tant qu'il en manque).
- À voir : **secousse** (le joueur peut secouer la machine une fois de temps en temps pour décoincer un tas), à décider en session 1.

## 5. Réserve de pièces (question 1)
Deux façons de faire :
- **A. Sans attente** (proposée) : réserve de 30 pièces, +1 toutes les 4 secondes de jeu tant qu'on est sous 30, plus ce qu'on gagne. On ne reste jamais bloqué.
- **B. Façon jeu mobile** : la réserve se recharge **en temps réel**, même téléphone fermé (par exemple +1 toutes les 2 minutes, jusqu'à 30). Plus de tension, mais on doit attendre.

## 6. Score, classements, défi du jour (question 2)
- Par machine : **trésors** (sur 6) et **butin** (total de pièces gagnées).
- Classement proposé : `tresors` (nombre total de trésors, puis machines finies) et `butin` (meilleur butin cumulé).
- **Défi du jour** (proposé) : la **machine du jour**, la même pour toute la famille (tas de départ tiré à partir de la date), **50 pièces et pas de recharge** : on compte le butin. Une seule tentative classée par jour (règle des défis du jour, type mission : comptée dès le départ). Classement `daily:AAAAMMJJ`.

## 7. Écrans
- **Titre** : la machine en cours qui tourne en fond, logo ROMET, boutons JOUER, MACHINE DU JOUR, CLASSEMENT, RÉGLAGES, retour à la Ludothèque.
- **Les machines** : une carte par machine (vignette, nom, trésors gagnés, cadenas).
- **Jeu** : bandeau en haut (réserve, logo, butin, dans le style de la machine), la machine, la rangée des 6 trésors en bas, bouton pause.
- **Pause** : REPRENDRE, MACHINES, réglages, retour à la Ludothèque.
- **Machine finie** : les 6 trésors qui brillent, « MACHINE TERMINÉE », la suivante qui se déverrouille.

## 8. Sons
Bruitages synthétisés en Web Audio : pièce lâchée, tintement des pièces qui tombent (plus fort pour une cascade), poussoir, trésor gagné, bonus. Une petite ambiance par monde (orgue de foire, bourdonnement des abeilles, bulles et houle, tic-tac). Réglages : bruitages, ambiance, vibrations.

## 9. Technique
- Dossier **`romet/`** : `index.html`, `jeu.js` (écrans, boucle, rendu), **`physique.js`** (la physique maison des maquettes : disques posés sur le plus haut appui, poussée propagée d'arrière en avant, glissement des tas, bascule dans le vide ; logique pure, testable sous Node, avec une graine pour le défi du jour), **`machines.js`** (les 6 machines : paramètres, règle spéciale, trésors), **`decors.js`** (habillage 3D de chaque monde, repris des maquettes).
- Three.js r128 (`lib/three.min.js`). Pas de cannon.js (trop lent avec 150 pièces, mesuré le 22/10).
- Optimisations déjà essayées dans les maquettes : une seule InstancedMesh pour les pièces (ordre stable, seules les pièces qui bougent sont recalculées), ampoules en une seule InstancedMesh, résolution qui baisse sous 50 images/s. À ajouter : **mise au repos** des pièces immobiles dans la physique, rendu arrêté quand la page est cachée, environ 150 pièces au plus par machine.
- `window.Romet` pour les tests.
- Polices : celles des mondes retenus (Rye, Monoton, Chewy, Pirata One, Cinzel : Google Fonts, licence OFL) à copier dans `polices/` pour le hors connexion et à citer dans `credits/`.

## 10. Sauvegarde, classements, intégration
- Sauvegardes (préfixe `romet.`) : `romet.machines` (par machine : trésors, butin, état du tas), `romet.reserve`, `romet.daily`, `romet.dailyRun`, `romet.opts`. Dans le transfert `LUDO1-` (fusion : le plus de trésors et de butin).
- Classements `romet` : voir § 6.
- Accueil : famille 3D (comme le Yams et Le Magasinier), icône 16×16 (une pièce frappée d'un R), `META`, `NEWS`, `RECS`, `RANKS`, `PROGRESS`, `TODAY`.
- Liste de contrôle « Ajouter un nouveau jeu » de `specs/ludotheque.md` ; artefact à créer (demander le lien à l'utilisateur).

## 11. Plan de travail (opusplan)
1. **Session 1, le moteur et 2 machines** : `physique.js` (reprise des maquettes, mise au repos, sauvegarde du tas), rendu, bonus, réserve, trésors, la foire et la ruche jouables du début à la fin.
2. **Session 2, les 4 autres machines** : l'épave, le casino, la foire de nuit, l'horloger, avec leurs règles et leurs décors ; écran des machines, déblocages.
3. **Session 3, finitions et intégration** : titre, pause, sons et ambiances, défi du jour, classements, accueil, transfert, crédits, tests, docs, artefact.

Coût estimé : **10 à 15 % de la semaine** (le moteur et les décors existent déjà dans les maquettes ; le plus long est de faire 6 règles et de régler la difficulté).

## 12. Questions à l'utilisateur
1. Réserve **sans attente** (A) ou **en temps réel** comme un jeu mobile (B) ? (§ 5)
2. Le **défi du jour** (machine du jour, 50 pièces) et les classements proposés te vont ? (§ 6)
3. L'**ordre des machines** et leurs **règles spéciales** (§ 3) te plaisent ? La maquette pixel 3D en machine secrète ?
4. La **secousse** de la machine (§ 4) : oui ou non ?

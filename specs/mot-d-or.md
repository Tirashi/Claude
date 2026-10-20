# Le Mot d'or — cahier des charges

Jeu de mots du jour, façon « Wordle », en français : un mot de **6 lettres** à trouver en **6 essais**. Après chaque essai, les tuiles se retournent : **or** = lettre bien placée, **argent** = lettre du mot mais ailleurs, **gris** = lettre absente. Le même mot pour toute la famille, un nouveau à minuit ; série de jours, statistiques, partage du résultat.

## 1. Décisions de l'utilisateur
- 20/10, maquette 1 (`maquettes/mot-d-or.html`, https://claude.ai/artifact/2JjrJxGzfjjp24jEEkA6qv) : trois tables d'après la scène du Mot d'or de la planche 32 bits (A table de jeu, B bureau du soir, C rivière d'or). **Choix : B, le bureau du soir.** Pas d'accents ni de points sur les tuiles. Tout ce qui touche à l'interface (boutons, clavier…) dans une **police soignée et lisible** ; ergonomie « aux petits oignons ».
- 20/10, maquette 2 (`maquettes/mot-d-or-2.html`, https://claude.ai/artifact/FRFEmEuihqKqx3KZSMaWwG) : B avec l'interface nette, deux polices comparées. **Validée : Fredoka** ; on garde le **rappel des lettres d'or en filigrane** et le **partage en carrés de couleur**.

## 2. Règles
- Mot secret de 6 lettres, sans accents (ÉTÉ s'écrit ETE ; Ç → C, Œ → OE). Les essais aussi : 6 lettres A à Z.
- Coloration classique avec les **lettres doubles** traitées correctement : d'abord les lettres bien placées (or), puis, de gauche à droite, une lettre mal placée n'est argent que s'il reste un exemplaire non utilisé de cette lettre dans le mot ; sinon gris (fonction `evaluate` de la maquette).
- Un essai doit compter 6 lettres (« Il manque 2 lettres ») et être un **mot connu** du dictionnaire des essais (« Ce mot n'est pas dans le dictionnaire »), sinon la ligne tremble et rien n'est compté.
- Gagné quand toute la ligne est en or ; perdu après 6 essais sans trouver, et le mot est affiché.
- Pas de « mode difficile » (obligation de réutiliser les indices) pour le moment.

## 3. Mot du jour et entraînement
- **Mot du jour** : le même pour tout le monde, choisi à partir de la date du téléphone (jour local, nouveau mot à minuit). La liste des solutions est mélangée une fois pour toutes dans `mots.js` (ordre figé), et le jour *n* depuis la date de départ du jeu prend le mot *n* modulo la longueur de la liste : **pas de répétition** avant d'avoir épuisé la liste (plus d'un an et demi avec 600 mots).
- **Une seule tentative classée par jour** (règle des défis du jour du 15/10) : la partie du jour est sauvegardée **après chaque essai** (lignes jouées), et reprise telle quelle si on quitte et revient. Une fois finie, l'écran reste sur la grille du jour avec les statistiques et le compte à rebours.
- **Entraînement** (à confirmer, § 11) : après la partie du jour, un bouton AUTRE MOT lance un mot tiré au hasard dans les solutions, **non classé**, qui ne touche ni à la série ni aux statistiques (bandeau « ENTRAINEMENT » sous l'en-tête pour ne pas confondre).

## 4. Les mots (le gros du travail)
- **`mot-d-or/mots.js`** : deux listes en majuscules sans accents.
  - **Solutions** (≈ 600) : mots courants que toute la famille connaît, enfants compris : noms communs au singulier, adjectifs au masculin singulier, verbes à l'infinitif. **Pas** de noms propres, de pluriels, de verbes conjugués, de mots grossiers, rares, techniques ou d'argot. Relue à la main.
  - **Essais acceptés** (plusieurs milliers) : toutes les formes de 6 lettres d'un dictionnaire libre (pluriels, féminins, verbes conjugués compris), plus toutes les solutions.
- Source du dictionnaire des essais : une liste de mots française **libre** (par ex. Lexique 3, CC BY-SA, ou le dictionnaire de Grammalecte, MPL), réduite aux mots de 6 lettres puis désaccentuée par un outil Node (`outils/mot-d-or-mots.js`) ; la licence est citée dans `mots.js`. Si aucune n'est téléchargeable depuis l'environnement de Claude (proxy), plan B à décider (§ 11).
- Taille : quelques dizaines de Ko ; recherche par un `Set` construit au démarrage.
- `outils/verifications.js` (ou `logique.js`) contrôle : 6 lettres A à Z partout, pas de doublons, chaque solution est aussi un essai accepté, mot du jour déterministe.

## 5. Écran (repris de la maquette 2)
Canvas 2D, scène dessinée en **216 × 384** puis agrandie 3 fois sans lissage ; **textes d'interface tracés ensuite en haute définition** (fonction `ui`, Fredoka) ; tuiles et logo en pixel art (Press Start 2P, majuscules sans accent).
- **En-tête** (plaque de cuir) : bouton retour à la Ludothèque (flèche, à gauche ; pas dessiné si `window.ludoArtefact`), logo LE MOT D'OR, boutons **?** (aide) et **statistiques** ; en dessous « Défi du 20 octobre » et « essai 3 sur 6 » / « trouvé en 3 ».
- **Grille 6 × 6** sur le sous-main en cuir bordeaux doré au fer, cases creusées, tuiles en ivoire ; or avec reflet qui balaie et étincelles ; argent strié ; gris sombre.
- **Clavier AZERTY** sur l'écritoire, sur toute la largeur : touches lettres 19 px, **VALIDER** et **EFFACER** 40 px ; touches hautes (34 px de face + 3 de tranche) ; lettres en Fredoka 12,5, nettes.
- **Décor** : bureau d'acajou, cercle de lumière de la lampe, pénombre tramée, poussière qui danse dans la lumière.

## 6. Ergonomie (validée sur la maquette 2)
- **VALIDER** éteint tant que la ligne n'a pas 6 lettres, puis en or avec un liseré qui pulse.
- **Clavier coloré au fil du retournement** (chaque touche prend sa couleur quand sa tuile se retourne), meilleure couleur gardée (or > argent > gris) ; les lettres grises restent lisibles.
- **Curseur libre** : cadre doré qui respire autour de la case active ; toucher une case de la ligne en cours y place le curseur ; une lettre tapée remplit la case puis le curseur saute à la prochaine case vide ; EFFACER vide la case du curseur, ou la précédente si elle est vide.
- **Rappel en filigrane** des lettres d'or déjà trouvées dans les cases vides de la ligne en cours.
- **Messages courts** en haut de la grille (plaque) pendant 1,5 s : « Il manque 2 lettres », « Ce mot n'est pas dans le dictionnaire », bravos selon le nombre d'essais (« Incroyable ! » … « Ouf, de justesse ! ») ; en cas de défaite, le mot reste affiché.
- Ligne qui **tremble** sur une erreur ; tuile qui saute un peu quand on tape ; tuiles qui **sautillent en vague** puis **gerbe d'or** quand on gagne.
- **Vibration** courte à chaque touche (`navigator.vibrate`, Android), plus marquée sur une erreur et sur la victoire.
- Saisie bloquée pendant le retournement (≈ 1,6 s) ; touches enfoncées visibles ; marges de toucher élargies d'1 px autour des touches.
- **Clavier physique** sur ordinateur : lettres, Entrée, Retour arrière, Échap (ferme une fenêtre).

## 7. Fenêtres
- **Aide** (bouton ?, ouverte d'elle-même à la toute première partie) : règle en deux phrases, trois tuiles d'exemple (or, argent, gris) avec leur sens, rappel « nouveau mot à minuit, le même pour toute la famille ; les accents ne comptent pas » ; réglage **Son : oui / non** ; bouton JOUER.
- **Statistiques** (bouton, et ouverte d'elle-même 2 s après la fin de partie) : BRAVO ! / DOMMAGE / STATISTIQUES ; « Trouvé en 3 essais » ou « Le mot était … » ; parties, % gagnées, série (avec la flamme), record ; **répartition des essais** en barres (celle du jour en or) ; compte à rebours « Prochain mot dans » ; boutons **PARTAGER**, **CLASSEMENT** (vers `../index.html#mot-d-or`) et AUTRE MOT (si l'entraînement est retenu).
- **Partager** : copie dans le presse-papiers « Le Mot d'or · 20 octobre · 3/6 » puis la grille en 🟨 ⬜ ⬛ (rien des lettres) ; message « Résultat copié ! » ; si la copie échoue, le texte est affiché pour être sélectionné.
- Toucher en dehors d'une fenêtre ou ✕ la ferme.

## 8. Sons (discrets, Web Audio, coupables)
Petit « toc » de bois à chaque touche, retournement feutré par tuile (plus clair pour l'argent, petite clochette pour l'or), « bzz » doux sur une erreur, arpège doré à la victoire, deux notes graves à la défaite. Coupés par le réglage de l'aide ; rien avant le premier toucher.

## 9. Sauvegarde, statistiques, classements
- `localStorage` (clé `motdor`, lectures et écritures dans des try/catch) : partie du jour (date, essais), statistiques (parties, gagnées, série, record, dernière date gagnée, répartition 1 à 6), son, aide déjà vue.
- **Série** : +1 si on gagne le jour qui suit le dernier jour gagné ; remise à 0 si on perd ou si on saute un jour.
- **Classements** (`ludo-scores.js`) : jeu `mot-d-or`, tableau **`daily:AAAA-MM-JJ`**, valeur = nombre d'essais (plus bas gagne ; une défaite n'est pas envoyée) ; tableau **`serie`** = meilleure série (plus haut gagne). Volet de l'accueil : « Mot du jour » (essais du jour) et « Meilleure série ».
- **Transfert `LUDO1-`** (`accueil.js`) : collecte, description, fusion (garder le plus grand de chaque statistique ; partie du jour : celle qui a le plus d'essais).

## 10. Fichiers et intégration
- `mot-d-or/index.html`, `mot-d-or/jeu.js`, `mot-d-or/mots.js` ; Fredoka en local (`polices/fredoka.woff2`, déjà dans le dépôt), lien Google gardé pour l'artefact.
- Liste de contrôle du mémo (`specs/ludotheque.md`) : accueil (`GAMES`, `META`/`NEWS`, genre Réflexion, icône 16 × 16 dans `icones.js`), classements, transfert, `sw.js` (`FILES`, `VERSION`), docs, tests (`outils/logique.js` : une partie gagnée, une perdue, les lettres doubles, la reprise de la partie du jour), artefact (**lien à demander** à l'utilisateur avant de le créer).
- Point d'accès pour les tests : `window.MotDor` (état, `evaluate`, mot du jour d'une date, saisie).

## 11. Questions ouvertes
1. **Entraînement** non classé après la partie du jour (bouton AUTRE MOT) : oui ou non ?
2. **Dictionnaire des essais** : refuser les mots inconnus (il faut une grande liste libre, § 4) ou tout accepter ? Recommandé : refuser, sinon on peut tester AEIOUS. Plan B si la liste n'est pas téléchargeable : une liste plus courte écrite et relue à la main (≈ 3 000 mots), et on accepte aussi tout mot de 6 lettres d'au moins 2 voyelles ?
3. **Classement du jour** : seulement le nombre d'essais, ou départager les égalités au temps mis ?

## 12. Découpage
Une session (opusplan) si la liste se télécharge : 1) `mots.js` et son outil, 2) le jeu d'après la maquette 2, 3) intégration et tests. Sinon deux sessions, la première pour les listes de mots.

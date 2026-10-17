# Odyssée — cahier des charges

Jeu de « bille » à pencher, où la bille est le bateau d'Ulysse qui rentre de Troie à Ithaque. Issu de l'idée « La Bille » (IDEES.md, jeux 3D).

## 1. Décisions (16-17/10)
- Quatre maquettes ont été faites (`maquettes/bille.html`, `bille-2.html`, `bille-3.html`, `ulysse.html`). L'utilisateur a jugé le labyrinthe en bois « vu et revu » et voulait plus original : c'est lui qui a proposé le bateau d'Ulysse.
- **Choix du 17/10 : style C de `maquettes/ulysse.html`, « la mer Égée en 3D »** (https://claude.ai/artifact/9R5GyRcv7FDCaUvpneu3ML), et **la liste des 10 épisodes** ci-dessous.
- Nom : **Odyssée**, dossier `odyssee/`.

## 2. Direction artistique (style C)
- Low poly ensoleillé, ombrage à facettes (`flatShading`), Three.js r128 (`lib/three.min.js`, script classique), vue de trois quarts : caméra à `(0, 18.5, 10.5)`, champ de 50°, qui vise le centre du plateau.
- Mer turquoise qui ondule (plan découpé en facettes, sommets animés par des sinus), fond plus sombre dessous. Falaises de rochers beiges le long des murets, petites maisons blanches à coupoles bleues. Récifs gris pointus entourés d'écume blanche qui palpite.
- Galère : coque brune, voile blanche, huit rames, œil peint sur la proue. Elle tangue, se tourne dans le sens de sa course et tournoie quand elle sombre.
- Arrivée : Ithaque, une île avec un temple blanc.
- Textes en Fredoka (déjà dans `polices/`), blancs avec une ombre bleue. En haut : temps, nom de l'épisode (« CHANT IX · LE CYCLOPE »), naufrages.
- Chaque épisode a sa propre lumière (aube, plein jour, orage, crépuscule, nuit) et son décor propre (Polyphème derrière sa falaise, rochers des sirènes…).
- Accueil : cartouche de la famille `3d` (boîtier de CD bonbon), comme Empilage.

## 3. Contrôles
- **Inclinaison du téléphone** (`deviceorientation` : `gamma` donne la gauche et la droite, `beta` l'avant et l'arrière). La position du téléphone au départ de chaque plateau sert de « plat ». Bouton pour recalibrer. Sur iOS, la permission se demande au premier toucher.
- **Repli au doigt** quand il n'y a pas de capteur : on fait glisser le doigt depuis le point touché, à raison d'environ 70 px pour la pente maximale.
- Pente bornée à 0,2 rad. Le plateau suit la pente demandée en douceur (lissage d'environ 0,1 s).

## 4. Physique (réglages de la maquette, à garder comme point de départ)
- Plateau de 8 × 12 cases. Bateau de rayon 0,28. Murets épais de 0,25, modélisés comme des rectangles alignés sur les axes.
- Accélération = pente × 22. Frottement de l'eau : 1,4 par seconde. Rebond sur les murets : 0,4. Quatre sous-pas par image (dt plafonné à 50 ms).
- Naufrage dans un récif quand le centre du bateau passe à moins de 0,34 du centre du récif. Tourbillon : aspiration et rotation dans un rayon de 1, naufrage à moins de 0,22. Après un naufrage, on repart au départ du plateau (ou au dernier phare, voir § 6).
- **Moteur pur dans `odyssee/regles.js`** : physique, plateaux, épisodes, étoiles. Pas de DOM, pour qu'il soit testable sous Node, comme `lune-rover/regles.js` et `ile/regles.js`. Le rendu Three.js et les contrôles vont dans `odyssee/index.html`.

## 5. Les 10 épisodes (× 3 plateaux = 30)
| # | Épisode | Mécanique |
|---|---|---|
| 1 | Troie | Apprendre à naviguer ; au 3ᵉ plateau, des flèches enflammées tombent (ombre au sol puis impact) |
| 2 | Les Lotophages | Champs de lotus qui ralentissent le bateau (frottement fort par zones) |
| 3 | Polyphème | Le Cyclope lance des rochers là où va le bateau : ombre qui grossit en 1,3 s, puis impact (rayon 0,6). Déjà dans la maquette |
| 4 | Éole | Bandes de vent qui poussent le bateau (zones de force) ; au dernier plateau, l'outre s'ouvre et les vents tournent |
| 5 | Circé | L'équipage est changé en cochons : bateau lourd (plus d'inertie, accélération plus faible) ; ramasser l'herbe *moly* lui rend sa légèreté |
| 6 | Les Enfers | Nuit noire : seule la lanterne du bateau éclaire autour de lui ; les récifs se découvrent en s'approchant |
| 7 | Les Sirènes | Leur chant attire le bateau vers leurs rochers ; « cire dans les oreilles » : un bouton qui annule l'attraction quelques secondes (jauge) |
| 8 | Charybde et Scylla | Tourbillons qui aspirent, et têtes de Scylla qui jaillissent à intervalles (rides d'alerte 1,3 s, puis frappe 0,9 s). Déjà dans `maquettes/ulysse.html` (style A, à refaire en style C) |
| 9 | Calypso | Courants circulaires autour de l'île : il faut trouver la sortie |
| 10 | Ithaque | Grand plateau final, tous les dangers mêlés |

- Une ligne de récit avant chaque épisode, par exemple « Le vent nous mena chez les Cyclopes… ».
- La carte de l'Égée sert de menu des plateaux : le trajet de Troie à Ithaque se dessine au fur et à mesure.

## 6. Plateaux, étoiles, progression
- Format proposé : chaque plateau est une **petite carte en texte** (une grille de demi-cases pour les murets, des lettres pour les récifs, le départ, Ithaque et les objets de l'épisode), plus une liste de réglages propres à l'épisode (zones de vent, cadence des rochers…). Taille variable autorisée, la caméra recule pour les grands plateaux.
- **Pilote automatique** : une liste de points de passage par plateau. Il sert à la démo de l'écran titre et aux tests, qui vérifient que chaque plateau est faisable et mesurent un temps de référence (comme le solveur de Lune-Rover).
- Trois étoiles : ★ arriver, ★★ sans naufrage, ★★★ sous le temps cible (temps du pilote + marge).
- Les phares, à partir de l'épisode 4, sont des points de reprise sur les grands plateaux.
- Sauvegarde dans `localStorage`, préfixe `odyssee.` (étoiles par plateau, meilleur temps, épisode atteint).

## 7. Plateau du jour et classements
- Un **plateau du jour**, tiré d'une graine construite sur la date (un plateau fabriqué par un générateur ou choisi parmi des variantes), le même pour toute la famille. **Une seule tentative classée, comptée dès le départ** (règle des missions, comme `alunissage.dailyTry`) : `odyssee.dailyTry`. Classement au temps (`daily:AAAAMMJJ`, le plus bas gagne, naufrages = pénalité de temps à définir).
- Classement du total d'étoiles. Suivre la liste de contrôle « Ajouter un nouveau jeu » du mémo (`ludo-scores.js`, `RANKS`, `SYNC`, transfert `collectSaves`/`mergeSaves`, `sw.js`).

## 8. Plan de travail proposé
- **Session 1** (opusplan ou Opus) : `regles.js` (physique, format des plateaux, pilote), rendu style C, contrôles, épisodes 1 à 4 (12 plateaux), menu en carte, étoiles, sauvegarde, outil de test `outils/odyssee.js`.
- **Session 2** : épisodes 5 à 10 (18 plateaux), récit, plateau du jour, classements, intégration à l'accueil (cartouche `3d`, `GAMES`, `RANKS`, transfert), artefact.
- Plus tard : sons (vagues, rames, plouf, chant des sirènes), musique.

## 9. Points à confirmer sur le téléphone
- Sensibilité de l'inclinaison, calibration, et fluidité de la mer animée avec la physique sur un Android moyen.

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
- Difficulté des 12 premiers plateaux (surtout 3-3, « La colère du Cyclope ») et temps cibles.

## 10. Bilan de la session 1 (17/10)
Fait : `odyssee/regles.js` (moteur pur, objet `ODY`, chargé aussi par Node), `odyssee/index.html` (rendu Three.js style C, contrôles, écrans, carte), épisodes 1 à 4 (12 plateaux), étoiles, sauvegarde, `outils/odyssee.js` (lancé par `verifications.js`), test de fumée, `sw.js` (v33).

Décisions et écarts au cahier des charges :
- **Format des plateaux** : la carte en texte est **encadrée** (`+-+-+` en haut et en bas, `|` à gauche et à droite), ce qui permet d'indenter le texte dans le code. Lignes impaires : les cases séparées par ` ` ou `|` (muret vertical) ; lignes paires : ` ` ou `-` sous chaque case (un `+` sur une case compte aussi comme muret). Cases : `.` mer, `D` départ, `I` arrivée, `X` récif (centre de la case), `L` lotus, `P` phare, `> < ^ v` vent. Les murets sont fusionnés en lignes droites (`map.murs`, `map.boites`).
- **Pilote automatique** : au lieu d'une liste de points écrite à la main (trop d'erreurs), l'**itinéraire est calculé** (`ODY.itineraire`) : plus court chemin sur une grille de 0,25 case loin des murets et des récifs, 5 fois plus cher dans les lotus, moins cher avec le vent, puis simplifié en lignes droites. Un plateau peut encore imposer `chemin: [[x, y], …]`. Le pilote ne passe au point suivant que s'il le voit ; contre les flèches et les rochers, il essaie 35 caps en simulant vraiment le bateau jusqu'à l'impact.
- **Temps cible** (★★★) = temps du pilote × 1,3 + 3 s, arrondi ; `outils/odyssee.js` vérifie qu'il reste entre « pilote + 1 s » et « pilote × 1,6 + 5 s » et conseille une valeur.
- **Étoiles en escalier** : ★ arrivé, ★★ sans naufrage, ★★★ sans naufrage **et** sous le temps cible.
- Le temps court aussi pendant un naufrage (0,8 s de plus que le retour au départ ou au dernier phare). Après une reprise, les projectiles en vol sont annulés et le bateau clignote 0,8 s sans pouvoir être touché.
- **Dangers** : flèches enflammées (1-3) qui visent autour du bateau (`fleches: { cadence, alerte, rayon, ecart }`) ; rochers de Polyphème (épisode 3, `rochers: { attente, vol, rayon, avance }`, plus doux en 3-1 qu'en 3-3, un peu de hasard sur la visée) ; lotus (frottement 6 au lieu de 1,4) ; vent par case (`vent:` force, 3 à 3,5 : on peut encore remonter le vent, à 4,4 de pente maximale) ; outre (`outre: 5` : les vents tournent d'un quart de tour toutes les 5 s, les traits clignotent et l'outre s'agite la dernière seconde). Phares sur 4-2 et 4-3.
- Lumières : aube (Troie en flammes, cheval de bois), jour (Lotophages : plage et palmiers ; Polyphème), vent (Éole : île flottante au rempart de bronze, outre, nuages), orage (4-3, avec éclairs). Un plateau peut avoir sa propre `lumiere`.
- **Écran bloqué en portrait pendant la partie** (demande de l'utilisateur, 17/10) : au départ d'un plateau, plein écran puis `screen.orientation.lock('portrait-primary')` (Chrome ne bloque qu'en plein écran) ; la carte et le titre sortent du plein écran. Si l'écran passe quand même en paysage (sortie du plein écran), la partie se met en pause avec « Remets le téléphone droit ». Le manifeste garde `orientation: any` (la colonie est en paysage).
- Contrôles : inclinaison × 1,2 (pente maximale vers 9,5° d'inclinaison du téléphone), position de départ = « plat », bouton ⟲ À PLAT ; doigt (70 px = pente maximale) ; flèches du clavier sur ordinateur.
- Carte de l'Égée : SVG dessiné par le code (10 escales, trajet en pointillés, trait plein jusqu'à l'épisode atteint, galère sur la dernière escale) ; toucher une escale ouvre son volet (récit et 3 plateaux, étoiles, record). Plateau suivant ouvert dès que le précédent a au moins une étoile.
- Écran titre : le pilote joue les plateaux les uns après les autres derrière le titre.

Reste pour la session 2 : épisodes 5 à 10 (`lumiere` crépuscule et nuit, lanterne, moly, sirènes et bouton « cire », tourbillons et Scylla, courants de Calypso), plateau du jour, classements, accueil (cartouche `3d`), transfert, artefact. Plus tard : sons.

## 11. Bilan de la session 2 (17/10)
Fait : épisodes 5 à 10 (18 plateaux, 30 en tout), plateau du jour, classements, accueil (cartouche `3d`, icône `galere`, volet, `RECS`, `RANKS`, `META`, `NEWS`), transfert `LUDO1-`, `ludo-scores.js` (`registerExisting`, `PSEUDO_BOARDS`, `SYNC` 14).

Mécaniques ajoutées dans `regles.js` (cases et réglages) :
- **Circé** (`lourd: true`) : bateau lourd (accélération × 0,5, frottement × 0,75, cochons sur le pont) ; `M` herbe moly (le rend léger, disparaît) ; `C` coupe de Circé (le rend lourd de nouveau). Le pilote passe d'abord par la moly la plus proche (point obligatoire de l'itinéraire) et évite les coupes.
- **Enfers** : lumière `nuit` (presque noire) ; la lanterne du bateau (lumière ponctuelle de 3,4 cases) éclaire les récifs ; écume, lotus et vents passent en matière éclairée la nuit ; torche au port, phares qui éclairent une fois allumés. Le Styx = courants (`vent: 2.5`).
- **Sirènes** (`S`) : attirent dans un rayon de 3,2 (force 4,2 au plus, décroissante) ; contact = naufrage. **Cire** : bouton (jauge), 3 s sans attraction, recharge en 7 s. Le pilote met la cire quand le chant tire fort.
- **Charybde** (`O`) : aspiration et rotation dans un rayon de 1 (force 7), naufrage à moins de 0,22. **Scylla** (`Y`) : cycle de 3,4 s (rides et zone rouge 1,3 s, frappe 0,9 s, rayon 0,8), décalé de 1,7 s d'une tête à l'autre. Le pilote voit les frappes à venir comme des dangers dans le temps et attend son tour.
- **Calypso** (`courant: true`) : les flèches de vent dessinées en courants bleus ; on part **dans** l'anneau de courants autour de l'île, la sortie est en amont du courant. Les cases qu'on ne peut pas atteindre (dans une île entourée de murets) sont dessinées en terre (sable, herbe, palmiers).
- **Ithaque** : flèches des prétendants, rochers de Poséidon, puis le plateau final avec vents, lotus, Sirènes, Scylla, tourbillon et deux phares.
- Lumières ajoutées : `crepuscule` (Circé), `nuit` (Enfers), `soir` (Ithaque) ; décors : palais de Circé et son chaudron, falaises noires et ombres des Enfers, île fleurie des Sirènes, falaises du détroit, grotte et palmiers d'Ogygie, palais d'Ulysse et oliviers.
- Marges de l'itinéraire réduites près des Sirènes (0,3) et des tourbillons (0,8) : le pilote compense leurs forces (et le vent) ; sinon un couloir de 3 cases était bouché.

**Plateau du jour** : `ODY.jour(AAAAMMJJ)` tire un plateau (sauf 1-1 et 1-2) et, une fois sur deux, le retourne gauche-droite (`variante`) ; les dangers tirent avec la graine de la date, donc les mêmes pour toute la famille. Pas de retournement haut-bas (décor toujours en haut ; 1-2 et 9-2 devenaient impossibles). Score = temps + 5 s par naufrage (`scoreJour`), une seule tentative classée, comptée dès le départ (`odyssee.dailyTry`, règle des missions). `outils/odyssee.js` vérifie que les 28 plateaux du tirage restent faisables en miroir.

Reste : essai sur le téléphone, classement avec un vrai record, sons et musique (plus tard). Pas d'artefact (décision de l'utilisateur, 17/10) : on joue sur le site.

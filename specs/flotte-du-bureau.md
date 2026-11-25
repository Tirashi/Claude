# Flotte du bureau — cahier des charges (nom provisoire)

Chantier ouvert le 25/11 : incrémental de flotte spatiale qu'on regarde travailler, inspiré de *Desk Space: Idle Spacefleet clicker* (Shotgun Anaconda, Steam, 30/06/2026, 5,99 $). On ne copie pas tout : l'utilisateur veut s'inspirer, pas suivre le jeu de base.

## 1. Ce qu'on a appris du jeu d'origine (page Steam, API de la boutique, 22 annonces de l'éditeur)
- **Principe** : jeu pensé pour un deuxième écran, surnommé « l'aquarium spatial » ; campagne de ~5 h où chaque prestige (surtout le deuxième et après) ajoute des complications, puis mode infini. 14 succès, Steam Cloud, 67 % d'avis positifs sur 137.
- **Boucle** : on achète des ships (mineurs → minerai, marchands → crédits, cargos → métal, drones…) qui volent seuls avec leurs trajectoires dessinées ; améliorations (efficacité, prix, cargaison) qui se combinent ; prérequis comptés en nombre de ships.
- **Flux de revenus dosables** : commerce et minage passifs ; minage à la main (un astéroïde miné a une chance de monter d'un cran de rareté) ; **Bourse** (frais seulement à la vente) ; **expéditions** (temps limité, risque de perdre les ships, bonus temporaire pour le reste de la flotte ; récompense = revenu par seconde de chaque ship envoyé).
- **Raffineries** posées à la main : minerai → métal, curseur de répartition.
- **Signal Ranges** (SR1 à SR5) : zones de plus en plus lointaines, nouveaux produits et dangers.
- **Pirates** : attaquent les convois ; un ship vaincu est en réparation 15 s ; des pirates « du joueur » chassent les leurs et sauvent les civils ; **tableau de primes**.
- **Prestige** : la **singularité** remet l'univers à zéro et donne une amélioration permanente ; chaque prestige ajoute de la **corruption et des trous noirs** qu'on nettoie avec des Void Cleansers (consomment du métal). Une partie des règles est cachée volontairement.
- **Mode infini** : barre de Maîtrise (XP) → points pour une grille d'environ 17 améliorations ; chaque singularité donne un multiplicateur d'XP mais rend la corruption plus dure.
- **Fleet Fusion** : 100 ships fusionnés en 1 super-ship (compté comme 100 pour les prérequis).
- **Mode cinéma** : après 2 min d'inactivité, l'interface s'efface, la caméra suit des ships au hasard.
- **Leçons de l'éditeur** : la performance a été le gros problème (trajectoires dessinées : GPU, un seul appel, détail réduit au dézoom, option pour les couper) ; les joueurs s'arrêtaient après le premier prestige (rappels ajoutés) ; pirates inutiles au début, métal mal équilibré, expéditions vite dépassées, interface incohérente.
- **Limites de cette analyse** : avis des joueurs non lus (API bloquée), pas de chiffres d'équilibrage, mécaniques cachées inconnues.

## 2. Propositions de la maquette 1
Gardé : flotte autonome visible + mode cinéma ; plusieurs flux de revenus ; prestige par friction ; fusion de 100 en 1.
Changé : téléphone d'abord (aussi laissable ouverte sur PC) ; zones en carte à explorer ; pirates utiles dès le début (primes, épaves) ; défi du jour classé (fortune en 10 min, flotte imposée).
Laissé de côté pour le premier jet : matrice de 17 améliorations, trois thèmes d'interface, Bourse.

## 3. Maquettes
- **Maquette 1** (25/11, [artefact](https://claude.ai/artifact/VLJwho7bw6e7F2SC2atptJ), `maquettes/flotte-du-bureau.html`) : trois téléphones jouables avec la même simulation (mineurs, marchands, patrouille, un pirate de passage, mode cinéma) : **A Radar** (vectoriel), **B Aquarium** (lumière douce, traînées), **C Pixel 32 bits** (seule direction rétro). **Retours du 25/11** : direction C (pixel) écartée (« je n'aime pas trop la vue toute pixellisée ») ; A radar « pourquoi pas » mais B aquarium préférée ; B à enrichir (couleurs, formes, trajectoires, orbites lentes mais présentes).
- **Maquette 2** (25/11, [artefact](https://claude.ai/artifact/DgpcqGUi6Abh3VWGPijGQo), `maquettes/flotte-du-bureau-2.html`) : aquarium détaillé (étoile, 3 planètes dont une géante à anneaux, lune, ceinture d'astéroïdes, station qui tourne, orbites lentes, vaisseaux à formes et teintes variées, trajectoires courbes vers des destinations mobiles), surcouche **radar** optionnelle (bouton), version **PC** 16 : 10 avec panneau (flotte, Veille). Retours du 25/11 (après la maquette 2) : « pas assez fin, l'écran est vite plein alors qu'il n'y a pas grand-chose » ; la colonisation doit « apparaître naturellement » en exploitant des ressources de plus en plus loin ; pas de classement.
- **Maquette 3** (25/11, [artefact](https://claude.ai/artifact/S2fwrAwaLCVQpDryLeq93h), `maquettes/flotte-du-bureau-3.html`) : vaisseaux deux fois plus petits, traits et halos plus fins, astres réduits ; amélioration **Portée** (4 niveaux) qui ouvre une zone (fer, glace, cristal, iridium), pose un **avant-poste** tout seul et **dézoome** la carte ; minerais de plus en plus rentables mais trajets plus longs ; boutons ×10 et +1000 pour tester la densité. **En attente de validation.**
- **Retours du 25/11 (après la maquette 3)** : ralentir encore planètes et vaisseaux ; rendu à approcher de **captures du jeu d'origine** envoyées par l'utilisateur (carte presque nue, astres en petits points nommés avec leur production, routes pointillées, anneaux de portée, fenêtres « Fleet Command » en haut à gauche et « Engineering » en haut à droite, console en bas à gauche, zoom en % en bas à droite, fiche d'un navire avec son pilote ; trois thèmes bleu, violet, vert phosphore).
- **Maquette 4** (25/11, [artefact](https://claude.ai/artifact/Sc99T6iuxW64J8DGaAzaUT), `maquettes/flotte-du-bureau-4.html`) : carte épurée à ce modèle (sans rien reprendre de ses graphismes), trois ambiances (nuit bleue, violette, phosphore), fenêtres flottantes repliables (Flotte : crédits, navires, quantité ×1 / ×10 / ×100 / max ; Ingénierie : moteurs, soute, portée du signal, veille ; Console système), zoom, fiche d'un navire au toucher, détail des vaisseaux visible en zoomant ; orbites ~2× plus lentes, vaisseaux ~1/3 plus lents ; PC en 16 : 9 et téléphone. **En attente de validation.**

## 4. Décisions de l'utilisateur (25/11)
- **Gains appli fermée** : une **fraction** des gains du jeu ouvert ; une amélioration de prestige augmente cette fraction (proposé : 25 % de base, +5 points par niveau, 75 % au maximum ; à valider).
- **Le jeu doit bien passer sur PC** (écran large, panneau, clavier plus tard).
- **Pas de vue pixellisée.** Base : aquarium ; le radar reste une surcouche au choix.
- **Colonisation naturelle** (25/11) : pas de mode séparé ; elle vient de l'exploitation de ressources de plus en plus loin. Le jeu d'origine n'a pas de colonisation (Signal Ranges SR1 à SR5, Engine Overclock, trous de ver ; sous réserve de ce qu'on a lu). Dans la maquette 3 : la portée ouvre zones et avant-postes, la carte dézoome ; au prestige, on pourrait repartir avec une portée de départ plus grande. Plusieurs systèmes : pas retenu pour l'instant.
- **Pas de classement** (25/11).
- **Rendu** : aquarium fin (voir maquette 3) ; le radar reste une surcouche au choix.

## 5. Questions ouvertes
1. Le rendu de la maquette 4 convient-il (manque, trop) ?
2. Une ambiance de couleurs ou un choix dans les réglages ?
3. Vitesse des vaisseaux et des orbites maintenant ?
4. Quatre niveaux de portée avant le prestige ; ressources fer, glace, cristal, iridium ?
5. Pourcentage de veille (25 % à 75 %) ?
6. Prestige : quel thème (relancer une galaxie, léguer sa flotte) ?

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
- **Maquette 2** (25/11, [artefact](https://claude.ai/artifact/DgpcqGUi6Abh3VWGPijGQo), `maquettes/flotte-du-bureau-2.html`) : aquarium détaillé (étoile, 3 planètes dont une géante à anneaux, lune, ceinture d'astéroïdes, station qui tourne, orbites lentes, vaisseaux à formes et teintes variées, trajectoires courbes vers des destinations mobiles), surcouche **radar** optionnelle (bouton), version **PC** 16 : 10 avec panneau (flotte, Veille). **En attente de validation.**

## 4. Décisions de l'utilisateur (25/11)
- **Gains appli fermée** : une **fraction** des gains du jeu ouvert ; une amélioration de prestige augmente cette fraction (proposé : 25 % de base, +5 points par niveau, 75 % au maximum ; à valider).
- **Le jeu doit bien passer sur PC** (écran large, panneau, clavier plus tard).
- **Pas de vue pixellisée.** Base : aquarium ; le radar reste une surcouche au choix.
- **Colonisation de système en système** (idée de l'utilisateur, avec technologies de vitesse et de portée) : le jeu d'origine n'en a pas (il avance par Signal Ranges SR1 à SR5, Engine Overclock, trous de ver ; sous réserve de ce qu'on a lu). Variante proposée : chaque système est un aquarium ; la propulsion ouvre les systèmes lointains ; le prestige ramène au système de départ. À confirmer.

## 5. Questions ouvertes
1. La colonisation de système en système devient-elle le cœur de la progression ?
2. L'aquarium de la maquette 2 convient-il (taille des vaisseaux, orbites, couleurs) ?
3. Le pourcentage de veille (25 % à 75 %) ?
4. Prestige par singularité comme l'original, ou autre thème ?
5. Classement (fortune en 10 min) ou aucun ?

# Tank Arena (cahier des charges)

Idée de l'utilisateur du 17/11 : « un petit jeu de tank » avec le pack **Low Poly Tank Assets** de dani567 (gratuit, crédit non exigé ; crédité quand même).

## Maquette (17/11)
[Artefact](https://claude.ai/artifact/RrYgj4sR5g9ZuoXRpwTPqh), source `maquettes/tanks.html` (+ `outils/tanks-maquette/`). Trois directions jouables : **A arène** (temps réel), B artillerie (tour par tour, vent), C damier (tactique 9 × 9). **Direction A choisie** le 17/11.
- Le pack est une seule scène Blender : `outils/tanks-maquette/extrait.py` la découpe (tank simplifié par regroupement de sommets, 66 000 → 4 600 triangles ; obus ; caisse ; arène ; sol au damier) et relève les obstacles (coupe à 13 cm du sol, rayon, hauteur). Le `.mtl` est tout gris : couleurs reprises des images du pack.
- Le tank du pack est d'un seul bloc : depuis le 17/11 (retour de l'utilisateur), `extrait.py` coupe la **tourelle** (triangles au-dessus de 27 cm) avec son pivot (`pivot`, milieu du bas de la tourelle) ; dans le jeu, la tourelle tourne vers la cible (6 rad/s), le tir part quand elle est alignée (à 0,12 rad près) et l'obus sort du bout du canon (`CANON`, `HAUT_CANON`).

## Décisions de l'utilisateur (17/11)
- Nom : **Tank Arena**. Dossier `tank-arena/`.
- Première version : **manche libre** seulement ; **survie** ajoutée le 18/11 (pas d'équipes ni de défi du jour pour le moment).
- Bonus de la caisse : **réparation** (+50 PV), **tir triple** (8 s), **bouclier** (6 s), **vitesse** (×1,6, 8 s).

## Règles (version 1)
- Toi (rouge) contre 3 tanks de l'ordinateur (vert, violet, jaune), chacun pour soi, **90 s**, compte à rebours 3-2-1.
- 100 PV, un obus = 20 ; détruit : retour 3 s plus tard au coin le plus éloigné des autres, 1,5 s d'invulnérabilité.
- La coque suit la direction de la marche ; la **tourelle vise la cible** indépendamment et revient dans l'axe sans cible.
- Commandes : glisser le doigt n'importe où (joystick qui apparaît sous le doigt) ; flèches ou ZQSD ; Échap / P = pause. Tir automatique sur l'ennemi le plus proche à moins de 5,2.
- Ordinateur : va vers le plus proche, garde 2 à 3,4 de distance en tournant autour, tire quand il est en face ; va chercher la caisse (sauf la réparation s'il a plus de 70 PV) ; se dégage quand il est coincé.
- Caisse au centre (sur la plateforme), bonus au hasard, nom et halo de sa couleur ; nouvelle caisse 7 à 10 s après.
- Fin : podium, VICTOIRE (seul en tête), EGALITE ou FIN DE MANCHE.

## Mode survie (18/11, demandé par l'utilisateur)
- Seul contre des **vagues** d'ennemis, **3 vies** (retour 2 s après, 2,5 s d'invulnérabilité) ; la partie s'arrête à la dernière vie. Score : la **vague atteinte** (puis les tanks détruits pour départager le record local).
- Vague n : 1 + n ennemis (`compoVague`), 3 à 6 à la fois sur l'arène (entrées sur les bords, loin du joueur). Types (`TYPES`), reconnaissables à la couleur et à la taille : **soldat** (violet, base), **chasseur** (vert, petit et rapide, dès la vague 3), **blindé** (jaune, gros, lent, 180 PV, obus à 35, dès la 5), **tireur** (bleu, tire de loin avec des obus rapides, dès la 7). À chaque vague : +7 % de PV, un peu plus de vitesse (+25 % au plus), cadence plus rapide (−40 % au plus), visée plus précise.
- Les ennemis ne se tirent pas dessus entre eux (camps) et ne prennent pas les caisses ; une caisse tombe à chaque vague réussie (4 s de répit), et une autre toutes les 14 à 20 s.
- Écran de fin : les tanks détruits par type, la vague, le record.

## Sauvegarde et classement
`tankarena.best` (meilleure manche), `tankarena.stats` {parties, victoires, total}, `tankarena.survie` {vague, kills, parties}, `tankarena.options` {sons}. Classements `tankarena` / `best` et `tankarena` / `survie` (vague atteinte ; le plus haut gagne). Transfert `LUDO1-` : les trois premières clés.

## Pistes pour la suite
Par équipes, défi du jour (graine), niveaux de l'ordinateur, autres arènes (avec les rochers, sapins et pierres du pack), choix de la couleur, musique.

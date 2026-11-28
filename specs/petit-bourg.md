# Petit Bourg (nom provisoire) — cahier des charges

Idée de l'utilisateur du 28/11 : un jeu de routes à la Mini Motorways, **pour sa femme** (téléphone, très épuré, interface facile à prendre en main), en se distinguant du vrai jeu. Direction retenue le 28/11 : **les besoins du village** (idée B des variantes). Nom à trouver.

## Maquettes
- [Maquette 1](https://claude.ai/artifact/456sVYrQvmnSRSiUsShN3H) (`maquettes/mini-motorways.html`) : la finition validée (« c'est totalement l'idée ») en trois ambiances : Prairie pastel, Désert, Soirée. Mise de côté car trop proche de Mini Motorways. Les versions pixel art et plates ont été refusées (« pas de 32 bits », « pas le rendu que je cherche »).
- [Variantes](https://claude.ai/artifact/PAYUfB6SmKRzDMyNNKcNHt) (`maquettes/mini-motorways-variantes.html`) : A les collines, **B le village**, C les saisons. B retenue ; A (relief, tunnels) et C (saisons) restent des idées pour plus tard.
- [Écrans clés](https://claude.ai/artifact/87yRv5Bv25FoEn6ugc3M5m) (`maquettes/village-ecrans.html`) : en partie, fiche d'une maison, fin de semaine.

## Finition visuelle (validée)
Fond clair, grandes taches douces, **blocs en relief avec ombres longues**, **routes blanches** à liseré gris et coins arrondis, rivière et ponts, boutons losanges sombres avec icône sobre, compteur et libellé. Aucune pixelisation. Police Outfit. Ambiances au choix plus tard (clair, désert, soirée).

## Ce qui distingue le jeu de Mini Motorways
Pas de couleurs à assortir : **les maisons sont neutres et ont des besoins** (pain, livres, fleurs, café, marché, soins…), montrés par des bulles à pictogrammes. Une maison doit pouvoir atteindre **au moins un commerce de chaque sorte demandée**. Un commerce sert un nombre limité d'habitants à la fois (file d'attente) : un village qui grandit en demande un deuxième.

## Boucle de jeu (première idée)
- Un **village** posé sur une carte (rivière, lac, parcelles). Au départ : 3 maisons et 2 commerces.
- Le temps avance par **jours** et **semaines** (7 jours, un tour d'horloge). Des maisons et des commerces apparaissent au fil du temps, aux bords du village.
- Chaque maison a **1 à 3 besoins**. Un besoin « se réveille » à intervalles (certains à des heures précises : pain le matin, café l'après-midi, fleurs le week-end). Un habitant part alors vers le **commerce du bon type le plus proche** par la route.
- Si aucun chemin n'existe, ou si la file est trop longue, l'**anneau de patience** de la bulle se remplit. Anneau plein = habitant mécontent, la **jauge de bonheur** du village baisse.
- Un trajet réussi rapporte un habitant content (score). La jauge remonte lentement quand tout va bien.
- **Fin de semaine** : bilan, puis **choix d'une carte parmi deux** : un nouveau commerce (café, marché, soins, école…) ou du matériel (routes, ponts, ronds-points, sens uniques, feux).
- Fin de partie : jauge de bonheur à 0. Un **mode Zen** (jamais de défaite, on joue pour le plaisir) est à envisager pour elle.

## Interface (téléphone, portrait)
- **Tracer** : glisser le doigt d'un bâtiment vers un autre, ou de route en route. Les routes se placent sur une grille invisible, coins arrondis automatiques. **Gomme** : toucher une route. Pas de menu caché : tout est dans la barre du bas.
- **Barre du bas** : Routes (stock), Pont, Rond-point, Sens unique, Feu, avec pastille de compteur et libellé. Le bouton actif est mis en avant.
- **Toucher une maison** : fiche en bas d'écran (besoins, patience, trajet, bouton « Relier au… » qui propose un tracé).
- **Haut de l'écran** : jauge de bonheur, habitants contents, jour, horloge, pause. Un appui sur l'horloge accélère le temps.
- Aide : premières semaines guidées par un petit texte au-dessus de la barre, jamais plus d'une consigne à la fois.

## Technique prévue
- Dossier `petit-bourg/`, scripts classiques, rendu **Canvas 2D** (ou SVG pour la carte, à trancher au prototype). Pas de build.
- **Graphe des routes** par cases ; plus court chemin par BFS ou Dijkstra (poids des ponts et des feux) ; recalcul quand on pose ou efface une route.
- Habitants et véhicules : petits éléments qui suivent le chemin, vitesse dépendant des feux, ronds-points et files.
- **Carte** : à décider (fixe à la main, ou générée à partir d'une graine). La graine permet le **défi du jour** (même village pour tous, une tentative par jour, score classé) avec `ludo-scores.js`.
- Fiche `fiche.js`, étiquette et jaquette faites avec le jeu (règle du projet), `sw.js`, crédits (aucun asset externe pour l'instant : tout est dessiné par le code).

## Questions ouvertes
1. **Défaite ou zen** : jeu avec défaite, mode zen sans défaite, ou les deux ?
2. **Carte fixe ou générée** à chaque partie ; défi du jour avec classement ?
3. Les **véhicules** : voitures, vélos, charrettes selon le besoin ? ou petits habitants ?
4. Nom du jeu, ambiance par défaut (clair, désert, soirée).
5. Quels **commerces** au tout début (pain, livres, fleurs) puis lesquels dans les cartes.

## Étapes
1. Valider les écrans clés (maquette) et les réponses ci-dessus.
2. Prototype : carte fixe, routes au doigt, 3 besoins, jauge, file d'attente (dans `petit-bourg/`, démo).
3. Semaines, cartes de fin de semaine, matériel (ponts, ronds-points, sens uniques).
4. Fiches de maison, aide guidée, sons, étiquettes ; défi du jour et classements si souhaités.

# Picross Dex — références graphiques

Picross Dex est l'un des tout premiers jeux de la Ludothèque (avant les fiches, `specs/`, etc.) : il n'a pas de cahier des charges d'origine. Ce fichier garde les **images de référence** données par l'utilisateur (25/11) pour s'en inspirer.

## Références (dans `specs/picross/`)
- `reference-sprites-1.gif` (600×600) : planche de mini-sprites 1re/2e génération, palette réduite (orange, rouge, bleu, brun, noir sur fond vert pâle pointillé), plus les 28 formes de Zarbi en bas.
- `reference-minidex-001-251.gif` (509×472) : « MINIDEX 001-251 », mêmes sprites numérotés de 001 à 251. Crédits indiqués sur l'image : Chamber, Solo0993, Blue Emerald, Lake, Neslug, Pikachu25.

- `reference-gold-silver-sheet.png` (624×2048, ajoutée le 25/11) : planche des sprites Or / Argent en couleurs (normal, chromatique, gris), réduite : on y lit bien les **couleurs et la forme générale** de chaque Pokémon, pas les détails fins. Sert à choisir la palette et à retoucher les têtes.

- `reference-gold-silver-sheet-grande.png` (1711×5609, 25/11) : la même planche **en pleine taille** : sprites de 56×56 nets, avec la version grise. C'est la référence à utiliser pour les formes ; la petite version ne sert plus.

## Ce qu'on en retient
- Sprites d'environ 16×16 en 4 ou 5 couleurs, silhouette lisible, contour noir.
- Les dessins actuels (`picross/dessins.js`) font 10×10 : à comparer avant toute refonte des dessins.

## À savoir
- Ces images sont des **références seulement** : rien n'en est repris dans le jeu. Si on en reprend des sprites un jour, les citer dans `credits/index.html` (règle du 22/10) et vérifier la licence.
- Refaire les graphismes d'un jeu = maquette d'abord, validée par l'utilisateur (règle du 16/10).

## Finir le Pokédex de Johto (25/11)
Il manque 45 dessins en 15×15 : n° 201 à 242 et 246 à 248. Maquette de comparaison des méthodes de conversion (Cizayox n° 212, 5 versions) : [`maquettes/picross-dessins.html`](../maquettes/picross-dessins.html), [artefact](https://claude.ai/artifact/6cySj6KeDC7Dvw2r1bR6rK). Le choix de l'utilisateur sera noté ici.

## Méthode retrouvée (25/11)
Les 46 Pokémon de Johto déjà faits sont le sprite du Minidex 16×16 **moins une rangée et une colonne**, puis recolorés à la main avec la palette du jeu (8 retouchés). Pour les 45 restants : retirer la rangée et la colonne qui abîment le moins le contour, recolorer d'après la vraie couleur du Pokémon (planche Or / Argent), retoucher à la main si illisible (ex. tête de Steelix refaite). Livraison par lots de 10, montrés en image avant d'être écrits dans `dessins.js`.

## Avancement de Johto
- **Lot 1 fait (25/11)** : n° 201 à 210 (Zarbi à Granbull) écrits dans `picross/dessins.js`, cache `ludotheque-v126`. Steelix : la version issue du Minidex (les versions redessinées de tête ou de profil ont été refusées).
- **Lot 2 fait (25/11)** : n° 211 à 220 (Qwilfish à Marcacrin), cache `ludotheque-v127`.
- Reste : n° 221 à 242 et 246 à 248 (25 Pokémon), par lots de 10.

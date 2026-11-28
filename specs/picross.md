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
- **Lot 3 fait (25/11)** : n° 221 à 242 et 246 à 248 (25 Pokémon d'un coup), cache `ludotheque-v128`. **Le Pokédex de Johto est complet** (Togepi n° 175 reste dans Kanto jusqu'à l'ouverture de Johto).

## Idées de la suite (27/11, de l'utilisateur) — à valider par maquette avant de programmer
Planches de référence ajoutées dans `specs/picross/` :
- `reference-minidex-3g.png` (171×477) : **Minidex de la 3e génération**, sprites d'environ 15×15 déjà au bon format, **2 images d'animation par Pokémon** (deux rangées successives), 10 par rangée. Utilisable tel quel (couleurs à reclasser : l'image est un peu bruitée). Origine à préciser pour les crédits.
- `reference-menu-old-school.png` (500×500) : icônes de menu « à l'ancienne » en deux tons rouge / orange, pour une partie **Pokédex old school** disponible dès le début.
- `reference-badges-1g.png`, `reference-badges-2g.png` : cartes de dresseur avec les **badges** de Kanto (8) et de Johto (8 + Kanto).
- `reference-objets-emeraude.png` (496×416) : icônes d'objets de Pokémon Émeraude, pour des **picross d'objets** (section boutique, sans condition).

Pistes :
1. **Chromatiques** (rejouabilité) : taux généreux, palettes chromatiques de la planche Or / Argent (2e génération) ; un objet comme le **Charme Chroma** augmente le taux ; compteur de chromatiques dans le Pokédex.
2. **3e génération** (n° 252 à 386, 135 Pokémon) avec le Minidex 3G, par lots comme Johto.
3. **Pokédex old school** : menu simplifié, disponible dès le début.
4. **Badges** de Kanto et de Johto comme petits picross à gagner.
5. **Objets** (picross d'objets, boutique, Charme Chroma qui augmente les apparitions).

## Décisions du 27/11
- **Pas de monnaie dans le jeu.**
- **Section Boutique** : les picross d'objets, accessibles sans condition.
- **Section Arène** : les badges ; ceux d'une génération se font quand on a capturé un certain nombre de Pokémon de cette génération (seuil à fixer à la maquette).
- **Chromatiques** : taux d'apparition généreux ; le Charme Chroma est un objet de la Boutique dont le picross, une fois fait, augmente le taux (pas d'achat).
- **Sources à citer dans `credits/index.html` dès qu'on en reprend quelque chose** :
  - Minidex 3G : lien donné par l'utilisateur, <https://www.deviantart.com/eeveeee1999/art/Gen-5-GBC-Party-Sprites-807196588> (auteur eeveeee1999). Le titre de la page parle de la 5e génération : à vérifier que la planche rangée est bien celle de la 3e.
  - Badges, objets d'Émeraude, menu old school : The Spriters Resource (spriters-resource.com), page exacte de chaque planche à retrouver.
- Ordre proposé : 3e génération (Minidex 3G), puis chromatiques, puis maquette Boutique et Arène, puis Pokédex old school.

## 3e génération (Hoenn), 27/11
- Source de forme : Minidex 3G (`reference-minidex-3g.png`, lien correct : <https://www.deviantart.com/eeveeee1999/art/Gen-3-GBC-Party-Sprites-830673924>) ; planches couleur Hoenn normal et chromatique (`reference-hoenn-*.png`, A. J. Nitro, The Spriters Resource, « give credit if used »).
- **135 dessins faits** (n° 252 à 386), 15×15, tous résolubles sans deviner (11 retouchés d'une ou deux cases), rangés dans `specs/picross/hoenn-dessins.json`, **pas encore dans `dessins.js`** : le jeu range tout ce qui dépasse n° 151 dans Johto (`regionOf`), il faut d'abord un 3e onglet **Hoenn** (ouverture, légendaires : Regirock, Regice, Registeel, Latias, Latios, Kyogre, Groudon, Rayquaza, Jirachi, Deoxys).
- Aperçu : <https://claude.ai/artifact/UJXCRa1LLv43BFDC6dZkCB>. Couleurs choisies à la main d'après les vrais Pokémon (la lecture automatique des couleurs de la planche était mal alignée).
- Fichier pour reconstruire : `outils/` n'a pas de script ; la méthode est la même que Johto (sprite 16×16 moins une rangée et une colonne, recoloré).

## Fait le 27/11 : onglet Hoenn et chromatiques
- **Ordre des planches** : la planche couleur de Hoenn n'a pas Spinda dans sa grille (il est tout en bas) et a une case de plus pour Castform ; les vignettes de l'aperçu étaient décalées d'une case entre Spinda et Castform, pas les dessins (les dessins suivent le Minidex, dans l'ordre du Pokédex national).
- **Onglet Hoenn** : ouvert par la capture de Celebi ; légendaires Regirock / Regice / Registeel (10 captures à Hoenn), Latias et Latios rôdeurs comme les chiens de Johto (20), Kyogre et Groudon (30), Rayquaza (après les deux), Jirachi (100), Deoxys (tous les autres).
- **Chromatiques** : `picross/chroma.js` (id → lettres qui changent), `shinyChance()` = 0,1 ; un Pokémon chromatique se révèle avec ses couleurs spéciales, une étoile ★ marque sa case dans le Dex ; sauvegarde : drapeau `s` dans `c[id]`. Calcul : sprite normal contre sprite chromatique des planches (même forme, palette différente), décalage de teinte global puis lettre la plus proche ; teinte de remplacement (+0,45 de teinte) pour 34 Pokémon dont le chromatique est quasi identique et pour Spinda. Pas de chromatique pour Racaillou, Lamantine, Galeking et Galegon.
- Reste : Boutique (picross d'objets, Charme Chroma), Arène (badges), Pokédex old school, chromatiques des légendaires (aucun pour l'instant).

## 4e génération (n° 387 à 493), 27/11 : à décider
- **Piste 1 (préférée)** : trouver le Minidex 4G (« Gen 4 GBC Party Sprites », sans doute chez eeveeee1999 comme les 3G et 5G) ; même méthode que Hoenn.
- **Piste 2 (de secours)** : conversion automatique des sprites Platinum 80×80 de PokéAPI (`raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/platinum/<n°>.png`, version chromatique dans `.../platinum/shiny/`, joignable depuis l'environnement), puis retouches à la main par lots de 10. Essai du 27/11 : couleurs bonnes, formes bruitées pour les Pokémon complexes ; l'utilisateur le juge « pas si mal » en secours. Les couleurs chromatiques se calculent automatiquement (sprite normal contre chromatique, même méthode que `chroma.js`).
- Rien n'est stocké dans le dépôt : les sprites sont lus au moment de la conversion, seuls les dessins 15×15 sont gardés.

## Boutique faite le 27/11
- 41 objets (`shop: true`, `no: "OBJ"`), région `boutique` (toujours ouverte, onglet BOUTIQUE) ; pas d'herbes, pas de fuite, noms visibles avant résolution ; Charme Chroma (`charmechroma`, dessiné à la main) : `shinyChance()` ×2 une fois capturé.
- Reste de la planche d'objets (environ 200 icônes non identifiées : potions, baies, pierres, CT…) : à ajouter par lots, nom à vérifier à l'œil.
- Prochaine étape : Arène (badges par génération, seuil de captures à fixer), Pokédex old school.

## 4e génération : source retenue (27/11)
- Pas de Minidex 4G. Sprites Platinum 80×80 réduits à 15×15 : formes en bouillie. **Icônes de menu de la 7e génération** (`.../versions/generation-vii/icons/<n°>.png`, 40×30, pour les n° 1 à 721, joignables depuis l'environnement) : bien plus lisibles, déjà simplifiées comme un Minidex. Deux conversions comparées : A (détaillée, 15×15 par moyenne de blocs) et B (contour noir, 4 couleurs) ; choix de l'utilisateur à noter ici. Même méthode possible pour les 5e et 6e générations.
- `reference-hoenn-petits-sprites.webp` : planche Rubis / Saphir (Hoenn, normal et chromatique, avec petites icônes) « ripped by Peter Coulta » (Spriters Resource), reçue le 27/11 ; sert à vérifier les couleurs de Hoenn, pas à la 4e génération.
- `reference-sinnoh-sprites.webp` (27/11) : planche Diamant / Perle de toute la 4e génération (n° 387 à 493, mâle / femelle, normal et chromatique, formes), « Sprite Ripper : Random Talking Bush », The Spriters Resource. Ce sont les sprites en taille réelle (comme ceux de PokéAPI), pas des icônes : utile pour vérifier les couleurs et les formes, la conversion part des icônes de la 7e génération.

## Sinnoh (4e génération), lot 1 le 27/11
- **Version A choisie** (icônes de menu de la 7e génération, 15×15 par moyenne de blocs, couleurs lues sur l'icône). Dessins rangés dans `specs/picross/sinnoh-dessins.json` (lot 1 : n° 387 à 396, trois dessins retouchés d'une case pour se résoudre sans deviner), **pas encore dans `dessins.js`** : il faut d'abord un 4e onglet Sinnoh (ouverture après Deoxys ?, légendaires : Créhelf / Créfollet / Créfadet, Dialga, Palkia, Heatran, Regigigas, Giratina, Cresselia, Phione, Manaphy, Darkrai, Shaymin, Arceus).
- Aperçu : <https://claude.ai/artifact/VCwUJi4bjFvMxcYx7FYYei>. Reste 97 Pokémon (n° 397 à 493), par lots.
- **Les 107 dessins de Sinnoh sont faits** (27/11, n° 387 à 493, version A, tous résolubles sans deviner, 30 retouchés d'une ou deux cases), avec leurs couleurs chromatiques (champ `chroma`, calculé sur les sprites Platinum normal et chromatique ; 105 sur 107, pas pour Boskara ni Cheniselle) : `specs/picross/sinnoh-dessins.json`. Aperçu : <https://claude.ai/artifact/LZstbDoafY2QArZ7MGdE3u>. Pas encore dans le jeu : il faut l'onglet Sinnoh (même schéma que Hoenn).
- Sources à citer dans `credits/index.html` à l'intégration : icônes de menu et sprites Platinum du dépôt PokeAPI/sprites (déjà cité pour le Pokédex).

## Sinnoh : deux sources à comparer (27/11)
- Les icônes de la 4e génération existent aussi dans PokéAPI (`.../versions/generation-iv/icons/<n°>.png`, 32×32) ; le Pokémon y fait environ 20 px, comme dans celles de la 7e génération (40×30) : pas de gain de finesse, mais style d'époque. Les 107 dessins ont été faits avec les deux (version A, mêmes réglages) : `specs/picross/sinnoh-dessins-gen4.json` et `sinnoh-dessins-gen7.json` (champ `chroma` calculé sur les sprites Platinum).
- **Maquette de choix** : [`maquettes/picross-sinnoh.html`](../maquettes/picross-sinnoh.html), [artefact](https://claude.ai/artifact/FuaarsHDk67zKY8E5guCPU) : tableau des 107 lignes (icône et dessin des deux sources, couleurs normales ou chromatiques). Choix définitif de l'utilisateur à noter ici ; ensuite on supprime le fichier non retenu.
- **Choix du 27/11 : un peu des deux.** La maquette permet de choisir la source Pokémon par Pokémon (clic sur l'icône ou le dessin, champ de texte « 4e : … / 7e : … » à coller dans la conversation). Onglet Sinnoh : ouverture après la capture de Deoxys, légendaires par étapes (lacs, Dialga / Palkia, Heatran, Regigigas, Giratina, Cresselia, puis les fabuleux) : **validés par l'utilisateur**, à programmer une fois le choix reçu.

## Sinnoh fait le 27/11
- Choix de l'utilisateur : 55 Pokémon avec les icônes de la 4e génération, 52 avec celles de la 7e (liste collée le 27/11, voir l'historique git de ce fichier ou `maquettes/picross-sinnoh.html` pour reconstruire). Les deux fichiers JSON de travail ont été supprimés : les dessins sont dans `picross/dessins.js`, les chromatiques dans `picross/chroma.js`.
- Onglet SINNOH (`regionOf` : n° > 386), ouvert par Deoxys ; légendaires `lake`, `dp`, `heatran`, `regigigas`, `giratina`, `cresselia`, `darkrai`, `manaphy` (Phione et Manaphy), `shaymin`, `arceus` ; seuils dans `SINNOH_RULES` (`jeu.js`).
- Reste : Arène (badges), Pokédex old school, 5e génération (mêmes icônes PokéAPI, n° 494 à 649).

## Arène et Pokédex rétro : analyse du 28/11
- **Rétro** : `reference-retro-kanto.gif` (783×882), fan art de **@emimonserrate** (nom écrit sur la planche ; lien et permission à demander). 12 colonnes × 13 rangées d'icônes **16×16** (agrandies ×3), 4 couleurs (noir, rouge, orange, blanc), les 151 de Kanto plus un dernier glitch (Missingno ?). Même méthode que le Minidex : 16×16 moins une rangée et une colonne, couleurs de la planche gardées (3 tons). Toutes les formes diffèrent de celles du Dex principal.
- **Arène** : les images de badges de PokéAPI (`sprites/badges/1.png` à `32.png` : Kanto 1-8, Johto 9-16, Hoenn 17-24, Sinnoh 25-32, plus d'autres au-delà) sont en grand format ; essai de conversion automatique en 15×15 : [aperçu](https://claude.ai/artifact/9LU2V8JaFLrx4fK3hX99rw). Les formes simples (ronds, cœur, goutte) passent bien, les badges détaillés deviennent confus : prévoir une conversion avec contour et palette réduite, puis retouches à la main.

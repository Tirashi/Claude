# La Boutique de cartes — cahier des charges

Jeu de gestion : on tient une petite boutique de cartes à collectionner, en 3D, pendant une année de 52 semaines.
Idée de départ : `IDEES.md` (jeux de gestion, 15/10). Maquettes : `maquettes/boutique-de-cartes.html` (1) et
`maquettes/boutique-de-cartes-2.html` (2), fabriquées par `outils/boutique-maquette/fabriquer.py`.

## 1. Décisions de l'utilisateur
- Boutique en 3D avec les modèles **Kenney** (Mini Market, Mini Characters, Furniture Kit, CC0) : « vraiment sympa » (22/10).
- **Pas de vue comptoir** (maquette 1, B) : les clients circulent, achètent et paient seuls.
- La boutique **pivote** ; on l'**aménage** (acheter, poser, tourner, déplacer, revendre les meubles) et on l'**agrandit** (terrain « À VENDRE ») : maquette 2 validée telle quelle (23/10).
- **Cartes : mise en page 1, « cadre coloré »** (23/10) : monstres 32 × 32 de **Dungeon Crawl** (comme La Dernière Lanterne) dans les morceaux de **Pixel Card Assets** (cafedraw, CC0) ; le fond dit l'élément, le cadre de l'image et le bandeau du nom disent la rareté.
- **Ouverture d'un booster** en CSS 3D (maquette 1, C, gardée dans la 2) : la carte la plus rare en dernier, reflet holo, bilan « ouvert contre fermé ».

## 2. Principe
- **But** : en 52 semaines, faire d'une boutique minuscule la référence de la ville. **Rembourser le prêt** de départ (2 000 €) avant la **semaine 26**, puis avoir la plus grande **valeur** possible à la semaine 52.
- **Valeur** (le score) = argent en caisse + stock au prix d'achat + cartes à l'unité (vitrines et réserve) à leur cote + meubles à moitié prix + agrandissements à moitié prix − ce qui reste du prêt.
- **Défi secondaire** : compléter le **classeur** (toutes les cartes d'une extension, jusqu'à la légendaire). Un classeur complet donne de la **réputation** et un bonus de valeur.
- Une partie dure environ une heure, en plusieurs fois : sauvegarde automatique à chaque semaine.

## 3. Le déroulement d'une semaine
1. **Lundi matin (préparer, temps arrêté)** : la livraison du grossiste arrive. On peut :
   - commander au **grossiste** (livré le lundi suivant) ;
   - fixer les **prix** (boosters, cartes des vitrines) ;
   - ranger les cartes dans les **vitrines** ;
   - **ouvrir des boosters** du stock ;
   - **aménager** et **agrandir** ;
   - inscrire la boutique au **tournoi** du samedi.
2. **La semaine (du mardi au samedi)** : la boutique vit en 3D, en accéléré (environ 40 s, ×2 et ×4 possibles, pause). Les clients entrent, vont aux meubles, achètent, passent à la caisse (« +12 € »). Quelques **rencontres** arrêtent le temps : un client vend sa collection, un collectionneur cherche une carte précise, un marchand négocie (§ 7).
3. **Samedi après-midi : le tournoi** (s'il y a au moins une table) : résumé animé, gagnants, lots remis (§ 9).
4. **Dimanche : le bilan** : recettes, dépenses (loyer, livraisons), les **cotes qui bougent** (flèches vertes et rouges), la réputation, l'événement de la semaine suivante annoncé à l'avance quand c'est possible.

## 4. Le jeu de cartes inventé : « CRÉATURES »
- **5 éléments** : FEU, EAU, PLANTE, FOUDRE, OMBRE. **5 raretés** : commune, peu commune, rare, épique, légendaire.
- **Extensions** : une au départ, puis une nouvelle à peu près **toutes les 10 semaines** (5 dans l'année). Chaque extension : **40 cartes** (20 communes, 10 peu communes, 6 rares, 3 épiques, 1 légendaire), générées à la **graine** de la partie : nom fait de syllabes, élément, monstre, ATK, PV, cote de base.
- **Monstres** : la planche de la maquette (65) est agrandie à environ **150 monstres** de Dungeon Crawl, rangés par élément, pour que les 200 cartes de l'année se répètent peu. Une légendaire a toujours un monstre qui n'apparaît nulle part ailleurs.
- **Booster** : 5 cartes de l'extension (3 communes, 1 peu commune, 1 rare ou mieux : épique 1 fois sur 5, légendaire 1 fois sur 40).
- **Cote** de chaque carte = base de la rareté × popularité (la « méta » : un élément à la mode, les cartes jouées au tournoi) × rareté réelle (les cartes que plus personne ne trouve prennent de la valeur quand l'extension n'est plus vendue). Elle bouge chaque dimanche, de quelques pourcents ; plus fort lors des événements (§ 10).

## 5. Le grossiste et le stock
| Article | Prix d'achat | Prix conseillé |
|---|---|---|
| Booster (de l'extension en cours ou d'une ancienne, tant qu'il en reste) | 2,50 € | 4 € |
| Présentoir de 24 boosters | 54 € | (se vend booster par booster) |
| Coffret découverte (2 boosters + 1 carte promo) | 9 € | 15 € |
| Pochettes de protection | 1 € | 3 € |
| Classeur | 5 € | 12 € |

- Livraison le lundi suivant. Rupture de stock : les clients repartent les mains vides (et la réputation baisse un peu).
- Les boosters d'une **ancienne extension** ne se commandent plus au bout de 20 semaines : ceux qui restent en stock prennent de la valeur.
- **Vendre fermé ou ouvrir** : un booster fermé rapporte une marge sûre ; ouvert, il donne 5 cartes à mettre en vitrine (souvent moins de 4 €, parfois beaucoup plus). C'est le pari central du jeu.

## 6. Vendre
- **Rayon de boosters** : 3 sortes de produits par rayon (boosters, coffrets, accessoires). Prix réglable par produit, avec la marge affichée.
- **Vitrine basse** : 8 places pour des cartes à l'unité. **Grande vitrine** : 4 places, pour les cartes de valeur (rare et mieux) ; elle attire les collectionneurs.
- Prix d'une carte : en pourcentage de sa cote, avec des boutons simples (−10 %, à la cote, +10 %, +25 %). Un client achète si le prix est sous sa limite (qui dépend de son type, de son humeur et de la réputation).
- **Étagère à classeurs** : vend classeurs et pochettes.
- **Réserve** : les cartes qui ne sont pas en vitrine (sans limite) ; le classeur personnel (cartes gardées, jamais vendues automatiquement).

## 7. Les clients
| Client | Ce qu'il veut | Particularité |
|---|---|---|
| L'enfant (argent de poche) | Boosters, cartes communes de son élément préféré | Nombreux le mercredi et pendant les vacances |
| Le joueur de tournoi | Les cartes fortes de la méta | Vient surtout s'il y a un tournoi |
| Le collectionneur | Une carte précise (rare et mieux) | Paie cher ; rencontre : « Vous auriez un VOLTAX ? » |
| Le marchand | Acheter en lot, à bas prix | Rencontre : il négocie (trois offres, on accepte ou non) |
| Le vendeur de collection | Vendre ses cartes | Rencontre : un lot à un prix (on voit les cartes et leur cote, on accepte ou on refuse) |

- **Affluence** = base de la semaine × réputation × **attrait** de la boutique (chaque meuble en donne : vitrines, tables, plantes, lampes) × événements. La taille de la boutique limite le nombre de clients en même temps.
- Pas de fausses cartes (décision du 23/10) : un lot à vendre est une bonne ou une mauvaise affaire selon son prix et les cotes.

## 8. Aménager et agrandir (comme la maquette 2)
- Meubles : rayon de boosters 80 €, vitrine basse 120 €, grande vitrine 220 €, table de tournoi 150 €, étagère à classeurs 60 €, plante 15 €, lampadaire 25 € ; la caisse est fixe dans le catalogue (on peut la déplacer, pas la vendre). D'autres meubles débloqués en cours d'année (borne d'arcade, présentoir de figurines, tapis de jeu, affiche géante), à fixer en session 1.
- On ne peut pas boucher le chemin : un meuble qui empêcherait les clients d'aller à la caisse ou à un autre meuble est refusé (fantôme rouge).
- Agrandissements : 6 × 5 → 8 × 5 (900 €) → 8 × 7 (1 600 €) → 10 × 7 (2 600 €). Un agrandissement augmente le **loyer** de la semaine.
- Revente des meubles à moitié prix.

## 9. Le tournoi du samedi
- Il faut au moins une table (une table = 2 joueurs, donc 4, 8 ou 12 joueurs selon les tables).
- Frais d'inscription réglables (0 à 5 €) ; **lots** pris dans le stock (boosters, une carte de la vitrine).
- Effets : plus de joueurs de tournoi dans la semaine qui suit, la réputation monte si les lots sont généreux, et les cartes jouées par les finalistes voient leur cote monter le dimanche.

## 10. Événements (un par semaine au plus, tirés à la graine)
- **Carte interdite** au tournoi : sa cote est divisée par 3.
- **Vidéo d'un vidéaste** : une carte voit sa cote multipliée par 3, la ruée des clients.
- **Rupture chez le grossiste** : un article non livré cette semaine.
- **Réédition** d'une ancienne extension : ses boosters reviennent, les cotes de ses cartes baissent.
- **Vacances scolaires** (hiver, printemps, été, Toussaint) : plus d'enfants. **Noël** : semaines 48 à 51, ventes fortes.
- **Sortie d'une extension** : file d'attente le premier jour, précommandes possibles la semaine d'avant.
- **Concurrent** : une boutique ouvre en ville pendant quelques semaines (moins de clients, sauf réputation forte).

## 11. Le prêt, la fin, le score
- Prêt de 2 000 € au départ. On rembourse quand on veut (bouton dans le bilan). À la semaine 26, la banque prend ce qui reste **plus 20 %**. Si la caisse ne suffit pas : **faillite**, fin de partie, avec un score réduit (la valeur, moitié).
- Pas de découvert : un achat qui ferait passer la caisse sous zéro est refusé (le loyer, lui, peut la faire passer sous zéro ; deux dimanches de suite sous zéro = faillite).
- À la semaine 52 : bilan de l'année (valeur, meilleure carte ouverte, classeurs complets, nombre de clients) et classement.

## 12. Écrans
- **La boutique** (écran principal, maquette 2) : barre du haut (semaine, jour, caisse), boutons ⟲ ⟳, boutons du bas selon le moment : le lundi GROSSISTE, PRIX, VITRINES, BOOSTERS, AMÉNAGER, puis OUVRIR LA BOUTIQUE ; pendant la semaine : vitesse et pause.
- **Grossiste** : liste d'articles, quantités avec − et +, total, livraison lundi.
- **Vitrines** : les places de chaque vitrine, les cartes de la réserve à glisser dedans, le prix en pourcentage de la cote.
- **Ouvrir un booster** (maquette) : on choisit combien ouvrir ; « tout ouvrir » pour aller vite.
- **Le classeur** : pages de 9 cartes par extension, cases vides grises avec leur numéro, cote de chaque carte.
- **Rencontres** (§ 7) : fenêtre avec le client (portrait dessiné à partir de son modèle 3D) et ses cartes.
- **Bilan du dimanche** et **fin d'année**.

## 13. Rendu
- 3D Three.js r128, caméra orthographique qui pivote autour de la boutique, murs du devant cachés ; personnages animés Kenney (marche, attente, prendre, payer, s'asseoir).
- Interface : Fredoka (texte), Luckiest Guy (titres, montants) ; cartes : Pixelify Sans, agrandies sans lissage (× 3).
- Le soir du samedi, lumière plus chaude (les lampadaires servent).

## 14. Sons
Bruitages Kenney (CC0, déjà utilisés : clics, caisse, cartes), un petit jingle d'ouverture de booster, une musique de boutique douce (à choisir dans un banc d'écoute, comme pour La Dernière Lanterne). À valider au moment de la session 3.

## 15. Technique
- Dossier `boutique/` : `index.html`, `regles.js` (état JSON et règles pures, hasard par flux à la graine, aussi chargé sous Node), `cartes.js` (génération des extensions, cotes), `clients.js` (affluence, types, rencontres), `modeles.js` (GLB Kenney en base64 et atlas, fabriqué par un outil), `images.js` (planche des monstres et des cadres), `monde3d.js` (boutique, meubles, clients, caméra), `dessin-cartes.js`, `interface.js`, `sons.js`, `jeu.js`.
- Simulateur `outils/boutique-simulateur.js` (parties automatiques avec plusieurs stratégies : tout vendre fermé, tout ouvrir, mélange ; pour régler les prix, les cotes et le prêt), ajouté à `verifications.js`.
- Le temps de la semaine est réglé par les règles (liste d'achats tirée d'avance) puis **rejoué** en 3D : la 3D ne décide rien, comme la bataille de Bannières.
- Sauvegardes `boutique.run`, `boutique.best`, `boutique.opts`, `boutique.tuto`. Objet de test `window.Boutique`.
- Classement `boutique` : `best` (valeur à la semaine 52). **Pas de défi du jour** (§ 17).
- Crédits : Kenney (Mini Market, Mini Characters, Furniture Kit), Dungeon Crawl Stone Soup, Pixel Card Assets (déjà dans `credits/`).

## 16. Plan de travail
| Session | Contenu | Modèle |
|---|---|---|
| 1 | `regles.js`, `cartes.js`, `clients.js`, simulateur, équilibrage (prix, cotes, prêt, affluence) | Opus |
| 2 | La boutique en 3D : outil des modèles, monde, aménagement, agrandissements, clients qui rejouent la semaine | opusplan |
| 3 | Écrans (lundi, grossiste, vitrines, classeur, rencontres, bilan), boosters, sons, sauvegarde, classement, accueil, artefact | opusplan |

## 17. Points confirmés par l'utilisateur (23/10)
1. Durée : **52 semaines**, prêt à rembourser à la semaine 26.
2. **Pas de défi du jour** : « ça ne s'y prête pas ».
3. **Faillite** gardée (§ 11).
4. **Pas de fausses cartes** (§ 7).

## 18. Bilan de la session 1 (23/10)
**Fichiers** (scripts classiques, portée globale, noms `bou` / `BOU`, chargés dans cet ordre) :
- `boutique/monstres.js` + `boutique/monstres.png` : 155 monstres de Dungeon Crawl (30 par élément + 5 légendaires réservés), fabriqués par `outils/boutique-monstres.py <rltiles>`. Ne pas changer l'ordre.
- `boutique/regles.js` : état JSON (`bouNouvelle(graine)`, `bouMigrer`), hasard `bouRng(graine, usage, a, b)`, grossiste (`bouCommander`, `bouAnnulerCommande`, livraison le lundi), prix (`bouFixerPrix`, `bouPrix`), `bouOuvrir` (booster ou coffret → réserve), `bouGarder` (classeur), vitrines (`bouMettreEnVitrine`, `bouPrixVitrine`, `bouRemplirVitrines`, prix = cote × pct, arrondi à 10 c), rayons (`bouRanger`, 3 produits par rayon ; étagère à classeurs et présentoir de figurines vendent leurs articles), meubles (`bouPoser`, `bouDeplacer`, `bouVendreMeuble`, `bouAgrandir`, grille, `bouCheminLibre` : la porte et la case devant chaque meuble à clients restent atteignables), `bouAttrait`, prêt (`bouRembourser`), tournoi (`bouTournoi` : inscrit, frais, lots), semaine (`bouOuvrirBoutique` → `bouJour` × 5 → `bouDimanche`), `bouValeur`, fin (`e.fin` : `annee` ou `faillite`, `score`).
- `boutique/cartes.js` : `bouCatalogue(graine)` (5 extensions de 40 cartes : 11 cartes de l'élément vedette, 7 de chaque autre, noms uniques), `bouCarte`, `bouCote` (cote de départ × mode de l'élément × popularité × âge), `bouBougerCotes`, `bouTirerBooster`, `bouTirerCoffret`, `bouCommandable`.
- `boutique/clients.js` : `bouSaison` (calendrier), `bouAffluence`, `bouPlanSemaine`, `bouVisite` (5 types de clients), `bouJouerTournoi`, rencontres (`bouPreparerRencontre`, `bouRepondre` « oui » / « non », le marchand fait 3 offres), événements (`bouTirerEvenement`, annoncés une semaine à l'avance).
- `outils/boutique-simulateur.js [n] [--detail]` (dans `verifications.js`, 6 années par stratégie, 3 s).

**La semaine dans le code** : `phase` = `lundi` (tout se règle) → `semaine` (`bouJour` rend la liste des visites du jour, à rejouer en 3D : type de client, achats avec article ou carte, prix, meuble ; le samedi, le résultat du tournoi ; une rencontre met `e.rencontre` et bloque la suite jusqu'à `bouRepondre`) → `dimanche` (`bouDimanche` rend le bilan : compte de la semaine, cotes qui ont bougé `{id: [avant, après]}`, valeur, événement en cours et suivant) → `lundi` suivant ou `fin`.

**Valeurs réglées par le simulateur** (moyenne sur des années complètes du gérant automatique) :
| Stratégie | Valeur à la fin | Faillites |
|---|---|---|
| rien (ne fait rien) | 0 | toujours |
| ferme (vend tout fermé) | ≈ 6 700 € | aucune |
| ouvre (ouvre presque tout) | ≈ 1 000 € | une année sur deux : l'argent dort en cartes qui ne se vendent pas assez vite |
| melange (vend fermé ce qui part, ouvre 12 boosters par semaine) | ≈ 9 800 € | aucune |
| classeur (melange + une carte de chaque au classeur) | ≈ 12 300 € | aucune ; 4 à 5 classeurs complets par an |

- Un booster ouvert vaut en moyenne 4,80 € de cote (vendu fermé 4 €) ; légendaire 1 fois sur 40, épique 1 fois sur 5.
- Affluence : 14 clients par jour × (0,6 + réputation / 60) × (1 + attrait / 80), poids du jour (mardi 0,8 … samedi 1,6), saison et événements ; au plus surface × 1,4 par jour.
- Réputation : départ 20 ; + 0,02 par client content, − 0,12 par client qui ne trouve pas ce qu'il veut, − 0,03 si c'est trop cher ; tournoi + 0,6 à + 4 ; classeur complet + 8 ; chaque dimanche × 0,97. Elle se tient vers 35 à 45.
- Loyer : 60, 85, 120, 160 € par semaine selon la taille. Meubles débloqués : tapis (semaine 5), affiche (8), borne d'arcade (12, + 15 € par semaine), présentoir de figurines (20, avec l'article figurine).
- Départ : 2 400 € (dont 2 000 de prêt), caisse + rayon (boosters, coffrets, pochettes) + vitrine basse, 36 boosters, 3 coffrets, 15 pochettes.

**Pour la session 2** : la 3D lit l'état (meubles, vitrines, rayons) et rejoue les visites rendues par `bouJour` (la 3D ne décide rien) ; les meubles se posent avec `bouPoser` / `bouDeplacer` (le fantôme est rouge si `bouPlaceLibre` ou `bouCheminLibre` refuse).

## 19. Bilan de la session 2 (23/10)
**Fichiers ajoutés** (page `boutique/index.html`, pas encore sur l'accueil) :
- `boutique/modeles.js` (3,3 Mo) et `boutique/images.js` : fabriqués par `outils/boutique-modeles.py <packs Kenney>` (GLB en base64 : Mini Market, 8 clients de Mini Characters, Furniture Kit ; atlas commun ; planches des cartes et des monstres en `data:`). L'atlas passe en `blob:` avant `GLTFLoader` (leçon de Bannières).
- `boutique/dessin-cartes.js` (`BouCartes` : `charger`, `dessiner(carte)`, `dos`, `bete`) : la mise en page 1 de la maquette 2, avec le numéro `n/40`.
- `boutique/monde3d.js` (`BouMonde`) : coque (sol, murs à fenêtres, porte, enseigne LE REPAIRE, trottoir, quadrillage), terrain « À VENDRE » du prochain agrandissement (on le touche pour l'acheter), dalles qui sortent du sol, caméra orthographique qui pivote (doigt, ⟲ ⟳, molette), murs du devant cachés. Chaque meuble est refait seulement quand sa `signature` change (place, produits en stock, cartes des vitrines). Rayon : les cartons du modèle remplacés par les produits rangés (boosters aux couleurs de l'extension, coffret, pochettes, classeurs, figurines) ; vitrines : les vraies cartes ; tables : deux joueurs assis ; tapis, affiche (la légendaire de la dernière extension), borne d'arcade et présentoir de figurines faits à la main. Fantôme de l'aménagement (vert, ou rouge avec la raison de `bouPeutPoser`), sélection dorée, vignettes du catalogue (`vignettes()`). `rejouer(jour)` : chaque visite devient un client (entrer, aller aux meubles de ses achats, prendre, payer à la caisse, sortir, par le plus court chemin) ; la carte achetée disparaît de la vitrine quand on la prend (`place` dans l'achat) ; bulle « ? » (rayon vide) ou « € » (trop cher) ; vitesse et pause.
- `boutique/jeu.js` (`Boutique`) : banc d'essai de la semaine en attendant la session 3 : lundi (AMÉNAGER, OUVRIR LA BOUTIQUE), cinq jours rejoués (9 s par jour, ×1 ×2 ×4, pause), rencontres (fenêtre avec les cartes), bilan du dimanche, agrandissement, sauvegarde `boutique.run` le lundi seulement (une semaine interrompue reprend au lundi).
- `boutique/style.css`, `polices/boutique.css` (Fredoka, Luckiest Guy, Pixelify Sans du dépôt).
- Règles : `bouPeutPoser(e, type, x, z, r, sauf)` (raison du refus ou null) ; les achats de cartes disent leur `place`.

**Pour la session 3** : il manque les écrans du lundi (grossiste, prix, vitrines, classeur, ouvrir des boosters avec l'animation de la maquette), le choix des produits des rayons, le tournoi, l'écran titre, les sons, le classement `best`, l'accueil (`GAMES`, `RANKS`), le README et l'artefact.

## 20. Bilan de la session 3a (23/10)
La session 3 a été coupée en deux (3a : les écrans du lundi ; 3b : titre, sons, classement, accueil, README, artefact).

**`boutique/lundi.js`** (`BouLundi(ctx)`, appelé par `jeu.js`) : chaque écran est un panneau en bas, la boutique 3D reste visible au-dessus et se met à jour à chaque changement.
- **Barre du lundi** : six outils (GROSSISTE, RAYONS, VITRINES, BOOSTERS, CLASSEUR, AMÉNAGER), puis TOURNOI (seulement s'il y a une table) et OUVRIR LA BOUTIQUE.
- **Grossiste** : les articles commandables (boosters, présentoirs et coffrets de chaque extension encore en vente, précommande la semaine d'avant), − et + par paquets (6 boosters, 10 pochettes…), stock actuel, total payé tout de suite, livré lundi ; la rupture de la semaine est signalée.
- **Rayons et prix** : les 3 produits de chaque rayon (listes déroulantes, avec le stock), puis le prix de chaque article (pas de 0,50 €, marge affichée, « pas en rayon » ou « rupture ! » en rouge).
- **Vitrines** : la réserve et TOUT RANGER (`bouRemplirVitrines`), les places de chaque vitrine ; une place vide propose les cartes de la réserve (les plus chères d'abord, rares et mieux pour la grande vitrine) ; une place pleine propose le prix (−10 %, à la cote, +10 %, +25 %, +50 %) ou de la remettre en réserve.
- **Boosters** : le stock à ouvrir ; un booster s'ouvre avec l'animation de la maquette 2 (paquet aux couleurs de l'extension avec sa légendaire, cartes à retourner, la meilleure en dernier, reflets, éclats, rayons pour une épique ou mieux), puis le bilan « bon pari / pas de chance » contre le prix fermé, et AU CLASSEUR (les cartes qui lui manquent), EN VITRINE, UN AUTRE. Un coffret, ou TOUT (avec confirmation), s'ouvre sans animation avec un résumé.
- **Classeur** : un onglet par extension sortie, pages de 9 (cartes gardées avec leur cote, cases vides grises avec numéro et étoiles, « en réserve, RANGER » en jaune), RANGER LA RÉSERVE, fenêtre « classeur complet ».
- **Tournoi** : inscription, frais (0 à 5 €), lots (boosters de la dernière extension).
- **Banque** : toucher la caisse le lundi pour rendre 500 € ou tout ce qu'on peut (rappel dans le bilan du dimanche).

Vérifié avec Playwright (commande, booster animé, tout ouvrir, vitrines, classeur, tournoi, rayons, puis une semaine jusqu'au bilan).

## 21. Bilan de la session 3b (23/10)
- **Écran titre** (par-dessus la boutique 3D qui tourne lentement) : CONTINUER · SEMAINE n (si une partie est sauvegardée), NOUVELLE PARTIE (confirmation si une partie existe), COMMENT JOUER, CLASSEMENT et ◀ LUDOTHÈQUE (classe `ludo-retour`), record et nombre de parties.
- **Menu** (bouton ☰ au-dessus de ⟲ ⟳) : SONS, MUSIQUE (réglages `boutique.opts`), TITRE (le lundi seulement), REPRENDRE ; pendant la semaine, il met la boutique en pause.
- **Sons** (`boutique/sons.js`, `BouSons`) : synthétisés en WebAudio, sans fichier (choix pour garder la session courte : les bruitages Kenney et le banc d'écoute du § 14 restent possibles plus tard). « Toc » des boutons, tiroir-caisse à chaque vente, meuble posé, booster déchiré, carte retournée, éclat d'une rare (plus long pour une épique, une légendaire), jingle du dimanche, fanfare de fin d'année, petit air triste de la faillite ; musique de boutique douce (quatre accords lents, une note de mélodie de temps en temps, très bas), lancée au premier toucher.
- **Fin** : fenêtre avec le bilan, la valeur, les clients, les boosters ouverts, les classeurs complets, la meilleure carte et le **score** (nouveau record ou rappel du record) ; TITRE ou NOUVELLE PARTIE. Record `boutique.best`, stats `boutique.stats`, envoi `LudoScores.submit('boutique', 'best', score)`.
- **Artefact** : au lien de la maquette 2 (https://claude.ai/artifact/CfcT2Wzc9QEsbNUouQD5Y6, choix de l'utilisateur), copie de `outils/artefact.py` avec Three.js r128 depuis cdnjs (3,9 Mo).
- **Accueil** : cartouche 3D violette (icône `boutique`), à la une, genre SIMULATION, EN COURS « SEMAINE n/52 », records, classement « LA MEILLEURE BOUTIQUE », transfert de sauvegarde ; `ludo-scores.js` (`PSEUDO_BOARDS`, `registerExisting`, `SYNC` 24) ; test de fumée (titre, partie, commande, écrans du lundi, booster, sauvegarde).

## 22. Retours du 23/10 : bug du menu et première semaine guidée
- **Bug** : pendant la semaine, le menu ☰ mettait la boutique en pause et REPRENDRE ne la relançait pas (seule la caméra bougeait). Corrigé : REPRENDRE relance la semaine, sauf si le joueur avait mis la pause lui-même.
- **« Le jeu n'est pas facile à comprendre »** : choix de l'utilisateur parmi 4 pistes (semaine guidée, liste « à faire », conseils du bilan, écrans débloqués peu à peu) : **la première semaine guidée**. `boutique/guide.js` (`BouGuide`) : Marco, l'ancien patron, dans une bulle en haut ; le bouton à toucher clignote en doré (`.guide-cible`) ; chaque étape passe toute seule quand c'est fait : GROSSISTE → + booster → OK → BOOSTERS → OUVRIR → retourner les cartes, EN VITRINE (bulle cachée pendant les cartes) → VITRINES (prix) → OUVRIR LA BOUTIQUE → la semaine (×1 pour accélérer) → le lundi suivant, le résumé (commande, ouvre, range, ouvre la boutique ; la banque). « Passer le guide » à chaque étape. Lancé à la première NOUVELLE PARTIE (`boutique.guide` mis à vrai à la fin ou en passant), et par le menu le lundi (LE GUIDE).
- Les autres pistes (liste « à faire ce lundi », conseils dans le bilan) restent possibles si le guide ne suffit pas.

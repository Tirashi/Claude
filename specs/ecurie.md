# Écurie miniature — cahier des charges (chantier)

Idée de l'utilisateur (18/11) : un petit jeu de **gestion d'écurie de course**. Les courses se jouent toutes seules ; on les **regarde sans les influencer**. Le joueur gère les essais, les voitures, les investissements, les sponsors, les pilotes. Nom provisoire : *Écurie miniature*.

## Historique des maquettes
| # | Date | Contenu | Avis |
|---|---|---|---|
| 1 | 18/11 | sprite stacking, F1 voxel ; A paddock 16 bits, B diorama, C télé — https://claude.ai/artifact/5FLGHg1CtsFpJ8TjT88G9b | **A** retenue, mais « pas des F1 » : voitures de série façon Gran Turismo (améliorer sa voiture ou en acheter une autre) |
| 2 | 18/11 | voitures de série voxel, course 300 ch, concession neuve / occasion, garage aux pièces visibles — https://claude.ai/artifact/8fa6y9VmZV9kGzbVzqx6f9 | « bouillie de pixels » : voitures trop petites |
| 3 | 18/11 | modèle voxel 44 × 20 × 13 fait par le code, salon, vues proche et large — https://claude.ai/artifact/DLAB836HNMXyZLRyUiFHeU | vue large retenue, route élargie |
| 4 | 18/11 | packs voxel gratuits (Kytric, theodd1in, pixcatt, voxelempire) — https://claude.ai/artifact/GKQ1oqZtvikU1StSosGWrR | on laisse tomber le voxel |
| 5 | 18/11 | **low poly** : 36 voitures CC0 (Cosmo, Kenney, rgsdev) repeintes, course 3D, parking — https://claude.ai/artifact/SXBFDEnm7sVJ7aittf9Y1X | projet abandonné, puis « dernier essai » |
| 6 | 20/11 | **circuit urbain** en tuiles Modular Roads (Atomic Realm), course simulée avec stats, trois caméras — https://claude.ai/artifact/M1ouMVo2x8qT2NvRc7UUeN | « ça rend pas mal » : **projet relancé** ; les trois caméras deviennent trois points de vue au choix du joueur |
| 7 | 20/11 | **gestion** : garage (notes, pièces, peinture), concession (neuves, occasion), pilote (et pilotes libres), sponsors (2 places), semaine (5 jours) ; A paddock 16 bits, B atelier et fiches papier, C tablette du directeur — https://claude.ai/artifact/Va7ZuMoUQb6M7YqzgrugWy | en attente du choix |
| 8 | 20/11 | **gestion, style A** : six onglets (écurie, garage, achat, sponsors, semaine, fans) ; pilotes et voiture attribuée, réserve (voiture en réparation), 3ᵉ place verrouillée (niveau 2), garage voiture par voiture, revente, fans et revenus à débloquer (boutique 1 000 fans, convention 5 000, fan club 10 000) — https://claude.ai/artifact/Ti3b1zMar7cQizKQvQ4cKL | **validée** le 20/11 (choix de la voiture dans une liste) |
| 9 | 21/11 | **interface sans rétro** (nouvelle règle « Direction artistique libre ») : A la télé (habillage de retransmission, bandeaux penchés), B le garage (studio clair, fiches en verre, voiture en vedette), C le mur des stands (chiffres d'abord, chasse fixe, ambre) ; écran de l'écurie et écran de course — https://claude.ai/artifact/BLJqs81qzNZnfHXaHmjmhB | **A (la télé) choisie** le 21/11 (« c'est génial ») : remplace le style A 16 bits de la maquette 8 pour tout le jeu |

## Décisions (20/11)
- **3D low poly** avec Three.js (`lib/three.min.js`, r128) ; pas de voxel ni de sprite stacking.
- **Circuits** en tuiles *Modular Roads* d'Atomic Realm (version gratuite : crédit obligatoire, pas de redistribution des fichiers seuls) : lignes droites de 12 m, virages de 90° de rayon 18 et 42 m (et 45° à essayer), lampadaires, barrières, cônes, fûts, feux, arbres. Le circuit est posé « à la tortue » (cap + position) à partir d'une liste de tuiles ; la trajectoire est calculée avec.
- **Voitures** : packs low poly CC0 (Cosmo, rgsdev, Kenney) convertis dans un format commun par `outils/low-poly/` (formes + couleurs par sommet, longueur 1, nez vers +X) ; **carrosserie repeinte** automatiquement (famille de teintes vives la plus présente) → livrées des écuries.
- **Trois points de vue**, au choix du joueur pendant la course (bouton CAMERA) : **suivie** (haute, derrière sa voiture), **diorama** (tout le circuit, rotation lente), **télé** (caméras de bord de piste, le réalisateur suit le duel le plus serré).
- Course regardée, jamais pilotée ; on peut l'accélérer ou passer au résultat (à faire).

## Simulation de course (maquette 6, à améliorer)
- Voiture : vitesse max (m/s), accélération, adhérence (g). Pilote : talent, constance, agressivité (0 à 1).
- Vitesse en virage = √(adhérence × g × rayon) ; le pilote regarde 70 m devant et freine (13 m/s², un peu plus tard avec du talent).
- Aspiration +5 % en ligne droite derrière une voiture. Erreurs (vitesse × 0,55 pendant 1 à 2 s), plus fréquentes sans constance.
- **Trajectoire de course** (20/11) : une ligne idéale calculée une fois (extérieur jusqu'à 34 m avant le virage, corde au milieu, extérieur en sortie, lissée sur 19 m, bornée à ±3,7 m du centre) ; elle élargit le rayon pris (rayon + 9,4 m). Chaque voiture la suit avec un écart latéral : 0 sur la ligne, ±3,3 m pour attaquer du côté où il y a de la place ; hors de la ligne, −5 % d'adhérence en virage. Changements de côté progressifs (3,2 m/s), la voiture s'oriente dans le sens de son déplacement, et rejoint la ligne quand la place est libre.
- Attaque si plus rapide et place libre (selon l'agressivité) ; le défenseur peut fermer la porte (agressivité × 0,3). Pas de voitures qui se traversent : on se cale à une longueur, on ne change de file que sur une place libre.
- Classement avec une marge de 2,5 m (sinon deux voitures côte à côte s'échangent la place à chaque image). Grille inversée (les plus fortes derrière).
- Mesuré sur 8 tours : environ 35 dépassements, 7 erreurs, une douzaine de portes fermées, aucun chevauchement.
- Mesuré avec la trajectoire (20/11) : environ 27 dépassements sur 8 tours, aucun chevauchement, tours plus rapides (≈ 15 s).
- **Départ** (20/11) : départ arrêté, ligne au bout de la plus longue ligne droite (grille de 8 en deux colonnes décalées, 7,5 m entre deux rangs), 5 feux rouges puis vert ; les voitures gardent leur colonne sur les 15 premiers mètres puis rejoignent la trajectoire progressivement (sur 95 m). Les tours se comptent depuis la ligne.
- **Pilotage** (20/11) : feux stop allumés au freinage, la voiture plonge au freinage et se cabre à l'accélération ; l'attaquant choisit l'intérieur si un virage arrive (15 à 60 m) et freine plus tard (+12 % × agressivité) ; une erreur près d'un virage peut finir en **sortie de piste** (la voiture part à l'extérieur, sur l'herbe, puis revient).
- Mesuré (20/11) : environ 27 dépassements, 4 sorties de piste et 3 erreurs sur 8 tours, aucun chevauchement.
- **Reste à régler** : stats et équilibre, puis course accélérée / résultat direct.

## Gestion : décisions du 20/11 (maquette 7)
- **Style A retenu** (paddock 16 bits : Press Start 2P, fond violet rayé, blocs à double bordure, barres de notes, voiture 3D sur un plateau qui tourne). La course en 3D reste celle de la maquette 6.
- Onglets de départ : garage, concession, pilotes, sponsors, semaine ; on verra plus tard s'il en faut d'autres (usine, saison, classement).
- **Plusieurs pilotes** : 2 au début, puis davantage de places à mesure que l'écurie grandit (réputation, niveau de l'écurie).
- **Plusieurs voitures** : l'écurie possède un parc de voitures ; on **attribue une voiture à chaque pilote** engagé (toucher la voiture du pilote ouvre la liste du parc : disponibles à prendre, celles des autres pilotes et celles en réparation grisées avec la raison) ; les autres restent **en réserve** (remplaçantes en cas d'accident ou de panne, voitures d'une autre catégorie).
- **Fans** : le nombre de fans monte avec les résultats (et les médias) ; au bout d'un moment on **débloque** des sources de revenus simplifiées (boutique de goodies, convention…) qui rapportent selon le nombre de fans.

## Boucle de jeu (à préciser)
- Saison de grands prix (circuits différents), une course par « semaine ».
- Entre deux courses : planning de la semaine (essais, atelier, simulateur, repos, médias), achat de voitures (concession neuve et occasion), pièces (moteur, turbo, aileron, pneus, freins, allègement), sponsors (argent contre objectifs), pilotes (recrutement, progression), attribution des voitures, fans.
- Catégories par puissance (150, 300, 500 ch, illimité) : une pièce peut faire sortir la voiture de sa catégorie.
- Accidents et pannes (fiabilité) : une voiture abîmée part en réparation, la réserve sert alors.

## Session 1 (20/11) : le jeu dans `ecurie/` (démo)
- **Boucle** : gestion (six onglets) → LANCER LE GRAND PRIX → effets de la semaine et **grille de départ** (qualifications : voiture, talent, un peu de hasard selon la constance) → course 3D (CAMERA : suivie de chacun de ses pilotes, diorama, télé ; ×1 / ×2 / ×4 ; RESULTAT direct) → résultats (points, primes, sponsors, fans, salaires, entretien) → semaine suivante.
- **Grille inversée abandonnée** : mesuré, une voiture plus rapide partie derrière finissait plus loin (dépasser est difficile) ; avec les qualifications, environ 9 dépassements par course, 10 incidents, moins d'un abandon.
- **Notes → simulation** : vitesse max 44 + 1,6 × vitesse (m/s), accélération 7 + 0,5 × note, adhérence 1,1 + 0,06 × note (g), casse (10 − fiabilité) × 1,2 % par course ; l'état de la voiture (usure) et les essais (+1 % par jour, 3 au plus) jouent un peu. Pilote : talent et constance réduits par la fatigue (forme).
- **Saison** de 8 GP sur 3 circuits (ville, port, parc), points 10-8-6-5-4-3-2-1, primes par place × la division (×1, ×2,5, ×6), prime de fin de saison ; **les 3 premiers montent** : Coupe 300 ch → Trophée 500 ch → Grand Prix illimité (une voiture trop puissante ne court pas : le turbo peut faire sortir de la catégorie). 6 rivaux par division ; la grille compte toujours 8 voitures.
- **Écurie** : réputation = points marqués ; niveau 2 à 40 (3 places de pilote), 3 à 120 (4 places), 4 à 250 ; sponsors à débloquer par niveau (Voltage, Orbital TV), conditions (top 5, pas d'abandon, podium tous les 3 GP, victoire tous les 4 GP) ; contrat rompu jusqu'à la fin de la saison.
- **Semaine** : essais, atelier (+8 % d'état, réparations plus rapides avec 2 jours), simulateur (talent, plus vite avant 24 ans), repos (+10 forme ; essais, simulateur et médias fatiguent), médias (+1 000 $, +60 fans).
- **Voitures** : accident (2 semaines de réparation) ou casse (1 semaine) ; la réserve remplace automatiquement une voiture indisponible ; réparer tout de suite (4 000 $ par semaine), remettre à neuf, revendre une voiture de réserve ; occasions tirées chaque semaine.
- **Faillite** sous −20 000 $. Sauvegarde `ecurie.partie`, records `ecurie.record` (GP, victoires, podiums, titres).
- **Équilibre** (`node outils/ecurie-simulateur.js equilibre`) : avec les voitures de départ, milieu de tableau en division 1 ; avec deux RG Sport et trois pièces, champion presque à chaque fois.

## Retours du 20/11 sur la session 1
- Les roues tournent (pièces séparées à la lecture du modèle ; vitesse de rotation plafonnée pour ne pas voir les jantes tourner à l'envers) ; feux stop posés sur l'arrière de chaque carrosserie (ils flottaient sur certaines voitures).
- Interface retravaillée : boutons en relief 16 bits (biseau clair et sombre, enfoncés au toucher), icônes en pixels (onglets, en-tête, jours, commandes de course), titres soulignés, damier sur l'écran titre.

## Habillage « la télé » (21/11)
- Tout le jeu passe dans la direction A de la maquette 9 : Titillium Web (copiée dans `polices/`, SIL OFL), bandeau orange penché en haut, vitrine sur fond transparent (dégradé de la page, ombre au sol, projecteur orange), prochain grand prix en tête de l'onglet Écurie, pilotes avec leur numéro (7, 12…), listes à bandeaux de prix, podium sur l'écran des résultats, HUD de course de la maquette, confirmations dans la page.
- Textes en français normal (accents, minuscules) ; les majuscules viennent du style.

## Session 2 (21/11) : circuits variés et sons
- **Virages à droite** : la tuile de virage parcourue à l'envers (plan : −18, −42) ; la trajectoire, l'attaque par l'intérieur et les sorties de piste suivent le sens du virage (`SENS`).
- **5 circuits** au calendrier : Ville, Port, Collines (un virage à droite), Parc, Canal (deux chicanes en S) ; les deux nouveaux ont été cherchés par programme (fermés, sans croisement, 380 à 560 m). Nombre de tours selon la longueur (≈ 3 km, 2 minutes : 6 à 8 tours).
- **Sons** synthétisés (`sons.js`) : moteur de la voiture filmée (hauteur selon la vitesse, plus discret en diorama et à la télé), bips des feux, souffle à chaque dépassement, foule à l'arrivée ; bouton son dans les commandes de course (`ecurie.son`).
- Mesuré : 7 à 10 dépassements par course selon le circuit.

## Questions ouvertes
- Durée d'une partie (une saison, une carrière ?), classement ou non.
- Comment l'écurie grandit (niveaux ? réputation ?) et ce que ça débloque (places de pilotes, garage plus grand, goodies, convention).
- Prochaine étape : essai sur le téléphone, puis réglages selon les retours (plus de dépassements ? plus de circuits ? sons ?).

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
- Deux files ; attaque si plus rapide et file libre (selon l'agressivité), le défenseur peut fermer la porte. Pas de voitures qui se traversent : on se cale à une longueur, on ne change de file que sur une place libre.
- Classement avec une marge de 2,5 m (sinon deux voitures côte à côte s'échangent la place à chaque image). Grille inversée (les plus fortes derrière).
- Mesuré sur 8 tours : environ 35 dépassements, 7 erreurs, une douzaine de portes fermées, aucun chevauchement.
- **À améliorer** (demande du 20/11) : trajectoires (corde des virages au lieu de deux files fixes, sorties larges), pilotage plus naturel (changements de file progressifs, freinages visibles, pas de blocages brusques).

## Boucle de jeu (proposition des maquettes 1 et 2, à confirmer)
- Saison de grands prix (circuits différents), une course par « semaine ».
- Entre deux courses : planning de la semaine (essais, soufflerie, repos, médias), achat de voitures (concession neuve et occasion), pièces (moteur, turbo, aéro, pneus, freins), sponsors (argent contre objectifs), pilotes (recrutement, progression).
- Catégories par puissance (150, 300, 500 ch, illimité) : une pièce peut faire sortir la voiture de sa catégorie.

## Questions ouvertes
- Boucle de gestion à valider (pilotes à recruter ou pilote unique ? durée d'une partie, classement ?).
- Prochaine étape proposée : améliorer la simulation et les trajectoires dans la maquette, puis maquette de la gestion (garage, concession, semaine) dans le même style low poly.

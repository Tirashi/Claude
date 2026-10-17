# Armada — cahier des charges

Survivor spatial (genre « Vampire Survivors ») : on pilote un vaisseau amiral, les vaisseaux gagnés rejoignent la flotte et volent en formation. Brainstorm, décisions et maquettes du 17/10 : `IDEES.md` § « Armada ». Maquettes : `maquettes/armada.html` (4 styles, https://claude.ai/artifact/QesFkKzq2XaBiDuQawc2L1) et `maquettes/armada-2.html` (flotte, https://claude.ai/artifact/MR2E43u7PazJpZfn8QcR2E). Les chiffres ci-dessous sont des **valeurs de départ**, à régler avec un pilote automatique (§ 15) puis sur le téléphone.

## 1. Décisions de l'utilisateur (17/10)
- **Titre** : Armada. **DA de Nebula** : vaisseaux en relief de `nebula/vaisseaux.js`, nébuleuse, astéroïdes, pirates rouillés en face, halo bleu sous la flotte pour la distinguer.
- **Partie de 10 minutes**, écran en portrait, un pouce.
- Les « armes » sont des **vaisseaux qui rejoignent la flotte** et volent en **formation**.
- **4 formations disponibles dès le début** (en V, en cercle, en convoi, en carré), en **icônes en bas de l'écran**, semi-transparentes, celle choisie plus opaque.
- **Vaisseaux détruits rachetables** avec les crédits gagnés : choix entre la partie en cours (court terme) et le **chantier naval** (long terme, progression d'une partie à l'autre).
- **Secteur du jour** : même graine pour toute la famille, une seule tentative classée.
- **Boucliers** : c'est la **corvette bouclier** qui donne un bouclier individuel à toute la flotte ; si elle tombe, plus de boucliers.
- **Deux familles de cartes** : les **vaisseaux** (ils rejoignent la flotte) et les **améliorations de flotte** (pour tout le monde).
- **Drones** et **chasseurs** sont deux cartes distinctes (retour du 17/10 : l'essaim de la v1 faisait penser à des drones). Drones : essaim qui colle aux ennemis. Chasseurs : patrouilles de trois, passes d'attaque en ligne droite puis large boucle.
- **Vie des vaisseaux** : par défaut, portraits en haut (façon RPG) **et** arcs autour des vaisseaux ; réglage pour n'en garder qu'un des deux.

## 2. Principe et commandes
- L'amiral avance dans un secteur sans bord (le monde défile, la caméra suit l'amiral). Tout le monde tire tout seul.
- **Joystick flottant** : on pose le pouce n'importe où au-dessus de la bande des icônes, l'amiral va dans cette direction (vitesse proportionnelle à l'écart, plafonnée). Lâcher = l'amiral ralentit et s'arrête en douceur.
- **Formations** : toucher une icône en bas. Le changement prend environ 1 s (les vaisseaux glissent vers leur nouvelle place). Pas de délai de recharge.
- **Pause** : bouton en haut à droite (sous les crédits) ; menu de pause : REPRENDRE, OPTIONS, ABANDONNER, retour à la Ludothèque (classe `ludo-retour` / `!window.ludoArtefact`, règle du 17/10).
- Défaite : l'amiral est détruit. Victoire : le saut en hyperespace à 10:00 (§ 9).

## 3. Écran (d'après les maquettes)
Canvas logique **544 × 960** (comme Nebula, mêmes échelles de sprites), agrandi à l'écran ; zone sûre en haut et en bas.
- **Haut** : barre d'expérience ; `NIV 12` à gauche, chrono `07:42` (compte à rebours depuis 10:00) au centre, crédits `340 CR` à droite ; barre de vie de l'**amiral** (coque + bouclier en bleu au-dessus) ; rangée de **portraits** (un par vaisseau d'escorte, un par groupe de drones / chasseurs avec un voyant par appareil ; épave barrée avec son prix de rachat).
- **Bandeau d'événement** sous les portraits (CORVETTE DETRUITE, CARGO EN APPROCHE…), 3 s.
- **Bas** : les 4 icônes de formation (dessin de la formation en points, un triangle pour l'amiral), le nom de la formation choisie dessous.
- Textes en MAJUSCULES sans accent dans le canvas (Michroma pour les titres, Rajdhani pour le reste, comme Nebula).
- Petits textes flottants : `+1 CHASSEUR`, `-120 CR`, dégâts critiques (facultatif).

## 4. La flotte
### 4.1 L'amiral
Choisi avant la partie (§ 11 pour les déblocages). Il tire lui-même (canon de base vers l'ennemi le plus proche) et ne peut pas être racheté.

| Amiral | Sprite | Bonus | Départ |
|---|---|---|---|
| Cuirassé | `cuirasse` | coque +30 % | 1 frégate |
| Porte-vaisseaux | `mere` | chasseurs relancés 2 fois plus vite | 1 patrouille de 3 chasseurs |
| Convoyeur | `convoyeur` | +25 % de crédits | 1 collecteur |

Coque de départ : 200 (bouclier de l'amiral : 60, seulement avec la corvette).

### 4.2 Vaisseaux d'escorte (une place dans la formation chacun)
**8 places au plus.** Chaque type monte du niveau 1 au niveau 5 (une carte = un niveau) ; certains types peuvent être pris deux fois (deux frégates), chaque exemplaire comptant une place.

| Vaisseau | Sprite | Rôle | Coque | Rachat |
|---|---|---|---|---|
| Frégate laser | `fregate` | rayon perçant toutes les 1,5 s (420 px, traverse les rangs) | 150 | 80 |
| Porte-missiles | `bombardier` | 2 missiles à tête chercheuse par seconde, sur les gros ennemis d'abord | 110 | 80 |
| Canonnière | `artilleur` | salves sur les deux flancs (3 obus de chaque côté) | 120 | 70 |
| Corvette bouclier | `egide` | donne un bouclier à toute la flotte (§ 6) | 130 | 120 |
| Drone mécano | `atelier` | répare le vaisseau le plus abîmé (+30 % toutes les 1,4 s, rayon vert) | 90 | 90 |
| Mouilleur de mines | `mouilleur` | sème une mine toutes les 1,3 s derrière la flotte (explosion 70 px) | 100 | 60 |
| Collecteur | `eclaireur` | attire les gemmes et les crédits de loin (+60 % de portée d'aimant par niveau) | 70 | 50 |
| Brouilleur | `brouilleur` | ralentit les ennemis autour de lui (−30 %) | 90 | 70 |

Niveaux : +20 % de dégâts ou de cadence par niveau (selon le vaisseau), un effet en plus au niveau 3 ou 5 (par exemple la frégate tire deux rayons au niveau 5).

### 4.3 Drones et chasseurs (hors formation)
Ils ne prennent **pas** de place dans la formation ; la formation leur donne une **zone** : en V devant, en cercle autour, en convoi sur les flancs, en carré à l'arrière.
- **Drones** (sprite : un drone tiré du groupe `drones` de Nebula, 18 px) : carte « DRONES », +1 drone par carte, de 2 à 8. Ils collent aux ennemis proches de leur zone et tirent vite, à courte portée. Coque 14.
- **Chasseurs** (`chasseur`, 28 px) : carte « CHASSEURS », +1 chasseur par carte, de 3 à 8 ; ils volent en **patrouilles de trois** (un chef, deux ailiers). Le chef attend dans la zone, choisit un ennemi, fonce en ligne droite à 450 px/s en tirant vers l'avant, continue 0,6 s après la cible puis fait une large boucle (virage limité à 2,8 rad/s) ; les ailiers suivent le chef. Coque 24.
- **Un drone ou un chasseur détruit repart de l'amiral 5 s plus tard**, gratuitement (le « hangar »). Pas de rachat pour eux.

### 4.4 Évolutions (fusions)
Une carte d'évolution n'apparaît que si les deux éléments sont au **niveau 5** (ou au maximum). L'évolution remplace le premier et garde sa place.

| Évolution | Recette | Effet |
|---|---|---|
| Croiseur | Frégate 5 + Corvette 5 | rayon continu qui balaie ; bouclier de la flotte +50 % |
| Escadron d'élite | Chasseurs 8 + Porte-missiles 5 | les chasseurs tirent aussi des missiles |
| Nuée | Drones 8 + Mécano 5 | les drones se réparent et réparent la flotte en la touchant |
| Champ de mines | Mouilleur 5 + Brouilleur 5 | les mines ralentissent et explosent en chaîne |
| Bordée | Canonnière 5 + Amélioration « Cadence » 5 | salves tout autour, en rafales |
| Aspirateur | Collecteur 5 + Amélioration « Aimant » 5 | toutes les gemmes de l'écran arrivent toutes les 20 s |

## 5. Formations
Toutes disponibles dès le début. Chaque formation donne un **petit bonus**, pour qu'on en change selon la vague.

| Formation | Placement | Bonus |
|---|---|---|
| En V | escorte en deux ailes derrière l'amiral | +15 % de dégâts vers l'avant |
| En cercle | escorte en cercle (rayon ~115 px) | dégâts subis −10 % (attaques de tous les côtés) |
| En convoi | l'escorte suit le chemin de l'amiral, comme Snake | canonnières et mines +25 % |
| En carré | grille autour de l'amiral, la corvette au centre si elle est là | boucliers +25 % |

Placement : ordre fixe des places (les vaisseaux fragiles, corvette et mécano, vers le centre ou l'arrière). Pas de placement manuel dans la première version (idée pour plus tard).

## 6. Boucliers, vie, réparation
- **Boucliers** : seulement quand la corvette est là. Chaque vaisseau a une réserve (24, drones et chasseurs 6, amiral 60 ; +20 % par niveau de corvette) qui encaisse les coups en premier et **se recharge après 3 s sans être touché** (50 % de la réserve par seconde). Impact absorbé : éclat hexagonal bleu.
- **La corvette tombe** : tous les boucliers disparaissent aussitôt, bandeau « CORVETTE DETRUITE / BOUCLIERS HORS SERVICE ». La racheter les remet en route.
- **Vie** : sous la moitié, le vaisseau fume ; sous le quart, il clignote en rouge (et son portrait aussi). Le mécano soigne le plus abîmé.
- **Affichage** (réglage `armada.opts.vie`) : `deux` (par défaut), `autour` (arcs seulement), `haut` (portraits seulement). Arcs : coque (vert > 60 %, orange > 30 %, rouge) et bouclier en bleu autour ; rien quand le vaisseau est intact.
- **Épave** : un vaisseau d'escorte détruit laisse son portrait barré avec son prix ; sa place dans la formation reste vide jusqu'au rachat.

## 7. Cartes de montée de niveau
- Les ennemis lâchent des **gemmes** (petites, grosses) : l'expérience remplit la barre ; chaque niveau met le jeu en pause et propose **3 cartes** (4 avec une amélioration du chantier naval).
- Familles : **vaisseau** (nouveau ou niveau suivant), **amélioration de flotte**, **évolution** (quand elle est possible, toujours proposée, cadre doré).
- **Améliorations de flotte** (niveau 1 à 5) : Blindage (+15 % de coque), Réacteurs (+8 % de vitesse), Aimant (+30 % de portée), Cadence (+8 % de cadence de tir), Munitions (+10 % de dégâts), Hangar (drones et chasseurs relancés plus vite).
- Sous les cartes : la ligne **ÉPAVE** pour racheter un vaisseau détruit (§ 8), et un bouton **RELANCER** les cartes (1 fois par partie, plus avec le chantier naval).
- Pas de carte possible (tout au maximum) : +50 crédits.
- Rythme visé : environ 25 à 30 niveaux en 10 minutes (un toutes les 20 s en moyenne, plus vite au début).

## 8. Crédits, rachat, score
- **Crédits** : un peu à chaque ennemi (ramassés comme les gemmes), des primes aux événements et aux boss.
- **Rachat** : possible **à la montée de niveau** (ligne ÉPAVE) et à la **station de ravitaillement** (§ 9). Prix de base du tableau 4.2, **×1,5 à chaque rachat du même vaisseau** dans la partie, pour que le choix reste réel. Le vaisseau revient au niveau qu'il avait.
- **En fin de partie**, les crédits non dépensés vont au **chantier naval** (en entier si victoire, à moitié si défaite).
- **Score** (classement) : ennemis abattus × points selon le type + 1 000 par boss + 2 000 pour le saut réussi + crédits gardés. En cas de défaite, le score compte jusqu'à la destruction de l'amiral.

## 9. Déroulé des 10 minutes
Les ennemis arrivent en continu, de plus en plus nombreux et coriaces (environ 40 à l'écran au début, 150 au maximum, plafond pour la fluidité). Événements à heures fixes :

| Chrono | Événement |
|---|---|
| 10:00 → 8:00 | ouverture : intercepteurs |
| 8:00 | **cargo à escorter** jusqu'à une porte de saut (60 s) : s'il arrive, +150 CR et une carte |
| 7:00 | **mini-boss** : croiseur pirate (`croiseur`) |
| 5:30 | **station de ravitaillement** (20 s à l'arrêt près d'elle) : rachat des épaves, réparation de 50 % contre crédits |
| 4:30 | **essaim de brûlots** venu d'un côté (bandeau d'alerte) |
| 3:30 | **défense** d'une balise pendant 45 s |
| 2:00 | **boss final** : la Reine pirate (`reine`), escortée par la Veuve (`veuve`) |
| 0:00 | **saut en hyperespace** : victoire (son « saut » de Nebula). Boss pas abattu : le saut se fait quand même, sans la prime de boss |

## 10. Ennemis (pirates de Nebula)
| Ennemi | Sprite | Comportement | Arrivée |
|---|---|---|---|
| Intercepteur | `intercepteur` | fonce au contact, fragile | dès le début |
| Brûlot | `brulot` | kamikaze : explose au contact (gros dégâts de zone) | 8:30 |
| Harponneur | `harponneur` | garde ses distances et tire | 7:30 |
| Poseur de mines | `poseur` (mines `mine`) | sème des mines sur le chemin | 6:00 |
| Croiseur | `croiseur` | lent, très solide, tourelles | mini-boss puis rare dès 5:00 |
| Veuve | `veuve` | harponne un vaisseau d'escorte et le tire hors de la formation | boss |
| Reine | `reine` | boss final : vagues de renforts, salves en éventail | 2:00 |

Les ennemis visent l'amiral, mais tapent tout ce qu'ils touchent en chemin (contact) ; les tireurs visent le vaisseau le plus proche.

## 11. Chantier naval (progression d'une partie à l'autre)
Écran entre les parties, dans le style des menus de Nebula. Les crédits gardés s'y dépensent :
- **Débloquer des vaisseaux** dans le tirage des cartes : au départ frégate, porte-missiles, canonnière, corvette, chasseurs, drones ; à débloquer : mécano, mouilleur, collecteur, brouilleur (et les évolutions qui en dépendent).
- **Débloquer des amiraux** : cuirassé au départ ; porte-vaisseaux et convoyeur à acheter.
- **Améliorations permanentes** (5 niveaux, prix croissants) : coque de l'amiral, aimant, crédits gagnés, relances de cartes (+1), 4e carte au choix (1 niveau).
- Prix indicatifs : vaisseau 300 à 600 CR, amiral 1 000 CR, amélioration 150 → 900 CR. À régler pour qu'une partie moyenne rapporte environ 300 CR.

## 12. Secteur du jour
- Graine = date (`AAAAMMJJ`) : mêmes vagues, mêmes événements et **même ordre de cartes** pour toute la famille.
- **Sans le chantier naval** pour que ce soit juste : cuirassé, tous les vaisseaux dans le tirage, aucune amélioration permanente.
- **Une seule tentative classée par jour**, comptée dès le départ (règle des défis du jour, comme les missions de Nebula) ; on peut rejouer ensuite pour le plaisir, sans classement.
- Les crédits du secteur du jour vont quand même au chantier naval (sans changer la partie classée).

## 13. Options
Affichage de la vie (deux / autour / haut), son, musique, vibration aux coups reçus (si le téléphone le permet), écran bloqué en portrait pendant la partie (comme Odyssée).

## 14. Sons et musique
Reprendre `nebula/sons.js` (`NebulaSons.play(...)`) : `laser` (frégate), `missile`, `canon` (canonnière, amiral), `mine`, `bouclier` (impact absorbé), `coque`, `explosion`, `soin` (mécano), `saut` (hyperespace), `bip` / `valide` (cartes), `renforts` (boss), `victoire`, `defaite`. Ambiance « Tension II » en partie, « Garde » dans les menus. Avec 150 ennemis : limiter les sons simultanés (au plus 1 explosion toutes les 80 ms, tirs des drones et chasseurs muets ou très discrets).

## 15. Technique
- Fichiers : `armada/index.html` (moteur, écrans), `armada/regles.js` (données : vaisseaux, cartes, évolutions, ennemis, déroulé, prix ; partagé avec les outils de test). Charge `nebula/vaisseaux.js`, `nebula/sons.js`, `ludo-scores.js`. Scripts classiques, pas de build.
- Sprites des petits vaisseaux et des ennemis **précalculés** à leur taille (sans lueur) ; seuls l'escorte et l'amiral passent par `drawShip` (maquette : 120 ennemis fluides).
- Objets en **tableaux réutilisés** (tirs, particules, gemmes) et **grille spatiale** pour les collisions (ennemis × tirs, ennemis × flotte).
- Hasard à graine partout dans la simulation (secteur du jour reproductible) ; pas de `Math.random()` dans la simulation.
- Pas de partie sauvegardée en cours de route (10 minutes) ; quitter l'application = partie perdue, sauf le secteur du jour, déjà compté.
- `window.Armada` exposé pour les tests (état, `step(dt)`, choix de carte).
- **Pilote automatique** `outils/armada-simulateur.js` (Node, sans affichage, sur `regles.js`) : parties simulées avec des choix de cartes simples, pour régler la difficulté (temps de survie, niveaux atteints, crédits gagnés) comme pour Nebula.

## 16. Sauvegarde, classements, intégration
- Sauvegardes : `armada.best` (meilleur score), `armada.credits`, `armada.chantier` (déblocages, améliorations), `armada.amiral` (choisi), `armada.opts`, `armada.victoires`, `armada.dailyRun` (tentative du jour). Toutes dans le transfert `LUDO1-`.
- Classement `armada` : `best` (score, le plus haut gagne) et `daily:AAAAMMJJ` ; éventuellement `victoires`.
- Suivre la **liste de contrôle « Ajouter un nouveau jeu »** de `specs/ludotheque.md` : accueil (famille de cartouche, icône, `META`, `NEWS`), volet et `RANKS`, `sw.js`, transfert, `fumee.js`, artefact (à créer après avoir demandé à l'utilisateur), docs.

## 17. Plan de travail proposé (Opus, une conversation par session)
1. **Session 1, le moteur** : déplacement, caméra, formations et icônes, amiral cuirassé, 4 vaisseaux (frégate, porte-missiles, canonnière, corvette), drones et chasseurs, boucliers et vie (les deux affichages), intercepteurs et harponneurs, gemmes, cartes de base, chrono et fin de partie. Pilote automatique minimal. Artefact.
2. **Session 2, le contenu** : tous les vaisseaux, améliorations, évolutions, rachat et épaves, tous les ennemis, événements et boss, station, saut final, sons et musique, réglages de difficulté avec le pilote.
3. **Session 3, l'intégration** : chantier naval et amiraux, secteur du jour, score et classements, accueil, transfert, options, tests, docs.

## 18. Points à confirmer avec l'utilisateur
- Les trois amiraux et leurs bonus (§ 4.1).
- La liste des vaisseaux d'escorte (8 types) et des évolutions (§ 4.2, 4.4).
- Les bonus des formations (§ 5).
- Le prix du rachat qui monte (×1,5) et les deux moments de rachat (cartes et station) (§ 8).
- Les crédits gardés à moitié en cas de défaite (§ 8).
- Le déroulé et les deux boss (§ 9).
- Le secteur du jour sans chantier naval (§ 12).

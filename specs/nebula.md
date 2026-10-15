# Cahier des charges — NEBULA (rogue-lite tactique spatial)

> Préparé le 13/10/2026. Jeu n° 1 d'un univers en deux jeux : **Nebula** (ce rogue-lite) puis **Nebula : l'Empire des étoiles** (jeu familial multijoueur, plus tard). Les combats tactiques de Nebula sont l'équivalent des missions de flotte de l'Empire : mêmes vaisseaux, mêmes rôles.
> Les valeurs chiffrées sont une **première proposition** : à ajuster en jouant, avant la mise en production.

## 1. Références à lire avant de coder
- **`maquettes/nebula-chantier-naval.html`** : la **référence des vaisseaux** (moteur de sprites + 11 vaisseaux du joueur + 5 pirates, noms, rôles, jauges). Artefact : https://claude.ai/artifact/8umubGbkPTmeoTvKtmSPX8
- **`maquettes/nebula.html`** : maquette des écrans (titre, carte de navigation, combat, hangar), décor (nébuleuse, planètes, astéroïdes) et interface. Artefact : https://claude.ai/artifact/4NpBo4SY7oDYSwc2GnJKoD
- `CLAUDE.md` : règles du dépôt et liste de contrôle « Ajouter un nouveau jeu ».

## 2. Direction artistique (validée par l'utilisateur)
- **Réaliste, pas « jouet »** : vaisseaux en relief (cartes de hauteurs, ombres portées, rainures de plaques, reflets, hublots), **pas de contour noir**, couleurs sombres.
- Flotte du joueur : **acier sombre + marquages ambre**, réacteurs bleutés. Pirates : **tôle rouillée, ferraille, bandes de danger jaunes/noires**, réacteurs orangés, lumières rouges.
- Décor : nébuleuse en bruit fractal, étoiles fines, planètes avec atmosphère, astéroïdes texturés.
- Interface « tableau de bord » : cadres fins à coins marqués, **accent ambre `#f2b24a`** (l'ambiance cyan a été écartée), rouge `#ff5a4a` pour l'ennemi, bleu `#7fc4ff` pour les alliés, vert `#8fe0a0` pour la coque.
- Polices (Google Fonts) : **Michroma** (titre), **Rajdhani** 500–700 (interface), **Share Tech Mono** (chiffres). Ce ne sont pas des polices pixel : les majuscules accentuées s'affichent (vérifier tout de même É, È, À).
- Nom affiché : **NEBULA**, sous-titre « ROGUE-LITE TACTIQUE ». Sur l'écran titre : « BIENTÔT · NEBULA : L'EMPIRE DES ÉTOILES ».

## 3. Technique
- Dossier `nebula/` : `index.html` (affichage, commandes, sauvegarde) + **`nebula/regles.js`** (logique pure : combat, IA, carte, comptoir, score, `migrate()` ; chargée aussi par Node pour le simulateur) + **`nebula/vaisseaux.js`** (moteur de sprites extrait du catalogue, avec `builder`, `render`, `SHIPS`, `MAT`, décor), **réutilisé plus tard par l'Empire**. Ajouter les deux à `FILES` de `sw.js` et changer `VERSION`.
- Canvas en **544×960 pixels logiques** (densité ×2 par rapport aux jeux 272×480 de la ludothèque), agrandi à l'écran comme les autres jeux (`resize()`), lissage activé pour les réductions.
- Sprites générés une fois au chargement (mesurer le temps ; si > 300 ms, les générer à la demande et les garder en cache).
- Gabarit commun : bouton ◀ MENU dans l'appli installée, service worker, `<script src="../ludo-scores.js">`, `window.Nebula` exposé pour les tests (état, simulateur de combat, générateur de carte).
- Sauvegardes `localStorage` préfixées `nebula.` : `nebula.run` (partie en cours, sauvegardée **à chaque balise** et à chaque fin de tour de combat), `nebula.meta` (données stellaires, déblocages, statistiques), `nebula.best`, `nebula.daily`.
- Tout aléatoire passe par un **générateur à graine** (mulberry32) : même graine = même carte, mêmes combats, mêmes récompenses (indispensable pour la partie du jour).

## 4. Boucle de jeu
1. Choix de la flotte de départ (une seule au début, d'autres à débloquer).
2. **3 secteurs**. Chaque secteur est une carte de navigation (§ 6) de 7 étages de balises + l'amiral du secteur.
3. À chaque balise : combat, comptoir, épave, nébuleuse ou dock.
4. Victoire après le 3e amiral ; défaite si toute la flotte est détruite.
5. Fin de partie : score, **données stellaires** gagnées, déblocages (§ 9).
Durée visée : 20 à 40 minutes. On peut quitter à tout moment et reprendre.

## 5. Combat tactique
### Grille et placement
- Grille de **7 colonnes × 9 lignes**, cases de 72 px. Le joueur se place sur les **3 lignes du bas**, les pirates arrivent par le haut.
- Les vaisseaux sont **toujours verticaux** (nez vers l'ennemi), ne pivotent pas, et occupent **1, 2 ou 3 cases** dans leur colonne.
- Obstacles : **astéroïdes** (1 case, bloquent déplacements et tirs directs), **nuages ioniques** (1 à 2 cases : un vaisseau qui y finit son tour perd son bouclier), **nébuleuse** (zone : on ne peut pas viser un vaisseau caché dedans à plus de 2 cases).

### Déroulement d'un tour
1. **Début du tour** : boucliers +1 (jusqu'au maximum), effets de début de tour (réparation, bulle de l'Égide, baies du porte-vaisseaux).
2. **Les pirates affichent leurs intentions** : chaque pirate montre ce qu'il fera à la fin du tour (déplacement prévu en pointillés, puis **trait rouge + case visée + dégâts prévus**). Une intention vise une **case**, pas un vaisseau : si le joueur déplace le vaisseau hors de la case, le tir part dans le vide. C'est le cœur tactique (esprit *Into the Breach*).
3. **Tour du joueur** : chaque vaisseau peut, dans l'ordre voulu, **se déplacer** (jusqu'à sa vitesse, en cases orthogonales, chemin libre, son emprise entière doit tenir) **et agir une fois** (arme ou capacité). Un vaisseau choisi montre en bleu les emprises où il peut aller, et sa portée.
4. **FIN DU TOUR** : les pirates exécutent leurs intentions dans l'ordre affiché, puis le tour suivant commence.

### Règles de tir
- Distance = nombre de cases entre les cases les plus proches des deux emprises (distance de Tchebychev).
- **Ligne de vue** : un astéroïde entre les deux vaisseaux bloque les tirs directs (laser, canon, torpille). Les missiles de l'artilleur passent par-dessus.
- Dégâts : d'abord le **bouclier**, puis la **coque**. Coque à 0 = vaisseau détruit (explosion, débris).
- Une case visée d'un gros vaisseau touche le vaisseau entier (un 3 cases est donc plus facile à toucher : il offre 3 cases).
- Petite animation pour chaque tir (laser = trait, missile = traînée, torpille = projectile lent) ; nombres de dégâts flottants.

### Caractéristiques (traduction des jauges du catalogue)
| Vaisseau | Cases | Coque | Bouclier | Vitesse | Arme (dégâts / portée) | Capacité |
|---|---|---|---|---|---|---|
| Chasseur | 1 | 6 | 1 | 4 | Canons 2 / 3 | **Riposte** : une fois par tour pirate, tire 1 dégât sur un pirate qui termine son déplacement à 2 cases ou moins. |
| Éclaireur | 1 | 3 | 0 | 5 | Canon 1 / 4 | **Repérage** : montre aussi les déplacements des pirates du tour suivant ; ignore la règle de la nébuleuse. |
| Bombardier | 1 | 6 | 0 | 2 | Torpilles lourdes 3 / 2 | **Dégâts ×2** contre les vaisseaux de 2 et 3 cases. |
| Nuée de drones | 1 | 5 drones (1 dégât = 1 drone) | 0 | 4 | Essaim, portée 1 | **Essaim** : chaque pirate sur les 8 cases autour subit 2 dégâts (1 s'il reste 2 drones ou moins). |
| Frégate | 2 | 10 | 2 | 3 | Laser 3 / 3 **ou** missile 2 / 5 | **Double armement** : choix de l'arme à chaque tour. |
| Égide | 2 | 10 | 4 | 2 | Canon 1 / 2 | **Bulle** : en début de tour, +1 bouclier aux alliés adjacents (peut dépasser leur maximum de 1). |
| Convoyeur | 2 | 8 | 1 | 2 | — | **Soute** : +50 % de crédits et de carburant gagnés tant qu'il est en vie ; s'il est détruit, on perd 20 crédits. |
| Artilleur | 2 | 7 | 1 | 2 | Salve 2 sur une zone 2×2 / portée 3 à 6 | **Tir indirect** : passe par-dessus les astéroïdes ; ne peut pas tirer à moins de 3 cases. |
| Porte-vaisseaux | 3 | 16 | 3 | 1 | Canons 2 / 3 | **Baies** : tous les 2 tours, lance un chasseur léger (coque 3, sans bouclier) ou une nuée de 3 drones sur une case libre adjacente ; 2 lancés en jeu au maximum ; ils disparaissent après le combat. |
| Cuirassé | 3 | 16 | 2 | 1 | 2 tourelles 3 / 4 | **Bordée** : les deux tourelles avant peuvent viser deux cibles différentes. |
| Atelier mobile | 3 | 14 | 2 | 1 | — | **Réparation** : +2 coque aux alliés adjacents en début de tour ; après chaque combat, +3 coque à toute la flotte. |
| *Pirates* | | | | | | |
| Intercepteur | 1 | 4 | 0 | 4 | Canon 2 / 3 | **Meute** : +1 dégât s'il est adjacent à un autre intercepteur. Vise le vaisseau le plus proche. |
| Brûlot | 1 | 3 | 0 | 4 | — | **Charge** : fonce vers le plus gros vaisseau ; au contact, explose : 5 dégâts sur la case visée, 2 sur les cases autour. Détruit avant : explose sur place (2 autour, pirates compris). |
| Croiseur pirate | 2 | 10 | 2 | 2 | Torpille 4 / 6 | Vise en priorité les vaisseaux de 3 puis de 2 cases. |
| Harponneur | 2 | 10 | 1 | 2 | Canon 2 / 2 | **Grappin** (portée 3) : attire un vaisseau de 1 case de 2 cases vers lui au lieu de tirer. |
| Amiral rouillé | 3 | 30 | 3 | 1 | 3 tourelles 3 / 4 | **Renforts** : tous les 3 tours, appelle 2 intercepteurs (par le haut de la grille). Boss du secteur 1. |

Les amiraux des secteurs 2 et 3 (à inventer, même style) : **la Veuve d'Orphée** (secteur 2, porte-drones pirate) et **la Rouille-Reine** (secteur 3, cuirassé géant de 3 cases avec bouclier régénérant).

### IA des pirates (simple et lisible)
- En début de tour : chaque pirate choisit sa cible selon sa règle (tableau), avance pour l'avoir à portée **et** en ligne de vue (chemin le plus court), puis annonce son tir sur **la case de la cible la plus proche de lui**.
- Si aucune cible n'est atteignable, il se rapproche et n'annonce rien.
- Le tir d'un pirate peut toucher un autre pirate qui se trouve sur la case au moment du tir (tir allié : à exploiter, par exemple avec le grappin ou les brûlots).

### Fin du combat
- Victoire : tous les pirates détruits. Récompenses : **crédits** (20 à 35 pour un contact, 50 à 70 pour un contact lourd), parfois des **pièces** (réparations) ou un **module** (garanti en contact lourd).
- Un vaisseau détruit est **perdu pour la partie**. On peut **fuir** depuis le 3e tour si tous ses vaisseaux sont sur la ligne du bas : pas de récompense, -1 carburant.

## 6. Carte de navigation (un secteur)
- 7 étages de 2 à 3 balises, puis l'amiral. Chaque balise est reliée à 1 ou 2 balises de l'étage suivant ; on voit les types de toutes les balises.
- Répartition par secteur : contacts ~45 %, contacts lourds 2 (étages 3 à 6), 1 à 2 comptoirs, 1 à 2 épaves, 1 nébuleuse, 1 dock juste avant l'amiral (au moins un chemin y passe).
- **Carburant** : départ 6, -1 par saut ; à 0, on saute quand même mais chaque vaisseau perd 2 de coque (« dérive »).
- Secteurs : 1 **Ceinture de Karn** (astéroïdes), 2 **Nébuleuse d'Orphée** (nuages ioniques, nébuleuse), 3 **Le Seuil** (mélange, pirates plus nombreux). Difficulté : +1 pirate et pirates plus résistants (+20 % de coque) par secteur.

### Balises
- **Contact** : combat contre 2 à 4 pirates (tirés selon le secteur).
- **Contact lourd** : combat plus dur, module garanti.
- **Comptoir** : carburant (10 cr l'unité), réparation (3 cr par point de coque), 3 modules à vendre (40 à 80 cr), 1 vaisseau à recruter (80 à 150 cr, si la flotte a moins de 5 vaisseaux).
- **Épave** : petit événement avec 2 ou 3 choix (une douzaine à écrire). Exemples : fouiller la soute (crédits ou piège), récupérer un pilote survivant, capter un signal de détresse (combat ou récompense), réparer une balise (carburant).
- **Nébuleuse** : combat avec zones de nébuleuse, ou événement calme (au hasard).
- **Dock** : réparation gratuite de 50 % de la coque perdue **ou** installation d'un module gratuit.

## 7. Améliorations
- **Modules** : 3 emplacements par vaisseau (2 pour les 1 case). Liste de départ : Blindage (+3 coque), Bouclier renforcé (+1 bouclier), Propulseurs (+1 vitesse), Ciblage (+1 portée), Canons Mk2 (+1 dégât), Réparateurs (+1 coque par tour), Brouilleur (les tirs ennemis sur ce vaisseau font -1 dégât), Capteurs (révèle les intentions du tour suivant pour ce vaisseau).
- **Pilotes** (un par vaisseau, recrutés au comptoir ou dans les épaves) : As (+1 vitesse), Mécano (+1 coque par tour), Tireur (+1 dégât), Prudent (+1 bouclier), Vétéran (+1 coque max par combat gagné, jusqu'à +4).

## 8. Flottes de départ
- **Flotte d'escorte** (dès le début) : porte-vaisseaux, frégate, chasseur.
- **Flotte de choc** (à débloquer) : cuirassé, bombardier, chasseur.
- **Flotte marchande** (à débloquer) : convoyeur, égide, frégate, éclaireur (plus de crédits, moins de puissance).
- Maximum **5 vaisseaux** dans la flotte.

## 9. Progression entre les parties (méta)
- **Données stellaires** gagnées en fin de partie : 10 par secteur atteint, 3 par contact lourd gagné, 20 par amiral vaincu.
- Déblocages (types qu'on peut ensuite trouver au comptoir) : éclaireur 15, bombardier 25, nuée de drones 35, égide 45, convoyeur 30, artilleur 55, cuirassé 90, atelier mobile 90 ; flotte de choc 60, flotte marchande 80.
- Écran **Déblocages** depuis le titre : liste avec coût et état.

## 10. Score et classements (Supabase, sans nouveau SQL)
- Score d'une partie = 1000 par secteur terminé + 20 par pirate détruit + crédits restants + 3000 en cas de victoire finale.
- Tableaux `LudoScores` (jeu `nebula`) : `best` (meilleur score), `daily:AAAAMMJJ` (partie du jour), `victoires` (nombre de victoires).
- **Partie du jour** : graine = date, même carte et mêmes combats pour toute la famille ; une seule tentative classée par jour (on peut rejouer hors classement).
- Page des classements : vues MEILLEUR SCORE, PARTIE DU JOUR (avec flèches pour les jours précédents), VICTOIRES. `registerExisting`, `PSEUDO_BOARDS`, incrémenter `SYNC`.

## 11. Écrans
1. **Titre** (comme la maquette) : NOUVELLE PARTIE, PARTIE DU JOUR, REPRENDRE (si une partie est en cours), HANGAR / DÉBLOCAGES, MANUEL, CLASSEMENT, SON.
2. **Choix de la flotte**.
3. **Carte de navigation** (comme la maquette) avec carburant, crédits et flotte en bas.
4. **Combat** (comme la maquette) : fiche du vaisseau choisi en bas, boutons d'arme, FIN DU TOUR, ANNULER LE DÉPLACEMENT (tant que le vaisseau n'a pas agi).
5. **Comptoir**, **Épave** (texte + choix), **Dock**.
6. **Hangar** (flotte, modules, pilotes ; glisser un module sur un emplacement).
7. **Manuel** : les fiches des vaisseaux (reprendre le catalogue), les règles en 6 courtes rubriques. Les jauges y sont expliquées.
8. **Fin de partie** : score, place au classement, données stellaires gagnées.

## 12. Tutoriel
Le **premier combat** de la première partie est guidé en 5 bulles : choisir un vaisseau → le déplacer hors d'une case visée en rouge → tirer → comprendre le bouclier → FIN DU TOUR. Désactivable ; rejouable depuis le Manuel.

## 13. Sons
Bruitages WebAudio discrets et graves (pas de chiptune) : laser, canon, missile, explosion, bouclier touché, saut hyperspatial, clic d'interface. Une nappe d'ambiance optionnelle (coupée par défaut).

## 14. Intégration Ludothèque (liste de contrôle de CLAUDE.md)
Cartouche dans le menu (icône 16×16 : silhouette de vaisseau ambre), transfert de sauvegarde (`nebula.meta`, `nebula.best`, `nebula.daily` : collecte, description, fusion qui garde le meilleur), classements, `sw.js`, README, CLAUDE.md (tableau des jeux + lien d'artefact), IDEES.md (✅), artefact publié (copie autonome via `outils/artefact.py`, en vérifiant qu'il intègre `vaisseaux.js`).

## 15. Découpage en sessions
- **Session 1** (prioritaire, jouable de bout en bout) :
  - `nebula/vaisseaux.js` extrait du catalogue ;
  - combat complet (grille, intentions, déplacements, tirs, ligne de vue, boucliers, IA) ;
  - **secteur 1** complet avec l'amiral rouillé ;
  - balises contact, contact lourd, comptoir, dock ;
  - vaisseaux : chasseur, frégate, porte-vaisseaux, bombardier, nuée de drones, égide ; pirates : intercepteur, brûlot, croiseur, amiral ;
  - modules (4 ou 5), score, sauvegarde, intégration Ludothèque, classement `best`, artefact.
- **Session 2** : secteurs 2 et 3 et leurs amiraux, épaves et nébuleuses (événements), autres vaisseaux (éclaireur, convoyeur, artilleur, cuirassé, atelier, harponneur), pilotes, méta-progression et déblocages, flottes de départ, partie du jour.
- **Session 3** : tutoriel, manuel, équilibrage, finitions (animations, sons).

## 16. Tests
- Simulateur de combat sans affichage dans `window.Nebula` : faire jouer des combats automatiques (IA joueur simple) pour vérifier qu'aucun combat n'est impossible ni trivial, et que la partie du jour est identique à graine égale.
- Captures Playwright sur téléphone (390×780) de chaque écran, avec `outils/captures.js`.
- Classements avec `outils/faux-classements.js`.

## 17. Session 1 : ce qui a été fait, écarts et réglages
- **Pirates** : ils se déplacent **au début du tour** (déplacement animé), puis annoncent leurs tirs ; les tirs partent à la FIN DU TOUR (choix de l'utilisateur).
- **Équilibrage** (choix de l'utilisateur d'après `outils/nebula-simulateur.js`) : avec les valeurs du § 5, une IA attentive esquivait tout (0 coque perdue). Réglages : la **torpille du croiseur et les tourelles de l'amiral font 2 dégâts sur les 4 cases voisines** de la case visée (`TUNE.cross`), et le secteur 1 a des pirates **+50 % de coque** et **+1 pirate** par combat (`SECTORS[0].mult`, `extra`). Résultat de l'IA attentive : contact ≈ 1–2 de coque perdue, contact lourd ≈ 7, amiral ≈ 1 ; une IA qui ignore les annonces perd l'amiral.
- **Fin de partie** : après l'amiral du secteur 1, la partie se termine (« SECTEUR LIBÉRÉ ») ; les +3000 de victoire finale viendront avec le secteur 3.
- Modules de la session 1 : blindage, bouclier renforcé, propulseurs, ciblage, canons Mk2 (posés au hangar en touchant module puis emplacement, au lieu de les glisser).
- Récompenses : contact 20–35 cr (+1 carburant une fois sur deux, module 1 fois sur 4), contact lourd 50–70 cr, 1 carburant et un module, amiral 100 cr et un module. Départ : 40 crédits, 6 carburant.
- Baies du porte-vaisseaux : bouton BAIE (prêt tous les 2 tours), sans consommer l'action du porte-vaisseaux ; le vaisseau lancé agit au tour suivant.
- Pas encore : épaves, nébuleuses, partie du jour (bouton grisé), données stellaires et déblocages (comptées dans `nebula.meta`, pas encore dépensables), tutoriel, manuel (un écran RÈGLES en 6 rubriques le remplace), nappe d'ambiance.

## 18. À faire en session 2 (retours de l'utilisateur)
> Avancement : voir § 19. Faits à l'étape 1 : capacités visibles, carte lisible, drones au toucher, IA par score.

- **Capacité de chaque vaisseau visible** : la fiche de combat d'un vaisseau du joueur doit afficher sa capacité (ex. « BULLE : +1 bouclier aux alliés voisins », « RIPOSTE… », « BAIES… »), comme c'est déjà le cas pour les pirates ; idem sur la carte de chaque vaisseau dans le **hangar**. Pour **tous** les vaisseaux (chasseur, frégate, porte-vaisseaux, bombardier, drones, égide, et les nouveaux de la session 2). Aujourd'hui elle n'apparaît qu'au comptoir (recrue).
- **Carte du secteur plus lisible** : indiquer au joueur ce que veut dire chaque icône de balise (contact, contact lourd, comptoir, dock, amiral ; puis épave et nébuleuse en session 2). Pistes : une petite légende repliable (bouton « ? » ou bandeau en bas de la carte), le nom de la balise sous **chaque** icône (pas seulement les sauts possibles), et/ou une info-bulle quand on touche une balise (nom + ce qu'on y trouve : « Combat contre 2 à 4 pirates », « Combat difficile, module garanti », « Carburant, réparations, modules, recrues »…).
- **Attaque des drones plus fluide** : pour tous les autres vaisseaux, on touche le vaisseau puis un ennemi entouré en jaune et l'attaque part. Pour le drone, même quand un ennemi est entouré en jaune, il faut passer par le bouton en bas de l'écran, ce qui casse le rythme. À harmoniser : toucher un ennemi entouré en jaune doit attaquer directement avec le drone (le bouton ne servant plus qu'aux actions sans cible, ou plus du tout).
- **Difficulté** (retour après une dizaine de parties au doigt) : le secteur 1 est « un chouïa facile » (un seul vaisseau perdu en une dizaine de parties). C'est acceptable, voire voulu : le secteur 1 sert de prise en main et laisse le temps de se construire une flotte solide. **Juger la difficulté sur l'ensemble des 3 secteurs** : la montée en difficulté doit venir des secteurs 2 et 3 (pirates plus nombreux et plus solides, nouveaux pirates, amiraux plus durs), avec l'objectif qu'une flotte mal construite ne passe pas le secteur 3. Ne retoucher le secteur 1 qu'à la marge (éventuellement un contact lourd un peu plus mordant), et régler les secteurs 2 et 3 avec `outils/nebula-simulateur.js` puis en vraies parties.
- **IA des pirates plus agressive** (retour du 14/10) : aujourd'hui les pirates bougent peu. Ils devraient se déplacer davantage et chercher à **coincer** les vaisseaux du joueur : viser les cases de repli, se placer pour que plusieurs tirs couvrent toutes les cases où le vaisseau pourrait fuir (il doit alors choisir quel dégât encaisser), bloquer un passage entre astéroïdes, encercler un vaisseau isolé, se concentrer sur le plus abîmé. Proposition de progression par secteur (à valider) : **secteur 1** comportement actuel (prise en main) ; **secteur 2** on ajoute ces comportements (déplacements plus francs, tirs croisés sur les cases de repli, chasse au vaisseau isolé) ; **secteur 3** on les renforce (coordination de toute la flotte pirate, pièges systématiques, amiral qui joue avec ses escortes). Réglage via un niveau d'IA par secteur dans `SECTORS` (ex. `ai: 0/1/2`) et vérification au simulateur que les combats restent gagnables avec une flotte bien construite.

## 19. Session 2 : découpage et avancement
Découpage validé par l'utilisateur le 14/10 (chaque étape jouable, testée, poussée, artefact republié) :
1. ✅ **Retours § 18 + IA + types** (14/10).
2. ✅ Nouveaux vaisseaux : éclaireur, convoyeur, artilleur, cuirassé, atelier ; pirate harponneur (14/10). Avec le confort de placement demandé après l'étape 1.
3. ✅ Secteurs 2 (Nébuleuse d'Orphée, la Veuve d'Orphée) et 3 (Le Seuil, la Rouille-Reine), victoire finale +3000 (14/10). `RUN_V` reste à 1 : la partie n'a pas gagné de champ (le terrain est dans le combat, absent = pas de terrain).
4. ✅ `nebula/evenements.js` : épaves et nébuleuses ; pilotes (14/10).
5. ✅ Données stellaires dépensables, écran DÉBLOCAGES, flottes de choc et marchande (14/10).
6. ✅ Partie du jour, tableaux `daily:AAAAMMJJ` et `victoires`, équilibrage final (14/10). **Session 2 terminée.**

### Étape 1 (14/10)
- **Capacités** : champ `short` de `TYPES` (une ligne) affiché sous la coque sur la fiche de combat (à la place de l'aide « touche un pirate encadré ») et sur chaque carte du hangar ; `sdesc` reste la version longue (comptoir, pirates).
- **Carte** : nom sous chaque balise (en petit, grisé si visitée ; pas sous la balise où est la flotte) ; toucher une balise qui n'est pas à portée ouvre sa fiche (nom, ICI / VISITÉE / À PORTÉE / PLUS LOIN, ce qu'on y trouve : `NODE_INFO`) ; toucher une balise à portée saute toujours directement ; bouton **? LÉGENDE** en bas à droite.
- **Drones** : toucher un pirate collé à la nuée (encadré en jaune, dégâts affichés) lance l'essaim ; le bouton ESSAIM reste.
- **IA par score** (`planScored`, poids dans `AI_LEVELS`) : le joueur est supposé se replier sur la position la moins touchée ; chaque pirate note chaque case d'arrivée et chaque case visée (cases de repli couvertes en tenant compte des tirs déjà annoncés, prime de destruction, place actuelle du vaisseau, vaisseaux abîmés ou isolés, danger encouru, rester au contact, ne pas se mettre dans les tirs alliés). Niveau 2 en plus : se poser sur une case de repli pour la bloquer, et chaque pirate revoit son tir une fois tout le monde en place. Les tirs peuvent viser une **case vide** (case de repli). Niveau par combat `st.ai` (absent dans une ancienne sauvegarde = 0, pas de migration). Choix validé : **secteur 1 = niveau 0** (IA de la session 1), **sauf ses contacts lourds au niveau 1** (« un peu plus mordants », § 18) ; secteur 2 = niveau 1, secteur 3 = niveau 2.
- Simulateur (flotte d'escorte neuve, joueur attentif / joueur qui ignore les annonces), coque perdue sur 32 :

| Combat | IA 0 | IA 1 | IA 2 |
|---|---|---|---|
| contact étage 4 | 1,4 / 12 | 2,4 / 10 | 3,8 / 9 |
| contact lourd étage 4 | 7 / 27 | 7,5 / 27 | 12,8 / 24 |
| amiral rouillé | 1 / 32 (perdu) | 17 / 32 (perdu) | 22 / 32 (perdu) |

  L'IA par score suppose que le joueur esquive : un joueur qui ne bouge jamais est un peu moins puni qu'avec l'IA 0, un joueur attentif beaucoup plus. Les secteurs 2 et 3 seront réglés à l'étape 3 (pirates, coque, IA).
- **Types** : `// @ts-check` et typedefs JSDoc (`Ship`, `Combat`, `Intent`, `FleetShip`, `MapNode`, `Sector`, `AiLevel`…) en tête de `regles.js`, vérifiés par `tsc -p outils/tsconfig.nebula.json` (lancé par `outils/verifications.js` ; la CI installe TypeScript).

### Retour de l'utilisateur après l'étape 1 (14/10)
« L'IA est vraiment bien équilibrée. » Mais placer un vaisseau de 2 ou 3 cases était difficile : un toucher raté obligeait à passer par ANNULER.
- **Fantôme** : le doigt posé sur une case bleue montre le vaisseau à l'endroit où il irait (contour pointillé, sprite transparent, dégâts annoncés sur ces cases ou « À L'ABRI ») ; il suit le doigt ; le vaisseau part au **lever** du doigt.
- **Replacer** : tant qu'il n'a pas agi, un vaisseau déjà déplacé montre encore ses cases bleues (calculées depuis sa case de départ) ; toucher une autre case le replace directement (`replaceShip`), toucher sa case de départ annule (`undoMove`). Le bouton ANNULER reste.
- `moveSpots(st, s)` et `spotAt(st, s, c, r)` (règles) donnent les positions possibles et celle choisie pour une case touchée.

### Étape 2 (14/10) : nouveaux vaisseaux
- **Éclaireur** (1 case, coque 3, vitesse 5, canon 1/4) : **MARQUAGE** au lieu du « repérage » du § 5 (montrer les déplacements du tour suivant aurait été peu lisible) : le pirate touché prend +1 à chacun des tirs du joueur jusqu'à la fin du tour (badge « +1 » ambre). L'effet nébuleuse (ignore la règle des 2 cases) viendra avec les nébuleuses.
- **Convoyeur** (2 cases, coque 8, sans arme) : **SOUTE** +50 % de crédits et de carburant gagnés tant qu'il est en vie (`bonus(run)`) ; s'il est détruit, -20 crédits (affiché au butin).
- **Artilleur** (2 cases, coque 7, salve 2) : **TIR INDIRECT** de 3 à 6 cases, sans ligne de vue ; la salve frappe la zone 2×2 (contenant la cible) qui touche le plus de pirates (`zoneFor`), pirates seulement.
- **Cuirassé** (3 cases, coque 16, tourelles 3/4) : **BORDÉE**, deux tirs par tour (`s.fired`, bouton « 2E TOURELLE ») ; il ne bouge plus après le premier tir.
- **Atelier mobile** (3 cases, coque 14, sans arme) : **RÉPARATION** +2 coque aux alliés collés en début de tour, +3 à toute la flotte après chaque combat (gagné ou fui).
- **Harponneur** pirate (2 cases, coque 10, canon 2/2) : **GRAPPIN** prioritaire sur un vaisseau de 1 case à 2 ou 3 cases en vue : annonce « GRAPPIN » sur la case ; à la fin du tour, le vaisseau encore sur la case est tiré de 2 cases vers lui (s'arrête s'il est bloqué). Il apparaîtra dans les secteurs 2 et 3 (étape 3).
- Les cinq nouveaux vaisseaux sont recrutables au comptoir en attendant les déblocages (étape 5).
- Simulateur (contact lourd, IA 1) : flottes de choc, marchande et « soutien » (atelier, artilleur, chasseur) gagnent ~40/40. La flotte marchande est fragile face à l'IA 2 et à l'amiral : voulu (« moins de puissance »), à revoir à l'équilibrage final.

### Étape 3 (14/10) : secteurs 2 et 3
- `SECTORS` décrit chaque secteur : astéroïdes, nuages ioniques, chance de nébuleuse, coque des pirates (`mult`), intercepteurs en plus (`extra`), niveau d'IA, nom du comptoir, et les pirates tirés au sort (`pool` : contacts des étages 1-2, des étages 3 et plus, contacts lourds case par case, escorte de l'amiral). Le secteur 1 tire exactement les mêmes combats qu'avant.

| Secteur | Terrain | Pirates | IA | Amiral |
|---|---|---|---|---|
| 1 Ceinture de Karn | 3-5 astéroïdes | coque ×1,5, +1 intercepteur | 0 (contacts lourds : 1) | Amiral rouillé (renforts : 2 intercepteurs / 3 tours) |
| 2 Nébuleuse d'Orphée | 1-2 astéroïdes, 2-3 nuages ioniques, une nébuleuse | ×1,6, +2, harponneurs | 1 | Veuve d'Orphée (2 tourelles, couvée : 2 brûlots / 3 tours) |
| 3 Le Seuil | 2-3 astéroïdes, 1-2 nuages, nébuleuse une fois sur deux | ×1,8, +2, croiseurs et harponneurs partout | 2 | Rouille-Reine (3 tourelles, bouclier rechargé en entier à chaque tour, 2 intercepteurs / 3 tours) |

- **Nuage ionique** (1 ou 2 cases, « IONS » en bleu) : à la FIN DU TOUR, avant les tirs pirates, tout vaisseau (des deux camps) qui a une case dans un nuage perd son bouclier. Les pirates de l'IA par score évitent d'y finir ; le fantôme de placement affiche « · IONS ».
- **Nébuleuse** (3 × 2 cases, brume violette) : un vaisseau entièrement dedans ne peut pas être visé à plus de 2 cases (sauf par l'éclaireur, dans les deux sens).
- **Amiraux** : sprites `veuve` et `reine` ajoutés à `vaisseaux.js` ; renforts décrits par `TYPES[…].spawn` ; `regen` = bouclier rechargé en entier.
- **Entre deux secteurs** : +3 carburant (`REFUEL`, message sur la carte) ; fonds de carte et de combat propres à chaque secteur (violet, puis rouge).
- **Victoire finale** après la Rouille-Reine : écran VICTOIRE, ligne « VICTOIRE FINALE 3000 » dans le score.
- **Réglage** (`node outils/nebula-parties.js`, 60 parties de l'IA de test avec la flotte d'escorte, choix de route simple, achats au comptoir) : joueur attentif : jamais arrêté au secteur 1, arrêté au secteur 2 dans ~23 % des parties, victoire dans ~22 % ; joueur qui ignore les annonces : toujours arrêté au secteur 1. Coque perdue moyenne par combat : secteur 1 contact 0,6 / lourd 6,9 / amiral 0,7 ; secteur 2 contact 1,3 / lourd 6,2 / amiral 9,8 ; secteur 3 contact 2,3 / lourd 8,3 / amiral 16,2. Essais écartés : Veuve qui lâche ses brûlots tous les 2 tours (18 parties sur 60 s'y arrêtaient) ; Rouille-Reine à 40 de coque et 4 de bouclier (presque imbattable : coque ×1,8 = 72).

### Retour après l'étape 3 (14/10)
L'utilisateur a joué jusqu'à la Rouille-Reine : « c'était super, la difficulté n'est pas trop mal dosée » ; défaite contre la Reine, « je pense avoir mal joué ». Rien à changer pour l'instant.

### Étape 4 (14/10) : épaves, nébuleuses, pilotes
- **`nebula/evenements.js`** (script classique, chargé avant `regles.js`, aussi lu par Node) : des données seulement. 13 épaves (cargo éventré, capsule de survie, signal de détresse, balise éteinte, chantier abandonné, épave pirate, vaisseau fantôme, nuage de débris, contrebandiers, station médicale, champ de mines, archives stellaires, le vieux pilote) et 4 nébuleuses calmes. Chaque choix peut demander ou coûter des crédits / du carburant ; chaque issue a une probabilité et des effets (crédits, carburant, dégâts, réparations, module, pilote, vaisseau, données stellaires, combat). Format décrit en tête du fichier.
- **Carte** : 1 ou 2 épaves (étages 2 à 6) et une nébuleuse (étages 3 à 6) prises sur des contacts (jamais le dernier contact d'un étage). Légende et fiches à jour (épave ambre, nébuleuse violette).
- **Épave** : écran ÉPAVE (texte, 2 ou 3 choix ; un choix impossible est grisé avec ce qu'il faut) ; l'issue est tirée avec la graine (`resolveEvent`), puis CONTINUER ou AU COMBAT ! (`closeEvent` : combat « EMBUSCADE » avec la récompense normale). Un événement déjà vu dans la partie ne revient pas tant qu'il en reste d'autres.
- **Nébuleuse** : une fois sur deux un combat (contact) avec une nébuleuse garantie, sinon un événement calme.
- **Pilotes** (`PILOTS`) : As (+1 vitesse), Mécano (+1 coque à chaque tour, dès le 2e tour), Tireur (+1 dégât), Prudent (+1 bouclier), Vétéran (+1 coque max par combat gagné, jusqu'à +4 ; le bonus suit le pilote). Un pilote = `{ k, name, vet }`, posé sur un vaisseau (`fleet[].pilot`) ou dans l'équipage (`run.crew`). Recrutés dans les épaves et au comptoir (qui propose maintenant 2 modules + 1 pilote, 40 à 60 cr). Au hangar : case PILOTE en haut à droite de chaque vaisseau ; toucher un pilote de la réserve puis la case ; toucher la case d'un pilote posé le rend à l'équipage. Le nom du pilote apparaît sur la fiche de combat.
- **Données stellaires** gagnées dans les événements (`run.data`) : ajoutées à celles de fin de partie (`stellarOf`).
- **Sauvegarde** : `RUN_V` = 2 ; `migrate()` complète une partie de la session 1 (`crew`, `data`, `seen`, `event`), testé par le simulateur. `sw.js` : `evenements.js` dans `FILES`, `VERSION` `ludotheque-v18`.
- Parties de l'IA de test (`nebula-parties.js`, qui choisit toujours le premier choix possible et pose les pilotes) : ~25 % de victoires, comme avant.

### Retour (14/10)
Sur téléphone, « SECTEUR 02 TERMINÉ · +3 CARBURANT POUR LA SUITE » débordait du cadre du butin : texte sur deux lignes, et `txt()` ajoute maintenant l'espacement des lettres à la largeur mesurée (le navigateur du téléphone ne le comptait pas, le resserrement automatique ne se déclenchait pas).

### Étape 5 (14/10) : déblocages et flottes
- **Solde** = données gagnées (`meta.data`, cumulées depuis la session 1) − coût de ce qui est débloqué (`meta.unlocked`) : `walletOf(meta)`. Rien d'autre à stocker ; le transfert de sauvegarde garde le maximum des compteurs et **réunit** les listes `unlocked`.
- **Écart au § 9** : bombardier, drones et égide restent au comptoir d'office (ils l'étaient depuis la session 1, pour ne rien retirer) : `BASE_RECRUITS` = chasseur, frégate, bombardier, drones, égide. À débloquer (`UNLOCKS`) : éclaireur 15, convoyeur 30, artilleur 55, flotte de choc 60, flotte marchande 80, cuirassé 90, atelier 90. Un vaisseau débloqué peut ensuite apparaître au comptoir et dans les épaves (`run.recruits`, fixé au départ de la partie ; une partie sauvegardée plus ancienne garde tout).
- **Écran DÉBLOCAGES** (titre, fin de partie, ou toucher une flotte verrouillée) : solde, ce qui rapporte des données, chaque déblocage avec son coût ; le bouton du titre passe en ambre quand on peut débloquer quelque chose.
- **Choix de la flotte** : toucher une flotte ouverte la choisit (CHOISIE), DÉCOLLER part avec elle.
- **Flotte marchande** (écart au § 8) : convoyeur, frégate, chasseur, éclaireur, et 100 crédits au départ. Avec l'égide à la place du chasseur, le simulateur ne venait pas à bout de l'amiral du secteur 1 (18 parties sur 60 arrêtées au secteur 1, 3 victoires) ; les crédits seuls n'y changeaient rien.
- `node outils/nebula-parties.js 60 4 <flotte>` (tous les vaisseaux débloqués) : escorte 15 victoires sur 60, choc 22, marchande 11.

### Étape 6 (14/10) : partie du jour, classements, bilan
- **Partie du jour** (bouton de l'écran titre, quand aucune partie n'est en cours) : graine = date `AAAAMMJJ`, flotte d'escorte, **aucun déblocage** (comptoir et épaves avec `BASE_RECRUITS`) : la même partie pour toute la famille (carte, combats, événements, boutique). La première tentative du jour est classée (`nebula.dailyTry` = date, posé au départ : abandonner compte comme une tentative) ; les suivantes sont « HORS CLASSEMENT » (bandeau de la carte, fin de partie). Le score classé est gardé dans `nebula.daily` (déjà dans le transfert de sauvegardes) ; le bouton affiche « DU JOUR · score ».
- **Classements** (`nebula`) : `best` (toutes les parties), `daily:AAAAMMJJ` (tentative classée), `victoires` (nombre de victoires, envoyé à chaque victoire). `registerExisting` envoie les trois ; `PSEUDO_BOARDS` + `victoires` ; `SYNC` = 7. Page des classements : vues MEILLEUR SCORE, PARTIE DU JOUR (flèches des jours), VICTOIRES. Testé avec `outils/faux-classements.js` (inscription : best, victoires, daily) et dans le jeu avec un faux `LudoScores` : à confirmer avec un vrai essai sur téléphone.
- **Équilibrage final** : rien à retoucher. 60 parties de l'IA de test (joueur attentif) : escorte 15 victoires, choc 22, marchande 11 ; joueur qui ignore les annonces : arrêté au secteur 1. Retour de l'utilisateur après une partie complète : difficulté « pas trop mal dosée ».

### Bilan de la session 2
Fait : retours § 18 (capacités, carte lisible, drones, IA par score), confort de placement (fantôme, replacement), 5 vaisseaux et le harponneur, secteurs 2 et 3 avec terrain et amiraux, victoire finale, épaves et nébuleuses, pilotes, déblocages et flottes, partie du jour et classements, `@ts-check`. Écarts notés plus haut : éclaireur (marquage), flotte marchande (chasseur au lieu de l'égide, 100 crédits), bombardier / drones / égide restent d'office.
**Pour la session 3** (§ 15) : tutoriel (premier combat guidé), manuel (fiches des vaisseaux, terrain, pilotes), finitions (sons, animations), et les pistes de confort de `nebula-analyse.md` § 8 (toucher long = fiche, avertissement sur FIN DU TOUR, économie de batterie…). À surveiller : la flotte de choc un peu plus forte que les autres.

## 20. Session 3 : découpage et avancement
Validé par l'utilisateur le 14/10. Même méthode qu'en session 2 : chaque étape jouable, testée, poussée, artefact republié (branche de travail de la session). Précision de l'utilisateur : **le tutoriel est proposé au moins une fois, même à un joueur qui a déjà fait des parties**.
1. ✅ **Manuel** (14/10) (remplace l'écran RÈGLES) : fiches de tous les vaisseaux et pirates avec leurs jauges expliquées, terrain (astéroïdes, ions, nébuleuse), balises, modules, pilotes, règles en rubriques ; navigation par onglets.
2. ✅ **Tutoriel** (14/10) (§ 12) : premier combat de la première partie guidé en 5 bulles (choisir un vaisseau, sortir d'une case visée, tirer, bouclier, FIN DU TOUR), désactivable, rejouable depuis le manuel.
3. ✅ **Confort au doigt** (15/10) (`nebula-analyse.md` § 8) : toucher long = fiche (vaisseau, pirate, balise), avertissement doux sur FIN DU TOUR si un vaisseau peut encore tirer, zones tactiles plus grandes, vitesse des animations pirates ×1/×2, vibration quand un vaisseau est touché.
4. ✅ **Sons et animations** (15/10) (§ 13) : bruitages manquants (grappin, ions, salve, couvée), nappe d'ambiance coupée par défaut, petites finitions (saut, débris).
5. ✅ **Hors connexion et batterie** (15/10) (`nebula-analyse.md` § 6 et § 8 ; touche `sw.js`, donc tout le site) : polices dans le dépôt, délai réseau du service worker, redessin seulement quand quelque chose bouge.
6. ✅ **Bilan** (15/10) : l'équilibrage de la flotte de choc est reporté à la session 4 (flotte à points, § 21), sur décision de l'utilisateur.
Reste aussi, hors Nebula : l'artefact de l'accueil est une ancienne copie à plusieurs fichiers (sans Orbite, Pont stellaire, Alunissage, Nebula) ; le refaire demande un chantier à part.

### Étape 1 (14/10) : manuel
- Écran `manual` (bouton MANUEL de l'écran titre, et MANUEL COMPLET dans la légende de la carte, qui ouvre l'onglet CARTE et ramène au jeu) : 6 onglets sur 2 rangées (RÈGLES, VAISSEAUX, PIRATES, TERRAIN, CARTE, ÉQUIPEMENT). `openManual(retour, onglet)` ; état dans `MAN` (exposé par `window.Nebula`).
- **Règles** : 12 rubriques (`RULES`, dont fuite, carburant et dérive, secteurs, score, données stellaires, partie du jour), réparties en pages selon la place (PRÉCÉDENT / SUIVANT).
- **Vaisseaux** (11) et **pirates** (7) : vignettes, puis la fiche `shipCard(t, …)` : sprite, cases, jauges coque / bouclier / vitesse (pirates : coque réelle selon les secteurs où on les croise, ×1,5 / ×1,6 / ×1,8), armes (dégâts, portée, tourelles), renforts, capacité (`sdesc`), où le trouver (flotte de départ, comptoir, déblocage et son coût, secteurs), et les jauges expliquées. `shipCard` servira au toucher long de l'étape 3.
- **Terrain** : astéroïde, nuage ionique, nébuleuse, case visée, case voisine, grappin, case bleue, dessinés comme en combat (`ionTile`, `fogTile` sortis de `drawStatic`).
- **Carte** : la légende des balises (`legendRow`, partagée avec ? LÉGENDE). **Équipement** : les 5 modules (prix, effet, emplacements) et les 5 pilotes.

### Étape 2 (14/10) : tutoriel (entraînement guidé)
- **Écart au § 12** : au lieu de guider le vrai premier combat (rien ne garantit qu'un vaisseau y soit visé ni qu'un pirate soit à portée), un **combat d'entraînement préparé** : `makeTraining()` (règles) : flotte d'escorte, deux intercepteurs, deux astéroïdes ; le premier vise le chasseur, le second la frégate (20 cases à l'abri pour le chasseur, dont 13 d'où il peut tirer).
- La partie en cours est mise de côté (`TUTO.real`) et rendue intacte ; l'entraînement n'est jamais sauvegardé (`save()` l'ignore), une erreur (INCIDENT) rend aussi la partie.
- **Proposé une fois** (`nebula.tuto`), même à qui a déjà joué : écran PREMIER VOL ? au premier DÉCOLLER ou à la première PARTIE DU JOUR (S'ENTRAÎNER / PARTIR DIRECTEMENT) ; à la fin, DÉCOLLER lance la partie. **Rejouable** : bouton ENTRAÎNEMENT en haut du manuel (retour au manuel).
- Bulles (en haut de l'écran, QUITTER partout) : accueil ; 1 choisir le chasseur (encadré qui pulse) ; 2 l'esquiver hors du rouge (« toujours dans le rouge » s'il y reste) ; 3 tirer (si plus aucun pirate à portée : prendre la frégate et son missile) ; 4 bouclier et coque (bulle bloquante, chasseur encadré) ; 5 FIN DU TOUR (bouton encadré) ; BRAVO : FINIR LE COMBAT ou DÉCOLLER / TERMINER. Toucher FIN DU TOUR en avance mène directement au BRAVO. Chaque étape avance toute seule quand le joueur a fait le geste.
- Testé de bout en bout avec de vrais touchers dans Playwright ; `outils/fumee.js` vérifie que la partie est rendue intacte.
- **Retour de l'utilisateur traité en même temps** : au hangar, toucher un pilote de la réserve montre sur chaque vaisseau ce qu'il changerait (`pilotPreview` : « LINA : DÉGÂTS CANONS 2 → 3 », VITESSE, BOUCLIER, COQUE MAX, Mécano et Vétéran décrits ; en tenant compte du pilote déjà posé, qui partirait).

### Étape 3 (15/10) : confort au doigt
- **Toucher long** (`HOLD_MS` 450 ms sans glisser de plus de 16 px, petite vibration) : sur un vaisseau ou un pirate en combat, ou un vaisseau du hangar, ouvre sa fiche du manuel (`shipCard`) en plein écran, fermée au toucher suivant ; sur une balise à portée de la carte, sa fiche sans sauter. Pour que ce soit possible, **le tir sur un pirate et le saut vers une balise partent au lever du doigt** (`PRESS.up`, revérifiés par `fire()`) ; le reste agit toujours dès que le doigt se pose. Mécanique générale : `zone(…, { hold })`.
- **Clic droit** (ordinateur, demandé le 15/10) : la même fiche tout de suite (`contextmenu` reprend l'action `hold` du bouton, ou le vaisseau sous la souris en combat) ; le bouton droit n'agit jamais sur le jeu.
- **Zones tactiles élargies** : un toucher qui ne tombe sur aucun bouton prend le plus proche à moins de 12 pixels logiques (`hitButton`, `PAD`).
- **FIN DU TOUR** : si un vaisseau n'a pas agi et a un pirate à portée (`canStillFire`), le premier toucher affiche « LA FRÉGATE PEUT ENCORE TIRER · TOUCHE ENCORE POUR FINIR » et le bouton devient CONFIRMER (4 s).
- **Écran titre** : ANIMATIONS ×1 / ×2 (`nebula.speed` : toutes les animations du combat deux fois plus courtes, sauf les chiffres de dégâts, qui restent lisibles) et VIBRATIONS : OUI / NON (`nebula.vib`, active par défaut et indépendante du son : vibration courte quand un vaisseau du joueur perd de la coque, plus longue s'il est détruit).
- Manuel : rubrique GESTES. L'aperçu du danger (§ 8 de l'analyse) existait déjà avec le fantôme de placement.
- Testé avec de vrais touchers (Playwright) : appui long sur une balise (fiche, pas de saut) puis toucher court (saut), appui long sur un pirate (fiche, pas de tir) puis toucher court (tir), avertissement puis fin du tour en touchant 8 px sous le bouton, tour pirate 0,7 s → 0,35 s en ×2 ; tutoriel rejoué de bout en bout.

### Étape 4 (15/10) : sons et animations
- **Bruitages ajoutés** (WebAudio, toujours graves et discrets) : `grapple` (harpon et câble ; avant, on entendait le laser), `winch` (treuil quand le vaisseau est tiré), `ion` (grésillement ; avant, le son du bouclier), `salve` (4 impacts en rafale de l'artilleur), `warp` (renforts qui sortent de l'hyperespace), `couvee` (la Veuve lâche ses brûlots), `heal` (réparation), `mark` (marquage de l'éclaireur), `win` / `lose` (une fois, à l'écran de fin de combat ; un repli rejoue le saut).
- **Nappe d'ambiance** (réglage AMBIANCE de l'écran titre, `nebula.amb`, **coupée par défaut**, grisée si le son est coupé) : deux scies graves désaccordées, une quinte et une sous-basse dans un passe-bas qui respire lentement (oscillateur à 0,06 Hz), montée en 4 s. L'audio est suspendu quand la page est cachée (économie de batterie).
- **Animations** : saut hyperspatial avec traînées d'étoiles qui s'étirent puis éclair (0,9 s, au lieu du seul éclair) ; débris de coque qui tournoient et s'éteignent à chaque destruction (plus nombreux pour les gros vaisseaux, teinte orangée pour les pirates).
- Testé dans Chromium : les 19 bruitages et la nappe (marche / arrêt) sans erreur ; captures du saut et des débris.

### Étape 5 (15/10) : hors connexion et batterie
- **Polices dans le dépôt** : `polices/nebula.css` + 5 fichiers `woff2` (Michroma, Rajdhani 500/600/700, Share Tech Mono ; sous-ensemble latin de Google Fonts, 46 Ko, licence SIL OFL). Nebula ne demande plus rien à Google ; le lien Google est gardé dans l'attribut `data-google` pour l'artefact (`artefact.py` le remet). Les autres jeux gardent leurs polices Google (Press Start 2P…) : à revoir dans la revue générale (`IDEES.md`).
- **Service worker** (`sw.js`, tout le site, `VERSION` `ludotheque-v19`) : toujours le réseau d'abord, mais si rien n'arrive en 2,5 s (`NET_WAIT`) et qu'une copie existe, elle est servie tout de suite ; la réponse du réseau met quand même le cache à jour pour la prochaine ouverture (`waitUntil`). Après un tel retard, les fichiers suivants sont servis du cache sans attendre pendant 10 s (`slowUntil`), sinon la page s'ouvrait étage par étage (7,6 s au lieu de 2,6 s). Une réponse en erreur du réseau (404…) laisse place à la copie.
- **Batterie** : la boucle ne dessine que si besoin (`fpsWanted`) : 60 images/s après un toucher (1,5 s), pendant les animations du combat, le saut ou la préparation des sprites ; au repos, 30 images/s à l'écran titre, sur la carte et en combat (petits mouvements des vaisseaux), 12 sur les écrans fixes (manuel, hangar, comptoir, fiches…). Mesuré dans Chromium : 30 / 12 / 64 images/s.
- Testé : ouverture hors connexion (jeu et 3 polices chargés), réseau très lent avec un serveur qui attend 8 s par fichier (page ouverte en 2,6 s), réseau normal (une modification publiée arrive tout de suite) ; test de fumée des 19 pages.
- Non fait : préparer les sprites dans un *Web Worker* (§ 6 de l'analyse) : à faire seulement si l'utilisateur constate des à-coups sur le téléphone.

## 21. Pistes d'équilibrage et de renouvellement (proposées le 15/10, validées le 15/10)
Retour de l'utilisateur (15/10) : après plusieurs parties, la flotte de choc est très efficace. Idées en vrac : flotte de choc dès le début mais moins récompensée, flotte marchande comme une mission d'escorte mieux récompensée ; composer sa flotte de départ avec des **points de flotte** (chaque vaisseau a un coût et rapporte plus ou moins en fin de partie) ; nouveaux vaisseaux alliés et ennemis ; **objectifs** de partie ou de combat (ne perdre aucun vaisseau, un pilote dans chaque vaisseau…) ; **partie du jour** avec une flotte différente chaque jour (que des chasseurs, que des bombardiers, escorte d'un vaisseau qui ne doit pas être détruit…).

### Mesures (IA de test, 40 parties complètes par flotte, joueur attentif, tout débloqué)
| Flotte de départ | Victoires | Secteurs terminés (moy.) | Score moyen |
|---|---|---|---|
| 4 chasseurs | **35/40** | 2,85 | 8030 |
| 3 frégates | 20/40 | 2,50 | 6584 |
| choc (cuirassé, bombardier, chasseur) | 12/40 | 2,15 | 5199 |
| cuirassé, frégate, chasseur | 12/40 | 2,25 | 5422 |
| 3 bombardiers | 9/40 | 1,73 | 4124 |
| escorte (porte-vaisseaux, frégate, chasseur) | 8/40 | 2,00 | 4809 |
| marchande (+100 crédits) | 5/40 | 1,93 | 4954 |
| 2 chasseurs | 5/40 | 1,70 | 4149 |
| porte-vaisseaux, égide, chasseur | 4/40 | 1,55 | 3784 |
| atelier, artilleur, chasseur | 3/40 | 1,25 | 3214 |
| frégate, chasseur | 3/40 | 1,73 | 4168 |
| cuirassé seul | 0/40 | 0,25 | 1029 |

Lecture : le **nombre de vaisseaux** compte énormément (plus d'actions par tour, des tirs pirates éparpillés) et le **chasseur** est de loin le vaisseau le plus rentable (vitesse 4, riposte, coque 6). L'IA de test joue mal les vaisseaux de soutien (égide, atelier, baies du porte-vaisseaux) : ces chiffres les sous-estiment, mais le classement des flottes « de combat » est fiable, et il rejoint le ressenti (choc forte).

### Pistes
1. **Flotte à points (socle des autres)** : écran FLOTTE où l'on compose sa flotte de départ avec un budget de **points de flotte** (par ex. 10 PF, 4 vaisseaux au plus au départ). Coûts à calibrer au simulateur pour que deux flottes de même coût aient des chances voisines (premier jet : éclaireur 1, convoyeur 1, drones 2, bombardier 2, chasseur 3, frégate 3, égide 3, artilleur 3, atelier 3, porte-vaisseaux 4, cuirassé 5). **Prime d'audace** : chaque point non dépensé = +10 % de score et de données stellaires en fin de partie (une flotte légère, ou marchande, rapporte plus ; une flotte lourde moins). Les trois flottes actuelles deviennent des modèles prêts à l'emploi (escorte 10, choc 10, marchande 8 + 100 crédits = +20 %). Déblocages : les vaisseaux débloqués entrent dans l'écran de composition ; les déblocages de flottes disparaissent (le solde est recalculé, les données dépensées reviennent toutes seules).
2. **Objectifs** : *de combat* (un défi tiré avec la graine, affiché en haut : aucun vaisseau détruit, gagner en 4 tours ou moins, détruire le gros pirate en premier… ; récompense en crédits) et *de partie* (un contrat choisi au départ parmi 3 : ne perdre aucun vaisseau, finir avec un pilote dans chaque vaisseau, vaincre les 3 amiraux sans fuir, finir avec 300 crédits… ; récompense en score et en données).
3. **Missions du jour** : la partie du jour impose chaque jour une flotte et une règle tirées avec la date (escadrille de 4 chasseurs, 3 bombardiers, escorte d'un convoyeur qui ne doit pas être détruit, 2 vaisseaux avec pilotes vétérans, sans comptoir, carburant compté…). La même pour toute la famille : le classement du jour reste juste.
4. **Nouveaux vaisseaux** (plus tard) : alliés *brouilleur* (annule une intention pirate par tour) et *mouilleur de mines* (piège une case) ; pirates *frégate-bouclier* (+1 bouclier aux pirates voisins) et *poseur de mines*. Chaque nouveau pirate doit rester lisible avec le système d'annonces.

### Décisions de l'utilisateur (15/10)
- **Flotte à points avec prime d'audace : oui**, comme socle. **Garder les archétypes** (escorte, choc, marchande) comme modèles prêts à l'emploi, pour donner des idées aux débutants.
- **On n'écarte rien** : objectifs, missions du jour et nouveaux vaisseaux sont tous retenus.
- Session 4 dans une **nouvelle conversation** (économie du forfait : le contexte de la session 3 était à 42 %).

### Session 4 « Flotte et défis » : découpage proposé (à faire valider en début de session)
Même méthode : chaque étape jouable, testée, poussée, artefact republié.
1. **Flotte à points** : écran FLOTTE de composition (budget, coût de chaque vaisseau, 4 vaisseaux au plus au départ, modèles escorte / choc / marchande à charger puis modifier), prime d'audace (+10 % de score et de données par point non dépensé, affichée au départ et à la fin), coûts calibrés avec `outils/nebula-flottes.js` (viser des chances voisines à coût égal ; le chasseur est sous-évalué, le nombre de vaisseaux pèse lourd). Déblocages : plus de flottes à débloquer (solde recalculé tout seul), les vaisseaux débloqués entrent dans la composition. Partie sauvegardée : `RUN_V` 3 si la partie garde sa composition ou sa prime. Points à trancher : budget (10 ?), le score `best` reste-t-il comparable avec la prime.
2. **Objectifs** : un défi par combat (tiré avec la graine, affiché en haut, récompense en crédits) et un contrat de partie choisi au départ parmi 3 (récompense en score et en données) ; affichés dans le bilan de fin.
3. **Missions du jour** : la partie du jour impose une flotte et une règle tirées avec la date (escadrille de chasseurs, bombardiers, escorte d'un convoyeur à protéger, vétérans, sans comptoir, carburant compté…) ; même mission pour toute la famille ; présentation sur l'écran titre.
4. **Nouveaux vaisseaux** : alliés brouilleur (annule une intention pirate par tour) et mouilleur de mines ; pirates frégate-bouclier et poseur de mines ; sprites dans `vaisseaux.js`, fiches du manuel, IA, simulateur.
5. **Équilibrage et bilan** : simulateur, retours de l'utilisateur, docs.

### Bilan de la session 3 (15/10)
Fait : manuel en 6 onglets (fiches des vaisseaux et pirates, terrain, carte, équipement) ; entraînement guidé (combat préparé, proposé une fois à tous) ; aperçu des pilotes au hangar ; confort au doigt (toucher long ou clic droit = fiche, tir et saut au lever du doigt, zones élargies, confirmation de FIN DU TOUR, animations ×2, vibrations) ; bruitages et nappe d'ambiance ; saut et débris animés ; polices dans le dépôt, délai réseau du service worker (tout le site, `ludotheque-v19`), images/s réduites au repos ; mesures de 12 flottes au simulateur et pistes de la session 4 (§ 21).
À confirmer sur téléphone : appui long (0,45 s) et tir au lever du doigt, volume des nouveaux sons et de l'ambiance, ouverture hors connexion et sur réseau lent après la mise à jour de `main`. Reste ouvert : retirer ou non la petite vibration du toucher long (Chrome en fait déjà une) ; Web Worker pour les sprites seulement si des à-coups sont constatés.

## 22. Session 4 « Flotte et défis » : avancement
Découpage du § 21 **validé le 15/10** avec les choix proposés : budget **10 points**, prime **plafonnée à +50 %**, classement `best` gardé (score prime comprise ; une flotte d'escorte vaut 10 points, donc 0 %, les anciens records restent comparables), **pas de prime** pour la partie du jour (flotte d'escorte imposée). Retouche demandée en plus : retirer les traînées du saut (« sortie d'hyperespace ») et faire arriver la flotte par le bas au début d'un combat.

### Étape 1 : flotte à points ✅ (15/10)
- **Écran FLOTTE** : 3 modèles (escorte 10, choc 10, marchande 8 = +20 %), 4 places (toucher = retirer), prime d'audace, vaisseaux disponibles (toucher = ajouter, doigt posé = fiche ; vaisseau à débloquer = écran DÉBLOCAGES). La dernière composition est gardée (`nebula.compo`).
- **Coûts** (`FLEET_COST`) : éclaireur, convoyeur, drones 1 ; bombardier, égide 2 ; chasseur, artilleur, porte-vaisseaux, atelier 3 ; frégate 4 ; cuirassé 5. Toujours disponibles : chasseur, frégate, porte-vaisseaux, bombardier, drones, égide ; les autres après déblocage.
- **Prime d'audace** : +10 % de score et de données stellaires par point non dépensé, au plus +50 % (`primeOf`) ; ligne PRIME D'AUDACE dans le bilan de fin.
- **Déblocages** : les flottes de choc et marchande ne se débloquent plus (les données dépensées reviennent toutes seules, le solde étant recalculé) ; un modèle est disponible quand tous ses vaisseaux le sont (choc : cuirassé ; marchande : convoyeur et éclaireur). La flotte marchande ne part plus avec 100 crédits : sa prime de +20 % la remplace (2 chasseurs au lieu de frégate + chasseur).
- **Sauvegarde** : `RUN_V` 3 (`run.compo`, `run.prime` ; `fleetId` disparaît). Une partie de la session 3 reprend sans prime.
- **Combat** : plus de traînées au saut ; au début d'un combat, la flotte surgit du bas de l'écran et freine jusqu'à sa case (`arrive()`, ~0,8 s, « ARRIVÉE DE LA FLOTTE »).
- Mesures (IA de test, 40 parties, joueur attentif, tout débloqué) : frégate + 2 chasseurs (10 pts) 22/40 ; 3 chasseurs + éclaireur (10) 21/40 ; 2 chasseurs + bombardier + drones (9) 14/40 ; choc (10) 12/40 ; frégate + chasseur + bombardier + éclaireur (10) 12/40 ; escorte (10) 8/40 ; 2 chasseurs (6, +40 %) 5/40 ; marchande (8, +20 %) 4/40 ; 4 éclaireurs (4, +50 %) 0/40. L'IA de test joue mal les baies du porte-vaisseaux, la bulle de l'égide et l'atelier, et sous-estime le cuirassé (l'utilisateur trouve la flotte de choc forte) : leurs coûts tiennent compte du ressenti plus que du simulateur. **À confirmer en jouant** : la frégate à 4 et le chasseur à 3 sont-ils justes ? les petites flottes à prime sont-elles tentantes ?

### Étape 2 : défis de combat et contrats de partie ✅ (15/10)
- **Défi de combat** (`GOALS`, `makeGoal` à la fin de `makeCombat`, graine à part : le combat lui-même ne change pas, le simulateur reste identique) : aucune perte ; victoire en 4 tours (contact), 6 (lourd), 8 (amiral) ; abattre en premier le plus gros pirate (s'il est seul de sa taille, pas contre un amiral) ; finir avec chaque vaisseau à moitié de sa coque ou plus. Récompense : 15 / 25 / 40 crédits (contact / lourd / amiral). Affiché sous la barre du haut (ambre, rouge si manqué), dans la fenêtre de victoire et dans le butin. Mesures (IA de test, escorte) : contact 72 à 93 % (sauf « en premier » 6 % : l'IA tire au plus près), lourd 38 à 77 %, amiral 38 à 53 %.
- **Contrat de partie** (`CONTRACTS`) : 3 proposés au premier passage sur la carte (graine de la partie, donc les mêmes pour toute la famille dans la partie du jour), réussi dès que l'objectif est atteint (`contractCheck` après chaque combat, épave, achat, pilote posé) : chasse aux pirates (90, +600, 35 % pour l'IA), gros gibier (4 lourds, +900, 10 %), têtes couronnées (2 amiraux, +500, 90 %), zéro perte (2 secteurs sans perte, +800, 20 %), équipage complet (+800, 10 %), fortune (600 crédits, +500, 65 %), grande escadre (5 vaisseaux, +700, 25 %), tête brûlée (10 défis, +700, 55 %) ; +10 à +20 données. Les points s'ajoutent au score avant la prime d'audace. Suivi sur la carte, ligne CONTRAT et DÉFIS RÉUSSIS dans le bilan.
- `RUN_V` 4 (`offers`, `contract`, `contractDone`, `bonus`, `goals`, `secLost`, `cleanSectors`) ; une partie déjà commencée continue sans contrat.
- À confirmer en jouant : défis trop faciles ou trop durs ? contrats assez différents pour que le choix compte ?

### Étape 3 : missions du jour ✅ (15/10)
- La partie du jour devient la **mission du jour** (`MISSIONS`, `missionFor(date)`, `newDaily`) : flotte et règle imposées, tirées avec la date, sans prime d'audace ; contrats proposés comme d'habitude (mêmes 3 pour toute la famille). Écran de présentation (`drawMission`) depuis le bouton MISSION DU JOUR · NOM de l'écran titre : flotte, pilotes, vaisseau à protéger, règles, tentative classée ou non.
- 8 missions (victoires de l'IA de test sur 20 parties) : escadrille (3 chasseurs + éclaireur, 9), tapis de bombes (3 bombardiers + chasseur, 7), convoi (convoyeur à protéger + frégate + 2 chasseurs, 2), équipage d'élite (frégate, chasseur, éclaireur avec pilotes prudent, as, tireur, 6), blocus (escorte + chasseur, comptoirs fermés, 2), réservoirs à sec (frégate + 2 chasseurs, 5 carburants, aucun ravitaillement, 7), armada (cuirassé, porte-vaisseaux, chasseur, 7), la meute (éclaireur, drones, 2 chasseurs, 4). L'IA de test protège mal le convoyeur : le convoi devrait être plus facile pour un joueur.
- Vaisseau à protéger : `vip` sur le vaisseau de la flotte et en combat ; détruit = combat perdu (`checkEnd`), fin « MISSION ÉCHOUÉE » (`run.vipLost`) ; repère « À PROTÉGER » en combat. Comptoirs fermés : on y passe sans rien acheter (message). Pas de nouvelle version de sauvegarde (champs facultatifs : `mission`, `vip`, `vipLost`).

### Étape 4 : nouveaux vaisseaux ✅ (15/10)
- Maquette validée par l'utilisateur : https://claude.ai/artifact/F397he9HLBja3pqkZA3jZi (`maquettes/nebula-nouveaux.html`, sprites dans `nebula/vaisseaux.js` : `brouilleur`, `mouilleur`, `bouclier`, `poseur`, `mine`, `minePirate`).
- **Brouilleur** (2 cases, coque 7, bouclier 1, vitesse 3, canon 1 à 3 cases ; 3 points, 65 données, 110 crédits) : 2e arme BROUILLAGE (`jam`) : au lieu de tirer, cible un pirate à 4 cases (sans ligne de vue) qui a un tir annoncé ; ses tirs sont marqués `jam` (un seul pour un amiral), dessinés en gris BROUILLÉ et ignorés à la fin du tour.
- **Mouilleur de mines** (2 cases, coque 9, bouclier 1, vitesse 2, pas d'arme ; 2 points, 45 données, 90 crédits) : bouton MINE puis une case ambre (libre, à 2 cases) ; 4 mines par combat (`MINES_PER_COMBAT`), 5 dégâts, invisibles pour l'IA pirate. Mesure : avec 3 mines à 4 dégâts, 28 % des mines de l'IA de test explosaient ; renforcé à 4 mines × 5 dégâts.
- **Frégate-bouclier** pirate (2 cases, coque 10, bouclier 3, canon 2 à 3 cases) : en début de tour, +1 bouclier aux pirates collés (jusqu'à 2 au-dessus du maximum). **Poseur de mines** pirate (1 case, coque 4, canon 1 à 2 cases) : annonce une mine (`fx: 'mine'`) sur une case libre collée à un de tes vaisseaux, à 3 cases de lui (4 mines pirates au plus) ; posée à la fin du tour (si un vaisseau y est, elle saute tout de suite) ; 3 dégâts au passage. Les deux apparaissent dans les secteurs 2 et 3 (`SECTORS[].pool`).
- **Mines** (`st.mines`) : explosent quand un vaisseau ennemi passe dessus ou s'y arrête (`triggerMines`, appelé pour les déplacements du joueur, des pirates et le grappin) ; plus d'annulation de déplacement après une mine. L'IA de test évite les mines pirates et pose ses mines vers les pirates.
- Mesures (40 parties, tout débloqué) : escorte 6/40 (8 avant les nouveaux pirates), choc 14, frégate + 2 chasseurs 16 (22 avant), brouilleur + frégate + chasseur 10, mouilleur + frégate + chasseur 2. L'IA de test joue mal les deux nouveaux vaisseaux (elle brouille au hasard, pose ses mines sans prévoir) : à juger en jouant.
- Manuel : fiches des 4 vaisseaux, rubrique MINES ; composition de la flotte sur 5 colonnes (13 vaisseaux).

### Sound design (15/10, demande de l'utilisateur)
- Constat : sons trop « jouet » ou clichés de jeu vidéo ; ambiance « pas terrible ». Trois passes au banc d'écoute (`maquettes/nebula-sons.html`, https://claude.ai/artifact/YNaEu29GySPDBeNtQi8GqA) : A/B en oscillateurs (rejetée), synthèse échantillon par échantillon (rejetée sauf les ambiances), 48 sons Kenney CC0 fournis par l'utilisateur (« rien ne me va »), puis sons étouffés d'après ses références.
- Retenu (`nebula/sons.js`, `NebulaSons`) : saut façon Helldivers 2 (2 s de montée, « vwOOM » ; en jeu la flotte arrive en combat au moment du choc, `UI.jumpAt`) ; armes et impacts graves et filtrés (canon, laser, missile, torpille, bouclier, coque — nouveau son à chaque dégât de coque —, explosion en deux variantes) ; bip de sélection et bip de validation (boutons `primary`) ; sons secondaires (grappin, treuil, ions et brouillage, renforts, mine, réparation, marquage) dans le même esprit ; Tension II en combat, Marche sur les autres écrans (réglage AMBIANCE, toujours coupé par défaut). Sons fabriqués une fois (3 variantes chacun) pendant les temps morts (`warmSounds`), position stéréo selon la case.
- À trancher : défaite A ou B, ambiance de la carte Marche ou Garde.


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
- Dossier `nebula/` : `index.html` (le jeu) + **`nebula/vaisseaux.js`** (moteur de sprites extrait du catalogue, avec `builder`, `render`, `SHIPS`, `MAT`, décor), **réutilisé plus tard par l'Empire**. Ajouter les deux à `FILES` de `sw.js` et changer `VERSION`.
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
- **Capacité de chaque vaisseau visible** : la fiche de combat d'un vaisseau du joueur doit afficher sa capacité (ex. « BULLE : +1 bouclier aux alliés voisins », « RIPOSTE… », « BAIES… »), comme c'est déjà le cas pour les pirates ; idem sur la carte de chaque vaisseau dans le **hangar**. Pour **tous** les vaisseaux (chasseur, frégate, porte-vaisseaux, bombardier, drones, égide, et les nouveaux de la session 2). Aujourd'hui elle n'apparaît qu'au comptoir (recrue).
- **Carte du secteur plus lisible** : indiquer au joueur ce que veut dire chaque icône de balise (contact, contact lourd, comptoir, dock, amiral ; puis épave et nébuleuse en session 2). Pistes : une petite légende repliable (bouton « ? » ou bandeau en bas de la carte), le nom de la balise sous **chaque** icône (pas seulement les sauts possibles), et/ou une info-bulle quand on touche une balise (nom + ce qu'on y trouve : « Combat contre 2 à 4 pirates », « Combat difficile, module garanti », « Carburant, réparations, modules, recrues »…).
- **Attaque des drones plus fluide** : pour tous les autres vaisseaux, on touche le vaisseau puis un ennemi entouré en jaune et l'attaque part. Pour le drone, même quand un ennemi est entouré en jaune, il faut passer par le bouton en bas de l'écran, ce qui casse le rythme. À harmoniser : toucher un ennemi entouré en jaune doit attaquer directement avec le drone (le bouton ne servant plus qu'aux actions sans cible, ou plus du tout).

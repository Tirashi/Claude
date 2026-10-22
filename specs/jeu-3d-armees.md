# Nouveau jeu de conquête en 3D (nom à choisir) — cahier des charges

Petit jeu de conquête au tour par tour, **en 3D**, sur une carte de terres hexagonales. Le joueur est un seigneur : il lève des **armées qu'on voit sur la carte**, les déplace de terre en terre et livre des **batailles qu'on regarde**, jusqu'à prendre les châteaux rivaux ou gagner la couronne.

Né de l'essai « Duché en 3D » du 21/10 (`maquettes/duche-kaykit.html`, https://claude.ai/artifact/VdnZY9whbwAsM2xMjwvbHC) : l'utilisateur trouve que la 3D « rend beaucoup mieux » avec les personnages KayKit, mais que les règles de Duché, faites pour une carte 2D rapide, ne mettent pas les batailles en valeur. **Duché reste tel quel** (pixel art, classements, défi du jour) ; ce jeu-ci est **un autre jeu**, qui reprend ce qui marche dans Duché. Cahier des charges proposé le 22/10, **à valider par l'utilisateur**, ainsi que le nom (§ 17).

## 1. Ce qu'on reprend, ce qui change

| De Duché | Ici | Pourquoi |
|---|---|---|
| Garnisons = un nombre de soldats posé sur chaque terre | **Armées visibles** : des bannières de 1 à 8 guerriers qu'on déplace de terre en terre | La 3D montre des unités qui bougent ; on voit sa force et celle de l'ennemi |
| Soldats tous pareils | **4 types** : fantassin, archer, champion, seigneur (§ 5) | Les batailles deviennent intéressantes : l'archer tire avant le contact, le champion tient la ligne |
| Bataille réglée en un tirage, montrée 2 s | **Bataille en 3 temps** : préparation (choix d'une tactique), combat regardé (6 à 10 s, accélérable), bilan (§ 6) | La bataille est le moment fort ; le joueur y a un choix |
| Nourriture, bois, or, légitimité | **Or, vivres, gloire** (§ 4) | Moins de comptes ; le bois ne servait qu'à bâtir |
| Bâtiments sur chaque terre | **Moins de bâtiments**, plus utiles : ferme, mine, caserne, tour, marché ; remparts du château améliorables | Chaque construction se voit en 3D et change la défense ou la levée |
| 30 tours | **24 tours** (6 ans, 4 saisons), parties de 20 à 30 min | Les batailles prennent du temps |
| Événements en parchemin, couronne, 9 grands électeurs | **Repris** (une partie des événements, la couronne et les électeurs) | Ce sont les parties de Duché qui marchent bien |
| Pixel art 32 bits | **3D KayKit** (tuiles, bâtiments, personnages animés) + **interface pixel art** dessinée par la page | Validé sur la maquette du 21/10 |

## 2. Principe

- **Partie** : 24 tours (un tour = une saison, l'an 1 au printemps).
- **Modes** : **Campagne du jour** (graine = date locale AAAAMMJJ, classée, **une seule tentative**, règle du 15/10 : sauvegardée à part et reprise où on l'a laissée) et **Partie libre** (graine au hasard, son meilleur score va au tableau `best`).
- **Victoire anticipée** : prendre les **3 châteaux rivaux** (conquête) ou recevoir **5 votes** des grands électeurs (couronne, § 9).
- **Défaite** : votre château pris ; ou plus d'armée, plus d'or et plus de quoi en lever.
- **Fin normale** : après le tour 24, calcul du score (§ 12).
- Deux difficultés, comme Duché : **facile** et **normal** (la campagne du jour en normal).

## 3. La carte

- **37 terres hexagonales** (un grand hexagone de 4 terres de côté, pointe en haut), tirées de la graine comme dans Duché : plaine, forêt, colline, montagne, marais, **une rivière** qui traverse la carte. Taille portable à **61 terres** plus tard (§ 16).
- **4 seigneurs** dans quatre coins : vous (or, en bas à gauche) et 3 rivaux (rouge, bleu, violet). Château de départ + 2 terres voisines.
- **Terres neutres** : villages libres (on les prend en y entrant, pas de combat) et **4 à 6 camps de brigands** (barbares et voleurs) qui gardent un trésor.
- La caméra regarde votre duché, se tourne d'un doigt, **zoome à deux doigts** ; toucher une terre l'éclaire et ouvre son panneau.
- **Brouillard** léger : les armées ennemies ne se voient qu'à 2 terres des vôtres (leur taille exacte à 1 terre). À confirmer (§ 16).

### Terrains (production par tour et effet en bataille)

| Terrain | Or | Vivres | En bataille | Déplacement |
|---|---|---|---|---|
| Plaine | — | 2 | aucun effet | 1 |
| Forêt | 1 | 1 | flèches **à moitié** contre ceux qui y sont | 2 |
| Colline | 1 | — | archers du défenseur **+1 volée** | 2 |
| Montagne | 2 | — | défense **+2** ; on n'y entre qu'à pied (pas de chariot) | 3 |
| Marais | — | 1 | attaquant **−1** au premier assaut | 2 |
| Rivière | 1 | 1 | attaquant **−1** au premier assaut (il traverse) ; un **pont** l'annule | 2 (1 avec pont) |

## 4. Ressources et économie

- **Or** : lever et entretenir les armées, bâtir. **Vivres** : nourrir les armées (1 vivre par guerrier et par tour ; **2 l'hiver**). **Gloire** (0 à 100) : victoires, événements, marchés ; elle compte pour la couronne et le score.
- **Revenus** au début du tour : somme des terres possédées + bâtiments.
- **Famine** (vivres négatifs) : chaque armée perd son guerrier le plus faible, −5 gloire.
- **Lever** des guerriers au château ou dans une caserne, dans une armée qui s'y trouve (ou une nouvelle bannière). Les recrues n'agissent qu'au tour suivant.
- **Plafond** : 3 armées au plus (4 avec 2 casernes), 8 guerriers par armée.

### Bâtiments (un par terre, plus les remparts du château)

| Bâtiment | Coût | Effet |
|---|---|---|
| Ferme | 15 or | +2 vivres (plaine, rivière) |
| Mine | 25 or | +2 or (colline, montagne) |
| Marché | 30 or | +1 or, +1 gloire par tour |
| Caserne | 30 or | on y lève des guerriers ; +1 armée au plafond |
| Tour de guet | 20 or | voit à 3 terres ; +1 défense ; les archers y tirent une volée de plus |
| Pont | 15 or | sur une rivière : déplacement 1, plus de malus d'assaut |
| Remparts (château) | 40 or, puis 80 | +2 défense par niveau (2 niveaux) |

## 5. Les guerriers

Chaque guerrier est **un personnage** sur la carte et en bataille (pas de « 1 figurine = 10 soldats » : une armée de 6, c'est 6 personnages). Personnages et animations KayKit (§ 13).

| Guerrier | Coût | Entretien | Points de vie | Attaque | Particularité |
|---|---|---|---|---|---|
| **Fantassin** (chevalier, épée et bouclier) | 10 or | 1 vivre | 3 | 1 | pare un coup sur trois en tactique « Tenir » |
| **Archer** (archer à l'arc) | 12 or | 1 vivre | 2 | 1 | tire **avant le contact** (1 volée, 2 sur colline ou en tour) ; faible au corps à corps (attaque 0 au contact s'il est en première ligne) |
| **Champion** (chevalier à l'épée à deux mains) | 25 or, caserne | 2 vivres | 4 | 2 | ne peut être levé qu'à la caserne ; frappe deux ennemis voisins |
| **Seigneur** (vous, un seul) | — | — | 5 | 2 | donne +1 en attaque à son armée ; gagne des **niveaux** (§ 7) ; s'il tombe, il n'est que **blessé** et rentre au château (2 tours sans combattre) |

- **Vétérans** : un guerrier qui survit à 2 batailles gagne +1 point de vie (petite étoile sur sa bannière).
- **Blessés** : les points de vie perdus reviennent d'un point par tour au repos sur une terre à soi (2 au château).
- Ennemis : les rivaux ont les mêmes guerriers ; les **brigands** ont des barbares (3 PV, attaque 1, ne reculent jamais) et des voleurs (2 PV, attaque 1, fuient à la moitié des pertes).

## 6. Les batailles

Une bataille a lieu quand une armée entre sur une terre gardée par une armée ennemie (ou un camp de brigands, ou un château).

1. **Préparation** (écran fixe) : les deux armées face à face, leurs guerriers, le terrain et ses effets, la **chance estimée** (calculée en simulant 50 batailles avec la même règle, affichée en %). Le joueur choisit une **tactique** :
   - **Charger** : les archers tirent une seule volée, +1 attaque au premier assaut ;
   - **Tenir** : pas d'avance, les fantassins parent un coup sur trois, +1 volée d'archers ;
   - **Harceler** : les archers tirent deux volées, puis l'armée **se retire** si elle a perdu plus de la moitié de ses guerriers (elle recule sur la terre d'où elle vient).
   Il peut aussi **renoncer** (l'armée reste où elle était, son mouvement est perdu).
2. **Combat** (6 à 10 s, regardé ; boutons **×2** et **PASSER**) :
   - **les volées** : chaque archer vivant tire, chaque flèche touche un ennemi de la première ligne (1 dégât, ou ½ en forêt) ;
   - **3 assauts** : chaque guerrier de première ligne frappe l'ennemi en face (attaque = dégâts) ; les morts sont remplacés par la ligne de derrière ;
   - la tactique adverse est choisie par l'IA (selon ses traits).
   Tout est tiré d'un **PRNG à graine** (flux `bataille`, dérivé de la graine, du tour et du n° de la bataille) : rejouer la partie redonne la même bataille ; un même calcul sert à l'aperçu de chance et à la bataille.
3. **Bilan** : VICTOIRE / DEFAITE / RETRAITE, pertes des deux côtés, vétérans, gloire gagnée, niveau du seigneur ; le vainqueur occupe la terre (bâtiment intact). Prise d'un château rival : le rival est éliminé, ses autres terres redeviennent neutres, +20 gloire.

Les batailles **entre rivaux** ne sont pas montrées : un éclair et un nuage de poussière sur la carte, une ligne dans le journal.

## 7. Le seigneur

- Niveaux 1 à 5 (expérience : +1 par bataille gagnée, +2 par château pris).
- À chaque niveau, un choix entre deux dons (tirés de la graine) : **Meneur** (+1 guerrier par armée), **Stratège** (voit la tactique adverse avant de choisir), **Bâtisseur** (−20 % sur les bâtiments), **Archer né** (+1 volée pour son armée), **Pieux** (+1 gloire par tour), **Intendant** (−1 vivre d'entretien par armée).

## 8. Un tour (ordre exact)

1. **Revenus** : production, entretien, famine éventuelle, guérison ; alertes.
2. **Événement** (environ 2 tours sur 3) : une carte en parchemin, 2 ou 3 réponses (repris de Duché, adaptés : mauvaise récolte, mercenaires à louer, révolte, tournoi, mariage, peste, marchand…).
3. **Ordres du joueur**, dans l'ordre qu'il veut : bâtir, lever, **déplacer chaque armée** (points de déplacement selon le terrain, § 3 ; 3 points par tour), fusionner ou séparer des armées sur une même terre, attaquer en entrant sur une terre gardée.
4. **FIN DU TOUR** → les rivaux jouent l'un après l'autre ; leurs armées **se déplacent sous vos yeux** (brièvement) ; s'ils vous attaquent, vous choisissez votre tactique de défense et la bataille est montrée.
5. **Bilan** : victoire, défaite, votes (dès la mort du roi), tour suivant. Sauvegarde.

## 9. Couronne

Comme Duché : le roi meurt au **tour 9** (scène en parchemin) ; à la fin des tours 9, 11, 13… 23, un des 9 grands électeurs vote selon son critère (gloire, armée, terres, or, bâtiments) pour le seigneur qui y est le meilleur, parmi ceux qui ont au moins 40 de gloire. **5 votes = couronne** (au plus tôt au tour 17). Un rival couronné met fin à la partie.

## 10. Les rivaux

- 3 seigneurs avec un nom, une couleur et **2 traits** (repris de Duché : agressif, marchand, prudent, conquérant, traître, pieux, bâtisseur).
- IA à **scores d'utilité** comme Duché, mais sur des armées : pour chaque armée, cibles possibles (terre neutre, camp de brigands, terre ou armée ennemie, château) notées selon la chance de victoire (même simulation que l'aperçu), la valeur de la terre, la menace sur son propre château et les traits ; levée et construction selon les besoins.
- Un **simulateur** (`outils/<jeu>-simulateur.js`, comme celui de Duché) joue des parties complètes pour l'équilibrage et vérifie qu'une même graine donne la même partie.

## 11. Graine et hasard

PRNG mulberry32, **aucun `Math.random()` dans la logique** (les effets visuels, eux, peuvent). Flux séparés `carte`, `paquet`, `evenement`, `bataille`, `ia`, `dons`, dérivés de (graine, usage, tour, n°), pour que les choix du joueur ne changent pas ce qui est tiré ensuite (comme Duché).

## 12. Score

Terres × 100, châteaux pris × 300, or, gloire × 5, votes × 50, niveau du seigneur × 50, guerriers vivants × 10 ; prime de conquête ou de couronne selon le tour (comme Duché) ; défaite : moitié. Tableaux `daily:AAAAMMJJ` et `best`.

## 13. Écrans (portrait, téléphone d'abord)

1. **Titre** : la carte en 3D qui tourne lentement derrière le logo, CONTINUER, CAMPAGNE DU JOUR (avec la date, REPRENDRE / FAIT), PARTIE LIBRE (facile / normal), comment jouer, CLASSEMENT, sons, ◀ LUDOTHÈQUE.
2. **Carte** : barre du haut (or, vivres, gloire, votes, tour et saison) ; la carte 3D ; les armées en personnages sur leur terre (le porte-étendard devant, une bannière avec le nombre de guerriers) ; panneau du bas selon ce qu'on touche (terre : bâtir, lever ; armée : composition, DEPLACER, séparer) ; FIN DU TOUR ; journal (3 lignes).
3. **Déplacement** : les terres atteignables s'éclairent (avec le coût) ; on touche la destination ; l'armée y marche (animation de marche).
4. **Bataille** : préparation, combat, bilan (§ 6), vue de profil sur les tuiles comme la maquette du 21/10.
5. **Événement** : parchemin, 2 ou 3 réponses.
6. **Fin** : VICTOIRE / COURONNE / DEFAITE / FIN DU REGNE, score détaillé, faits marquants, REJOUER, ◀ TITRE.
7. **Pause** : reprendre, comment jouer, sons, abandonner, ◀ LUDOTHÈQUE (règle du 17/10 : le retour se fait dans les menus du jeu).

## 14. Technique

- Dossier `<jeu>/`, **scripts classiques** : `regles.js` (carte, économie, armées, tour, couronne, score ; logique pure), `bataille.js` (règle de bataille pure et déterministe, partagée par l'aperçu, l'IA et l'écran), `ia.js`, `evenements.js`, `carte3d.js` (la carte, les armées, la caméra), `bataille3d.js` (la scène de bataille), `interface.js` (panneaux en pixel art dessinés par la page), `sons.js`, `jeu.js`, `index.html`.
- **Bibliothèques** : `lib/three.min.js`, `lib/GLTFLoader.js`, `lib/SkeletonUtils.js` (r128, déjà dans le dépôt).
- **Modèles** : tuiles et bâtiments KayKit Medieval Hexagon (CC0) convertis par `outils/kaykit-conversion.py` ; personnages KayKit Adventurers 2.0 et animations KayKit Character Animations 1.1 (CC0) préparés par `outils/duche-3d/aventuriers.js`. Fichiers de données à part (`<jeu>/modeles.js`, `<jeu>/personnages.js`), **environ 4 Mo**, mis en cache par le service worker (`sw.js` : `FILES` et `VERSION`). Écran de chargement avec une barre.
- **Performance** (Android moyen) : 30 images par seconde visées ; **un seul personnage animé par armée sur la carte** (le porte-étendard), pas un par guerrier ; les animations de la carte tournent à 30 images par seconde ; ombres sur la seule lumière du soleil ; option « graphismes légers » (sans ombres, demi-résolution).
- **Classements** : `ludo-scores.js` (jeu `<jeu>`, tableaux `daily:` et `best`), accueil (cartouche, volet), comme les autres jeux ; liste de contrôle du mémo `specs/ludotheque.md`.
- **Tests** : `fumee.js` (la page s'ouvre), `logique.js` (une partie simulée, même graine = même partie, bataille déterministe), simulateur d'équilibrage.
- Objet `window.<Jeu>` pour les tests (état, actions), comme les autres jeux.

## 15. Plan de travail

0. **Maquette** (règle du 16/10) : la maquette du 21/10 sert de base (carte, bataille, interface). Il manque une **petite maquette des nouveautés** : armées-personnages sur la carte avec leur bannière, déplacement (terres éclairées), écran de **préparation** de bataille avec les 3 tactiques. **À valider avant de programmer.**
1. **Session 1 — Règles et batailles** (Opus) : `regles.js`, `bataille.js`, `evenements.js`, simulateur ; tests de logique.
2. **Session 2 — L'IA** (Opus) : `ia.js` sur les armées, équilibrage au simulateur.
3. **Session 3 — La 3D et l'interface** (opusplan) : `carte3d.js`, `bataille3d.js`, `interface.js`, `jeu.js` (reprise du code de la maquette).
4. **Session 4 — Finitions** : sons, titre, fin, sauvegardes, classements, accueil, artefact, mémo, tests.

## 16. Points à confirmer par l'utilisateur

- **Le nom** (§ 17).
- **37 terres** pour commencer (61 plus tard), et **24 tours** ?
- **Brouillard** (on ne voit les armées ennemies qu'à 2 terres) : oui ou non ?
- **Le seigneur** qui combat lui-même et ne meurt pas (blessé seulement) : d'accord ?
- **Tactiques** : trois choix avant chaque bataille, c'est assez ? (On peut en ajouter, ou au contraire n'en garder aucune.)
- **Pas de cavalerie** : le pack gratuit KayKit n'a pas de chevaux. Le mage du pack pourrait devenir un 5ᵉ guerrier plus tard (soigneur ou feu).
- La partie du jour reste classée comme Duché : **une tentative par jour**.

## 17. Propositions de noms

Titres en MAJUSCULES sans accent (police Press Start 2P).

| Nom | À l'écran | Idée |
|---|---|---|
| **L'Ost** | L'OST | l'armée féodale levée par le seigneur, au Moyen Âge ; court et original |
| **Bannières** | BANNIERES | les armées sont des bannières qu'on déplace ; parle tout de suite |
| **Les Marches** | LES MARCHES | les terres frontalières qu'on dispute ; un peu mystérieux |
| **Le Trône vacant** | LE TRONE VACANT | le roi meurt, la couronne est à prendre |
| **Hexarque** | HEXARQUE | jeu de mots hexagone + monarque ; moderne |
| **Ban et Arrière-ban** | BAN ET ARRIERE-BAN | l'appel aux armes des vassaux ; savant mais long |

Préférence de Claude : **L'Ost** (court, médiéval, propre à ce jeu) ou **Bannières** (le plus clair).

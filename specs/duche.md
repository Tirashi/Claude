# Duché — cahier des charges

Petit jeu de gestion et de conquête au tour par tour. Le joueur dirige un duché médiéval sur une carte de 6 × 6 terres : il le développe, conquiert les terres de trois seigneurs rivaux et vise la couronne laissée vacante par le roi. **Duché du jour** commun à la famille (même carte, mêmes rivaux, mêmes événements), avec classement.

Cahier des charges fourni par l'utilisateur le 20/10, **remis au standard de la Ludothèque** (voir § 1). Remplace l'idée « Le Petit Royaume » d'`IDEES.md`, qui en était très proche.

## 1. Ce qui change par rapport au cahier des charges d'origine

| Origine | Ici | Pourquoi |
|---|---|---|
| Modules ES, `src/*.js`, `styles/` | **Scripts classiques** dans `duche/` (`regles.js`, `ia.js`, `evenements.js`, `decor.js`, `sons.js`, `jeu.js`, `index.html`, `style.css`) | Règle du dépôt : pas de modules, pas de build ; `regles.js` + `ia.js` + `evenements.js` = logique pure, aussi chargée par Node pour les tests |
| Table Supabase `scores` à créer, pseudo saisi en fin de partie | **`ludo-scores.js`** (jeu `duche`, tableaux `daily:AAAAMMJJ` et `best`) ; le joueur est celui du **code familial** de l'accueil | Tous les jeux partagent ces classements ; pas de nouveau SQL, pas de nouvelle clé |
| Graine = date **UTC** `YYYY-MM-DD` | Date **locale** `AAAAMMJJ`, comme tous les défis du jour | Le jour change à minuit pour toute la famille, comme les autres jeux |
| Mode du jour rejouable | **Une seule tentative classée par jour** (règle du 15/10) : partie du jour sauvegardée à part (`duche.dailyRun`) et reprise où on l'a laissée ; `duche.dailyTry` posé dès le premier tour ; une fois finie, le jour se rejoue hors classement | Contre la triche (rejouer une carte connue) |
| Emojis, grille CSS, desktop d'abord | **Pixel art 32 bits** (DA de la planche des coups de cœur), canvas en **portrait** sur le téléphone ; textes en Press Start 2P (titres, sans accents) et Rajdhani 700 | Style de la Ludothèque ; le site est une appli installée sur Android |
| Pas de sons en v1 | Bruitages et musique **discrets**, synthétisés en Web Audio (`sons.js`), coupables | Standard des derniers jeux (Capitaine du port, Magasinier) |
| Événement au milieu du tour, conquête après l'IA | Ordre revu (§ 5) : **événement en début de tour**, attaques parmi les décisions du joueur | Le choix de l'événement éclaire les décisions ; une seule phase où le joueur agit |
| Classement top 50 + onglet historique | Volet de l'accueil : classement du jour et meilleur score (`best`) | Déjà fourni par l'accueil |
| Partie de 20 à 30 min | 30 tours visés **en 15 à 25 min** ; partie sauvegardée à chaque action | Jeu sur téléphone, souvent par morceaux |

## 2. Principe

- **Partie** : 30 tours au plus (un tour = une saison, l'an 1 au printemps ; 30 tours = 7 ans et demi).
- **Modes** : **Duché du jour** (graine = date, classé, une tentative) et **Partie libre** (graine au hasard, non classée, meilleur score gardé dans `duche.best` et envoyé au tableau `best` ? → à confirmer, § 15).
- **Défaite** : château du joueur pris ; ou plus aucun soldat ni or ni moyen d'en produire ; ou **révolte générale** (légitimité à 0).
- **Victoires anticipées** : **conquête** (toutes les terres non neutres et tous les châteaux) ou **couronne** (majorité des votes de la noblesse, § 9).
- **Fin normale** : après le tour 30, calcul du score.

## 3. La carte

- **6 × 6 terres** (36), tirées de la graine (§ 7). Chaque terre : **terrain**, **qualité** 1 à 3 (petits épis ou pierres dessinés), **propriétaire** (joueur, rival 1 à 3, neutre), **bâtiment** (un au plus), **garnison** (soldats).
- Le joueur commence dans un **coin** (en bas à gauche), château sur une **plaine**, + 2 terres voisines. Les 3 rivaux dans les autres coins, château + 2 terres. Le reste est neutre ; 4 à 7 terres neutres tiennent une **bande de brigands** (garnison 2 à 6).
- Voisinage : les 4 voisins (haut, bas, gauche, droite).

### Terrains (rendement de base × qualité, par tour)

| Terrain | Nourriture | Bois | Or | Défense |
|---|---|---|---|---|
| Plaine | 2 | — | — | +0 |
| Forêt | — | 2 | — | +1 |
| Montagne | — | — | 2 | +3 |
| Colline | — | 1 | 1 | +2 |
| Marais | 1 | — | — | +1 |
| Rivière | 1 | — | 1 | +0 |

### Bâtiments (un par terre)

| Bâtiment | Coût | Effet |
|---|---|---|
| Ferme | 20 bois | +2 nourriture |
| Scierie | 10 bois | +2 bois |
| Mine | 30 bois | +2 or (colline ou montagne seulement) |
| Marché | 20 bois, 20 or | +1 or, +1 légitimité par tour ; ouvre le **change** |
| Caserne | 20 bois, 10 or | +5 au plafond de soldats, recrutement à −20 % ; on peut recruter sur cette terre |
| Tour de guet | 15 bois, 15 or | +2 défense de la terre |
| Château | départ seulement | +5 défense, +1 nourriture, +1 or, on y recrute ; indestructible |

## 4. Ressources et économie

- **Nourriture, bois, or, soldats** (posés sur les terres), **légitimité** (0 à 100, départ 20).
- **Revenus** au début du tour : somme des terres possédées (terrain × qualité + bâtiment).
- **Entretien** : 1 nourriture par 10 soldats (arrondi au-dessus). Nourriture négative → **famine** : −10 % des soldats (arrondi au-dessus, pris sur la plus grosse garnison), −2 légitimité, nourriture remise à 0.
- **Recrutement** sur le château ou une caserne : 1 soldat = 2 nourriture + 2 or (1,6 + 1,6 avec au moins une caserne ; on arrondit le total au-dessus). **Plafond** : 10 soldats + 5 par caserne, pour tout le duché.
- **Change** (s'il y a un marché) : 2 bois → 1 or ou 1 or → 2 bois, 5 échanges par tour.

## 5. Un tour (ordre exact)

1. **Revenus** : production, entretien, famine éventuelle ; alertes (famine au prochain tour, révolte proche).
2. **Événement** : une carte du paquet (§ 10), choix entre 2 ou 3 réponses. (Certains tours n'en ont pas : environ 2 tours sur 3 en ont un.)
3. **Décisions du joueur**, autant qu'il veut tant qu'il en a les moyens : construire, recruter, déplacer des soldats entre deux terres voisines à lui (une fois par soldat et par tour), changer au marché, **attaquer** une terre voisine (§ 6 ; chaque soldat n'attaque qu'une fois par tour).
4. **FIN DU TOUR** → les rivaux jouent l'un après l'autre (§ 8), leurs attaques sont montrées brièvement.
5. **Bilan** : victoire, défaite, votes de la noblesse (dès le tour 15), tour suivant. Sauvegarde.

## 6. Combat

- On attaque une terre **voisine de son territoire**, avec les soldats d'**une ou plusieurs terres à soi voisines** de la cible (choix du nombre avec − / +).
- **Attaque** = soldats engagés × (1 + bonus) ; bonus : trait Agressif +0,2 pour un rival.
- **Défense** = garnison + défense du terrain + défense du bâtiment.
- **Chance de victoire** = attaque / (attaque + défense), **affichée en pourcentage** avant de confirmer.
- Résolution : tirage du PRNG de combat (§ 7), montrée en **3 passes** (barres qui baissent, chocs d'épées). Le perdant perd **tous** ses soldats engagés (défenseur : toute la garnison). Le vainqueur perd `arrondi(défense × 0,5)` soldats, au plus engagés − 1 ; les survivants occupent la terre.
- La terre change de main, **bâtiment intact**. Prise d'un **château rival** : le seigneur est éliminé, +30 légitimité, ses autres terres deviennent neutres avec 1 à 3 brigands.
- Les terres neutres ne contre-attaquent jamais.

## 7. Graine et hasard

- PRNG à graine (mulberry32, celui des autres jeux). **Aucun `Math.random()` dans la logique** (les effets visuels, eux, peuvent).
- **Graine du jour** = date locale AAAAMMJJ ; l'écran titre affiche « DUCHE DU JOUR · 20 OCTOBRE ».
- La graine fixe : la carte, les traits des rivaux, l'**ordre du paquet d'événements**, les tirages internes des événements.
- **Flux séparés** pour que les choix du joueur ne changent pas ce qui est tiré ensuite : un PRNG par usage, dérivé de (graine, usage, tour, n° de l'action dans le tour) : `carte`, `paquet`, `evenement`, `combat`, `ia`. Une même attaque rejouée après rechargement donne le même résultat (la partie est de toute façon sauvegardée à chaque action, on ne peut pas « relancer le dé »).

## 8. Les rivaux

- 3 seigneurs, chacun avec un **nom**, une **couleur** (rouge, bleu, violet ; le joueur est or) et **2 traits** parmi : Agressif, Marchand, Isolationniste, Expansionniste, Traître, Pieux, Bâtisseur.
- IA à **scores d'utilité** : chaque action possible (construire X ici, recruter, déplacer, attaquer telle terre, ne rien faire) reçoit un score selon la situation (manque de nourriture, menace du joueur, cibles faibles) et les poids des traits ; le rival prend les meilleures tant qu'il a les moyens.
  - **Agressif** : recrute tôt, attaque quand sa force > 1,2 × la défense de la cible, +0,2 à l'attaque.
  - **Marchand** : marchés et or d'abord, attaque peu.
  - **Isolationniste** : défend ses frontières, ne prend que des terres neutres.
  - **Expansionniste** : prend les terres neutres en priorité.
  - **Traître** : peut rompre une alliance (avec une chance tirée de la graine) ; perd 10 légitimité quand il le fait.
  - **Pieux** : +1 légitimité par tour, événements du clergé plus favorables.
  - **Bâtisseur** : bâtit beaucoup, armée plus petite.
- Les rivaux se battent aussi **entre eux** et contre les brigands ; pas d'alliances entre rivaux.
- Toucher un château ou une terre rivale montre le **blason** du seigneur, ses 2 traits (petites icônes + mot), sa légitimité et ses soldats.
- `outils/duche-simulateur.js` joue des parties complètes (joueur automatique simple contre l'IA) pour l'équilibrage et vérifie que la même graine donne la même partie.

## 9. Légitimité et couronne

- Jauge 0 à 100, toujours visible. Gains : +1 par marché et par tour, +5 événement de cour bien résolu, +2 alliance, +10 tournoi gagné, +30 château rival pris. Pertes : −2 famine, −15 révolte.
- **Tour 15 : « Le roi est mort sans héritier »** (événement scripté, toujours tiré). À la fin de chaque tour suivant, **un des 9 grands électeurs** vote pour le duché (joueur ou rival) **le plus légitime** (égalité : celui qui a le plus de terres, puis le joueur).
- **5 votes = couronne** : victoire anticipée (au plus tôt au tour 19). Sinon, au tour 30, chaque vote compte dans le score (§ 11).
- Un rival éliminé perd ses votes (ils ne sont pas redonnés).

## 10. Événements (paquet de 14 cartes au départ)

Paquet mélangé par la graine, sans répétition avant épuisement, **tirage pondéré par la situation** (on regarde les 3 cartes du dessus et on prend la plus adaptée : famine → récoltes ; grosse armée → provocations ; légitimité < 30 → révolte).

1. **Mauvaise récolte** — perdre 30 % de la nourriture, ou payer 10 or pour en importer.
2. **Révolte paysanne** (seulement si légitimité < 30) — payer 20 or, céder une terre (la plus éloignée du château), ou réprimer (combat contre 3 à 6 révoltés sur une terre ; défaite = −15 légitimité).
3. **Brigands** — une terre neutre voisine reçoit 4 brigands, ou payer 10 or.
4. **Offre d'alliance** — un rival propose : +2 légitimité, pas d'attaque entre vous pendant 10 tours (un Traître peut rompre).
5. **Tournoi** — miser 2 à 6 soldats ou 10 à 30 or ; chance selon la mise ; gagné = +10 légitimité.
6. **Relique** — la vendre (25 or) ou l'exposer (+5 légitimité).
7. **Impôt royal** — payer 15 or ou perdre 5 légitimité (avant le tour 15 seulement).
8. **Belle récolte** — +2 nourriture par plaine (au moins 4 plaines pour qu'elle sorte).
9. **Marchand ambulant** — un échange avantageux ce tour (3 bois → 2 or, ou 1 or → 3 bois).
10. **Mariage** — marier sa fille à un rival (alliance forte de 15 tours, +5 légitimité) ou refuser (+2).
11. **Hiver précoce** — nourriture −50 % pendant 2 tours, ou brûler 15 bois pour en garder la moitié.
12. **Pèlerins** — loger (−5 nourriture, +5 légitimité) ou fermer les portes.
13. **Mercenaires** — 5 soldats pour 20 or, au-delà du plafond pour 5 tours.
14. **Le roi est mort** (tour 15, scripté, hors paquet) — ouvre la course à la couronne.

## 11. Score

- **Score = terres × 100 + or + bois ÷ 2 + bâtiments × 20 + légitimité × 5 + votes × 50 + prime**.
- Prime **conquête** : (30 − tour de la victoire) × 50 + 500 ; prime **couronne** : (30 − tour) × 80 + 500.
- Défaite : score calculé normalement, divisé par 2 (on garde le mérite d'avoir tenu).
- Classements `duche` : `daily:AAAAMMJJ` (le plus haut gagne, partie du jour seulement) ; `best` (meilleur score toutes parties confondues, partie libre comprise — à confirmer).

## 12. Écrans (portrait, téléphone d'abord)

1. **Titre** : DUCHE en logo, CONTINUER (s'il y a une partie libre en cours), DUCHE DU JOUR (avec la date, « REPRENDRE » si commencé, « FAIT » si fini), PARTIE LIBRE, comment jouer, CLASSEMENT (volet de l'accueil), bruitages / musique, ◀ LUDOTHÈQUE.
2. **Jeu** : en haut la barre des ressources (nourriture, bois, or, soldats/plafond, légitimité, TOUR 7/30, saison) ; au milieu la **carte 6 × 6** en pixel art (terrains, bâtiments, bannières de couleur du propriétaire, nombre de soldats sur chaque terre) ; en bas le **panneau de la terre touchée** (description, CONSTRUIRE, RECRUTER, DEPLACER, ATTAQUER avec la chance en %) et le bouton **FIN DU TOUR** ; journal du tour (3 lignes, qui défilent) ; pause (reprendre, comment jouer, sons, abandonner, ◀ LUDOTHÈQUE).
3. **Événement** : fenêtre façon parchemin avec une petite illustration et 2 ou 3 réponses (coût et effet écrits sur chaque bouton).
4. **Combat** : fenêtre avec les deux bannières, 3 passes de barres, résultat ; la terre prise **clignote** à la couleur du nouveau seigneur.
5. **Fin** : VICTOIRE / COURONNE / DEFAITE / FIN DU REGNE, score détaillé ligne par ligne, rang du jour, quelques faits marquants (terres prises, rivaux tombés, pic de légitimité), REJOUER (libre), ◀ TITRE.

## 13. Technique

- `duche/regles.js` : état + règles pures (`ducNouvelle(graine)`, `ducRevenus`, `ducConstruire`, `ducRecruter`, `ducDeplacer`, `ducAttaquer`, `ducChance`, `ducFinTour`, `ducScore`, `ducVictoire`), `duche/ia.js` (`ducIaJouer(etat, rival)`), `duche/evenements.js` (`DUC_EVENEMENTS`, `ducTirerEvenement`, `ducRepondre`). Toutes **fonctions pures** sur un état JSON (`RUN_V` + `migrate`), rien sur le DOM ; aussi chargées par Node.
- `duche/decor.js` (sprites pixel art des terrains, bâtiments, bannières, soldats), `duche/sons.js` (`DucSons`), `duche/jeu.js` (affichage, gestes, écrans, sauvegarde, classements ; `window.Duche` pour les tests).
- Canvas pixel art 216 × (384 à 468) agrandi sans lissage, textes écrits sur la toile fine (comme Capitaine du port) ; menus en HTML (`.plaque`).
- Sauvegardes : `duche.run` (partie libre), `duche.dailyRun`, `duche.dailyTry`, `duche.daily` {AAAAMMJJ: score}, `duche.best`, `duche.opts`, `duche.tuto`. Transfert `LUDO1-` : `daily`, `best`.
- Accueil : `GAMES`, `META` en tête, `NEWS`, `PROGRESS`, `TODAY`, `RECS`, `RANKS` ; `PSEUDO_BOARDS` ; `sw.js` ; icône 16×16 (un donjon) ; `outils/verifications.js`, `fumee.js`, `logique.js`.

## 14. Plan de travail (Opus : moteur emmêlé avec IA)

0. **Maquette** (cette conversation) : 3 directions sur un écran de téléphone, à valider.
1. **Session 1 — Règles et IA** : `regles.js`, `ia.js`, `evenements.js`, simulateur Node (déterminisme, équilibrage : une partie dure ~30 tours, le joueur automatique gagne parfois, les rivaux ne s'effondrent pas tous seuls).
2. **Session 2 — Le jeu** : `decor.js`, `jeu.js`, écrans, combat animé, événements, sauvegarde, partie libre.
3. **Session 3 — Duché du jour et finitions** : jour, classements, sons, accueil, tests, artefact, équilibrage après les premières parties.

## 15. Points à confirmer par l'utilisateur

1. La partie libre envoie-t-elle son meilleur score au tableau `best` (comme les autres jeux), ou rien du tout (comme dans le cahier d'origine) ?
2. 30 tours, c'est 15 à 25 minutes : d'accord, ou une partie plus courte (20 tours) ?
3. Duché remplace bien l'idée « Le Petit Royaume » ?
4. La direction graphique (maquette).

## 16. Critères d'acceptation

- Une partie complète se joue sans blocage sur le téléphone, interrompue et reprise à tout moment.
- Même graine → même carte, mêmes rivaux, mêmes événements (vérifié par le simulateur et `logique.js`).
- Le score du jour n'est envoyé qu'une fois, et seulement pour le Duché du jour.
- Trois graines différentes donnent des parties nettement différentes (terrains, traits, ordre des événements).

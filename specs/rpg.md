# La Dernière Lanterne (RPG) — cahier des charges

Titre provisoire, à confirmer (§ 16). Dossier prévu : `lanterne/` pour le jeu, `moteur-rpg/` pour le moteur partagé.

## 1. Demande de l'utilisateur (20/10)
- Un **petit RPG** de **5 à 10 heures**, **très simple**, avec **4 classes de base**.
- C'est le **premier jeu d'un moteur** qu'on réutilisera et améliorera pour d'autres RPG : le moteur doit être propre et séparé du contenu, et le jeu reste petit.
- **Modèle : Zelda Link's Awakening.** C'est un petit Zelda qui condense tout le charme des grands, sans histoire énorme ni lore trop profond. On veut une **histoire assez riche**, avec **quelques rebondissements**, et un **lore sympa qui se découvre tranquillement**.
- Les **statistiques doivent se comprendre** : rien de compliqué.
- Rappel de l'idée du 15/10 (`IDEES.md`) : taille Dragon Quest 1, combats au tour par tour, niveaux, équipement, sorts, une quête jusqu'au boss final. Les graphismes façon *Vampire Survivors* (pixel art gothique) restent à départager à la maquette (§ 13).

## 2. Le jeu en une phrase
Un apprenti veilleur traverse une petite vallée prisonnière de la brume pour rallumer quatre flammes sacrées. En chemin, il découvre que la lumière qu'il sert cache un très vieux mensonge.

**Ce que l'on garde de Link's Awakening :**
- un monde **petit et dense**, où chaque écran cache quelque chose ;
- des **outils** trouvés dans les donjons, qui ouvrent de nouveaux chemins sur la carte ;
- des **personnages attachants** en petit nombre ;
- un **secret** qui change le sens de la quête ;
- une **fin douce-amère**.

**Ce que l'on garde de Dragon Quest :** les combats au tour par tour, les niveaux, l'or, les boutiques, les fenêtres à curseur ▶ et le texte qui s'écrit lettre par lettre.

## 3. Périmètre (ce qui est dedans, ce qui ne l'est pas)
| Dedans | Pas dans ce premier jeu (plus tard, avec le moteur) |
|---|---|
| Un héros seul, d'une des 4 classes | Groupe de plusieurs héros (le moteur doit le permettre, § 12) |
| 1 vallée : 5 régions, 3 villages, 4 sanctuaires, l'abbaye finale, 1 donjon facultatif | Monde ouvert, bateau, plusieurs continents |
| ~25 monstres, 5 boss, 1 boss secret | Métiers, artisanat, cuisine |
| 6 talents ou sorts par classe | Arbres de compétences, changement de classe |
| 3 emplacements d'équipement | Équipement à options aléatoires |
| 4 outils d'exploration | Énigmes physiques complexes |
| 1 fin, plus une scène bonus pour qui a tout trouvé | Fins multiples, choix moraux qui se ramifient |

**Durée visée** : environ 5 h pour l'histoire seule ; 8 à 10 h pour tout trouver (pages de journal, larmes de brume, troc, donjon facultatif). On doit pouvoir **finir sans jamais s'arrêter pour gagner des niveaux**.

## 4. Le monde et le lore
### 4.1 La vallée de Morne-Val
Une vallée fermée par les montagnes et entourée d'une **brume** qui ne se lève jamais. Dans la brume rôdent des créatures. Les villages tiennent grâce aux **lanternes** : tant qu'elles brûlent, la brume recule.

Toutes les lanternes de la vallée tirent leur feu de la **Grande Lanterne** de l'abbaye de Saint-Cendre. Selon la légende, c'est **Aubrin le Porte-Flamme** qui l'a allumée il y a trois siècles, après avoir « chassé les ténèbres ». Des statues d'Aubrin, une lanterne levée, se dressent dans chaque village.

L'**ordre des Veilleurs** entretient les lanternes. Le héros en est l'apprenti.

### 4.2 La vérité (révélée petit à petit)
- **Avant Aubrin**, la brume n'était pas un mal. C'était le **souffle des Brumiens**, un peuple discret qui veillait sur la vallée et gardait la mémoire des morts. Les vivants et les Brumiens se partageaient le jour et la nuit.
- **Aubrin** était un alchimiste qui craignait la mort. Il a capturé les **quatre Gardiens** des Brumiens et enfermé leur âme dans quatre flammes, qui nourrissent la Grande Lanterne. La lanterne le **garde en vie** depuis trois siècles.
- Sans leurs gardiens, les Brumiens se sont endormis, et leur brume, devenue folle, engendre des créatures.
- Le **Prieur Vaast**, qui dirige l'abbaye et envoie le héros chercher les flammes, **est Aubrin**. La Grande Lanterne faiblit et il a besoin des quatre flammes pour la rallumer et vivre encore trois siècles.

### 4.3 Où se découvre le lore (sans jamais de long discours)
| Source | Ce qu'on y apprend |
|---|---|
| **Pages du journal d'Aubrin** (12, cachées dans le monde) | Sa peur de la mort, ses expériences, la capture des Gardiens. Les dernières pages trahissent son identité. |
| **Fresques des sanctuaires** (une par salle du boss) | L'histoire vue par les Brumiens, que l'on comprend mieux à chaque sanctuaire. |
| **Bestiaire** (une ligne par monstre vaincu) | Les monstres sont des Brumiens égarés : indices dans les descriptions. |
| **Descriptions des objets** | Petites touches (« Cire d'une lanterne. Elle sent le lys, comme les tombes. ») |
| **Isée** (§ 5) | Des phrases à double sens, qu'on relit autrement après coup. |
| **Habitants** | Rumeurs, comptines, souvenirs des anciens : beaucoup changent de réplique après chaque rebondissement. |

## 5. Personnages (peu, mais attachants)
- **Le héros** : apprenti veilleur, de la classe choisie. Le joueur choisit son nom (6 lettres, majuscules sans accent, comme la police). Il ne parle pas.
- **Mère Ysolde** : vieille veilleuse de Clairfond, qui a élevé le héros. Bourrue et tendre. Elle sait plus qu'elle ne dit.
- **Isée** : une jeune fille qui apparaît à l'orée de la brume, toujours là où on ne l'attend pas, et parle par énigmes. C'est **la dernière Brumienne éveillée** (rebondissement 2). C'est elle qui joue le rôle de Marine et du hibou de Link's Awakening.
- **Le Prieur Vaast** : doux, savant, rassurant. C'est **Aubrin** (rebondissement 3).
- **Gaspard le colporteur** et son âne Biscotte : le marchand qu'on croise partout, même dans les donjons, et le comique du jeu. Il tient la chaîne de troc (§ 8.4).
- **Les Chevaliers de cendre** : la garde de l'abbaye, en armures vides, qui apparaissent à partir de l'acte 3.

## 6. Scénario
| Acte | Durée | Ce qui se passe |
|---|---|---|
| **Prologue** | 20 min | Clairfond. La lanterne du village vacille. Mère Ysolde envoie le héros à l'abbaye de Saint-Cendre. Le Prieur explique que la Grande Lanterne faiblit et qu'il faut rallumer ses quatre flammes, dispersées dans des sanctuaires à cause de la brume. Il lui confie une lanterne de veilleur. Première rencontre avec Isée : « Tu portes la lumière… Sais-tu ce qu'elle mange ? » |
| **Acte 1** | 1 h | Bois Murmurant, puis **Sanctuaire 1, la Crypte des racines** : on y gagne la Flamme rouge. Le boss, le Grand Cerf de brume, murmure en tombant : « Encore… tu nous enfermes encore. » **Premier doute.** |
| **Acte 2** | 1 h 15 | Village de Port-Gris, Marais des cloches, puis **Sanctuaire 2, le Moulin noyé** : on y gagne la Flamme bleue. La fresque montre des silhouettes de brume qui portent des lanternes. |
| **Rebondissement 2** (milieu du jeu) | | Au sortir du moulin, Isée est blessée par des créatures, et le héros la voit **se dissoudre en brume**, puis se reformer. Elle avoue être une Brumienne. Elle le conduit au **Hameau caché** des Brumiens endormis, statues de brume figées. Elle ne demande pas d'arrêter la quête : « Rapporte les flammes. Mais ne les donne à personne avant d'avoir lu la fin de l'histoire. » |
| **Acte 3** | 1 h 15 | Hautes-Roches, puis **Sanctuaire 3, les Mines de sel** : on y gagne la Flamme d'or. Les **Chevaliers de cendre** apparaissent : le Prieur « s'inquiète » et envoie son escorte. Une page du journal porte le sceau de l'abbaye, et l'écriture est la même que celle de la dédicace que le Prieur a laissée au héros. |
| **Rebondissement 3** | | Retour à Clairfond : la lanterne du village est éteinte et Mère Ysolde a disparu. Elle a laissé une lettre : elle se doute depuis longtemps que le Prieur ne vieillit pas, et elle est partie à l'abbaye. |
| **Acte 4** | 1 h | Cimetière des cloches, puis **Sanctuaire 4, le Clocher englouti** : on y gagne la Flamme blanche. Le boss, le Sonneur, est le Gardien le plus ancien. Vaincu, il **reconnaît le héros** comme « celui qui ouvrira ». La fresque finale montre Aubrin qui capture les quatre Gardiens. Tout est clair. |
| **Final** | 45 min | Abbaye de Saint-Cendre, donjon final. Ysolde est captive des Chevaliers de cendre : on la libère, et elle se bat un tour à nos côtés (seul moment avec un allié, première brique du groupe, § 12). Au sommet, Vaast-Aubrin réclame les flammes. On refuse. **Boss final : Aubrin le Porte-Flamme**, en deux phases (l'homme, puis l'homme fondu dans la Grande Lanterne). |
| **Fin** | 10 min | Le héros brise la Grande Lanterne et libère les quatre flammes. Les Gardiens s'éveillent et la brume redevient douce : elle se lève au matin et revient le soir. Les créatures s'apaisent. Isée, qui ne tenait que par sa propre flamme, **s'efface avec l'aube** (douce-amère). Les villageois rallument leurs lanternes, cette fois **pour la nuit seulement**. |
| **Scène bonus** | | Si les 12 pages du journal sont trouvées : au printemps, une jeune fille aux yeux gris passe la porte de Clairfond. Mère Ysolde sourit. Une dernière ligne peut annoncer le prochain RPG du moteur. |

**Ton** : légèrement sombre et mélancolique, jamais effrayant ni violent : la famille y joue. Les monstres sont un peu inquiétants, mais souvent drôles (Crapaud-cloche, Gelée de cire).

## 7. Les quatre classes
On choisit sa classe au début (écran de présentation des 4 veilleurs). Chaque classe a un **rôle simple**, dit en une phrase à l'écran.

| Classe | En une phrase | Point fort | Point faible |
|---|---|---|---|
| **LAME** (guerrier) | « Frappe fort et encaisse. » | PV, Force, Défense | Presque pas de magie |
| **ARCANISTE** (mage) | « Brûle, gèle, foudroie. » | Magie, sorts de zone | PV bas, Défense faible |
| **RODEUR** (voleur) | « Frappe en premier, frappe juste. » | Vitesse, coups critiques, vol d'objets | Force moyenne |
| **CLERC** (prêtre) | « Soigne et chasse la brume. » | Soins, Lumière (très fort contre la brume) | Lent |

### 7.1 Talents et sorts (6 par classe, appris en montant de niveau)
| Niv. | LAME | ARCANISTE | RODEUR | CLERC |
|---|---|---|---|---|
| 1 | Coup puissant (×1,5, 2 PM) | Étincelle (feu) | Vol (prend un objet) | Soin |
| 4 | Cri (Force +25 % pendant 3 tours) | Givre (glace) | Coup bas (critique assuré, 3 PM) | Lumière (lumière) |
| 8 | Garde (dégâts reçus ÷ 2 pendant 1 tour) | Foudre (foudre) | Poison (dague empoisonnée) | Bénédiction (Défense +25 %) |
| 13 | Tourbillon (frappe tous les ennemis) | Nova (feu, tous les ennemis) | Esquive (évite le prochain coup) | Purification (soigne les états) |
| 18 | Brise-armure (Défense de l'ennemi ÷ 2) | Sommeil (endort) | Double lame (2 attaques) | Grand soin |
| 24 | Dernier rempart (survit à un coup fatal, 1 fois par combat) | Tempête (foudre, tous) | Ombre (Vitesse doublée) | Aube (lumière, tous) |

Les talents de la LAME et du RODEUR coûtent aussi des PM : **une seule ressource**, pour rester simple.

## 8. Exploration
### 8.1 La carte
- Vue de dessus, **écran par écran**, comme Link's Awakening : on passe d'un écran au suivant par un glissement. Écran en portrait d'environ **10 × 12 tuiles** de 16 px, agrandies au pixel près.
- **Monde** : environ **60 écrans** en 5 régions (Clairfond, Bois Murmurant, Marais des cloches avec Port-Gris, Hautes-Roches, Cimetière des cloches), plus le Hameau caché et l'abbaye.
- **Donjons** : 12 à 20 salles chacun, avec une carte du donjon, une boussole (coffres restants), des petites clés et une grande clé pour la salle du boss, comme Zelda.
- **Énigmes** simples : leviers, blocs à pousser, salles sombres, interrupteurs à activer dans l'ordre, ennemis à vaincre pour ouvrir la porte.

### 8.2 Les outils (un par sanctuaire)
Chaque outil sert **dans son donjon** puis **ouvre des chemins** sur la carte, ce qui donne envie de revenir en arrière, comme dans Zelda.

| Sanctuaire | Outil | Sur la carte |
|---|---|---|
| 1 | **Lanterne du veilleur** | Dissipe les petites nappes de brume et éclaire les salles et grottes sombres |
| 2 | **Grappin** | Franchit les ravins et l'eau en s'accrochant aux pieux |
| 3 | **Masse de mineur** | Casse les rochers fendus et les murs fissurés |
| 4 | **Cloche d'Isée** | Révèle les passages fantômes et réveille les statues |

### 8.3 Rencontres
On recommande des **monstres visibles sur la carte** plutôt que des combats au hasard (à confirmer, § 16) :
- ils errent, on peut les éviter, et les toucher lance le combat ;
- si on le touche par derrière, c'est **nous qui commençons** ; s'il nous surprend, c'est lui ;
- quand on est beaucoup plus fort qu'eux, ils fuient : plus de combats inutiles en revenant en arrière ;
- ils réapparaissent quand on quitte l'écran ou à la sauvegarde.

### 8.4 Les à-côtés (la moitié du charme de Link's Awakening)
- **12 pages du journal d'Aubrin** (lore, et scène bonus).
- **20 larmes de brume** (les coquillages de Link's Awakening) : on les rapporte à l'arbre-mémoire du Hameau caché, avec des récompenses à 5, 10, 15 et 20.
- **Chaîne de troc avec Gaspard** (8 échanges, d'une chandelle jusqu'à la **meilleure arme** de sa classe).
- **Coffres cachés** et quelques **habitants à aider** (5 ou 6 petites quêtes : un chat perdu, une cloche à rapporter…).
- **Le Puits sans fond**, donjon facultatif ouvert après la fin, avec un boss secret.

## 9. Les statistiques (simples et lisibles)
### 9.1 Six statistiques
L'écran du personnage les montre avec **une ligne d'explication chacune**. On garde ces mots en jeu, en majuscules sans accent :

| Stat | À l'écran | Ce que ça fait |
|---|---|---|
| **PV** | Points de vie | À 0, on tombe. |
| **PM** | Points de magie | Paient les sorts et les talents. |
| **FOR** | Force | Augmente les dégâts des attaques à l'arme. |
| **DEF** | Défense | Réduit les dégâts des attaques à l'arme reçues. |
| **MAG** | Magie | Augmente la puissance des sorts et des soins. |
| **VIT** | Vitesse | Qui joue en premier, chances de fuir et d'esquiver. |

Il n'y a pas de stat cachée. Il n'y a pas non plus de chance ni de résistance magique à part : **la magie ignore la Défense**, ce qui rend l'Arcaniste utile contre les armures.

### 9.2 Formules (simples, et vérifiées par des tests)
- **Attaque à l'arme** : dégâts = **FOR − DEF ÷ 2**, ± 10 % au hasard, au moins 1.
  *Exemple : FOR 20 contre DEF 12 donne 20 − 6 = 14 dégâts, soit entre 13 et 15.*
- **Sort offensif** : dégâts = **puissance du sort + MAG ÷ 2**, ± 10 %, multiplié par l'élément.
  *Exemple : Étincelle (puissance 10) avec MAG 16 donne 18 ; contre un monstre faible au feu, 27.*
- **Soin** : PV rendus = **puissance + MAG**.
- **Éléments** : feu, glace, foudre, lumière. Un monstre peut y être **faible (×1,5)**, **résistant (×0,5)** ou neutre. Le bestiaire l'indique une fois le monstre vaincu. Les créatures de brume sont toutes faibles à la lumière.
- **Coup critique** : 1 chance sur 16 (1 sur 6 pour le RODEUR). Il ignore la Défense et fait ×1,5. Le texte annonce « COUP CRITIQUE ! ».
- **Ordre du tour** : chacun tire **VIT + un petit hasard** (0 à VIT ÷ 4), et le plus grand joue en premier.
- **Esquive** : 3 % de base, plus 1 % par point de VIT au-dessus de l'attaquant, plafonnée à 25 %.
- **Fuite** : 50 % de base, plus 5 % par point de VIT au-dessus du monstre le plus rapide. Impossible contre les boss.
- **Défendre** : dégâts reçus ÷ 2 jusqu'au prochain tour.

### 9.3 Niveaux
- Niveau maximum **30**. On finit l'histoire vers le **niveau 20 à 22**, et le donjon facultatif vise le 28.
- Expérience pour passer au niveau suivant : **8 × niveau²**, à régler aux essais (par exemple 8 au niveau 1, 800 au niveau 10, 3 200 au niveau 20).
- À chaque niveau, des gains **fixes** par classe (pas de hasard, pour qu'on comprenne) :

| Classe | Départ (PV/PM/FOR/DEF/MAG/VIT) | Gain par niveau |
|---|---|---|
| LAME | 30 / 4 / 9 / 8 / 2 / 5 | +6 / +1 / +2 / +2 / +0,5 / +1 |
| ARCANISTE | 18 / 12 / 3 / 4 / 9 / 6 | +3 / +3 / +0,5 / +1 / +2,5 / +1 |
| RODEUR | 22 / 6 / 7 / 5 / 3 / 9 | +4 / +1,5 / +1,5 / +1 / +0,5 / +2 |
| CLERC | 24 / 10 / 5 / 6 / 7 / 4 | +5 / +2,5 / +1 / +1,5 / +2 / +0,5 |

  Les demi-points s'accumulent et on affiche l'arrondi. Au passage de niveau, une fenêtre montre **avant → après** (« FOR 14 → 16 »).
- Le passage de niveau **remplit les PV et les PM**.

### 9.4 Équipement
- **3 emplacements** : arme (+FOR, ou +MAG pour les bâtons), armure (+DEF), accessoire (un petit bonus : +VIT, résistance au poison…).
- Environ **5 armes par classe**, **8 armures** (légères pour tous, lourdes pour la LAME et le CLERC) et **10 accessoires**.
- En boutique, on voit tout de suite la différence : **flèche verte ▲ +3** ou **rouge ▼ −2**.

### 9.5 Objets et états
- **Objets** : Herbe (PV), Fiole bleue (PM), Antidote, Cloche de réveil, Plume de retour (retour au dernier village), Mèche (relance une lanterne de sauvegarde). Inventaire limité à **8 de chaque**.
- **3 états seulement** : **Poison** (perd des PV à chaque tour et sur la carte), **Sommeil** (passe ses tours, se réveille si on le frappe), **Silence** (pas de sorts).

## 10. Combats
- **Au tour par tour**, à la Dragon Quest : les monstres sur un décor de la région, et le héros vu de dos ou en petit portrait (à trancher à la maquette).
- **1 à 3 monstres** par combat.
- **Commandes** : ATTAQUE, TALENT (ou MAGIE), OBJET, DEFENSE, FUITE. Curseur ▶, gros boutons au doigt.
- Textes courts lettre par lettre (« LE CRAPAUD-CLOCHE PERD 12 PV ! »), qu'on peut accélérer d'un toucher.
- **Fin du combat** : expérience, écus, parfois un objet.
- **Défaite** : retour à la dernière lanterne avec **la moitié des écus**, l'expérience gardée. C'est indulgent, comme Dragon Quest.
- **Boss** : 2 phases pour certains, avec un **signal clair** avant une grosse attaque (« LE CERF BAISSE SES BOIS… ») : on apprend à Défendre au bon moment.

### 10.1 Bestiaire (ordre de grandeur)
Environ **25 monstres**, 5 par région, avec quelques variantes de couleur plus fortes dans le donjon facultatif (comme Dragon Quest).
- *Exemples* : Feu follet, Corbeau de brume, Crapaud-cloche, Gelée de cire, Loup gris, Squelette lanternier, Armure vide, Chevalier de cendre, Spectre du clocher…
- **Boss** :
  1. le Grand Cerf de brume ;
  2. la Dame du moulin ;
  3. le Golem de sel ;
  4. le Sonneur ;
  5. Aubrin le Porte-Flamme (2 phases) ;
  6. boss secret : l'Ancien du puits.

## 11. Écrans et commandes (téléphone, en portrait)
- **Carte** : la carte en haut, avec en bas une **croix** virtuelle, un bouton **A** (parler, ouvrir, agir), un bouton **B** (outil choisi) et **MENU**.
- **Menu** : PERSONNAGE (stats expliquées), OBJETS, EQUIPEMENT, OUTILS, JOURNAL (quête en cours en une phrase, pages trouvées, bestiaire), CARTE, OPTIONS, et **RETOUR A LA LUDOTHEQUE** (règle du 17/10, pas de bouton ajouté par-dessus le jeu).
- **Dialogues** : fenêtre en bas, texte lettre par lettre, ▼ pour continuer, choix OUI / NON.
- **Sauvegarde** : aux **lanternes** des villages et des donjons (on les allume, elles soignent). Une **sauvegarde de reprise** automatique est faite à chaque changement d'écran, parce qu'Android ferme souvent l'appli. **3 emplacements**.
- Le texte respecte la police Press Start 2P : majuscules sans accent dans le jeu.

## 12. Le moteur (l'enjeu durable)
### 12.1 Principe
Le **moteur ne sait rien de ce jeu**. Tout le contenu (cartes, dialogues, monstres, classes, objets, événements) est fait de **données**. Le prochain RPG réutilisera `moteur-rpg/` tel quel et n'apportera que ses données.

Comme le reste de la Ludothèque : **scripts classiques**, sans build, sans modules ES ni npm (`<script src>`), avec un espace de noms `window.MoteurRPG`.

### 12.2 Découpage proposé
| Fichier (`moteur-rpg/`) | Rôle | Testable sous Node |
|---|---|---|
| `regles.js` | Formules des stats, niveaux, dégâts, éléments, états, fuite (§ 9) | Oui |
| `combat.js` | Déroulé d'un combat : ordre, actions, IA des monstres, récompenses ; **combattants en tableaux** (groupe de 1 à 4 héros prêt pour la suite) | Oui |
| `monde.js` | Cartes en tuiles, écrans, collisions, sorties, déclencheurs, monstres qui errent | Oui (la logique) |
| `evenements.js` | Petit langage de scripts : `dire`, `choix`, `si drapeau`, `donner`, `prendre`, `combat`, `teleporter`, `drapeau`… | Oui |
| `etat.js` | État de la partie (héros, inventaire, drapeaux, outils) et sauvegarde/chargement JSON (avec un numéro de version) | Oui |
| `rendu.js` | Dessin sur canvas : tuiles, sprites, fenêtres, transitions | Non |
| `interface.js` | Fenêtres, curseur ▶, texte lettre par lettre, menus | Non |
| `entrees.js` | Croix, boutons, clavier pour les tests | Non |
| `sons.js` | Bips, effets et musique chiptune (WebAudio, comme les autres jeux) | Non |

| Fichier (`lanterne/`) | Contenu |
|---|---|
| `index.html`, `jeu.js` | Branche le moteur aux données, écran titre, choix de classe |
| `donnees/classes.js`, `monstres.js`, `objets.js`, `talents.js` | Tableaux de données (§ 7, 9, 10) |
| `donnees/cartes.js` | Cartes en **grilles de caractères** (une lettre par tuile), lisibles et faciles à comparer dans git |
| `donnees/dialogues.js`, `evenements.js` | Textes et scripts du scénario |
| `sprites.js` | Pixel art (comme `icones.js`) |

### 12.3 Vérifications automatiques (dans `outils/`)
- Dans `verifications.js` : **cohérence des données**. Chaque objet, monstre ou carte cités existent ; chaque sortie d'écran mène quelque part ; chaque drapeau lu est écrit quelque part.
- **Solveur d'accessibilité** : à partir du début, en suivant les outils et les clés obtenus, on doit atteindre la fin et chaque coffre. Cela garantit qu'aucun objet n'est perdu et qu'on ne se retrouve jamais bloqué.
- **Combats simulés** sous Node : un héros de chaque classe, au niveau prévu, bat chaque boss en moyenne en 5 à 10 tours. C'est l'équilibrage chiffré.
- Dans `fumee.js` : le jeu se charge, on choisit une classe, on fait un combat.

## 13. Direction artistique
À choisir **sur maquette** (règle du 16/10) : 2 ou 3 directions sur un écran de téléphone, chacune avec **un écran de carte**, **un combat** et **une fenêtre de dialogue**. Pistes :
- **A — Gothique façon *Vampire Survivors*** (idée du 15/10) : pixel art sombre, contrastes forts, petits sprites expressifs.
- **B — 16 bits façon Link's Awakening DX et Dragon Quest** : couleurs douces, fenêtres bleues à double bord (celles que l'utilisateur a aimées dans les maquettes Dragon Quest du 19/10).
- **C — 32 bits** de la planche des coups de cœur (comme Capitaine du port) : plus de détails, lumière des lanternes sur la brume.

Quel que soit le style, la **brume** et la **lumière des lanternes** doivent être belles : c'est le cœur du jeu (halo qui repousse la brume autour du héros).

## 14. Sons et musique
Bips de texte, effets de combat, petite fanfare de passage de niveau et de coffre. Musique chiptune courte en boucle : village, carte, donjon, combat, boss, fin. Réglages musique et effets séparés.

## 15. Intégration à la Ludothèque
- Une cartouche sur l'accueil et un volet avec les records : **temps de fin le plus court**, **complétion en %**, **classe utilisée**.
- Classements dans `ludo-scores.js` (temps de fin et complétion), à confirmer.
- Sauvegardes comprises dans le transfert `LUDO1-` ; `sw.js` complété (`FILES`, `VERSION`).
- Artefact : lien à demander à l'utilisateur au premier publish.

## 16. Points à confirmer avec l'utilisateur
1. **Titre** : « La Dernière Lanterne » vous va-t-il ?
2. **Héros seul** d'une classe au choix (recommandé : petit périmètre, esprit Dragon Quest 1) **ou groupe des 4 classes** dès ce jeu ? Le moteur sera prêt pour un groupe dans tous les cas.
3. **Monstres visibles sur la carte** (recommandé) ou **combats au hasard** façon Dragon Quest ?
4. **Ton** : mélancolique mais familial, et la fin douce-amère (Isée disparaît), cela vous va ?
5. **Défaite** : perte de la moitié des écus, est-ce trop dur pour la famille ?
6. **Classements** : temps de fin et complétion, ou pas de classement pour un RPG ?

## 17. Plan de travail proposé (une conversation par session)
| Session | Contenu | Modèle |
|---|---|---|
| 0 | **Maquette** : 2 ou 3 directions (carte, combat, dialogue) puis validation | Sonnet, ou Opus pour la décision |
| 1 | Moteur **monde** : écrans, déplacement, collisions, PNJ, dialogues, événements, drapeaux, sauvegarde ; Clairfond jouable | Opus |
| 2 | Moteur **combat** : règles, 4 classes, talents, niveaux, équipement ; tests Node et combats simulés | Opus |
| 3 | Contenu **prologue et acte 1** (Bois, Crypte, Grand Cerf) ; solveur d'accessibilité | opusplan |
| 4 | **Actes 2 et 3** (marais, moulin, Hameau caché, mines) | opusplan |
| 5 | **Acte 4, final, fin**, scène bonus, à-côtés (pages, larmes, troc), donjon facultatif | opusplan |
| 6 | Équilibrage, sons et musique, accueil, classements, `sw.js`, artefact | Sonnet |

# La Dernière Lanterne (RPG) — cahier des charges

Titre validé (20/10). Dossier prévu : `lanterne/` pour le jeu, `moteur-rpg/` pour le moteur partagé.

## 0. Décisions de l'utilisateur (20/10, après relecture)
- **Titre** : « La Dernière Lanterne », validé.
- **Une équipe de plusieurs héros**, pas un héros seul : les 4 classes sont 4 compagnons qui rejoignent l'équipe au fil de l'histoire (§ 5, § 7).
- **RPG au tour par tour** : on se déplace librement sur la carte, mais **tous les combats se jouent au tour par tour**, sans aucune action en temps réel (§ 10).
- **Défaite** : perdre la moitié des écus est trop dur. On fait des **sauvegardes automatiques aux moments clés**. Si l'équipe tombe, on **reprend à la sauvegarde la plus récente**, automatique ou faite à la main, sans autre perte (§ 11.1).
- **Pas de classement.**
- **Coquillages et troc** : on les garde pour le moment, mais **cela copie trop Zelda**. Il faut s'en inspirer, pas les reproduire, et les remplacer par des idées propres au jeu (§ 8.4).
- Ton mélancolique et fin douce-amère : sans objection.
- **Ensuite (20/10)** : d'accord avec toutes les propositions : **monstres visibles sur la carte**, **l'équipe** du § 5.1, et **remplacement tout de suite** des larmes et du troc par les lanternes oubliées et les quêtes des compagnons (§ 8.4).

## 1. Demande de l'utilisateur (20/10)
- Un **petit RPG** de **5 à 10 heures**, **très simple**, avec **4 classes de base**.
- C'est le **premier jeu d'un moteur** qu'on réutilisera et améliorera pour d'autres RPG : le moteur doit être propre et séparé du contenu, et le jeu reste petit.
- **Modèle : Zelda Link's Awakening.** C'est un petit Zelda qui condense tout le charme des grands, sans histoire énorme ni lore trop profond. On veut une **histoire assez riche**, avec **quelques rebondissements**, et un **lore sympa qui se découvre tranquillement**.
- Les **statistiques doivent se comprendre** : rien de compliqué.
- Rappel de l'idée du 15/10 (`IDEES.md`) : taille Dragon Quest 1, combats au tour par tour, niveaux, équipement, sorts, une quête jusqu'au boss final. Les graphismes façon *Vampire Survivors* (pixel art gothique) restent à départager à la maquette (§ 13).

## 2. Le jeu en une phrase
Un apprenti veilleur et trois compagnons traversent une petite vallée prisonnière de la brume pour rallumer quatre flammes sacrées. En chemin, ils découvrent que la lumière qu'ils servent cache un très vieux mensonge. **Les combats sont au tour par tour.**

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
| Une équipe de 4 héros, un par classe, qui se forme au fil de l'histoire | Équipe à composer soi-même, réserve de héros, changement de classe |
| Combats au tour par tour | Combats en temps réel, action |
| 1 vallée : 5 régions, 3 villages, 4 sanctuaires, l'abbaye finale, 1 donjon facultatif | Monde ouvert, bateau, plusieurs continents |
| ~25 monstres, 5 boss, 1 boss secret | Métiers, artisanat, cuisine |
| 6 talents ou sorts par classe | Arbres de compétences, changement de classe |
| 3 emplacements d'équipement | Équipement à options aléatoires |
| 4 outils d'exploration | Énigmes physiques complexes |
| 1 fin, plus une scène bonus pour qui a tout trouvé | Fins multiples, choix moraux qui se ramifient |

**Durée visée** : environ 5 h pour l'histoire seule ; 8 à 10 h pour tout trouver (pages de journal, à-côtés du § 8.4, quêtes des compagnons, donjon facultatif). On doit pouvoir **finir sans jamais s'arrêter pour gagner des niveaux**.

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
### 5.1 L'équipe (4 héros, un par classe)
Le joueur ne choisit pas les classes : chaque compagnon a la sienne et **sa propre histoire**, liée au lore. Un compagnon qui rejoint l'équipe arrive **au niveau du héros**, pour ne jamais être à la traîne.

| Héros | Classe | Arrivée | Qui il est | Son fil dans l'histoire |
|---|---|---|---|---|
| **Le héros** (nom au choix, 6 lettres, majuscules sans accent) | LAME | Dès le début | Apprenti veilleur de Clairfond, élevé par Mère Ysolde. Il ne parle pas : c'est le joueur. | Le fil principal. |
| **ELOI** | CLERC | Prologue | Jeune novice de l'abbaye, élevé par le Prieur, sincère et un peu naïf. Le Prieur l'envoie « pour vous aider » ; en vérité, pour savoir où vous en êtes. | C'est lui que le rebondissement 3 frappe le plus fort. Sa quête : retrouver le registre des novices, où le même visage de Prieur revient depuis trois siècles. Au final, c'est lui qui fait face à Vaast. |
| **VERENE** | ARCANISTE | Fin de l'acte 1 (dans le Bois Murmurant) | Savante qui étudie la brume et la croit vivante. Personne ne la prend au sérieux. Pince-sans-rire. | C'est elle qui **déchiffre les fresques** des sanctuaires : le lore passe par sa bouche, petit à petit. Sa quête : retrouver les carnets de son maître, disparu dans la brume. |
| **MAUD** | RODEUR | Acte 2 (à Port-Gris) | Contrebandière des marais, qui connaît les sentiers de la brume. Gouailleuse, au grand cœur. | Son petit frère s'est perdu dans la brume il y a des années. Au Hameau caché, elle retrouve son écharpe sur une statue endormie. À la fin, quand la brume redevient douce, **il revient** (la note chaude face au départ d'Isée). |

- **Combats** : les 4 se battent ensemble, comme dans Dragon Quest. Avant les 4, l'équipe est simplement plus petite.
- **Veillées** : à chaque lanterne de sauvegarde, on peut **écouter l'équipe parler**, en une ou deux répliques qui changent avec l'avancée. Cela donne la personnalité des compagnons et des indices de lore, sans jamais être obligatoire.

### 5.2 Les autres personnages
- **Mère Ysolde** : vieille veilleuse de Clairfond, qui a élevé le héros. Bourrue et tendre. Elle sait plus qu'elle ne dit.
- **Isée** : une jeune fille qui apparaît à l'orée de la brume, toujours là où on ne l'attend pas, et parle par énigmes. C'est **la dernière Brumienne éveillée** (rebondissement 2). C'est elle qui joue le rôle de Marine et du hibou de Link's Awakening.
- **Le Prieur Vaast** : doux, savant, rassurant. C'est **Aubrin** (rebondissement 3).
- **Gaspard le colporteur** et son âne Biscotte : le marchand qu'on croise partout, même dans les donjons, et le comique du jeu.
- **Les Chevaliers de cendre** : la garde de l'abbaye, en armures vides, qui apparaissent à partir de l'acte 3.

### 5.3 Clins d'œil à d'autres RPG (idée de l'utilisateur, 22/10)
Quelques habitants peuvent rappeler des héros d'autres RPG, **toujours discrètement** : jamais le vrai nom, seulement un détail qu'un connaisseur reconnaîtra.
- **Nuage** (Clairfond, session 1) : jeune homme blond qui veut faire forger « l'épée la plus grande du monde » et jure n'avoir « jamais été soldat… enfin, je crois pas » (Cloud, Final Fantasy VII).
- **Le garçon en vert** (Clairfond, session 1) : oreilles pointues, chapeau pointu vert, il tranche l'herbe en criant « Hyaa ! » et fouille dedans, déçu (Link, Zelda).
- Idées pour la suite : un dresseur de petits monstres à Port-Gris, un héros endormi qui attend « son tour » depuis mille ans dans le Hameau caché, un marchand qui répète « Merci de votre visite ! » dans les marais.

## 6. Scénario
| Acte | Durée | Ce qui se passe |
|---|---|---|
| **Prologue** | 20 min | Clairfond. La lanterne du village vacille. Mère Ysolde envoie le héros à l'abbaye de Saint-Cendre. Le Prieur explique que la Grande Lanterne faiblit et qu'il faut rallumer ses quatre flammes, dispersées dans des sanctuaires à cause de la brume. Il lui confie une lanterne de veilleur et le novice **ELOI** (CLERC), qui rejoint l'équipe. Première rencontre avec Isée : « Tu portes la lumière… Sais-tu ce qu'elle mange ? » |
| **Acte 1** | 1 h | Bois Murmurant, où l'on tire **VERENE** (ARCANISTE) des griffes de créatures : elle rejoint l'équipe. Puis **Sanctuaire 1, la Crypte des racines** : on y gagne la Flamme rouge. Le boss, **le Roi des aulnes** (choix de l'utilisateur, 22/10, au lieu du Grand Cerf), murmure en tombant : « Encore… tu nous enfermes encore. » **Premier doute.** |
| **Acte 2** | 1 h 15 | Village de Port-Gris, où **MAUD** (RODEUR) accepte de guider l'équipe dans la brume (l'équipe est complète), Marais des cloches, puis **Sanctuaire 2, le Moulin noyé** : on y gagne la Flamme bleue. La fresque montre des silhouettes de brume qui portent des lanternes ; VERENE commence à comprendre. |
| **Rebondissement 2** (milieu du jeu) | | Au sortir du moulin, Isée est blessée par des créatures, et l'équipe la voit **se dissoudre en brume**, puis se reformer. Elle avoue être une Brumienne. Elle conduit l'équipe au **Hameau caché** des Brumiens endormis, statues de brume figées. MAUD y trouve l'écharpe de son frère. Elle ne demande pas d'arrêter la quête : « Rapporte les flammes. Mais ne les donne à personne avant d'avoir lu la fin de l'histoire. » |
| **Acte 3** | 1 h 15 | Hautes-Roches, puis **Sanctuaire 3, les Mines de sel** : on y gagne la Flamme d'or. Les **Chevaliers de cendre** apparaissent : le Prieur « s'inquiète » et envoie son escorte. Une page du journal porte le sceau de l'abbaye, et ELOI reconnaît l'écriture du Prieur. |
| **Rebondissement 3** | | Retour à Clairfond : la lanterne du village est éteinte et Mère Ysolde a disparu. Elle a laissé une lettre : elle se doute depuis longtemps que le Prieur ne vieillit pas, et elle est partie à l'abbaye. |
| **Acte 4** | 1 h | Cimetière des cloches, puis **Sanctuaire 4, le Clocher englouti** : on y gagne la Flamme blanche. Le boss, le Sonneur, est le Gardien le plus ancien. Vaincu, il **reconnaît le héros** comme « celui qui ouvrira ». La fresque finale montre Aubrin qui capture les quatre Gardiens. Tout est clair. |
| **Final** | 45 min | Abbaye de Saint-Cendre, donjon final. Ysolde est captive des Chevaliers de cendre : on la libère. Au sommet, Vaast-Aubrin réclame les flammes ; ELOI lui fait face et refuse au nom de l'équipe. **Boss final : Aubrin le Porte-Flamme**, en deux phases (l'homme, puis l'homme fondu dans la Grande Lanterne). |
| **Fin** | 10 min | Le héros brise la Grande Lanterne et libère les quatre flammes. Les Gardiens s'éveillent et la brume redevient douce : elle se lève au matin et revient le soir. Les créatures s'apaisent, et le frère de MAUD sort de la brume. Isée, qui ne tenait que par sa propre flamme, **s'efface avec l'aube** (douce-amère). Les villageois rallument leurs lanternes, cette fois **pour la nuit seulement**. |
| **Scène bonus** | | Si les 12 pages du journal sont trouvées : au printemps, une jeune fille aux yeux gris passe la porte de Clairfond. Mère Ysolde sourit. Une dernière ligne peut annoncer le prochain RPG du moteur. |

**Ton** : légèrement sombre et mélancolique, jamais effrayant ni violent : la famille y joue. Les monstres sont un peu inquiétants, mais souvent drôles (Crapaud-cloche, Gelée de cire).

## 7. Les quatre classes
Une classe par héros de l'équipe (§ 5.1) : LAME pour le héros, CLERC pour ELOI, ARCANISTE pour VERENE, RODEUR pour MAUD. Chaque classe a un **rôle simple**, dit en une phrase à l'écran. Avec quatre rôles qui se complètent (encaisser, soigner, détruire, frapper vite), l'équipe a tout de suite du sens.

| Classe | En une phrase | Point fort | Point faible |
|---|---|---|---|
| **LAME** (guerrier) | « Frappe fort et protège l'équipe. » | PV, Force, Défense | Presque pas de magie |
| **ARCANISTE** (mage) | « Brûle, gèle, foudroie. » | Magie, sorts de zone | PV bas, Défense faible |
| **RODEUR** (voleur) | « Frappe en premier, frappe juste. » | Vitesse, coups critiques, vol d'objets | Force moyenne |
| **CLERC** (prêtre) | « Soigne et chasse la brume. » | Soins, Lumière (très fort contre la brume) | Lent |

### 7.1 Talents et sorts (6 par classe, appris en montant de niveau)
| Niv. | LAME | ARCANISTE | RODEUR | CLERC |
|---|---|---|---|---|
| 1 | Coup puissant (×1,5, 2 PM) | Étincelle (feu) | Vol (prend un objet) | Soin |
| 4 | Cri (Force +25 % pendant 3 tours) | Givre (glace) | Coup bas (critique assuré, 3 PM) | Lumière (lumière) |
| 8 | Protection (reçoit à la place d'un allié les coups d'un tour) | Foudre (foudre) | Poison (dague empoisonnée) | Bénédiction (Défense +25 %) |
| 13 | Tourbillon (frappe tous les ennemis) | Nova (feu, tous les ennemis) | Esquive (évite le prochain coup) | Purification (soigne les états) |
| 18 | Brise-armure (Défense de l'ennemi ÷ 2) | Sommeil (endort) | Double lame (2 attaques) | Soin de groupe |
| 24 | Rempart (toute l'équipe : dégâts reçus ÷ 2 pendant 1 tour) | Tempête (foudre, tous) | Ombre (Vitesse doublée) | Aube (lumière, tous) |

Les talents de la LAME et du RODEUR coûtent aussi des PM : **une seule ressource**, pour rester simple. Le CLERC apprend aussi **Relève** au niveau 10 (relève un allié tombé avec la moitié de ses PV).

## 8. Exploration
### 8.1 La carte
- Sur la carte, seul le chef de file est dessiné, et les autres le suivent en file (comme Dragon Quest) ; on se déplace librement, mais **rien ne se joue en temps réel**.
- ~~Vue de dessus, écran par écran, comme Link's Awakening, environ 10 × 12 tuiles de 16 px.~~ **Fait autrement (session 1, 22/10)** : avec la DA validée (Dungeon Crawl 32 × 32 en HD-2D), la **caméra suit l'équipe** dans des cartes de toutes tailles (une carte = un lieu : village, route, maison), et on passe d'une carte à l'autre par un fondu au noir. Environ 8 tuiles de large à l'écran. À changer si l'utilisateur préfère l'écran par écran.
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
**Monstres visibles sur la carte**, pas de combats au hasard (décision du 20/10) :
- ils errent, on peut les éviter, et les toucher lance le combat ;
- si on le touche par derrière, c'est **nous qui commençons** ; s'il nous surprend, c'est lui ;
- quand on est beaucoup plus fort qu'eux, ils fuient : plus de combats inutiles en revenant en arrière ;
- ils réapparaissent quand on quitte l'écran ou à la sauvegarde.

### 8.4 Les à-côtés
- **12 pages du journal d'Aubrin** (lore, et scène bonus).
- **Quêtes des compagnons** (une par compagnon, § 5.1) : le registre d'ELOI, les carnets du maître de VERENE, l'écharpe du frère de MAUD. Chacune se termine par la **meilleure arme** du compagnon.
- **Les lanternes oubliées** : 20 vieilles lanternes éteintes, cachées dans la vallée. En rallumer une montre un **souvenir de brume** (une scène muette du passé, donc du lore) et éclaire pour de bon un coin de la carte. Récompenses à 5, 10, 15 et 20 (chez Mère Ysolde). Tout est rallumé à la fin : une vallée constellée.
- *Les larmes de brume et la chaîne de troc ont été retirées le 20/10* : trop proches des coquillages et du troc de Zelda. Les lanternes oubliées et les quêtes des compagnons les remplacent.
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
- **Fuite** : 50 % de base, plus 5 % par point de VIT au-dessus du monstre le plus rapide. Impossible contre les boss et les combats marqués `fuite: false` (combat d'histoire, par ex. Vérène ; sur un événement `{ combat, fuite: false }` ou un monstre de carte).
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
- **Expérience partagée** : chaque héros debout reçoit toute l'expérience du combat (pas de division), pour que l'équipe monte ensemble.

### 9.4 Équipement
- **3 emplacements** : arme (+FOR, ou +MAG pour les bâtons), armure (+DEF), accessoire (un petit bonus : +VIT, résistance au poison…).
- Environ **5 armes par classe**, **8 armures** (légères pour tous, lourdes pour la LAME et le CLERC) et **10 accessoires**.
- En boutique, on voit tout de suite la différence : **flèche verte ▲ +3** ou **rouge ▼ −2**.

### 9.5 Objets et états
- **Objets** : Herbe (PV), Fiole bleue (PM), Antidote, Cloche de réveil, Plume de phénix (relève un héros à terre), Plume de retour (retour au dernier village), Mèche (relance une lanterne de sauvegarde). Inventaire limité à **8 de chaque**.
- **3 états seulement** : **Poison** (perd des PV à chaque tour et sur la carte), **Sommeil** (passe ses tours, se réveille si on le frappe), **Silence** (pas de sorts).

## 10. Combats
- **Au tour par tour**, à la Dragon Quest : les monstres sur un décor de la région. **Fait (session 2)** : vue de côté en HD-2D comme la maquette validée, monstres à gauche, équipe à droite, décor du lieu (`combat` dans la carte, sinon le décor d'extérieur).
- **Strictement au tour par tour** : au début de chaque tour, on choisit l'action de **chaque héros**, puis tout le monde agit dans l'ordre de la Vitesse. Rien ne presse : on peut réfléchir aussi longtemps qu'on veut.
- **1 à 4 monstres** par combat, contre l'équipe de 1 à 4 héros.
- Un héros à 0 PV est **à terre** : il ne joue plus et ne gagne pas d'expérience jusqu'à ce qu'on le relève (sort Relève, objet Plume de phénix, ou une lanterne). Si **toute l'équipe** tombe, c'est la défaite.
- **Commandes** : ATTAQUE, TALENT (ou MAGIE), OBJET, DEFENSE, FUITE. Curseur ▶, gros boutons au doigt.
- Textes courts lettre par lettre (« LE CRAPAUD-CLOCHE PERD 12 PV ! »), qu'on peut accélérer d'un toucher.
- **Fin du combat** : expérience, écus, parfois un objet.
- **Défaite** : on reprend à la **sauvegarde la plus récente** (§ 11.1), sans autre perte.
- **Boss** : 2 phases pour certains, avec un **signal clair** avant une grosse attaque (« Le Roi des aulnes plonge ses racines dans le sol… ») : on apprend à Défendre ou à utiliser Protection et Rempart au bon moment.

### 10.1 Bestiaire (ordre de grandeur)
Environ **25 monstres**, 5 par région, avec quelques variantes de couleur plus fortes dans le donjon facultatif (comme Dragon Quest).
- *Exemples* : Feu follet, Corbeau de brume, Crapaud-cloche, Gelée de cire, Loup gris, Squelette lanternier, Armure vide, Chevalier de cendre, Spectre du clocher…
- **Boss** :
  1. le Roi des aulnes (Crypte des racines) ;
  2. la Dame du moulin ;
  3. le Golem de sel ;
  4. le Sonneur ;
  5. Aubrin le Porte-Flamme (2 phases) ;
  6. boss secret : l'Ancien du puits.

### 10.2 Refonte du combat à faire (retours du 24/10, prochaine session)
Retour après le Roi des aulnes : « on ne comprend pas vraiment ce qu'il se passe », l'herbe arrive après les coups, les attaques semblent partir en retard. Cause : on choisit les actions de toute l'équipe, puis tout se résout d'un coup dans l'ordre de la Vitesse (rien ne relie le bouton à l'action ; un héros mis K.O. avant son rang perd son action). Correctif rapide fait le 24/10 : objets prioritaires, herbe 50 PV, Roi des aulnes 220 PV (simulé : 42 % de victoires au niveau 3, 96 % au niveau 4). À faire, **maquette jouable du combat contre le Roi d'abord** :
1. **Tour par tour façon Octopath** : frise de l'ordre de passage (portraits) en haut ; on choisit l'action d'un héros quand vient son tour, et il agit aussitôt.
2. **Lisibilité** : bandeau par action (« Le Roi des aulnes attaque Eloi : 18 »), acteur mis en avant, barre de PV du boss, avertissement très visible quand il prépare l'Étreinte (conseil : Défense), réglage de vitesse.
3. Plus d'herbes dans les coffres avant la crypte.
4. Équilibrage revu avec le nouveau système (viser 80 % de victoires au niveau 4).
5. « Réessayer le combat » juste avant le boss après une défaite.
6. **Coup critique** (demande du 25/10) : aujourd'hui il ignore la Défense puis fait × 1,5 (§ 9.2), si bien qu'un critique de monstre fait 2 à 5 fois un coup normal (feu follet contre Alden : 2 → 10,5 ; Roi des aulnes : 11 → 28,5 ; une Étreinte critique fait 41 à 50 PV à chacun). Nouvelle règle : **critique = coup normal × 1,5**, (FOR − DEF ÷ 2) × 1,5, pour tous ; « ignore la Défense » réservé à un talent du RODEUR ; les attaques chargées et les sorts de zone ne sont jamais critiques. Mettre à jour § 9.2, `degatsArme` (`moteur-rpg/regles.js`), les tests et l'équilibrage.

## 11. Écrans et commandes (téléphone, en portrait)
- **Carte** : la carte en haut, avec en bas une **croix** virtuelle, un bouton **A** (parler, ouvrir, agir), un bouton **B** (outil choisi) et **MENU**.
- **Menu** : EQUIPE (stats de chacun, expliquées ; ordre de la file), OBJETS, EQUIPEMENT, OUTILS, JOURNAL (quête en cours en une phrase, pages trouvées, bestiaire), CARTE, OPTIONS, et **RETOUR A LA LUDOTHEQUE** (règle du 17/10, pas de bouton ajouté par-dessus le jeu).
- **Dialogues** : fenêtre en bas, texte lettre par lettre, ▼ pour continuer, choix OUI / NON.
- Police **Pixelify Sans** (DA du 22/10, hébergée dans `polices/`) : textes normaux, avec accents (la règle des majuscules sans accent ne valait que pour Press Start 2P). Nom du héros : 8 lettres au plus, en majuscules.

### 11.1 Sauvegardes (décision du 20/10)
- **Sauvegardes automatiques aux moments clés** : arrivée dans un village, entrée d'un donjon, porte d'un boss, après chaque événement du scénario et chaque boss vaincu. Il n'y a jamais plus d'environ **15 minutes** de jeu entre deux sauvegardes. Un petit « SAUVEGARDE… » s'affiche dans un coin.
- **Sauvegarde à la main** aux **lanternes** des villages et des donjons. Allumer une lanterne soigne aussi toute l'équipe et relève les héros à terre.
- **Défaite** : on reprend à la **plus récente** des deux, automatique ou à la main, **sans rien perdre d'autre** (ni écus, ni objets).
- **Reprise de l'appli** : Android ferme souvent l'appli. Une copie de l'état est donc gardée à chaque changement d'écran, **seulement pour rouvrir le jeu là où on l'a quitté**. Elle ne sert pas de point de retour en cas de défaite.
- **3 emplacements** de partie.

## 12. Le moteur (l'enjeu durable)
### 12.1 Principe
Le **moteur ne sait rien de ce jeu**. Tout le contenu (cartes, dialogues, monstres, classes, objets, événements) est fait de **données**. Le prochain RPG réutilisera `moteur-rpg/` tel quel et n'apportera que ses données.

Comme le reste de la Ludothèque : **scripts classiques**, sans build, sans modules ES ni npm (`<script src>`), avec un espace de noms `window.MoteurRPG`.

### 12.2 Découpage proposé
| Fichier (`moteur-rpg/`) | Rôle | Testable sous Node |
|---|---|---|
| `regles.js` | Formules des stats, niveaux, dégâts, éléments, états, fuite (§ 9) | Oui |
| `combat.js` | Déroulé d'un combat : ordre, actions, IA des monstres, récompenses ; **équipe de 1 à 4 héros** contre 1 à 4 monstres, choix des actions puis résolution dans l'ordre de la Vitesse | Oui |
| `monde.js` | Cartes en tuiles, écrans, collisions, sorties, déclencheurs, monstres qui errent | Oui (la logique) |
| `evenements.js` | Petit langage de scripts : `dire`, `choix`, `si drapeau`, `donner`, `prendre`, `combat`, `teleporter`, `drapeau`… | Oui |
| `etat.js` | État de la partie (équipe, inventaire, drapeaux, outils, sauvegardes automatiques et à la main) et sauvegarde/chargement JSON (avec un numéro de version) | Oui |
| `rendu.js` | Dessin sur canvas : tuiles, sprites, fenêtres, transitions | Non |
| `interface.js` | Fenêtres, curseur ▶, texte lettre par lettre, menus | Non |
| `entrees.js` | Croix, boutons, clavier pour les tests | Non |
| `sons.js` | Bips, effets et musique chiptune (WebAudio, comme les autres jeux) | Non |

| Fichier (`lanterne/`) | Contenu |
|---|---|
| `index.html`, `jeu.js` | Branche le moteur aux données, écran titre, choix du nom du héros |
| `donnees/classes.js`, `heros.js`, `monstres.js`, `objets.js`, `talents.js` | Tableaux de données (§ 7, 9, 10) |
| `donnees/cartes.js` | Cartes en **grilles de caractères** (une lettre par tuile), lisibles et faciles à comparer dans git |
| `donnees/dialogues.js`, `evenements.js` | Textes et scripts du scénario |
| `sprites.js` | Pixel art (comme `icones.js`) |

### 12.2 bis Ce qui existe après la session 1 (22/10)
| Fichier (`moteur-rpg/`) | Rôle |
|---|---|
| `regles.js` | Stats d'une classe à un niveau, expérience par niveau (la session 2 y ajoute dégâts, éléments, états, fuite). Node. |
| `etat.js` | État de la partie (JSON, `VERSION` + `migrer`), objets plafonnés à 8, drapeaux, équipe ; `Sauvegardes(stockage, prefixe)` : 3 emplacements × copies `auto`, `main`, `reprise` (`pourDefaite` : la plus récente des deux vraies ; `pourReprendre` : la plus récente des trois). Node. |
| `monde.js` | Cartes en grilles de lettres + légende, maisons, objets, habitants (`erre`, `si`, `cache`), sorties (`si` + `refus`), déclencheurs, file de l'équipe, pas des monstres, initiative. Node. |
| `evenements.js` | Langage des événements (`dire`, `choix`, `si`, `drapeau`, `donner`, `ecus`, `rejoindre`, `teleporter`, `combat`, `pnj`, `sauver`, `son`, `musique`, `attendre`, `chapitre`, `evenement`, `stop`), conditions composées, `{HEROS}`. Node. |
| `poupees.js` | Découpe des tuiles, personnages en poupée (corps + arme qui tourne autour de sa prise) et leurs 6 animations, portrait des dialogues. |
| `rendu.js` | HD-2D (Three.js r128) : sol en une image, panneaux debout qui font de l'ombre, blocs, maisons à toit, eau, brume, lanternes qui vacillent, flou de profondeur + lueur (shader maison), caméra qui suit, **maisons et arbres transparents quand ils cachent l'équipe**. |
| `interface.js`, `menu.js` | Dialogue lettre par lettre avec portrait, choix ▶, message « Sauvegarde… », fondu ; menu ÉQUIPE / OBJETS / JOURNAL / OPTIONS + retour à la Ludothèque. |
| `entrees.js`, `sons.js` | Croix, A, B, MENU et clavier ; sons et musiques WebAudio (coupés en arrière-plan). |
| `combat.js` (session 2) | Le combat au tour par tour, sans DOM (Node) : `creer`, `intro`, `resoudre(c, choix)` → liste d'événements à montrer, `terminer` (PV, PM, expérience, écus, butin écrits dans la partie), `choixAuto` et `simuler` (équilibrage). Défense, Protection et Rempart passent en premier ; esquive, critique, éléments, poison, sommeil, silence, buffs ; boss : grand coup annoncé un tour avant (`prepare`), pas de fuite. |
| `combat-ui.js` (session 2) | L'écran de combat : messages, cartes de l'équipe, menus ATTAQUE / TALENTS / OBJETS / DÉFENSE / FUITE au curseur ▶ (croix, A, B), cible marquée ▼, pas en avant, projectiles, impacts, lumière colorée, chiffres, sons, récapitulatif de victoire avec les passages de niveau (avant → après, nouveaux talents). |
| `partie.js` | La partie sur la carte : déplacement case par case, file, habitants et monstres qui errent, A pour parler ou utiliser (coffre, panneau, lanterne), sorties, déclencheurs, sauvegardes, menu. Le combat est un crochet (`o.combat`) branché par le jeu sur `combat-ui.js` ; un monstre de 6 niveaux de moins que le chef fuit au contact. |

Jeu (`lanterne/`) : `index.html`, `style.css`, `jeu.js` (titre, 3 emplacements, nom, boucle), `tuiles.png` + `donnees/tuiles.js` (fabriqués par `outils/lanterne-tuiles.py` d'après `outils/lanterne-tuiles.json`), `donnees/base.js` (classes, héros, légende, style), `donnees/combat.js` (objets et équipement, 27 talents, monstres, rencontres), `donnees/cartes.js` (maison d'Ysolde, Clairfond, auberge, route de l'abbaye), `donnees/evenements.js` (début du prologue), `sons/`.

**Session 2 (22/10), précisions :** équipement porté visible dans le menu ÉQUIPE (toucher un emplacement, flèches ▲ vertes et ▼ rouges) ; les objets de soin s'utilisent aussi hors combat (menu OBJETS) ; partie en version 2 (`etat.js` : `migrer` ajoute l'équipement de départ). Monstres de la région de la forêt : feu follet, corbeau de brume, crapaud-cloche (endort au gong), gelée de cire, loup gris ; le **Grand Cerf** est déjà dans les données pour l'équilibrage, avec l'image provisoire de l'« âne » Biscotte (pas de cerf dans Dungeon Crawl : à dessiner ou choisir à la session 3). Équilibrage chiffré par `outils/lanterne-combats.js` (6 cas, du héros seul niveau 1 au boss de l'acte 1).

**Session 3 (22/10), précisions :** le boss de l'acte 1 est **le Roi des aulnes** (tuile `alderking` de Dungeon Crawl ; le cerf n'existe pas dans le pack). Prologue : abbaye (Grande Lanterne, prieur Vaast, Eloi rejoint l'équipe). Acte 1 : Clairfond s'ouvre à l'est vers le **Bois Murmurant** (après la mission des flammes) ; Vérène attaquée par un loup et un corbeau (combat forcé, gagnable au niveau 1) puis rejoint l'équipe ; lanterne oubliée ; **Crypte des racines** en 4 salles : levier qui ouvre une grille, coffre de la **Lanterne du veilleur** (premier outil, bouton **B** : dissipe les nappes de brume), clé de la crypte et porte fermée, cœur avec la fresque et le Roi des aulnes (racines annoncées un tour avant) ; en tombant : « Encore… tu nous enfermes encore. » ; fin de l'acte 1 (Flamme rouge, retour à l'abbaye). Nouveautés du moteur : objets ouvrables (`grille` + `ouvertSi`, `porte_cle` + `cle`, `nappe` + `outil`, `levier` + `drapeau`), outils (`LANTERNE.outils`, drapeaux `outil:<id>`), monstres trop faibles qui fuient (6 niveaux d'écart), habitants cachés et montrés par les événements. `LANTERNE.fin` : drapeaux que le solveur doit atteindre.

### 12.3 Vérifications automatiques (dans `outils/`)
- Dans `verifications.js` : **cohérence des données**. Chaque objet, monstre ou carte cités existent ; chaque sortie d'écran mène quelque part ; chaque drapeau lu est écrit quelque part.
- **Solveur d'accessibilité** : à partir du début, en suivant les outils et les clés obtenus, on doit atteindre la fin et chaque coffre. Cela garantit qu'aucun objet n'est perdu et qu'on ne se retrouve jamais bloqué.
- **Combats simulés** sous Node : l'équipe prévue à ce moment de l'histoire, au niveau prévu, bat chaque boss en moyenne en 5 à 10 tours. C'est l'équilibrage chiffré.
- Dans `fumee.js` : le jeu se charge, on nomme le héros, on fait un combat.

## 13. Direction artistique
**Décision (21-22/10) — DA retenue** : tuiles **Dungeon Crawl Stone Soup 32 × 32** (CC0 ; prendre le zip d'OpenGameArt pour la vraie version) affichées en **HD-2D** avec Three.js r128 (sol et maisons en relief, arbres et personnages en panneaux qui projettent leur ombre, flou de profondeur et lueur par un petit shader maison, poussières dans la lumière, éclairs colorés des sorts). Référence : `maquettes/la-derniere-lanterne-hd2d.html` (https://claude.ai/artifact/HtaCGnYudqSPyiqTZEeJNn), fabriquée à partir des tuiles par `construire.py` (brouillon de la session du 21/10 ; à ranger dans `outils/` au moment du moteur). Avis de l'utilisateur : « incroyable », « tous les graphismes sont cohérents », « la HD-2D donne un petit côté original ».
- **Personnages** : poupées de Dungeon Crawl (corps + tenue + arme superposés dans l'ordre cape, corps, bottes, jambes, armure, gants, arme, bouclier, cheveux, barbe, tête) ; **l'équipement porté se voit sur le héros**. Les compositions actuelles sont gardées (« bien déjà ») : recettes dans `maquettes/la-derniere-lanterne-atelier.html` (boutons Alden, Eloi, Verene, Maud, Isée, Gaspard ; https://claude.ai/artifact/StNMGsAUALcSSQEenvs2H2). Monstres et habitants : les 1 129 tuiles du pack, **retournées** pour faire face aux héros (elles regardent vers la gauche).
- **Animations** faites par le code, une image par personnage : respiration, marche balancée, arme qui tourne autour de sa prise (calculée automatiquement), sort avec aura, flash quand touché, saut de victoire. Attaque calmée le 21/10 (la première version faisait une « pirouette »).
- **Police** : Pixelify Sans (Google Fonts).
- Pistes précédentes (Ninja Adventure 16 × 16, maquettes 1 à 5 dessinées) : abandonnées.

**Maquette (20/10)** : `maquettes/la-derniere-lanterne.html` (https://claude.ai/artifact/DniPR4j2u1FEJXJWY7wuuo), les trois pistes ci-dessous sur la carte, le combat et le dialogue. Retour : C retenue mais à retravailler (combat de profil animé, personnages et décor façon Octopath Traveler sans HD-2D). **Maquette 2 (20/10)** : `maquettes/la-derniere-lanterne-2.html` (https://claude.ai/artifact/TLds9VrVmtsNQTv8RD4TeM), trois lumières sur le même dessin. Retour : lumière 1 mais en plein jour, personnages à revoir. **Maquette 3 (20/10)** : `maquettes/la-derniere-lanterne-3.html` (https://claude.ai/artifact/C82S25sKWRxf6cxCvFsne7), plein jour, personnages redessinés, proportions héroïque (1) ou conte (2). Retour : références de sprites d'Octopath Traveler. **Maquette 4 (20/10)** : `maquettes/la-derniere-lanterne-4.html` (https://claude.ai/artifact/1jUkewXd353fDwNWAk5vbp), héros dessinés pixel par pixel, contour noir ou doux : refusée. **Maquette 5 (20/10)** : `maquettes/la-derniere-lanterne-5.html` (https://claude.ai/artifact/TNkaxKCqaAMe2Tsa7Rs36J), DA repartie de zéro d'après les sprites de référence (18 × 34 px, 3 à 4 nuances, contour sombre teinté). À valider avant décor, monstres et combat.

À choisir **sur maquette** (règle du 16/10) : 2 ou 3 directions sur un écran de téléphone, chacune avec **un écran de carte**, **un combat** et **une fenêtre de dialogue**. Pistes :
- **A — Gothique façon *Vampire Survivors*** (idée du 15/10) : pixel art sombre, contrastes forts, petits sprites expressifs.
- **B — 16 bits façon Link's Awakening DX et Dragon Quest** : couleurs douces, fenêtres bleues à double bord (celles que l'utilisateur a aimées dans les maquettes Dragon Quest du 19/10).
- **C — 32 bits** de la planche des coups de cœur (comme Capitaine du port) : plus de détails, lumière des lanternes sur la brume.

Quel que soit le style, la **brume** et la **lumière des lanternes** doivent être belles : c'est le cœur du jeu (halo qui repousse la brume autour du héros).

## 14. Sons et musique
**Choix de l'utilisateur (22/10)**, sur le banc des sons de la maquette HD-2D : coup d'épée `Sword2` (Ninja Adventure) ; touché `15_Impact_flesh_02`, givre `13_Ice_explosion_01`, flamme `04_Fire_explosion_04_medium`, soin `02_Heal_02`, flèche `35_Miss_Evade_02`, morsure `03_Claw_03`, victoire `16_Atk_buff_04` (Leohpaz « RPG Essentials SFX Free », itch.io : usage libre même commercial, crédit apprécié, **interdit de redistribuer le pack** ; le créditer dans le jeu). Musiques de Ninja Adventure (CC0) : « Calm Village » au village, « Fight » au combat (« la musique est pas mal »). Sons convertis en ogg mono.

Bips de texte, effets de combat, petite fanfare de passage de niveau et de coffre. Musique chiptune courte en boucle : village, carte, donjon, combat, boss, fin. Réglages musique et effets séparés.

## 15. Intégration à la Ludothèque
- Une cartouche sur l'accueil et un volet qui montre l'avancée des parties (chapitre, temps de jeu, complétion en %).
- **Pas de classement** (décision du 20/10).
- Sauvegardes comprises dans le transfert `LUDO1-` ; `sw.js` complété (`FILES`, `VERSION`).
- Artefact : lien à demander à l'utilisateur au premier publish.

## 16. Points à confirmer avec l'utilisateur
Tout est réglé (20/10, § 0). **Cahier des charges validé.** Prochaine étape : la maquette (session 0).

## 17. Plan de travail proposé (une conversation par session)
| Session | Contenu | Modèle |
|---|---|---|
| 0 | **Maquette** : 2 ou 3 directions (carte, combat, dialogue) puis validation | Sonnet, ou Opus pour la décision |
| 1 | ✅ (22/10) Moteur **monde** : écrans, déplacement, équipe en file, collisions, PNJ, dialogues, événements, drapeaux, sauvegardes ; Clairfond jouable | Opus |
| 2 | ✅ (22/10) Moteur **combat** au tour par tour, équipe de 4 : règles, classes, talents, niveaux, équipement ; tests Node et combats simulés | Opus |
| 3 | ✅ (22/10) Contenu **prologue et acte 1** (abbaye et Eloi, Bois Murmurant et Vérène, Crypte des racines, Roi des aulnes) ; solveur d'accessibilité jusqu'à la fin de l'acte 1 | opusplan |
| 4 | **Actes 2 et 3** (marais, moulin, Hameau caché, mines) | opusplan |
| 5 | **Acte 4, final, fin**, scène bonus, à-côtés (pages, quêtes des compagnons, lanternes oubliées), donjon facultatif | opusplan |
| 6 | Équilibrage, sons et musique, accueil, `sw.js`, artefact | Sonnet |

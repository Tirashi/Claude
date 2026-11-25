# Les Bannis (nom provisoire) — cahier des charges

Idée de l'utilisateur du 18/11 : un **autobattler rogue-lite** où, au début, presque tout est laissé au **hasard** (classe des recrues, caractéristiques, équipement, vagues), et où le joueur apprend à **maîtriser le hasard** : pendant la run avec des consommables et des reliques, puis pour de bon avec un **arbre de compétences** entre les runs. RPG (stats, équipement, niveaux), plusieurs classes, **classes légendaires** à débloquer (guerrier → paladin, magicien → sorcier…), **dés** (nombre de faces, multiplicateurs, diviseurs, nombre de lancers). Beaucoup d'effets, d'animations et un bon son : ça doit être **satisfaisant**.

Statut : **chantier**, étape maquette (règle « maquette d'abord »). Dossier prévu : `bannis/`.

## 1. Histoire
- Le joueur est **le Mage instable** : un magicien très puissant, **banni** parce que ses sorts sont imprévisibles (un sort de soin qui fait pousser un arbre, une boule de feu qui tombe trois fois…). C'est la justification du hasard : **c'est lui qui lance les dés**.
- On l'envoie sur **l'Île des Bannis**, au pied de **la Gueule** (un volcan, ou une montagne fendue) d'où sortent des **hordes** chaque nuit. Façon le Mur et la Garde de nuit : les condamnés (voleurs, déserteurs, chevaliers déchus, sorcières) peuvent choisir l'île plutôt que la prison ou la corde, et tenir **la Muraille** pour protéger le continent.
- Le Mage commande une **escouade de bannis** qui change à chaque run (des recrues tirées au sort, débarquées par le bateau-prison). Il ne se bat pas lui-même : il **place**, **lance les dés** et **lance ses sorts instables** (parchemins, potions).
- Pistes à broder :
  - Le **Registre de la Muraille** : chaque recrue tombée y laisse son nom ; on le relit entre les runs (et les légendaires débloquées sont des bannis célèbres).
  - Les **forts de la Muraille** : chaque run part d'un fort différent (ruiné, à reconstruire grâce à l'arbre).
  - Un fil rouge : pourquoi la Gueule s'est réveillée ? Le Mage découvre au fil des runs que **son propre bannissement** est lié au volcan (son pouvoir vient de la même source). Fin : descendre dans la Gueule (boss final), choisir de refermer la faille ou d'en prendre le pouvoir.
  - Personnages récurrents au fort : le **Lord-Commandant** (donne les objectifs), le **forgeron borgne** (équipement), la **sorcière des marais** (dés et reliques), le **passeur** (les recrues).

## 2. Boucle de jeu
**Une run** = une **nuit** sur la Muraille, découpée en **vagues** (10 à 15, boss tous les 5) ; durée visée 15 à 25 min, reprise possible (sauvegarde de la run en cours).
1. **Recrutement** (début de run) : le bateau débarque des recrues tirées au sort ; on en garde quelques-unes (3 au départ, jusqu'à 6 avec l'arbre).
2. **Avant chaque vague** : on voit la vague annoncée (en partie cachée au début), on **place** l'escouade sur la grille (2 rangs × 3 cases : avant / arrière), on équipe, on utilise des consommables.
3. **Combat automatique** : les unités frappent seules selon leur vitesse ; le joueur peut **lancer les dés** quand une jauge est pleine (ou à des moments précis : début de vague, coup critique, sauvetage), et **activer** potions et parchemins.
4. **Après la vague** : butin (or, objets, XP), **montée de niveau** (choix d'un bonus parmi deux ou trois, au hasard), **marchand** ou **événement** de temps en temps.
5. **Fin de run** (escouade tombée ou nuit tenue) : on gagne des **éclats de Gueule** (monnaie permanente) selon la vague atteinte, à investir dans l'**arbre de compétences**.

## 3. Personnages (RPG)
- **Stats** : PV, Attaque, Défense, Vitesse, Critique (chance et dégâts), Magie, Chance (pèse sur les dés). Valeurs de départ tirées au hasard autour d'une base par classe.
- **Équipement** : arme, armure, bijou (3 emplacements). Rareté (commun, rare, épique, légendaire) et **affixes** tirés au hasard (+ATQ, vol de vie, épines, +1 face de dé…).
- **Niveaux** : XP à chaque vague ; à chaque niveau, un bonus au choix parmi des propositions tirées au hasard.
- **Traits** (1 par recrue, au hasard) : « Ivrogne » (+ATQ, −précision), « Déserteur » (fuit sous 20 % de PV), « Pieux », « Cleptomane » (+or)… petits textes drôles qui donnent du caractère.
- **Classes de départ** (à confirmer avec le pack retenu) : Guerrier, Archer, Lancier, Magicien, Prêtre, Voleur, Soldat.
- **Classes légendaires** (évolution d'une classe, débloquée dans l'arbre puis obtenue en jeu par une condition) : Guerrier → **Paladin**, Magicien → **Sorcier** (ou Nécromancien), Archer → **Rôdeur**, Prêtre → **Inquisiteur**, Voleur → **Assassin**, Lancier → **Dragon-lancier**. Condition possible : atteindre le niveau 5 + trouver l'**insigne** de la classe (relique rare).

## 4. Les dés
- Le Mage possède une **réserve de dés** (au départ : 2 d6). Lancer de dés = résolution d'un **sort instable** ou d'un **renfort** : la somme (avec multiplicateurs) donne la puissance.
- Types : **d4, d6, d8, d10, d12, d20**. Faces spéciales à ajouter : **×2**, **÷2**, **crâne** (rate), **étoile** (relance gratuite), **éclair** (effet élémentaire).
- Leviers : nombre de **dés**, nombre de **lancers** (relances), **garder** un dé (façon Yams), **dés pipés** (une face plus probable), faces gravées (remplacer une face), **multiplicateurs** de combinaison (paire, brelan, suite, tout identique = « miracle »).
- Lien avec l'existant : le **Yams** a déjà des dés 3D avec physique (Three.js + cannon.js) ; on peut réutiliser ce lancer pour un « plateau de dés » qui s'ouvre par-dessus le combat (très satisfaisant), ou rester en 2D dans le style du pack (à trancher sur la maquette).

## 5. Inventaire de tout ce qui est aléatoire, et comment le maîtriser
| Aléatoire | Au début | Pendant la run (consommables, reliques) | Pour de bon (arbre) |
|---|---|---|---|
| Classe des recrues | tirée au sort | **Lettre de recommandation** (choisir la classe d'une recrue) | voir 1 recrue de plus ; **classe favorite** (plus probable) ; recrue légendaire possible |
| Nombre de recrues proposées | 3 | **Pot-de-vin au passeur** (+1) | +1 recrue proposée, +1 place dans l'escouade |
| Stats des recrues | base ± 30 % | **Élixir d'entraînement** (relancer les stats d'une recrue) | fourchette resserrée (± 20 %, ± 10 %), plancher plus haut |
| Trait de la recrue | au hasard, parfois mauvais | **Absolution** (retirer un trait) | traits négatifs plus rares ; choix entre 2 traits |
| Équipement de départ | au hasard ou rien | — | équipement de départ garanti, rareté minimale |
| Butin après vague | 1 objet au hasard | **Clé de coffre** (choisir parmi 3) ; **Pierre de forge** (relancer un affixe) | choix parmi 2 puis 3 ; chance de rareté |
| Bonus de niveau | 2 propositions | **Parchemin de relance** | 3 propositions ; relance gratuite par run |
| Dés : nombre et faces | 2 d6 | dés trouvés (d8, d12…), **dé pipé** (relique) | dé de départ en plus ; d4 → d6 → d8… ; 1 relance par lancer |
| Résultat du lancer | pur hasard | **garder** des dés, **Plume du destin** (tourner un dé d'une face) | relances, faces ×2, la Chance pèse sur le lancer |
| Composition des vagues | annonce partielle (« ??? ») | **Longue-vue** (voir la vague suivante en entier) ; **Torche** (révéler le boss) | annonce de plus en plus précise ; voir 2 vagues à l'avance |
| Modificateurs de vague (brouillard, ennemis enragés, pluie de cendres) | au hasard | **Encens** (annuler un modificateur) | modificateurs moins fréquents ; choisir entre 2 chemins (vague « or » ou vague « butin ») |
| Événements entre les vagues | au hasard | — | plus de marchands, sorcière qui vend des dés |
| Critiques et esquives en combat | chances de base | potions de rage, d'adresse | +Chance pour toute l'escouade |
| Sorts du Mage | effet au hasard dans une liste | **Grimoire** (enlever un effet indésirable de la liste) | sorts plus stables (moins de « ratés »), nouveaux sorts |

L'idée de fond : au début le joueur **subit** le hasard, à la fin il le **sculpte** (comme le Mage qui apprend à dompter ses sorts).

## 6. Arbre de compétences (entre les runs)
- Monnaie : **éclats de Gueule** (selon vague atteinte, boss tués, recrues survivantes).
- Branches (à équilibrer) :
  - **Le Passeur** (recrues) : plus de choix, classes favorites, légendaires.
  - **La Forge** (équipement) : rareté, choix du butin, relances d'affixes.
  - **Le Grimoire** (dés et sorts) : dés de départ, faces spéciales, relances, sorts plus stables.
  - **La Vigie** (vagues) : annonces, modificateurs, chemins.
  - **La Muraille** (bonus d'escouade) : PV, place supplémentaire, défense du fort.
- Chaque nœud débloqué se voit tout de suite dans la run suivante (satisfaction immédiate).

## 7. Effets et son (la « satisfaction »)
- Coups : arrêt sur image de 40 à 80 ms (« hit-stop »), secousse proportionnelle, chiffres de dégâts qui sautent (jaunes, rouges pour les critiques, verts pour les soins), éclats.
- Dés : roulement, rebonds, cliquetis, ralenti sur le dernier dé, **combo** qui s'affiche en grand (PAIRE, BRELAN, MIRACLE) avec chœur.
- Montées de niveau : colonne de lumière, jingle. Évolution légendaire : petite cinématique (silhouette blanche, éclair, nouveau sprite).
- Sorts instables : un sort qui « déraille » doit être **drôle** (pluie de poulets, mouton géant, la boule de feu qui revient).
- Son : sons synthétisés dans le code (comme les autres jeux de la Ludothèque) **ou** packs gratuits (voir § 9) ; musique de nuit qui monte en intensité avec les vagues.

## 8. Classement et défi du jour (à trancher)
- Classement : vague atteinte la plus haute.
- Défi du jour (règle de la Ludothèque : une tentative classée par jour) : même graine pour tous (mêmes recrues, mêmes vagues, mêmes dés), sans l'arbre (ou arbre figé).

## 9. Recherche de graphismes (18/11)
Fouille des flux itch.io (`https://itch.io/game-assets/free/tag-….xml`) par mots-clés : dés, auto-battler, side-view, rpg, icônes, gui, sorts, sons. Packs téléchargés et regardés (scratchpad, pas dans le dépôt) :

**Personnages et monstres (vue de côté, faits pour un combat de face-à-face)**
- **Tiny RPG Character Asset Pack 01** et **02** (Zerie) — https://zerie.itch.io/tiny-rpg-character-asset-pack et https://zerie.itch.io/tiny-rpg-character-asset-pack-02 : cases 100 × 100, personnages ~20 px très lisibles, animés (repos, marche, 2 ou 3 attaques, blocage, blessure, mort), projectiles. Pack 01 : Soldat, Chevalier, **Chevalier templier** (= paladin !), Épéiste, Hachier en armure, Lancier, **Magicien**, **Prêtre**, Archer, **Nécromancien** (= sorcier !) + orcs, squelettes, loups-garous, ours-garou, slime, chauve-souris. Pack 02 : **démons** (20, thème enfer = la Gueule). **Gratuit : Soldat + Orc, Démon + Monstre de sang** ; complet **2,50 $ chacun** (prix libre au-dessus). Licence : jeux commerciaux ou non, pas de redistribution du pack. **Le plus cohérent avec l'histoire** (héros contre hordes de l'enfer, classes légendaires déjà là).
- **Pixel Champions** (alexpixels, gratuit) — https://alexpixels.itch.io/pixel-champions : 8 héros façon Final Fantasy VI (format RPG Maker MV, animés : repos, attaque, sort, garde, blessure, victoire, K.O.), 3 couleurs chacun. Beau, mais ce sont des **personnages nommés** (Mercenaire, Sorcière du temps…), pas des classes génériques.
- **Free Mythic Monsters** (Willibab, gratuit) — https://willibab.itch.io/free-mythic-monsters : 31 monstres 8 bits détaillés, vue de côté, 3 couleurs, **fixes** (on les anime par le code : sautillement, élan, éclair blanc). 100 de plus dans *Mythic Monsters I* (7,49 $).
- **Free SV Battlers** (Willibab, CC-BY) — https://willibab.itch.io/free-sv-battlers : générateur en calques (corps, cheveux, casques, armures, capes) pour assembler des héros dont **l'équipement se voit** ; inachevé, pas d'armes, petit. Piste « équipement visible » ; la version complète *8 Bit Sideview Battle Character Creator* coûte 3,74 $.
- **Tiny Swords** (Pixel Frog, **déjà acheté** pour Bastion) : guerrier, archer, lancier, moine + gobelins, gnolls, trolls (Enemy Pack), grandes animations ; cohérent avec Bastion, mais style refusé une fois (Escarmouche, 23/10).
- Écartés : *Tiny Battle Armies* (riekahq, 4 $) et *50 Free Chibi Characters Kit* (24thforce) : **faits avec l'aide d'une IA** ; *Chibi Fantasy Heroes* (robe-of-fire) : généré depuis une image ; *Fantasy Battle Pack* (déjà acheté, Résistance) : unités de carte trop petites pour des combats de face.

**Dés**
- **Fantasy Dices Pack** (aeynit, gratuit, usage libre) — https://aeynit.itch.io/fantasy-dices-pack : d4, d6, d8, d10, d12, d20 en 12 couleurs, **peints** (pas en pixels), grands (≈ 400 px).
- **Hi Res Dice Pack** (ci, gratuit) — https://ci.itch.io/hi-res-dice-pack : 546 images, D2 à D20, 7 couleurs, 1080 px (style plat).
- Pixel : *Pixel Dice* (snoblin, d6 avec états survol / glissé), *Dice Asset Pack* (clovertea, d6 qui roulent, dés à ailes de chauve-souris), *Squares Dungeons and Dice* (crossoftware, héros et monstres **sur des dés**, 32 × 32, idée amusante).
- Ou **dés 3D du Yams** (rien à télécharger, déjà dans le dépôt) : n'importe quel nombre de faces se dessine dans le code.

**Icônes d'armes, d'armures, de consommables**
- **Shikashi's Fantasy Icons Pack** (gratuit, 284 icônes 32 × 32, crédit « Matt Firth (shikashipx) » et « game-icons.net ») — https://shikashipx.itch.io/shikashis-fantasy-icons-pack : armes, armures, potions, parchemins, statuts, buffs ; version 607 icônes payante.
- Willibab : *Simple Weapon Icons* (261 armes) et *Simple 32x32 Armor Icons* (casques, plastrons, boucliers, centaines de couleurs), gratuits, usage commercial.
- Autres : Admurin's Armory (90 gratuits, 1725 payants), Clockwork Raven (potions, armures, sorts, 16/32/64 px), Kyrise 16 × 16.

**Interface**
- Tiny RPG – Mana Soul GUI (tiopalada, déjà utilisé par Résistance), Kenney Fantasy UI Borders (CC0), Crimson Fantasy GUI, Complete UI Book Styles ; *Auto-Battler UI: Free Pixel Sample* (infi76 : cartes de boutique, jetons, barres de PV, bouton relancer).
- Fonds de combat : *Willibab's Free Pixel Battle Backgrounds* (5 lieux, 4 couleurs) — un peu bruités en petit ; sinon fond peint dans le code (volcan, muraille).

**Effets et sons**
- Effets : Frostwindz *Pixel Art VFX* (versions gratuites Prêtre, Démoniste, Mage de feu, Mage de sang, Astromancien : un pack d'effets **par classe**), Willibab *Simple Pixel Spell Effects*, Pimen, pinogames (magie noire, glace).
- Sons : Leohpaz *RPG Essentials SFX* (48 gratuits : UI, sorts, soins, buffs, coups), *Minifantasy Dungeon Audio*, Halfwits *SFX Pack – Rolling Dice* (gratuit : **1 à 10 dés de d4 à d20 qui roulent**), *FREE Pixel Combat SFX* (heltonyan, 2100 sons). Musique : *Battle Background Music* (mululavgmloops, 6 boucles).

## 10. Maquette 1 (18/11)
[Artefact](https://claude.ai/artifact/NxUw5hLPN5uD9e3ZatdGn3), source `maquettes/bannis.html` (fabriquée par `python3 -I outils/bannis-maquette/fabriquer.py <dossier des packs>` depuis `outils/bannis-maquette/source.html`) : un écran de téléphone, une vague jouable (placement, lancer de dés, combat automatique, effets, sons synthétisés), en **trois directions** :
- **A « Petits soldats »** : Tiny RPG de Zerie (échantillons gratuits : Soldat contre Orcs et Démons), dés peints d'aeynit, icônes Shikashi, fond de volcan dessiné dans le code.
- **B « Rétro 16 bits »** : héros de Pixel Champions, monstres de Willibab, dés en pixels dessinés dans le code, icônes Shikashi.
- **C « Tiny Swords »** : guerrier, archer, lancier, moine contre gobelins et gnolls (pack déjà acheté), dés dessinés dans le code.

Retour de l'utilisateur (18/11) : « à la limite le B est pas mal, mais c'est pas encore ce que je voudrais » ; l'interface faisait générique (elle était dessinée dans le code, pas prise d'un pack) ; montrer aussi les sprites des classes améliorées ; **plus de Tiny Swords** (« ça rend pas terribles ici ») ; **seulement des packs gratuits**, les payants mis de côté avec leurs liens.

## 11. Maquette 2 (18/11)
[Artefact](https://claude.ai/artifact/Cuu4nXfm51S3kfWEQhuYUm), source `maquettes/bannis-2.html` (fabriquée par `python3 -I outils/bannis-maquette/fabriquer2.py <dossier des packs>` depuis `source2.html`, moteur de la maquette 1). Packs gratuits seulement, interfaces prises dans des packs (découpe en 9 morceaux), évolution d'un héros en classe légendaire à la fin de la vague (lumière, flash blanc, aura dorée), registre des classes sous les téléphones.
- **1 Regalia** : Pixel Champions + monstres de Willibab + interface **Dragon Regalia** (tiopalada, CC0), dés en pixels.
- **2 Âges sombres** : mêmes sprites + interface **Dark Ages** (Hypnobius, gratuite), volcan, dés en os, butin sur parchemin.
- **3 La Garde en 8 bits** : héros et monstres du **Mighty Battle Pack Addon** (The Mighty Palm, CC0, façon NES) + Dark Ages. Les classes du pack vont par vraies paires : soldat → paladin, apprentie → archimage, prêtresse → inquisiteur, voleur → ninja.
- Paires Pixel Champions (pas de paires dans le pack) : guerrier (Oratio) → paladin (Glenys), magicien (Hex) → sorcier (Prime), prêtre (Linail) → grande prêtresse (Wyvera), dompteur (Ley) → maître des bêtes (Ley, autre palette), barde (Ouzo) → barde légendaire (autre palette).
- Autres gratuits repérés : Mighty Pack (CC0, icônes et fenêtres RPG Maker), Tiny RPG Mana Soul GUI (tiopalada), Crimson Fantasy GUI, Fantasy 1.0 RPG GUI (byandrox), Complete UI Book Styles (crusenho) ; fonds de combat de Willibab trop ternes.

**Packs payants mis de côté** (liens aussi dans la maquette 2) : Time Fantasy (finalbossblues : héros vus de côté 7,99 $, monstres 10 $, icônes 6 $, effets 6 $, portraits 8 $ ; le plus soigné, 80 héros dont chevaliers et armées) ; Pixel Champions II (alexpixels : 25 héros 8,99 $, 22 monstres 12,50 $, portraits 1,99 $) ; Tiny RPG de Zerie (2 × 2,50 $) ; Willibab (Mythic Monsters I 7,49 $, créateur de héros en calques 3,74 $) ; The Mighty Palm (Mighty Daemons héros 5 $ et monstres 5 $, portraits 15 $) ; Tiny Tales Heroes (megatiles, 24,99 $) ; 8bit Retro SV Actors (koji-marumugi, 6,60 $).

Retour de l'utilisateur (19/11) : la **direction 1 (Regalia) plaît**, à condition que les monstres soient assez variés ; les monstres de Willibab étaient **dans le mauvais sens** (ils regardent à droite dans le pack : corrigé, on les retourne). Bestiaire ajouté à la maquette 2 (même lien) : **Free Mythic Monsters** (31 espèces × 3 couleurs = 93 sprites, une couleur pour les élites), **Willibab's Monster Pack** (gratuit, 12 lignées qui évoluent en 2 ou 3 stades : vers, golems, serpents de mer, nagas, dragons ; elles regardent déjà à gauche), **Nostalgic Enemy Sprites** (3 monstres) : environ 45 espèces et 140 sprites gratuits. Écartés : monstres de solaarnoble (trop petits, autre style). Pour plus tard : Mythic Monsters I (100 espèces, 7,49 $).

Retour de l'utilisateur (19/11) : **direction 1 (Regalia) retenue** avec ces monstres, mais les personnages ne doivent pas rester sur place : **plutôt un action-RPG qu'un RPG au tour par tour**.

## 12. Maquette 3 : le combat en mouvement (19/11)
[Artefact](https://claude.ai/artifact/PGcXeLKe7nJc13NA3tUBre), source `maquettes/bannis-3.html` (fabriquée par `python3 -I outils/bannis-maquette/fabriquer3.py <dossier des packs>` depuis `source3.html`, dérivé de la maquette 2). Direction Regalia, deux façons de jouer :
- **A Mêlée libre** (vue de côté) : les hordes sortent de la droite en 3 groupes (4, 5 puis 6 monstres dont le boss, le dragon rouge, plus gros) ; tout le monde se déplace librement.
- **B Assaut de la Muraille** (couloir vertical) : les monstres descendent vers la Muraille en bas (barre de vie) ; sans héros à moins de 160 px, ils marchent vers le mur et le frappent ; Muraille à 0 = vague perdue.
- Règles du mouvement : chacun choisit la cible la plus proche (garde la sienne de préférence) ; corps à corps à 30 px, arc à 150, magie à 135 ; les tireurs **reculent** quand un monstre est à moins de 55 % de leur portée ; la prêtresse **suit** le plus blessé et soigne à 110 px ; **écartement** entre unités (36 px, 52 avec le boss) ; **recul** sous les coups (plus fort sur un critique, réduit pour le boss) ; animation de marche (Pixel Champions : ligne « marche » du format MV ; monstres fixes : petits sauts) ; orientation selon la cible.
- Le placement décide seulement d'où partent les héros ; monstres plus nombreux et moins solides (16 à 40 PV, boss 150), héros plus solides (80 à 120 PV).

Retour de l'utilisateur (19/11) : **A (mêlée libre) avec la Muraille à gauche** ; plus tard, pouvoir **poster des archers sur la Muraille** ; **attention au sexe** : la classe légendaire doit garder le sexe de la classe de base.

## 13. Maquette 4 (19/11)
[Artefact](https://claude.ai/artifact/DWwMzhimnM4iFTYmwsT2oM), source `maquettes/bannis-4.html` (`python3 -I outils/bannis-maquette/fabriquer4.py <dossier des packs>` depuis `source4.html`, dérivé de la maquette 3).
- **Muraille à gauche** (x 0 à 50, créneaux, chemin de ronde prévu pour de futurs archers) ; barre de vie au-dessus du rempart ; les monstres sans héros à moins de 160 px marchent vers la Muraille et la frappent ; Muraille à 0 = vague perdue. Héros placés devant (x 92 et 162).
- **Sexe des héros** (Pixel Champions gratuit, d'après les sprites ; pas de noms dans le pack) : femmes Hex, Linail, Wyvera, Glenys ; hommes Oratio, Prime, Ley ; Ouzo est un loup. Lignées : guerrière → épéiste démoniaque (Glenys, autre palette), **illusionniste → grand sage** (Ley → Prime, vraie paire), **prêtresse → grande prêtresse** (Linail → Wyvera, vraie paire), mercenaire → champion (Oratio, autre palette), magicienne → sorcière du temps (Hex, autre palette), barde → barde légendaire (Ouzo, autre palette). Noms accordés au sexe. Le registre indique le sexe et le genre d'évolution.
- Limite : 8 héros gratuits seulement ; pour chaque classe en homme et en femme avec une vraie évolution, il faudra un pack plus fourni (Pixel Champions II ou Time Fantasy, payants).

Retour de l'utilisateur (19/11) : **le nom « Les Bannis » est gardé** ; **le concept de la maquette 4 est validé**, mais il y a beaucoup d'ajustements à faire : interface, sons, dés, stats des personnages, etc.

## 14. Ajustements à faire avant et pendant le jeu (propositions du 19/11, à trier avec l'utilisateur)
**Interface** (Dragon Regalia) : textes trop petits et peu lisibles en Press Start 2P réduite (passer à une police pixel plus haute, ou agrandir) ; cartes des héros surchargées (garder nom, classe, PV, et le détail en touchant la carte) ; écran plus aéré (moins de cadres empilés) ; vrai écran de recrutement, fiche d'un héros (stats, équipement, trait), écran de butin avec choix, écran de fin de run, arbre de compétences ; portraits ? (pas dans le pack gratuit).
**Sons** : remplacer une partie des sons synthétisés par de vrais sons gratuits (Leohpaz RPG Essentials, Halfwits *Rolling Dice* pour les dés, Pixel Combat SFX) ; musique de nuit qui monte avec les vagues ; volume et coupure dans les options.
**Dés** : plateau plus lisible (dés plus gros, faces spéciales visibles avant le lancer) ; geste pour lancer (glisser, comme le Yams) ; règles des combos à écrire et équilibrer ; décider quand on lance (jauge, début de vague, à la demande) ; montrer à l'avance ce que fait chaque sort ; réserve de dés qui grandit pendant la run.
**Stats et équilibrage** : fiches de classes (PV, attaque, défense, vitesse, portée, critique) ; traits avec un vrai effet ; montée de niveau au choix ; équipement visible dans la fiche ; courbe des vagues (12 par nuit, boss tous les 4) ; simulateur sans écran pour régler (comme pour Terres franches ou Politique).
**Combat** : vitesse réglable (×1, ×2) ; nombre de monstres à l'écran ; ciblage plus lisible (petite flèche ou trait) ; archers sur la Muraille (plus tard).

## 15. Découpage proposé (Opus)
1. **Session 1, le socle** : dossier `bannis/` (scripts classiques), boucle d'une nuit (recrutement, placement, vagues, butin, fin de run), combat de la maquette 4 nettoyé, sauvegarde de la run, fiche sur l'accueil (démo).
2. **Session 2, les dés et les sorts** : plateau de dés, faces spéciales, combos, relances, sorts du Mage.
3. **Session 3, le RPG** : stats, niveaux, traits, équipement, classes légendaires, simulateur d'équilibrage.
4. **Session 4, la méta** : éclats de Gueule, arbre de compétences, déblocages.
5. **Session 5, la finition** : sons, musique, effets, interface peaufinée ; classement et défi du jour.

Retour de l'utilisateur (19/11) : les problèmes relevés au § 14 sont bien les siens ; **lancer la session 1**.

## 16. Session 1 : le socle (19/11)
Dossier `bannis/` (démo sur l'accueil, carte « BANNIS ») ; détails des fichiers dans [`bannis/CLAUDE.md`](../bannis/CLAUDE.md).
- **Une nuit** : titre (continuer, nouvelle nuit, son), **recrutement** (5 condamnés tirés au sort, on en garde 3 ; classe, stats, trait expliqué), **placement** (6 cases devant la Muraille, placement par défaut : corps à corps devant), **combat** en mouvement (règles de la maquette 4 dans `regles.js`), **butin** : bilan, bonus de niveau au choix (1 parmi 2), **évolution** légendaire au niveau 5 (animation de la maquette 2), objet à choisir (2, ou 3 après un boss ; ou 12 pièces d'or), héros qui le porte (l'ancien objet est revendu), **marchand** (potion, parchemin d'éclair, longue-vue, réparer la Muraille) ; **fin de nuit** (vague atteinte, monstres, boss, éclats de Gueule gagnés et en réserve, record).
- **12 vagues**, 3 paliers de monstres (26 espèces de Willibab, élites dans la seconde couleur : vie ×1,8, attaque ×1,3, or ×3), boss aux vagues 4 (hydre), 8 (reine naga), 12 (seigneur des flammes et dragon rouge) ; monstres à distance (prêtre maudit, grimoire de feu, œil ailé). Les héros tombés reviennent à 30 % de vie à la vague suivante ; la Muraille ne se répare qu'au marchand.
- **Classes** : les 6 lignées de la maquette 4, avec un vrai rôle (corps à corps, magie, soin, chant du barde qui accélère l'escouade) et un **pouvoir légendaire** (épéiste : recul et vol de vie ; champion : critiques qui fendent ; grand sage : magie en zone ; sorcière du temps : ralentit ; grande prêtresse : soigne toute l'escouade ; barde légendaire : son chant soigne).
- **Traits** avec un effet réel (ivrogne, pieux, déserteur qui fuit sous 20 % de vie, cleptomane, tête brûlée, balafré, vantard, parjure).
- **Équipement** : arme, armure, bijou ; 4 raretés, 1 à 3 bonus (attaque, défense, vie, critiques, vitesse, vol de vie) ; fiche d'un héros en touchant sa carte (stats, trait, équipement, légendaire à venir).
- **Dés** : ceux de la maquette (d6, d8, d20, face ×2, combos, une relance par vague, dés gardés) ; le sort est annoncé avec ce qu'il fait. Session 2 pour aller plus loin.
- **Interface** : Dragon Regalia, textes en Pixelify Sans (plus lisibles), titres en Press Start 2P ; cartes allégées (nom, classe, niveau, vie, expérience) ; vitesse ×1 / ×2 ; pause (son, abandonner, retour à la Ludothèque).
- **Sauvegarde** : `bannis.run` au début de chaque vague ; `bannis.stats` (records, éclats) avec transfert `LUDO1-`.
- **Simulateur** `outils/bannis-simulateur.js` : sans dés, vague moyenne 7 (la Muraille cause la plupart des défaites) ; avec un sort toutes les 12 s, vague 8 à 9. Équilibrage fin à la session 3.
- Pas encore : classement, défi du jour, arbre de compétences (les éclats s'accumulent déjà), vrais sons, archers sur la Muraille.

Artefact du jeu : https://claude.ai/artifact/XnEsz7CYgnAcRDCfhchcHh (`python3 outils/bannis-artefact.py <sortie>`).

Retours de l'utilisateur (19/11, essai de l'artefact) et corrections :
- **La barre du Mage sortait de son cadre** (et les autres) : le cadre `ui-barre.png` a des bouts en losange de 12 px, découpé maintenant en trois morceaux (bouts hors de la barre, milieu étiré) ; petites barres sans cadre au-dessus des unités (`jauge()`).
- **À quoi servent les classes, les traits ?** Le recrutement et la fiche affichent le rôle (CORPS A CORPS, MAGIE A DISTANCE, SOINS, SOUTIEN) et une description claire ; le trait s'appelle « trait de caractère », expliqué (un défaut ou une qualité du condamné qui change sa façon de se battre).
- **Escouade tirée au sort** : 3 condamnés imposés au départ ; **le choix des recrues viendra de l'arbre** de compétences (plus tard).
- **Stats automatiques au niveau** : plus de choix ; gains selon le rôle (`D.CROISSANCE` : corps à corps +12 % de vie, +2 ATQ, +1 DEF ; magie +8 % de vie, +3 ATQ, +1 CRIT ; soins +10 % de vie, +2 ATQ, +1 DEF ; soutien +10 % de vie, +1 ATQ, +1 DEF, +3 % de vitesse), affichés au bilan. Le choix d'un bonus au niveau pourra revenir par l'arbre.
- **Équiper** : les armes sont réservées (épée, hache, dague, masse pour le corps à corps ; bâton, sceptre, grimoire pour les mages, soins et soutien) ; l'écran « qui le porte » montre chaque héros, ce qu'il porte déjà, ses stats et le changement (+ en vert, − en rouge) ; ceux qui ne peuvent pas le porter sont grisés.

Retours du 19/11 (deuxième essai) : **sprites mal découpés** (un morceau du monstre voisin à côté du spectre) : 10 des 31 monstres de Willibab dépassent 64 px (jusqu'à 81 × 89) ; planche refaite en cases de 96 px, monstre posé au bas de sa case. **Police peu lisible sur les chiffres** : Jersey 10 remplace Pixelify Sans pour tous les textes (agrandie de 30 %, une seule graisse) ; titres toujours en Press Start 2P.

Retours du 19/11 (troisième essai) : **texte du butin qui sortait du cadre** (Jersey 10 plus haute) : cartes du butin (104 px) et du marchand (76 px) agrandies. **Personnages plus animés en marchant** : petits bonds, buste penché vers l'avant, poussière aux pieds (héros et monstres). **Montrer l'arme équipée** : essai en jeu, l'icône de l'arme (planche de Shikashi) est tenue dans la main avant (`dessinerArme`, pivot sur la poignée) : au corps à corps elle est levée derrière puis abattue devant pendant le coup ; les bâtons se lèvent pendant le sort ; visible aussi au placement. À garder ou à retirer selon l'avis de l'utilisateur.

Retours du 19/11 (quatrième essai) :
- **Armes à l'envers** : dans la planche de Shikashi, la dague a la poignée en haut à droite (les autres en bas à gauche) : retournée ; le grimoire est tenu droit.
- **Des héros partaient vers la Muraille sans finir le combat** : sans cible (entre deux groupes), ils revenaient à leur case de départ, près du mur : ils restent maintenant où ils sont ; le **déserteur** ne fuit plus jusqu'à être soigné mais **2,5 s**, avec « FUIT ! » au-dessus de lui, puis revient (une fois, jusqu'à repasser au-dessus de 50 % de vie).
- **Classes légendaires débloquées dans l'arbre** de compétences en fin de run : plus d'évolution automatique ; un héros évolue au niveau 5 seulement si sa classe est débloquée (`bannis.arbre.legendaires`, rempli par l'arbre à la session 4) ; la fiche l'indique.
- **Première run un peu longue, il faut lutter dès le début** : un monstre de plus par vague (5 + vague, 16 au plus), monstres du premier palier plus solides (vie +25 % environ, attaque +1), vie +15 % et attaque +10 % de départ, puis +15 % / +9 % par vague. Simulateur : vague moyenne 5,5 sans dés, 6,2 avec (avant : 6,5 et 7,8) ; la Muraille perd déjà 8, 16 puis 26 aux vagues 1 à 3 ; quelques nuits perdues dès la vague 2 ou 3.

Retour de l'utilisateur (19/11) : « c'est pas mal là » : **session 1 validée** après les retours d'essai (contour des textes, vignettes, armes, début plus dur). Prochaine étape : session 2 (dés et sorts).

## 17. Session 2 : les dés et les sorts du Mage (19/11)
- **Réserve de dés** (`run.des`, au plus 5) : au départ 2 d6 ; dés trouvés au butin (30 % des vagues, 60 % après un boss : d4 du Geôlier avec une face x2, d8 du Passeur, d10 d'os, d12 de braise avec une étoile, d20 du Bourreau, dé maudit à 2 crânes et 2 x2, dé pipé à 2 étoiles, dé de la Lune /2 et x2) et au marchand (d8 du Passeur, 22 or) ; **graver une face** (18 or) : la plus petite face d'un dé devient x2.
- **Faces spéciales** : x2 (double la puissance), /2 (la divise), crâne (vaut 0 ; deux crânes et le sort déraille), étoile (le dé est relancé tout seul).
- **Puissance** : somme des faces chiffrées ; combinaisons sur les faces chiffrées : PAIRE x1,5, SUITE (3 valeurs qui se suivent) x2, BRELAN x2, MIRACLE (toutes pareilles, 3 dés au moins) x3 ; 20 naturel au d20 x2 ; puis les x2 et /2 ; le détail s'affiche (« BASE 28 · x2 »).
- **Le sort s'annonce quand la jauge est pleine** (« SORT PRET ») : on choisit le moment du lancer (bouton LANCER LES DES ; PLUS TARD referme le plateau). Plateau : le sort, ce qu'il fait et ce qu'il fait s'il déraille, la réserve avec les faces spéciales de chaque dé ; **lancer d'un geste vers le haut** (la vitesse du geste change la hauteur des rebonds) ou avec le bouton ; une relance par vague, dés gardés en les touchant.
- **Déraillement** (deux crânes, ou un 1 au d20) : prévenu avant de lancer le sort ; une fois sur quatre une pluie de poulets (sans danger), sinon l'effet de travers du sort.
- **Grimoire** : 3 sorts au départ (boule de feu, pluie de soins, foudre en chaîne) ; **pages de grimoire** au butin des boss : bouclier de givre (moitié des dégâts ; déraillé : héros gelés 2 s), vent glacé (monstres ralentis ; déraillé : accélérés), rempart (répare la Muraille ; déraillé : pierres sur tout le monde), pluie de météores (3 monstres écrasés ; déraillé : n'importe qui). Le sort lancé est tiré parmi ceux qu'on connaît.
- **Écran du grimoire** (bouton dé en haut) : onglets DÉS (chaque dé et ses faces, les faces spéciales expliquées) et SORTS (effet et déraillement).
- Simulateur : vague moyenne inchangée (environ 6 avec les dés).

Retour de l'utilisateur : en attente.

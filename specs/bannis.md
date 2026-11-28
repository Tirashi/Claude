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

## 18. Comparaison avec Slotbound et pistes de simplification (26/11)

L'utilisateur a découvert **Slotbound** (Optima Arch, Steam, sorti vers le 12-13/11/2026, environ 10 $, démo gratuite) : « ils ont fait à peu près ce que je voulais faire ». Démo non jouable depuis l'environnement de Claude (jeu Windows/macOS) ; comparaison faite sur des extraits de recherche web (Steam, TodayWeGame, wikis), pas sur le jeu.

**Slotbound** : roguelite autobattler. Une machine à sous 3×3 invoque les unités (trois symboles alignés sur l'une des huit lignes) ; on les fusionne en les absorbant ; objets et « cores » faussent les probabilités ; vagues de jugement et de boss ; ennemis qui avancent, un cœur perdu par ennemi qui passe, le boss met fin à la partie ; monnaie de méta-progression. Démo « Très positif » (342 avis), jeu complet autour de 77-79 % ; reproche : pics de difficulté aux vagues de jugement. Le code a été écrit par une IA (polémique de presse).

| | Slotbound | Les Bannis |
|---|---|---|
| Hasard | la machine crée l'armée | héros tirés au sort ; dés et sorts du Mage |
| Geste du joueur | tirer le levier, fusionner | placer, garder / relancer les dés, sorts, équiper |
| Combat | plateau, ennemis qui avancent | mouvement libre façon action-RPG, Muraille |
| Cadre | défense abstraite | histoire du Mage banni, classes, légendaires |

**À prendre chez eux** : un hasard lisible en un seul geste ; le tirage qui *crée* l'équipe plutôt qu'une liste ; la fusion par absorption comme moteur de progression simple ; surveiller les pics de difficulté des boss.

**Pistes à trancher avec l'utilisateur** (aucune programmée, maquette d'abord) :
1. **Tirage des condamnés aux dés** : au début de la nuit, on lance les dés pour faire sortir les 3 recrues (valeur = classe / rareté ; relance limitée ; dés gardés) au lieu de la liste imposée. Le tirage devient le premier geste du jeu.
2. **Dés plus souvent, mais un seul geste** : un lancer par vague pour l'équipement (butin tiré au dé : valeur = rareté, face spéciale = affixe), au lieu de choisir dans une liste.
3. **Simplifier les dés** : garder un seul dé visible (d6) pour les tirages, et reléguer faces spéciales, combos, d4-d20 et graver une face à l'arbre / aux reliques (introduits un par un).
4. **Cartes à la place des dés pour les sorts et les objets** : un paquet de sorts et d'objets, on pioche une main, on garde ou on défausse (le « garder / relancer » devient « garder / défausser »). Lisible et connu, mais s'éloigne de l'idée « dompter le dé ».
5. **Une machine à rouleaux** pour les recrues (copie de Slotbound, à éviter : on voudrait notre propre identité) ; variante : rouleaux de **dés** (trois dés alignés = combo = recrue).
6. **Fusion** : deux recrues identiques s'absorbent pour évoluer (déjà l'évolution au butin, à rapprocher).

Recommandation de Claude : 1 + 2 d'abord (le dé reste notre signature, mais sert plus tôt et plus souvent), avec le 3 comme règle de départ (un seul dé au début, les autres arrivent par l'arbre) ; une maquette à 2-3 directions (tirage des recrues aux dés, butin aux dés, variante cartes) avant tout code.

**Maquette 5 (26/11)** : [artefact](https://claude.ai/artifact/GxrBk8wJY34zCzxy4KqMFz), `maquettes/bannis-5.html`, sources `outils/bannis-maquette/source5.html` + `fabriquer5.py` (utilise seulement `bannis/img/`). Trois directions jouables, écrans RECRUES et BUTIN : **A** dés des condamnés (3 d6, la face = la classe, garder + une relance, butin : un dé par objet, Regalia), **B** un seul dé (interface moderne, Outfit ; trois lancers pour l'équipe, un pour le butin), **C** cartes (5 piochées, on en garde 3, butin : 3 cartes face cachée). Choix de l'utilisateur : en attente.

**Maquette 6 (27/11)** : retour de l'utilisateur sur la maquette 5 : « pas super compréhensible » ; nouvelle approche : **dés à symboles**. Une face = une classe, un équipement ou une rareté ; au départ 3 faces d'une classe et 3 d'une autre (exemple de l'utilisateur : guerrier + archer) ; les améliorations **remplacent une ou deux faces** (le dé devient le deck). [Artefact](https://claude.ai/artifact/AwB6sRPUD5MaA7oupRYPXn), `maquettes/bannis-6.html`, sources `outils/bannis-maquette/source6.html` + `fabriquer6.py`. Deux habillages jouables aux mêmes règles : A Regalia, B interface moderne ; trois écrans : RECRUES (dé des classes, trois lancers, un relancer), BUTIN (dé QUOI + dé QUALITÉ), ATELIER (choisir une amélioration parmi 3 et la graver sur une face). Idées proposées, pas encore en maquette : les recrues ajoutent leurs faces au dé des classes, dé des sorts à symboles, combat à dés (classe qui porte son coup spécial), dé d'événement par nuit. À trancher : un dé de classes pour les trois recrues ou un par recrue ; deux dés d'objets ou un seul ; sprite d'archère à trouver (l'illusionniste fait le tireur dans la maquette).

## 19. Session 3 : les dés à symboles (27/11)

**Décisions de l'utilisateur (27/11, après la maquette 6)** : direction **B** (interface moderne) ; **un dé par case de recrue** (on peut ainsi graver toujours la même classe dans une case) ; **deux dés pour l'objet** (QUOI + QUELLE QUALITÉ) ; les améliorations **remplacent une face** d'un dé choisi ; un dé de sorts pour le Mage « à voir » (pas trop lourd pour un autobattler : **pas fait**, les dés chiffrés de la session 2 restent pour les sorts) ; **un dé d'événement** par nuit, c'est lui qui amène un nouveau combattant ; petit tuto et menus plus bavards.

**Fait** :
- `run.faces` : `slots` (3 dés de 6 classes : guerrière/mercenaire, illusionniste/magicienne, prêtresse/barde, 3 faces de chaque), `quoi` (arme, armure, bijou ×2), `qual` (4 communs, 2 rares ; indices de `RARETES`), `event` (recrue, forge, bénédiction, raid, coffre, nuit calme). `VERSION_RUN` 2 (anciennes sauvegardes ignorées).
- Recrutement : les 3 condamnés sortent des 3 dés (une relance au toucher), les 6 faces de chaque dé sont visibles.
- Butin : `genererObjet(vague, mieux, run)` tire QUOI et QUALITÉ dans les dés ; boss : le premier objet est au moins rare.
- **Atelier** après les vagues paires : 3 offres (face classe, face qualité, face classe ou objet), on touche la face à remplacer.
- **Événement** après les vagues 3, 6 et 9 : dé lancé à la main ; recrue (4 héros au plus, sinon 20 or), forge (une amélioration de plus), bénédiction (soins), raid (−15 Muraille, +30 or), coffre (objet rare ou mieux), nuit calme (+10 or, +10 Muraille).
- Tuto en 4 pages à la première nuit (`bannis.tuto`), bouton « ? » ensuite. Titillium Web pour ces écrans.
- Simulateur : vague moyenne ≈ 5,9 (inchangée). Tests : `outils/fumee.js` (faces, gravure, événement recrue, coffre).

**À faire / à voir** : tester sur le téléphone ; style moderne pour tout le jeu ? ; dé de sorts pour le Mage ; recrues qui ajoutent leurs faces ; équilibrage des faces (quelles classes en plus ? légendaire dès la vague 6) ; sprite d'archère.

**Session 3b (27/11, retours : « on passe en moderne », animations des dés, menus incompréhensibles)** :
- **Tout le jeu en interface moderne** : `panneau`, `grand`, `petit`, `bouton`, `barre` et `texte` de `jeu.js` redessinés (cartes arrondies sombres, liseré teal, Titillium Web) ; les planches Dragon Regalia ne sont plus chargées (`img/ui-*.png` restent dans le dépôt, inutilisées). Les sprites restent en pixel art. Pas de nouvelle maquette : extension du style validé de la maquette 6 (direction B).
- **Animations des dés** (`tileFace` : `t0`, `pool`, `dur`, `deal`) : le dé rebondit, tourne en ralentissant, ses faces défilent, une ombre suit, puis il se tasse en se posant ; sons `SON.des` (tic-tac puis choc) ; les trois dés des recrues tombent l'un après l'autre et leur combattant n'apparaît qu'une fois posés ; le butin fait rouler les deux dés (QUOI, QUALITÉ) de chaque objet avant de le montrer ; l'événement roule 1,4 s ; l'atelier fait entrer les offres en glissant et la face gravée passe de l'ancienne à la nouvelle.
- **Menus** : fil d'étapes en haut du butin (BILAN, OBJET, ATELIER, EVENEMENT, MARCHAND ; seules les étapes de la vague), bandeau « A FAIRE : … » avec une phrase d'aide sur chaque écran (recrues, bilan, niveau, objet, équipement, atelier en 2 temps, événement, marchand) ; boutons plus explicites (« NE RIEN PRENDRE : 12 PIECES D'OR », « NE PAS L'EQUIPER : VENDRE », « LANCER LA VAGUE SUIVANTE ») ; atelier : une carte par offre avec sa description ; événement : légende des 6 faces avant le lancer ; marchand : « D8 DE SORTS » et « FACE DE SORT x2 » (plus de confusion avec les faces de l'atelier) ; cartes des héros : niveau dans une pastille.
- **À voir** : le placement, le combat et l'écran du plateau de dés de sorts ont gardé leur mise en page, seulement restylés ; essai sur le téléphone ; fusionner les dés de sorts chiffrés avec le principe des symboles ?

## 20. Maquette 7 : le dé d'action (28/11)

**Demande de l'utilisateur (28/11)** : retirer la jauge et les sorts chiffrés (session 2) et les remplacer par « quelque chose qui permet de lancer des dés pour gagner des trucs » pendant la partie, comme la machine à sous de Slotbound (nouveaux personnages, améliorations, équipement). Recherche : dans Slotbound, environ 6 tours de machine par vague, prix qui monte à chaque tour (100 puis +50, remis à zéro à la vague suivante), trois symboles alignés = une unité, unité en double = absorption (niveaux, étoiles, branches), objets achetés entre les vagues, « core » au choix parmi 3 après le 5e tour (sources de fans, chiffres variables).

**Proposition** : un **dé d'action** à 6 faces payé en or (l'or vient des monstres tués) : RECRUE (dé de la case ; une classe déjà présente est **absorbée** : niveau +1), OBJET (dés QUOI + QUALITÉ), PROGRÈS (bonus de stat), SOIN, SORT (usage unique, au prochain danger), RELIQUE (1 choix sur 3 : lancers moins chers, un lancer de plus, une face remplacée : c'est l'atelier). Prix 10, 15, 20... remis à 10 à chaque vague. Les légendaires viendraient de l'absorption (étoiles).

**[Maquette 7](https://claude.ai/artifact/Ghua5mZn2iLAifw9W8kXhW)** (`maquettes/bannis-7.html`, sources `outils/bannis-maquette/source7.html` + `fabriquer7.py`) : trois téléphones jouables : **A** lancers avant le combat (6 au plus), **B** lancers pendant le combat (sans limite, selon l'or), **C** 3 lancers avant + 1 lancer d'urgence pendant. **Choix de l'utilisateur (28/11) : C** (3 lancers avant le combat + 1 lancer d'urgence pendant), avec des animations et des choses à l'écran pour amuser le joueur, et le simulateur pour régler les prix (« ça me semble pas très cher »).

À décider ensuite : étoiles et évolutions par absorption ; que devient l'ancien atelier (devient la face RELIQUE ?) ; ce que deviennent le marchand et l'événement de nuit ; équilibrage de l'or (4 par monstre, 20 par vague dans la maquette).

## 21. Session 4 : le dé d'action (28/11, direction C)

**Retiré** : la jauge du Mage, le plateau de dés de sorts (réserve, combos, déraillements), l'écran du grimoire, les dés et pages de grimoire du butin, les articles « D8 de sorts » et « face de sort x2 » du marchand. Les sorts restent comme **effets** de la face SORT.

**Fait** :
- `run.faces.action` (recrue, objet, progrès, soin, sort, relique), `D.ACTIONS`, `D.RELIQUES` ; `R.lancerAction(run, phase, C, force)` paie l'or, tire la face et applique l'effet (en combat, les unités sont rafraîchies : `rafraichirUnite`) ; `R.peutLancer`, `R.debutLancers` (appelé par `preparerVague`), `R.appliquerRelique`. `VERSION_RUN` 3.
- **Prix** réglés au simulateur (`node outils/bannis-simulateur.js 80 --lancers`) : **16 or, puis +8 à chaque lancer, retour à 16 à la vague suivante**, 3 lancers avant le combat et 1 d'urgence (relique SANG-FROID : +1). Résultat : vague moyenne ≈ 6,6 avec lancers (contre ≈ 5,2 sans), environ 1,7 lancer joué par vague (l'or ne suffit pas pour tout).
- **Absorption** : une classe déjà là monte d'un niveau (`absorber`) ; escouade pleine (4 héros) : absorbée par un héros au hasard. Pas encore d'étoiles ni d'évolution par absorption (les légendaires restent liés à `bannis.arbre`).
- **Écran** : panneau « DÉ D'ACTION » dans le placement (prix, lancers restants, les 6 faces expliquées), bouton « LANCER LE DÉ : N OR » en combat (le combat se met en pause pendant le résultat), carte de résultat animée (le dé roule, pièces qui partent du compteur, particules, héros qui tombe ou aura de lumière pour l'absorption, rayons de rareté pour l'objet, croix vertes pour le soin, choix de relique), sort lancé tout de suite (combat) ou gardé pour le premier gros groupe (préparation).
- Atelier : une 3e offre peut être une face d'action ; 6 rangées de dés à l'atelier.
- Tests : `outils/fumee.js` (lancers et coût), simulateur `--lancers` (remplace `--des`).

**À voir** : étoiles et évolution par absorption ; or de départ (20) et gains (2 à 4 par monstre, ×3 élite, ×8 boss) ; marchand (potion, parchemin, longue-vue, Muraille) à garder ou à simplifier ; sons dédiés ; essai sur le téléphone.

## 22. Retours du 28/11 : panneau, quatre héros, arbre des dés

**Retours de l'utilisateur** : le panneau du dé d'action à droite est presque trop petit ; avec plus de 3 héros, les infos du bas sont trop petites et des boutons chevauchent le dernier héros de la liste ; les dés de classes et de qualité devraient se **graver entre les nuits, via un arbre d'améliorations** qu'on débloque entre les runs (et non pendant la nuit).

**Fait** :
- Panneau du dé d'action agrandi (dé de 80 px, prix et lancers en 15-16 px, gros bouton LANCER), explications déplacées dans un bouton « ? » et dans le tuto (page « LE DE D'ACTION », ouverte à la première nuit).
- **Quatre héros** : cartes du bas en grille 2 × 2 (plus larges, nom et classe lisibles, barres de vie et d'expérience) ; écran « QUI LE PORTE ? » à lignes compactes ; bouton et texte du bas repoussés.
- **Arbre des dés** (`ecranArbre`, accès par le titre et par l'écran de fin) : les éclats de Gueule (`bannis.stats.eclats`) achètent des paliers : CLASSES (6 paliers : 8, 14, 22, 32, 45, 60), QUALITE (3 : 10, 24, 45 ; palier 1 = face RARE, 2 = EPIQUE, 3 = LEGENDAIRE), OBJETS (2 : 10, 20), ACTION (3 : 14, 28, 48) et LEGENDES (35 par classe, débloque `legendaires()`). Chaque palier donne un **crédit de gravure** ; l'onglet **FORGE** pose la gravure pour de bon sur une face d'un dé de départ (type, face, puis face à remplacer) ; « tout remettre à zéro » rend les crédits. Sauvegarde : `bannis.arbre` ({niv, gravees, legendaires, faces}) ; `R.facesDeDepart(arbre)` fournit les dés d'une nouvelle nuit.
- **Retiré** : l'atelier pendant la nuit (le dé d'événement a une face BOURSE, +30 or, à la place de la forge) ; le fil d'étapes du butin n'a plus ATELIER.
- Tests : `outils/fumee.js` (gravure de l'arbre, achat de palier).

**À voir** : prix des paliers (revenu d'une nuit : environ 30 à 60 éclats) ; faut-il des gravures pour le dé d'événement ; légendes liées à l'évolution niveau 3 ; essai sur le téléphone.

## 23. Maquette 8 : le jeu en paysage ? (28/11)

**Question de l'utilisateur (28/11)** : le téléphone en paysage améliorerait-il la visibilité ? Le terrain est déjà horizontal (Muraille à gauche, monstres à droite). Coût : tout est à redessiner (canvas 760 × 360 au lieu de 360 × 760), un seul sens pour tout le jeu, deux mains au lieu d'une, pas de verrouillage possible dans un artefact ; le manifeste de la Ludothèque est en `orientation: any` (verrouillage possible par le jeu en plein écran sur Android, sinon message « tourne ton téléphone »).

**[Maquette 8](https://claude.ai/artifact/4GEgrkeqHy1KKdWrw7jQft)** (`maquettes/bannis-8.html`, sources `outils/bannis-maquette/source8.html` + `fabriquer8.py`) : **A** terrain pleine largeur (bande de cartes en bas, potions et gros bouton à droite, carte flottante du dé d'action au placement), **B** trois colonnes (héros à gauche, terrain au centre, dé d'action et bouton à droite), **C** le portrait actuel en captures. Trois écrans jouables par téléphone : PLACEMENT, COMBAT (en direct), ÉQUIPER (objet à gauche, héros en grille 2 × 2). Choix de l'utilisateur : en attente.

**Choix de l'utilisateur (28/11) : A (terrain pleine largeur), deux mains acceptées** (« c'est pas le premier à l'imposer »).

## 24. Session 5 : le jeu en paysage (28/11)

- **Canvas 760 × 360** (au lieu de 360 × 760) : `W = 760`, `H = 360` dans `jeu.js` ; `regles.js` : `W`, `ZONE` (x 74 à 740, y 130 à 292), `MUR_X = 60`, `CASES` (colonnes x 150 et 230, rangées y 150, 215, 280). Vitesses multipliées (`K` héros, `KM` monstres, 2,1) pour garder le rythme ; **force des monstres `FM` 1,5 et `FA` 1,4** réglées au simulateur : vague moyenne ≈ 5,2 sans lancers, ≈ 6,7 avec (comme en portrait).
- **Disposition A** : barre du haut (vague, or, vitesse, pause), terrain pleine largeur, bande du bas (cartes des héros, potions, gros bouton COMBATTRE ou LANCER d'urgence), carte flottante du dé d'action en haut à droite au placement.
- **Tous les écrans refaits en paysage** : titre (menu à droite), recrutement (3 colonnes), tuto, résultat d'un lancer (visuel à gauche, texte à droite), butin (fil d'étapes et bandeau « A FAIRE » sur deux lignes, bilan à droite, objets côte à côte, équipement en grille 2 × 2, marchand en 2 colonnes, événement avec sa légende), arbre et forge (cartes en 3 colonnes, forge à deux colonnes), fiche d'un héros (3 colonnes), pause, fin.
- **Orientation** : sur un téléphone en portrait (`max-width: 700px`), message « Tourne ton téléphone » (`#tourne` dans `index.html`) et combat mis en pause ; au premier toucher, `screen.orientation.lock("landscape")` est essayé (accepté en appli installée, sinon plein écran puis verrouillage) ; ◀ LUDOTHEQUE déverrouille. Dans l'artefact, seul le message sert.
- **Étiquette et jaquette** refaites (`outils/etiquettes.js`, vue 760 × 360).
- **À voir** : essai sur le téléphone (verrouillage du sens, lisibilité des textes de 11 à 13 px, boutons aux pouces) ; le retour à la Ludothèque en portrait.

## 25. Maquette 9 : le décor (28/11)

**Retour de l'utilisateur (28/11)** : le paysage « rend bien » ; maintenant que l'interface a été revue, le **décor** (Muraille, sol, fond) est trop simpliste et en décalage avec le reste.

**[Maquette 9](https://claude.ai/artifact/VHqJzXB1VpcPw6kRmTZMFp)** (`maquettes/bannis-9.html`, sources `outils/bannis-maquette/source9.html` + `fabriquer9.py`) : trois scènes animées avec héros, monstres et bandes d'interface par-dessus ; boutons NUIT / ORAGE / AUBE. **A** pixel art riche (ciel en bandes, lune rouge, la Gueule et ses coulées de lave, forêt morte, dalles craquelées avec os et fissures, Muraille en briques ombrées avec herse, meurtrières et bannière ; torches, lave, braises, brume animées), **B** illustration douce hors pixel (nuages flous, volcan lisse et lueur, sol à grain, grosses pierres lisses, vignette), **C** nuit bleutée plate aux couleurs de l'interface (marine et teal, grande lune, aplats, bannière turquoise, seuls le volcan, les torches et les braises restent chauds). Choix de l'utilisateur : en attente. Pas de pack d'images : tout est dessiné en code (comme les sprites sont déjà dans `bannis/img/`).

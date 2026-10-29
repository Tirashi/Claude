# Résistance : rogue-lite tactique façon Fire Emblem GBA

Jeu commencé par l'utilisateur avec une autre IA, dans un dépôt à part (« Conquete »), puis repris dans la Ludothèque le 28/10 (dossier `resistance/`). Ce cahier reprend la vision, les décisions et le plan de ce dépôt (son `CLAUDE.md` et son `README.md`), complétés de ce qui a changé à l'intégration.

## 1. Vision
Rogue-lite tactique au tour par tour inspiré de Fire Emblem (GBA).
Un **tyran** a soumis tout le continent. Le joueur mène **l'armée rebelle** : à chaque run, elle tente de libérer les pays un par un, jusqu'au tyran lui-même.
- Une carte de run par pays, façon Slay the Spire : nœuds combat, élite, marchand, événement, repos, et un **général du tyran** à vaincre pour libérer le pays.
- Chaque pays occupé a une identité militaire selon les classes disponibles (cavalerie, chevaliers lourds, archers et mages, voleurs…) et un général thématique.
- Les ennemis sont les troupes du tyran ; les alliés, des rebelles et des gens libérés qui rejoignent la cause (recrutement).
- **Hub : la forteresse rebelle** dans les montagnes. À chaque fin de run (victoire ou défaite), on y revient pour l'améliorer.
- **Mort définitive** : une unité tombée est perdue pour la run (`RUN_RULES.permadeath`).
- **Soin entre les combats** : 0 % au départ (`RUN_RULES.afterBattleHeal`) ; seuls les repos soignent (et l'Infirmerie, et plus tard un soigneur dans l'armée).
- **Toute nouvelle règle doit garder une issue** : jamais de combat sans fin (d'où le bouton Retraite et les armes efficaces).

### Philosophie de difficulté
**Dur au début, et chaque amélioration de la forteresse doit se sentir vraiment** dans les runs suivantes. Les premières runs servent à rapporter de quoi progresser : ne pas adoucir le départ, c'est la forteresse qui fait la différence.

## 2. La forteresse (méta-progression, façon Rogue Legacy)
**Deux ressources seulement** : le **ravitaillement** et l'**or** (ne pas en ajouter d'autres).
- Chaque run rapporte au moins 1 ravitaillement ; 50 % de l'or restant va au trésor (`META_RULES`) ; au comptoir de la Trésorerie, 25 or = 1 ravitaillement.
- **Recrutement en début de run** (`js/data/recruits.js`) : la graine propose des candidats (nom, classe de base, parfois un **trait** comme « Chanceux : +15 critique »), le joueur en garde 3. Classes de base : bretteur, guerrier, lancier, archer.
- **Bâtiments** (2 niveaux chacun, coûts en ravitaillement) : Caserne (+1 place), Taverne (+1 candidat, +15 % de traits), Salle d'armes (+1 niveau de départ), Infirmerie (+15 % de PV après chaque victoire), Ferme (+2 rations), Trésorerie (+25 % de l'or gardé), Mémorial (vétérans), Autel du phénix (Fleur du phénix au départ).
- **Intendance** : préparer la prochaine run avec l'or du trésor (potions, armes d'acier ou efficaces confiées après le recrutement, Manuel de tactique = +1 niveau pour la run), sauvegardé dans `meta.prep` ; « Tout rendre » rembourse.
- **Vétérans et Capitaines** (Mémorial) : en fin de run, un soldat (mort ou vivant) devient vétéran ; on le rappelle à l'Intendance (80 or, +40 par grade) ; il prend une place, garde nom, classe, trait et une part de ses niveaux, gagne un grade (chevron, jusqu'à 3) et un trait de plus à chaque retour ; **aura** +10 précision et esquive aux alliés adjacents.
- **Le joueur arbitre entre le long terme et la prochaine run** (l'or de l'Intendance n'achète pas de ravitaillement).

Améliorations prévues (pas encore faites) : déblocage de classes recrutables (`RECRUITMENT.classes` : cavalier, chevaliers, mage, voleur…), de compétences, d'armes et d'équipements ; un emplacement d'équipement par soldat ; d'autres consommables de run ; un vétéran de plus au niveau 2 du Mémorial (à confirmer).

## 3. Une run
Recrutement (6 candidats, 3 gardés), puis la carte du pays (7 étages) : à chaque étage, un nœud relié à sa position.
- **Combat**, **élite** (« ! », plus dure, plus d'EXP, du ravitaillement), **repos** (tous les PV + ravitaillement), **marchand** (au moins un par carte), **événement** (grotte « ? » : village attaqué, déserteur, coffre piégé, sanctuaire, forge ; toujours un choix sans risque), **général** (losange doré).
- Chaque chemin compte au moins 4 combats avant le général (`minFightsPerPath`), jamais deux haltes de suite.
- L'armée garde PV, niveaux et EXP d'un combat à l'autre. Une montée de niveau soigne entièrement l'unité. Les ennemis gagnent des niveaux au fil des étages.
- **Sac de l'armée** partagé ; action « Objet » en combat. La Fleur du phénix ramène automatiquement une unité tombée après une victoire ou une retraite.
- **Retraite** : pas de butin, la run continue ; fuir le général met fin à la run.
- **Graine** : `index.html?seed=123456` rejoue la même run ; bouton « Même graine » en fin de run. Aléatoire uniquement par `RNG` (`js/core/rng.js`, mulberry32, jets « 2RN » façon GBA).

## 4. Combat
Formules Fire Emblem : triangle des armes (épée > hache > lance > épée : +15 précision, +1 dégât), doublé à +4 Vitesse, critique ×3, dégâts jamais sous 0 (armures), **armes efficaces** (Puissance ×3 contre un type de déplacement : Perce-armure, Marteau, Hallebarde). Triangle rappelé partout (flèches ▲/▼, prévisions, fiche). IA : aggressive / guard / stationary. EXP : 10 par coup, ~30 par ennemi vaincu, 100 = un niveau (au moins un gain garanti).

## 5. Technique
- Résolution logique 240 × 160 (GBA), tuiles 16 × 16, sprites d'unités en cellules 32 × 32, canvas sans lissage ; panneaux et fenêtres en HTML par-dessus.
- **Piloté par les données** : classes, armes, terrains, cartes, rencontres, pays, événements, bâtiments dans `js/data/` ; `js/run/validate.js` signale les erreurs au démarrage (`[données] …` dans la console).
- Architecture : `js/main.js` (boucle, entrées souris/clavier/tactile, mise à l'échelle) transmet les entrées à l'écran actif `game.scene` (même interface pour la forteresse, la carte et le combat : `update`, `render`, `hover`, `click`, `moveCursor`, `confirm`, `cancel`, `cursor`) ; `js/core/` (images, chiffres pixel, RNG, sauvegarde), `js/battle/` (combat, IA, rendu, panneaux HTML), `js/run/` (enchaînement, état de la run, génération de la carte, écrans de la carte et de la forteresse).
- **Chiffres** : ceux de Pixelify Sans sont ambigus (5 ≈ S, 2 ≈ 8) ; tous les chiffres passent par des glyphes pixel 5 × 7 (`js/core/digits.js`) : en HTML, conversion automatique (`installPixelDigits`, sauf `.seed`), sur le canvas `drawPixelText`.
- Sauvegarde : `resistance.save` (`{version: 1, meta}`) : ravitaillement, or du trésor, `runs`, `wins` (pays libérés, ajouté à l'intégration), `upgrades`, `prep`, `veteran`.
- **Run en cours** (28/10) : `resistance.run` (`{version: 1, run}`, `Run.toSave(at)` / `Run.fromSave`, `loadRun` / `saveRun` / `clearRun` dans `js/core/save.js`). Écrite par `Game.saveRun(at)` à chaque étape : sur la carte (`showMap`), en entrant dans un nœud (`at` = ce nœud), après chaque achat chez le marchand, au début d'un combat, juste après une victoire ou une retraite ; effacée au début de `endRun`. Rien n'est écrit avant la fin du recrutement (pas d'armée), et les préparatifs de l'Intendance ne sont consommés qu'à ce moment-là. La carte est gardée entière (stocks des marchands, `node.encounter` / `node.loot` d'un combat d'événement). Au lancement, `main.js` affiche la forteresse puis `game.resumeRun()` reprend la run : sur la carte, ou dans le nœud `at` (un repos, un marchand ou un événement se rejouent depuis l'état d'avant ; le combat d'un événement reprend directement). **Un combat interrompu recommence à son début** (même graine, mêmes ennemis, PV d'avant le combat) : on peut donc refaire un combat mal parti en fermant le jeu ; accepté pour un jeu de famille. Accueil : `PROGRESS` affiche « ETAGE n/7 » (ou « CAMPAGNE EN COURS » avant le premier nœud).
- Tests à la main : `__game` (contrôleur, `__game.scene` = écran actif), `__run`, `__battle` ; `window.Resistance` contient tout ce que les fichiers partagent. Onglet en arrière-plan : avancer à la main avec `__game.scene.update(performance.now())`.

### Changements à l'intégration (28/10)
- **Modules ES → scripts classiques** (règle de la Ludothèque) : chaque fichier est une fonction immédiate en mode strict qui lit ses dépendances dans `window.Resistance` (`const { CLASSES, … } = Resistance;`, à la place des `import`) et y range ce qu'il exportait (`Object.assign(Resistance, {…})`). L'ordre des `<script>` dans `index.html` suit les dépendances : **un nouveau fichier se place après ceux qu'il lit**, et va dans `FILES` de `sw.js`.
- `css/style.css` → `style.css` ; la police vient de `polices/pixelify-sans.woff2` (le même fichier que La Dernière Lanterne) ; les images restent dans `resistance/assets/`.
- Bouton **« ◀ Ludothèque »** dans la barre de la forteresse seulement (`#ludo-btn`, classe `ludo-retour`).
- Pas repris : `.claude/launch.json` (serveur Windows), les maquettes d'interface (`mockups/` : comparaison des packs Cryo, Dogo, Dragon Regalia, Mana Soul ; Mana Soul a été retenu), l'historique git du dépôt d'origine.
- Accueil : cartouche 32 bits, icône bouclier `resistance`, records (pays libérés, campagnes, niveaux de la forteresse, vétéran), transfert `LUDO1-` (la forteresse la plus avancée, au nombre de campagnes, remplace l'autre). **Pas de classement** pour l'instant (un seul pays) ; pas d'artefact (à décider).

## 6. Graphismes et licences
- **Fantasy Battle Pack** de Matt Walkden (https://mattwalkden.itch.io/fantasy-battle-pack) : 11 classes (bleu/rouge/vert, variantes 1 à 3), tileset 16 × 16, eau animée, curseur, flèches de déplacement, cases de portée, effet critique. Licence : distribution permise « comme composant d'une œuvre artistique ou commerciale » ; **l'auteur a confirmé** (capture envoyée par l'utilisateur le 28/10) que les sprites peuvent être dans un dépôt GitHub public. Ne pas redistribuer le pack seul ; **ne copier dans `assets/` que les fichiers utilisés**. Planches d'unités 256 × 448, cellules 32 × 32 : 3 blocs de 4 lignes (profil vers la droite, face, dos ; la gauche = miroir), lignes attente, marche, attaque, mort (5 images pour les cavaliers).
- Icônes 16 × 16 **IvoryRed** (CC BY 4.0) : `assets/icons/weapons.png` (10 colonnes = types d'arme, 13 lignes = matériaux), `items.png` ; coordonnées dans `js/data/icons.js`.
- **Mini World Sprites** (Shade, octoshrimpy, CC0) : bâtiments de la carte et de la forteresse (cyan = rebelles, rouge = tyran), échelle « carte du monde », pas pour les combats.
- Cadres **Mana Soul GUI** (tiopalada, CC0) : 9-slice 96 × 96 (`assets/ui/frame-*.png`, correspondance dans `assets/ui/LICENSE.txt`), variables `--frame-*` de `style.css`.
- Police Pixelify Sans (SIL OFL 1.1).
- Tout est cité dans `credits/index.html`. **Un seul style** : ne pas mélanger des unités d'autres packs.
- Budget (décision prise dans l'autre dépôt) : packs gratuits pour l'instant. Achat prévu vers **janvier 2027** : extension payante **« Specialist Units »** de Matt Walkden (unités promues et spécialistes, dont un **clerc** = futur soigneur ; même format, rien à adapter). Pistes payantes notées : *RPG Overworld Tileset* (même auteur : carte de run et forteresse), *Merlin Pixel Font*. Préférence de l'utilisateur (25/10) : des graphismes dont on peut faire ce qu'on veut, quitte à payer.

## 7. État et prochaines étapes
Fait : combat complet (déplacements, portées, prévisions, animations, IA, tours, victoire/défaite, EXP, niveaux), interface pixel façon GBA, version mobile ; carte de run v1 (un pays, « Les Marches de l'Ouest », 7 étages, 3 terrains de combat, 9 rencontres) ; 11 classes, 4 recrutables ; recrutement à traits ; économie (or, marchand, objets, ravitaillement) ; 5 événements ; forteresse v1 (8 bâtiments, Trésorerie, Intendance, Mémorial et Capitaines, Autel du phénix) ; retraite et armes efficaces.

Prochaines étapes, dans l'ordre du plan d'origine :
1. Équilibrer la carte de run en jouant.
2. Progression pendant la run : d'autres consommables ; **classe de soigneur** (PV rendus après chaque combat ; sprite du mage en attendant le clerc).
3. Plusieurs cartes de combat et objectifs (tout vaincre, battre le chef, survivre X tours).
4. Forteresse : déblocage de classes (le reste est fait).
5. **Pays thématiques** et leurs généraux (recolorations, compétences spéciales), jusqu'au tyran.

Ajouté à l'intégration (à discuter) :
- ✅ **Sauvegarde de la run en cours** (28/10, § 5). Reste possible : sauvegarder aussi le combat lui-même (positions, PV, tour, état du RNG) pour qu'on ne puisse plus refaire un combat en fermant le jeu.
- **Classement** quand il y aura plusieurs pays (pays libérés, ou une run du jour à graine commune).
- Sons (rien pour l'instant).
- Artefact : les images sont des fichiers à part ; `outils/artefact.py` ne les intègre pas (il faudrait les passer en `data:`).

## 8. Revue sur téléphone et UI/UX (28/10)
Tour complet dans Chromium sur un téléphone (390 × 844, tactile, portrait puis paysage 844 × 390) : forteresse, bâtiment, Intendance, départ, recrutement, carte, armée, combat (sélection, déplacement, menu, cibles, prévisions, attaque, fiche ennemie, phase ennemie), retraite, marchand, événement, fin de run. Aucune erreur, tout est jouable au doigt. Le jeu a été pensé pour l'ordinateur : sur le téléphone, il est petit et laisse beaucoup de place vide.

### Ce qui marche bien
- Lecture du combat très claire, fidèle à Fire Emblem : cases bleues et rouges, flèches ▲/▼ du triangle, prévisions complètes (PV avant → après, dégâts ×2, précision, critique, ligne du triangle), fiche d'unité riche (« Fort contre / Faible contre »).
- Toucher deux fois (une fois pour voir, une fois pour agir) partout : nœuds de la carte, cibles, bâtiments ; pas de survol obligatoire.
- Confirmation avant chaque décision coûteuse (construire, partir, retraite). Bandeaux de phase lisibles.
- Recrutement : liste claire, compteur « En route ! (0/3) » qui s'allume quand c'est prêt.
- Cadres Mana Soul et chiffres pixel : style GBA cohérent.

### Problèmes, du plus gênant au moins gênant
1. **La carte est minuscule et l'écran à moitié vide** (portrait) : le canvas 240 × 160 prend la largeur (une case = 26 px, ~7 mm, sous les ~9 mm conseillés pour un doigt), soit 30 % de la hauteur ; sous la barre, ~45 % de l'écran reste noir. En paysage c'est pire : une case = 21 px.
2. **Le menu d'action (Attaquer / Attendre / Objet) est trop petit** et posé sur la carte à côté de l'unité (lignes d'environ 20 px de haut, texte de 13 px) : facile de rater ou de toucher la carte derrière. C'est l'action la plus fréquente du jeu.
3. **Textes trop petits** : `--fs` vaut 13 px au mieux, et les `.85em` / `.8em` donnent 10-11 px (panneau d'un nœud ou d'un bâtiment, « Touchez encore pour… », stats, prévisions, notes). Pixelify Sans devient difficile à lire sous ~12 px.
4. **Barre d'outils de combat en vrac** : « Tour 1 · Annuler · Fin du tour » puis « Retraite » seule à la ligne, juste sous la main ; « Annuler » est toujours là même quand il n'y a rien à annuler. En paysage, la fiche d'unité se pose sur la carte et cache des cases.
5. **Fenêtres étroites** (confirmations à ~240 px de large, texte de 11 px) alors que l'écran fait 390 px.
6. **Choix des événements** : les lignes ne ressemblent pas à des boutons (seule celle qui a le focus clavier a un cadre pointillé).
7. Détails : l'attaque se confirme en touchant de nouveau la cible (un bouton « Attaquer » dans les prévisions serait plus clair) ; pas de son ni de vibration au toucher ; les emblèmes des bâtiments de la forteresse sont petits.

### Pistes proposées (à valider, maquette d'abord pour 1 et 2)
- **A. Mise en page téléphone en portrait** : carte en haut, **zoomée** (une case ≈ 40 px, la vue suit l'unité choisie ou le curseur, glisser pour se déplacer), dessous une zone fixe pour la fiche, les prévisions et le menu d'action en **gros boutons**, la barre en bas à portée du pouce (Fin du tour à droite, Retraite rangée dans un menu « ⋯ »). Gros chantier (rendu, entrées, panneaux), le plus utile.
- **B. Retouches rapides sans changer la mise en page** : texte minimum 14-15 px sur téléphone, menu d'action en gros boutons dans la zone sous la carte, bouton « Attaquer » dans les prévisions, « Annuler » seulement quand il sert, choix d'événements en boutons, fenêtres plus larges ; fiche d'unité sous la carte aussi en paysage.
- C. Plus tard : sons (sélection, coups, critique, niveau), petite vibration au toucher.

### Piste B faite (28/10)
- Écran tactile (`pointer: coarse`) : `--fs` au moins 15 px, petits textes à `.9em` (≈ 13 px), lignes de menu d'au moins 44 px, choix et recrues d'au moins 48 px.
- Portrait : **menu d'action en gros boutons sous la carte** (`.menu.docked`, rangé dans `#hud` par `UI.showMenu` ; la première action en orange) ; ailleurs, il reste à côté de l'unité.
- **Bouton « Attaquer » dans les prévisions** (`showForecast(…, onAttack)`, même effet que toucher de nouveau la cible).
- **« Annuler » grisé** quand il n'y a rien à annuler (`UI.setCancelEnabled`, appelé par `Battle.update`).
- Portrait : **barre en bas de l'écran** ; en combat « Tour n » et Retraite (petite) en haut, Annuler et Fin du tour en grand dessous.
- Choix (événements, marchand, Intendance) en vrais boutons (fond et bord visibles) ; fenêtres presque pleine largeur en portrait.
- Pas changé : en paysage, la fiche d'unité reste posée sur la carte ; la carte garde sa taille (piste A).

### Piste A : maquette (28/10)
`maquettes/resistance-carte.html` (https://claude.ai/artifact/K154d3x8LT1wzwaHWebWBN), trois écrans de téléphone jouables sur un vrai combat (« Patrouille du gué », exporté du jeu, vrais sprites) :
- **A, la caméra qui suit** : 9 cases de large (43 px), les 10 lignes en entier, la carte glisse au doigt et se recentre sur le soldat choisi, petite carte en coin.
- **B, la carte couchée** : en portrait, la carte tournée d'un quart de tour (10 × 15 cases de 39 px), l'armée en bas, tout visible sans glisser ; soldats vus de dos et de face (lignes « dos » et « face » des planches du pack).
- **C, le zoom au doigt** : toute la carte à 26 px, zoom à 44 px sur le soldat choisi, dézoom après l'action, loupe pour zoomer à la main.
En attente du choix de l'utilisateur.
**B choisie** (28/10), étendue aux trois écrans à la demande de l'utilisateur, et faite :
- `js/core/view.js` : `VIEW.portrait` (écran plus haut que large, réglé par `fit()` dans `main.js`), `toCell` / `fromCell` (case du jeu ↔ case affichée : `(x, y) → (y, 14 − x)`), `toPx`, `place(ctx, ax, ay, fn)` (dessine un objet écrit en coordonnées paysage à la place de son point d'ancrage, sans le tourner), `faceOf` (droite → dos, gauche → face), `cacheValid` / `storeCache` (fond refait si l'orientation change). Les règles, l'IA, la sauvegarde et les écrans gardent leurs coordonnées paysage ; seuls le dessin et le toucher passent par la vue.
- Combat (`renderer.js`), carte de campagne (`runmap.js` : le camp en bas, le château du général en haut, chemins remis en place point par point) et forteresse (`fortress.js` : chaque bâtiment d'un bloc, les champs case par case).
- Portrait : la carte fait 160 × 240 pixels de jeu (39 px par case sur un écran de 390 px) ; barre de combat sur une rangée (Retraite, Annuler, Fin du tour ; le numéro du tour est dans le bandeau de phase) ; la fiche d'unité prend toute la largeur et cache la case de terrain (toucher une case vide la montre).

### Boutons : maquette (28/10)
Demande de l'utilisateur (« revoir les boutons »). `maquettes/resistance-boutons.html` (https://claude.ai/artifact/ME8wyFNbRthRCK72hPcoQg), sur la carte couchée, au moment où un soldat vient de se placer contre un ennemi, avec la même fenêtre de la forteresse sous chaque téléphone :
- **A, la fenêtre GBA** : actions en liste dans une fenêtre bleue à bord blanc, petite main qui pointe, détail à droite (« Voleur · 39 % ») ; boutons plats de la même famille, bord doré pour le principal.
- **B, gros boutons en relief** : boutons pixel épais qui s'enfoncent, une couleur et une icône par action (rouge Attaquer, vert Objet, bleu Attendre), Retraite en petit drapeau.
- **C, façon appli** : actions en grandes cartes qui disent ce qui va se passer (« Attaquer le Voleur · 39 % · 10 dégâts · il riposte 2 × 2 »), barre d'icônes rondes, gros bouton orange Fin du tour.
En attente du choix ; le style retenu ira partout (combat, carte, forteresse, marchand, Intendance, confirmations).
**A choisie** (28/10) et faite : bloc « Boutons façon GBA » à la fin de `style.css` (fond bleu en dégradé, bord blanc de 3 px, contour sombre ; principal en or, Retraite en rose) pour la barre, les fenêtres, la fin de run et le bouton Attaquer des prévisions ; menu d'action en liste dans une fenêtre GBA avec la petite main (pixel art dessiné par `ui.js` dans `--main`), icône de l'arme ou de l'objet, et détail à droite (`showMenu` : `{ id, label, icon, detail }` ; Attaquer : « Voleur · 39 % » ou « 2 cibles », Objet : « Vulnéraire ×2 »). Les prévisions complètes (PV, dégâts, précision, critique, triangle, armes efficaces) restent affichées au choix de la cible ; les panneaux gardent les cadres Mana Soul.
**Soldats de profil sur la carte couchée** (28/10, l'utilisateur ne trouvait pas les soldats de dos réussis) : `VIEW.profil = true` dans `js/core/view.js` ; les rebelles regardent à droite, l'ennemi à gauche, comme en paysage ; un pas vers le haut ou le bas de la carte paysage devient un pas vers la gauche ou la droite. `VIEW.profil = false` redonne la version de dos et de face.

## 9. Confort de jeu (29/10)
Idées proposées par Claude le 29/10 (écrites nulle part avant) et faites d'un coup à la demande de l'utilisateur ; à essayer sur le téléphone ([`specs/essais.md`](essais.md)).
- **Zone de danger** : bouton « Danger » (touche D) dans la barre de combat ; voile rouge avec un bord sur toutes les cases qu'un ennemi peut frapper à son prochain tour (`Battle.dangerTiles`, recalculée quand une unité bouge ou tombe ; un ennemi immobile ne compte que depuis sa case). Visible au repos et quand un soldat est choisi (une case bleue et rouge = on peut y aller mais on y sera frappé). Le bouton reste allumé d'un combat à l'autre (pas sauvegardé).
- **Garde-fou sur « Fin du tour »** : si des soldats n'ont pas joué, fenêtre « Finir le tour ? » avec leurs noms (`Game.confirmEndTurn`, aussi pour la touche E). La fin automatique du tour quand tout le monde a joué ne change pas.
- **Phase ennemie accélérée** : toucher la carte pendant le tour ennemi le passe à ×2 jusqu'au tour suivant. Le combat a sa propre horloge (`Battle.time`, avance de `dt × 2` quand `fast`), que suivent toutes les animations ; pastille « Toucher : ×2 » / « Accéléré ×2 » en haut à droite. Les bandeaux de phase (minuterie CSS) ne sont pas accélérés.
- **Dernières paroles** : un rebelle qui tombe dit une phrase dans une fenêtre façon GBA (2 s, 1 s accéléré). Choisie d'après son nom et le tour, **pas avec la graine** (une partie rejouée reste la même) ; deux phrases à part pour un Capitaine (`LAST_WORDS`, `CAPTAIN_WORDS` dans `battle.js`).
- **Bilan de campagne** : avant le Mémorial, fenêtre « Bilan de la campagne » (ou « de la victoire ») : étage, combats gagnés, ennemis vaincus, pertes, le **héros** (★, le plus d'ennemis vaincus) et chaque soldat (ennemis vaincus, a survécu ou tombé et où). Nouveau : `kills` sur chaque unité du combat puis chaque soldat de l'armée, `fellAt` (nom de la rencontre), `run.stats` `{won, turns}` (sauvegardé avec la run ; une vieille sauvegarde repart de zéro). Le Mémorial montre aussi les ennemis vaincus.
- **Premier combat guidé** (`js/battle/guide.js`) : une bulle en haut de la carte explique chaque geste la première fois (choisir un soldat, cases bleues et rouges, menu d'action, prévisions et triangle des armes, après le premier soldat, zone de danger, tour ennemi). Toucher la bulle la ferme, « Passer le guide » l'arrête. `meta.guideDone` après le premier combat (une forteresse déjà avancée le voit donc une fois).


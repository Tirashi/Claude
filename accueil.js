(() => {
"use strict";
const ROOT = "";   // dossier du site (l'artefact y met l'adresse complète du site publié)
const L = window.LudoScores;   // absent dans l'artefact : pas de classement
const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- les jeux : cartouche (famille 16 bits, 32 bits ou reprise), couleurs, description ---------- */
// À TENIR À JOUR pour un nouveau jeu : une ligne dans GAMES (k = chemin de la page, ic = icône de icones.js,
// fam = "16" | "32" | "rep" | "3d" (CD dans un boîtier bonbon de la teinte sh), lb/lt = étiquette et texte, sh = teinte du plastique de poche, rank = classements dans RANKS),
// et dans META (dates, genres), NEWS, PROGRESS, RECS, RANKS.
const GAMES = [
  {k: "picross/index.html", n: "PICROSS DEX", s: "PICROSS DEX", ic: "ball", fam: "16", lb: "#cf2b34", lt: "#fff7ec", sh: "#d23a3a", rank: "picross",
   d: "Remplis la grille d'après les nombres pour révéler un Pokémon. Fan-game personnel.", tags: ["207 GRILLES"]},
  {k: "lignee/index.html", n: "LIGNEE", s: "LIGNEE", ic: "tree", fam: "16", lb: "linear-gradient(#6b3f1f, #2f1a0c)", lt: "#e0a83a", sh: "#a0682e", rank: "lignee",
   d: "Reconstitue un arbre généalogique grâce aux indices, avec 3 vies : familles françaises, dynasties royales ou familles de films et de séries.", tags: ["ARBRES INFINIS"]},
  {k: "queens/index.html", n: "QUEENS", s: "QUEENS", ic: "crown", fam: "16", lb: "linear-gradient(#3a4cc8, #141a6a)", lt: "#ffd23f", sh: "#3a4cc8", rank: "queens",
   d: "Une reine par ligne, par colonne et par couleur, sans qu'elles se touchent.", tags: ["5×5 A 9×9"], more: [["GRILLE DU JOUR", "queens/index.html#jour"]]},
  {k: "injagility/index.html", n: "INJAGILITY", s: "INJAGILITY", ic: "dog", fam: "32", lb: "linear-gradient(#78bae7, #5fb548)", lt: "#fff", sh: "#5fb548", rank: "injagility",
   d: "Ton chien en agility : course sans fin, ou parcours vus du dessus à tracer au doigt. Six races à adopter au chenil.", tags: ["COURSE", "PARCOURS"], play: "INFINI ▶", more: [["PARCOURS ▶", "injagility/parcours.html"]]},
  {k: "solitaire/index.html", n: "SOLITAIRE", s: "SOLITAIRE", ic: "cards", fam: "rep", lb: "linear-gradient(#2a8a48, #145a2c)", lt: "#ffd23f", sh: "#2a8a48", rank: "solitaire",
   d: "Le Klondike de Windows XP : range les cartes de l'As au Roi, et regarde-les rebondir à la fin.", tags: ["PIOCHE 1 OU 3"]},
  {k: "touche-coule/index.html", n: "TOUCHE COULE", s: "TOUCHE COULE", ic: "boat", fam: "16", lb: "linear-gradient(#2b6fd0, #0f1866)", lt: "#ffd84a", sh: "#2b6fd0", rank: "touchecoule",
   d: "Bataille navale contre l'ordinateur, en mode classique ou avec sonar et torpilles.", tags: ["3 NIVEAUX D'IA"]},
  {k: "amiral/index.html", n: "AMIRAL !", s: "AMIRAL !", ic: "anchor", fam: "32", lb: "linear-gradient(#1c579c, #0a1c40)", lt: "#ffd23f", sh: "#1c579c", rank: "amiral",
   d: "La bataille navale où chaque navire a un pouvoir : compose ta flotte au chantier naval parmi 11 navires (avion, salve, torpille, sonar, mines, fumée, leurre...), et chaque jour une bataille imposée.", tags: ["3 NIVEAUX", "DU JOUR"]},
  {k: "escadrille/index.html", n: "ESCADRILLE !", s: "ESCADRILLE", ic: "fighter", fam: "32", lb: "linear-gradient(#3a7cc4, #0f2850)", lt: "#ffd23f", sh: "#3a7cc4", rank: "escadrille",
   d: "La bataille aérienne où chaque avion a un pouvoir : radar, bombes en croix, missile, esquive, roquettes, leurres, ballons de barrage… Choisis tes 4 avions au hangar parmi 10, abats l'escadrille pirate cachée dans les nuages, gagne des avions et des escadrilles.", tags: ["3 NIVEAUX", "10 AVIONS", "4 ESCADRILLES"]},
  {k: "club/index.html", n: "LE CLUB D'AGILITY", s: "CLUB AGILITY", ic: "cup", fam: "32", lb: "linear-gradient(#3f8a37, #173a1a)", lt: "#ffd23f", sh: "#3f8a37", rank: "club",
   d: "Recrute des chiens, entraîne-les semaine après semaine et mène ton club jusqu'au Championnat de France.", tags: ["6 RACES"]},
  {k: "orbite/index.html", n: "ORBITE", s: "ORBITE", ic: "planet", fam: "32", lb: "radial-gradient(circle at 30% 30%, #3a2a8a, #070a1c 75%)", lt: "#6fd8ff", sh: "#5a3ab8", rank: "orbite",
   d: "Lance ta sonde et laisse la gravité des planètes la guider jusqu'à la balise, entre trous noirs et portails.", tags: ["30 NIVEAUX"]},
  {k: "alunissage/index.html", n: "ALUNISSAGE", s: "ALUNISSAGE", ic: "lander", fam: "32", lb: "linear-gradient(#0a0c1e, #2c2a28)", lt: "#e8e4d8", sh: "#8a8a90", rank: "alunissage",
   d: "Pose ton module en douceur avec deux réacteurs, de la Lune à la comète. Plus l'aire est étroite, plus elle rapporte.", tags: ["MISSION DU JOUR"]},
  {k: "pont-stellaire/index.html", n: "PONT STELLAIRE", s: "PONT STELLAIRE", ic: "stars", fam: "32", lb: "radial-gradient(circle at 70% 25%, #24407a, #070a1c 75%)", lt: "#ffd76a", sh: "#2a4a9a", rank: "pontstellaire",
   d: "Relie les étoiles par des faisceaux de lumière, sans croisement, pour dessiner une constellation. Un ciel du jour pour toute la famille.", tags: ["CIEL DU JOUR"]},
  {k: "lune-rover/index.html", n: "LUNE-ROVER", s: "LUNE-ROVER", ic: "rover", fam: "32", lb: "linear-gradient(#14142a, #3a3834)", lt: "#5ae6f2", sh: "#5a5a6a", rank: "lunerover",
   d: "Programme Pico, le petit robot lunaire, à l'avance (avancer, tourner, sauter, ramasser, boucles et conditions) pour récolter les cristaux. 3 étoiles pour le programme le plus court.", tags: ["30 NIVEAUX"]},
  {k: "sudoku/index.html", n: "SUDOKU", s: "SUDOKU", ic: "grid9", fam: "32", lb: "linear-gradient(#3a1a4a, #12082a)", lt: "#ffb8d0", sh: "#8a3aa8", rank: "sudoku",
   d: "Un chiffre par ligne, par colonne et par bloc, sous la lune d'un jardin japonais. Notes au crayon et grille du jour.", tags: ["4×4 A 9×9"]},
  {k: "calculator/index.html", n: "CALCULATOR", s: "CALCULATOR", ic: "calc", fam: "32", lb: "linear-gradient(#3a3d43, #1c1d21)", lt: "#c4d0a8", sh: "#e8783a", rank: "calculator",
   d: "Le calcul mental de 7 à 77 ans : additions, soustractions, multiplications et divisions sur 5 niveaux, en série de 20, contre la montre ou avec le calcul du jour. Trois styles : arcade, cahier ou calculatrice.", tags: ["5 NIVEAUX"]},
  {k: "empilage/index.html", n: "EMPILAGE", s: "EMPILAGE", ic: "stack", fam: "3d", lb: "linear-gradient(#9fd8ff, #ffd6c8)", lt: "#5a46a8", sh: "#f29bc0", rank: "empilage",
   d: "Lâche chaque bloc pile sur la tour : ce qui dépasse tombe. Monte du matin jusqu'à la nuit étoilée, en 3D pastel. Une tour du jour pour toute la famille.", tags: ["3D", "TOUR DU JOUR"]},
  {k: "yams/index.html", n: "YAMS", s: "YAMS", ic: "des", fam: "3d", lb: "linear-gradient(#f6e1f3, #bfe8d0)", lt: "#6b4a7a", sh: "#e0559a", rank: "yams",
   d: "Le Yams classique avec de vrais dés en 3D : lance-les d'un geste, garde les bons et remplis les 13 cases de la feuille. Six styles de dés à débloquer, de la taverne à la Lune.", tags: ["3D", "DÉS", "6 STYLES"]},
  {k: "odyssee/index.html", n: "ODYSSEE", s: "ODYSSEE", ic: "galere", fam: "3d", lb: "linear-gradient(#9fdcff, #1fb0c9)", lt: "#13506e", sh: "#2bb3cf", rank: "odyssee",
   d: "Penche le téléphone pour ramener la galère d'Ulysse de Troie à Ithaque : Polyphème, Éole, Circé, les Sirènes, Charybde et Scylla… 30 plateaux en 3D et un plateau du jour pour toute la famille.", tags: ["3D", "PLATEAU DU JOUR"]},
  {k: "doggy-saga/index.html", n: "DOGGY SAGA", s: "DOGGY", ic: "doggy", fam: "32", lb: "linear-gradient(#ffb48a, #e8784f)", lt: "#fff6ea", sh: "#e8784f", rank: "doggysaga",
   d: "Trois en ligne au refuge : glisse les chiens pour en aligner 3 pareils et leur faire des câlins. Bandanas, nœuds et balles de tennis font de grosses cascades. Lave la boue, ouvre les niches, guide les chiots jusqu'à leur panier et trouve une famille aux 16 chiens dans 60 niveaux. Pour toute la famille, avec la journée du jour.", tags: ["60 NIVEAUX", "ALBUM", "DEFI DU JOUR"], more: [["JOURNEE DU JOUR", "doggy-saga/index.html#jour"]]},
  {k: "the-des-jarls/index.html", n: "LE THE DES JARLS", s: "JARLS", ic: "jarl", fam: "32", lb: "linear-gradient(#2c3c70, #0e1428)", lt: "#f3d58c", sh: "#3a4a8a", rank: "jarls",
   d: "Duel de dés viking façon Orlog : six dés, trois lancers, et chaque face lance ton armée de 45 soldats à l'assaut (charge des haches, volée de flèches, éclaireurs voleurs). Invoque les faveurs de 20 dieux nordiques, remonte la route du fjord de taverne en taverne, joue à deux sur le même téléphone et tente le défi du jour.", tags: ["DES", "CAMPAGNE", "A DEUX", "DEFI DU JOUR"]},
  {k: "duche/index.html", n: "DUCHE", s: "DUCHE", ic: "donjon", fam: "32", lb: "linear-gradient(#5a3a20, #2a1a0e)", lt: "#f0c24a", sh: "#8a6410", rank: "duche",
   d: "Un petit 4X au tour par tour sur 37 terres hexagonales en pixel art 32 bits : bâtis, recrute, conquiers les terres de trois seigneurs rivaux et gagne la couronne en 30 saisons. Combats en scènes HD-2D, événements, un Duché du jour pour toute la famille.", tags: ["STRATEGIE", "30 TOURS", "DUCHE DU JOUR"]},
  {k: "boutique/index.html", n: "LA BOUTIQUE DE CARTES", s: "BOUTIQUE", ic: "boutique", fam: "3d", lb: "linear-gradient(#8a63d2, #2b2838)", lt: "#ffd84d", sh: "#8a63d2", rank: "boutique",
   d: "Tiens une boutique de cartes à collectionner pendant un an, en 3D. Commande au grossiste, ouvre des boosters (vendre fermé ou ouvrir ? c'est tout le pari), remplis tes vitrines et ton classeur, aménage et agrandis la boutique, organise le tournoi du samedi, et regarde les clients acheter. Cinq extensions sortent dans l'année, les cotes bougent chaque dimanche.", tags: ["3D", "GESTION", "52 SEMAINES"]},
  {k: "bannieres/index.html", n: "BANNIERES", s: "BANNIERES", ic: "banniere", fam: "3d", lb: "linear-gradient(#9fd4f2, #5a9a3a)", lt: "#fff6e0", sh: "#d0482c", rank: "bannieres",
   d: "Un jeu de conquête en 3D pour les enfants : choisis ta couleur, fais courir tes chevaliers, archers et mages sur les cases, construis et décore ton village autour du château, et regarde les batailles. Des pièces, des cœurs, des étoiles et des mots simples. Après 25 tours, on compte les drapeaux !", tags: ["3D", "POUR LES ENFANTS", "25 TOURS"]},
  {k: "lanterne/index.html", n: "LA DERNIERE LANTERNE", s: "LANTERNE", ic: "lanterne", fam: "32", lb: "linear-gradient(#2e4a34, #0e1a12)", lt: "#ffd27a", sh: "#4a6a3a", demo: true,
   d: "Démo d'un RPG au tour par tour en HD-2D : avec ton équipe, rallume les lanternes qui retiennent la brume. Le prologue et l'acte 1 sont jouables : Clairfond, l'abbaye, le Bois Murmurant et la Crypte des racines, jusqu'au Roi des aulnes. La suite arrive.", tags: ["RPG", "DEMO", "ACTE 1"]},
  {k: "mot-d-or/index.html", n: "LE MOT D'OR", s: "MOT D'OR", ic: "motdor", fam: "32", lb: "linear-gradient(#7a2a20, #2a0e0a)", lt: "#ffd23f", sh: "#b0402c", rank: "motdor",
   d: "Un mot de 6 lettres par jour à trouver en 6 essais, sur un bureau à la lueur de la lampe. Or : bien placée ; argent : mal placée. Le même mot pour toute la famille, et un entraînement pour rejouer.", tags: ["MOTS", "MOT DU JOUR"]},
  {k: "capitaine-du-port/index.html", n: "CAPITAINE DU PORT", s: "CAPITAINE", ic: "remorqueur", fam: "32", lb: "linear-gradient(#2a7c97, #163f66)", lt: "#ffd23f", sh: "#2a7c97", rank: "capitaine",
   d: "Le port est encombré : glisse les bateaux dans leur longueur pour ouvrir la passe au navire doré. 60 bassins en 5 ports (pêche, commerce, marina, chantier naval, grand port), en pixel art 32 bits, et un bassin du jour pour toute la famille.", tags: ["PUZZLE", "60 BASSINS", "DU JOUR"]},
  {k: "romet/index.html", n: "ROMET", s: "ROMET", ic: "romet", fam: "3d", lb: "linear-gradient(#c0281c, #5a1a0e)", lt: "#ffe2a0", sh: "#e2b04a", rank: "romet",
   d: "Un coin pusher en 3D, en hommage à Mynthos : lâche tes pièces, le poussoir fait tomber les autres dans le bac. Six machines à finir, de la foire à l'horloger, chacune avec sa règle (miel, courant, couloirs, clous, deux étages) et ses 6 trésors, et une machine secrète.", tags: ["3D", "7 MACHINES", "6 REGLES"]},
  {k: "magasinier/index.html", n: "LE MAGASINIER", s: "MAGASINIER", ic: "caisse", fam: "3d", lb: "linear-gradient(#f6d39a, #a8683a)", lt: "#3a2414", sh: "#e8963a", rank: "magasinier",
   d: "Pousse les caisses sur les marques, dans un entrepôt baigné de soleil en HD-2D. 60 niveaux en 5 entrepôts, avec de la glace, des tapis roulants et des caisses en fonte, et une grille du jour pour toute la famille.", tags: ["3D", "PUZZLE", "GRILLE DU JOUR"]},
  {k: "nebula/index.html", n: "NEBULA", s: "NEBULA", ic: "img", fam: "32", lb: "radial-gradient(circle at 75% 20%, #3a2a4a, #04060c 70%)", lt: "#f2b24a", sh: "#c07a20", rank: "nebula",
   d: "Mène ta flotte de balise en balise jusqu'à l'amiral pirate. Les pirates annoncent leurs tirs : esquive, riposte, survis.", tags: ["ROGUE-LITE"]},
  {k: "tetris/index.html", n: "TETRIS", s: "TETRIS", ic: "blocks", fam: "rep", lb: "linear-gradient(#3b2a8a, #160f45)", lt: "#facc15", sh: "#6a4ad0", rank: "tetris",
   d: "Empile les pièces, complète des lignes, tiens le plus longtemps possible.", tags: ["NIVEAUX"]},
  {k: "snake/index.html", n: "SNAKE", s: "SNAKE", ic: "snake", fam: "rep", lb: "linear-gradient(#377a28, #1c4214)", lt: "#c4ff7a", sh: "#3fa02a", rank: "snake",
   d: "Mange les pommes sans te mordre la queue ni toucher les bords du jardin.", tags: []},
  {k: "asteroids/index.html", n: "ASTEROIDS", s: "ASTEROIDS", ic: "rock", fam: "rep", lb: "radial-gradient(circle at 70% 30%, #1d2a5a, #05040e 70%)", lt: "#5ce1ff", sh: "#2ab0d0", rank: "asteroids",
   d: "Pilote ton vaisseau et pulvérise les astéroïdes, vague après vague.", tags: ["VAGUES"]},
  {k: "jeu-de-la-vie/index.html", n: "JEU DE LA VIE", s: "JEU DE LA VIE", ic: "glider", fam: "rep", lb: "linear-gradient(#23307e, #0d1450)", lt: "#5cff8a", sh: "#3ad06a",
   d: "L'automate de Conway : dessine des cellules, pose des motifs, regarde-les évoluer.", tags: ["MOTIFS"]},
];
const NEBULA_IMG = "nebula/cartouche.jpg";
const FAMSTYLE = {"16": "A", "32": "C", rep: "B", "3d": "D"};

/* ---------- accueil : dates de sortie et de mise à jour, genres, jeu à la une, quoi de neuf ---------- */
// À TENIR À JOUR : `added` (sortie) et `updated` (dernière mise à jour visible) au format AAAA-MM-JJ, `genres` pour les filtres.
// Une cartouche porte l'étiquette NEUF ou MAJ pendant 3 jours ; le jeu sorti le plus récemment est « à la une ».
const META = {
  "boutique/index.html": {added: "2026-10-23", genres: ["SIMULATION"]},
  "doggy-saga/index.html": {added: "2026-10-23", genres: ["LOGIQUE", "DU JOUR"]},
  "romet/index.html": {added: "2026-10-22", genres: ["ARCADE", "HASARD"]},
  "bannieres/index.html": {added: "2026-10-22", genres: ["TACTIQUE"]},
  "lanterne/index.html": {added: "2026-10-22", genres: ["AVENTURE"]},
  "the-des-jarls/index.html": {added: "2026-10-21", genres: ["TACTIQUE", "HASARD", "DU JOUR"]},
  "duche/index.html": {added: "2026-10-21", genres: ["TACTIQUE", "DU JOUR"]},
  "mot-d-or/index.html": {added: "2026-10-20", genres: ["LOGIQUE", "DU JOUR"]},
  "capitaine-du-port/index.html": {added: "2026-10-20", genres: ["LOGIQUE", "DU JOUR"]},
  "magasinier/index.html": {added: "2026-10-20", genres: ["LOGIQUE", "DU JOUR"]},
  "yams/index.html": {added: "2026-10-17", genres: ["HASARD"]},
  "escadrille/index.html": {added: "2026-10-17", updated: "2026-10-19", genres: ["TACTIQUE"]},
  "amiral/index.html": {updated: "2026-10-19", genres: ["TACTIQUE", "DU JOUR"]},
  "odyssee/index.html": {added: "2026-10-17", genres: ["ADRESSE", "DU JOUR"]},
  "empilage/index.html": {added: "2026-10-16", genres: ["ADRESSE", "DU JOUR"]},
  "calculator/index.html": {added: "2026-10-16", genres: ["CALCUL", "DU JOUR"]},
  "lune-rover/index.html": {added: "2026-10-16", genres: ["LOGIQUE", "ESPACE"]},
  "sudoku/index.html": {added: "2026-10-16", genres: ["LOGIQUE", "DU JOUR"]},
  "nebula/index.html": {added: "2026-10-13", updated: "2026-10-15", genres: ["TACTIQUE", "ESPACE"]},
  "alunissage/index.html": {added: "2026-10-13", updated: "2026-10-15", genres: ["ADRESSE", "ESPACE", "DU JOUR"]},
  "pont-stellaire/index.html": {added: "2026-10-12", updated: "2026-10-15", genres: ["LOGIQUE", "ESPACE", "DU JOUR"]},
  "orbite/index.html": {added: "2026-10-12", genres: ["ADRESSE", "ESPACE"]},
  "club/index.html": {added: "2026-10-12", genres: ["GESTION", "CHIENS"]},
  "picross/index.html": {genres: ["LOGIQUE"]},
  "lignee/index.html": {genres: ["LOGIQUE", "DU JOUR"]},
  "queens/index.html": {updated: "2026-10-15", genres: ["LOGIQUE", "DU JOUR"]},
  "injagility/index.html": {genres: ["ADRESSE", "CHIENS"]},
  "solitaire/index.html": {genres: ["CARTES"]},
  "touche-coule/index.html": {genres: ["TACTIQUE"]},
  "tetris/index.html": {genres: ["ARCADE"]},
  "snake/index.html": {genres: ["ARCADE"]},
  "asteroids/index.html": {genres: ["ARCADE", "ESPACE"]},
  "jeu-de-la-vie/index.html": {genres: ["SIMULATION"]},
};
const NEWS = [
  ["2026-10-23", "Nouveau jeu : La Boutique de cartes, une année à la tête d'une boutique de cartes à collectionner, en 3D. Le lundi, commande au grossiste, fixe tes prix, ouvre des boosters et range les meilleures cartes en vitrine ou dans ton classeur ; du mardi au samedi, regarde les clients entrer et acheter ; le dimanche, fais tes comptes. Aménage, agrandis, organise des tournois et rembourse la banque avant la semaine 26 !"],
  ["2026-10-23", "Nouveau jeu : Doggy Saga, un trois en ligne pour toute la famille. Glisse les chiens du refuge pour en aligner 3 pareils : chaque chien aligné reçoit un câlin. Bandanas, nœuds et balles de tennis lancent de grosses cascades. Lave la boue, ouvre les niches, fais descendre les chiots jusqu'à leur panier, et trouve une famille aux 16 chiens (dont Nounours le bouvier bernois) dans 60 niveaux. Chaque jour, la journée du jour : 20 coups, le plus de câlins possible."],
  ["2026-10-22", "Nouveau jeu : Romet, un coin pusher en 3D en hommage à Mynthos. Lâche tes pièces, le poussoir fait tomber les autres dans le bac : ce qui tombe se rejoue, jusqu'à ce que la bourse soit vide. Gagne les 6 trésors de chaque machine pour ouvrir la suivante : la foire, la ruche et son miel, l'épave et son courant, le casino et ses couloirs, la foire de nuit et ses clous, l'horloger à deux étages… et une machine secrète."],
  ["2026-10-22", "Nouveau jeu : Bannières, un jeu de conquête en 3D pensé pour les enfants. Choisis ta couleur, fais courir tes armées de chevaliers, d'archers, de lanciers et de mages sur la carte, achète des guerriers au château, construis, agrandis et décore ton village, et regarde les batailles avec les cœurs au-dessus des guerriers. Des étoiles disent si une bataille est facile. Prends les 3 châteaux des autres seigneurs, ou aie le plus de drapeaux après 25 tours !"],
  ["2026-10-22", "Démo : La Dernière Lanterne, un RPG au tour par tour en HD-2D. Avec ton équipe (lame, clerc, arcaniste), traverse Clairfond, l'abbaye et le Bois Murmurant, rallume les lanternes oubliées et descends dans la Crypte des racines affronter le Roi des aulnes. Le prologue et l'acte 1 sont jouables, la suite arrive."],
  ["2026-10-21", "Nouveau jeu : Le Thé des Jarls, un duel de dés viking. Six dés, trois lancers, et chaque face envoie ton armée de 45 soldats à l'assaut : charge des haches, volée de flèches, éclaireurs qui volent les jetons. Invoque les faveurs de 20 dieux nordiques, apprends avec Sigrid la skalde, remonte la route du fjord de taverne en taverne (étoiles, couleurs, unités à gagner), joue à deux sur le même téléphone posé à plat, et tente le défi du jour."],
  ["2026-10-21", "Nouveau jeu : Duché, un petit 4X au tour par tour sur 37 terres hexagonales. Bâtis, recrute, prends les terres des trois seigneurs rivaux et gagne la couronne quand le vieux roi meurt : un grand électeur vote un tour sur deux. Combats en scènes HD-2D, événements illustrés, partie libre (facile ou normal) et un Duché du jour pour toute la famille, une seule tentative classée."],
  ["2026-10-20", "Nouveau jeu : Le Mot d'or, un mot de 6 lettres par jour à trouver en 6 essais. Les tuiles se retournent en or (bien placée), en argent (mal placée) ou en gris (absente). Le même mot pour toute la famille, une seule tentative classée, une série de jours à faire durer, et un entraînement pour rejouer autant qu'on veut."],
  ["2026-10-20", "Nouveau jeu : Capitaine du port, un casse-tête de bateaux en pixel art 32 bits. Glisse les bateaux du bassin pour ouvrir la passe au navire doré, dans 60 bassins et 5 ports (bouées, épaves, grands navires de 4 cases, grand port en 7 × 7), et tente le bassin du jour : une seule tentative classée, au plus petit nombre de coups."],
  ["2026-10-20", "Nouveau jeu : Le Magasinier, un Sokoban en HD-2D façon Octopath Traveler. Pousse les caisses sur les marques dans 60 niveaux et 5 entrepôts (glace, tapis roulants, caisses en fonte), et tente la grille du jour : une seule tentative classée, au plus petit nombre de coups."],
  ["2026-10-19", "Accueil retouché : le nom de chaque jeu sous sa cartouche, une légende des marques sous le gardien, le jeu à la une en bandeau, un volet plus léger (titre qui reste en haut, JOUER dans sa barre, le classement se rejoint en bas de l'accueil)."],
  ["2026-10-19", "Escadrille ! : choisis tes avions au hangar (onglet AVIONS). Six nouveaux avions à débloquer, dans les quatre familles : le bombardier d'attaque et ses roquettes, le ravitailleur qui remet un avion à neuf, l'avion de patrouille qui compte une ligne et une colonne, le brouilleur et ses leurres, les ballons de barrage et leur DCA, le drone et sa caméra. Les pirates s'en servent aussi en Pilote et en As."],
  ["2026-10-19", "Amiral ! : trois navires à débloquer au chantier naval (le mouilleur et ses mines qui ripostent, le brouilleur et son écran de fumée, la vedette et son faux navire gonflable) et la bataille du jour, avec ses flottes imposées et son classement."],
  ["2026-10-17", "Défi du jour : un rond jaune sur la cartouche quand il reste à jouer, un rond sombre avec ✓ quand c'est fait (Queens, Sudoku, Pont stellaire, Lignée, Alunissage, Nebula, Calculator, Empilage, Odyssée)."],
  ["2026-10-17", "Nouveau jeu : Yams, le troisième jeu en 3D. De vrais dés qui roulent et rebondissent, lancés d'un geste ou secoués dans un gobelet, la feuille de marque classique en 13 cases, et six styles de dés à débloquer (taverne, casino de nuit, gros pixels rétro, sur la Lune…)."],
  ["2026-10-17", "Escadrille ! : le hangar et trois escadrilles à débloquer (Furtif, Hélices, Canonnière), un sol différent à chaque partie, et les pilotes abattus sautent en parachute."],
  ["2026-10-17", "Nouveau jeu : Escadrille !, la petite sœur d'Amiral ! dans le ciel. Quatre avions à pouvoirs (radar, bombes en croix, missile, esquive de l'hélicoptère) sur un ciel de 9 × 9, contre une escadrille pirate cachée dans les nuages. Trois niveaux : Recrue, Pilote, As."],
  ["2026-10-17", "Nouveau jeu : Odyssée, le deuxième jeu en 3D. Penche le téléphone (ou glisse le doigt) pour ramener la galère d'Ulysse de Troie à Ithaque : 10 épisodes de 3 plateaux, de Polyphème aux Sirènes en passant par Charybde et Scylla, et un plateau du jour pour toute la famille."],
  ["2026-10-16", "Accueil : les jeux en 3D ont leur propre cartouche, un CD dans un boîtier translucide couleur bonbon. Empilage est le premier à l'avoir."],
  ["2026-10-16", "Nouveau jeu : Empilage, le premier jeu en 3D de la Ludothèque. Touche pour lâcher chaque bloc pile sur la tour ; ce qui dépasse tombe. Le ciel passe du matin à la nuit étoilée à mesure que tu montes. Tour du jour : les mêmes vitesses pour toute la famille."],
  ["2026-10-16", "Nouveau jeu : Calculator, le calcul mental de 7 à 77 ans. Choisis tes opérations et ton niveau (de Petit écolier à Champion), joue une série de 20, 60 secondes contre la montre ou le calcul du jour. Trois styles au choix : arcade, cahier d'écolier ou calculatrice de poche."],
  ["2026-10-16", "Nouveau jeu : Lune-Rover. Programme Pico, le petit robot lunaire, à l'avance pour ramasser les cristaux : 30 niveaux, avec sauts, fonction F1, répétitions, boucles et conditions."],
  ["2026-10-16", "Classements : le même compte sur plusieurs navigateurs. Sous les cartouches, CODE DE MON COMPTE ; dans l'autre navigateur, REJOINDRE LE CLASSEMENT puis J'AI DEJA UN COMPTE. Les sauvegardes restent dans chaque navigateur."],
  ["2026-10-16", "Nouvel accueil : les cartouches en 3D sur leurs planches (16 bits, 32 bits et reprises). Touche une cartouche : sa boîte, tes records et le classement de la famille, au même endroit. La page des classements disparaît."],
  ["2026-10-16", "Nouveau jeu : Sudoku, le jardin des chiffres. Grilles 4×4 et 6×6 pour débuter, 9×9 facile, moyen ou difficile, notes au crayon et grille du jour pour toute la famille."],
  ["2026-10-15", "Accueil : filtre EN COURS pour retrouver les parties commencées, et sur chaque cartouche ta partie en cours et ton record."],
  ["2026-10-15", "Défis du jour : dans Queens, Pont stellaire et Alunissage, seule la première tentative du jour est classée (la partie en cours se reprend au même temps)."],
  ["2026-10-15", "Queens : la grille du jour, la même pour toute la famille, de 5×5 le lundi à 9×9 le week-end, avec son classement."],
  ["2026-10-15", "Alunissage : nouveaux graphismes, avec la lumière du soleil et les ombres, un décor par monde, un module plus détaillé, l'astronaute et son drapeau, l'explosion et son cratère."],
  ["2026-10-15", "Alunissage : des cadrans près du module (réticule qui passe au vert, carburant, vitesses, aire survolée, flèche de dérive et hauteur jusqu'au sol)."],
  ["2026-10-15", "Accueil : bouton SURPRENDS-MOI (un jeu au hasard), tri des cartouches et recherche. Classements : la nouvelle étagère de boîtes de jeu, avec une couronne sur tes records."],
  ["2026-10-15", "Nebula : nouveaux sons, armes étouffées, saut en hyperespace, musique de combat et marche sur la carte (réglage AMBIANCE)."],
  ["2026-10-15", "Nebula : quatre nouveaux vaisseaux, le brouilleur et le mouilleur de mines dans ta flotte, la frégate-bouclier et le poseur de mines chez les pirates."],
  ["2026-10-15", "Nebula : la partie du jour devient la mission du jour, avec chaque jour une flotte et une règle imposées (convoi à protéger, comptoirs fermés, carburant compté…)."],
  ["2026-10-15", "Nebula : un contrat à choisir au départ de chaque partie et un défi dans chaque combat, pour gagner points, données et crédits."],
  ["2026-10-15", "Nebula : compose ta flotte de départ avec 10 points (prime d'audace pour les points non dépensés) ; la flotte arrive en combat par le bas de l'écran."],
  ["2026-10-15", "La Ludothèque s'ouvre plus vite sur un réseau lent ; Nebula marche hors connexion dès la première visite et ménage la batterie."],
  ["2026-10-15", "Nebula : nouveaux bruitages (grappin, ions, salve, renforts), nappe d'ambiance en option, saut et débris animés."],
  ["2026-10-15", "Nebula : un doigt posé ouvre la fiche d'un vaisseau ou d'une balise, animations ×2, vibrations, confirmation de fin de tour."],
  ["2026-10-14", "Nebula : un entraînement guidé en 5 étapes, et au hangar l'effet de chaque pilote sur chaque vaisseau."],
  ["2026-10-14", "Nebula : un manuel complet (règles, fiches des vaisseaux et des pirates, terrain, balises, modules, pilotes)."],
  ["2026-10-14", "Nebula : la partie du jour (la même pour toute la famille) et les classements du jour et des victoires."],
  ["2026-10-14", "Nebula : déblocages avec les données stellaires, flottes de choc et marchande."],
  ["2026-10-14", "Nebula : épaves à choix, nébuleuses et pilotes (As, Mécano, Tireur, Prudent, Vétéran)."],
  ["2026-10-14", "Nebula : les secteurs 2 et 3, leurs nuages ioniques, la Veuve d'Orphée, la Rouille-Reine et la victoire finale."],
  ["2026-10-14", "Nebula : placement des vaisseaux au doigt plus sûr (aperçu, replacement), 5 nouveaux vaisseaux au comptoir et le harponneur pirate."],
  ["2026-10-14", "Nebula : capacités affichées sur les fiches, légende de la carte, drones au toucher, pirates plus rusés dans les contacts lourds."],
  ["2026-10-13", "Accueil : favoris (étoile), filtres en menu de RPG avec le gardien, jeu à la une et badges des nouveautés."],
  ["2026-10-13", "Nebula : nouveau rogue-lite tactique spatial, secteur 1 jusqu'à l'amiral rouillé. Plus fluide et plus net."],
  ["2026-10-13", "Alunissage : nouveau jeu d'adresse, avec la mission du jour."],
  ["2026-10-12", "Pont stellaire : nouveau puzzle de constellations, avec le ciel du jour."],
  ["2026-10-12", "Orbite : nouveau jeu de physique spatiale en 30 niveaux."],
  ["2026-10-12", "Le Club d'agility : nouveau jeu de gestion de club canin."],
];
// filtres de l'accueil (choix de l'utilisateur : peu de filtres) ; les genres de META restent prêts pour plus tard
const FILTERS = ["TOUS", "★ FAVORIS", "NOUVEAU", "DU JOUR", "EN COURS"];
const daysSince = d => d ? (Date.now() - new Date(d + "T00:00:00").getTime()) / 864e5 : 1e9;
const recent = d => daysSince(d) < 3;
const fmtDay = d => { const [y, m, j] = d.split("-"); return `${j}/${m}`; };
const metaOf = g => META[g.k] || {genres: []};
const favKey = "ludo.favs";
let favs = []; try { favs = JSON.parse(localStorage.getItem(favKey)) || []; } catch (e) {}
const isFav = g => favs.includes(g.k);

/* ---------- parties en cours et records, lus dans les sauvegardes de chaque jeu (sans toucher aux jeux) ---------- */
const rk = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const dayNum = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const mmss = ms => { const t = Math.floor(ms / 1000); return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };
const sum = o => Object.values(o || {}).reduce((a, v) => a + (Number(v) || 0), 0);
const count = o => Object.keys(o || {}).length;
const nf = v => String(Math.round(Number(v) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const num = (v, unit) => Number(v) > 0 ? nf(v) + (unit ? " " + unit : "") : null;
// ce qui attend d'être repris (null si rien)
const PROGRESS = {
  "romet/index.html": () => { const p = rk("romet.partie", {}) || {}, ids = Object.keys(p).filter(k => p[k] && !p[k].fini); return ids.length ? (ids.length > 1 ? ids.length + " PARTIES" : "PARTIE EN COURS") : null; },
  "the-des-jarls/index.html": () => { const d = rk("jarls.dailyRun", null), r = rk("jarls.run", null); return d && d.E && d.E.graine === dayNum() ? "DEFI DU JOUR" : r && r.E ? `MANCHE ${r.E.manche}` : null; },
  "duche/index.html": () => { const d = rk("duche.dailyRun", null), r = rk("duche.run", null); return d && d.graine === dayNum() ? "DUCHE DU JOUR" : r && r.tour ? `TOUR ${r.tour}/30` : null; },
  "boutique/index.html": () => { const r = rk("boutique.run", null); return r && r.semaine && !r.fin ? `SEMAINE ${r.semaine}/52` : null; },
  "bannieres/index.html": () => { const r = rk("bannieres.run", null); return r && r.tour && !r.fin ? `TOUR ${Math.min(r.tour, 25)}/25` : null; },
  "mot-d-or/index.html": () => { const j = rk("motdor.jour", null); return j && j.j === dayNum() && !j.fini && (j.rows || []).length ? "MOT DU JOUR" : null; },
  "capitaine-du-port/index.html": () => { const d = rk("capitaine.dailyRun", null), p = rk("capitaine.partie", null);
    return d && d.j === dayNum() ? "BASSIN DU JOUR" : p && p.coups ? "BASSIN " + (p.n + 1) : null; },
  "magasinier/index.html": () => { const d = rk("magasinier.dailyRun", null), p = rk("magasinier.partie", null);
    return d && d.j === dayNum() ? "GRILLE DU JOUR" : p && p.chemin ? "NIVEAU " + (p.n + 1) : null; },
  "yams/index.html": () => { const p = rk("yams.partie", null); return p && p.tour < 13 ? `TOUR ${p.tour + 1}/13` : null; },
  "nebula/index.html": () => { const r = rk("nebula.run", null); return r && r.phase !== "end" && !r.training ? `SECTEUR ${r.sector || 1}` : null; },
  "club/index.html": () => { const g = rk("club.save", null); return g && g.week > 1 ? `SEMAINE ${g.week}` : null; },
  "queens/index.html": () => { const r = rk("queens16.dailyRun", null); return r && r.day === dayNum() ? "GRILLE DU JOUR" : null; },
  "sudoku/index.html": () => { const d = rk("sudoku.dailyRun", null), g = rk("sudoku.game", null);
    return d && d.day === dayNum() ? "GRILLE DU JOUR" : g && !g.daily ? "UNE GRILLE" : null; },
  "pont-stellaire/index.html": () => { const d = rk("pontstellaire.dailyRun", null), g = rk("pontstellaire.game", null);
    return d && d.day === dayNum() ? "CIEL DU JOUR" : g && !g.daily ? "UN CIEL" : null; },
  "lignee/index.html": () => { const today = dayNum().toString(36).toUpperCase(), cd = rk("lignee.curDaily", null), c = rk("lignee.cur", null);
    return cd && cd.lives !== 0 && String(cd.code).endsWith("-J" + today) ? "ARBRE DU JOUR" : c && c.lives !== 0 ? "UN ARBRE" : null; },
  "picross/index.html": () => { const n = count(rk("picrossdex.progress", {})); return n ? `${n} GRILLE${n > 1 ? "S" : ""}` : null; },
  "solitaire/index.html": () => { const g = rk("solitaire16.game", null); return g && g.started && !g.won ? "UNE DONNE" : null; },
};
// défi du jour : null = pas de défi du jour, false = à faire, true = joué (puzzles : réussi ; missions : tentative commencée)
const TODAY = {
  "doggy-saga/index.html": () => rk("doggysaga.dailyTry", 0) === dayNum() || (rk("doggysaga.daily", {}) || {})[dayNum()] !== undefined,
  "the-des-jarls/index.html": () => { const t = rk("jarls.dailyTry", null); return !!(t && t.j === dayNum()); },
  "duche/index.html": () => { const t = rk("duche.dailyTry", null); return !!(t && t.j === dayNum()); },
  "mot-d-or/index.html": () => { const j = rk("motdor.jour", null); return !!(j && j.j === dayNum() && j.fini); },
  "capitaine-du-port/index.html": () => !!(rk("capitaine.daily", {}) || {})[dayNum()],
  "queens/index.html": () => !!(rk("queens16.daily", {}) || {})[dayNum()],
  "sudoku/index.html": () => !!(rk("sudoku.daily", {}) || {})[dayNum()],
  "pont-stellaire/index.html": () => !!(rk("pontstellaire.daily", {}) || {})[dayNum()],
  "lignee/index.html": () => { const j = "-J" + dayNum().toString(36).toUpperCase(); return Object.keys(rk("lignee.daily", {}) || {}).some(c => c.endsWith(j)); },
  "alunissage/index.html": () => rk("alunissage.dailyTry", 0) === dayNum(),
  "nebula/index.html": () => rk("nebula.dailyTry", 0) === dayNum(),
  "calculator/index.html": () => rk("calculator.dailyTry", 0) === dayNum(),
  "empilage/index.html": () => rk("empilage.dailyTry", 0) === dayNum(),
  "odyssee/index.html": () => rk("odyssee.dailyTry", 0) === dayNum(),
  "magasinier/index.html": () => !!(rk("magasinier.daily", {}) || {})[dayNum()],
  "amiral/index.html": () => rk("amiral.dailyTry", 0) === dayNum(),
};
const dailyState = g => { try { return TODAY[g.k] ? TODAY[g.k]() : null; } catch (e) { return null; } };
const inProgress = g => { try { return (PROGRESS[g.k] || (() => null))(); } catch (e) { return null; } };
// mes records sur ce téléphone, pour le volet : [libellé, valeur] (les lignes sans valeur sont cachées)
const LEVELS = ["FACILE", "MOYEN", "DIFFICILE", "EXPERT"];
const RECS = {
  "doggy-saga/index.html": () => { const p = rk("doggysaga.progres", {}) || {}, e = p.etoiles || {}, d = rk("doggysaga.daily", {}) || {};
    return [["Étoiles", num(Object.values(e).reduce((a, v) => a + (Number(v) || 0), 0), "/ 180")], ["Niveaux réussis", num(count(e), "/ 60")], ["Chiens adoptés", num((p.album || []).length, "/ 16")],
      ["Meilleure journée", num(Math.max(0, ...Object.values(d).map(Number).filter(v => v >= 0)), "câlins")]]; },
  "romet/index.html": () => { const m = rk("romet.machines", {}) || {}, v = Object.values(m).filter(x => x && typeof x === "object");
    const t = v.reduce((a, x) => a + (Array.isArray(x.t) ? x.t.filter(Boolean).length : 0), 0), f = v.filter(x => Array.isArray(x.t) && x.t.length && x.t.every(Boolean)).length;
    return [["Trésors", num(t, "/ 42")], ["Machines terminées", num(f, "/ 7")], ["Meilleur butin", num(v.reduce((a, x) => Math.max(a, Number(x.butin) || 0), 0), "pièces")]]; },
  "the-des-jarls/index.html": () => { const e = (rk("jarls.campagne", {}) || {}).etoiles || {}, v = Object.values(e).map(Number).filter(x => x > 0);
    return [["Étoiles de la campagne", num(v.reduce((a, b) => a + b, 0), "/ 60")], ["Dieux battus", num(v.length, "/ 20")], ["Défis du jour", num(count(rk("jarls.daily", {})))]]; },
  "duche/index.html": () => [["Meilleur score (normal)", num(rk("duche.best", 0), "pts")], ["Duchés du jour", num(count(rk("duche.daily", {})))]],
  "boutique/index.html": () => { const s = rk("boutique.stats", {}) || {}; return [["Meilleure boutique", num(rk("boutique.best", 0), "pts")], ["Années finies", num(s.finies)], ["Parties", num(s.parties)]]; },
  "bannieres/index.html": () => { const s = rk("bannieres.stats", {}) || {}; return [["Le plus de drapeaux", num(rk("bannieres.best", 0), "drapeaux")], ["Parties gagnées", num(s.gagnees)], ["Parties", num(s.parties)]]; },
  "mot-d-or/index.html": () => { const s = rk("motdor.stats", {}) || {};
    return [["Mots du jour trouvés", num(s.gagnees)], ["Meilleure série", num(s.record, s.record > 1 ? "jours" : "jour")], ["Parties", num(s.parties)]]; },
  "capitaine-du-port/index.html": () => { const f = rk("capitaine.niveaux", {}) || {}, n = Object.values(f).reduce((a, v) => a + (Number(v && v.etoiles) || 0), 0);
    return [["Étoiles", n ? n + " / 180" : null], ["Bassins réussis", num(count(f))], ["Bassins du jour", num(count(rk("capitaine.daily", {})))]]; },
  "tetris/index.html": () => [["Meilleur score", num(rk("tetris16.best", 0))]],
  "snake/index.html": () => [["Meilleur score", num(rk("snakeBestScore", 0))]],
  "asteroids/index.html": () => [["Meilleur score", num(rk("asteroids16.best", 0))]],
  "solitaire/index.html": () => [["Meilleur score", num(rk("solitaire16.best", 0))]],
  "injagility/index.html": () => { const p = rk("injagility.parcours", {}) || {};
    return [["Infini", num(rk("injagility.best", 0), "obstacles")], ["Parcours réussis", num((p.unlocked || 1) - 1)], ["Parcours : total", num(sum(p.best), "pts")]]; },
  "queens/index.html": () => { const b = rk("queens16.best", {}) || {};
    return Object.keys(b).filter(n => /^[5-9]$/.test(n) && b[n] > 0).sort().map(n => [`${n}×${n}`, mmss(b[n])]).concat([["Grilles du jour", num(count(rk("queens16.daily", {})))]]); },
  "picross/index.html": () => { const cap = rk("picrossdex.captured", {}) || {}, n = Object.keys(cap).filter(id => cap[id] && !cap[id].test && id !== "pokeball").length;
    return [["Pokémon capturés", num(n)], ["Grilles commencées", num(count(rk("picrossdex.progress", {})))]]; },
  "lignee/index.html": () => { const s = rk("lignee.stats", {}) || {}, out = [["Arbres reconstitués", num(Object.values(s).reduce((a, v) => a + (v && v.n || 0), 0))]];
    for (const m of ["C", "R"]) LEVELS.forEach((l, i) => { const v = s[m + (i + 1)]; if (v && v.best > 0) out.push([`${m === "R" ? "Royal" : "Classique"} ${l.toLowerCase()}`, mmss(v.best)]); });
    return out.concat([["Arbres du jour", num(count(rk("lignee.daily", {})))]]); },
  "touche-coule/index.html": () => { const b = rk("touchecoule.best", {}) || {}, ai = {easy: "facile", normal: "normale", hard: "amiral"};
    return Object.keys(b).filter(k => b[k] > 0).sort().map(k => { const [m, a] = k.split(":"); return [`${m === "arsenal" ? "Arsenal" : "Classique"} · IA ${ai[a] || a}`, num(b[k], "tirs")]; }); },
  "amiral/index.html": () => { const b = rk("amiral.best", {}) || {}, p = rk("amiral.palmares", {}) || {};
    const nav = 8 + (p.normal > 0) + (p.hard > 0) + (p.victoires >= 10);
    return [["easy", "Mousse"], ["normal", "Capitaine"], ["hard", "Amiral"]].map(([k, l]) => [l, num(b[k], "tours")])
      .concat([["Victoires", num(p.victoires)], ["Navires au chantier", nav + " / 11"], ["Batailles du jour", num(count(rk("amiral.daily", {})))]]); },
  "escadrille/index.html": () => { const b = rk("escadrille.best", {}) || {}; return [["easy", "Recrue"], ["normal", "Pilote"], ["hard", "As"]].map(([k, l]) => [l, num(b[k], "tours")]).concat([["Victoires", num(rk("escadrille.victoires", 0), "")], ["Escadrilles", `${Math.max(1, (rk("escadrille.skins", ["a"]) || ["a"]).length)}/4`],
    // avions débloqués au hangar (mêmes conditions que escadrille/jeu.js : PLANES[..].need)
    ["Avions", (() => { const v = Number(rk("escadrille.victoires", 0)) || 0, p = rk("escadrille.palmares", {}) || {}, rap = p.rapide || Object.values(b).some(x => x > 0 && x < 25), as = Math.max(Number(p.hard) || 0, b.hard ? 1 : 0);
      return `${4 + (v >= 2) + (v >= 4) + (v >= 6) + !!rap + !!p.intacte + (as >= 2)}/10`; })()]]); },
  "club/index.html": () => { const g = rk("club.save", null) || {};
    return [["Réputation", num(Math.max(g.rep || 0, g.bestRep || 0))], ["Champion de France en", num(g.champion, "semaines")], ["Partie en cours", g.week > 1 ? "semaine " + g.week : null]]; },
  "magasinier/index.html": () => { const f = rk("magasinier.niveaux", {}) || {}, n = Object.values(f).reduce((a, v) => a + (Number(v && v.etoiles) || 0), 0);
    return [["Étoiles", n ? n + " / 180" : null], ["Niveaux réussis", num(count(f))], ["Grilles du jour", num(count(rk("magasinier.daily", {})))]]; },
  "lune-rover/index.html": () => { const s = rk("lunerover.stars", {}) || {}, n = sum(s); return [["Étoiles", n ? n + " / 90" : null], ["Niveaux réussis", num(Object.values(s).filter(v => v > 0).length)]]; },
  "odyssee/index.html": () => { const s = rk("odyssee.stars", {}) || {}, n = sum(s); return [["Étoiles", n ? n + " / 90" : null], ["Plateaux réussis", num(Object.values(s).filter(v => v > 0).length)], ["Plateaux du jour", num(count(rk("odyssee.daily", {})))]]; },
  "orbite/index.html": () => { const s = rk("orbite.stars", {}) || {}, n = sum(s); return [["Étoiles", n ? n + " / 90" : null], ["Niveaux réussis", num(Object.values(s).filter(v => v > 0).length)]]; },
  "alunissage/index.html": () => [["Meilleure mission", num(rk("alunissage.best", 0), "pts")], ["Sites atteints", num(rk("alunissage.sites", 0))], ["Missions du jour", num(count(rk("alunissage.daily", {})))]],
  "pont-stellaire/index.html": () => { const b = rk("pontstellaire.best", {}) || {};
    return ["7", "9", "11"].map(n => [`${n}×${n}`, b[n] > 0 ? mmss(b[n]) : null]).concat([["Constellations", num(rk("pontstellaire.wins", 0))]]); },
  "sudoku/index.html": () => { const b = rk("sudoku.best", {}) || {};
    return [["4", "4×4"], ["6", "6×6"], ["9-1", "9×9 facile"], ["9-2", "9×9 moyen"], ["9-3", "9×9 difficile"]].map(([k, l]) => [l, b[k] > 0 ? mmss(b[k]) : null]).concat([["Grilles terminées", num(rk("sudoku.wins", 0))]]); },
  "calculator/index.html": () => { const b = rk("calculator.best", {}) || {}, out = [], nm = {add: "+", sub: "−", mul: "×", div: "÷", mix: "mélange"};
    for (const k of Object.keys(b).sort()){ const [m, l, c] = k.split(":"); if (m === "serie" && b[k] > 0) out.push([`Série de 20 · niv. ${l} · ${nm[c] || c}`, mmss(b[k])]); }
    for (const k of Object.keys(b).sort()){ const [m, l, c] = k.split(":"); if (m === "chrono" && b[k] > 0) out.push([`60 s · niv. ${l} · ${nm[c] || c}`, num(b[k], "bonnes")]); }
    return out.slice(0, 8).concat([["Calculs du jour", num(count(rk("calculator.daily", {})))], ["Parties jouées", num(rk("calculator.parties", 0))]]); },
  "yams/index.html": () => [["Meilleur score", num(rk("yams.best", 0), "pts")], ["Yams inscrits", num(rk("yams.nbYams", 0))], ["Parties jouées", num(rk("yams.parties", 0))]],
  "empilage/index.html": () => [["Plus haute tour", num(rk("empilage.best", 0), "blocs")], ["Tours du jour", num(count(rk("empilage.daily", {})))], ["Parties jouées", num(rk("empilage.parties", 0))]],
  "nebula/index.html": () => { const m = rk("nebula.meta", {}) || {}; return [["Meilleur score", num(rk("nebula.best", 0), "pts")], ["Victoires", num(m.wins)], ["Parties jouées", num(m.games)]]; },
};
const myRecords = g => { try { return (RECS[g.k] || (() => []))().filter(r => r[1]); } catch (e) { return []; } };
const NICE = {"nebula/index.html": "Nebula", "club/index.html": "le Club", "queens/index.html": "Queens", "pont-stellaire/index.html": "Pont stellaire", "sudoku/index.html": "le Sudoku",
  "lignee/index.html": "Lignée", "picross/index.html": "Picross Dex", "solitaire/index.html": "le Solitaire"};

/* ---------- les cartouches ---------- */
// l'image d'un jeu : icône 16×16 (le chien est plus large), ou la capture de Nebula
function art(g){
  if (g.ic === "img"){ const i = new Image(); i.src = ROOT + NEBULA_IMG; i.alt = ""; return i; }
  const c = document.createElement("canvas");
  if (g.ic === "dog"){ c.width = 78; c.height = 54; c.className = "wide"; } else c.width = c.height = 16;
  LudoIcons.draw(c, g.ic);
  return c;
}
// une cartouche en 3D : six faces ; la face avant change selon la famille
function cart(g, i){
  const st = FAMSTYLE[g.fam], b = el("button", "c3 s" + st);
  b.type = "button"; b.dataset.k = g.k;
  b.style.cssText = `--i:${i}; --lb:${g.lb}; --lt:${g.lt}; --sh:${g.sh}`;
  const body = el("div", "body"), front = el("div", "f front"), lab = el("div", "lab");
  if (st === "A"){ lab.append(art(g), el("b", "", g.s)); front.append(el("i", "rid"), lab, el("i", "notch")); }
  else if (st === "B"){ body.append(el("div", "f pcb")); lab.append(art(g), el("b", "", g.s)); front.append(el("span", "emb", "LUDO"), lab, el("span", "arw", "▼")); }
  else if (st === "D"){ lab.append(art(g), el("b", "", g.s)); front.append(el("i", "disc"), el("i", "spine"), lab, el("span", "tag3d", "3D")); }
  else { lab.append(art(g)); front.append(lab, el("div", "ttl chrome", g.s), el("i", "grip")); }
  ["back", "left", "right", "top", "bottom"].forEach(f => body.append(el("div", "f " + f)));
  body.append(front); b.append(body, el("b", "nm", g.n));   // le nom, sous la cartouche, sur la planche
  return b;
}
function spin(b){
  b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
  b.querySelector(".body").addEventListener("animationend", () => b.classList.remove("spin"), {once: true});
}
const rack = $("rack"), order = new Map(GAMES.map((g, i) => [g, i]));
let crownSet = new Set();
GAMES.forEach((g, i) => {
  g.el = cart(g, i);
  let timer = 0;
  g.el.addEventListener("click", () => { clearTimeout(timer); if (still()) return openVolet(g); spin(g.el); timer = setTimeout(() => openVolet(g), 480); });
  g.el.addEventListener("focus", () => select(carts.indexOf(g)));
  rack.appendChild(g.el);
});
// étiquettes posées sur la cartouche : NEUF, EN COURS ou MAJ, étoile des favoris, couronne d'un record de la famille
function paintMarks(){
  GAMES.forEach(g => {
    g.el.querySelectorAll(".stk, .fv, .crown, .dj").forEach(e => e.remove());
    const m = metaOf(g), cur = inProgress(g);
    const st = g.demo ? ["DEMO", "demo"] : recent(m.added) ? ["NEUF", ""] : cur ? ["EN COURS", "cours"] : recent(m.updated) ? ["MAJ", "maj"] : null;
    if (st) g.el.append(el("span", "stk " + st[1], st[0]));
    const dj = dailyState(g);
    if (dj !== null) g.el.append(el("i", "dj" + (dj ? " fait" : ""), dj ? "✓" : ""));
    if (isFav(g)) g.el.append(el("i", "fv", "★"));
    if (crownSet.has(g.k)) g.el.append(el("i", "crown", "♛"));
    g.el.setAttribute("aria-label", g.n + (cur ? ", en cours : " + cur.toLowerCase() : "") + (dj === null ? "" : dj ? ", défi du jour fait" : ", défi du jour à faire") + (isFav(g) ? ", favori" : "") + (crownSet.has(g.k) ? ", tu détiens un record" : ""));
  });
}

/* ---------- filtres, recherche, tri, le gardien ---------- */
let filter = "TOUS"; try { filter = sessionStorage.getItem("ludo.filter") || "TOUS"; } catch (e) {}
if (!FILTERS.includes(filter)) filter = "TOUS";
const fbar = $("filters");
const setFilter = f => { filter = f; try { sessionStorage.setItem("ludo.filter", f); } catch (e) {} arrange(); };
FILTERS.forEach(f => { const b = el("button", "", f.replace("★ ", "").replace("NOUVEAU", "NEUF")); b.type = "button"; b.dataset.f = f; b.addEventListener("click", () => setFilter(f)); fbar.appendChild(b); });
fbar.addEventListener("keydown", e => {
  const d = {ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1}[e.key]; if (!d) return;
  e.preventDefault(); e.stopPropagation(); const f = FILTERS[(FILTERS.indexOf(filter) + d + FILTERS.length) % FILTERS.length];
  setFilter(f); [...fbar.children].find(b => b.dataset.f === f).focus();
});
// recherche : dans le nom, la description, les étiquettes et les genres, sans tenir compte des accents
const plain = t => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
GAMES.forEach(g => { g.txt = plain([g.n, g.d, ...g.tags, ...(metaOf(g).genres || [])].join(" ")); });
const findBox = $("find");
let query = "";
findBox.addEventListener("input", () => { query = plain(findBox.value.trim()); arrange(); });
findBox.addEventListener("keydown", e => { if (e.key === "Enter"){ const g = GAMES.find(g => !g.el.hidden); if (g) openVolet(g); } else if (e.key === "Escape"){ findBox.value = ""; query = ""; arrange(); } });
// tri : favoris d'abord (ordre d'origine), nouveautés, nom, dernière partie (notée quand on lance un jeu depuis l'accueil)
const SORTS = [["fav", "FAVORIS D'ABORD", "FAVORIS"], ["new", "NOUVEAUTES", "NOUVEAUX"], ["az", "NOM A-Z", "A-Z"], ["last", "DERNIERE PARTIE", "DERNIERS"]];
let sortBy = "fav"; try { sortBy = localStorage.getItem("ludo.sort") || "fav"; } catch (e) {}
if (!SORTS.some(x => x[0] === sortBy)) sortBy = "fav";
let played = {}; try { played = JSON.parse(localStorage.getItem("ludo.played")) || {}; } catch (e) {}
const notePlayed = k => { played[k] = Date.now(); try { localStorage.setItem("ludo.played", JSON.stringify(played)); } catch (e) {} };
const sortBtn = $("sort");
sortBtn.addEventListener("click", () => { sortBy = SORTS[(SORTS.findIndex(x => x[0] === sortBy) + 1) % SORTS.length][0]; try { localStorage.setItem("ludo.sort", sortBy); } catch (e) {} arrange(); });
const lastDate = g => { const m = metaOf(g); return [m.added || "", m.updated || ""].sort().pop(); };
function compare(a, b){
  if (sortBy === "new") return lastDate(b).localeCompare(lastDate(a)) || order.get(a) - order.get(b);
  if (sortBy === "az") return a.n.localeCompare(b.n, "fr");
  if (sortBy === "last") return (played[b.k] || 0) - (played[a.k] || 0) || order.get(a) - order.get(b);
  return (isFav(b) - isFav(a)) || order.get(a) - order.get(b);
}
const shows = g => { const m = metaOf(g); if (query && !g.txt.includes(query)) return false; if (filter === "EN COURS") return !!inProgress(g);
  return filter === "TOUS" || (filter === "★ FAVORIS" ? isFav(g) : filter === "NOUVEAU" ? recent(m.added) || recent(m.updated) : (m.genres || []).includes(filter)); };
// le texte du gardien s'écrit lettre par lettre, comme un dialogue de RPG
let sayText = "", sayTimer = null;
function say(t){
  if (t === sayText) return; sayText = t; clearInterval(sayTimer);
  const e = $("gardien");
  if (still()){ e.textContent = t; return; }
  let k = 0; e.textContent = ""; sayTimer = setInterval(() => { e.textContent = t.slice(0, ++k); if (k >= t.length) clearInterval(sayTimer); }, 25);
}
function arrange(){
  GAMES.slice().sort(compare).forEach(g => { g.el.hidden = !shows(g); rack.appendChild(g.el); });
  sortBtn.innerHTML = `TRI <b>${SORTS.find(x => x[0] === sortBy)[2]}</b>`; sortBtn.setAttribute("aria-label", "Changer le tri (actuel : " + SORTS.find(x => x[0] === sortBy)[1].toLowerCase() + ")");
  [...fbar.children].forEach(b => b.setAttribute("aria-pressed", b.dataset.f === filter));
  const vis = GAMES.filter(g => !g.el.hidden), n = vis.length, jeux = n > 1 ? "jeux" : "jeu";
  rack.hidden = !n;
  const empty = $("shelfEmpty"); empty.hidden = !!n;
  empty.textContent = filter === "★ FAVORIS" && !query ? "Aucun favori pour l'instant. Touche une cartouche, puis ☆ FAVORI dans son volet." : "Aucune cartouche ici.";
  const left = GAMES.filter(g => dailyState(g) === false).length;
  if (query) say(n ? `${n} ${jeux} ${n > 1 ? "répondent" : "répond"} à « ${findBox.value.trim()} ».` : `Aucun jeu ne répond à « ${findBox.value.trim()} ». Essaie un autre mot !`);
  else say(filter === "TOUS" ? `Bienvenue ! ${n} cartouches sur l'étagère` + (left ? `, et ${left > 1 ? left + " défis du jour t'attendent" : "un défi du jour t'attend"} encore.` : " : tous les défis du jour sont faits, bravo !")
    : filter === "★ FAVORIS" ? (n ? `Voici tes ${n} ${n > 1 ? "jeux préférés" : "jeu préféré"}.` : "Tu n'as pas encore de favori. Touche une cartouche, puis l'étoile de son volet.")
    : filter === "NOUVEAU" ? (n ? `${n} ${n > 1 ? "jeux tout neufs ou mis à jour" : "jeu tout neuf ou mis à jour"} !` : "Rien de neuf ces trois derniers jours. Reviens bientôt !")
    : filter === "EN COURS" ? (n ? `${n > 1 ? n + " parties t'attendent" : "Une partie t'attend"} : ${(l => l.slice(0, 3).join(", ") + (l.length > 3 ? ` et ${l.length - 3} autre${l.length > 4 ? "s" : ""}` : ""))(vis.map(g => (NICE[g.k] || g.n) + " (" + inProgress(g).toLowerCase() + ")"))}.` : "Aucune partie en cours. Choisis un jeu et lance-toi !")
    : `${n} ${n > 1 ? "défis t'attendent" : "défi t'attend"} aujourd'hui. Une seule tentative classée !`);
  refreshCarts();
}

/* ---------- jeu à la une : le dernier sorti, présenté dans sa boîte ---------- */
(function une(){
  const keys = Object.keys(META), rank = g => keys.indexOf(g.k);   // à date égale, le premier de META l'emporte
  const g = GAMES.filter(g => metaOf(g).added && !g.demo).sort((a, b) => metaOf(b).added.localeCompare(metaOf(a).added) || rank(a) - rank(b))[0];
  if (!g) return;
  const m = metaOf(g), box = $("une");
  box.style.setProperty("--lb", g.lb); box.style.setProperty("--lt", g.lt);
  box.innerHTML = `<button class="box" type="button" aria-label="Ouvrir ${g.n}"><span class="spine">${g.n}</span><span class="front"><span class="stripe"><span>LUDOTHEQUE 16 BITS</span></span><span class="art"><h3${g.n.length > 12 ? ' class="long"' : ""}>${g.n}</h3><span class="tag">${(m.genres || []).slice(0, 2).join(" · ")}</span></span></span>` +
    (recent(m.added) ? '<span class="sticker">TOUT<br>NEUF !</span>' : "") + `</button>` +
    `<div class="une-txt"><span class="kicker">${recent(m.added) ? "NOUVEAU JEU" : "A LA UNE"} · ${fmtDay(m.added)}</span><h2>${g.n}</h2><p></p>` +
    `<a class="saves-btn play" href="${ROOT + g.k}">JOUER</a>` +
    `<details class="news"><summary>QUOI DE NEUF ?</summary><ul>${NEWS.map(([d, t]) => `<li><b>${fmtDay(d)}</b>${t}</li>`).join("")}</ul></details></div>`;
  box.querySelector("p").textContent = g.d;
  box.querySelector(".art").prepend(art(g));
  box.querySelector(".box").addEventListener("click", () => openVolet(g));
  box.querySelector(".play").addEventListener("click", () => notePlayed(g.k));
  box.hidden = false;
})();

/* ---------- au clavier : les flèches promènent le curseur, Entrée ouvre le volet ---------- */
let carts = [], sel = 0;
function refreshCarts(){ carts = GAMES.filter(g => !g.el.hidden).sort(compare); carts.forEach((g, k) => g.el.classList.toggle("sel", k === sel && kbd)); }
let kbd = false;
function select(i, focus){
  if (!carts.length || i < 0) return;
  sel = (i + carts.length) % carts.length;
  carts.forEach((g, k) => g.el.classList.toggle("sel", k === sel && kbd));
  if (focus) carts[sel].el.focus({preventScroll: false});
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && ovOpen()){ e.preventDefault(); closeVolet(); return; }
  if (ovOpen() || (e.target.closest && e.target.closest("textarea, input, select, .saves, .player"))) return;
  if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)){ e.preventDefault(); kbd = true; select(sel + (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : -1), true); }
  else if (e.key === "Enter" && document.activeElement === document.body && carts[sel]) carts[sel].el.click();
});

/* ---------- surprends-moi : les cartouches défilent dans la console de plus en plus lentement, puis la choisie est insérée ---------- */
$("surprise").addEventListener("click", () => {
  const vis = GAMES.filter(g => !g.el.hidden), pool = vis.length ? vis : GAMES;
  const pick = pool[Math.floor(Math.random() * pool.length)], go = () => { notePlayed(pick.k); location.href = ROOT + pick.k; };
  if (still()) return go();
  const ov = el("div", "surprise"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-label", "Surprends-moi");
  ov.innerHTML = '<div class="slotwin"></div><div class="console" aria-hidden="true"><i>LUDO 16</i></div><div class="say" aria-live="polite">LE GARDIEN CHOISIT...<small>TOUCHE L\'ECRAN POUR ANNULER</small></div>';
  const win = ov.querySelector(".slotwin"), sayEl = ov.querySelector(".say");
  const clones = pool.map((g, j) => { const k = cart(g, j); k.tabIndex = -1; k.hidden = true; win.appendChild(k); return k; });
  document.body.appendChild(ov);
  const steps = 14 + Math.floor(Math.random() * 6), n = pool.length;
  let i = ((pool.indexOf(pick) - steps) % n + n) % n, step = 0, delay = 55, timer = 0;
  const stop = () => { clearTimeout(timer); ov.remove(); document.removeEventListener("keydown", esc, true); };
  const esc = e => { if (e.key === "Escape"){ e.stopPropagation(); stop(); } };
  ov.addEventListener("click", stop); document.addEventListener("keydown", esc, true);
  const tick = () => {
    clones.forEach((k, j) => { k.hidden = j !== i; });
    if (step++ < steps){ i = (i + 1) % n; delay *= 1.14; timer = setTimeout(tick, delay); return; }
    sayEl.textContent = pick.n + " !";
    timer = setTimeout(() => { clones[i].classList.add("in"); ov.classList.add("on"); sayEl.textContent = "INSERTION..."; timer = setTimeout(go, 900); }, 700);
  };
  tick();
});

/* ---------- les classements de la famille : vues, réglages et format de chaque jeu ---------- */
const N = v => nf(v), T = mmss;
const dayKey = d => d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
// même code que l'Arbre du jour de Lignée : C2-J + date aaaammjj en base 36
const dayCode = (mode, d) => `${mode}2-J${dayKey(d).toString(36).toUpperCase()}`;
const TCMODES = [["classic", "CLASSIQUE"], ["arsenal", "ARSENAL"]], TCAI = [["easy", "FACILE"], ["normal", "NORMAL"], ["hard", "AMIRAL"]];
const AMAI = [["easy", "MOUSSE"], ["normal", "CAPITAINE"], ["hard", "AMIRAL"]];
const ESAI = [["easy", "RECRUE"], ["normal", "PILOTE"], ["hard", "AS"]];
const CCLVL = [[1, "PETIT ECOLIER"], [2, "ECOLIER"], [3, "COLLEGE"], [4, "COSTAUD"], [5, "CHAMPION"]];
const CCOP = [["add", "+"], ["sub", "−"], ["mul", "×"], ["div", "÷"], ["mix", "MELANGE"]];
const SDK = [["4", "4×4"], ["6", "6×6"], ["9-1", "FACILE"], ["9-2", "MOYEN"], ["9-3", "DIFFICILE"]];
const st = {view: 0, mode: "C", back: 0, level: 2, size: 7, plevel: 1, poke: null, tcmode: "classic", tcai: "normal", amai: "normal", esai: "normal", pssize: 9, sdk: "9-2", cclvl: 2, ccop: "mix"};
const day = () => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - st.back); return d; };
const dayName = () => st.back === 0 ? "AUJOURD'HUI" : st.back === 1 ? "HIER" :
  day().toLocaleDateString("fr-FR", {weekday: "short", day: "numeric", month: "short"}).toUpperCase().replace(/\./g, "").normalize("NFD").replace(/[̀-ͯ]/g, "");
const daily = () => "daily:" + dayKey(day());
// chaque jeu : ses classements (vues), leur réglage (ctl), leur format (fmt ; T = temps en ms)
const RANKS = {
  tetris: [{label: "MEILLEUR SCORE", game: "tetris", board: () => "best", fmt: N}],
  snake: [{label: "MEILLEUR SCORE", game: "snake", board: () => "best", fmt: N}],
  asteroids: [{label: "MEILLEUR SCORE", game: "asteroids", board: () => "best", fmt: N}],
  solitaire: [{label: "MEILLEUR SCORE", game: "solitaire", board: () => "best", fmt: N}],
  queens: [{label: "MEILLEUR TEMPS", ctl: ["size"], game: "queens", board: () => "best:" + st.size, fmt: T, title: () => `${st.size}×${st.size}`, note: "Grilles réussies sans indice."},
    {label: "GRILLE DU JOUR", ctl: ["day"], game: "queens", board: daily, fmt: T,
     title: () => { const n = [9, 5, 6, 7, 7, 8, 9][day().getDay()]; return `GRILLE DU JOUR · ${n}×${n}`; },
     note: "La même grille pour toute la famille, de 5×5 le lundi à 9×9 le week-end. Temps plus 30 secondes par indice. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a fini la grille ce jour-là." : "Personne n'a encore fini la grille du jour : à toi de jouer !"}],
  picross: [{label: "PAR POKEMON", ctl: ["pokemon"], game: "picross", board: () => "t:" + st.poke, fmt: T, title: () => st.poke ? pokeLabel(st.poke) : "PAR POKEMON",
     note: "Temps de la grille, plus 30 secondes par indice utilisé.", empty: "Personne n'a encore capturé de Pokémon."},
    {label: "RECORDS DETENUS", kind: "records", game: "picross", fmt: v => N(v) + (v > 1 ? " records" : " record"), title: () => "QUI DETIENT LE PLUS DE RECORDS",
     note: "Nombre de Pokémon sur lesquels chacun a le meilleur temps de la famille."},
    {label: "POKEDEX", game: "picross", board: () => "dex", fmt: v => N(v) + " capturés", title: () => "LE POKEDEX LE PLUS COMPLET"}],
  lignee: [{label: "ARBRE DU JOUR", ctl: ["mode", "day"], game: "lignee", board: () => "daily:" + dayCode(st.mode, day()), fmt: T,
     title: () => `ARBRE DU JOUR · ${st.mode === "R" ? "ROYAL" : "CLASSIQUE"}`,
     empty: () => st.back ? "Personne n'a fini l'arbre ce jour-là." : "Personne n'a encore fini l'arbre du jour : à toi de jouer !"},
    {label: "PAR NIVEAU", ctl: ["mode", "level"], game: "lignee", board: () => "best:" + st.mode + st.level, fmt: T, title: () => `${st.mode === "R" ? "ROYAL" : "CLASSIQUE"} · ${LEVELS[st.level - 1]}`},
    {label: "ARBRES", game: "lignee", board: () => "arbres", fmt: v => N(v) + (v > 1 ? " arbres" : " arbre"), title: () => "ARBRES RECONSTITUES"}],
  injagility: [{label: "INFINI", game: "injagility", board: () => "best", fmt: v => N(v) + " obst.", title: () => "INFINI · OBSTACLES FRANCHIS"},
    {label: "PARCOURS · TOTAL", game: "parcours", board: () => "total", fmt: v => N(v) + " pts", title: () => "PARCOURS · TOTAL DES MEILLEURS SCORES"},
    {label: "PAR PARCOURS", ctl: ["plevel"], game: "parcours", board: () => "lvl:" + st.plevel, fmt: v => N(v) + " pts", title: () => `PARCOURS N° ${st.plevel}`}],
  touchecoule: [{label: "MEILLEURE VICTOIRE", ctl: ["tcmode", "tcai"], game: "touchecoule", board: () => `best:${st.tcmode}:${st.tcai}`, fmt: v => N(v) + " tirs",
     title: () => `${TCMODES.find(m => m[0] === st.tcmode)[1]} · IA ${TCAI.find(m => m[0] === st.tcai)[1]}`, note: "La victoire en le moins de tirs, par mode et par niveau de l'IA."}],
  club: [{label: "REPUTATION", game: "club", board: () => "rep", fmt: v => N(v) + " pts", title: () => "LA PLUS GRANDE REPUTATION"},
    {label: "CHAMPION", game: "club", board: () => "champion", fmt: v => N(v) + " sem.", title: () => "CHAMPION DE FRANCE LE PLUS RAPIDE",
     note: "Le nombre de semaines pour gagner le Championnat de France.", empty: "Personne n'est encore champion de France."}],
  alunissage: [{label: "MEILLEUR SCORE", game: "alunissage", board: () => "best", fmt: v => N(v) + " pts", title: () => "MEILLEURE MISSION",
     note: "Score d'une mission : à chaque site, (100 + carburant restant) × le multiplicateur de l'aire."},
    {label: "MISSION DU JOUR", ctl: ["day"], game: "alunissage", board: daily, fmt: v => N(v) + " pts",
     title: () => "MISSION DU JOUR", note: "La même suite de sites pour toute la famille. Seule la première mission du jour est classée.", empty: () => st.back ? "Personne n'a joué la mission ce jour-là." : "Personne n'a encore joué la mission du jour : à toi !"}],
  romet: [{label: "TRESORS", game: "romet", board: () => "tresors", fmt: v => N(v) + (v > 1 ? " trésors" : " trésor"), title: () => "TOTAL DES TRESORS",
     note: "Les trésors gagnés dans toutes les machines : 6 par machine, 42 en tout avec la machine secrète."},
    {label: "BUTIN", game: "romet", board: () => "butin", fmt: v => N(v) + (v > 1 ? " pièces" : " pièce"), title: () => "MEILLEUR BUTIN",
     note: "Le plus de pièces tombées dans le bac en une partie (une bourse), toutes machines confondues ; une pièce rejouée puis regagnée compte encore."}],
  yams: [{label: "MEILLEUR SCORE", game: "yams", board: () => "best", fmt: v => N(v) + " pts", title: () => "MEILLEUR SCORE"}],
  empilage: [{label: "PLUS HAUTE TOUR", game: "empilage", board: () => "best", fmt: v => N(v) + (v > 1 ? " blocs" : " bloc"), title: () => "PLUS HAUTE TOUR"},
    {label: "TOUR DU JOUR", ctl: ["day"], game: "empilage", board: daily, fmt: v => N(v) + (v > 1 ? " blocs" : " bloc"), title: () => "TOUR DU JOUR",
     note: "Les mêmes vitesses et les mêmes départs pour toute la famille. Seule la première tour du jour est classée.",
     empty: () => st.back ? "Personne n'a joué la tour ce jour-là." : "Personne n'a encore joué la tour du jour : à toi !"}],
  nebula: [{label: "MEILLEUR SCORE", game: "nebula", board: () => "best", fmt: v => N(v) + " pts", title: () => "MEILLEURE PARTIE",
     note: "1000 par secteur terminé, 20 par pirate détruit, les crédits restants, et 3000 pour la victoire finale."},
    {label: "MISSION DU JOUR", ctl: ["day"], game: "nebula", board: daily, fmt: v => N(v) + " pts",
     title: () => "MISSION DU JOUR", note: "La même carte et les mêmes combats pour toute la famille, avec la flotte et la règle du jour. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a joué la mission ce jour-là." : "Personne n'a encore joué la mission du jour : à toi !"},
    {label: "VICTOIRES", game: "nebula", board: () => "victoires", fmt: v => N(v) + " victoire" + (v > 1 ? "s" : ""), title: () => "VICTOIRES",
     note: "Le nombre de parties gagnées (la Rouille-Reine vaincue).", empty: "Personne n'a encore vaincu la Rouille-Reine."}],
  pontstellaire: [{label: "CIEL DU JOUR", ctl: ["day"], game: "pontstellaire", board: daily, fmt: T,
     title: () => "CIEL DU JOUR", note: "Le même ciel 9×9 pour toute la famille, plus 30 secondes par indice. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a dessiné le ciel ce jour-là." : "Personne n'a encore dessiné le ciel du jour : à toi de jouer !"},
    {label: "PAR TAILLE", ctl: ["pssize"], game: "pontstellaire", board: () => "best:" + st.pssize, fmt: T, title: () => `${st.pssize}×${st.pssize}`, note: "Le meilleur temps, plus 30 secondes par indice."},
    {label: "CONSTELLATIONS", game: "pontstellaire", board: () => "ciels", fmt: v => N(v) + (v > 1 ? " ciels" : " ciel"), title: () => "CONSTELLATIONS DESSINEES"}],
  sudoku: [{label: "GRILLE DU JOUR", ctl: ["day"], game: "sudoku", board: daily, fmt: T,
     title: () => "GRILLE DU JOUR", note: "La même grille 9×9 pour toute la famille (facile lundi et mardi, moyenne du mercredi au vendredi, difficile le week-end), plus 30 secondes par indice. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a rempli la grille ce jour-là." : "Personne n'a encore rempli la grille du jour : à toi de jouer !"},
    {label: "PAR NIVEAU", ctl: ["sdk"], game: "sudoku", board: () => "best:" + st.sdk, fmt: T, title: () => SDK.find(m => m[0] === st.sdk)[1], note: "Le meilleur temps, plus 30 secondes par indice."},
    {label: "GRILLES", game: "sudoku", board: () => "grilles", fmt: v => N(v) + (v > 1 ? " grilles" : " grille"), title: () => "GRILLES TERMINEES"}],
  calculator: [{label: "CALCUL DU JOUR", ctl: ["day"], game: "calculator", board: daily, fmt: T,
     title: () => "CALCUL DU JOUR", note: "Les mêmes 20 calculs pour toute la famille, du plus facile au plus dur. Le temps, plus 5 secondes par erreur. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a fait le calcul ce jour-là." : "Personne n'a encore fait le calcul du jour : à toi de jouer !"},
    {label: "SERIE DE 20", ctl: ["cclvl", "ccop"], game: "calculator", board: () => `serie:${st.cclvl}:${st.ccop}`, fmt: T,
     title: () => `SERIE DE 20 · ${CCLVL.find(m => m[0] === st.cclvl)[1]} · ${CCOP.find(m => m[0] === st.ccop)[1]}`, note: "Le temps pour 20 calculs, plus 5 secondes par erreur. MELANGE : plusieurs opérations choisies."},
    {label: "60 SECONDES", ctl: ["cclvl", "ccop"], game: "calculator", board: () => `chrono:${st.cclvl}:${st.ccop}`, fmt: v => N(v) + (v > 1 ? " bonnes" : " bonne"),
     title: () => `60 SECONDES · ${CCLVL.find(m => m[0] === st.cclvl)[1]} · ${CCOP.find(m => m[0] === st.ccop)[1]}`, note: "Le plus de bonnes réponses en une minute."}],
  lunerover: [{label: "ETOILES", game: "lunerover", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "Par niveau : 3 étoiles pour le programme le plus court, 2 avec jusqu'à 2 instructions de plus, 1 sinon (90 au maximum)."}],
  motdor: [{label: "MOT DU JOUR", ctl: ["day"], game: "motdor", board: daily, fmt: v => N(v) + (v > 1 ? " essais" : " essai"), title: () => "MOT DU JOUR",
     note: "Le même mot pour toute la famille ; le moins d'essais gagne. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a trouvé le mot ce jour-là." : "Personne n'a encore trouvé le mot du jour : à toi !"},
    {label: "SERIE", game: "motdor", board: () => "serie", fmt: v => N(v) + (v > 1 ? " jours" : " jour"), title: () => "MEILLEURE SERIE",
     note: "Le plus de jours d'affilée avec le mot du jour trouvé."}],
  doggysaga: [{label: "ETOILES", game: "doggysaga", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "LE REFUGE",
     note: "Les étoiles des 60 niveaux du refuge : 1 étoile par niveau réussi, 2 ou 3 avec beaucoup de points (180 au maximum)."},
    {label: "JOURNEE DU JOUR", ctl: ["day"], game: "doggysaga", board: daily, fmt: v => N(v) + " câlins", title: () => "JOURNEE DU JOUR",
     note: "La même grille et les mêmes chiens pour toute la famille : le plus de câlins en 20 coups. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a joué la journée de ce jour-là." : "Personne n'a encore joué la journée du jour : à toi !"}],
  jarls: [{label: "ETOILES", game: "jarls", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "LA ROUTE DU FJORD",
     note: "Les étoiles de la campagne des tavernes : par dieu battu, 1 étoile, 2 en gardant 8 PV, 3 en gardant 12 PV (60 au maximum)."},
    {label: "DEFI DU JOUR", ctl: ["day"], game: "jarls", board: daily, fmt: v => N(v) + " pts", title: () => "DEFI DU JOUR",
     note: "Le même dieu, les mêmes faveurs et les mêmes dés pour toute la famille, en normal. Victoire : 1000 + 50 par PV gardé − 10 par manche ; défaite : 20 par PV pris au dieu. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a défié le dieu ce jour-là." : "Personne n'a encore relevé le défi du jour : à toi !"}],
  boutique: [{label: "MEILLEURE BOUTIQUE", game: "boutique", board: () => "best", fmt: v => N(v) + " pts", title: () => "LA MEILLEURE BOUTIQUE",
     note: "Le score à la fin des 52 semaines : la valeur de la boutique (caisse, stock, cartes à leur cote, meubles, agrandissements, classeurs complets, moins le prêt). En cas de faillite, la moitié."}],
  bannieres: [{label: "DRAPEAUX", game: "bannieres", board: () => "best", fmt: v => N(v) + (v > 1 ? " drapeaux" : " drapeau"), title: () => "LE PLUS DE DRAPEAUX",
     note: "Les drapeaux (les cases à toi) à la fin d'une partie sur la petite carte (37 cases), en facile ou en normal."}],
  duche: [{label: "MEILLEUR SCORE", game: "duche", board: () => "best", fmt: v => N(v) + " pts", title: () => "MEILLEUR REGNE",
     note: "Le meilleur score d'une partie en normal (Duché du jour compris) : terres ×100, or, bois ÷ 2, bâtiments ×20, légitimité ×5, votes ×50, primes de victoire."},
    {label: "DUCHE DU JOUR", ctl: ["day"], game: "duche", board: daily, fmt: v => N(v) + " pts", title: () => "DUCHE DU JOUR",
     note: "La même carte, les mêmes rivaux et les mêmes événements pour toute la famille, en normal. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a régné sur le duché ce jour-là." : "Personne n'a encore joué le Duché du jour : à toi !"}],
  capitaine: [{label: "ETOILES", game: "capitaine", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "Par bassin : 3 étoiles jusqu'à 10 % au-dessus du minimum de coups (au moins un coup de marge), 2 jusqu'à 50 % au-dessus, sinon 1 (180 au maximum)."},
    {label: "BASSIN DU JOUR", ctl: ["day"], game: "capitaine", board: daily, fmt: v => N(v) + (v > 1 ? " coups" : " coup"), title: () => "BASSIN DU JOUR",
     note: "Le même bassin pour toute la famille ; le moins de coups gagne, en comptant ceux qu'on annule et ceux d'avant un recommencement. Une seule tentative classée par jour.",
     empty: () => st.back ? "Aucun navire doré n'est rentré au port ce jour-là." : "Personne n'a encore tenté le bassin du jour : à toi !"}],
  magasinier: [{label: "ETOILES", game: "magasinier", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "Par niveau : 3 étoiles au plus 10 % au-dessus du minimum de coups, 2 au plus 50 % au-dessus, sinon 1 (180 au maximum)."},
    {label: "GRILLE DU JOUR", ctl: ["day"], game: "magasinier", board: daily, fmt: v => N(v) + (v > 1 ? " coups" : " coup"), title: () => "GRILLE DU JOUR",
     note: "La même grille pour toute la famille ; le moins de coups gagne, en comptant ceux qu'on annule et ceux d'avant un recommencement. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a rangé l'entrepôt ce jour-là." : "Personne n'a encore tenté la grille du jour : à toi !"}],
  odyssee: [{label: "ETOILES", game: "odyssee", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "Par plateau : 1 étoile en arrivant au port, 2 sans naufrage, 3 sans naufrage et sous le temps cible (90 au maximum)."},
    {label: "PLATEAU DU JOUR", ctl: ["day"], game: "odyssee", board: daily, fmt: T, title: () => "PLATEAU DU JOUR",
     note: "Le même plateau et les mêmes dangers pour toute la famille ; le temps, plus 5 secondes par naufrage. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a navigué ce jour-là." : "Personne n'a encore tenté le plateau du jour : à toi !"}],
  orbite: [{label: "ETOILES", game: "orbite", board: () => "etoiles", fmt: v => N(v) + (v > 1 ? " étoiles" : " étoile"), title: () => "TOTAL D'ETOILES",
     note: "3 étoiles par niveau réussi du premier coup, 2 au deuxième essai, 1 au troisième (90 au maximum)."}],
  amiral: [{label: "MEILLEURE VICTOIRE", ctl: ["amai"], game: "amiral", board: () => `best:${st.amai}`, fmt: v => N(v) + " tours",
     title: () => AMAI.find(m => m[0] === st.amai)[1], note: "La victoire en le moins de tours, par niveau de l'ordinateur."},
    {label: "BATAILLE DU JOUR", ctl: ["day"], game: "amiral", board: daily, fmt: v => N(v) + " tours", title: () => "BATAILLE DU JOUR",
     note: "Les mêmes flottes et le même ennemi pour toute la famille, en Capitaine ; la victoire en le moins de tours. Une seule tentative classée par jour.",
     empty: () => st.back ? "Personne n'a gagné la bataille ce jour-là." : "Personne n'a encore gagné la bataille du jour : à toi !"}],
  escadrille: [{label: "MEILLEURE VICTOIRE", ctl: ["esai"], game: "escadrille", board: () => `best:${st.esai}`, fmt: v => N(v) + " tours",
     title: () => ESAI.find(m => m[0] === st.esai)[1], note: "La victoire en le moins de tours, par niveau de l'ordinateur."}],
};
// les Pokémon du Picross Dex (noms lus dans la page du jeu, mise en cache par l'appli), chargés à la première demande
let DEX = null, dexReady = null;
const loadDex = () => dexReady || (dexReady = fetch(ROOT + "picross/dessins.js").then(r => r.text()).then(t => {
  DEX = {}; for (const m of t.matchAll(/\{id:"([a-z0-9_-]+)", no:"([0-9A-Z]+)", name:"([^"]+)"/g)) DEX[m[1]] = {no: m[2], name: m[3]};
}).catch(() => { DEX = {}; }));
const pokeLabel = id => { const d = DEX && DEX[id]; return d ? `${d.no === "OBJ" ? "OBJ" : "#" + d.no} ${d.name}` : id.toUpperCase(); };
const ord = n => n === 1 ? "1er" : n + "e";

// une couronne sur les cartouches des jeux où je détiens un record de la famille (gardé 15 minutes)
function crowns(force){
  if (!L || !L.joined() || !L.bests) return;
  const c = rk("ludo.crowns", null);
  if (c && Array.isArray(c.k)){ crownSet = new Set(c.k); paintMarks(); }
  if (!force && c && Date.now() - c.t < 15 * 60e3) return;
  const got = [];
  Promise.all(GAMES.filter(g => g.rank).map(g => {
    const ids = [...new Set(RANKS[g.rank].map(v => v.game))];
    return Promise.all(ids.map(id => L.bests(id).catch(() => null))).then(all => { if (all.some(rows => rows && rows.some(r => r.me))) got.push(g.k); });
  })).then(() => {
    if (!L.joined()) return;
    crownSet = new Set(got); paintMarks();
    try { localStorage.setItem("ludo.crowns", JSON.stringify({t: Date.now(), k: got})); } catch (e) {}
  });
}

/* ---------- le volet du jeu ---------- */
const ov = $("ov"), vBody = $("vBody"), vClose = $("vClose");   // ✕ passe dans la barre du volet : le garder sous la main (sortie du document, $("vClose") rendait null)
let cur = null, F = null, ticket = 0, pokeList = [];
const ovOpen = () => ov.classList.contains("on");
// la boîte de jeu en 3D : face avant, tranches
function box(g, w, h, d){
  const wrap = el("div", "bwrap"), b = el("div", "box3");
  wrap.style.cssText = `--bw:${w}px; --bh:${h}px; --bd:${d}px; --bk:${w / 112}; --lb:${g.lb}; --lt:${g.lt}`;
  const f = el("div", "bf"), a = el("div", "art"); a.append(art(g));
  f.append(el("span", "brand", "LUDOTHEQUE"), a, el("div", "tt chrome", g.s), el("span", "gen", (metaOf(g).genres || [])[0] || "JEU"));
  const s = el("div", "bs"); s.append(el("i"), el("span", "chrome", g.s));
  b.append(el("div", "bb"), el("div", "br"), el("div", "bt"), el("div", "bo"), s, f);
  wrap.append(b);
  return wrap;
}
function link(cls, text, href, k){ const a = el("a", cls, text); a.href = ROOT + href; a.addEventListener("click", () => notePlayed(k)); return a; }
function openVolet(g, view){
  const first = !ovOpen();
  cur = g; st.view = view || 0; st.back = 0;
  ov.style.setProperty("--lt", g.lt);
  renderVolet();
  ov.classList.add("on"); document.body.classList.add("lock");
  $("volet").scrollTop = 0;
  vClose.focus({preventScroll: true});
  // le bouton retour du téléphone ferme le volet au lieu de quitter l'accueil
  if (first) try { if (!(history.state && history.state.volet)) history.pushState({volet: g.k}, ""); } catch (e) {}
}
function hideVolet(){
  if (!ovOpen()) return;
  ov.classList.remove("on"); document.body.classList.remove("lock"); ticket++;
  if (cur && !cur.el.hidden) cur.el.focus({preventScroll: true});
}
function closeVolet(){ try { if (history.state && history.state.volet){ history.back(); return; } } catch (e) {} hideVolet(); }
addEventListener("popstate", () => { if (!(history.state && history.state.volet)) hideVolet(); });
vClose.addEventListener("click", closeVolet);
ov.addEventListener("click", e => { if (e.target === ov) closeVolet(); });

function renderVolet(){
  const g = cur, m = metaOf(g), now = inProgress(g);
  vBody.textContent = "";
  // la boîte, le titre, la description, les étiquettes et l'étoile des favoris
  // en haut, le titre et ✕ restent visibles quand on fait défiler
  const bar = el("div", "vbar"), h = el("h3", "", g.n); h.id = "vTitle"; bar.append(h, vClose);
  const head = el("div", "head"), txt = el("div");
  const tags = el("div", "tags");
  [...(m.genres || []), ...g.tags].forEach(t => tags.append(el("span", "", t)));
  if (recent(m.added)) tags.append(el("span", "", "NOUVEAU")); else if (recent(m.updated)) tags.append(el("span", "", "MIS A JOUR"));
  if (now) tags.append(el("span", "cur", "EN COURS · " + now));
  const fav = el("button", "favb"); fav.type = "button";
  const paintFav = () => { fav.textContent = isFav(g) ? "★ FAVORI" : "☆ FAVORI"; fav.setAttribute("aria-pressed", isFav(g)); };
  fav.addEventListener("click", () => { favs = isFav(g) ? favs.filter(x => x !== g.k) : favs.concat(g.k); try { localStorage.setItem(favKey, JSON.stringify(favs)); } catch (e) {} paintFav(); paintMarks(); arrange(); });
  paintFav();
  txt.append(el("p", "", g.d), tags, fav);
  head.append(box(g, 104, 146, 26), txt);
  // mes records sur ce téléphone
  const mine = el("div", "blk"); mine.append(el("b", "", "MES RECORDS"));
  const recs = myRecords(g);
  if (recs.length) recs.forEach(([k, v]) => { const r = el("div", "ln"); r.append(el("span", "", k), el("span", "", v)); mine.append(r); });
  else mine.append(el("p", "", g.rank ? "Ton premier record s'inscrira ici à la fin de ta première partie." : "Pas de record : un bac à sable."));
  // le classement de la famille, puis JOUER
  const fam = el("div", "blk");
  const play = el("div", "vplay");
  play.append(link("play", g.play || "JOUER ▶", g.k, g.k));
  (g.more || []).forEach(([t, href]) => play.append(link("sec", t, href, g.k)));
  vBody.append(bar, head, mine);
  if (g.rank) vBody.append(fam);
  vBody.append(play);
  if (g.rank) renderFamily(fam);
}

// le bloc FAMILLE : rejoindre le classement, ou ses vues, ses réglages et son tableau
function renderFamily(box){
  box.textContent = "";
  const title = el("b", "", "FAMILLE"); box.append(title);
  if (!L){ box.append(el("p", "", "Les classements de la famille sont sur le site de la Ludothèque (tirashi.github.io/Claude).")); F = null; return; }
  if (!L.joined()){
    // une seule ligne : le formulaire est en bas de l'accueil, sous les cartouches
    const row = el("div", "joinrow"), go = el("button", "sec", "REJOINDRE ▶"); go.type = "button";
    go.addEventListener("click", () => { closeVolet(); setTimeout(() => { const b = $("player").querySelector(".tile"); if (b) b.click(); const f = $("player"); f.scrollIntoView({block: "center", behavior: still() ? "auto" : "smooth"}); const i = f.querySelector("input"); if (i) i.focus({preventScroll: true}); }, 80); });
    row.append(el("p", "", "Compare tes records avec la famille."), go);
    box.append(row);
    F = null; return;
  }
  F = {box, title, views: el("div", "views"), ctl: el("div", "ctl"), list: el("ol", "list"), mine: el("div", "mine"), note: el("p", "note"), res: el("div", "res")};
  F.views.setAttribute("role", "group"); F.views.setAttribute("aria-label", "Classement"); F.res.setAttribute("aria-live", "polite");
  const foot = el("div", "fam-foot"), who = el("span"); who.append("JOUEUR ", el("b", "", L.pseudo()));
  const again = el("button", "", "ACTUALISER"); again.type = "button"; again.addEventListener("click", load);
  foot.append(who, again);
  box.append(F.views, F.ctl, F.res, F.list, F.mine, F.note, foot);
  viewRender();
}
const views = () => RANKS[cur.rank], view = () => views()[Math.min(st.view, views().length - 1)];
function viewRender(){
  if (!F) return;
  const vs = views(), v = view();
  F.views.textContent = ""; F.views.hidden = vs.length < 2;
  vs.forEach((V, i) => { const b = el("button", "", V.label); b.type = "button"; b.setAttribute("aria-pressed", V === v); b.addEventListener("click", () => { st.view = i; viewRender(); }); F.views.append(b); });
  F.title.textContent = "FAMILLE · " + (v.title ? v.title() : v.label);
  F.note.hidden = !v.note; F.note.textContent = v.note || "";
  controls(v);
  load();
}
function button(label, pressed, onclick, extra){ const b = el("button", "saves-btn", label); b.type = "button"; b.setAttribute("aria-pressed", !!pressed); b.onclick = onclick; if (extra) Object.assign(b, extra); return b; }
function stepper(label, onPrev, onNext, prevOff, nextOff){
  const box = el("div", "day");
  const a = button("◀", false, onPrev, {disabled: prevOff}), b = button("▶", false, onNext, {disabled: nextOff}), s = el("span", "", label);
  a.setAttribute("aria-label", "Précédent"); b.setAttribute("aria-label", "Suivant"); box.append(a, s, b); return box;
}
const chips = (list, isOn, pick) => { const r = el("div", "chips"); list.forEach(([k, l]) => r.append(button(l, isOn(k), () => { pick(k); viewRender(); }))); return r; };
// le réglage de la vue : mode, jour, niveau, taille, parcours, Pokémon
function controls(v){
  const box = F.ctl; box.textContent = "";
  for (const c of v.ctl || []){
    if (c === "mode") box.append(chips([["C", "CLASSIQUE"], ["R", "ROYAL"]], k => st.mode === k, k => st.mode = k));
    if (c === "day") box.append(stepper(dayName(), () => { st.back = Math.min(60, st.back + 1); viewRender(); }, () => { st.back = Math.max(0, st.back - 1); viewRender(); }, st.back >= 60, st.back === 0));
    if (c === "level") box.append(chips(LEVELS.map((l, i) => [i + 1, l]), k => st.level === k, k => st.level = k));
    if (c === "tcmode" || c === "tcai" || c === "amai" || c === "esai") box.append(chips(c === "tcmode" ? TCMODES : c === "amai" ? AMAI : c === "esai" ? ESAI : TCAI, k => st[c] === k, k => st[c] = k));
    if (c === "cclvl") box.append(chips(CCLVL.map(([k]) => [k, String(k)]), k => st.cclvl === k, k => st.cclvl = k));
    if (c === "ccop") box.append(chips(CCOP, k => st.ccop === k, k => st.ccop = k));
    if (c === "sdk") box.append(chips(SDK, k => st.sdk === k, k => st.sdk = k));
    if (c === "pssize") box.append(chips([7, 9, 11].map(n => [n, `${n}×${n}`]), k => st.pssize === k, k => st.pssize = k));
    if (c === "size") box.append(chips([5, 6, 7, 8, 9].map(n => [n, `${n}×${n}`]), k => st.size === k, k => st.size = k));
    if (c === "plevel") box.append(stepper(`PARCOURS N° ${st.plevel}`, () => { st.plevel = Math.max(1, st.plevel - 1); viewRender(); }, () => { st.plevel++; viewRender(); }, st.plevel <= 1, st.plevel >= 999));
    if (c === "pokemon"){
      const s = el("select"); s.setAttribute("aria-label", "Pokémon");
      if (!pokeList.length){ const o = el("option", "", "Aucun Pokémon classé pour l'instant"); s.append(o); s.disabled = true; }
      for (const id of pokeList){ const o = el("option", "", pokeLabel(id)); o.value = id; if (id === st.poke) o.selected = true; s.append(o); }
      s.onchange = () => { st.poke = s.value; viewRender(); };
      const i = pokeList.indexOf(st.poke), stp = stepper("", () => { st.poke = pokeList[i - 1]; viewRender(); }, () => { st.poke = pokeList[i + 1]; viewRender(); }, i <= 0, i < 0 || i >= pokeList.length - 1);
      stp.querySelector("span").replaceWith(s); box.append(stp);
    }
  }
}
const res = (t, ok) => { if (!F) return; F.res.textContent = t; F.res.className = "res " + (ok ? "ok" : "err"); };
function show(rows, fmt){
  // ex æquo au même rang : 1, 2, 2, 4 (les lignes arrivent déjà triées)
  const rank = []; rows.forEach((r, i) => rank[i] = i && r.value === rows[i - 1].value ? rank[i - 1] : i + 1);
  rows.forEach((r, k) => {
    const li = el("li", (rank[k] <= 3 ? "p" + rank[k] : "") + (r.me ? " me" : ""));
    li.append(el("span", "r", ord(rank[k]).toUpperCase()), el("span", "n", r.pseudo), el("span", "v", fmt(r.value)));
    F.list.append(li);
  });
  const me = rows.findIndex(r => r.me);
  F.mine.textContent = me >= 0 ? `TU ES ${ord(rank[me]).toUpperCase()}${rank.filter(x => x === rank[me]).length > 1 ? " EX AEQUO" : ""} SUR ${rows.length}` : "";
}
function codeChanged(){ const b = F && F.box; renderFamily(b); paintPlayer(); const j = b && b.querySelector(".join .res"); if (j){ j.textContent = "Le code familial a changé : entre le nouveau code."; j.className = "res err"; } }
function load(){
  if (!F) return;
  const v = view(), my = ++ticket;
  F.list.textContent = ""; F.mine.textContent = ""; res("Chargement…", true);
  const fail = e => { if (my !== ticket) return;
    if (e && e.code === "code") return codeChanged();
    res(e && e.code === "missing" ? "Ce classement demande une mise à jour de Supabase (fichier classements-2.sql)." : "Classement injoignable pour le moment (pas de réseau ?).", false); };
  let job;
  if (v.kind === "records" || (v.ctl || []).includes("pokemon")){
    // une seule requête : le meilleur temps de chaque Pokémon
    job = Promise.all([L.flush(), loadDex()]).then(() => L.bests("picross")).then(rows => {
      if (rows === null || my !== ticket) return rows;
      const recs = rows.filter(r => String(r.board).startsWith("t:"));
      const order = id => { const d = DEX && DEX[id]; return d ? (d.no === "OBJ" ? 0 : +d.no) : 9999; };
      pokeList = recs.map(r => r.board.slice(2)).sort((a, b) => order(a) - order(b) || a.localeCompare(b));
      if (v.kind === "records"){
        const by = {};
        for (const r of recs){ const k = r.pseudo; by[k] = by[k] || {pseudo: k, value: 0, me: false}; by[k].value++; if (r.me) by[k].me = true; }
        return Object.values(by).sort((a, b) => b.value - a.value || a.pseudo.localeCompare(b.pseudo));
      }
      if (!st.poke || !pokeList.includes(st.poke)) st.poke = pokeList[0] || null;
      controls(v); F.title.textContent = "FAMILLE · " + v.title();
      return st.poke ? L.board("picross", "t:" + st.poke, 100) : [];
    });
  } else job = L.flush().then(() => L.board(v.game, v.board(), 100));
  job.then(rows => {
    if (my !== ticket) return;
    if (rows === null) return codeChanged();
    res("", true);
    if (!rows.length){ const e = view().empty; res(typeof e === "function" ? e() : e || "Personne pour l'instant : à toi de jouer !", true); return; }
    show(rows, v.fmt);
    if (L.pending()) res(`${L.pending()} score(s) en attente d'envoi.`, true);
  }).catch(fail);
}
// rejoindre le classement : pseudo + code familial (vérifié par Supabase), ou un compte déjà créé dans un autre navigateur
const netMsg = e => e.code === "code" ? "Ce code familial n'est pas le bon." : (e.message && !/Failed to fetch|NetworkError|Load failed/i.test(e.message) ? e.message : "Impossible de joindre le classement (pas de réseau ?).");
function joinForm(done){
  const f = el("div", "join");
  let mode = "new";
  const intro = el("p");
  const lp = el("label", "", "PSEUDO"), ip = el("input"); ip.maxLength = 16; ip.autocomplete = "nickname"; ip.placeholder = "ex. Rudy"; ip.value = L.pseudo() || ""; lp.append(ip);
  const la = el("label", "", "CODE DE MON COMPTE"), ia = el("textarea"); ia.rows = 3; ia.placeholder = "LUDOCOMPTE-…"; ia.spellcheck = false; ia.setAttribute("autocapitalize", "off"); la.append(ia);
  const lc = el("label", "", "CODE FAMILIAL"), ic = el("input"); ic.maxLength = 40; ic.autocomplete = "off"; ic.setAttribute("autocapitalize", "off"); ic.spellcheck = false; lc.append(ic);
  const go = button("REJOINDRE", false, null), out = el("div", "res"); out.setAttribute("aria-live", "polite");
  const sw = el("button", "swap"); sw.type = "button";
  const paint = () => {
    const acc = mode === "acc";
    intro.textContent = acc ? "Tu as déjà un compte dans un autre navigateur ? Colle son code de compte (bouton CODE DE MON COMPTE, là-bas) et le code familial : ce navigateur jouera sous le même pseudo. Les sauvegardes, elles, restent dans chaque navigateur."
      : "Choisis un pseudo et entre le code familial qu'on t'a donné : tes records partent ensuite tout seuls, même ceux déjà faits sur cet appareil.";
    lp.hidden = acc; la.hidden = !acc; out.textContent = "";
    sw.textContent = acc ? "◀ NOUVEAU JOUEUR" : "J'AI DEJA UN COMPTE ▶";
  };
  sw.onclick = () => { mode = mode === "acc" ? "new" : "acc"; paint(); (mode === "acc" ? ia : ip).focus(); };
  go.onclick = () => {
    out.textContent = "Vérification du code…"; out.className = "res ok";
    (mode === "acc" ? L.joinAccount(ia.value, ic.value) : L.join(ip.value, ic.value)).then(() => { ic.value = ""; ia.value = ""; out.textContent = ""; done(); })
      .catch(e => { out.className = "res err"; out.textContent = netMsg(e); });
  };
  [ip, ic].forEach(i => i.addEventListener("keydown", e => { if (e.key === "Enter") go.click(); }));
  paint();
  f.append(intro, lp, la, lc, go, out, sw);
  return f;
}
// sous les cartouches : le joueur inscrit (ou de quoi rejoindre le classement)
function paintPlayer(){
  const p = $("player"); p.textContent = "";
  if (!L) return;
  if (L.joined()){
    const who = el("div", "who"); who.append("CLASSEMENT DE LA FAMILLE · JOUEUR ", el("b", "", L.pseudo()));
    const btns = el("div", "saves-open");
    const acc = el("button", "saves-btn", "CODE DE MON COMPTE"); acc.type = "button"; acc.setAttribute("aria-expanded", "false");
    const ch = el("button", "saves-btn", "CHANGER DE PSEUDO"); ch.type = "button";
    ch.addEventListener("click", () => { L.leave(); crownSet = new Set(); try { localStorage.removeItem("ludo.crowns"); } catch (e) {} paintMarks(); paintPlayer(); const i = $("player").querySelector("input"); if (i) i.focus(); });
    // le code de compte : à coller dans un autre navigateur pour y jouer sous le même pseudo
    const box = el("div", "join acct"); box.hidden = true;
    const ta = el("textarea"); ta.readOnly = true; ta.rows = 3; ta.value = L.accountCode(); ta.setAttribute("aria-label", "Code de mon compte");
    const cp = button("COPIER", false, null), msg = el("div", "res"); msg.setAttribute("aria-live", "polite");
    cp.onclick = () => { const bad = () => { ta.focus(); ta.select(); msg.textContent = "Appuie longuement sur le code, puis Copier."; msg.className = "res err"; };
      try { navigator.clipboard.writeText(ta.value).then(() => { msg.textContent = "Code copié."; msg.className = "res ok"; }, bad); } catch (e) { bad(); } };
    box.append(el("p", "", "Pour jouer sous ton pseudo dans un autre navigateur (Chrome, l'appli, une tablette…) : là-bas, touche REJOINDRE LE CLASSEMENT, puis J'AI DEJA UN COMPTE, et colle ce code. Seuls les classements sont partagés : chaque navigateur garde ses propres sauvegardes. Ce code est ta clé : ne le donne à personne d'autre."), ta, cp, msg);
    acc.addEventListener("click", () => { box.hidden = !box.hidden; acc.setAttribute("aria-expanded", !box.hidden); if (!box.hidden) ta.value = L.accountCode(); });
    btns.append(acc, ch);
    p.append(who, btns, box);
  } else {
    const open = el("button", "saves-btn tile", "FAMILLE"); open.type = "button"; open.append(el("small", "", "Rejoindre le classement"));
    open.addEventListener("click", () => { open.replaceWith(joinForm(() => { paintPlayer(); crowns(true); })); });
    p.append(open);
    if (L.pseudo()) open.click();   // déjà venu : le formulaire directement, pseudo rempli
  }
}

// liens directs vers le volet d'un jeu : #jeu ou #jeu-vue (et anciens liens de la page des classements : #lignee-C, #touchecoule-0-classic-easy…)
function fromHash(){
  const h = decodeURIComponent(location.hash.slice(1)).split("-"); if (!h[0]) return;
  const id = h[0] === "parcours" ? "injagility" : h[0], g = GAMES.find(x => x.rank === id);
  if (!g) return;
  let v = 0;
  if (h[0] === "parcours") v = 2;
  else if (id === "lignee" && /^[CR]$/.test(h[1] || "")) st.mode = h[1];
  else if (/^\d$/.test(h[1] || "")) v = +h[1];
  if (/^[CR]$/.test(h[2] || "")) st.mode = h[2];
  if (id === "amiral" && /^(easy|normal|hard)$/.test(h[2] || "")) st.amai = h[2];
  if (id === "escadrille" && /^(easy|normal|hard)$/.test(h[2] || "")) st.esai = h[2];
  if (id === "touchecoule"){ if (/^(classic|arsenal)$/.test(h[2] || "")) st.tcmode = h[2]; if (/^(easy|normal|hard)$/.test(h[3] || "")) st.tcai = h[3]; }
  try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
  openVolet(g, v);
}

paintMarks();
arrange();
paintPlayer();
crowns();
fromHash();
addEventListener("hashchange", fromHash);
// revenir sur l'accueil depuis un jeu (page gardée en mémoire) : relire parties en cours et records
addEventListener("pageshow", e => { if (e.persisted){ paintMarks(); arrange(); if (ovOpen() && cur) renderVolet(); } });

/* ---------- transfert de toutes les sauvegardes entre navigateurs ---------- */
const readKey = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
const writeKey = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
// meilleurs scores : on garde le plus grand
const SCORES = [["tetris16.best", "Tetris"], ["snakeBestScore", "Snake"], ["asteroids16.best", "Asteroids"], ["injagility.best", "Injagility"], ["solitaire16.best", "Solitaire"]];
const fmtTime = ms => { const t = Math.floor(ms / 1000); return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0"); };
function collectSaves(){
  const g = {};
  for (const [k] of SCORES){ const v = Number(readKey(k, 0)); if (v > 0) g[k] = v; }
  const q = readKey("queens16.best", {}); if (q && Object.keys(q).length) g.queens = q;
  const qd = readKey("queens16.daily", {}); if (qd && Object.keys(qd).length) g.queensDaily = qd;
  const cap = readKey("picrossdex.captured", {}), prog = readKey("picrossdex.progress", {});
  const c = {}, p = {};
  for (const [id, v] of Object.entries(cap || {})) if (v && v.time > 0) c[id] = Object.assign({t: v.time, h: v.hints || 0}, v.test ? {x: 1} : {});
  for (const [id, v] of Object.entries(prog || {})) if (v && Array.isArray(v.cells)) p[id] = {c: v.cells.join(""), e: Math.round(v.elapsed || 0), h: v.hints || 0};
  if (Object.keys(c).length || Object.keys(p).length) g.picross = {c, p};
  const lg = readKey("lignee.stats", {}); if (lg && Object.keys(lg).length) g.lignee = lg;
  const ld = readKey("lignee.daily", {}); if (ld && Object.keys(ld).length) g.ligneeDaily = ld;
  const tc = readKey("touchecoule.best", {}); if (tc && Object.keys(tc).length) g.touchecoule = tc;
  const am = readKey("amiral.best", {}); if (am && Object.keys(am).length) g.amiral = am;
  const ap = {p: readKey("amiral.palmares", {}) || {}, d: readKey("amiral.daily", {}) || {}}; if (Object.keys(ap.p).length || Object.keys(ap.d).length) g.amiralPal = ap;
  const es = {b: readKey("escadrille.best", {}) || {}, v: Number(readKey("escadrille.victoires", 0)) || 0, s: readKey("escadrille.skins", []) || [], k: readKey("escadrille.skin", null), p: readKey("escadrille.palmares", {}) || {}}; if (Object.keys(es.b).length || es.v) g.escadrille = es;
  const ob = readKey("orbite.stars", {}); if (ob && Object.keys(ob).length) g.orbite = ob;
  const lr = readKey("lunerover.stars", {}); if (lr && Object.keys(lr).length) g.lunerover = lr;
  const al = {b: Number(readKey("alunissage.best", 0)) || 0, s: Number(readKey("alunissage.sites", 0)) || 0, d: readKey("alunissage.daily", {}) || {}};
  if (al.b || al.s) g.alunissage = al;
  const ps = {b: readKey("pontstellaire.best", {}) || {}, d: readKey("pontstellaire.daily", {}) || {}, w: Number(readKey("pontstellaire.wins", 0)) || 0};
  if (ps.w || Object.keys(ps.b).length) g.pontstellaire = ps;
  const su = {b: readKey("sudoku.best", {}) || {}, d: readKey("sudoku.daily", {}) || {}, w: Number(readKey("sudoku.wins", 0)) || 0};
  if (su.w || Object.keys(su.b).length) g.sudoku = su;
  const cc = {b: readKey("calculator.best", {}) || {}, d: readKey("calculator.daily", {}) || {}, p: Number(readKey("calculator.parties", 0)) || 0};
  if (cc.p || Object.keys(cc.b).length) g.calculator = cc;
  const nb = {b: Number(readKey("nebula.best", 0)) || 0, m: readKey("nebula.meta", null), d: readKey("nebula.daily", {}) || {}};
  if (nb.b || (nb.m && nb.m.games)) g.nebula = nb;
  const em = {b: Number(readKey("empilage.best", 0)) || 0, p: Number(readKey("empilage.parties", 0)) || 0, d: readKey("empilage.daily", {}) || {}};
  if (em.b || em.p) g.empilage = em;
  const ya = {b: Number(readKey("yams.best", 0)) || 0, p: Number(readKey("yams.parties", 0)) || 0, y: Number(readKey("yams.nbYams", 0)) || 0, o: Number(readKey("yams.bonus", 0)) || 0};
  if (ya.b || ya.p) g.yams = ya;
  const od = {s: readKey("odyssee.stars", {}) || {}, b: readKey("odyssee.best", {}) || {}, d: readKey("odyssee.daily", {}) || {}};
  if (Object.keys(od.s).length || Object.keys(od.d).length) g.odyssee = od;
  const dg = {e: (readKey("doggysaga.progres", {}) || {}).etoiles || {}, a: (readKey("doggysaga.progres", {}) || {}).album || [], d: readKey("doggysaga.daily", {}) || {}};
  if (Object.keys(dg.e).length || Object.keys(dg.d).length) g.doggysaga = dg;
  const ja = {e: (readKey("jarls.campagne", {}) || {}).etoiles || {}, d: readKey("jarls.daily", {}) || {}};
  if (Object.keys(ja.e).length || Object.keys(ja.d).length) g.jarls = ja;
  const bo = {b: Number(readKey("boutique.best", 0)) || 0, s: readKey("boutique.stats", {}) || {}};
  if (bo.b || bo.s.parties) g.boutique = bo;
  const bn = {b: Number(readKey("bannieres.best", 0)) || 0, s: readKey("bannieres.stats", {}) || {}};
  if (bn.b || bn.s.parties) g.bannieres = bn;
  const du = {b: Number(readKey("duche.best", 0)) || 0, d: readKey("duche.daily", {}) || {}};
  if (du.b || Object.keys(du.d).length) g.duche = du;
  const ro = readKey("romet.machines", null);
  if (ro && typeof ro === "object" && Object.keys(ro).length) g.romet = ro;
  const mg = {n: readKey("magasinier.niveaux", {}) || {}, d: readKey("magasinier.daily", {}) || {}};
  if (Object.keys(mg.n).length || Object.keys(mg.d).length) g.magasinier = mg;
  const mo = {s: readKey("motdor.stats", null), d: readKey("motdor.daily", {}) || {}};
  if (mo.s && mo.s.parties > 0) g.motdor = mo;
  const cp = {n: readKey("capitaine.niveaux", {}) || {}, d: readKey("capitaine.daily", {}) || {}};
  if (Object.keys(cp.n).length || Object.keys(cp.d).length) g.capitaine = cp;
  const cl = readKey("club.save", null); if (cl && cl.week > 1) g.club = cl;
  const pc = readKey("injagility.parcours", null); if (pc && (pc.wallet || (pc.unlocked || 1) > 1)) g.parcours = pc;
  return g;
}
function describeSaves(g){
  const out = [];
  if (g.picross) out.push(`Picross Dex : ${Object.keys(g.picross.c).length} Pokémon` + (Object.keys(g.picross.p).length ? `, ${Object.keys(g.picross.p).length} grille(s) en cours` : ""));
  if (g.queens) out.push("Queens : " + Object.keys(g.queens).sort((a, b) => a - b).map(n => `${n}×${n} en ${fmtTime(g.queens[n])}`).join(", "));
  if (g.queensDaily){ const n = Object.keys(g.queensDaily).length; out.push(`Queens : ${n} grille${n > 1 ? "s" : ""} du jour`); }
  for (const [k, name] of SCORES) if (g[k]) out.push(`${name} : ${g[k]} ${k === "injagility.best" ? "obstacles" : "points"}`);
  if (g.parcours) out.push(`Injagility Parcours : ${(g.parcours.unlocked || 1) - 1} parcours réussis, ${g.parcours.wallet || 0} points, ${(g.parcours.owned || []).length} chien${(g.parcours.owned || []).length > 1 ? "s" : ""}`);
  if (g.lignee){ const n = Object.values(g.lignee).reduce((s, v) => s + (v && v.n || 0), 0); if (n) out.push(`Lignée : ${n} arbre${n > 1 ? "s" : ""} reconstitué${n > 1 ? "s" : ""}`); }
  if (g.touchecoule){ const v = Object.values(g.touchecoule).filter(x => x > 0); if (v.length) out.push(`Touché Coulé : meilleure victoire en ${Math.min(...v)} tirs`); }
  if (g.club && g.club.week) out.push(`Club d'agility : semaine ${g.club.week}, ${(g.club.dogs || []).length} chien${(g.club.dogs || []).length > 1 ? "s" : ""}, réputation ${g.club.rep || 0}`);
  if (g.amiral){ const v = Object.values(g.amiral).filter(x => x > 0); if (v.length) out.push(`Amiral ! : meilleure victoire en ${Math.min(...v)} tours`); }
  if (g.amiralPal){ const n = Number((g.amiralPal.p || {}).victoires) || 0, d = Object.keys(g.amiralPal.d || {}).length;
    if (n || d) out.push(`Amiral ! : ${n} victoire${n > 1 ? "s" : ""}${d ? `, ${d} bataille${d > 1 ? "s" : ""} du jour` : ""}`); }
  if (g.escadrille){ const v = Object.values(g.escadrille.b || {}).filter(x => x > 0), n = g.escadrille.v || 0;
    const f = Math.max(1, (g.escadrille.s || []).length);
    if (v.length || n) out.push(`Escadrille ! : ${n} victoire${n > 1 ? "s" : ""}${v.length ? `, meilleure en ${Math.min(...v)} tours` : ""}, ${f} escadrille${f > 1 ? "s" : ""} sur 4`); }
  if (g.alunissage) out.push(`Alunissage : record ${g.alunissage.b || 0} points, ${g.alunissage.s || 0} site${g.alunissage.s > 1 ? "s" : ""} atteint${g.alunissage.s > 1 ? "s" : ""}`);
  if (g.pontstellaire){ const p = g.pontstellaire, b = Object.keys(p.b || {}).sort((x, y) => x - y).map(n => `${n}×${n} en ${fmtTime(p.b[n])}`);
    out.push(`Pont stellaire : ${p.w || 0} constellation${p.w > 1 ? "s" : ""}` + (b.length ? ", " + b.join(", ") : "")); }
  if (g.sudoku){ const p = g.sudoku, nm = {"4": "4×4", "6": "6×6", "9-1": "9×9 facile", "9-2": "9×9 moyen", "9-3": "9×9 difficile"};
    const b = Object.keys(nm).filter(k => (p.b || {})[k] > 0).map(k => `${nm[k]} en ${fmtTime(p.b[k])}`);
    out.push(`Sudoku : ${p.w || 0} grille${p.w > 1 ? "s" : ""}` + (b.length ? ", " + b.join(", ") : "")); }
  if (g.yams) out.push(`Yams : record ${g.yams.b || 0} pts, ${g.yams.p || 0} partie${g.yams.p > 1 ? "s" : ""}`);
  if (g.empilage) out.push(`Empilage : record ${g.empilage.b || 0} bloc${g.empilage.b > 1 ? "s" : ""}, ${g.empilage.p || 0} partie${g.empilage.p > 1 ? "s" : ""}`);
  if (g.calculator){ const p = g.calculator; out.push(`Calculator : ${p.p || 0} partie${p.p > 1 ? "s" : ""}, ${Object.keys(p.b || {}).length} record${Object.keys(p.b || {}).length > 1 ? "s" : ""}`); }
  if (g.nebula){ const m = g.nebula.m || {}; out.push(`Nebula : record ${g.nebula.b || 0} points, ${m.games || 0} partie${m.games > 1 ? "s" : ""}, ${m.data || 0} données stellaires`); }
  if (g.lunerover){ const n = Object.values(g.lunerover).reduce((s, v) => s + (Number(v) || 0), 0); if (n) out.push(`Lune-Rover : ${n} étoile${n > 1 ? "s" : ""}`); }
  if (g.odyssee){ const n = Object.values(g.odyssee.s || {}).reduce((s, v) => s + (Number(v) || 0), 0); out.push(`Odyssée : ${n} étoile${n > 1 ? "s" : ""}`); }
  if (g.doggysaga){ const v = Object.values(g.doggysaga.e || {}).map(Number).filter(x => x > 0), d = Object.keys(g.doggysaga.d || {}).length, a = (g.doggysaga.a || []).length;
    out.push(`Doggy Saga : ${v.length} niveau${v.length > 1 ? "x" : ""}, ${v.reduce((x, y) => x + y, 0)} étoiles, ${a} chien${a > 1 ? "s" : ""} adopté${a > 1 ? "s" : ""}${d ? `, ${d} journée${d > 1 ? "s" : ""} du jour` : ""}`); }
  if (g.jarls){ const v = Object.values(g.jarls.e || {}).map(Number).filter(x => x > 0), d = Object.keys(g.jarls.d || {}).length;
    out.push(`Le Thé des Jarls : ${v.length} dieu${v.length > 1 ? "x" : ""} battu${v.length > 1 ? "s" : ""}, ${v.reduce((a, b) => a + b, 0)} étoiles${d ? `, ${d} défi${d > 1 ? "s" : ""} du jour` : ""}`); }
  if (g.boutique){ const s = g.boutique.s || {}; out.push(`La Boutique de cartes : meilleure boutique ${g.boutique.b || 0} pts${s.finies ? `, ${s.finies} année${s.finies > 1 ? "s" : ""} finie${s.finies > 1 ? "s" : ""}` : ""}`); }
  if (g.bannieres){ const s = g.bannieres.s || {}; out.push(`Bannières : ${g.bannieres.b || 0} drapeaux au mieux${s.gagnees ? `, ${s.gagnees} partie${s.gagnees > 1 ? "s" : ""} gagnée${s.gagnees > 1 ? "s" : ""}` : ""}`); }
  if (g.duche){ const d = Object.keys(g.duche.d || {}).length; out.push(`Duché : meilleur score ${g.duche.b || 0}${d ? `, ${d} duché${d > 1 ? "s" : ""} du jour` : ""}`); }
  if (g.romet){ const v = Object.values(g.romet).filter(x => x && typeof x === "object"), t = v.reduce((a, x) => a + (Array.isArray(x.t) ? x.t.filter(Boolean).length : 0), 0);
    out.push(`Romet : ${t} trésor${t > 1 ? "s" : ""}, meilleur butin ${v.reduce((a, x) => Math.max(a, Number(x.butin) || 0), 0)}`); }
  if (g.magasinier){ const n = Object.values(g.magasinier.n || {}).reduce((s, v) => s + (Number(v && v.etoiles) || 0), 0), d = Object.keys(g.magasinier.d || {}).length;
    out.push(`Le Magasinier : ${n} étoile${n > 1 ? "s" : ""}${d ? `, ${d} grille${d > 1 ? "s" : ""} du jour` : ""}`); }
  if (g.motdor && g.motdor.s){ const s = g.motdor.s; out.push(`Le Mot d'or : ${s.gagnees || 0} mot${s.gagnees > 1 ? "s" : ""} du jour trouvé${s.gagnees > 1 ? "s" : ""}, meilleure série ${s.record || 0}`); }
  if (g.capitaine){ const n = Object.values(g.capitaine.n || {}).reduce((s, v) => s + (Number(v && v.etoiles) || 0), 0), d = Object.keys(g.capitaine.d || {}).length;
    out.push(`Capitaine du port : ${n} étoile${n > 1 ? "s" : ""}${d ? `, ${d} bassin${d > 1 ? "s" : ""} du jour` : ""}`); }
  if (g.orbite){ const n = Object.values(g.orbite).reduce((s, v) => s + (Number(v) || 0), 0); if (n) out.push(`Orbite : ${n} étoile${n > 1 ? "s" : ""}`); }
  return out;
}
function decodeSaves(text){
  const raw = (text || "").replace(/\s+/g, "");
  const dec = b => JSON.parse(decodeURIComponent(escape(atob(b))));
  let at = raw.indexOf("LUDO1-");
  try {
    if (at >= 0) return (dec(raw.slice(at + 6)).g) || {};
    at = raw.indexOf("PICROSSDEX1-");
    if (at >= 0) return {picross: dec(raw.slice(at + 12))};
  } catch (e) { throw new Error("Le code est incomplet ou abîmé. Copie-le de nouveau en entier."); }
  throw new Error("Ce n'est pas un code de sauvegarde : il doit commencer par LUDO1- ou PICROSSDEX1-.");
}
function mergeSaves(g){
  const done = [];
  for (const [k, name] of SCORES){
    const v = Number(g[k]); if (!(v > 0)) continue;
    if (v > Number(readKey(k, 0))){ writeKey(k, v); done.push(`${name} : record ${v}`); }
  }
  if (g.queens && typeof g.queens === "object"){
    const mine = readKey("queens16.best", {}) || {}; let n = 0;
    for (const [size, t] of Object.entries(g.queens)) if (/^[5-9]$/.test(size) && t > 0 && (!mine[size] || t < mine[size])){ mine[size] = Math.round(t); n++; }
    if (n){ writeKey("queens16.best", mine); done.push(`Queens : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.queensDaily && typeof g.queensDaily === "object"){
    const mine = readKey("queens16.daily", {}) || {}; let n = 0;
    for (const [d, t] of Object.entries(g.queensDaily)) if (/^\d{8}$/.test(d) && t > 0 && (!mine[d] || t < mine[d])){ mine[d] = Math.round(t); n++; }
    if (n){ writeKey("queens16.daily", mine); done.push(`Queens : ${n} grille${n > 1 ? "s" : ""} du jour`); }
  }
  if (g.picross){
    const cap = readKey("picrossdex.captured", {}) || {}, prog = readKey("picrossdex.progress", {}) || {};
    let added = 0, faster = 0, grids = 0;
    for (const [id, v] of Object.entries(g.picross.c || {})){
      if (!/^[a-z0-9_-]+$/.test(id) || !(v.t > 0)) continue;
      const mk = () => Object.assign({time: Math.round(v.t), hints: v.h || 0}, v.x ? {test: true} : {});
      const score = (t, n) => t + 30000 * (n || 0);
      if (!cap[id]){ cap[id] = mk(); added++; }
      else if (score(v.t, v.h) < score(cap[id].time, cap[id].hints)){ cap[id] = mk(); faster++; }
    }
    for (const [id, v] of Object.entries(g.picross.p || {})){
      if (!/^[a-z0-9_-]+$/.test(id) || cap[id] || prog[id] || typeof v.c !== "string" || !/^[012]+$/.test(v.c)) continue;
      prog[id] = {cells: [...v.c].map(Number), elapsed: v.e || 0, hints: v.h || 0}; grids++;
    }
    for (const id of Object.keys(prog)) if (cap[id]) delete prog[id];
    writeKey("picrossdex.captured", cap); writeKey("picrossdex.progress", prog);
    const parts = [];
    if (added) parts.push(`${added} Pokémon`); if (faster) parts.push(`${faster} record${faster > 1 ? "s" : ""}`); if (grids) parts.push(`${grids} grille${grids > 1 ? "s" : ""} en cours`);
    if (parts.length) done.push("Picross Dex : " + parts.join(", "));
  }
  if (g.parcours && typeof g.parcours === "object"){
    // on garde le plus avancé : niveaux, meilleurs scores, chiens adoptés, et le plus gros porte-monnaie
    const mine = readKey("injagility.parcours", {}) || {}, o = g.parcours, before = JSON.stringify(mine);
    mine.unlocked = Math.max(mine.unlocked || 1, Math.min(999, o.unlocked || 1));
    mine.wallet = Math.max(mine.wallet || 0, Math.min(1e7, o.wallet || 0));
    mine.best = mine.best || {}; for (const [k, v] of Object.entries(o.best || {})) if (/^\d+$/.test(k) && v > (mine.best[k] || 0)) mine.best[k] = Math.round(v);
    mine.owned = [...new Set([...(mine.owned || ["bernois"]), ...(o.owned || []).filter(x => /^[a-z]+$/.test(x))])];
    mine.dog = mine.dog || o.dog || "bernois";
    if (JSON.stringify(mine) !== before){ writeKey("injagility.parcours", mine); done.push("Injagility Parcours : progression mise à jour"); }
  }
  if (g.lignee && typeof g.lignee === "object"){
    const mine = readKey("lignee.stats", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(g.lignee)){
      if (!/^([CR][1-4]|F[1-4]:[A-Z]{2,8})$/.test(k) || !v) continue;
      const m = mine[k] || {best: 0, n: 0}, before = JSON.stringify(m);
      if (v.best > 0 && (!m.best || v.best < m.best)) m.best = Math.round(v.best);
      if ((v.n || 0) > (m.n || 0)) m.n = v.n;
      if (JSON.stringify(m) !== before){ mine[k] = m; n++; }
    }
    if (n){ writeKey("lignee.stats", mine); done.push(`Lignée : ${n} niveau${n > 1 ? "x" : ""} mis à jour`); }
  }
  if (g.touchecoule && typeof g.touchecoule === "object"){
    const mine = readKey("touchecoule.best", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(g.touchecoule)) if (/^(classic|arsenal):(easy|normal|hard)$/.test(k) && v > 0 && (!mine[k] || v < mine[k])){ mine[k] = Math.round(v); n++; }
    if (n){ writeKey("touchecoule.best", mine); done.push(`Touché Coulé : ${n} record${n > 1 ? "s" : ""}`); }
  }
  // le club : on garde la partie la plus avancée (la plus grande réputation)
  if (g.club && typeof g.club === "object" && g.club.v === 1 && Array.isArray(g.club.dogs)){
    const mine = readKey("club.save", null);
    if (!mine || (g.club.rep || 0) > (mine.rep || 0) || ((g.club.rep || 0) === (mine.rep || 0) && g.club.week > mine.week)){
      writeKey("club.save", g.club); done.push(`Club d'agility : partie de la semaine ${g.club.week}`); }
  }
  if (g.amiral && typeof g.amiral === "object"){
    const mine = readKey("amiral.best", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(g.amiral)) if (/^(easy|normal|hard)$/.test(k) && v > 0 && (!mine[k] || v < mine[k])){ mine[k] = Math.round(v); n++; }
    if (n){ writeKey("amiral.best", mine); done.push(`Amiral ! : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.amiralPal && typeof g.amiralPal === "object"){
    // palmarès (navires débloqués au chantier) : le plus grand de chaque compte ; batailles du jour : le moins de tours
    const a = g.amiralPal, pm = readKey("amiral.palmares", {}) || {}, daily = readKey("amiral.daily", {}) || {}; let n = 0;
    for (const k of ["victoires", "easy", "normal", "hard"]) { const v = Math.round(Number((a.p || {})[k]) || 0); if (v > (pm[k] || 0)){ pm[k] = v; n++; } }
    for (const k of ["rapide", "intacte"]) if ((a.p || {})[k] === true && !pm[k]){ pm[k] = true; n++; }
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("amiral.palmares", pm); writeKey("amiral.daily", daily); done.push("Amiral ! : palmarès et batailles du jour"); }
  }
  if (g.escadrille && typeof g.escadrille === "object"){
    const mine = readKey("escadrille.best", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(g.escadrille.b || {})) if (/^(easy|normal|hard)$/.test(k) && v > 0 && (!mine[k] || v < mine[k])){ mine[k] = Math.round(v); n++; }
    if (n) writeKey("escadrille.best", mine);
    const vic = Math.round(Number(g.escadrille.v) || 0), myVic = Number(readKey("escadrille.victoires", 0)) || 0;
    if (vic > myVic) writeKey("escadrille.victoires", vic);
    const mySk = readKey("escadrille.skins", ["a"]) || ["a"], sk = ["a", "b", "c", "d"].filter(k => mySk.includes(k) || (Array.isArray(g.escadrille.s) && g.escadrille.s.includes(k)));
    const newSk = sk.length > mySk.length; if (newSk) writeKey("escadrille.skins", sk);
    if (!readKey("escadrille.skin", null) && /^[abcd]$/.test(g.escadrille.k || "") && sk.includes(g.escadrille.k)) writeKey("escadrille.skin", g.escadrille.k);
    // palmarès (avions débloqués au hangar) : le plus grand de chaque compte
    const ep = readKey("escadrille.palmares", {}) || {}; let np = 0;
    for (const k of ["easy", "normal", "hard"]) { const v = Math.round(Number((g.escadrille.p || {})[k]) || 0); if (v > (ep[k] || 0)){ ep[k] = v; np++; } }
    for (const k of ["rapide", "intacte"]) if ((g.escadrille.p || {})[k] === true && !ep[k]){ ep[k] = true; np++; }
    if (np) writeKey("escadrille.palmares", ep);
    if (n || vic > myVic || newSk || np) done.push(`Escadrille ! : ${n ? n + " record" + (n > 1 ? "s" : "") : vic > myVic ? "victoires" : newSk ? "escadrilles" : "avions"}`);
  }
  if (g.alunissage && typeof g.alunissage === "object"){
    const a = g.alunissage; let n = 0;
    if (a.b > (Number(readKey("alunissage.best", 0)) || 0)){ writeKey("alunissage.best", Math.round(a.b)); n++; }
    if (a.s > (Number(readKey("alunissage.sites", 0)) || 0)){ writeKey("alunissage.sites", Math.round(a.s)); n++; }
    const daily = readKey("alunissage.daily", {}) || {};
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("alunissage.daily", daily); done.push(`Alunissage : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.yams && typeof g.yams === "object"){
    const a = g.yams; let n = 0;
    if (a.b > (Number(readKey("yams.best", 0)) || 0)){ writeKey("yams.best", Math.round(a.b)); n++; }
    [["p", "parties"], ["y", "nbYams"], ["o", "bonus"]].forEach(([c, k]) => { if (a[c] > (Number(readKey("yams." + k, 0)) || 0)) writeKey("yams." + k, Math.round(a[c])); });
    if (n) done.push("Yams : record");
  }
  if (g.empilage && typeof g.empilage === "object"){
    const a = g.empilage; let n = 0;
    if (a.b > (Number(readKey("empilage.best", 0)) || 0)){ writeKey("empilage.best", Math.round(a.b)); n++; }
    if (a.p > (Number(readKey("empilage.parties", 0)) || 0)) writeKey("empilage.parties", Math.round(a.p));
    const daily = readKey("empilage.daily", {}) || {};
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("empilage.daily", daily); done.push(`Empilage : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.odyssee && typeof g.odyssee === "object"){
    const a = g.odyssee, stars = readKey("odyssee.stars", {}) || {}, best = readKey("odyssee.best", {}) || {}, daily = readKey("odyssee.daily", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(a.s || {})) if (/^\d{1,2}-[1-3]$/.test(k) && v >= 1 && v <= 3 && !(stars[k] >= v)){ stars[k] = Math.round(v); n++; }
    for (const [k, v] of Object.entries(a.b || {})) if (/^\d{1,2}-[1-3]$/.test(k) && v > 0 && !(best[k] <= v)) best[k] = Math.round(v);
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
    writeKey("odyssee.best", best);
    if (n){ writeKey("odyssee.stars", stars); writeKey("odyssee.daily", daily); done.push(`Odyssée : ${n} plateau${n > 1 ? "x" : ""} amélioré${n > 1 ? "s" : ""}`); }
  }
  if (g.doggysaga && typeof g.doggysaga === "object"){
    // fusion : pour chaque niveau, le plus d'étoiles ; l'album réunit les deux ; pour chaque journée, le plus de câlins
    const a = g.doggysaga, pr = readKey("doggysaga.progres", {}) || {}, et = Object.assign({}, pr.etoiles || {}), alb = (pr.album || []).slice(), daily = readKey("doggysaga.daily", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(a.e || {})) if (/^\d{1,2}$/.test(k) && v >= 1 && v <= 3 && !(et[k] >= v)){ et[k] = Math.round(v); n++; }
    for (const t of a.a || []) if (Number.isInteger(t) && t >= 0 && t < 16 && !alb.includes(t)){ alb.push(t); n++; }
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v >= 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("doggysaga.progres", Object.assign({etoiles: {}, scores: {}, album: []}, pr, {etoiles: et, album: alb})); writeKey("doggysaga.daily", daily); done.push(`Doggy Saga : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.jarls && typeof g.jarls === "object"){
    // fusion : pour chaque dieu, le plus d'étoiles ; pour chaque défi du jour, le plus haut score
    const a = g.jarls, camp = readKey("jarls.campagne", {}) || {}, et = Object.assign({}, camp.etoiles || {}), daily = readKey("jarls.daily", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(a.e || {})) if (/^[a-z]{2,10}$/.test(k) && v >= 1 && v <= 3 && !(et[k] >= v)){ et[k] = Math.round(v); n++; }
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v >= 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("jarls.campagne", Object.assign({}, camp, {etoiles: et})); writeKey("jarls.daily", daily); done.push(`Le Thé des Jarls : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.boutique && typeof g.boutique === "object"){
    // fusion : la meilleure boutique, et le plus grand nombre de parties (jouées, finies, faillites)
    const a = g.boutique, s = readKey("boutique.stats", {}) || {}; let n = 0;
    if (Number(a.b) > (Number(readKey("boutique.best", 0)) || 0)){ writeKey("boutique.best", Math.round(a.b)); n++; }
    for (const k of ["parties", "finies", "faillites"]) if (Number((a.s || {})[k]) > (Number(s[k]) || 0)){ s[k] = Math.round(a.s[k]); n++; }
    if (n){ writeKey("boutique.stats", s); done.push(`La Boutique de cartes : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.bannieres && typeof g.bannieres === "object"){
    // fusion : le plus de drapeaux, et le plus grand nombre de parties (jouées, gagnées)
    const a = g.bannieres, s = readKey("bannieres.stats", {}) || {}; let n = 0;
    if (Number(a.b) > (Number(readKey("bannieres.best", 0)) || 0)){ writeKey("bannieres.best", Math.round(a.b)); n++; }
    for (const k of ["parties", "gagnees"]) if (Number((a.s || {})[k]) > (Number(s[k]) || 0)){ s[k] = Math.round(a.s[k]); n++; }
    if (n){ writeKey("bannieres.stats", s); done.push(`Bannières : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.duche && typeof g.duche === "object"){
    // fusion : le meilleur score, et pour chaque Duché du jour le plus haut
    const a = g.duche, daily = readKey("duche.daily", {}) || {}; let n = 0;
    if (Number(a.b) > (Number(readKey("duche.best", 0)) || 0)){ writeKey("duche.best", Math.round(a.b)); n++; }
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("duche.daily", daily); done.push(`Duché : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.romet && typeof g.romet === "object"){
    // fusion : par machine, les trésors gagnés d'un côté ou de l'autre, le meilleur butin, le plus de parties
    const cur = readKey("romet.machines", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(g.romet)) { if (!/^[a-z]{2,12}$/.test(k) || !v || typeof v !== "object") continue;
      const c = cur[k] && typeof cur[k] === "object" ? cur[k] : {t: [], butin: 0, parties: 0}, t = Array.isArray(c.t) ? c.t.slice() : [];
      const vt = Array.isArray(v.t) ? v.t.slice(0, 6) : []; let ch = !cur[k];
      vt.forEach((x, i) => { if (x && !t[i]) { t[i] = true; ch = true; } }); for (let i = 0; i < Math.max(6, t.length); i++) t[i] = !!t[i];
      const b = Math.max(Number(c.butin) || 0, Math.round(Number(v.butin) || 0)), p = Math.max(Number(c.parties) || 0, Math.round(Number(v.parties) || 0));
      if (b !== (Number(c.butin) || 0) || p !== (Number(c.parties) || 0)) ch = true;
      if (ch) { cur[k] = {t: t.slice(0, 6), butin: b, parties: p}; n++; } }
    if (n){ writeKey("romet.machines", cur); done.push(`Romet : ${n} machine${n > 1 ? "s" : ""}`); }
  }
  if (g.magasinier && typeof g.magasinier === "object"){
    // fusion : pour chaque niveau, le moins de coups et le plus d'étoiles ; pour chaque grille du jour, le moins de coups
    const a = g.magasinier, niv = readKey("magasinier.niveaux", {}) || {}, daily = readKey("magasinier.daily", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(a.n || {})) { if (!/^\d{1,2}$/.test(k) || !v || !(v.coups > 0)) continue;
      const m = niv[k], et = Math.min(3, Math.max(1, Math.round(v.etoiles) || 1));
      if (!m || v.coups < m.coups || et > m.etoiles){ niv[k] = {coups: Math.round(m ? Math.min(m.coups, v.coups) : v.coups), etoiles: Math.max(et, m ? m.etoiles : 0)}; n++; } }
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("magasinier.niveaux", niv); writeKey("magasinier.daily", daily); done.push(`Le Magasinier : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.motdor && typeof g.motdor === "object" && g.motdor.s && typeof g.motdor.s === "object"){
    // fusion : le plus grand de chaque statistique ; pour chaque mot du jour, le moins d'essais
    const a = g.motdor.s, s = Object.assign({parties: 0, gagnees: 0, serie: 0, record: 0, dernier: 0, dist: [0, 0, 0, 0, 0, 0]}, readKey("motdor.stats", {}) || {});
    const daily = readKey("motdor.daily", {}) || {}; let n = 0;
    for (const k of ["parties", "gagnees", "record"]) if (Number(a[k]) > s[k]){ s[k] = Math.round(Number(a[k])); n++; }
    if (Number(a.dernier) > s.dernier){ s.dernier = Math.round(Number(a.dernier)); s.serie = Math.round(Number(a.serie) || 0); }
    if (Array.isArray(a.dist)) s.dist = s.dist.map((v, i) => Math.max(v, Math.round(Number(a.dist[i]) || 0)));
    for (const [k, v] of Object.entries(g.motdor.d || {})) if (/^\d{8}$/.test(k) && v >= 1 && v <= 6 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("motdor.stats", s); writeKey("motdor.daily", daily); done.push(`Le Mot d'or : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.capitaine && typeof g.capitaine === "object"){
    // fusion : pour chaque bassin, le moins de coups et le plus d'étoiles ; pour chaque bassin du jour, le moins de coups
    const a = g.capitaine, niv = readKey("capitaine.niveaux", {}) || {}, daily = readKey("capitaine.daily", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(a.n || {})) { if (!/^\d{1,2}$/.test(k) || !v || !(v.coups > 0)) continue;
      const m = niv[k], et = Math.min(3, Math.max(1, Math.round(v.etoiles) || 1));
      if (!m || v.coups < m.coups || et > m.etoiles){ niv[k] = {coups: Math.round(m ? Math.min(m.coups, v.coups) : v.coups), etoiles: Math.max(et, m ? m.etoiles : 0)}; n++; } }
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] <= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("capitaine.niveaux", niv); writeKey("capitaine.daily", daily); done.push(`Capitaine du port : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.pontstellaire && typeof g.pontstellaire === "object"){
    const p = g.pontstellaire, best = readKey("pontstellaire.best", {}) || {}, daily = readKey("pontstellaire.daily", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(p.b || {})) if (/^(7|9|11)$/.test(k) && v > 0 && !(best[k] > 0 && best[k] <= v)){ best[k] = Math.round(v); n++; }
    for (const [k, v] of Object.entries(p.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] > 0 && daily[k] <= v)){ daily[k] = Math.round(v); n++; }
    const w = Number(readKey("pontstellaire.wins", 0)) || 0;
    if (p.w > w){ writeKey("pontstellaire.wins", Math.round(p.w)); n++; }
    if (n){ writeKey("pontstellaire.best", best); writeKey("pontstellaire.daily", daily); done.push(`Pont stellaire : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.sudoku && typeof g.sudoku === "object"){
    const p = g.sudoku, best = readKey("sudoku.best", {}) || {}, daily = readKey("sudoku.daily", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(p.b || {})) if (/^(4|6|9-[123])$/.test(k) && v > 0 && !(best[k] > 0 && best[k] <= v)){ best[k] = Math.round(v); n++; }
    for (const [k, v] of Object.entries(p.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] > 0 && daily[k] <= v)){ daily[k] = Math.round(v); n++; }
    const w = Number(readKey("sudoku.wins", 0)) || 0;
    if (p.w > w){ writeKey("sudoku.wins", Math.round(p.w)); n++; }
    if (n){ writeKey("sudoku.best", best); writeKey("sudoku.daily", daily); done.push(`Sudoku : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.calculator && typeof g.calculator === "object"){
    const p = g.calculator, best = readKey("calculator.best", {}) || {}, daily = readKey("calculator.daily", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(p.b || {})){
      if (!/^(serie|chrono):[1-5]:(add|sub|mul|div|mix)$/.test(k) || !(v > 0)) continue;
      const low = k.startsWith("serie");
      if (!(best[k] > 0) || (low ? v < best[k] : v > best[k])){ best[k] = Math.round(v); n++; }
    }
    for (const [k, v] of Object.entries(p.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] > 0 && daily[k] <= v)){ daily[k] = Math.round(v); n++; }
    const pa = Number(readKey("calculator.parties", 0)) || 0;
    if (p.p > pa){ writeKey("calculator.parties", Math.round(p.p)); n++; }
    if (n){ writeKey("calculator.best", best); writeKey("calculator.daily", daily); done.push(`Calculator : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.nebula && typeof g.nebula === "object"){
    const a = g.nebula; let n = 0;
    if (a.b > (Number(readKey("nebula.best", 0)) || 0)){ writeKey("nebula.best", Math.round(a.b)); n++; }
    // statistiques : on garde le maximum de chaque compteur (les données stellaires ne s'additionnent pas, sinon un aller-retour les doublerait)
    if (a.m && typeof a.m === "object"){
      const mine = readKey("nebula.meta", {}) || {}; let ch = false;
      for (const [k, v] of Object.entries(a.m)) if (typeof v === "number" && v > (Number(mine[k]) || 0)){ mine[k] = v; ch = true; }
      // déblocages : on réunit les deux listes (le solde est recalculé par le jeu : données gagnées - coût des déblocages)
      if (Array.isArray(a.m.unlocked)){ const u = new Set(Array.isArray(mine.unlocked) ? mine.unlocked : []); for (const x of a.m.unlocked) if (typeof x === "string" && /^[a-z]{1,16}$/.test(x) && !u.has(x)){ u.add(x); ch = true; } mine.unlocked = [...u]; }
      if (ch){ writeKey("nebula.meta", mine); n++; }
    }
    const daily = readKey("nebula.daily", {}) || {};
    for (const [k, v] of Object.entries(a.d || {})) if (/^\d{8}$/.test(k) && v > 0 && !(daily[k] >= v)){ daily[k] = Math.round(v); n++; }
    if (n){ writeKey("nebula.daily", daily); done.push(`Nebula : ${n} record${n > 1 ? "s" : ""}`); }
  }
  if (g.orbite && typeof g.orbite === "object"){
    const mine = readKey("orbite.stars", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(g.orbite)) if (/^\d{1,2}$/.test(k) && v >= 1 && v <= 3 && !(mine[k] >= v)){ mine[k] = Math.round(v); n++; }
    if (n){ writeKey("orbite.stars", mine); done.push(`Orbite : ${n} niveau${n > 1 ? "x" : ""} amélioré${n > 1 ? "s" : ""}`); }
  }
  if (g.lunerover && typeof g.lunerover === "object"){
    const mine = readKey("lunerover.stars", {}) || {}; let n = 0;
    for (const [k, v] of Object.entries(g.lunerover)) if (/^\d{1,2}$/.test(k) && v >= 1 && v <= 3 && !(mine[k] >= v)){ mine[k] = Math.round(v); n++; }
    if (n){ writeKey("lunerover.stars", mine); done.push(`Lune-Rover : ${n} niveau${n > 1 ? "x" : ""} amélioré${n > 1 ? "s" : ""}`); }
  }
  if (g.ligneeDaily && typeof g.ligneeDaily === "object"){
    const mine = readKey("lignee.daily", {}) || {}; let n = 0;
    for (const [code, t] of Object.entries(g.ligneeDaily)) if (/^[CR]2-J[0-9A-Z]+$/.test(code) && t > 0 && (!mine[code] || t < mine[code])){ mine[code] = Math.round(t); n++; }
    if (n){ writeKey("lignee.daily", mine); done.push(`Lignée : ${n} Arbre${n > 1 ? "s" : ""} du jour`); }
  }
  return done;
}
const savesRes = (t, ok) => { const el = document.getElementById("savesRes"); el.textContent = t; el.className = "res " + (ok ? "ok" : "err"); };
function showSum(){
  const lines = describeSaves(collectSaves());
  document.getElementById("savesSum").innerHTML = lines.length ? "Dans ce navigateur :<br>" + lines.map(l => "· " + l).join("<br>") : "Aucune sauvegarde dans ce navigateur pour l'instant.";
}
document.getElementById("savesBtn").addEventListener("click", () => {
  const box = document.getElementById("saves"); box.hidden = !box.hidden;
  document.getElementById("savesBtn").setAttribute("aria-expanded", !box.hidden);
  if (!box.hidden){ showSum(); box.scrollIntoView({behavior: "smooth", block: "start"}); }
});
document.getElementById("exportAll").addEventListener("click", () => {
  const g = collectSaves(), box = document.getElementById("exportAllBox");
  const code = "LUDO1-" + btoa(unescape(encodeURIComponent(JSON.stringify({v: 1, g}))));
  box.value = code; box.hidden = false;
  const fallback = () => { box.focus(); box.select(); savesRes("Copie automatique impossible ici : appuie longuement sur le code, puis Copier.", false); };
  try { navigator.clipboard.writeText(code).then(() => savesRes("Sauvegardes copiées. Colle-les dans l'autre navigateur.", true), fallback); } catch (e) { fallback(); }
});
document.getElementById("pasteAll").addEventListener("click", async () => {
  try { const t = await navigator.clipboard.readText(); if (t){ document.getElementById("importAllBox").value = t; savesRes("Code collé. Appuie sur IMPORTER.", true); return; } } catch (e) {}
  document.getElementById("importAllBox").focus(); savesRes("Appuie longuement dans la case, puis Coller.", false);
});
document.getElementById("importAll").addEventListener("click", () => {
  try {
    const done = mergeSaves(decodeSaves(document.getElementById("importAllBox").value));
    savesRes(done.length ? "Importé. " + done.join(" · ") + "." : "Rien de nouveau : ces sauvegardes sont déjà à jour ici.", true);
    document.getElementById("importAllBox").value = ""; showSum();
    if (done.length && window.LudoScores) LudoScores.resync();
  } catch (e) { savesRes(e.message, false); }
});
if (/FBAN|FBAV|FB_IAB|Instagram/i.test(navigator.userAgent)) document.getElementById("fbNote").hidden = false;


/* installation : bouton sur Android et ordinateur, explication sur iPhone */
const installBox = document.getElementById("install"), installBtn = document.getElementById("installBtn"), iosHelp = document.getElementById("iosHelp");
const installed = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
let deferredPrompt = null;
if (!installed){
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferredPrompt = e; installBox.hidden = false; installBtn.hidden = false; });
  window.addEventListener("appinstalled", () => { installBox.hidden = true; deferredPrompt = null; });
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } catch (e) {}
    deferredPrompt = null; installBtn.hidden = true; installBox.hidden = iosHelp.hidden;
  });
}
if ("serviceWorker" in navigator && (location.protocol === "https:" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname))){
  navigator.serviceWorker.register("sw.js").then(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (ios && !installed){ installBox.hidden = false; iosHelp.hidden = false; }
  }).catch(() => {});
}
window.Accueil = { collectSaves, decodeSaves, mergeSaves };   // pour les tests (outils/logique.js)
})();

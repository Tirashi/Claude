(() => {
"use strict";
const ROOT = "";   // dossier du site (l'artefact y met l'adresse complète du site publié)
const L = window.LudoScores;   // absent dans l'artefact : pas de classement
const $ = id => document.getElementById(id);
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- les jeux : l'ordre des cartouches ; tout le reste est dans la fiche de chaque jeu ---------- */
// À TENIR À JOUR pour un nouveau jeu : sa fiche <dossier>/fiche.js (mode d'emploi en tête d'accueil-outils.js), son chemin ici,
// sa ligne <script src> dans index.html, la fiche dans FILES de sw.js, son icône dans icones.js ; une ligne dans NEWS.
const ORDRE = [
  "picross/index.html",
  "lignee/index.html",
  "queens/index.html",
  "injagility/index.html",
  "solitaire/index.html",
  "touche-coule/index.html",
  "amiral/index.html",
  "escadrille/index.html",
  "club/index.html",
  "orbite/index.html",
  "alunissage/index.html",
  "pont-stellaire/index.html",
  "lune-rover/index.html",
  "sudoku/index.html",
  "calculator/index.html",
  "empilage/index.html",
  "yams/index.html",
  "odyssee/index.html",
  "doggy-saga/index.html",
  "the-des-jarls/index.html",
  "duche/index.html",
  "dragon-simulator/index.html",
  "mineur-de-l-espace/index.html",
  "resistance/index.html",
  "boutique/index.html",
  "bannieres/index.html",
  "lanterne/index.html",
  "terres-franches/index.html",
  "bastion/index.html",
  "mot-d-or/index.html",
  "capitaine-du-port/index.html",
  "romet/index.html",
  "magasinier/index.html",
  "nebula/index.html",
  "tetris/index.html",
  "snake/index.html",
  "asteroids/index.html",
  "jeu-de-la-vie/index.html",
  "pokedex/index.html",
];
// la cartouche de chaque jeu vient de sa fiche (une fiche absente ou fautive fait disparaître la cartouche, pas l'accueil)
const FICHES = Ludo.fiches;
const GAMES = ORDRE.filter(k => FICHES[k] && FICHES[k].carte).map(k => Object.assign({k}, FICHES[k].carte));
const NEBULA_IMG = "nebula/cartouche.jpg";
const FAMSTYLE = {"16": "A", "32": "C", rep: "B", "3d": "D"};

/* ---------- accueil : dates de sortie et de mise à jour, genres, jeu à la une, quoi de neuf ---------- */
// Dans la fiche : `added` (sortie) et `updated` (dernière mise à jour visible) au format AAAA-MM-JJ, `genres` pour les filtres.
// Une cartouche porte l'étiquette NEUF ou MAJ pendant 3 jours.
const META = {};   // rempli par les fiches (meta)
// le journal (bouton JOURNAL de l'accueil) : [date, genre, dossier du jeu, texte], du plus récent au plus ancien ;
// genre "neuf" (nouveau jeu ou démo), "maj" (mise à jour d'un jeu) ou "acc" (accueil, classements : dossier vide).
// Un numéro du journal par mois ; la plus récente nouveauté du mois fait la couverture.
const NEWS = [
  ["2026-11-08", "neuf", "terres-franches", "Terres franches, première ère : un pionnier, une tente et un feu au bord d'une rivière. Récolte, accueille des villageois, donne-leur un métier (bûcheron, pêcheur, fermier, meunier, boulanger…) et bâtis : le jeu propose le terrain le plus logique et trace les rues, tu peux tout déplacer. Le campement devient hameau puis village, et la colonie travaille encore (doucement) quand l'appli est fermée."],
  ["2026-11-07", "neuf", "pokedex", "Le premier atelier : un Pokédex avec les 1025 Pokémon en français. Pour chacun, son dessin, ses types, ses évolutions et ce qu'on sait de lui. Cherche par nom, numéro ou type, et l'onglet Types te dit qui gagne : choisis l'attaque et le Pokémon qui défend, il donne les dégâts."],
  ["2026-11-07", "acc", "", "Une nouvelle étagère sous les jeux : les ATELIERS, des outils pour apprendre et créer. On y trouve le Pokédex, Calculator et le Jeu de la vie."],
  ["2026-11-07", "neuf", "bastion", "Un mélange de jeu de stratégie en temps réel et de tower defense, avec les graphismes de Tiny Swords. Tes ouvriers récoltent bois, or et viande ; bâtis, recrute des escouades qui gagnent des grades, mets des archers en garnison dans les tours et défends le château contre dix vagues de monstres et leur troll. Cette première version est un laboratoire : vitesse, robot, simulateur et tous les réglages, pour trouver ensemble le bon équilibre."],
  ["2026-11-06", "acc", "", "Le Quoi de neuf devient le journal : un numéro par mois, la grande nouveauté en couverture, et une pastille rouge sur le bouton JOURNAL quand il y a du neuf."],
  ["2026-11-02", "neuf", "dragon-simulator", "Une idée d'un garçon de 7 ans. Ton dragon s'élance de son nid et plane au-dessus de la ville puis de l'aéroport, vu de profil, en 3D. Touche l'écran pour battre des ailes, tiens le bouton FEU pour brûler immeubles, maisons et voitures, évite grues, montgolfières et hélicoptères, et ramasse dix bonus (jetpack, grenade, bébé dragon, super-souffle, nuage d'orage, bouclier, aimant, œuf d'or…). Plus tu vas loin, plus tu gagnes de pièces : au nid, améliore écailles, flammes, réserve de feu et ailes."],
  ["2026-11-01", "neuf", "mineur-de-l-espace", "Casse des astéroïdes avec ta corvette et rapporte le minerai à la station : améliorations, usines, recherche, station construite module par module, drones qui minent seuls, voyages vers la Lune et Mars, bases, puis vagues d'aliens, flottes, porte-vaisseaux à escadrille et bataille finale contre le vaisseau-mère. Au PC : clavier et souris."],
  ["2026-10-28", "neuf", "resistance", "Un rogue-lite tactique façon Fire Emblem GBA. Recrute trois rebelles, traverse les Marches de l'Ouest de combat en combat (marchand, repos, événements) et abats le général du tyran. Défaite ou victoire, tu rapportes du ravitaillement pour agrandir la forteresse rebelle : chaque bâtiment rend les campagnes suivantes plus fortes."],
  ["2026-10-23", "neuf", "boutique", "Une année à la tête d'une boutique de cartes à collectionner, en 3D. Le lundi, commande au grossiste, fixe tes prix, ouvre des boosters et range les meilleures cartes en vitrine ou dans ton classeur ; du mardi au samedi, regarde les clients entrer et acheter ; le dimanche, fais tes comptes. Aménage, agrandis, organise des tournois et rembourse la banque avant la semaine 26 !"],
  ["2026-10-23", "neuf", "doggy-saga", "Un trois en ligne pour toute la famille. Glisse les chiens du refuge pour en aligner 3 pareils : chaque chien aligné reçoit un câlin. Bandanas, nœuds et balles de tennis lancent de grosses cascades. Lave la boue, ouvre les niches, fais descendre les chiots jusqu'à leur panier, et trouve une famille aux 16 chiens (dont Nounours le bouvier bernois) dans 60 niveaux. Chaque jour, la journée du jour : 20 coups, le plus de câlins possible."],
  ["2026-10-22", "neuf", "romet", "Un coin pusher en 3D en hommage à Mynthos. Lâche tes pièces, le poussoir fait tomber les autres dans le bac : ce qui tombe se rejoue, jusqu'à ce que la bourse soit vide. Gagne les 6 trésors de chaque machine pour ouvrir la suivante : la foire, la ruche et son miel, l'épave et son courant, le casino et ses couloirs, la foire de nuit et ses clous, l'horloger à deux étages… et une machine secrète."],
  ["2026-10-22", "neuf", "bannieres", "Un jeu de conquête en 3D pensé pour les enfants. Choisis ta couleur, fais courir tes armées de chevaliers, d'archers, de lanciers et de mages sur la carte, achète des guerriers au château, construis, agrandis et décore ton village, et regarde les batailles avec les cœurs au-dessus des guerriers. Des étoiles disent si une bataille est facile. Prends les 3 châteaux des autres seigneurs, ou aie le plus de drapeaux après 25 tours !"],
  ["2026-10-22", "neuf", "lanterne", "Un RPG au tour par tour en HD-2D. Avec ton équipe (lame, clerc, arcaniste), traverse Clairfond, l'abbaye et le Bois Murmurant, rallume les lanternes oubliées et descends dans la Crypte des racines affronter le Roi des aulnes. Le prologue et l'acte 1 sont jouables, la suite arrive."],
  ["2026-10-21", "neuf", "the-des-jarls", "Un duel de dés viking. Six dés, trois lancers, et chaque face envoie ton armée de 45 soldats à l'assaut : charge des haches, volée de flèches, éclaireurs qui volent les jetons. Invoque les faveurs de 20 dieux nordiques, apprends avec Sigrid la skalde, remonte la route du fjord de taverne en taverne (étoiles, couleurs, unités à gagner), joue à deux sur le même téléphone posé à plat, et tente le défi du jour."],
  ["2026-10-21", "neuf", "duche", "Un petit 4X au tour par tour sur 37 terres hexagonales. Bâtis, recrute, prends les terres des trois seigneurs rivaux et gagne la couronne quand le vieux roi meurt : un grand électeur vote un tour sur deux. Combats en scènes HD-2D, événements illustrés, partie libre (facile ou normal) et un Duché du jour pour toute la famille, une seule tentative classée."],
  ["2026-10-20", "neuf", "mot-d-or", "Un mot de 6 lettres par jour à trouver en 6 essais. Les tuiles se retournent en or (bien placée), en argent (mal placée) ou en gris (absente). Le même mot pour toute la famille, une seule tentative classée, une série de jours à faire durer, et un entraînement pour rejouer autant qu'on veut."],
  ["2026-10-20", "neuf", "capitaine-du-port", "Un casse-tête de bateaux en pixel art 32 bits. Glisse les bateaux du bassin pour ouvrir la passe au navire doré, dans 60 bassins et 5 ports (bouées, épaves, grands navires de 4 cases, grand port en 7 × 7), et tente le bassin du jour : une seule tentative classée, au plus petit nombre de coups."],
  ["2026-10-20", "neuf", "magasinier", "Un Sokoban en HD-2D façon Octopath Traveler. Pousse les caisses sur les marques dans 60 niveaux et 5 entrepôts (glace, tapis roulants, caisses en fonte), et tente la grille du jour : une seule tentative classée, au plus petit nombre de coups."],
  ["2026-10-19", "acc", "", "Accueil retouché : le nom de chaque jeu sous sa cartouche, une légende des marques sous le gardien, le jeu à la une en bandeau, un volet plus léger (titre qui reste en haut, JOUER dans sa barre, le classement se rejoint en bas de l'accueil)."],
  ["2026-10-19", "maj", "escadrille", "Choisis tes avions au hangar (onglet AVIONS). Six nouveaux avions à débloquer, dans les quatre familles : le bombardier d'attaque et ses roquettes, le ravitailleur qui remet un avion à neuf, l'avion de patrouille qui compte une ligne et une colonne, le brouilleur et ses leurres, les ballons de barrage et leur DCA, le drone et sa caméra. Les pirates s'en servent aussi en Pilote et en As."],
  ["2026-10-19", "maj", "amiral", "Trois navires à débloquer au chantier naval (le mouilleur et ses mines qui ripostent, le brouilleur et son écran de fumée, la vedette et son faux navire gonflable) et la bataille du jour, avec ses flottes imposées et son classement."],
  ["2026-10-17", "acc", "", "Défi du jour : un rond jaune sur la cartouche quand il reste à jouer, un rond sombre avec ✓ quand c'est fait (Queens, Sudoku, Pont stellaire, Lignée, Alunissage, Nebula, Calculator, Empilage, Odyssée)."],
  ["2026-10-17", "neuf", "yams", "Le troisième jeu en 3D. De vrais dés qui roulent et rebondissent, lancés d'un geste ou secoués dans un gobelet, la feuille de marque classique en 13 cases, et six styles de dés à débloquer (taverne, casino de nuit, gros pixels rétro, sur la Lune…)."],
  ["2026-10-17", "maj", "escadrille", "Le hangar et trois escadrilles à débloquer (Furtif, Hélices, Canonnière), un sol différent à chaque partie, et les pilotes abattus sautent en parachute."],
  ["2026-10-17", "neuf", "escadrille", "La petite sœur d'Amiral ! dans le ciel. Quatre avions à pouvoirs (radar, bombes en croix, missile, esquive de l'hélicoptère) sur un ciel de 9 × 9, contre une escadrille pirate cachée dans les nuages. Trois niveaux : Recrue, Pilote, As."],
  ["2026-10-17", "neuf", "odyssee", "Le deuxième jeu en 3D. Penche le téléphone (ou glisse le doigt) pour ramener la galère d'Ulysse de Troie à Ithaque : 10 épisodes de 3 plateaux, de Polyphème aux Sirènes en passant par Charybde et Scylla, et un plateau du jour pour toute la famille."],
  ["2026-10-16", "acc", "", "Accueil : les jeux en 3D ont leur propre cartouche, un CD dans un boîtier translucide couleur bonbon. Empilage est le premier à l'avoir."],
  ["2026-10-16", "neuf", "empilage", "Le premier jeu en 3D de la Ludothèque. Touche pour lâcher chaque bloc pile sur la tour ; ce qui dépasse tombe. Le ciel passe du matin à la nuit étoilée à mesure que tu montes. Tour du jour : les mêmes vitesses pour toute la famille."],
  ["2026-10-16", "neuf", "calculator", "Le calcul mental de 7 à 77 ans. Choisis tes opérations et ton niveau (de Petit écolier à Champion), joue une série de 20, 60 secondes contre la montre ou le calcul du jour. Trois styles au choix : arcade, cahier d'écolier ou calculatrice de poche."],
  ["2026-10-16", "neuf", "lune-rover", "Programme Pico, le petit robot lunaire, à l'avance pour ramasser les cristaux : 30 niveaux, avec sauts, fonction F1, répétitions, boucles et conditions."],
  ["2026-10-16", "acc", "", "Classements : le même compte sur plusieurs navigateurs. Sous les cartouches, CODE DE MON COMPTE ; dans l'autre navigateur, REJOINDRE LE CLASSEMENT puis J'AI DEJA UN COMPTE. Les sauvegardes restent dans chaque navigateur."],
  ["2026-10-16", "acc", "", "Nouvel accueil : les cartouches en 3D sur leurs planches (16 bits, 32 bits et reprises). Touche une cartouche : sa boîte, tes records et le classement de la famille, au même endroit. La page des classements disparaît."],
  ["2026-10-16", "neuf", "sudoku", "Le jardin des chiffres. Grilles 4×4 et 6×6 pour débuter, 9×9 facile, moyen ou difficile, notes au crayon et grille du jour pour toute la famille."],
  ["2026-10-15", "acc", "", "Accueil : filtre EN COURS pour retrouver les parties commencées, et sur chaque cartouche ta partie en cours et ton record."],
  ["2026-10-15", "acc", "", "Défis du jour : dans Queens, Pont stellaire et Alunissage, seule la première tentative du jour est classée (la partie en cours se reprend au même temps)."],
  ["2026-10-15", "maj", "queens", "La grille du jour, la même pour toute la famille, de 5×5 le lundi à 9×9 le week-end, avec son classement."],
  ["2026-10-15", "maj", "alunissage", "Nouveaux graphismes, avec la lumière du soleil et les ombres, un décor par monde, un module plus détaillé, l'astronaute et son drapeau, l'explosion et son cratère."],
  ["2026-10-15", "maj", "alunissage", "Des cadrans près du module (réticule qui passe au vert, carburant, vitesses, aire survolée, flèche de dérive et hauteur jusqu'au sol)."],
  ["2026-10-15", "acc", "", "Accueil : bouton SURPRENDS-MOI (un jeu au hasard), tri des cartouches et recherche. Classements : la nouvelle étagère de boîtes de jeu, avec une couronne sur tes records."],
  ["2026-10-15", "maj", "nebula", "Nouveaux sons, armes étouffées, saut en hyperespace, musique de combat et marche sur la carte (réglage AMBIANCE)."],
  ["2026-10-15", "maj", "nebula", "Quatre nouveaux vaisseaux, le brouilleur et le mouilleur de mines dans ta flotte, la frégate-bouclier et le poseur de mines chez les pirates."],
  ["2026-10-15", "maj", "nebula", "La partie du jour devient la mission du jour, avec chaque jour une flotte et une règle imposées (convoi à protéger, comptoirs fermés, carburant compté…)."],
  ["2026-10-15", "maj", "nebula", "Un contrat à choisir au départ de chaque partie et un défi dans chaque combat, pour gagner points, données et crédits."],
  ["2026-10-15", "maj", "nebula", "Compose ta flotte de départ avec 10 points (prime d'audace pour les points non dépensés) ; la flotte arrive en combat par le bas de l'écran."],
  ["2026-10-15", "acc", "", "La Ludothèque s'ouvre plus vite sur un réseau lent ; Nebula marche hors connexion dès la première visite et ménage la batterie."],
  ["2026-10-15", "maj", "nebula", "Nouveaux bruitages (grappin, ions, salve, renforts), nappe d'ambiance en option, saut et débris animés."],
  ["2026-10-15", "maj", "nebula", "Un doigt posé ouvre la fiche d'un vaisseau ou d'une balise, animations ×2, vibrations, confirmation de fin de tour."],
  ["2026-10-14", "maj", "nebula", "Un entraînement guidé en 5 étapes, et au hangar l'effet de chaque pilote sur chaque vaisseau."],
  ["2026-10-14", "maj", "nebula", "Un manuel complet (règles, fiches des vaisseaux et des pirates, terrain, balises, modules, pilotes)."],
  ["2026-10-14", "maj", "nebula", "La partie du jour (la même pour toute la famille) et les classements du jour et des victoires."],
  ["2026-10-14", "maj", "nebula", "Déblocages avec les données stellaires, flottes de choc et marchande."],
  ["2026-10-14", "maj", "nebula", "Épaves à choix, nébuleuses et pilotes (As, Mécano, Tireur, Prudent, Vétéran)."],
  ["2026-10-14", "maj", "nebula", "Les secteurs 2 et 3, leurs nuages ioniques, la Veuve d'Orphée, la Rouille-Reine et la victoire finale."],
  ["2026-10-14", "maj", "nebula", "Placement des vaisseaux au doigt plus sûr (aperçu, replacement), 5 nouveaux vaisseaux au comptoir et le harponneur pirate."],
  ["2026-10-14", "maj", "nebula", "Capacités affichées sur les fiches, légende de la carte, drones au toucher, pirates plus rusés dans les contacts lourds."],
  ["2026-10-13", "acc", "", "Accueil : favoris (étoile), filtres en menu de RPG avec le gardien, jeu à la une et badges des nouveautés."],
  ["2026-10-13", "neuf", "nebula", "Nouveau rogue-lite tactique spatial, secteur 1 jusqu'à l'amiral rouillé. Plus fluide et plus net."],
  ["2026-10-13", "neuf", "alunissage", "Nouveau jeu d'adresse, avec la mission du jour."],
  ["2026-10-12", "neuf", "pont-stellaire", "Nouveau puzzle de constellations, avec le ciel du jour."],
  ["2026-10-12", "neuf", "orbite", "Nouveau jeu de physique spatiale en 30 niveaux."],
  ["2026-10-12", "neuf", "club", "Nouveau jeu de gestion de club canin."]
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

/* ---------- parties en cours et records, lus dans les sauvegardes de chaque jeu (sans toucher aux jeux ; rk, num… : accueil-outils.js) ---------- */
// ce qui attend d'être repris (null si rien)
const PROGRESS = {};   // rempli par les fiches (enCours)
// défi du jour : null = pas de défi du jour, false = à faire, true = joué (puzzles : réussi ; missions : tentative commencée)
const TODAY = {};   // rempli par les fiches (duJour)
const dailyState = g => { try { return TODAY[g.k] ? TODAY[g.k]() : null; } catch (e) { return null; } };
const inProgress = g => { try { return (PROGRESS[g.k] || (() => null))(); } catch (e) { return null; } };
// mes records sur ce téléphone, pour le volet : [libellé, valeur] (les lignes sans valeur sont cachées)
const RECS = {};   // rempli par les fiches (records)
const myRecords = g => { try { return (RECS[g.k] || (() => []))().filter(r => r[1]); } catch (e) { return []; } };
const NICE = {};   // nom dans les phrases du gardien (fiches : nom ; sinon le nom de la cartouche)
for (const f of GAMES.map(g => FICHES[g.k])){
  if (f.meta) META[f.k] = f.meta;
  if (f.enCours) PROGRESS[f.k] = f.enCours;
  if (f.duJour) TODAY[f.k] = f.duJour;
  if (f.records) RECS[f.k] = f.records;
  if (f.nom) NICE[f.k] = f.nom;
}

/* ---------- les cartouches ---------- */
// l'image d'un jeu : icône 16×16 (le chien est plus large), ou la capture de Nebula
function art(g){
  if (g.ic === "img"){ const i = new Image(); i.src = ROOT + NEBULA_IMG; i.alt = ""; return i; }
  const c = document.createElement("canvas");
  if (g.ic === "dog"){ c.width = 78; c.height = 54; c.className = "wide"; } else c.width = c.height = 16;
  LudoIcons.draw(c, g.ic);
  return c;
}
// un atelier n'est pas un jeu : c'est l'objet qu'il imite, posé sur l'étagère (carte.objet ; maquette maquettes/accueil-ateliers.html, direction F)
const OBJETS = {
  dex: '<span class="dexo"><i class="lent"></i><i class="pt p1"></i><i class="pt p2"></i><i class="pt p3"></i><span class="ecr" data-ic="dex"></span><i class="bt b1"></i><i class="bt b2"></i></span>',
  calc: '<span class="calco"><span class="lcd">7+5=12</span><span class="touches">' + "<i></i><i></i><i></i><i class='o'></i>".repeat(3) + '<i></i><i></i><i class="g"></i></span></span>',
  petri: '<span class="petri"><i class="ombre"></i><span class="verre"></span><span class="gel" data-ic="glider"></span></span>'
};
function objet(g, i){
  const b = el("button", "c3 objet");
  b.type = "button"; b.dataset.k = g.k; b.style.cssText = `--i:${i}`;
  const o = el("span", "obj"); o.innerHTML = OBJETS[g.objet] || "";
  o.querySelectorAll("[data-ic]").forEach(e => { const c = document.createElement("canvas"); c.width = c.height = 16; LudoIcons.draw(c, e.dataset.ic); e.append(c); });
  b.append(o, el("b", "nm", g.n));
  return b;
}
// une cartouche en 3D : six faces ; la face avant change selon la famille
function cart(g, i){
  if (g.objet) return objet(g, i);
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
  if (!b.querySelector(".body")){ b.classList.remove("hop"); void b.offsetWidth; b.classList.add("hop"); return; }   // un objet d'atelier saute
  b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
  b.querySelector(".body").addEventListener("animationend", () => b.classList.remove("spin"), {once: true});
}
const rack = $("rack"), rackAtelier = $("rackAtelier"), order = new Map(GAMES.map((g, i) => [g, i]));
let crownSet = new Set();
GAMES.forEach((g, i) => {
  g.el = cart(g, i);
  let timer = 0;
  g.el.addEventListener("click", () => { clearTimeout(timer); if (still()) return openVolet(g); spin(g.el); timer = setTimeout(() => openVolet(g), 480); });
  g.el.addEventListener("focus", () => select(carts.indexOf(g)));
  (g.atelier ? rackAtelier : rack).appendChild(g.el);
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
  if (!!a.atelier !== !!b.atelier) return a.atelier ? 1 : -1;   // les ateliers après les jeux (étagère du dessous)
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
  GAMES.slice().sort(compare).forEach(g => { g.el.hidden = !shows(g); (g.atelier ? rackAtelier : rack).appendChild(g.el); });
  sortBtn.innerHTML = `TRI <b>${SORTS.find(x => x[0] === sortBy)[2]}</b>`; sortBtn.setAttribute("aria-label", "Changer le tri (actuel : " + SORTS.find(x => x[0] === sortBy)[1].toLowerCase() + ")");
  [...fbar.children].forEach(b => b.setAttribute("aria-pressed", b.dataset.f === filter));
  const vis = GAMES.filter(g => !g.el.hidden), n = vis.length, jeux = n > 1 ? "jeux" : "jeu";
  rack.hidden = !vis.some(g => !g.atelier);
  rackAtelier.hidden = $("atelierTitre").hidden = !vis.some(g => g.atelier);
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

/* ---------- le journal (Quoi de neuf) : un numéro par mois, façon magazine de jeux vidéo ---------- */
// bouton JOURNAL de la barre d'outils, avec une pastille rouge tant qu'il y a du neuf pas encore lu (ludo.journalVu = date de la dernière nouvelle vue)
const MOIS = ["JANVIER", "FEVRIER", "MARS", "AVRIL", "MAI", "JUIN", "JUILLET", "AOUT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DECEMBRE"];
const jov = $("jov"), jBody = $("jBody"), jClose = $("jClose"), jBtn = $("journalBtn");
const jOpen = () => jov.classList.contains("on");
const JTAG = {neuf: "NEUF", maj: "MAJ", acc: "ACCUEIL"};
const newsGame = n => n[2] ? GAMES.find(g => g.k === n[2] + "/index.html") || null : null;
let jSeen = ""; try { jSeen = localStorage.getItem("ludo.journalVu") || ""; } catch (e) {}
// pas encore lu : plus récent que la dernière visite au journal (première fois : les 14 derniers jours)
const unread = () => NEWS.filter(n => jSeen ? n[0] > jSeen : daysSince(n[0]) < 14).length;
function paintJournal(){ const n = unread(), b = $("journalN"); b.textContent = n > 9 ? "9+" : n; b.hidden = !n; }
function jIcon(g){
  const b = el("i", "j-ic");
  if (!g){ b.classList.add("ludo"); b.textContent = "LUDO"; return b; }
  b.style.setProperty("--lb", g.lb); b.append(art(g)); return b;
}
const jTag = (n, g) => el("span", "j-tag " + n[1], g && g.demo && n[1] === "neuf" ? "DEMO" : JTAG[n[1]] || "");
function jGo(g){
  // du journal au volet du jeu : le volet prend la place du journal dans l'historique (un seul retour pour revenir à l'accueil)
  hideJournal(); try { if (history.state && history.state.journal) history.replaceState({volet: g.k}, ""); } catch (e) {}
  openVolet(g);
}
function jRow(n){
  const g = newsGame(n), r = el(g ? "button" : "div", "j-row"), t = el("div", "t"), h = el("div");
  if (g){ r.type = "button"; r.addEventListener("click", () => jGo(g)); }
  h.append(jTag(n, g), el("strong", "", g ? g.n : "LA LUDOTHEQUE"), el("span", "j-date", fmtDay(n[0])));
  t.append(h, el("p", "", n[3])); r.append(jIcon(g), t); return r;
}
let jIssue = 0;   // numéro affiché (0 = le plus récent)
function renderJournal(){
  jBody.textContent = "";
  const issues = [];   // un numéro par mois, du plus récent au plus ancien
  for (const n of NEWS){ const ym = n[0].slice(0, 7); if (!issues.length || issues[issues.length - 1].ym !== ym) issues.push({ym, news: []}); issues[issues.length - 1].news.push(n); }
  const label = ym => { const [y, m] = ym.split("-").map(Number); return `N° ${(y - 2026) * 12 + m - 9} · ${MOIS[m - 1]} ${y}`; };
  jIssue = Math.min(jIssue, issues.length - 1);
  const cur = issues[jIssue]; if (!cur) return;
  const mast = el("div", "j-mast"); mast.append(el("b", "", "LUDO MAG"), el("span", "", label(cur.ym))); jBody.append(mast);
  // les numéros, en haut (bien visibles, même sur un grand écran) : toucher un numéro l'affiche
  if (issues.length > 1){
    const row = el("div", "chips j-issues");
    issues.forEach((is, i) => {
      const [y, m] = is.ym.split("-").map(Number), b = button(`N° ${(y - 2026) * 12 + m - 9} · ${MOIS[m - 1]}`, i === jIssue, () => { jIssue = i; renderJournal(); $("journal").scrollTop = 0; });
      row.append(b);
    });
    jBody.append(row);
  }
  // la couverture : la plus récente nouveauté du mois
  const top = cur.news.find(n => n[1] === "neuf" && newsGame(n));
  if (top){
    const g = newsGame(top), feat = el("div", "j-feat"), cv = el("button", "j-cover"), artBox = el("span", "art"), t = el("div", "t");
    cv.type = "button"; cv.setAttribute("aria-label", "Ouvrir " + g.n); cv.style.setProperty("--lb", g.lb); feat.style.setProperty("--lt", g.lt);
    artBox.append(art(g)); cv.append(el("span", "sp"), artBox);
    if (recent(top[0])) cv.append(el("span", "stk", "TOUT NEUF !"));
    cv.addEventListener("click", () => jGo(g));
    const play = link("saves-btn play", "JOUER ▶", g.k, g.k);
    t.append(el("span", "k", (g.demo ? "DEMO" : "EN COUVERTURE") + " · " + fmtDay(top[0])), el("h3", "", g.n), el("p", "", top[3]), play);
    feat.append(cv, t); jBody.append(feat);
  }
  const others = cur.news.filter(n => n !== top && n[1] === "neuf" && newsGame(n));
  if (others.length){
    jBody.append(el("div", "j-sect", jIssue ? "SORTIS CE MOIS-LA" : "SORTIS CE MOIS-CI"));
    const box = el("div", "j-minis");
    for (const n of others){
      const g = newsGame(n), b = el("button", "j-mini"), h = el("div"); b.type = "button";
      h.append(jIcon(g), el("strong", "", g.n)); b.append(h, el("p", "", n[3])); b.addEventListener("click", () => jGo(g)); box.append(b);
    }
    jBody.append(box);
  }
  const rest = cur.news.filter(n => n !== top && !others.includes(n));
  if (rest.length){ jBody.append(el("div", "j-sect", "MISES A JOUR")); const l = el("div", "j-list"); rest.forEach(n => l.append(jRow(n))); jBody.append(l); }
}
function openJournal(){
  jIssue = 0; renderJournal();
  jov.classList.add("on"); document.body.classList.add("lock");
  $("journal").scrollTop = 0; jClose.focus({preventScroll: true});
  if (NEWS[0] && NEWS[0][0] > jSeen){ jSeen = NEWS[0][0]; try { localStorage.setItem("ludo.journalVu", jSeen); } catch (e) {} }
  paintJournal();
  try { if (!(history.state && history.state.journal)) history.pushState({journal: 1}, ""); } catch (e) {}
}
function hideJournal(){ if (!jOpen()) return; jov.classList.remove("on"); if (!ovOpen()) document.body.classList.remove("lock"); }
function closeJournal(){ try { if (history.state && history.state.journal){ history.back(); return; } } catch (e) {} hideJournal(); jBtn.focus({preventScroll: true}); }
jBtn.addEventListener("click", openJournal);
jClose.addEventListener("click", closeJournal);
jov.addEventListener("click", e => { if (e.target === jov) closeJournal(); });
addEventListener("popstate", () => { if (!(history.state && history.state.journal)) hideJournal(); });
paintJournal();

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
  if (e.key === "Escape" && jOpen()){ e.preventDefault(); closeJournal(); return; }
  if (ovOpen() || jOpen() || (e.target.closest && e.target.closest("textarea, input, select, .saves, .player"))) return;
  if (["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(e.key)){ e.preventDefault(); kbd = true; select(sel + (["ArrowRight", "ArrowDown"].includes(e.key) ? 1 : -1), true); }
  else if (e.key === "Enter" && document.activeElement === document.body && carts[sel]) carts[sel].el.click();
});

/* ---------- surprends-moi : les cartouches défilent dans la console de plus en plus lentement, puis la choisie est insérée ---------- */
$("surprise").addEventListener("click", () => {
  const jeux = GAMES.filter(g => !g.atelier), vis = jeux.filter(g => !g.el.hidden), pool = vis.length ? vis : jeux;   // les ateliers ne sont pas tirés au sort
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
// chaque jeu : ses classements (vues), leur réglage (ctl), leur format (fmt ; T = temps en ms)
const RANKS = {};   // rempli par les fiches (classements, rangés sous carte.rank)
for (const f of GAMES.map(g => FICHES[g.k])) if (f.classements && f.carte.rank) RANKS[f.carte.rank] = f.classements;
// les Pokémon du Picross Dex (noms lus dans la page du jeu, mise en cache par l'appli), chargés à la première demande
let DEX = null, dexReady = null;
const loadDex = () => dexReady || (dexReady = fetch(ROOT + "picross/dessins.js").then(r => r.text()).then(t => {
  DEX = {}; for (const m of t.matchAll(/\{id:"([a-z0-9_-]+)", no:"([0-9A-Z]+)", name:"([^"]+)"/g)) DEX[m[1]] = {no: m[2], name: m[3]};
}).catch(() => { DEX = {}; }));
const pokeLabel = Ludo.pokeLabel = id => { const d = DEX && DEX[id]; return d ? `${d.no === "OBJ" ? "OBJ" : "#" + d.no} ${d.name}` : id.toUpperCase(); };   // aussi pour la fiche de Picross
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
// chaque fiche s'occupe de sa part du code (transfert : collecter, decrire, fusionner ; voir accueil-outils.js)
const TRANSFERTS = () => GAMES.map(g => FICHES[g.k].transfert).filter(Boolean);
function collectSaves(){
  const g = {};
  for (const t of TRANSFERTS()){ try { t.collecter(g); } catch (e) {} }
  return g;
}
function describeSaves(g){
  const out = [];
  for (const t of TRANSFERTS()){ try { t.decrire(g, out); } catch (e) {} }
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
  for (const t of TRANSFERTS()){ try { t.fusionner(g, done); } catch (e) {} }
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

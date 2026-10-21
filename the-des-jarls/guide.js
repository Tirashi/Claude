/* =====================================================================
   LE THÉ DES JARLS · APPRENDRE À JOUER (choix T1 + T2 de la maquette 5).
   - Le premier duel guidé : contre Thorgrim, un vieux jarl très faible,
     avec Sigrid la skalde. Les dés de la première manche sont arrangés
     (GUIDE_IMPOSES) : 4 haches et 4 faces dorées pour le joueur, de quoi
     payer Thor ; Thorgrim n'a ni or ni main, il ne peut rien invoquer.
     Chaque étape éclaire une zone de l'écran (jeu.js) et attend une action.
   - Le livre du skalde : 7 pages illustrées (COMMENT JOUER).
   Données seulement ; jeu.js s'en sert.
   ===================================================================== */
'use strict';
const GUIDE_GRAINE = 2110;
const GUIDE_THORGRIM = { nom: 'Thorgrim', faveurs: ['idunn', 'heimdall', 'tyr'], ia: { dieu: 'heimdall', niveau: 1 } };
const GUIDE_FAVEURS = ['thor', 'idunn', 'vidar'];
// 'manche-camp-lancer' : n° de face de chacun des 6 dés (JAR_DES)
const GUIDE_IMPOSES = {
  '1-0-0': [0, 0, 3, 0, 4, 2],   // hache, hache dorée, casque doré, hache, bouclier, flèche dorée
  '1-0-1': [0, 0, 2, 0, 1, 5],   // relance : flèche dorée, hache dorée, main dorée
  '1-1-0': [3, 2, 4, 2, 0, 3], '1-1-1': [3, 2, 4, 2, 0, 3], '1-1-2': [3, 2, 4, 2, 0, 3],   // Thorgrim : 2 casques, 2 flèches, 1 bouclier, 1 hache
};
// z : zone éclairée (champ, hud, des, desIA, b1, b2, fav) ; a : ce qu'on attend (ok, lancer, garder, tour, finir, faveur, bataille)
const GUIDE_ETAPES = [
  { z: 'champ', a: 'ok', t: "Bienvenue au Thé des Jarls ! Je suis Sigrid, la skalde. Ton armée, ce sont les bleus à gauche ; en face, le vieux Thorgrim. Fais tomber ses 15 PV : à chaque PV, 3 de ses soldats tombent." },
  { z: 'hud', a: 'ok', t: "En haut : tes PV (les petits casques) et tes jetons de faveur. Ceux de Thorgrim sont à droite." },
  { z: 'b1', a: 'lancer', t: "Chacun son tour, on lance ses six dés, trois fois au plus. À toi : touche LANCER !" },
  { z: 'des', a: 'ok', t: "Chaque face envoie ton armée. Hache : tes fantassins chargent. Flèche : tes archers tirent. Casque et bouclier parent les coups. Main : un éclaireur vole un jeton. Les faces dorées rapportent un jeton chacune." },
  { z: 'desIA', a: 'tour', t: "Thorgrim lance à son tour. Ses dés s'affichent ici, au-dessus de la bataille." },
  { z: 'des', a: 'garder', t: "À toi ! Garde tes trois haches : touche-les. Un dé gardé file sur la planche de feutre du haut : il ne sera pas relancé." },
  { z: 'b1', a: 'lancer', t: "Relance les dés que tu n'as pas gardés." },
  { z: 'desIA', a: 'tour', t: "Thorgrim relance…" },
  { z: 'b2', a: 'finir', t: "Belle main : quatre haches et quatre faces dorées ! TOUT GARDER arrête tes lancers." },
  { z: 'desIA', a: 'tour', t: "Thorgrim finit ses lancers." },
  { z: 'fav', a: 'faveur', t: "Tes 4 faces dorées vont te donner 4 jetons : juste de quoi payer Thor au niveau I. Touche THOR, puis INVOQUER." },
  { z: 'champ', a: 'bataille', t: "La bataille ! Les faces dorées paient d'abord, puis les flèches contre les boucliers, les haches contre les casques, les éclaireurs, et Thor frappe en dernier." },
  { z: 'champ', a: 'ok', t: "Bien joué ! Celui qui commence change à chaque manche. Finis le duel seul ; le bouton ? en haut rappelle les faces à tout moment." },
];
// le livre du skalde : [titre, illustration (des : dés à dessiner, med : médaillons, armees, ordre, hiver), texte]
const LIVRE = [
  ['LE BUT', { armees: 1 }, "Deux armées de 45 soldats. <b>Fais tomber les 15 PV</b> de l'adversaire : à chaque blessure, 3 de ses soldats tombent."],
  ['LES FACES', { faces: 1 }, "Six dés de six faces : deux haches, une flèche, un casque, un bouclier, une main."],
  ['GARDER, RELANCER', { des: ['hache', 'hache', 'fleche*', '→', 'bouclier', 'main', 'hache'] }, "Trois lancers au plus, chacun son tour. <b>Touche un dé pour le garder</b> : il file sur la planche de feutre ; les autres repartent. TOUT GARDER arrête tes lancers ; au troisième, tout est gardé."],
  ["L'OR DES DIEUX", { des: ['fleche*', '=', 'jeton'] }, "Chaque face <b>dorée</b> rapporte un jeton. Les éclaireurs (mains) en volent un chacun. Les jetons paient les faveurs des dieux."],
  ['LES FAVEURS', { med: ['thor', 'idunn', 'vidar'] }, "Avant le duel, tu emportes <b>trois faveurs</b>. Après les lancers, invoques-en une au niveau I, II ou III. Celles <b>d'après la bataille</b> (Thor, Idunn, Odin) ratent si on t'a volé tes jetons."],
  ["L'ORDRE DE LA BATAILLE", { ordre: ['Les faces dorées rapportent leurs jetons.', "Les dieux d'avant la bataille.", 'Les flèches contre les boucliers, puis les haches contre les casques.', 'Les éclaireurs volent.', "Les dieux d'après la bataille."] }, 'Le premier joueur change à chaque manche.'],
  ["L'HIVER", { hiver: 1 }, "À partir de la <b>manche 10</b>, l'hiver mord : chaque armée perd 1 PV, puis 2, puis 3… Si les deux tombent ensemble, celle qui tombe le moins bas gagne."],
];
const FACES_TXT = [['hache', 'Hache : tes fantassins chargent. Un casque adverse en pare une.'], ['fleche', 'Flèche : tes archers tirent. Un bouclier adverse en pare une.'],
  ['casque', 'Casque : pare une hache.'], ['bouclier', 'Bouclier : pare une flèche.'], ['main', 'Main : un éclaireur vole un jeton.'], ['hache*', 'Face dorée : +1 jeton de faveur.']];

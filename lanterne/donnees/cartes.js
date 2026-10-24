/* La Dernière Lanterne — les cartes. Une lettre par case (légende dans base.js) ; maisons, objets,
   habitants, sorties, déclencheurs et monstres placés par leurs coordonnées (x vers la droite, y vers le bas). */
window.LANTERNE = window.LANTERNE || {};

LANTERNE.cartes = {
  maison_ysolde: {
    nom: 'Maison de Mère Ysolde', musique: 'village',
    plan: [
      'WWWWWWWWW',
      'wBP_H_Kqw',
      'w_______w',
      'wL______w',
      'w_______w',
      'w______Ow',
      'w_______w',
      'vvvv_vvvv'
    ],
    ornements: [{ type: 'tapis', x: 3, y: 3 }, { type: 'fenetre', x: 3, y: 0 }, { type: 'fenetre', x: 6, y: 0 }, { type: 'etagere', x: 7, y: 0 }],
    pnj: [{ id: 'ysolde', perso: 'ysolde', x: 5, y: 3, evenement: 'ysolde' }],
    objets: [{ type: 'deco', x: 2, y: 1, bloque: true, evenement: 'pupitre_ysolde' }],
    sorties: [{ x: 4, y: 7, vers: 'clairfond', a: [3, 6], dir: 'bas' }]
  },

  clairfond: {
    nom: 'Clairfond', musique: 'village', exterieur: true, sauvegardeAuto: true,
    plan: [
      'TTTTTTTTTTT::TTTTTTTTTTT',
      'TTT......b.::.b......TTT',
      'TT.........::.f.......TT',
      'T......f...::..........T',
      'T.....p....::..f.....o.T',
      'T..........::..........T',
      'T..:::::::::::::::::::::',
      'T..:::::::::::::::::::::',
      'T.......========.......T',
      'T.......========....f..T',
      'Tb.....f==S=====...F...T',
      'T.......========.......T',
      'T.....o.========.....f.T',
      'T..:..o....::..........T',
      'T..::::::::::....~~~~~.T',
      'T..::::::::::...~~~~~~.T',
      'T.f........::...~~~~~~.T',
      'T....xxxxx.::b..~~~~~..T',
      'TTT........XX........TTT',
      'TTTTTTTTTTTTTTTTTTTTTTTT'
    ],
    maisons: [
      { x: 2, y: 3, l: 4, p: 3, mur: 'mur_lierre', toit: 'toit', porte: 1, fenetres: [2.5] },
      { x: 16, y: 3, l: 5, p: 3, mur: 'mur_brique', toit: 'toit', porte: 2, fenetres: [.5, 3.5] },
      { x: 2, y: 10, l: 4, p: 3, mur: 'mur_pierre', toit: 'toit_ardoise', porte: 1, fenetres: [2.5] }
    ],
    objets: [
      { type: 'lanterne', x: 13, y: 10, evenement: 'lanterne_clairfond' },
      { type: 'deco', x: 10, y: 10, bloque: true, evenement: 'statue_aubrin' },
      { type: 'panneau', x: 13, y: 1, texte: 'Au nord : la route de la forêt et l\'abbaye de Saint-Cendre.' },
      { type: 'panneau', x: 10, y: 17, texte: ['Au sud : la route des marais.', 'Fermée tant que la brume est si épaisse. — Les Veilleurs'] },
      { type: 'panneau', x: 7, y: 5, texte: 'Maison de la veilleuse Ysolde. Frapper fort, elle est un peu sourde.' },
      { type: 'coffre', id: 'clairfond_buisson', x: 1, y: 9, contenu: { objet: 'herbe', n: 2 } }
    ],
    pnj: [
      { id: 'gaspard', perso: 'gaspard', x: 17, y: 9, evenement: 'gaspard' },
      { id: 'biscotte', perso: 'biscotte', x: 18, y: 9, evenement: 'biscotte' },
      { id: 'enfant', perso: 'enfant', x: 14, y: 4, evenement: 'enfant', erre: 2 },
      { id: 'ancien', perso: 'ancien', x: 9, y: 11, evenement: 'ancien' },
      { id: 'paysanne', perso: 'paysanne', x: 6, y: 8, evenement: 'paysanne', erre: 2 },
      { id: 'forgeron', perso: 'forgeron', x: 5, y: 14, evenement: 'forgeron' },
      { id: 'pecheur', perso: 'pecheur', x: 15, y: 15, evenement: 'pecheur' },
      { id: 'nuage', perso: 'nuage', x: 8, y: 13, evenement: 'nuage' },
      { id: 'garde', perso: 'garde', x: 10, y: 3, evenement: 'garde' },
      { id: 'garcon_vert', perso: 'garcon_vert', x: 20, y: 11, evenement: 'garcon_vert', erre: 2, anim: 'attaque' }
    ],
    sorties: [
      { x: [11, 12], y: 0, vers: 'route_abbaye', a: [6, 28], dir: 'haut', si: 'mission', refus: 'pas_encore' },
      { x: 3, y: 5, vers: 'maison_ysolde', a: [4, 6], dir: 'haut' },
      { x: 18, y: 5, vers: 'auberge', a: [5, 6], dir: 'haut' },
      { x: 23, y: [6, 7], vers: 'bois_murmurant', a: [1, 6], dir: 'droite', si: 'mission_flammes', refus: 'bois_ferme' }
    ],
    declencheurs: [{ x: 3, y: 12, evenement: 'forge_fermee' }]
  },

  auberge: {
    nom: 'Auberge du Lys', musique: 'village',
    plan: [
      'WWWWWWWWWWW',
      'wOO___H__Ow',
      'wKKKK_____w',
      'w______K__w',
      'w_________w',
      'w______K_qw',
      'w_________w',
      'vvvvv_vvvvv'
    ],
    ornements: [{ type: 'tapis', x: 2, y: 4 }, { type: 'fenetre', x: 3, y: 0 }, { type: 'tableau', x: 4, y: 0 }, { type: 'bouclier', x: 8, y: 0 }, { type: 'fenetre', x: 9, y: 0 }],
    pnj: [
      { id: 'aubergiste', perso: 'aubergiste', x: 3, y: 3, evenement: 'aubergiste' },
      { id: 'voyageur', perso: 'vaast', x: 8, y: 4, evenement: 'voyageur' }
    ],
    sorties: [{ x: 5, y: 7, vers: 'clairfond', a: [18, 6], dir: 'bas' }]
  },

  route_abbaye: {
    nom: 'Route de la forêt', musique: 'foret', exterieur: true, brume: .6,
    combat: { sol: ['herbe_sombre0', 'herbe_sombre1', 'herbe_sombre2'], decor: 'sapin', brume: .6 }, sauvegardeAuto: true, entree: 'route_entree',
    plan: [
      'YMMMMMMMMMMMMY',
      'YMMMMMMMMMMMMY',
      'YMMMMM==MMMMMY',
      'YYY========YYY',
      'YYY========YYY',
      'Y,,,,,,Y::,Y,Y',
      'Y,,,,,::::,YYY',
      'Y,,,,,::Y,Y,,Y',
      'Y,,,Y,::,,,,,Y',
      'Y,,Y,Y::,,,YYY',
      'YY,,,Y::,,YYYY',
      'YY,Y::::Y,,,YY',
      'Y,,,::,,,,Y,,Y',
      'Y,,,::Y,,Y,,YY',
      'YY,,::,,,,,,,Y',
      'YYY,::,,,,,,,Y',
      'Y,,,::::,,,Y,Y',
      'Y,,Y,Y::,,YY,Y',
      'Y,,,YY::,Y,Y,Y',
      'Y,,,,Y::,,,,,Y',
      'Y,YY,,::,,Y,,Y',
      'Y,Y,,:::Y,,,,Y',
      'Y,,,Y::Y,,,,,Y',
      'Y,Y,Y::,,,,Y,Y',
      'YYY,,::,,,Y,,Y',
      'Y,,,Y::,,,,,,Y',
      'Y,,,,:::,,,,,Y',
      'Y,,Y,,::,YYY,Y',
      'YY,,,,::,Y,,YY',
      'Y,,,,,::,,,,,Y'
    ],
    objets: [
      { type: 'lanterne', x: 9, y: 4 },
      { type: 'lanterne_oubliee', id: 'route', x: 10, y: 19, evenement: 'lanterne_oubliee_route' },
      { type: 'coffre', id: 'route_souche', x: 3, y: 22, contenu: { objet: 'fiole', n: 1 } },
      { type: 'coffre', id: 'route_cuir', x: 11, y: 21, contenu: { objet: 'cuir', n: 1 } }
    ],
    pnj: [{ id: 'isee', perso: 'isee', x: 7, y: 13, evenement: 'isee_route', cache: true }],
    monstres: [
      { type: 'feu_follet', x: 9, y: 24, rayon: 2 },
      { type: 'feu_follet', x: 3, y: 16, rayon: 2 },
      { type: 'crapaud', x: 9, y: 12, rayon: 2 },
      { type: 'corbeau', x: 9, y: 8, rayon: 3 }
    ],
    sorties: [{ x: [6, 7], y: 29, vers: 'clairfond', a: [11, 1], dir: 'bas' }, { x: [6, 7], y: 2, vers: 'abbaye', a: [6, 8], dir: 'haut' }],
    declencheurs: [
      { x: [4, 5], y: 14, evenement: 'isee_rencontre', si: '!isee_vue' }
    ]
  },
  // ---------- prologue : l'abbaye de Saint-Cendre ----------
  abbaye: {
    nom: 'Abbaye de Saint-Cendre', musique: 'village', ciel: 0x151218, entree: 'abbaye_entree', sauvegardeAuto: true,
    plan: [
      'AAAAAAAAAAAAA',
      'jaaaaaaaaaaaj',
      'jaaaaaaaaaaaj',
      'jalaaaaaaalaj',
      'jaaaaaaaaaaaj',
      'jalaaaaaaalaj',
      'jaaaaaaaaaaaj',
      'jalaaaaaaalaj',
      'jaaaaaaaaaaaj',
      'kkkkkkakkkkkk'
    ],
    ornements: [{ type: 'tapis_long', x: 6, y: 4, h: 5 }, { type: 'vitrail', x: 2, y: 0 }, { type: 'vitrail', x: 4, y: 0 }, { type: 'vitrail', x: 8, y: 0 }, { type: 'vitrail', x: 10, y: 0 }, { type: 'tapisserie', x: 5, y: 0 }, { type: 'tapisserie', x: 7, y: 0 }],
    objets: [
      { type: 'grande_lanterne', x: 6, y: 3, evenement: 'grande_lanterne' },
      { type: 'lanterne', x: 11, y: 8 }
    ],
    pnj: [
      { id: 'vaast', perso: 'vaast', x: 5, y: 5, evenement: 'vaast' },
      { id: 'eloi', perso: 'eloi', x: 8, y: 4, evenement: 'eloi_abbaye', si: '!eloi_rejoint' }
    ],
    sorties: [{ x: 6, y: 9, vers: 'route_abbaye', a: [6, 3], dir: 'bas' }]
  },

  // ---------- acte 1 : le Bois Murmurant ----------
  bois_murmurant: {
    nom: 'Bois Murmurant', musique: 'foret', exterieur: true, brume: .45, sauvegardeAuto: true, entree: 'bois_entree',
    combat: { sol: ['herbe_sombre0', 'herbe_sombre1', 'herbe_sombre2'], decor: 'sapin', brume: .45 },
    plan: [
      'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
      'Y,,,,,,Y,,,YYY,,Y,,,,YY,YMMMMY',
      'YYYY,,,,,,,,Y,,,,YY,,,,YYME=MY',
      'Y,Y,Y,,YY,,,YY,,YYY,,,,:::==MY',
      'Y,,YYYY,Y,,Y,Y,Y,YY,,,,::::,,Y',
      'YY,YY,,Y,YY,YYYY:::::::::,Y,YY',
      ':::::::::::,,,,,:::::::::YY,,Y',
      ':::::::::::,,,,,::,YY,,Y,,,,YY',
      'YYYYY,YY,::,,,,,::,,YY,YY,,,YY',
      'Y,,,,,,,Y:::::::::,YY,YYY,YY,Y',
      'Y,,,,,,,Y:::::::::,,,YYY,,,Y,Y',
      'Y,,,,,,,YY,,,,,,,,,Y,,,,,,,Y,Y',
      'Y,,,,,,,YY,,,,,,,,,,,,Y,,Y,,,Y',
      'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYY'
    ],
    objets: [
      { type: 'nappe', id: 'bois_recoin', x: 5, y: 8, outil: 'lanterne' },
      { type: 'coffre', id: 'bois_recoin', x: 3, y: 11, contenu: { objet: 'epee_longue', n: 1 } },
      { type: 'coffre', id: 'bois_clairiere', x: 21, y: 2, contenu: { objet: 'herbe', n: 2 } },
      { type: 'lanterne_oubliee', id: 'bois', x: 20, y: 3, evenement: 'lanterne_oubliee_bois' },
      { type: 'lanterne', x: 28, y: 4 }
    ],
    pnj: [
      { id: 'verene', perso: 'verene', x: 15, y: 11, evenement: 'verene_bois', cache: true },
      { id: 'loup_a', perso: 'loup', x: 13, y: 11, cache: true },
      { id: 'loup_b', perso: 'corbeau', x: 17, y: 12, cache: true }
    ],
    monstres: [
      { type: 'loup', x: 5, y: 2, rayon: 2 },
      { type: 'feu_follet', x: 14, y: 4, rayon: 2 },
      { type: 'corbeau', x: 18, y: 8, rayon: 2 },
      { type: 'crapaud', x: 27, y: 7, rayon: 1 },
      { type: 'loup', x: 22, y: 11, rayon: 2 }
    ],
    sorties: [
      { x: 0, y: [6, 7], vers: 'clairfond', a: [22, 6], dir: 'gauche' },
      { x: 26, y: 2, vers: 'crypte_entree', a: [6, 6], dir: 'haut', si: 'verene_rejoint', refus: 'crypte_fermee' }
    ],
    declencheurs: [{ x: 12, y: [9, 10], evenement: 'verene_scene', si: '!verene_rejoint' }]
  },

  // ---------- la Crypte des racines (premier sanctuaire) ----------
  crypte_entree: {
    nom: 'Crypte des racines', musique: 'foret', ciel: 0x0a0d08, sauvegardeAuto: true, entree: 'crypte_arrivee',
    plan: [
      'CCCCCCnCCCCCC',
      'ZQnnnRnRnnnQZ',
      'ZnnmmnnnmmnnZ',
      'ZnmmgnnnnmmnZ',
      'ZnnnnnnnnnnnZ',
      'ZQnmnnnnnmnQZ',
      'ZnnnnnnnnnnnZ',
      'ZnnnnnGnnnnnZ',
      'zzzzzzzzzzzzz'
    ],
    ornements: [{ type: 'torche', x: 3, y: 0 }, { type: 'torche', x: 9, y: 0 }],
    objets: [
      { type: 'grille', id: 'crypte_grille', x: 6, y: 1, ouvertSi: 'levier_crypte', texte: 'Une grille rouillée, prise dans les racines. Un mécanisme doit l\'ouvrir.' },
      { type: 'levier', id: 'crypte_levier', x: 1, y: 3, drapeau: 'levier_crypte', texte: 'Le levier grince… Au fond de la salle, la grille remonte dans un nuage de poussière.' },
      { type: 'lanterne', x: 11, y: 6 }
    ],
    monstres: [{ type: 'gelee', x: 9, y: 3, rayon: 1 }],
    sorties: [
      { x: 6, y: 7, vers: 'bois_murmurant', a: [26, 3], dir: 'bas' },
      { x: 6, y: 0, vers: 'crypte_racines', a: [7, 11], dir: 'haut' }
    ]
  },
  crypte_racines: {
    nom: 'Crypte des racines', musique: 'foret', ciel: 0x0a0d08,
    plan: [
      'CCCCCCCnCCCCCCC',
      'ZRnnnnnnnnnnnRZ',
      'ZnnmmmnnnmmmnnZ',
      'ZnQmmrnnnrmmQnZ',
      'ZnnmmnnnnnmmnnZ',
      'ZrrnnnQnQnnnrrZ',
      'nnnnnnnnnnnnnnZ',
      'ZnnmmnnnnnmmnnZ',
      'ZnQmmnnnnnmmQnZ',
      'ZnnnnrnnnrnnnnZ',
      'ZRnnnnnnnnnnnRZ',
      'ZnnnnnnnnnnnnnZ',
      'zzzzzzznzzzzzzz'
    ],
    ornements: [{ type: 'torche', x: 4, y: 0 }, { type: 'torche', x: 10, y: 0 }],
    objets: [
      { type: 'nappe', id: 'crypte_nappe', x: 7, y: 1, outil: 'lanterne' },
      { type: 'porte_cle', id: 'crypte_porte', x: 1, y: 6, cle: 'cle_crypte' },
      { type: 'coffre', id: 'crypte_cle', x: 13, y: 2, contenu: { objet: 'cle_crypte', n: 1 } },
      { type: 'coffre', id: 'crypte_herbes', x: 1, y: 11, contenu: { objet: 'herbe', n: 3 } }
    ],
    monstres: [
      { type: 'ronce', x: 4, y: 3, rayon: 1 },
      { type: 'rose_epine', x: 10, y: 8, rayon: 1 },
      { type: 'ronce', x: 11, y: 3, rayon: 1 }
    ],
    sorties: [
      { x: 7, y: 12, vers: 'crypte_entree', a: [6, 2], dir: 'bas' },
      { x: 0, y: 6, vers: 'crypte_tresor', a: [7, 4], dir: 'gauche' },
      { x: 7, y: 0, vers: 'crypte_coeur', a: [5, 9], dir: 'haut' }
    ]
  },
  crypte_tresor: {
    nom: 'Crypte des racines', musique: 'foret', ciel: 0x0a0d08,
    plan: [
      'CCCCCCCCC',
      'ZnnRnRnnZ',
      'ZnnnnnnnZ',
      'ZQnnnnnQZ',
      'Znnnnnnnn',
      'ZQnnnnnQZ',
      'ZnnnnnnnZ',
      'zzzzzzzzz'
    ],
    ornements: [{ type: 'torche', x: 2, y: 0 }, { type: 'torche', x: 6, y: 0 }],
    objets: [
      { type: 'coffre', id: 'tresor', x: 4, y: 1, evenement: 'tresor_meche' },
      { type: 'coffre', id: 'tresor_fioles', x: 1, y: 6, contenu: { objet: 'fiole', n: 2 } }
    ],
    sorties: [{ x: 8, y: 4, vers: 'crypte_racines', a: [2, 6], dir: 'droite' }]
  },
  crypte_coeur: {
    nom: 'Cœur de la crypte', musique: 'foret', ciel: 0x0a0d08, sauvegardeAuto: true, entree: 'coeur_arrivee',
    combat: { sol: ['mousse0', 'mousse1', 'mousse2'], decor: 'mur_crypte_haut', interieur: true },
    plan: [
      'CCCCCCCCCCC',
      'ZQnnnnnnnQZ',
      'ZnnnnnnnnnZ',
      'ZnmmmnmmmnZ',
      'ZnmQnnnQmnZ',
      'ZnnnnnnnnnZ',
      'ZnQnnnnnQnZ',
      'ZnnnnnnnnnZ',
      'ZnnnnnnnnnZ',
      'ZnnnnnnnnnZ',
      'zzzzznzzzzz'
    ],
    ornements: [{ type: 'torche', x: 3, y: 0 }, { type: 'torche', x: 7, y: 0 }],
    objets: [{ type: 'fresque', x: 5, y: 1, evenement: 'fresque_racines' }],
    pnj: [{ id: 'roi', perso: 'roi_aulnes', x: 5, y: 3, evenement: 'roi_parle', si: '!roi_vaincu' }],
    sorties: [{ x: 5, y: 10, vers: 'crypte_racines', a: [7, 2], dir: 'bas' }],
    declencheurs: [{ x: [1, 9], y: 6, evenement: 'roi_combat', si: '!roi_vaincu' }]
  }
};

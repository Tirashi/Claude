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
      'TTT........::........TTT',
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
      { type: 'panneau', x: 10, y: 17, evenement: 'panneau_marais' },
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
      { x: 23, y: [6, 7], vers: 'bois_murmurant', a: [1, 6], dir: 'droite', si: 'mission_flammes', refus: 'bois_ferme' },
      { x: [11, 12], y: 18, vers: 'route_marais', a: [7, 1], dir: 'bas', si: 'mission_marais', refus: 'marais_ferme' }
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
      // le héros traverse cette route seul la première fois : un monstre à la fois
      { type: 'feu_follet', x: 9, y: 24, rayon: 2, groupe: ['feu_follet'] },
      { type: 'feu_follet', x: 3, y: 16, rayon: 2, groupe: ['feu_follet'] },
      { type: 'crapaud', x: 9, y: 12, rayon: 2, groupe: ['crapaud'] },
      { type: 'corbeau', x: 9, y: 8, rayon: 3, groupe: ['corbeau'] }
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
      { type: 'lanterne', x: 11, y: 6 },
      { type: 'coffre', id: 'crypte_entree_herbes', x: 1, y: 6, contenu: { objet: 'herbe', n: 3 } }
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
  },

  // ---------- acte 2 : la route des marais ----------
  route_marais: {
    nom: 'Route des marais', musique: 'foret', exterieur: true, brume: .55, sauvegardeAuto: true, entree: 'marais_entree',
    combat: { sol: ['herbe_marais0', 'herbe_marais1', 'herbe_marais2'], decor: 'saule', brume: .55 },
    plan: [
      'sssssssuusssssss',
      'shhhhhhuuhhhhhhs',
      'shihhhuuhhhhhhis',
      'shhhhhuuhhheeehs',
      'shhssuuhhheeeeis',
      'shhhhuuhhhhyeehs',
      'seehhuuuuhhhhhhs',
      'seeehhhhuuuhhhss',
      'sieehhhhhhuuhhhs',
      'shhhhhshhhuuhhhs',
      'shhhhhhhhuuhhees',
      'shhhiuuuuuhhheis',
      'shhhhuuhhhhhhhhs',
      'sseehuuhhhhhsshs',
      'seeehhuuhhhhhhhs',
      'seyeehhuuuuuuhhs',
      'siehhhhhhhhhuuhs',
      'shhhhhhhhhhhuuhs',
      'shhssshhhhhuuhhs',
      'shhhhhhhhhuuhhhs',
      'shheehhhhuuhhhhs',
      'sheeeehhuuhhhshs',
      'shieehhuuhhhhhhs',
      'shhhhhuuhhhhhhhs',
      'shhhhhuuhhhhhhhs',
      'ssssssuussssssss'
    ],
    objets: [
      { type: 'panneau', x: 9, y: 1, texte: ['Route des marais.', 'Port-Gris : tout droit au sud. Le Marais des cloches : à vos risques.'] },
      { type: 'lanterne_oubliee', id: 'marais_route', x: 14, y: 1, evenement: 'lanterne_oubliee_marais' },
      { type: 'coffre', id: 'marais_masse', x: 1, y: 9, contenu: { objet: 'masse_fer', n: 1 } },
      { type: 'lanterne', x: 12, y: 12 },
      { type: 'coffre', id: 'marais_herbes', x: 14, y: 22, contenu: { objet: 'herbe', n: 2 } }
    ],
    pnj: [{ id: 'marchand', perso: 'marchand', x: 14, y: 17, evenement: 'marchand' }],
    monstres: [
      { type: 'sangsue', x: 6, y: 5, rayon: 2 },
      { type: 'feu_bleu', x: 10, y: 8, rayon: 2 },
      { type: 'feu_bleu', x: 3, y: 11, rayon: 2 },
      { type: 'phalene', x: 11, y: 19, rayon: 2 },
      { type: 'sangsue', x: 8, y: 22, rayon: 2 }
    ],
    sorties: [
      { x: [7, 8], y: 0, vers: 'clairfond', a: [11, 17], dir: 'haut' },
      { x: [6, 7], y: 25, vers: 'port_gris', a: [10, 1], dir: 'bas' }
    ]
  },

  // ---------- Port-Gris, le village des pêcheurs ----------
  port_gris: {
    nom: 'Port-Gris', musique: 'village', exterieur: true, brume: .3, sauvegardeAuto: true, entree: 'port_entree',
    plan: [
      'ssssssssssuussssssssss',
      'sihhhhhshhuuhhhhhhhhhs',
      'shhhhhhhihuuhhhhhhhshs',
      'shhhhhhhhhuuhihhhhhhhs',
      'shhhhhhhhhuuhhhhhhhhis',
      'shhhhhhhhhuuhhhhhhhhhs',
      'sh==================hs',
      'sh========S=========hs',
      'sh==================hs',
      'sihhhhhhhh==hhhhhhhhhs',
      'shhhhhhhhh==hhhhhhhhis',
      'shhhhhhhhh==hhhhhhhhhs',
      'eeeeeedd1ddddddddddddd',
      'eeeeeedeeeddeeeeeeeddd',
      'eeyeeed1eeddeeeeeeeeee',
      'eeeeeedeeeddeeeehheeee',
      'eeeyeeddd1ddeeyehhecee',
      'eeeeeeeeeeeeeeeeeeeeee'
    ],
    maisons: [
      { x: 2, y: 2, l: 5, p: 3, mur: 'mur_brique', toit: 'toit', porte: 2, fenetres: [.5, 3.5] },
      { x: 14, y: 2, l: 5, p: 3, mur: 'mur_pierre', toit: 'toit_ardoise', fenetres: [1.5, 3.5] },
      { x: 3, y: 9, l: 4, p: 3, mur: 'mur_lierre', toit: 'toit_ardoise', fenetres: [1.5] },
      { x: 14, y: 9, l: 4, p: 3, mur: 'mur_pierre', toit: 'toit', fenetres: [.5, 2.5] }
    ],
    objets: [
      { type: 'panneau', x: 12, y: 1, texte: ['PORT-GRIS', 'Taverne de la Cloche fêlée : à gauche de la place. Le marais : à l\'est, par le quai.'] },
      { type: 'lanterne', x: 13, y: 7, evenement: 'lanterne_port' },
      { type: 'deco', x: 10, y: 7, bloque: true, evenement: 'statue_port' },
      { type: 'pieu', x: 10, y: 15 }, { type: 'pieu', x: 17, y: 15 },
      { type: 'coffre', id: 'port_ilot', x: 16, y: 16, contenu: { objet: 'cape', n: 1 } }
    ],
    pnj: [
      { id: 'maitre_port', perso: 'maitre_port', x: 15, y: 12, evenement: 'maitre_port' },
      { id: 'pecheuse', perso: 'pecheuse', x: 6, y: 14, evenement: 'pecheuse' },
      { id: 'dresseur', perso: 'dresseur', x: 16, y: 7, evenement: 'dresseur', erre: 2 },
      { id: 'conteuse', perso: 'conteuse', x: 4, y: 7, evenement: 'conteuse' },
      { id: 'gaspard_port', perso: 'gaspard', x: 8, y: 10, evenement: 'gaspard_port' },
      { id: 'biscotte_port', perso: 'biscotte', x: 8, y: 9, evenement: 'biscotte' }
    ],
    sorties: [
      { x: [10, 11], y: 0, vers: 'route_marais', a: [6, 24], dir: 'haut' },
      { x: 4, y: 4, vers: 'taverne_port', a: [5, 6], dir: 'haut' },
      { x: 21, y: [12, 13], vers: 'marais_cloches', a: [1, 12], dir: 'droite', si: 'maud_rejoint', refus: 'sans_guide' }
    ]
  },
  taverne_port: {
    nom: 'Taverne de la Cloche fêlée', musique: 'village',
    plan: [
      'WWWWWWWWWWW',
      'wOO___H__Ow',
      'w__KK_____w',
      'w________qw',
      'w_K_____K_w',
      'w_________w',
      'w_________w',
      'vvvvv_vvvvv'
    ],
    ornements: [{ type: 'tapis_bleu', x: 5, y: 4 }, { type: 'fenetre', x: 2, y: 0 }, { type: 'tableau', x: 4, y: 0 }, { type: 'fenetre', x: 8, y: 0 }, { type: 'etagere', x: 9, y: 0 }],
    pnj: [
      { id: 'aubergiste_port', perso: 'aubergiste_port', x: 3, y: 3, evenement: 'aubergiste_port' },
      { id: 'maud', perso: 'maud', x: 8, y: 3, evenement: 'maud_taverne', si: '!maud_rejoint' }
    ],
    sorties: [{ x: 5, y: 7, vers: 'port_gris', a: [4, 5], dir: 'bas' }]
  },

  // ---------- le Marais des cloches ----------
  marais_cloches: {
    nom: 'Marais des cloches', musique: 'foret', exterieur: true, brume: .5, sauvegardeAuto: true, entree: 'cloches_entree',
    combat: { sol: ['herbe_marais0', 'herbe_marais1', 'vase0'], decor: 'saule', brume: .5 },
    plan: [
      'ssssssssssssssssssssssssssss',
      'shhhhiihhhhhheeeheeeehhhhhhs',
      'shhhhhhhhhhhheeeheeeehhhhhhs',
      'shhhhhhhhhhiheceheeeehhhhhhs',
      'sheeeecehihhheeeheeeUhhhhhhs',
      'sheyeeeehhhhheeeheeeehhhhhhs',
      'sheeyeeehhhhheeehhhhhhhuhhhs',
      'shhhhhhhhshhheeehhhhhhhuhhhs',
      'shhhhhhhhhhhhecehshhhhhuhhis',
      'shshhhhhhhiiheeeihhhhihuhhhs',
      'shhhhhhhhhhhheeehhhhshhuhhhs',
      'shhhhhhhhhhhheeehhhhhhhuhhss',
      'uuuuuuuuuuuuuddduuuuuuuuhhhs',
      'uuuuuuuuuuuuuddduuuuuuuuhhhs',
      'shhhhhhhhhhhheeeheedeeeeeees',
      'shiihhhhhhshheeeheedeeeeeces',
      'shhhhheyhhhhieeeieedeehhhees',
      'shhhhheehhhhheceheedeehhhees',
      'shhhshhhhhhhheeeheeeeehhhees',
      'shhhhhhhihhhheeeheyeeeeeeyes',
      'shhhhhhhhhhsheeeheeeeeeeeees',
      'ssssssssssssssssssssssssssss'
    ],
    maisons: [{ x: 21, y: 2, l: 6, p: 4, mur: 'mur_moulin', toit: 'toit', porte: 2, fenetres: [.5, 4.5] }],
    objets: [
      { type: 'coffre', id: 'cloches_herbes', x: 8, y: 2, contenu: { objet: 'herbe', n: 3 } },
      { type: 'lanterne_oubliee', id: 'cloches', x: 3, y: 9, evenement: 'lanterne_oubliee_cloches' },
      { type: 'lanterne', x: 25, y: 8 },
      { type: 'panneau', x: 22, y: 7, texte: ['MOULIN DE LA BIEF — Farine, son, et rien d\'autre.', 'Quelqu\'un a ajouté au charbon : « On n\'y entre plus. »'] },
      { type: 'pieu', x: 23, y: 17 }, { type: 'pieu', x: 18, y: 17 },
      { type: 'coffre', id: 'cloches_ilot', x: 23, y: 16, contenu: { objet: 'baton_saule', n: 1 } }
    ],
    pnj: [
      { id: 'crapaud_roi', perso: 'crapaud_roi', x: 8, y: 17, evenement: 'crapaud_roi' },
      { id: 'isee', perso: 'isee', x: 11, y: 10, evenement: 'isee_route', cache: true }
    ],
    monstres: [
      { type: 'escargot', x: 5, y: 12, rayon: 2 },
      { type: 'phalene', x: 9, y: 9, rayon: 2 },
      { type: 'anguille', x: 16, y: 13, rayon: 1 },
      { type: 'anguille', x: 20, y: 12, rayon: 2 },
      { type: 'sangsue', x: 23, y: 9, rayon: 2 },
      { type: 'escargot', x: 4, y: 16, rayon: 2 }
    ],
    sorties: [
      { x: 0, y: [12, 13], vers: 'port_gris', a: [20, 12], dir: 'gauche' },
      { x: 23, y: 5, vers: 'moulin_entree', a: [6, 8], dir: 'haut' }
    ],
    declencheurs: [{ x: 9, y: [12, 13], evenement: 'isee_cloches', si: '!isee_cloches' }]
  },

  // ---------- le Moulin noyé (deuxième sanctuaire) ----------
  moulin_entree: {
    nom: 'Moulin noyé', musique: 'foret', ciel: 0x0c1014, sauvegardeAuto: true, entree: 'moulin_arrivee',
    combat: { sol: ['ponton'], decor: 'mur_moulin_haut', interieur: true },
    plan: [
      'DDDDDDNDDDDDD',
      'INNN2NNNeeNNI',
      'INNNNNNNeeNNI',
      'INVNNNNNeeN2I',
      'INNNNNNNeeNNI',
      'INNNNNNNeeNNI',
      'INNNNNNNeeNNN',
      'INNNNNNNeeNNI',
      'INNNNNNNeeNNI',
      'JJJJJJNJJJJJJ'
    ],
    ornements: [{ type: 'torche', x: 3, y: 0 }, { type: 'torche', x: 9, y: 0 }],
    objets: [
      { type: 'lanterne', x: 2, y: 7 },
      { type: 'pieu', x: 11, y: 4 }, { type: 'pieu', x: 6, y: 4 }
    ],
    monstres: [{ type: 'remous', x: 3, y: 5, rayon: 1 }],
    sorties: [
      { x: 6, y: 9, vers: 'marais_cloches', a: [23, 6], dir: 'bas' },
      { x: 6, y: 0, vers: 'moulin_meules', a: [7, 10], dir: 'haut' },
      { x: 12, y: 6, vers: 'moulin_reserve', a: [1, 4], dir: 'droite' }
    ]
  },
  moulin_reserve: {
    nom: 'Moulin noyé', musique: 'foret', ciel: 0x0c1014,
    combat: { sol: ['ponton'], decor: 'mur_moulin_haut', interieur: true },
    plan: [
      'DDDDDDDDD',
      'I2NNN2NNI',
      'INNNNNNNI',
      'INNNNNNNI',
      'NNNNNNNNI',
      'INNNVNNNI',
      'INNNNNN2I',
      'JJJJJJJJJ'
    ],
    ornements: [{ type: 'torche', x: 4, y: 0 }],
    objets: [
      { type: 'coffre', id: 'moulin_cle', x: 6, y: 1, contenu: { objet: 'cle_moulin', n: 1 } },
      { type: 'coffre', id: 'moulin_epee', x: 2, y: 6, contenu: { objet: 'epee_acier', n: 1 } }
    ],
    monstres: [{ type: 'tortue', x: 5, y: 3, rayon: 1 }],
    sorties: [{ x: 0, y: 4, vers: 'moulin_entree', a: [11, 6], dir: 'gauche' }]
  },
  moulin_meules: {
    nom: 'Moulin noyé', musique: 'foret', ciel: 0x0c1014,
    combat: { sol: ['ponton'], decor: 'mur_moulin_haut', interieur: true },
    plan: [
      'DDDDDDDNDDDDDDD',
      'IN2NNNNNNNNN2NI',
      'INNNVNNNNNVNNNI',
      'INNNNNNNNNNNNNI',
      'INNNNeeeeeNNNNI',
      'INVNNeceeeNNVNI',
      'NNNNNeeeeeNNNNI',
      'INNNNNNNNNNNNNI',
      'INNNVNNNNNVNNNI',
      'INNNNNNNNNNNNNI',
      'IN2NNNNNNNNN2NI',
      'JJJJJJJNJJJJJJJ'
    ],
    ornements: [{ type: 'torche', x: 4, y: 0 }, { type: 'torche', x: 10, y: 0 }],
    objets: [
      { type: 'porte_cle', id: 'moulin_porte', x: 7, y: 1, cle: 'cle_moulin' },
      { type: 'nappe', id: 'moulin_nappe', x: 1, y: 6, outil: 'lanterne' },
      { type: 'coffre', id: 'meules_herbes', x: 13, y: 9, contenu: { objet: 'herbe', n: 2 } }
    ],
    monstres: [
      { type: 'lavandiere', x: 3, y: 8, rayon: 1 },
      { type: 'remous', x: 11, y: 3, rayon: 1 }
    ],
    sorties: [
      { x: 7, y: 11, vers: 'moulin_entree', a: [6, 1], dir: 'bas' },
      { x: 0, y: 6, vers: 'moulin_tresor', a: [7, 4], dir: 'gauche' },
      { x: 7, y: 0, vers: 'moulin_bief', a: [6, 8], dir: 'haut' }
    ]
  },
  moulin_tresor: {
    nom: 'Moulin noyé', musique: 'foret', ciel: 0x0c1014,
    plan: [
      'DDDDDDDDD',
      'IN3NNN3NI',
      'INNNNNNNI',
      'INNNNNNNI',
      'INNNNNNNN',
      'INNNNNNNI',
      'IN2NNN2NI',
      'JJJJJJJJJ'
    ],
    ornements: [{ type: 'torche', x: 2, y: 0 }, { type: 'torche', x: 6, y: 0 }],
    objets: [
      { type: 'coffre', id: 'grappin', x: 4, y: 1, evenement: 'tresor_grappin' },
      { type: 'coffre', id: 'tresor_arc', x: 4, y: 6, contenu: { objet: 'arc_long', n: 1 } }
    ],
    sorties: [{ x: 8, y: 4, vers: 'moulin_meules', a: [2, 6], dir: 'droite' }]
  },
  moulin_bief: {
    nom: 'Moulin noyé', musique: 'foret', ciel: 0x0c1014, sauvegardeAuto: true,
    combat: { sol: ['ponton'], decor: 'mur_moulin_haut', interieur: true },
    plan: [
      'DDDDDDNDDDDDD',
      'INNNNNNNeeNNI',
      'IN2NNNNNeeNNI',
      'INNNNNNNeeNNI',
      'INNNNNNNeeNNI',
      'INNNNNNNeeNNI',
      'INVNNNNNeeN2I',
      'INNNNNNNeeNNI',
      'INNNNNNNeeNNI',
      'JJJJJJNJJJJJJ'
    ],
    ornements: [{ type: 'torche', x: 3, y: 0 }, { type: 'torche', x: 9, y: 0 }],
    objets: [
      { type: 'grille', id: 'moulin_grille', x: 6, y: 1, ouvertSi: 'vanne_moulin', texte: 'Une vanne de fer barre le passage. L\'eau gronde derrière. Un mécanisme doit la lever.' },
      { type: 'levier', id: 'moulin_levier', x: 11, y: 2, drapeau: 'vanne_moulin', texte: 'Le levier résiste, puis cède. Dans un grincement de chaînes, la vanne remonte au fond de la salle.' },
      { type: 'pieu', x: 11, y: 5 }, { type: 'pieu', x: 6, y: 5 },
      { type: 'lanterne', x: 2, y: 8 }
    ],
    monstres: [
      { type: 'lavandiere', x: 3, y: 3, rayon: 1 },
      { type: 'anguille', x: 10, y: 7, rayon: 1 }
    ],
    sorties: [
      { x: 6, y: 9, vers: 'moulin_meules', a: [7, 2], dir: 'bas' },
      { x: 6, y: 0, vers: 'moulin_coeur', a: [5, 9], dir: 'haut' }
    ]
  },
  moulin_coeur: {
    nom: 'Cœur du moulin', musique: 'foret', ciel: 0x0c1014, sauvegardeAuto: true, entree: 'moulin_coeur_arrivee',
    combat: { sol: ['ponton'], decor: 'mur_moulin_haut', interieur: true },
    plan: [
      'DDDDDDDDDDD',
      'IeeNNNNNeeI',
      'IeUNNNNNUeI',
      'IeeNNNNNeeI',
      'INNNNNNNNNI',
      'INNNNNNNNNI',
      'INNNNNNNNNI',
      'INNNNNNNNNI',
      'INNNNNNNNNI',
      'INNNNNNNNNI',
      'JJJJJNJJJJJ'
    ],
    ornements: [{ type: 'torche', x: 4, y: 0 }, { type: 'torche', x: 6, y: 0 }],
    objets: [{ type: 'fresque', x: 5, y: 1, evenement: 'fresque_moulin' }],
    pnj: [{ id: 'dame', perso: 'dame_moulin', x: 5, y: 3, evenement: 'dame_parle', si: '!dame_vaincue' }],
    sorties: [{ x: 5, y: 10, vers: 'moulin_bief', a: [6, 2], dir: 'bas' }],
    declencheurs: [{ x: [1, 9], y: 6, evenement: 'dame_combat', si: '!dame_vaincue' }]
  }
};

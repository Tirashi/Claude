/* La Dernière Lanterne — les cartes. Une lettre par case (légende dans base.js) ; maisons, objets,
   habitants, sorties, déclencheurs et monstres placés par leurs coordonnées (x vers la droite, y vers le bas). */
window.LANTERNE = window.LANTERNE || {};

LANTERNE.cartes = {
  maison_ysolde: {
    nom: 'Maison de Mère Ysolde', musique: 'village',
    plan: [
      'WWWWWWWWW',
      'wBP___Kqw',
      'w_______w',
      'wL______w',
      'w_______w',
      'w______Ow',
      'w_______w',
      'vvvv_vvvv'
    ],
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
      'T..::::::::::::::::::.bT',
      'T..::::::::::::::::::..T',
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
      { x: 2, y: 3, l: 4, p: 3, mur: 'mur_lierre', toit: 'toit', porte: 1 },
      { x: 16, y: 3, l: 5, p: 3, mur: 'mur_brique', toit: 'toit', porte: 2 },
      { x: 2, y: 10, l: 4, p: 3, mur: 'mur_pierre', toit: 'toit_ardoise', porte: 1 }
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
      { id: 'pecheur', perso: 'pecheur', x: 15, y: 15, evenement: 'pecheur' }
    ],
    sorties: [
      { x: [11, 12], y: 0, vers: 'route_abbaye', a: [6, 28], dir: 'haut', si: 'mission', refus: 'pas_encore' },
      { x: 3, y: 5, vers: 'maison_ysolde', a: [4, 6], dir: 'haut' },
      { x: 18, y: 5, vers: 'auberge', a: [5, 6], dir: 'haut' }
    ],
    declencheurs: [{ x: 3, y: 12, evenement: 'forge_fermee' }]
  },

  auberge: {
    nom: 'Auberge du Lys', musique: 'village',
    plan: [
      'WWWWWWWWWWW',
      'wOO______Ow',
      'wKKKK_____w',
      'w______K__w',
      'w_________w',
      'w______K_qw',
      'w_________w',
      'vvvvv_vvvvv'
    ],
    pnj: [
      { id: 'aubergiste', perso: 'aubergiste', x: 3, y: 3, evenement: 'aubergiste' },
      { id: 'voyageur', perso: 'vaast', x: 8, y: 4, evenement: 'voyageur' }
    ],
    sorties: [{ x: 5, y: 7, vers: 'clairfond', a: [18, 6], dir: 'bas' }]
  },

  route_abbaye: {
    nom: 'Route de la forêt', musique: 'foret', exterieur: true, brume: .6, sauvegardeAuto: true, entree: 'route_entree',
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
      { type: 'coffre', id: 'route_souche', x: 3, y: 22, contenu: { objet: 'fiole', n: 1 } }
    ],
    pnj: [{ id: 'isee', perso: 'isee', x: 7, y: 13, evenement: 'isee_route', cache: true }],
    monstres: [
      { type: 'feu_follet', x: 9, y: 24, rayon: 2 },
      { type: 'feu_follet', x: 3, y: 16, rayon: 2 },
      { type: 'crapaud', x: 9, y: 12, rayon: 2 },
      { type: 'corbeau', x: 9, y: 8, rayon: 3 }
    ],
    sorties: [{ x: [6, 7], y: 29, vers: 'clairfond', a: [11, 1], dir: 'bas' }],
    declencheurs: [
      { x: [4, 5], y: 14, evenement: 'isee_rencontre', si: '!isee_vue' },
      { x: [6, 7], y: 2, evenement: 'porte_abbaye' }
    ]
  }
};

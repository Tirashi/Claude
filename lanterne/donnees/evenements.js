/* La Dernière Lanterne — événements et dialogues du début du prologue (Clairfond et la route de l'abbaye).
   Langage des commandes : moteur-rpg/evenements.js. {HEROS} : le nom choisi par le joueur. */
window.LANTERNE = window.LANTERNE || {};

LANTERNE.evenements = {
  // ---------- début de partie : la maison de Mère Ysolde ----------
  debut: [
    { attendre: .6 },
    { dire: ['Ah, te voilà debout, {HEROS}. J\'ai cru que la brume t\'avait avalé dans ton sommeil.',
      'La lanterne du village vacille depuis trois nuits. Trois nuits ! En quarante ans de veille, je ne l\'ai jamais vue faire ça.',
      'C\'est la Grande Lanterne de l\'abbaye qui faiblit. Toutes les lanternes de la vallée tirent leur feu de la sienne.'], qui: 'ysolde' },
    { choix: 'Tu iras voir le Prieur Vaast, à Saint-Cendre ?', options: ['J\'y vais.', 'Pourquoi moi ?'], suites: [
      [{ dire: 'Brave petit. Je n\'en attendais pas moins de mon apprenti.', qui: 'ysolde' }],
      [{ dire: ['Parce que mes genoux ont soixante-dix hivers, et les tiens seize.',
        'Et parce qu\'un veilleur ne laisse jamais une flamme mourir. Même un apprenti.'], qui: 'ysolde' }]
    ] },
    { dire: ['Tiens. Deux herbes de mon jardin, et quelques écus pour la route.',
      'Prends la route de la forêt, au nord du village. Et reste sur le chemin : la brume mord ceux qui s\'en écartent.'], qui: 'ysolde' },
    { donner: 'herbe', n: 2 }, { ecus: 30 },
    { drapeau: 'mission' }, { chapitre: 'Prologue' }, { sauver: 'auto' }
  ],
  ysolde: [
    { si: 'mission', alors: [
      { si: 'porte_abbaye',
        alors: [{ dire: ['Tu as vu l\'abbaye ? Alors tu as vu la Grande Lanterne. Pâle, hein ?', 'Va, maintenant. Le Prieur t\'attend.'], qui: 'ysolde' }],
        sinon: [{ dire: ['L\'abbaye est au nord, au bout de la route de la forêt.',
          'Si tu es fatigué, va te réchauffer à la lanterne de la place : sa flamme répare bien des choses.'], qui: 'ysolde' }] }
    ], sinon: [{ evenement: 'debut' }] }
  ],
  pupitre_ysolde: [
    { dire: ['Un vieux registre des Veilleurs. Les noms se suivent, siècle après siècle, d\'une écriture appliquée.',
      'Tout en bas, d\'une encre encore fraîche : « {HEROS}, apprenti. »'] }
  ],
  pas_encore: [{ dire: 'Mère Ysolde t\'attend à la maison avant que tu partes. Elle n\'aime pas qu\'on l\'oublie.' }],

  // ---------- les lanternes ----------
  lanterne: [
    { son: 'lanterne' }, { soigner: true },
    { dire: 'La chaleur de la flamme te réconforte. L\'équipe reprend des forces.' },
    { choix: 'Sauvegarder la partie ?', options: ['Oui', 'Non'], suites: [[{ sauver: 'main' }], []] }
  ],
  lanterne_clairfond: [
    { dire: 'La lanterne du village. Sa flamme tremble, se tasse, puis repart, comme une respiration difficile.' },
    { evenement: 'lanterne' }
  ],
  lanterne_oubliee_route: [
    { si: 'oubliee:route',
      alors: [{ dire: 'La vieille lanterne brûle doucement. Ce coin de forêt semble moins sombre.' }],
      sinon: [
        { dire: 'Une vieille lanterne, éteinte depuis longtemps. La pierre est couverte de mousse.' },
        { choix: 'La rallumer ?', options: ['Oui', 'Non'], suites: [[
          { son: 'lanterne' }, { drapeau: 'oubliee:route' },
          { dire: ['La mèche prend. Un instant, toute la brume se met à briller…',
            '…et tu vois une scène qui n\'est pas d\'ici : des silhouettes de brume, lanterne à la main, qui dansent en riant autour d\'un feu.',
            'Puis tout s\'efface. Il ne reste que la petite flamme, et une étrange douceur.'] }
        ], []] }
      ] }
  ],

  // ---------- Clairfond ----------
  statue_aubrin: [
    { dire: ['« AUBRIN LE PORTE-FLAMME, QUI CHASSA LES TÉNÈBRES DE MORNE-VAL. »',
      'La statue brandit bien haut une lanterne. Enfin, c\'est ce qu\'on dit : le sculpteur l\'a faite un peu longue.', 'À ses pieds, quelqu\'un a déposé un bouquet de lys.'] }
  ],
  gaspard: [
    { si: 'gaspard_vu',
      alors: [{ dire: ['Gaspard est partout, mon ami : sur les routes, dans les marais, et même là où il vaudrait mieux ne pas être.',
        'La boutique ? Elle ouvre dès que j\'aurai déballé. C\'est-à-dire bientôt. C\'est-à-dire… plus tard.'], qui: 'gaspard' }],
      sinon: [
        { dire: ['Gaspard, colporteur, pour vous servir ! Et voici Biscotte, mon âne.',
          '… Oui, il a des cornes. Le marchand m\'a juré que c\'était un âne. Je n\'ai jamais osé le contredire.'], qui: 'gaspard' },
        { drapeau: 'gaspard_vu' }
      ] }
  ],
  biscotte: [{ dire: 'Biscotte te regarde longuement, mâchouille quelque chose, puis te tourne le dos.' }],
  enfant: [
    { dire: ['Tu la connais, la comptine ? « Lanterne, lanterne, garde-nous la nuit… »',
      '« … et quand tu t\'endors, la brume nous suit. » Maman dit que c\'est pas une comptine pour les petits.'], qui: 'enfant' }
  ],
  ancien: [
    { dire: ['Quand j\'étais gamin, mon grand-père disait que la brume n\'avait pas toujours été méchante.',
      'Qu\'autrefois, les soirs d\'été, elle chantait. Il perdait un peu la tête, sur la fin… je crois.'], qui: 'ancien' }
  ],
  paysanne: [
    { dire: ['Les poules ne pondent plus depuis que la lanterne vacille. Et le lait tourne.',
      'On dit que la brume est venue jusqu\'au vieux moulin, cette nuit. Fais attention sur la route, petit.'], qui: 'paysanne' }
  ],
  forgeron: [
    { dire: ['La forge est fermée : le charbon n\'arrive plus, les charrettes ne passent plus par les marais.',
      'Reviens me voir plus tard. Je te trouverai une lame digne d\'un veilleur.'], qui: 'forgeron' }
  ],
  // deux voyageurs qui rappellent quelqu'un (clins d'œil discrets à d'autres RPG)
  nuage: [
    { si: 'nuage_vu',
      alors: [{ dire: ['Quoi ? Non, je n\'ai jamais été soldat. Enfin… je crois pas.', 'Bref. Elle sera grande. Très grande.'], qui: 'nuage' }],
      sinon: [
        { dire: ['Bertin m\'a dit non. Encore.',
          'Je veux l\'épée la plus grande du monde. Si grande qu\'on la porte dans le dos, et qu\'elle fasse peur rien qu\'à la regarder.',
          'Il dit qu\'aucun bras ne pourrait la soulever. Il ne connaît pas mes bras.'], qui: 'nuage' },
        { drapeau: 'nuage_vu' }
      ] }
  ],
  garcon_vert: [
    { dire: 'Hyaa !', qui: 'garcon_vert' },
    { dire: 'Il tranche une touffe d\'herbe d\'un grand revers, fouille dedans, puis repart, l\'air déçu.' }
  ],
  forge_fermee: [{ dire: 'La porte de la forge est fermée. Dehors, Bertin ronchonne contre le charbon.' }],
  pecheur: [
    { dire: ['Ça ne mord plus. Même les poissons ont peur de la brume.',
      'Mais hier soir, au bord de l\'étang, j\'ai vu une fille. Toute pâle. Elle regardait l\'eau comme si elle y cherchait quelqu\'un.',
      'Et pouf ! Plus personne.'], qui: 'pecheur' }
  ],
  aubergiste: [
    { dire: ['Bienvenue à l\'Auberge du Lys ! La soupe est chaude, les lits sont durs et les nouvelles sont mauvaises.',
      'Plus personne ne voyage. Sauf ce moine, là-bas, qui ne boit rien et ne dit pas grand-chose.'], qui: 'aubergiste' }
  ],
  voyageur: [
    { dire: ['Je descends de Saint-Cendre. Le Prieur Vaast prie nuit et jour pour la Grande Lanterne.',
      'Un homme admirable. Il n\'a pas changé depuis mon entrée au monastère, il y a quarante ans. Pas une ride.',
      'La sainteté conserve, dit-on.'], qui: 'moine' }
  ],

  // ---------- la route de l'abbaye ----------
  route_entree: [
    { si: 'route_vue', sinon: [
      { drapeau: 'route_vue' },
      { dire: ['La brume s\'épaissit dès les premiers arbres. Elle colle à la peau, froide comme un souvenir.',
        'Des lueurs bougent entre les troncs. Mieux vaut ne pas les laisser approcher… ou les surprendre par derrière.'] }
    ] }
  ],
  isee_rencontre: [
    { drapeau: 'isee_vue' },
    { pnj: 'isee', montrer: true }, { attendre: .7 },
    { dire: ['Tu portes la lumière…', 'Sais-tu ce qu\'elle mange ?'], qui: 'isee' },
    { choix: '…', options: ['Qui es-tu ?', 'Ce qu\'elle mange ?'], suites: [
      [{ dire: 'Quelqu\'un qui se souvient. Va. On t\'attend, là-haut.', qui: 'isee' }],
      [{ dire: 'Tu le sauras. Tout le monde finit par le savoir.', qui: 'isee' }]
    ] },
    { pnj: 'isee', cacher: true },
    { dire: 'La jeune fille recule dans la brume… et la brume se referme sur elle.' }
  ],
  isee_route: [{ dire: '…', qui: 'isee' }],
  porte_abbaye: [
    { si: 'porte_abbaye',
      alors: [{ dire: 'Les grandes portes de Saint-Cendre restent closes. Derrière, une cloche sonne, très loin.' }],
      sinon: [
        { drapeau: 'porte_abbaye' }, { sauver: 'auto' },
        { dire: ['Les portes de l\'abbaye de Saint-Cendre se dressent devant toi, hautes comme trois maisons.',
          'Tout là-haut, la Grande Lanterne brille d\'une lumière pâle, fatiguée.',
          '(Ici s\'arrête cette première version. La suite du prologue, avec le Prieur Vaast et Eloi, arrive bientôt.)'] }
      ] }
  ]
};

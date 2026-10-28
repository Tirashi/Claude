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
  garde: [
    { si: 'garde_vu',
      alors: [{ dire: 'Depuis, je garde la route. Ça ne demande pas beaucoup de genou.', qui: 'garde' }],
      sinon: [
        { dire: ['Halte ! … Ah, c\'est toi, l\'apprenti d\'Ysolde. Tu montes à l\'abbaye ?',
          'Moi aussi, j\'étais veilleur, comme toi. Et puis j\'ai pris une flèche dans le genou.'], qui: 'garde' },
        { drapeau: 'garde_vu' }
      ] }
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
  // ---------- l'abbaye : le Prieur Vaast et Eloi ----------
  abbaye_entree: [
    { si: 'vaast_vu', sinon: [
      { attendre: .5 },
      { dire: 'Sous la voûte, la Grande Lanterne brûle d\'une lumière pâle. Un vieil homme en robe blanche se retourne.' },
      { dire: ['Ah… Mère Ysolde t\'envoie. Approche, enfant. N\'aie pas peur de la lumière.',
        'Tu la vois, la Grande Lanterne ? Elle faiblit. Un peu plus chaque nuit.',
        'Autrefois, quatre flammes la nourrissaient. La brume les a dispersées dans quatre sanctuaires de la vallée.',
        'Rapporte-les-moi, et Morne-Val sera sauve.',
        'La première, la Flamme rouge, dort dans la Crypte des racines, au cœur du Bois Murmurant, à l\'est de Clairfond.'], qui: 'vaast' },
      { choix: 'Tu rapporteras les flammes ?', options: ['Je les rapporterai.', 'Pourquoi la brume les a-t-elle prises ?'], suites: [
        [{ dire: 'Bien. Très bien.', qui: 'vaast' }],
        [{ dire: ['La brume prend tout ce qui brille, mon enfant. C\'est sa nature.', '… Du moins, c\'est ce qu\'on enseigne ici.'], qui: 'vaast' }]
      ] },
      { dire: ['Prends cette lanterne de veilleur. Elle est éteinte… mais elle reconnaîtra la flamme.'], qui: 'vaast' },
      { donner: 'lanterne_eteinte', n: 1 },
      { dire: 'Et tu ne partiras pas seul. Eloi !', qui: 'vaast' },
      { pnj: 'eloi', aller: [7, 4] },
      { dire: ['Oui, Père ! Je suis prêt !', '… Enfin, je crois.'], qui: 'eloi' },
      { dire: ['Eloi est jeune, mais sa prière est sincère. Il soignera vos blessures.', 'Et Eloi… tu m\'écriras. Souvent. Je veux tout savoir.'], qui: 'vaast' },
      { pnj: 'eloi', cacher: true }, { rejoindre: 'eloi' }, { drapeau: 'eloi_rejoint' },
      { dire: 'Eloi rejoint l\'équipe !' },
      { drapeau: 'vaast_vu' }, { drapeau: 'mission_flammes' }, { chapitre: 'Acte 1' }, { sauver: 'auto' }
    ] }
  ],
  vaast: [
    { si: 'roi_vaincu',
      alors: [{ dire: 'Tu as la Flamme rouge… Je la sens d\'ici. Garde-la bien. Je viendrai la chercher en temps voulu.', qui: 'vaast' }],
      sinon: [{ dire: ['La Crypte des racines est à l\'est de Clairfond, au cœur du Bois Murmurant.', 'Ne t\'attarde pas dans la brume. Elle ment.'], qui: 'vaast' }] }
  ],
  eloi_abbaye: [{ dire: 'Le Prieur m\'a élevé ici. Je n\'ai jamais dépassé le bas de la route…', qui: 'eloi' }],
  grande_lanterne: [{ dire: ['La Grande Lanterne. Sa flamme est blanche, presque froide.', 'De près, on croit entendre un murmure, comme quatre voix très lointaines.'] }],

  // ---------- acte 1 : le Bois Murmurant et Vérène ----------
  bois_ferme: [{ dire: 'Le Bois Murmurant… Mère Ysolde t\'a toujours interdit d\'y aller. Pas sans une bonne raison, en tout cas.' }],
  bois_entree: [
    { si: 'bois_vu', sinon: [
      { drapeau: 'bois_vu' },
      { dire: 'Les arbres chuchotent quand le vent passe. On dirait des noms.' },
      { dire: 'Le Prieur dit que la brume est le mal… mais elle chante, ici. Vous l\'entendez ?', qui: 'eloi' }
    ] }
  ],
  verene_scene: [
    { drapeau: 'verene_vue' },
    { pnj: 'verene', montrer: true }, { pnj: 'loup_a', montrer: true }, { pnj: 'loup_b', montrer: true }, { attendre: .5 },
    { dire: ['Ne restez pas plantés là ! Ces bêtes n\'ont pas lu mes traités !', 'Battez-vous avec moi, je m\'occupe du feu !'], qui: 'verene' },
    { rejoindre: 'verene' }, { pnj: 'verene', cacher: true },
    { combat: ['loup', 'corbeau'], fuite: false },
    { pnj: 'loup_a', cacher: true }, { pnj: 'loup_b', cacher: true },
    { dire: ['Merci. Vérène, savante. Je vous serrerais bien la main, mais je tiens mon bâton.',
      'La brume n\'est pas un poison, vous savez. Elle est vivante. Personne ne me croit, à Port-Gris.'], qui: 'verene' },
    { dire: 'Le Prieur dit que la brume est le mal.', qui: 'eloi' },
    { dire: ['Le Prieur dit beaucoup de choses.', 'Vous allez à la Crypte des racines ? Je viens. Il paraît qu\'il y a des fresques. Et j\'ai envie de comprendre.'], qui: 'verene' },
    { dire: 'Vérène rejoint l\'équipe !' },
    { drapeau: 'verene_rejoint' }, { sauver: 'auto' }
  ],
  verene_bois: [{ dire: '…', qui: 'verene' }],
  lanterne_oubliee_bois: [
    { si: 'oubliee:bois',
      alors: [{ dire: 'La vieille lanterne brûle doucement entre les arbres.' }],
      sinon: [
        { dire: 'Une lanterne oubliée, à moitié avalée par le lierre.' },
        { choix: 'La rallumer ?', options: ['Oui', 'Non'], suites: [[
          { son: 'lanterne' }, { drapeau: 'oubliee:bois' },
          { dire: ['La brume s\'illumine. Un souvenir monte :',
            'une femme de brume berce un enfant de chair, au bord d\'un village. Les deux rient. Personne n\'a peur.',
            'Puis la vision se défait comme une buée sur une vitre.'] },
          // on peut rallumer cette lanterne avant d'avoir rencontré Vérène : Eloi parle à sa place
          { si: { equipe: 'verene' }, alors: [{ dire: 'Vous avez vu ? Elles vivaient AVEC eux !', qui: 'verene' }],
            sinon: [{ dire: ['Une femme de brume… et un enfant.', 'Ils n\'avaient pas peur l\'un de l\'autre.'], qui: 'eloi' }] }
        ], []] }
      ] }
  ],

  // l'entrée de la crypte attend Vérène (ses répliques dans la crypte supposent qu'elle est là)
  crypte_fermee: [
    { dire: 'Un escalier s\'enfonce sous les racines.' },
    { dire: ['Attendez… Vous entendez ? Quelqu\'un crie, vers le sud du bois !', 'La crypte attendra.'], qui: 'eloi' }
  ],

  // ---------- la Crypte des racines ----------
  crypte_arrivee: [
    { si: 'crypte_vue', sinon: [
      { drapeau: 'crypte_vue' },
      { dire: 'Des racines descendent du plafond comme des doigts. L\'air sent la terre et le lys.' },
      { dire: 'Une grille au fond… Il y a sûrement un mécanisme. Les anciens aimaient les mécanismes.', qui: 'verene' }
    ] }
  ],
  tresor_meche: [
    { si: 'coffre:tresor',
      alors: [{ dire: 'Le coffre est vide.' }],
      sinon: [
        { drapeau: 'coffre:tresor' }, { son: 'coffre' },
        { dire: ['Au fond du coffre, une vieille mèche de veilleur, encore imbibée d\'huile de lys.',
          'Tu l\'enfiles dans la lanterne du Prieur…', '… et une petite flamme pâle s\'allume toute seule !'] },
        { prendre: 'lanterne_eteinte' }, { donner: 'lanterne_veilleur' }, { drapeau: 'outil:lanterne' }, { son: 'lanterne' },
        { dire: 'Tu as la Lanterne du veilleur ! Face à une nappe de brume, appuie sur B pour la dissiper.' },
        { dire: 'Elle n\'éclaire pas comme une lanterne ordinaire. On dirait… qu\'elle écoute.', qui: 'verene' }
      ] }
  ],
  coeur_arrivee: [
    { si: 'roi_vaincu', sinon: [{ si: 'coeur_vu', sinon: [
      { drapeau: 'coeur_vu' },
      { dire: 'Au cœur de la crypte, une silhouette immense attend, couronnée de branches.' }
    ] }] }
  ],
  roi_parle: [{ dire: 'Approche, porteur de lumière. Je t\'attends depuis trois cents ans.', qui: 'roi' }],
  roi_combat: [
    { dire: ['Encore des porteurs de lumière…', 'Vous venez pour la flamme. Vous venez toujours pour la flamme.'], qui: 'roi' },
    { dire: 'Il… parle ?', qui: 'verene' },
    { dire: 'Que la Lumière nous garde !', qui: 'eloi' },
    { combat: ['roi_aulnes'], boss: true },
    { drapeau: 'roi_vaincu' },
    { dire: 'Encore… tu nous enfermes… encore…', qui: 'roi' },
    { pnj: 'roi', cacher: true },
    { dire: ['Le Roi des aulnes s\'effondre en un tas de racines.', 'Au milieu, une petite flamme rouge bat comme un cœur.'] },
    { son: 'lanterne' }, { donner: 'flamme_rouge' }, { drapeau: 'flamme_rouge' },
    { dire: 'La Flamme rouge se loge dans la lanterne. Elle tremble, puis se calme.' },
    { dire: '« Encore », il a dit. Comme si on l\'avait déjà fait.', qui: 'verene' },
    { sauver: 'auto' }
  ],
  fresque_racines: [
    { dire: 'Une fresque couvre le mur, à demi cachée par les racines.' },
    { si: 'verene_rejoint', alors: [
      { dire: ['Regardez… des silhouettes de brume, une lanterne à la main.',
        'Elles ne fuient pas la lumière. Elles la portent.'], qui: 'verene' },
      { dire: 'Ce ne sont que des images.', qui: 'eloi' },
      { dire: 'Les images, c\'est ce qui reste quand on a fait taire les gens.', qui: 'verene' },
      { si: 'roi_vaincu', alors: [{ evenement: 'fin_acte1' }] }
    ] }
  ],
  fin_acte1: [
    { si: 'acte1_fini', sinon: [
      { drapeau: 'acte1_fini' }, { chapitre: 'Acte 1 — la Flamme rouge' },
      { teleporter: 'bois_murmurant', x: 26, y: 4, dir: 'bas' },
      { pnj: 'verene', montrer: true }, { attendre: .3 }, { pnj: 'verene', cacher: true },
      { dire: 'Dehors, la brume s\'est écartée autour de la ruine. Une silhouette pâle attend sur le chemin.' },
      { dire: ['Une flamme de moins dans la brume.', 'Elle pleurait, tu sais. Tu l\'as entendue ?'], qui: 'isee' },
      { dire: 'Quand on lève les yeux, la jeune fille n\'est déjà plus là.' },
      { dire: '(Fin de l\'acte 1. La suite — Port-Gris, Maud et le Marais des cloches — arrive bientôt.)' },
      { sauver: 'auto' }
    ] }
  ],
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

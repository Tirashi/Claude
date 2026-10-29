/* La Dernière Lanterne — événements et dialogues du début du prologue (Clairfond et la route de l'abbaye).
   Langage des commandes : moteur-rpg/evenements.js. {HEROS} : le nom choisi par le joueur. */
window.LANTERNE = window.LANTERNE || {};

/* Une boutique : un choix par article (un achat par visite), puis la réplique du marchand.
   articles : [[objet, prix], …] ; merci : ce que dit le marchand après un achat. */
const boutique = (qui, articles, merci) => [
  { choix: 'Que veux-tu acheter ? (Tu as {ECUS} écus.)', options: articles.map(([id, prix]) => `${LANTERNE.objets[id].nom} : ${prix} écus`).concat(['Rien, merci.']),
    suites: articles.map(([id, prix]) => [{ si: { ecus: prix },
      alors: [{ ecus: -prix }, { donner: id, n: 1 }, { dire: merci, qui }],
      sinon: [{ dire: 'Il te manque quelques écus, on dirait.', qui }] }]) }
];

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
    { si: 'acte2_fini', alors: [
      { dire: 'Le charbon repasse par les marais ! La forge ronfle de nouveau. Tiens, regarde-moi ça.', qui: 'forgeron' },
      ...boutique('forgeron', [['epee_acier', 160], ['cotte', 120], ['masse_fer', 90]], 'Prends-en soin. Une lame, ça s\'aime.'),
      { stop: true }
    ] },
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
  panneau_marais: [
    { si: 'mission_marais',
      alors: [{ dire: ['Au sud : la route des marais, puis Port-Gris.', 'Sous l\'écriteau, quelqu\'un a gratté le mot « FERMÉE ».'] }],
      sinon: [{ dire: ['Au sud : la route des marais.', 'Fermée tant que la brume est si épaisse. — Les Veilleurs'] }] }
  ],
  marais_ferme: [
    { dire: 'Une barrière de bois ferme la route des marais. Un écriteau : « FERMÉE. Ordre des Veilleurs. »' },
    { si: 'roi_vaincu', alors: [{ dire: 'Le Prieur peut faire lever la barrière. Allons d\'abord à l\'abbaye !', qui: 'eloi' }] }
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
    { si: 'mission_marais', alors: [{ dire: ['Le Moulin noyé est au cœur du Marais des cloches, à l\'est de Port-Gris.', 'Garde bien les flammes. Elles sont… précieuses.'], qui: 'vaast' }, { stop: true }] },
    { si: 'roi_vaincu',
      alors: [{ evenement: 'vaast_acte2' }],
      sinon: [{ dire: ['La Crypte des racines est à l\'est de Clairfond, au cœur du Bois Murmurant.', 'Ne t\'attarde pas dans la brume. Elle ment.'], qui: 'vaast' }] }
  ],
  vaast_acte2: [
    { dire: ['La Flamme rouge… Je la sens d\'ici. Elle bat fort, n\'est-ce pas ?',
      'Non, garde-la dans ta lanterne. Elle y est plus à l\'abri que derrière mes murs. Quand les quatre seront réunies, je saurai les accueillir.'], qui: 'vaast' },
    { dire: 'Père… le Roi des aulnes a parlé. Il a dit « encore ». Comme si…', qui: 'eloi' },
    { dire: ['La brume ment, Eloi. Elle prend la voix de ceux qu\'elle a avalés. Ne l\'écoute pas.',
      'La deuxième flamme, la Flamme bleue, dort au Moulin noyé, au cœur du Marais des cloches.',
      'La route des marais part du sud de Clairfond. Je fais lever la barrière dès ce soir.',
      'À Port-Gris, trouve un guide. Personne ne traverse le marais sans quelqu\'un qui connaît les sentiers.'], qui: 'vaast' },
    { dire: '« La brume ment. » C\'est pratique, comme réponse.', qui: 'verene' },
    { drapeau: 'mission_marais' }, { chapitre: 'Acte 2' }, { sauver: 'auto' },
    { dire: '(Acte 2 : la Flamme bleue. La route des marais est ouverte, au sud de Clairfond.)' }
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
      { dire: 'Il faut prévenir le Prieur. Il saura quoi faire de cette flamme.', qui: 'eloi' },
      { dire: '(Fin de l\'acte 1. Retourne à l\'abbaye de Saint-Cendre, au nord de Clairfond.)' },
      { sauver: 'auto' }
    ] }
  ],
  // ---------- acte 2 : la route des marais ----------
  marais_entree: [
    { si: 'route_marais_vue', sinon: [
      { drapeau: 'route_marais_vue' },
      { dire: 'La route s\'enfonce dans les roseaux. L\'eau est partout, immobile, couleur de thé froid.' },
      { dire: 'J\'ai grandi par ici. La vase garde tout : les bottes, les pièces, les secrets.', qui: 'verene' }
    ] }
  ],
  marchand: [
    { dire: ['Bienvenue, bienvenue ! On ne croise pas grand monde, par ici. Juste des sangsues. Elles n\'achètent rien.',
      'J\'ai de quoi tenir jusqu\'à Port-Gris.'], qui: 'marchand' },
    ...boutique('marchand', [['herbe', 14], ['fiole', 28], ['antidote', 10]], 'Merci de votre visite !'),
    { dire: 'Merci de votre visite !', qui: 'marchand' }
  ],
  lanterne_oubliee_marais: [
    { si: 'oubliee:marais_route',
      alors: [{ dire: 'La vieille lanterne brûle au-dessus de l\'eau. Les grenouilles se sont tues pour la regarder.' }],
      sinon: [
        { dire: 'Une lanterne oubliée, penchée au bord de l\'eau. Des escargots ont fait leur maison dedans.' },
        { choix: 'La rallumer ?', options: ['Oui', 'Non'], suites: [[
          { son: 'lanterne' }, { drapeau: 'oubliee:marais_route' },
          { dire: ['La flamme prend. Sur l\'eau, un souvenir se dessine :',
            'un moulin qui tourne au clair de lune. Des silhouettes de brume y portent des sacs de grain, et les déposent devant les portes des maisons endormies.',
            'Au matin, les villageois trouvent la farine et remercient le ciel.'] },
          { dire: 'Ils les nourrissaient. Les gens de la brume nourrissaient les villages.', qui: 'verene' }
        ], []] }
      ] }
  ],

  // ---------- Port-Gris ----------
  port_entree: [
    { si: 'port_vu', sinon: [
      { drapeau: 'port_vu' }, { sauver: 'auto' },
      { dire: 'Port-Gris : des maisons serrées sur une butte, un quai de planches, des barques retournées. Et partout, l\'odeur du poisson et de la vase.' },
      { dire: ['Mon village. Ici, on m\'appelle « la folle à la craie ».', 'Pour le guide, allez voir à la Cloche fêlée, la taverne. Ceux qui connaissent les sentiers y boivent leurs dettes.'], qui: 'verene' }
    ] }
  ],
  lanterne_port: [
    { dire: 'La lanterne de Port-Gris. On a accroché des coquillages tout autour, pour qu\'elle se sente moins seule.' },
    { evenement: 'lanterne' }
  ],
  statue_port: [
    { dire: ['« AUBRIN LE PORTE-FLAMME ». La même statue qu\'à Clairfond, mais couverte d\'algues séchées.',
      'Quelqu\'un a noué un ruban bleu autour de sa lanterne. Dessous, gravé petit : « RENDS-LES-NOUS ».'] },
    { dire: 'Rends… quoi ?', qui: 'eloi' }
  ],
  maitre_port: [
    { si: 'acte2_fini',
      alors: [{ dire: 'Les cloches se sont tues, cette nuit. Toutes. C\'est la première fois en quarante ans que je dors d\'un trait.', qui: 'maitre_port' }],
      sinon: [{ dire: ['Odon, maître du port. Du port qui reste, en tout cas.',
        'La nuit, les cloches du marais sonnent toutes seules. Il y en a des dizaines, englouties là-bas, depuis le temps des noces.',
        'Le moulin de la Bief tournait encore sans meunier il y a dix ans. Maintenant il est noyé. Et quelqu\'un y chante.'], qui: 'maitre_port' }] }
  ],
  pecheuse: [
    { dire: ['Annick, pêcheuse. Enfin, pêcheuse… je remonte surtout des bottes.',
      'Tu vois l\'îlot, là-bas ? Il y a un coffre dessus depuis toujours. Personne n\'a jamais pu l\'atteindre : trop de vase, trop de sangsues.',
      'Il faudrait voler, ou alors s\'accrocher à ce vieux pieu.'], qui: 'pecheuse' }
  ],
  dresseur: [
    { si: 'dresseur_vu',
      alors: [{ dire: ['Mon rêve ? Être le meilleur dresseur de feux follets de toute la vallée !', 'Mamie dit que c\'est pas un vrai métier.'], qui: 'dresseur' }],
      sinon: [
        { dire: ['Regarde ! Dans mon bocal ! J\'en ai attrapé un !', 'Un feu follet. Il s\'appelle Pompon. Je vais tous les attraper, tu verras. Tous !'], qui: 'dresseur' },
        { dire: 'Il est… triste, ton Pompon. Il tourne en rond.', qui: 'verene' },
        { dire: ['Mais non, il est content ! Il fait des tours ! …', '… Bon. Peut-être que je le relâcherai ce soir.'], qui: 'dresseur' },
        { drapeau: 'dresseur_vu' }
      ] }
  ],
  conteuse: [
    { dire: ['Assieds-toi, petit. Mamie Rose connaît toutes les comptines du marais.',
      '« Quatre veilleurs de brume, au bord du val,',
      '« Un sous la terre, un sous le moulin, un sous le sel, un sous les cloches.',
      '« Tant qu\'ils veillent, dors, mon enfant ; la brume te borde… »',
      'C\'est ma grand-mère qui la chantait. Bizarre, hein ? Comme si la brume était gentille.'], qui: 'conteuse' },
    { dire: 'Un sous la terre… et un sous le moulin.', qui: 'verene' }
  ],
  gaspard_port: [
    { si: 'gaspard_port_vu', sinon: [
      { dire: ['Ha ! Je vous l\'avais dit, Gaspard est partout ! Biscotte a fait la route sous la pluie, il boude.',
        'Et la boutique est ouverte ! Pour de vrai, cette fois.'], qui: 'gaspard' },
      { drapeau: 'gaspard_port_vu' }
    ] },
    ...boutique('gaspard', [['herbe', 12], ['fiole', 25], ['antidote', 9], ['plume', 80], ['bottes', 70]], 'Excellent choix ! Biscotte approuve. Enfin, je crois.')
  ],
  aubergiste_port: [
    { dire: ['Paulin, patron de la Cloche fêlée. On l\'appelle comme ça parce que la cloche de la porte est fêlée. Pas plus compliqué.',
      'Un guide pour le marais ? Personne n\'y va plus. À part elle, là-bas, au fond. Mais elle ne fait rien pour rien.'], qui: 'aubergiste_port' }
  ],
  maud_taverne: [
    { dire: ['Maud. Contrebandière, quand il y a quelque chose à passer. Guide, quand il y a quelqu\'un à perdre.',
      'Vous voulez aller au Moulin noyé ? Personne ne va au Moulin noyé.'], qui: 'maud' },
    { choix: 'Que lui répondre ?', options: ['Nous y allons quand même.', 'Le Prieur nous envoie.'], suites: [
      [{ dire: 'J\'aime bien les gens têtus. Ils paient en retard, mais ils paient.', qui: 'maud' }],
      [{ dire: 'Le Prieur. Évidemment. Le Prieur n\'a jamais mis les pieds dans la vase, lui.', qui: 'maud' }]
    ] },
    { dire: 'Maud, attends… Tu connais les sentiers de la brume ? Les vrais ?', qui: 'verene' },
    { dire: ['Vérène la folle à la craie. Toujours à parler à la brume ?',
      '… Mon petit frère, Tiennot, s\'est perdu dedans. Il y a sept ans. Il courait derrière un feu follet.',
      'Depuis, j\'y vais. Tous les soirs. Je connais chaque pieu, chaque trou d\'eau. Je ne l\'ai jamais retrouvé.'], qui: 'maud' },
    { dire: 'On cherche les flammes de la Grande Lanterne. Si la brume recule, peut-être que…', qui: 'eloi' },
    { dire: ['Peut-être. C\'est un mot que j\'aime bien.', 'D\'accord. Je vous guide. Vous payez la soupe, et vous ne touchez pas à mon arc.'], qui: 'maud' },
    { pnj: 'maud', cacher: true }, { rejoindre: 'maud' }, { drapeau: 'maud_rejoint' },
    { dire: 'Maud rejoint l\'équipe ! L\'équipe est au complet.' },
    { dire: 'Le marais, c\'est à l\'est du village, par le quai. Suivez-moi et marchez où je marche.', qui: 'maud' },
    { sauver: 'auto' }
  ],
  sans_guide: [
    { dire: 'Le quai s\'arrête sur l\'eau noire. Au-delà, la brume avale les pieux un par un.' },
    { dire: 'Sans guide, on ne ressortira jamais de là. Allons voir à la taverne.', qui: 'verene' }
  ],

  // ---------- le Marais des cloches ----------
  cloches_entree: [
    { si: 'cloches_vu', sinon: [
      { drapeau: 'cloches_vu' },
      { dire: 'Une cloche dépasse de l\'eau, verte de mousse. Puis une autre. Puis dix. Le vent passe dessus et elles bourdonnent toutes ensemble.' },
      { dire: ['Le Marais des cloches. Le moulin est au nord-est, au bout du chemin.', 'Restez sur la vase. L\'eau, ici, a des dents.'], qui: 'maud' }
    ] }
  ],
  isee_cloches: [
    { drapeau: 'isee_cloches' },
    { pnj: 'isee', montrer: true }, { attendre: .6 },
    { dire: ['Avant, elles sonnaient pour les noces. Les gens de la brume et ceux de la terre se mariaient ici, sur l\'eau.',
      'Maintenant, elles sonnent pour rien. Pour personne.'], qui: 'isee' },
    { dire: 'Qui es-tu, toi ? Je ne t\'ai jamais vue au village.', qui: 'maud' },
    { dire: 'Toi, je t\'ai vue. Tous les soirs. Tu appelles un nom dans la brume.', qui: 'isee' },
    { pnj: 'isee', cacher: true },
    { dire: 'La brume se referme. Maud reste immobile un long moment.' },
    { dire: '… Avançons.', qui: 'maud' }
  ],
  lanterne_oubliee_cloches: [
    { si: 'oubliee:cloches',
      alors: [{ dire: 'La lanterne brûle au milieu des roseaux. Les cloches les plus proches se sont tues.' }],
      sinon: [
        { dire: 'Une lanterne oubliée, à moitié enfoncée dans la vase.' },
        { choix: 'La rallumer ?', options: ['Oui', 'Non'], suites: [[
          { son: 'lanterne' }, { drapeau: 'oubliee:cloches' },
          { dire: ['La mèche s\'allume, et le marais tout entier se met à chanter.',
            'Une grande dame de brume se tient près de la roue du moulin. Elle fredonne, et tous les enfants du village dorment à poings fermés.',
            'La vision se défait. Il reste un air de berceuse, très loin.'] },
          { dire: 'Je la connais, cette berceuse. Ma mère me la chantait.', qui: 'maud' }
        ], []] }
      ] }
  ],
  crapaud_roi: [
    { dire: ['Un gros crapaud porte une petite couronne d\'or. Il te fixe avec un immense espoir.', 'Il avance les lèvres.'] },
    { choix: '…', options: ['L\'embrasser', 'Surtout pas'], suites: [
      [{ dire: 'Tu te penches… Le crapaud ferme les yeux… et se fait engloutir par une bulle de vase. Il ressort, dignement, un peu plus loin.' },
        { dire: 'Je n\'ai rien vu. Personne n\'a rien vu.', qui: 'maud' }],
      [{ dire: 'Croa. (Il a l\'air déçu, mais habitué.)', qui: 'crapaud_roi' }]
    ] }
  ],

  // ---------- le Moulin noyé ----------
  moulin_arrivee: [
    { si: 'moulin_vu', sinon: [
      { drapeau: 'moulin_vu' },
      { dire: 'L\'eau a envahi le moulin jusqu\'aux genoux des murs. Quelque part, une grande roue tourne lentement, sans bruit.' },
      { dire: 'Écoutez… Quelqu\'un chante.', qui: 'eloi' },
      { dire: 'Personne ne chante. C\'est la roue. … C\'est la roue, d\'accord ?', qui: 'maud' }
    ] }
  ],
  tresor_grappin: [
    { si: 'coffre:grappin',
      alors: [{ dire: 'Le coffre est vide.' }],
      sinon: [
        { drapeau: 'coffre:grappin' }, { son: 'coffre' },
        { dire: ['Dans le coffre, un crochet de fer à trois dents, au bout d\'une longue corde enroulée.', 'Le meunier s\'en servait pour attraper les sacs sur les barques.'] },
        { donner: 'grappin' }, { drapeau: 'outil:grappin' },
        { dire: 'Tu as le Grappin ! Face à l\'eau, appuie sur B : il file jusqu\'au pieu d\'en face et tire toute l\'équipe sur l\'autre rive.' },
        { dire: ['Un grappin ! J\'ai toujours voulu un grappin.', 'Les pieux cerclés de fer, dans le moulin : c\'est pour ça qu\'ils sont là.'], qui: 'maud' }
      ] }
  ],
  moulin_coeur_arrivee: [
    { si: 'dame_vaincue', sinon: [{ si: 'moulin_coeur_vu', sinon: [
      { drapeau: 'moulin_coeur_vu' },
      { dire: 'Au cœur du moulin, deux roues tournent à l\'envers. Entre elles, une grande dame pâle peigne ses cheveux mouillés.' }
    ] }] }
  ],
  dame_parle: [{ dire: 'Chut… Les enfants dorment. Ils dorment depuis si longtemps.', qui: 'dame' }],
  dame_combat: [
    { dire: ['Encore une lumière… Vous allez réveiller les enfants.', 'On m\'a pris ma voix, une fois. On m\'a enfermée dans le bruit de la roue. Vous ne me prendrez pas le reste.'], qui: 'dame' },
    { dire: 'Elle… elle a peur de nous ?', qui: 'eloi' },
    { dire: 'Attention ! Quand l\'eau monte autour d\'elle, mettez-vous en garde !', qui: 'maud' },
    { combat: ['dame_moulin'], boss: true },
    { drapeau: 'dame_vaincue' },
    { dire: 'Ma berceuse… vous l\'emportez aussi…', qui: 'dame' },
    { pnj: 'dame', cacher: true },
    { dire: ['La Dame du moulin s\'effondre en une flaque d\'eau claire. Les deux roues s\'arrêtent.', 'Au milieu de la flaque, une petite flamme bleue tremble comme un reflet.'] },
    { son: 'lanterne' }, { donner: 'flamme_bleue' }, { drapeau: 'flamme_bleue' },
    { dire: 'La Flamme bleue rejoint la rouge dans la lanterne. Elles se tournent autour, comme deux poissons dans un bocal.' },
    { dire: 'Elle n\'attaquait pas. Elle protégeait quelque chose. Comme le Roi.', qui: 'maud' },
    { sauver: 'auto' }
  ],
  fresque_moulin: [
    { dire: 'Une fresque couvre le mur du fond, lavée par l\'eau, mais encore lisible.' },
    { dire: ['Quatre grandes silhouettes de brume, aux quatre coins de la vallée. Une sous les racines, une sous un moulin…',
      'Et au-dessus des villages, la brume ne forme pas un mur. Elle forme un toit. Un abri.'], qui: 'verene' },
    { dire: 'La comptine de Mamie Rose. « Quatre veilleurs de brume… »', qui: 'maud' },
    { dire: ['Ce ne sont pas des monstres. Ce sont des gardiens.', 'Et nous… nous leur prenons leurs flammes.'], qui: 'verene' },
    { dire: 'Le Prieur dit que la brume ment.', qui: 'eloi' },
    { dire: 'Une fresque ne ment pas, Eloi. Elle n\'a pas de voix pour ça.', qui: 'verene' },
    { si: 'dame_vaincue', alors: [{ evenement: 'fin_acte2' }] }
  ],
  fin_acte2: [
    { si: 'acte2_fini', sinon: [
      { drapeau: 'acte2_fini' }, { chapitre: 'Acte 2 — la Flamme bleue' },
      { teleporter: 'marais_cloches', x: 23, y: 6, dir: 'bas' },
      { dire: 'Dehors, les cloches du marais se sont tues. Toutes à la fois. Le silence est si grand qu\'on entend la brume glisser sur l\'eau.' },
      { dire: ['Deux flammes. Plus que deux.', 'Je ne sais pas si je dois être fière ou avoir honte.'], qui: 'verene' },
      { dire: 'On continue. Si la réponse est quelque part, c\'est au bout. Et Tiennot aussi, peut-être.', qui: 'maud' },
      { dire: '(Fin de l\'acte 2. La suite — le Hameau caché et les Hautes-Roches — arrive bientôt.)' },
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

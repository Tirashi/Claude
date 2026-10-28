/* La Dernière Lanterne — données des combats : objets et équipement, talents des 4 classes,
   monstres et rencontres (cahier des charges § 7.1, § 9, § 10). Moteur : moteur-rpg/combat.js. */
window.LANTERNE = window.LANTERNE || {};

// combat : effet en combat (et dans le menu) ; equip : objet que l'on porte (emplacement, classes, bonus)
LANTERNE.objets = {
  herbe: { nom: 'Herbe', description: 'Une herbe amère qui rend 50 PV.', combat: { soin: 50 } },
  fiole: { nom: 'Fiole bleue', description: 'Rend 15 PM.', combat: { pm: 15 } },
  antidote: { nom: 'Antidote', description: 'Guérit du poison.', combat: { guerit: 'poison' } },
  plume: { nom: 'Plume de phénix', description: 'Relève un héros à terre avec la moitié de ses PV.', combat: { releve: .5 } },
  meche: { nom: 'Mèche', description: 'Ranime une lanterne de sauvegarde éteinte.' },
  // objets de l'histoire
  lanterne_eteinte: { nom: 'Lanterne éteinte', description: 'Donnée par le Prieur Vaast. « Elle reconnaîtra la flamme. »' },
  lanterne_veilleur: { nom: 'Lanterne du veilleur', description: 'Sa flamme pâle dissipe les nappes de brume (B, devant la brume).' },
  cle_crypte: { nom: 'Petite clé', description: 'Une clé verdie, trouvée dans la Crypte des racines.' },
  flamme_rouge: { nom: 'Flamme rouge', description: 'Elle bat comme un cœur. Parfois, on croit l\'entendre pleurer.' },
  // armes
  epee_courte: { nom: 'Épée courte', description: 'L\'épée d\'entraînement des apprentis veilleurs.', equip: { emplacement: 'arme', classes: ['LAME'], for: 3 } },
  epee_longue: { nom: 'Épée longue', description: 'Une vraie lame, lourde et droite.', equip: { emplacement: 'arme', classes: ['LAME'], for: 7 } },
  masse: { nom: 'Masse de novice', description: 'Une masse de bois cerclée de fer.', equip: { emplacement: 'arme', classes: ['CLERC'], for: 3 } },
  baton: { nom: 'Bâton de chêne', description: 'Vérène y a gravé des formules qu\'elle seule comprend.', equip: { emplacement: 'arme', classes: ['ARCANISTE'], for: 1, mag: 3 } },
  arc_court: { nom: 'Arc court', description: 'Léger, rapide, souvent recollé.', equip: { emplacement: 'arme', classes: ['RODEUR'], for: 3, vit: 1 } },
  // armures
  tunique: { nom: 'Tunique de veilleur', description: 'Le gris des Veilleurs, un peu trop grand.', equip: { emplacement: 'armure', def: 2 } },
  robe_novice: { nom: 'Robe de novice', description: 'Blanche, avec les manches usées.', equip: { emplacement: 'armure', classes: ['CLERC', 'ARCANISTE'], def: 2, mag: 1 } },
  robe_savante: { nom: 'Robe de savante', description: 'Pleine de poches, pleine de craie.', equip: { emplacement: 'armure', classes: ['ARCANISTE'], def: 1, mag: 2 } },
  cuir: { nom: 'Veste de cuir', description: 'Sent la vase et le feu de bois.', equip: { emplacement: 'armure', def: 3 } },
  cotte: { nom: 'Cotte de mailles', description: 'Lourde, mais rassurante.', equip: { emplacement: 'armure', classes: ['LAME', 'CLERC'], def: 6, vit: -1 } },
  // accessoires
  ruban: { nom: 'Ruban de vitesse', description: 'Un ruban bleu, noué au poignet.', equip: { emplacement: 'accessoire', vit: 2 } }
};

/* Talents et sorts (§ 7.1). cible : ennemi, ennemis (tous), allie, allies (toute l'équipe), soi, allie_ko.
   Puissance des sorts : dégâts = puissance + MAG ÷ 2 ; soins : PV = puissance + MAG. */
LANTERNE.talents = {
  // LAME
  coup_puissant: { nom: 'Coup puissant', classe: 'LAME', niveau: 1, pm: 2, cible: 'ennemi', description: 'Une attaque × 1,5.', effet: { type: 'arme', mult: 1.5 } },
  cri: { nom: 'Cri', classe: 'LAME', niveau: 4, pm: 3, cible: 'soi', description: 'Force + 25 % pendant 3 tours.', visuel: 'buff', effet: { type: 'buff', stat: 'for', mult: 1.25, tours: 3, texte: 'pousse un cri : sa Force monte !' } },
  protection: { nom: 'Protection', classe: 'LAME', niveau: 8, pm: 3, cible: 'soi', description: 'Reçoit à la place des autres les coups de ce tour.', visuel: 'buff', effet: { type: 'protection', priorite: true } },
  tourbillon: { nom: 'Tourbillon', classe: 'LAME', niveau: 13, pm: 6, cible: 'ennemis', description: 'Frappe tous les ennemis.', effet: { type: 'arme', mult: .75 } },
  brise_armure: { nom: 'Brise-armure', classe: 'LAME', niveau: 18, pm: 5, cible: 'ennemi', description: 'Défense de l\'ennemi ÷ 2 pendant 3 tours.', visuel: 'coup', effet: { type: 'brise', tours: 3 } },
  rempart: { nom: 'Rempart', classe: 'LAME', niveau: 24, pm: 8, cible: 'soi', description: 'Dégâts reçus par l\'équipe ÷ 2 ce tour.', visuel: 'buff', effet: { type: 'rempart', priorite: true } },
  // ARCANISTE
  etincelle: { nom: 'Étincelle', classe: 'ARCANISTE', niveau: 1, pm: 2, cible: 'ennemi', description: 'Feu (puissance 10).', effet: { type: 'sort', puissance: 10, element: 'feu' } },
  givre: { nom: 'Givre', classe: 'ARCANISTE', niveau: 4, pm: 3, cible: 'ennemi', description: 'Glace (puissance 14).', effet: { type: 'sort', puissance: 14, element: 'glace' } },
  foudre: { nom: 'Foudre', classe: 'ARCANISTE', niveau: 8, pm: 5, cible: 'ennemi', description: 'Foudre (puissance 24).', effet: { type: 'sort', puissance: 24, element: 'foudre' } },
  nova: { nom: 'Nova', classe: 'ARCANISTE', niveau: 13, pm: 8, cible: 'ennemis', description: 'Feu sur tous les ennemis (puissance 20).', effet: { type: 'sort', puissance: 20, element: 'feu' } },
  sommeil: { nom: 'Sommeil', classe: 'ARCANISTE', niveau: 18, pm: 4, cible: 'ennemi', description: 'Endort un ennemi (pas les boss).', visuel: 'sommeil', effet: { type: 'etat', etat: 'sommeil', chance: .7 } },
  tempete: { nom: 'Tempête', classe: 'ARCANISTE', niveau: 24, pm: 12, cible: 'ennemis', description: 'Foudre sur tous les ennemis (puissance 34).', effet: { type: 'sort', puissance: 34, element: 'foudre' } },
  // RODEUR
  vol: { nom: 'Vol', classe: 'RODEUR', niveau: 1, pm: 0, cible: 'ennemi', description: 'Prend un objet à un ennemi.', anim: 'attaque', visuel: 'coup', effet: { type: 'vol', chance: .5 } },
  coup_bas: { nom: 'Coup bas', classe: 'RODEUR', niveau: 4, pm: 3, cible: 'ennemi', description: 'Coup critique assuré, qui ignore la Défense.', effet: { type: 'arme', critique: true } },
  poison: { nom: 'Poison', classe: 'RODEUR', niveau: 8, pm: 3, cible: 'ennemi', description: 'Une attaque qui empoisonne souvent.', visuel: 'poison', effet: { type: 'arme', poison: .7 } },
  esquive: { nom: 'Esquive', classe: 'RODEUR', niveau: 13, pm: 2, cible: 'soi', description: 'Évite le prochain coup.', visuel: 'buff', effet: { type: 'esquive', priorite: true } },
  double_lame: { nom: 'Double lame', classe: 'RODEUR', niveau: 18, pm: 5, cible: 'ennemi', description: 'Deux attaques.', effet: { type: 'arme', coups: 2 } },
  ombre: { nom: 'Ombre', classe: 'RODEUR', niveau: 24, pm: 6, cible: 'soi', description: 'Vitesse × 2 pendant 3 tours.', visuel: 'buff', effet: { type: 'buff', stat: 'vit', mult: 2, tours: 3, texte: 'se fond dans l\'ombre : sa Vitesse double !' } },
  // CLERC
  soin: { nom: 'Soin', classe: 'CLERC', niveau: 1, pm: 3, cible: 'allie', description: 'Soigne un allié (puissance 10).', effet: { type: 'soin', puissance: 10 } },
  lumiere: { nom: 'Lumière', classe: 'CLERC', niveau: 4, pm: 3, cible: 'ennemi', description: 'Lumière (puissance 12), terrible contre la brume.', effet: { type: 'sort', puissance: 12, element: 'lumiere' } },
  benediction: { nom: 'Bénédiction', classe: 'CLERC', niveau: 8, pm: 4, cible: 'allie', description: 'Défense + 25 % pendant 3 tours.', visuel: 'buff', effet: { type: 'buff', stat: 'def', mult: 1.25, tours: 3, texte: 'est béni : sa Défense monte !' } },
  releve: { nom: 'Relève', classe: 'CLERC', niveau: 10, pm: 10, cible: 'allie_ko', description: 'Relève un allié à terre avec la moitié de ses PV.', visuel: 'soin', effet: { type: 'releve', part: .5 } },
  purification: { nom: 'Purification', classe: 'CLERC', niveau: 13, pm: 3, cible: 'allie', description: 'Guérit poison, sommeil et silence.', visuel: 'soin', effet: { type: 'purification' } },
  soin_groupe: { nom: 'Soin de groupe', classe: 'CLERC', niveau: 18, pm: 8, cible: 'allies', description: 'Soigne toute l\'équipe (puissance 12).', effet: { type: 'soin', puissance: 12 } },
  aube: { nom: 'Aube', classe: 'CLERC', niveau: 24, pm: 12, cible: 'ennemis', description: 'Lumière sur tous les ennemis (puissance 26).', effet: { type: 'sort', puissance: 26, element: 'lumiere' } }
};

/* Monstres. elements : faible (1,5) ou résistant (0,5) ; les créatures de brume sont toutes faibles à la lumière.
   actions : ce que fait le monstre (poids = fréquence) ; prepare : un grand coup annoncé un tour à l'avance.
   groupes : les rencontres possibles quand on le touche sur la carte ; niveau : à 6 niveaux de plus, il fuit l'équipe. */
LANTERNE.monstres = {
  feu_follet: { nom: 'Feu follet', tuile: 'feu_follet', taille: .85, niveau: 1, pv: 19, pm: 6, for: 7, def: 3, mag: 4, vit: 7, xp: 8, ecus: 3,
    elements: { lumiere: 1.5, glace: 1.5, feu: .5 }, butin: [{ objet: 'fiole', chance: .1 }], vol: 'fiole',
    actions: [{ type: 'attaque', poids: 3 }, { type: 'sort', nom: 'Flammèche', puissance: 4, element: 'feu', pm: 2, poids: 2 }],
    groupes: [['feu_follet'], ['feu_follet'], ['feu_follet', 'feu_follet']],
    bestiaire: 'Une petite flamme qui erre dans la brume. On dirait qu\'elle cherche son chemin.' },
  corbeau: { nom: 'Corbeau de brume', tuile: 'corbeau', taille: .9, niveau: 1, pv: 19, for: 9, def: 2, vit: 11, xp: 8, ecus: 2,
    elements: { lumiere: 1.5, foudre: 1.5 }, butin: [{ objet: 'herbe', chance: .15 }], vol: 'herbe', effetAttaque: 'morsure',
    actions: [{ type: 'attaque', poids: 1 }], groupes: [['corbeau'], ['corbeau', 'corbeau'], ['corbeau', 'feu_follet']],
    bestiaire: 'Ses plumes s\'effilochent en fumée quand il vole.' },
  crapaud: { nom: 'Crapaud-cloche', tuile: 'crapaud', taille: .9, niveau: 2, pv: 28, for: 10, def: 6, vit: 3, xp: 12, ecus: 5,
    elements: { lumiere: 1.5, glace: 1.5 }, butin: [{ objet: 'antidote', chance: .25 }], vol: 'antidote',
    actions: [{ type: 'attaque', poids: 3 }, { type: 'etat', nom: 'Gong du gosier', etat: 'sommeil', chance: .35, zone: true, poids: 1 }],
    groupes: [['crapaud'], ['crapaud', 'feu_follet']],
    bestiaire: 'Il coasse un son de cloche si grave qu\'il endort les voyageurs.' },
  gelee: { nom: 'Gelée de cire', tuile: 'gelee', taille: .9, niveau: 3, pv: 32, for: 10, def: 11, mag: 2, vit: 2, xp: 14, ecus: 6,
    elements: { lumiere: 1.5, feu: 1.5, glace: .5 }, butin: [{ objet: 'meche', chance: .2 }], vol: 'meche',
    actions: [{ type: 'attaque', poids: 1 }], groupes: [['gelee'], ['gelee', 'gelee']],
    bestiaire: 'De la cire de lanterne qui a pris vie. Elle sent le lys, comme les tombes.' },
  loup: { nom: 'Loup gris', tuile: 'loup', taille: 1, niveau: 3, pv: 34, for: 13, def: 5, vit: 9, xp: 15, ecus: 4,
    elements: { lumiere: 1.5, feu: 1.5 }, butin: [{ objet: 'herbe', chance: .2 }], vol: 'herbe',
    actions: [{ type: 'attaque', poids: 1 }], groupes: [['loup'], ['loup', 'loup']],
    bestiaire: 'Il hurle à la brume comme d\'autres hurlent à la lune.' },
  // la Crypte des racines
  ronce: { nom: 'Ronce-griffe', tuile: 'ronce', taille: 1, niveau: 4, pv: 64, for: 17, def: 9, mag: 4, vit: 6, xp: 18, ecus: 7,
    elements: { lumiere: 1.5, feu: 1.5, glace: .5 }, butin: [{ objet: 'antidote', chance: .3 }], vol: 'antidote',
    actions: [{ type: 'attaque', poids: 3 }, { type: 'etat', nom: 'Épines', etat: 'poison', chance: .5, poids: 1 }],
    groupes: [['ronce'], ['ronce', 'gelee']],
    bestiaire: 'Une racine qui a appris à marcher. Elle cherche quelque chose sous la terre.' },
  rose_epine: { nom: 'Rose d\'épines', tuile: 'rose_epine', taille: 1, niveau: 5, pv: 32, pm: 12, for: 11, def: 6, mag: 11, vit: 7, xp: 20, ecus: 9,
    elements: { lumiere: 1.5, feu: 1.5 }, butin: [{ objet: 'fiole', chance: .3 }], vol: 'fiole',
    actions: [{ type: 'attaque', poids: 2 }, { type: 'sort', nom: 'Pluie d\'épines', puissance: 7, zone: true, pm: 3, visuel: 'poison', poids: 2 }],
    groupes: [['rose_epine'], ['rose_epine', 'ronce']],
    bestiaire: 'Elle fleurit sur les tombes oubliées. Son parfum endort les souvenirs.' },
  // premier boss : le Gardien de la Crypte des racines
  roi_aulnes: { nom: 'Roi des aulnes', tuile: 'roi_aulnes', taille: 1.7, boss: true, pv: 300, pm: 30, for: 19, def: 12, mag: 13, vit: 8, xp: 220, ecus: 120,
    elements: { lumiere: 1.5, feu: 1.5, glace: .5 }, butin: [{ objet: 'plume', chance: 1 }],
    actions: [{ type: 'attaque', poids: 4 },
      { type: 'sort', nom: 'Souffle des racines', puissance: 10, element: 'glace', zone: true, pm: 4, visuel: 'poison', poids: 2 },
      { type: 'charge', nom: 'Étreinte des racines', mult: 1.6, zone: true, prepare: 'Le Roi des aulnes plonge ses racines dans le sol…', poids: 1 }],
    // rythme fixe à apprendre : deux coups, le Souffle, puis il plonge ses racines (un tour) et l'Étreinte au tour suivant
    cycle: [0, 0, 1, 2],
    bestiaire: '« Encore… tu nous enfermes encore. »' }
};

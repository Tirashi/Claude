/* La Dernière Lanterne — données de base : classes, héros, statistiques, objets, monstres,
   départ de la partie, légende des cartes et style du dessin (cahier des charges : specs/rpg.md). */
window.LANTERNE = window.LANTERNE || {};

LANTERNE.classes = {
  LAME: { nom: 'Lame', phrase: 'Frappe fort et protège l\'équipe.',
    depart: { pv: 30, pm: 4, for: 9, def: 8, mag: 2, vit: 5 }, gain: { pv: 6, pm: 1, for: 2, def: 2, mag: .5, vit: 1 } },
  ARCANISTE: { nom: 'Arcaniste', phrase: 'Brûle, gèle, foudroie.',
    depart: { pv: 18, pm: 12, for: 3, def: 4, mag: 9, vit: 6 }, gain: { pv: 3, pm: 3, for: .5, def: 1, mag: 2.5, vit: 1 } },
  RODEUR: { nom: 'Rôdeur', phrase: 'Frappe en premier, frappe juste.',
    depart: { pv: 22, pm: 6, for: 7, def: 5, mag: 3, vit: 9 }, gain: { pv: 4, pm: 1.5, for: 1.5, def: 1, mag: .5, vit: 2 } },
  CLERC: { nom: 'Clerc', phrase: 'Soigne et chasse la brume.',
    depart: { pv: 24, pm: 10, for: 5, def: 6, mag: 7, vit: 4 }, gain: { pv: 5, pm: 2.5, for: 1, def: 1.5, mag: 2, vit: .5 } }
};

// nomJoueur : ce héros porte le nom choisi par le joueur
LANTERNE.heros = {
  heros: { nom: 'Le héros', classe: 'LAME', perso: 'heros', nomJoueur: true },
  eloi: { nom: 'Eloi', classe: 'CLERC', perso: 'eloi' },
  verene: { nom: 'Vérène', classe: 'ARCANISTE', perso: 'verene' },
  maud: { nom: 'Maud', classe: 'RODEUR', perso: 'maud' }
};

// qui parle dans les dialogues : nom affiché et personnage du portrait
LANTERNE.persos = {
  heros: { nom: '', perso: 'heros' }, eloi: { nom: 'Eloi', perso: 'eloi' }, verene: { nom: 'Vérène', perso: 'verene' }, maud: { nom: 'Maud', perso: 'maud' },
  ysolde: { nom: 'Mère Ysolde', perso: 'ysolde' }, isee: { nom: 'Isée', perso: 'isee' }, vaast: { nom: 'Prieur Vaast', perso: 'vaast' },
  gaspard: { nom: 'Gaspard', perso: 'gaspard' }, forgeron: { nom: 'Bertin le forgeron', perso: 'forgeron' }, aubergiste: { nom: 'Margot', perso: 'aubergiste' },
  enfant: { nom: 'Petit Lou', perso: 'enfant' }, ancien: { nom: 'Le vieux Aimé', perso: 'ancien' }, paysanne: { nom: 'Jeanne', perso: 'paysanne' },
  pecheur: { nom: 'Fulbert', perso: 'pecheur' }, moine: { nom: 'Un moine', perso: 'vaast' },
  nuage: { nom: 'Nuage', perso: 'nuage' }, garcon_vert: { nom: 'Le garçon en vert', perso: 'garcon_vert' }
};

LANTERNE.statistiques = [
  { cle: 'pv', nom: 'PV', aide: 'Points de vie : à 0, on tombe.' },
  { cle: 'pm', nom: 'PM', aide: 'Points de magie : paient les sorts et les talents.' },
  { cle: 'for', nom: 'FOR', aide: 'Force : augmente les dégâts des attaques à l\'arme.' },
  { cle: 'def', nom: 'DEF', aide: 'Défense : réduit les dégâts des attaques à l\'arme reçues.' },
  { cle: 'mag', nom: 'MAG', aide: 'Magie : augmente la puissance des sorts et des soins.' },
  { cle: 'vit', nom: 'VIT', aide: 'Vitesse : qui joue en premier, fuir, esquiver.' }
];

LANTERNE.objets = {
  herbe: { nom: 'Herbe', description: 'Une herbe amère qui rend des PV.' },
  fiole: { nom: 'Fiole bleue', description: 'Rend des PM.' },
  meche: { nom: 'Mèche', description: 'Ranime une lanterne de sauvegarde éteinte.' }
};

LANTERNE.monstres = {
  feu_follet: { nom: 'Feu follet', tuile: 'feu_follet', taille: .85 },
  corbeau: { nom: 'Corbeau de brume', tuile: 'corbeau', taille: .9 },
  crapaud: { nom: 'Crapaud-cloche', tuile: 'crapaud', taille: .9 },
  gelee: { nom: 'Gelée de cire', tuile: 'gelee', taille: .9 }
};

LANTERNE.depart = { carte: 'maison_ysolde', x: 2, y: 4, dir: 'bas', equipe: ['heros'], niveau: 1, ecus: 0, chapitre: 'Prologue' };

// la quête en cours, en une phrase (menu, onglet Journal)
LANTERNE.journal = e =>
  !e.drapeaux.mission ? 'Parler à Mère Ysolde.'
  : !e.drapeaux.porte_abbaye ? 'Aller à l\'abbaye de Saint-Cendre, au nord de Clairfond, par la route de la forêt.'
  : 'Les portes de l\'abbaye sont devant toi. La suite de l\'histoire arrive bientôt.';

/* Légende commune des cartes : une lettre par case.
   sol : dessin du sol ; decor : ce qui se dresse dessus ; bloque : on ne peut pas y marcher. */
LANTERNE.legende = {
  '.': { sol: 'herbe' }, ',': { sol: 'herbe_sombre' }, ':': { sol: 'chemin' }, '=': { sol: 'paves' },
  '~': { sol: 'eau', bloque: true },
  'T': { sol: 'herbe', decor: 'arbre', bloque: true }, 'Y': { sol: 'herbe_sombre', decor: 'sapin', bloque: true },
  'b': { sol: 'herbe', decor: 'buisson', bloque: true }, 'f': { sol: 'herbe', decor: 'massif' },
  'x': { sol: 'herbe', decor: 'barriere', bloque: true }, 'X': { sol: 'chemin', decor: 'barriere', bloque: true },
  'S': { sol: 'paves', decor: 'statue', bloque: true }, 'F': { sol: 'herbe', decor: 'fontaine', bloque: true },
  'o': { sol: 'herbe', decor: 'tonneau', bloque: true }, 'p': { sol: 'herbe', decor: 'pot', bloque: true },
  'M': { sol: 'herbe_sombre', decor: 'mur_abbaye', bloque: true },
  // intérieurs
  '_': { sol: 'parquet' }, '%': { sol: 'calcaire' }, ' ': { sol: 'vide', bloque: true },
  'W': { sol: 'vide', decor: 'mur_haut', bloque: true }, 'w': { sol: 'vide', decor: 'mur_cote', bloque: true }, 'v': { sol: 'vide', decor: 'mur_bas', bloque: true },
  'L': { sol: 'parquet', decor: 'lit', bloque: true }, 'K': { sol: 'parquet', decor: 'table', bloque: true },
  'B': { sol: 'parquet', decor: 'livres', bloque: true }, 'P': { sol: 'parquet', decor: 'pupitre', bloque: true },
  'O': { sol: 'parquet', decor: 'tonneau', bloque: true }, 'q': { sol: 'parquet', decor: 'pot', bloque: true }
};

LANTERNE.style = {
  sols: {
    herbe: { tuiles: ['herbe0', 'herbe1', 'herbe2', 'herbe3', 'herbe4', 'herbe5'], semis: { tuiles: ['fleur0', 'fleur1', 'fleur2'], sur: 7 } },
    herbe_sombre: { tuiles: ['herbe_sombre0', 'herbe_sombre1', 'herbe_sombre2'] },
    chemin: { dessous: 'herbe', bordure: { centre: 'terre', n: 'b_n', s: 'b_s', e: 'b_e', w: 'b_w', ne: 'b_ne', nw: 'b_nw', se: 'b_se', sw: 'b_sw' }, avec: ['paves'] },
    paves: { tuiles: ['calcaire0', 'calcaire1', 'calcaire2'] },
    eau: { tuiles: ['eau'], eau: true },
    parquet: { tuiles: ['parquet'] }, calcaire: { tuiles: ['calcaire0', 'calcaire1', 'calcaire2'] },
    vide: null
  },
  decors: {
    arbre: { type: 'panneau', tuiles: ['arbre1', 'arbre2', 'arbre3', 'sapin'], taille: 1.8 },
    sapin: { type: 'panneau', tuiles: ['sapin', 'sapin2', 'sapin', 'sapin2', 'arbre1', 'arbre_mort'], taille: 1.9 },
    buisson: { type: 'panneau', tuiles: ['buisson', 'buisson2'], taille: 1 },
    massif: { type: 'plat', tuiles: ['massif0', 'massif1', 'massif2'] },
    barriere: { type: 'panneau', tuiles: ['barriere'], taille: 1 },
    statue: { type: 'panneau', tuiles: ['statue_aubrin'], taille: 1.6 },
    fontaine: { type: 'panneau', tuiles: ['fontaine'], taille: 1.15, alterne: ['fontaine', 'fontaine2'] },
    tonneau: { type: 'panneau', tuiles: ['tonneau'], taille: .9 },
    pot: { type: 'panneau', tuiles: ['pot_fleurs', 'pot_fleurs2'], taille: .8 },
    lit: { type: 'panneau', tuiles: ['lit'], taille: 1 },
    table: { type: 'panneau', tuiles: ['table'], taille: 1 },
    livres: { type: 'panneau', tuiles: ['livres'], taille: .9 },
    pupitre: { type: 'panneau', tuiles: ['pupitre'], taille: .9 },
    mur_haut: { type: 'bloc', tuile: 'mur_brique', hauteur: 1.8 },
    mur_cote: { type: 'bloc', tuile: 'mur_brique', hauteur: .9 },
    mur_bas: { type: 'bloc', tuile: 'mur_brique', hauteur: .35 },
    mur_abbaye: { type: 'bloc', tuile: 'mur_eglise', hauteur: 2.4 }
  },
  objets: {
    coffre: { tuile: 'coffre', tuileOuverte: 'coffre_ouvert', taille: .9 },
    panneau: { tuile: 'panneau', taille: .9 },
    lanterne: { tuile: 'lanterne_pierre', taille: 1.1, lumiere: { couleur: 0xffa040, intensite: 1.4, portee: 4, hauteur: .9 } },
    lanterne_oubliee: { tuile: 'lanterne_pierre', taille: 1.1, allumee: { couleur: 0xffb860, intensite: 1.2, portee: 3.5, hauteur: .9 } },
    deco: { taille: 1 }
  },
  exterieur: { sol: ['herbe0', 'herbe1', 'herbe2', 'herbe3', 'herbe4', 'herbe5'], decor: 'arbre' }
};

LANTERNE.effets = {
  bip: 'sons/bip.ogg', ok: 'sons/ok.ogg', coffre: 'sons/coffre.ogg', soin: 'sons/soin.ogg',
  porte: 'sons/porte.ogg', rencontre: 'sons/rencontre.ogg', lanterne: 'sons/lanterne.ogg'
};
LANTERNE.musiques = { village: 'sons/village.ogg', foret: 'sons/foret.ogg' };

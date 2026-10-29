/* La Dernière Lanterne — données de base : classes, héros, statistiques, objets, monstres,
   départ de la partie, légende des cartes et style du dessin (cahier des charges : specs/rpg.md). */
window.LANTERNE = window.LANTERNE || {};

LANTERNE.classes = {
  LAME: { nom: 'Lame', phrase: 'Frappe fort et protège l\'équipe.',
    depart: { pv: 30, pm: 4, for: 9, def: 8, mag: 2, vit: 5 }, gain: { pv: 6, pm: 1, for: 2, def: 2, mag: .5, vit: 1 } },
  ARCANISTE: { nom: 'Arcaniste', phrase: 'Brûle, gèle, foudroie.',
    depart: { pv: 18, pm: 12, for: 3, def: 4, mag: 9, vit: 6 }, gain: { pv: 3, pm: 3, for: .5, def: 1, mag: 2.5, vit: 1 } },
  RODEUR: { nom: 'Rôdeur', phrase: 'Frappe en premier, frappe juste.', critique: 1 / 6,
    depart: { pv: 22, pm: 6, for: 7, def: 5, mag: 3, vit: 9 }, gain: { pv: 4, pm: 1.5, for: 1.5, def: 1, mag: .5, vit: 2 } },
  CLERC: { nom: 'Clerc', phrase: 'Soigne et chasse la brume.',
    depart: { pv: 24, pm: 10, for: 5, def: 6, mag: 7, vit: 4 }, gain: { pv: 5, pm: 2.5, for: 1, def: 1.5, mag: 2, vit: .5 } }
};

// nomJoueur : ce héros porte le nom choisi par le joueur
LANTERNE.heros = {
  heros: { nom: 'Le héros', classe: 'LAME', perso: 'heros', nomJoueur: true, equipement: { arme: 'epee_courte', armure: 'tunique' } },
  eloi: { nom: 'Eloi', classe: 'CLERC', perso: 'eloi', equipement: { arme: 'masse', armure: 'robe_novice' } },
  verene: { nom: 'Vérène', classe: 'ARCANISTE', perso: 'verene', equipement: { arme: 'baton', armure: 'robe_savante' } },
  maud: { nom: 'Maud', classe: 'RODEUR', perso: 'maud', effetAttaque: 'fleche', equipement: { arme: 'arc_court', armure: 'cuir' } }
};

// qui parle dans les dialogues : nom affiché et personnage du portrait
LANTERNE.persos = {
  heros: { nom: '', perso: 'heros' }, eloi: { nom: 'Eloi', perso: 'eloi' }, verene: { nom: 'Vérène', perso: 'verene' }, maud: { nom: 'Maud', perso: 'maud' },
  ysolde: { nom: 'Mère Ysolde', perso: 'ysolde' }, isee: { nom: 'Isée', perso: 'isee' }, vaast: { nom: 'Prieur Vaast', perso: 'vaast' },
  gaspard: { nom: 'Gaspard', perso: 'gaspard' }, forgeron: { nom: 'Bertin le forgeron', perso: 'forgeron' }, aubergiste: { nom: 'Margot', perso: 'aubergiste' },
  enfant: { nom: 'Petit Lou', perso: 'enfant' }, ancien: { nom: 'Le vieux Aimé', perso: 'ancien' }, paysanne: { nom: 'Jeanne', perso: 'paysanne' },
  pecheur: { nom: 'Fulbert', perso: 'pecheur' }, moine: { nom: 'Un moine', perso: 'vaast' },
  nuage: { nom: 'Nuage', perso: 'nuage' }, roi: { nom: 'Roi des aulnes', perso: 'roi_aulnes' }, garde: { nom: 'Le garde', perso: 'garde' }, garcon_vert: { nom: 'Le garçon en vert', perso: 'garcon_vert' },
  // acte 2 : Port-Gris et le Marais des cloches
  maitre_port: { nom: 'Maître Odon', perso: 'maitre_port' }, pecheuse: { nom: 'Annick', perso: 'pecheuse' }, dresseur: { nom: 'Petit Théo', perso: 'dresseur' },
  aubergiste_port: { nom: 'Paulin', perso: 'aubergiste_port' }, marchand: { nom: 'Le marchand', perso: 'marchand' }, conteuse: { nom: 'Mamie Rose', perso: 'conteuse' },
  crapaud_roi: { nom: 'Un crapaud couronné', perso: 'crapaud_roi' }, dame: { nom: 'La Dame du moulin', perso: 'dame_moulin' }
};

LANTERNE.statistiques = [
  { cle: 'pv', nom: 'PV', aide: 'Points de vie : à 0, on tombe.' },
  { cle: 'pm', nom: 'PM', aide: 'Points de magie : paient les sorts et les talents.' },
  { cle: 'for', nom: 'FOR', aide: 'Force : augmente les dégâts des attaques à l\'arme.' },
  { cle: 'def', nom: 'DEF', aide: 'Défense : réduit les dégâts des attaques à l\'arme reçues.' },
  { cle: 'mag', nom: 'MAG', aide: 'Magie : augmente la puissance des sorts et des soins.' },
  { cle: 'vit', nom: 'VIT', aide: 'Vitesse : qui joue en premier, fuir, esquiver.' }
];

// objets, équipement, talents et monstres : donnees/combat.js

// outils (B, devant soi) : drapeau « outil:<id> » quand on l'a
LANTERNE.outils = {
  lanterne: { nom: 'Lanterne du veilleur', aide: 'Appuie sur B pour la dissiper avec la lanterne.', texte: 'La flamme de la lanterne dissipe la brume !', son: 'lanterne' },
  // le grappin ne s'utilise pas sur un objet : face à l'eau, B le lance vers le pieu d'en face (moteur-rpg/partie.js)
  grappin: { nom: 'Grappin', son: 'fleche' }
};

// drapeaux à atteindre pour finir cette version (vérifié par outils/lanterne-tests.js)
// l'onglet AIDE du menu : les règles du combat expliquées au joueur
LANTERNE.aide = [
  { titre: 'Chacun son tour', texte: 'En haut de l\'écran, la frise montre qui va agir, dans l\'ordre (le plus rapide d\'abord), puis le tour suivant en plus pâle. Quand vient le tour d\'un héros, tu choisis son action et elle se joue aussitôt.' },
  { titre: 'Défense', texte: 'Un héros en Défense reçoit deux fois moins de dégâts, jusqu\'à son prochain tour. Quand un monstre « prépare » un grand coup (point rouge sur la frise, alerte rouge), c\'est le moment de se défendre.' },
  { titre: 'Les dégâts', texte: 'Un coup fait la Force de l\'attaquant moins la moitié de la Défense de la cible, un peu plus ou un peu moins au hasard. Un sort fait sa puissance plus la moitié de la Magie, sans compter la Défense.' },
  { titre: 'Coups critiques', texte: 'Un coup sur seize environ est un COUP CRITIQUE : il fait une fois et demie les dégâts d\'un coup normal (un sur six pour Maud, la rôdeuse). Les grands coups préparés et les attaques sur toute l\'équipe ne sont jamais critiques. Le talent Coup bas, lui, ignore aussi la Défense.' },
  { titre: 'Fuir', texte: 'Fuite tente d\'échapper au combat : une chance sur deux, plus 5 % par point de Vitesse d\'avance de ton héros le plus rapide sur le monstre le plus rapide (le menu affiche la chance). Si un monstre a 5 points de Vitesse de plus que tous tes héros, impossible de le semer. On ne fuit jamais un boss ni un combat où quelqu\'un a besoin d\'aide.' },
  { titre: 'Faiblesses', texte: 'Certains monstres craignent le feu, la glace, la foudre ou la lumière (× 1,5), d\'autres y résistent (× 0,5). Ce que tu découvres s\'inscrit dans l\'onglet Monstres.' },
  { titre: 'Les PV des monstres', texte: 'Une barre sous chaque monstre montre ce qui lui reste de PV. Les chiffres exacts s\'affichent quand tu l\'as déjà vaincu une fois. Le boss a sa grande barre en haut de l\'écran.' },
  { titre: 'Le grappin', texte: 'Face à l\'eau, appuie sur B : le grappin file tout droit jusqu\'au pieu planté sur l\'autre rive et y tire toute l\'équipe. Pas de pieu en face, pas de traversée.' },
  { titre: 'Sauvegardes', texte: 'La partie se sauvegarde toute seule aux moments importants, et à la main aux lanternes. Si l\'équipe tombe, on reprend à la dernière sauvegarde ; contre un boss, on peut aussi réessayer le combat.' }
];

LANTERNE.fin = ['vaast_vu', 'verene_rejoint', 'outil:lanterne', 'roi_vaincu', 'acte1_fini', 'mission_marais', 'maud_rejoint', 'outil:grappin', 'dame_vaincue', 'acte2_fini'];

LANTERNE.depart = { carte: 'maison_ysolde', x: 2, y: 4, dir: 'bas', equipe: ['heros'], niveau: 1, ecus: 0, chapitre: 'Prologue' };

// la quête en cours, en une phrase (menu, onglet Journal)
LANTERNE.journal = e => {
  const d = e.drapeaux;
  if (!d.mission) return 'Parler à Mère Ysolde.';
  if (!d.vaast_vu) return 'Aller à l\'abbaye de Saint-Cendre, au nord de Clairfond, par la route de la forêt.';
  if (!d.verene_rejoint) return 'Trouver la Crypte des racines, au cœur du Bois Murmurant, à l\'est de Clairfond.';
  if (!d['outil:lanterne']) return 'Explorer la Crypte des racines, dans le Bois Murmurant. Une grille, une porte fermée… et de la brume.';
  if (!d.roi_vaincu) return 'La lanterne brille : dissiper la brume au fond de la crypte et trouver la Flamme rouge.';
  if (!d.mission_marais) return 'La Flamme rouge est dans la lanterne. Retourner à l\'abbaye de Saint-Cendre, au nord de Clairfond, pour prévenir le Prieur.';
  if (!d.maud_rejoint) return 'Prendre la route des marais, au sud de Clairfond, et trouver un guide à Port-Gris.';
  if (!d.moulin_vu) return 'Traverser le Marais des cloches, à l\'est de Port-Gris, avec Maud, jusqu\'au Moulin noyé.';
  if (!d['outil:grappin']) return 'Explorer le Moulin noyé. De la brume barre une porte : la lanterne saura quoi faire.';
  if (!d.dame_vaincue) return 'Le grappin franchit l\'eau jusqu\'aux pieux. Trouver la clé du moulin et la Flamme bleue.';
  if (!d.acte2_fini) return 'La Flamme bleue brille. Lire la fresque du moulin avec Vérène.';
  return 'Deux flammes dans la lanterne. La suite (le Hameau caché et les Hautes-Roches) arrive bientôt.';
};

/* Légende commune des cartes : une lettre par case.
   sol : dessin du sol ; decor : ce qui se dresse dessus ; bloque : on ne peut pas y marcher. */
LANTERNE.legende = {
  '.': { sol: 'herbe' }, ',': { sol: 'herbe_sombre' }, ':': { sol: 'chemin' }, '=': { sol: 'paves' },
  '~': { sol: 'eau', bloque: true, franchissable: true },
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
  'H': { sol: 'parquet', decor: 'cheminee', bloque: true }, 'O': { sol: 'parquet', decor: 'tonneau', bloque: true }, 'q': { sol: 'parquet', decor: 'pot', bloque: true },
  // l'abbaye de Saint-Cendre
  'a': { sol: 'marbre' }, 'A': { sol: 'vide', decor: 'mur_blanc_haut', bloque: true }, 'j': { sol: 'vide', decor: 'mur_blanc_cote', bloque: true },
  'k': { sol: 'vide', decor: 'mur_blanc_bas', bloque: true }, 'l': { sol: 'marbre', decor: 'colonne', bloque: true },
  // la Crypte des racines
  'm': { sol: 'mousse' }, 'n': { sol: 'crypte' }, 'C': { sol: 'vide', decor: 'mur_crypte_haut', bloque: true }, 'Z': { sol: 'vide', decor: 'mur_crypte_cote', bloque: true },
  'z': { sol: 'vide', decor: 'mur_crypte_bas', bloque: true }, 'Q': { sol: 'crypte', decor: 'colonne_sombre', bloque: true }, 'R': { sol: 'crypte', decor: 'sarcophage', bloque: true },
  'g': { sol: 'mousse', decor: 'toile' }, 'E': { sol: 'crypte', decor: 'escalier_bas' }, 'G': { sol: 'crypte', decor: 'escalier_haut' }, 'r': { sol: 'mousse', decor: 'racines', bloque: true },
  // acte 2 : le marais (franchissable : le grappin passe au-dessus)
  'h': { sol: 'herbe_marais' }, 'u': { sol: 'vase' }, 'd': { sol: 'ponton' },
  'e': { sol: 'eau_trouble', bloque: true, franchissable: true }, 'y': { sol: 'eau_trouble', decor: 'lotus', bloque: true, franchissable: true },
  's': { sol: 'herbe_marais', decor: 'saule', bloque: true }, 'i': { sol: 'herbe_marais', decor: 'roseaux', bloque: true },
  'c': { sol: 'eau_trouble', decor: 'cloche', bloque: true }, '1': { sol: 'ponton', decor: 'tonneau', bloque: true },
  // le Moulin noyé
  'N': { sol: 'ponton' }, 'D': { sol: 'vide', decor: 'mur_moulin_haut', bloque: true }, 'I': { sol: 'vide', decor: 'mur_moulin_cote', bloque: true },
  'J': { sol: 'vide', decor: 'mur_moulin_bas', bloque: true }, 'V': { sol: 'ponton', decor: 'meule', bloque: true }, 'U': { sol: 'eau_trouble', decor: 'roue', bloque: true },
  '2': { sol: 'ponton', decor: 'sacs', bloque: true }, '3': { sol: 'ponton', decor: 'statue_ondine', bloque: true }
};

LANTERNE.style = {
  sols: {
    herbe: { tuiles: ['herbe0', 'herbe1', 'herbe2', 'herbe3', 'herbe4', 'herbe5'], semis: { tuiles: ['fleur0', 'fleur1', 'fleur2'], sur: 7 } },
    herbe_sombre: { tuiles: ['herbe_sombre0', 'herbe_sombre1', 'herbe_sombre2'] },
    chemin: { dessous: 'herbe', bordure: { centre: 'terre', n: 'b_n', s: 'b_s', e: 'b_e', w: 'b_w', ne: 'b_ne', nw: 'b_nw', se: 'b_se', sw: 'b_sw' }, avec: ['paves'] },
    paves: { tuiles: ['calcaire0', 'calcaire1', 'calcaire2'] },
    eau: { tuiles: ['eau'], eau: true },
    parquet: { tuiles: ['parquet'] }, calcaire: { tuiles: ['calcaire0', 'calcaire1', 'calcaire2'] },
    marbre: { tuiles: ['marbre0', 'marbre1'] }, mousse: { tuiles: ['mousse0', 'mousse1', 'mousse2'] }, crypte: { tuiles: ['sol_crypte0', 'sol_crypte1'] },
    herbe_marais: { tuiles: ['herbe_marais0', 'herbe_marais1', 'herbe_marais2'] }, vase: { tuiles: ['vase0', 'vase1'] },
    eau_trouble: { tuiles: ['eau_trouble', 'eau_trouble2'], eau: true }, ponton: { tuiles: ['ponton'] },
    vide: null
  },
  decors: {
    arbre: { type: 'panneau', tuiles: ['arbre1', 'arbre2', 'arbre3', 'sapin'], taille: 1.8 },
    sapin: { type: 'panneau', tuiles: ['sapin', 'sapin2', 'sapin', 'sapin2', 'arbre1', 'arbre_mort'], taille: 1.9 },
    buisson: { type: 'panneau', tuiles: ['buisson', 'buisson2'], taille: 1 },
    massif: { type: 'plat', tuiles: ['massif0', 'massif1', 'massif2'] },
    barriere: { type: 'meuble', pieces: [{ boite: [.1, .62, .1], pos: [-.42, 0, 0], face: 'bois_sombre' }, { boite: [.1, .62, .1], pos: [.42, 0, 0], face: 'bois_sombre' },
      { boite: [1, .08, .06], pos: [0, .24, 0], face: 'bois' }, { boite: [1, .08, .06], pos: [0, .48, 0], face: 'bois' }] },
    statue: { type: 'panneau', tuiles: ['statue_aubrin'], taille: 1.6 },
    fontaine: { type: 'panneau', tuiles: ['fontaine'], taille: 1.15, alterne: ['fontaine', 'fontaine2'] },
    tonneau: { type: 'meuble', pieces: [{ cylindre: [.28, .62], face: 'tonneau_cote', dessus: 'tonneau_dessus' }] },
    pot: { type: 'panneau', tuiles: ['pot_fleurs', 'pot_fleurs2'], taille: .8 },
    lit: { type: 'meuble', pieces: [{ boite: [.8, .36, .9], pos: [0, 0, .05], dessus: 'lit_dessus', face: 'lit_pied', cote: 'lit_cote' },
      { boite: [.88, .7, .08], pos: [0, 0, -.43], face: 'lit_tete', cote: 'bois', dessus: 'bois' }] },
    table: { type: 'meuble', pieces: [{ boite: [.9, .07, .68], pos: [0, .46, 0], dessus: 'table_dessus', face: 'bois' },
      { boite: [.07, .46, .07], pos: [-.38, 0, -.27], face: 'bois_sombre' }, { boite: [.07, .46, .07], pos: [-.38, 0, .27], face: 'bois_sombre' }, { boite: [.07, .46, .07], pos: [.38, 0, -.27], face: 'bois_sombre' }, { boite: [.07, .46, .07], pos: [.38, 0, .27], face: 'bois_sombre' }] },
    livres: { type: 'meuble', pieces: [{ boite: [.9, 1.4, .34], pos: [0, 0, -.3], face: 'etagere_face', cote: 'bois', dessus: 'bois' }] },
    pupitre: { type: 'meuble', pieces: [{ boite: [.3, .05, .3], face: 'bois_sombre' }, { boite: [.1, .62, .1], face: 'bois_sombre' },
      { boite: [.5, .06, .38], pos: [0, .6, 0], rot: [.35, 0, 0], dessus: 'livre_ouvert', face: 'bois' }] },
    cheminee: { type: 'meuble', pieces: [{ boite: [1.1, 1.3, .42], pos: [0, 0, -.29], face: 'cheminee_face', cote: 'calcaire0', dessus: 'calcaire0' }],
      lumiere: { couleur: 0xff8030, intensite: 1.3, portee: 4.5, hauteur: .5 } },
    mur_haut: { type: 'bloc', tuile: 'mur_brique', hauteur: 1.8 },
    mur_cote: { type: 'bloc', tuile: 'mur_brique', hauteur: .9 },
    mur_bas: { type: 'bloc', tuile: 'mur_brique', hauteur: .35 },
    mur_abbaye: { type: 'bloc', tuile: 'mur_eglise', hauteur: 2.4 },
    mur_blanc_haut: { type: 'bloc', tuile: 'mur_blanc', hauteur: 2.2 }, mur_blanc_cote: { type: 'bloc', tuile: 'mur_blanc', hauteur: .9 }, mur_blanc_bas: { type: 'bloc', tuile: 'mur_blanc', hauteur: .35 },
    colonne: { type: 'meuble', pieces: [{ boite: [.56, .16, .56], face: 'marbre0' }, { cylindre: [.2, 1.45], pos: [0, .16, 0], face: 'colonne_fut', dessus: 'marbre0' },
      { boite: [.56, .16, .56], pos: [0, 1.61, 0], face: 'marbre0' }] },
    mur_crypte_haut: { type: 'bloc', tuile: 'mur_crypte', hauteur: 1.8 }, mur_crypte_cote: { type: 'bloc', tuile: 'mur_crypte', hauteur: .9 }, mur_crypte_bas: { type: 'bloc', tuile: 'mur_crypte', hauteur: .35 },
    colonne_sombre: { type: 'meuble', pieces: [{ boite: [.52, .14, .52], face: 'sol_crypte0' }, { cylindre: [.19, 1.2], pos: [0, .14, 0], face: 'colonne_fut_sombre', dessus: 'sol_crypte0' },
      { boite: [.52, .14, .52], pos: [0, 1.34, 0], face: 'sol_crypte0' }] },
    sarcophage: { type: 'meuble', pieces: [{ boite: [.72, .42, .96], face: 'pierre_sculptee', cote: 'pierre_sculptee', dessus: 'sarco_dessus' }] },
    toile: { type: 'plat', tuiles: ['toile'] }, escalier_bas: { type: 'plat', tuiles: ['escalier_bas'] }, escalier_haut: { type: 'plat', tuiles: ['escalier_haut'] },
    racines: { type: 'panneau', tuiles: ['buisson2', 'arbre_mort'], taille: 1.3 },
    // acte 2
    saule: { type: 'panneau', tuiles: ['saule1', 'saule2', 'saule3', 'saule1', 'arbre_mort2'], taille: 1.9 },
    roseaux: { type: 'panneau', tuiles: ['roseau1', 'roseau2', 'roseau3'], taille: 1 },
    lotus: { type: 'plat', tuiles: ['lotus'] },
    cloche: { type: 'meuble', pieces: [{ cylindre: [.3, .34], face: 'bronze', dessus: 'bronze' }, { cone: [.33, .36], pos: [0, .34, 0], face: 'bronze' },
      { cylindre: [.06, .12], pos: [0, .68, 0], face: 'bronze', dessus: 'bronze' }] },
    mur_moulin_haut: { type: 'bloc', tuile: 'mur_moulin', hauteur: 1.8 }, mur_moulin_cote: { type: 'bloc', tuile: 'mur_moulin', hauteur: .9 }, mur_moulin_bas: { type: 'bloc', tuile: 'mur_moulin', hauteur: .35 },
    meule: { type: 'meuble', pieces: [{ cylindre: [.44, .2], face: 'calcaire1', dessus: 'calcaire0' }, { cylindre: [.38, .18], pos: [0, .2, 0], face: 'calcaire2', dessus: 'calcaire1' },
      { cylindre: [.06, .5], pos: [0, .38, 0], face: 'bois_sombre', dessus: 'bois' }] },
    roue: { type: 'meuble', pieces: [{ cylindre: [.9, .2], pos: [0, .9, 0], rot: [Math.PI / 2, 0, 0], face: 'bois_sombre', dessus: 'roue_face' }] },
    sacs: { type: 'meuble', pieces: [{ boite: [.42, .4, .36], pos: [-.18, 0, 0], face: 'bois', dessus: 'bois' }, { boite: [.38, .34, .34], pos: [.22, 0, .08], face: 'tonneau_dessus', dessus: 'tonneau_dessus' }] },
    statue_ondine: { type: 'panneau', tuiles: ['statue_ondine'], taille: 1.4 }
  },
  objets: {
    coffre: { tuile: 'coffre', pieces: [
      { boite: [.74, .36, .52], face: 'coffre_face', cote: 'coffre_cote', dessus: 'coffre_or' },
      { boite: [.78, .14, .56], pos: [0, .36, 0], face: 'coffre_cote', cote: 'coffre_cote', dessus: 'coffre_couvercle', si: 'ferme' },
      { boite: [.78, .52, .08], pos: [0, .36, -.3], rot: [-.3, 0, 0], face: 'bois', cote: 'coffre_cote', dessus: 'bois', si: 'ouvert' }] },
    panneau: { tuile: 'panneau', pieces: [{ boite: [.09, .8, .09], face: 'bois_sombre' }, { boite: [.72, .38, .07], pos: [0, .42, .05], face: 'panneau_face', cote: 'bois', dessus: 'bois' }] },
    lanterne: { tuile: 'lanterne_pierre', pieces: [{ boite: [.52, .1, .52], face: 'calcaire0' }, { cylindre: [.09, .52], pos: [0, .1, 0], face: 'colonne_fut', dessus: 'calcaire0' },
      { boite: [.42, .06, .42], pos: [0, .62, 0], face: 'calcaire0' }, { boite: [.3, .28, .3], pos: [0, .68, 0], face: 'lanterne_face', dessus: 'calcaire0', brille: true },
      { cone: [.34, .26], pos: [0, .96, 0], face: 'calcaire0' }, { cylindre: [.035, .1], pos: [0, 1.22, 0], face: 'calcaire0' }], lumiere: { couleur: 0xffa040, intensite: 1.4, portee: 4, hauteur: .85 } },
    lanterne_oubliee: { tuile: 'lanterne_pierre', pieces: [{ boite: [.52, .1, .52], face: 'sol_crypte0' }, { cylindre: [.09, .52], pos: [0, .1, 0], face: 'colonne_fut_sombre', dessus: 'sol_crypte0' },
      { boite: [.42, .06, .42], pos: [0, .62, 0], face: 'sol_crypte0' }, { boite: [.3, .28, .3], pos: [0, .68, 0], face: 'lanterne_face_eteinte', dessus: 'sol_crypte0', si: 'eteinte' },
      { boite: [.3, .28, .3], pos: [0, .68, 0], face: 'lanterne_face', dessus: 'sol_crypte0', brille: true, si: 'allumee' },
      { cone: [.34, .26], pos: [0, .96, 0], face: 'sol_crypte0' }, { cylindre: [.035, .1], pos: [0, 1.22, 0], face: 'sol_crypte0' }], allumee: { couleur: 0xffb860, intensite: 1.2, portee: 3.5, hauteur: .9 } },
    deco: { taille: 1 },
    grille: { tuile: 'grille', taille: 1, cacheOuvert: true }, porte_cle: { tuile: 'porte_cloutee', taille: 1, cacheOuvert: true },
    nappe: { tuile: 'nappe', taille: 1.25, cacheOuvert: true }, levier: { tuile: 'levier', tuileOuverte: 'levier_baisse', taille: .8 },
    fresque: { tuile: 'fresque', taille: 1.3 },
    pieu: { tuile: 'panneau', pieces: [{ cylindre: [.1, .95], face: 'bois_sombre', dessus: 'bois' }, { cylindre: [.12, .07], pos: [0, .72, 0], face: 'colonne_fut_sombre', dessus: 'colonne_fut_sombre' },
      { cylindre: [.12, .07], pos: [0, .2, 0], face: 'colonne_fut_sombre', dessus: 'colonne_fut_sombre' }] },
    grande_lanterne: { tuile: 'lanterne_pierre', pieces: [
      { cylindre: [.82, .12], face: 'calcaire0' }, { cylindre: [.7, .3], pos: [0, .12, 0], face: 'pierre_sculptee', dessus: 'eau' },
      { cylindre: [.13, 1.05], pos: [0, .42, 0], face: 'colonne_fut', dessus: 'calcaire0' }, { boite: [.62, .08, .62], pos: [0, 1.47, 0], face: 'calcaire0' },
      { boite: [.46, .44, .46], pos: [0, 1.55, 0], face: 'lanterne_face', dessus: 'calcaire0', brille: true },
      { cone: [.5, .42], pos: [0, 1.99, 0], face: 'calcaire0' }, { cylindre: [.05, .14], pos: [0, 2.41, 0], face: 'calcaire0' }], lumiere: { couleur: 0xffe0a0, intensite: 1.1, portee: 7, hauteur: 1.8 } }
  },
  // tapis et décorations murales (carte.ornements)
  ornements: {
    tapis: { tuile: 'tapis', l: 3, h: 2, sol: true }, tapis_bleu: { tuile: 'tapis_bleu', l: 2, h: 2, sol: true },
    tapis_long: { tuile: 'tapis_long', l: 1, h: 6, sol: true },
    fenetre: { tuile: 'fenetre', l: .62, h: .74, haut: .55, brille: true }, vitrail: { tuile: 'vitrail', l: .8, h: 1.38, haut: .55, brille: true },
    tapisserie: { tuile: 'tapisserie', l: .5, h: 1, haut: .45 }, tableau: { tuile: 'tableau', l: .56, h: .4, haut: .8 },
    bouclier: { tuile: 'bouclier_mur', l: .5, h: .5, haut: .75 }, etagere: { tuile: 'etagere_murale', l: .8, h: .46, haut: .7 },
    torche: { tuile: 'torche', l: .3, h: .68, haut: .65, brille: true, lumiere: { couleur: 0xff9a40, intensite: .9, portee: 3.5, hauteur: 1.1 } }
  },
  exterieur: { sol: ['herbe0', 'herbe1', 'herbe2', 'herbe3', 'herbe4', 'herbe5'], decor: 'arbre' }
};

LANTERNE.effets = {
  bip: 'sons/bip.ogg', ok: 'sons/ok.ogg', coffre: 'sons/coffre.ogg', soin: 'sons/soin.ogg',
  porte: 'sons/porte.ogg', rencontre: 'sons/rencontre.ogg', lanterne: 'sons/lanterne.ogg',
  // combat (sons choisis par l'utilisateur sur le banc des sons, 22/10)
  coup: 'sons/coup.ogg', touche: 'sons/touche.ogg', givre: 'sons/givre.ogg', feu: 'sons/feu.ogg', fleche: 'sons/fleche.ogg',
  morsure: 'sons/morsure.ogg', victoire: 'sons/victoire.ogg', foudre: 'sons/foudre.ogg', fuite: 'sons/fuite.ogg', vaincu: 'sons/vaincu.ogg', niveau: 'sons/niveau.ogg'
};
LANTERNE.musiques = { village: 'sons/village.ogg', foret: 'sons/foret.ogg', combat: 'sons/combat.ogg' };

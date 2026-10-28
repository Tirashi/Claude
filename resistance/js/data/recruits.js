// Recrutement en début de run : la graine propose des candidats, le joueur en choisit `slots`.
// Chaque candidat a un nom, une classe de base et parfois un trait.
(() => {
  'use strict';
  const RECRUITMENT = {
    slots: 3,           // soldats emmenés (la forteresse pourra l'augmenter)
    candidates: 6,      // candidats proposés à chaque run
    traitChance: 0.35,  // chance qu'un candidat ait un trait (la forteresse pourra l'augmenter)
    maxArmy: 6,         // soldats vivants au plus (recrues des événements comprises) : cases de départ
    // Classes de base disponibles dès le départ ; les autres se débloqueront à la forteresse.
    classes: ['swordfighter', 'axefighter', 'spearfighter', 'archer'],
  };

  const NAMES = [
    'Aldric', 'Brunhild', 'Elya', 'Cassian', 'Mérin', 'Garance', 'Tobias', 'Isaure',
    'Roland', 'Maëlle', 'Bastien', 'Ysolde', 'Gauvain', 'Solène', 'Hugues', 'Aveline',
    'Thibaut', 'Ondine', 'Corentin', 'Lise', 'Arnaud', 'Mahaut', 'Évrard', 'Bérénice',
    'Florian', 'Sibylle', 'Gaspard', 'Néva', 'Odilon', 'Rosalie',
  ];

  // Traits : petits bonus qui donnent du caractère à un soldat.
  //  stats    : ajouté aux statistiques au recrutement
  //  growths  : ajouté à toutes les croissances (%)
  //  mov      : déplacement
  //  hit / crit / avo : précision, critique, esquive en combat
  const TRAITS = {
    chanceux:      { name: 'Chanceux',      desc: '+15 critique',     crit: 15 },
    oeilDeLynx:    { name: 'Œil de lynx',   desc: '+15 précision',    hit: 15 },
    insaisissable: { name: 'Insaisissable', desc: '+15 esquive',      avo: 15 },
    robuste:       { name: 'Robuste',       desc: '+4 PV max',        stats: { hp: 4 } },
    costaud:       { name: 'Costaud',       desc: '+2 force',         stats: { str: 2 } },
    eclaireur:     { name: 'Éclaireur',     desc: '+1 déplacement',   mov: 1 },
    prodige:       { name: 'Prodige',       desc: '+10 % de croissance', growths: 10 },
  };

  // Capitaine : vétéran rappelé au Mémorial de la forteresse. Chaque rappel lui donne un grade
  // (chevron au-dessus de la tête en combat) et un trait de plus, jusqu'à `maxGrade`.
  // aura : bonus pour les alliés adjacents (précision, esquive), comme les soutiens de Fire Emblem.
  const CAPTAIN = { maxGrade: 3, aura: { hit: 10, avo: 10 } };

  // Traits d'un soldat : le sien, plus ceux gagnés comme Capitaine
  const traitsOf = (rec) => [rec.trait, ...(rec.captainTraits ?? [])].filter((t) => TRAITS[t]);

  // Bonus cumulés de plusieurs traits (les bonus de stats sont appliqués au recrutement)
  function traitBonus(ids) {
    const total = { growths: 0, mov: 0, hit: 0, crit: 0, avo: 0 };
    for (const id of ids) for (const k of Object.keys(total)) total[k] += TRAITS[id][k] ?? 0;
    return total;
  }

  // « Capitaine (grade 2) · Chanceux · Robuste », ou null sans trait ni grade
  function traitLabel(rec) {
    const parts = traitsOf(rec).map((t) => TRAITS[t].name);
    if (rec.grade) parts.unshift(`Capitaine (grade ${rec.grade})`);
    return parts.length ? parts.join(' · ') : null;
  }

  Object.assign(Resistance, { RECRUITMENT, NAMES, TRAITS, CAPTAIN, traitsOf, traitBonus, traitLabel });
})();

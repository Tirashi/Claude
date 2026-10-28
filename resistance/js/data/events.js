// Événements de la carte de run (nœuds « ? ») : une petite scène et des choix.
// Chaque choix a une issue (`outcome`), appliquée par Run.applyOutcome :
//  text         : récit affiché après le choix
//  gold, supplies : or et ravitaillement gagnés (négatif : perdus)
//  items        : { id d'objet: quantité } ajoutés au sac
//  heal, damage : part des PV max rendue / retirée à toute l'armée (jamais en dessous de 1 PV)
//  levelUp      : nombre de montées de niveau pour une unité tirée au hasard
//  recruit      : une nouvelle recrue (tirée par la graine) rejoint l'armée
//  upgradeWeapon: le joueur choisit une unité dont l'arme de fer devient une arme d'acier
//  battle       : rencontre (encounters.js) à combattre ; `loot` remplace le butin habituel
//  chance       : probabilité de `success`, sinon `failure` (deux issues complètes)
// Un choix peut avoir un coût (`cost: { gold }`) et une condition (`requires`) :
//  room : l'armée a de la place (RECRUITMENT.maxArmy) ; upgradable : une arme de fer à reforger.
(() => {
  'use strict';
  const EVENTS = {
    village: {
      title: 'Village en détresse',
      text: 'Des soldats du tyran pillent un hameau. Les villageois implorent votre aide.',
      choices: [
        {
          label: 'Défendre le village', desc: 'Combat · butin : or et ravitaillement',
          outcome: { battle: 'raid', loot: { gold: 45, supplies: 1 }, text: "L'armée charge les pillards ! Les villageois promettent de partager leurs réserves." },
        },
        { label: 'Passer son chemin', outcome: { text: "L'armée s'éloigne. Derrière elle, la fumée monte du hameau." } },
      ],
    },
    deserter: {
      title: 'Un déserteur',
      text: "Un soldat du tyran a jeté ses couleurs. Il demande à rejoindre la rébellion.",
      choices: [
        {
          label: "L'enrôler", desc: 'Un soldat de plus dans l\'armée', requires: { room: true },
          outcome: { recruit: 1, text: 'Il prête serment à la rébellion.' },
        },
        { label: 'Lui prendre sa bourse', desc: '+25 or', outcome: { gold: 25, text: "Il s'enfuit, les poches vides." } },
        { label: 'Le laisser partir', outcome: { text: 'Il disparaît dans les collines.' } },
      ],
    },
    chest: {
      title: 'Un coffre abandonné',
      text: "Au bord du chemin, un coffre cerclé de fer. Trop facile ?",
      choices: [
        {
          label: "L'ouvrir", desc: 'De l\'or… ou un piège',
          outcome: {
            chance: 0.6,
            success: { gold: 60, text: 'Il est rempli de pièces du tyran !' },
            failure: { damage: 0.25, text: 'Un piège ! Une volée de fléchettes blesse toute l\'armée.' },
          },
        },
        { label: 'Ne pas y toucher', outcome: { text: "Mieux vaut ne pas tenter le sort." } },
      ],
    },
    shrine: {
      title: 'Un sanctuaire oublié',
      text: 'Une chapelle en ruine, où brûle encore une flamme. Les anciens disaient qu\'elle exauce les braves.',
      choices: [
        {
          label: 'Prier', desc: 'Une chance de bénédiction',
          outcome: {
            chance: 0.5,
            success: { levelUp: 1, text: 'La flamme s\'élève : un soldat se sent plus fort.' },
            failure: { text: 'La flamme vacille et se tait.' },
          },
        },
        {
          label: 'Faire une offrande', desc: "Soigne toute l'armée", cost: { gold: 30 },
          outcome: { heal: 1, text: "Une douce chaleur referme les blessures de l'armée." },
        },
        { label: 'Repartir', outcome: { text: "L'armée reprend la route." } },
      ],
    },
    forge: {
      title: 'Une forge abandonnée',
      text: 'Le feu couve encore sous les cendres, et l\'enclume est intacte.',
      choices: [
        {
          label: 'Reforger une arme', desc: "Une arme de fer devient d'acier", cost: { gold: 30 },
          requires: { upgradable: true }, outcome: { upgradeWeapon: true, text: "L'acier chante sous le marteau." },
        },
        { label: 'Récupérer la ferraille', desc: '+15 or', outcome: { gold: 15, text: 'Quelques pièces de métal à revendre.' } },
        { label: 'Repartir', outcome: { text: "L'armée reprend la route." } },
      ],
    },
  };

  // Armes de fer qu'une forge peut changer en arme d'acier
  const WEAPON_UPGRADES = {
    ironSword: 'steelSword', ironLance: 'steelLance', ironAxe: 'steelAxe', ironBow: 'steelBow',
  };

  Object.assign(Resistance, { EVENTS, WEAPON_UPGRADES });
})();

/* Pokédex : ce qui ne change pas (types, table des dégâts, icônes, régions, conditions d'évolution).
   Les Pokémon eux-mêmes (noms, types, descriptions, évolutions, images) sont lus sur les dépôts de PokéAPI
   (raw.githubusercontent.com/PokeAPI/…) : rien de Nintendo n'est dans le dépôt de la Ludothèque. */
(function () {
"use strict";

// les 18 types, dans l'ordre des identifiants de PokéAPI (1 = normal … 18 = fairy)
const TYPES = ["Normal", "Combat", "Vol", "Poison", "Sol", "Roche", "Insecte", "Spectre", "Acier", "Feu", "Eau", "Plante", "Électrik", "Psy", "Glace", "Dragon", "Ténèbres", "Fée"];
const ANGLAIS = ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel", "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark", "fairy"];
const COULEURS = { Normal: "#9b9a7c", Feu: "#f0782e", Eau: "#4d8bf0", Plante: "#4fb04a", "Électrik": "#efb914", Glace: "#4cc3c8", Combat: "#d1402f", Poison: "#a54bc0", Sol: "#d59a3e", Vol: "#8d7cf0", Psy: "#f1578a", Insecte: "#93b01c", Roche: "#b09a4a", Spectre: "#6f58a8", Dragon: "#5b4cf0", "Ténèbres": "#5d4a5a", Acier: "#6f93a8", "Fée": "#e57ab8" };
// ordre des filtres et des choix (celui des jeux)
const ORDRE = ["Normal", "Feu", "Eau", "Plante", "Électrik", "Glace", "Combat", "Poison", "Sol", "Vol", "Psy", "Insecte", "Roche", "Spectre", "Dragon", "Ténèbres", "Acier", "Fée"];

// table des types (règles depuis la 6e génération) : pour chaque type d'attaque, les défenseurs à ×2, ×½ et ×0
const TABLE = {
  Normal: [[], ["Roche", "Acier"], ["Spectre"]],
  Feu: [["Plante", "Glace", "Insecte", "Acier"], ["Feu", "Eau", "Roche", "Dragon"], []],
  Eau: [["Feu", "Sol", "Roche"], ["Eau", "Plante", "Dragon"], []],
  Plante: [["Eau", "Sol", "Roche"], ["Feu", "Plante", "Poison", "Vol", "Insecte", "Dragon", "Acier"], []],
  "Électrik": [["Eau", "Vol"], ["Électrik", "Plante", "Dragon"], ["Sol"]],
  Glace: [["Plante", "Sol", "Vol", "Dragon"], ["Feu", "Eau", "Glace", "Acier"], []],
  Combat: [["Normal", "Glace", "Roche", "Ténèbres", "Acier"], ["Poison", "Vol", "Psy", "Insecte", "Fée"], ["Spectre"]],
  Poison: [["Plante", "Fée"], ["Poison", "Sol", "Roche", "Spectre"], ["Acier"]],
  Sol: [["Feu", "Électrik", "Poison", "Roche", "Acier"], ["Plante", "Insecte"], ["Vol"]],
  Vol: [["Plante", "Combat", "Insecte"], ["Électrik", "Roche", "Acier"], []],
  Psy: [["Combat", "Poison"], ["Psy", "Acier"], ["Ténèbres"]],
  Insecte: [["Plante", "Psy", "Ténèbres"], ["Feu", "Combat", "Poison", "Vol", "Spectre", "Acier", "Fée"], []],
  Roche: [["Feu", "Glace", "Vol", "Insecte"], ["Combat", "Sol", "Acier"], []],
  Spectre: [["Psy", "Spectre"], ["Ténèbres"], ["Normal"]],
  Dragon: [["Dragon"], ["Acier"], ["Fée"]],
  "Ténèbres": [["Psy", "Spectre"], ["Combat", "Ténèbres", "Fée"], []],
  Acier: [["Glace", "Roche", "Fée"], ["Feu", "Eau", "Électrik", "Acier"], []],
  "Fée": [["Combat", "Dragon", "Ténèbres"], ["Feu", "Poison", "Acier"], []]
};
const mult1 = (a, d) => TABLE[a][0].includes(d) ? 2 : TABLE[a][1].includes(d) ? .5 : TABLE[a][2].includes(d) ? 0 : 1;
const mult = (a, defs) => defs.reduce((m, d) => m * mult1(a, d), 1);

// icônes des types (24 × 24, dessinées pour la Ludothèque, simples pour les enfants)
const P = 'fill="currentColor"', T = 'fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"';
const ICONES = {
  Normal: `<circle cx="12" cy="12" r="7" ${T}/><circle cx="12" cy="12" r="2.5" ${P}/>`,
  Feu: `<path ${P} d="M12 2c.8 3.6 6 6 6 12a6 6 0 0 1-12 0c0-2.8 1.6-4.8 3-6 .2 1.9 1 3 2.2 3.3C11 8 10.6 5 12 2z"/>`,
  Eau: `<path ${P} d="M12 2.5C9.2 7 5.5 10.8 5.5 15a6.5 6.5 0 0 0 13 0c0-4.2-3.7-8-6.5-12.5z"/>`,
  Plante: `<path ${P} d="M5 19C4.5 10 10 4.5 20 4c-.3 9.5-5.5 15.2-15 15z"/><path fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.8" stroke-linecap="round" d="M6 18l8-8"/>`,
  "Électrik": `<path ${P} d="M13.5 2L4.5 13.5h6L9.5 22l9-11.5h-6z"/>`,
  Glace: `<path ${T} d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4.5L12 7l2.5-2.5M9.5 19.5L12 17l2.5 2.5"/>`,
  Combat: `<path ${P} d="M6 9.5a2 2 0 0 1 4-.3V8a2 2 0 0 1 4 0 2 2 0 0 1 4 .5V15a6 6 0 0 1-6 6h-1.5A4.5 4.5 0 0 1 6 16.5z"/><path fill="none" stroke="rgba(0,0,0,.25)" stroke-width="1.5" d="M10 9v3M14 8.5v3.5M6.2 13h6"/>`,
  Poison: `<circle cx="9.5" cy="14.5" r="5" ${P}/><circle cx="16.5" cy="8" r="3.2" ${P}/><circle cx="17.5" cy="16.5" r="2" ${P}/><circle cx="8" cy="5.5" r="1.6" ${P}/>`,
  Sol: `<path ${P} d="M2 19l6.5-10 4 5.5 3-4L22 19z"/>`,
  Vol: `<path ${P} d="M21 4c-6 0-11 3-13.5 8.5L4 20l2 .5 2.6-4.3C10 17 12 17.5 14 17c-1-.3-2-.9-2.6-1.6 2.2.1 4.2-.4 5.8-1.6-1.2-.1-2.4-.5-3.3-1.1 2.6-.6 4.6-2.2 5.6-4.4-1 .1-2 0-2.9-.3C18.8 7 20.3 5.7 21 4z"/>`,
  Psy: `<path ${T} d="M12.5 12.5a1.2 1.2 0 0 1 0-1.8 2.4 2.4 0 0 1 3.2 3 4 4 0 0 1-6.6 1.4 5.6 5.6 0 0 1 1.6-8 7.2 7.2 0 0 1 9.3 4"/>`,
  Insecte: `<circle cx="12" cy="14" r="7" ${P}/><circle cx="12" cy="5.5" r="3" ${P}/><path stroke="rgba(0,0,0,.28)" stroke-width="1.6" d="M12 8v13"/><circle cx="9" cy="12.5" r="1.4" fill="rgba(0,0,0,.28)"/><circle cx="15" cy="12.5" r="1.4" fill="rgba(0,0,0,.28)"/><circle cx="9.5" cy="17" r="1.2" fill="rgba(0,0,0,.28)"/><circle cx="14.5" cy="17" r="1.2" fill="rgba(0,0,0,.28)"/>`,
  Roche: `<path ${P} d="M4 18.5l1.6-7.5L11 5.5l6.5 3.2L20.5 18.5z"/><path fill="rgba(0,0,0,.2)" d="M11 5.5l6.5 3.2 3 9.8-6-6z"/>`,
  Spectre: `<path ${P} d="M5 21V11a7 7 0 0 1 14 0v10l-2.3-1.8-2.3 1.8-2.4-1.8-2.4 1.8-2.3-1.8z"/><circle cx="9.5" cy="11" r="1.6" fill="rgba(0,0,0,.35)"/><circle cx="14.5" cy="11" r="1.6" fill="rgba(0,0,0,.35)"/>`,
  Dragon: `<path ${P} d="M4 20c1-6 4-9 8-10l-2-6 4 3.5L16 3l.5 5.5C20 10 21 13 20 16l-3-1.5-1 3.5-3-2-2.5 3.5-1.5-3z"/><circle cx="15.5" cy="11" r="1.2" fill="rgba(0,0,0,.35)"/>`,
  "Ténèbres": `<path ${P} d="M15 3a9 9 0 1 0 6.2 13.4A7.5 7.5 0 0 1 15 3z"/>`,
  Acier: `<path ${P} fill-rule="evenodd" d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 1 0 0-6.8z"/>`,
  "Fée": `<path ${P} d="M11 3c.9 4.6 2.6 6.4 7 7.3-4.4.9-6.1 2.7-7 7.3-.9-4.6-2.6-6.4-7-7.3 4.4-.9 6.1-2.7 7-7.3z"/><path ${P} d="M18.5 14.5c.4 2 1.1 2.7 3 3.1-1.9.4-2.6 1.1-3 3.1-.4-2-1.1-2.7-3-3.1 1.9-.4 2.6-1.1 3-3.1z"/>`
};

// les régions, par numéro du Pokédex national
const REGIONS = [[151, "Kanto", 1], [251, "Johto", 2], [386, "Hoenn", 3], [493, "Sinnoh", 4], [649, "Unys", 5], [721, "Kalos", 6], [809, "Alola", 7], [905, "Galar", 8], [1025, "Paldea", 9]];
const region = n => REGIONS.find(r => n <= r[0]) || REGIONS[REGIONS.length - 1];

// objets d'évolution les plus courants (les autres : « Objet spécial »)
const OBJETS = { "fire-stone": "Pierre Feu", "water-stone": "Pierre Eau", "thunder-stone": "Pierre Foudre", "leaf-stone": "Pierre Plante", "moon-stone": "Pierre Lune", "sun-stone": "Pierre Soleil", "shiny-stone": "Pierre Éclat", "dusk-stone": "Pierre Nuit", "dawn-stone": "Pierre Aube", "ice-stone": "Pierre Glace" };

// la condition d'une évolution, en mots simples, d'après evolution_details de PokéAPI
function condition(liste) {
  if (!liste || !liste.length) return "";
  const d = liste.find(x => x.item) || liste[liste.length - 1];
  const declencheur = d.trigger && d.trigger.name;
  const moment = d.time_of_day === "day" ? ", de jour" : d.time_of_day === "night" ? ", de nuit" : "";
  if (declencheur === "use-item") return (d.item && OBJETS[d.item.name]) || "Objet spécial";
  if (declencheur === "trade") return d.held_item ? "Échange + objet" : "Échange";
  if (declencheur === "level-up") {
    if (d.min_level) return "Niv. " + d.min_level + moment;
    const type = d.known_move_type ? TYPES[ANGLAIS.indexOf(d.known_move_type.name)] : null;
    if ((d.min_happiness || d.min_affection) && type) return "Amitié + attaque " + type;
    if (d.min_happiness || d.min_affection) return "Amitié" + moment;
    if (type) return "Attaque " + type;
    if (d.known_move) return "Attaque spéciale";
    if (d.location) return "Lieu spécial";
    if (d.held_item) return "Objet tenu" + moment;
    return "Niveau suivant" + moment;
  }
  return "Spécial";
}

window.PokedexDonnees = { TYPES, ANGLAIS, COULEURS, ORDRE, TABLE, mult1, mult, ICONES, REGIONS, region, OBJETS, condition };
})();

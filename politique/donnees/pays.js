/* Politique : pays de départ (décisions de l'utilisateur du 14/11). Le joueur choisit son pays à la création de la partie
   (Etat.creerEtat(scenario, graine, pays)). Même carte pour tous ; la spécialité du pays change la puissance des factions,
   les bâtiments de départ, les lois déjà en vigueur et l'armée. Colère de départ inchangée (personne n'est en crise).
   factions : puissance de départ (total 140 comme le pays équilibré) ; batiments : { region: { id: +n / −n } } ;
   emplacements : { region: +n } ;
   lois : en vigueur depuis longtemps (effets à terme complets, effets de durée finis, pas de choc à l'adoption).
   ASSUMPTION (pays, 14/11) : toutes les valeurs, à vérifier par simulation. Le pays militaire est remplacé par le pays minier
   (décision du 14/11 : la guerre n'est la spécialité de personne). */
(function(racine){
"use strict";
const PAYS = {
  equilibre: { nom: "Pays équilibré", texte: "Aucune faction ne domine : toutes les voies sont ouvertes.",
    factions: {}, batiments: {}, lois: [] },
  agricole: { nom: "Pays agricole", texte: "Les paysans pèsent lourd ; la plaine nourrit le pays. Les écoles sont tenues par l'Église.",
    factions: { paysans: 60, ouvriers: 20, artisans: 25, patrons: 35 }, batiments: { plaine: { farm: 1 } }, lois: ["ecoles_religieuses"] },
  industriel: { nom: "Pays industriel", texte: "Ouvriers et patrons se font face ; les mines tournent. Les syndicats sont interdits.",
    factions: { paysans: 25, ouvriers: 45, artisans: 20, patrons: 50 }, batiments: { collines: { mine: 1 }, vallee: { farm: -1 } }, lois: ["syndicats_interdits"] },
  marchand: { nom: "Pays marchand", texte: "Artisans et patrons tiennent le bourg et le commerce : le bourg a un emplacement de plus. Le libre-échange est la règle.",
    factions: { paysans: 30, ouvriers: 20, artisans: 45, patrons: 45 }, batiments: {}, emplacements: { bourg: 1 }, lois: ["libre_echange"] },
  minier: { nom: "Pays minier", texte: "Les mines des collines font vivre le pays : une mine de plus. Les ouvriers pèsent lourd ; la police garde les puits.",
    factions: { paysans: 35, ouvriers: 40, artisans: 20, patrons: 45 }, batiments: { collines: { mine: 1 } }, lois: ["police_etat"] }
};
if (typeof module !== "undefined" && module.exports) module.exports = PAYS; else (racine.Politique = racine.Politique || {}).PAYS = PAYS;
})(typeof window !== "undefined" ? window : globalThis);

/* Politique : pays de départ (décisions de l'utilisateur du 14/11). Le joueur choisit son pays à la création de la partie
   (Etat.creerEtat(scenario, graine, pays)). Même carte pour tous ; la spécialité du pays change la puissance des factions,
   les bâtiments de départ, les lois déjà en vigueur et l'armée. Colère de départ inchangée (personne n'est en crise).
   factions : puissance de départ (total 160 comme le pays équilibré, cinq factions le 16/11) ; batiments : { region: { id: +n / −n } } ;
   emplacements : { region: +n } ;
   lois : en vigueur depuis longtemps (effets à terme complets, effets de durée finis, pas de choc à l'adoption).
   ASSUMPTION (pays, 14/11) : toutes les valeurs, à vérifier par simulation. Le pays militaire est remplacé par le pays minier
   (décision du 14/11 : la guerre n'est la spécialité de personne). */
(function(racine){
"use strict";
// camp : le côté que l'Autorité favorise dans ce pays (mesures du 16/11, specs/politique.md § 34), affiché au choix du pays
const PAYS = {
  equilibre: { nom: "Pays équilibré", camp: "la droite", texte: "Aucune faction ne domine : toutes les voies sont ouvertes.",
    factions: {}, batiments: {}, lois: [] },
  agricole: { nom: "Pays agricole", camp: "l'extrême droite et l'extrême gauche", texte: "Les paysans et les conservateurs pèsent lourd ; la plaine nourrit le pays. Les écoles sont tenues par l'Église.",
    factions: { ouvriers: 20, paysans: 55, artisans: 25, patrons: 20, conservateurs: 40 }, batiments: { plaine: { farm: 1 } }, lois: ["ecoles_religieuses"] },
  industriel: { nom: "Pays industriel", camp: "la gauche", texte: "Ouvriers et patrons se font face ; les mines tournent. Les syndicats sont interdits.",
    factions: { ouvriers: 45, paysans: 25, artisans: 20, patrons: 50, conservateurs: 20 }, batiments: { collines: { mine: 1 }, vallee: { farm: -1 } }, lois: ["syndicats_interdits"] },
  marchand: { nom: "Pays marchand", camp: "la droite", texte: "La classe moyenne et les patrons tiennent le bourg et le commerce : le bourg a un emplacement de plus. Le libre-échange est la règle.",
    factions: { ouvriers: 20, paysans: 25, artisans: 45, patrons: 45, conservateurs: 25 }, batiments: {}, emplacements: { bourg: 1 }, lois: ["libre_echange"] },
  minier: { nom: "Pays minier", camp: "la gauche", texte: "Les mines des collines font vivre le pays : une mine de plus. Les ouvriers pèsent lourd ; la police garde les puits.",
    factions: { ouvriers: 40, paysans: 30, artisans: 20, patrons: 40, conservateurs: 30 }, batiments: { collines: { mine: 1 } }, lois: ["police_etat"] }
};
if (typeof module !== "undefined" && module.exports) module.exports = PAYS; else (racine.Politique = racine.Politique || {}).PAYS = PAYS;
})(typeof window !== "undefined" ? window : globalThis);

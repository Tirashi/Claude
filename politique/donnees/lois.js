/* Politique : catalogue des lois (RULES_V1 § Lois).
   eco : effets appliqués par le moteur dès M1 ; factions : effets appliqués en M2 (colère, puissance, apaisement).
   Effets économiques :
     impots      multiplicateur des impôts
     entretien   or par tour
     production  multiplicateur de toute la production
     croissance  points de croissance démographique en plus (0.005 = +0,5 %/tour), « à terme » (montée)
     artisans    bonus de rendement des bâtiments d'artisans (atelier, tissage), « à terme » (montée)
     force       multiplicateur de force militaire (utilisé en M3)
     reputation  points de réputation à l'adoption */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

// ASSUMPTION validée (À TRANCHER n° 1) : 7 catégories, pour rejouer la partie 1 telle quelle
const CATEGORIES = {
  impot: "Impôt", education: "Éducation", reglementation: "Réglementation", sante: "Santé",
  relations_sociales: "Relations sociales", libertes: "Libertés publiques", armee: "Armée"
};

const LOIS = {
  income_progressive: { nom: "Impôt progressif", categorie: "impot", cp: 30,
    eco: { impots: 1.35 },
    factions: { chocs: { patrons: { colere: 5 } } } },                         // ASSUMPTION validée : « légèrement mécontents » = +5
  income_capital: { nom: "Impôt sur le capital", categorie: "impot", cp: 50,
    eco: { impots: 1.55 },
    factions: { chocs: { patrons: { colere: 20 }, artisans: { colere: 10 } } } },
  school_public: { nom: "École publique", categorie: "education", cp: 40,
    eco: { entretien: 14, croissance: 0.005, artisans: 0.35 },                   // ASSUMPTION validée : +0,5 %
    factions: {} },
  school_free: { nom: "École gratuite et obligatoire", categorie: "education", cp: 50,
    eco: { entretien: 20, croissance: 0.01, artisans: 0.5 },                     // ASSUMPTION validée : 20 or (« ~20 »), +1 %
    factions: { chocs: { paysans: { colere: 8 } } } },
  labor_code: { nom: "Code du travail", categorie: "reglementation", cp: 30,
    eco: { production: 0.94 },
    factions: { chocs: { patrons: { colere: 10 } }, dissipation: { ouvriers: 2 } } },
  unions: { nom: "Syndicats autorisés", categorie: "relations_sociales", cp: 20,
    eco: {},
    factions: { chocs: { patrons: { colere: 15 } }, parTour: { ouvriers: { colere: -4, puissance: 3 } },
                dureeParTour: { puissance: 10 } } },                             // ASSUMPTION validée : +3 puissance pendant 10 tours seulement
  labor_medicine: { nom: "Médecine du travail", categorie: "sante", cp: 40,
    eco: { entretien: 10 },
    factions: { parTour: { paysans: { colere: -2 }, ouvriers: { colere: -2 }, artisans: { colere: -2 }, patrons: { colere: -2 } } } },
  army_professional: { nom: "Armée de métier", categorie: "armee", cp: 30,
    eco: { entretien: 12, force: 1.3 },
    factions: { chocs: { ouvriers: { colere: -5 } } } },                         // ASSUMPTION validée (« Ouvriers contents »)
  army_conscription: { nom: "Conscription", categorie: "armee", cp: 45,
    eco: { entretien: 12, force: 1.6 },                                          // ASSUMPTION validée : entretien 12
    factions: { chocs: { ouvriers: { colere: 5, puissance: 10 } } } },           // ASSUMPTION validée : puissance +10
  suffrage_universal: { nom: "Suffrage universel", categorie: "libertes", cp: 50,
    eco: { reputation: 5 },
    factions: { chocs: { patrons: { colere: 15 } }, faveur: "populaires" } },    // ASSUMPTION validée : « −15 » = +15 colère
  suffrage_census: { nom: "Suffrage censitaire", categorie: "libertes", cp: 50,
    eco: { reputation: -5 },
    factions: { chocs: { ouvriers: { colere: 10 }, paysans: { colere: 10 } }, faveur: "elites" } }
};
// ASSUMPTION validée : populaires = paysans, ouvriers ; élites = patrons, artisans
const GROUPES = { populaires: ["paysans", "ouvriers"], elites: ["patrons", "artisans"] };

const Lois = { CATEGORIES, LOIS, GROUPES };
if (NODE) module.exports = Lois; else (racine.Politique = racine.Politique || {}).LOIS = Lois;
})(typeof window !== "undefined" ? window : globalThis);

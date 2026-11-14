/* Politique : catalogue des lois (panel du 14/11, validé par l'utilisateur : de l'extrême gauche à l'extrême droite).
   Une loi en vigueur par catégorie ; sans loi, la catégorie est au centre (position de départ).
   Chaque loi : nom, categorie, bord, pour / contre (factions qui la soutiennent ou s'y opposent pendant le débat),
   texte (phrases affichées au joueur, dans le jeu et dans le mini-wiki), eco (effets sur l'État), factions (effets sur les factions).
   eco :
     impots            multiplicateur des impôts
     entretien         or par tour
     production        multiplicateur de toute la production
     croissance        points de croissance démographique en plus (0.005 = +0,5 %/tour), « à terme » (montée sur 10 tours)
     artisans          bonus de rendement des ateliers et tissages, « à terme » (montée) ; artisansImmediat : tout de suite
     force             multiplicateur de force militaire
     reputation        points du barème de réputation à l'adoption (½ point de relation avec toutes les nations)
     relations         relation avec toutes les nations à l'adoption
     entretienBatiments, ventes, construction, achat, pente, plafondRegiments : multiplicateurs (entretien des bâtiments,
                       ventes au marché, coût des bâtiments, prix d'achat, pente du marché, plafond de régiments)
     coutRegiment      prix d'un régiment ; debat : chance d'adoption en plus pour les autres lois
   factions : chocs (une fois, à l'adoption), parTour (chaque tour en vigueur), dureeParTour (jauge → nombre de tours),
     faveur (suffrage : groupe favorisé). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

// panel du 14/11 : 10 catégories
const CATEGORIES = {
  impot: "Fiscalité", economie: "Système économique", travail: "Travail", sante: "Santé et solidarité", education: "Éducation",
  relations_sociales: "Relations sociales", libertes: "Libertés publiques", ordre: "Ordre public", armee: "Armée", commerce: "Commerce"
};

const LOIS = {
  // --- Fiscalité ---
  income_capital: { nom: "Impôt sur le capital", categorie: "impot", bord: "extrême gauche", pour: ["ouvriers"], contre: ["patrons", "artisans"],
    texte: ["Les impôts rapportent 55 % de plus.", "Les patrons perdent de l'influence (−10 de puissance) et se fâchent fortement (+20 de colère à l'adoption) ; les artisans aussi (+10)."],
    eco: { impots: 1.55 }, factions: { chocs: { patrons: { colere: 20, puissance: -10 }, artisans: { colere: 10 } } } },
  income_progressive: { nom: "Impôt progressif", categorie: "impot", bord: "gauche", pour: ["ouvriers", "paysans"], contre: ["patrons"],
    texte: ["Les impôts rapportent 30 % de plus.", "Les patrons grognent (+5 de colère à l'adoption)."],
    eco: { impots: 1.3 }, factions: { chocs: { patrons: { colere: 5 } } } },
  impot_minimal: { nom: "Impôt minimal", categorie: "impot", bord: "droite", pour: ["patrons", "artisans"], contre: ["ouvriers"],
    texte: ["Les impôts rapportent 15 % de moins.", "Les patrons se calment chaque tour (−1 de colère)."],
    eco: { impots: 0.85 }, factions: { parTour: { patrons: { colere: -1 } } } },
  // --- Système économique ---
  collectivisation: { nom: "Collectivisation", categorie: "economie", bord: "extrême gauche", pour: ["ouvriers", "paysans"], contre: ["patrons", "artisans"],
    texte: ["L'État dirige les usines : tout produit 15 % de plus, mais l'entretien des bâtiments coûte deux fois plus cher.", "Les patrons perdent beaucoup d'influence (−20 de puissance) et sont furieux (+30 de colère à l'adoption).", "Les nations voisines s'inquiètent (relations −10 avec toutes)."],
    eco: { production: 1.15, entretienBatiments: 2, relations: -10 }, factions: { chocs: { patrons: { colere: 30, puissance: -20 } } } },
  interventionnisme: { nom: "Interventionnisme", categorie: "economie", bord: "centre gauche", pour: ["ouvriers"], contre: ["patrons"],
    texte: ["L'État aide les chantiers : construire coûte 20 % de moins.", "Les patrons grognent (+5 de colère à l'adoption)."],
    eco: { construction: 0.8 }, factions: { chocs: { patrons: { colere: 5 } } } },
  libre_entreprise: { nom: "Libre entreprise", categorie: "economie", bord: "droite", pour: ["patrons"], contre: ["ouvriers"],
    texte: ["Les bâtiments deviennent privés : l'État ne paie plus leur entretien, mais ne touche plus que 85 % de ce qu'ils vendent.", "Les patrons gagnent de l'influence (+3 de puissance par tour pendant 10 tours)."],
    eco: { entretienBatiments: 0, ventes: 0.85 }, factions: { parTour: { patrons: { puissance: 3 } }, dureeParTour: { puissance: 10 } } },
  laisser_faire: { nom: "Laisser-faire", categorie: "economie", bord: "extrême droite", pour: ["patrons"], contre: ["ouvriers"],
    texte: ["L'État se retire : il ne paie plus l'entretien des bâtiments, construire coûte 25 % de moins, mais il ne touche plus que 60 % des ventes.", "Les ouvriers, sans protection, se fâchent chaque tour (+2 de colère) ; les patrons se calment (−2)."],
    eco: { entretienBatiments: 0, construction: 0.75, ventes: 0.6 }, factions: { parTour: { ouvriers: { colere: 2 }, patrons: { colere: -2 } } } },
  // --- Travail ---
  journee_huit_heures: { nom: "Journée de huit heures", categorie: "travail", bord: "gauche", pour: ["ouvriers"], contre: ["patrons"],
    texte: ["La production baisse de 8 %.", "Les ouvriers se calment chaque tour (−2 de colère)."],
    eco: { production: 0.92 }, factions: { parTour: { ouvriers: { colere: -2 } } } },
  travail_enfants: { nom: "Travail des enfants", categorie: "travail", bord: "extrême droite", pour: ["patrons"], contre: ["artisans", "ouvriers"],
    texte: ["La production augmente de 10 %, mais les familles grandissent moins vite (−0,5 % par tour).", "Les artisans se fâchent chaque tour (+1 de colère).", "Les voisins désapprouvent (relations −5 avec toutes)."],
    eco: { production: 1.1, croissance: -0.005, relations: -5 }, factions: { parTour: { artisans: { colere: 1 } } } },
  // --- Santé et solidarité ---
  securite_sociale: { nom: "Sécurité sociale", categorie: "sante", bord: "gauche", pour: ["ouvriers", "paysans"], contre: ["patrons"],
    texte: ["Coûte 20 or par tour.", "Les paysans, les ouvriers et les artisans se calment chaque tour (−2 de colère).", "Les patrons grognent (+5 de colère à l'adoption)."],
    eco: { entretien: 20 }, factions: { chocs: { patrons: { colere: 5 } }, parTour: { paysans: { colere: -2 }, ouvriers: { colere: -2 }, artisans: { colere: -2 } } } },
  labor_medicine: { nom: "Médecine du travail", categorie: "sante", bord: "centre", pour: ["ouvriers", "artisans"], contre: [],
    texte: ["Coûte 10 or par tour.", "Toutes les factions se calment chaque tour (−1 de colère)."],
    eco: { entretien: 10 }, factions: { parTour: { paysans: { colere: -1 }, ouvriers: { colere: -1 }, artisans: { colere: -1 }, patrons: { colere: -1 } } } },
  charite_privee: { nom: "Charité privée", categorie: "sante", bord: "droite", pour: ["patrons"], contre: ["paysans"],
    texte: ["Ne coûte rien.", "Les patrons et les artisans se calment chaque tour (−1 de colère), mais les paysans se fâchent (+1)."],
    eco: {}, factions: { parTour: { patrons: { colere: -1 }, artisans: { colere: -1 }, paysans: { colere: 1 } } } },
  // --- Éducation ---
  school_free: { nom: "École gratuite et obligatoire", categorie: "education", bord: "gauche", pour: ["artisans", "ouvriers"], contre: ["paysans"],
    texte: ["Coûte 20 or par tour.", "Les familles grandissent plus vite (+1 % par tour).", "Ateliers et tissages produisent 50 % de plus, pleinement au bout de 10 tours.", "Les paysans perdent la main-d'œuvre de leurs enfants (+8 de colère à l'adoption)."],
    eco: { entretien: 20, croissance: 0.01, artisans: 0.5 }, factions: { chocs: { paysans: { colere: 8 } } } },
  school_public: { nom: "École publique", categorie: "education", bord: "centre", pour: ["artisans", "ouvriers"], contre: [],
    texte: ["Coûte 14 or par tour.", "Les familles grandissent plus vite (+0,5 % par tour).", "Ateliers et tissages produisent 35 % de plus, pleinement au bout de 10 tours."],
    eco: { entretien: 14, croissance: 0.005, artisans: 0.35 }, factions: {} },
  ecoles_religieuses: { nom: "Écoles religieuses", categorie: "education", bord: "droite", pour: ["paysans", "patrons"], contre: ["ouvriers"],
    texte: ["Ne coûte rien.", "Ateliers et tissages produisent 20 % de plus, pleinement au bout de 10 tours.", "Les paysans se calment chaque tour (−1 de colère)."],
    eco: { artisans: 0.2 }, factions: { parTour: { paysans: { colere: -1 } } } },
  // --- Relations sociales ---
  unions: { nom: "Syndicats autorisés", categorie: "relations_sociales", bord: "gauche", pour: ["ouvriers"], contre: ["patrons"],
    texte: ["Les ouvriers se calment chaque tour (−4 de colère) et gagnent de l'influence (+3 de puissance par tour pendant 10 tours).", "Les patrons se fâchent (+15 de colère à l'adoption)."],
    eco: {}, factions: { chocs: { patrons: { colere: 15 } }, parTour: { ouvriers: { colere: -4, puissance: 3 } }, dureeParTour: { puissance: 10 } } },
  syndicats_interdits: { nom: "Syndicats interdits", categorie: "relations_sociales", bord: "droite", pour: ["patrons"], contre: ["ouvriers"],
    texte: ["Les ouvriers se fâchent (+10 de colère à l'adoption) et perdent de l'influence (−2 de puissance par tour pendant 10 tours).", "Les patrons se calment (−10 de colère à l'adoption)."],
    eco: {}, factions: { chocs: { ouvriers: { colere: 10 }, patrons: { colere: -10 } }, parTour: { ouvriers: { puissance: -2 } }, dureeParTour: { puissance: 10 } } },
  // --- Libertés publiques ---
  suffrage_universal: { nom: "Suffrage universel", categorie: "libertes", bord: "gauche", pour: ["paysans", "ouvriers"], contre: ["patrons"],
    texte: ["Apaiser les paysans et les ouvriers coûte moitié prix, et leur colère monte moitié moins vite.", "Les voisins apprécient (+2,5 de relation avec toutes).", "Les patrons perdent du pouvoir (+15 de colère à l'adoption)."],
    eco: { reputation: 5 }, factions: { chocs: { patrons: { colere: 15 } }, faveur: "populaires" } },
  suffrage_census: { nom: "Suffrage censitaire", categorie: "libertes", bord: "droite", pour: ["patrons", "artisans"], contre: ["ouvriers", "paysans"],
    texte: ["Apaiser les patrons et les artisans coûte moitié prix, et leur colère monte moitié moins vite.", "Les voisins désapprouvent (−2,5 de relation avec toutes).", "Les ouvriers et les paysans sont exclus du vote (+10 de colère chacun à l'adoption)."],
    eco: { reputation: -5 }, factions: { chocs: { ouvriers: { colere: 10 }, paysans: { colere: 10 } }, faveur: "elites" } },
  parti_unique: { nom: "Parti unique", categorie: "libertes", bord: "extrême droite", pour: ["patrons"], contre: ["ouvriers", "paysans", "artisans"],
    texte: ["Les lois suivantes passent plus facilement (+25 % de chances à chaque tour de débat).", "Les voisins s'inquiètent (relations −10 avec toutes).", "Les ouvriers et les paysans se fâchent (+15 de colère à l'adoption).", "L'opposition est muselée : ouvriers, paysans et artisans perdent de l'influence (−3 de puissance par tour pendant 10 tours)."],
    eco: { debat: 0.25, relations: -10 }, factions: { chocs: { ouvriers: { colere: 15 }, paysans: { colere: 15 } }, parTour: { ouvriers: { puissance: -3 }, paysans: { puissance: -3 }, artisans: { puissance: -3 } }, dureeParTour: { puissance: 10 } } },
  // --- Ordre public ---
  comites_populaires: { nom: "Comités populaires", categorie: "ordre", bord: "extrême gauche", pour: ["ouvriers"], contre: ["patrons"],
    texte: ["Les ouvriers et les paysans se calment chaque tour (−1 de colère).", "Les patrons se fâchent chaque tour (+2)."],
    eco: {}, factions: { parTour: { ouvriers: { colere: -1 }, paysans: { colere: -1 }, patrons: { colere: 2 } } } },
  police_etat: { nom: "Police d'État", categorie: "ordre", bord: "droite", pour: ["patrons"], contre: ["ouvriers", "artisans"],
    texte: ["Coûte 12 or par tour.", "Toutes les factions se calment chaque tour (−1 de colère).", "Les voisins s'inquiètent (relations −5 avec toutes)."],
    eco: { entretien: 12, relations: -5 }, factions: { parTour: { paysans: { colere: -1 }, ouvriers: { colere: -1 }, artisans: { colere: -1 }, patrons: { colere: -1 } } } },
  // --- Armée ---
  milice_populaire: { nom: "Milice populaire", categorie: "armee", bord: "extrême gauche", pour: ["ouvriers"], contre: ["patrons"],
    texte: ["On peut lever 50 % de régiments en plus, et un régiment coûte 20 or au lieu de 30, mais chacun se bat 20 % moins bien."],
    eco: { plafondRegiments: 1.5, coutRegiment: 20, force: 0.8 }, factions: {} },
  army_professional: { nom: "Armée de métier", categorie: "armee", bord: "centre", pour: ["ouvriers"], contre: [],
    texte: ["Coûte 12 or par tour.", "L'armée se bat 30 % mieux.", "Les ouvriers trouvent des emplois (−5 de colère à l'adoption)."],
    eco: { entretien: 12, force: 1.3 }, factions: { chocs: { ouvriers: { colere: -5 } } } },
  army_conscription: { nom: "Conscription", categorie: "armee", bord: "droite", pour: ["patrons"], contre: ["ouvriers"],
    texte: ["Coûte 12 or par tour.", "L'armée se bat 60 % mieux.", "Les ouvriers, enrôlés de force, se fâchent (+5 de colère à l'adoption) et gagnent de l'influence (+10 de puissance)."],
    eco: { entretien: 12, force: 1.6 }, factions: { chocs: { ouvriers: { colere: 5, puissance: 10 } } } },
  // --- Commerce ---
  protectionnisme: { nom: "Protectionnisme", categorie: "commerce", bord: "gauche ou droite", pour: ["artisans"], contre: ["patrons"],
    texte: ["Nos achats à l'étranger coûtent 20 % de plus, mais ateliers et tissages produisent 15 % de plus."],
    eco: { achat: 1.2, artisansImmediat: 0.15 }, factions: {} },
  libre_echange: { nom: "Libre-échange", categorie: "commerce", bord: "droite", pour: ["patrons"], contre: ["artisans"],
    texte: ["Les prix bougent deux fois moins quand on vend ou achète beaucoup.", "Les artisans, concurrencés, se fâchent chaque tour (+1 de colère)."],
    eco: { pente: 0.5 }, factions: { parTour: { artisans: { colere: 1 } } } }
};
// ASSUMPTION validée : populaires = paysans, ouvriers ; élites = patrons, artisans
const GROUPES = { populaires: ["paysans", "ouvriers"], elites: ["patrons", "artisans"] };

// V2 étape 4 (validé le 13/11) : une loi en débat à la fois ; chaque tour de débat, ses opposants prennent +1 de colère ;
// à partir du 2e tour de débat, adoption avec une chance de 50 % + (puissance des pour − puissance des contre) / 2,
// bornée entre 10 % et 90 % (pour / contre : ASSUMPTION validée (V2 étape 4)). premierTirage : tour de débat du premier tirage (le lancement
// est le 1er) ; les tests de règles écrits avant cette étape utilisent 3 (le délai de la V1), une chance de 100 % et pas de colère.
const REGLES_LOIS = { chance: { base: 0.5, parPuissance: 0.005, min: 0.1, max: 0.9 }, colereDebat: 1, premierTirage: 2 };

const Lois = { CATEGORIES, LOIS, GROUPES, REGLES_LOIS };
if (NODE) module.exports = Lois; else (racine.Politique = racine.Politique || {}).LOIS = Lois;
})(typeof window !== "undefined" ? window : globalThis);

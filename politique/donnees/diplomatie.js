/* Politique : diplomatie et commerce (RULES_V1 § Diplomatie et commerce ; propositions de M3a validées le 13/11,
   specs/politique.md § 6). « ASSUMPTION validée (M3) » = proposée avant M3 ; « (M3a) » = détail ajouté en écrivant M3a ; tout validé le 13/11. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const DIPLOMATIE = {
  relation: { min: -100, max: 100, traite: 10, contrat: 5, donParOr: 1 / 5, embargo: -15 },   // ASSUMPTION validée (M3) ; embargo −30 → −15 le 14/11 (étape 3 : la pression économique ne doit pas mener à la guerre)
  // V2 « relation à deux sens » (décisions de l'utilisateur du 14/11, étape 1) : la guerre n'est possible qu'à une relation
  // de −50 ou moins (hostile), pour le joueur comme pour les nations ; le commerce rapproche (+1 par tour avec une nation tant
  // qu'un contrat ou un traité est en cours) ; les dirigeants hostiles provoquent des incidents (personas.js, provoque).
  // actif: false = règles d'avant (tests écrits avant cette étape). ASSUMPTION (relation, 14/11) : valeurs à vérifier.
  hostilite: { actif: true, seuil: -50, commerceParTour: 1 },
  // diplomate (étape 2 du 14/11, ASSUMPTION) : un seul à la fois, envoyé dans une nation (pas en guerre contre nous) ;
  // chaque tour : coût en or, relation + ; rappelé à volonté, et de lui-même si la guerre éclate avec sa nation
  diplomate: { cout: 5, relation: 2 },
  // exigence (étape 3 du 14/11, ASSUMPTION) : seulement contre une nation sous notre embargo, une à la fois par nation.
  // Chaque tour où l'embargo lui fait manquer des marchandises, elle cède avec une chance (colère − debut) / (cede − debut),
  // à coup sûr à « cede » de colère. Cédé : exigence accordée, relation +cedeRelation. Pas cédé au bout de « duree » tours :
  // relation +refusRelation, exigence abandonnée. Embargo levé avant : exigence abandonnée sans effet.
  exigence: { debut: 30, cede: 60, cedeRelation: 10, duree: 10, refusRelation: -20,
    types: { lever_sanctions: { nom: "lever ses sanctions" }, cesser_provocations: { nom: "cesser les provocations", tours: 10 },
             dedommagement: { nom: "payer un dédommagement", or: 50 } } },

  // réputation (À TRANCHER n° 2, validé) : seules les lignes utiles en M3a ; guerre et attaque de l'Entente en M3b
  reputation: { donPar20: 1, donMax: 5, traiteSigne: 3, traiteRespecte: 2, respectTous: 10, traiteRompu: -15,
                sanctionLegitime: 3, sanctionIllegitime: -5, paria: -50 },

  // V2 étape 6 (validée le 13/11) : la réputation est fusionnée dans les relations : chaque point de réputation du barème
  // devient part × point de relation avec **toutes** les nations (agression : −100 avec la cible, −10 avec les autres) ;
  // « réputation » affichée = moyenne des relations ; paria sous −50 de moyenne.
  // actif: false : réputation à part de la V1 (utilisé par les tests de règles écrits avant cette étape)
  fusion: { actif: true, part: 0.5 },

  dons: [20, 50, 100],              // ASSUMPTION validée (M3) ; un don par nation et par tour : ASSUMPTION validée (M3a)

  nation: { croissance: 0.005, dissipation: 1 },   // économie simplifiée des nations : ASSUMPTION validée (M3) ; V2 : l'armée coûte ses régiments (donnees/guerre.js)

  // embargo : la cible manque de ce qu'elle importe et dont le joueur a un surplus (ASSUMPTION validée, M3)
  embargo: { colereParManque: 1 / 3 },
  // sanction légitime si la cible est en guerre contre le joueur ou un membre de l'Entente (M3b) : ASSUMPTION validée (M3a)

  // contrats (13/11 : plus de liste fixe) : chaque nation propose d'acheter ce qu'elle importe et de vendre ce qu'elle exporte ;
  // volume par tour = son volume, au plus 10 ; prix fixe = prix de base × 0,8 (on achète) ou × 1,3 (on vend) ; 10 tours ;
  // relation minimale : celle du persona (ASSUMPTION validée (personas), repris des contrats de la V1)
  // transport (16/11, ASSUMPTION (transport)) : un contrat coûte parUnite or par unité et par cran de distance (prix de
  // vente diminué, prix d'achat augmenté) ; chaque contrat occupe une caravane (2 au départ, achetables, entretien par tour
  // pour celles achetées) ; une route améliorée vers une nation divise son coût de transport. actif: false = règles d'avant.
  transport: { actif: true, parUnite: 0.1, caravanes: 2, coutCaravane: 60, entretienCaravane: 2, coutRoute: 100, route: 0.5 },
  // projet commun (16/11, ASSUMPTION (projet) validée le 16/11 ; remplace la filature conjointe) : un bâtiment de production
  // cofinancé par une nation de l'Entente qui importe ce qu'il produit (un projet en cours par nation). Elle paie « part » du
  // bâtiment ; en échange, pendant « livraisons » tours de service (hors occupation), elle reçoit « volume » de la production
  // de base, à « prix » × le prix de base, sans transport. Relation +relation à la commande et +1 par tour pendant les
  // livraisons. Rupture par le joueur (embargo, guerre, Entente rompue) : livraisons arrêtées, relation +rupture ; par la
  // nation (sanctions) : sans pénalité. actif: false = règles d'avant (filature conjointe, tests écrits avant).
  projet: { actif: true, part: 0.5, volume: 1 / 3, prix: 0.5, livraisons: 10, relation: 5, rupture: -20,
            batiments: ["farm", "mine", "workshop", "weaving", "scierie", "mine_charbon", "vignoble"] },
  // investir à l'étranger (16/11, ASSUMPTION (investissement) validée le 16/11) : financer, au prix plein, un bâtiment de
  // production chez une nation (pour un bien qu'elle exporte), un par région de la nation ; relation ≥ relationMin, ni
  // embargo, ni sanction, ni guerre. Une fois construit (délai du bâtiment) : chaque tour, « dividende » × son prix (lois :
  // Exportation des capitaux ×1,5, Contrôle des capitaux ×0,5) ; relation +1 par tour avec la nation ; compte dans la
  // Prospérité pour son prix. Embargo, guerre ou sanctions avec la nation : confisqué (perdu).
  investissement: { actif: true, dividende: 0.1, relationMin: 30,
                    batiments: ["farm", "mine", "workshop", "weaving", "scierie", "mine_charbon", "vignoble"] },
  contrats: { volumeMax: 10, prixAchat: 0.9, prixVente: 1.15, duree: 10, maxEnCours: null },   // maxEnCours : plafond de contrats en cours (en essai, null = aucun)   // 14/11 : ×0,8 / ×1,3 → ×0,9 / ×1,15 (le commerce raflait aussi la Prospérité)

  // traités : relation minimale de la nation pour accepter ; condition supplémentaire
  traites: {
    entente:          { nom: "Entente des Ports",   relationMin: 30, tarifs: { achat: 0.9, vente: 1.1 } },   // ASSUMPTION validée (M3)
    defense_mutuelle: { nom: "Défense mutuelle",    relationMin: 50 },                                       // ASSUMPTION validée (M3)
    filature:         { nom: "Filature conjointe",  relationMin: 30, requiert: "entente",   // avec n'importe quelle nation (13/11)
                        batiment: "entente_mill", livraison: { bien: "tissu", volume: 6, prix: 1 } }          // ASSUMPTION validée (M3)
  }
};

if (NODE) module.exports = DIPLOMATIE; else (racine.Politique = racine.Politique || {}).DIPLOMATIE = DIPLOMATIE;
})(typeof window !== "undefined" ? window : globalThis);

/* Politique : diplomatie et commerce (RULES_V1 § Diplomatie et commerce ; propositions de M3a validées le 13/11,
   specs/politique.md § 6). « ASSUMPTION validée (M3) » = proposée avant M3 ; « (M3a) » = détail ajouté en écrivant M3a ; tout validé le 13/11. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const DIPLOMATIE = {
  relation: { min: -100, max: 100, traite: 10, contrat: 5, donParOr: 1 / 5, embargo: -30 },   // ASSUMPTION validée (M3)

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
  // relation minimale : celle du persona (ASSUMPTION (personas), repris des contrats de la V1)
  contrats: { volumeMax: 10, prixAchat: 0.8, prixVente: 1.3, duree: 10 },

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

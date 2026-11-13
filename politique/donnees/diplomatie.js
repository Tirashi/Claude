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

  dons: [20, 50, 100],              // ASSUMPTION validée (M3) ; un don par nation et par tour : ASSUMPTION validée (M3a)

  nation: { croissance: 0.005, armee: 12, dissipation: 1 },   // économie simplifiée des nations : ASSUMPTION validée (M3)

  // embargo : la cible manque de ce qu'elle importe et dont le joueur a un surplus (ASSUMPTION validée, M3)
  embargo: { colereParManque: 1 / 3 },
  // sanction légitime si la cible est en guerre contre le joueur ou un membre de l'Entente (M3b) : ASSUMPTION validée (M3a)

  // contrats : sens = ce que fait le joueur ; volume par tour, prix fixe ; acceptés si relation ≥ 0
  contrats: {
    brume_tissu:        { nation: "brume",       sens: "achat", bien: "tissu",  volume: 10, prix: 1.6, duree: 10 },  // ASSUMPTION validée (M3)
    contreforts_outils: { nation: "contreforts", sens: "achat", bien: "outils", volume: 5,  prix: 1.6, duree: 10 },  // ASSUMPTION validée (M3)
    val_roc_grain:      { nation: "val_roc",     sens: "vente", bien: "grain",  volume: 10, prix: 1.3, duree: 10 }   // ASSUMPTION validée (M3)
  },
  relationContrat: 0,

  // traités : relation minimale de la nation pour accepter ; condition supplémentaire
  traites: {
    entente:          { nom: "Entente des Ports",   relationMin: 30, tarifs: { achat: 0.9, vente: 1.1 } },   // ASSUMPTION validée (M3)
    defense_mutuelle: { nom: "Défense mutuelle",    relationMin: 50 },                                       // ASSUMPTION validée (M3)
    filature:         { nom: "Filature conjointe",  relationMin: 30, nations: ["brume"], requiert: "entente",
                        batiment: "entente_mill", livraison: { bien: "tissu", volume: 6, prix: 1 } }          // ASSUMPTION validée (M3)
  }
};

if (NODE) module.exports = DIPLOMATIE; else (racine.Politique = racine.Politique || {}).DIPLOMATIE = DIPLOMATIE;
})(typeof window !== "undefined" ? window : globalThis);

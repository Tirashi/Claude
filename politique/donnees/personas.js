/* Politique : personas des dirigeants (V2 ; décision de l'utilisateur du 13/11 : tirés au hasard à chaque partie, cachés au
   joueur, 3 différents parmi 7). La nation garde ses régions, son économie et ses échanges ; le persona décide de l'armée,
   de la guerre et de la diplomatie. Valeurs : propositions de Claude du 13/11 (specs/politique/regles-v2.md), ASSUMPTION
   (personas) à valider.
   armee : multiplicateur de force ; regiments : au départ ; recrute : armée visée (part du plafond), régiments par tour,
   or gardé ; traite / contrat : relation minimale pour accepter ; declare : conditions de déclaration de guerre ;
   rejoint : chance de rejoindre le camp le plus fort ; contreAgresseur : rejoint le camp attaqué ; refuse : traités refusés. */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const PERSONAS = {
  belliqueux:     { nom: "belliqueux", armee: 1.6, regiments: 5, recrute: { cible: 1, parTour: 2, reserve: 100 }, traite: 60, contrat: 0,
                    declare: { ratio: 1.2, relationMax: 20, proba: 0.3, tourMin: 6 } },   // relationMax 20 : déclare tant qu'on n'est pas amis
  marchand:       { nom: "marchand", armee: 1, regiments: 3, recrute: { cible: 0.5, parTour: 1, reserve: 200 }, traite: 30, contrat: -10 },
  opportuniste:   { nom: "opportuniste", armee: 1.3, regiments: 3, recrute: { cible: 0.7, parTour: 1, reserve: 100 }, traite: 30, contrat: 0, rejoint: 0.5 },
  isolationniste: { nom: "isolationniste", armee: 1.3, regiments: 4, recrute: { cible: 0.7, parTour: 1, reserve: 100 }, traite: 50, contrat: 0, refuse: ["defense_mutuelle"] },
  revanchard:     { nom: "revanchard", armee: 1.3, regiments: 3, recrute: { cible: 0.7, parTour: 1, reserve: 100 }, traite: 40, contrat: 0,
                    declare: { ratio: 2, relationMax: -30, proba: 0.2, tourMin: 6 },
                    revanche: { ratio: 1.2, relationMax: 101, proba: 0.3, tourMin: 6 } },   // contre qui l'a battu, après la trêve
  idealiste:      { nom: "idéaliste", armee: 1, regiments: 3, recrute: { cible: 0.5, parTour: 1, reserve: 200 }, traite: 30, contrat: 0, reputationMin: 0,
                    declare: { paria: true, ratio: 1, relationMax: 101, proba: 0.3, tourMin: 6 }, contreAgresseur: true },
  prudent:        { nom: "prudent", armee: 1.3, regiments: 3, recrute: { cible: 0.7, parTour: 1, reserve: 100 }, traite: 40, contrat: 0,
                    declare: { ratio: 2, relationMax: -30, proba: 0.2, tourMin: 6 } }
};

if (NODE) module.exports = PERSONAS; else (racine.Politique = racine.Politique || {}).PERSONAS = PERSONAS;
})(typeof window !== "undefined" ? window : globalThis);

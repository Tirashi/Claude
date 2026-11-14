/* Politique : paquet d'événements (backlog B2 ; cartes et chiffres validés le 14/11, sans « saturation » ni « pénurie »).
   À partir du tour `debut`, à la fin de chaque tour, une chance `chance` de tirer une carte ; une carte tirée ne revient pas
   avant que le paquet soit épuisé ; une carte dont la condition n'est pas remplie est passée (elle reste dans le paquet).
   effets : appliqués au tirage ; choix : réponses proposées au tour suivant (la première, gratuite, s'applique si le joueur
   ne choisit pas ; cout : or à payer). Types d'effets : production { bien (null = tous), mult, duree }, familles { mult } ou
   { plus }, colere / puissance { cible: "toutes" | "plusEnColere", delta }, or { delta }, relation { cible: "toutes" |
   "nation", delta }, emplacement { terrain, delta }, rendement { mult } (un type de bâtiment tiré au hasard),
   regiments { mult }, persona (un voisin change de persona). */
(function(racine){
"use strict";
const NODE = typeof module !== "undefined" && module.exports;

const REGLES_EVENEMENTS = { debut: 5, chance: 1 / 6 };

const CARTES = {
  secheresse: { nom: "Sécheresse", texte: "La sécheresse ruine les récoltes : grain −40 % pendant 3 tours.",
    effets: [{ type: "production", bien: "grain", mult: 0.6, duree: 3 }] },
  recolte: { nom: "Bonne récolte", texte: "Une récolte exceptionnelle : grain +40 % pendant 3 tours.",
    effets: [{ type: "production", bien: "grain", mult: 1.4, duree: 3 }] },
  epidemie: { nom: "Épidémie", texte: "Une épidémie frappe le pays.",
    choix: [{ id: "subir", texte: "Laisser faire : −8 % de familles.", effets: [{ type: "familles", mult: 0.92 }] },
            { id: "quarantaine", texte: "Quarantaine : production −20 % pendant 2 tours, −3 % de familles.",
              effets: [{ type: "production", bien: null, mult: 0.8, duree: 2 }, { type: "familles", mult: 0.97 }] }] },
  scandale: { nom: "Scandale", texte: "Un scandale éclabousse le gouvernement.",
    choix: [{ id: "subir", texte: "Laisser faire : toutes les factions +8 de colère.", effets: [{ type: "colere", cible: "toutes", delta: 8 }] },
            { id: "etouffer", texte: "Étouffer l'affaire : 80 or.", cout: 80, effets: [] }] },
  greve: { nom: "Grève sauvage", texte: "La faction la plus en colère se met en grève : +15 de colère.",
    effets: [{ type: "colere", cible: "plusEnColere", delta: 15 }],
    choix: [{ id: "reprimer", texte: "Réprimer : −10 de colère, mais +10 de puissance.", effets: [{ type: "colere", cible: "plusEnColere", delta: -10 }, { type: "puissance", cible: "plusEnColere", delta: 10 }] },
            { id: "ceder", texte: "Céder : 60 or, −10 de colère.", cout: 60, effets: [{ type: "colere", cible: "plusEnColere", delta: -10 }] }] },
  filon: { nom: "Filon découvert", texte: "Un nouveau filon : une région à filons gagne un emplacement.", condition: "filons",
    effets: [{ type: "emplacement", terrain: "filons", delta: 1 }] },
  refugies: { nom: "Réfugiés", texte: "Des familles fuient une guerre voisine.",
    choix: [{ id: "refuser", texte: "Refuser : −5 de relation avec toutes les nations.", effets: [{ type: "relation", cible: "toutes", delta: -5 }] },
            { id: "accueillir", texte: "Accueillir : +10 familles, +5 de relation avec toutes, paysans +5 de colère.",
              effets: [{ type: "familles", plus: 10 }, { type: "relation", cible: "toutes", delta: 5 }, { type: "colere", cible: "paysans", delta: 5 }] }] },
  incident: { nom: "Incident de frontière", texte: "Un incident de frontière : relation −20 avec une nation.",
    effets: [{ type: "relation", cible: "nation", delta: -20 }],
    choix: [{ id: "ignorer", texte: "Ignorer.", effets: [] },
            { id: "excuses", texte: "S'excuser : 40 or, la relation revient.", cout: 40, effets: [{ type: "relation", cible: "nation", delta: 20 }] }] },
  ambassadeur: { nom: "Visite d'un ambassadeur", texte: "Un ambassadeur en visite : relation +15 avec une nation.",
    effets: [{ type: "relation", cible: "nation", delta: 15 }] },
  inventeur: { nom: "Inventeur", texte: "Un inventeur cherche un mécène.",
    choix: [{ id: "refuser", texte: "Refuser.", effets: [] },
            { id: "financer", texte: "Financer : 100 or, +15 % de rendement pour un type de bâtiment.", cout: 100, effets: [{ type: "rendement", mult: 1.15 }] }] },
  mutinerie: { nom: "Mutinerie", texte: "Des régiments se mutinent : −25 % de régiments.", condition: "guerreMoral",
    effets: [{ type: "regiments", mult: 0.75 }] },
  dirigeant: { nom: "Changement de dirigeant", texte: "Un voisin change de dirigeant.",
    effets: [{ type: "persona" }] }
};

const Evenements = { REGLES_EVENEMENTS, CARTES };
if (NODE) module.exports = Evenements; else (racine.Politique = racine.Politique || {}).EVENEMENTS = Evenements;
})(typeof window !== "undefined" ? window : globalThis);

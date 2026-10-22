/* =====================================================================
   BANNIÈRES · les PETITES SURPRISES (§ 9 du cahier des charges).
   Environ un tour sur trois à partir du tour 3, pour le joueur seulement ;
   jamais de mauvaise surprise grave. Logique pure, tirée de la graine.
   Chargé après regles.js (banFinTour appelle banSurprise).
   ===================================================================== */
'use strict';
const BAN_SURPRISES = {
  marchand: { titre: 'Un marchand passe', texte: '+3 pièces !', effet: e => { e.seigneurs[0].pieces += 3; } },
  recolte: { titre: 'La récolte est bonne', texte: '+2 pièces !', effet: e => { e.seigneurs[0].pieces += 2; } },
  // s'il n'y a pas de place au château, il laisse 3 pièces
  chevalier: { titre: 'Un chevalier arrive', texte: 'Il rejoint ton armée au château.', effet: e => { if (!banRenfort(e, 0, 'fantassin')) { e.seigneurs[0].pieces += 3; return 'Pas de place : il te donne 3 pièces.'; } return null; } },
  pluie: { titre: 'Il pleut', texte: 'Les armées ne bougent que d\'1 pas ce tour.', effet: e => { e.pluie = true; e.armees.forEach(a => { if (a.s >= 0) a.pts = Math.min(a.pts, 1); }); } },
  dragon: { titre: 'Un dragon passe dans le ciel…', texte: 'Il ne fait rien. Il est juste beau.', effet: () => null },
};
const BAN_CHANCE_SURPRISE = 0.34;
// tirée au début du tour (dans banFinTour) ; appliquée tout de suite ; l'interface montre etat.surprise
function banSurprise(etat) {
  if (etat.tour < 3 || banRng(etat.graine, 'surprise', etat.tour)() > BAN_CHANCE_SURPRISE) return null;
  const ids = Object.keys(BAN_SURPRISES), id = ids[Math.floor(banRng(etat.graine, 'surprise', etat.tour, 1)() * ids.length)];
  const note = BAN_SURPRISES[id].effet(etat) || null;
  return (etat.surprise = { id, tour: etat.tour, note });
}

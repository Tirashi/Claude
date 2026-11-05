# Moteur RPG — notes pour Claude
Moteur réutilisable (`window.MoteurRPG`), utilisé par La Dernière Lanterne ([`lanterne/CLAUDE.md`](../lanterne/CLAUDE.md)). Il ne sait rien du jeu : tout le contenu est en données. Cahier des charges : [`specs/rpg.md`](../specs/rpg.md) § 12.
- **Testables sous Node, sans DOM** : `etat.js` (état JSON, sauvegardes), `monde.js` (cartes, sorties, déclencheurs, objets ouvrables, habitants, monstres), `evenements.js` (langage de scripts), `regles.js` (règles chiffrées), `combat.js` (combat au tour par tour : `debutTour` / `prochain` / `agirUn` / `finTour`).
- **Navigateur** : `partie.js` (relie tout ; `CADENCE` de la marche), `rendu.js` (HD-2D Three.js, panneaux, `masquable`), `poupees.js` (personnages animés), `interface.js` (fenêtres HTML), `menu.js` (6 onglets et retour `ludo-retour`), `combat-ui.js`, `entrees.js` (croix, A, B, MENU, clavier), `sons.js`.
- Tests : `outils/lanterne-tests.js` (dans `verifications.js`).

## Pièges
- Voir la leçon « HD-2D avec des panneaux » du mémo ([`specs/ludotheque.md`](../specs/ludotheque.md)).
- Combat : le moteur calcule toute l'action d'un coup ; l'écran garde ses PV affichés à part et ne les baisse qu'au contact ; toute durée d'animation passe par le multiplicateur `lent`.
- La marche suit l'horloge (`CADENCE`), pas l'avancée dans la case.

---
name: ajouter-un-jeu
description: Ajouter un nouveau jeu à la Ludothèque 16 bits ou terminer son intégration (maquette validée, dossier du jeu, accueil, transfert, classements, service worker, crédits, docs, tests, artefact).
---

# Ajouter un jeu à la Ludothèque

La liste de contrôle de référence est dans `specs/ludotheque.md`, section « Ajouter un nouveau jeu (liste de contrôle) » : la lire **par morceaux** (`grep -n` puis `sed -n`), ainsi que les leçons qui concernent le type de jeu (3D, canvas, défi du jour, artefact).

Résumé, dans l'ordre :
0. **Maquette validée** par l'utilisateur avant d'écrire le jeu ; cahier des charges dans `specs/<jeu>.md`.
1. **Le jeu** : `<dossier>/index.html` + `jeu.js` (+ `style.css`), scripts classiques (pas de modules ES ni npm). Retour au menu de la Ludothèque **dans les menus du jeu** (classe `ludo-retour`, ou `!window.ludoArtefact` dans un canvas). Textes en Press Start 2P : MAJUSCULES sans accent.
2. **Accueil** : la fiche `<dossier>/fiche.js` (copier une fiche proche ; mode d'emploi en tête d'`accueil-outils.js`) : `carte` (et `demo: true` pour une démo), `meta`, `records`, `enCours`, `duJour`, `nom`. Hors du dossier : chemin dans `ORDRE` et ligne dans `NEWS` (`accueil.js`), `<script src>` dans `index.html`, icône dans `icones.js`.
3. **Transfert** `LUDO1-` : `transfert` de la fiche (`cles`, `collecter(g)`, `decrire(g, out)`, `fusionner(g, done)`) ; cas dans `outils/logique.js`.
4. **Classements** : `LudoScores.submit(...)`, `registerExisting` et `PSEUDO_BOARDS` (`ludo-scores.js`, `SYNC` +1), `classements` dans la fiche. Défi du jour : une seule tentative classée par jour. Tester avec `outils/faux-classements.js` (Supabase injoignable d'ici), puis demander un essai sur le téléphone.
5. **`sw.js`** : fichiers dans `FILES` (dont `fiche.js`), `VERSION` +1, et la noter dans `CLAUDE.md` (« Service worker », `verifications.js` le contrôle).
6. **Crédits** : `credits/index.html` pour toute ressource venue d'ailleurs.
7. **Docs** : `README.md`, `CLAUDE.md` (nom et dossier dans « Les jeux », une ligne dans « En cours »), `specs/ludotheque.md` (une ligne dans le tableau des jeux), `specs/suivi.md`, `IDEES.md` (✅). **Gros jeu** (plusieurs scripts, simulateur) : son propre `<dossier>/CLAUDE.md` de moins de 2 Ko (rôle de chaque fichier, objet `window.<Jeu>`, simulateur, fichiers partagés utilisés, pièges, lien vers `specs/<jeu>.md`), et la ligne du mémo y renvoie ; modèle : `duche/CLAUDE.md`. Petit jeu : le détail reste dans la ligne du mémo.
8. **Tests** : `git add` d'abord (`verifications.js` ne voit que les fichiers suivis), puis `node outils/verifications.js` ; test de fumée dans `outils/fumee.js` ; le reste tourne en CI.
9. **Artefact** : skill `republier-artefact` (nouveau lien à ajouter dans son tableau ; demander l'accord avant d'en créer un).

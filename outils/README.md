# Outils de test (pour Claude)

Scripts réutilisables d'une session à l'autre. Ils ne font pas partie du site.

Lancer d'abord le serveur local **depuis la racine du dépôt** :

```
python3 -m http.server 8765
```

| Script | Rôle |
|---|---|
| `captures.js <sortie> <page>...` | Captures sur un écran de téléphone (390×780). |
| `faux-classements.js <ancre> [records-json] [capture]` | Classements avec un faux serveur Supabase : ce qui part à l'inscription, quel tableau le volet du jeu demande (accueil ouvert sur l'ancre). |
| `orbite-solveur.js [niveaux]` | Orbite : tirs gagnants et robustes par niveau. |
| `lune-rover-niveaux.js` | Lune-Rover, **sous Node** : chaque niveau est gagné par sa solution de référence (dans le palier du niveau) ; sans répétitions, la solution est la plus courte. Lancé aussi par `verifications.js`. |
| `pont-stellaire-unicite.js [n]` | Pont stellaire : temps de génération et unicité des solutions. |
| `verifications.js` | **Avant chaque push** (le seul test à lancer en local) (sans navigateur ni serveur) : syntaxe de tous les scripts, `sw.js` (fichiers et version notée dans CLAUDE.md), aucune clé secrète, `MON-CODE`, icônes 16×16, simulateur Nebula, plateaux d'Odyssée, cohérence des classements (chaque record envoyé est affiché sur l'accueil et repris en rejoignant), types de `nebula/regles.js` (`tsc -p outils/tsconfig.nebula.json`, ignoré si `tsc` est absent). Lancé aussi par la CI GitHub. |
| `lint.js` | Analyse du code (ESLint) de chaque page avec ses scripts : variable non définie, déclaration en double, code inatteignable… **Lancé par la CI.** |
| `logique.js [jours]` | Logique des jeux dans Chromium, **lancé par la CI** (inutile en local, sauf pour déboguer) : grilles du jour des prochains jours (Sudoku, Queens, Pont stellaire, Calculator, arbres de Lignée, sites d'Alunissage), 200 parcours d'Injagility, dessins du Picross résolus sans deviner, points du Yams, transfert `LUDO1-`. La CI le relance chaque lundi sur 365 jours. |
| `fumee.js [captures]` | Chaque jeu s'ouvre sans erreur JavaScript ; Le Magasinier : un niveau de glace gagné par sa solution, ANNULER, écran de fin ; Nebula : saut, toucher, fin de tour, entraînement, écran INCIDENT ; Odyssée : carte, plateau traversé par le pilote ; Amiral ! : chaque pouvoir (vérifié dès la fin de l'action du joueur, avant le tour de l'ordinateur, pour ne pas dépendre de son hasard), bataille du jour, parties simulées. Lancé aussi par la CI. |
| `nebula-simulateur.js [n] [prudence]` | Nebula, **sous Node** (pas besoin du serveur) : combats automatiques (victoires, coque perdue) contre l'IA du secteur 1 puis l'IA par score (niveaux 1 et 2), parties complètes reproductibles, `migrate()`. |
| `nebula-parties.js [n] [prudence]` | Nebula, sous Node : parties complètes sur les 3 secteurs (où la flotte tombe, victoires, coque perdue par secteur et par type de combat). Pour régler la difficulté. |
| `nebula-flottes.js [n] [vaisseau,vaisseau,…]…` | Nebula, sous Node : force de différentes flottes de départ (victoires, secteurs, score, coût en points et prime). Sans composition : les 3 modèles et quelques flottes de 9-10 points. Pour calibrer les points de flotte. |
| `odyssee.js [plateau] [dessin]` | Odyssée, **sous Node** : chaque plateau se lit et le pilote automatique le traverse (sans naufrage, au moins 3 fois sur 5 avec des projectiles) sous le temps cible ; `dessin` montre la carte et la trace du pilote. Lancé aussi par `verifications.js`. |
| `ile-colonie.js [parties] [années] [graine] [détail]` | La colonie, sous Node : parties jouées par un pilote automatique simple (années tenues, population, départs, score, `migrate()`). Pour régler la difficulté. |
| `magasinier-solveur.js [--optimum] [-v]` | Le Magasinier, **sous Node** : chaque niveau de `magasinier/niveaux.js` se lit et sa solution notée (`sol`) le gagne en `opt` coups (lancé par `verifications.js`) ; `--optimum` refait la recherche en largeur pour vérifier que `opt` est bien le minimum (~10 s). |
| `magasinier-generateur.js <salle> [essais] [graine]` | Le Magasinier, sous Node, **outil de création** : pour une salle dessinée dans `magasinier-salles.js` (murs et glace), place marques, caisses et docker pour le niveau le plus riche (poussées, virages) ; sans glace par recherche à rebours exacte, avec glace par essais puis améliorations vérifiés par le solveur. Imprime le plan à coller dans `niveaux.js` (puis noter `opt` et `sol`). |
| `capitaine-solveur.js [--optimum]` | Capitaine du port, **sous Node** : chaque bassin de `capitaine-du-port/niveaux.js` se lit et sa solution notée (`sol`) le gagne en `opt` coups (lancé par `verifications.js`) ; `--optimum` vérifie aussi par recherche en largeur que `opt` est le minimum. |
| `capitaine-generateur.js <port> [graine]` | Capitaine du port, sous Node, **outil de création** : fabrique les 12 bassins d'un port, un par optimum visé (pose au hasard, puis l'état le plus difficile de toute la composante), et les écrit au format de `niveaux.js`. |
| `lanterne-tests.js` | La Dernière Lanterne, **sous Node** : moteur RPG (sauvegardes, file, initiative, événements), cohérence des données (sorties, événements, personnages, tuiles, drapeaux lus et écrits) et accessibilité (chaque carte, objet, habitant et déclencheur atteignable depuis le départ, en ouvrant grilles, portes à clé et nappes de brume, jusqu'aux drapeaux de `LANTERNE.fin`). Lancé aussi par `verifications.js`. |
| `lanterne-combats.js [n]` | La Dernière Lanterne, **sous Node**, équilibrage : combats simulés (stratégie `choixAuto`) pour chaque cas de `CAS` (équipe et niveau prévus à ce moment de l'histoire, contre une rencontre) : victoires, tours, PV perdus, comparés aux cibles. `lanterne-tests.js` refait les mêmes cas sur 150 combats. |
| `lanterne-tuiles.py <rltiles>` | La Dernière Lanterne, **outil de création** (Python + Pillow) : fabrique `lanterne/tuiles.png` et `lanterne/donnees/tuiles.js` à partir des tuiles de Dungeon Crawl (liste et recettes des personnages dans `lanterne-tuiles.json`), et dessine les accessoires absents du pack (coffre, table, lit, tonneau, barrière, panneau, toits, parquet, clés, nappe de brume, levier, les faces des meubles en volume (bois, lit, table, tonneau, bibliothèque, coffre, cheminée, colonnes, sarcophage) et les ornements (fenêtres, vitrail, tapisserie, tableau, bouclier, étagère, torche, tapis)). |
| `artefact.py <jeu.html> <sortie.html>` | Copie d'un jeu prête à publier en artefact (tous les scripts locaux intégrés, sans ludo-scores.js). |

`pw.js` charge Playwright (installé dans `/opt/node22`) et règle l'écran de téléphone.

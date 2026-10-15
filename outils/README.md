# Outils de test (pour Claude)

Scripts réutilisables d'une session à l'autre. Ils ne font pas partie du site.

Lancer d'abord le serveur local **depuis la racine du dépôt** :

```
python3 -m http.server 8765
```

| Script | Rôle |
|---|---|
| `captures.js <sortie> <page>...` | Captures sur un écran de téléphone (390×780). |
| `faux-classements.js <ancre> [records-json] [capture]` | Classements avec un faux serveur Supabase : ce qui part à l'inscription, quel tableau la page demande. |
| `orbite-solveur.js [niveaux]` | Orbite : tirs gagnants et robustes par niveau. |
| `pont-stellaire-unicite.js [n]` | Pont stellaire : temps de génération et unicité des solutions. |
| `verifications.js` | **Avant chaque push** (sans navigateur ni serveur) : syntaxe de tous les scripts, `sw.js` (fichiers et version notée dans CLAUDE.md), aucune clé secrète, `MON-CODE`, icônes 16×16, simulateur Nebula, types de `nebula/regles.js` (`tsc -p outils/tsconfig.nebula.json`, ignoré si `tsc` est absent). Lancé aussi par la CI GitHub. |
| `fumee.js [captures]` | Chaque jeu s'ouvre sans erreur JavaScript ; Nebula : saut, toucher, fin de tour, entraînement, écran INCIDENT. Lancé aussi par la CI. |
| `nebula-simulateur.js [n] [prudence]` | Nebula, **sous Node** (pas besoin du serveur) : combats automatiques (victoires, coque perdue) contre l'IA du secteur 1 puis l'IA par score (niveaux 1 et 2), parties complètes reproductibles, `migrate()`. |
| `nebula-parties.js [n] [prudence]` | Nebula, sous Node : parties complètes sur les 3 secteurs (où la flotte tombe, victoires, coque perdue par secteur et par type de combat). Pour régler la difficulté. |
| `nebula-flottes.js [n] [vaisseau,vaisseau,…]…` | Nebula, sous Node : force de différentes flottes de départ (victoires, secteurs, score, coût en points et prime). Sans composition : les 3 modèles et quelques flottes de 9-10 points. Pour calibrer les points de flotte. |
| `artefact.py <jeu.html> <sortie.html>` | Copie d'un jeu prête à publier en artefact (tous les scripts locaux intégrés, sans ludo-scores.js). |

`pw.js` charge Playwright (installé dans `/opt/node22`) et règle l'écran de téléphone.

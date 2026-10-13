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
| `artefact.py <jeu.html> <sortie.html>` | Copie d'un jeu prête à publier en artefact (chiens32.js intégré, sans ludo-scores.js). |

`pw.js` charge Playwright (installé dans `/opt/node22`) et règle l'écran de téléphone.

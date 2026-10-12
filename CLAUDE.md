# Ludothèque 16 bits — consignes pour Claude

## Le projet
- Dépôt GitHub : **Tirashi/Claude**. Site publié : **https://tirashi.github.io/Claude/** (installé en appli PWA sur Android).
- Jeux en HTML autonomes (un fichier par jeu, sans build), un dossier par jeu. La page d'accueil `index.html` est le menu.
- Service worker `sw.js` (mode hors connexion) : quand on ajoute ou renomme un fichier, l'ajouter à `FILES` et changer `VERSION` (`ludotheque-v11` au moment d'écrire ces lignes).
- Moteur de sprites 32 bits partagé : `injagility/chiens32.js` (volumes ombrés, 6 races de chiens).
- Classements en ligne : `ludo-scores.js` + page `classements/index.html`, base Supabase (scripts dans `supabase/`). Égalités classées 1, 2, 2, 4. Les records déjà présents sont envoyés une fois à l'inscription.
- Code de transfert de sauvegarde (export/import `LUDO1-…`) dans `index.html` : chaque nouveau jeu doit y être ajouté (collecte, description, fusion).

## Règles de travail
- Répondre **en français**.
- Développer et pousser **uniquement sur la branche de travail** de la session. Ne pousser sur `main` **que quand l'utilisateur dit « mets à jour main »**, en avance rapide uniquement :
  `git fetch origin main && git merge-base --is-ancestor origin/main HEAD && git push origin HEAD:main`
- Messages de commit en français, écrits dans un fichier puis `git commit -F`.
- Après chaque modification d'un jeu, **republier son artefact** (copie avec `chiens32.js` intégré, sans `ludo-scores.js`) et donner le lien.
- Tester avec Playwright (captures sur un écran de téléphone) avant de pousser.
- **Sécurité** : ne jamais demander, stocker ni committer la clé secrète Supabase ni le mot de passe de la base. Seules l'URL publique `https://hfoiofrgltzdyetoqpjc.supabase.co` et la clé publiable `sb_publishable_6nlzAAAG3LLLonztigio4g_0Q6dakQE` sont dans le code. Le **code familial ne doit jamais être dans le dépôt** (le SQL garde `MON-CODE`).
- Accessibilité : « pas pour le moment ».
- Économie : une conversation par chantier, Sonnet pour réfléchir et les petites retouches, Opus pour coder un jeu ; éviter les sous-agents et les captures inutiles.

## Tenir la documentation à jour
**À chaque chantier, penser à mettre à jour quand c'est pertinent :**
- `CLAUDE.md` (ce fichier) : nouvelle règle donnée par l'utilisateur, nouveau jeu dans le tableau, changement d'état d'un jeu, version du cache, nouveau fichier partagé…
- `IDEES.md` : marquer une idée comme réalisée (✅), ajouter les nouvelles idées et les nouvelles maquettes (liens d'artefacts), noter les préférences exprimées.
- `README.md` : description du jeu pour les joueurs (liste du haut, section dédiée, transfert de sauvegardes, classements).

## Les jeux existants
| Jeu | Dossier | État / particularités |
|---|---|---|
| Queens 16-Bit | `queens/` | Puzzle des reines, records par taille, classement. |
| Picross Dex | `picross/` | Picross Pokémon (fan-game). Temps par Pokémon (+30 s par indice), Pokédex qui défile, nombres d'indice grisés un par un. |
| Lignée | `lignee/` | Arbre généalogique à reconstituer, 3 vies, arbre du jour, classements. |
| Injagility | `injagility/` | Agility canine 32 bits : mode Infini (chiens adoptés seulement) + Parcours vu du dessus (`parcours.html`), 6 races. |
| Touché Coulé | `touche-coule/` | Bataille navale classique / Arsenal, record en moins de tirs. |
| Amiral ! | `amiral/` | Bataille navale 32 bits 8×8 avec pouvoirs (avion 3×3, salve en croix, torpille ligne/colonne, plongée du sous-marin). 3 niveaux (Mousse, Capitaine, Amiral), record en moins de tours. **On le laisse tel quel pour le moment.** |
| Le Club d'agility | `club/` | Gestion d'un club (une semaine par tour) : 6 races, activités (agrès, repos, câlins), concours jouables au doigt (zone verte), séance guidée en option, boutique (chenil, buvette, tribunes, gazon pro), 5 niveaux de concours jusqu'au Championnat de France, nom du club modifiable. |
| Tetris, Snake, Asteroids, Solitaire, Jeu de la vie | dossiers du même nom | Reprises en style pixel art. |

## Idées et maquettes
Les jeux futurs (coups de cœur, bateaux, espace) et les liens des maquettes de style sont dans [`IDEES.md`](IDEES.md).

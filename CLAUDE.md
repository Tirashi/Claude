# Ludothèque 16 bits — consignes pour Claude

## Le projet
- Dépôt GitHub : **Tirashi/Claude**. Site publié : **https://tirashi.github.io/Claude/** (installé en appli PWA sur Android).
- Jeux en HTML **sans build** (le fichier poussé est celui que joue le téléphone), un dossier par jeu ; `index.html` = l'accueil (menu aux cartouches, volet de chaque jeu avec ses records et son classement). Un gros jeu peut se répartir en **scripts classiques** (`<script src>`, pas de modules ES ni de npm).
- Service worker `sw.js` : quand on ajoute ou renomme un fichier, l'ajouter à `FILES` et changer `VERSION` (`ludotheque-v28` au moment d'écrire ces lignes).
- Fichiers partagés : `ludo-scores.js` (classements Supabase), `icones.js` (icônes 16×16), `injagility/chiens32.js` (chiens 32 bits), `nebula/vaisseaux.js`, `nebula/regles.js`, `nebula/sons.js`, polices dans `polices/`.
- **Mémo technique : [`specs/ludotheque.md`](specs/ludotheque.md)** — architecture détaillée (accueil, classements, code de compte, transfert `LUDO1-`), **liste de contrôle pour ajouter un jeu**, leçons propres à chaque jeu, détails de chaque jeu. **Le lire avant** d'ajouter un jeu, de toucher à l'accueil, aux classements ou à un fichier partagé, ou de reprendre un jeu.

## Règles de travail
- Répondre **en français**.
- **Maquette d'abord** (règle de l'utilisateur, 16/10) : avant de programmer un nouveau jeu ou de refaire les graphismes d'un jeu, faire une petite maquette (artefact, dans `maquettes/`, 2 ou 3 directions sur un écran de téléphone) et **attendre que l'utilisateur la valide** ; on ne programme qu'ensuite, d'après la direction choisie.
- Développer et pousser **uniquement sur la branche de travail** de la session. Ne pousser sur `main` **que quand l'utilisateur dit « mets à jour main »**, en avance rapide uniquement :
  `git fetch origin main && git merge-base --is-ancestor origin/main HEAD && git push origin HEAD:main`
- Messages de commit en français, écrits dans un fichier puis `git commit -F`.
- Après chaque modification d'un jeu, **republier son artefact** (copie fabriquée par `python3 outils/artefact.py`) **au même lien** (tableau ci-dessous) et donner le lien.
- Tests ([`outils/`](outils/README.md)) : avant chaque push `node outils/verifications.js` ; après une modification d'un jeu `node outils/fumee.js` ; captures Playwright sur un écran de téléphone, seulement quand c'est utile. La CI GitHub relance les deux : regarder l'onglet *Actions* avant de mettre à jour `main`.
- **Sécurité** : ne jamais demander, stocker ni committer la clé secrète Supabase ni le mot de passe de la base. Seules l'URL publique `https://hfoiofrgltzdyetoqpjc.supabase.co` et la clé publiable `sb_publishable_6nlzAAAG3LLLonztigio4g_0Q6dakQE` sont dans le code. Le **code familial ne doit jamais être dans le dépôt** (le SQL garde `MON-CODE`).
- Accessibilité : « pas pour le moment ».
- **Économie de tokens** (règle du 16/10) : une conversation par chantier (repartir de zéro quand on change de sujet) ; demandes précises ; peu de captures ; pas de sous-agents ; lire les fichiers par morceaux plutôt qu'en entier. Choix du modèle :
  | Chantier | Modèle |
  |---|---|
  | Retouche, texte, doc, petite correction | Sonnet |
  | Maquette de style, discussion d'idées | Sonnet (Opus pour une décision importante) |
  | Fonctionnalité ou jeu moyen bien défini (ex. Lune-Rover) | opusplan (Opus fait le plan, Sonnet écrit le code) |
  | Gros moteur emmêlé (Nebula, la colonie, Défense orbitale) | Opus du début à la fin |
- Forfait : limite hebdomadaire remise à zéro le mercredi à 19 h ; petits chantiers plutôt en fin de semaine.

## Tenir la documentation à jour
À chaque chantier, quand c'est pertinent : `CLAUDE.md` (nouvelle règle, version du cache, nouveau jeu, lien d'artefact, état « En cours ») ; `specs/ludotheque.md` (détails techniques, leçons, tableau détaillé des jeux) ; `IDEES.md` (✅, nouvelles idées et maquettes, préférences) ; `README.md` (description pour les joueurs).

## Leçons apprises (générales)
- **Défis du jour** (règle de l'utilisateur, 15/10) : une seule tentative classée par jour ; tentative sauvegardée à part et reprise au même temps (puzzles) ou comptée dès le départ (missions). Détails par jeu dans le mémo. À appliquer à tout nouveau défi du jour.
- La police **Press Start 2P n'a pas de majuscules accentuées** : écrire les textes en MAJUSCULES sans accent (ETOILES, REESSAYER…).
- **Supabase n'est pas joignable** depuis l'environnement de Claude (proxy 403) : tester avec `outils/faux-classements.js`, puis demander un essai réel sur le téléphone.
- Playwright : changer seulement l'ancre (`#…`) ne recharge pas la page (repasser par `about:blank`) ; dans `page.evaluate`, les `const` et fonctions de haut niveau d'un jeu sont accessibles.

## Artefacts des jeux
Republier au **même lien** : publier avec `url` = le lien ci-dessous (lire l'artefact avant, comme l'exige l'outil). Un jeu sans lien connu : demander le lien à l'utilisateur avant d'en créer un nouveau.

| Jeu | Lien |
|---|---|
| Accueil de la Ludothèque (`index.html`) | https://claude.ai/artifact/2ThkvtRxf5y61K7bJWiAX7 |
| Amiral ! | https://claude.ai/artifact/XqUmx4zyyEARcrVjDHZE7v |
| Le Club d'agility | https://claude.ai/artifact/BT1R6L5DFd18w9A3XYghuc |
| Picross Dex | https://claude.ai/artifact/Ctm7ugtEDTNNCs6ExDViXQ |
| Lignée | https://claude.ai/artifact/LKCMLo7P1pC7QEJ5UyqcJA |
| Injagility, Infini (`injagility/index.html`) | https://claude.ai/artifact/Tk729YfzNqNXeBqfZYjs7k |
| Injagility, Parcours (`injagility/parcours.html`) | https://claude.ai/artifact/LxcviTcJyAAGWd32HwPGmb |
| Orbite | https://claude.ai/artifact/UysU574KpYMa7DdHhKsaHv |
| Lune-Rover | https://claude.ai/artifact/Caj42czGsSbBgwVmRVNR8T |
| Pont stellaire | https://claude.ai/artifact/Twgkpb1scdCh2Th6Nh35bF |
| Alunissage | https://claude.ai/artifact/2TgrmzSKuzoyPHYufyHrWh |
| Nebula | https://claude.ai/artifact/EPDtjTHPDsCnYKjtHCuxwY |
| La colonie (`ile/`, à venir ; contient encore l'ancienne Île des naufragés, à republier au même lien) | https://claude.ai/artifact/9AnNRRCCBu4pgYh35UwrPb |

Queens, Sudoku, Touché Coulé, Tetris, Snake, Asteroids, Solitaire et le Jeu de la vie **n'ont pas d'artefact** : on les joue sur le site. Ne pas en créer sans demande.

## Les jeux
Queens (`queens/`), Picross Dex (`picross/`), Lignée (`lignee/`), Injagility (`injagility/`), Touché Coulé (`touche-coule/`), Amiral ! (`amiral/`, **on le laisse tel quel pour le moment**), Le Club d'agility (`club/`), Orbite (`orbite/`), Lune-Rover (`lune-rover/`, règles et niveaux dans `regles.js`), Pont stellaire (`pont-stellaire/`), Sudoku (`sudoku/`), Alunissage (`alunissage/`), Nebula (`nebula/`, cahier des charges [`specs/nebula.md`](specs/nebula.md)), Tetris, Snake, Asteroids, Solitaire, Jeu de la vie. L'Île des naufragés a été retirée le 16/10 (la colonie la remplacera dans `ile/`). Détails de chaque jeu (classements, objets `window.<Jeu>` pour les tests) : tableau du mémo.

## En cours / à vérifier
- **Nebula** : sessions 1 à 4 faites ; équilibrage jugé correct, à revoir après plus de parties. État détaillé dans le mémo, suivi dans [`specs/nebula.md`](specs/nebula.md) § 17 à 22. Prochain chantier possible : « Nebula : l'Empire des étoiles », dans une nouvelle conversation.
- **La colonie** (remplace l'Île des naufragés, décision du 16/10) : cahier des charges [`specs/colonie.md`](specs/colonie.md) ; prochaine étape : maquette de l'écran en paysage, dans une nouvelle conversation.
- Orbite : niveaux 12, 23, 25, 28 et 30 les plus serrés ; à ajuster s'ils sont trop durs.
- Lune-Rover (16/10) : 30 niveaux, graphismes à refaire dans le style C « dessin animé » (choisi le 16/10) ; maquette approfondie `maquettes/lune-rover-c.html` (Pico le rover, carte des niveaux en chemin), en attente de validation avant de programmer. À essayer aussi sur le téléphone : taille des cases du programme, difficulté des niveaux 22 à 30.
- Classements testés seulement avec le faux serveur, à confirmer avec un vrai record : Lune-Rover, Orbite, Pont stellaire, Sudoku, grille du jour de Queens, Nebula (`daily`, `victoires`).

## Idées et maquettes
Les jeux futurs, les maquettes de style et le classement des idées par quantité de travail sont dans [`IDEES.md`](IDEES.md).

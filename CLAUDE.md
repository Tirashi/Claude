# Ludothèque 16 bits — consignes pour Claude

## Le projet
- Dépôt GitHub : **Tirashi/Claude**. Site publié : **https://tirashi.github.io/Claude/** (installé en appli PWA sur Android).
- Jeux en HTML **sans build** (le fichier poussé est celui que joue le téléphone), un dossier par jeu ; `index.html` = l'accueil (menu aux cartouches, volet de chaque jeu avec ses records et son classement). Un gros jeu peut se répartir en **scripts classiques** (`<script src>`, pas de modules ES ni de npm).
- Service worker `sw.js` : quand on ajoute ou renomme un fichier, l'ajouter à `FILES` et changer `VERSION` (`ludotheque-v37` au moment d'écrire ces lignes).
- Fichiers partagés : `ludo-scores.js` (classements Supabase), `icones.js` (icônes 16×16), `injagility/chiens32.js` (chiens 32 bits), `nebula/vaisseaux.js`, `nebula/regles.js`, `nebula/sons.js`, `ile/regles.js` (règles de la colonie), `lib/three.min.js` (Three.js r128, pour les jeux en 3D), `lib/cannon.min.js` (cannon.js 0.6.2, physique des dés du Yams), polices dans `polices/`.
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
- **Retour au menu de la Ludothèque** (règle de l'utilisateur, 17/10) : plus de bouton noir « ◀ MENU » ajouté en permanence par-dessus le jeu ; le retour se fait **dans les menus du jeu** (écran titre, pause…), dans le style du jeu. Fait pour tous les jeux. En HTML, le bouton porte la classe `ludo-retour` ; dans un canvas, il n'est dessiné que si `!window.ludoArtefact` (les deux sont gérés par `outils/artefact.py`).
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
| La colonie (`ile/`) | https://claude.ai/artifact/9AnNRRCCBu4pgYh35UwrPb |
| Calculator | https://claude.ai/artifact/2S5ABaMyUfFsbsjRAWbJZD |
| Empilage | https://claude.ai/artifact/B7BHw4hC7rLzf9tT5kjuaB |
| Escadrille ! | https://claude.ai/artifact/SUuAXS5scLnstbth9eZ7zV |
| Yams | https://claude.ai/artifact/L4nurJpT9pb8BqpJTmvyZ3 |

Queens, Sudoku, Touché Coulé, Tetris, Snake, Asteroids, Solitaire, le Jeu de la vie et Odyssée **n'ont pas d'artefact** : on les joue sur le site. Ne pas en créer sans demande.

## Les jeux
Queens (`queens/`), Picross Dex (`picross/`), Lignée (`lignee/`), Injagility (`injagility/`), Touché Coulé (`touche-coule/`), Amiral ! (`amiral/`, **on le laisse tel quel pour le moment**), Escadrille ! (`escadrille/`, avions dans `avions.js`, cahier des charges [`specs/escadrille.md`](specs/escadrille.md)), Le Club d'agility (`club/`), Orbite (`orbite/`), Lune-Rover (`lune-rover/`, règles et niveaux dans `regles.js`), Pont stellaire (`pont-stellaire/`), Sudoku (`sudoku/`), Calculator (`calculator/`, calcul mental, 3 styles), Alunissage (`alunissage/`), Nebula (`nebula/`, cahier des charges [`specs/nebula.md`](specs/nebula.md)), Empilage (`empilage/`, premier jeu en 3D, Three.js), Odyssée (`odyssee/`, deuxième jeu en 3D, règles et plateaux dans `regles.js`), Yams (`yams/`, troisième jeu en 3D, vrais dés avec cannon.js, 6 styles de dés), Tetris, Snake, Asteroids, Solitaire, Jeu de la vie. L'Île des naufragés a été retirée le 16/10 (la colonie la remplacera dans `ile/`). Détails de chaque jeu (classements, objets `window.<Jeu>` pour les tests) : tableau du mémo.

## En cours / à vérifier
- **Le Thé des Jarls** (17/10) : maquette jouable `maquettes/the-des-jarls.html` (https://claude.ai/artifact/JVCdwKwDpuyQuh4BVW3yq9) : A HD-2D, B diorama 3D avec vrais dés, C pixel 16 bits, plus l'écran à deux joueurs. Retour : A et B retenus, plus de détails voulus → 2e maquette `maquettes/the-des-jarls-2.html` (https://claude.ai/artifact/28nP1RqW7LD8rShRZh9i5k). Retour : 15 soldats « un peu vide » → 3e maquette `maquettes/the-des-jarls-3.html` (https://claude.ai/artifact/XRr9NuYqtwD29qdqhLC3eR) : 15 PV, 45 soldats par armée (3 par PV). **Choix : style A, 45 soldats** ; retour « décor pas cohérent, armées trop proches » → 4e maquette `maquettes/the-des-jarls-4.html` (https://claude.ai/artifact/Ew99jUKZM3iANjBmxHWBLz). **Attendre sa validation** avant la session 2 (règles dans `the-des-jarls/regles.js`, ordinateur, duel à deux), avec Opus. Cahier des charges : [`specs/the-des-jarls.md`](specs/the-des-jarls.md).
- **Yams** (17/10) : maquette `maquettes/yams.html` (https://claude.ai/artifact/CpDRWzgbWwWSH6PWNnwTUW), six styles gardés comme styles à débloquer (B de départ ; A finir une partie, D bonus de 35, C un Yams, F 200 pts, E 260 pts). Jeu fait en une session : `yams/index.html`, accueil, classement `best`, transfert. À essayer sur le téléphone (force du geste, gobelet, lisibilité des dés D, fluidité de la physique, classement avec un vrai record). Pas encore de partie à plusieurs ni de défi du jour (idées pour plus tard). Mesures du forfait : voir `IDEES.md`.
- **Armada** (17/10, survivor spatial : la flotte grossit et vole en formation) : DA de Nebula choisie ; maquettes `maquettes/armada.html` (https://claude.ai/artifact/QesFkKzq2XaBiDuQawc2L1) et `maquettes/armada-2.html` (https://claude.ai/artifact/MR2E43u7PazJpZfn8QcR2E). Cahier des charges [`specs/armada.md`](specs/armada.md) écrit, **à relire par l'utilisateur** (§ 18) ; ensuite session 1 (le moteur), avec Opus, dans une nouvelle conversation.
- **Nebula** : sessions 1 à 4 faites ; équilibrage jugé correct, à revoir après plus de parties. État détaillé dans le mémo, suivi dans [`specs/nebula.md`](specs/nebula.md) § 17 à 22. Prochain chantier possible : « Nebula : l'Empire des étoiles », dans une nouvelle conversation.
- **La colonie** (remplace l'Île des naufragés, décision du 16/10) : cahier des charges [`specs/colonie.md`](specs/colonie.md) ; maquette de l'écran en paysage faite le 16/10 (https://claude.ai/artifact/3CAZn4Hd3qFu2TMAB3i8LX, `maquettes/colonie-paysage.html`), **validée**. **Étape 2 (le moteur) faite et validée par l'utilisateur le 16/10** : `ile/regles.js` + `ile/index.html`, artefact republié au lien de la colonie, pilote `outils/ile-colonie.js` (réglages et décisions : `specs/colonie.md` § 12). Prochaine étape : la nature (crue, incendie, hiver rude, épidémie…), l'île du jour et l'intégration (accueil, classements, transfert), dans une nouvelle conversation. Pas encore sur l'accueil.
- **Odyssée** (ex-« La Bille », 17/10) : on penche le téléphone pour guider le bateau d'Ulysse jusqu'à Ithaque ; style C « mer Égée en 3D » de `maquettes/ulysse.html`. Cahier des charges et bilans : [`specs/odyssee.md`](specs/odyssee.md) (§ 10 session 1, § 11 session 2). **Sessions 1 et 2 faites (17/10)** : 10 épisodes × 3 plateaux, plateau du jour, classements (`etoiles`, `daily:`), accueil, transfert. Écran bloqué en portrait pendant la partie. Sons et musique (direction A « lyre et flûte », discrète) dans `odyssee/sons.js`. À essayer sur le téléphone (sensibilité, fluidité, difficulté, plateau du jour, sons, classement avec un vrai record).
- **Escadrille !** (17/10, pour le fils de l'utilisateur : « Amiral ! avec des avions ») : **session 1 faite (17/10)** : jeu complet avec la famille A (règles, IA aux 3 niveaux, écrans, sons et musique), accueil, classement `best:<niveau>`, transfert, fumée, artefact. Bilan : [`specs/escadrille.md`](specs/escadrille.md) § 7. **Session 2 faite (17/10)** : familles B, C, D, HANGAR, déblocages et annonce, pilote en parachute (pas de ciel du jour, décision de l'utilisateur) ; bilan § 8. À essayer sur le téléphone (fluidité, taille des cases, difficulté, classement avec un vrai record). **Retour du 17/10** : le ciel bleu fait penser à de l'eau → maquette de 3 sols qui défilent (https://claude.ai/artifact/BYKFBXASekDWZsWz8BYsLL, `maquettes/escadrille-sol.html`, sols dans `escadrille/sol.js` : A campagne, B forêts et montagnes, C désert et canyon), **choix de l'utilisateur : garder les 3, un sol tiré au hasard à chaque partie** (fait le 17/10) ; marge du bas ajoutée (zone sûre + 14 px), les menus touchaient le bas de l'écran.
- **Retour au menu dans les menus du jeu** (17/10) : fait pour Odyssée, le lot 1 (11 jeux à menus en HTML) le lot 2 (Alunissage, Orbite, Lune-Rover, Pont stellaire, Sudoku, Injagility ×2, Club) Nebula (en haut à gauche de l'écran titre) et Amiral ! (à côté de CLASSEMENT), le 17/10 : terminé. Artefacts de ces jeux pas republiés (rien de visible ne change dans un artefact) : le faire à leur prochaine vraie modification. Méthode : retirer la barre « ◀ MENU » du script commun en fin de page et ajouter le bouton dans les menus du jeu.
- **Empilage** (16/10) : premier jeu en 3D (Three.js), direction A de la maquette ; essayé sur le téléphone par l'utilisateur : « ça marche nickel ». Reste à confirmer le classement avec un vrai record.
- Orbite : niveaux 12, 23, 25, 28 et 30 les plus serrés ; à ajuster s'ils sont trop durs.
- Lune-Rover (16/10) : 30 niveaux, graphismes refaits dans le style « dessin animé » validé (maquette `maquettes/lune-rover-c.html` : Pico le rover, carte des niveaux en chemin, polices Luckiest Guy et Fredoka dans `polices/`). À essayer aussi sur le téléphone : taille des cases du programme, difficulté des niveaux 22 à 30.
- Calculator (16/10) : à essayer sur le téléphone (taille du pavé, difficulté des niveaux, les trois styles).
- Classements testés seulement avec le faux serveur, à confirmer avec un vrai record : Escadrille ! (`best:<niveau>`), Odyssée (`etoiles`, `daily`), Calculator, Lune-Rover, Orbite, Pont stellaire, Sudoku, grille du jour de Queens, Nebula (`daily`, `victoires`).

## Idées et maquettes
Les jeux futurs, les maquettes de style et le classement des idées par quantité de travail sont dans [`IDEES.md`](IDEES.md).

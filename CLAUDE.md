# Ludothèque 16 bits — consignes pour Claude

## Le projet
- Dépôt GitHub : **Tirashi/Claude**. Site publié : **https://tirashi.github.io/Claude/** (installé en appli PWA sur Android).
- Jeux en HTML **sans build** (le fichier poussé est celui que joue le téléphone), un dossier par jeu ; `index.html` = l'accueil (menu aux cartouches, volet de chaque jeu avec ses records et son classement ; ce que l'accueil sait d'un jeu est dans sa **fiche** `<dossier>/fiche.js`). Un gros jeu peut se répartir en **scripts classiques** (`<script src>`, pas de modules ES ni de npm).
- Service worker `sw.js` : quand on ajoute ou renomme un fichier, l'ajouter à `FILES` et changer `VERSION` (`ludotheque-v89` au moment d'écrire ces lignes).
- Fichiers partagés : `ludo-scores.js` (classements Supabase), `icones.js` (icônes 16×16), **`commun/`** (code partagé entre plusieurs jeux : `pixel32.js` = moteur de pixel art 32 bits, chiens et volumes ombrés, `window.Chiens32` ; `vaisseaux.js` = vaisseaux en relief de Nebula, `window.NebulaVaisseaux`), `lib/three.min.js` (Three.js r128, pour les jeux en 3D), `lib/cannon.min.js` (cannon.js 0.6.2, physique des dés du Yams), polices dans `polices/`, **`moteur-rpg/`** (moteur RPG réutilisable, `window.MoteurRPG`, cahier des charges [`specs/rpg.md`](specs/rpg.md) § 12).
- **Mémo technique : [`specs/ludotheque.md`](specs/ludotheque.md)** — architecture (accueil, classements, code de compte, transfert `LUDO1-`), **liste de contrôle pour ajouter un jeu**, leçons et détails de chaque jeu. **Le lire avant** d'ajouter un jeu, de toucher à l'accueil, aux classements ou à un fichier partagé, ou de reprendre un jeu.

## Règles de travail
- Répondre **en français**.
- **Maquette d'abord** (règle de l'utilisateur, 16/10) : avant de programmer un nouveau jeu ou de refaire les graphismes d'un jeu, faire une petite maquette (artefact, dans `maquettes/`, 2 ou 3 directions sur un écran de téléphone) et **attendre que l'utilisateur la valide** ; on ne programme qu'ensuite, d'après la direction choisie.
- Développer et pousser **uniquement sur la branche de travail** de la session. Ne pousser sur `main` **que quand l'utilisateur dit « mets à jour main »**, en avance rapide uniquement (marche à suivre : skill `mettre-a-jour-main`).
- **Branches** (règle du 04/11) : `node outils/branches.js --fetch` classe les branches de GitHub (✅ fusionnée, 🟡 reprise, ❌ abandonnée, ⚠️ en attente = travail absent de main) ; le lancer en reprenant un chantier et avant « mets à jour main », et signaler les ⚠️. Une idée qui ne donne rien : par défaut ses maquettes vont quand même sur main (ligne ❌ ou ⏸ dans `IDEES.md`) ; si on ne garde rien, une ligne `nom | date | raison` dans `outils/branches-abandonnees.txt` (sur main). Quand l'utilisateur dit « fais le ménage des branches » : lancer le workflow `menage-branches.yml` avec `supprimer` (outil `mcp__github__actions_run_trigger`) ; il pose une étiquette `archive/<branche>` avant chaque suppression et ne touche jamais à main ni aux ⚠️. Détails dans le mémo.
- Messages de commit en français, écrits dans un fichier puis `git commit -F`.
- Après chaque modification d'un jeu, **republier son artefact** (copie fabriquée par `python3 outils/artefact.py`) **au même lien** (skill `republier-artefact`) et donner le lien.
- Tests ([`outils/`](outils/README.md)) : en local, seulement `node outils/verifications.js` avant chaque push (rapide, sans navigateur). **`fumee.js`, `logique.js` et `lint.js` sont laissés à la CI** (décision de l'utilisateur du 19/10, pour économiser des jetons) : les lancer en local seulement pour déboguer un échec. Après le push, regarder le résultat de la CI (onglet *Actions*, ou les outils GitHub) **avant de mettre à jour `main`**. Captures Playwright seulement quand c'est utile.
- **Sécurité** : ne jamais demander, stocker ni committer la clé secrète Supabase ni le mot de passe de la base. Seules l'URL publique `https://hfoiofrgltzdyetoqpjc.supabase.co` et la clé publiable `sb_publishable_6nlzAAAG3LLLonztigio4g_0Q6dakQE` sont dans le code. Le **code familial ne doit jamais être dans le dépôt** (le SQL garde `MON-CODE`).
- **Retour au menu de la Ludothèque** (règle de l'utilisateur, 17/10) : plus de bouton noir « ◀ MENU » ajouté en permanence par-dessus le jeu ; le retour se fait **dans les menus du jeu** (écran titre, pause…), dans le style du jeu. Fait pour tous les jeux. En HTML, le bouton porte la classe `ludo-retour` ; dans un canvas, il n'est dessiné que si `!window.ludoArtefact` (les deux sont gérés par `outils/artefact.py`).
- **Crédits** (règle de l'utilisateur, 22/10) : toute ressource venue d'ailleurs (graphismes, sons, musiques, polices, bibliothèques, listes de mots) est citée **dès qu'on l'ajoute** dans la page [`credits/index.html`](credits/index.html) (lien en bas de l'accueil) : nom, créateur, licence, **lien vers l'endroit où on l'a prise**, jeux qui l'utilisent.
- Accessibilité : « pas pour le moment ».
- **Économie de tokens** (règle du 16/10, assouplie le 20/10) : on peut rester dans la même conversation d'un chantier à l'autre en **compactant le contexte** (`/compact`) au lieu de tout recommencer ; une nouvelle conversation reste utile pour changer de modèle (gros moteur → Opus) ; demandes précises ; peu de captures ; pas de sous-agents ; lire les fichiers par morceaux plutôt qu'en entier. Choix du modèle :
  | Chantier | Modèle |
  |---|---|
  | Retouche, texte, doc, petite correction | Sonnet |
  | Maquette de style, discussion d'idées | Sonnet (Opus pour une décision importante) |
  | Fonctionnalité ou jeu moyen bien défini (ex. Lune-Rover) | opusplan (Opus fait le plan, Sonnet écrit le code) |
  | Gros moteur emmêlé (Nebula, la colonie, Défense orbitale) | Opus du début à la fin |
- Forfait : limite hebdomadaire remise à zéro le mercredi à 19 h ; petits chantiers plutôt en fin de semaine.

## Skills du projet (`.claude/skills/`) et idées
Lues seulement quand on en a besoin : `ajouter-un-jeu`, `republier-artefact` (**liens des artefacts** et façon de les republier ; un jeu sans lien connu : demander le lien à l'utilisateur avant d'en créer un nouveau), `mettre-a-jour-main`, `packs-itch` (télécharger des packs sur itch.io, compacter des modèles glTF, captures Playwright).
Jeux futurs, maquettes de style et classement des idées par quantité de travail : [`IDEES.md`](IDEES.md).

## Tenir la documentation à jour
**Cycle d'un projet** (règle du 30/10) : **idée** = quelques lignes en vrac dans `IDEES.md` ; dès qu'on la travaille (maquette, boucle de jeu, décisions), elle devient un **chantier** avec son fichier `specs/<projet>.md`, et `IDEES.md` ne garde qu'une ligne qui y renvoie ; ce fichier devient ensuite le cahier des charges du **jeu**. Les anciens passages détaillés d'`IDEES.md` sont déplacés de la même façon quand on reprend le projet. Ne rien effacer : un projet abandonné garde une ligne (❌ et la raison).

À chaque chantier, quand c'est pertinent : `CLAUDE.md` (nouvelle règle, version du cache, nouveau jeu, lien d'artefact, **une ligne** dans « En cours ») ; `specs/suivi.md` (détails du chantier ; un fichier d'archive par mois fini dans `specs/suivi/`) ; `specs/ludotheque.md` (détails techniques, leçons, tableau des jeux) ; **`<dossier>/CLAUDE.md` d'un gros jeu** (fichiers, tests, pièges : moins de 2 Ko, lu tout seul quand on travaille dans ce dossier ; ont le leur : `nebula/`, `ile/`, `resistance/`, `lanterne/`, `moteur-rpg/`, `mineur-de-l-espace/`, `bannieres/`, `boutique/`, `the-des-jarls/`, `duche/`, `doggy-saga/`) ; `IDEES.md` (✅, nouvelles idées et maquettes, préférences) ; `README.md` (description pour les joueurs).

## Leçons apprises (générales)
- **Défis du jour** (règle de l'utilisateur, 15/10) : une seule tentative classée par jour ; tentative sauvegardée à part et reprise au même temps (puzzles) ou comptée dès le départ (missions). Détails par jeu dans le mémo. À appliquer à tout nouveau défi du jour.
- La police **Press Start 2P n'a pas de majuscules accentuées** : écrire les textes en MAJUSCULES sans accent (ETOILES, REESSAYER…).
- **Supabase n'est pas joignable** depuis l'environnement de Claude (proxy 403) : tester avec `outils/faux-classements.js`, puis demander un essai réel sur le téléphone.
- **Tests instables** : un test qui joue contre une IA au hasard vérifie juste après l'action du joueur, pas après le tour de l'ordinateur (détails dans le mémo, leçon d'Amiral ! du 20/10).
- Playwright : changer seulement l'ancre (`#…`) ne recharge pas la page (repasser par `about:blank`) ; dans `page.evaluate`, les `const` et fonctions de haut niveau d'un jeu sont accessibles.

## Les jeux
Queens `queens/`, Picross Dex `picross/`, Lignée `lignee/`, Injagility `injagility/`, Touché Coulé `touche-coule/`, Amiral ! `amiral/`, Escadrille ! `escadrille/`, Le Club d'agility `club/`, Orbite `orbite/`, Lune-Rover `lune-rover/`, Pont stellaire `pont-stellaire/`, Sudoku `sudoku/`, Calculator `calculator/`, Alunissage `alunissage/`, Nebula `nebula/`, Empilage `empilage/`, Odyssée `odyssee/`, Yams `yams/`, Le Magasinier `magasinier/`, Capitaine du port `capitaine-du-port/`, Le Thé des Jarls `the-des-jarls/`, Duché `duche/`, Bannières `bannieres/`, Dragon Simulator `dragon-simulator/`, Romet `romet/`, Doggy Saga `doggy-saga/`, La Boutique de cartes `boutique/`, Mineur de l'espace `mineur-de-l-espace/`, Le Mot d'or `mot-d-or/`, La Dernière Lanterne `lanterne/` (**démo** sur l'accueil : `demo: true` dans sa fiche), Résistance `resistance/`, Tetris, Snake, Asteroids, Solitaire, Jeu de la vie (dossiers du même nom) ; la colonie viendra dans `ile/`. Fichiers, objets `window.<Jeu>`, simulateurs, cahiers des charges : **tableau de [`specs/ludotheque.md`](specs/ludotheque.md)**.

## En cours / à vérifier
Une phrase par chantier ; le détail est dans le cahier des charges du jeu et dans [`specs/suivi.md`](specs/suivi.md) (mois en cours ; octobre dans [`specs/suivi/2026-10.md`](specs/suivi/2026-10.md)) : y ajouter les nouveautés.
- **Rangement** (05/11) : fini (phases 0 à 6) ; chaque jeu a sa fiche `<dossier>/fiche.js` lue par l'accueil ([plan](specs/plan-rangement.md)). À essayer sur le téléphone : accueil, volets, export/import.
- **Amiral !**, **Escadrille !**, **Thé des Jarls**, **Capitaine du port**, **Mot d'or**, **Magasinier** : finis, à essayer sur le téléphone (artefact d'Escadrille ! pas republié).
- **Duché**, **Bannières**, **Boutique**, **Doggy Saga**, **Romet**, **Résistance** : validés ; Résistance : autres pays plus tard ([cdc](specs/resistance.md)).
- **La Dernière Lanterne** : actes 1 à 3 faits ; prochaine étape session 5 (acte 4, final), opusplan ([cdc](specs/rpg.md)).
- **Mineur de l'espace** : fini, sur l'accueil ; à essayer sur le téléphone et au PC ([cdc](specs/mineur-de-l-espace.md)).
- **Dragon Simulator** : fini ; à essayer (prix du nid à doubler si trop rapide) ([cdc](specs/dragon-simulator.md)).
- **Défense aérienne** : maquette 1 à choisir ([cdc](specs/defense-aerienne.md)). **Armada** : cdc à relire (§ 18), puis session 1, Opus ([cdc](specs/armada.md)). **Défense orbitale** : session 1 (combat), Opus ([cdc](specs/defense-orbitale.md)).
- **La colonie** : reste nature, île du jour, intégration ([cdc](specs/colonie.md)). **Nebula** : prochain chantier possible « l'Empire des étoiles » ([cdc](specs/nebula.md)).
- **En pause** : Ferme du vallon (attend les zips du pack, [cdc](specs/ferme-du-vallon.md)), Clan du fjord ([cdc](specs/clan.md)), tactique façon Advance Wars, petite usine ; autres idées et achats : [`IDEES.md`](IDEES.md).
- **Artefacts** pas republiés depuis le retour au menu : à leur prochaine vraie modification (sauf Yams). Essais du 29/10 : tout confirmé ([essais](specs/essais.md)).

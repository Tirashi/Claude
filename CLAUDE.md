# Ludothèque 16 bits — consignes pour Claude

## Le projet
- Dépôt GitHub : **Tirashi/Claude**. Site publié : **https://tirashi.github.io/Claude/** (installé en appli PWA sur Android).
- Jeux en HTML **sans build** (le fichier poussé est celui que joue le téléphone), un dossier par jeu ; `index.html` = l'accueil (menu aux cartouches, volet de chaque jeu avec ses records et son classement). Un gros jeu peut se répartir en **scripts classiques** (`<script src>`, pas de modules ES ni de npm).
- Service worker `sw.js` : quand on ajoute ou renomme un fichier, l'ajouter à `FILES` et changer `VERSION` (`ludotheque-v43` au moment d'écrire ces lignes).
- Fichiers partagés : `ludo-scores.js` (classements Supabase), `icones.js` (icônes 16×16), `injagility/chiens32.js` (chiens 32 bits), `nebula/vaisseaux.js`, `nebula/regles.js`, `nebula/sons.js`, `ile/regles.js` (règles de la colonie), `lib/three.min.js` (Three.js r128, pour les jeux en 3D), `lib/cannon.min.js` (cannon.js 0.6.2, physique des dés du Yams), polices dans `polices/`.
- **Mémo technique : [`specs/ludotheque.md`](specs/ludotheque.md)** — architecture détaillée (accueil, classements, code de compte, transfert `LUDO1-`), **liste de contrôle pour ajouter un jeu**, leçons propres à chaque jeu, détails de chaque jeu. **Le lire avant** d'ajouter un jeu, de toucher à l'accueil, aux classements ou à un fichier partagé, ou de reprendre un jeu.

## Règles de travail
- Répondre **en français**.
- **Maquette d'abord** (règle de l'utilisateur, 16/10) : avant de programmer un nouveau jeu ou de refaire les graphismes d'un jeu, faire une petite maquette (artefact, dans `maquettes/`, 2 ou 3 directions sur un écran de téléphone) et **attendre que l'utilisateur la valide** ; on ne programme qu'ensuite, d'après la direction choisie.
- Développer et pousser **uniquement sur la branche de travail** de la session. Ne pousser sur `main` **que quand l'utilisateur dit « mets à jour main »**, en avance rapide uniquement :
  `git fetch origin main && git merge-base --is-ancestor origin/main HEAD && git push origin HEAD:main`
- Messages de commit en français, écrits dans un fichier puis `git commit -F`.
- Après chaque modification d'un jeu, **republier son artefact** (copie fabriquée par `python3 outils/artefact.py`) **au même lien** (tableau ci-dessous) et donner le lien.
- Tests ([`outils/`](outils/README.md)) : en local, seulement `node outils/verifications.js` avant chaque push (rapide, sans navigateur). **`fumee.js`, `logique.js` et `lint.js` sont laissés à la CI** (décision de l'utilisateur du 19/10, pour économiser des jetons) : les lancer en local seulement pour déboguer un échec. Après le push, regarder le résultat de la CI (onglet *Actions*, ou les outils GitHub) **avant de mettre à jour `main`**. Captures Playwright seulement quand c'est utile.
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
À chaque chantier, quand c'est pertinent : `CLAUDE.md` (nouvelle règle, version du cache, nouveau jeu, lien d'artefact, **une ligne** dans « En cours ») ; `specs/suivi.md` (détails du chantier) ; `specs/ludotheque.md` (détails techniques, leçons, tableau détaillé des jeux) ; `IDEES.md` (✅, nouvelles idées et maquettes, préférences) ; `README.md` (description pour les joueurs).

## Leçons apprises (générales)
- **Défis du jour** (règle de l'utilisateur, 15/10) : une seule tentative classée par jour ; tentative sauvegardée à part et reprise au même temps (puzzles) ou comptée dès le départ (missions). Détails par jeu dans le mémo. À appliquer à tout nouveau défi du jour.
- La police **Press Start 2P n'a pas de majuscules accentuées** : écrire les textes en MAJUSCULES sans accent (ETOILES, REESSAYER…).
- **Supabase n'est pas joignable** depuis l'environnement de Claude (proxy 403) : tester avec `outils/faux-classements.js`, puis demander un essai réel sur le téléphone.
- **Tests instables** : un test qui joue contre une IA au hasard vérifie juste après l'action du joueur, pas après le tour de l'ordinateur (détails dans le mémo, leçon d'Amiral ! du 20/10).
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
| Le Magasinier | https://claude.ai/artifact/Uahoa9oJi7L8KFbNxj9TPX |
| Capitaine du port | https://claude.ai/artifact/7vRaNExcDvmDWeWGLeFsyq |

Queens, Sudoku, Touché Coulé, Tetris, Snake, Asteroids, Solitaire, le Jeu de la vie et Odyssée **n'ont pas d'artefact** : on les joue sur le site. Ne pas en créer sans demande.

## Les jeux
Queens (`queens/`), Picross Dex (`picross/`), Lignée (`lignee/`), Injagility (`injagility/`), Touché Coulé (`touche-coule/`), Amiral ! (`amiral/`, chantier naval de 11 navires, bataille du jour), Escadrille ! (`escadrille/`, avions dans `avions.js`, cahier des charges [`specs/escadrille.md`](specs/escadrille.md)), Le Club d'agility (`club/`), Orbite (`orbite/`), Lune-Rover (`lune-rover/`, règles et niveaux dans `regles.js`), Pont stellaire (`pont-stellaire/`), Sudoku (`sudoku/`), Calculator (`calculator/`, calcul mental, 3 styles), Alunissage (`alunissage/`), Nebula (`nebula/`, cahier des charges [`specs/nebula.md`](specs/nebula.md)), Empilage (`empilage/`, premier jeu en 3D, Three.js), Odyssée (`odyssee/`, deuxième jeu en 3D, règles et plateaux dans `regles.js`), Yams (`yams/`, troisième jeu en 3D, vrais dés avec cannon.js, 6 styles de dés), Le Magasinier (`magasinier/`, Sokoban en HD-2D, quatrième jeu en 3D, 60 niveaux et grille du jour), Capitaine du port (`capitaine-du-port/`, Rush Hour de bateaux en pixel art 32 bits, 60 bassins et bassin du jour), Le Mot d'or (`mot-d-or/`, mot du jour façon Wordle sur un bureau du soir, mots dans `mots.js` fabriqué par `outils/mot-d-or-mots.js`), Tetris, Snake, Asteroids, Solitaire, Jeu de la vie. L'Île des naufragés a été retirée le 16/10 (la colonie la remplacera dans `ile/`). Fichiers : `index.html` + `jeu.js` (+ `style.css`) par jeu, `accueil.js`/`accueil.css` pour l'accueil. Détails de chaque jeu (classements, objets `window.<Jeu>` pour les tests) : tableau du mémo.

## En cours / à vérifier
Une ligne par chantier ; détails et historique dans [`specs/suivi.md`](specs/suivi.md) (à tenir à jour avec la ligne d'ici).
- **Amiral !** : sessions 1 et 2 faites (mines, fumée, leurre, déblocages, bataille du jour) ; à essayer sur le téléphone. [`specs/amiral.md`](specs/amiral.md)
- **Escadrille !** : sessions 1, 2 et **lot 2 faits** (19/10 : 10 avions au hangar, 6 à débloquer, 4 familles) ; à essayer sur le téléphone ; **lot 1 fait** (19/10 : hauteur, polices, flèches, FEU !) ; artefact pas republié (190 Ko à relire). [`specs/escadrille.md`](specs/escadrille.md) § 10
- **Le Thé des Jarls** : maquette 4 validée (style A, 45 soldats) ; prochaine étape session 2 (règles, ordinateur, duel), Opus. [`specs/the-des-jarls.md`](specs/the-des-jarls.md)
- **Capitaine du port** : maquette dans la DA 32 bits de la planche des coups de cœur, plein jour choisi, polices d'Amiral ! (20/10, https://claude.ai/artifact/GXnCqj89iVvxUbDfcr3urg), **validée** (remorqueur décoratif, 7 × 7 au dernier port) ; **fini** (20/10, sessions 1 et 2 : 60 bassins en 5 ports, bassin du jour, sons, classements, accueil) ; à essayer sur le téléphone ; artefact créé (https://claude.ai/artifact/7vRaNExcDvmDWeWGLeFsyq). [`specs/capitaine-du-port.md`](specs/capitaine-du-port.md)
- **Le Mot d'or** : **fini** (20/10 : maquette 2 validée, 718 mots du jour, entraînement, dictionnaire de 13 900 mots, classements, accueil) ; à essayer sur le téléphone ; artefact à créer (lien à demander). [`specs/mot-d-or.md`](specs/mot-d-or.md)
- **Le Magasinier** : **fini** (20/10 : 60 niveaux, grille du jour, classements, accueil) ; à essayer sur le téléphone ; artefact créé (Three.js chargé depuis cdnjs, voir le mémo). [`specs/magasinier.md`](specs/magasinier.md)
- **Duché** (gestion et conquête, 6 × 6 terres, 3 rivaux, couronne) : cahier des charges remis au standard (20/10) ; maquette https://claude.ai/artifact/TGCRiKYw1FyA8WUmBxUiw5 **à valider** (A, B ou C, questions du § 15) ; puis 3 sessions, Opus. [`specs/duche.md`](specs/duche.md)
- **Armada** : cahier des charges **à relire par l'utilisateur** (§ 18), puis session 1, Opus. [`specs/armada.md`](specs/armada.md)
- **Défense orbitale** : maquette 4 validée (direction A, réaliste) ; cahier des charges écrit et validé (19/10) ; prochaine étape **session 1** (le combat), Opus. [`specs/defense-orbitale.md`](specs/defense-orbitale.md)
- **La colonie** : moteur fait ; reste la nature, l'île du jour et l'intégration (pas encore sur l'accueil). [`specs/colonie.md`](specs/colonie.md)
- **Nebula** : sessions 1 à 4 faites ; prochain chantier possible « l'Empire des étoiles ». [`specs/nebula.md`](specs/nebula.md)
- **Accueil retouché** (19/10) : choix C de `maquettes/accueil-retouche.html`, installé ; à voir sur le téléphone. [`specs/suivi.md`](specs/suivi.md)
- **À essayer sur le téléphone** : Yams (geste, physique, affichage au repos), Odyssée, Escadrille !, Amiral !, Calculator, Lune-Rover (niveaux 22 à 30), marque du défi du jour sur l'accueil ; Orbite : niveaux 12, 23, 25, 28, 30 peut-être trop durs.
- **Classements à confirmer avec un vrai record** : Le Mot d'or (`daily:`, `serie`), Capitaine du port (`etoiles`, `daily:`), Le Magasinier (`etoiles`, `daily:`), Amiral ! (`daily:`), Escadrille !, Odyssée, Calculator, Lune-Rover, Orbite, Pont stellaire, Sudoku, Queens (grille du jour), Nebula (`daily`, `victoires`), Empilage.
- **Artefacts** pas republiés après le retour au menu (rien de visible) : le faire à leur prochaine vraie modification. **Yams** : artefact pas republié après l'affichage au repos du 19/10 (760 Ko à relire, trop cher) : à republier avec sa prochaine vraie modification.

## Idées et maquettes
Les jeux futurs, les maquettes de style et le classement des idées par quantité de travail sont dans [`IDEES.md`](IDEES.md).

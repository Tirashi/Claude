# Ludothèque 16 bits — consignes pour Claude

## Le projet
- Dépôt GitHub : **Tirashi/Claude**. Site publié : **https://tirashi.github.io/Claude/** (installé en appli PWA sur Android).
- Jeux en HTML **sans build** (le fichier poussé est celui que joue le téléphone), un dossier par jeu. La page d'accueil `index.html` est le menu. Un petit jeu tient dans son `index.html` ; un gros jeu peut se répartir en **scripts classiques** (`<script src>`, pas de modules ES, pas de dépendances npm) : `outils/artefact.py` les intègre tous dans l'artefact, et chacun va dans `FILES` de `sw.js`.
- Service worker `sw.js` (mode hors connexion) : quand on ajoute ou renomme un fichier, l'ajouter à `FILES` et changer `VERSION` (`ludotheque-v23` au moment d'écrire ces lignes). Réseau d'abord, mais copie en cache servie si le réseau ne répond pas en 2,5 s.
- Polices hébergées dans `polices/` (Nebula : `polices/nebula.css`, lien Google gardé dans `data-google` pour l'artefact) ; les autres jeux utilisent encore Google Fonts.
- Moteur de sprites 32 bits partagé : `injagility/chiens32.js` (volumes ombrés, 6 races de chiens).
- Icônes 16×16 des jeux : `icones.js` (`LudoIcons.draw`, `LudoIcons.paint`), partagé par l'accueil (cartouches) et la page des classements (étagère de boîtes : apparence de chaque jeu dans `LOOK`, à compléter pour un nouveau jeu).
- Moteur de vaisseaux en relief de Nebula : `nebula/vaisseaux.js` (22 vaisseaux et 2 mines, astéroïdes, nébuleuse, planètes ; sprites fabriqués à la demande), réutilisé par l'Empire. Règles de Nebula (logique pure, sans affichage, utilisable sous Node) : `nebula/regles.js` ; textes des épaves et nébuleuses (données seulement) : `nebula/evenements.js` ; sons (bruitages synthétisés étouffés, bips, saut, ambiances génératives Tension et Marche, mixées ~15 dB sous les bruitages par `AMB_GAIN`) : `nebula/sons.js` (`NebulaSons`), aussi utilisé par le banc d'écoute `maquettes/nebula-sons.html`.
- Classements en ligne : `ludo-scores.js` + page `classements/index.html`, base Supabase (scripts dans `supabase/`). Égalités classées 1, 2, 2, 4. Les records déjà présents sont envoyés une fois à l'inscription.
- Code de transfert de sauvegarde (export/import `LUDO1-…`) dans `index.html` : chaque nouveau jeu doit y être ajouté (collecte, description, fusion).

## Règles de travail
- Répondre **en français**.
- Développer et pousser **uniquement sur la branche de travail** de la session. Ne pousser sur `main` **que quand l'utilisateur dit « mets à jour main »**, en avance rapide uniquement :
  `git fetch origin main && git merge-base --is-ancestor origin/main HEAD && git push origin HEAD:main`
- Messages de commit en français, écrits dans un fichier puis `git commit -F`.
- Après chaque modification d'un jeu, **republier son artefact** (copie avec `chiens32.js` intégré, sans `ludo-scores.js`, fabriquée par `python3 outils/artefact.py`) **au même lien** (voir « Artefacts des jeux ») et donner le lien.
- Tester avec Playwright (captures sur un écran de téléphone) avant de pousser : scripts prêts dans [`outils/`](outils/README.md). Avant chaque push : `node outils/verifications.js` (syntaxe, `sw.js`, sécurité, icônes, simulateur Nebula, types de `nebula/regles.js` par `tsc`) ; après une modification d'un jeu : `node outils/fumee.js`. La CI GitHub (`.github/workflows/verifications.yml`) relance les deux à chaque push sur `main`, `claude/**` et `ccr-*` (branches de travail des sessions) : regarder l'onglet *Actions* avant de mettre à jour `main`.
- **Sécurité** : ne jamais demander, stocker ni committer la clé secrète Supabase ni le mot de passe de la base. Seules l'URL publique `https://hfoiofrgltzdyetoqpjc.supabase.co` et la clé publiable `sb_publishable_6nlzAAAG3LLLonztigio4g_0Q6dakQE` sont dans le code. Le **code familial ne doit jamais être dans le dépôt** (le SQL garde `MON-CODE`).
- Accessibilité : « pas pour le moment ».
- Économie : une conversation par chantier, Sonnet pour réfléchir et les petites retouches, Opus pour coder un jeu ; éviter les sous-agents et les captures inutiles.

## Tenir la documentation à jour
**À chaque chantier, penser à mettre à jour quand c'est pertinent :**
- `CLAUDE.md` (ce fichier) : nouvelle règle donnée par l'utilisateur, nouveau jeu dans le tableau, changement d'état d'un jeu, version du cache, nouveau fichier partagé…
- `IDEES.md` : marquer une idée comme réalisée (✅), ajouter les nouvelles idées et les nouvelles maquettes (liens d'artefacts), noter les préférences exprimées.
- `README.md` : description du jeu pour les joueurs (liste du haut, section dédiée, transfert de sauvegardes, classements).

## Ajouter un nouveau jeu (liste de contrôle)
1. **Le jeu** : `<dossier>/index.html` autonome. Gabarit des jeux 32 bits (copier `orbite/index.html` ou `pont-stellaire/index.html`) : canvas 272×480 pixels logiques agrandi sans lissage (`resize()`), police Press Start 2P, boutons dessinés dans le canvas (`BTN`), sauvegarde `localStorage` préfixée `<jeu>.`, `<script src="../ludo-scores.js">`, et en fin de page le script commun « Ludothèque » (service worker + bouton ◀ MENU dans l'appli). Exposer un objet `window.<Jeu>` pour les tests.
2. **Menu** `index.html` : une cartouche `<a class="cart <classe>">` (couleurs `.cart.<classe>{--lb; --lt; --ld}`), une icône 16×16 dans `ICONS` de `icones.js` (lignes de 16 caractères exactement ; partagé avec la page des classements), une entrée dans `META` (date `added`, `genres` pour les filtres ; le dernier sorti passe « à la une ») et une ligne dans `NEWS` (quoi de neuf). Si le jeu garde une partie en cours ou un record, l'ajouter à `PROGRESS` / `RECORD` (étiquettes des cartouches et filtre EN COURS). Une mise à jour visible d'un jeu : changer son `updated` (badge MIS A JOUR 3 jours) et ajouter une ligne à `NEWS`.
3. **Transfert de sauvegarde** `index.html` : `collectSaves()` (collecte), `describeSaves()` (description), `mergeSaves()` (fusion qui garde le meilleur de chaque côté).
4. **Classements** `ludo-scores.js` : envoi dans le jeu par `LudoScores.submit(jeu, tableau, valeur, plusBasGagne)` ; records existants dans `registerExisting` ; un tableau dans `PSEUDO_BOARDS` ; **incrémenter `SYNC`** pour que les joueurs déjà inscrits envoient leurs anciens records. Noms : jeu `^[a-z0-9_-]{1,24}$`, tableau `^[A-Za-z0-9_:.-]{1,40}$` (contraintes de la base).
5. **Page des classements** `classements/index.html` : une entrée dans `GAMES` (vues, réglages `ctl`, format `fmt` ; `T` = temps en ms) et une dans `LOOK` (icône et couleurs de la boîte).
6. **`sw.js`** : ajouter le fichier à `FILES` et changer `VERSION`.
7. **Docs** : `README.md`, ce fichier (tableau des jeux, artefact), `IDEES.md` (✅).
8. **Tests** (`outils/`), commit, push sur la branche, **artefact** publié et noté ci-dessous.

## Leçons apprises
- **Défis du jour** (règle de l'utilisateur, 15/10) : une seule tentative classée par jour, contre la triche en rejouant une grille dont on connaît la solution. Puzzles (Queens, Pont stellaire) : la tentative du jour est sauvegardée à part avec son chrono (`queens16.dailyRun`, `pontstellaire.dailyRun`) et reprise au même temps ; une fois réussie, le jour se rejoue hors classement. Missions (Alunissage `alunissage.dailyTry`, Nebula `nebula.dailyTry`) : la tentative compte dès le départ. Lignée : un arbre déjà reconstitué se rejoue hors classement. À appliquer à tout nouveau défi du jour.
- Nebula : `txt()` resserre tout seul un texte trop large pour l'écran (sur le téléphone, les polices sont un peu plus larges que dans Playwright, et l'espacement des lettres n'est pas compté par le navigateur : `txt()` l'ajoute lui-même) ; pour une longue phrase dans un cadre, passer `maxW` ou couper en deux lignes ; la cartouche du menu est une image (`nebula/cartouche.jpg`, capture de l'écran titre). Fluidité : agrandir une grande image à chaque trame coûte très cher au téléphone ; les fonds et le décor du combat sont agrandis une fois à la taille réelle de l'écran (`drawBg`, `drawStatic`), la résolution est plafonnée à 2 pixels par pixel logique, les lueurs des réacteurs sont pré-dessinées et les portées calculées seulement quand un vaisseau bouge. Netteté : sur ordinateur (pas d'écran tactile), sprites, astéroïdes et nébuleuse en double définition (`NebulaVaisseaux.setScale(2)`) et canvas aligné sur les vrais pixels ; sur téléphone, définition simple pour rester léger.
- La police **Press Start 2P n'a pas de majuscules accentuées** (« É » s'affiche « é ») : écrire les textes en MAJUSCULES sans accent (ETOILES, REESSAYER…). Les minuscules accentuées s'affichent bien.
- **Supabase n'est pas joignable** depuis l'environnement de Claude (proxy 403) : tester les classements avec `outils/faux-classements.js`, puis demander à l'utilisateur un essai réel sur son téléphone.
- Playwright : changer seulement l'ancre (`#…`) ne recharge pas la page ; repasser par `about:blank`.
- Dans `page.evaluate`, les `const` et fonctions de haut niveau d'un jeu sont accessibles (`S`, `gameOver()`…) : pratique pour simuler une fin de partie.
- Nebula : les constantes et fonctions de `regles.js` sont partagées avec le script de la page (scripts classiques = même portée globale) ; ne pas y toucher au DOM ni au `localStorage`. Partie sauvegardée : `RUN_V` + `migrate()` dans `regles.js` (monter `RUN_V` et compléter les anciennes parties quand on ajoute un champ) ; une partie illisible est mise de côté dans `nebula.run.bak`. Une erreur affiche l'écran INCIDENT au lieu de figer le jeu.
- Orbite : un niveau n'est jouable au doigt que s'il a des tirs « robustes » (±1°, ±2 %) ; `outils/orbite-solveur.js` les compte.

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
| Pont stellaire | https://claude.ai/artifact/Twgkpb1scdCh2Th6Nh35bF |
| Alunissage | https://claude.ai/artifact/2TgrmzSKuzoyPHYufyHrWh |
| Nebula | https://claude.ai/artifact/EPDtjTHPDsCnYKjtHCuxwY |
| L'Île des naufragés | https://claude.ai/artifact/9AnNRRCCBu4pgYh35UwrPb |

Queens, Touché Coulé, Tetris, Snake, Asteroids, Solitaire et le Jeu de la vie **n'ont pas d'artefact** : on les joue sur le site (https://tirashi.github.io/Claude/). Ne pas en créer sans demande. Les maquettes de style sont listées dans `IDEES.md`.

## En cours / à vérifier
- **Nebula** : sessions 1 à 4 faites (suivi et bilans dans [`specs/nebula.md`](specs/nebula.md) § 17 à 22). Session 4 « Flotte et défis » (bilan § 22) : flotte de départ à points (`FLEET_COST`, budget 10, 4 vaisseaux, prime d'audace +10 %/point plafonnée à +50 %, modèles `FLEETS`), défis de combat (`GOALS`) et contrats de partie (`CONTRACTS`), missions du jour (`MISSIONS`, vaisseau à protéger `vip`), brouilleur, mouilleur de mines, frégate-bouclier, poseur de mines et mines (`st.mines`, `triggerMines`), arrivée de la flotte par le bas au début d'un combat, sound design refait dans `nebula/sons.js` (préférences : armes discrètes et étouffées comme à travers la coque, pas « jouet » ni cliché ; bips discrets ; saut façon Helldivers 2 ; Tension II en combat, Garde sur la carte ; défaite B). L'utilisateur juge l'équilibrage correct pour l'instant : à revoir après plus de parties (coûts en points, plafond de la prime, défis, contrats, missions, prix des déblocages du brouilleur et du mouilleur, jugés longs à obtenir). Le tutoriel est proposé au moins une fois, même à un joueur qui a déjà joué (`nebula.tuto`). Outils : `node outils/nebula-simulateur.js` (combats, reproductibilité, migration, mines, brouillage), `node outils/nebula-parties.js [n] [prudence] [flotte]` (parties complètes), `node outils/nebula-flottes.js [n] [compo…]` (force des flottes ; l'IA de test sous-estime porte-vaisseaux, cuirassé, égide, atelier, brouilleur et mouilleur). À confirmer sur téléphone : classements `daily:AAAAMMJJ` et `victoires` (testés seulement avec le faux serveur). `@ts-check` en place sur `regles.js` : garder les typedefs JSDoc à jour quand on ajoute des champs. Prochain chantier Nebula possible : le jeu familial « Nebula : l'Empire des étoiles » (réutilisera `nebula/vaisseaux.js` et `nebula/sons.js`), dans une nouvelle conversation.
- Orbite : les niveaux 12, 23, 25, 28 et 30 sont les plus serrés (8 à 11 tirs robustes) ; à ajuster si l'utilisateur ou son fils les trouvent trop durs.
- Orbite, Pont stellaire et la grille du jour de Queens : classements testés seulement avec le faux serveur ; confirmer qu'un vrai record apparaît bien.
- Forfait : limite hebdomadaire remise à zéro le mercredi à 19 h ; privilégier les chantiers courts en fin de semaine.

## Les jeux existants
| Jeu | Dossier | État / particularités |
|---|---|---|
| Queens 16-Bit | `queens/` | Puzzle des reines, records par taille, classement. Grille du jour (graine = date, 5×5 le lundi → 9×9 le week-end, temps + 30 s par indice, `queens16.daily`, classement `queens` / `daily:AAAAMMJJ`, lien `#jour`). `window.Queens` expose `generate`, `startDaily`, `setCell`, `puzzle`. |
| Picross Dex | `picross/` | Picross Pokémon (fan-game). Temps par Pokémon (+30 s par indice), Pokédex qui défile, nombres d'indice grisés un par un. |
| Lignée | `lignee/` | Arbre généalogique à reconstituer, 3 vies, arbre du jour, classements. |
| Injagility | `injagility/` | Agility canine 32 bits : mode Infini (chiens adoptés seulement) + Parcours vu du dessus (`parcours.html`), 6 races. |
| Touché Coulé | `touche-coule/` | Bataille navale classique / Arsenal, record en moins de tirs. |
| Amiral ! | `amiral/` | Bataille navale 32 bits 8×8 avec pouvoirs (avion 3×3, salve en croix, torpille ligne/colonne, plongée du sous-marin). 3 niveaux (Mousse, Capitaine, Amiral), record en moins de tours. **On le laisse tel quel pour le moment.** |
| Le Club d'agility | `club/` | Gestion d'un club (une semaine par tour) : 6 races, activités (agrès, repos, câlins), concours jouables au doigt (zone verte), séance guidée en option, boutique (chenil, buvette, tribunes, gazon pro), 5 niveaux de concours jusqu'au Championnat de France, nom du club modifiable. |
| Orbite | `orbite/` | Physique spatiale 32 bits : lance-pierre au doigt, gravité des planètes, trous noirs, portails, astéroïdes en orbite. 30 niveaux vérifiés par un solveur (tirs gagnants avec une marge), 3 essais = 1 à 3 étoiles, classement du total d'étoiles (`orbite` / `etoiles`). `window.Orbite` expose `sim` et `LEVELS` pour les tests. |
| Pont stellaire | `pont-stellaire/` | Hashi en 32 bits (étoiles et faisceaux). Tailles 7×7, 9×9, 11×11 + Ciel du jour 9×9 (graine = date). Générateur à graine + solveur d'unicité. Classements `pontstellaire` : `best:7/9/11`, `daily:AAAAMMJJ` (temps + 30 s par indice), `ciels`. `window.PontStellaire` expose `generate` et `solve`. |
| Alunissage | `alunissage/` | Adresse 32 bits : deux réacteurs (un doigt par moitié d'écran), aires ×2/×3/×5, mission de sites enchaînés (6 mondes, gravité, vent) jusqu'au crash ; mission du jour (graine = date). Classements `alunissage` : `best`, `daily:AAAAMMJJ`. `window.Alunissage` expose `step`, `makeSite`. |
| Nebula | `nebula/` | Rogue-lite tactique spatial (Michroma/Rajdhani, canvas 544×960 lissé). 3 secteurs (Ceinture de Karn, Nébuleuse d'Orphée, Le Seuil ; décrits par `SECTORS`), 3 amiraux, victoire finale ; 13 vaisseaux et 7 pirates, mines ; épaves et nébuleuses à choix, 5 sortes de pilotes ; combat 7×9 à intentions, comptoir, dock, hangar et 5 modules, score, flotte de départ à points (10 points, 4 vaisseaux, prime d'audace, composition gardée dans `nebula.compo`), défis de combat et contrats de partie, mission du jour (flotte et règle imposées), sauvegarde `nebula.run` à chaque action (`RUN_V` 4), déblocages de vaisseaux (données stellaires) ; classements `nebula` : `best`, `daily:AAAAMMJJ`, `victoires`. Règles dans `nebula/regles.js` (aussi chargé par Node : `node outils/nebula-simulateur.js`). `window.Nebula` expose `simulate`, `makeCombat`, `makeMap`, `newRun`, `migrate`, `crash`, `run`… |
| L'Île des naufragés | `ile/` | Gestion de survie 32 bits : 8 naufragés (talents `TALENTS`, caractères `TRAITS`), une tâche chacun par jour (`TASKS`), nuit = `endDay()` (production, chantier, exploration, soins, navires, repas, événement de nuit), île 6×5 dans le brouillard (`makeIsland`), chantiers `PROJ` (abri, réserve, citerne, pièges, tour, feu, radeau, radio), 40 jours, évasion par feu de signal + guet (navires `ships`), radeau (`sail`) ou radio. Hasard reproductible `H(seed, jour, …)` : île du jour (une tentative classée, `ile.dailyTry`). Sauvegarde `ile.run`. Classements `ile` : `best`, `daily:AAAAMMJJ`, `evasions`. Équilibrage : un pilote simple s'évade ~4 fois sur 5, vers le 26e jour. `window.Ile` expose `newRun`, `endDay`, `sail`, `start`. |
| Tetris, Snake, Asteroids, Solitaire, Jeu de la vie | dossiers du même nom | Reprises en style pixel art. |

## Idées et maquettes
Les jeux futurs (coups de cœur, bateaux, espace) et les liens des maquettes de style sont dans [`IDEES.md`](IDEES.md).

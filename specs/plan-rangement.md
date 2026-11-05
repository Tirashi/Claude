# Plan du chantier « rangement de la documentation et du code partagé »

Plan donné par l'utilisateur le 05/11, enregistré tel quel pour pouvoir le reprendre après un `/compact` ou dans une autre conversation. Chaque phase est cochée quand elle est finie.

## Avancement
- [x] Phase 0 — État des lieux
- [x] Phase 1 — Alléger CLAUDE.md (18 072 → 11 292 octets ; objectif ramené à 10 Ko par l'utilisateur, plancher atteint sans toucher aux sections protégées)
- [x] Phase 2 — Un CLAUDE.md par gros jeu : resistance/, lanterne/ (+ moteur-rpg/), mineur-de-l-espace/, nebula/, ile/, bannieres/, boutique/, the-des-jarls/, duche/, doggy-saga/ (validé le 05/11)
- [x] Phase 3 — IDEES.md et suivi.md
- [x] Phase 4 — Code partagé dans un dossier commun/ (05/11, décision de l'utilisateur : seuls les deux fichiers vraiment partagés bougent, `injagility/chiens32.js` → `commun/pixel32.js` et `nebula/vaisseaux.js` → `commun/vaisseaux.js` ; `nebula/regles.js`, `nebula/sons.js` et `ile/regles.js` restent, car ils ne servent qu'à leur jeu ; cache `ludotheque-v87` ; artefacts identiques à des commentaires près, donc pas republiés)
- [x] Phase 5 — accueil.js (proposition seulement) : proposition écrite en fin de fichier ; **acceptée le 05/11** (fiches dans les dossiers des jeux, en deux sessions)
- [x] Phase 6, session 1 (05/11) — `accueil-outils.js` (`Ludo.fiche`, `rk`, `num`, `N`, `st`, `daily`…), fusion fiches + anciennes tables dans `accueil.js`, fiches de **Tetris** et **Nebula** ; cache `ludotheque-v88`
- [ ] Phase 6, session 2 — les 34 autres jeux par lots, puis suppression des anciennes tables (`GAMES` ne garde que les chemins = `ORDRE`), `registerExisting`/`PSEUDO_BOARDS` (à voir), liste de contrôle du mémo et skill `ajouter-un-jeu`, artefact de l'accueil (ses trois retouches) republié

## Plan (texte de l'utilisateur)

Chantier « rangement de la documentation et du code partagé ».

Avant tout : enregistre ce plan tel quel dans specs/plan-rangement.md et commite-le,
pour pouvoir le reprendre après un /compact ou dans une autre conversation.
Coche chaque phase dans ce fichier quand elle est finie.

RÈGLES DU CHANTIER
- Branche de travail uniquement, jamais main (main seulement quand je dis « mets à jour main »).
- Un commit par phase, message en français via un fichier et git commit -F.
- Ne rien effacer : on DÉPLACE. Tout passage retiré d'un fichier doit se retrouver
  ailleurs, et on laisse un lien vers sa nouvelle place. Avant chaque commit, vérifie
  qu'aucune information n'a été perdue (compare l'ancien et le nouveau contenu).
- Lire les gros fichiers par morceaux (grep -n puis sed -n), jamais en entier.
- Pas de sous-agents.
- À la fin de chaque phase : résumé court (tailles avant/après, ce qui a bougé où),
  puis ARRÊTE-TOI et attends que je dise « continue ».

PHASE 0 — État des lieux (ne rien modifier)
- Taille en octets de CLAUDE.md et de chacune de ses sections, de IDEES.md,
  specs/suivi.md, specs/ludotheque.md.
- Lis outils/verifications.js et note tout ce qu'il contrôle dans CLAUDE.md
  (au moins la version du service worker) : ces passages devront garder leur format.
- Liste les fichiers partagés qui vivent dans le dossier d'un jeu et, pour chacun,
  tous les fichiers qui y font référence (grep sur tout le dépôt : index.html des jeux,
  sw.js, outils/, artefact.py, tsconfig, .d.ts, skills).
- Montre-moi ce bilan et la liste des gros jeux qui auront leur propre CLAUDE.md.

PHASE 1 — Alléger CLAUDE.md (objectif : moins de 6 Ko)
- Section « En cours / à vérifier » : UNE phrase par chantier = état + prochaine étape
  + lien vers le cahier des charges. Tout le détail (sessions, dates, liens de maquettes,
  retours) part dans le cahier des charges du jeu (section « Historique ») ou dans
  specs/suivi.md.
- Section « Les jeux » : seulement le nom et le dossier de chaque jeu. Le détail des
  fichiers de chaque jeu doit exister dans le tableau de specs/ludotheque.md :
  complète ce tableau avec ce qui y manque AVANT de raccourcir CLAUDE.md.
- Garder intacts : règles de travail, sécurité, tableau des modèles, leçons générales,
  liste des fichiers partagés, et tout ce que verifications.js contrôle.
- Lance node outils/verifications.js, commite, pousse, regarde la CI.

PHASE 2 — Un CLAUDE.md par gros jeu
- Pour chaque gros jeu validé en phase 0 (au minimum resistance/, lanterne/,
  mineur-de-l-espace/, nebula/, ile/), créer <dossier>/CLAUDE.md, moins de 2 Ko :
  rôle de chaque fichier, objet window.<Jeu> pour les tests, simulateur associé,
  fichiers partagés utilisés, pièges propres au jeu, lien vers specs/<jeu>.md.
- Ces infos viennent de specs/ludotheque.md (« Les jeux existants (détails) » et
  leçons propres au jeu) : déplace-les, et laisse dans le mémo une ligne qui renvoie
  vers le CLAUDE.md du jeu. Garde dans le mémo le tableau résumé de tous les jeux.
- Mets à jour la section « Tenir la documentation à jour » du CLAUDE.md racine et
  l'étape 7 de la skill ajouter-un-jeu : un gros jeu a son propre CLAUDE.md.
- verifications.js, commit, push, CI.

PHASE 3 — IDEES.md et suivi.md
- IDEES.md : applique la règle du cycle d'un projet déjà écrite dans CLAUDE.md.
  Chaque idée qui a un fichier specs/<projet>.md (Mineur de l'espace, Résistance,
  Dragon Simulator, Armada, Clan du fjord, etc.) : son passage détaillé part dans
  ce fichier, IDEES.md garde une seule ligne avec le lien (et ✅ ou ❌ + raison).
  Ne touche pas aux sections Achats, Préférences notées et Classement des idées.
- specs/suivi.md : archive par mois. Crée specs/suivi/2026-10.md avec tout ce qui
  date d'octobre ; specs/suivi.md ne garde que le mois en cours et une ligne vers
  les archives. Cherche (grep) tous les liens vers des sections de suivi.md et
  mets-les à jour.
- verifications.js, commit, push, CI.

PHASE 4 — Code partagé dans un dossier commun/ (la plus risquée)
- Avant de toucher au code, montre-moi la liste des déplacements prévus et toutes
  les références à modifier, puis attends mon accord.
- Déplace avec git mv les fichiers partagés qui vivent dans le dossier d'un jeu
  (nebula/regles.js, nebula/vaisseaux.js, nebula/sons.js, ile/regles.js,
  injagility/chiens32.js…) vers commun/, en gardant un nom clair.
- Mets à jour toutes les références : <script src> de chaque jeu, FILES de sw.js
  (et VERSION +1, notée dans CLAUDE.md), outils/ (simulateurs, tests, tsconfig,
  .d.ts), outils/artefact.py, skills, liste des fichiers partagés de CLAUDE.md.
- verifications.js, commit, push. Ici la CI complète doit être verte avant tout
  passage sur main : si fumee.js échoue, lance-le en local pour déboguer.
- Republier les artefacts des jeux touchés (skill republier-artefact) et me donner
  la liste des jeux à essayer sur le téléphone.

PHASE 5 — accueil.js (proposition seulement, AUCUN code)
- Écris dans specs/plan-rangement.md une proposition pour que chaque jeu ait sa
  fiche de données (GAMES, META, RECS, RANKS…) assemblée par l'accueil, afin
  qu'ajouter un jeu ne modifie plus accueil.js à plusieurs endroits.
  Estime le travail et les risques. On décidera plus tard.

## Phase 5 — proposition pour `accueil.js` (05/11 ; acceptée, faite en phase 6)

### Ce qui a été fait (session 1, 05/11)
- `accueil-outils.js` (chargé avant les fiches) : `Ludo.fiche()`, mode d'emploi d'une fiche en tête du fichier, et les petits outils sortis d'`accueil.js` (`rk`/`readKey`, `writeKey`, `dayNum`, `mmss`/`fmtTime`, `sum`, `count`, `nf`, `num`, `N`, `T`, `dayKey`, `dayCode`, `st`, `day`, `dayName`, `daily`). `accueil.js` reste enveloppé dans sa fonction `(() => { … })()` : il voit ces const, les tests passent par `window.Accueil`.
- Ordre : **`GAMES` sert d'`ORDRE` pendant la transition** : un jeu migré n'y a plus que son chemin (`"tetris/index.html"`), remplacé au chargement par la cartouche de sa fiche (fiche absente ou cassée : la cartouche disparaît, l'accueil marche ; essayé). Les fiches remplissent ensuite `META`, `PROGRESS`, `TODAY`, `RECS`, `NICE`, `RANKS[carte.rank]`, et le transfert boucle sur `transfert` (`collecter`/`decrire`/`fusionner`, clé `g[cle]` inchangée).
- Vérifié dans Chromium : ancien et nouvel accueil donnent les mêmes cartouches (ordre compris), volets, records, parties en cours, défis du jour, contenu du code `LUDO1-`, résumé et import. `logique.js` relit un contenu fait par l'ancien accueil ; `verifications.js` (point 8 decies) : chaque chemin de `GAMES` a sa fiche, chargée par `index.html` dans le bon ordre et en cache ; le point 9 lit aussi les classements des fiches.
- Laissés pour la session 2 : `NEBULA_IMG` (retouche de l'artefact), `registerExisting`/`PSEUDO_BOARDS` de `ludo-scores.js`, l'ordre des lignes du résumé des sauvegardes (les jeux en fiche passent à la fin).

### Aujourd'hui
`accueil.js` (1 385 lignes, 145 Ko) décrit les 36 jeux dans une dizaine de tables séparées ; environ 840 lignes (60 %) sont des données de jeux. Ajouter un jeu touche **11 endroits dans 3 fichiers** :

| Où | Quoi | Lignes |
|---|---|---|
| `accueil.js` `GAMES` | cartouche : nom, icône, famille, couleurs, description, étiquettes, `rank`, `demo` | 13-86 |
| `META` | date d'ajout ou de mise à jour, genres | 93-130 |
| `NEWS` | annonces datées (déjà une liste par date, pas par jeu) | 131-189 |
| `PROGRESS` / `TODAY` | « partie en cours » et « défi du jour fait » | 210-254 |
| `RECS` | records affichés dans le volet | 259-323 |
| `NICE` | nom du jeu dans les phrases | 325 |
| `RANKS` | tableaux de classement du volet | 517-635 |
| `SCORES`, `collectSaves`, `describeSaves`, `mergeSaves` | transfert `LUDO1-` | 927-1331 |
| `ludo-scores.js` | `registerExisting` (records repris en rejoignant), `PSEUDO_BOARDS` | 95-180 |
| `icones.js`, `sw.js` | icône, fichiers | — |

### Proposition : une fiche par jeu
- Un fichier **`<dossier>/fiche.js`** par jeu (à côté de son `CLAUDE.md` : tout ce qui concerne un jeu est dans son dossier), script classique qui appelle :
  ```js
  Ludo.fiche({
    k: "duche/index.html",
    carte: { n: "DUCHE", ic: "…", fam: "32", lb: "…", d: "…", tags: […], rank: "duche" },  // ex-GAMES
    meta: { added: "2026-10-21", genres: ["STRATEGIE"] },                                 // ex-META
    nom: "Duché",                                                                            // ex-NICE
    enCours: () => …, duJour: () => …, records: () => [[…]],                                 // ex-PROGRESS, TODAY, RECS
    classements: [{ label: "…", game: "duche", board: () => "best", fmt: N }],               // ex-RANKS
    transfert: { cle: "duche", collecter: () => …, decrire: g => …, fusionner: g => … },     // ex-collect/describe/mergeSaves
    reprise: [["duche", "best", "duche.best", "hi"]], pseudo: true                           // ex-registerExisting, PSEUDO_BOARDS
  });
  ```
- `accueil.js` ne garde que le moteur : `Ludo.fiche()` range chaque fiche, puis l'accueil construit `GAMES`, `META`, `RANKS`… à partir des fiches, **dans l'ordre d'une seule liste** `ORDRE` (l'ordre des cartouches reste décidé à un endroit).
- Les petites fonctions communes (`rk`, `num`, `N`, `mmss`, `dayNum`…) passent dans un `accueil-outils.js` chargé avant les fiches.
- `index.html` charge les 36 fiches par `<script src>` (pas de build possible) ; `sw.js` les met en cache ; `outils/artefact.py` les intègre déjà toutes seules dans l'artefact de l'accueil.
- `NEWS` reste une liste par date dans `accueil.js` (ce n'est pas une donnée de jeu).
- Ajouter un jeu = créer `fiche.js` + une ligne dans `ORDRE`, une dans `index.html`, une dans `sw.js` (+ l'icône) : **4 lignes hors du dossier du jeu au lieu de 11 endroits**.

### Ce qui ne doit pas changer (sauvegardes et transferts)
- Aucune clé `localStorage` ne change (les fiches lisent les mêmes clés).
- Le code de transfert `LUDO1-` garde **exactement le même contenu** (mêmes noms `g.queens`, `g.amiralPal`…) : un code fait avant le changement doit se recharger après, et inversement. À vérifier en fabriquant un code avec l'ancien accueil et en le relisant avec le nouveau (test à ajouter dans `outils/logique.js`).

### Travail estimé
- L'extraction est surtout mécanique : un script peut découper les tables actuelles par jeu et écrire les 36 fiches, puis on relit.
- **Une grosse session Opus** (moteur emmêlé : l'accueil sert à tous les jeux), environ **10 à 15 % de la semaine**, ou deux sessions plus courtes :
  1. `accueil-outils.js`, `Ludo.fiche()` qui **fusionne** fiches et anciennes tables (les deux marchent en même temps), et 2 jeux migrés (un petit, Tetris ; un gros, Nebula) ;
  2. les 34 autres par lots, puis suppression des anciennes tables, `verifications.js` et skill `ajouter-un-jeu` mis à jour.

### Risques
- **L'accueil sert à tout** : une erreur dans une fiche peut casser le menu entier. Parade : chaque fiche est appelée dans un `try` (une fiche fautive fait disparaître sa cartouche, pas l'accueil) ; `fumee.js` ouvre déjà l'accueil.
- **Transfert `LUDO1-`** : la partie la plus délicate (280 lignes de fusion). Parade : test de compatibilité avant/après ci-dessus, `logique.js` couvre déjà les cas.
- **`verifications.js` (point 9)** lit `RANKS`, `registerExisting` et `PSEUDO_BOARDS` avec des expressions régulières : à réécrire pour charger les fiches (dans `vm`) ; en échange il pourra vérifier que chaque jeu a une fiche complète.
- **`ludo-scores.js`** est aussi chargé par les jeux : `registerExisting` et `PSEUDO_BOARDS` ne peuvent passer dans les fiches que s'ils ne servent qu'à l'accueil (à vérifier ; sinon on les laisse où ils sont).
- **Téléphone** : 36 petits fichiers de plus à charger sur l'accueil ; négligeable une fois en cache (service worker), un peu plus lent au tout premier lancement.
- **Artefact de l'accueil** : ses trois retouches à la main (leçon du mémo) sont à refaire et vérifier une fois.

**À décider plus tard** : faire ce chantier, et si oui où placer les fiches (`<dossier>/fiche.js`, recommandé, ou un dossier `fiches/`).

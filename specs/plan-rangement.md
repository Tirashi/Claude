# Plan du chantier « rangement de la documentation et du code partagé »

Plan donné par l'utilisateur le 05/11, enregistré tel quel pour pouvoir le reprendre après un `/compact` ou dans une autre conversation. Chaque phase est cochée quand elle est finie.

## Avancement
- [x] Phase 0 — État des lieux
- [x] Phase 1 — Alléger CLAUDE.md (18 072 → 11 292 octets ; objectif ramené à 10 Ko par l'utilisateur, plancher atteint sans toucher aux sections protégées)
- [x] Phase 2 — Un CLAUDE.md par gros jeu : resistance/, lanterne/ (+ moteur-rpg/), mineur-de-l-espace/, nebula/, ile/, bannieres/, boutique/, the-des-jarls/, duche/, doggy-saga/ (validé le 05/11)
- [x] Phase 3 — IDEES.md et suivi.md
- [x] Phase 4 — Code partagé dans un dossier commun/ (05/11, décision de l'utilisateur : seuls les deux fichiers vraiment partagés bougent, `injagility/chiens32.js` → `commun/pixel32.js` et `nebula/vaisseaux.js` → `commun/vaisseaux.js` ; `nebula/regles.js`, `nebula/sons.js` et `ile/regles.js` restent, car ils ne servent qu'à leur jeu ; cache `ludotheque-v87` ; artefacts identiques à des commentaires près, donc pas republiés)
- [ ] Phase 5 — accueil.js (proposition seulement)

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

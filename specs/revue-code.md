# Revue « ingénieur senior » du code (19/10)

## 1. Périmètre et méthode
- **Lu en entier** : l'infrastructure partagée (`sw.js`, `ludo-scores.js`, `supabase/*.sql`, la CI `.github/workflows/`, `outils/verifications.js`, `outils/fumee.js`) et le transfert de sauvegarde de l'accueil (`collectSaves`, `decodeSaves`, `mergeSaves`).
- **Analysé par des outils** sur tout le code des jeux (≈ 2 Mo, maquettes exclues) :
  - **ESLint** (variables non définies, fonctions déclarées deux fois, code inatteignable…), page par page, avec les scripts partagés de chaque page ;
  - recherches ciblées : date des défis du jour, graines des grilles du jour, minuteries, musique en arrière-plan, affichage des pseudos venus du serveur, cohérence des classements.
- **Lu par morceaux** aux endroits sensibles : calcul des points du Yams, générateurs du Sudoku, de Queens et du Pont stellaire, vérification de victoire du Picross, boucles d'affichage 3D.
- Ce qui n'a **pas** été lu ligne à ligne : le corps de chaque jeu (règles d'Amiral !, de Nebula, de la colonie…). Le lire en entier coûterait 15 à 25 % du forfait de la semaine ; les outils couvrent l'essentiel des erreurs mécaniques.

## 2. Ce qui est sain
- **Sécurité** : seule la clé publique est dans le dépôt ; la table des scores est fermée (RLS, aucun droit direct) ; tout passe par des fonctions qui vérifient le code familial ; `search_path` vide ; le code familial reste `MON-CODE` dans le SQL. Les pseudos venus du serveur sont affichés sans risque (`textContent` ou caractères `<>&` retirés).
- **Classements** : file d'attente hors connexion, un score refusé n'est pas renvoyé en boucle, le serveur garde toujours le meilleur.
- **Défis du jour** : la date (heure locale) est calculée de la même façon dans les 10 jeux et sur l'accueil ; toutes les grilles du jour viennent d'un générateur à graine (les mêmes pour toute la famille).
- **Hors connexion** : le service worker est soigné (réseau d'abord, repli sur le cache si le réseau traîne, pas de vieux fichiers du cache du navigateur).
- **Musique** : les jeux qui en ont l'arrêtent quand l'appli passe en arrière-plan.
- **Sauvegardes** : lectures de `localStorage` protégées partout (une sauvegarde abîmée ne bloque pas un jeu) ; le transfert `LUDO1-` couvre les 20 jeux à records.
- Les **207 dessins du Picross Dex** se résolvent tous par logique, ligne par ligne, sans deviner.

## 3. Problèmes trouvés
| # | Gravité | Où | Problème | Suite |
|---|---|---|---|---|
| 1 | Faible | `alunissage/index.html` | `drawAstronaut` écrite deux fois (la première était du code mort, jamais appelée). | ✅ **Corrigé** (rien ne change à l'écran). |
| 1 bis | Moyenne (CI) | `outils/fumee.js` (Amiral !) | Test instable : la réparation était vérifiée après la riposte de l'ennemi, qui pouvait retoucher le navire réparé (environ 1 passage sur 4 en rouge, sans bug du jeu). | ✅ **Corrigé** : vérifiée juste après l'action. |
| 2 | Moyenne (batterie) | `yams/index.html` | La scène 3D est redessinée 60 fois par seconde même quand rien ne bouge (dés posés, feuille ouverte) : le téléphone chauffe et se vide pour rien. | Ne dessiner que pendant un lancer, un geste ou une animation. Petit chantier (~1 %), à essayer sur le téléphone. |
| 3 | Moyenne (entretien) | `amiral/`, `escadrille/` | Escadrille ! est une copie d'Amiral ! (~1 400 lignes très proches : sons, musique, IA, écrans). Chaque correction doit être faite deux fois : c'est exactement le lot 2 d'Escadrille (`specs/escadrille.md` § 9). | Avant le lot 2, sortir le moteur commun dans un script partagé (par ex. `bataille/moteur.js`). À décider avec la session 2 d'Amiral !. |
| 4 | Moyenne (forfait) | `picross/` (145 Ko), `index.html` (138 Ko), `amiral/` (115 Ko), `nebula/index.html` (114 Ko) | Plus un fichier est gros, plus chaque chantier coûte de jetons à lire. Le Picross est surtout fait de dessins (≈ 3 300 lignes de données). | Sortir les données et les règles dans des scripts à part, comme déjà fait pour Nebula, Odyssée et Lune-Rover : `picross/dessins.js`, `amiral/regles.js`… À faire quand on retouche le jeu. |
| 5 | Faible | `supabase/classements.sql` | `ludo_check` ne limite pas le nombre d'essais : un code familial court pourrait être deviné par un programme. | Garder un code familial **long** (10 caractères ou plus, avec des chiffres). Rien à programmer. |
| 6 | Faible | `supabase/` | Le serveur accepte n'importe quelle valeur de score envoyée avec le bon code (triche possible). | Acceptable entre membres de la famille ; rien à faire. |
| 7 | Faible | 20 jeux | Mêmes petites fonctions recopiées partout (sauvegarde `store`, date du jour ×10, sons WebAudio). | Pas de refonte (chaque jeu doit rester autonome pour les artefacts). Utiliser la même version quand on crée un jeu. |
| 8 | Faible | `amiral/` | Le transfert de sauvegarde reprend les records d'Amiral ! mais pas le palmarès ni la flotte du chantier naval. | Déjà prévu dans la session 2 d'Amiral !. |
| 9 | Très faible | `sw.js` | Tout fichier du site visité est gardé en cache, même hors de `FILES` (maquettes, specs). | Sans gêne réelle ; rien à faire. |

## 4. Tests
**Déjà là** : `verifications.js` (syntaxe, service worker, sécurité, icônes, Nebula, Lune-Rover, Odyssée) et `fumee.js` (chaque jeu s'ouvre ; parcours de Nebula, Amiral !, Escadrille !, la colonie, Odyssée), tous deux lancés par la CI.

**Ajoutés le 19/10** :
- `verifications.js` § 9, **cohérence des classements** (sans navigateur). Chaque record envoyé par un jeu doit :
  - être affiché dans le volet de l'accueil (`RANKS`) ;
  - être repris quand on rejoint le classement (`registerExisting`) ;
  - avoir son jeu dans la vérification des pseudos.

  C'est l'oubli le plus probable quand on ajoute un jeu.
- `outils/logique.js` (Chromium, **lancé par la CI**, inutile en local) :
  - grilles du jour des **60 prochains jours** : Sudoku et Queens (une seule solution, générées en moins de 3 s), Pont stellaire (une seule solution), Calculator (20 calculs justes, les mêmes pour tous) ;
  - les **207 dessins du Picross** se résolvent sans deviner ;
  - **points du Yams** (chaque case, bonus de 35) ;
  - **transfert `LUDO1-`** : exporter, vider, importer, et tout revient.
- La CI repasse `logique.js` **chaque lundi sur une année entière** de grilles du jour : un jour impossible serait vu des mois à l'avance.
- Points d'accès pour les tests : `window.Accueil` (transfert de sauvegarde) et `window.Picross` (dessins).

**Encore sans test** (par ordre d'intérêt) :
- Lignée (arbre du jour : solution unique ?) ;
- Alunissage (chaque site de la mission du jour est-il posable ?) ;
- Injagility Parcours (chaque parcours est-il faisable ?) ;
- Touché Coulé et le Club (règles) ;
- les marques du défi du jour sur l'accueil.

À ajouter dans `logique.js` quand on retouche ces jeux.

**ESLint en CI** (proposition) : l'analyse faite pour cette revue a trouvé le problème n° 1. On pourrait la brancher sur la CI (vérifications `no-undef`, `no-redeclare`, code inatteignable) : environ 1 % du forfait pour l'installer.

## 5. CI et économie de jetons
Ce qui coûte vraiment des jetons, par ordre d'importance :
1. **Lire de gros fichiers** (tableau n° 4) : c'est le premier poste. Découper les gros fichiers rapporte plus que tout le reste.
2. **`CLAUDE.md` est relu à chaque conversation** (16 Ko, environ 5 000 jetons). La partie « En cours / à vérifier » y occupe la moitié. Garder dans `CLAUDE.md` une ligne par chantier, avec un lien vers son cahier des charges, ferait gagner environ 2 500 jetons par conversation.
3. **Captures d'écran** : chacune coûte cher ; la CI les garde déjà (artefact « captures » de l'onglet *Actions*).
4. **Tests lancés en local** : `verifications.js` est rapide et sa sortie courte, donc peu coûteux. `fumee.js` demande un serveur et Playwright ; la CI le lance déjà à chaque push.

Proposition (**à valider par l'utilisateur**, la règle de `CLAUDE.md` n'est pas changée) :
- en local, ne lancer que `verifications.js` avant chaque push ;
- laisser `fumee.js` et `logique.js` à la CI ;
- lancer `fumee.js` en local seulement pour déboguer un jeu ;
- avant de mettre à jour `main`, regarder le résultat de la CI, comme aujourd'hui.

Gain : une installation de Playwright et un serveur de moins par chantier, quelques milliers de jetons à chaque fois.

## 6. Prochaines étapes possibles
| Étape | Coût estimé (semaine) |
|---|---|
| Yams : ne plus redessiner au repos (n° 2) | ~1 % |
| ESLint dans la CI | ~1 % |
| `CLAUDE.md` allégé (« En cours » déplacé dans les specs) | ~1 % |
| Picross : dessins dans `picross/dessins.js` (n° 4) | 1–2 % |
| Moteur commun Amiral ! / Escadrille ! (n° 3), avec la session 2 d'Amiral ! ou le lot 2 d'Escadrille | 4–8 % |
| Tests de Lignée, Alunissage et Parcours dans `logique.js` | 2–3 % |

## 7. Suites faites le 19/10 (décision de l'utilisateur : « faire toutes les suites »)
| Suite | Résultat |
|---|---|
| `fumee.js` laissé à la CI | Règle changée dans `CLAUDE.md` : en local, seulement `verifications.js` ; `fumee.js`, `logique.js` et `lint.js` tournent dans la CI. |
| Gros fichiers (n° 4) | 21 pages découpées en `index.html` + `jeu.js` (+ `style.css` au-delà de 2 Ko) ; accueil : `accueil.js`, `accueil.css` ; Picross : dessins dans `picross/dessins.js`. Le HTML d'Amiral !, de Nebula ou du Picross fait maintenant 1 à 8 Ko : on ne lit plus que ce qu'on modifie. `artefact.py` intègre aussi les CSS (artefacts identiques, vérifié). `verifications.js` contrôle que chaque script et chaque CSS d'une page existe et est dans `FILES` (`sw.js` v39). |
| Yams au repos (n° 2) | ✅ Rien n'est redessiné quand rien ne bouge (vérifié : 0 image par seconde au repos). La lumière des styles A (bougie) et C (néons) tourne à 20 images par seconde. Un toucher réveille l'affichage pendant 0,8 s. |
| ESLint en CI | ✅ `outils/lint.js` (page par page, avec ses scripts) ; vérifié sur une faute de frappe volontaire. |
| `CLAUDE.md` allégé | ✅ 16 Ko → 10,6 Ko : « En cours » réduit à une ligne par chantier, les détails dans `specs/suivi.md`. |
| Tests de Lignée, Alunissage et Parcours | ✅ Dans `logique.js`. Ils ont trouvé **deux vrais bugs, corrigés** (détail ci-dessous). |
| Moteur commun Amiral ! / Escadrille ! (n° 3) | **Pas fait, volontairement.** Mesuré : 26 fonctions identiques (4 Ko seulement) contre 69 fonctions qui ont déjà divergé (74 Ko). Un moteur commun reviendrait à réécrire Escadrille ! sur le moteur d'Amiral !, c'est-à-dire le lot 2 d'Escadrille (`specs/escadrille.md` § 9). Le faire maintenant, juste avant la session 2 d'Amiral !, casserait deux jeux pour rien. **À faire pendant le lot 2**, après la session 2 d'Amiral !. |

Les deux bugs corrigés :
- **Alunissage** : 1 site sur 40 n'avait que 2 aires d'atterrissage au lieu de 3, faute de place après 40 essais au hasard. Désormais la première place libre, et en dernier recours une aire un peu plus courte. Les autres sites ne changent pas.
- **Injagility Parcours** : les parcours **34** et **127** ne se créaient pas. Toucher le niveau ne faisait rien, et un joueur arrivé au 34 restait bloqué. Désormais, en secours, le jeu essaie la graine suivante. Les autres parcours ne changent pas.

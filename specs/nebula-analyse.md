# Nebula : analyse technique et propositions (14/10/2026)

> Bilan fait après la session 1, avant la session 2.
> **Décision de l'utilisateur (14/10)** : on garde « sans build » ; la règle « un fichier par jeu » est assouplie (scripts classiques autorisés). **Étape 1 du § 9 faite le 14/10** (voir § 10).
> Contraintes prises en compte : site statique sur **GitHub Pages** (pas de serveur, pas d'en-têtes personnalisés), base **Supabase** gratuite appelée avec la clé publique, jeux **sans build** (un fichier par jeu), **artefacts** fabriqués par `outils/artefact.py`, appli **PWA** jouée sur Android.

## 1. État des lieux

| Point | Mesure / constat |
|---|---|
| Taille | `nebula/index.html` 88 Ko (1 180 lignes), `nebula/vaisseaux.js` 42 Ko. Sessions 2 et 3 (2 secteurs, 12 épaves, 6 vaisseaux, pilotes, manuel, tutoriel) : le fichier va probablement doubler. |
| Organisation | Bonne séparation **logique pure** (combat, IA, carte, comptoir : sans affichage, à graine) / **affichage** (canvas) / **événements** rejoués en animations. C'est la bonne architecture pour ce genre de jeu : à garder. |
| Fluidité | Une trame de combat coûte ~0,2 ms (0,6 ms au 95e centile) sur ordinateur ; même ×10 sur téléphone, on reste très loin des 16 ms. Les optimisations de la session 1 (décor pré-agrandi, résolution plafonnée) ont fait leur travail. |
| Sprites | Fabrication à la demande : porte-vaisseaux 75 ms, frégate 58 ms, autres < 25 ms (ordinateur, définition simple). Sur téléphone, un gros vaisseau peut donc bloquer **une** trame 200 à 300 ms (petit à-coup au premier affichage). |
| Simulateur | 200 combats en ~0,3 s. Il tourne aujourd'hui **dans Chromium via Playwright** alors que la logique n'a pas besoin du navigateur. |
| Sauvegarde | `nebula.run` ≈ 3 Ko en combat, enregistré à chaque action : aucun souci de taille ni de vitesse. Le champ `v: 1` existe mais **rien ne le lit** au chargement. |
| Hasard | Tout passe par mulberry32 **sauf** le nom d'un vaisseau recruté (`addFleet` utilise `Math.random`) : à corriger avant la partie du jour. |

## 2. Risques à traiter avant la session 2 (priorité haute)

1. **Une erreur fige le jeu pour toujours.** `frame()` relance `requestAnimationFrame` à sa dernière ligne : une exception dans un écran (par ex. une sauvegarde de la session 1 relue par le code de la session 2) arrête la boucle, et comme la partie est relue au lancement, le jeu reste noir à chaque ouverture jusqu'à ce qu'on vide le stockage.
   → `try/catch` autour du dessin, écran « INCIDENT » avec ABANDONNER LA PARTIE / RÉESSAYER, et la boucle relancée dans tous les cas.
2. **Sauvegardes d'une version à l'autre.** La session 2 ajoute des champs (pilotes, secteurs, épaves). → une fonction `migrate(run)` qui lit `v`, complète les champs manquants, et met de côté une copie (`nebula.run.bak`) si la relecture échoue.
3. **Partie du jour reproductible.** Supprimer le dernier `Math.random` de la logique et ajouter au simulateur un test « même graine + mêmes actions = même partie complète » (pas seulement même carte / même combat).

## 3. Organisation du code

**Proposition : découper Nebula en 3 scripts classiques (sans build, sans modules ES).**
- `nebula/regles.js` : données (vaisseaux, modules, secteurs, pilotes) + logique pure (combat, IA, carte, comptoir, score). Aucune dépendance au DOM ; le générateur mulberry32 y est recopié pour ne plus dépendre de `vaisseaux.js`. Se termine par `if (typeof module !== 'undefined') module.exports = …` → **utilisable directement par Node**.
- `nebula/evenements.js` : textes et choix des épaves, nébuleuses, rubriques du manuel (gros volume de texte, facile à relire et à modifier seul).
- `nebula/index.html` : affichage, entrées, sons.

Gains : chaque session de Claude lit moins de code pour une retouche (économie de jetons), le simulateur et des tests tournent **sans navigateur** (`node --test`), et l'Empire des étoiles pourra réutiliser `regles.js` comme il réutilisera `vaisseaux.js`.
Coût : `outils/artefact.py` doit intégrer tous les `<script src>` locaux (petite généralisation de ce qu'il fait déjà pour `vaisseaux.js`), et `sw.js` gagne 2 fichiers.
Pourquoi pas des modules ES (`import`) : GitHub Pages les sert très bien, mais l'artefact doit tout contenir dans une page, et `import` complique l'intégration ; les scripts classiques suffisent.

**IA des pirates (§ 18 « coincer le joueur ») : passer à une IA par score.** Pour chaque pirate, noter chaque position d'arrivée possible : cases de repli des vaisseaux du joueur couvertes par son tir (en tenant compte des tirs déjà annoncés par les autres pirates), dégâts attendus, passage bloqué, risque encouru. Sur une grille 7×9 c'est quelques milliers d'évaluations par tour : instantané. Les poids (agressivité, prudence) deviennent des réglages par secteur, ce qui donne la montée en difficulté demandée, et le simulateur sert à les régler.

## 4. TypeScript, frameworks, outils

| Piste | Avis | Pourquoi |
|---|---|---|
| **TypeScript complet** (`.ts` compilés) | ❌ pas maintenant | Il faut une étape de build : fin du « un fichier par jeu sans build », et `artefact.py` devrait passer par le build. Le gain ne compense pas sur un projet de cette taille. |
| **Vérification de types sans build** : `// @ts-check` + types en commentaires JSDoc (`@typedef Ship`, `Combat`, `Run`, `Evenement`) vérifiés par `tsc --noEmit` | ✅ recommandé | 90 % de l'intérêt de TypeScript (fautes de frappe dans un champ, paramètre oublié, `undefined` inattendu) **sans rien changer au déploiement** : le code reste du JavaScript lu tel quel par le navigateur. Très utile au moment où la session 2 ajoute pilotes, secteurs et événements. Commencer par `regles.js`. |
| **Phaser / PixiJS** | ❌ | Le moteur maison est déjà rapide (0,2 ms par trame), les sprites sont fabriqués par le code (pas d'images à charger), l'interface est entièrement dessinée. Un moteur ajouterait 400 Ko à 1 Mo à mettre en cache, une réécriture complète, et casserait le partage avec `vaisseaux.js`. À reconsidérer seulement si l'Empire demande beaucoup d'effets (WebGL). |
| **React / Vue / Svelte** | ❌ | Pas de DOM à gérer : tout est dans le canvas. |
| **Vite / esbuild + déploiement Pages par GitHub Actions** | ⏸ plus tard | Possible (Pages accepte un site produit par une Action), mais change le mode de publication de toute la Ludothèque. Utile seulement si on adopte TypeScript complet ou un framework. |
| **Howler.js (sons)** | ❌ | Les sons sont synthétisés en WebAudio : rien à charger. |
| **ESLint** (config minimale) | ✅ dans la CI | Attrape variables non définies et doublons ; aucune incidence sur le site. |

## 5. GitHub : intégration continue (proposition)

Un fichier `.github/workflows/verifications.yml`, lancé à chaque push sur une branche `claude/*` et sur `main` (gratuit pour un dépôt public, n'a besoin d'aucun secret) :
1. `node --check` sur les scripts et ESLint ;
2. `tsc --noEmit` (vérification JSDoc, une fois `@ts-check` en place) ;
3. simulateur Nebula en mode rapide : aucun combat impossible ni trivial, graines reproductibles (seuils réglés dans le script) ;
4. cohérence de la Ludothèque : chaque fichier de `FILES` (`sw.js`) existe, aucune clé `sb_secret_…` ni code familial dans le dépôt, lignes d'`ICONS` de 16 caractères ;
5. (optionnel) capture Playwright de l'écran titre et d'un combat, jointe au résultat de l'action.

Résultat : un push cassé se voit dans l'onglet *Actions* avant de mettre `main` à jour. L'action « Réveil des classements » existante reste telle quelle.

## 6. Hors connexion et chargement (PWA)

- **Polices** : Michroma, Rajdhani et Share Tech Mono viennent de Google Fonts ; elles ne sont en cache qu'après une première ouverture en ligne. Les héberger dans le dépôt (`polices/*.woff2`, ~60 Ko, dans `FILES`) : affichage correct dès la première ouverture hors ligne, aucun appel à un site tiers. L'artefact garde le lien Google Fonts (seul autorisé dans un artefact) : `artefact.py` fait l'échange.
- **Réseau d'abord avec délai** : `sw.js` attend toujours le réseau. Sur une connexion mobile lente, le jeu met longtemps à s'ouvrir. Proposition : au-delà de ~2,5 s, servir la copie en cache (la nouvelle version arrive au lancement suivant).
- **`VERSION` du cache** : la CI (§ 5) peut vérifier qu'elle a changé quand `FILES` change.
- **À-coups de sprites** : une fois les 16 vaisseaux en jeu, préparer les sprites du prochain combat **pendant la carte** (déjà le principe de `work()`), et si les mesures sur téléphone le justifient, les fabriquer dans un *Web Worker* avec `OffscreenCanvas` (pris en charge par Chrome Android). À mesurer d'abord avec un petit compteur de temps (`?perf`).

## 7. Supabase

- Rien à changer côté base : `daily:AAAAMMJJ` (17 caractères) et `victoires` respectent les contraintes de noms ; le projet est maintenu éveillé par l'action existante.
- Les scores sont envoyés par le navigateur avec la clé publique : un score inventé reste possible. Pour un classement familial c'est acceptable. Si un jour il faut s'en protéger : enregistrer la liste des actions de la partie (graine + actions, quelques Ko) et la faire rejouer par une *Edge Function* Supabase avant d'accepter le score. À ne faire que sur demande.
- La règle « une seule tentative classée par jour » ne peut être tenue que dans le navigateur (`nebula.daily`) sans nouveau SQL ; c'est suffisant entre gens de bonne foi.

## 8. Interface et confort (au-delà du § 18 des specs)

- **Petits boutons** : certains font 26 à 36 px logiques, soit ~19 à 26 px à l'écran du téléphone (la cible conseillée est ~44 px). Agrandir au moins leur zone tactile (`zone()` plus large que le dessin).
- **Toucher long = fiche** sur un vaisseau, un pirate ou une balise : une seule mécanique pour la légende de la carte et les capacités demandées au § 18.
- **Aperçu du danger** : quand on choisit une case de déplacement, la marquer si elle est visée (dégâts prévus, tête de mort si le vaisseau y serait détruit).
- **Avertissement doux** sur FIN DU TOUR quand un vaisseau peut encore tirer.
- **Vitesse des animations pirates** (×1 / ×2) dans les réglages.
- **Vibration** courte (`navigator.vibrate`) quand un vaisseau du joueur est touché, désactivable avec le son.
- **Économie de batterie** : la boucle redessine 60 fois par seconde même sur les écrans immobiles (carte, comptoir, hangar). Redessiner seulement quand quelque chose bouge ou après un toucher, et 30 images/s au repos en combat.

## 9. Ordre proposé

1. **Petit chantier préparatoire** (avant la session 2) : protection contre les erreurs + `migrate()`, suppression du `Math.random`, découpage `regles.js` / `evenements.js` / `index.html`, `artefact.py` généralisé, simulateur sous Node, CI GitHub (vérifications 1, 3, 4).
2. **Session 2** telle que prévue, avec l'IA par score et `@ts-check` sur `regles.js`.
3. **Session 3** : polices locales, délai réseau du service worker, confort (§ 8), mesures sur téléphone et, si besoin, Web Worker pour les sprites.

## 10. Chantier préparatoire : fait (14/10/2026)
- `nebula/regles.js` : toute la logique sortie de `index.html` (comportement identique : le simulateur donne exactement les mêmes chiffres qu'avant). `evenements.js` sera créé en session 2 avec les premiers textes d'épaves.
- `migrate()` + `RUN_V` (une partie illisible est mise de côté dans `nebula.run.bak`) ; écran **INCIDENT** (RÉESSAYER / ABANDONNER LA PARTIE) au lieu d'un jeu figé ; plus de `Math.random` dans les règles.
- `outils/nebula-simulateur.js` sous Node, avec parties complètes rejouées deux fois (reproductibilité) et test de `migrate()`.
- `outils/artefact.py` intègre tous les scripts locaux d'une page.
- `outils/verifications.js` + `outils/fumee.js`, lancés par `.github/workflows/verifications.yml` à chaque push.
- Reste pour plus tard : ESLint et `@ts-check` (session 2), polices locales, délai réseau du service worker, confort (§ 8).

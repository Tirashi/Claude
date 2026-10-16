# Cahier des charges — L'ÎLE DES NAUFRAGÉS : LA COLONIE

> Préparé le 16/10/2026. **Remplace** la première version de L'Île des naufragés (survie de 40 jours, jugée trop minimaliste : « c'est carrément le concept qui ne va pas »). Même dossier `ile/`, mêmes classements `ile`, même lien d'artefact.
> Référence : un **tout petit Banished**, au tour par tour, sur téléphone en paysage.
> Les valeurs chiffrées sont une **première proposition**, à régler avec le pilote automatique (§ 13) puis en jouant.

## 1. Décisions de l'utilisateur (16/10)
- **Remplacer** l'ancienne Île (les naufragés deviennent l'histoire du début : ils fondent la colonie).
- **Tour par tour**.
- **Pas de morts** : un colon malheureux, affamé ou gelé **quitte l'île** (il part sur un radeau de fortune) ; un colon âgé « prend sa retraite » (il ne travaille plus, puis disparaît de la liste au bout d'un moment, sans le mot « mort »).
- **Sans fin** : la partie dure tant qu'il reste des colons. Le but est de **tenir le plus longtemps possible** et de faire grandir la colonie.
- **Téléphone à l'horizontale**, grande île générée au hasard, on **aménage les cases**, **la nature est l'ennemie**.
- À garder de l'ancienne version et de la maquette `maquettes/ile-ergonomie.html` (proposition **D**) : les **postes avec + et −** (le colon le plus doué y va en premier), les **talents et caractères**, la **carte vivante** (colons dessinés à leur poste, rendement écrit sur la carte), le **chantier dessiné sur sa case avec sa barre** (part gagnée ce tour hachurée), la **prévision** sous chaque ressource et l'**alerte** avant de finir le tour, des textes **lisibles** (jamais en dessous de 8 px logiques).

## 2. Boucle de jeu
1. Au départ : 8 naufragés, l'épave sur la plage (stock de départ : nourriture, bois, outils), une tente.
2. Chaque **tour = une semaine**. Le joueur :
   - pose des **chantiers** sur les cases (un bâtiment par case, selon le terrain) ;
   - règle les **postes** (combien de colons dans chaque bâtiment, et aux chantiers) ;
   - lit la **prévision** et les **alertes** (nourriture, bois de chauffage avant l'hiver, crue annoncée…) ;
   - touche **SEMAINE SUIVANTE**.
3. Le tour se résout (§ 9), puis un **compte rendu court** en cartes (une par événement), avec les ressources qui « s'envolent » des bâtiments sur la carte.
4. **Une année = 4 saisons × 4 semaines = 16 tours.** Les saisons changent tout : on sème au printemps, on récolte à l'automne, on survit à l'hiver.
5. La partie s'arrête seulement quand **le dernier colon quitte l'île**. Bilan : années tenues, population maximale, bâtiments, records.

## 3. L'île
- Carte de **24 × 14 cases** (à ajuster), générée à partir d'une **graine** (mulberry32) : même graine = même île, mêmes événements.
- Génération : bruit fractal d'altitude + masque d'île → mer, plage, prairie, forêt (dense / claire), collines, rochers, montagne (infranchissable), **une rivière** qui descend des collines jusqu'à la mer, avec ses berges (zone inondable) et un marais à l'embouchure ; l'épave sur une plage.
- Chaque case garde ses **ressources naturelles** : arbres (repoussent lentement si on n'en coupe pas trop autour), pierre, poissons (côte, rivière), gibier et baies (forêt), fertilité (prairie, berges : très fertiles mais inondables).
- **Brouillard** : on ne voit au départ que les alentours de l'épave ; l'**éclaireur** (bâtiment ou poste « explorer ») dévoile la carte peu à peu et trouve des **lieux** : source, grotte, ruines (objets, plans de bâtiments), autre épave (nouveaux colons), filon de fer.
- Vue : on fait **défiler au doigt** ; un double toucher ou des boutons ± zooment (2 niveaux : vue d'ensemble / vue détaillée).

## 4. Les bâtiments (première liste)
| Bâtiment | Terrain | Coût | Postes | Effet |
|---|---|---|---|---|
| Tente (départ) | tout | — | — | Loge 8 colons, mal (froid en hiver). |
| Habitation | prairie, plage | 6 bois, 2 pierre | — | Loge 4 colons ; chauffée l'hiver avec du bois de chauffage. Plus d'habitations = naissances possibles. |
| Cueilleur | près d'une forêt | 4 bois | 2 | Baies et champignons (pas l'hiver). |
| Pêcherie / Port | côte ou rivière | 6 bois | 2 | Poisson toute l'année (moins l'hiver). Le **port** (amélioration) attire de nouveaux colons et des marchands. |
| Chasseur | forêt | 4 bois | 2 | Viande et peaux ; le gibier s'épuise si on chasse trop. |
| Champ | prairie, berges | 2 bois | 2 | Semé au printemps, récolté à l'automne (blé, légumes). Berges : récolte ×1,5 mais risque de crue. |
| Élevage | prairie | 8 bois, 2 pierre | 1 | Poules (œufs) et moutons (laine) ; à protéger des loups (clôture). |
| Bûcheron | forêt | 4 bois | 2 | Bois ; abat les arbres autour (ils repoussent). |
| Scierie | près de la rivière | 6 bois, 4 pierre | 2 | Bois → planches (nécessaires aux bâtiments avancés). |
| Carrière | rochers, collines | 4 bois | 2 | Pierre. |
| Forge | — | 6 planches, 6 pierre | 1 | Fer → outils (les outils s'usent ; sans outils, travail ×0,5). |
| Tailleur | — | 4 planches | 1 | Laine et peaux → vêtements (indispensables l'hiver). |
| Grenier | — | 6 bois, 4 pierre | — | Garde la nourriture : sans grenier, elle se gâte ; protège des rats et des inondations. |
| Entrepôt | — | 6 bois | — | Stocke bois, pierre, planches, outils (sans lui, plafond bas et pertes sous la pluie). |
| Puits | — | 4 pierre | — | Eau propre : moins d'épidémies. |
| Guérisseur | — | 6 planches | 1 | Soigne les malades, freine les épidémies. |
| Digue | berges | 8 pierre | — | Protège les cases voisines de la crue. |
| Tour de guet | — | 6 bois | 1 | Annonce les tempêtes et les incendies une semaine plus tôt ; éteint les feux plus vite. |
| Taverne / place du village | — | 8 planches | 1 | Bonheur +. |

Chaque bâtiment se construit en **chantier** (points de travail × bâtisseurs), comme avant ; le chantier en cours est dessiné sur sa case avec sa barre.

## 5. Ressources
- **Nourriture** : plusieurs sortes (poisson, viande, baies, céréales, légumes, œufs). Une nourriture **variée** protège des maladies et fait plaisir ; une seule sorte = moral et santé en baisse.
- **Bois** (construction et **chauffage**), **planches**, **pierre**, **fer**, **outils**, **peaux et laine**, **vêtements**.
- Barre du haut : nourriture (avec le détail par sorte au toucher), bois, pierre, planches, outils, vêtements ; sous chacune, **la prévision du tour** (+ / −) ; et **la prévision de l'hiver** à l'automne (« bois de chauffage : 40 / 64 nécessaires »).

## 6. Les colons
- Reprise des **talents** (pêcheur, charpentier, infirmière, cuisinier, exploratrice, enfant débrouillard, mécano → forgeron, marin) et des **caractères** (courageux, râleur, peureux, rêveur, travailleur, gourmand). Un talent rend le colon meilleur dans les bâtiments qui lui correspondent ; les postes envoient d'abord le plus doué.
- **Âge** : enfants (ne travaillent pas), adultes, anciens (« à la retraite », ne travaillent plus, donnent un peu de bonheur). Le temps passe : un enfant devient adulte au bout de 2 ans de jeu.
- **Besoins** chaque semaine : manger, être logé, au chaud l'hiver (habitation chauffée + vêtements), santé.
- **Bonheur** de la colonie (0–100) : nourriture variée, logement, chaleur, taverne, pas trop de travail ; baisse avec la faim, le froid, les catastrophes, les départs.
- **Départs (pas de morts)** : un colon affamé, gelé ou malade trop longtemps, ou une colonie très malheureuse → des colons **quittent l'île** (« Léa et Hugo sont partis sur un radeau de fortune »).
- **Arrivées** : naissances (habitations libres, bonheur suffisant), naufragés trouvés par l'éclaireur, bateaux de colons attirés par le **port** quand la colonie va bien.

## 7. La nature, ennemie
| Menace | Quand | Effet | Parades |
|---|---|---|---|
| **Hiver** | chaque année | rien ne pousse, pêche et cueillette en baisse, froid | bois de chauffage, habitations, vêtements, réserves au grenier |
| Hiver rude | ~1 an sur 4 | froid plus long, bois ×1,5 | idem, plus de réserves |
| **Crue de la rivière** | printemps | champs et bâtiments des berges inondés (récolte perdue, stocks gâtés) | digues, ne pas tout construire sur les berges, grenier |
| Sécheresse | été | récoltes ×0,5, incendies plus probables | puits, champs près de la rivière |
| **Incendie de forêt** | été | se propage aux cases de forêt voisines, puis aux bâtiments en bois | tour de guet, coupe-feu (cases déboisées), colons au poste « pompiers » |
| Tempête | automne | bâtiments abîmés (à réparer), bateaux absents | tour de guet (prévenu), pierre |
| **Épidémie** | hiver surtout | malades (ne travaillent plus), départs si ça dure | guérisseur, puits, nourriture variée |
| Loups | hiver | bêtes de l'élevage perdues | clôture, chasseur |
| Rats / sauterelles | été | stocks ou récoltes rongés | grenier, chat (événement) |
| Forêt épuisée | si on coupe trop | plus de bois autour du bûcheron | déplacer le bûcheron, laisser repousser |

Les menaces s'annoncent quand c'est possible (la tour de guet, le ciel, la rivière qui monte), et l'**alerte** avant SEMAINE SUIVANTE les rappelle.

## 8. Écrans et ergonomie (paysage)
- Canvas en **640 × 360 pixels logiques** (paysage), agrandi à l'écran comme les autres jeux. Si le téléphone est tenu en portrait : écran « Tourne ton téléphone » (avec un petit dessin).
- Disposition :
  ```
  ┌───────────────────────────────────────────────────────────┐
  │ PRINTEMPS · SEMAINE 2 · AN 3   🍖 120 (+14)  🪵 46 (+6) … │  barre des ressources + prévisions
  ├─────────────────────────────────────────┬─────────────────┤
  │                                         │ panneau :       │
  │        la carte (défile, zoome)         │ - case choisie  │
  │   colons dessinés à leur poste,         │   (bâtiment,    │
  │   rendements écrits sur la carte,       │   postes + / −, │
  │   chantiers avec leur barre             │   état)         │
  │                                         │ - ou construire │
  ├─────────────────────────────────────────┴─────────────────┤
  │ ⚠ alerte du tour            [POSTES] [COLONS]  [SEMAINE ▶]│
  └───────────────────────────────────────────────────────────┘
  ```
- **Toucher une case vide** → le panneau propose les bâtiments possibles sur ce terrain (avec coût et effet) ; toucher un bâtiment → ses postes (+ / −), sa production, ses problèmes.
- **POSTES** : la liste compacte de tous les postes avec + / − (proposition B de la maquette), pour régler toute la colonie d'un coup.
- **COLONS** : la liste des colons (talent, caractère, âge, santé, poste), pour en déplacer un précisément.
- Texte : jamais en dessous de 8 px logiques ; chiffres et titres en Press Start 2P, textes longs en VT323 (plus lisible).
- Compte rendu du tour : animation sur la carte (ressources qui montent des bâtiments, crue qui monte, feu qui gagne), puis 3 à 6 **cartes** d'événements avec icône.

## 9. Résolution d'un tour (ordre)
1. Production de chaque bâtiment selon ses postes, les talents, les outils, la saison, le bonheur.
2. Chantiers (points de travail).
3. Exploration (cases dévoilées, lieux trouvés).
4. Consommation : nourriture (variété), bois de chauffage (hiver), usure des outils et vêtements.
5. Santé, bonheur, âges.
6. Événements de nature (tirés de la graine, selon la saison et l'année), annonces pour la semaine suivante.
7. Départs et arrivées.
8. Fin d'année : bilan de l'année (une carte « AN 3 TERMINÉ : 24 colons, 3 nouveaux bâtiments… »).

## 10. Score, classements, île du jour
- Score : **années tenues × 100 + population maximale × 10 + bâtiments + bonheur moyen**. Classements `ile` : `best` (score), `annees` (années tenues), `population` (population maximale). Les anciens tableaux de la première version (`best`, `evasions`, `daily:`) sont remplacés (prévoir une remise à zéro douce : nouveaux noms de tableaux si besoin).
- **Île du jour** : la même île, les mêmes événements pour toute la famille, **en 3 ans** (48 tours) : score à la fin de la 3e année ; une seule tentative classée (règle des défis du jour, `ile.dailyTry`).
- Sauvegarde de la partie à chaque tour (`ile.run`, avec un numéro de version et `migrate()`).

## 11. Technique
- `ile/index.html` (affichage, commandes) + **`ile/regles.js`** (logique pure : génération de l'île, tour, économie, nature ; sans DOM ni `localStorage`, chargée aussi par Node, comme `nebula/regles.js`). Ajouter `regles.js` à `FILES` de `sw.js`.
- Hasard reproductible : `H(graine, tour, …)` pour les événements, indépendant des choix du joueur (indispensable pour l'île du jour).
- Rendu : carte dessinée une fois en image (terrain), puis à chaque image seulement les colons, l'eau, le feu ; textes et panneaux à la taille réelle de l'écran (leçon de Nebula : ne pas agrandir de grandes images à chaque trame).
- `window.Ile` exposé pour les tests ; **pilote automatique** sous Node (`outils/ile-colonie.js`) : années tenues selon la stratégie, pour régler la difficulté.

## 12. Étapes (une conversation chacune)
1. **Maquette** de l'écran en paysage (carte générée, panneau, postes, prévision, une crue et un hiver simulés) → validation du style et de l'ergonomie. *Faite le 16/10* : https://claude.ai/artifact/3CAZn4Hd3qFu2TMAB3i8LX — source `maquettes/colonie-paysage.html` (générateur d'île réutilisable tel quel dans `ile/regles.js` : bruit de valeur à 3 octaves + masque elliptique, rivière = plus longue descente depuis les collines, berges, marais à l'embouchure ; on est à l'an 2, 16 colons). **Retours du 16/10** : taille de l'île 24 × 14 validée ; couleurs validées ; panneau à droite **rétractable** ; **direction 32 bits ou plus**, textes et boutons nets « comme Nebula ». **2e version** (même lien) : carte sur toute la largeur, volet de 214 px qui glisse et se replie (poignée, ✕ ; s'ouvre au toucher d'une case et décale la carte) ; terrain en cases de **32 px** calculé pixel par pixel (coordonnées déformées par un bruit pour des rivages et une rivière irréguliers, relief ombré tiré de l'altitude, teintes par paliers), arbres, rochers et sommets dessinés un par un, bâtiments 32 × 32 avec contour et ombre ; textes en **polices lisses** (Signika pour l'interface, Alegreya Sans SC pour les titres, majuscules accentuées possibles) dessinés à la résolution de l'écran. Reste à trancher : volet ouvert au toucher ou seulement à la poignée, plans à trouver ou tout débloqué.
2. **Le moteur** : génération de l'île, bâtiments, postes, ressources, saisons, colons, sauvegarde ; écrans principaux.
3. **La nature** : crue, incendie, hiver rude, épidémie, loups… ; compte rendu animé ; équilibrage avec le pilote automatique ; intégration (classements, accueil, transfert, docs, artefact).

## 13. Questions encore ouvertes
- Taille de l'île et nombre de bâtiments au départ (tout débloqué, ou plans à trouver dans les ruines ?).
- Commerce avec des bateaux marchands (le port) : utile ou de trop ?
- Faut-il un objectif par année (« avoir 20 colons à la fin de l'an 2 ») pour guider les débutants ?

## Artefact
Publier la colonie au lien de l'ancienne Île (décision du 16/10) : https://claude.ai/artifact/9AnNRRCCBu4pgYh35UwrPb

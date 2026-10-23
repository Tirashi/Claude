# La Boutique de cartes — cahier des charges

Jeu de gestion : on tient une petite boutique de cartes à collectionner, en 3D, pendant une année de 52 semaines.
Idée de départ : `IDEES.md` (jeux de gestion, 15/10). Maquettes : `maquettes/boutique-de-cartes.html` (1) et
`maquettes/boutique-de-cartes-2.html` (2), fabriquées par `outils/boutique-maquette/fabriquer.py`.

## 1. Décisions de l'utilisateur
- Boutique en 3D avec les modèles **Kenney** (Mini Market, Mini Characters, Furniture Kit, CC0) : « vraiment sympa » (22/10).
- **Pas de vue comptoir** (maquette 1, B) : les clients circulent, achètent et paient seuls.
- La boutique **pivote** ; on l'**aménage** (acheter, poser, tourner, déplacer, revendre les meubles) et on l'**agrandit** (terrain « À VENDRE ») : maquette 2 validée telle quelle (23/10).
- **Cartes : mise en page 1, « cadre coloré »** (23/10) : monstres 32 × 32 de **Dungeon Crawl** (comme La Dernière Lanterne) dans les morceaux de **Pixel Card Assets** (cafedraw, CC0) ; le fond dit l'élément, le cadre de l'image et le bandeau du nom disent la rareté.
- **Ouverture d'un booster** en CSS 3D (maquette 1, C, gardée dans la 2) : la carte la plus rare en dernier, reflet holo, bilan « ouvert contre fermé ».

## 2. Principe
- **But** : en 52 semaines, faire d'une boutique minuscule la référence de la ville. **Rembourser le prêt** de départ (2 000 €) avant la **semaine 26**, puis avoir la plus grande **valeur** possible à la semaine 52.
- **Valeur** (le score) = argent en caisse + stock au prix d'achat + cartes à l'unité (vitrines et réserve) à leur cote + meubles à moitié prix + agrandissements à moitié prix − ce qui reste du prêt.
- **Défi secondaire** : compléter le **classeur** (toutes les cartes d'une extension, jusqu'à la légendaire). Un classeur complet donne de la **réputation** et un bonus de valeur.
- Une partie dure environ une heure, en plusieurs fois : sauvegarde automatique à chaque semaine.

## 3. Le déroulement d'une semaine
1. **Lundi matin (préparer, temps arrêté)** : la livraison du grossiste arrive. On peut :
   - commander au **grossiste** (livré le lundi suivant) ;
   - fixer les **prix** (boosters, cartes des vitrines) ;
   - ranger les cartes dans les **vitrines** ;
   - **ouvrir des boosters** du stock ;
   - **aménager** et **agrandir** ;
   - inscrire la boutique au **tournoi** du samedi.
2. **La semaine (du mardi au samedi)** : la boutique vit en 3D, en accéléré (environ 40 s, ×2 et ×4 possibles, pause). Les clients entrent, vont aux meubles, achètent, passent à la caisse (« +12 € »). Quelques **rencontres** arrêtent le temps : un client vend sa collection, un collectionneur cherche une carte précise, un marchand négocie (§ 7).
3. **Samedi après-midi : le tournoi** (s'il y a au moins une table) : résumé animé, gagnants, lots remis (§ 9).
4. **Dimanche : le bilan** : recettes, dépenses (loyer, livraisons), les **cotes qui bougent** (flèches vertes et rouges), la réputation, l'événement de la semaine suivante annoncé à l'avance quand c'est possible.

## 4. Le jeu de cartes inventé : « CRÉATURES »
- **5 éléments** : FEU, EAU, PLANTE, FOUDRE, OMBRE. **5 raretés** : commune, peu commune, rare, épique, légendaire.
- **Extensions** : une au départ, puis une nouvelle à peu près **toutes les 10 semaines** (5 dans l'année). Chaque extension : **40 cartes** (20 communes, 10 peu communes, 6 rares, 3 épiques, 1 légendaire), générées à la **graine** de la partie : nom fait de syllabes, élément, monstre, ATK, PV, cote de base.
- **Monstres** : la planche de la maquette (65) est agrandie à environ **150 monstres** de Dungeon Crawl, rangés par élément, pour que les 200 cartes de l'année se répètent peu. Une légendaire a toujours un monstre qui n'apparaît nulle part ailleurs.
- **Booster** : 5 cartes de l'extension (3 communes, 1 peu commune, 1 rare ou mieux : épique 1 fois sur 5, légendaire 1 fois sur 40).
- **Cote** de chaque carte = base de la rareté × popularité (la « méta » : un élément à la mode, les cartes jouées au tournoi) × rareté réelle (les cartes que plus personne ne trouve prennent de la valeur quand l'extension n'est plus vendue). Elle bouge chaque dimanche, de quelques pourcents ; plus fort lors des événements (§ 10).

## 5. Le grossiste et le stock
| Article | Prix d'achat | Prix conseillé |
|---|---|---|
| Booster (de l'extension en cours ou d'une ancienne, tant qu'il en reste) | 2,50 € | 4 € |
| Présentoir de 24 boosters | 54 € | (se vend booster par booster) |
| Coffret découverte (2 boosters + 1 carte promo) | 9 € | 15 € |
| Pochettes de protection | 1 € | 3 € |
| Classeur | 5 € | 12 € |

- Livraison le lundi suivant. Rupture de stock : les clients repartent les mains vides (et la réputation baisse un peu).
- Les boosters d'une **ancienne extension** ne se commandent plus au bout de 20 semaines : ceux qui restent en stock prennent de la valeur.
- **Vendre fermé ou ouvrir** : un booster fermé rapporte une marge sûre ; ouvert, il donne 5 cartes à mettre en vitrine (souvent moins de 4 €, parfois beaucoup plus). C'est le pari central du jeu.

## 6. Vendre
- **Rayon de boosters** : 3 sortes de produits par rayon (boosters, coffrets, accessoires). Prix réglable par produit, avec la marge affichée.
- **Vitrine basse** : 8 places pour des cartes à l'unité. **Grande vitrine** : 4 places, pour les cartes de valeur (rare et mieux) ; elle attire les collectionneurs.
- Prix d'une carte : en pourcentage de sa cote, avec des boutons simples (−10 %, à la cote, +10 %, +25 %). Un client achète si le prix est sous sa limite (qui dépend de son type, de son humeur et de la réputation).
- **Étagère à classeurs** : vend classeurs et pochettes.
- **Réserve** : les cartes qui ne sont pas en vitrine (sans limite) ; le classeur personnel (cartes gardées, jamais vendues automatiquement).

## 7. Les clients
| Client | Ce qu'il veut | Particularité |
|---|---|---|
| L'enfant (argent de poche) | Boosters, cartes communes de son élément préféré | Nombreux le mercredi et pendant les vacances |
| Le joueur de tournoi | Les cartes fortes de la méta | Vient surtout s'il y a un tournoi |
| Le collectionneur | Une carte précise (rare et mieux) | Paie cher ; rencontre : « Vous auriez un VOLTAX ? » |
| Le marchand | Acheter en lot, à bas prix | Rencontre : il négocie (trois offres, on accepte ou non) |
| Le vendeur de collection | Vendre ses cartes | Rencontre : un lot à un prix ; parfois des **fausses cartes** |

- **Affluence** = base de la semaine × réputation × **attrait** de la boutique (chaque meuble en donne : vitrines, tables, plantes, lampes) × événements. La taille de la boutique limite le nombre de clients en même temps.
- **Fausses cartes** : dans un lot à vendre, on peut retourner chaque carte et la regarder à la **loupe** ; une fausse a un défaut visible (mauvais cadre pour sa rareté, couleur de fond qui ne va pas avec l'élément, numéro qui dépasse 40, nom mal écrit). Une fausse vaut 0 ; en remettre une en vitrine fait baisser la réputation si un client s'en aperçoit.

## 8. Aménager et agrandir (comme la maquette 2)
- Meubles : rayon de boosters 80 €, vitrine basse 120 €, grande vitrine 220 €, table de tournoi 150 €, étagère à classeurs 60 €, plante 15 €, lampadaire 25 € ; la caisse est fixe dans le catalogue (on peut la déplacer, pas la vendre). D'autres meubles débloqués en cours d'année (borne d'arcade, présentoir de figurines, tapis de jeu, affiche géante), à fixer en session 1.
- On ne peut pas boucher le chemin : un meuble qui empêcherait les clients d'aller à la caisse ou à un autre meuble est refusé (fantôme rouge).
- Agrandissements : 6 × 5 → 8 × 5 (900 €) → 8 × 7 (1 600 €) → 10 × 7 (2 600 €). Un agrandissement augmente le **loyer** de la semaine.
- Revente des meubles à moitié prix.

## 9. Le tournoi du samedi
- Il faut au moins une table (une table = 2 joueurs, donc 4, 8 ou 12 joueurs selon les tables).
- Frais d'inscription réglables (0 à 5 €) ; **lots** pris dans le stock (boosters, une carte de la vitrine).
- Effets : plus de joueurs de tournoi dans la semaine qui suit, la réputation monte si les lots sont généreux, et les cartes jouées par les finalistes voient leur cote monter le dimanche.

## 10. Événements (un par semaine au plus, tirés à la graine)
- **Carte interdite** au tournoi : sa cote est divisée par 3.
- **Vidéo d'un vidéaste** : une carte voit sa cote multipliée par 3, la ruée des clients.
- **Rupture chez le grossiste** : un article non livré cette semaine.
- **Réédition** d'une ancienne extension : ses boosters reviennent, les cotes de ses cartes baissent.
- **Vacances scolaires** (hiver, printemps, été, Toussaint) : plus d'enfants. **Noël** : semaines 48 à 51, ventes fortes.
- **Sortie d'une extension** : file d'attente le premier jour, précommandes possibles la semaine d'avant.
- **Concurrent** : une boutique ouvre en ville pendant quelques semaines (moins de clients, sauf réputation forte).

## 11. Le prêt, la fin, le score
- Prêt de 2 000 € au départ. On rembourse quand on veut (bouton dans le bilan). À la semaine 26, la banque prend ce qui reste **plus 20 %**. Si la caisse ne suffit pas : **faillite**, fin de partie, avec un score réduit (la valeur, moitié).
- Pas de découvert : un achat qui ferait passer la caisse sous zéro est refusé (le loyer, lui, peut la faire passer sous zéro ; deux dimanches de suite sous zéro = faillite).
- À la semaine 52 : bilan de l'année (valeur, meilleure carte ouverte, classeurs complets, nombre de clients) et classement.

## 12. Écrans
- **La boutique** (écran principal, maquette 2) : barre du haut (semaine, jour, caisse), boutons ⟲ ⟳, boutons du bas selon le moment : le lundi GROSSISTE, PRIX, VITRINES, BOOSTERS, AMÉNAGER, puis OUVRIR LA BOUTIQUE ; pendant la semaine : vitesse et pause.
- **Grossiste** : liste d'articles, quantités avec − et +, total, livraison lundi.
- **Vitrines** : les places de chaque vitrine, les cartes de la réserve à glisser dedans, le prix en pourcentage de la cote.
- **Ouvrir un booster** (maquette) : on choisit combien ouvrir ; « tout ouvrir » pour aller vite.
- **Le classeur** : pages de 9 cartes par extension, cases vides grises avec leur numéro, cote de chaque carte.
- **Rencontres** (§ 7) : fenêtre avec le client (portrait dessiné à partir de son modèle 3D) et ses cartes.
- **Bilan du dimanche** et **fin d'année**.

## 13. Rendu
- 3D Three.js r128, caméra orthographique qui pivote autour de la boutique, murs du devant cachés ; personnages animés Kenney (marche, attente, prendre, payer, s'asseoir).
- Interface : Fredoka (texte), Luckiest Guy (titres, montants) ; cartes : Pixelify Sans, agrandies sans lissage (× 3).
- Le soir du samedi, lumière plus chaude (les lampadaires servent).

## 14. Sons
Bruitages Kenney (CC0, déjà utilisés : clics, caisse, cartes), un petit jingle d'ouverture de booster, une musique de boutique douce (à choisir dans un banc d'écoute, comme pour La Dernière Lanterne). À valider au moment de la session 3.

## 15. Technique
- Dossier `boutique/` : `index.html`, `regles.js` (état JSON et règles pures, hasard par flux à la graine, aussi chargé sous Node), `cartes.js` (génération des extensions, cotes), `clients.js` (affluence, types, rencontres, fausses cartes), `modeles.js` (GLB Kenney en base64 et atlas, fabriqué par un outil), `images.js` (planche des monstres et des cadres), `monde3d.js` (boutique, meubles, clients, caméra), `dessin-cartes.js`, `interface.js`, `sons.js`, `jeu.js`.
- Simulateur `outils/boutique-simulateur.js` (parties automatiques avec plusieurs stratégies : tout vendre fermé, tout ouvrir, mélange ; pour régler les prix, les cotes et le prêt), ajouté à `verifications.js`.
- Le temps de la semaine est réglé par les règles (liste d'achats tirée d'avance) puis **rejoué** en 3D : la 3D ne décide rien, comme la bataille de Bannières.
- Sauvegardes `boutique.run`, `boutique.best`, `boutique.opts`, `boutique.tuto`. Objet de test `window.Boutique`.
- Classement `boutique` : `best` (valeur à la semaine 52). Défi du jour : à décider (§ 17).
- Crédits : Kenney (Mini Market, Mini Characters, Furniture Kit), Dungeon Crawl Stone Soup, Pixel Card Assets (déjà dans `credits/`).

## 16. Plan de travail
| Session | Contenu | Modèle |
|---|---|---|
| 1 | `regles.js`, `cartes.js`, `clients.js`, simulateur, équilibrage (prix, cotes, prêt, affluence) | Opus |
| 2 | La boutique en 3D : outil des modèles, monde, aménagement, agrandissements, clients qui rejouent la semaine | opusplan |
| 3 | Écrans (lundi, grossiste, vitrines, classeur, rencontres, bilan), boosters, sons, sauvegarde, classement, accueil, artefact | opusplan |

## 17. Points à confirmer par l'utilisateur
1. Durée : **52 semaines** (environ une heure) ou une année plus courte (26 semaines, prêt à la semaine 13) ?
2. **Défi du jour** : une « semaine du jour » (même boutique de départ et mêmes clients pour toute la famille, score = recettes de la semaine) ? Ou pas de défi du jour ?
3. **Faillite** possible (§ 11) ou on la retire pour garder le jeu détendu ?
4. Les **fausses cartes** : à la loupe (§ 7) comme prévu ?

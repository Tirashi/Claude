# Cahier des charges — TERRES D'ÉVEIL (nom de travail)

> Cahier des charges de l'utilisateur reçu le 08/11/2026 (recopié tel quel plus bas, § « Cahier reçu »). Avant lui : les **adaptations à la Ludothèque** et l'état du chantier.
> Dossier prévu : `terres-d-eveil/`. Modèle conseillé : Opus pour le moteur (économie, agents, prestige), opusplan pour les sessions de contenu.

## 1. État du chantier
- **08/11 — maquette 1** : https://claude.ai/artifact/HGXY4qdbJLhXCgGw3bJiJ7 — source `maquettes/terres-d-eveil.html` (images en `@@nom@@`), page fabriquée par `python3 outils/terres-maquette/fabriquer.py <sortie>` (met en base64 les images Tiny Swords de `bastion/img/` ; la page fabriquée ne va pas dans le dépôt). Jouable : le pionnier seul (toucher arbres, buissons, eau = +1), accueillir des villageois (vivres + bois, coût ×1,2), métiers bûcheron / cueilleur / pêcheur avec + et − (aller, travailler, rapporter au feu, « +3 » qui s'envole), manger (baies et poisson ; les deux = moral 110 %, faim = tout ralentit), cabanes (+3 places, chantier de 20 s), paliers campement → hameau (3) → village (8, tour de guet), jour et nuit (90 s), bouton ×10. Trois directions :
  - **A · Tiny Swords** : le pack déjà acheté pour Bastion (villageois animés hache / couteau / fagot / viande, moutons, maisons, chantier, tour) ; eau, écume, pontons et tente dessinés par le code ; feu et fenêtres allumés la nuit ; panneau de bois à onglets VILLAGEOIS / CONSTRUIRE.
  - **B · 16 bits de la Ludothèque** : tout dessiné par le code en gros pixels (toile 160 × 200 agrandie ×2), Press Start 2P, villageois colorés selon le métier, liste d'incrémental classique.
  - **C · Le carnet de la vallée** : carte à l'encre et à l'aquarelle sur parchemin (toponymes, rose des vents), personnages au trait, la partie racontée dans une **chronique** (« Jour 3 : Berthe se fait cueilleur »).
  - **À choisir** (et retours sur le rythme, l'écran en portrait, le panneau du bas).
- Prochaines étapes après le choix : décisions du § 2, puis **simulateur d'équilibrage d'abord** (`outils/terres-simulateur.js`, ère 1), puis session 1.

## 2. Adaptations à la Ludothèque (proposées le 08/11, à confirmer)
Le cahier reçu est écrit pour un projet seul ; dans la Ludothèque, quelques points changent :

| Cahier reçu | Dans la Ludothèque | Pourquoi |
|---|---|---|
| Vanilla JS **ou React + Vite**, build par GitHub Actions | **Vanilla JS sans build**, scripts classiques (`regles.js` pur et testable sous Node, `jeu.js` dessin et interface, `donnees.js` bâtiments et ressources) | Règle du dépôt : le fichier poussé est celui que joue le téléphone ; GitHub Pages publie déjà le site. |
| Structure `src/game`, `src/render`, `src/ui` | Même découpage, mais en quelques fichiers dans `terres-d-eveil/` (comme Bastion) | Pas de modules ES ni de npm. |
| PC d'abord, responsive mobile | **Téléphone d'abord** (appli PWA Android), en portrait ; le PC suit | C'est là que la famille joue. |
| Assets Kenney / itch.io CC0 | Selon la maquette : Tiny Swords (déjà acheté, déjà crédité), ou dessiné par le code | Règle des crédits ; images rangées dans le dossier du jeu. |
| Sauvegarde `localStorage` + export/import JSON | `localStorage` (clé `terres.partie`) + le **transfert `LUDO1-`** de l'accueil (qui sert déjà d'export) | Déjà en place pour tous les jeux. |
| Gains hors ligne plafonnés | Gardé : calculés au chargement, plafond 8 h, récap au retour | Comme le temps réel doux du Clan / la Mine sans fond. |
| Pas de compte | Gardé ; **classement facultatif** de la famille (par ex. population maximale ou nombre de Lois), à décider | Les autres jeux en ont un. |
| Simulateur à l'étape 12 | **Simulateur dès la session 1** (`outils/terres-simulateur.js`, dans `verifications.js`) | Leçon de Bastion, Duché, Bannières : régler les nombres avant de les coder. |
| Chemins A* | Chemins simples (ligne droite + contournement des bâtiments) au début ; A* seulement si la carte en a besoin | Petite carte. |

**Points communs avec d'autres chantiers** (à garder en tête, pas de fusion proposée) : **la colonie** (`ile/`, tour par tour, la nature est l'ennemie, cdc `specs/colonie.md`) ; **le Clan du fjord** (en pause : les graphismes à créer l'ont bloqué → ici, choisir un style qui ne demande pas de tout dessiner) ; **la Mine sans fond** (incrémental, `IDEES.md`). Terres d'Éveil s'en distingue par le **temps réel incrémental** (production qui continue appli fermée) et le **prestige par les Lois**.

**Questions ouvertes** : style (maquette) ; classement ou pas ; durée visée (le cahier dit 25 à 40 h ; sur téléphone, en sessions courtes, ça tient si l'idle fait sa part) ; nom définitif.

---

# Cahier reçu (08/11, tel quel)

**Genre** : jeu incrémental / gestion de colonie, navigateur web (PC d'abord, responsive mobile)
**Hébergement** : GitHub Pages (100% statique, aucun backend)
**Ambiance** : médiéval-fantasy, contemplatif, lente progression visible sur une carte vivante

## 🎯 Vision

Le joueur commence seul : un pionnier qui clique pour cueillir, pêcher et abattre du bois.
Peu à peu il recrute des villageois, leur assigne des métiers, construit des bâtiments et
développe des chaînes de production de plus en plus complexes. La carte raconte l'histoire :
chaque palier de croissance se voit, chaque villageois animé vaque à ses occupations.

**Piliers de design** :
1. **Lent et gratifiant** : pas de prestige agressif, des coûts exponentiels doux, toujours
   "une petite amélioration à acheter dans 2 minutes".
2. **La carte est le jeu** : les nombres s'incarnent en bâtiments, personnages et animations.
3. **Les chaînes de production** : transformer des ressources brutes en produits finis
   donne des bonus et satisfait les besoins de la population.
4. **La magie comme couche tardive** : une deuxième économie qui se débloque quand le
   village est installé.

## 🔁 Boucle de jeu

1. **Clic manuel** : récolter du bois / baies / poisson (feedback immédiat : "+1" flottant,
   animation du personnage, petit son discret).
2. **Recrutement** : attirer un villageois coûte de la nourriture + des ressources. Chaque
   villageois a besoin d'être nourri (et plus tard : vêtu, logé, diverti).
3. **Assignation** : le joueur attribue un métier à chaque villageois (bûcheron, fermier,
   pêcheur...). Le villageois apparaît sur la carte et se déplace vers son lieu de travail.
4. **Construction** : bâtiments = multiplicateurs et déblocs. Un bâtiment doit être
   construit avec des ressources (certaines issues de chaînes).
5. **Besoins de population** : la population croissante exige de plus en plus de types de
   biens. Satisfaits = bonus de moral (multiplicateur global) ; insatisfaits = production
   ralentie.
6. **Idle / offline** : la production continue hors-ligne (plafonnée, avec un récap au
   retour).

## 📦 Ressources et chaînes de production

### Ressources de base (Phase 1)
- **Bois** (clic puis bûcherons)
- **Baies / gibier** (clic puis cueilleurs)
- **Poisson** (clic puis pêcheurs)
- **Pierres** (carrière, un peu plus tard)

### Exemple de chaîne complète

```mermaid
flowchart LR
  fermier["🧑‍🌾 Fermier"] --> champ["🌾 Champ"]
  champ --> ble["Blé"]
  ble --> meunier["🧑‍🔧 Meunier"]
  meunier --> moulin["🏗️ Moulin"]
  moulin --> farine["Farine"]
  farine --> boulanger["🧑‍🍳 Boulanger"]
  boulanger --> four["🔥 Four à pain"]
  four --> pain["Pain"]
  pain --> nourrir["Nourrir les habitants"]
```

Autres chaînes prévues (même logique, débloquées par paliers) :

| Chaîne | Brute | Transformation 1 | Transformation 2 | Produit final | Sert à |
|---|---|---|---|---|---|
| Vêtements | Mouton → laine | Fileuse → fil | Tisserand → tissu | Vêtements | Besoin "confort" des habitants |
| Construction | Bois + pierre | Scierie → planches | Charpentier → charpente | Structures | Construire plus vite / bâtiments avancés |
| Pêche | Poisson | Fumoir → poisson fumé | Marché → provisions | Provisions longues | Nourrir de grosses populations |
| Boisson | Orge | Brasseur → bière | Taverne | Bière | Besoin "morale" des habitants |
| Savoir (tardif) | Herbes rares | Alchimiste → essences | Bibliothèque → grimoires | Essences, grimoires | Débloquer la magie |

**Principe de design des chaînes** : chaque transformation donne un bonus multiplicateur
supérieur à la simple vente de la ressource brute, mais le joueur doit arbitrer ses
villageois entre production brute et transformation.

## 👥 Population et besoins

La population a des besoins qui se débloquent par paliers. Chaque habitant consomme
par tick :

| Palier population | Besoins | Effet si satisfait | Effet si non satisfait |
|---|---|---|---|
| 1-5 | Nourriture (base) | Croissance possible | Pas de recrutement |
| 6-15 | Nourriture variée (pain OU poisson OU gibier) | +10% production globale | Production -10% |
| 16-40 | Vêtements | +10% supplémentaire | Croissance stoppée |
| 41-80 | Logement (cabane → maison en pierre) | +10% | Moral baisse lentement |
| 81+ | Morale (taverne, bière, fête) | +10% | Émeutes visibles ? (v1.2) |

Le **moral global** est le multiplicateur central du jeu : il encourage à diversifier
plutôt qu'à spammer une seule ressource.

## 🧙 Couche magie (mi-partie)

Débloquée via la chaîne "savoir" (alchimiste + bibliothèque + grimoires) :

- **Cristaux** : ressource magique rare, extraite dans la forêt profonde puis la grotte.
- **Sorts passifs** : achetés avec des cristaux, effets lents et permanents
  (croissance des champs +5%, pluie bénéfique périodique...).
- **Le mage** : villageois spécial, unique, qui se balade et "enchanté" les bâtiments
  proches (zone d'effet visible sur la carte).

## ⚖️ Bottlenecks et prestige : les Lois

Le prestige n'est pas un reset arbitraire : c'est **promulguer une Loi** qui transforme
la colonie en véritable ville, puis **fonder une nouvelle colonie** sur une carte plus
grande avec un nouveau nom. Chaque ère = un cycle prestige.

### Les bottlenecks (verrous naturels, pas des murs artificiels)

1. **Place limitée** : la carte d'une ère a un nombre de tuiles constructibles fixe
   (le village ne peut pas s'étendre au-delà de sa vallée). Quand toutes les bonnes
   terres sont prises, la croissance plafonne → le joueur comprend *visuellement* qu'il
   faut passer à l'échelle supérieure.
2. **Population plafonnée par le niveau de ville** : le statut juridique actuel limite
   le nombre d'habitants. Le village ne peut pas dépasser N âmes sans charte.
3. **Chaînes verrouillées par niveau** : certains bâtiments (moulin, taverne, bibliothèque)
   exigent un statut de ville plus élevé, ce qui plafonne les bonus de moral.
4. **Rendements décroissants** : au-delà de X bâtiments du même type sur une carte,
   chaque ajout rapporte moins (sur-exploitation des ressources locales).

### Les Lois (améliorations permanentes, conservées entre prestiges)

Chaque loi coûte des ressources de fin de partie + un seuil de population. Exemples :

| Loi | Ère requise | Effet permanent |
|---|---|---|
| Charte du Village | 1 | Débloque les cartes "hameau", +10% production de base, garde 1 villageois au restart |
| Loi des Guildes | 2 | Les métiers de transformation coûtent -20%, débloque le bourg |
| Édit du Commerce | 3 | Marché disponible dès le début, conversion de ressources +25% |
| Droit des Savants | 4 | Bibliothèque dès le début, la magie se débloque 2 fois plus vite |
| Grandes Armoiries | 5 | +1 tuile de départ partout, toutes les chaînes +15% |

### Les ères et les cartes

| Ère | Statut atteint | Taille de carte | Pop. max | Nouveau contenu |
|---|---|---|---|---|
| 1 | Campement → Village | 24×24 | ~20 | Chaînes de base + pain + vêtements |
| 2 | Bourg | 32×32 | ~45 | Bière, planches, marché |
| 3 | Petite ville | 40×40 | ~80 | Magie, cristaux, mage |
| 4 | Cité | 48×48 | ~150 | Chaînes magiques, prestige sorcier |
| 5 | Capitale | 56×56 | ~250 | Contenu final, monuments |

À chaque prestige : nouvelle carte (nom généré ou choisi par le joueur), nouveau
biome léger (vallée → côte → forêt profonde → montagne → plaine capitale) pour la
fraîcheur visuelle, et les lois choisies s'appliquent dès le départ.

### Équilibrage : est-ce qu'il y a assez de place ?

- **Durée cible par ère** : Ère 1 ~2-3h, puis 4-6h, 6-10h, 10-15h (croissance classique
  des incrementals). Total ~25-40h pour une complétion, ce qui est raisonnable.
- **Assez de contenu ?** 5 ères × (5-8 nouveaux bâtiments + 2-3 chaînes) ≈ 40-50 items
  de contenu à définir : c'est dense mais data-driven, donc gérable.
- **Anti-grind** : si le joueur atteint le bottleneck trop tôt, la loi doit être
  *accessible* (achat en 15-30 min de farm après le cap), sinon frustration.
- **À simuler avant de coder** : un petit script de simulation (rendements, coûts,
  population) par ère pour vérifier que les caps arrivent au bon moment — ajouter au
  roadmap une étape "simulateur d'équilibrage".

## 🗺️ Paliers de croissance (carte)

| Palier | Population | Éléments visuels ajoutés |
|---|---|---|
| Campement | 1-2 | Feu de camp, tente, sentiers de terre |
| Hameau | 3-7 | Cabanes en bois, puits, premier champ clôturé |
| Village | 8-20 | Place centrale, moulin à vent visible, chemins pavés, lanternes |
| Bourg | 21-45 | Maisons à étage, marché, église/tour de guet, rempart bas |
| Petite ville | 46-80 | Fontaine, routes pavées, tour du mage, parc |

Chaque palier est un **moment célébré** : petite animation de transition (villageois qui
s'assemblent, bannière, son).

## 🎨 Animations (priorisées)

**Indispensables (v1)** :
- Sprites des villageois qui marchent maison → travail → dépôt (chemins simples A*)
- "+X" flottants au clic et à chaque récolte
- Fumée de cheminées, construction progressive des bâtiments (échafaudage → terminé)
- Cycle jour/nuit teinté (lanternes qui s'allument)

**v1.1** : saisons légères (rendements modifiés, neige), poissons qui sautent, feuilles.
**v1.2** : météo (pluie), feux d'artifice aux paliers, visiteurs/merchants en carriole.

## 🛠️ Stack technique (contrainte GitHub Pages)

- **Vanilla JS ou React + Vite** — build statique déployé via GitHub Actions.
- **Rendu** : Canvas 2D (ou PixiJS si les besoins grandissent). Carte à tuiles 2D
  top-down, assets pixel art libres (Kenney, itch.io CC0).
- **Responsive** : carte à tuiles qui se scale ; sur mobile, zoom auto sur la zone active
  et UI en panneau bas déroulant.
- **Sauvegarde** : `localStorage` + export/import JSON (bouton simple, utile pour
  l'anti-frustration). Les gains offline calculés au chargement.
- **Pas de backend, pas de compte** : tout côté client.

### Structure de projet suggérée

```
src/
  game/
    state.js        # état global sérialisable (source de vérité unique)
    economy.js      # production, consommation, chaînes, moral
    population.js   # villageois, métiers, besoins
    buildings.js    # définitions des bâtiments (data-driven)
    save.js         # localStorage, export/import, offline gains
  render/
    map.js          # tuiles, caméra, zoom
    agents.js       # déplacement des villageois
    effects.js      # particules, "+1", jour/nuit
  ui/
    panels/         # menus, shop, recrutement
```

## 🗺️ Roadmap d'itération pour Claude Code

Travailler par petites étapes, une fonctionnalité jouable à la fois :

1. **Squelette** : page HTML, canvas, boucle de jeu (requestAnimationFrame), clic sur
   un arbre → bois, compteur, "+1" flottant.
2. **Économie de base** : coût exponentiel, premier bûcheron (production passive),
   sauvegarde localStorage.
3. **Carte + agents** : tuiles, un villageois sprite qui se déplace, dépôt de ressources.
4. **Chaîne pain** : fermier, champ, blé, moulin, farine, boulanger, pain. Besoin
   "nourriture variée".
5. **Recrutement & moral** : attirer villageois, assigner métiers, moral global.
6. **Paliers de croissance** : campement → hameau → village, animations de transition.
7. **Chaînes 2** : vêtements, construction (planches). Paliers bourg.
8. **Jour/nuit + particules + polish animations**.
9. **Magie** : cristaux, sorts passifs, mage.
10. **Prestige & Lois** : bottlenecks de place, promulgation de loi, restart sur
    nouvelle carte, arbre de lois permanent.
11. **Offline gains, export JSON, responsive mobile, deployment GitHub Actions.**
12. **Simulateur d'équilibrage** : script Node qui simule les 5 ères (rendements,
    coûts, caps de population) et affiche le temps réel jusqu'à chaque bottleneck.

**Conseils pour bien piloter Claude Code** :
- Donner l'état du jeu comme un objet JSON unique documenté (facilite les itérations).
- Garder les définitions de bâtiments/ressources dans des fichiers de données
  data-driven (ajouter un bâtiment = ajouter une entrée, pas de logique dispersée).
- Une session = une feature du roadmap ci-dessus, avec un test rapide dans le
  navigateur avant de passer à la suivante.
- Faire valider les formules d'équilibrage (coûts, rendements) avec un petit tableau
  ou script de simulation avant de les coder.

## 💰 Équilibrage (principes)

- Coût d'un bâtiment N : `base × 1.15^N` (croissance douce typique des incrementals).
- Chaque nouveau palier de chaîne ×2 la valeur du produit vs brut, mais coûte un villageois.
- Objectif de rythme : premier recrutement en ~2 min, premier palier (hameau) en ~20 min,
   village en ~2h de jeu actif ou idle.

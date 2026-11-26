# Flotte du bureau — cahier des charges (nom provisoire)

Chantier ouvert le 25/11, **cahier des charges rédigé le 26/11** après la maquette 5 (style **Relief** choisi). Idée de l'utilisateur, inspirée de *Desk Space: Idle Spacefleet clicker* (Shotgun Anaconda, Steam, 2026) : on s'en inspire sans le suivre (analyse du jeu d'origine en annexe A, historique des maquettes en annexe B). Dossier prévu : `flotte/`.

## 1. Décisions de l'utilisateur
- **Un incrémental qu'on regarde** : une petite flotte de vaisseaux travaille seule dans un système ; le joueur achète des vaisseaux et des améliorations, et peut simplement regarder (l'« aquarium spatial »).
- **Gains appli fermée** (25/11) : une **fraction** des gains du jeu ouvert ; **un niveau d'amélioration de prestige augmente cette fraction**.
- **Le jeu doit bien passer sur PC** (écran large, fenêtres, clavier) autant que sur le téléphone.
- **Colonisation naturelle** (25/11) : pas de mode séparé ; elle vient de l'exploitation de ressources de plus en plus loin (portée → zones → avant-postes).
- **Pas de classement** (25/11), donc pas de défi du jour classé.
- **Rendu** (maquette 4 validée le 26/11) : carte presque nue (astres en petits points nommés, routes pointillées, anneaux de portée), fenêtres flottantes repliables, trois ambiances de couleurs, plus lent qu'au départ (« la vitesse c'est ok »). **Pas de vue pixellisée** sur la carte.
- **Vaisseaux en Relief** (26/11) : sprites éclairés comme un relief (moteur de `commun/vaisseaux.js`, déjà utilisé par Nebula et Mineur de l'espace), visibles quand on zoome ; le dessin vectoriel de la maquette 4 « faisait IA » et est abandonné ; la 3D Kenney (maquette 5) est écartée.

## 2. Le jeu en une phrase
On commence avec cinq mineurs et trois marchands autour d'un petit QG ; les mineurs ramènent du minerai, les marchands le vendent, l'argent achète d'autres vaisseaux et des améliorations, et la **portée** du signal ouvre des zones de plus en plus lointaines (glace, cristal, iridium) où l'on pose des avant-postes ; quand tout est ouvert, on relance le système (**prestige**) avec des bonus permanents, dont une part des gains qui continue appli fermée. Calme, sans pub, sans énergie, sans attente forcée.

## 3. Boucle de jeu
1. Les **mineurs** partent d'un avant-poste vers un astéroïde, forent (2 s), rapportent le minerai à l'avant-poste le plus proche : gain à la livraison.
2. Les **marchands** font la navette entre un avant-poste et la planète-marché (**Prime**) : gain à l'arrivée.
3. Le joueur dépense : **vaisseaux** (mineur, marchand, patrouille), **améliorations** (moteurs, soute, portée du signal) ; achat par lot ×1 / ×10 / ×100 / max.
4. La **portée** ouvre une zone : nouvelle ressource plus rentable, nouvel avant-poste posé tout seul, carte qui dézoome. Les trajets s'allongent, donc le revenu par vaisseau baisse un peu : il faut plus de vaisseaux et de moteurs.
5. Des **pirates** passent de temps en temps ; les patrouilles les arrêtent et touchent une prime.
6. **Prestige** (§ 8) quand les quatre zones sont ouvertes.
Départ : 400 crédits, 5 mineurs, 3 marchands, zone 1.

## 4. Les vaisseaux
| Rôle | Rôle dans le jeu | Sprite Relief (existant) | Coût (n = déjà achetés) |
|---|---|---|---|
| Mineur | fore et livre le minerai | `d_mineur` | 20 × 1,08^n |
| Marchand | convoie vers Prime | `d_cargo` | 60 × 1,10^n |
| Patrouille | orbite autour du QG, tire sur les pirates | `u_garde` | 90 × 1,20^n |
| Pirate (ennemi) | traque un navire, vole jusqu'à 5 cr | `a_rodeur` | : |
- **Vitesse** : 15 px/s à l'échelle 1 pour les mineurs, ×1,15 pour les marchands, ×1,1 pour les pirates ; les orbites tournent à 0,007 × rayon^-1,5 rad/s (lentes mais visibles). Valeurs de la maquette 4, jugées bonnes.
- **Comportement** : un navire attend, part en ligne presque droite (léger arc) vers une destination qui bouge (les corps orbitent), arrive, attend (forage 2 s, quai 0,5 s), repart. Le cap suit le trajet.
- **Variété** (à faire) : 2 ou 3 coques par rôle et teintes légères, pour que la flotte ne soit pas uniforme (moteur de `commun/vaisseaux.js`).
- **Fiche d'un navire** (au toucher) : nom, matricule, mode (en vol, au travail, à quai), livraisons, gains cumulés ; la caméra le suit et zoome à 240 %.

## 5. Le système, les zones et la portée (colonisation naturelle)
| Zone | Anneau | Corps | Ressource | Gain par livraison d'un mineur |
|---|---|---|---|---|
| 1 Système central | 0,50 | QG, Cendre, Prime, 2 astéroïdes (Ast-1, 2) | fer | 4 |
| 2 Ceinture de glace | 0,74 | Géante, Orbite-G (avant-poste), Gla-1 et 2 | glace | 10 |
| 3 Champ de cristal | 0,97 | Relais 2, Cri-1 et 2 | cristal | 24 |
| 4 Bord du système | 1,22 | Bord du système, Iri-1 et 2 | iridium | 60 |
- **Portée du signal** (amélioration) : niveau 2 à 4 pour 120, 350, 900 crédits ; ouvre la zone suivante (fondu de 2,5 s), pose l'avant-poste, dézoome la carte (échelles 0,5 / 0,76 / 1,0 / 1,26).
- **Avant-postes** : relais de livraison (les mineurs déposent au plus proche, les marchands partent d'un avant-poste au hasard). Plus tard : niveaux d'avant-poste (éventuel).
- **Marchand** : 10 × (1 + 0,6 × niveau de portée) crédits par livraison à Prime.
- **Plus tard** (si le jeu s'y prête) : plusieurs systèmes à atteindre par la propulsion après le premier prestige ; pas retenu pour l'instant.

## 6. Améliorations (fenêtre « Ingénierie »)
| Amélioration | Effet | Niveaux | Coût |
|---|---|---|---|
| Moteurs | vitesse des navires +8 % par niveau | 10 | 80 × 1,8^n |
| Soute étendue | gains de chaque livraison +10 % par niveau | 10 | 120 × 1,9^n |
| Portée du signal | ouvre une zone (§ 5) | 3 | 120 / 350 / 900 |
- **La « Veille » n'est pas une amélioration à crédits** : dans la maquette elle l'était pour la démonstration ; elle devient une **amélioration de prestige** (§ 8).
- Les chiffres sont ceux des maquettes ; **à rééquilibrer au simulateur** (§ 12). Plus tard : matrice d'améliorations de maîtrise (laissée de côté), automatismes d'achat, expéditions, Bourse.

## 7. Pirates, patrouilles, alertes
- Un pirate apparaît toutes les 24 à 38 s (un seul à la fois), vise un navire, lui vole jusqu'à 5 crédits au contact, puis s'enfuit 5 s.
- **Patrouilles** : orbitent autour du QG ; dans un rayon de 90 px du QG chaque patrouille inflige 0,8 PV/s (pirate : 2 PV) ; **prime** de 12 crédits à la destruction.
- Alerte écrite dans la console ; pastille rouge autour du pirate.
- À améliorer : pirates utiles dès le début (épaves à récupérer, primes) plutôt que simple perte d'argent (leçon du jeu d'origine).

## 8. Prestige (proposition, à valider)
- **Nom provisoire : « Horizon »**. Disponible quand les quatre zones sont ouvertes et que la fortune cumulée dépasse un seuil (à régler).
- **Remet à zéro** : crédits, flotte, améliorations de crédits, zones. **Garde** : améliorations de prestige.
- **Donne des éclats** : ⌊√(fortune totale ÷ seuil)⌋, par exemple.
- **Améliorations de prestige** (achetées avec les éclats, permanentes) :
  - **Veille** : part des gains appli fermée, **25 % de base, +5 points par niveau, 75 % au maximum** (10 niveaux) ;
  - **Portée de départ** : repartir avec 1 zone de plus ouverte ;
  - **Gains** (+x % par niveau), **Moteurs de départ**, **Flotte de départ**.
- **Friction** (comme le jeu d'origine, qui en ajoutait à chaque prestige) : à décider ; piste simple : chaque Horizon augmente la fréquence des pirates et le coût de la portée.
- Le prestige ne doit pas être caché : à la première possibilité, une carte explique (leçon du jeu d'origine : les joueurs s'arrêtaient avant).

## 9. Appli fermée et fenêtre cachée
- **Appli fermée ou onglet longtemps absent** : au retour, gain = revenu moyen des 60 dernières secondes × durée × **part de veille**, **plafonné** (proposition : 24 h) ; une carte « Retour » le résume ; pas de pirates ni de pertes hors ligne.
- **Fenêtre seulement cachée ou couverte** (PC, deuxième écran) : `requestAnimationFrame` s'arrête ; au retour, **rattrapage à 100 %** par pas de 0,25 s jusqu'à 10 minutes ; au-delà, règle de la veille.
- Horodatage de la dernière sortie dans la sauvegarde ; le revenu moyen est enregistré avec elle.

## 10. Écran et interface
- **Une seule carte plein écran** (canvas 2D, ellipses aplaties pour l'orbite, DPR limité à 2) ; **zoom** 60 à 320 % (boutons, molette sur PC, pincement sur téléphone), anneaux de portée en pointillés, routes pointillées permanentes (une par couple astéroïde-avant-poste), noms et production à côté de chaque astre, `ZONE n` sur les anneaux.
- **Vaisseaux** : petits points sous 115 % de zoom, sprites Relief au-dessus (tailles 9 à 12 px à 100 %, jusqu'à ×2,6), flamme de réacteur quand ils volent.
- **Fenêtres flottantes repliables** : **Flotte** (crédits, revenu par seconde, nombre de navires, quantité d'achat, boutons d'achat), **Ingénierie** (améliorations, « Simuler 8 h d'absence » seulement pour la démo), **Console système** (journal), **fiche d'un navire**. Sur téléphone elles sont repliées et une seule s'ouvre à la fois ; sur PC, Flotte et Ingénierie sont ouvertes.
- **Cinéma** : bouton, et **automatique après 2 minutes** sans action ; l'interface s'efface, la caméra suit des navires au hasard ; un toucher la rend.
- **Ambiances** : nuit bleue (défaut), violette, phosphore ; choix dans un petit menu d'options.
- **Retour au menu** de la Ludothèque : dans les options du jeu, bouton `ludo-retour` (règle du 17/10).
- Police nette (pas de police pixel) pour tout ce qui est chiffre ou texte (règle du 22/11) : IBM Plex Mono pour les fenêtres, Inter pour la fiche.

## 11. Graphismes (Relief)
- **Vaisseaux** : sprites existants de `mineur-de-l-espace/sprites.js` (`d_mineur`, `d_cargo`, `u_garde`, `a_rodeur`, taille d'origine 32 à 46 px, réduits à l'affichage) ; nouvelles coques à fabriquer avec le moteur de `commun/vaisseaux.js` pour la variété et pour le **super-navire** (§ 13).
- **Avant-postes** : sprites de station existants (`d_satellite`, `d_radar`, `d_guidage`) ou nouveaux, plus petits que le QG.
- **Astres** : disques plats avec nom à petite échelle ; à fort zoom, option : planètes Deep-Fold de `mineur-de-l-espace/planetes.js` (déjà créditées) et astéroïdes de `NebulaVaisseaux.rock()`.
- **Étiquette de cartouche et jaquette** (règle du 22/11) : faites avec des captures du jeu.
- Aucune ressource nouvelle : pas d'entrée de crédits à ajouter tant qu'on ne sort pas du projet (l'entrée Kenney Space Kit de la maquette 5 restera pour mémoire, ou sera retirée si la 3D n'est pas gardée).

## 12. Technique, sauvegarde, simulateur
- **Fichiers** (scripts classiques, sans modules) dans `flotte/` : `index.html`, `style.css`, `regles.js` (données et formules, utilisables sans écran), `monde.js` (corps, orbites, zones), `flotte.js` (navires et états), `carte.js` (rendu), `interface.js` (fenêtres), `sprites.js` (sprites Relief extraits), `sauvegarde.js`, `sons.js`, `fiche.js`, `CLAUDE.md` du dossier (moins de 2 Ko).
- **Sauvegarde** : `localStorage` (clé `flotte-v1`), toutes les 10 s et à la fermeture ; transfert `LUDO1-` par la fiche (`transfert`) ; pas de classement donc pas de `LudoScores`.
- **Simulateur** `outils/flotte-simulateur.js` (sans écran, comme `terres-simulateur.js`) : joue une partie avec une stratégie d'achat simple, pour régler coûts, gains, durées de zone, seuil du prestige, et vérifier qu'une première partie dure **environ 2 à 3 heures actives** avant l'Horizon ; contrôle ajouté à `outils/verifications.js`.
- **Performances** : cible 400 navires à 60 i/s sur téléphone moyen, 1 000 sur PC ; routes dessinées une fois par couple (pas par navire) ; traînées et détails coupés sous un seuil de zoom ; options « graphismes bas » (sans traînées) ; leçon de l'éditeur d'origine : les trajectoires dessinées étaient le goulot.
- **Sons** (à décider) : aucun au début ; options sobres plus tard (achat, pirate, ouverture de zone), musique douce coupable.

## 13. Fusion et grandes flottes (plus tard)
**Fusion** (idée du jeu d'origine) : 100 navires d'un rôle deviennent 1 **super-navire** (sprite agrandi ×1,6) qui compte pour 100 dans les calculs ; sert à garder la fluidité. À faire seulement si les essais de performance le demandent.

## 14. Intégration à la Ludothèque
Voir la liste de contrôle de `specs/ludotheque.md` (skill `ajouter-un-jeu`) : dossier `flotte/` ; `fiche.js` (carte, meta, `enCours`, transfert, pas de classement ni de défi du jour) ; **démo** sur l'accueil au début (`demo: true`) ; étiquette et jaquette faites avec les images du jeu ; `sw.js` (`FILES`, `VERSION`) ; `README.md`, `CLAUDE.md`, `specs/ludotheque.md`, `specs/suivi.md`, `IDEES.md` ; test de fumée dans `outils/fumee.js` ; artefact (accord avant de créer un lien).

## 15. Étapes (sessions)
1. **Socle** : carte et orbites, zone 1, mineurs et marchands, gains, achats par lot, fenêtre Flotte, sauvegarde, veille fixe à 25 %, zoom, ambiances, PC et téléphone, sprites Relief ; démo sur l'accueil.
2. **Zones** : portée du signal, avant-postes, Ingénierie (moteurs, soute), console, fiche d'un navire et suivi de caméra, cinéma.
3. **Pirates** : patrouilles, primes, alertes.
4. **Prestige** : Horizon, éclats, améliorations permanentes dont la Veille, simulateur et équilibrage.
5. **Finitions** : sons, performances (super-navire si besoin), variété des coques, étiquette, jaquette, transfert, artefact.
Modèle : opusplan pour les sessions 1 à 3 et 5 ; Opus pour la session 4 (équilibrage).

## 16. Questions ouvertes
1. **Nom du jeu** (« Flotte du bureau » est provisoire).
2. **Prestige** : thème et nom (« Horizon »), seuil, friction ajoutée à chaque relance.
3. **Plafond d'absence** (24 h proposé) et part de veille (25 % à 75 %).
4. **Sons** : aucun, sobres, ou musique douce ?
5. Garder en vue : expéditions, Bourse, plusieurs systèmes (après le premier prestige), fusion en super-navire.

## Annexe A : le jeu d'origine (analyse du 25/11)
- **Principe** : jeu pensé pour un deuxième écran, surnommé « l'aquarium spatial » ; campagne de ~5 h où chaque prestige (surtout le deuxième et après) ajoute des complications, puis mode infini. 14 succès, Steam Cloud, 67 % d'avis positifs sur 137.
- **Boucle** : on achète des ships (mineurs → minerai, marchands → crédits, cargos → métal, drones…) qui volent seuls avec leurs trajectoires dessinées ; améliorations (efficacité, prix, cargaison) qui se combinent ; prérequis comptés en nombre de ships.
- **Flux de revenus dosables** : commerce et minage passifs ; minage à la main (un astéroïde miné a une chance de monter d'un cran de rareté) ; **Bourse** (frais seulement à la vente) ; **expéditions** (temps limité, risque de perdre les ships, bonus temporaire pour le reste de la flotte ; récompense = revenu par seconde de chaque ship envoyé).
- **Raffineries** posées à la main : minerai → métal, curseur de répartition.
- **Signal Ranges** (SR1 à SR5) : zones de plus en plus lointaines, nouveaux produits et dangers.
- **Pirates** : attaquent les convois ; un ship vaincu est en réparation 15 s ; des pirates « du joueur » chassent les leurs et sauvent les civils ; **tableau de primes**.
- **Prestige** : la **singularité** remet l'univers à zéro et donne une amélioration permanente ; chaque prestige ajoute de la **corruption et des trous noirs** qu'on nettoie avec des Void Cleansers (consomment du métal). Une partie des règles est cachée volontairement.
- **Mode infini** : barre de Maîtrise (XP) → points pour une grille d'environ 17 améliorations ; chaque singularité donne un multiplicateur d'XP mais rend la corruption plus dure.
- **Fleet Fusion** : 100 ships fusionnés en 1 super-ship (compté comme 100 pour les prérequis).
- **Mode cinéma** : après 2 min d'inactivité, l'interface s'efface, la caméra suit des ships au hasard.
- **Leçons de l'éditeur** : la performance a été le gros problème (trajectoires dessinées : GPU, un seul appel, détail réduit au dézoom, option pour les couper) ; les joueurs s'arrêtaient après le premier prestige (rappels ajoutés) ; pirates inutiles au début, métal mal équilibré, expéditions vite dépassées, interface incohérente.
- **Limites de cette analyse** : avis des joueurs non lus (API bloquée), pas de chiffres d'équilibrage, mécaniques cachées inconnues.

## Annexe B : historique des maquettes et des retours
### Propositions de la maquette 1
Gardé : flotte autonome visible + mode cinéma ; plusieurs flux de revenus ; prestige par friction ; fusion de 100 en 1.
Changé : téléphone d'abord (aussi laissable ouverte sur PC) ; zones en carte à explorer ; pirates utiles dès le début (primes, épaves) ; défi du jour classé (fortune en 10 min, flotte imposée).
Laissé de côté pour le premier jet : matrice de 17 améliorations, trois thèmes d'interface, Bourse.

### Maquettes et retours
- **Maquette 1** (25/11, [artefact](https://claude.ai/artifact/VLJwho7bw6e7F2SC2atptJ), `maquettes/flotte-du-bureau.html`) : trois téléphones jouables avec la même simulation (mineurs, marchands, patrouille, un pirate de passage, mode cinéma) : **A Radar** (vectoriel), **B Aquarium** (lumière douce, traînées), **C Pixel 32 bits** (seule direction rétro). **Retours du 25/11** : direction C (pixel) écartée (« je n'aime pas trop la vue toute pixellisée ») ; A radar « pourquoi pas » mais B aquarium préférée ; B à enrichir (couleurs, formes, trajectoires, orbites lentes mais présentes).
- **Maquette 2** (25/11, [artefact](https://claude.ai/artifact/DgpcqGUi6Abh3VWGPijGQo), `maquettes/flotte-du-bureau-2.html`) : aquarium détaillé (étoile, 3 planètes dont une géante à anneaux, lune, ceinture d'astéroïdes, station qui tourne, orbites lentes, vaisseaux à formes et teintes variées, trajectoires courbes vers des destinations mobiles), surcouche **radar** optionnelle (bouton), version **PC** 16 : 10 avec panneau (flotte, Veille). Retours du 25/11 (après la maquette 2) : « pas assez fin, l'écran est vite plein alors qu'il n'y a pas grand-chose » ; la colonisation doit « apparaître naturellement » en exploitant des ressources de plus en plus loin ; pas de classement.
- **Maquette 3** (25/11, [artefact](https://claude.ai/artifact/S2fwrAwaLCVQpDryLeq93h), `maquettes/flotte-du-bureau-3.html`) : vaisseaux deux fois plus petits, traits et halos plus fins, astres réduits ; amélioration **Portée** (4 niveaux) qui ouvre une zone (fer, glace, cristal, iridium), pose un **avant-poste** tout seul et **dézoome** la carte ; minerais de plus en plus rentables mais trajets plus longs ; boutons ×10 et +1000 pour tester la densité. **En attente de validation.**
- **Retours du 25/11 (après la maquette 3)** : ralentir encore planètes et vaisseaux ; rendu à approcher de **captures du jeu d'origine** envoyées par l'utilisateur (carte presque nue, astres en petits points nommés avec leur production, routes pointillées, anneaux de portée, fenêtres « Fleet Command » en haut à gauche et « Engineering » en haut à droite, console en bas à gauche, zoom en % en bas à droite, fiche d'un navire avec son pilote ; trois thèmes bleu, violet, vert phosphore).
- **Maquette 4** (25/11, [artefact](https://claude.ai/artifact/Sc99T6iuxW64J8DGaAzaUT), `maquettes/flotte-du-bureau-4.html`) : carte épurée à ce modèle (sans rien reprendre de ses graphismes), trois ambiances (nuit bleue, violette, phosphore), fenêtres flottantes repliables (Flotte : crédits, navires, quantité ×1 / ×10 / ×100 / max ; Ingénierie : moteurs, soute, portée du signal, veille ; Console système), zoom, fiche d'un navire au toucher, détail des vaisseaux visible en zoomant ; orbites ~2× plus lentes, vaisseaux ~1/3 plus lents ; PC en 16 : 9 et téléphone. **En attente de validation.**

- **Retours du 26/11 (après la maquette 4)** : « vraiment bien », vitesse « ok » ; seul point à travailler : le **sprite des vaisseaux au zoom**, qui « fait très IA » (le dessin vectoriel de la maquette 4).
- **Maquette 5** (26/11, [artefact](https://claude.ai/artifact/26dv2X6wuYxn2iQhCTqb9q), `maquettes/flotte-du-bureau-5.html`) : même carte, trois styles de vaisseaux au choix (visibles dès 115 % de zoom) : **Actuel** (vectoriel), **Relief** (sprites pixel art éclairés du projet, ceux de Mineur de l'espace : `d_mineur`, `d_cargo`, `u_garde`, `a_rodeur`) et **3D** (Kenney Space Kit, CC0 : `craft_miner`, `craft_cargoA`, `craft_speederC`, `craft_speederD` rendus de dessus avec Three.js, 32 angles, teintés par rôle ; outils dans `outils/sprites-kenney/`, crédité) ; planche de comparaison « de près », zoom jusqu'à 320 %, caméra qui suit le navire touché (bouton ◎ : en choisit un). **En attente du choix de style.**

### Décisions successives (25/11)
- **Gains appli fermée** : une **fraction** des gains du jeu ouvert ; une amélioration de prestige augmente cette fraction (proposé : 25 % de base, +5 points par niveau, 75 % au maximum ; à valider).
- **Le jeu doit bien passer sur PC** (écran large, panneau, clavier plus tard).
- **Pas de vue pixellisée.** Base : aquarium ; le radar reste une surcouche au choix.
- **Colonisation naturelle** (25/11) : pas de mode séparé ; elle vient de l'exploitation de ressources de plus en plus loin. Le jeu d'origine n'a pas de colonisation (Signal Ranges SR1 à SR5, Engine Overclock, trous de ver ; sous réserve de ce qu'on a lu). Dans la maquette 3 : la portée ouvre zones et avant-postes, la carte dézoome ; au prestige, on pourrait repartir avec une portée de départ plus grande. Plusieurs systèmes : pas retenu pour l'instant.
- **Pas de classement** (25/11).
- **Rendu** : aquarium fin (voir maquette 3) ; le radar reste une surcouche au choix.

- **Choix du style (26/11)** : « Je préfère en relief » : Relief retenu (maquette 5), 3D Kenney écartée.

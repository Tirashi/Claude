# Armateur des étoiles — cahier des charges (ex-« Flotte du bureau », nom choisi le 27/11)

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
- **Vitesse** (jeu, unités du monde) : 0,04 par seconde pour les mineurs, ×1,15 pour les marchands ; les orbites tournent à 0,007 × rayon^-1,5 rad/s (lentes mais visibles). Équivalent des 15 px/s de la maquette 4, jugés bons.
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

## 7. Pirates, patrouilles, alertes (fait le 26/11, session 3)
- **Apparition** : le premier pirate vient 45 à 65 s après le départ, puis un toutes les 40 à 70 s ; au plus `1 + ⌊zone ouverte ÷ 2⌋` à la fois ; il arrive juste au-delà de l'anneau de la zone ouverte (visible), jamais appli fermée.
- **Pillage** : il vise un navire **chargé en vol** (mineur qui rentre à l'avant-poste, marchand qui va à Prime), touche à 0,02 du monde, prend **10 secondes de revenu** (au moins 10 cr, jamais plus que les crédits) et s'enfuit avec ; sorti de la carte, le butin est perdu. Pastille rouge pointillée et « HOSTILE » sur la carte, ligne dans la console, chiffre rouge.
- **Patrouilles** (90 × 1,2^n cr, ne livrent rien) : chacune orbite autour d'un avant-poste ouvert (la i-ème sur le (i mod nombre d'avant-postes)-ième), tire sur tout pirate à moins de 0,22 (0,8 PV/s ; pirate : 2 PV + 1 par zone au-delà de la première) ; tirs en ligne bleue, explosion.
- **Prime** : un pirate détruit **rend son butin** et rapporte **10 secondes de revenu** (au moins 25 cr). Un pirate qui s'échappe garde le butin : défendre rapporte donc plus qu'il ne coûte, surtout aux zones lointaines que les patrouilles couvrent seulement si on en met.
- Le simulateur contrôle : pillages sans patrouille, destructions et primes avec trois patrouilles, moins de pertes avec elles, pas de pirate pendant la veille, patrouilles gardées à la sauvegarde.
- **À améliorer plus tard** : épaves à récupérer, tableau de primes, pirates plus forts après le prestige (friction de l'Horizon).

## 8. Prestige : l'Horizon (fait le 27/11, session 4 ; thème et nom repris de la proposition, à valider)
- **Quand** : les quatre zones sont ouvertes **et** 2 000 000 crédits gagnés pendant le tour (≈ 2 h pour un joueur simulé). Une fenêtre **Horizon** montre la progression, annonce « Horizon disponible » et relance en deux touchers (« Tout repart du début ? Touche encore »).
- **Remet à zéro** : crédits (400), flotte (5 mineurs, 3 marchands), améliorations de crédits, zones, pirates, patrouilles. **Garde** : éclats et améliorations permanentes. Le prochain tour commence à zéro crédit gagné.
- **Éclats** : ⌊3 × √(gagné ÷ 2 000 000)⌋ (3 au seuil, 6 à quatre fois le seuil).
- **Améliorations permanentes** (en éclats ; coût = 1 + niveau, sauf la portée : 2 + niveau) :
  | Amélioration | Niveaux | Effet |
  |---|---|---|
  | Veille | 10 | part des gains appli fermée : 25 % + 5 points par niveau (75 % max) |
  | Rendement | 10 | gains +15 % par niveau (multiplie la soute) |
  | Moteurs de série | 5 | vitesse +6 % par niveau |
  | Flotte de départ | 5 | +6 mineurs et +4 marchands au départ par niveau |
  | Portée de départ | 3 | commence avec une zone de plus ouverte |
- **Friction** : par Horizon passé, la portée coûte **10 % de plus** et les pirates viennent **5 % plus souvent** ; un pirate gagne 1 PV tous les deux Horizons. Choisie faible : à 25 % / 10 % un deuxième tour était plus lent que le premier.
- **Rythme simulé** (`node outils/flotte-simulateur.js rythme 330 horizons`, éclats dépensés en rendement puis moteurs, flotte, veille, portée) : Horizons après **116, 90 puis 82 minutes**. Le rendement et les moteurs rendent le tour plus court ; la flotte et la portée de départ accélèrent surtout le **début** du tour (zone 3 vers 25 min au lieu de 36) mais pas le plateau de revenu, qui décide du seuil : ils comptent pour le confort, pas pour le chiffre.
- Le simulateur contrôle : refus avant le seuil, remise à zéro, formule des éclats, plafonds et coûts de chaque amélioration, effets (rendement ×2 à 10 niveaux, flotte, portée), friction, sauvegarde, et qu'un deuxième Horizon est au moins 10 % plus rapide que le premier.
- **À régler plus tard** : valeur du seuil et des éclats après des essais à la main, deuxième voie (plusieurs systèmes ?), mode infini (le jeu d'origine en a un), sons et succès.

## 9. Appli fermée et fenêtre cachée
- **Appli fermée ou onglet longtemps absent** : au retour, gain = revenu moyen des 60 dernières secondes × durée × **part de veille**, **plafonné à 24 h** (validé par l'utilisateur le 27/11) ; une carte « Retour » le résume ; pas de pirates ni de pertes hors ligne.
- **Fenêtre seulement cachée ou couverte** (PC, deuxième écran) : `requestAnimationFrame` s'arrête ; au retour, **rattrapage à 100 %** par pas de 0,25 s jusqu'à 10 minutes ; au-delà, règle de la veille.
- Horodatage de la dernière sortie dans la sauvegarde ; le revenu moyen est enregistré avec elle.

## 10. Écran et interface
- **Une seule carte plein écran** (canvas 2D, ellipses aplaties pour l'orbite, DPR limité à 2) ; **zoom** 60 à 320 % (boutons, molette sur PC, pincement sur téléphone), anneaux de portée en pointillés, routes pointillées permanentes (une par couple astéroïde-avant-poste), noms et production à côté de chaque astre, `ZONE n` sur les anneaux.
- **Vaisseaux** : petits points sous 115 % de zoom, sprites Relief au-dessus (tailles 9 à 12 px à 100 %, jusqu'à ×2,6), flamme de réacteur quand ils volent.
- **Fenêtres flottantes repliables** : **Flotte** (crédits, revenu par seconde, nombre de navires, quantité d'achat, boutons d'achat), **Ingénierie** (améliorations, « Simuler 8 h d'absence » seulement pour la démo), **Console système** (journal), **fiche d'un navire**. Sur téléphone elles sont repliées et une seule s'ouvre à la fois ; sur PC, Flotte et Ingénierie sont ouvertes.
- **Cinéma** : bouton, et **automatique après 2 minutes** sans action ; l'interface s'efface et la caméra ne bouge pas ; un toucher la rend. **Réglage « Caméra qui suit un navire »** (Options, désactivé par défaut) : la caméra zoome à 240 % sur un navire au hasard et en change toutes les 9 s (choisi le 26/11 : le suivi automatique surprenait).
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
- **Sons** (fait le 28/11) : voulus par l'utilisateur « sobres, modernes et soignés » et une **musique très douce qu'on peut couper**. Tout est **synthétisé** dans le navigateur (Web Audio, aucun fichier, donc rien à créditer) : notes de sinus et de triangle à l'enveloppe lente sur une gamme pentatonique, réverbération partagée, compresseur doux, placement stéréo selon la position à l'écran. Sons : achat (un « ding » doux ; un lancement de vaisseau — verrou, souffle, poussée grave — a été essayé le 28/11 et **rejeté** : « encore pire »), amélioration (arpège doux), éclat, ouverture de zone, Horizon, retour, alerte pirate, pillage, tir, explosion, livraison (très discrète, espacée), clic. Musique : tapis générative en la mineur (quatre accords de 20 s) et rares cloches, environ trois fois plus douce que les effets. Options : Sons, Musique, Volume. Démarre au premier geste (règle des navigateurs).

## 13. Fusion et grandes flottes (plus tard)
**Fusion** (idée du jeu d'origine) : 100 navires d'un rôle deviennent 1 **super-navire** (sprite agrandi ×1,6) qui compte pour 100 dans les calculs ; sert à garder la fluidité. À faire seulement si les essais de performance le demandent.

## 14. Intégration à la Ludothèque
Voir la liste de contrôle de `specs/ludotheque.md` (skill `ajouter-un-jeu`) : dossier `flotte/` ; `fiche.js` (carte, meta, `enCours`, transfert, pas de classement ni de défi du jour) ; **démo** sur l'accueil au début (`demo: true`) ; étiquette et jaquette faites avec les images du jeu ; `sw.js` (`FILES`, `VERSION`) ; `README.md`, `CLAUDE.md`, `specs/ludotheque.md`, `specs/suivi.md`, `IDEES.md` ; test de fumée dans `outils/fumee.js` ; artefact (accord avant de créer un lien).

## 15. Étapes (sessions)
1. **Socle (fait le 26/11)** : carte et orbites, zone 1, mineurs et marchands, gains, achats par lot, fenêtre Flotte, sauvegarde, veille fixe à 25 %, zoom, ambiances, PC et téléphone, sprites Relief ; démo sur l'accueil.
2. **Zones (fait le 26/11)** : portée du signal, avant-postes, Ingénierie (moteurs, soute), console, fiche d'un navire et suivi de caméra, cinéma.
3. **Pirates (fait le 26/11)** : patrouilles, primes, alertes.
4. **Prestige (fait le 27/11)** : Horizon, éclats, améliorations permanentes dont la Veille, simulateur et équilibrage.
5. **Finitions (en cours, 28/11)** : sons et musique faits ; fluidité (lueurs précalculées, tracés allégés, seuil des sprites adaptatif) et teintes des coques faits ; reste : super-navire seulement si les essais sur téléphone le demandent, nouvelles coques, essais à la main.
Modèle : opusplan pour les sessions 1 à 3 et 5 ; Opus pour la session 4 (équilibrage).

## 15 bis. État après les sessions 1 et 2 (26/11)
`flotte/` est jouable en démo ([artefact](https://claude.ai/artifact/G8fypxapvG7eFT7PaSvrzU)). **Session 1** : tout ce qui est listé plus le mode cinéma, la fiche d'un navire avec suivi de caméra et le zoom au pincement. **Session 2** : fenêtre **Ingénierie** (portée du signal, moteurs, soute), quatre zones avec avant-postes et carte qui dézoome, annonce à l'ouverture d'une zone, ligne « Zone » dans la fenêtre Flotte, raccourcis clavier (M, T, P, C), fenêtres réorganisées (PC : Flotte à gauche, Ingénierie à droite, Options au-dessus du zoom ; téléphone : repliées, une seule ouverte).
**Rythme recalé** (`node outils/flotte-simulateur.js rythme`, joueur qui ouvre la zone dès qu'il peut puis rachète le meilleur rapport gain / coût) : portée **3 000, 40 000 et 100 000** crédits ; zones 2, 3 et 4 ouvertes à ~8, 36 et 93 minutes, moteurs et soute au maximum vers 45 à 60 minutes, revenu d'environ 400 à 500 cr/s en fin de zone 4. Le contrôle du simulateur exige 5 à 15, 25 à 60 et 70 à 140 minutes. Reste à vérifier à la main que ce rythme est agréable (la cible du prestige est de 2 à 3 h de jeu actif : il manquera sans doute un but après la zone 4, c'est le rôle de l'Horizon).

## 15 ter. État après la session 4 (27/11)
L'Horizon est jouable ([artefact](https://claude.ai/artifact/G8fypxapvG7eFT7PaSvrzU)) : fenêtre **Horizon** (progression, relance, améliorations permanentes, friction affichée), éclats, nouveau tour avec les bonus, veille alimentée par l'Horizon (elle n'est plus une amélioration de crédits), sauvegarde. Les questions restent ouvertes (nom, sons, plafond d'absence) ; le thème « Horizon » est celui du cahier des charges, sans retour de l'utilisateur.

## 15 quater. Sons, fluidité et coques (28/11, session 5)
Sons et musique (§ 12), **teintes** : chaque sprite Relief existe en quatre teintes (décalage de teinte de quelques dizaines de degrés par rôle) pour que la flotte ne soit pas uniforme ; **fluidité** mesurée en Chromium sans carte graphique : 445 navires au zoom 100 % en ~3,5 ms par image, au zoom 240 % (sprites) en ~14 ms (un téléphone avec carte graphique sera plus à l'aise) ; remède adaptatif : si le dessin dépasse 14 ms en moyenne, les sprites n'apparaissent qu'à un zoom plus fort. La **fusion en super-navire** n'est pas faite : à décider après essais sur téléphone.

## 15 quinquies. Les sons d'achat (28/11)
Retours : « je n'aime pas trop le bruit des boutons d'achat dans Ingénierie et Flotte, ça fait trop générique » ; après le « lancement » : « c'est encore pire, je préférerais limite ceux d'avant ». Les anciens sons (ding, arpège) sont **remis** en attendant. Piste de l'utilisateur : des **sons d'interface gratuits d'itch.io**. Un **banc d'écoute** (`maquettes/armateur-banc-sons.html`) réunit 122 sons CC0 de Kenney (Interface Sounds, Sci-Fi Sounds) et six synthèses ; l'utilisateur coche, par usage (achat, amélioration, zone, clic), ce qui lui plaît, et renvoie le récapitulatif. Ensuite : intégrer les fichiers retenus (encodés en base64 dans un script, pour que l'artefact les lise) et les créditer.

## 16. Questions ouvertes
1. ~~Nom du jeu~~ : **« Armateur des étoiles »**, choisi par l'utilisateur le 27/11 (parmi Sillages, Cabotage, Comptoir céleste, etc.).
2. **Prestige** : thème et nom (« Horizon »), seuil, friction ajoutée à chaque relance.
3. ~~Plafond d'absence~~ : 24 h validé le 27/11 ; part de veille 25 % à 75 % en attente d'essais.
4. ~~Sons~~ : sobres et musique très douce coupable, faits le 28/11.
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

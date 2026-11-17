# Ciel de guerre (chantier ouvert le 17/11)

Combat aérien en 3D low poly, vu de derrière l'avion : vol libre au-dessus d'un archipel, duels contre des chasseurs, grandes flottes de vaisseaux qui se battent dans le ciel. Jeu original : notre moteur, nos règles ; modèles 3D venus de packs itch.io (crédits).

Nom choisi par l'utilisateur le 17/11, parmi plusieurs listes. Il refuse « Crépuscule », « Ciel de braise », « Escadre », « Dernière Patrouille », et tout nom qui parle du soir. À ne pas confondre avec **Escadrille !** (`escadrille/`, shoot'em up vertical), qui reste un jeu à part.

## Maquette validée (17/11)
« Escadrille crépuscule » : https://claude.ai/artifact/PDk84xmucTtuHMLcsZhVDT (version 10).
- Source : `outils/escadrille-pixel/source-crepuscule.html`. La copie publiée est `maquettes/escadrille-crepuscule.html`, avec les modèles en base64.
- Outils et historique : `outils/escadrille-pixel/LISEZMOI.md`.
- Conversion des modèles : `outils/escadrille-pixel/conversion/` (`convertir.js`, `vox_glb.py`, `helices.py`, `tour.py`, `tour_export.py`).

Historique des directions : *Escadrille pixel* (gros pixels, sprite dessiné), puis l'utilisateur le 17/11 : « un truc dynamique, low poly fluide avec des décors plus détaillés et plus fins, moins de gros pixels » (références : Dusk Patrol). Avis : « bien fluide », puis « c'est pas mal » ; maquette validée le 17/11.

### Ce que la maquette contient (à reprendre dans le jeu)
- **Rendu** :
  - image interne à 1/2,5 de l'écran ;
  - ciel peint par le GPU : dégradé, soleil bas, halo, traînées de nuages ;
  - terrain en carreaux de 200 m (7 × 7) avec mer, écume, forêts d'automne, roche et sable ;
  - brume de 220 à 760 m et nuages en volume (3 tons) ;
  - décor instancié : arbres, villages, voiliers ;
  - avions dessinés à part avec un contour d'1 px ;
  - tramage de Bayer 4 × 4.
- **Pilotage** :
  - caméra en rotation douce, y compris pendant le looping ;
  - looping, tonneau, boost ;
  - téléphone : joystick sous le pouce et boutons ronds (FEU, MIS., LOOP, TONNEAU, AVION, VUE) ;
  - PC, au choix de l'utilisateur, **la souris pilote** : un repère rond marque une direction fixe dans le monde, et l'avion la rejoint ;
  - PC : clic gauche pour le feu, clic droit pour le missile ;
  - PC : Z accélère, S freine, Q et D font un écart ; un double appui sur Z fait un looping, sur Q ou D un tonneau ;
  - PC : les flèches pilotent toujours comme un joystick.
- **Armes** :
  - canon ;
  - 5 missiles qui se verrouillent en 0,5 s (cadres, « LOCK ») ;
  - flèches au bord de l'écran vers les ennemis qu'on ne voit pas.
- **Ennemis** :
  - vagues sur 6 motifs (de face, par derrière, sur les flancs, par le dessus, encerclés, en deux temps) ;
  - 4 rôles : tournoi, chasse, passe, bombardier ;
  - esquive quand ils sont dans le viseur ;
  - as plus rapides ;
  - fatigue au bout de 25 s ;
  - virage limité (on peut les semer en looping).
- **Flottes** :
  - 3 grands vaisseaux bleus (alliés) contre 4 rouges, de 85 à 120 m de long ;
  - la bataille suit le joueur, et un vaisseau trop loin revient devant lui dans la brume ;
  - les tourelles sont repérées dans les modèles, pivotent et tirent du bout de leurs canons ;
  - les rouges visent aussi le joueur à moins de 260 m, les bleus les chasseurs ennemis ;
  - **les tourelles rouges sont destructibles** (8 balles ou un missile, +300) ;
  - un vaisseau sans tourelles prend feu et tombe (+2000).
- **Hangar** : 4 chasseurs construits dans le code et 30 vaisseaux issus de 6 packs. Les flammes sont placées sur les tuyères, et le sens de chaque modèle a été vérifié sur les aperçus des packs. Les avions à hélices ont été retirés le 17/11.

## Ce que l'utilisateur veut (17/11 : « toutes tes idées me conviennent »)
1. **Missions courtes**, au lieu des vagues sans fin, avec un écran de fin (score, étoiles) :
   - escorter un destroyer bleu jusqu'à un point ;
   - abattre le croiseur amiral rouge ;
   - défendre une ville côtière contre des bombardiers ;
   - survivre 3 minutes.
2. **Boss** : un très grand vaisseau rouge (le croiseur rouge le plus massif, agrandi). Ses tourelles et ses boucliers se détruisent dans l'ordre, et des chasseurs décollent de lui.
3. **Ailiers** : 2 chasseurs bleus volent avec le joueur et attaquent la cible verrouillée.
4. **Son** : moteur qui monte avec le boost, rafales, missiles, explosions, et une musique. Sons libres, cités dans les crédits.
5. **Sensations** :
   - secousses d'écran (coup reçu, grande explosion proche) ;
   - traînées de fumée derrière les avions abattus ;
   - indicateur de vitesse ;
   - **jauge d'énergie du boost**, pour que le boost ne soit plus illimité.
6. **Décors** avec le même moteur (ciel, brume et sol recolorés) : nuit au clair de lune, orage avec éclairs, désert, montagnes enneigées.
7. **Cibles au sol** : défenses antiaériennes près des villages, convois de navires, radars ; passes en rase-mottes.
8. **Progression** : avions du hangar débloqués avec le score, chacun avec ses réglages (vitesse, virage, blindage, armes).
9. **Classements** par mission (`ludo-scores.js`).

## Plan des sessions (proposition)
| Session | Contenu | Modèle |
|---|---|---|
| 1 · socle | Dossier `ciel-de-guerre/` en scripts classiques. Three.js r128 et GLTFLoader de `lib/`. Modèles en fichiers `.glb` dans `ciel-de-guerre/modeles/` (plus de base64 ; mis en cache par `sw.js`), pour les seuls avions retenus. Moteur, avions, flottes et commandes repris de la maquette. Écran titre avec retour au menu, fiche, accueil, service worker, crédits. | Opus |
| 2 · missions | Les 4 missions, l'écran de fin, les étoiles, le boss | Opus |
| 3 · sensations | Son, secousses, fumée, jauge de boost, vitesse | opusplan |
| 4 · monde | Ailiers, cibles au sol, décors (nuit, orage, désert, neige) | opusplan |
| 5 · progression | Réglages par avion, déblocages, classements, défi du jour éventuel | opusplan |

## Décision du 17/11 : des vaisseaux, pas d'avions
Le joueur et les ennemis volent sur des **vaisseaux**. Les avions à hélices sont retirés : les 6 monogon voxel plane et le Corsaire. On garde ce qui ressemble à des avions de chasse : Faucon, Hirondelle, Vipère et Spectre, construits dans le code. Le hangar de la maquette est mis à jour. Les outils des hélices (`vox_glb.py`, `helices.py`) restent dans `outils/escadrille-pixel/conversion/`.
Le même jour, les **5 vaisseaux voxel monogon** sont retirés aussi (« design trop différent »). Le problème de licence monogon disparaît.

## Flotte cohérente (validée le 17/11)
Deux camps, un seul style : coques grises, couleur du camp. Chaque coque Free Game Assets existe en bleu (`T_Spase_blue`) ou en rouge (`T_Spase_64`).
- **Bleu (joueur, alliés)** :
  - chasseurs du joueur : nos 4 jets repeints en gris et bleu (Faucon au départ, puis Hirondelle, Vipère, Spectre) ;
  - vaisseaux lourds à débloquer : les 5 corvettes bleues ;
  - flotte alliée : destroyers et croiseurs bleus.
- **Rouge (ennemi)** :
  - chasseurs : Faucon gris et rouge ; les as sur la Vipère rouge ;
  - bombardiers : corvettes rouges ;
  - escorteurs (dès la vague 4) : frégates rouges, 18 points de vie ;
  - grands vaisseaux : destroyers et croiseurs rouges ;
  - boss : le croiseur rouge le plus massif, grossi 2 à 3 fois.
- **Retirés** : niko, Texnist, Majadroid, monogon. Il ne reste que nos modèles et ceux de craftpix, ce qui règle les licences.
- **Flammes** : trois cônes emboîtés (halo, flamme, cœur blanc) et un point chaud sur la tuyère ; bleues pour notre camp, orangées pour l'ennemi ; plus longues au boost.
  - Sur le calque des avions, elles sont ajoutées comme une lueur, sans contour : les pixels à demi transparents (alpha entre 0,01 et 0,92) sont additionnés, et le contour ne suit que les coques.
  - Corvettes 2 à 4 : `coupe`, pour ignorer les tiges qui dépassent à l'arrière.
- **Projectiles** : traçantes fines et partagées. Le joueur tire alternativement de ses deux canons. Les tirs ennemis sont rouges. Les missiles ont une petite flamme et une fumée légère (une bouffée toutes les 0,05 s, qui grossit et s'efface en 0,55 s).

## Recherche de petits chasseurs (17/11)
Free Game Assets n'a pas de chasseurs : ses plus petits vaisseaux sont les corvettes. Je les ai cherchés sur itch.io (tags low-poly + spaceship, recherche « low poly spaceship fighter »), puis j'ai essayé 4 packs gratuits repeints aux couleurs des camps. Règle de repeinture : la teinte dominante (la coque) passe au gris teinté du camp, les autres couleurs vives prennent la couleur du camp, le reste devient gris.
| Pack | Licence | Contenu | Avis |
|---|---|---|---|
| [polyyai, 3D Spaceships Pack](https://polyyai.itch.io/3d-spaceships-pack) (et [Pack 2](https://polyyai.itch.io/3d-spaceships-pack-2), 25 de plus) | CC0, prix libre | 35 chasseurs en GLB texturés (0,7 à 1,5 Mo, textures à réduire) | **Le meilleur** : vrais chasseurs aux formes variées ; repeints, ils ont une coque gris-bleu et des touches du camp, comme Free Game Assets |
| [polyhangar, Orbital Utility Fleet](https://polyhangar.itch.io/orbital-utility-fleet-low-poly-spaceships-cc0) | CC0 | 8 vaisseaux à couleurs pleines (intercepteur, bombardier, courrier, et des utilitaires) | 3 bons : intercepteur, bombardier, courrier ; se repeignent parfaitement |
| [mehrasaur (Inborn Ninja), Spaceship Pack](https://mehrasaur.itch.io/3d-spaceships-pack) | CC0 | 9 chasseurs blancs sans texture (le 10e copie un chasseur de film : exclu) | Belles silhouettes, mais tout d'une couleur |
| [Quaternius, Lowpoly Spaceships](https://quaternius.itch.io/lowpoly-spaceships) | CC0 | 5 vaisseaux, blanc et noir | Moins intéressant |
| Repérés, non essayés | | ad-sounddesign (4,99 $), Void Fleet (5,99 $), Kenney Space Kit (CC0, style plus jouet) | |
Planche : `chasseurs-proposes.png` (scratchpad, envoyée à l'utilisateur). Outils d'essai : `essai_chasseurs/page.html` et `rendre.js` (scratchpad), à ranger dans `outils/` si on les garde.

## Choix des chasseurs dans le hangar (17/11)
À la demande de l'utilisateur, les 47 candidats sont dans le hangar de la maquette : 35 polyyai, 3 polyhangar (Kestrel, Anvil, Arrowhead) et 9 mehrasaur. Ils sont repeints au chargement (`repeint()`) en bleu pour le joueur et en rouge pour les ennemis.
- Chaque ligne du hangar a deux boutons : le nom, pour **piloter** l'appareil, et **ENNEMI**, pour l'ajouter aux chasseurs ennemis (`localStorage` `escadrille.ennemis`).
- En haut, un résumé « TOI : … / ENNEMIS : … » que l'utilisateur pourra recopier pour donner sa sélection.
- Les bombardiers restent les corvettes et les frégates rouges.
- Orientation : polyyai retournés de 180° ; polyhangar et mehrasaur dans le bon sens.
- Poids : textures en 128 px sans lissage, géométrie quantifiée (`conversion/quantifie.py`, extension KHR_mesh_quantization, remise en coordonnées d'origine au chargement par `dequantifie()`). 3 gros vaisseaux qui ne servaient pas sont retirés. La page pèse 14 Mo (plafond : 16 Mo). Une fois le choix fait, on ne gardera que les modèles retenus.
- Le même jour, l'utilisateur retire **polyhangar et mehrasaur** : il ne reste que les 35 polyyai à essayer.

## Licences à régler avant le jeu
- **monogon** : réglé, tous retirés.
- **niko** : réglé, retiré.
- **Free Game Assets (craftpix)** : licence craftpix, utilisable dans un jeu, pas de revente. C'est le seul pack gardé.
- Taille : la maquette pèse 12 Mo avec tous les modèles. Le jeu ne garde que les avions retenus, à choisir avec l'utilisateur en session 1.

## À décider en session 1
- Avions retenus pour le joueur (au départ et à débloquer).
- Modèles des ennemis : nos chasseurs construits dans le code, ou des modèles des packs ?
- Ordre des missions.
- Faut-il un défi du jour ?

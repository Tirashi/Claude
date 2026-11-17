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
- **Hangar** : 5 avions faits dans le code et une quarantaine de modèles issus de 7 packs. Les hélices des avions monogon tournent, les flammes sont placées sur les tuyères, et le sens de chaque modèle a été vérifié sur les aperçus des packs.

## Ce que l'utilisateur veut (17/11 : « toutes tes idées me conviennent »)
1. **Missions courtes**, au lieu des vagues sans fin, avec un écran de fin (score, étoiles) :
   - escorter un destroyer bleu jusqu'à un point ;
   - abattre le croiseur amiral rouge ;
   - défendre une ville côtière contre des bombardiers ;
   - survivre 3 minutes.
2. **Boss** : un très grand vaisseau rouge (le carrier niko agrandi). Ses tourelles et ses boucliers se détruisent dans l'ordre, et des chasseurs décollent de lui.
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

## Licences à régler avant le jeu
- **monogon (maxparata)** : CC BY-ND, donc **pas de modification**. Or on a refait les avions en voxels avec des hélices à part, et réduit les vaisseaux. Il faut demander l'accord de l'auteur, ou ne garder que les modèles d'origine non modifiés, ou s'en passer.
- **niko-3d-models** : prix libre, sans licence écrite sur la page. À vérifier (commentaire ou message à l'auteur) avant de les mettre dans le jeu.
- **Free Game Assets (craftpix)** : licence craftpix, utilisable dans un jeu, pas de revente. **Texnist** : CC BY 4.0. **Majadroid** : CC0. Ces trois-là sont bons.
- Taille : la maquette pèse 12 Mo avec tous les modèles. Le jeu ne garde que les avions retenus, à choisir avec l'utilisateur en session 1.

## À décider en session 1
- Avions retenus pour le joueur (au départ et à débloquer).
- Modèles des ennemis : nos chasseurs construits dans le code, ou des modèles des packs ?
- Ordre des missions.
- Faut-il un défi du jour ?

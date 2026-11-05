# Défense aérienne (chantier ouvert le 01/11)

Tower defense **vu de côté** (idée de l'utilisateur du 01/11, piste 2 du brainstorm « Tower defense » d'`IDEES.md`) : le ciel en haut, la ville en bas. Les avions traversent l'écran par vagues ; les bombardiers lâchent leurs bombes sur les maisons ; on construit des tours sur des emplacements au sol et on appelle des raids d'avions amis. Partie perdue quand toutes les maisons sont détruites.

## Maquette 1 (01/11)
https://claude.ai/artifact/HrUtHqbKkhDD8eSdvJFbAe — source `maquettes/defense-aerienne.html` (pixel art 32 bits dessiné par le code, toile de 170 × 330 agrandie ×2, sans pack d'images).

Commun aux trois : 5 emplacements au sol (toucher → choisir une tour ou la vendre), 4 maisons de 3 points de vie, argent gagné par avion abattu et à chaque vague, raid toutes les 20 s, vagues de plus en plus fournies.
- **A Londres 1940, la nuit** : chasseurs et bombardiers bimoteurs ; mitrailleuse (traçantes), canon de DCA (obus qui éclatent en nuage noir, dégâts en zone), **projecteur** (l'avion éclairé prend double dégâts) ; raid de 3 chasseurs amis.
- **B Base aérienne, aujourd'hui** : avions à réaction, hélicoptères bas, drones ; mitrailleuse, **missile sol-air** (tête chercheuse, traînée de fumée), **radar** (les tours voisines tirent 60 % plus vite) ; raid d'intercepteurs.
- **C Le village, 1918** : biplans et dirigeables (un toutes les 3 vagues) au coucher du soleil ; mitrailleuse, canon, **ballon de barrage** (les avions qui passent sous le ballon se prennent le câble) ; raid de l'escadrille.

Retours : à venir.

## Idée d'origine (passages d'IDEES.md déplacés le 05/11)
Recopiés tels quels lors du rangement du 05/11 ([`plan-rangement.md`](plan-rangement.md), phase 3) ; `IDEES.md` ne garde qu'une ligne qui renvoie ici. Les liens relatifs de ces passages partent de la racine du dépôt.

*Section « Tower defense (brainstorm du 01/11, après La petite usine) » :*

2. **Défense aérienne** — ✅ **choisie le 01/11, vue de côté** (ciel en haut, sol en bas) → chantier [`specs/defense-aerienne.md`](specs/defense-aerienne.md), maquette 1 : https://claude.ai/artifact/HrUtHqbKkhDD8eSdvJFbAe. Idée de départ : les avions passent dans le ciel, on place des canons antiaériens (flak, mitrailleuses, projecteurs la nuit, ballons de barrage, radar) et on appelle des raids (chasseurs d'interception, bombardement). Graphismes : nos avions d'Escadrille ! (`escadrille/avions.js`), SCKR Modern Air Force, Zeus 2D Modern Military Aircrafts (7,99 $), canon antiaérien de gamedeveloperstudio (1 £).

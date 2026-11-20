# Stratégie en temps réel dans l'univers de Ciel de guerre (chantier ouvert le 20/11, nom à trouver)

Idée de l'utilisateur du 20/11 : un jeu de stratégie en temps réel pensé **d'abord pour le PC** (souris : sélection au cadre, ordres au clic droit, raccourcis clavier), avec les graphismes et les vaisseaux de [Ciel de guerre](ciel-de-guerre.md) : les 35 chasseurs en 4 familles, corvettes et frégates, destroyers et croiseurs, archipel en 3D low poly, ambiances (crépuscule, nuit, orage, désert, neige). **À voir : l'adapter au téléphone** (sélection au doigt, groupes en boutons, ordres simplifiés, caméra au pincement).

Voisins à ne pas répéter : Ciel de guerre (combat vu de derrière l'appareil), Bastion (RTS et tower defense au sol), Armada (survivor spatial), Défense orbitale.

## Décisions de l'utilisateur (20/11)
- **Base du joueur : un porte-vaisseaux mobile.** Il fabrique les escadrilles et se déplace ; le perdre fait perdre la partie.
- **Rythme : les trois formes, en commençant par la première.**
  1. **Escarmouches à étoiles** : missions de 10 à 15 minutes contre une IA, débloquées une à une, comme dans Ciel de guerre. **C'est la première étape.**
  2. Ensuite une **campagne** sur la carte de l'archipel, île par île, avec une flotte qu'on garde d'une bataille à l'autre.
  3. Enfin une **partie libre** (ennemi à détruire, sans scénario).
- **Ressources : une seule au départ**, récoltée sur les îles, mais le code ne doit pas fermer la porte à une deuxième plus tard. Prévoir un tableau de ressources plutôt qu'un seul nombre.
- **Maquette** : 2 ou 3 directions qui varient **à la fois la caméra et l'interface**.

## Pistes à creuser (brainstorm)
- Îles à tenir : chaque île prise rapporte la ressource ; un avant-poste s'y pose.
- Escadrilles à composer depuis le porte-vaisseaux ; grands vaisseaux à protéger.
- Reprendre de Ciel de guerre : les modèles (`ciel-de-guerre/modeles/`), les ambiances (`AMBS`), le rendu (image interne réduite, contour d'1 px, tramage), les sons.

## Maquette 1 (20/11) : https://claude.ai/artifact/CS2t1YEqkqfjtzGnUhgy5A
Source `maquettes/strategie-ciel-source.html` (lit `../lib/` et `../ciel-de-guerre/modeles/`) ; copie autonome `maquettes/strategie-ciel.html` fabriquée par `python3 outils/strategie-ciel/fabriquer.py` (Three.js, GLTFLoader et 7 modèles en base64, 2,2 Mo). La même bataille animée (porte-vaisseaux Aurore = croiseur bleu grossi, 2 destroyers, 3 escadrilles contre destroyer, frégates, corvettes et 2 escadrilles rouges ; archipel de 5 îles nommées, cristaux, anneaux de prise), avec bascules PC / téléphone et crépuscule / nuit / désert :
- **A · État-major** : vue de haut ; interface classique (ressources, mini-carte, barre des groupes 1 à 4, panneau de la sélection et ses ordres, chantier du porte-vaisseaux) ; téléphone : groupes à gauche, ordres à droite.
- **B · Carte vivante** : vue de biais ; tout sur la carte (étiquettes et points de vie, anneaux des îles, ordre en pointillés, chantier en menu autour du porte-vaisseaux), dans l'esprit de Bastion B.
- **C · Passerelle** : vue basse derrière le porte-vaisseaux ; une carte par escadrille en bas, ordres sur la carte tactique.
Chasseurs grossis (15 m au lieu de 4) pour rester lisibles. En attente du choix de l'utilisateur.

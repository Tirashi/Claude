# Défense orbitale — cahier des charges

Tower defense dans l'espace, vu de profil, téléphone à l'horizontale : la Terre à gauche, les envahisseurs arrivent par la droite. Les défenses sont des **flottes** qui se battent seules (côté auto-battler) pendant que le joueur pilote le **vaisseau amiral** et déclenche des **pouvoirs**. Entre les vagues, une **gestion légère** (flottes, usines, chantier naval, recherche).

Maquette de référence : **`maquettes/defense-orbitale-4.html`** (https://claude.ai/artifact/61ohiea8WuW6ZPEbL1zhjW). Elle contient déjà les règles du combat (`majPartie`), le rendu réaliste (`fondCache`, `realiste`) et les quatre écrans : **repartir de son code**.

## 1. Décisions de l'utilisateur
- 15/10 : univers distinct de Nebula, vu de profil ; joueur actif pendant les batailles ; gestion légère ; déblocages d'une partie à l'autre.
- 19/10, maquette 1 (`defense-orbitale.html`) : trop rapide, « les distances sont énormes ». → **Maquette 2** : tout ralenti ; les satellites deviennent des **flottes** (niveau 1 = 1 vaisseau, 2 = 2, 3 = 3) qui **restent dans une limite orbitale** ; seuls les **intercepteurs** vont vite.
- 19/10, maquette 2 (`defense-orbitale-2.html`) : **vitesse validée** ; **nom « Défense orbitale » gardé** ; graphismes à rendre plus réalistes.
- 19/10, maquette 3 (`defense-orbitale-3.html`) : **rendu A, « hard SF en plein jour »** ; **ennemis vaisseaux** (pas de soucoupes).
- 19/10, maquette 4 : **validée** (écran titre, bataille avec spécialisations, bilan, préparation, fiches des flottes et des ennemis).

## 2. Principe et commandes
- **Une vague** : les ennemis entrent par la droite en groupes, avancent lentement, s'arrêtent à portée de tir et bombardent ce qu'ils voient (flottes, vaisseau amiral ou Terre). La vague finit quand il n'en reste plus.
- **Glisser le doigt** n'importe où (hors postes et boutons) : le vaisseau amiral rejoint ce point, avec inertie, sans sortir de la limite orbitale. Sans doigt pendant 4 s, il se pilote seul (vers l'ennemi le plus proche).
- **Toucher un poste vide** : menu de construction. **Toucher une flotte** : +1 vaisseau, spécialisation au niveau 3, ou revente. Pendant la vague aussi (sans pause).
- **Pouvoirs** : trois boutons en bas à droite, avec leur recharge en camembert.
- **Pause** : bouton en haut à gauche (reprendre, son, musique, abandonner, Ludothèque).
- **Vitesse ×2** pendant les vagues (bouton à côté de la pause), le jeu étant volontairement lent. À confirmer (§ 16).

## 3. Écran et échelle
- Monde logique **420 × 200** (rapport 2,1, l'écran des téléphones en paysage), dessiné à la **résolution réelle** de l'écran (pas de pixel art), mis à l'échelle sans déformation ; bandes noires si le rapport diffère.
- **Terre** : centre (−260, 100), rayon 300 (on voit le bord). Échelle réelle : 1 unité = 21,2 km ; la Terre fait 6 371 km de rayon.
- **Limite orbitale** : rayon 478, soit **3 800 km d'altitude**, en pointillés, avec son étiquette ; échelle « 2 000 KM » en bas à gauche.
- **Postes** (ancres des flottes) : 5 au départ, sur deux arcs (rayons 372 et 432). La recherche en ajoute deux (§ 9).
- **Interface en HTML** par-dessus le canvas, en **Barlow Condensed** (accents permis, contrairement à Press Start 2P) : en haut au centre `VAGUE n / 30`, l'intégrité de la Terre, les crédits ; menus et écrans en panneaux sombres translucides, liseré blanc fin, bouton d'action orange `#e8642c`. Tailles des écrans en `cqh` (elles suivent la hauteur du téléphone), comme la maquette.
- **Paysage obligatoire** : en plein écran, `screen.orientation.lock('landscape')` (essai, sans erreur si refusé) ; en portrait, un écran « Tourne ton téléphone ». Premier jeu en paysage de la Ludothèque (le manifeste accepte déjà les deux sens).

## 4. Rendu (direction A)
- **Décor calculé une fois** à la taille de l'écran (`fondCache`) : ciel en dégradé, voie lactée, ~650 étoiles, Lune au loin, **Terre calculée au pixel** (bruit 3D : océans, continents, nuages, éclairage du Soleil, brume bleue au bord) puis agrandie, halo de l'atmosphère, limite et échelle. Le recalculer seulement au changement de taille.
- **Vaisseaux** : coques gris clair à marques orange, **éclairées d'un côté** (liseré + dégradé d'ombre), contour fin, tourelles, feux de position clignotants, **propulseurs bleus** dont la flamme suit la vitesse.
- **Ennemis** : coques sombres `#26222c`, **lueurs rouges** (fentes, cœur), tournés vers la gauche.
- **Tirs** : balles traçantes orange, rail blanc de l'amiral, rayon laser bleu, missiles à traînée de fumée, bolts de plasma rouges des ennemis. **Explosions** : éclair, boule de feu, éclats, fumée.
- **Performance** : la maquette dessine tout à chaque image avec des dégradés ; pour 60 ennemis et 20 vaisseaux, **précalculer les coques** par type sur de petits canvas (32 angles pour nos vaisseaux, un seul sens pour les ennemis) et les halos (un sprite par couleur), plafonner les particules ; viser 60 images/s sur le téléphone, 30 au minimum.

## 5. Les flottes
Une flotte = 1 à 3 vaisseaux du même type, en formation (pointe, puis ailiers à (−9, ±8)). Elle **part au-devant** de l'ennemi le plus proche de son poste (détection 170, 230 pour les missiles), se place à 75 % de sa portée, **sans franchir la limite orbitale ni descendre sous 12 unités d'altitude**, puis **revient à son poste** quand il n'y a plus de cible. Les vaisseaux se réparent lentement (0,4 PV/s). Valeurs de la maquette (unités du monde, secondes) :

| Flotte | Prix (par vaisseau) | PV | Vitesse | Portée | Arme | Spécialisations au niveau 3 (60 CR) |
|---|---|---|---|---|---|---|
| Canonnières | 40 | 30 | 9 | 70 | obus à 55 u/s, 6 dégâts, toutes les 1,4 s | **Rafale** (cadence ×2) ou **Blindage** (PV ×2) |
| Croiseurs lance-missiles | 70 | 40 | 6 | 150 | missile qui vise le plus gros ennemi, 20 dégâts en zone (rayon 20), toutes les 5 s | **Essaim** (3 missiles de 9) ou **Torpille** (1 missile de 45, toutes les 7 s) |
| Croiseurs laser | 90 | 35 | 7 | 75 | rayon continu, 7 dégâts/s, chauffe en 5,5 s puis refroidit | **Lance** (11 dégâts/s) ou **Refroidi** (chauffe 2× moins) |
| Porte-intercepteurs | 110 | 70 | 5 | — | 2 intercepteurs par vaisseau | **Escadrilles** (4 intercepteurs par vaisseau) ou **Bombardiers** (tirs de 5 au lieu de 2) |

- **Intercepteurs** : seuls vaisseaux rapides (75 u/s, virages amples) ; passes de tir (130 u/s, 2 dégâts, quand ils sont alignés à moins de 45) ; 8 s de carburant, puis retour au porte-intercepteurs, 2,5 s au quai pour se ravitailler et se réparer. Restent aussi dans la limite. **Trop rapides pour être touchés** par les tirs ennemis.
- **Revente** : 50 % du prix payé (vaisseaux et spécialisation). Un poste vidé par la destruction de sa flotte redevient libre.
- **Vaisseau amiral** : 26 u/s, rail à 70 u/s (5 dégâts, toutes les 0,7 s, portée 95), **bouclier** : il n'est jamais détruit, les tirs le font seulement clignoter. Modèles à débloquer au chantier (§ 10).

## 6. Les envahisseurs
| Ennemi | PV | Vitesse | Portée | Comportement | Crédits |
|---|---|---|---|---|---|
| Drones | 5 | 13 | 22 | en essaim, foncent sur le vaisseau le plus proche (140), tirent de près | 3 |
| Frégates | 30 | 5 | 60 | en formation, s'arrêtent à portée, bolt toutes les 2,6 s (4 dégâts) | 6 |
| Croiseurs | 140 | 3 | 75 | canon lourd toutes les 3,2 s (8 dégâts) | 15 |
| Porte-drones | 220 | 2,2 | 95 | restent loin, lâchent 3 drones toutes les 7 s | 25 |
| Vaisseau-mère (boss) | 1 500 (×1,5 à chaque boss) | 1,5 | 110 | coque en croissant ; salves sur les flottes, lâche des drones, appelle des croiseurs à 50 % et 25 % | 200 |

- Les tirs ennemis touchent les vaisseaux (pas les intercepteurs) ; un tir qui atteint la Terre lui retire le tiers de ses dégâts ; un ennemi qui l'atteint retire 3 %.
- **Flèches** sur le bord droit pour les ennemis encore hors de l'écran (plus nettes quand ils approchent).
- Idées pour le mode infini et les secteurs (à faire plus tard) : brouilleurs ennemis (ralentissent nos tirs), mouilleurs de mines, kamikazes.

## 7. Pouvoirs
| Pouvoir | Recharge | Effet |
|---|---|---|
| Renforts | 20 s | 3 canonnières décollent de la Terre, se battent 15 s puis rentrent |
| Drone de réparation | 12 s | va soigner la flotte la plus abîmée (12 PV/s par vaisseau, 3 s) |
| Frappe orbitale | 22 s | cible le plus gros groupe ; mire 1,2 s, puis tir lourd depuis la Terre : 120 dégâts dans un rayon de 28 |
| Bouclier d'urgence (recherche) | 30 s | la flotte la plus menacée ne prend aucun dégât pendant 5 s |
| Rappel des flottes (recherche) | 40 s | toutes les flottes rentrent à leur poste et se réparent 2× plus vite pendant 6 s |

Trois boutons seulement à l'écran : au-delà de trois pouvoirs débloqués, on choisit les trois emportés à l'écran de préparation.

## 8. Déroulé d'une partie
- **30 vagues** (15 à 20 min), puis **mode infini** (PV des ennemis +8 % par vague). Une vague = 3 à 6 groupes, un groupe toutes les 12 s (le premier arrive déjà à l'écran).
- Composition (réglée ensuite avec le simulateur, § 13) : vagues 1 à 3 frégates seules ; 4 à 6 + drones ; 7 à 9 + croiseurs ; **10 vaisseau-mère** ; 11 à 19 porte-drones, groupes mêlés ; **20 vaisseau-mère + 2 croiseurs** ; 21 à 29 gros groupes, plusieurs côtés à la fois ; **30 vaisseau-mère + porte-drones**, victoire.
- **Bilan** après chaque vague (maquette, écran 3) : ennemis détruits, crédits du combat, revenu des usines, pertes, intégrité de la Terre, score de la vague. Bouton « Préparer la vague n ».
- **Préparation** (écran 4) : flottes à gauche (on touche les postes), panneau à droite : crédits, la Terre (usines, chantier naval, recherche, **réparation de la Terre** : +10 % pour 80 CR), **renseignement** (composition de la vague suivante), choix des pouvoirs, bouton « Lancer la vague ». Pas de chrono : on lance quand on veut.
- **Défaite** : intégrité de la Terre à 0 %. Écran de fin : vague atteinte, score, médailles gagnées (§ 10), record.
- **Sauvegarde de la partie en cours** à chaque préparation (reprise à cet écran) ; une vague interrompue est rejouée depuis le début. Étiquette EN COURS sur l'accueil.

## 9. Économie (gestion légère)
- **Crédits** : 160 au départ ; gains par ennemi détruit (§ 6) ; **revenu de la Terre** après chaque vague : 40 + usines.
- **Usines** (5 niveaux) : +20 crédits par vague par niveau ; prix 100, 160, 240, 340, 460.
- **Chantier naval** (3 niveaux) : flottes et vaisseaux −10 % par niveau ; prix 150, 260, 400.
- **Recherche** : on y verse des crédits (par tranches de 50) ; chaque découverte a un coût : brouilleur (5 tranches, nouvelle flotte qui ralentit de 40 % les ennemis proches), relais de bouclier (6, nouvelle flotte qui protège ses voisines : −30 % de dégâts), bouclier d'urgence (6), postes avancés (8, deux postes de plus), rappel des flottes (8). Ordre fixe, affiché avec sa barre.
- Le choix « se défendre tout de suite ou investir » est le cœur de la gestion : les prix sont à régler pour que les deux tiennent (simulateur).

## 10. Score, chantier et déblocages
- **Score** : points par ennemi (10 × crédits), bonus de fin de vague = intégrité de la Terre × 10 × numéro de vague, bonus de victoire à la vague 30.
- **Médailles** gagnées à la fin d'une partie = vague atteinte (+10 si victoire) ; elles se dépensent au **Chantier** (bouton de l'écran titre) :
  - **Vaisseaux amiraux** : Sentinelle (de départ) ; **Faucon** (rapide, 40 u/s, rail plus faible) ; **Bastion** (lent, deux tourelles, onde de choc) ; **Nid** (lâche 3 drones de combat). 30 médailles chacun.
  - **Améliorations permanentes** (3 niveaux) : crédits de départ (+40), solidité de la Terre (dégâts reçus −10 %), recharge des pouvoirs (−10 %).
  - **Flottes de départ** : commencer la recherche avec le brouilleur déjà trouvé, etc. (à voir au réglage).
- Sauvegarde du chantier à part (il survit aux parties).

## 11. Vague du jour
- Graine = date (`AAAAMMJJ`) : mêmes groupes, mêmes positions pour toute la famille ; **10 vagues** (de difficulté moyenne, avec un vaisseau-mère à la fin), **sans le chantier** (Sentinelle, aucune amélioration) pour que ce soit juste.
- **Une seule tentative classée par jour, comptée dès le départ** (règle des défis du jour, comme les missions de Nebula) ; on peut rejouer ensuite sans classement. Score classé = score de la partie.
- Ajoutée à `TODAY` de l'accueil (marque du défi du jour).

## 12. Sons et musique
Reprendre `nebula/sons.js` (synthèse) : `canon` (canonnières, rail de l'amiral), `missile`, `laser` (en boucle discrète pendant le rayon), `explosion` (au plus une toutes les 80 ms), `bouclier` (amiral touché), `renforts`, `soin`, une sirène courte pour la frappe orbitale, `valide` / `bip` dans les menus, `victoire`, `defaite`. Musique : ambiance calme en préparation, tension pendant les vagues, thème du boss. Coupables dans la pause.

## 13. Technique
- Dossier **`defense-orbitale/`** : `index.html` (écrans HTML, styles), `jeu.js` (rendu, commandes, écrans), **`regles.js`** (logique pure, partagée avec Node : flottes, ennemis, vagues, pouvoirs, économie, recherche, score ; reprend `majPartie` de la maquette). Charge `nebula/sons.js`, `ludo-scores.js`. Scripts classiques, sans build.
- **Hasard à graine** dans toute la simulation (vague du jour reproductible), pas de `Math.random()` dans `regles.js` ; pas de temps réel dans la logique : `pas(P, dt)` à pas fixe (1/60 s).
- Tableaux réutilisés (tirs, particules) ; recherche des cibles bornée (au plus 80 ennemis).
- **Simulateur** `outils/defense-orbitale-simulateur.js` (Node, sans affichage) : un joueur automatique (construit, améliore, investit selon des règles simples, pilote auto, pouvoirs dès qu'ils sont prêts) joue des parties pour régler les vagues, les prix et l'économie (vague atteinte, crédits, intégrité de la Terre). Lancé par `verifications.js` en version courte.
- `window.DefenseOrbitale` pour les tests (état, `pas(dt)`, `lancerVague()`, `construire(poste, type)`, `pouvoir(nom)`).
- Plein écran et paysage au lancement d'une partie ; images/s réduites dans les menus.

## 14. Sauvegarde, classements, intégration
- Sauvegardes (préfixe `defense.`) : `defense.best` (score), `defense.vague` (meilleure vague), `defense.partie` (partie en cours, à la préparation), `defense.chantier` (médailles, déblocages), `defense.daily` {AAAAMMJJ: score}, `defense.dailyTry` (posée dès le départ), `defense.opts` (son, musique, vitesse). Toutes dans le transfert `LUDO1-`.
- Classement `defense-orbitale` : `best` (score), `vague` (meilleure vague), `daily:AAAAMMJJ` (le plus haut gagne).
- Suivre la **liste de contrôle « Ajouter un nouveau jeu »** de `specs/ludotheque.md` : accueil (`GAMES`, icône 16×16, `META` en tête, `NEWS`, `RECS`, `RANKS`, `PROGRESS`, `TODAY`), `ludo-scores.js` (`SYNC`), `sw.js` (`FILES`, `VERSION`), transfert, retour à la Ludothèque par le bouton `ludo-retour` de l'écran titre et de la pause, tests (`fumee.js`, `logique.js`), docs, **artefact** (demander d'abord le lien à l'utilisateur, ou en créer un s'il le dit).

## 15. Plan de travail (Opus, une conversation par session)
1. **Session 1, le combat** : `regles.js` (flottes, ennemis, tirs, limite orbitale, pouvoirs de base, vagues de test), rendu réaliste précalculé, commandes, interface de combat, pause, paysage et plein écran. Simulateur minimal. Une vague jouable sur le téléphone.
2. **Session 2, la partie** : 30 vagues et le vaisseau-mère, spécialisations, bilan, préparation, économie et recherche, sauvegarde de la partie, score, sons et musique ; réglages avec le simulateur.
3. **Session 3, l'intégration** : écran titre, chantier et amiraux, vague du jour, classements, accueil, transfert, tests, docs, artefact.

Coût estimé : 12 à 20 % de la semaine (gros chantier, § classement de `IDEES.md`).

## 16. Points à confirmer avec l'utilisateur
- Le bouton **vitesse ×2** pendant les vagues (§ 2).
- La **revente** à 50 % (§ 5) et la **réparation de la Terre** payante (§ 8).
- Les deux nouvelles flottes de la recherche, **brouilleur** et **relais de bouclier**, et les **postes avancés** (§ 9).
- Les quatre **vaisseaux amiraux** et les médailles (§ 10).
- La **vague du jour en 10 vagues**, sans chantier (§ 11).

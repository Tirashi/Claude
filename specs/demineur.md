# Démineur — cahier des charges

Idée de l'utilisateur du 22/11 : un démineur classique avec des tailles de grille, plus un mode « funky ».

## Maquettes
- [Maquette 1](https://claude.ai/artifact/1mopXAFRrRGjLZtiqToqs6) (`maquettes/demineur.html`) : Galets, Carte d'état-major, 16 bits ; cinq pistes de mode funky (Donjon des mines jouable). Styles refusés ; Donjon « prometteur mais à raffiner ».
- [Maquette 2](https://claude.ai/artifact/RGEQnhG3WApRMUesryCgm4) (`maquettes/demineur-2.html`) : 2D moderne + touches 32 bits (Arcade de poche, **Prairie**, Grotte de cristal), Donjon v2. Retours : police pixel des chiffres illisible (règle : plus de Pixelify Sans), Donjon pas rigolo (sommes de niveaux, règles pas claires) : le mode funky doit garder la règle pure.
- [Maquette 3](https://claude.ai/artifact/6pBZ9xyFPewRYzjy64FwWE) (`maquettes/demineur-3.html`) : Prairie, chiffres au choix, **Grande prairie** : **validée** le 22/11 (police **Outfit** pour les chiffres).

- [Maquette 4, thème sombre](https://claude.ai/artifact/Fmrz4vWzh4xzhDTzBKDJuR) (`maquettes/demineur-4.html`, 27/11) : A Nuit d'été (lune, lucioles), B Crépuscule, C Ardoise ; tuiles assombries vers une teinte de nuit, chiffres éclaircis ; **A choisie** le 27/11, avec un réglage Auto · Clair · Sombre.

## Le jeu (`demineur/`, 22/11)
- **Style Prairie** : interface claire et moderne (Sora), tuiles d'herbe et de terre en pixel art 16×16 dessinées par le code (aucune image), chiffres en Outfit 800.
- **Classique** : Facile 8×10 (10 mines), Moyen 12×18 (35), Difficile 16×26 (80), en portrait ; sur un écran en paysage (PC), la grille est tournée. Première case toujours sûre (mines tirées à la première touche). Tape = creuser, appui long / clic droit / bouton Drapeau (touche F) = drapeau, tape sur un chiffre entouré de ses drapeaux = dégager autour. Record = meilleur temps par taille.
- **Grande prairie** : 10 colonnes sans fin vers le bas, règles normales, 3 cœurs (une mine coûte un cœur), trèfle rare = +1 cœur (5 au plus), panier : fleur 1, cerises 3, œuf d'or 10 ; tous les 25 m le paysage change (Prairie, Champ de fleurs, Verger, Automne) et la densité monte (13 % → 24 %). Score = mètres + panier. Pas de sauvegarde de la partie en cours (quitter demande une deuxième touche).
- **Défi du jour** (demande de l'utilisateur : « une grille normale avec un temps, la difficulté augmente durant la semaine ») : graine = date, lundi 8×10/10, mardi 9×12/15, mercredi 10×14/22, jeudi 11×16/30, vendredi 12×18/40, samedi 14×22/56, dimanche 16×26/80. Même grille pour tous : la case vide la plus proche du centre est ouverte au départ. Chrono à la première touche. Une seule tentative classée : la partie est gardée dans `demineur.jourRun` (cases, drapeaux, temps, orientation) et reprise ; une mine = défi raté ; réussi ou raté, le jour se rejoue hors classement.

- **Thème sombre « Nuit d'été »** (27/11) : réglage Thème Auto · Clair · Sombre en bas du menu (`demineur.theme`, Auto suit `prefers-color-scheme` et ses changements) ; classe `.sombre` sur `<html>`, posée par un petit script dans `<head>` avant l'affichage ; couleurs en variables CSS ; tuiles assombries par `vers()` dans `jeu.js` ; lune dans le menu, lucioles (`#nuit`) ; chiffres éclaircis avec une lueur.

## Technique
- Fichiers : `index.html`, `style.css`, `jeu.js`, `fiche.js`. `window.Demineur` : `grilleDuJour(k)`, `tailleDuJour(k)`, `etat()`, `nouvelleGrille`, `nouvellePrairie`, `lancerJour`, `taper`, `marquer`.
- Sauvegardes : `demineur.best` {facile, moyen, difficile: ms}, `demineur.jour` {aaaammjj: ms}, `demineur.jourRun`, `demineur.prairie` {score, dist}.
- Classements `demineur` : `best:facile|moyen|difficile` (temps), `prairie` (points), `daily:AAAAMMJJ` (temps). Réglage `dmsize` dans le volet. Liens `#jour` et `#prairie`.

## Plus tard (idées)
- Sons, grilles sans hasard (jamais de 50/50 forcé), sauvegarde de la Grande prairie en cours, duel contre l'ordinateur, grilles en formes.

---
name: republier-artefact
description: Republier l'artefact claude.ai d'un jeu de la Ludothèque au même lien après une modification (tableau des liens de tous les jeux, fabrication de la copie avec outils/artefact.py).
---

# Republier l'artefact d'un jeu

1. Fabriquer la copie : `python3 outils/artefact.py <dossier>/index.html <scratchpad>/<jeu>.html` (intègre les scripts et styles locaux, retire ludo-scores.js et les boutons de retour). Lire les avertissements (liens relatifs restants).
2. Lire l'artefact existant (`Artifact`, `action: "read"`, `url` = lien ci-dessous), comme l'exige l'outil.
3. Publier avec `url` = le même lien et `file_path` = la copie. Ne pas passer `icon` (on garde celui de l'artefact).
4. Donner le lien à l'utilisateur.

Un jeu sans lien ci-dessous : demander le lien à l'utilisateur avant d'en créer un nouveau. Un nouveau lien d'artefact s'ajoute dans ce tableau.

| Jeu | Lien |
|---|---|
| Accueil de la Ludothèque (`index.html`) | https://claude.ai/artifact/2ThkvtRxf5y61K7bJWiAX7 |
| Amiral ! | https://claude.ai/artifact/XqUmx4zyyEARcrVjDHZE7v |
| Le Club d'agility | https://claude.ai/artifact/BT1R6L5DFd18w9A3XYghuc |
| Picross Dex | https://claude.ai/artifact/Ctm7ugtEDTNNCs6ExDViXQ |
| Lignée | https://claude.ai/artifact/LKCMLo7P1pC7QEJ5UyqcJA |
| Injagility, Infini (`injagility/index.html`) | https://claude.ai/artifact/Tk729YfzNqNXeBqfZYjs7k |
| Injagility, Parcours (`injagility/parcours.html`) | https://claude.ai/artifact/LxcviTcJyAAGWd32HwPGmb |
| Orbite | https://claude.ai/artifact/UysU574KpYMa7DdHhKsaHv |
| Lune-Rover | https://claude.ai/artifact/Caj42czGsSbBgwVmRVNR8T |
| Pont stellaire | https://claude.ai/artifact/Twgkpb1scdCh2Th6Nh35bF |
| Alunissage | https://claude.ai/artifact/2TgrmzSKuzoyPHYufyHrWh |
| Nebula | https://claude.ai/artifact/EPDtjTHPDsCnYKjtHCuxwY |
| La colonie (`ile/`) | https://claude.ai/artifact/9AnNRRCCBu4pgYh35UwrPb |
| Calculator | https://claude.ai/artifact/2S5ABaMyUfFsbsjRAWbJZD |
| Empilage | https://claude.ai/artifact/B7BHw4hC7rLzf9tT5kjuaB |
| Escadrille ! | https://claude.ai/artifact/SUuAXS5scLnstbth9eZ7zV |
| Yams | https://claude.ai/artifact/L4nurJpT9pb8BqpJTmvyZ3 |
| Le Magasinier | https://claude.ai/artifact/Uahoa9oJi7L8KFbNxj9TPX |
| Capitaine du port | https://claude.ai/artifact/7vRaNExcDvmDWeWGLeFsyq |
| Duché | https://claude.ai/artifact/5Ad2yYzProUEqpSx7Q3ook |
| Bannières (le jeu a remplacé la maquette 3 le 22/10) | https://claude.ai/artifact/WjSLr1Tx1CPvWEWGmGzyUQ |
| Le Thé des Jarls | https://claude.ai/artifact/PLQNi8AmqLteaTQg7eFcFs |
| La Boutique de cartes (le jeu a remplacé la maquette 2 le 23/10 ; Three.js depuis cdnjs) | https://claude.ai/artifact/CfcT2Wzc9QEsbNUouQD5Y6 |
| Doggy Saga | https://claude.ai/artifact/6BHJa8xeXP91zKLkf1GiN6 |

Queens, Sudoku, Touché Coulé, Tetris, Snake, Asteroids, Solitaire, le Jeu de la vie, Odyssée, Le Mot d'or, Romet et Résistance **n'ont pas d'artefact** : on les joue sur le site. Ne pas en créer sans demande.

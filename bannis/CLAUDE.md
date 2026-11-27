# Les Bannis (`bannis/`) — notes pour Claude

Autobattler rogue-lite, démo sur l'accueil. Cahier des charges : [`specs/bannis.md`](../specs/bannis.md) (§ 19 à 22 : dés, dé d'action, arbre).

## Fichiers
- `donnees.js` : `Bannis.D` — classes (et légendaires), traits, monstres (`i` = case de `img/monstres.png`), vagues, boss, objets, niveaux, sorts, marchand.
- `regles.js` : `Bannis.R` — sans affichage : héros (`stats()`), run, vagues, **combat** (`debutCombat`, `etape(C, dt)`, événements `C.ev`), **dé d'action** (`lancerAction`, prix 16 +8, `peutLancer`), sorts (`jeterSort`), **dés à symboles** (`run.faces` : `recruesDes`, `genererObjet(v, mieux, run)`, `offresAtelier`, `graverSymbole`, `appliquerEvenement`), sauvegarde (`VERSION_RUN` 2).
- `jeu.js` : canvas 360 × 760 ; écrans, sons synthétisés. Interface moderne dessinée en code (`MOD`, `carteM`, `consigne`, `tileFace` pour les dés animés) ; plus de planches `ui-*`. `Bannis.G` / `Bannis.J` pour les tests.
- `img/` : `heros.png` (12 feuilles RPG Maker MV, ordre `D.HEROS`), `monstres.png` (31 × 2 cases de 96), `icones.png` (Shikashi) ; `ui-*.png` inutilisées.
- Polices : `polices/bannis.css` (Jersey 10, Press Start 2P, Titillium Web).

## Sauvegardes
`bannis.run` (début de vague), `bannis.stats` (éclats ; transfert dans `fiche.js`), `bannis.arbre` (paliers, gravures, dés de départ), `.son`, `.vitesse`, `.tuto`, `.tuto2`.

## Artefact
https://claude.ai/artifact/XnEsz7CYgnAcRDCfhchcHh : `python3 outils/bannis-artefact.py <sortie>` puis republier au même lien.

## Tests
`node outils/bannis-simulateur.js [nuits] [--lancers]` ; fumée dans `outils/fumee.js` ; transfert dans `outils/logique.js`.

## Pièges
- Les héros regardent à gauche dans le pack : on retourne quand `dir > 0`. Les monstres sont déjà retournés dans la planche.
- Les zones de toucher sont refaites à chaque image (`zone()`) ; la dernière dessinée gagne (fenêtres par-dessus).
- Une nuit quittée pendant le butin reprend au placement de la même vague.

# Les Bannis (`bannis/`) — notes pour Claude

Autobattler rogue-lite, démo sur l'accueil. Cahier des charges : [`specs/bannis.md`](../specs/bannis.md) (sessions § 15).

## Fichiers
- `donnees.js` : `Bannis.D` — classes (et légendaires), traits, monstres (`i` = case de `img/monstres.png`), vagues, boss, objets, niveaux, sorts, marchand.
- `regles.js` : `Bannis.R` — sans affichage : héros (`stats()` = base + trait + équipement + légendaire), run, vagues (`composerVague`, `apercu`), **combat** (`debutCombat`, `etape(C, dt)` ; il remplit `C.ev` d'événements : degats, mort, or, soin, tir, mur, boss, chant, rate, eclair), dés et sorts, sauvegarde (`sauver` / `charger`, `VERSION_RUN`).
- `jeu.js` : canvas 360 × 760 agrandi sans lissage ; tous les écrans, fiche d'un héros, pause, sons synthétisés. `Bannis.G` (état) et `Bannis.J` (fonctions) servent aux tests.
- `img/` : planches de `outils/bannis-atlas.py` : `heros.png` (12 feuilles RPG Maker MV, ordre `D.HEROS`), `monstres.png` (31 × 2 cases de 96), `icones.png` (Shikashi), `ui-*.png` (Dragon Regalia).
- Polices : `polices/bannis.css` (Jersey 10 pour les textes, Press Start 2P pour les titres).

## Sauvegardes
`bannis.run` (écrite au début de chaque vague, au placement), `bannis.stats` (nuits, record, gagnees, eclats, kills ; transfert dans `fiche.js`), `bannis.son`, `bannis.vitesse`.

## Artefact
https://claude.ai/artifact/XnEsz7CYgnAcRDCfhchcHh : `python3 outils/bannis-artefact.py <sortie>` puis republier au même lien.

## Tests
`node outils/bannis-simulateur.js [nuits] [--des]` (équilibrage sans écran) ; fumée dans `outils/fumee.js` ; transfert dans `outils/logique.js`.

## Pièges
- Les héros regardent à gauche dans le pack : on retourne quand `dir > 0`. Les monstres sont déjà retournés dans la planche.
- Les zones de toucher sont refaites à chaque image (`zone()`) ; la dernière dessinée gagne (fenêtres par-dessus).
- Une nuit quittée pendant le butin reprend au placement de la même vague.

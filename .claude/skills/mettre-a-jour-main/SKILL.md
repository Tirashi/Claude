---
name: mettre-a-jour-main
description: Mettre à jour la branche main du dépôt Tirashi/Claude quand l'utilisateur dit « mets à jour main » (vérifications, CI, avance rapide seulement).
---

# Mettre à jour main

Seulement quand l'utilisateur le demande (« mets à jour main », « mets main à jour »).

1. Tout est commité et poussé sur la branche de travail (`git status` propre).
2. `node outils/verifications.js` (rapide, sans navigateur ; le lancer avec un délai de 5 min). Doit finir par « Tout est bon. ». Si ça échoue, corriger d'abord.
3. Regarder la CI du dernier commit poussé (outils GitHub : `mcp__github__actions_list` sur Tirashi/Claude, ou les check runs du commit). Rouge : trouver la cause (`fumee.js`, `logique.js`, `lint.js` en local seulement pour déboguer). Si on ne peut pas attendre la CI, le dire à l'utilisateur.
4. Avance rapide uniquement :
   ```
   git fetch origin main && git merge-base --is-ancestor origin/main HEAD && git push origin HEAD:main
   ```
   Si `merge-base` échoue, main a avancé : fusionner `origin/main` dans la branche de travail, revérifier, pousser la branche, puis recommencer. Jamais de `--force` sur main.
5. Dire à l'utilisateur ce qui part sur main (commits `ancien..nouveau`) et ce qui n'a pas été vérifié.

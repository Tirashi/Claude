# Bastion (chantier ouvert le 06/11)

Nom provisoire. Jeu de défense tactique en temps réel **à la Bad North** (idée de l'utilisateur du 06/11) : on défend un petit plateau contre des vagues d'ennemis avec quelques escouades ; on ne bâtit rien, on place ses troupes au bon endroit au bon moment. Jeu original : notre monde, nos unités, nos cartes (rien repris de Bad North).

## Décisions de l'utilisateur (06/11)
- **Univers** : médiéval **ou** asiatique ; **pas d'île**, pas forcément maritime → un plateau découpé posé comme une maquette sur la table ; les ennemis sortent de la forêt ou des chemins en bordure.
- **Graphismes** : à choisir sur la maquette (3D épurée ou pixel art isométrique).
- **Structure** : **niveaux fixes** (étoiles) + **défi du jour** pour toute la famille, avec classement (règle des défis du jour : une seule tentative classée).
- **Rythme** : **temps réel ralenti** : le jeu tourne seul et ralentit fortement quand on touche une escouade pour lui donner un ordre.

## Maquette 1 (06/11)
https://claude.ai/artifact/8qDoUNaYTK79s32mZquYWv — source `maquettes/bastion.html` (jouable ; Three.js r128 depuis cdnjs pour A et B, canvas 2D pour C).
Commun aux trois : plateau 9 × 9 à trois hauteurs, 4 maisons et une tour au sommet, 4 entrées en bordure ; 3 escouades (épées : 6 soldats ; archers : 5, tirent à 3 cases ; lances : 6, frappent fort) ; vagues de plus en plus grosses qui visent la maison la plus proche ; une escouade au repos près d'une maison debout se remet sur pied ; partie perdue quand tout brûle. Toucher une escouade (sur le plateau ou sa carte en bas) → **RALENTI** (×0,15) ; toucher le sol → elle y court.
- **A · médiéval en 3D** : hameau de Valbrune, toits de chaume, pins, tour ; parchemin et lettres gravées (Cinzel) ; on tourne autour du plateau en glissant le doigt.
- **B · asiatique en 3D** : temple de la Grue, pagode, torii, cerisiers, rônins au chapeau de paille ; papier de riz, laque rouge, encre (Shippori Mincho).
- **C · médiéval en pixel art isométrique** : le même hameau en 32 bits dessiné par le code, vue fixe ; fenêtres noires à bord blanc de la Ludothèque.

Retours (06/11) : **C abandonnée** ; A et B plaisent bien.

## Maquette 2 (06/11)
https://claude.ai/artifact/4K652xgNxZud1Dn5gqNfxx — source `maquettes/bastion-2.html`. Les deux mondes en 3D gardés, plus riches, et le menu qui les réunit :
- **A · le Royaume de l'Ouest** (Valbrune, plein jour) : rivière et pont de bois, rochers, cheminées et fumée des maisons touchées, épées à bouclier rond, archers, piquiers ; chef barbare casqué à cornes.
- **B · l'Empire de l'Est** (temple de la Grue, crépuscule) : brume, lanternes, étang, cerisiers, pagode à flèche dorée, torii à deux traverses ; samouraïs, grands arcs, naginata ; un oni rouge comme chef.
- **Le menu** : deux onglets, une campagne de **8 terres** par monde sur une carte dans son style (parchemin ou montagnes au soleil couchant), 3 étoiles par terre, et le **défi du jour** en bas (une tentative classée).
- Nouveautés de jeu, dans A et B : une **capacité spéciale** par escouade (bouton sous sa carte, puis attente : MUR / 盾 garde = plus de dégâts pendant 5 s ; SALVE / 雨 pluie = 3 flèches par archer ; CHARGE / 突 assaut = les lances foncent, dégâts doublés 3 s) ; un **chef** toutes les 3 vagues ; une **alerte** 3 s avant chaque vague (« Ils arrivent par l'est », flèche rouge à l'entrée) ; un **bilan** à chaque vague repoussée (★ toujours, + maisons peu touchées, + aucune escouade perdue) ; un repère blanc là où une escouade est envoyée.

Retours (06/11) : **on garde l'Empire de l'Est** (monde asiatique, B) ; le Royaume de l'Ouest n'est pas retenu. Mais les graphismes de la maquette (formes simples dessinées par le code) ne suffisent pas : **trouver de vrais modèles 3D** (packs CC0 ou payants autorisés, skill `packs-itch`, crédits) **ou les améliorer beaucoup**. Prochaine étape : chercher des packs de modèles 3D asiatiques (temple, maisons, samouraïs, rônins, cerisiers) et refaire une maquette avec.

## À décider ensuite
Nom du jeu ; nombre de niveaux et de mondes ; progression (escouades qui gagnent de l'expérience ? nouvelles troupes débloquées ?) ; règles des étoiles (maisons sauvées, temps, soldats perdus) ; contenu du défi du jour (carte et vagues imposées) ; ennemis spéciaux (béliers, cavaliers, archers ennemis, chefs).

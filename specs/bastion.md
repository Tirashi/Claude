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

Retours : à venir.

## À décider ensuite
Nom du jeu ; nombre de niveaux et de mondes ; progression (escouades qui gagnent de l'expérience ? nouvelles troupes débloquées ?) ; règles des étoiles (maisons sauvées, temps, soldats perdus) ; contenu du défi du jour (carte et vagues imposées) ; ennemis spéciaux (béliers, cavaliers, archers ennemis, chefs).

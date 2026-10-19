/* Le Magasinier : les niveaux (codage dans regles.js). opt : optimum en coups trouvé par le solveur,
   vérifié par outils/magasinier-solveur.js --optimum (il sert aux étoiles) ; sol : une solution optimale. aide : bulle affichée au début du niveau.
   Salles dessinées à la main (outils/magasinier-salles.js) ; marques et caisses placées par outils/magasinier-generateur.js. */
const MAG_ENTREPOTS = [
  { nom: "LE QUAI", court: "QUAI", debut: 0, n: 12, pret: true },
  { nom: "LA CHAMBRE FROIDE", court: "FROID", debut: 12, n: 12, pret: true },
  { nom: "L'ATELIER", court: "ATELIER", debut: 24, n: 0, pret: false },
  { nom: "LA FONDERIE", court: "FONDERIE", debut: 24, n: 0, pret: false },
  { nom: "LE GRAND ENTREPOT", court: "GRAND", debut: 24, n: 0, pret: false },
];
const MAG_NIVEAUX = [
  // ---- le quai ----
  { opt: 6, sol: "DDHGGG", plan: ["#######", "#.  $ #", "#  @  #", "#######"], aide: "Pousse la caisse sur la marque jaune : glisse le doigt sur l'écran ou touche les flèches." },
  { opt: 9, sol: "HHGGBGBDD", plan: ["######", "#    #", "# $  #", "#   +#", "######"], aide: "On ne peut que pousser, jamais tirer. Pense au chemin avant de pousser." },
  { opt: 20, sol: "GGBHDDDBBGGGHHDDBDBG", plan: ["#######", "#   @ #", "# $#$ #", "#. .  #", "#######"], aide: "Coincé ? Touche ANNULER pour revenir en arrière, autant de fois que tu veux." },
  { opt: 34, sol: "HHDDDDHHGGGBGBDDDGGHHDBHDDBBGGGHGB", plan: [" ######", "##    #", "# $$# #", "#     #", "#.## .#", "#@    #", "#######"] },
  { opt: 71, sol: "DDDBDBBBBGGGHHDDGGBBDDDHHGGHGGGBBDGHHDDBDDDHHGHGGGBHDDDBDBBBBGGGHGGHHDD", plan: [" #######", " #@   .#", "##$##  #", "#   .# #", "# #.$  #", "# $ ## #", "###    #", "  ######"] },
  { opt: 78, sol: "BBDDDDHHHGGBBHHDDBBBGGBGGHHHDGBBBDDHGBGHDDDDHHHGGBBHHDDBBBGGGDDDHHGHGBBHDDBBGG", plan: ["  #####", "###   #", "#@$$$ #", "#.# # #", "#..   #", "#   ###", "#####"] },
  { opt: 72, sol: "HDDDDHHGGHGGBDDDDHDBBGBGGHBDDHHGGHGGBDDDGBBDDHDHHGBGGBBDBDDHGGGHHDDBBDBG", plan: ["########", "#   #  #", "#   $  #", "###$# .#", "#      #", "#@ #.  #", "########"] },
  { opt: 89, sol: "HHGGDDBBGGGHHBBGGGHHHHDDDDDDBBGGGHBBBGGGHHDDGGHHDDDBBDDDHHGGGBBGGGBBDDDDDDHHGGGBHGGGBBDDD", plan: ["#########", "#  .    #", "# ## ##.#", "#  $ $ $#", "# ## ## #", "#    . @#", "#########"] },
  { opt: 84, sol: "GHGGBBBDDDDDHDHHGBBBGGGGGHHHDDBDDHDBGGGHGGBDGBBDHHDDDHDDBGGGGDDDBDBBGDHGGGGBGGHHHHDB", plan: ["#########", "#  .#   #", "#  $@$$ #", "# *###  #", "# .     #", "#   #.  #", "#       #", "#########"] },
  { opt: 78, sol: "GHHDDBBHHDDBBGGDBBGHHHHHBBBBBDDDDHHGBHGGBGHDDHHGGGGBBDDHBDDHDBDBBGGDHHHHHBGGGG", plan: ["  ######", "  #.  .#", "### ## #", "#.     #", "# # #  ##", "# @$$ $ #", "###  #$ #", "  # .   #", "  #######"] },
  { opt: 140, sol: "GHHDDDDDBBBGGHHHGGGBBDDGGHHDDDDDDHHGGGBHDDDBBBBBGGGHGGGHHDDDDDGGHHGGBHDDDDDBBBBGBGGBGGHGHHHDDDDDGGHHDDDBBBGBBGGHHHHBGGHHDDDGBBGGGBBDDGBBDDHH", plan: [" ########", " #    . #", "##$# ## #", "#       #", "# ##.#  #", "# @$$# .#", "# $#   .#", "##   ####", " #####"] },
  { opt: 96, sol: "HGGBGGHGBDDDHDDBGBBGGGBGGHDDDDDHHGGGHGGBDBHDDDHDDBGBBGGGBGGHDDDDBDHHHGGGHGBBHDDDDDHGBBBGGGBGGHDD", plan: ["#########", "#   #.  #", "#   $ $@#", "## ### ##", "# $ .  .#", "#   #   #", "#########"] },
  // ---- la chambre froide ----
  { opt: 9, sol: "DDDBDBGGG", plan: ["#######", "#@    #", "# ~~c #", "#.    #", "#######"], aide: "Sur la glace, tout glisse jusqu'au premier obstacle : les caisses comme le docker !" },
  { opt: 9, sol: "BGBDDDBDH", plan: ["#######", "# @  .#", "#~c~~~#", "#     #", "#     #", "#######"] },
  { opt: 13, sol: "HHHGHGBDDDHDB", plan: ["#######", "#  .  #", "# $ $ #", "#.~~~.#", "#  $  #", "#  @  #", "#######"] },
  { opt: 13, sol: "HGHDHGGBBHGBD", plan: ["########", "# .    #", "# ~~~c #", "# ~~c~ #", "#    .@#", "########"] },
  { opt: 28, sol: "DHHHDBGGHGBGGBDHHDDHGGBGBDDD", plan: ["########", "#   ~~ #", "#   c~ #", "#~c  . #", "#~a ## #", "#    . #", "########"] },
  { opt: 24, sol: "GGHGBBBBBGHGHDBGHHBDHDDD", plan: ["#########", "#~~~ ~~~#", "#~#~ ~#~#", "#~~~ c~a#", "#.     .#", "#~cc ~~~#", "#~#~ ~#~#", "#~~~.~~~#", "#########"] },
  { opt: 33, sol: "BBDBGGHGHHHDBBGBBDDHGBGHHHBBDBGGG", plan: ["#######", "#. #@ #", "# ~~~ #", "# c#c #", "# ~~~ #", "#.    #", "#######"] },
  { opt: 76, sol: "DBDBBBGGHGHHDDGGBBDDDDHHHHGBGHDBBBGGHGHHDDDBBGDHHGGGBBBBHDDDDHHGGGGDHHGGGBBB", plan: ["#########", "# $@ ~~.#", "# ## ~~ #", "#~~ $ $ #", "#~~ ### #", "#    ~~ #", "#.## ~~ #", "#.      #", "#########"] },
  { opt: 50, sol: "DHDBBHGBGBDDBDDHBGGHGBDHDBDBGBGHDBGHDBGGBDBDHGBDDD", plan: [" #######", "##  ~  #", "#. ~~~.#", "# ~~#~c#", "# $~~~ #", "## $a .#", " #######"] },
  { opt: 43, sol: "BBDBGHHDHGHGBDHGGGBGBBDHGHHDDBGHGBDHGGGGBGH", plan: ["########", "#.   $ #", "# ~~~~ #", "#+c##~ #", "#.~##c #", "# ~~~~ #", "#      #", "########"] },
  { opt: 71, sol: "DDDBBGDBBGGHBGHDHDBGBBGGHHDDGBBDDDDDHHBBGGGHHDBBHHGGGBBDBBGGGGGDHHHDDDB", plan: ["#########", "#@  ~   #", "# # ~$# #", "#~~~c~~~#", "#.# c #.#", "#.  ~   #", "#########"] },
  { opt: 67, sol: "BBBBDDDDDHHHBGHHGGHHDBGHDBGBDBGGGBBDDDHBDHGGGDDDHGHGBDBGGGGHGHHDBDD", plan: ["#########", "#@  ~~  #", "#.# ~~ ##", "#   cc  #", "#~~  .c~#", "# .## ~ #", "#       #", "#########"] },
];

if (typeof module !== 'undefined') module.exports = { MAG_NIVEAUX, MAG_ENTREPOTS };

# Fabrique maquettes/duche-kaykit.html (Duché en 3D, modèles KayKit) : modele.html + modèles convertis + moteur de Duché.
# 1. Modèles (pack KayKit Medieval Hexagon, CC0, à télécharger sur itch.io) :
#    python3 outils/kaykit-conversion.py <pack>/Assets/gltf modeles.js <liste ci-dessous>
#    hex_grass,hex_water,hex_river_A,hex_river_A_curvy,hex_river_B…G, et pour yellow, red, blue : building_{castle,windmill,
#    lumbermill,mine,market,barracks,tower_A}_<couleur>, flag_<couleur> ; puis building_scaffolding,building_grain,tent,
#    weaponrack,trees_A_large,trees_B_large,trees_A_medium,trees_B_medium,tree_single_A,tree_single_B,hills_A_trees,hills_B,
#    hill_single_A,hills_C_trees,mountain_A_grass_trees,mountain_B_grass,mountain_C_grass,rock_single_A,rock_single_C,
#    waterplant_A,waterplant_B,waterplant_C,waterlily_A,waterlily_B,cloud_big,cloud_small,resource_lumber,resource_stone,sack,crate_A_big
# 2. python3 outils/duche-3d/fabriquer.py modeles.js  (le moteur duche/regles.js, ia.js, evenements.js est copié tel quel)
import sys, os
ici = os.path.dirname(os.path.abspath(__file__)); racine = os.path.join(ici, '..', '..')
h = open(os.path.join(ici, 'modele.html')).read()
for k, f in [('MODELES', sys.argv[1]), ('REGLES', 'duche/regles.js'), ('IA', 'duche/ia.js'), ('EVENEMENTS', 'duche/evenements.js')]:
    c = open(f if k == 'MODELES' else os.path.join(racine, f)).read(); assert '</script' not in c; h = h.replace('/*' + k + '*/', c)
open(os.path.join(racine, 'maquettes', 'duche-kaykit.html'), 'w').write(h)

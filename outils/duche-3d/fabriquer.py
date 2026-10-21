# Fabrique maquettes/duche-kaykit.html (Duché en 3D) : modele.html + modèles KayKit convertis + personnages animés + moteur de Duché.
# 1. Modèles (pack KayKit Medieval Hexagon, CC0, itch.io) :
#    python3 outils/kaykit-conversion.py <pack>/Assets/gltf modeles.js <liste ci-dessous>
#    hex_grass,hex_water,hex_river_A,hex_river_A_curvy,hex_river_B…G, et pour yellow, red, blue : building_{castle,windmill,
#    lumbermill,mine,market,barracks,tower_A}_<couleur>, flag_<couleur> ; puis building_scaffolding,building_grain,tent,
#    weaponrack,trees_A_large,trees_B_large,trees_A_medium,trees_B_medium,tree_single_A,tree_single_B,hills_A_trees,hills_B,
#    hill_single_A,hills_C_trees,mountain_A_grass_trees,mountain_B_grass,mountain_C_grass,rock_single_A,rock_single_C,
#    waterplant_A,waterplant_B,waterplant_C,waterlily_A,waterlily_B,cloud_big,cloud_small,resource_lumber,resource_stone,sack,crate_A_big
# 2. Personnages animés : node outils/duche-3d/aventuriers.js <pack KayKit Adventurers> <pack KayKit Character Animations> aventuriers.js
# 3. L'interface en pixel art est dessinée par la page elle-même.
# python3 outils/duche-3d/fabriquer.py modeles.js aventuriers.js
# (chargeurs glTF de lib/ : GLTFLoader.js et SkeletonUtils.js, three.js r128)
import sys, os, base64, json
ici = os.path.dirname(os.path.abspath(__file__)); racine = os.path.join(ici, '..', '..')
modeles, aventuriers = sys.argv[1], sys.argv[2]
b64 = lambda f: 'data:image/png;base64,' + base64.b64encode(open(f, 'rb').read()).decode()
gltf = ''.join(open(os.path.join(racine, 'lib', f)).read() for f in ['GLTFLoader.js', 'SkeletonUtils.js'])
h = open(os.path.join(ici, 'modele.html')).read()
for k, c in [('MODELES', open(modeles).read()), ('AVENTURIERS', open(aventuriers).read()), ('GLTF', gltf)] + [(k, open(os.path.join(racine, 'duche', f)).read()) for k, f in [('REGLES', 'regles.js'), ('IA', 'ia.js'), ('EVENEMENTS', 'evenements.js')]]:
    assert '</script' not in c and '/*' + k + '*/' in h, k
    h = h.replace('/*' + k + '*/', c)
open(os.path.join(racine, 'maquettes', 'duche-kaykit.html'), 'w').write(h)
print(len(h))

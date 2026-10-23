# Fabrique maquettes/bannieres.html (maquette de Bannières, specs/bannieres.md) : modele.html + modèles KayKit convertis
# + personnages animés + duche/regles.js (pour la carte : ducCarte) + chargeurs glTF de lib/.
# Modèles et personnages : voir outils/duche-3d/fabriquer.py (mêmes fichiers ; aventuriers.js avec le mage).
# python3 outils/bannieres-maquette/fabriquer.py modeles.js,donjon.js,foret.js aventuriers.js
# (donjon.js : KayKit Dungeon Pack, variable DONJON, échelle 0.45 ; foret.js : KayKit Forest Nature Pack, variable FORET ;
#  aventuriers.js avec les squelettes et la lance : voir outils/duche-3d/aventuriers.js)
import sys, os
ici = os.path.dirname(os.path.abspath(__file__)); racine = os.path.join(ici, '..', '..')
modeles, aventuriers = sys.argv[1], sys.argv[2]
gltf = ''.join(open(os.path.join(racine, 'lib', f)).read() for f in ['GLTFLoader.js', 'SkeletonUtils.js'])
h = open(os.path.join(ici, 'modele.html')).read()
for k, c in [('MODELES', ''.join(open(f).read() for f in modeles.split(','))), ('AVENTURIERS', open(aventuriers).read()), ('GLTF', gltf), ('REGLES', open(os.path.join(racine, 'duche', 'regles.js')).read())]:
    assert '</script' not in c and '/*' + k + '*/' in h, k
    h = h.replace('/*' + k + '*/', c)
open(os.path.join(racine, 'maquettes', 'bannieres.html'), 'w').write(h)
print(len(h))

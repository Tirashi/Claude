# Fabrique maquettes/boutique-de-cartes.html (maquette de La Boutique de cartes, IDEES.md) : modele.html
# + modèles Kenney (CC0) en GLB base64 + leur atlas commun (colormap.png) + chargeurs glTF de lib/.
# Packs à télécharger sur kenney.nl : Mini Market, Mini Characters, Furniture Kit (dézippés dans un même dossier).
# python3 outils/boutique-maquette/fabriquer.py <dossier des packs Kenney>
import sys, os, base64, json
ici = os.path.dirname(os.path.abspath(__file__)); racine = os.path.join(ici, '..', '..')
kits = sys.argv[1]
MARCHE = ['floor', 'wall', 'wall-window', 'wall-door-rotate', 'wall-corner', 'column', 'shelf-boxes', 'shelf-end', 'cash-register',
          'freezer', 'freezers-standing', 'character-employee', 'shopping-basket']
PERSOS = ['character-female-a', 'character-male-c', 'character-female-d', 'character-male-e', 'character-male-a', 'character-female-b']
MEUBLES = ['table', 'chair', 'pottedPlant', 'cardboardBoxClosed', 'cardboardBoxOpen', 'rugRectangle', 'bookcaseOpen', 'lampSquareFloor', 'plantSmall2']
lire = lambda p: base64.b64encode(open(p, 'rb').read()).decode()
m = {}
for n in MARCHE: m[n] = lire(os.path.join(kits, 'kenney_mini-market', 'Models', 'GLB format', n + '.glb'))
for n in PERSOS: m[n] = lire(os.path.join(kits, 'kenney_mini-characters', 'Models', 'GLB format', n + '.glb'))
for n in MEUBLES: m[n] = lire(os.path.join(kits, 'kenney_furniture-kit', 'Models', 'GLTF format', n + '.glb'))
atlas = 'data:image/png;base64,' + lire(os.path.join(kits, 'kenney_mini-market', 'Models', 'GLB format', 'Textures', 'colormap.png'))
gltf = ''.join(open(os.path.join(racine, 'lib', f)).read() for f in ['GLTFLoader.js', 'SkeletonUtils.js'])
h = open(os.path.join(ici, 'modele.html')).read()
for k, c in [('MODELES', json.dumps(m)), ('ATLAS', json.dumps(atlas)), ('GLTF', gltf)]:
    assert '</script' not in c and '/*' + k + '*/' in h, k
    h = h.replace('/*' + k + '*/', c)
open(os.path.join(racine, 'maquettes', 'boutique-de-cartes.html'), 'w').write(h)
print(len(h))

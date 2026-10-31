"""Fabrique maquettes/usine.html : y glisse les modèles GLB du Factory Kit (Kenney, CC0)
et ses deux textures, en base64.
Usage : python3 -I outils/usine-maquette/fabriquer.py <dossier "Models" du pack> [source.html] [sortie.html]
Pack : https://kenney.nl/assets/factory-kit (copie sur https://opengameart.org/content/factory-kit)."""
import base64, json, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
MODELES = sys.argv[1]
SOURCE = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ICI, 'source.html')
SORTIE = sys.argv[3] if len(sys.argv) > 3 else os.path.join(ICI, '..', '..', 'maquettes', 'usine.html')
NOMS = open(os.path.join(ICI, 'modeles.txt')).read().split()

glb = os.path.join(MODELES, 'GLB format')
def b64(p):
    return base64.b64encode(open(p, 'rb').read()).decode()
mods = {n: b64(os.path.join(glb, n + '.glb')) for n in NOMS}
html = open(SOURCE, encoding='utf-8').read()
html = html.replace('__MODELES__', json.dumps(mods))
html = html.replace('__TEX_A__', 'data:image/png;base64,' + b64(os.path.join(glb, 'Textures', 'colormap.png')))
html = html.replace('__TEX_B__', 'data:image/png;base64,' + b64(os.path.join(MODELES, 'Textures', 'variation-a.png')))
open(SORTIE, 'w', encoding='utf-8').write(html)
print(SORTIE, len(html) // 1024, 'Ko,', len(mods), 'modèles')

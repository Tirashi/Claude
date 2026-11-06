"""Fabrique la maquette 3 de Bastion (le temple de la Grue avec des modèles gratuits, et la vitrine).
Reprend la simulation et l'interface de maquettes/bastion-2.html, glisse en base64 les GLB des trois packs
japonais de reodesuxz et les deux samouraïs FBX de LOWPO (version gratuite), et intègre GLTFLoader,
SkeletonUtils (lib/), FBXLoader et fflate (three@0.128.0, examples/js, paquet npm).
Usage : python3 -I outils/bastion-maquette/fabriquer.py <bourg du château> <sanctuaire> <dojo> <LOWPO Samurai_Free> <examples/js de three 0.128> <sortie.html>
Les packs ne sont pas dans le dépôt (pas de redistribution) : la page fabriquée sert d'artefact, elle n'est pas commitée.
Packs : https://reodesuxz.itch.io/low-poly-japanese-castle-town-pack, https://reodesuxz.itch.io/low-poly-japanese-shrine-pack,
https://reodesuxz.itch.io/low-poly-ninja-dojo-castle-pack, https://standout7.itch.io/lowpo-samurai"""
import base64, glob, json, os, sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.normpath(os.path.join(ICI, '..', '..'))
chateau, sanctuaire, dojo, lowpo, exemples, sortie = sys.argv[1:7]

def b64(p):
    return base64.b64encode(open(p, 'rb').read()).decode()

mod = {}
for pk, d in (('c', chateau), ('s', sanctuaire), ('d', dojo)):
    for f in sorted(glob.glob(os.path.join(d, '**', '*.glb'), recursive=True)):
        mod[pk + '/' + os.path.splitext(os.path.basename(f))[0]] = b64(f)
sam = {n: b64(os.path.join(lowpo, 'FBX', 'Characters', n + '.fbx')) for n in ('Samurai', 'Female_Samurai')}
tex = 'data:image/png;base64,' + b64(os.path.join(lowpo, 'Texture', 'Texture.png'))

b2 = open(os.path.join(RACINE, 'maquettes', 'bastion-2.html'), encoding='utf-8').read()
sim = b2[b2.index('/* ================= la simulation commune'):b2.index('/* ================= le rendu 3D')]

libs = ''
for p in (os.path.join(RACINE, 'lib', 'GLTFLoader.js'), os.path.join(RACINE, 'lib', 'SkeletonUtils.js'),
          os.path.join(exemples, 'libs', 'fflate.min.js'), os.path.join(exemples, 'loaders', 'FBXLoader.js')):
    libs += '<script>\n' + open(p, encoding='utf-8').read() + '\n</script>\n'

src = open(os.path.join(ICI, 'source.html'), encoding='utf-8').read()
html = (src.replace('__LIBS__', libs).replace('__SIM__', sim)
        .replace('__MODELES__', json.dumps(mod)).replace('__SAMOURAIS__', json.dumps(sam)).replace('__SAMTEX__', tex))
open(sortie, 'w', encoding='utf-8').write(html)
print(sortie, len(html) // 1024, 'Ko,', len(mod), 'modèles GLB +', len(sam), 'samouraïs')

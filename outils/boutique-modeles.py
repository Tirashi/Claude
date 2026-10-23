#!/usr/bin/env python3
"""La Boutique de cartes : fabrique boutique/modeles.js et boutique/images.js (outil de création, pas lancé par la CI).

    python3 outils/boutique-modeles.py <dossier des packs Kenney>

<dossier> : les packs Kenney (CC0) dézippés côte à côte : kenney_mini-market, kenney_mini-characters,
kenney_furniture-kit (kenney.nl/assets/mini-market, /mini-characters, /furniture-kit).

Écrit :
  - boutique/modeles.js : window.BOU_MODELES = { nom: GLB en base64 } et window.BOU_ATLAS (l'atlas commun
    colormap.png des packs Mini Market et Mini Characters, en data:, à passer en blob: avant GLTFLoader :
    voir specs/ludotheque.md, « Modèles glTF dans un artefact ») ;
  - boutique/images.js  : window.BOU_IMAGES = { monstres, cartes, dos } en data: (boutique/monstres.png,
    et la planche « Pixel Card Assets » de cafedraw, CC0, gardée dans outils/boutique-maquette/).
"""
import sys, os, base64, json

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
MARCHE = ['floor', 'wall', 'wall-window', 'wall-door-rotate', 'shelf-boxes', 'cash-register', 'freezer', 'freezers-standing', 'character-employee']
# 8 clients (chacun pèse ~240 Ko avec ses 32 animations)
PERSOS = ['character-female-a', 'character-female-b', 'character-female-c', 'character-female-d',
          'character-male-a', 'character-male-c', 'character-male-d', 'character-male-e']
MEUBLES = ['table', 'chair', 'pottedPlant', 'plantSmall2', 'bookcaseOpen', 'bookcaseOpenLow', 'lampSquareFloor']


def b64(p): return base64.b64encode(open(p, 'rb').read()).decode()


def main():
    kits = sys.argv[1]
    m = {}
    for n in MARCHE: m[n] = b64(os.path.join(kits, 'kenney_mini-market', 'Models', 'GLB format', n + '.glb'))
    for n in PERSOS: m[n] = b64(os.path.join(kits, 'kenney_mini-characters', 'Models', 'GLB format', n + '.glb'))
    for n in MEUBLES: m[n] = b64(os.path.join(kits, 'kenney_furniture-kit', 'Models', 'GLTF format', n + '.glb'))
    atlas = 'data:image/png;base64,' + b64(os.path.join(kits, 'kenney_mini-market', 'Models', 'GLB format', 'Textures', 'colormap.png'))
    with open(os.path.join(RACINE, 'boutique', 'modeles.js'), 'w') as f:
        f.write('/* La Boutique de cartes · modèles 3D Kenney (Mini Market, Mini Characters, Furniture Kit : Kenney Vleugels, CC0),\n'
                '   fabriqués par outils/boutique-modeles.py (ne pas modifier à la main) : GLB en base64 et atlas commun. */\n')
        f.write('window.BOU_MODELES=' + json.dumps(m) + ';\nwindow.BOU_ATLAS=' + json.dumps(atlas) + ';\n')
    ici = os.path.join(RACINE, 'outils', 'boutique-maquette')
    im = {'monstres': os.path.join(RACINE, 'boutique', 'monstres.png'), 'cartes': os.path.join(ici, 'cartes.png'), 'dos': os.path.join(ici, 'dos.png')}
    with open(os.path.join(RACINE, 'boutique', 'images.js'), 'w') as f:
        f.write('/* La Boutique de cartes · images des cartes, fabriquées par outils/boutique-modeles.py (ne pas modifier à la main) :\n'
                '   monstres de Dungeon Crawl Stone Soup (CC0), « Pixel Card Assets » de cafedraw (CC0). */\n')
        f.write('window.BOU_IMAGES=' + json.dumps({k: 'data:image/png;base64,' + b64(p) for k, p in im.items()}) + ';\n')
    print('modeles.js', os.path.getsize(os.path.join(RACINE, 'boutique', 'modeles.js')), 'images.js', os.path.getsize(os.path.join(RACINE, 'boutique', 'images.js')))


main()

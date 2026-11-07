#!/usr/bin/env python3
"""Fabrique la copie de maquettes/pokedex.html publiée en artefact.

Les images Pokémon ne sont pas dans le dépôt : ce script les télécharge sur le
dépôt PokeAPI/sprites (raw.githubusercontent.com) et les met en data: URI dans
la copie (un artefact ne peut pas charger d'images d'un autre site).

  python3 outils/pokedex-maquette/fabriquer.py SORTIE.html [DOSSIER_CACHE]
"""
import base64, io, json, os, sys, urllib.request
from PIL import Image

NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 172, 25, 26]
BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
ici = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(ici, '..', '..', 'maquettes', 'pokedex.html')
sortie = sys.argv[1]
cache = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(sortie)), 'sprites')
os.makedirs(cache, exist_ok=True)

def lire(nom, url):
    f = os.path.join(cache, nom)
    if not os.path.exists(f):
        urllib.request.urlretrieve(url, f)
    return Image.open(f)

def uri(img):
    b = io.BytesIO(); img.save(b, 'PNG', optimize=True)
    return 'data:image/png;base64,' + base64.b64encode(b.getvalue()).decode()

sprites = {}
for n in NUMS:
    sprites['p%d' % n] = uri(lire('p%d.png' % n, BASE + '%d.png' % n))
    a = lire('a%d.png' % n, BASE + 'other/official-artwork/%d.png' % n).convert('RGBA')
    a.thumbnail((240, 240), Image.LANCZOS)
    sprites['a%d' % n] = uri(a)

html = open(src, encoding='utf-8').read()
assert '/*SPRITES*/null' in html
html = html.replace('/*SPRITES*/null', json.dumps(sprites))
open(sortie, 'w', encoding='utf-8').write(html)
print(sortie, len(html) // 1024, 'Ko')

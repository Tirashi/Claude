#!/usr/bin/env python3
"""Fabrique la copie de maquettes/pokedex.html publiée en artefact.

Les images Pokémon ne sont pas dans le dépôt : ce script télécharge les sprites pixel
(et animés quand ils existent) sur le dépôt PokeAPI/sprites (raw.githubusercontent.com) et les met en data: URI dans
la copie (un artefact ne peut pas charger d'images d'un autre site).

  python3 outils/pokedex-maquette/fabriquer.py SORTIE.html [DOSSIER_CACHE]
"""
import base64, json, os, sys, urllib.request

NUMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 172, 25, 26, 906, 907, 908]
BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/'
ici = os.path.dirname(os.path.abspath(__file__))
src = os.path.join(ici, '..', '..', 'maquettes', 'pokedex.html')
sortie = sys.argv[1]
cache = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(sortie)), 'sprites')
os.makedirs(cache, exist_ok=True)

def lire(nom, url):
    f = os.path.join(cache, nom)
    if not os.path.exists(f):
        try:
            urllib.request.urlretrieve(url, f)
        except Exception:
            return None
    return open(f, 'rb').read()

def uri(octets, mime):
    return 'data:%s;base64,%s' % (mime, base64.b64encode(octets).decode())

sprites = {}
for n in NUMS:
    sprites['p%d' % n] = uri(lire('p%d.png' % n, BASE + '%d.png' % n), 'image/png')
    g = lire('g%d.gif' % n, BASE + 'other/showdown/%d.gif' % n)  # sprite animé (absent pour quelques-uns)
    if g:
        sprites['g%d' % n] = uri(g, 'image/gif')

html = open(src, encoding='utf-8').read()
assert '/*SPRITES*/null' in html
html = html.replace('/*SPRITES*/null', json.dumps(sprites))
open(sortie, 'w', encoding='utf-8').write(html)
print(sortie, len(html) // 1024, 'Ko')

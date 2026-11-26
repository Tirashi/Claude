"""Réduit et teinte les lignes d'angles produites par rendu.js, puis les écrit en PNG à 96 couleurs.
Usage : python3 -I outils/sprites-kenney/teinte.py <dossier de rendu.js> <dossier de sortie>
Rôles de Flotte du bureau : mineur (craft_miner, -14°), marchand (craft_cargoA, +128°), patrouille (craft_speederC, +165°), pirate (craft_speederD, -52°, plus sombre)."""
import sys, colorsys, io
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
def teinte(im, deg, val=1.0, sat=1.0):
    im = im.convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a == 0: continue
            h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
            r2, g2, b2 = colorsys.hsv_to_rgb((h+deg/360) % 1, min(1, s*sat), min(1, v*val))
            px[x, y] = (int(r2*255), int(g2*255), int(b2*255), a)
    return im
for modele, deg, val, sat, role in [('craft_miner', -14, 1.0, 1.1, 'm'), ('craft_cargoA', 128, .95, 1.0, 't'), ('craft_speederC', 165, 1.0, 1.1, 'p'), ('craft_speederD', -52, .85, 1.2, 'x')]:
    im = Image.open(f'{src}/{modele}.png'); n = im.width // im.height; t = 80
    petit = teinte(im.resize((t*n, t), Image.LANCZOS), deg, val, sat)
    petit.quantize(colors=96, method=Image.FASTOCTREE, dither=Image.NONE).save(f'{dst}/{role}.png', 'PNG', optimize=True)

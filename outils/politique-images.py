"""Images de l'écran de Politique, tirées du pack gratuit « Fantasy Map Assets Lite » (Deface Games).
Usage : python3 -I outils/politique-images.py <dossier Assets du pack>
Écrit politique/images/papier.jpg et politique/images/tampons/<nom>.png (réduits, recadrés)."""
import os, sys
from PIL import Image
ICI = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.dirname(ICI)
A = sys.argv[1]; SORTIE = os.path.join(RACINE, "politique", "images")
fond = Image.open(os.path.join(A, "backgrounds/base paper bg.png")).convert("RGBA")
fond.alpha_composite(Image.open(os.path.join(A, "backgrounds/base-paper-2.png")).convert("RGBA"))
fond.convert("RGB").crop((140, 110, 3700, 2050)).resize((1200, 1100), Image.LANCZOS).save(os.path.join(SORTIE, "papier.jpg"), quality=80)
T = {"mountains-black": ["mount%d" % i for i in range(1, 11)],
     "trees-black": ["pine1 solid", "pine3 solid", "tree1 solid", "tree4 solid", "tree6 solid", "tree7 solid", "tree8 solid"],
     "buildings-black": ["home solid", "village solid", "open-city solid", "watchtower solid", "cave solid"],
     "misc-black": ["compass"], "waves-black": ["waves 2"]}
for d, noms in T.items():
    for n in noms:
        im = Image.open(os.path.join(A, d, n + ".png")).convert("RGBA"); im = im.crop(im.getbbox())
        m = 360 if n == "compass" else 160; im.thumbnail((m, m), Image.LANCZOS)
        im.save(os.path.join(SORTIE, "tampons", n.replace(" solid", "").replace(" ", "_") + ".png"), optimize=True)
print("ok")

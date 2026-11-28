"""Maquette 11 des Bannis (28/11, les cercles de fortifications) : source11.html -> maquettes/bannis-11.html.
Usage : python3 -I outils/bannis-maquette/fabriquer11.py <planche.png> <planche.json>
planche.png / .json : planche des assets découpés, fabriquée par atlas11.py à partir des packs téléchargés
(voir specs/bannis.md § 28 et atlas11.py). Les héros et monstres viennent de bannis/img/."""
import sys, os, io, base64, json
from PIL import Image
ICI = os.path.dirname(os.path.abspath(__file__)); RAC = os.path.dirname(os.path.dirname(ICI))
def uri(chemin):
    b = io.BytesIO(); Image.open(chemin).convert("RGBA").save(b, "PNG", optimize=True); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
src = open(os.path.join(ICI, "source11.html"), encoding="utf8").read()
imgs = {"heros": uri(os.path.join(RAC, "bannis/img/heros.png")), "monstres": uri(os.path.join(RAC, "bannis/img/monstres.png")), "atlas": uri(sys.argv[1])}
out = src.replace("/*IMAGES*/{}", json.dumps(imgs)).replace("/*ATLAS*/{}", open(sys.argv[2]).read())
open(os.path.join(RAC, "maquettes/bannis-11.html"), "w", encoding="utf8").write(out)
print(len(out) // 1024, "Ko")

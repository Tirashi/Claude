"""Maquette 8 des Bannis (28/11, le jeu en paysage ?) : source8.html -> maquettes/bannis-8.html.
Usage : python3 -I outils/bannis-maquette/fabriquer8.py <portrait1.jpg> <portrait2.jpg>   (deux captures du jeu en portrait, pour la comparaison)"""
import sys, os, io, base64, json
from PIL import Image
ICI = os.path.dirname(os.path.abspath(__file__)); RAC = os.path.dirname(os.path.dirname(ICI))
def uri(n):
    b = io.BytesIO(); Image.open(os.path.join(RAC, "bannis/img", n + ".png")).convert("RGBA").save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
def jpg(p):
    b = io.BytesIO(); Image.open(p).convert("RGB").save(b, "JPEG", quality=80); return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()
src = open(os.path.join(ICI, "source8.html"), encoding="utf8").read()
out = src.replace("/*IMAGES*/{}", json.dumps({"heros": uri("heros"), "icones": uri("icones"), "monstres": uri("monstres")}))
out = out.replace("/*PORTRAIT1*/", jpg(sys.argv[1])).replace("/*PORTRAIT2*/", jpg(sys.argv[2]))
open(os.path.join(RAC, "maquettes/bannis-8.html"), "w", encoding="utf8").write(out)
print(len(out) // 1024, "Ko")

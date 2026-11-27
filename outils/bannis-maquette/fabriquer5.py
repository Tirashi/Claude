"""Maquette 5 des Bannis (26/11, le dé d'abord après Slotbound) : source5.html -> maquettes/bannis-5.html.
Usage : python3 -I outils/bannis-maquette/fabriquer5.py   (utilise seulement bannis/img/, pas de pack à télécharger)"""
import os, io, base64, json
from PIL import Image
ICI = os.path.dirname(os.path.abspath(__file__)); RAC = os.path.dirname(os.path.dirname(ICI))
def uri(n):
    b = io.BytesIO(); Image.open(os.path.join(RAC, "bannis/img", n + ".png")).convert("RGBA").save(b, "PNG", optimize=True)
    return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
src = open(os.path.join(ICI, "source5.html"), encoding="utf8").read()
out = src.replace("/*IMAGES*/{}", json.dumps({"heros": uri("heros"), "icones": uri("icones")}))
open(os.path.join(RAC, "maquettes/bannis-5.html"), "w", encoding="utf8").write(out)
print(len(out) // 1024, "Ko")

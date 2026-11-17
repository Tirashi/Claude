"""Maquette 4 de la carte de Politique : carte sur papier (17/11).

Usage : python3 -I fabriquer4.py <dossier Assets du pack « Fantasy Map Assets Lite » de Deface Games>
Écrit maquettes/politique-carte-4.html (images en base64 dans la page).
Le pack n'est pas dans le dépôt : le télécharger sur https://amanz.itch.io/fantasy-map-assets-pack-lite
"""
import base64, io, json, os, sys
from PIL import Image

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(os.path.dirname(ICI))
assets = sys.argv[1]

def b64(im, fmt="PNG", **kw):
    f = io.BytesIO(); im.save(f, fmt, **kw)
    return "data:image/%s;base64,%s" % (fmt.lower(), base64.b64encode(f.getvalue()).decode())

# la feuille (base-paper-2, avec transparence) posée sur le fond ; on garde l'intérieur de la feuille
fond = Image.open(os.path.join(assets, "backgrounds/base paper bg.png")).convert("RGBA")
fond.alpha_composite(Image.open(os.path.join(assets, "backgrounds/base-paper-2.png")).convert("RGBA"))
papier = fond.convert("RGB").crop((140, 110, 3700, 2050)).resize((1200, 1100), Image.LANCZOS)
TAMPONS = {
    "mountains-black": ["mount1", "mount2", "mount3", "mount4", "mount5", "mount6", "mount7", "mount8", "mount9", "mount10"],
    "trees-black": ["pine1 solid", "pine3 solid", "tree1 solid", "tree4 solid", "tree5 solid", "tree6 solid", "tree7 solid", "tree8 solid", "bush1 solid"],
    "buildings-black": ["home solid", "village solid", "open-city solid", "watchtower solid", "cave solid"],
    "icons-black": ["tower2", "bridge"],
    "misc-black": ["compass"],
    "waves-black": ["waves 2", "waves calm3"],
}
tampons = {}
for dossier, noms in TAMPONS.items():
    for n in noms:
        im = Image.open(os.path.join(assets, dossier, n + ".png")).convert("RGBA")
        bb = im.getbbox(); im = im.crop(bb) if bb else im
        im.thumbnail((360 if n == "compass" else 160, 360 if n == "compass" else 160), Image.LANCZOS)
        tampons[n.replace(" solid", "").replace(" ", "_")] = b64(im)

src = open(os.path.join(ICI, "source4.html"), encoding="utf-8").read()
src = src.replace("__PAPIER__", b64(papier, "JPEG", quality=80)).replace("__TAMPONS__", json.dumps(tampons))
sortie = os.path.join(RACINE, "maquettes", "politique-carte-4.html")
open(sortie, "w", encoding="utf-8").write(src)
print(sortie, "%.2f Mo" % (len(src) / 1e6))

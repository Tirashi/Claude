"""Fabrique la maquette de Terres d'Éveil : remplace chaque « @@nom@@ » de maquettes/terres-d-eveil.html
par l'image bastion/img/nom.png en base64 (images Tiny Swords achetées : la page fabriquée ne va pas dans le dépôt).
Usage : python3 outils/terres-maquette/fabriquer.py <fichier de sortie>"""
import base64, pathlib, re, sys
racine = pathlib.Path(__file__).resolve().parents[2]
src = (racine / "maquettes/terres-d-eveil.html").read_text(encoding="utf-8")
def img(m):
    f = racine / "bastion/img" / (m.group(1) + ".png")
    return "data:image/png;base64," + base64.b64encode(f.read_bytes()).decode()
pathlib.Path(sys.argv[1]).write_text(re.sub(r"@@([a-z0-9-]+)@@", img, src), encoding="utf-8")

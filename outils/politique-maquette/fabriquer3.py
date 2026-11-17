"""Politique, maquette 3 de la carte (17/11) : fabrique maquettes/politique-carte-3.html.
Usage : python3 -I fabriquer3.py <sprite-Sheet.png d'Isometric Strategy>
Images intégrées en base64 : la planche isométrique (crabcrabcrabs, CC BY 4.0) et la planche 16 px de l'Overworld
(Larchrow, libre dans un jeu, pas de redistribution du pack seul)."""
import sys, json, base64, os
ICI = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.dirname(os.path.dirname(ICI))
iso = sys.argv[1]
b64 = lambda f: "data:image/png;base64," + base64.b64encode(open(f, "rb").read()).decode()
src = open(os.path.join(ICI, "source3.html")).read()
src = src.replace("__ISO_PNG__", b64(iso))
sortie = os.path.join(RACINE, "maquettes/politique-carte-3.html")
open(sortie, "w").write(src)
print(sortie, round(len(src) / 1e6, 2), "Mo")

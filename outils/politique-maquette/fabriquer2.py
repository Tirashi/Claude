"""Politique, maquette 2 de la carte (17/11) : fabrique maquettes/politique-carte-2.html.
Usage : python3 -I fabriquer2.py <sprite-Sheet.png d'Isometric Strategy> <dossier larchrow-16x16-overworld>
Images intégrées en base64 : la planche isométrique (crabcrabcrabs, CC BY 4.0) et la planche 16 px de l'Overworld
(Larchrow, libre dans un jeu, pas de redistribution du pack seul)."""
import sys, json, base64, os
ICI = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.dirname(os.path.dirname(ICI))
iso, ow = sys.argv[1:3]
b64 = lambda f: "data:image/png;base64," + base64.b64encode(open(f, "rb").read()).decode()
idx = json.load(open(os.path.join(ow, "tile_index.json")))
noms = {t["name"]: [t["column"], t["row"]] for t in idx["tiles"]}
src = open(os.path.join(ICI, "source2.html")).read()
src = src.replace("__OW_NOMS__", json.dumps(noms, separators=(",", ":")))
src = src.replace("__ISO_PNG__", b64(iso)).replace("__OW_PNG__", b64(os.path.join(ow, "Tilesheets/larchrow_ow_16x16.png")))
sortie = os.path.join(RACINE, "maquettes/politique-carte-2.html")
open(sortie, "w").write(src)
print(sortie, round(len(src) / 1e6, 2), "Mo")

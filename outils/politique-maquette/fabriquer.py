"""Politique : fabrique maquettes/politique-carte.html (images intégrées en base64).
Usage : python3 -I fabriquer.py <atlas_ts.png> <atlas_ts.json>
Direction B : img/decor.png et atlas.js de Terres franches (déjà dans le dépôt)."""
import sys, json, base64, re, os
ICI = os.path.dirname(os.path.abspath(__file__)); RACINE = os.path.dirname(os.path.dirname(ICI))
ts_png, ts_json = sys.argv[1:3]
b64 = lambda f: "data:image/png;base64," + base64.b64encode(open(f, "rb").read()).decode()
atlas_tf = re.search(r"window\.TerresAtlas = (\{.*?\});", open(os.path.join(RACINE, "terres-franches/atlas.js")).read()).group(1)
src = open(os.path.join(ICI, "source.html")).read()
src = src.replace("__ATLAS_TS_JSON__", open(ts_json).read()).replace("__ATLAS_TF_JSON__", atlas_tf)
src = src.replace("__ATLAS_TS_PNG__", b64(ts_png)).replace("__ATLAS_TF_PNG__", b64(os.path.join(RACINE, "terres-franches/img/decor.png")))
sortie = os.path.join(RACINE, "maquettes/politique-carte.html")
open(sortie, "w").write(src)
print(sortie, round(len(src) / 1e6, 2), "Mo")

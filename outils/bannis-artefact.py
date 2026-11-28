"""Les Bannis : copie pour l'artefact. Lance outils/artefact.py, puis met les images de bannis/img/ en data:
(window.BANNIS_IMG, lu par jeu.js) et charge Jersey 10 depuis Google Fonts.
Usage : python3 outils/bannis-artefact.py <sortie.html>"""
import sys, os, base64, json, subprocess, glob
RAC = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); out = sys.argv[1]
subprocess.run([sys.executable, os.path.join(RAC, "outils", "artefact.py"), os.path.join(RAC, "bannis", "index.html"), out], check=True)
s = open(out, encoding="utf8").read()
imgs = {os.path.basename(p)[:-4]: "data:image/png;base64," + base64.b64encode(open(p, "rb").read()).decode() for p in sorted(glob.glob(os.path.join(RAC, "bannis", "img", "*.png")))}
i = s.index("<script>"); s = s[:i] + "<script>window.BANNIS_IMG = " + json.dumps(imgs) + ";</script>\n" + s[i:]
s = s.replace("family=Press+Start+2P&family=VT323&display=swap", "family=Press+Start+2P&family=Jersey+10&family=Titillium+Web:wght@600;700&display=swap")
open(out, "w", encoding="utf8").write(s)
print(out, len(s)//1024, "Ko,", len(imgs), "images")

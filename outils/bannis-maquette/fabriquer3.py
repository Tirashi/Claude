"""Maquette 3 des Bannis (19/11, combat en mouvement) : source3.html (dérivé de source2.html) -> maquettes/bannis-3.html.
Usage : python3 -I outils/bannis-maquette/fabriquer3.py <dossier des packs téléchargés>
Packs (tous gratuits) : pc (Pixel Champions), mm (Free Mythic Monsters), ic (Shikashi),
mp-mighty-battle-pack-addon (The Mighty Palm, CC0), ui-tiny-rpg-dragon-regalia-gui (tiopalada, CC0),
ui-dark-ages-ui (Hypnobius)."""
import sys, os, glob, io, base64, json
from PIL import Image
P = sys.argv[1]
ICI = os.path.dirname(os.path.abspath(__file__)); RAC = os.path.dirname(os.path.dirname(ICI))
A = {}
def uri(im):
    b = io.BytesIO(); im.save(b, "PNG", optimize=True); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
def g(m):
    r = glob.glob(os.path.join(P, m)); assert r, m; return r[0]
def o(m): return Image.open(g(m)).convert("RGBA")
for n in ["oratio-2", "hex", "linail-2", "glenys", "prime", "wyvera", "ouzo", "ouzo-3", "ley-2", "ley-3"]:
    nom, _, pal = n.partition("-")
    A["pc-" + n] = uri(o(f"pc/x/Pixel_Champions_v3/1x-NormalSize/Battlers/{nom}-battle{('-' + pal) if pal else ''}.png"))
for m in ["019", "016", "006", "014", "008", "009", "017"]:
    A["mm-" + m] = uri(o(f"mm/x/*/*/Transparent/1x Size/{m}_1.png"))
for a in ["h1", "p1", "w2", "w1", "r1", "n1", "c1", "p3"]:
    A["mg-" + a] = uri(o(f"mp-mighty-battle-pack-addon/x/*/sv_actors/{a}.png"))
for e in ["Goblin", "Skeleton", "Werewolf", "Vampire"]:
    A["me-" + e] = uri(o(f"mp-mighty-battle-pack-addon/x/*/sv_enemies/{e}.png"))
A["icones"] = uri(o("ic/x/*/#2*.png"))
D = "ui-tiny-rpg-dragon-regalia-gui/x/"
for k, f in [("rg-A", "20240707dragon9SlicesA.png"), ("rg-B", "20240707dragon9SlicesB.png"), ("rg-C", "20240707dragon9SlicesC.png"),
             ("rg-btnA", "20240709dragonButtonA-Sheet.png"), ("rg-btnB", "20240709dragonButtonB-Sheet.png"),
             ("rg-barB", "20240709dragonBarB.png"), ("rg-head", "20240707dragonHeaderA.png"), ("rg-cible", "20240711dragonCursorTarget-Sheet.png")]:
    A[k] = uri(o(D + f))
A["da"] = uri(o("ui-dark-ages-ui/x/DarkAgesUi_v1.0/32x32-Tilesheet.png"))
src = open(os.path.join(ICI, "source3.html"), encoding="utf8").read()
out = src.replace("/*IMAGES*/{}", json.dumps(A))
open(os.path.join(RAC, "maquettes/bannis-3.html"), "w", encoding="utf8").write(out)
print(len(out) // 1024, "Ko")

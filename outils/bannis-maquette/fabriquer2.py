"""Maquette 2 des Bannis (18/11) : source2.html (dérivé du moteur de source.html) -> maquettes/bannis-2.html.
Usage : python3 -I outils/bannis-maquette/fabriquer2.py <dossier des packs téléchargés>
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
for m in ["019", "016", "006", "014"]:
    A["mm-" + m] = uri(o(f"mm/x/*/*/Transparent/1x Size/{m}_1.png"))
for a in ["h1", "p1", "w2", "w1", "r1", "n1", "c1", "p3"]:
    A["mg-" + a] = uri(o(f"mp-mighty-battle-pack-addon/x/*/sv_actors/{a}.png"))
for e in ["Goblin", "Skeleton", "Werewolf", "Vampire"]:
    A["me-" + e] = uri(o(f"mp-mighty-battle-pack-addon/x/*/sv_enemies/{e}.png"))
A["icones"] = uri(o("ic/x/*/#2*.png"))
# bestiaire gratuit de Willibab : Free Mythic Monsters (31 x 3 couleurs, retournés pour regarder à gauche),
# Monster Pack (lignées en 2 ou 3 stades) et Nostalgic (3 monstres)
def planche(ps, retourner, cols, case):
    from PIL import ImageOps
    lignes = (len(ps)+cols-1)//cols; out = Image.new("RGBA", (cols*case, lignes*case), (0,0,0,0))
    for i, p in enumerate(ps):
        im = Image.open(p).convert("RGBA")
        if retourner: im = ImageOps.mirror(im)
        im.thumbnail((case-4, case-4), Image.NEAREST)
        out.alpha_composite(im, ((i%cols)*case + (case-im.width)//2, (i//cols)*case + case-2-im.height))
    return out
mm = sorted(glob.glob(os.path.join(P, "mm/x/*/*/Transparent/1x Size/*.png")))
mm.sort(key=lambda p: (os.path.basename(p).split("_")[1], os.path.basename(p)))
A["best-mm"] = uri(planche(mm, True, 12, 68))
wp = [p for p in sorted(glob.glob(os.path.join(P, "x-willibabs-monster-pack/x/**/*.png"), recursive=True)) if Image.open(p).width > 40]
wp += sorted(glob.glob(os.path.join(P, "x-nostalgic-retro-enemy-sprites/x/**/*.png"), recursive=True))[:3]
A["best-wp"] = uri(planche(wp, False, 8, 92))
D = "ui-tiny-rpg-dragon-regalia-gui/x/"
for k, f in [("rg-A", "20240707dragon9SlicesA.png"), ("rg-B", "20240707dragon9SlicesB.png"), ("rg-C", "20240707dragon9SlicesC.png"),
             ("rg-btnA", "20240709dragonButtonA-Sheet.png"), ("rg-btnB", "20240709dragonButtonB-Sheet.png"),
             ("rg-barB", "20240709dragonBarB.png"), ("rg-head", "20240707dragonHeaderA.png"), ("rg-cible", "20240711dragonCursorTarget-Sheet.png")]:
    A[k] = uri(o(D + f))
A["da"] = uri(o("ui-dark-ages-ui/x/DarkAgesUi_v1.0/32x32-Tilesheet.png"))
src = open(os.path.join(ICI, "source2.html"), encoding="utf8").read()
out = src.replace("/*IMAGES*/{}", json.dumps(A))
open(os.path.join(RAC, "maquettes/bannis-2.html"), "w", encoding="utf8").write(out)
print(len(out) // 1024, "Ko")

"""Maquette « Les Bannis » (18/11) : fabrique maquettes/bannis.html à partir de source.html
en y collant les images en data: URI.
Usage : python3 -I outils/bannis-maquette/fabriquer.py <dossier des packs téléchargés>
Le dossier contient z1, z2 (Tiny RPG de Zerie, échantillons gratuits), de (Fantasy Dices d'aeynit),
pc (Pixel Champions), mm (Free Mythic Monsters de Willibab), ic (icônes de Shikashi), décompressés dans x/.
Tiny Swords est pris dans bastion/img/."""
import sys, os, glob, io, base64, json
from PIL import Image
P = sys.argv[1]
ICI = os.path.dirname(os.path.abspath(__file__)); RAC = os.path.dirname(os.path.dirname(ICI))
A = {}
def uri(im):
    b = io.BytesIO(); im.save(b, "PNG", optimize=True); return "data:image/png;base64," + base64.b64encode(b.getvalue()).decode()
def g(m):
    r = glob.glob(os.path.join(P, m)); assert r, m; return r[0]
# A : Zerie (feuilles de 100 x 100, une ligne par action)
z1 = "z1/x/*/Characters*/"; z2 = "z2/x/*/Characters*/"
for nom, base, perso in [("sol", z1, "Soldier/Soldier/Soldier"), ("orc", z1, "Orc/Orc/Orc"),
                         ("dem", z2, "Demon_A/Demon_A/Demon_A"), ("sang", z2, "Blood Monster_A/Blood Monster_A/Blood Monster_A")]:
    for act, f in [("repos", "Idle"), ("coup", "Attack01"), ("mal", "Hurt"), ("mort", "Death")]:
        A[f"{nom}-{act}"] = uri(Image.open(g(base + perso + f"_{f}.png")).convert("RGBA"))
# dés peints d'aeynit, réduits
for c, coul in [("color1", "v"), ("color9", "j")]:
    for d in ["d6", "d8", "d20"]:
        im = Image.open(g(f"de/x/Dices/{c}/{d}.png")).convert("RGBA"); im.thumbnail((88, 88), Image.LANCZOS)
        A[f"de-{coul}-{d}"] = uri(im)
# B : Pixel Champions (feuilles RPG Maker MV, 9 x 6 cases de 32 px) et monstres de Willibab
for h in ["linail", "hex", "prime"]:
    A[f"pc-{h}"] = uri(Image.open(g(f"pc/x/Pixel_Champions_v3/1x-NormalSize/Battlers/{h}-battle.png")).convert("RGBA"))
for m in ["019", "016", "006", "014"]:
    A[f"mm-{m}"] = uri(Image.open(g(f"mm/x/*/*/Transparent/1x Size/{m}_1.png")).convert("RGBA"))
# icônes de Shikashi (planche 32 x 32 avec ombre)
A["icones"] = uri(Image.open(g("ic/x/*/#2*.png")).convert("RGBA"))
# C : Tiny Swords (images de Bastion)
for n in ["guer", "arc", "moine", "lance", "gob", "gnoll", "troll"]:
    for act in ["repos", "coup"]:
        A[f"ts-{n}-{act}"] = uri(Image.open(os.path.join(RAC, "bastion/img", f"{n}-{act}.png")).convert("RGBA"))
src = open(os.path.join(ICI, "source.html"), encoding="utf8").read()
out = src.replace("/*IMAGES*/{}", json.dumps(A))
open(os.path.join(RAC, "maquettes/bannis.html"), "w", encoding="utf8").write(out)
print(len(out) // 1024, "Ko")

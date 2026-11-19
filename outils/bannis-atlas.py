"""Les Bannis : fabrique les planches d'images de bannis/img/ à partir des packs téléchargés.
Usage : python3 -I outils/bannis-atlas.py <dossier des packs>
Packs : pc (Pixel Champions, alexpixels), mm (Free Mythic Monsters, Willibab), ic (Shikashi's Fantasy Icons),
ui-tiny-rpg-dragon-regalia-gui (tiopalada, CC0). Voir credits/index.html."""
import sys, os, glob
from PIL import Image, ImageOps
P = sys.argv[1]
RAC = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(RAC, "bannis", "img")
def g(m):
    r = glob.glob(os.path.join(P, m)); assert r, m; return r[0]
# héros : 12 feuilles RPG Maker MV (288 x 192), empilées dans l'ordre de HEROS (donnees.js)
HEROS = ["glenys-3", "glenys", "oratio-2", "oratio", "ley-2", "prime", "hex", "hex-3", "linail-2", "wyvera", "ouzo", "ouzo-3"]
h = Image.new("RGBA", (288, 192*len(HEROS)), (0,0,0,0))
for i, n in enumerate(HEROS):
    nom, _, pal = n.partition("-")
    im = Image.open(g(f"pc/x/Pixel_Champions_v3/1x-NormalSize/Battlers/{nom}-battle{('-'+pal) if pal else ''}.png")).convert("RGBA")
    h.alpha_composite(im, (0, i*192))
h.save(os.path.join(OUT, "heros.png"), optimize=True)
# monstres : les 31 de Free Mythic Monsters, 2 couleurs (ligne 0 = normale, 1 = élite), retournés pour regarder à gauche
m = Image.new("RGBA", (64*31, 64*2), (0,0,0,0))
for i in range(31):
    for c in (1, 2):
        im = ImageOps.mirror(Image.open(g(f"mm/x/*/*/Transparent/1x Size/{i+1:03d}_{c}.png")).convert("RGBA"))
        m.alpha_composite(im, (i*64, (c-1)*64))
m.save(os.path.join(OUT, "monstres.png"), optimize=True)
Image.open(g("ic/x/*/#2*.png")).convert("RGBA").save(os.path.join(OUT, "icones.png"), optimize=True)
D = "ui-tiny-rpg-dragon-regalia-gui/x/"
for k, f in [("ui-cadre", "20240707dragon9SlicesA.png"), ("ui-panneau", "20240707dragon9SlicesB.png"), ("ui-petit", "20240707dragon9SlicesC.png"),
             ("ui-boutons", "20240709dragonButtonA-Sheet.png"), ("ui-boutons2", "20240709dragonButtonB-Sheet.png"),
             ("ui-barre", "20240709dragonBarB.png"), ("ui-ruban", "20240707dragonHeaderA.png")]:
    Image.open(g(D + f)).convert("RGBA").save(os.path.join(OUT, k + ".png"), optimize=True)
print("ok", sorted(os.listdir(OUT)))

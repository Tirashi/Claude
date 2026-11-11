"""Maquette 8 de Terres franches (11/11) : l'ère 2, « la côte ». Deux directions pour la nouvelle carte, composées avec les morceaux
du jeu (terres-franches/img/decor.png, atlas.js) et du pack « Medieval Harbour Pixel Art Tileset » (même auteur que Cute SCKR, acheté sur itch.io).
 A « La plage » : la côte en bas, une plage de sable, des pontons de bois, barques et voilier, cabanes de pêcheurs et filets, un phare.
 B « Le port de pierre » : un bassin fermé par des quais de pierre, entrepôts sur pilotis, étals de poisson, scierie au bord de l'eau.
Usage : python3 -I outils/terres-maquette/fabriquer-8.py <dossier du pack Medieval Harbour (tile-B-0*.png)> <dossier de sortie des images>"""
import json, pathlib, random, sys
from PIL import Image
racine = pathlib.Path(__file__).resolve().parents[2]
H, OUT = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
jeu = racine / "terres-franches"
dec = Image.open(jeu / "img/decor.png").convert("RGBA")
AT = json.loads((jeu / "atlas.js").read_text().split("window.TerresAtlas = ")[1].split(";\n")[0])
def m(n, k=1):   # un morceau du jeu, à l'échelle k
  a = AT[n]; im = dec.crop((a[0], a[1], a[0] + a[2], a[1] + a[3]))
  return im if k == 1 else im.resize((round(im.width * k), round(im.height * k)), Image.NEAREST)
P = {n: Image.open(next(H.rglob(f"tile-B-0{n}.png"))).convert("RGBA") for n in (1, 2, 3, 4, 5)}
def h(f, x, y, l, hh, k=1):   # un morceau du pack du port
  im = P[f].crop((x, y, x + l, y + hh)); bb = im.getbbox(); im = im.crop(bb) if bb else im
  return im if k == 1 else im.resize((round(im.width * k), round(im.height * k)), Image.NEAREST)
r = random.Random(3)
W, HT = 416, 736   # un écran de téléphone (13 × 23 cases de 32 px)
def fond(img, tuile, x0, y0, x1, y1):
  for y in range(y0, y1, tuile.height):
    for x in range(x0, x1, tuile.width): img.alpha_composite(tuile.crop((0, 0, min(tuile.width, x1 - x), min(tuile.height, y1 - y))), (x, y))
def pied(img, im, X, Y):   # pose une image, le milieu du bas en (X, Y)
  img.alpha_composite(im, (round(X - im.width / 2), round(Y - im.height)))
herbe = m("herbe"); terre = m("terre")
mer = P[3].crop((192, 0, 384, 192)).resize((96, 96), Image.NEAREST)
rive = P[3].crop((384, 0, 768, 192))   # sable en haut, écume, puis la mer
sable = P[1].crop((580, 4, 760, 150))
def rue(img, pts, w=22):
  from PIL import ImageDraw
  d = ImageDraw.Draw(img)
  for (a, b), (c, e) in zip(pts, pts[1:]): d.line((a, b, c, e), fill=(196, 160, 108, 255), width=w); d.ellipse((c - w / 2, e - w / 2, c + w / 2, e + w / 2), fill=(196, 160, 108, 255))
def scene_a():
  img = Image.new("RGBA", (W, HT)); fond(img, herbe, 0, 0, W, HT)
  # la mer en bas, la plage au-dessus
  fond(img, mer, 0, 560, W, HT)
  for x in range(0, W, 384): img.alpha_composite(rive.crop((0, 0, min(384, W - x), 192)), (x, 470))
  fond(img, sable, 0, 430, W, 486)
  rue(img, [(208, 0), (208, 150), (150, 260), (150, 380), (110, 450)]); rue(img, [(150, 260), (300, 290), (330, 440)])
  # forêt en haut à gauche
  for (x, y, n) in [(30, 90, "s-arbre1"), (80, 60, "s-arbre2"), (20, 170, "s-arbre3"), (380, 70, "s-arbre1"), (400, 150, "s-arbre4")]: pied(img, m(n, .8), x, y)
  # le village : chaumières et maisons, la place et la fontaine
  for (x, y, n) in [(95, 230, "chaume2"), (290, 220, "colomb1"), (250, 360, "chaume1"), (60, 370, "colomb2")]: pied(img, m(n), x, y)
  pied(img, m("puits", .7), 190, 300)
  # la plage : cabanes de pêcheurs, filets, barques tirées sur le sable, séchoir
  pied(img, h(5, 395, 575, 90, 100, .8), 40, 500); pied(img, h(5, 490, 575, 90, 100, .8), 380, 495)
  pied(img, m("sechoir-poisson", .55), 205, 470); pied(img, h(4, 12, 55, 66, 30), 280, 505)
  # les pontons, les barques et le voilier
  for k in range(4): img.alpha_composite(h(1, 196, 300, 190, 70), (110, 520 + k * 0) if k == 0 else (110, 520))
  pon = h(1, 0, 0, 90, 380).crop((0, 0, 90, 160)); img.alpha_composite(pon, (150, 505))
  pied(img, h(4, 192, 395, 95, 85, .75), 260, 640); pied(img, h(4, 12, 110, 66, 30), 115, 590); pied(img, h(4, 195, 575, 92, 95, .8), 345, 705)
  pied(img, h(3, 388, 575, 50, 95, .9), 395, 445)   # le phare
  return img
def scene_b():
  img = Image.new("RGBA", (W, HT)); fond(img, herbe, 0, 0, W, HT)
  # le bassin de pierre (pièce du pack), la mer autour
  fond(img, mer, 0, 520, W, HT)
  quai = P[3].crop((0, 385, 385, 768)); img.alpha_composite(quai, (16, 390))
  pied(img, h(4, 192, 495, 95, 85, .75), 330, 720)
  fond(img, P[1].crop((100, 384, 190, 470)), 0, 360, W, 400)   # le quai de pierre le long de la côte
  rue(img, [(208, 0), (208, 330)]); rue(img, [(60, 240), (360, 240)])
  for (x, y, n) in [(30, 90, "s-arbre1"), (390, 80, "s-arbre2"), (20, 160, "s-arbre3")]: pied(img, m(n, .8), x, y)
  # la ville : maisons de pierre et à colombages (pack du port), entrepôts sur pilotis
  pied(img, h(5, 0, 0, 185, 190, .55), 100, 210); pied(img, h(5, 195, 0, 185, 190, .55), 320, 210)
  pied(img, h(5, 390, 0, 378, 190, .62), 300, 380)   # entrepôts et grue
  pied(img, h(5, 575, 388, 193, 175, .6), 90, 355)   # la scierie (hangar et chevalet)
  pied(img, h(3, 195, 675, 190, 90, .7), 208, 330)   # étals de poisson
  pied(img, h(3, 388, 575, 50, 95, .9), 395, 520)   # le phare
  return img
for nom, f in (("A", scene_a), ("B", scene_b)):
  f().save(OUT / f"cote-{nom}.png"); print(nom)

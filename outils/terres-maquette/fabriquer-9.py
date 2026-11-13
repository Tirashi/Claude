"""Maquette 9 de Terres franches (13/11) : l'ère 3, « la forêt profonde » (petite ville, magie, cristaux, mage). Deux directions pour la
nouvelle carte, composées avec les morceaux du jeu (terres-franches/img/decor.png, atlas.js) et des packs Cute SCKR achetés (même dessinateur) :
 A « La clairière des anciens » : arbres anciens, cercle de pierres et dolmens (Celtic Druid Village), grotte aux cristaux (Medieval Underground Mine),
   la petite ville en colombages autour de sa place, une maison enchantée par le mage.
 B « Le bois enchanté » : maisons dans les arbres et maisons-champignons, cercle magique au sol, fontaine des fées, cascade, buissons qui luisent
   (Fairy Forest Village), cristaux.
Usage : python3 -I outils/terres-maquette/fabriquer-9.py <dossier des packs (druide/, fee/, mine/)> <dossier de sortie>
Sortie : <sortie>/foret-A.png, foret-B.png, et maquettes/terres-franches-foret.html (images en base64)."""
import base64, io, json, pathlib, random, sys
from PIL import Image, ImageDraw, ImageFilter
racine = pathlib.Path(__file__).resolve().parents[2]
PK, OUT = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
jeu = racine / "terres-franches"
dec = Image.open(jeu / "img/decor.png").convert("RGBA")
AT = json.loads((jeu / "atlas.js").read_text().split("window.TerresAtlas = ")[1].split(";\n")[0])
def m(n, k=1):   # un morceau du jeu, à l'échelle k
  a = AT[n]; im = dec.crop((a[0], a[1], a[0] + a[2], a[1] + a[3]))
  return im if k == 1 else im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.NEAREST)
cache = {}
def h(p, n, x, y, l, hh, k=1):   # un morceau d'un pack (bords transparents rognés)
  if (p, n) not in cache: cache[p, n] = Image.open(next((PK / p).rglob(f"tile-B-0{n}.png"))).convert("RGBA")
  im = cache[p, n].crop((x, y, x + l, y + hh)); bb = im.getbbox(); im = im.crop(bb) if bb else im
  return im if k == 1 else im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.NEAREST)
W, HT = 416, 736   # un écran de téléphone (13 × 23 cases de 32 px)
r = random.Random(9)
def fond(img, tuile, x0, y0, x1, y1):
  for y in range(y0, y1, tuile.height):
    for x in range(x0, x1, tuile.width): img.alpha_composite(tuile.crop((0, 0, min(tuile.width, x1 - x), min(tuile.height, y1 - y))), (x, y))
def pied(img, im, X, Y):   # pose une image, le milieu du bas en (X, Y)
  img.alpha_composite(im, (round(X - im.width / 2), round(Y - im.height)))
def rue(img, pts, w=22):
  d = ImageDraw.Draw(img)
  for (a, b), (c, e) in zip(pts, pts[1:]):
    d.line((a, b, c, e), fill=(196, 160, 108, 255), width=w); d.ellipse((c - w / 2, e - w / 2, c + w / 2, e + w / 2), fill=(196, 160, 108, 255))
def lueur(img, X, Y, rx, ry, col, a=110):   # un halo (magie, lanternes)
  g = Image.new("RGBA", img.size, (0, 0, 0, 0)); d = ImageDraw.Draw(g)
  d.ellipse((X - rx, Y - ry, X + rx, Y + ry), fill=col + (a,)); g = g.filter(ImageFilter.GaussianBlur(min(rx, ry) / 2.2)); img.alpha_composite(g)
def foret(img, pts, k=.8):
  for (x, y) in sorted(pts, key=lambda p: p[1]): pied(img, m("s-arbre" + str(1 + r.randrange(6)), k), x, y)
def sombre(img, a=60):   # la forêt profonde : un peu plus sombre, un voile vert
  v = Image.new("RGBA", img.size, (10, 30, 20, a)); img.alpha_composite(v)
herbe, pave = m("herbe"), m("pave")
eau = m("eau")

def scene_a():
  img = Image.new("RGBA", (W, HT)); fond(img, herbe, 0, 0, W, HT)
  # le ruisseau qui descend de la grotte
  d = ImageDraw.Draw(img); pts = [(330, 200), (350, 300), (380, 400), (395, 520), (416, 600)]
  for (a, b), (c, e) in zip(pts, pts[1:]): d.line((a, b, c, e), fill=(150, 122, 76, 255), width=30)
  ru = Image.new("RGBA", (W, HT)); fond(ru, eau, 0, 0, W, HT); mk = Image.new("L", (W, HT)); dm = ImageDraw.Draw(mk)
  for (a, b), (c, e) in zip(pts, pts[1:]): dm.line((a, b, c, e), fill=255, width=22)
  img.paste(ru, (0, 0), mk)
  rue(img, [(0, 600), (140, 560), (200, 470), (200, 400)]); rue(img, [(200, 470), (300, 520), (330, 640)]); rue(img, [(200, 400), (120, 300)])
  # la place pavée et la fontaine
  pm = Image.new("L", (W, HT)); ImageDraw.Draw(pm).ellipse((140, 420, 262, 520), fill=255); pv = Image.new("RGBA", (W, HT)); fond(pv, pave, 0, 0, W, HT); img.paste(pv, (0, 0), pm)
  # la forêt profonde tout autour, les arbres anciens des druides
  foret(img, [(x, y) for x in range(-10, 430, 44) for y in (40, 90)] + [(x, 140) for x in (10, 60, 380)] + [(15, y) for y in range(190, 700, 55)] + [(400, y) for y in (640, 700)], .85)
  for (x, y) in [(100, 175), (260, 150), (60, 260)]: pied(img, h("druide", 5, r.choice([0, 96, 192]), 0, 96, 96, .95), x, y)
  # la grotte aux cristaux, au pied des rochers
  pied(img, h("mine", 2, 672, 192, 96, 96, 1.1), 330, 205)
  for (x, y, n, k) in [(285, 215, (192, 384), .55), (378, 222, (288, 384), .5), (300, 250, (384, 384), .45)]: pied(img, h("mine", 3, n[0], n[1], 96, 96, k), x, y)
  lueur(img, 330, 190, 60, 34, (120, 170, 255), 70)
  # le cercle de pierres (le lieu du mage) et les dolmens
  pied(img, h("druide", 1, 384, 64, 192, 112, .8), 110, 330); pied(img, h("druide", 5, 480, 96, 96, 96, .7), 50, 360)
  lueur(img, 110, 305, 70, 34, (170, 120, 255), 60)
  # la petite ville : colombages et pierre autour de la place
  for (x, y, n) in [(90, 470, "colomb1"), (300, 430, "pierre3"), (260, 610, "colomb3"), (90, 640, "pierre1"), (320, 330, "colomb2")]: pied(img, m(n), x, y)
  pied(img, m("fontaine", .8), 200, 480)
  # la maison enchantée par le mage : un halo violet
  lueur(img, 300, 400, 58, 40, (180, 110, 255), 80)
  sombre(img, 35)
  return img

def scene_b():
  img = Image.new("RGBA", (W, HT)); fond(img, herbe, 0, 0, W, HT)
  rue(img, [(0, 560), (150, 520), (208, 430), (208, 330)]); rue(img, [(208, 430), (330, 480), (350, 620)])
  # forêt dense, maisons dans les arbres à la lisière
  foret(img, [(x, y) for x in range(-10, 430, 40) for y in (40, 95)] + [(10, y) for y in range(150, 720, 50)] + [(405, y) for y in range(150, 520, 60)], .9)
  for (x, y, n) in [(90, 210, (0, 0)), (330, 200, (96, 0)), (40, 400, (0, 96))]: pied(img, h("fee", 1, n[0], n[1], 96, 96, 1.05), x, y)
  # le cercle magique au sol (le lieu du mage) et la fontaine des fées
  c = h("fee", 2, 96, 0, 96, 96, 1.1); img.alpha_composite(c, (208 - c.width // 2, 330 - c.height // 2)); lueur(img, 208, 330, 70, 50, (120, 255, 190), 60)
  pied(img, h("fee", 2, 288, 0, 96, 96, .8), 208, 470)
  # maisons-champignons et maisons de la ville
  for (x, y, n) in [(110, 330, (288, 288)), (320, 330, (672, 288)), (110, 520, (576, 480)), (330, 560, (480, 288))]: pied(img, h("fee", 1, n[0], n[1], 96, 96, .95), x, y)
  for (x, y, n) in [(240, 640, "colomb1"), (90, 690, "colomb3")]: pied(img, m(n), x, y)
  # la cascade et son bassin, les buissons qui luisent, les cristaux
  pied(img, h("fee", 2, 672, 288, 96, 96, 1.3), 350, 700); lueur(img, 350, 670, 50, 24, (110, 200, 255), 50)   # le bassin des fées
  for (x, y, n) in [(60, 460, (0, 0)), (370, 430, (96, 0)), (160, 600, (0, 96))]: pied(img, h("fee", 5, n[0], n[1], 96, 96, .6), x, y); lueur(img, x, y - 15, 26, 18, (110, 200, 255), 70)
  for (x, y, n) in [(270, 250, (384, 384)), (150, 250, (288, 384))]: pied(img, h("mine", 3, n[0], n[1], 96, 96, .45), x, y); lueur(img, x, y - 15, 22, 16, (140, 255, 200), 80)
  sombre(img, 45)
  for (x, y) in [(208, 470), (110, 300), (320, 300), (330, 540)]: lueur(img, x, y - 30, 30, 22, (255, 220, 140), 70)   # lanternes
  return img

ims = {}
for nom, f in (("A", scene_a), ("B", scene_b)):
  im = f(); im.save(OUT / f"foret-{nom}.png"); b = io.BytesIO(); im.convert("RGB").save(b, "PNG", optimize=True); ims[nom] = base64.b64encode(b.getvalue()).decode()
page = (racine / "outils/terres-maquette/source-9.html").read_text(encoding="utf-8").replace("@@A@@", ims["A"]).replace("@@B@@", ims["B"])
(racine / "maquettes/terres-franches-foret.html").write_text(page, encoding="utf-8")
print("maquette 9 :", OUT, "+ maquettes/terres-franches-foret.html")

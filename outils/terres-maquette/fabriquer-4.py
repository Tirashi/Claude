"""Maquette 4 de Terres franches (la vallée vivante) : la maquette 3 avec l'interface Tiny Swords et les animations (moulin-anime.py).
Reprend les découpes et le code de la maquette 2 (fabriquer-2.py, source-2.html).
Usage : python3 -I outils/terres-maquette/fabriquer-4.py <Free Pack> <dossier SCKR> <dossier icônes> <dossier villageois LPC> <ToffeeCraft freefantasy.png> <sortie.html> [planche.png]
 - <dossier icônes> : Medieval_Fantasy_Icons_Pack, Pixel_Medieval_Fantasy_Icon_Pack, Pixel_Food_Icon_Pack (lot Cute SCKR, .rar ouverts avec unar) ;
 - <dossier villageois LPC> : sortie de lpc-villageois.py ; ToffeeCraft : « Fantasy UI » gratuit (https://toffeecraft.itch.io/fantasy-ui-user-interaface)."""
import base64, io, json, pathlib, re, sys
from PIL import Image
racine = pathlib.Path(__file__).resolve().parents[2]
TS, SC, ICO, VL, TOF, SORTIE = map(pathlib.Path, sys.argv[1:7])
ici = racine / "outils/terres-maquette"
src2 = (ici / "fabriquer-2.py").read_text(encoding="utf-8")
DECOUPES = eval(re.search(r"DECOUPES = (\{.*?\n\})", src2, re.S).group(1))
def feuille(d, n): return next((SC / d).rglob(f"tile-B-0{n}.png"))
F = {"V1": feuille("village", 1), "V2": feuille("village", 2), "V3": feuille("village", 3), "F4": feuille("farm", 4), "B4": feuille("buildings", 4), "FO": feuille("foret", 1)}
DECOUPES.update({"i-bois": ("V1", 96, 528, 48, 48), "i-ble": ("F4", 0, 576, 48, 48)})
images, cache = {}, {}
for nom, (f, x, y, l, h, *eff) in DECOUPES.items():
  if f not in cache: cache[f] = Image.open(F[f]).convert("RGBA")
  im = cache[f].crop((x, y, x + l, y + h))
  for (a, b, c, d) in eff: im.paste((0, 0, 0, 0), (a - x, b - y, c - x, d - y))
  bb = im.getbbox(); images[nom] = im.crop(bb) if bb else im
# icônes (grilles de 7 ou 8 icônes sur 1024 px)
FI = {"m2": "Medieval_Fantasy_Icons_Pack/**/2.png", "m3": "Medieval_Fantasy_Icons_Pack/**/3.png", "p1": "Pixel_Medieval_Fantasy_Icon_Pack/**/1.png", "p2": "Pixel_Medieval_Fantasy_Icon_Pack/**/2.png", "f1": "Pixel_Food_Icon_Pack/**/1.png", "f3": "Pixel_Food_Icon_Pack/**/3.png"}
GRILLE = {"f3": 8}
ICONES = {"i-pierre": ("m2", 3, 0), "i-cristal": ("m2", 2, 0), "i-tissu": ("m2", 5, 5), "i-grimoire": ("p1", 3, 4), "i-or": ("p1", 3, 6), "i-laine": ("p2", 6, 4), "i-farine": ("m3", 6, 5),
  "i-pain": ("f1", 5, 0), "i-viande": ("f3", 6, 3), "i-poisson": ("f3", 6, 7), "i-baies": ("f3", 0, 6)}
for nom, (f, rg, c) in ICONES.items():
  if f not in cache: cache[f] = Image.open(next(ICO.glob(FI[f]))).convert("RGBA")
  im = cache[f]; n = im.width / GRILLE.get(f, 7); ic = im.crop((round(c * n), round(rg * n), round(c * n + n), round(rg * n + n))); bb = ic.getbbox()
  ic = ic.crop(bb) if bb else ic; ic.thumbnail((48, 48), Image.LANCZOS); images[nom] = ic
# interface ToffeeCraft (pièces de la planche gratuite)
tof = Image.open(TOF).convert("RGBA")
for nom, b in {"t-planche": (138, 2, 183, 31), "t-planchette": (96, 2, 128, 31), "t-cadre": (167, 66, 234, 139), "t-barre": (5, 3, 73, 24)}.items(): images[nom] = tof.crop(b)
for nom, (c, rg) in {"t-plus": (0, 1), "t-moins": (2, 2), "t-ok": (2, 1), "t-croix": (0, 2), "t-plus2": (4, 1), "t-moins2": (6, 2)}.items():
  images[nom] = tof.crop((1 + round(c * 15.75), 177 + rg * 16, 1 + round(c * 15.75) + 16, 177 + rg * 16 + 16))
# Tiny Swords
base = next(TS.rglob("Buildings")).parent
BASTION = ["feu", "rocher", "buisson", "mouton-broute", "mouton-marche", "ouvrier-repos", "ouvrier-hache", "ouvrier-hache-coupe", "ouvrier-bois", "ouvrier-pioche", "ouvrier-pioche-tape", "ouvrier-or",
  "ouvrier-couteau", "ouvrier-couteau-coupe", "ouvrier-viande", "ouvrier-marteau", "ouvrier-marteau-tape", "ui-papier", "ui-parchemin", "ui-table", "ui-ruban-rouge", "ui-ruban-bleu", "ui-carre-bleu", "ui-carre-bleu-appui", "ui-carre-rouge", "ui-barre", "ui-barre-plein"]
for nom in BASTION: images[nom] = Image.open(racine / "bastion/img" / (nom + ".png")).convert("RGBA")
# moulin animé (moulin-anime.py)
import subprocess, tempfile
with tempfile.TemporaryDirectory() as d:
  subprocess.run([sys.executable, '-I', str(ici / 'moulin-anime.py'), str(F['V3']), d + '/m.png', '8'], check=True); images['moulin-anime'] = Image.open(d + '/m.png').copy()
# villageois LPC
info = json.load(open(VL / "villageois.json"))
for v in info:
  i = v["i"]; images[f"lpc{i}-marche"] = Image.open(VL / f"v{i}-marche.png"); images[f"lpc{i}-repos"] = Image.open(VL / f"v{i}-repos.png"); images[f"lpc{i}-travail"] = Image.open(VL / f"v{i}-{v['outil']}.png")
def b64(im):
  o = io.BytesIO(); im.save(o, "PNG", optimize=True); return "data:image/png;base64," + base64.b64encode(o.getvalue()).decode()
s2 = (ici / "source-2.html").read_text(encoding="utf-8")
commun = s2[s2.index("/* ---------- la vallée ---------- */"):s2.index("function monter(id){")]
page = (ici / "source-4.html").read_text(encoding="utf-8").replace("/*@@COMMUN@@*/", commun).replace('"@@VILLAGEOIS@@"', json.dumps(info)).replace('"@@IMAGES@@"', json.dumps({k: b64(v) for k, v in images.items()}))
SORTIE.write_text(page, encoding="utf-8")
if len(sys.argv) > 7:
  noms = [n for n in images if n.startswith(("i-", "t-"))]; from PIL import ImageDraw
  pl = Image.new("RGB", (8 * 90, (len(noms) + 7) // 8 * 90), (60, 60, 70)); d = ImageDraw.Draw(pl)
  for k, n in enumerate(noms):
    im = images[n].copy(); im = im.resize((im.width * 2, im.height * 2), Image.NEAREST) if im.width < 40 else im; im.thumbnail((80, 70)); pl.paste(im, (k % 8 * 90 + 4, k // 8 * 90 + 16), im); d.text((k % 8 * 90 + 2, k // 8 * 90 + 2), n, fill=(255, 255, 0))
  pl.save(sys.argv[7])

"""Maquette 2 de Terres d'Éveil (le grand territoire) : découpe les images et les met en base64 dans la page.
Les packs ne sont pas dans le dépôt (pas de redistribution) : les retélécharger par l'API itch.io (skill packs-itch)
 - Tiny Swords (Free Pack), clé 161477580 ; les images déjà découpées pour Bastion sont prises dans bastion/img ;
 - lot Cute SCKR : « Medieval Village », « Medieval Buildings », « Medieval Farm », « Large Forest » (fichiers .rar, unar).
Usage : python3 -I outils/terres-maquette/fabriquer-2.py <dossier Free Pack> <dossier SCKR> <sortie.html> [planche.png]
<dossier SCKR> contient village/, buildings/, farm/, foret/ (chacun avec ses tile-B-0x.png)."""
import base64, io, json, pathlib, sys
from PIL import Image
racine = pathlib.Path(__file__).resolve().parents[2]
TS, SC, SORTIE = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]), sys.argv[3]
def feuille(d, n): return next((SC / d).rglob(f"tile-B-0{n}.png"))
F = {"V1": feuille("village", 1), "V2": feuille("village", 2), "V3": feuille("village", 3), "F4": feuille("farm", 4), "B4": feuille("buildings", 4), "FO": feuille("foret", 1)}
DECOUPES = {  # nom : (feuille, x, y, l, h)
  "herbe": ("V1", 192, 384, 48, 48), "herbe2": ("V1", 240, 384, 48, 48), "herbef": ("V1", 288, 432, 48, 48), "herbe3": ("V1", 432, 432, 48, 48), "pave": ("V1", 240, 240, 48, 48),
  "champ-mur": ("F4", 288, 192, 96, 96), "champ-pousse": ("F4", 672, 192, 96, 96), "champ-nu": ("F4", 576, 192, 96, 96), "champ-blond": ("F4", 0, 192, 96, 96),
  "chaume1": ("V2", 0, 0, 96, 96), "chaume2": ("V2", 96, 96, 96, 96), "chaume3": ("V2", 192, 0, 96, 96), "chaume4": ("V2", 0, 192, 96, 96), "chaume5": ("V2", 192, 96, 96, 96),
  "colomb1": ("V2", 384, 0, 96, 96), "colomb2": ("V2", 480, 0, 96, 96), "colomb3": ("V2", 384, 96, 96, 96), "colomb4": ("V2", 480, 288, 96, 96),
  "pierre1": ("V2", 576, 0, 96, 96), "pierre2": ("V2", 672, 0, 96, 96), "pierre3": ("V2", 576, 96, 96, 96), "pierre4": ("V2", 672, 192, 96, 96), "pierre5": ("V2", 576, 192, 96, 96),
  "grange": ("V2", 192, 384, 96, 96), "hangar": ("V2", 96, 384, 96, 96), "ecurie": ("V2", 384, 384, 192, 72), "eglise": ("V2", 392, 576, 160, 192), "eglise2": ("V2", 580, 576, 188, 192, (676, 576, 724, 630)),
  "moulin1": ("V3", 0, 150, 192, 230), "moulin2": ("V3", 192, 150, 192, 230), "moulin3": ("V3", 384, 150, 192, 230), "moulin4": ("V3", 576, 150, 192, 230),
  "meule1": ("V3", 0, 480, 96, 96), "meule2": ("V3", 96, 480, 96, 96),
  "mairie": ("B4", 20, 286, 150, 110), "halle": ("B4", 196, 288, 184, 106), "guilde": ("B4", 392, 288, 152, 106), "maison-guilde": ("B4", 578, 288, 128, 106),
  "puits": ("B4", 4, 414, 52, 66), "puits-couvert": ("B4", 122, 400, 72, 78), "fontaine": ("B4", 196, 388, 74, 90), "four": ("B4", 306, 388, 74, 90),
  "etal1": ("B4", 386, 386, 74, 92), "etal2": ("B4", 492, 386, 82, 92), "etal3": ("B4", 578, 386, 96, 92), "etal4": ("B4", 4, 484, 82, 94), "etal5": ("B4", 104, 484, 82, 94),
  "charrette": ("B4", 684, 404, 84, 74), "forge": ("B4", 192, 478, 96, 100), "maison-bleue": ("B4", 386, 476, 184, 104), "auberge": ("B4", 578, 476, 190, 104),
  "lanterne": ("B4", 492, 582, 24, 90), "rempart": ("B4", 0, 96, 192, 96), "rempart-porte": ("B4", 0, 190, 192, 100),
  "s-arbre1": ("FO", 1, 2, 95, 142), "s-arbre2": ("FO", 103, 5, 85, 136), "s-arbre3": ("FO", 291, 4, 92, 138), "s-arbre4": ("FO", 385, 8, 120, 136), "s-arbre5": ("FO", 509, 5, 118, 138), "s-arbre6": ("FO", 1, 146, 96, 140),
  "s-jeune": ("FO", 207, 291, 66, 94), "s-arbre7": ("FO", 0, 576, 96, 96),
}
TS_FICHIERS = {f"ts-{c.lower()}-{n.lower()}": f"Buildings/{c} Buildings/{n}.png" for c in ("Blue", "Red", "Yellow") for n in ("House1", "House2", "House3", "Tower", "Barracks", "Archery", "Castle", "Monastery")}
BASTION = ["tm", "arbre1", "arbre2", "arbre3", "arbre4", "buisson", "feu", "rocher", "chantier", "mouton-broute", "mouton-marche", "ouvrier-repos", "ouvrier-hache", "ouvrier-hache-coupe", "ouvrier-bois",
  "ouvrier-pioche", "ouvrier-pioche-tape", "ouvrier-or", "ouvrier-couteau", "ouvrier-couteau-coupe", "ouvrier-viande", "ouvrier-marteau", "ouvrier-marteau-tape"]
images = {}
cache = {}
for nom, (f, x, y, l, h, *eff) in DECOUPES.items():
  if f not in cache: cache[f] = Image.open(F[f]).convert("RGBA")
  im = cache[f].crop((x, y, x + l, y + h))
  for (a, b, c, d) in eff: im.paste((0, 0, 0, 0), (a - x, b - y, c - x, d - y))
  bb = im.getbbox(); images[nom] = im.crop(bb) if bb else im
base = next(TS.rglob("Buildings")).parent
for nom, chemin in TS_FICHIERS.items(): images[nom] = Image.open(base / chemin).convert("RGBA")
for nom in BASTION: images[nom] = Image.open(racine / "bastion/img" / (nom + ".png")).convert("RGBA")
def b64(im):
  o = io.BytesIO(); im.save(o, "PNG", optimize=True); return "data:image/png;base64," + base64.b64encode(o.getvalue()).decode()
src = (racine / "outils/terres-maquette/source-2.html").read_text(encoding="utf-8")
pathlib.Path(SORTIE).write_text(src.replace('"@@IMAGES@@"', json.dumps({k: b64(v) for k, v in images.items()})), encoding="utf-8")
if len(sys.argv) > 4:  # planche de contrôle des découpes
  noms = list(DECOUPES); s = 120; c = 8; pl = Image.new("RGB", (c * s, (len(noms) + c - 1) // c * s), (60, 60, 70))
  from PIL import ImageDraw
  d = ImageDraw.Draw(pl)
  for i, n in enumerate(noms):
    im = images[n].copy(); im.thumbnail((s - 4, s - 16)); pl.paste(im, (i % c * s + 2, i // c * s + 14), im); d.text((i % c * s + 2, i // c * s + 1), n, fill=(255, 255, 0))
  pl.save(sys.argv[4])

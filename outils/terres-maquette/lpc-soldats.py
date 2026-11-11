"""Terres franches : les pillards et les gardes LPC (11/11), composés comme les villageois (lpc-villageois.py) à partir des calques
du « Universal LPC Spritesheet Character Generator » (dépôt public LiberatedPixelCup, CC-BY-SA 3.0 / GPL 3.0 / OGA-BY, auteurs dans son CREDITS.csv).
Sortie : terres-franches/img/soldats.png, une rangée de 256 px par personnage : marche (9 images de 64 px, 4 lignes : haut, gauche, bas, droite)
puis le coup de lance (thrust, 8 images de 64 px, mêmes lignes) à x = 576 ; et ../soldats.js (window.TerresSoldats = {pillards, gardes}).
Pillards : capuche sombre, gilet, lance de bois ; gardes : casque, cotte de mailles, lance d'acier.
Usage : python3 -I outils/terres-maquette/lpc-soldats.py <dossier du dépôt LPC (avec weapon/polearm/spear, hat/helmet, torso/chainmail)>"""
import json, pathlib, random, sys
from PIL import Image
L = pathlib.Path(sys.argv[1]); S = L / "spritesheets"; r = random.Random(11)
racine = pathlib.Path(__file__).resolve().parents[2]; jeu = racine / "terres-franches"
pal = lambda m, n: json.load(open(L / f"palette_definitions/{m}/{n}_ulpc.json"))
PEAU, CHEV, TISSU = pal("body", "body"), pal("hair", "hair"), pal("cloth", "cloth")
def hexrgb(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def teinte(im, base, cible):
  m = {hexrgb(a): hexrgb(b) for a, b in zip(base, cible)}; px = im.load()
  for y in range(im.height):
    for x in range(im.width):
      p = px[x, y]
      if p[3] and p[:3] in m: px[x, y] = m[p[:3]] + (p[3],)
  return im
def calque(chemin, anim, couleur=None, palette=None):
  """chemin/anim.png (recoloré), chemin/anim/couleur.png ou chemin/couleur… ; None s'il n'existe pas."""
  for f in [S / chemin / anim / f"{couleur}.png", S / chemin / f"{anim}.png"] if couleur else [S / chemin / f"{anim}.png"]:
    if f.exists():
      im = Image.open(f).convert("RGBA")
      return teinte(im, *palette) if palette and not (couleur and f.parent.name == anim) else im
  return None
def personnage(garde):
  peau = r.choice(["light", "amber", "olive", "taupe", "bronze", "brown"])
  chev = r.choice(["black", "dark_brown", "chestnut", "ginger", "raven", "sandy"])
  sombre = ["charcoal", "black", "brown", "walnut", "maroon", "forest", "slate"]
  couches = [(10, "body/bodies/male", None, (PEAU["light"], PEAU[peau])),
    (15, "feet/shoes/revised/male", None, (TISSU["white"], TISSU["brown" if garde else r.choice(["black", "charcoal", "walnut"])])),
    (20, "legs/pants/male", None, (TISSU["white"], TISSU["navy" if garde else r.choice(sombre)])),
    (100, "head/heads/human/male", None, (PEAU["light"], PEAU[peau])),
    (105, "eyes/human/adult/default", r.choice(["brown", "gray"]), None),
    (120, "hair/" + r.choice(["plain", "bangs", "unkempt", "parted"]) + "/adult", None, (CHEV["orange"], CHEV[chev]))]
  if garde:
    couches += [(35, "torso/clothes/longsleeve/longsleeve/male", "navy", None), (50, "torso/chainmail/male", None, None),
      (135, "hat/helmet/" + r.choice(["kettle", "nasal"]) + "/adult", None, None)]
  else:
    couches += [(35, "torso/clothes/" + r.choice(["vest/male", "sleeveless/laced/male"]), r.choice(sombre), None),
      (130, "hat/cloth/hood/adult", None, (TISSU["white"], TISSU[r.choice(["charcoal", "black", "maroon", "forest"])]))]
  couches.sort(key=lambda c: c[0])
  lance = "steel" if garde else r.choice(["medium", "dark", "light"])
  def compose(anim):
    out = None
    bg, fg = calque("weapon/polearm/spear/background", anim, lance), calque("weapon/polearm/spear/foreground", anim, lance)
    for im in [bg] + [calque(ch, anim, coul, p) for _, ch, coul, p in couches] + [fg]:
      if im is None: continue
      if out is None: out = Image.new("RGBA", im.size)
      out.alpha_composite(im.crop((0, 0) + out.size))
    return out
  return compose("walk"), compose("thrust")
P, G = 4, 3
pl = Image.new("RGBA", (576 + 512, 256 * (P + G)), (0, 0, 0, 0))
for k in range(P + G):
  w, t = personnage(k >= P); pl.paste(w.crop((0, 0, 576, 256)), (0, k * 256)); pl.paste(t.crop((0, 0, 512, 256)), (576, k * 256))
pl.save(jeu / "img/soldats.png", optimize=True)
(jeu / "soldats.js").write_text("/* Terres franches : pillards et gardes LPC de img/soldats.png (rangée k ; marche à x = 0, coup de lance à x = 576). Fabriqué par outils/terres-maquette/lpc-soldats.py. */\n"
  f"window.TerresSoldats = {{pillards: {P}, gardes: {G}}};\n", encoding="utf-8")
print("soldats", pl.size)

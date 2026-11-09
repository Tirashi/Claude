"""Compose des villageois LPC tous différents (peau, tête, cheveux, habits, chapeau) à partir des calques du
« Universal LPC Spritesheet Character Generator » (dépôt public LiberatedPixelCup, licences CC-BY-SA 3.0 / GPL 3.0 / OGA-BY,
auteurs dans son CREDITS.csv). Sortie : une bande par villageois, cases de 64 px :
  lignes 0-3 = marche (9 images, haut / gauche / bas / droite), ligne 4 = repos (2 images, vers le bas),
  outils (09/11 : chaque villageois a les quatre) : v<i>-hache.png, -pioche.png, -canne.png (6 images de 128 px, gauche puis droite),
  -houe.png (8 images de 64 px, gauche puis droite) ; pioche et canne : tools/pickaxe et tools/fishing_rod du dépôt LPC.
Usage : python3 -I outils/terres-maquette/lpc-villageois.py <dossier du dépôt LPC> <dossier de sortie> [nombre] [graine] [nombre d'enfants]
Enfants : e<i>-marche.png (marche seulement : les habits d'enfant LPC n'ont que la marche)."""
import json, pathlib, random, sys
from PIL import Image
L, SORTIE = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]); N = int(sys.argv[3]) if len(sys.argv) > 3 else 12; r = random.Random(int(sys.argv[4]) if len(sys.argv) > 4 else 7)
SORTIE.mkdir(parents=True, exist_ok=True)
S = L / "spritesheets"
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
  """chemin/anim.png (recoloré) ou chemin/anim/couleur.png ; None s'il n'existe pas."""
  f = S / chemin / f"{anim}.png"
  if couleur and (S / chemin / anim / f"{couleur}.png").exists(): f = S / chemin / anim / f"{couleur}.png"; palette = None
  if not f.exists(): return None
  im = Image.open(f).convert("RGBA")
  if palette: im = teinte(im, *palette)
  return im
def villageois(i):
  fem = r.random() < .5; corps = "female" if fem else "male"; mince = "thin" if fem else "male"
  peau = r.choice(["light", "amber", "olive", "taupe", "bronze", "brown", "black"])
  vieux = r.random() < .2
  tete = ("female" if fem else "male") + ("_elderly" if vieux else "")
  chev = r.choice(["gray", "white", "ash"]) if vieux else r.choice(["blonde", "sandy", "ginger", "chestnut", "dark_brown", "black", "light_brown", "redhead", "raven"])
  coiffe = r.choice(["long", "loose", "bob", "ponytail", "bangs", "plain"] if fem else ["bangs", "bedhead", "plain", "parted", "unkempt", "plain"])
  tissus = ["brown", "leather", "walnut", "tan", "maroon", "forest", "green", "navy", "bluegray", "slate", "gray", "white", "red", "teal", "yellow", "orange", "sky"]
  haut = r.choice(["torso/clothes/longsleeve/longsleeve/female", "torso/clothes/blouse_longsleeve/female", "torso/clothes/tunic/female"] if fem else ["torso/clothes/longsleeve/longsleeve/male", "torso/clothes/vest/male", "torso/clothes/sleeveless/laced/male"])
  bas = "legs/skirts/plain/thin" if fem and r.random() < .6 else f"legs/pants/{mince}"
  outil = r.choice(["hache", "houe"])   # n'est plus utilisé (tous les outils), gardé pour que la graine donne les mêmes villageois
  couches = [  # (zPos, chemin, couleur de fichier, palette)
    (10, f"body/bodies/{corps}", None, (PEAU["light"], PEAU[peau])),
    (15, f"feet/shoes/revised/{mince}", None, (TISSU["white"], TISSU[r.choice(["brown", "leather", "walnut", "black", "charcoal"])])),
    (20, bas, None, (TISSU["white"], TISSU[r.choice(tissus)])),
    (35, haut, r.choice(tissus), None),
    (100, f"head/heads/human/{tete}", None, (PEAU["light"], PEAU[peau])),
    (105, "eyes/human/adult/default", r.choice(["brown", "blue", "green", "gray"]), None),
    (120, f"hair/{coiffe}/adult", None, (CHEV["orange"], CHEV[chev])),
  ]
  if fem and r.random() < .35: couches.append((40, "torso/aprons/apron_full/female", r.choice(["white", "tan", "brown"]), None))
  if r.random() < .25: couches.append((130, "hat/cloth/" + r.choice(["hood", "bandana"]) + "/adult", None, (TISSU["white"], TISSU[r.choice(tissus)])))
  couches.sort(key=lambda c: c[0])
  def compose(anim):
    out = None
    for _, ch, coul, p in couches:
      im = calque(ch, anim, coul, p)
      if im is None: continue
      if out is None: out = Image.new("RGBA", im.size)
      out.alpha_composite(im)
    return out
  walk, idle = compose("walk"), compose("idle")
  sl, th = compose("slash"), compose("thrust")
  def outil128(dossier, corps_anim, cols=range(6), corps=None):   # hache, pioche, canne : cases de 128 px, 6 images, gauche puis droite
    # cols : colonnes de la planche de l'outil ; corps : image du corps pour chacune (canne : custom_animations « tool_rod » du dépôt LPC)
    bg, fg = Image.open(S / f"tools/{dossier}/bg.png").convert("RGBA"), Image.open(S / f"tools/{dossier}/fg.png").convert("RGBA")
    cols = list(cols); corps = corps or cols; nf, fs = len(cols), 128; trav = Image.new("RGBA", (nf * fs, 2 * fs))
    for ligne, rang in ((0, 1), (1, 3)):   # gauche, droite
      for k, (f, cf) in enumerate(zip(cols, corps)):
        c = Image.new("RGBA", (fs, fs)); c.alpha_composite(bg.crop((f * fs, rang * fs, f * fs + fs, rang * fs + fs)))
        c.alpha_composite(corps_anim.crop((cf * 64, rang * 64, cf * 64 + 64, rang * 64 + 64)), (32, 32)); c.alpha_composite(fg.crop((f * fs, rang * fs, f * fs + fs, rang * fs + fs)))
        trav.paste(c, (k * fs, ligne * fs))
    return trav
  def houe():   # cases de 64 px, 8 images
    bg, fg = Image.open(S / "tools/hoe/bg/thrust.png").convert("RGBA"), Image.open(S / "tools/hoe/fg/thrust.png").convert("RGBA")
    nf, fs = 8, 64; trav = Image.new("RGBA", (nf * fs, 2 * fs))
    for ligne, rang in ((0, 1), (1, 3)):
      for f in range(nf):
        c = Image.new("RGBA", (fs, fs)); box = (f * 64, rang * 64, f * 64 + 64, rang * 64 + 64)
        for im in (bg, th, fg): c.alpha_composite(im.crop(box))
        trav.paste(c, (f * fs, ligne * fs))
    return trav
  walk.save(SORTIE / f"v{i}-marche.png"); idle.save(SORTIE / f"v{i}-repos.png")
  outil128("axe", sl).save(SORTIE / f"v{i}-hache.png"); outil128("pickaxe", sl).save(SORTIE / f"v{i}-pioche.png")
  # canne : le lancer (colonnes 0, 2, 4, 5) puis la canne tendue vers l'eau (6, 7)
  outil128("fishing_rod", th, [0, 2, 4, 5, 6, 7], [0, 2, 4, 5, 4, 4]).save(SORTIE / f"v{i}-canne.png"); houe().save(SORTIE / f"v{i}-houe.png")
  return {"i": i, "outil": outil, "femme": fem, "peau": peau, "cheveux": chev, "coiffe": coiffe, "vieux": vieux}
def enfant(i):
  peau = r.choice(["light", "amber", "olive", "taupe", "bronze", "brown", "black"]); chev = r.choice(["blonde", "sandy", "ginger", "chestnut", "dark_brown", "black", "light_brown", "redhead"])
  tissus = ["brown", "tan", "maroon", "forest", "green", "navy", "bluegray", "red", "teal", "yellow", "orange", "sky", "white", "pink", "lavender"]
  bas = r.choice(["legs/pants/child", "legs/skirts/child"]); dispo = lambda ch: [f.stem for f in sorted((S / ch / "walk").glob("*.png"))]
  couches = [(10, "body/bodies/child", None, (PEAU["light"], PEAU[peau])), (20, bas, r.choice(dispo(bas)), None),
    (35, "torso/clothes/shirt/child", r.choice(dispo("torso/clothes/shirt/child")), None), (100, "head/heads/human/child", None, (PEAU["light"], PEAU[peau])),
    (105, "eyes/human/child", r.choice(["brown", "blue", "green"]), None), (120, "hair/" + r.choice(["jewfro", "parted_side_bangs", "relm_short", "swoop_side", "wavy"]) + "/child", None, (CHEV["orange"], CHEV[chev]))]
  out = None
  for _, ch, coul, p in couches:
    im = calque(ch, "walk", coul, p)
    if im is None: continue
    if out is None: out = Image.new("RGBA", im.size)
    out.alpha_composite(im)
  out.save(SORTIE / f"e{i}-marche.png")
info = [villageois(i) for i in range(N)]
NE = int(sys.argv[5]) if len(sys.argv) > 5 else 0
for i in range(NE): enfant(i)   # après les adultes : les adultes restent les mêmes pour une même graine
json.dump(info, open(SORTIE / "villageois.json", "w"), ensure_ascii=False, indent=1)
print(len(info), "villageois")

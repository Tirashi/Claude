"""Maquette 7 de Terres franches : la maquette 6 avec la route du sud qui longe les champs, la fumée au ras des cheminées et des vols d'oiseaux. Avant : maquette 6 : la maquette 5 corrigée (rivière, pont, herbe, moyeu) avec saisons, pluie, enfants LPC (lpc-villageois.py ... 24 11 6). Avant : maquette 5 : la maquette 4 (vallée vivante) avec l'eau du pack animée, les chemins en terre battue, la fumée sur les vraies cheminées
et les animaux LPC (OpenGameArt). Arguments : ceux de fabriquer-3.py, plus <dossier des animaux> avant la sortie (fichiers d'OpenGameArt : cat_0.png, dog_2.png,
lpc_animals_2022_v1.1.zip et lpc_fish.zip ouverts, bird_1_brown.png, bird_2_black.png, chicken_walk.png, chicken_eat.png, cow_walk.png, cow_eat.png, pig_walk.png, pig_eat.png).
Avant :
Reprend les découpes et le code de la maquette 2 (fabriquer-2.py, source-2.html).
Usage : python3 -I outils/terres-maquette/fabriquer-7.py <Free Pack> <dossier SCKR> <dossier icônes> <dossier villageois LPC> <ToffeeCraft freefantasy.png> <sortie.html> [planche.png]
 - <dossier icônes> : Medieval_Fantasy_Icons_Pack, Pixel_Medieval_Fantasy_Icon_Pack, Pixel_Food_Icon_Pack (lot Cute SCKR, .rar ouverts avec unar) ;
 - <dossier villageois LPC> : sortie de lpc-villageois.py ; ToffeeCraft : « Fantasy UI » gratuit (https://toffeecraft.itch.io/fantasy-ui-user-interaface)."""
import base64, io, json, pathlib, re, sys
from PIL import Image
racine = pathlib.Path(__file__).resolve().parents[2]
TS, SC, ICO, VL, TOF, AN, SORTIE = map(pathlib.Path, sys.argv[1:8])
ici = racine / "outils/terres-maquette"
src2 = (ici / "fabriquer-2.py").read_text(encoding="utf-8")
DECOUPES = eval(re.search(r"DECOUPES = (\{.*?\n\})", src2, re.S).group(1))
def feuille(d, n): return next((SC / d).rglob(f"tile-B-0{n}.png"))
F = {"V1": feuille("village", 1), "V2": feuille("village", 2), "V3": feuille("village", 3), "F4": feuille("farm", 4), "B4": feuille("buildings", 4), "FO": feuille("foret", 1)}
DECOUPES.update({"i-bois": ("V1", 96, 528, 48, 48), "i-ble": ("F4", 0, 576, 48, 48), "terre": ("V1", 60, 56, 32, 32), "eau": ("V3", 408, 410, 48, 48), "herbe": ("V1", 235, 387, 48, 48)})
images, cache = {}, {}
for nom, (f, x, y, l, h, *eff) in DECOUPES.items():
  if f not in cache: cache[f] = Image.open(F[f]).convert("RGBA")
  im = cache[f].crop((x, y, x + l, y + h))
  for (a, b, c, d) in eff: im.paste((0, 0, 0, 0), (a - x, b - y, c - x, d - y))
  bb = im.getbbox(); images[nom] = im if nom in ("terre", "eau", "herbe") else (im.crop(bb) if bb else im)
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
# herbe : un seul carré qui se raccorde sans couture, retourné pour casser la répétition
images["herbe2"] = images["herbe"].transpose(Image.FLIP_LEFT_RIGHT); images["herbef"] = images["herbe"].transpose(Image.FLIP_TOP_BOTTOM)
# enfants LPC
for e in sorted(VL.glob("e*-marche.png")): images["enfant" + e.stem[1:].split("-")[0]] = Image.open(e)
# animaux LPC (OpenGameArt)
A = AN / "animals/lpc animals 2022 v1.1/individual creature spritesheets"
for nom, chemin in {"a-chat": AN / "cat_0.png", "a-chien": AN / "dog_2.png", "a-biche": A / "deer, light doe.png", "a-cerf": A / "deer, dark buck.png", "a-renard": A / "fox, woods.png",
    "a-oiseau1": AN / "bird_1_brown.png", "a-oiseau2": AN / "bird_2_black.png", "a-poisson": next(AN.rglob("lpc_fish.png")), "a-poule": AN / "chicken_walk.png", "a-poule-mange": AN / "chicken_eat.png",
    "a-vache": AN / "cow_walk.png", "a-vache-mange": AN / "cow_eat.png", "a-cochon": AN / "pig_walk.png", "a-cochon-mange": AN / "pig_eat.png"}.items():
  images[nom] = Image.open(chemin).convert("RGBA")
# villageois LPC
info = json.load(open(VL / "villageois.json"))
for v in info:
  i = v["i"]; images[f"lpc{i}-marche"] = Image.open(VL / f"v{i}-marche.png"); images[f"lpc{i}-repos"] = Image.open(VL / f"v{i}-repos.png"); images[f"lpc{i}-travail"] = Image.open(VL / f"v{i}-{v['outil']}.png")
def b64(im):
  o = io.BytesIO(); im.save(o, "PNG", optimize=True); return "data:image/png;base64," + base64.b64encode(o.getvalue()).decode()
s2 = (ici / "source-2.html").read_text(encoding="utf-8")
commun = s2[s2.index("/* ---------- la vallée ---------- */"):s2.index("function monter(id){")]
assert ': st.route; trait' in commun and ': st.place; b.strokeStyle' in commun and 'auberge"].includes(o.k)){ // fumée' in commun
commun = commun.replace('if (["maison", "four", "forge", "auberge"].includes(o.k)){ // fumée', 'if (false){ // fumée : sur les vraies cheminées (source-5)')
assert 'for (let y = -1; y <= 44; y += .25) b.lineTo(rivX(y) * T, y * T)' in commun
commun = commun.replace('for (let y = -1; y <= 44; y += .25) b.lineTo(rivX(y) * T, y * T)', 'for (let y = -1; y <= coteY(rivX(y)) + .4; y += .25) b.lineTo(rivX(y) * T, y * T)')
assert '{pts: route([19, 22], [19, 29.3], [14, 33.2]), l: .8}' in commun
commun = commun.replace('{pts: route([19, 22], [19, 29.3], [14, 33.2]), l: .8}', '{pts: route([19, 22], [19, 29.4], [12.4, 29.4], [11.4, 32.4]), l: .8}')   # la route longe les champs
commun = commun.replace(': st.route; trait(b, ro.pts, ro.l * T); }', ': (st.routeImg && ok(IMG[st.routeImg]) ? b.createPattern(IMG[st.routeImg], "repeat") : st.route); trait(b, ro.pts, ro.l * T); }')
commun = commun.replace(': st.place; b.strokeStyle = st.routeBord;', ': (st.routeImg && ok(IMG[st.routeImg]) ? b.createPattern(IMG[st.routeImg], "repeat") : st.place); b.strokeStyle = st.routeBord;')
page = (ici / "source-7.html").read_text(encoding="utf-8").replace("/*@@COMMUN@@*/", commun).replace('"@@VILLAGEOIS@@"', json.dumps(info)).replace('"@@IMAGES@@"', json.dumps({k: b64(v) for k, v in images.items()}))
SORTIE.write_text(page, encoding="utf-8")
if len(sys.argv) > 8:
  noms = [n for n in images if n.startswith(("i-", "t-"))]; from PIL import ImageDraw
  pl = Image.new("RGB", (8 * 90, (len(noms) + 7) // 8 * 90), (60, 60, 70)); d = ImageDraw.Draw(pl)
  for k, n in enumerate(noms):
    im = images[n].copy(); im = im.resize((im.width * 2, im.height * 2), Image.NEAREST) if im.width < 40 else im; im.thumbnail((80, 70)); pl.paste(im, (k % 8 * 90 + 4, k // 8 * 90 + 16), im); d.text((k % 8 * 90 + 2, k // 8 * 90 + 2), n, fill=(255, 255, 0))
  pl.save(sys.argv[8])

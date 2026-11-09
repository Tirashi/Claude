"""Terres franches : fabrique les images du jeu (seulement les morceaux utilisés, pas les packs entiers).
Sorties dans terres-franches/img/ :
 - decor.png + ../atlas.js (window.TerresAtlas = {nom: [x, y, l, h]}) : découpes Cute SCKR (maisons, champs, moulin, four, arbres, herbe,
   eau, terre, icônes) et Tiny Swords venues de bastion/img (feu, rocher, buisson, chantier, moutons) ;
 - villageois.png (une rangée de 256 px par villageois : marche 576 px, repos 128 px, puis hache, pioche, canne, houe) et ../villageois.js (VILLAGEOIS LPC) ;
 - les pièces d'interface ui-*.png (copiées de bastion/img) ;
 - animaux.png + window.TerresAnimauxAtlas dans ../atlas.js : animaux LPC d'OpenGameArt (chat, chien, biche, cerf, renard, oiseaux, poules, poissons).
Usage : python3 -I outils/terres-maquette/atlas.py <dossier SCKR> <dossier icônes> <dossier villageois LPC> <dossier des animaux>
(mêmes dossiers que fabriquer-7.py ; villageois : sortie de lpc-villageois.py ... 24 11 6)."""
import json, pathlib, re, shutil, sys
from PIL import Image
racine = pathlib.Path(__file__).resolve().parents[2]
SC, ICO, VL, AN = map(pathlib.Path, sys.argv[1:5])
ici, jeu = racine / "outils/terres-maquette", racine / "terres-franches"
(jeu / "img").mkdir(parents=True, exist_ok=True)
src2 = (ici / "fabriquer-2.py").read_text(encoding="utf-8")
TOUTES = eval(re.search(r"DECOUPES = (\{.*?\n\})", src2, re.S).group(1))
# réserves et décor des lieux de récolte (09/11) : bûche, rochers, tonneaux, caisses, paniers, sacs, foin, séchoirs, souches, buissons à baies, abri
TOUTES.update({"buche": ("V2", 683, 482, 30, 14), "rocher-p": ("V2", 681, 545, 27, 19), "gravats": ("V2", 731, 543, 26, 21), "tonneaux": ("V2", 672, 392, 33, 23),
  "abri": ("V2", 385, 386, 95, 66), "tonneau": ("F5", 391, 579, 34, 43), "caisse": ("F3", 536, 678, 33, 41), "caisse-p": ("F5", 441, 584, 30, 32),
  "panier-baies": ("F3", 626, 682, 45, 34), "panier-pommes": ("F3", 626, 734, 45, 34), "panier-legumes": ("F3", 578, 729, 45, 39), "panier-patates": ("F3", 578, 675, 45, 45),
  "sechoir-poisson": ("F5", 581, 399, 86, 70), "sechoir-viande": ("F5", 485, 399, 86, 70), "sac-farine": ("V5", 722, 147, 44, 43), "sacs-grain": ("V5", 144, 724, 48, 42),
  "sac": ("V5", 148, 676, 40, 41), "foin": ("F5", 291, 586, 42, 34), "botte": ("F5", 534, 584, 35, 32), "meule-foin": ("V5", 673, 677, 95, 89),
  "souche-hache": ("V5", 6, 96, 41, 47), "souche": ("V5", 52, 54, 42, 41), "baies-rouges": ("F3", 51, 389, 44, 42), "baies-bleues": ("F3", 3, 485, 44, 45)})
TOUTES.update({"i-bois": ("V1", 96, 528, 48, 48), "i-ble": ("F4", 0, 576, 48, 48), "terre": ("V1", 60, 56, 32, 32), "eau": ("V3", 408, 410, 48, 48), "herbe": ("V1", 235, 387, 48, 48)})
GARDE = ["herbe", "terre", "eau", "pave", "champ-mur", "champ-pousse", "champ-nu", "champ-blond", "chaume1", "chaume2", "chaume3", "chaume4", "chaume5",
  "colomb1", "colomb2", "colomb3", "colomb4", "pierre1", "pierre2", "pierre3", "pierre4", "pierre5", "grange", "hangar", "moulin1", "meule1", "meule2",
  "puits", "puits-couvert", "fontaine", "four", "charrette", "lanterne", "s-arbre1", "s-arbre2", "s-arbre3", "s-arbre4", "s-arbre5", "s-arbre6", "s-jeune", "i-bois", "i-ble",
  "buche", "rocher-p", "gravats", "tonneaux", "abri", "tonneau", "caisse", "caisse-p", "panier-baies", "panier-pommes", "panier-legumes", "panier-patates",
  "sechoir-poisson", "sechoir-viande", "sac-farine", "sacs-grain", "sac", "foin", "botte", "meule-foin", "souche-hache", "souche", "baies-rouges", "baies-bleues"]
def feuille(d, n): return next((SC / d).rglob(f"tile-B-0{n}.png"))
F = {"V1": feuille("village", 1), "V2": feuille("village", 2), "V3": feuille("village", 3), "F4": feuille("farm", 4), "B4": feuille("buildings", 4), "FO": feuille("foret", 1),
  "F3": feuille("farm", 3), "F5": feuille("farm", 5), "V5": feuille("village", 5)}
images, cache = {}, {}
for nom in GARDE:
  f, x, y, l, h, *eff = TOUTES[nom]
  if f not in cache: cache[f] = Image.open(F[f]).convert("RGBA")
  im = cache[f].crop((x, y, x + l, y + h))
  for (a, b, c, d) in eff: im.paste((0, 0, 0, 0), (a - x, b - y, c - x, d - y))
  bb = im.getbbox(); images[nom] = im if nom in ("terre", "eau", "herbe", "pave") else (im.crop(bb) if bb else im)
# icônes des ressources (grilles de 7 ou 8 icônes sur 1024 px)
FI = {"m2": "Medieval_Fantasy_Icons_Pack/**/2.png", "m3": "Medieval_Fantasy_Icons_Pack/**/3.png", "p1": "Pixel_Medieval_Fantasy_Icon_Pack/**/1.png", "p2": "Pixel_Medieval_Fantasy_Icon_Pack/**/2.png", "f1": "Pixel_Food_Icon_Pack/**/1.png", "f3": "Pixel_Food_Icon_Pack/**/3.png"}
GRILLE = {"f3": 8}
ICONES = {"i-pierre": ("m2", 3, 0), "i-tissu": ("m2", 5, 5), "i-laine": ("p2", 6, 4), "i-farine": ("m3", 6, 5), "i-pain": ("f1", 5, 0), "i-poisson": ("f3", 6, 7), "i-baies": ("f3", 0, 6), "i-or": ("p1", 3, 6)}
for nom, (f, rg, c) in ICONES.items():
  if f not in cache: cache[f] = Image.open(next(ICO.glob(FI[f]))).convert("RGBA")
  im = cache[f]; n = im.width / GRILLE.get(f, 7); ic = im.crop((round(c * n), round(rg * n), round(c * n + n), round(rg * n + n))); bb = ic.getbbox()
  ic = ic.crop(bb) if bb else ic; ic.thumbnail((48, 48), Image.LANCZOS); images[nom] = ic
images["i-bois"].thumbnail((48, 48)); images["i-ble"].thumbnail((48, 48))
for nom in ["feu", "rocher", "buisson", "chantier", "mouton-broute", "mouton-marche"]: images[nom] = Image.open(racine / "bastion/img" / (nom + ".png")).convert("RGBA")
# rangement : étagères (les plus hautes d'abord), 2 px entre les morceaux
L = 2048; ordre = sorted(images, key=lambda n: -images[n].height); x = y = hl = 0; pos = {}
for n in ordre:
  w, h = images[n].size
  if x + w > L: x, y, hl = 0, y + hl + 2, 0
  pos[n] = [x, y, w, h]; x += w + 2; hl = max(hl, h)
pl = Image.new("RGBA", (L, y + hl), (0, 0, 0, 0))
for n, (a, b, w, h) in pos.items(): pl.paste(images[n], (a, b))
pl.save(jeu / "img/decor.png", optimize=True)
# animaux LPC (OpenGameArt), rangés en une bande
A = AN / "animals/lpc animals 2022 v1.1/individual creature spritesheets"
ANX = {"chat": AN / "cat_0.png", "chien": AN / "dog_2.png", "biche": A / "deer, light doe.png", "cerf": A / "deer, dark buck.png", "renard": A / "fox, woods.png",
  "oiseau1": AN / "bird_1_brown.png", "oiseau2": AN / "bird_2_black.png", "poule": AN / "chicken_walk.png", "poule-mange": AN / "chicken_eat.png", "poisson": next(AN.rglob("lpc_fish.png"))}
ims = {n: Image.open(c).convert("RGBA") for n, c in ANX.items()}; xa, posA = 0, {}
for n, im in ims.items(): posA[n] = [xa, 0, im.width, im.height]; xa += im.width + 2
pa = Image.new("RGBA", (xa, max(i.height for i in ims.values())), (0, 0, 0, 0))
for n, im in ims.items(): pa.paste(im, (posA[n][0], 0))
pa.save(jeu / "img/animaux.png", optimize=True)
(jeu / "atlas.js").write_text("/* Terres franches : où est chaque image dans img/decor.png et img/animaux.png (fabriqué par outils/terres-maquette/atlas.py). */\nwindow.TerresAtlas = " + json.dumps(pos, separators=(",", ":")) + ";\nwindow.TerresAnimauxAtlas = " + json.dumps(posA, separators=(",", ":")) + ";\n", encoding="utf-8")
# villageois LPC
info = json.load(open(VL / "villageois.json")); enf = sorted(VL.glob("e*-marche.png"))
# une rangée de 256 px par villageois : marche (576), repos (128), puis les outils (OUTILS : x, taille de case, images ; gauche puis droite)
OUTILS = {"hache": [704, 128, 6], "pioche": [1472, 128, 6], "canne": [2240, 128, 6], "houe": [3008, 64, 8]}
pv = Image.new("RGBA", (3520, 256 * (len(info) + (len(enf) + 1) // 2)), (0, 0, 0, 0))
for k, v in enumerate(info):
  i = v["i"]; v.pop("outil", None)
  pv.paste(Image.open(VL / f"v{i}-marche.png"), (0, k * 256)); pv.paste(Image.open(VL / f"v{i}-repos.png"), (576, k * 256))
  for o, (ox, _, _) in OUTILS.items(): pv.paste(Image.open(VL / f"v{i}-{o}.png"), (ox, k * 256))
for k, e in enumerate(enf): pv.paste(Image.open(e), ((k % 2) * 576, (len(info) + k // 2) * 256))
pv.save(jeu / "img/villageois.png", optimize=True)
(jeu / "villageois.js").write_text("/* Terres franches : les villageois LPC de img/villageois.png (rangée k = villageois k ; enfants après). Fabriqué par outils/terres-maquette/atlas.py. */\n"
  "window.TerresVillageois = " + json.dumps({"adultes": info, "enfants": len(enf), "outils": OUTILS}, separators=(",", ":"), ensure_ascii=False) + ";\n", encoding="utf-8")
for n in ["ui-papier", "ui-parchemin", "ui-table", "ui-ruban-rouge", "ui-ruban-bleu", "ui-carre-bleu", "ui-carre-bleu-appui", "ui-barre", "ui-barre-plein", "ui-bouton-bleu", "ui-bouton-bleu-appui", "ui-bouton-rouge", "ui-bouton-rouge-appui"]:
  shutil.copy(racine / "bastion/img" / (n + ".png"), jeu / "img" / (n + ".png"))
print("decor", pl.size, "villageois", pv.size, len(pos), "morceaux")

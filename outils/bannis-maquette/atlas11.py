"""Planche d'assets de la maquette 11 des Bannis (28/11) : découpe The Fan-tasy Tileset (Free) et Dark Dungeon & Castle 16x16.
Usage : python3 -I outils/bannis-maquette/atlas11.py <dossier du pack Fan-tasy (« The Fan-tasy Tileset (Free) »)> <dossier du pack Castle> <sortie.png> <sortie.json>
Les packs se téléchargent avec `python3 -I .claude/skills/packs-itch/itch.py <page> . <dossier>` :
  https://ventilatore.itch.io/the-fantasy-tileset-castles-and-fortresses   et   https://max-m42.itch.io/dark-dungeon-castle-16x16-pixel-art-asset-pack
La planche n'est pas dans le dépôt (licences : pas de redistribution des packs) ; la maquette publiée la contient en base64."""
import sys, json
from PIL import Image
F = sys.argv[1].rstrip("/") + "/Art/"; C = sys.argv[2].rstrip("/") + "/castle_tileset_16x16.png"
atlas = Image.new("RGBA", (400, 620), (0, 0, 0, 0)); R = {}
def put(nom, im, x, y): atlas.alpha_composite(im, (x, y)); R[nom] = [x, y, im.width, im.height]
sol = Image.open(F + "Ground Tileset/Tileset_Ground.png").convert("RGBA"); rt = Image.open(F + "Ground Tileset/Tileset_Road.png").convert("RGBA")
for i, (cx, cy) in enumerate([(0,128),(16,128),(32,128),(48,128),(64,128),(80,128),(0,144),(16,144),(32,144),(48,144),(64,144),(80,144)]): put(f"herbe{i}", sol.crop((cx, cy, cx+16, cy+16)), i*16, 0)
for i, (cx, cy) in enumerate([(0,128),(16,128),(32,128),(0,144),(16,144),(32,144)]): put(f"terre{i}", rt.crop((cx, cy, cx+16, cy+16)), i*16, 16)
tb = Image.open(F + "Trees and Bushes/Atlas/Trees_Bushes.png").convert("RGBA"); x = 0
for i, (bx, by, bw, bh) in enumerate([(0,1,64,63),(81,1,46,63),(152,3,52,92),(224,1,48,93),(291,2,40,29),(353,3,28,28),(352,51,16,28),(288,64,48,16),(17,84,15,10),(49,82,14,14),(82,86,12,9)]):
    put(f"arbre{i}", tb.crop((bx, by, bx+bw, by+bh)), x, 40); x += bw + 4
rk = Image.open(F + "Rocks/Atlas/Rocks.png").convert("RGBA"); x = 0
for i, (bx, by, bw, bh) in enumerate([(3,4,27,26),(49,1,14,13),(83,2,9,11),(112,1,15,29),(146,16,28,13)]):
    put(f"roc{i}", rk.crop((bx, by, bx+bw, by+bh)), x, 140); x += bw + 4
cf = Image.open(F + "Props/Animation/Animation_Campfire.png").convert("RGBA")
for i in range(8): put(f"feu{i}", cf.crop((i*32, 0, i*32+32, 32)), i*34, 176)
put("banniere", Image.open(F + "Props/Banner_Stick_1_Purple.png").convert("RGBA"), 0, 214)
put("lampadaire", Image.open(F + "Props/LampPost_3.png").convert("RGBA"), 30, 214)
put("arche", Image.open(F + "Buildings/CityWall_Gate_1.png").convert("RGBA"), 90, 214)
atlas.alpha_composite(Image.open(C).convert("RGBA").crop((0, 0, 256, 128)), (0, 330)); R["chateau"] = [0, 330, 256, 128]
atlas.save(sys.argv[3]); json.dump(R, open(sys.argv[4], "w"))

"""Politique, maquette de la carte : atlas Tiny Swords (pack acheté, PixelFrog).
Usage : python3 -I atlas_ts.py <dossier du pack Free Pack> <dossier Update 010> <sortie.png> <sortie.json>
Range dans une seule image les morceaux utiles (terrain des 5 couleurs, écume, bâtiments des 5 couleurs, arbres,
moutons, ouvriers, mine, rochers, nuages)."""
import sys, json
from PIL import Image
F, O, SORTIE, JSON = sys.argv[1:5]
COUL = {"bleu": "Blue", "rouge": "Red", "jaune": "Yellow", "violet": "Purple", "noir": "Black"}
morceaux = []
def ajoute(nom, chemin, boite=None):
    im = Image.open(chemin).convert("RGBA")
    if boite: im = im.crop(boite)
    morceaux.append((nom, im))
for i in range(1, 6):
    ajoute(f"terre{i}", f"{F}/Terrain/Tileset/Tilemap_color{i}.png", (0, 0, 256, 256))
ajoute("ecume", f"{F}/Terrain/Tileset/Water Foam.png", (0, 0, 1536, 192))   # 8 images sur 16
for c, en in COUL.items():
    for b, fic in (("chateau", "Castle"), ("maison1", "House1"), ("maison3", "House3"), ("tour", "Tower"), ("caserne", "Barracks"), ("archerie", "Archery"), ("monastere", "Monastery")):
        ajoute(f"{b}-{c}", f"{F}/Buildings/{en} Buildings/{fic}.png")
for c, en in (("bleu", "Blue"), ("rouge", "Red")):
    ajoute(f"pion-or-{c}", f"{F}/Units/{en} Units/Pawn/Pawn_Run Gold.png")
    ajoute(f"pion-bois-{c}", f"{F}/Units/{en} Units/Pawn/Pawn_Run Wood.png")
ajoute("arbre1", f"{F}/Terrain/Resources/Wood/Trees/Tree1.png")
ajoute("arbre3", f"{F}/Terrain/Resources/Wood/Trees/Tree3.png")
ajoute("mouton", f"{F}/Terrain/Resources/Meat/Sheep/Sheep_Grass.png")
ajoute("mine", f"{O}/Resources/Gold Mine/GoldMine_Active.png")
ajoute("or", f"{F}/Terrain/Resources/Gold/Gold Stones/Gold Stone 4.png")
ajoute("rocher", f"{F}/Terrain/Decorations/Rocks/Rock3.png")
ajoute("rocher2", f"{F}/Terrain/Decorations/Rocks/Rock2.png")
ajoute("nuage", f"{F}/Terrain/Decorations/Clouds/Clouds_01.png")
# rangement en étagères, largeur 2048
morceaux.sort(key=lambda m: -m[1].height)
L, x, y, h, pos = 2048, 0, 0, 0, {}
for nom, im in morceaux:
    if im.width > L: raise SystemExit(nom + " trop large")
    if x + im.width > L: x, y, h = 0, y + h + 2, 0
    pos[nom] = [x, y, im.width, im.height]; x += im.width + 2; h = max(h, im.height)
atlas = Image.new("RGBA", (L, y + h))
for nom, im in morceaux: atlas.paste(im, tuple(pos[nom][:2]))
atlas.save(SORTIE, optimize=True)
json.dump(pos, open(JSON, "w"))
print(atlas.size)

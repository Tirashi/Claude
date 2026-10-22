#!/usr/bin/env python3
"""La Dernière Lanterne : fabrique la planche de tuiles du jeu (outil de création, pas lancé par la CI).

    python3 outils/lanterne-tuiles.py <rltiles>

<rltiles> : dossier crawl-ref/source/rltiles de Dungeon Crawl Stone Soup (tuiles CC0), par exemple :
    git clone --depth 1 --filter=blob:none --sparse https://github.com/crawl/crawl.git
    cd crawl && git sparse-checkout set crawl-ref/source/rltiles

Lit outils/lanterne-tuiles.json (tuiles et recettes des personnages) et écrit :
  - lanterne/tuiles.png        toutes les tuiles sur une planche ;
  - lanterne/donnees/tuiles.js window.LANTERNE.tuiles = { nom: [x, y, l, h] }, et pour chaque personnage
                                « nom_c » (le corps), « nom_a » (l'arme seule) et LANTERNE.prises (point de l'arme
                                tenu dans la main, pour la faire tourner pendant les animations).
Les accessoires absents du pack (coffre, table, lit, tonneau, barrière, panneau, toit, parquet) sont dessinés ici.
"""
import sys, os, json
from PIL import Image, ImageDraw

RACINE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
ORDRE = ['cloak', 'base', 'boots', 'legs', 'body', 'gloves', 'hand1', 'hand2', 'hair', 'beard', 'head']


def dessines():
    """Accessoires dessinés au pixel, dans les tons de Dungeon Crawl (contour sombre, 3 nuances)."""
    t = {}
    def neuf(): return Image.new('RGBA', (32, 32))
    BOIS = [(74, 44, 24), (112, 70, 38), (146, 96, 54), (178, 126, 74)]

    # coffre fermé et ouvert
    for ouvert in (False, True):
        im = neuf(); d = ImageDraw.Draw(im)
        d.rectangle([5, 14, 26, 28], fill=BOIS[1], outline=BOIS[0])
        d.rectangle([6, 15, 25, 17], fill=BOIS[2])
        for x in (9, 22): d.rectangle([x, 14, x + 1, 28], fill=(150, 150, 160))
        if ouvert:
            d.rectangle([5, 8, 26, 13], fill=BOIS[0]); d.rectangle([7, 10, 24, 13], fill=(30, 18, 10))
            d.rectangle([9, 12, 22, 14], fill=(236, 196, 70))
        else:
            d.rounded_rectangle([5, 9, 26, 15], 3, fill=BOIS[2], outline=BOIS[0])
            d.rectangle([7, 10, 24, 11], fill=BOIS[3])
            d.rectangle([14, 14, 17, 18], fill=(236, 196, 70), outline=(120, 90, 20))
        t['coffre_ouvert' if ouvert else 'coffre'] = im

    # table
    im = neuf(); d = ImageDraw.Draw(im)
    d.rectangle([3, 12, 28, 18], fill=BOIS[2], outline=BOIS[0]); d.rectangle([4, 13, 27, 14], fill=BOIS[3])
    for x in (5, 25): d.rectangle([x, 18, x + 2, 29], fill=BOIS[1], outline=BOIS[0])
    d.ellipse([12, 9, 18, 13], fill=(220, 220, 210), outline=(90, 80, 70))
    t['table'] = im

    # lit (vu de face, un peu de dessus)
    im = neuf(); d = ImageDraw.Draw(im)
    d.rectangle([3, 6, 28, 12], fill=BOIS[1], outline=BOIS[0])
    d.rectangle([4, 12, 27, 26], fill=(176, 60, 52), outline=(90, 30, 26))
    d.rectangle([4, 12, 27, 15], fill=(236, 230, 214)); d.rectangle([6, 9, 25, 13], fill=(236, 230, 214), outline=(170, 160, 140))
    for y in (18, 22): d.line([5, y, 26, y], fill=(150, 48, 42))
    d.rectangle([3, 26, 28, 29], fill=BOIS[1], outline=BOIS[0])
    t['lit'] = im

    # tonneau
    im = neuf(); d = ImageDraw.Draw(im)
    d.ellipse([7, 8, 24, 13], fill=BOIS[2], outline=BOIS[0])
    d.rectangle([7, 11, 24, 27], fill=BOIS[1], outline=BOIS[0])
    d.ellipse([7, 24, 24, 29], fill=BOIS[1], outline=BOIS[0])
    for y in (14, 23): d.rectangle([7, y, 24, y + 1], fill=(120, 120, 130))
    d.line([11, 12, 11, 27], fill=BOIS[2]); d.line([20, 12, 20, 27], fill=BOIS[0])
    t['tonneau'] = im

    # barrière de bois
    im = neuf(); d = ImageDraw.Draw(im)
    for x in (3, 15, 27):
        d.rectangle([x - 1, 10, x + 2, 29], fill=BOIS[2], outline=BOIS[0])
    for y in (14, 22): d.rectangle([0, y, 31, y + 2], fill=BOIS[3], outline=BOIS[0])
    t['barriere'] = im

    # panneau indicateur
    im = neuf(); d = ImageDraw.Draw(im)
    d.rectangle([14, 16, 17, 30], fill=BOIS[1], outline=BOIS[0])
    d.rectangle([4, 6, 27, 17], fill=BOIS[2], outline=BOIS[0]); d.rectangle([5, 7, 26, 8], fill=BOIS[3])
    for y in (11, 14): d.line([8, y, 23, y], fill=BOIS[0])
    t['panneau'] = im

    # clés (petite et grande)
    for nom, coul, grand in (('cle', (210, 180, 90), False), ('grande_cle', (236, 196, 70), True)):
        im = neuf(); d = ImageDraw.Draw(im); f = (90, 64, 20)
        r = 6 if grand else 4; cx, cy = 11, 12
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=f, fill=coul); d.ellipse([cx - r + 3, cy - r + 3, cx + r - 3, cy + r - 3], fill=(0, 0, 0, 0), outline=f)
        d.rectangle([cx + r - 1, cy - 1, 27, cy + 1], fill=coul, outline=f)
        for x in (21, 25): d.rectangle([x, cy + 1, x + 1, cy + 5 + (2 if grand else 0)], fill=coul, outline=f)
        t[nom] = im
    # nappe de brume (bloque le passage tant que la lanterne ne l'a pas dissipée)
    im = neuf(); d = ImageDraw.Draw(im)
    for (x, y, rx, ry, a) in ((16, 20, 14, 9, 150), (10, 16, 9, 7, 170), (22, 15, 9, 7, 170), (16, 11, 8, 6, 190)):
        d.ellipse([x - rx, y - ry, x + rx, y + ry], fill=(226, 232, 242, a))
    t['nappe'] = im
    # levier
    im = neuf(); d = ImageDraw.Draw(im)
    d.rectangle([8, 22, 23, 28], fill=(110, 110, 120), outline=(50, 50, 60)); d.line([16, 23, 22, 9], fill=(70, 44, 24), width=3); d.ellipse([19, 6, 25, 12], fill=(190, 50, 40), outline=(90, 20, 20))
    t['levier'] = im
    im = neuf(); d = ImageDraw.Draw(im)
    d.rectangle([8, 22, 23, 28], fill=(110, 110, 120), outline=(50, 50, 60)); d.line([16, 23, 10, 9], fill=(70, 44, 24), width=3); d.ellipse([7, 6, 13, 12], fill=(60, 170, 70), outline=(20, 80, 30))
    t['levier_baisse'] = im

    # meubles en volume (decor « meuble ») : une texture par face, 32 px par case pour garder la même finesse
    def planches(w, h, horiz=True, teintes=(1, 2)):
        im = Image.new('RGBA', (w, h), BOIS[teintes[0]]); d = ImageDraw.Draw(im)
        if horiz:
            for i, y in enumerate(range(0, h, 5)):
                d.rectangle([0, y, w - 1, y + 4], fill=BOIS[teintes[i % 2]]); d.line([0, y + 4, w - 1, y + 4], fill=BOIS[0])
                x = (i * 13) % max(1, w); d.point((x, y + 2), fill=BOIS[0])
        else:
            for i, x in enumerate(range(0, w, 6)):
                d.rectangle([x, 0, x + 5, h - 1], fill=BOIS[teintes[i % 2]]); d.line([x + 5, 0, x + 5, h - 1], fill=BOIS[0])
        return im
    t['bois'] = planches(32, 32)
    t['bois_sombre'] = planches(32, 32, teintes=(0, 1))
    ROUGE = [(90, 30, 26), (150, 48, 42), (176, 60, 52), (204, 86, 72)]; DRAP = [(170, 160, 140), (214, 206, 186), (236, 230, 214)]
    # lit vu de dessus (le haut de l'image = la tête du lit) : oreiller, drap rabattu, couverture
    im = Image.new('RGBA', (26, 30), ROUGE[2]); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 25, 9], fill=DRAP[2]); d.rounded_rectangle([3, 1, 22, 7], 2, fill=DRAP[2], outline=DRAP[0]); d.line([5, 6, 20, 6], fill=DRAP[1])
    d.rectangle([0, 9, 25, 12], fill=DRAP[1]); d.line([0, 12, 25, 12], fill=DRAP[0])
    for y in (17, 23): d.line([0, y, 25, y], fill=ROUGE[1])
    d.line([0, 13, 25, 13], fill=ROUGE[3]); d.rectangle([0, 0, 0, 29], fill=ROUGE[1]); d.rectangle([25, 0, 25, 29], fill=ROUGE[1])
    t['lit_dessus'] = im
    # côté et pied du matelas : la couverture qui tombe, le cadre de bois en bas
    for nom, w in (('lit_cote', 30), ('lit_pied', 26)):
        im = Image.new('RGBA', (w, 12), ROUGE[2]); d = ImageDraw.Draw(im)
        d.line([0, 0, w - 1, 0], fill=ROUGE[3]); d.rectangle([0, 6, w - 1, 6], fill=ROUGE[1])
        d.rectangle([0, 7, w - 1, 11], fill=BOIS[1]); d.line([0, 7, w - 1, 7], fill=BOIS[3]); d.line([0, 11, w - 1, 11], fill=BOIS[0])
        t[nom] = im
    # tête de lit : panneau sculpté
    im = planches(28, 22, horiz=False); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 27, 21], outline=BOIS[0]); d.rectangle([0, 0, 27, 2], fill=BOIS[3], outline=BOIS[0])
    d.rounded_rectangle([5, 6, 22, 17], 3, outline=BOIS[0]); d.rounded_rectangle([6, 7, 21, 16], 3, outline=BOIS[3])
    t['lit_tete'] = im
    # dessus de table : planches, une écuelle et un gobelet
    im = planches(29, 22); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 28, 21], outline=BOIS[0])
    d.ellipse([6, 7, 14, 13], fill=(220, 220, 210), outline=(90, 80, 70)); d.ellipse([8, 9, 12, 11], fill=(196, 150, 90))
    d.ellipse([19, 5, 23, 9], fill=(150, 150, 160), outline=(60, 60, 70)); d.point((21, 7), fill=(120, 40, 50))
    t['table_dessus'] = im
    # tonneau : douelles et cercles de fer (tout autour), couvercle vu de dessus
    im = Image.new('RGBA', (56, 20), BOIS[1]); d = ImageDraw.Draw(im)
    for i, x in enumerate(range(0, 56, 4)):
        d.rectangle([x, 0, x + 3, 19], fill=BOIS[1 + (i % 2)]); d.line([x + 3, 0, x + 3, 19], fill=BOIS[0])
    for y in (2, 16): d.rectangle([0, y, 55, y + 1], fill=(120, 120, 130)); d.line([0, y + 1, 55, y + 1], fill=(70, 70, 80))
    t['tonneau_cote'] = im
    im = Image.new('RGBA', (18, 18)); d = ImageDraw.Draw(im)
    d.ellipse([0, 0, 17, 17], fill=(120, 120, 130)); d.ellipse([1, 1, 16, 16], fill=BOIS[2], outline=BOIS[0])
    for x in (6, 11): d.line([x, 2, x, 15], fill=BOIS[1])
    t['tonneau_dessus'] = im

    # tuiles de toit (texture qui se répète)
    im = Image.new('RGBA', (32, 32), (90, 42, 32, 255)); d = ImageDraw.Draw(im)
    nuances = [(126, 58, 42), (116, 52, 38), (136, 66, 47)]
    for y in range(4):
        for x in range(-1, 5):
            X, Y = x * 8 + (y % 2) * 4, y * 8
            d.rectangle([X + 1, Y, X + 7, Y + 6], fill=nuances[(x + y * 3 + 9) % 3])
            d.rectangle([X, Y + 7, X + 7, Y + 7], fill=(94, 38, 24)); d.rectangle([X + 1, Y, X + 7, Y], fill=(154, 80, 56))
    t['toit'] = im
    im = Image.new('RGBA', (32, 32), (60, 64, 74, 255)); d = ImageDraw.Draw(im)
    for y in range(4):
        for x in range(-1, 5):
            X, Y = x * 8 + (y % 2) * 4, y * 8
            d.rectangle([X + 1, Y, X + 7, Y + 6], fill=[(84, 90, 104), (78, 84, 96), (92, 98, 112)][(x + y * 3 + 9) % 3])
            d.rectangle([X, Y + 7, X + 7, Y + 7], fill=(44, 46, 54)); d.rectangle([X + 1, Y, X + 7, Y], fill=(118, 124, 138))
    t['toit_ardoise'] = im

    # parquet
    im = Image.new('RGBA', (32, 32), BOIS[1]); d = ImageDraw.Draw(im)
    for i, y in enumerate(range(0, 32, 8)):
        d.rectangle([0, y, 31, y + 7], fill=BOIS[1 + (i % 2)])
        d.line([0, y + 7, 31, y + 7], fill=BOIS[0])
        x = (i * 11) % 32; d.line([x, y, x, y + 6], fill=BOIS[0]); d.point((x + 3, y + 3), fill=BOIS[0])
    t['parquet'] = im
    return t


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    R = sys.argv[1]
    cfg = json.load(open(os.path.join(RACINE, 'outils', 'lanterne-tuiles.json'), encoding='utf-8'))
    images = {}
    for nom, p in cfg['tuiles'].items():
        im = Image.open(os.path.join(R, p)).convert('RGBA')
        images[nom] = im
    images.update(dessines())
    prises = {}
    for nom, pieces in cfg['persos'].items():
        pieces = sorted(pieces, key=lambda p: ORDRE.index(p.split('/')[0]))
        corps, arme = Image.new('RGBA', (32, 32)), None
        for p in pieces:
            t = Image.open(os.path.join(R, 'player', p + '.png')).convert('RGBA')
            if p.startswith('hand1/'): arme = t
            else: corps.alpha_composite(t)
        images[nom + '_c'] = corps
        if arme:
            images[nom + '_a'] = arme
            px = arme.load(); best = None
            for y in range(32):
                for x in range(32):
                    if px[x, y][3]:
                        e = (x - 16) ** 2 + (y - 20) ** 2
                        if best is None or e < best[0]: best = (e, x, y)
            prises[nom] = [best[1], best[2]]
    # rangement en étagères de 512 px de large
    L = 512; x = y = haut = 0; place = {}
    for nom, im in images.items():
        w, h = im.size
        if x + w > L: x = 0; y += haut; haut = 0
        place[nom] = [x, y, w, h]; x += w; haut = max(haut, h)
    planche = Image.new('RGBA', (L, y + haut))
    for nom, (px_, py_, w, h) in place.items(): planche.alpha_composite(images[nom], (px_, py_))
    planche.save(os.path.join(RACINE, 'lanterne', 'tuiles.png'), optimize=True)
    with open(os.path.join(RACINE, 'lanterne', 'donnees', 'tuiles.js'), 'w', encoding='utf-8') as f:
        f.write('/* Fabriqué par outils/lanterne-tuiles.py (ne pas modifier à la main) : position de chaque tuile\n'
                '   dans lanterne/tuiles.png [x, y, largeur, hauteur], et prise de l\'arme de chaque personnage. */\n')
        f.write('window.LANTERNE = window.LANTERNE || {};\n')
        f.write('LANTERNE.tuiles = {\n' + ',\n'.join(f'  {json.dumps(k)}: {json.dumps(v)}' for k, v in place.items()) + '\n};\n')
        f.write('LANTERNE.prises = ' + json.dumps(prises) + ';\n')
    print(len(place), 'tuiles, planche', L, '×', y + haut)


if __name__ == '__main__':
    main()

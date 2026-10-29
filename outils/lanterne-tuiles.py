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
    # herbe (objet) : un brin de feuilles
    im = neuf(); d = ImageDraw.Draw(im); V = [(30, 80, 30), (60, 140, 50), (110, 190, 80)]
    d.line([16, 28, 16, 10], fill=V[0], width=2)
    for (x, y, sx) in ((16, 22, -1), (16, 18, 1), (16, 14, -1), (16, 10, 1)):
        d.ellipse([x + (sx < 0) * -9, y - 4, x + (sx > 0) * 9, y + 2], fill=V[1], outline=V[0]); d.point((x + sx * 4, y - 1), fill=V[2])
    t['o_herbe2'] = im
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

    PIERRE = [(52, 50, 56), (92, 88, 92), (122, 118, 120), (152, 148, 146)]
    FER = [(50, 50, 60), (110, 110, 120), (160, 160, 170)]
    OR = [(120, 90, 20), (217, 160, 40), (255, 214, 80)]
    # bibliothèque : façade de rayonnages pleins de livres
    im = Image.new('RGBA', (29, 45), BOIS[0]); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 28, 44], fill=BOIS[1], outline=BOIS[0]); d.rectangle([1, 1, 27, 2], fill=BOIS[3])
    couleurs = [(150, 40, 40), (40, 80, 140), (60, 120, 60), (170, 130, 50), (110, 60, 120), (200, 180, 140), (90, 50, 30)]
    for r, y0 in enumerate((4, 18, 32)):
        d.rectangle([2, y0, 26, y0 + 10], fill=(34, 20, 12))
        x, i = 3, r * 3
        while x < 25:
            w = 2 + (i * 7 % 3); h = 7 + (i * 5 % 4); c = couleurs[i % len(couleurs)]
            if (i * 11) % 9 == 4: x += 2; i += 1; continue
            d.rectangle([x, y0 + 10 - h, min(25, x + w - 1), y0 + 9], fill=c)
            d.line([x, y0 + 10 - h, x, y0 + 9], fill=tuple(min(255, v + 40) for v in c))
            x += w; i += 1
        d.rectangle([1, y0 + 11, 27, y0 + 12], fill=BOIS[2]); d.line([1, y0 + 13, 27, y0 + 13], fill=BOIS[0])
    t['etagere_face'] = im
    # livre ouvert (dessus du pupitre)
    im = Image.new('RGBA', (18, 13), BOIS[1]); d = ImageDraw.Draw(im)
    d.rectangle([1, 1, 16, 11], fill=(120, 40, 34)); d.rectangle([2, 2, 8, 10], fill=(236, 226, 196)); d.rectangle([9, 2, 15, 10], fill=(226, 214, 180))
    for y in (4, 6, 8): d.line([3, y, 7, y], fill=(120, 110, 90)); d.line([10, y, 14, y], fill=(120, 110, 90))
    t['livre_ouvert'] = im
    # coffre : façade (bandes de fer et serrure), côté, couvercle, intérieur doré
    im = Image.new('RGBA', (26, 13), BOIS[2]); d = ImageDraw.Draw(im)
    for y in (3, 8): d.line([0, y, 25, y], fill=BOIS[1])
    for x in (3, 21): d.rectangle([x, 0, x + 1, 12], fill=FER[1]); d.line([x + 1, 0, x + 1, 12], fill=FER[0])
    d.rectangle([11, 0, 14, 5], fill=OR[1], outline=OR[0]); d.point((12, 3), fill=(30, 20, 10))
    d.rectangle([0, 0, 25, 12], outline=BOIS[0]); t['coffre_face'] = im
    im = Image.new('RGBA', (19, 13), BOIS[1]); d = ImageDraw.Draw(im)
    for y in (3, 8): d.line([0, y, 18, y], fill=BOIS[0])
    d.rectangle([0, 0, 18, 12], outline=BOIS[0]); t['coffre_cote'] = im
    im = Image.new('RGBA', (26, 19), BOIS[3]); d = ImageDraw.Draw(im)
    for y in (5, 11, 17): d.line([0, y, 25, y], fill=BOIS[2])
    for x in (3, 21): d.rectangle([x, 0, x + 1, 18], fill=FER[1])
    d.rectangle([0, 0, 25, 18], outline=BOIS[0]); t['coffre_couvercle'] = im
    im = Image.new('RGBA', (26, 19), (40, 24, 12)); d = ImageDraw.Draw(im)
    for i, (x, y) in enumerate(((5, 5), (11, 8), (17, 4), (8, 12), (15, 12), (20, 10))):
        d.ellipse([x - 3, y - 2, x + 3, y + 2], fill=OR[1], outline=OR[0]); d.point((x - 1, y - 1), fill=OR[2])
    d.rectangle([0, 0, 25, 18], outline=BOIS[0]); t['coffre_or'] = im
    # panneau indicateur en volume : la planche
    im = Image.new('RGBA', (23, 13), BOIS[2]); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 22, 12], outline=BOIS[0]); d.line([1, 1, 21, 1], fill=BOIS[3])
    for y in (4, 7, 10): d.line([4, y, 18 - (y % 3) * 2, y], fill=BOIS[0])
    t['panneau_face'] = im
    # sarcophage couché : couvercle sculpté (un gisant) et flancs de pierre
    im = Image.new('RGBA', (23, 31), PIERRE[2]); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 22, 30], outline=PIERRE[0]); d.rectangle([1, 1, 21, 29], outline=PIERRE[3])
    d.ellipse([8, 3, 14, 9], fill=PIERRE[3], outline=PIERRE[1])
    d.polygon([(6, 10), (16, 10), (15, 26), (7, 26)], fill=PIERRE[3], outline=PIERRE[1])
    d.line([11, 12, 11, 24], fill=PIERRE[1]); d.line([8, 15, 14, 15], fill=PIERRE[1])
    t['sarco_dessus'] = im
    im = Image.new('RGBA', (32, 14), PIERRE[1]); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 31, 13], outline=PIERRE[0]); d.line([1, 1, 30, 1], fill=PIERRE[3])
    for x in range(3, 30, 6): d.rectangle([x, 4, x + 3, 10], outline=PIERRE[0], fill=PIERRE[2])
    t['pierre_sculptee'] = im
    # fûts de colonne cannelés (blanc pour l'abbaye, sombre pour la crypte)
    for nom, pal in (('colonne_fut', [(150, 146, 140), (200, 196, 188), (232, 228, 220)]), ('colonne_fut_sombre', [(30, 30, 36), (58, 58, 66), (84, 84, 94)])):
        im = Image.new('RGBA', (40, 48), pal[1]); d = ImageDraw.Draw(im)
        for x in range(0, 40, 5): d.line([x, 0, x, 47], fill=pal[0]); d.line([x + 2, 0, x + 2, 47], fill=pal[2])
        t[nom] = im
    # cheminée : pierres et foyer avec ses flammes
    im = Image.new('RGBA', (38, 40), PIERRE[1]); d = ImageDraw.Draw(im)
    for r, y in enumerate(range(0, 40, 6)):
        for x in range(-(r % 2) * 4, 38, 8): d.rectangle([x, y, x + 7, y + 5], fill=PIERRE[1 + (x // 8 + r) % 3], outline=PIERRE[0])
    d.rectangle([0, 10, 37, 13], fill=BOIS[1], outline=BOIS[0])
    d.rectangle([8, 18, 29, 39], fill=(20, 12, 10)); d.pieslice([8, 13, 29, 25], 180, 360, fill=(20, 12, 10))
    for x, h, c in ((12, 12, (230, 90, 30)), (17, 16, (250, 160, 40)), (22, 11, (230, 90, 30)), (15, 8, (255, 230, 120)), (20, 9, (255, 230, 120))):
        d.polygon([(x - 3, 38), (x + 3, 38), (x, 38 - h)], fill=c)
    d.rectangle([10, 36, 27, 38], fill=BOIS[0])
    t['cheminee_face'] = im
    # décorations murales
    im = Image.new('RGBA', (20, 24), BOIS[1]); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 19, 23], outline=BOIS[0]); d.rectangle([2, 2, 17, 19], fill=(150, 200, 236))
    d.rectangle([2, 12, 17, 19], fill=(120, 176, 120)); d.ellipse([11, 4, 15, 8], fill=(255, 244, 200))
    d.line([10, 2, 10, 19], fill=BOIS[1], width=2); d.line([2, 10, 17, 10], fill=BOIS[1], width=2)
    d.rectangle([0, 20, 19, 23], fill=BOIS[2], outline=BOIS[0])
    t['fenetre'] = im
    im = Image.new('RGBA', (22, 22)); d = ImageDraw.Draw(im)
    d.rectangle([5, 2, 16, 19], fill=(150, 200, 236), outline=(60, 50, 40)); d.line([10, 2, 10, 19], fill=(60, 50, 40)); d.line([5, 10, 16, 10], fill=(60, 50, 40))
    for x0 in (0, 17): d.rectangle([x0, 2, x0 + 4, 19], fill=(60, 110, 70), outline=(30, 60, 36)); d.line([x0 + 2, 4, x0 + 2, 17], fill=(40, 80, 50))
    d.rectangle([4, 19, 17, 21], fill=(150, 140, 130), outline=(70, 60, 50)); d.point((8, 18), fill=(220, 80, 90)); d.point((13, 18), fill=(240, 200, 60))
    t['fenetre_ext'] = im
    im = Image.new('RGBA', (16, 32)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 15, 1], fill=BOIS[1])
    d.polygon([(1, 2), (14, 2), (14, 28), (8, 31), (1, 28)], fill=(140, 36, 40), outline=(70, 16, 20))
    d.rectangle([3, 4, 12, 26], outline=OR[1])
    d.rectangle([7, 9, 9, 10], fill=OR[1]); d.rectangle([6, 11, 10, 18], fill=OR[2], outline=OR[0]); d.rectangle([7, 13, 9, 16], fill=(255, 150, 60)); d.rectangle([6, 19, 10, 19], fill=OR[0])
    t['tapisserie'] = im
    im = Image.new('RGBA', (18, 13), OR[1]); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 17, 12], outline=OR[0]); d.rectangle([2, 2, 15, 10], fill=(140, 190, 230))
    d.polygon([(2, 10), (7, 5), (11, 10)], fill=(90, 110, 90)); d.polygon([(8, 10), (12, 6), (15, 10)], fill=(70, 90, 80)); d.rectangle([2, 9, 15, 10], fill=(90, 150, 80))
    t['tableau'] = im
    im = Image.new('RGBA', (17, 17)); d = ImageDraw.Draw(im)
    d.line([1, 1, 15, 15], fill=FER[2], width=2); d.line([15, 1, 1, 15], fill=FER[2], width=2)
    d.polygon([(3, 3), (13, 3), (13, 9), (8, 15), (3, 9)], fill=(40, 70, 140), outline=(20, 30, 60)); d.line([8, 4, 8, 13], fill=OR[1]); d.line([4, 7, 12, 7], fill=OR[1])
    t['bouclier_mur'] = im
    im = Image.new('RGBA', (26, 15)); d = ImageDraw.Draw(im)
    d.rectangle([0, 11, 25, 13], fill=BOIS[2], outline=BOIS[0]); d.line([3, 14, 3, 14], fill=BOIS[0]); d.line([22, 14, 22, 14], fill=BOIS[0])
    d.rectangle([2, 4, 6, 10], fill=(150, 90, 50), outline=(80, 40, 20)); d.ellipse([9, 3, 15, 10], fill=(220, 220, 210), outline=(90, 80, 70))
    d.rectangle([18, 6, 21, 10], fill=(80, 130, 90), outline=(30, 60, 40)); d.rectangle([19, 4, 20, 5], fill=(80, 130, 90))
    t['etagere_murale'] = im
    im = Image.new('RGBA', (8, 18)); d = ImageDraw.Draw(im)
    d.rectangle([3, 7, 4, 17], fill=BOIS[1], outline=BOIS[0]); d.rectangle([1, 6, 6, 8], fill=FER[1], outline=FER[0])
    d.polygon([(1, 6), (6, 6), (4, 0)], fill=(250, 150, 40)); d.polygon([(2, 6), (5, 6), (4, 2)], fill=(255, 230, 120))
    t['torche'] = im
    im = Image.new('RGBA', (26, 45)); d = ImageDraw.Draw(im)
    d.rectangle([0, 10, 25, 44], fill=PIERRE[1]); d.pieslice([0, 0, 25, 22], 180, 360, fill=PIERRE[1])
    d.rectangle([3, 11, 22, 42], fill=(40, 60, 120)); d.pieslice([3, 3, 22, 20], 180, 360, fill=(40, 60, 120))
    vit = [(200, 50, 50), (60, 110, 200), (240, 200, 60), (70, 160, 90), (150, 70, 170)]
    for i, (x, y) in enumerate((x, y) for y in range(8, 42, 5) for x in range(4, 22, 5)):
        if y < 11 and (x < 8 or x > 16): continue
        d.rectangle([x, y, x + 3, y + 3], fill=vit[(i * 3) % 5])
    d.rectangle([11, 12, 14, 30], fill=(255, 230, 140)); d.rectangle([8, 17, 17, 19], fill=(255, 230, 140))
    t['vitrail'] = im
    # tête de la Grande Lanterne : cadre de pierre et vitres allumées
    im = Image.new('RGBA', (16, 14), PIERRE[2]); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 15, 13], outline=PIERRE[0]); d.rectangle([3, 2, 12, 11], fill=(255, 214, 110), outline=PIERRE[0])
    d.rectangle([5, 4, 10, 9], fill=(255, 246, 200)); d.line([7, 2, 7, 11], fill=(200, 140, 50)); d.line([3, 6, 12, 6], fill=(200, 140, 50))
    t['lanterne_face'] = im
    im = Image.new('RGBA', (16, 14), PIERRE[1]); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 15, 13], outline=PIERRE[0]); d.rectangle([3, 2, 12, 11], fill=(34, 36, 44), outline=PIERRE[0])
    d.line([7, 2, 7, 11], fill=PIERRE[0]); d.line([3, 6, 12, 6], fill=PIERRE[0]); d.point((5, 4), fill=(80, 84, 96))
    for (x, y) in ((1, 12), (2, 12), (14, 1), (13, 12), (0, 7)): d.point((x, y), fill=(70, 110, 60))
    t['lanterne_face_eteinte'] = im
    # tapis (32 px par case) : grand tapis de 3 × 2 cases, chemin de tapis rouge, tapis rond de 2 × 2
    def tapis(w, h, fond, motif, bord):
        im = Image.new('RGBA', (w, h), fond); d = ImageDraw.Draw(im)
        d.rectangle([0, 0, w - 1, h - 1], outline=bord); d.rectangle([2, 2, w - 3, h - 3], outline=motif); d.rectangle([3, 3, w - 4, h - 4], outline=bord)
        for y in range(8, h - 6, 8):
            for x in range(8, w - 6, 8):
                d.polygon([(x, y - 3), (x + 3, y), (x, y + 3), (x - 3, y)], outline=motif)
        for x in range(0, w, 3): d.point((x, 0), fill=motif); d.point((x, h - 1), fill=motif)
        return im
    t['tapis'] = tapis(96, 64, (120, 40, 44), (220, 170, 70), (60, 20, 24))
    t['tapis_bleu'] = tapis(64, 64, (40, 60, 110), (210, 200, 160), (20, 30, 60))
    t['tapis_long'] = tapis(32, 192, (150, 30, 36), (230, 190, 80), (80, 16, 20))

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

    # ---------- acte 2 : le marais et le Moulin noyé ----------
    # ponton : planches serrées avec un filet d'eau sombre entre elles, et des clous
    im = Image.new('RGBA', (32, 32), (24, 34, 30, 255)); d = ImageDraw.Draw(im)
    for i, x in enumerate(range(0, 32, 8)):
        d.rectangle([x, 0, x + 6, 31], fill=BOIS[1 + (i % 2)]); d.line([x, 0, x, 31], fill=BOIS[3])
        for y in (5, 26): d.point((x + 3, y), fill=(60, 50, 44))
        d.line([x + 2, (i * 9) % 30, x + 2, (i * 9) % 30 + 3], fill=BOIS[0])
    t['ponton'] = im
    # bronze vert-de-gris (cloches englouties)
    im = Image.new('RGBA', (32, 32), (150, 104, 52, 255)); d = ImageDraw.Draw(im)
    for y in range(32): d.line([0, y, 31, y], fill=(int(120 + 60 * (1 - y / 32)), int(84 + 40 * (1 - y / 32)), 44))
    for (x, y, r) in ((5, 6, 3), (22, 12, 4), (12, 22, 3), (27, 26, 2), (3, 18, 2)): d.ellipse([x - r, y - r, x + r, y + r], fill=(84, 150, 120))
    d.line([0, 27, 31, 27], fill=(92, 60, 28)); d.line([0, 29, 31, 29], fill=(176, 130, 70))
    t['bronze'] = im
    # roue du moulin vue de face : jante, rayons et moyeu
    im = Image.new('RGBA', (64, 64), (34, 30, 26, 255)); d = ImageDraw.Draw(im)
    import math
    d.ellipse([2, 2, 61, 61], outline=BOIS[0], width=6); d.ellipse([4, 4, 59, 59], outline=BOIS[2], width=3)
    for k in range(8):
        a_ = k * math.pi / 4; x2, y2 = 32 + 27 * math.cos(a_), 32 + 27 * math.sin(a_)
        d.line([32, 32, x2, y2], fill=BOIS[1], width=4); d.line([32, 32, x2, y2], fill=BOIS[3], width=1)
    d.ellipse([25, 25, 39, 39], fill=BOIS[0]); d.ellipse([28, 28, 36, 36], fill=(110, 110, 120))
    t['roue_face'] = im
    # grappin : un crochet de fer à trois dents et sa corde enroulée
    im = neuf(); d = ImageDraw.Draw(im); FER = [(50, 54, 62), (120, 126, 138), (190, 196, 206)]; CORDE = [(110, 80, 40), (190, 150, 90)]
    d.ellipse([3, 15, 17, 29], outline=CORDE[0], width=3); d.ellipse([5, 17, 15, 27], outline=CORDE[1], width=1)
    d.line([14, 18, 20, 12], fill=CORDE[0], width=2)
    d.line([20, 12, 26, 6], fill=FER[0], width=3); d.line([20, 12, 26, 6], fill=FER[2], width=1)
    for (x1, y1, x2, y2) in ((26, 6, 29, 11), (26, 6, 21, 3), (26, 6, 30, 2)): d.line([x1, y1, x2, y2], fill=FER[1], width=2)
    t['o_grappin'] = im

    # ---------- acte 3 ----------
    # une page de journal : parchemin, lignes d'écriture et sceau rouge
    im = neuf(); d = ImageDraw.Draw(im)
    d.polygon([(7, 4), (25, 3), (26, 27), (8, 28)], fill=(226, 210, 170), outline=(120, 96, 60))
    for y in range(8, 22, 3): d.line([10, y, 23, y - (y % 2)], fill=(110, 90, 70))
    d.ellipse([17, 20, 24, 27], fill=(170, 30, 30), outline=(100, 14, 14)); d.point((20, 23), fill=(230, 120, 110))
    t['o_page'] = im
    return t


def fissures(im, traits, sombre=(40, 30, 26, 255), clair=(200, 190, 170, 255)):
    """Des fissures dessinées par-dessus une tuile (rocher fendu, mur fissuré)."""
    im = im.copy(); d = ImageDraw.Draw(im)
    for trait in traits:
        d.line(trait, fill=sombre, width=2)
        d.line([(x + 1, y) for (x, y) in trait], fill=clair, width=1)
    return im


def teinte(im, f):
    """Applique f(r, g, b, a) -> (r, g, b, a) à chaque pixel."""
    im = im.copy(); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3]: px[x, y] = f(*px[x, y])
    return im


def brume(r, g, b, a):
    """Statue de brume : gris bleuté, pâle et un peu transparente."""
    v = (r + g + b) // 3
    return (min(255, 120 + v // 2), min(255, 140 + v // 2), min(255, 170 + v // 2), int(a * .82))


def cendre(r, g, b, a):
    """Armure de cendre : gris chaud et terne, un peu éclairci."""
    v = (r * 3 + g * 4 + b * 3) // 10
    return (min(255, 46 + v), min(255, 42 + v), min(255, 40 + int(v * .9)), a)


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
    # la Flamme bleue : la flamme du pack, teintée en bleu
    r_, g_, b_, a_ = images['flamme'].split()
    images['flamme_bleue'] = Image.merge('RGBA', (b_, g_, r_, a_))
    # la Flamme d'or : la même, teintée en jaune
    images['flamme_or'] = teinte(images['flamme'], lambda r, g, b, a: (min(255, r + 30), min(255, g + 70), b // 3, a))
    # acte 3 : rocher fendu et mur fissuré (la Masse de mineur les brise), statues de brume du Hameau caché
    images['rocher_fendu'] = fissures(images['gros_rocher'], [[(16, 6), (14, 12), (17, 17), (13, 24)], [(14, 12), (9, 15)], [(17, 17), (22, 21)]])
    images['mur_fissure'] = fissures(images['mur_mine'], [[(15, 2), (12, 9), (17, 15), (13, 22), (16, 30)], [(12, 9), (6, 12)], [(17, 15), (25, 18)], [(13, 22), (8, 27)]])
    for nom in [n for n in images if n.startswith('statue_brume') or n == 'statue_tiennot']: images[nom] = teinte(images[nom], brume)
    prises = {}
    for nom, pieces in cfg['persos'].items():
        pieces = sorted(pieces, key=lambda p: ORDRE.index(p.split('/')[0]))
        corps, arme = Image.new('RGBA', (32, 32)), None
        for p in pieces:
            t = Image.open(os.path.join(R, 'player', p + '.png')).convert('RGBA')
            if p.startswith('hand1/'): arme = t
            else: corps.alpha_composite(t)
        # les Chevaliers de cendre : des armures vides, couleur de cendre ; le monstre a aussi son image entière
        if nom == 'chevalier':
            corps = teinte(corps, cendre); arme = arme and teinte(arme, cendre)
            entier = corps.copy()
            if arme: entier.alpha_composite(arme)
            images[nom] = entier
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
